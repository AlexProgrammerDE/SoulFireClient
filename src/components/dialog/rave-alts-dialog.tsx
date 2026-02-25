import { invoke } from "@tauri-apps/api/core";
import { saveAs } from "file-saver";
import {
  ChevronDownIcon,
  CrownIcon,
  DownloadIcon,
  HistoryIcon,
  KeyRoundIcon,
  LoaderIcon,
  PackageIcon,
  ShoppingCartIcon,
  TrashIcon,
  WalletIcon,
} from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { AccountTypeCredentials } from "@/generated/soulfire/common.ts";
import { data2blob, isTauri, runAsync } from "@/lib/utils.tsx";

const RAVE_API_BASE = "https://api.ravealts.com";
const API_KEY_STORAGE_KEY = "rave-alts-api-key";
const RECENT_ORDERS_STORAGE_KEY = "rave-alts-recent-orders-v1";
const RECENT_ORDERS_LIMIT = 25;

type StockData = Record<string, number>;

interface KeyInfo {
  status: string;
  credits?: number;
  available_credits?: number;
  username?: string;
  [key: string]: unknown;
}

interface PurchaseAccount {
  email?: string;
  password?: string;
  auth_token?: string;
  cookie?: string;
  filename?: string;
  raw?: string;
}

interface PurchaseResponse {
  status: string;
  accounts?: PurchaseAccount[];
  request_summary?: {
    refunded?: number;
    [key: string]: unknown;
  };
  error_type?: string;
  message?: string;
}

type RecentOrder = {
  id: string;
  createdAt: number;
  accountType: string;
  amount: number;
  accounts: PurchaseAccount[];
};

// Human-readable labels for account types
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  hypixel_unban: "Hypixel Unbanned",
  hypixel_banned: "Hypixel Banned",
  donutsmp_1m: "Donut SMP (1M)",
  donutsmp_50m: "Donut SMP (50M)",
  donutsmp_unbanned: "Donut SMP (Unbanned)",
  unban_cookies: "Unbanned Cookies",
  banned_cookies: "Banned Cookies",
};

const COOKIE_TYPES = new Set(["unban_cookies", "banned_cookies"]);
const DONUT_TYPES = new Set([
  "donutsmp_1m",
  "donutsmp_50m",
  "donutsmp_unbanned",
]);

function getLabel(type: string): string {
  return ACCOUNT_TYPE_LABELS[type] ?? type.split("_").join(" ");
}

function generateOrderId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadRecentOrders(): RecentOrder[] {
  const raw = localStorage.getItem(RECENT_ORDERS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as RecentOrder[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o) =>
        !!o &&
        typeof o.id === "string" &&
        typeof o.createdAt === "number" &&
        typeof o.accountType === "string" &&
        typeof o.amount === "number" &&
        Array.isArray(o.accounts),
    );
  } catch {
    return [];
  }
}

function saveRecentOrders(orders: RecentOrder[]) {
  localStorage.setItem(
    RECENT_ORDERS_STORAGE_KEY,
    JSON.stringify(orders.slice(0, RECENT_ORDERS_LIMIT)),
  );
}

function formatOrderTokens(order: RecentOrder): string {
  return order.accounts
    .map((a) => a.auth_token)
    .filter((t): t is string => typeof t === "string" && t.length > 0)
    .join("\n");
}

function formatOrderCredentials(order: RecentOrder): string {
  return order.accounts
    .map((a) => {
      if (a.email && a.password) return `${a.email}:${a.password}`;
      return null;
    })
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join("\n");
}

function formatOrderCookies(order: RecentOrder): string {
  return order.accounts
    .map((a) => (typeof a.cookie === "string" ? a.cookie.trim() : ""))
    .filter((c) => c.length > 0)
    .join("\n\n");
}

function saveTextFile(content: string, filename: string) {
  if (isTauri()) {
    runAsync(async () => {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");

      const baseName = filename.replace(/[/\\:*?"<>|]/g, "_");
      let selected = await save({
        title: baseName,
        defaultPath: baseName,
        filters: [
          {
            name: "Text File",
            extensions: ["txt", "json"],
          },
        ],
      });

      if (selected) {
        if (!selected.endsWith(".txt") && !selected.endsWith(".json")) {
          selected += filename.endsWith(".json") ? ".json" : ".txt";
        }
        await writeTextFile(selected, content);
      }
    });
  } else {
    saveAs(data2blob(content), filename);
  }
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 20_000,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, { ...init, signal: controller.signal });
    const text = await r.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Unexpected response: ${text.slice(0, 200)}`);
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export default function RaveAltsDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (accounts: string[], service: AccountTypeCredentials) => void;
}) {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(API_KEY_STORAGE_KEY) ?? "",
  );
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [stock, setStock] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [donutExpanded, setDonutExpanded] = useState(false);
  const [validated, setValidated] = useState(false);
  const [amount, setAmount] = useState(1);
  const apiKeyInputId = useId();
  const amountInputId = useId();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(() =>
    loadRecentOrders(),
  );
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchStock = useCallback(async () => {
    try {
      const data = isTauri()
        ? ((await invoke("rave_stock")) as {
            status: string;
            stock?: StockData;
          })
        : await fetchJson<{ status: string; stock?: StockData }>(
            `${RAVE_API_BASE}/alts/stock`,
            undefined,
            15_000,
          );
      if (data.status === "success" && data.stock) {
        setStock(data.stock);
      }
    } catch {
      // Silently fail — stock is optional visual info
    }
  }, []);

  const validateKey = useCallback(async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setLoading(true);
    try {
      const data = isTauri()
        ? ((await invoke("rave_key_info", {
            apiKey: apiKey.trim(),
          })) as KeyInfo)
        : await fetchJson<KeyInfo>(
            `${RAVE_API_BASE}/alts/key-info`,
            {
              headers: { Authorization: `Bearer ${apiKey.trim()}` },
            },
            20_000,
          );
      if (data.status === "error") {
        toast.error(
          (typeof data.message === "string" && data.message) ||
            "Invalid API key",
        );
        setValidated(false);
        return;
      }
      setKeyInfo(data);
      setValidated(true);
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
      toast.success("API key validated!");
    } catch (e) {
      if (!isTauri()) {
        toast.error(
          "Rave Alts doesn't allow browser requests. Use the desktop app.",
        );
      } else if (e instanceof Error && e.message === "Request timed out") {
        toast.error("Rave Alts request timed out");
      } else {
        toast.error("Failed to connect to Rave Alts API");
      }
      setValidated(false);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const purchase = useCallback(async () => {
    if (!selectedType || !validated) return;

    setPurchasing(true);
    try {
      const data: PurchaseResponse = isTauri()
        ? ((await invoke("rave_purchase", {
            apiKey: apiKey.trim(),
            accountType: selectedType,
            amount,
          })) as PurchaseResponse)
        : await fetchJson<PurchaseResponse>(
            `${RAVE_API_BASE}/alts/purchase`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_request: { account_type: selectedType, amount },
              }),
            },
            30_000,
          );

      if (data.status === "error") {
        toast.error(data.message || `Purchase failed: ${data.error_type}`);
        return;
      }

      if (data.status === "refunded") {
        toast.warning("All accounts failed validation — credits refunded.");
        return;
      }

      if (!data.accounts || data.accounts.length === 0) {
        toast.warning("No accounts returned.");
        return;
      }

      const refunded = data.request_summary?.refunded ?? 0;
      if (refunded > 0) {
        toast.info(`${refunded} invalid account(s) auto-refunded.`);
      }

      const newOrder: RecentOrder = {
        id: generateOrderId(),
        createdAt: Date.now(),
        accountType: selectedType,
        amount,
        accounts: data.accounts,
      };
      setRecentOrders((old) => {
        const next = [newOrder, ...old].slice(0, RECENT_ORDERS_LIMIT);
        saveRecentOrders(next);
        return next;
      });

      const tokens = data.accounts
        .map((a) => a.auth_token)
        .filter((t): t is string => typeof t === "string" && t.length > 0);
      const cookies = data.accounts
        .map((a) => (typeof a.cookie === "string" ? a.cookie.trim() : null))
        .filter((c): c is string => typeof c === "string" && c.length > 0);
      const creds = data.accounts
        .map((a) => (a.email && a.password ? `${a.email}:${a.password}` : null))
        .filter((v): v is string => typeof v === "string" && v.length > 0);

      if (tokens.length > 0) {
        if (tokens.length < data.accounts.length) {
          toast.info(
            `${data.accounts.length - tokens.length} account(s) missing token were skipped.`,
          );
        }
        toast.success(`Purchased ${tokens.length} account(s)!`);
        onImport(tokens, AccountTypeCredentials.MICROSOFT_JAVA_ACCESS_TOKEN);
        onClose();
      } else if (cookies.length > 0) {
        if (cookies.length < data.accounts.length) {
          toast.info(
            `${data.accounts.length - cookies.length} account(s) missing cookies were skipped.`,
          );
        }
        toast.success(`Purchased ${cookies.length} account(s)!`);
        onImport(cookies, AccountTypeCredentials.MICROSOFT_JAVA_COOKIES);
        onClose();
      } else if (creds.length > 0) {
        toast.success(`Purchased ${creds.length} account(s)!`);
        onImport(creds, AccountTypeCredentials.MICROSOFT_JAVA_CREDENTIALS);
        onClose();
      } else {
        toast.warning("No usable tokens or credentials returned.");
      }

      // Refresh key info to show updated balance
      try {
        const kd = isTauri()
          ? ((await invoke("rave_key_info", {
              apiKey: apiKey.trim(),
            })) as KeyInfo)
          : await fetchJson<KeyInfo>(`${RAVE_API_BASE}/alts/key-info`, {
              headers: { Authorization: `Bearer ${apiKey.trim()}` },
            });
        if (kd.status !== "error") {
          setKeyInfo(kd);
        }
      } catch {
        // ignore
      }
    } catch (e) {
      if (!isTauri()) {
        toast.error(
          "Rave Alts doesn't allow browser requests. Use the desktop app.",
        );
      } else if (e instanceof Error && e.message === "Request timed out") {
        toast.error("Rave Alts request timed out");
      } else {
        toast.error("Failed to connect to Rave Alts API");
      }
    } finally {
      setPurchasing(false);
    }
  }, [selectedType, validated, apiKey, amount, onImport, onClose]);

  // Fetch stock on mount
  useEffect(() => {
    if (open) {
      fetchStock();
    }
  }, [open, fetchStock]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedType(null);
      setDonutExpanded(false);
      setAmount(1);
      setExpandedOrderId(null);
      setRecentOrders(loadRecentOrders());
      const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY) ?? "";
      setApiKey(savedKey);
      if (savedKey) {
        // Auto-validate saved key
        setLoading(true);
        const p = (
          isTauri()
            ? invoke("rave_key_info", { apiKey: savedKey }).then(
                (r) => r as KeyInfo,
              )
            : fetchJson<KeyInfo>(`${RAVE_API_BASE}/alts/key-info`, {
                headers: { Authorization: `Bearer ${savedKey}` },
              })
        ).catch(() => null);

        p.then((data) => {
          if (data && data.status !== "error") {
            setKeyInfo(data);
            setValidated(true);
          }
        }).finally(() => setLoading(false));
      }
    }
  }, [open]);

  if (!open) return null;

  // Separate stock into categories
  const mainTypes = stock
    ? Object.entries(stock).filter(
        ([key]) => !DONUT_TYPES.has(key) && !COOKIE_TYPES.has(key),
      )
    : [];
  const donutTypes = stock
    ? Object.entries(stock).filter(([key]) => DONUT_TYPES.has(key))
    : [];
  const cookieTypes = stock
    ? Object.entries(stock).filter(([key]) => COOKIE_TYPES.has(key))
    : [];

  return (
    <Credenza open={true} onOpenChange={onClose}>
      <CredenzaContent className="sm:max-w-lg">
        <CredenzaHeader>
          <CredenzaTitle className="flex items-center gap-2">
            <ShoppingCartIcon className="size-5" />
            Rave Alts
          </CredenzaTitle>
          <CredenzaDescription>
            Purchase Minecraft accounts directly from Rave Alts
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="pb-4 md:pb-0">
          <div className="flex flex-col gap-4">
            {/* API Key Input */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor={apiKeyInputId}
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <KeyRoundIcon className="size-3.5" />
                API Key
              </label>
              <div className="flex gap-2">
                <Input
                  id={apiKeyInputId}
                  type="password"
                  placeholder="Enter your Rave Alts API key"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.currentTarget.value);
                    setValidated(false);
                  }}
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  onClick={validateKey}
                  disabled={loading || !apiKey.trim()}
                  className="shrink-0"
                >
                  {loading ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : validated ? (
                    "✓"
                  ) : (
                    "Validate"
                  )}
                </Button>
              </div>
            </div>

            {/* Credits Display */}
            {validated && keyInfo && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <WalletIcon className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Credits:</span>
                <span className="font-semibold">
                  {keyInfo.credits ?? keyInfo.available_credits ?? "N/A"}
                </span>
              </div>
            )}

            <Separator />

            {/* Stock List */}
            <div className="flex flex-col gap-1.5">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <PackageIcon className="size-3.5" />
                Available Accounts
              </h4>

              <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto pr-1">
                {/* Main account types */}
                {mainTypes.map(([type, count]) => (
                  <StockItem
                    key={type}
                    type={type}
                    count={count}
                    selected={selectedType === type}
                    onClick={() =>
                      setSelectedType(selectedType === type ? null : type)
                    }
                    disabled={!validated}
                  />
                ))}

                {/* Donut category (collapsible) */}
                {donutTypes.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setDonutExpanded(!donutExpanded)}
                      className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors mt-1"
                    >
                      <ChevronDownIcon
                        className={`size-3.5 transition-transform ${donutExpanded ? "rotate-0" : "-rotate-90"}`}
                      />
                      <CrownIcon className="size-3.5" />
                      Donut SMP
                    </button>
                    {donutExpanded &&
                      donutTypes.map(([type, count]) => (
                        <StockItem
                          key={type}
                          type={type}
                          count={count}
                          selected={selectedType === type}
                          onClick={() =>
                            setSelectedType(selectedType === type ? null : type)
                          }
                          disabled={!validated}
                          indent
                        />
                      ))}
                  </>
                )}

                {/* Cookie types — Coming Soon */}
                {cookieTypes.length > 0 && (
                  <>
                    <Separator className="my-1" />
                    {cookieTypes.map(([type]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground opacity-60"
                      >
                        <span>{getLabel(type)}</span>
                        <Badge variant="outline" className="text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                    ))}
                  </>
                )}

                {stock === null && (
                  <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                    <LoaderIcon className="size-4 animate-spin mr-2" />
                    Loading stock...
                  </div>
                )}
              </div>
            </div>

            {/* Amount + Purchase */}
            {selectedType && validated && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <label
                    htmlFor={amountInputId}
                    className="text-sm font-medium shrink-0"
                  >
                    Amount:
                  </label>
                  <Input
                    id={amountInputId}
                    type="number"
                    min={1}
                    max={10}
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        Math.max(
                          1,
                          Math.min(10, Number(e.currentTarget.value)),
                        ),
                      )
                    }
                    className="w-20"
                  />
                  <Button
                    onClick={purchase}
                    disabled={purchasing}
                    className="flex-1"
                  >
                    {purchasing ? (
                      <LoaderIcon className="size-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCartIcon className="size-4" />
                        Purchase {getLabel(selectedType)}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <HistoryIcon className="size-3.5" />
                Recent Orders
              </h4>
              <Button
                variant="secondary"
                size="sm"
                disabled={recentOrders.length === 0}
                onClick={() => {
                  localStorage.removeItem(RECENT_ORDERS_STORAGE_KEY);
                  setRecentOrders([]);
                  setExpandedOrderId(null);
                  toast.success("Cleared recent orders");
                }}
              >
                Clear
              </Button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No recent orders yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {recentOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const tokenCount = order.accounts.filter(
                    (a) => typeof a.auth_token === "string" && a.auth_token,
                  ).length;
                  const credCount = order.accounts.filter(
                    (a) => a.email && a.password,
                  ).length;
                  const cookieCount = order.accounts.filter(
                    (a) => typeof a.cookie === "string" && a.cookie,
                  ).length;
                  const createdLabel = new Date(
                    order.createdAt,
                  ).toLocaleString();

                  return (
                    <div
                      key={order.id}
                      className="rounded-lg border bg-muted/20 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOrderId(isExpanded ? null : order.id)
                          }
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {getLabel(order.accountType)} × {order.amount}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {createdLabel}
                            </div>
                          </div>
                          <div className="ml-auto flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {order.accounts.length}
                            </Badge>
                            {tokenCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {tokenCount} token
                              </Badge>
                            )}
                            {credCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {credCount} cred
                              </Badge>
                            )}
                            {cookieCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {cookieCount} cookie
                              </Badge>
                            )}
                          </div>
                        </button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const next = recentOrders.filter(
                              (o) => o.id !== order.id,
                            );
                            setRecentOrders(next);
                            saveRecentOrders(next);
                            if (expandedOrderId === order.id) {
                              setExpandedOrderId(null);
                            }
                            toast.success("Deleted order");
                          }}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const tokens = order.accounts
                                  .map((a) => a.auth_token)
                                  .filter(
                                    (t): t is string =>
                                      typeof t === "string" && t.length > 0,
                                  );
                                if (tokens.length === 0) {
                                  toast.error("No auth_token in this order");
                                  return;
                                }
                                onImport(
                                  tokens,
                                  AccountTypeCredentials.MICROSOFT_JAVA_ACCESS_TOKEN,
                                );
                                onClose();
                              }}
                            >
                              Import tokens
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const cookies = order.accounts
                                  .map((a) =>
                                    typeof a.cookie === "string"
                                      ? a.cookie.trim()
                                      : null,
                                  )
                                  .filter(
                                    (c): c is string =>
                                      typeof c === "string" && c.length > 0,
                                  );
                                if (cookies.length === 0) {
                                  toast.error("No cookies in this order");
                                  return;
                                }
                                onImport(
                                  cookies,
                                  AccountTypeCredentials.MICROSOFT_JAVA_COOKIES,
                                );
                                onClose();
                              }}
                            >
                              Import cookies
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const creds = order.accounts
                                  .map((a) => {
                                    if (a.email && a.password) {
                                      return `${a.email}:${a.password}`;
                                    }
                                    return null;
                                  })
                                  .filter(
                                    (v): v is string =>
                                      typeof v === "string" && v.length > 0,
                                  );
                                if (creds.length === 0) {
                                  toast.error(
                                    "No email:password in this order",
                                  );
                                  return;
                                }
                                onImport(
                                  creds,
                                  AccountTypeCredentials.MICROSOFT_JAVA_CREDENTIALS,
                                );
                                onClose();
                              }}
                            >
                              Import creds
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                saveTextFile(
                                  JSON.stringify(order.accounts, null, 2),
                                  `rave-order-${order.id}.json`,
                                );
                                toast.success("Download started");
                              }}
                            >
                              <DownloadIcon className="size-4" />
                              JSON
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const tokens = formatOrderTokens(order);
                                if (!tokens) {
                                  toast.error("No auth_token in this order");
                                  return;
                                }
                                saveTextFile(
                                  tokens,
                                  `rave-order-${order.id}-tokens.txt`,
                                );
                                toast.success("Download started");
                              }}
                            >
                              <DownloadIcon className="size-4" />
                              Tokens
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const cookies = formatOrderCookies(order);
                                if (!cookies) {
                                  toast.error("No cookies in this order");
                                  return;
                                }
                                saveTextFile(
                                  cookies,
                                  `rave-order-${order.id}-cookies.txt`,
                                );
                                toast.success("Download started");
                              }}
                            >
                              <DownloadIcon className="size-4" />
                              Cookies
                            </Button>
                          </div>

                          <div className="rounded-md bg-background/60 px-2 py-1 text-xs text-muted-foreground whitespace-pre-wrap break-all max-h-[120px] overflow-y-auto">
                            {formatOrderTokens(order) ||
                              formatOrderCookies(order) ||
                              formatOrderCredentials(order) ||
                              JSON.stringify(order.accounts[0] ?? {}, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}

function StockItem({
  type,
  count,
  selected,
  onClick,
  disabled,
  indent,
}: {
  type: string;
  count: number;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || count === 0}
      className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors
        ${indent ? "ml-5" : ""}
        ${selected ? "bg-primary/10 ring-1 ring-primary/30 text-primary" : "hover:bg-muted/50"}
        ${disabled || count === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={selected ? "font-medium" : ""}>{getLabel(type)}</span>
      <Badge
        variant={count > 0 ? "default" : "outline"}
        className="text-xs tabular-nums"
      >
        {count}
      </Badge>
    </button>
  );
}

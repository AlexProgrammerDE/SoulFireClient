import { useAptabase } from "@aptabase/react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, Table as ReactTable } from "@tanstack/react-table";
import {
  BracesIcon,
  ClipboardCopyIcon,
  KeyRoundIcon,
  MonitorSmartphoneIcon,
  PlusIcon,
  RotateCcwKeyIcon,
  SettingsIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TextIcon,
  TrashIcon,
  WifiOffIcon,
} from "lucide-react";
import { use, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { type ExternalToast, toast } from "sonner";
import { ContextMenuPortal } from "@/components/context-menu-portal.tsx";
import {
  MenuItem,
  MenuSeparator,
} from "@/components/context-menu-primitives.tsx";
import { DataTable } from "@/components/data-table/data-table.tsx";
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/data-table/data-table-action-bar.tsx";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header.tsx";
import {
  SelectAllHeader,
  SelectRowHeader,
} from "@/components/data-table/data-table-selects.tsx";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list.tsx";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar.tsx";
import { AccountConfigDialog } from "@/components/dialog/account-config-dialog.tsx";
import { AccountMetadataDialog } from "@/components/dialog/account-metadata-dialog.tsx";
import {
  type DeviceCodeData,
  DeviceCodeDialog,
} from "@/components/dialog/device-code-dialog.tsx";
import GenerateAccountsDialog from "@/components/dialog/generate-accounts-dialog.tsx";
import ImportDialog from "@/components/dialog/import-dialog.tsx";
import RaveAltsDialog from "@/components/dialog/rave-alts-dialog.tsx";
import { ExternalLink } from "@/components/external-link.tsx";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout.tsx";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import {
  type DisabledSettingId,
  InstanceSettingFieldByKey,
  InstanceSettingsPageComponent,
} from "@/components/settings-page.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import type { SettingsPage } from "@/generated/soulfire/common";
import {
  AccountTypeCredentials,
  AccountTypeDeviceCode,
  MinecraftAccountProto_AccountTypeProto,
} from "@/generated/soulfire/common.ts";
import { MCAuthServiceClient } from "@/generated/soulfire/mc-auth.client.ts";
import { useContextMenu } from "@/hooks/use-context-menu.ts";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard.ts";
import { useDataTable } from "@/hooks/use-data-table.ts";
import i18n from "@/lib/i18n";
import { dataTableValidateSearch } from "@/lib/parsers.ts";
import {
  type GenerateAccountsMode,
  getEnumEntries,
  getEnumKeyByValue,
  mapUnionToValue,
  type ProfileAccount,
} from "@/lib/types.ts";
import {
  addInstanceAccount,
  addInstanceAccountsBatch,
  applyGeneratedAccounts,
  removeInstanceAccountsBatch,
  runAsync,
  updateInstanceConfigEntry,
} from "@/lib/utils.tsx";

const ACCOUNT_SETTINGS_DISABLED_IDS: DisabledSettingId[] = [
  { namespace: "account", key: "account-import-concurrency" },
  { namespace: "account", key: "use-proxies-for-account-auth" },
];

function GetAccountsButton() {
  const { t } = useTranslation("instance");

  return (
    <Button variant="outline" size="sm" asChild>
      <ExternalLink href="https://soulfiremc.com/get-accounts?utm_source=soulfire-client&utm_medium=app&utm_campaign=accounts-get">
        <ShoppingCartIcon />
        {t("account.getAccounts")}
      </ExternalLink>
    </Button>
  );
}

function GenerateAccountsButton() {
  const { t } = useTranslation("instance");
  const queryClient = useQueryClient();
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
  });
  const transport = use(TransportContext);
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { trackEvent } = useAptabase();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutateAsync: applyGeneratedAccountsMutation } = useMutation({
    mutationKey: ["instance", "accounts", "generate", instanceInfo.id],
    scope: { id: `instance-accounts-${instanceInfo.id}` },
    mutationFn: async ({
      newAccounts,
      mode,
    }: {
      newAccounts: ProfileAccount[];
      mode: GenerateAccountsMode;
    }) => {
      await applyGeneratedAccounts(
        newAccounts,
        mode,
        profile.accounts,
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });

  const existingUsernames = useMemo(
    () => new Set(profile.accounts.map((a) => a.lastKnownName)),
    [profile.accounts],
  );

  const handleGenerate = useCallback(
    async (newAccounts: ProfileAccount[], mode: GenerateAccountsMode) => {
      void trackEvent("generate_accounts", { count: newAccounts.length, mode });
      await applyGeneratedAccountsMutation({ newAccounts, mode });
    },
    [applyGeneratedAccountsMutation, trackEvent],
  );

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
        <SparklesIcon />
        {t("account.generateAccounts")}
      </Button>
      <GenerateAccountsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGenerate={handleGenerate}
        existingUsernames={existingUsernames}
      />
    </>
  );
}

export const Route = createFileRoute("/_dashboard/instance/$instance/accounts")(
  {
    validateSearch: dataTableValidateSearch,
    component: AccountSettings,
  },
);

function _addAndDeduplicate(
  accounts: ProfileAccount[],
  newAccounts: ProfileAccount[],
) {
  const newAccountsSet = new Set(newAccounts.map((a) => a.profileId));
  return accounts
    .filter((a) => !newAccountsSet.has(a.profileId))
    .concat(newAccounts);
}

const accountTypeToIcon = (
  type: keyof typeof MinecraftAccountProto_AccountTypeProto,
) =>
  mapUnionToValue(type, (key) => {
    switch (key) {
      case "OFFLINE":
        return WifiOffIcon;
      case "MICROSOFT_JAVA_CREDENTIALS":
        return KeyRoundIcon;
      case "MICROSOFT_JAVA_DEVICE_CODE":
        return MonitorSmartphoneIcon;
      case "MICROSOFT_JAVA_REFRESH_TOKEN":
        return RotateCcwKeyIcon;
      case "MICROSOFT_JAVA_ACCESS_TOKEN":
        return KeyRoundIcon;
      case "MICROSOFT_BEDROCK_CREDENTIALS":
        return KeyRoundIcon;
      case "MICROSOFT_BEDROCK_DEVICE_CODE":
        return MonitorSmartphoneIcon;
    }
  });

const accountTypeLabel = (
  type: keyof typeof MinecraftAccountProto_AccountTypeProto,
) =>
  mapUnionToValue(type, (key) => {
    switch (key) {
      case "OFFLINE":
        return "Offline";
      case "MICROSOFT_JAVA_CREDENTIALS":
        return "Java (Credentials)";
      case "MICROSOFT_JAVA_DEVICE_CODE":
        return "Java (Device Code)";
      case "MICROSOFT_JAVA_REFRESH_TOKEN":
        return "Java (Refresh Token)";
      case "MICROSOFT_JAVA_ACCESS_TOKEN":
        return "Java (Session ID)";
      case "MICROSOFT_BEDROCK_CREDENTIALS":
        return "Bedrock (Credentials)";
      case "MICROSOFT_BEDROCK_DEVICE_CODE":
        return "Bedrock (Device Code)";
    }
  });

function getAccessTokenExpiry(account: ProfileAccount): number | null {
  if (
    account.type !==
    MinecraftAccountProto_AccountTypeProto.MICROSOFT_JAVA_ACCESS_TOKEN
  ) {
    return null;
  }

  try {
    if (account.accountData?.oneofKind !== "onlineChainJavaData") return null;

    const authChainMap = account.accountData.onlineChainJavaData.authChain;
    if (!authChainMap || !authChainMap.fields) return null;

    const accessTokenOnlyField = authChainMap.fields._accessTokenOnly;
    const isAccessTokenOnly =
      accessTokenOnlyField?.kind.oneofKind === "boolValue" &&
      accessTokenOnlyField.kind.boolValue;

    if (!isAccessTokenOnly) return null;

    const tokenField = authChainMap.fields._accessToken;
    if (tokenField?.kind.oneofKind !== "stringValue") return null;

    const token = tokenField.kind.stringValue;
    const parts = token.split(".");
    if (parts.length < 2) return null;

    // Decode base64url
    // Replace non-url compatible chars with base64 standard chars
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Pad with standard base64 padding
    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) {
        throw new Error("InvalidLengthError");
      }
      base64 += new Array(5 - pad).join("=");
    }

    const payloadStr = atob(base64);
    const payload = JSON.parse(payloadStr);

    if (payload.exp && typeof payload.exp === "number") {
      return payload.exp * 1000;
    }
  } catch (e) {
    console.error("Failed to parse token expiry", e);
  }

  return null;
}

function ActionsCell({ account }: { account: ProfileAccount }) {
  const { t } = useTranslation("instance");
  const [configOpen, setConfigOpen] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);

  return (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setConfigOpen(true)}
          >
            <SettingsIcon className="size-4" />
            <span className="sr-only">{t("account.config.openButton")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("account.config.openButton")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setMetadataOpen(true)}
          >
            <BracesIcon className="size-4" />
            <span className="sr-only">{t("account.metadata.openButton")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("account.metadata.openButton")}</TooltipContent>
      </Tooltip>
      <AccountConfigDialog
        account={account}
        open={configOpen}
        onOpenChange={setConfigOpen}
      />
      <AccountMetadataDialog
        account={account}
        open={metadataOpen}
        onOpenChange={setMetadataOpen}
      />
    </div>
  );
}

const columns: ColumnDef<ProfileAccount>[] = [
  {
    id: "select",
    header: SelectAllHeader,
    cell: SelectRowHeader,
    size: 32,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "type",
    accessorFn: (row) =>
      getEnumKeyByValue(MinecraftAccountProto_AccountTypeProto, row.type),
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        label={i18n.t("instance:account.table.type")}
      />
    ),
    cell: ({ cell }) => {
      const type =
        cell.getValue<keyof typeof MinecraftAccountProto_AccountTypeProto>();
      const Icon = accountTypeToIcon(type);

      return (
        <Badge variant="outline">
          <Icon />
          {accountTypeLabel(type)}
        </Badge>
      );
    },
    meta: {
      get label() {
        return i18n.t("instance:account.table.type");
      },
      variant: "multiSelect",
      options: getEnumEntries(MinecraftAccountProto_AccountTypeProto).map(
        (type) => {
          return {
            label: accountTypeLabel(type.key),
            value: type.key,
            icon: accountTypeToIcon(type.key),
          };
        },
      ),
    },
    enableColumnFilter: true,
  },
  {
    id: "profileId",
    accessorKey: "profileId",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        label={i18n.t("instance:account.table.profileId")}
      />
    ),
    meta: {
      get label() {
        return i18n.t("instance:account.table.profileId");
      },
      get placeholder() {
        return i18n.t("instance:account.table.searchProfileIds");
      },
      variant: "text",
      icon: TextIcon,
    },
    enableColumnFilter: true,
  },
  {
    id: "lastKnownName",
    accessorKey: "lastKnownName",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        label={i18n.t("instance:account.table.lastKnownName")}
      />
    ),
    meta: {
      get label() {
        return i18n.t("instance:account.table.lastKnownName");
      },
      get placeholder() {
        return i18n.t("instance:account.table.searchLastKnownNames");
      },
      variant: "text",
      icon: TextIcon,
    },
    enableColumnFilter: true,
  },
  {
    id: "tokenStatus",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        label={i18n.t("instance:account.table.tokenStatus")}
      />
    ),
    cell: ({ row }) => {
      const account = row.original;
      const expiryMs = getAccessTokenExpiry(account);

      if (expiryMs === null) {
        return (
          <span className="text-muted-foreground text-sm">
            {i18n.t("instance:account.table.tokenStatusAutoRenews")}
          </span>
        );
      }

      const now = Date.now();
      const isExpired = now >= expiryMs;

      // Ensure consistent language setting via i18n
      let timeString = "";
      try {
        const { formatDistanceToNowStrict } = require("date-fns");
        // We use formatDistanceToNowStrict directly in the render
        timeString = formatDistanceToNowStrict(expiryMs, {
          addSuffix: true,
        });
      } catch (_e) {
        // Fallback or ignore if date-fns is missing/errors
        timeString = new Date(expiryMs).toLocaleString();
      }

      if (isExpired) {
        return (
          <Badge variant="destructive">
            {i18n.t("instance:account.table.tokenStatusExpired")}
          </Badge>
        );
      }

      const hoursLeft = (expiryMs - now) / (1000 * 60 * 60);

      if (hoursLeft < 1) {
        return (
          <Badge
            variant="outline"
            className="border-warning text-warning bg-warning/10"
          >
            {timeString}
          </Badge>
        );
      }

      return (
        <Badge
          variant="outline"
          className="border-success text-success bg-success/10"
        >
          {timeString}
        </Badge>
      );
    },
    meta: {
      get label() {
        return i18n.t("instance:account.table.tokenStatus");
      },
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    id: "actions",
    header: () => (
      <span className="sr-only">
        {i18n.t("instance:account.table.actions")}
      </span>
    ),
    cell: ({ row }) => <ActionsCell account={row.original} />,
    size: 80,
    enableSorting: false,
    enableHiding: false,
  },
];

function AddButton() {
  const { t } = useTranslation("instance");
  const queryClient = useQueryClient();
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
  });
  const transport = use(TransportContext);
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { trackEvent } = useAptabase();
  // Batch add accounts mutation for bulk import
  const { mutateAsync: addAccountsBatchMutation } = useMutation({
    mutationKey: ["instance", "accounts", "add-batch", instanceInfo.id],
    scope: { id: `instance-accounts-${instanceInfo.id}` },
    mutationFn: async (accounts: ProfileAccount[]) => {
      await addInstanceAccountsBatch(
        accounts,
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });
  // Granular account add mutation for single account (device code)
  const { mutateAsync: addAccountMutation } = useMutation({
    mutationKey: ["instance", "accounts", "add", instanceInfo.id],
    scope: { id: `instance-accounts-${instanceInfo.id}` },
    mutationFn: async (account: ProfileAccount) => {
      await addInstanceAccount(
        account,
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });
  const [accountTypeCredentialsSelected, setAccountTypeCredentialsSelected] =
    useState<AccountTypeCredentials | null>(null);
  const [credentialImportMode, setCredentialImportMode] = useState<
    "line" | "cookieJar"
  >("line");
  const [deviceCodeData, setDeviceCodeData] = useState<DeviceCodeData | null>(
    null,
  );
  const [raveAltsOpen, setRaveAltsOpen] = useState(false);

  const textSelectedCallback = useCallback(
    (text: string) => {
      if (accountTypeCredentialsSelected === null) return;

      if (text.length === 0) {
        toast.error(t("account.listImportToast.noAccounts"));
        return;
      }

      setAccountTypeCredentialsSelected(null);
      setCredentialImportMode("line");

      if (transport === null) {
        return;
      }

      const normalizedText = text.replace(/\r\n/g, "\n");
      const textSplit =
        credentialImportMode === "cookieJar"
          ? normalizedText
              .split(/\n\s*\n+/)
              .map((b) => b.trim())
              .filter((b) => b.length > 0)
          : normalizedText
              .split("\n")
              .map((t) => t.trim())
              .filter((t) => t.length > 0);
      const service = new MCAuthServiceClient(transport);

      const abortController = new AbortController();
      const loadingData: ExternalToast = {
        cancel: {
          label: t("common:cancel"),
          onClick: () => {
            abortController.abort();
          },
        },
      };
      const total = textSplit.length;
      let failed = 0;
      let success = 0;
      const accountsToAdd: ProfileAccount[] = [];
      const loadingReport = () =>
        t("account.listImportToast.loading", {
          checked: success + failed,
          total,
          success,
          failed,
        });
      const toastId = toast.loading(loadingReport(), loadingData);
      const { responses } = service.loginCredentials(
        {
          instanceId: instanceInfo.id,
          service: accountTypeCredentialsSelected,
          payload: textSplit,
        },
        {
          abort: abortController.signal,
        },
      );
      responses.onMessage((r) => {
        runAsync(async () => {
          const data = r.data;
          switch (data.oneofKind) {
            case "oneSuccess": {
              if (abortController.signal.aborted) {
                return;
              }

              if (data.oneSuccess.account) {
                accountsToAdd.push(data.oneSuccess.account);
              }
              success++;
              toast.loading(loadingReport(), {
                id: toastId,
                ...loadingData,
              });
              break;
            }
            case "oneFailure": {
              if (abortController.signal.aborted) {
                return;
              }

              failed++;
              toast.loading(loadingReport(), {
                id: toastId,
                ...loadingData,
              });
              break;
            }
            case "end": {
              if (accountsToAdd.length > 0) {
                await addAccountsBatchMutation(accountsToAdd);
              }

              if (accountsToAdd.length === 0) {
                toast.error(t("account.listImportToast.allFailed"), {
                  id: toastId,
                  cancel: undefined,
                });
              } else if (failed > 0) {
                toast.warning(
                  t("account.listImportToast.someFailed", {
                    count: accountsToAdd.length,
                    failed,
                  }),
                  {
                    id: toastId,
                    cancel: undefined,
                  },
                );
              } else {
                toast.success(
                  t("account.listImportToast.noneFailed", {
                    count: accountsToAdd.length,
                  }),
                  {
                    id: toastId,
                    cancel: undefined,
                  },
                );
              }
              break;
            }
          }
        });
      });
      responses.onError((e) => {
        console.error(e);
        toast.error(t("account.listImportToast.error"), {
          id: toastId,
          cancel: undefined,
        });
      });
    },
    [
      accountTypeCredentialsSelected,
      credentialImportMode,
      instanceInfo.id,
      addAccountsBatchMutation,
      t,
      transport,
    ],
  );

  const deviceCodeSelected = useCallback(
    (type: AccountTypeDeviceCode) => {
      if (transport === null) {
        return;
      }

      const abortController = new AbortController();
      const service = new MCAuthServiceClient(transport);
      toast.promise(
        (async () => {
          const promise = new Promise<ProfileAccount>((resolve, reject) => {
            try {
              const { responses } = service.loginDeviceCode(
                {
                  instanceId: instanceInfo.id,
                  service: type,
                },
                {
                  abort: abortController.signal,
                },
              );
              responses.onMessage((message) => {
                if (message.data.oneofKind === "account") {
                  setDeviceCodeData(null);
                  resolve(message.data.account);
                } else if (message.data.oneofKind === "deviceCode") {
                  setDeviceCodeData({
                    userCode: message.data.deviceCode.userCode,
                    verificationUri: message.data.deviceCode.verificationUri,
                    directVerificationUri:
                      message.data.deviceCode.directVerificationUri,
                  });
                }
              });
              responses.onError((e) => {
                console.error(e);
                setDeviceCodeData(null);
                reject(new Error(t("account.unknownError")));
              });
            } catch (e) {
              setDeviceCodeData(null);
              if (e instanceof Error) {
                reject(e);
              } else {
                reject(new Error(t("account.unknownError")));
              }
            }
          });

          const promiseResult = await promise;
          // Using granular add for single account
          await addAccountMutation(promiseResult);
        })(),
        {
          loading: t("account.deviceCodeImportToast.loading"),
          success: t("account.deviceCodeImportToast.success"),
          error: (e) => {
            console.error(e);
            setDeviceCodeData(null);
            return t("account.deviceCodeImportToast.error");
          },
          cancel: {
            label: t("common:cancel"),
            onClick: () => {
              setDeviceCodeData(null);
              abortController.abort();
            },
          },
        },
      );
    },
    [instanceInfo.id, addAccountMutation, t, transport],
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <PlusIcon />
            {t("account.addAccounts")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>
            {t("account.import.javaEdition")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              void trackEvent("import_account_java_offline");
              setCredentialImportMode("line");
              setAccountTypeCredentialsSelected(AccountTypeCredentials.OFFLINE);
            }}
          >
            {t("account.import.offline")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent("import_account_microsoft_java_credentials");
              setCredentialImportMode("line");
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_JAVA_CREDENTIALS,
              );
            }}
          >
            {t("account.import.microsoftCredentials")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent("import_account_microsoft_java_device_code");
              deviceCodeSelected(
                AccountTypeDeviceCode.MICROSOFT_JAVA_DEVICE_CODE,
              );
            }}
          >
            {t("account.import.microsoftDeviceCode")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent("import_account_microsoft_java_refresh_token");
              setCredentialImportMode("line");
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_JAVA_REFRESH_TOKEN,
              );
            }}
          >
            {t("account.import.microsoftRefreshToken")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent("import_account_microsoft_java_cookies");
              setCredentialImportMode("cookieJar");
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_JAVA_COOKIES,
              );
            }}
          >
            {t("account.import.microsoftCookies")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent("import_account_microsoft_java_access_token");
              setCredentialImportMode("line");
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_JAVA_ACCESS_TOKEN,
              );
            }}
          >
            {t("account.import.microsoftAccessToken")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>
            {t("account.import.altProviders")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              void trackEvent("open_rave_alts");
              setRaveAltsOpen(true);
            }}
          >
            {t("account.import.raveAlts")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>
            {t("account.import.bedrockEdition")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              void trackEvent("import_account_bedrock_offline");
              setCredentialImportMode("line");
              setAccountTypeCredentialsSelected(AccountTypeCredentials.OFFLINE);
            }}
          >
            {t("account.import.offline")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent("import_account_microsoft_bedrock_credentials");
              setCredentialImportMode("line");
              setAccountTypeCredentialsSelected(
                AccountTypeCredentials.MICROSOFT_BEDROCK_CREDENTIALS,
              );
            }}
          >
            {t("account.import.microsoftCredentials")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void trackEvent("import_account_microsoft_bedrock_device_code");
              deviceCodeSelected(
                AccountTypeDeviceCode.MICROSOFT_BEDROCK_DEVICE_CODE,
              );
            }}
          >
            {t("account.import.microsoftDeviceCode")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RaveAltsDialog
        open={raveAltsOpen}
        onClose={() => setRaveAltsOpen(false)}
        onImport={(accounts, accountType) => {
          if (transport === null || accounts.length === 0) return;

          const service = new MCAuthServiceClient(transport);
          const abortController = new AbortController();
          const loadingData: ExternalToast = {
            cancel: {
              label: t("common:cancel"),
              onClick: () => abortController.abort(),
            },
          };
          const total = accounts.length;
          let failed = 0;
          let success = 0;
          const accountsToAdd: ProfileAccount[] = [];
          const loadingReport = () =>
            t("account.listImportToast.loading", {
              checked: success + failed,
              total,
              success,
              failed,
            });
          const toastId = toast.loading(loadingReport(), loadingData);
          const { responses } = service.loginCredentials(
            {
              instanceId: instanceInfo.id,
              service: accountType,
              payload: accounts,
            },
            { abort: abortController.signal },
          );
          responses.onMessage((r) => {
            runAsync(async () => {
              const data = r.data;
              switch (data.oneofKind) {
                case "oneSuccess": {
                  if (abortController.signal.aborted) return;
                  if (data.oneSuccess.account)
                    accountsToAdd.push(data.oneSuccess.account);
                  success++;
                  toast.loading(loadingReport(), {
                    id: toastId,
                    ...loadingData,
                  });
                  break;
                }
                case "oneFailure": {
                  if (abortController.signal.aborted) return;
                  failed++;
                  toast.loading(loadingReport(), {
                    id: toastId,
                    ...loadingData,
                  });
                  break;
                }
                case "end": {
                  if (accountsToAdd.length > 0)
                    await addAccountsBatchMutation(accountsToAdd);
                  if (accountsToAdd.length === 0) {
                    toast.error(t("account.listImportToast.allFailed"), {
                      id: toastId,
                      cancel: undefined,
                    });
                  } else if (failed > 0) {
                    toast.warning(
                      t("account.listImportToast.someFailed", {
                        count: accountsToAdd.length,
                        failed,
                      }),
                      { id: toastId, cancel: undefined },
                    );
                  } else {
                    toast.success(
                      t("account.listImportToast.noneFailed", {
                        count: accountsToAdd.length,
                      }),
                      { id: toastId, cancel: undefined },
                    );
                  }
                  break;
                }
              }
            });
          });
          responses.onError((e) => {
            console.error(e);
            toast.error(t("account.unknownError"), {
              id: toastId,
              cancel: undefined,
            });
          });
        }}
      />
      {deviceCodeData !== null && (
        <DeviceCodeDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeviceCodeData(null);
          }}
          deviceCodeData={deviceCodeData}
        />
      )}
      {accountTypeCredentialsSelected !== null && (
        <ImportDialog
          title={t("account.import.dialog.title", {
            type:
              credentialImportMode === "cookieJar"
                ? t("account.import.microsoftCookies")
                : getEnumKeyByValue(
                    AccountTypeCredentials,
                    accountTypeCredentialsSelected,
                  ),
          })}
          description={
            credentialImportMode === "cookieJar"
              ? t("account.import.dialog.descriptionCookies")
              : t("account.import.dialog.description")
          }
          closer={() => {
            setAccountTypeCredentialsSelected(null);
            setCredentialImportMode("line");
          }}
          listener={textSelectedCallback}
          filters={[
            {
              name: "Text File",
              mimeType: "text/plain",
              extensions: ["txt"],
            },
          ]}
          allowMultiple={true}
          textInput={{
            defaultValue: "",
          }}
          extraContent={
            <div className="flex flex-col gap-4">
              <InstanceSettingFieldByKey
                namespace="account"
                settingKey="use-proxies-for-account-auth"
                invalidateQuery={async () => {
                  await queryClient.invalidateQueries({
                    queryKey: instanceInfoQueryOptions.queryKey,
                  });
                }}
                updateConfigEntry={async (namespace, key, value) => {
                  await updateInstanceConfigEntry(
                    namespace,
                    key,
                    value,
                    instanceInfo,
                    transport,
                    queryClient,
                    instanceInfoQueryOptions.queryKey,
                  );
                }}
                config={profile}
              />
              <InstanceSettingFieldByKey
                namespace="account"
                settingKey="account-import-concurrency"
                invalidateQuery={async () => {
                  await queryClient.invalidateQueries({
                    queryKey: instanceInfoQueryOptions.queryKey,
                  });
                }}
                updateConfigEntry={async (namespace, key, value) => {
                  await updateInstanceConfigEntry(
                    namespace,
                    key,
                    value,
                    instanceInfo,
                    transport,
                    queryClient,
                    instanceInfoQueryOptions.queryKey,
                  );
                }}
                config={profile}
              />
            </div>
          }
        />
      )}
    </>
  );
}

function ExtraHeader(props: { table: ReactTable<ProfileAccount> }) {
  const { t } = useTranslation("instance");
  const queryClient = useQueryClient();
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const transport = use(TransportContext);
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { trackEvent } = useAptabase();
  // Batch remove accounts mutation
  const { mutateAsync: removeAccountsBatchMutation } = useMutation({
    mutationKey: ["instance", "accounts", "remove-batch", instanceInfo.id],
    scope: { id: `instance-accounts-${instanceInfo.id}` },
    mutationFn: async (profileIds: string[]) => {
      await removeInstanceAccountsBatch(
        profileIds,
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });

  return (
    <>
      <DataTableActionBarAction
        tooltip={t("account.removeSelectedTooltip")}
        onClick={() => {
          void trackEvent("remove_accounts", {
            count: props.table.getFilteredSelectedRowModel().rows.length,
          });
          const selectedRows = props.table
            .getFilteredSelectedRowModel()
            .rows.map((r) => r.original);

          toast.promise(
            removeAccountsBatchMutation(selectedRows.map((r) => r.profileId)),
            {
              loading: t("account.removeToast.loading"),
              success: t("account.removeToast.success", {
                count: selectedRows.length,
              }),
              error: (e) => {
                console.error(e);
                return t("account.removeToast.error");
              },
            },
          );
        }}
      >
        <TrashIcon />
      </DataTableActionBarAction>
      <DataTableActionBarSelection table={props.table} />
    </>
  );
}

function AccountSettings() {
  const { t } = useTranslation("common");

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: "settings",
          content: t("breadcrumbs.settings"),
        },
      ]}
      pageName={t("pageName.accountSettings")}
      documentationLink="https://soulfiremc.com/docs/usage/accounts?utm_source=soulfire-client&utm_medium=app&utm_campaign=accounts-docs"
    >
      <Content />
    </InstancePageLayout>
  );
}

function Content() {
  const { t } = useTranslation("instance");
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
  });
  const { table } = useDataTable({
    data: profile.accounts,
    columns,
    getRowId: (row) => row.profileId,
  });
  const { contextMenu, handleContextMenu, dismiss, menuRef } =
    useContextMenu<ProfileAccount>();
  const copyToClipboard = useCopyToClipboard();
  const [configAccount, setConfigAccount] = useState<ProfileAccount | null>(
    null,
  );
  const [metadataAccount, setMetadataAccount] = useState<ProfileAccount | null>(
    null,
  );

  return (
    <div className="container flex h-full w-full grow flex-col gap-4">
      <div className="flex flex-col gap-2">
        <InstanceSettingsPageComponent
          data={
            instanceInfo.instanceSettings.find(
              (s) => s.id === "account",
            ) as SettingsPage
          }
          disabledIds={ACCOUNT_SETTINGS_DISABLED_IDS}
        />
      </div>
      <DataTable
        table={table}
        onRowContextMenu={handleContextMenu}
        actionBar={
          <DataTableActionBar table={table}>
            <ExtraHeader table={table} />
          </DataTableActionBar>
        }
      >
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} />
          <GetAccountsButton />
          <GenerateAccountsButton />
          <AddButton />
        </DataTableToolbar>
      </DataTable>
      {contextMenu && (
        <ContextMenuPortal
          x={contextMenu.position.x}
          y={contextMenu.position.y}
          menuRef={menuRef}
        >
          <MenuItem
            onClick={() => {
              setConfigAccount(contextMenu.data);
              dismiss();
            }}
          >
            <SettingsIcon />
            {t("account.contextMenu.openConfig")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMetadataAccount(contextMenu.data);
              dismiss();
            }}
          >
            <BracesIcon />
            {t("account.contextMenu.openMetadata")}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            onClick={() => {
              copyToClipboard(contextMenu.data.profileId);
              dismiss();
            }}
          >
            <ClipboardCopyIcon />
            {t("account.contextMenu.copyProfileId")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              copyToClipboard(contextMenu.data.lastKnownName);
              dismiss();
            }}
          >
            <ClipboardCopyIcon />
            {t("account.contextMenu.copyUsername")}
          </MenuItem>
        </ContextMenuPortal>
      )}
      {configAccount && (
        <AccountConfigDialog
          account={configAccount}
          open={true}
          onOpenChange={(open) => {
            if (!open) setConfigAccount(null);
          }}
        />
      )}
      {metadataAccount && (
        <AccountMetadataDialog
          account={metadataAccount}
          open={true}
          onOpenChange={(open) => {
            if (!open) setMetadataAccount(null);
          }}
        />
      )}
    </div>
  );
}

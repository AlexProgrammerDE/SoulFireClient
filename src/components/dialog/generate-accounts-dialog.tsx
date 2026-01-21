import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { use, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { type ExternalToast, toast } from "sonner";
import { TextInfoButton } from "@/components/info-buttons.tsx";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { AccountTypeCredentials } from "@/generated/soulfire/common.ts";
import { MCAuthServiceClient } from "@/generated/soulfire/mc-auth.client.ts";
import type { ProfileAccount } from "@/lib/types.ts";
import { runAsync } from "@/lib/utils.tsx";

export type GenerateAccountsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (accounts: ProfileAccount[], overrideExisting: boolean) => void;
  existingAccountCount: number;
  existingUsernames: Set<string>;
};

export default function GenerateAccountsDialog({
  open,
  onOpenChange,
  onGenerate,
  existingAccountCount,
  existingUsernames,
}: GenerateAccountsDialogProps) {
  const { t } = useTranslation("instance");
  const transport = use(TransportContext);
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const [amount, setAmount] = useState(1);
  const [nameFormat, setNameFormat] = useState("Bot_%d");
  const [overrideExisting, setOverrideExisting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const amountId = useId();
  const nameFormatId = useId();
  const overrideExistingId = useId();

  const handleGenerate = () => {
    if (amount < 1) {
      toast.error(t("account.generate.invalidAmount"));
      return;
    }

    if (!nameFormat.includes("%d")) {
      toast.error(t("account.generate.missingPlaceholder"));
      return;
    }

    if (transport === null) {
      return;
    }

    setIsGenerating(true);

    // Generate usernames based on format
    const usernames: string[] = [];
    for (let i = 1; i <= amount; i++) {
      const username = nameFormat.replace("%d", String(i));
      // Skip usernames that already exist if not overriding
      if (!overrideExisting && existingUsernames.has(username)) {
        continue;
      }
      usernames.push(username);
    }

    if (usernames.length === 0) {
      setIsGenerating(false);
      toast.error(t("account.generate.allExist"));
      return;
    }

    const service = new MCAuthServiceClient(transport);

    const abortController = new AbortController();
    const loadingData: ExternalToast = {
      cancel: {
        label: t("common:cancel"),
        onClick: () => {
          abortController.abort();
          setIsGenerating(false);
        },
      },
    };
    const total = usernames.length;
    let failed = 0;
    let success = 0;
    const loadingReport = () =>
      t("account.generate.progress", {
        checked: success + failed,
        total,
        success,
        failed,
      });
    const toastId = toast.loading(loadingReport(), loadingData);

    const { responses } = service.loginCredentials(
      {
        instanceId: instanceInfo.id,
        service: AccountTypeCredentials.OFFLINE,
        payload: usernames,
      },
      {
        abort: abortController.signal,
      },
    );

    responses.onMessage((r) => {
      runAsync(async () => {
        const data = r.data;
        switch (data.oneofKind) {
          case "fullList": {
            const accountsToAdd = data.fullList.account;
            setIsGenerating(false);

            if (accountsToAdd.length === 0) {
              toast.error(t("account.generate.allFailed"), {
                id: toastId,
                cancel: undefined,
              });
            } else {
              onGenerate(accountsToAdd, overrideExisting);
              onOpenChange(false);
              toast.success(
                t("account.generate.success", { count: accountsToAdd.length }),
                {
                  id: toastId,
                  cancel: undefined,
                },
              );
            }
            break;
          }
          case "oneSuccess": {
            if (abortController.signal.aborted) {
              return;
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
        }
      });
    });
    responses.onError((e) => {
      console.error(e);
      setIsGenerating(false);
      toast.error(t("account.generate.error"), {
        id: toastId,
        cancel: undefined,
      });
    });
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{t("account.generate.title")}</CredenzaTitle>
          <CredenzaDescription>
            {t("account.generate.description")}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="flex flex-col gap-4 pb-4 md:pb-0">
          <div className="flex flex-col gap-2">
            <Label htmlFor={amountId}>{t("account.generate.amount")}</Label>
            <Input
              id={amountId}
              type="number"
              min={1}
              value={amount}
              onChange={(e) =>
                setAmount(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={nameFormatId}>
              {t("account.generate.nameFormat")}
            </Label>
            <Input
              id={nameFormatId}
              type="text"
              value={nameFormat}
              onChange={(e) => setNameFormat(e.target.value)}
              placeholder="Bot_%d"
            />
            <p className="text-muted-foreground text-sm">
              {t("account.generate.nameFormatHelp")}
            </p>
          </div>
          {existingAccountCount > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id={overrideExistingId}
                checked={overrideExisting}
                onCheckedChange={(checked) =>
                  setOverrideExisting(checked === true)
                }
              />
              <Label htmlFor={overrideExistingId} className="cursor-pointer">
                {t("account.generate.overrideExisting", {
                  count: existingAccountCount,
                })}
              </Label>
              <TextInfoButton
                value={t("account.generate.overrideExistingHelp")}
              />
            </div>
          )}
        </CredenzaBody>
        <CredenzaFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:cancel")}
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating
              ? t("account.generate.generating")
              : t("account.generate.submit")}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}

import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { use, useState } from "react";
import { useTranslation } from "react-i18next";
import { type ExternalToast, toast } from "sonner";
import { z } from "zod";
import { TextInfoButton } from "@/components/info-buttons.tsx";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza.tsx";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { AccountTypeCredentials } from "@/generated/soulfire/common.ts";
import { MCAuthServiceClient } from "@/generated/soulfire/mc-auth.client.ts";
import type { GenerateAccountsMode, ProfileAccount } from "@/lib/types.ts";
import { runAsync } from "@/lib/utils.tsx";

export type GenerateAccountsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (accounts: ProfileAccount[], mode: GenerateAccountsMode) => void;
  existingUsernames: Set<string>;
};

export default function GenerateAccountsDialog({
  open,
  onOpenChange,
  onGenerate,
  existingUsernames,
}: GenerateAccountsDialogProps) {
  const { t } = useTranslation("instance");
  const transport = use(TransportContext);
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const [isGenerating, setIsGenerating] = useState(false);

  const formSchema = z.object({
    amount: z.number().min(1, t("account.generate.invalidAmount")),
    nameFormat: z
      .string()
      .refine(
        (v) => v.includes("%d"),
        t("account.generate.missingPlaceholder"),
      ),
    mode: z.enum(["IGNORE_EXISTING", "REPLACE_EXISTING", "REPLACE_ALL"]),
  });

  const handleGenerate = (value: z.infer<typeof formSchema>) => {
    if (transport === null) {
      return;
    }

    setIsGenerating(true);

    // Generate usernames based on format
    const usernames: string[] = [];
    for (let i = 1; i <= value.amount; i++) {
      const username = value.nameFormat.replace("%d", String(i));
      // Skip usernames that already exist only in IGNORE_EXISTING mode
      if (value.mode === "IGNORE_EXISTING" && existingUsernames.has(username)) {
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
    const accountsToAdd: ProfileAccount[] = [];
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
            setIsGenerating(false);

            if (accountsToAdd.length === 0) {
              toast.error(t("account.generate.allFailed"), {
                id: toastId,
                cancel: undefined,
              });
            } else {
              onGenerate(accountsToAdd, value.mode);
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

  const form = useForm({
    defaultValues: {
      amount: 1,
      nameFormat: "Bot_%d",
      mode: "IGNORE_EXISTING" as GenerateAccountsMode,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      handleGenerate(value);
    },
  });

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <CredenzaHeader>
            <CredenzaTitle>{t("account.generate.title")}</CredenzaTitle>
            <CredenzaDescription>
              {t("account.generate.description")}
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody className="flex flex-col gap-4 pb-4 md:pb-0">
            <form.Field name="amount">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      {t("account.generate.amount")}
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={1}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(
                          Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                        )
                      }
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="nameFormat">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      {t("account.generate.nameFormat")}
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Bot_%d"
                      aria-invalid={isInvalid}
                    />
                    <FieldDescription>
                      {t("account.generate.nameFormatHelp")}
                    </FieldDescription>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="mode">
              {(field) => (
                <Field>
                  <div className="flex items-center gap-2">
                    <FieldLabel htmlFor={field.name}>
                      {t("account.generate.mode")}
                    </FieldLabel>
                    <TextInfoButton value={t("account.generate.modeHelp")} />
                  </div>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) =>
                      field.handleChange(value as GenerateAccountsMode)
                    }
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IGNORE_EXISTING">
                        {t("account.generate.modeIgnoreExisting")}
                      </SelectItem>
                      <SelectItem value="REPLACE_EXISTING">
                        {t("account.generate.modeReplaceExisting")}
                      </SelectItem>
                      <SelectItem value="REPLACE_ALL">
                        {t("account.generate.modeReplaceAll")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
          </CredenzaBody>
          <CredenzaFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common:cancel")}
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating
                ? t("account.generate.generating")
                : t("account.generate.submit")}
            </Button>
          </CredenzaFooter>
        </form>
      </CredenzaContent>
    </Credenza>
  );
}

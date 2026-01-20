import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { PlayIcon, SquareIcon, TimerIcon, TimerOffIcon } from "lucide-react";
import { use, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import GenerateAccountsDialog from "@/components/dialog/generate-accounts-dialog.tsx";
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
import { InstanceServiceClient } from "@/generated/soulfire/instance.client.ts";
import { InstanceState } from "@/generated/soulfire/instance.ts";
import type { ProfileAccount, ProfileRoot } from "@/lib/types.ts";
import { setInstanceConfig } from "@/lib/utils.tsx";

type AccountWarningState = {
  type: "no_accounts" | "not_enough_accounts";
  requiredAmount: number;
  availableAmount: number;
} | null;

function addAndDeduplicate(
  accounts: ProfileAccount[],
  newAccounts: ProfileAccount[],
  overrideExisting: boolean,
) {
  if (overrideExisting) {
    return newAccounts;
  }

  const existingSet = new Set(accounts.map((a) => a.profileId));
  return accounts.concat(
    newAccounts.filter((a) => !existingSet.has(a.profileId)),
  );
}

export default function ControlsMenu() {
  const { t } = useTranslation("common");
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const queryClient = useQueryClient();
  const transport = use(TransportContext);
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
  });
  const [accountWarning, setAccountWarning] =
    useState<AccountWarningState>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [pendingStartAction, setPendingStartAction] = useState(false);

  const { mutateAsync: setProfileMutation } = useMutation({
    mutationFn: async (
      profileTransformer: (prev: ProfileRoot) => ProfileRoot,
    ) => {
      await setInstanceConfig(
        profileTransformer(profile),
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

  const doStartAttack = useCallback(() => {
    if (transport === null) {
      return Promise.resolve();
    }

    const client = new InstanceServiceClient(transport);
    const promise = client
      .changeInstanceState({
        id: instanceInfo.id,
        state: InstanceState.RUNNING,
      })
      .then();
    toast.promise(promise, {
      loading: t("controls.startToast.loading"),
      success: t("controls.startToast.success"),
      error: (e) => {
        console.error(e);
        return t("controls.startToast.error");
      },
    });

    return promise;
  }, [instanceInfo.id, t, transport]);

  const startMutation = useMutation({
    mutationFn: async () => {
      // Get the bot amount from settings (default to 1)
      const botAmount = (profile.settings?.bot?.amount as number) ?? 1;
      const accountCount = profile.accounts.length;

      // Validate: must have accounts
      if (accountCount === 0) {
        setAccountWarning({
          type: "no_accounts",
          requiredAmount: botAmount,
          availableAmount: 0,
        });
        return;
      }

      // Validate: must have enough accounts
      if (accountCount < botAmount) {
        setAccountWarning({
          type: "not_enough_accounts",
          requiredAmount: botAmount,
          availableAmount: accountCount,
        });
        return;
      }

      // All validations passed, start the attack
      return doStartAttack();
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });

  const handleGenerateAccounts = useCallback(
    async (newAccounts: ProfileAccount[], overrideExisting: boolean) => {
      await setProfileMutation((prev) => ({
        ...prev,
        accounts: addAndDeduplicate(
          prev.accounts,
          newAccounts,
          overrideExisting,
        ),
      }));

      // If we were waiting to start an attack, do it now
      if (pendingStartAction) {
        setPendingStartAction(false);
        await doStartAttack();
      }
    },
    [doStartAttack, pendingStartAction, setProfileMutation],
  );

  const handleContinueWithExisting = useCallback(async () => {
    setAccountWarning(null);
    await doStartAttack();
  }, [doStartAttack]);

  const handleGenerateFromWarning = useCallback(() => {
    setAccountWarning(null);
    setPendingStartAction(true);
    setGenerateDialogOpen(true);
  }, []);

  const toggleMutation = useMutation({
    mutationFn: () => {
      if (transport === null) {
        return Promise.resolve() as never;
      }

      const client = new InstanceServiceClient(transport);
      const current = instanceInfo.state;
      const promise = client
        .changeInstanceState({
          id: instanceInfo.id,
          state:
            current === InstanceState.PAUSED
              ? InstanceState.RUNNING
              : InstanceState.PAUSED,
        })
        .then();
      if (current === InstanceState.PAUSED) {
        toast.promise(promise, {
          loading: t("controls.resumeToast.loading"),
          success: t("controls.resumeToast.success"),
          error: (e) => {
            console.error(e);
            return t("controls.resumeToast.error");
          },
        });
      } else {
        toast.promise(promise, {
          loading: t("controls.pauseToast.loading"),
          success: t("controls.pauseToast.success"),
          error: (e) => {
            console.error(e);
            return t("controls.pauseToast.error");
          },
        });
      }

      return promise;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });
  const stopMutation = useMutation({
    mutationFn: () => {
      if (transport === null) {
        return Promise.resolve() as never;
      }

      const client = new InstanceServiceClient(transport);
      const promise = client
        .changeInstanceState({
          id: instanceInfo.id,
          state: InstanceState.STOPPED,
        })
        .then();
      toast.promise(promise, {
        loading: t("controls.stopToast.loading"),
        success: t("controls.stopToast.success"),
        error: (e) => {
          console.error(e);
          return t("controls.stopToast.error");
        },
      });

      return promise;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });

  return (
    <>
      <div className="flex flex-wrap gap-1">
        <Button
          variant="secondary"
          onClick={() => startMutation.mutate()}
          disabled={instanceInfo.state !== InstanceState.STOPPED}
        >
          <PlayIcon />
          {t("controls.start")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => toggleMutation.mutate()}
          disabled={
            instanceInfo.state === InstanceState.STOPPING ||
            instanceInfo.state === InstanceState.STOPPED
          }
        >
          {instanceInfo.state === InstanceState.PAUSED ? (
            <TimerOffIcon />
          ) : (
            <TimerIcon />
          )}
          {instanceInfo.state === InstanceState.PAUSED
            ? t("controls.resume")
            : t("controls.pause")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => stopMutation.mutate()}
          disabled={
            instanceInfo.state === InstanceState.STOPPING ||
            instanceInfo.state === InstanceState.STOPPED
          }
        >
          <SquareIcon />
          {t("controls.stop")}
        </Button>
      </div>

      {/* Account Warning Dialog */}
      <Credenza
        open={accountWarning !== null}
        onOpenChange={(open) => !open && setAccountWarning(null)}
      >
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>
              {accountWarning?.type === "no_accounts"
                ? t("controls.accountWarning.noAccountsTitle")
                : t("controls.accountWarning.notEnoughTitle")}
            </CredenzaTitle>
            <CredenzaDescription>
              {accountWarning?.type === "no_accounts"
                ? t("controls.accountWarning.noAccountsDescription", {
                    required: accountWarning?.requiredAmount ?? 0,
                  })
                : t("controls.accountWarning.notEnoughDescription", {
                    required: accountWarning?.requiredAmount ?? 0,
                    available: accountWarning?.availableAmount ?? 0,
                  })}
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody className="pb-4 md:pb-0">
            <p className="text-muted-foreground text-sm">
              {t("controls.accountWarning.hint")}
            </p>
          </CredenzaBody>
          <CredenzaFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setAccountWarning(null)}>
              {t("cancel")}
            </Button>
            {accountWarning?.type === "not_enough_accounts" && (
              <Button variant="secondary" onClick={handleContinueWithExisting}>
                {t("controls.accountWarning.continueWithExisting", {
                  count: accountWarning.availableAmount,
                })}
              </Button>
            )}
            <Button onClick={handleGenerateFromWarning}>
              {t("controls.accountWarning.generateAccounts")}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      {/* Generate Accounts Dialog */}
      <GenerateAccountsDialog
        open={generateDialogOpen}
        onOpenChange={(open) => {
          setGenerateDialogOpen(open);
          if (!open) {
            setPendingStartAction(false);
          }
        }}
        onGenerate={handleGenerateAccounts}
        existingAccountCount={profile.accounts.length}
      />
    </>
  );
}

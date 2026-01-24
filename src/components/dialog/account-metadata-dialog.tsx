import type { JsonValue } from "@protobuf-ts/runtime";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { Suspense, use, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Value } from "@/generated/google/protobuf/struct.ts";
import type { SettingsNamespace } from "@/generated/soulfire/common.ts";
import { InstanceServiceClient } from "@/generated/soulfire/instance.client.ts";
import type { ProfileAccount } from "@/lib/types.ts";

type MetadataMap = Record<string, Record<string, JsonValue>>;

function convertProtoToMetadataMap(metadata: SettingsNamespace[]): MetadataMap {
  const result: MetadataMap = {};
  for (const namespace of metadata) {
    const entries: Record<string, JsonValue> = {};
    for (const entry of namespace.entries) {
      entries[entry.key] = Value.toJson(entry.value as Value);
    }
    if (Object.keys(entries).length > 0) {
      result[namespace.namespace] = entries;
    }
  }
  return result;
}

type AccountMetadataDialogProps = {
  account: ProfileAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AccountMetadataDialog({
  account,
  open,
  onOpenChange,
}: AccountMetadataDialogProps) {
  const { t } = useTranslation("instance");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {t("account.metadata.title", { name: account.lastKnownName })}
          </DialogTitle>
          <DialogDescription>
            {t("account.metadata.description")}
          </DialogDescription>
        </DialogHeader>
        <Suspense fallback={<DialogSkeleton />}>
          <DialogContentInner account={account} onOpenChange={onOpenChange} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}

function DialogSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-64 w-full" />
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

function DialogContentInner({
  account,
  onOpenChange,
}: {
  account: ProfileAccount;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("instance");
  const transport = use(TransportContext);
  const queryClient = useQueryClient();
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });

  const [jsonText, setJsonText] = useState<string | null>(null);
  const [originalMetadata, setOriginalMetadata] = useState<MetadataMap | null>(
    null,
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load metadata on mount
  const loadMetadata = useCallback(async () => {
    if (transport === null) {
      setJsonText("{}");
      setOriginalMetadata({});
      setIsLoading(false);
      return;
    }

    const instanceService = new InstanceServiceClient(transport);
    try {
      const result = await instanceService.getAccountMetadata({
        instanceId: instanceInfoQueryOptions.queryKey[1] as string,
        accountId: account.profileId,
      });
      const metadata = convertProtoToMetadataMap(result.response.metadata);
      setOriginalMetadata(metadata);
      setJsonText(JSON.stringify(metadata, null, 2));
    } catch (e) {
      console.error("Failed to load metadata:", e);
      setOriginalMetadata({});
      setJsonText("{}");
    }
    setIsLoading(false);
  }, [transport, instanceInfoQueryOptions.queryKey, account.profileId]);

  // Load on first render
  if (isLoading && jsonText === null) {
    loadMetadata();
  }

  // Validate JSON on change
  const handleTextChange = useCallback(
    (text: string) => {
      setJsonText(text);
      try {
        JSON.parse(text);
        setJsonError(null);
      } catch {
        setJsonError(t("account.metadata.invalidJson"));
      }
    },
    [t],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (transport === null || jsonText === null || originalMetadata === null)
        return;

      let newMetadata: MetadataMap;
      try {
        newMetadata = JSON.parse(jsonText);
      } catch {
        throw new Error(t("account.metadata.invalidJson"));
      }

      const instanceId = instanceInfoQueryOptions.queryKey[1] as string;
      const instanceService = new InstanceServiceClient(transport);

      // Calculate diff and apply changes
      const allNamespaces = new Set([
        ...Object.keys(originalMetadata),
        ...Object.keys(newMetadata),
      ]);

      for (const namespace of allNamespaces) {
        const oldEntries = originalMetadata[namespace] ?? {};
        const newEntries = newMetadata[namespace] ?? {};
        const allKeys = new Set([
          ...Object.keys(oldEntries),
          ...Object.keys(newEntries),
        ]);

        for (const key of allKeys) {
          const oldValue = oldEntries[key];
          const newValue = newEntries[key];

          if (newValue === undefined && oldValue !== undefined) {
            // Delete entry
            await instanceService.deleteAccountMetadataEntry({
              instanceId,
              accountId: account.profileId,
              namespace,
              key,
            });
          } else if (
            newValue !== undefined &&
            JSON.stringify(oldValue) !== JSON.stringify(newValue)
          ) {
            // Set/update entry
            await instanceService.setAccountMetadataEntry({
              instanceId,
              accountId: account.profileId,
              namespace,
              key,
              value: Value.fromJson(newValue),
            });
          }
        }
      }
    },
    onSuccess: async () => {
      toast.success(t("account.metadata.saveSuccess"));
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
      onOpenChange(false);
    },
    onError: (e) => {
      console.error(e);
      toast.error(t("account.metadata.saveError"));
    },
  });

  if (isLoading) {
    return <DialogSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        className="h-64 font-mono text-sm"
        value={jsonText ?? ""}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="{}"
      />
      {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t("common:cancel")}
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={jsonError !== null || saveMutation.isPending}
        >
          {saveMutation.isPending ? t("common:saving") : t("common:save")}
        </Button>
      </DialogFooter>
    </div>
  );
}

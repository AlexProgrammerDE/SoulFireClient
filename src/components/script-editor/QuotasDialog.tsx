import { Settings2 } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ScriptQuotas } from "@/generated/soulfire/script";
import { useScriptEditorStore } from "@/stores/script-editor-store";

/**
 * Dialog for configuring script execution quotas.
 * Empty fields use server defaults.
 */
export function QuotasDialog() {
  const quotas = useScriptEditorStore((s) => s.quotas);
  const setQuotas = useScriptEditorStore((s) => s.setQuotas);
  const [open, setOpen] = useState(false);
  const id = useId();

  // Local form state (strings for controlled inputs)
  const [maxExecutionCount, setMaxExecutionCount] = useState("");
  const [maxExecutionTimeMs, setMaxExecutionTimeMs] = useState("");
  const [maxConcurrentTriggers, setMaxConcurrentTriggers] = useState("");
  const [maxStateStoreEntries, setMaxStateStoreEntries] = useState("");
  const [disableTimeouts, setDisableTimeouts] = useState(false);

  // Sync local state when dialog opens
  useEffect(() => {
    if (open) {
      setMaxExecutionCount(quotas?.maxExecutionCount ?? "");
      setMaxExecutionTimeMs(quotas?.maxExecutionTimeMs ?? "");
      setMaxConcurrentTriggers(
        quotas?.maxConcurrentTriggers != null
          ? String(quotas.maxConcurrentTriggers)
          : "",
      );
      setMaxStateStoreEntries(quotas?.maxStateStoreEntries ?? "");
      setDisableTimeouts(quotas?.disableTimeouts ?? false);
    }
  }, [open, quotas]);

  const handleSave = useCallback(() => {
    const hasAnyValue =
      maxExecutionCount ||
      maxExecutionTimeMs ||
      maxConcurrentTriggers ||
      maxStateStoreEntries ||
      disableTimeouts;

    if (!hasAnyValue) {
      setQuotas(undefined);
    } else {
      const newQuotas: ScriptQuotas = {
        disableTimeouts,
        ...(maxExecutionCount && { maxExecutionCount }),
        ...(maxExecutionTimeMs && { maxExecutionTimeMs }),
        ...(maxConcurrentTriggers && {
          maxConcurrentTriggers: Number(maxConcurrentTriggers),
        }),
        ...(maxStateStoreEntries && { maxStateStoreEntries }),
      };
      setQuotas(newQuotas);
    }
    setOpen(false);
  }, [
    maxExecutionCount,
    maxExecutionTimeMs,
    maxConcurrentTriggers,
    maxStateStoreEntries,
    disableTimeouts,
    setQuotas,
  ]);

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button variant="ghost" size="sm" title="Script Quotas">
          <Settings2 className="h-4 w-4" />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Script Quotas</CredenzaTitle>
          <CredenzaDescription>
            Configure resource limits for this script. Empty fields use server
            defaults.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${id}-maxExecutionCount`}>
              Max Execution Count
            </Label>
            <Input
              id={`${id}-maxExecutionCount`}
              type="number"
              placeholder="100000"
              value={maxExecutionCount}
              onChange={(e) => setMaxExecutionCount(e.target.value)}
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Maximum node executions per trigger invocation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-maxExecutionTimeMs`}>
              Max Execution Time (ms)
            </Label>
            <Input
              id={`${id}-maxExecutionTimeMs`}
              type="number"
              placeholder="30000"
              value={maxExecutionTimeMs}
              onChange={(e) => setMaxExecutionTimeMs(e.target.value)}
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Maximum wall-clock time per trigger execution
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-maxConcurrentTriggers`}>
              Max Concurrent Triggers
            </Label>
            <Input
              id={`${id}-maxConcurrentTriggers`}
              type="number"
              placeholder="1"
              value={maxConcurrentTriggers}
              onChange={(e) => setMaxConcurrentTriggers(e.target.value)}
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Maximum concurrent trigger invocations
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-maxStateStoreEntries`}>
              Max State Store Entries
            </Label>
            <Input
              id={`${id}-maxStateStoreEntries`}
              type="number"
              placeholder="Unlimited"
              value={maxStateStoreEntries}
              onChange={(e) => setMaxStateStoreEntries(e.target.value)}
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Maximum entries in the script state store
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={`${id}-disableTimeouts`}>Disable Timeouts</Label>
              <p className="text-xs text-muted-foreground">
                Disables per-node and data edge timeouts
              </p>
            </div>
            <Switch
              id={`${id}-disableTimeouts`}
              checked={disableTimeouts}
              onCheckedChange={setDisableTimeouts}
            />
          </div>

          <Button className="w-full" onClick={handleSave}>
            Save Quotas
          </Button>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}

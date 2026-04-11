import { FlaskConical } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { getNodeDefinition } from "@/components/script-editor/nodes/types";
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useScriptEditorStore } from "@/stores/script-editor-store";

/**
 * Dialog for dry-running a script from a selected trigger with mock inputs.
 * Requires the DryRunScript RPC to be available after proto regeneration.
 */
export function DryRunDialog() {
  const nodes = useScriptEditorStore((s) => s.nodes);
  const [selectedTrigger, setSelectedTrigger] = useState<string>("");
  const [mockInputs, setMockInputs] = useState<Record<string, string>>({});

  // Find all trigger nodes
  const triggerNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (!node.type) return false;
      const def = getNodeDefinition(node.type);
      return def?.isTrigger ?? false;
    });
  }, [nodes]);

  // Get output ports for the selected trigger
  const triggerOutputs = useMemo(() => {
    if (!selectedTrigger) return [];
    const node = nodes.find((n) => n.id === selectedTrigger);
    if (!node?.type) return [];
    const def = getNodeDefinition(node.type);
    if (!def) return [];
    return def.outputs.filter((p) => p.type !== "execution");
  }, [selectedTrigger, nodes]);

  const handleInputChange = useCallback((portId: string, value: string) => {
    setMockInputs((prev) => ({ ...prev, [portId]: value }));
  }, []);

  if (triggerNodes.length === 0) return null;

  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button variant="ghost" size="sm" title="Dry Run">
          <FlaskConical className="h-4 w-4" />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Dry Run Script</CredenzaTitle>
          <CredenzaDescription>
            Run a script from a selected trigger with mock inputs.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Trigger Node</FieldLabel>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedTrigger}
              onChange={(e) => {
                setSelectedTrigger(e.target.value);
                setMockInputs({});
              }}
            >
              <option value="">Select a trigger...</option>
              {triggerNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {(node.data as { label?: string })?.label ??
                    node.type ??
                    node.id}
                </option>
              ))}
            </select>
            <FieldDescription>
              Pick the trigger node to execute with mock input values.
            </FieldDescription>
          </Field>

          {triggerOutputs.length > 0 && (
            <Field>
              <FieldLabel>Mock Inputs</FieldLabel>
              {triggerOutputs.map((port) => (
                <Field
                  key={port.id}
                  orientation="horizontal"
                  className="items-center gap-2"
                >
                  <FieldLabel className="min-w-[100px] text-xs text-muted-foreground">
                    {port.label}
                  </FieldLabel>
                  <Input
                    placeholder={`${port.type} value`}
                    value={mockInputs[port.id] ?? ""}
                    onChange={(e) => handleInputChange(port.id, e.target.value)}
                    className="h-8 text-sm"
                  />
                </Field>
              ))}
            </Field>
          )}

          <Button
            className="w-full"
            disabled={!selectedTrigger}
            onClick={() => {
              // Dry run will be wired up after proto regeneration
              console.log("Dry run:", selectedTrigger, mockInputs);
            }}
          >
            <FlaskConical className="h-4 w-4 mr-2" />
            Start Dry Run
          </Button>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}

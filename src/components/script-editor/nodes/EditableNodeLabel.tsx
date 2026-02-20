import { memo, useCallback, useEffect, useState } from "react";
import {
  Editable,
  EditableArea,
  EditableInput,
  EditablePreview,
} from "@/components/ui/editable";
import { cn } from "@/lib/utils";
import { useNodeEditing } from "../NodeEditingContext";

interface EditableNodeLabelProps {
  nodeId: string;
  value: string;
  onSubmit: (value: string) => void;
  className?: string;
}

/**
 * Shared inline-editable label for node titles.
 * Supports double-click to edit, Enter to submit, Escape to cancel.
 * Also responds to the renaming node ID from NodeEditingContext (F2 / context menu).
 */
function EditableNodeLabelComponent({
  nodeId,
  value,
  onSubmit,
  className,
}: EditableNodeLabelProps) {
  const { renamingNodeId, clearRenamingNodeId } = useNodeEditing();
  const [editing, setEditing] = useState(false);

  // Trigger edit mode when this node is targeted for rename (F2 / context menu)
  useEffect(() => {
    if (renamingNodeId === nodeId) {
      setEditing(true);
      clearRenamingNodeId();
    }
  }, [renamingNodeId, nodeId, clearRenamingNodeId]);

  const handleEditingChange = useCallback((isEditing: boolean) => {
    setEditing(isEditing);
  }, []);

  const handleSubmit = useCallback(
    (newValue: string) => {
      const trimmed = newValue.trim();
      if (trimmed && trimmed !== value) {
        onSubmit(trimmed);
      }
      setEditing(false);
    },
    [value, onSubmit],
  );

  return (
    <Editable
      value={value}
      editing={editing}
      onEditingChange={handleEditingChange}
      onSubmit={handleSubmit}
      triggerMode="dblclick"
      autosize
      className="min-w-0 flex-row items-center gap-0"
    >
      <EditableArea className="nodrag nopan min-w-0">
        <EditablePreview
          className={cn(
            "cursor-text truncate border-none px-0 py-0",
            className,
          )}
        />
        <EditableInput
          className={cn(
            "border-none bg-transparent px-0 py-0 shadow-none focus-visible:ring-0",
            className,
          )}
        />
      </EditableArea>
    </Editable>
  );
}

export const EditableNodeLabel = memo(EditableNodeLabelComponent);

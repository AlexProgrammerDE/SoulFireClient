import { useTranslation } from "react-i18next";
import type { NodeDefinition } from "./nodes/types";

/**
 * Hook that provides translation functions for script editor nodes and categories.
 * Uses translation keys from instance.json under scripts.editor
 */
export function useNodeTranslations() {
  const { t } = useTranslation("instance");

  /**
   * Get the translated label for a node type.
   * Falls back to the node's label property if translation is missing.
   */
  const getNodeLabel = (node: NodeDefinition): string => {
    const key = `scripts.editor.nodes.${node.type}.label`;
    const translated = t(key);
    // If translation key returns the key itself, use fallback
    return translated === key ? node.label : translated;
  };

  /**
   * Get the translated description for a node type.
   */
  const getNodeDescription = (node: NodeDefinition): string => {
    return t(`scripts.editor.nodes.${node.type}.description`, "");
  };

  /**
   * Get the translated name for a node category.
   */
  const getCategoryName = (category: string): string => {
    return t(`scripts.editor.palette.categories.${category}`);
  };

  /**
   * Get the translated label for an inspector field.
   */
  const getFieldLabel = (fieldKey: string): string => {
    return t(`scripts.editor.fields.${fieldKey}`, fieldKey);
  };

  /**
   * Get translated port label.
   * Port labels use a simplified key structure.
   */
  const getPortLabel = (portId: string, fallback: string): string => {
    // Extract the port name from IDs like "exec-in", "number-a"
    const parts = portId.split("-");
    const portName = parts.length > 1 ? parts.slice(1).join("-") : portId;

    // Try specific port key first
    const specificKey = `scripts.editor.ports.${portName}`;
    const translated = t(specificKey);
    return translated === specificKey ? fallback : translated;
  };

  return {
    getNodeLabel,
    getNodeDescription,
    getCategoryName,
    getFieldLabel,
    getPortLabel,
    t,
  };
}

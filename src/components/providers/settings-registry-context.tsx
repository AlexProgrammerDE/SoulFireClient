import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useMemo } from "react";
import type {
  SettingsDefinition,
  SettingsEntryIdentifier,
} from "@/generated/soulfire/common.ts";

export type SettingsRegistry = {
  definitions: SettingsDefinition[];
  getDefinition: (
    id: SettingsEntryIdentifier | undefined,
  ) => SettingsDefinition | undefined;
};

export function useSettingsRegistry(): SettingsRegistry {
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  return useMemo(
    () => createSettingsRegistry(instanceInfo.settingsDefinitions),
    [instanceInfo.settingsDefinitions],
  );
}

export function useSettingsDefinition(
  id: SettingsEntryIdentifier | undefined,
): SettingsDefinition | undefined {
  const registry = useSettingsRegistry();
  return useMemo(() => registry.getDefinition(id), [registry, id]);
}

export function createSettingsRegistry(
  definitions: SettingsDefinition[],
): SettingsRegistry {
  // Create a map for O(1) lookup
  const definitionMap = new Map<string, SettingsDefinition>();
  for (const def of definitions) {
    if (def.id) {
      const key = `${def.id.namespace}:${def.id.key}`;
      definitionMap.set(key, def);
    }
  }

  return {
    definitions,
    getDefinition: (id) => {
      if (!id) return undefined;
      return definitionMap.get(`${id.namespace}:${id.key}`);
    },
  };
}

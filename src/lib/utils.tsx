import type { JsonValue } from "@protobuf-ts/runtime";
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { open as shellOpen } from "@tauri-apps/plugin-shell";
import { type ClassValue, clsx } from "clsx";
import type { FlagComponent } from "country-flag-icons/react/1x1";
import * as Flags from "country-flag-icons/react/3x2";
import { sha256 } from "js-sha256";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { Value } from "@/generated/google/protobuf/struct.ts";
import type { Timestamp } from "@/generated/google/protobuf/timestamp.ts";
import { BotServiceClient } from "@/generated/soulfire/bot.client.ts";
import type { BotInfoResponse } from "@/generated/soulfire/bot.ts";
import { ClientServiceClient } from "@/generated/soulfire/client.client.ts";
import type { ClientDataResponse } from "@/generated/soulfire/client.ts";
import type {
  GlobalPermission,
  InstancePermission,
  MinecraftAccountProto,
  ProxyProto,
  SettingsDefinition,
  SettingsEntryIdentifier,
} from "@/generated/soulfire/common.ts";
import { InstanceServiceClient } from "@/generated/soulfire/instance.client.ts";
import type {
  InstanceInfo,
  InstanceListResponse,
  InstanceListResponse_Instance,
} from "@/generated/soulfire/instance.ts";
import { ServerServiceClient } from "@/generated/soulfire/server.client.ts";
import {
  type BaseSettings,
  convertToInstanceProto,
  convertToServerProto,
  type GenerateAccountsMode,
  type InstanceInfoQueryData,
  type ProfileAccount,
  type ProfileProxy,
  type ProfileRoot,
  type ServerInfoQueryData,
} from "@/lib/types.ts";

export const ROOT_USER_ID = "00000000-0000-0000-0000-000000000000";
const LOCAL_STORAGE_TERMINAL_THEME_KEY = "terminal-theme";
const LOCAL_STORAGE_DEMO_MODE_KEY = "demo-mode";

const emojiMap = APP_LOCALES.split(",").reduce<Record<string, FlagComponent>>(
  (acc, locale) => {
    const countryCode = locale.split("-")[1];
    if (!countryCode) return acc;

    // biome-ignore lint/performance/noDynamicNamespaceImportAccess: we need dynamic access here
    acc[countryCode] = Flags[countryCode as keyof typeof Flags];
    return acc;
  },
  {},
);

export function setTerminalTheme(theme: string) {
  localStorage.setItem(LOCAL_STORAGE_TERMINAL_THEME_KEY, theme);
}

export function getTerminalTheme() {
  return localStorage.getItem(LOCAL_STORAGE_TERMINAL_THEME_KEY) ?? "mocha";
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isTauri() {
  return (
    (
      window as unknown as {
        __TAURI__?: unknown;
      }
    ).__TAURI__ !== undefined
  );
}

export function openExternalUrl(url: string) {
  if (isTauri()) {
    void shellOpen(url);
  } else {
    window.open(url, "_blank");
  }
}

export function isDemo() {
  return (
    document.location.host === "demo.soulfiremc.com" ||
    localStorage.getItem(LOCAL_STORAGE_DEMO_MODE_KEY) === "true"
  );
}

export function cancellablePromiseDefault<T extends () => void>(
  promise: Promise<T>,
): () => void {
  return cancellablePromise(promise, (run) => run());
}

export function cancellablePromise<T>(
  promise: Promise<T>,
  cancel: (value: T) => void,
): () => void {
  let cancelled = false;
  let resolvedValue: T | null = null;
  void promise.then((value) => {
    if (cancelled) {
      cancel(value);
    } else {
      resolvedValue = value;
    }
  });

  return () => {
    cancelled = true;
    if (resolvedValue != null) {
      cancel(resolvedValue);
    }
  };
}

export function hasGlobalPermission(
  clientData: ClientDataResponse,
  permission: GlobalPermission,
) {
  if (isDemo()) {
    return true;
  }

  return clientData.serverPermissions
    .filter((p) => p.granted)
    .map((p) => p.globalPermission)
    .includes(permission);
}

export function hasInstancePermission(
  instanceInfo: InstanceInfo | InstanceListResponse_Instance,
  permission: InstancePermission,
) {
  if (isDemo()) {
    return true;
  }

  return instanceInfo.instancePermissions
    .filter((p) => p.granted)
    .map((p) => p.instancePermission)
    .includes(permission);
}

export function getGravatarUrl(email: string) {
  return `https://www.gravatar.com/avatar/${sha256(email)}?d=404`;
}

export function data2blob(data: string) {
  const bytes = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    bytes[i] = data.charCodeAt(i);
  }

  return new Blob([new Uint8Array(bytes)]);
}

export function languageEmoji(locale: string): ReactNode {
  if (locale === "lol-US") {
    return "🐱";
  }

  const countryCode = locale.split("-")[1];
  if (!countryCode) return "";

  const Flag = emojiMap[countryCode];
  if (!Flag) return "";

  return <Flag className="mx-1 size-4 align-middle" />;
}

export function getLanguageName(languageCode: string, displayLanguage: string) {
  if (languageCode === "lol-US") {
    return "LOLCAT";
  }

  const displayNames = new Intl.DisplayNames([displayLanguage], {
    type: "language",
  });
  return displayNames.of(languageCode) ?? languageCode;
}

export function updateEntry<T extends BaseSettings>(
  namespace: string,
  settingKey: string,
  value: JsonValue,
  profile: T,
): T {
  return {
    ...profile,
    settings: {
      ...profile.settings,
      [namespace]: {
        ...(profile.settings[namespace] || {}),
        [settingKey]: value,
      },
    },
  };
}

function getEntryValue(
  namespace: string,
  settingKey: string,
  config: BaseSettings,
  defaultValue: JsonValue,
): JsonValue {
  const current = config.settings[namespace]?.[settingKey];
  if (current === undefined) {
    return defaultValue;
  }

  return current;
}

export function getSettingValue(
  config: BaseSettings,
  definition: SettingsDefinition | undefined,
): JsonValue {
  const namespace = definition?.id?.namespace;
  const key = definition?.id?.key;
  if (!namespace || !key) {
    return null;
  }

  switch (definition?.type.oneofKind) {
    case "string": {
      return getEntryValue(namespace, key, config, definition.type.string.def);
    }
    case "int": {
      return getEntryValue(namespace, key, config, definition.type.int.def);
    }
    case "bool": {
      return getEntryValue(namespace, key, config, definition.type.bool.def);
    }
    case "double": {
      return getEntryValue(namespace, key, config, definition.type.double.def);
    }
    case "combo": {
      return getEntryValue(namespace, key, config, definition.type.combo.def);
    }
    case "stringList": {
      return getEntryValue(
        namespace,
        key,
        config,
        definition.type.stringList.def,
      );
    }
    case "minMax": {
      return getEntryValue(namespace, key, config, {
        min: definition.type.minMax.minEntry?.def ?? null,
        max: definition.type.minMax.maxEntry?.def ?? null,
      });
    }
    default: {
      return null;
    }
  }
}

export function getSettingIdentifierKey(id: SettingsEntryIdentifier): string {
  return `${id.namespace}:${id.key}`;
}

export async function setInstanceIcon(
  icon: string,
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
  instanceListQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: instanceInfoQueryKey,
    }),
    queryClient.invalidateQueries({
      queryKey: instanceListQueryKey,
    }),
  ]);
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        icon: icon,
      };
    },
  );
  // Update optimistically
  queryClient.setQueryData<InstanceListResponse>(
    instanceListQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        instances: old.instances.map((item) => {
          if (item.id === instanceInfo.id) {
            return {
              ...item,
              icon: icon,
            };
          }

          return item;
        }),
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.updateInstanceMeta({
    id: instanceInfo.id,
    meta: {
      oneofKind: "icon",
      icon: icon,
    },
  });
}

export async function setInstanceFriendlyName(
  friendlyName: string,
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
  instanceListQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: instanceInfoQueryKey,
    }),
    queryClient.invalidateQueries({
      queryKey: instanceListQueryKey,
    }),
  ]);
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        friendlyName: friendlyName,
      };
    },
  );
  // Update optimistically
  queryClient.setQueryData<InstanceListResponse>(
    instanceListQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        instances: old.instances.map((item) => {
          if (item.id === instanceInfo.id) {
            return {
              ...item,
              friendlyName: friendlyName,
            };
          }

          return item;
        }),
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.updateInstanceMeta({
    id: instanceInfo.id,
    meta: {
      oneofKind: "friendlyName",
      friendlyName: friendlyName,
    },
  });
}

// Used only for profile import - sends entire config
export async function setInstanceConfigFull(
  jsonProfile: ProfileRoot,
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  const targetProfile = convertToInstanceProto(jsonProfile);
  await queryClient.cancelQueries({
    queryKey: instanceInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        config: targetProfile,
        profile: jsonProfile,
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.updateInstanceConfig({
    id: instanceInfo.id,
    config: targetProfile,
  });
}

// Used only for profile import - sends entire config
export async function setServerConfigFull(
  jsonProfile: BaseSettings,
  transport: RpcTransport | null,
  queryClient: QueryClient,
  serverInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  const targetProfile = convertToServerProto(jsonProfile);
  await queryClient.cancelQueries({
    queryKey: serverInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<ServerInfoQueryData>(serverInfoQueryKey, (old) => {
    if (old === undefined) {
      return;
    }

    return {
      ...old,
      config: targetProfile,
      profile: jsonProfile,
    };
  });

  const serverService = new ServerServiceClient(transport);
  await serverService.updateServerConfig({
    config: targetProfile,
  });
}

// Granular config entry update for instance settings
export async function updateInstanceConfigEntry(
  namespace: string,
  key: string,
  value: JsonValue,
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  await queryClient.cancelQueries({
    queryKey: instanceInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        profile: updateEntry(namespace, key, value, old.profile),
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.updateInstanceConfigEntry({
    id: instanceInfo.id,
    namespace: namespace,
    key: key,
    value: Value.fromJson(value),
  });
}

// Granular config entry update for server settings
export async function updateServerConfigEntry(
  namespace: string,
  key: string,
  value: JsonValue,
  transport: RpcTransport | null,
  queryClient: QueryClient,
  serverInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  await queryClient.cancelQueries({
    queryKey: serverInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<ServerInfoQueryData>(serverInfoQueryKey, (old) => {
    if (old === undefined) {
      return;
    }

    return {
      ...old,
      profile: updateEntry(namespace, key, value, old.profile),
    };
  });

  const serverService = new ServerServiceClient(transport);
  await serverService.updateServerConfigEntry({
    namespace: namespace,
    key: key,
    value: Value.fromJson(value),
  });
}

// Granular config entry update for bot settings
export async function updateBotConfigEntry(
  namespace: string,
  key: string,
  value: JsonValue,
  instanceId: string,
  botId: string,
  transport: RpcTransport | null,
  queryClient: QueryClient,
  botInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  await queryClient.cancelQueries({
    queryKey: botInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<BotInfoResponse>(botInfoQueryKey, (old) => {
    if (old === undefined) {
      return;
    }

    const currentSettings = old.config?.settings ?? [];
    const namespaceIndex = currentSettings.findIndex(
      (ns) => ns.namespace === namespace,
    );
    const newSettings = [...currentSettings];
    if (namespaceIndex >= 0) {
      const entries = [...newSettings[namespaceIndex].entries];
      const entryIndex = entries.findIndex((e) => e.key === key);
      if (entryIndex >= 0) {
        entries[entryIndex] = { key, value: Value.fromJson(value) };
      } else {
        entries.push({ key, value: Value.fromJson(value) });
      }
      newSettings[namespaceIndex] = {
        ...newSettings[namespaceIndex],
        entries,
      };
    } else {
      newSettings.push({
        namespace,
        entries: [{ key, value: Value.fromJson(value) }],
      });
    }

    return {
      ...old,
      config: {
        ...old.config,
        settings: newSettings,
      },
    };
  });

  const botService = new BotServiceClient(transport);
  await botService.updateBotConfigEntry({
    instanceId: instanceId,
    botId: botId,
    namespace: namespace,
    key: key,
    value: Value.fromJson(value),
  });
}

// Account operations
export async function addInstanceAccount(
  account: ProfileAccount,
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  const accountProto: MinecraftAccountProto = account;

  await queryClient.cancelQueries({
    queryKey: instanceInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        profile: {
          ...old.profile,
          accounts: [...old.profile.accounts, account],
        },
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.addInstanceAccount({
    id: instanceInfo.id,
    account: accountProto,
  });
}

export async function removeInstanceAccount(
  profileId: string,
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  await queryClient.cancelQueries({
    queryKey: instanceInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        profile: {
          ...old.profile,
          accounts: old.profile.accounts.filter(
            (a) => a.profileId !== profileId,
          ),
        },
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.removeInstanceAccount({
    id: instanceInfo.id,
    profileId: profileId,
  });
}

export async function updateInstanceAccount(
  account: ProfileAccount,
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  const accountProto: MinecraftAccountProto = account;

  await queryClient.cancelQueries({
    queryKey: instanceInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        profile: {
          ...old.profile,
          accounts: old.profile.accounts.map((a) =>
            a.profileId === account.profileId ? account : a,
          ),
        },
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.updateInstanceAccount({
    id: instanceInfo.id,
    account: accountProto,
  });
}

// Batch account operations
export async function addInstanceAccountsBatch(
  accounts: ProfileAccount[],
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  const accountProtos: MinecraftAccountProto[] = accounts;

  await queryClient.cancelQueries({
    queryKey: instanceInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        profile: {
          ...old.profile,
          accounts: [...old.profile.accounts, ...accounts],
        },
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.addInstanceAccountsBatch({
    id: instanceInfo.id,
    accounts: accountProtos,
  });
}

export async function removeInstanceAccountsBatch(
  profileIds: string[],
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  const profileIdSet = new Set(profileIds);

  await queryClient.cancelQueries({
    queryKey: instanceInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        profile: {
          ...old.profile,
          accounts: old.profile.accounts.filter(
            (a) => !profileIdSet.has(a.profileId),
          ),
        },
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.removeInstanceAccountsBatch({
    id: instanceInfo.id,
    profileIds: profileIds,
  });
}

export async function applyGeneratedAccounts(
  newAccounts: ProfileAccount[],
  mode: GenerateAccountsMode,
  existingAccounts: ProfileAccount[],
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  switch (mode) {
    case "IGNORE_EXISTING":
      // Just append new accounts (duplicates already filtered during generation)
      await addInstanceAccountsBatch(
        newAccounts,
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryKey,
      );
      break;
    case "REPLACE_EXISTING": {
      // Remove accounts with colliding UUIDs, then add new accounts
      const newProfileIds = new Set(newAccounts.map((a) => a.profileId));
      const existingToRemove = existingAccounts
        .filter((a) => newProfileIds.has(a.profileId))
        .map((a) => a.profileId);
      if (existingToRemove.length > 0) {
        await removeInstanceAccountsBatch(
          existingToRemove,
          instanceInfo,
          transport,
          queryClient,
          instanceInfoQueryKey,
        );
      }
      await addInstanceAccountsBatch(
        newAccounts,
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryKey,
      );
      break;
    }
    case "REPLACE_ALL": {
      // Delete all existing accounts and replace with generated ones
      const allExistingIds = existingAccounts.map((a) => a.profileId);
      if (allExistingIds.length > 0) {
        await removeInstanceAccountsBatch(
          allExistingIds,
          instanceInfo,
          transport,
          queryClient,
          instanceInfoQueryKey,
        );
      }
      await addInstanceAccountsBatch(
        newAccounts,
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryKey,
      );
      break;
    }
  }
}

// Proxy operations
export async function addInstanceProxy(
  proxy: ProfileProxy,
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  const proxyProto: ProxyProto = proxy;

  await queryClient.cancelQueries({
    queryKey: instanceInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        profile: {
          ...old.profile,
          proxies: [...old.profile.proxies, proxy],
        },
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.addInstanceProxy({
    id: instanceInfo.id,
    proxy: proxyProto,
  });
}

export async function removeInstanceProxy(
  index: number,
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  await queryClient.cancelQueries({
    queryKey: instanceInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        profile: {
          ...old.profile,
          proxies: old.profile.proxies.filter((_, i) => i !== index),
        },
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.removeInstanceProxy({
    id: instanceInfo.id,
    index: index,
  });
}

export async function updateInstanceProxy(
  index: number,
  proxy: ProfileProxy,
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  const proxyProto: ProxyProto = proxy;

  await queryClient.cancelQueries({
    queryKey: instanceInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        profile: {
          ...old.profile,
          proxies: old.profile.proxies.map((p, i) => (i === index ? proxy : p)),
        },
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.updateInstanceProxy({
    id: instanceInfo.id,
    index: index,
    proxy: proxyProto,
  });
}

// Batch proxy operations
export async function addInstanceProxiesBatch(
  proxies: ProfileProxy[],
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  const proxyProtos: ProxyProto[] = proxies;

  await queryClient.cancelQueries({
    queryKey: instanceInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        profile: {
          ...old.profile,
          proxies: [...old.profile.proxies, ...proxies],
        },
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.addInstanceProxiesBatch({
    id: instanceInfo.id,
    proxies: proxyProtos,
  });
}

export async function removeInstanceProxiesBatch(
  addresses: string[],
  instanceInfo: {
    id: string;
  },
  transport: RpcTransport | null,
  queryClient: QueryClient,
  instanceInfoQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  const addressSet = new Set(addresses);

  await queryClient.cancelQueries({
    queryKey: instanceInfoQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<InstanceInfoQueryData>(
    instanceInfoQueryKey,
    (old) => {
      if (old === undefined) {
        return;
      }

      return {
        ...old,
        profile: {
          ...old.profile,
          proxies: old.profile.proxies.filter(
            (p) => !addressSet.has(p.address),
          ),
        },
      };
    },
  );

  const instanceService = new InstanceServiceClient(transport);
  await instanceService.removeInstanceProxiesBatch({
    id: instanceInfo.id,
    addresses: addresses,
  });
}

// Keep the old function names for backward compatibility (these are used for profile import only now)
export const setServerConfig = setServerConfigFull;
export const setInstanceConfig = setInstanceConfigFull;

export async function setSelfUsername(
  username: string,
  transport: RpcTransport | null,
  queryClient: QueryClient,
  clientDataQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  await queryClient.cancelQueries({
    queryKey: clientDataQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<ClientDataResponse>(clientDataQueryKey, (old) => {
    if (old === undefined) {
      return;
    }

    return {
      ...old,
      username: username,
    };
  });

  const clientService = new ClientServiceClient(transport);
  await clientService.updateSelfUsername({
    username: username,
  });
}

export async function setSelfEmail(
  email: string,
  transport: RpcTransport | null,
  queryClient: QueryClient,
  clientDataQueryKey: QueryKey,
) {
  if (transport === null) {
    return;
  }

  await queryClient.cancelQueries({
    queryKey: clientDataQueryKey,
  });
  // Update optimistically
  queryClient.setQueryData<ClientDataResponse>(clientDataQueryKey, (old) => {
    if (old === undefined) {
      return;
    }

    return {
      ...old,
      email: email,
    };
  });

  const clientService = new ClientServiceClient(transport);
  await clientService.updateSelfEmail({
    email: email,
  });
}

export function timestampToDate(timestamp: Timestamp): Date {
  return new Date(
    parseInt(timestamp.seconds, 10) * 1000 +
      Math.floor((timestamp.nanos || 0) / 1e6),
  );
}

export function runAsync(fn: () => Promise<void>) {
  void fn().catch(console.error);
}

export function formatIconName(text: string): string {
  return text
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
export function smartEntries<T extends object>(
  obj: T,
): [keyof T, T[keyof T]][] {
  return Object.entries(obj).map(([key, value]) => [
    key as keyof T,
    value as T[keyof T],
  ]);
}

export type McLogsResponse =
  | {
      success: true;
      id: string;
      url: string;
      raw: string;
    }
  | {
      success: false;
      error: string;
    };

export async function uploadToMcLogs(content: string): Promise<McLogsResponse> {
  const response = await fetch("https://api.mclo.gs/1/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ content }),
  });

  return await response.json();
}

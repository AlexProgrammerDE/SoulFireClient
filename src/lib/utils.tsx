import type { JsonValue } from "@protobuf-ts/runtime";
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import * as clipboard from "@tauri-apps/plugin-clipboard-manager";
import { type ClassValue, clsx } from "clsx";
import type { FlagComponent } from "country-flag-icons/react/1x1";
import * as Flags from "country-flag-icons/react/3x2";
import { sha256 } from "js-sha256";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { Timestamp } from "@/generated/google/protobuf/timestamp.ts";
import { ClientServiceClient } from "@/generated/soulfire/client.client.ts";
import type { ClientDataResponse } from "@/generated/soulfire/client.ts";
import type {
  GlobalPermission,
  InstancePermission,
  SettingEntry,
} from "@/generated/soulfire/common.ts";
import { InstanceServiceClient } from "@/generated/soulfire/instance.client.ts";
import type {
  InstanceInfoResponse,
  InstanceListResponse,
  InstanceListResponse_Instance,
} from "@/generated/soulfire/instance.ts";
import { ServerServiceClient } from "@/generated/soulfire/server.client.ts";
import {
  type BaseSettings,
  convertToInstanceProto,
  convertToServerProto,
  type InstanceInfoQueryData,
  type ProfileRoot,
  type ServerInfoQueryData,
} from "@/lib/types.ts";

export const ROOT_USER_ID = "00000000-0000-0000-0000-000000000000";
const LOCAL_STORAGE_TERMINAL_THEME_KEY = "terminal-theme";

const emojiMap = APP_LOCALES.split(",").reduce<Record<string, FlagComponent>>(
  (acc, locale) => {
    const countryCode = locale.split("-")[1];
    if (!countryCode) return acc;

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
  return (window as never).__TAURI__ !== undefined;
}

export function isDemo() {
  return document.location.host === "demo.soulfiremc.com";
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
  instanceInfo: InstanceInfoResponse | InstanceListResponse_Instance,
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

export function getEntryValueByType(
  namespace: string,
  config: BaseSettings,
  entry: SettingEntry | undefined,
): JsonValue {
  switch (entry?.value.oneofKind) {
    case "string": {
      return getEntryValue(
        namespace,
        entry.key,
        config,
        entry.value.string.def,
      );
    }
    case "int": {
      return getEntryValue(namespace, entry.key, config, entry.value.int.def);
    }
    case "bool": {
      return getEntryValue(namespace, entry.key, config, entry.value.bool.def);
    }
    case "double": {
      return getEntryValue(
        namespace,
        entry.key,
        config,
        entry.value.double.def,
      );
    }
    case "combo": {
      return getEntryValue(namespace, entry.key, config, entry.value.combo.def);
    }
    case "stringList": {
      return getEntryValue(
        namespace,
        entry.key,
        config,
        entry.value.stringList.def,
      );
    }
    case "minMax": {
      return getEntryValue(namespace, entry.key, config, {
        min: entry.value.minMax.minEntry?.def,
        max: entry.value.minMax.maxEntry?.def,
      });
    }
    case undefined: {
      return null;
    }
  }
}

export async function setInstanceConfig(
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

export async function setServerConfig(
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

export function copyToClipboard(text: string) {
  if (isTauri()) {
    void clipboard.writeText(text);
  } else {
    void navigator.clipboard.writeText(text);
  }
}
export function smartEntries<T extends object>(
  obj: T,
): [keyof T, T[keyof T]][] {
  return Object.entries(obj).map(([key, value]) => [
    key as keyof T,
    value as T[keyof T],
  ]);
}

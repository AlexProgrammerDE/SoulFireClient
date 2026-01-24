import type { JsonValue } from "@protobuf-ts/runtime/build/types/json-typings";
import type { i18n } from "i18next";
import { Value } from "@/generated/google/protobuf/struct.ts";
import type {
  MinecraftAccountProto,
  MinecraftAccountProto_AccountTypeProto,
  ProxyProto_Type,
  SettingsNamespace,
} from "@/generated/soulfire/common.ts";
import {
  type InstanceConfig,
  type InstanceInfo,
  InstanceState,
} from "@/generated/soulfire/instance.ts";
import type {
  ServerConfig,
  ServerInfoResponse,
} from "@/generated/soulfire/server.ts";

export type SFServerType = "integrated" | "dedicated";

export type BaseSettings = {
  settings: Record<string, Record<string, JsonValue>>;
};

export type ProfileRoot = BaseSettings & {
  accounts: ProfileAccount[];
  proxies: ProfileProxy[];
};

export type GenerateAccountsMode =
  | "IGNORE_EXISTING"
  | "REPLACE_EXISTING"
  | "REPLACE_ALL";

export type ServerInfoQueryData = ServerInfoResponse & {
  profile: BaseSettings;
};

export type InstanceInfoQueryData = InstanceInfo & {
  id: string;
  profile: ProfileRoot;
};

export function getEnumKeyByValue<E extends object>(
  enumObj: E,
  value: E[keyof E],
): keyof E {
  return Object.entries(enumObj).find(([, v]) => v === value)?.[0] as keyof E;
}

export function getEnumEntries<E extends object>(
  enumObj: E,
): {
  key: keyof E;
  value: E[keyof E];
}[] {
  return Object.entries(enumObj)
    .filter(([key]) => Number.isNaN(parseInt(key, 10)))
    .map(([key, value]) => ({
      key: key as keyof E,
      value: value as E[keyof E],
    }));
}

export function mapUnionToValue<U, V>(
  union: U,
  map: (u: U) => Exclude<V, void>,
): V {
  return map(union);
}

export function translateInstanceState(
  i18n: i18n,
  state: InstanceState,
): string {
  return i18n.t(
    `instanceState.${getEnumKeyByValue(InstanceState, state).toLowerCase()}`,
  );
}

export type ProfileAccount = {
  type: MinecraftAccountProto_AccountTypeProto;
  profileId: string;
  lastKnownName: string;
  accountData: MinecraftAccountProto["accountData"];
  persistentMetadata: SettingsNamespace[];
};

export type ProfileProxy = {
  type: ProxyProto_Type;
  address: string;
  username?: string;
  password?: string;
};

export function convertToInstanceProto(data: ProfileRoot): InstanceConfig {
  return {
    settings: Object.entries(data.settings).map(([key, value]) => ({
      namespace: key,
      entries: Object.entries(value).map(([key, value]) => ({
        key: key,
        value: Value.fromJson(value),
      })),
    })),
    accounts: data.accounts,
    proxies: data.proxies,
  };
}

export function convertFromInstanceProto(data?: InstanceConfig): ProfileRoot {
  if (!data) {
    return {
      settings: {},
      accounts: [],
      proxies: [],
    };
  }

  const settings: Record<string, Record<string, JsonValue>> = {};
  for (const namespace of data.settings) {
    const entries: Record<string, JsonValue> = {};
    for (const entry of namespace.entries) {
      entries[entry.key] = Value.toJson(entry.value as Value);
    }
    settings[namespace.namespace] = entries;
  }

  return {
    settings: settings,
    accounts: data.accounts,
    proxies: data.proxies,
  };
}

export function convertToServerProto(data: BaseSettings): ServerConfig {
  return {
    settings: Object.entries(data.settings).map(([key, value]) => ({
      namespace: key,
      entries: Object.entries(value).map(([key, value]) => ({
        key: key,
        value: Value.fromJson(value),
      })),
    })),
  };
}

export function convertFromServerProto(data: ServerConfig): BaseSettings {
  const settings: Record<string, Record<string, JsonValue>> = {};
  for (const namespace of data.settings) {
    const entries: Record<string, JsonValue> = {};
    for (const entry of namespace.entries) {
      entries[entry.key] = Value.toJson(entry.value as Value);
    }
    settings[namespace.namespace] = entries;
  }

  return {
    settings: settings,
  };
}

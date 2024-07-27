import {
  MinecraftAccountProto,
  MinecraftAccountProto_AccountTypeProto,
  ProxyProto_Type,
} from '@/generated/com/soulfiremc/grpc/generated/common.ts';
import { Value } from '@/generated/google/protobuf/struct.ts';
import { JsonValue } from '@protobuf-ts/runtime/build/types/json-typings';
import { InstanceConfig } from '@/generated/com/soulfiremc/grpc/generated/instance.ts';

export const LOCAL_STORAGE_SERVER_ADDRESS_KEY = 'server-address';
export const LOCAL_STORAGE_SERVER_TOKEN_KEY = 'server-token';

export type ProfileRoot = {
  settings: Record<string, Record<string, JsonValue>>;
  accounts: ProfileAccount[];
  proxies: ProfileProxy[];
};

export function getEnumKeyByValue<E extends object>(
  enumObj: E,
  value: number,
): keyof E {
  return Object.entries(enumObj).find(([, v]) => v === value)?.[0] as keyof E;
}

export type ProfileAccount = {
  type: MinecraftAccountProto_AccountTypeProto;
  profileId: string;
  lastKnownName: string;
  accountData: MinecraftAccountProto['accountData'];
};

export type ProfileProxy = {
  type: ProxyProto_Type;
  address: string;
  username?: string;
  password?: string;
};

export function convertToProto(data: ProfileRoot): InstanceConfig {
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

export function convertFromProto(data: InstanceConfig): ProfileRoot {
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

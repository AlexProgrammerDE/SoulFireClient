import {
  AttackStartRequest,
  SettingsEntry,
} from '@/generated/com/soulfiremc/grpc/generated/attack.ts';
import {
  MinecraftAccountProto,
  MinecraftAccountProto_AccountTypeProto,
  ProxyProto_Type,
} from '@/generated/com/soulfiremc/grpc/generated/common.ts';
import { Value } from '@/generated/google/protobuf/struct.ts';
import { JsonValue } from '@protobuf-ts/runtime/build/types/json-typings';

export const LOCAL_STORAGE_SERVER_ADDRESS_KEY = 'server-address';
export const LOCAL_STORAGE_SERVER_TOKEN_KEY = 'server-token';

export const DEFAULT_PROFILE: ProfileRoot = {
  settings: {},
  accounts: [],
  proxies: [],
};

export type ProfileRoot = {
  settings: Record;
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

function toSettingsEntryProto(key: string, value: JsonValue): SettingsEntry {
  return {
    key: key,
    value: Value.fromJson(value),
  };
}

export function convertToProto(data: ProfileRoot): AttackStartRequest {
  return {
    settings: Object.entries(data.settings).map(([key, value]) => ({
      namespace: key,
      entries: Object.entries(value).map(([key, value]) =>
        toSettingsEntryProto(key, value),
      ),
    })),
    accounts: data.accounts.map((a) => ({
      type: a.type,
      profileId: a.profileId,
      lastKnownName: a.lastKnownName,
      accountData: a.accountData,
    })),
    proxies: data.proxies.map((p) => ({
      type: p.type,
      address: p.address,
      username: p.username,
      password: p.password,
    })),
  };
}

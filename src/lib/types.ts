import {AttackStartRequest, SettingsEntry} from "@/generated/com/soulfiremc/grpc/generated/attack.ts";
import {
  MinecraftAccountProto,
  MinecraftAccountProto_AccountTypeProto, ProxyProto_Type
} from "@/generated/com/soulfiremc/grpc/generated/common.ts";

export const LOCAL_STORAGE_SERVER_ADDRESS_KEY = "server-address"
export const LOCAL_STORAGE_SERVER_TOKEN_KEY = "server-token"

export const DEFAULT_PROFILE: ProfileRoot = {
  settings: {},
  accounts: [],
  proxies: []
}

export type ProfileSettingsJSDataTypes = string | WrappedInteger | WrappedDouble | boolean

export type ProfileRoot = {
  settings: Record<string, Record<string, ProfileSettingsJSDataTypes>>,
  accounts: ProfileAccount[],
  proxies: ProfileProxy[],
}

export class WrappedInteger {
  constructor(public value: number) {
  }
}

export class WrappedDouble {
  constructor(public value: number) {
  }
}

export function getEnumKeyByValue(enumObj: never, value: number): string | undefined {
  return Object.keys(enumObj).find(key => enumObj[key] === value);
}

export type ProfileAccount = {
  enabled: boolean,
  type: MinecraftAccountProto_AccountTypeProto
  profileId: string,
  lastKnownName: string,
  accountData: MinecraftAccountProto["accountData"]
}

export type ProfileProxy = {
  enabled: boolean,
  type: ProxyProto_Type
  address: string,
  username?: string
  password?: string
}

function toSettingsEntryProto(key: string, value: ProfileSettingsJSDataTypes): SettingsEntry {
  if (typeof value === "string") {
    return {
      key: key,
      value: {
        oneofKind: "stringValue",
        stringValue: value
      }
    }
  } else if (value instanceof WrappedInteger) {
    return {
      key: key,
      value: {
        oneofKind: "intValue",
        intValue: value.value
      }
    }
  } else if (value instanceof WrappedDouble) {
    return {
      key: key,
      value: {
        oneofKind: "doubleValue",
        doubleValue: value.value
      }
    }
  } else {
    return {
      key: key,
      value: {
        oneofKind: "boolValue",
        boolValue: value
      }
    }
  }
}

export function convertToProto(data: ProfileRoot): AttackStartRequest {
  return {
    settings: Object.entries(data.settings)
        .map(([key, value]) => ({
          namespace: key,
          entries: Object.entries(value)
              .map(([key, value]) => toSettingsEntryProto(key, value))
        })),
    accounts: data.accounts.filter(a => a.enabled).map(a => ({
      type: a.type,
      profileId: a.profileId,
      lastKnownName: a.lastKnownName,
      accountData: a.accountData
    })),
    proxies: data.proxies.filter(p => p.enabled).map(p => ({
      type: p.type,
      address: p.address,
      username: p.username,
      password: p.password
    }))
  }
}

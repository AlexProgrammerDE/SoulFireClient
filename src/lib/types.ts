import {AttackStartRequest, SettingsEntry} from "@/generated/com/soulfiremc/grpc/generated/attack.ts";

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
    accounts: EnabledWrapper<ProfileAccount>[],
    proxies: EnabledWrapper<ProfileProxy>[],
}

export class WrappedInteger {
    constructor(public value: number) {
    }
}

export class WrappedDouble {
    constructor(public value: number) {
    }
}

export type EnabledWrapper<T> = {
    enabled: boolean,
    value: T
}

export type ProfileAccount = {
    profileId: string,
    lastKnownName: string,
}

export type ProfileProxy = {
    type: "HTTP" | "SOCKS4" | "SOCKS5",
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
        accounts: [],
        proxies: []
    }
}

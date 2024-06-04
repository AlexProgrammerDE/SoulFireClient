import {AttackStartRequest} from "@/generated/com/soulfiremc/grpc/generated/attack.ts";

export const LOCAL_STORAGE_SERVER_ADDRESS_KEY = "server-address"
export const LOCAL_STORAGE_SERVER_TOKEN_KEY = "server-token"

export const DEFAULT_PROFILE: ProfileRoot = {
    settings: {},
    accounts: [],
    proxies: []
}

export type ProfileRoot = {
    settings: Record<string, Record<string, unknown>>,
    accounts: EnabledWrapper<ProfileAccount>[],
    proxies: EnabledWrapper<ProfileProxy>[],
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

export function convertToProto(data: ProfileRoot): AttackStartRequest {
    return {
        settings: [],
        accounts: [],
        proxies: []
    }
}

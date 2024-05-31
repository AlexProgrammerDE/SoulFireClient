export const DEFAULT_PROFILE: ProfileRoot = {
    settings: {},
    accounts: [],
    proxies: []
}

export type ProfileRoot = {
    settings: Record<string, Record<string, never>>,
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

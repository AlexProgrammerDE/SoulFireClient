import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { AuthType, createClient, type WebDAVClient } from "webdav";
import type { ClientDataResponse } from "@/generated/soulfire/client.ts";
import i18n from "@/lib/i18n.ts";
import type { SFServerType } from "@/lib/types.ts";
import { isDemo } from "@/lib/utils.tsx";

const LOCAL_STORAGE_SERVER_TYPE_KEY = "server-type";
const LOCAL_STORAGE_SERVER_ADDRESS_KEY = "server-address";
const LOCAL_STORAGE_SERVER_TOKEN_KEY = "server-token";
const LOCAL_STORAGE_SERVER_WEBDAV_TOKEN_KEY = "server-webdav-token";
const LOCAL_STORAGE_SERVER_IMPERSONATION_TOKEN_KEY =
  "server-impersonation-token";

export const isAuthenticated = () => {
  if (isDemo()) return true;

  return (
    localStorage.getItem(LOCAL_STORAGE_SERVER_TYPE_KEY) !== null &&
    localStorage.getItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY) !== null &&
    localStorage.getItem(LOCAL_STORAGE_SERVER_TOKEN_KEY) !== null
  );
};

export const setAuthentication = (
  type: SFServerType,
  address: string,
  token: string,
) => {
  localStorage.setItem(LOCAL_STORAGE_SERVER_TYPE_KEY, type);
  localStorage.setItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY, address);
  localStorage.setItem(LOCAL_STORAGE_SERVER_TOKEN_KEY, token);
};

export const getServerType = () => {
  return localStorage.getItem(
    LOCAL_STORAGE_SERVER_TYPE_KEY,
  ) as SFServerType | null;
};

export const getOrGenerateWebDAVToken = (generator: () => string): string => {
  let token = localStorage.getItem(LOCAL_STORAGE_SERVER_WEBDAV_TOKEN_KEY);
  if (!token) {
    token = generator();
    localStorage.setItem(LOCAL_STORAGE_SERVER_WEBDAV_TOKEN_KEY, token);
  }
  return token;
};

export function createWebDAVClient(
  clientInfo: ClientDataResponse,
  generator: () => string,
): WebDAVClient {
  const token = getOrGenerateWebDAVToken(generator);
  return createClient(clientInfo.serverInfo!.publicWebdavAddress, {
    authType: AuthType.Password,
    username: "ignored",
    password: token,
  });
}

export const logOut = () => {
  localStorage.removeItem(LOCAL_STORAGE_SERVER_TYPE_KEY);
  localStorage.removeItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY);
  localStorage.removeItem(LOCAL_STORAGE_SERVER_TOKEN_KEY);
  localStorage.removeItem(LOCAL_STORAGE_SERVER_WEBDAV_TOKEN_KEY);
  localStorage.removeItem(LOCAL_STORAGE_SERVER_IMPERSONATION_TOKEN_KEY);
};

export const startImpersonation = (token: string) => {
  localStorage.setItem(LOCAL_STORAGE_SERVER_IMPERSONATION_TOKEN_KEY, token);
};

export const stopImpersonation = () => {
  localStorage.removeItem(LOCAL_STORAGE_SERVER_IMPERSONATION_TOKEN_KEY);
};

export const isImpersonating = () => {
  return (
    localStorage.getItem(LOCAL_STORAGE_SERVER_IMPERSONATION_TOKEN_KEY) !== null
  );
};

export const createTransport = () => {
  if (isDemo()) {
    return null;
  }

  const address = localStorage.getItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY);
  let token = localStorage.getItem(LOCAL_STORAGE_SERVER_TOKEN_KEY);

  if (!address || !token) {
    throw new Error(i18n.t("common:error.noAddressOrToken"));
  }

  const impersonationToken = localStorage.getItem(
    LOCAL_STORAGE_SERVER_IMPERSONATION_TOKEN_KEY,
  );
  if (impersonationToken !== null) {
    token = impersonationToken;
  }

  return new GrpcWebFetchTransport({
    baseUrl: address,
    meta: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createAddressOnlyTransport = (address: string) => {
  return new GrpcWebFetchTransport({
    baseUrl: address,
  });
};

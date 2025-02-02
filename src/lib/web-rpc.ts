import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { isDemo } from '@/lib/utils.tsx';
import i18n from '@/lib/i18n.ts';
import { SFServerType } from '@/lib/types.ts';

const LOCAL_STORAGE_SERVER_TYPE_KEY = 'server-type';
const LOCAL_STORAGE_SERVER_ADDRESS_KEY = 'server-address';
const LOCAL_STORAGE_SERVER_TOKEN_KEY = 'server-token';

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

export const logOut = () => {
  localStorage.removeItem(LOCAL_STORAGE_SERVER_TYPE_KEY);
  localStorage.removeItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY);
  localStorage.removeItem(LOCAL_STORAGE_SERVER_TOKEN_KEY);
};

export const createTransport = () => {
  if (isDemo()) {
    return null;
  }

  const address = localStorage.getItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY);
  const token = localStorage.getItem(LOCAL_STORAGE_SERVER_TOKEN_KEY);

  if (!address || !token) {
    throw new Error(i18n.t('common:error.noAddressOrToken'));
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

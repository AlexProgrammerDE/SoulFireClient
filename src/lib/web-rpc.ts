import {
  LOCAL_STORAGE_SERVER_ADDRESS_KEY,
  LOCAL_STORAGE_SERVER_TOKEN_KEY,
} from '@/lib/types.ts';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { isDemo } from '@/lib/utils.ts';
import i18n from '@/lib/i18n.ts';

export const isAuthenticated = () => {
  if (isDemo()) return true;

  return (
    localStorage.getItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY) !== null &&
    localStorage.getItem(LOCAL_STORAGE_SERVER_TOKEN_KEY) !== null
  );
};

export const logOut = () => {
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

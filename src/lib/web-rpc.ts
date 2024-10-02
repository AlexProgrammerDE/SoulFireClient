import {
  LOCAL_STORAGE_SERVER_ADDRESS_KEY,
  LOCAL_STORAGE_SERVER_TOKEN_KEY,
} from '@/lib/types.ts';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { isDemo } from '@/lib/utils.ts';

export const isAuthenticated = () => {
  return (
    localStorage.getItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY) !== null &&
    localStorage.getItem(LOCAL_STORAGE_SERVER_TOKEN_KEY) !== null
  );
};

export const createTransport = () => {
  if (isDemo()) {
    return null;
  }

  const address = localStorage.getItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY);
  const token = localStorage.getItem(LOCAL_STORAGE_SERVER_TOKEN_KEY);

  if (!address || !token) {
    throw new Error('No server address or token');
  }

  return new GrpcWebFetchTransport({
    baseUrl: address,
    meta: {
      Authorization: `Bearer ${token}`,
    },
  });
};

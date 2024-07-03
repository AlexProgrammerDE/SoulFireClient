import { createContext } from 'react';
import { RpcTransport } from '@protobuf-ts/runtime-rpc';

export const ServerConnectionContext = createContext<RpcTransport>(
  null as never,
);

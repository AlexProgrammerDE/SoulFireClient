import { createContext } from 'react';
import { RpcTransport } from '@protobuf-ts/runtime-rpc';

export const TransportContext = createContext<RpcTransport | null>(null);

import { createContext } from 'react';
import { ServerInfoResponse } from '@/generated/soulfire/server.ts';

export const ServerInfoContext = createContext<ServerInfoResponse>(
  null as never,
);

import { createContext } from 'react';
import { ClientDataResponse } from '@/generated/soulfire/client.ts';

export const ClientInfoContext = createContext<ClientDataResponse>(
  null as never,
);

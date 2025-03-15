import { createContext } from 'react';
import { ClientDataResponse } from '@/generated/soulfire/config.ts';

export const ClientInfoContext = createContext<ClientDataResponse>(
  null as never,
);

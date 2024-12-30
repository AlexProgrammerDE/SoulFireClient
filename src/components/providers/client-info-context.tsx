import { createContext } from 'react';
import { ClientDataResponse } from '@/generated/soulfire/config.ts';

export const ClientInfoContext = createContext<
  {
    gravatarUrl: string;
  } & ClientDataResponse
>(null as never);

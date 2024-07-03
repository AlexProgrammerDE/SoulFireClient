import { createContext } from 'react';
import { ClientDataResponse } from '@/generated/com/soulfiremc/grpc/generated/config.ts';

export const ClientInfoContext = createContext<ClientDataResponse>(
  null as never,
);

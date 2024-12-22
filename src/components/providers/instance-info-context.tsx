import { createContext } from 'react';
import { InstanceInfoResponse } from '@/generated/soulfire/instance.ts';

export const InstanceInfoContext = createContext<
  {
    id: string;
  } & InstanceInfoResponse
>(null as never);

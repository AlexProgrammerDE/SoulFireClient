import { createContext } from 'react';
import { InstanceListResponse } from '@/generated/soulfire/instance.ts';

export const InstanceListContext = createContext<InstanceListResponse>(
  null as never,
);

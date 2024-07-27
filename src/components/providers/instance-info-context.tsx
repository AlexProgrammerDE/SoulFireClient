import { createContext } from 'react';
import { InstanceState } from '@/generated/com/soulfiremc/grpc/generated/instance.ts';

export const InstanceInfoContext = createContext<{
  id: string;
  friendlyName: string;
  state: InstanceState;
}>(null as never);

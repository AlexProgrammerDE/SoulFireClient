import { createContext } from 'react';
import { InstanceInfoResponse } from '@/generated/com/soulfiremc/grpc/generated/instance.ts';

export const InstanceInfoContext = createContext<{
  id: string;
  info: InstanceInfoResponse;
}>(null as never);

import { createContext } from 'react';
import { BaseSettings } from '@/lib/types.ts';

export const ServerConfigContext = createContext<BaseSettings>(null as never);

import { createContext } from 'react';

export type SystemInfo = {
  availableProfiles: string[];
  osType: string;
  osVersion: string;
  platformName: string;
  osLocale: string | null;
  archName: string;
  mobile: boolean;
};

export const SystemInfoContext = createContext<SystemInfo | null>(null);

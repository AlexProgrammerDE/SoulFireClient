import { createContext } from 'react';
import { type Theme } from '@tauri-apps/api/window';

export type SystemInfo = {
  availableProfiles: string[];
  osType: string;
  osVersion: string;
  platformName: string;
  osLocale: string | null;
  archName: string;
  theme: Theme | null;
  mobile: boolean;
};

export const SystemInfoContext = createContext<SystemInfo | null>(null);

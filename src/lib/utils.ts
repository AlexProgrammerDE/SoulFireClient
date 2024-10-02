import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LOCAL_STORAGE_TERMINAL_THEME_KEY } from '@/lib/types.ts';

export function getTerminalTheme() {
  return localStorage.getItem(LOCAL_STORAGE_TERMINAL_THEME_KEY) ?? 'mocha';
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isTauri() {
  return (window as never)['__TAURI__'] !== undefined;
}

export function isDemo() {
  return document.location.host === 'demo.soulfiremc.com' || true;
}

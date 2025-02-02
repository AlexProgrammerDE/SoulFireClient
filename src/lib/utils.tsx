import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  GlobalPermission,
  InstancePermission,
} from '@/generated/soulfire/common.ts';
import { ClientDataResponse } from '@/generated/soulfire/config.ts';
import {
  InstanceInfoResponse,
  InstanceListResponse_Instance,
} from '@/generated/soulfire/instance.ts';
import { sha256 } from 'js-sha256';
import * as Flags from 'country-flag-icons/react/3x2';
import { type FlagComponent } from 'country-flag-icons/react/1x1';
import { ReactNode } from 'react';

const LOCAL_STORAGE_TERMINAL_THEME_KEY = 'terminal-theme';

const emojiMap = APP_LOCALES.split(',').reduce(
  (acc, locale) => {
    const countryCode = locale.split('-')[1];
    if (!countryCode) return acc;

    acc[countryCode] = Flags[countryCode as keyof typeof Flags];
    return acc;
  },
  {} as Record<string, FlagComponent>,
);

export function setTerminalTheme(theme: string) {
  localStorage.setItem(LOCAL_STORAGE_TERMINAL_THEME_KEY, theme);
}

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
  return document.location.host === 'demo.soulfiremc.com';
}

export function cancellablePromiseDefault<T extends () => void>(
  promise: Promise<T>,
): () => void {
  return cancellablePromise(promise, (run) => run());
}

export function cancellablePromise<T>(
  promise: Promise<T>,
  cancel: (value: T) => void,
): () => void {
  let cancelled = false;
  let resolvedValue: T | null = null;
  promise.then((value) => {
    if (cancelled) {
      cancel(value);
    } else {
      resolvedValue = value;
    }
  });

  return () => {
    cancelled = true;
    if (resolvedValue != null) {
      cancel(resolvedValue);
    }
  };
}

export function hasGlobalPermission(
  clientData: ClientDataResponse,
  permission: GlobalPermission,
) {
  if (isDemo()) {
    return true;
  }

  return clientData.serverPermissions
    .filter((p) => p.granted)
    .map((p) => p.globalPermission)
    .includes(permission);
}

export function hasInstancePermission(
  clientData: InstanceInfoResponse | InstanceListResponse_Instance,
  permission: InstancePermission,
) {
  if (isDemo()) {
    return true;
  }

  return clientData.instancePermissions
    .filter((p) => p.granted)
    .map((p) => p.instancePermission)
    .includes(permission);
}

export function getGravatarUrl(email: string) {
  return `https://www.gravatar.com/avatar/${sha256(email)}?d=404`;
}

export function data2blob(data: string) {
  const bytes = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    bytes[i] = data.charCodeAt(i);
  }

  return new Blob([new Uint8Array(bytes)]);
}

export function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

export function languageEmoji(locale: string): ReactNode {
  if (locale === 'lol-US') {
    return '🐱';
  }

  const countryCode = locale.split('-')[1];
  if (!countryCode) return '';

  const Flag = emojiMap[countryCode];
  if (!Flag) return '';

  return <Flag className="size-4 mx-1 align-middle" />;
}

export function getLanguageName(languageCode: string, displayLanguage: string) {
  if (languageCode === 'lol-US') {
    return 'LOLCAT';
  }

  const displayNames = new Intl.DisplayNames([displayLanguage], {
    type: 'language',
  });
  return displayNames.of(languageCode) ?? languageCode;
}

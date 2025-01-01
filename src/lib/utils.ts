import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LOCAL_STORAGE_TERMINAL_THEME_KEY } from '@/lib/types.ts';
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

export function toCapitalizedWords(str: string) {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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

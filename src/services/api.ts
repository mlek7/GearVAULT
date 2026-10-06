import { Capacitor } from '@capacitor/core';

/**
 * Base API URL for backend calls.
 * On web: uses relative URLs ('') so proxy and host work seamlessly.
 * On native iOS/Android: loads from https://aperture-app.ai.studio (or VITE_API_BASE_URL).
 */
export const API_BASE_URL: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  (Capacitor.isNativePlatform() ? 'https://aperture-app.ai.studio' : '');

/**
 * Helper to build an absolute URL for backend calls when on native,
 * or keep it relative on web.
 */
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return cleanPath;
  }
  return `${API_BASE_URL.replace(/\/$/, '')}${cleanPath}`;
}

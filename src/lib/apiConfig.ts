/**
 * apiConfig.ts
 * Centralized API & WebSocket Endpoint Resolution
 * Supports both direct backend URL (cross-subdomain) and same-origin proxy setups.
 */

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}

export function getSocketUrl(): string | undefined {
  const url = (process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  return url || undefined;
}


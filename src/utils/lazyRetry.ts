import React, { ComponentType, lazy } from 'react';

const RELOAD_KEY = 'elora_chunk_reload_ts';

/**
 * Wraps React.lazy dynamic imports with automatic retry on transient network/Vite errors
 * and a guarded single page reload if a stale chunk hash is no longer served.
 */
export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (firstErr) {
      // Short retry in case dev server was briefly restarting or network hiccuped
      await new Promise((r) => setTimeout(r, 350));
      try {
        return await factory();
      } catch (secondErr) {
        // Guarded single reload to fetch fresh module graph / build hashes
        try {
          const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) || '0');
          const now = Date.now();
          if (!lastReload || now - lastReload > 10000) {
            sessionStorage.setItem(RELOAD_KEY, String(now));
            window.location.reload();
            return new Promise<{ default: T }>(() => {});
          }
        } catch {}
        throw secondErr || firstErr;
      }
    }
  });
}

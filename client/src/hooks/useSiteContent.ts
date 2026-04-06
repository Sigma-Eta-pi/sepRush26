const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function deepMerge<T>(defaults: T, override: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(override)) return defaults;
  const result = { ...defaults } as Record<string, unknown>;
  for (const key of Object.keys(override)) {
    const defVal = (defaults as Record<string, unknown>)[key];
    const overVal = override[key];
    if (isPlainObject(defVal) && isPlainObject(overVal)) {
      result[key] = deepMerge(defVal, overVal);
    } else if (Array.isArray(overVal) && overVal.length > 0) {
      result[key] = overVal;
    } else if (!Array.isArray(overVal) && overVal !== undefined && overVal !== null) {
      result[key] = overVal;
    }
  }
  return result as T;
}

import { useState, useEffect } from "react";

export function useSiteContent<T>(page: string, defaultContent: T): { content: T; isLoading: boolean } {
  const cacheKey = `site_content_${page}`;

  function getCached(): T | null {
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL) return null;
      return data as T;
    } catch {
      return null;
    }
  }

  const cached = getCached();
  const [content, setContent] = useState<T>(cached ? deepMerge(defaultContent, cached) : defaultContent);
  const [isLoading, setIsLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/content/${page}`);
        if (!res.ok) throw new Error("non-ok");
        const db = await res.json();
        if (!cancelled) {
          const merged = deepMerge(defaultContent, db);
          setContent(merged);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({ data: db, ts: Date.now() }));
          } catch { /* quota */ }
        }
      } catch {
        // silently fall back to defaults
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return { content, isLoading };
}

import { useCallback, useEffect, useRef, useState } from 'react';

import { isRetryable, toApiError, type ApiError } from '@/utils/api-error';

const MAX_RETRIES = 2;

export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await fetcherRef.current(controller.signal);
          if (!cancelled) setData(result);
          break;
        } catch (err) {
          if (cancelled) return;
          const apiError = toApiError(err);
          if (attempt === MAX_RETRIES || !isRetryable(apiError)) {
            setError(apiError);
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, error, loading, refetch };
}

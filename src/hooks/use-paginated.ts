import { useState } from 'react';

import { useFetch } from '@/hooks/use-fetch';
import type { Page } from '@/types/api';

export function usePaginated<T>(
  fetchPage: (params: { page: number; size: number }, signal: AbortSignal) => Promise<Page<T>>,
  deps: unknown[] = [],
  initialSize = 10,
) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialSize);

  const { data, error, loading, refetch } = useFetch((signal) => fetchPage({ page, size }, signal), [page, size, ...deps]);

  const changeSize = (next: number) => {
    setSize(next);
    setPage(0);
  };

  return { data, error, loading, refetch, page, size, setPage, setSize: changeSize };
}

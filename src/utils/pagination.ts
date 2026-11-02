import type { Page } from '@/types/api';

type RawPage<T> = {
  content?: T[];
  page?: number | { number?: number; size?: number; totalElements?: number; totalPages?: number };
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
};

// Spring puede devolver la paginación plana (number/size/...) o anidada en `page`; unificamos ambas.
export function normalizePage<T>(raw: RawPage<T>): Page<T> {
  const meta = typeof raw.page === 'object' && raw.page !== null ? raw.page : raw;
  const content = raw.content ?? [];
  const page = typeof raw.page === 'number' ? raw.page : (meta.number ?? 0);
  const totalPages = meta.totalPages ?? 1;

  return {
    content,
    page,
    size: meta.size ?? content.length,
    totalElements: meta.totalElements ?? content.length,
    totalPages,
    first: raw.first ?? page === 0,
    last: raw.last ?? page >= totalPages - 1,
  };
}

export function pageRange(page: Page<unknown>) {
  if (page.totalElements === 0) return { from: 0, to: 0 };
  const from = page.page * page.size + 1;
  return { from, to: Math.min(from + page.content.length - 1, page.totalElements) };
}

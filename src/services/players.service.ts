import { http } from '@/services/http';
import type { Gender, PlayerResponse } from '@/types/api';

export type PlayerUpdate = Partial<{
  name: string;
  whatsapp: string;
  shareContact: boolean;
  categoryFdptm: string;
  federatedDeclared: boolean;
}>;

export const playersService = {
  suggestFdptmCategory: (birthDate: string, gender: Gender, signal: AbortSignal) =>
    http.post<{ category: string }>('/players/category-suggestion', { birthDate, gender }, { signal })
      .then(({ data }) => data.category),

  update: (playerId: number, input: PlayerUpdate) =>
    http.patch<PlayerResponse>(`/players/${playerId}`, input).then((r) => r.data),
};

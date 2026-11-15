import { http } from '@/services/http';
import type { ProfilePresentationResponse } from '@/utils/profile-presentation';
import type { Gender, Page, PageParams, PlayerResponse, PlayerSummary } from '@/types/api';

export type PlayerUpdate = Partial<{
  name: string;
  whatsapp: string;
  shareContact: boolean;
  categoryFdptm: string;
  federatedDeclared: boolean;
}>;

export const playersService = {
  search: (name: string, params: PageParams, signal?: AbortSignal) =>
    http.get<Page<PlayerSummary>>('/players', { params: { ...params, name }, signal }).then((response) => response.data),
  summary: (id: number, signal?: AbortSignal) =>
    http.get<PlayerSummary>(`/players/${id}/summary`, { signal }).then((response) => response.data),
  presentation: (id: number, signal?: AbortSignal) =>
    http.get<ProfilePresentationResponse>(`/players/${id}/profile`, { signal }).then(({ data }) => data),
  updatePresentation: (input: ProfilePresentationResponse) =>
    http.put<ProfilePresentationResponse>('/players/me/profile', input).then(({ data }) => data),
  suggestFdptmCategory: (birthDate: string, gender: Gender, signal: AbortSignal) =>
    http.post<{ category: string }>('/players/category-suggestion', { birthDate, gender }, { signal })
      .then(({ data }) => data.category),

  update: (playerId: number, input: PlayerUpdate) =>
    http.patch<PlayerResponse>(`/players/${playerId}`, input).then((r) => r.data),
};

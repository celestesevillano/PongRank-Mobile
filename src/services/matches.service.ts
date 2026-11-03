import { http } from '@/services/http';
import type { MatchResponse, Page, PageParams } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

export const matchesService = {
  byPlayer: (playerId: number, params: PageParams & { status?: string }, signal?: AbortSignal): Promise<Page<MatchResponse>> =>
    http.get(`/matches/player/${playerId}`, { params, signal }).then((r) => normalizePage<MatchResponse>(r.data)),

  open: (location: { latitude: number; longitude: number }, signal?: AbortSignal) =>
    http.get<MatchResponse[]>('/matches/open', { params: location, signal }).then((r) => r.data),

  join: (matchId: number) => http.post<MatchResponse>(`/matches/${matchId}/join`, {}).then((r) => r.data),
};

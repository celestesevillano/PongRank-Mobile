import { http } from '@/services/http';
import type { MatchResponse, Page, PageParams } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

export const ACTIVE_STATUSES = ['CREATED', 'PROPOSED_P1', 'PROPOSED_P2'] as const;
export const HISTORY_STATUSES = ['CONFIRMED', 'DISPUTED', 'CANCELLED', 'WALKOVER'] as const;

export const matchesService = {
  byPlayer: (playerId: number, params: PageParams & { status?: string }, signal?: AbortSignal): Promise<Page<MatchResponse>> =>
    http.get(`/matches/player/${playerId}`, { params, signal }).then((r) => normalizePage<MatchResponse>(r.data)),

  active: async (playerId: number, signal?: AbortSignal) => {
    const pages = await Promise.all(
      ACTIVE_STATUSES.map((status) => matchesService.byPlayer(playerId, { status, size: 10 }, signal)),
    );
    return pages.flatMap((page) => page.content).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  open: (location: { latitude: number; longitude: number }, signal?: AbortSignal) =>
    http.get<MatchResponse[]>('/matches/open', { params: location, signal }).then((r) => r.data),

  join: (matchId: number) => http.post<MatchResponse>(`/matches/${matchId}/join`, {}).then((r) => r.data),
};

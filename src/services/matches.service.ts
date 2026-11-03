import { http } from '@/services/http';
import type { MatchDetail, MatchResponse, Page, PageParams, SetScore } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

export type Coordinates = { latitude: number; longitude: number };

export type MatchCreateInput = {
  matchType: 'FRIEND' | 'COMMUNITY' | 'LOCATION';
  format: 'BO3' | 'BO5' | 'BO7';
  opponentId?: number;
  communityId?: number;
} & Partial<Coordinates>;

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

  open: (location: Coordinates, signal?: AbortSignal) =>
    http.get<MatchResponse[]>('/matches/open', { params: location, signal }).then((r) => r.data),

  get: (matchId: number, signal?: AbortSignal) => http.get<MatchDetail>(`/matches/${matchId}`, { signal }).then((r) => r.data),

  submitScore: (matchId: number, sets: SetScore[]) =>
    http.post<MatchDetail>(`/matches/${matchId}/submit`, { sets }).then((r) => r.data),

  confirm: (matchId: number) => http.put<MatchDetail>(`/matches/${matchId}/confirm`).then((r) => r.data),

  dispute: (matchId: number, reason: string) =>
    http.put<MatchDetail>(`/matches/${matchId}/dispute`, { reason }).then((r) => r.data),

  create: (input: MatchCreateInput) => http.post<MatchResponse>('/matches', input).then((r) => r.data),

  join: (matchId: number, location: Coordinates) =>
    http.post<MatchResponse>(`/matches/${matchId}/join`, location).then((r) => r.data),
};

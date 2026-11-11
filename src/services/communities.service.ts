import { http } from '@/services/http';
import type { CommunityResponse, Page, PageParams, RankingEntry } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

export type CommunityType = CommunityResponse['communityType'];

export type CommunityCreateInput = { name: string; description?: string; communityType: CommunityType };

type CommunityDetail = CommunityResponse & { creatorName: string | null; isMember: boolean; myRole: 'MEMBER' | 'COMMUNITY_ADMIN' | null };

export const communitiesService = {
  detail: (id: number, signal?: AbortSignal) =>
    http.get<CommunityDetail>(`/communities/${id}`, { signal }).then((r) => r.data),

  leave: (id: number, playerId: number) => http.delete(`/communities/${id}/members/${playerId}`),
  create: (input: CommunityCreateInput) => http.post<CommunityResponse>('/communities', input).then((r) => r.data),

  search: (params: PageParams & { name?: string }, signal?: AbortSignal) =>
    http.get('/communities', { params, signal }).then((r) => normalizePage<CommunityResponse>(r.data)),

  mine: (signal?: AbortSignal) => http.get<CommunityResponse[]>('/communities/me', { signal }).then((r) => r.data),

  ranking: (communityId: number, params: PageParams, signal?: AbortSignal): Promise<Page<RankingEntry>> =>
    http.get(`/communities/${communityId}/ranking`, { params, signal }).then((r) => normalizePage<RankingEntry>(r.data)),

  join: (communityId: number) => http.post<unknown>(`/communities/${communityId}/members`, {}).then((r) => r.data),
};

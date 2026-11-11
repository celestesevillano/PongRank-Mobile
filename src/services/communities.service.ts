import { http } from '@/services/http';
import type { CommunityResponse, Page, PageParams, RankingEntry } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

export type CommunityType = CommunityResponse['communityType'];

export type CommunityCreateInput = { name: string; description?: string; communityType: CommunityType; customLabel?: string };

export type CommunityRole = 'MEMBER' | 'COMMUNITY_ADMIN';
export type CommunityMember = { playerId: number; playerName: string; role: CommunityRole };

type CommunityDetail = CommunityResponse & {
  creatorName: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  isMember: boolean;
  myRole: CommunityRole | null;
  adminCount?: number;
};

export const communitiesService = {
  detail: (id: number, signal?: AbortSignal) =>
    http.get<CommunityDetail>(`/communities/${id}`, { signal }).then((r) => r.data),

  removeMember: (id: number, playerId: number) => http.delete(`/communities/${id}/members/${playerId}`),

  archive: (id: number) => http.delete(`/communities/${id}`),

  members: (id: number, params: PageParams, signal?: AbortSignal) =>
    http.get(`/communities/${id}/members`, { params, signal }).then((r) => normalizePage<CommunityMember>(r.data)),

  setRole: (id: number, playerId: number, role: CommunityRole) =>
    http.patch(`/communities/${id}/members/${playerId}/role`, { role }),
  create: (input: CommunityCreateInput) => http.post<CommunityResponse>('/communities', input).then((r) => r.data),

  search: (params: PageParams & { name?: string }, signal?: AbortSignal) =>
    http.get('/communities', { params, signal }).then((r) => normalizePage<CommunityResponse>(r.data)),

  mine: (signal?: AbortSignal) => http.get<CommunityResponse[]>('/communities/me', { signal }).then((r) => r.data),

  ranking: (communityId: number, params: PageParams, signal?: AbortSignal): Promise<Page<RankingEntry>> =>
    http.get(`/communities/${communityId}/ranking`, { params, signal }).then((r) => normalizePage<RankingEntry>(r.data)),

  join: (communityId: number) => http.post<unknown>(`/communities/${communityId}/members`, {}).then((r) => r.data),
};

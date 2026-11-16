import { http } from '@/services/http';
import type { PageParams, PlayerSummary } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

export type Club = {
  id: number;
  name: string;
  address: string;
  description?: string | null;
  creatorName?: string | null;
  memberCount?: number | null;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DELETED';
  planExpiresAt?: string | null;
  deletionScheduledAt?: string | null;
  admin?: PlayerSummary;
};

export type ClubMembership = {
  id: number;
  clubId: number;
  clubName: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'CANCELLED' | 'LEFT';
  role: 'CLUB_ADMIN' | 'MEMBER';
  player?: PlayerSummary;
};

export type ClubAnnouncement = { id: number; title: string; body: string; authorName: string; createdAt: string };

type ClubIdentity = { name: string; address: string; description?: string };
type ClubRegistration = ClubIdentity & { affiliationDocumentUrl: string };
export type ClubReview = Club & { affiliationDocumentUrl: string; rejectionReason?: string };
export const clubsService = {
  search: (params: PageParams & { name?: string }, signal?: AbortSignal) =>
    http.get('/clubs', { params, signal }).then(({ data }) => normalizePage<Club>(data)),

  detail: (id: number, signal?: AbortSignal) =>
    http.get<Club>(`/clubs/${id}`, { signal }).then(({ data }) => data),

  managed: (signal?: AbortSignal) =>
    http.get<Club[]>('/clubs/me', { signal }).then(({ data }) => data),

  async memberships(playerId: number, signal?: AbortSignal, includeInactive = false) {
    const active: ClubMembership[] = [];
    let page = 0;
    while (true) {
      const { data } = await http.get(`/club-memberships/players/${playerId}`, { params: { page, size: 50 }, signal });
      const result = normalizePage<ClubMembership>(data);
      active.push(...result.content.filter(({ status }) => includeInactive || status === 'APPROVED' || status === 'PENDING'));
      if (result.last) return active;
      page += 1;
    }
  },

  update: (id: number, input: ClubIdentity) =>
    http.patch<Club>(`/clubs/${id}`, input).then(({ data }) => data),

  review: (id: number, signal?: AbortSignal) =>
    http.get<ClubReview>(`/clubs/${id}/review`, { signal }).then(({ data }) => data),

  resubmit: (id: number, affiliationDocumentUrl: string) =>
    http.patch(`/clubs/${id}/resubmit`, { affiliationDocumentUrl }),

  requestMembership: (clubId: number) => http.post('/club-memberships', { clubId }),
  cancelMembership: (id: number) => http.patch(`/club-memberships/${id}/cancel`),
  leave: (id: number) => http.patch(`/club-memberships/${id}/leave`),

  people: (clubId: number, list: 'members' | 'pending', params: PageParams, signal?: AbortSignal) =>
    http.get(`/club-memberships/clubs/${clubId}/${list}`, { params, signal })
      .then(({ data }) => normalizePage<ClubMembership>(data)),

  async allMembers(clubId: number, signal?: AbortSignal) {
    const members: ClubMembership[] = [];
    for (let page = 0; ; page += 1) {
      const result = await clubsService.people(clubId, 'members', { page, size: 100 }, signal);
      members.push(...result.content);
      if (result.last) return members;
    }
  },

  reviewMembership: (id: number, decision: 'approve' | 'reject') => http.patch(`/club-memberships/${id}/${decision}`),

  remove: (clubId: number) => http.delete(`/clubs/${clubId}`),

  transferCandidates: (clubId: number, signal?: AbortSignal) =>
    http.get<PlayerSummary[]>(`/clubs/${clubId}/transfer-candidates`, { signal }).then(({ data }) => data),

  transfer: (clubId: number, newAdminPlayerId: number) => http.patch(`/clubs/${clubId}/admin`, { newAdminPlayerId }),

  announcements: (clubId: number, params: PageParams, signal?: AbortSignal) =>
    http.get(`/clubs/${clubId}/announcements`, { params, signal })
      .then(({ data }) => normalizePage<ClubAnnouncement>(data)),

  publish: (clubId: number, draft: { title: string; body: string }) => http.post(`/clubs/${clubId}/announcements`, draft),

  register: (input: ClubRegistration) => http.post<Club>('/clubs', input).then(({ data }) => data),
};

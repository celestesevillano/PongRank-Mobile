import { http } from '@/services/http';
import type { PageParams } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

export type Club = {
  id: number;
  name: string;
  address: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
};

type ClubMembership = {
  clubId: number;
  clubName: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'CANCELLED' | 'LEFT';
  role: 'CLUB_ADMIN' | 'MEMBER';
};

type ClubRegistration = { name: string; address: string; affiliationDocumentUrl: string };

export const clubsService = {
  search: (params: PageParams & { name?: string }, signal?: AbortSignal) =>
    http.get('/clubs', { params, signal }).then(({ data }) => normalizePage<Club>(data)),

  detail: (id: number, signal?: AbortSignal) =>
    http.get<Club>(`/clubs/${id}`, { signal }).then(({ data }) => data),

  managed: (signal?: AbortSignal) =>
    http.get<Club[]>('/clubs/me', { signal }).then(({ data }) => data),

  async memberships(playerId: number, signal?: AbortSignal) {
    const active: ClubMembership[] = [];
    let page = 0;
    while (true) {
      const { data } = await http.get(`/club-memberships/players/${playerId}`, { params: { page, size: 50 }, signal });
      const result = normalizePage<ClubMembership>(data);
      active.push(...result.content.filter(({ status }) => status === 'APPROVED' || status === 'PENDING'));
      if (result.last) return active;
      page += 1;
    }
  },

  register: (input: ClubRegistration) => http.post<Club>('/clubs', input).then(({ data }) => data),
};

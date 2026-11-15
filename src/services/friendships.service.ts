import { http } from '@/services/http';
import type { PlayerSummary } from '@/types/api';

export type Friendship = {
  id: number;
  playerA: PlayerSummary;
  playerB: PlayerSummary;
  status: string;
};

export type PongmigosVisibility = 'EVERYONE' | 'ONLY_ME';

export const friendshipsService = {
  getVisibility: (signal?: AbortSignal) =>
    http.get<{ visibility: PongmigosVisibility }>('/friendships/me/visibility', { signal }).then(({ data }) => data),
  updateVisibility: (visibility: PongmigosVisibility) =>
    http.patch<{ visibility: PongmigosVisibility }>('/friendships/me/visibility', { visibility }).then(({ data }) => data),
  accepted: (playerId: number, signal?: AbortSignal) =>
    http.get<Friendship[]>(`/friendships/players/${playerId}`, { signal }).then((response) => response.data),
  received: (playerId: number, signal?: AbortSignal) =>
    http.get<Friendship[]>(`/friendships/players/${playerId}/pending`, { signal }).then((response) => response.data),
  sent: (playerId: number, signal?: AbortSignal) =>
    http.get<Friendship[]>(`/friendships/players/${playerId}/sent`, { signal }).then((response) => response.data),
  send: (receiverId: number) => http.post<Friendship>('/friendships/requests', { receiverId }),
  accept: (id: number) => http.patch<Friendship>(`/friendships/${id}/accept`),
  reject: (id: number) => http.patch<Friendship>(`/friendships/${id}/reject`),
  cancel: (id: number) => http.delete(`/friendships/${id}/cancel`),
  remove: (id: number) => http.delete(`/friendships/${id}`),
};

export const friendOf = (friendship: Friendship, myId: number) =>
  friendship.playerA.id === myId ? friendship.playerB : friendship.playerA;

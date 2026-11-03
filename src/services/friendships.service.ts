import { http } from '@/services/http';
import type { PlayerSummary } from '@/types/api';

export type Friendship = { id: number; playerA: PlayerSummary; playerB: PlayerSummary; status: string };

export const friendshipsService = {
  accepted: (playerId: number, signal?: AbortSignal) =>
    http.get<Friendship[]>(`/friendships/players/${playerId}`, { signal }).then((r) => r.data),
};

/** El amigo es el jugador de la amistad que no soy yo. */
export const friendOf = (friendship: Friendship, myId: number) =>
  friendship.playerA.id === myId ? friendship.playerB : friendship.playerA;

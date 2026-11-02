import { http } from '@/services/http';
import type { PlayerResponse } from '@/types/api';

export type PlayerUpdate = Partial<{
  name: string;
  whatsapp: string;
  shareContact: boolean;
  categoryFdptm: string;
  federatedDeclared: boolean;
}>;

export const playersService = {
  update: (playerId: number, input: PlayerUpdate) =>
    http.patch<PlayerResponse>(`/players/${playerId}`, input).then((r) => r.data),
};

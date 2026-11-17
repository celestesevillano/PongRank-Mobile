import { http } from '@/services/http';
import type { PlayerSummary } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

export type TournamentFormat = 'BO3' | 'BO5' | 'BO7';
export type Tournament = {
  id: number;
  name: string;
  clubId: number;
  clubName: string;
  matchFormat: TournamentFormat;
  directElimination: boolean;
  status: 'OPEN' | 'GROUP_STAGE' | 'KNOCKOUT_STAGE' | 'FINISHED';
  startDate: string | null;
  winner: PlayerSummary | null;
};
type Fixture = {
  id: number;
  stage: 'GROUP' | 'KNOCKOUT';
  round: number;
  bracketPosition: number;
  player1: PlayerSummary | null;
  player2: PlayerSummary | null;
  winner: PlayerSummary | null;
  matchId: number | null;
  status: 'PENDING_PLAYERS' | 'SCHEDULED' | 'COMPLETED' | 'WALKOVER' | 'BYE';
};
type Participant = { player: PlayerSummary; seed: number };

export const tournamentsService = {
  list: (clubId: number, params: { page: number; size: number }, signal: AbortSignal) =>
    http.get(`/tournaments/clubs/${clubId}`, { params, signal }).then(({ data }) => normalizePage<Tournament>(data)),
  detail: async (id: number, signal: AbortSignal) => {
    const [tournament, participants, matches] = await Promise.all([
      http.get<Tournament>(`/tournaments/${id}`, { signal }),
      http.get<Participant[]>(`/tournaments/${id}/participants`, { signal }),
      http.get<Fixture[]>(`/tournaments/${id}/matches`, { signal }),
    ]);
    return { tournament: tournament.data, participants: participants.data, matches: matches.data };
  },
  withdraw: (matchId: number) => http.post(`/tournaments/direct-elimination/matches/${matchId}/withdraw`),
  publish: (draft: { clubId: number; name: string; matchFormat: TournamentFormat; scheduledAt: string; playerIds: number[]; publicationKey: string }) =>
    http.post<Tournament>('/tournaments/direct-elimination', draft).then(({ data }) => data),
};

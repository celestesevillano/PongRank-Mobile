export type PlayerResponse = {
  id: number;
  name: string;
  email: string;
  whatsapp: string | null;
  shareContact: boolean;
  categoryFdptm: string | null;
  federatedDeclared: boolean;
  ratingGlicko: number;
  ratingDeviation: number;
  volatility: number;
  role: string;
  status: string;
};

export type AuthResponse = {
  token: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  player: PlayerResponse;
};

export type CommunityResponse = {
  id: number;
  name: string;
  description: string | null;
  communityType: 'UNIVERSITY' | 'SCHOOL' | 'PUBLIC_PARK' | 'OTHER';
  memberCount: number;
};

export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type PageParams = { page?: number; size?: number };

export type PlayerSummary = {
  id: number;
  name: string;
  ratingGlicko: number;
  categoryFdptm: string | null;
  federatedDeclared: boolean | null;
  whatsapp: string | null;
};

export type MatchStatus = string;

export type MatchResponse = {
  id: number;
  player1: PlayerSummary;
  player2: PlayerSummary | null;
  communityId: number | null;
  communityName: string | null;
  tournamentId: number | null;
  tournamentName: string | null;
  format: 'BO3' | 'BO5' | 'BO7';
  matchType: 'FRIEND' | 'COMMUNITY' | 'LOCATION' | 'TOURNAMENT';
  status: MatchStatus;
  latitude: number | null;
  longitude: number | null;
  scoreSummary: string | null;
  winnerId: number | null;
  ratingDeltaP1: number | null;
  ratingDeltaP2: number | null;
  createdAt: string;
  confirmedAt: string | null;
};

export type RankingEntry = {
  position: number;
  playerId: number;
  playerName: string;
  ratingGlicko: number;
  ratingDeviation: number;
};

export type TrainingSessionResponse = {
  id: number;
  player: PlayerSummary;
  swingVelocityMax: number;
  postureScore: number;
  kneeFlexionAngle: number | null;
  shoulderRotationAngle: number | null;
  durationSeconds: number;
  createdAt: string;
  newPersonalBest: boolean;
};

export type MatchSet = {
  id: number;
  setNumber: number;
  scorePlayer1: number;
  scorePlayer2: number;
  winnerPlayerNumber: 1 | 2;
};

export type MatchDetail = MatchResponse & {
  disputeReason: string | null;
  sets: MatchSet[];
};

export type SetScore = { setNumber: number; scorePlayer1: number; scorePlayer2: number };

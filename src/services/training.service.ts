import { http } from '@/services/http';
import type { PageParams, TrainingSessionResponse } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

export type TrainingSessionInput = {
  swingVelocityMax: number;
  postureScore: number;
  durationSeconds: number;
  kneeFlexionAngle?: number;
  shoulderRotationAngle?: number;
};

export const trainingService = {
  submit: (input: TrainingSessionInput) =>
    http.post<TrainingSessionResponse>('/training-sessions', input).then((r) => r.data),

  history: (playerId: number, params: PageParams, signal?: AbortSignal) =>
    http
      .get(`/training-sessions/players/${playerId}`, { params, signal })
      .then((r) => normalizePage<TrainingSessionResponse>(r.data)),

  best: (playerId: number, signal?: AbortSignal) =>
    http.get<TrainingSessionResponse>(`/training-sessions/players/${playerId}/best`, { signal }).then((r) => r.data),
};

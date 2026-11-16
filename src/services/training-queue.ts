import { storage } from '@/lib/storage';
import { trainingService, type TrainingSessionInput } from '@/services/training.service';
import type { TrainingSessionResponse } from '@/types/api';
import { toApiError } from '@/utils/api-error';

const MAX_PENDING = 5;

export type PendingSession = TrainingSessionInput & { savedAt: string };

const keyFor = (playerId: number) => `coach.pending.${playerId}`;

export const isRetryableFailure = (error: unknown) => {
  const apiError = toApiError(error);
  return apiError.isNetwork || (apiError.status !== null && apiError.status >= 500);
};

async function read(playerId: number): Promise<PendingSession[]> {
  try {
    const raw = await storage.getItem(keyFor(playerId));
    return raw ? (JSON.parse(raw) as PendingSession[]) : [];
  } catch {
    return [];
  }
}

async function write(playerId: number, sessions: PendingSession[]) {
  if (sessions.length === 0) await storage.deleteItem(keyFor(playerId));
  else await storage.setItem(keyFor(playerId), JSON.stringify(sessions));
}

export const trainingQueue = {
  list: read,

  async enqueue(playerId: number, session: TrainingSessionInput) {
    const pending = await read(playerId);
    await write(playerId, [...pending, { ...session, savedAt: new Date().toISOString() }].slice(-MAX_PENDING));
  },

  async flush(playerId: number) {
    const pending = await read(playerId);
    const sent: TrainingSessionResponse[] = [];
    const remaining: PendingSession[] = [];
    for (let index = 0; index < pending.length; index++) {
      const { savedAt: _savedAt, ...input } = pending[index];
      try {
        sent.push(await trainingService.submit(input));
      } catch (error) {
        if (isRetryableFailure(error)) {
          remaining.push(...pending.slice(index));
          break;
        }
      }
    }
    await write(playerId, remaining);
    return { sent, remaining: remaining.length };
  },
};

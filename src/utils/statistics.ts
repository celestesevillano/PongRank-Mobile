import type { MatchResponse } from '@/types/api';

export const STATISTICS_PERIODS = ['Semana', 'Mes', 'Todo'] as const;
export type StatisticsPeriod = typeof STATISTICS_PERIODS[number];

const DAY = 86_400_000;

export type RatingPoint = { id: number; date: number; rating: number; delta: number };

export function computeStatistics(matches: MatchResponse[], playerId: number, rating: number) {
  const results = matches.flatMap((match) => {
    if (match.status !== 'CONFIRMED' || !match.player2) return [];
    const isPlayer1 = match.player1.id === playerId;
    if (!isPlayer1 && match.player2.id !== playerId) return [];
    if (match.winnerId !== match.player1.id && match.winnerId !== match.player2.id) return [];

    return [{
      id: match.id,
      date: new Date(match.confirmedAt ?? match.createdAt).getTime(),
      hasConfirmationDate: Boolean(match.confirmedAt),
      won: match.winnerId === playerId,
      opponent: isPlayer1 ? match.player2 : match.player1,
      delta: isPlayer1 ? match.ratingDeltaP1 : match.ratingDeltaP2,
    }];
  }).sort((a, b) => b.date - a.date || b.id - a.id);

  const wins = results.filter((result) => result.won);
  const best = wins.filter(({ opponent }) => Number.isFinite(opponent.ratingGlicko))
    .reduce<typeof wins[number] | null>((highest, result) =>
      !highest || result.opponent.ratingGlicko > highest.opponent.ratingGlicko ? result : highest, null) ?? wins[0];

  const firstLoss = results.findIndex(({ won }) => !won);
  const points: RatingPoint[] = [];
  let runningRating = rating;
  let missingRatingDate = -Infinity;
  for (const result of results) {
    if (result.delta == null || !Number.isFinite(result.delta) || !result.hasConfirmationDate || !Number.isFinite(result.date)) {
      missingRatingDate = Number.isFinite(result.date) ? result.date : Infinity;
      break;
    }
    points.push({ id: result.id, date: result.date, rating: runningRating, delta: result.delta });
    runningRating -= result.delta;
  }

  return {
    results, points: points.reverse(), missingRatingDate, best,
    wins: wins.length,
    losses: results.length - wins.length,
    streak: firstLoss === -1 ? results.length : firstLoss,
  };
}

export function filterRating(
  stats: ReturnType<typeof computeStatistics>, period: StatisticsPeriod, now: number,
) {
  const since = period === 'Todo' ? -Infinity : now - (period === 'Semana' ? 7 : 30) * DAY;
  const points = stats.points.filter(({ date }) => date >= since);
  const incomplete = stats.missingRatingDate !== -Infinity && stats.missingRatingDate >= since;
  return {
    points,
    incomplete,
    delta: !incomplete && points.length > 0 ? points.reduce((sum, point) => sum + point.delta, 0) : null,
  };
}

export function streakMessage(streak: number) {
  if (streak >= 10) return '¡Estás jugando en otra liga!';
  if (streak >= 5) return '¡Imparable en la mesa!';
  if (streak >= 3) return '¡Estás en racha!';
  if (streak > 0) return '¡Así se empieza!';
  return '¡La próxima puede ser el comienzo!';
}

export function monthlyResults(stats: ReturnType<typeof computeStatistics>, now: number) {
  const recent = stats.results.filter(({ date, hasConfirmationDate }) => hasConfirmationDate && date >= now - 30 * DAY);
  return recent.length >= 3
    ? { played: recent.length, wins: recent.filter(({ won }) => won).length }
    : null;
}

import type { SetScore } from '@/types/api';

const POINTS_TO_WIN_SET = 11;
const MIN_LEAD = 2;
const SETS_TO_WIN = { BO3: 2, BO5: 3, BO7: 4 } as const;

export type MatchFormat = keyof typeof SETS_TO_WIN;

export function setWinner(score: Pick<SetScore, 'scorePlayer1' | 'scorePlayer2'>): 1 | 2 | null {
  const { scorePlayer1: a, scorePlayer2: b } = score;
  if (Math.max(a, b) >= POINTS_TO_WIN_SET && Math.abs(a - b) >= MIN_LEAD) return a > b ? 1 : 2;
  return null;
}

export function setsWon(sets: SetScore[]) {
  return sets.reduce(
    (won, set) => {
      const winner = setWinner(set);
      if (winner === 1) won.player1 += 1;
      if (winner === 2) won.player2 += 1;
      return won;
    },
    { player1: 0, player2: 0 },
  );
}

export function matchWinner(sets: SetScore[], format: MatchFormat): 1 | 2 | null {
  const won = setsWon(sets);
  if (won.player1 >= SETS_TO_WIN[format]) return 1;
  if (won.player2 >= SETS_TO_WIN[format]) return 2;
  return null;
}

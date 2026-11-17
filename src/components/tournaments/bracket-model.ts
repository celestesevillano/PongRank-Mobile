const MIN_TOURNAMENT_PARTICIPANTS = 4;
const PARTICIPANT_MULTIPLE = 4;

export function validateParticipantCount(count: number): string | null {
  if (count < MIN_TOURNAMENT_PARTICIPANTS) {
    return 'Necesitas al menos 4 participantes';
  }
  if (!Number.isSafeInteger(count) || count % PARTICIPANT_MULTIPLE !== 0) {
    return 'El total de participantes debe ser múltiplo de 4';
  }
  return null;
}

export type Entrant = { id: number; name: string; rating: number };
export type Slot = { name: string; entry?: 'Directo' | 'Preliminar'; seed?: number; won?: boolean };
export type Bout = { id: string; title: string; slots: [Slot, Slot]; feeds?: string };
export type Round = { title: string; bouts: Bout[] };

const winner = (bout: Bout): Slot => ({ name: `Ganador de ${bout.title.toLowerCase()}` });

function seedOrder(size: number) {
  if (size === 16) return [1, 16, 8, 9, 5, 12, 4, 13, 3, 14, 6, 11, 7, 10, 2, 15];
  let order = [1, 2];
  while (order.length < size) {
    const next = order.length * 2 + 1;
    order = order.flatMap((seed) => [seed, next - seed]);
  }
  return order;
}

export function buildBracket(entrants: readonly Entrant[]) {
  if (validateParticipantCount(entrants.length)) return null;
  const ranked = [...entrants].sort((a, b) => b.rating - a.rating || a.id - b.id);
  const principal = 2 ** Math.floor(Math.log2(ranked.length));
  const prelimCount = ranked.length - principal;
  const directCount = principal - prelimCount;
  const preliminary: Bout[] = Array.from({ length: prelimCount }, (_, i) => ({
    id: `pre-${i}`,
    title: `Preliminar ${i + 1}`,
    slots: [
      { name: ranked[directCount + i].name, entry: 'Preliminar', seed: directCount + i + 1 },
      { name: ranked[ranked.length - i - 1].name, entry: 'Preliminar', seed: ranked.length - i },
    ],
  }));

  const rounds: Round[] = [];
  const order = seedOrder(principal);
  const slot = (seed: number, recipient: string): Slot => {
    if (seed <= directCount) return { name: ranked[seed - 1].name, entry: 'Directo', seed };
    const bout = preliminary[seed - directCount - 1];
    bout.feeds = recipient;
    return winner(bout);
  };

  let previous: Bout[] = [];
  for (let count = principal / 2, index = 0; count >= 1; count /= 2, index++) {
    const title = count === 1 ? 'Final' : count === 2 ? 'Semifinales' : count === 4 ? 'Cuartos' : count === 8 ? 'Octavos' : `Ronda de ${count * 2}`;
    const matchTitle = count === 2 ? 'Semifinal' : title;
    const bouts = Array.from({ length: count }, (_, i): Bout => {
      const id = `round-${index}-${i}`;
      const slots: [Slot, Slot] = index === 0
        ? [slot(order[i * 2], id), slot(order[i * 2 + 1], id)]
        : [winner(previous[i * 2]), winner(previous[i * 2 + 1])];
      return { id, title: count === 1 ? title : `${matchTitle} ${i + 1}`, slots };
    });
    previous.forEach((bout, i) => { bout.feeds = bouts[Math.floor(i / 2)].id; });
    rounds.push({ title, bouts });
    previous = bouts;
  }
  return { preliminary, directCount, principal, rounds };
}

export type Bracket = NonNullable<ReturnType<typeof buildBracket>>;

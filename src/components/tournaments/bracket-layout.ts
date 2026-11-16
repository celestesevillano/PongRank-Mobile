import type { Bout, Bracket } from './bracket-model';

export const CARD = 156;
const STEP = 194;
const PITCH = 102;
export const HEIGHT = 84;

type Node = { bout: Bout; x: number; y: number; final?: boolean };

export function positionBracket(bracket: Bracket) {
  const depth = bracket.rounds.length - 1;
  const outer = depth + Number(bracket.preliminary.length > 0);
  const perTarget = new Map<string, Bout[]>();
  for (const bout of bracket.preliminary) {
    if (bout.feeds) perTarget.set(bout.feeds, [...(perTarget.get(bout.feeds) ?? []), bout]);
  }
  const pitch = [...perTarget.values()].some((bouts) => bouts.length > 1) ? 2 * PITCH : PITCH;
  const width = CARD + 24 + outer * 2 * STEP;
  const centerX = width / 2;
  const firstPerSide = Math.max(1, bracket.rounds[0].bouts.length / 2);
  const height = Math.max(260, firstPerSide * pitch + 52);
  const centerY = height / 2;
  const nodes = new Map<string, Node>();
  const headers: { title: string; x: number }[] = [];

  bracket.rounds.forEach(({ title, bouts }, round) => {
    const final = bouts.length === 1;
    const sideCount = bouts.length / 2;
    const distance = (depth - round) * STEP;
    for (const side of final ? [0] : [-1, 1]) {
      headers.push({ title, x: centerX + side * distance - CARD / 2 });
    }
    bouts.forEach((bout, index) => {
      const side = final ? 0 : index < sideCount ? -1 : 1;
      const row = final ? 0 : index % sideCount - (sideCount - 1) / 2;
      nodes.set(bout.id, { bout, x: centerX + side * distance, y: centerY + row * pitch * 2 ** round, final });
    });
  });

  if (bracket.preliminary.length) {
    for (const side of [-1, 1]) {
      headers.push({ title: 'Preliminar', x: centerX + side * outer * STEP - CARD / 2 });
    }
    bracket.preliminary.forEach((bout) => {
      const target = bout.feeds ? nodes.get(bout.feeds) : undefined;
      if (!target) return;
      const siblings = perTarget.get(target.bout.id) ?? [];
      const row = siblings.length > 1 ? (siblings[0] === bout ? -1 : 1) * (HEIGHT / 2 + 2) : 0;
      const side = Math.sign(target.x - centerX);
      nodes.set(bout.id, { bout, x: centerX + side * outer * STEP, y: target.y + row });
    });
  }

  const edges = [...nodes.values()].flatMap((node) => {
    const to = node.bout.feeds ? nodes.get(node.bout.feeds) : undefined;
    if (!to) return [];
    const side = Math.sign(to.x - node.x);
    const fromX = node.x + side * CARD / 2;
    const toX = to.x - side * CARD / 2;
    const join = (fromX + toX) / 2;
    return [{ id: node.bout.id, path: `M ${fromX} ${node.y} H ${join} V ${to.y} H ${toX}` }];
  });
  return { width, height, nodes: [...nodes.values()], headers, edges };
}

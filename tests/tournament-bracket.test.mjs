import assert from 'node:assert/strict';
import test from 'node:test';

import { positionBracket } from '../src/components/tournaments/bracket-layout.ts';
import { buildBracket, validateParticipantCount } from '../src/components/tournaments/bracket-model.ts';

function entrants(count) {
  return Array.from({ length: count }, (_, index) => {
    const seed = count - index;
    return { id: seed, name: `Jugador ${seed}`, rating: 2000 - seed };
  });
}

test('Cuatro es el mínimo para generar la llave', () => {
  for (const count of [0, 1, 2, 3]) assert.equal(buildBracket(entrants(count)), null);
});

test('El total debe ser múltiplo de cuatro', () => {
  for (const count of [5, 6, 17]) {
    assert.equal(buildBracket(entrants(count)), null);
    assert.equal(validateParticipantCount(count), 'El total de participantes debe ser múltiplo de 4');
  }
  assert.equal(validateParticipantCount(3), 'Necesitas al menos 4 participantes');
  assert.equal(validateParticipantCount(20), null);
});

test('16 jugadores: octavos simétricos y dos mitades que convergen en una final', () => {
  const bracket = buildBracket(entrants(16));
  const { width, height, nodes, headers, edges } = positionBracket(bracket);
  const final = nodes.find((node) => node.final);
  assert.deepEqual([final.x, final.y], [width / 2, height / 2]);
  assert.equal(nodes.filter((node) => node.final).length, 1);

  const octavos = bracket.rounds[0].bouts;
  assert.deepEqual(octavos.map(({ slots }) => slots.map(({ seed }) => seed)), [
    [1, 16], [8, 9], [5, 12], [4, 13], [3, 14], [6, 11], [7, 10], [2, 15],
  ]);

  for (const [roundIndex, { bouts }] of bracket.rounds.slice(0, -1).entries()) {
    const half = bouts.length / 2;
    for (const [index, bout] of bouts.entries()) {
      const from = nodes.find((node) => node.bout === bout);
      const to = nodes.find((node) => node.bout.id === bout.feeds);
      const nextRound = bracket.rounds[roundIndex + 1];
      assert.equal(to.bout, nextRound.bouts[Math.floor(index / 2)]);
      assert.equal(Math.sign(from.x - final.x), index < half ? -1 : 1);
      assert.ok(Math.abs(to.x - final.x) < Math.abs(from.x - final.x));
      assert.ok(edges.some(({ id }) => id === bout.id));
    }
    for (let index = 0; index < half; index++) {
      const left = nodes.find((node) => node.bout === bouts[index]);
      const right = nodes.find((node) => node.bout === bouts[index + half]);
      assert.equal(left.y, right.y);
      assert.equal(left.x + right.x, width);
    }
  }
  assert.deepEqual(headers.sort((a, b) => a.x - b.x).map(({ title }) => title),
    ['Octavos', 'Cuartos', 'Semifinales', 'Final', 'Semifinales', 'Cuartos', 'Octavos']);
});

for (const [count, principal, preliminaries, direct, openingRound] of [
  [4, 4, 0, 4, 'Semifinales'],
  [8, 8, 0, 8, 'Cuartos'],
  [12, 8, 4, 4, 'Cuartos'],
  [16, 16, 0, 16, 'Octavos'],
  [20, 16, 4, 12, 'Octavos'],
  [32, 32, 0, 32, 'Ronda de 32'],
]) {
  test(`${count} jugadores: pases por ranking y cruces conectados`, () => {
    const players = entrants(count);
    const bracket = buildBracket(players);
    assert.deepEqual(players, entrants(count));
    assert.deepEqual([bracket.principal, bracket.preliminary.length, bracket.directCount], [principal, preliminaries, direct]);

    const first = bracket.rounds[0];
    assert.equal(first.title, openingRound);
    const firstSlots = first.bouts.flatMap(({ slots }) => slots);
    assert.equal(firstSlots.length, principal);
    const directSeeds = firstSlots.filter(({ entry }) => entry === 'Directo').map(({ seed }) => seed);
    assert.deepEqual(directSeeds.sort((a, b) => a - b), Array.from({ length: direct }, (_, index) => index + 1));
    const prelimSeeds = bracket.preliminary.flatMap(({ slots }) => slots.map(({ entry, seed }) => {
      assert.equal(entry, 'Preliminar');
      return seed;
    }));
    assert.deepEqual(prelimSeeds.sort((a, b) => a - b), Array.from({ length: count - direct }, (_, index) => direct + index + 1));

    const { nodes, width } = positionBracket(bracket);
    const firstNodes = first.bouts.map((bout) => nodes.find((node) => node.bout === bout));
    const findSeed = (seed) => firstNodes.find(({ bout }) => bout.slots.some((slot) => slot.seed === seed));
    assert.ok(findSeed(1).x < width / 2);
    assert.ok(findSeed(2).x > width / 2);

    for (const bout of bracket.preliminary) {
      const source = nodes.find((node) => node.bout === bout);
      const target = firstNodes.find((node) => node.bout.id === bout.feeds);
      assert.ok(target.bout.slots.some(({ name }) => name === `Ganador de ${bout.title.toLowerCase()}`));
      assert.equal(Math.sign(source.x - width / 2), Math.sign(target.x - width / 2));
      assert.ok(Math.abs(source.x - width / 2) > Math.abs(target.x - width / 2));
    }
  });
}

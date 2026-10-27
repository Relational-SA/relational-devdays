import {
  ROUNDS_PER_CATEGORY,
  advance,
  correctGuess,
  currentCategory,
  newGame,
  pickNext,
} from './game-engine';
import { Category, Fact, QuestionPack } from './question-pack';

function category(id: string, values: number[]): Category {
  return {
    id,
    title: id,
    caption: 'Made up.',
    format: 'integer',
    unit: '',
    question: 'More or fewer than {name}?',
    higher: 'More',
    lower: 'Fewer',
    items: values.map((value, index) => fact(`${id}-${index}`, value)),
  };
}

function fact(id: string, value: number): Fact {
  return { id, name: id, detail: '', value, source: 'https://example.org', asOf: '2026' };
}

/** A repeatable stand-in for Math.random (mulberry32). */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('game engine', () => {
  const pack: QuestionPack = {
    id: 'test',
    categories: [category('a', [1, 2, 3, 4, 5, 6, 7, 8]), category('b', [10, 20, 30, 40, 50, 60])],
  };

  it('deals two facts of one category with different values', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const game = newGame(pack, seeded(seed));
      const facts = currentCategory(game).items;

      expect(facts).toContain(game.left);
      expect(facts).toContain(game.right);
      expect(game.right.value).not.toBe(game.left.value);
      expect(game.score).toBe(0);
    }
  });

  it('knows the right guess', () => {
    const game = newGame(pack, seeded(7));

    expect(correctGuess({ ...game, left: fact('x', 1), right: fact('y', 2) })).toBe('higher');
    expect(correctGuess({ ...game, left: fact('x', 2), right: fact('y', 1) })).toBe('lower');
  });

  it('moves the second card to the first after a right guess', () => {
    const random = seeded(3);
    const game = newGame(pack, random);
    const next = advance(game, random);

    expect(next.score).toBe(1);
    expect(next.left).toBe(game.right);
    expect(currentCategory(next)).toBe(currentCategory(game));
  });

  it(`moves to the next category after ${ROUNDS_PER_CATEGORY} right guesses`, () => {
    const random = seeded(5);
    let game = newGame(pack, random);
    const first = currentCategory(game);
    for (let round = 1; round < ROUNDS_PER_CATEGORY; round++) {
      game = advance(game, random);
      expect(currentCategory(game)).toBe(first);
    }
    game = advance(game, random);

    expect(currentCategory(game)).not.toBe(first);
    expect(game.score).toBe(ROUNDS_PER_CATEGORY);
  });

  it('keeps the chain going in a game of one category, and deals every fact once', () => {
    const single: QuestionPack = { id: 'one', categories: [category('a', [1, 2, 3, 4, 5, 6, 7, 8])] };
    for (let seed = 1; seed <= 20; seed++) {
      const random = seeded(seed);
      let game = newGame(single, random);
      const dealt = [game.left.id, game.right.id];
      // Past ROUNDS_PER_CATEGORY: there is no other category to move to.
      for (let round = 0; round < 6; round++) {
        const before = game.right;
        game = advance(game, random);
        expect(game.left).toBe(before);
        dealt.push(game.right.id);
      }

      expect(new Set(dealt).size).toBe(8);
      expect(game.score).toBe(6);
    }
  });

  describe('pickNext', () => {
    const hundreds = category('h', [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    const current = hundreds.items[0];

    it('never deals a tie', () => {
      const ties = category('t', [10, 10, 20]);

      for (const random of [0, 0.5, 0.99]) {
        expect(pickNext(ties, ties.items[0], new Set(), 0, () => random)?.value).toBe(20);
      }
    });

    it('draws from every candidate at the start of a game', () => {
      expect(pickNext(hundreds, current, new Set(), 0, () => 0)?.value).toBe(1000);
      expect(pickNext(hundreds, current, new Set(), 0, () => 0.99)?.value).toBe(200);
    });

    it('draws only from the closest pairs as the score grows', () => {
      const random = seeded(11);
      for (let draw = 0; draw < 50; draw++) {
        expect(pickNext(hundreds, current, new Set(), 20, random)!.value).toBeLessThanOrEqual(400);
      }
    });

    it('prefers facts not dealt yet, and reuses facts once all were dealt', () => {
      const small = category('s', [1, 2, 3]);
      const seen = new Set(['s/s-1']);

      expect(pickNext(small, small.items[0], seen, 0, () => 0)?.value).toBe(3);
      expect(pickNext(small, small.items[0], new Set(['s/s-1', 's/s-2']), 0, () => 0)).toBeDefined();
    });

    it('has nothing to deal when every other fact ties', () => {
      const flat = category('f', [5, 5, 5]);

      expect(pickNext(flat, flat.items[0], new Set(), 0, () => 0)).toBeUndefined();
    });
  });
});

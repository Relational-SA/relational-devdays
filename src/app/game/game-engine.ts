import { Category, Fact, QuestionPack, formatValue } from './question-pack';

/**
 * Higher or Lower, as pure functions. The player sees two facts from one category and guesses
 * whether the second value is higher or lower than the first. After a right guess the second
 * card becomes the first and a new one is dealt; every few rounds the game moves to the next
 * category. One wrong guess ends the game. A game of one category keeps its chain of cards going.
 */

export type Guess = 'higher' | 'lower';

/** Right guesses in a row before the game moves to the next category. */
export const ROUNDS_PER_CATEGORY = 5;

/** The score from which only the closest pairs are dealt. */
const HARDEST_AT_SCORE = 20;

/** At the hardest, the share of candidates (the easiest ones) that are left out. */
const MAX_NARROWING = 0.7;

export interface GameState {
  readonly pack: QuestionPack;
  /** Category indexes in play order, cycled. */
  readonly order: readonly number[];
  readonly turn: number;
  readonly left: Fact;
  readonly right: Fact;
  /** Right guesses in the current category. */
  readonly streak: number;
  readonly score: number;
  /** Facts already dealt this game, as `category/fact` keys. */
  readonly seen: ReadonlySet<string>;
}

export function currentCategory(state: Pick<GameState, 'pack' | 'order' | 'turn'>): Category {
  return state.pack.categories[state.order[state.turn % state.order.length]];
}

export function correctGuess(state: GameState): Guess {
  return state.right.value > state.left.value ? 'higher' : 'lower';
}

export function newGame(pack: QuestionPack, random: () => number): GameState {
  const order = shuffle(
    pack.categories.map((_, index) => index),
    random,
  );
  return deal({ pack, order, turn: 0, score: 0, seen: new Set() }, random);
}

/** After a right guess: the next pair, with the score raised by one. */
export function advance(state: GameState, random: () => number): GameState {
  const score = state.score + 1;
  const streak = state.streak + 1;
  if (streak < ROUNDS_PER_CATEGORY || state.order.length === 1) {
    const category = currentCategory(state);
    const next = pickNext(category, state.right, state.seen, score, random);
    if (next) {
      return {
        ...state,
        score,
        streak,
        left: state.right,
        right: next,
        seen: new Set(state.seen).add(key(category, next)),
      };
    }
  }
  return deal({ ...state, score, turn: state.turn + 1 }, random);
}

/**
 * The next fact to compare with `current`: never the same displayed value (a tie has no right
 * answer), new to this game while any are left, and closer to `current` as the score grows.
 */
export function pickNext(
  category: Category,
  current: Fact,
  seen: ReadonlySet<string>,
  score: number,
  random: () => number,
): Fact | undefined {
  const shown = formatValue(current.value, category.format);
  const differs = category.items.filter(
    (fact) => fact.id !== current.id && formatValue(fact.value, category.format) !== shown,
  );
  const fresh = differs.filter((fact) => !seen.has(key(category, fact)));
  const pool = fresh.length > 0 ? fresh : differs;
  if (pool.length === 0) {
    return undefined;
  }

  // Easiest (largest relative gap) first; later rounds draw only from the closest pairs.
  const byGap = [...pool].sort((a, b) => gap(b, current) - gap(a, current));
  const narrowing = Math.min(score / HARDEST_AT_SCORE, 1) * MAX_NARROWING;
  const from = Math.min(Math.floor(byGap.length * narrowing), byGap.length - 1);
  return byGap[from + Math.floor(random() * (byGap.length - from))];
}

/** Opens the category at `state.turn` with a fresh pair. */
function deal(
  state: Pick<GameState, 'pack' | 'order' | 'turn' | 'score' | 'seen'>,
  random: () => number,
): GameState {
  const category = currentCategory(state);
  const fresh = category.items.filter((fact) => !state.seen.has(key(category, fact)));
  const candidates = fresh.length > 1 ? fresh : category.items;
  const left = candidates[Math.floor(random() * candidates.length)];
  const seen = new Set(state.seen).add(key(category, left));
  // The pack check (validate-pack.ts) guarantees every category has distinct values.
  const right = pickNext(category, left, seen, state.score, random)!;
  return { ...state, left, right, streak: 0, seen: seen.add(key(category, right)) };
}

function key(category: Category, fact: Fact): string {
  return `${category.id}/${fact.id}`;
}

function gap(a: Fact, b: Fact): number {
  return Math.abs(a.value - b.value) / Math.max(Math.abs(a.value), Math.abs(b.value), 1e-9);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

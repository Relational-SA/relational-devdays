import {
  Component,
  DOCUMENT,
  InjectionToken,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { IonContent, IonFooter, IonHeader, IonToolbar } from '@ionic/angular';
import { BoothMode } from '../booth-mode';
import { BrandLogo } from '../brand/brand-logo';
import { BestScore } from './best-score';
import { FactCard } from './fact-card';
import {
  GameState,
  Guess,
  advance,
  correctGuess,
  currentCategory,
  newGame,
} from './game-engine';
import { Fact, QUESTION_PACK, formatValue } from './question-pack';

export const GAME_NAME = 'Big O';

/** Durations in milliseconds; tests set them to 0. */
export interface GameTiming {
  /** The second card's value counting up to the answer. */
  readonly countUp: number;
  /** How long the result shows before the next pair (or the game-over screen). */
  readonly hold: number;
  readonly holdWrong: number;
  /** Booth tablets return to the start screen after this long without input. */
  readonly idle: number;
}

export const GAME_TIMING = new InjectionToken<GameTiming>('GAME_TIMING', {
  providedIn: 'root',
  factory: () => {
    const reduceMotion = inject(DOCUMENT).defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )?.matches;
    return { countUp: reduceMotion ? 0 : 1000, hold: 1100, holdWrong: 1600, idle: 60_000 };
  },
});

/** Random numbers in [0, 1) for dealing cards; tests make it predictable. */
export const GAME_RANDOM = new InjectionToken<() => number>('GAME_RANDOM', {
  providedIn: 'root',
  factory: () => Math.random,
});

type Phase = 'start' | 'play' | 'over';

interface Reveal {
  readonly correct: boolean;
  /** The count-up has finished and the result shows. */
  readonly settled: boolean;
}

/** The game: a start screen, the Higher or Lower rounds, and a game-over screen. */
@Component({
  selector: 'app-game',
  imports: [IonHeader, IonToolbar, IonContent, IonFooter, BrandLogo, FactCard],
  templateUrl: './game.page.html',
  styleUrl: './game.page.scss',
})
export class GamePage {
  private readonly pack = inject(QUESTION_PACK);
  private readonly random = inject(GAME_RANDOM);
  private readonly timing = inject(GAME_TIMING);
  private readonly booth = inject(BoothMode);
  protected readonly best = inject(BestScore);

  protected readonly name = GAME_NAME;
  protected readonly topics = this.pack.categories.map((category) => category.title);

  protected readonly phase = signal<Phase>('start');
  protected readonly game = signal<GameState | null>(null);
  protected readonly reveal = signal<Reveal | null>(null);
  /** The second card's value while it counts up. */
  private readonly countedValue = signal(0);
  protected readonly newBest = signal(false);
  /** Read out by screen readers after every guess. */
  protected readonly announcement = signal('');

  protected readonly view = computed(() => {
    const game = this.game();
    if (!game) {
      return null;
    }
    const category = currentCategory(game);
    const reveal = this.reveal();
    const card = (fact: Fact, value: number | null) => ({
      key: `${category.id}/${fact.id}`,
      fact,
      value,
    });
    return {
      game,
      category,
      cards: [
        card(game.left, game.left.value),
        card(game.right, reveal ? this.countedValue() : null),
      ],
      badge: reveal?.settled ? (reveal.correct ? '✓' : '✗') : 'VS',
    };
  });

  /** The last pair's answer in words, e.g. "Git: 2005, later than Python (1991)." */
  protected readonly verdict = computed(() => {
    const game = this.game();
    if (!game) {
      return '';
    }
    const category = currentCategory(game);
    const right = [formatValue(game.right.value, category.format), category.unit]
      .filter(Boolean)
      .join(' ');
    const relation = correctGuess(game) === 'higher' ? category.higher : category.lower;
    const left = formatValue(game.left.value, category.format);
    return `${game.right.name}: ${right}, ${relation.toLowerCase()} than ${game.left.name} (${left}).`;
  });

  /** Bumped on every new game or reset, so the steps of an older guess stop. */
  private run = 0;

  constructor() {
    effect((onCleanup) => {
      if (this.booth.active && this.phase() !== 'start') {
        onCleanup(this.booth.onIdle(this.timing.idle, () => this.reset()));
      }
    });
  }

  protected play(): void {
    this.run++;
    this.game.set(newGame(this.pack, this.random));
    this.reveal.set(null);
    this.newBest.set(false);
    this.announcement.set('');
    this.phase.set('play');
  }

  protected async guess(guess: Guess): Promise<void> {
    const game = this.game();
    if (!game || this.reveal()) {
      return;
    }
    const run = this.run;
    const correct = correctGuess(game) === guess;
    this.reveal.set({ correct, settled: false });

    await this.countUp(game.right.value);
    if (run !== this.run) {
      return;
    }
    this.reveal.set({ correct, settled: true });
    this.announcement.set(`${correct ? 'Right!' : 'Wrong.'} ${this.verdict()}`);

    await delay(correct ? this.timing.hold : this.timing.holdWrong);
    if (run !== this.run) {
      return;
    }
    if (correct) {
      this.game.set(advance(game, this.random));
      this.reveal.set(null);
    } else {
      this.newBest.set(this.best.record(game.score));
      this.phase.set('over');
    }
  }

  private reset(): void {
    this.run++;
    this.game.set(null);
    this.reveal.set(null);
    this.phase.set('start');
  }

  /** Counts the second card's value up from zero, slowing down towards the answer. */
  private countUp(target: number): Promise<void> {
    const duration = this.timing.countUp;
    if (duration <= 0) {
      this.countedValue.set(target);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        this.countedValue.set(target * (1 - (1 - progress) ** 3));
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      this.countedValue.set(0);
      requestAnimationFrame(step);
    });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

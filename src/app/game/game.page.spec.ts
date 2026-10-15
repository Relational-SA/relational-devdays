import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular';
import { BoothMode } from '../booth-mode';
import { GAME_RANDOM, GAME_TIMING, GamePage } from './game.page';
import { Fact, QUESTION_PACK, QuestionPack } from './question-pack';

const facts: Fact[] = [
  ['alpha', 'Alpha', 1960],
  ['beta', 'Beta', 1970],
  ['gamma', 'Gamma', 1980],
  ['delta', 'Delta', 1990],
  ['epsilon', 'Epsilon', 2000],
  ['zeta', 'Zeta', 2010],
].map(([id, name, value]) => ({
  id: id as string,
  name: name as string,
  detail: 'Made up',
  value: value as number,
  source: 'https://example.org',
  asOf: '2026',
}));

const pack: QuestionPack = {
  id: 'test',
  categories: [
    {
      id: 'firsts',
      title: 'Which came first?',
      caption: 'Made up years.',
      format: 'year',
      unit: '',
      question: 'Earlier or later than {name}?',
      higher: 'Later',
      lower: 'Earlier',
      items: facts,
    },
  ],
};

describe('GamePage', () => {
  let fixture: ComponentFixture<GamePage>;
  let host: HTMLElement;
  /** The booth's idle callback while the page watches for an idle tablet. */
  let idle: (() => void) | undefined;

  function setUp(booth = false): void {
    TestBed.configureTestingModule({
      imports: [GamePage],
      providers: [
        provideIonicAngular({ mode: 'md' }),
        { provide: QUESTION_PACK, useValue: pack },
        { provide: GAME_RANDOM, useValue: () => 0.5 },
        { provide: GAME_TIMING, useValue: { count: 0, hold: 0, holdWrong: 0, idle: 60_000 } },
        {
          provide: BoothMode,
          useValue: {
            active: booth,
            onIdle: (_ms: number, callback: () => void) => {
              idle = callback;
              return () => (idle = undefined);
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(GamePage);
    host = fixture.nativeElement;
    fixture.detectChanges();
  }

  function text(selector: string): string {
    return host.querySelector(selector)?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
  }

  function cards(): Fact[] {
    return [...host.querySelectorAll('app-fact-card .name')].map(
      (name) => facts.find((fact) => fact.name === name.textContent?.trim())!,
    );
  }

  async function click(selector: string): Promise<void> {
    host.querySelector<HTMLButtonElement>(selector)!.click();
    // GAME_TIMING is all zeros, so a guess plays out over a few promise and timer turns.
    for (let turn = 0; turn < 3; turn++) {
      await new Promise((resolve) => setTimeout(resolve));
    }
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /** Answers the pair on the board, rightly or wrongly. */
  async function answer(right: boolean): Promise<void> {
    const [left, second] = cards();
    const later = second.value > left.value;
    await click(later === right ? '.answer.higher' : '.answer.lower');
  }

  beforeEach(() => {
    localStorage.clear();
    idle = undefined;
  });
  afterEach(() => localStorage.clear());

  it('opens on the start screen with the topics', () => {
    setUp();

    expect(text('h1')).toBe('Big O');
    expect(text('.topics')).toBe('Which came first?');
    expect(host.querySelector('.best')).toBeNull();
    expect(host.querySelector('app-fact-card')).toBeNull();
  });

  it('deals two cards: the first with its value, the second with the question', async () => {
    setUp();
    await click('.action');

    const [left, second] = cards();
    const shown = host.querySelectorAll('app-fact-card');
    expect(text('.topic')).toBe('Which came first?');
    expect(text('.score')).toBe('Score 0');
    expect(shown[0].querySelector('.value')?.textContent).toBe(String(left.value));
    expect(shown[0].querySelector('.ask')?.classList).toContain('gone');
    expect(shown[1].querySelector('.reveal')?.classList).toContain('gone');
    expect(shown[1].textContent).not.toContain(String(second.value));
    expect(text('app-fact-card:last-of-type .question')).toBe(`Earlier or later than ${left.name}?`);
    expect(second.value).not.toBe(left.value);
  });

  it('raises the score after a right guess and moves the second card to the first', async () => {
    setUp();
    await click('.action');
    const [, second] = cards();

    await answer(true);

    expect(text('.score')).toBe('Score 1');
    expect(cards()[0]).toBe(second);
    expect(cards()[1]).not.toBe(second);
    expect(text('[aria-live]')).toMatch(/^Right! /);
  });

  it('ends the game after a wrong guess and keeps the best score on the device', async () => {
    setUp();
    await click('.action');
    await answer(true);
    const [left, second] = cards();

    await answer(false);

    const relation = second.value > left.value ? 'later' : 'earlier';
    expect(text('h1')).toBe('Game over');
    expect(text('.final')).toBe('1 point');
    expect(text('.new-best')).toBe('New best on this device!');
    expect(text('.verdict')).toBe(
      `${second.name}: ${second.value}, ${relation} than ${left.name} (${left.value}).`,
    );
    expect(localStorage.getItem('relational-devdays.best-score')).toBe('1');

    await click('.action');
    expect(text('.score')).toBe('Score 0');
  });

  it('does not show a best score after a first game without points', async () => {
    setUp();
    await click('.action');

    await answer(false);

    expect(text('.final')).toBe('0 points');
    expect(host.querySelector('.best, .new-best')).toBeNull();
  });

  it('returns a booth tablet to the start screen when nobody plays', async () => {
    setUp(true);
    expect(idle).toBeUndefined();

    await click('.action');
    expect(idle).toBeDefined();

    idle!();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(text('h1')).toBe('Big O');
    expect(idle).toBeUndefined();
  });
});

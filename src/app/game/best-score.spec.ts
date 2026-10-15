import { TestBed } from '@angular/core/testing';
import { BestScore } from './best-score';

describe('BestScore', () => {
  const key = 'relational-devdays.best-score';

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('starts at 0 on a new device', () => {
    expect(TestBed.inject(BestScore).value()).toBe(0);
  });

  it('keeps a better score on the device', () => {
    const best = TestBed.inject(BestScore);

    expect(best.record(7)).toBe(true);
    expect(best.value()).toBe(7);
    expect(localStorage.getItem(key)).toBe('7');
  });

  it('keeps the best when a game scores the same or less', () => {
    localStorage.setItem(key, '7');
    const best = TestBed.inject(BestScore);

    expect(best.value()).toBe(7);
    expect(best.record(7)).toBe(false);
    expect(best.record(3)).toBe(false);
    expect(localStorage.getItem(key)).toBe('7');
  });

  it('ignores a stored value that is not a score', () => {
    localStorage.setItem(key, 'lots');

    expect(TestBed.inject(BestScore).value()).toBe(0);
  });
});

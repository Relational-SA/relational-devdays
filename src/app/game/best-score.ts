import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'relational-devdays.best-score';

/** The best score on this device: no names and no server, only a number in local storage. */
@Injectable({ providedIn: 'root' })
export class BestScore {
  private readonly best = signal(read());

  readonly value = this.best.asReadonly();

  /** Records a finished game's score; true when it beats the best so far. */
  record(score: number): boolean {
    if (score <= this.best()) {
      return false;
    }
    this.best.set(score);
    try {
      localStorage.setItem(STORAGE_KEY, String(score));
    } catch {
      // Storage blocked (e.g. a private window): the best score lasts until the page closes.
    }
    return true;
  }
}

function read(): number {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(stored) && stored > 0 ? stored : 0;
  } catch {
    return 0;
  }
}

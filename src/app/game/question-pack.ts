import { InjectionToken } from '@angular/core';
import devdays2026 from './packs/devdays-2026.json';

/**
 * The game's questions, kept as data so another event can swap in its own pack (see
 * docs/game.md). Every number carries a source and a date, so a reviewer can check it.
 */
export interface QuestionPack {
  readonly id: string;
  readonly categories: readonly Category[];
}

export type ValueFormat = 'year' | 'integer' | 'compact' | 'percent';

export interface Category {
  readonly id: string;
  /** Topic heading above the cards, e.g. "Which came first?". */
  readonly title: string;
  /** Where the numbers come from, in small copy under the cards. */
  readonly caption: string;
  readonly format: ValueFormat;
  /** Shown after a value, e.g. "stars"; empty for years. */
  readonly unit: string;
  /** Asked on the second card; `{name}` stands for the first card's name. */
  readonly question: string;
  /** Answer labels, e.g. "Later" and "Earlier". */
  readonly higher: string;
  readonly lower: string;
  readonly items: readonly Fact[];
}

export interface Fact {
  /** Unique within its category. */
  readonly id: string;
  readonly name: string;
  readonly detail: string;
  readonly value: number;
  /** An https page that states the value. */
  readonly source: string;
  /** When the value held (changing figures) or was checked (history): YYYY, YYYY-MM or YYYY-MM-DD. */
  readonly asOf: string;
}

/** The pack the game plays; tests provide their own. */
export const QUESTION_PACK = new InjectionToken<QuestionPack>('QUESTION_PACK', {
  providedIn: 'root',
  factory: () => devdays2026 as QuestionPack,
});

const formats: Record<ValueFormat, Intl.NumberFormat> = {
  year: new Intl.NumberFormat('en', { useGrouping: false, maximumFractionDigits: 0 }),
  integer: new Intl.NumberFormat('en', { maximumFractionDigits: 0 }),
  compact: new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 0 }),
  percent: new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 1 }),
};

/** A value as the cards show it: 1991, 27, 251K, 57.9%. */
export function formatValue(value: number, format: ValueFormat): string {
  return formats[format].format(format === 'percent' ? value / 100 : value);
}

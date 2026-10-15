import { TestBed } from '@angular/core/testing';
import { Category, Fact, QUESTION_PACK, QuestionPack, formatValue } from './question-pack';
import { validatePack } from './validate-pack';

function fact(id: string, value: number, changes: Partial<Fact> = {}): Fact {
  return {
    id,
    name: `Name ${id}`,
    detail: 'Detail',
    value,
    source: 'https://example.org/source',
    asOf: '2026-10-15',
    ...changes,
  };
}

function pack(changes: Partial<Category> = {}): QuestionPack {
  return {
    id: 'test',
    categories: [
      {
        id: 'numbers',
        title: 'Numbers',
        caption: 'Made up.',
        format: 'integer',
        unit: 'units',
        question: 'More or fewer than {name}?',
        higher: 'More',
        lower: 'Fewer',
        items: [1, 2, 3, 4, 5, 6].map((value) => fact(`f${value}`, value)),
        ...changes,
      },
    ],
  };
}

describe('validatePack', () => {
  it('passes the pack the game plays', () => {
    expect(validatePack(TestBed.inject(QUESTION_PACK))).toEqual([]);
  });

  it('passes a complete pack', () => {
    expect(validatePack(pack())).toEqual([]);
  });

  it('reports facts without a source, a date or a valid value', () => {
    const items = [
      fact('a', 1, { source: 'http://example.org' }),
      fact('b', 2, { source: '' }),
      fact('c', 3, { asOf: '2026-02-30' }),
      fact('d', 4, { asOf: 'October 2026' }),
      fact('e', 5.5),
      fact('f', 6, { name: ' ' }),
      fact('g', 7),
    ];

    expect(validatePack(pack({ items }))).toEqual([
      'numbers/a: source must be an https URL',
      'numbers/b: source must be an https URL',
      'numbers/c: asOf must be a date: YYYY, YYYY-MM or YYYY-MM-DD',
      'numbers/d: asOf must be a date: YYYY, YYYY-MM or YYYY-MM-DD',
      'numbers/e: value must be a whole number for format "integer"',
      'numbers/f: name is missing',
    ]);
  });

  it('accepts a year or a month as the date', () => {
    const items = [1, 2, 3, 4, 5, 6].map((value) =>
      fact(`f${value}`, value, { asOf: value % 2 ? '2025' : '2024-12' }),
    );

    expect(validatePack(pack({ items }))).toEqual([]);
  });

  it('reports duplicate facts and a question without {name}', () => {
    const items = [
      ...pack().categories[0].items,
      fact('f1', 9, { name: 'Other' }),
      fact('x', 10, { name: 'Name f2' }),
    ];

    expect(validatePack(pack({ items, question: 'More or fewer?' }))).toEqual([
      'numbers: question must contain {name}',
      'numbers: fact id "f1" is used more than once',
      'numbers: "Name f2" is in the category more than once',
    ]);
  });

  it('reports a category with too few different values to play', () => {
    const items = [1, 1, 2, 2, 3, 3, 4].map((value, index) => fact(`f${index}`, value));

    expect(validatePack(pack({ items }))).toEqual([
      'numbers: needs at least 6 different values, has 4',
    ]);
  });

  it('counts values that look the same on the card as one', () => {
    const items = [1000, 1200, 1400, 2000, 3000, 4000, 5000].map((value) =>
      fact(`f${value}`, value),
    );

    expect(formatValue(1200, 'compact')).toBe('1K');
    expect(validatePack(pack({ items, format: 'compact' }))).toEqual([
      'numbers: needs at least 6 different values, has 5',
    ]);
  });
});

describe('formatValue', () => {
  it('shows each format the way the cards do', () => {
    expect(formatValue(1991, 'year')).toBe('1991');
    expect(formatValue(27, 'integer')).toBe('27');
    expect(formatValue(251000, 'compact')).toBe('251K');
    expect(formatValue(57.9, 'percent')).toBe('57.9%');
    expect(formatValue(66, 'percent')).toBe('66%');
  });
});

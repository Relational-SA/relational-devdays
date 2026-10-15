import { ROUNDS_PER_CATEGORY } from './game-engine';
import { Category, Fact, QuestionPack, ValueFormat, formatValue } from './question-pack';

const FORMATS: readonly ValueFormat[] = ['year', 'integer', 'compact', 'percent'];
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const AS_OF = /^(\d{4})(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?)?$/;

/**
 * Lists everything that keeps a pack from being complete and playable; empty when it is fine.
 * A unit test runs it on the active pack, so a broken pack fails the build before it deploys.
 */
export function validatePack(pack: QuestionPack): string[] {
  const problems: string[] = [];
  if (!pack.id?.trim()) problems.push('pack: id is missing');
  if (!pack.categories?.length) problems.push('pack: no categories');

  duplicates(pack.categories?.map((category) => category.id) ?? []).forEach((id) =>
    problems.push(`pack: category id "${id}" is used more than once`),
  );
  for (const category of pack.categories ?? []) {
    problems.push(...validateCategory(category));
  }
  return problems;
}

function validateCategory(category: Category): string[] {
  const at = category.id || '(category without id)';
  const problems: string[] = [];
  if (!ID.test(category.id ?? '')) problems.push(`${at}: id must be lower-case words joined by "-"`);
  for (const field of ['title', 'caption', 'question', 'higher', 'lower'] as const) {
    if (!category[field]?.trim()) problems.push(`${at}: ${field} is missing`);
  }
  if (typeof category.unit !== 'string') problems.push(`${at}: unit must be text (it may be empty)`);
  if (!category.question?.includes('{name}')) problems.push(`${at}: question must contain {name}`);
  if (!FORMATS.includes(category.format)) {
    problems.push(`${at}: format must be one of ${FORMATS.join(', ')}`);
    return problems;
  }

  const items = category.items ?? [];
  duplicates(items.map((fact) => fact.id)).forEach((id) =>
    problems.push(`${at}: fact id "${id}" is used more than once`),
  );
  duplicates(items.map((fact) => fact.name)).forEach((name) =>
    problems.push(`${at}: "${name}" is in the category more than once`),
  );
  for (const fact of items) {
    problems.push(...validateFact(fact, category.format).map((problem) => `${at}/${fact.id}: ${problem}`));
  }

  // Ties are never dealt, so a full stretch of rounds needs this many different values.
  const shown = new Set(items.map((fact) => formatValue(fact.value, category.format)));
  if (shown.size < ROUNDS_PER_CATEGORY + 1) {
    problems.push(`${at}: needs at least ${ROUNDS_PER_CATEGORY + 1} different values, has ${shown.size}`);
  }
  return problems;
}

function validateFact(fact: Fact, format: ValueFormat): string[] {
  const problems: string[] = [];
  if (!ID.test(fact.id ?? '')) problems.push('id must be lower-case words joined by "-"');
  if (!fact.name?.trim()) problems.push('name is missing');
  if (!fact.detail?.trim()) problems.push('detail is missing');

  if (typeof fact.value !== 'number' || !Number.isFinite(fact.value) || fact.value < 0) {
    problems.push('value must be a number of 0 or more');
  } else if (format !== 'percent' && !Number.isInteger(fact.value)) {
    problems.push(`value must be a whole number for format "${format}"`);
  } else if (format === 'percent' && fact.value > 100) {
    problems.push('a percentage cannot exceed 100');
  }

  if (!isHttpsUrl(fact.source)) problems.push('source must be an https URL');
  if (!isDate(fact.asOf)) problems.push('asOf must be a date: YYYY, YYYY-MM or YYYY-MM-DD');
  return problems;
}

function isHttpsUrl(value: string | undefined): boolean {
  try {
    return new URL(value ?? '').protocol === 'https:';
  } catch {
    return false;
  }
}

function isDate(value: string | undefined): boolean {
  const match = AS_OF.exec(value ?? '');
  if (!match) return false;
  const [, year, month, day] = match;
  if (!day) return true;
  // Rejects days the month does not have, such as 2026-02-30.
  const date = new Date(Date.UTC(+year, +month - 1, +day));
  return date.getUTCMonth() === +month - 1;
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return [...new Set(values.filter((value) => seen.has(value) || !seen.add(value)))];
}

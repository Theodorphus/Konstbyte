import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultCommissionRate, PLATFORM_FEE_PERCENT } from '@/lib/payout';

// The fee shown to people must be the fee that is charged. Texts get it from
// PLATFORM_FEE_PERCENT ({fee} in messages), so none may spell out a number.

const root = join(__dirname, '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const PERCENT = /\d\s?%/;
// Stripe's own card fee (1.5 %) is not ours to change.
const withoutStripeFee = (text: string) => text.replace(/1[.,]5\s?%/g, '');

describe('platform fee texts', () => {
  it('charges the fee the texts show', () => {
    expect(defaultCommissionRate()).toBe(PLATFORM_FEE_PERCENT / 100);
  });

  it.each(['messages/sv.json', 'messages/en.json'])('%s only shows the fee through {fee}', (file) => {
    const hardcoded = strings(JSON.parse(read(file))).filter((s) => PERCENT.test(s));
    expect(hardcoded).toEqual([]);
  });

  it.each([
    'src/app/[locale]/avgifter/page.tsx',
    'src/app/[locale]/kopvillkor/page.tsx',
    'src/app/[locale]/policies/terms/page.tsx',
    'src/app/[locale]/policies/faq/page.tsx',
  ])('%s uses PLATFORM_FEE_PERCENT', (file) => {
    expect(withoutStripeFee(read(file))).not.toMatch(PERCENT);
  });
});

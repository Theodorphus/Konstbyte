import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// JSON.parse silently keeps the last of two equal keys, so a second "seller"
// group once wiped out the first and pages showed raw keys. Check the raw text.

const read = (locale: string) => readFileSync(join(__dirname, '..', 'messages', `${locale}.json`), 'utf8');

function duplicateKeys(text: string): string[] {
  const dupes: string[] = [];
  const top = new Set<string>();
  let group = '';
  let inGroup = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const topKey = line.match(/^ {2}"([^"]+)":/)?.[1];
    if (topKey) {
      if (top.has(topKey)) dupes.push(topKey);
      top.add(topKey);
      group = topKey;
      inGroup = new Set();
      continue;
    }
    const key = line.match(/^ {4}"([^"]+)":/)?.[1];
    if (key) {
      if (inGroup.has(key)) dupes.push(`${group}.${key}`);
      inGroup.add(key);
    }
  }
  return dupes;
}

describe('message files', () => {
  it.each(['sv', 'en'])('%s.json has no duplicate keys', (locale) => {
    expect(duplicateKeys(read(locale))).toEqual([]);
  });

  it('sv and en have the same keys', () => {
    const flat = (o: object, p = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
    const sv = new Set(flat(JSON.parse(read('sv'))));
    const en = new Set(flat(JSON.parse(read('en'))));
    expect([...sv].filter((k) => !en.has(k))).toEqual([]);
    expect([...en].filter((k) => !sv.has(k))).toEqual([]);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma } = vi.hoisted(() => ({
  prisma: { challenge: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() } },
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { currentWeek, ensureWeeklyChallenge, THEMES, THEME_IMAGES, themeImageFor } from '@/lib/weekly-challenge';

beforeEach(() => {
  vi.clearAllMocks();
  prisma.challenge.findFirst.mockResolvedValue(null);
  prisma.challenge.findMany.mockResolvedValue([]);
  prisma.challenge.create.mockResolvedValue({ id: 'ch_new' });
});

describe('currentWeek', () => {
  it('runs Monday 00:00 to Sunday 23:59:59 Swedish time (winter)', () => {
    // Wednesday 18 Nov 2026, 12:00 UTC
    const w = currentWeek(new Date('2026-11-18T12:00:00Z'));
    expect(w.startsAt.toISOString()).toBe('2026-11-15T23:00:00.000Z'); // Mon 16 Nov 00:00 CET
    expect(w.endsAt.toISOString()).toBe('2026-11-22T22:59:59.000Z'); // Sun 22 Nov 23:59:59 CET
    expect(w).toMatchObject({ week: 47, year: 2026 });
  });

  it('handles summer time and a Monday morning just after midnight', () => {
    // Monday 1 June 2026, 00:30 in Stockholm (22:30 UTC on Sunday)
    const w = currentWeek(new Date('2026-05-31T22:30:00Z'));
    expect(w.startsAt.toISOString()).toBe('2026-05-31T22:00:00.000Z');
    expect(w).toMatchObject({ week: 23, year: 2026 });
  });

  it('uses the ISO week-year around new year', () => {
    expect(currentWeek(new Date('2027-01-01T12:00:00Z'))).toMatchObject({ week: 53, year: 2026 });
  });
});

describe('ensureWeeklyChallenge', () => {
  it('leaves things alone when a challenge is running or scheduled', async () => {
    prisma.challenge.findFirst.mockResolvedValue({ id: 'ch_active' });
    expect(await ensureWeeklyChallenge()).toBeNull();
    expect(prisma.challenge.create).not.toHaveBeenCalled();
  });

  it("creates this week's challenge in both languages, skipping recent themes", async () => {
    prisma.challenge.findMany.mockResolvedValue(THEMES.slice(0, 20).map((t) => ({ title: t.sv[0] })));

    expect(await ensureWeeklyChallenge(new Date('2026-11-18T12:00:00Z'))).toBe('ch_new');
    const data = prisma.challenge.create.mock.calls[0][0].data;
    expect(THEMES.slice(0, 20).map((t) => t.sv[0])).not.toContain(data.title);
    expect(data).toMatchObject({ weekNumber: 47, year: 2026 });
    expect(data.titleEn).toBeTruthy();
    expect(data.descriptionEn).toBeTruthy();
    expect(data.imageUrl).toBe(themeImageFor(data.title));
  });

  it('does nothing if the week already has a challenge (unique week)', async () => {
    prisma.challenge.create.mockRejectedValue(Object.assign(new Error('dup'), { code: 'P2002' }));
    expect(await ensureWeeklyChallenge()).toBeNull();
  });
});

describe('theme images', () => {
  it('has an image file for every theme', () => {
    expect(THEME_IMAGES).toHaveLength(THEMES.length);
    for (const t of THEMES) {
      const url = themeImageFor(t.sv[0]);
      expect(url).toMatch(/^\/images\/challenges\/.+\.webp$/);
      expect(existsSync(join(process.cwd(), 'public', url!))).toBe(true);
    }
  });

  it('matches English titles and ignores unknown ones', () => {
    expect(themeImageFor('Night')).toBe('/images/challenges/natt.webp');
    expect(themeImageFor('Något eget', 'Night')).toBe('/images/challenges/natt.webp');
    expect(themeImageFor('Admins egna tema')).toBeNull();
  });
});

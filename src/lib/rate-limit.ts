import { NextResponse } from 'next/server';
import prisma from './prisma';

const buckets = new Map<string, number[]>();

/**
 * Best-effort in-memory limiter. Returns true if `key` has already been hit
 * `limit` times within `windowMs` (otherwise records the hit).
 *
 * Serverless instances don't share memory, so this only slows down abuse. Use a
 * database count (see the routes using countSince) when a limit must hold.
 */
export function hitLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  const limited = hits.length >= limit;
  if (!limited) hits.push(now);
  buckets.set(key, hits);

  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return limited;
}

export function tooManyRequests(
  message = 'För många förfrågningar. Vänta en stund och försök igen.',
) {
  return NextResponse.json({ error: message }, { status: 429 });
}

export function since(windowMs: number): Date {
  return new Date(Date.now() - windowMs);
}

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/**
 * Creates a notification unless an identical one (same recipient, type, text and
 * link) was created within `windowMs` — so toggling a follow or reaction can't
 * flood someone's notifications.
 */
export async function notifyOnce(
  data: { userId: string; type: string; message: string; link: string },
  windowMs = DAY,
): Promise<void> {
  const existing = await prisma.notification.findFirst({
    where: { ...data, createdAt: { gt: since(windowMs) } },
    select: { id: true },
  });
  if (!existing) await prisma.notification.create({ data });
}

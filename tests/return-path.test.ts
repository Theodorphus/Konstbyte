import { describe, expect, it } from 'vitest';
import { safeReturnPath } from '@/lib/return-path';
import { shippingTypeKey } from '@/lib/shipping';

describe('safeReturnPath', () => {
  it('keeps paths on this site', () => {
    expect(safeReturnPath('/messages')).toBe('/messages');
    expect(safeReturnPath('/en/favorites')).toBe('/en/favorites');
  });

  it('accepts a full URL on this site (as NextAuth sends it) and keeps only the path', () => {
    const origin = 'https://www.konstbyte.se';
    expect(safeReturnPath('https://www.konstbyte.se/en/orders/x?a=1', origin)).toBe('/en/orders/x?a=1');
    expect(safeReturnPath('https://evil.example/en/orders/x', origin)).toBe('/');
    expect(safeReturnPath('https://www.konstbyte.se.evil.example/', origin)).toBe('/');
  });

  it('refuses anything that could leave the site', () => {
    for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '', null, undefined]) {
      expect(safeReturnPath(bad)).toBe('/');
    }
  });
});

describe('shippingTypeKey', () => {
  it('maps a shipping type to its message key', () => {
    expect(shippingTypeKey('postnord')).toBe('type_postnord');
    expect(shippingTypeKey('fixed')).toBe('type_fixed');
  });

  it('treats unknown or missing types as "by agreement"', () => {
    expect(shippingTypeKey(null)).toBe('type_overenskommes');
    expect(shippingTypeKey('teleport')).toBe('type_overenskommes');
  });
});

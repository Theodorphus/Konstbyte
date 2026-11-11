import { describe, expect, it } from 'vitest';
import { isAllowedImageUrl } from '@/lib/image-url';
import { calculatePayout, parseArtworkPrice, parseShippingCost } from '@/lib/payout';
import { sanitizeTracking } from '@/lib/shipping';

describe('isAllowedImageUrl', () => {
  it.each([
    'https://utfs.io/f/abc.jpg',
    'https://abc123.ufs.sh/f/x.png',
    'https://lh3.googleusercontent.com/a/photo',
    'https://images.unsplash.com/photo-1',
  ])('accepts %s', (url) => {
    expect(isAllowedImageUrl(url)).toBe(true);
  });

  it.each([
    'http://utfs.io/f/abc.jpg', // not https
    'https://evil.com/x.png',
    'https://utfs.io.evil.com/x.png', // lookalike host
    'https://evilufs.sh/x.png',
    'https://user:pass@utfs.io/x.png',
    'https://utfs.io:8443/x.png',
    'http://169.254.169.254/latest/meta-data',
    'javascript:alert(1)',
    'not a url',
    '',
    null,
    123,
  ])('rejects %s', (url) => {
    expect(isAllowedImageUrl(url)).toBe(false);
  });
});

describe('parseArtworkPrice', () => {
  it('accepts prices within Stripe limits and rounds to öre', () => {
    expect(parseArtworkPrice(1500)).toBe(1500);
    expect(parseArtworkPrice('1500,50')).toBe(1500.5);
    expect(parseArtworkPrice(3)).toBe(3);
    expect(parseArtworkPrice(10.555)).toBe(10.56);
  });

  it.each([0, 2.99, -5, 1_000_000, NaN, Infinity, 'abc', null, undefined])('rejects %s', (v) => {
    expect(parseArtworkPrice(v)).toBeNull();
  });
});

describe('parseShippingCost', () => {
  it('treats empty as no shipping cost', () => {
    expect(parseShippingCost(undefined)).toBeNull();
    expect(parseShippingCost('')).toBeNull();
  });
  it('accepts valid amounts', () => {
    expect(parseShippingCost(0)).toBe(0);
    expect(parseShippingCost('99')).toBe(99);
  });
  it.each([-1, 'abc', 100_001, NaN])('rejects %s', (v) => {
    expect(parseShippingCost(v)).toBeUndefined();
  });
});

describe('calculatePayout', () => {
  it('splits commission and VAT', () => {
    const r = calculatePayout(1000, 0.03);
    expect(r.commissionAmount).toBeCloseTo(30);
    expect(r.commissionVat).toBeCloseTo(7.5);
    expect(r.sellerPayoutAmount).toBeCloseTo(970);
  });
});

describe('sanitizeTracking', () => {
  it('keeps http(s) links', () => {
    expect(sanitizeTracking({ trackingNumber: ' AB123 ', trackingUrl: 'https://postnord.se/track?id=1' })).toEqual({
      trackingNumber: 'AB123',
      trackingUrl: 'https://postnord.se/track?id=1',
    });
  });

  it('rejects javascript: and other schemes', () => {
    expect(sanitizeTracking({ trackingUrl: 'javascript:alert(document.cookie)' }).error).toBeDefined();
    expect(sanitizeTracking({ trackingUrl: 'data:text/html,<script>1</script>' }).error).toBeDefined();
  });

  it('caps the tracking number length', () => {
    expect(sanitizeTracking({ trackingNumber: 'x'.repeat(500) }).trackingNumber).toHaveLength(100);
  });

  it('ignores non-string input', () => {
    expect(sanitizeTracking({ trackingNumber: 42, trackingUrl: {} })).toEqual({ trackingNumber: null, trackingUrl: null });
  });
});

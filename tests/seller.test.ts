import { describe, expect, it } from 'vitest';
import { normalizeOrgNr, parseSellerDetails, sellerLine } from '@/lib/seller';

describe('normalizeOrgNr', () => {
  it('accepts valid organisation and personal identity numbers, with or without dash or century', () => {
    expect(normalizeOrgNr('556123-4567')).toBe('556123-4567');
    expect(normalizeOrgNr('5561234567')).toBe('556123-4567');
    expect(normalizeOrgNr('19950721-6498')).toBe('950721-6498');
    expect(normalizeOrgNr(' 950721 6498 ')).toBe('950721-6498');
  });

  it('rejects typos (wrong check digit), wrong lengths and non-numbers', () => {
    expect(normalizeOrgNr('556123-4568')).toBeNull();
    expect(normalizeOrgNr('55612345')).toBeNull();
    expect(normalizeOrgNr('abc123-4567')).toBeNull();
    expect(normalizeOrgNr(5561234567)).toBeNull();
  });
});

describe('parseSellerDetails', () => {
  it('needs a choice', () => {
    expect(parseSellerDetails({})).toEqual({ ok: false, error: 'seller_type' });
    expect(parseSellerDetails({ sellerType: 'company' })).toEqual({ ok: false, error: 'seller_type' });
  });

  it('clears business details for private sellers', () => {
    expect(parseSellerDetails({ sellerType: 'private', businessName: 'AB', businessOrgNr: '556123-4567' })).toEqual({
      ok: true,
      data: { sellerType: 'private', businessName: null, businessOrgNr: null },
    });
  });

  it('requires a name and a valid org.nr for businesses', () => {
    expect(parseSellerDetails({ sellerType: 'business', businessOrgNr: '556123-4567' })).toEqual({ ok: false, error: 'business_name' });
    expect(parseSellerDetails({ sellerType: 'business', businessName: 'Lind Konst', businessOrgNr: '556123-4568' })).toEqual({ ok: false, error: 'org_nr' });
    expect(parseSellerDetails({ sellerType: 'business', businessName: '  Lind Konst ', businessOrgNr: '5561234567' })).toEqual({
      ok: true,
      data: { sellerType: 'business', businessName: 'Lind Konst', businessOrgNr: '556123-4567' },
    });
  });
});

describe('sellerLine', () => {
  it('says who sold it', () => {
    expect(sellerLine({ name: 'Anna', sellerType: 'private' })).toBe('Anna (privatperson)');
    expect(sellerLine({ name: 'Anna', sellerType: 'business', businessName: 'Lind Konst', businessOrgNr: '556123-4567' }))
      .toBe('Lind Konst (företag, org.nr 556123-4567)');
    expect(sellerLine({ name: 'Anna', sellerType: null })).toBe('Anna');
  });
});

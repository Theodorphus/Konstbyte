// Whether a seller sells as a private person or as a business. On an online
// marketplace the buyer must be told which, based on the seller's own
// declaration (lagen om distansavtal): consumer rights such as the 14-day right
// of withdrawal only apply when the seller is a business, and then they are
// the seller's obligations, not Konstbyte's.

export const SELLER_TYPES = ['private', 'business'] as const;
export type SellerType = (typeof SELLER_TYPES)[number];

export function isSellerType(value: unknown): value is SellerType {
  return typeof value === 'string' && (SELLER_TYPES as readonly string[]).includes(value);
}

/**
 * A Swedish organisation number (or, for a sole trader, personal identity
 * number), checked with its Luhn digit. Accepts 10 or 12 digits with or without
 * a dash. Returns it as "NNNNNN-NNNN", or null if it isn't valid.
 */
export function normalizeOrgNr(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let digits = value.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length === 12) digits = digits.slice(2);
  if (digits.length !== 10) return null;

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let d = Number(digits[i]) * (i % 2 === 0 ? 2 : 1);
    if (d > 9) d -= 9;
    sum += d;
  }
  if (sum % 10 !== 0) return null;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

export const SELLER_TYPE_REQUIRED =
  'Ange i din profil om du säljer som privatperson eller företag innan du lägger upp konst.';

export interface SellerDetails {
  sellerType: SellerType;
  businessName: string | null;
  businessOrgNr: string | null;
}

export type SellerDetailsError = 'seller_type' | 'business_name' | 'org_nr';

export const SELLER_DETAILS_ERRORS: Record<SellerDetailsError, string> = {
  seller_type: 'Välj om du säljer som privatperson eller företag.',
  business_name: 'Skriv företagets namn.',
  org_nr: 'Kontrollera organisationsnumret (10 siffror, till exempel 556123-4567).',
};

/** Checks what a seller declared. Private sellers have no business details. */
export function parseSellerDetails(input: {
  sellerType?: unknown;
  businessName?: unknown;
  businessOrgNr?: unknown;
}): { ok: true; data: SellerDetails } | { ok: false; error: SellerDetailsError } {
  if (!isSellerType(input.sellerType)) return { ok: false, error: 'seller_type' };
  if (input.sellerType === 'private') {
    return { ok: true, data: { sellerType: 'private', businessName: null, businessOrgNr: null } };
  }
  const businessName = typeof input.businessName === 'string' ? input.businessName.trim().slice(0, 120) : '';
  if (businessName.length < 2) return { ok: false, error: 'business_name' };
  const businessOrgNr = normalizeOrgNr(input.businessOrgNr);
  if (!businessOrgNr) return { ok: false, error: 'org_nr' };
  return { ok: true, data: { sellerType: 'business', businessName, businessOrgNr } };
}

/** The seller line used in emails: "Anna Svensson (privatperson)". */
export function sellerLine(opts: {
  name: string;
  sellerType: string | null | undefined;
  businessName?: string | null;
  businessOrgNr?: string | null;
}): string {
  if (opts.sellerType === 'business') {
    const company = opts.businessName || opts.name;
    return `${company} (företag${opts.businessOrgNr ? `, org.nr ${opts.businessOrgNr}` : ''})`;
  }
  if (opts.sellerType === 'private') return `${opts.name} (privatperson)`;
  return opts.name;
}

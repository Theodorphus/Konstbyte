'use client';

import { useTranslations } from 'next-intl';
import type { SellerDetailsError, SellerType } from '@/lib/seller';

export interface SellerFormValues {
  sellerType: SellerType | null;
  businessName: string;
  businessOrgNr: string;
}

export const emptySellerForm: SellerFormValues = { sellerType: null, businessName: '', businessOrgNr: '' };

/** The same checks as the server (lib/seller), minus the org.nr check digit. */
export function sellerFormError(values: SellerFormValues): SellerDetailsError | null {
  if (!values.sellerType) return 'seller_type';
  if (values.sellerType === 'business') {
    if (values.businessName.trim().length < 2) return 'business_name';
    if (values.businessOrgNr.replace(/[\s-]/g, '').length < 10) return 'org_nr';
  }
  return null;
}

const inputClass =
  'w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50';

/** Lets a seller say whether they sell as a private person or a business. */
export default function SellerTypeFields({
  values,
  onChange,
  error,
  showHeading = true,
}: {
  values: SellerFormValues;
  onChange: (values: SellerFormValues) => void;
  error?: SellerDetailsError | 'generic' | null;
  showHeading?: boolean;
}) {
  const t = useTranslations('seller_type');
  const option = (type: SellerType, label: string, desc: string) => {
    const checked = values.sellerType === type;
    return (
      <label
        className={`flex gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
          checked ? 'border-slate-900 bg-slate-50' : 'border-stone-200 bg-white hover:border-slate-300'
        }`}
      >
        <input
          type="radio"
          name="sellerType"
          value={type}
          checked={checked}
          onChange={() => onChange({ ...values, sellerType: type })}
          className="mt-1 accent-slate-900"
        />
        <span className="space-y-0.5">
          <span className="block text-sm font-semibold text-slate-900">{label}</span>
          <span className="block text-xs text-slate-600 leading-relaxed">{desc}</span>
        </span>
      </label>
    );
  };

  return (
    <fieldset className="space-y-3">
      {showHeading ? (
        <legend className="space-y-1 mb-1">
          <span className="block text-base font-semibold text-slate-900">{t('heading')}</span>
          <span className="block text-sm text-slate-600 leading-relaxed">{t('desc')}</span>
        </legend>
      ) : (
        <legend className="sr-only">{t('heading')}</legend>
      )}
      {option('private', t('private_label'), t('private_desc'))}
      {option('business', t('business_label'), t('business_desc'))}

      {values.sellerType === 'business' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">{t('business_name_label')}</span>
            <input
              value={values.businessName}
              onChange={(e) => onChange({ ...values, businessName: e.target.value })}
              maxLength={120}
              autoComplete="organization"
              className={inputClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">{t('org_nr_label')}</span>
            <input
              value={values.businessOrgNr}
              onChange={(e) => onChange({ ...values, businessOrgNr: e.target.value })}
              inputMode="numeric"
              placeholder="556123-4567"
              maxLength={13}
              className={inputClass}
            />
          </label>
          <p className="sm:col-span-2 text-xs text-slate-500">{t('org_nr_hint')}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{t(`error_${error}`)}</p>}
    </fieldset>
  );
}

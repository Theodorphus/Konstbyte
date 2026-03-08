import { useState } from 'react';

export interface ShippingAddress {
  fullName: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
}

interface Props {
  onSubmit: (address: ShippingAddress) => void;
  onBack: () => void;
  loading?: boolean;
}

type Errors = Partial<Record<keyof Omit<ShippingAddress, 'phone'>, string>>;

export default function ShippingAddressForm({ onSubmit, onBack, loading }: Props) {
  const [values, setValues] = useState<ShippingAddress>({
    fullName: '',
    streetAddress: '',
    postalCode: '',
    city: '',
    country: 'Sverige',
    phone: '',
  });
  const [errors, setErrors] = useState<Errors>({});

  function set(field: keyof ShippingAddress, value: string) {
    setValues(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof Errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: Errors = {};
    if (!values.fullName.trim())      newErrors.fullName = 'Ange för- och efternamn';
    if (!values.streetAddress.trim()) newErrors.streetAddress = 'Ange gatuadress';
    if (!values.postalCode.trim())    newErrors.postalCode = 'Ange postnummer';
    if (!values.city.trim())          newErrors.city = 'Ange stad';
    if (!values.country.trim())       newErrors.country = 'Ange land';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Välj betalningsmetod
      </button>

      <div className="space-y-3">
        {/* Full name */}
        <Field label="För- och efternamn" error={errors.fullName}>
          <input
            type="text"
            autoComplete="name"
            placeholder="Anna Svensson"
            value={values.fullName}
            onChange={e => set('fullName', e.target.value)}
            className={inputClass(!!errors.fullName)}
          />
        </Field>

        {/* Street address */}
        <Field label="Gatuadress" error={errors.streetAddress}>
          <input
            type="text"
            autoComplete="street-address"
            placeholder="Storgatan 12"
            value={values.streetAddress}
            onChange={e => set('streetAddress', e.target.value)}
            className={inputClass(!!errors.streetAddress)}
          />
        </Field>

        {/* Postal code + city */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Postnummer" error={errors.postalCode}>
            <input
              type="text"
              autoComplete="postal-code"
              placeholder="413 27"
              value={values.postalCode}
              onChange={e => set('postalCode', e.target.value)}
              className={inputClass(!!errors.postalCode)}
            />
          </Field>
          <Field label="Stad" error={errors.city}>
            <input
              type="text"
              autoComplete="address-level2"
              placeholder="Göteborg"
              value={values.city}
              onChange={e => set('city', e.target.value)}
              className={inputClass(!!errors.city)}
            />
          </Field>
        </div>

        {/* Country */}
        <Field label="Land" error={errors.country}>
          <input
            type="text"
            autoComplete="country-name"
            value={values.country}
            onChange={e => set('country', e.target.value)}
            className={inputClass(!!errors.country)}
          />
        </Field>

        {/* Phone (optional) */}
        <Field label="Telefonnummer (valfritt)">
          <input
            type="tel"
            autoComplete="tel"
            placeholder="070-123 45 67"
            value={values.phone}
            onChange={e => set('phone', e.target.value)}
            className={inputClass(false)}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 active:bg-slate-800 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 opacity-80" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Ansluter…
          </>
        ) : (
          'Fortsätt till betalning →'
        )}
      </button>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-stone-400 bg-white focus:outline-none focus:ring-1 transition-colors ${
    hasError
      ? 'border-red-300 focus:ring-red-300'
      : 'border-stone-200 focus:ring-stone-400'
  }`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-stone-500">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

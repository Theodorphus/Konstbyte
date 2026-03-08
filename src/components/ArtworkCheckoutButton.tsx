'use client';

import dynamic from 'next/dynamic';

// Lazy-load the checkout modal so it doesn't bloat the artwork page bundle
const CheckoutModal = dynamic(() => import('./CheckoutModal'), { ssr: false });

interface Props {
  artworkId: string;
  title: string;
  imageUrl: string;
  price: number;
  ownerName: string;
  shippingType?: string;
  shippingCost?: number;
  shippingArea?: string;
  shippingCarrier?: string;
}

export default function ArtworkCheckoutButton(props: Props) {
  return <CheckoutModal {...props} />;
}

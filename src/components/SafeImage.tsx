'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src: string | null | undefined;
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK_SRC = '/og-image.png';

export default function SafeImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  onError,
  alt,
  sizes = '(max-width: 768px) 100vw, 50vw',
  ...props
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(
    src && src.trim().length > 0 ? src : fallbackSrc
  );

  useEffect(() => {
    setCurrentSrc(src && src.trim().length > 0 ? src : fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      sizes={sizes}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}

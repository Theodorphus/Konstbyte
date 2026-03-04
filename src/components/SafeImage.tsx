'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src: string | null | undefined;
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK_SRC = '/weinstock-brush-96240.jpg';

export default function SafeImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  onError,
  alt,
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
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}

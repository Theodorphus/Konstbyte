'use client';

import React from 'react';
import { UploadButton } from '@uploadthing/react';
import type { UploadRouter } from '../lib/uploadthing';

type Props = {
  onUploaded: (url: string) => void;
};

export default function UploadImageButton({ onUploaded }: Props) {
  return (
    <UploadButton<UploadRouter, 'artworkImage'>
      endpoint="artworkImage"
      onClientUploadComplete={(res) => {
        const url = res?.[0]?.url;
        if (url) onUploaded(url);
      }}
      onUploadError={(error) => alert(error.message)}
    />
  );
}

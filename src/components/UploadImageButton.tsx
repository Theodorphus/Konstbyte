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
      className="w-full"
      appearance={{
        container: 'w-full',
        button:
          'w-full py-3 text-base font-semibold bg-slate-900 text-white hover:bg-slate-800 transition rounded-md',
        allowedContent: 'text-xs text-slate-500 mt-2'
      }}
      content={{
        button: 'Välj bild att ladda upp',
        allowedContent: 'PNG/JPG upp till 8MB'
      }}
      onClientUploadComplete={(res) => {
        const url = res?.[0]?.url;
        if (url) onUploaded(url);
      }}
      onUploadError={(error) => alert(error.message)}
    />
  );
}

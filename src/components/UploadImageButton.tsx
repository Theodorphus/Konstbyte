'use client';

import React from 'react';
import { UploadButton } from '@uploadthing/react';
import type { UploadRouter } from '../lib/uploadthing';
import { useTranslations } from 'next-intl';

type Props = {
  onUploaded: (url: string) => void;
};

export default function UploadImageButton({ onUploaded }: Props) {
  const t = useTranslations('upload');

  return (
    <div className="w-full flex justify-center">
      <UploadButton<UploadRouter, 'artworkImage'>
        endpoint="artworkImage"
        content={{
          button({ ready }) {
            return (
              <span className="inline-flex items-center px-6 py-2 text-base font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer w-full justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                  />
                </svg>
                {t('button_label')}
              </span>
            );
          },
          allowedContent({ ready, isUploading }) {
            if (isUploading) return t('uploading');
            return t('allowed_formats');
          },
        }}
        appearance={{
          container: '',
          button: '!bg-blue-600 hover:!bg-blue-700 !text-white !rounded-lg !w-full !justify-center !relative',
        }}
        onClientUploadComplete={(res) => {
          const url = res?.[0]?.url;
          if (url) onUploaded(url);
        }}
        onUploadError={(error) => alert(error.message)}
      />
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { useUploadThing } from '@/lib/uploadthing-client';
import { ImageThumbnailGrid, type UploadedImage } from './ImageThumbnailGrid';
import { Upload, AlertCircle } from 'lucide-react';

export type { UploadedImage };

interface MultiImageDropzoneProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export function MultiImageDropzone({
  images,
  onChange,
  maxImages = 10,
}: MultiImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const { startUpload } = useUploadThing('artworkImage', {
    onClientUploadComplete: (res) => {
      if (res) {
        const newImages = res.map((file, idx) => ({
          url: file.url,
          isMain: images.length === 0 && idx === 0, // First image is main if no images yet
          sortOrder: images.length + idx,
        }));
        onChange([...images, ...newImages]);
      }
      setIsUploading(false);
      setUploadError(null);
    },
    onUploadError: (error) => {
      setUploadError(error.message);
      setIsUploading(false);
    },
  });

  const handleFiles = async (files: File[]) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      setUploadError('Välj endast bildfiler');
      return;
    }

    if (images.length + imageFiles.length > maxImages) {
      setUploadError(`Maximum ${maxImages} bilder tillåtna`);
      return;
    }

    setIsUploading(true);
    await startUpload(imageFiles);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleSetMain = (index: number) => {
    const newImages = images.map((img, idx) => ({
      ...img,
      isMain: idx === index,
    }));
    onChange(newImages);
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, idx) => idx !== index);
    // Re-sort and ensure at least one main image
    const reordered = newImages.map((img, idx) => ({
      ...img,
      sortOrder: idx,
      isMain: idx === 0 || img.isMain, // First becomes main if none set
    }));
    onChange(reordered);
  };

  const handleReorder = (reordered: UploadedImage[]) => {
    onChange(reordered);
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragActive
            ? 'border-amber-400 bg-amber-50/50'
            : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
        } ${isUploading || images.length >= maxImages ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          disabled={isUploading || images.length >= maxImages}
          className="hidden"
        />
        <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
        <p className="font-medium text-slate-900">
          {isDragActive ? 'Släpp bilderna här' : 'Dra bilder eller klicka'}
        </p>
        <p className="text-sm text-slate-500 mt-1">
          Max 10 bilder, 8 MB per bild. Stödda format: JPG, PNG, WebP
        </p>
        {images.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">
            {images.length} av {maxImages} bilder
          </p>
        )}
      </div>

      {/* Errors */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {uploadError}
        </div>
      )}

      {isUploading && (
        <div className="text-center py-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-amber-400" />
          <p className="text-sm text-slate-600 mt-2">Laddar upp...</p>
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-900 mb-3">
            Dina bilder ({images.length})
          </h3>
          <ImageThumbnailGrid
            images={images}
            onSetMain={handleSetMain}
            onRemove={handleRemove}
            onReorder={handleReorder}
          />
        </div>
      )}
    </div>
  );
}

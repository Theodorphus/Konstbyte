'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { Star, X, GripVertical } from 'lucide-react';

export interface UploadedImage {
  url: string;
  isMain: boolean;
  sortOrder: number;
}

interface ImageThumbnailGridProps {
  images: UploadedImage[];
  onSetMain: (index: number) => void;
  onRemove: (index: number) => void;
  onReorder: (images: UploadedImage[]) => void;
}

export function ImageThumbnailGrid({
  images,
  onSetMain,
  onRemove,
  onReorder,
}: ImageThumbnailGridProps) {
  const draggedIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    draggedIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    const sourceIndex = draggedIndex.current;
    if (sourceIndex === null || sourceIndex === targetIndex) {
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [removed] = newImages.splice(sourceIndex, 1);
    newImages.splice(targetIndex, 0, removed);

    // Update sortOrder
    const reordered = newImages.map((img, idx) => ({
      ...img,
      sortOrder: idx,
    }));

    onReorder(reordered);
    setDragOverIndex(null);
    draggedIndex.current = null;
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {images.map((image, idx) => (
        <div
          key={idx}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(idx)}
          onDragEnter={() => setDragOverIndex(idx)}
          onDragLeave={() => setDragOverIndex(null)}
          className={`relative group rounded-xl overflow-hidden aspect-square bg-slate-100 ring-2 transition-all ${
            image.isMain
              ? 'ring-amber-400 shadow-lg'
              : dragOverIndex === idx
                ? 'ring-amber-200 scale-105'
                : 'ring-slate-200'
          }`}
        >
          <Image
            src={image.url}
            alt="Artwork"
            fill
            className="object-cover"
          />

          {/* Drag handle */}
          <button
            className="absolute top-2 left-2 p-1 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Main image badge */}
          {image.isMain && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-amber-400 text-slate-950 rounded text-xs font-semibold">
              Huvudbild
            </div>
          )}

          {/* Controls - hidden by default, show on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 gap-1">
            <button
              onClick={() => onSetMain(idx)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded text-sm font-medium transition-colors ${
                image.isMain
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
              title="Set as main image"
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Huvud</span>
            </button>
            <button
              onClick={() => onRemove(idx)}
              className="px-2 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

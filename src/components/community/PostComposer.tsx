'use client';

import { useRef, useState } from 'react';
import { useUploadThing } from '../../lib/uploadthing-client';
import type { PostData } from './PostCard';

interface Props {
  currentUserEmail: string | null | undefined;
  currentUserName?: string | null;
  currentUserImage?: string | null;
  onPost: (post: PostData) => void;
}

export default function PostComposer({ currentUserEmail, currentUserName, currentUserImage, onPost }: Props) {
  const [content, setContent] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing('postImage', {
    onUploadBegin: () => setUploading(true),
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.url;
      if (url) setUploadedUrl(url);
      setUploading(false);
    },
    onUploadError: () => {
      setUploading(false);
      alert('Bilduppladdning misslyckades');
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview immediately
    setPreviewUrl(URL.createObjectURL(file));
    setUploadedUrl(null);
    // Upload
    await startUpload([file]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), imageUrl: uploadedUrl }),
      });
      if (res.ok) {
        const newPost: PostData = await res.json();
        onPost(newPost);
        setContent('');
        setPreviewUrl(null);
        setUploadedUrl(null);
        setExpanded(false);
      } else if (res.status === 401) {
        alert('Du måste vara inloggad för att skriva inlägg');
      } else {
        alert('Misslyckades att publicera inlägg');
      }
    } finally {
      setPosting(false);
    }
  }

  function removeImage() {
    setPreviewUrl(null);
    setUploadedUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const initials = currentUserName?.[0]?.toUpperCase() ?? currentUserEmail?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-stone-200 flex items-center justify-center flex-shrink-0 text-sm font-bold text-stone-700">
          {initials}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="Dela något med communityt…"
            rows={expanded ? 3 : 1}
            className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-all duration-200"
            disabled={posting}
          />

          {/* Image preview */}
          {previewUrl && (
            <div className="relative rounded-xl overflow-hidden bg-stone-100 max-h-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Förhandsvisning" className="w-full object-cover max-h-64" />
              {uploading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <p className="text-xs font-medium text-slate-600 animate-pulse">Laddar upp…</p>
                </div>
              )}
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-600 text-xs flex items-center justify-center hover:bg-white shadow-sm"
              >
                ✕
              </button>
            </div>
          )}

          {/* Toolbar + submit */}
          {(expanded || content) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="post-image-upload"
                  onChange={handleFileChange}
                  disabled={uploading || posting}
                />
                <label
                  htmlFor="post-image-upload"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-stone-100 cursor-pointer transition-colors"
                >
                  <span>🖼️</span>
                  <span>Bild</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                {expanded && (
                  <button
                    type="button"
                    onClick={() => { setExpanded(false); setContent(''); removeImage(); }}
                    className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:bg-stone-100 transition-colors"
                  >
                    Avbryt
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!content.trim() || posting || uploading}
                  className="px-5 py-1.5 rounded-full bg-amber-400 text-slate-900 text-xs font-semibold disabled:opacity-50 hover:bg-amber-300 transition-colors"
                >
                  {posting ? 'Publicerar…' : 'Publicera'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

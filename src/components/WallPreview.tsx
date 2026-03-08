'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  artworkUrl: string;
  artworkTitle: string;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const INITIAL_TRANSFORM: Transform = { x: 0, y: 0, scale: 0.4, rotation: 0 };

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-stone-600">{label}</span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          value ? 'bg-amber-500' : 'bg-stone-200'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ─── Slider ──────────────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-stone-700">{label}</label>
        <span className="text-xs text-stone-400 tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-stone-200 accent-amber-500 cursor-pointer"
      />
    </div>
  );
}

// ─── Upload Area ─────────────────────────────────────────────────────────────

function UploadArea({
  onFile,
}: {
  onFile: (file: File) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) onFile(file);
  };

  return (
    <div
      className={`absolute inset-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-5 transition-colors select-none ${
        dragging
          ? 'border-amber-400 bg-amber-950/20'
          : 'border-stone-600 bg-stone-800/30'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="w-16 h-16 rounded-full bg-stone-700/80 flex items-center justify-center">
        <svg
          className="w-7 h-7 text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      <div className="text-center space-y-1">
        <p className="text-stone-200 font-medium text-sm">
          Ladda upp ett foto av din vägg
        </p>
        <p className="text-stone-500 text-xs">
          Dra och släpp, eller välj en fil
        </p>
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        className="px-5 py-2.5 rounded-lg bg-amber-500 text-stone-900 text-sm font-semibold hover:bg-amber-400 active:bg-amber-600 transition-colors"
      >
        Välj foto
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WallPreview({ artworkUrl, artworkTitle }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [wallImage, setWallImage] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>(INITIAL_TRANSFORM);
  const [showFrame, setShowFrame] = useState(false);
  const [showShadow, setShowShadow] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const dragOrigin = useRef<{
    mouseX: number;
    mouseY: number;
    tx: number;
    ty: number;
  } | null>(null);

  // Escape key & body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setWallImage(e.target?.result as string);
      setTransform(INITIAL_TRANSFORM);
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Drag ──────────────────────────────────────────────────────────────────

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragOrigin.current = {
      mouseX: clientX,
      mouseY: clientY,
      tx: transform.x,
      ty: transform.y,
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  };

  const moveDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !dragOrigin.current) return;
      const dx = clientX - dragOrigin.current.mouseX;
      const dy = clientY - dragOrigin.current.mouseY;
      setTransform((prev) => ({
        ...prev,
        x: dragOrigin.current!.tx + dx,
        y: dragOrigin.current!.ty + dy,
      }));
    },
    [isDragging],
  );

  const endDrag = useCallback(() => {
    setIsDragging(false);
    dragOrigin.current = null;
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const mm = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const tm = (e: TouchEvent) => moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', endDrag);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', endDrag);
    };
  }, [isDragging, moveDrag, endDrag]);

  // ── Scroll zoom ──────────────────────────────────────────────────────────

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale + delta)),
    }));
  };

  // ── Derived styles ───────────────────────────────────────────────────────

  const artworkStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    maxWidth: '60%',
    transformOrigin: 'center center',
    transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    transition: isDragging ? 'none' : 'box-shadow 0.25s, border 0.25s',
    boxShadow: showShadow
      ? '0 25px 80px rgba(0,0,0,0.55), 0 6px 20px rgba(0,0,0,0.3)'
      : 'none',
    border: showFrame ? '14px solid #f2ede8' : '0px solid transparent',
    outline: showFrame ? '1px solid rgba(0,0,0,0.08)' : 'none',
  };

  // ── Trigger button (unmounted modal) ─────────────────────────────────────

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-stone-300 bg-stone-50 text-stone-700 text-sm font-medium hover:bg-stone-100 hover:border-stone-400 transition-colors"
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        Se på min vägg
      </button>
    );
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch bg-stone-950/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Förhandsgranska konstverk på din vägg"
    >
      {/* ── Canvas (left) ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden bg-stone-900" onWheel={onWheel}>
        {!wallImage ? (
          <UploadArea onFile={loadFile} />
        ) : (
          <>
            <img
              src={wallImage}
              alt="Din vägg"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            <img
              src={artworkUrl}
              alt={artworkTitle}
              style={artworkStyle}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              draggable={false}
            />
          </>
        )}
      </div>

      {/* ── Controls panel (right) ────────────────────────────────────────── */}
      <div className="w-72 bg-stone-50 border-l border-stone-200 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-semibold text-stone-900 text-sm leading-tight">
              Se på min vägg
            </h2>
            <p className="text-xs text-stone-400 mt-0.5 truncate">{artworkTitle}</p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {/* Tooltip trigger */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                className="w-6 h-6 rounded-full border border-stone-300 text-stone-500 text-xs font-semibold hover:bg-stone-100 transition-colors flex items-center justify-center"
                aria-label="Hjälp"
              >
                ?
              </button>

              {showTooltip && (
                <div className="absolute right-0 top-8 w-52 bg-stone-900 text-stone-100 text-xs rounded-xl p-3.5 shadow-2xl z-20 leading-relaxed">
                  <p className="font-semibold text-stone-100 mb-2">Hur använder jag det här?</p>
                  <ul className="space-y-1.5 text-stone-400">
                    <li>📷 Ladda upp ett foto av din vägg</li>
                    <li>✋ Dra konstverket för att flytta det</li>
                    <li>🖱 Skrolla för att zooma in/ut</li>
                    <li>🎛 Justera med reglagen till höger</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
              aria-label="Stäng"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 space-y-6">
          {/* Artwork thumbnail */}
          <div className="rounded-xl overflow-hidden bg-stone-100 border border-stone-200 aspect-square">
            <img
              src={artworkUrl}
              alt={artworkTitle}
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          {!wallImage && (
            <p className="text-xs text-stone-400 text-center leading-relaxed">
              Ladda upp ett foto av din vägg för att se hur konstverket passar in i ditt hem.
            </p>
          )}

          {wallImage && (
            <>
              {/* Sliders */}
              <div className="space-y-5">
                <Slider
                  label="Storlek"
                  value={Math.round(transform.scale * 100)}
                  min={10}
                  max={200}
                  unit="%"
                  onChange={(v) =>
                    setTransform((prev) => ({ ...prev, scale: v / 100 }))
                  }
                />
                <Slider
                  label="Rotation"
                  value={transform.rotation}
                  min={-180}
                  max={180}
                  unit="°"
                  onChange={(v) =>
                    setTransform((prev) => ({ ...prev, rotation: v }))
                  }
                />
              </div>

              {/* Appearance toggles */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                  Utseende
                </p>
                <Toggle label="Skugga" value={showShadow} onChange={setShowShadow} />
                <Toggle label="Ram" value={showFrame} onChange={setShowFrame} />
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setTransform(INITIAL_TRANSFORM)}
                  className="w-full py-2 text-xs text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  Återställ position
                </button>
                <button
                  onClick={() => {
                    setWallImage(null);
                    if (replaceInputRef.current) replaceInputRef.current.value = '';
                  }}
                  className="w-full py-2 text-xs text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  Byt väggfoto
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden replace input */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadFile(file);
        }}
      />
    </div>
  );
}

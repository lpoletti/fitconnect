'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaItem {
  url: string;
  type: string;
}

interface MediaLightboxProps {
  files: MediaItem[];
  initialIndex?: number;
  onClose: () => void;
}

export function MediaLightbox({ files, initialIndex = 0, onClose }: MediaLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const current = files[index];
  if (!current) return null;

  const prev = () => setIndex((i) => (i > 0 ? i - 1 : files.length - 1));
  const next = () => setIndex((i) => (i < files.length - 1 ? i + 1 : 0));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 z-50 text-white/80 hover:text-white bg-black/40 rounded-full p-2 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {files.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 z-50 text-white/80 hover:text-white bg-black/40 rounded-full p-2 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 z-50 text-white/80 hover:text-white bg-black/40 rounded-full p-2 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {current.type === 'image' ? (
          <img
            src={current.url}
            alt={`M\u00eddia ${index + 1}`}
            className="max-w-full max-h-[85vh] rounded-lg object-contain"
          />
        ) : (
          <video
            src={current.url}
            className="max-w-full max-h-[85vh] rounded-lg"
            controls
            autoPlay
          />
        )}
      </div>

      {files.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {files.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MediaGalleryProps {
  files: MediaItem[];
  thumbnailClass?: string;
}

export function MediaGallery({ files, thumbnailClass = 'h-14 w-14' }: MediaGalleryProps) {
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });
  const [failed, setFailed] = useState<Set<number>>(new Set());

  const markFailed = (idx: number) => setFailed(prev => new Set(prev).add(idx));
  const visible = files.filter((_, i) => !failed.has(i));
  const lightboxFiles = files.map((f, i) => ({ ...f, _origIdx: i })).filter(f => !failed.has(f._origIdx));

  if (!files || files.length === 0) return null;
  if (visible.length === 0) return null;

  return (
    <>
      <div className="flex gap-1.5 shrink-0">
        {files.map((m, i) => (
          failed.has(i) ? null : (
            <button
              key={i}
              type="button"
              onClick={() => {
                const visIdx = lightboxFiles.findIndex(f => f._origIdx === i);
                setLightbox({ open: true, index: visIdx >= 0 ? visIdx : 0 });
              }}
              className="relative cursor-pointer group rounded-lg overflow-hidden"
            >
              {m.type === 'image' ? (
                <img
                  src={m.url}
                  alt={`M\u00eddia ${i + 1}`}
                  className={`${thumbnailClass} rounded-lg object-cover group-hover:opacity-80 transition-opacity bg-muted`}
                  onError={() => markFailed(i)}
                />
              ) : (
                <div className="relative">
                  <video
                    src={m.url}
                    preload="metadata"
                    className={`${thumbnailClass} rounded-lg object-cover bg-muted`}
                    onError={() => markFailed(i)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[8px] border-l-black border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-0.5" />
                    </div>
                  </div>
                </div>
              )}
            </button>
          )
        ))}
      </div>
      {lightbox.open && (
        <MediaLightbox
          files={lightboxFiles.map(f => ({ url: f.url, type: f.type }))}
          initialIndex={lightbox.index}
          onClose={() => setLightbox({ open: false, index: 0 })}
        />
      )}
    </>
  );
}

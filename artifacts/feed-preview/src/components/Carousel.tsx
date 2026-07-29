'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { MediaItem } from '@/types';

interface CarouselProps {
  items: MediaItem[];
}

export default function Carousel({ items }: CarouselProps) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const total = items.length;

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(total - 1, i + 1)), [total]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (dx < -40) next();
    else if (dx > 40) prev();
  }

  const item = items[index];
  if (!item) return null;

  return (
    <div
      className="carousel-root"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="carousel-track">
        <div className="carousel-slide">
          <SlideMedia item={item} />
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            className="carousel-arrow prev"
            onClick={prev}
            disabled={index === 0}
            aria-label="Previous slide"
          >
            <ChevronLeft />
          </button>
          <button
            className="carousel-arrow next"
            onClick={next}
            disabled={index === total - 1}
            aria-label="Next slide"
          >
            <ChevronRight />
          </button>
          <div className="carousel-dots" aria-hidden="true">
            {items.map((_, i) => (
              <div key={i} className={`carousel-dot${i === index ? ' active' : ''}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SlideMedia({ item }: { item: MediaItem }) {
  if (item.type === 'video') {
    return (
      <video
        src={item.url}
        controls
        playsInline
        style={{ width: '100%', maxHeight: '70vh', display: 'block', background: '#000' }}
      />
    );
  }

  if (item.type === 'canva') {
    // Convert Canva share URL to embed URL
    const embedUrl = toCanvaEmbedUrl(item.url);
    return (
      <iframe
        src={embedUrl}
        style={{ width: '100%', aspectRatio: '1/1', border: 'none', display: 'block' }}
        allowFullScreen
        title="Canva design"
        loading="lazy"
      />
    );
  }

  // Default: image
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.url}
      alt={item.name ?? 'Post media'}
      style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
    />
  );
}

function toCanvaEmbedUrl(url: string): string {
  // https://www.canva.com/design/DAF.../view → append ?embed
  if (url.includes('?')) return `${url}&embed=1`;
  return `${url}?embed=1`;
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="10,4 6,8 10,12" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6,4 10,8 6,12" />
    </svg>
  );
}

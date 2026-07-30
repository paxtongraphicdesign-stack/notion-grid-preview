'use client';

import type { NotionPost } from '@/types';

interface GridTileProps {
  post: NotionPost;
  onClick: () => void;
}

export default function GridTile({ post, onClick }: GridTileProps) {
  const firstMedia = post.media[0];
  const hasMultiple = post.media.length > 1;

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="grid-tile" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      aria-label={`Open post: ${post.title}`}
    >
      {/* Thumbnail media */}
      {firstMedia ? (
        firstMedia.type === 'video' ? (
          <>
            {/* Use poster if available; fall back to a black box */}
            <video
              src={firstMedia.url}
              muted
              playsInline
              preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none'; }}
            />
            <span className="tile-video-icon" aria-hidden="true">
              <VideoIcon />
            </span>
          </>
        ) : firstMedia.type === 'canva' ? (
          <iframe
            src={toCanvaEmbedUrl(firstMedia.url)}
            className="canva-thumbnail"
            title={post.title}
            loading="lazy"
            tabIndex={-1}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstMedia.url}
            alt={post.title}
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              img.style.display = 'none';
              const parent = img.parentElement;
              if (parent) {
                const el = document.createElement('div');
                el.className = 'empty-label';
                el.textContent = 'No content';
                parent.appendChild(el);
              }
            }}
          />
        )
      ) : null}

      {/* Hover overlay */}
      <div className="tile-overlay" aria-hidden="true">
        <p className="tile-overlay-title">{post.title}</p>
        {formattedDate && <p className="tile-overlay-date">{formattedDate}</p>}
      </div>

      {/* Badges */}
      {post.pinned && <span className="tile-pin" aria-label="Pinned">📌</span>}
      {hasMultiple && !firstMedia?.type.includes('video') && (
        <span className="tile-multi-icon" aria-hidden="true"><MultiIcon /></span>
      )}
    </div>
  );
}

// Placeholder tile for empty grid slots
export function EmptyTile() {
  return (
    <div className="grid-tile empty">
      <span className="empty-label">No content</span>
    </div>
  );
}

function toCanvaEmbedUrl(url: string): string {
  if (url.includes('?')) return `${url}&embed=1`;
  return `${url}?embed=1`;
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function VideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function MultiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="3" width="14" height="14" rx="2"/>
      <path d="M3 7v11a3 3 0 0 0 3 3h11"/>
    </svg>
  );
}

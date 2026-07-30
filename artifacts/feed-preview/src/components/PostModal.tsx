import { useEffect, useCallback } from 'react';
import type { NotionPost } from '@/types';
import Carousel from './Carousel';

interface PostModalProps {
  post: NotionPost;
  onClose: () => void;
}

export default function PostModal({ post, onClose }: PostModalProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
    >
      <div className="modal-card">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className="modal-media">
          {post.media.length > 0 ? (
            <Carousel items={post.media} />
          ) : (
            <div className="modal-no-media">No media</div>
          )}
        </div>

        <div className="modal-meta">
          {post.caption && <p className="modal-caption">{post.caption}</p>}
          {formattedDate && <p className="modal-date">{formattedDate}</p>}
          <a
            className="modal-notion-link"
            href={post.notionUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <NotionIcon />
            Open in Notion
          </a>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="2" y1="2" x2="12" y2="12" />
      <line x1="12" y1="2" x2="2" y2="12" />
    </svg>
  );
}

function NotionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
      <path d="M6 6.4c1.6 1.3 2.2 1.2 5.2 1l49.3-2.9c.6 0 .1-.6 0-.6L52 .7c-1.1-.9-2.5-.5-3.7-.3L5.2 3.8C3.7 4 3.4 4.8 6 6.4z"/>
      <path d="M8.6 17.4V92c0 3 1.5 4.2 4.9 3.9l67-3.8c3.5-.2 4.4-2.4 4.4-5V13.5c0-2.6-1-3.9-3.3-3.7l-69.9 4c-2.4.1-3.1 1.4-3.1 3.6z" fill="#fff"/>
      <path d="M78.8 17.9l-45.3 2.6v52.8L20.9 61.7l-1.1 1.3 13.4 13.7 2.7-1.4V25.4l30.3-1.7V67.8l-8.8 4.9-1 1.2 11.3-1.3c2.9-.3 3.1-1.4 3.1-3.2V17.9z"/>
      <path d="M21.8 16.7l45.3-3.4c2.1-.2 2.7.3 2.7 2.2v2.4l-45.3 2.6v-2.4c0-1.5.1-1.2-2.7-1.4z"/>
    </svg>
  );
}

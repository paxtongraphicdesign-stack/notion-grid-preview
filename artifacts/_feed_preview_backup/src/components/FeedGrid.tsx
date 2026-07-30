'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NotionPost, FilterState, PostsResponse } from '@/types';
import { sortPosts, applyFilters, collectStatuses, collectPlatforms } from '@/lib/sort';
import GridTile, { EmptyTile } from './GridTile';
import FilterBar from './FilterBar';
import PostModal from './PostModal';

const INITIAL_VISIBLE = 12;
const MAX_POSTS = 60;
const GRID_MULTIPLE = 3; // always render a multiple of 3 slots

export default function FeedGrid() {
  const [allPosts, setAllPosts] = useState<NotionPost[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const [selected, setSelected] = useState<NotionPost | null>(null);
  const [filters, setFilters] = useState<FilterState>({ status: null, platform: null });
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/posts', { cache: 'no-store' });
      const data: PostsResponse = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setAllPosts(data.posts);
      setFetchedAt(data.fetchedAt);
      setVisible(INITIAL_VISIBLE);
      setFilters({ status: null, platform: null });
      setStatus('idle');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Derive display list
  const sorted = sortPosts(allPosts);
  const filtered = applyFilters(sorted, filters.status, filters.platform);
  const sliced = filtered.slice(0, Math.min(visible, MAX_POSTS));

  // Pad to next multiple of 3 for grid alignment
  const padded = sliced.length % GRID_MULTIPLE === 0
    ? sliced
    : [...sliced, ...Array(GRID_MULTIPLE - (sliced.length % GRID_MULTIPLE)).fill(null)];

  const statuses = collectStatuses(sorted);
  const platforms = collectPlatforms(sorted);

  const hasMore = filtered.length > visible && visible < MAX_POSTS;

  return (
    <>
      {/* Toolbar */}
      <div className="feed-toolbar">
        <button
          className={`btn-refresh${status === 'loading' ? ' loading' : ''}`}
          onClick={fetchPosts}
          disabled={status === 'loading'}
          aria-label="Refresh feed"
        >
          <RefreshIcon />
          {status === 'loading' ? 'Loading…' : 'Refresh'}
        </button>
        <FilterBar
          statuses={statuses}
          platforms={platforms}
          selectedStatus={filters.status}
          selectedPlatform={filters.platform}
          onStatusChange={(v) => { setFilters((f) => ({ ...f, status: v })); setVisible(INITIAL_VISIBLE); }}
          onPlatformChange={(v) => { setFilters((f) => ({ ...f, platform: v })); setVisible(INITIAL_VISIBLE); }}
        />
      </div>

      {/* States */}
      {status === 'loading' && allPosts.length === 0 && (
        <div className="feed-state" aria-live="polite">
          <LoadingSpinner />
          <p className="state-title">Loading your feed…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="feed-state" role="alert">
          <p className="state-title">Could not load posts</p>
          <p className="state-error">{error}</p>
          <p className="state-body">Check that your Notion token and database ID are correct, and that the integration is shared with your database.</p>
          <button className="btn-refresh" onClick={fetchPosts} style={{ marginTop: 8 }}>
            <RefreshIcon /> Retry
          </button>
        </div>
      )}

      {status === 'idle' && filtered.length === 0 && allPosts.length === 0 && (
        <div className="feed-state">
          <p className="state-title">No posts yet</p>
          <p className="state-body">Add content to your Notion database and hit Refresh.</p>
        </div>
      )}

      {status === 'idle' && filtered.length === 0 && allPosts.length > 0 && (
        <div className="feed-state">
          <p className="state-title">No matching posts</p>
          <p className="state-body">Try clearing the filters above.</p>
        </div>
      )}

      {/* Grid */}
      {(status !== 'error' && (allPosts.length > 0 || status === 'loading')) && (
        <>
          <div className="feed-grid" aria-label="Content feed">
            {padded.map((post, i) =>
              post ? (
                <GridTile
                  key={post.id}
                  post={post}
                  onClick={() => setSelected(post)}
                />
              ) : (
                <EmptyTile key={`empty-${i}`} />
              ),
            )}
          </div>

          {hasMore && (
            <div className="load-more-bar">
              <button
                className="btn-load-more"
                onClick={() => setVisible((v) => Math.min(v + 12, MAX_POSTS))}
              >
                Load more
              </button>
            </div>
          )}

          {fetchedAt && (
            <p style={{ fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 6 }}>
              Updated {new Date(fetchedAt).toLocaleTimeString()}
            </p>
          )}
        </>
      )}

      {/* Modal */}
      {selected && (
        <PostModal post={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

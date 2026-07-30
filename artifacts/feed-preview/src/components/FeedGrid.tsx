import { useState } from 'react';
import { useGetPosts } from '@workspace/api-client-react';
import type { NotionPost, FilterState } from '@/types';
import { applyFilters, collectStatuses, collectPlatforms } from '@/lib/sort';
import GridTile, { EmptyTile } from './GridTile';
import FilterBar from './FilterBar';
import PostModal from './PostModal';

const INITIAL_VISIBLE = 12;
const MAX_POSTS = 60;
const GRID_MULTIPLE = 3;

export default function FeedGrid() {
  const { data, isLoading, isError, error, refetch, isFetching } = useGetPosts();

  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const [selected, setSelected] = useState<NotionPost | null>(null);
  const [filters, setFilters] = useState<FilterState>({ status: null, platform: null });

  const allPosts = (data?.posts ?? []) as NotionPost[];
  const apiError = data?.error;
  const fetchedAt = data?.fetchedAt;

  const isSpinning = isLoading || isFetching;

  // Derive display list (server already sorts; we still allow client filters)
  const filtered = applyFilters(allPosts, filters.status, filters.platform);
  const sliced = filtered.slice(0, Math.min(visible, MAX_POSTS));

  // Pad to next multiple of 3
  const padded =
    sliced.length % GRID_MULTIPLE === 0
      ? sliced
      : [...sliced, ...Array(GRID_MULTIPLE - (sliced.length % GRID_MULTIPLE)).fill(null)];

  const statuses = collectStatuses(allPosts);
  const platforms = collectPlatforms(allPosts);
  const hasMore = filtered.length > visible && visible < MAX_POSTS;

  function handleRefresh() {
    setVisible(INITIAL_VISIBLE);
    setFilters({ status: null, platform: null });
    refetch();
  }

  const showError = isError || !!apiError;
  const errorMessage = isError
    ? (error instanceof Error ? error.message : String(error))
    : (apiError ?? null);

  return (
    <>
      {/* Toolbar */}
      <div className="feed-toolbar">
        <button
          className={`btn-refresh${isSpinning ? ' loading' : ''}`}
          onClick={handleRefresh}
          disabled={isSpinning}
          aria-label="Refresh feed"
        >
          <RefreshIcon />
          {isSpinning ? 'Loading…' : 'Refresh'}
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
      {isLoading && allPosts.length === 0 && (
        <div className="feed-state" aria-live="polite">
          <LoadingSpinner />
          <p className="state-title">Loading your feed…</p>
        </div>
      )}

      {showError && (
        <div className="feed-state" role="alert">
          <p className="state-title">Could not load posts</p>
          <p className="state-error">{errorMessage}</p>
          <p className="state-body">
            Check that your Notion token and database ID are correct, and that the integration is shared with your database.
          </p>
          <button className="btn-refresh" onClick={handleRefresh} style={{ marginTop: 8 }}>
            <RefreshIcon /> Retry
          </button>
        </div>
      )}

      {!isLoading && !showError && filtered.length === 0 && allPosts.length === 0 && (
        <div className="feed-state">
          <p className="state-title">No posts yet</p>
          <p className="state-body">Add content to your Notion database and hit Refresh.</p>
        </div>
      )}

      {!isLoading && !showError && filtered.length === 0 && allPosts.length > 0 && (
        <div className="feed-state">
          <p className="state-title">No matching posts</p>
          <p className="state-body">Try clearing the filters above.</p>
        </div>
      )}

      {/* Grid */}
      {!showError && (allPosts.length > 0 || isLoading) && (
        <>
          <div className="feed-grid" aria-label="Content feed">
            {padded.map((post, i) =>
              post ? (
                <GridTile
                  key={(post as NotionPost).id}
                  post={post as NotionPost}
                  onClick={() => setSelected(post as NotionPost)}
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

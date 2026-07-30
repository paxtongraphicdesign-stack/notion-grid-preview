import type { NotionPost } from '@/types';

/**
 * Sort posts: pinned first, then by date descending (newest first).
 * Posts without a date appear at the end of the non-pinned group.
 */
export function sortPosts(posts: NotionPost[]): NotionPost[] {
  return [...posts].sort((a, b) => {
    // Pinned always float to top
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    // Within same pinned group: sort by date descending
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Remove posts where Hidden is true.
 */
export function filterHidden(posts: NotionPost[]): NotionPost[] {
  return posts.filter((p) => !p.hidden);
}

/**
 * Apply optional status and platform filters.
 */
export function applyFilters(
  posts: NotionPost[],
  status: string | null,
  platform: string | null,
): NotionPost[] {
  return posts.filter((p) => {
    if (status && p.status !== status) return false;
    if (platform && !p.platforms.includes(platform)) return false;
    return true;
  });
}

/**
 * Collect distinct status values from a post list (ignoring nulls).
 */
export function collectStatuses(posts: NotionPost[]): string[] {
  const set = new Set<string>();
  for (const p of posts) {
    if (p.status) set.add(p.status);
  }
  return Array.from(set).sort();
}

/**
 * Collect distinct platform values from a post list.
 */
export function collectPlatforms(posts: NotionPost[]): string[] {
  const set = new Set<string>();
  for (const p of posts) {
    for (const pl of p.platforms) set.add(pl);
  }
  return Array.from(set).sort();
}

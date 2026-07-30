import type { NotionPost } from '@/types';

/**
 * Sort posts: pinned first, then by date descending (newest first).
 * Posts without a date appear at the end of the non-pinned group.
 */
export function sortPosts(posts: NotionPost[]): NotionPost[] {
  return [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function filterHidden(posts: NotionPost[]): NotionPost[] {
  return posts.filter((p) => !p.hidden);
}

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

export function collectStatuses(posts: NotionPost[]): string[] {
  const set = new Set<string>();
  for (const p of posts) {
    if (p.status) set.add(p.status);
  }
  return Array.from(set).sort();
}

export function collectPlatforms(posts: NotionPost[]): string[] {
  const set = new Set<string>();
  for (const p of posts) {
    for (const pl of p.platforms) set.add(pl);
  }
  return Array.from(set).sort();
}

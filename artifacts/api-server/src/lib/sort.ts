import type { NotionPost } from './notion.js';

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

/**
 * Remove posts where Hidden is true.
 */
export function filterHidden(posts: NotionPost[]): NotionPost[] {
  return posts.filter((p) => !p.hidden);
}

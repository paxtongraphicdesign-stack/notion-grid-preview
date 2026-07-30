import { Router } from 'express';
import { queryPosts } from '../lib/notion.js';
import { filterHidden, sortPosts } from '../lib/sort.js';

const router = Router();

// Sort utilities (inline — no frontend dep)
function sortAndFilter(posts: ReturnType<typeof filterHidden>) {
  const visible = filterHidden(posts);
  return sortPosts(visible);
}

router.get('/posts', async (_req, res) => {
  try {
    const raw = await queryPosts();
    const posts = sortAndFilter(raw);
    res.json({
      posts,
      fetchedAt: new Date().toISOString(),
      error: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[posts] GET /posts error:', message);
    // Return 200 with error payload so the frontend can show the message
    res.json({
      posts: [],
      fetchedAt: new Date().toISOString(),
      error: message,
    });
  }
});

export default router;

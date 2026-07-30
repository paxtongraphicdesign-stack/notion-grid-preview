import { Router } from 'express';
import { queryPosts } from '../lib/notion.js';
import { filterHidden, sortPosts } from '../lib/sort.js';

const router = Router();

router.get('/posts', async (req, res) => {
  const databaseId = typeof req.query['databaseId'] === 'string'
    ? req.query['databaseId']
    : undefined;

  try {
    const raw = await queryPosts(databaseId);
    const posts = sortPosts(filterHidden(raw));
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

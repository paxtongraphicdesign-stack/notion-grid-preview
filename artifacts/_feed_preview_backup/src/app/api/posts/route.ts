import { NextResponse } from 'next/server';
import { queryPosts } from '@/lib/notion';
import type { PostsResponse } from '@/types';

export const dynamic = 'force-dynamic'; // Never cache; always fetch fresh Notion data

export async function GET(): Promise<NextResponse<PostsResponse>> {
  try {
    const posts = await queryPosts();
    return NextResponse.json(
      { posts, fetchedAt: new Date().toISOString() },
      {
        headers: {
          // Prevent CDN/browser caching so Refresh always fetches live data
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[api/posts] Error:', message);
    return NextResponse.json(
      { posts: [], fetchedAt: new Date().toISOString(), error: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

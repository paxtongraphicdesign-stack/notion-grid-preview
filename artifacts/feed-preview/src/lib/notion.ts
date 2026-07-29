/**
 * Server-only Notion API client.
 * This module must never be imported from client components.
 */
import { Client } from '@notionhq/client';
import type { NotionPost } from '@/types';
import { parseNotionFiles, parseLinkProperty } from '@/lib/media';
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints';

// ── Env validation ────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

// ── Property helpers ──────────────────────────────────────────────────────────

type AnyProperty = PageObjectResponse['properties'][string];

function getTitle(props: PageObjectResponse['properties']): string {
  const p = props['Name'];
  if (!p || p.type !== 'title') return 'Untitled';
  return p.title.map((t) => t.plain_text).join('').trim() || 'Untitled';
}

function getDate(props: PageObjectResponse['properties']): string | null {
  const p = props['Date'];
  if (!p || p.type !== 'date') return null;
  return p.date?.start ?? null;
}

function getCaption(props: PageObjectResponse['properties']): string {
  const p = props['Caption'];
  if (!p || p.type !== 'rich_text') return '';
  return p.rich_text.map((t) => t.plain_text).join('').trim();
}

function getCheckbox(props: PageObjectResponse['properties'], name: string): boolean {
  const p = props[name];
  if (!p || p.type !== 'checkbox') return false;
  return p.checkbox;
}

function getPlatforms(props: PageObjectResponse['properties']): string[] {
  const p = props['Platforms'];
  if (!p) return [];
  if (p.type === 'multi_select') return p.multi_select.map((o) => o.name);
  if (p.type === 'select') return p.select ? [p.select.name] : [];
  // Handle Relation type (names not directly available without extra fetch — skip)
  return [];
}

function getStatus(props: PageObjectResponse['properties']): string | null {
  const p = props['Status'];
  if (!p) return null;
  if (p.type === 'status') return p.status?.name ?? null;
  if (p.type === 'select') return p.select?.name ?? null;
  return null;
}

function getLinkProperty(props: PageObjectResponse['properties']): string | null {
  // Optional "Link" property (rich_text or url) for external media URLs
  const p = props['Link'];
  if (!p) return null;
  if (p.type === 'rich_text') return p.rich_text.map((t) => t.plain_text).join('').trim() || null;
  if (p.type === 'url') return p.url ?? null;
  return null;
}

// ── Page mapper ───────────────────────────────────────────────────────────────

function mapPage(page: PageObjectResponse): NotionPost {
  const props = page.properties;

  const filesMedia = props['Files & Media'];
  const rawFiles =
    filesMedia && filesMedia.type === 'files' ? filesMedia.files : [];

  let media = parseNotionFiles(rawFiles as Parameters<typeof parseNotionFiles>[0]);

  // If no attached files, check optional Link property
  if (media.length === 0) {
    const link = getLinkProperty(props);
    if (link) {
      const item = parseLinkProperty(link);
      if (item) media = [item];
    }
  }

  return {
    id: page.id,
    notionUrl: page.url,
    title: getTitle(props),
    date: getDate(props),
    caption: getCaption(props),
    hidden: getCheckbox(props, 'Hidden'),
    pinned: getCheckbox(props, 'Pinned'),
    platforms: getPlatforms(props),
    status: getStatus(props),
    media,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function queryPosts(): Promise<NotionPost[]> {
  const token = requireEnv('NOTION_TOKEN');
  const databaseId = requireEnv('NOTION_DATABASE_ID');

  const notion = new Client({ auth: token });

  const posts: NotionPost[] = [];
  let cursor: string | undefined;
  const MAX_POSTS = 60;

  try {
    do {
      // NOTE: We do NOT sort server-side because Notion rejects sorts for
      // properties that don't exist in the database schema (e.g. if the user
      // named their date column differently). All ordering is handled client-
      // side by sort.ts. We also avoid a Hidden filter for the same reason —
      // hidden filtering happens in sort.ts after the fetch.
      const response: QueryDatabaseResponse = await notion.databases.query({
        database_id: databaseId,
        start_cursor: cursor,
        page_size: Math.min(100, MAX_POSTS - posts.length),
      });

      for (const result of response.results) {
        // Skip partial pages (no properties)
        if (!('properties' in result)) continue;
        try {
          posts.push(mapPage(result as PageObjectResponse));
        } catch (err) {
          console.error('[notion] Failed to map page', result.id, err);
        }
      }

      cursor =
        response.has_more && response.next_cursor
          ? response.next_cursor
          : undefined;
    } while (cursor && posts.length < MAX_POSTS);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[notion] queryPosts error:', message);
    throw new Error(`Notion API error: ${message}`);
  }

  return posts.slice(0, MAX_POSTS);
}

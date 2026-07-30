/**
 * Server-only Notion API client.
 * Reads NOTION_TOKEN and NOTION_DATABASE_ID from environment variables.
 */
import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints.js';

// ── Types ──────────────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video' | 'canva' | 'unknown';

export interface MediaItem {
  type: MediaType;
  url: string;
  name?: string | null;
}

export interface NotionPost {
  id: string;
  notionUrl: string;
  title: string;
  date: string | null;
  caption: string;
  hidden: boolean;
  pinned: boolean;
  platforms: string[];
  status: string | null;
  media: MediaItem[];
}

// ── Media helpers ──────────────────────────────────────────────────────────────

const VIDEO_EXTENSIONS = /\.(mp4|mov|avi|webm|mkv|m4v|ogv)(\?|#|$)/i;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif|heic|heif)(\?|#|$)/i;

function detectMediaType(urlOrName: string): MediaType {
  const lower = urlOrName.toLowerCase();
  if (lower.includes('canva.com')) return 'canva';
  if (VIDEO_EXTENSIONS.test(lower)) return 'video';
  if (IMAGE_EXTENSIONS.test(lower)) return 'image';
  // Signed Notion S3 URLs don't have extensions — default to image
  return 'image';
}

interface NotionInternalFile {
  type: 'file';
  name?: string;
  file: { url: string; expiry_time: string };
}
interface NotionExternalFile {
  type: 'external';
  name?: string;
  external: { url: string };
}
type NotionFileValue = NotionInternalFile | NotionExternalFile;

function parseNotionFiles(files: NotionFileValue[]): MediaItem[] {
  return files.map((f) => {
    if (f.type === 'file') {
      return { type: detectMediaType(f.name ?? f.file.url), url: f.file.url, name: f.name };
    }
    return { type: detectMediaType(f.name ?? f.external.url), url: f.external.url, name: f.name };
  });
}

function parseLinkProperty(url: string): MediaItem | null {
  if (!url.trim()) return null;
  return { type: detectMediaType(url), url: url.trim() };
}

// ── Property helpers ──────────────────────────────────────────────────────────

function getTitle(props: PageObjectResponse['properties']): string {
  const p = props['Name'];
  if (!p || p.type !== 'title') return 'Untitled';
  return p.title.map((t) => t.plain_text).join('').trim() || 'Untitled';
}

function getDate(props: PageObjectResponse['properties']): string | null {
  const p = props['Publish Date'];
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
  const p = props['Link'];
  if (!p) return null;
  if (p.type === 'rich_text') return p.rich_text.map((t) => t.plain_text).join('').trim() || null;
  if (p.type === 'url') return p.url ?? null;
  return null;
}

// ── Page mapper ───────────────────────────────────────────────────────────────

// Log the raw Attachment property once so operators can confirm the URL is present
let _attachmentLogged = false;

function mapPage(page: PageObjectResponse): NotionPost {
  const props = page.properties;

  // Accept both 'Attachment' (user's property name) and the legacy 'Files & Media'
  const attachmentProp = props['Attachment'] ?? props['Files & Media'];

  if (!_attachmentLogged) {
    _attachmentLogged = true;
    console.log('[notion] raw Attachment prop (first page):', JSON.stringify(attachmentProp ?? null, null, 2));
  }

  const rawFiles =
    attachmentProp && attachmentProp.type === 'files' ? attachmentProp.files : [];

  let media = parseNotionFiles(rawFiles as NotionFileValue[]);

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

export async function queryPosts(databaseIdOverride?: string): Promise<NotionPost[]> {
  const token = process.env['NOTION_TOKEN'];
  const databaseId = databaseIdOverride?.trim() || process.env['NOTION_DATABASE_ID'];

  if (!token) throw new Error('Missing required environment variable: NOTION_TOKEN');
  if (!databaseId) throw new Error('No databaseId provided and NOTION_DATABASE_ID env var is not set');

  const notion = new Client({ auth: token });

  const posts: NotionPost[] = [];
  let cursor: string | undefined;
  const MAX_POSTS = 60;

  do {
    // NOTE: We do NOT sort server-side because Notion rejects sorts for
    // properties that don't exist in the database schema. All ordering is
    // handled after the fetch. We also avoid a Hidden filter for the same
    // reason.
    const response: QueryDatabaseResponse = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: Math.min(100, MAX_POSTS - posts.length),
    });

    for (const result of response.results) {
      if (!('properties' in result)) continue;
      try {
        posts.push(mapPage(result as PageObjectResponse));
      } catch (err) {
        console.error('[notion] Failed to map page', (result as { id: string }).id, err);
      }
    }

    cursor =
      response.has_more && response.next_cursor
        ? response.next_cursor
        : undefined;
  } while (cursor && posts.length < MAX_POSTS);

  return posts.slice(0, MAX_POSTS);
}

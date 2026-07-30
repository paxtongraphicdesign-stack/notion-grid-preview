import type { MediaItem, MediaType } from '@/types';

const VIDEO_EXTENSIONS = /\.(mp4|mov|avi|webm|mkv|m4v|ogv)(\?|#|$)/i;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif|heic|heif)(\?|#|$)/i;

export function detectMediaType(urlOrName: string): MediaType {
  const lower = urlOrName.toLowerCase();
  if (lower.includes('canva.com')) return 'canva';
  if (VIDEO_EXTENSIONS.test(lower)) return 'video';
  if (IMAGE_EXTENSIONS.test(lower)) return 'image';
  // Signed Notion S3 URLs don't have extensions — default to image
  return 'image';
}

export function parseNotionFiles(files: NotionFileValue[]): MediaItem[] {
  return files.map((f) => {
    if (f.type === 'file') {
      return {
        type: detectMediaType(f.name ?? f.file.url),
        url: f.file.url,
        name: f.name,
      };
    }
    // external
    return {
      type: detectMediaType(f.name ?? f.external.url),
      url: f.external.url,
      name: f.name,
    };
  });
}

export function parseLinkProperty(url: string): MediaItem | null {
  if (!url.trim()) return null;
  return {
    type: detectMediaType(url),
    url: url.trim(),
  };
}

// ── Notion SDK raw types ──────────────────────────────────────────────────────
// We inline these here so callers don't need to import from the SDK internals.

export interface NotionInternalFile {
  type: 'file';
  name?: string;
  file: { url: string; expiry_time: string };
}
export interface NotionExternalFile {
  type: 'external';
  name?: string;
  external: { url: string };
}
export type NotionFileValue = NotionInternalFile | NotionExternalFile;

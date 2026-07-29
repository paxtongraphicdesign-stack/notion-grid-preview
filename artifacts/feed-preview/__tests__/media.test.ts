import { detectMediaType, parseNotionFiles } from '../src/lib/media';
import type { NotionFileValue } from '../src/lib/media';

describe('detectMediaType', () => {
  it('detects images by extension', () => {
    expect(detectMediaType('photo.jpg')).toBe('image');
    expect(detectMediaType('banner.PNG')).toBe('image');
    expect(detectMediaType('design.webp')).toBe('image');
    expect(detectMediaType('icon.svg')).toBe('image');
    expect(detectMediaType('shot.avif')).toBe('image');
  });

  it('detects videos by extension', () => {
    expect(detectMediaType('clip.mp4')).toBe('video');
    expect(detectMediaType('reel.MOV')).toBe('video');
    expect(detectMediaType('story.webm')).toBe('video');
    expect(detectMediaType('short.m4v')).toBe('video');
  });

  it('detects Canva URLs', () => {
    expect(detectMediaType('https://www.canva.com/design/DAFxyz/view')).toBe('canva');
    expect(detectMediaType('https://canva.com/design/DAF123')).toBe('canva');
  });

  it('defaults to image for Notion signed S3 URLs without extension', () => {
    const s3Url =
      'https://prod-files-secure.s3.us-west-2.amazonaws.com/abc/def/image?X-Amz-Algorithm=AWS4';
    expect(detectMediaType(s3Url)).toBe('image');
  });

  it('handles URLs with query strings correctly', () => {
    expect(detectMediaType('https://example.com/video.mp4?t=123')).toBe('video');
    expect(detectMediaType('https://example.com/photo.jpg?w=800')).toBe('image');
  });
});

describe('parseNotionFiles', () => {
  it('maps internal file records', () => {
    const files: NotionFileValue[] = [
      {
        type: 'file',
        name: 'photo.jpg',
        file: { url: 'https://s3.example.com/photo.jpg', expiry_time: '2025-01-01T00:00:00Z' },
      },
    ];
    const result = parseNotionFiles(files);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('image');
    expect(result[0].url).toBe('https://s3.example.com/photo.jpg');
    expect(result[0].name).toBe('photo.jpg');
  });

  it('maps external file records', () => {
    const files: NotionFileValue[] = [
      {
        type: 'external',
        name: 'clip.mp4',
        external: { url: 'https://example.com/clip.mp4' },
      },
    ];
    const result = parseNotionFiles(files);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('video');
    expect(result[0].url).toBe('https://example.com/clip.mp4');
  });

  it('returns multiple media items for multiple files', () => {
    const files: NotionFileValue[] = [
      {
        type: 'file',
        name: 'a.jpg',
        file: { url: 'https://s3.example.com/a.jpg', expiry_time: '' },
      },
      {
        type: 'file',
        name: 'b.mp4',
        file: { url: 'https://s3.example.com/b.mp4', expiry_time: '' },
      },
    ];
    const result = parseNotionFiles(files);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('image');
    expect(result[1].type).toBe('video');
  });

  it('returns empty array for empty input', () => {
    expect(parseNotionFiles([])).toEqual([]);
  });
});

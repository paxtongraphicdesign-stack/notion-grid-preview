import { filterHidden, applyFilters, collectStatuses, collectPlatforms } from '../src/lib/sort';
import type { NotionPost } from '../src/types';

function makePost(overrides: Partial<NotionPost>): NotionPost {
  return {
    id: Math.random().toString(36).slice(2),
    notionUrl: 'https://notion.so/test',
    title: 'Test',
    date: null,
    caption: '',
    hidden: false,
    pinned: false,
    platforms: [],
    status: null,
    media: [],
    ...overrides,
  };
}

describe('filterHidden', () => {
  it('removes posts where hidden is true', () => {
    const posts = [
      makePost({ hidden: false, title: 'Visible' }),
      makePost({ hidden: true, title: 'Hidden' }),
    ];
    const result = filterHidden(posts);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Visible');
  });

  it('returns all posts when none are hidden', () => {
    const posts = [makePost({}), makePost({})];
    expect(filterHidden(posts)).toHaveLength(2);
  });

  it('returns empty array when all posts are hidden', () => {
    const posts = [makePost({ hidden: true }), makePost({ hidden: true })];
    expect(filterHidden(posts)).toHaveLength(0);
  });
});

describe('applyFilters', () => {
  const posts = [
    makePost({ status: 'Draft', platforms: ['Instagram'] }),
    makePost({ status: 'Published', platforms: ['Instagram', 'TikTok'] }),
    makePost({ status: 'Draft', platforms: ['LinkedIn'] }),
  ];

  it('returns all posts when no filters applied', () => {
    expect(applyFilters(posts, null, null)).toHaveLength(3);
  });

  it('filters by status', () => {
    const result = applyFilters(posts, 'Draft', null);
    expect(result).toHaveLength(2);
    result.forEach((p) => expect(p.status).toBe('Draft'));
  });

  it('filters by platform', () => {
    const result = applyFilters(posts, null, 'Instagram');
    expect(result).toHaveLength(2);
  });

  it('filters by status AND platform', () => {
    const result = applyFilters(posts, 'Published', 'TikTok');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Published');
  });

  it('returns empty when no post matches combined filter', () => {
    const result = applyFilters(posts, 'Published', 'LinkedIn');
    expect(result).toHaveLength(0);
  });
});

describe('collectStatuses', () => {
  it('collects unique statuses and ignores nulls', () => {
    const posts = [
      makePost({ status: 'Draft' }),
      makePost({ status: 'Published' }),
      makePost({ status: 'Draft' }),
      makePost({ status: null }),
    ];
    const result = collectStatuses(posts);
    expect(result).toEqual(['Draft', 'Published']);
  });
});

describe('collectPlatforms', () => {
  it('collects unique platforms across all posts', () => {
    const posts = [
      makePost({ platforms: ['Instagram', 'TikTok'] }),
      makePost({ platforms: ['Instagram', 'LinkedIn'] }),
    ];
    const result = collectPlatforms(posts);
    expect(result).toEqual(['Instagram', 'LinkedIn', 'TikTok']);
  });
});

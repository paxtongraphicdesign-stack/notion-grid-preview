import { sortPosts } from '../src/lib/sort';
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

describe('sortPosts', () => {
  it('sorts by date descending', () => {
    const posts = [
      makePost({ date: '2025-01-01' }),
      makePost({ date: '2025-03-01' }),
      makePost({ date: '2025-02-01' }),
    ];
    const result = sortPosts(posts);
    expect(result[0].date).toBe('2025-03-01');
    expect(result[1].date).toBe('2025-02-01');
    expect(result[2].date).toBe('2025-01-01');
  });

  it('places pinned posts before non-pinned', () => {
    const pinned = makePost({ pinned: true, date: '2025-01-01', title: 'Pinned' });
    const recent = makePost({ pinned: false, date: '2025-03-01', title: 'Recent' });
    const result = sortPosts([recent, pinned]);
    expect(result[0].title).toBe('Pinned');
    expect(result[1].title).toBe('Recent');
  });

  it('sorts pinned posts by date among themselves', () => {
    const p1 = makePost({ pinned: true, date: '2025-01-01', title: 'PinnedOld' });
    const p2 = makePost({ pinned: true, date: '2025-05-01', title: 'PinnedNew' });
    const result = sortPosts([p1, p2]);
    expect(result[0].title).toBe('PinnedNew');
    expect(result[1].title).toBe('PinnedOld');
  });

  it('places posts without a date at the end', () => {
    const withDate = makePost({ date: '2025-03-01', title: 'HasDate' });
    const noDate = makePost({ date: null, title: 'NoDate' });
    const result = sortPosts([noDate, withDate]);
    expect(result[0].title).toBe('HasDate');
    expect(result[1].title).toBe('NoDate');
  });

  it('does not mutate the input array', () => {
    const posts = [
      makePost({ date: '2025-01-01' }),
      makePost({ date: '2025-03-01' }),
    ];
    const before = posts.map((p) => p.id);
    sortPosts(posts);
    expect(posts.map((p) => p.id)).toEqual(before);
  });
});

export type MediaType = 'image' | 'video' | 'canva' | 'unknown';

export interface MediaItem {
  type: MediaType;
  url: string;
  name?: string;
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

export interface PostsResponse {
  posts: NotionPost[];
  fetchedAt: string;
  error?: string;
}

export interface FilterState {
  status: string | null;
  platform: string | null;
}

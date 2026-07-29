# Content Feed Preview

An Instagram-style feed preview widget that reads from your Notion content calendar. Built with Next.js 15 and the Notion API. Designed to be embedded directly inside a Notion page.

---

## Features

- **3-column grid** of square thumbnails sorted by publish date (newest first)
- **Pinned posts** always appear at the top
- **Hidden posts** are excluded automatically
- **Status & Platform filters** for focused views
- **Post viewer modal** with image, video, or carousel support
- **Refresh button** to fetch the latest data from Notion
- **Read-only & embeddable** — no auth, no editing

---

## Notion Database Setup

Your database must have the following properties with **exact names** (case-sensitive):

| Property | Notion type | Purpose |
|---|---|---|
| `Name` | Title | Post title (shown on hover) |
| `Date` | Date | Publish date — sort order |
| `Files & Media` | Files & Media | Uploaded images and videos |
| `Caption` | Text (rich text) | Caption shown in the viewer |
| `Hidden` | Checkbox | Check to hide a post from the grid |
| `Pinned` | Checkbox | Check to pin to the top of the grid |
| `Platforms` | Multi-select | Platform tags (Instagram, TikTok, …) |
| `Status` | Status | Draft / Scheduled / Published / … |
| `Link` _(optional)_ | Text or URL | External image or video URL if no file is uploaded |

> **Do not rename these properties** — the widget reads them by name.  
> You can freely add additional properties to the database.

### Notion Integration Setup

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) and click **+ New integration**.
2. Give it a name (e.g. "Feed Preview"), select your workspace, and click **Submit**.
3. Copy the **Internal Integration Secret** — this is your `NOTION_TOKEN`.
4. Open your content calendar database in Notion.
5. Click **···** (top-right) → **Connections** → **Connect to** → select your integration.
6. Copy the database ID from the URL:  
   `notion.so/yourworkspace/`**`THIS-32-CHAR-ID`**`?v=...`

---

## Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Copy and fill in environment variables
cp .env.example .env.local
# Edit .env.local and add NOTION_TOKEN and NOTION_DATABASE_ID

# 3. Start the dev server
pnpm --filter @workspace/feed-preview run dev
# → http://localhost:3000
```

---

## Vercel Deployment

1. Push the repo to GitHub.
2. Import the project in [vercel.com/new](https://vercel.com/new).
3. Set **Root Directory** to `artifacts/feed-preview`.
4. Add environment variables:
   - `NOTION_TOKEN` — your integration secret
   - `NOTION_DATABASE_ID` — your database ID
5. Click **Deploy**.

Vercel will auto-detect Next.js and build/serve the app.

---

## Embedding in Notion

1. Deploy the app (see above) or use the Replit dev URL.
2. In your Notion page, type `/embed` and press Enter.
3. Paste your app URL into the embed URL field.
4. Resize the embed block to fit your layout.

> The app sets `Content-Security-Policy: frame-ancestors *` so it can be embedded anywhere.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NOTION_TOKEN` | ✅ | Notion integration secret (`secret_…`) |
| `NOTION_DATABASE_ID` | ✅ | 32-character database ID |

The Notion token is **only used server-side** in the `/api/posts` route — it is never exposed to the browser.

---

## Architecture

```
src/
├── app/
│   ├── api/posts/route.ts   # Server-side Notion fetch (token stays here)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── FeedGrid.tsx         # Main client component — data fetching, state
│   ├── GridTile.tsx         # Individual grid cell
│   ├── PostModal.tsx        # Full-screen post viewer
│   ├── Carousel.tsx         # Multi-media carousel with swipe & keyboard
│   └── FilterBar.tsx        # Status / platform dropdowns
├── lib/
│   ├── notion.ts            # Notion SDK wrapper (server-only)
│   ├── media.ts             # Media type detection & file parsing
│   └── sort.ts              # Pure sorting/filtering logic (testable)
└── types/index.ts           # Shared TypeScript types
__tests__/
├── sort.test.ts
├── filters.test.ts
└── media.test.ts
```

---

## Media Support

| Source | How to use |
|---|---|
| Uploaded image | Upload to the `Files & Media` property |
| Uploaded video | Upload to the `Files & Media` property — a play indicator is shown |
| Multiple files | Upload multiple — becomes a carousel in the viewer |
| External image/video | Paste URL in the optional `Link` text property |
| Canva design | Paste a `canva.com/design/…` URL in `Link` — renders as an iframe |

> **Note on Notion file URLs:** Notion signed file URLs expire after ~1 hour. Always use the Refresh button to load fresh URLs; do not bookmark individual image URLs.

---

## Tests

```bash
pnpm --filter @workspace/feed-preview run test
```

Tests cover: post sorting, hidden/pinned filtering, platform/status filtering, and media type detection.

---
name: Notion Feed Preview
description: Key lessons from building the Notion content calendar feed widget (artifacts/feed-preview).
---

## Notion API sort robustness

**Rule:** Never use server-side `sorts` in `notion.databases.query` unless you can confirm the exact property name in the target database schema. The API returns a hard error ("Could not find sort property with name or id: X") if the property doesn't exist or is named differently.

**Why:** Notion sort names are case-sensitive and must match the property name exactly. Users often rename properties or have subtle variations (e.g. "Publish Date" vs "Date"). An unhandled sort error causes the entire API route to return 500.

**How to apply:** Remove sorts from the Notion query; do all ordering in `src/lib/sort.ts` after the fetch. The client-side `sortPosts()` function handles pinned-first + date-desc sorting. Apply the same caution to filters — if a filter property might not exist, wrap the query in a try/catch and fall back to no filter.

## Widget structure

- Next.js 15 (App Router) in `artifacts/feed-preview/` — not a registered artifact, runs via a manually configured "Feed Preview" workflow on port 3000.
- Notion token lives only in `src/lib/notion.ts` (server-only module); `/api/posts` route exposes no credentials.
- All sorting/filtering logic is pure functions in `src/lib/sort.ts` — fully tested.
- `X-Frame-Options: ALLOWALL` + `Content-Security-Policy: frame-ancestors *` set in `next.config.ts` headers to enable Notion embedding.

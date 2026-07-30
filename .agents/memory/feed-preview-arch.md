---
name: Feed Preview Architecture
description: How the Notion content feed preview widget is structured across the monorepo
---

The feed-preview artifact is a React+Vite app (not Next.js). The Notion API call lives server-side in `artifacts/api-server/src/lib/notion.ts` so the token never reaches the browser.

**Route:** `GET /api/posts` is implemented in `artifacts/api-server/src/routes/posts.ts`, which calls `queryPosts()` from `notion.ts`, runs `filterHidden` + `sortPosts` from `artifacts/api-server/src/lib/sort.ts`, and returns a `PostsResponse`.

**Frontend:** Uses the generated `useGetPosts()` hook from `@workspace/api-client-react` (TanStack React Query). Client-side sort/filter utilities live in `artifacts/feed-preview/src/lib/sort.ts`.

**Why:** `createArtifact` only scaffolds React+Vite apps — the earlier Next.js approach was manually scaffolded and never got a proper `artifact.toml`, leaving the proxy unaware of the port. Moving to React+Vite + api-server fixes the routing.

**How to apply:** Any future change to the posts shape must update `lib/api-spec/openapi.yaml`, re-run codegen (`pnpm --filter @workspace/api-spec run codegen`), then update `artifacts/api-server/src/lib/notion.ts` and the frontend types.

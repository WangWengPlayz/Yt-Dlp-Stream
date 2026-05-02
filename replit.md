# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **yt-dlp**: installed via pip at `/home/runner/workspace/.pythonlibs/bin/yt-dlp`
- **ffmpeg**: available at `/nix/store/.../replit-runtime-path/bin/ffmpeg`

## YouTube Downloader API

### Endpoints

- `GET /api/v1/q?q=<url_or_query>` — main download endpoint (YouTube URL or text search)
- `GET /api/download/:filename` — serves MP4/MP3 files (UUID-based, expire after 15 min)
- `GET /api/docs` — HTML documentation page
- `GET /api/healthz` — health check

### Architecture

- `artifacts/api-server/src/utils/ytDlp.ts` — yt-dlp wrapper using absolute binary path
- `artifacts/api-server/src/controllers/downloader.ts` — download orchestration, UUID file management, auto-cleanup
- `artifacts/api-server/src/routes/v1.ts` — `/v1/q` route with input validation
- `artifacts/api-server/src/routes/download.ts` — secure file serving with filename validation
- `artifacts/api-server/src/routes/docs.ts` — HTML docs page

### Key Notes

- yt-dlp binary lives at `/home/runner/workspace/.pythonlibs/bin/yt-dlp` (pip-installed)
- All subprocess calls use `execFile` with argument arrays — no shell interpolation
- Files stored in `/tmp/yt-downloads/` with UUID names
- Rate limiting: 10 requests per 15 minutes per IP on `/api/v1/q`
- Auto-cleanup of temp files after 15 minutes

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

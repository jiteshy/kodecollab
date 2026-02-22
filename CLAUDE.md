# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KodeCollab is a real-time collaborative code editor. Multiple users share a session via URL and simultaneously edit code with live cursor tracking, typing indicators, and language switching. No authentication — users get auto-generated usernames. Sessions are stored in Redis with TTL-based expiry.

## Monorepo Structure

pnpm workspaces with three packages:
- `packages/frontend` — Next.js 15 app (`@collabx/frontend`)
- `packages/backend` — NestJS server (`@collabx/backend`)
- `packages/shared` — TypeScript types, validation, utilities (`@collabx/shared`)

The shared package must be built before frontend or backend. The `predev` and `prebuild` scripts handle this automatically.

## Commands

```bash
# Install all dependencies
pnpm install

# Start both frontend (port 3000) and backend (port 3001)
pnpm dev

# Run all tests
pnpm test

# Run tests for a single package
pnpm --filter @collabx/frontend test
pnpm --filter @collabx/backend test
pnpm --filter @collabx/shared test

# Run a single test file
pnpm --filter @collabx/backend test -- --testPathPattern=editor.gateway
pnpm --filter @collabx/frontend test -- --testPathPattern=ComponentName

# Test watch / coverage
pnpm --filter @collabx/backend test:watch
pnpm --filter @collabx/backend test:cov
pnpm --filter @collabx/backend test:e2e
pnpm --filter @collabx/frontend test:watch
pnpm --filter @collabx/frontend test:coverage

# Lint and format
pnpm lint
pnpm format

# Production builds
pnpm build
pnpm --filter @collabx/frontend build
pnpm --filter @collabx/backend build:ncc   # NCC-bundled build for AWS deployment

# Build shared package manually (needed if editing shared types)
pnpm --filter @collabx/shared build

# Backend debug / production start
pnpm --filter @collabx/backend start:debug   # debug mode with --watch
pnpm --filter @collabx/backend start:prod    # runs compiled dist/main.js
```

## Environment Setup

Prerequisites: Node.js v18+, pnpm, Redis.

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

Backend requires a running Redis instance. Key env vars:
- `NEXT_PUBLIC_WS_URL` — WebSocket server URL (frontend)
- `CORS_ORIGIN`, `PORT`, `REDIS_HOST/PORT/PASSWORD` (backend)
- `MAX_USERS_PER_SESSION` (default 5), `SESSION_TTL`, rate limit configs

## Architecture

**Communication:** All collaboration happens over WebSocket via Socket.IO on path `/api/ws`. There is no REST API for editor state — everything is event-driven.

**Connection & join flow:**
1. Frontend connects to backend WS with `sessionId` as a query param (`?sessionId=abc`)
2. On connection, backend immediately sends `sync_response` with current session state (content, language, users) — this happens before the user is registered
3. Frontend then emits `join` with `{ username }` → backend adds the user to the session, stores `userId` in `client.data.userId`, responds with `join` (to the joining socket) and broadcasts `user_joined` (to others), then broadcasts a full `sync_response` to all
4. On reconnect (not initial connection), client emits `sync_request` instead of `join` again
5. On disconnect, backend removes the user, broadcasts `user_left` + a fresh `sync_response`, then clears rate limit state for that socket

**Event handler pattern in the gateway:**
Every `@SubscribeMessage` handler follows the same four-step flow: validate payload → check rate limit → execute business logic → broadcast. Most events use `client.to(sessionId).emit(...)` (excludes the sender); `sync_response` uses `this.server.to(sessionId).emit(...)` (includes all).

**Session lifecycle in Redis:**
- Active session TTL: 4 hours, reset on any user event (`content_change`, `language_change`, `cursor_move`, `selection_change`, `typing_status`, `sync_request`)
- Empty session TTL: 1 hour (applied when the last user disconnects via `handleDisconnect`)
- User removal is handled exclusively by socket disconnect and Socket.IO ping/pong (every 10s, timeout 5s) — there is no per-user inactivity timeout; passive observers are never evicted

**Error types and frontend handling:**
- `SESSION_FULL` → sets `isSessionFull` React state in `useWebSocket`, triggers read-only UI dialog; no reconnect
- `DUPLICATE_USERNAME` → shows error message; triggers reconnect backoff
- `SYNC_ERROR` / `INVALID_PAYLOAD` → client re-emits `sync_request` to recover state
- All other errors → show error message, trigger reconnect backoff (exponential, max 5 retries, 1s–5s delay)

**Frontend state (Zustand stores):**
- `editorStore` — flat state: `content`, `language`, `error`; reset on reconnect
- `userStore` — `users: User[]`, `cursors: UserCursor[]`, `selections: UserSelection[]`, `typingUsers: Map<userId, UserTypingStatus>`; `removeUser` cascades to clear that user's cursor/selection/typing entries; reset on reconnect via `sync_response`
- On `sync_response`: `userStore` is always reset and repopulated from the users list; `editorStore` content and language are updated in-place (not reset), avoiding a flash of default content on reconnect

**Backend key files:**
- `packages/backend/src/gateways/editor.gateway.ts` — WebSocket gateway; handles all Socket.IO events
- `packages/backend/src/services/session.service.ts` — session CRUD in Redis, user management, capacity checks, TTL management
- `packages/backend/src/services/redis.service.ts` — ioredis client with TLS support for production
- `packages/backend/src/rate-limit/redis-rate-limiter.ts` — per-event-type rate limiting

**Frontend key files:**
- `packages/frontend/src/app/[sessionId]/page.tsx` — editor page
- `packages/frontend/src/app/page.tsx` — landing page (redirects bots to content, users to random session)
- `packages/frontend/src/hooks/useWebSocket.ts` — creates/destroys `SocketService`, returns `sendMessage` and `isSessionFull`
- `packages/frontend/src/lib/services/socket/socketService.ts` — Socket.IO client; owns reconnect backoff logic and all event handlers; bridges socket events into Zustand store actions via `StoreHandlers`
- `packages/frontend/src/lib/stores/` — Zustand stores: `editorStore`, `userStore`

**Shared package (`packages/shared/src/`):**
- `types/index.ts` — `MessageType` enum, `User`, `Session`, `UserCursor`, `UserSelection`, `UserTypingStatus`, `SocketError`, `RateLimitConfig` interfaces
- `services/validation.ts` — `validateSessionId`, `validateUsername`, `validateEventPayload`, `generateValidSessionId`
- `utils/index.ts` — `SUPPORTED_LANGUAGES`, `DEFAULT_LANGUAGE`, `DEFAULT_CONTENT`, `getRandomColor`, `getRandomUsername`

## Key Conventions

- **Package naming:** packages reference each other as `"@collabx/shared": "workspace:*"`
- **Path alias:** `@collabx/shared` is mapped in tsconfig for both frontend and backend
- **TypeScript:** strict mode enabled; `no-explicit-any` is off in ESLint
- **Formatting:** single quotes, trailing commas everywhere (Prettier)
- **Session capacity:** when a session is full, users get read-only access rather than being rejected
- **Rate limiting:** configured per event type; limits apply per socket/user in Redis

## Deployment

Backend is deployed to AWS Elastic Beanstalk via GitHub Actions (`.github/workflows/backend-deploy.yml`). The workflow triggers on changes to `packages/backend/**` or `packages/shared/**` on `main`, builds with NCC, and deploys a zip artifact.

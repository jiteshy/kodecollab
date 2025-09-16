# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CollabX is a real-time collaborative text editor built with a pnpm monorepo structure. The project consists of three main packages:

- **Frontend** (`packages/frontend`): Next.js application with Monaco Editor, Socket.IO client, and Zustand state management
- **Backend** (`packages/backend`): NestJS WebSocket server with Redis session management and rate limiting
- **Shared** (`packages/shared`): Common TypeScript types, validation utilities, and shared business logic

## Development Commands

### Root Level Commands
```bash
# Start all services in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Lint all packages
pnpm lint

# Format code across all packages
pnpm format

# Install dependencies
pnpm install
```

### Package-Specific Commands

#### Backend (`packages/backend`)
```bash
# Development with hot reload
pnpm --filter @collabx/backend dev

# Build for production
pnpm --filter @collabx/backend build

# Build with ncc (single file bundle)
pnpm --filter @collabx/backend build:ncc

# Run tests
pnpm --filter @collabx/backend test

# Run with coverage
pnpm --filter @collabx/backend test:cov

# Run single test file
pnpm --filter @collabx/backend test -- <test-file-pattern>
```

#### Frontend (`packages/frontend`)
```bash
# Development server on port 3000
pnpm --filter @collabx/frontend dev

# Build for production
pnpm --filter @collabx/frontend build

# Run tests
pnpm --filter @collabx/frontend test

# Run with coverage
pnpm --filter @collabx/frontend test:coverage
```

#### Shared (`packages/shared`)
```bash
# Build shared types and utilities (required before frontend/backend dev)
pnpm --filter @collabx/shared build

# Watch mode for development
pnpm --filter @collabx/shared dev
```

## Architecture Overview

### Real-time Communication
- **WebSocket Gateway**: `packages/backend/src/gateways/editor.gateway.ts` handles all real-time events
- **Socket Service**: `packages/frontend/src/lib/services/socket/socketService.ts` manages client-side WebSocket connections
- **Message Types**: Defined in `packages/shared/src/types/index.ts` with validation

### State Management
- **Backend**: Redis-based session storage via `SessionService` and `RedisService`
- **Frontend**: Zustand stores in `packages/frontend/src/lib/stores/`:
  - `sessionStore.ts`: Session and user management
  - `editorStore.ts`: Document content and editor state
  - `userStore.ts`: Current user state

### Rate Limiting & Security
- **Redis Rate Limiter**: `packages/backend/src/rate-limit/redis-rate-limiter.ts` prevents abuse
- **Validation**: Class-validator DTOs in `packages/backend/src/dto/` and shared validation utilities
- **CORS**: Configured for cross-origin requests between frontend/backend

### Key Services
- **Session Management**: `packages/backend/src/services/session.service.ts` - handles user sessions, max capacity (5 users), read-only mode
- **Redis Operations**: `packages/backend/src/services/redis.service.ts` - centralized Redis interactions
- **WebSocket Handler**: Real-time document synchronization, user presence, language changes

## Environment Setup

Required environment files:
- `packages/backend/.env` (copy from `.env.example`)
- `packages/frontend/.env` (copy from `.env.example`)

Essential environment variables:
- `REDIS_URL`: Redis connection string for session storage
- `CORS_ORIGIN`: Frontend URL for CORS configuration
- `PORT`: Backend server port (default: 3001)
- `MAX_USERS_PER_SESSION`: Session capacity limit (default: 5)

## Testing Strategy

- **Backend**: Jest with Socket.IO testing utilities in `packages/backend/src/**/*.spec.ts`
- **Frontend**: Jest + React Testing Library in `packages/frontend/src/**/*.test.ts`
- **Shared**: Validation and utility tests in `packages/shared/src/**/*.test.ts`

## Important Notes

- Always build `@collabx/shared` before developing frontend/backend (handled by predev scripts)
- The monorepo uses workspace dependencies - changes to shared package affect both frontend and backend
- WebSocket path is `/api/ws` with polling and websocket transports
- Session cleanup and Redis TTL management handled automatically
- Rate limiting applies per IP address with configurable windows and request limits
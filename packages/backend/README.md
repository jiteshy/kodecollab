# CollabX Backend

The backend package of CollabX, built with NestJS and TypeScript. Handles WebSocket connections, session management, and real-time collaboration features.

## Features

- **WebSocket Server**: Real-time communication using Socket.IO
- **Session Management**: Handle user sessions and collaboration
- **Rate Limiting**: Protect against excessive requests
- **Redis Integration**: Session storage and rate limiting
- **Error Handling**: Comprehensive error management
- **Type Safety**: Full TypeScript support

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **WebSocket**: Socket.IO
- **Database**: Redis
- **Validation**: Custom validation service
- **Rate Limiting**: In-memory rate limiter with Redis alternative

## Project Structure

```
backend/
├── src/
│   ├── gateways/        # WebSocket gateways
│   ├── services/        # Business logic services
│   ├── rate-limit/      # Rate limiting implementation
│   ├── types/          # TypeScript types and interfaces
│   └── main.ts         # Application entry point
├── test/               # Test files
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Redis server

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run start:dev
```

The server will be available at http://localhost:4000

## Development

### Available Scripts

- `npm run start` - Start the server
- `npm run start:dev` - Start in development mode
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Run tests with coverage

### Key Components

- `EditorGateway`: Main WebSocket gateway for editor functionality
- `SessionService`: Manages collaborative sessions
- `RedisRateLimiter`: Redis-based rate limiter for distributed rate limiting
- `ValidationService`: Validates incoming messages

### Rate Limiting Architecture

CollabX implements Redis-based rate limiting to protect against excessive requests and provide reliable service in clustered environments:

1. **Redis-Based Rate Limiter**: The application uses a Redis-based implementation that:
   - Stores rate limit counters in Redis
   - Provides per-user/per-event rate limits
   - Works reliably across multiple server instances
   - Allows for customizable limits per event type
   - Automatically cleans up when users disconnect

2. **Configurable Rate Limits**:
   - JOIN: 5 attempts per minute
   - CONTENT_CHANGE: 10 events per second
   - CURSOR_MOVE: 30 events per 100ms
   - TYPING_STATUS: 5 events per second

This implementation offers several advantages:
- **Distributed State**: Rate limit state is shared across all instances
- **Persistence**: Rate limit data persists even if a server restarts
- **Resilience**: Graceful handling of Redis connection issues
- **Performance**: Minimal impact on request latency

### WebSocket Events

The backend handles various WebSocket events:
- `JOIN`: User joining a session
- `CONTENT_CHANGE`: Editor content updates
- `LANGUAGE_CHANGE`: Editor language changes
- `CURSOR_MOVE`: Cursor position updates
- `SELECTION_CHANGE`: Text selection updates
- `TYPING_STATUS`: User typing status

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This package is part of the CollabX project and is licensed under the MIT License. 
# CollabX - Real-time Collaborative Text Editor

CollabX is a real-time collaborative text editor that allows multiple users to edit text and code together in real-time. This project is ***vibe coded*** with [Cursor](https://www.cursor.com/) AI Code Editor, showcasing how modern AI tools can accelerate & transform development building production-ready apps.

## 🎯 Project Background

This project began as an exploration into the possibilities of AI-assisted development through Cursor. The entire build process flowed as a creative collaboration with AI, which helped:

- Create rapid feature prototypes
- Tackle the complexities of real-time data synchronization
- Apply websocket communication best practices
- Build comprehensive security guardrails e.g. rate limiting
- Deliver a robust application ready for production environments

This development journey stands as a testament to how AI-assisted coding can empower developers to create sophisticated applications efficiently.

## ✨ Key Features

- **Seamless Real-time Collaboration**: Edit text and code with multiple participants simultaneously
- **Frictionless Entry**: Quick access through automatic random username generation
- **Sessions & Users**: Track who's in the session with clear indicators
- **Intuitive Session Sharing**: Join sessions via unique URL links
- **Activity Visualization**: See other users typing status in real time
- **Synchronized Language Settings**: Language changes reflect instantly across all connected users
- **Flexible Capacity Management**: User limits in a session (currently 5) with read-only fallback option
- **Guardrails**: Robust rate limiting safeguards against excessive requests
- **Resilient Connections**: Automatic recovery from network interruptions
- **Dark Theme**: Toggle between dark and light themes (dark mode as default)

## 🛠️ Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Monaco Editor
- **Backend**: NestJS, TypeScript, Socket.IO
- **Shared**: TypeScript
- **State Management**: Zustand
- **UI Framework/Libraries**: Tailwind CSS, shadcn/ui
- **Data Storage**: Redis for session storage and rate limiting
- **Development Accelerator**: Cursor AI

## 📁 Project Structure

```
collabx/
├── packages/
│   ├── frontend/     # Next.js frontend application
│   ├── backend/      # NestJS backend server
│   └── shared/       # Shared types and utilities
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- Redis (for session management and rate limiting)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jiteshy/collabx.git
cd collabx
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
# Copy the example env files
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

4. Launch development servers:
```bash
# Start both frontend and backend
pnpm dev
```

Access the application at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 🧪 Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run frontend tests
pnpm --filter @collabx/frontend test

# Run backend tests
pnpm --filter @collabx/backend test

# Run shared tests
pnpm --filter @collabx/shared test
```

### Building for Production

```bash
# Build all packages
pnpm build

# Build specific packages
pnpm --filter @collabx/frontend build
pnpm --filter @collabx/backend build:ncc
```

## 🔒 Security Best Practices

When deploying to production:

1. Configure strict CORS origin values via environment variables
2. Adjust rate limiting parameters based on expected usage patterns
3. Set appropriate MAX_USERS_PER_SESSION limits
4. Optimize Redis TTL & cleanup configuration for production environments

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Cursor](https://cursor.com/) for AI-assisted development
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [Socket.IO](https://socket.io/) for real-time communication
- [Tailwind CSS](https://tailwindcss.com/) for styling

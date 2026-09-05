# Mini Kanban Board - Frontend (Next.js)

## Overview

A Next.js frontend for the Mini Kanban Board application with real-time collaboration features.

## Tech Stack

- Next.js 16+ (App Router)
- TypeScript
- Tailwind CSS 4+
- Zustand (state management)
- dnd-kit (drag-and-drop)
- Socket.io-client (real-time updates)
- Axios (HTTP client)

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── login/page.tsx      # Login page
│   │   ├── register/page.tsx   # Register page
│   │   ├── dashboard/page.tsx # Boards dashboard
│   │   └── board/[id]/page.tsx # Board view with drag-and-drop
│   ├── components/       # UI components
│   │   └── ui/           # Reusable UI (Button, Card, Input, Modal, Toast)
│   ├── stores/           # Zustand stores
│   │   ├── auth.ts       # Authentication state
│   │   └── board.ts      # Board state
│   ├── lib/              # Utilities
│   │   ├── api.ts        # Axios client
│   │   └── socket.ts     # Socket.io client
│   └── types/            # TypeScript types
├── public/
├── package.json
├── Dockerfile
├── next.config.ts
└── tailwind.config.ts
```

## Setup

### Prerequisites

- Bun 1.4+
- Backend API running on port 5000

### Installation

```bash
cd frontend
bun install
```

### Development

```bash
bun run dev
```

Open http://localhost:3000

### Production

```bash
bun run build
bun run start
```

## Pages

| Route | Description |
|-------|-------------|
| / | Landing page |
| /login | User login |
| /register | User registration |
| /dashboard | List of user's boards |
| /board/:id | Kanban board view |

## Features

- User authentication with cookies (JWT via HTTP-only cookies)
- Board creation and management
- Column management with drag-and-drop reordering
- Task management with drag-and-drop across columns
- Real-time updates via WebSocket
- Board sharing with roles (OWNER, EDITOR, VIEWER)

## State Management

Uses Zustand for state:

- **authStore**: User authentication state
- **boardStore**: Boards, columns, and tasks state

## API Client

Axios with interceptors for:

- Automatic JWT token refresh on 401
- Cookie-based credentials
- Request/response logging

## Docker

The frontend can be containerized:

```bash
docker build -t kanban-frontend .
docker run -p 3000:3000 kanban-frontend
```

Or use docker-compose for full stack:

```bash
docker compose up --build
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## License

MIT

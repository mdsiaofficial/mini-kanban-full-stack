# Mini Kanban Board

A full-stack Kanban board application with real-time collaboration features built with Next.js, NestJS, PostgreSQL, and WebSocket support.

## Tech Stack

### Frontend

- Next.js 16+
- TypeScript
- Tailwind CSS 4+
- Zustand (state management)
- dnd-kit (drag-and-drop)
- Socket.io-client (real-time updates)

### Backend

- NestJS 12+
- TypeScript
- Prisma ORM 7.9.0
- Socket.io (WebSocket gateway)
- JWT with refresh tokens (authentication)

### Database

- PostgreSQL 18+
- Prisma 7.9.0

### Runtime

- Bun

## Features

- User authentication with cookies (JWT access + refresh tokens)
- Board creation and management
- Column management with drag-and-drop reordering
- Drag-and-drop task management within and across columns
- Board sharing with roles (OWNER, EDITOR, VIEWER)
- Real-time updates via WebSocket
- Default columns on board creation (To Do, In Progress, Done)

## Project Structure

```
mini-kanban-full-stack/
├── frontend/          # Next.js application
├── backend/           # NestJS application
├── docker-compose.yml # Docker configuration
└── README.md
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/      # React components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # API client, socket
│   ├── stores/         # Zustand stores
│   └── types/          # TypeScript types
├── Dockerfile          # Docker container definition
└── ...
```

### Backend Structure

```
backend/
├── src/
│   ├── modules/        # Feature modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── boards/
│   │   ├── columns/
│   │   └── tasks/
│   ├── gateway/        # Socket.io gateway
│   └── prisma/         # Prisma service
├── prisma/
│   └── schema.prisma   # Database schema
├── Dockerfile          # Docker container definition
└── ...
```

## Prerequisites

- Docker and Docker Compose
- Bun 1.4+ (for local development if not using Docker)

## Setup Instructions

### Option A: Full Docker (Recommended)

Run all services (PostgreSQL, Backend, Frontend) in Docker:

```bash
# Start all services
docker compose up -d --build

# Stop all services (keeps data)
docker compose stop

# View logs
docker compose logs -f

# Remove containers (keeps data)
docker compose down

# Full cleanup including volumes (deletes ALL data)
docker compose down -v
```

Access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5454 (from host)

### Option B: Local Development with Docker Database

If you want to run backend/frontend locally but use Docker for PostgreSQL:

```bash
# Start only PostgreSQL
docker compose up -d postgres

# Then run backend and frontend locally
cd backend && bun install && bunx prisma generate && bunx prisma db push && bun run dev
cd frontend && bun install && bun run dev
```

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://kanban_user:kanban_password@localhost:5454/kanban"
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
PORT=5000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login |
| POST | /auth/logout | Logout |
| POST | /auth/refresh | Refresh access token |

### Boards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /boards | List user's boards |
| POST | /boards | Create new board |
| GET | /boards/:id | Get board details |
| PATCH | /boards/:id | Update board |
| DELETE | /boards/:id | Delete board |
| POST | /boards/:id/members | Add member |
| DELETE | /boards/:id/members/:userId | Remove member |
| GET | /boards/:id/members | List members |

### Columns

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /boards/:boardId/columns | Create column |
| PATCH | /columns/:id | Update column |
| DELETE | /columns/:id | Delete column |
| PATCH | /columns/:id/move | Reorder column |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /columns/:columnId/tasks | Create task |
| PATCH | /tasks/:id | Update task |
| DELETE | /tasks/:id | Delete task |
| PATCH | /tasks/:id/move | Move task |

## Board Roles

| Role | Permissions |
|------|-------------|
| OWNER | Full control, can delete board, manage members |
| EDITOR | Create/edit/delete tasks and columns |
| VIEWER | Read-only access |

## Real-time Updates

The application uses Socket.io for real-time updates. Events are emitted when:

- A task is created, updated, deleted, or moved
- A column is created, updated, or deleted
- A board is updated
- Board members are added or removed

## Testing

Run backend tests:

```bash
cd backend
bun test
```

## Ports Configuration

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend | 5000 |
| PostgreSQL | 5454 |

## License

MIT

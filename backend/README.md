# Mini Kanban Board - Backend (NestJS)

## Overview

A NestJS backend API for a Mini Kanban Board application with real-time features using Socket.io.

## Tech Stack

- **Framework**: NestJS 12+
- **Database**: PostgreSQL with Prisma 7.9.0 (adapter pattern)
- **Authentication**: JWT via HTTP-only cookies
- **Real-time**: Socket.io via WebSocket Gateway
- **Validation**: class-validator, class-transformer

## Project Structure

```
backend/
├── src/
│   ├── main.ts                      # Entry point
│   ├── app.module.ts                # Root module
│   ├── app.controller.ts            # Health check
│   ├── app.service.ts               # Basic service
│   ├── generated/prisma/
│   │   └── client.js              # PrismaClient (Prisma 7 adapter)
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (Prisma 7)
│   │   ├── prisma.service.ts       # Database connection wrapper
│   │   └── prisma.module.ts        # Global Prisma module
│   ├── modules/
│   │   ├── auth/                    # Authentication
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── dto/
│   │   ├── users/                   # Users management
│   │   ├── boards/                  # Boards CRUD + members
│   │   ├── columns/                # Columns CRUD
│   │   └── tasks/                  # Tasks CRUD + move (linked-list)
│   ├── gateway/
│   │   ├── gateway.module.ts
│   │   └── kanban.gateway.ts       # Socket.io events
│   └── common/
│       ├── guards/
│       └── decorators/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Prisma 7.9.0 Adapter Pattern

This project uses Prisma 7.9.0 with the adapter pattern:

1. **Schema**: `prisma/schema.prisma`
2. **Client**: `src/generated/prisma/client.js` - generated Prisma client
3. **Services**: Use `this.prismaService` for database operations

## Setup

### Prerequisites

- Bun 1.4+
- PostgreSQL on port 5454
- Docker (optional)

### Installation

```bash
cd backend

bun install

cp .env.example .env
# Edit .env with your database credentials

bunx prisma generate
bunx prisma db push
```

### Development

```bash
bun run start:dev
```

### Production

```bash
bun run build
bun run start:prod
```

### Testing

```bash
bun test
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login, sets HTTP-only cookie |
| POST | /auth/logout | Clear cookie |
| GET | /auth/me | Get current user |

### Boards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /boards | List user's boards |
| POST | /boards | Create board (auto-creates 3 columns) |
| GET | /boards/:id | Get board with columns and tasks |
| PATCH | /boards/:id | Update board |
| DELETE | /boards/:id | Delete board (owner only) |
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
| PATCH | /tasks/:id/move | Move task (linked-list reordering) |

## Linked-List Task Ordering

Tasks use a linked-list pattern for efficient reordering:

- Each task has `order` (float) and `prevTaskId`/`nextTaskId` references
- Moving a task updates only affected links, not all tasks in column
- Supports efficient insert between any two tasks

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| OWNER | Full control, manage members |
| EDITOR | Create/edit/delete tasks and columns |
| VIEWER | Read-only access |

## Cookie-Based Authentication

- JWT stored in HTTP-only cookie (not localStorage)
- Cookie set on login, cleared on logout
- All API requests include cookie automatically
- CORS configured to allow credentials

## Socket.io Events

### Client to Server

| Event | Data | Description |
|-------|------|-------------|
| joinBoard | { boardId } | Join a board room |
| leaveBoard | { boardId } | Leave a board room |

### Server to Client

| Event | Data | Description |
|-------|------|-------------|
| task:moved | { taskId, fromColumnId, toColumnId, newOrder } | Task moved |
| task:created | { task, columnId } | Task created |
| task:updated | { task } | Task updated |
| task:deleted | { taskId, columnId } | Task deleted |
| column:created | { column } | Column created |
| column:updated | { column } | Column updated |
| column:deleted | { columnId } | Column deleted |
| board:updated | { board } | Board updated |

## Docker

```bash
# Build and run with docker-compose
docker compose up --build

# Or run individually
docker build -t kanban-backend .
docker run -p 5000:5000 --env-file .env kanban-backend
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5454/kanban"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="15m"
PORT=5000
```

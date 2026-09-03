# Mini Kanban Board - Backend (NestJS)

## Overview

A NestJS backend API for a Mini Kanban Board application with real-time features using Socket.io.

## Tech Stack

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL with Prisma 7 (stable approach)
- **Authentication**: JWT (access + refresh tokens)
- **Real-time**: Socket.io via WebSocket Gateway
- **Validation**: class-validator, class-transformer

## Project Structure

```
server/
├── src/
│   ├── main.ts                      # Entry point
│   ├── app.module.ts                # Root module
│   ├── app.controller.ts            # Health check
│   ├── app.service.ts               # Basic service
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (Prisma 7)
│   │   ├── db.ts                    # PrismaClient export
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
│   │   └── tasks/                  # Tasks CRUD + move
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
└── .env.example
```

## Prisma 7 Approach

This project uses Prisma 7:

1. **Schema**: `prisma/schema.prisma`
2. **Client Export**: `prisma/db.ts` - exports singleton `PrismaClient`
3. **Namespace-qualified queries**: Services use `this.prisma.db.user.findMany()` etc.

## Setup

### Prerequisites

- Node.js 22+
- PostgreSQL
- Docker (optional)

### Installation

```bash
cd server

npm install

cp .env.example .env
# Edit .env with your database credentials

npx prisma generate
npx prisma db push
```

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login, returns access + refresh tokens |
| POST | /auth/logout | Invalidate refresh token |
| POST | /auth/refresh | Refresh access token |

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
| PATCH | /tasks/:id/move | Move task |

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| OWNER | Full control, manage members |
| EDITOR | Create/edit/delete tasks and columns |
| VIEWER | Read-only access |

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
docker build -t kanban-backend .
docker run -p 5000:5000 --env-file .env kanban-backend
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kanban"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
```

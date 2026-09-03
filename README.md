# Mini Kanban Board

A full-stack Kanban board application with real-time collaboration features.

## Tech Stack

### Frontend

- Next.js 16+
- TypeScript 7+
- Tailwind CSS 4+
- dnd-kit for drag-and-drop
- Socket.io-client for real-time updates
- Zustand for state management

### Backend

- NestJS 
- TypeScript 7+
- Prisma ORM 8+
- Socket.io for WebSocket gateway

### Database

- PostgreSQL 18

## Features

- User authentication (JWT with refresh tokens)
- Board creation with default columns (To Do, In Progress, Done)
- Drag-and-drop task management within and across columns
- Real-time updates when board members make changes
- Board sharing with roles (OWNER, EDITOR, VIEWER)
- Access control enforcement

## Project Structure

```
mini-kanban-full-stack/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # API client, socket
│   │   ├── stores/         # Zustand stores
│   │   └── types/          # TypeScript types
│   └── ...
├── server/                 # NestJS backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── boards/
│   │   │   ├── columns/
│   │   │   └── tasks/
│   │   ├── gateway/        # Socket.io gateway
│   │   └── prisma/         # Prisma service
│   └── ...
├── docker-compose.yml
└── README.md
```

## Local Setup

### Prerequisites

- Node.js 26+
- Docker and Docker Compose
- PostgreSQL client (optional, for direct DB access)

### Using Docker (Recommended)

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd mini-kanban-full-stack
   ```

2. Start all services:

   ```bash
   docker-compose up
   ```

   This starts:
   - PostgreSQL on port 5433
   - Backend (NestJS) on port 5000
   - Frontend (Next.js) on port 3000

3. Open http://localhost:3000 in your browser

### Manual Setup (Without Docker)

#### Backend

```bash
cd server

# Install dependencies
npm install

# Generate Prisma client
npx prisma contract:emit

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

#### Frontend

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Database

Make sure PostgreSQL is running on port 5433, or update `DATABASE_URL` in `server/.env`.

## Environment Variables

### Server (.env)

```env
DATABASE_URL="postgresql://kanban_user:kanban_password@localhost:5433/kanban"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
```

### Client (.env.local)

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

## Default Columns

When a new board is created, three default columns are automatically added:
- To Do (order: 1000)
- In Progress (order: 2000)
- Done (order: 3000)

## Board Roles

| Role | Permissions |
|------|-------------|
| OWNER | Full control, can delete board, manage members |
| EDITOR | Create/edit/delete tasks and columns |
| VIEWER | Read-only access |

## Real-time Events

The application uses Socket.io for real-time updates. Events are emitted when:
- A task is created, updated, deleted, or moved
- A column is created, updated, or deleted
- A board is updated

## Ports

| Service | Port |
|---------|------|
| PostgreSQL | 5433 |
| Backend | 5000 |
| Frontend | 3000 |

## License

MIT

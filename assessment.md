# Technical Assessment

Mini Kanban Board — Full-Stack Engineering Challenge

## Tech Stack

### Frontend

Next.js 16+ (TypeScript preferred), Tailwind CSS 4+

### Backend

NestJS 12+ (preferred) with TypeScript

### Database

PostgreSQL 18+ with Prisma 7.9.0 (preferred)

### DevOps

Docker with postgres:18.6-alpine3.24 and oven/bun:1.4.1-alpine (preferable)

## Project Overview

Build a functional Mini Kanban Board application where users can create boards, organize workflow
columns, and manage tasks. You are expected to design your own database schema and system
architecture to handle collaboration, access permissions, and drag-and-drop task reordering.

## Core Requirements

1. Authentication & Collaboration:
User registration and login with token-based authentication.
Board Sharing: Boards must have an owner and allow sharing access with other registered users.
Access Control: Enforce authorization rules so users can only view or mutate boards, columns, and tasks they have explicit access to. Prevent unauthorized cross-board access.

2. Workflow Management & Task Movement:
Full management of Boards, Columns, and Tasks.
Task Movement API: Implement an endpoint to handle moving tasks:
Reordering tasks within the same column.
Moving a task across different columns to a specific position index.
Order Consistency: Ensure task ordering remains stable, accurate, and conflict-free when tasks are rearranged.

3. Frontend:
Interactive board view supporting drag-and-drop task movement.

## Open Discussion: 

1. bcrypt for hashing, 
2. cookie for authentication, 
3. port: frontend 3000, backend 5000, postgres 5454 
4. class-validator or schema validation nestjs 
5. i dont want any uuid or cuid, i just want increamenting numbering id, 
6. zustand for nextjs, 
7. bun test
8. for task moving/order/reordering - use linked-list method
9. use bun runtime, bun package manager.
10. for locally running also use docker to host the database


## Submission & Deliverables

Single Repository: Submit a single GitHub repository containing both frontend and backend directories.

Setup Instructions: Include a README.md with step-by-step local setup instructions and sample environment variables.

Docker (Preferable): A docker-compose.yml to spin up the database and services locally with minimal setup.

Deployment (Optional): If possible, provide a link to a live deployed version of the application.

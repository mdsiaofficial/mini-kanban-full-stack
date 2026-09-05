FROM oven/bun:1.4.1-alpine

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY prisma ./prisma
RUN bunx prisma generate
RUN bunx prisma migrate deploy

COPY . .

EXPOSE 5000

CMD ["bun", "run", "start"]

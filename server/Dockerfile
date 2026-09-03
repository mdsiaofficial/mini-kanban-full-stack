FROM node:26.8.1-alpine3.24

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src/prisma ./src/prisma
RUN npx prisma generate

COPY . .

EXPOSE 5000

CMD ["npm", "run", "start:dev"]

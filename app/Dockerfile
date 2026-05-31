# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache wget python3 py3-setuptools make g++

COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm rebuild sqlite3 --build-from-source

COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

RUN mkdir -p /app/uploads/photos

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/services || exit 1

CMD ["node", "server/server.cjs"]


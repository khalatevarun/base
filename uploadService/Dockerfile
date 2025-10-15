# Multi-stage Dockerfile for the uploadService
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm install typescript --no-save && npx tsc -p tsconfig.json

FROM node:18-alpine AS runtime
WORKDIR /app
COPY package*.json ./
# Install git and CA certs so runtime code (simple-git) can invoke `git clone`.
# Git is required at runtime because the app spawns the `git` binary.
RUN apk add --no-cache git openssh ca-certificates \
 && update-ca-certificates || true
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]

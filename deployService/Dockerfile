# Multi-stage Dockerfile for the deployService
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm install typescript --no-save && npx tsc -p tsconfig.json

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
ENV REPOS_DIR=/app/repos
# This service is a worker that polls Redis; no http port required but keep none or use 8080 if needed
CMD ["node", "dist/index.js"]

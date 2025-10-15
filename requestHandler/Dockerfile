# Multi-stage Dockerfile for the requestHandler service
# - build stage: install deps, install typescript, compile TS -> /dist
# - final stage: install only production deps and run compiled JS
FROM node:18-alpine AS build
WORKDIR /app

# copy package files and install dependencies for the build
COPY package*.json ./
RUN npm install

# copy sources and compile TypeScript
COPY . .
# install typescript locally for the build (no package.json change) and compile
RUN npm install typescript --no-save && npx tsc -p tsconfig.json

FROM node:18-alpine AS runtime
WORKDIR /app

# copy only production dependencies and compiled output
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/index.js"]

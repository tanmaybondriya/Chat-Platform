FROM node:22-alpine

WORKDIR /app

# Copy root package files for workspaces
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/

# Install dependencies
RUN npm ci --workspace=apps/server

# Copy server source
COPY apps/server ./apps/server
COPY packages ./packages

# Build TypeScript
RUN npm run build --workspace=apps/server

WORKDIR /app/apps/server

EXPOSE 5000

CMD ["node", "dist/server.js"]

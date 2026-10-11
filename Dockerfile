FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/api-client/package.json packages/api-client/package.json
RUN npm ci --no-fund
COPY frontend frontend
COPY packages packages
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/frontend/dist frontend/dist
COPY package.json package-lock.json ./
COPY backend backend
COPY packages packages
COPY data data
RUN mkdir -p backend/runtime/uploads && chown -R node:node backend/runtime
USER node
EXPOSE 3000
CMD ["node", "backend/src/server.js"]

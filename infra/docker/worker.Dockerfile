# Contexto de build: raiz do repositório.
FROM node:22.23.2-alpine3.23 AS construcao
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/nucleo/package.json packages/nucleo/
COPY apps/api/package.json apps/api/
COPY apps/despachante/package.json apps/despachante/
COPY apps/realtime/package.json apps/realtime/
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
RUN npm ci --ignore-scripts
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/nucleo packages/nucleo
COPY apps/worker apps/worker
RUN npm run build -w @educa/shared && npm run build -w @educa/nucleo && npm run build -w @educa/worker

FROM node:22.23.2-alpine3.23
ENV NODE_ENV=production
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/nucleo/package.json packages/nucleo/
COPY apps/api/package.json apps/api/
COPY apps/despachante/package.json apps/despachante/
COPY apps/realtime/package.json apps/realtime/
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
RUN npm ci --omit=dev --ignore-scripts --workspace @educa/worker && npm cache clean --force
COPY --from=construcao /repo/packages/shared/dist packages/shared/dist
COPY --from=construcao /repo/packages/nucleo/dist packages/nucleo/dist
COPY --from=construcao /repo/apps/worker/dist apps/worker/dist
USER node
WORKDIR /repo/apps/worker
CMD ["node", "dist/main.js"]

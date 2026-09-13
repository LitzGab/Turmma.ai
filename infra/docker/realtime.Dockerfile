# Contexto de build: raiz do repositório.
FROM node:22.23.2-alpine3.23 AS construcao
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/nucleo/package.json packages/nucleo/
COPY apps/api/package.json apps/api/
COPY apps/realtime/package.json apps/realtime/
COPY apps/web/package.json apps/web/
RUN npm ci --ignore-scripts
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/nucleo packages/nucleo
COPY apps/realtime apps/realtime
RUN npm run build -w @educa/shared && npm run build -w @educa/nucleo && npm run build -w @educa/realtime

FROM node:22.23.2-alpine3.23
ENV NODE_ENV=production
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/nucleo/package.json packages/nucleo/
COPY apps/api/package.json apps/api/
COPY apps/realtime/package.json apps/realtime/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --ignore-scripts --workspace @educa/realtime && npm cache clean --force
COPY --from=construcao /repo/packages/shared/dist packages/shared/dist
COPY --from=construcao /repo/packages/nucleo/dist packages/nucleo/dist
COPY --from=construcao /repo/apps/realtime/dist apps/realtime/dist
USER node
WORKDIR /repo/apps/realtime
EXPOSE 3000
CMD ["node", "dist/main.js"]

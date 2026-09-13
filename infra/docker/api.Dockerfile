# Contexto de build: raiz do repositório.
FROM node:22.23.2-alpine3.23 AS construcao
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/nucleo/package.json packages/nucleo/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --ignore-scripts
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/nucleo packages/nucleo
COPY apps/api apps/api
RUN npm run build -w @educa/shared && npm run build -w @educa/nucleo && npm run build -w @educa/api

FROM node:22.23.2-alpine3.23
ENV NODE_ENV=production
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/nucleo/package.json packages/nucleo/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --ignore-scripts --workspace @educa/api && npm cache clean --force
COPY --from=construcao /repo/packages/shared/dist packages/shared/dist
COPY --from=construcao /repo/packages/nucleo/dist packages/nucleo/dist
COPY --from=construcao /repo/apps/api/dist apps/api/dist
USER node
WORKDIR /repo/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]

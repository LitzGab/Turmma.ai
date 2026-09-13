# Contexto de build: raiz do repositório. Fumaça do F0: build e `vite preview` com proxy para a API.
FROM node:22.23.2-alpine3.23
WORKDIR /repo
# Tudo como `node`: o preview do Vite grava arquivo temporário em node_modules ao ler a config.
RUN chown node:node /repo
USER node
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node packages/shared/package.json packages/shared/
COPY --chown=node:node packages/nucleo/package.json packages/nucleo/
COPY --chown=node:node apps/api/package.json apps/api/
COPY --chown=node:node apps/web/package.json apps/web/
RUN npm ci --ignore-scripts && npm cache clean --force
COPY --chown=node:node tsconfig.base.json ./
COPY --chown=node:node packages/shared packages/shared
COPY --chown=node:node apps/web apps/web
RUN npm run build -w @educa/web
WORKDIR /repo/apps/web
EXPOSE 4173
CMD ["../../node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "4173", "--strictPort"]

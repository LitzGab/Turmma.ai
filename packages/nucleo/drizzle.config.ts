import { defineConfig } from 'drizzle-kit'

// Gera a migration a partir do schema: `npx drizzle-kit generate --config packages/nucleo/drizzle.config.ts`.
// A migration gerada é revisada e versionada; quem aplica é o serviço `migrar` (src/db/migrar.ts).
export default defineConfig({
  dialect: 'postgresql',
  casing: 'snake_case',
  schema: './packages/nucleo/src/db/schema/*.ts',
  out: './packages/nucleo/drizzle',
})

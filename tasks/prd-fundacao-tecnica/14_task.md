# Tarefa 14.0 — Casca da web com os quatro estados, no limite do Chromebook

**Funcionalidade:** fundacao-tecnica · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `test-engineer`

## Objetivo

A web passa a ter uma casca em pt-BR que busca o estado do sistema na API e mostra
carregando, vazio, erro e com dado. Os componentes de estado ficam prontos para todas as
telas seguintes, e a esteira reprova bundle acima do teto e violação grave de
acessibilidade.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF13 e RF14; `techspec.md`: seção 4 (`estado` e `avisos`) e seção 9 (Frontend)
- `.claude/rules/50-frontend.md`: itens 1 (Chromebook fraco), 3 (TanStack Query), 4 (tipos de
  `packages/shared`), 5 (quatro estados), 11 (acessibilidade) e 12 (pt-BR, erro diz o que
  fazer)
- `CLAUDE.md`, seção "Skills": o `frontend-design` não vale aqui; identidade visual ainda em
  aberto, então nada de fonte pesada nem animação
- `docs/interface.md`: só para não contradizer a navegação futura; esta casca não é uma tela
  de papel
- Skills: `tanstack-query-best-practices`, `tailwind-design-system`, `accessibility`,
  `playwright-best-practices`, `vercel-react-best-practices` (sem as partes de Next.js)
- Código existente: `apps/web` (fumaça da 1.0), `CodigoDeErro` e mensagens (2.0)

## Subtarefas

- [ ] 14.1 — `GET /v1/sistema/estado` (`{ versao, ambiente, componentes[] }`) e
  `GET /v1/sistema/avisos` (`{ itens[] }`, lido de configuração). As duas são
  `@RotaAnonima` e usam DTO zod em `packages/shared`
- [ ] 14.2 — Em `apps/web/src/componentes/estado/`: `EstadoCarregando`, `EstadoVazio` (convite
  para agir) e `EstadoErro` (mensagem do catálogo pelo `codigo`, botão "Tentar de novo",
  nunca o número do status).
  - A casca usa TanStack Query e Tailwind.
  - Datas e números passam por `Intl` pt-BR.
  - A remoção da página de fumaça da 1.0 é ajustada.
- [ ] 14.3 — size-limit com teto de 150 kB em brotli no JS inicial, e `@axe-core/playwright`
  com as tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`, reprovando `serious` e
  `critical`. Projeto Playwright `chromebook` com CPU ×4 e Fast 3G via CDP. Tudo entra no
  `ci:e2e`
- [ ] 14.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sistema/estado.controller.ts`, `avisos.controller.ts` | novo |
| `packages/shared/src/sistema/estado.ts`, `avisos.ts` | novo |
| `apps/web/src/componentes/estado/*.tsx` | novo |
| `apps/web/src/paginas/Casca.tsx`, `apps/web/src/api/cliente.ts` | novo |
| `apps/web/src/main.tsx`, `apps/web/tailwind.config.*` | alterado / novo |
| `.size-limit.json`, `playwright.config.ts` | novo / alterado |
| `e2e/casca.spec.ts`, `e2e/__fixtures__/*` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: a casca mostra versão e componentes vindos da API | e2e | o estado com dado |
| borda: vazio (avisos `[]`) mostra convite; carregando aparece com resposta atrasada; erro mostra mensagem pelo `codigo`, botão "Tentar de novo" e nenhum "500" na tela | e2e (rota interceptada) | quebra se faltar um dos quatro estados |
| borda: "Tentar de novo" com a rede restabelecida mostra o dado | e2e | o erro é recuperável sem recarregar |
| borda: perfil `chromebook` mostra o dado em até 5 s | e2e | cabe no Chromebook fraco |
| acessibilidade: o percurso inteiro só com teclado e foco visível; axe sem violação grave | e2e | a regra 50, item 11 |
| guarda: página de fixture com violação `serious` faz o axe falhar; bundle de fixture acima de 150 kB faz o size-limit falhar | e2e e unidade | as guardas pegam de fato |

Sem permissão nem isolamento: a casca não mostra dado de escola.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Vetos aprovados (se aplicáveis)
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Identidade visual, layout por papel, seletor de escola e login (F1, F2). Feed de agentes e
chat (F7, F11).

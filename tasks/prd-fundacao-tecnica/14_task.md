# Tarefa 14.0 — Casca da web com os quatro estados, no limite do Chromebook e do celular

**Funcionalidade:** fundacao-tecnica · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `test-engineer`

## Objetivo

A web passa a ter uma casca em pt-BR que busca o estado do sistema na API e mostra
carregando, vazio, erro e com dado. A casca é responsiva desde o primeiro commit e funciona
igual no Chromebook fraco e no celular (D51). Os componentes de estado ficam prontos para
todas as telas seguintes, e a esteira reprova:
- bundle acima do teto
- violação grave de acessibilidade
- tela que quebra na largura de celular

Revista em 13/09/2026 (D51): antes desta revisão, a tarefa só olhava o Chromebook.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF13 e RF14; `techspec.md`: seção 4 (`estado` e `avisos`) e seção 9 (Frontend)
- `.claude/rules/50-frontend.md`: itens 1 (computador fraco), 2 e 2a (sem depender de
  celular, mas responsiva e usável nele), 3 (TanStack Query), 4 (tipos de
  `packages/shared`), 5 (quatro estados), 11 (acessibilidade) e 12 (pt-BR, erro diz o que
  fazer)
- `CLAUDE.md`: D51; seção "Skills", conflito do Playwright (viewport de celular e toque se
  aplicam; PWA e app nativo não)
- `CLAUDE.md`, seção "Skills": o `frontend-design` não vale aqui; identidade visual ainda em
  aberto, então nada de fonte pesada nem animação
- `docs/interface.md`: só para não contradizer a navegação futura; esta casca não é uma tela
  de papel
- Skills: `tanstack-query-best-practices`, `tailwind-design-system`, `accessibility`,
  `playwright-best-practices`, `vercel-react-best-practices` (sem as partes de Next.js)
- Código existente: `apps/web` (fumaça da 1.0), `CodigoDeErro` e mensagens (2.0)

## Subtarefas

- [x] 14.1 — `GET /v1/sistema/estado` (`{ versao, ambiente, componentes[] }`) e
  `GET /v1/sistema/avisos` (`{ itens[] }`, lido de configuração). As duas são
  `@RotaAnonima` e usam DTO zod em `packages/shared`
- [x] 14.2 — Em `apps/web/src/componentes/estado/`: `EstadoCarregando`, `EstadoVazio` (convite
  para agir) e `EstadoErro` (mensagem do catálogo pelo `codigo`, botão "Tentar de novo",
  nunca o número do status).
  - A casca usa TanStack Query e Tailwind.
  - Layout mobile-first: coluna única a partir de 360 px, ampliando em telas maiores, sem
    rolagem horizontal. `<meta name="viewport" content="width=device-width, initial-scale=1">`
    sem bloquear zoom.
  - Botão "Tentar de novo" e qualquer ação com alvo de toque de pelo menos 44 × 44 px; nada
    que dependa de hover.
  - Datas e números passam por `Intl` pt-BR.
  - A remoção da página de fumaça da 1.0 é ajustada.
- [x] 14.3 — size-limit com teto de 150 kB em brotli no JS inicial, e `@axe-core/playwright`
  com as tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`, reprovando `serious` e `critical`
  (inclui `target-size`). Dois projetos Playwright:
  - `chromebook`: CPU ×4 e Fast 3G via CDP
  - `celular`: viewport 360 × 800, `hasTouch` e `isMobile`, CPU ×4 e rede móvel lenta via CDP,
    no Chromium

  Todo `e2e/*.spec.ts` de tela roda nos dois projetos. Tudo entra no `ci:e2e`
- [x] 14.4 — Testes

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
| borda: perfil `celular` mostra o dado em até 5 s, sem rolagem horizontal (`scrollWidth` ≤ largura da janela), e "Tentar de novo" funciona por toque (`tap`) | e2e | quebra se a casca for só para desktop (D51) |
| guarda: página de fixture mais larga que 360 px faz a verificação de rolagem horizontal falhar; botão de fixture com 16 px faz o axe reprovar `target-size` | e2e | as guardas de celular pegam de fato |
| acessibilidade: o percurso inteiro só com teclado e foco visível; axe sem violação grave | e2e | a regra 50, item 11 |
| guarda: página de fixture com violação `serious` faz o axe falhar; bundle de fixture acima de 150 kB faz o size-limit falhar | e2e e unidade | as guardas pegam de fato |

Sem permissão nem isolamento: a casca não mostra dado de escola.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [x] E2E verde (se tocou tela)
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Identidade visual, layout por papel, seletor de escola e login (F1, F2). Feed de agentes e
chat (F7, F11). PWA instalável, notificação push e app nativo (fora do produto, D51).
Navegador além do Chromium no projeto `celular`: a esteira começa só com o Chromium.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit da tarefa fica bloqueado enquanto um revisor obrigatório não tiver rodada iniciada
depois da última alteração de código, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-13 23:50:01 | 2026-09-13 23:53:31 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a908c2753120f36dc |
| 2026-09-13 23:50:14 | 2026-09-13 23:53:53 | `test-engineer` | 1 | REPROVADO | a99ea44bd8d87d29e |
| 2026-09-14 00:29:14 | 2026-09-14 00:31:45 | `frontend-reviewer` | 2 | APROVADO | a7031fdc516a27554 |
| 2026-09-14 00:29:37 | 2026-09-14 00:31:46 | `test-engineer` | 2 | APROVADO | a3456dfc172549c1e |

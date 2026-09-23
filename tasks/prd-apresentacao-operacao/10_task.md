# Tarefa 10.0 — Web do operador: chunk próprio, sessão em memória, casca, entrar e segundo fator

**Funcionalidade:** apresentacao-operacao (A0) · **Depende de:** 2.0 e 8.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O operador entra pela web em `/operacao/entrar`, passa pelo segundo fator em `/operacao/mfa` e chega
à casca da operação; a sessão dele vive separada da sessão de escola, e a web da escola nunca baixa o
código do painel.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `tasks/prd-apresentacao-operacao/techspec.md` seções 4, 5 ("Conferência da sessão": 401
  `ACESSO_VENCIDO` × 401 `SESSAO_ENCERRADA` × 503) e 9 ("Área do operador" e "Orçamento"), e
  `cenarios.md` (E2, E3, E4, B1, B2)
- `.claude/rules/50-frontend.md` (itens 3, 5, 7 e 11)
- `docs/interface.md` 5a (painel da operação) e 11.1 (casca)
- `tasks/prd-identidade-e-tenancy/retro.md`, "Grupos de causa": resíduo da pessoa anterior na sessão
  do cliente web custou 9 reprovações no F1
- Código existente: `apps/web/src/api/sessao.ts`, `apps/web/src/sessao/inatividade.ts`,
  `apps/web/src/rotas.tsx` (wouter), `apps/web/src/componentes/estado/*`, `apps/web/vite.config.ts`,
  `.size-limit.json`, `tools/ci/tamanho-web.test.ts`
- A API das tarefas 4.0 a 8.0: `/v1/operacao/sessao/*` e `/v1/operacao/eu`

## Subtarefas

- [ ] 10.1 — Rotas `/operacao`, `/operacao/entrar` e `/operacao/mfa` num chunk `operacao-*.js`
  (`manualChunks`), por `import()` com fallback `EstadoCarregando` e fronteira de erro com botão
- [ ] 10.2 — `apps/web/src/operacao/api/sessao.ts`: token em variável de módulo própria, cookie
  `turmma_operacao` só no servidor, `BroadcastChannel` próprio; sair ou trocar de pessoa apaga tudo
  que era da anterior. Nada em `localStorage` nem na URL
- [ ] 10.3 — Respostas, com os textos da seção 9 da techspec: `ACESSO_VENCIDO` renova e repete a ação;
  `SESSAO_ENCERRADA` leva à entrada com a mensagem; 503 mostra a mensagem e **fica** na tela
- [ ] 10.4 — Aviso 2 min antes dos 30 min parados, no mesmo desenho do `inatividade.ts`
- [ ] 10.5 — Casca da operação (seção 9 da techspec), com Sair a um clique e do mesmo tamanho dos
  outros (D59); telas entrar e mfa com os quatro estados
- [ ] 10.6 — Orçamento: `operacao-*.js` com 60 kB brotli no `.size-limit.json`; teste de que nada
  importado pela entrada da escola vem de `apps/web/src/operacao/`
- [ ] 10.7 — Testes (tabela abaixo); portão com `--e2e`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/operacao/rotas.tsx` | novo |
| `apps/web/src/operacao/api/sessao.ts` e `sessao.test.ts` | novo |
| `apps/web/src/operacao/paginas/Entrar.tsx`, `Mfa.tsx` | novo |
| `apps/web/src/operacao/componentes/CascaDaOperacao.tsx` | novo |
| `apps/web/src/operacao/inatividade.ts` | novo |
| `apps/web/src/rotas.tsx` | alterado (só o `import()` da área) |
| `apps/web/vite.config.ts` | alterado |
| `.size-limit.json`, `tools/ci/tamanho-web.test.ts` | alterado |
| `e2e/operacao.spec.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| **E2** — `SESSAO_ENCERRADA` volta à entrada com a mensagem; 503 fica na tela com a mensagem | e2e | os dois 401 e o 503 não se confundem |
| `ACESSO_VENCIDO` renova e a ação seguinte passa sem o operador perceber | unidade | a renovação acontece antes de desistir |
| **E3** — aviso 2 min antes dos 30 min parados, com relógio controlado | e2e | o ponto de parada é visível antes de cair |
| **E4** — falha ao carregar o chunk mostra a fronteira de erro com "Tente de novo" | e2e | chunk que falha em 3G não vira tela branca |
| **B1** (chunk) — `operacao-*.js` acima de 60 kB reprova | unidade | teto próprio do chunk |
| **B2** — nada importado pela entrada da escola vem de `apps/web/src/operacao/` | unidade | a escola nunca baixa o código do painel |
| sair como operador A e entrar como B na mesma aba: nada de A aparece nem fica em memória | unidade | sem resíduo da pessoa anterior (retro do F1) |
| segunda aba: sair numa encerra a outra pelo `BroadcastChannel` próprio, sem mexer na sessão de escola aberta | e2e | as duas sessões não se cruzam |
| teclado, toque e axe nos dois projetos; `document.title` por rota | e2e | regra 50 |

Concorrência: duas abas renovando juntas não deslogam a aba irmã (C30 prova o servidor).

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- As telas de convite e de configurar o segundo fator: 11.0
- Qualquer tela do painel (escolas, uso): A0b
- Mudança na API: 4.0 a 8.0

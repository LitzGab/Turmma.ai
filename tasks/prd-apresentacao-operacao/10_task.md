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

- [x] 10.1 — Rotas `/operacao`, `/operacao/entrar` e `/operacao/mfa` num chunk `operacao-*.js`
  (`manualChunks`), por `import()` com fallback `EstadoCarregando` e fronteira de erro com botão
- [x] 10.2 — `apps/web/src/operacao/api/sessao.ts`: token em variável de módulo própria, cookie
  `turmma_operacao` só no servidor, `BroadcastChannel` próprio; sair ou trocar de pessoa apaga tudo
  que era da anterior. Nada em `localStorage` nem na URL
- [x] 10.3 — Respostas, com os textos da seção 9 da techspec: `ACESSO_VENCIDO` renova e repete a ação;
  `SESSAO_ENCERRADA` leva à entrada com a mensagem; 503 mostra a mensagem e **fica** na tela
- [x] 10.4 — Aviso 2 min antes dos 30 min parados, no mesmo desenho do `inatividade.ts`
- [x] 10.5 — Casca da operação (seção 9 da techspec), com Sair a um clique e do mesmo tamanho dos
  outros (D59); telas entrar e mfa com os quatro estados
- [x] 10.6 — Orçamento: `operacao-*.js` com 60 kB brotli no `.size-limit.json`; teste de que nada
  importado pela entrada da escola vem de `apps/web/src/operacao/`
- [x] 10.7 — Testes (tabela abaixo); portão com `--e2e`

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

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Divergências resolvidas nesta tarefa

- **O nome `operacao-*.js` vem do `chunkFileNames`, e não do `manualChunks`.** O Vite 8 usa o Rolldown, onde o
  `manualChunks` está obsoleto e vira um grupo de `codeSplitting` que, por padrão, puxa junto as dependências dos módulos
  capturados (React, os componentes da entrada): a entrada passaria a importar o chunk da operação, o contrário do B2. O
  `apps/web/nome-dos-chunks.ts` dá `operacao-*.js` ao chunk cuja fachada está em `src/operacao/` e o prefixo `parte-` a
  todo outro chunk que não é entrada, o que resolve também a recomendação da 2.0 (um `import()` de `index-algo.ts`
  cairia no glob `index-*.js` da entrada). Teste em `apps/web/nome-dos-chunks.test.ts`, sobre o build de verdade.
- **B2 é provado no build, e não só no fonte.** O teste constrói a web em memória (uns 200 ms) e confere que o chunk de
  entrada não leva módulo de `src/operacao/`, que a área está num chunk `operacao-*` só por `import()`, e que nenhum outro
  chunk tem o nome da entrada; o controle é um projeto mínimo com o `import` estático, que aparece na entrada. O e2e
  confere também que a tela de entrada da escola não pede o `operacao-*.js`.
- **A fronteira de erro fica em `apps/web/src/rotas.tsx`**, junto do `import()`, e não no chunk: ela precisa existir
  quando o chunk não chegou. O "Tente de novo" recarrega a página, porque o navegador guarda a falha do módulo e um
  segundo `import()` do mesmo endereço devolveria a mesma falha.
- **Cache de consultas próprio da operação** (`operacao/rotas.tsx`), esvaziado a cada sessão de operador que acaba ou muda
  de dono: a troca de sessão de escola não mexe nele, e vice-versa.
- **O relógio de inatividade conta do último uso aceito pela API, e não da última tecla**, e desconta 1 min: a API grava
  o `ultimoUsoEm` no máximo uma vez por minuto (4.0), e não há rota de atividade da operação. Com interação, e passado um
  minuto do último uso, sai um `GET /v1/operacao/eu`. O aviso aparece aos 27 min do último uso aceito e a aba encerra aos
  29 min, sempre antes do servidor. `pointermove` sem deslocamento (o que o Chrome dispara quando a tela muda debaixo
  do cursor parado, como o próprio aviso aparecendo) não conta.
- **Código do segundo fator recusado volta à entrada** com o aviso, porque a API queima o desafio em toda tentativa
  (7.0); `ENTRADA_INVALIDA` e 503 deixam a pessoa na tela com o desafio. `configurar_mfa` da entrada leva a
  `/operacao/mfa/configurar`, cuja tela é da 11.0; até lá o caminho cai na página "não encontrada" da operação.
- **Abrir a aba sem sessão** (o `/renovar` responde `SESSAO_ENCERRADA` a toda recusa, 8.0) vai à entrada **sem** a
  mensagem de sessão encerrada: quem só abriu `/operacao` não teve sessão nenhuma terminada. A mensagem vem só da sessão
  que estava aberta nesta aba.
- **Canal `turmma-operacao`** leva três fatos, sem pessoa nem token: `saiu` (as outras abas esquecem tudo),
  `entrou` (sessão nova com outro cookie: as outras esquecem a anterior) e `uso` (empurra o relógio das outras).
- **Arquivos a mais que a lista previa:** `apps/web/src/operacao/caminhos.ts`, `textos.ts`, `titulo.ts`, `api/eu.ts`,
  `inatividade.test.ts`; `apps/web/nome-dos-chunks.ts` e `.test.ts` (e o `tsconfig.json` da web, que os inclui);
  `e2e/__fixtures__/operacao.ts` (o operador com segundo fator ativo, pelas rotas de verdade); e o comentário de
  `e2e/tokens.spec.ts`, que dizia que a faixa preta chegaria com esta tarefa.
- **O operador do e2e é apagado no fim de cada teste** (`removerOperador`), e o `apps/api/test/arquitetura.test.ts` passa
  a tratar `e2e/` como apoio de teste no C45. O compose de teste é o mesmo da integração: um operador ativo que sobrasse
  do e2e mudaria o bootstrap dos `ops:*` que `convite.int.test.ts` e `mfa.int.test.ts` testam (sem operador ativo, o
  comando aceita o `OPERADOR` do ambiente).

## Fora do escopo desta tarefa

- As telas de convite e de configurar o segundo fator: 11.0
- Qualquer tela do painel (escolas, uso): A0b
- Mudança na API: 4.0 a 8.0

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 06:23:05 | 2026-09-24 06:25:45 | `test-engineer` | 1 | REPROVADO | ac4b14442c2e1cea9 |
| 2026-09-24 06:39:44 | 2026-09-24 06:40:11 | `test-engineer` | 2 | APROVADO | a59bebc753fb94707 |
| 2026-09-24 06:40:20 | 2026-09-24 06:41:08 | `frontend-reviewer` | 1 | APROVADO | ac7185c85b24639ba |
| 2026-09-24 06:40:23 | 2026-09-24 06:41:09 | `privacy-guardian` | 1 | APROVADO | ac4b6c7f5493e4f16 |
| 2026-09-24 06:40:16 | 2026-09-24 06:41:19 | `revisor-geral` | 1 | APROVADO | ac48c900944d1df7c |

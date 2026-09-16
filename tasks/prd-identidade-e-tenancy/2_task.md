# Tarefa 2.0 — Guarda de sessão real, com matriz de permissão

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 1.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`, `test-engineer`

## Objetivo

Toda requisição autenticada passa a ser conferida contra uma sessão gravada no Postgres, e
toda rota declara quem pode chamá-la numa matriz única. Encerrar a sessão ou desativar o
usuário corta o acesso na requisição seguinte, e o Postgres fora dá "tente de novo", nunca
logout.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF5 (corte na requisição seguinte), RF15 (escopo da escola e do ano), RF17
  (matriz, com indicador de professor), RF18 (nenhuma resposta traz campo fora do contrato)
- `techspec.md`:
  - seção 1: token e ordem das guardas
  - seção 2: `nucleo/identidade`, `nucleo/permissao`, `api/sessao`
  - seção 3: `ano_letivo`, `conta`, `usuario`, `sessao`, `registro_acesso`
  - seção 4: desafio e envelope
  - seção 5: "Requisição" e "Operador"
  - seção 6: o `ResolucaoDeTenantRepository` e a justificativa dos `@SemEscopo`
  - seção 7: DTO de saída
  - seção 7c: Postgres cai
- `.claude/rules/10-multitenancy.md`, itens 3, 5, 6 e 9: escopo do token aplicado no
  repository; teste que quebra sem a cláusula; 404 igual; `@SemEscopo` com justificativa
- `.claude/rules/80-infra-e-carga.md`, itens 1 e 5: limite por usuário e escola antes de
  qualquer trabalho caro; nada de estado em memória
- `.claude/rules/70-conformidade-cne.md`, item 8, e regra 60, item 11: o que a coordenação
  e a rede podem ver do indicador de professor
- `.claude/rules/20-lgpd-menores.md`, itens 4 e 6: DTO explícito e resposta igual
- Código existente:
  - `packages/nucleo/src/identidade/guarda-autenticacao.ts` e `verificar-token.ts`: verificação atual do JWT, recusa única e ids em minúsculas
  - `packages/nucleo/src/contexto/contexto.ts`: `definirIdentidadeNoContexto` gravável uma vez; o contexto ganha `papel`, `sessaoId` e `anoLetivoId`
  - `packages/nucleo/src/limite/guarda-limite.ts`: hoje lê `identidadeDaRequisicao()` do contexto; passa a limitar pelo `sub`/`esc` do JWT verificado, antes da leitura de sessão
  - `apps/api/src/app.module.ts`: ordem de registro das `APP_GUARD`
  - `packages/nucleo/src/db/sem-escopo.decorator.ts` e `justificativaSemEscopo`
  - `packages/nucleo/src/erro/erro-de-dominio.ts` e `packages/shared/src/erros/codigo-de-erro.ts`: `INDISPONIVEL_TENTE_DE_NOVO` já existe
  - `packages/shared/src/sistema/*.ts`: padrão de contrato zod
  - `apps/api/src/ops/token-sintetico.ts`: base do `ops:sessao-sintetica`

## Subtarefas

- [x] 2.1 — Migration de `ano_letivo`, `conta`, `usuario`, `sessao` e `registro_acesso`, conforme a seção 3
  - **Unicidade:** `unique (escola_id, id)` em `ano_letivo`, `usuario` e `sessao`, e FK composta `(escola_id, usuario_id)`.
  - **Check de `usuario`:** `conta_id` nulo só com papel `aluno`.
  - **`sessao`:** `fillfactor=70`, índice em `refresh_hash` e em `refresh_hash_anterior`, sem índice em `ultimo_uso_em`.
  - **`registro_acesso`:** check de escola nula só em `login_falho` sem usuário.
  - **`auditoria`:** acrescenta a FK de `autor_usuario_id` (expande).
  - **Fora do F1:** `ano_letivo` ganha só as colunas; rotas de ano letivo são da 8.0.
- [x] 2.2 — `EmissorDeToken` e as três guardas em `packages/nucleo/src/identidade`
  - **Token:** JWT HS256 de 10 min com `sub`, `esc`, `sid`, `typ: JWT`, emissor `educa`. O `verificarToken` passa a exigir `sid` e a recusar `typ: desafio+jwt`.
  - **Ordem das guardas:** `GuardaDeAutenticacao` só verifica o JWT, `GuardaDeLimite` limita por `sub` e `esc` do token verificado, e a nova `GuardaDeSessao` roda por último.
  - **`GuardaDeSessao`:** uma consulta `sessao ⋈ usuario ⋈ ano_letivo em_curso` (left join no ano) por `(esc, sid)`, sem cache.
    - Recusa com `NAO_AUTENTICADO`: sessão encerrada ou expirada, `sessao.usuario_id ≠ sub`, usuário desativado, inatividade vencida pela coluna da escola mais 5 min de tolerância.
    - Com erro ou timeout do Postgres, responde `INDISPONIVEL_TENTE_DE_NOVO` (503), nunca 401.
    - Grava no contexto usuário, escola, papel, `sessaoId` e `anoLetivoId`, que pode ser nulo.
  - **Ano em curso:** `exigirAnoEmCurso()` no contexto falha fechado com `NAO_ENCONTRADO` quando o ano é nulo. As rotas de turma e vínculo (8.0 e 9.0) vão chamá-lo.
- [x] 2.3 — `MATRIZ` em `packages/shared/src/permissao/matriz.ts`
  - **Formato:** papel × recurso × ação, com alcance `nunca|proprio|turma_vinculada|unidade|agregado|nominal_auditado`.
  - **Papéis:** rede, coordenador, professor e aluno. Os recursos são os do F1 mais `indicador_professor`: próprio para o professor, `agregado` e `nominal_auditado` para a coordenação, `agregado` para a rede.
  - **`@Permite(recurso, acao)`:** decorator com guarda que barra por papel. Rota sem `@Permite` e sem `@RotaAnonima` falha no boot.
  - **Expectativa:** o arquivo `matriz.expectativa.ts` fica escrito à mão, célula a célula.
- [x] 2.4 — `ResolucaoDeTenantRepository` em `apps/api/src/sessao`
  - Nasce com os métodos que esta tarefa usa, cada um com `@SemEscopo` e a justificativa da tabela da seção 6: sessão por `refresh_hash` e pelo anterior, usuários ativos da conta
  - As tarefas seguintes acrescentam os outros métodos da mesma tabela
  - Teste de arquitetura: só arquivos de `apps/api/src/sessao` importam o repository
- [x] 2.5 — Varredura de DTO e `ops:sessao-sintetica`
  - **Varredura:** teste que percorre todos os esquemas de resposta exportados de `packages/shared` e recusa as chaves `senha`, `hash`, `segredo`, `sujeito`, `refresh`, `email` em contrato de aluno, e o redact. A exceção nominal de `/v1/conta/mfa/configurar` e `/ativar` é declarada na lista do próprio teste e só entra na 6.0. Os contratos que as tarefas seguintes criam passam pela varredura sem mudar o teste.
  - **`ops:sessao-sintetica`:** cria, na escola informada, `usuario` e `sessao` com papel escolhido e emite o token pelo `EmissorDeToken`, com `--quantidade` para a carga. Só roda com `AMBIENTE=local`.
- [x] 2.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/ano-letivo.ts`, `conta.ts`, `usuario.ts`, `sessao.ts`, `registro-acesso.ts` | novo |
| `packages/nucleo/drizzle/0005_*.sql` e `meta/` | novo |
| `packages/nucleo/src/identidade/emissor-de-token.ts`, `guarda-sessao.ts`, `sessao.repository.ts` | novo |
| `packages/nucleo/src/identidade/guarda-autenticacao.ts`, `verificar-token.ts`, `contexto/contexto.ts`, `limite/guarda-limite.ts` | alterado |
| `packages/nucleo/src/permissao/permite.decorator.ts`, `guarda-permissao.ts` | novo |
| `packages/shared/src/permissao/matriz.ts`, `matriz.expectativa.ts` | novo |
| `apps/api/src/sessao/resolucao-de-tenant.repository.ts`, `sessao.module.ts` | novo |
| `apps/api/src/app.module.ts` | alterado |
| `apps/api/src/ops/sessao-sintetica.ts`, `package.json` | novo, alterado |
| `packages/nucleo/src/identidade/*.test.ts`, `packages/shared/src/permissao/matriz.test.ts`, `apps/api/test/sessao-guarda.int.test.ts`, `apps/api/test/contratos.test.ts`, `apps/api/test/arquitetura.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: token de `ops:sessao-sintetica` alcança `GET /v1/sistema/contexto` e o contexto traz usuário, escola, papel e sessão | integração | a sessão real atende |
| borda: sessão encerrada no banco com o JWT ainda válido dá 401 na requisição seguinte; usuário desativado, idem | integração | RF5; quebra se a guarda confiar só no JWT |
| isolamento: JWT assinado à mão pelo `EmissorDeToken` com `sub` de A e `esc` de B é recusado, com linhas existentes nas duas escolas | isolamento | quebra sem o `(esc, sid)` e a conferência de `usuario_id` |
| borda: `sid` de outro usuário da mesma escola é recusado | integração | `sessao.usuario_id ≠ sub` |
| carga: JWT inválido e rajada acima do limite do usuário não geram consulta ao Postgres (contagem de queries da guarda = 0) | integração | ordem JWT → limite → sessão (regra 80) |
| falha: Postgres pausado responde 503 `INDISPONIVEL_TENTE_DE_NOVO` com `Retry-After`, nunca 401 | integração | queda do banco não desloga a escola |
| borda: escola sem ano em curso autentica, e `exigirAnoEmCurso()` falha fechado com 404 | integração | ano letivo como segunda dimensão, sem rota inventada |
| permissão: mudar uma célula da `MATRIZ` sem mudar a expectativa deixa vermelho; a rede nunca tem alcance individual; o indicador de professor segue a regra 70, item 8 | unidade | RF17 |
| permissão: rota sem `@Permite` e sem `@RotaAnonima` derruba o boot do módulo de teste | unidade | endpoint novo nasce fechado |
| privacidade: a varredura reprova um contrato de fixture com `senhaHash` | unidade | RF18 |
| arquitetura: arquivo fora de `apps/api/src/sessao` importando `ResolucaoDeTenantRepository` reprova | unidade | a exceção do item 9 fica contida |
| borda: `ops:sessao-sintetica` com `AMBIENTE` diferente de `local`, ou ausente, sai com erro | integração | teste não vira porta em produção |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- **Token sintético e testes do F0:** tirar o emissor e a flag, migrar os testes, a carga e o handshake do realtime (3.0). Nesta tarefa, os testes do F0 continuam verdes. Onde a guarda nova quebrar teste antigo, a tarefa monta a sessão pelo `ops:sessao-sintetica`, sem apagar o teste.
- **Login** por e-mail, matrícula ou conta externa (4.0, 11.0, 13.0).
- **Renovação, atividade e saída** (5.0).
- **Rotas de ano letivo, turma e vínculo** (8.0, 9.0).
- **Cache de sessão:** fica só como risco da seção 13, se o cenário da 16.0 pedir.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-15 19:23:55 | 2026-09-15 19:25:18 | `conformidade-reviewer` | 1 | APROVADO | a3c2d62289cd17403 |
| 2026-09-15 19:23:19 | 2026-09-15 19:25:51 | `tenancy-guardian` | 1 | APROVADO | af8f467a43de0077c |
| 2026-09-15 19:23:32 | 2026-09-15 19:27:05 | `privacy-guardian` | 1 | APROVADO | aa3f4fb748219aed1 |
| 2026-09-15 19:23:47 | 2026-09-15 19:27:29 | `infra-guardian` | 1 | APROVADO | a8bcae030300c8673 |
| 2026-09-15 19:24:11 | 2026-09-15 19:27:59 | `test-engineer` | 1 | REPROVADO | a7aa8aeabfc881e3e |
| 2026-09-15 19:52:55 | 2026-09-15 19:54:11 | `test-engineer` | 2 | APROVADO | a76325bb06e368b77 |
| 2026-09-15 19:54:56 | 2026-09-15 19:56:46 | `tenancy-guardian` | 2 | APROVADO | ac27008e83c12edc4 |
| 2026-09-15 19:55:23 | 2026-09-15 19:56:50 | `conformidade-reviewer` | 2 | APROVADO | a47efdf1f78dd194c |
| 2026-09-15 19:55:05 | 2026-09-15 19:57:12 | `privacy-guardian` | 2 | APROVADO | a8fc7ea6445a7c737 |
| 2026-09-15 19:55:14 | 2026-09-15 19:57:13 | `infra-guardian` | 2 | APROVADO | aea17a8dcf6f279d5 |
| 2026-09-15 19:54:44 | 2026-09-15 20:00:17 | `revisor-geral` | 1 | APROVADO | a3ab3aad673108fd9 |

# Tarefas — A escola montada pela coordenação (A1)

**PRD:** `prd.md` · **Tech Spec:** `techspec.md` · **Cenários:** `cenarios.md`
**Status:** 0 de 17 concluídas

Aprovadas pelo Joaquim em 26/09/2026. O mapa de cenários por tarefa saiu do `test-engineer`: cada id do
`cenarios.md` está em uma tarefa, ou dividido entre tarefas com a parte de cada uma dita no `N_task.md`. Os
cenários transversais I3, A1, A3 e A4 vivem num arquivo só, `apps/api/test/escola-montada.int.test.ts`, criado
pela 1.0; o I9, em `packages/shared/src/permissao/matriz.test.ts`. Cada tarefa acrescenta as rotas e as ações
dela nos dois.

## Lista

- [ ] **1.0 — Coordenação renomeia e exclui disciplina e turma**
  - [ ] 1.1 Células `renomear` e `excluir` de disciplina e turma na `MATRIZ`; contratos `.strict()`
  - [ ] 1.2 `PATCH` e `DELETE` de `disciplinas/:id` e `turmas/:id`, com a FK violada mapeada para `CONFLITO`
  - [ ] 1.3 O arquivo transversal `escola-montada.int.test.ts` (I3, A1, A3, A4)
  - [ ] 1.4 Testes: E1; E2 (disciplina e turma com vínculo, turma vazia); I3, P1, I9 das rotas desta tarefa

- [ ] **2.0 — Lista de nomes da turma: prévia, gravação, avulso, retirada e leitura auditada**
  - [ ] 2.1 Migration 0019 `lista_nome`, com o check, o único da matrícula e o índice
  - [ ] 2.2 Leitor do texto (`;`, `,`, tabulação, cabeçalho, BOM), até 200 linhas e 64 KB
  - [ ] 2.3 Prévia, gravação, avulso, retirada e leitura auditada, com a consulta a `credencial_matricula`
  - [ ] 2.4 Documentos: nota em `docs/infra.md` 3.5; `ListaNome` real em `docs/modelo-de-dados.md`
  - [ ] 2.5 Testes: E3, E4, E5, E6 (sem o aprovado), E7 (sem retirar reivindicado ou aprovado), C8, C9, E2 (nome na
    lista), A1, A2 e I3, P1, I9 da lista; o check `aprovado ⇔ usuario_id ⇔ nome e matrícula nulos` (23514)

- [ ] **3.0 — Professor cadastrado pela coordenação, com convite de 7 dias e aceite sem segundo fator**
  - [ ] 3.1 Migration 0018: `convite.tipo` aceita `professor`; validade pelo tipo
  - [ ] 3.2 Cadastro sob `travarEscola`, lista sem link e sem `contaNova`; refazer e revogar só do convite de professor
  - [ ] 3.3 O aceite do professor sem segundo fator; o coordenador continua exigindo
  - [ ] 3.4 Documento: `Convite` com o tipo `professor` em `docs/modelo-de-dados.md`
  - [ ] 3.5 Testes: E8, E9, E10, E11, R4, C7, I7, A1 (professor e convite), I3, P1, I9 dos professores; o aceite sem
    segundo fator

- [ ] **4.0 — Professor gera e revoga o acesso da turma, com link e código**
  - [ ] 4.1 Migration 0020 `acesso_turma`, com a FK em `cascade` e os únicos parciais
  - [ ] 4.2 Código de 8 caracteres, normalização e HMAC com `SALA_CHAVE_CODIGO`
  - [ ] 4.3 Gerar (trava da turma, revogação do anterior, savepoint na colisão), revogar e ler
  - [ ] 4.4 Excluir turma com `for update` e sem acesso vigente
  - [ ] 4.5 Documento: `AcessoTurma` real em `docs/modelo-de-dados.md`
  - [ ] 4.6 Testes: E13, E14, E15, C5, C6, C11 (dois arranjos), A5, P2, E12 (acesso), E2 (acesso vigente e
    cascata), A1 (acesso), I3, I9

- [ ] **5.0 — Aluno abre a turma pelo link ou pelo código**
  - [ ] 5.1 `acessoDaSalaPorToken` e `acessoDaSalaPorCodigo` com `@SemEscopo`; o `AcessoDaSala` em `sessao`
  - [ ] 5.2 `POST salas/abrir`, anônima, `no-store`, sem cookie nem registro de acesso
  - [ ] 5.3 Documento: os dois `@SemEscopo` na tabela de `docs/modelo-de-dados.md`
  - [ ] 5.4 Testes: I1, I2, E17, E26, E28, V2; a parte de `salas/abrir` de I4, R1, P5, L10, A6, A7

- [ ] **6.0 — Aluno reivindica o nome, com idempotência e hash sempre no semáforo**
  - [ ] 6.1 Migration 0021 `reivindicacao`; `REIVINDICACAO_RECUSADA` no catálogo
  - [ ] 6.2 `POST salas/reivindicar`: chave, hash no semáforo, `insert` e depois `update` condicional, releitura
  - [ ] 6.3 Documento: `Reivindicacao` real em `docs/modelo-de-dados.md`, sem `dispositivo`
  - [ ] 6.4 Testes: I5, R2 (sem "já aprovado"), R3, R5, E23, E24, C2, C4, L9; C1 e E21 sem os contadores; a parte de
    `salas/reivindicar` de I4, R1, P5, L10, A6, A7; E2 (pedido); E7 (retirar reivindicado)

- [ ] **7.0 — Limites da sala: por escola, por nome e por turma, com as métricas**
  - [ ] 7.1 `ContadorEmJanela` com a janela por parâmetro
  - [ ] 7.2 Os três contadores, a espera de 1 s, o `LIMITE_EXCEDIDO` com `Retry-After` e o rebaixamento no semáforo
  - [ ] 7.3 `teve_matricula_errada` lido do contador do nome; métricas e o log `sala.limite_atingido`
  - [ ] 7.4 Testes: I10, L1 a L8, L4b, L6b; os contadores de C1, C2 e E21; E30 (gravação e "Gerar novo"); a métrica
    sem escola; o log uma linha por escola e janela; `Retry-After` no limite por nome

- [ ] **8.0 — Professor ou coordenação decide os pedidos; o aluno aprovado vê a própria turma**
  - [ ] 8.1 `GET turmas/:id/reivindicacoes`, com a leitura auditada da coordenação
  - [ ] 8.2 `POST reivindicacoes/decidir`: uma transação por id, a aprovação cria o aluno
  - [ ] 8.3 `GET minha-turma` (subtarefa separável se a tarefa passar de ~15 arquivos)
  - [ ] 8.4 Testes: I6, I8, P3, P4, E18, E19, E20, E22, E25, E27, C3; os pedidos do E12; o aprovado de E6 e R2; a
    retirada de aprovado do E7; o resto de E21 e E30; A1, A2; I3, I9; fecha A3 e A4

- [ ] **9.0 — Alerta de código errado em massa, `ops:revogar-acessos-sala` e a carga**
  - [ ] 9.1 `ops:revogar-acessos-sala --escola <id>`
  - [ ] 9.2 Regra `sala-codigo-errado-por-escola.yaml` e a entrada do runbook conferida
  - [ ] 9.3 `reivindicacao-em-sala` no k6, com a variante do primeiro dia
  - [ ] 9.4 Testes: E29, L11, L12, K1, K2

- [ ] **10.0 — Virada de ano, eliminação e expurgo alcançam as tabelas novas**
  - [ ] 10.1 `encerrar` revoga, fecha e apaga na mesma transação
  - [ ] 10.2 `for share` no ano nas transações da reivindicação e da decisão
  - [ ] 10.3 Eliminação apaga a `lista_nome` e os pedidos do aluno; `set null` do professor
  - [ ] 10.4 Expurgo com o `acesso_turma` e o `@SemEscopo` reescrito
  - [ ] 10.5 Testes: V1, V3, V4, V5, C10

- [ ] **11.0 — Web: casca por papel, guarda, título, menu da pessoa e fronteira genérica**
  - [ ] 11.1 Fronteira de erro genérica em `componentes/`, com o teste do `componentWillUnmount`
  - [ ] 11.2 Áreas por papel em `import()`, guarda de papel e título por rota
  - [ ] 11.3 Casca da 11.1, com o menu da pessoa (P18); "Turmas" do professor
  - [ ] 11.4 Tetos dos chunks novos no `.size-limit.json`
  - [ ] 11.5 Testes: W2, W5; W4 e W12 da casca; o e2e da A0b junto

- [ ] **12.0 — Web: seletor de escola (P30) e a "Minha turma" do aluno**
  - [ ] 12.1 `/v1/eu` com escola, rede e papel de cada acesso
  - [ ] 12.2 Seletor no formato da 11.1; a troca faz `resetQueries` com o token novo
  - [ ] 12.3 Tela "Minha turma"; teto do chunk do aluno
  - [ ] 12.4 Testes: W3, W13; W4 e W12 da Minha turma; integração do contrato de `/v1/eu`

- [ ] **13.0 — Web: Estrutura, lista de nomes e alocação**
  - [ ] 13.1 Estrutura: ano, série, disciplina e turma, com renomear e excluir
  - [ ] 13.2 Lista: colar ou arquivo, prévia com erros primeiro, avulso e retirada
  - [ ] 13.3 Alocação professor × turma × disciplina
  - [ ] 13.4 Teto do chunk da coordenação
  - [ ] 13.5 Testes: W10; W4 e W12 de Estrutura, Lista e Alocação

- [ ] **14.0 — Web: Professores e o aceite do convite pelo professor**
  - [ ] 14.1 O diálogo de convite de cópia única sai de `operacao/` para `componentes/`
  - [ ] 14.2 Tela Professores: cadastrar, copiar, refazer e revogar
  - [ ] 14.3 Aceite do professor na tela de convite
  - [ ] 14.4 Testes: W14; W4 e W12 de Professores; o e2e da A0b junto

- [ ] **15.0 — Web: acesso da turma do professor**
  - [ ] 15.1 Gerar, mostrar o código em grupos, "Gerar novo" com confirmação, revogar
  - [ ] 15.2 Compartilhar pelo WhatsApp, com a cópia como reserva
  - [ ] 15.3 Teto do chunk do professor
  - [ ] 15.4 Testes: E16, W7; W4 e W12 de Acesso

- [ ] **16.0 — Web: pedidos, com os diálogos de decisão**
  - [ ] 16.1 Pedidos do professor, atualizados a cada 15 s com a aba visível
  - [ ] 16.2 Pedidos da coordenação dentro da turma, com "Atualizar"
  - [ ] 16.3 Diálogos "Aprovar N" (`oficial`) e "Recusar" (`perigo`), com o resultado por pedido
  - [ ] 16.4 Testes: W6, W15; W4 e W12 de Pedidos

- [ ] **17.0 — Web: página pública da turma e o e2e do fluxo inteiro**
  - [ ] 17.1 `MENSAGENS_DA_SALA` em `packages/shared`
  - [ ] 17.2 `/e/<slug>/turma`: link ou código, nomes livres, matrícula e senha, envio único e reenvio no 503
  - [ ] 17.3 A entrada continua abaixo de 150 kB
  - [ ] 17.4 Testes: W1, W8, W9, W11; W4 e W12 da página pública

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | — | 3.0, 11.0 |
| 2.0 | 1.0 | 3.0, 11.0 |
| 3.0 | — | 1.0, 2.0, 4.0, 11.0 |
| 4.0 | 1.0 | 2.0, 3.0, 11.0 |
| 5.0 | 4.0 | 3.0, 11.0 |
| 6.0 | 2.0, 5.0 | 11.0 |
| 7.0 | 6.0 | 11.0 |
| 8.0 | 7.0 | 11.0 |
| 9.0 | 8.0 | 10.0, 11.0 a 16.0 |
| 10.0 | 8.0 | 9.0, 11.0 a 16.0 |
| 11.0 | — | 1.0 a 10.0 |
| 12.0 | 11.0, 8.0 | 9.0, 10.0, 13.0, 14.0, 15.0 |
| 13.0 | 11.0, 2.0 | 3.0 a 10.0, 14.0, 15.0 |
| 14.0 | 11.0, 3.0 | 4.0 a 10.0, 13.0, 15.0 |
| 15.0 | 11.0, 4.0 | 5.0 a 10.0, 13.0, 14.0 |
| 16.0 | 15.0, 13.0, 8.0 | 9.0, 10.0, 12.0 |
| 17.0 | 16.0, 12.0, 6.0 | — |

Paralelo quer dizer "sem dependência de código": os commits continuam um por vez, na `develop`, com a esteira
do anterior verde. Arquivos que várias tarefas alteram, e que quem vem depois pega do commit anterior:
`apps/api/test/escola-montada.int.test.ts`, `packages/shared/src/permissao/matriz.ts` e o teste dela,
`packages/nucleo/src/auditoria/acoes.ts`, `docs/modelo-de-dados.md`, `apps/web/src/rotas.tsx` e o
`.size-limit.json`. As migrations vão na ordem do número (0018 na 3.0, 0019 na 2.0, 0020 na 4.0, 0021 na 6.0):
se a 2.0 for commitada antes da 3.0, os números se trocam, e a Tech Spec é corrigida na mesma tarefa.

## Subagentes por tarefa

| Tarefa | Subagentes obrigatórios |
|---|---|
| 1.0 | `tenancy-guardian` |
| 2.0 | `tenancy-guardian`, `privacy-guardian` |
| 3.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian` |
| 4.0 | `tenancy-guardian`, `privacy-guardian` |
| 5.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian` |
| 6.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian` |
| 7.0 | `infra-guardian`, `privacy-guardian`, `tenancy-guardian` |
| 8.0 | `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian` |
| 9.0 | `infra-guardian`, `tenancy-guardian`, `privacy-guardian` |
| 10.0 | `privacy-guardian`, `tenancy-guardian`, `infra-guardian` |
| 11.0 | `frontend-reviewer` |
| 12.0 | `frontend-reviewer`, `tenancy-guardian`, `privacy-guardian` |
| 13.0 | `frontend-reviewer`, `privacy-guardian` |
| 14.0 | `frontend-reviewer`, `privacy-guardian` |
| 15.0 | `frontend-reviewer`, `privacy-guardian` |
| 16.0 | `frontend-reviewer`, `privacy-guardian` |
| 17.0 | `frontend-reviewer`, `privacy-guardian`, `infra-guardian` |

`test-engineer` (primeiro) e `revisor-geral` em todas. Em tarefa com tela, o `frontend-reviewer` roda sozinho
depois do `test-engineer`, e os outros só depois dele sem ajustes (retro da A0b, proposta 3).

## Critério de pronto da funcionalidade

Do `ROADMAP.md` (A1): "a partir de uma escola vazia, a coordenação monta duas turmas com lista de nomes e
professor alocado sem ninguém ser cadastrado individualmente; o professor confirma o vínculo pelo convite; os
alunos reivindicam os nomes e o professor aprova; dois alunos reivindicando o mesmo nome no mesmo segundo não
geram duplicidade nem erro cru; cada papel vê a própria navegação com a marca; e o teste de isolamento do F1
continua verde com as tabelas novas." Detalhado:

- O fluxo inteiro roda na tela, de uma escola criada no painel da operação até o aluno aprovado vendo só a
  própria turma, nos projetos `chromebook` e `celular`, com axe (W1)
- Duas turmas montadas com lista colada ou em arquivo, sem cadastro de aluno um a um (E4, E6, W10)
- O professor entra pelo convite, confirma e contesta vínculos, e o pendente não alcança a turma (E10, E12, P2)
- O aluno só vira usuário com a aprovação humana registrada, com a matrícula da lista (E18, R5, A1)
- Dois pedidos no mesmo nome no mesmo segundo: um pendente, nenhum 5xx (C1, C2); 35 alunos do mesmo IP sem
  bloqueio (L1); a rajada de seis turmas passa na régua do login do F1 (K1, K2)
- Cada papel vê só a própria navegação, com a pele da D72 (W2); trocar de escola não leva dado da anterior (W3)
- Isolamento: `apps/api/test/estrutura-isolamento.int.test.ts` e o `arquitetura.test.ts` do F1 continuam verdes
  sem mudar uma linha (I1), e o I3 cobre cada rota nova
- Virada de ano, eliminação e expurgo alcançam as três tabelas novas (V1 a V5)
- Cada cenário de `cenarios.md` tem o seu teste, citado pelo identificador
- Os desvios da seção 11 da Tech Spec estão nos documentos que ela aponta (`docs/infra.md` 3.5,
  `docs/modelo-de-dados.md`), e o `docs/lgpd.md` tem as linhas da A1 batendo com o código
- As pendências de tela sem decisão estão em "Recomendações sem aplicar" das tarefas 11.0, 12.0 e 17.0, com
  destino `/validar`

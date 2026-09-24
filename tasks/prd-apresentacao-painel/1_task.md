# Tarefa 1.0 — Rede e escola pelo painel, com o autor conferido na transação

**Funcionalidade:** apresentacao-painel · **Depende de:** nenhuma · **Paralelo com:** 9.0, 10.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O operador cria rede e escola pelo painel, sem duplicar no clique duplo, e toda escrita do operador
(painel e `ops:*`) confere o autor ativo dentro da própria transação.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 1, 4, 5 ("Autor", "Idempotência"), 6, 7c (linhas "Autor ativo" e "Rede ou escola
  repetida") e 11
- `cenarios.md`: E1–E5, E11, E12, E14, I2, I3, A3
- Regras 00, 10 (itens 7 e 9), 20 (itens 9 e 10), 40 e 80 (item 7)
- `retro.md` da A0, "Pendências para a A0b": as linhas 3.0, 4.0 e 5.0 (`throw new Error`) saem aqui
- Código:
  - `apps/api/src/ops/escola.ts`, `escola.repository.ts`, `escola.repository.test.ts` (a cerca
    `IMPORTADORES_PERMITIDOS_DO_COMANDO`) e `comando.ts` (`conferirOperador`, fora da transação hoje)
  - `apps/api/src/operacao/operador.repository.ts` — `situacaoDoAutor`; o `desativar` começa por
    `for update` na linha do operador
  - `eu.controller.ts` e `packages/shared/src/operacao/eu.ts` — os padrões de rota e de contrato
  - `apps/api/test/arquitetura.test.ts` — C36, C41 e C46 varrem as rotas registradas

## Subtarefas

- [x] 1.1 — `OperadorRepository.autorAtivoNaTransacao(tx, quem)` (7c, linha "Autor ativo"), com a regra
  do bootstrap no comando; os cinco `ops:*` de escola passam a usá-lo dentro da transação (o `uso`, que
  só lê, numa transação curta). O `throw new Error` sem código do repository vira erro tipado
- [x] 1.2 — O formato do apelido fica só em `FORMATO_OPERADOR`, que o contrato de `shared` usa; um
  teste compara a expressão dos checks do banco com a constante
- [x] 1.3 — `criarRede` e `criarEscola` recebem o `id` do pedido, com a gravação da 7c (linha "Rede ou
  escola repetida"); justificativas do `@SemEscopo`: "comando ou painel do operador"; o comando sorteia
  o próprio id
- [x] 1.4 — `painel.service.ts` e `painel.controller.ts` com `GET /redes` (até 200), `POST /redes`,
  `POST /escolas`; contratos estritos em `packages/shared/src/operacao/painel.ts` (`id` UUID v4 ou
  v7). Log `operacao.{rede,escola}.criada`, só com ids
- [x] 1.5 — `IMPORTADORES_PERMITIDOS_DO_COMANDO` ganha `apps/api/src/operacao/painel.service.ts`, e o
  título do teste deixa de dizer "não chegam a controller nenhum"
- [x] 1.6 — Documentos do desvio (seção 11): `docs/arquitetura.md`, módulo `operacao` como o único
  alcance entre escolas, e `docs/modelo-de-dados.md`, "Estrutura institucional": o id de rede e escola
  pode vir do pedido
- [x] 1.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/operacao/operador.repository.ts` | alterado |
| `apps/api/src/operacao/painel.controller.ts`, `painel.service.ts` | novo |
| `apps/api/src/operacao/operacao.module.ts` | alterado |
| `apps/api/src/ops/` (`escola`, `escola.repository` e o teste, `comando`, e os quatro outros `ops:*` de escola) | alterado |
| `packages/shared/src/operacao/painel.ts`, `index.ts` | novo, alterado |
| `apps/api/test/painel-escrita.int.test.ts` | novo |
| `docs/arquitetura.md`, `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E1 | integração | rede com auditoria sem escola, escola com auditoria na escola, autor = apelido da sessão |
| E2 | integração | dois `POST` iguais em paralelo: uma linha, uma auditoria, o mesmo id nas duas respostas |
| E3, E4, E5 | integração | mesmo id com outros dados, e ids diferentes com o mesmo slug em paralelo: `CONFLITO`, nunca 500, nada a mais gravado; rede inexistente: `NAO_ENCONTRADO` |
| E11 (criar escola, e os cinco `ops:*`) | integração | com o `desativar` segurando a linha, a escrita espera o `for share` e responde 401 sem gravar; na outra ordem, entra. Pelo comando, nos cinco `ops:*`: cada um aparece em `pg_stat_activity` esperando o `for share` antes de o `desativar` confirmar; depois, código 2, nada gravado. O gatilho de teste nasce aqui e a E15 o reusa |
| 1.1, 1.2 | unidade | o erro tipado no lugar do `throw new Error`; os checks do banco com a expressão de `FORMATO_OPERADOR` |
| E12 | integração | corpo com `autor`: 400, sem auditoria |
| E14 | integração | 429 com `Retry-After` pelo `rl:op` no `POST /escolas` |
| I2, I3 | arquitetura | a cerca do comando; os dois `@SemEscopo`; as varreduras da A0 com as rotas novas |
| A3 (rede e escola) | integração | log: a linha capturada não leva nome, slug nem e-mail |

## Divergências resolvidas nesta tarefa

- **`on conflict do nothing` sem alvo, e não `on conflict (id)`** (7c, linha "Rede ou escola repetida"). Com o alvo no
  id, dois pedidos iguais ao mesmo tempo podem levantar 23505 no índice do slug: a inserção especulativa só trata como
  conflito o índice do alvo, e espera e falha no outro único. Sem alvo, os dois índices são árbitros, e a leitura pelo
  id, na mesma chamada, decide: o mesmo id com os mesmos dados devolve o id; outros dados, ou nenhuma linha nesse id (o
  slug é de outra escola), `CONFLITO`. O 23505 continua mapeado para `CONFLITO` (no caso de uso da escola e no
  filtro global), como rede de segurança. Provado por E2 (com o segundo pedido parado no índice pelo gatilho), E3 e E4 (em corrida e fora dela).
- **O `GET /v1/operacao/redes` lê do `PainelRepository.redes` já nesta tarefa.** A I2 prende os `@SemEscopo` do
  `RedeEEscolaRepository` a `criarRede` e `criarEscola`, e a seção 6 põe `redes` no `PainelRepository`: ele nasce aqui
  só com `redes`, e a 5.0 acrescenta `escolas` e `uso` e leva a cerca de `painel.repository.test.ts` (só o
  `painel.service.ts` o usa; os métodos são os previstos, cada um com a justificativa do painel) para a I1.
- **A cerca C44 (`arquitetura.test.ts`) aceita o `painel.service.ts` importando o `ops/escola.js`, e só ele.** Ela
  proibia qualquer módulo da API de importar `ops/`, e a seção 1 manda o painel reaproveitar os casos de uso do
  `ops:escola`. A exceção é por arquivo e por comando, com teste de que o painel importando outro comando, ou outro
  arquivo importando o `ops:escola`, continua reprovado.
- **A rota de escrita de rede e escola entra na lista conferida de `ops-escola.int.test.ts`.** O teste "nenhuma rota
  da API cria rede nem escola" passa a dizer "fora das duas do painel", com `POST /v1/operacao/redes` e `/escolas`
  declaradas: são `@RotaDeOperacao`, e C41 e C46 provam que só a sessão de operador as alcança.
- **As leituras que o comando fazia antes da transação vão para dentro dela, depois do autor**: a escola do slug
  (`ops:convite-coordenador`), a do convite (`ops:revogar-convite`) e a do usuário (`ops:redefinir-mfa`). Sem isso o
  `OPERADOR` recusado receberia `NAO_ENCONTRADO` (código 1) antes da conferência, e a C2 da A0 (código 2 em todo
  `ops:*`) quebraria; e "toda escrita começa por `autorAtivoNaTransacao`" (seção 5) não valeria.
- **O caso de uso recebe a conferência do autor, e não o apelido** (`ConferenciaDoAutor`, em
  `operador.repository.ts`): o comando passa `autorDoComando(OPERADOR)`, com a regra do nascimento; o painel,
  `autorDaSessao(operadorId)`, que responde `SESSAO_ENCERRADA`. As bancadas de teste, o ensaio de alertas e a carga
  de login, que não são comando nem painel, passam um autor fixo, sem conferência: os testes que criam operador
  ativo também criam escola por elas.
- **`autorAtivoNaTransacao` é estático e recebe a `TransacaoBanco`**, como a subtarefa escreve (`(tx, quem)`): fora de
  uma transação o `for share` soltaria a linha na hora, e o tipo impede chamar com o banco.
- **O `ops:uso`, que só lê, abre a transação curta**: `UsoRepository` passa a aceitar a transação
  (`Banco | TransacaoBanco`), como os outros repositories.
- **`FORMATO_OPERADOR` mora em `@educa/shared`** (`operacao/eu.ts`), que o contrato do `eu` usa; o `nucleo` a
  reexporta. Os três checks do banco continuam escritos por extenso no schema, porque o drizzle-kit lê o pacote pelo
  `dist`, que pode estar atrás (o `conta-externa.ts` já registra isso); `formato-do-operador.int.test.ts` compara cada
  check do banco migrado com `FORMATO_OPERADOR.source`, e acha check novo sobre `apelido`, `autor` ou
  `autor_operador` que fuja dela. Pelo mesmo motivo do contrato do painel, `FORMATO_SLUG`, `TAMANHO_MAXIMO_SLUG`,
  `TIPOS_DE_REDE` e o esquema do nome digitado (`esquemaNomeDigitado`, antes `esquemaNome` do `comando.ts`) passam a
  morar em `@educa/shared`, reexportados de onde já eram lidos: uma definição só para o banco, o comando e a tela.
- **O comando sorteia UUID v4** (`randomUUID`), que o contrato aceita; antes o id vinha do `uuidv7()` do banco, e o
  teste do `ops:escola` passou a aceitar v4 ou v7.
- **O log `operacao.rede.criada` leva só o `requisicaoId`** do contexto: o logger não tem campo para a rede, e o
  `requisicaoId` é o mesmo da auditoria `rede.criada`, que tem o id. O `operacao.escola.criada` leva o `escolaId`.
  O pedido repetido não loga de novo, como não audita.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --infra`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale
  para o código atual
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Convite, lista, uso e telas (2.0 a 8.0).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 13:59:15 | 2026-09-24 14:02:13 | `test-engineer` | 1 | APROVADO | a887f8c4918c7268a |
| 2026-09-24 14:02:36 | 2026-09-24 14:03:42 | `tenancy-guardian` | 1 | APROVADO | af074107e41da5f77 |
| 2026-09-24 14:02:42 | 2026-09-24 14:03:52 | `privacy-guardian` | 1 | APROVADO | ae1e71e64cdfe645e |
| 2026-09-24 14:02:50 | 2026-09-24 14:03:57 | `infra-guardian` | 1 | APROVADO | a1f1d1f1073ce5040 |
| 2026-09-24 14:02:28 | 2026-09-24 14:05:05 | `revisor-geral` | 1 | APROVADO | ad905e8f21eac616f |

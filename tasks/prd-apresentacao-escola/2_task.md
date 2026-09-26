# Tarefa 2.0 — Lista de nomes da turma: prévia, gravação, avulso, retirada e leitura auditada

**Funcionalidade:** apresentacao-escola · **Depende de:** 1.0 · **Paralelo com:** 3.0, 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A coordenação envia a lista de nomes e matrículas da turma, vê linha a linha o que entra, o que já existe e o que
tem erro, e grava só a lista limpa; acrescenta nome avulso, retira nome livre e lê a lista com auditoria.

## Contexto necessário

- `docs/visao-produto.md`; `docs/lgpd.md`, "Lista de nomes da turma" (já escrita: o código bate com ela)
- `techspec.md` seções 3 (`lista_nome`), 4 (as rotas da lista), 6, 7 (auditoria; "Nome livre sai de fato") e 11
  (regra 00)
- `cenarios.md`: E2, E3 a E7, C8, C9, A1, A2, I3, P1, I9
- Regras 10, 20 (itens 1, 4, 9, 10), 40, 60 (item 6), 80 (itens 3, 7, 8)
- Código:
  - A rota e o mapeamento de FK da 1.0
  - `packages/nucleo/src/db/schema/` (o padrão das FKs compostas com a escola e do `uuidv7()`) e
    `packages/nucleo/drizzle/0015_convite_pendente_unico.sql` (um único parcial escrito à mão)
  - `packages/nucleo/src/db/schema/credencial-matricula.ts` — a matrícula de aluno aprovado, sempre com a escola do
    contexto (E5); `apps/api/test/arquitetura.test.ts` diz quem pode importar o quê
  - `apps/api/src/estrutura/turma.service.ts` — o `turma.alunos_lidos` com finalidade, modelo do `turma.lista_lida`

## Subtarefas

- [x] 2.1 — Migration 0019 e schema: FKs compostas (turma; `usuario_id` sem ação; `criado_por` com `set null
  (criado_por)`), o check `aprovado ⇔ usuario_id ⇔ nome e matrícula nulos`, a matrícula única por escola e ano
  com `trim`, e o índice `(escola_id, ano_letivo_id, turma_id, estado)`
- [x] 2.2 — Leitor do texto (unidade): separadores, cabeçalho, aspas, BOM, linha em branco, `trim`; 200 linhas e
  64 KB, acima disso `ENTRADA_INVALIDA`
- [x] 2.3 — Prévia (`entra`, `ja_existe`, `erro` com código por linha) e gravação (só sem erro, `on conflict do
  nothing`, `lista.gravada` com ids e contagens). Turma excluída no meio: `NAO_ENCONTRADO` (C9)
- [x] 2.4 — Nome avulso (`ENTRADA_INVALIDA` ou `CONFLITO`, nada gravado; também grava `lista.gravada`), retirada
  (`delete` condicional em `livre`, senão `CONFLITO`; `lista_nome.retirado`) e `GET turmas/:id/lista`
  (`nominal_auditado`, com `turma.lista_lida` e a finalidade na transação da leitura)
- [x] 2.5 — Contratos `.strict()` e células da `MATRIZ`
- [x] 2.6 — Documentos: nota em `docs/infra.md` 3.5 (a lista roda na hora, sem fila, porque tem teto; seção 11,
  regra 00); `ListaNome` sai do bloco "Ainda não existe — F2" de `docs/modelo-de-dados.md` e vira a tabela real
- [x] 2.7 — Testes; rotas em `escola-montada.int.test.ts` e `matriz.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo`: `drizzle/0019_lista_nome.sql`, `schema/lista-nome.ts`, `auditoria/acoes.ts` | novo, alterado |
| `apps/api/src/estrutura/lista.*`, `leitor-da-lista.ts`; `packages/shared/src/estrutura/lista.ts` | novo |
| `apps/api/test/lista.int.test.ts`; `escola-montada.int.test.ts`, `matriz*.ts`, os dois `docs/` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E3 | unidade | cada regra do leitor, e o limite de linhas e bytes |
| E4, E5 | integração | erro por linha e nada gravado; a matrícula de outra escola, ou só na `credencial_matricula` de B, entra em A |
| E6 (sem o aprovado) | integração | a mesma lista duas vezes não muda a contagem |
| E7 (sem retirar reivindicado ou aprovado) | integração | avulso e os quatro `CONFLITO`/`ENTRADA_INVALIDA`; retirar livre apaga |
| E2 (esta parte) | integração | turma com nome na lista: `CONFLITO` ao excluir |
| check da `lista_nome` | integração | `insert` aprovado com nome, ou sem `usuario_id`, falha com 23514 |
| A1, A2 (lista) | integração | `lista.gravada` (também no avulso) e `lista_nome.retirado` só com ids; `turma.lista_lida` a cada leitura |
| I3, P1, I9 (lista) | integração, unidade | escola B, professor e aluno, e as células |
| C8, C9 | integração, em paralelo | a mesma lista duas vezes com `Promise.all`; excluir a turma × gravar |
| log novo | integração | só ids: nada de nome, matrícula nem texto da lista (A4) |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O `ja_existe` do aprovado e retirar aprovado (8.0); retirar reivindicado (6.0); a tela e o windows-1252 (13.0); o
`encerrar` (10.0).

## Plano e autoconferência

- **Arquivos**: migration `0019_lista_nome.sql` e `schema/lista-nome.ts`; `acoes.ts` (`lista.gravada`,
  `lista_nome.retirado`, `turma.lista_lida`); `apps/api/src/estrutura/leitor-da-lista.ts`, `lista.repository.ts`,
  `lista.service.ts`, `lista.controller.ts`, e `TurmaRepository.travarContraExclusao`; `packages/shared/src/estrutura/
  lista.ts`; a célula `lista_nome` da `MATRIZ`; `lista.int.test.ts`, `leitor-da-lista.test.ts`, `lista.test.ts` (shared);
  as cinco rotas em `escola-montada.int.test.ts`; `docs/infra.md` 3.5 e `docs/modelo-de-dados.md`.
- **O segundo dado que torna a cláusula observável**: duas turmas (T1 e T2) em toda busca por turma; duas escolas (E5,
  I3); dois anos da mesma escola (o encerrado, pelo `encerrar` da API); nome livre e reivindicado (o reivindicado posto no
  banco até a 6.0); a turma com um nome fora da lista no C8, para a busca pelas matrículas da conferência.
- **Checagem anterior que responde antes**: a finalidade vem antes da turma (A2 prova com a turma de B e o id sorteado);
  o erro do texto vem antes da turma na gravação (a `ENTRADA_INVALIDA` do E4 é a do texto; sem ela, a mesma gravação sai
  `CONFLITO`); o C9 com a exclusão aberta chega ao `for key share` (a espera é conferida por `esperarNaTrava`).
- **Peça que já existe**: `esquemaNomeDigitado` (nome de uma linha, até 200) e o tamanho da matrícula do login;
  `FINALIDADES_DA_LEITURA_DE_ALUNOS`; `idDoCaminho`, `lerEntrada`, `paginar`; `excluirSemReferencia` (o 23503 da
  exclusão); `TurmaRepository.aberta` para as leituras; `GatilhoDeParada` e `esperarNaTrava` nos testes de corrida.
- **Tenancy**: escola e ano do contexto em toda consulta; a turma conferida no ano em curso antes de cada escrita, e a FK
  composta como segunda camada; o `ano_letivo_id` é por escola, então nas buscas pela lista a escola é segunda camada do
  ano, e nas buscas pela turma, as duas o são (a turma é UUID global). Provado pelo I3 com escola e ano tirados juntos.
- **Privacy**: DTO estrito; nome e matrícula nunca em log (A4 nas duas suítes, com o 23505 do avulso); auditoria só com
  ids e contagens; a leitura da coordenação com finalidade e registro na mesma transação; o nome livre sai de fato (seção
  7 da Tech Spec) e a autoria fica na auditoria; `docs/lgpd.md` já tinha a linha e bate com o código.

## Divergências resolvidas nesta tarefa

- **Os códigos da gravação com erro.** A Tech Spec dizia só "grava só sem erro". O erro que o texto sozinho mostra (sem
  nome, sem matrícula, formato, repetida no texto) responde `ENTRADA_INVALIDA`, antes de procurar a turma; a matrícula
  em uso, que depende do que está gravado, `CONFLITO`, como no avulso. Os seis códigos de linha
  (`ERROS_DA_LINHA_DA_LISTA`) são novos. Anotado na seção 4 da `techspec.md`, com teste no E4.
- **Regras do leitor que a spec não fixava** (E3): o separador vem da primeira linha que **tem** um (o título sem
  separador vira linha com erro, e não desmonta a lista); o cabeçalho dá a ordem das colunas; texto sem linha de aluno é
  `ENTRADA_INVALIDA`; nome e matrícula com as regras do avulso (uma linha, sem controle, 200 e 40), por `errosDasLinhas`.
  O BOM sai pelo `trim`, que o conta como espaço. Anotado no E3 do `cenarios.md` e na seção 4 da `techspec.md`.
- **A turma travada em `for key share`** na gravação e no avulso (`TurmaRepository.travarContraExclusao`), e não só a FK
  mapeada: sem a trava, a turma apagada entre a conferência e o `insert` dá 23503 no `insert`, que sairia 500. É o mesmo
  lock que a FK pega; o renomear não espera. Carga: um `select` por índice primário, por escrita da coordenação. Anotado
  no C9 do `cenarios.md` e na seção 4 da `techspec.md`, com os dois arranjos do C9.
- **A gravação que perde a matrícula para outra turma ao mesmo tempo** volta atrás com `CONFLITO`: depois do `insert`
  com `on conflict do nothing`, o que não entrou precisa estar na lista **desta** turma (`quantasNaTurma`); senão, a
  segunda gravação diria `jaExistentes` de um nome que está em outra turma. Regra nova, com teste de corrida parada no
  gatilho. Anotado no C8 do `cenarios.md` e na seção 4 da `techspec.md`.
- **O avulso confere a lista pelo índice único** (23505 → `CONFLITO` pelo filtro global), e não por uma busca antes: a
  busca seria uma segunda cópia da mesma regra, sem teste que a derrubasse sozinha. A `credencial_matricula` é buscada,
  porque o aprovado sai da lista sem matrícula.
- **A leitura** reaproveita `FINALIDADES_DA_LEITURA_DE_ALUNOS` e é paginada por id (até 100, regra 80, item 8). Só a
  coordenação a alcança, e a finalidade é exigida sempre.
- **A `MATRIZ`** ganhou o recurso `lista_nome` com `ler` (`nominal_auditado`), `previa`, `gravar`, `acrescentar` e
  `retirar` (`unidade`), só da coordenação.
- **Auditoria**: `lista.gravada` na turma, com `ids` (o nome `listaNomeIds` bate na palavra proibida `nome` da
  auditoria), `gravados` e `jaExistentes`; `lista_nome.retirado` com `antes: { turmaId, estado: 'livre' }`. Anotado na
  seção 7 da `techspec.md`.
- **`criado_por` com `SET NULL ("criado_por")` escrito à mão na 0019**: o `set null` do drizzle-kit anularia a escola.
- **Até a 8.0, a matrícula de aluno aprovado nesta turma sai `matricula_em_uso`**, e não `ja_existe` (8.4). E a corrida
  entre o avulso e a aprovação da mesma matrícula fica anotada em "Herdado da 2.0" do `8_task.md`.
- `apps/api/test/sessao-de-teste.ts` apaga a `lista_nome` das escolas da bancada antes da turma.

## Mutações

Cada cláusula apagada ou trocada, rodada e restaurada, sobre `lista.int.test.ts` e `escola-montada.int.test.ts` (as de
banco, direto no Postgres de teste, desfeitas depois), e sobre os testes de unidade do leitor e do contrato.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `lista.service.ts:42` (outra turma → `matricula_em_uso`) | E4 prévia |
| `lista.service.ts:42` (`credencial_matricula` → `matricula_em_uso`) | E4 prévia |
| `lista.service.ts:47` (o erro do texto vence o do banco) | E4 prévia |
| `lista.service.ts:41` (a mesma turma sai `ja_existe`, e não erro) | E6; A1 da lista |
| `lista.service.ts:70` (turma da prévia) | I3 e A3 da prévia; A4; E5 ano encerrado |
| `lista.service.ts:91` (erro do texto → `ENTRADA_INVALIDA`) | E4; log da lista |
| `lista.service.ts:93` e `:116` (turma travada da gravação e do avulso) | I3, A3 das duas rotas; A4; C9 (exclusão aberta); E5 ano encerrado |
| `lista.service.ts:96` (matrícula em uso → `CONFLITO`) | E4; A3 da gravação; A4 |
| `lista.service.ts:101` (o que não entrou está nesta turma) | duas turmas ao mesmo tempo |
| `lista.service.ts:102` (`jaExistentes` pelas linhas do texto) | E6; A1 da lista |
| `lista.service.ts:103`, `:120`, `:136`, `:151` (as quatro gravações de auditoria) | A1 da varredura de cada rota; A1 e A2 da lista |
| `lista.service.ts:118` (credencial no avulso) | E7 avulso |
| `lista.service.ts:135` (existe → `CONFLITO`, senão `NAO_ENCONTRADO`; trocado pelos dois fixos) | E7 retirada; I3, A3 do `DELETE`; A4; E5 |
| `lista.ts` de `packages/shared` (finalidade obrigatória na consulta; antes, `lista.service.ts`, exigida e movida para depois da turma) | A2 |
| `lista.service.ts:149` (turma da leitura) | I3, A3 da leitura; A4; E5 |
| `lista.repository.ts:39` (ano na busca pela lista) | E5 ano encerrado |
| `lista.repository.ts:39` (escola na busca pela lista) | nenhum, sozinha: o ano é da escola (segunda camada); escola e ano juntos: E5 |
| `lista.repository.ts:52` (escola na `credencial_matricula`) | E5 |
| `lista.repository.ts:68` e `:97` (`criado_por`) | E6; E7 avulso |
| `lista.repository.ts:69` (`on conflict do nothing`) | C8 |
| `lista.repository.ts:83` (turma em `quantasNaTurma`) | duas turmas ao mesmo tempo |
| `lista.repository.ts:84` (matrículas em `quantasNaTurma`) | C8 (com o nome fora da lista) |
| `lista.repository.ts:81-82` (escola e ano em `quantasNaTurma`) | nenhum: a turma é UUID global (segunda camada) |
| `lista.repository.ts:111` (`livre` no `delete`) | E7 retirada (o reivindicado e o aprovado); A3 do `DELETE`; A4 |
| `lista.repository.ts:111` (ano no `delete`) | E5 ano encerrado |
| `lista.repository.ts:111` (escola no `delete`) | nenhum, sozinha (segunda camada); escola e ano juntos: I3 do `DELETE`, E5 |
| `lista.repository.ts:121` (ano em `existe`; escola e ano juntos) | E5 ano encerrado; I3 do `DELETE` |
| `lista.repository.ts:137`, `:138`, a ordem (turma, página e `asc` na leitura) | leitura paginada |
| `lista.repository.ts:135-136` (escola e ano na leitura) | nenhum: a turma, conferida antes, é a primeira camada |
| `turma.repository.ts:58` (`for key share`) | C9 com a exclusão aberta (500) |
| `turma.repository.ts:57` (ano; escola e ano juntos) | E5 ano encerrado; I3 da gravação e do avulso |
| `lista.controller.ts:27`, `:56` (`@HttpCode`) | I3, P1, A1, A3 da prévia e do `DELETE`; A4; E4, E5, E7, E2 |
| `lista.controller.ts:29`, `:58` (`idDoCaminho`) | I3 (id fora do formato) |
| `lista.controller.ts:26`, `:34`, `:41`, `:48`, `:55` (`@Permite` trocado por célula do professor; rodadas a da gravação e a da leitura, as outras três são a mesma varredura P1) | P1 de cada rota |
| `matriz.ts` (professor `lista_nome.gravar` aberto) | P1 da gravação; I9; a comparação com a expectativa |
| `lista.ts` de `packages/shared` (`.strict()` do texto, do avulso e da consulta) | A3 das três rotas de corpo; A4; A2 (campo a mais na consulta) |
| `lista.ts` (regras do nome e da matrícula do avulso: `trim`, controle) | E7 avulso; E4 (unidade) |
| `lista.ts` (`refine` de `erro` só com o resultado `erro`) | `lista.test.ts` |
| `leitor-da-lista.ts:93` (64 KB, e em bytes) | E3 64 KB |
| `leitor-da-lista.ts:94` (`\r` e `\r\n`) | E3 numeração |
| `leitor-da-lista.ts:96-98` (separador da primeira linha que tem um; o laço que para nela) | E3 título sem separador; E3 200 linhas e outros (o laço sem parada) |
| `leitor-da-lista.ts:19` (ordem dos separadores, as duas trocas) | E3 ordem |
| `leitor-da-lista.ts:30` (sem separador, um campo só) | E3 `;` entre aspas |
| `leitor-da-lista.ts:38`, `:41`, `:42` (aspa dobrada, aspa que fecha, aspa só no início do campo) | E3 aspas; E3 `trim` |
| `leitor-da-lista.ts:61`, `:72` (cabeçalho sem acento e sem caixa; nome e matrícula em colunas diferentes) | E3 cabeçalho; E3 200 linhas |
| `leitor-da-lista.ts:101` (`trim` dos campos) | E3 aspas, `trim`, vazio |
| `leitor-da-lista.ts:102` (linha em branco ou só separadores) | E3 linha em branco, 200 linhas, vazio |
| `leitor-da-lista.ts:104`, `:106` (cabeçalho ignorado; colunas dele) | E3 200 linhas, cabeçalho |
| `leitor-da-lista.ts:105` (vazio; acima de 200) | E3 vazio; E3 201 linhas |
| `leitor-da-lista.ts:107` (campo que falta vira vazio) | E3 campo a mais e a menos, aspas, cabeçalho |
| `leitor-da-lista.ts:118`–`:121`, `:126` (cada erro da linha; repetida com `> 1`) | E4 (unidade) |
| 0019: `lista_nome_aprovado_sem_nome` | o check da `lista_nome` |
| 0019: o único da matrícula global, sem o ano, e sem ele | E5 (as duas); C8, duas turmas, A3 do avulso, log; sem ele, também o clique duplo do avulso |
| 0019: `criado_por` sem ação, e com `set null` inteiro | quem gravou vira nulo |
| 0019: a FK da turma | E2 (lista); C9 |
| 0019: os checks de estado e de formato, e a FK do usuário | o check da `lista_nome` (casos de estado, formato e usuário de outra escola) |
| 0019: `lista_nome_turma_idx` e o único `(escola_id, id)` | nenhum: índice de leitura e alvo da FK da 6.0, sem efeito observável |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `test-engineer`, 1ª | Clique duplo no avulso e na retirada; homônimos na prévia e na gravação; retirar aprovado; título com vírgula; `@Permite` das cinco rotas na tabela | Aplicadas antes da 2ª rodada; o título com vírgula também anotado em "Herdado da 2.0" do `13_task.md` |
| `test-engineer`, 2ª | As duas linhas novas na tabela de Mutações | Aplicada (mutação do índice rodada contra o clique duplo) |
| `test-engineer`, 2ª | Homônimos: as mesmas linhas na prévia e na gravação, e o nome conferido no banco | Aplicada no lote final, com as recomendações dos outros revisores |
| `revisor-geral`, 1ª | Finalidade obrigatória no contrato; o ternário aninhado da classificação numa função; a busca do separador parando na primeira linha | Aplicadas |
| `revisor-geral`, 1ª | Cabeçalho com sinônimo (`Nome;RA`); matrícula igual com nome diferente na prévia | "Herdado da 2.0" do `13_task.md`: decisão de tela |
| `privacy-guardian`, 1ª | "Quem gravou" por extenso na linha da lista em `docs/lgpd.md` | Aplicada; o `criado_por` do vínculo fica para quem mexer nele (a linha do vínculo não é desta tarefa) |
| `privacy-guardian`, 1ª | A prévia sem auditoria | Anotado na seção 7 da `techspec.md` por que não audita |
| `privacy-guardian`, 1ª | `Cache-Control: no-store` nas respostas nominais; `turma.lista_lida` só com a quantidade | `/retro` da A1: valem também para `GET /turmas/:id/alunos` e `turma.alunos_lidos`, que são o precedente |
| `privacy-guardian`, 1ª | `nome;CPF` colado grava o CPF como matrícula | "Herdado da 2.0" do `13_task.md` |
| `privacy-guardian`, 1ª | O `encerrar` ainda deixa os nomes livres no ano fechado | Tarefa 10.0 (10.1 e 10.3), já planejada; aceitável só com dado sintético |
| `tenancy-guardian`, 1ª | A escola como segunda camada sem teste próprio, quando a primeira também vem do token | `/retro` da A1 |
| `test-engineer`, 3ª | `esquemaConsultaListaDaTurma.safeParse({})` também na unidade; `resultado: 'entra'` em cada homônimo | Recusadas: já provadas. O A2 derruba o `.optional()` (a mutação rodou vermelha), e `entram: 2`, `jaExistem: 0`, `comErro: 0` nas duas linhas da prévia só acontece com as duas `entra` |
| `revisor-geral`, 2ª | Largura de uma linha do docblock de `errosDasLinhas` | Recusada: só estética, dentro do limite do lint; vai com a próxima tarefa que mexer no leitor (13.0) |
| `test-engineer`, 1ª | Provar que a auditoria cai junto com a operação, injetando falha entre a escrita e o registro | `/retro` da A1: segue o precedente do `turma.alunos_lidos`, e vale para toda auditoria do repositório, não só a lista |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-26 14:35:53 | 2026-09-26 14:38:25 | `test-engineer` | 1 | APROVADO | ac221858c83952c56 |
| 2026-09-26 14:48:02 | 2026-09-26 14:48:33 | `test-engineer` | 2 | APROVADO | a0f2a36c43f86b471 |
| 2026-09-26 14:49:03 | 2026-09-26 14:49:58 | `tenancy-guardian` | 1 | APROVADO | a9d358d0d02b32379 |
| 2026-09-26 14:48:57 | 2026-09-26 14:50:53 | `revisor-geral` | 1 | APROVADO | a14c3941d07446b34 |
| 2026-09-26 14:49:10 | 2026-09-26 14:51:12 | `privacy-guardian` | 1 | APROVADO | a1775e902633bc4d9 |
| 2026-09-26 15:02:01 | 2026-09-26 15:02:37 | `test-engineer` | 3 | APROVADO | a08c6e9794fe144d8 |
| 2026-09-26 15:02:51 | 2026-09-26 15:03:13 | `revisor-geral` | 2 | APROVADO | aec119715f3ff86b3 |
| 2026-09-26 15:02:56 | 2026-09-26 15:03:13 | `tenancy-guardian` | 2 | APROVADO | a2f649f4329a014fa |
| 2026-09-26 15:03:01 | 2026-09-26 15:03:26 | `privacy-guardian` | 2 | APROVADO | ad0302c9a80ad148a |

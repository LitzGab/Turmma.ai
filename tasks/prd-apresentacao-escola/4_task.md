# Tarefa 4.0 — Professor gera e revoga o acesso da turma, com link e código

**Funcionalidade:** apresentacao-escola · **Depende de:** 1.0 · **Paralelo com:** 2.0, 3.0, 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O professor com vínculo confirmado gera link e código da turma (1, 7 ou 30 dias), que aparecem uma vez; "Gerar
novo" derruba o anterior, também o de outro professor; a turma só sai sem acesso vigente.

## Contexto necessário

- `docs/visao-produto.md`; `docs/lgpd.md`, linha "Acesso da turma"
- `techspec.md` seções 3 (`acesso_turma`, o código, a trava da linha da turma), 4 (acesso), 6, 7 (auditoria, DTO)
  e 7c ("Corridas": o savepoint)
- `cenarios.md`: os ids da tabela abaixo; `revisao-spec.md`, rodada 5 (C11)
- Regras 10, 20 (itens 4, 8), 40, 80 (item 7)
- Código:
  - `TurmaRepository.aberta` — o `turma_vinculada` pelo `exists` do vínculo confirmado
  - `apps/api/src/sessao/hash-do-token.ts` (`hashDoToken`); `packages/nucleo/src/limite/chaves.ts` (a chave HMAC dos
    contadores, de que a do código difere)
  - `apps/api/src/config.ts`, `.env.example`, `infra/teste.env` — onde entra `SALA_CHAVE_CODIGO`
  - `apps/api/test/gatilho-de-parada.ts` — a pausa e a espera por quem está em `wait_event_type = 'Lock'`

## Subtarefas

- [x] 4.1 — Migration 0020 e schema: FK composta à turma com `on delete cascade`; `criado_por` com `set null
  (criado_por)`; `token_hash` único; turma e `codigo_hmac` únicos por escola entre os não revogados; `validade_dias`
  em 1, 7 ou 30
- [x] 4.2 — O código: 8 caracteres do alfabeto de 31, exibido em dois grupos de 4; normalização da entrada
  (espaço, hífen, minúscula) em `packages/shared`, porque a página pública (17.0) usa a mesma; HMAC com a chave
  própria; sorteio injetável para o C6
- [x] 4.3 — Gerar, numa transação: `for share` da turma, revoga o vigente, grava; colisão do código sorteia de novo
  num savepoint, e três seguidas dão 503 `INDISPONIVEL_TENTE_DE_NOVO`; o 23505 do único por turma vira `CONFLITO`;
  a turma que sumiu, `NAO_ENCONTRADO`. Responde link e código uma vez, `no-store`. Auditoria
  `acesso_turma.gerado`, sem token nem código
- [x] 4.4 — `POST turmas/:id/acesso/revogar` (`acesso_turma.revogado`) e `GET turmas/:id/acesso` (só `expiraEm`)
- [x] 4.5 — Excluir turma: `select … for update` da turma como comando próprio, depois o `delete` com `not exists`
  de acesso vigente (`CONFLITO`); o revogado sai pela cascata
  - Pendência da 1.0 (`revisor-geral`, 1ª rodada): o `renomear` da turma (`TurmaService.renomear`) não trava o ano com
    `travarAnoEmCurso()`, e o `criar` trava. Decidir aqui uma política só de trava para as escritas em turma (renomear,
    excluir, gerar acesso) e registrar a escolha, com teste se ela mudar o código
- [x] 4.6 — Módulo `apps/api/src/sala`, contratos `.strict()`, células da `MATRIZ` (professor `turma_vinculada`)
- [x] 4.7 — Documento: `AcessoTurma` real em `docs/modelo-de-dados.md`
- [x] 4.8 — Testes; rotas em `escola-montada.int.test.ts` e `matriz.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo`: `drizzle/0020_acesso_turma.sql`, `schema/acesso-turma.ts`, `auditoria/acoes.ts` | novo, alterado |
| `apps/api/src/sala/` (acesso, código, módulo); `packages/shared/src/sala/acesso.ts` | novo |
| `turma.repository.ts`, `config.ts`, `.env.example`, `infra/teste.env`, `matriz*.ts`, `docs/modelo-de-dados.md` | alterado |
| `apps/api/test/acesso-da-turma.int.test.ts`; `escola-montada.int.test.ts` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E13, E14 | integração | `expira_em` por validade; 0, 2 e 31 recusados; o anterior cai na hora, também o de outro professor |
| E15 | unidade | alfabeto, exibição, normalização, e o HMAC diferente do dos contadores |
| E12 (acesso), P2 | integração | vínculo pendente, contestado ou encerrado, coordenação, aluno, outra turma: 404; duas disciplinas, uma confirmada, alcança |
| E2 (esta parte) | integração | turma com acesso vigente: `CONFLITO`; com o acesso revogado, sai levando-o |
| A1, A5 | integração | `acesso_turma.gerado` e `.revogado`; token e código nunca em claro no banco nem na auditoria |
| I3, I9 (acesso) | integração, unidade | escola B; células |
| C5, C6 | integração, em paralelo | dois gerar com `Promise.all`: um vigente, o outro `CONFLITO`; colisão com savepoint, e 503 na terceira |
| C11 | integração, em paralelo | pausa no gerar depois do `insert`; e pausa no excluir, com o gerar recebendo `NAO_ENCONTRADO`, não 5xx. Cada pausa solta quando o `pg_stat_activity` mostra a outra esperando trava |
| log novo | integração | só ids: nada de token nem código (A4) |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

A rota pública (5.0); o contador por nome (7.0); o `ops:revogar-acessos-sala` (9.0); o `encerrar` e o expurgo
(10.0); a tela e o WhatsApp (15.0).

## Plano e autoconferência

- **Arquivos**: migration `0020_acesso_turma.sql` e `schema/acesso-turma.ts`; `acesso_turma.gerado` e `.revogado` em
  `acoes.ts`; `packages/shared/src/sala/acesso.ts` (alfabeto, normalização, exibição, contratos) e o recurso
  `acesso_turma` da `MATRIZ`; `apps/api/src/sala/` (`configuracao-da-sala.ts`, `codigo-da-sala.ts`,
  `acesso-da-turma.{repository,service,controller}.ts`, `sala.module.ts`); `TurmaRepository.travarComVinculoDoProfessor`,
  `travarParaExcluir` e o `not exists` do acesso vigente no `excluir`; `SALA_CHAVE_CODIGO` em `config.ts`,
  `.env.example` e `infra/compose.yml`; `docs/modelo-de-dados.md`.
- **Peças que já existiam**: o token é o `hashDoToken` e o `BYTES_DO_TOKEN_DE_CONVITE` de `sessao/hash-do-token.ts`
  (como o `operacao/token-do-convite.ts`); o vínculo confirmado é o `#comVinculoDoProfessor` de `TurmaRepository.aberta`;
  a trava do ano é o `travarAnoEmCurso` do criar turma; `idDoCaminho` e `lerEntrada` de `estrutura/entrada.ts`; o 23503
  continua só em `exclusao.ts`; a pausa é o `GatilhoDeParada` e o `esperarNaTrava`.
- **O segundo dado que torna cada cláusula observável**: acesso vigente em **outra** turma da escola (o filtro da turma no
  repository e na exclusão); vencido **e** revogado (as duas metades de "vigente"); **dois** professores confirmados
  (E14, C5); o professor em **cada** estado de vínculo e com **duas** disciplinas (P2); três gerar seguidos (o `isNull`
  do revogar os anteriores: o já revogado não entra de novo em `substituidos`).
- **Checagem que responde antes**: no E2 e no C11, a FK do vínculo barraria o excluir sozinha (todo acesso nasce de um
  vínculo confirmado); os testes tiram o vínculo pelo banco, e o E2 continua provando, à parte, que a turma com vínculo
  segue `CONFLITO`. No P2, o 404 de quem não alcança é comparado com o do id sorteado, e o acesso vigente existe antes
  (sem ele, o revogar daria 404 por não haver o que revogar).
- **Em paralelo**: C5 (dois gerar, com e sem acesso antes), C11 (dois arranjos) e o encerrar × gerar, cada um com a pausa
  e soltando só quando o `pg_stat_activity` mostra o outro na trava.
- **Guardiões**: `tenancy-guardian` — escola e ano do contexto em todo repository, o vínculo confirmado pelo `exists`, a
  escola e o ano como segunda camada (turma é UUID global), I3 das três rotas; `privacy-guardian` — token e código só na
  resposta do gerar, com `no-store`; o banco guarda SHA-256 e HMAC com chave própria; a auditoria sem token, código nem
  hash (A5); nada loga; `criado_por` com `set null`.

## Divergências resolvidas nesta tarefa

- **A resposta do gerar traz o token, e não o link montado**: `{ token, codigo, expiraEm }`. A web monta
  `/e/<slug>/turma#<token>` com o slug de `/v1/eu`, como já monta `/convite#<token>` com o token do convite; a API não
  precisa ler o slug nem saber o endereço da web. O código vai sem espaço, e a tela o mostra com `exibirCodigoDaTurma`.
  Anotado na seção 4 da `techspec.md`.
- **O GET sem acesso vigente responde `{ expiraEm: null }`**, e não 404: a tela precisa separar "Sem acesso ativo" (W4)
  da turma inexistente. **Revogar sem acesso vigente é `NAO_ENCONTRADO`**, como revogar o convite já revogado (3.0). Na
  seção 4 da `techspec.md`.
- **O corpo do gerar exige a validade** (`{ validadeDias: 1 | 7 | 30 }`): o 7 é o padrão da tela, não da API.
- **"Gerar novo" revoga todo acesso não revogado da turma, também o vencido**: o índice de um por turma olha só o
  `revogado_em`, e o vencido não revogado barraria o novo. Provado no E13 (vencido).
- **A auditoria do "Gerar novo"** é um `acesso_turma.gerado` só, com os ids derrubados em `substituidos`, e não um
  `acesso_turma.revogado` por anterior: o `.revogado` fica para o revogar explícito (e, na 9.0, para o comando da
  operação). Na seção 7 da `techspec.md`.
- **Colisão × turma tomada, sem ler o nome da restrição**: depois de um 23505 no savepoint, se a turma tem acesso não
  revogado (que só pode ser de outro gerar, já confirmado), `CONFLITO`; senão, foi o código, e sorteia de novo.
- **4.5 — a política de trava das escritas em turma** (pendência da 1.0): trava o ano em `FOR SHARE` a escrita que faz
  nascer no ano algo que o encerramento precisa desligar ou fechar (criar turma, gerar acesso; na 6.0 e na 8.0, o pedido e
  a aprovação); a que só troca o nome ou tira a linha não trava o ano, e trava a linha da turma. Por isso o **gerar trava
  o ano** (regra nova, com teste: o encerrar parado faz o gerar sair `NAO_ENCONTRADO`), e o **renomear fica como está**:
  renomear durante o encerramento só troca o nome da turma que está sendo encerrada, sem dano. A gravação e o avulso da
  lista (2.0) fazem nascer linha no ano e ainda não travam o ano: fica para a 10.0, com o C10 (anotado no
  `10_task.md`). Quem roda a cada chamada: o professor, por clique, uma leitura por índice primário a mais no ano; nada é
  gravado por ela. Na seção 7c da `techspec.md` e no C11 do `cenarios.md`.
- **O teste tira o vínculo pelo banco no E2 e no C11**: o gerar exige o vínculo confirmado, e a FK do vínculo barra o
  excluir antes de qualquer trava. Sem isso, as duas travas não seriam observáveis. No C11 e no E2 do `cenarios.md`.
- **`SALA_CHAVE_CODIGO` não repete nenhuma chave do ambiente** (toda variável com `_CHAVE_`), e não só a dos contadores.
  Ela entra em `.env.example` e no `infra/compose.yml` (a API do compose não sobe sem ela); o `infra/teste.env` só
  sobrepõe portas e herda o valor do `.env.example`, então não muda.
- **O E15 do HMAC** é provado em duas camadas: na unidade, com as chaves do `.env.example`; na integração (A5), o
  `codigo_hmac` gravado é o HMAC com a chave da sala da configuração de teste, e difere do HMAC com a chave dos
  contadores (a mutação que liga o módulo à chave dos contadores fica vermelha).
- **O C9 da 2.0 (`lista.int.test.ts`) espera o excluir no `for update`**, e não mais no `delete`: com a trava própria
  da 4.5, é no `select … for update` que o excluir para atrás do `for key share` da gravação. O resultado provado não
  muda (a lista grava, o excluir sai `CONFLITO`); só o padrão da espera.
- **O sorteio injetável** entra pela montagem (`OpcoesDeMontagem.sortearCodigoDaSala`), como o prazo do Redis do login: o
  `main.ts` monta sem opção.

## Mutações

Cada cláusula foi apagada ou trocada, o teste rodou vermelho, e o arquivo voltou.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `turma.repository.ts:74` (`for('share')` do `travarComVinculoDoProfessor`) | C11, pausa no excluir (o gerar sai 500 pela FK) |
| `turma.repository.ts:73` (`#comVinculoDoProfessor` no `travarComVinculoDoProfessor`) | P2 (os dois testes) |
| `turma.repository.ts:73` (ano em curso) | P2 "a turma de um ano encerrado" (o gerar passa da trava e esbarra na FK composta: 500) |
| `turma.repository.ts:73` (escola) | nenhum, sozinha: segunda camada (a turma é UUID global, e o ano do contexto é da escola) |
| `turma.repository.ts:89` (`for('update')` do `travarParaExcluir`) | C11, pausa no gerar (o excluir sai 204 e a cascata leva o acesso entregue) |
| `turma.repository.ts:141` (`not exists` do acesso vigente) | E2 "com acesso vigente: CONFLITO" |
| `turma.repository.ts:135` (`isNull(revogado_em)` no `not exists`) | E2 revogado e vencido |
| `turma.repository.ts:136` (`expira_em > now()` no `not exists`) | E2 vencido |
| `turma.repository.ts:134` (a turma no `not exists`) | E2 "o acesso vigente de outra turma não barra a vazia" |
| `turma.service.ts:89` (travada nada → `NAO_ENCONTRADO`) | E2 inexistente; I3, A3 e A4 do `DELETE /v1/turmas/:id` |
| `turma.service.ts:90` (não apagada → `CONFLITO`) | E2 "com acesso vigente" e "outra turma" |
| `acesso-da-turma.repository.ts:25` (a turma no `#daTurma`) | E13 "o acesso é da turma"; C6 (os dois) |
| `acesso-da-turma.repository.ts:25` (escola e ano) | nenhum, sozinha: segunda camada (turma global, já conferida pela `TurmaRepository`) |
| `acesso-da-turma.repository.ts:37` (`isNull` do revogar os não revogados) | E13 "Gerar novo" (o revogado entra de novo em `substituidos`); "o revogar parado… o novo nasce sem substituir ninguém" |
| `acesso-da-turma.repository.ts:57` (`expira_em` pela validade) | E13 "1, 7 e 30 dias" |
| `acesso-da-turma.repository.ts:58` (`criado_por`) | E14; A1 e A5 |
| `acesso-da-turma.repository.ts:70` (`isNull` do `temNaoRevogado`) | C6 "três colisões" (sai `CONFLITO`, não 503) |
| `acesso-da-turma.repository.ts:80` (`isNull` e `expira_em` do revogar) | E13 "sem acesso vigente" (cada metade sozinha); A1; o `isNull`, também o clique duplo em revogar e "o Gerar novo parado… o revogar sai NAO_ENCONTRADO" |
| `acesso-da-turma.repository.ts:90` (`isNull` e `expira_em` do GET) | E13 "1, 7 e 30" e "sem acesso vigente" (cada metade sozinha) |
| `acesso-da-turma.service.ts:52` (`travarAnoEmCurso` no gerar) | 4.5 "encerramento no meio" |
| `acesso-da-turma.service.ts:53` (travada nada → `NAO_ENCONTRADO`) | P2 (os dois) |
| `acesso-da-turma.service.ts:55` (revogar os anteriores) | E13 "1, 7 e 30" e "Gerar novo" (o novo sai `CONFLITO`) |
| `acesso-da-turma.service.ts:62` (o savepoint) | C6 (os dois: a transação abortada dá 500) |
| `acesso-da-turma.service.ts:64` (só o 23505 segue) | C6 (os dois) |
| `acesso-da-turma.service.ts:65` (turma tomada → `CONFLITO`) | C5 (com e sem acesso: sai 503 no lugar do 409) |
| `acesso-da-turma.service.ts:18` (`SORTEIOS_DO_CODIGO` 3 → 2 e 3 → 4) | C6 "três colisões" |
| `acesso-da-turma.service.ts:72` (503 com `Retry-After`) | C6 "três colisões" |
| `acesso-da-turma.service.ts:69` (`acesso_turma.gerado`) | E13 "Gerar novo"; A1 |
| `acesso-da-turma.service.ts:84` (`aberta` no revogar) | P2 (o professor sem vínculo revogaria) |
| `acesso-da-turma.service.ts:86` (sem vigente → `NAO_ENCONTRADO`) | E13 "sem acesso vigente"; "o acesso é da turma" |
| `acesso-da-turma.service.ts:87` (`acesso_turma.revogado`) | A1 |
| `acesso-da-turma.service.ts:93` (`aberta` no GET) | P2 (os dois) |
| `acesso-da-turma.controller.ts:19` e `:27` (`no-store`) | E13 "no-store" (cada um) |
| `acesso-da-turma.controller.ts:37` (contrato do revogar) | A3 do `POST /v1/turmas/:id/acesso/revogar` (400 do campo a mais) |
| `acesso-da-turma.controller.ts:21` (`idDoCaminho`) | I3 do `POST /v1/turmas/:id/acesso` (id fora do formato) |
| `acesso-da-turma.controller.ts:18` (`@Permite('acesso_turma', 'gerar')` trocado por `turma.ler`) | nenhum, sozinha: o `exists` do vínculo confirmado responde o mesmo 404 à coordenação; a célula é provada no I9 |
| `app.module.ts:69` (o `SalaModule` com a chave dos contadores) | A5 |
| `configuracao-da-sala.ts:30` (chave repetida) e `:16`/`:19` (32 caracteres: 31 recusa, 32 sobe) | `config.test.ts` |
| `codigo-da-sala.ts:27` (HMAC sem normalizar) e `:14` (sorteio sem a última letra) | `codigo-da-sala.test.ts` |
| `packages/shared/src/sala/acesso.ts:21` (alfabeto com `O`), `:33` (sem hífen; sem maiúscula), `:43` (sem grupos), `:11` (validade com 2) | `acesso.test.ts` |
| `matriz.ts` (professor `acesso_turma.gerar` em `unidade`) | I9; a comparação com a expectativa |
| `0020`: `acesso_turma_um_por_turma` (índice apagado no banco de teste) | C5 (os dois) |
| `0020`: `acesso_turma_codigo_na_escola_unico` (apagado) | C6 (os dois) |
| `0020`: FK da turma sem `on delete cascade` | E2 revogado e vencido |
| `acoes.ts` (`validadeDias` do `acesso_turma.gerado` de volta a `z.number()`) | `acoes.test.ts` "acesso_turma.gerado aceita só a validade de 1, 7 ou 30" |
| `0020`: FK do autor com `no action` no lugar de `set null (criado_por)` | "quem gerou vira nulo quando é eliminado" |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `test-engineer`, 1ª | As três: a turma de ano encerrado com vínculo confirmado (P2), o revogar em paralelo (clique duplo e contra o "Gerar novo") e o status em "o 400 e os 404" | Aplicadas antes da 2ª rodada; a justificativa da linha 73 na tabela de Mutações corrigida. O revogar × "Gerar novo" sem pausa, reprovado na 2ª rodada (três ordens válidas), virou dois testes com a ordem forçada pelo gatilho |
| `test-engineer`, 3ª | O último `gerado` por filtro, e não `at(-1)`; o padrão da espera mais estreito | Aplicadas: filtro por `acao`, e a espera por `update "acesso_turma"` nos dois testes do revogar em paralelo |
| `tenancy-guardian`, 1ª | Na 5.0, a busca pelo código presa à escola do slug e a do token com a escola vinda da linha | Anotadas no `5_task.md` ("Notas da 4.0") |
| `privacy-guardian`, 1ª | Teste do `set null` do `criado_por` na eliminação | Aplicada ("quem gerou vira nulo…"), com a mutação da FK na tabela |
| `privacy-guardian`, 1ª | Revogar no encerramento e expurgo de 30 dias ainda não existem | Já são a 10.1 e a 10.4 (`10_task.md`); a 10.0 não fecha sem elas |
| `privacy-guardian`, 1ª | `validadeDias` da auditoria preso a 1, 7 e 30 | Aplicada: `z.literal(VALIDADES_DO_ACESSO_DIAS)` em `acoes.ts` |
| `revisor-geral`, 1ª | O E13 do `cenarios.md` com o `null` do GET, o `NAO_ENCONTRADO` do revogar, o vencido e o `substituidos` | Aplicada |
| `revisor-geral`, 1ª | Token da sala sem depender do contrato do painel | Aplicada: `esquemaTokenDeLink` em `packages/shared/src/sessao/token.ts`, usado pelo painel e pela sala |
| `revisor-geral`, 1ª | `VALIDADE_PADRAO_DO_ACESSO_DIAS` sem uso | Aplicada: sai; o padrão entra com a tela (15.0) |
| `revisor-geral`, 1ª | `hashDoTokenDaSala` como segundo nome do `hashDoToken` | Aplicada: o service e o teste usam o `hashDoToken` |
| `revisor-geral`, 1ª | Tamanho mínimo da chave da sala preso ao do login | Aplicada: `TAMANHO_MINIMO_CHAVE_DA_SALA` próprio |
| `test-engineer`, 4ª | Linhas da tabela de Mutações; o piso de 32 da chave no ponto exato; o literal da validade na auditoria; token negativo no contrato da sala | Aplicadas |
| `revisor-geral`, 2ª | O token do convite de professor pelo `esquemaTokenDeLink`; o `FORMATO_DO_REFRESH` repetido | `TODO.md` ("Processo e dívida"): é o contrato do convite de professor (3.0) e o da sessão, fora do escopo desta tarefa; destino a 14.0 ou correção própria |
| `revisor-geral`, 2ª | `codigo-da-sala.test.ts` conferir o token por `esquemaTokenDeLink` | Recusada: o teste prova o que o sorteio produz (256 bits em base64url) pelo formato, sem depender do contrato; amarrado ao esquema, uma mudança dos dois juntos passaria calada. O contrato tem os próprios casos negativos em `acesso.test.ts` e `painel.test.ts` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-26 16:06:02 | 2026-09-26 16:09:05 | `test-engineer` | 1 | APROVADO | a2027800a9fa16aa0 |
| 2026-09-26 16:10:25 | 2026-09-26 16:11:32 | `test-engineer` | 2 | REPROVADO | aeb8a67aceb060d95 |
| 2026-09-26 16:40:03 | 2026-09-26 16:41:01 | `test-engineer` | 3 | APROVADO | aaaba473fdf37186e |
| 2026-09-26 16:50:26 | 2026-09-26 16:51:33 | `tenancy-guardian` | 1 | APROVADO | a9bb6f56d790b6587 |
| 2026-09-26 16:50:33 | 2026-09-26 16:52:22 | `privacy-guardian` | 1 | APROVADO | aeb8e4674ec066032 |
| 2026-09-26 16:50:20 | 2026-09-26 17:09:00 | `revisor-geral` | 1 | APROVADO | a03a4652ffc5679e7 |
| 2026-09-26 17:11:04 | 2026-09-26 17:12:15 | `test-engineer` | 4 | APROVADO | a611de0b1cbba03bb |
| 2026-09-26 17:40:12 | 2026-09-26 17:40:40 | `test-engineer` | 5 | APROVADO | a0aed411e4567f59b |
| 2026-09-26 17:50:39 | 2026-09-26 17:51:01 | `tenancy-guardian` | 2 | APROVADO | abe192006bf3833c7 |
| 2026-09-26 17:50:45 | 2026-09-26 17:51:13 | `privacy-guardian` | 2 | APROVADO | a941331a24652aa28 |
| 2026-09-26 17:50:34 | 2026-09-26 18:11:02 | `revisor-geral` | 2 | APROVADO | af97f8b705ebf86c5 |

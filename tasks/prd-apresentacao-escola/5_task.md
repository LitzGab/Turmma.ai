# Tarefa 5.0 — Aluno abre a turma pelo link ou pelo código

**Funcionalidade:** apresentacao-escola · **Depende de:** 4.0 · **Paralelo com:** 3.0, 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Sem login, com o slug da escola e o token do link ou o código, o aluno vê o nome da turma e os nomes livres dela, sem
matrícula; tudo que não é um acesso vigente da escola do slug, no ano em curso, responde o mesmo `NAO_ENCONTRADO`.

## Contexto necessário

- `docs/visao-produto.md`; `docs/lgpd.md`, linhas "Lista de nomes da turma" e a do IP (`salas/*` no `rl:ip`)
- `techspec.md` seções 4 (`salas/abrir` e "Uma resposta só"), 6 (o `AcessoDaSala`), 7 ("Registro de acesso",
  DTO) e 7c (`rl:ip`)
- `cenarios.md`: I1, I2, E17, E26, E28, V2, e a parte de `salas/abrir` de I4, R1, P5, L10, A6, A7
- Regras 10 (item 9), 20 (itens 4, 6), 40, 80 (item 1)
- Código:
  - `apps/api/src/sessao/resolucao-de-tenant.repository.ts` e o teste da lista fechada
    (`resolucao-de-tenant.repository.test.ts`) — o formato do `@SemEscopo` com a justificativa
  - `apps/api/test/arquitetura.test.ts` — o I1 passa **sem mudar uma linha**
  - `apps/api/src/sessao/acesso-publico.repository.ts` e `acesso-da-escola.controller.ts` — a rota pública de
    `/e/:slug`, que já abre o contexto pelo slug
  - `packages/nucleo/src/limite/rota-anonima.decorator.ts` e `apps/api/test/limite.int.test.ts`
    (`LIMITE_REQ_IP_ANONIMO_MIN`)
  - `apps/api/src/sessao/registro-de-acesso.repository.ts` — que o `sala` não chama (A6)

## Notas da 4.0 (`tenancy-guardian`, 1ª rodada)

- O `codigo_hmac` é único só dentro da escola, e a chave é a mesma para todas: o mesmo código em duas escolas dá o mesmo
  HMAC. A busca pelo código (`acessoDaSalaPorCodigo`) precisa estar presa à escola do slug, com um I3/I4 que tenha o mesmo
  código vigente em duas escolas.
- A busca pelo `token_hash` não tem escola (o link não diz a escola): a escola, o ano e a turma que o `sala` recebe vêm da
  linha achada, nunca do cliente, e o slug é conferido contra a escola da linha.

## Subtarefas

- [x] 5.1 — `acessoDaSalaPorToken` e `acessoDaSalaPorCodigo` na `ResolucaoDeTenantRepository`, com `@SemEscopo` ("o
  link e o código da sala não dizem a escola"): só acesso não revogado, com `expira_em > now()`, ano `em_curso`, e
  a escola igual à do slug (o código é buscado já com a escola do slug; o token, conferido contra ela)
- [x] 5.2 — `AcessoDaSala` em `apps/api/src/sessao`, exportado para o `sala`, devolvendo só escola, ano e turma
- [x] 5.3 — `POST salas/abrir` com `@RotaAnonima`: contrato `.strict()` `{ slug, token | codigo }`,
  `Cache-Control: no-store`, nenhum cookie lido, nenhum `registro_acesso`; responde o nome da turma e os nomes
  livres com `id` e `nome`, lidos a cada abertura
- [x] 5.4 — Documento: a tabela de `@SemEscopo` de `docs/modelo-de-dados.md` ganha os dois métodos, com a
  justificativa e o motivo de ficarem em `sessao`
- [x] 5.5 — Testes; a rota entra na varredura do A3 e do A4 em `escola-montada.int.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/resolucao-de-tenant.repository.ts`, `resolucao-de-tenant.repository.test.ts` | alterado |
| `apps/api/src/sessao/acesso-da-sala.ts`, `sessao.module.ts` | novo, alterado |
| `apps/api/src/sala/salas.controller.ts`, `salas.service.ts`, `lista-livre.repository.ts`, `sala.module.ts` | novo, alterado |
| `packages/shared/src/sala/salas.ts` | novo |
| `apps/api/test/salas-abrir.int.test.ts`, `escola-montada.int.test.ts` | novo, alterado |
| `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| I1 | arquitetura | o teste do F1 passa sem mudar: só `sessao` importa a resolução, e o `sala` só o `AcessoDaSala` |
| I2 | unidade | a lista fechada ganha exatamente os dois métodos, com a justificativa |
| I4, R1 (abrir) | integração | código e token de B com o slug de A; inexistente, vencido, revogado, de ano encerrado, de turma excluída, de outra escola, slug inexistente: corpo byte a byte igual |
| E17, E26 | integração | só nomes livres, `id` e `nome`, sem matrícula; o avulso aparece no link vigente |
| E28, V2 | integração | relógio além do `expira_em`; ano posto em `encerrado` sem revogar: `NAO_ENCONTRADO` |
| P5 (abrir) | integração | `escolaId`, `turmaId` ou campo a mais: 400, sem gravar |
| L10 (abrir) | integração | acima do `rl:ip` anônimo, 429 `LIMITE_EXCEDIDO` com `Retry-After` |
| A6, A7 (abrir) | integração | nenhum `registro_acesso`; `Cache-Control: no-store` |
| concorrência | — | não se aplica: a rota só lê |
| log novo | integração | só ids: nada de slug, token, código nem nome (A4) |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Reivindicar (6.0); o contador de código errado por escola e a espera de 1 s (7.0); a página pública (17.0); o
`rl:ip:sala` próprio, que fica para o F2 (Tech Spec, 7c).

## Plano e autoconferência

- **Arquivos**: `acessoDaSalaPorToken` e `acessoDaSalaPorCodigo` (e o `#acessoDaSala` privado que os dois usam) na
  `ResolucaoDeTenantRepository`, com a lista fechada do I2; `apps/api/src/sessao/acesso-da-sala.ts` (o `AcessoDaSala`,
  provido e exportado pelo `SessaoModule`, global); `naEscolaSemUsuario` ganha o ano; `apps/api/src/sala/`
  (`lista-livre.repository.ts`, `salas.service.ts`, `salas.controller.ts`, `sala.module.ts`);
  `packages/shared/src/sala/salas.ts` (contrato e teto); `docs/modelo-de-dados.md`; `techspec.md`, seções 4 e 6.
- **Peças que já existiam**: `hashDoToken` (`sessao/hash-do-token.ts`) e `hmacDoCodigoDaTurma` (`sala/codigo-da-sala.ts`,
  que já normaliza o código como a página); `naEscolaSemUsuario` para abrir o contexto sem usuário (ganhou o ano, em vez de
  outra função igual); `lerEntrada` de `estrutura/entrada.ts`; o `no-store` do erro já vem do filtro global; os tamanhos
  do slug (`TAMANHO_MAXIMO_SLUG_NO_LOGIN`) e do token (`TAMANHO_MAXIMO_TOKEN_DE_CONVITE`); no teste, `montarEscolaComTurma`,
  `ipSorteado`, o `sortearCodigoDaSala` da montagem (C6) e a varredura de `escola-montada.int.test.ts`.
- **O segundo dado que torna cada cláusula observável**: duas escolas (B com o slug de A); o **mesmo código** vigente em A
  e B (a escola do slug na busca pelo código); acesso da **outra turma** da mesma escola, com um nome livre dela (a turma
  no `nomesLivres` e no `nomeDaTurma`); nome `reivindicado` e `aprovado` na turma (o filtro `livre`); o ano do acesso
  encerrado **com outro ano em curso** na mesma escola (a situação e o id do ano no join, cada um sozinho); nomes gravados
  fora da ordem de nome (o `orderBy`); 501 nomes livres (o teto).
- **Checagem que responde antes**: cada caso do R1 abre com 200 **antes** de virar o caso (vencer, revogar, encerrar,
  excluir), e o acesso de A com o slug de A abre depois da lista de casos; no L10, o 429 vem depois de cinco 200 do mesmo
  acesso; a turma excluída confere que a cascata levou a linha.
- **Em paralelo**: não se aplica, a rota só lê.
- **Guardiões**: `tenancy-guardian` — escola, ano e turma saem da linha achada, nunca do cliente (o contrato recusa
  `escolaId`/`turmaId`, P5); a escola do slug na busca pelo código e conferida no mesmo comando na do token (I4); os dois
  `@SemEscopo` ficam em `sessao` e só o `AcessoDaSala` sai (I1, I2); o `sala` lê com o escopo do contexto aberto com a
  escola e o ano da linha; todas as recusas com o mesmo corpo (R1). `privacy-guardian` — DTO estrito sem matrícula, sem
  reivindicado nem aprovado, sem id de escola, ano ou turma (E17, A3); nada novo em log (A4); nenhum `registro_acesso` nem
  cookie (A6); `no-store` no sucesso e no erro (A7); nenhum campo pessoal novo (a linha "Lista de nomes da turma" e a do IP
  em `docs/lgpd.md` já dizem que os nomes livres aparecem a quem tem o link ou o código vigente, e que `salas/*` contam no
  `rl:ip`). `infra-guardian` — anônima no `rl:ip` (L10), sem limite só por IP novo; duas leituras por índice (o `token_hash`
  único, e o `(escola_id, codigo_hmac)` pelo slug único) e a lista pelo índice `(escola_id, ano_letivo_id, turma_id,
  estado)`, com teto; nada guardado em memória; nada gravado por requisição anônima.

## Divergências resolvidas nesta tarefa

- **Teto de 500 nomes livres na resposta** (`MAXIMO_DE_NOMES_NA_SALA`, em ordem de nome). A spec não pedia paginação nem
  teto; a rota é anônima e a lista de uma turma não tem teto (a coordenação sobe 200 linhas por envio, quantas vezes
  quiser), então uma abertura seria uma leitura sem teto (regra 80, itens 3 e 8). Uma turma de verdade tem dezenas de
  nomes, e paginar a página do aluno não faz sentido. Provado por teste (501 nomes, ficam os 500 primeiros pela ordem de
  nome). Na seção 4 da `techspec.md` e em `docs/modelo-de-dados.md`.
- **A resposta** é `{ turma: { nome }, nomes: [{ id, nome }] }`, em ordem de nome, com status 200. Na seção 4 da
  `techspec.md`.
- **O contrato limita só o tamanho** do slug (63), do token (128) e do código (32), e não o formato: o token ou o código
  fora do formato (a página que colou o link cortado, o código com `O` no lugar de `0`) respondem `NAO_ENCONTRADO`, como o
  inexistente, e a página mostra o texto do caminho que usou (W9). Na seção 4 da `techspec.md`.
- **Os dois métodos recebem o slug** e o juntam à escola da linha no mesmo comando (`inner join escola on escola.id =
  acesso.escola_id and escola.slug = $slug`), em vez de receber a escola já achada: uma ida ao banco a cada abertura, e o
  slug nunca vira id na mão de quem chama. O `sala` calcula o SHA-256 do token e o HMAC do código (a chave do código é
  dele), e o `AcessoDaSala` recebe só o slug e um dos dois. Na seção 6 da `techspec.md`.
- **O teto e o formato entraram no `cenarios.md`**: o E17 ganhou o teto de 500 em ordem de nome, e o R1 de `salas/abrir`,
  o token fora do formato, o código fora do alfabeto e o slug fora do formato (`revisor-geral`, 1ª rodada).
- **O `AcessoDaSala` roda o resto no contexto** (`naSala(entrada, funcao)`), e não só devolve os ids: a função recebe a
  escola, o ano e a turma, e os repositories do `sala` leem escola e ano do contexto, como os outros. Para isso
  `naEscolaSemUsuario` passou a receber `{ escolaId, anoLetivoId? }`. Na seção 6 da `techspec.md`.

## Mutações

Cada cláusula foi apagada ou trocada, o teste rodou vermelho, e o arquivo voltou.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `resolucao-de-tenant.repository.ts:512` (`escola.slug = slug` no join) | I4 (os dois), R1 (outra escola), A6 |
| `resolucao-de-tenant.repository.ts:512` (`escola.id = acesso.escola_id` no join) | I4 (os dois), R1, A6 |
| `resolucao-de-tenant.repository.ts:513` (`situacao = 'em_curso'`) | R1 / V2 (de ano encerrado) |
| `resolucao-de-tenant.repository.ts:513` (`ano_letivo.id = acesso.ano_letivo_id`) | R1 / V2 (o outro ano em curso da escola abriria) |
| `resolucao-de-tenant.repository.ts:513` (`ano_letivo.escola_id`) | nenhum, sozinha: segunda camada (o id do ano é UUID global) |
| `resolucao-de-tenant.repository.ts:514` (`revogado_em is null`) | R1 (revogado) |
| `resolucao-de-tenant.repository.ts:514` (`expira_em > now()`) | R1 / E28 (vencido) |
| `acesso-da-sala.ts:33` (o ano no contexto) e `escola-sem-usuario.ts:12` (o ano no contexto) | todos os de abertura com 200 (o `exigirAnoEmCurso` recusa) |
| `acesso-da-sala.ts:32` (`sala === undefined` → `NAO_ENCONTRADO`) | não compila sem ele (`sala.escolaId` de `undefined`) |
| `lista-livre.repository.ts:41` (`estado = 'livre'`) | E17 (reivindicado e aprovado) |
| `lista-livre.repository.ts:41` (a turma no `nomesLivres`) | E17 (o nome da outra turma) |
| `lista-livre.repository.ts:41` (escola e ano no `nomesLivres`) | nenhum, sozinhas: segunda camada (a turma é UUID global, da linha do acesso) |
| `lista-livre.repository.ts:43` (`orderBy` do nome) | E17, teto |
| `lista-livre.repository.ts:44` (`limit` do teto) | teto |
| `lista-livre.repository.ts:27` (a turma no `nomeDaTurma`) | E17 (a outra turma abriria como "2ºB") |
| `lista-livre.repository.ts:27` (escola e ano no `nomeDaTurma`) | nenhum, sozinhas: segunda camada (a turma é UUID global, da linha do acesso) |
| `salas.ts:32` (`min(1)` do token) | P5 (token vazio) e `salas.test.ts` |
| `salas.service.ts:32` (turma que sumiu → `NAO_ENCONTRADO`) | "a turma que some entre achar o acesso e ler o nome dela" |
| `salas.controller.ts:13` (`@RotaAnonima`, trocado por `@Permite`) | L10, A6 (401); tirado sem trocar, a API não sobe (a conferência das permissões) |
| `salas.controller.ts:20` (`Cache-Control: no-store`) | A7 |
| `salas.controller.ts:19` (`@HttpCode(200)`) | todos os de abertura |
| `salas.ts:32` e `:33` (`strictObject` do token e do código) | P5 |
| `salas.ts:23`, `:32`, `:33` (o `max` do slug, do token e do código) | P5 (slug, token e código longos) |
| `sessao.module.ts` (`AcessoDaSala` nos `exports`) | a API não sobe (o `SalaModule` não resolve a dependência) |
| `acesso-da-sala.ts` (acrescentado: `new Logger('sala').log(\`sala.abrir.${entrada.tokenHash}\`)` no ramo do token) | A4 (o SHA-256 do token do link, sentinela nova) |
| `acesso-da-sala.ts` (acrescentado: `new Logger('sala').log(\`sala.abrir.${entrada.codigoHmac}\`)` no ramo do código) | nenhum: o HMAC sai em base64url, com maiúsculas, e o `LoggerDoNest` troca a mensagem fora do formato de evento por `[mensagem omitida]`; o A4 procura o HMAC dos dois códigos (vigente e `semAcesso`) mesmo assim, como segunda camada |
| `salas.service.ts` (acrescentado: o token do link em log, pelo `Logger` do Nest, como texto e como `Error`) | nenhum: o `LoggerDoNest` troca a mensagem que não é evento fixo por `[mensagem omitida]` e o logger resume o `Error` sem a mensagem, então o token cru não chega à linha; o A4 procura mesmo assim o token e o código do sucesso e do 404 (`semAcesso`), pelo link e pelo código |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| — | — | as cinco recomendações do `test-engineer` (1ª rodada) foram aplicadas: a linha do `nomeDaTurma` nas Mutações, o `token: ''` em `salas.test.ts`, os dois nomes iguais e o nome retirado em `salas-abrir.int.test.ts`, e a linha que diz que o teste da turma que some é simulação |
| `test-engineer`, 2ª | o HMAC do código nas sentinelas do A4; o `pedir` anônimo pelo `chamar` | aplicadas: `chamar` aceita token `undefined` (`api-com-sessao.ts`), e o A4 procura o HMAC dos dois códigos |
| `test-engineer`, 2ª | teste próprio da proteção do `LoggerDoNest` | recusada nesta tarefa: fora do escopo (é do `nucleo`); fica para o `/retro` da A1 conferir se já existe |
| `revisor-geral` e `tenancy-guardian`, 1ª | `naEscolaSemUsuario` com objeto `{ escolaId, anoLetivoId? }` no primeiro argumento | aplicada, com as quatro chamadas, em três arquivos de `sessao` (`matricula.service.ts`, `acesso-da-escola.service.ts` e as duas de `externa.service.ts`) |
| `revisor-geral`, 2ª | o ternário do `naEscolaSemUsuario` repete `requisicaoId` e `escolaId` | aplicada: o ano entra por espalhamento condicional |
| `revisor-geral`, 1ª | `SalaResolvida` é só outro nome de `AcessoDaSalaAchado` | aplicada: o apelido saiu |
| `revisor-geral`, 1ª | `NomeLivre.nome` tipado `string \| null` | recusada: a coluna `lista_nome.nome` é anulável no esquema (o `aprovado` fica sem nome), o tipo segue o do Drizzle, e o `esquemaRespostaSalaAberta.parse` recusa nome nulo antes de responder |
| `infra-guardian` e `privacy-guardian`, 1ª | adivinhação de código só com o `rl:ip` até a 7.0: nenhum ambiente exposto nem dado real sem a 7.0 | `TODO.md` (portão do staging e do piloto); a 7.0 já traz o contador por escola e a espera de 1 s |
| `infra-guardian`, 1ª | o `rl:ip:sala` próprio, para rede com várias escolas atrás do mesmo IP | `TODO.md`, com o gatilho; a Tech Spec (7c) já o põe no F2 |
| `infra-guardian`, 1ª | carga de `salas/abrir` | tarefa 9.0 (K1 e K2 passam pela rota) |
| `infra-guardian`, 1ª | nome da turma no mesmo comando dos nomes livres (três idas ao banco) | recusada: ganho pequeno, três leituras por índice; a lista pelo índice e o nome pela chave ficam mais simples separados, e a turma que some entre as duas já tem resposta |
| `privacy-guardian`, 2ª | a mesma asserção prende o `anoLetivoId` de `naEscolaSemUsuario` a `acesso-da-sala.ts` | `TODO.md`, no mesmo item |
| `privacy-guardian`, 1ª | prender o uso do `AcessoDaSala` ao `sala` no teste de arquitetura | `TODO.md`: o I1 desta tarefa exige o `arquitetura.test.ts` sem mudar uma linha; a asserção entra na próxima tarefa que tocar o teste de arquitetura |
| `privacy-guardian`, 1ª | o `sala` importa também `sessao/hash-do-token.ts` | recusada: função pura, sem dado nem banco, que o `operacao` e o `sala` (4.0) já importam; o I1 barra só a `ResolucaoDeTenantRepository`, e passa sem mudar |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-26 19:13:17 | 2026-09-26 19:15:16 | `test-engineer` | 1 | REPROVADO | a5e6089a126dcf449 |
| 2026-09-26 20:06:46 | 2026-09-26 20:07:34 | `test-engineer` | 2 | APROVADO | a2e115b5c0c2d4d0b |
| 2026-09-26 20:07:43 | 2026-09-26 20:08:47 | `revisor-geral` | 1 | REPROVADO | ad317d42f1fcd2156 |
| 2026-09-26 20:07:56 | 2026-09-26 20:08:55 | `infra-guardian` | 1 | APROVADO | ac9bb858475256477 |
| 2026-09-26 20:07:48 | 2026-09-26 20:08:58 | `tenancy-guardian` | 1 | APROVADO | ac7365c9f8d911c4e |
| 2026-09-26 20:07:52 | 2026-09-26 20:09:01 | `privacy-guardian` | 1 | APROVADO | a0bfb9d9ee2fa6efd |
| 2026-09-26 20:20:20 | 2026-09-26 20:20:59 | `test-engineer` | 3 | APROVADO | a7193e228c4627f74 |
| 2026-09-26 20:21:19 | 2026-09-26 20:21:43 | `revisor-geral` | 2 | APROVADO | a2399970219194c93 |
| 2026-09-26 20:21:27 | 2026-09-26 20:21:56 | `tenancy-guardian` | 2 | APROVADO | aedbfa3e0fcd6a903 |
| 2026-09-26 20:21:36 | 2026-09-26 20:22:06 | `privacy-guardian` | 2 | APROVADO | a9eb426661c4a6512 |
| 2026-09-26 20:21:45 | 2026-09-26 20:22:07 | `infra-guardian` | 2 | APROVADO | aa687bb41eb02fded |
| 2026-09-26 20:31:26 | 2026-09-26 20:31:43 | `test-engineer` | 4 | APROVADO | aea8e5fa0cf772f88 |
| 2026-09-26 20:31:52 | 2026-09-26 20:32:06 | `revisor-geral` | 3 | APROVADO | a14e77a4b0f650578 |
| 2026-09-26 20:31:59 | 2026-09-26 20:32:09 | `tenancy-guardian` | 3 | APROVADO | a56044cf57874f65e |
| 2026-09-26 20:32:07 | 2026-09-26 20:32:20 | `privacy-guardian` | 3 | APROVADO | aefe31c14495bad4f |
| 2026-09-26 20:32:13 | 2026-09-26 20:32:23 | `infra-guardian` | 3 | APROVADO | adf95c18878961bff |

# Tarefa 7.0 — Limites da sala: por escola, por nome e por turma, com as métricas

**Funcionalidade:** apresentacao-escola · **Depende de:** 6.0 · **Paralelo com:** 11.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `tenancy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Código errado demais numa escola só atrasa, sem trancar o código certo; matrícula errada demais num nome trava só
aquele nome até o "Gerar novo"; hash demais sem pedido numa turma só rebaixa a prioridade; e 35 alunos do mesmo IP
nunca recebem 429.

## Contexto necessário

- `docs/lgpd.md`, linha "Contadores da sala"; `docs/infra.md` 3.1 e 5.3
- `techspec.md` seções 5 (passo 5, "Quem conta") e 7c (a tabela de limites, métricas, falhas) e 11 (regra 80)
- `cenarios.md`: os ids da tabela abaixo
- `revisao-spec.md`, rodada 5: o L2 com o campo `escolaId`, o log uma linha por escola e janela
- Regras 20 (item 9), 40, 80 (itens 1, 3, 4, 10)
- Código:
  - `apps/api/src/sessao/senha/contador-em-janela.ts`; `limite-email-ip.ts` e `rebaixamento.ts` mostram
    `limiteDoSeguro`, o seguro em memória e `LIMITE_INSTANCIAS_API`; `semaforo-de-hash.ts`, a prioridade
  - `packages/nucleo/src/limite/chaves.ts` (chaves HMAC) e `telemetria/metricas.ts` (`METRICAS_COM_ESCOLA` é fechada)
  - `apps/api/test/arquitetura.test.ts` — o que o `sala` pode importar de `sessao`

## Subtarefas

- [x] 7.1 — `ContadorEmJanela` com a janela por parâmetro (10 min na sala); o login continua com 60 s
- [x] 7.2 — Escola (código errado, 1.000): acima do teto, 1 s de espera **antes** da busca do acesso, fora de
  transação e sem conexão do pool; o código certo entra
- [x] 7.3 — Nome (`acesso_turma`, `listaNomeId`, 5): só matrícula errada em nome ainda `livre`, lido depois da volta
  atrás com escola, ano e turma do acesso; acima, `LIMITE_EXCEDIDO` com `Retry-After` a esse nome
- [x] 7.4 — Turma (hash sem pedido, 150): acima, o hash vai rebaixado; nunca recusa
- [x] 7.5 — O reenvio não conta; o `insert` do pedido lê `teve_matricula_errada` do contador do nome
- [x] 7.6 — Métricas `sala.reivindicacao{resultado}` e `sala.limite_atingido{tipo}`, sem rótulo de escola; log
  `sala.limite_atingido` uma linha por escola e janela, com `escolaId`
- [x] 7.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sala/limites-da-sala.ts`; `reivindicacao.service.ts`, `salas.service.ts` | novo, alterado |
| `contador-em-janela.ts` e teste; `chaves.ts`, `metricas.ts` e os testes deles | alterado |
| `apps/api/test/limites-da-sala.int.test.ts`; `salas-reivindicar.int.test.ts` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| I10 | integração | sete tentativas em nome de T2, de B e aleatório: 21 respostas idênticas, nenhuma chave de nome criada; em T1, a 6ª trava |
| L1, L2 | integração | 35 do mesmo IP sem 429; 100 códigos errados abaixo do teto: o certo abre sem espera, nenhum cookie lido |
| L3 | integração | 1.000 errados: o certo abre depois de 1 s; B do mesmo IP sem espera; pool mínimo, outra rota sem esperar conexão |
| L4, L4b | integração | a 6ª trava o nome, também com a matrícula certa; o código Y destrava os 35 |
| L5, L6, L6b | integração | o 151º rebaixado pelo espião do semáforo; a tabela de quem conta, lida no Redis; o nome tomado 200 vezes não trava logins |
| L7, L8 | integração, unidade | Redis fora: o teto dividido por `LIMITE_INSTANCIAS_API`; janela de 10 min e 60 s no login |
| C1, C2, E21 (contadores) | integração, em paralelo | o perdedor soma só na turma; os reenvios não somam |
| E30 (gravação) | integração | duas erradas e a certa: `teveMatriculaErrada: true`; de primeira, `false`; depois de "Gerar novo", o contador antigo não marca |
| `Retry-After` no nome | integração | o `LIMITE_EXCEDIDO` do nome traz o cabeçalho |
| métrica sem escola | unidade | nenhuma das duas métricas novas aceita o rótulo de escola |
| log novo | integração | `sala.limite_atingido`: uma linha por escola e janela, com `escolaId`; nada de IP, código, matrícula nem nome (A4) |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Alerta, comando e carga (9.0); anular o `teve_matricula_errada` (8.0); os textos (17.0); `rl:ip:sala` e bloqueio
de IP (F2 e staging).

## Plano e autoconferência

- **Arquivos**: `apps/api/src/sala/limites-da-sala.ts` (novo: os três contadores, a espera, o `LIMITE_EXCEDIDO`, o
  rebaixamento, a métrica e o log), `reivindicacao.service.ts` (limites antes do hash, contagem depois da volta atrás,
  `teveMatriculaErrada`, `sala.reivindicacao{resultado}`), `reivindicacao.repository.ts` (a marca vem do serviço),
  `lista-livre.repository.ts` (`livreComOutraMatricula`), `salas.service.ts` e `sala.module.ts` (a guarda e o contador da
  sala); `apps/api/src/sessao/acesso-da-sala.ts` (`GuardaDoCodigo`), `resolucao-de-tenant.repository.ts` (o `acessoId`),
  `senha/contador-em-janela.ts` (janela por parâmetro, `restanteMs`); `app.module.ts` e `main.ts` (o logger JSON e o seguro
  da sala em `limite.seguro_ativo`); `packages/nucleo` (`METRICAS`, o `segundosParaTentarDeNovo` exportado);
  `tools/testes/metricas.ts` e o painel `infra/grafana/paineis/fundacao.json` (o `painel.test.ts` exige painel para toda
  métrica). Testes: `apps/api/test/limites-da-sala.int.test.ts` e `sala-de-teste.ts` (novos), `salas-reivindicar.int.test.ts`,
  `limites-da-sala.test.ts`, `contador-em-janela.test.ts` (novos), `contador-em-janela.int.test.ts`,
  `reivindicacao.service.test.ts`, `metricas.test.ts`.
- **Peças que já existiam**: `ContadorEmJanela` (o mesmo script, o mesmo seguro, a mesma chave de HMAC do login),
  `limiteDoSeguro` e `segundosParaTentarDeNovo` de `chaves.ts`, `escolaPorSlug` (o `@SemEscopo` do login por matrícula),
  `baldeDaEscola(escolaId, rebaixado)` e a fila rebaixada do `SemaforoDeHash` (15.0), o `ErroDeDominio` com `Retry-After`,
  o `observarSeguroDoLimite` com várias fontes; no teste, a montagem da 6.0 (agora em `sala-de-teste.ts` para o arquivo
  novo), `aguardar`, `MedidorDeTeste`, `subirApi` com `linhasDeLog`.
- **O segundo dado que torna cada cláusula observável**: duas escolas no mesmo IP (a escola na chave da escola: L3); duas
  turmas e uma escola B (a turma na leitura do nome livre: I10); dois acessos da mesma turma, X e Y (o acesso na chave do
  nome: L4b, E30); 35 nomes na turma (o nome na chave do nome: L4); o nome livre com a matrícula certa pela chave de T1
  (a matrícula na leitura: L6); duas instâncias no seguro (`limiteDoSeguro`: L7); dois tipos e duas escolas no log (a
  marca por escola e tipo: teste de unidade do log); o link e o slug inexistente (só o código errado conta: L6).
- **Checagem que responde antes**: no I10 e no L6, cada recusa rodou o hash (a soma na turma prova que chegou à
  transação); no L4, o nome travado não roda o hash; no L3, o código certo abre (200 com os nomes), então a espera veio do
  teto e não do 404; no L5, cada pedido chegou ao semáforo (o espião tem 151 baldes).
- **Em paralelo**: C1, C2 (a), (b), (c) com os contadores; o reenvio em paralelo de uma matrícula errada (L6); as 50
  aberturas na espera (L3); os lotes do L1, L4 e L4b.
- **Guardiões**: `infra-guardian` — nada por IP (L1, L2); a espera fora de transação e sem conexão (L3 com o pool de 1);
  contadores no Redis de fila, com o seguro dividido pelas instâncias (L7) e na `limite.seguro_ativo`; o rebaixamento
  nunca recusa (L5, L6b com 30 logins entrando); a matrícula errada soma no nome antes do hash, atômica, e as tentativas
  em paralelo não passam do teto juntas (L4 em paralelo); o custo novo por pedido anônimo pelo código é uma leitura da escola pelo
  slug (índice único) e um `GET` no Redis; na reivindicação, uma leitura do nome pela chave primária e dois `GET` (ou um
  `INCR`); o pedido segurado soma mais um `INCR` (a marca do log); nenhuma gravação no banco. `privacy-guardian` — chaves só com HMAC (escola, turma, acesso e linha, tipo e escola), 10 min; o log só com o
  tipo e o `escolaId`, sem IP, código, slug, matrícula nem nome (L3); a métrica sem escola; `docs/lgpd.md` com a marca do
  log; a marca do pedido é só sim ou não. `tenancy-guardian` — escola, ano e turma continuam da linha do acesso; a escola
  do código é a do slug, e o acesso é buscado dentro dela; a leitura do nome livre lê escola e ano do contexto e a turma do
  acesso (I10); o nome de outra turma ou escola nunca trava nem se revela.

## Divergências resolvidas nesta tarefa

- **A escola do código vem do slug, numa consulta antes da busca do acesso.** O contador é por escola, e o código errado
  não acha escola nenhuma; o `AcessoDaSala.naSala` passou a receber a `GuardaDoCodigo`, lê a escola pelo `escolaPorSlug`
  (que já existia, com `@SemEscopo`), roda a espera e depois a busca; sem acesso, conta o código errado. O slug inexistente
  responde `NAO_ENCONTRADO` sem contar (não há escola onde contar, e o slug é público). O link não passa pela guarda: o
  token tem 256 bits. Custo: uma leitura por índice único a mais por pedido pelo código. Na seção 6 da `techspec.md`; o L6
  prova o link e o slug inexistente sem soma.
- **O `AcessoDaSalaAchado` leva o id do acesso** (a chave do contador do nome é o acesso e a linha, P27, "Gerar novo"
  destrava). As justificativas dos dois `@SemEscopo` passaram a dizer "o acesso, a escola, o ano e a turma". Na seção 6.
- **A matrícula errada soma no nome antes do hash, numa operação atômica** (`test-engineer`, 1ª rodada). A spec contava
  depois da volta atrás, e o limite era "verifica e depois grava": dez erradas ao mesmo tempo no mesmo nome liam todas 0 e
  rodavam dez hashes, e a certa no mesmo lote gravava `teve_matricula_errada` em `false`. Agora uma leitura antes do hash,
  com escola e ano do contexto e a turma do acesso, diz se é matrícula errada num nome livre; se é, o `INCR` do contador
  do nome já conta a tentativa, e ela passa só enquanto não exceder o teto (dez juntas: cinco recusas, cinco
  `LIMITE_EXCEDIDO`, cinco hashes). A marca do pedido é lida depois do hash, logo antes da transação. A resposta ao aluno
  não muda (o hash roda do mesmo jeito); a leitura do nome passou a rodar em todo pedido, por chave primária, fora de
  transação. Na seção 5 (passo 5) da `techspec.md` e no I10, L4, L6 e E30 do `cenarios.md`, com os testes "L4, em
  paralelo" (unidade e integração) e "E30, em paralelo".
- **A leitura do nome confere também a matrícula diferente da digitada.** A spec lia só o nome `livre`; a chave de um
  pedido de T1 enviada pelo acesso de T2 com a matrícula **certa** do nome de T2 (E21) travaria um nome sem matrícula
  errada. Na seção 5 (passo 5) da `techspec.md` e no L6 do `cenarios.md`, com o teste no L6 e no E21.
- **"Acima do teto" é a partir do teto**: o 1.001º código espera, a 6ª matrícula trava e o 151º hash vai rebaixado, como
  o I10, o L4 e o L5 descrevem. Na seção 7c.
- **O log sai pelo logger JSON do processo, uma linha por escola, tipo e janela.** O `Logger` do Nest só leva o evento, e a
  linha precisa do `tipo` e do `escolaId`: o `main.ts` passa o logger ao `AppModule` (`OpcoesDeMontagem.logger`), que o dá
  ao `SalaModule`. A marca de "já saiu nesta janela" é mais uma chave do contador da sala (`sala:aviso-limite`, HMAC do
  tipo e da escola), e vale para todas as instâncias; com o Redis fora, uma linha por instância. Na seção 7c e em
  `docs/lgpd.md` ("Contadores da sala").
- **As duas métricas**: `sala.reivindicacao{resultado}` com `enviado`, `reenvio`, `recusada`, `limite`, `sem_acesso`,
  `indisponivel` e `erro`; `sala.limite_atingido{tipo}` soma a cada pedido segurado, com as séries em 0 no boot. As duas no
  painel da fundação (o `infra/test/painel.test.ts` exige painel para toda métrica). Na seção 7c.
- **O contador da sala é uma instância própria do `ContadorEmJanela`**, montada no `SalaModule` com o cliente do Redis de
  fila do login e a `LOGIN_CHAVE_CONTADOR`; o construtor passou a receber as opções num objeto (`janelaMs`,
  `avisarSeguro`, `relogio`, `proporcaoDoSeguro`) e ganhou o `restanteMs`, que dá o `Retry-After`. O seguro dela entra
  em `limite.seguro_ativo` pelo `main.ts`. Na seção 7c.
- **`chaves.ts` não mudou**: os prefixos da sala ficam em `limites-da-sala.ts`, como os do login ficam em `sessao/senha/`
  (o `chaves.ts` é do rate limit no Redis de cache); só o `segundosParaTentarDeNovo` passou a sair do índice do `nucleo`.
- **L5 com 38 nomes**: 151 matrículas erradas em 35 nomes, nenhum com mais de 4, não fecham (35 × 4 = 140). No
  `cenarios.md`.
- **L7 e L8 como unidade** (`limites-da-sala.test.ts`, `contador-em-janela.test.ts`; anotado no `cenarios.md`), com o cliente Redis fora do ar, que é
  o caminho do seguro; o L8 tem também a parte do Redis em `contador-em-janela.int.test.ts` e, pela aplicação montada, no
  L6 (a chave da sala com o prazo de 10 min e o `ContadorEmJanela` do login com 1 min).

## Mutações

Cada cláusula foi apagada ou trocada (script em lote), a suíte da sala rodou (`limites-da-sala.int.test.ts`,
`salas-reivindicar.int.test.ts`, `contador-em-janela.int.test.ts` e os três de unidade), e o arquivo voltou.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `limites-da-sala.ts:100` (o teto da escola: nunca espera) | L3 (os dois), L7 escola, o log por janela |
| `limites-da-sala.ts:152` (`limiteDoSeguro` no teto da escola) | L7 escola |
| `limites-da-sala.ts:128` (o teto do nome) | I10, L4, L4 em paralelo (unidade e integração), L4b, L7 nome, o log por janela |
| `limites-da-sala.ts:128` (`limiteDoSeguro` no nome) | L7 nome |
| `limites-da-sala.ts:124` (a errada soma antes do hash; trocada pela leitura) | I10, L4, L4 em paralelo, L7 nome, o log por janela e mais 7 |
| `limites-da-sala.ts:127` (as anteriores sem a própria soma) | I10, L4, L4 em paralelo, L7 nome, o log por janela e mais 4 |
| `limites-da-sala.ts:142` (a marca é `valor > 0`, trocada por `false`) | E30, E30 em paralelo, L7 nome |
| `limites-da-sala.ts:132` (o teto da turma) | L5, L6b, L7 turma |
| `limites-da-sala.ts:132` (`limiteDoSeguro` na turma) | L7 turma |
| `limites-da-sala.ts:130` (o `Retry-After` do resto da janela, trocado por 1) | L4, L7 nome |
| `limites-da-sala.ts:156` (a métrica `sala.limite_atingido`) | L3, L4, L5, o log por janela |
| `limites-da-sala.ts:159` (uma linha por janela: `valor === 1`) | L3 (uma linha), o log por janela |
| `limites-da-sala.ts:158` (a escola na marca do log) | o log por janela (a linha da B) |
| `limites-da-sala.ts:168` (o acesso na chave do nome) | L4b, E30, L7 nome |
| `limites-da-sala.ts:168` (o nome na chave do nome) | L1, L4, L4b, L5, E30, L7 nome |
| `limites-da-sala.ts:164` (a escola na chave da escola) | L3 (a B sem espera), L5, L6b, L7 escola e mais 7 |
| `limites-da-sala.ts:172` (a turma na chave da turma) | C1, E21, L3, L5, L6b, L7 turma e mais 3 |
| `reivindicacao.service.ts:106` (a leitura do nome livre, trocada por "nunca errada") | I10, L4, L6 (unidade), R3 e mais 10 |
| `reivindicacao.service.ts:107` (os limites antes do hash) | I10, L4, R3 (unidade) e mais 12 |
| `reivindicacao.service.ts:108` (o rebaixado no balde) | L5 (unidade e integração), L6b |
| `reivindicacao.service.ts:109` (a marca lida depois do hash; movida para antes dele) | E30 em paralelo, R3 (unidade, a ordem) |
| `reivindicacao.service.ts:112` (`teveMatriculaErrada` no insert, trocado por `false`) | E30 |
| `reivindicacao.service.ts:118` (o hash sem pedido conta na turma) | C1, I10, L6 (unidade), R3 e mais 7 |
| `reivindicacao.service.ts:117-118` (a turma conta antes da releitura) | C2 (a), R3 (unidade) e mais 6 |
| `reivindicacao.service.ts:87` (o resultado da métrica, sempre `enviado`) | `sala.reivindicacao{resultado}` |
| `lista-livre.repository.ts:94` (a turma na leitura do nome livre) | I10, L6 |
| `lista-livre.repository.ts:96` (`livre` na leitura) | L6, L6b |
| `lista-livre.repository.ts:97` (a matrícula diferente na leitura) | L6, E21, L4b, L6b, E30 em paralelo e mais 6 |
| `lista-livre.repository.ts:92` e `:93` (escola e ano na leitura) | nenhum, sozinhas: segunda camada (a turma e o nome são UUID globais, da linha do acesso e da FK com a escola), como no `tomar` da 6.0 |
| `acesso-da-sala.ts:54` (a guarda antes da busca) | L3 (os dois) |
| `acesso-da-sala.ts:56` (a contagem do código errado) | L2, L3 (os dois), L6 |
| `acesso-da-sala.ts:56` (só o código que não achou conta) | L2, L6, E21, C1, C2 (a), (b) e mais 1 |
| `acesso-da-sala.ts:46` (acrescentado: a guarda também no link) | L3 (o link sem espera) |
| `resolucao-de-tenant.repository.ts:513` (o id do acesso, trocado pelo da turma) | L4b, L6, E30 |
| `contador-em-janela.ts:102` (a janela no script, trocada por 60 s) | L4 (`Retry-After`), L6 (prazo de 10 min), L8 (Redis) |
| `contador-em-janela.ts:152` (a janela no seguro) | L7 nome, L8 (unidade) |
| `contador-em-janela.ts:79` (o padrão de 60 s, trocado por 10 min) | L8 (login com 1 min), L6, os do login em `contador-em-janela.int.test.ts` |
| `contador-em-janela.ts:140` (o `restanteMs` do Redis) | L4, L8 (Redis) |
| `sala.module.ts:54` (a janela de 10 min da sala) | L4, L6 |
| `app.module.ts:80` (o logger do processo na sala, trocado por um mudo) | L3 (a linha do log) |
| `main.ts` (o seguro da sala em `limite.seguro_ativo`) | nenhum: o `main.ts` não sobe em teste; a mesma ligação do login também não tem teste, e o `observarSeguroDoLimite` com várias fontes é provado em `metricas.test.ts` |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `test-engineer`, 1ª | `indisponivel` em `sala.reivindicacao` no teste do 503 | aplicada: `salas-reivindicar.int.test.ts`, no 503 do semáforo |
| `test-engineer`, 1ª | `erro` em `sala.reivindicacao` com teste | recusada: o `erro` é o 500 de falha inesperada, e o único caminho que o provoca hoje é o E23 (falha injetada); a contagem é o mesmo `?? 'erro'` do mapeamento, que o teste do resultado já exercita pelos outros cinco |
| `test-engineer`, 1ª | o L7 como unidade anotado no `cenarios.md` | aplicada |
| `test-engineer`, 1ª | matrícula e nome na lista do que o log do L3 não pode ter | aplicada |
| `test-engineer`, 1ª | extrair as fontes de `limite.seguro_ativo` do `main.ts` para uma função testável | para o `/retro`: a mesma lacuna existe no login desde a 15.0, e a extração vale para as duas fontes na próxima tarefa que tocar o `main.ts` |
| `test-engineer`, 2ª | a marca do E30 conta as erradas somadas até o fim do hash da certa | aplicada: uma linha no E30 do `cenarios.md` |
| `test-engineer`, 2ª | a errada conta no nome antes do semáforo, também quando sai com 503 | aplicada: uma linha no L4 do `cenarios.md` |
| `test-engineer`, 2ª | comentário no "L4, em paralelo" dizendo que a asserção do contador em 10 é a que pega o "lê e depois soma" | aplicada |
| `privacy-guardian`, 1ª | alinhar a linha "Reivindicação" do `docs/lgpd.md` com a marca lida depois do hash | aplicada |
| `privacy-guardian`, 1ª | as linhas do log de tipo `nome` e `turma` conferidas na aplicação montada | aplicada: no L4 e no L5 |
| `privacy-guardian`, 1ª | o travamento de um nome por quem tem o link, no texto de ajuda e no runbook | anotada no `17_task.md` e no `9_task.md` |
| `tenancy-guardian`, 1ª | a espera de 1 s revela que a escola está acima do teto: risco aceito na 7c | aplicada, na seção 7c da `techspec.md` |
| `tenancy-guardian`, 1ª | escola e ano como segunda camada no comentário do `livreComOutraMatricula` | aplicada |
| `infra-guardian`, 1ª | piso do teto do nome no seguro com 3 ou mais instâncias; o gauge do `esperandoOCodigo`; o runbook sobre a lentidão enquanto o slug é alvo | anotadas no `9_task.md` (alerta, runbook e carga); o piso é decisão fora da spec, que hoje manda o `limiteDoSeguro` (L7) |
| `infra-guardian`, 1ª | a marca lida depois do hash deixa escapar a errada entre a leitura e o commit | já no E30 do `cenarios.md`; volta à mesa se a marca passar a pesar na decisão da 8.0 |
| `revisor-geral`, 1ª | o L6 do `cenarios.md` com "antes do hash"; o JSDoc do `AppModule` | aplicadas |
| `revisor-geral`, 1ª | o `esperandoOCodigo` lido só pelo teste | aplicada: o comentário diz que é do L3, e o gauge está anotado para a 9.0 |
| `revisor-geral`, 1ª | o teto da escola é brando ("lê e depois soma"; a espera não limita o volume) | aplicada: uma linha na seção 7c da `techspec.md` e a nota no `9_task.md` |
| `revisor-geral`, 1ª | o aviso do seguro pelo logger do processo, e não pelo `Logger` do Nest | recusada: o aviso é o `avisoEspacado` do `ContadorEmJanela`, que o contador do login usa do mesmo jeito; o logger do processo só entra onde a linha precisa de campo |
| `test-engineer`, 1ª | contar as linhas do log com duas instâncias da API ao mesmo tempo | recusada: a marca é um `INCR` no Redis, cuja atomicidade entre instâncias o `contador-em-janela.int.test.ts` já prova ("vinte somas de duas instâncias"), e a linha sai só no valor 1 |
| `test-engineer`, 3ª | zerar as linhas do log no `beforeEach` do `limites-da-sala.int.test.ts` | aplicada |
| `test-engineer`, 4ª | ordem da tabela | aplicada |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-27 00:06:07 | 2026-09-27 00:09:19 | `test-engineer` | 1 | REPROVADO | a1578beecb0c3a692 |
| 2026-09-27 00:30:56 | 2026-09-27 00:32:42 | `test-engineer` | 2 | APROVADO | ad544dffcaa400abb |
| 2026-09-27 00:33:30 | 2026-09-27 00:34:26 | `privacy-guardian` | 1 | APROVADO | abdad376b4c910d47 |
| 2026-09-27 00:33:36 | 2026-09-27 00:34:43 | `tenancy-guardian` | 1 | APROVADO | a32df10e057108b36 |
| 2026-09-27 00:33:24 | 2026-09-27 00:34:47 | `infra-guardian` | 1 | APROVADO | a213d3035ca96e2c9 |
| 2026-09-27 00:33:17 | 2026-09-27 00:35:01 | `revisor-geral` | 1 | APROVADO | a6cd40afbbbebc002 |
| 2026-09-27 00:46:24 | 2026-09-27 00:46:54 | `test-engineer` | 3 | APROVADO | acc355d4ae4db1325 |
| 2026-09-27 00:47:29 | 2026-09-27 00:47:47 | `test-engineer` | 4 | APROVADO | a617bf39a9438ba7e |
| 2026-09-27 00:47:59 | 2026-09-27 00:48:40 | `revisor-geral` | 2 | APROVADO | ad4b54c88ad3151d8 |

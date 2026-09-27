# Achados das revisões — `tasks/prd-apresentacao-escola/10_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-27 06:34:24 · `tasks/prd-apresentacao-escola/10_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- V1: cada escrita do `encerrar`, a ordem entre elas, o ano e a escola de cada uma, e o `set null` do recusado. Depois da virada, link e código dão `NAO_ENCONTRADO` e o pedido dá `nao_encontrada`.
- V3: a eliminação do aluno aprovado apaga a linha da lista e os pedidos dela, o marcador do nome não sobra, uma falha no meio desfaz tudo e o colega da mesma turma fica.
- V4: eliminar o professor não falha, e `criado_por` e `decidida_por` ficam nulos.
- V5: dia 29 fica e dia 31 sai, o `least` entre vencer e revogar vale, o lote leva primeiro o mais antigo, e dois expurgos em paralelo apagam cada linha uma vez só.
- C10: `encerrar` contra reivindicar, aprovar, nome avulso e gravação da lista, com as duas ordens de chegada.
- Log novo e isolamento: a virada e a eliminação num contexto de outra escola não alcançam nada.
- Borda da virada de ano: o aluno aprovado num ano já encerrado e eliminado no ano seguinte.

**Cobertos:**
- V1 completo: o acesso já revogado guarda a hora dele, o ano de 2025 montado pelo banco fica como está, o pendente fecha sem nenhuma coluna de decisão, e o decidir com 2027 aberto dá `nao_encontrada`.
- Isolamento do `virarSala` e do `apagarDaListaDeNomes`, cada um com a chamada de controle na escola de B, que prova que o teste alcançaria a linha.
- V3 com a falha injetada por gatilho, os ids guardados antes, o marcador procurado em sete tabelas e o colega aprovado intacto.
- V4, e o `criado_por` da lista, que já estava coberto em `lista.int.test.ts:474`.
- V5 com a semente do `least` (revogado há 10 dias, vencido há 31), os dois lados dos 30 dias, o convite de professor e a soma exata dos dois expurgos em `Promise.all`.
- Lote ordenado, com o mais antigo semeado por último.
- Os seis C10 em paralelo de verdade, com ponto de pausa. Nenhum confere a espera, todos conferem o efeito.
- O teste de unidade da reivindicação com o ano fora de curso.
- O E5 da lista, atualizado.
- Sem `.skip`, sem teste comentado, sem provedor de IA. O único mock (`travarAnoEmCurso` no teste de unidade) não esconde a regra, porque o C10 de integração a prova com o banco de verdade.
- Rodei uma das mutações mais sutis: tirei a trava do ano do avulso (`lista.service.ts:130`) e o C10 do nome avulso ficou vermelho (`expected ['livre'] to deeply equal []`). Restaurei o arquivo da cópia e conferi com `cmp`.

**Bloqueantes:**
1. **A eliminação do aluno aprovado num ano já encerrado não tem teste.**
   - O que falta: o `docs/lgpd.md` (linha "Lista de nomes") diz que os nomes livre e reivindicado saem na virada e que o aprovado "sai junto com o usuário na eliminação". Então a linha `aprovado` só dura além do ano letivo num ano encerrado, e é aí que a eliminação acontece no caso real (aluno transferido que sai e cujos dados a escola pede para apagar no ano seguinte).
   - Onde: o V3 (`apps/api/test/ciclo-de-vida.int.test.ts`, caso "V3: eliminar o aluno aprovado…") elimina o aluno no ano em curso.
   - Por que é bloqueante: `apagarDaListaDeNomes` (`apps/api/src/sessao/ciclo-de-vida.repository.ts:302-311`) acerta hoje por não filtrar pelo ano ("De qualquer ano da escola", no comentário), mas nenhum teste prova isso. Uma mudança que acrescentasse `eq(listaNome.anoLetivoId, exigirAnoEmCurso())`, o padrão da regra 10 item 2 que um revisor pode pedir, deixaria a suíte inteira verde. E a eliminação do ex-aluno passaria a falhar com 23503 (a FK de `usuario_id` sem ação), um 500, quebrando o direito de eliminação (regra 20, itens 15 e 19).
   - Correção exigida: um caso, ou uma variação do V3, com a linha aprovada e um pedido recusado na mesma linha. Encerrar o ano pela rota, abrir 2027 e eliminar o aluno. Conferir que a linha e os pedidos saíram pelos ids guardados antes, e que a auditoria mostra `linhaDaListaApagada: true` e `pedidosApagados: 2`. Registrar a mutação na seção "Mutações" (filtro pelo ano do contexto em `ciclo-de-vida.repository.ts:304` → esse caso vermelho).

**Recomendações (não bloqueiam, ficam para o `/validar` e o `/retro`):**
- No V1 (`apps/api/test/virada-do-ano.int.test.ts`, final do caso V1), afirmar que `linhasDeLog` não está vazio, por exemplo que contém o id do ano encerrado. Sem isso, a busca por nome, matrícula, token e código no log passaria mesmo se a captura parasse de funcionar.
- O teste de clique duplo no `encerrar` (em paralelo) roda com a sala vazia (contagens 0). Pôr um acesso, um pendente e nomes livres nele provaria "uma virada só" também para as escritas novas.
- A linha "`ciclo-de-vida.repository.ts:108`, a escola do pedido → nenhum" na seção "Mutações" está bem justificada como segunda camada (a subconsulta já vem com a escola e a FK é composta). Vale citar a FK composta ali, para o `tenancy-guardian` não reabrir a questão.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/10_task.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ciclo-de-vida.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/virada-do-ano.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts

## test-engineer · 2ª rodada · APROVADO · 2026-09-27 06:45:47 · `tasks/prd-apresentacao-escola/10_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (os mesmos da 1ª rodada):
- V1: cada escrita do `encerrar`, a ordem entre elas, o ano e a escola de cada uma, e o `set null` do recusado. Depois da virada, link e código não abrem a sala e o pedido dá `nao_encontrada`.
- V3: a eliminação leva a linha aprovada e os pedidos dela, uma falha no meio desfaz tudo, e o colega da mesma turma fica.
- V4: eliminar o professor não falha, e `criado_por` e `decidida_por` ficam nulos.
- V5: a regra dos 30 dias, o `least`, o lote que leva primeiro o mais antigo, e dois expurgos em paralelo.
- C10: `encerrar` contra reivindicar, aprovar, nome avulso e gravação da lista, nas duas ordens de chegada.
- Log e isolamento.
- Borda da virada: o aluno aprovado num ano já encerrado e eliminado no ano seguinte.

**Cobertos:**
- **Correção exigida, feita.** O caso novo em `apps/api/test/ciclo-de-vida.int.test.ts:642` faz o que foi pedido:
  - um pedido recusado e um aprovado na mesma linha;
  - o `encerrar` e a abertura de 2027 pela rota, com o status conferido;
  - uma checagem de que a linha e os dois pedidos atravessaram a virada;
  - depois da eliminação, a linha, os pedidos e o usuário somem, conferidos pelos ids guardados antes;
  - a auditoria mostra `linhaDaListaApagada: true` e `pedidosApagados: 2`.
- **Mutação rodada por mim.** Acrescentei ao `doUsuario` (`apps/api/src/sessao/ciclo-de-vida.repository.ts:105`) um filtro que prende a linha ao ano em curso da escola. Rodei só `ciclo-de-vida.int.test.ts`: só esse caso ficou vermelho (1 falhou, 14 passaram). Restaurei o arquivo da cópia de segurança e conferi com `cmp`. A linha na seção "Mutações" (`10_task.md:191`) aponta para a linha certa.
- **Recomendações da 1ª rodada, todas aplicadas:**
  - **Log no V1:** `expect(linhasDeLog.length).toBeGreaterThan(0)` em `apps/api/test/virada-do-ano.int.test.ts:421`, antes da busca. Não dá para buscar o id do ano porque o log não o traz. A checagem de que houve linhas escritas já basta para provar que a captura funciona.
  - **Clique duplo com a sala** (`virada-do-ano.int.test.ts:505`): dois `encerrar` em paralelo de verdade (`Promise.all`), com acesso, um pendente e dois nomes. O teste confere:
    - uma auditoria só;
    - as contagens 1/1/2;
    - o pedido `encerrada` sem segredo;
    - nenhum nome sobrando.

    Uma segunda virada geraria uma segunda auditoria, então o teste falharia.
  - **Linha da escola do pedido** em "Mutações" (`10_task.md:192`): agora cita a FK composta `(escola_id, lista_nome_id)`.
- Esta rodada não trouxe `.skip`, teste comentado, mock novo nem provedor de IA. O código de produção não mudou desde a rodada aprovada.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ciclo-de-vida.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/virada-do-ano.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/10_task.md

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-27 06:46:59 · `tasks/prd-apresentacao-escola/10_task.md`

VEREDITO: APROVADO

Tabelas verificadas: não há migration nesta tarefa. Conferi o escopo e as FKs das tabelas que a tarefa escreve.
- `acesso_turma`, `reivindicacao` e `lista_nome` têm `escolaId` e `anoLetivoId`, e as FKs são compostas com `escola_id`.
- O `on delete set null` só atinge a coluna certa: `lista_nome_id`, `decidida_por` e `criado_por`. O `escola_id` fica.
- Todos os ids são UUID.

Queries verificadas:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/ano-letivo.repository.ts:77` (`virarSala`): as três escritas filtram pela escola que vem do contexto (`exigirEscolaDoContexto`). O `anoLetivoId` vem do ano que o `#transitar` já leu com escopo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts:39` (`travarAnoEmCurso`, reaproveitado por reivindicação, decisão, gravação e avulso da lista): escola e ano vêm do contexto, com `for share`.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.repository.ts:105` (`apagarDaListaDeNomes`): a busca pelo usuário filtra pela escola do contexto. O `delete` dos pedidos filtra pela escola e por uma subconsulta que também tem escopo. O `usuarioId` só chega aqui depois da busca do alvo com escopo, que já existia; id de outra escola dá `NAO_ENCONTRADO`, e o teste antigo segue provando isso.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:201`: o `@SemEscopo` foi reescrito com justificativa para o `acesso_turma` e o convite de professor. É rotina nossa, devolve só contagem e não atende requisição de escola.
- Endpoints: não há endpoint novo, e nenhum aceita `escolaId` no corpo ou na query string.
- Camada de rede: nada novo toca agregado de rede.

Teste de isolamento: presente e efetivo. Conferi tirando mentalmente cada cláusula de escola.
- `virada-do-ano.int.test.ts`, "isolamento: num contexto de A, `virarSala` com o ano de B…": o contexto é a escola A e o ano passado é o de B. Sem o filtro de escola, qualquer uma das três escritas alcançaria B, e o teste compara a sala de B antes e depois. O teste também tem o controle com a escola de B, que mostra que a chamada alcança B quando deve.
- `ciclo-de-vida.int.test.ts`, "isolamento: num contexto de A, `apagarDaListaDeNomes` com o aluno aprovado de B…": sem a escola em `doUsuario`, a linha e o pedido de B seriam apagados.
- O único filtro de escola sem teste é o do pedido em `ciclo-de-vida.repository.ts:307`. A tarefa o declara como segunda camada, e a FK composta `(escola_id, lista_nome_id)` cobre o caso.

Bloqueantes: nenhum.

Recomendações:
- `ciclo-de-vida.repository.ts:105`: não existe índice `(escola_id, usuario_id)` em `lista_nome`, então a busca pelo usuário percorre a lista inteira da escola pelo prefixo de `lista_nome_turma_idx`. A eliminação é rara, mas o comentário "desce pelo índice da lista" promete mais do que o índice entrega. Vale ajustar o texto ou registrar o índice para o F3 (fica para o `infra-guardian`).

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-27 06:47:10 · `tasks/prd-apresentacao-escola/10_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** a tarefa não cria campo novo. Ela mexe em campos que já existem. Em `lista_nome` (nome, matrícula, estado, `usuario_id`), a virada apaga as linhas livres e reivindicadas e a eliminação apaga a linha aprovada. Em `reivindicacao`, a virada anula `senha_hash`, `chave_envio` e `teve_matricula_errada` do pedido pendente, que vira `encerrada`, e a eliminação apaga o pedido. Em `acesso_turma`, a virada preenche `revogado_em` e o expurgo apaga a linha depois de 30 dias. O convite de professor passa a ter `order by` no expurgo.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. As linhas "Lista de nomes", "Reivindicação", "Acesso da turma" e "Convite de professor" já tinham o que o código agora faz. A linha "Reivindicação" ganhou a nota de que o pedido decidido ou encerrado ainda não tem expurgo depois dos 5 anos. O `TODO.md` registra isso para o F3.

**Autorização por objeto:** ok.
- `virarSala` (`apps/api/src/estrutura/ano-letivo.repository.ts:56-73`) filtra pela escola do contexto e pelo ano nas três escritas.
- `apagarDaListaDeNomes` (`apps/api/src/sessao/ciclo-de-vida.repository.ts:317-326`) filtra pela escola do contexto e pelo `usuario_id`. A subconsulta dos pedidos vem desse mesmo filtro, e a chave estrangeira composta `(escola_id, lista_nome_id)` prende o pedido à escola.
- Na decisão, quando o ano já está encerrado, a resposta é `nao_encontrada`, igual à de um pedido de outro ano. Na reivindicação é `REIVINDICACAO_RECUSADA`, igual à de um nome inexistente ou tomado. As duas não confirmam que o registro existe.

**Logs:** limpos. `virarSala`, `apagarDaListaDeNomes` e os services alterados não escrevem log. O `acesso.expurgado` (`apps/worker/src/processadores/expurgar-acesso.ts`) leva só contagens, com `acessosDaTurmaTotal` acrescentado. O V1 procura nome, matrícula, token e código no log capturado e na auditoria da virada.

**Auditoria:** presente.
- `ano_letivo.encerrado` ganhou `acessosRevogados`, `pedidosEncerrados` e `linhasDaListaApagadas`.
- `usuario.eliminado` ganhou `linhaDaListaApagada` e `pedidosApagados`.
- As duas levam só números e sim ou não (`packages/nucleo/src/auditoria/acoes.ts`). O V3 confere que o marcador do nome não aparece em nenhuma de sete tabelas, e a auditoria é uma delas.
- Encerrar sem decisão deixa `decidida_por`, `decidida_em` e `decidida_como` nulos. Encerrar não é recusar (regra 70, item 2).

**Envio externo:** nenhum. A tarefa não toca IA nem provedor.

**Seed/fixture:** sintético. Os testes usam marcador aleatório (`Aluna marcador<uuid>`) e nomes inventados, e não entrou seed nova.

**Bloqueantes:** nenhum.

A nota da 6.0 e a da 8.0 foram cumpridas. No `encerrar`, os pendentes são fechados antes de os nomes serem apagados. Na eliminação, os pedidos saem antes da linha da lista, e a linha antes do usuário, tudo na mesma transação. Com isso, o aluno aprovado pela lista pode ser eliminado sem o erro 23503, e a promessa do `docs/lgpd.md` passa a ser cumprida pelo código. O 23514 continua sem tradução, e aceito o motivo: a ordem é garantida por construção, a trava do ano impede que um pendente nasça entre as escritas, e as mutações provam as duas coisas. Se acontecer mesmo assim, sai como 500 do filtro global, sem dado.

**Pergunta de fechamento:** para esta tarefa, sim. Depois da virada, o pedido fica sem o nome e sem segredo e não se liga mais a ninguém. Na eliminação, tudo o que liga o aluno à lista sai. O pedido de acesso e portabilidade cobrindo as tabelas da A1 fica fora do escopo e já está no `TODO.md` (F3), com dado 100% sintético na A1.

**Recomendações:**
1. O comentário de `apagarDaListaDeNomes` diz que "a busca pelo usuário desce pelo índice da lista, que começa pela escola". Vale confirmar que existe índice com `(escola_id, usuario_id)` ou que o comentário descreve o índice real. Hoje é custo, não exposição, e quem confere é o `infra-guardian`.
2. Quando o F3 fizer o expurgo dos pedidos decididos e encerrados, ele precisa usar a retenção configurável por escola (regra 20, item 16), como o item do `TODO.md` já diz. Registro para o `/retro`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/ano-letivo.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`

## infra-guardian · 1ª rodada · APROVADO · 2026-09-27 06:48:14 · `tasks/prd-apresentacao-escola/10_task.md`

```
VEREDITO: APROVADO
Caminho quente tocado: sala
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.repository.ts:105. A
  busca `(escola_id, usuario_id)` em `lista_nome` usa só o prefixo `escola_id` do
  `lista_nome_turma_idx`, então percorre a lista da escola em todos os anos. As linhas `aprovado`
  nunca saem antes da eliminação. A FK `lista_nome_usuario_da_escola_fk`, que já existia, faz a
  mesma varredura no `delete` do usuário. Não bloqueia, porque eliminar é raro, a busca fica
  presa à escola e não há listagem para paginar. Na próxima migration de `lista_nome`, vale um
  índice parcial `(escola_id, usuario_id) where usuario_id is not null`, que serve à busca e à FK.
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:89.
  O `acesso_turma` e o `convite` ordenam por `least(...)` sem índice. Isso é aceitável hoje:
  as tabelas são pequenas, o job é noturno e usa `skip locked`. Se o "Gerar novo" virar rotina
  diária por turma, a ordenação passa a ler e ordenar a tabela inteira a cada lote de 5.000, e
  aí cabe um índice de expressão.
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/ano-letivo.service.ts:53. O
  `encerrar` segura o ano da escola em modo exclusivo durante toda a virada. Nesse intervalo,
  toda reivindicação, decisão, gravação de lista e geração de acesso da escola espera. É menos
  de 1 s numa escola grande, mas não há medida da duração nem aviso de que encerrar em horário
  de aula congela a sala da escola. Vale uma linha no runbook e o tempo da virada no log só
  com contagens.
```

O que conferi e está correto:

- **Travas sem ciclo.** Todos os caminhos que escrevem no ano pegam primeiro o ano em
  `FOR SHARE` (reivindicação, decisão, gravação e avulso da lista, criar turma, vínculo, gerar
  acesso). O `encerrar` muda o ano antes de qualquer outra escrita. O `excluir` da turma não
  toca no ano e nada o espera, então não fecha ciclo.
- **Nada escapa do ano encerrado.** A trava relê a situação do ano depois de esperar, e cada
  escrita da virada vê o que foi gravado antes dela. Por isso o pedido que ia nascer junto com
  o encerramento ou é fechado pela virada, ou não chega a ser gravado.
- **Custo na hora de pico.** A trava custa um `select` pela chave primária por transação,
  compartilhado entre elas, a cerca de 7/s. Não pesa na manhã de segunda.
- **Índices da virada.** As três escritas da virada usam índices que começam pela escola:
  `acesso_turma_um_por_turma`, `reivindicacao_pendente_por_nome` e `lista_nome_turma_idx`. A
  exclusão dos pedidos na eliminação usa o `reivindicacao_nome_idx`.
- **Expurgo concorrente.** Com lote, `order by` e `for update skip locked`, dois expurgos ao
  mesmo tempo não apagam em dobro. O V5 prova isso com `Promise.all`.
- **Testes de concorrência.** Os C10 rodam em paralelo contra o Postgres real e cobrem os
  seis arranjos.
- **O resto do escopo.** Nenhuma migration, nenhuma chamada de IA e nenhum alerta novo. O log
  e a auditoria levam só contagens.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-27 06:48:21 · `tasks/prd-apresentacao-escola/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: o carimbo vale para o código atual em typecheck, lint e test (início às 09:35:30Z, nenhum arquivo mudou depois). O `conferir` responde "portão local: o último não rodou infra. Rode `node tools/processo/portao-local.ts --infra`." Não contei isso como bloqueante, porque você disse que o `--infra` roda no portão final por decisão do Joaquim. O hook ainda vai barrar o commit enquanto o infra não rodar.

Bloqueantes: nenhum

O que conferi e está correto:
- **Ordem da virada.** `virarSala` revoga os acessos, fecha os pendentes e só então apaga os nomes. `#transitar` muda o ano antes do efeito. O `FOR SHARE` vem sempre antes da turma, do pedido e do nome na reivindicação, na decisão, na gravação e no avulso. Não há ordem cruzada com o `encerrar`.
- **Outros caminhos que escrevem nas tabelas.** Todos os que escrevem em `lista_nome`, `reivindicacao` e `acesso_turma` travam o ano, já travavam antes (gerar acesso) ou só apagam linha `livre`, que não tem pendente (retirar). Nenhum caminho sobra onde o 23514 escape.
- **Divergências.** Cada uma está na `techspec.md` (seções 4, 7 e 7c) e no `cenarios.md` (V1, V3, V5 e C10), não só no `10_task.md`. O 23514 sem tradução já foi aceito pelo `privacy-guardian` na 6.0 e na 10.0.
- **Expurgo.** `expira_em` é `not null`, então o `least` do `acesso_turma` sempre tem valor. Os índices que o `set null` e o fechamento dos pendentes usam já existem (0021).

Recomendações:
- `apps/api/src/sala/reivindicacao.service.ts:77` (166 colunas) e `apps/api/src/estrutura/lista.service.ts:119` (174 colunas): linhas de JSDoc bem mais longas que a quebra em ~120 do resto dos dois arquivos. Vale quebrar.
- `apps/api/src/sala/decisao.service.ts:132`: o comentário em linha repete o item 1 do JSDoc logo acima. Pode sair.
- `apps/api/src/sessao/ciclo-de-vida.repository.ts:101`: a frase "desce pelo índice da lista, que começa pela escola" promete mais do que entrega. Não existe índice por `(escola_id, usuario_id)`: a busca percorre as linhas da escola no `lista_nome_turma_idx`. Na eliminação, que é rara, o custo é aceitável, mas o comentário devia dizer isso.
- `apps/worker/test/expurgo-de-acesso.int.test.ts` (V5 em paralelo): `antes` conta os `acesso_turma` vencidos do banco inteiro. Se outro arquivo apagar um acesso vencido ao mesmo tempo (o cascade da exclusão de turma), `uma + outra` fica menor que `antes`. Filtrar pelos ids semeados deixa o teste imune a isso (regra 40, "banco de teste com milhares de escolas").
- `tasks/prd-apresentacao-escola/10_task.md`, tabela de Mutações: as linhas citadas (`reivindicacao.service.ts:118`, `decisao.service.ts:134`) já não batem com o arquivo atual (a trava está em :121 e :134–135). Convém atualizar para o `/validar`.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-27 06:59:24 · `tasks/prd-apresentacao-escola/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: o `conferir` responde "portão local: o último não rodou infra. Rode `node tools/processo/portao-local.ts --infra`." Você disse que o `--infra` fica para o portão final, por decisão do Joaquim, então não contei como bloqueante. O carimbo de typecheck, lint e test vale para a árvore atual. O hook continua barrando o commit até o `--infra` rodar.
Bloqueantes: nenhum

Conferência das correções da rodada anterior:
- **`decisao.service.ts`:** saiu o comentário em linha que repetia a trava do ano. O item 1 do JSDoc (:117) ficou como a única explicação, e o código em :132 não mudou.
- **`ciclo-de-vida.repository.ts`, JSDoc de `apagarDaListaDeNomes`:** agora descreve o índice que existe de fato (o prefixo de `lista_nome_turma_idx`, sem `(escola_id, usuario_id)`). O item correspondente está no `TODO.md:59`.
- **`lista.service.ts`, JSDoc do `acrescentar`:** a linha longa foi quebrada.
- **Tabela de Mutações do `10_task.md`:** conferi todas as linhas citadas contra o arquivo atual, e todas batem:
  - `ano-letivo.repository.ts`: :82, :84-91
  - `reivindicacao.service.ts:118`
  - `decisao.service.ts:132`
  - `lista.service.ts`: :101, :131
  - `ciclo-de-vida.repository.ts`: :106, :107-109, :111
  - `ciclo-de-vida.service.ts:72`
- **"Recomendações sem aplicar":** está preenchida. Os três itens do infra-guardian estão no `TODO.md`, e a recusa do V5 em paralelo tem motivo que se sustenta.
- **Código:** o diff dos quatro arquivos só mostra código da própria tarefa, igual ao que aprovei na 1ª rodada. Nesta rodada mudaram apenas comentários.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.ts:78`: a quebra de linha que eu pedi no item 5 do JSDoc não foi feita.
  - A última linha do item ainda tem 172 colunas. Ela começa em "restrição nunca é lido: …" e continua até "(Tech Spec da A1, seção 5, passo 5)".
  - Mesmo assim, o `10_task.md:205` diz que a quebra foi aplicada.
  - A correção é quebrar a linha ou corrigir o texto do `10_task.md`. É só cosmético, não bloqueia.

## revisor-geral · 3ª rodada · APROVADO · 2026-09-27 07:09:17 · `tasks/prd-apresentacao-escola/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: o carimbo bate com a árvore atual. O `conferir` só reclama da falta do infra: "portão local: o último não rodou infra. Rode `node tools/processo/portao-local.ts --infra`." Pela decisão do Joaquim, o infra roda só no portão final, antes do commit, então não reprovo por isso aqui.
Bloqueantes: nenhum
Recomendações:
- A recomendação da 2ª rodada foi aplicada. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.ts:78-79`, a última linha do item 5 do JSDoc agora está quebrada em duas. A mudança mexe só no comentário e não afeta o que as rodadas anteriores auditaram.
- Não é bloqueante nem veio desta tarefa: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.ts:87` tem 170 colunas (a chamada `createCounter` com `description` em linha única). Ela já estava assim no `HEAD`, e dá para quebrar quando alguém mexer nesse trecho.
- Antes do commit ainda falta rodar `node tools/processo/portao-local.ts --infra`. Sem ele o hook do commit não passa.

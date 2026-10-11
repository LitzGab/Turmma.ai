# Achados das revisões — `tasks/prd-lgpd-e-titular/19_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-10 21:05:51 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: REPROVADO

**Cenários exigidos**
1. **Carga:** a escola A expurga 1 milhão de linhas e troca um nome enquanto a B usa o Tutor. Cada statement fica abaixo de 2 s, e o p95 do Tutor de B, com e sem o lote de A, não piora além da base mais a margem. Pela subtarefa 19.1 e pela regra 80, item 11, o Tutor roda com o adaptador falso de latência simulada.
2. **Operação:** a saída do `ops:privacidade` traz só contagens, sem nenhuma sentinela.
3. **Isolamento:** as contagens de A não somam as de B.
4. **Permissão:** `OPERADOR` ausente, malformado, inexistente ou desativado é recusado (C2).
5. **Bordas:** escola sem nada; escola inexistente; eliminação concluída com o `eliminar_em` já passado; arquivo apagado antes da validade; categoria do expurgo que terminou e depois parou; suboperador encerrado ou com a ligação encerrada; argumento com o texto de uma sentinela.

**Cobertos**
- Os itens 2 a 5, em `apps/api/test/ops-privacidade.int.test.ts` (8 verdes) e em `apps/api/test/ops-operador.int.test.ts` › C2 › `ops:privacidade`.
- O veredito da fase, no item 1, em `infra/test/expurgo-da-carga.test.ts` e `infra/test/carga.test.ts` (45 verdes).
- A leitura do banco da fase, em `infra/test/expurgo-da-carga.int.test.ts` (14 verdes).
- Rodei três mutações, e as três ficaram vermelhas:
  - o filtro `empresa.fim === null` retirado (ficou vermelho `conta, em cada tabela…`);
  - o `await autor(tx)` retirado (ficou vermelho C2 › `ops:privacidade`);
  - a terceira foi conferida pela leitura do teste.
- Desfiz cada mutação e a árvore voltou ao estado em que recebi. Em `apps/api/src/ops/privacidade.ts`, que não é rastreado pelo git, desfiz pela troca inversa e conferi a linha.
- No resto, a tabela de Mutações confere com o diff. Não há `.skip` nem IA no caminho.

**Bloqueantes**

1. **O cenário de carga não prova que o expurgo não atrapalha o Tutor de outra escola.**
   - **Onde:** `infra/scripts/carga.ts:230-263` (`faseDoExpurgo`), `infra/k6/justica-entre-escolas.js:186`, `infra/scripts/expurgo-da-carga.ts:315` (`lerEsperaDaBNoTrabalho`).
   - **O que está errado:** a carga da B na fase do expurgo é o job sintético do F0 (`POST /v1/sistema/jobs-sinteticos`, `cpuMs: 100`). Esse job não lê nem grava `mensagem_tutor`, `execucao_agente` nem `consumo_ia`. Ele roda em `worker-interativo-*`, e o expurgo da A roda em `worker-lote-*` (`infra/compose.carga.yml:59-62`): são processos separados. O que se mede é a espera na fila interativa, e ela só depende do expurgo pela disputa de `job_registro` no Postgres.
   - **O risco que fica sem teste:** é o da regra. São as escritas do turno do Tutor de B nas mesmas tabelas e índices em que a A anonimiza e apaga em massa, ao mesmo tempo: WAL, índices parciais da 4.0 e cache expulso pelo lote. Se o expurgo degradasse esse caminho, a fase passaria do mesmo jeito.
   - **A divergência registrada não fecha o buraco.** Ela reescreve o cenário em `cenarios.md:90` e na `techspec.md` §7c para caber no que foi feito, e o motivo dado não se sustenta:
     - o `AdaptadorFalso` já tem `latenciaMs` (`packages/nucleo/src/ia/adaptador-falso.ts:27`), e falta só a variável de ambiente que o liga;
     - montar sala e atividade na B é semente de teste, não produto novo.
   - **Correção exigida:** na fase `expurgo`, a B precisa exercer a escrita do turno do Tutor nas tabelas que o expurgo toca, e a fase precisa reprovar se o p95 dessa operação passar da base mais a margem. Há dois caminhos:
     - **preferido:** a rota `POST /v1/tutor/mensagens` com o adaptador falso e a latência ligada por variável de ambiente, como pede a regra 80, item 11;
     - **mínimo:** um job interativo da B que grava o que um turno grava (`execucao_agente`, as duas `mensagem_tutor` e o `consumo_ia`), com a duração medida na base e durante o trabalho da A.

     Se a decisão for manter o job sintético, ela muda o cenário exigido pela spec. Isso é parada do Joaquim, registrada antes do commit, e não divergência resolvida dentro da tarefa.

**Recomendações**
- `infra/test/expurgo-da-carga.int.test.ts:276`: `medirEscritaDosIndices(pool, …)` manda `begin`, `drop index` e `rollback` por um `pg.Pool`. Hoje funciona porque o pool reusa a última conexão. Se uma consulta cair em outra conexão, o `drop index` é confirmado no banco de teste compartilhado. Use um cliente dedicado (`pool.connect()`), como no teste seguinte (linha 291).
- Na tabela de Mutações, a linha de `carga.ts` › `executar` (`controleNegativo` e `base.esperaBP95Ms`) depende só da execução manual. Vale extrair a escolha da fase para uma função pura com um teste de unidade.
- `ops-privacidade.int.test.ts:245`: na escola vazia, `suboperadoresVigentes: expect.any(Number)` aceita qualquer número. Comparar com a contagem lida antes do teste, como já se faz no teste anterior, fecharia o caso.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/carga.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/expurgo-da-carga.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/k6/justica-entre-escolas.js
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/compose.carga.yml
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/test/expurgo-da-carga.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/ops-privacidade.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/adaptador-falso.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/cenarios.md

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-10 21:06:54 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration. O comando lê `pedido_titular`, `arquivo_titular` e `expurgo_execucao`, que já existiam e já têm `escola_id`, e lê `incidente_escola`, `suboperador`, `suboperador_escola` e `escola` pelos leitores que já existiam.

Queries verificadas:
- **`ContagensDePrivacidadeRepository.doAtendimento`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/contagens-de-privacidade.repository.ts`): as três leituras filtram pelo `escolaId` que vem de `exigirEscolaDoContexto()`, inclusive a subconsulta `distinct on`. Nenhuma coluna de pessoa é lida e não há `@SemEscopo`.
- **`consultarPrivacidade`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/privacidade.ts`): confere o autor como primeira instrução da transação e só depois abre o contexto da escola. A existência da escola é conferida por `AcessoDaEscolaRepository.nome()`, que também usa o escopo do contexto. Os suboperadores e incidentes vêm de `SuboperadorDaEscolaRepository.daEscola` e `IncidenteDaEscolaRepository.daEscola`, que já filtram pelo contexto, e o comando só os conta.
- **`--escola`**: é argumento de ferramenta da operação (D76), não de rota HTTP. O `OPERADOR` é conferido contra os operadores ativos, como no `ops:uso`. Não é escalada de privilégio: o comando não expõe endpoint ao cliente e a saída tem só contagens. Escola inexistente devolve `NAO_ENCONTRADO` fixo, sem repetir o id.
- **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/expurgo-da-carga.ts`**: é o roteiro do cenário de carga, com dado sintético, e fica fora do código da aplicação. Todas as leituras de domínio filtram por `escola_id = $1`.

Teste de isolamento: presente e efetivo. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/ops-privacidade.int.test.ts`, as escolas A e B têm números diferentes em cada contagem: pedidos por estado, vencidas, arquivos, categorias do expurgo, data da última execução (5 h na A contra 1 h na B), incidentes e suboperadores. O teste compara a saída inteira com `toEqual`. Se qualquer um dos três `eq(..., escolaId)` sair, as linhas da B entram na contagem da A e o teste quebra, o que bate com a tabela de mutações. O teste também confere que o id de uma escola não aparece na saída da outra. O comando entrou no C2 de `ops-operador.int.test.ts`.

Bloqueantes: nenhum

Recomendações:
- O teste "a escola sem nada tem zero em tudo" prova pouco além do caso principal, porque `suboperadoresVigentes` aceita qualquer número. Ele poderia comparar com a contagem de suboperadores de alcance `todas` vigentes, como o caso principal faz com o "antes".
- `incidentes.avisados` herda o teto `LIMITE_DA_LISTA_DE_INCIDENTES` do leitor da coordenação. Está documentado e não vaza dado, mas é uma contagem que pode ficar abaixo do real. Vale registrar no `TODO.md` se a operação precisar do número exato.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-10 21:07:07 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A tarefa só lê, para contar, `pedido_titular` (estado, `eliminar_em`), `arquivo_titular` (`expira_em`, `apagado_em`) e `expurgo_execucao` (categoria, `concluida`, `em`), em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/contagens-de-privacidade.repository.ts:33-65`. Suboperadores e incidentes passam pelos leitores que a escola já tinha, e o comando só conta o resultado (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/privacidade.ts:68-74`). A semente da carga grava nome de aluno sintético e e-mail de coordenação e de professor, sempre sintéticos e só no banco do projeto `educa-carga`.

Fora da tabela de dados do docs/lgpd.md: nada. Não há migration nem coluna nova. O `docs/lgpd.md` ganhou o parágrafo do `ops:privacidade` e da prova de carga, e ele bate com o código.

Autorização por objeto: ok.
- `ops:privacidade` é comando nosso, sem rota HTTP.
- O `OPERADOR` é conferido como primeira instrução da transação (`privacidade.ts:64`), e o teste C2 de `ops-operador.int.test.ts` passou a cobrir este comando.
- A escola vem do contexto aberto com o `--escola`, e não de argumento do repository: cada leitura filtra por `exigirEscolaDoContexto()`, sem `@SemEscopo` novo.
- O teste de isolamento é efetivo: cada escola tem números diferentes em todas as tabelas, e cada cláusula de escopo tem mutação registrada.
- Escola inexistente devolve `NAO_ENCONTRADO` fixo, sem repetir o id.

Logs: limpos.
- A saída do comando tem só contagens, o `escolaId` pedido e uma data.
- O erro de argumento cita só a opção. O erro interno sai pelo `resumirErro`.
- O teste procura dez sentinelas (nome, e-mail, matrícula, textos do incidente, empresa, contrato) e a chave de objeto `titular/`, tanto na saída quanto no erro, inclusive nos caminhos que recusam.
- O script de carga imprime contagens e a forma normalizada dos statements, nunca o nome do titular sintético.

Auditoria: não se aplica. A tarefa não tem nenhuma das ações da regra 20, item 10: não lê dado de aluno, não exporta, não altera nota nem permissão. A operação lê só agregado da escola (D76, RF17).

Envio externo: nenhum. A tarefa não envolve IA nem suboperador.

Seed/fixture: sintético.
- No script de carga: "Eliane Carga Sintética", "Aluno sintético da carga n", e-mails `@carga.invalid` só para coordenação e professor, sem e-mail para aluno, e textos "Mensagem sintética em volume".
- No teste: sentinelas com sufixo aleatório e e-mails `@escola.invalid`.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/expurgo-da-carga.ts:104` (`semearEscolaA`), junto com `prepararMedicaoDeStatements` e `medirEscritaDosIndices`: nenhuma delas confere que o banco é o do projeto `educa-carga` antes de semear, de rodar `analyze`/`checkpoint`, de chamar `pg_stat_statements_reset()` ou de fazer `drop index` dentro de transação. Hoje só são chamadas pelo `carga.ts`, com a URL do `infra/carga.env`. Uma guarda barata seria conferir o `current_database()` esperado, ou `AMBIENTE=local`, como o `ops:sessao-sintetica` já faz.
2. `expurgo-da-carga.ts:360`: com `pg_stat_statements.track=all`, statements utilitários não são normalizados, e o script imprime até 160 caracteres deles. Com dado sintético não há o que vazar. Se a medição um dia rodar fora do projeto de carga, vale filtrar `toplevel` ou deixar de fora o que não for DML.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/privacidade.ts:74`: `incidentes.avisados` vem de uma lista com teto `LIMITE_DA_LISTA_DE_INCIDENTES`, e o próprio comentário do arquivo já declara isso. O teto não vaza nada, mas a contagem pode sair menor que a real. Uma contagem `count(*)` no leitor deixaria o número exato.

Pergunta de fechamento: a tarefa não muda o caminho de acesso e compartilhamento do titular, que vem das tarefas anteriores do F3, e o `ops:privacidade` não abre nenhum caminho novo até a pessoa. A resposta à secretaria continua vindo do pedido de acesso, sem regressão.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-10 21:08:05 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: REPROVADO
Escopo: incompleto
Aderência à Tech Spec: diverge no cenário de carga (§7c, a última linha da tabela de 7c, e o PRD RF5)
Portão local: carimbo válido

Bloqueantes:

1. **A subtarefa 19.1 está marcada `[x]` sem ter sido feita, e a Tech Spec foi reescrita para caber no que foi feito.**
   - **Onde:**
     - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/carga.ts:250-301` (`faseDoExpurgo`)
     - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/expurgo-da-carga.ts:315` (`lerEsperaDaBNoTrabalho`)
     - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:737-739`
     - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/cenarios.md:90-91`
     - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/19_task.md:23` e `:73`
   - **O que está errado:**
     - O PRD (RF5, coluna de teste) pede "carga com expurgo grande em A e Tutor em B". A 19.1 pede "o adaptador falso de latência simulada; p95 do Tutor de B".
     - O que a B roda é o job sintético do F0, só CPU, no `worker-interativo`, enquanto o expurgo da A roda no `worker-lote`. Esse job não grava em `execucao_agente`, `mensagem_tutor` nem `consumo_ia`, as tabelas e os índices que a A anonimiza e apaga ao mesmo tempo. O título da tarefa diz que a carga prova que o expurgo não atrapalha a aula, e o cenário não exercita o caminho que poderia atrapalhar.
     - O motivo registrado é falso nos fatos. O `AdaptadorFalso` já aceita `latenciaMs` (`packages/nucleo/src/ia/adaptador-falso.ts:27`). Falta só a ligação dele a uma variável de ambiente, em `packages/nucleo/src/ia/provedor.ts:272`. E semear sala e atividade na B é semente do cenário, não produto novo.
     - Trocar o critério de aceite de um RF do PRD não é divergência que a tarefa resolve sozinha. Escrever a troca na `techspec.md` e no `cenarios.md` não torna a decisão visível: devia ter parado e reportado.
   - **Correção exigida, um dos dois caminhos:**
     - **(a)** Na fase `expurgo`, a B exerce o turno do Tutor nas tabelas que o expurgo toca, de preferência pela rota `POST /v1/tutor/mensagens` com o adaptador falso e a latência ligada por variável de ambiente (regra 80, item 11). A fase reprova se o p95 do turno da B passar da base mais a margem. Depois, o trecho de `techspec.md:737-739`, de `cenarios.md:90-91`, de `docs/infra.md` seção 10 e de `TODO.md` ("Escrita a mais por troca do Tutor") volta a dizer a verdade.
     - **(b)** A troca do cenário vai como parada ao Joaquim e é registrada como decisão dele antes do commit. Nesse caso a 19.1 não fica `[x]` como está escrita.

     Nos dois caminhos, `docs/lgpd.md` (o parágrafo novo da 19.0, "O expurgo não atrapalha a aula é provado…") não pode afirmar uma prova sobre o Tutor que o cenário não faz.

Recomendações:
- O critério `statement_acima_de_2s` (`infra/scripts/expurgo-da-carga.ts:441`) quase nunca dispara. O `statement_timeout` dos processos é o mesmo 2 s, e um statement cancelado não entra no `pg_stat_statements`. Quem pega o caso é o `job_da_a`. O runbook (`docs/runbook.md`, item `statement_acima_de_2s`) descreve um gatilho que, na prática, chega pelo outro critério. Vale baixar o limite da medida abaixo do teto, ou dizer isso no runbook.
- `infra/test/expurgo-da-carga.int.test.ts:276` manda `begin`, `drop index` e `rollback` por um `pg.Pool`. Se uma consulta cair em outra conexão, o `drop index` é confirmado no banco de teste compartilhado. Use `pool.connect()` (o `test-engineer` apontou o mesmo).
- `apps/api/test/ops-privacidade.int.test.ts:245`: `suboperadoresVigentes: expect.any(Number)` aceita qualquer número. Compare com a contagem lida antes, como o teste anterior já faz.
- `carga.ts` › `executar`: a escolha entre `'dispensada'` e rodar a fase só foi conferida pela execução manual. Extrair essa escolha para uma função pura dá a ela um teste de unidade.
- `docs/arquitetura.md` (o parágrafo novo das filas do F3) diz que o cenário prova que "nada disso atrasa o interativo da B". Hoje isso vale para a fila. Para o Tutor, só depois da correção acima.

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-10 21:08:12 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: fila | migration (só o compose de carga, sem migration nova)
Rate limit: ok (a tarefa não mexe em rate limit)
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok (o `ops:privacidade` lê `pedido_titular`, `arquivo_titular` e `expurgo_execucao` por índices que começam por `escola_id`, numa escola só, e só conta)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok

Bloqueantes:

- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/expurgo-da-carga.ts:441` (com as linhas 417 a 420). **O critério "cada statement < 2 s" não pega o statement que de fato estoura.**
  - O worker roda com `statement_timeout` de 2 s, então o statement lento é cancelado em 2.000 ms.
  - O `pg_stat_statements` só registra o statement que termina. O cancelado não entra em `max_exec_time`, e por isso `maximoMs >= LIMITE_DO_STATEMENT_MS` quase nunca é verdade.
  - O executor (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/src/executor.ts:292-296`) faz até 5 tentativas. A falha que não é a última não deixa rastro em `job_registro`: nem `estado = 'falhou'`, nem `codigo_falha`.
  - O cenário que escapa: a 1ª tentativa do `retencao.expurgar-escola` ou do `titular.eliminar` estoura o teto num lote, a 2ª passa com o cache quente, o job termina `concluido` e a última `expurgo_execucao` de cada categoria fica `concluida`. A fase passa, e na manhã de segunda esse lote corta em 2 s.
  - **Correção exigida:** a fase tem de reprovar qualquer tentativa falha de um job da A, além do máximo medido. Pode ser:
    - (a) contar toda linha `expurgo_execucao` da A com `concluida = false` gravada durante a fase, e não só a última por categoria;
    - (b) para o `titular.eliminar`, um rastro equivalente;
    - (c) ou rodar a fase com uma tentativa só para os jobs da A, por variável do ambiente de carga;
    - (d) ou ler o SQLSTATE 57014 do Postgres de carga, com `log_min_error_statement`.

    Além disso, o teto do critério deve ficar abaixo do `statement_timeout` (por exemplo, 1,5 s), para pegar o que passou perto. Vale como prova um teste de unidade em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/test/expurgo-da-carga.test.ts` em que "tentativa cancelada por timeout seguida de tentativa que conclui" reprova a fase. Sem a correção, esse teste fica vermelho.

Recomendações:

- O "Tutor de B" é o job sintético de CPU, que não escreve em `mensagem_tutor`, `execucao_agente` nem `consumo_ia`, as tabelas que o expurgo atualiza em lote. A contenção real (índice, WAL, I/O nessas tabelas) fica sem medida. A dívida está declarada no `TODO.md` para antes do piloto, mas os documentos dizem mais do que foi provado:
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/lgpd.md` ("O expurgo não atrapalha a aula é provado");
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/arquitetura.md` ("nada disso atrasa o interativo da B").

  Reescrever como "não atrasa a fila interativa da B", até existir o cenário "Tutor em sala".
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/expurgo-da-carga.ts:116`: o `set statement_timeout = 0` vale para a sessão inteira. Com isso, o `drop index` de `medirEscritaDosIndices` (linha 516) espera trava exclusiva sem prazo se algum worker tocar a tabela. Pôr `lock_timeout` na transação da medida, ou devolver o `statement_timeout` depois da semente.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/carga.ts`: em `faseDoExpurgo`, quando `prepararMedicaoDeStatements` falha, o erro é engolido sem registro. Imprimir o motivo, para o `statements_sem_amostra` dizer por que não houve amostra.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-10 22:19:53 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- A escola B usa o turno do Tutor pela rota, com o adaptador falso de latência simulada, durante o expurgo e a troca de nome da A. A fase reprova se o p95 do turno passar da base mais a margem, e também reprova se houver poucas amostras.
- A leitura do turno conta só os da B, só do Tutor, só os concluídos e só os da janela.
- A semente da B dá vínculo só a aluno da B, uma vez só, sem duplicar.
- O statement cancelado pelo `statement_timeout` reprova, e o teto da medida é 1,5 s.
- `set local lock_timeout` na transação da medida.
- `IA_LATENCIA_FALSA_MS` chega ao adaptador falso, com piso, teto e limite abaixo de `LLM_TIMEOUT_MS`.
- As três recomendações aplicadas: `pool.connect()` na medida, o número exato de `suboperadoresVigentes` e `escolherFaseDoExpurgo` como função pura.

**Cobertos:**
- **Correção 1, feita.** `julgarResultadoDoExpurgo` ganhou `turno_b_no_expurgo` e `sem_amostra_da_b` com mínimo de 5 turnos.
  - O teste de unidade cobre o limite exato, um ms acima, o p95 nulo, a base fracionária e menos turnos que o mínimo.
  - Rodei a mutação que tira a comparação `p95Ms > limite`: ela morreu.
  - A janela é lida no banco por `lerTurnoDaBNaJanela`. O teste de integração cobre antes da janela, depois da janela, execução ainda rodando, outra função e outra escola. Rodei a mutação que tira `escola_id = $1`: ela morreu (3 em vez de 2).
  - A base é medida pela mesma função, na janela da fase `base`.
- **Teto de 1,5 s e cancelado pelo log, cobertos.** O teste usa o `TETO_DA_MEDIDA_MS` e 1.600 ms. O log é contado (`contarStatementsCancelados`), a forma de cada cancelado sai na reprovação, e o log não lido vale como `statements_sem_amostra`.
- **`lock_timeout`, coberto.** A ordem dos comandos é conferida depois de cada `begin`.
- **`pool.connect()`, coberto.**
- **`escolherFaseDoExpurgo`, coberto:** os três ramos, e a base 0.
- **`IA_LATENCIA_FALSA_MS`, coberto:**
  - `config-ia.test.ts`: piso, teto, texto vazio e o motivo do prazo.
  - `provedor.test.ts`: a espera de pelo menos 190 ms.
  - `carga.test.ts`: o compose passa a variável às duas APIs e `carga.env` a liga.
- **Sem `.skip`, e nenhum provedor pago.**
- **Testes rodados, todos verdes:** os 4 de unidade (136 testes), `ops-privacidade.int.test.ts` (8) e `expurgo-da-carga.int.test.ts` no projeto infra (16). Restaurei o script depois de cada mutação, e ele ficou idêntico à cópia de antes.

**Bloqueantes:**
1. **`apps/api/test/ops-privacidade.int.test.ts:249`, com `:56` e `:137`.** O teste da escola sem nada só passa se rodar depois do caso principal.
   - Ele espera `vigentesDaBase + 1`. Essa variável só é preenchida na linha 137, dentro do outro teste. O `+ 1` é o fornecedor vigente que esse outro teste grava.
   - Rodado sozinho (`npx vitest run --project integracao apps/api/test/ops-privacidade.int.test.ts -t "escola sem nada"`), ele fica vermelho: `expected { …(7) } to deeply equal { …(7) }`.
   - O processo manda rodar isolado o teste que não passa. Este teste só passa na ordem do arquivo.
   - **Correção exigida:** o teste tem que se bastar.
     - Ele lê o `ops:privacidade` da escola vazia antes e depois de gravar um fornecedor `todas` vigente, um encerrado e um de lista para outra escola, e espera exatamente +1.
     - Ou ele compara com uma contagem SQL direta dos fornecedores globais vigentes, feita no próprio teste.
     - Nos dois casos, sem estado vindo de outro `it`.

**Recomendações:**
- **`infra/scripts/carga.ts:340`, a linha `turnoBaseP95Ms: base.turnoDoBancoP95Ms ?? base.turnoK6P95Ms ?? 0`.**
  - O comentário diz que o zero faz o veredito do banco reprovar. Não faz: com base 0, o limite é 500 ms, e o turno medido (cerca de 380 ms com `IA_LATENCIA_FALSA_MS=300`) passa.
  - Hoje o cenário reprova mesmo assim por outro caminho: sem a base do k6, a fase não sobe ("a fase expurgo precisa de TURNO_BASE_P95_MS"), e o `count>0` da base já falhou.
  - O ramo intermediário compara a medida do banco com a do k6. A do k6 é maior, porque inclui a espera de 100 ms entre leituras, então esse ramo é mais permissivo.
  - Sugestão: extrair para função pura que devolve `sem_amostra_da_b` quando a base do banco é nula, com teste, ou ao menos corrigir o comentário.
- **A fase `base` não exige um mínimo de turnos no banco.** Ela só tem o `count>0` do k6. Uma base com 1 ou 2 turnos daria um p95 de pouco valor. Pode exigir o mesmo `AMOSTRAS_MINIMAS_DO_TURNO` ou mais.
- **`provedor.test.ts`, a asserção `toBeLessThan(150)` sem latência.** Ela depende do relógio da máquina. Hoje é folgada, mas é o tipo de asserção que fica intermitente com a máquina carregada. Pode trocar por "espera menos que a chamada com latência", ou por relógio falso.

Arquivos auditados nesta rodada:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/expurgo-da-carga.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/carga.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/k6/justica-entre-escolas.js`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/test/expurgo-da-carga.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/test/expurgo-da-carga.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/test/carga.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/ops-privacidade.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/config/config-ia.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/config/config-ia.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/provedor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/provedor.test.ts`

## llm-integrator · 1ª rodada · APROVADO · 2026-10-10 22:21:11 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO

Perfis usados: nenhum novo. O turno do Tutor que o cenário exercita usa o perfil `rapido` (`packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:443`), o mais barato e o adequado para esse turno. A tarefa não acrescenta tarefa de IA nem prompt.

Custo estimado por professor/mês: zero chamadas novas em produção. `IA_LATENCIA_FALSA_MS` só atua no `AdaptadorFalso`, e o cenário de carga roda 100% com o adaptador falso (1,5 turno/s da B, 30 alunos sintéticos), sem provedor pago. O custo de IA do produto não muda.

Prompt versionado: não se aplica. Não há prompt novo nem alterado.

Validação de schema: sim, no que a tarefa toca. `IA_LATENCIA_FALSA_MS` entra em `esquemaAmbienteDeIa` (zod, `inteiro(0, 60_000, 0)`) com `superRefine` contra `LLM_TIMEOUT_MS`, e o erro sai tipado (`MOTIVO_LATENCIA_FALSA_MAIOR_QUE_O_PRAZO`). A saída estruturada do modelo não foi alterada.

Aprovação humana no caminho: não se aplica. A tarefa não gera entrega de agente, nota nem comunicação.

Bloqueantes: nenhum.

Conferido:
- **Provedor só nos adapters:** o único ponto novo é `criarProvedorDeIa` (`provedor.ts:272-275`), que repassa `latenciaFalsaMs` ao `AdaptadorFalso`. Nenhum SDK ou chamada fora de `ia/adapters`.
- **Latência só no falso:** com `openai_compat` ela é ignorada. Em `AMBIENTE=producao`, `IA_ADAPTADOR=falso` já é recusado (`config-ia.ts:98`), então a latência simulada não chega à produção.
- **Timeout respeitado:** a espera usa `chamada.sinal` e vira `IA_TEMPO_ESGOTADO` (`adaptador-falso.ts:47-49`). O `superRefine` exige latência menor que o prazo da chamada, e o teste cobre as bordas 4999 e 5000 e o teto de 60 s.
- **Sem chamada paga na carga:**
  - `carga.test.ts` afirma que `IA_ADAPTADOR` efetivo é `falso`.
  - O compose de carga usa `.env.example` com `carga.env` por cima, e nenhum `.env` pessoal entra.
  - O compose passa a variável às duas APIs.
- **Rota real do Tutor:** o k6 chama `POST /v1/tutor/mensagens` com texto sintético, `chaveEnvio` única por turno e limite de 1,5 turno/s, abaixo do teto de 120 pedidos de IA por minuto por escola e por usuário. Isso é verificado em `carga.test.ts`.
- **Testes sem provedor:** unidade com adaptador falso. A mutação de `provedor.ts` e as de `config-ia.ts` estão ligadas a testes que ficam vermelhos.

Recomendações:
1. `packages/nucleo/src/ia/provedor.test.ts:131-141`: a asserção `expect(await chamar()).toBeLessThan(150)` mede relógio de parede e pode ficar intermitente em esteira carregada. A ausência de latência se prova mais firme com `vi.useFakeTimers`, ou ficando só com o limite inferior de `chamar(200)`.
2. `packages/nucleo/src/config/config-ia.ts:102`: a comparação `IA_LATENCIA_FALSA_MS >= LLM_TIMEOUT_MS` roda também com `openai_compat`, onde a variável é ignorada. Tem efeito mínimo, mas poderia valer só com `IA_ADAPTADOR === 'falso'`.
3. `infra/compose.yml:211`: `IA_LATENCIA_FALSA_MS` usa `:?` (obrigatória), então todo `.env` de staging ou desenvolvimento sem a linha deixa de subir. O `.env.example` cobre o caso, mas `:-0` seria mais tolerante, já que o default do esquema é 0.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-10 22:21:24 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO

Tabelas verificadas: não há migration nem tabela nova nesta rodada. A semente da escola B por SQL, em `semearTutorDaB`, grava em tabelas que já existem: `ano_letivo`, `serie`, `turma`, `conta`, `usuario` e `vinculo`. Todas as linhas de escola recebem o `escola_id` da B, e `turma` e `vinculo` também levam o `ano_letivo_id`. A semente da escola A, em `execucao_agente`, foi conferida com o estado `concluida`, e cada linha carrega o `escola_id` e o `ano_letivo_id` da A. A semente da B não grava material, atividade nem sala, ao contrário do que a ordem dizia. O `TODO.md` declara essa ausência como pendência do cenário "Tutor em sala".

Queries verificadas:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/expurgo-da-carga.ts`:
  - `semearTutorDaB` (l. 359–393): o ano, a turma e o autor são lidos com `escola_id = $1`. O vínculo nasce só para `usuario.escola_id = $1`, e o `not exists` também fica dentro da escola (l. 389). A turma e o autor do vínculo vêm sempre da própria B.
  - `lerTurnoDaBNaJanela` (l. 400): lê só `escola_id = $1`, só `funcao = 'tutor_com_o_aluno'`, só `estado = 'concluida'` e só a janela da fase.
  - `contarStatementsCancelados` e `formasDosStatementsCancelados` (l. 432–446): leem o log do Postgres do projeto de carga e não decidem escopo. Nenhuma das duas vira endpoint.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/carga.ts`: a semente da B roda antes de cada fase `base` ou `expurgo`. A medida da base usa a mesma leitura limitada à B.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/k6/justica-entre-escolas.js`: o turno do Tutor usa as rotas que já existem (`POST /v1/tutor/mensagens` e `GET /v1/execucoes/:id`). O escopo vem do token de aluno da B (`b_tutor`), e nenhum `escolaId` sai do cliente.
- `apps/api/src/ops/*` não mudou desde a rodada aprovada. O teste `ops-privacidade` só ficou mais estrito: a escola vazia agora espera `vigentesDaBase + 1`, no lugar de `expect.any(Number)`.

Teste de isolamento: presente e efetivo, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/test/expurgo-da-carga.int.test.ts`.
- Turno da B: o teste grava um turno de outra escola, dentro da janela e com 8.000 ms. Se o filtro `escola_id = $1` sair de `lerTurnoDaBNaJanela`, as amostras viram 3 e a máxima passa de 950 ms, e o teste quebra.
- Semente da B: se o filtro `u.escola_id = $1` sair de `semearTutorDaB`, o aluno da outra escola ganha vínculo na B. A asserção `toEqual([...alunosDaB].sort())` então quebra.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/test/expurgo-da-carga.int.test.ts:284`: a asserção filtra por `escola_id = outra`. Ela passaria mesmo sem o filtro de escola, porque o vínculo indevido nasceria com o `escola_id` da B. Filtrar só por `usuario_id = deOutra` a deixaria efetiva por si. Hoje quem prova a regra é a asserção sobre os vínculos da B, algumas linhas acima.
- `formasDosStatementsCancelados` imprime o texto do statement que o Postgres escreve no log. No cenário de carga o dado é sintético. Se a função for reaproveitada fora do projeto de carga, o texto precisa passar antes pelo `privacy-guardian`, porque statement com literal pode carregar dado.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-10 22:21:34 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo no esquema. Esta rodada só mexe em dado sintético do cenário de carga.
- `semearTutorDaB` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/expurgo-da-carga.ts:724-758`) grava `ano_letivo`, `serie`, `turma` e `vinculo` de aluno. Se a escola B não tiver ninguém da equipe, grava também uma `conta` e um `usuario` de coordenação, com o e-mail `coordenador-<uuid>@carga.invalid` e o nome "Coordenação sintética da carga".
- Os alunos vêm do `ops:sessao-sintetica`, que já existia e só roda com `AMBIENTE=local` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/sessoes-sinteticas.ts:25-34`). Aluno não ganha e-mail: o `sintetico-…@educa.invalid` vai na `conta`, como antes.
- O texto do turno é fixo e inventado: "Pergunta sintética de carga sobre o assunto da aula."

Fora da tabela de dados do docs/lgpd.md: nada. A mudança em `docs/lgpd.md` só descreve o cenário de carga.

Autorização por objeto: ok. Não há rota nova. O k6 chama `POST /v1/tutor/mensagens` e `GET /v1/execucoes/:id` com o token do próprio aluno, e as duas rotas já passavam pela verificação existente. A semente cria vínculo só para os alunos da B; o teste de integração prova que o aluno de outra escola fica sem vínculo (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/test/expurgo-da-carga.int.test.ts:1023-1045` no patch). `lerTurnoDaBNaJanela` filtra por `escola_id`, e o teste prova que a execução da outra escola fica de fora.

Logs: limpos.
- `contarStatementsCancelados` só conta a mensagem de erro do Postgres.
- `formasDosStatementsCancelados` imprime o texto do `STATEMENT:` cortado em 160 caracteres. Os parâmetros não aparecem: o compose de carga não liga `log_parameter_max_length_on_error`, e as consultas da semente passam o nome como `$n`.
- O log do Postgres que o script lê é o do projeto `educa-carga`, que só tem dado sintético.

Auditoria: não se aplica. Não há leitura nominal pela coordenação ou pela rede, exportação, nota, permissão nem aprovação de saída de IA.

Envio externo: nenhum. `IA_LATENCIA_FALSA_MS` só vale para o adaptador falso, que declara `SEM_ENVIO_EXTERNO` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/provedor.ts:272-274`). O adaptador `openai_compat` a ignora, e o adaptador falso continua barrado em produção (`MOTIVO_ADAPTADOR_FALSO_EM_PRODUCAO`). Os turnos de carga gravam a `execucao_agente` pelo caminho normal da porta. O teste exige que o cenário use o adaptador falso (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/test/carga.test.ts`, caso "a latência simulada do Tutor chega à API do cenário").

Seed/fixture: sintético. As execuções da semente da A passaram a nascer `concluida`, com resultado de id aleatório e sem texto novo. O nome do titular continua "Eliane Carga Sintética".

Bloqueantes: nenhum.

Recomendações:
1. `formasDosStatementsCancelados` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/expurgo-da-carga.ts:801-811`) imprime o texto bruto do statement do log, e não a forma normalizada do `pg_stat_statements`. Hoje não há risco, porque o banco é sintético. Mas, se a função for reaproveitada contra o log de um banco com dado real, um SQL com valor literal no texto sairia na tela. Vale registrar no comentário que ela só serve ao projeto de carga, ou trocar os literais entre aspas por `'…'` antes de imprimir.
2. A descrição da ordem diz que a semente da B leva "alunos, material, atividade, sala". O código cria só ano, série, turma e vínculos, como dizem o `TODO.md` e a Tech Spec. Não muda nada para a LGPD; fica o registro para o `/retro`.
3. A rodada anterior foi aprovada sem correções exigidas, então não havia nada a conferir. Pergunta de fechamento: esta rodada não mexe no que responde ao pedido da secretaria, e a resposta continua a da 1ª rodada.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-10 22:21:47 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As sete divergências estão na `techspec.md` §7c, na linha 35 e na tabela da seção 6, e as do cenário de carga também estão no `cenarios.md`, item "Carga". `docs/infra.md` seção 10, `docs/runbook.md`, `docs/lgpd.md`, `docs/arquitetura.md` e `TODO.md` agora descrevem o que o código faz.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

Bloqueantes: nenhum.

As correções exigidas na 1ª rodada foram feitas:
1. **19.1, caminho (a).** A escola B agora usa o Tutor pela rota `POST /v1/tutor/mensagens`, com o adaptador falso e a latência ligada por `IA_LATENCIA_FALSA_MS` (300 ms em `infra/carga.env`). O turno lê e grava `execucao_agente`, `mensagem_tutor` e `consumo_ia`, as tabelas que o expurgo da A atualiza. O critério novo `turno_b_no_expurgo` reprova quando o p95 do turno durante o trabalho da A passa da base mais 500 ms; as duas medidas vêm do banco (`lerTurnoDaBNaJanela`). Os documentos deixaram de dizer que o "Tutor de B" era o job sintético do F0.
2. **As seis recomendações que a Mesa mandou aplicar** estão no código:
   - `pool.connect()` na medida dos índices;
   - `vigentesDaBase + 1` no lugar do `expect.any(Number)`;
   - a escolha da fase extraída para `escolherFaseDoExpurgo`, com teste;
   - o teto da medida em 1,5 s (`TETO_DA_MEDIDA_MS`), e o statement cancelado pelo `statement_timeout` contado no log do Postgres;
   - `set local lock_timeout` antes do `drop index`;
   - o erro de `prepararMedicaoDeStatements` impresso na saída.

Recomendações:
- **Comentário falso na base que falta.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/carga.ts:339-340`, o comentário diz que o zero "faz o veredito do banco reprovar junto". Não faz: com base 0 o limite fica em 500 ms, e o turno medido (cerca de 380 ms) passaria. Quem reprova é o threshold `turnos_b_concluidos count>0` do k6 da base. Além disso, o recuo `?? base.turnoK6P95Ms` compara a medida do k6 (POST mais as leituras de estado) com a do banco (`criada_em` a `concluida_em`). Sugestão: tirar o recuo para o k6 e corrigir o comentário.
- **Erro engolido na leitura dos statements.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/carga.ts:328`, `lerStatements(...).catch(() => undefined)` descarta o erro sem imprimir. Imprimir como já se faz em `prepararMedicaoDeStatements`.
- **Nome do critério.** `statement_acima_de_2s` agora dispara a partir de 1,5 s ou por cancelamento no log. O runbook explica, mas o nome induz a erro. Vale renomear (por exemplo, `statement_no_teto`) junto com o runbook.
- **Texto da 19.1 diferente nos dois documentos.** A subtarefa 19.1 em `tasks.md` ficou com o texto antigo, e a de `19_task.md` foi reescrita (agora cita `IA_LATENCIA_FALSA_MS`, a rota e o log). Melhor alinhar os dois.
- **Divergência apontando para um lugar só.** Na tabela de divergências de `19_task.md`, a linha do mínimo de 5 turnos aponta só para o runbook, e a `techspec.md` §7c também registra isso. Incluir a referência à Tech Spec.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-10 22:21:54 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO
Caminho quente tocado: tutor | IA (adaptador falso com latência simulada, só no teste de carga)
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica (a variável nova só existe no adaptador falso, e a espera respeita o sinal de cancelamento da chamada)
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

As três exigências da rodada anterior foram cumpridas:
- **Correção 1, o statement cancelado reprova a fase.** A fase conta no log do Postgres a mensagem `canceling statement due to statement timeout` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/expurgo-da-carga.ts`, `contarStatementsCancelados` e `julgarResultadoDoExpurgo`).
  - Basta um cancelado para reprovar como `statement_acima_de_2s`, mesmo que o máximo medido seja baixo.
  - Se o log não for lido, a fase reprova como `statements_sem_amostra`. Não passa por acaso.
  - O `statement_timeout` é do próprio Postgres (`packages/nucleo/src/db/pool.ts:186`), e não do cliente, então o corte aparece no log.
  - O `docker compose logs` manda o stderr do container para o stdout, e é só o stdout que o `rodar` captura. Testei com Compose 5.6.0 e o log chega.
- **O teto da medida é 1,5 s.** `TETO_DA_MEDIDA_MS = 1_500`, abaixo dos 2 s do corte, e um teste confere essa ordem.
- **O teste de unidade pedido existe.** "tentativa cortada seguida de repetição que passa" reprova com `statementsCancelados: 1` e o resto limpo, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/test/expurgo-da-carga.test.ts`.
- **As duas recomendações que a Mesa mandou aplicar estão feitas.** A medida dos índices roda com `set local lock_timeout = '5s'` logo depois de cada `begin`, e o teste confere a ordem. Quando `prepararMedicaoDeStatements` falha, a saída imprime o motivo.

Sobre o turno do Tutor da B, que entrou nesta rodada:
- O turno passa pela rota de verdade, com o limitador da escola e o do aluno.
- A cadência fica abaixo dos tetos, e um teste prova isso contra as constantes da API: 1,5 turno por segundo, ou 90 por minuto, para um teto de 120 por escola; e 3 por minuto por aluno, para um teto de 12.
- O k6 reprova qualquer 429 ou resposta inesperada do grupo `b_tutor`.
- O tempo do turno é lido no banco só dentro da janela do trabalho da A, filtrado pela escola B e pela função do Tutor. Há mínimo de amostras e limite de base mais 500 ms.
- A semente da A passou a gravar as execuções como concluídas. Assim a varredura da API não tenta falhar 250 mil execuções de uma vez, o que distorceria a medida.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/compose.yml:211`: com `${IA_LATENCIA_FALSA_MS:?…}`, a variável vira obrigatória em todo `.env` local. Quem já tem o `.env` sem ela não consegue mais subir o compose. Com `${IA_LATENCIA_FALSA_MS:-0}`, quem não usa o adaptador falso não precisa definir nada.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/compose.carga.yml:35`: o critério de cancelamento depende de dois padrões do Postgres, `log_min_messages` e `log_min_error_statement`. Vale fixar `-c log_min_error_statement=error` no comando do Postgres de carga, para que uma mudança de configuração não apague em silêncio a linha `STATEMENT:` e, com ela, o nome do statement cortado.
- O log lido cobre a fase inteira, não só os jobs da A. Um corte na própria B ou na varredura da API também reprova como `statement_acima_de_2s`. Isso é conservador e não bloqueia, mas o runbook poderia dizer que o statement mostrado na saída é o primeiro lugar a olhar.

## test-engineer · 3ª rodada · APROVADO · 2026-10-10 22:32:46 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** só a correção da 2ª rodada. O caso "a escola sem nada tem zero em tudo, com a data nula" tem que se bastar, sem estado vindo de outro `it`. E o `todas` encerrado tem que chegar de fato ao comando, de modo que tirar o filtro `empresa.fim === null` derrube o teste. Também conferi as duas recomendações aplicadas (`carga.ts` e `provedor.test.ts`).

**Cobertos:**
- **Independência.** Em `apps/api/test/ops-privacidade.int.test.ts:236-257`, a variável `vigentesDaBase` saiu. O caso lê o `ops:privacidade` da escola vazia antes e depois de gravar três suboperadores: um `todas` vigente, um `todas` encerrado e um de lista de outra escola. Espera exatamente `antes + 1`. Rodei o caso sozinho (`-t "a escola sem nada"`) e passou.
- **Mutação.** Troquei `suboperadores.filter((empresa) => empresa.fim === null).length` por `suboperadores.length` em `apps/api/src/ops/privacidade.ts:73`. O caso sozinho ficou vermelho, com `suboperadoresVigentes` 2 em vez de 1. Então o `todas` encerrado entra mesmo na contagem sem o filtro, e o `update escola set criada_em = now() - interval '10 days'` (linha 239) faz o trabalho que o diagnóstico descreve. Desfiz a mutação com o `sed` inverso, porque o arquivo não está no git e o `git checkout` não serve, e conferi a linha 73 de volta como estava.
- **Arquivo inteiro.** `ops-privacidade.int.test.ts` passou 8 de 8.
- **`provedor.test.ts:136-144`.** Passou 40 de 40. A comparação agora é entre as duas chamadas (`sem < com`, com `com >= 190`), sem limite por relógio de parede. Se a opção de latência for removida, o teste continua falhando no `com >= 190`.
- **`infra/scripts/carga.ts:339-342`.** O comentário confere com o código: `infra/k6/justica-entre-escolas.js:121` recusa subir a fase expurgo sem `TURNO_BASE_P95_MS`, e a base do k6 deixou de entrar no lugar da base do banco.
- **`TODO.md`.** As novas entradas (o mínimo de turnos da fase `base`, e os itens (a) a (c) do cenário do expurgo) registram dívida e não precisam de teste nesta tarefa.

**Bloqueantes:** nenhum.

**Recomendações:**
- Em `ops-privacidade.int.test.ts:240-253`, o "antes e depois" lê a tabela global `suboperador`. Se outro arquivo de integração gravar um suboperador `todas` vigente entre as duas leituras, o `+1` vira `+2`. O caso principal tem o mesmo risco desde as rodadas anteriores. Comparar com um `count` SQL filtrado pelos ids que o próprio teste criou eliminaria isso. Fica para o `/retro`.

## infra-guardian · 3ª rodada · APROVADO · 2026-10-10 22:33:25 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila | IA (só no cenário de carga e no teste do adaptador falso; o código de produto não mudou nesta rodada)
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

Rodada 3: olhei só o que mudou desde a rodada 2 (`.processo/ordens/diff-19_task-r3.patch`).

- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/carga.ts:342`: agora `turnoBaseP95Ms: base.turnoDoBancoP95Ms ?? 0`. As duas medidas continuam separadas. O limite do k6 ainda usa `base.turnoK6P95Ms` (linha 321). O veredito do banco, sem a base do banco, cai para o limite mais apertado (só os 500 ms de margem) e não herda mais a medida maior do k6. Se a base faltar, o cenário reprova em vez de passar por acaso.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/provedor.test.ts:139-144`: só o teste mudou. Ele roda primeiro a chamada com espera, mede as duas e compara uma com a outra, sem limite fixo de tempo. Continua usando o adaptador falso e não chama provedor pago.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/ops-privacidade.int.test.ts:236-253`: o `it` da escola vazia agora cria o próprio dado e lê o próprio "antes". Antes ele dependia de uma variável preenchida por outro `it`, e isso acabou.

Recomendações:
- `faseDoExpurgo` não tem teste de unidade para o caso em que a base do banco não existe (`turnoDoBancoP95Ms` nulo, o veredito aplica só a margem). Vale entrar junto com o critério de mínimo de turnos na fase `base`, que já está no `TODO.md`.

## llm-integrator · 2ª rodada · APROVADO · 2026-10-10 22:33:27 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO

Perfis usados: nenhum novo. A 19.0 não cria tarefa de IA nem chamada de modelo. A mudança nesta camada é o `latenciaFalsaMs` do adaptador falso, que só vale com `IA_LATENCIA_FALSA_MS > 0` e nunca alcança provedor pago, e o par `envioExterno`/`provedorId` na medição e no consumo.

Custo estimado por professor/mês: R$ 0, sem chamada nova de modelo. A carga da 19.0 roda com o adaptador falso e latência simulada (regra 80, item 11).

Prompt versionado: não se aplica (nenhum prompt novo ou alterado na tarefa).

Validação de schema: não se aplica (nenhuma saída estruturada nova; as existentes não mudaram).

Aprovação humana no caminho: não se aplica (a tarefa não produz entrega de agente).

Bloqueantes: nenhum.

Verifiquei o diff desde a rodada anterior (`.processo/ordens/diff-19_task-r3.patch`) e o estado atual de `packages/nucleo/src/ia/provedor.test.ts:128-146`. A recomendação anterior foi aplicada: o `toBeLessThan(150)` por relógio de parede saiu e o teste compara as duas chamadas (`sem < com`). A `com` roda primeiro e é afirmada com `>= 190`, o que prova que a latência é aplicada. Os outros arquivos do diff (`TODO.md`, `ops-privacidade.int.test.ts`, `infra/scripts/carga.ts`, `estado.md`) estão fora do meu escopo e não tocam porta, perfil, adaptador, prompt nem registro de execução.

Recomendações:
- `packages/nucleo/src/ia/provedor.test.ts:143`: o `expect(sem).toBeLessThan(com)` não pega a mutação "a latência vira padrão de 200 ms mesmo sem a opção". Nesse caso `sem` e `com` ficam em torno de 200 ms e a comparação passa ou falha ao acaso. Um limite relativo mais firme, como `sem < com - 100`, fecharia esse caso sem voltar ao valor absoluto. É melhoria, não bloqueante.
- Os itens (a) a (c) da dívida de `infra/scripts/carga.ts` já estão no `TODO.md`, com a ressalva de que `track=all` e o `STATEMENT:` bruto só servem ao projeto `educa-carga` com dado sintético. Estão corretamente registrados e não tocam a camada de IA.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-10 22:33:34 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

O que conferi nesta rodada, contra o diff `85761756..ae373f0c`:
- **Escola vazia** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/ops-privacidade.int.test.ts:236-257`): o caso já não lê variável preenchida por outro `it`. Ele lê o próprio valor de partida (`antes`) e grava os seus três `suboperador`. Recuar `criada_em` em dez dias faz o `todas` encerrado ontem chegar ao comando. Assim, a mutação de `empresa.fim === null` (linha 96 de "Mutações") passa a ter efeito de verdade nesse caso, como o documento declara.
- **Base do turno** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/carga.ts:339-342`): o `?? base.turnoK6P95Ms` saiu. Isso está certo, porque a medida do k6 é outra e não pode ocupar o lugar da medida do banco. O `turnoK6P95Ms` continua em uso no threshold do k6 (`carga.ts:321`), então não sobrou código morto. O comentário novo descreve o comportamento com fidelidade.
- **Latência** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/provedor.test.ts:139-144`): o teste agora compara as duas chamadas e já não depende da velocidade da máquina. A mutação da linha 118 continua sendo pega pelo `>= 190`.
- **`TODO.md`**: as recomendações de "Recomendações sem aplicar" que dizem ir para o `TODO.md` estão de fato lá, cada uma com origem e com a condição para reabrir.

Recomendações:
- `carga.ts:342`: quando a base medida no banco vem nula, o limite fica em 500 ms. Com a latência falsa de 300 ms, o turno passa desse limite por acaso. Isso só não importa hoje porque o `count>0` da base do k6 já reprova antes. Quando entrar o mínimo de turnos da base, que já está no `TODO.md`, a fase deve reprovar explicitamente sem a base do banco, e não depender só da margem.

## privacy-guardian · 3ª rodada · APROVADO · 2026-10-10 22:33:39 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO

Esta é a 3ª rodada. Auditei só o diff `85761756..ae373f0c` (`.processo/ordens/diff-19_task-r3.patch`) e o que ele afeta. O que não mudou continua aprovado como na 2ª rodada.

Campos pessoais tocados: nenhum campo novo e nenhuma migration. O teste altera `escola.criada_em` (data da escola, não de pessoa) e grava três linhas em `suboperador`, com nome de empresa e contrato sintéticos.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: ok. O comando continua aceitando só `--escola <uuid>`, e a escola inexistente recebe `NAO_ENCONTRADO` fixo, sem o id. O caso da escola vazia agora prova o escopo também nos suboperadores:
- o `todas` vigente passa a valer para ela (+1);
- o `todas` encerrado ontem não vale;
- o de lista ligado só à escola A não vale.

A atualização de `criada_em` para dez dias atrás é o que faz o caso do encerrado provar alguma coisa, e não passar por acaso.
Logs: limpos. O diff não adiciona log. O comentário de `infra/scripts/carga.ts:339-341` só troca a origem do número usado como base (`turnoDoBancoP95Ms ?? 0`, sem cair para o número do k6) e não mexe em nada que saia em log.
Auditoria: presente. O diff não cria ação que exija auditoria.
Envio externo: nenhum. A mudança em `packages/nucleo/src/ia/provedor.test.ts` só reordena a medição de latência do adaptador falso.
Seed/fixture: sintético. As sentinelas usam `marca` aleatória, os e-mails são `@escola.invalid` e `@privacidade.invalid`, o país é `BR` e o `registrado_por` é `equipe-de-teste`. Os três suboperadores novos entram no array `suboperadores` e são apagados no `afterAll` (`apps/api/test/ops-privacidade.int.test.ts:126-127`), sem sobra no banco. A saída da escola vazia é conferida com `toEqual` sobre o objeto inteiro, então nenhum campo a mais (sentinela, nome de empresa, id de outra escola) passaria sem quebrar o teste.
Bloqueantes: nenhum.
Recomendações:
- As recomendações da 2ª rodada estão registradas no `TODO.md` com a referência certa: o item (c) da entrada do cenário do expurgo, sobre o `STATEMENT:` bruto e o texto de `lerStatements` valerem só no projeto `educa-carga`, e a entrada da semente da B sem material, atividade e sala. Nada a acrescentar.
- O caso da escola vazia depende do caso principal ter rodado antes só para ter a escola A no `beforeAll`, e isso já está garantido. A dependência entre os dois `it`, que gerou a escalada, saiu: `vigentesDaBase` foi removida e a base agora é lida no próprio caso.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/ops-privacidade.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/scripts/carga.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/provedor.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/TODO.md`

## tenancy-guardian · 3ª rodada · APROVADO · 2026-10-10 22:33:40 · `tasks/prd-lgpd-e-titular/19_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta rodada. Entre `85761756` e `ae373f0c` não mudou nada em `apps/api/src/ops/*`, e não há migration no diff.

Queries verificadas:
- Nenhuma query de produto mudou. O `ops:privacidade` continua contando os suboperadores por `SuboperadorDaEscolaRepository.daEscola()`, com a escola tirada do contexto por `exigirEscolaDoContexto()`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/suboperador-da-escola.repository.ts:56`.
- O filtro `alcance = 'todas' or exists (ligação com a escola)` está nas linhas 80 a 85 do mesmo arquivo.
- Não há `@SemEscopo` novo.
- O `comando.ts` está igual ao que aprovei na 2ª rodada.

Teste de isolamento: presente e efetivo. O caso da escola vazia, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/ops-privacidade.int.test.ts:236-257`, agora monta os próprios dados: lê a contagem de antes e depois grava três suboperadores, um `todas` vigente, um `todas` encerrado e um `lista` só da escola A. Removendo cada cláusula de cabeça, o teste quebra nos três casos:
- **Sem o `exists` da ligação:** o suboperador `lista` da escola A passa a contar para a escola vazia. O resultado vira +2 e o teste falha.
- **Sem o filtro `fim === null` em `privacidade.ts:73`:** o `todas` encerrado passa a contar. Também vira +2 e o teste falha.
- **Sem o corte por `criada_em`:** o `update escola set criada_em = now() - interval '10 days'` da linha 239 garante que o `todas` encerrado chega ao comando. Sem esse `update`, o caso não provaria nada.

O caso também deixou de ler a variável `vigentesDaBase`, que era preenchida por outro `it`, e passa rodando sozinho.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. A da rodada anterior (a asserção do vínculo de outra escola em `expurgo-da-carga.int.test.ts:284`) continua recusada, com o motivo registrado no documento, e não reabro.

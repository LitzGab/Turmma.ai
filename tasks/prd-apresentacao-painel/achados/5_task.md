# Achados das revisões — `tasks/prd-apresentacao-painel/5_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-25 02:34:27 · `tasks/prd-apresentacao-painel/5_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** I1, I3, I4, I5, I6 (as oito rotas, inclusive 400, 404, 409 e 503), L1, L2, L3, L4. Também a permissão (credencial de escola não alcança as rotas novas, e o `rl:op` conta nelas), o isolamento (cada escola com as suas contagens e o seu uso) e as bordas do domínio: duas disciplinas na mesma turma, aluno transferido, virada de ano letivo, escola sem ano em curso, professor em duas escolas, dois alunos com o mesmo nome e turma sem professor alocado.

**Cobertos:**
- **I1** (`apps/api/test/arquitetura.test.ts`): os três métodos com `@SemEscopo` e a justificativa que cita o painel. Só o `painel.service.ts` importa o repository, e há um teste mostrando que a varredura reprova quem importa de fora (import, reexportação e `import()`).
- **I3**: as varreduras C36, C41 e C46 passaram a comparar a lista exata de rotas (`ROTAS_COM_SESSAO_DE_OPERADOR`), e não mais `arrayContaining`. Com isso, o caso de permissão (sessão de escola, desafio, cookie de escola e nenhuma credencial) vale também para `GET /escolas` e `GET /uso`.
- **I4 e L1** (`apps/api/test/painel-leitura.int.test.ts:184-263`): todas as bordas da L1 aparecem, cada uma com o segundo dado que a torna observável:
  - P1 com duas disciplinas conta uma vez;
  - vínculo pendente e contestado não contam;
  - usuário desativado, professor ou aluno, não conta;
  - vínculo encerrado não conta, nem o `confirmado` com `encerrado_em`;
  - o ano de 2025 não conta;
  - a escola C tem um ano planejado e um encerrado e mostra zero;
  - P2 com a mesma conta em A e em B conta nas duas;
  - A2 em duas turmas conta uma vez.
  
  Como todas as pessoas têm o mesmo nome, o teste também prova que a contagem é por id, não por nome. O `toStrictEqual` do item prova o DTO fechado.
- **I5** (`:266-301`): a escola com mais uso recebe o id maior, então a ordem só sai certa com a correlação por escola. Vale no `/uso` e na lista em `ordem=uso`.
- **L2** (`:304-373`): relógio fixo, pico em vez de soma, hoje fora, dia 1, 1º de janeiro, 22h e 23h59:59 de São Paulo e a virada à meia-noite, e a escola sem linha mostrando zero.
- **L3** (`:375-428`): 30 escolas, as duas ordens, o total vindo do banco, nenhuma repetida nem faltando, a sequência inteira monótona com desempate por id, um empate atravessando o corte de página e a página depois da última vazia. O arquivo roda em série (`fileParallelism: false`), então o total não oscila.
- **I6** (`:431-573`): sentinelas em cada tabela de pessoa e no operador. As oito rotas saem com 200, 201, 204, 400, 404, 409 e 503. O 503 vem de tabela ou trava seguras pelo teste. Há a garantia de que a escola das sentinelas está de fato nas respostas, então a verificação não passa por falta de dado.
- **L4** (`painel-convite.int.test.ts:802-831`): os sete estados montados pelos caminhos de verdade, comparados com o estado que a escrita usa. O `conviteId` sai `undefined` em `sem_convite`, e com dois convites o último é o refeito.
- **Contratos** (`packages/shared/src/operacao/painel.test.ts`): a consulta estrita (parâmetro repetido, campo a mais, limites da página) e as respostas estritas.
- Não há `.skip`, `.only`, teste comentado nem `any`. Não há mock de coisa nossa e não há IA.

**Bloqueantes:**

1. **`apps/api/src/operacao/painel.repository.ts:90`, a chave da ordem `uso`: o período do mês que ela usa não tem teste que o prove.** A chave repete, numa subconsulta separada, a regra do mês de referência ("do dia 1 até o último dia fechado"), mas os testes não cobrem essa cópia:
   - A L2 (`painel-leitura.int.test.ts:306-315`, a `usoEm`) só pede `ordem: 'nome'`, então a mutação "mês inteiro" e a "mês sem limite inferior" que vocês rodaram atingiram só a `no_mes` da linha 219.
   - A I5 e a L3 semeiam uso só no dia de referência e no dia 1 do mês. Nenhuma tem linha de hoje nem do mês anterior.
   
   Na prática:
   - **Tirar o limite inferior da chave** (`u.dia <= dia`, sem o dia 1) não reprova nenhum teste: a ordem passaria a contar o mês anterior, e a tela mostraria números que não batem com a ordem.
   - **Tirar o limite superior** hoje só reprova por acaso. As escolas da L2, com linhas em 2031, ficam no banco até o `afterAll`, e a verificação de ordem monótona da L3 tropeça nelas. Rodando a L3 sozinha (`-t L3`), ou com a ordem dos `describe` trocada, a mutação passa.
   
   **Correção exigida:** na L2, com o relógio fixo, pedir `servico.uso({ ordem: 'uso' })` e `servico.escolas({ ordem: 'uso' })`, todas as páginas, para duas escolas novas em que a ordem só sai certa com os dois limites. Por exemplo, relógio em `2031-10-15T15:00:00Z`:
   - escola X, com o id **menor**: 10 requisições entre 01/10 e 14/10, mais 9.000 em 15/10 (hoje) e 9.000 em 30/09;
   - escola Y, com o id **maior**: 50 requisições entre 01/10 e 14/10.
   
   Exigir Y antes de X nas duas rotas. Com o desempate por id contra, qualquer das duas mutações da chave deixa o teste vermelho.

**Recomendações:**
- **Turma sem professor alocado:** acrescentar na escola A uma turma de 2026 sem nenhum vínculo e esperar `turmas: 3`. Hoje, contar as turmas a partir de `vinculo` em vez de `turma` passa na I4, porque t1, t2 e tb têm professor. É o caso da A1: a coordenação importa as turmas antes de alocar professor.
- **Aluno com vínculo `pendente` ou `contestado`:** a Tech Spec conta o aluno pelo vínculo sem `encerrado_em`, sem olhar o estado, e nenhum teste prova isso. Se alguém acrescentar `estado = 'confirmado'` para aluno, nada fica vermelho. Vale um aluno pendente em A que conta, ou uma frase no teste dizendo que o estado do aluno não importa.
- **Relógio real na I5 e na L3:** as duas usam `referenciaDoUso(new Date())` e comparam com a API, que calcula a própria referência. Se a execução cruzar a meia-noite de São Paulo (03h UTC), o teste falha à toa. Ler a referência pelo `dia` e `mes` da primeira resposta, ou injetar o relógio na API de teste.
- **Log na I6:** o `painel-leitura.int.test.ts` captura `linhasDeLog` e nunca verifica o conteúdo. Uma linha verificando que nenhuma sentinela aparece no log cobre de graça o 503 do gerar, que leva o nome e o e-mail da coordenação nos parâmetros da consulta. O `mapearErroPostgres` já os descarta, mas o 503 do gerar não tem essa prova em nenhum arquivo.
- **Índice novo:** o índice `usuario_coordenador_ativo_idx` e o plano da consulta estão só documentados no `5_task.md`. Um teste simples, que confira que o índice existe com o predicado parcial, evita que uma migration futura o derrube sem ninguém perceber.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-leitura.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md`

## test-engineer · 2ª rodada · APROVADO · 2026-09-25 02:37:03 · `tasks/prd-apresentacao-painel/5_task.md`

VEREDITO: APROVADO

A correção exigida foi feita, e os acréscimos da rodada provam as regras que dizem provar.

**Cenários exigidos:**
- A ordem por uso conta só do dia 1 até o último dia fechado. Isso vale no `/uso` e na lista, com o relógio parado.
- As contagens do ano em curso na I4/L1: turma sem professor alocado, aluno com vínculo `pendente`, professor com duas disciplinas na mesma turma, a mesma conta em duas escolas, vínculo encerrado e usuário desativado.
- O período no relógio de São Paulo (L2).
- A paginação estável nas duas ordens (L3).
- Nenhuma pessoa aparece nas respostas nem no log das oito rotas, inclusive nos 503 (I6).
- O índice parcial dos coordenadores ativos existe.

**Cobertos:**
- **Correção 1 (ordem `uso`):** feita em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-leitura.int.test.ts:381-397`. É o cenário exigido, e as duas mutações quebram o teste:
  - Sem o limite inferior (`dia >= primeiroDoMes`), X passa a contar 9.010 (o mês anterior entra) e fica antes de Y.
  - Sem o limite superior (`dia <= dia de referência`), X também passa a contar 9.010 (hoje entra) e fica antes de Y.
  - A escola com mais uso tem o id maior, então sem a chave certa o desempate por id põe X primeiro.
  - As duas rotas são percorridas página a página, e o teste confere que o `mes` de X é 10.
- **I4/L1 (`:206`, `:223-226`, `:262`, `:274`):**
  - A turma `2ºD` sem vínculo leva a contagem de turmas a 3. Se a contagem exigisse vínculo, daria 2.
  - O aluno `pendente` leva a contagem de alunos a 3. Se o aluno exigisse vínculo `confirmado`, daria 2.
- **I5, L3 e I6:** semeiam o uso no dia de referência lido da própria API (`referenciaDaApi`, `:152-157`). Se a meia-noite cair entre a semeadura e a leitura, o `uso()` falha de forma explícita (`:142`, `:307`), sem passar em silêncio.
- **I6:** o log é zerado em `:509`, e `:616-618` exige que ele tenha linhas e que nenhuma delas traga uma sentinela, inclusive nos 503.
- **Índice (`:281-286`):** o teste confere o `indexdef` completo, com o predicado parcial, e ele bate com `packages/nucleo/drizzle/0016_usuario_coordenador_ativo.sql`.
- O arquivo não tem `.skip`, `.only` nem `todo`. Nenhum arquivo de produção mudou desde a 1ª rodada.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova.

**Aviso operacional:** rodei `apps/api/test/painel-leitura.int.test.ts` duas vezes (por volta das 02:36) enquanto o `portao-local.ts --infra` já rodava no mesmo banco. Nas minhas duas execuções, três testes falharam com o total da lista crescendo 1 entre páginas ("expected 1648 to be 1647"). Foi interferência minha: as escolas de um processo apareceram na contagem do outro. Na esteira isso não acontece, porque a integração roda um arquivo por vez (`fileParallelism: false`).

Pelo mesmo motivo, a minha execução pode ter derrubado o portão que estava rodando. Se o portão falhar nos testes do painel com um total de escolas diferente entre páginas (1 a mais do que o esperado), rode o portão de novo antes de tratar a falha como defeito.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-25 02:48:36 · `tasks/prd-apresentacao-painel/5_task.md`

VEREDITO: APROVADO

Tabelas verificadas:
- Nenhuma tabela de domínio nova.
- A migration `0016` cria só um índice parcial em `usuario` (`escola_id` com `papel = 'coordenador' and desativado_em is null`). A tabela já tem `escolaId`, e o índice começa pelo escopo.
- Conferi as FKs compostas de `turma` e de `vinculo` com `ano_letivo`, `usuario` e `disciplina`. Elas impedem que um vínculo ou uma turma aponte para o ano de outra escola.

Queries verificadas (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.repository.ts`):
- `redes`, `escolas` e `uso` são os três métodos `@SemEscopo`, cada um com justificativa que cita o painel do operador.
- Toda subconsulta se liga à escola da linha pelo `escola_id`: ano em curso, turmas, professores, alunos, coordenador ativo, último convite, uso do dia, uso do mês e a chave da ordem `uso`.
- O join de `usuario` usa `escola_id` e `id`.
- O DTO de saída é estrito: id, nome, slug, rede, estado, `conviteId`, contagens e uso. Nenhum campo de pessoa sai na resposta.
- As rotas `GET /escolas` e `GET /uso` aceitam só `pagina` e `ordem`, num esquema estrito. `?escolaId=` responde 400, e isso está testado em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-leitura.int.test.ts`, na I6.
- Os ids são validados como UUID (`z.uuid()`).
- Nenhuma rota nova recebe id, então nenhuma resposta pode confirmar que um registro existe.
- O painel da operação não é a camada de rede e devolve só números.

Teste de isolamento: presente e efetivo. Tirei mentalmente cada cláusula de escopo e o teste quebra em todas:
- **`a.escola_id = e.id` (ano em curso):** a linha de cada escola se multiplica, e o `doItem` da I4 exige uma só. Quebra.
- **`coordenador.escola_id = e.id`:** as escolas em `sem_coordenacao` e `sem_convite` passam a sair como `ativa`. A L4 em `painel-convite.int.test.ts` quebra.
- **`c.escola_id = e.id` (último convite):** a escola em `sem_convite` ganha um `conviteId` que não é dela. A L4 quebra.
- **`no_dia`, `no_mes` e a chave da ordem `uso` sem a escola:** a I5 põe a escola de mais uso com o id maior, e a ordem sai trocada. As duas mutações do período da chave quebram a L2 (correção da 1ª rodada do `test-engineer`).
- **Cerca do repository (I1, em `arquitetura.test.ts`):** o teste prova que são exatamente três métodos e que só o `painel.service.ts` importa o repository. Ele também mostra que a varredura reprova quem importa, reexporta ou carrega por `import()` de fora.
- **Permissão (I3):** o teste exige a lista exata das rotas `@RotaDeOperacao`, e as duas rotas novas estão nela.

Bloqueantes: nenhum.

Recomendações:
1. `painel.repository.ts:103-105` e `:139`: nas contagens de turmas, professores e alunos, quem de fato separa as escolas é o `ano_letivo_id = ano.id`, junto com as FKs compostas. Nenhum teste isola o `v.escola_id = e.id` nem o `t.escola_id = e.id`: sem eles o resultado não muda. Hoje isso não vaza dado, mas vale um comentário dizendo que as FKs compostas são a garantia. Se alguém trocar a FK composta por uma simples, a cláusula vira a única defesa e continua sem teste.
2. `painel.repository.ts:75`, `TOTAL_DE_ESCOLAS`: a página e o total saem de duas consultas separadas (`Promise.all`), sem a mesma fotografia do banco. Uma escola criada entre as duas deixa o `total` fora do que a página mostra. Não vaza dado entre escolas. É o mesmo sintoma que o `test-engineer` viu com o banco compartilhado.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-25 02:48:52 · `tasks/prd-apresentacao-painel/5_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo e nenhuma coluna nova. A migration `0016` só cria o índice parcial `usuario_coordenador_ativo_idx`. As duas consultas novas leem `usuario.desativado_em`, `vinculo` e `convite` apenas para contar e para calcular o estado da coordenação. Esses valores ficam dentro do service e não saem na resposta: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.service.ts` repassa ao DTO só o `estado` e o `conviteId`.

**Fora da tabela de dados do docs/lgpd.md:** nada. As contagens de turmas, professores e alunos por escola e o uso de infra por escola são agregados, sem pessoa. A Tech Spec, seção 7, diz que `docs/lgpd.md` não muda, e isso se confirma.

**Autorização por objeto:** ok.
- As duas rotas novas não recebem id, e a consulta é estrita (`esquemaConsultaDoPainel`): `escolaId`, `redeId` e parâmetro repetido dão 400.
- As rotas passam pela `@RotaDeOperacao`. As varreduras C36, C41 e C46 agora exigem a lista exata das nove rotas, então sessão de escola, desafio, cookie de escola e acesso sem credencial respondem como rota inexistente também em `GET /escolas` e `GET /uso`.
- A leitura entre escolas é a exceção declarada da regra 10, item 9. Os três métodos têm `@SemEscopo`, e a cerca I1 em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts` garante que só o `painel.service.ts` os importa.

**DTO de saída:** explícito e estrito. Os dois esquemas usam `z.strictObject` e o service faz `.parse` antes de devolver. A lista sai com `id, nome, slug, rede{id,nome}, estado, conviteId?, turmas, professores, alunos`; o uso, com `id, nome, dia{requisicoes,jobs,bytesStorage}, mes{…}, dia, mes`. O teste de contrato recusa campo a mais, como `email`, `coordenacao` ou `alunosNomes`. Rodei o `painel.test.ts` do shared: 10 de 10 passaram.

**Logs:** limpos. A leitura não loga nada. A I6 zera o log e exige que nenhuma sentinela apareça nele nas oito rotas, inclusive nos 503. As sentinelas são nome, e-mail, matrícula, complemento e turma, mais nome e e-mail do operador.

**Erro:** a entrada inválida vira `ENTRADA_INVALIDA` sem ecoar o que foi enviado, pelo `lerEntrada`. O 503 é provado sem sentinela no corpo.

**Auditoria:** presente onde a regra exige. A leitura de contagem não é leitura de dado de aluno, então a ausência de auditoria de leitura está correta e vem declarada na Tech Spec, seção 7. Não há exportação, alteração de nota nem alteração de permissão nesta tarefa. As escritas do painel seguem auditadas como nas tarefas 1.0 a 3.0.

**Envio externo:** nenhum. Não há chamada de IA nem terceiro.

**Seed/fixture:** sintético. Os e-mails usam `@escola.invalid` e `@turmma.invalid`, e os nomes são "Pessoa sintética de teste", "Escola Leitura …" e as sentinelas `MAT-SENTINELA-…`.

**Pergunta de fechamento:** esta tarefa não acrescenta nada ao que o sistema guarda sobre um aluno nem ao que ele envia para fora. Mostra ao operador só números por escola, então a resposta à secretaria continua a mesma de antes, e esta tarefa não a piora.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`: registrar, numa linha ou nota sobre o painel da operação (D76), que a equipe Turmma vê por escola só contagens do ano em curso e uso de infra, sem pessoa. Hoje isso está só na Tech Spec. Serve de prova para o dossiê de conformidade (D61) quando a escola perguntar o que nós, como operadores, vemos.
2. O `estado` `sem_coordenacao` deixa o operador inferir que a coordenadora daquela escola foi desativada. Isso já vinha da 2.0 e é mínimo, mas vale uma frase na mesma nota do item 1, para que a escola saiba que esse fato chega à operação.
3. Uma nota para o `tenancy-guardian`, fora do meu veto: com esta tarefa, o `PainelRepository` passa a ter três `@SemEscopo`. A regra 10, item 9, trata o terceiro sem escopo no mesmo módulo como sinal de desenho errado. A Tech Spec, seção 6, declara os três e a I1 os fixa, mas quem decide se isso é aceitável é o `tenancy-guardian`.

Como você pediu, não rodei nenhuma suíte de integração nem de infra.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.controller.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/painel.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0016_usuario_coordenador_ativo.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-leitura.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-09-25 02:49:02 · `tasks/prd-apresentacao-painel/5_task.md`

VEREDITO: APROVADO
Caminho quente tocado: migration (índice novo em `usuario`). As duas rotas novas de leitura são do painel da operação e ficam fora do caminho quente de sala.
Rate limit: ok. As duas rotas `GET` novas usam `@RotaDeOperacao`, que aplica a `GuardaDeOperador` e o limite `rl:op:{sub}`, contado por operador e não por IP.
Fila e prioridade: ok. Nada vai para a fila, e nada precisa ir: cada página é uma consulta limitada a 25 escolas, mais a do total, sob o `statement_timeout` de 300 ms do pool da API. O 503 `TEMPO_ESGOTADO` tem prova na I6.
Concorrência: protegida. As rotas novas só leem, não há "busca, verifica, grava".
Índice e paginação: ok. Todas as subconsultas correlacionadas descem por índices que começam por `escola_id`: `vinculo_turma_idx`, `usuario_escola_id_unico`, a chave primária de `uso_infra_diario`, `ano_letivo_um_em_curso_por_escola`, `convite_escola_usuario_idx` e o novo `usuario_coordenador_ativo_idx`. O `EXPLAIN (ANALYZE)` está registrado em `5_task.md`. A paginação é de 25, com página máxima de 10.000 e desempate por `id`. Só `escola` é varrida por inteiro, e ela não cresce com aluno.
Degradação de IA: não se aplica.
Migration: compatível. `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0016_usuario_coordenador_ativo.sql` só cria um índice parcial. Não tem `ALTER` de coluna, `NOT NULL` nem rename, e o código anterior continua funcionando.
Métrica e alerta: ok. As rotas novas entram na métrica HTTP global por rota ("Taxa de erro 5xx por rota" e "Requisições por rota", no runbook). Não há alerta novo.
Bloqueantes: nenhum.
Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0016_usuario_coordenador_ativo.sql:7`: o `CREATE INDEX` sem `CONCURRENTLY` segura a escrita em `usuario` enquanto o índice é construído. Hoje isso custa milissegundos, só há dado sintético e o deploy é fora do horário letivo, como já se fez na 0015. Antes da escola piloto, registrar no `TODO.md` ou no runbook o caminho para índice `CONCURRENTLY` fora de transação no migrador. Sem isso, a próxima migration de índice em `usuario` ou `vinculo` com dado real repete o padrão.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.repository.ts:253` e `:321`: a página e o `total` rodam em duas conexões do pool, em fotografias diferentes do banco. Se uma escola for criada entre as duas consultas, o `total` pode divergir da página em um. Calcular o total com `count(*) over ()` na própria consulta da página resolve e economiza uma conexão.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.repository.ts:204`: na ordem `uso`, a chave soma o mês de todas as escolas a cada página. Na escala da D25 é barato; se o número de escolas passar de algumas centenas, considerar um agregado mensal consolidado.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-25 03:04:50 · `tasks/prd-apresentacao-painel/5_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As quatro divergências estão registradas em "Divergências resolvidas nesta tarefa" e já subiram para a Tech Spec (seções 3 e 5) e para `docs/modelo-de-dados.md`, como pede o `/executar-task`:
- o índice parcial `usuario_coordenador_ativo_idx`;
- o mês do uso contado do dia 1 até o último dia fechado;
- o contrato da página com `pagina`, `total`, `dia` e `mes`;
- a I1 levada para o `arquitetura.test.ts`.

Nenhuma delas cria regra nova nem baixa critério de aceite. A lista lê o estado da coordenação como a escrita lê: `painel.repository.ts:142-160` bate com `ConviteRepository.dadosDaCoordenacao` (`convite.repository.ts:89-108`) no filtro por tipo, no join do usuário e na ordem `expira_em desc, id desc`. Os dois lados usam a hora do banco.
Portão local: carimbo válido (typecheck, lint, test, infra). O `portao-local.ts --infra` começou às 02:35:36, depois da última alteração (02:34:59), e terminou com 2138 testes e 36 de infra verdes. O `conferir` responde "válido para o código atual".
Bloqueantes: nenhum
Recomendações:
- `apps/api/src/operacao/painel.repository.ts:135-163` e `:203-223`: a página e o `total` saem de duas consultas em paralelo, cada uma com a sua fotografia do banco. Uma escola criada entre as duas faz o `total` não bater com a página. Para o painel não é grave, mas dá para ler o total na própria consulta da página, com `count(*) over ()` em `escolasDaPagina`, antes do `limit`. Isso também tira a segunda consulta.
- `apps/api/src/operacao/painel.service.ts:55-58`: o primeiro dia do mês é montado à mão (`${dia.slice(0, 7)}-01`), mas o `limitesDoMes` do `@educa/nucleo` já faz isso. E o `referenciaDoUso` é exportado sem ter ninguém de fora que o use.
- `apps/api/src/operacao/painel.controller.ts:44-53` contra `:58-96`: no mesmo controller, os GET validam a entrada pelo `lerEntrada` e os POST repetem o `safeParse` com o `throw` escrito em cada um. Vale usar o `lerEntrada` em todos.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.controller.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/painel.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-leitura.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/5_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`

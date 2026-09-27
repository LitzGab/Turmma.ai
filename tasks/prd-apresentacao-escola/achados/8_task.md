# Achados das revisões — `tasks/prd-apresentacao-escola/8_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-27 01:58:04 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Isolamento:** I6 (lote misto pelo professor e pela coordenação), I8, I3 e I9, e a segunda camada que a 6.0 pediu (`chaveGravada`, `tomar` e o `DecisaoRepository` com a turma, o nome e o pedido de B, e com os de A em outro ano).
- **Permissão:** P3, P4, E12 (pedidos), P1 da varredura e a célula da rede.
- **Caminho feliz:** E18 e E20.
- **Bordas:** E6, E7, R2, E19 (virada de ano), E21, E22 (login logo depois da aprovação), E25 (nome do colega), E27 (turma sem professor), E30, professor com duas disciplinas (P3), ano encerrado (T5 e I8), vínculo encerrado e dois vínculos confirmados em `minha-turma`.
- **Auditoria e log:** A1 a A4, com o IP no A4.
- **Concorrência:** C3 (aprovar × recusar, professor × coordenação, o mesmo lote duas vezes) e C12 (herdado da 2.0).

**Cobertos:** todos os acima.
- **I6:** confere igualdade de resposta com o UUID aleatório, a ordem dos ids, o estado de fora sem mudança e a contagem de usuários nas duas escolas.
- **C3:** é concorrência de verdade, com `Promise.all`, e confere uma auditoria e um aluno por pedido.
- **C12:** é determinístico, com `GatilhoDeParada` e `esperarNaTrava`, e prova a nova ordem do avulso.
- **E18:** confere cada escrita da aprovação, o " 123 " de ponta a ponta e o `criado_por`.
- **E22:** prova o contador zerado (CONTA_SEGURADA antes, 200 depois).
- **Mutações:** todas as linhas da seção batem com o diff (conferi os números de linha nos arquivos atuais).
- Nenhum `.skip`, `.only` ou `any`, nenhum mock de coisa nossa e nenhuma asserção removida da varredura.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **A trava do C3 não tem linha na seção "Mutações".** Em `apps/api/src/sala/decisao.repository.ts:110`, o `.for('update')` é a única coisa que resolve o C3: `fechar`, `aprovarNome` e `devolverNome` não conferem o estado, e a divergência registrada na tarefa diz que "a semântica é a mesma" do `update` condicional. Sem a trava, o C3 em paralelo quase certamente fica vermelho (a segunda decisão lê o pedido ainda `pendente` e cai no 23505 da credencial, ou sai `decidida` duas vezes). Mas a detecção depende de os dois HTTP se intercalarem.
   - Rode a mutação e registre a linha.
   - Se ela não ficar vermelha em toda execução, torne o C3 determinístico com `GatilhoDeParada`: parar a primeira decisão no `update` da `lista_nome` e fazer `esperarNaTrava` da segunda no `select … for update`.
   - Atualize o "Quebra sem" do C3 em `cenarios.md`, que ainda cita o "update condicional em `pendente`".
2. **Cláusulas novas sem linha e sem declaração de segunda camada:**
   - `decisao.repository.ts:62` e `:63` (escola e ano do vínculo dentro do `exists`);
   - `lista.repository.ts:71` (escola da credencial em `aprovadasNaTurma`).

   Pelo meu raciocínio, nenhuma tem efeito observável, porque a turma é UUID de um ano só e a FK composta já prende. Declare as três no parágrafo de segunda camada, como foi feito com as de `:84`, `:68`, `:72` e `:73`.
3. **O professor que manda `finalidade` na leitura dos pedidos não tem teste de que nada é gravado.** O contrato promete isso em `packages/shared/src/sala/pedidos.ts:92`. Hoje, trocar `nominalAuditado && finalidade !== undefined` por `finalidade !== undefined` em `decisao.service.ts:75` passaria no A2, porque lá o professor lê sem finalidade. Vale uma leitura do professor com `?finalidade=` no A2, esperando zero registros.
4. **O `.strict()` da consulta de `GET turmas/:id/reivindicacoes` não é exercitado.** A variante de campo a mais da varredura só existe para corpo. Por exemplo, `?escolaId=` deveria dar `ENTRADA_INVALIDA`.
5. **Borda de dois nomes iguais nos pedidos.** Dois pendentes com o mesmo nome deveriam aparecer com ids distintos, e aprovar um deles deveria gravar a credencial com a matrícula do nome certo. Hoje isso só está provado na reivindicação (E24, 6.0), não na decisão.

**Arquivos auditados:**
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/8_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/minha-turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/minha-turma.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md`

## test-engineer · 2ª rodada · APROVADO · 2026-09-27 02:09:21 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da 1ª rodada.
- **Isolamento:** I6, I8, I3, I9 e a segunda camada.
- **Permissão:** P3, P4, E12, P1 e a célula da rede.
- **Caminho feliz:** E18 e E20.
- **Bordas:** E6, E7, R2, E19, E21, E22, E25, E27, E30, professor com duas disciplinas, ano encerrado e vínculo encerrado. Nesta rodada entrou também a de dois alunos com o mesmo nome nos pedidos.
- **Auditoria:** A1 a A4.
- **Concorrência:** C3 e C12.

**Cobertos:** todos os acima. Conferi as cinco correções que eu tinha recomendado:

1. **C3 sem depender da intercalação** (`apps/api/test/decisao.int.test.ts:520`).
   - O `GatilhoDeParada` segura a aprovação no `update` da `lista_nome`, que acontece com a linha do pedido já travada.
   - `esperarNaTrava` confirma em `pg_stat_activity` que a recusa está esperando uma trava (`wait_event_type = 'Lock'`) e que a consulta dela bate com `%from "reivindicacao"%for update%`.
   - Sem o `.for('update')` de `decisao.repository.ts:110`, a recusa leria o pedido ainda `pendente` e iria parar no `update` do `fechar`. Nesse caso nenhuma consulta bate com o padrão, e o teste fica vermelho sempre, qualquer que seja a ordem.
   - A linha 136 da seção "Mutações" confere com o código. O "Quebra sem" do C3 em `cenarios.md:252-256` foi reescrito.
2. **Segunda camada declarada** (`8_task.md:168-173`). Os números `:62`, `:63` e `lista.repository.ts:71` batem com o código atual.
3. **A2 com o professor mandando finalidade** (`decisao.int.test.ts:457`). O professor lê também com `?finalidade=` e o teste espera exatamente os dois registros da coordenação. Trocar a condição de `decisao.service.ts:75` por `finalidade !== undefined` sozinho produziria quatro registros, então o teste derruba essa mutação. A linha 148 da seção "Mutações" foi acrescentada.
4. **`.strict()` da consulta** (`decisao.int.test.ts:425-428`). `?finalidade=…&escolaId=…` dá 400 `ENTRADA_INVALIDA`, e o teste confere que nenhum registro de auditoria foi gravado.
5. **Dois alunos com o mesmo nome** (`decisao.int.test.ts:260-282`).
   - Os pedidos saem com ids distintos, e o teste confere o par id e nome.
   - Aprovar o segundo grava na credencial exatamente a matrícula dele (`toEqual([{ matricula: segunda }])`).
   - O primeiro continua `pendente`, com o nome `reivindicado` e a matrícula dele.

Nenhum `.skip`, `.only` ou `any` novo. O código de produção não mudou desde a 1ª rodada, e os números de linha da seção "Mutações" que conferi continuam certos.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O `.strict()` de `packages/shared/src/sala/pedidos.ts:19` agora tem teste que o derruba (o P3 com `escolaId`), mas não tem linha na seção "Mutações". Vale acrescentar `pedidos.ts:19` → `decisao` P3 (consulta com `escolaId`).

**Arquivos auditados nesta rodada:**
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/8_task.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/pedidos.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/gatilho-de-parada.ts

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-09-27 02:11:00 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa 8.0 não cria, lê nem grava `Nota`, e a tabela ainda não existe no schema. Todos com autor humano? Não se aplica, porque não há escrita em Nota.

Decisão autônoma sobre aluno: ausente. A decisão de identidade do aluno (D4) só é gravada em um lugar, `DecisaoRepository.fechar`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.repository.ts:138`. Ele só é chamado por `DecisaoService.#decidirUm`, e esse só é alcançado por `POST /v1/reivindicacoes/decidir`, com sessão de professor com vínculo confirmado ou da coordenação. Nenhum job, worker, seed ou webhook muda o `estado` de uma reivindicação. Não existe "aprovar todos": cada id é escolhido por quem decide, até 40 por vez.

Aprovação registrada: ok. Não há saída de IA nesta tarefa. Mesmo assim, a decisão humana fica registrada por completo:
- **No pedido:** `decidida_por` e `decidida_em`.
- **Na auditoria:** `reivindicacao.decidida`, com `autor_usuario_id` do contexto e `decididaComo`.
- **No vínculo do aluno:** `criado_por`.
- **Recusa:** é possível, e devolve o nome à lista.
- **Testes que provam:** E18 e E25 em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts:153-169` e `:223-228`.

A exceção da D47 não aparece em lugar nenhum.

Supervisão do tutor: ok. O tutor não é tocado nesta tarefa.

Autonomia declarada e visível: não se aplica. Nenhum agente é criado ou alterado. As células novas da `MATRIZ` (`reivindicacao`, `minha_turma`) são permissão de pessoa, não autonomia de agente.

Demais itens:
- **Item 6 (auditoria):** responde "quem decidiu e quando" para cada pedido, e liga o `alunoId` criado à aprovação dele.
- **Item 7 (vigilância):** `teveMatriculaErrada` é só sim ou não, sobre o próprio pedido. Não traz número, hora nem matrícula tentada, e é apagado ao decidir (E21, E30). Serve a uma decisão de identidade, não é janela sobre comportamento, e não infere emoção.
- **Item 8 (discursiva e redação):** nada nesta tarefa.
- **Item 9 (medir o professor):** nada de métrica de professor, e a leitura do professor não gera auditoria. A auditoria obrigatória só vale para a leitura nominal da coordenação (`turma.reivindicacoes_lidas`, com finalidade), e isso é regra 20, item 10, não medição do professor.
- **`docs/regulacao.md`:** não foi alterado nesta tarefa.

Bloqueantes: nenhum.

Recomendações:
1. **Texto da marca de matrícula errada (tela da 12.0 e 16.0).** Apresente a marca como fato sobre o pedido ("alguém tentou este nome com outra matrícula"), nunca como suspeita sobre o aluno. Isso mantém a leitura de supervisão, e não de vigilância (regra 70, item 7).
2. **Tela de pedidos.** Deixe visível ao aluno recusado que a decisão foi de uma pessoa e que ele pode reivindicar de novo, para a recusa não parecer automática.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/pedidos.controller.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/minha-turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/minha-turma.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/minha-turma.controller.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/pedidos.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/minha-turma.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts`

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-27 02:11:16 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration nesta tarefa. As escritas em tabelas existentes levam a escola e o ano do contexto, nunca do cliente:
- `reivindicacao`: no `fechar`
- `usuario`: pelo `criarUsuarios`
- `credencial_matricula`: pelo `criar`
- `vinculo`: pelo `criarAlunoConfirmado`, com `escolaId` e `anoLetivoId` do contexto
- `lista_nome`: no `aprovarNome` e no `devolverNome`
- `auditoria`: as ações `turma.reivindicacoes_lidas` e `reivindicacao.decidida`

Queries verificadas:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.repository.ts`
  - O `#noAlcance` aplica escola e ano em curso do contexto. Para o professor, soma o `exists` do vínculo `professor` `confirmado`, com o usuário da sessão.
  - `pendentes`, `travarPendente` (com `for update`), `alcancavel` (alcance antes do estado), `nomeDoPedido`, `aprovarNome` e `devolverNome` filtram escola e ano.
  - O `fechar` filtra só a escola, o que está declarado como segunda camada: o id vem da linha travada.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/minha-turma.repository.ts`: escola, ano em curso, usuário da sessão e `confirmado`, todos do contexto. O join com `escola` usa o `vinculo.escolaId` já filtrado.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.repository.ts` (`aprovadasNaTurma`): escola do contexto, ano em curso e turma. Os chamadores (`previa` e `gravar`) abrem a turma com escopo antes de chamar.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts` (`criarAlunoConfirmado`): a turma vem da linha do pedido travada com escopo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts`:
  - `pedidos` confere a finalidade antes da turma e depois abre a turma com `TurmaRepository.aberta` e o alcance da célula.
  - O alcance sai do papel da sessão, pela `MATRIZ`. O zerar do contador usa a escola do contexto.
- Contratos em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/pedidos.ts`: a consulta e o corpo são estritos, então `escolaId` na query ou no corpo dá `ENTRADA_INVALIDA`, e um teste prova isso com a query. Nenhum endpoint lê escola vinda do cliente.
- Matriz: a rede fica `nunca` nas três células novas, e nenhuma consulta agregada da rede alcança pedido ou turma de aluno.
- `@SemEscopo()`: nenhum uso novo. Ids: UUID em todos os contratos e no caminho; fora do formato, responde o mesmo 404.

Teste de isolamento: presente e efetivo. Removi mentalmente cada cláusula, e cada remoção quebra um teste:
- **I6** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts:313`)
  - Sem a escola ou o ano, B e T5 deixam de sair `nao_encontrada`.
  - Sem o `exists` do professor, T2, T3, T4 e T6 são decididos.
  - Se o estado for conferido antes do alcance, o decidido de B vira `ja_decidida`.
  - O teste também confere que as respostas são iguais às do UUID aleatório e que B continua sem mudança.
- **Segunda camada** (`decisao.int.test.ts:667`): o caso "B no ano de B" deixa a escola do contexto como única cláusula que segura B em cada método do repository.
- **`minha-turma`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/minha-turma.int.test.ts:108`): com a escola de B no contexto, e o usuário e o ano do aluno de A, sem a cláusula de escola o aluno de A acharia a turma dele.
- **I3 da varredura** (`escola-montada.int.test.ts:638`): a coordenação de A pede a turma de B nos pedidos e recebe o mesmo 404 do id sorteado.
- A nota da 6.0 (turma que não vem da linha do acesso) está atendida no mesmo teste da segunda camada, que chama `chaveGravada` e `tomar` com a turma de B no contexto de A.

Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.repository.ts:150`: o `fechar` depende só da trava do `travarPendente` na mesma transação. Acrescentar `eq(reivindicacao.estado, 'pendente')` e o ano do contexto ao `where` daria defesa em profundidade sem mudar a semântica. Se um dia alguém chamar o `fechar` fora desse fluxo, ele não reescreveria um pedido já decidido.
2. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts:125`: um nome ausente no pedido travado lança um `Error` genérico, que vira 500. Só acontece com dado inconsistente e não confirma existência para quem chama, mas um erro tipado alinharia com a regra 00, item 9.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-27 02:11:23 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

Escopo: respeitado. As subtarefas 8.1 a 8.6 foram feitas. O `for share` no ano ficou para a 10.0, como a tarefa manda. Nada de tela nem de transferência de aluno.

Aderência à Tech Spec: ok. As seis divergências listadas em "Divergências resolvidas nesta tarefa" estão também em três outros lugares:
- na `techspec.md`: seção 4, seção 5 (passos 6 e o novo 7) e seção 7;
- no `cenarios.md`: C3 reescrito, C12 novo, A4 e a linha RF5;
- no `docs/modelo-de-dados.md`.

As três que mais pesam conferem com o código:
- **O `select … for update` no lugar do `update` condicional.** A trava está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.repository.ts:105-116`. A outra decisão espera a trava e, relida a linha já decidida, não a acha.
- **A corrida herdada da 2.0 (C12).** O avulso confere a credencial depois do `insert` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts:128-129`). A prévia e a gravação leem a lista antes da credencial. Refiz o raciocínio em READ COMMITTED: a matrícula que está sendo aprovada nunca sai `entra`, nem em outra turma nem na mesma.
- **O `decidido_em` do vínculo.** É gravado pelo `criarAlunoConfirmado`, e o item correspondente do `TODO.md` foi fechado com essa referência.

Portão local: sem carimbo com `--infra`. A conferência respondeu: "portão local: o último não rodou infra. Rode `node tools/processo/portao-local.ts --infra`". Como o agente que me chamou pediu, não reprovei por isso: segundo ele, o Joaquim decidiu rodar o `--infra` só no portão final. O resto do carimbo não está velho. Mesmo assim, a tarefa exige `infra-guardian`, e o hook vai barrar o commit até alguém rodar `node tools/processo/portao-local.ts --infra`.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts:125` e `:127` (numeração do arquivo): quando uma invariante quebra, sai um `throw new Error(...)` genérico, e o lote para no meio com 500. Os ids anteriores já foram gravados, e o cliente não sabe quais. Hoje isso não acontece, porque os checks do banco garantem a invariante. Ainda assim, vale deixar escrito na docstring de `decidir` que um 5xx no meio do lote não desfaz os ids já decididos. Assim a tela da 12.0 sabe que precisa reler os pedidos depois de um erro.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/sala.module.ts:9`: o import de `ContadorDeTentativas` entrou fora da ordem alfabética dos vizinhos (depois de `semaforo-de-hash`). É cosmético.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts`, em `pedidos`: o professor abre uma transação só para ler, sem gravar nada. Só a coordenação precisa da transação, por causa da auditoria. Para o professor, basta ler no `banco`. Mas a mudança é pequena, e a transação única deixa o código mais simples.
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/8_task.md`: a tabela "Recomendações sem aplicar" está vazia. A recomendação da 2ª rodada do `test-engineer` foi aplicada na linha 166 da seção "Mutações", então a tabela vazia está coerente. Confira se o hook ou o processo esperam alguma linha nela.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-27 02:11:51 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** a tarefa não cria campo novo nem migration. Ela usa o nome e a matrícula da `lista_nome`, que passam ao `usuario` do aluno e à `credencial_matricula` junto com o hash do pedido. Grava no `vinculo` o `decidido_em` e o `criado_por`, que é quem aprovou. Na `reivindicacao` grava `decidida_em`, `decidida_por` e `decidida_como`, e apaga o hash, a `chave_envio` e o `teve_matricula_errada` na mesma escrita. Grava também duas ações novas de auditoria: `turma.reivindicacoes_lidas`, com a quantidade e a finalidade, e `reivindicacao.decidida`, com a turma, o estado, `decididaComo` e `alunoId`, sem nome, matrícula, hash nem a marca de matrícula errada.

**Fora da tabela de dados do docs/lgpd.md:** nada. As linhas "Lista de nomes da turma" e "Reivindicação" (`docs/lgpd.md:72-73`) já cobrem a decisão, o estado aprovado sem nome nem matrícula e o apagamento dos segredos. A auditoria entra na linha 87.

**Autorização por objeto:** ok.
- `GET turmas/:id/reivindicacoes`: `TurmaRepository.aberta` confere o alcance. Para o professor, isso é o `exists` do vínculo `confirmado`. Para a coordenação, a finalidade é conferida antes de procurar a turma, então a falta dela responde igual para qualquer id.
- `POST reivindicacoes/decidir`: `travarPendente` e `alcancavel` aplicam o alcance antes do estado. O pedido de outra escola, de outro ano ou de turma sem vínculo sai como `nao_encontrada`, igual a um id aleatório (I6).
- `GET minha-turma`: escola, ano e usuário vêm do contexto, e a célula está só com o aluno. A varredura P1 e o I3 cobrem as três rotas.

**Logs:** limpos. Os arquivos novos não chamam o logger. Os `Error` internos têm mensagem fixa, sem dado. O contador de login é zerado com chave HMAC. O A4 agora procura também o IP do `X-Forwarded-For`, junto com nome, matrícula, hash, senha, token e código.

**Auditoria:** presente.
- A leitura nominal da coordenação grava `turma.reivindicacoes_lidas` na mesma transação, a cada leitura.
- A decisão humana de identidade (D4) grava `reivindicacao.decidida` na transação de cada id.
- A criação do aluno fica ligada à aprovação dele pelo `alunoId` na auditoria.
- A leitura do professor com vínculo não grava nada. Isso está certo pela regra 20, item 10, e está testado.

**Envio externo:** nenhum. Não há IA nem terceiro nesta tarefa.

**Seed/fixture:** sintético. Os nomes vêm dos geradores da sala de teste ("Chegou em maio", turmas "2ºB" e "2ºC"), e o IP de teste está na faixa TEST-NET-3.

**Exposição:**
- Os DTOs são `.strict()` de entrada e de saída.
- O pedido mostra só id, nome, hora e o `teveMatriculaErrada` como sim ou não, que o `docs/lgpd.md` permite. Nunca mostra matrícula, hash ou chave.
- `minha-turma` traz só escola, turma e série, sem colegas.
- A resposta do `decidir` traz só o id e o resultado de cada pedido.

**Pergunta de fechamento:** o código responde, a partir do aluno, com o que existe até esta tarefa. O caminho é: `usuario`, depois `credencial_matricula`, depois `vinculo` (com quem aprovou), depois a `lista_nome` aprovada pelo `usuario_id`, depois a `reivindicacao` pelo `lista_nome_id`, e por fim `reivindicacao.decidida` pelo `alunoId`. Nada foi enviado para fora.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **A eliminação do aluno aprovado ainda falha.** Desde esta tarefa pode existir aluno aprovado com linha na `lista_nome`, cujo `usuario_id` tem FK sem ação. Por isso `CicloDeVidaService.eliminar` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts:62-79`) falharia com 23503 nesse aluno, e também não apaga os pedidos dele. A falha é fechada: a transação volta atrás e não existe rota no F1. A correção já está prevista na 10.0 (V1, V3 e o cenário V do `cenarios.md`, `10_task.md:10,34`). Deixo registrado para o `/validar` conferir que a 10.0 fecha isso antes de qualquer dado que não seja sintético, porque o `docs/lgpd.md:72-73` já promete "sai junto com o usuário na eliminação".
2. **Documentar o `alunoId` fora da tarefa.** O `alunoId` em `reivindicacao.decidida` fica pela retenção da auditoria depois da eliminação, como os outros ids. Vale uma frase na seção de auditoria do `docs/lgpd.md` dizendo que ele é o elo usado pela pergunta de fechamento. Hoje isso está dito só na techspec e na tarefa.
3. **A mutação do `.strict()` da consulta não está listada.** Como o `test-engineer` pediu na 2ª rodada, falta a linha `pedidos.ts:19` → `decisao` P3 (consulta com `escolaId`) na seção "Mutações".

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/pedidos.controller.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/minha-turma.controller.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/minha-turma.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/minha-turma.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/pedidos.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/minha-turma.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md

## infra-guardian · 1ª rodada · APROVADO · 2026-09-27 02:12:23 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (a aprovação cria a credencial e zera o contador de login), sala
Rate limit: ok. As duas rotas autenticadas passam pela `GuardaDeLimite` global, que limita pelo usuário (`sub`) e pela escola (`esc`) do token. Não há limite só por IP.
Fila e prioridade: ok. Nada vai para a fila. O `decidir` tem teto de 40 ids, sem hash nem chamada externa, e cada id roda numa transação curta, uma depois da outra, com uma conexão do pool por vez.
Concorrência: protegida.
- **C3:** o `select … for update` com `pendente` (`decisao.repository.ts:105-110`) resolve a corrida, e há teste em paralelo e teste com ponto de pausa. Como cada id tem a própria transação, lotes em ordem inversa não travam um ao outro.
- **C12:** o avulso confere a credencial depois do `insert` (`lista.service.ts:128-129`), e a gravação lê a lista antes da credencial. Há teste com ponto de pausa.
- **Credencial duplicada na aprovação:** o 23505 não tem caminho para acontecer, porque a matrícula na lista é única por escola e ano e a gravação barra matrícula que já tem credencial.
Índice e paginação: ok.
- `pendentes` usa `reivindicacao_turma_idx` e é paginada por id, até 100.
- `minha-turma` usa `vinculo_usuario_idx`.
- O `exists` do professor usa `vinculo_turma_idx`.
- `travarPendente` e `alcancavel` buscam pela chave primária.
- `aprovadasNaTurma` fica limitada pela `lista_nome_turma_idx` e pelo índice único da credencial.
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. O `http.server.request.duration` global, com a rota e o status, cobre latência e erro das três rotas. Não há alerta novo.
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts:328-330`: o `zerar` do contador roda um por id, em sequência, dentro do request. Se o Redis de login conectar mas não responder, um lote de 40 aprovações espera 40 × 100 ms (`commandTimeout`), cerca de 4 s. Sugestão: juntar as matrículas aprovadas e zerar tudo depois do laço, em paralelo ou num `DEL` só com todas as chaves.
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/9_task.md` (9.3): o K2, variante do primeiro dia, só reivindica. Ele deveria incluir o professor decidindo em lotes de 40 e o aprovado fazendo login logo depois. Esse é o trecho da manhã do primeiro dia que cria os 2.100 usuários, e o p95 do `decidir` (40 transações de cerca de 10 comandos cada) precisa ser medido contra os 2 s da regra 00 com a latência de banco gerenciado.

## test-engineer · 3ª rodada · APROVADO · 2026-09-27 02:24:48 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos (nesta rodada, só o diff desde a 2ª rodada):**
- E22 no caminho feliz: quem aprova zera o contador de login da matrícula aprovada.
- E22 com o lote parado no meio: um 5xx no meio do lote não desfaz o id já decidido, e o contador dele é zerado mesmo assim.
- Os pedidos seguintes ao erro continuam pendentes.
- A troca do zerar em sequência por um zerar em paralelo não pode mexer no resultado por id, nem na auditoria, nem no C3.
- As linhas da seção "Mutações" batem com o arquivo novo.

**Cobertos:**
- **Caminho feliz.** O teste E18/E22 (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts:127`) segura o login da matrícula com cinco tentativas (`CONTA_SEGURADA`). Depois aprova e confere que o login entra com `"123"` e com `" 123 "`. Sem o `zerar` da linha 109 esse teste fica vermelho.
- **Lote parado no meio** (`decisao.int.test.ts:182`):
  - O pedido quebrado aponta para um nome de outro ano. Isso só se monta por SQL, porque a API não grava esse estado, e é um jeito honesto de provocar o erro interno sem mock.
  - O teste confere o 500, o primeiro pedido `aprovada`, o segundo `pendente` e o login entrando logo depois.
  - Se o zerar voltar para depois do laço sem o `finally`, a exceção sai antes dele, o login continua `CONTA_SEGURADA` e o `toBe(200)` falha. A mutação declarada em `:107` se sustenta pela leitura do código. Não rodei essa mutação, porque ela exige editar o arquivo.
  - Rodei o teste isolado, sem mutação, e ele passou.
- **Seção "Mutações".** As linhas conferem com o arquivo atual: `:27`, `:70`, `:73`, `:75`, `:76`, `:102`, `:107`, `:109`, `:142`, `:143`, `:147` e `:152`.
- **Resto do fluxo.** O `#decidirUm` continua fazendo uma transação por id, com a mesma trava e a mesma auditoria. O C3 (as decisões ao mesmo tempo, `:538` a `:597`) e o E20 continuam cobrindo o resultado por id sem mudança de comportamento. A mudança em `sala.module.ts` é só de import e docblock.
- Nada de `.skip`, teste comentado, mock do que se testa ou chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações (não bloqueiam):**
1. O `Promise.all` do zerar hoje só é exercitado com uma aprovação por lote, tanto no E18 quanto no teste do lote parado. Um erro que zerasse só a primeira matrícula do lote passaria. Vale segurar o login de dois nomes e aprová-los no mesmo lote, no E20 ou no teste novo, e conferir que os dois entram.
2. No teste do lote parado, conferir que o corpo do 500 é o erro curto e tipado, sem stack nem mensagem interna. O 500 real ficou exercitado pela primeira vez neste arquivo (regra 20, item 11).
3. O `finally` depende do contrato de que o zerar "nunca lança": se lançasse, trocaria o erro original. Hoje isso está só no docblock. Se o `ContadorDeTentativas` já não tem teste de unidade que prove "nunca lança com o Redis fora", fica anotado para o `/validar`.

## test-engineer · 4ª rodada · APROVADO · 2026-09-27 02:35:29 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

Cenários exigidos (desta rodada, pelo diff em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts` e pelas correções pedidas na 3ª rodada):
- E22 com o lote parado no meio e duas aprovações antes do erro: as duas continuam `aprovada` e as duas contas conseguem entrar logo depois.
- O corpo do 500 sai curto e tipado, sem a mensagem interna (regra 20, item 11).
- O `zerar` não lança quando o Redis está fora.

Cobertos:
- **Duas aprovações no lote do zerar (`decisao.int.test.ts:181-221`).** O teste segura a conta de cada um dos dois nomes com cinco tentativas e confere `CONTA_SEGURADA` na linha 189. Depois manda o lote `[aprovado1, aprovado2, quebrado]` e confere três coisas: `aprovada` para os dois (linha 217), `pendente` para o quebrado (linha 218) e login 200 para as duas matrículas (linha 220).
- **As duas mutações quebram o teste.**
  - `aprovadas.slice(0, 1)` em `decisao.service.ts:109`: a segunda matrícula continua segurada, e a linha 220 fica vermelha.
  - Tirar o `finally` da linha 107: o 500 corta o zerar, as duas contas continuam seguradas, e o teste fica vermelho.
  - As duas mutações estão na seção "Mutações" da tarefa (linhas 152-153).
- **Corpo do 500 (`decisao.int.test.ts:214-216`).** O teste confere as chaves de primeiro nível, as chaves do erro e que o texto não traz "nome do pedido". Pilha ou mensagem interna quebrariam a asserção.
- **`zerar` com o Redis fora.** A cobertura em `apps/api/src/sessao/contador-de-tentativas.test.ts:64-65` confere: com o Redis fora, `zerar` devolve `false` sem lançar. Está registrada em "Recomendações sem aplicar", na linha 190 da tarefa.
- O que ficou fora do diff não foi reauditado. As rodadas anteriores continuam valendo.

Bloqueantes: nenhum.

Recomendações:
- O lote de hoje põe o quebrado por último. Um lote `[aprovado, quebrado, pendente]` provaria a outra metade do contrato descrito em `decisao.service.ts:90-91`: o id que vem depois do erro continua `pendente` e não é decidido. Hoje nenhum teste falharia se o laço engolisse o erro e seguisse em frente, desde que ainda devolvesse 500 no fim.

## test-engineer · 5ª rodada · APROVADO · 2026-09-27 02:45:48 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** não mudaram desde a 4ª rodada. Nesta rodada a auditoria cobriu só o diff. O cenário revisto é o "E22 com o lote parado no meio": um erro no meio do lote não desfaz as aprovações de antes, zera o contador de cada aprovada e não decide nenhum pedido que vem depois do quebrado.

**Cobertos:**
- **A recomendação da 4ª rodada foi aplicada.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts:212-221`, o `depoisDoErro` vem de `pedir(s, await sala.umNome(s))`. É um nome novo da lista (`nomes()` gera um sufixo aleatório a cada chamada), e o pedido nasce `pendente`, na mesma turma e no ano em curso. Ele entra no lote depois do `quebrado`, e o teste confere que continua `pendente`.
- **A mutação é real.** O pedido é válido e aprovável. Se o laço de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts` engolisse o erro e seguisse para o próximo id, esse pedido sairia `aprovada` e a linha 221 ficaria vermelha, mesmo com o 500 no fim. Isso bate com a linha nova da seção "Mutações" (`8_task.md:153`).
- **As asserções anteriores continuam no teste:**
  - a resposta é 500, curta e tipada, sem pilha;
  - os dois aprovados de antes ficam `aprovada`;
  - o `quebrado` fica `pendente`;
  - os dois contadores são zerados no `finally`.
- No trecho alterado não há `.skip`, teste comentado nem mock novo.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-27 02:46:35 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta rodada. Continua valendo a verificação da 1ª rodada para `reivindicacao`, `lista_nome`, `usuario`, `credencial_matricula` e `vinculo`, que têm `escola_id` e, onde o dado varia por período, `ano_letivo_id`.

Queries verificadas: nenhuma query mudou.
- A chave do contador que o `finally` de `decidir` zera (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts:107-110`) ainda leva a escola do contexto, por `exigirEscolaDoContexto()` dentro de `identificadorDoAluno`. O cliente não manda a escola.
- A matrícula que entra nessa chave sai de `nomeDoPedido` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.repository.ts:159-166`), que filtra por escola do contexto, ano em curso e id. Por isso uma aprovação não consegue zerar o contador de login de outra escola.
- A mudança em `sala.module.ts` só registra providers e controllers e não mexe em escopo.

Teste de isolamento: presente e efetivo. Os testes de isolamento da 1ª rodada não mudaram.
- O teste novo "E22 com o lote parado no meio" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts:181-224`) não é de isolamento entre escolas. Mesmo assim, ele depende do filtro de ano em `nomeDoPedido`: sem `anoLetivoId = ano em curso`, o nome do ano de 2025 seria achado, o lote não pararia e o `expect(500)` falharia. Então ele também derruba essa cláusula.
- O mesmo teste confere que o erro volta curto e tipado, sem mensagem interna.

Bloqueantes: nenhum.

Recomendações:
- As duas recomendações da 1ª rodada foram recusadas com motivo em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/8_task.md`: `fechar` com `pendente` e ano, e o erro tipado da invariante. Aceito o registro. Ficam para o `/retro`.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-27 02:46:45 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o diff desde a 1ª rodada aprovada e conferi as três recomendações que deixei.

**Campos pessoais tocados:** nenhum campo novo e nenhuma migration. Duas coisas mudaram de forma:
- O `DecisaoService.decidir` agora junta as matrículas aprovadas num array em memória (`aprovadas`). Esse array só serve para montar a chave HMAC do contador de login. A matrícula não vai para a resposta, para o log nem para a auditoria.
- A linha "Auditoria" do `docs/lgpd.md` ficou mais precisa. Ela diz que o registro guarda só ids, estados e datas, e cita o `alunoId` da decisão como o elo da pergunta de fechamento.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok, sem mudança. O `#decidirUm` continua usando `travarPendente` e `alcancavel` com o alcance da sessão. A mudança de lugar do zerar não mexe nisso.

**Logs:** limpos.
- Os arquivos da sala continuam sem logger.
- O erro interno que para o lote tem mensagem fixa ("nome do pedido pendente não encontrado"), sem dado pessoal.
- O `ContadorDeTentativas.zerar` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts:241-251`) nunca lança. Por isso o `finally` de `decisao.service.ts:107-110` não esconde o erro original: o 500 continua saindo pelo filtro tipado.

**Auditoria:** presente e sem mudança. `turma.reivindicacoes_lidas` e `reivindicacao.decidida` continuam gravados na mesma transação de cada leitura ou decisão.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. O teste novo "E22 com o lote parado no meio" grava um ano 2025, a turma "Antiga", "Nome antigo", uma matrícula `antiga-<uuid>` e `hash-sintetico`.

**Exposição:** o teste novo prova a regra 20, item 11. O 500 sai só com `erro.{codigo, mensagem, requisicaoId}` e sem a mensagem interna (`decisao.int.test.ts:214-218`). Ele também prova que o lote parado no meio mantém as aprovações feitas antes do erro e zera o contador de cada uma.

**Conferência das recomendações da 1ª rodada:**
1. **Eliminação do aluno aprovado:** foi para a 10.0. A "Nota da 8.0" está em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/10_task.md:39-43`, apontando para a 10.3 (V3) e para o `/validar`. O destino está certo, e o `/validar` precisa fechar isso antes de qualquer dado que não seja sintético.
2. **O `alunoId` no `docs/lgpd.md`:** aplicada, na linha "Auditoria" de `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`.
3. **Linha `pedidos.ts:19` em "Mutações":** aplicada, em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/8_task.md:168`. A explicação de que a mutação só fica vermelha tirando os dois `.strict()` é coerente.

**Pergunta de fechamento:** o código responde, pelo mesmo caminho da 1ª rodada: `usuario`, depois `credencial_matricula`, depois `vinculo`, depois a `lista_nome` aprovada, depois a `reivindicacao`, e por fim `reivindicacao.decidida` pelo `alunoId`. Agora esse elo também está escrito no `docs/lgpd.md`. Nada foi enviado para fora.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. A recomendação 1 da 1ª rodada continua aberta para a 10.0 e o `/validar`.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-09-27 02:46:45 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. `apps/api/src/sala/` não grava `Nota` e não usa `lancadaPor`. Todos com autor humano? Não se aplica.
Decisão autônoma sobre aluno: ausente. Nada decide sozinho. O que muda a situação do aluno (entrar ou não na turma, pela reivindicação de nome, D4) só acontece quando o professor ou a coordenação chamam `POST /v1/reivindicacoes/decidir`. A mudança desta rodada tirou do laço só o zerar do contador de login. A decisão continua em `#decidirUm` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts:129-155`): uma transação por id, com `decidida_como` vindo do alcance da sessão e a auditoria `reivindicacao.decidida` gravada na mesma transação (linha 152).
Aprovação registrada: ok. A decisão humana continua auditada por id. O teste novo "E22 com o lote parado no meio" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts:181-224`) mostra que um erro no meio do lote não decide os ids seguintes e não desfaz os anteriores. A resposta sai curta e tipada. O `finally` (linhas 107-110) só zera os contadores das matrículas já aprovadas por uma pessoa e não cria nenhuma decisão.
Supervisão do tutor: não se aplica. A tarefa não toca o tutor.
Autonomia declarada e visível: não se aplica. A tarefa não tem agente de IA.
Bloqueantes: nenhum.

O que conferi nesta rodada:
- **Item 1 do diff (o zerar fora do laço).** Não abre caminho de decisão automática. O contador só recebe matrícula que saiu de uma aprovação já confirmada no banco, e o teste prova que os dois contadores zeram mesmo quando o lote para no meio.
- **Item 2 (`sala.module.ts`).** Só troca a ordem de um import e liga os serviços. Nada de conformidade.
- **Item 3 (minhas duas recomendações da 1ª rodada).** Estão feitas como notas de destino:
  - A marca aparece como fato sobre o pedido, nunca como suspeita sobre o aluno: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/16_task.md`, "Nota da 8.0".
  - A recusa aparece como decisão de uma pessoa, e o aluno sabe que pode pedir o nome de novo: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/17_task.md`, "Nota da 8.0".
- **`docs/lgpd.md`.** A linha de Auditoria agora declara o `alunoId` na decisão da reivindicação. É um id, sem nome, matrícula ou texto sobre a pessoa, e bate com o que a linha 152 grava. Nada de inferência nem de vigilância (itens 7 e 9 da regra 70).
- **Notas nas tarefas 9 e 10.** Tratam de carga e de eliminação de dado, sem efeito na regra 70.

Recomendações: nenhuma nova. As duas da 1ª rodada seguem registradas para o `/validar`, com destino na 16.0 e na 17.0.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-27 02:46:47 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (a aprovação zera o contador de login), sala
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

Conferência da rodada nova (só o diff desde a 1ª rodada):
- A recomendação 1 foi aplicada. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts:100-110`, o zerar saiu do laço e agora roda uma vez depois do lote, no `finally`, com `Promise.all`. O ioredis manda os comandos juntos, então com o Redis de login lento a espera é a de um comando, e não mais 40 × 100 ms. O `finally` pode trocar o erro original se o zerar lançar, mas o `zerar` não lança com o Redis fora: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.test.ts:60-66` prova isso.
- O teste "E22 com o lote parado no meio" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts:181-224`) cobre o que interessa:
  - dois aprovados no mesmo lote, e os dois entram, não só o primeiro;
  - um id depois do erro, que continua `pendente`;
  - o 500 curto e tipado.
- A recomendação 2 foi anotada como "Nota da 8.0" em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/9_task.md:49-53`. Ela também está registrada em `8_task.md:187`, com destino 9.0.
- `sala.module.ts` mudou só na ordem de um import e não tem efeito em carga.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/9_task.md:49-53`: quando o K2 da 9.0 medir o `decidir` em lote de 40, vale medir também o p95 com o Redis de login lento. É o caso que a mudança do `finally` resolve, e hoje ele não tem número de carga.
- O hook ainda exige `node tools/processo/portao-local.ts --infra` antes do commit. Não reprovei por isso, como foi pedido.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-27 02:46:55 · `tasks/prd-apresentacao-escola/8_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: o `conferir` responde "portão local: o último não rodou infra. Rode `node tools/processo/portao-local.ts --infra`." Não reprovo por isso, porque você informou a decisão do Joaquim de rodar o `--infra` só no portão final. Conferi o resto à mão. O carimbo cobre typecheck, lint e test e começou às 02:36:15 (-03). O último arquivo de código alterado, `decisao.service.ts`, é das 02:36:08, então as três suítes rodaram sobre o código atual. Depois do carimbo só mudaram arquivos `.md`. O hook bloqueia o commit sem o `--infra`, porque o `infra-guardian` é obrigatório nesta tarefa.

Bloqueantes: nenhum

Conferência das correções desta rodada:
- **Zerar do contador depois do lote** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts:96-112`): os contadores são zerados no `finally`, em paralelo. Um erro no meio do lote não impede zerar os já aprovados, e o erro original continua subindo. O `zerar` não lança (`contador-de-tentativas.ts:238`). O `#decidirUm` devolve `DesfechoDoPedido`, e a matrícula só chega ali depois do commit da transação daquele id. O docblock do `decidir` diz que o 5xx não desfaz os ids já decididos e que a tela relê os pedidos.
- **Teste "E22 com o lote parado no meio"** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts:181-224`): o teste falharia com o zerar de volta ao laço ou fora do `finally`, porque o segundo login seguraria. Também confere que o 500 sai só com `codigo`, `mensagem` e `requisicaoId`, e que o pedido quebrado e o seguinte ficam pendentes. O ano 2025 é criado numa escola nova, então não colide com o que outras execuções deixaram no banco.
- **Ordem do import** no `sala.module.ts`: feita.
- **Documentos**: a tabela "Recomendações sem aplicar" do `8_task.md` diz o destino ou o motivo de cada recomendação. As notas nas tarefas 9.0, 10.0, 16.0 e 17.0 batem com a 10.3 e o V3 do `cenarios.md`. A linha "Auditoria" do `docs/lgpd.md` agora cita o `alunoId`.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts:108`: `exigirEscolaDoContexto()` roda no `finally` mesmo quando não há aprovada, por exemplo num lote só de recusas. Se um dia lançar ali, o erro de agora esconde o erro original do laço. Pôr a chamada atrás de `if (aprovadas.length > 0)` elimina esse caso sem custo.

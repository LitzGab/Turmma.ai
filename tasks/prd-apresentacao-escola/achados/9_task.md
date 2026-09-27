# Achados das revisões — `tasks/prd-apresentacao-escola/9_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-27 04:37:07 · `tasks/prd-apresentacao-escola/9_task.md`

**VEREDITO: REPROVADO**

**Cenários exigidos:**
- **E29, caminho feliz e isolamento:** revoga os acessos vigentes de A, link e código passam a dar 404, uma auditoria por acesso com `autor_operador`, e B fica intacta.
- **E29, bordas:**
  - a segunda execução revoga zero;
  - o acesso vencido e o derrubado pelo "Gerar novo" ficam como estavam;
  - escola inexistente dá `NAO_ENCONTRADO`;
  - id que não é UUID (ou o slug) dá `ArgumentoInvalido` com saída 2.
- **E29, permissão:** sem `OPERADOR` o comando recusa antes de tocar no banco. O `OPERADOR` inexistente ou desativado, com operador ativo na base, também precisa ser recusado (conferência "Autor ativo" da A0b, que é a linha 52 do comando).
- **Concorrência:** duas execuções em paralelo, sem auditoria em dobro.
- **Log novo:** saída só com a contagem.
- **L11:** limiar, `for:`, sem agrupar, entrada do runbook, e o `escolaId` da linha de log aceito pelo leitor do comando.
- **L12:** ataque sustentado vai a pendente e depois a disparado; a rajada do primeiro dia nem fica pendente; cessado o ataque, volta a normal.
- **K1 e K2:** zero duplicidade, zero 5xx, `decidir` abaixo de 2 s, e o p95 do login da outra escola na régua do F1.

**Cobertos:**
- **E29** em `apps/api/test/ops-revogar-acessos-sala.int.test.ts:102-156`: o comando roda de verdade e o link e o código são conferidos pela página pública. A asserção sobre a auditoria é exata, a B intacta prova a cláusula de escola no `update`, e vencido, já revogado e segunda execução estão lá.
- **Concorrência** real com `Promise.all` e dois pools (`:158-166`). Ela pegaria a remoção de `revogado_em is null`.
- **Recusa antes do banco** com `bancoProibido`, e o leitor de argumentos, em `apps/api/src/ops/revogar-acessos-sala.test.ts`.
- **L11** em `infra/test/alertas.test.ts`: o `LimitesDaSala` de verdade escreve a linha, e o teste compara com a constante, passa o `escolaId` ao leitor e confere o runbook e o `package.json`.
- **L12** em `alertas.int.test.ts`: disparo depois de 300 s de pendência, sem `escola_id` nem IP nos rótulos. A rajada de 420 códigos exige `increase == 0` e estado sempre `normal`. A volta a normal vem da espera do ensaio, que cobre todas as `REGRAS_DO_ENSAIO`.
- **K1 e K2:**
  - o veredito, a conferência de duplicidade, as proporções de 20% e 10% e os thresholds estão em `infra/test/carga-sala.test.ts`;
  - a carga rodou e o resultado está registrado;
  - o k6 conta o 503 em "zero 5xx";
  - não há provedor pago.

**Bloqueantes:**
1. **O `OPERADOR` inativo ou inexistente não tem teste neste comando.** O ponto está em `apps/api/src/ops/revogar-acessos-sala.ts:52` (`const autorOperador = await autor(tx)`), com a lista de casos em `apps/api/test/ops-operador.int.test.ts:170-240`.
   - **O problema:** a C2, "em cada ops:*", lista escola, convite-coordenador, revogar-convite, redefinir-mfa, uso e operador, e não inclui `revogar-acessos-sala`. Os testes do E29 rodam sem nenhum operador ativo na base, e aí `autorDoComando` aceita qualquer apelido no formato.
   - **O efeito:** se a conferência for trocada por aceitar o apelido direto, ou movida para depois do `update`, nenhum teste fica vermelho. Um operador desativado conseguiria revogar em massa os acessos de uma escola sem teste que prove a recusa. A linha 52 da tabela de Mutações testa só a gravação do autor, não a conferência.
   - **Correção exigida:** incluir o caso `revogar-acessos-sala` na tabela da C2. Os `argumentos` devem apontar para uma escola com acesso vigente (ou `--escola <uuid>` de uma escola montada). O `nadaFeito` deve provar que nenhum `acesso_turma` foi revogado e que não há `acesso_turma.revogado` na auditoria. Para os recusados (`ninguem`, `bruno`, `fundadora`), a saída esperada é `{ codigo: 2, saida: '', erro: RECUSA_DO_OPERADOR }`, e o `passou` deve provar que `ana` revoga. Atualizar também o docblock de `autorDoComando` em `apps/api/src/ops/comando.ts`, que ainda fala em "cinco comandos de escola".

**Recomendações:**
- **Ano letivo:** a divergência "o `update` não filtra o ano" é decisão registrada, mas nenhum teste a fixa. Um caso com acesso vigente de outro ano letivo revogado junto evitaria que alguém "corrija" isso depois sem perceber.
- **Casts no L11:** o teste usa `{ status: 'end' } as unknown as Redis` e `as never` no logger. Um objeto com o tipo mínimo, ou um `Pick<Logger, 'warn'>`, deixaria o stub tipado.
- **Mutações:** a tabela não tem linha para a conferência do autor (ver o bloqueante). Vale acrescentar quando o teste existir.
- **Homônimos na carga:** o K1 disputa a mesma matrícula, mas `montarAlunos` gera nomes únicos por turma. Dois alunos com o mesmo nome na mesma turma, sob carga, ficaria como cobertura extra, se as tarefas anteriores ainda não cobrirem esse caso em concorrência.

Não editei nenhum arquivo e não rodei mutação. A falta de teste está confirmada lendo os testes do E29 e a tabela da C2.

## test-engineer · 2ª rodada · APROVADO · 2026-09-27 04:49:01 · `tasks/prd-apresentacao-escola/9_task.md`

VEREDITO: APROVADO

Cenários exigidos (nesta rodada): o comando `ops:revogar-acessos-sala`, rodado com um `OPERADOR` que não existe (`ninguem`), com um desativado (`bruno`) ou com o do bootstrap (`fundadora`) quando já há operador ativo, é recusado com `{ codigo: 2, saida: '', erro: RECUSA_DO_OPERADOR }`. Nesse caso nenhum `acesso_turma` é revogado e nenhum `acesso_turma.revogado` entra na auditoria da escola. O operador ativo (`ana`) passa e revoga. O docblock de `autorDoComando` precisava citar o comando novo.

Cobertos:
- **Correção 1 feita.** O caso `revogar-acessos-sala` está na tabela da C2 (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-operador.int.test.ts:232-242`). O `it.each` passa pelos três recusados (`ninguem`, `bruno`, `fundadora`). Depois de cada um, o `nadaFeito` confere duas coisas: o `revogado_em` nulo no id exato do acesso vigente, e nenhuma linha de revogação na auditoria daquela escola. O `passou` exige exatamente `{"revogados":1}`. Isso prova também que nenhum recusado revogou antes, porque senão a contagem seria 0.
- **O teste falharia sem a regra.** Com `autorDoComando(operador)` na linha 79 de `revogar-acessos-sala.ts` trocado por aceitar o apelido direto, os recusados sairiam com código 0 e revogariam o acesso. Assim o `toEqual` da recusa e o `revogado_em` nulo ficariam vermelhos. A linha da tabela de Mutações (`9_task.md:155`) aponta para o lugar certo.
- **A montagem da sala não depende de operador.** O `beforeAll` monta a sala pela API e pela bancada, sem nenhum `ops:*`, então não esbarra nos operadores que a C3 deixa ativos. O `beforeEach(limparOperacao)` só apaga tabelas de operação, e a sala continua de pé entre os casos.
- **Docblocks atualizados.** Os dois de `apps/api/src/ops/comando.ts` citam o comando novo, e a contagem passou para "seis comandos de escola".
- **Teste do outro ano letivo.** O teste novo em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-revogar-acessos-sala.int.test.ts:140-164` prova que um acesso vigente de outro ano letivo também é revogado: `revogados: 2`, `revogado_em` preenchido, nenhum vigente sobrando na escola e a auditoria com o `entidade_id` desse acesso. Ele falharia se o `update` filtrasse também pelo ano letivo do contexto.
- **L11 em `alertas.test.ts`.** O teste passa pelo limite da sala de verdade, só com um cliente Redis mínimo e fora do ar. O tipo `Pick<Redis, 'status'>` e o logger sem `as never` não enfraquecem a asserção.
- Não achei `.skip`, teste comentado nem mock de código nosso que esconda a regra.

Bloqueantes: nenhum.

Recomendações:
- A escola que o `beforeAll` da C2 monta fica no banco de teste depois do arquivo. Isso segue o padrão dos outros testes de sala e não quebra nada, porque as consultas filtram pelo id. Se o `/retro` tratar do acúmulo no banco de teste (regra 40), ela entra na lista.

Não mudei nenhum arquivo nem rodei a mutação. A prova de que o teste ficaria vermelho vem da leitura do código e do teste, junto com o relato de que a mutação foi rodada.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-27 04:50:14 · `tasks/prd-apresentacao-escola/9_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration. `acesso_turma` só ganhou um `update` novo, que usa o índice parcial `acesso_turma_um_por_turma (escola_id, turma_id) where revogado_em is null`, começando pela escola. `auditoria` é gravada pelo `RegistroDeAuditoria.gravar`, com a escola tirada do contexto e não do argumento. `escola` é lida pelo `AcessoDaEscolaRepository.nome()`, com `id = exigirEscolaDoContexto()`.

Queries verificadas:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.repository.ts:93-99`, `revogarVigentesDaEscola`: o escopo `escolaId` vem do contexto, com `revogado_em is null` e `expira_em > now()`. Não filtra `anoLetivoId`, e isso é intencional: a divergência está registrada na Tech Spec, seção 6, e tem teste próprio. Um acesso vigente de outro ano não abre a sala, e revogá-lo não tira nada de ninguém.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/acesso-publico.repository.ts:13`, `nome()`: a única mudança é aceitar transação. O escopo continua o mesmo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/revogar-acessos-sala.ts:48-61`: o autor é conferido antes de qualquer leitura. O contexto da escola é montado a partir do `--escola` do operador, igual ao `ops:uso`. Não entrou nenhum `@SemEscopo` novo. O comando não é endpoint HTTP e só roda com `OPERADOR` ativo, conferido na transação.
- As queries dos scripts de carga (`/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-sala.ts:79-90`) filtram todas por `escola_id` e rodam só contra o banco do compose de carga, que é sintético.
- Nenhum endpoint novo aceita `escolaId` do cliente. O alerta soma a métrica sem agrupar por escola nem por usuário, e a série não tem escola.

Teste de isolamento: presente e efetivo. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-revogar-acessos-sala.int.test.ts:129-133`, o E29 confere que a escola B continua abrindo pelo link e pelo código e que `revogado_em` dela fica nulo. Se a cláusula `eq(acessoTurma.escolaId, ...)` do `update` sair, o acesso de B é revogado e o teste quebra. A auditoria sozinha não pegaria isso, porque ela grava na escola do contexto; quem pega é o `revogadoEm` de B. A mutação registrada no `9_task.md` bate com esse raciocínio. O caso de escola inexistente responde `NAO_ENCONTRADO` sem gravar nada. Os ids continuam UUID, conferidos pelo `z.uuid()` do leitor.

Bloqueantes: nenhum.

Recomendações:
- Hoje o E29 só confere o isolamento pela turma do acesso vigente de B. Um segundo acesso vigente em outra turma de B tornaria mais explícito que nenhum acesso de B cai.
- No teste de concorrência, afirmar também que B fica intacta.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-27 04:50:29 · `tasks/prd-apresentacao-escola/9_task.md`

VEREDITO: APROVADO

A tarefa 9.0 não cria campo pessoal, não envia nada para fora e não escreve log com dado de pessoa. O comando novo revoga os acessos só da escola pedida e grava uma auditoria por acesso revogado. Não rodei o portão nem a suíte: a análise vem da leitura do código e dos testes.

**Campos pessoais tocados:** nenhum campo novo e nenhuma migration. O comando lê o nome da escola só para saber se ela existe, e esse nome não aparece na saída. A carga cria alunos com nome gerado ("Aluno 07 da turma 03"), matrícula gerada e uma senha sorteada na hora de cada execução.

**Fora da tabela de dados do `docs/lgpd.md`:** nada.

**Autorização por objeto:** ok.
- O `update` em `apps/api/src/sala/acesso-da-turma.repository.ts:93-99` filtra pela escola que o comando pôs no contexto, e não por um parâmetro de quem chamou. Não há `@SemEscopo` novo.
- A escola só é usada depois da conferência do autor (`revogar-acessos-sala.ts:52`), que roda antes de qualquer leitura.
- Trocar o id: o E29 prova que a escola B fica intacta. Um `OPERADOR` ausente, inexistente, desativado ou o do bootstrap é recusado sem revogar nada (C2 em `apps/api/test/ops-operador.int.test.ts:232-242`).
- Escola inexistente dá `NAO_ENCONTRADO`. Isso é aceitável aqui: é um comando interno do operador, não uma rota exposta.

**Logs:** limpos.
- A linha `sala.limite_atingido` (`limites-da-sala.ts:171`) traz só `evento`, `tipo` e `escolaId`.
- O comando imprime só `{"revogados":N}`, e o erro traz só o código.
- As mensagens de erro citam a opção, nunca o valor recebido (há teste para isso).
- A carga e a conferência imprimem só contagens e rótulos. O `chamarApi` troca os UUIDs do caminho por `:id` e não repete o corpo da resposta, que traz o token do acesso.
- O alerta e o disparo não trazem `escola_id` nem IP, e há teste para os dois.

**Auditoria:** presente.
- Cada acesso revogado gera um `acesso_turma.revogado` com `autor_operador`, na mesma transação.
- A concorrência está provada: duas execuções ao mesmo tempo não duplicam registro.
- É a mesma ação já definida para a revogação feita pelo professor (`acesso-da-turma.service.ts:87`), e o registro aceita só a lista fechada de campos dela.

**Envio externo:** nenhum. Não há IA nesta tarefa.

**Seed/fixture:** sintético.
- Escolas e redes com nome "sintética", nomes e matrículas gerados, e o ensaio tenta códigos sorteados.
- A pasta temporária da carga é apagada ao fim de toda execução, passe ou não (`carga-sala.ts:466`), e o compose sobe e desce com `--volumes`.

**Pergunta de fechamento:** o código responde. A tarefa não guarda nada novo sobre aluno nem envia nada para fora. A revogação fica consultável na auditoria da escola, com autor, data e o id de cada acesso e turma.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O `contas-<fase>.json` fica com permissão 0644 dentro de uma pasta 0777 enquanto a carga roda (`carga-sala.ts:369` e `:423`). Com senha e tokens sintéticos isso não é risco. Vale um comentário dizendo que o padrão não serve para nada fora do compose de carga, para ninguém copiar.
2. O `acesso_turma.revogado` do operador e o do professor só se distinguem pelo `autor_operador`. Se o dossiê de conformidade (D61) precisar separar "revogação por ataque" de "revogação de rotina", o caminho é uma ação própria ou uma finalidade na definição dela. Fica para o `/retro`.
3. A saída 1 com `NAO_ENCONTRADO` para escola inexistente confirma que o id não existe, mas só para quem já tem `OPERADOR` e acesso ao banco de operação. É coerente com os outros `ops:*`; apenas registro que é aceitável por não ser rota exposta.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/revogar-acessos-sala.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-revogar-acessos-sala.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-operador.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/carga-sala.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-sala.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/k6/reivindicacao-em-sala.js`
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/ensaio-alertas.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/grafana/alertas/sala-codigo-errado-por-escola.yaml`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`

## infra-guardian · 1ª rodada · APROVADO · 2026-09-27 04:51:24 · `tasks/prd-apresentacao-escola/9_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login | sala | migration (nenhuma) | deploy (nenhum). O que mudou: comando do operador, alerta, cenário de carga e ensaio.
Rate limit: ok. Não há rota nova. O comando não lê IP. As rotas da sala continuam no `rl:ip` anônimo de 3.000 por minuto, e o K2 fica abaixo disso: 2.100 alunos atrás de um IP, com cerca de 1.300 requisições por minuto, e nenhum 429.
Fila e prioridade: ok. Não há job novo. O comando roda fora de request, numa transação só.
Concorrência: protegida. O `update ... where revogado_em is null and expira_em > now() returning` é relido sob a trava da linha, então duas execuções não revogam o mesmo acesso. O teste com `Promise.all` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-revogar-acessos-sala.int.test.ts:184` prova isso. O "Gerar novo" do professor ao mesmo tempo continua preso ao índice único parcial `acesso_turma_um_por_turma`.
Índice e paginação: ok. O `revogarVigentesDaEscola` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.repository.ts:93`) usa o índice parcial `(escola_id, turma_id) where revogado_em is null`. O comando atinge no máximo algumas dezenas de linhas por escola, e não é uma listagem.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok.
- O alerta `sala-codigo-errado-por-escola.yaml` soma as instâncias, não tem rótulo de escola nem de IP, tem `for: 5m` e limiar 10.
- A entrada do runbook existe e está na guarda `alerta-tem-runbook`.
- O L11 confere o evento, o campo `escolaId` e o comando com a opção que o leitor aceita.
- O `decidir` em lote de 40 foi medido na carga: p95 de 778 ms no K2 e de 215 ms com o Redis lento, contra o teto de 2 s. O login da outra escola ficou com p95 de 272 ms, dentro da régua do F1.

Bloqueantes: nenhum

Recomendações:
1. **Janela do teste da rajada pode pegar o fim do ensaio.** Em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts:224`, a janela do `increase` é `ceil(decorrido)+1` minutos. Ela começa até cerca de 2 min antes da rajada e pode pegar os últimos incrementos do ataque do ensaio, que roda logo antes no mesmo arquivo, contra a série da instância recriada. Se o L12 ficar vermelho no portão com `--infra`, confira isso antes de mexer na regra. Ancorar a janela no início da rajada elimina a dúvida.
2. **Na carga, o aprovado entra por login um depois do outro, por professor.** São cerca de 10 hashes ao mesmo tempo no K2, o que sai do resultado de 27/09 registrado no `9_task.md`. A rajada de 35 a 40 logins de uma turma no mesmo minuto fica coberta só pelo cenário do login às 7h30 do F1 (`infra/k6/login-7h30.js`). Vale citar essa dependência na seção "Rodar o cenário da sala" do runbook: se alguém mudar o cenário do F1, esta cobertura cai junto.
3. **Na fase `k2_redis_lento`, a entrada do aprovado é medida mas não cobrada** (`/home/joaquimdp/Documentos/git/Educa.ia/infra/k6/reivindicacao-em-sala.js:133`). Fica para o `/validar` decidir se algum limite vale ali, por exemplo "entrou em até 30 s", porque o Redis lento é justamente o caso em que o login cai para o seguro em memória.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-27 04:51:51 · `tasks/prd-apresentacao-escola/9_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: há uma divergência no L12 que está registrada só no `9_task.md`. As demais divergências da seção "Divergências resolvidas nesta tarefa" estão na `techspec.md` (seção 6, e 7c para K1/K2) e no `cenarios.md` (K1 e K2), ou não contrariam o texto dos cenários.
Portão local: o `conferir` responde "portão local: o último não rodou infra. Rode `node tools/processo/portao-local.ts --infra`.". Como você pediu, isso não conta como bloqueante, porque o `--infra` fica para o portão final. Conferi à parte que o carimbo de typecheck, lint e test (`.processo/portao.json`, início 07:38:38Z) vale para a árvore atual: nenhum arquivo mudou depois dele.

Bloqueantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md:348`, no L12. O cenário diz que o L12 inteiro roda "pelo `ensaio:alertas`", e isso inclui "a rajada do primeiro dia (420 códigos errados em 5 min) nem fica pendente". Na implementação, a rajada virou um `it` próprio em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts` ("L12: a rajada do primeiro dia..."), rodado depois do ensaio e fora dele. A própria tarefa chama isso de divergência (`9_task.md:141-142`, "A rajada do primeiro dia do L12 é um teste próprio [...] e não parte dele"), mas o registro ficou só no `9_task.md`. Correção exigida: no L12 do `cenarios.md`, dizer que a parte sustentada roda pelo ensaio e que a rajada é um teste separado no mesmo arquivo, rodado com o ataque parado, porque a regra soma as escolas. Pela mesma razão, vale uma linha na `techspec.md` 7c, onde está o alerta.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/revogar-acessos-sala.ts:54`: o comando confere se a escola existe com `AcessoDaEscolaRepository.nome()`, o repository da página pública `/e/:slug`. O construtor dele passou a aceitar transação só por isso. Uma leitura com nome próprio (por exemplo `existe()`) no repository de escola da operação deixaria clara a intenção e não prenderia a tela pública ao comando.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts`, no teste da rajada: o `fetch` não tem `AbortSignal.timeout`, ao contrário do `iniciarAtaqueDeCodigo`. Uma resposta presa segura o teste até os 480 s em vez de falhar com a causa.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-sala.ts:121`: o `as unknown as ContagemDaEscola` passa por cima do tipo. Montar o objeto campo a campo, ou validar com `zod`, deixa o compilador conferir os oito campos.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts:171`: o evento continua escrito em texto literal ao lado de `EVENTO_DO_LIMITE_DA_SALA`, e o L11 é o que pega se os dois divergirem. Vale um comentário curto na chamada do log apontando para a constante, para quem trocar um lembrar do outro.

## test-engineer · 3ª rodada · APROVADO · 2026-09-27 05:03:26 · `tasks/prd-apresentacao-escola/9_task.md`

VEREDITO: APROVADO

Esta rodada cobriu só o diff desde a 2ª rodada, que tinha sido aprovada, e o que ele afeta. O resto não mudou e não foi reauditado.

Cenários exigidos: os mesmos da 2ª rodada. O que o diff toca:
- **E29**: o operador revoga os acessos de uma escola e a escola B fica intacta, inclusive com duas execuções em paralelo.
- **L12**: a rajada do primeiro dia (420 códigos errados em 5 min) não soma na métrica e não deixa a regra pendente.
- **Conferência da carga da sala**: a contagem por escola é conferida pelo script de carga.

Cobertos:
- **Isolamento do E29** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-revogar-acessos-sala.int.test.ts:103-138`): B agora tem dois acessos vigentes, em duas turmas. O teste confere que os dois continuam abrindo pelo link e pelo código (`toBe(200)`). O teste pega o acesso com `sala.acessoVigente`, que lança erro se o acesso da turma tiver sido revogado. Por isso a checagem de `revogadoEm(...)` que vem depois é redundante, mas não é uma asserção que passa sempre: a prova de fato está no `abre` e no próprio `acessoVigente`. O teste também exige que B não tenha nenhuma revogação do operador. Se a cláusula de escola do comando for removida, os quatro `abre` de B passam a dar 404 e o teste quebra.
- **Concorrência do E29** (linhas 189-201): a execução é paralela de verdade, com `Promise.all` de dois processos. A soma das contagens é 2 e há uma auditoria por acesso. B é montada antes e conferida intacta depois.
- **L12** (`/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts:188-235`):
  - `AbortSignal.timeout(15_000)`: um timeout lança erro e o teste falha. Não há passagem silenciosa.
  - A janela do `increase` começa no início da rajada e cobre também a espera de 25 s. O `floor` só encurta o começo em menos de 1 s, então o fim do ataque do ensaio fica de fora sem abrir brecha para falso verde.
  - Continuam valendo `status == {404: 420}`, o valor da regra igual a 0 e todos os estados em `normal`.
- **`conferir-carga-sala.ts:121-130`**: a contagem montada campo a campo não muda o comportamento. Um campo ausente vira `NaN` e reprova em `julgarContagem`, que segue coberto em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/carga-sala.test.ts:136-148`.
- **Registro exigido pelo `revisor-geral`**: está feito no `cenarios.md` (L12, linhas 350-354) e na `techspec.md` (7c, linha 206). Os dois dizem que a rajada é um teste à parte, rodado depois do ensaio e com o ataque parado.
- **Comentários**: as mudanças em `carga-sala.ts:368-369` e `limites-da-sala.ts:171` são só texto, sem efeito em teste. O mesmo vale para o trecho do runbook (linhas 603-605).
- **Sem `.skip`, `.only` ou teste comentado** nos arquivos do diff. Não há provedor de IA envolvido.

Bloqueantes: nenhum.

Recomendações:
- Em `alertas.int.test.ts:229-231`, se o Prometheus raspar o último incremento do ensaio depois de `inicio`, ele entra na janela. O resultado seria vermelho intermitente, nunca um verde falso. Se isso aparecer na esteira, a saída é esperar um intervalo de raspagem antes de marcar `inicio`.
- Em `ops-revogar-acessos-sala.int.test.ts:136-137` e `:199`, `revogadoEm(await sala.acessoVigente(...))` só confere de novo o que o `acessoVigente` já garante. Um comentário dizendo que a prova é o erro do `acessoVigente` e o `abre` evita que alguém depois ache que a asserção sobre `revogadoEm` basta sozinha.

## test-engineer · 4ª rodada · APROVADO · 2026-09-27 05:13:28 · `tasks/prd-apresentacao-escola/9_task.md`

VEREDITO: APROVADO

Cenários exigidos: não mudaram desde a 3ª rodada, que foi aprovada. Nesta rodada conferi só os dois trechos alterados e o que eles afetam.

Cobertos: continua valendo o que a 3ª rodada aprovou. Os dois trechos novos:

- **Rajada do L12** (`/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts:211-214`). A espera de 20 s vem antes de `const inicio = Date.now()`, e é isso que importa: a janela do `increase(...[segundos]s)` (linhas 233-234) conta a partir de `inicio`. Um incremento do ataque do ensaio que ainda estivesse a caminho do Prometheus fica fora dela. A amostragem de estado já roda durante a espera. Isso só deixa a asserção `estados.every(... 'normal')` mais estrita, sem afrouxar nada. O tempo cabe no limite de 480 s: 60 s de poll + 20 s + 300 s + 25 s ≈ 405 s, mais a latência das chamadas. Nenhuma asserção mudou, e o teste continua falhando se a métrica somar código errado dentro do teto da escola ou se a regra ficar pendente.
- **Comentários** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-revogar-acessos-sala.int.test.ts:136-137` e `:200`). Conferi o que eles afirmam contra `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sala-de-teste.ts:128-133`: `acessoVigente` busca `revogado_em is null` e lança erro se não houver exatamente um acesso. O comentário está correto: a prova de que B continua intacta são o `abre` com status 200 e o `acessoVigente`, e o `revogadoEm(...)` só repete o que já está garantido. Asserção, mutação e cobertura ficaram iguais.

Bloqueantes: nenhum.

Recomendações: nenhuma nova.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-27 05:13:57 · `tasks/prd-apresentacao-escola/9_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: há carimbo, mas sem `--infra`. O `conferir` responde "o último não rodou infra. Rode `node tools/processo/portao-local.ts --infra`". Pela sua decisão, o `--infra` roda no portão final, antes do commit, então isso não reprova esta rodada. O commit continua travado até esse portão rodar.
Bloqueantes: nenhum

A correção exigida na 1ª rodada foi feita nos dois lugares:
- **L12 no `cenarios.md`** (linhas 350 a 354): diz que o ataque sustentado e a volta a normal rodam pelo ensaio. Diz também que a rajada é um teste separado no mesmo arquivo, rodado depois do ensaio e com o ataque parado, porque a regra soma as escolas. Fala ainda da conferência do `increase` na janela da rajada.
- **7c na `techspec.md`** (linhas 206 e 207): tem a linha que faltava, com a referência a L12 e à 9.0.

O diff desta rodada (as recomendações aplicadas) não trouxe regressão:
- A rajada em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts` agora tem `AbortSignal.timeout(15_000)`, e a janela do `increase` começa no início da rajada.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-sala.ts` monta a contagem campo a campo, sem `as unknown as`.
- Os testes de concorrência e de revogação em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-revogar-acessos-sala.int.test.ts` conferem que a escola B, com dois acessos vigentes, fica intacta.
- Os comentários novos em `carga-sala.ts` (pasta 0777) e em `limites-da-sala.ts` estão certos. A constante `EVENTO_DO_LIMITE_DA_SALA` existe, e `infra/test/alertas.test.ts` confere que o log e o runbook usam o mesmo texto.
- A recusa da recomendação sobre `existe()` está registrada com motivo em "Recomendações sem aplicar".

Recomendações:
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts:172`, usar a própria `EVENTO_DO_LIMITE_DA_SALA` no `logger.warn` em vez do literal `'sala.limite_atingido'` com um comentário. Assim o comentário deixa de ser necessário. O teste de `alertas.test.ts` já pega a divergência, então não bloqueia.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-27 05:14:08 · `tasks/prd-apresentacao-escola/9_task.md`

VEREDITO: APROVADO

Caminho quente tocado: sala, login (a entrada do aprovado), métrica e alerta, carga, rotina de operação

Rate limit: ok. Nesta rodada só mudou um comentário, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts:171`. O limite por escola, por nome e por turma continua como foi aprovado na 1ª rodada.

Fila e prioridade: ok. Nada novo entrou na fila.

Concorrência: protegida. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-revogar-acessos-sala.int.test.ts`, o E29 agora dá a B dois acessos vigentes em duas turmas e confere os dois (linhas 104-106 e 132-138). O teste de concorrência também confere B depois das duas execuções ao mesmo tempo (191 e 197-200), com uma auditoria por acesso e nenhuma em dobro.

Índice e paginação: ok. Nenhuma query nova em tabela que cresce com aluno.

Degradação de IA: não se aplica.

Migration: não se aplica.

Métrica e alerta: ok.
- **Janela do L12** (`/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts:211-214` e `232-234`): minha recomendação foi feita. O teste espera 20 s de exportação e raspagem antes de marcar o início. O `increase` de `sala_limite_atingido_total{tipo="escola"}` agora cobre só do início da rajada até o fim, então o fim do ataque do ensaio fica de fora.
- **Fetch da rajada:** agora tem `AbortSignal.timeout(15_000)`. A soma das esperas cabe no teto de 480 s do teste.
- **Registro da rajada:** o L12 em `cenarios.md` e o 7c da techspec dizem que a rajada é teste à parte, rodado depois do ensaio com o ataque parado.

Runbook: minha recomendação foi feita. A seção "Rodar o cenário da sala" (`/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:603-604`) diz que a rajada de uma turma entrando no mesmo minuto é provada pelo cenário "login às 7h30".

Carga: em `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-sala.ts`, a contagem agora é montada campo a campo com `Number()` e passa por `julgarContagem` sem mudar o critério. O comentário novo em `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/carga-sala.ts:368-370` diz que a pasta com `0o777` só vale porque o dado é sintético.

Não rodei o portão, a suíte nem a carga, como você pediu. Não pesei o carimbo sem `--infra`.

Bloqueantes: nenhum.

Recomendações:
- Continua pendente, para o `/validar`, a recomendação do critério da entrada do aprovado no `k2_redis_lento`, já registrada em "Recomendações sem aplicar".
- O teste de concorrência do E29 confere só a turma principal de B, porque ali B tem um acesso só. Não bloqueia: o E29 já prova B com dois acessos.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-27 05:14:13 · `tasks/prd-apresentacao-escola/9_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. Esta rodada muda comentários, testes, a saída de conferência da carga e documentação. Não entra coluna nem migration, e nenhum DTO de saída muda.

Fora da tabela de dados do docs/lgpd.md: nenhum.

Autorização por objeto: ok. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-revogar-acessos-sala.int.test.ts:104-138` o E29 agora dá à escola B dois acessos vigentes, em duas turmas. O teste confere que os dois continuam abrindo pelo link e pelo código, que nenhum foi revogado e que B não tem auditoria do operador. Se a revogação perdesse o escopo de escola, esse teste falharia. O acesso que não existe e o acesso revogado continuam respondendo o mesmo 404.

Logs: limpos. Três pontos conferidos:
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts:172` a linha do log não mudou: grava só o evento, o tipo e o `escolaId`. O que mudou foi o comentário acima dela.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-sala.ts` a saída mostra só a fase e contagens numéricas.
- A saída do comando de revogação continua sendo só `{"revogados": N}`, e o E29 confere isso.

Auditoria: presente. Cada acesso revogado pelo operador gera um registro com `autor_operador`, e o E29 confere. A ação própria da revogação do operador, que foi minha recomendação 2 na rodada anterior, segue para o `/retro` e para a tarefa do dossiê, como combinado.

Envio externo: nenhum nesta rodada.

Seed/fixture: sintético. O comentário pedido na minha recomendação 1 está em `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/carga-sala.ts:368-369`. Ele diz que a pasta 0777 e o arquivo legível por todos só se justificam porque o dado é sintético e é apagado no fim da execução, e que o padrão não se copia para dado real. Das minhas recomendações, só a 1 pedia ação neste lote, e ela foi feita.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. A recomendação 2 da rodada anterior fica registrada no `/retro` e na tarefa do dossiê.

Pergunta de fechamento: o que esta rodada toca continua respondendo. A revogação pelo operador fica na auditoria, por acesso, e nada foi enviado para fora. As mudanças da rajada do L12 em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts` (timeout, janela a partir do início da rajada, uso só de códigos sorteados) e do runbook não tocam dado de pessoa.

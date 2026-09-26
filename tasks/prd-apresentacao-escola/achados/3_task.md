# Achados das revisões — `tasks/prd-apresentacao-escola/3_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-26 12:13:48 · `tasks/prd-apresentacao-escola/3_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- E8: o link sai uma vez, com `no-store`. A lista não traz token, link nem e-mail. Refazer derruba o convite anterior e revogar derruba o refeito. Vencido e aceito se comportam como a matriz manda.
- E9: o convite de professor vale 7 dias e o de coordenador 72 h, com as bordas do 6º dia e do 7º dia mais um minuto.
- E10: a conta de A aceita em B sem criar conta nova, confirma um vínculo e contesta outro. O vínculo pendente não alcança a turma.
- E11: resposta, lista e auditoria são iguais para conta nova e conta que já existia, também depois do aceite.
- R4: usado, vencido, revogado, refeito e inexistente dão a mesma resposta em `consultar` e em `aceitar` (com e sem senha), e nada é gravado.
- Segundo fator: o professor aceita e entra sem segundo fator, e o coordenador cai em `configurar_mfa`.
- I7 nos dois lados: operação e coordenação, mais cada filtro sozinho, na camada HTTP e na do repository.
- I3: por id nas rotas com parâmetro, e na lista com paginação.
- P1: professor e aluno recebem 404 nas quatro rotas.
- I9: as células novas da `MATRIZ`.
- A1: auditoria com o tipo e o autor.
- A3: DTO estrito, sem e-mail nem token, com a sentinela.
- A4: o log só com ids, conferido contra os tokens devolvidos, o nome e o domínio do e-mail.
- C7 em paralelo: dois cadastros do mesmo e-mail, e cadastrar × refazer, com `Promise.all` e com a ordem forçada na trava nas duas direções.
- Unidade de `estadoDoProfessor`: a borda `<=`, os seis estados e o E11 no `aceito`.

**Cobertos:** todos os cenários acima, em estes arquivos:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/professores.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/convite/estado-do-professor.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz.test.ts`

Toda cláusula nova do diff tem linha na seção "Mutações" ou é pega por uma asserção exata que eu conferi lendo o teste:
- o `tipo` gravado em `criarConvite` e o `papel` em `usuarioConvidado`: E8 (`convitesDa`) e E10;
- o `tipo` do `convite.aceito`: teste do segundo fator;
- a ordem `desc(expiraEm), desc(id)` na lista e em `dadosDoProfessor`: E8 "vencido" e o revogar do refeito.

A única cláusula sem teste que a derrube sozinha é a escola na segunda consulta de `professores.repository.ts:39`. Ela está declarada, e a FK `convite_usuario_da_escola_fk` torna a cláusula redundante de fato.

Não há `.skip`, `.only`, teste comentado nem mock. Não há chamada de IA. A trava da escola é provada pelo `emOrdemNaTrava`: sem a trava, o teste fica vermelho por esperar alguém na fila que nunca chega.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Clique duplo em refazer.** Não há teste de dois refazer do mesmo professor em paralelo. Pelo desenho (o refazer vai pelo `usuarioId`, sem o id do convite de origem), os dois respondem 201 e o primeiro link já nasce morto. No A0b, o refazer com id velho dá `CONFLITO`. O invariante de um convite em aberto se mantém pelo `convite_pendente_unico`, então não é bug de dado, mas a tela pode mostrar um link revogado. Sugestões:
   - acrescentar o teste com `Promise.all` e fixar o comportamento esperado;
   - levar o caso para a 14.0: botão travado enquanto o pedido está pendente, ou refazer com o id do convite de origem.
2. **Revogar × aceite do professor.** Não há teste com a ordem forçada. Hoje quem protege é só a trava, que o aceite também toma. O comentário em `convite.service.ts:412` ("se mudasse, o `update` não revogaria") é falso: `ConviteRepository.revogar` não filtra `usado_em`. Sugestões:
   - corrigir o comentário, ou pôr `isNull(convite.usadoEm)` no `where` do revogar de professor;
   - somar o teste `emOrdemNaTrava(aceitar, revogar)`, que deve terminar em `CONFLITO` sem gravar nada.
3. **Casos de borda do cadastro sem teste próprio.** O código é o mesmo do A0b, mas a rota é nova:
   - o mesmo e-mail com caixa diferente dá `CONFLITO`;
   - o e-mail de um professor com convite `vencido` ainda em aberto dá `CONFLITO` (o docblock afirma);
   - o e-mail do próprio coordenador da escola, o coordenador que também dá aula, deixa o usuário de coordenação intacto;
   - dois professores com o mesmo nome e e-mails diferentes viram dois usuários.
4. **Refazer e revogar sem corpo nenhum.** O caso `corpo ?? {}` do controller não é exercitado: todos os testes mandam `{}`. Na seção "Mutações", falta a linha do corpo estrito do revogar, embora a variante 400 de `escola-montada` já a pegue.
5. **Para o `privacy-guardian`.** Na auditoria, o `convite.aceito.usuarioAtivo` e o `usuario.ativado_por_convite`, que só aparece para a conta que já existia, distinguem conta nova de conta existente. Hoje nenhuma rota da coordenação lê a auditoria, mas o dossiê (D61) vai expor esses registros. Convém anotar esse limite junto do E11.

## test-engineer · 2ª rodada · APROVADO · 2026-09-26 12:26:04 · `tasks/prd-apresentacao-escola/3_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da 1ª rodada (E8, E9, E10, E11, R4, o segundo fator, I7 dos dois lados, I3, P1, I9, A1, A3, A4, C7 em paralelo, e a unidade de `estadoDoProfessor`). A essas somam-se as cinco recomendações da 1ª rodada, que agora cobrem estes casos:
- clique duplo em refazer;
- revogar × aceite nas duas ordens da trava;
- bordas do cadastro: e-mail com outra caixa, convite vencido ainda em aberto, dois professores com o mesmo nome, e o coordenador que também dá aula;
- refazer e revogar sem corpo.

**Cobertos:** conferi as cinco correções, todas no arquivo `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/professores.int.test.ts`, salvo onde indico outro.

- **Clique duplo em refazer (linhas 488-503).** O teste usa `Promise.all` de verdade. Ele exige que os dois pedidos respondam 201, que sobre um convite em aberto, que só o link do convite aberto responda 200 em `consultar` e que o outro link e o original respondam 404. A trava do botão foi para "Herdado da 3.0" em `14_task.md:72`.
- **Revogar × aceite (linhas 505-527).** O teste usa `emOrdemNaTrava`, e isso prova que o aceite de professor pega a trava da escola: sem ela, `esperarNaTravaDaEscola(…, 2)` não chega a 2 e o teste fica vermelho. Com o aceite primeiro, o revogar dá CONFLITO, sem nenhum `convite.revogado` e com o estado `aceito` na lista. Se a matriz de estado fosse removida, o `update` do revogar gravaria a auditoria, porque não filtra `usado_em`, e o teste pegaria. Com o revogar primeiro, o aceite responde NAO_ENCONTRADO e o usuário continua desativado.
- **O comentário em `apps/api/src/sessao/convite.service.ts:446-447`** agora descreve o que o código faz de fato.
- **Bordas do cadastro (linhas 405-424).** Os quatro casos têm asserção sobre o resultado:
  - o e-mail com outra caixa dá CONFLITO;
  - o convite vencido ainda em aberto dá CONFLITO, e os usuários não mudam;
  - dois professores com o mesmo nome viram dois `usuarioId` diferentes;
  - o coordenador que dá aula ganha um usuário `professor` na mesma conta, e a linha de coordenação fica idêntica à de antes.
- **Sem corpo (linhas 426-431).** O teste exercita o `corpo ?? {}` do controller (`professores.controller.ts:35,44`). Sem o `?? {}`, o contrato estrito recusaria o `undefined`. A linha do corpo estrito do revogar está em `3_task.md:156`.

Não há `.skip`, `.only`, teste comentado, mock nem chamada de IA no diff. Não li `git diff` inteiro dos .md além das linhas citadas, e não rodei a suíte, como pedido.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `3_task.md`, seção "Mutações", falta a linha do `corpo ?? {}` de `professores.controller.ts:35,44`, que seria derrubado pelo teste "refazer e revogar sem corpo nenhum valem como com `{}`". As linhas 155-156 cobrem só o 400 do corpo estrito.
2. O teste do clique duplo (linha 488) usa só `Promise.all`. Por isso, a trava entre os dois refazer é provada só quando eles de fato se sobrepõem. Uma variante com `emOrdemNaTrava(refazer, refazer)` fixaria a ordem e diria qual link sobrevive, que é o que a tela da 14.0 vai precisar mostrar. A trava do refazer já está provada no teste de cadastrar × refazer, então fica como cobertura extra.
3. Na borda do convite vencido (linha 411), o teste confere que os usuários não mudaram, mas não confere os convites nem a auditoria. Comparar o `retrato` inteiro, como o R4 faz, fecharia o "sem gravar nada".
4. Continua de pé, para o `privacy-guardian`: a auditoria do aceite distingue conta nova de conta existente (`usuario.ativado_por_convite`). O limite já está anotado em "Divergências" do `3_task.md`.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-26 12:45:45 · `tasks/prd-apresentacao-escola/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (o aceite do convite e a primeira entrada do professor) | migration
Rate limit: ok. As rotas novas passam pela `GuardaDeLimite` global, que limita pelo `sub` e pelo `esc` do token com os limites da escola. Nenhuma rota nova tem limite ou bloqueio só por IP.
Fila e prioridade: ok. Não há nada demorado no request: sem e-mail, sem IA e sem lote. O argon2 do aceite roda fora da transação e fora da trava da escola (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts:103`).
Concorrência: protegida.
- Cadastrar, refazer e revogar entram na mesma trava por escola (`pg_advisory_xact_lock`) que o aceite, e ela é a primeira instrução da transação.
- O índice único `convite_pendente_unico` é a segunda camada.
- `revogarParaRefazer` e `revogar` fazem `update` condicional, com o `tipo` no `where`.
- `professores.int.test.ts` tem C7 com `Promise.all` e `emOrdemNaTrava`: dois cadastros do mesmo e-mail, cadastrar × refazer, clique duplo no refazer e revogar × aceite nas duas ordens.
Índice e paginação: ok. A lista pagina por cursor no índice único `(escola_id, id)` de `usuario` com `limite + 1`. Os convites são lidos só para os ids da página, pelo índice `convite_escola_usuario_idx`. `dadosDoProfessor` usa o mesmo índice.
Degradação de IA: não se aplica.
Migration: compatível.
- A 0018 só amplia o check `convite_tipo_valido`. A tabela `convite` é pequena, e `migrar.ts` aplica `lock_timeout` e tenta de novo.
- O código anterior já filtrava `tipo = 'coordenador'` em toda leitura da operação: linhas 104, 115 e 162 do `convite.repository.ts` e linha 469 do `resolucao-de-tenant.repository.ts`, conferidas em `HEAD`.
- Com o código revertido, o convite de professor em aberto é aceito como o de coordenador. Isso está previsto na Tech Spec, seção 3.
Métrica e alerta: ok.
- `http.server.request.duration` já mede toda rota pela rota template (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/telemetria/metricas.ts:154`), e isso cobre as rotas novas.
- Não há fila nova nem alerta novo, então não falta parágrafo de runbook.
Bloqueantes: nenhum.
Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/professores/professores.repository.ts:89`: a página percorre `(escola_id, id)` e descarta os usuários com `papel <> 'professor'`. Com os alunos da escola na tabela, cada página lê até todos os usuários dela. Hoje isso é barato (cerca de mil linhas, rota rara e só da coordenação). Quando `usuario` crescer, vale um índice parcial `(escola_id, id) where papel = 'professor'` ou um `(escola_id, papel, id)`, conferido com `EXPLAIN` sobre um seed de uma escola grande.
- O clique duplo no refazer gera dois links válidos em sequência, e o primeiro devolvido já nasce morto. O resultado no banco fica consistente, mas a coordenação pode copiar o link errado. A trava do botão já está registrada para a 14.0, e vale conferir lá.
- A trava por escola agora põe em fila todo convite de professor, junto com o aceite e a ativação do coordenador. As seções seguram a trava por pouco tempo e o argon2 fica fora dela, então está adequado para uma escola que cadastra dezenas de professores. Se entrar a importação de professores em lote, ela precisa manter o hash fora da trava e ir para a fila de lote, não para o request.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-26 12:45:47 · `tasks/prd-apresentacao-escola/3_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nome e e-mail do professor, que a coordenação digita no cadastro. O e-mail vai para a conta global e não aparece na lista. Também o convite de professor, que guarda o hash do token, as datas e o tipo. Nenhum campo de aluno foi tocado.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. A linha "Convite de professor" (`docs/lgpd.md:75`) já existia. "Nome, e-mail" do professor (`:59`) e "E-mail de login na conta global" (`:64`) cobrem o resto. O expurgo em `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts` apaga convites de qualquer tipo, então o prazo de 30 dias vale também para o de professor.

**Autorização por objeto:** ok.
- `ConviteRepository.dadosDoProfessor` (`apps/api/src/sessao/convite.repository.ts:198`) filtra pela escola do contexto, `tipo = 'professor'` e `papel = 'professor'`. Um usuário de outra escola, de outro papel, inexistente ou só com convite de coordenador recebe `NAO_ENCONTRADO`, a mesma resposta.
- `revogar` e `revogarParaRefazer` levam o tipo no `where`, e `escolaDoConviteParaOperador` continua preso a `coordenador`.
- A lista (`apps/api/src/professores/professores.repository.ts:30,39`) aplica a escola do contexto nas duas consultas.
- Pela `MATRIZ`, rede, professor e aluno nunca alcançam `professor.*`.
- As mutações do `3_task.md` confirmam que cada filtro é efetivo: I3, I7 e a lista ficam vermelhos quando o filtro sai.

**Logs:** limpos. Não há logger no código novo, e o A4 de `apps/api/test/escola-montada.int.test.ts:390` varre as quatro rotas no sucesso e em cada erro atrás de nome, e-mail e token.

**Auditoria:** presente.
- O cadastro grava `professor.cadastrado`, sem campo nenhum.
- `convite.criado`, `.refeito`, `.revogado` e `.aceito` levam o tipo.
- `contaNova` aparece só no convite de coordenador (`packages/nucleo/src/auditoria/acoes.ts`).
- A lista de professores não audita, e está certo: é dado de professor lido pela coordenação da mesma escola, não dado de aluno.

**Exposição:** ok.
- As saídas são contratos estritos: a resposta do cadastro e do refazer traz só `usuarioId`, `conviteId` e `token`; a lista traz só `usuarioId`, `nome` e `estado`.
- O token sai uma vez, com `no-store`, e o banco guarda só o SHA-256.
- O convite de professor vale 7 dias, é de uso único e pode ser revogado.
- Os corpos de entrada são estritos.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os testes geram nomes e e-mails inventados.

**Pergunta de fechamento:** esta tarefa não cria dado de aluno nem envio externo, então não piora a resposta que o código já dá à secretaria.

**Bloqueantes:** nenhum.

A conta global aceita sem prova de posse do e-mail. Isso já está declarado como risco na seção 13 da `techspec.md`, dentro do quarto afrouxamento da D71, com dado só sintético, e fecha no "Portão da primeira escola real".

**Recomendações:**
1. **Texto do limite do E11 em `tasks/prd-apresentacao-escola/3_task.md`, "Divergências".** O "(o bilhete vale 30 min)" dá a entender que a janela dura 30 minutos. Na prática ela dura até a primeira entrada, que pode nunca acontecer. Enquanto isso, cadastrar de novo o mesmo e-mail responde 201 para a conta que já existia e `CONFLITO` para a conta nova. Vale escrever o tamanho real da janela, para o item do portão da primeira escola real levar a medida certa.
2. **Auditoria que diferencia conta nova de conta existente.** `convite.aceito.usuarioAtivo` e `usuario.ativado_por_convite` mostram na auditoria se o e-mail tinha conta. Isso já está registrado para a tarefa do dossiê (D61). Quando alguma rota da coordenação expuser a auditoria, esses campos saem ou são agregados.
3. **Comentário desatualizado do expurgo.** `expurgo-de-acesso.repository.ts:12` ainda cita só a linha "Convite de coordenador". Vale citar também a de professor, e na linha 75 do `docs/lgpd.md` dizer "apagado pelo `sistema.expurgar-acesso`", como na linha do coordenador.
4. **Nome antigo maior que o limite derruba a lista.** A lista valida `nome` com o limite do nome digitado (`TAMANHO_MAXIMO_NOME_DIGITADO`). Um professor anterior à A1 com nome mais longo faria a lista inteira responder 500. Não vaza dado, porque a resposta de erro é genérica, mas vale conferir se o seed ou o F1 permitem nome maior.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-26 12:46:43 · `tasks/prd-apresentacao-escola/3_task.md`

VEREDITO: APROVADO

Tabelas verificadas:
- **Nenhuma tabela nova.** A migration 0018 (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0018_convite_professor.sql`) só amplia o check `convite_tipo_valido` para aceitar `professor`.
- **`convite`**: tem `escola_id`, FK composta `(escola_id, usuario_id)` para `usuario`, `convite_pendente_unico` por `(escola_id, usuario_id)` e id UUID v7. Não varia por período, então não precisa de `anoLetivoId`.
- **`usuario`**: tem `escola_id` e a chave única `(escola_id, conta_id, papel)`. Também não precisa de `anoLetivoId`.

Queries verificadas (em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/`):
- **`professores/professores.repository.ts` `pagina`**: a escola vem de `exigirEscolaDoContexto()` e está no `where` das duas consultas. A primeira filtra `papel = 'professor'`, a segunda `tipo = 'professor'`.
- **`sessao/convite.repository.ts` `dadosDoProfessor`**: filtra escola do contexto, `usuario_id`, `tipo = 'professor'` e `papel = 'professor'`. O join é pela escola e pelo usuário.
- **`revogarParaRefazer` e `revogar`**: filtram escola do contexto e o `tipo` recebido. Os chamadores da operação passam `'coordenador'`, os da coordenação passam `'professor'`.
- **`usuarioConvidado` e `criarConvite`**: gravam na escola do contexto, com o papel e o tipo do convite. O conflito só acontece dentro da escola.
- **`travarEscola`**: a chave da trava é a escola do contexto.
- **`resolucao-de-tenant.repository.ts`**:
  - `conviteValidoPorHash`: `@SemEscopo` que já existia, com a justificativa atualizada. Devolve só ids, o tipo e se a conta tem senha.
  - `contaParaConvite`: `@SemEscopo` que já existia, com a justificativa atualizada. Não lê nada da conta.
  - `escolaDoConviteParaOperador`: continua com `tipo = 'coordenador'`.
- **`@SemEscopo`**: nenhum novo.
- **Corpo e query string**: `escolaId` no corpo é recusado pelo `strictObject` e a variante 400 da `escola-montada` prova isso. `:usuarioId` fora do formato de UUID dá `NAO_ENCONTRADO`.
- **Camada rede**: `nunca` nas quatro células de `professor` da `MATRIZ`, testado no I9.

Teste de isolamento: presente e efetivo. Conferi mentalmente cada cláusula:
- **Sem a escola em `dadosDoProfessor`**, o id de B seria achado, o `update` com escola devolveria `CONFLITO` e o I3 de refazer e revogar em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts`, que espera 404, quebraria.
- **Sem a escola na primeira consulta de `pagina`**, o professor de B apareceria e o "I3 (lista)" em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/professores.int.test.ts` quebraria.
- **Sem o `tipo` ou o papel**, quebram o I7 "cada filtro sozinho" do lado da coordenação e o I7 da A1 em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts` do lado da operação.
- **Estado de B**: o `estadoDe(b)` agora inclui `usuarios` e `convites`, então "B não muda" também cobre as tabelas novas desta tarefa.
- **Existência**: o id de B, o id sorteado e o id fora do formato dão a mesma resposta. O `CONFLITO` do cadastro só compara com usuários da própria escola.

Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/professores/professores.repository.ts:98`: a escola na segunda consulta (convites) não tem teste que a derrube sozinha. Já está declarada em "Mutações" como segunda camada, e a FK composta a torna redundante. Um teste que grave direto no banco um convite de outra escola para um `usuario_id` da página fecharia a lacuna, se algum dia a FK mudar.
2. Até a prova de posse do e-mail, **qualquer coordenação** passa a poder definir a senha de uma conta global sem senha, e não mais só o operador. Um exemplo é o coordenador ainda pendente em outra escola. O risco é aceito pela D71 revista (techspec seção 13), e o `ROADMAP.md:529-532` já exige o teste de que a senha definida pelo link de uma escola não abre a conta no convite de outra. Vale citar esse caso concreto ao escrever aquele teste.
3. A janela de 30 min do E11 (cadastrar de novo o mesmo e-mail responde 201 ou `CONFLITO` conforme a conta já existisse) diz à coordenação se a conta existia antes. Está anotada em "Divergências" do `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/3_task.md` e cabe no mesmo risco da seção 13. Ela deve fechar junto com a prova de posse do e-mail.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-26 12:46:54 · `tasks/prd-apresentacao-escola/3_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em `techspec.md` §5 e §13 e em `cenarios.md` W1. Três achados da tarefa foram registrados só no `3_task.md`.
Portão local: carimbo válido (typecheck, lint, test, infra)

Bloqueantes:

1. **A alocação antes do aceite ficou anotada só na tarefa.** Está em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/3_task.md:116-120`.
   - **O conflito:** o professor cadastrado nasce inativo (`usuarioConvidado`, `desativado_em = now()`). A alocação do F1 só aceita usuário ativo (`apps/api/src/estrutura/vinculo.repository.ts:91`, `isNull(usuario.desativadoEm)`). Mas o W1 (`cenarios.md:332-334`), o RF7 e o fluxo da `techspec.md:85-88` fazem a coordenação cadastrar e alocar antes de o professor aceitar e confirmar.
   - **Consequência:** com o código atual, o E2E W1 como está escrito não passa. A spec não diz isso em lugar nenhum.
   - **O destino está errado:** o `14_task.md` diz "a 13.0 decide", mas o `13_task.md` não foi tocado. E a 13.0 é tarefa de web, enquanto a mudança seria na regra do F1, na API.
   - **Correção exigida:** registrar o conflito na `techspec.md` (§5, passo 1/2, ou §13), com quem decide e antes de qual tarefa. Marcar no `cenarios.md` que o W1 depende dessa decisão. Pôr a nota no documento da tarefa que vai decidir (o `13_task.md`, ou a que a spec apontar), sem implementar nada aqui.

2. **Dois limites do E11 foram registrados só na tarefa** (`3_task.md:100-107`). A tarefa diz que estão "dentro do risco da seção 13", mas a §13 da `techspec.md` (linhas 210-212) cobre só "o aceite revela se o e-mail tem conta" para quem tem o link. Os dois canais abaixo não estão lá:
   - **Cadastrar de novo o mesmo e-mail:** entre o aceite e a primeira entrada, a conta que já existia responde 201 e a conta nova responde `CONFLITO`. A coordenação fica sabendo, pela resposta do cadastro, se o e-mail tinha conta em outra escola.
   - **A auditoria do aceite:** o `convite.aceito.usuarioAtivo` e o `usuario.ativado_por_convite`, que só aparece para a conta que já existia, distinguem conta nova de existente. Isso vale para quando o dossiê (D61) expuser a auditoria.
   - **Correção exigida:** acrescentar os dois canais ao risco "Conta global de professor" da §13 da `techspec.md`, com o mesmo fechamento (a prova de posse do e-mail) e o destino do segundo (a tarefa que exportar a auditoria, com o `privacy-guardian`).

Recomendações:
- **Tabela "Mutações":** em `3_task.md`, falta a linha do `corpo ?? {}` de `apps/api/src/professores/professores.controller.ts:35,44` (2ª rodada do `test-engineer`).
- **Tamanho do nome na lista:** `esquemaProfessorDaEscola.nome` usa `TAMANHO_MAXIMO_NOME_DIGITADO` (200) no `parse` de saída. Um professor do F1 com nome acima disso derruba a lista inteira com 500. Vale confirmar que o limite do banco é o mesmo, ou validar a saída com o limite da coluna.
- **Tamanho do arquivo:** o `apps/api/src/sessao/convite.service.ts` passou de 450 linhas com os três casos de uso do professor. Separar `cadastrarProfessor`, `refazerConviteDeProfessor` e `revogarConviteDeProfessor` num arquivo próprio em `sessao/`, importando `convidar` e `refazerSobATrava`, deixaria cada tipo de convite legível sozinho.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/3_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/13_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`

## test-engineer · 3ª rodada · APROVADO · 2026-09-26 12:58:49 · `tasks/prd-apresentacao-escola/3_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da 1ª e da 2ª rodada: E8, E9, E10, E11, R4, o segundo fator, I7 nos dois lados, I3, P1, I9, A1, A3, A4, C7 em paralelo e a unidade de `estadoDoProfessor`. Somam-se as bordas das recomendações anteriores: clique duplo em refazer, revogar × aceite, bordas do cadastro e refazer e revogar sem corpo. Nesta rodada conferi só o que mudou desde a 2ª: as três recomendações aplicadas e a mudança dos casos de uso para outro arquivo.

**Cobertos:**
- **A linha do `corpo ?? {}` em "Mutações".** Está em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/3_task.md:161`. Aponta para as linhas certas: `professores.controller.ts:35` e `:44` são de fato o `lerEntrada(…, corpo ?? {})` do refazer e do revogar.
- **Dois refazer com a ordem forçada na trava.** O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/professores.int.test.ts:507-520`.
  - Usa o `emOrdemNaTrava` de verdade: sem a trava em `professorSobATrava`, o teste fica esperando o segundo pedido na fila e falha.
  - Exige que o link do segundo responda 200 e o do primeiro 404.
  - Exige que as origens do `convite.refeito` sejam `[convite original, convite do primeiro]`. Isso prova que o segundo refez o convite criado pelo primeiro, e não o original.
  - Os dois 201 não são conferidos pelo status, e sim pelo `parse` estrito das duas respostas: um erro não passaria pelo esquema.
- **O `retrato` inteiro na borda do vencido.** Está nas linhas 411-414. O retrato é tirado depois de o convite vencer e antes do cadastro. Convites, usuários e auditoria são comparados antes e depois, então o CONFLITO sem gravar nada fica provado.
- **A mudança para `convite-de-professor.service.ts`.**
  - `cadastrarProfessor`, `refazerConviteDeProfessor`, `revogarConviteDeProfessor`, `professorSobATrava` e `ConviteDeProfessorGerado` estão no arquivo novo.
  - O arquivo novo importa `convidar`, `expiraEmDo`, `refazerSobATrava` e `tokenNovo` de `convite.service.ts`. O caminho contrário não existe, então não há importação circular.
  - `professores.service.ts:11` importa do arquivo novo. Nenhum outro ponto do código chama os três casos de uso.
  - Conferi as linhas citadas em "Mutações" contra o arquivo atual e todas batem:
    - `convite-de-professor.service.ts`: trava no cadastro na 52, trava em `professorSobATrava` na 27, `NAO_ENCONTRADO` na 29, matriz do refazer na 73, `revogado` e `CONFLITO` na 90 e na 91, validade na 49, `professor.cadastrado` na 54 e `convite.criado` sem `contaNova` na 55;
    - `convite.service.ts`: `valido.tipo === 'coordenador'` na 120 e `CONFLITO` em `convidar` na 210.
  - As cláusulas são as mesmas. As mutações registradas continuam derrubando os mesmos testes.

**Bloqueantes:** nenhum.

**Recomendações:**
1. No teste da linha 507, vale explicitar `expect([primeiro.status, segundo.status]).toEqual([201, 201])` antes do `parse`. Hoje o 201 é provado de forma indireta: se o esquema de resposta mudar um dia, a falha vai aparecer como erro de parse, e não como "o segundo refazer foi recusado".
2. Na primeira leitura desta rodada, a seção "Mutações" ainda citava `convite.service.ts:124/381/406…`. Na segunda leitura já apontava para o arquivo novo, então o arquivo foi editado durante a auditoria. O estado que audito é o atual. Se ele mudar de novo antes do commit, as linhas precisam ser conferidas outra vez.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-26 13:18:35 · `tasks/prd-apresentacao-escola/3_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, infra)
Bloqueantes: nenhum

As duas correções da 1ª rodada foram feitas:

1. **Alocação antes do aceite.**
   - O novo risco "Alocação antes do aceite" está na §13 da `techspec.md`. Diz quem decide (o Joaquim) e quando (antes da 13.0), e traz as duas saídas com os guardiões que cada uma pede.
   - O W1 em `cenarios.md` agora diz que depende dessa decisão.
   - O `13_task.md` ganhou a seção "Decisão pendente, herdada da 3.0", e o `14_task.md` aponta para ela.
   - Nada foi implementado na alocação: o `vinculo.repository.ts` não foi tocado.

2. **Os dois limites do E11.**
   - Os dois canais entraram no risco "Conta global de professor" da §13, com o mesmo fechamento (a prova de posse do e-mail).
   - O primeiro é cadastrar de novo o mesmo e-mail. O texto dá a janela real: dura até a primeira entrada, que pode nunca vir.
   - O segundo é a auditoria do aceite (`usuarioAtivo` e `usuario.ativado_por_convite`). O destino ficou definido: a tarefa do dossiê (D61), com o `privacy-guardian`.

O que mais mudou nesta rodada também está certo:

- **`convite-de-professor.service.ts`.** O arquivo novo importa `convidar`, `refazerSobATrava`, `tokenNovo` e `expiraEmDo` de `convite.service.ts`, e não há importação no sentido contrário. Os três casos de uso do professor só são chamados por `professores.service.ts:11`. Não há corpo duplicado.
- **Testes novos em `professores.int.test.ts`.** São os dois refazer com a ordem forçada na trava e o `retrato` inteiro na borda do convite vencido. Não há `.skip`, `.only`, `any` nem `TODO`.
- **Documentos.** A tabela "Mutações" confere com as linhas do arquivo novo, e a recusa sobre o tamanho do nome na lista está justificada pelo check do banco. A linha 75 do `docs/lgpd.md`, o comentário do expurgo e o item novo do `TODO.md` estão coerentes com o que os guardiões pediram.

Recomendações:
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/professores/professores.service.ts:16`, a linha do docblock ficou longa depois de trocar o caminho do arquivo. Vale quebrá-la como as vizinhas.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/13_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/14_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite-de-professor.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/professores/professores.service.ts`

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-26 13:18:38 · `tasks/prd-apresentacao-escola/3_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma mudou nesta rodada. `convite` e `usuario` não foram tocados desde a 1ª rodada, e a `0018_convite_professor.sql` também não.

Queries verificadas: o código mudou de arquivo, mas a lógica é a mesma. Agora `cadastrarProfessor`, `refazerConviteDeProfessor`, `revogarConviteDeProfessor` e `professorSobATrava` ficam em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite-de-professor.service.ts`. As funções comuns `convidar`, `refazerSobATrava`, `tokenNovo` e `expiraEmDo` ficam em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`. Nenhuma das funções movidas recebe `escolaId` como argumento. A escola continua vindo do contexto da sessão, por `ConviteRepository` e `travarEscola`. `usuarioId` só chega pelo caminho da URL, e o filtro por escola e por tipo `professor` continua em `dadosDoProfessor`. O `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/professores/professores.service.ts` importa as funções do arquivo novo, e nenhum outro lugar as chama. A mudança em `expurgo-de-acesso.repository.ts` só troca um comentário, sem efeito na query.

Teste de isolamento: presente e efetivo. As duas rotas `POST /v1/professores/:usuarioId/convite/refazer|revogar` continuam na matriz entre escolas de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts`, nas linhas 148 e 157. O teste I7 e o I3 (lista) seguem em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/professores.int.test.ts`. Os dois testes novos (dois refazer com a ordem forçada na trava, na linha 507, e o retrato inteiro no caso do convite vencido, nas linhas 411 a 414) tratam de concorrência e de borda. Eles não mudam a cobertura de isolamento.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. Aceito a recusa da recomendação sobre o teste da escola na consulta de convites, pelo motivo dado: a FK composta impede montar o cenário. A recomendação da senha de conta global continua registrada como risco na seção 13.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-26 13:18:40 · `tasks/prd-apresentacao-escola/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (aceite do convite) e migration. A mudança desta rodada só mudou código de lugar.
Rate limit: ok. O diff desta rodada não toca rota nem limitador.
Fila e prioridade: ok (não se aplica, nada vai para fila)
Concorrência: protegida
Índice e paginação: ok. A lista pagina por `(escola_id, id)`, e o índice parcial ficou registrado no `TODO.md`, em "Infra e operação".
Degradação de IA: não se aplica
Migration: compatível. A `0018` não mudou desde a 1ª rodada.
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações: nenhuma nova.

**O que conferi nesta rodada**
- **Código movido para `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite-de-professor.service.ts`:** o corpo é o mesmo da 1ª rodada, e a trava da escola continua sendo a primeira instrução de cada transação.
  - Em `cadastrarProfessor`, `travarEscola()` vem antes de `convidar`.
  - Em `refazerConviteDeProfessor` e `revogarConviteDeProfessor`, `professorSobATrava` trava antes de ler os dados do professor.
  - Token e validade são gerados fora da transação e não seguram a trava. O único ponto que chama esse código é `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/professores/professores.service.ts`.
- **O que ficou em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`:**
  - `convidar` e `refazerSobATrava` são o corpo comum, sem trava própria. Quem chama trava antes: o operador faz isso por `coordenacaoSobATrava`, e o professor pelos caminhos acima.
  - O `update` condicional por tipo (`revogar`, `revogarParaRefazer`) continua fechando a corrida no banco.

**As recomendações da 1ª rodada**
- **Índice parcial da lista:** registrado no `TODO.md`, com o `EXPLAIN` exigido sobre o seed de uma escola grande.
- **Clique duplo no refazer:** passado para a tarefa 14.0 em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/14_task.md`. Os dois testes estão em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/professores.int.test.ts`: o paralelo na linha 490 e o de ordem forçada na trava na linha 507.
- **Importação em lote:** não existe na A1, então fica fora desta tarefa.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-26 13:18:58 · `tasks/prd-apresentacao-escola/3_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** os mesmos da 1ª rodada. São o nome e o e-mail do professor digitados pela coordenação (o e-mail fica na conta global e não aparece na lista) e o convite de professor, que guarda o hash do token, as datas e o tipo. Esta rodada não criou campo nenhum e não tocou dado de aluno.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. A linha 75 de `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md` agora diz "apagado pelo `sistema.expurgar-acesso`", como a linha do coordenador. O comentário de `RETENCAO_CONVITE_DIAS` em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:12-15` cita as duas linhas.

**Autorização por objeto:** ok.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite-de-professor.service.ts` repete o que aprovei na 1ª rodada:
  - `professorSobATrava` pega a trava e chama `dadosDoProfessor`, que filtra pela escola do contexto, pelo tipo e pelo papel. Qualquer id fora disso dá `NAO_ENCONTRADO`.
  - `revogar(conviteId, 'professor')` leva o tipo.
  - A escola e o autor vêm do contexto, nunca do corpo.
- O único chamador é `professores.service.ts:11`. Em `convite.service.ts` sobraram só os pedaços comuns: `convidar`, `refazerSobATrava`, `tokenNovo` e `expiraEmDo`. Não existe outra cópia dos casos de uso.

**Logs:** limpos. Não há logger no arquivo novo. O comentário da linha 45 repete a proibição de mandar token, nome ou e-mail a log.

**Auditoria:** presente e igual à da 1ª rodada.
- O cadastro grava `professor.cadastrado`, sem campo nenhum.
- `convite.criado` leva o tipo, o usuário e a validade, sem `contaNova`, que continua só no convite de coordenador.
- O refazer grava `convite.refeito` por `refazerSobATrava`, e o revogar grava `convite.revogado` com o tipo.

**Envio externo:** nenhum.

**Seed/fixture:** sintético.

**Conferência das minhas recomendações da 1ª rodada:**
1. **Tamanho real da janela do E11: feito.** Está em `techspec.md` §13, linhas 214-216, e em `3_task.md`, "Divergências", linhas 100-105. O texto diz que a janela "dura até essa entrada, que pode nunca vir", no lugar dos 30 minutos de antes.
2. **Auditoria do aceite, que mostra se a conta era nova ou já existia: feito.** Está registrada no risco da §13, linhas 217-219, e em "Divergências". O destino é a tarefa que exportar a auditoria no dossiê (D61), com o `privacy-guardian`.
3. **Comentário do expurgo e linha 75 do `docs/lgpd.md`: feito.**
4. **Nome longo: recusado com motivo, e o motivo se confirma.** O check `usuario_nome_preenchido` (`packages/nucleo/src/db/schema/usuario.ts:42`) limita o nome a 200 depois do `btrim`, que é o mesmo teto de `TAMANHO_MAXIMO_NOME_DIGITADO`. E, mesmo que a lista respondesse 500, a resposta seria genérica e não vazaria dado.

**Item novo no `TODO.md` (índice da lista de professores):** a paginação lê linhas de `usuario` de outros papéis só dentro do banco. O filtro por papel vem antes do DTO, então nada disso chega à resposta. Não é problema de exposição.

**Pergunta de fechamento:** esta rodada não cria dado de aluno nem envio externo. A resposta que o código dá à secretaria não muda.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. Continua valendo, para a tarefa do dossiê (D61), decidir se `convite.aceito.usuarioAtivo` e `usuario.ativado_por_convite` saem da exportação ou são agregados antes de alguma rota da coordenação ler a auditoria.

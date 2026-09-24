# Achados das revisões — `tasks/prd-apresentacao-painel/2_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-24 17:46:17 · `tasks/prd-apresentacao-painel/2_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **A4 (unidade):** os sete estados, a borda das 72 h, o usuário desativado antes e depois do aceite.
- **E6 (gerar e revogar):** cada estado dá o resultado da matriz, e o que é recusado não grava nada. Gerar em `aceito` e em `sem_coordenacao` grava `convite.revogado` do convite anterior. Gerar com o mesmo e-mail reusa o usuário. Revogar convite já revogado dá `NAO_ENCONTRADO`, e revogar convite que não é o último dá `CONFLITO`.
- **E7:** escola inexistente.
- **E8 (sem refazer):** a ordem forçada pela trava e, no fim, no máximo um convite em aberto.
- **E10:** o mesmo e-mail em duas escolas ao mesmo tempo, com a trava e o contexto por escola.
- **E11:** o autor desativado no gerar e no revogar, nas duas ordens.
- **E12:** corpo com campo a mais.
- **E13:** o comando com convite em aberto recusa, e o `ops:revogar-convite` passa pela mesma matriz.
- **I7:** escola `ativa`, e o alarme de tipo.
- **A2 e A3:** o token e o log.
- **Isolamento do repository:** `dadosDaCoordenacao`, `revogado`.
- **I3:** as duas rotas novas nas varreduras.
- **Subtarefa 2.2:** o índice `convite_pendente_unico`, com o 23505 dele virando `CONFLITO`.

**Cobertos:**
- **A4:** `packages/nucleo/src/convite/estado-da-coordenacao.test.ts`, completo. Tem 1 s antes, na hora e 1 s depois das 72 h, `revogado` vence `vencido` e usado, e o teste confere que o conjunto alcançado é igual a `ESTADOS_DA_COORDENACAO`.
- **E6:** `it.each` nos sete estados, para gerar e para revogar. O `retrato` compara convite, usuário, auditoria e conta, então prova que o recusado não grava. A auditoria do `convite.revogado` é conferida por inteiro, sem nome, e-mail nem token. O reuso de usuário é testado em `aceito` e `sem_coordenacao`. Os casos "anterior já revogado → 404" e "não é o último → 409" também estão, e o 409 falharia sem a checagem `conviteId !== ultimoConviteId`.
- **E7 e E12:** cobertos, inclusive `:id` fora do formato de UUID e revogar com corpo.
- **E8:** os quatro pares são concorrência de verdade. O teste segura `pg_advisory_lock` e confere as N chamadas em `wait_event = 'advisory'` com `objsubid = 2` antes de soltar. Sem a trava o teste fica vermelho, e as mutações relatadas batem.
- **E10:** B termina dentro do prazo com a trava de A segura, e cada convite fica na sua escola. Pega a chave global e o contexto trocado.
- **E11:** as duas ordens, com o gatilho no `insert` e no `update` de `convite`.
- **E13:** o CONFLITO com a mensagem exata e sem arquivo. O revogar pelo comando cobre `CONFLITO` e ok. O `OPERADOR` conferido na transação continua em `painel-escrita.int.test.ts`.
- **I7:** coberto, e o alarme 23514 confere a `constraint`.
- **A2 e A3:** o SHA-256, o token fora das linhas de `convite` e de `auditoria`, e sentinelas no log inteiro, incluindo as recusas.
- **Isolamento do repository:** `convite.repository.int.test.ts`. A escola D não vê o convite nem o coordenador ativo de C, e o desempate `expira_em` / `id` também é testado. Esse teste falharia sem a escola em cada uma das duas consultas.
- **I3 e contratos:** C36, C41, C46 e `painel.test.ts`.
- **Testes do F1 ajustados:** estão coerentes com a matriz e nenhum ficou mais fraco. O "coordenador desativado" até ganhou a asserção da recusa com convite em aberto.
- Nenhum `.skip`. Nenhum mock esconde a regra: é Postgres e Redis reais.

**Bloqueantes:**
1. **O índice `convite_pendente_unico` e o mapeamento dele para `CONFLITO` não têm teste.**
   - O código está em `packages/nucleo/drizzle/0015_convite_pendente_unico.sql` e em `apps/api/src/sessao/convite.repository.ts:62-66`.
   - A subtarefa 2.2 exige isso, e a seção "Divergências" do `2_task.md` diz que o índice é a rede de segurança que substitui o `revogarConvitesDoUsuario`.
   - Em todo teste que existe, a trava já barra antes do índice. Os ajustes do expurgo só evitam o índice, não o provam. Se a migration sumir, ou o `catch` do 23505 sumir, nenhum teste fica vermelho.
   - **Correção exigida:** um teste de integração em `apps/api/src/sessao/convite.repository.int.test.ts`, no contexto de uma escola:
     - `criarConvite` duas vezes para o mesmo usuário, direto no repository e sem a trava. A segunda rejeita com `ErroDeDominio` de código `CONFLITO`, não com o erro cru do Postgres, e fica uma linha só.
     - Com o convite anterior usado, ou revogado, o mesmo usuário recebe outro convite, o que prova o predicado parcial.
     - O mesmo usuário numa escola e outro usuário na mesma escola não se bloqueiam, o que prova a chave `(escola_id, usuario_id)`.

   A E9, pelo refazer, continua sendo da 3.0. Este teste é do que a 2.0 entrega.

**Recomendações:**
- **Resposta do perdedor na E8** (`painel-convite.int.test.ts:357` e `:368`). Hoje o teste confere só o status. Use `esperarErro` para conferir também o código: `CONFLITO` no "dois gerar com o mesmo e-mail", e `NAO_ENCONTRADO` quando o revogar perde para o gerar. A E8 pede "o perdedor recebe o erro da matriz".
- **Preparo de `sem_coordenacao`** (`painel-convite.int.test.ts:138`). Ele desativa por `update` direto no banco, mas o `2_task.md` diz "a coordenação desativada pela escola". Ajuste o texto ou use o caminho de verdade.
- **A divergência "`vencido` pela hora do banco" não tem teste que a distinga do relógio da API.** O valor é baixo, então fica só como registro para o `/validar`.
- **Prazo de 5 s da E10** (`PRAZO_DA_OUTRA_ESCOLA_MS`): fique de olho na esteira. Se virar teste instável, meça a espera em `pg_stat_activity` em vez do relógio.

## test-engineer · 2ª rodada · APROVADO · 2026-09-24 17:48:07 · `tasks/prd-apresentacao-painel/2_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (rodada 2, só a correção exigida e o diff desde a 1ª rodada): o índice `convite_pendente_unico` tem de virar `CONFLITO` tipado quando se chama `criarConvite` direto no repository, sem a trava. Três casos: o segundo convite em aberto do mesmo usuário é recusado e só uma linha fica; com o anterior usado ou revogado, o mesmo usuário recebe outro convite (o índice só vale para convite em aberto); outro usuário da mesma escola não é bloqueado, porque a chave é `(escola_id, usuario_id)`.

**Cobertos:**
- A correção 1 foi feita, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts:152-188`, e cobre todos os casos exigidos:
  - O segundo `criarConvite` do mesmo usuário é recusado com `ErroDeDominio` de código `CONFLITO`, e só o primeiro convite existe (linhas 171-174).
  - Outro usuário da mesma escola recebe o seu convite (linhas 177-180).
  - Com o primeiro usado, o mesmo usuário recebe o segundo; com o segundo revogado, recebe o terceiro; no fim os três existem (linhas 183-187).
- O teste falharia em cada mutação que importa:
  - **Sem o índice:** o segundo insert passa e o `toBeInstanceOf(ErroDeDominio)` quebra.
  - **Sem a conversão para `CONFLITO` no `catch`** (`convite.repository.ts:64`): o erro cru do Postgres escapa e o teste quebra. A mutação foi declarada e bate com o código.
  - **Índice sem o filtro de convite em aberto, ou com só uma das duas condições** (`usado_em is null` ou `revogado_em is null`): o `segundo` ou o `terceiro` quebra.
  - **Chave só por `escola_id`:** o convite do outro usuário quebra.
- As recomendações da 1ª rodada na E8 (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts:341-385`) foram atendidas. `esperarErro` confere o status e o corpo tipado inteiro (código, mensagem e `requisicaoId`) em quem perde:
  - `CONFLITO` nos dois "dois gerar", com e-mails diferentes e com o mesmo e-mail.
  - No "gerar e revogar em aceito", `NAO_ENCONTRADO` ou corpo vazio no 204.
  - `NAO_ENCONTRADO` no "dois revogar".
- A concorrência continua sendo de verdade: as duas chamadas saem juntas pelo `naFilaDaTrava`, não uma depois da outra.
- Não há `.skip`, `.only`, `it.todo` nem teste comentado nos dois arquivos.
- A seção "Onde cada cenário está" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/2_task.md` (linhas 79 e 88-89) passa a citar o teste do índice.

**Bloqueantes:** nenhum.

**Recomendações:**
- `convite.repository.int.test.ts:171-173`: o comentário diz que o erro cru do Postgres traria o valor da linha no `detail`. Dá para fixar isso com uma asserção de que o `ErroDeDominio` não carrega `detail` nem `cause` vindos do Postgres. Hoje isso está garantido pelo `toBeInstanceOf`, mas só de forma indireta.
- Falta um caso curto que prove que outro erro do Postgres (outra constraint ou outro código) sai inalterado e não vira `CONFLITO` (`convite.repository.ts:65`). É cobertura extra; não bloqueia.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-24 18:18:12 · `tasks/prd-apresentacao-painel/2_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nome e e-mail da coordenadora convidada, que agora chegam também pelo corpo de `POST /v1/operacao/escolas/:id/convite-coordenacao`. Nenhuma coluna nova. A migration 0015 só cria um índice. O convite continua guardando apenas o `token_hash` e as datas. O token só existe na resposta do gerar, que sai com `no-store`, e o contrato de resposta é estrito, com `conviteId` e `token` e nada da pessoa.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. As linhas "Nome, e-mail" (coordenador), "E-mail de login na conta global" e "Convite de coordenador" já cobrem o que foi tocado. Nenhum dado de aluno foi tocado.

**Autorização por objeto:** ok.
- As duas rotas são `@RotaDeOperacao`, e as varreduras C36, C41 e C46 passaram a incluí-las. Um token de escola não as alcança.
- A escola do revogar vem do convite (`escolaDoConviteParaOperador`), agora só para `tipo = 'coordenador'`. Um convite de outro tipo responde como o inexistente.
- Um `:id` fora do formato de UUID responde `NAO_ENCONTRADO`.
- `dadosDaCoordenacao` e `revogado` ficam presos à escola do contexto, e o teste em `apps/api/src/sessao/convite.repository.int.test.ts` quebraria sem esse escopo.
- A distinção entre `NAO_ENCONTRADO` e `CONFLITO` só aparece para o operador, que é global por desenho (D76). Nenhum papel de escola chega a ela.

**Logs:** limpos. `operacao.convite.gerado` e `operacao.convite.revogado` levam só os ids do contexto (`apps/api/src/operacao/painel.service.ts:143` e `:151`). Um teste captura todo o log da API durante gerar, recusa, revogar e revogar repetido, e confere que não aparecem o nome, o e-mail, o slug, o token nem o nome do operador (`apps/api/test/painel-convite.int.test.ts:562-578`). A mensagem de `CONFLITO` do `ops:convite-coordenador` é um texto fixo, sem nada do pedido.

**Auditoria:** presente.
- `convite.criado` e `convite.revogado` saem com `autorOperador` conferido na transação.
- Quando o gerar revoga o convite anterior (estados `aceito` e `sem_coordenacao`), isso é auditado. O F1 fazia essa revogação em silêncio (`revogarConvitesDoUsuario`), e ela foi removida.
- O teste A2 confere que o token não aparece em nenhuma linha de convite nem de auditoria, e que o `token_hash` é o SHA-256 dele.

**Convite:** tem expiração de 72 h, uso único e revogação. Com a trava por escola e o índice `convite_pendente_unico`, passa a haver no máximo um convite em aberto por escola. O 23505 do índice sai tipado como `CONFLITO` e não como o erro cru do Postgres, que traria o valor da linha no `detail`.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os nomes são "Pessoa sintética" e "Coordenação Sintética", e os e-mails são `@escola.invalid`. Os 64 convites revogados à mão estavam só no banco de teste local, semeado pelo expurgo.

**Pergunta de fechamento:** para o que esta tarefa toca (convite e conta da coordenação), o código responde. O dado está em `usuario`, `conta` e `convite`, e todo gerar e revogar fica na auditoria da escola com o operador. Não há envio externo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Na linha "Convite de coordenador" de `docs/lgpd.md:72`, a finalidade diz "primeiro acesso (F1)". Vale acrescentar que o convite agora nasce também pelo painel da operação (A0b), para o mapa de dados mostrar as duas origens.
2. Quando se gera de novo com outro e-mail nos estados `aceito` ou `sem_coordenacao`, o `usuario` anterior fica inativo na escola, com o nome, e nunca é ativado. O e-mail da conta dele sai pela limpeza do `sistema.expurgar-acesso` depois que o convite é revogado. O nome segue a retenção geral "vigência + 5 anos". Isso já acontecia antes desta tarefa, mas vale levar ao `/retro`: um coordenador convidado que nunca entrou precisa mesmo guardar o nome por esse prazo?
3. Um teste de contrato poderia garantir que o `detail` do 23505 nunca chega ao corpo da resposta HTTP. É o que o `test-engineer` sugeriu na 2ª rodada, em `apps/api/src/sessao/convite.repository.int.test.ts:171-173`. Hoje isso está garantido pelo `ErroDeDominio`, mas não há uma asserção sobre o corpo.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-24 18:18:16 · `tasks/prd-apresentacao-painel/2_task.md`

VEREDITO: APROVADO
Caminho quente tocado: migration (a rota é do painel da operação e não passa por login, tutor, sala, prova, fila nem IA)
Rate limit: ok. As duas rotas novas usam `@RotaDeOperacao`, com limite `rl:op:{sub}` por operador. O limite não é por IP.
Fila e prioridade: ok. Não se aplica: a tarefa não cria job. A transação é curta, sem trabalho demorado dentro do request.
Concorrência: protegida. Três camadas seguram a corrida:
- Uma trava por escola (`pg_advisory_xact_lock(7_000_003, hashtext(escola))`) é pega antes de ler o estado, no painel e nos dois `ops:*`.
- O índice único parcial `convite_pendente_unico` é a rede de segurança, e o erro 23505 dele sai como `CONFLITO`.
- A revogação só grava se o convite ainda não foi revogado.
A espera na trava tem prazo, pelo `statement_timeout` do pool. A trava é por escola: duas escolas não esperam uma pela outra, e a E10 prova isso. A E8 força a ordem com `wait_event = 'advisory'` e ficaria vermelha sem a trava. O expurgo apaga convite sem pegar a trava. Isso é seguro: ele não apaga convite em aberto, e se apagar o último convite no meio de um gerar, o `revogar` devolve falso e a resposta é `CONFLITO`, sem nada gravado.
Índice e paginação: ok. `convite` tem poucas linhas por escola e não cresce com aluno, e as consultas começam por `escola_id`. As rotas novas não listam nada.
Degradação de IA: não se aplica
Migration: compatível. A 0015 só cria um índice, numa tabela pequena, e o `migrar` aplica com `lock_timeout` e tenta de novo. O código anterior sempre revogava os convites do usuário antes de criar outro, então continua funcionando com o índice novo, e o rollback do código não esbarra nele.
Métrica e alerta: ok. A tarefa não toca o caminho quente e não cria alerta. Os logs `operacao.convite.gerado` e `.revogado` levam só ids.
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0015_convite_pendente_unico.sql:5`: o índice falha em banco que já tem dois convites em aberto do mesmo usuário, como aconteceu no banco de teste local (64 linhas revogadas à mão). Antes de o staging existir, vale pôr no `docs/runbook.md` a consulta que confere esse caso e a revogação que o corrige antes do deploy. Assim a correção não fica só na nota da tarefa.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts:88`: a verificação de coordenador ativo percorre os usuários da escola pelo índice `(escola_id, …)`, e com os alunos isso chega a centenas por escola. No gerar e no revogar isso é barato. Na lista da 5.0, que calcula o estado de todas as escolas, conferir o `EXPLAIN` e, se preciso, criar um índice parcial `(escola_id) where papel = 'coordenador' and desativado_em is null`.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-24 18:18:16 · `tasks/prd-apresentacao-painel/2_task.md`

VEREDITO: APROVADO

Tabelas verificadas:
- `convite`. Tem `escolaId` e não precisa de `anoLetivoId`, porque o convite da coordenação não varia por período. O id é UUID.
- O índice novo `convite_pendente_unico (escola_id, usuario_id)`, em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0015_convite_pendente_unico.sql`, começa pelo escopo.

Queries verificadas:
- `ConviteRepository.travarEscola`: a chave vem da escola do contexto.
- `ConviteRepository.dadosDaCoordenacao`: `escola.id`, `usuario.escola_id` e `convite.escola_id` saem todos do contexto. O join com `usuario` exige a mesma escola. O filtro `tipo = 'coordenador'` está presente.
- `ConviteRepository.revogado`: escola do contexto e `tipo`.
- `ConviteRepository.criarConvite`: o 23505 do índice vira `CONFLITO` tipado.
- `ConviteRepository.revogar` e `usuarioConvidado`: sem mudança, continuam no contexto.
- `ResolucaoDeTenantRepository.escolaDoConviteParaOperador`: continua `@SemEscopo`, com a justificativa atualizada e o filtro de tipo. A escola que ele acha vira o contexto, nunca vem do argumento.
- `contaParaConvite`: só a justificativa mudou.
- Nenhum `@SemEscopo` novo.
- Rotas:
  - `POST /v1/operacao/escolas/:id/convite-coordenacao` recebe a escola pelo caminho. Isso vale só para `@RotaDeOperacao`, com o autor conferido antes de ler a escola, e está previsto na Tech Spec, seção 6.
  - O corpo é estrito. `escolaId` no corpo dá 400, provado na E12.
  - `POST /v1/operacao/convites/:id/revogar` tira a escola do convite.
  - Nas duas rotas, id que não é UUID responde `NAO_ENCONTRADO`.
  - As duas entraram nas varreduras C36, C41 e C46. Rota de escola não chega nelas.
- `criarConviteDeCoordenador` e `revogarConvitePeloOperador` só são chamados pelo `painel.service` e pelos dois `ops:*`, e sempre com `ConferenciaDoAutor` de operador.

Teste de isolamento: presente e efetivo.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts`, removi mentalmente as cláusulas de escola:
  - sem o `convite.escola_id` em `dadosDaCoordenacao`, a escola D veria o convite de C e o `ultimoConvite: undefined` quebra;
  - sem o `usuario.escola_id` no `exists`, o `coordenadorAtivo: false` de D quebra;
  - sem o `escola.id`, a escola inexistente deixa de dar `undefined`;
  - sem a escola em `revogado`, `revogado(maior)` em D deixa de dar `undefined`.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts`, a E10 cobre duas coisas:
  - trava global, ou sem a escola na chave, faz B esperar A e estourar o prazo;
  - convite gravado na escola errada quebra a asserção de `escola_id`.
- O teste de "outro tipo responde `NAO_ENCONTRADO`" ainda não dá para escrever, porque o check `convite_tipo_valido` impede semear outro tipo. Por enquanto fica o alarme do 23514, como a spec combinou.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md:122` diz que "só `painel.service.ts` abre o contexto pelo `:id`". Na verdade, quem abre é `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts:196-198`, pelo ramo `pedido.escolaId`. Ajustar o texto da spec, ou pôr um teste de arquitetura que limite os importadores de `criarConviteDeCoordenador` ao `painel.service.ts` e aos `ops/*`. Hoje isso vale só por convenção.
- `ResolucaoDeTenantRepository` já concentra muitos `@SemEscopo`, embora a regra 10, item 9, peça no máximo dois por módulo. Esta tarefa não acrescentou nenhum. Vale registrar no `/retro` para rever o desenho quando a A1 abrir o convite de professor.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-24 18:19:35 · `tasks/prd-apresentacao-painel/2_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em seção 5, "nome e e-mail se corrigem revogando e gerando". Com o mesmo e-mail, o nome não se corrige.
Portão local: carimbo válido (typecheck, lint, test, infra)

**Bloqueantes:**

1. **O nome digitado no gerar é descartado quando o usuário é reaproveitado.** Isso quebra a promessa da seção 5 da Tech Spec.
   - **Onde:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts:42-46`.
   - **O que o código faz:** `usuarioConvidado` faz `onConflictDoUpdate` com `set: { desativadoEm: sql\`now()\` }` e só isso.
   - **O que a Tech Spec diz:** a seção 5 (`techspec.md:78-79`) afirma que o refazer é "para o mesmo usuário (nome e e-mail se corrigem revogando e gerando)". Os dois caminhos da correção são esta tarefa.
   - **Onde quebra:** o operador revoga e gera de novo com o mesmo e-mail e o nome corrigido, nos estados `revogado`, `aceito` ou `sem_coordenacao`. O `(escola, conta, papel)` bate, o usuário é reaproveitado e fica com o nome antigo.
   - **Consequência:** o painel aceita o nome, responde 201 e ignora o que foi digitado, sem aviso. O único caminho que a spec oferece para corrigir um nome errado não funciona.
   - **Teste:** nenhum cobre isso. O "gerar em %s com o mesmo e-mail reaproveita o usuário" (`painel-convite.int.test.ts:237`) reusa o mesmo `escola.quem`, com o mesmo nome.
   - **Correção exigida:**
     - No conflito, gravar também o nome: `set: { desativadoEm: sql\`now()\`, nome }`, mantendo o `setWhere` em `desativado_em is not null`, para nunca renomear coordenador ativo.
     - Atualizar o docblock do método.
     - Acrescentar em `painel-convite.int.test.ts` o caso "revogar e gerar com o mesmo e-mail e outro nome". Ele confere que `usuario.nome` passa a ser o novo e que o `usuario.id` é o mesmo, em pelo menos `revogado` e `aceito`.
     - Se a decisão for não corrigir o nome, o caminho é outro: registrar como divergência e tirar a promessa da Tech Spec. Isso é decisão do dono, não de quem implementa.

**Recomendações:**
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/convite/estado-da-coordenacao.ts:31`: o parêntese "também o convite já usado que um gerar revogou só como registro" descreve um convite que nunca é o último. O gerar cria outro, com `expira_em` maior, na mesma transação. Tire o parêntese, ou diga quando isso acontece.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/convite.ts:22`: o docblock ainda diz que o índice `(escola_id, usuario_id)` "serve à revogação dos convites anteriores de um usuário". O `revogarConvitesDoUsuario` saiu nesta tarefa, então o texto ficou desatualizado. Hoje o índice serve à ativação.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts:243`: a linha junta três respostas numa condição só (estado `revogado`, convite inexistente, convite já revogado), e o `!== false` de um `boolean | undefined` é difícil de ler. Separar deixa a matriz legível.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0015_convite_pendente_unico.sql:3-4`: o comentário afirma que "nenhum dado dele viola a regra". A própria tarefa registra 64 violações no banco de teste local, vindas de seed. Vale uma linha dizendo que a garantia é só sobre o dado gravado pelo código do F1.

## test-engineer · 3ª rodada · APROVADO · 2026-09-24 18:21:53 · `tasks/prd-apresentacao-painel/2_task.md`

VEREDITO: APROVADO

**Cenários exigidos (nesta rodada)**
- A correção pedida pelo revisor-geral: revogar e gerar com o mesmo e-mail e outro nome grava o nome novo no mesmo usuário, pelo menos nos estados `revogado` e `aceito`.
- A proteção continua valendo: coordenador ativo não é renomeado.
- As recomendações aplicadas no revogar não mudaram o comportamento.

**Cobertos**
- **Correção feita.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts:46`, o conflito agora grava `set: { desativadoEm: sql\`now()\`, nome }` e mantém `setWhere: isNotNull(usuario.desativadoEm)`. O docblock (linhas 33-39) diz o que o código faz: o nome é regravado ao voltar a esperar e não muda com o coordenador ativo.
- **Teste pelo painel.** Está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts:257-268`, com `it.each(['revogado', 'aceito', 'sem_coordenacao'])`. Cada estado é montado pelos caminhos de verdade: gerar, revogar e aceitar via HTTP. Depois do gerar com o nome `<anterior> Corrigido`, o teste confere num só `toEqual` que o convite novo aponta para o mesmo `usuario.id` do anterior e que o nome é o novo. Sem o `nome` no `set`, o nome continuaria o anterior e o teste falharia. Se o usuário fosse recriado, o id mudaria e o teste também falharia. Os três estados que a correção exigia estão cobertos, com `sem_coordenacao` a mais.
- **Proteção do ativo.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts:105-108`, com o coordenador ativo e outro nome, a chamada devolve `undefined` e o nome no banco continua `'Pessoa sintética'`. Sem o `setWhere`, a chamada devolveria o id e o nome mudaria, e o teste falharia. Nas linhas 109-113, com o coordenador inativo, a chamada devolve o mesmo id, `desativado_em` fica recente e o nome passa a ser `'Pessoa sintética Corrigida'`.
- **Isolamento.** O alvo do conflito inclui `escola_id`, então o nome só pode mudar no usuário da escola do contexto. O teste de isolamento do repositório (linha 63) passou a usar `revogado(conviteId)` no lugar do método removido e continua conferindo que a escola B não alcança o convite de A.
- **Revogar (recomendações aplicadas).** Em `convite.service.ts`, as condições foram separadas na mesma ordem de antes: `nao_encontrado`, já revogado ou inexistente, `conflito`, e convite que não é o último. A matriz E6 do revogar (`painel-convite.int.test.ts:270`) cobre cada saída.
- Não há `.skip`, `.only` ou teste comentado nos arquivos de convite. O `docs/lgpd.md` só ganhou texto: a linha do convite agora cita o painel, sem campo novo.

**Bloqueantes**
- Nenhum.

**Recomendações**
- A função `retrato` (`painel-convite.int.test.ts:109`) não lê `usuario.nome`. Nos estados que dão 409, "nada muda" não inclui o nome. Hoje o `ativa` volta 409 antes de chegar ao `usuarioConvidado`, e o repositório já cobre o caso. Mesmo assim, pôr `nome` no `select` de `usuarios` fecha o caso também pelo painel, sem custo.
- Não há teste pelo painel de gerar no estado `ativa` com o mesmo e-mail e outro nome. O teste que existe no `ativa` usa outra pessoa. Com o `nome` no `retrato`, uma linha a mais cobre esse caso.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-24 18:50:57 · `tasks/prd-apresentacao-painel/2_task.md`

VEREDITO: APROVADO
Caminho quente tocado: migration (a 0015 só mudou de comentário nesta rodada)
Rate limit: ok. Não mudou desde a 1ª rodada: `@RotaDeOperacao`, com o limite `rl:op:{sub}` por operador.
Fila e prioridade: ok. Não se aplica: a correção não cria job e só troca o conteúdo de uma instrução que já existia.
Concorrência: protegida.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts:46`, o `nome` agora entra no mesmo `insert … on conflict do update`. Continua sendo uma instrução só, com a trava da linha, dentro da transação que já tem `pg_advisory_xact_lock(7_000_003, hashtext(escola))`.
- O `setWhere: desativado_em is not null` continua impedindo que a correção mexa em coordenador ativo.
- Não sobrou nenhum "busca, verifica, grava" novo.
- No `revogar`, em `convite.service.ts`, a ordem das verificações é a mesma, sob a trava, e a última gravação continua conferida pelo retorno de `revogar()`.
Índice e paginação: ok. A correção não cria consulta nova, e o upsert usa a chave única `(escola_id, conta_id, papel)`.
Degradação de IA: não se aplica
Migration: compatível. Na 0015 mudou só o comentário, e o índice é o mesmo auditado na 1ª rodada.
Métrica e alerta: ok. Nada no caminho quente e nenhum alerta novo.
Bloqueantes: nenhum
Recomendações:
- A recomendação da 1ª rodada continua valendo. `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0015_convite_pendente_unico.sql` agora diz que a migration "falha alto" quando um seed escrito direto no banco viola o índice, mas o `docs/runbook.md` ainda não tem a consulta que acha esse caso nem a revogação que o corrige antes do deploy. Levar para antes de o staging existir.
- A recomendação da 1ª rodada sobre o `EXPLAIN` da verificação de coordenador ativo (`convite.repository.ts`, `dadosDaCoordenacao`) continua valendo para a lista da 5.0.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-24 18:51:05 · `tasks/prd-apresentacao-painel/2_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, infra)

Bloqueantes: nenhum.

**Correção exigida na 1ª rodada: feita**
- **Código.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts:44-48`, o conflito agora grava também o nome: `set: { desativadoEm: sql\`now()\`, nome }`. O `setWhere: isNotNull(usuario.desativadoEm)` continua, então coordenador ativo não é renomeado.
- **Docblock.** As linhas 33-39 descrevem o comportamento real e citam a seção 5 da Tech Spec.
- **Teste pelo painel.** Está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts`, no `describe` "E6: o nome se corrige…". Cobre `revogado`, `aceito` e `sem_coordenacao`, e confere o mesmo `usuario.id` e o nome novo.
- **Teste no repository.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts` prova dois lados: o coordenador ativo chamado com outro nome não muda, e o inativo volta a esperar com o nome novo.

**Recomendações da 1ª rodada: aplicadas**
- O parêntese saiu de `estado-da-coordenacao.ts`.
- O docblock do índice em `db/schema/convite.ts` está atualizado.
- As condições do revogar em `convite.service.ts` foram separadas, na mesma ordem e com as mesmas respostas, e a matriz E6 do revogar cobre cada saída.
- O comentário da migration 0015 agora se restringe ao dado gravado pelo código.

As edições em `techspec.md` (seções 5 e 6) e em `docs/lgpd.md` só registram o que o código já faz. Não abrem divergência nova.

Recomendações:
- **O nome corrigido não deixa rastro.** Quando o gerar corrige o nome do usuário reaproveitado, nada registra que o nome mudou. O `convite.criado` guarda só o `usuarioId`, e está certo não pôr o nome na auditoria. Mesmo assim, vale um campo booleano `nomeAlterado` no `depois` do `convite.criado`, ou pelo menos levar a questão ao `/retro`. A regra 20, item 10, não exige, mas a pergunta "quem mudou o nome desta coordenadora" hoje fica sem resposta.
- **Duas sugestões do `test-engineer` (3ª rodada) seguem abertas.**
  - Incluir `usuario.nome` no `retrato` de `painel-convite.int.test.ts:109`.
  - Testar pelo painel o estado `ativa` com o mesmo e-mail e outro nome, conferindo que o nome não muda.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-24 18:51:11 · `tasks/prd-apresentacao-painel/2_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nesta rodada nenhuma tabela nova e nenhuma coluna nova. `usuario` agora também recebe o `nome` no upsert, mas continua com `escolaId`. O `convite` e o índice `convite_pendente_unico` (migration 0015) só mudaram em comentário, e já tinham sido aprovados na 1ª rodada.

Queries verificadas:
- **`ConviteRepository.usuarioConvidado`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts:40-51`). A escola vem do contexto (`escolaDoContexto()`) no insert. O alvo do conflito é `(escola_id, conta_id, papel)`, então o `nome` só pode ser gravado numa linha dessa mesma escola. O `setWhere` (`desativado_em is not null`) protege o coordenador ativo. Tirar a escola do alvo não abre brecha: o upsert passaria a apontar para um índice único que não existe e falharia ao rodar.
- **`revogarConvitePeloOperador`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts:232-256`). A condição do `NAO_ENCONTRADO` e a do `CONFLITO` só foram separadas em linhas, com a mesma ordem e as mesmas respostas. A escola continua vindo do convite, e todo o resto roda no contexto dela. Convite de outro tipo, inexistente ou já revogado responde igual (`NAO_ENCONTRADO`).
- **Tech Spec, seção 6** (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md:122`). A recomendação da rodada anterior foi aplicada: só `painel.service.ts` recebe a escola pelo `:id`, e o contexto dela só abre depois de o autor ser conferido. Isso confere com `criarConviteDeCoordenador` (linhas 195-198).

Teste de isolamento: presente e efetivo.
- **Repository.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts:58` e o de estado da coordenação (A0b, 2.3) continuam valendo. O teste novo nas linhas 98-114 prova que o coordenador ativo não muda de nome e que o inativo recebe o nome novo. Sem o `setWhere`, ele quebra.
- **Ponta a ponta.** O teste E10 em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts:401` gera convite em duas escolas com o mesmo e-mail e confere que cada convite fica na sua escola e que a resposta de uma não traz nada da outra. O teste E6 da linha 257 cobre a correção do nome nos estados `revogado`, `aceito` e `sem_coordenacao`.

Bloqueantes: nenhum.

Recomendações:
- **Nome em duas escolas.** No E10 (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts:401`), gerar na escola B com um nome diferente do usado na A, e verificar que o usuário da A mantém o nome e que o convite da B aponta para um usuário com `escola_id` da B. Hoje as duas escolas usam o mesmo nome. Por isso o teste não mostra que o `nome` novo do upsert fica preso à escola, embora a estrutura já garanta isso.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-24 18:51:14 · `tasks/prd-apresentacao-painel/2_task.md`

VEREDITO: APROVADO

Esta rodada conferiu só o que mudou desde a 1ª aprovação e o que essa mudança afeta.

**Campos pessoais tocados:** só o `usuario.nome` da coordenadora. Agora ele também é gravado quando um usuário inativo é reaproveitado, no conflito `(escola_id, conta_id, papel)` de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts`. Nenhum campo novo e nenhum campo de aluno.

**Fora da tabela de dados do docs/lgpd.md:** nada. O nome da coordenadora já estava no mapa. A linha "Convite de coordenador" (`/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:72`) agora diz que o convite nasce pelo comando ou pelo painel da operação (A0b). Minha recomendação 1 da rodada anterior foi aplicada.

**Autorização por objeto:** ok.
- A atualização do nome é presa ao alvo do conflito, que inclui `escola_id`. Não alcança usuário de outra escola.
- O filtro `setWhere: isNotNull(usuario.desativadoEm)` impede renomear coordenador ativo. O teste de `convite.repository.int.test.ts` prova isso: o nome continua "Pessoa sintética".
- O reaproveitamento só acontece com a mesma conta, ou seja, o mesmo e-mail. É a mesma pessoa, e o caminho de correção é o que a Tech Spec dá na seção 5.
- No `revogar`, as condições foram separadas e as respostas continuam as mesmas: `NAO_ENCONTRADO` para convite inexistente, de outro tipo ou já revogado; `CONFLITO` só depois disso. Não revela nada que o operador já não possa ver.

**Logs:** limpos. Os únicos logs são os quatro eventos sem dado de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.service.ts:64,71,79,87`. O nome não aparece em log nem na auditoria: `convite.criado` guarda só `usuarioId`, `expiraEm` e `contaNova`.

**Auditoria:** presente. `convite.revogado` e `convite.criado` registram o apelido do operador. O rastro da correção de nome é o par revogar e gerar para o mesmo `usuario_id`. Alterar nome de coordenadora não está na lista de auditoria obrigatória da regra 20, item 10.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Nomes como `Coordenação Sintética <uuid>`, "Pessoa sintética Corrigida", e e-mails em `@escola.invalid`.

**Pergunta de fechamento:** a mudança não altera a resposta. O nome continua num lugar só (`usuario`) e sai junto na eliminação. O convite continua sem nome e sem e-mail.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Na correção de nome, `convite.criado` poderia levar um marcador sem dado pessoal, como `{ usuarioReaproveitado: true }` ou `{ nomeAlterado: true }`. Assim o registro mostra que houve uma retificação a pedido (art. 18, III, da LGPD) sem gravar o nome antigo nem o novo. Hoje isso só se deduz cruzando `usuario_id` entre convites. Isso vai para o `/validar` e o `/retro`.
2. O comentário de `usuarioConvidado` cobre o caso do "coordenador desativado que a escola chama de volta". Nesse caso o nome antigo também é substituído pelo digitado agora. Está correto por ser a mesma conta, mas vale uma linha em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`, na seção 5, dizendo que a correção vale também nesse caso.

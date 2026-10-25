# Achados das revisões — `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-25 00:53:38 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `usuario`, que ganha a coluna nova `introducao_vista_em`, nula, sem padrão e só expandindo (migration `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/packages/nucleo/drizzle/0039_introducao_vista.sql`). A tarefa não cria tabela. `usuario` já tem `escolaId` e id UUID. A data da introdução é da pessoa e não varia por período, então `anoLetivoId` não se aplica, e o teste da virada do ano confirma que a data sobrevive.

Queries verificadas:
- `EuRepository.marcarIntroducaoVista` (`apps/api/src/sessao/eu/eu.repository.ts:487-495`): `escola_id` e `id` vêm de `identidadeDaRequisicao()`. Não recebe data nem id do cliente, e usa `coalesce(..., now())`.
- `EuRepository.doContexto`: só ganhou a coluna no select, e o escopo continua o de antes.
- `ResolucaoDeTenantRepository.introducaoMaisAntigaDaConta` (`apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts:632-639`): tem `@SemEscopo` com justificativa escrita, que o teste das justificativas cobra pelo texto. A conta vem da linha da sessão, nunca do cliente. O papel, o desativado e a eliminação agendada são filtrados na própria query, e ela devolve só o `min`, sem nome nem id de outra escola.
- `LEITURAS_DO_ARQUIVO.usuario` (`packages/nucleo/src/titular/leitura-do-titular.ts:95`): mantém `escola_id` e `id` do titular. Na versão `coordenacao`, a data do professor sai nula (D64).
- `POST /v1/eu/introducao`: o corpo é vazio e estrito, então `escolaId`, `usuarioId` e `introducaoVistaEm` mandados no corpo são recusados com `ENTRADA_INVALIDA`, e o teste confere que nada foi gravado. Na matriz, a rede tem `nunca` e os três papéis têm `proprio`. Linha não achada responde `NAO_AUTENTICADO`, igual ao caso sem sessão, então a resposta não confirma que o registro existe.

Teste de isolamento: presente e efetivo.
- `apps/api/src/sessao/eu/eu.repository.int.test.ts:425`: com o contexto de B e o usuário de A, a gravação devolve `undefined` e a linha de A continua nula. Sem `eq(usuario.escolaId, ...)` a linha de A seria gravada e o teste quebraria.
- `apps/api/test/introducao.int.test.ts:119` e `:196`: dois da mesma escola. Sem `eq(usuario.id, ...)` a linha do colega seria gravada e o teste quebraria.
- `apps/api/test/introducao.int.test.ts:168`: grava o valor emprestado no lugar de `now()`. Fica vermelho na linha 177.
- `apps/api/test/introducao.int.test.ts:288` e `:304`: tirar o filtro de papel, o de conta, o de desativado ou o de eliminação agendada deixa cada caso vermelho.

Bloqueantes: nenhum.

Recomendações:
- A tabela de testes da tarefa (`tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md:76`) pede um teste de integração em que a sessão de rede é recusada no POST. Ele não está em `apps/api/test/introducao.int.test.ts`, e hoje a recusa é provada só pela célula da matriz (`packages/shared/src/permissao/matriz.test.ts`). Vale acrescentar o caso HTTP.
- A subtarefa 1.2 pede um teste de que a etapa `escolher` do login não leva a data, e ele não existe. `acessosDaConta` não mudou e o esquema do acesso é estrito, então o risco é baixo. Mesmo assim o teste deve ser escrito ou a dispensa registrada na tarefa.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 00:53:57 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa não toca `Nota`, `Correcao`, entrega nem agente. Ela cria só a coluna `usuario.introducao_vista_em`, que é uma data e não uma nota. Todos com autor humano? Não se aplica, porque nenhum caminho novo escreve em `Nota`.

Decisão autônoma sobre aluno: ausente. A data só decide se a introdução volta a aparecer. Não decide aprovação, reprovação nem encaminhamento.

Aprovação registrada: ok. Nenhuma saída de IA nova. A exceção do tutor (D47) não aparece neste diff.

Supervisão do tutor: ok. O tutor não é tocado.

Autonomia declarada e visível: sim, sem mudança. Nenhum agente novo e nenhum nível alterado.

**Itens 7 e 9 (supervisão não é vigilância; recusar a ferramenta não gera indicador).** São os únicos pontos da regra 70 que este diff toca, porque a data da introdução do professor poderia virar um sinal de adoção do tipo "quem ainda não abriu".
- Ela não chega à coordenação nem à rede:
  - Fora a vitrine e as fixtures sintéticas, a coluna só é lida em três lugares: o `GET /v1/eu` da própria pessoa (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/src/sessao/eu/eu.repository.ts`), a busca da data mais antiga da mesma conta e do mesmo papel (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts:627`, que devolve só a data, nunca a pessoa) e o arquivo do titular.
  - A versão `coordenacao` do arquivo do titular corta a data do professor (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/packages/nucleo/src/titular/leitura-do-titular.ts:725`). Um teste prova o corte: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/arquivo-do-titular.int.test.ts:567`, com a mutação registrada na tarefa.
  - Na matriz, `concluir_introducao` é `proprio` nos três papéis e `nunca` na rede (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/packages/shared/src/permissao/matriz.ts:816`), e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/packages/shared/src/permissao/matriz.test.ts:788` prova isso.
- O contador `eu.introducao_falha` não tem rótulo: nem escola, nem pessoa.
- A data não leva comportamento, inferência nem tempo de uso. A finalidade registrada em `docs/lgpd.md` é não repetir a introdução, sem uso para decisão sobre a pessoa.

Bloqueantes: nenhum.

Recomendações:
- A tabela de testes da tarefa promete "rede: a sessão de rede é recusada no POST" como teste de integração. Não achei esse caso em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/introducao.int.test.ts`; hoje só a matriz prova a recusa. É mais assunto do `test-engineer` do que da regra 70.
- Vale escrever em `docs/lgpd.md`, na linha nova do mapa, que a data nunca vira indicador de adoção, e citar a regra 70 item 9 junto da D64. Isso deixa o veto escrito para quando alguém pedir "quem ainda não viu a introdução" na governança.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 00:54:02 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum

Por que cada item passa:
- **Rate limit:** o `POST /v1/eu/introducao` cai na `GuardaDeLimite` global, que limita pelo usuário e pela escola do token (`apps/api/src/app.module.ts:145-150`). A rota não tem limite por IP.
- **Fila:** não há trabalho demorado no request. Fora a leitura do `/v1/eu`, há só um `UPDATE` de uma linha por chave primária e um `min()` por conta.
- **Concorrência:** a escrita é atômica no banco, com `coalesce(introducao_vista_em, now())` filtrado por `escola_id` e `id` do contexto (`apps/api/src/sessao/eu/eu.repository.ts:51-57`). O código não lê e depois grava. Os testes com `Promise.all` cobrem dois POST, dois GET e um GET com um POST (`apps/api/test/introducao.int.test.ts:145,157,243`).
- **Índice:** a consulta `introducaoMaisAntigaDaConta` filtra por `conta_id` e usa o `usuario_conta_idx`, que já existe. Ela só roda para a equipe. Para o aluno (`conta_id` nulo), o `/v1/eu` não ganha consulta nova, e às 7h30 ele não grava nada, porque não tem data de outra escola.
- **Migration:** `packages/nucleo/drizzle/0039_introducao_vista.sql` só acrescenta uma coluna que aceita nulo, sem valor padrão nem índice. No Postgres isso muda só o catálogo e não reescreve a tabela. O migrador já aplica `lock_timeout` e tenta de novo, e nenhum código em produção confere as colunas do banco, então a versão anterior roda com a coluna nova.
- **Métrica:** a latência entra no `http.server.request.duration` global. A falha da gravação no GET conta em `eu.introducao_falha`, sem rótulo, com painel em `infra/grafana/paineis/fundacao.json`. Não há alerta novo, então não precisa de runbook.
- **Teste de carga:** a atualização do `infra/k6/login-7h30.js` e do seed `infra/scripts/carga-login.ts` está prevista na tarefa 3.0 (`tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`, subtarefa 3.1), como diz a seção 7c da techspec. Nenhum teste chama provedor pago.

Recomendações:
- `apps/api/test/introducao.int.test.ts:61-67`: o teste da gravação que falha cria e apaga um trigger em `usuario`, a tabela que todos os testes usam. Esse comando trava escritas em `usuario` enquanto roda e pode deixar instável outro arquivo de integração que rode ao mesmo tempo. Vale isolar esse teste (rodar em série, ou apagar o trigger já no `finally`) se aparecer instabilidade.
- `apps/api/src/sessao/eu/eu.service.ts`: se uma transação longa segura a linha do usuário, a gravação do GET espera até o `statement_timeout` antes de cair no `catch`, e o `/v1/eu` fica mais lento nesse caso. É raro e o limite é o mesmo de todo o resto. Se o painel novo mostrar falhas junto com latência alta do `/v1/eu`, vale um `lock_timeout` curto só nessa escrita.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 00:54:06 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: um só, `usuario.introducao_vista_em` (`packages/nucleo/src/db/schema/usuario.ts:41-46`, `packages/nucleo/drizzle/0039_introducao_vista.sql`). É só a data em que a pessoa viu a introdução, sem conteúdo nem comportamento. O campo aparece em `GET /v1/eu` (`packages/shared/src/sessao/eu.ts:28`) e em `POST /v1/eu/introducao` (`packages/shared/src/sessao/eu.ts:36`), e as duas respostas usam esquema `.strict()` com DTO montado campo a campo em `apps/api/src/sessao/eu/eu.service.ts:59-67` e `:77`.

Fora da tabela de dados do docs/lgpd.md: nada fica de fora. A linha nova está em `docs/lgpd.md:105`, com titulares (aluno, professor, coordenador), finalidade, base legal "execução de contrato" e retenção atrelada à linha de `usuario`. A eliminação apaga a linha de fato (`packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.ts:253`), então a data sai junto com a pessoa. Não entra nenhum campo proibido para aluno.

Autorização por objeto: ok.
- **Escrita:** a escrita (`apps/api/src/sessao/eu/eu.repository.ts:51-58`) não recebe id nem data. Ela grava por `escola_id` e `id` vindos de `identidadeDaRequisicao()`, com `coalesce(..., now())`. Trocar o id não tem como acontecer, porque o id não vem do cliente.
- **Corpo:** o corpo do POST é vazio e estrito (`apps/api/src/sessao/eu/eu.controller.ts:25`).
- **Leitura entre escolas:** `introducaoMaisAntigaDaConta` (`apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts:189-197`) tem `@SemEscopo` justificado e testado. Ela filtra por conta da sessão, papel, sem desativado e sem eliminação agendada, e devolve só o `min`. Nada da outra escola sai: nem nome, nem id. O aluno não tem conta e por isso não empresta (`eu.service.ts:66-68`).
- **O que o GET grava:** em B, o GET grava o `now()` da própria escrita, nunca a data de A. Assim o dado de A não é gravado em B.
- **Sumiço da linha:** quando a linha some, os dois caminhos respondem `NAO_AUTENTICADO`, com a mesma resposta.
- **Testes:** os testes cobrem a linha do colega (POST e GET), isolamento A/B, outra conta, outro papel, desativado e eliminação agendada, e conferem que `acessos` segue com os quatro campos de sempre.

Logs: limpos. Não entra log novo. A falha da gravação do GET só soma um contador sem rótulo, `eu.introducao_falha` (`eu.service.ts:72`), e o `catch` engole o erro sem logar nada.

Auditoria: não se aplica. Marcar a própria introdução não está entre as ações da regra 20, item 10. A rede está como `nunca` na matriz (`packages/shared/src/permissao/matriz.ts:199`) e em `matriz.expectativa.ts`, com teste.

Arquivo do titular: a coluna entrou em `LEITURAS_DO_ARQUIVO.usuario.colunas` (`packages/nucleo/src/titular/leitura-do-titular.ts:87`). A versão `coordenacao` não traz a data do professor (D64) e traz a do aluno (`leitura-do-titular.ts:95`). Isso está provado em `apps/api/test/arquivo-do-titular.int.test.ts:567-590`, com as quatro combinações.

Envio externo: nenhum, e nada vai para IA.

Seed/fixture: sintético. As fixtures do e2e (`e2e/__fixtures__/sessao.ts`, `e2e/__fixtures__/governanca.ts`, `e2e/__fixtures__/painel.ts`) e a vitrine (`tools/vitrine/escola.ts:217-218`) só ganharam `now()` ou `null` como literal fixo, e os nomes e e-mails continuam sintéticos (`@educa.invalid`).

Pergunta de fechamento: o código responde. A data sai no arquivo do titular, na versão completa e na versão da coordenação conforme o papel, e não é enviada a lugar nenhum.

Bloqueantes: nenhum.

Recomendações:
1. A tabela de testes da tarefa pede "rede: a sessão de rede é recusada no POST" como integração. Hoje isso só está provado pela matriz (`packages/shared/src/permissao/matriz.test.ts:50-53`). Hoje nem existe sessão de rede, porque `sessao-guarda.int.test.ts:351` trata `rede` como papel desconhecido, então não há furo. Quando esse papel existir, vale um caso de integração em `apps/api/test/introducao.int.test.ts`.
2. O teste "o `escolher` não leva a data" só existe de forma indireta. `apps/api/test/login-email.int.test.ts:351` confere o corpo da etapa com `acessos: expect.any(Array)`, sem olhar as chaves de cada acesso. Conferir as chaves ali, como o teste de `/v1/eu` faz em `introducao.int.test.ts:321`, fecharia o item da subtarefa 1.2 de forma explícita.
3. Na versão `coordenacao` do arquivo do titular, a data também some para o titular coordenador, porque o `case when` só deixa passar a do aluno. Isso é conservador e não é furo, mas vale uma linha em `docs/lgpd.md:105`, que hoje cita só o professor.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 00:55:01 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Recomendações:

1. **Falta o teste do `escolher` que a subtarefa 1.2 pede.** A 1.2 está marcada `[x]` e pede "teste de que o `escolher` não leva a data". Esse teste não existe. O `introducao.int.test.ts › a data não sai em acessos` olha só o `acessos` do `/v1/eu`. Os testes do login (`login-email.int.test.ts:351` e outros) conferem `acessos: expect.any(Array)` e não olham as chaves de cada acesso. Hoje a data não vaza: o método `introducaoMaisAntigaDaConta` é separado e o `esquemaAcessoDaConta` é estrito. Mas o que a subtarefa pede como prova não foi entregue. Isso é do `test-engineer`, por isso não reprovei. Fica a pendência de desmarcar a 1.2 ou de escrever o caso, por exemplo em `login-email.int.test.ts › borda: conta com usuário em A e em B recebe escolher`, com uma data gravada em A e a checagem das chaves de cada acesso.

2. **O cenário "rede" da tabela de testes não tem teste de integração.** Só `matriz.test.ts › marcar a introdução como vista` cobre esse caso. Pelo que achei, não dá para criar sessão de rede no ambiente de teste: `sessao-guarda.int.test.ts:351` recusa `--papel rede` como "papel desconhecido". Então a tabela deveria trocar "integração" por "unidade (matriz)", ou dizer por que não há caso de integração.

3. **A descrição do contador diz o contrário do que o código faz.** Em `packages/nucleo/src/telemetria/metricas.ts` e na `description` do painel em `infra/grafana/paineis/fundacao.json` (painel id 39), a falha é descrita como a data emprestada que não foi gravada. Já a do `createCounter` em `apps/api/src/sessao/eu/eu.service.ts:147` diz "Datas da introdução emprestadas de outra escola que não foram gravadas na linha da sessão". Mas o código nunca grava a data emprestada: grava `now()`, e isso é justamente a regra da techspec §3. Melhor escrever "a gravação da linha da sessão, disparada por data de outra escola, falhou", para quem opera o painel não achar que o dado de A deveria ir para B.

4. **O nome do contador muda no meio do caminho.** A chave é `introducaoNaoGravada` e a métrica é `eu.introducao_falha`. As vizinhas seguem o par `atividadeFalha` / `sessao.atividade_falha`. Alinhar a chave ao nome (`introducaoFalha`) facilita a busca.

5. **O tipo da data em `resolucao-de-tenant.repository.ts:253` não confere com o que chega do banco.** O `sql<string | null>` do `min(...)` declara texto, mas o driver pode entregar um `Date`. O `new Date(...)` aceita os dois, então funciona, mas o tipo engana quem ler. Dá para usar `.mapWith(usuario.introducaoVistaEm)` ou declarar `Date | string | null`.

6. **`criarPessoaNaEscola` em `e2e/__fixtures__/sessao.ts:825` não aceita `introducao`.** As outras fábricas de pessoa aceitam. A 9.0 a 11.0 vão precisar dele se alguma tela de equipe semeada por essa função tiver de cair na introdução.

Arquivos que olhei com mais cuidado:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/src/sessao/eu/eu.service.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/src/sessao/eu/eu.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/introducao.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/login-email.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/packages/nucleo/src/telemetria/metricas.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/infra/grafana/paineis/fundacao.json

## test-engineer · 1ª rodada · REPROVADO · 2026-10-25 00:56:19 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

**VEREDITO: REPROVADO**

Um bloqueante: falta o teste de que a etapa `escolher` do login não leva a data, que a subtarefa 1.2 pede. O resto da tarefa está coberto, e os testes rodam verdes.

**Cenários exigidos**
- **Caminho feliz:** nos três papéis, o `/v1/eu` devolve nulo antes do POST e a data depois.
- **Bordas:**
  - POST repetido e virada do ano letivo.
  - Escola sem ano em curso e escola entre anos.
  - Professora em duas escolas: a data de A vale em B, o GET grava `now()` em B e vale a mais antiga.
  - Vínculo encerrado, com e sem GET intermediário.
  - B sem ano em curso.
  - Dois papéis na mesma conta.
  - Outra conta, e eliminação agendada.
  - Gravação do GET que falha no banco.
- **Permissão:** 401 sem sessão; campo no corpo dá `ENTRADA_INVALIDA`; a rede nunca alcança.
- **Isolamento:** com o contexto de B, o usuário de A não é lido nem alterado. Só a própria linha é gravada, no POST e no GET.
- **Concorrência:** dois POST com `Promise.all`, dois GET em B, um GET com um POST, e o `coalesce` com data antiga já gravada.
- **Contrato:** a data não sai em `acessos` nem na etapa `escolher`; o arquivo do titular traz a data, e a versão `coordenacao` não traz a do professor.

**Cobertos.** Todas as linhas da tabela têm teste em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/introducao.int.test.ts`, com uma exceção: a linha "rede" é provada por um teste de unidade (ver Recomendações).
- A falha da gravação é provocada no Postgres, por um trigger, e não por mock do repository. O contador é conferido sem rótulo.
- As corridas usam `Promise.all` de verdade.
- O isolamento do repository está em `eu.repository.int.test.ts › isolamento: a marca da introdução…`.
- O arquivo do titular está em `arquivo-do-titular.int.test.ts › a data da introdução vista…`.
- A matriz está em `matriz.test.ts › marcar a introdução como vista…`.

Conferi os 28 blocos de mutação contra o `git diff`. Toda linha nova com condição em `eu.service.ts`, `eu.repository.ts`, `resolucao-de-tenant.repository.ts`, `leitura-do-titular.ts`, `sessao.module.ts`, `matriz.ts` e no pipe do controller tem bloco, e o teste citado de cada um alcança a cláusula. As cinco mutações que a revisão da spec exige estão lá. Não há `.skip`, teste comentado nem provedor de IA. Rodei os testes com `npx vitest run`, um comando por vez: os dois de integração (24 passaram), os quatro de unidade (37 passaram) e o caso novo do arquivo do titular (passou).

**Bloqueantes**
1. **O teste de que o `escolher` não leva a data não existe.** A subtarefa 1.2 pede isso com todas as letras (`tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md:31`: "teste de que o `escolher` não leva a data"). Nenhum teste da tarefa chega a essa etapa com a data gravada:
   - `apps/api/test/login-email.int.test.ts:351` confere só `acessos: expect.any(Array)`.
   - `apps/api/test/troca-de-escola.int.test.ts:234-241` confere os itens exatos, mas com a data nula nas duas linhas. Uma implementação que pusesse o campo só quando ele não é nulo passaria.
   - `introducao.int.test.ts › a data não sai em acessos` cobre o `/v1/eu`, e não o login.

   **Correção exigida:** um caso de integração, por exemplo em `troca-de-escola.int.test.ts`, que siga estes passos:
   - grave uma data conhecida (`DATA_ANTIGA`) nos dois usuários da conta;
   - faça o login por e-mail até a etapa `escolher`;
   - confira que cada item de `acessos` tem exatamente `['escolaNome', 'papel', 'redeNome', 'usuarioId']`;
   - confira que `JSON.stringify(corpo)` não contém a data.

   O caso precisa ser citado pelo nome na tarefa.

**Recomendações**
- **Linha "rede" da tabela (`1_task.md:76`).** Ela diz "integração", mas a prova é o teste de unidade da matriz. Uma sessão de rede não existe hoje (`PAPEIS_DE_USUARIO` exclui `rede`, em `matriz.ts:22`). Registre isso em "Divergências" e cite o teste pelo nome; o `revisor-geral` pode cobrar a divergência sem registro.
- **Escrita do GET só na própria linha.** A mutação que tira `id = <contexto>` cita só `› só a própria linha`, que é o teste do POST. Como GET e POST usam o mesmo método, vale citar também `› escrita do GET, só a própria linha`, ou dizer no bloco que a instrução é uma só.
- **Corrida de dois GET (`introducao.int.test.ts:247-253`).** O teste lê a linha só depois das duas chamadas terminarem, então não distingue "a primeira data fica" de "a última sobrescreve". Hoje quem pega a falta do `coalesce` ali é a parte GET com POST. Se a prova da corrida entre GETs importa, compare com um valor conhecido.
- **`apps/web/src/api/eu.test.ts:49,51`.** O `rejects.toBeDefined()` aceita qualquer erro. Melhor conferir o tipo ou o código do erro de contrato.
- **`eu.service.test.ts:49,56`.** Os repositories feitos à mão com `as unknown as` são aceitáveis aqui, porque a parte do banco tem integração. Uma interface mínima tipada evitaria o cast.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-25 01:07:03 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `usuario.introducao_vista_em` (migration 0039). Nesta rodada não entrou tabela nova nem coluna nova. A coluna fica na linha de `usuario`, que já tem `escola_id`, e não varia por período.

Queries verificadas:
- `apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts:190-193` (`introducaoMaisAntigaDaConta`): só o tipo do `min()` mudou. O `@SemEscopo` continua com a justificativa escrita. O filtro continua por `contaId` da sessão, mesmo `papel`, `desativadoEm` nulo e `eliminacaoAgendadaEm` nulo, e a consulta devolve só a data.
- `apps/api/src/sessao/eu/eu.repository.ts` (`marcarIntroducaoVista`): o código não mudou. A 1_task.md ganhou um bloco de mutação novo que prova o mesmo corte (`escolaId` mais `usuarioId`) pelo caminho do GET.
- `apps/api/src/sessao/eu/eu.service.ts:24`: só o nome da chave do contador e o texto da descrição mudaram. O contador continua sem rótulo, nem de escola nem de pessoa.
- `e2e/__fixtures__/sessao.ts:825`: a fábrica `criarPessoaNaEscola` agora aceita `opcoes.introducao`. O SQL interpolado sai de `introducaoVistaEm()` (linha 62), que só devolve as literais `null` ou `now()`. Todos os outros valores vão como parâmetro.

Nenhum endpoint passou a aceitar `escolaId` do corpo ou da query.

Teste de isolamento: presente e efetivo. O caso novo em `apps/api/test/troca-de-escola.int.test.ts:222-238` grava uma data conhecida nas duas linhas da professora, uma em cada escola. Depois confere que a etapa `escolher` do login devolve só os quatro campos em cada acesso e que nem a data nem `introducao` aparecem no corpo. Se `acessos` passasse a levar a data da outra escola, o teste quebraria. Os testes de isolamento da 1ª rodada não mudaram. O caso novo `corrida do GET, com um valor conhecido` (`apps/api/test/introducao.int.test.ts:268-296`) trata de concorrência e não toca o escopo.

Bloqueantes: nenhum.

Recomendações:
- `packages/nucleo/dist/telemetria/metricas.{js,d.ts}` ainda tem a chave antiga `introducaoNaoGravada`. O `dist` é artefato de build e não está no git, mas o `default` de `packages/nucleo/package.json` aponta para ele. Recompile o `@educa/nucleo` antes de rodar a API fora do Vitest, senão `METRICAS.introducaoFalha` chega `undefined`. Não afeta o isolamento.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-25 01:07:07 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: APROVADO

Esta rodada conferiu só o diff desde a 1ª rodada (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/ordens/1_task-diff-r1-r2.patch`), lido por inteiro, e o que ele afeta. A 1ª rodada não deixou correção exigida para conferir.

Campos pessoais tocados: nenhum campo novo. A `usuario.introducao_vista_em` já existia na 1ª rodada. O que mudou foi o texto dela em `docs/lgpd.md:188` e um parâmetro de fixture.

Fora da tabela de dados do docs/lgpd.md: nada. A linha da marca da introdução diz agora que a versão `coordenacao` do arquivo do titular também não traz a data do coordenador. O código bate com o texto: `packages/nucleo/src/titular/leitura-do-titular.ts:95` usa `case when t.papel = 'aluno'`. A linha também deixa escrito que a data nunca vira indicador de adoção (D64, regra 70 item 9).

Autorização por objeto: ok. Nenhuma rota ou repository novo. O bloco de mutação novo em `1_task.md` mostra que o GET também grava só a própria linha, pelo mesmo `marcarIntroducaoVista`. A rede como `nunca` no POST passou a ser provada só na matriz, porque não existe sessão de rede (`PAPEIS_DE_USUARIO` exclui `rede`). A divergência ficou registrada e a explicação é aceitável.

Exposição: melhorou. O teste novo `apps/api/test/troca-de-escola.int.test.ts:222-238` prova que, no login com a etapa `escolher`, cada acesso traz só `escolaNome`, `papel`, `redeNome` e `usuarioId`. O corpo da resposta não contém a data nem a palavra `introducao`. Assim fica provado por teste o que a tabela de dados promete: a data emprestada de outra escola não sai no login.

Logs: limpos. A única mudança de telemetria é o nome da chave do contador, de `introducaoNaoGravada` para `introducaoFalha`, em `metricas.ts` e `tools/testes/metricas.ts`. O contador continua sem rótulo, sem escola e sem pessoa, e isso está provado em `introducao.int.test.ts:310`.

Auditoria: presente onde a regra exige. Marcar a própria introdução como vista não está entre as ações que pedem auditoria, e o diff não toca nenhuma das que pedem.

Envio externo: nenhum.

Seed/fixture: sintético. `criarPessoaNaEscola` (`e2e/__fixtures__/sessao.ts:817-827`) usa nome "sintética", e-mail `@educa.invalid` e senha gerada. A opção nova `introducao` só escolhe entre `now()` e `null`, um valor fechado: não entra entrada externa no SQL.

Bloqueantes: nenhum.

Recomendações:
- O comentário em `packages/nucleo/src/titular/leitura-do-titular.ts:32` ainda diz que a versão `coordenacao` não traz só a data do professor. O código também esconde a do coordenador, e `docs/lgpd.md:188` já diz isso. Alinhar o comentário ao código.
- Nenhum teste prova que o arquivo do titular na versão `coordenacao` omite a data quando o titular é coordenador. Hoje a omissão vem só do `case when`. Vale um caso em `apps/api/test/arquivo-do-titular.int.test.ts`, se esse caminho existir na prática.

Pergunta de fechamento: o diff não muda a resposta da 1ª rodada. A data entra no arquivo do titular na versão completa, e na versão `coordenacao` só a do aluno. A data não é enviada a terceiro.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-25 01:07:16 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/packages/nucleo/dist/telemetria/metricas.js:95` e `metricas.d.ts:98` ainda têm a chave antiga `introducaoNaoGravada`. É artefato de build e não entra na árvore auditada, mas quem resolver `@educa/nucleo` pelo `dist` sem refazer o build pega a chave antiga e o tipo não bate. Basta refazer o build do `nucleo` antes da esteira.
- O `lock_timeout` curto na gravação do `GET /v1/eu` foi registrado em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/TODO.md`, na seção "Infra e operação", com a condição para abrir. Esse destino vale: a gravação já é `coalesce(..., now())` numa única linha por chave primária, e uma falha não muda a resposta ao usuário.

O que conferi no diff desta rodada:
- A chave do contador trocou de nome só no código. O nome no Prometheus (`eu_introducao_falha_total`) continua o mesmo, então o painel e o `tools/testes/metricas.ts` seguem certos. Fora do `dist` não sobrou nenhuma referência à chave antiga.
- O teste novo de corrida do GET em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/introducao.int.test.ts` segura a linha de B com `for update` e espera os dois `update` ficarem presos na trava. Depois confere que vale a data do primeiro GET. Ele cobre o item 6 com um valor conhecido, e o bloco de mutação do `coalesce` aponta para ele.
- A mudança de `sql<Date | string | null>` em `resolucao-de-tenant.repository.ts` só mexe no tipo: a query é a mesma e não há efeito no plano.
- O teste novo da etapa `escolher` em `troca-de-escola.int.test.ts` prova que a data da introdução não sai no login.
- As mudanças em `e2e/__fixtures__/sessao.ts`, `docs/lgpd.md`, no painel, na `techspec.md` e na `1_task.md` são de texto ou de fixture e não tocam o caminho quente. A divergência da linha "rede" está explicada: não existe sessão de rede hoje, então o `nunca` fica provado na matriz.

Não houve correção exigida pela rodada anterior.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-25 01:07:31 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: REPROVADO

A correção exigida na rodada anterior foi feita pela metade. O teste de integração existe e prova a regra, mas a tarefa não o cita pelo nome, e a correção exigia isso com todas as letras.

**Cenários exigidos:**
- O `escolher` do login não leva a data da introdução, mesmo com a data gravada nas duas linhas da conta (é a correção da 1ª rodada).
- A corrida do GET com um valor conhecido.
- A escrita do GET só alcança a própria linha.
- O contrato do `concluirIntroducao` na web.

O resto da tarefa não mudou desde a 1ª rodada e não foi reauditado.

**Cobertos:**
- `apps/api/test/troca-de-escola.int.test.ts:222`, `a etapa escolher não leva a data da introdução: …`. Grava a data `2020-01-02T03:04:05.678Z` nos dois usuários da conta, entra por e-mail até a etapa `escolher` e confere que cada um dos dois acessos tem exatamente `['escolaNome', 'papel', 'redeNome', 'usuarioId']`. Confere também que o corpo serializado não tem nem a data nem a palavra `introducao`. Se o campo entrasse em `acessos`, mesmo só quando não é nulo, o teste ficaria vermelho. Faz o que a correção pedia. Rodei o arquivo: 22 de 22 passaram.
- `apps/api/test/introducao.int.test.ts:268`, `corrida do GET, com um valor conhecido`. Os dois GET ficam parados de verdade na trava da linha de B, presa com `for update`, e esperam pelo `pg_stat_activity`, sem depender de folga da máquina. Antes do segundo GET o teste guarda a hora do banco (`clock_timestamp`). Sem o `coalesce`, o segundo GET grava o próprio `now()`, que vem depois dessa marca, e a conferência fica vermelha. O bloco de mutação novo está em `1_task.md:150-156`. Rodei o arquivo: 22 de 22 passaram.
- O bloco de mutação `escrita do GET, só a própria linha` (`1_task.md:134-140`) aponta para o teste certo.
- `apps/web/src/api/eu.test.ts:50,53` agora exige `ErroDaApi` com `ERRO_INTERNO`, em vez de um `rejects.toBeDefined()` genérico.
- A troca do nome da métrica (`introducaoNaoGravada` para `introducaoFalha`) bate nos quatro lugares: `metricas.ts`, `tools/testes/metricas.ts`, o service e os dois testes.
- A linha "rede" passou a ser de unidade (a matriz). Está registrada em Divergências e na `techspec.md` §3, e o motivo se sustenta: não existe sessão de rede.

**Bloqueantes:**
1. `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md:58-78` (tabela "Testes que provam a regra") e `1_task.md:31` (subtarefa 1.2, "teste de que o `escolher` não leva a data"):
   - **O que está errado:** o caso novo não aparece em lugar nenhum da tarefa. A tabela não tem linha para ele, e a única menção a `troca-de-escola.int.test.ts` é a linha 85 ("Duas escolas"), que já existia antes.
   - **Por que bloqueia:** a correção da 1ª rodada dizia "O caso precisa ser citado pelo nome na tarefa". É o mesmo problema do item 3 da auditoria, em que um item juntado a outro por ponto e vírgula fica sem teste citado.
   - **Correção exigida:** acrescentar à tabela uma linha como esta:

     `| escolher sem a data | integração | com a data gravada nas duas linhas da conta, cada item de acessos traz só escolaNome, papel, redeNome e usuarioId, e o corpo não contém a data: apps/api/test/troca-de-escola.int.test.ts › a etapa escolher não leva a data da introdução |`

     Ou então citar o mesmo nome logo depois da frase da subtarefa 1.2.

**Recomendações:**
- `apps/api/test/introducao.int.test.ts:268-296`: o teste depende de duas coisas que ele não diz. A primeira é que o Postgres entrega a trava da linha na ordem em que os pedidos chegaram. A segunda é que o `now()` de uma instrução avulsa é a hora do início dela, antes da espera. Uma linha de comentário com isso evita que alguém troque `now()` por `clock_timestamp()` no repository sem perceber que o teste perde o sentido.
- A linha "corrida do GET" (`1_task.md:73`) ainda fala em "`Promise.all` de dois GET". O caso novo dispara os dois em sequência controlada pela trava e só depois os reúne com `Promise.all`. Vale ajustar o texto para ele descrever o que o teste faz.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-25 01:07:32 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta rodada. O diff mexe só na marca `usuario.introducao_vista_em`, no contador e nos testes dela, em texto de documento e na fábrica do e2e. Todos com autor humano? sim (nenhum caminho novo e nenhum alterado).
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhuma saída de IA entra no diff, e a exceção do tutor (D47) não aparece em outro lugar.
Supervisão do tutor: ok. O diff não toca o tutor.
Autonomia declarada e visível: sim. O diff não altera governança nem agente.
Bloqueantes: nenhum

Conferi o patch inteiro, de r1 para r2, e o que ele afeta:

- **Indicador de adoção (D64, item 9).** A frase nova em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/docs/lgpd.md:105` diz que a data nunca vira indicador e que ninguém lista "quem ainda não viu a introdução". O código confirma: fora do schema, da sessão (`eu.*`, `resolucao-de-tenant`), da matriz, da telemetria e do arquivo do titular, nada usa a data. Nem governança nem painel da coordenação a consomem.
- **Arquivo do titular.** O texto novo do documento descreve o código: em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/packages/nucleo/src/titular/leitura-do-titular.ts:95`, o `case when t.papel = 'aluno'` faz a versão `coordenacao` trazer só a data do aluno. Saem a do professor e a do coordenador, o que protege o professor (D45, D64).
- **Contador e painel.** O contador foi renomeado (`introducaoNaoGravada` para `introducaoFalha`) e o nome no Prometheus continua `eu_introducao_falha_total`. Continua sem rótulo de escola ou pessoa, então não mede pessoa e não vigia ninguém (item 7).
- **Login.** O teste novo de `troca-de-escola.int.test.ts` prova que a data não sai em `acessos` nem no login.
- **Fábrica do e2e.** Só passou a aceitar a opção `introducao`. Não grava nota nem outro dado de IA.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/docs/lgpd.md:105`: a proibição de usar a data como indicador está só escrita. Quando a coordenação ganhar painel de adoção, vale um caso em `apps/api/src/governanca/governanca.int.test.ts` que prove que a data não entra no painel. Hoje não bloqueia, porque não existe consumidor.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-25 01:07:38 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Nesta rodada li o diff inteiro e o que ele afeta, sem reauditar o que não mudou.

- **Correção do `test-engineer`.** O teste novo de "corrida do GET, com um valor conhecido" está em `apps/api/test/introducao.int.test.ts:268-296`. Os dois GET ficam parados na trava da linha de B, e o teste anota a hora do banco entre um e outro, o que dá um limite de tempo de verdade. Se o `coalesce` virar `now()`, a gravação do segundo GET sai com hora posterior a esse limite e o teste fica vermelho. A mutação registrada em `1_task.md` é a certa. O `esperarNaTrava` existe em `apps/api/test/gatilho-de-parada.ts:23`.
- **Troca do nome do contador.** A chave antiga (`introducaoNaoGravada`) foi trocada em todos os arquivos versionados: `metricas.ts`, `tools/testes/metricas.ts`, o service, o teste de unidade e o teste de integração. Ela só resta no `dist` de build, fora do git.
- **Linha "rede" de `1_task.md`.** A divergência agora está registrada em `techspec.md` §3. Esta spec não tem `cenarios.md`.
- **`criarPessoaNaEscola`.** O padrão continua `now()`. Os chamadores de hoje (`incidentes`, `meus-dados`, `pedidos`, `professor-aprovar` e `fluxo-do-professor`) não mudam de comportamento.
- **Login com duas escolas.** O teste novo em `troca-de-escola.int.test.ts:222` prova que, na etapa de escolher a escola, a data da introdução não sai em `acessos`.

Recomendações:
- O parâmetro `opcoes.introducao` de `criarProfessoraNaEscola` e `criarCoordenadoraNaEscola` (`e2e/__fixtures__/sessao.ts:218,223`) não tem chamador nesta tarefa. Ele só se justifica se uma tarefa seguinte o usar; senão, é parâmetro morto.
- O campo continua com o nome `#naoGravadas` em `apps/api/src/sessao/eu/eu.service.ts:46`, ao lado da chave já renomeada para `introducaoFalha`. Alinhar os dois evita ler duas coisas diferentes.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/introducao.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/troca-de-escola.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/src/sessao/eu/eu.service.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/sessao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md

## test-engineer · 3ª rodada · APROVADO · 2026-10-25 01:17:28 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: APROVADO

Cenários exigidos: a correção 1 da 2ª rodada. O caso "a etapa `escolher` não leva a data" precisava ser citado pelo nome na tarefa, na tabela "Testes que provam a regra" ou logo depois da frase da subtarefa 1.2.

Cobertos:
- **A correção foi feita nos dois lugares.** A frase da subtarefa 1.2 (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md:31-32`) agora cita o teste. A tabela ganhou a linha "escolher sem a data" (`1_task.md:80`).
- **O nome citado bate com o teste.** O nome na linha 80 é igual, caractere por caractere, ao do teste em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/troca-de-escola.int.test.ts:222`: "a etapa escolher não leva a data da introdução: com a data gravada nas duas linhas, cada acesso traz só os quatro campos".
- **As outras citações novas da tabela levam a testes que existem** em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/introducao.int.test.ts`. Elas usam o começo do nome, como as demais citações da tarefa:
  - "corrida do GET, com um valor conhecido" está na linha 268.
  - "corrida do GET: dois GET juntos em B" está na linha 244.
  - "gravação do GET que falha no banco" está na linha 302.
- **Parte do item que antes dividia ponto e vírgula agora tem linha própria.** A linha antiga da corrida do GET juntava dois casos: a corrida e a "gravação que falha". Agora cada um tem a sua linha e o seu teste.
- **O diff não toca mais nada.** Comparei as árvores `99109156…` e `e50c5bf9…`. Mudaram só quatro arquivos:
  - `1_task.md`: a subtarefa 1.2, três linhas da tabela, as recomendações da 2ª rodada e as linhas da seção "Revisões".
  - `introducao.int.test.ts`: só um comentário de quatro linhas, sem mudar asserção nem cenário.
  - os dois arquivos de `achados/`, que o hook escreve.

Nenhum teste mudou desde a 2ª rodada, então não rodei a suíte de novo.

Bloqueantes: nenhum.

Recomendações:
- Para quem procura o nome com busca de texto, convém citar o nome inteiro dos testes de `introducao.int.test.ts`, como já foi feito em `troca-de-escola.int.test.ts` na linha 80, e não só o começo.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-25 01:17:34 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

Esta rodada não mudou código de produção. Mudaram duas coisas:

- **O comentário novo** em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/introducao.int.test.ts:274-277` bate com o código. `eu.repository.ts:55` usa `coalesce(..., now())` num update avulso. Nesse caso o `now()` dá a hora em que a instrução começou, antes da espera na trava, e é isso que sustenta a comparação com `aPartirDoSegundo` no teste.
- **As referências novas** em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md` apontam para testes que existem com esses nomes: `troca-de-escola.int.test.ts:222`, `introducao.int.test.ts:244`, `:268` e `:302`. As seis recomendações da 2ª rodada estão registradas com destino ou com o motivo da recusa. Nenhuma divergência nova da Tech Spec foi aberta.

Recomendações:
- No comentário de `introducao.int.test.ts:275`, dizer com precisão que o `now()` dá a hora do início da transação, que num update avulso coincide com a da instrução. Assim, quem envolver `marcarIntroducaoVista` numa transação depois vê logo que a premissa deixa de valer.
- A linha da subtarefa 1.2 em `1_task.md:32` ficou bem mais longa que as vizinhas. Quebrar a linha deixa a leitura do diff melhor.
- O test-engineer reprovou na 2ª rodada. Esse bloqueante é dele e não entra neste veredito.

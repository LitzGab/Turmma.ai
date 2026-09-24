# Achados das revisões — `tasks/prd-apresentacao-painel/1_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-24 14:02:13 · `tasks/prd-apresentacao-painel/1_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os que a tarefa lista em `tasks/prd-apresentacao-painel/1_task.md`:
- **E1**: rede e escola com auditoria e o apelido da sessão.
- **E2**: clique duplo em paralelo, em `/redes` e em `/escolas`.
- **E3**: o mesmo id com outros dados.
- **E4**: o mesmo slug com ids diferentes, em corrida e fora dela.
- **E5**: rede inexistente.
- **E11**:
  - pelo painel, nas duas ordens;
  - pelos cinco `ops:*`, com a espera visível em `pg_stat_activity` e depois código 2.
- **E12**: `autor` ou campo a mais no corpo.
- **E14**: 429 com `Retry-After`.
- **I2 e I3**: a cerca do comando, os dois `@SemEscopo` e as varreduras C36, C41 e C46 com as três rotas.
- **A3**: rede e escola.
- **1.1**: erro tipado no lugar do `throw new Error`.
- **1.2**: os checks do banco comparados com `FORMATO_OPERADOR`.
- **Permissão**: só a sessão de operador alcança as rotas.
- **Casos de borda**: o pedido repetido fora de corrida, e a lista de redes com mais de 200.

**Cobertos:** todos.
- **Cenários:**
  - E1 a E5, E11, E12 e E14 estão em `apps/api/test/painel-escrita.int.test.ts`:
    - A concorrência é real: um gatilho só do banco de teste para a primeira escrita, e `esperarNaTrava` prova que a segunda chegou à trava antes de soltar.
    - A outra ordem da E11 usa o `desativarOperador` de verdade.
    - Os cinco `ops:*` criam outro operador ativo antes, para o desativado não cair no nascimento.
  - A3 está nas linhas 173-177 do mesmo arquivo.
  - I2 está em `apps/api/src/ops/escola.repository.test.ts` e na C44 de `apps/api/test/arquitetura.test.ts`, com os negativos: o painel importando outro comando, e outro arquivo importando o `ops:escola`.
  - I3 está na C41 e na C36 de `arquitetura.test.ts` e na C46 de `apps/api/test/operacao-isolamento.int.test.ts`.
  - 1.1 está em `apps/api/src/operacao/operador.repository.test.ts`.
  - 1.2 está em `packages/nucleo/src/db/formato-do-operador.int.test.ts`. Ele também acha check novo que fuja da constante.
  - O contrato estrito e o id v4 ou v7 estão em `packages/shared/src/operacao/painel.test.ts`.
- **Três pontos que as mutações declaradas não cobrem, conferidos no código existente:**
  - **Autor antes da leitura:** a C2 da A0 (`apps/api/test/ops-operador.int.test.ts:171`) roda o `OPERADOR` recusado contra slug, convite e usuário inexistentes. Ela quebraria se a leitura voltasse para antes do autor (sairia código 1, e não 2).
  - **Nascimento:** o ramo do nascimento em `autorDoComando` é provado pela C1 (`ops-operador.int.test.ts:122`).
  - **Comparação campo a campo:** remover o `if (criada.nova)` deixa a E2 vermelha, pela auditoria e pelo log. Comparar só o id na releitura deixa a E3 vermelha: cada campo é variado sozinho (nome, tipo, slug, redeId).
- **Checklist:** nenhum `.skip`. Nenhum mock esconde a regra: o banco falso da 1.1 só alcança um ramo que o Postgres real não produz. A tarefa não chama IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **A3, e-mail do operador:** `painel-escrita.int.test.ts:177`. A lista de sentinelas não inclui o e-mail nem o apelido do operador da sessão (`${apelido}@turmma.invalid`, da `BancadaDeOperadores`), e a A3 fala em "nada de e-mail". Custa uma linha.
2. **E11 no `POST /redes`:** só o `POST /escolas` é provado com o operador desativado no meio. O `autorDaSessao` do `PainelService.criarRede` só tem o caminho feliz, pela E1. Um caso espelhado, com a rede, fecha a lacuna.
3. **Id em maiúsculas:** `painel.service.ts` aplica `toLowerCase()` ao `id` e ao `redeId` sem teste. Vale um caso: o mesmo UUID em maiúsculas e depois em minúsculas devolve o mesmo id, com uma auditoria só.
4. **23505 de reserva sem teste:** o mapeamento do 23505 para `CONFLITO` em `criarEscola` e no filtro global quase não é mais alcançado, porque o `on conflict` sem alvo absorve o slug repetido. Registrar no `/retro` que ele ficou sem teste que o exercite.
5. **Mutação com a trava mais fraca:** trocar o `for share` por `for key share` passaria nos testes, porque o `for update` do `desativar` conflita com os dois. Semanticamente não quebra nada, mas vale uma linha no comentário de `autorAtivoNaTransacao` dizendo que a garantia vem do `for update` do `desativar`.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-24 14:03:42 · `tasks/prd-apresentacao-painel/1_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration. `rede`, `escola`, `operador`, `auditoria` e `auditoria_operacao` mudam só no schema TypeScript: as constantes (`FORMATO_OPERADOR`, `FORMATO_SLUG`, `TAMANHO_MAXIMO_SLUG`, `TIPOS_DE_REDE`) passaram para `@educa/shared` e os checks do banco continuam iguais. `rede` segue sem `escola_id`, com a justificativa de raiz acima do tenant que já existia. Os ids de `rede` e `escola` continuam UUID. O que o pedido traz é aceito só como v4 ou v7 (`z.union([z.uuidv4(), z.uuidv7()])` em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/painel.ts`).

Queries verificadas:
- `RedeEEscolaRepository.criarRede` e `criarEscola` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/escola.repository.ts`), com o `on conflict do nothing` e a releitura pelo id do pedido. Cada uma tem um `@SemEscopo` com justificativa, que passou a citar "comando ou painel". A releitura devolve só `nova` ou `CONFLITO`, sem dado da linha.
- `PainelRepository.redes` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.repository.ts`) tem `@SemEscopo` justificado e devolve só id, nome e tipo, até 200 linhas. Só o `painel.service.ts` o importa, e há cerca de teste que prende isso.
- `OperadorRepository.autorAtivoNaTransacao` lê a tabela do operador, que não tem `escola_id`, com `for share`.
- Nos quatro outros `ops:*` que mexem com escola, as leituras mudaram de lugar: `escolaPorSlug`, `escolaDoConviteParaOperador`, `escolaDoUsuarioParaOperador` e `UsoRepository`. Continuam no mesmo repository, com os mesmos `@SemEscopo` de antes, e agora rodam dentro da transação, depois da conferência do autor. O escopo segue vindo do contexto na hora da chamada, e a escola continua saindo do convite ou do usuário, nunca do argumento.
- As três rotas novas (`GET /v1/operacao/redes`, `POST /v1/operacao/redes` e `POST /v1/operacao/escolas`) são `@RotaDeOperacao` e nenhuma recebe `escolaId`. O `redeId` do `POST /escolas` diz onde gravar, não o que ler, e só um operador com sessão chega a ele. O autor vem da sessão, e o corpo é estrito, então um `autor` no corpo é recusado.

Teste de isolamento: presente e efetivo.
- A C46 (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/operacao-isolamento.int.test.ts:161`) passou a exigir as três rotas do painel na varredura. Ela prova que sessão de coordenador, professor ou aluno, desafio, cookie de escola ou nenhuma credencial recebem a mesma resposta de uma rota inexistente. Se a guarda sair, o teste quebra.
- A C41 e a C36 (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`) confirmam que as rotas novas têm a guarda e o `rl:op`.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.repository.test.ts` prende os métodos sem escopo e quem pode usá-los.
- `ops-escola.int.test.ts` só aceita duas rotas que criam rede ou escola, as duas do painel.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/eu.ts:5-8`: o comentário diz que os checks do banco "são gerados desta expressão", mas eles estão escritos por extenso e são conferidos por `formato-do-operador.int.test.ts`. O texto deve dizer isso, como já fazem `schema/auditoria.ts` e `schema/operador.ts`.
2. `/home/joaquimdp/Documentos/git/Educa.ia/docs/arquitetura.md:44-50`: a frase "o único alcance entre escolas é o módulo `operacao`" deixa de fora os `ops:*`, que também atravessam escolas pelo `ResolucaoDeTenantRepository` (`escolaDoUsuarioParaOperador`, `escolaDoConviteParaOperador`) e pelo `ops:uso`. Basta uma linha dizendo que esses comandos são o outro alcance, fora da API.
3. Regra 10, item 9: hoje o módulo `operacao` tem um `@SemEscopo`, mas a 5.0 vai acrescentar `escolas` e `uso` ao `PainelRepository` e chegar a três. Isso está previsto na Tech Spec, que já foi aprovada. Mesmo assim, vale registrar no `/retro` que o limite de três foi aceito de propósito por ser o repository do painel, para que isso não passe despercebido.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-24 14:03:52 · `tasks/prd-apresentacao-painel/1_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. As escritas do painel gravam o apelido do operador em `auditoria.autor_operador`. Esse dado já está em `docs/lgpd.md`, linha 75 ("Identificador do operador Turmma na auditoria"), com finalidade e retenção. Nome, slug e tipo de rede e escola são dado da instituição, não de pessoa. O id que vem do pedido também não é dado pessoal.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok.
- As três rotas novas (`GET /v1/operacao/redes`, `POST /v1/operacao/redes`, `POST /v1/operacao/escolas`) são `@RotaDeOperacao` e as varreduras C41 e C46 cobrem as três.
- O autor sai da sessão e é conferido com `for share` dentro da transação. O corpo não escolhe o autor: um corpo com `autor`, `autorOperador` ou `escolaId` volta 400 sem nada gravado (E12).
- Rede inexistente responde `NAO_ENCONTRADO`.
- Um `CONFLITO` por slug de outra escola só é visível ao operador, que já tem alcance entre escolas por desenho (D76).
- DTOs de saída explícitos e validados pelo esquema estrito: `{ id }` na escrita, `{ id, nome, tipo }` na lista de redes, com no máximo 200 itens. Nenhuma pessoa aparece.

**Logs:** limpos. `operacao.rede.criada` leva só o `requisicaoId` e `operacao.escola.criada` leva o `escolaId` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.service.ts`). O filtro global loga o resumo do erro sem a mensagem nem o `detail` do Postgres. O teste A3 procura o nome da rede, o nome e o slug da escola e o nome do operador no log inteiro e não acha nenhum.

**Auditoria:** presente.
- `rede.criada` é gravada sem escola; `depois` leva só o tipo.
- `escola.criada` é gravada na escola criada; `depois` leva só a rede.
- As duas levam o apelido conferido na mesma transação.
- O pedido repetido não gera auditoria nova (E2).
- A leitura de redes não exige auditoria, porque não traz dado de aluno nem de pessoa.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. As bancadas, o ensaio de alertas e a carga de login usam nomes do tipo "Rede sintética…", slugs sorteados e e-mails em `@escola.invalid`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O comentário em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/eu.ts` diz que os checks do banco "são gerados desta expressão". Isso é falso: os checks estão escritos por extenso no schema, e quem garante que batem com a constante é `formato-do-operador.int.test.ts`. O comentário deveria dizer isso, como o de `schema/auditoria.ts` já diz.
2. O A3 só confere o log dos caminhos que dão certo. Vale uma asserção de que o `http.erro` do `CONFLITO` e do `NAO_ENCONTRADO` também não leva slug nem nome no log, porque o 23505 do Postgres traz o slug no `detail`. Hoje o `resumirErro` já descarta esse campo, então é só cobertura a mais.
3. Sobre a pergunta de fechamento: a tarefa não mexe em dado de aluno, então a resposta sobre o que o sistema guarda de um aluno e para onde enviou continua a mesma de antes. Ela não fica mais nem menos completa por causa desta mudança.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-24 14:03:57 · `tasks/prd-apresentacao-painel/1_task.md`

VEREDITO: APROVADO

Caminho quente tocado: nenhum. O painel da operação e os `ops:*` só atendem a equipe Turmma: nenhum aluno, professor ou escola usa esse caminho às 10h.

Rate limit: ok. As três rotas usam `@RotaDeOperacao`, que conta o limite por operador (`rl:op:{sub}`) e não por IP. A E14 prova o 429 com `Retry-After`.

Fila e prioridade: ok. Criar rede ou escola é uma escrita curta e não enfileira nada.

Concorrência: protegida.
- **Clique duplo:** o id vem do pedido, com `on conflict do nothing` sem alvo e depois a leitura pelo id na mesma chamada. Dois pedidos iguais geram uma linha e uma auditoria. Ids diferentes com o mesmo slug dão `CONFLITO`, nunca 500. A E2 e a E4 provam isso em corrida real, com o gatilho de parada.
- **Operador desativado no meio da escrita:** o autor é conferido com `for share` como primeira instrução da transação, e o `desativar` trava a mesma linha com `for update`. Não há risco de deadlock: nenhum dos lados trava depois algo que o outro já segura. A E11 cobre as duas ordens, pelo painel e pelos cinco `ops:*`.

Índice e paginação: ok. `rede` fica acima do tenant e não cresce com aluno. O `GET /redes` tem teto de 200 e ordem fixa (`nome`, `id`).

Degradação de IA: não se aplica.

Migration: não se aplica. Não há migration nova, e os checks do schema continuam com o mesmo texto. O `formato-do-operador.int.test.ts` compara cada check com o `FORMATO_OPERADOR`.

Métrica e alerta: ok. Não é caminho quente e não há alerta novo.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts:141`: a espera do `for share` no request está sujeita ao `statement_timeout` de 300 ms do pool da API. Se um `desativar` segurar a linha por mais que isso, a escrita do painel é cancelada (57014) e volta como erro interno em vez de `SESSAO_ENCERRADA`. Não perde nem duplica dado, porque a transação desfaz tudo e o clique repetido usa o mesmo id. Mesmo assim, vale registrar esse caminho na 7c ou no runbook, ou tratar o 57014 dessa conferência com um código próprio.
2. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.repository.ts:18`: o corte em 200 redes é silencioso. Com o alvo de dez escolas não importa. Quando a rede pública entrar com muitas unidades, a 5.0 ou uma tarefa depois dela deveria avisar que a lista foi cortada ou oferecer busca.
3. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.service.ts:48`: o log `operacao.rede.criada` não leva o id da rede, só o `requisicaoId`. Chegar à rede exige cruzar com a auditoria. Se o logger ganhar um campo de entidade, vale colocar o id ali.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-24 14:05:05 · `tasks/prd-apresentacao-painel/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido

**Escopo.** As subtarefas 1.1 a 1.7 foram feitas. Nada da 2.0 à 8.0 entrou (convite, lista de escolas, uso, telas). O `PainelRepository` nasce só com `redes`: o `GET /redes` pertence a esta tarefa e a seção 6 da spec põe esse método nele.

**Tech Spec.** As divergências estão escritas na seção "Divergências resolvidas nesta tarefa" do `1_task.md`, não foram decididas em silêncio. A troca de `on conflict (id)` por `on conflict do nothing` sem alvo também foi levada à linha "Rede ou escola repetida" da seção 7c. Levar as leituras de escola, convite e usuário para depois da conferência do autor, dentro da transação, é o que mantém o código 2 da C2 da A0.

**Portão local.** `portao-local.ts conferir` responde: "portão local válido para o código atual (typecheck, lint, test, infra)".

**Bloqueantes:** nenhum.

**Recomendações:**
1. `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/eu.ts:6`: o comentário diz que os três checks do banco "são gerados desta expressão". Não são: estão escritos por extenso no schema, e o `formato-do-operador.int.test.ts` só compara o check com a constante. Trocar por "escritos por extenso e conferidos contra esta expressão por teste", como já está em `auditoria.ts`.
2. `TIPOS_DE_REDE`, `FORMATO_SLUG` e `TAMANHO_MAXIMO_SLUG` passaram a morar em `@educa/shared`. Os checks `rede_tipo_valido` e `escola_slug_formato` continuam escritos por extenso, e nenhum teste os compara com as constantes, como a 1.2 faz com o `FORMATO_OPERADOR`. Se um mudar, o contrato do painel e o banco se afastam sem aviso. Vale estender o `formato-do-operador.int.test.ts`, ou abrir um teste irmão.
3. `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md:26`: o texto diz "o resto continua `uuidv7()` do banco". Só que agora nenhuma rede ou escola usa o default do banco: o comando também sorteia o id, em v4. Vale deixar explícito que o comando sorteia v4.
4. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/comando.ts:25`: `esquemaNome = esquemaNomeDigitado` é um segundo nome para a mesma coisa. Os `ops:*` podem importar `esquemaNomeDigitado` direto de `@educa/shared`.
5. As recomendações do `test-engineer` continuam abertas e valem uma linha cada:
   - incluir o e-mail e o apelido do operador nas sentinelas da A3 (`painel-escrita.int.test.ts:177`);
   - repetir a E11 no `POST /redes`;
   - testar um id em maiúsculas seguido do mesmo id em minúsculas;
   - registrar no `/retro` que o 23505 de reserva ficou sem teste.

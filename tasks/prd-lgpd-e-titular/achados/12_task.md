# Achados das revisões — `tasks/prd-lgpd-e-titular/12_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-09 22:35:20 · `tasks/prd-lgpd-e-titular/12_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **escopo:** um suboperador que só atende B aparece em A como "não cadastrado", e a reserva de A não lista o de B.
- **com e sem `provedor`:** o rastro é agrupado por provedor e atribuído pelas duas vias (`aluno_id` e execução pedida pelo aluno). As linhas antigas sem provedor caem na reserva. Nenhuma data é anterior à entrada.
- **rastro expirado:** o período do titular entra, o `todas` encerrado antes da entrada fica fora, e a entrada é a mais antiga entre a conta externa e a credencial. O relógio é injetado.
- **D64:** dois professores, um que usou e outro não, com foto, detalhe e prévia iguais. O professor que saiu tem o período fechado no `encerrado_em`.
- **mesma conta:** o consumo feito em B não entra na foto de A.
- **sem uso e vigência:** o uso local não vira rastro nem reserva, e o provedor que estava fora da vigência na data da chamada não casa.
- Casos de borda do domínio que esta regra toca:
  - professor com dois vínculos, um encerrado e um aberto (virada de ano letivo, ou duas disciplinas na mesma turma);
  - chave encerrada e cadastrada de novo;
  - titular sem data de entrada;
  - chamadas anteriores à entrada.
- Permissão: o `GET`/`POST pedidos` é só da coordenação (já coberto na 11.0).
- Concorrência: nenhuma operação nova. A foto é calculada dentro da mesma transação do `insert … on conflict` que a 11.0 já testa em paralelo.

**Cobertos:** todos os seis da tabela da tarefa, em `apps/api/test/compartilhamento.int.test.ts`. Conferi as mutações declaradas uma a uma contra as asserções e as que estão na tabela ficariam vermelhas.

O vazamento de `id`/`alcance` no `GET suboperadores` também está guardado. `apps/api/test/suboperador.int.test.ts:444` confere as chaves exatas da resposta, e o service monta o DTO campo a campo.

Nenhum teste usa provedor de IA: o consumo é inserido à mão. Não há `.skip` nem mock nosso.

**Bloqueantes:**

1. **O lado do `fim` na vigência do rastro e o caso da chave cadastrada de novo não têm teste** (`packages/nucleo/src/titular/compartilhamento.ts:211` e `:178`).
   - O "sem uso e vigência" só prova o lado do `inicio`.
   - Se `&& (suboperador.fim === null || em < suboperador.fim)` virar `true`, nada fica vermelho. A mesma coisa vale para a chave do grupo virar só `${provedor}`.
   - A divergência declarada ("o mesmo `provedor` que casa com dois suboperadores rende duas linhas") fica sem prova. E o índice único só vale onde `fim is null`, então o recadastro acontece de verdade.
   - **Correção:** criar a chave X encerrada há 3 meses e outro suboperador com a mesma chave X, vigente desde então, com uma chamada antes e outra depois. Esperar duas linhas `rastro`, com `suboperadorId` diferentes e as datas de cada grupo. Incluir também uma chamada depois do `fim` da ligação, sem empresa vigente na data, que deve dar `suboperadorId: null`.
   - Corrigir a linha `#linhasDoRastro › #vigenteEm` da tabela de Mutações para nomear os dois lados.

2. **Professor com dois vínculos, um encerrado e um aberto, não tem teste** (`compartilhamento.ts:124`, `:131`, `:150`).
   - No D64 cada professor tem um vínculo só.
   - Se `abertos > 0 ||` for tirado, nada fica vermelho, e a foto do professor que passou da virada de ano fecharia no `encerrado_em` do ano anterior. Isso esconderia o compartilhamento do ano corrente.
   - `min(criado_em)` trocado por `max` também passa.
   - **Correção:** um professor com um vínculo encerrado (disciplina A, criado há 10 meses e encerrado há 4) e outro aberto (disciplina B, criado há 3 meses). Esperar `primeiroEm` igual ao `criado_em` mais antigo, recortado na vigência, e `ultimoEm` igual ao fim do dia, e não ao `encerrado_em`.

3. **"Sem data de entrada, o período começa no horizonte" não tem teste** (`compartilhamento.ts:122` e `:130`).
   - A regra está na `techspec.md` §5: "O aluno sem nenhuma das duas datas não tem período anterior ao rastro".
   - Nos testes em que o aluno não tem credencial ("sem uso e vigência" e "mesma conta"), a hospedagem começa há 360 dias, depois do horizonte de 12 meses. Por isso `entrada ?? new Date(0)` passa verde.
   - **Correção:** chamar `Compartilhamento` direto, com relógio fixo, para um aluno sem credencial nem conta externa e uma hospedagem `todas` vigente há 3 anos. Esperar `primeiroEm` igual a `agora - 12 meses` e nenhuma linha de `lista`.

4. **Um grupo do rastro que fica todo antes da entrada é descartado sem linha em Mutações e sem teste** (`compartilhamento.ts:192`, `if (primeiroEm > ultimoEm) continue`).
   - Se a condição for tirada, nada fica vermelho, e a foto ganharia uma linha com `primeiroEm` maior que `ultimoEm`. O `esquemaLinhaDoCompartilhamento` não recusa isso.
   - **Correção:** no "com e sem provedor", acrescentar um provedor Z com chamadas só antes da `entrada` e esperar que não haja linha `rastro` de Z. Acrescentar também a linha na tabela de Mutações.

**Recomendações:**
- `apps/api/test/compartilhamento.int.test.ts:330`: o laço `for (const linha of … compartilhamento) expect(linha.ultimoEm).toBe(encerradoEm…)` percorre a foto inteira. Se sobrar no banco acumulado um `todas` de execução interrompida, com `fim` entre `criadoEm` e `encerradoEm`, o teste fica vermelho sem motivo. Pela regra 40, filtre pelas chaves do teste (`doTeste`), como nas outras asserções.
- D64 (`:313` e `:314`): os dois `POST` dependem do fim do dia de São Paulo. Se a meia-noite cair entre eles, o `toEqual` falha. É raro, mas dá para fixar com relógio injetado ou anotar.
- Declarar como equivalentes, na seção "Equivalentes declarados":
  - `periodo.entradaConhecida &&` (`:85`), redundante enquanto `inicio = horizonte`;
  - `maisCedo(grupo.ultimoEm, periodo.fim)` (`:191`), sem efeito no aluno, cujo fim é sempre o fim do dia.
- Aluno transferido: o fim do período do aluno é sempre hoje (`:122`). A spec não fala da saída do aluno. Registrar para o `/validar` se isso é intencional, já que o dado continua vivo na hospedagem até ser eliminado.
- "Pedido de eliminação concluído ainda devolve o provedor" e "foto refeita antes de anonimizar" ficaram para a 15.0, como registrado em `cenarios.md`. Confirmar lá.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/compartilhamento.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/12_task.md`

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-09 22:36:18 · `tasks/prd-lgpd-e-titular/12_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff não toca `Nota`, correção nem lançamento. Todos com autor humano? Não se aplica: nenhum caminho novo.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhuma saída de IA é criada ou alterada. A foto do compartilhamento é um cálculo fixo, sem modelo, e nasce dentro do `POST pedidos`, que a coordenação faz e que grava `pedido.registrado` na mesma transação (`apps/api/src/privacidade/privacidade.service.ts:188-190`).
Supervisão do tutor: ok, sem mudança. O rastro do aluno só lê `consumo_ia` (provedor e data) para responder ao art. 18, VII. Não abre conteúdo de conversa e não cria uma janela sobre o comportamento do aluno.
Autonomia declarada e visível: sim, sem mudança. Nenhum agente nem nível foi tocado.

**Item 9 (D64, regra 70 itens 8 e 9), o centro desta tarefa para mim, está cumprido no código e no teste.**
- **Sem rastro para o professor.** O professor nunca tem rastro (`packages/nucleo/src/titular/compartilhamento.ts:80`, `alvo.papel === 'aluno' ? … : []`). A reserva por período entra sempre para ele (`:84`). Assim a foto de quem usou o Assistente com provedor externo é igual à de quem não usou.
- **O período vem do vínculo, não do uso.** O começo e o fim saem de `criado_em` e `encerrado_em`, e o vínculo aberto vai até o fim do dia de uso. Nada no cálculo depende de uso.
- **O teste prova a igualdade.** O D64 (`apps/api/test/compartilhamento.int.test.ts:293-331`) compara com `toEqual` a foto, o detalhe inteiro sem o id e a prévia dos dois professores. A mutação do gatilho `alvo.papel === 'professor'` está declarada como vermelha nesse cenário.
- **Sem ranking nem métrica nova.** Nada liga o dado a uma decisão sobre o professor. A conversa do professor com o chat não é lida: só `consumo_ia` do aluno, e as execuções que o próprio aluno pediu.

**Exposição de `id` e `alcance`.** `SuboperadorLidoPelaEscola` passou a levar os dois campos (`packages/nucleo/src/titular/suboperador-da-escola.repository.ts:19-20`). Isso é tema do privacy-guardian, mas confirmo que o test-engineer achou a proteção do DTO em `apps/api/test/suboperador.int.test.ts:444`.

`docs/regulacao.md` não mudou nesta tarefa, e nada no diff contradiz o que está nele.

Bloqueantes: nenhum.

Recomendações:
- O D64 tem um vínculo só por professor. Um caso com dois vínculos, um encerrado e um aberto (é o bloqueante 2 do test-engineer), mostraria também que a foto do professor que passou da virada de ano continua igual à de um colega com os mesmos vínculos que não usou a IA. Vale levar isso para a correção que o test-engineer já exigiu.
- O `toEqual` do D64 depende do fim do dia de São Paulo nos dois `POST` (`compartilhamento.int.test.ts:313-314`). Se a meia-noite cair entre os dois, o teste da regra 70 falha sem motivo. Melhor fixar com relógio injetado, como o test-engineer recomendou.
- Para o `/validar`: a foto do aluno revela à coordenação o primeiro e o último uso de cada provedor externo, e isso inclui o tutor. É dado do art. 18, VII, mostrado só dentro do pedido do titular e já auditado. Convém dizer isso na tela do detalhe (tarefa de tela) como "por onde o dado passou", e não como "quando o aluno usou", para não parecer acompanhamento de uso.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/suboperador-da-escola.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/compartilhamento.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/12_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-09 22:36:23 · `tasks/prd-lgpd-e-titular/12_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma migration nesta tarefa. A coluna `pedido_titular.compartilhamento` já existia (11.0), e só o comentário do schema mudou. As tabelas que a foto lê (`consumo_ia`, `execucao_agente`, `credencial_matricula`, `conta_externa`, `vinculo`) têm `escola_id`. Cada uma tem a FK composta `(escola_id, …)` para `usuario(escola_id, id)` ou para `execucao_agente(escola_id, id)`. As cinco FKs estão no schema e nas migrations 0010, 0011, 0012 e 0022. `suboperador` é global e só é lido pelo `SuboperadorDaEscolaRepository`. Os ids são UUID.

Queries verificadas:
- `packages/nucleo/src/titular/compartilhamento.ts`:
  - `#rastroDoAluno` filtra `consumo_ia.escola_id` e a subquery de `execucao_agente.escola_id`, as duas pela escola de `exigirEscolaDoContexto()`.
  - `#periodoDoTitular`, `#entradaDoAluno` e `#entradaDoProfessor` usam SQL cru com `escola_id = ${escolaId}`, também vindo do contexto.
  - `#datasDeReferencia` usa `RetencaoDaEscolaRepository.ajustes()`, que tem escopo no contexto.
  - Os suboperadores vêm só do `SuboperadorDaEscolaRepository.daEscola()`, cujo escopo é `todas` ou a ligação correlacionada com a escola do contexto.
- `apps/api/src/privacidade/privacidade.service.ts:188`: o `titularId` passa antes pelo `#titularAlvo`, que tem escopo (11.0) e devolve `NAO_ENCONTRADO` para titular de outra escola. Nenhum `escolaId` vem do corpo nem da query, e não há endpoint novo.
- `packages/nucleo/src/titular/suboperador-da-escola.repository.ts`: entram `id` e `alcance` na leitura interna. O `GET suboperadores` (`privacidade.service.ts:84-92`) monta o DTO campo a campo e não expõe nenhum dos dois. `apps/api/test/suboperador.int.test.ts:444` confere as chaves exatas da resposta.
- A foto não revela nada de outra escola. O `suboperadorId` só sai para suboperador `todas` ou ligado à escola A. A chave "não cadastrado" vem do próprio `consumo_ia` de A.
- Sem `@SemEscopo()`. Sem consulta da camada de rede.

Teste de isolamento: presente e efetivo, em `apps/api/test/compartilhamento.int.test.ts`.
- No cenário "escopo", tirar a cláusula de escopo do `daEscola()` (o `exists` correlacionado) faz o suboperador de B casar no rastro de A, com `suboperadorId` diferente de `null`, e aparecer na reserva. O teste fica vermelho.
- O "mesma conta" cobre o consumo do mesmo aluno feito em B.
- Os filtros `escola_id` do rastro estão declarados como equivalentes. É correto: as FKs compostas impedem que uma linha de outra escola aponte para o titular de A.

Bloqueantes: nenhum.

Recomendações:
- `packages/nucleo/src/titular/compartilhamento.ts:123-126` e `:139-143`: o SQL cru repete à mão o escopo de `vinculo`, `credencial_matricula` e `conta_externa`. Se essas leituras passarem para métodos dos repositórios de cada tabela, ou para o builder do drizzle, o escopo fica no mesmo lugar que o resto do módulo, e uma alteração futura no texto não esquece o `escola_id`.
- `apps/api/src/privacidade/privacidade.service.ts:188`: a foto é calculada antes do `insert … on conflict`. Quando a chave colide, a consulta roda à toa. Isso não afeta o isolamento, mas a foto pode ir para depois de saber que o pedido é novo, desde que continue na mesma transação.
- `compartilhamento.ts:160-166`: a defesa por `escola_id` no rastro só é provada pelas FKs. Um comentário na linha apontando as FKs evita que alguém a remova achando que é redundante.

## llm-integrator · 1ª rodada · APROVADO · 2026-10-09 22:37:21 · `tasks/prd-lgpd-e-titular/12_task.md`

VEREDITO: APROVADO

Este veredito cobre só a regra 30. O `test-engineer` reprovou a rodada 1 e os bloqueantes dele seguem abertos (ver Recomendações); eles seguram o commit independentemente deste veredito.

Perfis usados: nenhum. A tarefa não cria chamada de modelo, tarefa de IA, prompt nem agente. `Compartilhamento` é SQL puro sobre `consumo_ia`, `execucao_agente`, `credencial_matricula`, `conta_externa`, `vinculo` e `suboperador`.

Custo estimado por professor/mês: zero chamadas e R$ 0, sem tokens. O custo é uma ida ao banco a cada `POST /v1/privacidade/pedidos`, um evento raro da coordenação. Nada entra na planilha de precificação.

Prompt versionado: não se aplica (nenhum prompt novo).
Validação de schema: não se aplica a saída de modelo. A foto é tipada por `LinhaDoCompartilhamento` / `Compartilhamento` (`packages/shared/src/privacidade/titular.ts`) e a coluna `compartilhamento` é jsonb tipado.
Aprovação humana no caminho: não se aplica. A foto é leitura de registro, não saída de agente, e o pedido nasce `recebido` por ação da coordenação.

Bloqueantes: nenhum, no escopo da regra 30.

O que conferi:
- **SDK de provedor:** nenhum SDK entra fora do adaptador. O `grep` por `openai`, `@anthropic` e `@google/` não achou import nos pacotes.
- **Origem do `provedor`:** `compartilhamento.ts` não toca a camada de IA, só lê `consumo_ia`. O `provedor` é o `IA_PROVEDOR_ID`, gravado em `apps/api/src/ia/consumo.repository.ts:29`, e é a `chave` do suboperador (`schema/suboperador.ts:14`). O casamento `provedor` ↔ `chave` está coerente com a 7.0.
- **Chamada sem envio externo:** a regra fixa do Tutor grava `envioExterno: false` e `provedorId: null` (`tutor.service.ts:354`), e o filtro `envioExterno = true` a deixa fora da foto. A chamada que falhou depois de sair continua `envioExterno = true`, e é correto que entre.
- **Lacuna de atribuição:** `relatorio_da_correcao` e `resumo_do_analista` levam só números da turma, sem aluno nem resposta na entrada (`relatorio-da-correcao.ts:12-14`; o schema do resumo diz o mesmo). Atribuir por `aluno_id` e pela execução pedida pelo aluno cobre tudo o que sai com dado dele, e o check `consumo_ia_aluno_so_no_tutor` é coerente com isso.
- **Testes sem provedor pago:** `compartilhamento.int.test.ts` insere `consumo_ia` à mão com modelo `modelo-falso`, sem `.skip` e sem provedor pago (regra 30, item 3).
- **Registro da execução:** a regra 30, item 4, fica intacta. A tarefa só lê `consumo_ia`, não cria nem altera a escrita.
- **Parse de data:** o `dataDoBanco` converte os `timestamptz` do `execute` cru, e o `new Date()` aceita `+00` e `-03` sem minutos, que é o formato do pg.

Recomendações:
- **Bloqueantes abertos do `test-engineer`, que confirmei lendo `apps/api/test/compartilhamento.int.test.ts`:**
  1. A chave recadastrada, o lado do `fim` em `#vigenteEm` e o grupo `provedor/suboperador` não têm teste.
  2. O professor com um vínculo encerrado e outro aberto não tem teste.
  3. "Sem data de entrada, o período começa no horizonte" não tem teste.
  4. O grupo do rastro todo antes da entrada, descartado por `primeiroEm > ultimoEm` (`compartilhamento.ts:192`), não tem teste nem linha em Mutações.

  A divergência 6 da tarefa promete "duas linhas" sem prova. Essas quatro correções são pré-condição do commit.
- **Decisão de produto no descarte do item 4.** Uma chamada realmente atribuída ao aluno que cai toda antes da `entrada` some da foto. Ela prova que o dado saiu, e a LGPD, art. 18, VII, pede a empresa. Se a `entrada` vier errada ou tardia, a foto subnotifica. Vale decidir entre recortar as duas datas na entrada e manter a linha, ou descartar de propósito. Se descartar, o teste que o `test-engineer` pede fixa a escolha.
- **Índice em `consumo_ia`.** `#rastroDoAluno` filtra `execucao_id in (subconsulta)` com `OR aluno_id = …`, e `consumo_ia` não tem índice por `(escola_id, execucao_id)`. O `infra-guardian` já adiou esse índice para a 13.0 (`11_task.md:180`), com o argumento de que a prévia é rara. O `POST pedidos` agora usa a mesma consulta dentro de uma transação de request, e essa tabela cresce por troca de Tutor. Garantir que o índice nasça na 13.0 com `CREATE INDEX CONCURRENTLY`, antes de haver volume real. O `statement_timeout` de 2 s protege, mas vira erro para a coordenação.
- **Erro cru.** `compartilhamento.ts:109` lança `Error` simples para a invariante das datas de referência. É invariante interna e não chega ao cliente, mas a regra 00, item 9, prefere erro tipado.
- **Cálculo sem uso.** Na repetição idempotente do `POST` (mesma chave de envio), a foto é calculada antes do `insert … on conflict do nothing` e descartada. É custo sem efeito, não bug.

Arquivos auditados, todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/`:
- `packages/nucleo/src/titular/compartilhamento.ts`
- `packages/nucleo/src/titular/suboperador-da-escola.repository.ts`
- `apps/api/src/privacidade/privacidade.service.ts`
- `apps/api/src/privacidade/pedidos.repository.ts`
- `apps/api/test/compartilhamento.int.test.ts`
- `packages/nucleo/src/db/schema/consumo-ia.ts`
- `apps/api/src/ia/consumo.repository.ts`

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-09 22:37:27 · `tasks/prd-lgpd-e-titular/12_task.md`

VEREDITO: REPROVADO

O código está certo. Não encontrei vazamento, nem log com dado, nem dado fora do escopo da escola. A reprovação é porque faltam testes para três caminhos que, quebrados, apagariam empresas da lista de compartilhamento entregue ao titular, sem nenhum teste ficar vermelho. A regra 20, item 19, e a LGPD, art. 18, VII, ficam então sem prova.

**Campos pessoais tocados:** `pedido_titular.compartilhamento`, a foto já prevista na linha "Pedido do titular" de `docs/lgpd.md`. Ela guarda o `suboperadorId`, a `chave` e as datas, sem nenhuma pessoa. A foto é calculada a partir de `consumo_ia` (`aluno_id`, `provedor`, `em`, `envio_externo`), `execucao_agente.solicitada_por`, `credencial_matricula.criada_em`, `conta_externa.ligada_em` e `vinculo.criado_em`/`encerrado_em`. Só os lê; não cria coluna.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. A tarefa não tem migration. O `id` e o `alcance` que entraram em `SuboperadorLidoPelaEscola` são do cadastro da empresa, não de pessoa.

**Autorização por objeto:** ok.
- O titular é resolvido por `#titularAlvo` na escola do token, como na 11.0.
- Todas as consultas cruas em `compartilhamento.ts` filtram por `exigirEscolaDoContexto()`.
- Os suboperadores vêm só do `SuboperadorDaEscolaRepository`.
- Os cenários "escopo" e "mesma conta" provam que nada de B entra na foto de A.
- O `GET suboperadores` continua montando a resposta campo a campo (`privacidade.service.ts:82-93`), e `suboperador.int.test.ts:444` confere as chaves exatas. O `id` e o `alcance` não escapam.

**Logs:** limpos. O `throw new Error` de `compartilhamento.ts:109` não leva dado.

**Auditoria:** presente. O registro grava `pedido.registrado` na mesma transação, e o detalhe continua auditado como `pedido.lido`. A foto não entra no corpo da auditoria, e não precisa.

**Envio externo:** nenhum novo. Conferi o caminho do dado. Só o Tutor leva `aluno_id` ao consumo (`provedor.ts:243`). As tarefas do professor (`relatorio-da-correcao`, `resumo-do-analista`, `adaptar-atividade`) não recebem aluno nem resposta de aluno. Então o rastro por `aluno_id` mais a execução pedida pelo aluno cobre tudo que sai dele.

**D64:** ok. O professor não tem rastro e sempre leva a reserva. O teste compara foto, detalhe e prévia de quem usou e de quem não usou com `toEqual`.

**Seed/fixture:** sintético ("Empresa sintética", "Aluno sintético da mesma conta", `hash-sintetico`, matrícula aleatória).

**Pergunta de fechamento:** o código responde "para onde foi". A foto é gravada no registro e sobrevive ao expurgo. Os furos abaixo são de prova, não de código.

**Bloqueantes:**

1. **Professor com um vínculo encerrado e outro aberto (a virada de ano letivo) não tem teste.**
   - Onde: `packages/nucleo/src/titular/compartilhamento.ts:131` (`abertos > 0 || encerrado === null ? fimDoDia : encerrado`) e `:150` (`min(criado_em)`).
   - O risco: é o caso de todo professor veterano depois de janeiro. Sem o `abertos > 0`, a foto fecha no `encerrado_em` do ano anterior e tira dela as empresas do ano corrente. Hoje nenhum teste fica vermelho com isso.
   - Correção exigida: um professor com um vínculo encerrado (criado há 10 meses, encerrado há 4) e outro aberto (criado há 3 meses). O teste espera `primeiroEm` no `criado_em` mais antigo, recortado na vigência, e `ultimoEm` no fim do dia, e não no `encerrado_em`.
   - É o mesmo que o bloqueante 2 do `test-engineer`; uma correção atende os dois.

2. **A empresa recadastrada e o lado do `fim` na vigência do rastro não têm teste.**
   - Onde: `compartilhamento.ts:211` (`suboperador.fim === null || em < suboperador.fim`) e `:178` (a chave do grupo, `${provedor}/${casa?.id}`).
   - O risco: com a chave do grupo virando só `${provedor}`, duas empresas que usaram a mesma chave em épocas diferentes viram uma linha, e uma delas some da lista. Sem o lado do `fim`, a chamada feita depois de a empresa sair é atribuída a ela, em vez de "provedor não cadastrado". Nos dois casos a escola informa ao titular uma lista errada, e a resposta errada cai do lado que esconde empresa.
   - Correção exigida: uma chave X encerrada há 3 meses e outro suboperador com a mesma X vigente desde então, com uma chamada antes e outra depois. O teste espera duas linhas `rastro` com `suboperadorId` diferentes. Acrescentar uma chamada depois do `fim` da ligação, sem empresa vigente, com `suboperadorId: null`.
   - É o mesmo que o bloqueante 1 do `test-engineer`.

Os bloqueantes 3 e 4 do `test-engineer` (titular sem data de entrada e grupo do rastro todo antes da entrada) erram para o lado de mostrar mais empresas, não de esconder. Não os repito como veto de privacidade.

**Recomendações:**
- A foto guarda, para 5 anos, a primeira e a última data de envio externo de cada aluno, numa linha ligada ao `titularId`. A linha "Pedido do titular" de `docs/lgpd.md:101` cobre "a foto", mas não diz que ela guarda datas de uso. Vale escrever isso, porque essas datas ficam além dos 12 meses de `consumo_por_aluno`.
- Para a 15.0: `apagarCredencialDaMatricula` e `apagarContaExterna` (`packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.ts:168-182`) apagam as datas de entrada do aluno. A foto precisa ser refeita antes delas, senão o período do aluno some e a reserva encolhe.
- Aluno transferido ou desativado: o fim do período dele é sempre hoje (`compartilhamento.ts:122`). Isso mostra empresas a mais, não a menos, então é aceitável. Vale registrar para o `/validar`.
- Filtrar pelas chaves do teste (`doTeste`) o laço de `compartilhamento.int.test.ts:330`, como o `test-engineer` recomenda. Hoje ele pode ficar vermelho no banco acumulado, sem motivo.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/suboperador-da-escola.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/titular.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/compartilhamento.int.test.ts

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-09 22:38:12 · `tasks/prd-lgpd-e-titular/12_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência na §5: o "fim do dia de uso (São Paulo)" que a própria tarefa gravou na techspec não é o que o código calcula. As seis divergências da tabela estão na `techspec.md` §5.
Portão local: carimbo válido

Bloqueantes:

1. **O "fim do dia" sai 6 horas adiantado e pode apagar linha de rastro de hoje.** Está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.ts:105`.
   - A expressão é `((${diaDeUso(agora)}::date + 1) at time zone ${FUSO_DO_USO})::timestamptz`. Ela aplica o `at time zone` a um `date`, e o Postgres converte esse `date` em `timestamptz` pelo fuso da sessão.
   - Rodei no `educa-teste-postgres-1` com o dia `2026-10-09`:
     - sessão em UTC, que é o fuso do banco (`Etc/UTC`): `2026-10-09 20:59:59.999Z`, ou seja, 17:59 em São Paulo e não 23:59;
     - sessão em `America/Sao_Paulo`: `2026-10-10 02:59:59.999Z`, o valor certo;
     - sessão em `Asia/Tokyo`: `2026-10-09 02:59:59.999Z`.
   - Efeito: o `periodo.fim` fica antes do `agora`. O aluno que fez a primeira chamada externa a um provedor hoje depois das 18h tem o grupo descartado em `:192` (`primeiroEm > ultimoEm`), e a foto omite uma empresa que recebeu o dado. A fórmula também quebra a premissa da divergência declarada ("o fim é o fim do dia de uso"), e o resultado muda conforme o fuso da sessão.
   - **Correção:** usar o padrão que o projeto já tem, `((dia)::date + 1)::timestamp at time zone ${FUSO_DO_USO}` (está em `apps/api/src/governanca/governanca.repository.ts:162` e `apps/api/src/tutor/tutor.repository.ts:405`).
   - **Teste:** uma chamada com `em` hoje depois das 21h UTC, com relógio injetado, que precisa aparecer no rastro.

2. **Regra 00, item 3: o `Compartilhamento` faz consulta ao banco e não é repository.** Está em `compartilhamento.ts:100-168`.
   - `#datasDeReferencia`, `#periodoDoTitular`, `#entradaDoAluno`, `#entradaDoProfessor` e `#rastroDoAluno` consultam direto, com `this.banco.execute` e `this.banco.select`, as tabelas `vinculo`, `credencial_matricula`, `conta_externa`, `consumo_ia` e `execucao_agente`.
   - É o único arquivo de `packages/nucleo/src` fora de `*.repository.ts` que consulta o banco. Abre um segundo jeito de aplicar o escopo de tenant e mistura a regra (gatilho da reserva, interseção, agrupamento) com SQL.
   - **Correção:** levar as consultas para um repository em `packages/nucleo/src/titular/` (por exemplo `compartilhamento.repository.ts`), com o escopo pelo `exigirEscolaDoContexto`. O `Compartilhamento` fica só com a regra, e essa regra passa a ser testável em unidade.

3. **Regras 80, item 8, e 00, item 4: a consulta do rastro varre todo o `consumo_ia` da escola dentro do `POST pedidos`.** Está em `compartilhamento.ts:166`.
   - O `or(eq(consumoIa.alunoId, …), inArray(consumoIa.execucaoId, <subconsulta>))` não aproveita índice: não existe índice em `consumo_ia (escola_id, execucao_id)`, e o `in (subconsulta)` dentro de um `or` vira filtro sobre cada linha.
   - Na prática, o Postgres percorre todo o consumo da escola e filtra `envio_externo` linha a linha, dentro da transação do pedido. Numa escola de 900 alunos com o pacote do Tutor (D38) isso são centenas de milhares de linhas por mês.
   - O `infra-guardian` não está marcado nesta tarefa, então ninguém mais olha isso.
   - **Correção:** separar em `union all` de dois ramos indexados:
     - o de `aluno_id`, que usa o `consumo_ia_aluno_idx`;
     - o da execução, por junção com `execucao_agente` pelo `execucao_agente_solicitada_por_idx` e um índice novo `consumo_ia (escola_id, execucao_id) where execucao_id is not null`, criado em migration que só expande.
   - De preferência, agregar no SQL (por `provedor` e dia, por exemplo) em vez de trazer cada chamada para a memória.
   - Registrar o índice na `techspec.md` e pedir à Mesa que marque o `infra-guardian`.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:225` ainda diz "com a foto do compartilhamento vazia (a 12.0 a preenche)". Atualizar.
- `compartilhamento.ts:102`: o `?? { meses: 12 }` nunca é usado, porque `retencaoDaEscola` sempre devolve todas as categorias, e ainda repete um número mágico do catálogo. Trocar por erro explícito ou tirar.
- Um suboperador `todas` que também aparece no rastro gera duas linhas da mesma empresa, uma `rastro` e outra `periodo`. Vale dizer na §5 se isso é intencional.
- O fim do período do aluno é sempre hoje (`:122`), mesmo para o aluno transferido ou desativado. A spec não trata da saída do aluno; levar ao `/validar`.
- O `doTitular` roda também no reenvio pela mesma chave (`privacidade.service.ts:188`), e o resultado é jogado fora. Dá para calcular só quando o `insert` gravar.
- No `12_task.md` estão marcados "Commit feito" e "`test-engineer` aprovado", e nenhum dos dois é verdade ainda: a 1ª rodada do `test-engineer` reprovou com quatro bloqueantes, em `tasks/prd-lgpd-e-titular/achados/12_task.md`. Eles continuam valendo e não repito aqui.

## test-engineer · 2ª rodada · APROVADO · 2026-10-09 23:04:25 · `tasks/prd-lgpd-e-titular/12_task.md`

VEREDITO: APROVADO

Cenários exigidos: os quatro que a 1ª rodada pediu, mais o que a ordem da Mesa (r1) acrescentou: a vigência do rastro dos dois lados com a chave cadastrada de novo; o professor com um vínculo encerrado e outro aberto; o aluno sem data de entrada; o grupo do rastro que fica todo antes da entrada; o fim do dia no fuso de São Paulo; a separação entre a regra e o repository, com a escola lida do contexto.

Cobertos:
1. **Chave cadastrada de novo** (`apps/api/test/compartilhamento.int.test.ts:253`). A mesma chave X está em duas empresas: a antiga, encerrada pelo `fim` do suboperador, e a nova, encerrada pelo `fim` da ligação. São três chamadas, e o teste espera três linhas `rastro`: a da antiga, a da nova e uma com `suboperadorId: null`. Conferi as mutações contra o código:
   - Sem a condição `em < suboperador.fim`, as linhas caem para 1 ou 2, e o teste fica vermelho.
   - Com a chave do grupo só `${provedor}`, os grupos se juntam, e ele também fica vermelho.
   - A tabela de Mutações nomeia os dois lados (linhas 100 e 101).
2. **Professor com dois vínculos** (`:371`). O `primeiroEm` é o `criado_em` mais antigo, então trocar `min` por `max` deixa o teste vermelho. O `ultimoEm` não é o `encerrado_em` e cai depois de `ha(MES)`, então tirar `abertos > 0 ||` também o deixa vermelho. O professor da bancada não tem vínculo próprio: o teste do D64 com o professor que saiu confirma isso.
3. **Sem data de entrada** (`:484`). Chama o `Compartilhamento` direto, com relógio fixo. Espera `primeiroEm` igual a `2025-03-10T15:00Z` e só a hospedagem, sem nenhuma linha de `lista`. Com `entrada ?? new Date(0)`, o resultado viraria `2023-03-01`, e o teste fica vermelho.
4. **Grupo do rastro todo antes da entrada** (`:233-239`). O provedor Z tem chamadas em `ha(5)` e `ha(4)`, e a entrada é `ha(3)`. Sem o filtro `primeiroEm > ultimoEm`, sairia uma linha de Z, e o `toEqual([])` fica vermelho. A linha está na tabela de Mutações (102).
5. **Fim do dia** (`:460`). O relógio está em 23h30 UTC, que ainda é dia 10 em São Paulo. A chamada das 22h00 UTC entra no rastro, e a hospedagem termina em `2026-03-11T02:59:59.999Z`. A expressão antiga perde a chamada nesse caso.
6. **Arquitetura** (`apps/api/test/arquitetura.test.ts:467`). O `compartilhamento.ts` não consulta o banco, e o repository exige `exigirEscolaDoContexto()` sem receber `escolaId` por parâmetro. As expressões regulares não pegam por engano o `eq(consumoIa.escolaId, escolaId)`.
7. **Recomendações da 1ª rodada aplicadas.** O laço do D64 agora filtra por `doTeste` e falha se a filtragem não deixar nenhuma linha. Os equivalentes `periodo.entradaConhecida &&` e `maisCedo(grupo.ultimoEm, periodo.fim)` estão declarados. A janela de meia-noite do D64 está registrada.
8. **Refatoração.** As consultas mudaram de lugar sem mudar de conteúdo. O `?? { meses: 12 }` virou uma invariante que lança erro. Não há `.skip`, `.only` nem mock da regra. Não há chamada a provedor de IA.

Bloqueantes: nenhum.

Recomendações:
- **`compartilhamento.int.test.ts:460`, fim do dia.** O teste só pega a expressão antiga se a sessão do banco estiver em UTC. Esse é o padrão do Postgres em container e da esteira. Mas, numa sessão em `America/Sao_Paulo`, a expressão antiga dá o valor certo e o teste ficaria verde mesmo com ela. Vale prender o fuso da sessão no teste, ou declarar isso na linha de Mutações.
- **`compartilhamento.int.test.ts:136-137`, dois vínculos.** O `ultimoEm` é conferido como "depois de `ha(MES)`" e não como igual ao fim do dia de `agora`. A ordem da Mesa aceitou essa forma, e ela pega a mutação. Com relógio injetado, como nos testes de `:460` e `:484`, a asserção poderia ser exata.
- **`compartilhamento.int.test.ts:484`, sem data de entrada.** O teste supõe que `bancada.sessoes` cria o aluno sem credencial e sem conta externa. Uma pré-condição explícita, com contagem zero em `credencial_matricula` e `conta_externa` para o aluno, impediria que uma mudança na bancada deixasse o cenário inválido sem ninguém perceber.

Arquivos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/compartilhamento.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/arquitetura.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/12_task.md` (Mutações, linhas 84 a 133)

## llm-integrator · 2ª rodada · APROVADO · 2026-10-09 23:05:20 · `tasks/prd-lgpd-e-titular/12_task.md`

VEREDITO: APROVADO

Perfis usados: nenhum. A tarefa não faz chamada de modelo. `Compartilhamento` e `CompartilhamentoRepository` só leem `consumo_ia`, `execucao_agente`, `vinculo`, `credencial_matricula` e `conta_externa`.

Custo estimado por professor/mês: R$ 0. Não há chamada de modelo, só consulta ao banco quando o pedido do titular é registrado.

Prompt versionado: não se aplica (não há prompt).

Validação de schema: não se aplica para saída de modelo. A foto continua saindo no formato do `esquemaCompartilhamento` do contrato.

Aprovação humana no caminho: não se aplica. A foto é registro de dado, e não entrega de agente.

Bloqueantes: nenhum.

O que conferi na regra 30 no diff entre a rodada anterior e esta:
- **Nenhum SDK ou provedor fora de `apps/api/src/ia/adapters`.** `compartilhamento.ts` e `compartilhamento.repository.ts` não importam adaptador, gateway nem porta de IA, e não há `fetch`.
- **Nenhum teste chama provedor pago.** `compartilhamento.int.test.ts` grava `consumo_ia` por `insert` direto (linha 128), com `origem` `'openai_compat'` ou `'falso'` como texto. Só o `Compartilhamento` é executado, e com relógio injetado.
- **A origem do `provedor` está intacta.** O schema `consumo-ia.ts` não aparece entre os arquivos alterados. O check `consumo_ia_provedor_so_no_envio_externo` segue valendo, e o repository só lê a coluna (`consumoIa.provedor`) e filtra por `envioExterno = true`.
- **O que mudou não afeta a regra 30.** A mudança é uma extração de consultas para o repository, mais o fim do dia, o `meses` vindo do catálogo de retenção e casos de teste novos. A invariante nova lança `Error` quando falta `consumo_por_aluno` no catálogo, o que é aceitável (ramo inalcançável, já decidido na rodada anterior).

Recomendações:
- O índice `consumo_ia (escola_id, execucao_id)` fica para a 13.0, já registrado em `techspec.md` §5 e em `13_task.md` (13.1). Sem mudança nesta rodada.
- O teste de arquitetura `compartilhamento.ts não consulta o banco` poderia incluir `postgres`/`pg` no padrão de import. Não bloqueia.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-09 23:05:25 · `tasks/prd-lgpd-e-titular/12_task.md`

VEREDITO: APROVADO

Tabelas verificadas: não há tabela nova nesta rodada. As consultas usam `vinculo`, `credencial_matricula`, `conta_externa`, `consumo_ia` e `execucao_agente`, todas com `escola_id`. As três primeiras também têm FK composta `(escola_id, usuario_id)` para `usuario`: `vinculo_usuario_da_escola_fk`, `credencial_matricula_usuario_da_escola_fk` e `conta_externa_usuario_da_escola_fk`.

Queries verificadas: os seis métodos de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.repository.ts`, um por um.
- **`datasDeReferencia(agora, meses)`:** só faz conta de data, sem ler tabela, então não precisa de escopo. A expressão do fim do dia agora é `(((dia + 1)::timestamp at time zone FUSO) - 1ms)`, como a ordem pedia.
- **`vinculosDoProfessor`, `entradaDoAluno`, `entradaDoProfessor` e `rastroDoAluno`:** cada um chama `exigirEscolaDoContexto()` dentro do próprio corpo e filtra por `escola_id`. Nenhum recebe `escolaId` por parâmetro.
- **Mudança de lugar:** o SQL dos quatro é idêntico ao da 1ª rodada; só mudou o arquivo. O subselect de `execucao_agente` dentro de `rastroDoAluno` continua filtrado por escola.
- **Exportação:** `CompartilhamentoRepository` não sai em `packages/nucleo/src/index.ts`; o pacote exporta só `Compartilhamento` e `AlvoDoCompartilhamento`.
- **`compartilhamento.ts`:** não importa mais `drizzle-orm`, `db/schema/*` nem `FUSO_DO_USO`. O prazo de retenção vem de `RetencaoDaEscolaRepository.ajustes()`, que não mudou nesta rodada.
- **Correções exigidas:** as duas foram feitas. O SQL cru saiu de `compartilhamento.ts` para o repository, e o comentário sobre as FKs compostas está acima do filtro de `rastroDoAluno`.

Teste de isolamento: presente e efetivo.
- O caso `escopo:` continua igual à 1ª rodada. Ele fica vermelho se o filtro de escola sair do `SuboperadorDaEscolaRepository`.
- O caso `mesma conta:` usa um `usuario` diferente em cada escola, então hoje as FKs compostas já impedem o cruzamento. O filtro por `escola_id` no rastro e nas datas de entrada é a segunda camada, e isso já está declarado no comentário. Foi aceito assim na 1ª rodada e não mudou.
- Os dois casos novos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/arquitetura.test.ts` cobrem a forma: o repository precisa chamar `exigirEscolaDoContexto()`, e nenhum método pode receber `escolaId: string`.

Bloqueantes: nenhum.

Recomendações:
- `compartilhamento.repository.ts`: o comentário sobre as FKs compostas está só em `rastroDoAluno`. `vinculosDoProfessor`, `entradaDoAluno` e `entradaDoProfessor` estão na mesma situação: o filtro por `escola_id` é a segunda camada atrás de `*_usuario_da_escola_fk`. Uma linha no JSDoc da classe cobriria os quatro.
- `arquitetura.test.ts`: o regex `/\(\s*escolaId\s*[:,)]/` não pegaria um parâmetro com outro nome, como `escola: string`. Exigir que todo método público, exceto `datasDeReferencia`, chame `exigirEscolaDoContexto()` deixaria o teste mais forte.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-09 23:05:37 · `tasks/prd-lgpd-e-titular/12_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. O diff não toca `Nota`. Ele só muda a foto do compartilhamento do titular, que é uma leitura, mais testes e documentos. Todos com autor humano? Não se aplica: nenhum caminho novo grava em `Nota`.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhuma saída de IA nova chega ao aluno.
Supervisão do tutor: ok. O diff não toca o tutor.
Autonomia declarada e visível: sim. O diff não mexe nisso.

**Item 9 da regra 70 (D64), conferido depois da mudança:**
- **O professor continua sem rastro.** O rastro só é lido para aluno (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.ts:73`). Com a mudança, a consulta foi para `rastroDoAluno` em `compartilhamento.repository.ts`, que nenhum caminho de professor chama.
- **A reserva por período continua obrigatória para o professor.** O gatilho `alvo.papel === 'professor'` está em `compartilhamento.ts:77`. A foto dele depende só do período do vínculo e dos suboperadores da escola, e nunca de ele ter usado a IA.
- **Foto, detalhe e prévia dos dois professores continuam iguais.** A lógica de comparação do caso `D64` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/compartilhamento.int.test.ts:329`) não mudou. A única mudança no caso é o filtro pelo que o teste criou no laço do professor que saiu, que só tira dele o que o banco acumula de outras execuções.
- **A correção do fim do dia vale igual para os dois professores.** O fim do dia agora usa `::timestamp at time zone` (`compartilhamento.repository.ts`, `datasDeReferencia`). Os dois recebem o mesmo fim de dia, então a igualdade continua.
- **A janela de meia-noite está declarada em `12_task.md`** e fica às 03:00 UTC, que é o certo depois da correção.
- **As consultas foram para o repository com a escola tirada do contexto** (`exigirEscolaDoContexto()` em cada método), e nenhum método recebe `escolaId`. O caminho para ler dado de outra escola não abriu, e o teste novo em `arquitetura.test.ts` prova isso.

**As duas recomendações da 1ª rodada:**
- **Caso do D64 com dois vínculos: aplicado, em parte.** O caso novo `professor com dois vínculos` prova o início no `criado_em` mais antigo e que a foto vai até o fim do dia de hoje, e não até o `encerrado_em` do vínculo antigo. Ele não compara esse professor com um colega que não usou a IA. Não é falha: o rastro de professor é vazio por construção, e o caso D64 cobre essa linha em "Mutações".
- **Janela de meia-noite declarada: aplicada.** Está em "Equivalentes declarados" de `12_task.md`.

Bloqueantes: nenhum.

Recomendações:
- No caso `professor com dois vínculos`, acrescentar um colega com os mesmos dois vínculos e sem uso de IA, e um `consumo` pela execução do professor. Depois afirmar `toEqual` entre as duas fotos e `rastro` vazio. Isso fecha o D64 também para quem passou da virada de ano, em vez de deixá-lo implícito.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/12_task.md`, na seção "Mutações", corrigir a linha `› vinculosDoProfessor › o vínculo aberto segue até o fim do dia, o encerrado até o encerrado_em`. Ela atribui ao repository uma regra que está em `compartilhamento.ts` (`#periodoDoTitular`, linha 105). O repository só conta os vínculos abertos e devolve o `encerrado_em` mais recente.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-09 23:05:39 · `tasks/prd-lgpd-e-titular/12_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo nesta rodada. A foto `pedido_titular.compartilhamento` continua sem pessoa: tem só `suboperadorId`, `chave`, `primeiroEm`, `ultimoEm` e `origem`. O `CompartilhamentoRepository` só lê `credencial_matricula.criada_em`, `conta_externa.ligada_em`, `vinculo.criado_em` e `vinculo.encerrado_em`, `consumo_ia.provedor` e `consumo_ia.em`. Não lê nome, matrícula, conteúdo de conversa nem prompt.

Fora da tabela de dados do docs/lgpd.md: nada. A nota sobre as datas de envio externo guardadas por 5 anos na foto continua indo para a 15.0, como a ordem da Mesa registrou.

Autorização por objeto: ok.
- Os quatro métodos de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.repository.ts` que tocam dado da escola (`vinculosDoProfessor`, `entradaDoAluno`, `entradaDoProfessor`, `rastroDoAluno`) pegam a escola com `exigirEscolaDoContexto()`. Nenhum recebe `escolaId` por parâmetro. `datasDeReferencia` só faz conta de data e não lê dado de pessoa.
- `arquitetura.test.ts:467` trava isso: barra `escolaId` na assinatura e barra consulta ao banco em `compartilhamento.ts`.
- O repository não sai em `packages/nucleo/src/index.ts`.
- O caminho do `POST pedidos` não mudou. Os testes "mesma conta" e "escopo" continuam valendo.

Logs: limpos. Não há `logger` nem `console` em `compartilhamento.ts` nem em `compartilhamento.repository.ts`.

Auditoria: presente. `pedido.registrado` continua na mesma transação. Esta rodada não trouxe ação nova que peça auditoria.

Envio externo: nenhum envio novo. A tarefa só lê o rastro de `consumo_ia` com `envio_externo = true` para dizer à escola para onde o dado foi. Isso é justamente o que a lista de compartilhamento do art. 18, VII precisa.

Seed/fixture: sintético. As empresas, chaves, `hash-sintetico` e `DPA-TESTE` são inventados, e as datas são escritas à mão.

Conferi as correções exigidas na 1ª rodada:
1. **Professor com um vínculo encerrado e outro aberto: feito.** O teste "professor com dois vínculos" está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/compartilhamento.int.test.ts:370`.
   - Ele confirma que `primeiroEm` é o `criado_em` mais antigo. Se `min` virar `max`, fica vermelho.
   - Ele confirma que `ultimoEm` não é o `encerrado_em` e cai depois de `ha(MES)`. Se o `abertos > 0` sair de `compartilhamento.ts:105`, fica vermelho.
   - O helper ganhou o parâmetro `disciplinaId` sem quebrar as chamadas que já existiam.
2. **Chave recadastrada e o fim da vigência: feito.** O teste "chave recadastrada" está em `compartilhamento.int.test.ts:253`.
   - São três linhas `rastro` da mesma chave: uma do `velho`, uma do `novo` e uma com `suboperadorId: null` depois do `fimDaLigacao`.
   - O `daEscola` devolve o `novo` com `fim = maisCedo(fim do suboperador, fim da ligação)`. Por isso a chamada de `ha(MES)` cai em "não cadastrado".
   - Fica vermelho se `#vigenteEm` (`compartilhamento.ts:151`) perder o lado do `fim`, porque a linha `null` some. Fica vermelho também se a chave do grupo (`compartilhamento.ts:118`) perder o `casa?.id`, porque duas linhas viram uma.

Também entrou nesta rodada:
- **O fim do dia agora sai no horário de São Paulo** (`compartilhamento.repository.ts:232`, com `::timestamp at time zone`). Antes saía 6 horas adiantado em sessão UTC e a foto omitia uma empresa que tinha recebido dado. O teste "fim do dia" (`compartilhamento.int.test.ts:146`) prova o caso com datas fixas.
- Ganharam teste o caso "sem data de entrada" e o do grupo do rastro que cai todo antes da entrada.
- O laço do D64 agora filtra pelo `doTeste`.

Pergunta de fechamento: no registro do pedido o código já responde para onde o dado foi. Responde pelo rastro com o provedor, pela reserva por período quando o rastro não cobre, e pela hospedagem sempre. A 12.0 não precisa fechar mais do que isso. O que ainda depende da 15.0 é refazer a foto antes de apagar a credencial e a conta externa na eliminação, e está registrado na tabela "Sem aplicar".

Bloqueantes: nenhum.

Recomendações (já com destino, só reafirmo):
- Tarefa 15.0: refazer a foto antes de `apagarCredencialDaMatricula` e `apagarContaExterna`. Esses dois apagam as datas de entrada e, sem isso, a foto refeita perde o período.
- Tarefa 15.0: em `docs/lgpd.md`, na linha "Pedido do titular", dizer que a foto guarda por 5 anos a primeira e a última data de envio externo por empresa.
- `/validar` (RF13): o fim do período do aluno transferido ou desativado ainda é "hoje". Isso não esconde nenhuma empresa, mas alonga o período que a foto mostra.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-09 23:06:04 · `tasks/prd-lgpd-e-titular/12_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As seis divergências estão na `techspec.md` §5, no bloco "Tarefa 12.0, como ficou no código". O índice do rastro está registrado na §5 ("O índice do rastro") e na §7c ("Índices novos"), e as duas passagens dão a tarefa 13.0 como dona.

Portão local: carimbo válido. O `conferir` cobre typecheck, lint, segredo, dependências, unidade e alvo.

Bloqueantes: nenhum.

As três correções exigidas na 1ª rodada:

1. **Fim do dia: feito.** A expressão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.repository.ts:34` agora é `((dia)::date + 1)::timestamp at time zone ${FUSO_DO_USO}`, o padrão do projeto.
   - Conferi a conta do teste novo "fim do dia" (`apps/api/test/compartilhamento.int.test.ts`). Com relógio em `2026-03-10T23:30Z`, o fim do dia é `2026-03-11T02:59:59.999Z`, e a chamada das 22:00 UTC fica no rastro.
   - Com a fórmula antiga, o fim do dia sairia em `2026-03-10T20:59:59.999Z`, o grupo seria descartado e o teste ficaria vermelho.

2. **Regra 00, item 3: feito.** As cinco consultas foram para o `CompartilhamentoRepository`, e cada método lê a escola por `exigirEscolaDoContexto()`; nenhum a recebe por parâmetro.
   - O `compartilhamento.ts` ficou só com a regra. O `describe` novo em `apps/api/test/arquitetura.test.ts:467-485` trava isso.

3. **Índice e `union all`: não vale mais para esta tarefa.** A consulta como está é aceitável como estado intermediário até a 13.0, por quatro motivos:
   - **Não é decisão silenciosa.** A triagem está escrita na `techspec.md` §5, com o que falta, o que a 13.0 entrega (índice parcial, os dois ramos e o teste de plano, que cobre também o `texto_do_modelo` da prévia da 11.0) e o que não muda na foto. A §7c, a `tasks.md` 13.1 e a `13_task.md` repetem isso.
   - **A tarefa dona tem quem audite.** A 13.0 já tem migration própria, `infra-guardian` marcado e dependência declarada da 12.0.
   - **Nenhum ambiente recebe a 12.0 sem a 13.0.** A spec pousa inteira na `develop`, com dado sintético e sem staging nem piloto.
   - **A consulta tem teto até lá.** Todo pool tem `statement_timeout` (`packages/nucleo/src/db/pool.ts:186`), e a consulta roda só no `POST pedidos`, ação rara da coordenação, fora do caminho quente do horário de aula.
   - Isso só vale se a 13.0 entregar o que a §5 promete. Se a 13.1 não trouxer o índice, os dois ramos e o teste de plano, o bloqueante volta lá.

Recomendações:
- **`cenarios.md` RF13 desatualizado.** A nota "Tarefa 12.0, onde cada um está" não cita os quatro testes da 2ª rodada (chave recadastrada, professor com dois vínculos, sem data de entrada, fim do dia). As divergências 3 e 6 da tabela (sem data de entrada e chave recadastrada com duas linhas) estão só na `techspec.md`, sem cenário próprio. Vale acrescentar.
- **Tabela de Mutações (`12_task.md:113`).** A linha repete o caminho `compartilhamento.repository.ts` que a linha 106 já abriu, quando devia seguir com `›` como as outras.
- **Leitura de `#periodoDoTitular` (`compartilhamento.ts:99-108`).** O método decide `alvo.papel` duas vezes seguidas, e dois ramos explícitos (aluno e professor) ficam mais legíveis.
- **Para o Orquestrador, fora desta revisão.** A triagem tirou da `13_task.md` o comentário "test-engineer e revisor-geral são obrigatórios", a linha do `cenarios.md` em "Contexto necessário" e o "Definidos com o `test-engineer`". Parece remoção acidental do molde. O cenário novo "plano" também está só na tabela da 13.0, sem linha no `cenarios.md`.

Recomendações da 1ª rodada: `techspec.md:225` corrigido; o `?? { meses: 12 }` virou invariante explícita (`compartilhamento.ts:69`); as caixas "Commit feito" e "test-engineer aprovado" foram desmarcadas.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/suboperador-da-escola.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/compartilhamento.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/arquitetura.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/cenarios.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/12_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/13_task.md`

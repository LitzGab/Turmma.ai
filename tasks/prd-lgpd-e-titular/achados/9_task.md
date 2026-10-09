# Achados das revisões — `tasks/prd-lgpd-e-titular/9_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-09 14:21:04 · `tasks/prd-lgpd-e-titular/9_task.md`

VEREDITO: REPROVADO

**Cenários exigidos (RF8 e RF9, tarefa 9.0):**
- **Caminho feliz:** o registro grava a seção de cada escola com os números e os textos dela; a coordenação lê e confirma.
- **Bordas:** escola inexistente no arquivo; escola repetida, também com o id em maiúsculas; texto que cita outra escola afetada pelo nome ou pelo id, em várias grafias; uma escola cujo nome contém o de outra; a lista com mais de 50 incidentes; confirmar de novo; a eliminação de quem confirmou.
- **Permissão:** professor, aluno, coordenação sem segundo fator e chamada sem token; operador inexistente ou desativado.
- **Isolamento:** A não recebe a contagem, o texto nem o id de B; confirmar o id de B dá a mesma resposta que um id inexistente; confirmar em A não confirma B; a medição de A não inclui B.
- **Concorrência:** duas confirmações em paralelo; dois expurgos em paralelo.
- **Expurgo e alerta:** o incidente sai depois de 5 anos e um dia, levando as seções; o alerta não dispara com 23 h e dispara com 25 h.

**Cobertos:** todos os cenários acima, menos o primeiro bloqueante abaixo. Os testes estão nestes arquivos:
- `apps/api/test/incidente.int.test.ts`: 22 casos, todos verdes.
- `apps/worker/test/expurgo-de-acesso.int.test.ts`: limite dos prazos, lote ordenado, `skip locked`, dois expurgos em paralelo e a cascata das seções.
- `apps/worker/test/medicao-do-incidente.int.test.ts`
- `infra/test/alerta-do-incidente.int.test.ts`
- `apps/api/test/ops-operador.int.test.ts` (C2)
- `apps/api/test/arquitetura.test.ts`
- o teste da matriz de permissões
- `infra/test/alertas.test.ts`

Mutei duas cláusulas e as duas deixaram teste vermelho:
- Sem `confirmado_em is null` no `confirmar`, falha o teste de concorrência.
- Sem `escola_id` no `confirmar`, falha o teste de isolamento.

Não há `.skip`. Não há mock escondendo regra: o único dublê é o repositório que falha na escola B, para provar que a falha de uma escola não derruba a medição das outras. A árvore voltou ao estado inicial: 51 entradas, 37 arquivos, +762 e −157.

**Bloqueantes:**

1. **O texto pode citar outra escola, e o teste que provaria o contrário não existe.** O defeito está em `apps/api/src/ops/incidente.ts:143-151`, na linha 145 (`comparavel.replaceAll(nomeProprio, ' ')`).
   - **O problema:** o nome da própria escola sai do texto *antes* de se procurar o nome das outras. Quando o nome da própria está contido no da outra, a remoção apaga um pedaço do nome da outra e ele deixa de ser encontrado.
   - **Exemplo:** escola A "Colégio Ametista", escola B "Colégio Ametista Norte". Na seção de A, o texto "O Colégio Ametista Norte teve acesso indevido." vira "o  norte teve acesso indevido.", e o nome de B não é achado. A coordenação de A recebe o nome de B: é exatamente o que o RF8 manda recusar.
   - **Confirmado com uma sonda temporária** em `apps/api/src/ops/incidente.test.ts`: `citaOutraEscola('O Colégio Ametista Norte teve acesso indevido.', curta, [longa])` devolveu `false`. Já desfiz a sonda.
   - **O teste não pega:** `incidente.test.ts` (o caso "o nome da própria escola não conta…") e `incidente.int.test.ts:252-260` só testam a direção inversa, em que a escola de nome longo cita o próprio nome.
   - **Correção exigida:**
     - Procurar o nome de cada outra escola no texto normalizado *sem* tirar nada. Só descartar a ocorrência que fica inteira dentro de uma ocorrência do nome da própria escola, com o mesmo início e o mesmo fim de palavra.
     - Acrescentar o caso inverso aos dois testes: na unidade, a curta citando a longa dá `true`; na integração, `registrar([secao(curta, { circunstancias: \`… ${longa.nome} …\` }), secao(longa)])` dá código 2 e nenhuma seção gravada.
     - Registrar a mutação na tabela "Mutações" do `9_task.md`.

2. **A linha de mutação dessa cláusula promete o que o teste não prova.** O problema está em `tasks/prd-lgpd-e-titular/9_task.md:118`, a linha "› citaOutraEscola › tirar o nome da própria escola".
   - Essa linha aponta como prova `incidente.test.ts` e `incidente.int.test.ts › nome da própria escola`. Os dois só provam que a remoção existe. Nenhum prova que ela não engole o nome de outra escola.
   - **Correção exigida:** depois da correção do item 1, apontar a linha para os casos novos.

**Recomendações:**
- `apps/worker/src/montagem.ts`: o `await medicaoDoIncidente?.encerrar()` ficou sem teste, como a própria tarefa declara. Vale um teste de que, depois de `worker.encerrar()`, nenhuma volta nova da medição acontece. Dá para fazer com um relógio que conta as leituras.
- `conhecidoEm` com fuso, como "2026-10-09T14:00:00-03:00", que é o exemplo do próprio comando, não tem teste. Se tirarem `offset: true`, só o formato com `Z` continua passando e nenhum teste fica vermelho.
- O teto de `titularesEstimados` (100 milhões) no esquema do comando não é provado pelo comando, só pelo check do banco. Sem ele, o comando responderia código 1 (`ERRO_INTERNO`) em vez de 2. Falta um caso "número grande demais" na lista de arquivos inválidos.
- O comando roda duas vezes sem chave de idempotência e grava dois incidentes. Como é ato manual da equipe, aceitável, mas vale uma linha no runbook.
- O nome parcial da outra escola ("Ametista", sem "Colégio") não é detectado, por desenho. Vale dizer no runbook que o operador revisa o texto antes de registrar.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-09 14:22:05 · `tasks/prd-lgpd-e-titular/9_task.md`

VEREDITO: APROVADO

Tabelas verificadas:
- `incidente` (`packages/nucleo/drizzle/0031_incidente.sql`, `packages/nucleo/src/db/schema/incidente.ts`): não tem `escolaId`. É uma tabela da operação, igual a `suboperador`, e a exceção está declarada em `docs/modelo-de-dados.md`. Ela só guarda `conhecido_em`, `registrado_por` e `registrado_em`; nenhum número nem texto de escola fica nela. Não varia por período, então não precisa de `anoLetivoId`. Id é UUID (`uuidv7()`).
- `incidente_escola`: tem `escola_id` not null com FK. `confirmado_por` usa FK composta `(escola_id, confirmado_por)` para `usuario(escola_id, id)`, o que impede gravar como confirmador alguém de outra escola. O único `(escola_id, incidente_id)` e o índice parcial dos pendentes começam pelo escopo. Id é UUID, próprio da seção, e o `incidente_id` compartilhado nunca chega à escola. Não varia por período, então não precisa de `anoLetivoId`.
- A classificação em `packages/shared/src/privacidade/classificacao.ts` cobre as duas tabelas.

Queries verificadas:
- `IncidenteDaEscolaRepository` (`packages/nucleo/src/titular/incidente-da-escola.repository.ts`): os quatro métodos filtram por `exigirEscolaDoContexto()`, nas linhas 55, 65, 78 e 92. Nenhum recebe a escola por argumento e nenhum é `@SemEscopo`. A tabela `incidente` só entra por junção com a seção da escola.
- `OperacaoPrivacidadeRepository.ligarEscolaAoIncidente` grava a escola a partir do contexto. O comando abre esse contexto por escola, com `executarNoContexto` em `apps/api/src/ops/incidente.ts:180`. `registrarIncidente` grava só na tabela `incidente`, que não tem escola.
- Rotas: `GET /v1/privacidade/incidentes` e `POST /v1/privacidade/incidentes/:id/confirmar` não aceitam `escolaId`. O corpo do POST é recusado por `esquemaPedidoSemCorpo`. Id mal formado, id de outra escola e id inexistente respondem o mesmo `NAO_ENCONTRADO`.
- A auditoria de confirmação só é gravada se o `update` escopado alterou a linha, então não sai auditoria para id de outra escola.
- Expurgo de `incidente`: o `@SemEscopo` existente ganhou justificativa reescrita para o novo alvo. A rotina só devolve a contagem e as seções saem em cascata.
- `MedicaoDoIncidente` / `MedicaoPorEscola`: cada escola é lida no próprio contexto, e a série leva só `escola_id` e um número, sem texto nem id de incidente.
- Matriz de permissão: `privacidade_incidentes` dá acesso só à coordenação, com escopo `unidade`. Rede, professor e aluno ficam com `nunca`.

Teste de isolamento: presente e efetivo
- `apps/api/test/incidente.int.test.ts`, teste da linha 353: tirando o filtro de escola de `daEscola`, A passa a receber a seção de B e as sentinelas de B, e o teste quebra.
- Mesmo arquivo, teste da linha 377: tirando o filtro de `existe` ou de `confirmar`, o id de B confirmado por A deixa de responder igual ao inexistente e B fica confirmado, e o teste quebra.
- `apps/worker/test/medicao-do-incidente.int.test.ts`, teste da linha 88: tirando o filtro de `conhecidoEmDoPendenteMaisAntigo`, a série de A pega o pendente de B, e o teste quebra.
- `apps/api/test/arquitetura.test.ts` restringe quem pode tocar as duas tabelas e confere que o leitor só escreve com `.update(incidenteEscola)`.

Bloqueantes: nenhum

Recomendações:
- `apps/api/src/ops/incidente.ts:120`: o comando só aceita UUID na `escola` da seção, mas a mensagem `NAO_ENCONTRADO` não diz qual seção falhou. Se o operador errar o id de uma entre 200 escolas, vai ter de procurar à mão. Dá para citar só a posição da seção, como já se faz na recusa de texto.
- `apps/worker/src/montagem.ts`: o `await medicaoDoIncidente?.encerrar()` não tem teste próprio, e isso está declarado na tabela de mutações. Fica para o `/retro`, se o laço passar a ser injetável.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-09 14:22:33 · `tasks/prd-lgpd-e-titular/9_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: um só. `incidente_escola.confirmado_por` guarda o id de quem, na coordenação, confirmou o aviso, e `confirmado_em` guarda quando. `incidente.registrado_por` é o apelido do operador Turmma. Os textos da seção (`circunstancias`, `contencao`, `correcao`) são escritos pela nossa equipe e não têm dado de titular de propósito. Nenhum campo de aluno.

Fora da tabela de dados do docs/lgpd.md: nenhum. As duas linhas novas estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/lgpd.md:92-93`, com finalidade, base legal e retenção de 5 anos do registro. Isso bate com a linha de dado pessoal da seção 8 do PRD e com `registro_de_incidente` em `packages/shared/src/privacidade/retencao.ts`.

Autorização por objeto: ok.
- **Ler:** `IncidenteDaEscolaRepository.daEscola` começa por `escola_id = exigirEscolaDoContexto()`. O id que a escola recebe é o da seção (`incidente_escola.id`). O `incidente_id`, que as escolas afetadas dividem, nunca sai.
- **Confirmar:** `existe` e `confirmar` exigem a escola do contexto e o id. Se eu trocar mentalmente o id na URL para a seção de outra escola, a resposta é `NAO_ENCONTRADO`, a mesma do id que não existe. O id que nem é uuid também dá `NAO_ENCONTRADO` (`privacidade.controller.ts:354-355`), então as três respostas são iguais.
- **Papéis:** a matriz dá `nunca` para rede, professor e aluno, e `unidade` só para a coordenação.
- **Testes:** `apps/api/test/incidente.int.test.ts:353` e `:377` provam o isolamento e que confirmar em A não confirma B. A linha `:499` prova as permissões.

Logs: limpos.
- `medicao-por-escola.ts:44` loga só o evento e o erro resumido.
- O expurgo loga só contagens (`incidentesTotal`).
- O comando imprime só `{incidenteId, escolas}`. Quando falha, mostra o nome da opção e a posição da seção, e no erro interno passa por `resumirErro`. Nunca mostra o conteúdo.
- A métrica leva `escola_id` e um número, que é o padrão aceito em `METRICAS_COM_ESCOLA`.

Auditoria: presente.
- `incidente.registrado` é gravada na auditoria de cada escola, com `autorOperador`. Leva só o risco e o número estimado de titulares (`packages/nucleo/src/auditoria/acoes.ts`).
- `incidente.confirmado` só é gravada pela chamada que de fato confirmou (`privacidade.service.ts:440-442`). A ordem e a corrida estão cobertas pelo teste de concorrência.
- A leitura pela coordenação não toca dado de aluno, então a regra 20, item 10, não pede auditoria aqui.

Envio externo: nenhum. Não há IA nem chamada a provedor.

Seed/fixture: sintético. Os nomes das escolas são sorteados por teste, e os textos são de teste.

Ciclo de vida: ok.
- O expurgo apaga o incidente com mais de 5 anos e leva as seções em cascata. O teste prova os 5 anos e o dia anterior.
- A FK composta em `confirmado_por` tem `on delete set null ("confirmado_por")`. Assim a eliminação de quem confirmou mantém a seção e a data (teste em `:528`).
- O prazo é fixo pela norma da ANPD. Faz sentido não deixar a escola ajustar, e `ops:retencao` continua recusando todo prazo fixo.

Pergunta de fechamento: o código responde. O incidente não guarda nada por aluno, só categorias e uma contagem por escola. Então nada do que esta tarefa acrescenta fica de fora do que se responde sobre um titular.

Bloqueantes: nenhum.

Recomendações:
1. **Os textos são livres, e o código não impede que alguém da equipe escreva o nome de um aluno ou professor neles.** O mapa de dados promete "nenhum dado de titular", mas só a disciplina de quem escreve garante isso. O comando recusa o nome de outra escola, mas não o de uma pessoa. Sugiro:
   - na linha do `ops:incidente` no `README.md` e no `docs/runbook.md`, uma frase que proíba citar pessoa ("descreva o caminho e o volume, nunca quem");
   - conferir que as tabelas `incidente` e `incidente_escola` entram na troca de nome completo da eliminação (RF15, tarefa 15.0). O comentário de `classificacao.ts` diz que a sentinela sai dessa lista.
2. Em `apps/api/test/incidente.int.test.ts:499`, o teste de permissão cobre professor, aluno e coordenação sem segundo fator, mas não o papel `rede`. Hoje só a matriz cobre esse caso. Um caso explícito de rede (ler e confirmar dando 404 ou 403, como a guarda devolve) deixaria provado por HTTP o item 8 da regra 10 para esta rota.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-09 14:22:39 · `tasks/prd-lgpd-e-titular/9_task.md`

VEREDITO: APROVADO
Caminho quente tocado: migration | fila (medição no worker-lote) | API da coordenação, fora do caminho do aluno
Rate limit: ok. As duas rotas novas passam pela `GuardaDeLimite` global, que limita pelo `sub` e pelo `esc` do token (`apps/api/src/app.module.ts:131-137`); não há limite novo por IP.
Fila e prioridade: ok. O registro roda por comando da operação, fora de request. O expurgo do incidente entra no `sistema.expurgar-acesso`, que já é lote. A medição é um laço de 5 min só no worker-lote e não roda job na fila interativa.
Concorrência: protegida. `IncidenteDaEscolaRepository.confirmar` faz `update … where confirmado_em is null` e grava a auditoria só se esta chamada confirmou, com o teste "concorrência" usando `GatilhoDeParada` e `esperarNaTrava`. O registro e todas as seções são uma transação só. O único `(escola_id, incidente_id)` recusa a mesma escola duas vezes no mesmo incidente. O expurgo usa `for update skip locked` e tem teste do lote ordenado.
Índice e paginação: ok. A leitura da escola começa por `escola_id` (único `(escola_id, incidente_id)`) e tem `limit 50`, com os pendentes primeiro. A medição usa o índice parcial dos pendentes, que começa por `escola_id`. A cascata do expurgo tem `incidente_escola_incidente_idx`.
Degradação de IA: não se aplica.
Migration: compatível. A 0031 só cria duas tabelas novas e vazias, sem `ALTER` em tabela existente, sem `NOT NULL` acrescentado a tabela com dado e sem rename.
Métrica e alerta: ok. A métrica `incidente.horas_sem_confirmacao{escola_id}` entrou em `METRICAS_COM_ESCOLA`. Há regra em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/grafana/alertas/incidente-sem-confirmacao.yaml`, parágrafo no runbook e registro em `REGRAS_PROVISIONADAS`. O teste de infra cobre 23 h (não dispara) e 25 h (dispara), e há painel novo.
Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0031_incidente.sql`: as FKs compostas para `usuario` e para `escola` pedem um lock SHARE ROW EXCLUSIVE nessas tabelas. Hoje a duração é desprezível, porque a tabela nova está vazia. Com escola real, uma transação longa em `usuario` pode enfileirar o login atrás desse lock. Vale anotar no `TODO.md`, junto dos índices `concurrently` já pendentes, que migration com FK para `usuario` roda só fora do horário letivo, com `lock_timeout`.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/src/montagem.ts`: agora há dois laços por escola a cada 5 min (expurgo e incidente), um atrás do outro, cada um com sua query. Com dez escolas não faz diferença. Se surgir uma terceira medição desse tipo, vale juntar tudo numa volta só pela lista de escolas.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/src/montagem.ts`: o `await medicaoDoIncidente?.encerrar()` está sem teste, e a tabela de mutações da tarefa já registra isso. Fica para quando o intervalo puder ser injetado por `montarWorker`.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-09 14:22:55 · `tasks/prd-lgpd-e-titular/9_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As seis divergências estão registradas no `9_task.md` e também na `techspec.md` (§3, §4, §5, §6, §7c) e no `cenarios.md`.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes:

1. **O comando deixa passar o nome de outra escola quando esse nome contém o da própria escola.**
   - **Onde:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/incidente.ts:145`
   - **O que acontece:** `citaOutraEscola` apaga do texto o nome da própria escola, sem fronteira de palavra, antes de procurar os nomes das outras. Se o nome da outra escola contém o nome da própria, a busca já não acha a outra.
   - **Reproduzido** com a mesma lógica da função: própria "Colégio Ametista", outra "Colégio Ametista Norte", texto "O Colégio Ametista Norte teve acesso indevido.". O texto vira "o   norte teve acesso indevido." e a função devolve `false`.
   - **Efeito:** a seção da escola curta cita a longa e é gravada. A coordenação da escola curta fica sabendo que a outra foi afetada. É exatamente o vazamento que a 9.2 manda recusar ("recusa nome ou id de outra escola").
   - **Mesmo defeito sem nome composto:** própria "Alfa", outra "Escola Alfabeto". O texto "escola alfabeto" vira "escola  beto" e passa.
   - **Por que os testes não pegam:** `apps/api/src/ops/incidente.test.ts:36-42` e `apps/api/test/incidente.int.test.ts:252` só testam o sentido inverso, com a seção da escola longa.
   - **Correção exigida:**
     - Quando o nome normalizado da outra escola contém o da própria, procurar o nome da outra no texto original, antes de apagar o nome próprio. Uma ocorrência do nome mais longo é sempre citação da outra.
     - A remoção do nome próprio deve respeitar a mesma fronteira de palavra `(?<![\p{L}\p{N}])…(?![\p{L}\p{N}])` usada na busca.
     - Acrescentar os dois casos, curta citando longa e "Alfa" contra "Escola Alfabeto", no teste de unidade e no `incidente.int.test.ts › RF8, o texto que cita outra escola afetada…`.
     - Registrar as mutações novas na tabela de Mutações do `9_task.md`.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.controller.ts:123-124` refaz o `idDoCaminho` de `apps/api/src/estrutura/entrada.ts:8`, que o próprio arquivo já importa ao usar `lerEntrada`. É um segundo jeito de fazer algo que o projeto já faz. Basta trocar por `idDoCaminho(id)`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:70` ("que são oito e fechados") e `:77` ("Os prazos fixos são oito grupos…") ainda dizem oito. Com `registro_de_incidente` são nove; vale atualizar a contagem e a lista da linha 77.
- O critério de conclusão do `9_task.md` (linha 69) ainda pede o portão com `--infra`. Pela D78 revista, na tarefa roda só o portão da tarefa. Vale alinhar o texto para não confundir a próxima rodada.
- O índice da tabela de revisões do `9_task.md` mostra o `test-engineer` só na rodada 1, com REPROVADO. Antes do commit, a Mesa precisa garantir que ele tenha uma rodada aprovada que valha para o código atual.

## test-engineer · 2ª rodada · APROVADO · 2026-10-09 14:35:53 · `tasks/prd-lgpd-e-titular/9_task.md`

VEREDITO: APROVADO

Esta foi a 2ª rodada. Auditei o diff desde a 1ª e o que ele afeta, e confirmei as mutações uma a uma. A árvore voltou ao estado inicial: `git status --short` ficou igual ao de antes, e o sha256 de `incidente.ts` e de `privacidade.controller.ts` confere com o original.

**Cenários exigidos:**
- O comando recusa o texto que cita outra escola afetada pelo nome, mesmo quando o nome da outra contém o da própria escola, nos dois sentidos: a longa citando a curta e a curta citando a longa.
- O nome da própria escola no texto passa.
- O comando recusa `titularesEstimados` acima do teto.
- `conhecidoEm` com fuso horário grava o mesmo instante em UTC.
- O `:id` que nem é um id responde igual ao id que não existe, sem revelar que o registro existe (regra 10, item 6).

**Cobertos:** todos. Cada mutação abaixo deixou teste vermelho:

| Mutação | Teste que ficou vermelho |
|---|---|
| Voltar ao `replaceAll(nomeProprio, ' ')` (correção 1) | Unidade: "o nome da própria escola não conta…" e "o nome de outra escola que começa com o da própria…". Integração: "o nome da outra escola que contém o da própria é recusado…" |
| Tirar a regra que ignora o nome da outra dentro do nome da própria (`return true`) | Unidade: "o nome da própria escola não conta…". Integração: "o nome da própria escola no texto passa…" |
| Conferir só o início do trecho (`propriaAqui.ini <= ini`, sem o fim) | Unidade: "o nome da própria escola não conta…". Integração: "o nome da outra escola que contém o da própria…" |
| `z.iso.datetime()` sem `{ offset: true }` | Integração: "RF8, conhecidoEm com fuso" |
| Sem `.max(MAXIMO_DE_TITULARES_ESTIMADOS)` | Integração: "RF8, o arquivo e a escola", caso "número acima do teto" |
| `confirmarIncidente(id)` sem `idDoCaminho` | Integração: "RF9, isolamento: confirmar o id de B…", caso `nao-e-um-id` |

A correção 2 também está feita. A linha nova de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/9_task.md:119` aponta para testes que de fato ficam vermelhos com a mutação descrita. Antes da mutação, os testes estavam verdes: 7 de 7 na unidade e 24 de 24 na integração.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/9_task.md:108`: a linha ainda descreve a cláusula como "`z.uuid()` do `:id`". O controller agora usa `idDoCaminho(id)`. É preciso atualizar o texto; o teste citado continua certo e fica vermelho.
2. Falta um caso de unidade para duas escolas afetadas com exatamente o mesmo nome. Hoje o texto com o nome da própria escola passa, porque o nome da outra fica inteiro dentro dele. O comportamento parece o pretendido, mas não está declarado em teste.
3. Falta um caso de unidade para o nome da outra que passa da borda do nome da própria. Exemplo: a própria se chama "Escola Alfa", a outra "Alfa Norte", e o texto diz "Escola Alfa Norte". Hoje o comando recusa esse texto, o que é o lado seguro, mas sem teste que fixe isso.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-09 14:36:43 · `tasks/prd-lgpd-e-titular/9_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta rodada. Nem `incidente` nem a seção de cada escola mudaram desde a 1ª rodada, quando foram aprovadas com `escolaId` na seção e UUID.

Queries verificadas: nenhuma query nova. `PrivacidadeService.confirmarIncidente` e `incidente-da-escola.repository.ts` não mudaram e continuam com o escopo vindo do contexto. Mudaram dois pontos:
- `privacidade.controller.ts › confirmarIncidente`: agora passa por `idDoCaminho`, de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/estrutura/entrada.ts:8`. Id mal formado volta `NAO_ENCONTRADO`, a mesma resposta de id inexistente e de id de outra escola (regra 10, item 6). Nenhum `escolaId` entra pelo corpo nem pela query, porque o corpo continua preso a `esquemaPedidoSemCorpo`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/incidente.ts:144-158 › citaOutraEscola`: a função não apaga mais o nome da própria escola do texto. Ela procura o nome de cada outra escola no texto inteiro e só descarta a ocorrência que cai inteira dentro do nome da própria. Quando a ocorrência pega só parte do nome da própria, ou o nome da própria não fecha nas fronteiras de palavra, o texto é recusado. O erro vai sempre para o lado de recusar, que é o lado seguro. A busca pelo id continua sem exceção nenhuma.

Teste de isolamento: presente e efetivo. Conferi tirando a mudança de cabeça e voltando ao `replaceAll` antigo:
- `incidente.test.ts`: o caso `('O Colégio Ametista Norte…', curta, [longa])` daria `false`, porque o código antigo apagava "colegio ametista" e o nome da longa sumia. O teste quebraria.
- O caso Alfa/Alfabeto prova a fronteira de palavra.
- `incidente.int.test.ts`: o novo caso "o nome da outra escola que contém o da própria é recusado" passaria a gravar 2 seções no lugar da recusa com código 2 e 0 seções. Esse também quebraria.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/incidente.ts:147`: falta um teste unitário em que o nome da própria escola aparece com fronteira quebrada ("Colégio Ametista Nortex") e o nome da outra escola contido nele. Ele deixaria escrito que esse caso é recusado de propósito.
- As duas recomendações da 1ª rodada continuam como estavam, no `TODO.md` ou sem aplicar. Ficam para o `/validar` e o `/retro`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-09 14:36:51 · `tasks/prd-lgpd-e-titular/9_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum

**A correção exigida na 1ª rodada foi feita.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/incidente.ts:144-159`, `citaOutraEscola` não apaga mais o nome da própria escola do texto. O nome de cada outra escola é procurado no texto normalizado inteiro, por `procurarNome`, com fronteira de palavra. Uma ocorrência só é ignorada quando fica inteira dentro de uma ocorrência do nome da própria escola, que também é procurado com fronteira de palavra. Conferi os casos no código:
- "Ametista" contra "Ametista Norte", nos dois sentidos, dá o resultado certo.
- "Alfa" contra "Escola Alfabeto": o nome da própria não casa dentro de "alfabeto", então a outra escola é acusada.
- Os índices são calculados sobre a mesma string normalizada, então ficam consistentes.

Testes e registro de mutações:
- A unidade (`apps/api/src/ops/incidente.test.ts:40-50`) cobre os dois casos.
- A integração (`apps/api/test/incidente.int.test.ts:262-272`) cobre o caso do nome da outra que contém o da própria, e falharia se o código voltasse ao `replaceAll`.
- As mutações novas estão no `9_task.md`.

**Recomendações da rodada anterior:**
- O controller passou a usar `idDoCaminho`.
- A contagem de prazos fixos na Tech Spec foi para nove, nas duas linhas.
- O critério com `--infra` foi recusado com motivo registrado. Aceito.

Recomendações:
- O caso "Alfa" contra "Escola Alfabeto" ficou só na unidade, embora a correção pedisse os dois casos também na integração. Não bloqueio: a função é pura, a unidade já falha se a fronteira de palavra do nome da própria sair, e a ligação com o comando está provada pelo caso Ametista na integração. Se a tabela de mutações for revista, vale citar um caso de prefixo sem nome composto também no `incidente.int.test.ts`.
- `apps/api/src/ops/incidente.ts:147` está numa linha longa, com `achado.index ?? 0` repetido. Um auxiliar que devolva o intervalo `{ ini, fim }` de cada ocorrência, usado nos dois lugares (linhas 147 e 154-156), deixaria a função mais fácil de ler.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-09 14:36:59 · `tasks/prd-lgpd-e-titular/9_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. Esta rodada mexeu só no comando de operação `ops:incidente` (que fica fora do request do aluno e do professor), na troca para `idDoCaminho` no controller, em testes e em documentação.
Rate limit: ok. Nada mudou desde a 1ª rodada.
Fila e prioridade: ok. Nada mudou.
Concorrência: protegida. A confirmação não mudou. `ops:incidente` não tem chave de idempotência, e o runbook agora diz isso. Não bloqueia: é um comando manual que só uma pessoa roda, e o comportamento já estava assim quando a 1ª rodada aprovou.
Índice e paginação: ok. Nenhuma query nova.
Degradação de IA: não se aplica
Migration: não se aplica. A 0031 não mudou. A recomendação da 1ª rodada (aplicar fora do horário letivo e com `lock_timeout`) está registrada no `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/TODO.md`.
Métrica e alerta: ok. Nada mudou. O parágrafo novo "Ao registrar o incidente" entrou no `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/runbook.md`.
Bloqueantes: nenhum
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/incidente.ts › citaOutraEscola`: a busca por regex com fronteira de palavra roda sobre um texto de até 1.000 caracteres, com o nome escapado. O padrão é um literal com lookaround e não abre risco de lentidão por regex (ReDoS). Os casos novos estão cobertos em `incidente.test.ts` e em `incidente.int.test.ts`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.controller.ts:49`: `idDoCaminho` faz o mesmo que a validação que substituiu: id fora do formato UUID responde `NAO_ENCONTRADO`, agora também com o id em minúsculas. O controller ficou sem regra própria.

Recomendações:
- Dar ao `ops:incidente` uma chave de idempotência opcional no JSON (por exemplo, um `id` do incidente gerado pelo operador, com restrição única). Assim, rodar o mesmo arquivo duas vezes deixa de gravar dois incidentes com dois alertas. Hoje só o runbook avisa disso. Fica para o `/retro`.
- As três da 1ª rodada continuam registradas como estavam: a migration no `TODO.md`, juntar as medições quando surgir a terceira, e o `encerrar()` da medição do incidente sem teste, também no `TODO.md`.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-09 14:36:59 · `tasks/prd-lgpd-e-titular/9_task.md`

VEREDITO: APROVADO

A 2ª rodada não traz bloqueante. As duas mudanças de código fecham o furo que havia e não abrem caminho novo de exposição.

Campos pessoais tocados: nenhum novo nesta rodada. O diff mexe só na regra que procura o nome de outra escola no texto, no controller e em testes. Não há migration, coluna ou DTO novo.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok.
- `apps/api/src/privacidade/privacidade.controller.ts`, em `confirmarIncidente`: o id agora passa por `idDoCaminho`. Essa função, em `apps/api/src/estrutura/entrada.ts:8-12`, recusa id fora do formato com `NAO_ENCONTRADO` e põe o id em minúsculas. É o mesmo comportamento de antes, agora pela função comum.
- `apps/api/test/incidente.int.test.ts:411-416` prova que três casos respondem igual: o id que não existe, a seção de outra escola (B e C) e o texto que nem é id. Status, código e mensagem são os mesmos, e a seção de B continua sem confirmação.

Isolamento do texto entre escolas: o furo da rodada anterior foi corrigido.
- **Antes:** o nome da própria escola era apagado do texto antes da busca. Se a seção da "Colégio Ametista" escrevesse "Colégio Ametista Norte", o nome da outra escola sumia junto e o texto passava para a coordenação errada.
- **Agora** (`apps/api/src/ops/incidente.ts`, `citaOutraEscola`): só deixa de contar o nome da outra escola que aparece **dentro** do nome da própria. Quando o nome da própria está dentro do nome da outra, conta como citação. Se as duas ocorrências se sobrepõem só em parte, também conta. Na dúvida, a regra recusa.
- **Testes:** `apps/api/src/ops/incidente.test.ts` cobre a escola curta citando a longa e "Alfa" contra "Escola Alfabeto", nos dois sentidos. `apps/api/test/incidente.int.test.ts` prova pelo comando que nada é gravado (`quantasSecoes = 0`) e que o erro não repete o texto.

Logs: limpos. O erro do comando cita só a posição da seção. O caso novo "número acima do teto" segue o padrão dos outros casos e não ecoa o conteúdo.

Auditoria: presente e sem mudança desde a rodada aprovada.

Envio externo: nenhum.

Seed/fixture: sintético. Os testes usam nomes de escola inventados e ids gerados.

Recomendação da 1ª rodada, conferida:
- (1) Aplicada. A linha do `ops:incidente` no `README.md` e o parágrafo "Ao registrar o incidente" no `docs/runbook.md` proíbem citar pessoa nos três textos livres. Dizem também que o comando não pega o nome parcial de outra escola nem o de pessoa, e que rodar o mesmo arquivo duas vezes grava dois incidentes. A conferência de `incidente` e `incidente_escola` contra a troca de nome da eliminação ficou registrada no `TODO.md` para a tarefa 15.0, como pedido.
- (2) A recusa do teste do papel `rede` por HTTP continua válida: a rede ainda não tem usuário, e a matriz prova que esse papel nunca alcança o incidente.

Bloqueantes: nenhum.

Recomendações:
- A regra de "não contar o nome dentro do nome da própria escola" ainda deixa passar um caso: a outra escola tem o nome contido no da própria e o texto escreve o nome inteiro da própria. Por exemplo, a "Colégio Ametista Norte" cita "Colégio Ametista Norte". Isso é intencional e está documentado, mas fica um risco que só a revisão humana pega. Vale manter a leitura de cada seção antes de rodar o comando, como o runbook já pede, e citar esse caso lá.

Pergunta de fechamento: esta rodada não muda a resposta da 1ª. O incidente fica preso à escola, auditado e sem dado de titular.

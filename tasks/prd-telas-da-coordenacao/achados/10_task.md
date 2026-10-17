# Achados das revisões — `tasks/prd-telas-da-coordenacao/10_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-17 12:21:13 · `tasks/prd-telas-da-coordenacao/10_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff só mexe em tela (`Governanca.tsx`, `Segmentado.tsx`), no cliente da API (`apps/web/src/api/governanca.ts`), em textos e no fixture do e2e. Os inserts de `acrescentarSerieDeUmProfessorSo` vão para `serie`, `turma`, `vinculo`, `artefato` e `entrega`, nunca para `nota`. Todos com autor humano? Sim, porque nenhum caminho novo foi aberto.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. O filtro só lê o estado que a entrega já tem (pendente, aprovada ou rejeitada) e não aprova nada sozinho. Nas fotos, cada linha mostra "Esperando o professor" ou "Aprovado por um professor · 17/10, 12h18", que diz quando a pessoa decidiu. Quem decidiu fica na auditoria, como a frase fixa da tela avisa, conforme a D45. Nenhuma exceção da D47 aparece fora do Tutor.

Supervisão do tutor: ok, a tarefa não toca o Tutor. O consumo do Tutor aparece só somado por função ("Trocas dos alunos com o Tutor 0 de 600 trocas"), sem número por aluno nem por professor.

Autonomia declarada e visível: sim. O link "Como cada IA trabalha" continua na tela e aparece nas fotos do computador e do celular.

Bloqueantes: nenhum.

O que conferi da regra 70:
- **Item 6, auditoria.** A tabela segue com as cinco colunas de antes e responde "o que a IA gerou, por qual função, quando, e se uma pessoa decidiu". O filtro por estado facilita achar "o que está esperando" sem expor quem decidiu.
- **Itens 8 e 9 e D64, medir o professor.**
  - O único filtro novo é `estado`. O schema do shared já recusava `professorId`, `turmaId` e `ordenarPor` (`.strict()`, `packages/shared/src/governanca/governanca.ts:19`).
  - O repository aplica o filtro sem tirar o grupo mínimo da D45 (`apps/api/src/governanca/governanca.repository.ts:139-151`). Filtrar não revela nada que a linha sem filtro já não mostrasse.
  - O teste de componente prova que só `estado` e `pagina` vão à API (`Governanca.test.tsx:245-270`).
  - O e2e prova três coisas: nenhum nome de professora, aluno ou turma aparece na página; a série de um professor só fica fora da lista, também com o filtro ligado; e o recomeço pela pessoa seguinte não traz nada da escola anterior.
  - Valor desconhecido no endereço (`?estado=professor`) é ignorado e não chega à API (`textos-da-governanca.ts:688-691`, com teste).
- **Item 7, vigilância.** Nada de comportamento nem de emoção. O filtro "Esperando o professor" é por série e sem nome, então não vira cobrança nominal de professor.
- **D55.** Nada de nota, conceito ou sugestão de nota. Na lista só aparecem "Versão adaptada de atividade" e "Correção de objetiva de uma turma".
- **Fotos.** Os quatro números continuam os da escola inteira com "Aprovados" ligado (7, 3, 1, 0 nas duas fotos do computador), o que o teste de componente também prova com a mutação dos números. Saída de IA aparece como IA ("Assistente de ensino · Adaptação"). Nada induz uso.

Recomendações:
1. A 1366 × 768, a foto `coordenacao--coordenacao-governanca--computador.png` termina no filtro "Estado" e não mostra nenhuma linha da tabela, que é justamente o que responde "o que a IA gerou e quem aprovou". A página não rola, então a tabela rola dentro dela, e não é bloqueante para a regra 70. O ajuste visual é do `frontend-reviewer`, e o produz `apps/web/src/areas/coordenacao/Governanca.tsx:463-490`: texto de abertura, botão e números empilhados antes da tabela.
2. A tarefa mediu 30,2 s no `EXPLAIN` com `?estado=rejeitada`, e o gargalo é a subconsulta do grupo mínimo da D45, já registrada no `TODO.md`. Quando o repository for reescrito, o teste que prova que a série de um professor só não entra na lista precisa continuar efetivo. Hoje esse teste está no e2e `Registros › IA: a série com um professor só`. Reescrever o grupo mínimo sem o teste de integração correspondente seria regressão da D45.
3. O texto de apoio de "Rejeitado" diz "O professor recusou, com justificativa", mas a linha rejeitada chega à coordenação sem o motivo (`motivo: ''` em `aprovacaoDoItem`, que vem de antes desta tarefa). Vale uma frase dizendo que a justificativa está na auditoria, para a coordenação não procurar e achar vazio.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Governanca.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Governanca.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/textos-da-governanca.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/api/governanca.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/api/src/governanca/governanca.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/governanca.spec.ts

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 12:21:29 · `tasks/prd-telas-da-coordenacao/10_task.md`

VEREDITO: APROVADO
Tela vista: sim (9 fotos da tarefa lidas, cheia e vazia, computador e celular, mais 1 minha do computador rolado até a tabela; ver nota sobre a foto abaixo)
Estados: ok. Carregando, erro com "Tentar de novo", vazio da escola, vazio sem linha, vazio por filtro, filtro lendo, filtro com erro e falha de "Carregar mais" estão em `Governanca.tsx:67-145` e provados em `Governanca.test.tsx`. Confirmei só pelo código e pelos testes de unidade: rodei os três arquivos de teste da tarefa e passaram (56 testes). O e2e eu não rodei.
Acessibilidade: ok. O `Segmentado` é um `radiogroup` com rótulo visível "Estado", setas, Home e End, e `aria-checked`. A tabela tem `caption` e `th`. O filtro é navegação por endereço com `replace`. Não há nada que dependa de hover.
Chromebook fraco: ok. A tela pede só uma página por vez, com "Carregar mais" e cursor da API. A consulta do estado só roda quando há `?estado=` no endereço. A tabela e a lista do celular não duplicam nós. O `EXPLAIN` de 30 s no volume extremo (a conta, não a tela) está anotado na tarefa e no `TODO.md`, com destino na API (A5). Não bloqueia esta tarefa.
Celular: ok. A 360 px não há rolagem de lado nem texto saindo do bloco. O filtro ficou em duas colunas com 44 px de altura (`Segmentado.tsx:91,106`). A tabela vira lista de cartões e o consumo vem embaixo. O link "Como cada IA trabalha" tem 44 px.
Ação oficial protegida: sim. A tela só lê e filtra, sem aprovar, publicar nem excluir. Cada linha traz "Agente e função", série, data e a decisão. A marca de IA está em "Gerado por IA" e no nome da função. Os números ficam sempre os da escola inteira, e não há coluna, filtro nem ordem por professor ou turma (D45, D64).
Bloqueantes: nenhum

Recomendações (não bloqueiam):
1. No computador a 1366 px, a coluna "Decisão" fica estreita. Veja `coordenacao--coordenacao-governanca--columnheader-name-Decisão--computador.png`. "ESPERANDO O PROFESSOR" quebra em três linhas, com o "O" sozinho, e "APROVADO POR UM PROFESSOR · 17/10, 12H18" quebra em quatro. Fica legível, mas a linha cresce. A causa é o `min-w-28` da Série em `Governanca.tsx:41`, mais o consumo de 18 rem ao lado (`Governanca.tsx:98`). Vale dar à Decisão uma largura mínima ou um `whitespace-nowrap` no selo. Também dá para pôr o consumo ao lado só a partir de 1280 px.
2. O consumo mostra "tokens" e "execuções" (`textos-da-governanca.ts`, `textoDoConsumo`). É jargão para quem coordena. A tarefa manteve os textos de hoje, então vai para o `/validar` e o `/retro`.
3. Nenhuma das fotos entregues mostra a tabela no computador: o 1366×768 corta no filtro "Estado". Para ver a tabela, fotografei com `--clicar 'role=columnheader[name="Decisão"]'`. Convém a próxima foto desta tela já levar esse clique.
4. Nas fotos do celular, a barra de abas aparece no meio da página (em cima do cartão "Aprovado por gente"). É efeito da captura de página inteira com barra fixa, não defeito do código. No celular real a barra fica no pé da tela.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Governanca.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/Segmentado.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.processo/vitrine/coordenacao--coordenacao-governanca--columnheader-name-Decisão--computador.png`

## revisor-geral · 1ª rodada · APROVADO · 2026-10-17 12:21:38 · `tasks/prd-telas-da-coordenacao/10_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As quatro divergências estão registradas na `techspec.md` §9 ("Como ficou na 10.0") e, no caso do `Segmentado`, também na linha da peça em `docs/interface.md`. A spec não tem `cenarios.md`, então não havia onde mais registrar.

Portão local: carimbo válido

Bloqueantes: nenhum

O que conferi e está certo:
- **Números:** os quatro números saem só de `todos`, a consulta sem filtro (`Governanca.tsx:76`).
- **Filtro na chave:** o estado entra na chave da consulta (`api/governanca.ts:55`). Por isso a resposta atrasada de um filtro não cai na lista de outro. Há teste disso no jsdom e no e2e.
- **Endereço:** "Todos" tira o parâmetro e a troca usa `replace`. Valor desconhecido de `?estado=` é ignorado e a API nunca recebe nada fora dos três estados.
- **Sem professor e sem turma:** a tabela não tem coluna, filtro nem ordem por professor ou por turma. Na série de um professor só, a entrega conta nos números e não entra na lista, e há e2e com fixture própria provando isso.
- **Fotos:** no computador, no celular, cheia, vazia e com "Aprovados" escolhido, a tela mostra os quatro números, o filtro de quatro opções (duas por linha a 360 px), as cinco colunas, a frase sobre turma e quem decidiu, e o consumo ao lado ou embaixo da tabela. Nenhum nome de professor ou de turma aparece, e não há nada fora do que a tarefa pede.
- **Mutações:** cada cláusula nova do diff tem a sua.

Recomendações:
1. **`EXPLAIN` (área do `infra-guardian`).** Com 60 mil entregas, `?estado=rejeitada` levou 30,2 s. A estimativa para `pendente` é de cerca de 100 min, mas é conta, não medição. O custo é a subconsulta do grupo mínimo, que roda uma vez por linha candidata e já existia antes desta tarefa: o filtro não criou o problema, só passa a puxá-lo em toda consulta filtrada. Ele está no `TODO.md` com a saída proposta, e o lugar dele é antes do piloto, com `infra-guardian` e `tenancy-guardian` revisando. Também falta o plano da lista sem filtro: a medição foi interrompida antes de terminar, então ninguém sabe ainda quanto custa a tela de hoje. Vale o Orquestrador levar isso ao Joaquim em vez de deixar só no `TODO.md`.
2. **Mudança não registrada:** `Governanca.tsx:41` pôs `min-w-28` na célula "Série". É pequena, mas não está listada em "Divergências" nem na §9.
3. **Subtarefas sem marca:** `tasks.md:88-94` marca a 10.0 e deixa as subtarefas sem marca, ao contrário da 13.0. O mesmo acontece na 4.0 e na 12.0, então não é falha só desta tarefa.
4. **Tabela abaixo da dobra (para o `frontend-reviewer` olhar):** a 1366 × 768, a tabela não aparece sem rolar o miolo. A foto termina no `Segmentado` (`coordenacao--coordenacao-governanca--computador.png`), porque o parágrafo de abertura, o link e os quatro números ocupam a dobra (`Governanca.tsx:83-95`).

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/10_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Governanca.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/api/governanca.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/TODO.md

## test-engineer · 1ª rodada · REPROVADO · 2026-10-17 12:22:25 · `tasks/prd-telas-da-coordenacao/10_task.md`

VEREDITO: REPROVADO

**Cenários exigidos**
- Caminho feliz: os quatro números, a tabela com cinco colunas e o selo de decisão, "Carregar mais", o consumo e o link para "Como cada IA trabalha".
- Filtro "Estado": "Aprovados" chama `resumo?estado=aprovada`, o estado vai para o endereço sem passo novo no histórico, os números continuam os da escola inteira, e "Todos" tira o estado do endereço.
- Bordas do domínio: série com um professor só (conta nos números e fica fora da lista, inclusive filtrada); escola sem nada gerado; escola com números mas sem linha; filtro que não acha nada; estado inválido no endereço; recarregar mantém o filtro; falha de "Carregar mais", sem e com filtro.
- Permissão e regras D45 e D64: nenhuma coluna, filtro ou ordem por professor ou turma, e nada disso vai à API.
- Isolamento: a coordenação seguinte, na mesma aba, não vê lista, filtro nem números da escola anterior.
- Concorrência: a resposta atrasada do filtro antigo não cai na lista do filtro novo, com duas leituras realmente em voo.
- Tamanho: 1366 × 768 e 360 px.

**Cobertos**
Todos os cenários acima. No componente, em `Governanca.test.tsx`; no e2e, em `e2e/governanca.spec.ts` (servidor filtrando, série de um professor só, recomeço, endereço, corrida, as duas larguras). O filtro no servidor também está na integração da API, em `apps/api/src/governanca/governanca.int.test.ts:230`. Os três arquivos de unidade passam: 56 de 56. Não há `.skip`, não há teste comentado, e nenhum mock esconde a regra: a rede é falsa, e o cliente de consultas, o roteador e a tela são os de verdade. Nenhum provedor de IA é chamado.

**Bloqueantes**

1. **O "Tentar de novo" da página seguinte de um filtro não tem teste que falhe.**
   - Onde: `apps/web/src/areas/coordenacao/Governanca.tsx:114`. O caso que deveria provar é `Governanca.test.tsx:230-241` ("a falha de 'Carregar mais' de um filtro…").
   - O que está errado: o caso para no `alert` e nunca clica em "Tentar de novo". Trocar `lista.fetchNextPage()` por `todos.fetchNextPage()` nessa linha deixa o teste verde, porque ali `todos` não tem próxima página e a chamada não faz nada. O caso sem filtro (`:212`) não prova isso, porque nele `lista === todos`. A cláusula é nova (antes era `resumo.fetchNextPage()`) e também não tem bloco.
   - Correção exigida:
     - A resposta de `estado=aprovada&pagina=<id 98>` vira função: falha na primeira chamada e responde na segunda.
     - Clicar em "Tentar de novo" dentro do aviso.
     - Esperar três selos `aprovada` e conferir que `resumo?estado=aprovada&pagina=<id 98>` foi pedido duas vezes.
     - Acrescentar o bloco: `- <Botao … onClick={() => void lista.fetchNextPage()} …>` com `+ … todos.fetchNextPage() …`, na linha do aviso, apontando para esse caso.

2. **Cláusulas novas sem bloco de mutação.** Os testes que as pegariam existem, mas a seção "Mutações" de `10_task.md` não as declara:
   - `apps/web/src/api/governanca.ts:55`, `queryKey: [...CHAVE_DA_GOVERNANCA, 'resumo', estado]`. É o centro da 10.2: o estado entra na chave. Mutação: a mesma chave para os três estados, por exemplo `'filtrado'` no lugar de `estado`. Teste: `Governanca.test.tsx › a resposta do filtro antigo, mesmo atrasada` (`:358`).
   - `apps/web/src/api/governanca.ts:58`, o `getNextPageParam` da consulta por estado. Mutação: `() => undefined`. Teste: `› "Carregar mais" de um filtro lê` (`:318`).
   - `apps/web/src/api/governanca.ts:63-65`, `CONSULTAS_POR_ESTADO`. Mutação: `aprovada: consultaDoResumoDoEstado('pendente')`. Teste: `› escolher "Aprovados" chama` (`:274`).
   - `apps/web/src/areas/coordenacao/Governanca.tsx:105`, o `aoTentarDeNovo={() => void lista.refetch(…)}` do erro da lista filtrada. Mutação: `todos.refetch`. Teste: `› o filtro que falha mostra o erro` (`:180`).

   Os outros 19 blocos batem com o diff e apontam para casos que chegam à cláusula.

**Recomendações**
- `e2e/governanca.spec.ts:652`: o `page.waitForTimeout(1500)` dá a vez à resposta atrasada com um prazo fixo. É melhor esperar o fim do pedido segurado (`requestfinished` ou `requestfailed`, já que o TanStack aborta o pedido ao trocar de chave) e só então conferir a lista. O caso de componente (`:358`) já prova a regra, por isso fica como recomendação.
- Clique duplo em "Carregar mais" dentro de um filtro (o `disabled={lista.isFetchingNextPage}`) não tem caso. O teste seria: dois cliques seguidos geram um só pedido de `estado=…&pagina=…`.
- No e2e, "Rejeitados" só é exercido com o resultado vazio. O caso com dado está coberto no componente e, para `pendente`, na integração da API. Vale um caso de integração da API com `?estado=rejeitada` e dado.
- O `EXPLAIN` mediu 30,2 s em `rejeitada`, com custo quadrático na subconsulta do grupo mínimo, e estimou cerca de 100 minutos para `pendente` no volume da vitrine. A estimativa é conta, não medição. O filtro põe esse custo no caminho de "Esperando o professor". Já está no `TODO.md`, mas a Mesa deveria levar isso ao `infra-guardian`, que não está entre os revisores desta tarefa.
- `Governanca.test.tsx:379` e `Segmentado.test.tsx` provam as duas colunas no celular só pelas classes. A prova real de que o texto não sai do botão é o e2e (`rotulosQueSaem`). Está correto assim; é só para registro.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Governanca.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Governanca.test.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/api/governanca.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/governanca.spec.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/10_task.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-17 12:41:58 · `tasks/prd-telas-da-coordenacao/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/governanca.spec.ts:219-228`: os ouvintes de `requestfinished` e `requestfailed` nunca saem da página. Hoje não muda nada, porque a promessa só resolve uma vez. Mas se um próximo caso do mesmo teste pedir o filtro "aprovada" de novo, o ouvinte continua lá sem fazer nada. Vale tirar os dois com `page.off(...)` dentro de `aoTerminar`, logo depois do `resolver()`.

As duas correções que a Mesa mandou aplicar a partir das minhas recomendações foram feitas:
- **`min-w-28` registrado:** o detalhe está na tabela "Divergências" de `10_task.md` e na §9 da `techspec.md`, na seção "Como ficou na 10.0". O spec não tem `cenarios.md`, e um detalhe de estilo não pede cenário.
- **Subtarefas marcadas:** a 10.1 a 10.6 estão marcadas em `tasks.md`.

O que conferi no resto do diff:
- **Código de produto:** não mudou desde a rodada aprovada. O `Governanca.test.tsx`, que ainda não está no git, é igual ao da árvore `2c7ea40`.
- **Os seis blocos novos de "Mutações":**
  - Os trechos que cada bloco troca existem como escritos, em `Governanca.tsx:105`, `Governanca.tsx:114` e `Governanca.tsx:137`, e em `governanca.ts:55`, `governanca.ts:58` e `governanca.ts:64`.
  - O `getNextPageParam` aparece duas vezes em `governanca.ts`, mas as linhas do bloco ao redor dele separam as duas: a mutação atinge a consulta do filtro, não a da lista inteira.
  - Cada bloco cita um teste que existe em `Governanca.test.tsx`.
  - Cada mutação derruba uma asserção do teste citado. Por exemplo, chamar `todos.fetchNextPage()` no "Tentar de novo" não traz a terceira linha do filtro, e tirar o `disabled` deixa o segundo clique pedir a página de novo.
- **O e2e da resposta atrasada:** a espera fixa (`waitForTimeout`) virou a espera pelo fim do pedido antigo. O ouvinte é ligado antes de o pedido sair, e o caso em que a resposta chega e o caso em que o pedido é cancelado estão os dois cobertos.
- **TODO.md e "Recomendações sem aplicar":** cada recomendação da 1ª rodada tem destino ou motivo escrito. O item do `EXPLAIN` agora também lista os dois testes de integração da D45 que quem reescrever o grupo mínimo tem de levar.

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 12:42:50 · `tasks/prd-telas-da-coordenacao/10_task.md`

VEREDITO: APROVADO

**Cenários exigidos (2ª rodada):** as duas correções exigidas na 1ª rodada e as recomendações que entraram na ordem de correção. Ou seja:
- "Tentar de novo" da página seguinte de um filtro;
- os blocos de mutação das cláusulas novas;
- o clique duplo em "Carregar mais" dentro de um filtro;
- o fim do `waitForTimeout` no e2e;
- os itens do `TODO.md`.

**Cobertos:**

1. **"Tentar de novo" do filtro** (`Governanca.test.tsx:230-248`)
   - A página 98 do filtro agora falha na primeira chamada e responde na segunda.
   - O teste clica no botão dentro do aviso, espera três selos `aprovada` e confere que o aviso some.
   - Confere também que a página do filtro foi pedida exatamente duas vezes e que nenhuma página foi pedida fora do filtro.
   - Com `todos.fetchNextPage()`, a lista sem filtro não tem página seguinte e o terceiro selo nunca chega: o teste fica vermelho pelo motivo certo. O bloco está em `10_task.md`, e o contexto `Tentar de novo` deixa o trecho único (`Governanca.tsx:114` e `:137` têm a mesma linha do `<Botao>`).

2. **Cláusulas novas, agora com bloco.** Conferi cada uma contra o código atual e contra o teste citado:
   - **`'filtrado'` na chave** (`api/governanca.ts:55`), teste da linha 386: com a mesma chave, trocar o estado não dispara leitura nova, e a espera por `['rejeitada']` vence o prazo.
   - **`getNextPageParam: () => undefined`** (`:58`), teste da linha 325: o "Carregar mais" do filtro não aparece.
   - **`aprovada: consultaDoResumoDoEstado('pendente')`** (`:64`), teste da linha 281: o caminho `estado=aprovada` não é pedido.
   - **`todos.refetch` no erro do filtro** (`Governanca.tsx:105`), teste da linha 180: a lista filtrada continua em erro e o selo `aprovada` nunca chega.
   - O carimbo em `.processo/portao.json` registra 27 mutações provadas no documento.

3. **Clique duplo** (`Governanca.test.tsx:338-357`)
   - A resposta fica segurada por uma promessa, e o teste confere que o botão diz `Carregando…` e fica desligado.
   - Faz o segundo clique, solta a resposta e confere um só pedido de `pagina=`.
   - O bloco que tira o `disabled` fica vermelho já na asserção do `disabled`, que é a própria cláusula.

4. **E2e** (`e2e/governanca.spec.ts:221-237`): o prazo fixo virou espera pelo evento `requestfinished` ou `requestfailed` do pedido `estado=aprovada`. A escuta começa antes de o pedido sair.

5. **`TODO.md`**: o item do `EXPLAIN` agora pede os dois testes de integração, e os dois itens novos (o apoio de "Rejeitado" e a coluna "Decisão") estão registrados.

`npx vitest run apps/web/src/areas/coordenacao/Governanca.test.tsx`: 22 de 22 verdes. Não encontrei `.skip`, teste comentado, mock de coisa nossa nem chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
- **Espera do e2e** (`e2e/governanca.spec.ts:237`): o `requestfinished` chega ao Playwright quando o corpo da resposta foi recebido, que pode ser antes de a página processá-lo. Por isso a asserção seguinte pode passar antes de a resposta atrasada chegar à tela (falso verde, nunca falso vermelho).
  - Para fechar a corrida: depois do evento, esperar um quadro com `page.evaluate(() => new Promise(r => requestAnimationFrame(() => r(undefined))))`, ou voltar a "Aprovados" e ver as linhas antigas no cache da chave delas antes de conferir "Esperando o professor".
  - Não bloqueia: a cláusula da chave por estado está provada pelo teste de unidade, que fica vermelho antes desse ponto.
- **Espera fixa no teste de unidade** (`Governanca.test.tsx:400`): sobrou um `setTimeout(resolver, 50)`, com o mesmo tipo de corrida. Dá para trocar por esperar a chamada da rede falsa ser resolvida. Não bloqueia pelo mesmo motivo.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Governanca.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Governanca.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/api/governanca.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/governanca.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/10_task.md`

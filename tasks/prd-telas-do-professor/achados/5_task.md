# Achados das revisões — `tasks/prd-telas-do-professor/5_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-19 07:28:09 · `tasks/prd-telas-do-professor/5_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration nesta tarefa. Nada mudou em `apps/api` nem em `packages`. Para o teste, o fixture `e2e/__fixtures__/professor/criados.ts` grava em `artefato` com `escola_id` e `ano_letivo_id`, e lê o vínculo filtrando por `id` e `escola_id`.

Queries verificadas:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/api/src/artefato/artefato.repository.ts:63-76,89-90`: `listar` aplica `#noAlcance()` (escola e ano em curso vindos do contexto, mais o vínculo confirmado do professor). O `turmaId` só restringe por cima desse escopo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/packages/shared/src/assistente/artefato.ts:27`: `esquemaConsultaArtefatos` é `.strict()` e aceita só `turmaId` (UUID) e paginação. Não há `escolaId` no corpo nem na query string.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/artefatos.ts`: `consultaArtefatos(turmaId?)` manda só `turmaId` e `pagina`. A chave da consulta começa por `CHAVE_DOS_ARTEFATOS`, então a invalidação alcança a lista com e sem turma.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Criados.tsx:94-115`: os nomes das turmas e das disciplinas vêm de `consultaMeusVinculos`, que é escopado pelo token. Uma turma de fora no endereço aparece como "Outra turma", igual a uma que não existe. `criados.ts` descarta o `?turma=` que não for UUID antes de mandar ao servidor.

Teste de isolamento: presente e efetivo.
- O caso `e2e/professor-criados.spec.ts:268-303` roda contra a API real. Sem o escopo, a contagem de 1 documento quebra (o banco de teste tem os documentos de outras execuções) e o título da escola vizinha aparece. A mutação declarada sobre `#noAlcance()` cobre isso.
- O texto da tela com a turma de outra escola é comparado com o texto para um UUID inexistente e precisa ser idêntico (regra 10, item 6).
- O caso `:305-341` faz a troca de escola, inclusive com a turma da escola A no endereço depois de entrar na B.
- O filtro `turmaId` contra outra escola já estava coberto na API, em `apps/api/src/artefato/artefato.int.test.ts:256-265,311`.

Os demais itens não têm achado: os ids são UUID (`z.uuid()` no contrato e o UUID validado no cliente), a camada rede não é tocada e nenhum `@SemEscopo()` foi introduzido.

Bloqueantes: nenhum.

Recomendações:
- A mutação do e2e (`artefato.repository.ts`) tira o `#noAlcance()` inteiro. Isso prova o isolamento visto da tela, mas não separa a cláusula de `escolaId` da cláusula de vínculo. Hoje isso já é coberto pelo `artefato.int.test.ts`. Se o repositório for mexido, vale uma mutação só sobre `eq(artefato.escolaId, ...)` no teste de integração.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 07:28:27 · `tasks/prd-telas-do-professor/5_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: computador e celular, escola cheia e vazia). O diálogo "Filtrar" do celular não foi fotografado. O comando falhou com `--clicar 'text=Filtrar'` porque no computador esse botão não existe. Esse diálogo foi revisado só pelo código.
Estados: ok. Carregando (`Criados.tsx:174`), erro com "Tentar de novo" (`:175`), vazio que convida (`:177-183`, visto nas fotos) e com dado agrupado por turma. Há ainda dois estados de filtro sem resultado, "até aqui" e "Nada com estes filtros", e os dois levam a um próximo passo.
Acessibilidade: ok pelo código.
- A lista é um `<ul>` de `<li>` com a linha inteira como link.
- O diálogo de filtros tem grupos com `role="group"` e `aria-label`.
- Na troca de lista, o foco vai para o título ou para o primeiro documento novo (`:119-128`, `:137`).
- O selo "Esperando você" traz texto e ícone, não só cor.
- A turma entra em `sr-only` no nome do link.

Chromebook fraco:
- A tela é carregada por `lazy()` (`rotas.tsx:16-17`) e a paginação tem "Ver mais".
- Não há virtualização, mas a lista é paginada pelo servidor, o que é o que a regra 80 pede.
- O filtro de turma vai ao servidor e tipo e estado filtram em memória.

Celular: ok.
- As fotos a 360 px não mostram rolagem horizontal nem sobreposição.
- "Filtrar" e "Ver mais" usam `Botao`, e cada linha tem `min-h-16`.
- Os `Toque` do diálogo têm `min-h-11`.
- `casca-no-celular.spec.ts` confere o alvo de 44 px da barra com os quatro lugares.
- O projeto `celular` do Playwright não foi rodado por mim.

Ação oficial protegida: sim. A tela é só leitura. Não há aprovar, publicar nem excluir, e o selo de estado só informa.
Bloqueantes: nenhum.

Recomendações:
1. A barra de baixo a 360 px mostra "FERRAMEN…" (foto `professora--professor-criados--link-name-Criados--celular.png`; `BarraDeBaixo.tsx:73`, rótulo com `truncate`). O quarto item tirou a largura que "FERRAMENTAS" tinha com três.
   - Não bloqueio porque o corte é o comportamento documentado do componente (`BarraDeBaixo.tsx:41-43`, `docs/interface.md` 11.1) e o mockup também tem os quatro lugares.
   - O nome acessível continua inteiro, mas o rótulo visível de uma navegação principal fica cortado. Vale reduzir o `tracking` ou a caixa-alta do rótulo na próxima tarefa que mexer na barra.
2. A 360 px o título do documento corta em "Estequiometria: versã…" (`Linha.tsx:60`, `truncate`, com `title` como único recurso). É o desenho da `Linha` na D80 (`interface.md` 10.2), mas no celular o `title` não aparece. Duas linhas de título na lista de Criados resolveriam, já que o título é o que a professora usa para distinguir documentos parecidos.
3. A lista de Criados mostra só o título e o tipo do documento, sem marca de IA na linha, como a lista antiga em Ferramentas. A marca está no documento aberto (6.0). Confirme lá que a marca está presente (regra 70, item 4a).
4. A tabela "Recomendações sem aplicar" do `5_task.md` está vazia, o que é coerente com nenhuma recomendação anterior. Registre as três acima no `/validar`.

Os caminhos das fotos estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/.processo/vitrine/`.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-19 07:30:32 · `tasks/prd-telas-do-professor/5_task.md`

VEREDITO: REPROVADO
Escopo: incompleto
Aderência à Tech Spec: ok
Portão local: carimbo válido

**Bloqueantes:**

1. **`apps/web/src/areas/professor/Conversa.tsx:33`**: a escolha "Usar a ferramenta…" ainda diz à professora "Salva em Ferramentas, liga à turma e cita a página.". Depois desta tarefa isso é falso: a 5.3 tirou de Ferramentas o que foi gerado, e agora isso mora em Criados. A 4.0, que é a dona da Conversa, já fechou na `spec/telas-do-professor` (`a7d86a8`) com o mesmo texto, então nenhuma tarefa vai corrigir. O próprio `docs/interface.md:1030` já usa "Salvo em Criados." como exemplo de voz.
   - **Correção exigida:** apontar o texto para Criados. Registrar a mudança na tabela de divergências do `5_task.md`, porque o arquivo não está entre os previstos. Conferir os e2e que citam o texto antigo; o portão já os pega por `e2e-que-cita-literal`.

2. **`apps/web/src/areas/professor/Artefato.tsx:93`**: o vazio do artefato indisponível termina com "O que você gerou está em Ferramentas.". A professora segue o texto e encontra só o catálogo. O `6_task.md` cuida só do "Voltar para Criados" e não cita esta frase, então ela se perde.
   - **Correção exigida:** trocar por Criados nesta tarefa, ou registrar a frase por escrito na 6.0 (`6_task.md` e `tasks.md`), com o texto e a linha.

3. **`apps/web/src/areas/professor/criados.test.ts:31-34`**: `ADAPTACAO` traz `tempoExtraPercentual: undefined` e entra no artefato por `as unknown as ArtefatoResumido['adaptacao']`. A dupla conversão é o equivalente de `any` para calar o compilador, o que a regra 40 proíbe. O dado do teste também fica com um formato que o contrato não admite.
   - **Correção exigida:** montar como `Criados.test.tsx:43` já monta (`{ tipos: ['fonte_ampliada'] }`), sem conversão.

**Recomendações:**
- **Divergência das fatias do e2e está velha:** a linha "197 casos por fatia… a próxima tarefa precisa de uma sétima fatia" do `5_task.md` não vale mais, porque a spec já ganhou a sétima fatia (`52f43fe`). No encontro, revise essa linha e a junção dos dois casos de troca de escola num só, que perdeu o motivo.
- **Conflito previsto no encontro:** `CartaoDeFerramenta.tsx:46` conflita com a 4.0, que mexeu na mesma chamada (`...consultaArtefatos` virou `...consultaArtefatos()`).
- **Comentários e documentos velhos:**
  - `apps/web/src/areas/professor/Ferramenta.tsx:18` ainda diz que o gerado "fica em 'O que você já gerou'".
  - `tasks/prd-telas-do-professor/mockup.md:229` e `:273` ainda descrevem o produto com a lista dentro de Ferramentas.
- **Falha nos vínculos passa calada:** em `Criados.tsx`, se `consultaMeusVinculos` falhar, todos os grupos viram "Outra turma" e o filtro de turma fica só com "Todas as turmas", sem nenhum aviso.
- **Código repetido:** `Criados.tsx:152-154` e `:230-232` repetem os mesmos três callbacks `OPCOES_DE_*.find(...)?.id ?? 'todos'`. Dá para extrair um conversor por filtro.
- **Texto de filtro sem resultado:** "Nenhum documento seu tem este tipo, nesta turma e neste estado." (`Criados.tsx:185`) cita os três filtros mesmo quando só um está ligado.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Conversa.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Artefato.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/criados.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Criados.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/prd-telas-do-professor/5_task.md

## test-engineer · 1ª rodada · REPROVADO · 2026-10-19 07:30:59 · `tasks/prd-telas-do-professor/5_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- os filtros (tipo, turma e estado juntos; estado só na versão adaptada; valor desconhecido cai em "todos")
- os quatro estados
- filtro sem resultado, com e sem mais páginas
- turma no servidor, tipo e estado sem nova leitura
- o voltar devolve os filtros
- os quatro lugares nas três larguras
- isolamento, com a turma de B no endereço igual a um id inexistente
- recomeço: a segunda pessoa na mesma aba, e a resposta atrasada
- domínio: duas disciplinas na mesma turma, turma sem nome conhecido ("Outra turma"), id em maiúsculas

**Cobertos:**
- filtros puros, em `criados.test.ts`
- quatro estados, "até aqui" e "Nada com estes filtros", turma com `turmaId`, tipo sem leitura, `replace`, diálogo do celular, em `Criados.test.tsx`
- e2e de voltar, de lugares, de isolamento com a API real, de troca de escola e de duas disciplinas na mesma turma
- rodei os quatro arquivos de unidade e componente: 49 de 49 verdes
- nenhum `.skip`; a API simulada só restringe por `turmaId`, e o isolamento de verdade roda contra a API real

**Bloqueantes:**

1. **Uma mutação fica vermelha pelo motivo errado.** É a de `tasks/prd-telas-do-professor/5_task.md:271-275`, que apaga `if (link) link.focus()`. A linha seguinte, `apps/web/src/areas/professor/Criados.tsx:126`, começa com `else if`. Sem o `if`, o arquivo nem compila, e o teste fica vermelho por erro de sintaxe, não pela regra do foco.
   - Correção: uma troca que compila, por exemplo `+    if (link) link.blur()`.

2. **O teste da resposta atrasada não pode falhar.** É `e2e/professor-criados.spec.ts:239-266`. Todas as asserções rodam em `/entrar`, que nunca mostra a lista. Mesmo sem o `resetQueries` de `main.tsx`, e com a resposta entrando no cache, o teste passa.
   - O mesmo vale para "a segunda pessoa não vê a lista" (`:210-237`): a segunda pessoa é a coordenação, e a guarda de papel sozinha já esconde Criados.
   - Correção: depois de a resposta chegar, uma segunda professora entra **pela tela, na mesma aba e sem recarregar**. `entrarPelaApi` faz `page.goto`, e a recarga apaga o cache, então não serve. Ela abre `/professor/criados?turma=<turma da primeira>`, e a tela não pode mostrar `confidencial`.
   - Alternativa mais barata, no padrão de `Painel.test.tsx:927`: em `Criados.test.tsx`, segurar a primeira leitura, chamar `cliente.resetQueries()`, soltar a resposta e afirmar que a lista da primeira não aparece.

3. **Cláusulas novas sem bloco na seção "Mutações".** As três primeiras não têm teste que as pegue:
   - `apps/web/src/areas/professor/criados.ts:85`, `if ('estado' in mudanca)`. Nenhum caso troca o tipo ou a turma com um estado já no endereço. Por isso a versão incondicional, que derruba o estado ao trocar o tipo, passa verde. Precisa de caso em `criados.test.ts` e de bloco.
   - `Criados.tsx:148`, `carregando`, na parte `vinculos.isPending && !artefatos.isError`. Falta um caso com os vínculos sem responder (a lista não pinta "Outra turma") e um com erro da lista e vínculos pendentes (só o erro aparece). Mais os blocos.
   - `Criados.tsx:126`: o foco cai no título quando "Ver mais" não traz documento visível. Precisa de caso e de bloco.
   - `apps/web/src/api/artefatos.ts:32`: a página junto com a turma (`?turmaId=X&pagina=Y`) não tem teste. "Ver mais" com a turma filtrada pode perder a turma sem ninguém ver. Precisa de caso e de bloco.
   - Estas duas já têm teste e só falta o bloco: `Criados.tsx:115`, uma turma uma vez só no filtro (`Criados.test.tsx:233` já prova), e `Criados.tsx:153`, o `rotuloDoDesconhecido` "Turma" enquanto os vínculos carregam.

**Recomendações:**
- `e2e/professor-ferramentas.spec.ts`: o caso do catálogo perdeu o `violacoesGraves` na tela de Ferramentas. "Como testar" pedia "sem mudar a asserção", e vale devolver essa verificação.
- O e2e do voltar (`professor-criados.spec.ts:178`) põe o filtro por `irPara`, que é um `pushState`, e não pelo menu. O `replace` já está provado no componente, mas o e2e ficaria mais fiel ao cenário filtrando pela tela.
- `Criados.test.tsx:60`: `instalar` lê a turma de `rede.chamadas.at(-1)` em vez da própria chamada. Se a leitura dos vínculos entrar no meio, o teste pode ficar vermelho à toa.
- No primeiro caso de recomeço, trocar a coordenação por uma professora: aí a guarda de papel deixa de mascarar o cache.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/prd-telas-do-professor/5_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Criados.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/criados.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Criados.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/criados.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/artefatos.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-criados.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-ferramentas.spec.ts

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-19 07:57:23 · `tasks/prd-telas-do-professor/5_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas, Criados no computador e no celular, escola cheia e vazia). Não fotografei os diálogos de Filtrar nem o documento aberto. Conferi o diálogo pelo código (`Criados.tsx`) e o documento aberto pelo diff.
Estados: ok.
- Carregando: `EstadoCarregando` em `Criados.tsx:~176`. O diff agora segura os grupos enquanto os vínculos carregam, então nenhum "Outra turma" pisca. Os casos novos de `Criados.test.tsx` provam isso.
- Vazio: "Nada gerado ainda" com o botão "Ir para Ferramentas", que diz o próximo passo. O vazio por filtro tem "Limpar filtros".
- Erro: `EstadoErro` com tentar de novo. O diff impede que o texto de espera apareça junto do erro.
- Com dado: lista agrupada por turma, com tipo, data e hora no formato local e o selo "Esperando você".

Acessibilidade: ok.
- O foco vai ao título ou ao primeiro documento novo depois de "Ver mais" e de "Limpar filtros", e o caso novo cobre o botão que sai da tela.
- A turma vai em `sr-only` na linha.
- Os filtros são menus rotulados no computador e um diálogo no celular.
- O e2e agora também confere violações graves de acessibilidade em Ferramentas.

Chromebook fraco: ok.
- A lista é paginada por "Ver mais", sem rolagem infinita, o que serve ao volume esperado. Virtualizar não se justifica ainda.
- Esta tela não tem upload de imagem.
- Não vi medição com throttling nesta rodada. O e2e `professor-criados` roda com `carregarSemRedeLenta` no caso de recomeço.

Celular: ok.
- A 360 px não há rolagem horizontal nem conteúdo cortado, no cheio e no vazio.
- Filtrar vira botão com diálogo, sem hover.
- A ação principal do vazio ("Ir para Ferramentas") tem cerca de 46 px.
- A barra de baixo tem alvos grandes.
- Os e2e cobrem o projeto `celular`.

Ação oficial protegida: sim. Esta tela só lista e abre. Aprovar e publicar ficam no documento aberto (`Artefato.tsx`), que o diff não alterou nesta rodada, a não ser pelo texto do estado vazio.

Bloqueantes: nenhum.

Os três textos que mandavam a professora para Ferramentas agora apontam Criados, o que bate com a navegação de `docs/interface.md` 11.1 (D74):
- `Conversa.tsx:33`
- `Artefato.tsx:93`
- o comentário de `Ferramenta.tsx`

O recomeço da sessão (a professora seguinte não vê a lista da anterior) passou do e2e lento para o teste de componente com `resetQueries`, mais um e2e de troca de pessoa pela tela. A cobertura da regra 10 se manteve, e a fixture `responderPor` agora passa o caminho da chamada, o que elimina uma fonte de falso resultado no teste.

Recomendações (já registradas na ordem da Mesa, nada novo a exigir):
- Em 360 px o título do documento corta com reticências ("Estequiometria: versã…", `Linha.tsx:60`, `truncate`) e a barra de baixo corta "FERRAMEN…". O primeiro desfaz a identificação da linha no celular, o segundo é de `BarraDeBaixo.tsx`. Fotos: `.processo/vitrine/professora--professor-criados--link-name-Criados--celular.png`, onde as duas linhas ficam cortadas, e a vazia, onde só a barra de baixo corta o rótulo. Ficam para o `/validar`, com duas linhas de título e rótulo menor. Não bloqueiam porque são desenho de componente que a tarefa não toca (D80), e o título completo aparece ao abrir o documento.
- A linha de Criados não traz a marca de IA (regra 70, item 4a). Conferir no documento aberto, na tarefa 6.0.
- Falha na leitura dos vínculos vira "Outra turma" sem aviso.
- O texto "Nenhum documento seu tem este tipo, nesta turma e neste estado." cita os três filtros mesmo quando só um está ligado.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Criados.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Criados.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-criados.spec.ts`

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-19 07:57:25 · `tasks/prd-telas-do-professor/5_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. O diff da 2ª rodada não traz migration nem schema.

Queries verificadas: `apps/web/src/api/artefatos.ts`, em `consultaArtefatos(turmaId?)`. O cliente manda só `turmaId` e `pagina`, nunca `escolaId`. O escopo continua no servidor, a partir do token, e a mutação nova do arquivo confere que a página seguinte mantém o `turmaId`. `Criados.tsx` e `criados.ts` não montam escopo: só filtram e agrupam o que a API já devolveu. Nenhum endpoint, repository ou `@SemEscopo()` foi alterado.

Teste de isolamento: presente e efetivo. O caso "isolamento (regra 10)" em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-criados.spec.ts:238` não mudou nesta rodada. Ele usa a API real e põe a turma de outra escola no endereço. Sem a cláusula de escopo no repositório, o documento da vizinha apareceria e o caso quebraria. Ele também confere que o nome da turma de fora não aparece e que a tela fica igual à de uma turma que não existe. O caso de recomeço reescrito (linha 209) faz uma professora de outra escola entrar na mesma aba sem recarregar, com a turma da anterior no endereço. Ele quebraria se o cache da sessão anterior entrasse na tela. A resposta atrasada que foi para `Criados.test.tsx` usa `resetQueries` e confere que a leitura da pessoa anterior não aparece.

Bloqueantes: nenhum.

Recomendações:
- O caso de e2e removido provava que a coordenação, depois de sair a professora, recebia "Página não encontrada" em `/professor/criados` sem recarregar. É guarda de papel, não de tenant. Vale o `/validar` conferir que outro e2e (por exemplo `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/areas.spec.ts`) ainda cobre esse caminho.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 07:57:56 · `tasks/prd-telas-do-professor/5_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido. Cobre o código atual: typecheck, lint, segredo, dependências, unidade e alvo.

Bloqueantes: nenhum. As três correções da 1ª rodada estão feitas.
1. `apps/web/src/areas/professor/Conversa.tsx:33` agora diz "Salva em Criados, liga à turma e cita a página.". A mudança está registrada na tabela de divergências do `5_task.md`. Procurei o texto antigo e nenhum e2e o cita.
2. `apps/web/src/areas/professor/Artefato.tsx:93` agora diz "O que você gerou está em Criados.". Está registrado na mesma linha da tabela.
3. `apps/web/src/areas/professor/criados.test.ts:31` monta `ADAPTACAO: ArtefatoResumido['adaptacao'] = { tipos: ['fonte_ampliada'] }`, sem `as unknown as`.

As cinco recomendações que a Mesa mandou aplicar também estão no código:
- a linha das fatias do e2e foi reescrita;
- o comentário em `Ferramenta.tsx:18` foi corrigido;
- as escolhas dos três filtros viraram `escolherTipo`, `escolherTurma` e `escolherEstado`;
- `violacoesGraves` voltou em `professor-ferramentas.spec.ts`;
- `instalar` agora lê a turma pelo caminho da própria chamada, com o parâmetro novo de `responderPor` em `tela.tsx`.

O guarda `!carregando` nos grupos (`Criados.tsx:198`) não esconde o erro. Quando a lista falha, `carregando` fica falso e só o `EstadoErro` aparece.

Recomendações:
- `tasks/prd-telas-do-professor/5_task.md:86`: a linha de divergência ainda diz "nova `entrarComSegundoFatorNaMesmaAba`". Esta rodada tirou essa função de `e2e/__fixtures__/casca.ts`, e hoje nenhum arquivo a usa. Tirar o trecho, para a tabela descrever o que existe.
- `e2e/professor-criados.spec.ts`: o caso que provava que o endereço `/professor/criados` responde "Página não encontrada" a quem não é professora saiu junto com a coordenação. Confira se outro e2e de guarda de papel (`areas.spec.ts` ou `professor-lugares.spec.ts`) cobre a rota nova. A decisão é do `test-engineer`.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/prd-telas-do-professor/5_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Criados.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Conversa.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Artefato.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/criados.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-criados.spec.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 07:58:46 · `tasks/prd-telas-do-professor/5_task.md`

VEREDITO: APROVADO

Cenários exigidos (para esta rodada, as três correções da 1ª):
1. A mutação do foco precisa ficar vermelha pelo motivo certo.
2. O recomeço da sessão precisa de um teste que falharia sem a regra: outra professora na mesma aba e sem recarregar, ou uma resposta atrasada que não entra depois de `resetQueries`.
3. Cada cláusula nova precisa de caso de teste e de bloco em "Mutações".

Cobertos:
1. **Foco.** A mutação agora é `if (link) link.blur()`, que compila. Fica vermelha porque o foco não vai ao documento novo, e não por erro de sintaxe.
2. **Recomeço.** Feito pelos dois caminhos:
   - **E2E**, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-criados.spec.ts`, no caso "recomeço": a primeira professora abre Criados com `?turma=<turma dela>`. Sai, e a segunda entra pela tela com `entrarPorEmail`, sem recarregar, e abre a mesma chave. O cache dura 30 s (`staleTime` em `cliente-de-consultas.ts:25`) e a chave não leva a pessoa. Sem o `resetQueries` de `main.tsx`, a lista da primeira continuaria na tela e "Nada com estes filtros" nunca apareceria, então o caso falha sem a regra. O caso também serve de isolamento: a turma da outra escola volta vazia.
   - **Componente**, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Criados.test.tsx`, no grupo "o recomeço da sessão": a primeira leitura fica segurada, vem o `resetQueries`, e a resposta solta depois não entra na tela.
   - O caso de permissão que saiu do e2e (outro papel abrindo `/professor/criados`) continua em `e2e/areas.spec.ts`, que percorre os itens do professor com a guarda de papel.
3. **Cláusulas novas.** Todas têm caso e bloco agora:
   - `if ('estado' in mudanca)`, provada em `criados.test.ts` por "trocar o tipo com o estado já no endereço".
   - `carregando`, com dois blocos: os vínculos sem resposta e a lista já lida; e a lista com erro e os vínculos sem resposta.
   - `!carregando && porTurma.map`.
   - O foco que cai no título quando "Ver mais" não traz documento visível.
   - A página junto com a turma: `?turmaId=X&pagina=Y`.
   - Uma turma uma vez só no filtro. O fixture tem 7ºA com Química e Física, o caso do professor com duas disciplinas na mesma turma.
   - `rotuloDoDesconhecido` mostrando "Turma" enquanto os vínculos carregam.
   - `escolherTurma` com "" saindo como `undefined`.
   - `npx vitest run` dos dois arquivos de Criados: 35 de 35 passam. Não há `.skip`, e nenhum mock esconde a regra: só a rede é falsa.
4. **Recomendações da rodada anterior.** As duas foram aplicadas: `violacoesGraves` voltou ao catálogo, e `instalar` lê a turma pela chamada certa (`tela.tsx` passa o caminho da chamada à função de `responderPor`).

Bloqueantes: nenhum.

Recomendações:
- `tasks/prd-telas-do-professor/5_task.md:86`: a linha ainda diz "nova `entrarComSegundoFatorNaMesmaAba`", e essa função saiu de `e2e/__fixtures__/casca.ts` nesta rodada. Corrigir o texto.
- `Criados.test.tsx`, caso "com a lista já lida e os vínculos sem resposta": a espera fixa de 50 ms (`setTimeout`) não falha à toa com o código certo. Mas, com a máquina carregada, a lista pode não ter chegado ainda, e então o caso fica verde mesmo com a mutação aplicada. Melhor esperar um sinal certo de que a resposta chegou, por exemplo esperar que a consulta de artefatos saia de `isPending` pelo `cliente`.
- O caso de componente do recomeço prova sobretudo que o TanStack cancela a leitura no `resetQueries`. Quem prova o `resetQueries` de `main.tsx` é o e2e. Vale um comentário no caso de componente dizendo isso.
- O e2e do recomeço só prova o `resetQueries` se a segunda entrada acontecer em menos de 30 s depois da primeira leitura. Hoje cabe com folga no limite de 15 s do caso. Se o `staleTime` mudar, o caso perde a força sem ficar vermelho. Vale um comentário no caso ligando-o ao `staleTime`.

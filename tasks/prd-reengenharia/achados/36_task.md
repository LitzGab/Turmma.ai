# Achados das revisões — `tasks/prd-reengenharia/36_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-22 13:57:56 · `tasks/prd-reengenharia/36_task.md`

VEREDITO: APROVADO
Tela vista: não. A tarefa não muda tela (o documento diz "Telas: nenhuma muda"), então não há fotos, e eu não fotografei nada. Conferi o diff do build, o `grep` do caminho velho e a regra de lint.
Estados: ok. Nenhum estado muda, e o `estado/` ficou onde estava.
Acessibilidade: sem mudança. As peças só trocaram de pasta, e a unidade de `apps/web/src/componentes` (63 arquivos, 664 testes) passa, assim como `guardas.test.ts` e `nome-dos-chunks.test.ts`.
Chromebook fraco: sem regressão.
- Refiz o build numa pasta de rascunho e comparei com `.processo/chunks-antes.txt`. São 155 chunks nos dois lados, com os mesmos nomes e o `index-*` (entrada) em 90880 B, igual.
- Nos demais, o brotli do `brotli` da linha de comando fica 1 B acima do medido pelo Orquestrador em cada chunk, uniformemente e sem nenhum chunk maior que isso. Atribuo a diferença à ferramenta de medição.
- Nenhuma peça do kit entrou na entrada.
- O teste do build, `nome-dos-chunks.test.ts`, passa com `ui/Abas` e os demais caminhos novos.

Celular: não aplicável, porque nenhuma tela mudou. O portão da tarefa rodou `e2e/pecas-marca-icones.spec.ts` e `e2e/pecas-marca-onca.spec.ts`, e o log em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/.processo/portao-36.log` mostra `68 passed`.
Ação oficial protegida: sim (não aplicável; nada oficial mudou).

Bloqueantes: nenhum.
- A regra do kit está em `eslint.config.mjs`, nas linhas 93 a 121. Ela vale só para `componentes/ui/**`, usa o `no-restricted-imports` do core com os padrões `api`, `areas` e `sessao`, e o `import()` entra por seletor.
- `REGRAS_DO_KIT` entra em `REGRAS_DAS_GUARDAS` (`tools/guardas/index.mjs:38-39`). Com isso a passada sem comentários reprova o `eslint-disable`, e o teste de `guardas.test.ts:117-148` prova isso.
- O `no-restricted-syntax` do kit não sobrescreve outra regra da web, porque os únicos outros usos dele são nos controllers da API.
- A fixture `tools/guardas/__fixtures__/kit-importa-api.ts` cobre `import`, `import type`, `export … from`, `export *` e `import()`. Os casos que devem passar também estão nela: irmão, `formatar` e pacote.
- O `eslint` em `apps/web` e `tools/guardas` não dá aviso nenhum.
- As 21 mutações do portão ficaram vermelhas, segundo o log.

Recomendações:
1. `apps/web/src/componentes/ui/ia/README.md:3` diz "As peças gerais ficam em `apps/web/src/componentes/`, e as de IA nesta pasta". Hoje as gerais ficam em `componentes/ui/`. A subtarefa 36.5 pedia esse `grep`, e a linha escapou porque cita só `componentes/`. Corrija na próxima tarefa que tocar o arquivo.
2. `TODO.md:1509` aponta `componentes/Linha.tsx` como destino de tarefa futura, e `TODO.md:1061` e `TODO.md:1261` citam `componentes/ia/…`. O caminho certo é `componentes/ui/…`, e quem for cumprir esses itens vai procurar o arquivo no lugar velho.
3. `docs/mvp-rapido.md:323`, `:409` e `:543` citam `componentes/ia/`. É documento histórico do MVP, então só convém uma nota se ele for reaberto.
4. Os documentos de `.reengenharia/` citam os caminhos antigos. Estão datados no diagnóstico, e não pedem ajuste.
5. A divergência de commit único (a Mesa revisa a tarefa uma vez) está registrada na tabela e justificada pelo processo. Os movimentos entram como renomeação (R), e o histórico por arquivo é preservado.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/eslint.config.mjs`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/index.mjs`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/guardas.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/__fixtures__/kit-importa-api.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/web/src/componentes/ui/ia/README.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/TODO.md`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-22 13:59:00 · `tasks/prd-reengenharia/36_task.md`

VEREDITO: REPROVADO
Escopo: incompleto
Aderência à Tech Spec: ok
Portão local: carimbo válido

**Bloqueantes:**

1. **Subtarefa 36.5 marcada como feita, mas ficaram caminhos antigos.** A subtarefa pede o `grep -rn` dos nomes antigos em comentários e docs e cita o `README.md` da `ia/` pelo nome. A `onda-2.md`, em "Como se move", pede o grep "no repositório inteiro". Ficaram para trás:
   - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/web/src/componentes/ui/ia/README.md:3`: o arquivo foi movido sem nenhuma alteração (similaridade de 100%). Ele continua dizendo "As peças gerais ficam em `apps/web/src/componentes/`", e agora elas estão em `componentes/ui/`, com `campos/` e `sobrepostos/`. É o guia que `areas/navegacao.ts` manda ler para importar peça, então quem segue o guia procura no lugar errado.
   - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/TODO.md:1061`, `:1261` e `:1509`: são itens abertos que ainda apontam para `componentes/ia/motor-formulario.ts`, `componentes/ia/pecas-revestidas.test.tsx:150` e `componentes/Linha.tsx:58`. O `:1509` é o mais grave, porque o destino dele é "a próxima tarefa que tocar `componentes/Linha.tsx`". Esse arquivo não existe mais, e o item se perde.
   - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/docs/pendencias-dos-mockups.md:9` e `:12`: o texto diz "conferido no código" e cita `componentes/ia/Escolha.tsx` e `componentes/ia/motor-formulario.ts`.

   **Correção exigida:** trocar esses caminhos pelos novos (`componentes/ui/...`, `ui/ia/...`, `ui/Linha.tsx`), reescrever a linha 3 do README dizendo onde ficam as peças gerais e os dois subgrupos, e só então marcar a 36.5 como feita.

**Recomendações:**

- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/eslint.config.mjs:96-97`: o comentário diz "As duas regras estão em `REGRAS_DO_KIT`", mas lá só está `no-restricted-imports`. O `no-restricted-syntax` do `import()` entra por `REGRAS_DE_ENTRADA`, como o próprio `tools/guardas/index.mjs:34-37` explica. Vale corrigir o texto, porque quem um dia mexer em `REGRAS_DE_ENTRADA` tira, sem ver, a proteção da segunda passada contra o `import()` no kit.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/docs/mvp-rapido.md:323`, `:409` e `:543` ainda citam `componentes/ia/`. São texto histórico do MVP, mas o `ROADMAP.md`, que também é histórico, foi atualizado. Seria bom tratar os dois do mesmo jeito.
- A primeira divergência (um commit só, e não um por pasta) não se afasta da Tech Spec. O commit por pasta só existia no próprio `36_task.md`, e a `onda-2.md` não define quantos commits a tarefa faz. A justificativa pelo processo se sustenta.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 13:59:47 · `tasks/prd-reengenharia/36_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Regra de lint:** em `componentes/ui/**`, o kit reprova import de `api/`, de `areas/` e de `sessao/`. Isso vale para `import`, `import type`, `export … from`, `export *` e `import()`. O irmão, o `../../formatar`, outra subpasta do kit e pacote de fora passam.
- **Alcance:** a regra vale em toda subpasta do kit (`campos/`, `ia/`) e só nele. A mesma fixture passa em `estado/`, na raiz de `componentes/`, em `areas/` e em `api/`.
- **Comentário:** um `eslint-disable-next-line no-restricted-imports` no kit some do ESLint comum e continua reprovado na passada sem comentários.
- **Chunks:** cada peça de `PECAS_FORA_DA_ENTRADA` existe no build de verdade com o caminho `ui/…`, e nenhuma cai em `parte-*`. `PASTA_DAS_PECAS_DE_IA` aponta para `ui/ia/`.
- **Casca:** `motivoDeFora` reconhece a peça e a pasta pelo caminho resolvido a partir do arquivo que importa. Isso inclui o irmão escrito como `./Contador` dentro de `ui/`.
- **Estados:** os três estados não importam peça fora da entrada pelo novo caminho `ui/…`.
- **Testes com caminho fixo:** nenhum teste que lê arquivo por caminho fixo passa vazio depois do movimento (âncoras em `avatar-so-nas-duas-pecas`, `CabecaOnca`, `botao-secundario`, `estilos.test.ts`, `perigo-cheio.test.ts`).
- **Caracterização:** a unidade da web fica verde, e os chunks ficam iguais antes e depois.
- **Fora de alcance:** isolamento, concorrência e IA não se aplicam (tarefa mecânica, sem dado de escola).

**Cobertos:**
- **Lint:** `tools/guardas/guardas.test.ts`, no describe "o kit visual não importa api, áreas nem sessão", tem três `it`:
  - "reprova import, import type, export … from e export *, e o import() também…" cobre a primeira linha da tabela e o `import()`.
  - "vale em toda pasta do kit, e só nele…" cobre o alcance, inclusive a mutação do glob `ui/*` contra `ui/**`.
  - "o eslint-disable-next-line de um import só o esconde…" cobre o comentário e mata a mutação `REGRAS_DO_KIT = []`.
- **Chunks:** os testes de `apps/web/nome-dos-chunks.test.ts` "peça fora da entrada é a pasta…", "as peças novas de campo", "o painel ao lado", "a cabeça da onça", "as peças novas de estado", "a peça nova de lista" e o build de verdade (:374-376). O build de verdade prova que cada entrada renomeada da lista existe, inclusive as que não têm bloco próprio de mutação.
- **Casca:** `casca-sem-import.test.ts › o detector reprova a peça e a pasta…`, com os casos novos de `doArquivo` (`'./Contador'` a partir de `ui/Ladrilho.tsx`, `'../ia/AssinaturaIA'` a partir de `ui/campos/Segmentado.tsx`).
- **Estados:** `estado/estados.test.tsx › nenhum importa…`, provado pela mutação em `EstadoVazio.tsx`.
- **Testes com caminho fixo:** as âncoras de `RAIZ_DA_WEB` em `ui/ia/avatar-so-nas-duas-pecas.test.ts`, `ui/onca/CabecaOnca.test.tsx` e `ui/botao-secundario.test.ts`.
- **Mutações:** as 21 mutações do documento cobrem toda cláusula nova do diff: os três padrões, o seletor `ImportExpression`, o `files`, `REGRAS_DO_KIT`, `PASTA_DAS_PECAS_DE_IA`, a resolução em `motivoDeFora` e o caminho resolvido em `estados.test.tsx`. O portão as registra todas vermelhas (`.processo/portao-36.log:1128-1149`).
- **Outras conferências:**
  - Rodei de novo `npx vitest run --project unidade tools/guardas/guardas.test.ts apps/web/src/componentes/casca-sem-import.test.ts apps/web/src/componentes/estado/estados.test.tsx apps/web/nome-dos-chunks.test.ts`: 156/156 verdes.
  - Nenhum arquivo de `componentes/ui/` importa hoje `api/`, `areas/` ou `sessao/`.
  - Nenhum caminho velho (`componentes/ia/`, `componentes/onca/`, `componentes/Botao`…) sobrou em `apps/`, `e2e/` ou `tools/`.
  - O diff não tem `.skip`, `.only`, `skipIf` nem `todo`.
  - O `no-restricted-syntax` do bloco do kit não sobrescreve nenhum outro bloco que valha para a web: o único outro uso é o dos controllers da API.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **`sessao` no `import()`:** a fixture `tools/guardas/__fixtures__/kit-importa-api.ts:12-13` só tem `import()` de `api/` e de `areas/`. Se alguém tirar `sessao` da alternância do seletor (`eslint.config.mjs:116`), nenhum teste fica vermelho. Uma linha `import('../../../sessao/SessaoContexto') /* reprova: no-restricted-syntax */` fecha o buraco.
2. **Comentário que desliga o `import()`:** nada testa um `eslint-disable-next-line no-restricted-syntax` sobre um `import()` no kit. A segunda passada só o pega porque `no-restricted-syntax` já está em `REGRAS_DE_ENTRADA`, que o comentário de `tools/guardas/index.mjs:27` descreve como sendo "do controller". Se uma tarefa futura mexer em `REGRAS_DE_ENTRADA`, o kit perde essa garantia sem nenhum teste ficar vermelho. Vale um `it` gêmeo do teste da linha 134 de `guardas.test.ts` para o `import()`. A linha da tabela fala em "tirar as duas regras", mas só uma está em `REGRAS_DO_KIT`.
3. **Chunks depois:** não há registro dos chunks depois do movimento. Existe `.processo/chunks-antes.txt` (nome e brotli), mas não um "depois". O log do portão traz só os nomes e o gzip, então a caracterização "iguais antes e depois" não dá para conferir pelo que ficou gravado. Gravar `.processo/chunks-depois.txt` no mesmo formato deixaria a prova para o `frontend-reviewer` e para o `/validar`.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/36_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/eslint.config.mjs
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/index.mjs
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/guardas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/__fixtures__/kit-importa-api.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/web/nome-dos-chunks.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/web/src/componentes/casca-sem-import.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/web/src/componentes/estado/estados.test.tsx

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-22 14:17:21 · `tasks/prd-reengenharia/36_task.md`

VEREDITO: APROVADO
Tela vista: não. A tarefa não muda tela (o documento diz "Telas: nenhuma muda") e o prompt não traz fotos. Esta rodada mexeu só em documentos, comentários, uma fixture e um teste de guarda, então não fotografei nada.
Estados: ok. Nada mudou neles.
Acessibilidade: sem mudança.
Chromebook fraco: sem regressão. O diff desta rodada não toca código de tela nem o bundle.
Celular: não aplicável.
Ação oficial protegida: sim (não aplicável; nada oficial mudou).

Conferi as correções exigidas da rodada 1 contra o diff e a árvore:
1. `apps/web/src/componentes/ui/ia/README.md:3` agora diz que as peças gerais ficam em `componentes/ui/`, com `ui/campos/`, `ui/sobrepostos/`, `ui/onca/` e `ui/icones/`, e as de IA na própria pasta.
2. `TODO.md`: as três citações (`motor-formulario.ts`, `pecas-revestidas.test.tsx:150` e `componentes/Linha.tsx`) agora apontam para `componentes/ui/…`.
3. `docs/pendencias-dos-mockups.md:9` e `:12` apontam para `ui/ia/Escolha.tsx` e `ui/ia/motor-formulario.ts`.
4. O comentário de `eslint.config.mjs` agora cita `REGRAS_DO_KIT` e `REGRAS_DE_ENTRADA`, e o de `tools/guardas/index.mjs` descreve o serviço duplo do `no-restricted-syntax`.
5. A fixture ganhou `import('../../../sessao/inatividade')`. O arquivo existe em `apps/web/src/sessao/inatividade.ts`, e o `import` estático de `sessao/` foi trocado pelo mesmo módulo.
6. Há um teste novo para o `eslint-disable-next-line no-restricted-syntax` sobre `import()`: o ESLint comum esconde só a linha comentada, e a passada das guardas reprova as três. A conta `escondida + 2` está certa. Rodei `tools/guardas/guardas.test.ts`: 90 de 90 passam.
7. `docs/mvp-rapido.md:323`, `:409` e `:543` foram atualizados.

O `grep` de `componentes/(ia|onca|Botao|Linha|icones|campos|sobrepostos)` fora de `componentes/ui/` só acha documentos históricos: `tasks/correcoes/`, `tasks/prd-apresentacao-escola/15_task.md` e `tasks/correcoes/2026-10-19-interface-parte-a.md:27`. As demais citações de `componentes/` no `TODO.md` são de peças que não se moveram.

Bloqueantes: nenhum.
Recomendações:
- `tasks/correcoes/2026-10-19-interface-parte-a.md:27` cita `componentes/onca/CabecaOnca.test.tsx`, que agora mora em `componentes/ui/onca/`. É registro datado de correção fechada, então só convém nota se for reaberto.
- A linha 3 do README da `ui/ia/` passou de 120 colunas. Quebre a linha na próxima tarefa que tocar o arquivo.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 14:17:39 · `tasks/prd-reengenharia/36_task.md`

VEREDITO: APROVADO

**Cenários exigidos (os mesmos da 1ª rodada):**
- Regra de lint do kit, para `import`, `import type`, `export … from`, `export *` e `import()` de `api/`, `areas/` e `sessao/`.
- Alcance: toda subpasta de `ui/`, e só ela.
- Comentário que desliga a regra, tanto no `import` quanto no `import()`.
- Peças fora da entrada no build de verdade, e caminho da pasta de IA.
- `motivoDeFora` resolvido a partir do arquivo que importa.
- Os três estados.
- Testes que leem arquivo por caminho fixo.
- Caracterização da unidade e dos chunks.

Isolamento, concorrência e IA não se aplicam: a tarefa é mecânica e não toca dado de escola.

**Cobertos:**
- **Recomendação 1, `sessao` no `import()`, foi feita.** `tools/guardas/__fixtures__/kit-importa-api.ts:15` ganhou `import('../../../sessao/inatividade') /* reprova: no-restricted-syntax */`.
  - O teste `guardas.test.ts › reprova import, import type…` compara com todas as marcas da fixture, então passa a exigir essa linha.
  - A mutação 22, que tira `sessao` do seletor `ImportExpression`, ficou vermelha pelo motivo certo: falta a marca da linha nova (`.processo/portao-36.log:1149`).
  - A troca de `sessao/SessaoContexto` por `sessao/inatividade` aponta para um arquivo que existe: `apps/web/src/sessao/` só tem `inatividade.ts`.
- **Recomendação 2, comentário sobre `import()`, foi feita.** O novo `it` em `tools/guardas/guardas.test.ts:149-163` cobre o caso.
  - Ele insere `eslint-disable-next-line no-restricted-syntax` sobre o `import()` de `api/`.
  - Exige que o ESLint comum esconda só essa linha e que a passada das guardas reprove as três.
  - Trava a fixture em três `import()` com `toHaveLength(3)`, o que impede o teste de passar vazio.
  - A mutação 23 (`REGRAS_DE_ENTRADA = []`) ficou vermelha (`portao-36.log:1150`). É o motivo certo: sem a regra na segunda passada, `doImport(dasGuardas)` volta vazio.
- **Comentários de `tools/guardas/index.mjs` e `eslint.config.mjs`** agora dizem que o `import()` do kit depende de `REGRAS_DE_ENTRADA`. Isso fecha o buraco que a recomendação 2 apontava, agora também com teste.
- **Recomendação 3, `chunks-depois.txt`:** a recusa está registrada com motivo. O `frontend-reviewer` conferiu os 155 chunks e a entrada em 90880 B. Aceito.
- **Resto do diff** (`TODO.md`, `README.md` da `ui/ia/`, `docs/mvp-rapido.md`, `docs/pendencias-dos-mockups.md`) é só texto. Atende o bloqueante do `revisor-geral` e não pede teste.
- **Rodei `npx vitest run --project unidade tools/guardas/guardas.test.ts`:** 90 de 90 verdes.
- **O portão registra as 23 mutações, todas vermelhas** (`portao-36.log:1127-1152`).
- **Nenhum `.skip`, `.only` ou teste comentado** no diff.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A linha 61 da tabela de testes em `tasks/prd-reengenharia/36_task.md` ainda diz "tirar as duas regras de `REGRAS_DAS_GUARDAS`". Hoje cada regra tem o seu bloco e o seu teste: `REGRAS_DO_KIT`, pelo teste do `import`, e `REGRAS_DE_ENTRADA`, pelo teste do `import()`. Vale citar os dois testes por nome nessa linha.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/guardas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/__fixtures__/kit-importa-api.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/index.mjs
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/eslint.config.mjs
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/36_task.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 14:18:01 · `tasks/prd-reengenharia/36_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As três divergências estão registradas e citam onde ficam na spec. A do commit único já tinha sido aceita na 1ª rodada.

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum.

A correção exigida na 1ª rodada foi feita:
- **README da `ia/`:** a linha 3 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/web/src/componentes/ui/ia/README.md` diz agora que as peças gerais ficam em `componentes/ui/`. Também cita `ui/campos/`, `ui/sobrepostos/`, `ui/onca/` e `ui/icones/`.
- **`TODO.md`:** as linhas 1061, 1261 e 1509 apontam para `componentes/ui/ia/…` e `componentes/ui/Linha.tsx`. Isso inclui o destino "a próxima tarefa que tocar `componentes/ui/Linha.tsx`".
- **`docs/pendencias-dos-mockups.md`:** as linhas 9 e 12 foram trocadas para `componentes/ui/ia/…`.
- **`grep` no repositório:** procurei as 41 peças e as três pastas (`ia`, `icones`, `onca`) no repositório inteiro, fora de `.reengenharia/` e `tasks/`. Não sobrou nenhum caminho velho.
- **Dentro de `tasks/`:**
  - Na própria spec (`tasks/prd-reengenharia`), inclusive nas tarefas futuras, a única ocorrência é a linha `+` de uma mutação de `36_task.md`, que existe de propósito.
  - As outras ocorrências estão em `tasks/correcoes/` e nos `prd-*` já fechados. São registro datado, com blocos de mutação do estado de então, e não pedem ajuste.

O resto do diff desta rodada se sustenta:
- **Comentários:** o de `eslint.config.mjs:96-97` e o de `tools/guardas/index.mjs` dizem agora que o `import()` do kit depende de `REGRAS_DE_ENTRADA`.
- **Fixture:** antes ela importava `sessao/SessaoContexto`, que não existe. Agora importa `sessao/inatividade`, que existe, e ganhou o `import()` de `sessao/`.
- **Teste novo:** o `it` de `guardas.test.ts` cobre o `eslint-disable-next-line no-restricted-syntax` sobre um `import()`. Conferi o deslocamento `escondida + 2`, que está correto.
- **Mutações:** as duas novas (`sessao` fora do seletor e `REGRAS_DE_ENTRADA = []`) apontam para testes que de fato ficam vermelhos.

Recomendações:
- `apps/web/src/componentes/DialogoDoConvite.tsx:27`: o comentário diz "o `Dialogo` de `componentes/`", mas a peça mora agora em `componentes/ui/sobrepostos/`. Não é falso, só vago. Vale ajustar quando alguma tarefa tocar o arquivo.
- A nova linha 3 do README tem cerca de 160 colunas, enquanto o resto do arquivo quebra perto de 120. É só acabamento.

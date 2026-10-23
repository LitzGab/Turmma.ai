# Achados das revisões — `tasks/prd-reengenharia/12_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 22:43:22 · `tasks/prd-reengenharia/12_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: não se aplica (a tarefa não muda login, rota nem limitador)
Fila e prioridade: ok (nenhum job, fila nem worker alterado)
Concorrência: protegida (a tarefa não grava nada nem cria operação que possa rodar duas vezes)
Índice e paginação: ok (sem query nem migration)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nada novo no caminho quente)
Bloqueantes: nenhum
Recomendações:
- O `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts` perdeu as varreduras manuais das cercas de `ResolucaoDeTenantRepository`, `ContaGlobalRepository` e `PainelRepository`, que agora ficam a cargo do `tools/guardas/camadas.cjs`. Não afeta carga, mas o `tenancy-guardian` precisa confirmar que o `camadas.test.ts` prova cada cerca, inclusive o reexport e o import dinâmico que os `it` removidos cobriam.
- O `depcruise` agora roda no `npm run lint`, sobre `apps packages tools infra e2e`, o que acrescenta tempo ao portão da tarefa e à esteira. Vale anotar a duração no `/retro`. Em produção não muda nada: `dependency-cruiser` está em `devDependencies` e o `guarda:dependencias` usa `--omit=dev`.

## tenancy-guardian · 1ª rodada · REPROVADO · 2026-10-22 22:45:01 · `tasks/prd-reengenharia/12_task.md`

VEREDITO: REPROVADO

Tabelas verificadas: nenhuma. A tarefa não cria nem altera migration, schema ou tabela.

Queries verificadas: nenhuma. A tarefa só mexe na guarda de imports. Auditei as três cercas de `@SemEscopo` (resolução de tenant, conta global e `PainelRepository`) e a troca dos `it` de varredura de `arquitetura.test.ts` pelas regras do depcruise.

Teste de isolamento: presente mas inútil contra um caminho. As fixtures provam o import direto, o `export *` e o `import()` vindos de fora da zona. Não provam o reexport feito por um arquivo de dentro da zona, e esse caminho os `it` removidos cobriam.

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.cjs:157-163` (`cerca-painel-repository`), junto com a remoção dos `it` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts:109`.
   - **O que está errado:** a cerca só olha quem importa o arquivo `painel.repository.ts`. O `painel.service.ts` pode importá-lo e, por isso, pode também reexportá-lo. Depois disso, qualquer arquivo importa o `PainelRepository` pelo `painel.service.js`, sem nenhuma violação. A pasta `operacao/` não tem regra de `index.ts`, então nenhuma outra regra pega o caso. Reproduzi numa cópia em pasta temporária: `painel.service.ts` com `export { PainelRepository } from './painel.repository.js'` e `estrutura/turma/vaza.ts` importando do `painel.service.js`. Resultado: "no dependency violations found", código 0. O `it` removido ("fora de teste, só o painel.service.ts o importa", que procurava `\bPainelRepository\b` no texto) reprovaria. Esse repository faz a leitura entre escolas, com três `@SemEscopo` (I1, regra 10 item 9), e agora qualquer módulo pode usá-lo sem o lint perceber.
   - **Correção exigida:** um teste que reprove esse caminho. Pode ser o `it` por nome de classe de volta para o `PainelRepository` (código de produção fora do próprio arquivo e do `painel.service.ts`), com a fixture do caso de reexport. Ou uma regra equivalente com fixture que a prove. Precisa de mutação declarada.

2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.cjs:150-156` (`cerca-conta-global`).
   - **O que está errado:** um arquivo de `packages/nucleo/src/ciclo-de-vida/` que reexporte a `ContaGlobalRepository` deixa outro arquivo do `nucleo` importá-la sem violação. Exemplo: `retencao/vaza.ts` importando de `../ciclo-de-vida/ponte.js`. Reproduzido com código 0. O teste dos barris (`arquitetura.test.ts:50` em diante) só olha o `@educa/nucleo` e o `@educa/nucleo/ciclo-de-vida`, não import relativo dentro do pacote. O `it` removido reprovaria, porque procurava o nome da classe fora dos dois caminhos.
   - **Correção exigida:** a mesma do item 1, para a `ContaGlobalRepository`: verificação pelo nome da classe fora de `sessao/` e de `ciclo-de-vida/`, ou regra equivalente, com fixture do reexport interno e mutação.

3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.cjs:30-38` (`soPeloIndex`) e `:143-149` (`cerca-resolucao-de-tenant`).
   - **O que está errado:** a regra do `index.ts` só vale para quem está em `apps/api/(src|test)`. Um arquivo de `sessao/` que reexporte a `ResolucaoDeTenantRepository` ou a `ContaGlobalRepository` deixa `tools/` e `infra/` importarem por ele. Reproduzido: `tools/vaza.ts` importando de `apps/api/src/sessao/login/ponte.js`, código 0. A antiga varredura cobria `tools/` e `infra/`. A linha 59 da tabela da tarefa ("via `sessao/login/x.ts` que a reexporta, reprova pela regra do `index.ts`") só é verdade para quem consome de dentro de `apps/api`.
   - **Correção exigida:** fechar `tools/` e `infra/`. Ou a regra do `index.ts` passa a valer para quem importa de `TODO_O_CODIGO`, ou a verificação por nome dos itens 1 e 2 cobre também a `ResolucaoDeTenantRepository`. Precisa de fixture e mutação.

4. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.cjs:6-8`, e R63 em `.reengenharia/DECISOES.md:137`.
   - **O que está errado:** os dois afirmam que "todo arquivo que reexporta fora da zona permitida já é, ele mesmo, um import direto, e reprova". A frase não cobre o reexport feito de dentro da zona, que é justamente o caso dos itens 1 a 3. A remoção dos `it` se apoiou nessa premissa.
   - **Correção exigida:** corrigir o comentário e registrar em `onda-1a.md`, "Como ficou (12.0)", o que cobre o reexport de dentro da zona depois das correções 1 a 3.

Recomendações:
- `TESTE` (`camadas.cjs:11`) libera das cercas e da `producao-nao-importa-teste` qualquer `src/**/__fixtures__/` ou `src/**/test/`. Hoje existem `apps/web/src/__fixtures__`, `apps/web/src/operacao/__fixtures__` e `packages/nucleo/src/ia/__fixtures__`. Vale restringir o padrão, ou deixar escrito que pasta de fixture dentro de `src/` nunca é código que vai para a imagem.
- O `import()` com caminho calculado não aparece para o depcruise, e a varredura por nome antiga o pegava em parte. Se a correção dos itens 1 a 3 for pela verificação por nome, esse caso fica coberto junto.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-22 22:45:07 · `tasks/prd-reengenharia/12_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As quatro divergências estão registradas em `onda-1a.md` T7, no bloco "Como ficou (12.0)", que é o detalhe da seção 6 da Tech Spec. Esta spec não tem `cenarios.md`. As regras `soPeloIndex` e `api-nao-importa-ops` vêm da `onda-2.md` ("As travas"), da R63 e do contexto da própria tarefa, então não invadem tarefa futura. A regra do `@educa/nucleo/db` ficou de fora com razão: esse subcaminho ainda não existe.
Portão local: carimbo válido

Bloqueantes:
- **`tools/guardas/camadas.cjs:148` e `:162`, junto com `tools/guardas/camadas.test.ts:190-210`: duas cercas podem parar de vigiar sem nenhum teste falhar.**
  - **O problema.** As cercas `cerca-resolucao-de-tenant` e `cerca-painel-repository` olham para um caminho fixo do arquivo cercado:
    - `^apps/api/src/sessao/tenant/resolucao-de-tenant\.repository\.ts$`
    - `^apps/api/src/operacao/painel/painel\.repository\.ts$`

    No repositório real, o teste só confere que não há violação. Basta mover um desses arquivos (por exemplo `sessao/tenant/` para `sessao/resolucao/`, ou `painel/` para `painel/repository/`) para a regra não casar com mais nenhum módulo. Daí em diante ela aprova tudo em silêncio. O `arquitetura.test.ts` importa os dois arquivos (`:17`, `:68`, `:83`): o typecheck obriga a corrigir esse import, mas nada obriga a atualizar o `camadas.cjs`. As fixtures também não pegam o problema, porque copiam o caminho antigo.
  - **Por que isso é regressão.** Os casos removidos se protegiam disso, e é exatamente o que a linha "Cada caso removido de `arquitetura.test.ts` tem o substituto listado" pede para conferir:
    - a resolução de tenant: "a varredura enxerga o código: acha a própria classe dentro do módulo de sessão". O próprio comentário dizia que "a regra é dentro de `sessao/`, e não a subpasta onde ele mora (34.0)";
    - o painel: "fora de teste, só o `painel.service.ts` o importa", uma afirmação positiva feita pelo nome da classe.

    Só a conta global ganhou o equivalente, a aresta da redefinição de MFA (`camadas.test.ts:206`).
  - **Correção exigida.** No `describe` do repositório real, acrescentar uma checagem de presença para cada alvo cercado: o `resolved` precisa aparecer no relatório, com pelo menos uma aresta vinda da zona permitida.
    - `apps/api/src/operacao/painel/painel.service.ts → apps/api/src/operacao/painel/painel.repository.ts`;
    - um arquivo de `apps/api/src/sessao/` que leve a `apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts`.

    Com isso, mover o arquivo sem atualizar a regra deixa o teste vermelho. Declarar a mutação correspondente: trocar o caminho do `to` da cerca no `camadas.cjs` e também na árvore da fixture.

Recomendações:
- `tools/guardas/guardas.test.ts:457`: o regex `( && .+)?$` aceita qualquer coisa depois da passada das guardas. Funciona porque o `camadas.test.ts:220` confere o fim exato do comando. Vale citar no comentário qual caso fixa o comando inteiro, para ninguém afrouxar os dois ao mesmo tempo.
- `tools/guardas/camadas.cjs:44`: o `comment` da `sem-ciclo` conta a história das tarefas 10.0 e 11.0. Esse texto aparece na mensagem do lint, e quem cai na regra ganha mais com o que fazer do que com o histórico.
- `package-lock.json`: o `dependency-cruiser` subiu duas transitivas que já existiam (`acorn` de 8.18.0 para 8.19.0 e `enhanced-resolve` de 5.25.1 para 5.26.0). A guarda de dependências passou no portão. Fica só o registro de que o pacote novo mexeu em transitivas antigas.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.cjs
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/guardas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/12_task.md

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 22:47:47 · `tasks/prd-reengenharia/12_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** as 21 linhas da tabela "Testes que provam a regra" da 12.0. Com elas, os casos de borda deste tipo de tarefa:
- uma pasta de mesmo nome em outro lugar (`operacao/sessao/`);
- o reexport em dois passos;
- o import só de tipo;
- o subcaminho do pacote (`@educa/nucleo/conta-global`);
- o código gerado em `dist/`;
- um pacote de terceiro com ciclo dentro;
- a exceção por arquivo, e não pela pasta;
- a deriva do caminho cercado, quando um arquivo cercado muda de lugar, como fizeram a 34.0 e a 96.0.

O caso de permissão é quem está fora da zona e importa o arquivo cercado. O caso de isolamento são as três cercas de tenant. Não há concorrência a provar: a guarda é estática.

**Cobertos:** `npx vitest run --project unidade tools/guardas/camadas.test.ts apps/api/test/arquitetura.test.ts tools/guardas/guardas.test.ts` passa, 207 de 207.
- **Uma fixture para cada regra.** O `camadas.test.ts:168` prova que cada regra da configuração tem a sua. A lista de violações é exata para cada regra (`:172`), e o total é exato (`:176`), então nenhum arquivo de controle é acusado.
- **Ciclo só de tipo:** `a.ts` e `b.ts`.
- **Direção dos pacotes:** `shared`, `nucleo` e as apps.
- **App que importa outra app:** o worker reprova, e o import entre pastas `test/` passa.
- **Web e produção:** a web não alcança `nucleo` nem backend, e produção não importa `test/`, `e2e/` nem nada com `.test` ou `.spec` no nome.
- **As camadas da API:** os casos `a` a `e` reprovam, e os controles `f` a `h` passam.
- **`sessao/login/x.ts` → `operacao/eu/y.ts`:** reprova, e o import pelo `index.ts` passa.
- **As três cercas, nas quatro formas (import, `export *`, `import()` e `tools/`):** todas reprovam.
- **Reexport via `sessao/login/reexporta-*`:** reprova pela regra do `index.ts`.
- **Teste importando o que é cercado passa,** nas cinco formas de arquivo de teste: `.test`, `.spec`, `test/`, `__fixtures__/` e `e2e/`.
- **Subcaminho da conta global:** pelo worker e pelo `infra`, reprova.
- **`eu.service.ts` contra `painel.service.ts`:** o primeiro reprova, o segundo passa.
- **`ops/`:** `app.module.ts` e `painel.service.ts` reprovam, `ops/x.ts` passa.
- **Exceção do expurgo:** `expurgo-da-escola.repository.ts` passa, e `outro.repository.ts` da mesma pasta reprova.
- **Repositório real:** a aresta da redefinição de MFA aparece no relatório, há mais de 1000 módulos e zero violações. O ciclo de tipo do `login.service` tem a mutação no código real.
- **Esteira:** toda regra é `error`, e o código de saída do CLI é igual ao número de violações. O comando das cinco pastas e o `&&` estão conferidos, a versão 18.7.0 também (no `package.json` e no instalado), e o vitest não coleta as fixtures.
- **Mutações:** cada cláusula nova do `camadas.cjs`, do `package.json` e do `vitest.config.ts` tem o seu bloco. Não achei `.skip`. Não há mock nosso, só um `drizzle-orm` de mentira, que é de terceiro. Não há chamada a provedor de IA.

**Bloqueantes:**
1. **Duas cercas de tenant ficam caladas se o arquivo cercado mudar de lugar, e nenhum teste perceberia.** Arquivos: `tools/guardas/camadas.cjs:148`, `:162` e `tools/guardas/camadas.test.ts:190-210`.
   - **O problema.** As cercas `cerca-resolucao-de-tenant` e `cerca-painel-repository` olham para um caminho fixo: `sessao/tenant/resolucao-de-tenant.repository.ts` e `operacao/painel/painel.repository.ts`. A fixture copia esse mesmo caminho, então continua verde mesmo que o arquivo de verdade saia dali. No repositório real, só a cerca da conta global é ancorada, pela aresta em `:206-209`. Para a resolução e para o painel, o teste real só exige zero violações.
   - **O que acontece.** Se o arquivo for renomeado, ou mudar de subpasta como já aconteceu na 34.0 e na 96.0, a cerca não acha nada. Se a `ResolucaoDeTenantRepository` sair de `sessao/`, que é exatamente o que a regra proíbe, tudo continua verde.
   - **O que o diff tirou.** Os casos de `arquitetura.test.ts` que protegiam disso saíram:
     - "a varredura enxerga o código: acha a própria classe dentro do módulo de sessão", que achava o arquivo pelo nome e exigia que ele estivesse em `sessao/`;
     - "fora de teste, só o painel.service.ts o importa", que exigia que esse importador existisse, pelo nome da classe.
   - **Por que bloqueia.** Esses dois casos não têm substituto. Isso fere a linha 19 da tabela ("o que continua protegendo") e a regra 10, item 5: se a cláusula some, o teste não quebra.
   - **Correção exigida.** No `describe` "a guarda de camadas no repositório de hoje", acrescentar um teste: para cada regra com `to.path` em `REGRAS`, algum módulo do relatório real tem de casar com o padrão. Exigir também as arestas legítimas:
     - `apps/api/src/operacao/painel/painel.service.ts → apps/api/src/operacao/painel/painel.repository.ts`;
     - ao menos um arquivo de `apps/api/src/sessao/` apontando para `apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts`.
   - **Mutação.** Declarar o bloco que altera o `to` de cada cerca, apontando para o teste novo.

**Recomendações:**
- **O bloco do `tsConfig` não prova o caso "0 módulos" (R7).** Com o arquivo inexistente, o vermelho provável vem da asserção sobre o stderr em `camadas.test.ts:53`, e não do `totalCruised > 1000` nem da aresta. Nenhum bloco reproduz uma rodada calada com 0 módulos. Vale um bloco com o nome do teste da aresta (`:206`), por exemplo com o `conditionNames: ['import']`, que já fica vermelho pelo motivo certo.
- **Duas mutações da tabela não viraram bloco.** A linha 7 pede "tirar `tools` do comando" e a linha 11 pede "trocar por `operacao/`". As duas são pegas pelos testes atuais, pelo `toBe` exato e pelos casos de `eu.service.ts`, mas o portão não as provou.
- **"A cerca é o arquivo, não a pasta" vale contra `operacao/`, não contra `operacao/painel/`.** Nenhuma fixture põe outro arquivo, que não seja controller, dentro de `operacao/painel/` importando o repository. Uma exceção alargada para a pasta `painel/` passaria.
- **O comando do `lint` não está fixado por inteiro em lugar nenhum.** `tools/guardas/guardas.test.ts:457` passou a aceitar `( && .+)?$`, e `camadas.test.ts:220` confere só o fim. Um único `toBe` com o comando inteiro, num dos dois testes, fecha a combinação.
- **A rodada real exclui só as fixtures da 12.0.** O `exclude` deixa de fora `__fixtures__/camadas/`. As fixtures de outras guardas (`tools/guardas/__fixtures__/*`, da 9.0 e da 13.0, e `tools/ci/fixtures/`) entram no grafo real. Uma fixture com ciclo, de outra tarefa, quebraria o `lint` por fora. Vale excluir todo `__fixtures__/` e `tools/ci/fixtures/`, ou registrar a escolha.
- **Mutação trocada.** A tabela pede `aceitar o painel.service.ts` na linha de `ops/`, e os blocos tiram o `pathNot` inteiro. As duas ficam vermelhas, mas o que foi provado é a variante mais larga.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/12_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.cjs
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/__fixtures__/camadas/
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/guardas.test.ts

## infra-guardian · 2ª rodada · APROVADO · 2026-10-22 22:59:33 · `tasks/prd-reengenharia/12_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (não foi tocado)
Fila e prioridade: ok (não foi tocada)
Concorrência: protegida (o diff não grava nada em runtime)
Índice e paginação: ok (não há query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não há código novo no caminho quente)
Bloqueantes: nenhum
Recomendações:
- Desde a rodada aprovada, o diff só mexe em teste, fixture, comentário e texto: a varredura por nome em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts`, a fixture `relatorio.ts`, o `it` do grafo real e a fixação do comando `lint` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.test.ts`, mais os comentários de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.cjs`. Nada disso chega à API, ao realtime, ao worker nem à fila. Rodei os dois arquivos de teste alterados: 94 testes passaram em 7 s.
- Continua valendo a recomendação da 1ª rodada: o `/retro` deve anotar quanto tempo o `guarda:camadas` acrescenta ao `npm run lint` no portão e na esteira (a linha de base em `onda-1a.md` é 2,9 s). O novo `it` do grafo real usa o mesmo relatório que os outros `it` "real" e não roda o `depcruise` outra vez.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 23:00:14 · `tasks/prd-reengenharia/12_task.md`

VEREDITO: APROVADO

Cenários exigidos (2ª rodada, ponto 1 da correção):
- Cada regra com `to.path` em `REGRAS` casa com algum módulo do relatório real.
- Estão no grafo real as arestas legítimas `painel.service.ts → painel.repository.ts` e de algum arquivo de `apps/api/src/sessao/` para `resolucao-de-tenant.repository.ts`.
- Há um bloco de mutação que altera o `to` de cada cerca e aponta para o teste novo.
- Os dois casos tirados de `arquitetura.test.ts` ("a varredura enxerga o código" e "fora de teste, só o painel.service.ts o importa") ganharam substituto.

Cobertos:
- **O alvo de cada regra existe.** O teste `tools/guardas/camadas.test.ts › real: todo alvo de regra existe no grafo, e as arestas legítimas das cercas estão nele` (linhas 207-223) passa por todas as regras com `to.path` e exige que algum `modules[].source` case com o padrão. Assim a cerca que olha para um arquivo que mudou de lugar fica vermelha.
- **As arestas legítimas estão no grafo.** O mesmo teste exige `painel.service.ts → painel.repository.ts` e `sessao/** → resolucao-de-tenant.repository.ts`. Exige também `sessao/** → conta-global.repository.ts`, que vai além do pedido.
- **Mutações das três cercas.** Os blocos em `tasks/prd-reengenharia/12_task.md:649-668` trocam o caminho de cada cerca por um nome que não existe: resolução de tenant, `CONTA_GLOBAL` e painel. Os três apontam para o teste novo. Se a cerca olha para o vazio, só esse teste pode ficar vermelho.
- **Substitutos do `arquitetura.test.ts`.** O novo `describe` em `apps/api/test/arquitetura.test.ts:53-96` tem três casos:
  - "a varredura enxerga o código" exige mais de 100 arquivos e ao menos um uso de cada classe dentro da zona dela, para a varredura não sair vazia;
  - a varredura real não acha nenhum uso fora da zona;
  - uma tabela fixa cobre a ponte em `sessao/` e em `ciclo-de-vida/`, o reexport pelo `painel.service.ts`, o `tools/` e o `infra/`, e um outro arquivo da pasta do painel. Ficam de fora o teste, a fixture, o comentário e uma string com `conta-global` (`metricas.ts`).
- **Mutações da varredura por nome.** Os blocos `12_task.md:698-759` tiram cada classe, encolhem a zona, alargam a zona do painel para a pasta, tiram o filtro de teste ou o de fixture e desligam o `semComentarios`. Cada um tem asserção exata (`toEqual`) que o derruba.
- **A cerca vale para o arquivo, não para a pasta.** A nova fixture `apps/api/src/operacao/painel/relatorio.ts` entra em `ESPERADAS`. Com ela, a mutação `pathNot: '^apps/api/src/operacao/painel/'` (`12_task.md:684-689`) passa a ficar vermelha pelo motivo certo.
- **O comando `lint` inteiro.** `camadas.test.ts:240` agora compara o comando todo com `toBe`. Isso fecha a brecha das duas asserções frouxas (começo e fim) nas mutações do `package.json`.
- Rodei `npx vitest run --project unidade tools/guardas/camadas.test.ts apps/api/test/arquitetura.test.ts`: 94 testes passaram nos 2 arquivos. Não há `.skip` nem mock. Não há IA nem operação concorrente nesta tarefa.

Bloqueantes: nenhum.

Recomendações:
1. A tabela "Testes que provam a regra" (`12_task.md:50-71`) não tem linha para os dois testes novos: o `real: todo alvo de regra existe no grafo…` e o `describe` "o nome das classes cercadas só aparece dentro da zona…". Acrescentar as duas linhas, com a mutação de cada uma, para o `/validar` achar onde está a prova.
2. A varredura por nome lê só `.ts`, `.tsx`, `.mts`, `.js` e `.mjs` (`arquitetura.test.ts:33`). Um `.cjs` ou `.cts` de produção que cite a classe escapa. Hoje não existe nenhum fora de `tools/guardas/camadas.cjs`, mas vale incluir as duas extensões ou deixar escrito por que ficam de fora.
3. Há blocos de mutação repetidos em `12_task.md`: o de 790 é igual ao de 804, e o de 797 é igual ao de 811. Isso não muda nada, só alonga o portão. O de 793/807 (`--config/guardas/camadas.cjs`) quebra o caminho da configuração em vez de tirar só `tools` da lista de pastas. Ele fica vermelho, mas por um motivo mais largo do que o nome sugere, e vale reescrever para tirar só `tools`.
4. As duas pendências que foram para o `TODO.md` (o `TESTE` que libera `src/**/__fixtures__/` e o `exclude` que pega só `__fixtures__/camadas/`) estão bem registradas. A 13.0 precisa mesmo decidir o `exclude`, porque mexe nele.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.cjs
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/__fixtures__/camadas/apps/api/src/operacao/painel/relatorio.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/12_task.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 23:00:28 · `tasks/prd-reengenharia/12_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

**A correção da 1ª rodada foi feita.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/camadas.test.ts:207-223`, o caso `real: todo alvo de regra existe no grafo…` agora reprova quando:
- o `to.path` de alguma regra não casa com nenhum módulo do grafo real;
- falta uma das três arestas da zona permitida: `painel.service.ts → painel.repository.ts`, `sessao/ → resolucao-de-tenant.repository.ts` e `sessao/ → conta-global.repository.ts`.

As mutações que trocam o caminho do `to` das três cercas estão declaradas e apontam para esse caso. Não trocam o caminho na árvore da fixture também, mas isso não muda nada: o portão só roda o teste citado, e ele fica vermelho do mesmo jeito. A árvore conferida é a de `59d15e2`.

**A varredura por nome que voltou ao `arquitetura.test.ts`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts:42-109`) cabe na 12.4. A subtarefa tira só o que as regras cobrem. Pela R63, a regra de import direto não enxerga uma classe cercada que um arquivo de dentro da zona reexporta (uma "ponte"), e quem cobre esse caso é essa varredura. A zona do painel é por arquivo, e não pela pasta, como na cerca. A fixture nova `operacao/painel/relatorio.ts` confirma isso dos dois lados. A mudança está escrita em `onda-1a.md`, "Como ficou (12.0)".

**O `lint` agora é conferido como uma string exata** em `camadas.test.ts:240`, sem mudar o comando. A afirmação do `guardas.test.ts:456` continua valendo. Os dois itens da ordem de correção que ficaram como dívida estão escritos no `TODO.md`.

Recomendações:
- `12_task.md`, tabela "Divergências resolvidas": falta uma linha dizendo que a varredura por nome continua, reduzida, com destino `onda-1a.md` "Como ficou (12.0)". Hoje a linha da tabela de testes "ficam `:146`, `:160`, `:175`, `:215`…" não a cita, e quem ler só a tarefa acha que ela saiu.
- `arquitetura.test.ts:286`: o `deTeste` não reconhece `*.spec.ts` nem `*.test.tsx`, e o `TESTE` do `camadas.cjs:148` reconhece. Por isso a varredura por nome é mais rígida que a cerca e pode reprovar um teste da web que cite a classe. Use o mesmo critério de "teste" nos dois arquivos, ou explique por escrito por que diferem.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-22 23:00:42 · `tasks/prd-reengenharia/12_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta tarefa. Ela só mexe na guarda de import (`tools/guardas/camadas.cjs`) e nos testes de arquitetura, sem migration.

Queries verificadas: nenhuma query nova. Auditei as três cercas da regra 10, item 9 (`cerca-resolucao-de-tenant`, `cerca-conta-global`, `cerca-painel-repository`), o `soPeloIndex` e a varredura nova por nome em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts:42-109`. A árvore de trabalho é a mesma de `59d15e2` (hashes de `camadas.cjs`, `camadas.test.ts` e `arquitetura.test.ts` conferidos). Os 3 testes novos passam.

Teste de isolamento: presente e efetivo.
- **Correção 1 (reexport pelo `painel.service.ts`):** feita. `usosForaDaZona` reprova quem cita `PainelRepository` fora de `painel.service.ts` e `painel.repository.ts`. A zona são os dois arquivos, não a pasta, e isso vale também no depcruise (fixture `operacao/painel/relatorio.ts`). Se a entrada do `PainelRepository` sai de `ZONAS_DAS_CLASSES_CERCADAS`, o caso `estrutura/turma/vaza.ts` some da lista esperada e o teste quebra. Há mutação declarada para isso e para a zona alargada à pasta.
- **Correção 2 (ponte em `ciclo-de-vida/`):** feita. O caso `packages/nucleo/src/retencao/vaza.ts` usa `../ciclo-de-vida/ponte.js`. Há mutação que remove a entrada e outra que estreita a zona só a `sessao/`.
- **Correção 3 (`tools/` e `infra/`):** feita. A varredura por nome não filtra por pasta e cobre a `ResolucaoDeTenantRepository`. Os casos `tools/vaza.ts` e `infra/vaza.ts` passam por `sessao/login/ponte.js`, e há mutação declarada.
- **Correção 4:** feita. O comentário de `camadas.cjs:6-11` foi corrigido e o `onda-1a.md`, em "Como ficou (12.0)", registra que o reexport feito de dentro da zona é coberto pela varredura por nome, e o do barril pelos `it` dos barris.
- O novo `real: todo alvo de regra existe no grafo` fecha a cerca que ficaria olhando um caminho que não existe mais, com três mutações.

Bloqueantes: nenhum.

Recomendações:
1. **Reexport com outro nome, feito de dentro da zona.** A varredura olha o nome e não vê um alias. Exemplos: `export { PainelRepository as Leitor }` no `painel.service.ts`, ou `export { ResolucaoDeTenantRepository as R }` numa ponte de `sessao/`. Daí `tools/`, `infra/` ou qualquer arquivo da API importa `Leitor` sem violar nada. O efeito é o mesmo de a zona expor a classe por uma função que a devolve, e nenhuma guarda estática pega isso, por isso não bloqueio. Se quiserem fechar barato: reprovar `export` do nome da classe (e `export *` do arquivo dela) em arquivo da zona que não seja o da própria classe nem um barril permitido.
2. **`arquitetura.test.ts:31`: nenhum teste prova que a varredura real lê `tools/` e `infra/`.** Se essas pastas saírem da lista de `arquivosDoRepositorio`, nada fica vermelho: o caso sintético testa só o filtro, e o primeiro `it` só procura as classes dentro da zona (em `apps` e `packages`). Sugiro que o primeiro `it` exija ao menos um arquivo lido em cada uma das quatro pastas, com uma mutação que tire `tools` da lista.
3. **A varredura por nome não lê `.cjs` nem `.cts`.** Um `require(...)` de uma ponte num `.cjs` em `tools/` passa pelos dois controles. Basta acrescentar as duas extensões ao filtro da linha 32.
4. **Pastas `test/` dentro de `src/` ficam fora da varredura.** `deTeste` e o filtro de `__fixtures__` deixam de fora qualquer `src/**/test/` e `src/**/__fixtures__/`, o mesmo furo do `TESTE` que já está no `TODO.md`. Vale tratar os dois juntos.

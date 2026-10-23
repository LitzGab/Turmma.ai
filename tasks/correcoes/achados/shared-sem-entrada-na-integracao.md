# Achados das revisões — `tasks/correcoes/shared-sem-entrada-na-integracao.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 01:50:00 · `tasks/correcoes/shared-sem-entrada-na-integracao.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (a correção não toca rate limit)
Fila e prioridade: ok (a correção não toca fila)
Concorrência: protegida (a correção não grava nada, então não há corrida possível)
Índice e paginação: ok (não há query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (é configuração de teste, fora do caminho quente)
Bloqueantes: nenhum
Recomendações:
- O teste novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/resolucao-do-shared.test.ts`. Ele sobe um `createVitest` completo dentro do projeto `unidade`, com prazo de 60 s, o que deixa a unidade mais lenta a cada execução do portão. Vale medir o tempo dele. Se passar de alguns segundos, convém marcar o caso como lento ou levá-lo para uma suíte de `tools/ci` que só rode quando `vitest.config.ts` mudar.
- A correção depende de uma chave interna do Vitest 5: o ambiente `__vitest__`, configurado em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/vitest.config.ts:35`. O teste já pega a troca desse nome numa atualização de versão, porque `ambiente?.` vira `undefined` e a asserção falha. Falta só registrar isso no comentário, para quem atualizar o Vitest saber por que o teste ficou vermelho.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 01:50:09 · `tasks/correcoes/shared-sem-entrada-na-integracao.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de esteira, sem seção da Tech Spec envolvida. A mudança é uma linha de configuração de teste e não toca arquitetura, `compose`, Dockerfile nem a esteira, como o documento diz.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

O que conferi:
- **A correção.** `vitest.config.ts` passa as mesmas `condicoes` ao environment `__vitest__`. Sem a condição `source`, o `globalSetup` resolvia `@educa/shared` para o `dist`, e o `exports` de `packages/shared/package.json` confirma isso. Nesta árvore não há `packages/shared/dist`, e esse é exatamente o cenário da esteira.
- **O teste e a mutação.** `tools/ci/resolucao-do-shared.test.ts` compara o id resolvido com o caminho exato de `src/index.ts`. Por isso continua vermelho sem a linha mesmo numa máquina que tenha o `dist` construído: o id seria `dist/index.js` e daria diferente. A mutação declarada é a própria linha da correção e cita esse teste.
- **Por que o portão não roda a integração.** A integração e a infra não fazem parte do portão desta correção, porque nenhum arquivo de lá foi alterado. A prova de ponta a ponta ficou declarada como reprodução manual (o `compose.int.test.ts` sem `dist`), e a esteira confirma no próximo push. Isso segue a regra 40.

Recomendações:
- `tools/ci/resolucao-do-shared.test.ts:15` lê `vite.environments.__vitest__` e `pluginContainer`, que são API interna do Vitest e do Vite. Se o Vitest mudar, o teste quebra por dentro e não pela regra. O `?.` já faz a ausência virar vermelho em vez de passar calado, então basta saber disso numa troca de versão.
- O teste monta um Vitest inteiro dentro da unidade (prazo de 60 s). Vale ver quanto tempo ele leva na esteira. Se pesar, ele pode ir para um projeto que não rode a cada tarefa.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 01:50:16 · `tasks/correcoes/shared-sem-entrada-na-integracao.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: `@educa/shared` resolve para `packages/shared/src/index.ts` no runner do `globalSetup`, sem `dist` construído.
- Borda 1: a máquina sem `dist`, como a esteira. Sem a correção, a resolução devolve `undefined`.
- Borda 2: a máquina com `dist`, como a de quem já rodou `npm run build`. Sem a correção, a resolução cai em `dist/index.js`. Foi por isso que o portão da 25.0 passou.
- Permissão, isolamento de escola e concorrência não se aplicam: a correção é configuração de teste, não toca dado nem caminho que roda duas vezes.

**Cobertos:**
- `tools/ci/resolucao-do-shared.test.ts:12` (`@educa/shared resolve para o src, sem depender de dist construído`) usa o `vitest.config.ts` real e resolve pelo environment `__vitest__` a partir de `contexto.ts`. A asserção é sobre o caminho exato. As duas bordas dão vermelho pelo motivo certo: na primeira o resultado é `undefined`, na segunda é o caminho do `dist`, e nenhum dos dois é o `src`.
- Nesta árvore não existe `packages/shared/dist`, a mesma condição da esteira. O teste passou aqui (1 de 1).
- O arquivo cai no projeto `unidade` (`**/*.test.ts`), então roda no portão da tarefa e na esteira.
- O `git diff` muda uma linha só, a de `vitest.config.ts:35`. Ela tem o seu bloco de mutação, que cita o teste pelo nome.
- Não há `.skip`, teste comentado, mock nem chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `tools/ci/resolucao-do-shared.test.ts:15`: o teste lê o environment do projeto raiz (`getRootProject()`), mas quem roda o `globalSetup` são os projetos `integracao` e `infra`. Hoje dá no mesmo, porque os dois têm `extends: true` e herdam o `environments` do topo. Se um dia um deles deixar de herdar, ou a chave mudar de lugar, o teste continua verde com a integração quebrada. A sugestão é fazer a mesma asserção nesses dois projetos, procurando cada um pelo nome em `vitest.projects`.
2. A prova de ponta a ponta descrita no documento rodou `compose.int.test.ts` com o `dist` fora da árvore. Ela foi manual e não fica como teste, o que está certo para o portão da tarefa, que não sobe o compose. O que confirma a correção é a esteira verde nos jobs `integração` e `infra` no próximo push, e vale registrar isso na validação.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/vitest.config.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/resolucao-do-shared.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/correcoes/shared-sem-entrada-na-integracao.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 01:55:21 · `tasks/correcoes/shared-sem-entrada-na-integracao.md`

VEREDITO: APROVADO

Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de esteira: uma linha de configuração em `vitest.config.ts`, sem mexer em compose, Dockerfile ou na esteira, como o documento diz.
Portão local: carimbo válido. O `conferir` diz: "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".
Bloqueantes: nenhum

O que conferi nesta rodada:
- **Minha recomendação da rodada 1 entrou.** O comentário em `tools/ci/resolucao-do-shared.test.ts:12-15` diz que o teste lê API interna do Vitest 5 e do Vite 8 (`__vitest__`, `vite.environments`, `pluginContainer.resolveId`). Também diz o que olhar primeiro quando uma troca de versão deixar o teste vermelho.
- **A ordem da Mesa de testar por projeto entrou.** O `it.each(['integracao', 'infra'])` acha cada projeto pelo nome em `vitest.projects` e falha com mensagem quando o projeto não está na configuração. O `?.` em `__vitest__` faz a ausência do environment dar vermelho em vez de passar calada.
- **A mutação continua válida.** O cabeçalho `teste:` agora traz só o começo do nome do caso, `@educa/shared resolve para o src no projeto`. `tools/processo/mutacoes.ts:34` aceita "o nome do caso, ou um pedaço dele", então o pedaço cobre os dois casos do `each`. O carimbo inclui o alvo.
- **O documento da correção bate com o teste.** A seção "Teste que reproduz" foi atualizada junto com o código, com os dois casos e a menção à API interna.

Recomendações:
- `tools/ci/resolucao-do-shared.test.ts:19`: cada caso do `each` monta e fecha um Vitest inteiro com `createVitest`. Montar uma vez num `beforeAll`, para os dois casos, corta o custo pela metade. Não bloqueia: hoje são dois casos, com prazo de 60 s cada.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/vitest.config.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/resolucao-do-shared.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/correcoes/shared-sem-entrada-na-integracao.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 01:55:21 · `tasks/correcoes/shared-sem-entrada-na-integracao.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz: o runner do `globalSetup` resolve `@educa/shared` para `packages/shared/src/index.ts`, sem precisar de `dist` construído.
- O mesmo vale nos dois projetos que rodam o `globalSetup`, `integracao` e `infra` (o que a Mesa pediu na rodada 1).
- Se um dos projetos for renomeado ou sair do `vitest.config.ts`, o teste fica vermelho, sem passar calado.
- Se o Vitest ou o Vite mudar o nome ou o lugar do environment `__vitest__`, o teste também fica vermelho.
- Não entram aqui permissão, isolamento entre escolas nem concorrência: é configuração de teste, sem dado de escola e sem operação que rode duas vezes.

Cobertos:
- **Os dois projetos:** em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/resolucao-do-shared.test.ts`, o `it.each(['integracao', 'infra'])` procura cada projeto pelo nome em `vitest.projects`. Se o projeto não existir, o `expect(projeto, ...).toBeDefined()` reprova.
- **Environment ausente:** a busca é `projeto?.vite.environments.__vitest__?.pluginContainer.resolveId(...)`. Se o `__vitest__` sumir, o resultado é `undefined` e a asserção sobre o `id` reprova. O comentário novo explica esse comportamento e avisa que o teste depende de API interna do Vitest 5 e do Vite 8.
- **A asserção confere o resultado:** o teste compara o `id` resolvido com o caminho exato de `packages/shared/src/index.ts`. Não é só "rodou".
- **A mutação ainda alcança os dois casos:** o bloco agora cita o pedaço de nome `@educa/shared resolve para o src no projeto`. O `tools/processo/mutacoes.ts` (linha 180) passa esse texto ao `-t`, que acha os dois casos. Sem a linha `environments: { __vitest__: ... }`, o caso `integracao` (o da esteira que caiu) fica vermelho. Basta um deles vermelho para a mutação contar como provada. Quem prova a mutação com o teste novo é o portão da tarefa, e não esta auditoria.
- **Execução:** `npx vitest run tools/ci/resolucao-do-shared.test.ts` deu 2 testes, 2 verdes. Não há `.skip`, mock nem provedor de IA.
- **O documento confere com o teste:** a seção "Teste que reproduz" cita os dois casos pelo nome, e a mutação acompanha a troca de nome.

Bloqueantes: nenhum.

Recomendações:
- O `createVitest` sobe a configuração inteira duas vezes, uma em cada caso. Hoje leva 247 ms no total. Se ficar mais pesado, dá para criar a instância uma vez num `beforeAll`. Não bloqueia.

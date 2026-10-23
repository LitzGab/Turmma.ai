# Achados das revisões — `tasks/prd-reengenharia/24_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 23:22:10 · `tasks/prd-reengenharia/24_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (a tarefa não toca nisso)
Fila e prioridade: ok (a tarefa não toca nisso)
Concorrência: protegida (nada novo pode rodar duas vezes ao mesmo tempo)
Índice e paginação: ok (não se aplica, nenhuma query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica, código só de esteira e de declaração)
Bloqueantes: nenhum

O que eu conferi para chegar ao veredito:
- **O `pino` saiu do worker e do despachante sem quebrar a execução.** Nenhum arquivo dos dois importa o `pino`. Ele chega pelo `@educa/nucleo` (`packages/nucleo/package.json:48`, usado em `packages/nucleo/src/log/logger.ts`). Os dois apps declaram o `@educa/nucleo` em `dependencies`. Por isso a imagem de produção (`npm ci --omit=dev --workspace …` em `infra/docker/worker.Dockerfile:30` e `infra/docker/despachante.Dockerfile:30`) continua instalando o `pino`. O `npm ls` confirma `worker → nucleo → pino@10.3.1`.
- **`jose` (realtime) e `drizzle-orm` (worker) entraram como `devDependencies`, e está certo.** Hoje só os testes os usam (`apps/realtime/test/sistema.int.test.ts`, `apps/worker/test/expurgo*.int.test.ts`), e a imagem de produção, montada com `--omit=dev`, não precisa deles.
- **Nenhuma versão existente mudou no `package-lock.json`.** Comparei o lock antes e depois, pacote por pacote. Entraram 53 pacotes novos, todos trazidos pelo knip. Fora isso, só ganharam uma cópia a mais o `zod` 4.6.7 e o `@oxc-project/types` 0.154.0, também do knip. As versões que já existiam ficaram iguais.
- Os três arquivos de teste da tarefa passam: 44 testes. Rodei `tools/ci/scripts.test.ts`, `tools/ci/dependencias.test.ts` e `tools/guardas/knip.test.ts`. Nenhum chama provedor pago.

Recomendações:
- O argumento do knip aparece em dois lugares: a constante `ARGUMENTOS_DO_KNIP` (`tools/ci/etapas-de-guarda.ts`) e o texto do script `guarda:dependencias` no `package.json`. Hoje o teste do `knip.test.ts` mantém os dois iguais. Quando o `tools/processo/` puder mudar (tarefa 92.0), vale o portão chamar a etapa direto, e o texto do script deixa de existir em duplicado.
- O caso "o repositório inteiro, com o knip.json da raiz, sai limpo" roda o knip no repositório todo e tem prazo de 60 s. Ainda não pesa, mas convém olhar a duração dele na esteira à medida que o repositório cresce.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 23:22:23 · `tasks/prd-reengenharia/24_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/knip.test.ts`: o caso "o repositório inteiro, com o knip.json da raiz, sai limpo" roda o knip no repositório inteiro dentro do projeto `unidade`, com prazo de 60 s. Ele repete o que o `guarda:dependencias` e a etapa do `ci:verificar` já rodam, e deixa a unidade mais lenta a cada execução. A tarefa pede esse caso e a mutação dele depende dele, então ele fica. Vale anotar o custo e olhar de novo se a unidade passar a pesar.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/dependencias.test.ts`: todos os casos afirmam `devDependency`. Hoje isso está certo: o `jose` em `apps/realtime` e o `drizzle-orm` em `apps/worker` só aparecem em `test/`, e o `pino` do processo vem de `@educa/nucleo`. Se um desses pacotes passar a ser importado em `src/`, o teste vai empurrar a declaração para o lugar errado, e a imagem com `--omit=dev` quebra. A mensagem do `expect` poderia dizer que a classificação vale porque o uso é só em teste.

O que conferi:
- **Lock:** as versões de todos os pacotes que já existiam ficaram iguais e nenhum saiu. As linhas do `@opentelemetry/*` que aparecem removidas no diff só mudaram de lugar.
- **Divergências:** as três estão registradas em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/onda-1b.md`, no RF13: a raiz com onze dependências em vez de nove, o `ignoreDependencies`/`ignoreBinaries` mais a entrada `estilos.css` da web, e o knip dentro do `guarda:dependencias`. Esta spec não tem `cenarios.md`.
- **Fora do escopo, sem mudança:** `tools/processo/` e os Dockerfiles não foram tocados.
- **Mutações:** cada cláusula nova tem uma. As quatro categorias saem da constante `ARGUMENTOS_DO_KNIP`, que o script, a etapa e o teste das fixtures leem juntos.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 23:22:57 · `tasks/prd-reengenharia/24_task.md`

VEREDITO: REPROVADO

Cenários exigidos:
- Caminho feliz: o knip roda com o `knip.json` da raiz no repositório inteiro e sai limpo.
- Trava na esteira: o `ci:verificar` chama a etapa e sai vermelho quando ela falha.
- Trava no portão: o `guarda:dependencias` roda o npm audit e depois o knip, com os mesmos argumentos.
- Cada categoria reprova a sua fixture: `unlisted`, `dependencies`, `binaries` e `unresolved`.
- Configuração sem buraco: o `ignore` é só as fixtures, e nenhuma outra chave cala o knip.
- Versões: cada dependência nova está na versão do lock, sem faixa, e o knip é `devDependency` exata em 6.42.1.
- Worker e despachante não declaram o `pino`.
- Regressão: worker e despachante sobem e logam, em integração e em infra.
- Permissão, isolamento e concorrência não se aplicam: é configuração de ferramenta, sem dado de escola e sem operação concorrente.

Cobertos:
- Todos os cenários acima têm teste citado pelo nome.
- Os testes asseveram o resultado: a lista exata de achados `categoria: nome` e o código de saída, não só que o knip rodou.
- A fixture `limpo` serve de controle negativo.
- Os argumentos vêm de `ARGUMENTOS_DO_KNIP`, a mesma constante que a etapa e o script usam, então tirar uma categoria muda o achado da fixture dela.
- Não há `.skip`, mock que esconda a regra, IA nem provedor pago.
- Rodei `npx vitest run --project unidade tools/ci/scripts.test.ts tools/ci/dependencias.test.ts tools/guardas/knip.test.ts`: 44 testes passaram, em 2,86 s no total. O knip no repositório inteiro não depende de máquina folgada.

Bloqueantes:

1. **`tools/guardas/knip.test.ts:88-96`: o teste não prova "sem buraco por configuração".** A seção de divergências da tarefa (`24_task.md:94`) e a `onda-1b.md` dizem que o teste mostra que não há outra porta. Mas o teste é uma lista negra: só barra `ignoreWorkspaces` e `ignoreIssues` no topo, e `ignore`, `ignoreDependencies` e `ignoreBinaries` nos workspaces.
   - O schema do knip 6.42.1 (`node_modules/knip/schema.json`) aceita no topo também `rules`, `exclude`, `ignoreUnresolved`, `ignoreDependencies`, `ignoreBinaries`, `ignoreGlobalBinaries` e `ignoreFiles`, e nos workspaces `ignoreUnresolved`.
   - Um `"rules": { "unlisted": "off" }` ou um `"ignoreUnresolved": ["**"]` no topo passaria por este teste. O teste "o repositório inteiro sai limpo" também continuaria verde.
   - Correção exigida: trocar por uma lista de chaves permitidas. As chaves do topo devem ser exatamente `$schema`, `ignore` e `workspaces`. Cada workspace só pode ter `entry` e `project`, e o `.` também `ignoreDependencies` e `ignoreBinaries`, com os valores já afirmados.
   - Acrescentar em "Mutações" um bloco em `knip.json` que põe `"rules": { "unlisted": "off" }` no topo e cita este teste.

2. **`tasks/prd-reengenharia/24_task.md`, seção "Mutações": a cláusula nova `"drizzle-orm": "0.45.2"` em `apps/worker/package.json` não tem bloco.** É uma cláusula num arquivo próprio, coberta pelo caso `apps/worker: apps/worker/package.json declara drizzle-orm como devDependency, na versão do lock, sem faixa` do `it.each` em `tools/ci/dependencias.test.ts:33`. O único bloco do worker é o do `pino`.
   - Correção exigida: um bloco que troca para `"drizzle-orm": "^0.45.2"` e cita esse caso.

Recomendações:
- As outras dez dependências da raiz (`ioredis`, `@node-rs/argon2`, `otpauth`, `bullmq`, `socket.io-client`, `@opentelemetry/sdk-metrics`, `drizzle-orm`, `zod`, além de `pg` e `knip`, que já têm bloco) dependem do bloco do `pg` para provar o mesmo caminho parametrizado. Um bloco por linha, ou um bloco que tira uma delas e cita o caso "o repositório inteiro sai limpo" (que pega o `unlisted`), deixaria cada uma provada.
- As linhas de regressão (worker e despachante em integração, e `test:infra`) não foram alteradas, então o portão da tarefa não as roda; só a esteira as vê. Vale citar na tabela os casos de `apps/worker/test/execucao.int.test.ts` e `apps/despachante/test/janela.int.test.ts` pelo nome.
- A linha da tabela diz "as nove dependências novas", mas o teste cobre onze, como a divergência explica. Vale alinhar o texto da tabela.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/24_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/knip.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/dependencias.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/scripts.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/knip.json
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/__fixtures__/knip/

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 23:27:58 · `tasks/prd-reengenharia/24_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As duas correções que o `test-engineer` pediu na 1ª rodada estão feitas:
- **Configuração do knip:** `tools/guardas/knip.test.ts` agora confere uma lista de chaves permitidas, e não mais uma lista de proibidas. No topo do `knip.json` só valem `$schema`, `ignore` e `workspaces`. Cada workspace só pode ter `entry` e `project`, e o `.` também `ignoreDependencies` e `ignoreBinaries`, com os valores fixos. O `knip.json` atual segue essa lista. O teste roda (8 casos, todos passam). O bloco de mutação com `"rules": { "unlisted": "off" }` foi acrescentado em "Mutações".
- **`drizzle-orm` no worker:** o bloco de mutação de `apps/worker/package.json` existe e cita o caso certo do `it.each`.

Também foram acrescentados blocos de mutação para as oito dependências da raiz que não tinham (recomendação do `test-engineer`). A tabela de testes passou a dizer onze dependências e cita pelo nome os testes de integração e de infra da regressão. As duas recomendações da 1ª rodada aparecem em "Recomendações sem aplicar", cada uma com destino ou motivo.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/onda-1b.md:171-172` ainda descreve a conferência antiga, com a lista de proibidas (`ignoreWorkspaces`, `ignoreIssues`, `ignore` por workspace). A linha da divergência em `24_task.md` já fala da lista de permitidas. Não há contradição, porque a lista de permitidas cobre as três chaves citadas, mas vale alinhar o texto da spec ao que o teste afirma agora.
- A mensagem nova do `expect` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/dependencias.test.ts:35` explica bem por que a declaração é `devDependency`. Ela ficou longa numa linha só; extraí-la para uma constante deixaria o `it.each` mais legível.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 23:28:15 · `tasks/prd-reengenharia/24_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada. A trava do knip sai limpa no repositório inteiro. Cada categoria do `--include` (`unlisted`, `dependencies`, `binaries`, `unresolved`) reprova na sua fixture. O `guarda:dependencias` e a etapa do `ci:verificar` usam os mesmos argumentos. O `knip.json` não tem outro jeito de calar o knip pela configuração. As onze dependências novas estão na versão do lock, sem faixa, e também na entrada do lock do pacote. O knip está exato em `6.42.1`. Worker e despachante continuam sem `pino`. Para regressão, os testes de integração e de infra que já existiam.

Cobertos:
- **Correção 1 feita.** `tools/guardas/knip.test.ts:89` agora exige que o topo tenha só `$schema`, `ignore` e `workspaces`. As linhas 93-96 exigem que cada workspace tenha só `entry` e `project`, e o `.` também `ignoreBinaries` e `ignoreDependencies`, com os valores conferidos nas linhas 97-98. O bloco novo em `knip.json` acrescenta `"rules": { "unlisted": "off" }` no topo: a lista de chaves deixa de bater na linha 89, e o caso cai pela cláusula certa. A linha de contexto do bloco (`"$schema": "./node_modules/knip/schema.json",`) existe igual na árvore.
- **Correção 2 feita.** O bloco em `apps/worker/package.json` troca `"drizzle-orm": "0.45.2"` (sem vírgula, igual à árvore) por `^0.45.2`. O caso citado existe: é o `it.each` com `['apps/worker', 'apps/worker/package.json', 'drizzle-orm']`, e o `toMatch(EXATA)` fica vermelho.
- **Recomendações da rodada anterior aplicadas.** Agora há um bloco por dependência da raiz (`pg`, `ioredis`, `@node-rs/argon2`, `otpauth`, `bullmq`, `socket.io-client`, `@opentelemetry/sdk-metrics`, `drizzle-orm`, `zod`). Cada linha `-` aparece uma vez só no `package.json` da raiz, e cada nome de caso bate com o que o `it.each` monta a partir do `DA_RAIZ`. A tabela diz "onze". Os cinco casos de regressão citados pelo nome existem: `apps/worker/test/execucao.int.test.ts:65` e `:112`, `apps/despachante/test/janela.int.test.ts:65`, `infra/test/jobs.int.test.ts:65` e `:70`.
- `npx vitest run --project unidade tools/ci/dependencias.test.ts tools/guardas/knip.test.ts` deu 22 de 22 verdes. Não há `.skip` nem mock, e nenhum provedor de IA entra no teste.

Bloqueantes: nenhum.

Recomendações:
- `tools/guardas/knip.test.ts:93-96`: a lista permitida confere os nomes das chaves de cada workspace, mas não o conteúdo de `entry` e `project`. Se alguém estreitar um `project` (por exemplo, `apps/web` só com `"*.ts"`), o knip deixa de olhar o `src/`, e nenhum teste deste arquivo percebe. O caso "repositório inteiro sai limpo" só pega isso no `apps/worker`, onde está a mutação do `pino`. Vale afirmar os `project` exatos, ou ao menos que cada um cobre `src/**`. Fica para o `/validar`.
- As recomendações da 1ª rodada que ficaram sem aplicar, já registradas na tarefa (a constante repetida no script até a 92.0, e o prazo de 60 s do caso do repositório inteiro), têm destino e motivo escritos. Nada a acrescentar.

Arquivos conferidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/knip.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/dependencias.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/knip.json
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/24_task.md

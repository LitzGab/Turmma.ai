# Achados das revisões — `tasks/prd-harness/11_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 21:31:45 · `tasks/prd-harness/11_task.md`

VEREDITO: APROVADO

Caminho quente tocado: nenhum. A tarefa só mexe em ferramentas do processo: o git hook nativo, o portão, a esteira e a config do Vitest.

Rate limit: ok (não se aplica, nenhum endpoint novo nem alterado)

Fila e prioridade: ok (não se aplica, nenhum job novo)

Concorrência: protegida. Não há "busca, verifica, grava" sobre estado de produção. Cada caso do `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.int.test.ts` roda num repositório próprio, criado com `mkdtempSync` e apagado no fim. O ambiente do teste tira as variáveis `GIT_*` e `CLAUDE_CODE_AGENT` herdadas, então os casos rodam em paralelo sem se cruzar.

Índice e paginação: ok (não se aplica, nenhuma query nova)

Degradação de IA: não se aplica

Migration: não se aplica

Métrica e alerta: ok (não se aplica, nada novo no caminho quente)

Deploy conferido, sem bloqueio:
- **Imagens Docker:** o `prepare` novo (`git config core.hooksPath ...`) não roda no build. Todo `npm ci` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/infra/docker/servico.Dockerfile` usa `--ignore-scripts`, e o `.dockerignore` deixa o `.git` de fora. O build não quebra por falta de git ou de repositório.
- **Esteira:** o `npm ci` dos jobs roda depois do checkout, que traz o `.git`, então o `prepare` funciona ali.
- **Projeto `processo`:** não sobe o compose e roda no job do `verificar`.

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/package.json:15`: o `prepare` falha num `npm install` sem `--ignore-scripts` feito fora de um repositório git, por exemplo um tarball ou uma futura imagem que não use a flag. Um `git rev-parse --git-dir >/dev/null 2>&1 && git config ... || true` evita que um build futuro quebre por isso.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/mutacoes.ts:236`: `testTimeoutDoProjeto` pega o primeiro `testTimeout` que aparece em `vitest.config.ts`. Hoje funciona porque a integração e o `processo` declaram o mesmo valor, 60 000. Se um dos dois mudar, o prazo calculado para o `processo` sai errado sem nenhum aviso. Vale ler o valor do bloco do próprio projeto.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 21:33:58 · `tasks/prd-harness/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. Cobre typecheck, lint, segredo, dependencias, unidade e alvo, com alvo `tools/processo/hook-git.int.test.ts` e 51 mutações do documento.
Bloqueantes: nenhum

Recomendações:

- **`git commit --amend` não está nos limites.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.ts:46-60`, `arquivosDoIndice` compara o índice com o HEAD. No `--amend`, o HEAD é o próprio commit que está sendo refeito. Assim, um papel que roda `git commit --amend -m "outra mensagem"` num commit de código, sem mexer no índice, tira a marca e passa no `commit-msg`. O risco é baixo, porque o código já passou pela revisão e a terceira camada (12.0) acusa. A §5a, porém, lista `commit-tree`, `rebase`, `cherry-pick` e outros, e não o `--amend`. Convém declará-lo em "Limites declarados (RF14)" e numa linha do `cenarios.md` B, como foi feito com `commit-tree` e `rebase`.
- **A 4ª linha de "Divergências resolvidas" não é divergência.** Ela diz que o aviso sai em toda sessão. A §7c da techspec ("`core.hooksPath` ausente | o início de sessão avisa") nunca restringiu o aviso ao papel, e o `cenarios.md` "Início de sessão" não diz "toda sessão". Ou a linha sai do `11_task.md`, ou o `cenarios.md` ganha as palavras "em qualquer sessão", para a linha apontar texto que exista.
- **Texto morto no aviso.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/contexto-inicial.sh:156`, o aviso diz "Checkout anterior à X7: traga a develop antes". Num checkout anterior à X7, o `contexto-inicial.sh` que roda é o antigo, sem esse trecho, então essa frase nunca aparece onde se aplica. Além disso, o `core.hooksPath` gravado pelo `prepare` fica na config comum do repositório, que todos os worktrees compartilham. Por isso, num worktree anterior à X7 o valor está "certo" e a pasta não existe. A frase da §5a "Andar anterior à X7 […] o início de sessão avisa" não se cumpre por construção. Vale ajustar a frase da techspec para o que a máquina faz de fato.
- **Glob no guia.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/guia-do-desenvolvedor.md`, na linha nova da tabela de projetos, está escrito `tools/processo/*.int.test.ts`. O `vitest.config.ts` coleta `tools/processo/**/*.int.test.ts`.
- **`rev-parse` repetido.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.ts:106`, `rodar` roda `git rev-parse --show-toplevel` de novo, quando o script `commit-msg` já o calculou para achar o arquivo. Não é bug, só um segundo processo git por commit.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-23 21:34:15 · `tasks/prd-harness/11_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- A tabela inteira de `cenarios.md` B, "RF14, formas contra um git real", com 24 linhas e cada item separado por ponto e vírgula contado sozinho.
- O `prepare` aponta `tools/processo/git-hooks`.
- O início de sessão sem `core.hooksPath`, com ele em outro lugar e com ele certo.
- O `hook-git.ts` ausente: o commit de papel é recusado.
- A instalação: os dois scripts executáveis, a saída antes do node sem papel e o projeto `processo` sem `globalSetup`.
- Os alvos do portão e o projeto novo em `alvosDoPortao`, `sequencia-do-portao`, `tipoDoTeste`, `ci:verificar` e `npm run test`.

**Cobertos:** todos, cada um com caso próprio em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.int.test.ts` e em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/instalacao.test.ts`.
- **Commit:** `/usr/bin/git`; `env`, `command` e `sh -c`; o script `.sh`; `git -C`; worktree; documento ruim no índice e bom no disco, e o inverso.
- **Merge:** conflito sem marca; conflito com marca; merge limpo.
- **Recusas na mensagem e no ambiente:** `Fora do processo:`; `PATH` sem node, no commit e no push; papel `intruso`, no commit e no push.
- **Commits que passam:** só documento, nos três tipos; tarefa aprovada.
- **Push:** `develop`, `release` e `main`; `spec/x`; dois destinos em ordem; `:main`; `--all`.
- **Sem papel:** os quatro casos.
- **Limites declarados:** `env -u`, `commit-tree` e `rebase`.
- **Casos acrescentados:** o rename; o nome com acento e espaço; o documento fora do índice; produção sem e com `Sem mutação`; o `hook-git.ts` chamado direto, nas cinco variantes; o `hook-git.ts` ausente.
- **Instalação e sessão:** `prepare`, scripts e projeto do Vitest; os três casos de sessão.
- **Portão:** `alvosDoPortao`, a sequência, `tipoDoTeste`, `comandoDoTeste`, `ci:verificar` e `npm run test`.

As asserções conferem o motivo no stderr e se o HEAD andou, não só o código de saída. O git é de verdade e não há mock da regra. Não há `.skip`, `.only` nem teste comentado. Não há IA envolvida. Cada chamada de hook é independente e sem estado, então não cabe teste de concorrência.

Rodei os dois comandos de teste:
- `npx vitest run --project processo tools/processo/hook-git.int.test.ts`: 45 de 45 verdes, em 17 s, bem dentro do `testTimeout` de 60 s.
- `instalacao.test.ts`, `revisoes.test.ts`, `portao-local.test.ts`, `mutacoes.test.ts` e `scripts.test.ts`, no projeto `unidade`: 412 de 412 verdes.

**Bloqueantes** (cláusula nova sem bloco de mutação):

1. **`tools/processo/hook-git.ts:25`, o filtro que tira o nome vazio em `nomes`.** O código é `nomes = (saida) => saida.split('\0').filter((nome) => nome !== '')`. A seção "Mutações" não tem bloco para esse filtro. Sem ele, o `''` do último separador do `-z` entra em `arquivos` e em `alterados`. Na caducidade, `join(raiz, '')` é a própria pasta, e a leitura do arquivo deve estourar no commit de tarefa.
   - **Correção exigida:** um bloco `- const nomes = (saida: string): string[] => saida.split('\0').filter((nome) => nome !== '')` / `+ const nomes = (saida: string): string[] => saida.split('\0')`.
   - **Teste sugerido:** `› as revisões válidas e o carimbo passa`. Se esse não ficar vermelho, aponte o caso que fica.

2. **`tools/processo/hook-git.ts:121`, a condição `if (motivo !== null) {` do bloco principal.** Há bloco para o `process.exit(1)` e para o motivo do `catch`, mas não para a condição que separa passar de recusar.
   - **Correção exigida:** um bloco `- if (motivo !== null) {` / `+ if (true) {`.
   - **Teste sugerido:** `› o commit só de documento`. Com a mutação, todo commit de papel que deveria passar sai 1, com "null" no stderr.

**Recomendações** (não bloqueiam):

- **`tools/processo/portao-local.ts:190`.** O `...alvos.processo` em `todosOsAlvos` não tem bloco. Também não há como provar: o campo `alvos` do carimbo é gravado e nenhum código o lê (procurei `carimbo.alvos` em `tools/` e não achei nada). Registre isso no documento, para o próximo auditor não procurar o bloco.
- **"Erro de carga recusa" no sentido literal.** Os imports são estáticos, então o `catch` do bloco principal não pega módulo que falha ao carregar. Quem fecha na falha é a saída 1 do node, e nenhum caso prova isso. Um caso que apague `tools/processo/portao.ts` (ou `comando-git.ts`) no repositório temporário e espere o commit de papel recusado cobriria o caso real: um merge pela metade deixando um módulo quebrado. Hoje o caso `› o erro de carga recusa` usa um arquivo de mensagem que não existe, e isso é erro ao julgar, não ao carregar.
- **`hook-git.int.test.ts:478-483`, o push de papel com `PATH` sem node.** O caso não confere o stderr (`/node/`), ao contrário do cabeçalho do arquivo e do caso equivalente de commit (linha 272). O caso "sem papel passa… com o PATH sem node" já serve de controle, mas a asserção do motivo deixaria o caso coerente.
- **`hook-git.int.test.ts:177`.** O caminho `/usr/bin/git` está fixo, e o resto do arquivo usa o `GIT` do `which`. Funciona na esteira (Ubuntu) e aqui, mas quebra onde o git não está em `/usr/bin`. Exigir a existência antes, ou documentar, evita um vermelho de ambiente.
- **Divergências registradas no documento.** O projeto `processo`, o `(mvp: …)` fora do git hook, o índice provado pelo documento e o aviso em toda sessão estão justificados e coerentes com o `techspec.md` §10 e o `cenarios.md` B. Nada a exigir.

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 21:45:48 · `tasks/prd-harness/11_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os da 1ª rodada, para o RF14 no git hook nativo:
- **Commit de papel:** código sem marca, por qualquer caminho do git, é recusado. Passam o commit só de documento, o merge limpo de outra linha e o commit com `(tarefa N.0)`, revisões válidas e carimbo.
- **Rename:** mover código para um documento é recusado.
- **Nome:** código com acento e espaço no nome é recusado.
- **Papel:** papel intruso é recusado. Papel vazio ou ausente não é julgado.
- **Push:** push para branch protegida é recusado, e o da branch do andar passa.
- **Falhas:** o PATH sem node, o erro de carga e o modo desconhecido recusam.
- **Instalação e início de sessão.**
- **Nesta rodada:** o filtro do nome vazio em `nomes`, a condição `if (motivo !== null)` do bloco principal, e as recomendações que a Mesa mandou aplicar.

**Cobertos:**
1. **Correção 1:** feita. O bloco do filtro em `nomes` (`tools/processo/hook-git.ts:25`) está na seção "Mutações" e cita `› as revisões válidas e o carimbo passa`. O nome casa com o caso `o commit com (tarefa N.0), as revisões válidas e o carimbo passa` (`hook-git.int.test.ts:296`). Sem o filtro, o `''` entra na lista de arquivos e o julgamento muda. O vermelho vem do nome vazio, que é a cláusula em teste.
2. **Correção 2:** feita. O bloco `if (motivo !== null) {` → `if (true) {` (`hook-git.ts:121`) cita `› o commit só de documento`, que casa com o `it.each` de três casos (`hook-git.int.test.ts:287`). Com a mutação, o hook escreve `null` no stderr e sai 1. Por isso o caso fica vermelho por dois motivos certos: `stderr` diferente de `''` e o commit não criado.
3. **Recomendações aplicadas:**
   - A nota de que `...alvos.processo` em `todosOsAlvos` não tem como ter bloco está no documento. Conferi pelo grep: o campo `alvos` do carimbo só é gravado (`portao-local.ts:190,193`), e nada o lê para decidir.
   - O `it.each` com `portao.ts`, `comando-git.ts` e `mutacoes.ts` apagados espera o commit de papel recusado, com status diferente de 0 e o stderr citando o módulo.
   - O push com PATH sem node agora confere o stderr `/node/` (`hook-git.int.test.ts:485`).
   - O `/usr/bin/git` fixo saiu. O caminho vem do `which` (linha 17), com a asserção de que é absoluto. Os três blocos que citavam o nome antigo foram renomeados, e nenhum bloco cita mais `/usr/bin/git commit`.
4. Rodei `npx vitest run --project processo tools/processo/hook-git.int.test.ts`: 48 de 48 passaram. O código de produção não mudou desde a rodada anterior.

**Bloqueantes:** nenhum.

**Recomendações:**
- No caso dos módulos apagados (`hook-git.int.test.ts:184`), a regex aceita `ERR_MODULE_NOT_FOUND` como alternativa. Assim, a falta de qualquer outro módulo também passaria. Exigir o nome do módulo apagado, que é o que o stderr do node traz, deixaria a asserção mais estreita.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 21:46:08 · `tasks/prd-harness/11_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. Desde a 1ª rodada o código de produção não mudou. Mudaram o teste, o `11_task.md` e o texto da `techspec.md`, do `cenarios.md` e do guia. As quatro recomendações de documento que a Mesa mandou aplicar estão feitas:
- O `git commit --amend` entrou nos "Limites declarados (RF14)" em `techspec.md:111-112` e numa linha da tabela B em `cenarios.md:56`, com a citação do protocolo §5.
- "Em qualquer sessão" entrou em `cenarios.md:96`. A 4ª divergência do `11_task.md` agora aponta um texto que existe.
- A frase da §5a sobre andar anterior à X7 foi reescrita em `techspec.md:137-140`. Ela bate com o `prepare`, que grava o `core.hooksPath` relativo na config comum, e com o `contexto-inicial.sh` antigo que roda nesses andares.
- O glob do guia virou `tools/processo/**/*.int.test.ts`, que é o que o projeto `processo` coleta.

Portão local: carimbo válido. O carimbo é das 21:44, depois da última edição do documento (21:36), e o `conferir` inclui as mutações do documento, inclusive os dois blocos novos (`nomes` sem o filtro, e `if (true)`).

Bloqueantes: nenhum

Recomendações:
- O destino de uma recomendação sem aplicar não existe. Na tabela "Recomendações sem aplicar" do `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/11_task.md`, a linha do texto morto do `contexto-inicial.sh` diz "Destino: `TODO.md`". Não há item no `TODO.md`, e o arquivo nem foi alterado nesta tarefa. A linha da tabela também está errada: a frase "Checkout anterior à X7: traga a develop antes" fica em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/contexto-inicial.sh:27`, não na 156, e o arquivo tem 59 linhas. A `techspec.md:138` agora diz que "nada o avisa", o que contradiz a mensagem que o hook ainda imprime. O item precisa entrar no `TODO.md` antes do commit, senão a recomendação se perde. A de `testTimeoutDoProjeto` já está coberta pelo item da 7.0 (`TODO.md:1839-1840`).
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.int.test.ts:184`: `modulo.replace('.', '\\.')` só escapa o primeiro ponto. Funciona com os três nomes de hoje. `replaceAll`, ou um nome escapado por função, evita a surpresa se a lista ganhar um módulo com dois pontos.

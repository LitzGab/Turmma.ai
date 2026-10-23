# Achados das revisões — `tasks/prd-harness/10_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 17:53:29 · `tasks/prd-harness/10_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A mudança fica toda no hook do processo de desenvolvimento (`tools/processo/`). Não muda login, tutor, sala, prova, fila, gateway de IA, migration nem deploy, então nada dela roda às 10h com sessenta turmas no IP da escola.
Rate limit: não se aplica (não há rota nem login novos).
Fila e prioridade: não se aplica.
Concorrência: protegida. Não há "busca, verifica, grava" sobre estado compartilhado: a `decidirCommit` só lê, e quem grava é o carimbo e as rodadas, que esta tarefa não muda.
Índice e paginação: não se aplica (nenhuma query nova).
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: não se aplica (fora do caminho quente).
Bloqueantes: nenhum.

O risco de operação que a tarefa aponta, um `exit 2` que travaria todo Bash do time, está contido:
- O `.claude/settings.json` não mudou.
- Um erro dentro do `portao` cai no `try/catch` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/hook-revisoes.ts:30-35` e nega só aquele comando.
- O arquivo de `-F` é lido por `lerOuVazio`, que não lança erro.
- O leitor do shell (`PEDACO_DO_SHELL`) não tem retrocesso catastrófico.

Rodei `npx vitest run --project unidade tools/processo/hook-portao.test.ts tools/processo/revisoes.test.ts` e os 225 testes passaram. Testei à parte a mensagem de commit em heredoc com `--no-verify` e `unset CLAUDE_CODE_AGENT` no corpo, que é o padrão de commit do time. Nos dois casos o `desvioDoHook` devolve `null`, ou seja, o commit não é negado por engano.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/portao.ts:440`: o `bloqueioDoDesvio` agora roda em todo Bash de sessão de papel, não só em commit e push. A mensagem do `catch` do hook continua "Commit bloqueado: o portão de revisões falhou", e vai aparecer também em comando que não é commit. Vale trocar por "Comando bloqueado" quando o comando não for `ehCommit`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/comando-git.ts:438-442`: o `textoDosArquivosDeMensagem` lê o arquivo de `-F` sem limite de tamanho, e `-F /dev/stdin` ou `-F <fifo>` podem prender o hook. Vale recusar o que não é arquivo regular (`statSync().isFile()`) antes do `readFileSync`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/portao.ts:362`: o `conteudoDoDisco` usa `existsSync` seguido de `readFileSync` e lança erro se o caminho for uma pasta. Hoje o `catch` cobre isso; ficaria mais limpo devolver `null` quando não é arquivo.
- Mensagem com número ímpar de aspas duplas dentro de `-m "$(cat <<EOF …)"` desalinha a leitura por palavras e pode gerar uma negação falsa. A saída é o `-F`, que a própria dica já sugere; vale um caso de teste para esse limite declarado.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-23 17:54:35 · `tasks/prd-harness/10_task.md`

VEREDITO: REPROVADO

Escopo: respeitado

Aderência à Tech Spec: divergência em `decidirCommit`. Ela lê do disco o conteúdo do código alterado, e isso não foi declarado.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes:
- **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/portao.ts:329`**, dentro de `decidirCommit` (linha 350), via `bloqueioDoDocumento`.
  - **O que está errado:** a subtarefa 10.1 pede `decidirCommit` "sem ler disco nem git (o que precisa vem por `conteudoDe` e `raiz`)", e a `techspec.md` §5(a) a chama de "função pura". Só que `alteracoesDeCodigo(entrada.raiz, alterados)` (`caducidade.ts:260-272`) faz `readFileSync` de cada arquivo de código alterado para calcular o hash da caducidade, e não passa por `conteudoDe`.
  - **O comentário da função diz o contrário:** em `portao.ts:347-348` está escrito "o conteúdo de um arquivo vem de `conteudoDe`".
  - **Por que importa já:** a 11.0 vai chamar a função com `conteudoDe` lendo do índice (`git show :<arquivo>`, §5(a)). A caducidade continuaria julgando o disco, e não o que o commit leva. Um papel que adiciona ao índice um código não revisado e depois volta o disco ao conteúdo revisado passa com hash igual ao instantâneo.
  - **Nada disso está declarado:** não aparece na tabela de divergências do `10_task.md`, nem na §5(a) da techspec, nem no `cenarios.md`.
  - **Correção exigida (uma das duas):**
    - (a) calcular o hash das alterações a partir de `entrada.conteudoDe`, deixando a hora do arquivo vir de `raiz`; ou
    - (b) declarar a leitura do disco como divergência, com o motivo, no `10_task.md`, na §5(a) da `techspec.md` e no `cenarios.md` B, RF14. Nesse caso, corrigir também o comentário de `decidirCommit`.
  - **No mesmo ajuste:** `documentoDaMensagem` (`comando-git.ts`) confere a existência do documento de correção com `existsSync` no disco, enquanto `bloqueioDoDocumento` o lê por `conteudoDe`. Alinhar os dois ou declarar.

Recomendações:
- `hook-revisoes.ts` aparece como "alterado" em "Arquivos previstos", mas não mudou (o `portao` já lê `CLAUDE_CODE_AGENT` pelo padrão do parâmetro). Ajustar a tabela.
- A mensagem do desvio (`portao.ts:401`) diz que o papel "commita pelo git hook", mas o hook nativo só existe a partir da 11.0. Enquanto isso, o texto descreve uma camada que ainda não há.
- A seção "Como testar" pede que os casos de `revisoes.test.ts › portão do commit` passem a chamar também `decidirCommit`. A tarefa criou um `describe` novo, com um subconjunto desses casos. Essa decisão é do `test-engineer`; registro só para ele ver.
- `bloqueioDoDesvio` roda em todo Bash de sessão de papel, dentro do `try` de `hook-revisoes.ts`. Se o leitor do shell lançar exceção, a negação sai com o texto "Commit bloqueado: o portão de revisões falhou" mesmo em comando que não é commit. Vale um texto neutro no `catch`.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-23 17:55:29 · `tasks/prd-harness/10_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** os da tabela de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/10_task.md`, linhas 51 a 63. São eles: as negações com papel e as formas que passam com papel; tudo passando sem papel; `Fora do processo:` no `-m`, no `-F`, no `-Fx` e no `--file=`, com e sem papel, e a dica de `-F`; a paridade entre `decidirCommit` e `portao`; as formas direto em `desvioDoHook`, as que passam, e o papel do time contra `''` e contra papel de fora do time; a leitura do arquivo de mensagem; a caixa, a menção no meio da linha, a pasta do `-C` e a do `cwd`, a marca vinda do arquivo; os sete casos de paridade mais `alterados` contra `arquivos`; e o comando real do `settings.json`. A tarefa é ferramenta de processo, sem escrita concorrente nem dado de escola, então não cabe teste de concorrência nem de isolamento. Também não há IA envolvida.

**Cobertos:** as linhas 51, 52, 53, 54, 55, 57, 58, 59, 60 e 63 têm teste, e cada um falharia sem a regra. Rodei `npx vitest run --project unidade tools/processo/hook-portao.test.ts tools/processo/revisoes.test.ts`: 225 testes, todos verdes. Não há `.skip`, teste comentado nem mock nosso. O hook é rodado como processo, com `CLAUDE_CODE_AGENT` tirado do ambiente quando o caso é sem papel. O `deny` da regra é distinguido do `deny` do `catch` do hook.

**Bloqueantes:**

1. **Linha 62, "sem revisor", não tem caso** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/revisoes.test.ts:1826-1863`).
   - Os casos que existem na paridade são: sem a linha `Revisões:`, código sem marca, correção sem documento, conferência a mais, veto, carimbo ausente e documento ilegível.
   - Nenhum caso tem um revisor obrigatório sem rodada. A árvore de `arvoreRevisada` tem todos os revisores.
   - **Correção:** acrescentar o caso. Tirar as rodadas de um obrigatório, por exemplo `test-engineer`, esperar `/test-engineer: nenhuma rodada/` em `peloPortao` e exigir `peloHook` igual a ele.

2. **"O arquivo lido da pasta do `cwd`" não é provado** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/revisoes.test.ts:1776`).
   - O teste `decidir('git commit -F com-a-linha.txt', raiz)` passa `cwd = raiz`, e `raiz` também é a raiz da sessão.
   - Tirar o `cwd` da chamada `pastaDoCommit(comando, raizDaSessao, cwd)` em `bloqueioDoCommit` (`portao.ts`) não deixa nenhum teste vermelho. Esse ponto também não tem bloco de mutação.
   - **Correção:** usar `cwd = outra` com `git commit -F so-na-outra.txt` e raiz da sessão `raiz`, e esperar a negação. Declarar o bloco da mutação que tira o `cwd`.

3. **Cláusula nova sem bloco e sem teste: o escape dentro de aspas duplas** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/comando-git.ts:269`, `PEDACO_DO_SHELL`).
   - Nenhum teste tem barra invertida dentro de aspas duplas. A mutação `(?:[^"\\]|\\.)*` → `[^"]*` sobrevive.
   - Com essa mutação, `git commit -m "a \" --no-verify"` passaria a ser negado. Hoje ele dá `null`, e é o certo: é mensagem.
   - **Correção:** acrescentar esse comando em `passam`, na `describe` do desvio, e declarar o bloco.

4. **Formas de desvio que passam e não estão nos limites declarados.** Isso é um bug, em `comando-git.ts:269` (o leitor) e `comando-git.ts:387-394` (`desvioDoGit`). Rodei `desvioDoHook` direto, e cada um destes comandos devolve `null`:
   - `git commit --no-verif\y -m x` (barra invertida fora de aspas; o shell a tira)
   - `git commit $'--no-verify' -m x` (aspas ANSI-C)
   - `git commi\t -n -m x` (o subcomando não é reconhecido, então o `-n` não é olhado)
   - `git -c alias.c="commit --no-verify" c -m x` (o `--no-verify` vai dentro do argumento do `-c`, e os globais só são olhados para `core.hooksPath`)
   - `git config alias.ci "commit -n"` seguido de `git ci -m x` (alias, que o `config` de outra chave deixa criar)

   O §5(a) da `techspec.md` declara como limite só `sh -c`, script, substituição de comando e `xargs`. Os limites declarados do RF14 não citam nenhuma destas formas. A máquina não barra outro jeito de pular o hook, e o caso do alias é o mais simples dos cinco.
   - **Correção, uma das duas:** (a) fechar. Tirar o escape `\x` e o `$'…'` no leitor, e em sessão de papel negar `-c alias.*` e `config alias.*` que levem `--no-verify` ou `-n`, ou negar qualquer alias. (b) declarar cada forma em `techspec.md` §5(a) ("Limites declarados") e no `cenarios.md` RF14.
   - Nos dois casos, um teste em `revisoes.test.ts › o desvio do hook do git em sessão de papel` fixa o comportamento escolhido: negado, ou `null` com o comentário do limite.

**Recomendações:**
- "No comando, o termo em qualquer lugar" (techspec §5a) não está fixado por teste. Todos os casos de `-m` põem `Fora do processo:` no começo de uma linha, depois de `\n`. Trocar o `includes` por `LINHA_FORA_DO_PROCESSO.test(comando)` passaria. Falta um caso como `git commit -m "Recusa a linha Fora do processo: em papel"`, negado e com a dica.
- O "Como testar" diz que os casos de `portão do commit` passam a chamar também a `decidirCommit`. O que foi feito é uma `describe` de paridade separada. Ajustar o texto ao que foi feito, ou trazer para a paridade os casos que faltam.
- `tools/processo/hook-revisoes.ts` está em "Arquivos previstos" como alterado, e não mudou. Corrigir a tabela.
- No caso "documento ilegível", a paridade só confere `peloHook`. Vale um comentário dizendo que o `portao` sempre lê do disco, para não parecer paridade incompleta.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-23 18:31:35 · `tasks/prd-harness/10_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só mexe no ferramental do processo, o hook `PreToolUse` e o portão de commit. Login, tutor, sala, prova, fila, gateway de IA e migration ficam de fora.
Rate limit: ok. A tarefa não toca nisso.
Fila e prioridade: ok. A tarefa não toca nisso.
Concorrência: protegida. Nada novo grava estado: o portão lê o comando e o disco e devolve uma decisão.
Índice e paginação: ok. Não há query nova.
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. Nada novo no caminho quente.
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/comando-git.ts`, no `defineAlias`: no `git config`, qualquer palavra que comece por `alias.` é negada. Isso inclui só ler (`git config --get alias.ci`, `git config --get-regexp alias.`) e apagar (`git config --unset alias.ci`). É negação falsa num comando sem risco, que trava a sessão de papel. Vale negar só quando o `config` grava (há um valor depois da chave, ou a opção é `--add`/`--replace-all`), ou registrar isso como limite declarado ao lado dos outros.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/revisoes.test.ts`, no caso do fifo: o escritor `sh` fica bloqueado no `open` e só é morto pelo `kill()` no `finally`. Se o `kill` falhar, o processo fica órfão no runner. Um `escritor.kill('SIGKILL')`, ou abrir o fifo com `O_NONBLOCK` para soltá-lo, deixa o teste sem resto. Não afeta o resultado.

Na rodada 1 não houve correção exigida. As duas recomendações dela estão tratadas: `hook-revisoes.ts` agora foi alterado, e o texto do "commita pelo git hook" foi adiado para a 11.0, como registrado na tabela da tarefa. Com a árvore atual, os testes de unidade afetados (`hook-portao.test.ts`, `revisoes.test.ts` e `knip.test.ts`) passaram: 256 de 256.

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-23 18:32:19 · `tasks/prd-harness/10_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A correção da 1ª rodada foi feita pela opção (b). A leitura do disco pela `decidirCommit` agora está declarada no `10_task.md` (linha 88), na `techspec.md` §5(a) e no `cenarios.md` B, RF14. O `existsSync` do documento de correção em `documentoDaMensagem` entrou na mesma declaração. O alias, a barra invertida, o `$'…'` e o arquivo regular também estão declarados nos três documentos.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/comando-git.ts:272`, `PEDACO_DO_SHELL`. A leitura de `$'…'` entrou nesta rodada e só funciona quando o `$'` abre a palavra. A alternativa da palavra solta, `([^\s;&|()"'\\]+)`, aceita o `$`. Por isso o `$` fica preso ao pedaço anterior, e as aspas que vêm depois são lidas como aspas simples comuns. Rodei no código atual:
  - `git commit --no-verif$'y' -m x` vira a palavra `--no-verif$y`, e `desvioDoHook` devolve `null`. O bash entrega `--no-verify` ao git.
  - `git commit -$'n' -m x` vira `-$n`, e devolve `null`.
  - O mesmo acontece com `$"…"`: `--no-verif$"y"` vira `--no-verify` no bash e passa no hook.

  É o desvio que o RF14 manda negar em sessão de papel. A tarefa declara o `$'…'` "lido como no shell" e só ressalva o octal. Este caso não está entre os limites declarados.

  Correção exigida:
  - Na palavra solta, excluir o `$` seguido de aspas, por exemplo `((?:[^\s;&|()"'\\$]|\$(?!['"]))+)`, e tratar `$"…"` como aspas duplas.
  - Acrescentar aos `negados` de `revisoes.test.ts › o desvio do hook do git em sessão de papel` os casos `--no-verif$'y'`, `-$'n'` e `--no-verif$"y"`.
  - Acrescentar a mutação correspondente ao `10_task.md`.

Recomendações:
- O comentário de `decidirCommit` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/portao.ts:350`) ainda diz que o conteúdo "dos arquivos que o commit leva vem de `conteudoDe`". Não vem: o `conteudoDe` só lê o documento, e os bytes dos arquivos alterados saem do disco pela `alteracoesDeCodigo`. Tirar essa parte da frase, para a 11.0 não montar o git hook achando que o índice chega à caducidade.
- A tabela "Arquivos previstos" do `10_task.md` não lista `knip.json` nem `tools/guardas/knip.test.ts`, que mudaram nesta rodada por causa do `mkfifo`.
- O objetivo (linha 9) ainda chama a `decidirCommit` de "função pura", e a subtarefa 10.1 diz "sem ler disco nem git". A divergência está declarada na linha 88; uma remissão a ela nas duas linhas evitaria a leitura contraditória.
- Continua valendo a recomendação da 1ª rodada sobre a mensagem do desvio (`portao.ts`, `bloqueioDoDesvio`): ela diz que o papel "commita pelo git hook", que só existe a partir da 11.0. A tarefa a remeteu à 11.0.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-23 18:33:48 · `tasks/prd-harness/10_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** as quatro correções da 1ª rodada; as cláusulas novas desta rodada, cada uma com o seu bloco de mutação; e as formas de desvio que a correção 4 fechou: a barra invertida, o `$'…'` e o alias por `-c`, `--config-env` e `config`.

**Cobertos:**
- **Correção 1:** feita. `revisoes.test.ts:1917`, "o revisor obrigatório sem rodada bloqueia igual nas duas entradas", espera `/test-engineer: nenhuma rodada/` e exige `peloHook` igual a `peloPortao`.
- **Correção 2:** feita. `revisoes.test.ts:1827-1828` passa `cwd = outra` com a raiz da sessão `raiz`. O bloco que troca o `cwd` por `undefined` foi declarado, e o `mutacoes.ts` aceita a linha de contexto que ele usa.
- **Correção 3:** feita. `\"` dentro de aspas duplas aparece em `passam` e em `comandosDoShell`, e o bloco `"([^"]*)"` foi declarado.
- **Correção 4:** feita pela opção (a), com uma falha descrita no bloqueante 1.
  - A barra invertida fora das aspas, o `$'…'` e a quebra de linha agora são negados, cada um com o seu bloco.
  - O alias por `-c`, `--config-env <espaço>` e `config` é negado, com os blocos da âncora, do `i`, do ternário nos dois sentidos e do `if`.
  - Ficaram declarados como limite, em `techspec.md` §5(a) e no `cenarios.md` RF14, cada um com caso em `passam`: o octal dentro de `$'…'`, o alias que já estava no config e as aspas duplas em número ímpar dentro de `$(cat <<EOF)`.
- **Arquivo que não é arquivo regular:** a pasta e o fifo em `textoDosArquivosDeMensagem` têm teste, e com a mutação o fifo é lido de fato, então o teste fica vermelho. A pasta em `conteudoDoDisco` também, com os dois blocos.
- **`catch` do hook:** `hook-portao.test.ts` › "portão que lança com o hook de pé", com bloco.
- **Testes:** rodei `npx vitest run --project unidade` em `hook-portao.test.ts`, `revisoes.test.ts` e `knip.test.ts`: 256 passaram. O código não mudou desde a árvore da rodada; só mudaram documentos.

**Bloqueantes:**

1. **`tools/processo/comando-git.ts:384`: o alias por `--config-env=` passa.** A expressão `DEFINICAO_DE_ALIAS = /^alias\./i` só olha o começo da palavra, e na forma com `=` a palavra é `--config-env=alias.c=V`. Por isso `desvioDoHook('V="commit -n" git --config-env=alias.c=V c -m x')` devolve `null`. Conferi que o git aceita essa forma: `env V=status git --config-env=alias.zz=V zz --short` rodou o `status`. O `techspec.md` §5(a) diz que o alias por `--config-env` é negado, e essa forma não está entre os limites.
   - Correção: aceitar o prefixo, por exemplo `/^(?:--config-env=)?alias\./i`, ou separar `--config-env=` em `chamadaDoGit`. Acrescentar o caso `git --config-env=alias.c=V c -m x` em `negados` e declarar o bloco que tira o prefixo.

2. **`tools/processo/comando-git.ts:272`: o escape dentro de `$'…'` não tem teste nem bloco.** É o mesmo caso da correção 3, agora no `$'…'`. Com a troca de `\$'((?:[^'\\]|\\.)*)'` por `\$'([^']*)'`, nenhum teste fica vermelho. Hoje `git commit -m $'a\' --no-verify'` dá `null`, porque é mensagem; com a mutação, daria negação falsa.
   - Correção: pôr esse comando em `passam` (`… › o desvio do hook do git em sessão de papel`) e declarar o bloco.

3. **`tools/processo/comando-git.ts:397`: os globais no ramo do `config` não têm teste nem bloco.** Trocar `[...chamada.globais, ...chamada.resto]` por `chamada.resto` não deixa nenhum teste vermelho. Nenhum caso tem `-c alias.*` junto do `config`, e as mutações `false ?` e `true ?` não tiram os globais desse ramo. Hoje `git -c alias.x=y config --list` é negado.
   - Correção, uma das duas:
     - pôr esse caso em `negados` e declarar o bloco;
     - reescrever como `[...chamada.globais, ...(chamada.subcomando === 'config' ? chamada.resto : [])]`, em que os globais já são cobertos pelo caminho do `-c`, e declarar o bloco do ternário que sobra.

**Recomendações:**
- Declarar como limite o `-c include.path=<arquivo>` (e `config include.path`). Ele traz alias e `core.hooksPath` de um arquivo, e `desvioDoHook('git -c include.path=/tmp/cfg c -m x')` dá `null`. É da mesma família de "o alias que já estava no config", mas mais curto. Fechar exigiria tratar `include.*` como o `alias.*`.
- A tabela de testes do `10_task.md` lista "sem revisor" e "revisor obrigatório sem rodada" como itens separados. Diga a que teste o "sem revisor" corresponde, provavelmente ao `semLinha`, ou junte os dois.
- O teste "o revisor que falta, o veto e o carimbo que não vale…" (`revisoes.test.ts:1903`) não tem um revisor que falta: tem o veto e o carimbo. O revisor que falta está em `:1917`. Ajustar o título.
- O teste do fifo depende do `mkfifo` existir no runner. O `ubuntu-latest` tem; fica o registro para um runner diferente.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/comando-git.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/10_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/techspec.md

## revisor-geral · 3ª rodada · APROVADO · 2026-10-23 18:49:15 · `tasks/prd-harness/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

As correções da 2ª rodada foram todas feitas:
- **`PEDACO_DO_SHELL`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/comando-git.ts:273`): o `$` agora só entra na palavra solta quando não abre aspas, e `$"…"` é lido como aspas duplas. Testei o leitor fora da suíte: são negados `--no-verif$'y'`, `-$'n'`, `--no-verif$"y"`, `-$"n"`, `$"--no-verify"`, `"-"$'n'`, `-a$'n'`, `$'-'n` e `-$'n'm y`. Passam `-m $'a\' --no-verify'`, `-m "custa $5"` e `--no-verif$'\y'`, que no bash vira `--no-verif\y` e por isso não é desvio.
- **`--config-env=alias.*` e `--config-env=core.hooksPath=…`**: negados. O alias por `-c` junto do `git config` também é negado, porque `defineAlias` passou a olhar sempre os globais.
- **Testes**: os três casos exigidos estão nos `negados` de `revisoes.test.ts › o desvio do hook do git em sessão de papel`, mais `-$"n"` e os do `--config-env=`. Os limites novos têm caso que fixa o `null`.
- **Mutações**: estão no `10_task.md`, para o `\$?"`, o `\$(?!['"])` nos dois sentidos, o `\'` dentro de `$'…'`, o `--config-env=` do `DEFINICAO_DE_ALIAS` e os dois lados do `defineAlias`.
- **Documentação**: a gramática fechada está na `techspec.md` §5(a), no `cenarios.md` B (RF14) e na tabela de divergências do `10_task.md`.
- **Recomendações da rodada anterior**: o comentário de `decidirCommit` foi corrigido, o `knip.json` e o `knip.test.ts` entraram na tabela de arquivos, e o objetivo e a 10.1 remetem à divergência declarada.

Recomendações:
- **Formas que ainda passam e que nenhuma categoria de limite da §5(a) nomeia.** Pela frase "todo o resto é limite" elas não bloqueiam, mas a lista de categorias não as cobre e são formas comuns. Todas confirmadas como `PASSA`:
  - `! git commit -n -m x`
  - `{ git commit -n -m x; }`
  - `if true; then git commit -n -m x; fi`, porque `then`, `do`, `else` e `!` viram o programa
  - `git commit -m x -n>/dev/null`: o redirecionamento colado fica dentro da palavra
  - `timeout 60 git commit -n -m x`
  - `git --attr-source HEAD commit -n -m x`: a sétima opção global do git que leva argumento na palavra seguinte, e ela tira o subcomando do lugar.

  O mais barato é pôr `!`, `{`, `then`, `do`, `else`, `if`, `while` e `until` em `ENVOLTORIOS`, `<` e `>` entre os caracteres que encerram a palavra, e `--attr-source` em `OPCOES_DO_GIT_COM_ARGUMENTO`. Se não for feito, nomear essas categorias (palavra reservada, redirecionamento, envoltório fora da lista, opção global fora das seis) na lista de limites da §5(a).
- **Lista desatualizada no `cenarios.md`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/cenarios.md:72`): a lista do `decidirCommit` ainda começa por "sem revisor". A tabela do `10_task.md` trocou isso por "revisor obrigatório sem rodada (`test-engineer` ausente)", então os dois documentos ficaram desalinhados.
- **Texto da techspec que diz mais do que o código faz**: ela diz que o leitor decodifica `\"` e `\\` dentro das aspas duplas e `\'` e `\\` dentro de `$'…'`. O código só reconhece esses escapes para não fechar as aspas e devolve o texto cru. Isso não abre desvio, porque decodificar não produz letra, mas vale ajustar a frase ("reconhece, sem decodificar").

## test-engineer · 3ª rodada · REPROVADO · 2026-10-23 18:49:43 · `tasks/prd-harness/10_task.md`

VEREDITO: REPROVADO

**Cenários exigidos (rodada 3):** as três correções da rodada 2; os blocos de mutação novos conferidos contra a linha como ela ficou; o que o diff afeta, ou seja, o leitor do shell com `$"…"` e o `$` que não abre aspas, e a gramática fechada da techspec §5(a).

**Cobertos:**
- **Correção 1 (`--config-env=alias.c=V`), feita.** `comando-git.ts:385` aceita o prefixo. O caso `alias por config-env com igual` está em `negados`, e há também `hookspath por config-env com igual`. Cada um dos três blocos de `DEFINICAO_DE_ALIAS` tem o seu caso:
  - sem o `^`, fica vermelho `config de outra chave com alias no meio`;
  - sem o `i`, fica vermelho `alias por c em maiúsculas`;
  - sem o prefixo, fica vermelho `alias por config-env com igual`.
- **Correção 2 (`\'` dentro de `$'…'`), feita.** `aspa escapada dentro de ANSI-C` está em `passam`, e o bloco `\$'([^']*)'` foi declarado. Com a mutação, o `--no-verify` vira palavra solta e é negado, então o teste fica vermelho.
- **Correção 3 (globais junto do `config`), feita.** A linha 398 foi reescrita com o ternário, e `alias por c junto do config` entrou em `negados`. Cada um dos três blocos tem o seu caso:
  - com `false ?`, fica vermelho `alias por config`;
  - com `true ?`, fica vermelho `mensagem que começa por alias`;
  - sem os globais, fica vermelho `alias por c junto do config`.
- **`PEDACO_DO_SHELL`, os quatro blocos novos.** Cada um tem o seu caso:
  - `\$?"` → `"`: o `-$"n"` vira `-` e `n` soltos, e fica vermelho `aspas duplas com cifrão no n`;
  - o `$` dentro da classe da palavra: o comando vira `--no-verif$y`, e fica vermelho `ANSI-C colada no fim da opção`;
  - `\$(?!['"])` → `\$`: mesmo efeito, mesmo caso vermelho;
  - sem a alternativa do `$`: fica vermelho `echo $HOME x$`, em `as palavras do comando do shell`.
- **Limites fixados com `null`:** `${X}`, `{y,}` e `include.path`.
- **As três recomendações da rodada 2 foram atendidas:** o `include.path` declarado como limite, o item da tabela juntado e o título do teste de paridade ajustado.
- `npx vitest run tools/processo/revisoes.test.ts`: 213 testes passando.

**Bloqueantes:**

1. **`tools/processo/comando-git.ts:361`: o leitor perde o subcomando quando o git recebe uma opção global fora das seis.**
   - **Por que é bug e não limite:** a techspec §5(a), no parágrafo novo, diz que o leitor "lê as seis opções antes do subcomando". Mas o git 2.56 desta máquina aceita mais duas opções globais com o argumento na palavra seguinte: `--attr-source <tree>` e `--shallow-file <arquivo>` (conferi com `git --attr-source HEAD rev-parse` e `git --shallow-file x rev-parse`). Nenhuma das categorias de limite escritas cobre isso, então é bug dentro da gramática.
   - **O que acontece:** o `chamadaDoGit` toma o argumento dessas opções pelo subcomando. Conferi chamando `desvioDoHook` direto, sem tocar em arquivo. Estes três comandos devolvem `null`:
     - `git --attr-source HEAD commit -n -m x`
     - `git --attr-source HEAD -c core.hooksPath=/dev/null commit -m x`, que troca o caminho dos hooks e passa
     - `git --shallow-file x -c alias.c=commit c -n -m x`
     O `--no-verify` escrito por extenso continua negado, porque `resto.some(ehNoVerify)` olha o resto todo. Escapam o `-n`, o `core.hooksPath` e o alias.
   - **Correção exigida:**
     - acrescentar `--attr-source` e `--shallow-file` a `OPCOES_DO_GIT_COM_ARGUMENTO`;
     - pôr em `negados` pelo menos `git --attr-source HEAD commit -n -m x` e `git --shallow-file x -c core.hooksPath=/dev/null commit -m x`;
     - declarar um bloco de mutação para cada opção tirada do `Set`, cada um vermelho no seu caso;
     - trocar "as seis opções" na techspec §5(a) pela lista nova.
   - Se a escolha for não ler essas opções, a alternativa é escrever na techspec uma categoria nova de limite ("opção global do git fora da lista"), com um caso em `passam` que fixe o `null`. Hoje não está escrita, e por isso é bloqueante.

**Recomendações:**
- **O texto da gramática diz mais do que o código faz.** A techspec §5(a) diz que o leitor "decodifica" `\"` e `\\` dentro de `"…"`, `$"…"` e `$'…'`. O código não decodifica: o teste de `\"` espera o texto cru `a \" --no-verify`. Não abre desvio, porque decodificar só daria `"` ou `\`, que nem `--no-verify` nem `-n` têm. Ainda assim, o texto deveria dizer "não fecham as aspas" em vez de "decodifica".
- **Barra invertida antes da quebra de linha.** O `replaceAll('\\\n', '')` também apaga a barra e a quebra dentro de aspas simples, o que o bash não faz. Isso só dá negação a mais, nunca a menos. Vale uma linha na techspec.

Os arquivos tratados nesta rodada:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/comando-git.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/10_task.md

## infra-guardian · 4ª rodada · APROVADO · 2026-10-23 20:24:10 · `tasks/prd-harness/10_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- As formas que o `revisor-geral` listou na 3ª rodada ainda passam no `desvioDoHook` e nenhuma categoria de limite da techspec §5(a) as nomeia: `! git …`, `{ git …; }`, `if/then/do/else`, redirecionamento colado (`-n>/dev/null`) e `timeout 60 git …`. Não é regra 80 e não bloqueia. Vale fechá-las em `ENVOLTORIOS` e nos caracteres que encerram a palavra, ou nomeá-las como limite em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/techspec.md`.

O que conferi nesta rodada:
- **O bloqueante do `test-engineer` na 3ª rodada foi corrigido.** O `Set` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/comando-git.ts:365` agora tem `--attr-source`, `--shallow-file` e `--super-prefix`. Com isso, o `chamadaDoGit` (linhas 374–385) não confunde mais o argumento dessas opções com o subcomando.
- **Os testes de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/revisoes.test.ts` cobrem as três opções:**
  - há um caso negado para cada uma;
  - um caso em `passam` fixa que `--attr-source=HEAD` é uma palavra só;
  - rodei o bloco "desvio do hook": 100 testes passaram.
- **As três mutações novas do `10_task.md` acertam o `Set`.** Cada uma tira uma opção, e sem ela o subcomando lido passa a ser o argumento da opção. O desvio deixa de ser negado e o caso dessa opção fica vermelho.
- **A §5(a) da techspec traz a lista nova**, igual à do código.
- **Regra 80:** o diff só mexe no hook de processo do `PreToolUse`. Não toca em login, tutor, sala, prova, fila, gateway de IA, migration nem deploy, e não guarda estado em memória nem cria query.
- **A árvore de trabalho bate com `809f7c8`** em `tools/processo` e `tasks/prd-harness`. A única diferença é o `achados/10_task.md`, que ainda não está no git.

## revisor-geral · 4ª rodada · APROVADO · 2026-10-23 20:24:17 · `tasks/prd-harness/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

A correção que o `test-engineer` exigiu na 3ª rodada foi feita, e o diff real bate com o resumo da Mesa:
- **Código:** `--attr-source` e `--shallow-file` entraram em `OPCOES_DO_GIT_COM_ARGUMENTO` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/comando-git.ts:365`).
- **Testes:**
  - Três casos novos ficam negados, um por opção, todos com `-n`.
  - Um caso fixa que a forma com `=` passa: `--attr-source=HEAD` é uma palavra só, e o laço da linha 378 trata essa palavra como opção sem argumento.
- **Mutações:** os três blocos casam com o texto literal da linha 365. Cada um tira uma opção do `Set` e tem o seu caso vermelho.
- **Documentação:** a techspec §5(a) (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/techspec.md:87`) e a linha 59 do `10_task.md` trazem a lista nova.
- **`cenarios.md`:** não lista as opções globais em lugar nenhum, então a correção não deixa divergência só no `N_task.md`.

Recomendações:
- **`--super-prefix` está descrito como opção atual na techspec.**
  - O git 2.56 desta máquina responde `opção desconhecida: --super-prefix`. Ele saiu do `handle_options` em versões anteriores.
  - O comentário do código já diz que ela é "de git mais antigo". A techspec:87 não diz e a apresenta como uma das opções "de `handle_options` do `git.c`".
  - Na prática ela só gera negação a mais, sobre um comando que o git recusaria de qualquer jeito. Vale alinhar a frase da techspec com o comentário do código.
- **Ainda passam formas que nenhuma categoria de limite nomeia** (vêm da 3ª rodada): `! git commit -n`, `{ …; }`, `if/then`, o redirecionamento colado (`-n>/dev/null`) e `timeout 60 git …`. Pela frase "todo o resto é limite" elas não bloqueiam. Mesmo assim vale pôr essas palavras em `ENVOLTORIOS`, ou nomear as categorias na §5(a).
- **`cenarios.md:73` continua desatualizado:** a lista do `decidirCommit` ainda começa por "sem revisor". O `10_task.md` trocou isso por "revisor obrigatório sem rodada (`test-engineer` ausente)".
- **A techspec diz que o leitor "decodifica" o que ele só reconhece:** em `techspec.md:94` e na linha 92 do `10_task.md`. O leitor reconhece `\"`, `\\` e `\'` para não fechar as aspas, mas não os decodifica. A frase certa seria "reconhece, sem decodificar".

## test-engineer · 4ª rodada · APROVADO · 2026-10-23 20:25:38 · `tasks/prd-harness/10_task.md`

VEREDITO: APROVADO

**Cenários exigidos (rodada 4):** a correção da 3ª rodada. O leitor precisa pular `--attr-source` e `--shallow-file`, com o argumento na palavra seguinte. Cada opção nova precisa de um caso em `negados` e de um bloco de mutação vermelho no seu caso. Também pedi o caso com `-c core.hooksPath` depois de uma opção nova, e a lista nova na techspec §5(a).

**Cobertos:**
- **O `Set` foi corrigido.** Em `tools/processo/comando-git.ts:365` entraram `--attr-source`, `--shallow-file` e `--super-prefix`. Chamei `desvioDoHook` direto, sem mexer em arquivo, e os três desvios da rodada anterior agora são negados:
  - `git --attr-source HEAD commit -n -m x` é negado pelo `-n`.
  - `git --attr-source HEAD -c core.hooksPath=/dev/null commit -m x` e `git --shallow-file x -c core.hooksPath=/dev/null commit -m x` são negados pelo `core.hooksPath`.
  - `git --shallow-file x -c alias.c=commit c -n -m x` é negado pelo alias.
- **Formas que não estão no `Set` continuam negadas:** `--attr-source=HEAD`, `--shallow-file=x`, `--list-cmds=main`, `--exec-path`, `-P`, `--no-pager -C .` e `--git-dir=.git --work-tree=.`. Comparei a lista com o `git --help` do git 2.56: nenhuma outra opção global leva o argumento na palavra seguinte.
- **Casos em `negados`:** `revisoes.test.ts:1659-1661` tem um para cada opção nova, com o motivo `-n`. Em `passam`, `revisoes.test.ts:1721` fixa a forma com `=` como uma palavra só.
- **Mutações:** o `10_task.md` declara três blocos, um por opção tirada do `Set`. O texto deles bate com a linha como ela está, e cada um derruba o seu caso de `-n`. O portão já provou os três.
- **Tabela de testes:** a linha do `desvioDoHook` (`10_task.md:59`) cita as três opções e a forma com `=`.
- **Execução:** `npx vitest run tools/processo/revisoes.test.ts` passou com 217 testes. Na primeira execução houve uma falha fora desta tarefa (a última recomendação explica).

**Bloqueantes:** nenhum.

Duas partes da correção exigida não foram feitas ao pé da letra. Nenhuma deixa regra sem teste nem abre desvio, por isso as duas vão nas recomendações:
- O caso com `-c core.hooksPath` depois de opção nova não entrou em `negados`. O comportamento está certo, como mostrei acima. E a única mutação que quebra esse caminho, tirar a opção do `Set`, já fica vermelha no caso de `-n` da mesma opção.
- O texto "as seis opções" continua na techspec.

**Recomendações:**
1. Acrescentar em `negados` o caso `git --shallow-file x -c core.hooksPath=/dev/null commit -m x`, que eu exigi na rodada anterior. É uma linha e fixa o caminho do `core.hooksPath` depois de uma opção nova.
2. Corrigir `tasks/prd-harness/techspec.md:97`. A frase "Do git, lê as seis opções antes do subcomando" sobreviveu: só a linha 87 recebeu a lista nova. Hoje o parágrafo da gramática fechada, que decide o que é bug e o que é limite, diz "seis" e a linha 87 lista nove. Basta trocar por "lê as opções da lista acima".
3. O texto de `--super-prefix` deve dizer que ela só vale para git antigo. O git 2.56 desta máquina não a aceita mais, e o comentário do código já diz isso. A techspec e a tabela do `10_task.md` deveriam dizer o mesmo.
4. Fica de fora desta tarefa, para a `/retro`: o teste `revisoes.test.ts:1424` (`achados separados por documento, com índice › o índice compartilhado não perde linha com rodadas terminando ao mesmo tempo`) falhou uma vez na primeira execução. Ele recebeu `[0,0,0,0,1,0]`, com um processo terminando com código 1, e passou ao rodar de novo. A falha veio enquanto os outros revisores rodavam ao mesmo tempo, o que aponta para um teste que só passa com a máquina folgada. O trecho não foi alterado por esta tarefa (os blocos dela começam na linha 1595), mas o teste precisa de dono antes que a esteira o pegue.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/comando-git.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/10_task.md

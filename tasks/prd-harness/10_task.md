# Tarefa 10.0 — Uma decisão de commit para as duas entradas, e o `PreToolUse` nega o desvio

**Funcionalidade:** harness (X7) · **Depende de:** 2.0
**Subagentes obrigatórios:** `infra-guardian`
**Porte:** grande

## Objetivo

A decisão inteira do commit vira a função `decidirCommit({ mensagem, arquivos, conteudoDe, raiz, papel })`, que o
`PreToolUse` chama hoje e o git hook nativo chamará na 11.0 (pura só no que decide: lê o disco da `raiz` em três pontos, divergência da tabela abaixo); e o `PreToolUse` nega, em sessão de papel, as formas de
pular o hook, e em qualquer sessão do Claude Code a linha `Fora do processo:`.

## Contexto necessário

- `techspec.md` §5(a), até "O `commit-msg`" (o hook nativo é a 11.0), e §5(c)
- `prd.md` RF14
- `cenarios.md` seção B, **RF14, negação no `PreToolUse`**
- Código: `tools/processo/portao.ts` (`portao`, `avaliarPortao`, da 2.0); `tools/processo/comando-git.ts` (`ehCommit`,
  `arquivosDoCommit`, `documentoDoCommit`, `pastaDoCommit`, `pushDoTime`); `tools/processo/hook-revisoes.ts`;
  `.claude/settings.json` (o comando do `PreToolUse` do Bash, com o `exit 2`)

## Subtarefas

- [x] 10.1 — `decidirCommit` em `portao.ts`: a marca, o documento, os obrigatórios, as pastas, o `avaliarPortao` e a
  conferência das mutações, sem ler git (o texto vem por `conteudoDe`; o disco da `raiz` só nos três pontos da divergência declarada abaixo); o `portao` de hoje passa
  a montar a entrada e chamá-la
- [x] 10.2 — A mensagem vem de `-m`, ou do arquivo de `-F x`, `-Fx`, `--file=x`
- [x] 10.3 — Negação em sessão de papel (`CLAUDE_CODE_AGENT` em `PAPEIS_DO_TIME`): `--no-verify` e abreviações; `-n` em
  `commit`, sozinho ou combinado; `core.hookspath` em qualquer caixa, em `-c` e em `git config`; `VAR=`, `unset` e
  `env -u` com `CLAUDE_CODE_AGENT` ou `GIT_CONFIG_`
- [x] 10.4 — Em qualquer sessão: mensagem com `Fora do processo:`, no `-m` ou no arquivo, negada; o termo só dentro de
  `-m "..."` sugere `-F`
- [x] 10.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/portao.ts` | alterado |
| `tools/processo/comando-git.ts` | alterado |
| `tools/processo/hook-revisoes.ts` | alterado |
| `tools/processo/hook-portao.test.ts` | alterado |
| `tools/processo/revisoes.test.ts` | alterado |
| `knip.json` | alterado (o `mkfifo` do teste do fifo) |
| `tools/guardas/knip.test.ts` | alterado (o `mkfifo` do teste do fifo) |

## Testes que provam a regra

Do `cenarios.md`, RF14, negação no `PreToolUse`, com o comando real do `settings.json`. Um caso por forma (`it.each`):

| Cenário | Tipo | O que prova |
|---|---|---|
| negados com papel: `--no-verify`, `--no-verif`, `--no-ver`; `commit -n`, `-nm "x"`, `-anm "x"`; `-c core.hooksPath=/dev/null`, `-c core.HOOKSPATH=x`, `config core.hookspath`; `CLAUDE_CODE_AGENT= git commit`, `unset CLAUDE_CODE_AGENT`, `env -u CLAUDE_CODE_AGENT`, `GIT_CONFIG_COUNT=1 git commit` | unidade (processo) | negados |
| passam com papel: `git log -n 3`, `git diff --no-ext-diff`, `git -c user.name=x commit`, `GIT_AUTHOR_DATE=x git commit`, `grep CLAUDE_CODE_AGENT`, `printenv CLAUDE_CODE_AGENT`, `git commit -F msg.txt` com `--no-verify` dentro do arquivo | idem | passam |
| sem papel: cada negado acima | idem | passa |
| `Fora do processo:` com e sem papel, no `-m`, em `-F msg.txt`, `-Fmsg.txt`, `--file=msg.txt` | idem | negado |
| termo só dentro de `-m "..."` | idem | negado com a dica de `-F` |
| `decidirCommit` e `portao` com a mesma entrada | unidade | mesma decisão, nos casos de `portão do commit` |
| As formas acima, direto na função (`desvioDoHook`), mais: `/usr/bin/git`, `env`, `command`, atribuição, `-C`, `--git-dir`, `--work-tree`, `--namespace`, `--config-env`, `--attr-source`, `--shallow-file`, `--super-prefix` antes do subcomando (as de `handle_options`, conferidas com `git --help`; `--attr-source=x` é uma palavra só); `--no-v`; `push --no-verify`; `env --unset`, `-uNOME`, `export`; `-n` só no `commit` (`push -n` passa); `-mn`, `-Fn`, `-Cn`, `-cn`, `-tn`, `-Sn`, `-uno` passam | unidade (`revisoes.test.ts › o desvio do hook do git em sessão de papel`) | cada uma negada com o motivo dela, ou `null` |
| `--no-verify` e `CLAUDE_CODE_AGENT=` dentro de mensagem de commit ou de mensagem a outro agente; `--` de caminhos; `npx x --no-verify`; `x-GIT_CONFIG_COUNT=1 git commit` | unidade | passam |
| `portao` com papel do time, `''` e papel de fora do time | unidade | nega só no papel do time |
| `-F x`, `-Fx`, `-aF x`, `--file=x`, `--file x`, dois commits, aspas, `-F` sem arquivo, `-mFoo`, `git log -F` | unidade (`… › a mensagem do commit vem do comando ou do arquivo`) | o arquivo certo, ou nenhum |
| `Fora do processo:` sem distinguir maiúscula; o termo no meio de um `-m`; a menção no meio da linha do arquivo; o arquivo lido da pasta do `-C` e do `cwd`; o que não é arquivo regular (pasta, `/dev/zero`); a marca e `Revisões:` vindas do arquivo | unidade | negado, passa, ou segue para os revisores |
| A barra invertida (dentro da opção, do subcomando, antes da quebra de linha), `$'…'` (também colado numa palavra, `--no-verif$'y'`, e com `\'` dentro) e `$"…"` colado, e `\"` dentro de aspas duplas; o alias por `-c` (também junto do `config`), `--config-env` (com espaço e com `=`) e `config`; os limites da gramática do leitor (`${X}`, chaves, `include.path`); as aspas ímpares dentro de `$(cat <<EOF)` (limite) | unidade (`… › as palavras do comando do shell`, `… › o desvio do hook do git em sessão de papel`) | negado, passa, ou o limite fixado |
| O `catch` do hook, num Bash que não é commit | unidade (processo, `hook-portao.test.ts`) | `Comando bloqueado: o portão de revisões falhou`, sai 0 |
| `decidirCommit`: revisor obrigatório sem rodada (`test-engineer` ausente), veto, carimbo ausente, código sem marca, documento de correção ausente, conferência a mais, documento ilegível; `alterados` contra `arquivos` | unidade (`… › decidirCommit e portao decidem igual`) | as duas entradas dão o mesmo motivo |
| As mesmas negações pelo comando do `settings.json`, com `git init` na cópia | unidade (processo, `hook-portao.test.ts`) | `deny` no stdout, sai 0; sem papel, calado |

## Como testar

- Copiar `tools/processo/hook-portao.test.ts › o hook do portão que não carrega bloqueia o Bash › hook são, push do time para a develop: sai 0 e o deny da regra passa intacto no stdout`: roda o comando do `settings.json` como processo, com a entrada JSON do `PreToolUse` e `CLAUDE_CODE_AGENT` no ambiente.
- A paridade: um `describe` próprio, `revisoes.test.ts › decidirCommit e portao decidem igual (RF14)`, chama as duas entradas com a mesma árvore (sem revisor, veto, carimbo ausente, código sem marca, documento de correção ausente, conferência a mais, documento ilegível). Os casos de `portão do commit` seguem chamando só o `portao`, como antes (RF13).
- Rodar: `npx vitest run --project unidade tools/processo/hook-portao.test.ts tools/processo/revisoes.test.ts`.
- Armadilha: um `exit 2` errado trava todo Bash do time, este inclusive. Conserto pelo Edit; socorro em `techspec.md` §5(c).

## Fora do escopo desta tarefa

O `commit-msg`, o `pre-push` e o `prepare` (11.0); a esteira (12.0); a tabela de guardiões (13.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `decidirCommit(entrada, conferencia)`: a conferência das mutações é o segundo parâmetro, e a entrada ganha `alterados` (opcional), os arquivos alterados da árvore, ao lado de `arquivos`, os que o commit leva | O `portao.ts` não importa o `mutacoes.ts` (§5d), e por isso a conferência entra de fora. O `PreToolUse` sempre caducou as rodadas e conferiu as mutações contra a árvore inteira (`git status`), e decidiu se o commit leva código pelo `arquivosDoCommit`: com uma lista só, ou o commit de documento passava a ser bloqueado por código de outra tarefa, ou a caducidade passava a ignorar o que está na árvore e não no commit. Sem `alterados`, valem os `arquivos`: é o caso do git hook (11.0) | `techspec.md` §5(a), "No código (10.0)"; `cenarios.md` B, RF14 (o que a 10.0 acrescenta) |
| O `papel` fica na entrada, mas a 10.0 não o lê | A assinatura da tarefa o pede; quem o usa é a 14.0 (RF16): as pastas de processo só valem como código em sessão de papel | `techspec.md` §5(a) e §5(e) |
| `documentoDoCommit(comando, …)` virou `documentoDaMensagem(mensagem, …)`, sem a guarda `ehCommit`; a mensagem do `PreToolUse` é o comando inteiro mais o texto do arquivo de `-F`, lido da pasta em que o commit roda | A mensagem do git hook não tem `git commit` no texto. O comando inteiro, e não só o `-m`, porque a mensagem pode vir de `$(cat <<EOF …)` e a marca é lida do texto, como sempre foi | `techspec.md` §5(a), "No código (10.0)" |
| O caminho `(mvp: …)` fica no `portao`, antes da `decidirCommit`, e não dentro dela | O RF13 manda os testes atuais passarem sem alteração, e eles cobrem o MVP; a `decidirCommit` do git hook (11.0) já trata o commit marcado como código sem tarefa, que é o RF18, e a 14.0 tira o caminho do `portao` | `techspec.md` §5(a); `prd.md` RF13 e RF18 |
| A linha `Fora do processo:` é de `bloqueioDoForaDoProcesso(comando, doArquivo)`, fora da `decidirCommit`, e não distingue maiúscula | A negação vale em qualquer sessão, e a decisão do commit só roda depois de tudo o que o `PreToolUse` já recusa; o git hook reaproveita a função. Sem distinguir caixa, a esteira (12.0) não aceita o que o hook deixou passar | `techspec.md` §5(a); `cenarios.md` B, RF14 |
| O desvio é lido por palavras do shell (aspas, `;`, `&&`, `|`, quebra de linha, `\x`, `$'…'`), com `export`, `command`, `exec`, `nohup` e `time` além do que a tarefa lista, e o alias do git (`-c alias.*`, `config alias.*`) também é negado | Uma expressão regular sobre o texto acusava `--no-verify` dentro de mensagem a outro agente, e perdia o git atrás de `env`, `command` e do caminho absoluto. O alias é o jeito mais curto de chamar `commit -n` sem dizê-lo. Fora, e declarado: `sh -c`, script, substituição de comando, `xargs`, o octal dentro de `$'…'`, o alias que já estava no config e as aspas duplas em número ímpar dentro de `$(cat <<EOF)` (que dá negação falsa; a saída é `-F`) | `techspec.md` §5(a), "No código (10.0)"; limites declarados do RF14 |
| A `decidirCommit` lê o disco da `raiz` em três pontos, e não só pelo `conteudoDe`: o que o processo guarda (`.processo/`, a pasta `tasks/`), a existência do documento de correção, e a caducidade (`alteracoesDeCodigo`: o hash dos bytes e a hora dos arquivos de código alterados) | O hash do carimbo é dos bytes do arquivo (também dos binários de `apps/web`), e o `conteudoDe` devolve texto: refazer o hash por ele daria outro valor e caducaria o que não mudou. No git hook (11.0) a caducidade julga o disco, que no commit comum é igual ao índice | `techspec.md` §5(a), "No código (10.0)"; `cenarios.md` B, RF14 |
| O `catch` do `hook-revisoes.ts` diz "Comando bloqueado: o portão de revisões falhou", e não mais "Commit bloqueado" | O desvio é lido em todo Bash de sessão de papel, e a exceção do leitor, que sai por esse `catch`, aparece num comando que não é commit | `techspec.md` §5(c) |
| A gramática do leitor do shell é fechada: o que ele decodifica está escrito, e o resto é limite por categoria | Sem contorno, cada rodada achava uma forma nova do bash e a lista de limites crescia forma a forma (escalada da 2ª reprovação, `.processo/ordens/diagnostico-10.md`) | `techspec.md` §5(a), "A gramática do leitor é fechada"; `cenarios.md` B, RF14 |

## Mutações

Cada cláusula que o diff acrescenta em `comando-git.ts` e `portao.ts`, com o teste que falha sem ela. Os testes são de
unidade e os casos de `it.each` têm o rótulo no título, então o nome do `describe` roda a tabela inteira de uma vez. Cobertos:
o leitor do shell (`comandosDoShell`: o separador, cada grupo de aspas, o `\"` dentro de aspas duplas, o `$'…'`, a barra invertida e a quebra de linha, o pedaço colado, o filtro dos vazios); as peças
pequenas (`nomeAtribuido` com a âncora, `programaDe`, `ehVariavelDoHook` termo a termo, `ENVOLTORIOS`); o `lerOEnv`
(`-u`, `--unset`, `-uNOME`, `--unset=NOME`, a atribuição, a opção que não é do `env`, o avanço do índice); o `lerComando`
(a atribuição e o avanço, o `env`, o envoltório, o `slice`, a atribuição solta); o `desvioDoAmbiente` (`unset`, `export`, o
nome sem `=`, a saída); o `chamadaDoGit` (só `git`, as opções antes do subcomando, cada uma das seis do `Set`, o avanço de
dois, o argumento nos globais); o `desvioDoGit` (o alias nos globais e no `config`, o `core.hooksPath` nos globais e no `config`, o `--no-verify` e o `-n` só
no `commit`); o `ehNoVerify` (o piso de seis letras e o prefixo); o `ehNDoCommit` (a âncora, o `includes` e cada uma das
sete letras que levam argumento); o `desvioDoHook` (o ambiente, o git, o retorno); os arquivos de mensagem (as duas
expressões, cada alternativa, o `colado`, o `proximo`, o subcomando, o `catch`, o arquivo regular, o `resolve`, o `join`); e, em `portao.ts`, o
`arquivosDeCodigo`, o `decidirCommit` (o documento ilegível, os `alterados` contra os `arquivos`, o erro do documento, a
conferência padrão), o `conteudoDoDisco` (a existência e o arquivo regular), o catch do `hook-revisoes.ts`, o commit do MVP termo a termo (que a 14.0 tira), a linha `Fora do processo:`
(`^`, `i`, `m`, cada termo da condição, a caixa do comando, a dica), o desvio (o papel do time e o retorno) e o
`bloqueioDoCommit` (a pasta do `-C`, o bloqueio da linha, os `arquivos` do commit, o `if` do MVP).

Sem bloco, de propósito: o `papel !== undefined &&` do `ehPapelDoTime` (estreitamento de tipo: `includes(undefined)` dá o
mesmo `false`); os `?? ''`, `?? []` e `?? null` de fallback que o `noUncheckedIndexedAccess` pede; o `: raiz` de
`onde && 'pasta' in onde ? onde.pasta : raiz` (inalcançável: o `bloqueioAntesDaArvore` já recusou o caminho
`indeterminado`, e `onde` nunca é `null` num `ehCommit`); o `$` do fim de `/^-([A-Za-z]+)$/` (nenhuma forma de `git commit`
o distingue, porque a palavra depois de uma letra que não é opção é argumento); o `.` do fim de `/^(?:-u|--unset=)./` (o `-u`
sozinho já foi tomado pelo ramo anterior); o `papel ?? ''` da mensagem do desvio (só estreita o tipo); e a linha `instantaneo`
do commit do MVP, que a tarefa só moveu de lugar e que sai na 14.0.

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- return papel !== undefined && PAPEIS_DO_TIME.includes(papel)
+ return papel !== undefined
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › agente do time não empurra develop
- if (!ehPapelDoTime(papel) || !GIT_PUSH.test(comando)) return null
+ if (false || !GIT_PUSH.test(comando)) return null
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › as palavras do comando do shell
- comandos.push([])
+ comandos.length
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › as palavras do comando do shell
- if (pedaco[5] !== undefined) {
+ if (false) {
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › as palavras do comando do shell
- pedaco.slice(1).find((grupo) => grupo !== undefined)
+ pedaco.slice(2).find((grupo) => grupo !== undefined)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › as palavras do comando do shell
- comando.replaceAll('\\\n', '')
+ comando
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › as palavras do comando do shell
- "((?:[^"\\]|\\.)*)"
+ "([^"]*)"
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › as palavras do comando do shell
- |\$'((?:[^'\\]|\\.)*)'|
+ |\$%((?:[^'\\]|\\.)*)'|
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › as palavras do comando do shell
- |\\(.)|
+ |\\(%)|
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- /\$?"((?:[^"\\]|\\.)*)"|
+ /"((?:[^"\\]|\\.)*)"|
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- |((?:[^\s;&|()"'\\$]|\$(?!['"]))+)/g
+ |((?:[^\s;&|()"'\\]|\$(?!['"]))+)/g
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- |((?:[^\s;&|()"'\\$]|\$(?!['"]))+)/g
+ |((?:[^\s;&|()"'\\$]|\$)+)/g
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › as palavras do comando do shell
- |((?:[^\s;&|()"'\\$]|\$(?!['"]))+)/g
+ |((?:[^\s;&|()"'\\$])+)/g
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- |\$'((?:[^'\\]|\\.)*)'|
+ |\$'([^']*)'|
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › as palavras do comando do shell
- if (pedaco.index === fimDoPedaco) atual.push
+ if (false) atual.push
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › as palavras do comando do shell
- fimDoPedaco = pedaco.index + pedaco[0].length
+ fimDoPedaco = -1
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › as palavras do comando do shell
- return comandos.filter((palavras) => palavras.length > 0)
+ return comandos
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- const ATRIBUICAO = /^([A-Za-z_][A-Za-z0-9_]*)=/
+ const ATRIBUICAO = /([A-Za-z_][A-Za-z0-9_]*)=/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- palavra.split('/').pop() ?? palavra
+ palavra
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- nome === 'CLAUDE_CODE_AGENT' ||
+ false ||
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- nome.startsWith('GIT_CONFIG_')
+ false
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- new Set(['command', 'exec', 'nohup', 'time', 'builtin'])
+ new Set([])
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- if (nome !== null) definidos.push(nome)
+ if (nome !== null) void nome
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- palavra === '-u' ||
+ false ||
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- palavra === '--unset'
+ false
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- retirados.push(palavras[++i] ?? '')
+ retirados.push(palavras[i + 1] ?? '')
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- /^(?:-u|--unset=)./.test(palavra)
+ /^(?:--unset=)./.test(palavra)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- /^(?:-u|--unset=)./.test(palavra)
+ /^(?:-u)./.test(palavra)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- retirados.push(palavra.replace(/^(?:-u|--unset=)/, ''))
+ retirados.push(palavra)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- else if (!palavra.startsWith('-')) break
+ else break
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- definidos.push(nome)
+ void nome
  i++
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
  definidos.push(nome)
- i++
+ i += 2
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- } else if (programa === 'env') i = lerOEnv
+ } else if (false) i = lerOEnv
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- else if (ENVOLTORIOS.has(programa)) i++
+ else if (ENVOLTORIOS.has(programa)) i += 2
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- args: palavras.slice(i + 1) }
+ args: palavras.slice(i) }
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- return { definidos, retirados, programa: '', args: [] }
+ return { definidos: [], retirados, programa: '', args: [] }
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- if (comando.programa === 'unset')
+ if (false)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- if (comando.programa === 'export')
+ if (false)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- nomeAtribuido(argumento) ?? argumento
+ nomeAtribuido(argumento) ?? ''
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- return nome === undefined ? null
+ return true ? null
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- if (comando.programa !== 'git') return null
+ if (false) return null
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- while ((comando.args[i] ?? '').startsWith('-'))
+ while (false)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- OPCOES_DO_GIT_COM_ARGUMENTO.has(opcao)
+ false
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- i += argumento === undefined ? 1 : 2
+ i += 1
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- globais.push(opcao, ...(argumento === undefined ? [] : [argumento]))
+ globais.push(opcao)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- '-c', '--git-dir',
+ '-c',
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- '--git-dir', '--work-tree',
+ '--git-dir',
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- '--work-tree', '--namespace',
+ '--work-tree',
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- '--namespace', '--config-env'
+ '--namespace'
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- '-C', '-c',
+ '-c',
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- '--config-env', '--attr-source'
+ '--config-env'
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- '--attr-source', '--shallow-file'
+ '--attr-source'
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- '--shallow-file', '--super-prefix'
+ '--shallow-file'
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- '-C', '-c',
+ '-C',
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- const CAMINHO_DOS_HOOKS = /core\.hookspath/i
+ const CAMINHO_DOS_HOOKS = /core\.hookspath/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- palavra.length >= '--no-v'.length
+ true
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- '--no-verify'.startsWith(palavra)
+ true
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- /^-([A-Za-z]+)$/.exec(palavra)
+ /-([A-Za-z]+)$/.exec(palavra)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- .includes('n')
+ .includes('x')
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- /[mFCctSu]/
+ /[FCctSu]/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- /[mFCctSu]/
+ /[mCctSu]/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- /[mFCctSu]/
+ /[mFctSu]/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- /[mFCctSu]/
+ /[mFCtSu]/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- /[mFCctSu]/
+ /[mFCcSu]/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- /[mFCctSu]/
+ /[mFCctu]/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- /[mFCctSu]/
+ /[mFCctS]/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- chamada.globais.some((opcao) => CAMINHO_DOS_HOOKS.test(opcao))
+ false
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- chamada.subcomando === 'config' &&
+ true &&
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- chamada.resto.some((argumento) => CAMINHO_DOS_HOOKS.test(argumento))
+ false
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- if (chamada.resto.some(ehNoVerify))
+ if (false)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- chamada.subcomando === 'commit' && chamada.resto.some(ehNDoCommit)
+ true && chamada.resto.some(ehNDoCommit)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- chamada.subcomando === 'commit' && chamada.resto.some(ehNDoCommit)
+ chamada.subcomando === 'commit' && false
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- const desvio = desvioDoAmbiente(lido) ??
+ const desvio = null ??
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- (chamada === null ? null : desvioDoGit(chamada))
+ (null)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- if (desvio !== null) return desvio
+ if (false) return desvio
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- /^(?:-[aeinopqsvzN]*F|--file)$/
+ /^(?:-F|--file)$/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- /^(?:-[aeinopqsvzN]*F|--file)$/
+ /^(?:-[aeinopqsvzN]*F)$/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- /^(?:-[aeinopqsvzN]*F|--file=)(.+)$/
+ /^(?:-F|--file=)(.+)$/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- /^(?:-[aeinopqsvzN]*F|--file=)(.+)$/
+ /^(?:-[aeinopqsvzN]*F)(.+)$/
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- if (colado !== undefined) return [colado]
+ if (false) return [colado]
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- proximo !== undefined
+ true
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- chamada?.subcomando === 'commit'
+ true
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
  return readFileSync(caminho, 'utf8')
  } catch {
- return ''
+ throw new Error('sem arquivo')
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- resolve(pasta, arquivo)
+ join(pasta, arquivo)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- .join('\n')
+ .join('')
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › bloqueia commit que leva código sem tarefa nem correção
- PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta))
+ true
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › bloqueia commit que leva código sem tarefa nem correção
- if (codigo.length === 0) return null
+ if (false) return null
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- if (conteudo === null)
+ if (false)
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- alteracoes: alteracoesDeCodigo(entrada.raiz, alterados),
+ alteracoes: alteracoesDeCodigo(entrada.raiz, entrada.arquivos),
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- caminho, conteudo, alterados)
+ caminho, conteudo, entrada.arquivos)
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- mensagemCommit: entrada.mensagem,
+ mensagemCommit: '',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o hook, no repositório de verdade, deixa passar o arquivo mutado e restaurado
- instantaneos: lerInstantaneos(entrada.raiz),
+ instantaneos: {},
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- carimbo: lerCarimbo(entrada.raiz),
+ carimbo: null,
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- const alterados = entrada.alterados ?? entrada.arquivos
+ const alterados = entrada.arquivos
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- const alterados = entrada.alterados ?? entrada.arquivos
+ const alterados = entrada.alterados ?? []
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- bloqueioDoCommitSemDocumento(entrada.arquivos)
+ bloqueioDoCommitSemDocumento(alterados)
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- if ('erro' in documento)
+ if (false)
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- conferencia: ConferenciaDoDocumento = () => null): string | null {
+ conferencia: ConferenciaDoDocumento = () => 'portão local: sem conferência'): string | null {
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- return existsSync(caminho) && statSync(caminho).isFile() ?
+ return true ?
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- return existsSync(caminho) && statSync(caminho).isFile() ?
+ return existsSync(caminho) ?
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › decidirCommit e portao decidem igual
- return existsSync(caminho) && statSync(caminho).isFile() ?
+ return statSync(caminho).isFile() ?
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › marcador sem resumo não é marcador
- marcadorDoMvp(entrada.mensagem) !== null
+ true
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › a marca de tarefa vence a do MVP
- documentoDaMensagem(entrada.mensagem, entrada.raiz, alterados) === null
+ true
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › commit que não leva código passa com ou sem o marcador
- arquivosDeCodigo(entrada.arquivos).length > 0
+ true
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › passa sem documento de tarefa e sem revisor
- if (ehCommitDoMvp(entrada, alterados))
+ if (false)
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › só vale em branch mvp
- branch: branchAtual(raiz),
+ branch: 'mvp/x',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › passa sem documento de tarefa e sem revisor
- carimbo: lerCarimbo(raiz),
+ carimbo: null,
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › bloqueia sem carimbo, com carimbo sem uma das três suítes
- alteracoes: alteracoesDeCodigo(raiz, alterados),
+ alteracoes: [],
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- const DEFINICAO_DE_ALIAS = /^(?:--config-env=)?alias\./i
+ const DEFINICAO_DE_ALIAS = /(?:--config-env=)?alias\./i
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- const DEFINICAO_DE_ALIAS = /^(?:--config-env=)?alias\./i
+ const DEFINICAO_DE_ALIAS = /^(?:--config-env=)?alias\./
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- const DEFINICAO_DE_ALIAS = /^(?:--config-env=)?alias\./i
+ const DEFINICAO_DE_ALIAS = /^alias\./i
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- chamada.subcomando === 'config' ? chamada.resto : []
+ false ? chamada.resto : []
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- chamada.subcomando === 'config' ? chamada.resto : []
+ true ? chamada.resto : []
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- const palavras = [...chamada.globais, ...(
+ const palavras = [...(
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- if (defineAlias(chamada)) return
+ if (false) return
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- if (!statSync(caminho).isFile()) return
+ if (false) return
```

```mutacao
arquivo: tools/processo/hook-revisoes.ts
teste: tools/processo/hook-portao.test.ts › portão que lança com o hook de pé
- motivo = `Comando bloqueado: o portão de revisões falhou
+ motivo = `Commit bloqueado: o portão de revisões falhou
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- const LINHA_FORA_DO_PROCESSO = /^Fora do processo:/im
+ const LINHA_FORA_DO_PROCESSO = /Fora do processo:/im
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- const LINHA_FORA_DO_PROCESSO = /^Fora do processo:/im
+ const LINHA_FORA_DO_PROCESSO = /^Fora do processo:/i
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- const LINHA_FORA_DO_PROCESSO = /^Fora do processo:/im
+ const LINHA_FORA_DO_PROCESSO = /^Fora do processo:/m
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- if (!noArquivo && !comando
+ if (true && !comando
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- !comando.toLowerCase().includes(TERMO_FORA_DO_PROCESSO.toLowerCase())
+ true
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- comando.toLowerCase().includes(
+ comando.includes(
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- includes(TERMO_FORA_DO_PROCESSO.toLowerCase())
+ includes(TERMO_FORA_DO_PROCESSO)
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- const dica = noArquivo
+ const dica = true
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- const dica = noArquivo
+ const dica = false
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- const desvio = ehPapelDoTime(papel) ? desvioDoHook(comando) : null
+ const desvio = true ? desvioDoHook(comando) : null
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o desvio do hook do git em sessão de papel
- if (desvio === null) return null
+ if (false) return null
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
- onde && 'pasta' in onde ? onde.pasta : raiz
+ raiz
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › a mensagem do commit vem do comando ou do arquivo
  const raiz = arvoreDoCommit(comando, raizDaSessao, cwd)
- const onde = pastaDoCommit(comando, raizDaSessao, cwd)
+ const onde = pastaDoCommit(comando, raizDaSessao, undefined)
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/hook-portao.test.ts › Fora do processo: negado com e sem papel
- if (fora !== null) return fora
+ if (false) return fora
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › bloqueia commit que leva código sem tarefa nem correção
- arquivos: arquivosDoCommit(comando, raiz, alterados, arquivosPreparados(raiz)),
+ arquivos: alterados,
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/hook-portao.test.ts › com papel, o deny sai no stdout e o hook sai 0
- if (desvio !== null) return desvio
+ if (false) return desvio
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral 1ª, test-engineer 1ª | `hook-revisoes.ts` aparece como "alterado" em "Arquivos previstos" e não mudou | Resolvida pelo item 6: o arquivo passa a ser alterado e a tabela fica como está. Se o item 6 não o alterar, corrija a linha da tabela |
| revisor-geral 1ª | A mensagem do desvio (`portao.ts`, `bloqueioDoDesvio`) diz que o papel "commita pelo git hook", e o hook nativo só existe a partir da 11.0 | Tarefa 11.0, que cria o git hook e torna o texto verdadeiro |
| test-engineer (4ª) | Pôr em `negados` o caso `git --shallow-file x -c core.hooksPath=/dev/null commit -m x`. A mutação de tirar a opção do `Set` já fica vermelha no caso de `-n` da mesma opção | Tarefa futura que tocar `revisoes.test.ts › o desvio do hook do git`; sem risco de regra sem teste |
| test-engineer (4ª) | `techspec.md:97` diz "lê as seis opções antes do subcomando" e a linha 87 lista nove | Texto de documento: o Orquestrador pede ao Arquiteto na próxima passada sobre a Tech Spec (divergência de texto, sem efeito no código) |
| test-engineer (4ª), revisor-geral (4ª) | `--super-prefix` deve ser descrita como de git antigo (o 2.56 não a aceita) na techspec e na tabela do `10_task.md` | Mesmo destino do item anterior |
| test-engineer (4ª) | O teste `revisoes.test.ts › o índice compartilhado não perde linha com rodadas terminando ao mesmo tempo` falhou uma vez com a máquina ocupada (`[0,0,0,0,1,0]`) e passou ao repetir | `/retro` da spec, ou `TODO.md`: fora desta tarefa, o trecho não foi alterado por ela |
| revisor-geral (3ª e 4ª), infra-guardian (4ª) | Formas que passam sem categoria de limite nomeada: `! git commit -n`, `{ …; }`, `if/then/do/else`, redirecionamento colado, `timeout 60 git …` | Mudaria comportamento e contrato da gramática (não é barata); nomear as categorias na §5(a) fica para a Tech Spec ou para `TODO.md` |
| revisor-geral (3ª e 4ª) | `cenarios.md:73` ainda começa a lista do `decidirCommit` por "sem revisor" | Texto de documento: mesmo destino do `techspec.md:97` |
| revisor-geral (3ª e 4ª), test-engineer (3ª) | A techspec diz que o leitor "decodifica" o que só reconhece (`techspec.md:94`, `10_task.md:92`); a frase certa é "reconhece, sem decodificar" | Mesmo destino do `techspec.md:97` |
| test-engineer (3ª) | `replaceAll('\\\n', '')` também apaga barra e quebra dentro de aspas simples: só dá negação a mais | Uma linha de limite na techspec, junto do destino acima |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 17:52:22 | 2026-10-23 17:53:29 | `infra-guardian` | 1 | APROVADO | af68c71433059e8dc |
| 2026-10-23 17:52:25 | 2026-10-23 17:54:35 | `revisor-geral` | 1 | REPROVADO | af986442b6c59e13d |
| 2026-10-23 17:52:24 | 2026-10-23 17:55:29 | `test-engineer` | 1 | REPROVADO | ac221fbbc4736305c |
| 2026-10-23 18:31:01 | 2026-10-23 18:31:35 | `infra-guardian` | 2 | APROVADO | a7b15f2ef7435b739 |
| 2026-10-23 18:31:16 | 2026-10-23 18:32:19 | `revisor-geral` | 2 | REPROVADO | aaadcb00c0aa471e5 |
| 2026-10-23 18:31:10 | 2026-10-23 18:33:48 | `test-engineer` | 2 | REPROVADO | afd7f3ae296b0fc54 |
| 2026-10-23 18:47:10 | 2026-10-23 18:47:33 | `infra-guardian` | 3 | APROVADO | ab3b14d70234b7019 |
| 2026-10-23 18:47:25 | 2026-10-23 18:49:15 | `revisor-geral` | 3 | APROVADO | a4dca926e79d8cd62 |
| 2026-10-23 18:47:18 | 2026-10-23 18:49:43 | `test-engineer` | 3 | REPROVADO | abec8a73f591f3fb1 |
| 2026-10-23 20:23:48 | 2026-10-23 20:24:10 | `infra-guardian` | 4 | APROVADO | a0001bc68629106b2 |
| 2026-10-23 20:23:44 | 2026-10-23 20:24:17 | `revisor-geral` | 4 | APROVADO | ac615e5885aea855a |
| 2026-10-23 20:23:37 | 2026-10-23 20:25:38 | `test-engineer` | 4 | APROVADO | a8cfacdc2a1a4a02b |

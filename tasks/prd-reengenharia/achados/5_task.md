# Achados das revisões — `tasks/prd-reengenharia/5_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-21 20:06:27 · `tasks/prd-reengenharia/5_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

O que conferi:
- **A mudança:** o comando `portao` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/.claude/settings.json:32` é idêntico, caractere por caractere, ao de `onda-0.md` §2.5 (linha 102). O `registrar` não mudou. Nada mais em `.claude/` ou `tools/processo/` foi tocado, como pedem a techspec §11 e a seção "Fora do escopo".
- **O teste:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/processo/hook-portao.test.ts` lê o comando do `settings.json` e o roda com `sh -c` sobre uma cópia de `tools/processo/`. Cobre os sete cenários da tabela da tarefa. O caso do `deny` exige o motivo "Push bloqueado" e descarta o do `catch`, que era a armadilha que a tarefa apontava.
- **A cópia:** a cadeia `hook-revisoes.ts` → `revisoes.ts` / `mutacoes.ts` não importa nada de `../ci`, então copiar só `tools/processo/*.ts` basta para a cópia sã carregar.
- **As mutações:** os sete blocos cobrem as quatro mutações da tabela: tirar o `||`, tirar o `echo`, trocar `||` por `;` e mandar o stdout para `/dev/null`. Também cobrem o `registrar`. O carimbo dá o alvo como conferido.
- **A sessão manual (5.3):** está registrada no documento, com o que a tarefa pedia: o Bash bloqueado e o `{ …; }` aceito pelo Claude Code.

Recomendações:
- `hook-portao.test.ts:24-25`: `comandoDe` chama `expect` fora de um `it`. Em `const portao = comandoDe(...)`, dentro do `describe`, esse `expect` roda na coleta. Se o comando sumir do `settings.json`, o arquivo inteiro falha na coleta, sem nome de caso. Um `throw new Error('…')` explícito, ou a leitura dentro de cada `it`, daria uma falha mais legível.
- `hook-portao.test.ts:91-94`: o caso "a mensagem só aparece na falha de carga" repete a cópia sã e o `ls` do caso seguinte. Pode virar mais uma asserção no "hook são, Bash comum".

## test-engineer · 1ª rodada · APROVADO · 2026-10-21 20:06:36 · `tasks/prd-reengenharia/5_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** são os sete automatizados e o manual da tabela de "Testes que provam a regra" da 5.0.
- Hook que não carrega por três motivos (import inexistente, erro de sintaxe em `revisoes.ts`, módulo que lança na carga) sai 2.
- Na falha de carga, o stderr traz a mensagem exata de `onda-0.md` §2.5, que conferi na linha 102.
- Hook são com Bash comum sai 0 e não escreve nada no stdout.
- Hook são com push negado sai 0 e o `deny` da regra chega intacto no stdout.
- O `registrar` (`SubagentStop`) não ganha o `exit 2`.
- Manual: o exit 2 bloqueia o Bash no Claude Code.

Isolamento, concorrência e log de produto não se aplicam, como o documento diz: a tarefa mexe no processo, não em dado de escola.

**Cobertos:** todos, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/processo/hook-portao.test.ts`, que rodei: 8 passaram, 0 pularam.
- Import inexistente e mensagem: `import de módulo que não existe: sai 2 e diz o que fazer` (linha 68). Cobre a linha da tabela e o bloco que tira o `echo`.
- Sintaxe: `erro de sintaxe em revisoes.ts: sai 2` (linha 75). O hook importa `revisoes.ts` direto (`hook-revisoes.ts:6`), então o cenário chega à carga.
- Lança na carga: `módulo que lança ao carregar: sai 2` (linha 82). O hook importa `mutacoes.ts` em `hook-revisoes.ts:5`, então o `throw` dispara de verdade.
- Hook são, Bash comum: teste da linha 94. Com `||` trocado por `;` o comando sai 2, e o teste fica vermelho pelo motivo certo.
- `deny` intacto: teste da linha 100. Com `> /dev/null` o stdout fica vazio e o `JSON.parse` falha. O teste também afirma que o motivo é o da regra ("Push bloqueado", `revisoes.ts:1145`) e não o do `catch` (`hook-revisoes.ts:33`), como a armadilha do documento pedia.
- `registrar`: teste da linha 112, que lê o `settings.json`. O bloco que acrescenta `|| { exit 2; }` fica vermelho no `not.toContain('exit 2')`.
- A mensagem só na falha (linha 89) e o `exit 2` só no `portao` (linha 118) são guardas a mais.
- O manual (⚠️) está registrado em "Sessão de teste do exit 2 (subtarefa 5.3)", com o que foi feito e o que se viu.

Quanto à auditoria:
- **Comando lido do arquivo:** os testes leem o comando do próprio `.claude/settings.json` e o rodam com `sh -c`, com `CLAUDE_PROJECT_DIR` numa cópia e a entrada do hook no stdin. Por isso as mutações do arquivo chegam ao teste.
- **Mutações:** o diff tem uma cláusula só, `|| { echo …; exit 2; }`, e ela tem blocos para as três formas de removê-la: tirar tudo, tirar o `echo` e trocar `||` por `;`. Tem também os blocos do `> /dev/null` e do `registrar`, e cada um cita um teste que existe com o nome exato.
- **Asserções:** todas são sobre o resultado (código de saída, stderr, JSON do stdout), nenhuma só sobre o código ter rodado.
- **Proibidos:** não há `.skip`, teste comentado nem mock. Não há IA, nem provedor pago.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `hook-portao.test.ts:41` copia só os `.ts` de `tools/processo/`. Se o hook passar a importar arquivo de outra pasta, ou que não seja `.ts`, os casos do hook são ficam vermelhos com exit 2. Falha alto, o que é aceitável, mas um comentário curto na função `copia` evitaria que o próximo a ver isso ache que o problema é do hook.
2. `hook-portao.test.ts:56`: o filho herda `process.env` inteiro do vitest. Hoje passa. Se no futuro aparecer um `NODE_OPTIONS` do runner que mude a carga, vale montar o ambiente mínimo (`PATH`, `CLAUDE_PROJECT_DIR`, `CLAUDE_CODE_AGENT`).

## test-engineer · 2ª rodada · APROVADO · 2026-10-21 20:12:14 · `tasks/prd-reengenharia/5_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** são os da tabela de testes de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/5_task.md`.
- Carga quebrada de três jeitos sai 2: import inexistente, erro de sintaxe em `revisoes.ts` e módulo que lança na carga.
- Na falha de carga, o stderr traz a mensagem.
- Com o hook são e um Bash comum, sai 0 sem nada no stdout e sem a mensagem.
- Com o hook são e um push que a regra nega, sai 0 e o `deny` da regra passa intacto.
- O `registrar` não ganha o `exit 2`.
- O `exit 2` só funciona no Claude Code de verdade: caso manual, registrado na seção "Sessão de teste do exit 2".

**Cobertos:** todos. Nesta rodada conferi o seguinte.
- **Recomendação 1 aplicada:** `comandoDe` agora lança um erro com nome (linhas 25 a 30) e não chama mais `expect` durante a coleta. O `portao` virou função chamada dentro de cada caso (linha 74). Assim, se o comando sumir do `settings.json`, quem fica vermelho é o caso, com o nome dele, e não o arquivo inteiro na coleta. Os dois casos do `SubagentStop` já chamavam `comandoDe` dentro do `it`.
- **Recomendação 2 aplicada:** o caso separado "a mensagem só aparece na falha de carga" saiu. A asserção `expect(saida.stderr).not.toContain(MENSAGEM)` passou para o caso "hook são, Bash comum" (linha 102). Isso não deixa linha da tabela sem teste: a linha 48 (o stderr traz a mensagem) continua provada pelos `toContain(MENSAGEM)` dos três casos de falha. O lado negativo agora está no caso do hook são, e é a esse caso que o bloco de mutação "trocar `||` por `;`" aponta. Esse bloco ficou mais forte, porque a mutação também derruba o novo `not.toContain`.
- **Recomendação 3 aplicada:** o comentário em `copia` (linhas 38 a 42) diz o limite da cópia (só os `.ts` de `tools/processo/`) e onde consertar se o hook passar a importar de outro lugar.
- **Seção "Mutações":** não mudou desde a 1ª rodada. Os sete blocos ainda citam testes que existem com esse nome exato. O caso que saiu não era citado por nenhum bloco.
- **Rodei** `npx vitest run tools/processo/hook-portao.test.ts`: 7 de 7 passaram.
- Não há `.skip`, teste comentado nem mock. O teste roda o comando lido do `settings.json` com `sh -c` sobre uma cópia de verdade.

**A recusa da minha recomendação anterior (ambiente mínimo do processo filho):** aceito. O motivo está escrito no documento, a recomendação não era bloqueante e o argumento de que tirar `HOME` ou o `PATH` do node deixaria o teste mais frágil procede.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova.

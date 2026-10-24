# Achados das revisões — `tasks/correcoes/2026-10-24-processo-seguro.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-24 16:38:15 · `tasks/correcoes/2026-10-24-processo-seguro.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (não se aplica: a correção não toca `apps/`, `packages/`, `infra/`, `.github/` nem `compose.yaml`)
Fila e prioridade: ok (não se aplica: não há job de BullMQ nem fila nova)
Concorrência: protegida
Índice e paginação: ok (não se aplica: não há query nem tabela)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica: só ferramenta local do processo, sem alerta novo)
Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/mutacoes.ts` (bloco do supervisor, `restaurarOArquivo`): o supervisor devolve a fonte sem conferir se ela ainda está mutada. Se o portão morrer por `kill` e o supervisor seguir vivo (até 10 min), uma edição do desenvolvedor ou uma segunda rodada do portão nesse intervalo é sobrescrita pela cópia antiga. A correção já registra esse limite, mas não registra que a cópia pode apagar trabalho. Restaurar só quando o conteúdo atual for igual ao mutado é uma linha e fecha o caso. Uma opção é passar o hash do mutado em `--restaurar`.
- No mesmo bloco, o parse dos argumentos do supervisor não trata a falta do `--`. Com `indexOf` devolvendo -1, o `slice(0, -1)` lê errado em silêncio. O chamador é interno e sempre manda o `--`, então não bloqueia. Uma checagem que saia 127 deixaria o erro visível.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tasks/correcoes/2026-10-24-processo-seguro.md`, "Recomendações sem aplicar": os blocos de mutação que já não acham o trecho em `tasks/prd-harness/7_task.md` e `5_task.md` deveriam ir para o `TODO.md` com dono. Do jeito que está, só voltam por acaso numa tarefa futura.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-24 16:38:20 · `tasks/correcoes/2026-10-24-processo-seguro.md`

VEREDITO: APROVADO

Esta correção só mexe no ferramental do processo de construção: `tools/processo/`, `.claude/hooks/`, `.claude/skills/seguir/passos/` e o documento `tasks/prd-harness/20_task.md`. Não toca em `apps/`, `packages/`, migration, schema, prompt de agente nem em `docs/regulacao.md`. Procurei no diff por nota, `lancadaPor`, tutor, aprovação, autonomia, correção, ranking e professor, e nenhum achado tem a ver com produto: o único "correcao" é o nome de uma função de teste (`andarDeCorrecao`). A tarefa não tem tela, então não há fotos para conferir.

Caminhos de escrita em Nota: nenhum criado ou alterado nesta tarefa. Os caminhos que já existiam continuam iguais. Todos com autor humano: sim, porque nada mudou.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok, nenhum fluxo de saída de IA foi tocado.
Supervisão do tutor: ok, nada do tutor foi tocado.
Autonomia declarada e visível: sim, a governança e a declaração dos agentes não mudaram.

Itens 6 a 9 da conferência (auditoria, supervisão sem vigilância, nada de nota sugerida em discursiva e redação, medir o professor sem vigiar): nada no diff chega a eles.

Bloqueantes: nenhum.

Recomendações:
- `.claude/hooks/contexto-inicial.sh` perdeu a permissão de execução (o modo foi de `100755` para `100644`). Isso não quebra nada hoje, porque `.claude/settings.json:10` chama o hook com `bash "…"`. Mesmo assim parece uma mudança acidental, e quem rodar `./.claude/hooks/contexto-inicial.sh` direto vai receber erro. Isso é com o `infra-guardian` e o `revisor-geral`, não com a regra 70. Registro aqui para a validação.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tasks/correcoes/2026-10-24-processo-seguro.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/.claude/hooks/contexto-inicial.sh
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/.claude/settings.json

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-24 16:38:24 · `tasks/correcoes/2026-10-24-processo-seguro.md`

VEREDITO: APROVADO

A correção só mexe na ferramenta do processo (`tools/processo/`, `.claude/`). Não toca em campo de pessoa, rota, log de aplicação, armazenamento de produção nem envio a provedor de IA. Conferi o documento da tarefa e o diff inteiro.

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum
Fora da tabela de dados do docs/lgpd.md: nada (não há campo novo)
Autorização por objeto: ok (não há rota nem endpoint novo)
Logs: limpos. A única saída nova é o aviso de variável de ambiente em tools/processo/linhas.ts:882; os motivos novos da vigia em tools/processo/vigia.ts:84-94 só citam o arquivo .processo/limpeza.json. Nenhum leva dado de pessoa
Auditoria: não se aplica (nenhuma ação que a regra 20, item 10, obriga a auditar)
Envio externo: nenhum
Seed/fixture: sintético. Os testes usam pastas temporárias com fonte falsa, o caminho fictício tasks/prd-exemplo/9_task.md e a identidade de git de teste user.email=t@t
Bloqueantes: nenhum
Recomendações:
- tools/processo/mutacoes.ts:564-567: a cópia da fonte original vai para a pasta educa-corrida-* em /tmp. O supervisor a apaga, mas se o próprio supervisor morrer por SIGKILL ela fica lá. Hoje é só código-fonte do repositório, sem dado pessoal. O risco aparece se um dia o portão de mutações rodar sobre arquivo com dado (seed, fixture): aí vale criar a pasta com permissão 0700 ou apagá-la num rmSync de fim de corrida.
- A sobra que o documento registra (o relatorio.json do Vitest que fica em /tmp quando o portão morre por sinal) está correta enquanto os nomes de caso e as mensagens de asserção forem sintéticos (regra 20, item 17). Fica como coisa a vigiar, não como falha.
- Fora do meu escopo, para o infra-guardian: .claude/hooks/contexto-inicial.sh perdeu o bit de execução (100755 para 100644). Não quebra nada, porque .claude/settings.json:10 chama o hook com `bash "..."`, mas é uma mudança de modo sem motivo. Melhor reverter para o diff mostrar só o comentário.
```

**Pergunta de fechamento:** esta tarefa não muda o que o sistema guarda sobre um aluno nem para onde isso vai. A resposta à secretaria continua a mesma de antes dela.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tasks/correcoes/2026-10-24-processo-seguro.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/mutacoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/vigia.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/linhas.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/.claude/hooks/contexto-inicial.sh

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-24 16:39:05 · `tasks/correcoes/2026-10-24-processo-seguro.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/mutacoes.ts:456`. O supervisor devolve a fonte com `copyFileSync(origem, destino)`, e isso tira o bit de execução do arquivo restaurado. O `copyFileSync` do Node (libuv) aplica ao destino o modo da origem. A origem é a cópia que a linha 568 grava com `writeFileSync` (`copiaDaOriginal`, 0644). Logo, todo arquivo executável mutado volta 0644. O `writeFileSync(caminho, original)` do `finally` de `conferirMutacoes` não corrige, porque mantém o modo que já encontra.
   - **Provado na própria árvore:** o `git diff` mostra `.claude/hooks/contexto-inicial.sh` com `old mode 100755` e `new mode 100644`. O arquivo foi mutado pelo bloco das linhas 217 a 222 do documento, e ninguém pediu essa troca. Também reproduzi isolado: um arquivo 0755, mutado e restaurado por `copyFileSync` a partir de uma cópia gravada com `writeFileSync`, termina `-rw-r--r--`.
   - **Por que é grave:** `tasks/prd-harness/11_task.md` (linhas 303 a 322) tem blocos de mutação em `tools/processo/git-hooks/commit-msg` e `pre-push`, que são os hooks do `core.hooksPath`. Quem rodar o portão sobre esse documento, ou sobre qualquer outro que mute um hook, fica com o hook sem bit de execução. O git ignora esse hook só com um `hint`, e o hook de commit deixa de segurar o commit. É o furo que esta correção deveria fechar, agora aberto pelo caminho normal do portão, e não só no Ctrl-C.
   - **Correção exigida, em três partes:**
     1. Devolver o arquivo sem mexer no modo dele. Pode ser `writeFileSync(destino, readFileSync(origem))`, que trunca e mantém o modo, ou um `chmod` com o modo lido do arquivo antes da mutação.
     2. Um caso no `mutacoes.test.ts` (o bloco "o Ctrl-C no portão devolve o arquivo mutado", e também o caminho normal do `rodarCalado` com `restaurar`) que use uma fonte 0755 e confira com `statSync(...).mode` que ela volta 0755. Mais o bloco de mutação dele.
     3. Devolver o modo 100755 a `.claude/hooks/contexto-inicial.sh` antes do commit, para que a correção não leve uma troca de modo que ninguém pediu.

Recomendações (não bloqueiam):
- `.claude/skills/seguir/passos/6-tarefa.md` e `9-vigia-e-contexto.md`: `"$(git rev-parse --git-common-dir)/../.processo"` supõe que o `.git` comum fica na raiz do térreo. Hoje fica (`/home/joaquimdp/Documentos/git/Educa.ia/.git`), mas `git rev-parse --path-format=absolute --git-common-dir` deixaria a âncora mais explícita.
- `tools/processo/mutacoes.ts`: os nomes `opcoes`, para o resto dos argumentos do supervisor, e `estourou`, que agora também quer dizer "sinal recebido", já não dizem o que guardam. Algo como `restauracao` e `encerrando` leria melhor.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tasks/correcoes/2026-10-24-processo-seguro.md`, "Recomendações sem aplicar": o próprio documento já registra que os blocos da 7.0, da 5.0 e da 20.0 (`aviso-de-sessao.sh`) não acham mais o trecho. Vale levar isso ao `/retro` como item, para não sumir.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-24 16:40:00 · `tasks/correcoes/2026-10-24-processo-seguro.md`

VEREDITO: REPROVADO

Cenários exigidos:
- 1a: o comando da limpeza grava a `pedida` no `.processo` do térreo quando roda de um andar ou de uma subpasta dele, e não grava nada fora de um repositório.
- 1b: um `limpeza.json` que não é objeto (`null`, lista, texto, número, `true`) ou que não é JSON acorda a vigia, e o motivo diz o porquê.
- 1c: o hook `contexto-inicial.sh` chamado de outra pasta grava a `feita` no térreo.
- 2a: o Ctrl-C ou o SIGHUP no grupo do portão devolve a fonte mutada e mata o neto.
- 2b: o teste que sai deixando um neto vivo leva o grupo junto, inclusive o neto que ignora o SIGTERM, e o código de saída continua o do teste.
- 3: o ramo vermelho do `portao-local.ts` reprova e não grava carimbo.
- 4: a leitura do `core.hooksPath` passa em sessão de papel e toda escrita dele continua barrada.
- 5: o aviso de ponto de injeção ligado aparece no CLI do `linhas.ts`, e a linha que fica livre não leva a marca `abertura`.
- 6: o sinal que chega no primeiro instante já encontra o tratador.
- Casos de borda que o domínio pede aqui: restaurar um arquivo executável sem mudar o modo dele; um `git config` que parece leitura mas escreve; sinal duplo ou prazo junto com sinal; comando fora do git.

Cobertos: todas as linhas da tabela "Teste que reproduz" têm teste citado pelo nome (1a, 1b, 1c, 2a com SIGINT e SIGHUP, 2b, 3, 4 com 4 positivos e 6 negativos mais o do hook, 5 com três testes, 6). Cada cláusula nova tem bloco na seção "Mutações", e os blocos da `20_task.md` foram reescritos para o código novo. Não há `.skip`, mock que esconda a regra ou provedor de IA. O sinal no primeiro instante é testado com o sinal de verdade, mandado pelo próprio filho.

Bloqueantes:

1. **`tools/processo/comando-git.ts:423-425`: a liberação da leitura abre uma escrita do `core.hooksPath`.** O `leSoOCaminhoDosHooks` só confere que, sem as opções de escopo, sobram duas palavras: uma é `--get`/`--get-all` e a outra é a chave. Ele não confere a ordem. Só que o `git config` para de ler opções na primeira palavra que não é opção, então `git config --local core.hooksPath --get` **grava** `core.hooksPath=--get`. Conferi num repositório descartável, no scratchpad: depois desse comando, `git config --list --local` mostrou `core.hookspath=--get`. Com isso os hooks do processo ficam apontando para uma pasta que não existe e deixam de rodar. O teste `tools/processo/revisoes.test.ts:1723` ("leitura do hooksPath com a chave antes da ação") afirma que esse comando passa, ou seja, prova o furo como se fosse regra. O mesmo vale para `git config core.hooksPath --get-all` e para `git config --show-origin core.hooksPath --get`.
   - Correção exigida: só liberar quando a ação de leitura vem **antes** da chave e a chave é a última palavra de `resto` (as opções de escopo só antes da chave).
   - Trocar o caso da linha 1723 para a lista dos negados e acrescentar como negados `git config core.hooksPath --get` e `git config --show-origin core.hooksPath --get-all`.
   - Acrescentar um bloco de mutação para a cláusula de ordem.

2. **`tools/processo/mutacoes.ts:454-456`: `restaurarOArquivo` troca o modo do arquivo que devolve.** O `copyFileSync(origem, destino)` aplica ao destino o modo da cópia temporária, que é 0644. Já aconteceu nesta árvore: o `git diff` mostra `.claude/hooks/contexto-inicial.sh` passando de `old mode 100755` para `new mode 100644`, porque esse hook é o arquivo do bloco de mutação dele. Também reproduzi no scratchpad: um alvo com 0755 ficou com 644 depois do `copyFileSync`. Hoje o hook ainda roda porque é chamado por `bash …`, mas `tools/processo/git-hooks/commit-msg` e `pre-push` são 100755. Uma mutação futura em qualquer um deles deixaria o hook sem execução, e o git ignora hook não executável: o portão do commit desligaria calado. O teste 2a confere o conteúdo devolvido e não o modo.
   - Correção exigida: devolver sem tocar no modo (`writeFileSync(destino, readFileSync(origem))`, ou guardar o modo e aplicar `chmodSync`).
   - Acrescentar em `mutacoes.test.ts` um caso com fonte 0755 que confira o modo depois da corrida normal e depois do Ctrl-C, com o bloco de mutação dele.
   - Devolver o 100755 a `.claude/hooks/contexto-inicial.sh` antes do commit.

Recomendações:
- `vigia.test.ts` (`rodarOComando`, testes "de dentro de um andar" e "fora de um repositório"): o comando roda com `process.env` inteiro. Se o teste rodar com `GIT_DIR` ou `GIT_WORK_TREE` no ambiente (dentro de um hook do git, por exemplo), o `git rev-parse` responde pelo repositório real e a `pedida` pode ir parar no `.processo` do térreo verdadeiro. Use o `ambienteGit` sem essas duas variáveis.
- `mutacoes.test.ts`, teste "o sinal que chega no primeiro instante": o nome diz que o grupo morre, mas só o código de saída é conferido. Vale conferir que o grupo do filho não existe mais depois.
- `comando-git.ts`: a forma nova `git config get core.hooksPath` (git 2.46 ou mais) continua barrada. Isso é conservador e aceitável, mas vale registrar se o `contexto-inicial.sh` ou o conferir do checkout vierem a usá-la.
- As três "Recomendações sem aplicar" do documento (o `kill` só ao portão, a pasta `educa-corrida-*` que fica para trás, os blocos antigos de `7_task.md` e `5_task.md`) estão bem justificadas e ficam para a retro.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/comando-git.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/mutacoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/mutacoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/vigia.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/.claude/hooks/contexto-inicial.sh
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tasks/correcoes/2026-10-24-processo-seguro.md

## infra-guardian · 2ª rodada · APROVADO · 2026-10-24 16:59:32 · `tasks/correcoes/2026-10-24-processo-seguro.md`

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
- O diff da rodada 1 para a 2 mexe só no ferramental do processo: `tools/processo/mutacoes.ts`, `tools/processo/comando-git.ts`, os testes deles, o `vigia.test.ts` e o documento da tarefa. Nada disso roda em produção. Não há API, worker, fila, chamada de IA, banco nem migration, então os itens 1 a 10 do modelo de carga não se aplicam e estão marcados como ok sem ressalva.
- `git diff --summary HEAD` não mostra mudança de modo de arquivo. O `.claude/hooks/contexto-inicial.sh` voltou a 100755, como a ordem da 1ª rodada pedia.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/mutacoes.ts`: o `restaurarOArquivo` agora usa `writeFileSync`, que mantém o modo do arquivo, e um processo que estiver lendo o arquivo nesse momento pode pegá-lo pela metade. Só o supervisor escreve, depois de acabar o grupo do teste, então isso não bloqueia. Fica registrado para a retro, caso o portão um dia rode em paralelo com outro leitor da fonte.
- O teste novo do `vigia.test.ts` usa `vi.stubEnv` e só funciona porque `ambienteSemOGitDeFora()` lê `process.env` quando o comando roda. Um comentário curto dizendo isso evita que alguém mova esse ambiente para uma constante e quebre o teste sem ver.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-24 16:59:33 · `tasks/correcoes/2026-10-24-processo-seguro.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. O diff da rodada 1 para a 2 mexe só no ferramental do processo: o `leSoOCaminhoDosHooks` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/comando-git.ts`, o `restaurarOArquivo` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/mutacoes.ts`, os testes do `tools/processo/`, o bit de execução de `.claude/hooks/contexto-inicial.sh` e o documento da tarefa. Não há migration, schema, DTO, rota nem tela.
Fora da tabela de dados do docs/lgpd.md: nada, porque nenhum campo novo entrou.
Autorização por objeto: ok. A tarefa não tem rota nem endpoint.
Logs: limpos. A mudança não acrescenta nenhum log. A cópia da original que o supervisor grava e depois apaga é código-fonte do repositório, não dado de pessoa.
Auditoria: presente. Nenhuma ação da tarefa pede auditoria (não há leitura de dado de aluno, exportação, nota, permissão nem saída de IA).
Envio externo: nenhum. A tarefa não chama provedor de IA nem serviço de terceiro.
Seed/fixture: sintético. Os testes usam pastas temporárias, `user.email=t@t`, e conteúdos fixos como `'original\n'` e `'mutada\n'`.
Bloqueantes: nenhum.
Recomendações: nenhuma nova. A da 1ª rodada continua valendo e já está registrada no documento da tarefa: a pasta `educa-corrida-*` com o `relatorio.json` do Vitest fica em `/tmp` quando o portão morre por sinal. Ela guarda só nome de caso, mensagem de asserção e dado sintético.

A 1ª rodada não exigiu correção, então não havia nada a conferir. O `git diff --summary HEAD` não mostra mudança de modo: o hook `contexto-inicial.sh` voltou a 100755, como o documento da tarefa afirma.

Pergunta de fechamento: a tarefa não muda nada no que o sistema guarda sobre um aluno nem para onde isso é enviado, então a resposta continua a mesma de antes desta correção.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 16:59:56 · `tasks/correcoes/2026-10-24-processo-seguro.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido. O `conferir` responde "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".

Bloqueantes: nenhum.

As três partes da correção da 1ª rodada estão feitas:
1. **O modo do arquivo devolvido.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/mutacoes.ts:458`, a função `restaurarOArquivo` agora escreve com `writeFileSync(destino, readFileSync(origem))`. Esse jeito mantém o modo do arquivo que já existe. O `copyFileSync` saiu da função e dos imports.
2. **O teste e os blocos de mutação.**
   - Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/mutacoes.test.ts`, a fonte do bloco "o Ctrl-C no portão" passou a ser 0755, e o teste confere com `statSync(...).mode & 0o777` que ela volta 0755.
   - Entrou o caso "o caminho normal do rodarCalado com a restauração". Ele cobre a fonte 0755 e também a 0644, para provar que o supervisor não escolhe o modo.
   - No documento da tarefa, há blocos de mutação para tirar a escrita e para recriar o arquivo com `rmSync` e `writeFileSync`. Recriar o arquivo faz ele voltar 0644, e os casos 0755 pegam isso nos dois caminhos.
3. **O modo do hook.** `git diff --summary HEAD` não mostra mudança de modo, e `git ls-files -s` mostra `.claude/hooks/contexto-inicial.sh` como 100755 no índice. `commit-msg` e `pre-push` estão 755 no disco.

O resto do diff da rodada:
- **`leSoOCaminhoDosHooks`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-processo-seguro/tools/processo/comando-git.ts:427`): a ação de leitura tem de vir primeiro e a chave por último, e o escopo só passa antes da chave. Isso bate com o jeito do `git config` ler as opções, porque ele para na primeira palavra que não é opção. Os cinco casos negados novos fecham o furo que o caso antigo deixava passar. Esse caso antigo dizia que `--local core.hooksPath --get` passava, e esse comando grava o valor `--get`. Os blocos de mutação foram reescritos para a expressão nova.
- **`vigia.test.ts`** agora roda sem as variáveis `GIT_*` de quem roda o teste, e ganhou um caso com `GIT_DIR` e `GIT_WORK_TREE` apontando outro repositório.
- **O teste do primeiro instante** em `mutacoes.test.ts` abre o neto antes do sinal e confere que ele morre.
- **O documento da tarefa** registra a ordem da 1ª rodada. Desde a árvore da rodada 2, a única mudança foram as linhas que o hook das revisões grava.

Recomendações:
- `vigia.test.ts`: o caso novo do `GIT_DIR` prova que a função auxiliar do teste filtra as variáveis. Não prova nada do comando de produção. Vale dizer isso no nome do caso, para ninguém achar que ele protege o comando da limpeza.
- `vigia.test.ts`: o `afterEach(vi.unstubAllEnvs)` está no meio do `describe`, entre as funções auxiliares. Fica mais fácil de achar no começo do bloco.
- `comando-git.ts`: `--file` e `--blob` continuam negados porque não estão em `ESCOPO_DE_LEITURA`. É o lado seguro. Se o `contexto-inicial.sh` vier a precisar deles, a lista tem de ser ampliada de propósito, não por acidente.

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 17:00:15 · `tasks/correcoes/2026-10-24-processo-seguro.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Correção 1:**
  - O `git config` só lê o `core.hooksPath` quando a ação `--get` ou `--get-all` vem antes e a chave é a última palavra.
  - Chave antes da ação é escrita: `core.hooksPath --get`, `--local core.hooksPath --get`, `--show-origin core.hooksPath --get-all`.
  - Escopo depois da chave é escrita (`--get core.hooksPath --local`).
  - Escopo entre a ação e a chave é leitura (`--get --local core.hooksPath`).
  - Cada cláusula nova tem o seu bloco de mutação.
- **Correção 2:**
  - Quando o supervisor devolve a fonte, o modo do arquivo fica como estava: 0755 continua 0755 e 0644 continua 0644.
  - Isso vale no caminho normal do `rodarCalado` e no Ctrl-C (SIGINT e SIGHUP).
  - Cada caso tem o seu bloco de mutação.
  - `.claude/hooks/contexto-inicial.sh` voltou a 100755.

**Cobertos:**
- **Correção 1, feita.**
  - `tools/processo/comando-git.ts:185-186`: o código separa a ação (1ª palavra) da chave (2ª), exige `palavras.length === 2` e exige `resto.at(-1) === chave`.
  - `revisoes.test.ts`:
    - 1699-1704: cinco negados novos, entre eles os dois pedidos.
    - 1729: o caso antigo, que afirmava que uma escrita passava, foi trocado pelo do escopo entre a ação e a chave.
  - O que cada bloco de mutação prova:
    - Sem o `length === 2`: cai o "chave repetida como valor".
    - Sem a cláusula de ação: cai o "desarmar o caminho".
    - Só `--get`: cai o "--get-all".
    - Sem o `at(-1)`: cai o "escopo depois da chave".
    - A ordem trocada (`[chave, acao]`): cai o "passa: leitura do hooksPath por --get".
  - A ordem fica presa por duas cláusulas, cada uma com o seu bloco.
  - O `contexto-inicial.sh:23` usa a forma liberada (`--get core.hooksPath`), e o `hook-portao.test.ts:193` também.
  - Rodei `revisoes.test.ts -t "desvio do hook do git"`: 115 testes verdes.
- **Correção 2, feita.**
  - `mutacoes.ts:458-463`: a devolução agora é `writeFileSync(destino, readFileSync(origem))`, e o `copyFileSync` saiu do import.
  - `mutacoes.test.ts`:
    - 1216-1222: a fonte do Ctrl-C é 0755, e a linha 1273 confere que ela volta 0755.
    - 1241-1261: caso novo do caminho normal, que confere o 0755 e depois o 0644, com o conteúdo devolvido nos dois.
  - Os blocos `rmSync` + `writeFileSync` dão 0644 pela umask, e por isso os dois testes de 0755 cairiam.
  - O bloco que tira o `writeFileSync` faz o "no grupo do portão" cair.
  - `git diff --summary HEAD` saiu vazio: o hook voltou a 100755.
  - Rodei os testes do Ctrl-C, do primeiro instante e do supervisor: 16 testes verdes.
- **Extras da ordem, também conferidos:**
  - `vigia.test.ts:399-465`: o comando da limpeza roda sem as variáveis `GIT_*` de quem roda o teste. O caso com `GIT_DIR` apontando outro repositório (o "intruso") cairia sem o filtro.
  - O teste do primeiro instante abre o neto antes do sinal e confere que ele morre (`mutacoes.test.ts:1210-1213`).
  - Rodei `vigia.test.ts` inteiro: 52 testes verdes.
- Não há `.skip` nem mock que esconda a regra. Nenhum teste chama IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A linha 4 da tabela de testes de `tasks/correcoes/2026-10-24-processo-seguro.md` ainda diz "os `negado: hookspath: …` (6)". Agora são 11 (os 6 de antes e os 5 novos), e vale atualizar a contagem e citar os novos pelo nome.
2. As cláusulas `[acao, chave]` e `resto.at(-1) === chave` se sobrepõem: qualquer uma delas sozinha já nega `core.hooksPath --get`. Uma linha no comentário de `comando-git.ts:177-181` dizendo que as duas ficam de propósito, cada uma com o seu bloco, evita que alguém tire uma achando que sobra.

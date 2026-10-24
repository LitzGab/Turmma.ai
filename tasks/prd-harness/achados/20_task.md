# Achados das revisões — `tasks/prd-harness/20_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-24 02:22:40 · `tasks/prd-harness/20_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A tarefa só mexe no processo (hooks, vigia, passos do `/seguir`, documentação), nada de produto. O único arquivo novo de estado é `.processo/limpeza.json`, e ele guarda só duas datas, `pedida` e `feita`.

Fora da tabela de dados do docs/lgpd.md: nada. Nenhum campo pessoal novo foi criado.

Autorização por objeto: não se aplica. A tarefa não cria rota, repository nem query.

Logs: limpos.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/aviso-de-sessao.sh` lê o `prompt` pelo stdin só para checar se começa com `/seguir `. Ele não grava, não registra e não repete o texto: a linha 28 escreve uma frase fixa, e o erro vai para `/dev/null` (linha 26).
- O teste `tools/processo/harness/aviso-de-sessao.test.ts:84-92` prova isso com um marcador (`SEGREDO-DA-MENSAGEM`) e confere que nenhum arquivo aparece em HOME, TMPDIR, no repositório nem em `.processo/`.
- O `motivo` da vigia (`tools/processo/vigia.ts:78`) leva só a data da `pedida`.

Auditoria: não se aplica. Nenhuma ação desta tarefa está entre as que a regra 20 item 10 manda auditar.

Envio externo: nenhum. Nada sai para provedor de IA nem para serviço de terceiro. O `maestri` falso do teste e o `maestri routine run` funcionam só na máquina.

Seed/fixture: sintético.
- `tools/processo/__fixtures__/maestri-list.txt` tem só nomes de papel (`Implementador`, `Claude Code`, `Mesa`).
- O git dos testes usa `t@t` e `t`.
- `.processo/` está no `.gitignore` (linha 26), então `limpeza.json` não vai para o repositório, que é público.

Bloqueantes: nenhum.

Recomendações:
- O techspec diz que a premissa do §12 foi provada "com hooks que gravam a entrada". Esses hooks de prova não estão no diff, então não ficaram no repositório. Mesmo assim, vale conferir que nenhuma cópia da entrada ficou em `~/.claude` ou em arquivo temporário da máquina do Joaquim depois da prova. Hoje a entrada do Orquestrador é só processo, mas o costume de gravar prompt não deveria ficar.
- O hook `UserPromptSubmit` lê toda entrada da sessão sem papel, inclusive as sessões do próprio Joaquim. Se um dia alguém o estender para registrar o que chega, isso passa a ser log de conteúdo de prompt, proibido pela regra 20 item 9. Uma frase no cabeçalho do script dizendo isso deixaria a proibição visível para quem mexer depois.

Pergunta de fechamento: a tarefa não muda o que o sistema guarda sobre aluno nem para onde isso vai, então a resposta à secretaria fica como estava antes dela.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-24 02:22:42 · `tasks/prd-harness/20_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff não toca `apps/`, `packages/`, `docs/regulacao.md`, `.claude/rules/` nem `.claude/agents/`. Todos com autor humano? Não se aplica, porque nenhum caminho foi criado nem alterado.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhum fluxo de saída de IA para aluno foi criado nem alterado.
Supervisão do tutor: ok. O tutor não foi tocado.
Autonomia declarada e visível: sim. Nada mudou no nível dos agentes nem na tela de governança.
Bloqueantes: nenhum
Recomendações: nenhuma da regra 70.

A tarefa só mexe no processo de construção, sem tocar no produto:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/vigia.ts`: o arquivo `.processo/limpeza.json` registra quando o Orquestrador pediu a limpeza do próprio contexto (`pedida`) e quando ela aconteceu (`feita`). Se passam mais de 10 minutos sem `feita`, a vigia acorda o Orquestrador.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/contexto-inicial.sh` grava a `feita` quando a sessão do Orquestrador recomeça limpa no térreo. Os passos 6 e 9 do `/seguir` gravam a `pedida`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/aviso-de-sessao.sh`: quando o Joaquim cola no Orquestrador uma mensagem que começa com `/seguir `, o hook manda ler a skill e seguir. Ele só lê o texto e não guarda nada.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/processo-sem-maestri.md` explica como rodar os quatro papéis sem o Maestri. Ele mantém o portão, os revisores e o hook de commit como estão; nada ali tira o `conformidade-reviewer` das tarefas em que ele é obrigatório.

Nenhum dos nove itens que audito é afetado: escrita em `Nota`, decisão sobre trajetória do aluno, aprovação de saída de IA, supervisão do tutor, autonomia do agente, auditoria, vigilância do aluno, nota em discursiva e redação (D55) e medição do professor (D45). A tarefa não tem tela, então não havia fotos para conferir.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-24 02:22:42 · `tasks/prd-harness/20_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (não se aplica: só ferramentas do processo, nada em `apps/*` nem em `packages/*`)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida. Só dois lugares gravam `.processo/limpeza.json`. O comando da limpeza grava `pedida` e substitui o arquivo inteiro. O início de sessão lê o arquivo, acrescenta `feita` e grava de novo, no mínimo 25 s depois. Uma corrida entre os dois não tem efeito real.
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. Se a vigia não consegue ler a limpeza (data inválida ou JSON corrompido), ela acorda o Orquestrador em vez de ficar calada (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/vigia.ts:70` e o `catch` em `:93`).
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/passos/6-tarefa.md:75` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/passos/9-vigia-e-contexto.md:28`: o comando grava em `.processo/limpeza.json` relativo à pasta em que o Bash está. Se o Orquestrador não estiver no térreo, a `pedida` vai para outra pasta, a vigia nunca a vê e a limpeza se perde calada, que é justamente o que o RF27 quer evitar. Hoje só o texto da skill diz "no térreo". O comando devia achar o caminho sozinho: `"$(git rev-parse --path-format=absolute --git-common-dir)/../.processo/limpeza.json"`, ou a mesma conta de `git-dir` igual a `git-common-dir` que o hook já faz.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/contexto-inicial.sh:42`: o `mkdir` e a gravação também usam `.processo` relativo à pasta de trabalho do hook. Seria mais seguro ancorar em `$CLAUDE_PROJECT_DIR`, como o `settings.json` já faz para achar o script.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/vigia.ts:76`: o aviso mostra a `pedida` como veio do arquivo; se ela for ilegível, aparece um texto sem sentido. Não muda a decisão de acordar.

Os dois arquivos de teste da tarefa passam: `npx vitest run --project unidade tools/processo/vigia.test.ts tools/processo/harness/aviso-de-sessao.test.ts` deu 36 de 36.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 02:23:30 · `tasks/prd-harness/20_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. O código segue §3, §5(c), §5(g) e §5(h). As duas divergências estão registradas onde a regra pede:
- A do RF28 (o `maestri list` não traz estado) foi anotada em `20_task.md` e o texto do `cenarios.md` D/RF28 foi trocado. A `techspec.md` não fala em estado, então não havia o que mudar lá.
- A do 20.6 (premissa do §12 provada só em parte) está em `20_task.md` e na linha do §12 da `techspec.md`, reescrita com o que foi provado e o que não foi. O plano de reserva é a vigia, que acusa a `pedida` sem `feita`.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/passos/6-tarefa.md:57-58`: o item 1 ("No andar da spec ninguém implementa…") foi reescrito e perdeu "no diagnóstico e na triagem". A tarefa não pede isso. Provavelmente foi para caber no limite de linhas que `seguir.test.ts` confere. Convém registrar o motivo na seção "Recomendações sem aplicar" ou no relatório, para a validação não achar que foi descuido.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/vigia.ts:85`: quando o `limpeza.json` é um JSON válido mas não é objeto, o resultado varia:
   - `null` dá TypeError em `limpeza.pedida`. A vigia acorda, mas com o motivo "não consegui ler o time", que engana quem lê.
   - `[]` ou uma string passam calados, sem acordar.
   
   O hook de início de sessão já normaliza esse caso. A vigia podia fazer a mesma checagem de "não é objeto" e acordar com um motivo próprio da limpeza.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/vigia.test.ts:356-444`: os testes do `contexto-inicial.sh`, que é o hook de shell, estão no arquivo de unidade da vigia. Ficariam mais fáceis de achar em `tools/processo/harness/`, ao lado do `aviso-de-sessao.test.ts`. É só organização, e os blocos de mutação já citam os nomes atuais.
4. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/time.md` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/vigia/SKILL.md` foram alterados sem estar em "Arquivos previstos". As mudanças são pequenas, coerentes com o RF27 e o RF28 (um ponteiro para o doc e a linha nova da tabela da vigia), e a linha da vigia é necessária para o Orquestrador saber o que fazer quando acorda por esse motivo. Vale incluir os dois na tabela.
5. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/__fixtures__/maestri-list.txt`: a saída gravada vem de um terminal do Implementador. A vigia roda como `--pre-run` da rotina, e lá a saída pode ter outros blocos. Vale anotar na fixture, ou no teste, em que terminal ela foi gravada, para alguém regravar quando o Maestri mudar o formato.

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 02:25:02 · `tasks/prd-harness/20_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **RF27, a vigia:** acorda quando a `pedida` tem 11 min sem `feita`. Não acorda em 9 min, nem com `feita` igual ou posterior à `pedida`. O limite é "mais de 10 minutos". Uma `feita` de antes da `pedida` não vale. Data ilegível e `limpeza.json` corrompido acordam, porque na dúvida acorda. Sem arquivo, não acorda. A limpeza perdida acorda mesmo com o time trabalhando.
- **RF27, o início de sessão:** grava `feita` só com `clear`, sem papel e no térreo. Não grava em nenhum destes casos, um teste cada: com papel, com `startup`, `compact` ou `resume`, num andar (worktree) e fora de repositório git. Mantém a `pedida` existente e refaz arquivo estragado (lista, `null`, texto, JSON truncado).
- **RF27, o comando dos passos 6 e 9:** grava só a `pedida`, com o horário de agora, e dispara a rotina.
- **RF28:** a fixture com a saída real lida com os terminais certos. O `docs/processo-sem-maestri.md` cita os quatro `claude --agent` e o socorro do hook.
- **RF29:** a entrada com `/seguir ` e sem papel devolve o contexto. Não devolve nada com papel nem sem o prefixo (`/seguir` sem espaço, prefixo no meio do texto, espaço na frente). Entrada que não é JSON sai 0, calada. O hook não grava arquivo.
- **RF30:** o comando do `settings.json` aponta um arquivo que existe.

**Cobertos:** todas as 11 linhas da tabela, cada uma com teste próprio:
- **`tools/processo/vigia.test.ts`:**
  - `› pedida há 11 minutos sem feita…`
  - `› o limite é…`
  - `› feita igual ou depois da pedida…`
  - `› sem pedida, ou só com a feita…`
  - `› a limpeza perdida acorda mesmo com o time trabalhando…`
  - `› a limpeza em dia deixa a decisão…`
  - os três de `a vigia como a rotina a roda`, com um `maestri` falso e o time trabalhando
  - `› source clear, sem papel, no térreo…`
  - `› sem arquivo antes…`
  - `› com papel`
  - `› source %s` (startup/compact/resume)
  - `› fora do térreo…`
  - `› fora de um repositório git`
  - `› 6-tarefa.md` e `› 9-vigia-e-contexto.md: roda…`
  - `a saída real do maestri list (RF28)`
  - os dois de `docs/processo-sem-maestri.md (RF28)`
- **`tools/processo/harness/aviso-de-sessao.test.ts`:**
  - os cinco do RF29
  - `› aponta o hook que existe…`

Conferi a seção "Mutações" contra o `git diff`. Toda cláusula nova tem o seu bloco e cada bloco chega à cláusula pelo cenário certo:
- **`vigia.ts`:** a guarda da `pedida`, o `>=`, o `<=` do limite, os dois ramos de `comLimpeza`, o `existsSync` e a ligação com a decisão.
- **`contexto-inicial.sh`:** as quatro condições do `if` e as três do `typeof`.
- **`aviso-de-sessao.sh`:** o papel, o `startsWith`, o `|| exit 0` e o `catch`.
- **`settings.json`:** o comando que aponta o hook novo.
- **Passos 6 e 9:** o `mkdir` e o `date` de cada um.

O que ficou sem bloco não é condição, ou o mutante é equivalente (o `?? ''`), ou um teste já pega: o `writeFileSync`, por exemplo, quebra `› source clear`.

Não há `.skip`, teste comentado nem chamada a provedor de IA. O `maestri` falso substitui só o que é externo. A asserção é sempre sobre o resultado: o conteúdo do arquivo, o stdout `/vigia\n` ou vazio, e a ausência do arquivo. Rodei `npx vitest run --project unidade tools/processo/vigia.test.ts tools/processo/harness/aviso-de-sessao.test.ts`: 36 de 36 passaram.

Concorrência: nada no fluxo grava `limpeza.json` duas vezes ao mesmo tempo. O comando e o `SessionStart` vêm da mesma sessão do Orquestrador, um depois do outro, e a vigia só lê. Se ela pegar uma leitura no meio de uma escrita, acorda, que é o seguro. Não vejo cenário que peça teste paralelo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **`tools/processo/harness/aviso-de-sessao.test.ts:84-92`:** o teste "não grava arquivo" fotografa a raiz e o `.processo/` do repositório real enquanto outros arquivos de teste rodam em paralelo. O `tools/ci/scripts.test.ts:268` lê do repositório real o `.processo/ambiente-de-teste-2.env`, que o script do ambiente 2 deixa ali. Na esteira, cada job começa sem `.processo/`, e se as duas coisas coincidirem o teste falha de vez em quando. Há também uma limitação: o teste olha só o primeiro nível. Copiar o hook para a pasta temporária e apontar o `CLAUDE_PROJECT_DIR` para ela deixa o teste determinístico e recursivo.
2. **`tools/processo/__fixtures__/maestri-list.txt`:** a saída foi capturada no terminal do Implementador e tem um só nome do time, sem número de linha. A vigia roda vendo o que o Orquestrador vê, com as linhas numeradas da D79 (`Implementador 2`, `Mesa 2`). Recapturar no terminal do Orquestrador, com ao menos uma linha numerada, e asserir a lista inteira.
3. **`.claude/skills/seguir/passos/6-tarefa.md` e `9-vigia-e-contexto.md`:** o comando grava a `pedida` no `.processo/` da pasta em que o Bash está. A vigia lê do `.processo/` do lugar onde está o `vigia.ts`, e o hook grava no do `CLAUDE_PROJECT_DIR`. Se o Orquestrador estiver com o Bash dentro de um andar, a `pedida` cai no lugar errado e a limpeza perdida passa calada, que é justo o que o RF27 quer evitar. Ancorar o caminho, por exemplo com `"$(git rev-parse --path-format=absolute --git-common-dir)/.."` ou com `$CLAUDE_PROJECT_DIR`. O teste `› roda no térreo` hoje só roda o comando numa pasta temporária. Ele não prova que o arquivo cai onde a vigia lê.
4. **`.claude/hooks/contexto-inicial.sh:41`:** uma sessão do Joaquim sem papel, no térreo, que faça `/clear` grava uma `feita` e esconde a limpeza perdida do Orquestrador. É limitação do desenho; vale anotar no `estado.md` para a validação.
5. **`aviso-de-sessao.test.ts:96`:** o título diz "executável pelo bash", mas o teste só confere que o arquivo existe e não está vazio. Trocar o título ou acrescentar um `bash -n`. Na prática os testes do RF29 já rodam o hook pelo comando do `settings.json`.
6. **20.6 (premissa parcial):** se o `/clear` não entregar `source: clear`, nenhuma `pedida` ganha `feita`, e a vigia acorda o Orquestrador a cada 30 minutos, que é o desperdício que ela foi feita para cortar. A divergência diz que o Joaquim confere isso no primeiro `/clear` do Orquestrador. Pôr essa conferência como item explícito da validação, e não só no texto da divergência.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/20_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/vigia.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/vigia.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/aviso-de-sessao.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/aviso-de-sessao.sh
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/contexto-inicial.sh
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/__fixtures__/maestri-list.txt
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/processo-sem-maestri.md

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-24 02:32:02 · `tasks/prd-harness/20_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o diff desde a 1ª, que foi aprovada sem correções exigidas. Nenhum código de produto ou de dado de pessoa mudou: o diff mexe só no harness do processo (hook, testes de ferramenta, TODO e o arquivo da tarefa). Os dois testes afetados passam: `aviso-de-sessao.test.ts` e `vigia.test.ts`, 36 de 36.

- **Campos pessoais tocados:** nenhum. Não há migration, schema, DTO nem rota.
- **Fora da tabela de dados do `docs/lgpd.md`:** nada.
- **Autorização por objeto:** não se aplica, porque não há endpoint.
- **Logs:** limpos.
  - O hook `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/aviso-de-sessao.sh` lê a entrada, decide e devolve só um texto fixo. Ele não ecoa o prompt, não grava em arquivo e manda o stderr para `/dev/null`.
  - O comentário novo (linhas 7–8) proíbe por escrito gravar a entrada, citando a regra 20, item 9. Isso fecha o risco de alguém, ao estender o hook, passar a registrar prompt, incluindo os prompts do próprio Joaquim.
- **O teste agora prova que o hook não grava nada:** em `tools/processo/harness/aviso-de-sessao.test.ts`, o caso "não grava arquivo nenhum" roda numa cópia isolada que contém só o hook. Ele confere a árvore inteira, recursivamente, antes e depois, e a casa fica vazia. Se alguém fizer o hook gravar a entrada, o teste quebra. As pastas temporárias são removidas no fim (linha 29).
- **Auditoria:** não se aplica, porque nenhuma ação do diff está entre as que a regra 20, item 10, exige.
- **Envio externo:** nenhum.
- **Seed/fixture:** sintético. `tools/processo/__fixtures__/maestri-list.txt` contém só nomes de papéis do time ("Implementador", "Claude Code", "Mesa"), sem dado de aluno, de professor nem de escola.
- **Pergunta de fechamento:** o diff não cria lugar novo que guarde dado de aluno nem envio novo para fora. A resposta à secretaria continua a mesma da 1ª rodada.

Bloqueantes: nenhum.

Recomendações:
- O cabeçalho da fixture `maestri-list.txt` diz "gravada em 24/10/2026 no terminal do Implementador". Se o Maestri passar a listar algo além do nome do papel, por exemplo um caminho com nome de usuário ou o título da sessão, confira esse conteúdo antes de regravar a fixture, porque o repositório é público.

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 02:32:27 · `tasks/prd-harness/20_task.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2: audito só o diff desde a rodada aprovada e o que ele afeta):
- O teste "não grava arquivo" continua provando o RF29 agora que roda sobre uma cópia que só tem o hook.
- O teste do `settings.json` ganhou a checagem `bash -n` sem perder a asserção que pega o hook trocado.
- O comentário do hook e o da fixture não mudam comportamento.
- As recomendações da 1ª rodada estão no `20_task.md`, cada uma com destino.

Cobertos:
- **Teste "não grava" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/aviso-de-sessao.test.ts:85-97`).** O `CLAUDE_PROJECT_DIR` agora é uma pasta temporária que só tem o hook. A lista dos arquivos dela é tirada inteira (recursiva) antes e depois de rodar o hook. A casa, que serve de `HOME` e de `TMPDIR`, precisa continuar vazia. Se o hook gravar a entrada em `$CLAUDE_PROJECT_DIR/...`, em `$HOME` ou em `$TMPDIR`, o teste falha. A asserção `stdout` não vazio garante que o caso passou pelo caminho do `/seguir ` e não saiu cedo. Isso resolve a recomendação da 1ª rodada: o teste não lê mais o repositório real, onde outros testes escrevem em paralelo, e não fica instável por causa deles.
- **Teste do `settings.json` (linhas 101-107).** O `toContain` do caminho do hook ficou, então a mutação que troca o comando para `contexto-inicial.sh` continua ficando vermelha. O `bash -n` é asserção a mais, não cláusula nova de código, e não pede bloco.
- **Comentários.** O do `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/aviso-de-sessao.sh:7-8` (não gravar a entrada, regra 20, item 9) e o do `vigia.test.ts` (origem da fixture e quando regravá-la) são só texto. Não pedem mutação.
- **Recomendações da 1ª rodada.** Estão na tabela "Recomendações sem aplicar" do `20_task.md`, cada uma com destino: a regravação da fixture fica para o ensaio do RF31, o `estado.md` para o relatório do Implementador ao Orquestrador. Os dois itens novos do `TODO.md` têm dono e momento: o Arquiteto, na `retro` da X7.
- **Mutações.** O diff não traz cláusula nova de código sem bloco. Os 26 blocos da 1ª rodada não mudaram.
- **Testes rodados.** `npx vitest run tools/processo/harness/aviso-de-sessao.test.ts tools/processo/vigia.test.ts` passou: 2 arquivos, 36 testes. Não há `.skip`, nem mock que esconda o hook (ele roda como o Claude Code o roda, por `sh -c`), nem chamada a provedor de IA.

Bloqueantes: nenhum.

Recomendações:
- O teste "não grava" não pega um hook que grave num caminho absoluto fixo, como `/tmp/x` ou `/var/tmp`, sem passar por `TMPDIR`, `HOME` ou `CLAUDE_PROJECT_DIR`. Hoje o comentário da linha 7-8 do hook é a única proteção contra isso. Se alguém estender o hook, vale uma checagem a mais: procurar o texto `SEGREDO-DA-MENSAGEM` também em `os.tmpdir()` real, ou exigir que o hook não tenha redirecionamento `>` para arquivo.
- O `readdirSync(dir, { recursive: true })` da linha 90 pede Node 20.1 ou mais novo. O repositório já usa um Node desses (o `import.meta.dirname` da linha 10 também pede), então fica só registrado.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 02:32:39 · `tasks/prd-harness/20_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/aviso-de-sessao.test.ts:86-97`: o teste que prova que o hook não grava nada agora roda numa cópia que tem só o hook. Funciona porque o `aviso-de-sessao.sh` não lê nenhum outro arquivo do repositório. Se um dia ele passar a ler (um `source`, um script de `tools/`), a cópia fica incompleta, o hook sai 0 calado e o `expect(saida.stdout).not.toBe('')` vai acusar a falha só de forma indireta. Vale uma linha no comentário do teste avisando que a cópia precisa trazer tudo o que o hook lê.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/20_task.md`, "Divergências": a linha do item 1 do passo 6 diz que aponta para o `cenarios.md` RF26. Na verdade ela cita o teto que já existia, e não há divergência registrada lá. Como é um corte de texto para caber no teto e nenhuma regra muda, não bloqueia. Se a ideia é deixar rastro, o texto ficaria mais preciso como "cabe no teto do RF26" do que como divergência.

As três recomendações da rodada anterior foram aplicadas no `20_task.md` e no `vigia.test.ts`, que agora diz em que terminal a fixture foi gravada. Os dois itens que foram para o `TODO.md` estão na seção "Da X7 (harness), fora dela", cada um com dono e com o que precisa mudar. Concordo com a recusa de mover os testes do `contexto-inicial.sh`, pelo motivo que vocês deram. O aviso da regra 20, item 9, entrou no cabeçalho do `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/aviso-de-sessao.sh` e não mudou o comportamento do hook. A troca do teste de "executável" por `bash -n` deixou o que ele prova mais exato.

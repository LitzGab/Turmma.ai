# Validação — harness (X7)

## Rodada 2 — 24/10/2026 (revalidação)

**Escopo:** revalidação da funcionalidade completa, restrita ao RF29, ao M1 e ao que as correções C1
(`tasks/correcoes/2026-10-24-aviso-mensagem-colada.md`, `7346053`) e M1 (`tasks/correcoes/2026-10-24-seguir-abandonar-linha.md`,
`8df95e4`, encontro em `98cac20`) mudaram, como pede a seção 5 da rodada 1
**Commit validado:** `d449457b`
**Veredito: APROVADA**

O C1 está resolvido: o hook reconhece a forma real da mensagem colada, o teste usa essa forma, e duas mutações no hook ficam
vermelhas. O M1 também: o passo 6 do `/seguir` ensina o `linhas.ts abandonar`, o teste do passo exige o comando, e a soma do
RF26 fica dentro do teto. Os outros 31 RF seguem como a rodada 1 os deixou: de `147854c2` a `d449457b` só mudaram
`.claude/hooks/aviso-de-sessao.sh`, `.claude/skills/seguir/passos/6-tarefa.md`, os dois testes deles e documentos em `tasks/`.
Não sobra crítico nem maior. Ficam três menores, que vão para a seção 6.

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF29 | ATENDIDO | `.claude/hooks/aviso-de-sessao.sh:13` (sai se `CLAUDE_CODE_AGENT` estiver preenchido), `:23` (`/^\s*(?:<pasted_content id="[\w-]+">\s*)?\/seguir /`), `:29` (`typeof prompt === "string"`), `:34` (sai 0 em qualquer falha) | `tools/processo/harness/aviso-de-sessao.test.ts:71-88` (seis formas embrulhadas, com `\n`, `\n\n`, `\r\n`, sem quebra, quebra antes do embrulho e espaço no começo), `:90-114` (16 entradas que não podem disparar, como o `/seguir` no meio do texto, dentro ou fora do embrulho, embrulho vazio, id inválido, segundo embrulho e outra tag), `:60-69` (com papel, nas duas formas), `:116-123` (entrada que não é texto), `:125-141` (não grava nada, nas duas formas). O hook roda pelo comando real do `settings.json` | Medi nas transcrições reais do Orquestrador (`~/.claude/projects/-home-joaquimdp-Documentos-git-Educa-ia/*.jsonl`), passando a expressão do hook em cada entrada de usuário. Das 331 mensagens `/seguir` coladas que existem hoje, todas casam. Das 35 coladas que não são `/seguir`, nenhuma casa. A transcrição desta sessão mostra mais uma forma, `\n\n<pasted_content id="53a1">\n…`, com quebra **antes** do embrulho, e o caso `:79` a cobre. Que o `prompt` do `UserPromptSubmit` chega como a transcrição o grava continua sem prova numa sessão interativa: o hook aceita a forma pura e a embrulhada, então dispara nas duas. A confirmação vem na primeira mensagem colada depois do pouso (seção 6) |
| RF6 (M1) | ATENDIDO | `tools/processo/linhas.ts:559-578` (`abandonarSobATrava`, sem mudança); `.claude/skills/seguir/passos/6-tarefa.md:119-121` (item **Linha presa**, em "O que pode chegar") | `tools/processo/harness/seguir.test.ts:66` (`linhas.ts abandonar` em `OBRIGATORIOS_NO_PASSO_6`, cobrado pela conferência `passoDaTarefa` e pelo `it.each`); o comportamento já estava provado em `linhas.test.ts` (rodada 1) | Conferi o item contra o código: "solta a linha, e a tarefa volta a pendente" é `:567` e `:572`; "a branch e o checkout ficam, e a próxima partida exige a árvore limpa e nenhum commit que a spec não tenha" é `:573` e `partidaSobATrava` `:545-547`; "abertura que morreu: tira a linha do quadro" é `:566-568`. RF26: `SKILL.md` + `protocolo.md` + `6-tarefa.md` = **23.979 B** (teto 24.000). Os cortes que tiravam instrução voltaram na rodada 1 da Mesa. O que saiu foi explicação, e o "Não chega como mensagem:" tem destino (seção 6) |

Provas de mutação (cada arquivo restaurado com `git checkout --`; a árvore terminou limpa):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF29 | `aviso-de-sessao.sh:23`: a expressão volta a `/^\/seguir /`, sem espaço no começo e sem o embrulho (a regra antiga) | `aviso-de-sessao.test.ts`: 2 de 7 vermelhos ("mensagem colada de verdade…" e "não grava arquivo nenhum…", que usa a forma embrulhada) |
| RF29 | `aviso-de-sessao.sh:23`: sem a âncora `^`, o `/seguir` passa a casar em qualquer lugar | `aviso-de-sessao.test.ts`: "mensagem colada que não começa pelo `/seguir `: nada, inclusive o texto que só o cita no meio…" |
| RF6 (M1) | `6-tarefa.md`: o item **Linha presa** apagado (o arquivo fica sem `abandonar`) | `seguir.test.ts`: "o repositório de hoje passa…" e os casos de `o passo 6 se basta (RF26)` vermelhos |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: todo commit que mexe no hook prova, com o comando real do `settings.json`, que ele carrega | cumprida | `aviso-de-sessao.test.ts:18-25,48` (roda `sh -c` com o comando do `settings.json`), `:144-151` (`bash -n`) |
| Regra 20, item 9: o hook não grava a entrada | cumprida | `aviso-de-sessao.test.ts:125-141`, nas duas formas, com o `SEGREDO-DA-MENSAGEM` fora da saída e nenhuma pasta alterada; `privacy-guardian` APROVADO na 2ª rodada |
| Borda: texto colado que só cita `/seguir` no meio | coberta | `aviso-de-sessao.test.ts:93,97-99,105-106`; mutação 2 |
| Borda: sessão de papel recebe a mensagem embrulhada | coberta | `aviso-de-sessao.test.ts:63` |
| Pronto: os 32 RF com a prova da coluna "Como se prova" | cumprido | o RF29, que faltava, está acima; os outros 31 vêm da rodada 1, sem mudança de código |
| Pronto: a esteira verde no último commit que alterou código | conferida no fechamento | pelo Orquestrador (esteira `40069855328` em `98cac20`, que o `estado.md` dá como rodando) |

### 3. Portão

| Portão | Resultado |
|---|---|
| Dependências | `node_modules/.package-lock.json` mais novo que o `package-lock.json`: não precisou de `npm ci` |
| Testes de evidência (`npx vitest run --project unidade tools/processo/harness/aviso-de-sessao.test.ts tools/processo/harness/seguir.test.ts`) | ✅ 2 arquivos, 109 testes |
| Três provas de mutação | ✅ as três vermelhas, restauradas |
| Suítes inteiras | não rodadas aqui (D79) |
| Esteira do GitHub | conferida no fechamento, pelo Orquestrador: não entra no veredito |
| Revisões com veto registradas e aprovadas | ✅ C1: `privacy-guardian`, `test-engineer` e `revisor-geral`, APROVADO na 2ª rodada. M1: `test-engineer` e `revisor-geral`, APROVADO na 2ª rodada. Os dois commits têm a marca `(correção <slug>)` e a linha `Revisões:` |
| Revisores exigidos pelo caminho | ✅ `.claude/hooks/` está em `RESTO_DO_PROCESSO` (`tools/processo/guardioes-por-caminho.ts:93-101`) e não pede guardião, a não ser pela regra citada. O hook cita a regra 20, e o `privacy-guardian` entrou. A rodada 1 dizia "os quatro guardiões" para esse caminho, e isso estava errado: vale a tabela do RF16 |
| Commits `Fora do processo:` com código | nenhum (`git log origin/develop..d449457b -i --grep='^Fora do processo:' -- apps packages infra e2e tools` vazio) |

### 4. Achados

**Críticos**
- nenhum

**Maiores**
- nenhum

**Menores** (vão à seção 6)
- m4: `tasks/prd-harness/techspec.md:244-245` (§5(h), "Olha o prefixo `/seguir `") e `:403-406` (§12, "**Não provado** … que o texto
  *colado* chega assim, sem ser expandido") ficaram atrás do hook, que agora parte da forma embrulhada. A divergência não foi
  decidida em silêncio: está no documento da correção C1 e em "Devo ainda" no `estado.md`, que pede ao Arquiteto o ajuste no
  fechamento. Mas ainda não chegou à Tech Spec. Correção: a §5(h) passa a citar o embrulho opcional e o espaço no começo, e a §12
  registra a forma vista nas transcrições (331 mensagens coladas) e o que segue sem prova, que é o hook disparar numa sessão
  interativa.
- m5: `tasks/correcoes/2026-10-24-aviso-mensagem-colada.md:62-68`: a seção "Revisões" ficou sem o parágrafo do modelo e sem a
  linha de cabeçalho e a de separação da tabela. As linhas do hook não aparecem como tabela. Correção: devolver o cabeçalho
  `| Início | Fim | Revisor | Rodada | Veredito | Agente |` e o `|---|…|`, como na correção M1.
- m6: as duas recomendações da Mesa 2 na correção M1 (devolver "Não chega como mensagem:" ao `PEDIDO de estado` e dar sujeito a "e se
  abre de novo (`abrir`)", em `6-tarefa.md:106` e `:121`). Estão em "Devo ainda" no `estado.md`, para o `TODO.md` no fechamento. Ficam
  aqui também, para não se perderem. A folga do RF26 caiu para 21 B.

**Positivos**
- A correção C1 trouxe as formas de teste da transcrição real e fechou o lado que não pode disparar (16 entradas). Por isso a
  mutação da âncora cai sozinha num caso próprio, sem depender do caso que pede o aviso.

### 5. Conclusão

APROVADA. O único crítico da rodada 1 (C1, RF29 PARCIAL) está fechado: o hook tem código, teste na forma real e duas mutações
pegas, e reconhece todas as mensagens `/seguir` coladas das transcrições reais sem nenhum falso positivo. O maior M1 também:
o passo 6 ensina o comando, o teste o exige e a mutação o pega. Os 32 RF estão atendidos. Os menores (m1 a m6) não mudam o
veredito e vão para o `TODO.md` no fechamento. A esteira do commit validado fica com o Orquestrador.

### 6. Pendências herdadas

| Item | Dono | Arquivo | Destino |
|---|---|---|---|
| m4, Tech Spec §5(h) e §12 atrás do hook do RF29 | Orquestrador → Arquiteto | `tasks/prd-harness/techspec.md:244,403` | já em "Devo ainda" no `estado.md`, no fechamento |
| m5, tabela de "Revisões" sem cabeçalho na correção C1 | Orquestrador | `tasks/correcoes/2026-10-24-aviso-mensagem-colada.md:62` | `TODO.md` (retro da X7), ou junto do fechamento |
| m6, "Não chega como mensagem:" e o sujeito do "abrir" no passo 6 | Orquestrador | `.claude/skills/seguir/passos/6-tarefa.md:106,121` | já em "Devo ainda" no `estado.md`, para o `TODO.md` |
| RF29: conferir que o aviso dispara na primeira mensagem `/seguir` colada no térreo depois do pouso (o hook só vale lá quando a X7 pousar) | Orquestrador | `.claude/hooks/aviso-de-sessao.sh` | junto da conferência do `limpeza.json` (RF27), em "Devo ainda" |
| m1, m2 e m3 da rodada 1 | Orquestrador | ver a rodada 1 | `TODO.md` (retro da X7) |
| Commits `Fora do processo:` com código da spec | — | — | nenhum |

## Rodada 1 — 24/10/2026

**Escopo:** funcionalidade completa
**Commit validado:** `147854c2` (último commit de código: `e2da6d9f`, encontro em `53944c17`)
**Veredito: REPROVADA**

Um crítico: o RF29 está PARCIAL. O hook da mensagem colada só reconhece o prompt que **começa** por `/seguir `, e a
mensagem colada real chega embrulhada em `<pasted_content …>`. O resto da funcionalidade está provado, com código, teste
lido, teste rodado e três mutações pegas. Há um maior (o `abandonar` do RF6 não aparece no `/seguir`).

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `.github/workflows/ci.yml:24-27` (`concurrency`) | `tools/ci/esteira.test.ts:216,227,242` (avalia a expressão do YAML ref a ref, com lista fechada de nomes) | `spec/**` e `correcao/**` cancelam; `develop`, `release`, `main` e `workflow_dispatch` têm o `run_id`; o PR tem `pr-<n>` |
| RF2 | ATENDIDO | `tools/processo/esteira.ts:64-85` (`foiSuperada`, `execucoesQueValem`), `:358-367` (jobs) | `tools/processo/esteira.test.ts:162-246` (RF2 a–g, com saída do `gh` gravada) | mutação 3 abaixo |
| RF3 | ATENDIDO | `tools/processo/linhas.ts:685-712` (`verificarOMerge`, `recusaDaVerificacao`), `:775-777` | `tools/processo/linhas.test.ts` (corridas com arquivo-sinal, `npm` falso no `PATH`, neto que ignora SIGTERM, saída 5) | tipagem e lint depois do merge e antes do `--ff-only`; `reset --hard` antes de soltar a trava |
| RF4 | ATENDIDO | `tools/processo/mutacoes.ts:195-225` (`prazoDaMutada`), `:320-347`, `:378-402` (grupo, SIGTERM e SIGKILL) | `tools/processo/mutacoes.test.ts` (RF4 a–f e os lados que passam, com relógio injetado) | |
| RF5 | ATENDIDO | `tools/processo/mutacoes.ts:635-700` (`OPERADORES_DE_CONDICAO`, `linhasSemBloco`); `portao-local.ts:169` imprime | `tools/processo/mutacoes.test.ts` (um caso por operador, linha citada, teste, import) | |
| RF6 | ATENDIDO | `tools/processo/linhas.ts:559-600` (`abandonar`) | `tools/processo/linhas.test.ts` (linha livre, branch mantida, linha livre ou fechada recusa, abertura abandonada) | ver o maior M1: o comando existe e é provado, mas o `/seguir` não o ensina |
| RF7 | ATENDIDO | `tools/processo/sequencia-do-portao.ts:31-33,67-101`; `tools/ci/compose.ts` (`servicosDeJob`) | `tools/processo/portao-local.test.ts:22-122` | prova pela ordem da sequência (Tech Spec §2), e não com worker de pé |
| RF8 | ATENDIDO | `tools/ci/etapas-de-guarda.ts:134-145`, `tools/ci/verificar.ts:1`, `tools/ci/dependencias.ts:1`, `sequencia-do-portao.ts:41-64` | `tools/ci/scripts.test.ts:129,137`; `tools/processo/portao-local.test.ts:162-187` | |
| RF9 | ATENDIDO | `tools/processo/esteira.ts:164-283` (`--censo`); `ci.yml:116-156` (JSON, 7 dias, `overwrite`, `success() \|\| failure()`) | `tools/processo/esteira.test.ts:277-440`; `tools/ci/esteira.test.ts:382-412` | o "quando" do Orquestrador está em `.claude/skills/seguir/passos/8-validacao-e-pouso.md:28-40` |
| RF10 | ATENDIDO | `tools/processo/linhas.ts:646-659` (`baseDoConferir`) | `tools/processo/linhas.test.ts` (base do quadro, quadro sem `base`, andar da spec, sem quadro) | |
| RF11 | ATENDIDO | `tools/ci/duracao-do-e2e.ts` (corpo sem título, um só no HEAD e um só na árvore) | `tools/ci/duracao-do-e2e.test.ts` | |
| RF12 | ATENDIDO | os quatro modelos (`criar-tasks/task-template.md`, `criar-tasks/tasks-template.md`, `validar/template.md`, `revisar-spec/SKILL.md`) | `tools/processo/harness/rotulos.test.ts:206-256` (rótulo tirado, contornado, fora do começo da linha, revisor inventado) | |
| RF13 | ATENDIDO | `tools/processo/revisoes.ts` (só `export *` dos quatro módulos) | `tools/processo/harness/particao.test.ts:151-260`; `git show 4fcf89d9` muda nos testes do hook só as duas linhas do caso "sem o compilador", como o RF13 permite | `estado.ts:16` importa de `documento-de-revisao.ts` |
| RF14 | ATENDIDO | `tools/processo/hook-git.ts`, `git-hooks/commit-msg`, `git-hooks/pre-push`, `package.json:14` (`prepare`), `comando-git.ts` (`desvioDoHook`), `tools/ci/conferir-entregas.ts`, `ci.yml:50-51` | `tools/processo/hook-git.int.test.ts` (52 casos contra um git real); `hook-portao.test.ts`; `revisoes.test.ts`; `tools/ci/conferir-entregas.test.ts` | mutação 2 abaixo; `npm run ci:conferir-entregas` real: 89 commits de `origin/develop..HEAD`, todos conferem |
| RF15 | ATENDIDO | `tools/processo/guardioes-por-caminho.ts:38-150`; `portao.ts` (`obrigatoriosDoCommit`); `portao-local.ts:101,158` imprime | `tools/processo/harness/guardioes.test.ts` (inclusive `:94`, exceção que não casa arquivo versionado), `revisoes.test.ts`, `hook-git.int.test.ts` | mutação 1 abaixo |
| RF16 | ATENDIDO | `guardioes-por-caminho.ts:64-104` (`REGRAS_DO_RF16`, `RESTO_DO_PROCESSO`); `portao.ts` (`ehCodigoParaAEsteira`, `arquivosDeCodigo`) | `revisoes.test.ts` (`it.each` por caminho do §5(e)); `hook-git.int.test.ts` ("o arquivo de tools/ sem marca é recusado pelo commit-msg do papel") | |
| RF17 | ATENDIDO | `tools/processo/mutacoes.ts:523-572` (`exigenciaDeMutacao`); `portao-local.ts:162`; `decidirCommit` pela conferência | `mutacoes.test.ts`, `revisoes.test.ts`, `hook-git.int.test.ts` (produção sem bloco nem linha: recusado; com a linha e o carimbo: passa) | |
| RF18 | ATENDIDO | `tools/processo/portao.ts:10` (sem o caminho `(mvp:)`) | `tools/processo/revisoes.test.ts:766-806` (em `mvp/*`, `develop` e `spec/*`, o `(mvp: …)` é código sem tarefa) | único teste existente alterado, como o cenário pede |
| RF19 | ATENDIDO | `ci.yml:17-18` (`pull_request: branches: [develop]`), `permissions: contents: read` | `tools/ci/esteira.test.ts:204,254-282` | sem `pull_request_target`, sem segredo |
| RF20 | ATENDIDO | `CLAUDE.md`; `paths:` em 00, 30, 40, 50, 60 e 80 | `tools/processo/harness/base-fixa.test.ts` | medi agora: 13.083 B de `CLAUDE.md` + 26.555 B das regras 10, 20 e 70 = **39.638 B** (teto 40.000; antes, 75.218 B). O `CLAUDE.md` tem 228 linhas contra o "~150" do PRD; o critério de bytes está registrado na Tech Spec §11 |
| RF21 | ATENDIDO | os lugares listados na Tech Spec §9, "Um fato num lugar só" | `tools/processo/harness/revisores.test.ts` (blocos idênticos nas duas famílias; gravação de 24/10 em `harness/__fixtures__/revisores-antes/`) | |
| RF22 | ATENDIDO | `seguir/SKILL.md` (107 linhas) e `passos/`; `executar-task/SKILL.md` (344); `docs/processo-licoes.md` §1 | `tools/processo/harness/seguir.test.ts`, `revisores.test.ts` | |
| RF23 | ATENDIDO | `docs/processo-licoes.md` §2 (auditoria das 26 skills); `frontend-design` fora (pasta e `skills-lock.json`); `status` fora; conflito na linha seguinte ao frontmatter em `nestjs-best-practices`, `playwright-best-practices`, `lgpd-brasil`, `supabase-postgres-best-practices`, `vercel-react-best-practices` | `tools/processo/harness/metadados.test.ts` (compara com `docs/skills-de-terceiros.md`) | |
| RF24 | ATENDIDO | `## Critério de saída` nos quatro papéis do time; `tools/guardas/regras-ia.mjs` (isenção `adaptador-*.ts`) | `tools/processo/harness/caminhos.test.ts`, `metadados.test.ts:493-532`, `tools/guardas/guardas.test.ts` | |
| RF25 | ATENDIDO | linha `Checagem:` em cada item das nove regras | `tools/processo/harness/checagens.test.ts` | o teste prova que a checagem existe, não que ela prova o item (Tech Spec §11) |
| RF26 | ATENDIDO | `seguir/SKILL.md` + `protocolo.md` + `passos/6-tarefa.md` | `tools/processo/harness/seguir.test.ts` | medi agora: **23.967 B** (teto 24.000; antes, 41.050 B). Folga de 33 B |
| RF27 | ATENDIDO | `.claude/hooks/contexto-inicial.sh:37-50` (`feita`); `passos/6-tarefa.md:75` e `passos/9-vigia-e-contexto.md:28` (`pedida`); `tools/processo/vigia.ts:54-77` | `tools/processo/vigia.test.ts` | que o `/clear` entrega `source: clear` segue não provado (Tech Spec §12); se não vier, a vigia acusa a `pedida` sem `feita`, que é o lado "ou a vigia acusa" do RF |
| RF28 | ATENDIDO | `docs/processo-sem-maestri.md:16-19` (os quatro `claude --agent`); `tools/processo/__fixtures__/maestri-list.txt` (regravada pela correção `2026-10-24-fixture-maestri-list`) | `tools/processo/vigia.test.ts:17` em diante | |
| RF29 | **PARCIAL** | `.claude/hooks/aviso-de-sessao.sh:23` (`prompt.startsWith("/seguir ")`) | `tools/processo/harness/aviso-de-sessao.test.ts:53-76`, só com o prompt **sem** embrulho | crítico C1: o "caso da mensagem colada" não está provado, e a forma real da mensagem colada fica fora do prefixo |
| RF30 | ATENDIDO | frontmatter de skills, papéis e regras; comandos do `.claude/settings.json` | `tools/processo/harness/metadados.test.ts:367-486`, `aviso-de-sessao.test.ts:101` | os quatro papéis do time sem `tools`, registrado na Tech Spec §9 |
| RF31 | ATENDIDO | ensaio na correção `2026-10-24-dockerignore-reengenharia` (`029cdb5`), `tasks/correcoes/2026-10-24-dockerignore-reengenharia.md:39-54` | não é teste; registro abaixo | conferido nas transcrições das sessões (`agentSetting` e modelo do fio principal): `implementador` e `mesa-de-revisao` em `claude-sonnet-5-5` (linha 1, 24/10 02:36–02:51), `arquiteto` em `claude-opus-5-5` (andar da spec, 24/10 02:21) e `validador` em `claude-opus-5-5` (esta sessão, `CLAUDE_CODE_AGENT=validador`). O `/usr/bin/git commit` sem revisão foi recusado duas vezes, sem commit. O `estado.md` deixou "o do `Arquiteto` se confere no próximo reinício": fica conferido aqui |
| RF32 | ATENDIDO | `.claude/skills/receitas-de-codigo/SKILL.md` (22 linhas, 1.672 B); `executar-task/SKILL.md:28`; `criar-techspec/template.md:12`; `docs/guia-do-desenvolvedor.md:6`; `CLAUDE.md:204`; `tools/processo/harness/caminhos.ts` | `tools/processo/harness/receitas.test.ts` | a skill aparece na lista de skills da sessão, carregável pelo assunto |

Provas de mutação (cada arquivo restaurado com `git checkout --`; a árvore terminou limpa):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF15 | `guardioes-por-caminho.ts`: o sufixo (`.repository.ts`, `.controller.ts`, `.gateway.ts`, `.service.ts`) e o `@SemEscopo(` que tiram o arquivo da exceção (condição trocada por `false`) | `tools/processo/harness/guardioes.test.ts`: 6 de 87 vermelhos ("x.repository.ts nunca cai em exceção…", "@SemEscopo( no índice, só no HEAD…", "…nas linhas do RF16 que pedem menos") |
| RF14 | `hook-git.ts`, `bloqueioDoCommitMsg`: a chamada da `decidirCommit` trocada por `return null` | `tools/processo/hook-git.int.test.ts` (projeto `processo`): 17 de 52 vermelhos (caminho absoluto, `env`, `command`, `sh -c`, script `.sh`, `-C` de outro checkout, `worktree add`, `tools/` sem marca…) |
| RF2 | `esteira.ts`, `foiSuperada`: `outra.branch === execucao.branch` | `tools/processo/esteira.test.ts`: "RF2 (g): push em outra branch, … não supera a cancelada" |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: o hook muda na ordem do U11 §7 (contrato, mover sem mudar, comportamento) | cumprida | 1.0 (`ae688d8`, rótulos), 2.0 (`4fcf89d`, só move), e o comportamento da 9.0 em diante |
| Regra: todo commit que mexe no hook prova, com o comando real do `settings.json`, que ele carrega e bloqueia | cumprida | `tools/processo/hook-portao.test.ts`; `aviso-de-sessao.test.ts:101` |
| Regra: a cópia congelada saiu | cumprida | nada de cópia em `tools/processo/` nem no `.claude/settings.json`; o socorro está em `docs/processo-sem-maestri.md` |
| Regra: o hook fecha na falha de carga | cumprida | `.claude/settings.json` (`… portao \|\| { …; exit 2; }`); `git-hooks/*` com `exec node`; `hook-git.int.test.ts` ("`PATH` sem `node`: recusado"); `hook-git.ts:121-131` |
| Regra: nada sai em silêncio; mudança de decisão é revisão da D | cumprida | D23 (`docs/decisoes.md:310`), D53 (`:599`), D77 (`:1105`), D79 (`:1388`), revistas em 23/10/2026; o que saiu do `executar-task` está em `docs/processo-licoes.md` §1 |
| Borda: commit do Joaquim fora de sessão de papel | coberta | `hook-git.int.test.ts` ("sem papel: código sem marca … passa"); `conferir-entregas.test.ts` (`Fora do processo: ajuste` sai 0) |
| Borda: push de documento cancela a execução do commit de código | coberta | `esteira.test.ts` "RF2 (f)" |
| Borda: o `merge` do encontro cria commit | coberta | `hook-git.int.test.ts` ("sem papel: … merge do encontro … passa") |
| Borda: o Implementador "conserta" uma guarda vermelha | coberta | `revisoes.test.ts` (RF16, `tools/guardas/index.mjs` sem `privacy-guardian`: recusado) |
| Borda: a X7 altera o hook que julga os próprios commits | justificada | Tech Spec §5(c): julga o da árvore, `hook-portao.test.ts` com o comando real, socorro em `docs/processo-sem-maestri.md` |
| Borda: tarefa só de tela sem condição nova | coberta | `mutacoes.test.ts` e `hook-git.int.test.ts` (linha `**Sem mutação:**` com motivo passa; vazia recusa) |
| Borda: `npx skills update` sobrescreve uma skill de terceiro | coberta | `metadados.test.ts` compara a linha de conflito com `docs/skills-de-terceiros.md` e acusa a diferença |
| Pronto: os 32 RF com a prova da coluna "Como se prova" | **faltando** | o RF29 (crítico C1) |
| Pronto: os casos do `cenarios.md` verdes | cumprido | os testes que rodei, abaixo, todos verdes |
| Pronto: o ensaio do RF31 | cumprido | RF31 acima |
| Pronto: a esteira verde no último commit que alterou código | conferida no fechamento | pelo Orquestrador |
| Pronto: o `TODO.md` com a remoção do `separar-achados.ts` esperando o ok do Gabriel | cumprido | `TODO.md:1840` |
| Pronto (roadmap): nada se contradiz entre `CLAUDE.md`, regras, skills, papéis e `docs/decisoes.md`; toda regra aponta a checagem; base fixa medida antes e depois | cumprido | RF21, RF25 e RF20; o `docs/mvp-rapido.md` ainda descreve o `(mvp:)`, mas se declara histórico desde 05/10/2026 |

### 3. Portão

| Portão | Resultado |
|---|---|
| Dependências | o `node_modules` era de 23/10 11:06, anterior ao `package-lock.json` (23/10 21:39, `ea6b093`): rodei `npm ci` antes de tudo, saída 0 |
| Testes de evidência (`npx vitest run --project unidade tools/processo tools/ci/esteira.test.ts tools/ci/conferir-entregas.test.ts tools/ci/duracao-do-e2e.test.ts tools/ci/scripts.test.ts tools/guardas/guardas.test.ts`) | ✅ 26 arquivos, 1.645 testes |
| `npx vitest run --project processo` (`hook-git.int.test.ts`, git real) | ✅ 52 testes |
| `npm run ci:conferir-entregas` (terceira camada do RF14, sobre a branch real) | ✅ 89 commits conferidos, saída 0 |
| Três provas de mutação | ✅ as três vermelhas, restauradas |
| Suítes inteiras (`typecheck`, `lint`, `test`, `test:e2e`, `test:infra`) | não rodadas aqui (D79) |
| Esteira do GitHub | conferida no fechamento, pelo Orquestrador: não entra no veredito |
| Revisões com veto registradas e aprovadas | ✅ nas 21 tarefas e nas 9 correções da spec, a última rodada de cada revisor obrigatório é APROVADO (os guardiões que o caminho pede inclusive: a 16.0, a 18.0 e a 20.0 têm os quatro) |
| Revisão da spec (`revisao-spec.md`) | ✅ APROVADA na rodada 10, e o acréscimo do RF32 na rodada 13 |
| Commits de código sem marca | nenhum: os 42 sem marca são só de documento |

### 4. Achados

**Críticos**
- C1 — `.claude/hooks/aviso-de-sessao.sh:23` e `tools/processo/harness/aviso-de-sessao.test.ts:53-76` (RF29 PARCIAL). O hook só
  devolve o aviso quando o `prompt` começa por `/seguir `. As mensagens que o time cola no terminal do Orquestrador chegam
  embrulhadas: nas transcrições dele em `~/.claude/projects/-home-joaquimdp-Documentos-git-Educa-ia/`, há **611** mensagens
  `/seguir` coladas, todas começando por `<pasted_content id="…">\n/seguir …` (504 delas com `\n\n` antes). Com essa forma, a
  expressão do hook dá falso: avaliada aqui com as três formas, só o texto puro recebe o aviso. O teste cobre só a forma
  pura, e a Tech Spec §12 deixou "o texto colado chega assim, sem ser expandido" como **não provado**. Não consegui provar que
  o `prompt` do `UserPromptSubmit` chega sem o embrulho, e o que se vê de real aponta o contrário. É justamente o caso do RF29
  ("Caso da mensagem colada"). Correção: aceitar espaço inicial e o `<pasted_content id="…">` seguido de quebra de linha antes do
  `/seguir `, sem aceitar `/seguir` no meio do texto, com um caso de teste na forma tirada da transcrição real (os dois prefixos),
  e o caso que não deve disparar (texto colado que só cita `/seguir` no meio). Ou provar numa sessão interativa que o `prompt`
  chega sem o embrulho e gravar a prova na Tech Spec §12. Dono: correção pelo Orquestrador (`corrigir`), revisores
  `test-engineer`, `revisor-geral` e os quatro guardiões (o caminho é de `.claude/hooks/`).

**Maiores**
- M1 — `.claude/skills/seguir/passos/6-tarefa.md:13` (e `passos/7-paradas.md`): o RF6 existe (`tools/processo/linhas.ts:5,559-600`,
  provado), mas nenhum passo do `/seguir` diz ao Orquestrador que `linhas.ts abandonar <n>` solta a linha, nem quando usá-lo
  (tarefa replanejada, papel morto, linha presa). Ele só aparece no comentário do `linhas.ts` e em duas mensagens de erro do
  `abrir`. A métrica do PRD §9, "edições do `linhas.json` (2 → 0)", depende de o Orquestrador achar o comando no procedimento que
  ele lê. Correção: uma linha no passo 6 ou no 7 (onde cabe, porque o `6-tarefa.md` está a 33 B do teto do RF26), com o comando e
  o caso de uso.

**Menores** (vão à seção 6)
- m1 — `tools/processo/comando-git.ts:422-423`: em sessão de papel, a **leitura** `git config --get core.hooksPath` é negada como
  "mexe no core.hooksPath". Está dentro do §5(a) ("`git config k`"), mas impede o papel de conferir se o hook nativo está ligado.
- m2 — `tasks/correcoes/2026-10-24-dockerignore-reengenharia.md:54`: o ensaio do RF31 não diz se a recusa veio do `PreToolUse`
  ou do `commit-msg`. O hook nativo sozinho está provado no `hook-git.int.test.ts`, mas o ensaio real não o isolou.
- m3 — folgas curtas nos dois orçamentos: 362 B na base fixa (RF20) e 33 B no `/seguir` (RF26). O próximo acréscimo à base fixa
  ou ao passo 6 precisa tirar texto antes.

**Positivos**
- Cada RF do hook tem os dois lados no teste, contra um git real (`hook-git.int.test.ts`), e a mutação que desliga o
  `commit-msg` derruba 17 casos de uma vez.
- A terceira camada roda de verdade sobre a branch da spec (89 commits conferidos) e fecha o que o hook declara não barrar.
- O que a revisão da spec deixou como premissa foi medido e escrito na Tech Spec §12 (o `CLAUDE_CODE_AGENT` no subagente), e
  o que não foi medido ficou dito como não provado.

### 5. Conclusão

REPROVADA por um crítico: o RF29 tem o hook e o teste, mas o teste usa uma forma de mensagem que não é a que chega colada,
e a forma real (vista em 611 mensagens do Orquestrador) passa pelo hook sem aviso. Os outros 31 RF estão atendidos, com o
código lido, os testes lidos e rodados, e três mutações pegas. O caminho até a aprovação: a correção C1 (prefixo do
embrulho, com o caso real no teste) e, no mesmo passo ou numa correção à parte, o M1 (o `abandonar` no `/seguir`). A
revalidação olha só o RF29, o M1 e a esteira do commit novo.

### 6. Pendências herdadas

| Item | Dono | Arquivo | Destino |
|---|---|---|---|
| m1, leitura do `core.hooksPath` negada em sessão de papel | Orquestrador | `tools/processo/comando-git.ts:422` | `TODO.md` (retro da X7) |
| m2, o ensaio do RF31 não isolou o `commit-msg` do `PreToolUse` | Orquestrador | `tasks/correcoes/2026-10-24-dockerignore-reengenharia.md:54` | `TODO.md` (retro da X7) |
| m3, folgas de 362 B (base fixa) e 33 B (`/seguir`) | Orquestrador | `tools/processo/harness/base-fixa.test.ts`, `seguir.test.ts` | `TODO.md` (retro da X7) |
| RF27: o `source: clear` do `/clear` interativo não provado; conferir se `.processo/limpeza.json` ganha `feita` no primeiro `/clear` depois do pouso | Orquestrador | `.claude/hooks/contexto-inicial.sh:41` | já no "Devo ainda" do `estado.md` |
| As recomendações sem aplicar da 4.0 (três), da 19.0 (r2) e o lote 5/7 do e2e | Orquestrador | `4_task.md`, `19_task.md`, `estado.md` | já no "Devo ainda" do `estado.md`, para o `TODO.md` no fechamento |
| Commits `Fora do processo:` com código da spec | — | `git log origin/develop..HEAD -i --grep='^Fora do processo:' -- apps packages infra e2e tools` | nenhum |

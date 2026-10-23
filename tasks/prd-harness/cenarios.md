# Cenários de teste (X7) — detalhe da Tech Spec §10

Cada RF com os dois lados: o caso que a regra recusa e o caso parecido que ela deixa passar. Sem o segundo, trocar a
regra por "recusa tudo" passa no teste. Toda regra nova tem bloco de mutação no documento da tarefa. Os rótulos e nomes
de revisor vêm das constantes exportadas pelo hook e pelo `estado.ts`, nunca de texto redigitado. O vocabulário do
`mutacoes.ts` é o do código: `vermelho` (a mutação foi pega), `verde` (não foi), `recusada` (bloco recusado, portão
vermelho).

## A. Código de processo

| RF | Recusa / acusa | Passa / não acusa | Onde |
|---|---|---|---|
| RF1 | `spec/x` e `correcao/x`: o grupo avaliado dá a ref, com `cancel-in-progress: true` | `develop`, `release`, `main` e `workflow_dispatch`: o grupo avaliado dá o `run_id`; PR: `pr-<número>`, com o `cancel-in-progress` escrito; sem `pull_request_target` nem `secrets.` | `tools/ci/esteira.test.ts`, avaliando a expressão ref a ref |
| RF2 | (a) cancelada mais nova sem sucessora, com o job `cancelled` pelo `timeout-minutes`: vermelha, citando o job; (b) vermelha mais nova que uma verde: vermelha | (c) cancelada com `push` mais novo na mesma branch, concluído: superada, vale o mais novo; (d) o mesmo com o mais novo ainda rodando: `rodando`; (e) os jobs da superada não aparecem em `jobsVermelhos`; (f) commit só de documento: vale o de código; (g) sucessora em outra branch ou de `pull_request`: não supera | `tools/processo/esteira.test.ts`, com saída real do `gh` gravada; (c) a (e) em `situacaoDaTarefa` e em `situacaoDoFechamento` |
| RF3 | duas linhas verdes que juntas quebram o lint: código de saída próprio, a spec não anda, a linha volta ao commit de antes do merge, sem push, linha ocupada, e a saída manda refazer o merge; dois encontros em processos paralelos (o primeiro preso por um comando injetado que espera um arquivo-sinal, sem `sleep`): o segundo espera, e o quadro final tem as duas linhas certas; `partida 2` durante o encontro da linha 1: o quadro final tem a 2 ocupada e a 1 livre; quem espera além do prazo (injetado) sai com "encontro em curso"; com a linha 1 já no quadro e livre (aberta antes com `instalar: false`), um `abrir 1` com `npm ci` injetado preso por arquivo-sinal não segura a trava (uma `partida 2` termina enquanto ele espera), mas a linha 1 já está ocupada: um segundo `abrir 1` em processo paralelo é recusado com a mensagem de linha em uso, uma `partida 1` no mesmo intervalo é recusada com a mesma mensagem, e o `npm ci` injetado roda uma vez só, contado pelo próprio comando num arquivo fora do checkout; solto o sinal, o `abrir 1` sai 0 e uma `partida 1` em seguida passa; com o `npm ci` injetado falhando, o `abrir 1` sai diferente de 0 dizendo para abrir de novo, a linha 1 não está no quadro, a linha 2 do quadro ficou intacta, e um novo `abrir 1` é aceito; a volta à trava: um encontro da linha 2 preso por arquivo-sinal segura a trava e só então se solta o sinal do `npm ci` do `abrir 1`, que não termina enquanto o encontro segura a trava e sai 0 quando ele termina (com o `npm ci` falhando, sai diferente de 0 e tira a linha 1 só então); com prazo de espera injetado menor que o encontro preso, o `abrir 1` sai diferente de 0 mandando `abandonar 1`, a linha 1 continua ocupada, e depois do `abandonar 1` um novo `abrir 1` é aceito; verificação acima do prazo: tratada como vermelha, e o processo que pega a trava, logo que o `flock` retorna, lê a ref do HEAD direto do disco, sem abrir o `git` (o checkout é um worktree: o `.git` é um arquivo com `gitdir:`, e a ref da branch fica no diretório comum ou no `packed-refs`), e confere que já é o commit de antes do merge e que o neto que o comando injetado abriu está morto (pid); o neto ignora o SIGTERM e escreve num arquivo versionado até o SIGKILL, e o checkout está limpo; o prazo padrão de quem espera é maior que 6 min mais os 5 s até o SIGKILL; o `abrir 1` durante um encontro preso espera a trava antes de preparar a linha (o `npm ci` injetado não roda, e roda uma vez só depois de solto); um `abrir 1` (A) preso no `npm ci`, um `abandonar 1`, outro `abrir 1` (B) preso, e A solto: A sai diferente de 0 dizendo "abandonada" e a linha continua na abertura de B, que solto sai 0 e a deixa livre (a marca da abertura é de cada execução); o `fechar` durante um encontro preso espera e depois fecha o quadro; a verificação roda no checkout da linha, depois do merge (o ponto de injeção da 5.0, antes do merge, passou para cá): o comando sob a trava que sai diferente de 0 é o vermelho do RF3; sem o comando injetado, o padrão é `npm run typecheck && npm run lint` (um `npm` de mentira no `PATH` conta o que recebeu), e com o lock da spec diferente do de antes do merge vem o `npm ci` na frente, com o prazo de 6 min (3 min sem ele); lock que é só da própria linha, com código novo da spec, não roda o `npm ci`; o `npm ci` que falha é vermelho e a verificação nem roda; a verificação que passa e deixa um neto de pé não o deixa; o encontro que recebe SIGINT, SIGTERM ou SIGHUP mata o grupo, volta a linha e sai com o código do RF3; o SIGTERM vem primeiro e a espera até o SIGKILL espera o grupo que o atende; o `reset` que falha diz que a linha não voltou e o comando para desfazer; a linha de correção diz o slug dela; o que a verificação escreve vai para o erro do encontro | as duas verdes que juntas passam: a spec avança por `--ff-only`; lock alterado: `npm ci` roda antes; lock igual: não roda | `tools/processo/linhas.test.ts`, repositório temporário, comando de verificação injetado |
| RF4 | (a) mutado que dorme além do prazo: sai no prazo, `recusada`; (b) o neto que o teste abriu também morre (pid conferido); (c) o arquivo volta ao conteúdo de antes; (d) corrida limpa acima do teto: falha dizendo isso, sem mutar; (e) relógio injetado: limpa de 1 s, mutado de 61 s: `recusada`; (f) limpa de 4 min: prazo de 10 min, não 12, e mutado de 11 min dá `recusada` | mutado que falha rápido: `vermelho`; mutado que passa: `verde`; limpa de 1 s, `testTimeout` injetado de 2 s e mutado que falha em 5 s (piso de 60 s): `vermelho`; limpa de 1 s, projeto com `testTimeout` de 5 s, o caso citado declarando 120 s e mutado que falha em 90 s: `vermelho`; limpa de 30 s e mutado que falha em 80 s (3 ×): `vermelho`; limpa de 1 s, `testTimeout` de 120 s e mutado que falha em 90 s: `vermelho`; depois do prazo, uma segunda corrida pega o `flock`. Os casos (a) a (c) usam prazo injetado de 2 s | `tools/processo/mutacoes.test.ts` |
| RF5 | linha nova de produção com `if`, `&&`, `\|\|`, `??`, ternário, `case`, `.where(` ou expressão regular que nenhum bloco cita: listada, um caso por operador | a mesma linha citada por um bloco do arquivo; linha nova em teste; linha só de import; o `--faltando` sai 0 nos dois casos | `tools/processo/mutacoes.test.ts` |
| RF6 | — | `abandonar 2`: a linha 2 fica livre no quadro, a branch não é apagada, as outras linhas não mudam; `abandonar 3` durante o encontro da linha 1: a 3 fica livre e não volta; a correção em curso se solta como a tarefa; `abandonar` de linha livre ou fechada recusa ("já está livre", "não está aberta"); `abandonar` de linha em abertura a tira do quadro, e o `abrir` que volta depois recusa com "foi abandonada" | `tools/processo/linhas.test.ts` |
| RF7 | com `worker` de pé, a sequência do portão o derruba antes da integração (o teste confere a ordem) | sem integração alterada, nada é derrubado; depois da integração, o e2e sobe os workers de novo (o `up` do `tools/ci/e2e.ts` é do ambiente inteiro, sem lista de serviços); a lista dos serviços vem do `infra/compose.yml` (`servicosDeJob`), e lista vazia é erro, e não um `stop` do projeto inteiro; com mutação de integração no documento, a sequência termina num `stop` (suíte `mutacoes`), depois do e2e e do infra e antes de qualquer mutação, e sem mutação de integração esse `stop` não existe (o do alvo é redundância do `down --volumes` do `globalSetup`; o das mutações é a única proteção) | `tools/processo/portao-local.test.ts` (novo), sobre a função que monta a sequência |
| RF8 | uma guarda a mais no `ci:verificar` e não no portão: vermelho (guarda posta direto no `verificar.ts` acrescenta uma chamada que a lista não tem; etapa fora de `GUARDAS_DA_ESTEIRA` sai de `etapasSemGuardaNoPortao`) | as duas listas iguais, lidas de `tools/ci/etapas-de-guarda.ts`: o `ci:verificar`, o `guarda:dependencias` (por `tools/ci/dependencias.ts`) e as suítes de guarda do portão da tarefa e do completo | `tools/ci/scripts.test.ts` e `tools/processo/portao-local.test.ts` |
| RF9 | caso a 70% do prazo numa fatia: listado, com fatia e prazo; fatia faltando ou artefato expirado: sai 2, dizendo qual | caso a 60%; com uma vermelha mais nova que a verde, o censo lê a verde; o `ci.yml` sobe só o JSON, também no verde | `tools/processo/esteira.test.ts` e `tools/ci/esteira.test.ts` |
| RF10 | — | correção aberta a partir de `spec/x`: compara com `spec/x`; a partir da `develop`: com a `develop`; a base vem do quadro, gravada quando a linha é aberta; quadro sem `base` (anterior à X7): compara com a `spec` do quadro; no andar da própria spec, ou sem quadro: com a `develop` | `tools/processo/linhas.test.ts` |
| RF11 | corpo mudado com título novo: sem prazo herdado; dois corpos iguais: nenhum herda | título novo e corpo idêntico ao do HEAD com `test.slow()`: herda | `tools/ci/duracao-do-e2e.test.ts` |

## B. O hook

**RF12.** Um rótulo tirado de `criar-tasks/task-template.md`, de `criar-tasks/tasks-template.md`, de `validar/template.md` ou do bloco do formato em `revisar-spec/SKILL.md`: vermelho, dizendo qual. Nome de revisor
no modelo que não está em `REVISORES_COM_VETO` nem na lista do `revisor-geral`: vermelho.

**RF13.** Os testes atuais de `revisoes.test.ts` e `hook-portao.test.ts` passam sem alteração, salvo o arquivo que o
caso `revisoes.test.ts › a impressão sem comentários › sem o compilador instalado (antes do npm ci), não se aplica` copia:
passa a ser o `caducidade.ts`, onde a função mora, com as asserções iguais (decisão do Joaquim, 23/10/2026). O `estado.ts` e o
`esteira.ts` não importam `revisoes.ts` (teste lê os imports).

**RF14, formas contra um git real** (`tools/processo/hook-git.int.test.ts`, repositório temporário, sem compose):

| Forma, em sessão de papel | Resultado |
|---|---|
| `/usr/bin/git commit -m "..."` com código e sem marca | recusado pelo `commit-msg` |
| `env git commit`, `command git commit`, `sh -c "git commit ..."`, script `.sh` que commita | recusado |
| `git -C <outro checkout> commit` | recusado |
| `git worktree add` e commit no worktree novo | recusado (o `core.hooksPath` é do repositório) |
| código ruim no índice e bom no disco | recusado: vale o índice |
| código bom no índice e ruim no disco | passa |
| merge com conflito resolvido por papel, sem marca | recusado |
| merge com conflito resolvido por papel, com marca, revisões e carimbo | passa |
| merge limpo de outra linha por papel, sem marca | passa |
| mensagem com `Fora do processo:` | recusado |
| `git push origin HEAD:develop` | recusado pelo `pre-push` |
| `PATH` sem `node` | recusado (fecha na falha) |
| papel `intruso` no `CLAUDE_CODE_AGENT` | recusado |
| commit só de documento (`tasks/`, `docs/`, `skills-lock.json`) | passa |
| commit com `(tarefa N.0)`, revisões válidas e carimbo | passa |
| push de `spec/x` | passa |
| sem papel: código sem marca; `PATH` sem `node`; merge do encontro; `git push origin HEAD:develop` | passa |
| `env -u CLAUDE_CODE_AGENT git commit`, `commit-tree`, `rebase` | passa no hook; a terceira camada acusa |

**RF14, negação no `PreToolUse`** (`hook-portao.test.ts`, com o comando do `settings.json`). Negados em sessão de
papel: `--no-verify`, `--no-verif`, `--no-ver`; `commit -n`, `-nm "x"`, `-anm "x"`; `-c core.hooksPath=/dev/null`,
`-c core.HOOKSPATH=x`, `config core.hookspath`; `CLAUDE_CODE_AGENT= git commit`, `unset CLAUDE_CODE_AGENT`,
`env -u CLAUDE_CODE_AGENT`, `GIT_CONFIG_COUNT=1 git commit`. Negado em qualquer sessão do Claude Code, com ou sem papel: mensagem com `Fora do processo:`. Passam: `git log -n 3`,
`git diff --no-ext-diff`, `git -c user.name=x commit`, `GIT_AUTHOR_DATE=x git commit`,
`grep CLAUDE_CODE_AGENT`, `printenv CLAUDE_CODE_AGENT`, `git commit -F msg.txt` com `--no-verify` dentro do arquivo, e
qualquer um dos negados acima sem papel, menos o `Fora do processo:`, que também é negado no arquivo da mensagem (`-F msg.txt`,
`-Fmsg.txt`, `--file=msg.txt`); `-F -` com heredoc fica nos limites declarados. Termo só dentro de `-m "..."`: negado com a dica de `-F`.

**RF14, terceira camada** (`tools/ci/conferir-entregas.test.ts`, repositório temporário):
- sai 0: histórico real de spec, com vários `(tarefa N.0)` e `Revisões:`, o último com código; o merge do encontro,
  limpo, com o `tasks.md` resolvido; um merge da `develop`; commits de documento sem marca; um commit só de
  `skills-lock.json`; um commit de código com `Fora do processo: ajuste`; e o intervalo vazio
- sai 0: histórico de `correcao/x` com `(correção x)` e `Revisões:`
- sai 1, citando o hash: commit de código sem marca; marca sem a linha `Revisões:`; merge com conflito resolvido em
  código, sem marca (`--remerge-diff`); commit sem marca só em `tools/guardas/x.mjs`, e outro só em
  `.github/workflows/ci.yml`; `Fora do processo:` com motivo vazio
- limite conhecido, afirmado como tal: commit de papel feito com `env -u CLAUDE_CODE_AGENT` e `Fora do processo: x` sai 0
- o `ci.yml` chama em `spec/**` e `correcao/**`, com `fetch-depth: 0`, e não na `develop`

**Instalação.** O `prepare` do `package.json` aponta `tools/processo/git-hooks` (teste lê o arquivo).

**Início de sessão.** Com `core.hooksPath` ausente, o aviso sai; com ele certo, não sai.

**RF15** (`tools/processo/harness/guardioes.test.ts` e `revisoes.test.ts`, pela `decidirCommit`): todos os casos de
`tabela-de-guardioes.md`, seção "O teste da tabela", cada regra de casamento com bloco de mutação; repository alterado sem `tenancy-guardian` marcado e sem rodada
dele: recusado, com a rodada APROVADO: passa; marcado e não pedido pelo caminho continua obrigatório; o portão imprime
a lista unida.

**RF16** (`revisoes.test.ts`): em sessão de papel, sem tarefa, um arquivo de cada caminho do §5(e) é recusado
(`tsconfig.base.json`, `.claude/settings.local.json`, `compose.yaml` e `.env.example` incluídos);
`.claude/skills/x/SKILL.md`, `.claude/rules/40-testes.md`, `docs/aia/tutor.md` e `tasks/` passam. Com correção marcada
e sem `revisor-geral`: recusado. O conjunto exato por caminho fica no `guardioes.test.ts` (tabela, "O teste da tabela"); aqui, os dois lados pela
`decidirCommit` (sem o guardião, recusado; com ele, aceito), num `it.each` por caminho da tabela, entre elas `eslint.config.mjs` sem
`tenancy-guardian`, `docs/aia/ouro/x.json` sem `conformidade-reviewer`, `hook-git.ts` sem os quatro, `infra/Caddyfile`
e `tools/ci/borda.test.ts` sem `privacy-guardian`; `infra/k6/x.js` com `infra-guardian` e `privacy-guardian` passa;
`tools/processo/linhas.ts` passa sem guardião com veto. Do padrão: `tools/guardas/index.mjs` sem `privacy-guardian`,
recusado. Sem papel: passa (salvo `infra/`, que é código em toda sessão: `infra/Caddyfile` sem `privacy-guardian` é
recusado também sem papel).

**RF17**: produção alterada e documento sem bloco nem linha: portão vermelho; `**Sem mutação:**` vazio: vermelho; com
motivo: verde; com bloco: verde. Só teste, `.d.ts` ou `apps/web/vite.config.ts`: não exige. Documento achado pela marca. Pela `decidirCommit`, com
carimbo válido: produção no índice e documento sem bloco nem linha, recusado; com a linha, passa. Carimbo do portão de
outra tarefa: recusado.

**RF18**: em `mvp/x`, commit com `(mvp: algo)`, código e carimbo válido: recusado com a mensagem de código sem tarefa. O
teste de hoje que aceita esse caso é o único que muda, e o documento da tarefa diz isso.

**RF19**: o `ci.yml` tem `pull_request` com `branches: [develop]`; o job não lê segredo.

## C. Texto

| RF | Vermelho | Verde |
|---|---|---|
| RF20 | base fixa acima de 40.000 B; regra sempre carregada diferente de {10, 20, 70}; menos itens numerados na 10, na 20 ou na 70 do que na medida de hoje | a medida de hoje gravada como "antes" |
| RF21 | dois blocos que deveriam ser idênticos entre revisores diferindo; "O que verificar" ou o formato de um guardião com veto diferente da versão gravada de hoje | os blocos iguais |
| RF22 | `seguir/SKILL.md` ou `executar-task/SKILL.md` com 500 linhas ou mais; um `passos/*.md` citado que não existe | — |
| RF23 | skill de terceiro da lista sem a linha de conflito depois do frontmatter, ou diferente de `docs/skills-de-terceiros.md` (acusa, não reaplica); `frontend-design` no `skills-lock.json` | as cinco com a linha |
| RF24 | caminho citado em papel, regra ou guarda que não existe (amostra: `apps/api/src/inexistente.ts`); papel sem a seção de critério de saída; a skill `status` ainda citada | os caminhos de hoje, com contagem mínima |
| RF24, guarda de IA (`tools/guardas/guardas.test.ts`) | SDK em `packages/nucleo/src/ia/porta.ts` ou `adaptador.ts`, e no caminho antigo `apps/api/src/ia/adapters/x.ts`: reprovado | SDK em `packages/nucleo/src/ia/adaptador-openai-compat.ts`: passa; a lista de exceções do teste atualizada |
| RF25 | regra que cita checagem que não existe | regra que diz "só a revisão garante" |
| RF26 | `SKILL.md` + `protocolo.md` + `passos/6-tarefa.md` acima de 24 KB; um dos três ausente; `6-tarefa.md` que manda ler o passo 3, o passo 9 ou o `time.md`, uma amostra por termo | os três abaixo do teto; citar o passo 7, o 8 ou o 10 passa, uma amostra por termo; todo `passos/*.md` é citado pelo índice do `SKILL.md` (um passo que o índice não cita é vermelho); o `6-tarefa.md` contém o comando da limpeza, a abertura de linha e o `recruit --replace` (cada ausência é vermelha) |
| RF30 | skill sem `name` ou `description`; papel sem `model` ou `tools`; `paths:` que não casa com nada; comando de hook apontando arquivo que não existe | o repositório de hoje |
| RF32 | caminho a partir da raiz que não existe, na skill (amostra: `apps/api/src/inexistente.ts`) e em cada seção do guia (§5, §6, §7), também escrito com `./` ou entre aspas, um caso por forma e por lado; placeholder cuja pasta não existe (`apps/api/src/inexistente/<modulo>/x.ts`); glob que não casa nada; exemplo que não está na linha que contém `Exemplo:` da seção apontada; exemplo sem pasta da raiz; linha sem exemplo; linha sem trava; linha que aponta `5.9`; `### 5.x` sem linha; trava fora da coluna "Trava" da §7, e trava citada pela metade ("Lint"); código na skill por ` ``` `, por `~~~` e por recuo de quatro espaços, um caso cada; skill com 61 linhas ou acima de 6.000 B; `description` sem a palavra de um assunto, um caso por assunto; skill sem a seção 11 da Tech Spec; seção `## 1. Contexto` do `executar-task` e §2 do `criar-techspec/template.md` sem o nome da skill (o nome em outro lugar do arquivo não vale), um caso cada; `CLAUDE.md` sem `docs/guia-do-desenvolvedor.md`; guia sem o nome da skill; guia ausente ou sem §5 na amostra | fragmento relativo (`componentes/dialogos.tsx`), nome de regra de lint (`guardas/log-sem-dado-pessoal`) e rota fora da conferência; placeholder `apps/api/src/<modulo>/x.int.test.ts` com a pasta existente; o repositório de hoje: tantas linhas na skill quantas `### 5.x` no guia, pelo menos seis, cada uma com exemplo e trava, as linhas da tabela da §7 contadas, e mais de zero caminhos conferidos na §5, na §6, na §7 e na skill, cada contagem afirmada |

Cada checagem do C roda sobre o repositório e sobre uma amostra quebrada em pasta temporária, e afirma uma contagem
mínima do que achou (zero achados é vermelho).

## D. Maestri

- **RF27** (`vigia.test.ts`): `pedida` há 11 minutos sem `feita`: acorda o Orquestrador; há 9: não; `feita` depois da
  `pedida`: não. O início de sessão grava `feita` só com `source: clear`, sem papel, no térreo; com papel, com
  `source: startup` ou fora do térreo, não grava
- **RF28** (`vigia.test.ts`): a saída real do `maestri list`, em `tools/processo/__fixtures__/`, é lida com os terminais
  e os estados certos; `docs/processo-sem-maestri.md` existe e cita os quatro `claude --agent`
- **RF29** (`tools/processo/harness/aviso-de-sessao.test.ts`): entrada com `/seguir ` sem papel: devolve o contexto; com
  papel, ou sem o prefixo: nada; o hook não grava arquivo

## E. Validação

**RF31** não é teste: o ensaio roda no fim, pelo Orquestrador, e fica no `estado.md` e na validação.

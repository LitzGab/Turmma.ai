# Tarefa 20.0 — A limpeza vigiada, o modo sem Maestri e a mensagem colada

**Funcionalidade:** harness (X7) · **Depende de:** 11.0, 17.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian` (o caminho `.claude/settings.json` soma os outros dois)
**Porte:** grande

## Objetivo

A limpeza do Orquestrador que a rotina pulou não se perde calada: a vigia acorda o Orquestrador; o processo sem Maestri
fica escrito, com o socorro do hook; a leitura do `maestri list` tem teste com saída real; e a mensagem colada que começa
com `/seguir ` chega executando.

## Contexto necessário

- `techspec.md` §3 (`.processo/limpeza.json`), §5(c) (o socorro), §5(g), §5(h), §12 (a terceira premissa)
- `prd.md` RF27, RF28, RF29
- `cenarios.md` seção D, **RF27**, **RF28**, **RF29**
- Código: `tools/processo/vigia.ts` (`nomesDoTime`, `estaTrabalhando`, `decidir`); `.claude/hooks/contexto-inicial.sh`
  (já distingue `"source":"clear"` e lê `CLAUDE_CODE_AGENT`; a 11.0 acrescentou o aviso do `core.hooksPath`);
  `.claude/settings.json`; o comando `nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"'`, hoje
  no passo da vigia e contexto (`.claude/skills/seguir/passos/`, da 17.0)

## Subtarefas

- [x] 20.1 — O comando da limpeza grava `pedida` em `.processo/limpeza.json` antes do `nohup`; o início de sessão grava
  `feita` só com `source: clear`, sem `CLAUDE_CODE_AGENT`, no térreo
- [x] 20.2 — `vigia.ts`: `pedida` há mais de 10 minutos sem `feita` depois dela acorda o Orquestrador
- [x] 20.3 — `tools/processo/__fixtures__/maestri-list.txt` com a saída real de `maestri list`; o teste de `nomesDoTime`
  passa a lê-la
- [x] 20.4 — `docs/processo-sem-maestri.md`: a Mesa e o Implementador por `claude --agent` (os quatro papéis), e o socorro
  do hook (`git -C <checkout> checkout origin/develop -- tools/processo .claude/settings.json`, o que ele perde e não
  apaga)
- [x] 20.5 — Hook `UserPromptSubmit` (`.claude/hooks/aviso-de-sessao.sh`), só sem `CLAUDE_CODE_AGENT`: prefixo `/seguir `
  devolve o contexto "leia `.claude/skills/seguir/SKILL.md` e siga com esta entrada"; não grava o texto
- [x] 20.6 — Prova da premissa do §12 numa sessão real (o texto colado chega expandido; o `SessionStart` distingue
  `clear`); se não valer, o RF27 e o RF29 ficam no aviso de início de sessão: anotar em "Divergências"
- [x] 20.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/vigia.ts`, `tools/processo/vigia.test.ts` | alterados |
| `tools/processo/__fixtures__/maestri-list.txt` | novo |
| `.claude/hooks/contexto-inicial.sh` | alterado |
| `.claude/hooks/aviso-de-sessao.sh` | novo |
| `.claude/settings.json` | alterado |
| `.claude/skills/seguir/passos/6-tarefa.md` e o passo da vigia | alterados (o comando grava `pedida`) |
| `docs/processo-sem-maestri.md` | novo |
| `tools/processo/harness/aviso-de-sessao.test.ts` | novo |
| `.claude/skills/seguir/time.md`, `.claude/skills/vigia/SKILL.md`, `.claude/skills/seguir/passos/9-vigia-e-contexto.md` | alterados (o ponteiro para o `docs/processo-sem-maestri.md`; a linha da tabela da vigia para a limpeza perdida; o comando e a explicação de `pedida` e `feita`) |
| `tasks/prd-harness/techspec.md` (§12), `tasks/prd-harness/cenarios.md` (RF28) | alterados (as duas divergências abaixo) |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF27: `pedida` há 11 min sem `feita` | unidade | acorda |
| RF27: `pedida` há 9 min | unidade | não acorda |
| RF27: `feita` depois da `pedida` | unidade | não acorda |
| RF27: início de sessão com `source: clear`, sem papel, no térreo | unidade (processo) | grava `feita` |
| RF27: com papel / `source: startup` / fora do térreo | idem | não grava, um caso cada |
| RF28: a saída real do `maestri list` | unidade | terminais e estados certos |
| RF28: `docs/processo-sem-maestri.md` | unidade | existe e cita os quatro `claude --agent` |
| RF29: entrada com `/seguir ` sem papel | unidade (processo) | devolve o contexto |
| RF29: com papel / sem o prefixo | idem | nada |
| RF29: o hook | idem | não grava arquivo |
| RF30 (da 19.0) | unidade | o comando novo do `settings.json` aponta arquivo que existe |

## Como testar

- RF27 e RF28: copiar `tools/processo/vigia.test.ts › acordar ou não › com todos parados, acorda: alguém deve um relatório, ou há pergunta na tela`, com o relógio injetado em `decidir`; e `› quem é do time › só os papéis, com ou sem número de linha, entre os agentes ligados`, trocando o texto inline pela fixture.
- Hooks de shell: rodar `bash <script>` com a entrada JSON no stdin e `HOME`/`CLAUDE_PROJECT_DIR` numa pasta temporária, como `tools/processo/hook-portao.test.ts` roda o comando do `settings.json`.
- Rodar: `npx vitest run --project unidade tools/processo/vigia.test.ts tools/processo/harness/aviso-de-sessao.test.ts`.

## Fora do escopo desta tarefa

O ensaio do RF31, que é do Orquestrador no fechamento.

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| RF28 pedia "os terminais **e os estados** certos" na saída do `maestri list`, mas a saída real só traz nomes (os blocos `You:` e `Connected agents:`), sem estado | O estado de trabalho vem da tela de cada terminal (`maestri check`, lida por `estaTrabalhando`). A fixture é a saída crua do comando; o teste lê os terminais, e o estado fica provado pelo teste da vigia inteira com um `maestri` falso, que não acorda com o time trabalhando | `cenarios.md` D, **RF28** (texto trocado para dizer isso); `prd.md` RF28 não cita estado |
| 20.6: a premissa do §12 só se prova em parte numa sessão não interativa. Provado: o `UserPromptSubmit` recebe `prompt` literal e o stdout do hook vira contexto; o `SessionStart` traz `source`. Não provado: o texto colado chegar sem expandir, e `/clear` entregar `source: clear` | O Joaquim confere no primeiro `/clear` do Orquestrador (`.processo/limpeza.json` ganha `feita`). Se não valer, a vigia acorda o Orquestrador pela `pedida` sem `feita`, e o aviso de início de sessão segue como rede; nada do código muda | `techspec.md` §12 (a linha da premissa, reescrita com o que foi e o que não foi provado), §5(g) e §5(h) |
| `6-tarefa.md`, item 1 do passo ("No andar da spec ninguém implementa…"), reescrito e sem "no diagnóstico e na triagem" | O comando da limpeza ganhou a gravação de `pedida` e `6-tarefa.md` + `protocolo.md` + `SKILL.md` somavam 23.932 B, com teto de 24.000 (`seguir.test.ts`, RF26): foi preciso tirar uns 100 B, e esta frase repetia o que o passo 3 já diz. Nenhuma regra mudou | `cenarios.md` C, **RF26** (o teto de 24 KB); soma depois da tarefa: 23.967 B |

## Mutações

Código de `tools/processo/` e de `.claude/`, fora do RF17 (que olha `apps/*/src` e `packages/*/src`): os blocos cobrem mesmo assim
cada cláusula nova. A cópia da condição em `aviso-de-sessao.sh` e a do `contexto-inicial.sh` são arquivos diferentes, cada uma com os
seus blocos.

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › sem pedida, ou só com a feita
-  if (limpeza.pedida === undefined) return false
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › feita igual ou depois da pedida
-  if (Date.parse(limpeza.feita ?? '') >= pedida) return false
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › feita igual ou depois da pedida
-  if (Date.parse(limpeza.feita ?? '') >= pedida) return false
+  if (Date.parse(limpeza.feita ?? '') > pedida) return false
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › o limite é
-  return !(agora.getTime() - pedida <= LIMPEZA_DEMORA_MS)
+  return !(agora.getTime() - pedida < LIMPEZA_DEMORA_MS)
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › a limpeza em dia deixa a decisão
-  if (!limpezaPerdida(limpeza, agora)) return decisao
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › a limpeza perdida acorda mesmo com o time trabalhando
-  return { ...decisao, acordar: true, motivo: `a limpeza pedida às ${limpeza.pedida ?? ''} não aconteceu` }
+  return { ...decisao, acordar: decisao.acordar, motivo: `a limpeza pedida às ${limpeza.pedida ?? ''} não aconteceu` }
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › com o time trabalhando e a limpeza em dia, ou sem arquivo
-    const conteudoDaLimpeza = existsSync(arquivoDaLimpeza) ? readFileSync(arquivoDaLimpeza, 'utf8') : null
+    const conteudoDaLimpeza = readFileSync(arquivoDaLimpeza, 'utf8')
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › com o time trabalhando e a limpeza pedida há 11 minutos
-    decisao = comLimpezaDoArquivo(decidir(telas, visto, agora), conteudoDaLimpeza, agora)
+    decisao = decidir(telas, visto, agora)
```

```mutacao
arquivo: .claude/hooks/contexto-inicial.sh
teste: tools/processo/vigia.test.ts › source compact
-if [ "$origem" = limpo ] && [ -z "${CLAUDE_CODE_AGENT:-}" ] && [ -n "$pasta_git" ] && [ "$pasta_git" = "$(git rev-parse --git-common-dir 2>/dev/null)" ]; then
+if [ -z "${CLAUDE_CODE_AGENT:-}" ] && [ -n "$pasta_git" ] && [ "$pasta_git" = "$(git rev-parse --git-common-dir 2>/dev/null)" ]; then
```

```mutacao
arquivo: .claude/hooks/contexto-inicial.sh
teste: tools/processo/vigia.test.ts › com papel
-if [ "$origem" = limpo ] && [ -z "${CLAUDE_CODE_AGENT:-}" ] && [ -n "$pasta_git" ] && [ "$pasta_git" = "$(git rev-parse --git-common-dir 2>/dev/null)" ]; then
+if [ "$origem" = limpo ] && [ -n "$pasta_git" ] && [ "$pasta_git" = "$(git rev-parse --git-common-dir 2>/dev/null)" ]; then
```

```mutacao
arquivo: .claude/hooks/contexto-inicial.sh
teste: tools/processo/vigia.test.ts › fora de um repositório git
-if [ "$origem" = limpo ] && [ -z "${CLAUDE_CODE_AGENT:-}" ] && [ -n "$pasta_git" ] && [ "$pasta_git" = "$(git rev-parse --git-common-dir 2>/dev/null)" ]; then
+if [ "$origem" = limpo ] && [ -z "${CLAUDE_CODE_AGENT:-}" ] && [ "$pasta_git" = "$(git rev-parse --git-common-dir 2>/dev/null)" ]; then
```

```mutacao
arquivo: .claude/hooks/contexto-inicial.sh
teste: tools/processo/vigia.test.ts › fora do térreo
-if [ "$origem" = limpo ] && [ -z "${CLAUDE_CODE_AGENT:-}" ] && [ -n "$pasta_git" ] && [ "$pasta_git" = "$(git rev-parse --git-common-dir 2>/dev/null)" ]; then
+if [ "$origem" = limpo ] && [ -z "${CLAUDE_CODE_AGENT:-}" ] && [ -n "$pasta_git" ]; then
```

```mutacao
arquivo: .claude/hooks/contexto-inicial.sh
teste: tools/processo/vigia.test.ts › source clear, sem papel, no térreo
-try { limpeza = JSON.parse(fs.readFileSync(arquivo, "utf8")) } catch {}
+try { limpeza = {} } catch {}
```

```mutacao
arquivo: .claude/hooks/contexto-inicial.sh
teste: tools/processo/vigia.test.ts › sem arquivo antes
-if (typeof limpeza !== "object" || limpeza === null || Array.isArray(limpeza)) limpeza = {}
+if (limpeza === null || Array.isArray(limpeza)) limpeza = {}
```

```mutacao
arquivo: .claude/hooks/contexto-inicial.sh
teste: tools/processo/vigia.test.ts › sem arquivo antes
-if (typeof limpeza !== "object" || limpeza === null || Array.isArray(limpeza)) limpeza = {}
+if (typeof limpeza !== "object" || Array.isArray(limpeza)) limpeza = {}
```

```mutacao
arquivo: .claude/hooks/contexto-inicial.sh
teste: tools/processo/vigia.test.ts › sem arquivo antes
-if (typeof limpeza !== "object" || limpeza === null || Array.isArray(limpeza)) limpeza = {}
+if (typeof limpeza !== "object" || limpeza === null) limpeza = {}
```

```mutacao
arquivo: .claude/hooks/aviso-de-sessao.sh
teste: tools/processo/harness/aviso-de-sessao.test.ts › com papel
-[ -z "${CLAUDE_CODE_AGENT:-}" ] || exit 0
```

```mutacao
arquivo: .claude/hooks/aviso-de-sessao.sh
teste: tools/processo/harness/aviso-de-sessao.test.ts › sem o prefixo
-    process.exit(prompt.startsWith("/seguir ") ? 0 : 1)
+    process.exit(0)
```

```mutacao
arquivo: .claude/hooks/aviso-de-sessao.sh
teste: tools/processo/harness/aviso-de-sessao.test.ts › sem o prefixo
-' 2>/dev/null || exit 0
+' 2>/dev/null
```

```mutacao
arquivo: .claude/hooks/aviso-de-sessao.sh
teste: tools/processo/harness/aviso-de-sessao.test.ts › entrada que não é JSON
   } catch {
-    process.exit(1)
+    process.exit(0)
   }
```

```mutacao
arquivo: .claude/settings.json
teste: tools/processo/harness/aviso-de-sessao.test.ts › aponta o hook que existe
-            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/aviso-de-sessao.sh\""
+            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/contexto-inicial.sh\""
```

```mutacao
arquivo: .claude/skills/seguir/passos/6-tarefa.md
teste: tools/processo/vigia.test.ts › 6-tarefa.md: roda
-   d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
+   d="$(git rev-parse --git-common-dir)/../.processo" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

```mutacao
arquivo: .claude/skills/seguir/passos/6-tarefa.md
teste: tools/processo/vigia.test.ts › 6-tarefa.md: roda
-   d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
+   d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

```mutacao
arquivo: .claude/skills/seguir/passos/9-vigia-e-contexto.md
teste: tools/processo/vigia.test.ts › 9-vigia-e-contexto.md: roda
-d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
+d="$(git rev-parse --git-common-dir)/../.processo" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

```mutacao
arquivo: .claude/skills/seguir/passos/9-vigia-e-contexto.md
teste: tools/processo/vigia.test.ts › 9-vigia-e-contexto.md: roda
-d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
+d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª), test-engineer (1ª) | Ancorar o caminho de `.processo/limpeza.json` nos comandos dos passos 6 e 9 (`git-common-dir`) e no `mkdir`/gravação do `contexto-inicial.sh` (`$CLAUDE_PROJECT_DIR`), para a `pedida` não cair fora do térreo | `TODO.md`, em "Da X7 (harness), fora dela". Muda o comando dos dois passos, o do hook e quatro blocos de "Mutações", e não cabe em poucas linhas; o passo diz "no térreo" e o Orquestrador roda lá |
| infra-guardian (1ª), revisor-geral (1ª) | `vigia.ts`: `limpeza.json` que é JSON válido mas não é objeto (`null`, `[]`, texto) dá motivo enganoso ou não acorda; mostrar a `pedida` ilegível | `TODO.md`, em "Da X7 (harness), fora dela". Muda o comportamento da vigia e pede teste e mutação novos |
| revisor-geral (1ª) | Mover os testes do `contexto-inicial.sh` de `vigia.test.ts` para `tools/processo/harness/` | Recusada: nove blocos de "Mutações" citam `tools/processo/vigia.test.ts › …`, e mover só por organização reescreve todos |
| test-engineer (1ª) | Regravar `maestri-list.txt` no terminal do Orquestrador, com linha numerada (`Implementador 2`, `Mesa 2`), e asserir a lista inteira | Ensaio do RF31, do Orquestrador no fechamento: só o terminal dele vê a saída com as linhas numeradas |
| privacy-guardian (1ª) | Conferir que nenhuma cópia da entrada da prova do 20.6 ficou em `~/.claude` ou em arquivo temporário | Relatório do Implementador ao Orquestrador: é estado da máquina do Joaquim, fora do repositório |
| test-engineer (1ª) | Pôr no `estado.md` a limitação do `/clear` de sessão sem papel no térreo (esconde uma limpeza perdida) e a conferência do `source: clear` no primeiro `/clear` do Orquestrador como item da validação | Relatório do Implementador ao Orquestrador, que escreve o `estado.md`; o Implementador não o edita |
| privacy-guardian (2ª) | Ao regravar `maestri-list.txt`, conferir o conteúdo antes (caminho com nome de usuário, título de sessão), porque o repositório é público | Ensaio do RF31, do Orquestrador no fechamento, que é quem regrava a fixture (já é o destino da recomendação de test-engineer da 1ª rodada) |
| test-engineer (2ª) | O teste "não grava" não pega hook que grave em caminho absoluto fixo (`/tmp/x`, `/var/tmp`) fora de `TMPDIR`, `HOME` e `CLAUDE_PROJECT_DIR` | Recusada: varrer o `/tmp` real é o que a 1ª rodada tirou do teste, por ser instável com outros testes em paralelo; o cabeçalho do hook (regra 20, item 9) é a proteção, e a revisão do hook cobre a extensão dele |
| test-engineer (2ª) | `readdirSync(dir, { recursive: true })` pede Node 20.1 ou mais novo | Sem ação: o revisor registra que o repositório já exige esse Node (`import.meta.dirname`) |
| revisor-geral (2ª) | Uma linha no comentário do teste "não grava": a cópia do hook precisa trazer tudo o que o hook lê | Quem estender o hook (a tarefa futura que o tocar): hoje o hook não lê outro arquivo, e o `expect(saida.stdout).not.toBe('')` já acusa a cópia incompleta |
| revisor-geral (2ª) | A linha do item 1 do passo 6 em "Divergências" aponta o `cenarios.md` RF26, mas lá não há divergência | Recusada: a terceira coluna da tabela é "onde está na spec", e o RF26 é o teto de 24 KB que o corte respeita; a linha não diz que o `cenarios.md` mudou |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 02:22:16 | 2026-10-24 02:22:28 | `tenancy-guardian` | 1 | APROVADO | a767ce76feb57d6e8 |
| 2026-10-24 02:22:10 | 2026-10-24 02:22:40 | `privacy-guardian` | 1 | APROVADO | a3fc15fc136d31337 |
| 2026-10-24 02:22:18 | 2026-10-24 02:22:42 | `conformidade-reviewer` | 1 | APROVADO | ad2a8919e08f94308 |
| 2026-10-24 02:22:08 | 2026-10-24 02:22:42 | `infra-guardian` | 1 | APROVADO | a2ddf32a459065991 |
| 2026-10-24 02:22:14 | 2026-10-24 02:23:30 | `revisor-geral` | 1 | APROVADO | afdece24559e1730d |
| 2026-10-24 02:22:12 | 2026-10-24 02:25:02 | `test-engineer` | 1 | APROVADO | ad654a0c2c810575a |
| 2026-10-24 02:31:26 | 2026-10-24 02:31:38 | `infra-guardian` | 2 | APROVADO | aedcfe2dc65bf5c10 |
| 2026-10-24 02:31:39 | 2026-10-24 02:32:02 | `privacy-guardian` | 2 | APROVADO | a6018c8aa4402e167 |
| 2026-10-24 02:31:54 | 2026-10-24 02:32:27 | `test-engineer` | 2 | APROVADO | a6c8bc25027c982d9 |
| 2026-10-24 02:32:14 | 2026-10-24 02:32:28 | `tenancy-guardian` | 2 | APROVADO | a5c4e7bc677dc8d28 |
| 2026-10-24 02:32:08 | 2026-10-24 02:32:39 | `revisor-geral` | 2 | APROVADO | a28a3dc5b4cd56fb6 |
| 2026-10-24 02:32:20 | 2026-10-24 02:32:40 | `conformidade-reviewer` | 2 | APROVADO | a54a18da2c5d66649 |

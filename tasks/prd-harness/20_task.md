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

- [ ] 20.1 — O comando da limpeza grava `pedida` em `.processo/limpeza.json` antes do `nohup`; o início de sessão grava
  `feita` só com `source: clear`, sem `CLAUDE_CODE_AGENT`, no térreo
- [ ] 20.2 — `vigia.ts`: `pedida` há mais de 10 minutos sem `feita` depois dela acorda o Orquestrador
- [ ] 20.3 — `tools/processo/__fixtures__/maestri-list.txt` com a saída real de `maestri list`; o teste de `nomesDoTime`
  passa a lê-la
- [ ] 20.4 — `docs/processo-sem-maestri.md`: a Mesa e o Implementador por `claude --agent` (os quatro papéis), e o socorro
  do hook (`git -C <checkout> checkout origin/develop -- tools/processo .claude/settings.json`, o que ele perde e não
  apaga)
- [ ] 20.5 — Hook `UserPromptSubmit` (`.claude/hooks/aviso-de-sessao.sh`), só sem `CLAUDE_CODE_AGENT`: prefixo `/seguir `
  devolve o contexto "leia `.claude/skills/seguir/SKILL.md` e siga com esta entrada"; não grava o texto
- [ ] 20.6 — Prova da premissa do §12 numa sessão real (o texto colado chega expandido; o `SessionStart` distingue
  `clear`); se não valer, o RF27 e o RF29 ficam no aviso de início de sessão: anotar em "Divergências"
- [ ] 20.7 — Testes

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

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

# Tarefa 5.0 — O hook bloqueia quando não carrega

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Hoje, se `tools/processo/hook-revisoes.ts` não carrega (import quebrado, erro de sintaxe), o node sai com 1, o Claude Code
segue, e o commit passa sem portão. Depois desta tarefa, o hook que não carrega sai com 2 e bloqueia o Bash (N7).

## Contexto necessário

- `onda-0.md` §2.5 inteiro e §3, linha RF4; `techspec.md` §12 (a premissa do exit 2) e §11 (a N7 é a única mudança em
  `.claude/` antes da Etapa 9); `prd.md` RF4
- `.claude/rules/40-testes.md` ("O portão"); sem regra de produto
- Código: `.claude/settings.json` (`PreToolUse` › `Bash`, o comando `portao`; `SubagentStop`, o `registrar`, que não muda);
  `tools/processo/hook-revisoes.ts:20-40` (o `try` cobre o `portao`, não a carga do módulo); `tools/processo/revisoes.ts:41`
  (`PASTAS_DE_CODIGO`)

## Subtarefas

- [ ] 5.1 — O comando `portao` de `.claude/settings.json` ganha `|| { echo '…' >&2; exit 2; }`, com o texto de
  `onda-0.md` §2.5; o `registrar` fica como está
- [ ] 5.2 — `tools/processo/hook-portao.test.ts` roda o comando lido do `settings.json` sobre uma cópia de `tools/processo/`
- [ ] 5.3 — A sessão de teste que confirma o exit 2 no Claude Code, registrada neste documento
- [ ] 5.4 — Testes: carga quebrada sai 2 com a mensagem; hook são sai 0 e o `deny` passa intacto

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.claude/settings.json` | alterado |
| `tools/processo/hook-portao.test.ts` | novo |

## Testes que provam a regra

Definidos com o `test-engineer`. O comando é **lido** de `.claude/settings.json` e rodado com `sh -c`, com
`CLAUDE_PROJECT_DIR` numa cópia de `tools/processo/` e a entrada do hook no stdin.

| Cenário | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Cópia com import de módulo inexistente: sai 2 | unidade, `hook-portao.test.ts` | tirar o `\|\| { …; exit 2; }` do comando em `settings.json` |
| Cópia com erro de sintaxe em `revisoes.ts`: sai 2 | unidade | idem |
| Cópia com módulo que lança na carga: sai 2 | unidade | idem |
| Na falha de carga, o stderr traz "hook de revisões não carregou: nenhum Bash roda até consertar tools/processo/. Avise o Joaquim." | unidade | tirar o `echo` |
| Cópia sã, Bash comum: sai 0, sem saída | unidade | trocar `\|\|` por `;` |
| Cópia sã, commit que o portão nega: sai 0, e o stdout traz `permissionDecision: 'deny'` | unidade | mandar o stdout para `/dev/null` no comando |
| O `registrar` (`SubagentStop`) não ganha o `exit 2` | unidade, lendo `settings.json` | acrescentar `\|\| … exit 2` ao `registrar` |
| ⚠️ O exit 2 bloqueia o Bash no Claude Code | manual, numa sessão de teste | — |

Isolamento, concorrência e log de produto não se aplicam.

## Como testar

- Molde da cópia temporária: `tools/processo/mutacoes.test.ts › a mesma mutação em dois projetos tem cada uma a sua corrida
  limpa e a sua corrida mutada` (`mkdtempSync`, `mkdirSync`, `writeFileSync`); o `execFileSync` com `cwd` é o de
  `tools/processo/linhas.test.ts:186`
- Rodar: `npx vitest run --project unidade tools/processo/hook-portao.test.ts`
- Armadilhas:
  - A 5.0 fica fora de `PASTAS_DE_CODIGO`, mas roda `node tools/processo/portao-local.ts --tarefa` com a mutação do
    `settings.json` declarada
  - A cópia precisa de tudo que o hook importa (`tools/processo/*.ts`). Sem `git` na cópia, o `deny` pode vir do `catch`
    ("o portão de revisões falhou"): prefira um `deny` da regra, ou afirme que o motivo não é o do `catch`
  - O teste roda com `sh -c`; o shell do Joaquim é o fish, e a sessão do ⚠️ confere que o Claude Code aceita `{ …; }`
  - Editar o `settings.json` vale na hora para a sua própria sessão: com o comando errado, todo Bash para. Conserte pelo Edit

## Fora do escopo desta tarefa

Qualquer outra mudança em `.claude/` ou `tools/processo/` (Etapa 9, 92.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


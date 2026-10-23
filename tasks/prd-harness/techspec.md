# Tech Spec — Harness (X7)

**PRD:** `tasks/prd-harness/prd.md`
**Status:** rascunho

Respostas do Joaquim, 23/10/2026: `core.hooksPath` pelo `prepare`; as paradas do §9; o ensaio do RF31 é o item
"(X5, RF31)" do `TODO.md`.

## 1. Resumo da abordagem

Quatro trilhas, nesta ordem. **(1)** O hook se protege antes de mudar: passa a rodar de uma cópia congelada, ganha os
testes de contrato e do harness, e o `revisoes.ts` é partido só por mover. **(2)** O código de processo das
retrospectivas (RF1 a RF11), em arquivos que não se tocam, corre em linhas. **(3)** O comportamento novo do hook (RF14 a
RF18), depois da partição, um por tarefa. **(4)** O texto e o Maestri (RF20 a RF29), por último, para já descrever o
hook novo. Fecha com o hook descongelado e o ensaio (RF31). Sem dependência nova.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `.github/workflows/ci.yml` | alterado | `concurrency` (RF1); `pull_request` com `branches: [develop]` (RF19) |
| `tools/processo/esteira.ts` | alterado | `cancelled` vira `superada`, e o veredito é o da concluída mais nova (RF2); `--censo` (RF9) |
| `tools/processo/linhas.ts` | alterado | `encontro` com tipagem e lint (RF3); `abandonar <n>` (RF6); `conferir` contra a base da branch (RF10) |
| `tools/processo/mutacoes.ts` | alterado | prazo por mutação (RF4); `--faltando` (RF5); a exigência do RF17 |
| `tools/processo/portao-local.ts` | alterado | para os workers do compose de teste (RF7); guardas por `tools/ci/etapas-de-guarda.ts` (RF8); imprime o `--faltando` |
| `tools/ci/duracao-do-e2e.ts` | alterado | caso retitulado (RF11) |
| `tools/processo/revisoes.ts` | partido | `documento-de-revisao.ts`, `caducidade.ts`, `comando-git.ts`, `portao.ts`; o `revisoes.ts` vira só reexportação (RF13); sai o `(mvp:)` (RF18) |
| `tools/processo/guardioes-por-caminho.ts` | novo | a tabela do RF15 |
| `tools/processo/hook-git.ts`, `tools/processo/git-hooks/` | novos | `commit-msg` e `pre-push` (RF14) |
| `tools/processo/hook.sh`, `tools/processo/congelar-hook.ts` | novos | a entrada do hook, que prefere a cópia congelada (§5c) |
| `tools/processo/harness.test.ts` | novo | contrato dos modelos, orçamento, caminhos citados e metadados (RF12, RF20, RF21, RF24, RF25, RF30) |
| `tools/processo/separar-achados.ts` e o teste dele | removidos | código morto: nenhum `achados-revisoes.md` existe (U11-10) |
| `tools/processo/estado.ts` | alterado | lê as decisões em aberto do documento novo (RF20) |
| `tools/processo/vigia.ts` | alterado | limpeza perdida (RF27); exemplo real do `maestri list` (RF28) |
| `tools/guardas/regras-ia.mjs` | alterado | a pasta isenta é a real, `packages/nucleo/src/ia/adaptador-*.ts` (RF24) |
| `.claude/settings.json`, `.claude/hooks/` | alterados | entrada por `hook.sh`; `UserPromptSubmit` (RF29); o início de sessão confere o `core.hooksPath` e grava a limpeza |
| `package.json` | alterado | `"prepare": "git config core.hooksPath tools/processo/git-hooks"` |
| `CLAUDE.md`, `.claude/rules/`, `docs/decisoes.md`, `docs/decisoes-em-aberto.md` | alterados e novo | RF20, RF25 |
| `.claude/skills/`, `.claude/agents/` | alterados | RF21 a RF24; saem `status` e `frontend-design` (§9) |
| `docs/processo-licoes.md`, `docs/processo-sem-maestri.md` | novos | RF22, RF28 |

## 3. Modelo de dados

Nenhuma tabela; fora do git, `.processo/hook-congelado/` (§5c) e `.processo/limpeza.json` (RF27). Sem IA (§8).

## 4. API

Nenhuma rota. Comandos novos: `esteira.ts --censo [branch]`, `linhas.ts abandonar <n>`,
`mutacoes.ts --faltando <documento>`, `hook-git.ts commit-msg <arquivo>` e `pre-push`, e
`congelar-hook.ts [--descongelar]`, todos em `tools/processo/`.

## 5. Fluxo

**(a) Commit em sessão de papel.** O `PreToolUse` continua na frente, com a mensagem de hoje. Ele passa a negar, em
sessão de papel, o comando que contém `--no-verify`, `commit -n` (ou `-n` combinado com outras letras) ou
`core.hooksPath`. Depois o git roda o `commit-msg`:

```sh
case "$CLAUDE_CODE_AGENT" in arquiteto|implementador|mesa-de-revisao|validador) ;; *) exit 0 ;; esac
exec sh "$(git rev-parse --show-toplevel)/tools/processo/hook.sh" git commit-msg "$1"
```

O `hook-git.ts` lê a mensagem do arquivo e os arquivos do índice (`git diff --cached --name-only`; com merge em curso,
o que diverge dos dois lados, como `arquivosAlterados` faz hoje). Daí aplica o mesmo `avaliarPortao`; erro de carga recusa o commit. Fora de sessão de papel o script sai antes do node, e um hook quebrado não
trava o Joaquim. O `pre-push` lê as refs da entrada padrão e recusa o push de papel para a `develop`, a `release` ou o
`main`. O merge que o `linhas.ts encontro` faz roda na sessão do Orquestrador, que não tem papel, e passa.

**(b) Quem é obrigatório.** `obrigatorios = união(marcados na tarefa, guardioesDoCaminho(arquivos do commit))`, sem
contar os arquivos de teste (`*.test.*`, `e2e/**`). Primeira tabela, que os guardiões revisam na revisão da spec:

| Caminho | Guardião |
|---|---|
| `packages/nucleo/drizzle/**`, `packages/nucleo/src/db/schema/**` | tenancy, privacy, infra |
| `**/*.repository.ts`, `**/*.controller.ts` | tenancy |
| `packages/nucleo/src/{titular,retencao,log,auditoria}/**`, `apps/api/src/privacidade/**` | privacy |
| `apps/api/src/{tutor,entrega,atividade,governanca,ia}/**`, `packages/nucleo/src/ia/**` | conformidade |
| `packages/nucleo/src/{fila,limite,redis}/**`, `apps/{worker,despachante,realtime}/src/**`, `apps/api/src/{sessao,credencial,sala}/**`, `infra/**` | infra |

O teto de três da D79 vale para o que o Arquiteto marca, e o `criar-tasks` cita esta tabela em vez de repeti-la.

**(c) O hook congelado.** O `settings.json` passa a chamar `sh "$CLAUDE_PROJECT_DIR/tools/processo/hook.sh" portao` (e
`registrar`), mantendo o `|| { …; exit 2; }`. O `hook.sh` roda `.processo/hook-congelado/hook-revisoes.ts` quando ele
existe e, senão, o da árvore. A 1.0 cria os dois; depois dela, o Orquestrador congela o andar e cada linha ao abri-la (só
enquanto o `estado.md` da X7 disser). A tarefa que fecha o hook
descongela, e o ensaio roda no hook da árvore. Os andares de outras specs não têm a pasta e seguem iguais.

**(d) O RF17.** Em `mutacoes.ts`, um arquivo de produção é um de `apps/*/src/**` ou `packages/*/src/**` que não é teste
nem `.d.ts`. Se o documento traz algum desses sem nenhum bloco ` ```mutacao ` e sem a linha
`**Sem mutação:** <motivo>`, o portão falha e não grava o carimbo. O `--faltando` olha as linhas acrescentadas contra a
base com `if`, `&&`, `||`, `??`, `? :`, `case`, `.where(` ou uma expressão regular, e trata como alcançada a linha cujo
trecho algum bloco cita. O portão só imprime a lista; quem barra é o RF17.

**(e) O RF16.** `PASTAS_DE_CODIGO` continua valendo para toda sessão. Para sessão de papel, soma-se `tools/`,
`.github/`, `eslint.config.mjs`, `.claude/settings.json` e `.claude/hooks/`. Skill, papel, regra e `docs/` continuam
documento.

**(f) Os censos e a esteira.** O `--censo` lê o JSON do relatório do Playwright, que a esteira já grava como artefato
(`relatoriosDoPlaywright`), da última execução verde da branch, e reaproveita `prazosDosCasos`. No retitulado (RF11),
quando o título não aparece no HEAD, vale o caso do HEAD cujo corpo sem o título é idêntico. O `encontro` roda
`npm run typecheck` e `npm run lint` no checkout da spec depois do merge e antes do push. Se der vermelho, desfaz o
merge (`git merge --abort` ou `reset` para o HEAD anterior) e recusa.

**(g) A limpeza do Orquestrador.** O comando do `nohup` grava `pedida`. O início de sessão com `source: clear` grava
`feita`. A vigia acorda o Orquestrador quando a `pedida` passa de 10 minutos sem uma `feita` depois dela.

**(h) A mensagem colada (RF29).** Um hook `UserPromptSubmit`: no terminal do Orquestrador, o texto que começa com
`/seguir ` e chegou como texto recebe o contexto "leia `.claude/skills/seguir/SKILL.md` e siga com esta entrada".

## 6. Isolamento

Nada lê dado de escola. O RF15 cobra o `tenancy-guardian` pelo caminho.

## 7. Dado pessoal

Nenhum campo; o log do hook leva caminho de arquivo e nome de revisor.

## 7b. Conformidade CNE

Sem IA no caminho do aluno. O RF15 cobra o `conformidade-reviewer` pelo caminho.

## 7c. Carga e falha

Fora do caminho quente do produto. As falhas que importam são do processo:

| Falha | O que acontece |
|---|---|
| O hook nativo não carrega | o commit é recusado; o Joaquim não é afetado (§5a) |
| `core.hooksPath` ausente | o início de sessão avisa e roda o `prepare`; o `PreToolUse` segue barrando |
| `gh` fora | `esteira.ts` sai 2, como hoje |
| A mutação trava | prazo de 3 × o do teste, até 10 min; recusada, o processo morto e o `flock` solto |
| Lint vermelho no encontro | a spec não anda; a linha recebe correção |

## 9. Frontend, skills e papéis

**Skills de terceiro, como aviso (RF23):**

| Skill | Decisão | Motivo |
|---|---|---|
| `frontend-design` | sai | pede ousadia estética; a pele está fechada (D80) e a regra 50 corta o resto |
| `supabase-postgres-best-practices`, `vercel-react-best-practices`, `lgpd-brasil` | ficam, com o conflito escrito no `SKILL.md` delas e reaplicado por um teste do harness depois de `npx skills update` | o resto vale |
| as outras oito | ficam | sem conflito |

Sai também a `status`, que o `estado.ts` substitui, e a frase do `CLAUDE.md` de que a identidade visual está em aberto.

**A forma do texto.** O `CLAUDE.md` fica com o produto, as seis regras, o mapa e uma linha por decisão, só com número
e título. "Conflitos já resolvidos" vai para o topo de `docs/decisoes.md`, e "Decisões em aberto" para
`docs/decisoes-em-aberto.md`. Limite da base fixa: 40.000 B.

As regras ganham `paths:`:

| Regra | `paths:` |
|---|---|
| 00 | `apps/**`, `packages/**`, `infra/**` |
| 40 | `**/*.test.ts`, `**/*.test.tsx`, `e2e/**`, `tools/**` |
| 60 | `apps/**`, `packages/**` |
| 80 | `apps/**`, `packages/nucleo/**`, `infra/**`, `.github/**` |

Mandam ler as quatro, por extenso: `criar-prd`, `criar-techspec`, `revisar-spec`, `criar-tasks`, `validar` e `retro`.

O `/seguir` fica com os passos 1, 2, 5 e 6 e um índice. Os passos 3, 4, 7, 8, 9 e 10 vão para
`.claude/skills/seguir/passos/`, lidos ao entrar em cada um. A meta é que o Orquestrador leia até 20 KB por tarefa,
contra os 41 KB de hoje. A autoconferência do `executar-task` vira até doze perguntas de uma linha no
`task-template.md`. Os incidentes, com data e origem, vão para `docs/processo-licoes.md`.

**As paradas (revisão da D79 de 23/10/2026).** Proposta de retrospectiva que muda só skill, papel ou modelo de
documento passa a ser aviso: o Arquiteto mostra e aplica depois de 30 minutos sem objeção. Ressalva menor da validação
vai para o `TODO.md` com dono e não segura o pouso (passo 7 do `/seguir` e skill `retro`).

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | `esteira.test.ts`: cancelada sobre vermelha, `concurrency` e `pull_request` lidos do `ci.yml`, censo com relatório de exemplo. `linhas.test.ts`: encontro vermelho recusado e a spec parada, `abandonar`, base de `conferir`. `mutacoes.test.ts`: o prazo, o `--faltando` e o RF17 com e sem exceção. `duracao-do-e2e.test.ts`: retitulado. `revisoes.test.ts` intacto na partição; casos novos de guardião por caminho, pastas do papel e `(mvp:)` recusado. `harness.test.ts` (§2) |
| Integração | `hook-git.int.test.ts`, contra um git de verdade num repositório temporário: as formas (`git`, `/usr/bin/git`, `env X=1 git`, `sh -c`, script, merge), com e sem `CLAUDE_CODE_AGENT`, com o node quebrado, e o push para a `develop`. `hook-portao.test.ts` estendido ao `hook.sh` |
| E2E e isolamento | não se aplicam; o ensaio do RF31 é o fim a fim |

Toda regra nova, inclusive do portão, tem bloco de mutação.

## 11. Conformidade com as regras

Sem desvio. As regras 10, 20 e 70 continuam carregando sempre, e o RF15 cobra os guardiões delas pelo caminho. A regra
40 ganha a trava do RF17. A 00 e a 80 não são tocadas: o código fica em `tools/`, fora do caminho quente.

## 12. Premissas não verificadas

- ⚠️ NÃO VERIFICADO: o Claude Code passa o `CLAUDE_CODE_AGENT` ao ambiente do Bash do papel e dos subagentes. O
  `pushDoTime` já depende disso, mas não há teste que o prove. A 1.0 prova numa sessão real antes de o hook nativo
  depender da variável
- ⚠️ NÃO VERIFICADO: a regra com `paths:` carrega quando um subagente lê o arquivo, e o glob aceita `{a,b}`. Se não
  aceitar, uma linha por padrão
- ⚠️ NÃO VERIFICADO: o `prompt` do `UserPromptSubmit` traz o texto colado já expandido. Sem isso, o RF29 fica só no
  aviso do início de sessão, como hoje
- ⚠️ NÃO VERIFICADO: o `source` do `SessionStart` distingue `clear`

## 13. Riscos técnicos

- **Um `exit 2` errado trava o time.** A defesa é a cópia congelada, o `hook-portao.test.ts` e o `Edit`, que não passa
  pelo hook
- **A união de guardiões aumenta as rodadas.** A tabela é revisada na revisão da spec e medida na X4
- **O texto curto perde instrução.** Nada sai sem destino (RF22), e o ensaio roda o `/seguir` novo

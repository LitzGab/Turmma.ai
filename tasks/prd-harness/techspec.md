# Tech Spec — Harness (X7)

**PRD:** `tasks/prd-harness/prd.md`
**Status:** rascunho (rodada 3 da revisão da spec)

Respostas do Joaquim, 23/10/2026: `core.hooksPath` pelo `prepare`; as paradas do §9; o ensaio do RF31 é o item
"(X5, RF31)" do `TODO.md`; e, na revisão da spec, RF2, RF14, RF15, RF16 e a cópia congelada fora. Anexos:
`tabela-de-guardioes.md`, `cenarios.md` (os testes) e `texto.md` (RF20 a RF25).

## 1. Resumo da abordagem

Quatro trilhas. **(1)** Testes de contrato e do harness, e o `revisoes.ts` partido só por mover. **(2)** O código das
retrospectivas (RF1 a RF11), em linhas. **(3)** O hook novo (RF14 a RF18), um comportamento por tarefa, sobre o §5(a).
**(4)** O texto e o Maestri (RF20 a RF29), por último, já descrevendo o hook novo. Fecha com o ensaio (RF31).

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `.github/workflows/ci.yml` | alterado | `concurrency` (§5f); `pull_request` para a `develop`; relatório JSON do e2e no verde; a terceira camada do RF14 |
| `tools/processo/esteira.ts` | alterado | RF2 (§5f), `--event push`, `--censo` (RF9) |
| `tools/processo/linhas.ts` | alterado | RF3 (§5f), `abandonar <n>` (RF6), base de `conferir` (RF10) |
| `tools/processo/mutacoes.ts` | alterado | RF4 (§7c), `--faltando` (RF5), RF17 (§5d) |
| `tools/processo/portao-local.ts` | alterado | RF7 e RF8, a sequência em função testável; imprime o `--faltando` e os guardiões |
| `tools/ci/duracao-do-e2e.ts` | alterado | caso retitulado (RF11) |
| `tools/ci/conferir-entregas.ts` | novo | a terceira camada do RF14 (§5a) |
| `tools/processo/revisoes.ts` | partido | `documento-de-revisao.ts`, `caducidade.ts`, `comando-git.ts`, `portao.ts`; o `revisoes.ts` só reexporta, e `estado.ts` e `esteira.ts` deixam de importá-lo (RF13); sai o `(mvp:)` (RF18) |
| `tools/processo/guardioes-por-caminho.ts` | novo | a tabela do RF15 e do RF16 |
| `tools/processo/hook-git.ts`, `tools/processo/git-hooks/` | novos | `commit-msg` e `pre-push` (RF14) |
| `tools/processo/harness/*.test.ts` | novos | um arquivo por aspecto, para correr em paralelo (RF12, RF20 a RF26, RF30) |
| `tools/processo/estado.ts`, `vigia.ts` | alterados | decisões em aberto no documento novo (RF20); limpeza e `maestri list` (RF27, RF28) |
| `tools/guardas/regras-ia.mjs` | alterado | a pasta isenta é `packages/nucleo/src/ia/adaptador-*.ts` (RF24) |
| `.claude/settings*.json`, `.claude/hooks/` | alterados | `UserPromptSubmit` (RF29); o início de sessão confere o `core.hooksPath` e grava a limpeza |
| `package.json` | alterado | `"prepare": "git config core.hooksPath tools/processo/git-hooks"` |
| `CLAUDE.md`, `.claude/rules/`, `.claude/skills/`, `.claude/agents/`, `docs/` | alterados e novos | RF20 a RF25, RF28 e o socorro do hook (`texto.md`) |

## 3. Modelo de dados

Nenhuma tabela. Fora do git: `.processo/limpeza.json` (`{ "pedida": ISO, "feita": ISO }`, nada mais). Sem IA (o §8 não se aplica).

## 4. API

Nenhuma rota. Comandos novos: `esteira.ts --censo [branch]`, `linhas.ts abandonar <n>`,
`mutacoes.ts --faltando <documento>` e `hook-git.ts commit-msg <arquivo>` e `pre-push`, em `tools/processo/`; e
`npm run ci:conferir-entregas`.

## 5. Fluxo

**(a) Uma decisão, duas entradas.** A decisão inteira do `portao` de hoje vira uma função pura em `portao.ts`,
`decidirCommit({ mensagem, arquivos, conteudoDe, raiz, papel })`: a marca, o documento, os obrigatórios (§5b), as pastas
(§5e), o `avaliarPortao` e a conferência das mutações. O `PreToolUse` a chama com a mensagem tirada do comando e o
conteúdo da árvore. Em sessão de papel, nega nos argumentos do git `--no-verify` ou abreviação aceita, `-n` em
`commit` (sozinho ou combinado) e `core.hookspath` em qualquer caixa; e as formas de mexer no ambiente (`VAR=`,
`unset`, `env -u`) com `CLAUDE_CODE_AGENT` ou `GIT_CONFIG_`. `grep` e `printenv` passam. Termo só na mensagem: a recusa
sugere `-F`. O `commit-msg`:

```sh
[ -n "$CLAUDE_CODE_AGENT" ] || exit 0
exec node "$(git rev-parse --show-toplevel)/tools/processo/hook-git.ts" commit-msg "$1"
```

O `hook-git.ts` recusa papel fora de `PAPEIS_DO_TIME` e a linha `Fora do processo:`. Lê a mensagem do arquivo, os arquivos de
`git diff --cached --name-only --no-renames` (com merge em curso, o que diverge dos dois lados, como hoje) e o conteúdo
do índice (`git show :<arquivo>`). Erro de carga recusa; fora de sessão de papel o script sai antes do node. O
`pre-push` lê as refs da entrada padrão e recusa o push de papel para `develop`, `release` ou `main`. O merge do
encontro, sem papel, passa; o de papel passa pela decisão.

**Limites declarados (RF14).** A máquina não barra `env -u CLAUDE_CODE_AGENT` ou `--no-verify` dentro de script,
`commit-tree`, `update-ref`, `rebase`, `cherry-pick`, nem o Edit em `git-hooks/` ou `.git/config`. A terceira camada é
o job `verificar`, em push de `spec/**` e `correcao/**`, com `fetch-depth: 0`: `ci:conferir-entregas` olha commit a
commit de `develop..HEAD`, com a classificação da `decidirCommit` (código de produto mais a lista do §5e), o merge por
`--remerge-diff`. Commit de código passa com `(tarefa N.0)` ou `(correção <slug>)` e a linha `Revisões:`, ou com
`Fora do processo: <motivo>` (o Joaquim); senão sai 1 com o hash. Intervalo vazio sai 0. Andar anterior à X7 fica sem hook nativo até o merge da
`develop`, e o início de sessão avisa.

**(b) Quem é obrigatório (RF15).** `obrigatorios = união(marcados, guardioesDoCaminho(arquivos))`. Código em
`apps/`, `packages/`, `e2e/` e `tools/guardas/` pede os quatro; as exceções, com motivo, e as regras de casamento estão
em `tabela-de-guardioes.md` (decisão do Joaquim na rodada 2). O teto de três da D79 vale para o que o Arquiteto marca.
O portão imprime a lista unida para a Mesa.

**(c) O hook sem cópia congelada.** Julga o hook da árvore. Toda tarefa que mexe em `tools/processo/` roda o
`hook-portao.test.ts` com o comando real do `settings.json`. Se ele quebrar, o papel conserta pelo Edit, que não passa
pelo hook, ou o Joaquim roda no terminal dele o socorro de `docs/processo-sem-maestri.md`
(`git -C <checkout> checkout origin/develop -- tools/processo .claude/settings.json`), que perde o não commitado e
não apaga os arquivos novos da branch; o conserto, ele commita fora de sessão de papel.

**(d) O RF17.** A fonte é o diff da árvore contra a base, não o documento. É produção o arquivo de `apps/*/src/**` ou
`packages/*/src/**` que não é teste nem `.d.ts`. Com produção alterada, o portão falha sem bloco ` ```mutacao ` no
documento e sem a linha `**Sem mutação:** <motivo>` (motivo vazio recusado). O documento é achado pela marca da tarefa,
não por conter bloco, e a mesma exigência vale na `decidirCommit`: carimbo de outro portão não passa. O `--faltando`
olha as linhas acrescentadas com `if`, `&&`, `||`, `??`, `? :` de valor, `case`, `.where(` ou expressão regular, fora
de teste; trata como alcançada a linha cujo texto um bloco do mesmo arquivo cita; e só imprime.

**(e) O RF16.** `PASTAS_DE_CODIGO` vale para toda sessão. Em sessão de papel somam-se `tools/`, `.github/`,
`.claude/settings*.json`, `.claude/hooks/`, `docs/aia/ouro/`, `docs/aia/ouro-retido/`, `package.json`, `compose.yaml`, `.env.example`,
`eslint.config.mjs`, `eslint-suppressions.json`, `vitest.config.ts`, `playwright.config.ts`, `tsconfig*.json`,
`knip.json`, `.gitleaks.toml` e `.size-limit.json`. Os guardiões de cada um estão na tabela. Skill, papel,
regra, AIA e o resto de `docs/` continuam documento.

**(f) Esteira, censo e encontro.**
- **`concurrency`:** em `spec/**` e `correcao/**`, o grupo é a ref, com `cancel-in-progress: true`. No `pull_request`,
  é `pr-<número>`. Em `develop`, `release`, `main` e `workflow_dispatch`, é o `run_id`, que nunca cancela nem enfileira.
  Sem `pull_request_target` nem segredo, com `permissions: contents: read`
- **Veredito (RF2):** só é `superada` a cancelada com execução mais nova na mesma branch, de evento `push`; a cancelada
  sem sucessora é vermelha e cita o job. O veredito sai da mais nova cujo código é o do HEAD; commit só de documento vale
  pelo de código, como hoje
- **Censo (RF9):** o `ci.yml` sobe só o reporter JSON de cada fatia, sem trace nem anexo, também no verde, por 7 dias.
  O `--censo` baixa as fatias da última execução verde e reaproveita `prazosDosCasos`; fatia faltando ou artefato
  expirado sai 2 e diz qual
- **Retitulado (RF11):** sem o título no HEAD, vale o caso cujo corpo sem o título é idêntico; corpo mudado, ou dois
  corpos iguais, não herdam prazo
- **Encontro (RF3):** inteiro sob `flock` em `.processo/`, relendo o quadro com a trava; o segundo espera. Tipagem e lint
  no checkout da linha, depois do `merge --no-edit` da spec e antes do `--ff-only`: ~80 s, ou ~4 min com `npm ci`
  quando o lock mudou. No vermelho: a linha volta ao commit de antes do merge, a spec não anda, sem push, linha
  ocupada, código de saída próprio, e a saída diz que a correção refaz o merge

**(g) A limpeza (RF27).** O `nohup` grava `pedida`. O início de sessão com `source: clear`, sem `CLAUDE_CODE_AGENT`, no
térreo, grava `feita`. A vigia acorda o Orquestrador quando a `pedida` passa de 10 minutos sem `feita` depois dela.

**(h) A mensagem colada (RF29).** Hook `UserPromptSubmit`, só em sessão sem `CLAUDE_CODE_AGENT`. Olha o prefixo
`/seguir ` e devolve o contexto "leia `.claude/skills/seguir/SKILL.md` e siga com esta entrada". Não grava o texto.

## 6. Isolamento

Nada lê dado de escola; o RF15 cobra o `tenancy-guardian` pelo caminho.

## 7. Dado pessoal

Nenhum campo. O log do hook leva caminho e nome de revisor; achado cita `arquivo:linha`, nunca o valor.

## 7b. Conformidade CNE

Sem IA no caminho do aluno. O RF15 e o RF16 cobram o `conformidade-reviewer`, e no `ouro`.

## 7c. Carga e falha

Fora do caminho quente. As falhas do processo:

| Falha | O que acontece |
|---|---|
| O hook nativo não carrega | commit de papel recusado; o Joaquim não é afetado (§5a) |
| `core.hooksPath` ausente | o início de sessão avisa; o `PreToolUse` segue barrando |
| O hook da árvore quebra | o socorro do §5(c) |
| `gh` fora | `esteira.ts` sai 2, como hoje |
| A mutação trava | corrida limpa medida, teto de 10 min; a mutada tem o maior entre 3 × a medida, o prazo do teste e 60 s, até 10 min. Grupo de processo próprio, SIGTERM e, 5 s depois, SIGKILL; o bloco fica `recusada`, o arquivo volta e o `flock` é solto |
| Lint vermelho no encontro | §5(f) |

## 9. Frontend, skills, regras e papéis

Sem tela. O texto (RF20 a RF25) está em `texto.md`: cada skill de terceiro (sai a `frontend-design`; cinco ficam com o
conflito na primeira linha depois do frontmatter), o destino de cada seção do `CLAUDE.md` (base fixa até 40.000 B), os
`paths:` da 00, 40, 60 e 80 (a 10, a 20 e a 70 continuam sempre carregadas, sem perder item), as contradições com o
lugar que fica, o `/seguir` partido em `passos/` e as paradas que viram aviso (D79 revista). Sai a `status`; o
`separar-achados.ts` espera o ok do Gabriel.

## 10. Testes

Os cenários, dos dois lados, estão em `cenarios.md`. Toda regra nova tem bloco de mutação. O `hook-git.int.test.ts`
roda sem o `globalSetup` do compose, e o portão o inclui quando `tools/processo/` muda. Cada checagem do harness tem
amostra quebrada e contagem mínima. Os rótulos vêm das constantes do hook e do `estado.ts`.

## 11. Conformidade com as regras

Sem desvio. A 10, a 20 e a 70 seguem sempre carregadas, cobradas pelo caminho (RF15); a 00, a 40, a 60 e a 80 ganham
`paths:`, com o RF17 na 40 e a nota da 80.5.

## 12. Premissas não verificadas

- ⚠️ NÃO VERIFICADO: o `CLAUDE_CODE_AGENT` chega ao Bash do papel e dos subagentes. A 1.0 prova numa sessão real antes
  de o hook nativo depender dele
- ⚠️ NÃO VERIFICADO: a regra com `paths:` carrega quando um subagente lê o arquivo; a saída está no §9
- ⚠️ NÃO VERIFICADO: o `prompt` do `UserPromptSubmit` traz o texto colado expandido, e o `source` do `SessionStart`
  distingue `clear`. A tarefa prova; se não valer, o RF29 e o RF27 ficam no aviso de início de sessão

## 13. Riscos técnicos

- Um `exit 2` errado trava o time: a defesa é o `hook-portao.test.ts`, o Edit e o socorro (§5c)
- Os quatro guardiões em quase toda tarefa sobem o custo: rodam juntos, e a X4 mede
- O texto curto perde instrução: nada sai sem destino (RF22), e o ensaio roda o `/seguir` novo

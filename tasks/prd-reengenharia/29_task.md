# Tarefa 29.0 — Mudar o `ouro` junto com o padrão é recusado

**Funcionalidade:** reengenharia · **Depende de:** 1.0
**Subagentes obrigatórios:** `conformidade-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** pequeno

## Objetivo

O `ouro` só muda num commit próprio, só de `docs/`, com `(ouro: …)`; commit de tarefa ou de correção que o toca deixa a
esteira vermelha.

## Contexto necessário

- `techspec.md` §7b; `onda-1b.md` "T11" (O `ouro` protegido) e §5
- `prd.md` RF12
- `.claude/rules/70-conformidade-cne.md` e `40-testes.md`
- Código: `packages/nucleo/src/ia/selo-do-ouro.test.ts` (da 1.0); `docs/aia/ouro/SELO.json`; `tools/ci/verificar.ts`;
  `.github/workflows/` (o job `verificar`, `fetch-depth: 0`)

## Subtarefas

- [ ] 29.1 — Mover o `selo-do-ouro.test.ts` para `packages/nucleo/src/conformidade/`, com a raiz por `import.meta.url`
- [ ] 29.2 — `tools/guardas/ouro-separado.ts`: lê `git log --no-renames --name-only -m --first-parent 400dc42..HEAD`;
  commit que toca `docs/aia/ouro/**` só toca `docs/` e leva `(ouro: …)`; `(tarefa` e `(correção` nunca o tocam; clone
  raso falha
- [ ] 29.3 — A guarda como etapa do `tools/ci/verificar.ts`, fora de `tools/processo/`
- [ ] 29.4 — Testes: selo no lugar novo, a guarda por marcador e por caminho, merge, arquivo movido, `400dc42`, clone
  raso, o limite declarado, a etapa

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/conformidade/selo-do-ouro.test.ts` (sai de `packages/nucleo/src/ia/`) | movido |
| `tools/guardas/ouro-separado.ts` e `ouro-separado.test.ts` | novos |
| `tools/ci/verificar.ts`, `tools/ci/scripts.test.ts` | alterados |

## Testes que provam a regra

| Cenário (o que prova) | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Um byte mudado num `ouro/*.json` reprova o selo | unidade, `selo-do-ouro.test.ts` | mudar um byte de `riscoAVida.json` |
| Arquivo a mais ou a menos na pasta reprova | unidade, idem | criar `extra.json` |
| Pasta errada é vermelho, não verde com zero arquivos | unidade, idem | um `..` a menos na raiz |
| Commit que toca o `ouro` e `conformidade/risco-a-vida.ts` reprova | unidade, `ouro-separado.test.ts` | aceitar caminho fora de `docs/` |
| Commit só de `docs/` que toca o `ouro` sem `(ouro: …)` reprova | unidade, idem | não conferir o marcador |
| Commit só de `docs/` com `(ouro: riscoAVida)` passa | unidade, idem | — falso positivo |
| `(tarefa 28.0)` que toca o `ouro`, mesmo só em `docs/`, reprova | unidade, idem | conferir `(tarefa` só com código |
| `(correção <slug>)` que toca o `ouro` reprova | unidade, idem | conferir só `(tarefa` |
| `(ouro: …)` e `(tarefa …)` na mesma mensagem reprova | unidade, idem | aceitar quando houver `(ouro:` |
| Commit de código que não toca o `ouro` passa | unidade, idem | — falso positivo |
| Apagar arquivo do `ouro` num commit de tarefa reprova | unidade, idem | ler só adicionados e modificados |
| Mover arquivo do `ouro` para fora, num commit de tarefa, reprova | unidade, idem | tirar `--no-renames` |
| Merge das linhas (`--no-ff`) com um pai que toca o `ouro` num commit de tarefa reprova | unidade, idem | tirar `-m` |
| O commit de origem (o papel do `400dc42`, sem `(ouro: …)`) não reprova: a faixa começa nele | unidade, idem | faixa a partir do primeiro commit |
| Commit com `(ouro: …)` que mexe só fora do `ouro` passa, sem exigir mais nada | unidade, idem | exigir `(ouro:` em todo commit de `docs/` |
| Clone raso falha, e não passa verde | unidade, idem | tirar a conferência de `--is-shallow-repository` |
| Limite declarado: `(ouro: …)` forjado num commit só de `docs/` passa; só o veto pega | unidade, idem | — limite declarado |
| `ci:verificar` roda a guarda e sai vermelho quando ela falha | unidade, `scripts.test.ts` | tirar a etapa de `verificar.ts` |

Veto, em toda tarefa de política (26.0 a 29.0): o `conformidade-reviewer` confere
`git log <início da tarefa>..HEAD -- docs/aia/ouro` vazio.

## Como testar

- Repositório de fixture: copie `git` e `repositorioCom` de `tools/guardas/gitleaks.int.test.ts › reprova o segredo que
  foi commitado e apagado no commit seguinte: a varredura é do histórico`, com mensagem por commit; o merge e o clone
  raso vêm de `git merge --no-ff` e `git clone --depth 1 file://…` na mesma pasta temporária. A guarda recebe o diretório
  e a origem por parâmetro, para o teste não ler o histórico real.
- Etapa: `tools/ci/scripts.test.ts › ci:verificar roda tipos, lint com guardas, gitleaks, npm audit e unidade, e sai verde
  só se todos passarem`, com `rodarScript`.
- Isolado: `npx vitest run --project unidade tools/guardas/ouro-separado.test.ts packages/nucleo/src/conformidade/selo-do-ouro.test.ts tools/ci/scripts.test.ts`.
- Armadilhas: o Implementador nunca mexe em `docs/aia/ouro/` nem no `SELO.json`; a 29.0 não toca `tools/processo/`.

## Fora do escopo desta tarefa

O guardião por caminho no hook (Etapa 9); mudar o `ouro`.

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


# Tarefa 13.0 — Função nova acima de 10/80/4 e supressão nova reprovam o lint

**Funcionalidade:** reengenharia · **Depende de:** 12.0, 97.0 (as pastas antes, pelo recorte: os caminhos deste documento são conferidos de novo antes de partir)
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O ESLint reprova função nova com complexidade acima de 10, mais de 80 linhas ou aninhamento acima de 4, e a linha de
base de hoje só encolhe (catraca).

## Contexto necessário

- `onda-1a.md` §2, "T8 — Tamanho com catraca"; `techspec.md` §13 (o risco de quem só moveu o arquivo)
- `prd.md` RF11; `.reengenharia/DECISOES.md` R37 e R39 (teste sem `max-lines-per-function`)
- `.claude/rules/40-testes.md` (o portão roda o lint)
- `eslint.config.mjs` (ESLint 10.10, os blocos por pasta) e `tools/guardas/eslint-das-guardas.ts` (`criarEslintDasGuardas`,
  a segunda passada com `allowInlineConfig: false` e `ruleFilter`)

## Subtarefas

- [ ] 13.1 — Bloco novo em `eslint.config.mjs`: produção com `complexity: 10`, `max-lines-per-function: 80` (sem branco nem comentário) e `max-depth: 4`; teste sem `max-lines-per-function`; e2e com `max-lines: 800`, tudo `error`
- [ ] 13.2 — `eslint . --suppress-all` gera `eslint-suppressions.json`; o `TETO` por regra fica no teste
- [ ] 13.3 — `criarEslintDasGuardas` ganha `applySuppressions: true` e as quatro regras no `ruleFilter`
- [ ] 13.4 — Testes: fixtures de fronteira, a segunda passada e o `catraca.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `eslint.config.mjs` | alterado |
| `eslint-suppressions.json` | novo |
| `tools/guardas/eslint-das-guardas.ts` | alterado |
| `tools/guardas/index.mjs` | alterado |
| `tools/guardas/catraca.test.ts` | novo |
| `tools/guardas/guardas.test.ts` | alterado |
| `tools/guardas/__fixtures__/tamanho/*.ts` | novo |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| Produção: complexidade 11 reprova, 10 passa | unidade | `complexity: 10`, na fronteira | `complexity: 11` |
| Produção: 81 linhas de código reprova, 80 com brancos e comentários passa | unidade | sem branco nem comentário | `skipBlankLines: false` |
| Produção: aninhamento 5 reprova, 4 passa | unidade | `max-depth: 4` | `max-depth: 5` |
| A mesma função de 81 linhas em `x.test.ts` passa | unidade | teste sem o limite (R39) | aplicar a teste |
| `e2e/x.spec.ts` com 801 linhas reprova, 800 passa | unidade | `max-lines: 800` | `max: 801` |
| As quatro regras estão em `error` | unidade | o nível é conferido | `'warn'` numa |
| `// eslint-disable-next-line complexity` sobre complexidade 11 reprova na segunda passada | unidade | o comentário não fura | tirar `complexity` do `ruleFilter` |
| `/* eslint max-depth: ["error", 9] */` não afrouxa | unidade | `allowInlineConfig: false` | `true` |
| Arquivo real suprimido passa na segunda passada | unidade | `applySuppressions: true` | `false` |
| `eslint-suppressions.json` só cita as quatro regras | unidade | a linha de base não esconde outra | aceitar `no-explicit-any` |
| A soma por regra é igual ao `TETO`: uma a mais reprova | unidade | supressão nova não entra | `toBe` → `toBeLessThanOrEqual` |
| Uma a menos sem baixar o `TETO` reprova | unidade | o `TETO` acompanha o corte | `toBe` → `toBeGreaterThanOrEqual` |
| Arquivo com mais supressões que no `git show HEAD:` reprova, com a soma igual | unidade | a troca no mesmo commit não se esconde | comparar só a soma |
| Arquivo ausente no HEAD com supressão reprova | unidade | arquivo novo não nasce suprimido | ausente = sem limite |
| Função encurtada sem `--prune-suppressions`: o lint reprova a supressão sem uso | unidade | quem corta poda na mesma tarefa | `--pass-on-unpruned-suppressions` |
| Repositório real: `npm run lint` verde com a linha de base | unidade | a catraca nasce sem quebrar nada | — |

## Como testar

- A fronteira: copie `tools/guardas/guardas.test.ts › guarda de espera do serviço do compose › reprova subir serviço e
  medir sem esperar, e deixa passar quem espera ou usa --wait`, com `lintar(eslint, fixture, caminhoSimulado)` e as marcas
  `reprova: <regra>` na linha da fixture; o caminho simulado decide produção, teste ou e2e.
- A segunda passada: `guardas.test.ts › guarda desligada por comentário › a passada sem comentários do npm run lint ainda
  pega a violação: %s`, com `criarEslintDasGuardas()`.
- O `git show HEAD:`: `spawnSync('git', ['show', 'HEAD:eslint-suppressions.json'])`, com `raizRepositorio`.
- Isolado: `npx vitest run --project unidade tools/guardas/catraca.test.ts tools/guardas/guardas.test.ts`.
- Armadilhas: na esteira o HEAD é o próprio commit, e a comparação por arquivo passa sempre; diga no documento que ela vale
  no portão, ou use o `merge-base` com a `develop`. Arquivo só movido aparece novo no HEAD: escreva o caso e o resultado
  escolhido.

## Fora do escopo desta tarefa

Cortar as funções da linha de base (cada corte é de quem mexe no arquivo); as camadas (12.0).

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


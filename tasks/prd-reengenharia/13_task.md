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

- [x] 13.1 — Bloco novo em `eslint.config.mjs`: produção com `complexity: 10`, `max-lines-per-function: 80` (sem branco nem comentário) e `max-depth: 4`; teste sem `max-lines-per-function`; e2e com `max-lines: 800`, tudo `error`
- [x] 13.2 — `eslint . --suppress-all` gera `eslint-suppressions.json`; o `TETO` por regra fica no teste
- [x] 13.3 — `criarEslintDasGuardas` ganha `applySuppressions: true` e as quatro regras no `ruleFilter`
- [x] 13.4 — Testes: fixtures de fronteira, a segunda passada e o `catraca.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `eslint.config.mjs` | alterado |
| `eslint-suppressions.json` | novo |
| `tools/guardas/eslint-das-guardas.ts` | alterado |
| `tools/guardas/index.mjs` | alterado |
| `tools/guardas/catraca.ts` | novo (a conferência; `catraca.test.ts` a chama) |
| `tasks/prd-reengenharia/onda-1a.md` | alterado ("Como ficou (13.0)") |
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
| A segunda passada leva **quatro** regras (`REGRAS_DE_TAMANHO`: `complexity`, `max-lines-per-function`, `max-depth`, `max-lines`), e não as três do texto da T8 | O `max-lines: 800` do spec de e2e também não pode ser furado por `eslint-disable`; a tabela da tarefa já dizia "as quatro regras" | `onda-1a.md` §2, T8 e "Como ficou (13.0)" |
| A conferência da catraca mora em `tools/guardas/catraca.ts` (arquivo novo), e `catraca.test.ts` a chama | A mutação "comparar só a soma" precisa cair em código de produção: num teste que só confere a si mesmo ela não deixaria nada vermelho | `onda-1a.md` §2, T8, "Como ficou (13.0)" |
| Arquivo movido com `git mv` herda a supressão do caminho antigo (`git diff --find-renames HEAD`); o `mv` sem `git add` reprova como arquivo novo | A "armadilha" da tarefa pede o caso e o resultado escolhido: sem isso, toda tarefa que move uma pasta reprovaria a si mesma | `onda-1a.md` §2, T8, "Como ficou (13.0)" |
| A comparação com o `git show HEAD:` vale no portão da tarefa; na esteira o HEAD é o próprio commit e só a soma contra o `TETO` segura. Sem a base no HEAD (o commit que a cria), só a soma e as regras valem | A armadilha 1 da tarefa; o `merge-base` com a `develop` fica fora porque o checkout da esteira é raso | `onda-1a.md` §2, T8, "Como ficou (13.0)" |
| `max-lines-per-function` sai também em `**/test/**/*.ts` e `e2e/**/*.ts`, não só em `*.test.*` e `*.spec.ts` | Os ajudantes de teste (`apps/api/test/`, `e2e/__fixtures__/`) montam `describe`/fixture longa por desenho (R39: "teste") | `onda-1a.md` §2, T8, "Como ficou (13.0)" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › na produção, a fronteira reprova só o que passa do limite
- complexity: ['error', 10],
+ complexity: ['error', 11],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › na produção, a fronteira reprova só o que passa do limite
- max: 80,
+ max: 81,
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › na produção, a fronteira reprova só o que passa do limite
- skipBlankLines: true
+ skipBlankLines: false
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › na produção, a fronteira reprova só o que passa do limite
- skipComments: true
+ skipComments: false
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › na produção, a fronteira reprova só o que passa do limite
- 'max-depth': ['error', 4],
+ 'max-depth': ['error', 5],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › as quatro estão em error onde valem
- complexity: ['error', 10],
+ complexity: ['warn', 10],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › as quatro estão em error onde valem
- 'max-lines-per-function': ['error', {
+ 'max-lines-per-function': ['warn', {
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › as quatro estão em error onde valem
- 'max-depth': ['error', 4],
+ 'max-depth': ['warn', 4],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › as quatro estão em error onde valem
- 'max-lines': ['error', 800]
+ 'max-lines': ['warn', 800]
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › o e2e tem o teto de 800 linhas por spec
- ['error', 800]
+ ['error', 801]
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › o e2e tem o teto de 800 linhas por spec
- files: ['e2e/**/*.spec.ts'],
+ files: ['**/*.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › na produção, a fronteira reprova só o que passa do limite
- files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
+ files: ['apps/**/*.{ts,tsx}'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › o limite de complexidade vale também no JavaScript
- files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
+ files: ['**/*.{ts,mts,cts,tsx}'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › o limite de linhas da função não vale
- rules: { 'max-lines-per-function': 'off' },
+ rules: {},
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › o limite de linhas da função não vale
- files: [...ARQUIVOS_DE_TESTE, '**/test/**/*.ts', 'e2e/**/*.ts'],
+ files: ['**/test/**/*.ts', 'e2e/**/*.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › o limite de linhas da função não vale
- files: [...ARQUIVOS_DE_TESTE, '**/test/**/*.ts', 'e2e/**/*.ts'],
+ files: [...ARQUIVOS_DE_TESTE, 'e2e/**/*.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › o limite de linhas da função não vale
- files: [...ARQUIVOS_DE_TESTE, '**/test/**/*.ts', 'e2e/**/*.ts'],
+ files: [...ARQUIVOS_DE_TESTE, '**/test/**/*.ts'],
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › só esconde a violação do ESLint comum
- ['complexity', 'max-lines-per-function', 'max-depth', 'max-lines']
+ ['max-lines-per-function', 'max-depth', 'max-lines']
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › só esconde a violação do ESLint comum
- ['complexity', 'max-lines-per-function', 'max-depth', 'max-lines']
+ ['complexity', 'max-depth', 'max-lines']
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › só esconde a violação do ESLint comum
- ['complexity', 'max-lines-per-function', 'max-depth', 'max-lines']
+ ['complexity', 'max-lines-per-function', 'max-lines']
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › não esconde o teto de linhas do spec do e2e
- ['complexity', 'max-lines-per-function', 'max-depth', 'max-lines']
+ ['complexity', 'max-lines-per-function', 'max-depth']
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › só esconde a violação do ESLint comum
- ...REGRAS_DE_TAMANHO,
```

```mutacao
arquivo: tools/guardas/eslint-das-guardas.ts
teste: tools/guardas/guardas.test.ts › a função da linha de base passa na passada sem comentários
- applySuppressions: true,
+ applySuppressions: false,
```

```mutacao
arquivo: tools/guardas/eslint-das-guardas.ts
teste: tools/guardas/guardas.test.ts › afrouxa o ESLint comum
- allowInlineConfig: false,
+ allowInlineConfig: true,
```

```mutacao
arquivo: package.json
teste: tools/guardas/catraca.test.ts › função encurtada sem podar a linha de base
- "lint": "eslint . --max-warnings=0 &&
+ "lint": "eslint . --max-warnings=0 --pass-on-unpruned-suppressions &&
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › cita só as quatro regras de tamanho
- (soma[regra] ?? 0) + count
+ (soma[regra] ?? 0) + 1
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › a regra que sumiu da base
- [...new Set([...Object.keys(teto), ...Object.keys(soma)])]
+ [...new Set([...Object.keys(soma)])]
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › a regra que sumiu da base
- [...new Set([...Object.keys(teto), ...Object.keys(soma)])]
+ [...new Set([...Object.keys(teto)])]
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › uma supressão a menos
- tem === pode ? []
+ tem <= pode ? []
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › uma supressão a mais
- tem === pode ? []
+ tem >= pode ? []
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › regra que não é de tamanho
- .filter((regra) => !REGRAS_DE_TAMANHO.includes(regra))
+ .filter((regra) => !REGRAS_DE_TAMANHO.includes(regra) && regra !== '@typescript-eslint/no-explicit-any')
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › troca no mesmo commit
- ...(doHead === undefined ? [] : arquivosQueGanharam(atual, doHead, renomeadosDe)),
+ ...[],
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › sem linha de base no HEAD
- ...(doHead === undefined ? [] : arquivosQueGanharam(atual, doHead, renomeadosDe)),
+ ...arquivosQueGanharam(atual, doHead ?? {}, renomeadosDe),
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › a base igual ao TETO e ao HEAD passa
- if (count <= tinha) return []
+ if (count < tinha) return []
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › arquivo ausente no HEAD
- antes?.[regra]?.count ?? 0
+ antes?.[regra]?.count ?? Infinity
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › arquivo ausente no HEAD
- [antes === undefined ?
+ [false ?
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › arquivo movido leva a supressão
- renomeadosDe.get(arquivo) ?? arquivo
+ arquivo
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › a base igual ao TETO e ao HEAD passa
- renomeadosDe = new Map() }
+ renomeadosDe }
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › sem o arquivo no HEAD, a leitura é undefined
- as Supressoes) : undefined
+ as Supressoes) : {}
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › git mv é achado como rename
- '--find-renames', 'HEAD']
+ 'HEAD']
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › git mv é achado como rename
- '--find-renames', 'HEAD']
+ '--find-renames']
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › git mv é achado como rename
- if (novo !== '') renomeados.set(novo, antigo)
+ renomeados.set(novo, antigo)
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › sem o arquivo no HEAD, a leitura é undefined
- 'HEAD:eslint-suppressions.json'
+ ':eslint-suppressions.json'
```

```mutacao
arquivo: tools/guardas/catraca.ts
teste: tools/guardas/catraca.test.ts › git mv é achado como rename
- ['diff', '--name-status', '--find-renames', 'HEAD']
+ ['diff', '--find-renames', 'HEAD']
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) e test-engineer (1ª) | `catraca.test.ts` roda `npm run lint` inteiro dentro da unidade (33 s, prazo de 240 s); o lint roda duas vezes e pode ficar vermelho se outro teste gravar arquivo no repositório. Mover o teste para fora da unidade | Recusada: o caso "Repositório real: `npm run lint` verde com a linha de base" está na tabela de testes da tarefa, e mover o teste muda a tabela. Se a esteira mostrar intermitência, vira `/corrigir` |
| revisor-geral (1ª) | Mesma conta do §13 do `techspec.md` (procedimento de quem move arquivo) | `techspec.md` não é arquivo desta tarefa; o procedimento fica em `onda-1a.md` (item 4 da ordem) e a tarefa de onda 2 que mover pasta cita-o |
| revisor-geral (1ª) | `renomeadosDesdeOHead` não confere `status` nem `error` do `spawnSync`: sem git no PATH quebra com `TypeError` | Recusada: git é pré-requisito de todo o repositório e o `TypeError` já reprova o portão; mensagem melhor não vale cláusula nova com teste e mutação nesta tarefa |
| revisor-geral (2ª) | O campo `teste:` da mutação de `'HEAD:eslint-suppressions.json'` cita só o começo do nome do caso; citar o nome inteiro evita que valha para outro caso que comece igual | Recusada: não há outro caso que comece igual no arquivo, e o `-t` de `mutacoes.ts` achou o teste (carimbo válido) |
| test-engineer (2ª) | Separar em dois `it` o caso "sem o arquivo no HEAD, a leitura é undefined" (repositório sem HEAD, e HEAD diferente do índice) | Recusada: a tabela de testes da tarefa tem as duas leituras num cenário só, e o `-t` da mutação pega o caso inteiro |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 23:22:44 | 2026-10-22 23:24:43 | `revisor-geral` | 1 | APROVADO | a11ce2bb9b38dd91d |
| 2026-10-22 23:22:42 | 2026-10-22 23:25:37 | `test-engineer` | 1 | REPROVADO | a5f6a5188e4d29492 |
| 2026-10-22 23:32:44 | 2026-10-22 23:33:02 | `revisor-geral` | 2 | APROVADO | a24307dc4bee0afd6 |
| 2026-10-22 23:32:40 | 2026-10-22 23:33:05 | `test-engineer` | 2 | APROVADO | a13525beddaf6b2fa |

# Tarefa 4.0 — O censo do prazo do e2e e o caso retitulado

**Funcionalidade:** harness (X7) · **Depende de:** 3.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`
**Porte:** pequeno

## Objetivo

`node tools/processo/esteira.ts --censo [branch]` lista os casos de e2e acima de dois terços do prazo na última execução
verde da branch, a partir do relatório JSON que cada fatia passa a publicar; e a régua de duração acha o prazo de um
caso cujo título mudou e o corpo não.

## Contexto necessário

- `techspec.md` §4 (o comando) e §5(f), itens **Censo (RF9)** e **Retitulado (RF11)**
- `prd.md` RF9, RF11
- `cenarios.md` seção A, **RF9** e **RF11**
- `.claude/rules/20-lgpd-menores.md` item 17 (o dado do e2e é sintético) e `.claude/rules/80-infra-e-carga.md`
- Código: `.github/workflows/ci.yml`, job `e2e` (o passo de `upload-artifact` do traço, que é só na falha);
  `tools/ci/duracao-do-e2e.ts` (`casosMedidos`, `prazosDosCasos`, `prazosDoHead`, `prazoContado`,
  `relatoriosDoPlaywright`); `tools/ci/e2e.ts` (como a fatia chega ao Playwright)

## Subtarefas

- [x] 4.1 — `ci.yml`: cada fatia grava o reporter JSON e o sobe como artefato `censo-do-e2e-<fatia>`, também no verde,
  com `retention-days: 7`, só o arquivo JSON (sem `test-results/`, trace nem anexo)
- [x] 4.2 — `esteira.ts --censo [branch]`: acha a última execução verde da branch, baixa as fatias (`gh run download`),
  lê com `casosMedidos` e lista o caso acima de 2/3 do prazo, com fatia e prazo; fatia faltando ou artefato expirado
  sai 2 dizendo qual
- [x] 4.3 — `duracao-do-e2e.ts`: sem o título no HEAD, `prazosDoHead` dá ao caso o prazo do caso cujo corpo sem o
  título é idêntico; corpo mudado, ou dois corpos iguais, não herdam
- [x] 4.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.github/workflows/ci.yml` | alterado (job `e2e`) |
| `tools/processo/esteira.ts` | alterado |
| `tools/processo/esteira.test.ts` | alterado |
| `tools/processo/__fixtures__/esteira/` | alterado (relatórios de fatia) |
| `tools/ci/esteira.test.ts` | alterado |
| `tools/ci/duracao-do-e2e.ts` | alterado |
| `tools/ci/duracao-do-e2e.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF9: caso a 70% do prazo numa fatia | unidade | listado, com fatia e prazo |
| RF9: caso a 60% | unidade | não listado |
| RF9: fatia faltando | unidade | sai 2, dizendo qual |
| RF9: artefato expirado | unidade | sai 2, dizendo qual |
| RF9: vermelha mais nova que a verde | unidade | o censo lê a verde |
| RF9: o `ci.yml` sobe só o JSON, também no verde, por 7 dias, sem `test-results/` | unidade | nada além do relatório vai para o artefato público |
| RF11: título novo, corpo idêntico ao do HEAD com `test.slow()` | unidade | herda 90 s |
| RF11: título novo, corpo mudado | unidade | sem prazo herdado |
| RF11: dois corpos iguais no HEAD | unidade | nenhum herda |

## Como testar

- RF9 no YAML: copiar `tools/ci/esteira.test.ts › esteira do GitHub (.github/workflows/ci.yml) › o e2e publica o traço da falha, só quando falha e por prazo curto: sem isso o vermelho fica indiagnosticável`, e ajustar `nenhum outro job publica artefato…` para aceitar o artefato novo.
- RF9 no `esteira.ts`: o download do `gh` é injetado; o relatório de exemplo segue o formato que `casosMedidos` já lê em `duracao-do-e2e.test.ts › casosMedidos: lê o relatório do repórter json do Playwright`.
- RF11: copiar `tools/ci/duracao-do-e2e.test.ts › no repositório: o diff do git decide qual caso é alterado › o caso movido para um spec novo leva o prazo que tinha no HEAD, e o test.slow() posto agora num caso que o HEAD não tinha não conta`.
- Rodar: `npx vitest run --project unidade tools/processo/esteira.test.ts tools/ci/esteira.test.ts tools/ci/duracao-do-e2e.test.ts`.

## Fora do escopo desta tarefa

Quando o Orquestrador roda o censo e abre correção (texto do `/seguir`, 17.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O censo lê o prazo do próprio relatório (`casosMedidos`) e não reaproveita `prazosDosCasos` | o relatório já traz o `timeout` que o Playwright deu ao caso, com `slow` e `setTimeout` aplicados; `prazosDosCasos` lê o fonte do HEAD, que não é o commit da execução | `techspec.md` §5(f) Censo (RF9); `cenarios.md` RF9 |
| O `--censo` sai 0 sem caso, 1 com a lista e 2 quando não há o que ler; nenhuma fatia é lida se uma falta ou expirou | a spec só dizia o 2; sem o 1 o Orquestrador teria de ler o texto para saber se abre correção, e lista de parte da suíte passaria pela suíte inteira | `techspec.md` §5(f) Censo (RF9); `cenarios.md` RF9 |
| O passo do artefato roda em `success() \|\| failure()` com `overwrite: true`, e o passo do e2e ganha a `env` `EDUCA_RELATORIO_DO_E2E: censo-do-e2e.json`, a única do YAML | sem `success()` a fatia verde não publica; o cancelado por prazo não termina o relatório; reexecutar a fatia vermelha que passa recusaria o nome repetido; o repórter só liga com a variável, e o teste de "sem segredo nem ambiente" passa a aceitar essa e só essa | `techspec.md` §5(f) Censo (RF9); `cenarios.md` RF9 |
| O título novo herda só se o corpo é o único no HEAD e o único na árvore (o corpo copiado, com o título velho ainda lá, não herda) | sem isso, copiar um caso lento com `test.slow()` dava os 90 s ao caso copiado, a saída mais curta para escapar da régua | `techspec.md` §5(f) Retitulado (RF11); `cenarios.md` RF11 |

## Mutações

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › exatamente dois terços
-return caso.duracaoMs * 3 > caso.prazoMs * 2
+return caso.duracaoMs * 3 >= caso.prazoMs * 2
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › o caso a 70% do prazo
-.flatMap(({ fatia, relatorio }) => casosMedidos(relatorio).filter(acimaDeDoisTercos).map((caso) => ({ ...caso, fatia })))
+.flatMap(({ fatia, relatorio }) => casosMedidos(relatorio).map((caso) => ({ ...caso, fatia })))
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a lista vem do caso mais perto
-.sort((a, b) => b.duracaoMs / b.prazoMs - a.duracaoMs / a.prazoMs)
+.sort((a, b) => a.duracaoMs / a.prazoMs - b.duracaoMs / b.prazoMs)
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › com uma vermelha mais nova
-return execucoes.filter((execucao) => execucao.estado === 'verde').sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))[0]
+return execucoes.filter((execucao) => execucao.estado !== 'rodando').sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))[0]
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › com uma vermelha mais nova
-return execucoes.filter((execucao) => execucao.estado === 'verde').sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))[0]
+return execucoes.filter((execucao) => execucao.estado === 'verde').sort((a, b) => a.criadaEm.localeCompare(b.criadaEm))[0]
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › fatia sem artefato
-if (artefato === undefined) faltando.push(fatia)
+if (artefato === undefined) continue
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › artefato expirado
 if (artefato === undefined) faltando.push(fatia)
-else if (artefato.expired) expiradas.push(fatia)
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › o artefato de outro nome
-const artefato = artefatos.find((candidato) => candidato.name === nomeDoArtefatoDaFatia(fatia))
+const artefato = artefatos.find((candidato) => candidato.name.endsWith(String(fatia)))
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › o relatório de uma fatia gravado pela esteira
-throw new Error(`o relatório da fatia ${String(fatia)} não é um JSON legível`)
+throw new Error('relatório ilegível')
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › sem nenhuma verde
-if (execucao === undefined) return { tipo: 'sem-verde' }
+if (execucao === undefined) throw new Error('sem verde')
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › artefato expirado
-if (faltando.length > 0 || expiradas.length > 0) return { tipo: 'incompleto', execucao, faltando, expiradas }
+if (faltando.length > 0) return { tipo: 'incompleto', execucao, faltando, expiradas }
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › fatia sem artefato
-if (faltando.length > 0 || expiradas.length > 0) return { tipo: 'incompleto', execucao, faltando, expiradas }
+if (expiradas.length > 0) return { tipo: 'incompleto', execucao, faltando, expiradas }
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › sem nenhuma verde
-if (censo.tipo !== 'lista') return 2
+if (censo.tipo !== 'lista') return 1
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a lista vem do caso mais perto
-return censo.casos.length === 0 ? 0 : 1
+return 1
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › sem nenhuma verde
-if (censo.tipo === 'sem-verde') return `censo do e2e de ${branch}: nenhuma execução verde da esteira para ler.`
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › artefato expirado
-const faltando = censo.faltando.length > 0 ? ` Fatia(s) sem artefato: ${censo.faltando.join(', ')}.` : ''
+const faltando =  ` Fatia(s) sem artefato: ${censo.faltando.join(', ')}.`
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › fatia sem artefato
-const expiradas = censo.expiradas.length > 0 ? ` Fatia(s) com artefato expirado: ${censo.expiradas.join(', ')}.` : ''
+const expiradas =  ` Fatia(s) com artefato expirado: ${censo.expiradas.join(', ')}.`
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a lista vem do caso mais perto
-if (censo.casos.length === 0) return `censo do e2e de ${branch}, ${alvo}: nenhum caso acima de dois terços do prazo.`
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a branch do censo
-return seguinte === undefined || seguinte.startsWith('--') ? atual : seguinte
+return seguinte === undefined ? atual : seguinte
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a branch do censo
-return seguinte === undefined || seguinte.startsWith('--') ? atual : seguinte
+return seguinte.startsWith('--') ? atual : seguinte
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › o download traz o relatório
-rmSync(pasta, { recursive: true, force: true })
+void pasta
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › o que se pergunta ao GitHub
-return ['run', 'download', String(execucao), '--name', nomeDoArtefatoDaFatia(fatia), '--dir', pasta]
+return ['run', 'download', String(execucao), '--name', nomeDoArtefatoDaFatia(fatia), '--output', pasta]
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › o que se pergunta ao GitHub
-return ['api', `repos/{owner}/{repo}/actions/runs/${String(execucao)}/artifacts?per_page=100`]
+return ['api', `repos/{owner}/{repo}/actions/runs/${String(execucao)}/artifacts`]
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › o que se pergunta ao GitHub
-return (JSON.parse(saida) as { artifacts: ArtefatoDoGh[] }).artifacts.map(({ name, expired }) => ({ name, expired }))
+return (JSON.parse(saida) as { artifacts: ArtefatoDoGh[] }).artifacts.map(({ name }) => ({ name, expired: false }))
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/ci/esteira.test.ts › o relatório do censo sobe também na execução verde
-export const FATIAS_DO_E2E = [1, 2, 3, 4, 5, 6, 7] as const
+export const FATIAS_DO_E2E = [1, 2, 3, 4, 5, 6] as const
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › o que se pergunta ao GitHub
-return `${PREFIXO_DO_ARTEFATO_DO_CENSO}${String(fatia)}`
+return `${PREFIXO_DO_ARTEFATO_DO_CENSO}0${String(fatia)}`
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê a árvore como ela está
-.filter((arquivo) => arquivo.endsWith('.spec.ts') && existsSync(join(raiz, arquivo)))
+.filter((arquivo) => existsSync(join(raiz, arquivo)))
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê a árvore como ela está
-.filter((arquivo) => arquivo.endsWith('.spec.ts') && existsSync(join(raiz, arquivo)))
+.filter((arquivo) => arquivo.endsWith('.spec.ts'))
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê a árvore como ela está
-const arquivos = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'e2e/'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
+const arquivos = execFileSync('git', ['ls-files', '--cached', '--exclude-standard', '--', 'e2e/'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › título novo e corpo idêntico
-const arquivos = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'e2e/'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
+const arquivos = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'e2e/'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê a árvore como ela está
-const arquivos = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'e2e/'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
+const arquivos = execFileSync('git', ['ls-files', '--cached', '--others', '--', 'e2e/'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › título novo e corpo idêntico
-for (const [titulo, prazoMs] of prazosDosRetitulados(doHead, casosDaArvore(raiz))) prazos.set(titulo, prazoMs)
+for (const [titulo, prazoMs] of [] as [string, number][]) prazos.set(titulo, prazoMs)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › prazosDoHead lê o prazo de cada título
-if (titulosDoHead.has(novo.titulo)) continue
+
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › título novo e corpo mudado
-if (velho === undefined || outrosVelhos.length > 0 || iguaisNaArvore.length !== 1) continue
+if (outrosVelhos.length > 0 || iguaisNaArvore.length !== 1) continue
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › dois corpos iguais no HEAD
-if (velho === undefined || outrosVelhos.length > 0 || iguaisNaArvore.length !== 1) continue
+if (velho === undefined || iguaisNaArvore.length !== 1) continue
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › o corpo copiado
-if (velho === undefined || outrosVelhos.length > 0 || iguaisNaArvore.length !== 1) continue
+if (velho === undefined || outrosVelhos.length > 0) continue
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › título novo e corpo idêntico
-herdados.set(novo.titulo, velho.prazoMs)
+herdados.set(novo.titulo, 30_000)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/esteira.test.ts › o e2e publica o relatório do censo, também no verde
-export const ARQUIVO_DO_CENSO_DO_E2E = 'censo-do-e2e.json'
+export const ARQUIVO_DO_CENSO_DO_E2E = 'outro.json'
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/esteira.test.ts › o e2e publica o relatório do censo, também no verde
-export const PREFIXO_DO_ARTEFATO_DO_CENSO = 'censo-do-e2e-'
+export const PREFIXO_DO_ARTEFATO_DO_CENSO = 'outro-'
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o e2e publica o relatório do censo, também no verde
 name: censo-do-e2e-${{ matrix.fatia }}
-path: censo-do-e2e.json
+path: test-results/
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o e2e publica o relatório do censo, também no verde
 path: censo-do-e2e.json
-retention-days: 7
+retention-days: 30
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o e2e publica o relatório do censo, também no verde
 path: censo-do-e2e.json
 retention-days: 7
-overwrite: true
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o relatório do censo sobe também na execução verde
-- if: success() || failure()
+- if: failure()
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o relatório do censo sobe também na execução verde
-- if: success() || failure()
+- if: success() || failure() || cancelled()
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o relatório do censo sobe também na execução verde
 - run: npm run ci:e2e -- --shard=${{ matrix.fatia }}/7
-env:
-EDUCA_RELATORIO_DO_E2E: censo-do-e2e.json
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › não usa segredo, variável do repositório nem ambiente declarado no YAML
-- run: npm run ci:infra
+- { run: npm run ci:infra, env: { EDUCA_RELATORIO_DO_E2E: censo-do-e2e.json } }
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › com uma vermelha mais nova
-return { tipo: 'lista', execucao, casos: casosDoCenso(FATIAS_DO_E2E.map((fatia) => ({ fatia, relatorio: relatorioDe(execucao.id, fatia) }))) }
+return { tipo: 'lista', execucao, casos: casosDoCenso(FATIAS_DO_E2E.map((fatia) => ({ fatia, relatorio: relatorioDe(execucoes[0]?.id ?? execucao.id, fatia) }))) }
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › com uma vermelha mais nova
-return { tipo: 'lista', execucao, casos: casosDoCenso(FATIAS_DO_E2E.map((fatia) => ({ fatia, relatorio: relatorioDe(execucao.id, fatia) }))) }
+return { tipo: 'lista', execucao, casos: casosDoCenso(FATIAS_DO_E2E.filter((fatia) => fatia !== 7).map((fatia) => ({ fatia, relatorio: relatorioDe(execucao.id, fatia) }))) }
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › as pontas em branco não mudam o corpo
-casos.push({ titulo, prazoMs, corpo: doCaso.trim() })
+casos.push({ titulo, prazoMs, corpo: doCaso })
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › só mudar um comentário do corpo conta como corpo idêntico
-const texto = semComentarios(textoBruto)
+const texto = textoBruto
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o job e2e publica exatamente dois artefatos
-- if: success() || failure()
+- { if: always(), uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a, with: { name: terceiro, path: test-results/ } }
+- if: success() || failure()
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o relatório do censo sobe também na execução verde
-- if: success() || failure()
+- if: success()
```

```mutacao
arquivo: e2e/casca-publica.spec.ts
teste: tools/ci/esteira.test.ts › nenhum arquivo de e2e/ anexa corpo ao resultado
-import type { Locator, Page } from '@playwright/test'
+import type { Locator, Page, TestInfo } from '@playwright/test'
+export const anexar = (testInfo: TestInfo) => testInfo.attach('corpo', { body: 'x' })
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | "as execuções verdes anteriores a esta mudança não têm artefato de censo. O primeiro `--censo` de cada branch vai sair com 2 até a esteira rodar de novo… convém registrar o caso no texto dele [`/seguir`]" | Tarefa 17.0: o texto do `/seguir` está em "Fora do escopo desta tarefa" do `4_task.md` |
| privacy-guardian (1ª) | Corrigir também o 4.1 de `tasks/prd-harness/4_task.md` | Recusada: o 4.1 é critério de aceite e diz quais arquivos sobem ("só o arquivo JSON (sem test-results/, trace nem anexo)"), o que é verdade. A frase imprecisa está nos comentários, que o item 5 corrige |
| test-engineer (1ª) | "vale o `privacy-guardian` confirmar que o e2e não anexa corpo nem imprime segredo" | Feita nesta rodada: o `privacy-guardian` aprovou e a conferência virou o item 10 |
| test-engineer (1ª) | "A ligação do `--censo` na linha de comando (`esteira.ts:374-387`) não tem teste. Ela segue o padrão que já existia, e o `catch` sai 2, o que está correto." | Recusada: o próprio revisor a diz correta; o argumento da branch tem mutações em `a branch do censo` |
| privacy-guardian (2ª) | "O teste de anexo procura só `.attach(` e só em `e2e/**/*.ts`. Um `console.log` num spec, ou um `page.on('console')` que repasse o console do navegador, cairia em `stdout` dentro do artefato público… vale estender a mesma guarda a `console.` em `e2e/`." | Recusada nesta tarefa: hoje nenhum `console.` aparece em `e2e/`; a garantia declarada é o dado sintético (regra 20, item 17). Fica para quando o e2e usar dado que não seja montado na hora |
| privacy-guardian (2ª) | "Quando o staging (D31) ou um e2e contra ambiente com dado real existir, o upload do censo em PR público tem de ser revisto antes. Vale registrar isso no `TODO.md` do portão da primeira escola real." | `TODO.md`, no portão da primeira escola real |
| test-engineer (2ª) | "a busca por `/\.attach\(/` não pega `testInfo.attachments.push({ name, body })`, que também põe o corpo dentro do relatório JSON. Vale acrescentar `attachments.push` à expressão." | `TODO.md`, junto da guarda do anexo (mesmo destino do item acima e da recomendação do `revisor-geral`): hoje nenhum spec faz isso |
| revisor-geral (2ª) | "Dá para escapar do teste dos anexos (`tools/ci/esteira.test.ts:410-416`). A busca procura só o texto `.attach(`, então `testInfo['attach'](...)` ou um helper fora de `e2e/` chamado pelos specs passaria. Não bloqueia." | `TODO.md`, junto da guarda do anexo: a guarda por texto não fecha todas as formas, e a garantia principal continua sendo o dado sintético |
| test-engineer (2ª) | "O caso do `.trim()` cobre só a ponta final do último caso do spec. A linha em branco antes do próximo `test(` num caso do meio também passa pelo `.trim()`… seria um caso extra, sem bloco novo." | Recusada: o próprio revisor diz que a mutação já prova a cláusula |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 18:06:55 | 2026-10-23 18:07:33 | `infra-guardian` | 1 | APROVADO | a2b0a6020355c509c |
| 2026-10-23 18:06:57 | 2026-10-23 18:07:33 | `privacy-guardian` | 1 | APROVADO | a624fbd68c55ee5c5 |
| 2026-10-23 18:07:00 | 2026-10-23 18:08:07 | `revisor-geral` | 1 | APROVADO | a08394ce048d98f9a |
| 2026-10-23 18:06:58 | 2026-10-23 18:09:04 | `test-engineer` | 1 | REPROVADO | a3c7aa516424d24d4 |
| 2026-10-23 18:17:52 | 2026-10-23 18:18:17 | `infra-guardian` | 2 | APROVADO | a0587abda0306fc93 |
| 2026-10-23 18:17:56 | 2026-10-23 18:18:19 | `privacy-guardian` | 2 | APROVADO | abd6f68c7b624456d |
| 2026-10-23 18:18:07 | 2026-10-23 18:18:35 | `revisor-geral` | 2 | APROVADO | a3164af2cebb330d1 |
| 2026-10-23 18:18:02 | 2026-10-23 18:19:08 | `test-engineer` | 2 | APROVADO | afd990d24a77e6f1a |

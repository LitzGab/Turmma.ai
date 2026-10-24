# Tarefa 14.0 — Código de processo exige revisão, e o `(mvp:)` sai

**Funcionalidade:** harness (X7) · **Depende de:** 13.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `conformidade-reviewer`
**Porte:** grande

## Objetivo

Em sessão de papel, commit em `tools/`, `.github/`, `.claude/settings*.json`, `.claude/hooks/`, `docs/aia/ouro*/`,
`package.json`, `compose.yaml`, `.env.example` ou numa configuração do portão passa a exigir tarefa ou correção, com
`revisor-geral`, `test-engineer` e os guardiões da tabela; e o caminho `(mvp:)` sai do hook.

## Contexto necessário

- `techspec.md` §5(e)
- `prd.md` RF16, RF18
- `tabela-de-guardioes.md`, seção **Fora do código de produto (RF16, só em sessão de papel)**
- `cenarios.md` seção B, **RF16** e **RF18**
- Código: `tools/processo/portao.ts` (`PASTAS_DE_CODIGO`, `decidirCommit`, `papel`; e a lista do §5(e), que a 12.0 já
  escreveu: `PASTAS_DE_PROCESSO`, `ARQUIVOS_DE_PROCESSO`, `PADROES_DE_PROCESSO` e `ehCodigoParaAEsteira`); `tools/processo/guardioes-por-caminho.ts`
  (13.0); `tools/processo/comando-git.ts` (`marcadorDoMvp`, `avaliarCommitDoMvp`); `docs/aia/ouro/README.md` (manda
  commitar com `(ouro: <política>)`); `tools/ci/conferir-entregas.ts` (12.0, que classifica pela `decidirCommit`)

## Subtarefas

- [x] 14.1 — A `decidirCommit`, só em sessão de papel, conta como código o que `ehCodigoParaAEsteira` conta: a lista do
  §5(e) já está em `portao.ts` desde a 12.0 e é importada, sem segunda lista nem cópia (`techspec.md` §5(a), 12.0);
  `infra/` continua código em toda sessão
- [x] 14.2 — A tabela do RF16 em `guardioes-por-caminho.ts`, com as mesmas regras de casamento do código
- [x] 14.3 — Sai `marcadorDoMvp`, `avaliarCommitDoMvp` e o ramo `(mvp:)` da decisão
- [x] 14.4 — `docs/aia/ouro/README.md`: o commit do corpus é `(correção <slug>)` com o `conformidade-reviewer`
- [x] 14.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/portao.ts` | alterado |
| `tools/processo/guardioes-por-caminho.ts` | alterado |
| `tools/processo/comando-git.ts` | alterado |
| `tools/processo/harness/guardioes.test.ts` | alterado |
| `tools/processo/revisoes.test.ts` | alterado |
| `docs/aia/ouro/README.md` | alterado |
| `docs/aia/ouro/SELO.json` | alterado: o hash do README |
| `tools/processo/hook-git.ts` | alterado: só o comentário do `(mvp:)` |
| `packages/nucleo/src/ia/selo-do-ouro.test.ts` | alterado: só o docblock |
| `tasks/prd-harness/techspec.md` | alterado: §5(a) |
| `tools/ci/caminhos-da-esteira.ts` | novo: as duas listas "para a esteira" |
| `tools/ci/conferir-entregas.test.ts` | alterado: importa as listas |
| `tools/processo/hook-git.int.test.ts` | alterado: o caso de `tools/` pelo commit-msg |
| `tasks/prd-harness/tabela-de-guardioes.md`, `tasks/prd-harness/cenarios.md` | alterados |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| papel, sem tarefa, um arquivo de cada caminho do §5(e) (`tsconfig.base.json`, `.claude/settings.local.json`, `compose.yaml`, `.env.example` inclusive) | unidade | recusado |
| `.claude/skills/x/SKILL.md`, `.claude/rules/40-testes.md`, `docs/aia/tutor.md`, `tasks/` | unidade | passam |
| correção marcada sem `revisor-geral` | unidade | recusado |
| `guardioes.test.ts`: `it.each` por caminho de cada linha da tabela do RF16 | unidade | o conjunto exato |
| `revisoes.test.ts`: `it.each` por caminho da tabela, pela `decidirCommit` | unidade | sem o guardião, recusado; com ele, aceito |
| entre eles: `eslint.config.mjs` sem `tenancy-guardian`; `docs/aia/ouro/x.json` sem `conformidade-reviewer`; `hook-git.ts` sem os quatro; `tools/ci/borda.test.ts` sem `privacy-guardian` | unidade | recusado |
| `infra/Caddyfile` sem `privacy-guardian` | unidade | recusado, com e sem papel |
| `infra/k6/x.js` com `infra-guardian` e `privacy-guardian` | unidade | passa |
| `tools/processo/linhas.ts` | unidade | sem guardião com veto |
| `tools/guardas/index.mjs` sem `privacy-guardian` | unidade | recusado (padrão) |
| sem papel, os do §5(e) | unidade | passam |
| uma lista só: em papel e sem tarefa, cada caminho do `it.each` "código para a esteira" de `conferir-entregas.test.ts`; cada um do "documento para a esteira" | unidade | recusados; passam |
| RF18: em `mvp/x`, `(mvp: algo)`, código e carimbo válido | unidade | recusado com a mensagem de código sem tarefa |

O `describe('o marcador da fatia do MVP (D77)')` do `revisoes.test.ts` é o único teste existente que muda: os casos que
aceitavam o `(mvp:)` viram o caso do RF18. Escreva isso em "Divergências".

## Como testar

- Copiar `tools/processo/revisoes.test.ts › hooks sobre um repositório de verdade › bloqueia commit que leva código sem tarefa nem correção, e deixa passar o que não é código`, com o papel em `CLAUDE_CODE_AGENT`.
- O papel: `› a árvore em que o commit acontece › sem papel passado, portao lê o papel de CLAUDE_CODE_AGENT, que é o caminho do hook`.
- Os caminhos do §5(e): `tools/ci/conferir-entregas.test.ts › código para a esteira: %s` e `› documento para a esteira: %s`; reuse as duas listas.
- Rodar: `npx vitest run --project unidade tools/processo/revisoes.test.ts tools/processo/harness/guardioes.test.ts tools/ci/conferir-entregas.test.ts`.
- Depois desta tarefa, o próprio commit dela já pede a tabela: confira a lista impressa pelo portão.

## Fora do escopo desta tarefa

O texto das regras e das skills (15.0 a 19.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O único teste existente que muda: o `describe('o marcador da fatia do MVP (D77)')` do `revisoes.test.ts` saiu, com `avaliarCommitDoMvp`, `marcadorDoMvp` e `SUITES_DO_MVP`. Os casos que aceitavam o `(mvp:)` viram `o marcador da fatia do MVP saiu (RF18)`, que o recusa com a mensagem de código sem tarefa | o RF18 manda o caminho sair, e o teste dele provava o caminho | `techspec.md` §5(a), "No código (10.0)" (reescrito: o caminho saiu); `cenarios.md` B, RF18 |
| A tabela do RF16 (`REGRAS_DO_RF16` e `RESTO_DO_PROCESSO`) não lê o papel: vale para o commit de tarefa ou de correção em qualquer sessão. O papel só decide o que conta como código sem tarefa (`arquivosDeCodigo`) | `guardioesDoCaminho(arquivos, conteudoDe)` não tem papel, e `cenarios.md` pede `infra/Caddyfile` sem `privacy-guardian` recusado "com e sem papel"; o Orquestrador que commita `eslint.config.mjs` com tarefa deve os mesmos guardiões | `techspec.md` §5(a), a frase nova depois de "sai na 14.0"; `cenarios.md` B, RF16 |
| A lista do §5(e) mora em `portao.ts` (12.0) e a tabela do RF16 precisa repetir os nomes do "resto" em `guardioes-por-caminho.ts`, que não importa módulo nenhum. A cópia é conferida, e não evitada: `harness/guardioes.test.ts` falha se um nome de `PASTAS_DE_PROCESSO` ou `ARQUIVOS_DE_PROCESSO` ficar sem linha, ou se `RESTO_DO_PROCESSO` guardar nome que a esteira não conta | circularidade: o `portao.ts` importa a tabela | `tabela-de-guardioes.md`, "O teste da tabela" |
| A correção que leva código de processo (`ehCodigoParaAEsteira` menos `PASTAS_DE_CODIGO`) exige o `revisor-geral`, marcado ou não, em qualquer sessão (`obrigatoriosDoCommit`). A tarefa já o tem sempre; a correção só o tinha quando o documento o marcava. A correção de código de produto não muda | o RF16 e a tabela dizem "além de `revisor-geral` e `test-engineer`"; a ordem de correção da rodada 1 (test-engineer) pediu a cláusula | `techspec.md` §5(b) e §5(a) (parágrafo da 14.0); `tabela-de-guardioes.md`, seção do RF16; `cenarios.md` B, RF16 |
| As duas listas "para a esteira" moram num módulo só, `tools/ci/caminhos-da-esteira.ts`, e `conferir-entregas.test.ts` e `revisoes.test.ts` as importam. Arquivo novo fora de "Arquivos previstos" | o "Como testar" manda reusar as duas listas, e o teste de um arquivo não importa o de outro | `cenarios.md` B, RF16 ("uma lista só") |
| O `README.md` do `ouro` entra no `SELO.json` (`selo-do-ouro.test.ts`): o hash foi regravado, e o docblock desse teste, que citava o `(ouro: <política>)`, passou a citar o `(correção <slug>)`. O comentário de `hook-git.ts` sobre o `(mvp:)` também | a 14.4 muda o README; o selo e os comentários não podem afirmar o marcador que saiu | `cenarios.md` B, RF16; `docs/aia/ouro/README.md` |

## Mutações

Uma por cláusula do diff (as cinco últimas são da ordem de correção da rodada 1: o `revisor-geral` na correção que leva código de processo). Os blocos de `guardioes-por-caminho.ts` rodam o `harness/guardioes.test.ts` inteiro (décimos de segundo); os de `portao.ts` rodam o `describe` do RF16 de `revisoes.test.ts`. As treze linhas de "os quatro" saem uma a uma, as outras linhas da tabela do RF16 ficam sem guardião, e o resto do §5(e) sai um nome por vez. O ramo `(mvp:)` que saiu não deixa cláusula: o que o prova é o caso do RF18 (`o marcador da fatia do MVP saiu`), que não tem o que mutar.

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'tools/processo/guardioes-por-caminho.ts',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'tools/processo/portao.ts',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'tools/processo/caducidade.ts',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'tools/processo/documento-de-revisao.ts',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'tools/processo/revisoes.ts',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'tools/processo/hook-revisoes.ts',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'tools/processo/comando-git.ts',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'tools/processo/hook-git.ts',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'tools/processo/git-hooks/',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'tools/processo/harness/guardioes.test.ts',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'tools/ci/conferir-entregas.ts',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'eslint.config.mjs',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-    'eslint-suppressions.json',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'tools/vitrine/', guardioes: [P, C] },
+  { prefixo: 'tools/vitrine/', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'tools/ia/', guardioes: [P, C] },
+  { prefixo: 'tools/ia/', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'docs/aia/ouro/', guardioes: [C] },
+  { prefixo: 'docs/aia/ouro/', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'docs/aia/ouro-retido/', guardioes: [C] },
+  { prefixo: 'docs/aia/ouro-retido/', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'tools/ci/', guardioes: [I] },
+  { prefixo: 'tools/ci/', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'tools/ci/borda.test.ts', guardioes: [I, P] },
+  { prefixo: 'tools/ci/borda.test.ts', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: '.github/', guardioes: [I, P] },
+  { prefixo: '.github/', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'playwright.config.ts', guardioes: [P] },
+  { prefixo: 'playwright.config.ts', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'compose.yaml', guardioes: [I] },
+  { prefixo: 'compose.yaml', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: '.env.example', guardioes: [I] },
+  { prefixo: '.env.example', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  doPadrao(/^\.claude\/settings[^/]*\.json$/, OS_QUATRO),
+  doPadrao(/^\.claude\/settings[^/]*\.json$/, []),
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  doPadrao(/^tsconfig[^/]*\.json$/, []),
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  'tools/',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  '.claude/hooks/',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  'package.json',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  'vitest.config.ts',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  'knip.json',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  '.gitleaks.toml',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  '.size-limit.json',
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  return ENTRADAS.filter((entrada) => entrada.casa(arquivo)).sort((a, b) => b.peso - a.peso)[0]
+  return ENTRADAS.filter((entrada) => entrada.casa(arquivo)).sort((a, b) => a.peso - b.peso)[0]
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-const doPrefixo = (prefixo: string, guardioes: readonly Guardiao[]): Entrada => ({ casa: (arquivo) => arquivo.startsWith(prefixo), peso: prefixo.length, guardioes })
+const doPrefixo = (prefixo: string, guardioes: readonly Guardiao[]): Entrada => ({ casa: (arquivo) => arquivo === prefixo, peso: prefixo.length, guardioes })
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › RF16: o código de processo exige revisão
-  arquivos.filter((arquivo) => (ehPapelDoTime(papel) ? ehCodigoParaAEsteira(arquivo) : PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta))))
+  arquivos.filter((arquivo) => (true ? ehCodigoParaAEsteira(arquivo) : PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta))))
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › RF16: o código de processo exige revisão
-  arquivos.filter((arquivo) => (ehPapelDoTime(papel) ? ehCodigoParaAEsteira(arquivo) : PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta))))
+  arquivos.filter((arquivo) => (false ? ehCodigoParaAEsteira(arquivo) : PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta))))
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › RF16: o código de processo exige revisão
-  arquivos.filter((arquivo) => (ehPapelDoTime(papel) ? ehCodigoParaAEsteira(arquivo) : PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta))))
+  arquivos.filter((arquivo) => (ehPapelDoTime(papel) ? PASTAS_DE_PROCESSO.some((pasta) => arquivo.startsWith(pasta)) : PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta))))
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › RF16: o código de processo exige revisão
-  if (!documento) return bloqueioDoCommitSemDocumento(entrada.arquivos, entrada.papel)
+  if (!documento) return bloqueioDoCommitSemDocumento(entrada.arquivos, undefined)
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › RF16: o código de processo exige revisão
-const ehCodigoDeProcesso = (arquivo: string): boolean => ehCodigoParaAEsteira(arquivo) && !PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta))
+const ehCodigoDeProcesso = (arquivo: string): boolean => ehCodigoParaAEsteira(arquivo)
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › RF16: o código de processo exige revisão
-const ehCodigoDeProcesso = (arquivo: string): boolean => ehCodigoParaAEsteira(arquivo) && !PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta))
+const ehCodigoDeProcesso = (arquivo: string): boolean => true && !PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta))
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › RF16: o código de processo exige revisão
-  const doProcesso = tipo === 'correcao' && arquivos.some(ehCodigoDeProcesso) ? ['revisor-geral'] : []
+  const doProcesso = tipo !== 'correcao' && arquivos.some(ehCodigoDeProcesso) ? ['revisor-geral'] : []
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › RF16: o código de processo exige revisão
-  const doProcesso = tipo === 'correcao' && arquivos.some(ehCodigoDeProcesso) ? ['revisor-geral'] : []
+  const doProcesso = tipo === 'correcao' && arquivos.every(ehCodigoDeProcesso) ? ['revisor-geral'] : []
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › RF16: o código de processo exige revisão
-  const doProcesso = tipo === 'correcao' && arquivos.some(ehCodigoDeProcesso) ? ['revisor-geral'] : []
+  const doProcesso = tipo === 'correcao' && true ? ['revisor-geral'] : []
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian 1ª | `package.json` pede `[I]` na tabela do RF16 | `/retro` da X7: a tabela vem da Tech Spec e a linha muda o que cada commit cobra |
| infra-guardian 1ª | `vitest.config.ts` pede `[I]` | `/retro` da X7, mesmo motivo |
| privacy-guardian 1ª | pasta nova de `tools/` nasce pedindo `privacy-guardian` | `/retro` da X7: muda o contrato da tabela |
| privacy-guardian 1ª | `.claude/hooks/` pedir `privacy-guardian` quando o hook ler dado da árvore | `/retro` da X7: hoje nenhum hook lê dado de pessoa |
| privacy-guardian 1ª e tenancy-guardian 1ª | `tools/demonstracao/` e `tools/vitrine/` ganharem linha própria (`tools/vitrine/` com `T`) | `/retro` da X7: a tabela é da Tech Spec; a vitrine grava SQL com `escola_id` à mão (`tools/vitrine/escola.ts`) e deve ser vista no retro |
| revisor-geral 1ª | nomes da raiz casam por `startsWith`, a esteira por nome inteiro (`.env.example.local` pede `infra-guardian`) | `TODO.md`: inofensivo (só pede mais, só em commit com tarefa); mudar o casamento muda comportamento |
| revisor-geral 1ª | marcar `tenancy-guardian` na linha "Subagentes obrigatórios" do `14_task.md` | recusada: a linha é do Arquiteto, e o portão já cobra o guardião pelo caminho (`revisores` imprime os seis); não muda a obrigação |
| revisor-geral 2ª, conformidade-reviewer 2ª, test-engineer 2ª | README do `ouro`, linhas 4 a 6: o texto sobre o hook ainda é impreciso (o commit sem papel e **com** `(correção <slug>)` passa pela tabela e é recusado sem a rodada; o que escapa é o commit sem papel e **sem** a marca, que a esteira pega). Se mudar, regravar o hash do `SELO.json` | `/retro` da X7: o texto diz menos do que o código protege, não promete proteção que falta |
| conformidade-reviewer 2ª | a esteira (`conferir-entregas.ts`) não confere a rodada do `conformidade-reviewer` no `ouro`, só a marca e a linha `Revisões:` | `/retro` da X7, antes de o corpus entrar no dossiê (D61) |
| privacy-guardian 2ª | checagem na esteira de que arquivo novo em `docs/aia/ouro/` não traz dado real (regra 20.17) | `/retro` da X7 |
| infra-guardian 2ª | `ehCodigoDeProcesso` repete o `PASTAS_DE_CODIGO.some(...)` das linhas 315 e 435 de `portao.ts`; um auxiliar `ehCodigoDeProduto` deixaria num lugar só | `/retro` da X7 |
| infra-guardian 2ª | confirmar no `/validar` que a esteira cobra o `revisor-geral` na correção que leva código de processo (este diff não traz teste da esteira para o caso) | `/validar` da X7: o Validador confere o RF16 na esteira |
| tenancy-guardian 2ª | sem papel, o commit de código de produto não exige a rodada do `tenancy-guardian` no commit; registrar junto com `tools/vitrine/` | `/retro` da X7 |
| revisor-geral 2ª | `14_task.md:17` cita a seção da tabela pelo título antigo ("…só em sessão de papel") | Implementador pode ajustar ao commitar, se quiser: é texto do próprio documento, sem efeito no carimbo; senão, `/retro` |
| revisor-geral 2ª | a quarta linha de "Divergências" cita `techspec.md` §5(b), mas só o §5(a) mudou | mesmo destino da linha acima |
| test-engineer 2ª | `14_task.md:59` ainda diz "correção marcada sem `revisor-geral`"; vale citar o `describe` novo pelo nome | mesmo destino da linha acima |
| test-engineer 2ª | o `describe` de `revisoes.test.ts:2110` ainda se chama "…só em sessão de papel", e os blocos `mutacao` citam esse prefixo | `/retro` da X7: renomear exige mexer nos blocos `mutacao` |
| test-engineer 2ª | o README diz que o commit sem papel "não passa" pelo hook, mas o `PreToolUse` cobra a correção marcada também sem papel | mesmo item do README acima |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 23:21:01 | 2026-10-23 23:21:44 | `infra-guardian` | 1 | APROVADO | acbcf2f85d932b2f5 |
| 2026-10-23 23:21:04 | 2026-10-23 23:21:58 | `conformidade-reviewer` | 1 | APROVADO | a050a4c1b027fe9c4 |
| 2026-10-23 23:21:03 | 2026-10-23 23:22:11 | `privacy-guardian` | 1 | APROVADO | a5bf62b01f328c2e9 |
| 2026-10-23 23:21:09 | 2026-10-23 23:22:15 | `tenancy-guardian` | 1 | APROVADO | acccae573ca850ea6 |
| 2026-10-23 23:21:07 | 2026-10-23 23:22:55 | `revisor-geral` | 1 | APROVADO | a657dd61abe8833b5 |
| 2026-10-23 23:21:06 | 2026-10-23 23:23:09 | `test-engineer` | 1 | REPROVADO | a7f5776d49b0f2cd2 |
| 2026-10-23 23:31:26 | 2026-10-23 23:31:46 | `privacy-guardian` | 2 | APROVADO | aa73a7d4c79355fde |
| 2026-10-23 23:31:21 | 2026-10-23 23:31:51 | `infra-guardian` | 2 | APROVADO | a0667d9d44461598f |
| 2026-10-23 23:31:36 | 2026-10-23 23:31:55 | `tenancy-guardian` | 2 | APROVADO | a708aad57e016b9df |
| 2026-10-23 23:31:16 | 2026-10-23 23:32:02 | `revisor-geral` | 2 | APROVADO | a39d1efd302056a96 |
| 2026-10-23 23:31:31 | 2026-10-23 23:32:12 | `conformidade-reviewer` | 2 | APROVADO | a69908961d7028491 |
| 2026-10-23 23:31:11 | 2026-10-23 23:32:22 | `test-engineer` | 2 | APROVADO | ad6495803e1c5f940 |

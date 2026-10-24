# Correção — o `mutacoes.ts --faltando` não lê `tools/`

**Origem:** `tasks/prd-harness/retro.md` e `TODO.md`, item "(X7, retro, M1)": as 8 reprovações de cláusula sem bloco da X7 estavam todas em `tools/`.
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `privacy-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. `revisor-geral`: a correção toca `tools/processo/`, que o passo 5 de `corrigir` obriga. -->

## Sintoma

`node tools/processo/mutacoes.ts --faltando <documento>` (e a mesma lista que o portão imprime) só olha `apps/` e
`packages/`: `linhasNovasDaArvore` (`tools/processo/mutacoes.ts:678`) pede o diff e os arquivos novos só desses dois
caminhos, e `linhasSemBloco` descarta o que não é `ehArquivoDeProducao`. Cláusula nova em `tools/` (script, guarda,
ferramenta do processo) nunca aparece na lista, e o `test-engineer` a pega sozinho, na rodada: na X7, 8 reprovações.

## Fora desta correção

Nada: a árvore estava limpa.

O que fica **fora**, de propósito:

- O RF17 (`exigenciaDeMutacao`, "produção sem mutação não recebe carimbo") e o `ehArquivoDeProducao` continuam só com
  `apps/*/src` e `packages/*/src`. Obrigar bloco em toda alteração de `tools/` seria mudar o portão, não a lista; a M1 pede
  só que o `--faltando` **informe**.
- Arquivo de `tools/` que não é código (`.md`, `.json`, `.pdf`, os ganchos do git sem extensão): `condicoesDaLinha` leria
  `?`, `&&` e `if (` de texto corrido como condição.
- Teste (`*.test.ts`, `*.spec.ts`), `.d.ts`, e as pastas `test/`, `tests/`, `__tests__/`, `__fixtures__/` e `fixtures/`
  (esta última é a de `tools/ci/fixtures/`, que guarda o teste vermelho de propósito; o TODO cita só `__fixtures__/`).

## Causa

`linhasNovasDaArvore` foi escrita na RF5 da X5 para o código de produto, e herdou o pathspec `apps packages` e o filtro
`ehArquivoDeProducao`. Quando a X7 passou a mexer quase só em `tools/processo/` e `tools/ci/`, o `--faltando` ficou
cego para o lugar onde a spec inteira mudava.

## Teste que reproduz

`tools/processo/mutacoes.test.ts`: `ehArquivoDoFaltando` (tabela), `linhasSemBloco` com linha de `tools/`, e
`--faltando, sobre uma árvore de verdade › lê também tools/`. Vermelhos antes (o primeiro por não existir a função, os
outros por a linha de `tools/` não sair), verdes depois.

## Correção

`tools/processo/mutacoes.ts`:

- `ehArquivoDoFaltando(arquivo)`: a produção, mais o código de `tools/` (`.ts`, `.tsx`, `.js`, `.mjs`, `.cjs` e parentes),
  fora `.d.ts`, teste e as pastas `test/`, `tests/`, `__tests__/`, `__fixtures__/` e `fixtures/`.
- `linhasSemBloco` e `linhasNovasDaArvore` passam a usá-la, e o diff e a lista dos arquivos novos pedem também `tools`.
  O filtro dos arquivos novos fica só no fim (o `readFileSync` de um arquivo novo que não é código é barato, e o filtro de
  antes da leitura era equivalente ao do fim: nenhum teste o distinguiria).
- `ehArquivoDeProducao` e `exigenciaDeMutacao` (RF17) ficam como estavam.
- `.claude/rules/40-testes.md`: a frase do `--faltando` diz que a lista inclui `tools/`.

O relatório continua dizendo "Linhas novas de **produção** com condição": o texto está provado por teste e não é o que a
M1 pede; fica para quando o Arquiteto o quiser trocar.

## Mutações

Sai: `ehArquivoDoFaltando` deixa de aceitar a produção de `apps/` e `packages/`.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o --faltando lê o arquivo produção de apps
 export function ehArquivoDoFaltando(arquivo: string): boolean {
-  if (ehArquivoDeProducao(arquivo)) return true
   if (!/^tools\/.+\.[cm]?[jt]sx?$/.test(arquivo)) return false
```

Sai: `tools/` sem a exigência de ser código: documento e dado entram.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o --faltando lê o arquivo documento de tools
-  if (!/^tools\/.+\.[cm]?[jt]sx?$/.test(arquivo)) return false
   if (/\.d\.ts$/.test(arquivo)) return false
```

Sai: `.d.ts` de `tools/` entra.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o --faltando lê o arquivo declaração de tipos de tools
   if (!/^tools\/.+\.[cm]?[jt]sx?$/.test(arquivo)) return false
-  if (/\.d\.ts$/.test(arquivo)) return false
   if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(arquivo)) return false
```

Sai: teste de `tools/` entra.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o --faltando lê o arquivo teste de tools
-  if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(arquivo)) return false
   return !/(?:^|\/)(?:test|tests|__tests__|__fixtures__|fixtures)\//.test(arquivo)
```

Sai: as pastas de fixture de `tools/` entram.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o --faltando lê o arquivo __fixtures__ de tools
-  return !/(?:^|\/)(?:test|tests|__tests__|__fixtures__|fixtures)\//.test(arquivo)
+  return true
```

Sai: `fixtures/` (sem sublinhados) de `tools/` entra.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o --faltando lê o arquivo fixtures de tools
-  return !/(?:^|\/)(?:test|tests|__tests__|__fixtures__|fixtures)\//.test(arquivo)
+  return !/(?:^|\/)(?:test|tests|__tests__|__fixtures__)\//.test(arquivo)
```

Sai: `linhasSemBloco` volta a ler só a produção.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › linha nova com condição em tools/ é listada
-    .filter((nova) => ehArquivoDoFaltando(nova.arquivo))
+    .filter((nova) => ehArquivoDeProducao(nova.arquivo))
     .map((nova) => ({ ...nova, condicoes: condicoesDaLinha(nova.texto) }))
```

Sai: o diff dos versionados não pede `tools`.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê também tools/: o diff dos versionados
-  const novas = linhasAcrescentadas(git('diff', '-U0', '--no-color', '--no-ext-diff', '--no-renames', 'HEAD', '--', 'apps', 'packages', 'tools'))
+  const novas = linhasAcrescentadas(git('diff', '-U0', '--no-color', '--no-ext-diff', '--no-renames', 'HEAD', '--', 'apps', 'packages'))
```

Sai: os arquivos novos não pedem `tools`.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê também tools/: o diff dos versionados
-  for (const arquivo of git('ls-files', '--others', '--exclude-standard', '-z', '--', 'apps', 'packages', 'tools').split('\0')) {
+  for (const arquivo of git('ls-files', '--others', '--exclude-standard', '-z', '--', 'apps', 'packages').split('\0')) {
```

Sai: o filtro final da árvore deixa passar o que está em `tools/` (teste, fixture e documento), e só isso: o teste de `apps/` continua fora.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê também tools/: o diff dos versionados
-  return novas.filter((nova) => ehArquivoDoFaltando(nova.arquivo))
+  return novas.filter((nova) => ehArquivoDoFaltando(nova.arquivo) || nova.arquivo.startsWith('tools/'))
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 09:44:47 | 2026-10-24 09:45:10 | `privacy-guardian` | 1 | APROVADO | a2c0db04c1f865c9b |
| 2026-10-24 09:44:46 | 2026-10-24 09:45:55 | `revisor-geral` | 1 | APROVADO | a799b3a8cb2083f31 |
| 2026-10-24 09:44:45 | 2026-10-24 09:45:58 | `test-engineer` | 1 | APROVADO | a17e6fb76d9eee92d |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `revisor-geral` (1ª), `test-engineer` (1ª) | `mutacoes.ts:696-701`: filtrar com `ehArquivoDoFaltando` antes do `readFileSync`, para um arquivo novo ilegível (link para pasta, sem permissão, binário) não derrubar o `--faltando` e o portão (`EISDIR`) | `TODO.md`. Muda o comportamento de falha e contraria o desenho escrito no documento ("o filtro dos arquivos novos fica só no fim"); o risco já existia em `apps/` e `packages/`. Pede teste e bloco de mutação próprios, numa correção própria |
| `revisor-geral` (1ª), `test-engineer` (1ª) | `mutacoes.ts:707-709`: o relatório diz "Linhas novas de **produção**" e agora lista também `tools/` | Já registrado no documento ("Correção"): texto provado por teste, decisão do Arquiteto na retro |
| `revisor-geral` (1ª) | `tasks/prd-harness/cenarios.md:17` descreve o RF5 só com "linha nova de produção" | Spec já pousada: Arquiteto, na retro da X7 |
| `revisor-geral` (1ª) | O item M1 do `TODO.md` continua `[ ]` | Orquestrador marca ao fechar a correção |
| `privacy-guardian` (1ª) | Deixar escrito que conteúdo embutido em `tools/` (texto de exemplo em `tools/ia/`, `tools/demonstracao/`) segue a regra 17: nada de dado real, porque agora a linha aparece no stdout do `--faltando` e nos logs do CI | `TODO.md`. Hoje o texto é sintético; a frase pertence a `docs/lgpd.md` / regra 20, fora do escopo desta correção |

# Tarefa 12.0 — A esteira recusa o commit de código sem marca em spec e correção

**Funcionalidade:** harness (X7) · **Depende de:** 4.0, 10.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`
**Porte:** grande

## Objetivo

O que escapa do hook (papel sem `CLAUDE_CODE_AGENT`, `commit-tree`, `rebase`, `--no-verify` em script) aparece no push:
o job `verificar`, em `spec/**` e `correcao/**`, olha commit a commit de `origin/develop..HEAD` e sai 1 com o hash do
commit de código sem marca nem `Fora do processo:`.

## Contexto necessário

- `techspec.md` §5(a), **Limites declarados** (a terceira camada)
- `prd.md` RF14 (a última frase da regra)
- `cenarios.md` seção B, **RF14, terceira camada**
- Código: `tools/processo/portao.ts` (`decidirCommit` e a classificação de código, da 10.0); `tools/processo/linhas.ts`
  (`conferirEntrega`: já lê marca e `Revisões:` commit a commit, e trata o merge do encontro); `.github/workflows/ci.yml`,
  job `verificar` (já tem `fetch-depth: 0`); `package.json` (os `ci:*`)

## Subtarefas

- [x] 12.1 — `tools/ci/conferir-entregas.ts`: para cada commit de `origin/develop..HEAD`, os arquivos (merge por
  `git show --remerge-diff`) classificados como a `decidirCommit` classifica (código de produto e a lista do §5e);
  passa com `(tarefa N.0)` ou `(correção <slug>)` e a linha `Revisões:`, ou com `Fora do processo: <motivo>` não vazio;
  senão, sai 1 citando o hash. Intervalo vazio sai 0
- [x] 12.2 — `npm run ci:conferir-entregas`; o `ci.yml` o chama no `verificar` só em `spec/**` e `correcao/**`
- [x] 12.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/ci/conferir-entregas.ts` | novo |
| `tools/ci/conferir-entregas.test.ts` | novo |
| `.github/workflows/ci.yml` | alterado (job `verificar`) |
| `package.json` | alterado (`ci:conferir-entregas`) |
| `tools/ci/esteira.test.ts` | alterado |
| `tools/processo/portao.ts` | alterado (a lista do §5e e `ehCodigoParaAEsteira`; divergência 1) |
| `tools/processo/comando-git.ts`, `tools/processo/linhas.ts` | alterados (as duas marcas num lugar só; divergência 2) |
| `README.md` | alterado (o comando novo na tabela de scripts) |
| `tasks/prd-harness/techspec.md`, `tasks/prd-harness/cenarios.md` | alterados (as divergências abaixo) |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| histórico real de spec: vários `(tarefa N.0)` com `Revisões:`, o último com código | integração (repo temporário) | sai 0 |
| merge do encontro limpo com o `tasks.md` resolvido; merge da `develop`; commits de documento sem marca; só `skills-lock.json` | idem | sai 0, um caso cada |
| commit de código com `Fora do processo: ajuste` | idem | sai 0 |
| intervalo vazio | idem | sai 0 |
| `correcao/x` com `(correção x)` e `Revisões:` | idem | sai 0 |
| código sem marca | idem | sai 1 com o hash |
| marca sem `Revisões:` | idem | sai 1 |
| merge com conflito resolvido em código, sem marca (`--remerge-diff`) | idem | sai 1 |
| sem marca só em `tools/guardas/x.mjs`; e só em `.github/workflows/ci.yml` | idem | sai 1, um caso cada |
| `Fora do processo:` com motivo vazio | idem | sai 1 |
| limite conhecido: commit de papel com `env -u CLAUDE_CODE_AGENT` e `Fora do processo: x` | idem | sai 0, afirmado como limite |
| o `ci.yml` chama em `spec/**` e `correcao/**`, com `fetch-depth: 0`, e não na `develop` | unidade | o passo roda em push de `spec/**` e `correcao/**` e na execução manual dessas branches, antes das suítes, e não em `develop`, `release`, `main` nem no pull request |
| (divergência 3) merge que ficou com um lado só; `Revisões:` vazia ou só no título; marca só no corpo; `FORA DO PROCESSO:` em outra caixa; menção no meio de uma linha; acento e espaço no nome; rename de código para documento; `commit-tree` sem marca e com motivo só de espaços; quatro arquivos de código na mensagem | idem | cada um fecha uma forma de passar sem a marca, ou de recusar o que vale |
| (divergência 3) sem a `origin/develop` | idem | sai 2, citando `fetch-depth: 0` |
| (divergência 1) `ehCodigoParaAEsteira`: um caminho por entrada da lista do §5(e), e os que a lista não cobre (`skills-lock.json`, `package-lock.json`, `.claude/skills`, `docs/package.json`, `sub/tsconfig.json`…) | unidade | os dois lados, e a âncora dos dois padrões |

## Como testar

- Copiar `tools/processo/linhas.test.ts › partida, encontro e fechamento, em repositórios de verdade › conferir na branch da spec › o merge do encontro não é cobrado pelo código que trouxe do outro lado, mas o que ele resolveu à mão é`, e `› commit com código sem marca, ou sem a linha Revisões, continua recusado na spec`: o mesmo repositório temporário, aqui chamando o script como processo.
- O `ci.yml`: copiar `tools/ci/esteira.test.ts › esteira do GitHub (.github/workflows/ci.yml) › o verificar baixa o histórico inteiro, para o gitleaks varrer todo commit e não só o último`.
- Rodar: `npx vitest run --project unidade tools/ci/conferir-entregas.test.ts tools/ci/esteira.test.ts`.

## Fora do escopo desta tarefa

O hook nativo (11.0); quem pode escrever a linha `Fora do processo:` (é o PreToolUse, 10.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| 1. A lista do §5(e) nasce aqui, em `portao.ts` (`PASTAS_DE_PROCESSO`, `ARQUIVOS_DE_PROCESSO`, `PADROES_DE_PROCESSO` e `ehCodigoParaAEsteira`), e não na 14.0. A tarefa manda classificar "como a `decidirCommit` classifica, com a lista do §5e", mas a `decidirCommit` ainda só conhece `PASTAS_DE_CODIGO`: a lista chega à decisão do commit, só em sessão de papel, na 14.0, que passa a importá-la. A esteira a usa em todo commit porque não sabe quem o fez | A 12.0 depende da 10.0 e não da 14.0, e a guarda precisa dos dois casos pedidos (`tools/guardas/x.mjs`, `.github/workflows/ci.yml`) já | `techspec.md` §5(a), parágrafo "No código (12.0)"; `cenarios.md` B, "RF14, terceira camada" |
| 2. As duas marcas (`MARCA_DE_CORRECAO`, `MARCA_DE_TAREFA`) moram em `comando-git.ts` e são importadas por `documentoDaMensagem`, `linhas.ts` e a esteira, em vez de a esteira ter a terceira cópia | Reaproveitar a peça: o hook, o encontro e a esteira não podem divergir sobre o que é marca | `techspec.md` §5(a), parágrafo "No código (12.0)" |
| 3. Regras que a Tech Spec não dizia: a marca vale no **título** (como o `conferirEntrega`); `Revisões:` tem de ter texto, no corpo; `Fora do processo:` usa a regexp do hook (`LINHA_FORA_DO_PROCESSO`, qualquer caixa) e, para valer, precisa de motivo depois dos dois pontos, em qualquer linha da mensagem; e **sai 2** quando não há `origin/develop` (checkout raso), porque quem não pôde conferir não passa. Sai 1 com o hash inteiro de cada commit que não confere, e todos de uma vez | O "sem marca" e "sem `Revisões:`" da tabela de testes precisam dizer onde a marca e a linha são lidas; sem a `origin/develop` o intervalo seria vazio e sairia 0, que é o contrário de fechar na falha | `techspec.md` §5(a), parágrafo "No código (12.0)"; `cenarios.md` B, "RF14, terceira camada" |

## Mutações

Uma por cláusula do diff. `conferir-entregas.test.ts` é `tools/ci/conferir-entregas.test.ts`; os blocos do `ci.yml` e do `package.json` são provados pelo `esteira.test.ts`.

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › o merge que resolve o conflito ficando com um lado sai 1
- return git(raiz, ['show', '--remerge-diff', '--no-renames', '--format=', '--name-only', '-z', sha]).split('\0')
+ return git(raiz, ['show', '--no-renames', '--format=', '--name-only', '-z', sha]).split('\0')
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › mover código para um documento
- return git(raiz, ['show', '--remerge-diff', '--no-renames', '--format=', '--name-only', '-z', sha]).split('\0')
+ return git(raiz, ['show', '--remerge-diff', '--format=', '--name-only', '-z', sha]).split('\0')
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › código com acento e espaço no nome
- return git(raiz, ['show', '--remerge-diff', '--no-renames', '--format=', '--name-only', '-z', sha]).split('\0')
+ return git(raiz, ['show', '--remerge-diff', '--no-renames', '--format=', '--name-only', sha]).split('\0')
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › commits de documento sem marca
  const codigo = arquivosDoCommit(raiz, sha).filter(ehCodigoParaAEsteira)
- if (codigo.length === 0) continue
  const mensagem = git(raiz, ['log', '-1', '--format=%B', sha])
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › commits de documento sem marca
- const codigo = arquivosDoCommit(raiz, sha).filter(ehCodigoParaAEsteira)
+ const codigo = arquivosDoCommit(raiz, sha).filter(() => true)
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › e a linha vale em qualquer caixa
- if (linhasForaDoProcesso.some((linha) => linha.slice(TERMO_FORA_DO_PROCESSO.length).trim() !== '')) return null
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › o commit de commit-tree
- if (linhasForaDoProcesso.some((linha) => linha.slice(TERMO_FORA_DO_PROCESSO.length).trim() !== '')) return null
+ if (linhasForaDoProcesso.some((linha) => linha.slice(TERMO_FORA_DO_PROCESSO.length) !== '')) return null
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › e a linha vale em qualquer caixa
- const linhasForaDoProcesso = mensagem.split('\n').filter((linha) => LINHA_FORA_DO_PROCESSO.test(linha))
+ const linhasForaDoProcesso = mensagem.split('\n').filter((linha) => linha.startsWith(TERMO_FORA_DO_PROCESSO))
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › correcao/x com a marca de correção
- if (MARCA_DE_CORRECAO.test(titulo) || MARCA_DE_TAREFA.test(titulo)) {
+ if (MARCA_DE_TAREFA.test(titulo)) {
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › histórico real de spec
- if (MARCA_DE_CORRECAO.test(titulo) || MARCA_DE_TAREFA.test(titulo)) {
+ if (MARCA_DE_CORRECAO.test(titulo)) {
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › a marca sem a linha Revisões sai 1
- return LINHA_DE_REVISOES.test(corpo.join('\n')) ? null : 'tem a marca no título, mas não a linha "Revisões:" no corpo'
+ return null
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › a linha Revisões sem texto, ou só no título, não vale
- return LINHA_DE_REVISOES.test(corpo.join('\n')) ? null : 'tem a marca no título, mas não a linha "Revisões:" no corpo'
+ return LINHA_DE_REVISOES.test(mensagem) ? null : 'tem a marca no título, mas não a linha "Revisões:" no corpo'
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › a linha Revisões sem texto, ou só no título, não vale
- const LINHA_DE_REVISOES = /^Revisões:[ \t]*\S/m
+ const LINHA_DE_REVISOES = /^Revisões:/m
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › histórico real de spec
- const LINHA_DE_REVISOES = /^Revisões:[ \t]*\S/m
+ const LINHA_DE_REVISOES = /^Revisões:[ \t]*\S/
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › sem motivo sai 1
- if (linhasForaDoProcesso.length > 0) return `a linha "${TERMO_FORA_DO_PROCESSO}" está sem motivo`
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › sem a origin/develop
  return {
- codigo: 2,
+ codigo: 0,
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › o intervalo vazio sai 0
- if (novos.length === 0) return { codigo: 0, texto: `Nenhum commit novo em relação a ${BASE_DAS_ENTREGAS}.` }
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › histórico real de spec
- if (motivo === null) continue
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › código sem marca sai 1
- if (recusas.length > 0) {
+ if (recusas.length > 99) {
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › a lista de arquivos de código mostra três
- const exemplos = `${codigo.slice(0, 3).join(', ')}${codigo.length > 3 ? ', …' : ''}`
+ const exemplos = `${codigo.slice(0, 3).join(', ')}`
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › a lista de arquivos de código mostra três
- const exemplos = `${codigo.slice(0, 3).join(', ')}${codigo.length > 3 ? ', …' : ''}`
+ const exemplos = `${codigo.slice(0, 4).join(', ')}${codigo.length > 3 ? ', …' : ''}`
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › o intervalo vazio sai 0
- if (import.meta.filename === process.argv[1]) {
+ if (process.argv[1] === '') {
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › código sem marca sai 1
- process.exit(resultado.codigo)
+ process.exit(0)
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: apps/api/src/x.ts
  return (
- PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta)) ||
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: tools/ci/x.ts
- PASTAS_DE_PROCESSO.some((pasta) => arquivo.startsWith(pasta)) ||
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: package.json
- ARQUIVOS_DE_PROCESSO.includes(arquivo) ||
  PADROES_DE_PROCESSO.some((padrao) => padrao.test(arquivo))
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: tsconfig.base.json
  ARQUIVOS_DE_PROCESSO.includes(arquivo) ||
- PADROES_DE_PROCESSO.some((padrao) => padrao.test(arquivo))
+ false
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: tools/ci/x.ts
  export const PASTAS_DE_PROCESSO = [
- 'tools/',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: .github/workflows/ci.yml
- '.github/',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: .claude/hooks/x.sh
- '.claude/hooks/',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: docs/aia/ouro/x.json
- 'docs/aia/ouro/',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: docs/aia/ouro-retido/x.json
- 'docs/aia/ouro-retido/',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: package.json
- 'package.json',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: compose.yaml
- 'compose.yaml',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: .env.example
- '.env.example',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: eslint.config.mjs
- 'eslint.config.mjs',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: eslint-suppressions.json
- 'eslint-suppressions.json',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: vitest.config.ts
- 'vitest.config.ts',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: playwright.config.ts
- 'playwright.config.ts',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: knip.json
- 'knip.json',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: .gitleaks.toml
- '.gitleaks.toml',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: .size-limit.json
- '.size-limit.json',
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: .claude/settings.json
- /^\.claude\/settings[^/]*\.json$/,
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › documento para a esteira: .claude/settings/x.json
- /^\.claude\/settings[^/]*\.json$/,
+ /^\.claude\/settings.*\.json$/,
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › documento para a esteira: sub/.claude/settings.json
- /^\.claude\/settings[^/]*\.json$/,
+ /\.claude\/settings[^/]*\.json$/,
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › documento para a esteira: .claude/settings.json.bak
- /^\.claude\/settings[^/]*\.json$/,
+ /^\.claude\/settings[^/]*\.json/,
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › código para a esteira: tsconfig.base.json
- /^tsconfig[^/]*\.json$/,
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › documento para a esteira: docs/tsconfig.json
- /^tsconfig[^/]*\.json$/,
+ /tsconfig[^/]*\.json$/,
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › documento para a esteira: tsconfig.base.json.bak
- /^tsconfig[^/]*\.json$/,
+ /^tsconfig[^/]*\.json/,
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/ci/conferir-entregas.test.ts › documento para a esteira: sub/tsconfig.json
- /^tsconfig[^/]*\.json$/,
+ /tsconfig[^/]*\.json$/,
```

```mutacao
arquivo: package.json
teste: tools/ci/esteira.test.ts › o verificar confere as entregas
- "ci:conferir-entregas": "node tools/ci/conferir-entregas.ts",
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o verificar confere as entregas
- - if: startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')
+ - if: startsWith(github.ref, 'refs/heads/spec/')
  run: npm run ci:conferir-entregas
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o verificar confere as entregas
- - if: startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')
+ - if: startsWith(github.ref, 'refs/heads/correcao/')
  run: npm run ci:conferir-entregas
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o verificar confere as entregas
- - if: startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')
+ - if: startsWith(github.ref, 'refs/')
  run: npm run ci:conferir-entregas
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o verificar confere as entregas
- - if: startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')
- run: npm run ci:conferir-entregas
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o verificar confere as entregas
- - if: startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')
- run: npm run ci:conferir-entregas
  - run: npm run ci:verificar
+ - if: startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')
+ run: npm run ci:conferir-entregas
```

```mutacao
arquivo: tools/ci/conferir-entregas.ts
teste: tools/ci/conferir-entregas.test.ts › o intervalo vazio sai 0
- novos = git(raiz, ['rev-list', `${BASE_DAS_ENTREGAS}..HEAD`]).split('\n').filter((sha) => sha !== '')
+ novos = git(raiz, ['rev-list', `${BASE_DAS_ENTREGAS}..HEAD`]).split('\n')
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | O passo `ci:conferir-entregas` roda antes do `ci:verificar`: quando sai 1, o mesmo run não mostra tipos, lint nem testes de unidade. Saídas: um job separado ou `if: always()` no passo seguinte | Recusada por ora: a ordem é de propósito e o `esteira.test.ts` a exige; mudar é decisão de desenho. Destino: `/retro` desta funcionalidade, se o retrabalho aparecer |
| revisor-geral (1ª) | `tasks/prd-harness/14_task.md:25`: a 14.1 ainda diz "A lista do §5(e), só em sessão de papel", sem dizer que a lista já existe em `portao.ts`; escrever que a 14.0 a importa, para ninguém criar uma segunda cópia | Tarefa futura 14.0: o documento é dela e não é arquivo desta tarefa. O Orquestrador leva ao Arquiteto, que ajusta a 14.1 antes de a 14.0 começar |
| revisor-geral (1ª) | `conferir-entregas.ts:59-66`: o `catch` trata qualquer falha do `rev-list` como "não achei origin/develop"; um `git rev-parse --verify origin/develop` antes separaria os dois casos | `TODO.md`: não é barata (código novo, mensagem nova e teste novo, e caduca todos os revisores). Continua fechando na falha, sai 2 |
| test-engineer (1ª) | Merge com mais de dois pais (octopus) não tem teste; o `--remerge-diff` talvez não liste nada nele, e um octopus com código resolvido à mão passaria sem marca | `TODO.md`: o revisor não conferiu o comportamento do git, e provar exige experimento e possivelmente código. Ou declarar como limite na §5(a) da Tech Spec; quem decide é o Arquiteto |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 22:08:43 | 2026-10-23 22:09:10 | `privacy-guardian` | 1 | APROVADO | adf7f563b14a89a76 |
| 2026-10-23 22:08:41 | 2026-10-23 22:09:47 | `infra-guardian` | 1 | APROVADO | acb6d822cb271ffb6 |
| 2026-10-23 22:08:46 | 2026-10-23 22:09:50 | `revisor-geral` | 1 | APROVADO | ab254f3d20cff4b2b |
| 2026-10-23 22:08:44 | 2026-10-23 22:10:32 | `test-engineer` | 1 | APROVADO | a938fa1a73b7a6c45 |
| 2026-10-23 22:16:32 | 2026-10-23 22:17:07 | `infra-guardian` | 2 | APROVADO | a44a082c9d9ece81e |
| 2026-10-23 22:16:44 | 2026-10-23 22:17:20 | `privacy-guardian` | 2 | APROVADO | abe1f8f5a799dece8 |
| 2026-10-23 22:17:07 | 2026-10-23 22:17:29 | `infra-guardian` | 3 | APROVADO | a44a082c9d9ece81e |
| 2026-10-23 22:16:53 | 2026-10-23 22:17:35 | `revisor-geral` | 2 | APROVADO | afa220d02e3cda647 |
| 2026-10-23 22:16:49 | 2026-10-23 22:17:38 | `test-engineer` | 2 | APROVADO | af3136b745419e2a3 |

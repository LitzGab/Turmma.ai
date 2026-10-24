# Tarefa 16.0 — Cada regra aponta a checagem que a garante, e nada cita caminho que não existe

**Funcionalidade:** harness (X7) · **Depende de:** 14.0, 15.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer` (o caminho
`tools/guardas/` soma o `infra-guardian`)
**Porte:** grande

## Objetivo

Cada regra diz, item a item, a checagem que a garante (teste, guarda, revisor) ou que só a revisão garante; nenhum papel,
regra ou guarda cita caminho que não existe; e a guarda de SDK de IA olha a pasta onde os adaptadores estão hoje.

## Contexto necessário

- `techspec.md` §2 (linha do `regras-ia.mjs`) e §9
- `prd.md` RF24 (a parte dos caminhos), RF25
- `texto.md`: a linha "pasta de adaptadores" da tabela **As contradições**
- `cenarios.md` seção C, **RF24**, **RF24, guarda de IA** e **RF25**
- `.claude/rules/` inteiras (a 10, a 20 e a 70 ganham a checagem sem perder item: o teste da 15.0 conta)
- Código: `tools/guardas/regras-ia.mjs` (`PASTA_DOS_ADAPTADORES = 'apps/api/src/ia/adapters/**'`, que não existe mais);
  `tools/guardas/guardas.test.ts`, `describe('guarda de SDK de provedor de IA')` e o caso da lista de exceções

## Subtarefas

- [x] 16.1 — Em cada regra, a checagem de cada item, pelo nome do teste, da guarda ou do revisor, ou "só a revisão garante"
- [x] 16.2 — `tools/processo/harness/caminhos.test.ts`: os caminhos citados existem, na fronteira abaixo
- [x] 16.3 — `tools/processo/harness/checagens.test.ts`: a checagem que cada regra cita existe
- [x] 16.4 — `regras-ia.mjs`: a pasta isenta é `packages/nucleo/src/ia/adaptador-*.ts`; a regra 30 e o `llm-integrator`
  dizem a mesma pasta
- [x] 16.5 — Testes

## A fronteira do que se confere

- **Onde:** `.claude/agents/*.md`, `.claude/rules/*.md` e `tools/guardas/` fora `*.test.ts` e `__fixtures__/` (amostras)
- **Extração:** token sem espaço entre crases, entre aspas ou começando por `./`, numa função exportada que devolve o token
  cru; a 21.0 a reaproveita com o filtro dela (§9)
- **É caminho** o que, sem o `./`, começa por uma das pastas da §9 (`apps/`, `packages/`, `tools/`, `e2e/`, `infra/`,
  `docs/`, `.claude/`). O resto não é conferido
- **Confere:** sem o sufixo `:<linha>` ou `#<âncora>`; com `<...>`, `…` ou `${...}`, a pasta antes dele existe; com `*`,
  casa ao menos um arquivo; o resto existe
- **Hoje:** 121 caminhos; só os quatro de `apps/api/src/ia/adapters` faltam (16.4). Mínimo: 100, e um em cada pasta

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.claude/rules/*.md`, as nove (00 a 80) | alterados |
| `.claude/agents/llm-integrator.md` | alterado |
| `tools/guardas/regras-ia.mjs` | alterado |
| `tools/guardas/guardas.test.ts` | alterado |
| `tools/processo/harness/caminhos.test.ts` | novo |
| `tools/processo/harness/checagens.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF24: amostra que cita `apps/api/src/inexistente.ts` | unidade | vermelho |
| RF24: os caminhos de hoje | unidade | verde, com contagem mínima |
| fronteira: caminho inexistente num `x.test.ts` e em `__fixtures__/` de `tools/guardas/` da amostra | unidade | verde (fora da fronteira) |
| fronteira: `e2e/__fixtures__/…` e `apps/<x>/y.ts` com a pasta presente; `e2e/inexistente/…` | unidade | verde; vermelho |
| RF25: regra que cita checagem que não existe | unidade | vermelho |
| RF25: regra que diz "só a revisão garante" | unidade | verde |
| RF25: item sem checagem nem a frase | unidade | vermelho |
| guarda de IA: SDK em `packages/nucleo/src/ia/porta.ts` e em `adaptador.ts` | unidade | reprovado |
| guarda de IA: SDK no caminho antigo `apps/api/src/ia/adapters/x.ts` | unidade | reprovado |
| guarda de IA: SDK em `packages/nucleo/src/ia/adaptador-openai-compat.ts` | unidade | passa |
| guarda de IA: a lista de exceções do teste | unidade | atualizada |
| quem contorna é acusado: caminho citado com `./` ou entre aspas em vez de crase | unidade | vermelho, um caso por forma |
| a guarda reprova quando o alvo dela não existe: pasta de regras vazia na amostra | unidade | vermelho |

## Como testar

- Guarda de IA: copiar `tools/guardas/guardas.test.ts › guarda de SDK de provedor de IA › deixa o mesmo código passar dentro dos adaptadores: %s`, trocando os caminhos, e o `it.each` do reprova; ajustar `› as únicas exceções são o SDK nos adaptadores, …`.
- Caminhos: `fs.globSync` (Node 22) ou `git ls-files` com o padrão; a amostra quebrada em `mkdtempSync`.
- Rodar: `npx vitest run --project unidade tools/guardas/guardas.test.ts tools/processo/harness/`.
- Armadilha: os itens numerados da 10, da 20 e da 70 não podem sumir (teste da 15.0).

## Fora do escopo desta tarefa

Papéis do time e critério de saída (19.0); as outras contradições do `texto.md` (18.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A regra 40 não tinha item numerado, e ganhou a seção "As regras e a checagem de cada uma", com sete itens, cada um com a sua `Checagem:` | O RF25 pede a checagem "item a item", e a 40 só tinha seções; sem item numerado o teste não teria o que conferir. A seção não muda o que a regra diz: resume cada seção em uma linha | `techspec.md` §11 (a checagem de cada item das regras); `cenarios.md` C, RF25 |
| A base fixa passa de 34.326 B para 39.535 B | As 111 linhas `Checagem:` das nove regras (as da 10, da 20 e da 70 ficam na base fixa) custam 5,2 KB, depois de a primeira rodada pedir mais testes citados e mais "o que há de teste"; o limite de 40.000 B do RF20 continua valendo e o `base-fixa.test.ts` passa | `techspec.md` §11 (o critério do RF20 é de bytes; a checagem de cada item) |
| São 181 os caminhos conferidos, e não os 121 da tarefa; só faltavam os quatro de `apps/api/src/ia/adapters`, em três arquivos e no teste da guarda | Os 60 a mais são os testes que as `Checagem:` citam, escritos nas regras; o mínimo de 100 e um em cada pasta da raiz continuam provados (apps 76, packages 36, tools 23, docs 20, .claude 14, e2e 7, infra 5) | `techspec.md` §11; `cenarios.md` C, RF24 |
| A extração dos caminhos (`extrairCaminhos`, `ehCaminho`, `problemaDoCaminho`) fica exportada de `caminhos.test.ts`, e o `caminhos.ts` da §2 não nasce agora | A tarefa manda a extração numa função exportada e a §2 diz "novo, se a extração ficou dentro do teste": a 21.0 a move sem mudar o que devolve | `techspec.md` §2 (linha do `caminhos.ts`) e §9 |
| `tools/guardas/__fixtures__/sdk-de-ia.ts` muda (a primeira linha do comentário) e não está em "Arquivos previstos" | O comentário citava a pasta antiga; o teste de caminhos não o confere (é amostra), mas a regra do texto vale para todo o repositório | `texto.md` (As contradições: pasta de adaptadores) |
| `tools/guardas/guardas.test.ts` troca a pasta antiga também no caso do log (`reprova dado pessoal… em %s`), que usava o caminho dos adaptadores só como exemplo de pasta | O caso testa a guarda de log, não a de SDK: o caminho novo mantém o que ele prova e tira o último apontamento para a pasta que não existe | `cenarios.md` C, RF24 (guarda de IA) |

## Mutações

A tarefa não toca `apps/*/src` nem `packages/*/src`, então o RF17 não a obriga; os blocos provam as cláusulas do que ela
acrescenta em código: a pasta isenta da guarda de SDK de IA (`regras-ia.mjs`, três mutações: larga demais, estreita demais e a
pasta antiga) e cada cláusula das duas conferências novas. A guarda mora nos testes, e cada bloco estraga a própria guarda e exige o
caso que a prova vermelho: no `caminhos.test.ts`, as três formas de extrair, a deduplicação, o `./`, a lista de pastas da raiz, a
fronteira (as duas pastas de papéis, a recursão, o `.md`, o `.test.ts` e o `__fixtures__/`), o sufixo `:<linha>` e `#<âncora>`, o
placeholder (a condição, a pasta antes dele, a pasta que não existe), o glob (a condição e o `> 0`), o caminho que existe, a pasta
sem arquivo, o filtro de caminho e a contagem; no `checagens.test.ts`, o fim do item (título e próximo item), o `atual = null`, o
item com letra, a linha `Checagem:` (ausente, a continuação, a linha em branco e a linha sem recuo), o `numero` do nome do arquivo,
as pastas das regras, dos revisores e das guardas, o bloco do plugin `guardas`, cada tipo de token (guarda, teste, revisor e o que não é
nada disso), as duas metades da condição da frase e os contadores.

Sem bloco, de propósito: os `?? ''` de fallback que o `noUncheckedIndexedAccess` pede; o `.sort()` dos nomes lidos da pasta (a ordem
de `readdirSync` não é garantida, e nenhum caso a distingue na máquina, que já a devolve em ordem); o `else if (atual !== null)` do
`itensDaRegra`, que o TypeScript exige e só protege um `push` em `null` que a ordem das linhas já impede; o `import.meta.dirname` e o
`join` das constantes; os mínimos de contagem do repositório de hoje (são asserção, e não cláusula); a mensagem de
`MENSAGEM_SDK_DE_IA`, que o teste da guarda não lê (ele compara as regras que reprovam, e não o texto); e a expressão regular de
`PLACEHOLDER`, que só reconhece as três formas da §9 e cuja troca de forma é pega pelos três casos da pasta antes dele; e o `.replace(/^\.\//, '')` do `problemaDoCaminho`, cuja mutação é equivalente, porque o `join` normaliza o `./` antes de o arquivo ser procurado (o `./` do token continua provado em `extrairCaminhos` e em `ehCaminho`).

Depois da primeira rodada, ganharam bloco o lookbehind do `./` (o caso `'../../docs/…'` e `a./docs/…`), o `.isDirectory()` (o caso `existe.ts/x-<y>`, em que a "pasta" é um arquivo), a extensão `.md` do nome da regra (a amostra `15-rascunho.txt`), a continuação da linha `Checagem:`, o `^\s*` da linha sem recuo, o `token.includes('/')` do `classificar` e o `catch` do `ler`.

```mutacao
arquivo: tools/guardas/regras-ia.mjs
teste: tools/guardas/guardas.test.ts › reprova import, alias, subcaminho
- export const PASTA_DOS_ADAPTADORES = 'packages/nucleo/src/ia/adaptador-*.ts'
+ export const PASTA_DOS_ADAPTADORES = 'packages/nucleo/src/ia/*.ts'
```

```mutacao
arquivo: tools/guardas/regras-ia.mjs
teste: tools/guardas/guardas.test.ts › deixa o mesmo código passar dentro dos adaptadores
- export const PASTA_DOS_ADAPTADORES = 'packages/nucleo/src/ia/adaptador-*.ts'
+ export const PASTA_DOS_ADAPTADORES = 'packages/nucleo/src/ia/adaptador.ts'
```

```mutacao
arquivo: tools/guardas/regras-ia.mjs
teste: tools/guardas/guardas.test.ts › reprova import, alias, subcaminho
- export const PASTA_DOS_ADAPTADORES = 'packages/nucleo/src/ia/adaptador-*.ts'
+ export const PASTA_DOS_ADAPTADORES = 'apps/api/src/ia/adapters/**'
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › quem contorna é acusado
- ...[...texto.matchAll(/(["'])([^"'`\s]+)\1/g)].map((achado) => achado[2] ?? ''),
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › quem contorna é acusado
- ...[...texto.matchAll(/(?<![\w./`'"-])(\.\/[^\s`'",;)\]]+)/g)].map((achado) => achado[1] ?? ''),
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › quem contorna é acusado
- ...[...texto.matchAll(/`([^`\s]+)`/g)].map((achado) => achado[1] ?? ''),
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › sem repetir
- return [...new Set(achados)]
+ return achados
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › só é caminho o que
- const semPonto = token.replace(/^\.\//, '')
+ const semPonto = token
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › só é caminho o que
- export const PASTAS_DA_RAIZ = ['apps/', 'packages/', 'tools/', 'e2e/', 'infra/', 'docs/', '.claude/']
+ export const PASTAS_DA_RAIZ = ['apps/', 'packages/', 'tools/', 'e2e/', 'docs/', '.claude/']
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › a fronteira de hoje enxerga
- const PASTAS_DOS_PAPEIS = ['.claude/agents', '.claude/rules']
+ const PASTAS_DOS_PAPEIS = ['.claude/rules']
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › placeholder: confere a pasta
  } catch {
- return false
+ return true
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › o sufixo
- const caminho = token.replace(/^\.\//, '').replace(/#.*$/, '').replace(/:\d+(?:-\d+)?$/, '')
+ const caminho = token.replace(/^\.\//, '').replace(/:\d+(?:-\d+)?$/, '')
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › o sufixo
- const caminho = token.replace(/^\.\//, '').replace(/#.*$/, '').replace(/:\d+(?:-\d+)?$/, '')
+ const caminho = token.replace(/^\.\//, '').replace(/#.*$/, '')
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › placeholder: confere a pasta
- if (placeholder !== null) {
+ if (false) {
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › placeholder: confere a pasta
- const pasta = antes.endsWith('/') ? antes : dirname(antes)
+ const pasta = antes
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › placeholder: confere a pasta
- const pasta = antes.endsWith('/') ? antes : dirname(antes)
+ const pasta = dirname(antes)
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › placeholder: confere a pasta
- return ehPasta(join(raiz, pasta)) ? null : `a pasta ${pasta} não existe`
+ return null
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › glob: casa ao menos um arquivo
- if (caminho.includes('*')) return globSync(caminho, { cwd: raiz }).length > 0 ? null : 'o padrão não casa com nenhum arquivo'
+ if (false) return globSync(caminho, { cwd: raiz }).length > 0 ? null : 'o padrão não casa com nenhum arquivo'
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › glob: casa ao menos um arquivo
- if (caminho.includes('*')) return globSync(caminho, { cwd: raiz }).length > 0 ? null : 'o padrão não casa com nenhum arquivo'
+ if (caminho.includes('*')) return globSync(caminho, { cwd: raiz }).length >= 0 ? null : 'o padrão não casa com nenhum arquivo'
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › amostra que cita apps/api/src/inexistente.ts
- return existsSync(join(raiz, caminho)) ? null : 'não existe'
+ return null
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › pasta da fronteira sem arquivo nenhum
- if (!ehPasta(dir)) return []
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › o caminho que falta é acusado
- .filter((entrada) => entrada.isFile())
+ .filter(() => true)
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › fora da fronteira: o caminho inexistente
- const ehAmostra = (arquivo: string): boolean => /\.test\.ts$/.test(arquivo) || arquivo.split('/').includes('__fixtures__')
+ const ehAmostra = (arquivo: string): boolean => arquivo.split('/').includes('__fixtures__')
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › fora da fronteira: o caminho inexistente
- const ehAmostra = (arquivo: string): boolean => /\.test\.ts$/.test(arquivo) || arquivo.split('/').includes('__fixtures__')
+ const ehAmostra = (arquivo: string): boolean => /\.test\.ts$/.test(arquivo)
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › fora da fronteira: o arquivo que não é .md
- const dosPapeis = Object.fromEntries(PASTAS_DOS_PAPEIS.map((pasta) => [pasta, arquivosDe(raiz, pasta, false).filter((arquivo) => arquivo.endsWith('.md'))]))
+ const dosPapeis = Object.fromEntries(PASTAS_DOS_PAPEIS.map((pasta) => [pasta, arquivosDe(raiz, pasta, false)]))
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › o caminho que falta é acusado
- return { ...dosPapeis, [PASTA_DAS_GUARDAS]: arquivosDe(raiz, PASTA_DAS_GUARDAS, true).filter((arquivo) => !ehAmostra(arquivo)) }
+ return { ...dosPapeis, [PASTA_DAS_GUARDAS]: arquivosDe(raiz, PASTA_DAS_GUARDAS, false).filter((arquivo) => !ehAmostra(arquivo)) }
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › fora da fronteira: o caminho inexistente
- return { ...dosPapeis, [PASTA_DAS_GUARDAS]: arquivosDe(raiz, PASTA_DAS_GUARDAS, true).filter((arquivo) => !ehAmostra(arquivo)) }
+ return { ...dosPapeis, [PASTA_DAS_GUARDAS]: arquivosDe(raiz, PASTA_DAS_GUARDAS, true) }
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › pasta da fronteira sem arquivo nenhum
- if (arquivos.length === 0) problemas.push(`${pasta}: nenhum arquivo para conferir`)
+ if (false) problemas.push(`${pasta}: nenhum arquivo para conferir`)
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › o que não começa por uma pasta da raiz
- for (const caminho of extrairCaminhos(texto).filter(ehCaminho)) {
+ for (const caminho of extrairCaminhos(texto)) {
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › amostra que cita só o que existe
- conferidos.push({ arquivo, caminho })
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › amostra que cita apps/api/src/inexistente.ts
- if (problema !== null) problemas.push(`${arquivo} cita ${caminho}: ${problema}`)
+ if (false) problemas.push(`${arquivo} cita ${caminho}: ${problema}`)
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › o item com letra
- if (inicio !== null || linha.startsWith('## ')) fechar()
+ if (inicio !== null) fechar()
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › item sem checagem nem a frase
- if (inicio !== null || linha.startsWith('## ')) fechar()
+ if (linha.startsWith('## ')) fechar()
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › o item com letra
- if (atual !== null) itens.push({ regra, id: atual.id, checagem: checagemDe(atual.linhas) })
+ if (true) itens.push({ regra, id: atual.id, checagem: checagemDe(atual.linhas) })
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › o item com letra
- atual = null
+ void 0
  }
  for (const linha of linhas) {
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › o item com letra
- const inicio = /^(\d+[a-z]?)\. /.exec(linha)
+ const inicio = /^(\d+)\. /.exec(linha)
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › item sem checagem nem a frase
- if (onde < 0) return null
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › a checagem acaba na linha em branco
- if (!/^\s+\S/.test(linha)) break
+ if (!/^\s+\S/.test(linha)) continue
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › a checagem acaba na linha em branco
- if (!/^\s+\S/.test(linha)) break
+ if (!/\S/.test(linha)) break
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › pasta das regras ausente ou vazia
  } catch {
- return []
+ return [{ numero: '10', itens: [] }]
  }
  return nomes.sort().flatMap((nome) => {
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › arquivo de regra sem número
- if (numero === undefined) return []
+ if (false) return []
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › as guardas registradas são só as do plugin
- const bloco = /export const guardas = \{[\s\S]*?rules: \{([\s\S]*?)\n {2}\}/.exec(texto)?.[1] ?? ''
+ const bloco = /rules: \{([\s\S]*?)\n {2}\}/.exec(texto)?.[1] ?? ''
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › regra que cita checagem que não existe
- if (token.startsWith('guardas/')) {
+ if (false) {
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › regra que cita checagem que não existe
- return guardas.includes(token.slice('guardas/'.length)) ? { tipo: 'guarda' } : { problema: `a guarda ${token} não está em ${ARQUIVO_DAS_GUARDAS}` }
+ return true ? { tipo: 'guarda' } : { problema: `a guarda ${token} não está em ${ARQUIVO_DAS_GUARDAS}` }
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › um arquivo de tools/ e um .spec.ts
- if (!/\.(?:test|spec)\.tsx?$/.test(token) && !token.startsWith('tools/')) return { problema: `${token} não é teste nem guarda` }
+ if (!/\.(?:test|spec)\.tsx?$/.test(token)) return { problema: `${token} não é teste nem guarda` }
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › regra que cita checagem que não existe
- if (!/\.(?:test|spec)\.tsx?$/.test(token) && !token.startsWith('tools/')) return { problema: `${token} não é teste nem guarda` }
+ if (!token.startsWith('tools/')) return { problema: `${token} não é teste nem guarda` }
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › regra que cita checagem que não existe
- return existsSync(join(raiz, token)) ? { tipo: 'teste' } : { problema: `${token} não existe` }
+ return true ? { tipo: 'teste' } : { problema: `${token} não existe` }
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › regra que cita checagem que não existe
- if (/^[a-z][a-z-]*$/.test(token)) {
+ if (true) {
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › regra que cita checagem que não existe
- return existsSync(join(raiz, PASTA_DOS_REVISORES, `${token}.md`)) ? { tipo: 'revisor' } : { problema: `o revisor ${token} não tem arquivo em ${PASTA_DOS_REVISORES}` }
+ return true ? { tipo: 'revisor' } : { problema: `o revisor ${token} não tem arquivo em ${PASTA_DOS_REVISORES}` }
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › item sem checagem nem a frase
- if (checagem === null) return { problemas: [`${onde}: sem a linha "Checagem:"`], tipos: [], comAFrase: false }
+ if (false) return { problemas: [`${onde}: sem a linha "Checagem:"`], tipos: [], comAFrase: false }
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › regra que diz
- if (citadas.length === 0 && !comAFrase) problemas.push(`${onde}: a checagem não cita teste, guarda nem revisor, e não diz "${FRASE_DA_REVISAO}"`)
+ if (citadas.length === 0) problemas.push(`${onde}: a checagem não cita teste, guarda nem revisor, e não diz "${FRASE_DA_REVISAO}"`)
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › a amostra certa passa
- if (citadas.length === 0 && !comAFrase) problemas.push(`${onde}: a checagem não cita teste, guarda nem revisor, e não diz "${FRASE_DA_REVISAO}"`)
+ if (!comAFrase) problemas.push(`${onde}: a checagem não cita teste, guarda nem revisor, e não diz "${FRASE_DA_REVISAO}"`)
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › regra que cita checagem que não existe
- const problemas = citadas.flatMap((citada) => ('problema' in citada ? [`${onde}: ${citada.problema}`] : []))
+ const problemas = citadas.flatMap((citada) => (false ? [`${onde}: ${citada.problema}`] : []))
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › a amostra certa passa
- const tipos = citadas.flatMap((citada) => ('tipo' in citada ? [citada.tipo] : []))
+ const tipos = citadas.flatMap((citada) => (false ? [citada.tipo] : []))
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › regra sem item numerado
- if (itens.length === 0) problemas.push(`regra ${numero}: nenhum item numerado`)
+ if (false) problemas.push(`regra ${numero}: nenhum item numerado`)
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › pasta das regras ausente ou vazia
- if (regras.length === 0) problemas.push(`${PASTA_DAS_REGRAS}: nenhuma regra para conferir`)
+ if (false) problemas.push(`${PASTA_DAS_REGRAS}: nenhuma regra para conferir`)
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › a amostra certa passa
- total += 1
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › a amostra certa passa
- for (const tipo of achado.tipos) porTipo[tipo] += 1
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › regra que diz
- if (achado.comAFrase) comAFrase += 1
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › a amostra certa passa
- const PASTA_DOS_REVISORES = '.claude/agents'
+ const PASTA_DOS_REVISORES = '.claude/outros'
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › a amostra certa passa
- const ARQUIVO_DAS_GUARDAS = 'tools/guardas/index.mjs'
+ const ARQUIVO_DAS_GUARDAS = 'tools/guardas/outro.mjs'
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › o ./ só conta solto
- ...[...texto.matchAll(/(?<![\w./`'"-])(\.\/[^\s`'",;)\]]+)/g)].map((achado) => achado[1] ?? ''),
+ ...[...texto.matchAll(/(\.\/[^\s`'",;)\]]+)/g)].map((achado) => achado[1] ?? ''),
```

```mutacao
arquivo: tools/processo/harness/caminhos.test.ts
teste: tools/processo/harness/caminhos.test.ts › placeholder: confere a pasta
- return statSync(caminho).isDirectory()
+ return statSync(caminho).isFile() || statSync(caminho).isDirectory()
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › arquivo de regra sem número
- const numero = /^(\d+)-.+\.md$/.exec(nome)?.[1]
+ const numero = /^(\d+)-/.exec(nome)?.[1]
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › na linha de continuação
- partes.push(linha.trim())
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › dentro do item, também vale
- const onde = linhas.findIndex((linha) => /^\s*Checagem:/.test(linha))
+ const onde = linhas.findIndex((linha) => /^\s+Checagem:/.test(linha))
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › a amostra certa passa
- if (token.includes('/')) {
+ if (false) {
```

```mutacao
arquivo: tools/processo/harness/checagens.test.ts
teste: tools/processo/harness/checagens.test.ts › o arquivo das guardas ausente
  } catch {
- return ''
+ throw new Error('arquivo ausente')
  }
 }
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian 1ª; privacy-guardian 1ª | `regras-ia.mjs:29`: o padrão `adaptador-*.ts` também isenta `adaptador-falso.ts`, `adaptador-resiliente.ts` e os `adaptador-*.test.ts`; tirar `*.test.ts` e `adaptador-falso.ts` da exceção | `TODO.md`, para o `llm-integrator`: muda o comportamento da guarda e o contrato do teste de exceções, e nenhum arquivo ali importa SDK hoje (usam `fetch`) |
| tenancy-guardian 1ª | Regra 10, item 6 (e regra 20, item 6): o teste citado diz na linha 216 que o id de outra escola não entra nele; citar um teste que compare o 404 do id de outra escola com o do inexistente | 21.0: precisa achar ou escrever o teste, e a linha já diz "só a revisão garante" com "o que há de teste", então não afirma cobertura que não existe |
| tenancy-guardian 1ª; privacy-guardian 1ª; revisor-geral 1ª | `checagens.test.ts` confere que a checagem citada existe, não que prova o item; reler as 111 `Checagem:` com a pergunta "o teste prova o item ou só fica perto do assunto?" | 21.0 (que reaproveita a extração) e `/retro` da X7 |
| conformidade-reviewer 1ª | Regra 70, item 1: quando a tabela `nota` nascer, a Checagem precisa apontar o teste que recusa gravação sem `lancadaPor` em todo caminho | A tarefa que criar a tabela `nota`; anotar em `TODO.md` |
| infra-guardian 1ª | Regra 80, itens 5, 6 e 8 (estado em memória, prova online, índice): sem teste, só a revisão | Lacuna conhecida: `/retro` da X7 |
| test-engineer 1ª | Regra 30, item 8: `adaptador-resiliente.test.ts` cobre timeout e retry, não o orçamento de tokens; o guardião deve confirmar | `llm-integrator`, na revisão da 21.0 |
| revisor-geral 2ª | A base fixa está a 465 B do limite de 40.000 B (RF20): a próxima tarefa que acrescentar texto ao CLAUDE.md ou às regras 10, 20 e 70 reprova em `base-fixa.test.ts` | `TODO.md` e 21.0 |
| revisor-geral 2ª | Registrar no documento por que o item 13 da regra 20 deixou de citar `provedores-da-escola.int.test.ts` | Já está registrado na ordem `16_task-r1.md` (item 1) e na tabela "Divergências"; sem nova linha |
| privacy-guardian 2ª | Regra 20, item 13: `provedor.test.ts` prova só que o padrão é o adaptador falso; dizer na linha "só a revisão garante a escolha pelo contrato" | 21.0, na releitura das `Checagem:` (mesmo ponto de "o teste prova o item?") |
| privacy-guardian 2ª | Regra 20, item 14: citar também `packages/shared/src/permissao/matriz.test.ts` | 21.0, mesma releitura |
| privacy-guardian 2ª | Regra 20, item 2: ajustar o texto para "CPF e data na importação" | 21.0, mesma releitura |
| test-engineer 2ª | `caminhos.test.ts:247`: o caso `'../../docs/inexistente.md'` não mata a mutação sozinho (quem mata é o `a./`); renomear o caso ou trocar por `x-./docs/…` | 21.0, que move a extração e mexe nesse arquivo |
| test-engineer 2ª | A mensagem "a pasta … não existe" sai quando o caminho existe e é arquivo; "não é pasta" seria mais preciso | 21.0 (move a extração) |
| test-engineer 2ª | O bloco do `ARQUIVO_DAS_GUARDAS` trocou de teste citado sem linha com o motivo | Recusada: só registro, e a troca está nas "Divergências" desta rodada; vai ao `/retro` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 23:56:48 | 2026-10-23 23:57:56 | `infra-guardian` | 1 | APROVADO | a97005cc8de365863 |
| 2026-10-23 23:56:37 | 2026-10-23 23:58:24 | `tenancy-guardian` | 1 | APROVADO | af8dbf6b807c40a7d |
| 2026-10-23 23:56:39 | 2026-10-23 23:58:50 | `privacy-guardian` | 1 | REPROVADO | a92b17e4195c6ea7e |
| 2026-10-23 23:56:46 | 2026-10-23 23:58:50 | `revisor-geral` | 1 | REPROVADO | abd668168bbf30ca8 |
| 2026-10-23 23:56:41 | 2026-10-23 23:59:02 | `conformidade-reviewer` | 1 | APROVADO | aa7a208e3ae912feb |
| 2026-10-23 23:56:43 | 2026-10-24 00:00:32 | `test-engineer` | 1 | REPROVADO | a8569e5e4556ce3b8 |
| 2026-10-24 00:11:42 | 2026-10-24 00:12:15 | `revisor-geral` | 2 | APROVADO | a0251fdfc788151e0 |
| 2026-10-24 00:11:35 | 2026-10-24 00:12:17 | `privacy-guardian` | 2 | APROVADO | a51fd391b78620e06 |
| 2026-10-24 00:11:50 | 2026-10-24 00:13:04 | `test-engineer` | 2 | APROVADO | a63c528748c302c5d |

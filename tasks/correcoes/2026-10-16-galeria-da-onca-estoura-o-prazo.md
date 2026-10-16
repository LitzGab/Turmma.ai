# Correção — quatro casos da galeria estouram os 30 s do e2e no runner da esteira, porque conferem cada avatar com uma ida ao navegador por asserção

**Origem:** esteira run 38896156999 da `spec/pele-e-casca` (`256b4a2`): `e2e/pecas-ia.spec.ts:30`, `e2e/pecas-marca-onca.spec.ts:84` (claro e escuro) e `e2e/pecas-galeria.spec.ts:15`, todos em `Test timeout of 30000ms exceeded`, no `chromebook` e no `celular`. O portão local de 03h10 os passou.
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `frontend-reviewer`, `conformidade-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. `revisor-geral` já é obrigatório em toda tarefa; aqui também o dita o PEDIDO. -->

## Sintoma

Quatro casos de `e2e/` terminam aos 30,5–31,3 s com `Test timeout of 30000ms exceeded`. A mensagem de asserção que aparece no log (`tutor #7: o avatar está fora de uma assinatura`, `analista_de_desempenho_escolar: sem o selo "IA", ou com dois`, `Protocol error … session closed`) é só a asserção que estava em curso quando o relógio cortou: o `Received: undefined` e o `session closed` dizem que a página foi fechada pelo prazo, não que o DOM estivesse errado. O mesmo caso (`marca-onca:84`) passou no tema escuro do `chromebook` na mesma execução, a 28,7 s.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

**Tempo, e a causa é de contagem, não de relógio.** Os quatro casos conferem a galeria **uma asserção por vez, cada uma com uma ida ao navegador**, em laços sobre dezenas de elementos. O projeto `chromebook` e o `celular` rodam com a CPU ×4 e a rede lenta do perfil (`e2e/__fixtures__/perfis.ts`), e cada ida custa mais do que numa máquina rápida. Contas, na galeria de hoje:

- `conferirAssinaturas` (`e2e/__fixtures__/avatar.ts`): nove idas por avatar (`getAttribute`, três `toHaveCount`, um `toBeVisible`, outro `toHaveCount`, outro `toBeVisible`, `textContent`, mais o `ancestor::`), em ~15 avatares da seção da onça e mais de 40 na página inteira. O `pecas-marca-onca.spec.ts:84` chama a função **duas vezes** (a seção e a página);
- `pecas-ia.spec.ts:30`: quatro idas por selo (≥ 10), quatro por avatar (~45), a mesma `conferirAssinaturas` sobre a página, e mais o resto do caso;
- `pecas-galeria.spec.ts:15`: três idas por bloco (≥ 15), antes das duas auditorias do axe sobre a página inteira.

O que fez o caso passar no portão de 03h10 e cair na esteira foi o runner: 2 trabalhadores e uma CPU mais fraca. Medi aqui, com os 2 trabalhadores da esteira e a máquina com outros ambientes de teste de pé, **antes** de mexer: `pecas-ia:30` 28,8 s no `chromebook` e **30,5 s no `celular`, vermelho** (`Test timeout of 30000ms exceeded`), `marca-onca:84` 20,6 a 25,0 s, `galeria:15` 19,2 e 19,6 s. O defeito é do teste e da conta que ele faz; o produto está certo (o `Received: undefined` e o `session closed` do log são a página fechada pelo prazo no meio de uma asserção, e o mesmo caso passou, a 28,7 s, no tema escuro da mesma execução).

Não é "aumentar o timeout": o prazo de 30 s continua, e o caso passa a levar um terço dele.

## Teste que reproduz

Reproduzir o tempo de um runner alheio não é determinístico, então a evidência é a medida, no mesmo ambiente e com as mesmas condições (`npx playwright test … --workers 2`, ambiente de teste 0):

| Caso | Antes (`chromebook` / `celular`) | Depois |
|---|---|---|
| `pecas-ia.spec.ts:30` | 28,8 s / **30,5 s, vermelho** | 8,6–9,3 s / 9,8–10,0 s |
| `pecas-marca-onca.spec.ts:84`, claro | 20,7 s / 25,0 s | 6,9–7,0 s / 8,2 s |
| `pecas-marca-onca.spec.ts:84`, escuro | 20,6 s / 22,5 s | 7,0 s / 8,2 s |
| `pecas-galeria.spec.ts:15` | 19,2 s / 19,6 s | 12,8–15,2 s / 14,1–14,4 s |

Estabilidade: os três arquivos rodados com `npx playwright test e2e/pecas-galeria.spec.ts e2e/pecas-ia.spec.ts e2e/pecas-marca-onca.spec.ts --repeat-each 3 --workers 2` (os 2 trabalhadores da esteira): **198 de 198 verdes**, o caso mais lento a 13,8 s. O e2e inteiro local, na mesma árvore: 974 de 974 (34,7 min). (`tools/ci/e2e.ts` não repassa `--repeat-each` nem `--workers`: o que foi pedido por ele rodou a suíte inteira uma vez.)

(O que sobra no `galeria:15` é o axe sobre a página inteira, duas vezes: é trabalho do teste, e não conta de ida.)

O que **é** determinístico, e fica como teste, é o que a troca poderia perder: cada verificador em lote devolve um relatório, e uma página montada com **um defeito de cada vez** tem de acusar exatamente aquele. Os testes novos, em `e2e/pecas-marca-onca.spec.ts` (`os verificadores do avatar, do selo e da assinatura, em lote`) e em `e2e/pecas-galeria.spec.ts` (`os verificadores em lote da galeria`), rodam nos dois projetos em milissegundos. São poucos testes que percorrem uma tabela de casos (um `setContent` por caso, com o nome do caso na mensagem), e não um teste por caso: um por caso dobrou os casos da fatia do e2e e o `tools/ci/esteira.test.ts` reprovou o teto:

- assinatura: avatar fora de uma assinatura, dois avatares, sem selo, dois selos, selo escondido, sem caixa, sem largura, sem altura, sem nome, dois nomes, nome escondido, nome de outro agente, agente que não é um dos três, a assinatura mais próxima vale (a de fora não cobre a de dentro), a contagem, e que `conferirAssinaturas` reprova (e não só relata) uma página sem avatar e uma com defeito;
- selo: sigla fora do `aria-hidden`, duas siglas, sigla errada, texto por extenso ausente e trocado, `title`, a quebra de linha dentro do texto, e o número do selo defeituoso;
- avatar: não quadrado, sem caixa, canto quadrado, sem cabeça, duas cabeças, `img` dentro, `image` do `svg` dentro, e o número do avatar defeituoso;
- blocos da galeria: o largo dentro de um contêiner com rolagem, o deslocado à direita, o que rola por dentro, e o que cabe;
- `desenhos`: duas peças que diferem nos sete campos (fundo, texto, borda, peso, fonte, canto, enchimento); o resultado tem de ser igual, campo a campo e na ordem, ao `desenho` de cada uma. Uma mutação por campo prova que zerar qualquer um reprova (rodada 1 do `test-engineer`).

## Correção

Só teste muda; o produto não.

- `e2e/__fixtures__/avatar.ts`: `conferirAssinaturas` passa a pedir ao navegador **um relatório** (`avaliarAssinaturas`, um `evaluateAll`) e a asserir sobre ele, com as mesmas regras de antes (o ancestral `[data-assinatura]` mais próximo, um avatar, um selo visível, um nome em `p`, `h2` ou `h3` visível e do mesmo agente). "Visível" é o do Playwright: caixa com largura e altura e sem `visibility: hidden`. Entram `avaliarSelos` e `avaliarAvatares`, que fazem em lote o que os laços do `pecas-ia.spec.ts:30` faziam por elemento;
- `e2e/__fixtures__/galeria.ts`: `medirBlocosDaGaleria` (o que o laço de blocos do `galeria:15` media) e `desenhos` (o `desenho` de várias peças numa ida; o `desenho` de uma só fica como estava);
- `e2e/pecas-ia.spec.ts` e `e2e/pecas-galeria.spec.ts` chamam as funções novas no lugar dos laços; as asserções são as mesmas, e agora a falha lista **todos** os defeitos de uma vez, com o número do avatar, em vez de parar no primeiro;
- `e2e/pecas-marca-onca.spec.ts` e `e2e/pecas-galeria.spec.ts` ganham os testes dos verificadores acima.

Fora desta correção: o `conferirTamanhoDoAvatar` (uma ida por avatar, em poucos avatares) e o laço de `mensagensDeIa` (5 mensagens) seguem como estão; nenhum dos dois passou de 12 s.

## Mutações

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
 if (nome === undefined) {
-falhas.push(`o agente "${agente}" não é um dos três`)
 return
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
 if (bloco === null) {
-falhas.push(`${agente} #${String(indice)}: o avatar está fora de uma assinatura`)
 return
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
-const bloco = avatar.parentElement?.closest('[data-assinatura]') ?? null
+const bloco = avatar.parentElement?.parentElement?.closest('[data-assinatura]') ?? null
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
-const bloco = avatar.parentElement?.closest('[data-assinatura]') ?? null
+const bloco = avatar.parentElement?.closest('[data-assinatura]:not([data-assinatura] [data-assinatura])') ?? null
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
 }
-if (bloco.querySelectorAll('[data-agente]').length !== 1) falhas.push(`${agente}: a assinatura tem mais de um avatar`)
 const selos = bloco.querySelectorAll('[data-selo-ia]')
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
-if (selos.length !== 1) falhas.push(`${agente}: sem o selo "IA", ou com dois`)
+if (selos.length < 1) falhas.push(`${agente}: sem o selo "IA", ou com dois`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
-if (selos.length !== 1) falhas.push(`${agente}: sem o selo "IA", ou com dois`)
+if (selos.length > 1) falhas.push(`${agente}: sem o selo "IA", ou com dois`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
-else if (!visivel(selos[0] as Element)) falhas.push(`${agente}: o selo está escondido`)
+else if (selos[0] === undefined) falhas.push(`${agente}: o selo está escondido`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
-return caixa.width > 0 && caixa.height > 0 && getComputedStyle(no).visibility !== 'hidden'
+return caixa.height > 0 && getComputedStyle(no).visibility !== 'hidden'
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
-return caixa.width > 0 && caixa.height > 0 && getComputedStyle(no).visibility !== 'hidden'
+return caixa.width > 0 && getComputedStyle(no).visibility !== 'hidden'
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
-return caixa.width > 0 && caixa.height > 0 && getComputedStyle(no).visibility !== 'hidden'
+return caixa.width > 0 && caixa.height > 0
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
-if (textos.length !== 1) falhas.push(`${agente}: a assinatura não diz o nome da função`)
+if (textos.length > 1) falhas.push(`${agente}: a assinatura não diz o nome da função`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
-if (textos.length !== 1) falhas.push(`${agente}: a assinatura não diz o nome da função`)
+if (textos.length < 1) falhas.push(`${agente}: a assinatura não diz o nome da função`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
-else if (!visivel(textos[0] as Element)) falhas.push(`${agente}: o nome da função está escondido`)
+else if (textos[0] === undefined) falhas.push(`${agente}: o nome da função está escondido`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito da assinatura
-else if (!new RegExp(nome).test((textos[0]?.textContent ?? '').trim())) falhas.push(`${agente}: o nome é de outro agente`)
+else if (!new RegExp('.').test((textos[0]?.textContent ?? '').trim())) falhas.push(`${agente}: o nome é de outro agente`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › conta os avatares que conferiu
-return { total: avatares.length, falhas }
+return { total: 0, falhas }
 }, nomes)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › a conferência de uma página sem nenhum avatar reprova
 const { total, falhas } = await avaliarAssinaturas(raiz)
-expect(total, 'nenhum avatar na tela: o caso passaria vazio').toBeGreaterThan(0)
 expect(falhas, 'todo avatar assina: o nome da função e um selo "IA" no mesmo bloco').toEqual([])
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › a conferência de uma tela com um defeito reprova
-expect(falhas, 'todo avatar assina: o nome da função e um selo "IA" no mesmo bloco').toEqual([])
 return total
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do selo
-if (siglas.length !== 1 || siglas[0] !== 'IA') falhas.push(`selo #${String(indice)}: a sigla "IA" é uma só e fica escondida do leitor de tela`)
+if (siglas[0] !== 'IA') falhas.push(`selo #${String(indice)}: a sigla "IA" é uma só e fica escondida do leitor de tela`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do selo
-if (siglas.length !== 1 || siglas[0] !== 'IA') falhas.push(`selo #${String(indice)}: a sigla "IA" é uma só e fica escondida do leitor de tela`)
+if (siglas.length !== 1) falhas.push(`selo #${String(indice)}: a sigla "IA" é uma só e fica escondida do leitor de tela`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do selo
-if (limpo(selo.textContent) !== 'IAgerado por inteligência artificial') falhas.push(`selo #${String(indice)}: o que a sigla quer dizer está por extenso, em texto`)
 if (selo.hasAttribute('title')) falhas.push(`selo #${String(indice)}: o que a sigla quer dizer não fica num title`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do selo
-if (selo.hasAttribute('title')) falhas.push(`selo #${String(indice)}: o que a sigla quer dizer não fica num title`)
 })
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do selo
-if (selo.hasAttribute('title')) falhas.push(`selo #${String(indice)}: o que a sigla quer dizer não fica num title`)
+if (selo.hasAttribute('title')) falhas.push(`selo #0: o que a sigla quer dizer não fica num title`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do selo
-const limpo = (texto: string | null): string => (texto ?? '').replace(/\s+/g, ' ').trim()
+const limpo = (texto: string | null): string => (texto ?? '').trim()
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do selo
-return { total: selos.length, falhas }
+return { total: 0, falhas }
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do avatar
-if (!(caixa.width > 0 && caixa.width === caixa.height)) falhas.push(`${quem}: não é um quadrado à vista (${String(caixa.width)} × ${String(caixa.height)})`)
+if (!(caixa.width === caixa.height)) falhas.push(`${quem}: não é um quadrado à vista (${String(caixa.width)} × ${String(caixa.height)})`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do avatar
-if (!(caixa.width > 0 && caixa.width === caixa.height)) falhas.push(`${quem}: não é um quadrado à vista (${String(caixa.width)} × ${String(caixa.height)})`)
+if (!(caixa.width > 0)) falhas.push(`${quem}: não é um quadrado à vista (${String(caixa.width)} × ${String(caixa.height)})`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do avatar
-if (!(Number.parseFloat(getComputedStyle(avatar).borderTopLeftRadius) >= caixa.width / 2)) falhas.push(`${quem}: não é um círculo`)
 if (avatar.querySelectorAll('svg').length !== 1) falhas.push(`${quem}: tem de ter uma cabeça (um svg)`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do avatar
-if (!(Number.parseFloat(getComputedStyle(avatar).borderTopLeftRadius) >= caixa.width / 2)) falhas.push(`${quem}: não é um círculo`)
+if (!(Number.parseFloat(getComputedStyle(avatar).borderTopLeftRadius) >= 0)) falhas.push(`${quem}: não é um círculo`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do avatar
-if (avatar.querySelectorAll('svg').length !== 1) falhas.push(`${quem}: tem de ter uma cabeça (um svg)`)
+if (avatar.querySelectorAll('svg').length < 1) falhas.push(`${quem}: tem de ter uma cabeça (um svg)`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do avatar
-if (avatar.querySelectorAll('svg').length !== 1) falhas.push(`${quem}: tem de ter uma cabeça (um svg)`)
+if (avatar.querySelectorAll('svg').length > 1) falhas.push(`${quem}: tem de ter uma cabeça (um svg)`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do avatar
-if (avatar.querySelectorAll('img, image, picture').length !== 0) falhas.push(`${quem}: tem imagem dentro (D58)`)
 })
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do avatar
-if (avatar.querySelectorAll('img, image, picture').length !== 0) falhas.push(`${quem}: tem imagem dentro (D58)`)
+if (avatar.querySelectorAll('img, picture').length !== 0) falhas.push(`${quem}: tem imagem dentro (D58)`)
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do avatar
-const quem = `avatar #${String(indice)}`
+const quem = 'avatar #0'
```

```mutacao
arquivo: e2e/__fixtures__/avatar.ts
teste: e2e/pecas-marca-onca.spec.ts › acusa, um a um, cada defeito do avatar
 })
-return { total: avatares.length, falhas }
+return { total: 0, falhas }
 })
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › medirBlocosDaGaleria acusa o bloco
-const janela = page.viewportSize()?.width ?? 0
+const janela = 100000
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › medirBlocosDaGaleria acusa o bloco
-passamDaJanela: medidas.filter((medida) => medida.direita > largura).map((medida) => medida.nome),
+passamDaJanela: medidas.filter((medida) => medida.direita > largura + 100000).map((medida) => medida.nome),
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › medirBlocosDaGaleria acusa o bloco
-direita: caixaDoBloco.x + caixaDoBloco.width,
+direita: caixaDoBloco.width,
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › medirBlocosDaGaleria acusa o bloco
-comRolagemPropria: medidas.filter((medida) => medida.sobra !== 0).map((medida) => medida.nome),
+comRolagemPropria: medidas.filter((medida) => medida.sobra < 0).map((medida) => medida.nome),
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › medirBlocosDaGaleria deixa passar o bloco que cabe
-total: medidas.length,
+total: 0,
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › desenhos devolve o desenho de cada peça
 return alvos.evaluateAll((elementos) =>
-elementos.map((elemento) => {
+elementos.slice(1).map((elemento) => {
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: e2e/pecas-ia.spec.ts › o selo de IA e a assinatura
-<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
+<span data-selo-ia="" title="IA" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: e2e/pecas-ia.spec.ts › o selo de IA e a assinatura
-24: 'size-6',
+24: 'h-6 w-7',
```

```mutacao
arquivo: apps/web/src/galeria/Secao.tsx
teste: e2e/pecas-galeria.spec.ts › nenhuma peça passa da largura da janela
-<section data-galeria={nome} aria-label={titulo} className="flex min-w-0 flex-col gap-3">
+<section data-galeria={nome} aria-label={titulo} className="flex min-w-0 flex-col gap-3 overflow-x-auto">
 <CabecalhoDeSecao titulo={titulo} />
-{children}
+{children}<div style={{ width: 3000 }} />
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › desenhos devolve o desenho de cada peça
 elementos.map((elemento) => {
 const estilo = getComputedStyle(elemento)
 return {
-fundo: estilo.backgroundColor,
+fundo: '',
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › desenhos devolve o desenho de cada peça
 elementos.map((elemento) => {
 const estilo = getComputedStyle(elemento)
 return {
 fundo: estilo.backgroundColor,
-texto: estilo.color,
+texto: '',
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › desenhos devolve o desenho de cada peça
 elementos.map((elemento) => {
 const estilo = getComputedStyle(elemento)
 return {
 fundo: estilo.backgroundColor,
 texto: estilo.color,
-borda: `${estilo.borderTopWidth} ${estilo.borderTopStyle} ${estilo.borderTopColor}`,
+borda: '',
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › desenhos devolve o desenho de cada peça
 elementos.map((elemento) => {
 const estilo = getComputedStyle(elemento)
 return {
 fundo: estilo.backgroundColor,
 texto: estilo.color,
 borda: `${estilo.borderTopWidth} ${estilo.borderTopStyle} ${estilo.borderTopColor}`,
-peso: estilo.fontWeight,
+peso: '',
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › desenhos devolve o desenho de cada peça
 elementos.map((elemento) => {
 const estilo = getComputedStyle(elemento)
 return {
 fundo: estilo.backgroundColor,
 texto: estilo.color,
 borda: `${estilo.borderTopWidth} ${estilo.borderTopStyle} ${estilo.borderTopColor}`,
 peso: estilo.fontWeight,
-fonte: estilo.fontSize,
+fonte: '',
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › desenhos devolve o desenho de cada peça
 elementos.map((elemento) => {
 const estilo = getComputedStyle(elemento)
 return {
 fundo: estilo.backgroundColor,
 texto: estilo.color,
 borda: `${estilo.borderTopWidth} ${estilo.borderTopStyle} ${estilo.borderTopColor}`,
 peso: estilo.fontWeight,
 fonte: estilo.fontSize,
-canto: estilo.borderTopLeftRadius,
+canto: '',
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › desenhos devolve o desenho de cada peça
 elementos.map((elemento) => {
 const estilo = getComputedStyle(elemento)
 return {
 fundo: estilo.backgroundColor,
 texto: estilo.color,
 borda: `${estilo.borderTopWidth} ${estilo.borderTopStyle} ${estilo.borderTopColor}`,
 peso: estilo.fontWeight,
 fonte: estilo.fontSize,
 canto: estilo.borderTopLeftRadius,
-enchimento: estilo.padding,
+enchimento: '',
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª), test-engineer (1ª) | `expect.poll(() => avaliar…(raiz)).toMatchObject({ falhas: [] })` nos pontos do produto, para devolver a espera que o `toHaveCount` e o `toBeVisible` faziam | Recusada por ora: muda o comportamento do teste, e o chamador já espera a galeria abrir (`abrirGaleria`, `irParaOTema`); 198 de 198 execuções verdes. O item 3 deixa dito no código que a função não espera. Se aparecer intermitência por peça que monta tarde, entra como correção |
| revisor-geral (1ª) | `desenhos` repete o corpo de `desenho`; fazer `desenho(alvo)` chamar `desenhos` | Recusada: o motivo está no comentário de `desenhos`, e a divergência entre os dois passa a ser pega pelo teste do item 1, que compara `desenhos` com `desenho` |
| revisor-geral (1ª) | Usar o título inteiro do teste no campo `teste:` das mutações | Recusada: o portão casa por prefixo e aceitou as 44; mexer em 44 blocos para uma hipótese de renomear o teste |
| frontend-reviewer (1ª) | Legenda na galeria dizendo que a segunda tabela de "Tabela que vira lista" corta a coluna de propósito | Recusada nesta correção: é de `apps/web`, e a correção só mexe em `e2e/`; a galeria é nossa e a tabela é demonstração do contêiner estreito |
| frontend-reviewer (1ª) | Teste que compare `desenhos` com `desenho` numa peça | Atendida pelo item 1 |
| frontend-reviewer (1ª) | `tools/ci/e2e.ts` não repassa `--repeat-each` nem `--workers` | Levada ao `/retro` de `pele-e-casca`; o documento já registra o fato em "Teste que reproduz" |
| test-engineer (1ª) | `medirBlocosDaGaleria` deixa passar bloco com `display:none` (o laço antigo reprovava porque `caixa()` lançava); acrescentar lista `semCaixa` | `TODO.md`: muda o contrato de `MedidaDosBlocos` e os `toEqual` dos testes; não é regra de largura, e o bloco sumir da galeria é pego por outros casos |
| test-engineer (1ª) | `.trim()` do nome em `avatar.ts` sem caso na tabela | Recusada: tirar o `.trim()` só endurece a conferência e nenhuma mutação útil o derruba |
| test-engineer (1ª) | O prazo só está medido, não há teste que o segure | Recusada: o documento explica por que reproduzir o tempo do runner não é determinístico |
| test-engineer (2ª) | No teste de `desenhos`, a borda e o canto vêm de atalhos (`border:`, `border-radius:`) que pintam os quatro lados iguais; `desenhos` lendo `borderBottom*` no lugar de `borderTop*` não seria pego | `TODO.md`: endurece o teste de `desenhos`, que já prova os sete campos por mutação |
| revisor-geral (2ª) | O documento chama de "respiro" o campo que o código chama de `enchimento` | Atendida: acertei o texto de "Teste que reproduz" |
| revisor-geral (2ª) | `pecas-galeria.spec.ts:83`: separar `for` e `expect` em linhas | Recusada: legibilidade, sem efeito |
| frontend-reviewer (2ª) | Fotos 2 a 9 (computador) e 2 a 12 (celular) não foram lidas | Sem ação: a web não mudou; o Validador fotografa no fim da spec |
| frontend-reviewer (2ª), test-engineer (2ª) | O documento perdeu a seção "Revisões" na primeira rodada e voltou com a 2ª | Feito pelo hook: a seção existe de novo; o histórico da 1ª rodada está em `tasks/correcoes/achados/` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-16 11:14:11 | 2026-10-16 11:14:29 | `frontend-reviewer` | 1 | APROVADO | a087d4ee5e3c44831 |
| 2026-10-16 11:14:06 | 2026-10-16 11:14:30 | `revisor-geral` | 1 | APROVADO | a3daa3affa573ef79 |
| 2026-10-16 11:14:01 | 2026-10-16 11:14:35 | `test-engineer` | 1 | APROVADO | ae23cb3f94a19edcf |
| 2026-10-16 11:14:16 | 2026-10-16 11:14:38 | `conformidade-reviewer` | 1 | APROVADO | a9ef0b4ad27ac6c57 |

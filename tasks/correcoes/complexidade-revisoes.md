# Correção — quatro funções de `tools/processo/revisoes.ts` passam da complexidade 10 e a partição da 2.0 não pode herdar a supressão

**Origem:** divergência da 2.0 de `harness` (23/10/2026), registrada no §2 da Tech Spec (`0ed2f7d`): a catraca do X5 (`tools/guardas/catraca.ts`, RF11) não deixa arquivo novo nascer com supressão, e para o git a partição não é rename.
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: test-engineer e revisor-geral. A correção toca `tools/processo/`, e é por isso que o `revisor-geral` entra (passo 5 do /corrigir). -->

## Sintoma

`tools/processo/revisoes.ts` carrega `eslint-suppressions.json › complexity: 4` por quatro funções: `lerSecao` (17), `arquivosDoCommit` (18),
`pastaDoCommit` (15) e `portao` (17), com o limite em 10. A 2.0 parte o arquivo em `documento-de-revisao.ts`, `caducidade.ts`,
`comando-git.ts` e `portao.ts`; cada módulo novo herdaria, pelo caminho novo, a supressão de uma função que já passa do limite, e a
catraca (arquivo novo sem supressão) reprova.

## Fora desta correção

Nada: a árvore estava limpa.

## Causa

As quatro funções acumularam ramos ao longo do F0 a X5 (`lerSecao` leu o corpo da seção, escolheu o item e tratou a cerca no mesmo
laço; `arquivosDoCommit` leu `git add` e `git commit` com o `-a` no mesmo corpo; `pastaDoCommit` leu atribuições, `cd` e `-C` de uma
vez; `portao` fez os três bloqueios e a conferência do documento inline), e a catraca da 13.0 gravou a complexidade que elas tinham.
A partição só move: baixar a complexidade antes dela deixa cada auxiliar ir para o módulo de quem a chama.

## Teste que reproduz

`tools/guardas/catraca.test.ts › cita só as quatro regras de tamanho, e a soma por regra é o TETO`, com o `TETO.complexity` em 244:
**vermelho** com o `eslint-suppressions.json` de antes (três casos: `expected { complexity: 248 } to deeply equal { complexity: 244 }`, `complexity: 248 supressões, o TETO é 244` e o lint com a linha de base), verde depois da poda.
Para o comportamento, os testes de `revisoes.test.ts` e `hook-portao.test.ts` ficam **sem alteração**: verdes antes (92 casos) e depois (92).

## Correção

Só extração de auxiliares, sem mudar comportamento nem mensagem (o diff de `revisoes.ts` move o texto):

- `lerSecao` (17 → 8): `corpoDaSecao` (as linhas até o próximo cabeçalho) e `lerOCorpoDaSecao` (o item escolhido, fora da cerca).
- `arquivosDoCommit` (18 → 5): `levarOQueOAddPrepara` (os caminhos do `git add`) e `levarOQueOCommitDaTodos` (o `-a` e o `--all` do `git commit`).
- `pastaDoCommit` (15 → 9): `variaveisECaminhosDosTrechos` (as atribuições e os `cd`).
- `portao` (17 → 10): `bloqueioAntesDaArvore`, `bloqueioDoCommitSemDocumento` e `bloqueioDoDocumento`.

`npx eslint . --prune-suppressions` tira só a entrada `tools/processo/revisoes.ts` do `eslint-suppressions.json`, e o `TETO.complexity` de
`tools/guardas/catraca.test.ts` desce de 248 para 244, no mesmo commit (a catraca: "quem corta baixa os dois").

## Mutações

Pelo menos uma por função, num ramo do corpo novo (seis ao todo: uma em `lerSecao`, uma em `arquivosDoCommit`, duas em `pastaDoCommit` e duas em `portao`); cada uma deixa vermelho um caso de `revisoes.test.ts`.

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts › o revisor que resume dentro de uma cerca: a declaração vale, e a cerca não vira resumo
-  const util = corpo.filter((linha) => !CERCA.test(linha))
+  const util = corpo
```

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts › lê do comando os arquivos que o commit leva
-    if (token === '--all' || (/^-[a-zA-Z]+$/.test(token) && token.includes('a'))) alterados.forEach((arquivo) => levados.add(arquivo))
+    if (token === '--all' || (/^-[a-zA-Z]+$/.test(token) && token.includes('z'))) alterados.forEach((arquivo) => levados.add(arquivo))
```

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts › vale também o cd dentro do comando, o cd de um comando anterior, e o caminho entre aspas
-    if (cd?.[1]) caminhos.push(cd[1])
+    if (cd?.[1]) void cd
```

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts › caminho em variável: vale a atribuída no próprio comando, e a que o hook não conhece bloqueia
-  if (onde && 'indeterminado' in onde) {
+  if (onde && 'indeterminadoX' in onde) {
```

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts › bloqueia commit que leva código sem tarefa nem correção, e deixa passar o que não é código
-  if (codigo.length === 0) return null
```

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts › o revisor registra a própria rodada, e o commit só passa quando todos aprovaram depois da correção
-  if (aMais !== null) bloqueios.push(aMais)
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Nomes `levarOQueOCommitDaTodos` e `levarOQueOAddPrepara` difíceis de ler; sugere `levarOsDoAdd` e `levarTodosSeCommitA` | Tarefa 2.0 (a partição): os auxiliares mudam de módulo nela, e renomeá-los lá não custa rodada extra. Aplicar agora é mudança de código que caduca os dois revisores por uma questão de nome |
| revisor-geral (1ª) | `portao` chama `pastaDoCommit` duas vezes (`bloqueioAntesDaArvore` e `arvoreDoCommit`); a 2.0 pode passar o resultado adiante | Tarefa 2.0, ao montar `portao.ts`. Já existia antes desta correção e muda a estrutura de chamada, que esta correção declara não mexer |
| revisor-geral (1ª) | `cenarios.md` não diz nada sobre esta correção | Recusada: o comportamento não muda e a divergência já está no §2 da `techspec.md` (`0ed2f7d`); o revisor mesmo diz que não bloqueia |
| test-engineer (1ª) | Quatro trechos movidos sem mutação própria (`corpoDaSecao`, `levarOQueOAddPrepara`, ramo `estranho` de `bloqueioAntesDaArvore`, ramo `(mvp: …)` de `bloqueioDoCommitSemDocumento`); vale uma mutação por auxiliar na 2.0, onde o caminho do arquivo muda | Documento da tarefa 2.0 (`Mutações`). Não são cláusulas novas, e os testes existentes cobrem cada um, como o revisor confirmou |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 15:49:43 | 2026-10-23 15:50:16 | `revisor-geral` | 1 | APROVADO | a912c889ebe00965a |
| 2026-10-23 15:49:42 | 2026-10-23 15:51:07 | `test-engineer` | 1 | APROVADO | abc33ca5699d8339a |

# Correção — o hook conta as rodadas pela seção "Revisões" e recomeça do 1 quando ela some

**Origem:** retrospectiva da X1 (`tasks/prd-pele-e-casca/retro.md`, M2), `TODO.md`, item "(X1, retrospectiva) Código de processo", letra (b)
**Subagentes obrigatórios:** `revisor-geral`, `test-engineer`
<!-- Quem dita os guardiões é o Orquestrador, no pedido, e a Mesa confere a linha contra os arquivos alterados. -->

## Sintoma

`acrescentarRevisao` (`tools/processo/revisoes.ts`) numera a rodada contando as linhas da tabela da seção
"Revisões" do documento. Se o Implementador reescreve o documento inteiro, a seção some, o hook a recria vazia e a
rodada seguinte sai "1ª" depois de uma reprovação. Aconteceu duas vezes na X1 (correções do alvo de toque e da galeria
da onça), e uma mensagem de commit repetiu o erro.

## Fora desta correção

nada

## Causa

A única fonte da contagem é a tabela do próprio documento, que quem edita pode apagar. O hook escreve, na mesma rodada,
o bloco do achado em `achados/<documento>.md` com o cabeçalho `## <revisor> · <N>ª rodada · <veredito> · <fim>`, e esse
arquivo não é editado à mão (protocolo, item 5), mas `acrescentarRevisao` não o lê.

## Teste que reproduz

`tools/processo/revisoes.test.ts › a rodada não recomeça do 1 quando a seção some` (puro, sobre
`acrescentarRevisao` com o texto dos achados) e `› achados separados por documento, com índice › a rodada continua dos
achados quando o documento é reescrito sem a seção` (por `registrar`, sobre um repositório de verdade).

## Correção

`rodada = max(linhas da tabela do revisor, maior N do revisor no arquivo de achados do documento) + 1`.
`ultimaRodadaNosAchados(conteudoAchados, revisor)` lê os cabeçalhos do bloco e `registrar` passa o conteúdo do arquivo
de achados a `acrescentarRevisao`, dentro da trava do documento.

**Limite conhecido:** o arquivo de achados só guarda a rodada que exigiu algo (reprovada, ou aprovada com recomendação).
Se a seção sumir depois de uma aprovação limpa, essa rodada não está em lugar nenhum além da tabela e a contagem a
perde. O caso real da X1 (seção apagada depois de reprovação) fica coberto.

## Mutações

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts › a rodada não recomeça do 1 quando a seção some
-  const rodada = Math.max(naTabela, ultimaRodadaNosAchados(achadosDoDocumento, revisao.revisor)) + 1
+  const rodada = naTabela + 1
```

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts › a rodada não recomeça do 1 quando a seção some
-  const rodada = Math.max(naTabela, ultimaRodadaNosAchados(achadosDoDocumento, revisao.revisor)) + 1
+  const rodada = ultimaRodadaNosAchados(achadosDoDocumento, revisao.revisor) + 1
```

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts › a rodada não recomeça do 1 quando a seção some
-    .filter((achado) => achado[1] === revisor)
```

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts › o cabeçalho de seção dentro do texto do revisor não conta como rodada
-  const rodadas = [...conteudoAchados.matchAll(/^## (\S+) · (\d+)ª rodada · [^·\n]+ · \d{4}-/gm)]
+  const rodadas = [...conteudoAchados.matchAll(/^## (\S+) · (\d+)ª rodada · \S+ · \d{4}-/gm)]
```

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts › o cabeçalho de seção dentro do texto do revisor não conta como rodada
-  const rodadas = [...conteudoAchados.matchAll(/^## (\S+) · (\d+)ª rodada · [^·\n]+ · \d{4}-/gm)]
+  const rodadas = [...conteudoAchados.matchAll(/^## (\S+) · (\d+)ª rodada · [^·\n]+/gm)]
```

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts › a rodada continua dos achados quando o documento é reescrito sem a seção
       undefined,
-      achadosAnteriores,
+      '',
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Objeto de opções (`{ nota, achadosDoDocumento }`) no lugar do `undefined` posicional em `acrescentarRevisao(..., undefined, achadosAnteriores)` | Não aplicar: muda a assinatura e todas as chamadas dos testes. Destino: a próxima tarefa que tocar `acrescentarRevisao` |
| revisor-geral (1ª), test-engineer (1ª) | Contar também pelos cabeçalhos de `achados/` na skill `revisar-tarefa`, e ancorar o regex de `ultimaRodadaNosAchados` no fim de linha | Não aplicar: muda comportamento da skill e do regex, fora do escopo desta correção. Destino: o registro dos itens 2 e 3 no `TODO.md` |
| test-engineer (1ª) | Bloco de mutação para o `0` de `Math.max(0, ...rodadas)` | Recusada: no hook o efeito é nulo (`Math.max(naTabela, -Infinity)` dá o mesmo valor) e a asserção `ultimaRodadaNosAchados('', …)` com `toBe(0)` já a pega |
| test-engineer (2ª) | O `it` do limite é puro e passaria também com o código de antes da correção; a versão que fixa de verdade é por `registrar` (aprovação limpa, documento reescrito sem a seção, nova aprovação, rodada 1) no `describe('achados separados por documento, com índice')` | Não aplicar: segunda recomendação sobre o mesmo teste, de revisor que aprovou. Destino: a próxima tarefa que tocar `registrar`, junto do item (iii) do `TODO.md`, letra (b) |
| revisor-geral (2ª) | O mesmo `it` com a tabela antes e depois de a seção sumir mostraria melhor a perda | Mesmo destino da linha acima |
| revisor-geral (2ª) | O item (b) do `TODO.md` ficou com seis linhas e três sub-itens num parêntese; separar os "a rever" num item próprio | Não aplicar: reorganização de documento sem efeito no código. Destino: quando o item (b) for retomado |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-18 12:02:39 | 2026-10-18 12:03:19 | `revisor-geral` | 1 | APROVADO | ab9e268feca820499 |
| 2026-10-18 12:02:40 | 2026-10-18 12:03:30 | `test-engineer` | 1 | APROVADO | a00647e6cf690602c |
| 2026-10-18 12:07:22 | 2026-10-18 12:07:41 | `revisor-geral` | 2 | APROVADO | aeebf8661021cb970 |
| 2026-10-18 12:07:27 | 2026-10-18 12:07:56 | `test-engineer` | 2 | APROVADO | ad433363531ba1884 |

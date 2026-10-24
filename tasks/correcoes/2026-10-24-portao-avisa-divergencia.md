# Correção — o portão local não avisa a divergência que ficou só no documento da tarefa

**Origem:** `tasks/prd-harness/retro.md` e `TODO.md`, item "(X7, retro, M3)": 3 reprovações do `revisor-geral` na X7 (15.0, 18.0, 19.0) e 2 na X5, todas por divergência registrada só em "Divergências resolvidas nesta tarefa".
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. `revisor-geral`: a correção toca `tools/processo/`, que o passo 5 de `corrigir` obriga. -->

## Sintoma

O `executar-task` manda que a divergência, além da seção "Divergências resolvidas nesta tarefa" do `N_task.md`, entre na
`techspec.md` e no `cenarios.md` antes dos revisores. O portão local (`tools/processo/portao-local.ts`) não olha isso: a
linha fica só no documento da tarefa, o portão carimba, e quem acha é o `revisor-geral`, numa rodada reprovada.

## Fora desta correção

Nada: a árvore estava limpa.

O que fica **fora**, de propósito:

- O aviso **só informa**, como o `--faltando`: não deixa o portão vermelho, não impede o carimbo, não muda o código de saída.
- Não confere se a linha do documento da seção 11 (o terceiro lugar) foi escrita: o que a M3 pede são a `techspec.md` e o `cenarios.md`.
- A conferência é **por arquivo, e não por conteúdo**: basta um dos dois (`techspec.md` ou `cenarios.md`) ter mudado, por qualquer
  motivo, para o aviso calar. O silêncio não prova que a divergência chegou à spec; o aviso só lembra, e quem confere é o `revisor-geral`.
- Documento numa pasta sem `techspec.md` nem `cenarios.md` (como `tasks/correcoes/`, que não usa a seção) avisaria apontando
  arquivos que não existem. Hoje nenhum documento de correção tem a seção, e o aviso não testa a existência dos arquivos.
- Não lê commits anteriores da branch: vale o que a árvore tem em relação ao HEAD, que é o que o portão e o hook leem.

## Causa

A conferência de que a divergência chegou à spec nunca foi código: ficou como instrução em `executar-task` e como pergunta do
`revisor-geral`. O portão sabe o diff do documento (`arquivosAlterados`, `git show HEAD:`) e nunca foi ensinado a comparar a seção
com os dois arquivos da spec.

## Teste que reproduz

`tools/processo/divergencias.test.ts`: `divergenciasNovas`, `avisoDeDivergencia`, `avisoDaDivergenciaSoNoDocumento` sobre uma
árvore git de verdade, e a ligação no `portao-local.ts` (por leitura do fonte, como as demais ligações do portão). Vermelho
antes (o módulo não existe), verde depois.

## Correção

`tools/processo/divergencias.ts` (novo):

- `divergenciasNovas(antes, depois)`: as linhas da seção "Divergências resolvidas nesta tarefa" que o texto de agora tem e o do
  HEAD não tinha. Cabeçalho da tabela, separador, comentário HTML, linha em branco e "nenhuma" não são divergência.
- `avisoDeDivergencia(novas, documento, alterados)`: o texto do aviso, ou `null` quando não há linha nova ou quando a
  `techspec.md` ou o `cenarios.md` da pasta do documento está entre os alterados.
- `avisoDaDivergenciaSoNoDocumento(raiz, documento, alterados)`: lê o documento e o do HEAD (documento novo conta como sem
  linha nenhuma antes) e junta as duas.

`tools/processo/portao-local.ts`: imprime o aviso, se houver, logo depois do relatório do `--faltando`, antes das suítes.

`.claude/rules/40-testes.md` não muda: a regra descreve o `--faltando`, e o aviso é do passo 2 do `executar-task`.

## Mutações

Sai: a divergência nova deixa de ser a que o HEAD não tinha (toda linha da seção conta como nova).

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › a linha que o HEAD já tinha não conta
-  return linhasDaSecao(depois).filter((linha) => !jaTinha.has(linha))
+  return linhasDaSecao(depois)
```

Sai: o aviso some quando a `techspec.md` ou o `cenarios.md` mudou.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › sem aviso quando a techspec.md mudou
-  if (arquivosDaSpec.some((arquivo) => alterados.includes(arquivo))) return null
+  if (arquivosDaSpec.length === 0) return null
```

Sai: o aviso deixa de sair sem linha nova.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › sem linha nova, sem aviso
-  if (novas.length === 0) return null
+  if (novas.length < 0) return null
```

Sai: "nenhuma" passa a contar como divergência.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › "nenhuma" não é divergência
-  if (/^nenhuma\b/i.test(semBarras)) return false
+  if (/^nenhuma\b/i.test(semBarras)) return true
```

Sai: o cabeçalho da tabela passa a contar como divergência.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › o cabeçalho e o separador da tabela não são divergência
-  if (/^Diverg[êe]ncia\s*\|/.test(semBarras)) return false
+  if (/^Diverg[êe]ncia\s*\|/.test(semBarras)) return true
```

Sai: o documento novo (sem versão no HEAD) deixa de contar todas as linhas como novas.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › documento novo: toda linha da seção é nova
-    antes = null
+    antes = depois
```

Sai: o portão deixa de ligar o aviso.

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/divergencias.test.ts › a ligação no portão
-  const aviso = avisoDaDivergenciaSoNoDocumento(raiz, documento, arquivosAlterados(raiz))
-  if (aviso !== null) process.stdout.write(`\n${aviso}`)
+  const aviso: string | null = null
+  if (aviso !== null) process.stdout.write(`\n${aviso}`)
```

Sai: a linha em branco da seção passa a contar como divergência.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › a linha de comentário e a em branco não são divergência
-  if (linha === '' || linha.startsWith('<!--') || /^[|\s:-]+$/.test(linha)) return false
+  if (linha.startsWith('<!--') || /^[|\s:-]+$/.test(linha)) return false
```

Sai: o comentário HTML da seção passa a contar como divergência.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › a linha de comentário e a em branco não são divergência
-  if (linha === '' || linha.startsWith('<!--') || /^[|\s:-]+$/.test(linha)) return false
+  if (linha === '' || /^[|\s:-]+$/.test(linha)) return false
```

Sai: o separador da tabela passa a contar como divergência.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › o cabeçalho e o separador da tabela não são divergência
-  if (linha === '' || linha.startsWith('<!--') || /^[|\s:-]+$/.test(linha)) return false
+  if (linha === '' || linha.startsWith('<!--')) return false
```

Sai: a barra do começo deixa de ser tirada, e o cabeçalho "| Divergência |" não é reconhecido.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › o cabeçalho e o separador da tabela não são divergência
-  const semBarras = linha.replace(/^[|\s*]+/, '')
+  const semBarras = linha
```

Sai: o texto sem versão no HEAD (`null`) deixa de ser tratado como sem seção, e o documento novo lança ao ser lido.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › sem versão no HEAD, toda linha da seção é nova
-  if (texto === null) return []
   const linhas = texto.split('\n')
```

Sai: o documento sem a seção passa a ler o documento inteiro.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › documento sem a seção não tem divergência
-  if (inicio === -1) return []
+  if (inicio === -2) return []
```

Sai: o fim da seção deixa de ser o `## ` que vem depois do título.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › só a seção de divergências conta: a linha da seção seguinte, não
-  const fim = linhas.findIndex((linha, indice) => indice > inicio && linha.startsWith('## '))
+  const fim = linhas.findIndex((linha, indice) => linha.startsWith('## '))
```

Sai: a seção que é a última do documento perde a última linha.

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › a seção que é a última do documento vai até o fim
-    .slice(inicio + 1, fim === -1 ? undefined : fim)
+    .slice(inicio + 1, fim)
```

Sai: o `trim` de cada linha da seção (o comentário recuado passa a contar).

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › o recuo da linha e o espaço depois do título não escondem a seção nem a divergência
-    .map((linha) => linha.trim())
     .filter(ehDivergencia)
```

Sai: o `trim` do título (o espaço no fim esconde a seção).

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › o recuo da linha e o espaço depois do título não escondem a seção nem a divergência
-  const inicio = linhas.findIndex((linha) => linha.trim() === TITULO_DA_SECAO)
+  const inicio = linhas.findIndex((linha) => linha === TITULO_DA_SECAO)
```

Sai: o asterisco do começo da linha deixa de ser tirado (o "**Nenhuma.**" passa a contar).

```mutacao
arquivo: tools/processo/divergencias.ts
teste: tools/processo/divergencias.test.ts › o negrito do "nenhuma" não é divergência
-  const semBarras = linha.replace(/^[|\s*]+/, '')
+  const semBarras = linha.replace(/^[|\s]+/, '')
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 12:45:05 | 2026-10-24 12:46:24 | `revisor-geral` | 1 | APROVADO | aab91761d7c519c6f |
| 2026-10-24 12:45:04 | 2026-10-24 12:47:36 | `test-engineer` | 1 | APROVADO | a73682e37b359686d |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | `divergencias.ts:19`: o filtro `/^nenhuma\b/i` também descarta divergência de verdade que comece por "Nenhuma"; exigir a célula ou a frase inteira | `TODO.md`: muda o comportamento de `ehDivergencia` (o que conta como divergência), e não é barata no sentido da regra; o aviso só informa e o erro cai para o lado de calar, não de acusar |
| test-engineer (1ª) | `divergencias.ts:49`: "ou" em vez de "e" (o aviso some se só um dos dois arquivos mudou) | Recusada: o documento declara isso em "Fora desta correção", e o próprio revisor diz que é coerente com as divergências reais da X7. Fica para a validação |
| test-engineer (1ª) | `divergencias.ts:50`: singular e plural sem bloco de mutação | Recusada: é só texto do aviso, e o `--faltando` não cobra bloco de cláusula de texto |
| revisor-geral (1ª) | `divergencias.ts:52-53`: a mensagem cita "o documento que a seção 11 aponta", que o portão não confere | Recusada: o próprio revisor diz "está certo como lembrete"; o documento já declara em "Fora desta correção" que a seção 11 não é conferida |
| revisor-geral (1ª) | `TODO.md` e a retro: marcar a M3 como feita | Commit à parte, depois do pouso, no padrão da M2 (`6f8e64d7`); é do Orquestrador, não desta correção |
| 2026-10-24 12:53:13 | 2026-10-24 12:53:51 | `test-engineer` | 2 | APROVADO | a55de629f469f5f5a |
| 2026-10-24 12:53:24 | 2026-10-24 12:53:52 | `revisor-geral` | 2 | APROVADO | a3be4ef269d852725 |

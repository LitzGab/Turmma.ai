# Correção — o arquivo de exceção que cita D45, D47, D55 a D59 ou D64 não soma o `conformidade-reviewer` (M6)

**Origem:** retro da X7, item M6 (`TODO.md`, "(X7, retro, M6) A citação por número de decisão soma o `conformidade-reviewer`"; revisão da spec da X7, rodada 4).
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `conformidade-reviewer`, `infra-guardian`, `privacy-guardian`, `tenancy-guardian`
<!-- Vieram no PEDIDO do Orquestrador. O `revisor-geral` entra também pelo passo 5 de `corrigir`: a correção toca `tools/processo/`. -->

## Sintoma

Nas "Regras de casamento" de `tools/processo/guardioes-por-caminho.ts`, a citação da regra 70 soma o `conformidade-reviewer` ao arquivo de exceção, mas citar uma das decisões do item M6 (D45, D47, D55 a D59 e D64) não soma. Um arquivo de exceção (`apps/web/src/tema.ts`, `tools/processo/x.ts`, `package.json`…) cujo texto diz "D55" ou "D58" sai com `[]` ou só com o guardião da exceção, e a Mesa não chama o `conformidade-reviewer` para uma mudança que mexe numa proibição da D55 ou da D57.

## Fora desta correção

Nada: a árvore estava limpa (o pedido não trouxe arquivos de tarefa em curso).

## Causa

A lista `CITACOES` só conhece o termo "regra NN" e "LGPD". As decisões D45, D47, D55, D56, D57, D58, D59 e D64 são as do item M6, e a regra 70 as cita para o `conformidade-reviewer` (medir o professor, tutor, discursiva e redação, validação humana, usos vedados, identidade do agente, uso excessivo, recusar a ferramenta), mas ninguém as pôs na lista. A regra 70 cita outras (D60, D66, D68, D70): ficam fora, abaixo, em "Recomendações sem aplicar".

## Teste que reproduz

`tools/processo/harness/guardioes.test.ts`, no bloco "a citação soma o guardião da regra":

| Teste | Antes |
|---|---|
| `a decisão %s soma o conformidade-reviewer, como a regra 70` (D45, D47, D55, D56, D57, D58, D59, D64; `tema.ts`, `vite.config.ts`, `tools/processo/x.ts` e `package.json`) | vermelho (8) |
| `a decisão citada no meio de uma frase, de uma lista ou de uma faixa soma o conformidade-reviewer` | vermelho |
| `a decisão citada só no HEAD, ou só no índice, soma o conformidade-reviewer` | vermelho |
| `a decisão soma junto com as outras citações, na ordem dos quatro` | vermelho |
| `a decisão que a regra 70 não cita, e o número que é prefixo, sufixo ou parte de outro, não soma` | **verde ao nascer**: sem termo para a decisão, nada soma. Fixa o que o termo não pode alcançar, e o bloco de mutação (afrouxar o termo) o prova |

Antes da correção: 11 casos vermelhos de 99.

## Correção

`tools/processo/guardioes-por-caminho.ts`: a lista `CITACOES` ganha o termo `/(?<![\w#])D(?:45|47|55|56|57|58|59|64)(?!\w)/`, que soma o `conformidade-reviewer`. As oito decisões são as do item M6 (a regra 70 cita outras, que ainda não somam) (D45 medir o professor, D47 tutor supervisionado, D55 a D59 discursiva e redação, validação humana, usos vedados, identidade do agente e uso excessivo, D64 recusar a ferramenta). Escrita com o D maiúsculo, como nos documentos: `d45` e `#d45` (cor curta) não somam; sem letra, dígito, `_` ou `#` antes, e sem letra, dígito ou `_` depois, para `D450`, `D455`, `AD45`, `D45_` e hash não somarem. O comentário da constante diz isso.

Documentos: a linha "a citação soma o guardião" e a lista de casos de `tasks/prd-harness/tabela-de-guardioes.md`, e a frase da citação em `tasks/prd-harness/techspec.md` §5(b), passam a dizer o mesmo que o código.

**Efeito sobre os arquivos de hoje:** nenhum. Rodei `guardioesDoCaminho` em todo arquivo versionado, com e sem o termo novo: nenhum muda de conjunto. A correção vale para o que vier.

Fora desta correção: o `TODO.md` (marcar a M6 como feita é do Orquestrador, como nas outras).

## Mutações

Código de `tools/processo/`, fora do RF17: os blocos cobrem as cláusulas novas, uma a uma. A retirada de qualquer uma das oito decisões do termo é coberta pelo `it.each` de `a decisão %s soma o conformidade-reviewer…`, uma por caso; por isso só a retirada do 64 tem bloco (o primeiro).

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts › soma o conformidade-reviewer, como a regra 70
-  { termo: /(?<![\w#])D(?:45|47|55|56|57|58|59|64)(?!\w)/, guardiao: C },
+  { termo: /(?<![\w#])D(?:45|47|55|56|57|58|59)(?!\w)/, guardiao: C },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts › não soma
-  { termo: /(?<![\w#])D(?:45|47|55|56|57|58|59|64)(?!\w)/, guardiao: C },
+  { termo: /D(?:45|47|55|56|57|58|59|64)(?!\w)/, guardiao: C },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts › não soma
-  { termo: /(?<![\w#])D(?:45|47|55|56|57|58|59|64)(?!\w)/, guardiao: C },
+  { termo: /(?<![\w#])D(?:45|47|55|56|57|58|59|64)(?!\d)/, guardiao: C },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts › não soma
-  { termo: /(?<![\w#])D(?:45|47|55|56|57|58|59|64)(?!\w)/, guardiao: C },
+  { termo: /(?<![\w#])D(?:45|47|55|56|57|58|59|64)(?!\w)/i, guardiao: C },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts › soma junto com as outras citações
-  { termo: /(?<![\w#])D(?:45|47|55|56|57|58|59|64)(?!\w)/, guardiao: C },
+  { termo: /(?<![\w#])D(?:45|47|55|56|57|58|59|64)(?!\w)/, guardiao: I },
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | O mesmo furo da regra 70 está aberto para a regra 20: as decisões que ela traduz em código (D10, D35, D62, D66) não somam o `privacy-guardian` em arquivo de exceção; "vale registrar como item próprio no `TODO.md`, com a mesma forma do termo (D maiúsculo, sem letra, dígito, `_` ou `#` colado)" | `TODO.md`, item novo (o Orquestrador marca a M6 e abre este). Fora do escopo da M6 e muda o conjunto de guardiões de um arquivo: não é barata |
| privacy-guardian (1ª) e conformidade-reviewer (1ª) | A regra 70 cita também D60, D66, D68 e D70; somar ao termo, tirando D60 da lista `fora` do teste "não soma" | `TODO.md`, o mesmo item novo ou um irmão dele. O escopo da M6 veio fechado nas oito decisões (D45, D47, D55 a D59, D64), e somar muda comportamento e o teste que prende D60 como "não soma" |
| conformidade-reviewer (1ª) | O `d55` minúsculo fica de fora de propósito; "vale lembrar o caso na retro, se algum documento da casa usar minúscula" | Recusada: o comentário da constante e o teste já fixam a escolha. A retro mede se algum documento da casa usa minúscula |
| test-engineer (2ª) e revisor-geral (2ª) | Na seção "Correção", "as do item M6 (a regra 70 cita outras, que ainda não somam) (D45 medir o professor, …)" ficou com dois parênteses seguidos; juntar num só ou passar o primeiro para uma frase própria | Recusada: os dois aprovaram, e recomendação de quem aprova só entra em ordem na primeira ordem do documento. É estilo de uma frase, sem efeito em código nem contrato |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 18:27:32 | 2026-10-24 18:27:51 | `infra-guardian` | 1 | APROVADO | a24798796dbc2f23f |
| 2026-10-24 18:27:34 | 2026-10-24 18:27:55 | `tenancy-guardian` | 1 | APROVADO | a3ccc78be0653a730 |
| 2026-10-24 18:27:33 | 2026-10-24 18:28:01 | `privacy-guardian` | 1 | APROVADO | a705eb56deeb31196 |
| 2026-10-24 18:27:28 | 2026-10-24 18:28:23 | `test-engineer` | 1 | APROVADO | ab1b98f36e9367dbe |
| 2026-10-24 18:27:31 | 2026-10-24 18:28:23 | `conformidade-reviewer` | 1 | APROVADO | a2016ca876f2d42d9 |
| 2026-10-24 18:27:29 | 2026-10-24 18:28:35 | `revisor-geral` | 1 | APROVADO | a36ab00a5363133dc |
| 2026-10-24 18:33:37 | 2026-10-24 18:33:59 | `test-engineer` | 2 | APROVADO | a261d2760ba79b8fe |
| 2026-10-24 18:33:45 | 2026-10-24 18:34:09 | `revisor-geral` | 2 | APROVADO | aeec79cae9d13ed96 |

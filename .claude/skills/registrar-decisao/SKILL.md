---
name: registrar-decisao
description: Registra uma decisão tomada como D<n> em docs/decisoes.md e no índice do CLAUDE.md, com motivo, e propaga para roadmap, docs e decisões em aberto
argument-hint: <a decisão e o motivo, em texto livre>
---

Você transforma uma decisão tomada em conversa em uma decisão **escrita**, numerada e com
motivo, e atualiza os documentos que ela afeta.

A razão de este comando existir está no próprio `CLAUDE.md`: decisão sem motivo é decisão
que volta, e decisão que não está escrita é rediscutida em duas semanas. O segundo motivo é
mais prático: uma decisão registrada só no `CLAUDE.md`, sem mexer no roadmap e nos docs,
cria contradição, e o próximo PRD vai ler a versão errada.

<critical>SÓ REGISTRE O QUE FOI DECIDIDO POR UMA PESSOA. Hipótese, recomendação sua ou
"provavelmente" não entram como decisão: entram, no máximo, em "Decisões em aberto".</critical>
<critical>MOSTRE O DIFF PROPOSTO E AGUARDE CONFIRMAÇÃO ANTES DE EDITAR.</critical>

Entrada: `$ARGUMENTS`

## 1. Entender

Da entrada (ou da conversa, se vier vazia), extraia: o que foi decidido, o motivo, e quem
decidiu. Faltou o motivo: pergunte. É a parte que mais importa.

## 2. Checar conflito

- Contradiz uma decisão D<n> existente? Então é **revisão** dessa decisão, não decisão nova.
  Reescreva a D<n> original e acrescente, no fim do parágrafo, `Revista em <data>: <o que
  mudou e por quê>`. Não crie uma D nova que contradiz uma antiga
- Contradiz uma regra de `.claude/rules/`? Pare e mostre o conflito. Regra 10, 20 e 70 não
  são revogadas por decisão de produto
- Resolve um item de "Decisões em aberto"? Ele sai de lá
- Resolve um conflito que já tinha voltado uma vez? Vai também para "Conflitos já resolvidos"

## 3. Propagar

Liste todo arquivo que precisa mudar para ficar coerente com a decisão:

| Onde | O que verificar |
|---|---|
| `docs/decisoes.md` | texto completo da D<n> nova, ou o `Revista em` da D<n> revista |
| `CLAUDE.md` | linha da D<n> no índice "Decisões tomadas" (nova, ou reescrita se a revisão muda o resumo), "Decisões em aberto", "Conflitos já resolvidos" |
| `ROADMAP.md` | escopo e critério de pronto das funcionalidades afetadas |
| `TODO.md` | item fora do código que foi resolvido ou criado |
| `docs/*.md` | o doc do tema (agentes, ingestão, interface, arquitetura, negócio, lgpd) |
| `.claude/rules/` | só se a decisão muda como uma regra se aplica, nunca para enfraquecê-la |
| `tasks/prd-*/` | PRD ou Tech Spec já escritos que ficaram desatualizados — **não edite**, só aponte |

Procure pelo termo com grep antes de concluir que nada mais é afetado.

## 4. Mostrar e aplicar

Mostre a D<n> redigida e a lista de alterações por arquivo. Com a confirmação, aplique.

Formato da decisão, igual às existentes:

```
**D<n> — <título curto no imperativo ou afirmação>.**
<o que foi decidido, em uma ou duas frases>. <o motivo>.
```

O texto completo vai em `docs/decisoes.md`. No índice do `CLAUDE.md`, uma linha só:
`| D<n> | <a decisão em uma frase, sem o motivo> |`.

Numeração: a próxima depois da maior D existente em `docs/decisoes.md`. Nunca reaproveite número.

## 5. Reportar

```
Registrada: D<n> — <título>
Arquivos alterados: <lista>
Saiu de "em aberto": <item ou nenhum>
Artefatos desatualizados (não editados): <tasks/prd-*/... ou nenhum>
```

Não faça commit. O commit fica com quem pediu.

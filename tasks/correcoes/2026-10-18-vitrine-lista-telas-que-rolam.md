# Correção — a vitrine não diz quais telas têm a página mais alta que a janela de 1366 × 768, e o "só o miolo rola" escapou em duas telas da X2

**Origem:** `tasks/prd-telas-da-coordenacao/retro.md` (`TODO.md`, "(X1, retrospectiva) Código de processo", letra (e)).
**Subagentes obrigatórios:** `revisor-geral`
<!-- Veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca `tools/` e o texto de `.claude/`. -->

## Sintoma

`node tools/vitrine/vitrine.ts foto …` imprime o caminho de cada arquivo e nada sobre a altura da página. Na X2, o RF23
("só o miolo rola": a página não rola, rola a área de conteúdo) só foi conferido pela altura das fotos, contada à mão, e a
página que rolava passou pela Mesa e pelo Validador em duas telas (C1, C2). O `fotografar` já mede a altura
(`alturaDaPagina`) para cortar os pedaços, mas joga o número fora.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso. As letras (b), (g) e o resto da (c) do mesmo item do `TODO.md`
continuam sem fazer. Não decide se a rolagem é defeito: só mostra, e quem lê a foto decide (a tela com tabela comprida rola
por desenho, no celular toda rola).

## Causa

A altura é medida para outra coisa (os pedaços da foto) e fica dentro do `fotografar`: `Foto` não a leva, e o comando não
a imprime. Ver que a página passa da janela dependia de contar os pedaços ou de abrir o PNG.

## Teste que reproduz

`tools/vitrine/foto.test.ts` › `a rolagem a 1366 × 768`: chama `rolaNaJanela` e `relatorioDeRolagem`, que não existem;
vermelho antes (a importação falha).

## Correção

- `tools/vitrine/foto.ts`: `Foto` ganha `alturaDaPagina` e `cliques`; `rolaNaJanela(altura)` diz se a página passa da janela
  do computador (`TELAS[0].altura`, 768); `relatorioDeRolagem(fotos, vazia)` devolve as linhas do relatório, uma por tela
  (endereço e cliques), só com as fotos do computador e uma vez por tela, mesmo que ela tenha saído em pedaços; sem tela que
  rola, diz que nenhuma rola. `linhasDoResultado` junta as linhas dos arquivos e esse relatório.
- `tools/vitrine/vitrine.ts`: imprime `linhasDoResultado`.
- `.claude/skills/revisar-tarefa/SKILL.md`, `.claude/agents/frontend-reviewer.md`, `.claude/agents/validador.md` e
  `.claude/skills/executar-task/SKILL.md`: dizem que o comando termina com essa lista e o que fazer com ela (tela cuja
  página rola e que o PRD diz que só o miolo rola é defeito; a Mesa a repassa no prompt de cada revisor).
- `TODO.md`: a letra (e) feita.

## Mutações

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › a página rola quando a altura passa da janela do computador, e só então
-  return alturaDaPagina > TELAS[0].altura
+  return alturaDaPagina >= TELAS[0].altura
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › a página rola quando a altura passa da janela do computador, e só então
-  return alturaDaPagina > TELAS[0].altura
+  return alturaDaPagina > TELAS[1].altura
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › o relatório lista a tela do computador que rola, uma vez, mesmo em pedaços, e não a do celular
-  const doComputador = fotos.filter((foto) => foto.tela === 'computador')
+  const doComputador = [...fotos]
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › sem foto nenhuma, não há o que dizer
   const doComputador = fotos.filter((foto) => foto.tela === 'computador')
-  if (doComputador.length === 0) return []
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › o relatório lista a tela do computador que rola, uma vez, mesmo em pedaços, e não a do celular
-  for (const foto of doComputador) if (rolaNaJanela(foto.alturaDaPagina)) rolam.set(foto.caminho, foto)
+  for (const foto of doComputador) rolam.set(foto.caminho, foto)
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › o relatório lista a tela do computador que rola, uma vez, mesmo em pedaços, e não a do celular
-rolam.set(foto.caminho, foto)
+rolam.set(foto.arquivo, foto)
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › quando nenhuma tela rola, o relatório diz que mediu e que nenhuma rola
-  if (rolam.size === 0) return [`Nenhuma tela rola a ${JANELA}.${marca}`]
+  if (rolam.size === 0) return []
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › o relatório diz a aba clicada e a escola vazia
-${foto.cliques.length === 0 ? '' : `, depois de clicar ${foto.cliques.join(' e ')}`}
+${''}
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › o relatório diz a aba clicada e a escola vazia
-  const marca = vazia ? ' (escola vazia)' : ''
+  const marca = ''
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › o resultado do comando traz os arquivos, o aviso de redirecionamento e depois o relatório
-    ...relatorioDeRolagem(fotos, vazia),
+    ...relatorioDeRolagem(fotos, false),
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › o resultado do comando traz os arquivos, o aviso de redirecionamento e depois o relatório
-    ...relatorioDeRolagem(fotos, vazia),
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › o resultado do comando traz os arquivos, o aviso de redirecionamento e depois o relatório
-foto.parouEm === new URL(foto.caminho, urlDaWeb).pathname ? '' :
+true ? '' :
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-18 12:14:37 | 2026-10-18 12:15:05 | `revisor-geral` | 1 | APROVADO | a5b2aab2c3298500f |
| 2026-10-18 12:14:36 | 2026-10-18 12:15:34 | `test-engineer` | 1 | REPROVADO | ae3bd3d7cdef5c5e6 |

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › cada foto da tela leva a altura medida e os cliques da chamada, na foto em pedaços e na inteira
-  return arquivos.map((arquivo) => ({ ...tela, arquivo }))
+  return arquivos.map((arquivo) => ({ ...tela, alturaDaPagina: 0, arquivo }))
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › cada foto da tela leva a altura medida e os cliques da chamada, na foto em pedaços e na inteira
-  return arquivos.map((arquivo) => ({ ...tela, arquivo }))
+  return arquivos.map((arquivo) => ({ ...tela, cliques: [], arquivo }))
```
| 2026-10-18 12:19:31 | 2026-10-18 12:20:23 | `test-engineer` | 2 | APROVADO | abafd4548e807d7de |
| 2026-10-18 12:19:34 | 2026-10-18 12:20:31 | `revisor-geral` | 2 | APROVADO | ad6f0f51f44245ca0 |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | `foto.ts`: página redirecionada (`parouEm` ≠ `caminho`) entra no relatório com o endereço pedido e a altura de onde parou; deixar a foto fora do relatório ou marcar "(parou em …)" | Muda o comportamento do relatório, com formato e teste novos; as linhas de arquivo já avisam do redirecionamento. Declarada em "Limites" da letra (e) do `TODO.md` |
| test-engineer (1ª) | Altura velha no `catch` de `fotografar`: medir de novo antes de gravar a foto inteira | Muda o comportamento da medida e não se prova sem página que cresce no meio da foto. Declarada em "Limites" da letra (e) do `TODO.md` |
| test-engineer (1ª) | Ligação do `vitrine.ts` (`linhasDoResultado(fotos, vitrine.url, vazia)`) sem teste | Já declarada em "Limites" do `TODO.md`; o próprio revisor a chama aceitável (só impressão) |
| test-engineer (2ª) | `foto.ts` (a medida montada em `fotografar`) continua sem teste; anotar como item aberto, não só como limite | Já declarada em "Limites" da letra (e) do `TODO.md`: só se prova com um teste do `fotografar` com a web de pé, que não existe e fica fora desta correção. Quem criar esse teste de infra fecha o limite |
| test-engineer (2ª) e revisor-geral (2ª) | Os dois blocos `mutacao` novos estão depois da tabela de "## Revisões"; mover para "## Mutações" | Recusada: mover mexe dentro da seção "Revisões", que só o hook escreve (protocolo, item 5), e o hook lê o documento até o fim, então as rodadas valem e o commit não é bloqueado. O custo é só a tabela partida no markdown renderizado. Fica para a `/retro`: bloco de mutação novo entra antes de "## Revisões" |
| test-engineer (2ª) | "Limites" diz que no `catch` a altura pode ficar velha; medir de novo dentro do `catch` resolve se causar engano | Mesma entrada da 1ª rodada: declarada em "Limites" do `TODO.md`, sem ação agora |
| revisor-geral (2ª) | Tirar o comentário "O que o relatório mostra é o que foi medido, não outra altura qualquer." do caso novo de `foto.test.ts` | Recusada: é comentário em arquivo de teste e tirá-lo caducaria a rodada de dois revisores por ganho nenhum |

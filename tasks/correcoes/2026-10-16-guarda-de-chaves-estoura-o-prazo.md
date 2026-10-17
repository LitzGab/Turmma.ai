# Correção — o teste que compara as chaves da guarda com as do redact do logger estoura os 5 s do Vitest com a máquina carregada

**Origem:** teste intermitente: `tools/guardas/guardas.test.ts › guarda de log com dado pessoal › a guarda conhece as mesmas chaves que o redact do logger remove` falhou nos dois portões da 2ª ordem de correção da tarefa 4.0 da `spec/telas-da-coordenacao--l2`, em `Test timed out in 5000ms`. Isolado, passa.
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: nenhum além de test-engineer e revisor-geral; privacy-guardian entra se a asserção ou o logger mudar (não mudam). -->

## Sintoma

O teste falha por tempo, e não por asserção, quando o portão roda a unidade inteira com a máquina ocupada. Rodado sozinho, leva cerca de 1 s.

## Fora desta correção

Os arquivos da tarefa 4.0 em curso, que ficam na árvore e não entram na revisão nem no commit desta correção: `TODO.md`, `apps/web/src/areas/coordenacao/Analista.tsx`, `DadoNominal.tsx`, `Governanca.tsx`, `apps/web/src/componentes/estado/EstadoVazio.tsx`, `estados.test.tsx`, `e2e/analista.spec.ts`, `e2e/governanca.spec.ts`, `tasks/prd-telas-da-coordenacao/4_task.md`, `achados/indice.md`, `techspec.md`, e os novos `apps/web/src/areas/coordenacao/Analista.test.tsx` e `tasks/prd-telas-da-coordenacao/achados/4_task.md`.

## Causa

**Tempo, e é o do `import()`.** O teste importa `@educa/nucleo` por variável (o `tsconfig` de `tools` não compila o núcleo) para ler `CHAVES_PESSOAIS`. O ponto de entrada do pacote é o índice inteiro, que reexporta banco, fila, storage S3 e o resto: a primeira transformação do Vite pesa, e o prazo de 5 s do Vitest corre sobre ela. Medido aqui:

| Condição | Tempo do teste |
|---|---|
| sozinho, máquina com carga 12 | ~1,1 s |
| 6 execuções ao mesmo tempo | 2,3 a 2,4 s |
| 24 execuções ao mesmo tempo | **5,0 a 5,2 s: 24 de 24 estouram** |

A unidade inteira roda dezenas de arquivos em paralelo, e o portão roda ao lado do compose de teste e de outros terminais: é o caso das 24 execuções. O que o teste afirma está certo e não depende do tempo.

Não se troca o import: o caminho curto (`log/logger.ts`) não é exportado pelo pacote, e importar por caminho relativo faria o teste ler outro módulo que não o que a API usa. Também não se muda a asserção.

## Teste que reproduz

O próprio teste, sob carga: `npx vitest run --project unidade tools/guardas/guardas.test.ts -t "mesmas chaves"` em 24 execuções ao mesmo tempo. **Vermelho antes** (`Test timed out in 5000ms`): 24 de 24. Não há como reproduzir o relógio do portão de forma determinística, e a carga das 24 execuções é a evidência que o substitui.

**Verde depois**, com a mesma carga: 24 de 24 passam, de 8,3 a 9,7 s (o pior caso fica a mais de seis vezes de folga dos 60 s). Estabilidade: o teste sozinho, dez vezes seguidas, 10 de 10 verdes.

## Correção

`tools/guardas/guardas.test.ts`: o teste ganha prazo próprio de 60 s (terceiro argumento do `it`), com um comentário que diz de quem é o tempo. A asserção (`toEqual` das duas listas de chaves, ordenadas) fica como estava. Nada de produto muda. Na rodada 1 o comentário foi para junto do `import()` que causa a demora, sem a frase sobre a asserção.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª), test-engineer (1ª) | Exportar `CHAVES_PESSOAIS` por um subcaminho leve de `@educa/nucleo`, para o teste não carregar o índice inteiro (banco, fila, storage) | Não aplicar: muda o contrato do pacote e a correção declara que o import e a asserção não mudam. Destino: `/retro` (o test-engineer o pediu); vira tarefa se outro teste da unidade importar o núcleo pelo índice |
| test-engineer (1ª) | Com 60 s, um import travado de verdade leva 60 s para ficar vermelho em vez de 5 s | Sem ação: é registro do próprio revisor, aceito por ele. Segue o prazo de `apps/api/test/ataque-de-senha.int.test.ts`. Destino: `/retro` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.
| 2026-10-16 23:22:06 | 2026-10-16 23:22:21 | `revisor-geral` | 1 | APROVADO | a6a6cb0244be46ac3 |
| 2026-10-16 23:22:04 | 2026-10-16 23:22:29 | `test-engineer` | 1 | APROVADO | a0505b890d777cdef |
| 2026-10-16 23:26:49 | 2026-10-16 23:26:59 | `revisor-geral` | 2 | APROVADO | aa32c1df7e0e5d9ad |

# Correção — o caso do e2e em que o professor abre os endereços da coordenação e do aluno junta seis cargas de página e passa dos 30 s da esteira

**Origem:** esteira run 39129521729, em `93e787e` (job e2e 4/6): `e2e/areas.spec.ts:204` `[celular]`, `o professor no endereço da coordenação e do aluno cai em "não encontrada", sem baixar a área deles`, `Test timeout of 30000ms exceeded` (30,3 s).
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. A correção altera 1 arquivo fora de `tasks/`: abaixo do limite do `revisor-geral`. -->

## Sintoma

O caso entra como professora pela tela (`entrarComoProfessora`: a tela de entrada, a senha e "Início"), abre por `page.goto` os quatro
endereços da coordenação e depois o do aluno, e confere em cada um a "não encontrada" e, no fim, que nenhum chunk da coordenação nem do
aluno foi pedido. No `celular` da esteira levou 30,3 s e estourou o prazo; o irmão `:231`, com uma entrada e uma carga, levou 23,8 s.

## Fora desta correção

Nada: a árvore estava limpa ao receber o pedido.

## Causa

Falta de folga de tempo, e não de comportamento: o caso fazia **seis cargas de página** (a entrada, os quatro endereços da coordenação e
o do aluno) mais a entrada pela tela. No Chromebook de teste (CPU ×4, Fast 3G) uma carga leva uns 4 s só do `goto` e a entrada pela tela
leva uns 9 s, e a soma fica perto do prazo mesmo sem nada de errado. Medido aqui, só o caso, um worker: 25,6 s no `chromebook` e 27,5 s no
`celular`; o runner da esteira leva perto do dobro do tempo da máquina, e o caso passou da folga. A falha apareceu depois da tarefa 1.0
(`cb209b5`, o sino do professor), que faz o sino ler os vínculos em cada carga de página da professora e acrescenta custo às seis
cargas do caso; não medi o caso antes dela. A divisão de `37245636814` já tinha tirado deste caso o endereço que não existe, pelo
mesmo motivo.

O portão da tarefa reprova caso de e2e **alterado** que passa de 15 s (`tools/ci/duracao-do-e2e.ts`): tocar neste caso pede dividi-lo, e
dividir sem entrar pela tela de novo em cada pedaço não adianta, porque a entrada é metade do tempo.

## Teste que reproduz

O próprio caso antigo, medido: 25,6 s (`chromebook`) e 27,5 s (`celular`) isolado, e 30,3 s na esteira — acima dos 15 s do portão e
no limite do prazo de 30 s. A prova do depois é a mesma medida: os dez casos novos de `e2e/areas.spec.ts` (por projeto, quatro de
`o professor no endereço da coordenação em <tela> cai em "não encontrada", sem baixar a área dela nem a do aluno` e um de `o professor
no endereço do aluno cai em "não encontrada", sem baixar a área dele nem a da coordenação`) levam de 3,7 a 4,5 s cada. A prova de que
cada um ainda morde está nas mutações abaixo.

## Correção

Só teste, em `e2e/areas.spec.ts`; o código da web não muda. O caso único virou **cinco casos**, um por endereço, e cada um entra pela
API (`entrarPelaApi`: `POST /v1/sessao/email`, o cookie fica na aba) em vez de pela tela de entrada, como `abrirJaEntrando` faz em
`acesso-da-turma.spec.ts`. A entrada pela tela continua provada nos outros casos do arquivo.

| Caso novo | Asserções do caso original que leva |
|---|---|
| o professor no endereço da coordenação em Governança, em uma turma da Estrutura, em Professores e em Painel, quatro casos | a "Página não encontrada" à vista, nenhum título de tela da coordenação (Governança, Estrutura, Professores, Painel), o título da aba, o "Sair" à vista e nenhum pedido do chunk da coordenação nem do aluno |
| o professor no endereço do aluno | a "Página não encontrada" à vista e nenhum pedido do chunk do aluno nem do da coordenação |

O que muda, e é dito aqui: o pedido de chunk deixa de ser somado numa lista só dos cinco endereços e passa a ser conferido em cada um
(mais forte, não mais fraco: um endereço que baixasse a área já reprova o seu caso); e a professora deixa de passar por "Início" antes
de cada endereço, o que o caso nunca quis provar.

## Mutações

A guarda de papel é a única coisa que separa o professor da área da coordenação e da do aluno (`AreaDoPapel`, `apps/web/src/rotas.tsx`):
sem ela, o professor ganha a área, o chunk é pedido e a "não encontrada" some. Cada bloco prova um dos dois lados dos casos novos.

```mutacao
arquivo: apps/web/src/rotas.tsx
teste: e2e/areas.spec.ts › o professor no endereço da coordenação em Painel cai em "não encontrada", sem baixar a área dela nem a do aluno
-  if (papelDaSessao !== papel) return <ConteudoNaoEncontrado />
```

```mutacao
arquivo: apps/web/src/rotas.tsx
teste: e2e/areas.spec.ts › o professor no endereço da coordenação em uma turma da Estrutura cai em "não encontrada", sem baixar a área dela nem a do aluno
-  if (papelDaSessao !== papel) return <ConteudoNaoEncontrado />
```

```mutacao
arquivo: apps/web/src/rotas.tsx
teste: e2e/areas.spec.ts › o professor no endereço do aluno cai em "não encontrada", sem baixar a área dele nem a da coordenação
-  if (papelDaSessao !== papel) return <ConteudoNaoEncontrado />
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Um bloco de mutação também para o caso de Governança | Recusada: mesmo laço e mesma linha de guarda que o Painel e a Estrutura, que já têm bloco; outro bloco só repete a mutação e soma um ciclo ao portão |
| frontend-reviewer (1ª) | Um bloco de mutação também para o caso de Professores | Recusada: pelo mesmo motivo do de Governança |
| 2026-10-18 14:21:10 | 2026-10-18 14:21:34 | `frontend-reviewer` | 1 | APROVADO | aff839a45ce65369f |
| 2026-10-18 14:21:14 | 2026-10-18 14:22:10 | `test-engineer` | 1 | APROVADO | a244f873ea16339bd |

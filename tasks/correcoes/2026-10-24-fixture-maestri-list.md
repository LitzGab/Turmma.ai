# Correção — a fixture de `maestri list` vinha do terminal do Implementador e não tinha as linhas numeradas

**Origem:** recomendação do `test-engineer` (1ª rodada) e do `privacy-guardian` (2ª) da tarefa 20.0, em `tasks/prd-harness/20_task.md`, "Recomendações sem aplicar" (linhas 274 e 277); ensaio do RF31, do Orquestrador no fechamento.
**Subagentes obrigatórios:** `privacy-guardian`, `test-engineer`, `revisor-geral`
<!-- O `privacy-guardian` veio no PEDIDO do Orquestrador (o repositório é público e a fixture é saída de máquina). O `test-engineer` é de toda correção. O `revisor-geral` entra porque a correção altera `tools/processo/` (passo 5 de `corrigir`). -->

## Sintoma

`tools/processo/__fixtures__/maestri-list.txt` foi gravada no terminal do Implementador (tarefa 20.0) e só traz `Implementador` e
`Mesa` ligados. O `maestri list` do Orquestrador, onde a vigia roda de verdade, lista os quatro papéis, as linhas numeradas
(`Implementador 2`, `Mesa 3`), um terminal que não é do time (`Claude Code #2`) e as linhas `⎿` de quem está ligado a quem. O teste
`a saída real do maestri list (RF28)` só afirmava `['Mesa']`: a regex `TERMINAL_DO_TIME` (com `( \d+)?`) e o filtro do terminal
estranho não eram provados contra a saída real.

## Fora desta correção

A correção é só a fixture e a asserção que a lê (`vigia.test.ts`). `vigia.ts` não muda, e nenhum outro arquivo de código entra.
A árvore estava limpa.

## Causa

A fixture foi gravada onde havia terminal: a 20.0 rodou no Implementador, e só o terminal do Orquestrador vê a lista com as linhas
numeradas. A asserção ficou curta (`['Mesa']`) pelo mesmo motivo. Não há defeito em `vigia.ts`: o código já lê a lista inteira, o
que faltava era a prova contra a saída real.

Conferência de privacidade antes de gravar (o repositório é público): a saída crua tem 23 linhas e só traz nomes de papel do time,
`Claude Code` e `Claude Code #2`, o nome da nota (`Comandos`) e o portal `Vitrine computador` com `http://127.0.0.1:28090`
(endereço de loopback, sem credencial). Não tem caminho com nome de usuário, título de sessão, hash, e-mail nem token. Foi gravada
como saiu, sem edição.

## Teste que reproduz

`tools/processo/vigia.test.ts` › `a saída real do maestri list (RF28)` › `lê os terminais do time entre os agentes ligados, com as linhas numeradas, e deixa de fora o que não é do time`:
agora afirma a lista inteira (`Arquiteto`, `Implementador`, `Mesa`, `Validador`, `Implementador 2`, `Mesa 2`, `Implementador 3`,
`Mesa 3`), e que `Claude Code #2` e a nota `Comandos` estão na fixture e ficam de fora. Vermelho com a fixture antiga, verde com a nova.

Dois testes irmãos, no mesmo `describe`, vieram da rodada 1:

- `não lê o bloco "You"`: a fixture do Orquestrador tem só `Claude Code` no `You:`, que o filtro de papel já descartaria. A
  exclusão do bloco `You:` é provada pela fixture real **com um papel posto no `You:`** (`Implementador`), que dá o mesmo
  resultado; sem o corte em `Connected agents:`, ele entraria duas vezes. Antes, essa prova vinha da fixture antiga (que tinha
  `Implementador` no `You:`) e do caso sintético da linha 35; a fixture nova sozinha não a dá, e agora o teste a faz.
- `a fixture não leva caminho de usuário, e-mail nem endereço fora do loopback`: falha com `/home/`, `/Users/`, `C:\`, `~/`,
  e-mail ou URL fora de `127.0.0.1` e `localhost`. Provado vermelho acrescentando à fixture uma linha com `/home/`, e-mail e URL
  externa (restaurada em seguida). A conferência de quem regrava a fixture deixa de depender só da revisão.

## Correção

Regravada `tools/processo/__fixtures__/maestri-list.txt` com a saída do `maestri list` do terminal do Orquestrador, e a asserção
passou a cobrir a lista inteira. Nenhum código de produção mudou, e por isso não há bloco `mutacao`.

**Sem mutação:** não altera arquivo de `apps/*/src` nem de `packages/*/src`; só uma fixture e o teste que a lê.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | "As duas recomendações de origem, `test-engineer` (1ª rodada) e `privacy-guardian` (2ª) em `tasks/prd-harness/20_task.md:274` e `:277`, foram atendidas… Na validação, vale marcar que essa parte do ensaio do RF31 já foi feita, para não ser refeita no fechamento." | Não é mudança de código nem de texto desta correção: é aviso ao Validador. Fica registrado aqui; o Orquestrador leva ao Validador no fechamento da spec. Nada a aplicar. |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 02:44:19 | 2026-10-24 02:44:38 | `privacy-guardian` | 1 | APROVADO | a6cbaa266f5c91c60 |
| 2026-10-24 02:44:21 | 2026-10-24 02:44:41 | `revisor-geral` | 1 | APROVADO | a41bc2237bc0c307b |
| 2026-10-24 02:44:20 | 2026-10-24 02:45:02 | `test-engineer` | 1 | APROVADO | a9469033750a05a32 |
| 2026-10-24 02:50:43 | 2026-10-24 02:51:00 | `revisor-geral` | 2 | APROVADO | abdb2548bf870ed90 |
| 2026-10-24 02:50:32 | 2026-10-24 02:51:14 | `test-engineer` | 2 | APROVADO | ab125b893e5e88884 |

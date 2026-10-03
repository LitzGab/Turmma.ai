# Correção — o pedido decidido continua marcado quando a lista sem ele não chega a ser desenhada, e o foco não vai ao título ao fechar

**Origem:** esteira run 37080632880 (job "e2e (compose completo e Playwright)"), sobre o commit `45af31a` (tarefa 16.0 da A1)
**Subagentes obrigatórios:** frontend-reviewer
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`[chromebook] e2e/pedidos.spec.ts:491` (W6, "o 41º pedido não é marcável…") falhou na linha 612:

```
Error: expect(locator).toBeFocused() failed
Locator:  getByRole('main').getByRole('heading', { name: 'Pedidos de nome' })
Received: inactive
```

O mesmo teste passou no `celular` da mesma execução e em três portões locais. O traço do Playwright da esteira
(artefato `traco-do-e2e`) mostra, nas fotografias do DOM depois da resposta da decisão e até o clique em "Fechar", a seção
com os 41 pedidos, **40 deles ainda marcados** e os botões "Aprovar 40 pedidos" e "Recusar 40 pedidos" de pé atrás do
diálogo. Fechado o diálogo, o foco voltou ao "Aprovar 40 pedidos" da seção (quem abriu, ainda na página), e não ao título;
a releitura de 15 s tirou os decididos logo depois, o botão saiu, e o foco ficou no `body`.

## Causa

A marcação só perdia os pedidos decididos **numa renderização** da `ListaDePedidos`: o bloco que roda quando `dados`
muda (`pedidosQueContinuam(marcados, dados.itens)`). Depois da decisão, o `aplicarDecisao` tira os decididos da lista no
cache (`setQueryData`) e pede a releitura (`invalidateQueries`). O TanStack Query entrega as duas mudanças à tela por um
`setTimeout(0)` (`notifyManager`), e quando a resposta da releitura chega antes dessa entrega, a tela é desenhada uma vez
só, com a lista final. Se essa lista ainda traz os decididos — no W6, a leitura está parada no que a tela tinha
(`parar = true`), de propósito, para o diálogo continuar com os pedidos que outra pessoa decidiu —, a lista sem eles
nunca é desenhada, a marcação fica com os 40, os botões de decisão continuam, e o `Dialogo` devolve o foco ao botão que
abriu em vez de usar o `focoDeReserva` (o título).

Não é tempo nem espera fixa: é a regra "o decidido sai da marcação" depender de a tela ver um estado intermediário. No
Chromebook da esteira, com o relógio da aba instalado pelo teste (`page.clock.install()`, que também troca o
`setTimeout` do `notifyManager`), a entrega atrasou o bastante para a releitura de 5 ms chegar antes. Para a professora,
com o servidor de verdade, a releitura vem sem os decididos e o defeito não aparece; mas a marcação continuaria certa só
por sorte da ordem de chegada, e uma releitura que traga o decidido de volta o mostraria marcado, com o botão de decidir
de novo.

O mesmo padrão (leitura parada devolvendo a lista velha depois de uma decisão) só existe no W6; a coordenação usa a mesma
`ListaDePedidos` e fica coberta pela mesma correção. Os outros diálogos com `focoDeReserva` (Professores, Acesso,
Estrutura, Escolas da operação) tiram o botão que abriu com a releitura real do servidor, sem marcação local.

## Teste que reproduz

`e2e/pedidos.spec.ts › recomeço da tela dos pedidos › decisão e releitura desenhadas juntas: o pedido decidido sai da
marcação mesmo que a tela nunca desenhe a lista sem ele, e ao fechar o foco vai ao título da seção`.

Torna determinística a ordem que a esteira teve por acaso: com a leitura parada na lista que a tela tem, o teste para o
relógio da aba (`page.clock.pauseAt`) antes de confirmar, espera a resposta da decisão e a releitura pedida por ela, e só
então solta o relógio; o TanStack Query entrega tudo à tela de uma vez. Antes da correção, 6 de 6 execuções vermelhas
(`--repeat-each 3`, nos dois projetos) em `expect(caixa(page, ana.nome)).not.toBeChecked()`; depois, 10 de 10 verdes
(`--repeat-each 5`). A regra pura está também em `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.test.ts`
("a resposta da decisão tira da marcação cada id dela…").

O teste depende de o `aoDecidir` chegar pelo `onSuccess` das opções do `useMutation` (`DialogoDeDecisao.tsx`), que roda
na cadeia de promessas da mutação: se ele passar para os callbacks do `mutate`, que o TanStack Query entrega por
`setTimeout`, o teste trava com o relógio parado. A releitura que o teste espera é só a que sai depois da resposta da
decisão; uma de 15 s que saia antes não abre a espera.

## Correção

`semOsDecididos(marcados, resposta)` em `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts`: todo id da
resposta da decisão (`decidida`, `ja_decidida` ou `nao_encontrada`) sai da marcação. A `ListaDePedidos` a aplica no
`aoDecidir`, antes do `aplicarDecisao`, com atualização funcional do estado: o decidido deixa de estar marcado na
resposta da decisão, e não na renderização seguinte da lista. Uma lista velha que ainda o traga o mostra desmarcado, sem
os botões de decisão, e o foco ao fechar vai ao título pela reserva, como o W6 já pedia. O W6 não mudou: com a correção
ele deixa de depender da ordem de entrega.

## Recomendações sem aplicar

- Repetir o e2e novo com a coordenação (`test-engineer` 1ª, `frontend-reviewer` 1ª): recusada por ora. A coordenação usa
  a mesma `ListaDePedidos`, com o mesmo `aoDecidir`; vale repetir se um dia ela tiver um `aoDecidir` próprio.
- A ligação de `semOsDecididos` na `ListaDePedidos` é provada só pelo e2e (`test-engineer` 1ª): fica assim, porque a web
  não tem ambiente de DOM na unidade e o e2e foi visto vermelho; anotada para o `/retro`.
- Trocar o ouvinte `page.on('response')` pelo `waitForResponse` já existente (`test-engineer` 2ª): recusada. As duas
  esperas têm papéis diferentes (a rota precisa saber, sem esperar, se a decisão já respondeu), e o ouvinte não muda o
  que o teste prova.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.
| 2026-10-03 13:18:13 | 2026-10-03 13:19:10 | `test-engineer` | 1 | APROVADO | a163574298f1b3d70 |
| 2026-10-03 13:19:51 | 2026-10-03 13:20:16 | `test-engineer` | 2 | APROVADO | aafd564603f1e08e7 |
| 2026-10-03 13:20:23 | 2026-10-03 13:20:54 | `frontend-reviewer` | 1 | APROVADO | a9a5e24588069b928 |
| 2026-10-03 13:52:31 | 2026-10-03 13:52:40 | `test-engineer` | 3 | APROVADO | a71c83eb544ceb358 |

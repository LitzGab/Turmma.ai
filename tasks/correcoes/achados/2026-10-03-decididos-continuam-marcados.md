# Achados das revisões — `tasks/correcoes/2026-10-03-decididos-continuam-marcados.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-03 13:19:10 · `tasks/correcoes/2026-10-03-decididos-continuam-marcados.md`

VEREDITO: APROVADO

**Cenários exigidos**
1. A decisão e a releitura aparecem na tela na mesma renderização, e a releitura ainda traz o pedido decidido. Nesse caso o decidido precisa ficar desmarcado, os botões de decisão precisam sumir e, ao fechar, o foco vai ao título "Pedidos de nome".
2. Na regra pura, todo id da resposta sai da marcação, seja `decidida`, `ja_decidida` ou `nao_encontrada`, e os ids de fora da decisão continuam marcados.
3. Uma resposta vazia não mexe na marcação.
4. Uma lista velha que ainda traz o decidido não volta a marcá-lo.
5. Depois, a releitura que vem do servidor tira o decidido da lista, o foco continua no título e o banco fica com só um aluno aprovado.
6. O W6, com 41 pedidos, deixa de depender da ordem em que as coisas chegam à tela.

**Cobertos**
- **Cenário 1:** é o teste novo em `e2e/pedidos.spec.ts`, no bloco "recomeço da tela dos pedidos", a partir da linha 904.
  - Ele reproduz a causa: com o relógio da aba parado, o TanStack Query não desenha nada até o teste esperar a resposta da decisão e a releitura (que ainda traz a Ana). Depois disso, a lista desenhada é só a final.
  - Sem a correção, ele falha. A única outra limpeza da marcação, `pedidosQueContinuam(marcados, dados.itens)` em `ListaDePedidos.tsx:84`, só filtra pela lista desenhada. Como a lista velha ainda traz a Ana, ela continuaria marcada e o teste quebraria em `not.toBeChecked()`. Isso bate com as 6 de 6 execuções vermelhas que o documento registra.
  - As asserções são sobre o resultado: a caixa da Ana desmarcada, o único botão da seção sendo "Fechar", o foco no título ao fechar e no fim, e a contagem no banco.
- **Cenários 2, 3 e 4:** estão em `atualizacao-dos-pedidos.test.ts:148`. O teste quebra se a regra for apagada ou se ela passar a tirar só o resultado `decidida`. Rodei o arquivo e os 14 testes passaram.
- **Cenário 5:** está no fim do teste novo (`passarOIntervalo`, depois a lista só com o Bruno, o foco no título e o banco).
- **Cenário 6:** o W6 continua sem mudança e passa a ser determinístico.
- Não encontrei `.skip`, teste comentado nem mock que esconda a regra. A interceptação de rede só congela a leitura, que é a condição que o teste precisa criar, e a decisão chega ao servidor de verdade. O teste não chama IA.

**Bloqueantes:** nenhum.

**Recomendações**
1. **Risco de verde falso** (`e2e/pedidos.spec.ts`, no `page.clock.pauseAt(... + 1_000)`). O `pauseAt` adianta o relógio em 1 s, e isso dispara qualquer temporizador que vença nesse segundo. Isso inclui a releitura de 15 s (`agendarAtualizacao`) se a montagem do teste no Chromebook da esteira chegar perto de 14 s desde a última leitura. Nesse caso, essa leitura abriria o `releu` antes da decisão, e o teste deixaria de forçar a ordem que quer provar. Não fica vermelho por acaso; o risco é passar sem provar nada. Duas saídas: fazer o portão contar só a leitura que vem depois da resposta da decisão (abrir o `releu` só depois do `decidiu`), ou pausar no instante atual em vez de +1 s.
2. **A ligação no componente só é provada pelo e2e.** Tirar o `definirMarcados((atuais) => semOsDecididos(atuais, resposta))` de `ListaDePedidos.tsx:212` não quebra nenhum teste unitário, só o e2e novo. É aceitável porque o e2e foi visto vermelho, mas vale anotar para o `/retro`.
3. **Coordenação.** Ela usa o mesmo componente e está coberta pelo mesmo código, mas não há e2e da coordenação com a releitura congelada. Pode ser cobertura extra, sem bloquear.
4. **Documento da correção.** Vale registrar a dependência de o `onSuccess` estar nas opções do `useMutation` (`DialogoDeDecisao.tsx:59`), e não nos callbacks do `mutate`. Se ele mudar para lá, o callback passa a ser entregue por `setTimeout` e o teste novo trava com o relógio parado.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-03-decididos-continuam-marcados.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/ListaDePedidos.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/pedidos.spec.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-10-03 13:20:16 · `tasks/correcoes/2026-10-03-decididos-continuam-marcados.md`

VEREDITO: APROVADO

Cenários exigidos (para esta rodada, contra o diff desde a 1ª rodada aprovada):
- A espera `releu` só abre com a releitura que a decisão pede. Uma leitura de 15 s que saia antes da decisão não pode abrir.
- O teste continua falhando sem a regra: sem `semOsDecididos` no `aoDecidir`, a lista velha ainda traz a Ana marcada e `expect(caixa(page, ana.nome)).not.toBeChecked()` fica vermelho.
- O documento registra a dependência nova e o que a espera prova.

Cobertos:
- **Recomendação 1 (feita).** Em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/pedidos.spec.ts:921-930` o diff faz o que eu pedi. `decidido` só vira verdadeiro com a resposta do `POST /v1/reivindicacoes/decidir`, e a rota de leitura parada só chama `releu.abrir()` depois disso. Essa ordem se sustenta por três motivos:
  - O POST não passa por `page.route`, e o evento `response` dele chega ao lado do Playwright antes de o navegador pedir a releitura, que só sai depois que a resposta da decisão é processada no `onSuccess`.
  - Com o relógio da aba parado em `pauseAt`, nenhuma leitura de 15 s sai entre `parar = true` e o clique.
  - Se a releitura não vier, `await releu.aberta` trava e o teste estoura o `setTimeout(180_000)`. A falha aparece, não fica escondida.
- **Mutação.** A asserção que prova a regra não mudou (`not.toBeChecked()`, o botão único "Fechar" e o foco no título). O diff só estreita a espera e não enfraquece nenhuma asserção. O documento registra 6 de 6 vermelhas antes da correção e 10 de 10 verdes depois, e a regra pura continua coberta em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.test.ts`.
- **Recomendação 4 (feita).** `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-03-decididos-continuam-marcados.md:57-60` registra a dependência do `onSuccess` nas opções do `useMutation`, o modo de falha se ele passar aos callbacks do `mutate` (o teste trava com o relógio parado) e que a espera só conta a releitura posterior à decisão.
- Não há `.skip`, teste comentado nem mock de coisa nossa. A interceptação devolve a resposta real do servidor (`rota.fetch()`) e só repete a última quando `parar` está ligado. O teste não chama provedor de IA.

Bloqueantes: nenhum.

Recomendações:
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/pedidos.spec.ts:923-925` o ouvinte `page.on('response', …)` fica registrado até o fim do teste. Não causa erro, porque `decidido` só é lido enquanto `parar` está ligado. Trocar por `page.waitForResponse` reaproveitando o `decidiu` (linha 942) deixaria uma espera só, em vez de duas que observam a mesma resposta.
2. O portão local com `--e2e` ainda estava rodando quando você pediu esta rodada. Confira que ficou verde nos projetos `chromebook` e `celular` antes do commit, porque a mudança é justamente na sincronização do e2e.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-03 13:20:54 · `tasks/correcoes/2026-10-03-decididos-continuam-marcados.md`

VEREDITO: APROVADO

Estados: ok. A correção não mexe em carregando, vazio, erro nem com dado.

Acessibilidade: o foco agora volta ao título por um caminho que não depende da ordem em que as respostas chegam. Antes, se a lista sem os pedidos decididos nunca chegasse a ser desenhada, eles continuavam marcados e o botão "Aprovar N pedidos" ficava de pé atrás do diálogo. Ao fechar, o `Dialogo` devolvia o foco a esse botão e não usava a reserva. Agora o `aoDecidir` tira da marcação, já na resposta da decisão, todo pedido que veio nela (`decidida`, `ja_decidida`, `nao_encontrada`). Com isso, quando o diálogo fecha, a seção não tem mais o botão que o abriu, e o `focoDeReserva` leva o foco ao título "Pedidos de nome" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/ListaDePedidos.tsx:212` e `:221`). O e2e novo verifica a caixa desmarcada, que o único botão da seção é o "Fechar" e que o foco vai ao título. Também verifica que o foco continua lá depois da atualização seguinte.

Chromebook fraco: a correção acaba com a dependência de quando o TanStack Query entrega a mudança à tela, que era o que só aparecia no Chromebook da esteira. Não acrescenta nenhuma renderização: é uma atualização de estado a mais, no mesmo lote da decisão.

Celular: o e2e novo recebe `hasTouch`, usa `tocar` e roda nos dois projetos. O documento registra 10 de 10 execuções verdes.

Ação oficial protegida: sim. A confirmação continua no diálogo, com a turma, os nomes e o efeito. Os ids da decisão continuam sendo os que estavam marcados quando o diálogo abriu (`aberta.alvo`), e não a marcação atual, então tirar itens da marcação não muda o que é enviado nem o que o diálogo mostra.

Conferi os quatro pontos que você pediu:
- **A marcação perde os decididos já na resposta.** `semOsDecididos` usa atualização funcional antes do `aplicarDecisao`. Na renderização seguinte, o bloco que roda durante a renderização (`ListaDePedidos.tsx:84`) já recebe `marcados` sem esses ids, então uma lista velha que ainda traga o pedido o mostra desmarcado. A regra tem teste de unidade, que cobre os três tipos de resultado e a resposta vazia.
- **O foco vai ao título pela reserva.** Confirmado, como descrito em Acessibilidade.
- **A coordenação também fica coberta.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx` usa a mesma `ListaDePedidos`, com o mesmo `aoDecidir` e o mesmo `focoDeReserva`.
- **Não há regressão em marcar, desmarcar, no limite de 40 nem na atualização de 15 s.** `alternar`, `podeMarcarMais` e o corte por `pedidosQueContinuam` não mudaram. A correção só tira ids, nunca acrescenta, e por isso não tem como passar do limite. Quando a decisão falha (`aoFalhar`), a marcação fica como estava e a lista é descartada e relida, como antes. O W6, que testa o limite de 40, não foi alterado.

Bloqueantes: nenhum.

Recomendações:
- O e2e novo roda só com a professora. A coordenação passa pelo mesmo código e não precisa de outro teste agora. Se um dia ela tiver um `aoDecidir` próprio, vale repetir o cenário para ela.
- O e2e depende de o `aoDecidir` ser chamado pelo `onSuccess` do `useMutation` (`DialogoDeDecisao.tsx:59`). O documento da correção registra isso, mas o próprio arquivo não. Um comentário curto nessa linha evita que alguém mude para o callback do `mutate` e o teste trave sem explicação.

## test-engineer · 3ª rodada · APROVADO · 2026-10-03 13:52:40 · `tasks/correcoes/2026-10-03-decididos-continuam-marcados.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª e da 2ª rodada. Nesta rodada só confiro o diff que entrou depois da 2ª aprovação:
- o comentário em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:59-61`;
- a seção "Recomendações sem aplicar" em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-03-decididos-continuam-marcados.md:71-79`.

Cobertos:
- **O comentário não muda comportamento.** O `onSuccess: aoDecidir` e o `onError: aoFalhar` continuam onde estavam, nas opções do `useEnvioUnico`/`useMutation`. Nenhum teste é afetado, e o que a 2ª rodada aprovou continua valendo.
- **O comentário bate com o código.** A dependência que ele anota existe: o e2e de pedidos para o relógio da aba e conta com o `aoDecidir` rodando antes de a tela ver o resultado. Era a minha recomendação 4 da 1ª rodada, e foi atendida.
- **A seção de recomendações registra com motivo as três que ficaram sem aplicar:**
  - repetir o e2e com a coordenação;
  - a ligação de `semOsDecididos` provada só pelo e2e, anotada para o `/retro`;
  - o ouvinte `page.on('response')`.

  Nenhuma delas era bloqueante, e a recusa de cada uma está justificada.
- O portão local com `--e2e` passou verde depois do comentário, com carimbo (2732 testes de unidade e integração, 368 e2e). Esse número veio no seu prompt; não rodei o portão.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. As três registradas no documento seguem para o `/validar` e o `/retro`.

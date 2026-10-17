# Achados das revisões — `tasks/correcoes/2026-10-17-painel-pelo-endereco-cobre-o-aviso.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 19:30:07 · `tasks/correcoes/2026-10-17-painel-pelo-endereco-cobre-o-aviso.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas, o painel do ano em 1366 e 360 px, escola cheia e vazia). As fotos mostram só o painel, sem o aviso de incidente, como o prompt avisou. O caso do aviso com o painel esperando foi conferido pelo código e pelo e2e, não pela foto.
Estados: ok. A correção não mexe em carregando, vazio nem erro. O painel que espera fica montado e fechado, sem texto próprio, e a tela de baixo mantém os estados dela. Se a leitura dos incidentes falha, o aviso não aparece e o painel abre na hora, porque não há prioritário registrado (`AvisoDeIncidente.tsx`).
Acessibilidade: ok.
- O aviso fica por cima e o foco fica nele, no texto (`focoInicial={inicio}`).
- Quando o aviso sai, o painel abre e o foco vai ao miolo do painel. O diálogo do aviso é o pai de `PrioridadeDoAviso`, então a limpeza do pai roda antes: o aviso fecha e devolve o foco, e depois o painel abre e pega o foco. A ordem está certa.
- A borda azul de foco no miolo aparece nas fotos.
- O alvo de "Fechar" continua com 44 px.

Chromebook fraco: sem impacto. O módulo novo é um contador e uma lista de espera, sem timer nem observador. Não precisei medir throttling.
Celular: ok. Em 360 px não há rolagem horizontal nem texto cortado. "Novo ano letivo", "Nova série", "Nova disciplina", "Renomear" e "Excluir" têm tamanho de toque confortável, e o painel sobe como folha de baixo. O e2e novo roda nos projetos `chromebook` e `celular`, e o relato da tarefa diz que os quatro casos falharam antes da correção nos dois (8 de 8). Não rodei o e2e: rodei só os dois testes unitários novos, 9 de 9 passaram.
Ação oficial protegida: sim. O aviso continua um `alertdialog` que se lê antes de qualquer outro trabalho, e a confirmação é pelo botão, com o foco no texto e não no botão. "Ver depois" tem o mesmo peso do botão de confirmar e deixa a faixa fixa. Nada oficial passou a acontecer sem revisão.

Bloqueantes: nenhum.

Recomendações:
- `e2e/incidentes.spec.ts`: o teste da espera confere `not.toHaveAttribute('open')` e `toHaveCount(1)` em `dialog[open]`. Falta conferir que o painel que espera não aparece na árvore de acessibilidade. Hoje isso só vale porque o `<dialog>` fechado é `display:none` pelo navegador. Se alguém puser `flex` ou `block` na classe do `PainelLado`, o painel apareceria atrás do véu, e o teste atual provavelmente não pegaria.
- Quando o aviso sai, o painel abre sem que a pessoa tenha pedido. Funciona e é o que a validação pediu. Quando houver incidente pendente, vale decidir com a coordenação se uma linha de texto "O painel abre depois do aviso" ajuda. É só recomendação.
- `apps/web/src/componentes/PainelLado.tsx:~44`: o comentário diz "Nenhuma tela do produto o usa ainda". Está desatualizado, porque três telas já o usam.

Arquivos relevantes, todos sob `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/`:
- `apps/web/src/componentes/dialogo-prioritario.ts`
- `apps/web/src/componentes/dialogo-modal.ts`
- `apps/web/src/componentes/PainelLado.tsx`
- `apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx`
- `e2e/incidentes.spec.ts`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-17 19:32:02 · `tasks/correcoes/2026-10-17-painel-pelo-endereco-cobre-o-aviso.md`

VEREDITO: REPROVADO

**Cenários exigidos**
- **Caminho feliz:** com um incidente por confirmar, a coordenação abre ou recarrega `?professor=`, `?material=` ou `?painel=ano`. Só o aviso fica aberto e recebe o toque. Depois de "Confirmo que recebi", o painel abre no mesmo endereço.
- **Ver depois:** com o painel esperando, ele abre. A faixa fica, e "Ver o aviso" traz o aviso de volta.
- **Borda, ordem inversa:** o painel abre antes do aviso, porque a leitura de incidentes demorou. O aviso abre por cima e o painel continua aberto.
- **Borda, fila:** com dois incidentes pendentes, o painel só abre depois do último.
- **Borda, painel que sai enquanto espera:** a pessoa volta pelo histórico. O painel não abre depois, e o foco de reserva não é chamado.
- **Borda, foco:** ao fechar, o foco volta a quem tinha o foco quando o painel abriu de fato, e não a quem tinha quando ele montou.
- **Permissão e isolamento:** não se aplicam. A correção é só de tela, sem leitura nova; o aviso já é só da coordenação.

**Cobertos**
- O caminho feliz nos três endereços e o "Ver depois", no e2e.
- A regra do registro, em `dialogo-prioritario.test.ts`: espera, abre uma vez só, tirar duas vezes, desistir, ordem.
- O painel que espera, abre com o foco no miolo, o que já estava aberto e o que foi desmontado, em `PainelLado.test.tsx`.
- Rodei os dois arquivos de unidade: 9 de 9 passaram.
- As quatro mutações declaradas acertam o teste citado. Não há `.skip`, mock de coisa nossa nem chamada de IA.

**Bloqueantes**

1. **O e2e depende de qual resposta de rede chega primeiro.** Linhas `e2e/incidentes.spec.ts:757-766` e `:785-789`.
   - Depois do `page.goto`, duas coisas correm em paralelo: o pedaço do aviso com a leitura de incidentes, e o pedaço da tela com os dados do painel (anos, professor ou material).
   - O teste só passa se o aviso se registrar antes de o painel montar. A própria tarefa já viu essa ordem mudar conforme o endereço (`?material=`, linha 38 do documento).
   - Se o painel chegar primeiro, o produto está certo: o aviso abre depois e fica por cima. Mesmo assim o teste fica vermelho em `not.toHaveAttribute('open', '')`.
   - E o cenário do defeito (o aviso primeiro, o painel depois) só é exercido quando a rede colabora. É teste que só passa com a máquina folgada.
   - **Correção exigida:** controlar a ordem com `page.route`.
     - Segurar a resposta que o painel precisa até `aviso(page)` estar visível, e só então soltar.
     - Acrescentar o caso inverso: segurar a leitura de incidentes até o painel estar aberto, soltar, e conferir `dialog[open]` com contagem 2 e que "Confirmo que recebi" ou "Ver depois" funcionam no aviso, com o painel aberto embaixo. Isso prova a frase da Correção "o painel que já estava aberto antes do aviso não é mexido".

2. **Cláusulas novas sem bloco de mutação.** Duas delas também não têm teste nenhum.
   - `apps/web/src/componentes/dialogo-modal.ts:106`, `else if (abriu) reserva.current?.()`: nenhum teste. Exigido em `PainelLado.test.tsx`:
     - registrar um prioritário, montar o painel com `focoDeReserva` espiado, desmontar e esperar que a reserva não seja chamada;
     - bloco que muta para `else reserva.current?.()`.
   - `dialogo-modal.ts:96`, `quemAbriu` lido na hora em que o painel abre: nenhum teste. Exigido:
     - foco no botão A, montar o painel com prioritário, mover o foco para o botão B, tirar o prioritário, desmontar, e esperar o foco em B;
     - bloco que move a leitura de `document.activeElement` para fora de `abrir`.
   - `dialogo-modal.ts:102`, `desistir?.()`: o teste existe ("o painel desmontado enquanto esperava não abre depois"), mas falta o bloco que remove a linha.
   - `apps/web/src/componentes/dialogo-prioritario.ts:26`, `if (saiu) return`: o teste existe ("tirar duas vezes o mesmo prioritário não tira o de outro"), mas falta o bloco.
   - `dialogo-prioritario.ts:47`, o `filter` que desiste da espera: o teste existe ("quem desistiu da espera não abre"), mas falta o bloco que troca o corpo por `() => undefined`.

**Recomendações**
- O documento cita na linha 26 um título de teste que não existe. Os títulos reais são `` `${nome}: o aviso fica por cima, confirma pelo aviso, e só então o painel abre` ``. O `teste:` das mutações casa com o título do bloco `describe`, então funciona, mas o texto engana quem procura.
- Falta um e2e com dois incidentes pendentes: o painel continua esperando depois de confirmar o primeiro e abre só depois do segundo. A Correção afirma isso ("a confirmação do último aviso").
- Depois de confirmar, e depois de "Ver depois" com o painel esperando, conferir no e2e onde o foco ficou (regra 50, item 11).
  - Hoje o efeito `[adiado]` de `AvisoDeIncidente.tsx:88-91` tenta focar a faixa, que está inerte atrás do painel recém-aberto.
  - O resultado depende da ordem das limpezas do React, e nenhum teste prova onde o foco termina.
- `dialogo-prioritario.ts` guarda o estado no módulo. Se um teste quebrar no meio, o contador fica sujo para os outros do mesmo arquivo. Um `afterEach` que confira `haDialogoPrioritario() === false`, ou uma função de reinício só para teste, deixa a falha onde ela nasceu.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-17-painel-pelo-endereco-cobre-o-aviso.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/incidentes.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/dialogo-modal.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/dialogo-prioritario.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/dialogo-prioritario.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/PainelLado.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-17 19:32:10 · `tasks/correcoes/2026-10-17-painel-pelo-endereco-cobre-o-aviso.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: há divergência na seção 2 (Módulos afetados) e na seção 5 (o que abre por cima fica na consulta do endereço) de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/techspec.md`
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes:
- `tasks/prd-telas-da-coordenacao/techspec.md:20-27` e `:52`. A correção cria um módulo compartilhado novo, `apps/web/src/componentes/dialogo-prioritario.ts`. Esse módulo guarda estado global, que vale para todos os diálogos. A correção também muda o comportamento de duas peças da X1, `componentes/dialogo-modal.ts` (opção `cedeAoPrioritario`) e `componentes/PainelLado.tsx`. Com isso, todo `PainelLado` do produto passa a esperar o aviso de incidente antes de chamar `showModal`. Nada disso está na Tech Spec, só no documento da correção.
  - A seção 2 lista as peças de `componentes/` que a spec altera (`sino/`, `CascaDaEscola.tsx`, `Cartao.tsx`). O `Cartao.tsx` entrou ali com a anotação "(13.0)" quando a 13.0 mexeu nele. As três peças desta correção não aparecem.
  - A seção 5, linha 52, define o que abre pelo endereço e não diz que o painel espera o aviso.
  - Isso é divergência registrada só no documento da tarefa.
  - O que precisa mudar:
    - Na seção 2, acrescentar `componentes/dialogo-prioritario.ts` (novo) e `componentes/dialogo-modal.ts` e `componentes/PainelLado.tsx` (alterados), com "(correção 2026-10-17-painel-pelo-endereco-cobre-o-aviso)".
    - Na seção 5, ao lado da linha 52, acrescentar um "Como ficou na correção …" com três pontos: o painel aberto pelo endereço não abre enquanto o aviso de incidente está na tela e abre quando ele sai; o painel já aberto não é mexido; o `Dialogo` não cede.
    - Não existe `cenarios.md` nesta spec, então só a Tech Spec precisa mudar.

Recomendações:
- Foco depois de "Ver depois" com o painel esperando: isto é regra 50, item 11, e cabe ao `frontend-reviewer` confirmar.
  - O `Dialogo` do aviso desmonta e devolve o foco ao `body`. Logo depois, a saída do `PrioridadeDoAviso` abre o painel, que guarda o `body` como `quemAbriu`.
  - Em seguida, o efeito de `AvisoDeIncidente.tsx:89` tenta focar o botão da faixa. Esse botão já está inerte atrás do painel, e o foco não vai até ele.
  - Ao fechar o painel com Esc, o foco volta ao `body`, e não a "Ver o aviso".
  - O e2e em `e2e/incidentes.spec.ts:779` aciona a faixa por clique e não pega isso. Vale conferir com o teclado.
- Ordem de chegada no e2e (área do `test-engineer`): `e2e/incidentes.spec.ts`, nos casos por endereço, só passa se o aviso se registrar antes de o painel montar.
  - Se a leitura do painel chegar antes da leitura dos incidentes, o painel abre primeiro e o aviso abre por cima. O comportamento fica correto, mas `dialog[open]` teria 2, e o teste ficaria vermelho.
  - Vale confirmar com repetições que essa ordem é determinística.
- `apps/web/src/componentes/dialogo-prioritario.ts:8`: a frase "espera, aberto por baixo de nada" fica sem sentido. Melhor: "espera, sem abrir".
- `apps/web/src/componentes/dialogo-prioritario.ts:17`: `haDialogoPrioritario` é exportado só para o teste. Pode ficar privado, e o teste pode conferir o efeito pelo `quandoNaoHouverPrioritario`.

Fotos lidas: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.processo/vitrine/coordenacao--coordenacao-estrutura--computador.png` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.processo/vitrine/vazia--coordenacao--coordenacao-estrutura--celular.png`. Sem incidente pendente, o painel "Ano letivo e disciplinas" abre normalmente pelo endereço nas duas larguras, e não há nada fora do pedido.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-17 19:48:29 · `tasks/correcoes/2026-10-17-painel-pelo-endereco-cobre-o-aviso.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

A correção exigida na 1ª rodada foi feita:
- **Seção 2.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/techspec.md:18-19` lista `componentes/dialogo-prioritario.ts` como novo e `dialogo-modal.ts` e `PainelLado.tsx` como alterados, cada linha com a referência da correção.
- **Seção 5.** `techspec.md:56` traz o "Como ficou na correção 2026-10-17-painel-pelo-endereco-cobre-o-aviso" com os três pontos pedidos:
  - o painel aberto pelo endereço não abre enquanto o aviso está na tela e abre quando ele sai;
  - o painel já aberto não é mexido, e o aviso fica por cima;
  - o `Dialogo` não cede.

Essa spec não tem `cenarios.md`, então não há segundo lugar a conferir.

O diff desde a rodada 1 confirma o que o prompt diz. No produto, só mudaram dois comentários: `PainelLado.tsx:83-84` e `dialogo-prioritario.ts:8`. O código de `dialogo-modal.ts` está igual ao da rodada aprovada pelo `frontend-reviewer`. O restante do diff é de teste:
- os dois casos novos em `PainelLado.test.tsx`;
- os `afterEach` que conferem que nenhum aviso prioritário ficou registrado entre um teste e outro;
- a ordem de chegada controlada com `page.route` no e2e, mais o caso inverso;
- as cinco mutações novas declaradas no documento.

Cada mutação acerta uma linha que de fato existe em `dialogo-modal.ts` ou em `dialogo-prioritario.ts`. A qualidade dos testes é área do `test-engineer`.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/incidentes.spec.ts:212-217`: o filtro da rota chama `ehLeituraDosIncidentes(url, 'GET')` com o método fixo, e por isso aceita qualquer método. Depois o handler confere o método de novo. Funciona, mas lê como se o filtro já checasse o método. Vale deixar só um dos dois lugares conferindo.

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 19:49:36 · `tasks/correcoes/2026-10-17-painel-pelo-endereco-cobre-o-aviso.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: com um incidente por confirmar, o painel aberto pelo endereço (`?professor=`, `?material=`, `?painel=ano`) espera. O aviso fica por cima e confirma, e só depois o painel abre, com o foco no miolo.
- Borda: "Ver depois" com o painel esperando. O painel abre por cima da faixa, o Esc leva o foco ao título da lista, e "Ver o aviso" traz o aviso de volta.
- Borda: a ordem inversa. O painel já está aberto quando o aviso chega: ficam dois abertos, o aviso por cima recebe o toque, e "Ver depois" deixa o painel como estava.
- Borda: dois avisos ao mesmo tempo. Só o último a sair libera o painel. Tirar o mesmo aviso duas vezes não tira o outro.
- Borda: o painel desmontado enquanto esperava. Ele não abre depois e não manda o foco para a reserva.
- Borda: o foco anda enquanto o painel espera. Ao fechar, o foco volta a quem o tinha quando o painel abriu de fato, e não a quem o tinha quando ele montou.
- Permissão e isolamento: não se aplicam. A correção só mexe na ordem dos diálogos na tela e não toca dado de escola.
- Concorrência: a corrida entre a rede e o carregamento da tela, agora controlada no e2e.

**Cobertos:** todos os cenários acima. As duas correções exigidas na rodada 1 foram feitas.

1. **Ordem de chegada no e2e (`e2e/incidentes.spec.ts`).** O e2e agora controla a ordem com `page.route` e não depende mais de qual resposta chega primeiro.
   - `segurarATelaDoPainel` (linhas 134-139) segura a tela do painel até o aviso estar visível. Conferi que a expressão casa com os nomes reais do build em `apps/web/dist/assets`: `tela-coordenacao-Estrutura-*.js`, `tela-coordenacao-Professores-*.js` e `tela-coordenacao-Material-*.js`. Ela não pega `tela-coordenacao-professores-da-escola-*`, porque a busca diferencia maiúscula. O bloqueio, portanto, não é inerte.
   - O e2e confere que nenhum painel existe antes de soltar a tela (contagem 0), e depois que ele montou sem abrir.
   - O caso inverso existe (linhas 204-233): a leitura de incidentes fica segura até o painel estar visível. Depois o teste confere `dialog[open]` com contagem 2, "Ver depois" funcionando pelo toque com o painel aberto embaixo, contagem 1 no fim e o endereço intacto.

2. **Cláusulas sem bloco de mutação.** As cinco têm agora bloco e teste, e conferi cada par contra o código.
   - **`else if (abriu)` → `else`:** o teste que desmonta antes de abrir espia o `focoDeReserva`. O `PainelLado.tsx:48` repassa a função direto, então a mutação chamaria a reserva e o teste falharia.
   - **`quemAbriu` lido na montagem:** o foco estaria no `body`. O `focus()` do `body` não faz nada no jsdom, e o `activeElement` terminaria no `body` em vez do botão B, então a mutação falha. Sem a mutação, o código lê B dentro de `abrir`.
   - **Sem `desistir?.()`:** o `abrir` ficaria esperando e chamaria o `showModal` falso, então a contagem de aberturas iria a 1 e o teste falharia.
   - **Sem `if (saiu) return`:** tirar o mesmo aviso duas vezes zeraria a contagem, e o teste falharia.
   - **`filter` trocado por `void abrir`:** quem desistiu da espera seria chamado mesmo assim, e o teste falharia.

Rodei `npx vitest run` nos dois arquivos de unidade: 11 de 11 verdes. Não há `.skip` nem teste comentado. Os mocks são só do `showModal` e do `close`, que o jsdom não tem, e não escondem a regra: a ordem real na camada de cima do navegador é provada no e2e. O `afterEach` com `haDialogoPrioritario() === false` está nos dois arquivos.

**Bloqueantes:** nenhum.

**Recomendações:**
- No caso inverso, conferir também que o foco foi para dentro do aviso quando ele abre por cima do painel. Hoje o teste prova o toque, não o foco.
- No caso inverso, o `page.route` da leitura de incidentes continua ligado depois de solto. Não faz mal, porque a promessa já resolveu, mas um comentário curto evitaria que alguém o tome por bloqueio pendurado.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/incidentes.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/PainelLado.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/dialogo-prioritario.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/dialogo-modal.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/dialogo-prioritario.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-17-painel-pelo-endereco-cobre-o-aviso.md

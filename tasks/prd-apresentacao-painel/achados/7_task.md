# Achados das revisões — `tasks/prd-apresentacao-painel/7_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-25 06:32:06 · `tasks/prd-apresentacao-painel/7_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** W1, W2, W3, W4, W6 (cartão com ações), W8 (convite), W9, W10 (convite, unidade e e2e), token fora do cache, clique duplo no gerar. Pelo domínio e pela regra 80 também contam: clique duplo nas outras ações que mexem no link, dois operadores sobre o mesmo convite, resposta atrasada com outro diálogo aberto, e cada caminho de fechar que a tarefa declara (botão, Esc, toque fora, e o segundo Esc).

**Cobertos:**
- **W1**: rede e escola criadas pela tela, gerar, copiar, aceite em outro navegador. A lista mostra `ativa` na API e "Ativa" na tela, com as três contagens em 0 e nenhum botão. Roda em `chromebook` e `celular`.
- **W2 e W10 na tela**: o `CONFLITO` do refazer e o `NAO_ENCONTRADO` do revogar vêm do servidor real. A lista recarregada é conferida pelo `conviteId` novo, que só a lista nova teria.
- **W3**: o botão, o Esc e o toque fora caem na pergunta. O link anterior abre a tela de convite inválido, sem o nome da escola.
- **W4**: depois do recarregar e da troca de operador, o token não aparece em URL, console, `localStorage`, `sessionStorage`, `history` nem no HTML da página.
- **W6**: botões de 44 px e nenhuma largura excedente em W1 e W2, incluindo `pendente` com dois botões. O W6 de `operacao-escolas.spec.ts` já roda com as ações na tabela.
- **W8**: Tab, Shift+Tab e foco preso. O foco volta ao "Refazer"; a sua mutação da `key` confirma que o teste fica vermelho sem ela.
- **W9**: sem `navigator.clipboard`, o campo fica selecionado de 0 até o fim do link. O Ctrl+C à mão conta como cópia, e a escrita recusada está coberta em unidade.
- **W10 em unidade**: textos por ação e por código, e varredura contra código ou status na mensagem.
- **Matriz**: `acoes-do-convite.test.ts` escreve a matriz por extenso, sem importá-la do `@educa/shared`, então não é tautológico.
- **Token fora do cache**: três testes de comportamento com `MutationObserver` real, incluindo a resposta que chega depois de o diálogo fechar.
- **Clique duplo no gerar** e a **resposta atrasada** do refazer e do revogar ("recomeço").
- Nenhum `.skip`, `.only` nem teste comentado. Nenhum teste chama IA.

**Bloqueantes:**

1. **O segundo Esc, na pergunta, não tem teste.**
   - O que falta: o 7_task.md declara a regra ("o segundo, na pergunta, fecha", D59) e o código tem um caminho só para ela: `aoFecharPeloNavegador` e o `onClose` em `apps/web/src/operacao/componentes/DialogoDaOperacao.tsx`, e `fecharDeVez` em `DialogoDoConvite.tsx:238` e `:382`. Mas o Esc só é apertado uma vez, em `e2e/operacao-convite-coordenacao.spec.ts:341` e `:454`, sempre seguido de "Voltar ao convite".
   - Por que importa: o Esc não conta como ativação do usuário no Chrome, então o segundo Esc fecha o `<dialog>` direto. Se o `onClose` regredir, o diálogo some da tela, mas o componente continua montado. O `<input>` com o token fica no HTML e a mutação continua observada, fora do `reset()` e do `gcTime: 0`. Nenhum teste atual fica vermelho.
   - Correção exigida: no W8 ou no W3, apertar Escape duas vezes seguidas, sem tecla nem clique entre elas. Depois conferir:
     - `page.locator('dialog')` com contagem 0. O `getByRole('dialog')` não prova a desmontagem, porque um `<dialog>` fechado já sai da árvore de acessibilidade;
     - `page.content()` sem o token;
     - "Refazer" da escola acionável e abrindo o diálogo de novo.

2. **Não há clique duplo em "Refazer convite".**
   - O que falta: a trava `noAr` e o `disabled={refazer.isPending}` em `DialogoDoConvite.tsx:361-376` não têm teste. O único teste de clique duplo, em `e2e/operacao-convite-coordenacao.spec.ts:509-540`, cobre o gerar.
   - Por que importa: é pior no refazer. Sem a trava, o primeiro pedido refaz, o link antigo para, e o segundo recebe `CONFLITO` na mesma instância do `useMutation`. O observador passa para o erro e o link novo, que aparece uma vez só, se perde sem ser mostrado.
   - Correção exigida: e2e no mesmo molde do gerar. Segurar a rota do refazer, dar `dblclick()` em "Refazer convite", e conferir um pedido só, o link na tela, nenhum `role="alert"` e `ultimoConviteDaEscola` igual ao `conviteId` da resposta. Confirmar à mão que o teste fica vermelho sem o `noAr`, e fazer o mesmo no gerar.

**Recomendações:**
- Clique duplo em "Revogar convite" (`ConfirmarConvite.tsx:48-52`). A consequência é menor, porque a resposta de sucesso fecha o diálogo, mas a trava existe sem teste.
- Nas asserções de "diálogo fechado" que antecedem a checagem do token, preferir `page.locator('dialog')` a `getByRole('dialog')`.
- E2e do estado `aceito`: a linha oferece Convidar e Revogar, e o resumo avisa que o aceite anterior deixa de ativar (`DialogoDoConvite.tsx:285`). Hoje isso só está em unidade.
- E2e do `CONFLITO` do gerar na tela ("Esta escola já tem convite…", só "Fechar"), com dois operadores gerando na mesma escola `sem_convite`.
- Conferir os alvos de 44 px na escola de nome longo do W6 (`operacao-escolas.spec.ts`), com as ações na coluna Coordenação, que agora tem 25% da tabela.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite-coordenacao.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDoConvite.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/ConfirmarConvite.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDaOperacao.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/painel.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/acoes-do-convite.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/textos.test.ts

## test-engineer · 2ª rodada · APROVADO · 2026-09-25 07:16:52 · `tasks/prd-apresentacao-painel/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os da 1ª rodada (W1, W2, W3, W4, W6, W8, W9, W10, token fora do cache, clique duplo no gerar, dois operadores sobre o mesmo convite, resposta atrasada com outro diálogo aberto, cada caminho de fechar), mais as duas correções exigidas: o segundo Esc na pergunta e o clique duplo em "Refazer convite".

**Cobertos.** Revi o diff desde a 1ª rodada, que mexe só em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite-coordenacao.spec.ts`.

1. **Segundo Esc: feito**, em `e2e/operacao-convite-coordenacao.spec.ts:479-487`.
   - O teste aperta Escape duas vezes. Entre as duas, só confere que o foco está na pergunta, sem tecla nem clique.
   - Depois confere `page.locator('dialog')` com contagem 0 e `page.content()` sem o token.
   - O "Refazer" da escola abre o diálogo de novo, na confirmação e sem o campo do link.
   - Em `:491-496` há um caminho a mais: o navegador fecha o diálogo sozinho com `dialog.close()`. Esse é o teste que fica vermelho sem o `onClose` do `DialogoDaOperacao.tsx`, e a sua mutação confirmou isso.
   - O duplo Esc em si continua verde sem o `onClose`, porque prova o ramo `perguntando` de `useFechamento`. As duas partes juntas cobrem os dois caminhos de fechar.
2. **Clique duplo em "Refazer convite": feito**, em `:571-608`.
   - A rota do refazer fica segura e o botão recebe `dblclick()`.
   - O token do link na tela é o mesmo da resposta, não há `role="alert"`, e `ultimoConviteDaEscola` é igual ao `conviteId` da resposta, com um convite em aberto.
   - A asserção que decide é `expect(pedidos).toBe(1)` em `:602`, depois de soltar a rota. Um segundo pedido também ficaria preso e seria contado antes dela. O `expect.poll(...).toBe(1)` sozinho passaria no instante em que o primeiro pedido chegasse.
   - Você relatou que a mutação do `noAr` fica vermelha no gerar e no refazer, nos dois projetos.
   - O revogar, que era a recomendação da 1ª rodada, também tem clique duplo, em `:610-624`: um pedido só, o anúncio, `dialog` com 0 e nenhum convite em aberto.
3. Também mudou em `:392` e `:403`: antes de conferir o token, o W4 agora testa o diálogo fechado com `page.locator('dialog')`. Esse seletor prova que o componente saiu da página, o que o `getByRole` não prova.
4. Nenhum `.skip`, `.only` ou teste comentado, e nenhuma chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
- O título do W8 (`:423`) ainda descreve só "o Esc cai na pergunta". Vale acrescentar "o segundo fecha, e o navegador fechando desmonta" para o `/validar` achar o cenário pelo nome.
- O comentário do revogar (`:610`) promete "sem 'esse convite já não vale'", mas não há asserção para isso. Basta um `expect(page.getByRole('alert')).toHaveCount(0)` ou um `not.toContainText(TEXTO_DO_CONVITE_QUE_NAO_VALE)` depois do anúncio. Hoje isso só é coberto de forma indireta, pelo `pedidos === 1`.
- O `segurar` do teste do refazer e do revogar conta todo pedido, sem filtrar por `POST` como faz o do gerar. As duas rotas só recebem POST, então o resultado não muda, mas o filtro deixaria o teste mais robusto se aparecer uma leitura na mesma rota.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-25 07:18:13 · `tasks/prd-apresentacao-painel/7_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** só o nome e o e-mail da coordenadora convidada, que o operador digita no diálogo e que vão no pedido `PedidoConviteDaCoordenacao`. Nenhum campo novo no banco e nenhuma migration. No servidor, a tarefa só leva a matriz estado × ação e os 72 h para `@educa/shared`, sem mudar valor.

**Fora da tabela de dados do docs/lgpd.md:** nada. O convite de coordenador já estava na tabela, e a linha 72 agora diz também que o link aparece uma vez, só no diálogo, fora do cache, da URL, do log e do armazenamento do navegador. O nome e o e-mail do coordenador já estão mapeados desde o F1.

**Autorização por objeto:** ok. A tela não mudou nenhuma rota. Gerar, refazer e revogar chamam as rotas da 3.0, que o servidor decide sob a trava da escola, e o `conviteId` vem da lista. A matriz em `apps/web/src/operacao/acoes-do-convite.ts` só decide quais botões aparecem. Quem recusa é o servidor, com `CONFLITO` ou `NAO_ENCONTRADO`. A resposta do gerar e do refazer passa pelo esquema estrito `esquemaRespostaConviteDaCoordenacao` (`packages/shared/src/operacao/painel.ts:152`). O teste em `apps/web/src/operacao/api/painel.test.ts:35` prova que um campo de pessoa a mais na resposta é recusado.

**Logs:** limpos. Não há `console.*`, `localStorage` nem `sessionStorage` no código da tarefa. O cliente de consultas (`apps/web/src/api/cliente-de-consultas.ts`) não tem gancho global de `MutationCache` que registre o que passa. Nenhuma mensagem de falha do convite mostra código, status ou identificador do erro (`textos.test.ts:704`).

**Auditoria:** presente. Gerar, refazer e revogar continuam no caso de uso da 3.0, que registra na auditoria. A tarefa não criou caminho novo sem registro.

**Envio externo:** nenhum. O link é montado com a própria origem e o token vai no fragmento (`/convite#<token>`), que o navegador não manda ao servidor. O operador envia o link à mão.

**Seed/fixture:** sintético. Os nomes são do tipo "Coordenadora sintética", "do teclado" e "do clique duplo". Os e-mails usam `@educa.invalid` e o token é hash de bytes sorteados (`e2e/__fixtures__/painel.ts:68-92`, `:194-205`).

**O link do convite como credencial (regra 20, item 8):**
- O gerar e o refazer usam `gcTime: 0` (`apps/web/src/operacao/api/painel.ts:181-196`), e o diálogo chama `reset()` ao fechar de vez.
- Os testes `painel.test.ts:45` e `:65` mostram o token e o e-mail no cache enquanto o diálogo está aberto, e fora dele depois de fechar. Isso vale também quando a resposta chega depois de o diálogo fechar. Se o `gcTime: 0` ou o `reset()` saírem, os testes quebram.
- Cada abertura é uma instância própria (`key={aberta.numero}`), e o gerar e o refazer não chamam o `fecharSeAinda`. Uma resposta atrasada não cai no diálogo de outra escola.
- O e2e (`e2e/operacao-convite-coordenacao.spec.ts:124-145`) vigia URLs pedidas, navegações, console, `localStorage`, `sessionStorage`, `history.state` e `location.href`.
- A cópia só diz "copiado" depois de a escrita terminar (`acoes-do-convite.ts:806`). Fechar com o link em risco pergunta antes. Isso protege a credencial sem tornar a saída mais difícil que a entrada (D59).

**Pergunta de fechamento:** o código responde. A tarefa não criou dado novo sobre aluno nem envio externo. O convite e a conta da coordenadora continuam no mapa, com retenção, expurgo (`sistema.expurgar-acesso`) e eliminação junto com o usuário, como na 3.0 e no F1.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Quando o operador fecha com o pedido ainda no ar ("Fechar sem copiar"), o servidor cria o convite, mas o link não aparece para ninguém. Isso não vaza nada, porque o token só existe na resposta e não sobra no cache (`painel.test.ts:65`). Mas a escola fica `pendente` com um link que ninguém tem. A pergunta já diz "será preciso refazer o convite". Vale confirmar no `/validar` que a lista mostra a ação Refazer nesse caso.
2. As escolas e os convites sintéticos do e2e ficam no banco de teste (`e2e/__fixtures__/painel.ts:194`, já registrado como correção à parte). Não é dado real, mas vale fechar essa limpeza antes que o banco de teste vire um acúmulo de contas com e-mail.
3. `docs/lgpd.md:72` pode dizer também que o nome e o e-mail digitados vivem só no estado do diálogo e na mutação dele. Hoje a linha cita só o link.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDoConvite.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/ConfirmarConvite.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/painel.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/painel.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/acoes-do-convite.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/painel.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite-coordenacao.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/painel.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-25 07:19:02 · `tasks/prd-apresentacao-painel/7_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, e2e)
Bloqueantes: nenhum

Recomendações:

- **Divergências declaradas.** São duas, e as duas estão registradas na seção "Divergências resolvidas nesta tarefa" do `7_task.md` e na seção 9 da techspec:
  - A matriz estado × ação e os 72 h foram para `@educa/shared`. Os valores continuam os mesmos e o serviço da API só troca o import. É o que pede a regra 00, item 6.
  - O segundo Esc, na pergunta, fecha o diálogo, embora o W8 diga que o Esc "cai na pergunta". Isso segue a D59.

  Registro só para quem ler a `techspec.md` sem abrir a seção 9: a seção 7 dela ainda diz "`docs/lgpd.md` não muda", e a tarefa mudou uma linha. O que mudou é o texto da finalidade, sem campo novo.

- **Segundo jeito de copiar.** Já existe `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/BotaoCopiar.tsx`, e `useCopia` e `copiarLink` refazem a mesma coisa em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDoConvite.tsx:133-154` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/acoes-do-convite.ts:45-53`. A duplicação tem motivo: o convite precisa saber se o link foi copiado, selecionar o campo e contar a cópia feita à mão. Fica como débito: estender o `BotaoCopiar`, ou levar o caminho novo para os componentes compartilhados e aposentar o antigo.

- **Foco depois de revogar.** A chave dos botões da linha é a posição (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx:49-50`). Isso resolve "Convidar" virando "Refazer", mas não o revogar.
  - Em `pendente` a linha tem Refazer na posição 0 e Revogar na 1. Depois de revogar, a lista recarrega em `revogado` só com Convidar, e o botão da posição 1 some.
  - O diálogo devolve o foco ao Revogar antes de a lista recarregar. Quando ela recarrega, o foco cai no `body`.
  - É da área do `frontend-reviewer`, que é obrigatório nesta tarefa. Vale ele conferir.

- **Clicar fora no formulário do convite apaga o digitado.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDoConvite.tsx:238`, na primeira etapa ainda não há link em risco, então o toque fora fecha na hora e perde nome e e-mail. É o mesmo motivo pelo qual o `DialogoDaOperacao` não liga o clicar fora nos diálogos de criação. A 7.2 pede o "fora" e o comportamento cumpre o pedido. Mesmo assim, considerar perguntar também quando nome ou e-mail estão preenchidos.

- **Nome duplicado no fixture.** `nomeQueVemPrimeiro` em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/painel.ts:183` é só outro nome para `nomeDeRedeQueVemPrimeiro`. Melhor renomear o original para um nome neutro (serve para rede e escola) do que manter os dois.

- **Escolas de teste não são apagadas.** As do e2e ficam no banco, e a tarefa manda a limpeza para uma "correção à parte". Confirmar que ela está registrada no `TODO.md`: a linha 128 fala de limpeza, mas é de outra correção.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-09-25 07:19:23 · `tasks/prd-apresentacao-painel/7_task.md`

VEREDITO: AJUSTES NECESSÁRIOS

**Estados:** ok. O diálogo tem os quatro: pedido no ar ("Gerando…", "Refazendo…", "Revogando…", com botão desligado e `role="status"`), falha com `role="alert"` e foco nela, link na tela, e a lista com o anúncio. A linha mostra só as ações que a matriz de `@educa/shared` permite. A escola `ativa` fica sem ação e não inventa estado.

**Acessibilidade:**
- Os campos têm rótulo, `inputmode="email"` e `autocomplete="off"`.
- O nome acessível começa pelo rótulo visível e acrescenta a escola ("Refazer o convite de X").
- Cada etapa põe o foco no próprio título. A trava de Tab funciona com o foco num título `tabIndex={-1}`.
- A confirmação começa no texto, e não no botão que age.
- "Link copiado." é anunciado dentro do `<dialog>`.
- "Voltar ao convite" e "Fechar sem copiar" têm o mesmo tamanho (D59).
- **Falha:** a devolução do foco no revogar (bloqueante abaixo).

**Chromebook fraco:** ok. A lista é paginada, sem imagem nem upload. O chunk da área fica em ~14 kB brotli, dentro do teto de 60 kB. O e2e roda no projeto `chromebook`, com CPU ×4 e Fast 3G. O clique duplo manda um pedido só, garantido pela trava `noAr`.

**Celular:** ok. Os botões da linha e do diálogo usam `min-h-11 min-w-11`, e o e2e mede 44 × 44 px. O e2e também confere que nem a página nem o diálogo rolam na horizontal a 360 px, roda o axe e usa toque no projeto `celular`. Sem a área de transferência, o texto de apoio cobre Ctrl+C e o "toque e segure". Nada depende de hover. O toque fora do diálogo pergunta antes de fechar.

**Ação oficial protegida:** sim.
- Gerar mostra, antes de confirmar, a escola, o nome e o e-mail já normalizados, "vale 72 horas" e "o link aparece uma vez".
- Refazer avisa que o link anterior para de valer.
- Revogar diz o que acontece.
- O token vive só na mutação do diálogo, com `gcTime: 0` e `reset()` ao fechar.

**Bloqueantes:**

1. `apps/web/src/operacao/paginas/Escolas.tsx:50` (a chave é a posição), junto de `:290-292` e `apps/web/src/operacao/componentes/DialogoDaOperacao.tsx:69`: **depois de revogar, o foco se perde.**
   - **O defeito.** Com a escola `pendente` ou `aceito`, "Revogar" é o botão da posição 1 (`[refazer, revogar]` ou `[gerar, revogar]`). Depois de revogar, a escola fica `revogado` e a linha passa a ter só `[gerar]`.
   - **Revogar com sucesso.** O `aoRevogar` fecha o diálogo, e o `DialogoDaOperacao` devolve o foco ao "Revogar", que ainda existe. Em seguida o `onSettled` recarrega a lista, a posição 1 é desmontada e o foco cai no `body`.
   - **Revogar com `CONFLITO` ou `NAO_ENCONTRADO`** (o segundo operador do W2). A lista recarrega com o diálogo ainda aberto, e o "Revogar" já sumiu quando a pessoa aperta "Fechar". O `quemAbriu.isConnected` é falso e ninguém recebe o foco.
   - **O que viola.** O cenário W8 ("foco … devolvido ao botão que o abriu") e a regra 50, item 11. A própria divergência da tarefa promete que o foco devolvido "não se perde", mas isso só vale para a troca Convidar → Refazer. Nenhum teste cobre o caminho: o W8 só confere o foco no "Refazer" (e2e, `:468`).
   - **Correção exigida.** Quando o botão que abriu o diálogo deixa de existir, o foco vai para um alvo estável da mesma escola, de preferência a primeira ação que sobrou na linha ("Convidar a coordenação de X"). Na falta dela, vai para o anúncio da página, com `tabIndex={-1}`. Isso vale para o revogar com sucesso e para o fechar depois do `CONFLITO`/`NAO_ENCONTRADO`. Acrescente ao e2e, nos projetos `chromebook` e `celular`, um passo que revoga só pelo teclado e confere `toBeFocused()` no alvo depois que a lista recarrega, e outro que faz o mesmo no revogar já revogado do W2.

**Recomendações:**
- `apps/web/src/operacao/textos.ts:504`: o `CONFLITO` do gerar também sai quando a escola ficou `ativa`, e aí "Use Refazer para um link novo." manda procurar um botão que não existe. O texto é o da W10, então isto vai ao `/validar` como ajuste de spec: por exemplo, um texto próprio quando a lista recarregada mostrar `ativa`.
- `DialogoDoConvite.tsx:119`: ao copiar de novo, o texto continua "Link copiado." e não é anunciado outra vez. Limpar o texto e escrevê-lo de novo resolve.
- `DialogoDaOperacao.tsx:179-184`: quem seleciona o link com o mouse e solta fora da caixa dispara um clique no `dialog`, que conta como "fora". Sem cópia, cai na pergunta, o que é inofensivo mas surpreende. Dá para exigir que o `mousedown` também tenha sido no fundo.
- A pergunta que aparece com o pedido ainda no ar diz "O link aparece uma vez só…" antes de o link existir. Vale um texto próprio, como "O convite está sendo gerado…".
- Do `test-engineer` (2ª rodada), para o `/validar`: o título do W8 (e2e, `:423`) ainda diz só "o Esc cai na pergunta". Vale acrescentar "o segundo fecha, e o navegador fechando desmonta".

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDoConvite.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/ConfirmarConvite.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDaOperacao.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/acoes-do-convite.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/textos.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite-coordenacao.spec.ts`

## test-engineer · 3ª rodada · APROVADO · 2026-09-25 07:40:03 · `tasks/prd-apresentacao-painel/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da 2ª rodada, mais a correção que o `frontend-reviewer` exigiu. Se o botão que abriu o diálogo sai da linha, o foco vai para a primeira ação que sobrou na mesma escola, ou para o anúncio da página quando não sobra nenhuma. Isso vale em dois casos: depois de revogar com sucesso e ao fechar depois de `CONFLITO` ou `NAO_ENCONTRADO`. Os dois passos pedidos no e2e são o revogar só pelo teclado (W8) e o revogar já revogado do segundo operador (W2), com `toBeFocused()` depois que a lista recarrega, nos dois projetos.

**Cobertos.** Auditei o diff desde a 2ª rodada: `Escolas.tsx`, `DialogoDaOperacao.tsx`, `DialogoDoConvite.tsx`, `ConfirmarConvite.tsx` e o spec do e2e.

1. **Revogar com sucesso pelo teclado (W8):** `e2e/operacao-convite-coordenacao.spec.ts:502-514`.
   - O teste chega ao "Revogar" com `tabAte`, confirma com Tab e Enter, espera a lista recarregada e confere `toBeFocused()` no "Convidar a coordenação de X".
   - A asserção não passa por acaso. O botão da posição 0 era "Refazer" e só ganha o nome "Convidar…" depois da lista nova. Antes disso o localizador não o encontra, então o `toBeFocused` não pode passar cedo.
   - Esse passo prova o caminho do efeito em `AcoesDoConvite` (`Escolas.tsx`): o diálogo devolve o foco ao "Revogar", e ele some quando a lista recarrega.
2. **Revogar já revogado do segundo operador (W2):** `:325-330`.
   - O teste confere primeiro que o "Revogar" saiu da linha (`toHaveCount(0)`), com o diálogo ainda aberto. Depois fecha e confere `toBeFocused()` no "Convidar".
   - Esse passo prova o outro caminho, o `focoDeReserva` do `DialogoDaOperacao`: quem abriu já não está na página na hora de desmontar.
   - Os dois caminhos da correção têm um teste cada.
3. **Mutação relatada:** com o `focarNaEscola` sem efeito, o W2 e o W8 ficam vermelhos. O teste falharia sem a regra.
4. **Celular:** `focarNaEscola` escolhe o grupo que está à vista (`getClientRects`). A tabela escondida vem antes no DOM, então pegar o primeiro grupo daria foco num botão oculto. Os dois passos rodam no projeto `celular` e passam, e isso prova a escolha pelo cartão.
5. **As minhas recomendações da 2ª rodada foram feitas:**
   - o título do W8 (`:427`) descreve o segundo Esc e o fechamento pelo navegador;
   - o revogar com clique duplo confere `getByRole('alert')` com 0 (`:640`).
6. Nenhum `.skip`, `.only` ou teste comentado, e nenhuma chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
- **O anúncio da página como último destino do foco não tem teste.** É o `else regiaoDoAnuncio.current?.focus()` em `Escolas.tsx` (`focarNaEscola`). O cenário é real: o operador tem a lista velha com "Refazer" em `pendente`, a coordenadora ativa nesse meio-tempo, o refazer volta `CONFLITO`, a lista recarrega com a escola `ativa` e sem ação, e o operador fecha. Hoje, apagar esse `else` não deixa nenhum teste vermelho. Dá para cobrir com um passo no molde do W2, com a ativação feita num segundo navegador como no W1, conferindo `toBeFocused()` na região `role="status"`.
- **Vale confirmar à mão as duas mutações separadas**, além da mutação conjunta:
  - só o efeito de `AcoesDoConvite` desligado deve deixar o W8 vermelho;
  - só o `reserva.current?.()` do `DialogoDaOperacao` desligado deve deixar o W2 vermelho.
  - Pela leitura do código, cada caminho tem um teste que o prova, mas a mutação relatada desliga os dois de uma vez.
- **Três ajustes novos sem teste.** São todos do nível de recomendação do `frontend-reviewer`:
  - O texto próprio da pergunta com o pedido no ar (`DialogoDoConvite.tsx:65`). O `recomeço` (`:678`) passa por essa pergunta, mas só confere o foco; bastaria um `toContainText('ainda está sendo gerado')` ali.
  - O segundo anúncio do "Link copiado." (`<span key={vezDaCopia}>`, `DialogoDoConvite.tsx:135`).
  - O `mousedown` fora da caixa: selecionar arrastando e soltar fora não deve perguntar (`DialogoDaOperacao.tsx`, `comecouFora`). Sai com `page.mouse.down` dentro do campo do link e `page.mouse.up` fora da caixa, conferindo que a pergunta não aparece.
- **Continuam em aberto as recomendações da 2ª rodada:** o `segurar` do refazer e do revogar sem filtro por `POST`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDaOperacao.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDoConvite.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/ConfirmarConvite.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite-coordenacao.spec.ts

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-25 07:41:00 · `tasks/prd-apresentacao-painel/7_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Olhei só o que mudou para corrigir o foco depois de revogar, que o `frontend-reviewer` tinha reprovado. Nada do que aprovei na 1ª rodada mudou no tratamento de dado.

Campos pessoais tocados: continuam só o nome e o e-mail da coordenadora, que o operador digita no diálogo. Nenhum campo novo e nenhuma migration. `packages/nucleo/src/db/schema/convite.ts` só passou a reexportar os 72 h de `@educa/shared`, com o mesmo valor.

Fora da tabela de dados do docs/lgpd.md: nada. A linha 72 continua como na 1ª rodada.

Autorização por objeto: ok. Nenhuma rota nova nem alterada.
- `focarNaEscola` busca a linha pelo atributo `data-acoes-da-escola`, que guarda o UUID da escola. É um dado que o operador já vê na lista, não de pessoa.
- A região do anúncio (`Escolas.tsx:247`) só ficou focável. O texto dela continua sendo o nome da escola, em "Convite de <escola> revogado.".

Logs: limpos. Não há `console.*`, `localStorage` nem `sessionStorage` no código da tarefa.
- A segunda cópia anuncia o texto fixo "Link copiado." (`DialogoDoConvite.tsx:19`, `:151-169`). O link não vai para a região de status.
- A nova frase da pergunta com o pedido no ar (`DialogoDoConvite.tsx:64-66`) é texto fixo, sem link nem dado.

Auditoria: presente. Gerar, refazer e revogar continuam pelo caso de uso da 3.0, que registra na auditoria. A mudança de foco não criou caminho novo.

Envio externo: nenhum. O token continua no fragmento da URL do convite e só na mutação do diálogo, com `gcTime: 0` e `reset()` ao fechar de vez.
- O `focoDeReserva` roda depois que o diálogo desmonta e só move o foco. Não guarda nem mostra o link.
- O "fora" agora só conta quando o `mousedown` também começou fora. Isso não muda nada no ciclo de vida do token.

Seed/fixture: sintético. Os e-mails do e2e usam `@educa.invalid`, e as novas asserções de foco no W8 e no W2 não trazem dado real.

Pergunta de fechamento: o código responde. Esta rodada não criou dado sobre aluno nem envio externo.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. As três da 1ª rodada continuam para o `/validar`:
1. Confirmar que a lista oferece Refazer quando o operador fecha com o pedido ainda no ar.
2. Limpar as escolas e os convites sintéticos que o e2e deixa no banco de teste.
3. Acrescentar à linha 72 de `docs/lgpd.md` que o nome e o e-mail digitados vivem só no diálogo e na mutação dele.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDaOperacao.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDoConvite.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite-coordenacao.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/painel.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/convite.ts`

## frontend-reviewer · 2ª rodada · APROVADO · 2026-09-25 07:41:19 · `tasks/prd-apresentacao-painel/7_task.md`

VEREDITO: APROVADO

A correção da 1ª rodada foi feita: o foco não se perde mais depois de revogar, pelos dois caminhos, e os dois e2e provam isso.

Estados: ok. Nesta rodada só mudou o foco e dois textos. Os quatro estados da tela Escolas continuam como estavam.

Acessibilidade: a correção exigida está feita.
- **Revogar com sucesso.** O diálogo fecha e o foco volta ao "Revogar". Quando a lista recarrega, esse botão some. O código percebe isso, confere que o foco caiu no `body` e o manda para a primeira ação que sobrou na escola, o "Convidar". Onde isso acontece: `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx`, na função `AcoesDoConvite`, linhas 60-74.
- **Conflito ou convite já revogado.** O "Revogar" some com o diálogo ainda aberto. Ao clicar em "Fechar", o diálogo vê que o botão que o abriu não existe mais e chama o `focoDeReserva`, que põe o foco no "Convidar" da escola. Onde isso acontece: `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDaOperacao.tsx:83`.
- **Sem roubo de foco.** O código só age com o foco no `body`, então não tira o foco de dentro de um diálogo aberto. A busca pelo botão também pula a versão escondida da lista (a tabela no celular, o cartão no computador).
- **Quando a escola não tem ação nenhuma.** O foco vai para o anúncio da página, que ganhou `tabIndex={-1}` (`Escolas.tsx:247`). O foco visível vem do estilo global de foco, em `estilos.css:91`.
- **Recomendações da rodada anterior.** As três foram aplicadas: o clique fora só fecha se também começou fora da caixa, a pergunta diz que o convite ainda está sendo gerado, e a segunda cópia do link é anunciada de novo.

Chromebook fraco: nada novo que pese. A busca pelo botão é uma consulta pontual, só quando o foco se perde, e a tela não ganhou nenhuma animação.

Celular: os dois e2e rodam também no projeto `celular`, sem nenhum `skip`. Nesse projeto a ação da escola fica no cartão, e é nele que a busca acha o botão.

Ação oficial protegida: sim. O revogar continua pedindo confirmação, que diz o que acontece. O foco começa no texto, e não no botão que revoga.

Testes do foco:
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite-coordenacao.spec.ts:502-514` (W8) revoga só pelo teclado. Depois que a lista recarrega, confere o foco no "Convidar".
- As linhas 325-330 (W2) conferem que o "Revogar" sai da linha com o diálogo aberto e, depois de "Fechar", o foco no "Convidar".
- Segundo o relato, os dois ficam vermelhos quando `focarNaEscola` não faz nada.

Bloqueantes: nenhum.

Recomendações:
1. Quando o foco vai para o anúncio da página, ele pode estar vazio ou com um texto antigo. Isso acontece no caminho do conflito quando a escola já saiu da página, e o leitor de tela não diz nada útil. Vale escrever ali um texto curto sobre o que aconteceu (`Escolas.tsx:207` e `:247`), para o `/validar`.
2. Não há e2e para esse caminho em que o foco cai no anúncio. É cobertura extra, não bloqueia.
3. Continua pendente para o `/validar` o texto do `CONFLITO` no gerar quando a escola ficou `ativa` (W10), como já registrado.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-25 07:41:31 · `tasks/prd-apresentacao-painel/7_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As divergências novas desta rodada estão registradas em `tasks/prd-apresentacao-painel/7_task.md`: o foco quando o botão sai da linha, o "fora" que só vale se o clique começou fora, e o texto da pergunta com o pedido no ar. Nenhuma toca a arquitetura.
Portão local: carimbo válido para a árvore atual (typecheck, lint, test, e2e).

Bloqueantes: nenhum.

Conferi o que o `frontend-reviewer` exigiu, o foco que se perdia depois de revogar, nos dois caminhos.
- **Revogar que dá certo.** O diálogo fecha e devolve o foco ao "Revogar", que ainda está na tela. Quando a lista recarrega, o botão sai. A limpeza do `ref` roda antes de o nó ser removido (React 19.3) e guarda o botão que tinha o foco. O `useEffect` da linha vê o botão fora da página e o foco no `body`, e chama `focarNaEscola` (`apps/web/src/operacao/paginas/Escolas.tsx:58-66`).
- **`CONFLITO` ou `NAO_ENCONTRADO` com o diálogo aberto.** Ao fechar, o `quemAbriu` já saiu da página e entra o `reserva.current` (`apps/web/src/operacao/componentes/DialogoDaOperacao.tsx:82-83`).
- **Alvo do foco.** `focarNaEscola` escolhe o grupo à vista, tabela ou cartão, pelo `getClientRects`. Com a escola `ativa`, o grupo tem `hidden` e o foco vai para o anúncio.
- **E2e.** O W8 (`e2e/operacao-convite-coordenacao.spec.ts:502-514`) revoga só pelo teclado e confere `toBeFocused()` no "Convidar". O W2 (`:325-330`) faz o mesmo no revogar já revogado. Os dois rodam nos projetos `chromebook` e `celular`.
- **Minhas recomendações da 1ª rodada.** Foram atendidas: o `mousedown` precisa começar fora, a pergunta tem texto próprio com o pedido no ar, e o "Link copiado." é anunciado de novo com `key={vezDaCopia}`.

Recomendações:
- `Escolas.tsx:72-74`. O `ref={(botao) => () => …}` depende de o React 19 aceitar que o `ref` devolva uma limpeza, e de a limpeza rodar antes de o nó ser removido. O comentário explica o porquê, mas não diz que depende disso. Uma linha dizendo que é a limpeza de `ref` do React 19 evita que alguém troque para `ref={(b) => …}` e quebre o foco sem perceber.
- `Escolas.tsx:247`. Sem ação na linha, o foco de reserva cai na região `role="status"`. Se o anúncio estiver vazio, o leitor de tela chega a um elemento mudo. Vale dar a ela um nome acessível, como `aria-label="Avisos da lista"`, ou mandar o foco para o cabeçalho da lista.
- As recomendações que vieram da rodada anterior e foram para o `/validar` continuam lá: BotaoCopiar, o nome do fixture, a pergunta no formulário preenchido, e a limpeza do banco de teste.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDaOperacao.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDoConvite.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/ConfirmarConvite.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite-coordenacao.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/7_task.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md

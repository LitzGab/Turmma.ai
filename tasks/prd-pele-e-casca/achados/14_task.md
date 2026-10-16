# Achados das revisões — `tasks/prd-pele-e-casca/14_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-15 23:53:35 · `tasks/prd-pele-e-casca/14_task.md`

VEREDITO: APROVADO
Tela vista: sim (12 fotos lidas: `/entrar`, `/e/<escola>` e `/e/<escola>/turma`, em 1366 e 360 px, escola cheia e vazia). `/mfa` e o link de convite não foram fotografados (pedem sessão e token), mas passam pela mesma `CascaPublica` e têm e2e próprio, sem edição.
Estados: ok. As páginas públicas não têm lista nem dado próprio. A vazia mostra o mesmo formulário com o nome da escola, e o formulário é o próprio convite à ação. Carregando e erro não mudam: `Entrar.tsx` mantém `role="alert"` com `mensagemDaFalha`, o aviso de saída pendente e o aviso de entrada, só com a moldura trocada. Esses dois estados foram conferidos pelo diff do código e pelo e2e que roda sem edição.
Acessibilidade: ok.
- Um `banner`, um `main` e um `h1` (`CascaPublica.tsx:23-41`; `CascaPublica.test.tsx` prova a estrutura).
- A pinta do painel tem `alt=""` e fica fora do `banner`.
- O foco passou para o `Campo`, com anel de 3 px e afastamento 0, e `tokens.spec.ts` foi atualizado nos dois temas.
- Os rótulos "E-mail" e "Senha" não mudaram.
- Há teste do axe a 1366 e a 360 px.

Chromebook fraco: ok.
- Sem imagem nova: reaproveita `turmma-pinta.svg`, sem animação e a 15% de opacidade.
- Entrada medida em brotli: JS −44 B e CSS +166 B, bem abaixo do teto de 150 kB (14_task.md:86).

Celular: ok. A 360 px o painel vira faixa com a marca e o formulário empilha, sem rolagem de lado. Campos e botão têm cerca de 48 px de altura, acima dos 44 px da ação principal. Nada depende de hover. A pinta grande aparece só a partir de 1024 px (`hidden lg:block`).
Ação oficial protegida: sim. A tarefa não tem ação oficial; a entrada não mudou de comportamento.

Bloqueantes: nenhum.
- Português correto, sem termo técnico, id ou texto em inglês.
- O "a5cf1c84" no título do `/e/<escola>` é o nome do colégio sintético da vitrine, não vazamento de id.
- Pele da D80 e `docs/interface.md` 11.3 conferidos: painel `papel` à esquerda com marca e pinta parada, cartão `superficie` com borda de 2 px, botão laranja com degrau. As fotos batem com o código da árvore.

Recomendações:
- O mockup antigo (`mockups/src/areas/entrada/Entrada.tsx`) centra a pinta no painel e traz uma legenda. A implementação a põe no canto de baixo, apagada, como o `interface.md` 11.3 e 9.6 pedem. Vale, porque o mockup de setembro é anterior à D80. Só convém o Gabriel saber que o desenho do canto é intencional.
- A 1024 px com janela baixa (por exemplo 1024x500, tela deitada) a pinta de 320 px pode chegar perto da marca. Não aparece na altura de 768 px das fotos; vale um teste a 1024x560 numa rodada futura.
- Nenhum e2e fotografou `/mfa` nem o convite no estado de erro. Conviria que a próxima vitrine pública os incluísse.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-15 23:53:45 · `tasks/prd-pele-e-casca/14_task.md`

VEREDITO: APROVADO

A tarefa 14.0 é só de visual. Ela não cria nem muda nenhum campo, rota, consulta, log, gravação no navegador ou envio externo. Os arquivos de código alterados são `CascaPublica.tsx` e `Entrar.tsx`; os outros são testes e documentos da spec. Não rodei os testes: li o diff e as fotos.

Campos pessoais tocados: e-mail e senha da equipe em `/entrar`, só na tela. Os dois passam do `<input>` escrito à mão para a peça `Campo` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/paginas/Entrar.tsx`), com o mesmo `name`, `autoComplete`, `maxLength` e `required`. Nada é gravado de forma nova. O aviso da entrada continua só em memória. O `Campo` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Campo.tsx`) não grava nada no navegador e não escreve no console.
Fora da tabela de dados do docs/lgpd.md: nenhum. Não entra campo novo.
Autorização por objeto: não se aplica. Não há rota nem endpoint novo. A tela de erro continua a mesma para "não encontrado" e "sem permissão": `mensagemDaFalha` não mudou, e os e2e `entrar › senha errada e e-mail que não existe…`, `entrar-na-escola › isolamento…` e `convite › W14…` seguem sem edição.
Logs: limpos. Nenhum log foi acrescentado.
Auditoria: não se aplica. A tarefa não toca leitura de dado de aluno, exportação, nota, permissão nem saída de IA.
Envio externo: nenhum. A pinta do painel é o arquivo da marca que já existia (`/marca/turmma-pinta.svg`), servido pelo próprio app. Não entra fonte nem recurso de terceiro.
Seed/fixture: sintético. O e2e usa `professora-sintetica@educa.invalid` e `senha-sintetica-do-foco`. Nas fotos, a escola é "Colégio sintético da vitrine cheia a5cf1c84".

O que as fotos mostram, por papel (as fotos estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/vitrine/`):
- **`publica--entrar--cheia--computador.png`:** só a marca, o título e os campos vazios. Nenhum dado de pessoa.
- **`publica--escola-aluno--cheia--computador.png`:** mostra o nome da escola no `h1`, que é o mesmo comportamento de antes. Os campos de matrícula e senha estão vazios. Nenhum aluno aparece antes de entrar.
- **`publica--escola-turma--cheia--computador.png` e `publica--escola-turma--cheia--celular.png`:** só o pedido do código da turma. Nenhuma lista de nomes antes de o código ser validado.

Bloqueantes: nenhum.

Recomendações:
- O documento da tarefa diz, em "Divergências", que `TurmaPublica.tsx` não foi alterada porque os campos dela já eram `Campo` e `CampoDeSenha`. Do lado da regra 20, isso confirma que o teste `turma-publica › …nada fica no navegador…` continua cobrindo a tela sem edição. Vale o `/validar` conferir que ele rodou verde na esteira desta linha.

Pergunta de fechamento: esta tarefa não muda o que o sistema guarda sobre um aluno nem para onde isso vai. Do lado da tela, a resposta à secretaria fica igual a antes dela.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-15 23:54:37 · `tasks/prd-pele-e-casca/14_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em `cenarios.md` A12 e no item 5 de "O que ficou em aberto". A decisão sobre o aviso de `/mfa` está só no `14_task.md`.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/cenarios.md:53` (A12) e `:417` (item 5). O `cenarios.md` entrega à 14.0 a decisão de manter `SemDesafio.tsx` escrito à mão ou passá-lo à peça `Aviso`. O cabeçalho da seção manda escrever essa decisão em "Divergências resolvidas nesta tarefa". A tarefa decidiu manter à mão (subtarefa 14.2), mas a decisão não está em lugar nenhum da spec:
  - a tabela de Divergências de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/14_task.md:80-86` não tem linha sobre o A12;
  - a linha A12 continua dizendo "A definir na tarefa";
  - o item 5 não foi marcado como fechado (a 5.0 marcou o item 6 como "**Fechado na 5.0:** …");
  - a `techspec.md` não fala de `SemDesafio`.

  Correção exigida:
  1. Acrescentar a linha do A12 nas Divergências do `14_task.md`: o aviso fica escrito à mão, com as cores de hoje (`pendente-cx`, `pendente`), a borda de 1 px, e o motivo (passar ao `Aviso` mexeria em `casca.spec.ts`).
  2. Na coluna de oráculo da linha A12 do `cenarios.md`, trocar "A definir na tarefa" pela decisão tomada.
  3. Marcar o item 5 de "O que ficou em aberto" como "**Fechado na 14.0:** …".

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca-publica.spec.ts:105`: o título diz "o cartão é o fundo da página", mas a asserção (`:112`) cobra o token `superficie`. Ajustar o nome para "o cartão é a `superficie`". O prefixo citado nas duas mutações de `14_task.md:147` e `:154` muda junto. O caso também não confere o cartão no escuro.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca-publica.spec.ts:100`: `['all', 'none'].toContain(transitionProperty)` deixa passar um `transition-all` com duração. O projeto já mede "parada" por `transitionDuration` (`e2e/casca.spec.ts:594`, `e2e/pecas-marca-icones.spec.ts:130`). Usar o mesmo critério.
- Na divergência do `TurmaPublica.tsx` (`14_task.md:82`), vale dizer em uma linha que a `techspec.md` não descrevia esses campos como escritos à mão. O erro era só da descrição de código do documento da tarefa, não da arquitetura.

As fotos (entrar, escola-turma e escola-aluno, a 1366 e a 360 px) batem com a 11.3 e com a techspec 9: painel `papel` com a marca e a pinta apagada à esquerda, cartão centrado à direita, pilha no celular, e os mesmos textos e a mesma ordem de campos. Nenhum achado nelas.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-15 23:55:28 · `tasks/prd-pele-e-casca/14_task.md`

VEREDITO: REPROVADO

Cenários exigidos:
- **Caminho feliz:** a tela se divide a partir de 1024 px, com o painel `papel`, a marca e a pinta parada à esquerda e o cartão à direita.
- **Bordas:**
  - a 1023 px empilha, e no celular de 360 px empilha sem rolagem de lado;
  - nome longo de escola no título de `/e/<escola>` (a `EntrarNaEscola` usa o nome da escola como `h1`);
  - tema escuro;
  - o `banner` com uma pinta só, por causa do modo estrito do A8.
- **Permissão:** não encontrado e sem permissão continuam com a mesma mensagem (`entrar-na-escola › isolamento`, `convite › W14`).
- **Isolamento:** a tarefa não lê dado novo, e cobrem os e2e de antes, sem edição.
- **O que a refatoração não pode perder:** o mesmo rótulo, a mesma ordem, o mesmo `autoComplete` e o mesmo `maxLength` nos dois campos de `/entrar` (14.2).
- **Carga:** a rajada das 7h30, sem edição, e a entrada abaixo de 150 kB.

Cobertos:
- **A divisão a 1024 e a 1366 px e a pilha a 1023 e a 360 px** (`e2e/casca-publica.spec.ts:32-80`), sem rolagem de lado:
  - o cartão centrado e sem esticar;
  - a pinta inteira dentro do painel e escondida quando a tela empilha.
- **A pinta parada e apagada,** com `alt=""` e com o arquivo da marca (`:83-103`).
- **As cores:** o painel é o `papel` nos dois temas e o cartão é a `superficie` (`:105-119`).
- **O axe e os pontos de referência:** sem violação grave, com um `banner` e um `main` só (`:121-131`).
- **A estrutura** no teste de componente: o `header` como `banner`, o `h1`, o filho depois do título e a pinta decorativa fora do `banner`. Rodei `CascaPublica.test.tsx` e os 2 casos passam.
- **A troca para o `Campo`** fica provada pelo afastamento `0px` em `e2e/tokens.spec.ts:242,245,254,257`: se os campos voltassem a ser escritos à mão, o anel teria 2 px e o teste ficaria vermelho.
- **As mutações declaradas:** conferi cada bloco contra o cenário, e cada um chega à cláusula dele.
- Não há `.skip`, mock nem IA.

Bloqueantes:
1. **`apps/web/src/paginas/Entrar.tsx:55-77`: nenhum teste prova o que o campo carrega além do rótulo.** A 14.2 manda manter "o mesmo `autoComplete` e `maxLength`". As linhas foram reescritas como props do `Campo`, mas nenhum teste confere os atributos dos dois campos de `/entrar`:
   - o `entrar.spec.ts` não tem `autocomplete` nem `maxlength`;
   - os specs de `mfa`, `convite`, `entrar-na-escola` e `turma-publica` conferem esses atributos nas páginas deles, mas não em `/entrar`.

   Hoje dá para apagar `autoComplete="current-password"`, `inputMode="email"` ou `maxLength={TAMANHO_MAXIMO_SENHA}` e o portão continua verde. A seção "Mutações" diz que não há cláusula nova em `Entrar.tsx`, mas as linhas mudaram e a exigência da tarefa ficou sem teste.

   **Correção:** asserção em `e2e/casca-publica.spec.ts` (ou no `entrar.spec.ts`) sobre os dois campos, cada um achado pelo nome acessível:
   - **E-mail:** `type="email"`, `inputmode="email"`, `autocomplete="username"`, `autocapitalize="none"`, `spellcheck="false"`, `required` e `maxlength` igual a `TAMANHO_MAXIMO_EMAIL`;
   - **Senha:** `type="password"`, `autocomplete="current-password"`, `required` e `maxlength` igual a `TAMANHO_MAXIMO_SENHA`;
   - **Ordem:** o E-mail vem antes da Senha no DOM.

   Junto, blocos de mutação para pelo menos o `autoComplete` e o `maxLength` de cada campo.

2. **`apps/web/src/componentes/CascaPublica.tsx:54-55`: `min-w-0` no `main` e `break-words` no `h1` são cláusulas novas, sem bloco e sem cenário.** São elas que impedem a rolagem de lado a 360 px quando o título é longo. O caso é real: a `EntrarNaEscola` (`paginas/EntrarNaEscola.tsx:45`) põe o nome da escola no `h1`, como se vê na foto `publica--escola-aluno--cheia--celular.png`.

   O `casca-publica.spec` só usa títulos fixos e curtos ("Entrar" e "Segundo fator"). Sem `min-w-0`, o item flex cresce até a palavra mais longa. Sem `break-words`, o texto passa da borda do `main`. Os dois casos dão rolagem de lado, e nenhum teste fica vermelho.

   **Correção:** um caso a 360 e a 1024 px com um título longo, por exemplo uma escola sintética com uma palavra longa e sem espaço no nome, ou a resposta pública de `/e/<escola>` interceptada com `page.route`. O caso confere que `larguraExcedente` é 0 e que a caixa do `h1` cabe na janela e no cartão. Junto, um bloco que tira `break-words` e outro que tira o `min-w-0` do `main`.

   O `min-w-0` da coluna, a `:53`, parece não fazer nada: a coluna da grade já é `minmax(0,1fr)` e, abaixo de 1024 px, ela não é item de grade. Tire esse `min-w-0` ou prove-o com uma mutação.

Recomendações:
- **A mutação de `lg:items-center` passa por 4 px.** O cartão esticado fica com 672 px e o limite do teste é 668 px. Se a coluna mudar o espaçamento interno, a mutação sobrevive. Uma prova mais firme: o espaço acima do cartão igual ao de baixo, e maior que o espaçamento da coluna.
- **A checagem de transição (`casca-publica.spec.ts:100`) aceita `'all'`, que é o valor padrão.** Uma classe `transition-all duration-300` passaria. Confira `transitionDuration === '0s'`.
- **O nome do teste em `:105` diz que "o cartão é o fundo da página", mas a asserção é a `superficie`.** E o cartão não é medido no escuro.
- **O `max-w-md` a 1366 px não tem prova.** A linha foi reescrita e o teste só confere que o cartão cabe na janela. Acrescente `principal.width <= 448`.
- **A 14.2 fala em `CampoDeSenha`, mas a Senha de `/entrar` usa `Campo` com `type="password"`.** A escolha é razoável, porque o botão "Mostrar" mudaria a ordem do Tab. Falta registrá-la em "Divergências".
- **O portão da tarefa não roda os e2e que a tarefa manda manter sem edição:** `entrar`, `convite`, `mfa`, `turma-publica`, `acesso-suspenso` e `casca`. Confirme que a rodada isolada de "Como testar" foi feita, ou leia a esteira antes de fechar a tarefa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/CascaPublica.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/CascaPublica.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/paginas/Entrar.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca-publica.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/tokens.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/14_task.md

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-16 00:35:37 · `tasks/prd-pele-e-casca/14_task.md`

VEREDITO: APROVADO
Tela vista: sim (10 fotos lidas: Entrar, `/e/<escola>` do aluno e página da turma, no computador e no celular, em cheia e vazia; as de `/e/<escola>` e da turma em computador cheia foram vistas, e as vazias conferidas por amostra)
Estados: ok. Essas telas são formulários sem busca prévia. O carregando é o "Entrando…" do botão, o erro vem de `mensagemDaEntrada` pelo código e diz o que fazer, e a foto "vazia" é só o formulário em branco, que é o convite. Em `apps/web/src/paginas/Entrar.tsx:20-23` isso está declarado.
Acessibilidade: ok. Os dois campos têm rótulo visível, `required` e `autoComplete` (`username` e `current-password`). O e-mail leva `inputMode="email"`, `autoCapitalize="none"` e `spellCheck={false}`. Não há parada de Tab a mais entre a senha e o "Entrar". O aviso e o erro usam `role="alert"`, e o "Entrando…" é anunciado por `role="status"`. O título é um `h1` único dentro do `main`, com um `banner`. O e2e novo (`casca-publica.spec.ts`) trava esses atributos, e o caso do axe a 1366 e a 360 px continua.
Chromebook fraco: ok. O diff da tela só tira dois `min-w-0`, sem peso novo. A pinta é o SVG que a marca já usa, parada, de 1024 px para cima, sem animação. O orçamento em brotli está medido no documento da tarefa e fica longe do teto.
Celular: ok. Nas fotos de 360 px não há rolagem de lado nem corte. Os campos têm cerca de 48 px de altura e o "Entrar" cerca de 44 px, em coluna única. O título comprido quebra com `break-words` (`CascaPublica.tsx:38`). O caso novo de e2e, com nome de escola de 85 caracteres sem espaço, mede 360 e 1024 px. Nada depende de hover. A 1366 px o cartão fica em 448 px e centrado na altura, dentro da pele da D80: painel `papel`, cartão `superficie`, borda de 2 px e botão laranja com degrau.
Ação oficial protegida: sim, não se aplica. As telas só fazem login e entrada na turma, sem ação oficial.
Bloqueantes: nenhum.
Correção exigida na rodada 1: nenhuma. Conferi o diff, e a retirada dos `min-w-0` em `CascaPublica.tsx:36-37` não regride o layout. A coluna é filha de `grid-cols-2` (`minmax(0,1fr)`) de 1024 px para cima e de um bloco abaixo disso. O `main` tem `w-full`. As fotos e o caso de e2e do nome comprido a 360 e a 1024 px confirmam. Como a foto mostra o que o último e2e construiu, vale o código da árvore, e as fotos e o código não se contradizem.
Recomendações:
- Em `apps/web/src/paginas/Entrar.tsx:57` e `:65`, os dois avisos ainda são `<p>` escritos à mão, com `border-pendente` e `bg-pendente-cx`, e o `Aviso` existe como peça. A tarefa registrou a divergência do `/mfa` por causa do oráculo A12. Vale reavaliar na `/retro`, ou quando alguma tela largar `pendente-cx`.
- O `required` nativo mostra a mensagem do navegador. Ela sai em português com o navegador em pt-BR, mas num Chromebook configurado em inglês sai em inglês. Vale considerar `noValidate` com mensagem própria, mas isso não bloqueia.
- A foto "vazia" de `/e/<escola>` mostra o nome sintético da vitrine, com hash, no título. É dado da vitrine, e a tela em si está correta.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-16 00:35:51 · `tasks/prd-pele-e-casca/14_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum novo. Nesta rodada o código só tirou os dois `min-w-0` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/CascaPublica.tsx:36-37`. O resto do diff é teste e documento. `Entrar.tsx` não mudou desde a rodada 1. O e-mail de `/entrar` é o login de professor e coordenação, que já existia, e aluno não entra por ele.

Fora da tabela de dados do docs/lgpd.md: nada. Nenhuma migration, DTO nem campo foi criado ou alterado.

Autorização por objeto: não se aplica. A tarefa não mexe em rota, endpoint nem repository. O teste novo intercepta `/v1/escolas/*/acesso`, que é a resposta pública de nome da escola e provedores. É pública por desenho e não traz dado de pessoa.

Logs: limpos. Nenhum log foi acrescentado.

Auditoria: não se aplica. Nenhuma ação desta tarefa exige auditoria.

Envio externo: nenhum.

Seed/fixture: sintético. O nome comprido em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca-publica.spec.ts:103` é inventado e é o nome de uma escola (o patrono), não de um aluno. Só serve para testar a quebra de palavra. A vitrine mostra "Colégio sintético da vitrine cheia a5cf1c84".

Fotos: vi três das doze, que cobrem as três telas públicas: `publica--entrar--cheia--computador.png`, `publica--escola-turma--cheia--computador.png` e `publica--escola-aluno--cheia--celular.png`. As outras nove (as `--vazia` e a outra largura de cada tela) não abri. As três mostram só a marca, o nome da escola e campos vazios de e-mail e senha, código da turma, ou matrícula e senha. Não aparece nome de aluno, matrícula preenchida, nota nem conteúdo, e nada é mostrado a um papel que não deveria ver.

Correções exigidas na rodada anterior: nenhuma, então não havia o que conferir.

Bloqueantes: nenhum.

Recomendações:
- O nome sintético do teste, "…ProfessoraMariaAparecidaDaSilvaSantosOliveiraPereira", parece nome de pessoa real. Para não acenderem alarme de varredura de dado pessoal no futuro, vale usar um marcador claramente sintético, como "EscolaSinteticaDeNomeCompridoSemEspaco…", que testa a quebra do mesmo jeito.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-16 00:35:54 · `tasks/prd-pele-e-casca/14_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

As três correções da 1ª rodada foram feitas:
1. `tasks/prd-pele-e-casca/14_task.md:85` registra nas Divergências que o aviso de `/mfa` (A12) continua escrito à mão. A linha traz as cores de hoje (`pendente-cx #FDF0E8`, `pendente #8A3E0C`), a borda de 1 px e o motivo.
2. Em `tasks/prd-pele-e-casca/cenarios.md:53`, na linha A12, "A definir na tarefa" saiu e entrou "**Decidido na 14.0: continua escrito à mão**".
3. O item 5 de "O que ficou em aberto", em `cenarios.md:417`, está marcado como "**Fechado na 14.0:** …".

As três recomendações da rodada anterior também foram aplicadas: o teste se chama "o cartão é a `superficie`" e mede o cartão também no escuro; a pinta é conferida por `transitionDuration` `0s`; e a divergência do `TurmaPublica.tsx` diz que a `techspec.md` nunca descreveu aqueles campos como escritos à mão.

O diff da 2ª rodada não passa do que a tarefa pede:
- **`CascaPublica.tsx`:** só tira os dois `min-w-0`. Pela nota das Mutações, a mutação de cada um sobrevivia.
- **Testes novos:** os dois campos de `/entrar` e o nome comprido em `/e/<escola>`.
- **Mutações:** novas para os campos e para o nome comprido.
- **Outras páginas:** nenhuma foi tocada fora da lista prevista.

As fotos `publica--entrar--cheia--computador.png`, `publica--entrar--cheia--celular.png` e `publica--escola-turma--vazia--computador.png` mostram o que a `techspec.md` §9 e a `docs/interface.md` 11.3 descrevem:
- **De 1366 px:** painel `papel` com a marca e a pinta parada e apagada, e o cartão centrado à direita.
- **A 360 px:** faixa com a marca e o formulário empilhado.
- **Textos e campos:** os de antes, na mesma ordem.

Recomendações:
- **Texto da A12 confuso:** `cenarios.md:53` diz "Das duas saídas que o documento previa, vale esta:" e logo depois repete as duas saídas, inclusive a do `Aviso`, que não vale. Deixar só a saída decidida.
- **Parágrafo das Mutações contraditório:** `14_task.md:94` diz que "`Entrar.tsx` não traz cláusula nova", mas `:222-270` traz sete mutações em `Entrar.tsx`. Reescrever o parágrafo de abertura para dizer o que elas provam: o preenchimento, o teto, o teclado e o `required` que passaram ao `Campo`.
- **Tabela vazia em "Recomendações sem aplicar":** em `14_task.md:276-277` a tabela só tem o cabeçalho, sem linha e sem o "nenhuma" que o modelo pede. Escrever "nenhuma", já que as três recomendações da 1ª rodada foram aplicadas.

## test-engineer · 2ª rodada · APROVADO · 2026-10-16 00:36:15 · `tasks/prd-pele-e-casca/14_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o diff r1→r2 (`.processo/ordens/14_task-diff-r1-r2.patch`) e o que ele afeta. Não rodei teste nem alterei arquivo.

Cenários exigidos:
- **Caminho feliz:** a partir de 1024 px a tela se divide, com o painel `papel`, a marca e a pinta parada à esquerda e o cartão centrado à direita.
- **Bordas:**
  - a 1023 px e no celular de 360 px a tela empilha sem rolagem de lado;
  - o nome comprido de escola no `h1` de `/e/<escola>`;
  - o tema escuro;
  - o `banner` com uma pinta só (A8);
  - os dois campos de `/entrar` guardam o que carregavam antes (14.2).
- **Permissão:** "não encontrado" e "sem permissão" continuam com a mesma mensagem, pelos e2e de antes.
- **Isolamento:** a tarefa não lê dado novo.
- **Carga:** a rajada das 7h30 sem edição, e a entrada abaixo de 150 kB.

Cobertos:

1. **Correção 1, feita.** O caso novo em `e2e/casca-publica.spec.ts:127-154` acha os dois campos pelo nome acessível.
   - **E-mail:** confere `name`, `type`, `inputmode`, `autocomplete="username"`, `autocapitalize`, `spellcheck`, `required` e `maxlength=254`.
   - **Senha:** confere `name`, `type="password"`, `autocomplete="current-password"`, `required` e `maxlength=1024`.
   - **Ordem:** prova que o E-mail vem antes da Senha (`compareDocumentPosition`) e que não existe o botão "Mostrar a senha".
   - **Mutações:** `14_task.md:223-270` tem sete blocos: os dois `autoComplete`, os dois `maxLength` (o do e-mail +1, o da senha −1), o `inputMode` e os dois `required`. Os trechos batem com `Entrar.tsx:75-90`.
2. **Correção 2, feita.**
   - **Teste:** o caso em `e2e/casca-publica.spec.ts:156-174` intercepta a rota que a página usa (`/v1/escolas/:slug/acesso`, conferida em `apps/web/src/api/escola.ts:7`). Ele põe uma palavra comprida e sem espaço no `h1` e mede a 360 e a 1024 px: `larguraExcedente` é 0, a caixa do `h1` fica dentro do cartão, o cartão fica dentro da janela, e o texto não vaza do `h1` (`scrollWidth - clientWidth <= 0`).
   - **Mutação:** o bloco que tira `break-words` está em `14_task.md:212`.
   - **Os dois `min-w-0`:** saíram do código (`CascaPublica.tsx:36-37`), com o motivo escrito em `14_task.md:200-202`. O motivo se sustenta: a coluna é item de uma grade `minmax(0,1fr)` e, abaixo de 1024 px, de um bloco; o `main` tem `w-full`, que já limita o mínimo automático do item. Os blocos antigos foram reescritos sem o `min-w-0` (`:118-160`), e não sobrou referência a ele.
3. **Recomendações da 1ª rodada, todas atendidas.**
   - **Centro:** o teste agora exige o espaço de cima igual ao de baixo (±2 px) e ≥ 96 px (`:49-52`). O cartão esticado dá 48 px nos dois lados e reprova.
   - **Largura:** `max-w-md` ganhou `principal.width <= 448` (`:54`) e bloco próprio (`14_task.md:205`). A 1366 px a coluna tem 603 px, então a mutação fica vermelha.
   - **Transição:** passou a ser medida por `transitionDuration === '0s'` (`:105`).
   - **Cartão:** o nome do teste agora diz `superficie`, e o cartão é medido também no escuro (`:110-125`).
   - **Divergências:** a do `CampoDeSenha`→`Campo` e a do A12 foram registradas (`14_task.md`), e o A12 e o item 5 estão fechados no `cenarios.md`.
4. Não há `.skip`, mock que esconda a regra nem IA. O `page.route` do nome comprido só troca o dado de entrada, e a regra testada é o layout. Concorrência não se aplica a esta tarefa.

Bloqueantes: nenhum.

Recomendações:
- O teste afirma `autocapitalize`, `spellcheck`, `name` e `type` dos dois campos, mas nenhum desses atributos tem bloco de mutação. A ordem só pedia o `autoComplete` e o `maxLength`, então não bloqueia; um bloco para `type="password"` seria barato e é o atributo de maior custo se sumir.
- O `acima >= 96` em `e2e/casca-publica.spec.ts:52` depende da altura do conteúdo de `/entrar` e de `/mfa` a 768 px. Se o cartão crescer além de cerca de 576 px, o teste reprova por motivo de conteúdo, e não de centro. Vale um comentário perto do número.
- Os e2e "sem edição" (`entrar`, `convite`, `mfa`, `turma-publica`, `acesso-suspenso`, `casca`) continuam fora do portão da tarefa. O `/validar` deve ler a esteira da linha depois do push, antes de fechar a tarefa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/CascaPublica.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/paginas/Entrar.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca-publica.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/14_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/ordens/14_task-diff-r1-r2.patch

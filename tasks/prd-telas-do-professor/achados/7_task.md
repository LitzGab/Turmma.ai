# Achados das revisões — `tasks/prd-telas-do-professor/7_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 08:27:55 · `tasks/prd-telas-do-professor/7_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas, a escola cheia e a vazia, a 1366 e a 360 px; refotografei a vazia no computador, que seguiu sem rolagem a 1366 × 768)
Estados: ok. Com dado, os três cartões. Com o time suspenso, o selo no cartão e a frase no alto. Quando o time falha, o aviso "Não foi possível conferir…" fica com "Tentar de novo", e os cartões continuam. Sem turma confirmada, o aviso "Falta uma turma confirmada" leva a Turmas. Carregando não tem tela própria: o catálogo é fixo e os cartões aparecem sem esperar as duas leituras, e o aviso de turma só entra quando os vínculos chegam.
Acessibilidade:
- O cartão é um `<a>` único, com o nome acessível da ferramenta. O ícone é `aria-hidden`. A ordem dos títulos é h1 e depois h2 por seção (`Ferramentas.tsx`).
- O foco é o da `Linha`, por dentro do cartão.
- O aviso de leitura falhada usa `role="status"`, e o foco não se perde no "Tentar de novo".
- Axe (violações graves) e alvo de 44 px estão no e2e, nos dois projetos.
Chromebook fraco: ok. São três cartões estáticos, sem lista longa, sem imagem e sem animação, só ícones SVG. As duas leituras são pequenas e não bloqueiam a tela.
Celular: ok.
- A 360 px, a foto mostra uma coluna, sem rolagem horizontal nem texto saindo do bloco.
- O cartão tem cerca de 108 px de altura, com a linha inteira como alvo.
- Nada depende de hover: o `title` com a descrição é só um extra.
- O e2e mede a largura e o alvo nos dois projetos.
Ação oficial protegida: sim. A tela só lê e navega; nada oficial acontece aqui.
Bloqueantes: nenhum.

Observações de conferência:
- Na foto da escola vazia não aparece o aviso "Falta uma turma confirmada". Isso está certo: `tools/vitrine/escola.ts:199` monta a professora da escola vazia com a turma já confirmada. O caso sem turma está provado pelo teste de componente e pelo e2e.
- Rodei `Ferramentas.test.tsx` e `ferramentas.test.ts`: 26 testes passam.
- Em 1366 px a grade tem 3 colunas e cada seção tem um cartão só, então os cartões ocupam um terço da largura e sobra espaço vazio à direita. É o que o PRD manda (3 colunas a partir de 1280) e vai se corrigir sozinho quando entrarem as outras ferramentas.

Recomendações:
1. `apps/web/src/areas/professor/Ferramentas.tsx` (o `line-clamp-3` da descrição): nas fotos o texto é cortado em "…". Na Adaptação some justamente "o conteúdo…", o que explica que o conteúdo não é alterado, e no celular só o `title` mostra o texto inteiro. Encurtar as descrições em `ferramentas.ts` até caberem em três linhas a 360 px, na 8.0 ou em `/validar`.
2. A leitura dos vínculos que falha não tem aviso: sem `vinculos.data`, nada aparece. O efeito é inofensivo, porque o formulário tem o vazio dele. Um aviso curto com "Tentar de novo" daria o mesmo tratamento dos dois erros.
3. Barra inferior do celular, fora desta tarefa (`apps/web/src/componentes/CascaDaEscola.tsx`): o rótulo "FERRAMENTAS" aparece como "FERRAMEN…" a 360 px em todas as telas da professora, e o mesmo corte vale para o nome da escola no cabeçalho. Registrar para a X1, ou ver na `/validar`.
4. O selo da suspensão é um texto com cor de família "info". Se `/validar` achar a diferença para o cartão normal fraca no modo escuro, vale ver o contraste.

Arquivos de referência (caminhos absolutos):
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramentas.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramentas.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-ferramentas.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/.processo/vitrine/`

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 08:28:28 · `tasks/prd-telas-do-professor/7_task.md`

VEREDITO: APROVADO

Cenários exigidos (tabela da tarefa mais os casos de borda do domínio):
- **Só as três:** plano de aula, Adaptação e atividade objetiva, nas categorias da D74 e na ordem delas, e nenhuma outra.
- **Categoria vazia:** "Corrigir" não aparece, e nenhum cartão desligado ou "em breve" fica no lugar do que não existe.
- **Função suspensa:** só a Adaptação; ou a conversa e as ferramentas, que cobrem dois cartões e mostram uma frase só; ou nenhuma.
- **Leitura do time:** o time ainda não respondeu; ou a leitura falhou, com "Tentar de novo" sem aceitar o segundo clique e com a resposta trocando o aviso pelo selo.
- **Sem turma confirmada:** sem vínculo nenhum; só com vínculo pendente; com turma confirmada; e os vínculos ainda não chegaram.
- **O cartão leva ao motor:** o `href` é o do formulário, o ícone é `aria-hidden` e o nome acessível é o da ferramenta.
- **Tela:** a 360 px, sem rolar de lado, alvo de 44 px, axe sem violação grave, nos dois projetos.
- **Recomeço:** a segunda professora, de outra escola, na mesma aba e sem recarregar.
- **Concorrência e isolamento:** não se aplicam, porque a tela só lê. O clique duplo em "Tentar de novo" é o único caso de concorrência real.

Cobertos:
- Todos os cenários acima. `Ferramentas.test.tsx` passa (26/26, junto com `ferramentas.test.ts`), e o e2e de `professor-ferramentas.spec.ts` cobre o resto.
- As 16 mutações batem com as cláusulas novas do `git diff`. Conferi cada uma contra a asserção que a derruba:
  - `leituraDoTimeFalhou`: os dois termos caem nas linhas 166 e 197.
  - O `new Set` cai na linha 150.
  - O filtro das suspensas cai nas linhas 134 e 135.
  - O selo, tanto fixo em `true` quanto fixo em `'adaptacao'`, cai nas linhas 121 e 145.
  - O `onClick`, o `disabled` e o texto "Tentando de novo…" caem nas linhas 191 e 192.
  - Os dois termos do aviso de vínculos caem nas linhas 244 e 232.
  - O destino de "Ir para Turmas" cai na linha 214.
  - O `href`, o ícone de 48 px e o `line-clamp-3` caem nas linhas 93, 98 e 99.
  - A frase "continua em Criados" cai na linha 148.
- Nenhum bloco é vermelho pelo motivo errado.
- O recomeço é efetivo. O `staleTime` global é 30 s (`apps/web/src/api/cliente-de-consultas.ts:25`). Se o cache não fosse esvaziado na saída, a segunda professora veria o selo e os vínculos da primeira, e as linhas 372 e 374 do e2e falhariam.
- A rede falsa responde por caminho, e a tela e o roteador são os de verdade. Não há `.skip`, mock que esconda a regra nem provedor de IA.

Bloqueantes: nenhum

Recomendações:
1. `e2e/professor-ferramentas.spec.ts:299-301`: as duas colunas a partir de 768 px não são medidas por nenhum projeto (o chromebook roda a 1366 e o celular a 360). Tirar o `md:grid-cols-2` passaria verde. A seção "Mutações" da tarefa diz que o e2e mede as colunas, mas não mede a de 768. Vale um `page.setViewportSize({ width: 800, ... })` no caso do catálogo, ou corrigir a frase.
2. `apps/web/src/areas/professor/Ferramentas.tsx:77`: nenhum teste prova o `{ cancelRefetch: false }`, porque o `disabled` já impede o segundo clique. Ou ele sai, ou ganha um comentário dizendo que é só defesa.
3. `apps/web/src/areas/professor/Ferramentas.tsx:57`: o aviso "Falta uma turma confirmada" olha só a primeira página de `/v1/meus-vinculos`. É o mesmo padrão de `Home.tsx` e `CartaoDeFerramenta.tsx`, então não é regressão. Uma professora com muitos vínculos pendentes e a turma confirmada na segunda página veria o aviso por engano. Fica para o `/retro`, como dívida do padrão.
4. Nenhum teste cobre a leitura de vínculos que falha. Hoje o resultado é silencioso (nada de aviso, os cartões ficam). Um caso de componente que fixe isso evitaria que alguém troque por `isError` e faça o aviso aparecer quando não deve.
5. "O cartão leva ao motor" confere só o `href`. Um clique num cartão no e2e, com a URL do formulário em seguida, provaria a navegação de ponta a ponta.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramentas.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramentas.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/ferramentas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/avisos.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-ferramentas.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/prd-telas-do-professor/7_task.md

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 08:28:45 · `tasks/prd-telas-do-professor/7_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

**Como cheguei ao veredito**

- **Escopo.** A tarefa ficou dentro do que pedia. Não entraram o seletor "Para a turma", o Simulado, "Também dá para só pedir", "Que prova corrigir?" nem "Como vai sair" (8.0), e `ferramentas.ts` não foi alterado.
- **Divergências.** As cinco estão registradas na techspec §9 ("Ferramentas (divergências da 7.0)") e o texto da página está em `docs/interface.md` 1.2. Esta spec não tem `cenarios.md`.
- **Aviso "Falta uma turma confirmada".** A tabela de testes da própria tarefa pede esse aviso, e a leitura de `GET /v1/meus-vinculos` está registrada como divergência 3. A rota já existe.
- **Fotos.** As quatro mostram o `h1` "Ferramentas", as seções Planejar, Preparar a aula e Avaliar, e um cartão por ferramenta com o ícone e a descrição cortada em três linhas. Não aparece "Corrigir" nem cartão "em breve", e nenhuma das fotos pede rolagem a 360 px.

**Recomendações**

1. **Título de cada seção sem a frase de apoio.** O mockup §8 põe uma frase de apoio ao lado do título de cada seção (por exemplo "A aula, a sequência e o bimestre"), e o `CabecalhoDeSecao` já aceita `apoio`. A tarefa não pediu, então a decisão fica com o `frontend-reviewer`. O título sai em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramentas.tsx:87`.
2. **Espaço vazio no computador.** A 1366 px cada seção tem um cartão só numa grade de 3 colunas, e dois terços da largura ficam vazios (`professora--professor-ferramentas--link-name-Ferramentas--computador.png`). Está conforme o pedido; a avaliação visual é do `frontend-reviewer`.
3. **Falha na leitura dos vínculos não aparece na tela.** Se `GET /v1/meus-vinculos` falhar, a página não mostra nada, nem o aviso nem "Tentar de novo" (`Ferramentas.tsx:71`). Como a leitura só serve para avisar e não tira cartão, aceito. Vale uma linha no comentário do componente dizendo que é proposital.
4. **Teste que pode passar cedo demais.** O teste "com uma turma confirmada não há aviso" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramentas.test.tsx:225`) espera a chamada a `/v1/meus-vinculos` sair, mas não espera a resposta ser desenhada antes de afirmar que o aviso não está lá. Esperar por um sinal de que os vínculos chegaram deixa a prova mais firme. A palavra final é do `test-engineer`.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-19 08:45:32 · `tasks/prd-telas-do-professor/7_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: `/professor/ferramentas` a 1366 e a 360 px, escola cheia e escola vazia). A foto mostra o que o último e2e construiu. O código da árvore concorda com ela.
Estados:
- ok. O catálogo é fixo e não depende de leitura, então não há carregando nem vazio a mostrar. Os três cartões aparecem já na primeira pintura, e nenhum cartão some por erro.
- Erro da leitura do time: aviso com "Tentar de novo" e `role="status"`.
- Erro da leitura dos vínculos: silêncio de propósito, com os cartões mantidos. O comentário em `Ferramentas.tsx` explica o motivo e o teste novo prova.
- Sem turma confirmada: aviso que convida e leva a Turmas ("Ir para Turmas"), sem se desculpar.
- Com dado: foto cheia, com o selo "Esperando você 1" no topo.

Acessibilidade:
- Cada seção tem `aria-labelledby` e o cartão é um `<a>` inteiro, o que dá um alvo de toque grande (mínimo de 108 px de altura, na foto ~110 px).
- O foco e o estado de pressão aparecem; o cartão cinza na foto do celular é o estado depois do clique.
- A descrição cortada tem `title` com o texto inteiro.
- Os textos ficam legíveis e o contraste é bom nas fotos.
- O e2e roda axe (`violacoesGraves`).

Chromebook fraco:
- Sem lista longa, sem imagem, sem animação.
- Só três cartões, com ícones ilustrados de 48 px.
- Duas leituras leves em paralelo.
- Nenhum bloqueio para a foto de prova, que não se aplica a esta tela.

Celular:
- ok a 360 px. As fotos não mostram rolagem horizontal, os cartões ocupam a largura inteira em uma coluna e a barra inferior tem quatro itens com rótulo legível.
- O e2e mede `larguraExcedente` igual a 0 e as colunas da grade (3 a partir de 1280, 2 a 800, 1 abaixo).
- O diff novo acrescenta a medida a 800 px e o caso de abrir cada cartão e voltar pelo "Voltar para Ferramentas".
- Nada depende de hover: o `title` é só reforço e o texto é visível.
- A tela não exige celular.

Ação oficial protegida: sim. A tela só navega para os formulários e não faz nenhuma ação oficial. Gerar passa pelo formulário e pelo Assistente, e quem recusa uma função suspensa é o servidor.

Bloqueantes: nenhum.
- A mudança de `refetch({ cancelRefetch: false })` para `refetch()` não muda o comportamento visível. O botão fica desabilitado enquanto `isFetching`, então não há segundo disparo.
- O teste novo da leitura de vínculos que falha prova o que o comentário diz: sem aviso, sem botão, sem alert, três cartões.
- O helper `naoApareceDepoisDaLeitura` dá uma janela de 300 ms em que o aviso poderia aparecer, e o teste exige que ele não apareça.

Recomendações:
- Na foto, as três descrições terminam em reticências ("…a partir do material…", "…o conteúdo…", "…a página de…"). O corte está dentro do que o `docs/interface.md` pede (até três linhas) e o texto completo está no `title`. Mas na tela do computador, no celular e no toque, o texto fica pela metade. Convém encurtar as descrições em `apps/web/src/areas/professor/ferramentas.ts` para que caibam inteiras em três linhas a 360 px.
- No computador, a grade fica com um cartão por categoria e deixa a área à direita vazia. É a consequência de ter só três ferramentas e não de um defeito, mas vale rever quando entrar a quarta ferramenta.
- A foto da escola vazia mostra o selo sem contador, o que é correto. Nenhum texto técnico vaza em nenhuma das fotos.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 08:45:52 · `tasks/prd-telas-do-professor/7_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. O `conferir` respondeu "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)"
Bloqueantes: nenhum

As duas correções que a Mesa mandou aplicar estão feitas:
- **Comentário sobre o silêncio de propósito:** está no cabeçalho de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramentas.tsx` e diz que, quando a leitura dos vínculos falha, a tela não mostra aviso nem "Tentar de novo".
- **Esperar a resposta dos vínculos no teste:** o caso "com uma turma confirmada não há aviso" agora usa `naoApareceDepoisDaLeitura`, depois de esperar a chamada a `/v1/meus-vinculos`. Ele deixou de checar com `queryByText` logo depois que a página carrega, e por isso a prova vale.

O que mudou desde a rodada aprovada:
- **Caso novo da leitura dos vínculos que falha:** tem uma mutação declarada no `7_task.md`, que troca `vinculos.data !== undefined` por `!vinculos.isPending`. O caso prova o que a tela promete: os três cartões ficam e não aparece botão nem `alert`.
- **`refetch()` sem `cancelRefetch: false`:** não muda o comportamento, porque o botão fica desabilitado enquanto `isFetching`. As duas mutações dessa linha no `7_task.md` já citam o texto novo.
- **e2e:** passou a medir a grade também a 800 px, onde se espera 2 colunas, nos dois projetos. Ganhou um caso que clica em cada cartão, confere o endereço e o título do formulário e volta pelo "Voltar para Ferramentas". Isso cobre o que o `jsdom` não mede e está dito no `7_task.md`.
- **Arquivo novo:** `Ferramentas.test.tsx` não está no git e é igual ao do commit `528d110`. O `achados/7_task.md` difere do commit, mas é registro de revisão, não código.

Fotos de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/.processo/vitrine/`:
- `professora--professor-ferramentas--link-name-Ferramentas--computador.png` e `vazia--professora--professor-ferramentas--link-name-Ferramentas--celular.png` mostram as três ferramentas nas categorias da D74 (Planejar, Preparar a aula, Avaliar).
- Nenhuma ferramenta aparece além das três, e os nomes seguem o glossário.
- O aviso de turma não aparece, e a página não rola a 1366 × 768.

Recomendações:
- O helper `naoApareceDepoisDaLeitura` só vale com o `retry` do QueryClient do teste desligado: com nova tentativa, a falha não chega dentro dos 300 ms e a mutação do caso novo passaria. Uma linha no comentário do helper dizendo isso evita uma regressão silenciosa se o `retry` for ligado.

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 08:46:03 · `tasks/prd-telas-do-professor/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- A seção por categoria da D74 só com as três ferramentas, sem "Corrigir" nem "em breve", e cada cartão abrindo o formulário dele.
- O selo e a frase da função suspensa, só na função suspensa e uma frase por função.
- O time que ainda não respondeu, o time que falha com "Tentar de novo" e o time que responde depois.
- Os quatro casos dos vínculos: sem vínculo, só vínculo pendente, turma confirmada, leitura que falha e leitura que ainda não chegou.
- As colunas da grade em 3, 2 e 1, sem rolagem horizontal, com axe.
- Desta rodada: as duas colunas medidas, o silêncio dos vínculos que falham, o clique em cada cartão com a URL e a volta ao catálogo.

**Cobertos:** todos os cenários acima. As correções que a Mesa mandou aplicar foram conferidas no diff `efb1b8f..528d110`:
- **(1) Duas colunas medidas:** o e2e agora mede também a 800 × 900, com `expect.poll(colunasDaGrade).toBe(2)` e a largura excedente em 0, nos dois projetos.
- **(2) `cancelRefetch: false` saiu:** o botão chama `time.refetch()` e continua desligado enquanto `isFetching`. As mutações 7 e 8 do documento batem com a linha 58 atual de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramentas.tsx`.
- **(3) O silêncio dos vínculos que falham:** o caso novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramentas.test.tsx:237`, e a mutação nova (`!vinculos.isPending`) fica vermelha pelo motivo certo:
  - o 404 `NAO_ENCONTRADO` não é repetido sozinho, porque `deveTentarDeNovo` só repete indisponível, tempo esgotado e erro interno;
  - por isso a consulta vai direto para erro, com `isPending` falso e `data` indefinido;
  - com a mutação, o aviso apareceria na hora, o `findByText` o acharia e o `rejects.toThrow()` falharia.
  - O caso não passa à toa por causa de uma nova tentativa demorada.
- **A janela de 300 ms:** o helper só é chamado depois de confirmar que a leitura saiu (`chamadasA(...).toHaveLength(1)`), e a rede falsa responde na hora. A janela não deixa o teste instável no sentido verde: numa máquina carregada, o pior que acontece é uma mutação passar em falso, nunca um falso vermelho. No caso "com uma turma confirmada", a mutação `vinculos.data !== undefined && (` também faria o aviso aparecer e o teste ficaria vermelho.
- **(5) O clique em cada cartão:** o e2e novo, na linha 71, aciona o link de cada cartão, confere a URL `/professor/ferramentas/<ferramenta>` e o `h1` com o nome da ferramenta, volta por "Voltar para Ferramentas" (texto que existe em `Ferramenta.tsx:34`) e confere a URL e o `h1` do catálogo.
- **A recomendação do revisor-geral:** o caso "com uma turma confirmada" agora espera a leitura dos vínculos sair e só então confere a ausência do aviso.
- **Os 17 blocos de mutação:** todos os trechos citados batem com o arquivo atual, inclusive o de `avisos.tsx` ("continua em Criados. Fale").
- **A rodada de testes:** `npx vitest run apps/web/src/areas/professor/Ferramentas.test.tsx` deu 13 de 13 verdes.

**Bloqueantes:** nenhum. Não há `.skip`, a rede falsa só substitui o HTTP, e a tela, o cliente de consultas e o roteador rodam de verdade. Não há IA nem operação concorrente nova nesta rodada.

**Recomendações:** nenhuma nova. As da rodada anterior que não foram aplicadas estão registradas com destino na tabela "Recomendações sem aplicar" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/prd-telas-do-professor/7_task.md`.

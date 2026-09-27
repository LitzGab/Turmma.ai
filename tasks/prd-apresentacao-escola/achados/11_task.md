# Achados das revisões — `tasks/prd-apresentacao-escola/11_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-27 09:02:55 · `tasks/prd-apresentacao-escola/11_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **W2:** cada papel vê só os itens da fase, e nenhum item leva a tela que não existe. O professor nos endereços da coordenação e do aluno cai em "não encontrada", e o aluno nos do professor e da coordenação também. O título da aba muda por rota.
- **W5:** o `import()` de `coordenacao-*` e de `professor-*` abortado mostra o texto e o título da falha, e o título de antes volta ao sair.
- **W4 (Turmas):** carregando, vazio, erro com "Tentar de novo", só pendente e com dado.
- **W12 (casca):** 360 px sem rolagem horizontal, gaveta abaixo de 768 px, trilho de 768 a 1023 px, alvos de 44 px, Tab pela lateral, foco preso na gaveta e devolvido ao fechar.
- **Recomeço da tela:** segunda pessoa na mesma aba, a mesma entrada aberta de novo, resposta atrasada e falha com a gaveta aberta.
- **Borda do domínio:** professor com duas disciplinas na mesma turma; o Chromebook do carrinho passando de mão; o login por cima com a mesma pessoa sem perder o rascunho; a troca de escola pelo seletor.
- **Permissão:** papel errado no endereço de outra área (a guarda); sem sessão numa rota da área.
- **Guarda com a API fora:** a sessão abre, mas o `/v1/eu` responde 5xx ou demora.

**Cobertos:**
- W2, com o pedido do chunk provando a guarda (`e2e/areas.spec.ts:111-159`).
- W5 nas duas áreas, com a volta do título ao sair.
- W4: vazio, erro, só pendente e com dado em `e2e/areas.spec.ts:216`; o carregando em `e2e/escola-e-vinculos.spec.ts:417`.
- W12 inteiro em `e2e/casca.spec.ts`.
- Segunda pessoa, mesma entrada, falha com a gaveta aberta e troca de escola.
- O `?? papelConhecido`, pelo e2e de inatividade; o Chromebook do carrinho.
- Tetos e nomes dos chunks sobre o build de verdade, com controles.

As mutações da tabela batem com as linhas do diff. Não achei `.skip`, `.only` nem mock que esconda a regra. A tarefa não tem IA nem API nova.

**Bloqueantes:**

1. **O teste da resposta atrasada passa sem provar nada** (`e2e/areas.spec.ts:344-367`).
   - O `chegou = true` é marcado logo depois de `rota.continue()`. Esse método termina quando o pedido é enviado à rede, não quando a resposta chega. Então a marca não prova que o chunk chegou, nem que foi executado.
   - O `page.waitForLoadState('networkidle')` na linha 362 volta na hora, porque a página já tinha atingido esse estado no carregamento.
   - Com isso, as asserções de ausência das linhas 363-366 rodam antes de o chunk chegar. No projeto `chromebook`, com Fast 3G e ~560 ms de latência, isso acontece quase sempre. Se a área lenta aparecesse por cima de "Início", por exemplo com a área montada fora do `Switch`, o teste continuaria verde.
   - Correção exigida:
     - Criar um ponto de sincronia depois da execução do módulo. Pode ser: esperar a resposta do chunk com `page.waitForResponse(CHUNK_DO_PROFESSOR)` e `.finished()`; depois `page.evaluate((url) => import(url), urlDoChunk)`, que só resolve com o mesmo módulo já avaliado; depois esperar dois `requestAnimationFrame`. Só então rodar as asserções de ausência.
     - Como controle, ir a `/professor/turmas` sem recarregar e provar que "Turmas" aparece sem um segundo pedido do chunk.
     - Registrar em "Mutações" a mutação que deixa este teste vermelho, por exemplo a área montada fora do `Switch`.

2. **O caminho da guarda sem papel conhecido não tem teste** (`apps/web/src/rotas.tsx:109-111`). É o `EstadoErro` com "Tentar de novo" e o `EstadoCarregando` enquanto o `/v1/eu` não chegou.
   - A mutação mais perigosa passa verde: trocar o bloco por `return <ConteudoNaoEncontrado />`, que diz "Página não encontrada" a um professor com a API oscilando. Tirar só a linha 110 também passa, e aí fica "Carregando…" para sempre, sem nova tentativa.
   - O W4 da linha 239 faz `reload()` e espera o alerta, que acaba aparecendo depois. O `inatividade.spec.ts:215` falha o `/v1/eu` em `/`, onde quem responde é o `Inicio`, e não a guarda.
   - Correção exigida: um e2e que abra `/professor/turmas` direto com o `/v1/eu` interceptado.
     - Com o `/v1/eu` segurado: o `status` "Carregando…" no `main`, sem "Página não encontrada".
     - Com 503: um `alert` com a mensagem do catálogo e "Tentar de novo", sem "Página não encontrada" e sem pedido do chunk `professor-*`.
     - Com o `/v1/eu` liberado: "Tentar de novo" leva a "Turmas".
     - A linha correspondente em "Mutações".

**Recomendações:**
- **Contestada no grupo certo** (`apps/web/src/areas/professor/Turmas.tsx:77`): nada prova que o vínculo contestado fica em "Confirme suas turmas". Trocar as duas linhas para `estado === 'pendente'` o levaria a "Suas turmas" sem nenhum teste vermelho. Basta contestar um vínculo e conferir a região.
- **Permissão sem sessão:** abrir `/professor/turmas` sem sessão deve levar a `/entrar` sem pedir o chunk `professor-*`. Hoje isso só está provado para `/` (`e2e/entrar.spec.ts:426`).
- **W2 pela tabela:** percorrer `NAVEGACAO[papel]` no e2e e provar que nenhum item cai em "não encontrada". Assim a 12.0 a 14.0 herdam a prova ao acrescentar a linha delas, em vez de cada uma reescrever a asserção fixa `['Turmas']`.
- **Comentário velho:** `e2e/__fixtures__/sessao.ts:273` ainda cita a tela `/vinculos`.

## test-engineer · 2ª rodada · APROVADO · 2026-09-27 09:23:50 · `tasks/prd-apresentacao-escola/11_task.md`

VEREDITO: APROVADO

Cenários exigidos: as duas correções da 1ª rodada. (1) Resposta atrasada: o módulo da área chega e é executado depois que a pessoa saiu da área, e nada dele aparece; no controle, a área abre sem recarregar e sem pedir o chunk de novo. (2) A guarda sem papel conhecido, em três passos: `/v1/eu` segurado, `/v1/eu` com 503, `/v1/eu` liberado. Também revi o que as recomendações aplicadas mudaram: a contestada fica em "Confirme suas turmas", o endereço de área sem sessão, a lista do W2 e a tabela de "Mutações".

Cobertos:
- **Correção 1** (`e2e/areas.spec.ts:367-402`): o `chegou` saiu, e a sincronia agora é real.
  - O teste espera o pedido do chunk, segura a resposta, volta ao início, espera `finished()` e faz `import(url)` no `page.evaluate`, com dois `requestAnimationFrame` depois. Esse `import()` só resolve depois que o módulo roda, porque a URL é a mesma e o mapa de módulos da página é um só.
  - A asserção de que o único `<h1>` do `main` é o "Olá, …" fecha as duas saídas: nem a área nem a "não encontrada" dela aparecem.
  - O controle prova que o chunk chegou de fato: `navegarSemRecarregar` mostra Turmas, e o chunk foi pedido uma vez só.
  - A mutação está na linha 135 da tabela.
- **Correção 2** (`e2e/areas.spec.ts:404-441`): os três passos pedidos, com o chunk `professor-*` nunca pedido durante a falha.
  - O `<main>` da casca sempre renderiza os filhos (`CascaDaEscola.tsx:249`). Então o "Carregando…" e o alerta dentro do `main` só podem vir da guarda: não há estado da casca que faça o teste passar sozinho.
  - As duas mutações estão nas linhas 133-134, e as referências batem com `rotas.tsx:109-111` e `rotas.tsx:110` atuais.
- **W4** (`e2e/areas.spec.ts:282-290`): a contestada continua em "Confirme suas turmas" e "Suas turmas" continua com um item. A mutação `estado === 'pendente'` está registrada.
- **Sem sessão** (`e2e/areas.spec.ts:443-449`): leva à entrada sem pedir o chunk.
- **W2**: percorre `ITENS_DO_PROFESSOR`. O comentário de `apps/web/src/areas/navegacao.ts` manda acrescentar o item nas duas listas.
- Sem `.skip`, `.only` nem `fixme`. Nenhum mock esconde a regra: só `/v1/eu`, `/v1/meus-vinculos` e o chunk são interceptados, e é justamente o que está sob teste.

Execução: tentei rodar os três testes novos contra o compose de teste. Não chegaram a executar: a web e a API não estão de pé agora (`ERR_CONNECTION_REFUSED` em `127.0.0.1:28090`), só postgres, redis, storage e o oidc falso. O problema é do ambiente, não dos testes. Não reprovei por isso: o portão final roda `--e2e`. Mas o relato de "26 passando" não pôde ser conferido nesta rodada.

Bloqueantes: nenhum.

Recomendações:
- `e2e/areas.spec.ts:387`: `await (await resposta)?.finished()` pula a espera em silêncio se a resposta vier `null`. Um `expect(await resposta).not.toBeNull()` antes deixa o ponto de sincronia explícito.
- `e2e/areas.spec.ts:404-441`: afirmar também o título da aba durante o "Carregando…" e o alerta. E, no passo 3, afirmar que o chunk `professor-*` foi pedido uma vez só depois do "Tentar de novo".
- A lista `ITENS_DO_PROFESSOR` repete `NAVEGACAO` à mão e pode divergir quando a 12.0 a 14.0 acrescentarem itens. Um teste de unidade em `apps/web` que compare as duas (lendo o spec ou um JSON comum) impediria isso. Já está registrado em "Recomendações sem aplicar"; fica para o `/retro`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/areas.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/casca.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/rotas.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/navegacao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/CascaDaEscola.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/11_task.md`

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-09-27 09:28:01 · `tasks/prd-apresentacao-escola/11_task.md`

VEREDITO: AJUSTES NECESSÁRIOS

Estados: ok. Turmas tem os quatro estados. O vazio convida e diz que é a coordenação quem aloca. O erro usa a mensagem do catálogo e traz "Tentar de novo", e o dado aparece em dois grupos. A guarda tem carregando e erro, e a fronteira tem a tela de falha. O feed de agentes não se aplica: é da A2.

Acessibilidade: boa.
- O foco aparece em tudo, pelo `:focus-visible` global.
- A gaveta usa `dialog` modal nativo. Ela prende o foco, fecha com Esc e devolve o foco a quem a abriu.
- O item selecionado tem as três pistas mais o `aria-current`.
- Botão só de ícone leva nome para o leitor de tela e dica também pelo teclado.
- O `<h1>` só para leitor de tela segue a seção 6.
- A falha leva o foco ao título dela, e cada rota tem o próprio título de aba.
- O axe não acha violação grave na gaveta, no trilho, na lateral e em Turmas (casca.spec e areas.spec).
- Contraste: `apoio` e `sutil` sobre `lateral` passam de 6:1.

Chromebook fraco: ok.
- Cada área vem por `import()`, com teto próprio no `.size-limit.json`.
- O teto de 150 kB agora soma `index-*` e `parte-*`, então o React não fica fora da conta.
- `lucide-react` entra ícone a ícone e não há animação nova.
- O projeto `chromebook` roda com CPU ×4 e Fast 3G.

Celular: ok.
- A barra do topo tem o menu, a pinta, a escola e o "Sair", a um toque.
- Os alvos de 44 px são medidos, e a 360 px não há rolagem horizontal (medido em cada estado).
- Nada depende de hover: no trilho, a dica também aparece pelo foco.
- Rodei `e2e/areas.spec.ts` e `e2e/casca.spec.ts` contra o compose de teste: 60 de 60 verdes, nos projetos `chromebook` e `celular`.

Ação oficial protegida: sim. O cartão mostra turma e disciplina antes do "Confirmar". Contestar mostra o efeito (`EFEITO_DA_CONTESTACAO`) antes do envio. Há uma decisão por vez (`decidindo`). Nada de nota nesta tarefa.

Bloqueantes:
1. `apps/web/src/paginas/Inicio.tsx:33`: o texto ficou falso e custa ao professor o fluxo de confirmar vínculo.
   - **O que está errado:** a página inicial diz "As suas turmas, o calendário e as ferramentas aparecem aqui nas próximas versões." Esta tarefa pôs "Turmas" no produto e tirou o link "Meus vínculos" que o `Cabecalho` deixava à vista.
   - **O efeito:** o professor chega em Início e lê que as turmas ainda não existem. No celular, "Turmas" só se alcança pela gaveta, com dois toques. Vínculo pendente não dá acesso à turma (E12), e a primeira tela diz que não há nada a fazer.
   - **Correção exigida:**
     - Tirar "as suas turmas" da frase.
     - Para o papel `professor`, apontar para "Turmas" com um link para `ROTAS.turmas` ("Confira e confirme as suas turmas em Turmas").
     - Afirmar no W2 (`e2e/areas.spec.ts`, teste "o professor vê só Turmas…") que Início não diz que as turmas estão para depois e que o link leva a Turmas.
     - Para coordenação e aluno, a frase pode ficar sem "turmas" até a 12.0 e a 13.0.

Recomendações:
- **Estado da gaveta na troca de largura** (`apps/web/src/componentes/CascaDaEscola.tsx:216-220`). Entre as faixas estreita e média, o `dialog` continua montado na mesma posição da árvore e segue aberto. Mesmo assim, `definirGavetaAberta(false)` roda, e o `aria-expanded` do trilho diz `false` com a gaveta aberta. Uma saída é fechar o `dialog` de fato nessa troca (`gaveta.current?.close()`), ou só zerar o estado quando a transição envolve a faixa larga. O comentário "a troca de largura desmonta a gaveta" só vale para a larga.
- **Texto do botão da falha** (`apps/web/src/componentes/FronteiraDaArea.tsx:48`): diz "Tente de novo", e o resto do produto diz "Tentar de novo" (`EstadoErro`). O texto já vinha da `FronteiraDaOperacao`; vale alinhar agora que a peça é genérica.
- **Trilho num tablet de toque (768 a 1023 px):** o rótulo só aparece na dica (hover ou foco) ou abrindo a lateral. Está conforme a 11.1, mas quando a 13.0 e a 14.0 somarem itens, vale conferir no `/validar` se o ícone sozinho basta ali.
- **Pular para o conteúdo:** com os landmarks `nav` e `main` o bloco já pode ser pulado. Mas quando a lateral da coordenação tiver os onze itens, um link "Pular para o conteúdo" poupa o Tab de quem usa teclado.
- **Botões fora das variantes da 11.1:** "Contestar" e "Cancelar" em `Turmas.tsx` repetem à mão a classe `secundario`, e "Confirmar" (decisão sobre vínculo) usa o `Botao` padrão, e não a variante `oficial`. O código veio do F1 como estava; fica para quando o `Botao` ganhar as cinco variantes.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/CascaDaEscola.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/itens-da-lateral.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/MenuDaPessoa.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/FronteiraDaArea.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/NaoEncontrada.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/gaveta.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/rotas.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/titulo.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/navegacao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turmas.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Inicio.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/areas.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/casca.spec.ts`

## test-engineer · 3ª rodada · REPROVADO · 2026-09-27 09:47:03 · `tasks/prd-apresentacao-escola/11_task.md`

VEREDITO: REPROVADO

**Cenários exigidos nesta rodada** (o que mudou depois da minha 2ª rodada aprovada)
- A página inicial do professor aponta para Turmas e não fala mais em "próximas versões".
- A página inicial da coordenação e do aluno não mostra o link para Turmas, porque para eles essa tela não existe.
- A gaveta sai fechada ao entrar na largura do computador.
- Entre celular e trilho, a gaveta aberta continua aberta, e o botão diz que ela está aberta (`aria-expanded` verdadeiro).
- A fronteira de erro diz "Tentar de novo" em todas as telas e testes.
- As recomendações da 2ª rodada foram aplicadas.
- Os seletores da lateral passaram a ser feitos pelo menu "Seções".

**Cobertos**
- Correção 1, o lado do professor. O W2 em `e2e/areas.spec.ts:79-83` confere que o conteúdo da página não diz "próximas versões", toca o link e confere que chegou em `/professor/turmas`. A mutação registrada está em `11_task.md:141`.
- Correção 2, a entrada na largura do computador. `e2e/casca.spec.ts:456-466` abre a gaveta a 900 px, vai a 1366 px, volta a 900 px e confere `aria-expanded` falso e gaveta escondida. A mutação que tira a linha está em `11_task.md:147`.
- Correção 3. `FronteiraDaArea.tsx:48,60`, `e2e/operacao.spec.ts:286-299` e `e2e/areas.spec.ts` agora dizem "Tentar de novo". Sobra "Tente de novo" só nas mensagens de erro do catálogo, e ali está certo.
- Correção 4. `areas.spec.ts:396` faz o `expect(chegada).not.toBeNull()` antes do `finished()`. A guarda sem `/v1/eu` (`areas.spec.ts:433-454`) confere que a aba não diz "Página não encontrada · Turmma" nem no carregando nem no erro, que depois do "Tentar de novo" o título é "Turmas · Turmma" e que o chunk `professor-*` foi pedido uma vez só.
- Correção 5. Os seletores usam o menu "Seções" (`areas.spec.ts:87,115`, `casca.spec.ts:449`).
- Não achei `.skip`, teste comentado nem mock que esconda a regra. Nada aqui toca IA, dado de escola ou concorrência nova.

**Bloqueantes**

1. **A condição por papel em `apps/web/src/paginas/Inicio.tsx:36` não tem teste que a prove.**
   - O que está errado: se o `eu.data.papel === 'professor' ? … : …` virar o link para todos os papéis, nenhum teste fica vermelho. O teste do aluno (`e2e/areas.spec.ts:160-181`) confere a lateral e os endereços, mas não o conteúdo da página inicial. O da coordenação (`areas.spec.ts:303-334`) procura o nome da professora e o da turma, e não o link. Com a mutação, aluno e coordenação ganham na página inicial um link que leva à "não encontrada", e o W2 exige que nada leve a tela que não existe. A linha 141 das Mutações só cobre o destino do link, não a condição.
   - Correção exigida:
     - No teste do aluno, depois do "Olá" (`areas.spec.ts:168`), conferir que `page.getByRole('main').getByRole('link', { name: 'Turmas' })` tem contagem 0 e que o conteúdo da página diz "próximas versões".
     - Fazer o mesmo no teste da coordenação, depois de `entrarComoCoordenacaoNaMesmaAba` (`areas.spec.ts:320`).
     - Rodar a mutação (link para todos os papéis) e registrar a linha nas Mutações.

2. **A restrição nova em `apps/web/src/componentes/CascaDaEscola.tsx:220` (`if (faixa === 'larga')`) não tem teste que a prove.**
   - O que está errado: a linha 147 das Mutações só prova que tirar a linha inteira quebra o teste. A mutação que importa é voltar ao `definirGavetaAberta(false)` sem condição, que é exatamente o defeito apontado pelo `frontend-reviewer`, e ela passa em tudo. Nenhum teste troca de largura entre celular e trilho com a gaveta aberta. O `dialog` continua montado e aberto nessa troca (`gavetaNaPagina`, linha 253, fica na mesma posição), e com a mutação o "Abrir o menu" diria `aria-expanded="false"` com a gaveta na tela. O caso é real (D51): celular deitado, acima de 768 px, que é girado para retrato.
   - Correção exigida:
     - No W12 "de 768 a 1023 px" (`e2e/casca.spec.ts:438`), ou num teste novo: abrir a gaveta a 900 px, ir a 360 px e conferir que a gaveta continua visível e que o "Abrir o menu" tem `aria-expanded="true"`.
     - Voltar a 900 px e conferir que o "Abrir a lateral" também está `true`.
     - Rodar a mutação sem a condição e registrar a linha nas Mutações.

**Recomendações**
- A linha 147 das Mutações diz "restrito a essa troca". Depois do bloqueante 2, descreva as duas mutações separadas: sem a linha, e sem a condição.

Os dois bloqueantes pedem só asserções e mutações nos testes, sem mudar código de produção.

Arquivos:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Inicio.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/CascaDaEscola.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/areas.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/casca.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/11_task.md

## test-engineer · 4ª rodada · APROVADO · 2026-09-27 10:00:38 · `tasks/prd-apresentacao-escola/11_task.md`

VEREDITO: APROVADO

Cenários exigidos (4ª rodada, só o diff desde a 3ª e as duas correções exigidas):
- A página inicial muda conforme o papel. O professor tem link para Turmas. O aluno e a coordenação não têm o link e veem o texto "próximas versões".
- A gaveta aberta continua aberta ao passar do trilho (900 px) para o celular (360 px) e voltar, e o botão de cada largura mostra `aria-expanded="true"`.
- A gaveta volta fechada ao entrar na largura do computador.

Cobertos:
- Correção 1 feita. Em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/areas.spec.ts:170-171` (aluno) e `:325-326` (coordenação, logo depois de `entrarComoCoordenacaoNaMesmaAba`), o teste confere que o `main` não tem link "Turmas" e diz "próximas versões". O `name: 'Turmas'` sem `exact` casa por trecho do nome, então o `toHaveCount(0)` fica mais rigoroso. O lado do professor já estava em `:79` (`not.toContainText('próximas versões')`) e no clique no link, logo a mutação oposta (condição sempre falsa) também fica vermelha. A mutação "link para todos os papéis" foi rodada e registrada na tabela (`11_task.md`, linha da `Inicio.tsx:36`).
- Correção 2 feita. Em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/casca.spec.ts:455-466`, o teste abre a gaveta a 900 px e vai a 360 px: a gaveta está visível e "Abrir o menu" tem `aria-expanded="true"`. Volta a 900 px: a gaveta está visível e "Abrir a lateral" tem `true`. Depois o Esc fecha a gaveta. Sem a condição `faixa === 'larga'` em `CascaDaEscola.tsx:220`, o estado zeraria na passagem de 900 para 360 e o teste fica vermelho, como a mutação registrada mostra. A mutação que remove a linha inteira continua coberta pelo trecho final (`:476-478`, com `aria-expanded` `false` ao voltar do computador). A tabela de Mutações agora tem duas linhas separadas para a `:220`, "sem a linha" e "sem a condição", cada uma apontando o teste que a pega.
- Não há `.skip`, `.only` nem `fixme` em `areas.spec.ts` e `casca.spec.ts`. Nenhum código de produção mudou nesta rodada.

Bloqueantes: nenhum.

Recomendações:
- No portão final com `--e2e`, confirmar que `areas.spec.ts` e `casca.spec.ts` continuam verdes nos projetos `chromebook` e `celular`. Nesta rodada eles só foram rodados à mão, no compose de teste.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-09-27 10:01:17 · `tasks/prd-apresentacao-escola/11_task.md`

VEREDITO: APROVADO

A única correção exigida na rodada 1 está feita e tem teste que a prova. Não há bloqueante novo. O que ficou é recomendação.

Estados: ok. Início tem carregando, erro e com dado. O erro mantém a tela em pé com "Tentar de novo". Início não tem estado vazio, porque `/v1/eu` sempre traz a pessoa e a escola.

Acessibilidade:
- O link novo "Turmas" em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Inicio.tsx:39` usa o `Link` do wouter, então é um link de verdade: entra no teclado e ganha o `:focus-visible` global de `estilos.css:91`.
- Ele é sublinhado, portanto não depende só da cor.
- O `caramelo-texto` (`#b4520f`) sobre fundo claro dá cerca de 5:1 de contraste, acima do 4.5:1 exigido.
- A varredura `violacoesGraves` continua no W2.
- A `FronteiraDaArea` agora diz "Tentar de novo", igual ao resto do produto. O E4 de `e2e/operacao.spec.ts` acompanha a mudança.

Chromebook fraco: nada novo que pese. É um link e um condicional por papel, sem dependência nova.

Celular:
- O W2 toca o link no projeto `celular` (`tap`) e confirma que leva a `/professor/turmas`.
- O link fica no meio da frase, e a WCAG 2.5.8 dispensa link dentro de frase do mínimo de 24 px.
- A mudança em `CascaDaEscola.tsx:216-221` está certa. O estado da gaveta só zera ao entrar na largura do computador, onde ela deixa de existir. Entre celular e trilho, a gaveta aberta segue aberta e o `aria-expanded` acompanha.
- O W12 prova isso indo e voltando de 900 para 360 px, com o `aria-expanded="true"` dos dois botões ("Abrir o menu" e "Abrir a lateral") e o fechamento por Escape.

Ação oficial protegida: não se aplica. Não há ação oficial nesta tarefa.

Bloqueantes: nenhum.

A correção exigida, item por item:
- **Frase falsa retirada.** O professor não vê mais que as turmas ficam "para as próximas versões". A tela diz "Confira e confirme as suas turmas em Turmas", com o link para `ROTAS.turmas`.
- **Aluno e coordenação.** Continuam com o texto genérico. Os testes provam que o `main` deles não tem link "Turmas" e ainda diz "próximas versões" (`e2e/areas.spec.ts:170-171` e `:325-326`).
- **Teste do professor.** O W2 afirma que o `main` do professor não contém "próximas versões" e que o link leva a `/professor/turmas` (`e2e/areas.spec.ts:79-83`).
- **Seletores.** Ficaram presos ao `navigation` "Seções", então o link novo no `main` não confunde os testes com o item da lateral.

Recomendações:
- As três já registradas em "Recomendações sem aplicar" do `11_task.md` (trilho em tablet de toque, "Pular para o conteúdo", variantes do `Botao` em Turmas) continuam valendo, com os destinos que estão lá.
- A mensagem "O que você faz no Turmma aparece aqui nas próximas versões." (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Inicio.tsx:45`) é o único texto que o aluno e a coordenação veem na tela, e soa como desculpa. Quando a coordenação ganhar Estrutura (13.0), o texto dela deve apontar para lá, do mesmo jeito que o do professor aponta para Turmas.

Como combinado, não conferi `--e2e`/`--infra` no carimbo desta rodada: elas rodam no portão final, antes do commit.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-27 10:03:47 · `tasks/prd-apresentacao-escola/11_task.md`

VEREDITO: REPROVADO

Escopo: respeitado

Aderência à Tech Spec: há divergência na fronteira da operação e em três itens de "Divergências resolvidas" que estão só no `11_task.md`.

Portão local: o `conferir` responde "portão local: o último não rodou e2e. Rode `node tools/processo/portao-local.ts --e2e`." Conforme a nota, não conto isso como bloqueante nesta rodada. O carimbo com `--e2e` continua exigido antes do commit.

**Bloqueantes:**

1. **A operação mudou de comportamento sem registro.** Estão em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/FronteiraDaArea.tsx:156` e em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao.spec.ts:286-299`.
   - A 11.1 manda que a operação use a fronteira genérica "sem mudar de comportamento".
   - Mesmo assim, o botão da fronteira da operação passou de "Tente de novo" para "Tentar de novo", e o teste E4 foi reescrito para o texto novo.
   - Três documentos ainda dizem "Tente de novo": o E4 de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/cenarios.md:134`, a Tech Spec da A0 (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md:202`) e a própria 11.1.
   - A falha também passou a levar o foco ao título na página inteira da operação, o que igualmente muda o comportamento dela.
   - A divergência está registrada só no `11_task.md`.
   - **Correção exigida:** escolher um dos dois caminhos.
     - (a) Manter "Tente de novo" na operação. O rótulo do botão vira propriedade da `FronteiraDaArea`, e o E4 volta ao texto original.
     - (b) Registrar a troca na seção 9 da `techspec.md` da A1 e atualizar o E4 do `cenarios.md` e a linha 202 da `techspec.md` da A0.

2. **Divergências que ficaram só no `11_task.md`.** Estão em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/11_task.md:120-128`.
   - O bloco "Decidido na 11.0" da `techspec.md` (seção 9) não traz três itens:
     - a página inicial do professor aponta para Turmas;
     - "Tentar de novo" na fronteira;
     - a troca de escola e a troca de pessoa também fecham a gaveta.
   - O `cenarios.md` da A1 não foi tocado. O W5 (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md:415-417`) ainda diz que a volta do título é "o `componentWillUnmount`, pendência da A0b". A tarefa removeu esse método, e agora é o gancho `useTituloDaAba` da tela da falha que devolve o título.
   - **Correção exigida:**
     - acrescentar os três itens ao bloco "Decidido na 11.0" da seção 9 da `techspec.md`;
     - reescrever o parêntese do W5 no `cenarios.md` para o mecanismo atual;
     - conferir se alguma outra das dez divergências muda o texto de um cenário (W2, W4, W12) e, se mudar, atualizá-lo também.

**Recomendações:**
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/itens-da-lateral.tsx:398`, o `ItemDaLateral` repete à mão as classes que o `CLASSE_DO_ITEM` (linha 355) já declara, e só o `MenuDaPessoa` usa a constante. O comentário diz que a linha é "igual para item de navegação e para o Sair", mas hoje são dois lugares que podem divergir.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/CascaDaEscola.tsx:304`, o "Sair" da barra do topo é a terceira cópia da classe do botão secundário (as outras duas estão em `Turmas.tsx:126` e `:247`). Vale juntar quando o `Botao` ganhar as variantes, como já está anotado para `/validar`.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/rotas.tsx:109-111`, a guarda carregando ou com erro não põe título na aba e fica com o da tela anterior. É pequeno, mas o W2 pede que o título mude a cada rota.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-27 10:14:37 · `tasks/prd-apresentacao-escola/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: o `conferir` responde "o último não rodou e2e. Rode `node tools/processo/portao-local.ts --e2e`". Não reprovei por isso porque você informou que as suítes `--e2e` rodam no portão final, antes do commit, por decisão do Joaquim. A tarefa mexe em tela, então o e2e é obrigatório, e o hook vai barrar o commit sem ele.
Bloqueantes: nenhum. As duas correções da 1ª rodada foram feitas:
- **Correção 1, pelo caminho (b):** o "Tentar de novo" e o foco no título da falha, também na página inteira da operação, estão registrados em três lugares:
  - na seção 9, "Decidido na 11.0", de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md`;
  - no E4 de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/cenarios.md`;
  - na linha 202 de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`.

  O código bate com o registro: `FronteiraDaArea.tsx` fecha a gaveta, leva o foco ao `h1` e mostra "Tentar de novo". O teste `e2e/operacao.spec.ts:286` também usa "Tentar de novo".
- **Correção 2:** a página inicial do professor apontando para Turmas e a gaveta fechando na troca de escola e de pessoa entraram na seção 9. O código bate: `Inicio.tsx:40` tem o texto, e o efeito com `[caminho, usuarioDaSessao]` está em `CascaDaEscola.tsx:211-213`. O W5 do `cenarios.md` agora cita o `useTituloDaAba`. O W2, o W4 e o W12 estão coerentes com o que a 11.0 entrega. Os itens da lateral da coordenação e do aluno no W2 ficam para a 12.0 a 14.0, como a divisão das tarefas prevê.

O `11_task.md` diz onde cada divergência foi registrada, e cada recomendação da 1ª rodada tem destino ou recusa com motivo.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md:202`: o parêntese novo deixou a linha bem mais longa que as outras. Quebre a linha na largura do resto do documento.
- Nenhum e2e da operação confere o foco no título da falha, que agora é comportamento registrado no E4 e na Tech Spec da A0. Vale uma asserção `toBeFocused()` no teste do E4, em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao.spec.ts:286`.

## test-engineer · 5ª rodada · APROVADO · 2026-09-27 10:16:20 · `tasks/prd-apresentacao-escola/11_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta rodada cobre só o diff desde a 4ª rodada, que foi aprovada. O cenário é o E4 da A0: o chunk da operação não chega e a fronteira em página inteira aparece com "Tentar de novo". Agora ela também põe o foco no título da falha, para o leitor de tela anunciar. O resto foi aprovado na 4ª rodada e não mudou.

**Cobertos:**
- `e2e/operacao.spec.ts:294` exige que o título "Operação Turmma" receba o foco. O teste falharia sem a regra: se tirarmos o `tituloDaFalha.current?.focus()` de `apps/web/src/componentes/FronteiraDaArea.tsx:36`, o foco fica no `body` e o `toBeFocused` fica vermelho.
- O seletor pega só um elemento. Na falha, a casca da operação não aparece porque vem dentro do chunk que não chegou. E a faixa "Operação Turmma" de `CascaDaOperacao.tsx:52` é um `<p>`, não um título. Então não há briga de seletor e o teste não passa à toa por achar o elemento errado.
- A ordem das asserções está certa. O título só é conferido depois que o `alert` e o botão aparecem, então o foco que ele verifica é o dado pela fronteira.
- O teste continua conferindo a aba, a largura, as violações de acessibilidade e a nova tentativa que carrega. Não há `.skip` nem mock escondendo a regra.
- A mudança em `itens-da-lateral.tsx` é só comentário, e a quebra de linha na Tech Spec da A0 não altera o que ela diz. Nenhuma das duas mexe em teste.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `tasks/prd-apresentacao-operacao/cenarios.md:134-135`: o texto novo do E4 fala da troca de "Tente de novo" para "Tentar de novo", mas não diz que a falha leva o foco ao título. O prompt afirma que isso ficou registrado no E4 dos cenários da A0, e não ficou. Só a Tech Spec da A0 (`techspec.md:203`) registra. Vale acrescentar uma frase ao E4 para o `/validar` achar o cenário.
2. `tasks/prd-apresentacao-escola/11_task.md:160`: a linha da mutação `FronteiraDaArea.tsx:36` lista só o W5 do `areas.spec.ts`. Falta pôr o E4 do `operacao.spec.ts`, que também pega essa mutação agora e é o único teste dela na página inteira da operação (`paginaInteira`).
3. O E4 rodou verde só à mão contra o compose de teste. O portão final com `--e2e`, como você disse, precisa passar nos projetos `chromebook` e `celular` antes do commit.

## revisor-geral · 3ª rodada · APROVADO · 2026-09-27 10:17:41 · `tasks/prd-apresentacao-escola/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: o `conferir` responde "o último não rodou e2e. Rode `node tools/processo/portao-local.ts --e2e`".

Não reprovei por isso, pelo mesmo motivo da rodada anterior. Você informou que o `--e2e` roda no portão final, antes do commit, por decisão do Joaquim. Não tenho como confirmar essa decisão daqui. A tarefa mexe em tela, então o e2e é obrigatório, e o hook barra o commit sem ele.

Bloqueantes: nenhum.

As duas recomendações da 2ª rodada foram aplicadas, e não há mudança de código de produção:

- **Teste do foco no E4:** a nova asserção em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao.spec.ts` confere o foco no título "Operação Turmma". Esse é o `titulo` que `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/rotas.tsx:176` passa à fronteira. O foco vem de `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/FronteiraDaArea.tsx:36`, sobre o `h1` com `tabIndex={-1}` da linha 41. Sem essa linha, o teste fica vermelho, como a mutação registrada mostra.
- **Documentação:** a `techspec.md` e o `cenarios.md` da operação dizem agora "Tentar de novo" e o foco no título. Contam também que a fronteira virou a peça genérica da 11.0 da A1. Não sobrou "Tente de novo" nos e2e nem nos documentos da operação. O "Tente de novo em instantes" do 503 é outro texto e continua certo.

Recomendações:
- No portão final com `--e2e`, confirmar o E4 verde nos projetos `chromebook` e `celular`. Até agora ele só rodou à mão, no compose de teste.

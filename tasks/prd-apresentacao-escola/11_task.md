# Tarefa 11.0 — Web: casca por papel, guarda de papel, título por rota, menu da pessoa e fronteira genérica

**Funcionalidade:** apresentacao-escola · **Depende de:** nenhuma · **Paralelo com:** 1.0 a 10.0
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Cada papel entra numa casca com a pele da D72 e só os itens da fase dele; a área vem por `import()`, com fronteira e
carregamento; o endereço de outro papel cai em "não encontrada"; a aba diz a tela.

## Contexto necessário

- `docs/interface.md` 11.1 e 9.1; D72 e D73; `techspec.md` seção 9 ("Casca", "Fronteira")
- `cenarios.md`: W2, W5, W4 (linha "Turmas"), W12; `.claude/rules/50-frontend.md` inteira
- `TODO.md`: o `componentWillUnmount` de `apps/web/src/rotas.tsx:53` sem teste
- Código:
  - `apps/web/src/rotas.tsx` — a `FronteiraDaOperacao` e o `Suspense` da operação, que viram genéricos
  - `apps/web/nome-dos-chunks.ts` e o teste dele; `.size-limit.json`
  - `apps/web/src/componentes/estado/`, `Marca.tsx`, `Botao.tsx`; tokens e logotipo já em `estilos.css` e
    `public/marca/` (confira contra `mockups/`)
  - `apps/web/src/paginas/Vinculos.tsx` — o confirmar e contestar do F1, que vira "Turmas"
  - `e2e/casca.spec.ts`, `e2e/__fixtures__/verificacoes.ts` (largura, alvo de toque, axe)

## Subtarefas

- [x] 11.1 — A fronteira sai de `rotas.tsx` para `componentes/`, genérica (título e texto por área); a operação a usa
  sem mudar de comportamento
- [x] 11.2 — Áreas `coordenacao-*`, `professor-*` e `aluno-*` por `import()`, cada uma com a fronteira, `Suspense`
  e `EstadoCarregando`; guarda de papel em `rotas.tsx`; título por rota
- [x] 11.3 — A casca da 11.1 (lateral, trilho, gaveta abaixo de 768 px, as três pistas do selecionado); a navegação
  numa tabela por papel, e cada tarefa de tela acrescenta a linha do item dela (Minha turma na 12.0, Estrutura na
  13.0, Professores na 14.0). Aqui entra "Turmas", sobre o `Vinculos` do F1, com os vazios do W4. Até a 13.0, a
  coordenação abre na página inicial que já existe
- [x] 11.4 — Menu da pessoa (P18): o nome, o papel e "Sair", a um clique e do mesmo tamanho dos outros itens
- [x] 11.5 — Teto de cada chunk novo no `.size-limit.json`
- [x] 11.6 — Testes; o e2e da A0b roda junto

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/FronteiraDaArea.tsx`, `CascaDaEscola.tsx`, `MenuDaPessoa.tsx`; `areas/*/rotas.tsx`, `areas/navegacao.ts` | novo |
| `apps/web/src/rotas.tsx`, `caminhos.ts`, `apps/web/nome-dos-chunks.ts`, `paginas/Vinculos.tsx` (vira `areas/professor/Turmas.tsx`) | alterado |
| `.size-limit.json`, `e2e/casca.spec.ts`; `e2e/areas.spec.ts` | alterado, novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W2 | e2e | só os itens da tabela, nenhum sem tela; o professor no endereço da coordenação cai em "não encontrada"; o título muda por rota |
| W5 | e2e | `import()` de `coordenacao-*` e `professor-*` abortado: o texto e o título da falha, e o anterior de volta ao sair |
| W4 (Turmas) | e2e | os quatro estados, com os textos da tabela; vazio e erro com a rota interceptada |
| W12 (casca) | e2e | 360 px sem rolagem horizontal; gaveta abaixo de 768 px; alvos de 44 px; Tab percorre a lateral |
| recomeço da tela | e2e | segunda pessoa: a coordenação entra na aba do professor sem item nem cache dele; mesma entrada: a rota aberta de novo não duplica a área; resposta atrasada: o `import()` lento da área anterior não aparece depois da troca; falha com a gaveta aberta: a fronteira assume e o foco sai da gaveta |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [x] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral`, com rodada que vale
  para o código atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O seletor (12.0); as telas dos outros itens (12.0 a 17.0); "Seu time" (A2); as outras entradas do menu (P09).

## Plano e autoconferência (antes de codar)

**Arquivos.** `componentes/FronteiraDaArea.tsx` (a fronteira genérica; a tela da falha põe o título pelo gancho e tira o
foco da gaveta), `componentes/CascaDaEscola.tsx` (lateral, trilho e gaveta, decididos pela largura em JavaScript para
haver uma lateral por vez no DOM), `componentes/itens-da-lateral.tsx`, `componentes/MenuDaPessoa.tsx`,
`componentes/gaveta.ts`, `componentes/NaoEncontrada.tsx`; `areas/navegacao.ts` (a tabela por papel e o `estaNoItem`),
`areas/{coordenacao,professor,aluno}/rotas.tsx`, `areas/professor/Turmas.tsx` (o `Vinculos` do F1); `titulo.ts` (o
`titulo-da-operacao.ts` com o gancho `useTituloDaAba`, que a operação passa a usar); `rotas.tsx` (a guarda de papel, a rota
única com sessão e a fronteira da operação pela peça genérica); `caminhos.ts`; `nome-dos-chunks.ts`; `.size-limit.json`.
`Cabecalho.tsx` sai: a casca faz o que ele fazia (inatividade, `lembrarQuemEsta`, seletor, "Sair").

**Testes.** `e2e/areas.spec.ts` (W2, W5, W4 de Turmas, recomeço da tela), `e2e/casca.spec.ts` (W12 da casca: 360 px e
gaveta, lateral pelo teclado, trilho e recolher, 768 a 1023 px), `apps/web/src/areas/navegacao.test.ts`,
`apps/web/nome-dos-chunks.test.ts` (áreas) e `tools/ci/tamanho-web.test.ts` (tetos). Os specs do F1 que andavam pelo
cabeçalho (`escola-e-vinculos`, `inatividade`, `tokens`) passam pela lateral (`e2e/__fixtures__/casca.ts`).

**Autoconferência.**
- *Segundo dado*: a guarda é provada com o professor nos endereços da coordenação **e** do aluno, e com o aluno nos do
  professor e da coordenação; como a área da coordenação ainda não tem tela, a mesma "não encontrada" apareceria sem a
  guarda, e é o pedido do chunk (nenhum) que a prova. As três pistas do selecionado são conferidas em "Turmas" e ausentes
  na página inicial. O W4 tem vínculo em cada grupo (pendente e confirmado).
- *Checagem anterior*: o W5 da coordenação passa pela guarda com a sessão de coordenação (o `import()` é pedido e
  abortado); o da gaveta segura o chunk até a gaveta estar aberta, para a falha cair com ela aberta.
- *Asserção sobre o resultado*: título da aba, foco, pedido de chunk, `aria-current`, cor e peso calculados, e não o fonte.
- *Recomeço da tela*: segunda pessoa sem recarregar a página (a coordenação configura o segundo fator na mesma aba); mesma
  entrada contando o pedido do chunk; resposta atrasada segurando o chunk até depois da troca; falha com a gaveta aberta.
- *Peça que já existe*: o gancho de título da operação virou o `useTituloDaAba` genérico; os estados vêm de
  `componentes/estado`; o seletor do F1 fica como está até a 12.0.
- *Carga*: nada novo na API; o primeiro carregamento sobe ~6 kB brotli (a casca e os ícones), dentro dos 150 kB.

## Divergências resolvidas nesta tarefa

- **Endereços e a página inicial.** `/` continua a página inicial dos três papéis na A1 ("a coordenação abre na página
  inicial que já existe"; o professor abriria em "Nova conversa", que é da A2). As áreas ficam em `/coordenacao`,
  `/professor` e `/aluno`, e "Turmas" em `/professor/turmas`, no lugar de `/vinculos`. A área da coordenação e a do aluno
  nascem sem tela e respondem "Página não encontrada" até a 13.0 e a 12.0. Na `techspec.md`, seção 9.
- **A guarda segue com o papel que já conhecia** enquanto o `/v1/eu` refaz depois de uma sessão nova. Sem isso, o login
  por cima da tela (mesma pessoa) desmontava a área e apagava o rascunho da contestação — o e2e de inatividade do F1 ficou
  vermelho. Outra pessoa continua saindo pela casca (`lembrarQuemEsta`), e outro papel cai em "não encontrada". Na
  `techspec.md`, seção 9.
- **Linhas da lateral com 44 px também no computador**, e não os 36 px da 11.1: o "Sair" é ação principal (D59; o e2e do
  F1 o mede em 44 px) e tem de ter o tamanho dos itens (P18). Na `techspec.md`, seção 9, e em `docs/interface.md` 11.1.
- **O "Sair" também na barra do topo abaixo de 768 px**, a um toque. Resolve a pendência "Sair no celular" das
  recomendações da spec (abaixo). Na `techspec.md`, seção 9, e em `docs/interface.md` 11.1.
- **O teto de 150 kB mede `index-*` e `parte-*`.** Com três áreas por `import()`, o Rolldown separa React e o roteador num
  `parte-*` que a entrada importa junto (nenhuma opção de `chunkOptimization` o junta de volta); o teto só sobre `index-*`
  deixaria o React fora da conta. O `index-*` sozinho continua medido, para o build sem entrada reprovar mesmo com um
  `parte-*` no lugar. O `parte-*` que só as áreas dividem entra na conta a mais, o que só aperta. Tetos de partida das
  áreas: coordenação 30 kB, professor 20 kB, aluno 10 kB. Na `techspec.md`, seção 9.
- **`lucide-react` 1.48.0 entra**, ícone a ícone, como a 9.4 do `docs/interface.md` manda. Na `techspec.md`, seção 9.
- **A fronteira põe o título da falha pelo gancho da tela da falha**, e não no `componentDidCatch`: a rota de antes devolve
  o título dela no efeito de desmontagem, que roda depois e apagava o da falha quando a área já tinha falhado antes (o W5
  pegou). Com isso o `componentWillUnmount` sai, e o que o `TODO.md` pedia (a volta do título ao sair) é provado pelo W5.
- **A página inicial do professor aponta para Turmas** (`frontend-reviewer`, 1ª rodada): o texto "as suas turmas aparecem
  nas próximas versões" ficou falso com Turmas no ar, e a turma só abre depois da confirmação (E12).
- **O botão da fronteira diz "Tentar de novo"**, como o `EstadoErro`, e não "Tente de novo" (a peça agora é genérica; o
  E4 da operação acompanha). Na operação, a fronteira também passa a levar o foco ao título da falha. As duas coisas
  mudam o comportamento da operação, que a 11.1 pedia manter (`revisor-geral`, 1ª rodada): registradas na seção 9 da
  `techspec.md`, no E4 do `cenarios.md` da A0 e na `techspec.md` da A0.
- **A troca de escola e a troca de pessoa também fecham a gaveta**, e não só a troca de endereço: a troca pelo seletor vai
  de `/` para `/`. Provado no recomeço da tela.

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `apps/web/src/rotas.tsx:113` (a guarda de papel) | `areas.spec.ts` W2 "o professor no endereço da coordenação…" (o pedido do chunk da coordenação e do aluno) e "o aluno não tem item…" (a "não encontrada" em `/professor/turmas`), nos dois projetos |
| `apps/web/src/rotas.tsx:107` (o `?? papelConhecido`) | `inatividade.spec.ts` "a sessão vence sozinha…" (o rascunho some depois do login por cima), nos dois projetos |
| `apps/web/src/rotas.tsx:128` (o `$` da rota única com sessão) | `tokens.spec.ts` "foco de 2 px…" (o endereço que não existe cai dentro da casca, sem a página não encontrada) |
| `apps/web/src/rotas.tsx:109-111` trocado por `return <ConteudoNaoEncontrado />` (`test-engineer`, 1ª rodada) | `areas.spec.ts` "a guarda sem o /v1/eu…" (o "Carregando…" vira "não encontrada"), nos dois projetos |
| `apps/web/src/rotas.tsx:110` (o `EstadoErro` da guarda) | `areas.spec.ts` "a guarda sem o /v1/eu…" (sem o alerta e o "Tentar de novo"), nos dois projetos |
| a área do professor montada também fora do `Switch`, na página inicial, depois de pedida (`test-engineer`, 1ª rodada) | `areas.spec.ts` "resposta atrasada…" (o título da "não encontrada" da área aparece em "Início" depois da chegada), nos dois projetos |
| `apps/web/src/areas/professor/Turmas.tsx:77-78` com `estado === 'pendente'` no lugar do `emDecisao` (`test-engineer`, 1ª rodada) | `areas.spec.ts` W4 (a contestada sai de "Confirme suas turmas"), nos dois projetos |
| `apps/web/src/paginas/Inicio.tsx` (o link para Turmas do professor; `frontend-reviewer`, 1ª rodada) | `areas.spec.ts` W2 "o professor vê só Turmas…" (o link não leva a `/professor/turmas`), nos dois projetos |
| `apps/web/src/paginas/Inicio.tsx:36` com o link para todos os papéis (`test-engineer`, 3ª rodada) | `areas.spec.ts` "o aluno não tem item…" e "segunda pessoa…" (o link de Turmas na página inicial do aluno e da coordenação), nos dois projetos |
| `apps/web/src/componentes/itens-da-lateral.tsx:52` (`onClick={fechar}`) | `areas.spec.ts` "mesma entrada…" (a gaveta fica aberta), celular |
| `apps/web/src/componentes/itens-da-lateral.tsx:54` (o peso 600 do selecionado) | `areas.spec.ts` W2 "o professor vê só Turmas…" |
| `apps/web/src/componentes/itens-da-lateral.tsx:56` (o filete) | `areas.spec.ts` W2 "o professor vê só Turmas…" |
| `apps/web/src/componentes/CascaDaEscola.tsx:211-213` (o efeito que fecha a gaveta) | `areas.spec.ts` W2 "o professor vê só Turmas…" (a gaveta aberta depois da marca), celular |
| `apps/web/src/componentes/CascaDaEscola.tsx:213` (o `usuarioDaSessao` nas dependências) | `areas.spec.ts` "troca de escola pelo seletor, da página inicial…", celular |
| `apps/web/src/componentes/CascaDaEscola.tsx:220` sem a linha (o estado da gaveta não zera ao entrar na largura do computador) | `casca.spec.ts` W12 "de 768 a 1023 px…" (de volta ao trilho, o `aria-expanded` fica `true` com a gaveta fechada) |
| `apps/web/src/componentes/CascaDaEscola.tsx:220` sem a condição `faixa === 'larga'` (zera em toda troca de largura; `test-engineer`, 3ª rodada) | `casca.spec.ts` W12 "de 768 a 1023 px…" (entre trilho e celular, a gaveta aberta e o botão dizendo `false`), nos dois projetos |
| `apps/web/src/componentes/CascaDaEscola.tsx:225-226` (o foco depois de recolher e abrir) | `casca.spec.ts` W12 "recolher a lateral…" |
| `apps/web/src/componentes/CascaDaEscola.tsx:232` (`guardarRecolhida`) | `casca.spec.ts` W12 "recolher a lateral…" (a recarga volta aberta) |
| `apps/web/src/componentes/CascaDaEscola.tsx:259` (o `onClose`) | `casca.spec.ts` W12 "abaixo de 768 px…" (o `aria-expanded` fica `true` depois do Esc) |
| `apps/web/src/componentes/CascaDaEscola.tsx:261` (o toque fora fecha) | `casca.spec.ts` W12 "abaixo de 768 px…" |
| `apps/web/src/componentes/CascaDaEscola.tsx:332` (abrir no computador desfaz a escolha) | `casca.spec.ts` W12 "recolher a lateral…" |
| `apps/web/src/componentes/CascaDaEscola.tsx:333` (o `aria-expanded` do trilho) | `casca.spec.ts` W12 "de 768 a 1023 px…" |
| `apps/web/src/componentes/FronteiraDaArea.tsx:31` (o título da falha e a volta dele) | `areas.spec.ts` W5, as duas áreas, nos dois projetos |
| `apps/web/src/componentes/FronteiraDaArea.tsx:35` (fechar a gaveta) | `areas.spec.ts` "falha com a gaveta aberta…" (o foco não sai da gaveta), nos dois projetos |
| `apps/web/src/componentes/FronteiraDaArea.tsx:36` (o foco na falha) | `areas.spec.ts` W5, as duas áreas, nos dois projetos; `operacao.spec.ts` E4 (a página inteira da operação), nos dois projetos |
| `apps/web/src/componentes/NaoEncontrada.tsx:19` (o `~` do link) | `areas.spec.ts` W2 "o professor no endereço da coordenação…" (o link leva a `/professor/`) |
| `apps/web/src/areas/professor/Turmas.tsx:78` (o grupo das decididas) | `areas.spec.ts` W4 |
| `apps/web/src/areas/navegacao.ts:29` (a barra depois do caminho) | `navegacao.test.ts` "o item fica selecionado…" |
| `apps/web/nome-dos-chunks.ts:36` (o nome da área) | `nome-dos-chunks.test.ts`, o caso de unidade e o build de verdade |
| `.size-limit.json` (sem a entrada sozinha; sem o `parte-*` no primeiro carregamento; sem o teto do aluno) | `tamanho-web.test.ts`: "sem o chunk de entrada…", "o pedaço parte-*…", "o chunk aluno-*…" e o que declara os tetos |

## Recomendações sem aplicar

Pendências de tela que a 11.1 não decide, anotadas antes dos revisores:

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| spec, rodadas 1 a 5 | "Sair" no celular: dentro da gaveta, fica a dois ou três toques, e a D59 pede a um clique | aplicada na 11.0: o "Sair" também na barra do topo, a um toque (Divergências) |
| spec, rodadas 1 a 5 | Rodapé do aluno ("Avisar um adulto" e "Privacidade", D61): na 11.1 é proposta | `/validar` |
| `test-engineer`, 1ª | W2 percorrer a tabela `NAVEGACAO` no e2e, para a 12.0 a 14.0 herdarem a prova | aplicada em parte: o e2e não importa o fonte da web (a resolução de módulos do `e2e/tsconfig.json` exige extensão), então `e2e/areas.spec.ts` tem a lista `ITENS_DO_PROFESSOR` com o mesmo conteúdo e o W2 percorre todos; a tarefa que acrescentar item acrescenta nas duas |
| `test-engineer`, 2ª | Um teste de unidade que compare `NAVEGACAO` com a lista `ITENS_DO_PROFESSOR` do e2e | `/retro` da A1: o e2e não importa o fonte da web, e a comparação pede um arquivo comum aos dois |
| `frontend-reviewer`, 1ª | Trilho num tablet de toque (768 a 1023 px): o rótulo só aparece na dica ou abrindo a lateral | `/validar`: conferir quando a 13.0 e a 14.0 somarem itens |
| `frontend-reviewer`, 1ª | Link "Pular para o conteúdo" antes da lateral | 13.0, quando a lateral da coordenação ganhar itens; hoje o professor tem um item e o aluno e a coordenação nenhum |
| `frontend-reviewer`, 1ª | "Contestar" e "Cancelar" repetem à mão a classe `secundario`, e "Confirmar" usa o `Botao` padrão e não o `oficial` | `/validar`: é o código do F1 como estava; entra quando o `Botao` ganhar as cinco variantes da 11.1 |
| `frontend-reviewer`, 2ª | O texto "O que você faz no Turmma aparece aqui nas próximas versões." da página inicial da coordenação e do aluno soa como desculpa | 13.0 aponta a da coordenação para Estrutura, e 12.0 a do aluno para "Minha turma", como a do professor aponta para Turmas |
| `revisor-geral`, 1ª | O `ItemDaLateral` repete as classes do `CLASSE_DO_ITEM` | recusada: não é a mesma classe — o link não tem `enabled:`/`disabled:` e tem o selecionado; o comentário do `CLASSE_DO_ITEM` passou a dizer isso |
| `revisor-geral`, 1ª | O "Sair" da barra do topo é a terceira cópia da classe do botão secundário | `/validar`, junto da recomendação das variantes do `Botao` |
| `revisor-geral`, 1ª | A guarda carregando ou com erro não põe título na aba | recusada: enquanto a guarda espera o papel, a tela ainda não é conhecida, e um título provisório seria uma troca de aba a mais que o leitor de tela anuncia; o título da rota chega com a área, e o da falha com a fronteira. Fica para o `/validar` conferir com o `frontend-reviewer` |
| spec, rodadas 1 a 5 | "Como a IA funciona aqui" no menu: a 11.1 a põe na A1, mas a A1 não tem IA nem a tela, e o W2 proíbe item sem tela | `/validar` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-27 08:59:03 | 2026-09-27 09:02:55 | `test-engineer` | 1 | REPROVADO | a444e3158806868df |
| 2026-09-27 09:22:37 | 2026-09-27 09:23:50 | `test-engineer` | 2 | APROVADO | ab54225ac77dd7823 |
| 2026-09-27 09:24:37 | 2026-09-27 09:28:01 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a94dd4d129269b4c5 |
| 2026-09-27 09:46:01 | 2026-09-27 09:47:03 | `test-engineer` | 3 | REPROVADO | ae669f45282c3f237 |
| 2026-09-27 10:00:18 | 2026-09-27 10:00:38 | `test-engineer` | 4 | APROVADO | a554d0d636835bcce |
| 2026-09-27 10:00:52 | 2026-09-27 10:01:17 | `frontend-reviewer` | 2 | APROVADO | a3e42c6fba264116f |
| 2026-09-27 10:01:52 | 2026-09-27 10:03:47 | `revisor-geral` | 1 | REPROVADO | a5e72873471c0fa5a |
| 2026-09-27 10:14:13 | 2026-09-27 10:14:37 | `revisor-geral` | 2 | APROVADO | ae9ab174487221876 |
| 2026-09-27 10:15:54 | 2026-09-27 10:16:20 | `test-engineer` | 5 | APROVADO | a243bd4aed929d2c5 |
| 2026-09-27 10:17:19 | 2026-09-27 10:17:41 | `revisor-geral` | 3 | APROVADO | abdf447d89e8eb170 |

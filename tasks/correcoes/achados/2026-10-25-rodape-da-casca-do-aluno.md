# Achados das revisões — `tasks/correcoes/2026-10-25-rodape-da-casca-do-aluno.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 05:54:47 · `tasks/correcoes/2026-10-25-rodape-da-casca-do-aluno.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: `/aluno/inicio` no computador e no celular, escola cheia e vazia)
Estados: ok. A tarefa não altera tela. A foto cheia mostra a lista de atividades e a vazia mostra o convite "Nenhuma atividade para pedir ajuda agora… Quando houver uma, ela aparece aqui". Carregando e erro não vêm desta tarefa; ela só mexe em e2e.
Acessibilidade: sem alteração. A foto mostra foco e rótulos coerentes. A mudança no spec reforça a navegação "Seções" como landmark e prova que não existe uma `nav` "Rodapé" vazia para o aluno.
Chromebook fraco: não se aplica; nenhum código de web foi alterado.
Celular: sem alteração e sem defeito nas fotos de 360 px.
- Não há rolagem horizontal, e "Rolam a 1366 × 768" está vazio.
- A barra inferior com Início, Tarefas e Eu cabe na largura e a ação principal tem altura suficiente.
Ação oficial protegida: sim. A tarefa não toca nenhuma ação oficial.
Bloqueantes: nenhum.

Conferi a correção contra o código da árvore, como pede o processo:
- `apps/web/src/areas/navegacao.ts:86-90` mostra `RODAPE_DA_LATERAL.aluno: []`.
- `CascaDaEscola.tsx:254` usa essa lista, que o próprio documento da correção diz que deixa a casca sem desenhar a navegação "Rodapé".
- As fotos mostram Início, Tarefas e Eu como "Seções", sem rodapé e sem "Seu time" nem "Sua conta".
- Início é o primeiro item.

A linha nova do aluno em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/casca.spec.ts:680-681` diz `navegacoes: ['Seções']`, `ausentes: ['Seu time', 'Rodapé', 'Sua conta']` e `primeiro: 'Início'`. Isso bate com o código e com as fotos. O diff é só nessa linha e num comentário, e não há arquivo de `apps/*/src` nem de `packages/*/src` alterado.

Recomendações:
- Nas fotos, o nome do aluno e o da escola de teste mostram sufixos de id (`498b49c2`, `170cbae8`). É artefato da semente da vitrine e não do produto, então não bloqueia.
- O texto do aviso no topo, "Quem dá a aula acompanha como você usa o Tutor", é claro. Nenhuma ação sua.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 05:55:07 · `tasks/correcoes/2026-10-25-rodape-da-casca-do-aluno.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff mexe só em `e2e/casca.spec.ts` e no documento da correção. Todos com autor humano? Sim, porque a tarefa não cria nem muda nenhum caminho de escrita.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. Nenhuma saída de IA nova chega ao aluno. As fotos mostram só a casca e a lista de atividades, sem nada gerado por IA.

Supervisão do tutor: ok. Nas quatro fotos o aviso "Quem dá a aula acompanha como você usa o Tutor." aparece no topo do Início do aluno, na escola cheia e na vazia, no computador e no celular (`.processo/vitrine/aluno--inicio--computador.png`, `aluno--inicio--celular.png`, `vazia--aluno--inicio--computador.png`, `vazia--aluno--inicio--celular.png`). A correção não toca nesse aviso.

Autonomia declarada e visível: não muda nesta tarefa, e nenhum agente novo entra.

O que conferi na regra 70 com as fotos e o diff:
- **Nota (D55, item 8):** nenhuma nota, conceito ou sugestão de nota aparece. A tela cheia lista "Cinemática: lista sintética" e "Estequiometria: lista sintética" só com disciplina e número de questões. A tela vazia diz "Nenhuma atividade para pedir ajuda agora".
- **Vigilância (item 7):** a tela não mede tempo, não infere estado emocional e não mostra navegação do aluno.
- **Sair (item 4b, D59):** o "Sair" fica a um clique no pé da lateral do computador e a um toque na barra do topo do celular. A tela não tem rolagem infinita, recompensa nem conteúdo que começa sozinho.
- **O teste do "Sair" continua igual:** a correção troca só a linha do aluno em `PAPEIS_DA_CASCA` (`e2e/casca.spec.ts:680-681`). O caso W12 segue verificando que o "Sair" está inteiro à vista e do tamanho do primeiro item da navegação, inclusive na janela baixa (`conferirOSair`, `e2e/casca.spec.ts:715-731`). Agora esse primeiro item é "Início".
- **O teste ficou mais forte:** com "Rodapé" em `ausentes`, o caso passa a provar também que a casca não desenha um rodapé vazio para o aluno. Isso confere com `RODAPE_DA_LATERAL.aluno` vazio (`apps/web/src/areas/navegacao.ts:86`, já testado em `apps/web/src/areas/navegacao.test.ts:38`).

Bloqueantes: nenhum.

Recomendações: nenhuma da regra 70.

## test-engineer · 1ª rodada · APROVADO · 2026-10-25 05:55:27 · `tasks/correcoes/2026-10-25-rodape-da-casca-do-aluno.md`

VEREDITO: APROVADO

**Cenários exigidos**
- **Caminho feliz:** o aluno entra na casca e vê só a navegação "Seções". O primeiro lugar é "Início". O "Sair" fica à vista e do tamanho do vizinho, com a lateral aberta e recolhida, a 1366 e a 900 px, em `chromebook` e `celular`.
- **Borda 1:** com `RODAPE_DA_LATERAL.aluno` vazio, a casca não desenha a navegação "Rodapé".
- **Borda 2:** o primeiro lugar do aluno deixou de ser "Tutor" e passou a ser "Início". O trilho recolhido dá o foco e a dica a "Início".
- **Permissão:** o aluno não recebe "Sua conta" nem "Seu time", que são navegações de outros papéis.
- **Isolamento:** não se aplica. A correção mexe só na tabela de um e2e, sem dado, sem API e sem repository.

**Cobertos**
- Todos, pelo próprio caso `e2e/casca.spec.ts:734` (W12, aluno), com a linha corrigida em `e2e/casca.spec.ts:681`.
  - `ausentes` é verificado com `toHaveCount(0)` (linha 741). Assim, "Rodapé" em `ausentes` passa a provar que a casca não desenha um rodapé vazio.
  - `primeiro` é verificado com `toHaveAccessibleName` (linha 723) e com o foco no trilho (linhas 763 e 764).
- A tabela nova bate com o código:
  - `NAVEGACAO.aluno` é Início, Tarefas e Eu (`apps/web/src/areas/navegacao.ts:74-78`).
  - `RODAPE_DA_LATERAL.aluno` é `[]` (`navegacao.ts:89`).
  - `ListaDeItens` devolve `null` quando a lista está vazia (`apps/web/src/componentes/itens-da-lateral.tsx:118`).
  - O print `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/.processo/vitrine/aluno--inicio--computador.png` mostra a mesma coisa.
- O teste falharia se a regra mudasse:
  - Se "Tutor" voltasse a ser o primeiro lugar, a linha 723 falharia.
  - Se a casca desenhasse um "Rodapé" para o aluno, a linha 741 falharia.
- A linha `**Sem mutação:**` está correta. O diff toca só `e2e/casca.spec.ts` e o documento, nenhum arquivo de `apps/*/src` nem de `packages/*/src`.
- Não há `.skip`, teste comentado nem mock. Não há IA nem operação concorrente na correção.
- Procurei nos outros specs da casca alguma referência ainda presa ao desenho antigo do aluno ("Rodapé", "Tutor" como primeiro lugar, "Privacidade") e não achei nenhuma. `areas.spec.ts` e `meus-dados.spec.ts` já esperam `toHaveCount(0)` para "Rodapé".

**Bloqueantes:** nenhum.

**Recomendações**
- **Para a retro:** a causa foi a tabela `PAPEIS_DA_CASCA` guardar um rótulo de navegação ("Tutor") que a tarefa 2.0 tirou da web. Como o literal estava só na tabela do e2e, `tools/ci/e2e-que-cita-literal.ts` não pegou e o problema só apareceu na esteira. Vale ver se a guarda deveria também cruzar os rótulos de `NAVEGACAO`, `RODAPE_DA_LATERAL` e `MENU_DA_PESSOA` alterados no diff com os specs que os citam.
- Não rodei o Playwright: o documento registra o vermelho antes, igual ao da esteira, e o verde depois nos dois projetos. Fiz só leitura e `git diff`, sem alterar nenhum arquivo.

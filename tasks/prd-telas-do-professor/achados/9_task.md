# Achados das revisões — `tasks/prd-telas-do-professor/9_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 02:56:38 · `tasks/prd-telas-do-professor/9_task.md`

VEREDITO: APROVADO

Tela vista: sim (6 fotos lidas: computador e celular, na escola cheia, na vazia e com o painel de contestação aberto). Não fotografei o estado vazio da página, "A coordenação ainda não alocou você", porque a escola "vazia" da vitrine tem uma turma confirmada. Conferi esse estado pelo código e pelo teste de componente.

Estados: ok.
- Carregando: `EstadoCarregando`, em `Turmas.tsx:172`.
- Erro: `EstadoErro` com "Tentar de novo", em `Turmas.tsx:173`.
- Vazio: `EstadoVazio`, em `Turmas.tsx:174-176`. Convida a ação: diz que quem aloca é a coordenação e manda falar com ela.
- Com dado: as faixas "Confirme suas turmas" e os cartões de "Suas turmas".
- O selo do cartão também tem "Lendo o que espera…", "Não lida" e "Em dia". Pelo código e pelos testes, "Em dia" só aparece com a turma lida inteira.

Acessibilidade:
- O estado do cartão vem sempre em texto, nunca só em cor.
- Os radios têm rótulo e linha de 44 px.
- O complemento tem `label` e `aria-describedby` para o aviso.
- O erro usa `role="alert"`.
- O link "Abrir a turma" leva o nome da turma em `sr-only`.
- O foco vai para o título "Suas turmas" depois de confirmar.
- Esc devolve o foco a "Contestar", e o teste cobre isso.
- O `h1` "Turmas" está visível.

Chromebook fraco:
- `Turmas` saiu da fachada por `lazy()` para respeitar o `size-limit` de 8 kB, e a divergência está declarada na tarefa.
- A lista vem de `useInfiniteQuery` com "Ver mais turmas", sem lista longa para virtualizar.
- O selo reaproveita as consultas do sino, sem leitura extra.
- Não rodei throttling de CPU nem de rede.

Celular:
- Nas fotos de 360 px não há rolagem horizontal nem texto cortado.
- A faixa quebra em duas linhas. O painel vira folha de baixo, com o miolo rolando e o rodapé fixo.
- Os botões "Confirmar" e "Contestar" medem cerca de 44 a 46 px, e "Abrir a turma" também.
- `min-h-11` está em `botao-secundario.ts:18` e `:75`. O e2e `professor-turmas.spec.ts` cobre a folha de baixo e os alvos.
- Nada depende de hover nem de atalho.

Ação oficial protegida: sim.
- "Confirmar" mostra turma e disciplina na própria faixa. Fica desabilitado enquanto uma decisão corre, então dois cliques mandam uma decisão só.
- "Contestar" abre o painel com o vínculo, o motivo em lista fechada e o aviso de não escrever nome de aluno. O efeito, em `EFEITO_DA_CONTESTACAO`, aparece antes de "Enviar a contestação". Sem motivo, nada é enviado.
- O texto fica no estado da página, então a releitura da lista não o apaga.

Bloqueantes: nenhum.

Recomendações:
- Na foto de 360 px, o texto do cabeçalho da casca está truncado ("Colég…"). Isso é da casca, não desta tarefa, mas vale registrar para o `/validar`.
- Na foto de celular, a barra inferior fixa cobre parte do cartão. É efeito do recorte de tela cheia da vitrine, não defeito de layout.
- O mockup 4.1 chama o botão de "Não é minha" e põe a faixa com os botões na ordem "Não é minha", "Confirmar". O produto usa "Contestar", "Confirmar" por contrato de e2e, e a tarefa declara isso fora do escopo. Fica para quando o nome do botão for revisto.
- Os cartões não trazem série, acerto da turma, próxima aula nem uso do Tutor. A tarefa declara isso como divergência e fora do escopo (F6, F8, F10).

Arquivos principais, todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/`: `Turmas.tsx`, `PainelDaContestacao.tsx`, `vinculo-na-tela.tsx`.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-19 02:57:03 · `tasks/prd-telas-do-professor/9_task.md`

VEREDITO: APROVADO

A tarefa só mexe no frontend. Não há campo novo, migration, endpoint, log nem envio externo. A tela mostra o mesmo dado de antes, num desenho novo. Não encontrei bloqueante.

**Campos pessoais tocados:** só o "Motivo de contestação de vínculo", com código e complemento de até 140 caracteres. Ele já estava na tabela de dados, em `docs/lgpd.md:72`. Antes era escrito no próprio cartão e agora é escrito em `PainelDaContestacao.tsx`. O selo do cartão mostra quantos pedidos de nome esperam na turma, não quem pediu. Os nomes dos pedidos não aparecem em Turmas.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok. Nenhuma rota é nova. O selo "N esperando você" sai das mesmas consultas que o sino já faz (`fila-do-professor.ts:701`, `esperaNaTurma`), sem nenhuma leitura a mais, e o servidor continua decidindo por objeto. Só o vínculo confirmado ganha o link "Abrir a turma" (`Turmas.tsx`, cartão). Os testes de mutação cobrem o pendente e o contestado.

**Logs:** limpos. Os arquivos novos e alterados não chamam `console`, nem guardam nada em `localStorage` ou `sessionStorage`. O complemento fica no estado da página e não vai para o endereço. Um teste de ponta a ponta prova isso (`e2e/professor-turmas.spec.ts:121-147`): o texto só sai no corpo do `POST /v1/vinculos/:id/contestar`, nunca no endereço, nunca no console, nunca em outra requisição.

**Auditoria:** a contestação continua sendo auditada pelo servidor (`vinculo.contestado`, como já era). A tarefa não cria nenhuma ação nova que exija auditoria.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os nomes de teste são do tipo "Aluna sintética Um", com matrículas M-9001 e M-9002, "Ana Sintética" e turmas "6ºC sintética".

**Fotos da tela:** batem com o que o DTO promete.
- Os dois arquivos `professora--professor-turmas--{computador,celular}.png` mostram turma, disciplina, o estado do vínculo e o selo "1 esperando você". Não aparece nome, matrícula nem conteúdo de aluno. O único nome de pessoa é o da própria professora, na casca.
- Os dois arquivos `...--button-name-Contestar--{computador,celular}.png` mostram o aviso "Não escreva nome de aluno aqui. Até 140 caracteres." antes do campo. Ele vem de `PainelDaContestacao.tsx`, no `<p id={aviso}>` com `AVISO_DO_COMPLEMENTO`. O efeito da contestação aparece antes do envio.
- Os dois arquivos `vazia--...` mostram só "Em dia", sem dado de pessoa.

**Pergunta de fechamento:** a tarefa não mudou o que o sistema guarda sobre o aluno nem para onde isso vai. O que valia antes para atender a secretaria continua valendo.

**Bloqueantes:** nenhum.

**Recomendações:**
- `e2e/inatividade.spec.ts`: no caso do recomeço com o painel aberto, saiu a checagem de acessibilidade (`violacoesGraves`) do login por cima, sob o argumento de que o caso do aluno já cobre. Não toca a minha regra. Deixo registrado para o `frontend-reviewer` e o `/validar`.
- `PainelDaContestacao.tsx`: na foto do celular com o painel aberto, a caixa do efeito fica abaixo da dobra. Ela aparece antes do envio, mas exige rolar. Vale considerar colocá-la acima do complemento ou perto do rodapé, para que a professora a veja sem rolar antes de enviar.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Turmas.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/PainelDaContestacao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/fila-do-professor.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/vinculo-na-tela.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-turmas.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/inatividade.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/docs/lgpd.md (linha 72)

## test-engineer · 1ª rodada · REPROVADO · 2026-10-19 02:57:59 · `tasks/prd-telas-do-professor/9_task.md`

VEREDITO: REPROVADO

Cenários exigidos: estados (carregando, erro com "Tentar de novo", vazio, só pendente, com confirmadas); confirmar (a faixa some, o cartão entra, dois cliques mandam uma decisão só, pendente e contestado sem "Abrir a turma"); duas disciplinas na mesma turma; contestar (sem motivo não envia, aviso e efeito antes do envio, o contestado sai da faixa e não conta para o sino); o texto sobrevive (releitura com o painel aberto, Esc devolve o foco); o que espera (soma das três origens por turma, nenhuma chamada além das do sino, leitura parcial e turma além das 12 dizem "não lida", os dois cartões da mesma turma abrem a mesma turma); recomeço (segunda pessoa na aba, sessão vencida com o painel aberto, troca de escola, o complemento fora do log e do endereço); 360 px (folha de baixo, sem rolar de lado, alvos de 44 px).

Cobertos: quase todos.
- **Estados, confirmar, duas disciplinas, contestar e o texto que sobrevive:** cobertos em `apps/web/src/areas/professor/Turmas.test.tsx`, com asserção sobre o resultado: o número de POSTs, o caminho da decisão, o rádio marcado e o valor do textarea depois do `invalidateQueries`, o foco.
- **O que espera:** `fila-do-professor.test.ts` cobre "Não lida" por falha, por 429, por entregas truncadas e além das 12; o "ou mais" como piso; e a contagem de chamadas por conjunto de caminhos.
- **Recomeço:** `e2e/inatividade.spec.ts` cobre a sessão vencida e a segunda pessoa; a troca de escola é o caso de isolamento já existente em `escola-e-vinculos.spec.ts:141`, sem mudança.
- **Complemento fora do log e do endereço:** `e2e/professor-turmas.spec.ts:121` confere o console, a URL e que só o POST da contestação leva o texto.
- **360 px e alvos de 44 px:** `e2e/professor-turmas.spec.ts:74`.
- **O contestado não conta para o sino:** prova de unidade já existente em `fila-do-professor.test.ts:93`.
- **Clique duplo:** testado com o clique repetido enquanto a decisão corre, no componente e no e2e. Não há `.skip`, nem mock de coisa nossa: a rede falsa responde por caminho, e a fila e o cliente de consultas são os reais.
- **As 13 mutações declaradas** batem com as cláusulas do diff, menos a do bloqueante abaixo.

Rodei `npx vitest run --project unidade` nos dois arquivos de unidade: 47 testes, todos verdes.

Bloqueantes:
1. **O selo só no cartão do vínculo confirmado é cláusula nova sem bloco e sem teste.** Fica em `apps/web/src/areas/professor/Turmas.tsx:154` (`{vinculo.estado === 'confirmado' && (` em volta do `SeloDoQueEspera`).
   - Se a condição sair, nenhum teste falha: em "com as confirmadas" (`Turmas.test.tsx:142`), o cartão contestado da 2º B passaria a mostrar "Não lida", e o encerrado da 1º A mostraria "Em dia", ou "N esperando você" quando a 1º A tiver itens.
   - As asserções desse caso só olham o estado em texto e a ausência de link.
   - O efeito é que um cartão que não abre a turma mostraria trabalho "esperando você", e esse trabalho ela não alcança por ele.
   - **Correção exigida:** em "com as confirmadas", dar à TURMA_A ao menos uma entrega pendente. Afirmar que os cartões contestado e encerrado não contêm "esperando você", "Em dia" nem "Não lida". E declarar o bloco em "Mutações", trocando `vinculo.estado === 'confirmado'` por `vinculo.estado !== 'pendente'` (linha 154, com a linha seguinte `<div>` como contexto para separar da linha 159).

Recomendações:
- **Declarar mutações no `SeloDoQueEspera`** (`Turmas.tsx:23-28`): o ramo `nao-lida` e o sufixo `' ou mais'`. Os testes de componente já pegariam as duas, mas hoje a regra "nunca Em dia sem ler" só está declarada do lado da fila.
- **`contestar.reset()` sem teste** (`Turmas.tsx:114`): falta um caso em que a contestação de um vínculo falha, o painel fecha e o painel de outro vínculo abre sem o alerta do anterior.
- **`familiaDaDisciplina` sem teste** (`apps/web/src/areas/professor/familia-da-disciplina.ts`): a regra escrita ali (nunca amarelo nem vermelho, a mesma cor para o mesmo id) cabe num teste de unidade curto.
- **"A faixa quebra" a 360 px** só é provada indiretamente, por `larguraExcedente === 0`. Uma asserção de que os botões descem para baixo do texto no projeto `celular` deixaria a prova explícita.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 02:58:26 · `tasks/prd-telas-do-professor/9_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As duas divergências da 9.0 estão registradas na `techspec.md`, que está staged: a série fora do cartão, na §9 "Cartão da turma", e `Turmas` por `lazy()` com o teto da fachada mantido em 8 kB, na §8 "Orçamento". As duas também estão na tabela do `9_task.md`. Esta spec não tem `cenarios.md`.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Recomendações:

1. **No celular, a professora pode enviar a contestação sem ver o efeito.** A foto `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/.processo/vitrine/professora--professor-turmas--button-name-Contestar--celular.png` mostra o aviso de `EFEITO_DA_CONTESTACAO` cortado embaixo da área que rola, e "Enviar a contestação" visível logo abaixo. Isso enfraquece a regra 50, item 8, e o "efeito escrito antes de enviar" da 9.2. A causa está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/PainelDaContestacao.tsx:86`, onde o efeito vem depois do campo de texto. A correção é subir o efeito para antes dos motivos ou levá-lo ao rodapé. O teste em `e2e/professor-turmas.spec.ts:89` não pega o caso, porque `toContainText` não confere se o texto está visível. A qualidade visual é do `frontend-reviewer`; fica o registro.
2. **O painel fecha sozinho e o texto some quando o vínculo sai da lista por fora.** Se o vínculo for decidido em outra aba, a releitura o tira de `paraConfirmar` e o painel fecha sem aviso (`Turmas.tsx:98` e `:204`). O que a professora escreveu se perde e `contestacao` continua preenchida no estado. Vale ao menos limpar o estado e avisar.
3. **`aoConfirmar` só repassa a chamada** (`Turmas.tsx:100-103`), e o comentário de cima fala do `disabled` do botão, não da função. Dá para chamar `confirmar.mutate` direto no `onClick`.
4. **O mesmo `abrirJaEntrando` está copiado em cinco specs**: `escola-e-vinculos.spec.ts:103`, `inatividade.spec.ts:58`, `professor-turmas.spec.ts:23`, `acesso-da-turma.spec.ts:217`, e em `areas.spec.ts:82` como `entrarPelaApi`. Convém mover para um arquivo de `e2e/__fixtures__/`.
5. **A §8 agora manda a 10.0 tirar `Turma` da fachada, mas o `10_task.md` não diz isso.** Falta incluir `rotas.tsx` e `.size-limit.json` nos "Arquivos previstos" da 10.0, para quem pegar a tarefa não descobrir a obrigação só pela Tech Spec.
6. **Dois testes de acessibilidade (axe) saíram de casos alterados**: o do login por cima em `inatividade.spec.ts:127`, com o argumento de que o caso do aluno já cobre, e o primeiro de `escola-e-vinculos.spec.ts`. Quem decide se a cobertura continua suficiente é o `test-engineer`.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-19 03:22:48 · `tasks/prd-telas-do-professor/9_task.md`

VEREDITO: APROVADO
Tela vista: sim (6 fotos lidas: `/professor/turmas` no computador e no celular, escola cheia e vazia, mais o painel "Contestar" nos dois tamanhos)
Estados: ok. Carregando (`Turmas.tsx:168`), erro com "Tentar de novo" (`:169`), vazio que convida (`:170-172`) e com dado foram conferidos no código. Carregando e erro não aparecem na vitrine.
Acessibilidade: ok.
- Os rádios têm rótulo, `min-h-11` e caixa de 24 px (`PainelDaContestacao.tsx:64-65`).
- O complemento tem `label` e `aria-describedby`.
- O erro usa `role="alert"`.
- O estado do vínculo aparece em texto, não só em cor.
- O foco vai para "Suas turmas" depois da decisão (`Turmas.tsx:63-67`).
- Na foto os alvos de toque parecem ter 44 px ou mais.

Chromebook fraco: ok.
- A lista é paginada com "Ver mais turmas".
- A tela não tem imagem nem animação pesada.
- O sino e a tela usam as mesmas consultas, sem leitura extra (`Turmas.tsx:45`).

Celular:
- Em 360 px não há rolagem horizontal nem texto cortado.
- A faixa de confirmação quebra e os botões descem para baixo do texto, sem esconder a ação.
- O painel de contestação vira folha de baixo com rodapé fixo e miolo que rola.
- A folha tem "Enviar a contestação" com 44 px ou mais, e o rodapé fica à vista.
- Nada depende de hover.

Ação oficial protegida: sim.
- Contestar mostra o vínculo (turma e disciplina) e o efeito antes de enviar. O efeito agora está no alto do painel, à vista a 360 px, como a correção pedia.
- O e2e prova isso com `toBeInViewport({ratio:1})` (`e2e/professor-turmas.spec.ts`).
- Os botões ficam `disabled` enquanto uma decisão corre, o que evita a ação repetida (`Turmas.tsx:98`).
- Confirmar o vínculo é um clique, mas na faixa a turma e a disciplina estão à vista, e a decisão é só da professora sobre a própria alocação. Não é nota nem saída de IA.

Bloqueantes: nenhum.

Recomendações:
- Os nomes das turmas na vitrine trazem sufixos como "d8fa74ae". Vêm do dado sintético da vitrine, não do código. Confira que não existe sufixo igual no dado real.
- Na foto do painel a 360 px, o texto de apoio do complemento fica cortado pelo rodapé ("Até 140…"). É a rolagem do miolo e funciona. Dar um pouco de respiro ao miolo (padding inferior) deixaria o corte menos brusco.
- A faixa diz "Confirme sua turma ·" em cada linha. Como o título da seção já diz isso, o texto da faixa poderia trazer só turma e disciplina.

Arquivos principais: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Turmas.tsx` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/PainelDaContestacao.tsx`.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-19 03:23:11 · `tasks/prd-telas-do-professor/9_task.md`

VEREDITO: APROVADO

Esta rodada conferiu só o que mudou desde a 1ª, que foi aprovada sem correções exigidas. Li o diff `abbb91a..4b72cc3` e as seis fotos novas.

Campos pessoais tocados: nenhum campo novo. Do lado da professora, a tela mostra o próprio nome (professora autenticada vendo os próprios dados). Também mostra o nome da turma e da disciplina, o estado do vínculo e um número de pendências. Nenhuma tela desta tarefa mostra nome, matrícula ou conteúdo de aluno, nas seis fotos.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok, nada mudou desde a 1ª rodada. O diff não toca API, repository nem rota. A nova asserção em `apps/web/src/areas/professor/Turmas.test.tsx` mostra o contador "1 esperando você" só no cartão confirmado, que é o único que abre a turma. No contestado e no encerrado ela garante a ausência de "esperando você", "Em dia", "Não lida" e "Lendo o que espera". Isso reforça a regra de não mostrar trabalho de uma turma que a professora não alcança por aquele vínculo.

Logs: limpos. O diff não acrescenta nenhum log.

Auditoria: não se aplica a este diff. Confirmar e contestar o vínculo continuam usando o mesmo caminho de API da 1ª rodada. A troca de `aoConfirmar(id)` por `confirmar.mutate(vinculo.id)` direto em `apps/web/src/areas/professor/Turmas.tsx` só remove uma função intermediária, e o `disabled={decidindo}` continua lá.

Envio externo: nenhum.

Seed/fixture: só dados inventados. As fotos mostram "Colégio sintético da vitrine cheia 4316ed97", "Professora Sintética Helena d8fa74ae", "6ºC sintética" e "2ºB d8fa74ae". Os ids em `familia-da-disciplina.test.ts` também são sintéticos.

O que olhei pela regra 20 no diff:
- `apps/web/src/areas/professor/PainelDaContestacao.tsx`: o aviso do efeito subiu para o alto do painel, que era a minha recomendação da 1ª rodada. Na foto `professora--professor-turmas--button-name-Contestar--celular.png`, o aviso aparece inteiro antes dos motivos. Diz que o vínculo contestado não dá acesso à turma nem aos alunos dela. Logo abaixo segue visível "Não escreva nome de aluno aqui. Até 140 caracteres". O e2e `e2e/professor-turmas.spec.ts` agora prova o aviso visível sem rolar (`toBeInViewport({ ratio: 1 })`) e mantém a asserção de `AVISO_DO_COMPLEMENTO`.
- Teste novo de `contestar.reset()` em `Turmas.test.tsx`: o alerta de erro de uma contestação não aparece no painel de outro vínculo. Assim nenhum dado de uma tentativa passa para outra.
- `familia-da-disciplina.test.ts` testa só a função pura que escolhe a cor a partir do id. Não há dado pessoal.
- As duas linhas novas do `TODO.md` são dívida de interface e de refatoração do e2e, sem impacto de privacidade.

Pergunta de fechamento: este diff não muda o que o sistema guarda sobre o aluno nem para onde envia. A resposta continua a mesma da 1ª rodada.

Bloqueantes: nenhum.

Recomendações:
- A linha do `TODO.md` sobre o painel que fecha sozinho quando o vínculo é decidido por fora tem um lado de regra 20. Quando a correção própria vier, ela também deve garantir que o rascunho do complemento não fique guardado no estado do cliente nem seja reenviado ao reabrir o painel de outro vínculo. O teste de `reset()` já cobre o caso do erro, mas não o do texto quando o painel desmonta sozinho.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 03:24:07 · `tasks/prd-telas-do-professor/9_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-turmas.spec.ts:57-63`: o teste de quebra da faixa usa `?? 0` nos dois lados. Se uma caixa vier nula, a comparação passa com zero. O `expect(...).not.toBeNull()` logo acima já segura esse caso, então o efeito é só de leitura. Ler as duas caixas com `if (!caixa) throw` deixaria o tipo limpo e tiraria os `?? 0`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Turmas.tsx:96-97`: o comentário de duas linhas antes de `decidindo` repete a mesma ideia ("ação oficial repetida" e "sai uma vez só"). Uma frase basta.
- Continua aberto o descompasso entre a §8 da Tech Spec e o `10_task.md`: a §8 diz para a 10.0 tirar `Turma` da fachada, e o `10_task.md` não diz isso. O documento da tarefa manda isso ao Orquestrador. Ele precisa chegar ao Arquiteto antes de a 10.0 começar.

O que conferi nesta rodada:
- **Arquivos:** o código e os testes na árvore são iguais ao snapshot `4b72cc3`.
- **As duas recomendações aplicadas:**
  - O aviso do efeito agora fica no alto de `PainelDaContestacao.tsx`. A foto `professora--professor-turmas--button-name-Contestar--celular.png` mostra o aviso acima dos motivos e à vista sem rolar. O e2e confere isso com `toBeInViewport({ ratio: 1 })`.
  - `aoConfirmar` saiu. A mutação do `disabled` foi atualizada para a linha nova.
- **Correção do `test-engineer`:** o selo agora aparece só no cartão confirmado, e o teste "com as confirmadas" prova isso. A mutação `estado !== 'pendente'` deixaria aparecer "1 esperando você" no cartão encerrado da 1º A, e o teste pega.
- **As três mutações novas:** cada uma tem trecho único no arquivo. O `vinculo.estado === 'confirmado' && (` aparece duas vezes, mas a linha de contexto `<div>` deixa o trecho único. Cada uma cita um teste que existe.
- **Teste novo de `contestar.reset()`:** prova o comportamento que `abrirContestacao` já tinha (`Turmas.tsx:110`).
- **`familia-da-disciplina.test.ts`:** os três testes de unidade conferem a cor da disciplina com `FAMILIAS_DA_DISCIPLINA`, sem amarelo nem vermelho.
- **Fotos:** nas da escola cheia e da vazia, o texto bate com o glossário e não aparece nada fora do que a tarefa pede.
- **Destino das recomendações não aplicadas:** as duas linhas novas do `TODO.md` e a tabela "Recomendações sem aplicar" do documento cobrem as recomendações da 1ª rodada.

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 03:24:08 · `tasks/prd-telas-do-professor/9_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os quatro estados da tela (carregando, erro, vazio, com dado). Confirmar, com a faixa saindo e o cartão entrando, e dois cliques mandando uma decisão só. Professor com duas disciplinas na mesma turma. Contestar: sem motivo não envia, o aviso e o efeito aparecem antes do envio, e o contestado sai da faixa e não abre a turma. O texto sobrevive à lista relida e à sessão vencida. O que espera: soma, piso "ou mais", "Não lida" no lugar de "Em dia". Recomeço com outra pessoa na mesma aba. Tela de 360 px. E o selo só no cartão confirmado, que foi a correção da 1ª rodada.

**Cobertos:**
- **A correção exigida foi feita.** Em "com as confirmadas", a 1º A agora tem uma entrega pendente, e o teste espera "1 esperando você" no cartão confirmado (`apps/web/src/areas/professor/Turmas.test.tsx:161`). Depois afirma que o cartão contestado e o encerrado não mostram nenhuma das quatro saídas possíveis do `SeloDoQueEspera` (`Turmas.test.tsx:172-175`).
  - Com a mutação `!== 'pendente'`, o cartão encerrado da 1º A passaria a mostrar "1 esperando você", e o teste falha pelo motivo certo.
  - O bloco está em "Mutações" (`tasks/prd-telas-do-professor/9_task.md:180-186`). A linha de contexto `<div>` separa a linha 150 da 155 do `Turmas.tsx`, cuja linha seguinte é o comentário `// Relativo à área`.
- **As recomendações que a ordem mandou aplicar foram aplicadas:**
  - Os blocos do ramo `nao-lida` e do sufixo `' ou mais'` estão declarados (`9_task.md:188-200`).
  - O `contestar.reset()` ganhou teste (`Turmas.test.tsx:339`). Ele falharia sem o reset: o `falha` é prop do painel, e o `key` não limpa o erro da mutação.
  - O `familiaDaDisciplina` ganhou teste: o mesmo id dá a mesma cor, e 500 ids nunca caem em amarelo nem vermelho.
  - A faixa quebrando a 360 px tem asserção de posição (`e2e/professor-turmas.spec.ts:58-63`), e o efeito aparece sem rolar (`e2e/professor-turmas.spec.ts:98`).
- O bloco do `disabled` foi atualizado para o `onClick` novo.
- `npx vitest run` do `Turmas.test.tsx` e do `familia-da-disciplina.test.ts`: 24 testes, todos verdes.

**Sobre os dois `violacoesGraves` retirados (a pergunta da Mesa):** a cobertura continua suficiente, e não é bloqueante.
- **Primeiro caso de `e2e/escola-e-vinculos.spec.ts`:** o mesmo estado (faixa a confirmar e cartões, na pele nova) passa pelo axe em `e2e/professor-turmas.spec.ts:76` e em `e2e/areas.spec.ts:492`. O próprio caso ainda roda o axe com o painel de contestação aberto, na linha que segue o preenchimento do complemento.
- **Login por cima em `e2e/inatividade.spec.ts`:** o componente é o mesmo diálogo, e passa pelo axe no caso do aluno (`e2e/inatividade.spec.ts:311`). O que deixou de passar pelo axe é só a variante com o campo de e-mail, a da equipe. Fica como recomendação, abaixo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Declarar um bloco de mutação para `contestar.reset()` (`apps/web/src/areas/professor/Turmas.tsx:110`), apontando para "a falha de uma contestação não vai junto para o painel do outro vínculo". O teste já existe e falharia sem o reset; falta só o portão provar isso.
2. A variante do login por cima com e-mail não passa mais pelo axe em nenhum caso de `inatividade.spec.ts`. Vale conferir se `e2e/acesso-suspenso.spec.ts` ou `e2e/professores.spec.ts` já a cobrem; se não, devolver um `violacoesGraves` barato quando o caso tiver folga de prazo.
3. O teste "espalha as disciplinas" (`familia-da-disciplina.test.ts`) usa ids que não são UUID (`disciplina-n`). Ids no formato UUID v7, como os de produção, provariam melhor a distribuição real.

Não rodei os e2e. A posição da faixa e o `toBeInViewport` ficam provados pelo portão da tarefa nos projetos `chromebook` e `celular`.

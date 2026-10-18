# Achados das revisões — `tasks/correcoes/2026-10-18-professor-em-area-alheia-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-18 14:21:34 · `tasks/correcoes/2026-10-18-professor-em-area-alheia-estoura-o-prazo.md`

VEREDITO: APROVADO
Tela vista: sim (10 fotos lidas, cheia e vazia, computador e celular). A tarefa só altera `e2e/areas.spec.ts` e não mexe em tela. As fotos são todas a "Página não encontrada" da professora nos endereços da coordenação e do aluno, que é o que os casos devem provar. Não rola nada a 1366 × 768.
Estados: ok. Esta correção não cria tela nem estado. A "não encontrada" aparece com texto em português, com a casca da professora e com o caminho de volta ("página inicial"). A professora tem "Sair" na lateral no computador e no topo no celular.
Acessibilidade: sem mudança. Os casos novos mantêm a conferência de título da aba ("Página não encontrada · Turmma"), do botão "Sair" visível e da ausência dos títulos da coordenação.
Chromebook fraco: é o objetivo da correção. O caso único, com seis cargas de página, passava dos 30 s na esteira. Agora são cinco casos, cada um com uma carga e uma entrada pela API. Os dez casos novos (cinco por projeto) levam de 3,7 a 4,5 s, abaixo dos 15 s do portão.
Celular: as fotos a 360 px não têm rolagem horizontal nem texto cortado. O "Sair" tem alvo de toque aparente de 44 px ou mais, e a barra inferior fica à vista. Os casos rodam nos dois projetos (`chromebook` e `celular`).
Ação oficial protegida: não se aplica, porque não há ação oficial nesta tarefa.

Bloqueantes: nenhum.

Conferi no código:
- `entrarPelaApi` (`e2e/areas.spec.ts:81`) usa o mesmo padrão de `abrirJaEntrando` em `e2e/acesso-da-turma.spec.ts:217`: `POST /v1/sessao/email` pela `page.request`, com o cookie ficando na aba.
- A guarda que as mutações atacam existe em `apps/web/src/rotas.tsx:131`.
- Cada caso confere o próprio pedido de chunk, o que é mais forte que somar os cinco endereços numa lista só.
- Nenhum import ficou sem uso. `entrarComoProfessora` e `criarEquipeComSenha` continuam usados em outros casos.

Recomendações:
- As mutações cobrem só os casos de Painel e do aluno. Os três casos de Governança, Estrutura e Professores dependem da mesma guarda, então o risco é baixo. Se o portão aceitar, um bloco de mutação por endereço deixaria a prova completa.
- O comentário em `e2e/areas.spec.ts:253` ("Separado do anterior só pelo prazo: as cinco entradas…") ficou com a contagem antiga. Hoje ele fala do caso do endereço inexistente, que vem depois dos casos divididos. Vale reescrever para "separado dos casos acima só pelo prazo".

## test-engineer · 1ª rodada · APROVADO · 2026-10-18 14:22:10 · `tasks/correcoes/2026-10-18-professor-em-area-alheia-estoura-o-prazo.md`

VEREDITO: APROVADO

**Cenários exigidos:** É uma correção só de teste, por causa do prazo do e2e, e o código da web não muda. A regra continua a mesma: a professora, num endereço de outro papel, cai em "não encontrada" e a área desse papel não é baixada. Os cenários exigidos são:
- a guarda de papel (`AreaDoPapel`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/rotas.tsx:131`) nos quatro endereços da coordenação e no do aluno;
- o chunk da área alheia nunca é pedido;
- a casca continua de pé, com o "Sair" e o título da aba;
- as duas cláusulas de mutação ficam vermelhas pelo motivo certo;
- cada caso alterado fica abaixo dos 15 s do portão nos projetos `chromebook` e `celular`.

Casos de borda do domínio e de concorrência não se aplicam: não há dado de escola nem operação que possa rodar duas vezes.

**Cobertos:**
- **Asserções:** todas as do caso antigo continuam, e nenhuma ficou mais fraca. A conferência do chunk passou a ser feita em cada endereço, e não somada numa lista só, o que é mais forte. O título da aba, que antes só era conferido depois do Painel, agora é conferido nos quatro endereços (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/areas.spec.ts:236-251`). O caso do aluno nunca conferiu "Sair" nem título, e continua igual (`:222-234`).
- **Mutações:**
  - No caso Painel, tirar a linha `:131` deixa a professora montar a área da coordenação. O chunk `coordenacao-*.js` é pedido e a "não encontrada" some, então o caso fica vermelho pelas duas asserções.
  - No caso do aluno, o comentário em `:231-232` já reconhece que a API também levaria a "não encontrada" sem a guarda. Quem morde é o pedido do chunk `aluno-*.js`, que é justamente a asserção feita para isso. É vermelho pelo motivo certo.
- **Entrada pela API:** `entrarPelaApi` (`:81-85`) é igual ao `abrirJaEntrando` de `acesso-da-turma.spec.ts:217`, que já está provado. O `page.request` divide os cookies com o contexto do navegador, e a resposta é conferida com `expect(resposta.ok())`. Os pedidos do `page.request` não disparam o `page.on('request')`, então não sujam a lista de chunks.
- **Prazo:** pelo `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/.processo/e2e-duracao.json`, os dez casos novos levam de 3,9 a 4,6 s nos dois projetos. Ficam bem abaixo dos 15 s do portão, e é o que o documento diz.
- **O que não há:** nenhum `.skip`, nenhum teste comentado, nenhum mock. A guarda roda de verdade contra a API real.

**Bloqueantes:** nenhum.

**Recomendações:**
- Os casos Governança, "uma turma da Estrutura" e Professores não têm bloco de mutação próprio. O corpo é o mesmo laço (`:236`) e a guarda é a mesma linha, então o bloco do Painel prova os quatro. Não bloqueia, mas um bloco para a turma da Estrutura fecharia a prova da rota aninhada (`nest`), caso um dia ela ganhe guarda própria.
- O `randomUUID()` da turma da Estrutura passou para o nível do módulo (`:72`), e o UUID agora é sorteado uma vez por worker em vez de uma vez por execução do caso. Não muda o que o caso prova, porque a turma nunca existe, mas vale um comentário curto dizendo que o id é de uma turma inexistente de propósito.

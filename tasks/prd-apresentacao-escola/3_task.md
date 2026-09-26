# Tarefa 3.0 — Professor cadastrado pela coordenação, com convite de cópia única de 7 dias e aceite sem segundo fator

**Funcionalidade:** apresentacao-escola · **Depende de:** nenhuma · **Paralelo com:** 1.0, 2.0, 4.0, 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A coordenação cadastra o professor e recebe, uma vez, o link do convite de 7 dias; refaz e revoga só convite de
professor; o professor aceita pelas rotas de convite que já existem, com a conta de outra escola ou criando a senha,
sem segundo fator.

## Contexto necessário

- `docs/visao-produto.md`; `docs/lgpd.md`, linha "Convite de professor"
- `techspec.md` seções 3 (a migration 0018 e o parágrafo do rollback), 4 (professores), 5 (passo 1), 7 (auditoria),
  11 (regra 10: a conta global, quarto afrouxamento da D71) e 13 (conta global)
- `cenarios.md`: E8 a E11, R4, C7, I7, A1, I3, P1, I9
- Regras 10, 20 (item 8), 40, 80 (item 7)
- `tasks/prd-apresentacao-painel/achados/indice.md`, 2.0 e 3.0: o nome reaproveitado, o filtro `tipo` no `where`
- Código:
  - `apps/api/src/sessao/convite.service.ts` — gerar, refazer e revogar da coordenação (A0b): o cadastro reaproveita
    o corpo, sem copiar
  - `apps/api/src/sessao/convite.repository.ts` (`usuarioConvidado`, `travarEscola`, `revogarParaRefazer`) e
    `resolucao-de-tenant.repository.ts` (`contaParaConvite`, `conviteValidoPorHash`, `escolaDoConviteParaOperador`)
  - `apps/api/src/sessao/login.service.ts:195` — onde o `coordenador` leva ao segundo fator
  - `VALIDADE_DO_CONVITE_HORAS` em `packages/shared/src/sessao/convite.ts`
  - `apps/api/test/painel-convite.int.test.ts` — o alarme da A0b (`tipo = 'professor'` dá 23514), que sai
  - `apps/api/test/trava-da-escola.ts` — forçar a ordem no C7

## Subtarefas

- [x] 3.1 — Migration 0018: o check de `convite.tipo` aceita `professor`. A validade passa a depender do tipo (7 dias
  e 72 h), num lugar só em `packages/shared`
- [x] 3.2 — `POST professores`: `contaParaConvite`, `usuarioConvidado(papel: professor)` e o convite sob
  `travarEscola`; devolve o link uma vez, `no-store`. `GET professores` sem link, token nem nada que diga se a conta
  era nova. Auditoria `professor.cadastrado` sem `contaNova`; `convite.criado` com o tipo
- [x] 3.3 — `POST professores/:usuarioId/convite/{refazer,revogar}`: só convite `tipo = 'professor'`; os da operação
  continuam só `coordenador` (os dois lados com o filtro no `where`)
- [x] 3.4 — O aceite do professor não pede segundo fator; o do coordenador continua pedindo
- [x] 3.5 — Contratos `.strict()`, células da `MATRIZ`, módulo `apps/api/src/professores`
- [x] 3.6 — Documento: em `docs/modelo-de-dados.md`, `Convite` com `tipo (coordenador | professor)` e o convite de
  professor reusando a conta global; a frase "os tipos `professor` e `sala` entram no F2" sai
- [x] 3.7 — Testes; as rotas novas entram em `escola-montada.int.test.ts` e em `matriz.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo`: `drizzle/0018_convite_professor.sql`, `schema/convite.ts`, `auditoria/acoes.ts` | novo, alterado |
| `apps/api/src/professores/*`; `packages/shared/src/professores/professores.ts` | novo |
| `apps/api/src/sessao/convite.*`, `resolucao-de-tenant.repository.ts`, `login.service.ts` | alterado |
| `apps/api/test/professores.int.test.ts`; `painel-convite.int.test.ts`, `escola-montada.int.test.ts`, `matriz*.ts`, `docs/modelo-de-dados.md` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E8, E9 | integração | link uma vez; refazer e revogar derrubam o anterior; 6º dia vale, depois de 7 cai; o de coordenador cai em 72 h |
| E10, E11 | integração | a conta de A aceita em B sem conta nova; a lista e a auditoria iguais para conta nova e existente |
| R4 | integração | usado, vencido, revogado, refeito e inexistente: a mesma resposta em `consultar` e `aceitar` |
| I7 | integração | refazer e revogar da operação com id de convite de professor, e os da coordenação com o de coordenador: `NAO_ENCONTRADO`, nada gravado |
| segundo fator | integração | o professor aceita e entra sem segundo fator; o coordenador, no mesmo fluxo, cai em `configurar_mfa` |
| A1, I3, P1, I9 (professores) | integração, unidade | auditoria com o tipo; escola B; professor e aluno recebem 404; células |
| C7 | integração, em paralelo | dois cadastros do mesmo e-mail e cadastrar × refazer, com `Promise.all`: um convite em aberto no fim |
| log novo | integração | só ids: nada de nome, e-mail nem token (A4) |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

E-mail; a alocação (F1); as telas (14.0); o expurgo (10.0); a prova de posse do e-mail ("Portão da primeira escola
real").

## Divergências resolvidas nesta tarefa

- **`login.service.ts` não mudou.** O `etapaDoLogin` já leva o professor a `pronta`; quem pedia o segundo fator era o
  aceite, que respondia `configurar_mfa` a toda conta nova. A decisão ficou em `ConviteService.aceitar`, pelo `tipo` do
  convite (`conviteValidoPorHash` passou a devolvê-lo): o professor, com conta nova ou não, recebe `entrar` com o
  bilhete, e a entrada por e-mail termina em `pronta`; o coordenador com conta nova continua em `configurar_mfa`. O
  contrato de `convites/aceitar` não mudou (Tech Spec, seção 4). Anotado na `techspec.md`, seção 5, passo 2.
- **`convite.*` com o tipo também no coordenador.** O `tipo` entrou obrigatório no `depois` de `convite.criado`,
  `.refeito`, `.revogado` e `.aceito`, dos dois tipos: o `convite.revogado` passou de `depois: null` a `{ tipo }`. O
  `contaNova` ficou opcional e só o `convite.criado` do coordenador o leva (A0b). `professor.cadastrado` é da entidade
  `usuario`, sem campo nenhum. Os testes da A0b que conferiam o `depois` exato ganharam o `tipo`. Anotado na
  `techspec.md`, seção 7.
- **O estado do professor e as matrizes.** A lista e a escrita decidem pelo mesmo `estadoDoProfessor` (`@educa/nucleo`)
  e pelas matrizes `REFAZER_`/`REVOGAR_CONVITE_DE_PROFESSOR_POR_ESTADO` (`@educa/shared`), como a coordenação na A0b.
  O `aceito` junta o professor ativo pelo convite e o que espera a primeira entrada, e o revogar do `aceito` é `CONFLITO`
  nos dois: separá-los diria à coordenação se o e-mail tinha conta em outra escola (E11), porque só a conta nova é
  ativada no aceite. Quem aceitou e não entrou é chamado de volta cadastrando de novo o mesmo e-mail. Anotado na
  `techspec.md`, seção 4.
- **Limite conhecido do E11, acrescentado ao risco da seção 13.** Na janela entre o aceite da conta que já existia e a
  primeira entrada dela (que dura até essa entrada, e pode nunca vir), cadastrar de novo o mesmo e-mail responde 201 (o
  usuário está inativo),
  e para a conta nova, já ativa, `CONFLITO`. Fechar isso deixaria preso para sempre quem aceitou e perdeu o bilhete. A
  lista, a auditoria do cadastro e o revogar não distinguem os dois. Fecha com a prova de posse do e-mail (Tech Spec,
  seção 13; "Portão da primeira escola real").
- **A auditoria do aceite ainda distingue as duas contas.** O `convite.aceito` leva `usuarioAtivo` (da F1), e o
  `usuario.ativado_por_convite` só existe para a conta que já tinha senha. Nenhuma rota da coordenação lê a auditoria
  hoje; quem a expuser (o dossiê, D61) decide com o `privacy-guardian` se esses campos saem. Os dois limites estão na
  seção 13 da `techspec.md`.
- **A lista sem e-mail.** `GET /v1/professores` traz usuário, nome e estado, paginada por usuário com a consulta da
  estrutura (`?pagina`, `?limite`): o e-mail mora na conta global, e a tela não precisa dele para refazer e revogar.
- **A célula da `MATRIZ`** é o recurso `professor`, com `listar`, `cadastrar`, `refazer_convite` e `revogar_convite`.
- **Refazer e revogar aceitam corpo vazio** (`{}` ou nenhum), estrito: campo a mais é `ENTRADA_INVALIDA`.
- **As varreduras transversais passaram a aceitar rota sem id.** `POST` e `GET /v1/professores` não têm recurso de B a
  pedir: ficam fora do I3 por id e entram no P1, A1, A3 e A4; o I3 da lista é o "I3 (lista)" de
  `professores.int.test.ts`. O teste que pedia um `:id` em toda rota passou a conferir que a rota com parâmetro tem alvo,
  e só ela.
- **Achado para a 13.0 e o W1, fora do escopo desta tarefa:** a alocação do F1 só aceita professor ativo
  (`VinculoRepository.pessoaAtivaComPapel`, `isNull(usuario.desativadoEm)`), e o professor cadastrado fica inativo até o
  aceite. O W1 e o RF7 descrevem a coordenação alocando antes do aceite. O E10 desta tarefa aloca depois da primeira
  entrada. Registrado na seção 13 da `techspec.md` ("Alocação antes do aceite": decide o Joaquim, antes da 13.0), no W1
  do `cenarios.md` e em "Decisão pendente" do `13_task.md`; a mudança toca regra do F1 na API e não entrou aqui.
- **Os casos de uso do professor moram em `sessao/convite-de-professor.service.ts`**, não em `convite.service.ts`
  (recomendação do `revisor-geral`): importam de lá o corpo comum (`convidar`, `refazerSobATrava`), sem copiar.

## Mutações

Cada cláusula apagada ou trocada, rodada e restaurada por cópia do arquivo. Rodadas sobre `professores.int.test.ts`,
`escola-montada.int.test.ts`, `painel-convite.int.test.ts`, `convite.repository.int.test.ts` e os testes de unidade.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `convite.repository.ts:198` (`tipo = 'professor'` em `dadosDoProfessor`) | I7 "cada filtro sozinho" |
| `convite.repository.ts:198` (`papel = 'professor'` em `dadosDoProfessor`) | I7 "cada filtro sozinho" |
| `convite.repository.ts:198` (escola em `dadosDoProfessor`) | I3 de refazer e revogar |
| `convite.repository.ts:164` (`tipo` em `revogarParaRefazer`) | I7 (camada do repository) |
| `convite.repository.ts:163` (`revogado_em = now()` no refazer trocado por `null`) | E8; E8 vencido e aceito |
| `convite.repository.ts:174` (`tipo` em `revogar`) | I7 (camada do repository) |
| `convite.service.ts:120` (`valido.tipo === 'coordenador'` no aceite) | segundo fator |
| `convite-de-professor.service.ts:52` (trava no cadastro) | C7 ordem forçada; C7 cadastrar × refazer |
| `convite-de-professor.service.ts:27` (trava em `professorSobATrava`) | C7 cadastrar × refazer |
| `convite-de-professor.service.ts:29` (sem convite de professor → `NAO_ENCONTRADO`) | I3 de refazer e revogar; os dois I7 da coordenação |
| `convite-de-professor.service.ts:73` (matriz do refazer) | E8 vencido e aceito (o `ativo` com convite em aberto) |
| `convite-de-professor.service.ts:90` (`revogado` → `NAO_ENCONTRADO`) | E8 |
| `convite-de-professor.service.ts:91` (`aceito` e outros → `CONFLITO`) | E8 vencido e aceito |
| `convite.service.ts:210` (professor ativo → `CONFLITO` em `convidar`) | E8 vencido e aceito |
| `convite-de-professor.service.ts:49` (validade do tipo no cadastro trocada pela do coordenador) | E9 |
| `convite-de-professor.service.ts:54` (`professor.cadastrado`) | A1 do `POST /v1/professores`; E11; C7 em paralelo |
| `convite-de-professor.service.ts:55` (`contaNova` acrescentado no `convite.criado` do professor) | E11 |
| `resolucao-de-tenant.repository.ts:355` (`expira_em > now()` em `conviteValidoPorHash`) | R4 |
| `resolucao-de-tenant.repository.ts:471` (`tipo = 'coordenador'` em `escolaDoConviteParaOperador`) | I7 da A1 em `painel-convite` |
| `professores.repository.ts:30` (escola na página) | I3 (lista) |
| `professores.repository.ts:30` (`papel = 'professor'`) | E8 (a lista traz o coordenador) |
| `professores.repository.ts:30` (`gt(usuario.id, pagina)`) | I3 (lista), a segunda página |
| `professores.repository.ts:40` (`tipo = 'professor'` nos convites) | I7 "cada filtro sozinho" (o estado na lista) |
| `professores.repository.ts:39` (escola nos convites) | nenhum, sozinha: segunda camada. Os ids da página já são da escola do contexto, e `usuario_id` é UUID global |
| `professores.controller.ts` (`no-store` do cadastro e do refazer) | E8 |
| `professores.controller.ts` (`@HttpCode(204)` do revogar) | a montagem de `escola-montada` (o revogar da montagem espera 204) |
| `professores.controller.ts` (corpo estrito do refazer) | A3 do refazer (o 400) |
| `professores.controller.ts` (corpo estrito do revogar) | A3 do revogar (o 400) |
| `professores.controller.ts:35,44` (`corpo ?? {}` do refazer e do revogar) | "refazer e revogar sem corpo nenhum" (o contrato estrito recusaria o `undefined`) |
| `professores.controller.ts` (`idDoCaminho` do revogar) | I3 do revogar (o id fora do formato) |
| `estado-do-professor.ts:45` (`<=` trocado por `<`) | unidade, E11 |
| `matriz.ts` (professor com `professor.cadastrar` aberto) | I9; a comparação com a expectativa |
| `0018_convite_professor.sql` | o I7 da operação e os testes de professor gravam `tipo = 'professor'`: sem a 0018, 23514 |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `test-engineer`, 1ª | Dois refazer em paralelo | Teste acrescentado (os dois 201, só o último link vale, um convite em aberto). A trava do botão vai para a 14.0 ("Herdado da 3.0" no `14_task.md`) |
| `test-engineer`, 1ª | Revogar × aceite com a ordem forçada; o comentário do revogar | Teste acrescentado nas duas ordens; o comentário corrigido (quem segura é a trava, que o aceite também pega) |
| `test-engineer`, 1ª | Bordas do cadastro: e-mail com outra caixa, vencido em aberto, coordenador que dá aula, nome repetido | Teste acrescentado |
| `test-engineer`, 1ª | Refazer e revogar sem corpo | Teste acrescentado |
| `test-engineer`, 2ª | Linha do `corpo ?? {}` em "Mutações"; dois refazer com a ordem forçada; o `retrato` inteiro na borda do vencido | Aplicadas |
| `test-engineer`, 3ª | Status 201 explícito no teste dos dois refazer com a ordem forçada | Recusada: o `parse` estrito das duas respostas já reprova o corpo de erro, e o teste do clique duplo em paralelo confere os dois 201 pelo status |
| `revisor-geral`, 1ª | Os dois bloqueantes (alocação antes do aceite; os dois canais do E11) | Aplicados: seção 13 da `techspec.md`, W1 do `cenarios.md`, "Decisão pendente" do `13_task.md` |
| `revisor-geral`, 1ª | Separar os casos de uso do professor de `convite.service.ts` | Aplicada: `sessao/convite-de-professor.service.ts` |
| `revisor-geral`, 1ª; `privacy-guardian`, 1ª | Nome antigo maior que 200 derrubaria a lista com 500 | Recusada: o check `usuario_nome_preenchido` do banco já limita o nome a 200 (depois do `btrim`), o mesmo teto do contrato; só um nome com espaço nas pontas, gravado fora da API, passaria disso |
| `privacy-guardian`, 1ª | O tamanho real da janela do E11; comentário do expurgo e linha 75 do `docs/lgpd.md` | Aplicadas |
| `tenancy-guardian`, 1ª | Teste que derrube sozinha a escola na consulta de convites da lista | Recusada: a FK composta `convite_usuario_da_escola_fk` impede gravar um convite de outra escola para um usuário desta, então o cenário não se monta nem pelo banco; fica como segunda camada, declarada em "Mutações" |
| `tenancy-guardian`, 1ª | Qualquer coordenação define a senha de conta global sem senha | Já no risco da seção 13 (conta global); o caso concreto vai ao teste do item do "Portão da primeira escola real" do `ROADMAP.md` |
| `revisor-geral`, 2ª | Linha longa no docblock de `professores.service.ts` | Aplicada |
| `infra-guardian`, 1ª | Índice parcial para a lista de professores | `TODO.md`, "Infra e operação" |
| `infra-guardian`, 1ª | Clique duplo no refazer na tela; importação de professores em lote com o hash fora da trava | 14.0 ("Herdado da 3.0"); a importação em lote não existe na A1 |
| `test-engineer`, 1ª | `convite.aceito.usuarioAtivo` e `usuario.ativado_por_convite` distinguem, na auditoria, a conta nova da que já existia | Limite anotado em "Divergências" (abaixo do E11); nenhuma rota da coordenação lê a auditoria hoje. Destino: a tarefa que exportar a auditoria no dossiê (D61), com o `privacy-guardian` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-26 12:10:53 | 2026-09-26 12:13:48 | `test-engineer` | 1 | APROVADO | a1d7cd8bec6d2c027 |
| 2026-09-26 12:25:21 | 2026-09-26 12:26:04 | `test-engineer` | 2 | APROVADO | ac4508d33db83726c |
| 2026-09-26 12:44:20 | 2026-09-26 12:45:45 | `infra-guardian` | 1 | APROVADO | a9b52a74cea31d511 |
| 2026-09-26 12:44:15 | 2026-09-26 12:45:47 | `privacy-guardian` | 1 | APROVADO | ab71d021cb8f7f198 |
| 2026-09-26 12:44:11 | 2026-09-26 12:46:43 | `tenancy-guardian` | 1 | APROVADO | ad42fd7413b3c780f |
| 2026-09-26 12:44:08 | 2026-09-26 12:46:54 | `revisor-geral` | 1 | REPROVADO | a70bf1eb2939cd61d |
| 2026-09-26 12:58:10 | 2026-09-26 12:58:49 | `test-engineer` | 3 | APROVADO | a8a23cdf9c6b26ca7 |
| 2026-09-26 13:18:08 | 2026-09-26 13:18:35 | `revisor-geral` | 2 | APROVADO | af9b9bddf5ce6e6c8 |
| 2026-09-26 13:18:13 | 2026-09-26 13:18:38 | `tenancy-guardian` | 2 | APROVADO | adcdc977d8565a7d8 |
| 2026-09-26 13:18:21 | 2026-09-26 13:18:40 | `infra-guardian` | 2 | APROVADO | a4a00cc2cadc157d5 |
| 2026-09-26 13:18:17 | 2026-09-26 13:18:58 | `privacy-guardian` | 2 | APROVADO | aa14192bc9200a2f0 |
| 2026-09-26 13:19:24 | 2026-09-26 13:48:21 | `revisor-geral` | 3 | APROVADO | a74a1199143cff562 |
| 2026-09-26 13:48:21 | 2026-09-26 13:48:25 | `revisor-geral` | 4 | APROVADO | a74a1199143cff562 |

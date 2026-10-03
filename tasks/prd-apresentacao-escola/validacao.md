# Validação — apresentacao-escola (A1, a escola montada pela coordenação)

## Rodada 1 — 03/10/2026

**Escopo:** funcionalidade completa (tarefas 1.0 a 17.0, mais as correções `2026-10-02-teto-do-e2e-na-esteira`,
`2026-10-03-decididos-continuam-marcados` e `2026-10-03-e2e-sem-dist-do-shared`)
**Commit validado:** `509cfc39c5bec149f22c9be9b5d22a6dbd23d8b6` (`develop`)
**Veredito: APROVADA COM RESSALVAS**

Não precisei reinstalar dependências: o `node_modules/.package-lock.json` (27/09 08:38) é mais novo que o
`package-lock.json` (27/09 07:59). Rodei o portão com a árvore limpa, e ela terminou limpa depois das provas de mutação.

### 1. RF a RF

Mapa de cenários: todo id do `cenarios.md` (I1–I10, P1–P5, R1–R5, E1–E30, V1–V5, C1–C12, L1–L12 com L4b e L6b,
A1–A7, W1–W15, K1–K2) está citado em pelo menos um teste versionado. Conferi isso por busca de identificador nos
arquivos de teste, e li os testes dos RF de maior risco (abaixo).

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `apps/web/src/rotas.tsx` (guarda de papel), casca em `apps/web/src/componentes/` | `e2e/areas.spec.ts` (W2), `e2e/escola-montada.spec.ts` (W1), `e2e/tokens.spec.ts`, `apps/web/src/areas/navegacao.test.ts` | Os três papéis, nos projetos `chromebook` e `celular`, com axe |
| RF2 | ATENDIDO | seletor com `resetQueries` depois do token novo (12.0) | `e2e/troca-de-escola.spec.ts:86` (W3) | O teste tem controle positivo: antes da troca, o cache contém a turma de A (`:122`). Depois, nenhum token de A, nenhuma resposta com id ou nome de A e nada no cache |
| RF3 | ATENDIDO | `apps/api/src/estrutura/*`, `exclusao.ts`, `esquemaPedidoCriarAnoLetivo` | `apps/api/test/estrutura.int.test.ts` (E1, E2), `acesso-da-turma.int.test.ts` (C11) | |
| RF4 | ATENDIDO | `apps/api/src/estrutura/leitor-da-lista.ts`, `lista.service.ts` | `leitor-da-lista.test.ts` (E3), `apps/api/test/lista.int.test.ts` (E4, E5), `e2e/estrutura.spec.ts` (W10) | |
| RF5 | ATENDIDO | `lista.repository.ts` (`on conflict do nothing`, `delete` condicional em `livre`) | `lista.int.test.ts` (E6, E7, C8), `decisao.int.test.ts:621,640,673` (E6, E7, C12 do aprovado) | |
| RF6 | ATENDIDO | `apps/api/src/professores/*`, `convite` com `tipo` (0018) | `apps/api/test/professores.int.test.ts` (E8, E9, R4, C7, I7) | Usado, vencido, revogado, refeito e inexistente respondem igual (R4) |
| RF7 | ATENDIDO | aceite sem segundo fator do professor, `contaParaConvite` | `professores.int.test.ts` (E10, E11), `e2e/convite.spec.ts` (W14) | |
| RF8 | ATENDIDO | `VinculoRepository.professorAlocavel` | `acesso-da-turma.int.test.ts`, `decisao.int.test.ts:439` (E12, P2, P3) | |
| RF9 | ATENDIDO | `apps/api/src/sala/acesso-da-turma.*`, `codigo-da-sala.ts`; `apps/web/src/areas/professor/texto-do-whatsapp.ts` | `acesso-da-turma.int.test.ts` (E13, E14, C5, C6, C11, A5), `codigo-da-sala.test.ts` (E15), `texto-do-whatsapp.test.ts` (E16), `e2e/acesso-da-turma.spec.ts` (W7) | |
| RF10 | ATENDIDO | `apps/api/src/sala/lista-livre.repository.ts:44,61`, `reivindicacao.service.ts:115` (o hash sempre) | `salas-abrir.int.test.ts` (E17), `salas-reivindicar.int.test.ts:580` (R2, R3), `:278` (E24), `reivindicacao.service.test.ts` (R3) | A lista não mostra matrícula; matrícula de outro nome e nome inexistente respondem com o mesmo corpo |
| RF11 | ATENDIDO | `lista-livre.repository.ts:71` (`estado = 'livre'`), um pendente por nome, `reivindicacao.service.ts:123-128` (releitura da chave) | `salas-reivindicar.int.test.ts:627,638,650,660,682` (C1, C2 a/b/c), `infra/k6/reivindicacao-em-sala.js` (K1) | Mutação feita (abaixo) |
| RF12 | ATENDIDO | `apps/api/src/sala/decisao.service.ts:96`, `decisao.repository.ts:105`; `apps/web/src/componentes/pedidos/*` | `decisao.int.test.ts:228,254,549-596` (E20, E25, C3), `e2e/pedidos.spec.ts` (W6, W15), `atualizacao-dos-pedidos.test.ts` | Não há "aprovar todos", e o teto de 40 está no contrato |
| RF13 | ATENDIDO | `decisao.service.ts:138-147` (usuário, credencial, vínculo confirmado com `decidido_em`, lista `aprovado`) | `decisao.int.test.ts:127` (E18, E22), `:662` (E19), `salas-reivindicar.int.test.ts:373` (R5), `minha-turma.int.test.ts` (I8) | |
| RF14 | ATENDIDO | `apps/api/src/sala/limites-da-sala.ts` (escola, nome e turma, em HMAC, no Redis) | `apps/api/test/limites-da-sala.int.test.ts` (L1–L9, L4b, L6b, I10), `limites-da-sala.test.ts` (L7), `infra/test/alertas*.ts` (L11, L12) | O PRD diz "o excesso segura o código". O desenho segura o nome e só atrasa o código da escola, e a divergência está registrada na Tech Spec, seção 11 (regra 80). Ver menor M1 |
| RF15 | ATENDIDO | `exigirEscolaDoContexto`/`exigirAnoEmCurso` em todos os repositories novos; `AcessoDaSala` com os dois `@SemEscopo` | `apps/api/test/escola-montada.int.test.ts:638` (I3, rota a rota), `:660` (P1), `decisao.int.test.ts:330` (I6), `salas-*.int.test.ts` (I4, I5, R1), `arquitetura.test.ts` (I1) | Mutações feitas (abaixo) |
| RF16 | ATENDIDO | `RegistroDeAuditoria` na transação de cada ação | `escola-montada.int.test.ts:697` (A1: a lista exata de ações por rota, com autor e escola, sem campo proibido), `decisao.int.test.ts:492`, `lista.int.test.ts` (A2) | |
| RF17 | ATENDIDO | DTOs com `.strict()` em `packages/shared/src/sala`, `estrutura`, `professores` | `escola-montada.int.test.ts:719` (A3, sentinelas em todas as variantes de resposta, inclusive 4xx e 503, e parse estrito), `:751` (A4) | |
| RF18 | ATENDIDO | telas de `apps/web/src/areas/*`, `paginas/TurmaPublica.tsx` | e2e W4, W5, W11, W12 em `e2e/*.spec.ts`, nos dois projetos | |
| RF19 | ATENDIDO | `infra/k6/reivindicacao-em-sala.js`, `infra/scripts/carga-sala.ts`, `conferir-carga-sala.ts` | `infra/test/carga-sala.test.ts`; resultado em `9_task.md:173-185` (K1 210/210, K2 2.100/2.100, zero 5xx, `decidir` com p95 de 778 ms, login da outra escola com p95 de 272 ms) | A carga rodou em 27/09, antes da trava `FOR SHARE` no ano que a 10.0 pôs na reivindicação e na decisão. Ver menor M2 |

**Total:** 19 atendidos, 0 parciais, 0 não atendidos, 0 não verificáveis.

Provas de mutação (cada uma restaurada com `git checkout -- <arquivo>`; a árvore terminou limpa):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF15 / RF12 | `decisao.repository.ts:49`, o `#comVinculoDoProfessor()` no alcance `turma_vinculada` | `decisao.int.test.ts` "I6: … pelo professor de T1 …" (os resultados do lote mudam) |
| RF15 / RF10 | `lista-livre.repository.ts:69`, `eq(listaNome.turmaId, turmaId)` no `tomar` | `salas-reivindicar.int.test.ts` "I5" (o nome de T2 respondeu 200, e o esperado era 409) |
| RF11 | `lista-livre.repository.ts:71`, `eq(listaNome.estado, 'livre')` no `tomar` | `salas-reivindicar.int.test.ts` "C1 (repository)" (`expected true to be false`). O C1 por HTTP continua verde sem a cláusula, porque o único "um pendente por nome" segura a corrida. É a defesa em duas camadas que o cenário descreve |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: o aluno só entra por reivindicação aprovada por humano (D4) | cumprida | `decisao.service.ts:138`; R5 (o login antes da aprovação responde como a senha errada) |
| Regra: matrícula única por escola | cumprida | E5 (a mesma matrícula em outra escola entra); único `(escola, ano, matrícula)` |
| Regra: o vínculo do professor só vale confirmado | cumprida | P2, P3, E12, I6 |
| Regra: turma, vínculo e lista no ano letivo | cumprida | V1, V2, C10 |
| Regra: convite e link com expiração e revogação; o link é de uso múltiplo e o único é o nome | cumprida | E9, E13, E28, R1, R4 |
| Regra: o convite não sai do sistema | cumprida | não há provedor de e-mail no caminho; o link é copiado (14.0) |
| Regra: aluno sem e-mail, telefone, foto ou data de nascimento | cumprida, com ressalva | o modelo não tem esses campos; a trava contra CPF ou data na matrícula existe só na tela (maior G2) |
| Regra: sem contagem pública nem placar (D59) | cumprida | a página pública não mostra contagem; "Aprovados nesta turma: N" aparece só para a coordenação |
| Borda: dois alunos com o mesmo nome | coberta | E24, `decisao.int.test.ts:306`. Na tela, os dois nomes aparecem iguais (menor M5) |
| Borda: aluno pega o nome do colega | coberta | R2, E25 |
| Borda: aluno que chega em maio | coberta | E26, E7 |
| Borda: turma sem professor alocado | coberta | E27 |
| Borda: matrícula repetida ou já usada | coberta | E4, E7 |
| Borda: convite aberto depois de refeito | coberta | R4, W14 |
| Borda: link que circulou depois da semana | coberta | E28 |
| Borda: aluno fecha a aba no meio | coberta | E23 (falha injetada entre o `insert` e o `update`) |
| Borda: virada de ano letivo | coberta | V1, V2, C10 |
| Pronto: o fluxo inteiro na tela, nos dois projetos, com axe (W1) | cumprido | `e2e/escola-montada.spec.ts:61`. A escola nasce pela fixture "como o painel a cria" (sem ano letivo), e não pela tela do painel. O painel tem o e2e próprio da A0b |
| Pronto: duas turmas montadas com lista, sem cadastro de aluno um a um | cumprido | E4, E6, W10. O W1 monta uma turma pela tela, e a segunda vem do banco (`escola-montada.spec.ts:170`). O caminho é o mesmo |
| Pronto: o professor entra pelo convite, confirma e contesta, e o pendente não alcança | cumprido | E10, E12, P2 |
| Pronto: aluno só com aprovação humana registrada | cumprido | E18, R5, A1 |
| Pronto: mesmo nome no mesmo segundo, 35 do mesmo IP, a rajada | cumprido | C1, C2, L1, K1, K2 |
| Pronto: navegação por papel com a pele da D72, e troca sem dado da anterior | cumprido | W2, W3 |
| Pronto: isolamento do F1 verde, e o I3 por rota nova | cumprido | `estrutura-isolamento.int.test.ts` e `arquitetura.test.ts` verdes neste portão; I3 em `escola-montada.int.test.ts:638` |
| Pronto: virada, eliminação e expurgo nas três tabelas | cumprido | `virada-do-ano.int.test.ts` (V1, C10), `ciclo-de-vida.int.test.ts` (V3, V4), `apps/worker/test/expurgo-de-acesso.int.test.ts` (V5) |
| Pronto: cada cenário com o seu teste, citado pelo id | cumprido | busca de identificador (seção 1) |
| Pronto: desvios nos documentos, e `docs/lgpd.md` batendo com o código | cumprido | `docs/infra.md` 3.5; `docs/modelo-de-dados.md:158-159` (os dois `@SemEscopo`); `docs/lgpd.md:72-77` (lista, reivindicação, acesso, convite de professor, contadores da sala); `docs/runbook.md:386` |
| Pronto: pendências de tela em "Recomendações sem aplicar" das 11.0, 12.0 e 17.0, com destino `/validar` | cumprido | `11_task.md:174-184`, `12_task.md:139-147`, `17_task.md:235-244` |
| "Pronto quando" do `ROADMAP.md` (A1) | cumprido | os mesmos itens acima |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ (guardas sem violação) |
| `npm run test` (`EDUCA_BANCO_NOVO=1`) | ✅ (222 arquivos, 2.750 testes) |
| `npm run test:e2e` | ✅ (394 passaram, 11,1 min) |
| `npm run test:infra` | ✅ (5 arquivos, 37 testes) |
| Esteira do GitHub no commit validado | ✅ execução 37149724573, `headSha` 509cfc3, os quatro jobs verdes |
| Revisões com veto registradas e aprovadas | ✅ (as 17 tarefas e as 3 correções) |

Processo:
- A última rodada de cada revisor obrigatório, nas 17 tarefas, é APROVADO, sempre com `test-engineer` e
  `revisor-geral`. As três correções têm `test-engineer` e o guardião que declararam
- A spec passou por `/revisar-spec`: `revisao-spec.md:7`, APROVADA na rodada 5
- Nenhum commit de código sem `(tarefa N.0)` ou `(correção <slug>)`. Os dois commits sem marca no intervalo
  (`9a93190`, `15ceca2`) mexem só em `.claude/`
- A esteira da 16.0 (`45af31a`) e a da 17.0 (`caa1071`) ficaram vermelhas no e2e, e no `verificar` no caso da 17.0. Cada
  uma foi fechada por uma correção marcada antes da tarefa seguinte. Registro na menor M6

### 4. Achados

**Críticos**
- Nenhum.

**Maiores**
- G1. `TODO.md:480-484`: encerrar o vínculo do professor não revoga o acesso da turma que ele gerou. A pendência tinha
  destino "antes do `/validar` da A1" e continua aberta. O professor que saiu fica com um link ou código que mostra os
  nomes livres da turma (nomes de menores) por até 30 dias. A coordenação não tem como revogar só aquela turma: o
  acesso não é célula dela (P2), e o único remédio é o `ops:revogar-acessos-sala`, que derruba a escola inteira. Isso
  esbarra na regra 20, item 18 ("professor que saiu em março não continua vendo a turma"). Não bloqueia a A2, porque o
  dado é sintético (D71). **Correção:** decidir com o `privacy-guardian`. Ou o encerramento do último vínculo
  confirmado na turma revoga o acesso na mesma transação, ou a coordenação ganha o `revogar` do acesso
  (`MATRIZ`, recurso `acesso_turma`). Nos dois casos, com teste de integração. Prazo: antes do portão da primeira
  escola real
- G2. `TODO.md:67-69`: a trava de matrícula com forma de CPF ou data existe só na tela (`pareceDocumento`, em
  `apps/web/src/areas/coordenacao/previa-da-lista.ts`). A API grava essa matrícula, na lista e no avulso, vinda de
  qualquer outro cliente. É regra de negócio no frontend (regra 00, item 1) protegendo a regra 20, item 2. A pendência
  pedia decisão neste `/validar`. Junto vêm o CPF sem pontuação, que passa pela trava (`TODO.md:59-61`), e a falta de
  saída para o falso positivo (`:70-72`). **Correção:** levar a regra ao contrato em `packages/shared`
  (`esquemaPedidoLista`, nome avulso), com o mesmo critério da tela e um código de erro próprio por linha, e decidir a
  saída do falso positivo nas entrevistas do piloto. Prazo: antes de qualquer dado real

**Menores**
- M1. `prd.md:59` (RF14) diz "excesso segura o código". O desenho aprovado segura o nome e atrasa o código
  (`techspec.md:509-510`). Está registrado na Tech Spec, mas o PRD continua com o texto antigo. **Correção:** ajustar
  o "Como se prova" do RF14 no PRD
- M2. `9_task.md:173`: a carga K1/K2 rodou em 27/09, antes da 10.0 pôr `FOR SHARE` no ano em cada transação da
  reivindicação e da decisão (`reivindicacao.service.ts:119`, `decisao.service.ts:132`). A trava é compartilhada e não
  deve mudar a régua, mas o número publicado não mede o código de hoje. **Correção:** rodar `npm run carga:sala` uma vez
  no código atual e anotar o resultado no `9_task.md`, ou na retro
- M3. `TODO.md:475-479`: o gerar do acesso espera a releitura da seção antes de mostrar o código. Tinha destino "antes
  do `/validar` da A1" e continua aberto. É experiência numa rede que engasga, sem risco de dado. **Correção:** decidir
  com o `frontend-reviewer` e levar ao `TODO.md` com nova data
- M4. `TODO.md:73-74`: as respostas nominais da API (`GET turmas/:id/lista`, `GET turmas/:id/reivindicacoes`) não
  mandam `Cache-Control: no-store`. A web já pede sem cache. **Correção:** pôr o cabeçalho nas duas rotas, com o
  teste ao lado do A7
- M5. `17_task.md:238,244` e `16_task.md:264`: com dois nomes iguais, a página pública e a lista do professor mostram
  os dois iguais, e só a hora os separa. O PRD é cumprido (cada um só com a própria matrícula), mas a pergunta de
  produto ficou sem decisão. **Correção:** `/descobrir` antes da fatia do piloto
- M6. A esteira de `45af31a` (16.0) e a de `caa1071` (17.0) ficaram vermelhas com o portão local verde. As correções
  vieram certas, mas é o segundo caso seguido em que o e2e da esteira pega o que o portão local não pegou (na 17.0,
  o `dist` do `@educa/shared`). **Correção:** levar ao `/retro` a diferença entre o ambiente local e o da esteira no e2e
- M7. `tasks.md:46-49` e `:99-103`: as subtarefas 5.1–5.4 e 13.1–13.5 continuam `[ ]` com a tarefa-mãe `[x]`.
  **Correção:** marcar
- M8. Recomendações de revisor com destino `/validar` que não pedem mudança agora. Ficam registradas para não se
  perderem, cada uma no lugar indicado:
  - variantes do `Botao` e cópias da classe `secundario` (`11_task.md:179,182`)
  - título da aba na guarda carregando (`11_task.md:183`)
  - trilho no tablet (`11_task.md:177`)
  - rodapé do aluno e "Como a IA funciona aqui" (`11_task.md:174,184`, para a A2)
  - foco depois da troca de escola e as leituras duplas do leitor de tela (`12_task.md:144-147`; `15_task.md:267`)
  - seletor sem sigla e turno, a conferir com o Gabriel (`12_task.md:139`)
  - casos curtos de e2e: refazer com a pergunta de fechar, `vigiarAba` da A0b com IndexedDB e Cache Storage, sessão
    vencida com o cadastro aberto, foco no primeiro cadastro com a rede lenta (`14_task.md:303-309`)
  - 640 px do "Cancelar" com a caixa nula, slug longo, queda de rede real no gerar, segundo professor da mesma escola
    na mesma aba (`15_task.md:259-276`)
  - `cancelRefetch`, `refetchOnWindowFocus`, texto do "há mais" por papel, contagem dos aprovados por estado, diálogo
    congelado com a decisão no ar (`16_task.md:263-274`)
  - "O sistema está cheio agora." sem dizer o que fazer, e o "Tentar de novo" da abertura pelo link sem variação
    aleatória (`17_task.md:235,239`)
  - critério para a entrada do aprovado na fase `k2_redis_lento` (`9_task.md:192`)
  - encerrar alocação pela tela (`13_task.md:457`)
  - "quem está num link continua onde está", só visto à mão (`13_task.md:475`)

  O texto da marca de matrícula errada, que o `privacy-guardian` pediu para conferir (`16_task.md:269`), é fato e não
  juízo sobre o aluno: "Houve tentativa com matrícula errada neste nome; pode ter sido erro de digitação"
  (`apps/web/src/componentes/pedidos/textos.ts:15`). Está conferido e não há o que mudar.

**Positivos**
- O arquivo transversal `escola-montada.int.test.ts` varre I3, P1, A1, A3 e A4 sobre a lista declarada de rotas, e um
  teste confere que a lista é a da spec. Rota nova sem varredura fica vermelha
- Cada cenário de `cenarios.md` traz o "Quebra sem", e as três mutações rodadas aqui ficaram vermelhas exatamente onde
  o cenário dizia
- A defesa em duas camadas da reivindicação (`update` condicional mais único parcial, com a releitura da chave sem ler
  o nome da restrição) é provada camada a camada (C1 HTTP e C1 repository)
- O W3 tem controle positivo: o cache contém a turma de A antes da troca, o que dá valor à ausência depois

### 5. Conclusão

Os 19 RF estão atendidos, com código e teste que pega a remoção da regra. O critério de pronto da `tasks.md` e o
"Pronto quando" do roadmap estão cumpridos. O portão local está verde nas cinco etapas, e a esteira do commit validado
também. Não há achado crítico.

O veredito não é APROVADA por causa das duas maiores. São pendências de privacidade que tinham este `/validar` como
prazo de decisão e chegaram abertas: o acesso que sobrevive ao fim do vínculo do professor (G1) e a trava de CPF ou
data só na tela (G2). Nenhuma das duas bloqueia a A2 enquanto o dado for sintético (D71). As duas precisam estar
fechadas antes do portão da primeira escola real. O caminho até APROVADA é decidir e implementar G1 e G2, com teste,
por `/corrigir` ou numa tarefa da F2, e revalidar.

### 6. Pendências herdadas

| Pendência | Destino |
|---|---|
| G1, acesso da turma depois do fim do vínculo do professor | `/corrigir` com o `privacy-guardian`, ou F2; antes do portão da primeira escola real (`TODO.md:480`) |
| G2, trava de CPF ou data no contrato, CPF sem pontuação, falso positivo | F2 ou `/corrigir`; entrevistas do piloto; antes de qualquer dado real (`TODO.md:57-74`) |
| M2, carga no código atual | próxima execução de `npm run carga:sala` (retro da A1) |
| M3, gerar que espera a releitura | `TODO.md:475`, nova data com o `frontend-reviewer` |
| M4, `no-store` nas respostas nominais | `TODO.md:73`, correção própria |
| M5, homônimos na tela | `/descobrir` antes da fatia do piloto |
| M6, esteira vermelha depois do portão local verde | `/retro` da A1 |
| Expurgo do pedido decidido ("vigência + 5 anos") | F3 (`TODO.md:18`, já registrado) |
| `rl:ip:sala` próprio | F2 (`TODO.md:243`, já registrado) |
| Prova de posse do e-mail (conta global) | portão da primeira escola real (`techspec.md` seção 13, `ROADMAP.md`) |
| M8, recomendações de tela e de teste | cada uma no `N_task.md` citado; a retro decide quais viram `TODO.md` |

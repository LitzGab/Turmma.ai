# Validação — Identidade do operador Turmma (A0, `apresentacao-operacao`)

## Rodada 2 — 24/09/2026

**Escopo:** funcionalidade completa (tarefas 1.0 a 11.0, mais a correção `2026-09-24-modelo-de-dados-tabelas-da-operacao`)
**Commit validado:** `969a1d9b6adab4563f91b7b8c2ec624899725ee5`
**Veredito: APROVADA**

Revalidação. Entre `3921eaa` (rodada 1) e `969a1d9` entrou um commit só, a correção
`(correção 2026-09-24-modelo-de-dados-tabelas-da-operacao)`, que mexe em `docs/modelo-de-dados.md`,
em `apps/api/test/arquitetura.test.ts` e nos registros da correção. Nenhum arquivo de `apps/*/src`,
`packages/*/src`, migration, `infra/` ou `e2e/` mudou, e por isso a análise RF a RF da rodada 1
continua valendo sem mudança. O `node_modules` era mais novo que o `package-lock.json`, e o `npm ci`
não foi preciso. A árvore estava limpa no começo (só este relatório, não versionado) e terminou
limpa: a prova de mutação foi desfeita com `git checkout -- docs/modelo-de-dados.md`.

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 a RF9 | ATENDIDO | sem mudança desde a rodada 1 (ver a tabela da rodada 1) | idem; a suíte inteira passou de novo neste commit | o diff não toca código de produção |

**O achado maior da rodada 1, conferido:**

| Item | Situação | Evidência |
|---|---|---|
| `docs/modelo-de-dados.md`, item 1 das "Regras transversais", lista as seis tabelas da operação como exceção ao `escolaId` | resolvido | `docs/modelo-de-dados.md:316-325`: a lista agora nomeia `Escola`/`Rede`, a tabela pública, `Conta`/`CodigoRecuperacao` e `Operador`, `CodigoRecuperacaoOperador`, `ConviteOperador`, `SessaoOperador`, `AcessoOperacao`, `AuditoriaOperacao` |
| O documento desenha as seis tabelas | resolvido | `docs/modelo-de-dados.md:89-111` ("Operação Turmma"). Conferi campo a campo contra `packages/nucleo/drizzle/0014_operador.sql:7-93`: nomes, nulidade, os três eventos de `acesso_operacao`, `bootstrap` como autor, o check do operador desativado sem dado pessoal e o único parcial `convite_operador_pendente_unico` batem |
| A contradição não volta em silêncio | resolvido | `apps/api/test/arquitetura.test.ts:543-609`: lê as migrations em ordem, acha toda tabela que termina sem `escola_id` e exige o nome entre crases dentro do item 1. Os outros dois casos provam que a varredura enxerga as migrations (acha `conta` e as seis, não acha `usuario`, `turma`, `auditoria`, `job_registro`) e que citar o nome fora do item 1 não vale |

Prova de mutação:

| Alvo | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| Regra 10, item 1, no documento | `` `Operador`, `` tirado do item 1 em `docs/modelo-de-dados.md:323` | `arquitetura.test.ts:595` ("o item 1 das Regras transversais … nomeia cada uma"): `expected [ 'operador' ] to deeply equal []` |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regras de negócio, casos de borda do PRD | cumpridas · cobertas | sem mudança desde a rodada 1 |
| Pronto do `tasks.md` (os seis itens) | cumprido | sem mudança desde a rodada 1; a suíte e o e2e verdes neste commit |
| Roadmap, "Pronto quando" da A0 | cumprido | idem |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ (ESLint e guardas) |
| `npm run test` | ✅ (166 arquivos, 1967 casos; os 3 a mais que a rodada 1 são os do teste novo) |
| `npm run test:e2e` | ✅ (176 casos, nenhum intermitente) |
| `npm run test:infra` | não se aplica localmente: o diff não toca infra. Verde na esteira deste commit (job "infra") |
| Esteira do GitHub no commit validado | ✅ run 36004311183 em `develop`, `headSha` = `969a1d9`: verificar, integração, e2e e infra verdes |
| Revisões com veto registradas e aprovadas | ✅ a correção tem `test-engineer` e `tenancy-guardian` com rodada 1 APROVADO (`tasks/correcoes/2026-09-24-modelo-de-dados-tabelas-da-operacao.md`); as 11 tarefas, como na rodada 1. O commit leva `(correção <slug>)` |

### 4. Achados

**Críticos**
- Nenhum.

**Maiores**
- Nenhum. O maior da rodada 1 está resolvido (seção 1).

**Menores**
- `apps/api/test/arquitetura.test.ts:555-561` (`tabelasSemEscola`): a varredura só reconhece o `CREATE TABLE "x" (` … `\n);` que o drizzle-kit gera; uma migration escrita à mão (`IF NOT EXISTS`, esquema qualificado, CRLF) faria a tabela sumir da leitura e o teste ficar verde, e `DROP COLUMN "escola_id"` e `RENAME TO` não são tratados. Recomendação do `test-engineer` e do `tenancy-guardian` na correção, sem destino. Correção: exigir que o número de tabelas lidas seja igual ao de `CREATE TABLE` achados por uma busca solta, ou declarar o limite no comentário da função.
- `tasks/prd-apresentacao-operacao/validacao.md` (este arquivo) não está no git: a rodada 1 ficou fora do commit da correção que ela originou. Correção: versionar o relatório junto com o fechamento da A0 no roadmap.
- Continuam da rodada 1, sem mudança: as subtarefas 9.1 a 9.3 ainda `[ ]` em `tasks.md:59-61`; a rodada 9 do `test-engineer` em `revisao-spec.md` sem APROVADO depois; o seed do E1 por SQL (`e2e/__fixtures__/operacao.ts:70-92`); o E5 sem o identificador no título; a métrica de 3 minutos do PRD sem medição; e as recomendações de revisor das tarefas 3.0 a 11.0 listadas na rodada 1.

**Positivos**
- A correção não só acertou o documento: transformou a lista de exceções ao `escolaId` em algo conferido contra as migrations por teste, e o teste achou de quebra uma omissão antiga (`Escola` e `Rede`).

### 5. Conclusão

Todos os RF continuam ATENDIDOS, o critério de pronto do `tasks.md` e o "Pronto quando" do roadmap
estão cumpridos, e não há achado crítico nem maior. O único maior da rodada 1, o
`docs/modelo-de-dados.md` contradizendo o código, está resolvido, e a mutação no documento deixa o
teste novo vermelho. O portão local está verde (typecheck, lint, 1967 testes, 176 e2e) e a esteira do
commit validado está verde nos quatro jobs, inclusive o de infra. Os menores não bloqueiam a A0b.

### 6. Pendências herdadas

- As da rodada 1, sem mudança de destino.
- A robustez da varredura de migrations (`tabelasSemEscola`): `/retro` da A0, ou a primeira tarefa
  que escrever migration à mão.

## Rodada 1 — 24/09/2026

**Escopo:** funcionalidade completa (tarefas 1.0 a 11.0)
**Commit validado:** `3921eaabd1f3d4fa34056b8e2a387038faa4f670`
**Veredito: APROVADA COM RESSALVAS**

O `node_modules` era mais novo que o `package-lock.json`, e por isso o `npm ci` não foi preciso. A árvore
estava limpa no começo e continua limpa: as três provas de mutação foram desfeitas com `git checkout`.

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 — operador nasce por comando, com o autor registrado; `desativar` corta na requisição seguinte; nenhuma rota cria operador | ATENDIDO | `apps/api/src/ops/operador.ts:114-179` (`autorSobATrava`, `criarOperador`, `desativarOperador`, com trava consultiva `pg_advisory_xact_lock` e `encerrarSessoes` na linha 175); `apps/api/src/ops/comando.ts` (`conferirOperador` em todo `ops:*`) | `apps/api/test/ops-operador.int.test.ts` (C1 a C8); `apps/api/test/arquitetura.test.ts:497` (C44, sem rota de criação); `apps/api/test/operacao-isolamento.int.test.ts:272` (C6: SESSAO_ENCERRADA na requisição seguinte); `registros-operador.int.test.ts:131` (auditoria com o autor do `OPERADOR`) | O `ops:sessao-sintetica` não confere o `OPERADOR`, mas só roda com `AMBIENTE=local` e não grava auditoria |
| RF2 — convite de uso único, 72 h; usado, vencido, revogado e inexistente respondem igual; dois aceites gravam uma senha só | ATENDIDO | `apps/api/src/operacao/convite-operador.service.ts` (`conviteInvalido` único); `operador.repository.ts:325-384` (`conviteValidoPorHash`, `aceitarConvite` com `for update` e `update … where usado_em is null … returning`) | `apps/api/test/convite-operador.int.test.ts` (C9, C10, C11, C7 com o link antigo) | Prova de mutação 2 |
| RF3 — e-mail, senha e segundo fator, sempre; TOTP e código de recuperação valem uma vez, em sequência e em paralelo | ATENDIDO | `apps/api/src/operacao/segundo-fator.service.ts` (`entrar` numa transação a partir do `for update`); `operador.repository.ts:442-458` (`avancarPassoDoSegundoFator`, `usarCodigoDeRecuperacao` com `delete … returning`) | `apps/api/test/segundo-fator-operador.int.test.ts` (C12, C19, C20); `segundo-fator-operador-concorrencia.int.test.ts` (C6b, C18, C18b) | Prova de mutação 1 |
| RF4 — espera crescente por conta, sem colidir com a escola; e-mail inexistente igual a senha errada | ATENDIDO | `apps/api/src/operacao/entrada.service.ts:16` (prefixo `login-op`) e `:74-114`; `apps/api/src/sessao/contador-de-tentativas.ts` (prefixo por parâmetro) | `apps/api/test/entrada-operador.int.test.ts` (C22, C23, C24, C25); `contador-de-tentativas.test.ts` (U2) | Prova de mutação 3 |
| RF5 — até 8 h, 30 min sem uso; sessão encerrada dita como tal, sem confundir com "não encontrado" | ATENDIDO | `apps/api/src/operacao/prazos-da-sessao.ts:23-29`; `guarda-de-operador.ts:66-84` (401 `SESSAO_ENCERRADA` antes de `ACESSO_VENCIDO`, 503 com o banco fora); `apps/web/src/operacao/api/sessao.ts`, `inatividade.ts` | `apps/api/test/sessao-operador.int.test.ts` (C26 a C31); `operacao-isolamento.int.test.ts:283`; `e2e/operacao.spec.ts` (E2, E3) | |
| RF6 — credencial de uma área na outra responde igual a rota inexistente, nos dois sentidos | ATENDIDO | `apps/api/src/operacao/marcadores.ts` (`applyDecorators` com `UseGuards(GuardaDeOperador)`); `guarda-de-operador.ts:86-94` (qualquer recusa vira 404); `packages/nucleo/src/identidade/guarda-autenticacao.ts` (token e cookie de operador em rota de escola → 404) | `operacao-isolamento.int.test.ts:158-268` (C46 com a lista gerada das rotas registradas, as sete entradas e C47 com o token); `segundo-fator-operador.int.test.ts:376` (C47 com o cookie de verdade); `convite-operador.int.test.ts:398` (C21, o desafio); `operacao-isolamento.int.test.ts:382` (C48: a mutação "sem guarda" vive dentro do próprio teste e fica vermelha) | |
| RF7 — entrada, falha e saída em `AcessoOperacao` com IP e data; criar, desativar, MFA configurado e convite na `AuditoriaOperacao` com o autor | ATENDIDO | `operador.repository.ts:513-525`; `segundo-fator.service.ts` (a entrada e o `operador.mfa_configurado`); `sessao.service.ts` (`sair`); `ops/operador.ts:148-195` | `apps/api/test/registros-operador.int.test.ts` (C37, três casos) | Por decisão da spec (seção 5, da tarefa 6.0), `entrada_falha` não leva operador nem e-mail. O PRD pede "o operador certo" por evento, e a spec restringiu isso por privacidade, com registro |
| RF8 — o `apps/web` inteiro na pele da D72, sem cor que o Chrome 109 descarte, com o e2e do F1 verde | ATENDIDO | `apps/web/src/estilos.css` (`@theme` da 9.9); `apps/web/rebaixar-cor.ts` (o build falha com `oklch()` ou `color-mix()` fora de `@supports`); os 12 componentes e as telas do F1 | `apps/web/src/estilos.test.ts` (U3); `e2e/tokens.spec.ts:108` (os 33 tokens com o hex da 9.9 no CSS servido); `e2e/casca.spec.ts:286-296` (E5: sem `oklch(` nem `color-mix(`); e2e do F1 inteiro verde (176 casos) | |
| RF9 — telas do operador com os quatro estados, teclado, toque, `chromebook` e `celular`, com axe | ATENDIDO | `apps/web/src/operacao/` (rotas, casca com Sair, `Entrar`, `Mfa`, `Convite`, `ConfigurarMfa`) | `e2e/operacao-convite.spec.ts` (E1 e mais sete casos, `violacoesGraves` em cada tela, teclado em `:330`); `e2e/operacao.spec.ts` (E2 a E4, B2); `tools/ci/tamanho-web.test.ts` e `apps/web/nome-dos-chunks.test.ts` (B1, B2) | |

Provas de mutação (cada uma rodou só o teste que devia pegá-la, e depois `git checkout -- <arquivo>`):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF3 | `or(isNull(mfa_ultimo_passo), lt(mfa_ultimo_passo, passo))` trocado por `true` em `operador.repository.ts:446` | `segundo-fator-operador.int.test.ts` C19: os dois casos, em sequência e em paralelo |
| RF2 | `isNull(conviteOperador.usadoEm)` do `update` do aceite em `operador.repository.ts:368` | `convite-operador.int.test.ts` C10: `expected [200, 200] to deeply equal [200, 404]` |
| RF4 | prefixo `login-op` trocado por `login` em `entrada.service.ts:16` | `entrada-operador.int.test.ts` C24: `expected 429 to be 200` |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: o operador não é usuário de escola e não tem papel na matriz | cumprida | tabelas próprias, fora do `schema` do `criarBanco`; `permissao-no-boot.test.ts` e `conferencia-das-permissoes.ts` aceitam os marcadores; C49 (`operacao-isolamento.int.test.ts:391`): o contexto leva só `operadorId`, e um repository de escola falha |
| Regra: toda ação do operador tem autor rastreável | cumprida | C37, C4 |
| Regra: nenhuma senha passa pelo terminal | cumprida | `ops/operador.ts:224-271`: o token vai para um arquivo 0600 (C8), e o terminal mostra só ids |
| Regra: Sair a um clique, em toda tela (D59) | cumprida | `CascaDaOperacao.tsx`; `e2e/operacao.spec.ts` |
| Borda: o operador perde o app autenticador | coberta | C20 (código de recuperação); `convite-operador.int.test.ts:185` (o convite novo zera o segundo fator e os códigos) |
| Borda: operador que saiu da equipe, com a sessão aberta | coberta | C6 (`operacao-isolamento.int.test.ts:272`), C6b |
| Borda: convite aberto em duas abas | coberta | C10; `e2e/operacao-convite.spec.ts:240` e `:305` |
| Borda: a mesma pessoa é coordenadora e operadora | coberta | C24; o convite de coordenador e o de operador não se abrem um ao outro (`convite-operador.int.test.ts`, "permissão") |
| Borda: duas abas renovando | coberta | C30 (`sessao-operador.int.test.ts:184-234`) |
| Borda: banco fora na conferência | coberta | C31; `operacao-isolamento.int.test.ts:344` |
| Pronto: convite → senha → segundo fator → casca, em `chromebook` e `celular` (E1) | cumprido | `e2e/operacao-convite.spec.ts:95`, nos dois projetos; ressalva menor sobre o seed abaixo |
| Pronto: os dois sentidos iguais a rota inexistente, com a lista gerada (C46, C47), e nada escapa (C40–C44, C48) | cumprido | seção 1, RF6; `arquitetura.test.ts:301-497` |
| Pronto: `AcessoOperacao`, `AuditoriaOperacao` e expurgo nos prazos (C37, C38) | cumprido | `registros-operador.int.test.ts`; `apps/worker/test/expurgo-de-acesso.int.test.ts:424-455` |
| Pronto: as travas aguentam as corridas (C3, C5, C6b, C10, C12, C18, C18b, C19, C20, C30) | cumprido | cada uma tem teste; C10 e C19 passaram pela mutação |
| Pronto: a pele da D72, sem `oklch(`/`color-mix(`, e2e do F1 verde, e a escola não baixa a operação (U3, E5, B1, B2) | cumprido | seção 1, RF8 e RF9 |
| Pronto: os 62 cenários têm teste citado na tarefa | cumprido | cada id de C1 a C49, C6b, C18b, C36b, E1 a E4, U1 a U3, B1 e B2 aparece num teste; o E5 está em `casca.spec.ts:286` e `tokens.spec.ts`, sem o identificador no nome (menor) |
| Roadmap, "Pronto quando" da A0 | cumprido | os quatro itens acima |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ |
| `npm run test` | ✅ (166 arquivos, 1964 casos) |
| `npm run test:e2e` | ✅ (176 casos, nenhum marcado como intermitente) |
| `npm run test:infra` | ✅ (5 arquivos, 36 casos) |
| Esteira do GitHub no commit validado | ✅ run 35987772552 em `develop`, `headSha` = `3921eaa`: verificar, integração, e2e e infra verdes |
| Revisões com veto registradas e aprovadas | ✅ todo revisor obrigatório das 11 tarefas tem rodada, e a última rodada de cada revisor com veto é APROVADO |

### 4. Achados

**Críticos**
- Nenhum.

**Maiores**
- `docs/modelo-de-dados.md:292-295` (Regras transversais, item 1): diz que as exceções ao `escolaId` são "curtas e fixas" e lista só a BNCC, o banco público e `Conta`/`CodigoRecuperacao`. As seis tabelas da operação (`operador`, `codigo_recuperacao_operador`, `convite_operador`, `sessao_operador`, `acesso_operacao`, `auditoria_operacao`, migration `0014_operador.sql`) são uma exceção nova, e o documento também não as desenha. Hoje o documento de modelo de dados contradiz o código. Correção: acrescentar a exceção ao item 1 ("as tabelas da operação Turmma, da nossa equipe, só alcançadas pelo `OperadorRepository` e pelo expurgo, C45") e um bloco "Operação Turmma" com as seis tabelas, apontando a seção 3 da Tech Spec da A0, numa `/corrigir` só de doc.

**Menores**
- `tasks/prd-apresentacao-operacao/tasks.md:52-55`: a tarefa 9.0 está `[x]`, mas as subtarefas 9.1 a 9.3 continuam `[ ]`, e o código, o runbook (`docs/runbook.md:388`) e o C38 existem. Correção: marcar as subtarefas.
- `tasks/prd-apresentacao-operacao/revisao-spec.md`: a rodada 9 do `test-engineer` (conferência do mapa de tarefas, C33 dividido entre a 5.0 e a 6.0) terminou REPROVADO e não tem rodada APROVADO depois. O conteúdo foi atendido: a `6_task.md` e o `tasks.md:34` levam o C33 da parte do e-mail. Correção: na próxima vez, rodar a conferência de novo até aprovar, para o registro fechar.
- `e2e/__fixtures__/operacao.ts:70-92`: o E1 semeia o operador e o convite por SQL e repete o hash do token, e não usa o `gerarConviteDeOperador` do `ops:operador` que o critério de pronto cita. A cadeia comando → aceite está provada na integração (`convite-operador.int.test.ts:125`), mas uma mudança no hash do comando não quebraria o e2e. Correção: o seed do e2e chamar o `gerarConviteDeOperador` ou o `hashDoTokenDeConvite`.
- O E5 não leva o identificador no nome do teste (`e2e/casca.spec.ts:286`, `e2e/tokens.spec.ts:108`). Correção: citar "E5" no título.
- PRD, seção 9: a métrica "do convite ao primeiro login com segundo fator em até 3 minutos" não é medida em lugar nenhum. Como não é RF, fica para a A0b ou para o `/retro`.
- Recomendações de revisor sem destino (resumidas em `achados/indice.md`), para não se perderem:
  - 3.0 (`tenancy-guardian`, `test-engineer`): nos cinco `ops:*` de escola, o `conferirOperador` roda fora da transação e sem a trava `7_000_002` (`apps/api/src/ops/comando.ts:53`)
  - 4.0 (`revisor-geral`): o formato do apelido existe em três lugares (`FORMATO_OPERADOR`, o check da migration e o do auditoria)
  - 5.0 (`tenancy-guardian`, `revisor-geral`): `throw new Error(...)` sem código em `operador.repository.ts:381` (regra 00, item 9); (`privacy-guardian`) auditar o aceite, que troca a senha e zera o segundo fator
  - 6.0 (`test-engineer`): nenhum teste prova que a senha certa zera o contador (`entrada.service.ts`, `contador.zerar`)
  - 7.0 (`test-engineer`): o log espaçado `operacao.desafio_sem_redis` não tem teste; (`revisor-geral`) o `contador.zerar` roda depois do commit da sessão
  - 8.0 (`test-engineer`): renovar e sair ao mesmo tempo sem teste; (`privacy-guardian`) nenhum teste confere o conteúdo da linha `operacao.reuso_de_refresh`; (`infra-guardian`) o `rl:ip` é um balde só para todas as rotas anônimas
  - 9.0 (`infra-guardian`): o lote `convite_operador` do expurgo não tem `order by`; (`revisor-geral`) o `{} as Record<…>` em `apps/worker/src/processadores/expurgar-acesso.ts:53`
  - 10.0 e 11.0 (`frontend-reviewer`, `privacy-guardian`): a fronteira de erro sem `document.title`; limpar a senha no estado depois de falha; e o aceite em andamento durante um `hashchange`

**Positivos**
- A comparação "igual a rota inexistente" é feita sobre a lista de rotas que a aplicação montada registrou (`DiscoveryService`), e não sobre uma lista escrita à mão. Rota nova entra no teste sozinha.
- O C48 leva a mutação dentro do próprio teste (um controller com marcador e sem guarda), e por isso a efetividade da cerca é provada em toda execução, não só numa validação.
- Toda divergência da Tech Spec que surgiu na execução voltou para ela como nota "Da tarefa N.0", e nenhuma decisão ficou só no código.
- Os checks do banco fazem valer as invariantes de privacidade por construção: o operador desativado sem dado pessoal, `entrada_falha` sem operador e `bootstrap` reservado.

### 5. Conclusão

Todos os RF estão ATENDIDOS, cada parte do critério de aceite tem código e teste, e as três provas de mutação nos RF de maior risco (uso único do código, aceite único do convite, contador separado da escola) deixaram o teste certo vermelho. O critério de pronto do `tasks.md` e o "Pronto quando" do roadmap estão cumpridos. O portão local está verde, inclusive o e2e e o infra, e a esteira do commit validado está verde nos quatro jobs. Não há achado crítico.

O veredito não é APROVADA por um achado maior: o `docs/modelo-de-dados.md` ainda declara uma lista fechada de exceções ao `escolaId` que não inclui as tabelas da operação. O caminho até APROVADA é um `/corrigir` só de documentação, que acrescente a exceção e o desenho das seis tabelas. Esse achado não bloqueia a A0b.

### 6. Pendências herdadas

- A borda restringe `/operacao` e `/v1/operacao/*` antes do staging (PRD, pergunta 1): registrado em `tasks/prd-fundacao-tecnica/notas-staging.md:68`, decide com a D42.
- `BroadcastChannel`, `details` e `saidaConfirmada` (Tech Spec, seção 13): vão para a A1.
- A métrica do tempo do convite ao primeiro login: A0b ou `/retro`.
- As recomendações de revisor listadas em "Menores": `/retro` da A0, que decide o que vira regra ou tarefa. A conferência do `OPERADOR` sob trava nos `ops:*` de escola cabe na A0b, que mexe nesses comandos.

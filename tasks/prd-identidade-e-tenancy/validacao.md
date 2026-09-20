# Validação — identidade-e-tenancy (F1)

## Rodada 1 — 20/09/2026

**Escopo:** funcionalidade completa (tarefas 1.0 a 20.0)
**Commit validado:** `6f6975429265e203b16cc116dbdd457f410b265c`
**Veredito: REPROVADA**

Um crítico: **RF16 está parcial**. A metade do professor está implementada e bem testada; a
metade "o aluno lê o próprio histórico" não tem código, não tem rota, e o teste de integração
que existe prova o contrário (o aluno recebe 404). A decisão de empurrar isso para o F9 foi
tomada dentro da 10.0 e não voltou para o PRD nem para a Tech Spec.

Tudo o mais está em ordem, e em bom estado: portão inteiro verde aqui, esteira verde no commit
exato, e as três provas de mutação que rodei ficaram vermelhas onde deveriam.

---

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `apps/api/src/ops/escola.ts:84-162`, `apps/api/src/ops/comando.ts:34` (`lerOperador`), `apps/api/src/sessao/convite.service.ts:149` | `apps/api/test/ops-escola.int.test.ts:208` ("lista as rotas registradas no Nest e nenhuma de escrita fala de rede ou escola"), `:51`, `:92`, `:119`; `apps/api/test/convite.int.test.ts:281` (arquivo 0600, terminal sem token/nome/e-mail), `:535` | A varredura de rotas é o que prova "nenhuma rota cria escola", e ela enumera o roteador do Nest, não uma lista à mão |
| RF2 | ATENDIDO | `packages/shared/src/estrutura/serie.ts:5-25`, `packages/nucleo/src/db/schema/serie.ts:29` (check `serie_no_recorte`), `apps/api/src/estrutura/turma.service.ts:48`, `packages/nucleo/src/db/schema/turma.ts:20-41` | `apps/api/test/estrutura.int.test.ts:111` ("5º ano" e "4º do EM" dão ENTRADA_INVALIDA, e o banco recusa os dois mesmo por fora da rota), `:228`, `:296`, `:313`, `:332` | Duas camadas: zod na entrada e check no banco, e o teste exercita as duas |
| RF3 | ATENDIDO | `apps/api/src/estrutura/vinculo.service.ts:75-93`, `packages/nucleo/src/db/schema/vinculo.ts:41` (default `pendente`), `packages/shared/src/permissao/matriz.ts:105` (professor `vinculo.criar: 'nunca'`) | `apps/api/test/vinculo.int.test.ts:76` (nasce `pendente`, `decidido_em: null`), `:357` ("professor não cria, não lista e não encerra vínculo"), `:281` | |
| RF4 | ATENDIDO | `apps/api/src/estrutura/vinculo.service.ts:107-151`, `apps/api/src/estrutura/vinculo.repository.ts:122-146`, `packages/nucleo/src/db/schema/vinculo.ts:70-72` (checks de código e complemento) | `apps/api/test/vinculo.int.test.ts:76` (confirma uma e contesta a outra, com autor e data), `:165`, `:196`, `:236`, `:382`, `:399`; e2e `e2e/escola-e-vinculos.spec.ts:266`, `:312`, `:342` | |
| RF5 | ATENDIDO | `apps/api/src/estrutura/turma.repository.ts:83-131` (`aberta`, `#comVinculoDoProfessor`), `:152` (`alunos`) | `apps/api/test/turma-acesso.int.test.ts:59` (pendente e contestado dão 404), `:90` (encerrado corta na requisição seguinte, mesmo token e mesma sessão), `:107`, `:120`, `:140` | Prova de mutação 2, abaixo |
| RF6 | ATENDIDO | `apps/api/src/sessao/login-email.controller.ts:20`, `apps/api/src/sessao/hash-de-senha.ts:15-45` (hash fixo para inexistente), `apps/api/src/sessao/senha/conferencia-na-vez.ts:48-82` | `apps/api/test/login-email.int.test.ts:178` (senha errada, e-mail inexistente, conta sem senha e desativado respondem igual, com um hash cada), `:223` (o bloqueio também não revela a conta); e2e `e2e/entrar.spec.ts:406` | A igualdade de tempo vem do hash fixo sempre rodado, não de medição em teste — é o desenho certo, e o teste conta os hashes |
| RF7 | ATENDIDO | `apps/api/src/sessao/acesso-da-escola.controller.ts:15`, `apps/api/src/sessao/matricula.service.ts:47` (`identificadorDoAluno`, chave `escolaId\|matricula`), schema `credencial_matricula` unique `(E, matricula)` | `apps/api/test/sessao-matricula.int.test.ts:172` (matrícula 1234 em A e em B, cada um só no slug da própria), `:375` (aluno transferido); e2e `e2e/entrar-na-escola.spec.ts:123` | |
| RF8 | ATENDIDO | `apps/api/src/sessao/externa/externa.service.ts:148-152` (`hd`/`tid` contra a lista da escola, tenant pessoal recusado), `apps/api/src/sessao/externa/conta-externa.repository.ts:5-9` (chave sem e-mail), `provedor-externo.port.ts:16-32` | `apps/api/test/sessao-externa.int.test.ts:219` (conta pessoal, hd de outra escola, tenant pessoal e não cadastrado — mesma recusa), `:368` (nem log nem tabela têm e-mail, nome ou foto), `:208`, `:413` | Prova de mutação 3, abaixo |
| RF9 | ATENDIDO | `apps/api/src/sessao/externa/externa.service.ts:156-169`, `:176-186` (`#ligar`), `conta-externa.repository.ts:83-111`; unique `(E, usuario_id)` em `conta_externa` | `apps/api/test/sessao-externa.int.test.ts:178` (primeira entrada liga, segunda entra pela ligação), `:303` (mesmo e-mail com outro sujeito é recusado), `:339` e `:354` (as duas corridas) | A orientação "procurar a coordenação" é a mensagem única de falha do provedor na tela (`e2e/entrar-na-escola.spec.ts:255`); não há e2e com a persona do professor nesse caso |
| RF10 | ATENDIDO | `apps/api/src/sessao/externa/externa.service.ts:160` (só professor é ligado pelo e-mail) | `apps/api/test/sessao-externa.int.test.ts:281` (aluna com domínio válido e sem ligação: nenhuma linha nova em `usuario`, `conta_externa` nem `sessao`); e2e `e2e/entrar-na-escola.spec.ts:238` | |
| RF11 | ATENDIDO | `apps/api/src/sessao/contador-de-tentativas.ts:7-9`, `:130-187` (chave por conta, HMAC, nunca IP), `apps/api/src/sessao/senha/rebaixamento.ts` (o IP só rebaixa a vez na fila, nunca recusa) | `apps/api/test/sessao-matricula.int.test.ts:293` (400 alunos do mesmo IP entram; o Enzo, com 10 erros, fica segurado), `:194`; `apps/api/test/login-email.int.test.ts:312` (35 professores do mesmo IP) | O freio efetivo é na 5ª falha, mais apertado que os 10 do texto do PRD — mais protetor, não menos |
| RF12 | ATENDIDO | `apps/api/src/sessao/mfa.service.ts:54-110`, `apps/api/src/sessao/segundo-fator.ts:9-63`, `apps/api/src/sessao/login.service.ts:148` (`etapaDoLogin` → `configurar_mfa`) | `apps/api/test/mfa.int.test.ts:282` (sem MFA só alcança a configuração), `:378` (recuperação de uso único, inclusive em paralelo), `:395`; e2e `e2e/mfa.spec.ts:45` (bloco "sem celular"), `:116`, `:146` | Chave de acesso não existe; ver menor 3 |
| RF13 | ATENDIDO | `packages/nucleo/src/identidade/avaliar-sessao.ts:9-35`, `packages/nucleo/src/db/schema/escola.ts:32` (padrão 30, por escola), `apps/api/src/sessao/cookies.ts:14-37` (cookie sem `Max-Age`), `apps/web/src/componentes/Cabecalho.tsx:13-63` ("Sair" em toda tela) | `apps/api/test/inatividade.int.test.ts:30`, `:60` (Chromebook do carrinho), `:80`; `apps/api/test/sessao-matricula.int.test.ts:420` (inatividade por escola); e2e `e2e/inatividade.spec.ts:56`, `:258`, `e2e/entrar.spec.ts:324` | A restauração de sessão do Chrome sobrevive ao cookie; está declarada na Tech Spec, seção 12, com a inatividade no servidor como garantia |
| RF14 | ATENDIDO | `apps/api/src/sessao/troca-de-escola.service.ts:38-80`, `apps/api/src/sessao/eu.repository.ts:20`, `apps/api/src/sessao/resolucao-de-tenant.repository.ts:119`, `:133` | `apps/api/test/troca-de-escola.int.test.ts:211`, `:281`, `:298` (depois da troca, a turma de A dá 404), `:320`, `:665`; e2e `e2e/escola-e-vinculos.spec.ts:123`, `:185` | |
| RF15 | ATENDIDO | `packages/nucleo/src/identidade/guarda-sessao.ts:37-62`, `packages/nucleo/src/contexto/escola-do-contexto.ts:8`, `packages/nucleo/src/contexto/ano-em-curso.ts:10`, repositories de `apps/api/src/estrutura/*` | `apps/api/test/contexto.int.test.ts:147` (`x-escola-id` e `?escolaId=` de B são ignorados), `:181`; `apps/api/test/turma-acesso.int.test.ts:225-423` (bloco de isolamento), `:318` (o escopo de escola vale sozinho), `:374` (FKs compostas como segunda camada); `apps/api/test/estrutura-isolamento.int.test.ts:74`, `:93`, `:123`; `packages/nucleo/src/auditoria/auditoria.int.test.ts:50` | Prova de mutação 1, abaixo |
| RF16 | **PARCIAL** | Professor e coordenação: `apps/api/src/estrutura/turma.repository.ts:74-144` (`#doAnoDaLeitura`, `#confirmadoAteOFimDoAno`). **Aluno: sem código** — nenhuma rota, e `MATRIZ.aluno` tem `turma.ler`, `vinculo.ler_proprios` e `aluno_da_turma.ler` em `nunca` (`packages/shared/src/permissao/matriz.ts:109-123`) | `apps/api/test/historico.int.test.ts:129`, `:142` (só leitura), `:179`, `:190`, `:262`. Para o aluno, `:204` prova a **recusa**, não a leitura | Crítico 1 |
| RF17 | ATENDIDO | `packages/shared/src/permissao/matriz.ts:32-136` (`RECURSOS`, `MATRIZ`, `alcanceDe`), `matriz.expectativa.ts`, `packages/nucleo/src/permissao/conferencia-das-permissoes.ts:47` | `packages/shared/src/permissao/matriz.test.ts:15` (célula a célula contra a expectativa escrita à mão, nos dois sentidos), `:26` (a comparação pega uma célula trocada), `:41` (indicador de professor), `:34` (a rede nunca tem alcance individual); `apps/api/test/permissao-no-boot.test.ts:51` (rota sem `@Permite` derruba o boot) | Não é um `it` por célula, é uma comparação total contra uma cópia manual, com teste que prova que a comparação pega a troca. Cumpre o que o RF pede |
| RF18 | ATENDIDO | Contratos `esquemaResposta*` em `packages/shared`, todos `.strict()`, e os controllers e services fazem `.parse()` na saída (`apps/api/src/sessao/eu.service.ts:22`, `apps/api/src/estrutura/*.service.ts`, `apps/api/src/sessao/*.controller.ts`) | `apps/api/test/contratos.test.ts:98` (varre todo `esquemaResposta*` exportado, em qualquer profundidade), `:102` (a exceção do segredo só vale no contrato do configurar), `:107` (reprova a fixture com `senhaHash`, `mfaSegredo`, `sujeitoExterno`, `refreshToken`, `Cookie`), `:126`; `apps/api/test/troca-de-escola.int.test.ts:665` | A varredura acha contrato novo sozinho, e a exceção nominal é única e declarada |
| RF19 | ATENDIDO | `packages/nucleo/src/auditoria/acoes.ts:43-260` (mapa fechado de 21 ações), `registro-de-auditoria.ts:33-38` (porta única), chamadas em `apps/api/src/ops/escola.ts:88`, `:105`, `apps/api/src/estrutura/vinculo.service.ts:88`, `:122`, `:141`, `apps/api/src/sessao/redefinicao-de-mfa.ts:38`, `:43`, `apps/api/src/sessao/externa/externa.service.ts:182` | `packages/nucleo/src/auditoria/auditoria.int.test.ts:84`, `:111`; `packages/nucleo/src/auditoria/acoes.test.ts` (schema fechado, campo pessoal recusado); conferência por consulta à tabela em `vinculo.int.test.ts:196`, `:257`, `mfa.int.test.ts:462`, `historico.int.test.ts:105` | "Mudança de papel" não tem ação porque não há caminho de mudar papel no F1; ver menor 4 |
| RF20 | ATENDIDO | `playwright.config.ts:24-56` (projetos `chromebook` e `celular`, sem filtro por projeto), telas em `apps/web/src/paginas/*`, estados em `apps/web/src/componentes/estado/*` | `e2e/entrar.spec.ts:67`, `:90`, `:214`; `e2e/entrar-na-escola.spec.ts:64`, `:101`, `:143`, `:213`; `e2e/mfa.spec.ts:46`, `:146`; `e2e/convite.spec.ts:20`; `e2e/escola-e-vinculos.spec.ts:92`, `:312`, `:388` (os quatro estados, explícito). 132 casos verdes nos dois projetos | |
| RF21 | ATENDIDO | `infra/k6/login-7h30.js` (p95 1 s, 2.100 contas, 840 no 1º minuto, `respostas_429 == 0` como threshold), `infra/scripts/carga-login.ts:320-330` (hash real calibrado), `infra/scripts/conferir-carga-login.ts` | Resultado registrado em `16_task.md:128-170`: p95 do login 40 ms (máx. 202 ms), zero 429 legítimo, e o **controle negativo reprovou** (saída 0 com `LOGIN_PROTECAO_DESLIGADA`, p95 entre 2,15 e 2,19 s) | O cenário não roda na esteira; o critério é o threshold do k6 com execução registrada. É o desenho previsto na Tech Spec 7c |

**Contagem:** 20 atendidos, 1 parcial, 0 não atendidos, 0 não verificáveis.

Provas de mutação (três, todas restauradas com `git checkout --`; árvore limpa ao fim):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF15 | `eq(turma.escolaId, exigirEscolaDoContexto())` de `TurmaRepository.aberta` (`apps/api/src/estrutura/turma.repository.ts:90`) | `apps/api/test/turma-acesso.int.test.ts:318` — "o escopo de escola vale sozinho: com o ano e o usuário de B num contexto de A, nenhum repository alcança B" (1 de 14 vermelho; os testes por rota seguiram verdes porque a FK composta e o ano são a segunda camada, que é exatamente o que o teste isola) |
| RF5 | `eq(vinculo.estado, 'confirmado')` de `#comVinculoDoProfessor` (`turma.repository.ts:127`) | 4 de 14 vermelhos em `apps/api/test/turma-acesso.int.test.ts` (pendente/contestado abrindo a turma, entre outros) |
| RF8 | `await repositorio.dominioLiberado(...)` de `#decidir` (`apps/api/src/sessao/externa/externa.service.ts:150`) | 3 de 21 vermelhos em `apps/api/test/sessao-externa.int.test.ts` (conta pessoal e domínio de outra escola entrando; a escola que revoga o domínio seguindo a entrar) |

---

### 2. Regras de negócio, casos de borda e critério de pronto

**Regras de negócio do PRD (seção 6)**

| Item | Situação | Evidência |
|---|---|---|
| Escola é o tenant e ano letivo a segunda dimensão; escopo do token | cumprida | `guarda-sessao.ts:37-62`; `contexto.int.test.ts:147`; mutação 1 |
| Matrícula única por escola, nunca globalmente | cumprida | unique `(E, matricula)` em `credencial_matricula`; `sessao-matricula.int.test.ts:172` |
| Vínculo definido pela escola e só confirmado pelo professor | cumprida | `matriz.test.ts:57`; `vinculo.int.test.ts:357` |
| Aluno sem e-mail, telefone nem foto; da conta externa, só o identificador | cumprida | `sessao-externa.int.test.ts:368`; `contratos.test.ts:126` |
| "Não encontrado" e "sem permissão" respondem igual | cumprida | `turma-acesso.int.test.ts:175`, `:285`; `vinculo.int.test.ts:382` |
| Sem cadastro público, e o operador não lê dado de pessoa | cumprida | `ops-escola.int.test.ts:208`; `convite.int.test.ts:281` |
| Nenhum fluxo exige celular | cumprida | `e2e/mfa.spec.ts:45` (segredo em texto + copiar, QR como conveniência) |
| Fim de vínculo desativa o acesso | cumprida | `turma-acesso.int.test.ts:90` |

**Casos de borda do PRD (seção 7)**

| Item | Situação | Evidência |
|---|---|---|
| Professor discorda de uma alocação | coberta | `vinculo.int.test.ts:76`; `e2e/escola-e-vinculos.spec.ts:266` |
| Turma sem professor alocado | coberta | `turma-acesso.int.test.ts:175` |
| Professor com duas disciplinas na mesma turma | coberta | `vinculo.int.test.ts:76`; `turma-acesso.int.test.ts:140` |
| Professor sai em março de uma das duas escolas | coberta | `turma-acesso.int.test.ts:406` |
| Aluno transferido de escola | coberta | `sessao-matricula.int.test.ts:375`; `turma-acesso.int.test.ts:120` |
| Virada de ano letivo | coberta | `virada-do-ano.int.test.ts`; `historico.int.test.ts:129`, `:142` |
| Chromebook do carrinho entre duas turmas | coberta | `inatividade.int.test.ts:60`; `e2e/entrar.spec.ts:324` |
| Admin não liberou o app no Google para menores | coberta | `sessao-externa.int.test.ts:462`; `e2e/entrar-na-escola.spec.ts:255` |
| E-mail de professor recriado para outra pessoa | coberta | `sessao-externa.int.test.ts:303`, `:354` |
| Escola com dois domínios Google | coberta | `sessao-externa.int.test.ts:323` |
| Único coordenador perde app e códigos | coberta | `apps/api/src/ops/redefinir-mfa.ts`; `mfa.int.test.ts:462`; `ops/redefinir-mfa.test.ts` |
| Escola revoga o app no meio do ano | coberta | `sessao-externa.int.test.ts:259` |

**Critério de pronto (tasks.md e ROADMAP.md)**

| Item | Situação | Evidência |
|---|---|---|
| Os 21 RF têm código e teste que falharia sem a regra | **faltando** | RF16, metade do aluno (crítico 1) |
| Testes de isolamento da Tech Spec seção 6 verdes, e cada um quebra sem a cláusula de escola | cumprido | suíte verde + mutação 1 |
| Nenhum caminho de login recusa um aluno por causa de outro no mesmo IP; `login-7h30` passa | cumprido | `sessao-matricula.int.test.ts:293`; `16_task.md:128-170` |
| Nenhum e-mail, nome, foto ou claim de aluno no banco nem no log | cumprido | `sessao-externa.int.test.ts:368` |
| O token sintético não existe mais, e os testes e o cenário do F0 continuam verdes | cumprido | `validar-config.test.ts:41`; `contexto.int.test.ts:218`; suíte verde |
| `docs/lgpd.md` com todas as linhas dos campos novos | cumprido | `docs/lgpd.md:51` (hash), `:53` (MFA e recuperação), `:55` (contador), `:58-59` (vínculo, estado, motivo), `:39`, `:60`, `:62` |
| `docs/runbook.md` com uma entrada por alerta novo | cumprido | `docs/runbook.md:203`, `:157`, `:285`, `:244`, `:333`, `:78`; guarda em `tools/guardas/alerta-tem-runbook.test.ts` |
| Portão inteiro verde e esteira verde no commit final | cumprido | seção 3 |
| Roadmap: "A não lê, não escreve e não descobre nada da B; professor nas duas não leva dado de uma para a outra" | cumprido | `turma-acesso.int.test.ts:225-423`; `troca-de-escola.int.test.ts:298`; `e2e/escola-e-vinculos.spec.ts:123`, `:185` |

---

### 3. Portão

Não foi preciso `npm ci`: o `node_modules` está na mesma data do `package-lock.json`.
Tudo rodado com a árvore limpa, no commit `6f69754`.

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ (ESLint + guardas) |
| `npm run test` | ✅ 146 arquivos, 1.672 casos |
| `npm run test:e2e` | ✅ 132 casos, `chromebook` e `celular` |
| `npm run test:infra` | ✅ 5 arquivos, 35 casos |
| Esteira do GitHub no commit validado | ✅ execução 35501826855, `headSha` `6f69754…`, as quatro tarefas (verificar, integração, e2e, infra) `success` |
| Revisões com veto registradas e aprovadas | ✅ com uma ressalva de rastro (menor 5) |

Nenhum `.skip`, `.todo` ou teste comentado no repositório.

---

### 4. Achados

**Críticos**

1. `tasks/prd-identidade-e-tenancy/prd.md:74` (RF16) · `packages/shared/src/permissao/matriz.ts:109-123` — **"o aluno lê o próprio histórico" não foi implementado por nenhuma tarefa.** Não existe rota que devolva ao aluno as turmas dele de anos encerrados, nem os vínculos dele: na `MATRIZ`, o aluno tem `turma.ler`, `turma.listar`, `aluno_da_turma.ler` e `vinculo.ler_proprios` todos em `nunca`, e `GET /v1/eu` só devolve a escola e o papel de agora. O único teste que toca o caso prova a recusa: `apps/api/test/historico.int.test.ts:204` ("...o aluno com `?anoLetivoId` é recusado"). A decisão de adiar está registrada só dentro da tarefa — `tasks/prd-identidade-e-tenancy/10_task.md:99`, "Histórico do aluno sobre o próprio ano anterior além de `/v1/eu`: F9" — e não voltou nem para a seção 3 do PRD ("Fora de escopo"), nem para a Tech Spec, cuja seção 5 ("Histórico", `techspec.md:267-269`) só fala de coordenação e professor. O PRD também declara isso na tabela de papéis (`prd.md:44`: o aluno pode "ver a si e o próprio histórico").
   **Correção:** decidir e registrar. Ou (a) implementar a leitura própria do aluno no F1 — célula na `MATRIZ`, rota, DTO e teste que quebre sem a cláusula de `usuario_id` do contexto; ou (b) aceitar o adiamento, e então mover a cláusula do RF16 para a seção 3 do PRD com o destino (F9), anotar a Tech Spec na seção 5, e registrar a pendência no `ROADMAP.md` do F9. O caminho (b) é defensável: no F1 o "histórico" do aluno seria só a lista de turmas passadas, sem nota nem entrega, e o valor real aparece com o F9. Mas precisa estar escrito onde a próxima pessoa lê, não dentro de uma tarefa de dez dias atrás.

**Maiores**

1. `docs/modelo-de-dados.md:20-47` — **o documento de modelo de dados contradiz o que foi construído.** `Usuario` ainda aparece como entidade única por escola com `email?`, `matricula?`, `senhaHash?`, `contaExternaId?` e `mfa?` embutidos (`:20-21`), quando o F1 implementou `conta` global + `usuario` por escola + `credencial_matricula` + `conta_externa` como tabelas separadas. `Vinculo` (`:22-23`) não tem `estado`, `contestacao`, `complemento` nem `motivo_encerramento`, que são o coração dos RF3, RF4 e RF5. Não existem `Sessao`, `RegistroAcesso`, `CodigoRecuperacao` nem `ProvedorEscola`. E `:45-47` ainda pergunta "usuário por escola ligado a uma identidade de login, ou identidade global com vínculos por escola? é decisão da Tech Spec do F1" — decisão já tomada e implementada. `Convite` (`:25-26`) descreve `tipo (professor | sala)`, e o implementado só aceita `coordenador`.
   **Correção:** atualizar `docs/modelo-de-dados.md` com o modelo da Tech Spec seção 3, marcando o que ainda é F2 (`ListaNome`, `Reivindicacao`, convite de professor e de sala) como futuro, e não como presente. É o documento que a próxima Tech Spec vai ler.

2. `tasks/prd-identidade-e-tenancy/techspec.md:131-157` e `:425-427` — **a Tech Spec ficou para trás do código em dois pontos, com a divergência registrada só na tarefa 20.0.** (a) A tabela da seção 4 ainda diz que `POST /v1/sessao/email` responde `{ etapa, desafio? }`, mas a etapa `escolher` passou a levar também `acessos` (`20_task.md:101-106`, sem o que a tela `/escolher-escola` não funcionaria, RF14). (b) A seção 9 ainda nomeia `queryClient.clear()` na troca de escola, e a 20.0 implementou outro caminho — o próprio `revisor-geral` apontou isso na 4ª rodada (`achados-revisoes.md:5218`). A divergência 2 da 20.0 (o seletor não leva ao endereço da outra escola) também está só na tarefa.
   **Correção:** levar as três para a Tech Spec, como as decisões da 10.0, da 13.0 e da 17.0 já foram levadas. A Tech Spec é o que o `/criar-techspec` do F2 vai ler para não repetir a discussão.

**Menores**

1. `apps/web/src/sessao/inatividade.ts:19` — recomendação do `revisor-geral` (4ª rodada da 20.0) sem destino: o `BroadcastChannel` é por origem, não por sessão, então duas abas com pessoas diferentes adiam o vencimento uma da outra. Amarrar o nome do canal ao `usuarioId` de `quemEstaNaSessao()` fecha. Destino sugerido: `TODO.md` ou a primeira tarefa do F2 que mexer na web.
2. `apps/web/src/componentes/SeletorDeEscola.tsx:73` — recomendação do `revisor-geral` sem destino: o `details` fica aberto depois da troca, listando a escola de onde a pessoa veio. Não vaza dado (o nome da escola é dela mesma), mas contradiz o "tudo abaixo é da escola ativa" do RF14 na leitura da tela.
3. `tasks/prd-identidade-e-tenancy/prd.md:66` e `:137` — a "chave de acesso é opcional" do RF12 não existe, e a pergunta em aberto "Chave de acesso (passkey) no F1 ou depois?" foi respondida só dentro das tarefas (`6_task.md:130` e `19_task.md:109`: "depois do F1"). A Tech Spec não menciona passkey em lugar nenhum. O RF12 está atendido no que importa (TOTP + códigos de recuperação, sem celular), e "opcional" é literalmente opcional — mas a resposta à pergunta em aberto precisa sair da tarefa e entrar no PRD ou numa decisão.
4. `packages/nucleo/src/auditoria/acoes.ts:43-260` — o RF19 pede auditoria de "mudança de papel", e não existe ação para isso. Não é falta: não há caminho no F1 que mude o papel de um usuário (nenhuma rota, nenhum comando). Fica como lembrete para a tarefa do F2 ou do F3 que criar esse caminho — ela nasce devendo a ação de auditoria.
5. `tasks/prd-identidade-e-tenancy/13_task.md:4` — o `domain-researcher` é subagente obrigatório da 13.0 e não tem rodada na seção "Revisões" da tarefa. Ele de fato rodou: a Tech Spec, seção 12, registra o resultado datado de 18/09/2026 (três premissas confirmadas ✅ e uma ainda ⚠️), e o checklist da tarefa (`13_task.md:122`) está marcado. O hook `tools/processo/revisoes.ts` só registra revisor com veredito, e o `domain-researcher` não dá veredito. Não é revisor sem rodada; é rastro que fica fora da tabela. Correção sugerida: ou o hook passa a registrar também o pesquisador, ou a tabela de subagentes do `tasks.md` separa "revisores" de "pesquisa".
6. `tasks/prd-identidade-e-tenancy/1_task.md` — a 1.0 não tem rodada de `revisor-geral`. É consistente com o processo da época: a 1.0 foi commitada em 15/09/2026 às 12:24, e o `revisor-geral` nasceu no commit `7dfbd81` (D53) às 19:31 do mesmo dia. Registrado só para que a leitura da tabela não pareça uma falha.

**Positivos**

- O par `matriz.ts` + `matriz.expectativa.ts`, com um teste que prova que a comparação pega uma célula trocada, é a forma mais barata de fazer uma matriz de permissão não apodrecer. Vale repetir em toda matriz futura.
- `apps/api/test/contratos.test.ts` varre os contratos por reflexão em vez de listá-los: contrato novo entra na varredura sozinho, e a exceção é nominal e única. Esse é o desenho certo para o RF de DTO de saída de toda funcionalidade.
- Cada teste de varredura tem um caso que prova que a varredura enxerga o código (`arquitetura.test.ts:45`, `contratos.test.ts:88`). É o antídoto para o teste que passa porque não achou nada.
- `10_task.md:105-138` ("Notas da implementação", com as mutações conferidas à mão listadas uma a uma) é o melhor registro de tarefa do repositório até aqui. A seção "Divergências resolvidas nesta tarefa" da 20.0 também — só falta ela subir para a Tech Spec.
- A `ResolucaoDeTenantRepository` concentrar os 25 `@SemEscopo`, com um teste de arquitetura que prova que só o módulo `sessao` a importa, transforma um desvio da regra 10 numa fronteira auditável em vez de num furo espalhado.

---

### 5. Conclusão

O F1 está, no essencial, construído e provado: 20 dos 21 RF atendidos com teste que falharia
sem a regra, isolamento verificado por mutação em três frentes de risco, portão inteiro verde
aqui e esteira verde no commit exato. A qualidade dos testes é acima da média do que a regra 40
exige — eles provam regra, não status.

O que reprova é uma coisa só e é do tipo que esta validação existe para achar: um pedaço de RF
que nenhuma tarefa cobriu, adiado numa nota dentro de uma tarefa, sem voltar para o PRD nem para
a Tech Spec. Quem ler o PRD do F1 hoje vai acreditar que o aluno lê o próprio histórico, e ele
não lê.

**Caminho até a aprovação**, por `/corrigir` ou por uma tarefa curta:

1. Decidir o crítico 1 — implementar a leitura própria do aluno, ou registrar o adiamento no PRD
   (seção 3), na Tech Spec (seção 5) e no `ROADMAP.md` do F9.
2. Atualizar `docs/modelo-de-dados.md` (maior 1).
3. Levar as três divergências da 18.0 e da 20.0 para a Tech Spec (maior 2).
4. Revalidar. Os menores não bloqueiam.

Se a decisão do passo 1 for adiar, os passos 1 a 3 são só escrita: não mexem em código, não
mexem no portão, e a revalidação é rápida.

---

### 6. Pendências herdadas

| Pendência | Destino |
|---|---|
| Histórico próprio do aluno (crítico 1, se a decisão for adiar) | F9, com a linha no `ROADMAP.md` e no PRD do F1 |
| `BroadcastChannel` por sessão e `details` do seletor (menores 1 e 2) | `TODO.md` ou a primeira tarefa de web do F2 |
| Passkey (menor 3) | `/registrar-decisao`, ou a pergunta em aberto do PRD do F2 |
| Auditoria de mudança de papel (menor 4) | a tarefa do F2/F3 que criar o caminho de mudar papel |
| Rastro do `domain-researcher` na tabela de revisões (menor 5) | `/retro` do F1 |
| Alerta para `login.externo{resultado="provedor"}` em massa, e claim `xms_edov` da Microsoft | já em `TODO.md` (revisão da 13.0) |
| Alerta para rotina do sistema que parou (`sistema.expurgar-acesso`) | já em `TODO.md`, antes da primeira escola real |
| `VALIDATE` das FKs `NOT VALID` das tabelas do F0 | já em `TODO.md`, migration de deploy fora do horário letivo |
| Controle negativo do `npm run carga` do F0 que parou de reprovar | já em `TODO.md`; não afeta o `login-7h30` do F1, cujo controle negativo reprovou em 19/09/2026 |
| Calibração do argon2 medida nesta máquina, não no staging | Tech Spec seção 12; recalibrar pelo mesmo cenário quando o staging existir (D42) |

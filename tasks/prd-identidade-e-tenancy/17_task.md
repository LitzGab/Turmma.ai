# Tarefa 17.0 — Ciclo de vida da conta e expurgo

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 5.0, 9.0, 11.0
**Subagentes obrigatórios:** `privacy-guardian`, `tenancy-guardian`, `infra-guardian`, `test-engineer`

## Objetivo

Quem sai da escola deixa de entrar e deixa de ter credencial guardada. A conta global some
quando não resta usuário ativo em escola nenhuma. Registro de acesso, sessão e convite são
apagados no prazo da retenção por uma rotina noturna idempotente.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF5 (encerramento vale na requisição seguinte), RF16 (quem não tem mais vínculo
  não lê nada), RF19 (registro com autor e data) e o caso de borda "aluno transferido de escola"
- `techspec.md`:
  - seção 3 (`conta`, `usuario`, `credencial_matricula`, `conta_externa`, `sessao`, `convite` e `registro_acesso`);
  - seção 5, "Ciclo de vida";
  - seção 6 (a limpeza da conta é método `@SemEscopo` do `ResolucaoDeTenantRepository`);
  - seção 7 (retenção, titular, auditoria);
  - seção 13 (consulta do titular fica no F3).
- `.claude/rules/20-lgpd-menores.md`:
  - itens 15 e 16: exclusão lógica auditada e expurgo pela retenção;
  - item 18: professor que saiu em março não vê a turma em outubro.
  - O porquê: guardar hash de senha de quem já saiu é só superfície de vazamento.
- `.claude/rules/10-multitenancy.md`, itens 3 e 9. A eliminação pedida pela escola A nunca toca o que é de B, nem a conta que ainda serve a B.
- `.claude/rules/80-infra-e-carga.md`, item 2: expurgo é lote e roda fora do horário letivo.
- `docs/lgpd.md`, seção 2: as linhas de hash de senha, e-mail de login global, sessão, convite e registro de acesso, com a retenção de cada uma.
- Código existente do F0, que é o modelo a seguir:
  - `apps/worker/src/processadores/expurgar-jobs.ts`: processador de expurgo em lotes;
  - `packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts`: `@SemEscopo` justificado em `retencao`, apagando em lotes de 5.000;
  - `apps/worker/src/agendamentos.ts`: cron em São Paulo, gravação pelo `Enfileirador` como lote não urgente.
- Criado nas tarefas anteriores do F1:
  - `RegistroDeAuditoria` (1.0);
  - `ResolucaoDeTenantRepository` e tabelas de sessão (2.0);
  - `credencial_matricula` (11.0);
  - `convite` (7.0);
  - `conta_externa` (13.0), se já existir. Senão, a limpeza fica preparada e o teste da conta externa entra na 13.0.

## Subtarefas

- [x] 17.1 — Desativação e eliminação, como serviço de domínio com testes.
  - **Desativar aluno:** `usuario.desativado_em`, apaga o `senha_hash` de `credencial_matricula` e encerra as sessões.
  - **Desativar professor ou coordenador:** marca o usuário e encerra as sessões dele naquela escola. Se a conta ficou sem usuário ativo em qualquer escola, a limpeza apaga e-mail, senha, segredo TOTP, códigos de recuperação e todas as sessões.
  - **Eliminação por escola:** apaga só o que é daquela escola (usuário, `credencial_matricula`, `conta_externa`, vínculos e sessões). Se era o último usuário da conta, dispara a mesma limpeza.
  - **O que fica:** `registro_acesso` e `auditoria`, pela retenção legal.
  - **Registro:** tudo na mesma transação, com auditoria. Os campos de `antes` e `depois` vêm da lista fechada da 1.0: ids e datas, nunca e-mail nem nome.
  - **Rotas:** nenhuma no F1. A Tech Spec seção 4 não prevê rota de desativação; a tela de estrutura é do F2 e o pedido do titular é do F3.
- [x] 17.2 — `sistema.expurgar-acesso`, na fila de lote e não urgente, agendado de madrugada em `AGENDAMENTOS`, longe de `consolidar-uso` (2h) e `expurgar-jobs` (3h30).
  - **Apaga, em lotes:**
    - `registro_acesso` com mais de 6 meses;
    - `sessao` com `coalesce(encerrada_em, expira_em)` de mais de 30 dias;
    - `convite` 30 dias depois de usado, revogado ou expirado.
  - **Idempotência:** rodar de novo não apaga nada além do prazo (D49).
  - **Escopo:** repository em `retencao`, com `@SemEscopo` justificado, como o expurgo de jobs do F0. É a única exceção fora do `ResolucaoDeTenantRepository` (Tech Spec seção 6).
- [x] 17.3 — Testes, com relógio injetado nos limites de prazo.
- [x] 17.4 — Redefinir o MFA encerra as sessões abertas da conta (decidido em 18/09/2026, a partir da revisão da 6.0).
  - **Por quê:** a redefinição existe sobretudo para "perdi o celular" e "suspeita de acesso indevido". Nos dois casos, uma sessão aberta em aparelho perdido ou por quem invadiu continua valendo até vencer, e a redefinição sem encerrar não protege nada. A 6.0 implementou a redefinição (`apps/api/src/sessao/redefinicao-de-mfa.ts`, rota da coordenação e `ops:redefinir-mfa`) sem encerrar sessão, porque a tarefa e a Tech Spec não pediam.
  - **O que fazer:** na mesma transação da redefinição, encerrar todas as sessões ativas da conta, em todas as escolas dela, com motivo próprio (ex.: `mfa_redefinido`), pelo mesmo caminho que a 17.1 usa para encerrar sessão na desativação. A requisição seguinte com a sessão encerrada dá 401, como em toda sessão encerrada (2.0).
  - **Escopo:** a conta é global; encerrar em outras escolas da mesma conta segue a regra da 6.0 para a redefinição (só age quando todos os usuários ativos da conta são da escola que pediu, ou pelo operador). Nada de dado de outra escola aparece na resposta nem na auditoria da escola que pediu.
  - **Tech Spec:** acrescentar o encerramento na seção 5 (MFA, redefinição).
- [x] 17.5 — A troca de escola grava `saida` no registro de acesso da origem (decidido em 18/09/2026, revertendo uma escolha da 12.0).
  - **Por quê:** a 12.0 registrou o fim da sessão de origem só pelo motivo `troca_de_escola` na própria sessão. A sessão é expurgada em 30 dias (17.2), e o `registro_acesso` guarda 6 meses (Marco Civil, art. 15): o rastro de que a pessoa saiu de A para B sumiria antes do prazo. O `DELETE /v1/sessao` já grava `saida`; a troca é uma saída da escola de origem.
  - **O que fazer:** na mesma transação da troca (e do código aceito, quando o destino é a coordenação), gravar `saida` no `registro_acesso` da escola de origem, só com ids, com o motivo `troca_de_escola` se a tabela tiver onde. Nada da escola de destino vai para o registro da origem, e vice-versa.
  - **Teste:** a troca de A para B deixa `saida` em A e `login` em B; o registro de A não traz a escola B; com o código do MFA recusado, nada é gravado em nenhuma das duas.

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/ciclo-de-vida.service.ts` | novo |
| `apps/api/src/sessao/resolucao-de-tenant.repository.ts` (método de limpeza da conta) | alterado |
| `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts` | novo |
| `apps/worker/src/processadores/expurgar-acesso.ts` | novo |
| `apps/worker/src/agendamentos.ts`, `apps/worker/src/montagem.ts` | alterado |
| `packages/nucleo/src/auditoria/` (ações de desativação e eliminação na lista fechada) | alterado |
| `apps/api/test/ciclo-de-vida.int.test.ts`, `apps/worker/test/expurgo-de-acesso.int.test.ts` | novo |
| `docs/runbook.md` ("Rotina do sistema sem rodar" passa a citar o expurgo de acesso) | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: aluno desativado tem o `senha_hash` apagado, e a requisição seguinte com a sessão aberta dá 401 | integração | RF5 e regra 20, item 18: quem saiu não entra nem fica com credencial guardada |
| borda: aluno transferido de escola é desativado em A, e a conta nova dele em B entra normalmente | integração | a matrícula é por escola, e a desativação não atravessa |
| borda: professor desativado em A, com usuário ativo em B, mantém e-mail e senha e continua entrando em B; desativado também em B, a conta perde e-mail, senha, segredo e códigos | isolamento | a conta global só é limpa quando não serve mais a nenhuma escola |
| isolamento: eliminação pedida por A apaga usuário, credencial, conta externa, vínculos e sessões de A, preserva tudo de B e o login em B, e mantém `registro_acesso` e `auditoria` de A | isolamento | quebra se a limpeza não filtrar pela escola do contexto |
| auditoria: desativação e eliminação gravam registro com autor e data, sem e-mail, nome nem matrícula em `antes`/`depois` | integração | RF19 com a lista fechada da 1.0 |
| borda: limites do expurgo com relógio injetado: registro de acesso com 6 meses menos 1 dia fica e com 6 meses mais 1 dia sai; sessão com 29 e 31 dias; sessão só expirada, sem `encerrada_em`, também sai; convite usado, revogado e expirado | integração | quebra se o `coalesce` ou o prazo estiverem errados |
| concorrência: `sistema.expurgar-acesso` rodando duas vezes em paralelo termina sem erro e com o mesmo resultado | integração | D49: reexecução não quebra nem duplica efeito |
| permissão: o processador não apaga sessão viva nem registro dentro do prazo de nenhuma escola | integração | `@SemEscopo` com critério de prazo, e não varredura cega |
| caminho feliz: coordenador com sessão aberta tem o MFA redefinido pela coordenação e pelo operador, e a requisição seguinte com aquela sessão dá 401 | integração | 17.4: a redefinição tira do ar quem estava com a sessão aberta |
| isolamento: redefinir o MFA de um usuário de A não encerra nem revela sessão de usuário de B | isolamento | 17.4: o encerramento não atravessa escola |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela): não se aplica, a tarefa não toca tela
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Rota e tela de desativação de pessoa: F2 (estrutura e onboarding).
- Pedido do titular por código (acesso, exportação, eliminação a pedido), retenção e expurgo da auditoria, e propagação para backup: F3.
- Encerramento do vínculo por `desligamento`: 9.0. Virada do ano com `fim_do_ano` e o `complemento` apagado: 10.0.
- Revogar convite: 7.0.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-19 17:42:18 | 2026-09-19 17:43:58 | `test-engineer` | 1 | REPROVADO | a7994fe5268f60843 |
| 2026-09-19 17:45:04 | 2026-09-19 17:45:38 | `test-engineer` | 2 | APROVADO | ac4615102e93d0461 |
| 2026-09-19 17:46:00 | 2026-09-19 17:47:01 | `tenancy-guardian` | 1 | APROVADO | a1057995f9b454e3a |
| 2026-09-19 17:46:07 | 2026-09-19 17:47:23 | `privacy-guardian` | 1 | APROVADO | a99bd4ceb51f6e67a |
| 2026-09-19 17:46:15 | 2026-09-19 17:47:54 | `infra-guardian` | 1 | REPROVADO | af4d469326e72f907 |
| 2026-09-19 17:45:51 | 2026-09-19 17:48:03 | `revisor-geral` | 1 | REPROVADO | af1cd1b9fe8619312 |
| 2026-09-19 17:52:07 | 2026-09-19 17:53:47 | `test-engineer` | 3 | REPROVADO | ac8372b2e72d31ad0 |
| 2026-09-19 17:58:52 | 2026-09-19 17:59:22 | `test-engineer` | 4 | APROVADO | a153dce263549ca93 |
| 2026-09-19 17:59:42 | 2026-09-19 18:00:15 | `tenancy-guardian` | 2 | APROVADO | a18087035acd50ead |
| 2026-09-19 17:59:46 | 2026-09-19 18:00:21 | `privacy-guardian` | 2 | APROVADO | a7d782d43f1ee56d5 |
| 2026-09-19 17:59:35 | 2026-09-19 18:00:39 | `infra-guardian` | 2 | REPROVADO | af448d00cf818d941 |
| 2026-09-19 18:02:39 | 2026-09-19 18:03:17 | `test-engineer` | 5 | APROVADO | aee352f3f5cd54161 |
| 2026-09-19 18:03:31 | 2026-09-19 18:03:53 | `tenancy-guardian` | 3 | APROVADO | a03e07598e187a253 |
| 2026-09-19 18:03:35 | 2026-09-19 18:03:54 | `privacy-guardian` | 3 | APROVADO | a85e26428b0fff47f |
| 2026-09-19 18:03:26 | 2026-09-19 18:03:55 | `infra-guardian` | 3 | APROVADO | ad2a7e9c520a19bbc |
| 2026-09-19 17:59:56 | 2026-09-19 18:32:36 | `revisor-geral` | 2 | APROVADO | a4a443052b28af9ef |
| 2026-09-19 18:33:00 | 2026-09-19 18:37:09 | `revisor-geral` | 3 | APROVADO | a4a42c7c5ce45421b |

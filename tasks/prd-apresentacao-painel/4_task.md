# Tarefa 4.0 — Ativação por convite sob a trava da escola, e a senha certa que não conta

**Funcionalidade:** apresentacao-painel · **Depende de:** 2.0, 3.0 · **Paralelo com:** 5.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `tenancy-guardian`, `frontend-reviewer`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Entre a primeira entrada da coordenadora e o gerar do operador, só um vence; e quem entra com senha
certa num convite que já não ativa não é tratado como senha errada.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seção 5 (o parágrafo "Gerar em `aceito` e `sem_coordenacao`…", com a **Decisão**) e 7c
  (linha "Ativação por convite")
- `cenarios.md`: E15, E16, W10 (o parágrafo da tela de entrada da escola)
- `revisao-spec.md`, rodadas 3 a 6: por que a trava é a primeira instrução (deadlock) e por que a regra
  vale pelo resultado
- Regras 80 (itens 1 e 7), 20 (item 10), 40 e 50 (item 12)
- Código do F1:
  - `apps/api/src/sessao/convite.service.ts` — `ConviteService.aceitar` (transação com
    `usarConvitePorHash`) e `AtivacaoPorConvite` (`pendentePeloBilhete`, `ativar`)
  - `apps/api/src/sessao/convite.repository.ts` — `ativarPorConvite`, com o `exists` de convite não
    revogado
  - `apps/api/src/sessao/login.service.ts` — onde a senha certa sem usuário cai em `recusar` e grava
    `login_falho`; o contador reservado antes do hash
  - `apps/api/src/sessao/mfa.service.ts` — a reserva própria na etapa do código e a ativação depois dele
  - `apps/web/src/paginas/EntrarNaEscola.tsx` e a tela de convite inválido do F1

## Subtarefas

- [ ] 4.1 — No aceite, a trava da escola (`travarEscola()` da 2.0) é a primeira instrução da transação,
  antes de `usarConvitePorHash`; em `AtivacaoPorConvite.ativar`, a primeira instrução antes do `update`.
  O `throw new Error('usuário do convite não ativado')` do aceite sai: com a trava, perder é resposta
  de convite inválido, nunca 500
- [ ] 4.2 — Login por e-mail e MFA: com senha (e código) certos e bilhete válido desta conta cujo
  convite já não ativa, entra no outro usuário ativo da conta (ou vai para `escolher`, sem a escola do
  convite); sem outro, `NAO_ENCONTRADO`, sem `login_falho` e com a reserva do contador desfeita (nos
  dois contadores, no MFA). Senha ou código errados continuam contando
- [ ] 4.3 — A entrada da escola mostra, para esse `NAO_ENCONTRADO`, o texto da tela de convite inválido
  do F1, sem dizer que a senha estava certa
- [ ] 4.4 — Testes, com as ordens forçadas pela trava segurada e pelo gatilho que só existe no banco de
  teste (nunca `sleep`, nunca gancho no código de produção)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/convite.service.ts`, `convite.repository.ts` | alterado |
| `apps/api/src/sessao/login.service.ts`, `mfa.service.ts` | alterado |
| `apps/web/src/paginas/EntrarNaEscola.tsx` (e o texto em `textos` do F1) | alterado |
| `apps/api/test/ativacao-sob-trava.int.test.ts` | novo |
| `apps/api/test/login-convite-revogado.int.test.ts` | novo |
| `e2e/entrar-convite-revogado.spec.ts` | novo |
| teste de unidade da tela de entrada | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E15(a) | integração | com a trava segurada pelo teste, a ativação espera (`wait_event = 'advisory'`), nos dois logins e no aceite; sem a trava, o teste falha |
| E15(b) | integração | gerar parado pelo gatilho entre a revogação e o commit: a ativação espera, não ativa e responde como a E16; também com o mesmo e-mail |
| E15(c) | integração | ativação já na fila e o gerar esperando: ela ativa, o gerar recebe `CONFLITO` |
| E15(d) | integração | aceite em `pendente` contra refazer e revogar, nas duas ordens: nunca 500 nem 40P01 |
| E15(e) | integração | espera além do `statement_timeout`: 503 `TEMPO_ESGOTADO` com `Retry-After` |
| E16 | integração | fora de corrida, com e sem MFA: senha certa → `NAO_ENCONTRADO`, sem `login_falho` nem `login`, contadores iguais; senha ou código errados contam; outro usuário ativo → entra nele, ou `escolher` sem a escola do convite; revogado entre a senha e o código |
| W10 (entrada da escola) | unidade e e2e | o texto do `NAO_ENCONTRADO` é o de convite inválido, sem mencionar a senha, na tela |
| E6 (login) | integração | o aceite anterior não ativa depois do gerar em `aceito`; o usuário reusado em `sem_coordenacao` reativa pelo convite novo; o `revogado_em` no convite usado de `sem_coordenacao` é só registro |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e --infra`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O gerar, refazer e revogar em si (2.0, 3.0); o login rotineiro sem bilhete, que não pega a trava.

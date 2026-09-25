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

- [x] 4.1 — No aceite, a trava da escola (`travarEscola()` da 2.0) é a primeira instrução da transação,
  antes de `usarConvitePorHash`; em `AtivacaoPorConvite.ativar`, a primeira instrução antes do `update`.
  O `throw new Error('usuário do convite não ativado')` do aceite sai: com a trava, perder é resposta
  de convite inválido, nunca 500
- [x] 4.2 — Login por e-mail e MFA: com senha (e código) certos e bilhete válido desta conta cujo
  convite já não ativa, entra no outro usuário ativo da conta (ou vai para `escolher`, sem a escola do
  convite); sem outro, `NAO_ENCONTRADO`, sem `login_falho` e com a reserva do contador desfeita (nos
  dois contadores, no MFA). Senha ou código errados continuam contando
- [x] 4.3 — A entrada da escola mostra, para esse `NAO_ENCONTRADO`, o texto da tela de convite inválido
  do F1, sem dizer que a senha estava certa
- [x] 4.4 — Testes, com as ordens forçadas pela trava segurada e pelo gatilho que só existe no banco de
  teste (nunca `sleep`, nunca gancho no código de produção)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/convite.service.ts`, `convite.repository.ts` | alterado |
| `apps/api/src/sessao/login.service.ts`, `mfa.service.ts` | alterado |
| `packages/shared/src/erros/mensagens.ts`, `apps/web/src/paginas/Entrar.tsx`, `Mfa.tsx` (divergência: não `EntrarNaEscola.tsx`) | alterado |
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

## Divergências resolvidas nesta tarefa

- **W10: a "entrada da escola" é a entrada da equipe (`/entrar`) e a tela do segundo fator**, não
  `EntrarNaEscola.tsx`, que é a entrada do aluno por matrícula e nunca recebe o `NAO_ENCONTRADO` da E16 (ele sai de
  `POST /v1/sessao/email` e de `POST /v1/sessao/mfa`). O texto mora no catálogo de `packages/shared/src/erros/mensagens.ts`:
  `MENSAGENS_DA_ENTRADA` e `MENSAGENS_DO_SEGUNDO_FATOR` ganham `NAO_ENCONTRADO` com o texto de `MENSAGENS_DO_CONVITE`
  (uma constante só). Nas telas (pedido do `frontend-reviewer`, 1ª rodada): `Entrar.tsx` tira o aviso do aceite
  ("entre com a sua senha para concluir o convite") quando chega esse `NAO_ENCONTRADO`, para a tela não dizer as duas
  coisas; `Mfa.tsx`, com o desafio já gasto, esquece o desafio e volta à entrada com o texto de convite inválido como
  aviso, pelo mesmo caminho do `CONTA_SEGURADA`, sem sobrar formulário que só daria "código incorreto". A unidade é
  `mensagens.test.ts`; o e2e, `e2e/entrar-convite-revogado.spec.ts`, pela entrada e pelo segundo fator, nos dois projetos.
  O bilhete fica na aba depois do `NAO_ENCONTRADO` da entrada: repetir a senha devolve o mesmo texto. `entrarComSenha` e
  `configurarSegundoFator` saíram de `e2e/mfa.spec.ts` para `e2e/__fixtures__/segundo-fator.ts`, usadas pelos dois specs.
- **No MFA, o desafio passou a ser consumido depois da ativação** (recomendação do `infra-guardian` e do `revisor-geral`):
  antes, o 503 da trava gastava o desafio, e quem repetisse como o `Retry-After` manda recebia "código incorreto". Dois
  pedidos com o mesmo desafio continuam sem passar os dois: o passo do código fica gravado (`mfa_ultimo_passo`), o de
  recuperação é de uso único, e o `consumir` segue antes de concluir. A E15(e) repete com o código seguinte e ativa.
- **Com MFA, a resposta vem depois do código.** A senha certa com o bilhete desta conta cujo convite já não ativa, e sem
  outro usuário ativo, vai a `mfa` com o convite no desafio (antes era a recusa do RF6, com `login_falho`); o
  `NAO_ENCONTRADO` só sai com o código certo. Nessa etapa da senha a reserva é desfeita, e não zerada: é o que deixa os
  dois contadores iguais aos de antes (E16). Com o convite ainda à espera, a senha certa zera o contador, como antes.
- **`ContadorDeTentativas.desfazer(chave, reserva)` é novo**: tira a falha daquela reserva (no Redis, por script, e no
  seguro em memória) e, se foi ela que segurou a conta, solta a espera. Enquanto a conta está segurada nenhuma reserva é
  contada, e por isso a espera que existe é a dela. Sem falha, apaga a chave. Falha ao desfazer deixa a tentativa contada.
- **O que falhar depois da senha (ou do código) certa também desfaz a reserva**, com o erro subindo igual: o 503
  `TEMPO_ESGOTADO` da trava (E15(e)), ou o banco fora. Não é senha errada, como o 503 do semáforo (14.0). Carga: nenhuma
  gravação nova; um `eval` a mais no Redis só nesses caminhos de erro, depois de uma senha certa. No MFA, o `zerar` do
  código saiu de antes da ativação para depois dela, pelo mesmo motivo.
- **`AtivacaoPorConvite.pendentePeloBilhete` virou `conviteDoBilhete`**: o login precisa saber que o bilhete é desta conta
  mesmo quando o convite já não ativa ninguém; quem diz se ainda ativa segue sendo `pendenteDoConvite`.
- **4.1, o aceite que não ativa**: com a trava, o único jeito de `ativarPorConvite` não ativar depois de o aceite usar o
  convite é dado fora do caminho normal. O teste força isso com o `desativado_em` do usuário no futuro: antes, 500;
  agora, `NAO_ENCONTRADO`, com o uso do convite, a senha e a auditoria desfeitos.
- **A E9 do aceite (`painel-convite.int.test.ts`)** agora roda o refazer sem a trava (o `Proxy` da E9) e espera o
  `update` condicional: com a trava no aceite, o refazer esperaria nela, e o teste deixaria de provar a condição. O
  aceite contra o refazer sob a trava, nas duas ordens, é a E15(d).
- **Peças de teste movidas e novas**: `segurarTravaDaEscola`, `esperarNaTravaDaEscola` e `emOrdemNaTrava` saíram de
  `painel-convite.int.test.ts` para `apps/api/test/trava-da-escola.ts`, usadas pelos dois arquivos; o cenário comum da E15
  e da E16 está em `apps/api/test/ativacao-de-teste.ts`. O e2e ganhou as fixtures `desativarUsuario` e
  `revogarConvite({ escolaId, usuarioId })`, pelo banco, como as outras.
- **E15(a), a prova da ordem**: além do `wait_event = 'advisory'`, o teste prende com `for update nowait` as linhas do
  convite, da conta e do usuário enquanto a ativação espera: se ela as prendesse antes da trava, o `nowait` falharia.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e --infra`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O gerar, refazer e revogar em si (2.0, 3.0); o login rotineiro sem bilhete, que não pega a trava.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-25 00:00:13 | 2026-09-25 00:03:32 | `test-engineer` | 1 | REPROVADO | ab524d329731aba20 |
| 2026-09-25 00:38:08 | 2026-09-25 00:39:18 | `test-engineer` | 2 | APROVADO | aad6a31bc62e8bf6c |
| 2026-09-25 00:39:37 | 2026-09-25 00:40:38 | `privacy-guardian` | 1 | APROVADO | aa7d847f644e38be1 |
| 2026-09-25 00:39:42 | 2026-09-25 00:40:48 | `tenancy-guardian` | 1 | APROVADO | a6a4f5469d8c9db82 |
| 2026-09-25 00:39:49 | 2026-09-25 00:41:19 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | af5c9e5f9dce1cc31 |
| 2026-09-25 00:39:31 | 2026-09-25 00:41:35 | `infra-guardian` | 1 | APROVADO | a764152d030de3b30 |
| 2026-09-25 00:39:25 | 2026-09-25 00:42:35 | `revisor-geral` | 1 | APROVADO | ab8087a5b97ea5f4b |
| 2026-09-25 01:21:00 | 2026-09-25 01:23:04 | `test-engineer` | 3 | APROVADO | a578132000ca92335 |
| 2026-09-25 01:23:19 | 2026-09-25 01:23:52 | `frontend-reviewer` | 2 | APROVADO | a3fd35b94b18433d6 |
| 2026-09-25 01:23:44 | 2026-09-25 01:24:12 | `privacy-guardian` | 2 | APROVADO | a90ed912734ec2f53 |
| 2026-09-25 01:23:32 | 2026-09-25 01:24:24 | `revisor-geral` | 2 | APROVADO | a9706e282c60c2070 |
| 2026-09-25 01:23:52 | 2026-09-25 01:24:26 | `tenancy-guardian` | 2 | APROVADO | a9ff45e5f09a2f284 |
| 2026-09-25 01:23:37 | 2026-09-25 01:24:36 | `infra-guardian` | 2 | APROVADO | a829731686b47ddea |

# Tarefa 7.0 — Segundo fator do operador: configurar e entrar com código

**Funcionalidade:** apresentacao-operacao · **Depende de:** 6.0
**Subagentes obrigatórios:** `privacy-guardian`, `infra-guardian`, `tenancy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O operador que passou pela senha configura o app autenticador e entra com um código (TOTP ou de
recuperação), e só então existe uma sessão de operador com o cookie `turmma_operacao`.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 3 (colunas `mfa*` de `Operador`, `CodigoRecuperacaoOperador`,
  `SessaoOperador`), 4 (as duas rotas e o cookie), 5 ("Etapas", "Travas no banco": configurar,
  `/sessao/mfa`, desafio) e 7 (log e `no-store`)
- `cenarios.md`: os cenários da tabela abaixo, pelo identificador
- `.claude/rules/20-lgpd-menores.md` (item 9, log), `40-testes.md` (concorrência em paralelo),
  `80-infra-e-carga.md` (itens 1 e 7)
- Código do F1 (reaproveite as peças puras, não o service):
  - `apps/api/src/sessao/segundo-fator.ts` e `cifra-do-segredo.ts` (AAD = `operador.id`)
  - `apps/api/src/sessao/desafio.ts` — `jti` com `SET NX` (`PREFIXO_DESAFIO_USADO`); o do operador
    tem `typ` e prefixo próprios
  - `apps/api/src/sessao/mfa.service.ts` — só para ler o fluxo: ele abre sessão de escola
  - `apps/api/src/sessao/cookies.ts` — atributos do cookie

## Subtarefas

- [ ] 7.1 — `POST /v1/operacao/sessao/mfa/configurar`: a trava "configurar" da seção 5 (consome o
  desafio, `update ... returning mfa_versao`, códigos na mesma transação, desafio `mfa` com a versão)
- [ ] 7.2 — `POST /v1/operacao/sessao/mfa`: a trava "`/sessao/mfa`" da seção 5 (uma transação a
  partir do `for update` do operador ativo; versão divergente dá "configure de novo" sem conferir o
  código nem contar tentativa); insere a `SessaoOperador` e emite acesso e cookie `turmma_operacao`
- [ ] 7.3 — Falha de código conta no contador por `operador.id` (C34); desafio recusado sempre com a
  mesma resposta de desafio inválido
- [ ] 7.4 — `Cache-Control: no-store` nas duas respostas; contrato estrito de `packages/shared`
- [ ] 7.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/operacao/segundo-fator.controller.ts` | novo |
| `apps/api/src/operacao/segundo-fator.service.ts` | novo |
| `apps/api/src/operacao/operador.repository.ts` | alterado (travas) |
| `apps/api/src/operacao/desafio-de-operador.ts` | alterado (etapa `mfa` com versão) |
| `apps/api/src/operacao/cookie-de-operador.ts` | novo |
| `packages/shared/src/operacao/segundo-fator.ts` | novo |
| `apps/api/test/operacao/segundo-fator.int.test.ts` | novo |
| `apps/api/test/operacao/segundo-fator-concorrencia.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| C12, C13, C14, C16, C17 | integração | desafio de uso único (em `Promise.all`), Redis fora dá 503, etapa trocada recusada, conta ativa intacta, ativação só no primeiro código |
| C18 | integração | dois configurar com barreira nas duas ordens: segredo e códigos da mesma aba; a outra recebe "configure de novo" sem somar tentativa |
| C18b | integração | `/sessao/mfa` da aba A e configurar da B, barreira nas duas ordens: nunca ativa segredo diferente do conferido |
| C19, C20 | integração | TOTP e recuperação duas vezes, em sequência e em paralelo; recuperação antes da ativação não vale |
| C34 | integração | `sessao/mfa` recusado pelo contador do `operador.id`, não pelo IP |
| C32 (mfa/configurar) | integração | acima do `rl:ip`, 429 `LIMITE_EXCEDIDO` com `Retry-After` |
| C39 (configurar, mfa) | integração | `no-store`; contrato estrito recusa e não deixa sair campo a mais |
| C47 (cookie real) | integração | o `turmma_operacao` emitido aqui, nas rotas de escola com sessão, igual a rota inexistente |
| **C6b (a)** | integração | barreira depois do `jti` e antes do `for update`; `desativar` confirma e solta: `/sessao/mfa` recusado como desafio inválido; **estado final do C6** (linha só com id, apelido e datas, nenhum código, zero sessões) |
| **C6b (b)** | integração | barreira depois do `for update` e antes do insert; o `desativar` bloqueado, **provado pela espera em `pg_locks`**; depois, sessão criada e encerrada pelo `desativar`, zero ativas, `SESSAO_ENCERRADA` na seguinte |
| **C6b (c)** | integração | o par para configurar, barreira antes e depois do `update ... returning mfa_versao`; com o `desativar` ganhando, configurar **recusado como desafio inválido**; o desafio `mfa` já devolvido na outra ordem cai no (d); nenhum segredo nem código no fim |
| C6b (d) | integração | em sequência: desafio usado depois do `desativar`, recusado como inválido |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Renovar, sair, 30 min e 8 h, `ACESSO_VENCIDO` e o `AcessoOperacao` (8.0); expurgo (9.0); as telas
(10.0 e 11.0); a entrada por e-mail (6.0, já feita).

# Tarefa 8.0 — Sessão do operador: renovar, sair, prazos e registros

**Funcionalidade:** apresentacao-operacao · **Depende de:** 7.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `tenancy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A sessão de operador dura até 8 h, termina com 30 min parada, renova e sai pelo cookie, e toda
entrada, falha e saída fica no registro de acesso; com isso, as sete rotas de entrada estão
completas e as cercas que dependiam delas passam a valer.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 3 (`SessaoOperador`, `AcessoOperacao`, `AuditoriaOperacao`), 4, 5
  ("Conferência da sessão", "Limite", renovação nas "Travas") e 6
- `cenarios.md`: os cenários da tabela abaixo
- `.claude/rules/20-lgpd-menores.md` (itens 9 e 10), `40-testes.md`, `80-infra-e-carga.md`
  (itens 1, 5 e 7)
- Código do F1:
  - `apps/api/src/sessao/renovacao.service.ts` — rotação do refresh com `refresh_hash_anterior`,
    `JANELA_DE_JA_RENOVADO_SEGUNDOS` (30 s) e o reuso que encerra a sessão: é o padrão a copiar
  - `apps/api/src/sessao/saida.service.ts` — encerramento da sessão e do cookie
  - `apps/api/src/sessao/cookies.ts` — limpeza do cookie na saída
  - `apps/web/src/sessao/inatividade.ts` — só para conferir que os 30 min do servidor batem com o aviso
    que a 10.0 fará

## Subtarefas

- [ ] 8.1 — `POST /v1/operacao/sessao/renovar`: confere as quatro condições (30 min parado, 8 h,
  encerrada, operador desativado) e rotaciona com `where refresh_hash = $atual`; o anterior vale
  30 s, e reusado depois encerra a sessão
- [ ] 8.2 — `POST /v1/operacao/sessao/sair`: encerra a sessão e limpa o cookie
- [ ] 8.3 — `GuardaDeOperador`: 401 `ACESSO_VENCIDO` (acesso vencido, sessão viva) e 401
  `SESSAO_ENCERRADA`; 503 `INDISPONIVEL_TENTE_DE_NOVO` com o banco fora, na guarda e no renovar;
  `ultimoUsoEm` gravado no máximo uma vez por minuto
- [ ] 8.4 — `AcessoOperacao`: entrada, falha de entrada e saída, com IP, gravados pelas rotas de 6.0,
  7.0 e 8.0
- [ ] 8.5 — Fecha as cercas que precisavam das sete rotas: C43, C44, C46 (parte das entradas) e os
  grupos de limite do C36
- [ ] 8.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/operacao/sessao.controller.ts` | alterado (renovar, sair) |
| `apps/api/src/operacao/sessao.service.ts` | alterado |
| `apps/api/src/operacao/guarda-de-operador.ts` | alterado |
| `apps/api/src/operacao/acesso-operacao.repository.ts` | novo |
| `apps/api/src/operacao/operador.repository.ts` | alterado |
| `packages/shared/src/operacao/sessao.ts` | alterado |
| `apps/api/test/operacao/sessao.int.test.ts` | novo |
| `apps/api/test/operacao/registros.int.test.ts` | novo |
| `apps/api/test/operacao/arquitetura.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| C26 | integração | 30 min parado dão `SESSAO_ENCERRADA`; uso aos 29 min mantém viva aos 31 (relógio controlado) |
| C27 | integração | 8 h dão `SESSAO_ENCERRADA` mesmo com uso contínuo |
| C28 | integração | `/renovar` recusado depois de 30 min, 8 h, sair e desativar |
| C29 | integração | acesso vencido com sessão viva: `ACESSO_VENCIDO`, renova, a ação seguinte passa |
| C30 | integração | duas renovações em `Promise.all`: uma rotaciona, a outra vale pelo anterior por 30 s; o anterior reusado depois encerra |
| C31 | integração | banco fora na guarda e no `/renovar`: 503, nunca 401 nem 404 |
| C32 (renovar, sair) | integração | acima do `rl:ip`, 429 com `Retry-After` |
| C39 (renovar) | integração | `no-store` e contrato estrito |
| C36, C36b (`rl:ip`) | integração e arquitetura | toda rota de entrada num dos três grupos de limite; com o Redis fora, o seguro em memória do F1, sem erro cru |
| C37 | integração | **inteiro**: entrada, falha e saída em `AcessoOperacao` com IP; criar, desativar, segundo fator configurado, convite gerado e revogado em `AuditoriaOperacao`; autor do comando no comando e da sessão no segundo fator |
| C43 | arquitetura | as rotas `@EntradaDeOperacao` são exatamente as sete da seção 4 |
| C44 | arquitetura | nenhuma rota registrada cria operador |
| C46 (entradas) | isolamento | com a lista gerada das rotas, que precisa ter as sete de entrada, nenhuma credencial de escola produz sessão de operador por elas |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O expurgo das tabelas (9.0); as telas e o aviso de inatividade na web (10.0); qualquer rota de
painel (A0b).

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

- [x] 8.1 — `POST /v1/operacao/sessao/renovar`: confere as quatro condições (30 min parado, 8 h,
  encerrada, operador desativado) e rotaciona com `where refresh_hash = $atual`; o anterior vale
  30 s, e reusado depois encerra a sessão
- [x] 8.2 — `POST /v1/operacao/sessao/sair`: encerra a sessão e limpa o cookie
- [x] 8.3 — `GuardaDeOperador`: 401 `ACESSO_VENCIDO` (acesso vencido, sessão viva) e 401
  `SESSAO_ENCERRADA`; 503 `INDISPONIVEL_TENTE_DE_NOVO` com o banco fora, na guarda e no renovar;
  `ultimoUsoEm` gravado no máximo uma vez por minuto
- [x] 8.4 — `AcessoOperacao`: entrada, falha de entrada e saída, com IP, gravados pelas rotas de 6.0,
  7.0 e 8.0
- [x] 8.5 — Fecha as cercas que precisavam das sete rotas: C43, C44, C46 (parte das entradas) e os
  grupos de limite do C36
- [x] 8.6 — Testes

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

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Divergências resolvidas nesta tarefa

- **Arquivos.** `sessao.controller.ts` e `sessao.service.ts` são novos (a lista os dava como alterados; não existiam).
  Não há `acesso-operacao.repository.ts`: o registro de acesso fica no `OperadorRepository`, porque o C45 exige que só ele
  toque as seis tabelas. A `GuardaDeOperador` não mudou: o 401 `ACESSO_VENCIDO`, o `SESSAO_ENCERRADA`, o 503 e o
  `ultimoUsoEm` uma vez por minuto (8.3) já vieram da 4.0, com teste em `operacao-isolamento.int.test.ts`; aqui eles
  entram de novo nos testes de prazo (C26, C27) e no C31, junto do `/renovar` e do `/sair`. Os testes ficam em
  `apps/api/test/`, sem a subpasta `operacao/`, como os da 5.0 à 7.0: `sessao-operador.int.test.ts`,
  `registros-operador.int.test.ts`, e o C46 das entradas em `operacao-isolamento.int.test.ts`. Arquivos a mais:
  `falhas-de-entrada.ts`, `entrada.service.ts`, `segundo-fator.service.ts` e `.controller.ts`, `cookie-de-operador.ts`,
  `operacao.module.ts`, `desafio-de-operador.test.ts`, `packages/shared/src/index.ts` e os apoios `sessao-de-operador.ts`
  (o refresh da sessão) e `segundo-fator-de-operador.ts` (o medidor no `subir`).
- **A renovação não trava a linha antes de decidir.** Lê a sessão pelo hash atual ou anterior, confere as quatro
  condições, e a trava é o `update … where refresh_hash = $atual and encerrada_em is null`, como a seção 5 escreve.
  Quem perde a corrida relê e cai no caso do anterior. O `encerrada_em is null` a mais impede rotacionar a sessão que a
  saída ou a desativação acabaram de encerrar.
- **O anterior "vale" por 30 s** (PRD, "duas abas"): 200 com um acesso novo e **sem** `Set-Cookie`, porque o navegador já
  tem o cookie novo e reescrevê-lo com o anterior quebraria a aba que rotacionou. Depois dos 30 s, é reuso: encerra a
  sessão com motivo `reuso_de_refresh` e responde 401. Sem auditoria (a lista fechada da `AuditoriaOperacao` não tem essa
  ação), só a linha `operacao.reuso_de_refresh` no log, sem id. O cookie de duas rotações atrás é desconhecido: recusado,
  sem encerrar, como no F1.
- **Toda recusa do `/renovar` é 401 `SESSAO_ENCERRADA`**, com o cookie apagado: sem cookie, fora do formato,
  desconhecido, e as quatro condições. A web vai à entrada em todas.
- **Renovar não é uso**, como no F1: não move `ultimo_uso_em` nem `expira_em`. A aba esquecida renovando sozinha não
  segura a sessão além dos 30 min.
- **Sair** encerra a sessão aberta pelo cookie atual ou pelo anterior, grava `saida` só quando encerrou, e responde 204
  com o cookie apagado em qualquer caso (D59). O corpo das duas rotas é vazio ou `{}`
  (`esquemaPedidoSemCorpoDeOperador`); campo é `ENTRADA_INVALIDA`.
- **`operador.mfa_configurado` é gravado na ativação** (o primeiro código válido do `/sessao/mfa`), e não no
  `configurar`: configurado é o segundo fator que ficou ativo, e o autor é o operador da sessão que se abre (C37). O
  `configurar` sozinho não ativa nada nem audita.
- **A falha do código no `/sessao/mfa` grava `entrada_falha`** (IP, sem operador, como a senha errada) e soma em
  `operacao.entrada_falha`; a conta segurada soma só na métrica, como na 6.0. Recomendação 4 do `revisor-geral` da 7.0.
  A série é uma só (`FalhasDeEntradaDaOperacao`), criada no módulo e dividida pelas duas rotas.
- **"Sessão gravada sem cookie se o Redis cair depois do commit"** (recomendação da 7.0): não acontece.
  `ContadorDeTentativas.zerar` não lança (`contador-de-tentativas.ts:186-194`: apaga o seguro e engole a falha do Redis),
  e o resto depois do commit não toca o Redis. Nada mudou.
- **O aviso `operacao.desafio_sem_redis`** ganhou teste de unidade (recomendação da 7.0): uma linha em duas recusas
  seguidas, com o Redis desconectado e com o comando recusado.
- **C36b** desconecta o cliente do Redis de cache da própria instância, e não o contêiner, pelo mesmo motivo do C13.
- **C44** é a varredura do código: só o `ops/operador.ts` chama o `criar` e o `criarConvite` do `OperadorRepository` e as
  funções do comando, e nenhum módulo da API importa `ops/`.

## Fora do escopo desta tarefa

O expurgo das tabelas (9.0); as telas e o aviso de inatividade na web (10.0); qualquer rota de
painel (A0b).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 03:30:05 | 2026-09-24 03:31:37 | `test-engineer` | 1 | APROVADO | a7c4db0549567eaba |
| 2026-09-24 03:32:13 | 2026-09-24 03:32:46 | `tenancy-guardian` | 1 | APROVADO | a0d8bce76f7e11f10 |
| 2026-09-24 03:32:11 | 2026-09-24 03:32:52 | `privacy-guardian` | 1 | APROVADO | a95bb6b3efc5b456e |
| 2026-09-24 03:32:00 | 2026-09-24 03:32:53 | `revisor-geral` | 1 | APROVADO | af1ce3e68084f1a46 |
| 2026-09-24 03:32:05 | 2026-09-24 03:33:09 | `infra-guardian` | 1 | APROVADO | a94a6545af7cbde74 |

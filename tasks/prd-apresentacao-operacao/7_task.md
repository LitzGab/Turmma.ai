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

- [x] 7.1 — `POST /v1/operacao/sessao/mfa/configurar`: a trava "configurar" da seção 5 (consome o
  desafio, `update ... returning mfa_versao`, códigos na mesma transação, desafio `mfa` com a versão)
- [x] 7.2 — `POST /v1/operacao/sessao/mfa`: a trava "`/sessao/mfa`" da seção 5 (uma transação a
  partir do `for update` do operador ativo; versão divergente dá "configure de novo" sem conferir o
  código nem contar tentativa); insere a `SessaoOperador` e emite acesso e cookie `turmma_operacao`
- [x] 7.3 — Falha de código conta no contador por `operador.id` (C34); desafio recusado sempre com a
  mesma resposta de desafio inválido
- [x] 7.4 — `Cache-Control: no-store` nas duas respostas; contrato estrito de `packages/shared`
- [x] 7.5 — Testes

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

## Divergências resolvidas nesta tarefa

- **O desafio vai no corpo** (`{ desafio }`, `{ desafio, codigo }` ou `{ desafio, recuperacao }`), e não no `Authorization`
  como no F1: o desafio do operador não serve de bearer em rota nenhuma (C21). Contrato em
  `packages/shared/src/operacao/segundo-fator.ts`.
- **"Configure de novo" é 409 `CONFLITO`**, sem código de erro novo: a mensagem geral ("acabou de ser alterado") vale, e a
  tela da 11.0 decide o texto pela rota. Desafio inválido, usado, de outra etapa, de operador desativado e `mfa` sem versão
  com o segundo fator inativo respondem `NAO_AUTENTICADO`, iguais.
- **A reserva no contador pelo `operador.id` fica dentro da transação**, depois do `for update` e da conferência da versão:
  é o único jeito de a versão divergente não contar tentativa (C18) sem uma leitura fora da trava. A linha fica travada
  durante o `eval` no Redis, que tem o prazo do cliente do login (100 ms em produção), e o volume é o da nossa equipe.
- **O desafio é consumido antes de tudo** (`ConsumoDeDesafioDeOperador`, `SET NX` em `desafio-op:usado:{jti}`), e por
  isso o código errado também o queima: o operador pede outro, como a Tech Spec diz ("queimado não volta"). O consumo do
  F1 não serve: com o Redis fora ele responde 401, e aqui a resposta é 503 `INDISPONIVEL_TENTE_DE_NOVO` (C13), com a linha
  `operacao.desafio_sem_redis` espaçada no log.
- **`sessao/mfa` leva `@LimiteQueRebaixa`**: o grupo "recusa pelo contador por `operador.id`" não pode responder 429 pelo
  IP (C34), e esta é a marcação que conta no balde do login sem recusar. Sem hash na rota, o rebaixamento não tem efeito.
- **A `GuardaDeAutenticacao` responde 404 também ao cookie `turmma_operacao`** numa rota de escola com sessão
  (`cookieDeOperador`, com o nome no núcleo), como já fazia com o bearer de operador: sem isso, o cookie sozinho dava o
  401 de "falta credencial", diferente da rota inexistente (Tech Spec, seção 6; C47). O cookie de dispositivo do operador
  não é credencial e não entra.
- **O cookie `turmma_operacao` sai com `Max-Age` de 8 h**, a duração da sessão; o de dispositivo, com o do F1 (30 dias).
- **O rótulo do TOTP do operador é `operação`**: `gerarSegredo` do F1 ganha o rótulo opcional, e o app autenticador não
  confunde a conta da operação com a da coordenação.
- **O registro `entrada` em `acesso_operacao` e a auditoria `operador.mfa_configurado` ficam para a 8.0** (8.4 e C37 são
  dela: "gravados pelas rotas de 6.0, 7.0 e 8.0").
- **C6b (a) termina no estado do C6** (linha só com id, apelido e datas, sem código, sem sessão), como a tabela desta
  tarefa diz, e não com "códigos intactos" do `cenarios.md`, que a rodada 8 da revisão da spec já apontou como
  contraditório.
- **O filtro `desativado_em is null` do `for update` do `/sessao/mfa` não tem teste que o isole**: o check
  `operador_desativado_sem_dado_pessoal` apaga o segredo na desativação, e o operador desativado já cai por não ter
  segredo. Fica como a Tech Spec escreve a trava. O do `update` do configurar é observável: sem ele, o `update` violaria o
  check e responderia 500 no C6b (c).
- **C13 derruba o Redis desta instância** (`disconnect` do cliente do login), e não o contêiner: parar o `redis-fila` do
  compose já derrubou em cascata outra suíte na esteira.
- **Os testes ficam em `apps/api/test/`, sem a subpasta `operacao/`**, como os da 5.0 e da 6.0:
  `segundo-fator-operador.int.test.ts`, `segundo-fator-operador-concorrencia.int.test.ts` e o apoio
  `segundo-fator-de-operador.ts`.
- **Arquivos a mais que a lista previa:** `packages/shared/src/index.ts`; `apps/api/src/app.module.ts`,
  `operacao.module.ts` e `dispositivo-de-operador.ts` (comentário); `apps/api/src/sessao/segundo-fator.ts` (rótulo);
  `packages/nucleo/src/identidade/verificar-token.ts`, `guarda-autenticacao.ts`, `token-de-operador.test.ts` e o barrel;
  `apps/api/src/operacao/desafio-de-operador.test.ts`; `apps/api/test/contratos.test.ts` (a exceção nominal do segredo no
  configurar do operador) e `arquitetura.test.ts` (a assinatura nova do `OperacaoModule.com`).

## Fora do escopo desta tarefa

Renovar, sair, 30 min e 8 h, `ACESSO_VENCIDO` e o `AcessoOperacao` (8.0); expurgo (9.0); as telas
(10.0 e 11.0); a entrada por e-mail (6.0, já feita).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 02:22:28 | 2026-09-24 02:24:16 | `test-engineer` | 1 | APROVADO | aa36ad7d25e9760bb |
| 2026-09-24 02:24:37 | 2026-09-24 02:25:09 | `tenancy-guardian` | 1 | APROVADO | a8abd37cd8fdd905f |
| 2026-09-24 02:24:28 | 2026-09-24 02:25:11 | `privacy-guardian` | 1 | APROVADO | a7ca310809fe5eb89 |
| 2026-09-24 02:24:32 | 2026-09-24 02:25:25 | `infra-guardian` | 1 | APROVADO | a6f4f3194ac9ab5eb |
| 2026-09-24 02:24:23 | 2026-09-24 02:25:38 | `revisor-geral` | 1 | APROVADO | a8da3b1397a1d5f79 |

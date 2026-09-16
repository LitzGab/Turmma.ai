# Tarefa 3.0 — O F0 passa a usar a sessão real e as tabelas do F0 apontam para a escola

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 2.0
**Subagentes obrigatórios:** `tenancy-guardian`, `infra-guardian`, `test-engineer`

## Objetivo

O token sintético do F0 deixa de existir, e sai também a flag que o aceitava. Testes,
cenário de carga e realtime passam a usar escola e sessão reais, e `job_registro`,
`configuracao_operacional_escola` e `uso_infra_diario` passam a ter FK para `escola`.
Sobra um único caminho de identidade, o mesmo que vai para produção.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF15 (escopo) e a seção 3 (o que o F1 não faz)
- `techspec.md`:
  - seção 2: `nucleo/identidade` e `realtime`
  - seção 3: tabela de migrations, a linha da 3.0 e o parágrafo do `VALIDATE`
  - seção 5: "Requisição", sobre o handshake
  - seção 6: último item dos testes
  - seção 10: parágrafo final
  - seção 13: riscos do F0
- `tasks/prd-fundacao-tecnica/validacao.md`, seção 6 das duas rodadas: "FK de `escola_id`
  para `escola`" e "troca do emissor de token sintético" têm destino no F1
- `tasks/prd-fundacao-tecnica/techspec.md`, seção 3: por que não havia FK e o migrador em transação única
- `.claude/rules/80-infra-e-carga.md`, item 9: migration compatível com o código anterior
- `.claude/rules/10-multitenancy.md`, itens 1 e 5
- `.claude/rules/40-testes.md`: proibido `.skip` ou apagar teste para destravar; a carga é manual, mas o `npm run test:infra` roda
- `CLAUDE.md`, D52: testes de `infra/` no `npm run test:infra`
- Código existente que usa o token sintético (`git grep token-sintetico ACEITAR_TOKEN_SINTETICO`):
  - `packages/nucleo/src/config/validar-config.ts` (`EMISSOR_TOKEN_SINTETICO`, `esquemaAmbienteIdentidade`) e o teste dele
  - `apps/api/src/ops/token-sintetico.ts` e o teste, `apps/api/src/config.test.ts`, `apps/api/test/configuracao-de-teste.ts`, `contexto.int.test.ts`, `erro.int.test.ts`, `jobs-sinteticos.int.test.ts`, `limite.int.test.ts`, `prontidao.int.test.ts`, `uso.int.test.ts`
  - `apps/despachante/test/redis-fora.int.test.ts`
  - `apps/realtime/src/autenticacao-do-handshake.ts`, `config.test.ts`, `test/realtime-de-teste.ts`, `test/sistema.int.test.ts`
  - `infra/compose.yml`, `.env.example`, `package.json`, `README.md`
  - `infra/k6/justica-entre-escolas.js`, `infra/scripts/carga.ts`, `ensaio-alertas.ts`, `infra/test/alertas.int.test.ts`, `jobs.int.test.ts`, `metricas.int.test.ts`
  - `apps/worker/test/fila-de-teste.ts`: helper que grava job de escola sintética

## Subtarefas

- [x] 3.1 — Remover `ACEITAR_TOKEN_SINTETICO`, `EMISSOR_TOKEN_SINTETICO`, `ops:token-sintetico` e o teste do emissor
  - O `verificarToken` aceita só o emissor `educa`
  - `lerConfiguracaoIdentidade` deixa de ler a flag
  - `.env.example`, `infra/compose.yml` e `README.md` atualizados
- [x] 3.2 — Helpers de teste montam escola e sessão reais
  - **`apps/api/test/configuracao-de-teste.ts`:** ganha `criarEscolaComSessao({ papel })`, que usa `ops:escola` e `ops:sessao-sintetica`, ou os mesmos serviços em processo.
  - **`apps/worker/test/fila-de-teste.ts`:** cria a escola antes de gravar job.
  - **Cenário `justica-entre-escolas`:** `infra/scripts/carga.ts` cria as escolas A, B e C e gera os tokens com `ops:sessao-sintetica --quantidade`.
  - **Nenhum teste é apagado nem pulado.**
- [x] 3.3 — Handshake do realtime
  - `autenticacaoDoHandshake` passa a usar a mesma leitura de sessão da `GuardaDeSessao` (exportada do núcleo), com o pool de banco do realtime
  - A sala continua sendo a escola do contexto, e o handshake não move `ultimo_uso_em`
  - Com o Postgres fora, a conexão é recusada com código de indisponível, não de não autenticado
  - `apps/realtime/src/config.ts` passa a ler a configuração de banco
- [x] 3.4 — Migration só com a FK de `escola_id`
  - `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (escola_id) REFERENCES escola(id) NOT VALID` em `job_registro`, `configuracao_operacional_escola` e `uso_infra_diario`, e nada mais no arquivo
  - O `VALIDATE` não entra: fica registrado como pendência no `TODO.md`, com a consulta de órfãos que precisa dar zero antes
  - O comentário "o F1 acrescenta a FK" sai de `configuracao-operacional-escola.ts` e do schema de `job_registro`
- [x] 3.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/config/validar-config.ts`, `validar-config.test.ts`, `identidade/verificar-token.ts`, `verificar-token.test.ts` | alterado |
| `apps/api/src/ops/token-sintetico.ts`, `token-sintetico.test.ts` | removido |
| `apps/api/src/config.test.ts`, `apps/api/test/*.int.test.ts`, `apps/api/test/configuracao-de-teste.ts` | alterado |
| `apps/despachante/test/redis-fora.int.test.ts`, `apps/worker/test/fila-de-teste.ts` | alterado |
| `apps/realtime/src/autenticacao-do-handshake.ts`, `config.ts`, `config.test.ts`, `app.module.ts`, `test/*` | alterado |
| `packages/nucleo/drizzle/0006_*.sql` e `meta/` | novo |
| `packages/nucleo/src/db/schema/job-registro.ts`, `configuracao-operacional-escola.ts`, `uso-infra-diario.ts` | alterado |
| `infra/compose.yml`, `infra/k6/justica-entre-escolas.js`, `infra/scripts/carga.ts`, `ensaio-alertas.ts`, `infra/test/*.int.test.ts` | alterado |
| `.env.example`, `package.json`, `README.md`, `TODO.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: todos os testes do F0 verdes com escola e sessão reais, sem nenhum `.skip` novo | integração | a troca não perdeu cobertura |
| permissão: token assinado com o emissor `sintetico` e a mesma chave é recusado, e a API sobe sem a variável `ACEITAR_TOKEN_SINTETICO` | integração | um caminho de identidade só |
| borda: inserir job com `escola_id` que não existe em `escola` é recusado pelo banco | integração | FK nova vale para escrita |
| migration: com linha órfã já existente em `uso_infra_diario`, a migration `NOT VALID` aplica sem erro | integração | expansão compatível com dado antigo |
| isolamento: handshake com sessão de A não entra na sala de B, e um evento emitido para B não chega ao cliente de A | isolamento | sala continua pela escola da sessão |
| borda: sessão encerrada no banco recusa o handshake seguinte | integração | realtime segue a mesma regra da API |
| falha: Postgres fora recusa o handshake com código de indisponível, e o cliente reconecta com espalhamento | integração | queda do banco não vira "não autenticado" |
| carga: `npm run carga` verde e `npm run carga:controle-negativo` reprovando pela justiça, com as escolas criadas pelo script | carga (manual) | o cenário do F0 sobrevive à troca |

### Nota sobre a subtarefa 3.2

O `criarEscolaComSessao({ papel })` que a subtarefa pede em `apps/api/test/configuracao-de-teste.ts`
já existia, com outro nome e outro arquivo: é o `BancadaDeSessoes.escolaComSessao(papel)` de
`apps/api/test/sessao-de-teste.ts`, criado na tarefa 2.0. Esta tarefa usou esse helper em vez de
criar um segundo.

### Execução do cenário de carga nesta tarefa

Rodado com este código, depois de o script passar a criar rede, escolas e sessões pelos
comandos do operador (16/09/2026):

- `npm run carga`: **passou** (7 min), código de saída 0. p95 da espera da escola B na base
  14 ms; na carga, a B ficou com 482 interativos concluídos, espera p95 50 ms e máxima 252 ms,
  enquanto a A acumulava 1.866 lotes sem início. Nenhum job falhou e nenhum interativo passou
  de 30 s: os critérios `espera_b` e `interativo_acima_de_30s` ficaram limpos.
- `npm run carga:controle-negativo`: **não reprovou**, código de saída 1, nas duas execuções
  seguidas (B com p95 84 ms e 125 ms, contra o limiar de base + 500 ms). **Este é o critério
  da linha de carga da tabela acima, e ele não foi cumprido nesta execução.** Não é
  intermitência: as duas execuções deram o mesmo.

  A vaga por escola continua fazendo efeito — com ela ligada, a espera dos interativos da
  própria A ficou em p95 6.093 ms; com ela desligada, 356–925 ms. O que não acontece é a
  escola B ser degradada pela A, que é o que o critério mede.

  **Não é "máquina fraca demais".** Em 14/09/2026 o controle negativo reprovou, com a B em
  p95 2,53 s contra o limite de 507 ms (`tasks/prd-fundacao-tecnica/15_task.md`, validação da
  15.0). Entre aquela medição e esta entrou o commit `364049c`, que pôs `UV_THREADPOOL_SIZE=16`
  e `dns_opt` em api, realtime, despachante e worker; na mesma comparação, a espera dos
  interativos da A caiu de p95 10,3 s para 6,1 s, ou seja, a vazão do worker subiu. Essa
  mudança de ambiente é a causa candidata a investigar antes de mexer em qualquer limiar, e a
  pergunta é por que a carga da A deixou de saturar o worker — se ela não satura mais, o
  `npm run carga` verde também prova menos do que diz.

  O que **não** ficou sem prova: a regra 80, item 3, continua com teste que quebra sem ela, em
  `apps/despachante/test/vagas.int.test.ts` (controle negativo da vaga por escola e "a A sem
  vaga não atrasa a B"), que roda no portão de toda tarefa.

  A investigação está no `TODO.md`. **A decisão de manter o critério (e consertar o cenário
  antes de seguir) ou de aceitar a dívida é do Joaquim**, não desta tarefa: a 3.0 mexeu só em
  como as escolas e as sessões do cenário nascem.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%, incluindo `npm run test:infra`
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- `VALIDATE` da FK (deploy posterior, fora do horário letivo, pendência no `TODO.md`)
- Login real (4.0 em diante)
- Cenário `login-7h30` (16.0)
- `CREATE INDEX CONCURRENTLY` no `migrar` (adiado na Tech Spec seção 3)

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-16 05:12:17 | 2026-09-16 05:17:26 | `test-engineer` | 1 | REPROVADO | a5321ae50189a501a |
| 2026-09-16 06:02:30 | 2026-09-16 06:04:58 | `test-engineer` | 2 | APROVADO | a3cc09b8fb6a257e2 |
| 2026-09-16 06:05:49 | 2026-09-16 06:09:07 | `tenancy-guardian` | 1 | APROVADO | a3f35ef15bdfb2a75 |
| 2026-09-16 06:05:36 | 2026-09-16 06:11:23 | `revisor-geral` | 1 | REPROVADO | a72e10c70386a57c4 |
| 2026-09-16 06:06:06 | 2026-09-16 06:12:57 | `infra-guardian` | 1 | APROVADO | a6e4499ee8352c89a |
| 2026-09-16 06:12:32 | 2026-09-16 06:14:24 | `revisor-geral` | 2 | REPROVADO | ac0ad05b5d7340f14 |
| 2026-09-16 06:37:36 | 2026-09-16 06:38:42 | `revisor-geral` | 3 | APROVADO | a6ff292ba637c628e |
| 2026-09-16 06:40:17 | 2026-09-16 06:40:56 | `infra-guardian` | 2 | APROVADO | a8cc0e91c0a16f230 |
| 2026-09-16 06:40:06 | 2026-09-16 06:41:01 | `tenancy-guardian` | 2 | APROVADO | aeec8b794a723d21d |
| 2026-09-16 06:39:58 | 2026-09-16 06:42:17 | `test-engineer` | 3 | APROVADO | a8804f75d3eaf2096 |

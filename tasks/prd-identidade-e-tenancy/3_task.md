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

- [ ] 3.1 — Remover `ACEITAR_TOKEN_SINTETICO`, `EMISSOR_TOKEN_SINTETICO`, `ops:token-sintetico` e o teste do emissor
  - O `verificarToken` aceita só o emissor `educa`
  - `lerConfiguracaoIdentidade` deixa de ler a flag
  - `.env.example`, `infra/compose.yml` e `README.md` atualizados
- [ ] 3.2 — Helpers de teste montam escola e sessão reais
  - **`apps/api/test/configuracao-de-teste.ts`:** ganha `criarEscolaComSessao({ papel })`, que usa `ops:escola` e `ops:sessao-sintetica`, ou os mesmos serviços em processo.
  - **`apps/worker/test/fila-de-teste.ts`:** cria a escola antes de gravar job.
  - **Cenário `justica-entre-escolas`:** `infra/scripts/carga.ts` cria as escolas A, B e C e gera os tokens com `ops:sessao-sintetica --quantidade`.
  - **Nenhum teste é apagado nem pulado.**
- [ ] 3.3 — Handshake do realtime
  - `autenticacaoDoHandshake` passa a usar a mesma leitura de sessão da `GuardaDeSessao` (exportada do núcleo), com o pool de banco do realtime
  - A sala continua sendo a escola do contexto, e o handshake não move `ultimo_uso_em`
  - Com o Postgres fora, a conexão é recusada com código de indisponível, não de não autenticado
  - `apps/realtime/src/config.ts` passa a ler a configuração de banco
- [ ] 3.4 — Migration só com a FK de `escola_id`
  - `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (escola_id) REFERENCES escola(id) NOT VALID` em `job_registro`, `configuracao_operacional_escola` e `uso_infra_diario`, e nada mais no arquivo
  - O `VALIDATE` não entra: fica registrado como pendência no `TODO.md`, com a consulta de órfãos que precisa dar zero antes
  - O comentário "o F1 acrescenta a FK" sai de `configuracao-operacional-escola.ts` e do schema de `job_registro`
- [ ] 3.5 — Testes

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

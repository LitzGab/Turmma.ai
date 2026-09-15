# Tarefa 1.0 — Escola nasce por comando do operador, com auditoria de schema fechado

**Funcionalidade:** identidade-e-tenancy · **Depende de:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `test-engineer`

## Objetivo

O sistema passa a ter rede e escola de verdade, criadas só pelo nosso operador por comando,
e um registro de auditoria que aceita só ids, estados e datas. Antes, "escola" era um UUID
sintético sem tabela.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF1 (escola nasce por comando, sem rota pública, operador não lê dado de pessoa),
  RF19 (o que fica registrado) e o papel "Operador Educa.ia" na seção 4
- `techspec.md`:
  - seção 3: `rede`, `escola`, `auditoria`, a tabela de migrations por tarefa e o parágrafo "Auditoria"
  - seção 5: "Operador"
  - seção 6: o check de escola nula
  - seção 7: o que entra em auditoria e o que nunca entra
- `.claude/rules/10-multitenancy.md`: escola é a raiz do tenant, e toda tabela de domínio
  tem `escola_id`. A `auditoria` só aceita escola nula quando o operador cria a rede, que
  ainda não tem escola
- `.claude/rules/20-lgpd-menores.md`, itens 9 e 10: auditoria não é log e não carrega nome;
  é registro consultável com autor, data e finalidade
- `.claude/rules/00-arquitetura.md`, item 9: erro de domínio tipado, nunca string
- `CLAUDE.md`, D2: sem cadastro público; o cliente é a instituição
- Código existente:
  - `packages/nucleo/src/db/schema/*.ts` e `packages/nucleo/drizzle.config.ts`: como o F0 declara tabela (snake_case, UUIDv7, check no Drizzle)
  - `packages/nucleo/src/db/migrar.ts`: transação única, `lock_timeout`
  - `packages/nucleo/src/db/banco.ts`: o `schema` exportado, que recebe as tabelas novas
  - `apps/api/src/ops/uso.ts` e `apps/api/src/ops/token-sintetico.ts`: formato de comando `ops:*` (parseArgs, erro só com nome da opção, `process.exitCode`)
  - `packages/nucleo/src/config/validar-config.ts`: `validarAmbiente` e `ConfiguracaoInvalida`
  - `packages/nucleo/src/contexto/contexto.ts`: `executarNoContexto`, para o comando abrir o contexto da escola alvo
  - `packages/shared/src/erros/codigo-de-erro.ts`: códigos existentes

## Subtarefas

- [ ] 1.1 — Migration de `rede`, `escola` e `auditoria`
  - `rede`: `id`, `nome`, `tipo` (`prefeitura|grupo|independente`) e `ips_saida inet[]`, que só a 15.0 usa
  - `escola`:
    - `rede_id`, `nome`, `slug unique` em minúsculas com hífen;
    - `inatividade_aluno_min` (padrão 30) e `inatividade_equipe_min` (padrão 120), com check `> 0`;
    - `unique (id)` servindo de alvo das FKs compostas das tarefas seguintes.
  - `auditoria`:
    - `escola_id?`, `autor_usuario_id?`, `autor_operador?`, `acao`, `entidade`, `entidade_id`, `antes jsonb?`, `depois jsonb?`, `finalidade?`, `requisicao_id`, `em`;
    - check `escola_id is not null or (autor_operador is not null and entidade = 'rede')`;
    - check de pelo menos um autor;
    - índice `(escola_id, em)`.
  - `autor_usuario_id` fica sem FK nesta tarefa: `usuario` nasce na 2.0, que acrescenta a FK expandindo
- [ ] 1.2 — `packages/nucleo/src/auditoria`: `RegistroDeAuditoria.gravar(tx, acao, dados)`
  - **Escrita:** grava na transação do chamador.
  - **Ação:** cada `acao` é chave de um mapa de schemas zod `strict` para `antes` e `depois`. Nesta tarefa entram `rede.criada` e `escola.criada`; as tarefas seguintes acrescentam as delas.
  - **Recusa:** ação desconhecida ou campo fora do schema. Os nomes `nome`, `email`, `matricula`, `complemento`, `hash`, `senha` e `segredo` são proibidos em qualquer schema, e um teste confere o mapa inteiro.
  - **Escopo:** a escola vem do contexto. O `autor_operador` só é aceito sem usuário no contexto (rotina de operador).
  - **Leitura:** `AuditoriaRepository.listarDaEscola()` filtra pela escola do contexto. É só para teste e para o F3, sem rota.
- [ ] 1.3 — `apps/api/src/ops/escola.ts` e script `ops:escola` no `package.json`
  - `npm run ops:escola -- rede criar --nome --tipo` e `escola criar --rede <id> --nome --slug`
  - Exige `OPERADOR` (identificador curto da pessoa da equipe, validado por regex) em qualquer ambiente, e grava `autor_operador`
  - Abre o contexto da escola criada para gravar a auditoria dela; a rede é gravada com escola nula
  - Imprime só os ids criados. Slug repetido sai com código tipado (`CONFLITO`) e mensagem sem o valor
  - Nenhum comando do operador lista ou lê pessoa
- [ ] 1.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/rede.ts`, `escola.ts`, `auditoria.ts` | novo |
| `packages/nucleo/src/db/banco.ts`, `packages/nucleo/src/index.ts` | alterado |
| `packages/nucleo/drizzle/0004_*.sql` e `meta/` | novo (gerado por `npm run db:gerar`) |
| `packages/nucleo/src/auditoria/registro-de-auditoria.ts`, `acoes.ts`, `auditoria.repository.ts` | novo |
| `apps/api/src/ops/escola.ts` | novo |
| `package.json` (script `ops:escola`), `.env.example` (`OPERADOR`) | alterado |
| `packages/nucleo/src/auditoria/*.test.ts`, `apps/api/test/ops-escola.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: `ops:escola` cria rede e escola e grava as duas auditorias com `autor_operador`; a saída tem só os ids | integração | RF1 e RF19 para o operador |
| borda: `ops:escola` repetido com o mesmo slug sai com `CONFLITO` e a mensagem não contém o slug | integração | slug único, erro tipado sem valor |
| borda: sem `OPERADOR` no ambiente, o comando recusa antes de tocar o banco | integração | toda ação do operador tem autor |
| permissão: lista as rotas registradas no Nest e nenhuma cria rede nem escola | integração | RF1; quebra no dia em que alguém criar a rota |
| privacidade: schema de auditoria recebendo `nome`, `email`, `matricula`, `complemento`, `hash` e `segredo` é recusado, e nenhum schema do mapa declara esses campos | unidade | lista fechada da seção 3 |
| borda: o banco recusa auditoria com escola nula e autor usuário, e com escola nula e entidade diferente de `rede` | integração | check da seção 3 |
| isolamento: com escolas A e B, cada uma com auditoria, `listarDaEscola()` no contexto de A não traz linha de B | isolamento | quebra se tirar o filtro de escola |
| migration: transação segurando `job_registro` durante a migração respeita o `lock_timeout` com 3 tentativas e não deixa nada aplicado pela metade | integração | expansão segura (regra 80, item 9) |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- `ano_letivo`, `conta`, `usuario`, `sessao`, `registro_acesso` e a FK de `autor_usuario_id` (2.0)
- FK de `escola_id` nas tabelas do F0 (3.0)
- `ips_saida` em uso, com o limite por IP da rota de e-mail (15.0)
- Consulta, exportação e retenção da auditoria (F3)
- Convite do primeiro coordenador (7.0)

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

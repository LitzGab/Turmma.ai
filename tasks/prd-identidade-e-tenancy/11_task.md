# Tarefa 11.0 — Aluno entra pelo endereço da escola com matrícula

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 4.0, 9.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `test-engineer`

## Objetivo

O aluno entra por `/e/:slug` com matrícula e senha, sem e-mail. A mesma matrícula em outra
escola é outra conta, e errar a senha segura só a conta dele, nunca os colegas atrás do mesmo
IP. Ao terminar, existe login de aluno com sessão de inatividade própria (padrão 30 min).

## Contexto necessário

- `docs/visao-produto.md` (sempre), com atenção a Enzo e Lara (seção 4)
- `prd.md`: RF7, RF11, RF13 e RF15; casos de borda "Aluno transferido de escola", "Chromebook
  do carrinho entre duas turmas" e "35 logins do mesmo IP"
- `techspec.md`:
  - seção 1, "Antes do contexto": o slug resolve a escola e abre um contexto de escola sem usuário;
  - seção 3: `credencial_matricula`, e `escola.inatividade_aluno_min`;
  - seção 4: `GET /v1/escolas/:slug/acesso` e `POST /v1/sessao/matricula`;
  - seção 5: "Baldes do semáforo" (só a regra da matrícula, que o semáforo da 14.0 vai usar), "Tentativas", "Etapas" e "Atividade";
  - seção 6: desvio do `ResolucaoDeTenantRepository` (escola por slug) e os testes de isolamento de matrícula;
  - seção 7: log e redact.
- `.claude/rules/10-multitenancy.md`: matrícula é única por escola, e a leitura da credencial
  acontece com escopo, pelo contexto de escola aberto a partir do slug, nunca com escola vinda
  do corpo
- `.claude/rules/20-lgpd-menores.md`, itens 2, 6 e 9: aluno sem e-mail; "não encontrado" igual a
  "senha errada"; nunca logar matrícula
- `.claude/rules/60-dominio.md`, itens 6 e 7: matrícula por escola, aluno nunca por autocadastro
- `.claude/rules/80-infra-e-carga.md`, item 1, e `docs/infra.md` seções 3.1 e 5.1: o IP da
  escola é um só; a proteção é por conta (escola + matrícula)
- Código existente:
  - `packages/nucleo/src/limite/limitador.ts` e `chaves.ts`: o seguro em memória do F0;
  - `packages/nucleo/src/limite/rota-anonima.decorator.ts`: `@RotaAnonima`;
  - `packages/nucleo/src/contexto/contexto.ts`: onde nasce o contexto de escola sem usuário (criado na 2.0).
- O que as tarefas anteriores criam:
  - `ResolucaoDeTenantRepository`, `GuardaDeSessao` e `EmissorDeToken` (criados na 2.0);
  - login por e-mail, contador `conhecido`/`outro` no Redis de fila, cookies `educa_sessao` e `educa_dispositivo`, desafio e `registro_acesso` (criados na 4.0);
  - inatividade por papel e `atividade` (criados na 5.0);
  - `usuario` aluno com vínculo confirmado na turma (criado na 9.0).
- Seed sintético: os alunos são fictícios e nunca têm e-mail (regra 20, item 17)

## Subtarefas

- [x] 11.1 — Migration de `credencial_matricula` e as duas rotas.
  - **Tabela:** `E usuario_id, matricula, senha_hash`, com `unique (escola_id, matricula)` e FK composta `(escola_id, usuario_id)`.
  - **`GET /v1/escolas/:slug/acesso`:** anônima, responde `{ nome, provedores: ('google'|'microsoft')[] }` e nunca devolve `hd` nem `tid`. Aqui a lista vem vazia, porque `provedor_escola` nasce na 13.0.
  - **`POST /v1/sessao/matricula`:** `{ slug, matricula, senha }`. Resolve a escola pelo slug no `ResolucaoDeTenantRepository`, abre o contexto de escola sem usuário e lê a credencial pelo repository com escopo.
  - **Senha:** argon2id, com o hash fixo para slug inexistente, matrícula inexistente e aluno desativado.
  - **Resposta:** segue as etapas da 4.0 (aluno com um usuário vai direto a `pronta`), grava `sessao` com `metodo = matricula` e o `registro_acesso`.
- [x] 11.2 — Contador com a escola na chave, e inatividade do aluno.
  - **Contador:** chave `login:{HMAC(LOGIN_CHAVE_CONTADOR, escola_id|matricula)}:{conhecido|outro}`, antes do hash. Slug inexistente usa o mesmo formato, com um id fixo de "escola desconhecida", para a resposta sair igual.
  - **Cookie:** `educa_dispositivo` com a entrada `HMAC(LOGIN_CHAVE_DISPOSITIVO_V{n}, escola_id|matricula)` depois do acerto.
  - **Inatividade:** a sessão do aluno usa `escola.inatividade_aluno_min`, que a 5.0 já expõe em `PUT /v1/escola/sessao`, e a tolerância de 5 min.
  - **Métricas:** `login.falhas{escola_id}` e `login.conta_segurada` também contam a matrícula.
  - **Log:** só `evento`, `escolaId`, `usuarioId` quando houver, e o código. Nunca matrícula nem slug digitado.
- [x] 11.3 — Testes (tabela abaixo). Montam alunos com o seed, e todo teste de isolamento
  tem linha real na escola B.

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/credencial-matricula.ts`, migration correspondente em `packages/nucleo/drizzle/` | novo |
| `apps/api/src/sessao/matricula.controller.ts`, `matricula.service.ts`, `credencial-matricula.repository.ts` | novo |
| `apps/api/src/sessao/acesso-da-escola.controller.ts` | novo |
| `apps/api/src/sessao/resolucao-de-tenant.repository.ts` | alterado (escola por slug, se ainda não existir) |
| `packages/shared/src/sessao/matricula.ts`, `acesso-da-escola.ts` | novo |
| seed sintético de alunos com matrícula | alterado |
| `apps/api/test/sessao-matricula.int.test.ts`, `acesso-da-escola.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: aluno com matrícula e senha certas no slug da própria escola recebe sessão `metodo = matricula`, e `/v1/eu` devolve o `usuario_id` dele | integração | RF7 |
| isolamento: matrícula 1234 existe em A e em B, com senhas diferentes; cada aluno só entra no slug da própria escola, e a senha de A no slug de B é recusada | isolamento | quebra se a credencial for lida sem a escola do slug |
| isolamento: 5 erros seguram a matrícula 1234 em A, e a 1234 de B continua entrando | isolamento | quebra se a chave do contador não levar `escola_id` |
| borda: slug inexistente, matrícula inexistente e senha errada dão o mesmo status e o mesmo corpo, e o hash roda uma vez em cada (contagem de chamadas ao argon2, sem medir tempo) | integração | não revela existência (regra 20, item 6) |
| borda: 35 alunos do mesmo IP entram no mesmo minuto; Enzo, com 10 senhas erradas, fica segurado com 429 `CONTA_SEGURADA`, e 399 outros do mesmo IP entram sem 429 | integração | RF11; regra 80, item 1 |
| concorrência: 10 tentativas erradas em paralelo (`Promise.all`) da mesma matrícula avaliam no máximo 5 | concorrência | contador atômico no Redis de fila |
| borda: aluno transferido (usuário desativado em A) é recusado com a resposta de senha errada, e a conta nova dele em B entra no slug de B | integração | fim de vínculo desativa o acesso |
| borda: dois "Enzo Martins" na mesma turma, com matrículas diferentes; cada um recebe o próprio `usuario_id` em `/v1/eu` | integração | nome igual não confunde identidade |
| borda: coordenação de A muda a inatividade para 15 min; o aluno de A vence com 20 min sem atividade, e o de B continua com 30 | integração | RF13 configurável por escola |
| permissão: sessão de aluno em `GET /v1/turmas/:id/alunos` é recusada | integração | aluno vê só a si |
| privacidade: `/acesso` devolve só `nome` e o tipo do provedor; o log do login não contém matrícula nem slug digitado | integração | regra 20, item 9 |

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

- Semáforo de hash com baldes e 503 com `Retry-After`: 14.0
- Rebaixamento por IP×escola: 15.0
- Botão da conta Google ou Microsoft e `provedor_escola`: 13.0
- Tela `/e/:slug`: 19.0
- Reset de senha do aluno pela escola e lista de nomes: F2
- Desativação do aluno apagando o `senha_hash`: 17.0

## Notas da implementação

Leituras que tomei onde a tarefa deixava margem, escolhendo a que protege o aluno e a escola:

- **`login.falhas{escola_id}` fica para a 15.3.** A 11.2 diz que a métrica "também conta a matrícula", mas ela ainda não
  existe: nasce na 15.3, e a 14.2 é quem abre `METRICAS_COM_ESCOLA` às métricas de login, com o teste de cardinalidade.
  Criá-la aqui poria `escola_id` numa métrica fora de job antes da lista fechada da 14.0, contra o teste de hoje
  (`escola_id` só em job). O que existe, `login.conta_segurada`, conta também a matrícula, com teste.
- **Slug inexistente** segue o mesmo caminho da matrícula inexistente: contador com a "escola desconhecida"
  (`00000000-…`) na chave, hash fixo e a mesma resposta, até o `CONTA_SEGURADA`. Não grava `registro_acesso`: sem
  escola, a linha seria uma segunda exceção ao `escola_id` nulo, que a Tech Spec só admite na falha por e-mail. Slug
  fora do formato responde como o inexistente, sem ir ao banco. O slug é público (`/acesso`), então a diferença de uma
  consulta entre slug existente e inexistente não revela nada.
- **Falha com escola conhecida** grava `login_falho` na escola do slug e **sem usuário**, como a falha por e-mail: a
  linha não diz se a matrícula existe. O método novo é `RegistroDeAcessoRepository.gravarFalha`, com a escola do
  contexto.
- **Aluno desativado** passa pelo hash fixo (a credencial é lida só de aluno ativo). O filtro `papel = 'aluno'` também
  está na leitura: o banco aceita credencial apontando para usuário de outro papel, e o login não.
- **Login não exige vínculo confirmado no ano em curso:** em janeiro não há ano em curso, e o aluno ainda lê o próprio
  histórico (RF16). Quem corta o acesso é a desativação (17.0), já recusada aqui.
- **Nome da escola no `/acesso`** é lido por `AcessoDaEscolaRepository`, com a escola do contexto aberto pelo slug, e
  não por um método novo sem escopo: a `ResolucaoDeTenantRepository` continua com os mesmos métodos.
- **Matrícula** sem espaço nas pontas, com a caixa como digitada, até 40 caracteres (check no banco e contrato).
- **Seed:** `criarAlunosComMatricula` em `sessoes-sinteticas.ts` (só `AMBIENTE=local`), usado pela bancada de teste.
- **Mutações conferidas à mão** (cada uma deixou testes vermelhos): tirar a escola da leitura da credencial; tirar a
  escola da chave do contador.
- **Arquivos fora da lista prevista:** `acesso-da-escola.service.ts`, `acesso-publico.repository.ts` (o nome evita o padrão `escola.repository` que o teste do operador procura),
  `escola-sem-usuario.ts`, `conclusao-de-login.ts`, `registro-de-acesso.repository.ts`, `sessao.module.ts`,
  `sessoes-sinteticas.ts`, `credencial-matricula.repository.int.test.ts`, `test/sessao-de-teste.ts`, `banco.ts` e os
  índices de `nucleo` e `shared`. `resolucao-de-tenant.repository.ts` não mudou: `escolaPorSlug` já existia (7.0).
- **Carga:** o cenário `login-7h30` com matrícula é da 16.0.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-18 11:45:39 | 2026-09-18 11:47:19 | `test-engineer` | 1 | APROVADO | a86b9754fc5db5ffd |
| 2026-09-18 11:52:23 | 2026-09-18 11:52:55 | `test-engineer` | 2 | APROVADO | a9e1ed164596543cb |
| 2026-09-18 12:16:35 | 2026-09-18 12:17:21 | `tenancy-guardian` | 1 | APROVADO | aafbebe2649650dce |
| 2026-09-18 12:16:40 | 2026-09-18 12:17:42 | `privacy-guardian` | 1 | APROVADO | a8f434bba8e12c194 |
| 2026-09-18 12:16:46 | 2026-09-18 12:17:45 | `infra-guardian` | 1 | APROVADO | a20d8452c06b6aff0 |
| 2026-09-18 12:16:29 | 2026-09-18 12:17:47 | `revisor-geral` | 1 | APROVADO | af1454b4eb92bb1b9 |

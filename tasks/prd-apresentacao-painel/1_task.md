# Tarefa 1.0 — Rede e escola pelo painel, com o autor conferido na transação

**Funcionalidade:** apresentacao-painel · **Depende de:** nenhuma · **Paralelo com:** 9.0, 10.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O operador cria rede e escola pelo painel, sem duplicar no clique duplo, e toda escrita do operador
(painel e `ops:*`) confere o autor ativo dentro da própria transação.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 1, 4, 5 ("Autor", "Idempotência"), 6, 7c (linhas "Autor ativo" e "Rede ou escola
  repetida") e 11
- `cenarios.md`: E1–E5, E11, E12, E14, I2, I3, A3
- Regras 00, 10 (itens 7 e 9), 20 (itens 9 e 10), 40 e 80 (item 7)
- `retro.md` da A0, "Pendências para a A0b": as linhas 3.0, 4.0 e 5.0 (`throw new Error`) saem aqui
- Código:
  - `apps/api/src/ops/escola.ts`, `escola.repository.ts`, `escola.repository.test.ts` (a cerca
    `IMPORTADORES_PERMITIDOS_DO_COMANDO`) e `comando.ts` (`conferirOperador`, fora da transação hoje)
  - `apps/api/src/operacao/operador.repository.ts` — `situacaoDoAutor`; o `desativar` começa por
    `for update` na linha do operador
  - `eu.controller.ts` e `packages/shared/src/operacao/eu.ts` — os padrões de rota e de contrato
  - `apps/api/test/arquitetura.test.ts` — C36, C41 e C46 varrem as rotas registradas

## Subtarefas

- [ ] 1.1 — `OperadorRepository.autorAtivoNaTransacao(tx, quem)` (7c, linha "Autor ativo"), com a regra
  do bootstrap no comando; os cinco `ops:*` de escola passam a usá-lo dentro da transação (o `uso`, que
  só lê, numa transação curta). O `throw new Error` sem código do repository vira erro tipado
- [ ] 1.2 — O formato do apelido fica só em `FORMATO_OPERADOR`, que o contrato de `shared` usa; um
  teste compara a expressão dos checks do banco com a constante
- [ ] 1.3 — `criarRede` e `criarEscola` recebem o `id` do pedido, com a gravação da 7c (linha "Rede ou
  escola repetida"); justificativas do `@SemEscopo`: "comando ou painel do operador"; o comando sorteia
  o próprio id
- [ ] 1.4 — `painel.service.ts` e `painel.controller.ts` com `GET /redes` (até 200), `POST /redes`,
  `POST /escolas`; contratos estritos em `packages/shared/src/operacao/painel.ts` (`id` UUID v4 ou
  v7). Log `operacao.{rede,escola}.criada`, só com ids
- [ ] 1.5 — `IMPORTADORES_PERMITIDOS_DO_COMANDO` ganha `apps/api/src/operacao/painel.service.ts`, e o
  título do teste deixa de dizer "não chegam a controller nenhum"
- [ ] 1.6 — Documentos do desvio (seção 11): `docs/arquitetura.md`, módulo `operacao` como o único
  alcance entre escolas, e `docs/modelo-de-dados.md`, "Estrutura institucional": o id de rede e escola
  pode vir do pedido
- [ ] 1.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/operacao/operador.repository.ts` | alterado |
| `apps/api/src/operacao/painel.controller.ts`, `painel.service.ts` | novo |
| `apps/api/src/operacao/operacao.module.ts` | alterado |
| `apps/api/src/ops/` (`escola`, `escola.repository` e o teste, `comando`, e os quatro outros `ops:*` de escola) | alterado |
| `packages/shared/src/operacao/painel.ts`, `index.ts` | novo, alterado |
| `apps/api/test/painel-escrita.int.test.ts` | novo |
| `docs/arquitetura.md`, `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E1 | integração | rede com auditoria sem escola, escola com auditoria na escola, autor = apelido da sessão |
| E2 | integração | dois `POST` iguais em paralelo: uma linha, uma auditoria, o mesmo id nas duas respostas |
| E3, E4, E5 | integração | mesmo id com outros dados, e ids diferentes com o mesmo slug em paralelo: `CONFLITO`, nunca 500, nada a mais gravado; rede inexistente: `NAO_ENCONTRADO` |
| E11 (criar escola, e os cinco `ops:*`) | integração | com o `desativar` segurando a linha, a escrita espera o `for share` e responde 401 sem gravar; na outra ordem, entra. Pelo comando, nos cinco `ops:*`: cada um aparece em `pg_stat_activity` esperando o `for share` antes de o `desativar` confirmar; depois, código 2, nada gravado. O gatilho de teste nasce aqui e a E15 o reusa |
| 1.1, 1.2 | unidade | o erro tipado no lugar do `throw new Error`; os checks do banco com a expressão de `FORMATO_OPERADOR` |
| E12 | integração | corpo com `autor`: 400, sem auditoria |
| E14 | integração | 429 com `Retry-After` pelo `rl:op` no `POST /escolas` |
| I2, I3 | arquitetura | a cerca do comando; os dois `@SemEscopo`; as varreduras da A0 com as rotas novas |
| A3 (rede e escola) | integração | log: a linha capturada não leva nome, slug nem e-mail |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --infra`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale
  para o código atual
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Convite, lista, uso e telas (2.0 a 8.0).

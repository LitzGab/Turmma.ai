# Tarefa 12.0 — Web: seletor de escola (P30) com o contrato de `/v1/eu`, e a "Minha turma" do aluno

**Funcionalidade:** apresentacao-escola · **Depende de:** 11.0, 8.0 · **Paralelo com:** 9.0, 10.0, 13.0, 14.0, 15.0
**Subagentes obrigatórios:** `frontend-reviewer`, `tenancy-guardian`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Quem tem vínculo em mais de uma escola troca de escola pelo seletor no topo da lateral, e nenhuma requisição, resposta
ou cache depois da troca traz dado da escola anterior; o aluno aprovado vê a própria turma, sem colegas.

## Contexto necessário

- `docs/interface.md` 11.1 (o seletor) e `docs/pendencias-dos-mockups.md`, P30
- `techspec.md` seções 4 (`minha-turma`), 9 ("Seletor") e 11 (regra 50: sem sigla, turno nem número de turmas)
- `cenarios.md`: W3, W13, W4 (linha "Minha turma"), W12
- Regras 10 (itens 3, 8), 20 (item 4), 50
- Código:
  - `packages/shared/src/sessao/eu.ts` (`esquemaAcessoDaConta`: hoje `usuarioId`, `escolaNome`, `papel`)
  - `apps/api/src/sessao/eu.repository.ts`, `eu.service.ts`, `eu.repository.int.test.ts`; o `@SemEscopo` da
    `ResolucaoDeTenantRepository` que lista as escolas da conta (a justificativa cita os campos: muda junto)
  - `apps/web/src/componentes/SeletorDeEscola.tsx`, `apps/web/src/api/sessao.ts` (`trocarDeEscola`),
    `apps/web/src/main.tsx` (o `resetQueries` que já existe)
  - `e2e/escola-e-vinculos.spec.ts` — a troca de escola do F1 e as fixtures de professor em duas escolas
  - `GET minha-turma` (8.0)

## Subtarefas

- [ ] 12.1 — `/v1/eu`: cada acesso ganha o nome da rede, ao lado da escola e do papel; nada mais (sem número de
  turmas, sem dado de dentro da outra escola). A justificativa do `@SemEscopo` acompanha
- [ ] 12.2 — Seletor no topo da lateral, no formato de espaço de trabalho da 11.1, com a marca de escolhido; com uma
  escola só, mostra o nome e não abre. A troca só faz `resetQueries` depois de o token novo estar em uso
- [ ] 12.3 — "Minha turma" na área do aluno: escola, turma e série; nunca vazia; linha na tabela de navegação
- [ ] 12.4 — Teto do chunk `aluno-*` no `.size-limit.json`
- [ ] 12.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/sessao/eu.ts`; `apps/api/src/sessao/eu.repository.ts`, `resolucao-de-tenant.repository.ts` | alterado |
| `apps/api/src/sessao/eu.repository.int.test.ts` | alterado |
| `apps/web/src/componentes/SeletorDeEscola.tsx`, `apps/web/src/api/sessao.ts` | alterado |
| `apps/web/src/areas/aluno/MinhaTurma.tsx`, `apps/web/src/api/minha-turma.ts`, `areas/navegacao.ts` | novo, alterado |
| `.size-limit.json`, `e2e/troca-de-escola.spec.ts`, `e2e/minha-turma.spec.ts` | alterado, novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| contrato de `/v1/eu` | integração | cada acesso com escola, rede e papel, e nenhum outro campo; nada da outra escola (número de turmas, nomes) |
| W3 | e2e | o professor de A e B troca para B: depois da troca, nenhuma requisição leva o token de A, nenhuma resposta traz id de A, e o cache do TanStack não guarda chave de A |
| W13 | e2e | escola, rede e papel, sem número de turmas; com uma escola, mostra o nome e não abre |
| W4 (Minha turma) | e2e | carregando, com dado e erro com a rota interceptada; nunca vazia |
| W12 (Minha turma, seletor) | e2e | 360 px sem rolagem; alvos de 44 px; o seletor abre e escolhe só com teclado |
| recomeço da tela | e2e | segunda pessoa: sai o professor de A e B, entra o aluno na mesma aba, sem seletor nem cache do anterior; mesma entrada: escolher a escola em que já se está não troca o token; resposta atrasada: a lista de A que chega depois da troca não aparece em B; falha com o seletor aberto: a troca recusada mostra o aviso, e o aviso e o foco saem ao reabrir |
| log novo | — | a tarefa não escreve log |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [ ] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral` e os guardiões, com
  rodada que vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Sigla, turno e número de turmas (seção 11); o calendário que junta escolas (F8).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| spec, rodadas 1 a 5 | O seletor segue a 11.1 no lugar (topo da lateral) e na marca de escolhido; o que ela lista e não existe (sigla, turno, turmas) fica fora pela seção 11. Conferir com o Gabriel se o seletor sem esses campos ainda lê como espaço de trabalho | `/validar` |

# Correção — a aba "Empresas que recebem dados" mostrava como recebida pela escola a empresa de alcance "todas" cuja vigência é anterior à existência da escola

**Origem:** uso (triagem de 09/10/2026 sobre a tarefa 8.0, `tasks/prd-lgpd-e-titular/8_task.md`, commit `b875e52`; decisão do Joaquim em 09/10/2026: coluna `escola.criada_em`)
**Subagentes obrigatórios:** `tenancy-guardian`, `infra-guardian`, `privacy-guardian`, `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. A correção toca repository, schema e migration. test-engineer é obrigatório em toda correção, marcado ou não. Altera mais de 5 arquivos fora de tasks/ (schema, migration e journal, repository, três testes e o modelo de dados): `revisor-geral` entra pelo passo 5. -->

## Sintoma

A aba "Empresas que recebem dados" (`GET /v1/privacidade/suboperadores`) devolvia, para uma escola criada hoje, a empresa de
alcance `todas` encerrada antes de a escola existir, como passada, e a vigente cadastrada antes dela com "Desde" anterior à
escola. A escola passava a dizer ao titular que a empresa recebeu dado da escola quando nunca recebeu.

## Fora desta correção

Nada: nenhuma tarefa em curso. O `estado.md` alterado na árvore é do Orquestrador e fica fora do commit; os `N_task.md`
pendentes do Arquiteto não são desta correção.

## Causa

O `todas` não tem ligação com a escola (a ligação é só do `lista`), então a vigência que a escola lia era a da própria empresa,
sem nenhum limite inferior. O banco não guardava quando a escola passou a existir; sem esse instante, o repositório não tinha
contra o que comparar. Da tarefa 8.0 (`b875e52`).

## Teste que reproduz

`apps/api/test/suboperador.int.test.ts`, quatro casos novos. Os três primeiros ficaram vermelhos antes (rodados com o repositório de
`HEAD` e a coluna já na migration: 3 falhas, 13 passando) e verdes depois; o do "lista" é próprio (rodada 1) e se prova pela mutação abaixo:

- `RF7, a vigência nunca é anterior à escola: o "todas" encerrado antes de ela existir não aparece, e aparece como passado para a que já existia`
  (três escolas, de `criada_em` antes, no meio e depois da vigência);
- `RF7, a vigência nunca é anterior à escola: o "todas" vigente cadastrado antes dela começa para ela no dia em que ela existiu`;
- `RF7, a vigência nunca é anterior à escola: o "lista" não muda, nem o início nem a presença da linha, mesmo com o fim da empresa anterior ao dia em que a escola existiu`;
- `RF7, a vigência nunca é anterior à escola, borda: o fim igual ao dia em que ela existiu fica fora; um segundo depois aparece como passado, a partir desse dia`.

Os dois casos existentes que mudam: `RF7, vigência da escola` (a escola do teste ganha `criada_em` anterior à empresa, para o
início continuar sendo o da empresa) e `RF7, a ordem` (a escola ganha `criada_em` anterior às duas vigências).

Também:

- `apps/api/test/ops-escola.int.test.ts › caminho feliz: cria rede e escola…`: `criada_em` preenchida pelo banco, entre o antes e
  o depois da chamada e igual ao `em` da auditoria `escola.criada`, sem o código informar;
- `apps/api/test/arquitetura.test.ts › o repositório da escola não escreve nas duas tabelas, nem em outra: só lê`: os schemas que
  o leitor importa são exatamente `escola` e `suboperador` (o detector do grupo não enxerga import por caminho relativo).

O `update` da migration não tem teste automatizado (nenhum teste roda migration, e o banco de teste já nasce com a coluna).
Conferido à mão numa transação desfeita (`begin … rollback`) no banco de teste, com a coluna removida e a migration reaplicada:
as 204 escolas existentes ficaram com `criada_em` igual ao `em` da auditoria `escola.criada` e, numa escola inserida sem essa
auditoria, `criada_em = now()` (o instante da migration).

## Correção

- `escola.criada_em timestamptz not null default now()` (`packages/nucleo/src/db/schema/escola.ts`), na migration
  `0030_escola_criada_em.sql`, só expansão (regra 80, item 9): o código anterior insere a escola sem a coluna e recebe o padrão.
  Depois do `add column`, um `update` preenche as escolas existentes com o `em` mais antigo da auditoria `escola.criada` de cada
  uma (subconsulta correlacionada pela escola, o que usa `auditoria_escola_em_idx`). O `RedeEEscolaRepository.criarEscola` não
  muda. Não é dado de pessoa e não entra em DTO.
- `SuboperadorDaEscolaRepository.daEscola` junta a `escola` do contexto (`escola.id = contexto`) e, só para a linha de alcance
  `todas`, lê o início como `greatest(suboperador.inicio, escola.criada_em)` e não devolve a linha com `fim <= escola.criada_em`.
  A comparação é feita no banco; o filtro entra no `and` com o escopo, que continua entre parênteses. Com ligação nada muda.
- `docs/modelo-de-dados.md` (a escola e "Os suboperadores").
- O DTO, a tela, os textos, o e2e, o `OperacaoPrivacidadeRepository` e o compartilhamento não mudam.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-09 13:33:24 | 2026-10-09 13:34:47 | `test-engineer` | 1 | REPROVADO | ae3811fee7f9f9a85 |
| 2026-10-09 13:34:56 | 2026-10-09 13:35:26 | `tenancy-guardian` | 1 | APROVADO | a850d3ae871533fd1 |
| 2026-10-09 13:35:00 | 2026-10-09 13:35:30 | `privacy-guardian` | 1 | APROVADO | a85575fd0ab4b4ca1 |
| 2026-10-09 13:34:58 | 2026-10-09 13:35:33 | `infra-guardian` | 1 | APROVADO | ae46fa1146e89250c |
| 2026-10-09 13:34:54 | 2026-10-09 13:35:37 | `revisor-geral` | 1 | REPROVADO | a69500a7720a6f1a7 |

## Mutações

| Cláusula | Teste que a prova | Mutação feita |
|---|---|---|
| `ne(suboperador.alcance, 'todas')` no filtro de `daEscola` (a regra é só da linha sem ligação) | `suboperador.int.test.ts › RF7, a vigência nunca é anterior à escola: o "lista" não muda…` | tirada do `or(…)`: o teste ficou vermelho (`[]` no lugar de uma linha, porque o `fim` da empresa, -12 dias, é anterior ao `criada_em`, -10); recolocada: 17 verdes |
| `gt(suboperador.fim, escola.criadaEm)` e o `greatest` do início | os três casos do "todas" (antes/no meio/depois, vigente e borda) | vermelhos com o repositório de `HEAD` (3 falhas) |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª), privacy-guardian (1ª), infra-guardian (1ª), revisor-geral (1ª) | Teste automatizado do `update` de preenchimento da migration `0030_escola_criada_em.sql` (por exemplo em `packages/nucleo/src/db/migrar.int.test.ts`: aplicar o SQL sobre uma escola com auditoria `escola.criada` antiga e outra sem, e conferir as duas datas) | `/validar` da funcionalidade e antes do piloto; já declarado na seção "Teste que reproduz" desta correção e no `cenarios.md`. Teste novo de migração muda o desenho do banco de teste, não é barato |
| tenancy-guardian (1ª) | Teste de arquitetura que procure escrita em `escola.criadaEm` fora da migration, e frase no comentário do schema | Recusada na parte do comentário: `docs/modelo-de-dados.md` (linha 19) já diz "nenhum código a informa nem a altera". O teste de arquitetura vai para `TODO.md`, junto de quando o repositório da escola ganhar um segundo método de leitura |
| privacy-guardian (1ª) | Pôr o filtro de vigência num helper único coberto pelo teste de arquitetura, se surgir um segundo método de leitura | Sem segundo método hoje; entra na tarefa que criar o segundo método de leitura de `SuboperadorDaEscolaRepository` |
| 2026-10-09 13:39:10 | 2026-10-09 13:39:36 | `test-engineer` | 2 | APROVADO | ac52840a44d6efcc1 |
| 2026-10-09 13:39:47 | 2026-10-09 13:40:07 | `revisor-geral` | 2 | APROVADO | a34c4ea168583ff06 |

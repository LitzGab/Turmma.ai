# Tarefa 10.0 — O ciclo do operador e a dependência `sessao` → `operacao` somem

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** pequeno

## Objetivo

Os tipos da sessão do operador saem do repository para o arquivo de prazos, e `ConferenciaDoAutor` vai para `sessao/`:
some o ciclo `operador.repository ↔ prazos-da-sessao`, e `sessao/` deixa de importar `operacao/`. Comportamento igual.

## Contexto necessário

- `onda-1a.md` §2, "T7", "Os ciclos (10.0 e 11.0)"; `techspec.md` §5; `prd.md` RF10
- Regra 00 (camadas)
- `apps/api/src/operacao/operador.repository.ts:63` (`ConferenciaDoAutor`) e `:74` (`SessaoDeOperadorParaGuarda`) e `:86`
  (`SessaoDeOperadorParaRenovar`)
- `apps/api/src/operacao/prazos-da-sessao.ts:1`: o import que fecha o ciclo
- Quem importa `ConferenciaDoAutor` de `operacao/`: em `sessao/`, `convite.service.ts:25` e `redefinicao-de-mfa.ts:5`; em
  `ops/`, `comando.ts`, `suboperador.ts`, `privacidade.ts`, `retencao.ts`, `incidente.ts`, `uso.ts`,
  `revogar-acessos-sala.ts`, `escola.ts`; e `operacao/painel.service.ts`
- Quem importa `SessaoDeOperadorParaGuarda`: `guarda-de-operador.ts:16` e `prazos-da-sessao.test.ts:2`
- A trava definitiva é da 12.0 (depcruise); aqui o `it` é provisório

## Subtarefas

- [ ] 10.1 — `SessaoDeOperadorParaGuarda` e `SessaoDeOperadorParaRenovar` passam a morar em `operacao/prazos-da-sessao.ts`, e o repository
  os importa de lá
- [ ] 10.2 — `ConferenciaDoAutor` vai para `apps/api/src/sessao/conferencia-do-autor.ts`, e todos os importadores trocam o
  caminho, sem reexportar do lugar antigo
- [ ] 10.3 — Testes: caracterização verde antes e depois, e um `it` provisório em `apps/api/test/arquitetura.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/conferencia-do-autor.ts` | novo |
| `apps/api/src/operacao/operador.repository.ts` | alterado |
| `apps/api/src/operacao/prazos-da-sessao.ts`, `prazos-da-sessao.test.ts` | alterado |
| `apps/api/src/operacao/guarda-de-operador.ts`, `painel.service.ts` | alterado |
| `apps/api/src/sessao/convite.service.ts`, `redefinicao-de-mfa.ts` | alterado |
| `apps/api/src/ops/{comando,suboperador,privacidade,retencao,incidente,uso,revogar-acessos-sala,escola}.ts` | alterado |
| `apps/api/test/arquitetura.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| Caracterização: `prazos-da-sessao.test.ts` verde antes e depois, com o tipo do arquivo novo | unidade | a validade da sessão do operador não muda | nenhuma |
| Caracterização: `convite-operador.int.test.ts` verde antes e depois | integração | o convite pelo operador mantém o autor auditado | nenhuma |
| Caracterização: `ops-operador.int.test.ts` verde antes e depois | integração | a redefinição do MFA pelo operador também | nenhuma |
| Nenhum arquivo de `apps/api/src/sessao/**` importa `../operacao/` (`it` provisório até a 12.0) | unidade | `sessao → operacao` sumiu | devolver o `import type { ConferenciaDoAutor } from '../operacao/operador.repository.js'` em `convite.service.ts` |
| `operacao/prazos-da-sessao.ts` não importa `operador.repository` | unidade | o ciclo sumiu | devolver o `import type { SessaoDeOperadorParaGuarda }` |

Sem isolamento novo (nenhuma consulta muda), concorrência nem log.

## Como testar

- O `it` provisório copia `apps/api/test/arquitetura.test.ts › fora de teste, só o painel.service.ts o importa` (com
  `arquivosDoRepositorio()` e `semComentarios`), filtrando `apps/api/src/sessao/` e procurando `from '../operacao/`
- Para a caracterização: `npx vitest run --project unidade apps/api/src/operacao/prazos-da-sessao.test.ts` e
  `npx vitest run --project integracao apps/api/test/convite-operador.int.test.ts apps/api/test/ops-operador.int.test.ts`
- Armadilha: mudança só de `import type` não muda o comportamento, mas o hook conta como código; o `typecheck` e o
  `arquitetura.test.ts` são o que prova

## Fora do escopo desta tarefa

Os ciclos de `login.service` (11.0) e a regra do depcruise (12.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


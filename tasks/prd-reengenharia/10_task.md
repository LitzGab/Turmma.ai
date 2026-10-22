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

- [x] 10.1 — `SessaoDeOperadorParaGuarda` e `SessaoDeOperadorParaRenovar` passam a morar em `operacao/prazos-da-sessao.ts`, e o repository
  os importa de lá
- [x] 10.2 — `ConferenciaDoAutor` vai para `apps/api/src/sessao/conferencia-do-autor.ts`, e todos os importadores trocam o
  caminho, sem reexportar do lugar antigo
- [x] 10.3 — Testes: caracterização verde antes e depois, e um `it` provisório em `apps/api/test/arquitetura.test.ts`

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
- **Tarefa mecânica** (`tasks.md`, "Tarefa mecânica"): revisores só os do cabeçalho. Trocar o caminho de import é por
  script, nunca à mão: ts-morph numa pasta de rascunho (`npm i --prefix .processo/ts-morph ts-morph@<exata>`, como a
  R7 fez com o depcruise, sem tocar o `package.json`) e `node .processo/mover.ts`, com o mapa "antigo → novo"; o script
  e a pasta ficam no `.processo/` da linha, fora do commit.

## Fora do escopo desta tarefa

Os ciclos de `login.service` (11.0) e a regra do depcruise (12.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

nenhuma

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/api/src/sessao/convite.service.ts
teste: apps/api/test/arquitetura.test.ts › nenhum arquivo do módulo de sessão importa o módulo da operação
- import type { ConferenciaDoAutor } from './conferencia-do-autor.js'
+ import type { ConferenciaDoAutor } from '../operacao/operador.repository.js'
```

```mutacao
arquivo: apps/api/src/sessao/redefinicao-de-mfa.ts
teste: apps/api/test/arquitetura.test.ts › nenhum arquivo do módulo de sessão importa o módulo da operação
- import type { ConferenciaDoAutor } from './conferencia-do-autor.js'
+ import type { ConferenciaDoAutor } from '../operacao/operador.repository.js'
```

```mutacao
arquivo: apps/api/src/operacao/prazos-da-sessao.ts
teste: apps/api/test/arquitetura.test.ts › operacao/prazos-da-sessao.ts não importa operador.repository
- export const DURACAO_DA_SESSAO_DE_OPERADOR_HORAS = 8
+ import type { SessaoDeOperadorParaGuarda } from './operador.repository.js'
+ export const DURACAO_DA_SESSAO_DE_OPERADOR_HORAS = 8
```

```mutacao
arquivo: apps/api/src/sessao/externa/cookie-oidc.ts
teste: apps/api/test/arquitetura.test.ts › nenhum arquivo do módulo de sessão importa o módulo da operação
- import { z } from 'zod'
+ import { z } from 'zod'
+ import type { ConferenciaDoAutor } from '../../operacao/operador.repository.js'
```

```mutacao
arquivo: apps/api/src/operacao/operador.repository.ts
teste: apps/api/test/arquitetura.test.ts › operador.repository.ts não declara nem reexporta ConferenciaDoAutor
- export interface OperadorAlvo {
+ export type ConferenciaDoAutor = (tx: TransacaoBanco) => Promise<string>
+ export interface OperadorAlvo {
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Nos oito arquivos de `apps/api/src/ops/*.ts`, em `operacao/painel.service.ts:36`, `sessao/convite.service.ts:32` e `sessao/redefinicao-de-mfa.ts:7`, o import novo ficou depois dos outros, fora da ordem dos imports relativos | Tarefa 12.0, que toca esses arquivos ao ligar o depcruise. Não muda comportamento, são onze arquivos, e trocar a ordem à mão contraria a nota "tarefa mecânica". Se a 12.0 não os tocar, `TODO.md` |
| revisor-geral (2ª) | Na 12.0, conferir que a regra do depcruise também cobre o `it` de `ConferenciaDoAutor`, que trata de nome de tipo e não de caminho de import | Tarefa 12.0 (`tasks/prd-reengenharia/12_task.md`): ela substitui estes `it` e é quem decide o que fica. Linha no `TODO.md` no commit da 10.0, apontando para a 12.0 |
| test-engineer (2ª) | A tabela "Testes que provam a regra" não tem linha para o `it` novo de `ConferenciaDoAutor` | Recusada: o `it` e a mutação dele estão em "Mutações", que é o que o portão aplica; a tabela é o desenho original e o `it` é provisório até a 12.0 |
| test-engineer (2ª) | `IMPORTA_A_OPERACAO` não pega import só de efeito (`import '../operacao/x.js'`) nem aspas duplas | Tarefa 12.0: o depcruise substitui este `it`, e hoje nenhum arquivo do repositório faz isso. Mesma linha do `TODO.md` do item acima |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 17:26:10 | 2026-10-22 17:26:36 | `revisor-geral` | 1 | APROVADO | a33f9c519be709360 |
| 2026-10-22 17:26:07 | 2026-10-22 17:27:09 | `test-engineer` | 1 | APROVADO | ad7bd457359e4b894 |
| 2026-10-22 17:37:41 | 2026-10-22 17:38:01 | `revisor-geral` | 2 | APROVADO | aa4672653b9140acc |
| 2026-10-22 17:37:36 | 2026-10-22 17:38:07 | `test-engineer` | 2 | APROVADO | af8ad929a6ca78e95 |

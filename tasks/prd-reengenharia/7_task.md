# Tarefa 7.0 — Os 9 repositories com cópia local leem a escola por `exigirEscolaDoContexto`

**Funcionalidade:** reengenharia · **Depende de:** 6.0
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Os nove repositories que copiam `contextoAtual()?.escolaId` usam `exigirEscolaDoContexto` e saem de
`REPOSITORIES_SEM_ESCOPO`, cada um com a mutação do seu `where` contra o teste de isolamento.

## Contexto necessário

- `onda-1a.md` §2, "T6", item **7.0**; `techspec.md` §6; `prd.md` RF9
- Regra 10, itens 3 e 5: a 6.0 vê a chamada, não o `where`; a mutação por repository prova o `where`
- Os nove: `apps/api/src/estrutura/escola-sessao.repository.ts`; em `apps/api/src/sessao/`: `convite`, `criacao-de-sessao`,
  `escrita-de-sessao`, `redefinicao-de-mfa`, `registro-de-acesso` (`.repository.ts`); em `packages/nucleo/src/`:
  `configuracao/configuracao-operacional`, `fila/efeito-sintetico`, `uso/uso` (`.repository.ts`)
- `packages/nucleo/src/contexto/escola-do-contexto.ts`: a mensagem é `'consulta com escopo sem escola no contexto'`

## Subtarefas

- [ ] 7.1 — Caracterização, num commit antes: os 7 sem caso de "sem escola" ganham o seu, verde com a cópia local
- [ ] 7.2 — Os nove passam a `exigirEscolaDoContexto`, lida a cada chamada, nunca guardada na instância
- [ ] 7.3 — Os nove saem de `REPOSITORIES_SEM_ESCOPO` (`tools/guardas/escopo-dos-repositories.ts`)
- [ ] 7.4 — Testes: isolamento e concorrência por repository, com a mutação de cada um

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| os nove `*.repository.ts` acima | alterado |
| `tools/guardas/escopo-dos-repositories.ts` | alterado |
| `apps/api/src/sessao/{convite,escrita-de-sessao,eu}.repository.int.test.ts` | alterado |
| `apps/api/src/sessao/criacao-de-sessao.repository.int.test.ts` | novo |
| `apps/api/src/sessao/redefinicao-de-mfa.repository.int.test.ts` | novo |
| `apps/api/test/escola-sessao.int.test.ts` | alterado |
| `apps/worker/test/reexecucao.int.test.ts`, `apps/worker/test/uso.int.test.ts` | alterado |
| `apps/despachante/test/vagas.int.test.ts` | alterado |

## Testes que provam a regra

| Cenário | O que prova | Mutação |
|---|---|---|
| Caracterização: os nove, sem escola, lançam antes do banco | fail-closed igual | a cópia devolver `undefined` |
| Depois: a mensagem exata de `exigirEscolaDoContexto` (`eu…:34` e `convite…:238` mudam, **declarado**) | a migração aconteceu: a substring passa com a cópia | devolver a cópia em `registro-de-acesso` |
| `EscolaSessaoRepository`: A muda, B fica | isolamento | tirar `eq(escola.id, …)` de `alterar` |
| `ConviteRepository`: no contexto de B, o convite de A não ativa nem revoga | isolamento | tirar `eq(convite.escolaId, …)` de `ativar` |
| `CriacaoDeSessaoRepository`: em A grava `escola_id` de A, e B não ganha linha (novo) | grava na escola do contexto | gravar a escola do argumento |
| `EscritaDeSessaoRepository`: em B, a sessão de A não rotaciona | isolamento | tirar `eq(sessao.escolaId, …)` de `rotacionar` |
| `RedefinicaoDeMfaRepository.contaDoUsuarioAtivo`: em B, `undefined`; em A, a conta (novo) | isolamento do alvo | tirar `eq(usuario.escolaId, …)` |
| `RegistroDeAcessoRepository`: grava na escola do contexto | isolamento | gravar o `escolaId` do argumento |
| `ConfiguracaoOperacionalRepository.daEscola`: só a do contexto | isolamento | tirar o `eq(…escolaId…)` |
| `daEscola` com `rotinaDoSistema` e sem escola lança | a rotina não ganha leitura sem escopo | aceitar `rotinaDoSistema` |
| `EfeitoSinteticoRepository.gravar`: uma vez por chave, na escola do contexto | isolamento | `escola_id` fixo |
| `UsoRepository`: duas escolas no mesmo dia, cada uma com a sua conta | isolamento | tirar o `eq(…escolaId…)` de `doDia` |
| Concorrência (novo): `Promise.all` de A e B na mesma instância de `EfeitoSinteticoRepository.gravar` e de `UsoRepository.gravarDia` | escola lida a cada chamada | lê-la no construtor |
| Mantida: duas ativações do mesmo convite, uma vez | a trava fica | nenhuma |
| Mantida: oito gravações da mesma chave, uma linha | idem | nenhuma |
| Unidade: os nove fora de `REPOSITORIES_SEM_ESCOPO` | a trava os cobre | devolver a cópia em qualquer um |

Log novo: nenhum.

## Como testar

- Isolamento: `apps/api/src/sessao/convite.repository.int.test.ts › isolamento: no contexto de B, o usuário e o convite de A
  não são ativados nem revogados, e o nome é o de B` (`BancadaDeSessoes`, de `apps/api/test/sessao-de-teste.ts`: `escola()`)
- Sem escola: `convite.repository.int.test.ts › sem escola no contexto, falha fechada` (troque o texto esperado)
- Concorrência em sequência que vira `Promise.all`: `apps/worker/test/reexecucao.int.test.ts › jobs da escola A e da B
  reexecutados em sequência na mesma réplica…`
- Os dois novos copiam `escrita-de-sessao.repository.int.test.ts › isolamento: no contexto de B, o id de uma sessão de A…`
- Isolado: `npx vitest run --project integracao <arquivo>` (sobe o compose de teste)
- Armadilha: o banco de teste acumula escolas; filtre pelo que o teste criou

## Fora do escopo desta tarefa

As portas de IA (8.0).

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


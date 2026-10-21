# Tarefa 20.0 — A web aceita campo extra e, com contrato quebrado, mostra "há uma versão nova"

**Funcionalidade:** reengenharia · **Depende de:** 18.0
**Subagentes obrigatórios:** `frontend-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Campo desconhecido na resposta é ignorado, e contrato quebrado vira "Há uma versão nova do Turmma. Recarregue a página.",
com "Recarregar", sem repetir a chamada.

## Contexto necessário

- `onda-1b.md` §2 "T3 — Leitor tolerante" e §3; `techspec.md` §9; `prd.md` RF7; regras 50 (itens 4, 5, 11, 12) e 00 (item 9)
- Código: `api/cliente.ts` (`:21`, `:102-103`, `:114`), `cliente-de-consultas.ts:13` (`deveTentarDeNovo`), `material.ts:107`,
  `areas/aluno/respostas.ts:84` (`tipoDaFalha`), `EstadoErro.tsx`, `packages/shared/src/erros/`, `erro-de-dominio.ts:4`

**Decisão do Arquiteto:** `ErroDeContrato` é um `ErroDaApi` com `RESPOSTA_FORA_DO_CONTRATO`; na fila da prova não é
`passageira`. `EsquemaDeResposta` expõe código e `path` dos problemas, sem a web depender do zod.

## Subtarefas

- [ ] 20.1 — `RESPOSTA_FORA_DO_CONTRATO` no catálogo de shared
- [ ] 20.2 — `lerResposta(esquema, corpo)` em `api/cliente.ts`, usada por `chamarApi` e `material.ts`
- [ ] 20.3 — `ErroDeContrato`, sem repetição nem reenvio
- [ ] 20.4 — `EstadoErro` com "Recarregar"
- [ ] 20.5 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/erros/codigo-de-erro.ts`, `mensagens.ts`, `mensagens.test.ts`; `packages/nucleo/src/erro/erro-de-dominio.ts` | alterado |
| `apps/web/src/api/cliente.ts`, `cliente.test.ts`, `cliente-de-consultas.ts`, `material.ts`, `sessao.test.ts` | alterado |
| `apps/web/src/api/material.test.ts` | novo |
| `apps/web/src/areas/aluno/respostas.ts`, `respostas.test.ts` | alterado |
| `apps/web/src/componentes/estado/EstadoErro.tsx`, `estados.test.tsx` | alterado |
| `e2e/versao-nova.spec.ts` | novo |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| Desconhecido no topo: aceito, o dado sai sem ele | unidade (`cliente.test.ts`) | relê | lançar em todo `success: false` |
| Aninhado (`itens[2].novo`) sai pelo `path` | unidade | segue o `path` | só chaves do topo |
| Dois, em níveis diferentes, são aceitos | unidade | todos | só o primeiro problema |
| O corpo recebido não muda | unidade | apaga numa cópia | apagar no recebido |
| Obrigatório ausente: `ErroDeContrato` (`:75` muda: aceita) | unidade | não vira dado | `ERRO_INTERNO` |
| Extra junto de obrigatório ausente: `ErroDeContrato` | unidade | todo problema | `some` no lugar de `every` |
| `nome: 42`: `ErroDeContrato` | unidade | só chave a mais se tolera | tolerar `invalid_type` |
| Extra dentro de `z.union`: "versão nova" | unidade | o lado seguro | tratar `invalid_union` como chave a mais |
| `mensagemDoErro(ErroDeContrato)` é o do catálogo | unidade | não é erro interno | `extends Error` |
| `deveTentarDeNovo(0, ErroDeContrato)` é falso: um `fetch` só | unidade (`cliente.test.ts:145`) | não repete | o código na lista de `:16` |
| `enviarMaterial` aceita campo extra; obrigatório ausente dá `ErroDeContrato` | unidade (`material.test.ts`) | usa o leitor | o `safeParse` de `:107` |
| Sessão (entrada e renovação) com campo extra segue | unidade (`sessao.test.ts`) | o login fica | `safeParse` próprio |
| Catálogo e `STATUS_HTTP_DO_CODIGO` com o código | unidade (`mensagens.test.ts`) | R39 | trocar o texto |
| Fila da prova: não reenvia, e a escolha fica não salva | unidade (`respostas.test.ts`) | sem laço nem perda | cair em `passageira` |
| `EstadoErro` de contrato: o `alert` com o texto e "Recarregar" | unidade (`estados.test.tsx`) | sem repetir | "Tentar de novo" para todo erro |
| "Recarregar" chama `location.reload()` uma vez | unidade | recarrega | chamar `aoTentarDeNovo` |
| Erro comum segue com "Tentar de novo" | unidade (`:25`, `:41`) | o resto fica | "Recarregar" para todo erro |
| `/coordenacao/estrutura` com campo extra mostra o dado | e2e (`chromebook`, `celular`) | API nova não derruba | lançar em `unrecognized_keys` |
| Contrato quebrado: o texto e "Recarregar", uma requisição | e2e | o `retry` real | o código em `deveTentarDeNovo` |
| "Recarregar" sem a interceptação mostra o dado | e2e | a saída funciona | botão sem ação |
| 1366 × 768 com o erro: `paginaNaoRola` | e2e | a casca é dona da altura | `min-h-screen` no `EstadoErro` |

## Como testar

- Leitor: copie `apps/web/src/api/cliente.test.ts › 200 fora do contrato vira erro interno, e não dado quebrado na tela`
  (muda de expectativa).
- Estado: `componentes/estado/estados.test.tsx › EstadoErro › o \`alert\` é só a mensagem do catálogo…`.
- Fila: `areas/aluno/respostas.test.ts › a gravação que falha NÃO tira a escolha da fila`.
- E2e: `e2e/governanca.spec.ts › os quatro estados…`, com `page.route` e `paginaNaoRola` (`__fixtures__/coordenacao.ts`).
- Isolado: `npx vitest run --project unidade apps/web/src/api apps/web/src/componentes/estado` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/versao-nova.spec.ts`.
- **Telas:** `coordenacao`, `/coordenacao/estrutura`, por `irPelaCoordenacao(page, 'Turmas', …)`, com a resposta
  interceptada; sem mockup.

## Fora do escopo desta tarefa

`chamarRota` (23.0); o registro de rotas (21.0).

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


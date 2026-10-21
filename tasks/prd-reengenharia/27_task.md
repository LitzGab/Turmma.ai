# Tarefa 27.0 — Os padrões da D55, de entrada e de saída, vivem em `conformidade/`

**Funcionalidade:** reengenharia · **Depende de:** 26.0
**Subagentes obrigatórios:** `conformidade-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** pequeno

## Objetivo

`julgamentoDeTextoDeAluno`, `saidaComNota` e `saidaQualitativa` moram em `conformidade/`, e o Assistente só as chama,
decidindo igual em toda amostra.

## Contexto necessário

- `techspec.md` §7b; `onda-1b.md` "T11" (O módulo); `onda-0.md` §2.1 e §2.3
- `prd.md` RF12 e RF2
- `.claude/rules/70-conformidade-cne.md` (item 2a) e `30-ia.md` (item 6)
- Código: `packages/nucleo/src/ia/tarefas/propor-ferramenta.ts` (`NOTA_QUE_NAO_E_DE_ALUNO` `:68`, `PEDE_NOTA` `:79`,
  `conversaPedeJulgamentoDeTextoDeAluno` `:248`, `atribuiNotaOuConceito` `:286`, o `conferir` `:392-398`, e o
  `julgaTextoDeAluno` da 3.0); `packages/nucleo/src/ia/__fixtures__/amostras-do-assistente.ts` e
  `amostras-do-assistente-revisao.ts` (viram corpus); `packages/nucleo/src/conformidade/` (da 26.0)

## Subtarefas

- [ ] 27.1 — Caracterização, num commit anterior: a decisão de cada amostra, por id, nas três
- [ ] 27.2 — `julgamento-de-texto-de-aluno.ts`, `saida-com-nota.ts` e `saida-qualitativa.ts` por `criarPolitica`;
  `PEDE_NOTA` vira lista; o corpus do Assistente em `conformidade/corpus/`
- [ ] 27.3 — `propor-ferramenta.ts` só chama `politicas.x.casa`, na entrada e no `conferir`
- [ ] 27.4 — Testes: caracterização, `ouro`, as duas chaves da saída, entrada sem modelo, reserva, um lugar só, prompt igual

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/conformidade/` (as três políticas, `index.ts`, `corpus/`, testes) | novo e alterado |
| `packages/nucleo/src/ia/tarefas/propor-ferramenta.ts` | alterado |
| `packages/nucleo/src/ia/tarefas/numeros.test.ts`, `packages/nucleo/src/ia/ouro.test.ts` | alterado (imports) |
| `packages/nucleo/src/ia/__fixtures__/amostras-do-assistente.ts`, `amostras-do-assistente-revisao.ts` | removido (vão ao corpus) |
| `packages/nucleo/src/index.ts` | alterado |

## Testes que provam a regra

| Cenário (o que prova) | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Cada amostra do `ouro` e do `dev`, por id, decide igual antes e depois | unidade, `caracterizacao.test.ts` | tirar um padrão de `julgamento-de-texto-de-aluno.ts` |
| `julgamentoDeTextoDeAluno`: recall ≥ 0,95 sem JT-001 a JT-012; `rubrica_antes` e `material_do_professor` sem casar; `pedagogia_geral` e `homonimo_de_nota` sem cair da base | unidade, `ouro.test.ts` | tirar o padrão de `nota` da entrada |
| `saidaQualitativa`: recall ≥ 0,90 e nenhuma legítima barrada | unidade, idem | tirar um padrão de `saida-qualitativa.ts` |
| `saidaComNota` não cai da base | unidade, idem | tirar um padrão de `saida-com-nota.ts` |
| `PEDE_NOTA` em lista decide igual à regex de hoje em todo o `ouro` e o `dev` | unidade, `caracterizacao.test.ts` | deixar fora uma alternativa |
| "nota de rodapé" e "notas de aula" não casam | unidade, `julgamento-de-texto-de-aluno.test.ts` | tirar a exclusão de `:68` |
| Saída que julga "o parágrafo 2", com texto de aluno na conversa, é barrada | unidade, `saida-qualitativa.test.ts` | primeira chave sempre falsa |
| A mesma saída, sem texto de aluno, passa | unidade, idem | barrar só com a primeira chave |
| O pedido de julgamento não chega ao modelo: zero chamadas ao adaptador falso | unidade, `numeros.test.ts` | conferir depois de chamar o modelo |
| O modelo que julga duas vezes (`AdaptadorRoteirizado`) termina na recusa de `reservaQuandoInvalida` | unidade, `provedor.test.ts` | `conferir` sem `politicas.saidaQualitativa` |
| `propor-ferramenta.ts` não tem padrão da D55 | unidade, sobre o fonte | `PEDE_NOTA` de volta no arquivo |
| `politicas` tem as seis, e as três novas com `regra: 'D55'` e `erraPara` | unidade, `politica.test.ts` | faltar `saidaComNota` no `index.ts` |
| Mensagens montadas e hash do prompt do Assistente iguais | unidade (a foto da 26.0) | um caractere a mais no prompt |

## Como testar

- `packages/nucleo/src/ia/tarefas/numeros.test.ts › propor_ferramenta e a D55 … › a mensagem recusada pela regra não sai
  para o modelo: o adaptador não é chamado …` (zero chamadas) e `› a conferência da saída … › o modelo que tenta dar nota
  duas vezes não tem nada entregue; …` (o roteiro de duas saídas). Peça: `AdaptadorRoteirizado`
  (`packages/nucleo/src/ia/__fixtures__/adaptador-roteirizado.ts`).
- A caracterização estende a da 26.0 (`conformidade/caracterizacao.test.ts`).
- Isolado: `npx vitest run --project unidade packages/nucleo/src/conformidade packages/nucleo/src/ia`.
- Armadilhas: nunca mexa em `docs/aia/ouro/` (o veto confere o `git log` vazio e o selo verde); a regra de nota
  (`NUMERO_DE_NOTA`, `FIM_DA_NOTA`) vai inteira, sem estreitar sem amostra.

## Fora do escopo desta tarefa

Mutação e metamórficos (28.0), o selo (29.0) e a saída do Tutor sob a D55 (`TODO.md`).

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


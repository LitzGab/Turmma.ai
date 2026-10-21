# Tarefa 4.0 — Avaliação aberta depois do 202: o Tutor não responde e a troca não conta

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `conformidade-reviewer`, `infra-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Avaliação da turma aberta depois do 202: o Tutor não responde e a troca não conta; só o encaminhamento da D36 continua.

## Contexto necessário

- `onda-0.md` §2.4 inteiro e §3, linhas RF3; `techspec.md` §7b e §7c; `prd.md` RF3
- `.claude/rules/30-camada-ia.md` (item 10), `70-conformidade-cne.md` (itens 4 e 7), `80-infra-e-carga.md` (item 7)
- Código: `apps/api/src/tutor/tutor.service.ts` (:171, :196-215, :203, :217); `tutor.repository.ts:213`;
  `packages/nucleo/src/ia/executor.ts:201-205`; `apps/web/src/areas/aluno/tutor.ts:87`

## Subtarefas

- [ ] 4.1 — `entrada()` confere `avaliativaAberta(turmaId)` logo depois da conferência de turma, antes de trechos,
  memória e turnos, e lança `TUTOR_PAUSADO_EM_AVALIACAO`
- [ ] 4.2 — `aoConcluir` repete a conferência na transação que grava a resposta; a saída `assunto_delicado` grava a
  mensagem fixa e o `atencao_humana` mesmo com a avaliação aberta
- [ ] 4.3 — Testes: as duas janelas com `GatilhoDeParada`, a exceção da D36, a concorrência, a caracterização da web

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/tutor/tutor.service.ts` | alterado |
| `apps/api/src/tutor/tutor.int.test.ts` | alterado |
| `apps/api/src/tutor/tutor-modelo.int.test.ts` | alterado |
| `apps/web/src/areas/aluno/tutor.test.ts` | só leitura (caracterização) |

## Testes que provam a regra

Caracterização que fica: `tutor.int.test.ts:439` (409 com a avaliação já aberta),
`:788`, `tutor-modelo.int.test.ts:258` e `:302`, `apps/web/src/areas/aluno/tutor.test.ts:85` e `:104`. **Barreiras:**
"entre o 202 e a execução" é o `GatilhoDeParada` no `update` para `rodando`; "entre a execução e a conclusão" é o
`GatilhoDeParada` no `insert` de `consumo_ia` da execução, ou um `responder` assíncrono no modelo de mentira.

| Cenário | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Abre entre o 202 e a execução: execução `falhou`, `erro: TUTOR_PAUSADO_EM_AVALIACAO`, `resultado` nulo | integração, `tutor.int.test.ts` | tirá-la de `entrada()` |
| Idem: nenhuma mensagem do Tutor nem sinal; a pergunta fica em `mensagem_tutor`, só `autor: aluno` | integração | apagar a pergunta ao pausar |
| Idem: a troca não conta (`uso.hoje` 0) | integração | gravar a pausada como `concluida` |
| Idem: `modelo.pedidos` vazio | integração, `tutor-modelo.int.test.ts` | conferir só no `aoConcluir` |
| Idem: a busca de trechos não é chamada | integração | mover para depois de `#trechosDoTurno` |
| Transferido para turma em prova entre o 202 e a execução: `NAO_ENCONTRADO`, não pausa | integração | inverter a ordem |
| Avaliação de outra turma da escola abre no meio: o turno conclui | integração | `avaliativaAberta` sem `turmaId` |
| Abre entre a execução e a conclusão: `falhou`, sem mensagem do Tutor nem sinal (nem `resposta_pronta`) | integração, `tutor-modelo.int.test.ts` | tirá-la do `aoConcluir` |
| Idem: a troca não conta | integração | gravar a resposta antes de conferir |
| Idem: o que fica no `consumo_ia` da execução (o modelo foi chamado) é afirmado | integração | — |
| Modelo classifica `assunto_delicado` e a avaliação abre antes da conclusão: mensagem fixa, `atencao_humana`, `concluida` | integração | conferir antes do ramo `assunto_delicado` |
| Concorrência: N alunos com POST em `Promise.all`, parados em `rodando`; a prova abre; todas `falhou`, nenhuma troca | integração | tirar a conferência de `entrada()` |
| Reenvio com a mesma chave depois da pausa devolve a mesma execução `falhou`, sem nova pergunta nem troca | integração | — |
| A web mostra a `falhou` com o código como a pausa `avaliacao` | unidade web (caracterização, `tutor.test.ts:104`) | tirar o ramo de `pausaDoErro` |
| Log: a pergunta pausada não sai de `mensagem_tutor` (marca procurada em sinal, execução, consumo, auditoria, log, Redis) | integração | logar a pergunta |

**Isolamento:** `avaliativaAberta` já escopa (`:213-223`) e a FK composta impede avaliação de outra escola; quem
confere é o `tenancy-guardian`.

## Como testar

- Copie `apps/api/src/tutor/tutor.int.test.ts › o aluno transferido depois do 202 e antes de a execução rodar: a execução
  falha com código do catálogo, sem resposta, sem sinal e sem troca contada` (o `GatilhoDeParada` de
  `apps/api/test/gatilho-de-parada.ts`, com `armar`, `soltar` e `desarmar`)
- A prova aberta: `aplicarAtividade(bancada, a, { avaliativa: true, … })` (`apps/api/test/escola-com-tutor.ts`)
- A exceção da D36: `tutor-modelo.int.test.ts › quando é o modelo que classifica o turno como assunto delicado, o aluno
  recebe a mensagem fixa, e o professor, o sinal sem referência`
- Rodar: `npx vitest run --project integracao apps/api/src/tutor/tutor.int.test.ts apps/api/src/tutor/tutor-modelo.int.test.ts`
- Armadilha: a conferência no `aoConcluir` é "lê e grava" em READ COMMITTED; a avaliação que comita logo depois da
  leitura deixa uma resposta passar. A spec aceita a janela; o `infra-guardian` diz se basta

## Fora do escopo desta tarefa

Levar as duas conferências para o Command (42.0); mudar a tela da pausa.

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


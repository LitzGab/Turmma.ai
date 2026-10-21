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

- [x] 4.1 — `entrada()` confere `avaliativaAberta(turmaId)` logo depois da conferência de turma, antes de trechos,
  memória e turnos, e lança `TUTOR_PAUSADO_EM_AVALIACAO`
- [x] 4.2 — `aoConcluir` repete a conferência na transação que grava a resposta; a saída `assunto_delicado` grava a
  mensagem fixa e o `atencao_humana` mesmo com a avaliação aberta
- [x] 4.3 — Testes: as duas janelas com `GatilhoDeParada`, a exceção da D36, a concorrência, a caracterização da web

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
| A web mostra a `falhou` com o código como a pausa `avaliacao` | unidade web (caracterização, `tutor.test.ts:85`) | tirar o ramo de `pausaDoErro` |
| Log: a pergunta pausada não sai de `mensagem_tutor` (marca procurada em sinal, execução, consumo, auditoria e log, e no Redis no caso da primeira janela; a segunda olha as tabelas e o log) | integração | logar a pergunta |

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
| nenhuma | — | — |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

Cláusulas do diff: (1) a conferência do `entrada()`; (2) a conferência do `aoConcluir`, com seus dois termos (a exceção da D36 e a leitura
da avaliação); (3) o `throw` de cada uma. O `avaliativaAberta` por turma e o ramo de `pausaDoErro` já existiam: entram aqui porque os
casos novos são os que os provam nesta janela.

```mutacao
arquivo: apps/api/src/tutor/tutor.service.ts
teste: apps/api/src/tutor/tutor.int.test.ts › abre entre o 202 e a execução: a execução falha com o código da pausa
  if (agora.turma.turmaId !== pergunta.turmaId) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
  // A avaliação que abriu entre o `202` e agora trava o turno antes de qualquer trabalho: sem trecho, sem memória e sem
  // chamar o modelo. A execução falha com o código da pausa, `trocas()` a ignora e a pergunta fica só em `mensagem_tutor`.
- if ((await tutor.avaliativaAberta(agora.turma.turmaId)) !== undefined) throw new ErroDeDominio(CodigoDeErro.TUTOR_PAUSADO_EM_AVALIACAO)
  const questao = agora.atividade === undefined || pergunta.questao === null ? undefined : questaoSemGabarito(agora.atividade.conteudo, pergunta.questao)
```

```mutacao
arquivo: apps/api/src/tutor/tutor.service.ts
teste: apps/api/src/tutor/tutor-modelo.int.test.ts › abre entre o 202 e a execução: o modelo nem chega
  if (agora.turma.turmaId !== pergunta.turmaId) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
  // A avaliação que abriu entre o `202` e agora trava o turno antes de qualquer trabalho: sem trecho, sem memória e sem
  // chamar o modelo. A execução falha com o código da pausa, `trocas()` a ignora e a pergunta fica só em `mensagem_tutor`.
- if ((await tutor.avaliativaAberta(agora.turma.turmaId)) !== undefined) throw new ErroDeDominio(CodigoDeErro.TUTOR_PAUSADO_EM_AVALIACAO)
  const questao = agora.atividade === undefined || pergunta.questao === null ? undefined : questaoSemGabarito(agora.atividade.conteudo, pergunta.questao)
```

```mutacao
arquivo: apps/api/src/tutor/tutor.service.ts
teste: apps/api/src/tutor/tutor.int.test.ts › dois alunos parados
  if (agora.turma.turmaId !== pergunta.turmaId) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
  // A avaliação que abriu entre o `202` e agora trava o turno antes de qualquer trabalho: sem trecho, sem memória e sem
  // chamar o modelo. A execução falha com o código da pausa, `trocas()` a ignora e a pergunta fica só em `mensagem_tutor`.
- if ((await tutor.avaliativaAberta(agora.turma.turmaId)) !== undefined) throw new ErroDeDominio(CodigoDeErro.TUTOR_PAUSADO_EM_AVALIACAO)
  const questao = agora.atividade === undefined || pergunta.questao === null ? undefined : questaoSemGabarito(agora.atividade.conteudo, pergunta.questao)
```

```mutacao
arquivo: apps/api/src/tutor/tutor.service.ts
teste: apps/api/src/tutor/tutor.int.test.ts › abre entre o 202 e a execução: a execução falha com o código da pausa
  if (agora.turma.turmaId !== pergunta.turmaId) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
  // A avaliação que abriu entre o `202` e agora trava o turno antes de qualquer trabalho: sem trecho, sem memória e sem
  // chamar o modelo. A execução falha com o código da pausa, `trocas()` a ignora e a pergunta fica só em `mensagem_tutor`.
- if ((await tutor.avaliativaAberta(agora.turma.turmaId)) !== undefined) throw new ErroDeDominio(CodigoDeErro.TUTOR_PAUSADO_EM_AVALIACAO)
  const questao = agora.atividade === undefined || pergunta.questao === null ? undefined : questaoSemGabarito(agora.atividade.conteudo, pergunta.questao)
  const entregues = await this.#trechosDoTurno(pergunta, agora, questao)
+ if ((await tutor.avaliativaAberta(agora.turma.turmaId)) !== undefined) throw new ErroDeDominio(CodigoDeErro.TUTOR_PAUSADO_EM_AVALIACAO)
```

```mutacao
arquivo: apps/api/src/tutor/tutor.service.ts
teste: apps/api/src/tutor/tutor.int.test.ts › transferido para uma turma em prova
- if (agora.turma.turmaId !== pergunta.turmaId) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
  // A avaliação que abriu entre o `202` e agora trava o turno antes de qualquer trabalho: sem trecho, sem memória e sem
  // chamar o modelo. A execução falha com o código da pausa, `trocas()` a ignora e a pergunta fica só em `mensagem_tutor`.
  if ((await tutor.avaliativaAberta(agora.turma.turmaId)) !== undefined) throw new ErroDeDominio(CodigoDeErro.TUTOR_PAUSADO_EM_AVALIACAO)
+ if (agora.turma.turmaId !== pergunta.turmaId) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
```

```mutacao
arquivo: apps/api/src/tutor/tutor.repository.ts
teste: apps/api/src/tutor/tutor.int.test.ts › a avaliação de outra turma da escola abre no meio
  .innerJoin(artefato, and(eq(artefato.escolaId, atividadeAplicada.escolaId), eq(artefato.anoLetivoId, atividadeAplicada.anoLetivoId), eq(artefato.id, atividadeAplicada.artefatoId)))
- .where(and(eq(atividadeAplicada.escolaId, escolaId), eq(atividadeAplicada.anoLetivoId, anoLetivoId), eq(atividadeAplicada.turmaId, turmaId), eq(atividadeAplicada.avaliativa, true), eq(atividadeAplicada.estado, 'aberta')))
+ .where(and(eq(atividadeAplicada.escolaId, escolaId), eq(atividadeAplicada.anoLetivoId, anoLetivoId), eq(atividadeAplicada.avaliativa, true), eq(atividadeAplicada.estado, 'aberta')))
  .orderBy(asc(atividadeAplicada.id))
```

```mutacao
arquivo: apps/api/src/tutor/tutor.service.ts
teste: apps/api/src/tutor/tutor-modelo.int.test.ts › abre entre a execução e a conclusão
  if (lido === undefined) throw new ErroDeIa('IA_ENTRADA_INVALIDA')
  // A avaliação que abriu enquanto o modelo respondia descarta a resposta e desfaz a transação: nada é gravado e a troca
  // não conta. A exceção é o encaminhamento da D36: a mensagem fixa e o sinal ficam mesmo com a avaliação aberta.
  // Sem trava: a conferência lê e grava em READ COMMITTED, e a avaliação que comita logo depois da leitura ainda deixa a
  // resposta passar. O resultado equivale à ordem serial "a resposta grava antes de a prova abrir": nenhuma transação lê o que a outra escreve.
- if (saida.classificacao !== 'assunto_delicado' && (await new TutorDoAlunoRepository(tx, this.relogio).avaliativaAberta(lido.pergunta.turmaId)) !== undefined) {
- throw new ErroDeDominio(CodigoDeErro.TUTOR_PAUSADO_EM_AVALIACAO)
- }
  exigirCitacoesEntregues(saida.citacoes, lido.entregues)
```

```mutacao
arquivo: apps/api/src/tutor/tutor.service.ts
teste: apps/api/src/tutor/tutor-modelo.int.test.ts › abre antes da conclusão e o modelo classificou
  // não conta. A exceção é o encaminhamento da D36: a mensagem fixa e o sinal ficam mesmo com a avaliação aberta.
  // Sem trava: a conferência lê e grava em READ COMMITTED, e a avaliação que comita logo depois da leitura ainda deixa a
  // resposta passar. O resultado equivale à ordem serial "a resposta grava antes de a prova abrir": nenhuma transação lê o que a outra escreve.
- if (saida.classificacao !== 'assunto_delicado' && (await new TutorDoAlunoRepository(tx, this.relogio).avaliativaAberta(lido.pergunta.turmaId)) !== undefined) {
+ if ((await new TutorDoAlunoRepository(tx, this.relogio).avaliativaAberta(lido.pergunta.turmaId)) !== undefined) {
  throw new ErroDeDominio(CodigoDeErro.TUTOR_PAUSADO_EM_AVALIACAO)
```

```mutacao
arquivo: apps/api/src/tutor/tutor.service.ts
teste: apps/api/src/tutor/tutor.int.test.ts › abre entre o 202 e a execução: a execução falha com o código da pausa
  if (agora.turma.turmaId !== pergunta.turmaId) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
  // A avaliação que abriu entre o `202` e agora trava o turno antes de qualquer trabalho: sem trecho, sem memória e sem
  // chamar o modelo. A execução falha com o código da pausa, `trocas()` a ignora e a pergunta fica só em `mensagem_tutor`.
- if ((await tutor.avaliativaAberta(agora.turma.turmaId)) !== undefined) throw new ErroDeDominio(CodigoDeErro.TUTOR_PAUSADO_EM_AVALIACAO)
+ if ((await tutor.avaliativaAberta(agora.turma.turmaId)) !== undefined) throw Object.assign(new ErroDeDominio(CodigoDeErro.TUTOR_PAUSADO_EM_AVALIACAO), { name: pergunta.texto })
  const questao = agora.atividade === undefined || pergunta.questao === null ? undefined : questaoSemGabarito(agora.atividade.conteudo, pergunta.questao)
```

```mutacao
arquivo: apps/web/src/areas/aluno/tutor.ts
teste: apps/web/src/areas/aluno/tutor.test.ts › a recusa do servidor
  export function pausaDoErro(erro: CodigoDeErro): PausaDoTutor | undefined {
- if (erro === CodigoDeErro.TUTOR_PAUSADO_EM_AVALIACAO) return 'avaliacao'
  if (erro === CodigoDeErro.LIMITE_DIARIO_DO_TUTOR) return 'limite_do_dia'
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| conformidade-reviewer (1ª) | O texto diz que a pergunta pausada fica "no registro que o professor vê", e o código a deixa fora da supervisão (`supervisao.repository.ts`); corrigir para "fica só em `mensagem_tutor`, fora da contagem e da última troca" | `TODO.md`, uma linha: o texto está em `tasks/prd-reengenharia/onda-0.md` §2.4 (linha 94), documento da spec que esta tarefa não toca; o comentário de `tutor.service.ts` já diz "só em `mensagem_tutor`" |
| conformidade-reviewer (1ª), test-engineer (1ª) | A pergunta delicada que o filtro de frases não reconhece e que só o modelo classificaria, com a prova aberta antes do `entrada()`, é pausada sem a mensagem fixa; registrar o risco que sobra em `docs/aia/tutor.md` | `TODO.md`, uma linha: `docs/aia/tutor.md`, ao fechar a onda 0, junto com a medida que a spec atribui ao Arquiteto (onda-0 §4); a spec aceita o caso |
| conformidade-reviewer (1ª) | A conferência do `aoConcluir` lê e grava sem trava | Sem ação: o `infra-guardian` respondeu que basta (o motivo está registrado no comentário do `aoConcluir`, em `tutor.service.ts`) |
| infra-guardian (1ª) | Tirar `TUTOR_PAUSADO_EM_AVALIACAO` da contagem de falha de execução quando chegarem `job.falhos{tipo}` e o alerta "Provedor de IA fora" | Tarefas 47.0 e 49.0 (`tasks/prd-reengenharia/tasks.md`), que criam a contagem e o alerta; mais uma linha no `TODO.md` para a 47.0 e a 49.0 não dependerem de ninguém lembrar |
| tenancy-guardian (1ª) | Caso com avaliação aberta na escola B durante a janela, para a mutação "tirar `escolaId` de `avaliativaAberta`" ter teste nomeado | Recusada: a `turmaId` é UUID de uma escola só e a FK composta impede avaliação de outra escola na turma, então a mutação é equivalente e nenhum teste a deixaria vermelha; o próprio guardião diz que não é brecha |
| revisor-geral (1ª) | `execucaoLida`, `pausada` e `consumoDaExecucao` quase iguais nos dois arquivos de teste; levar para `apps/api/test/escola-com-tutor.ts` | `TODO.md`, uma linha: arquivo compartilhado que a tarefa não toca; mexer nele caduca todos os testes de Tutor que o usam |
| revisor-geral (2ª) | `tutor.int.test.ts:514`: o comentário "A pergunta continua no registro que o professor vê" repete a frase do `onda-0.md` §2.4, que o documento e o `TODO.md` dizem estar errada (a pergunta fica fora da supervisão); trocar para "fica só em `mensagem_tutor`, sem resposta" | `TODO.md`: acrescentar à linha já escrita sobre a frase do `onda-0.md` §2.4 (linha 94) que o comentário do `tutor.int.test.ts` (caso da primeira janela) a repete, para os dois serem corrigidos juntos |
| revisor-geral (2ª) | `4_task.md`: "item 4 desta ordem registra o motivo no comentário" não aponta para nada que se encontre | Aplicada no texto do documento: a linha passa a dizer que o motivo está no comentário do `aoConcluir`, em `tutor.service.ts` |
| test-engineer (2ª) | A linha "Log" da tabela de testes diz que a marca é procurada também no Redis, e a segunda janela só olha as tabelas e o log | Aplicada no texto do documento: a linha diz que o Redis é procurado no caso da primeira janela, e a segunda olha as tabelas e o log |
| test-engineer (2ª) | A asserção de log da segunda janela não tem bloco de mutação próprio (o bloco existente só muta o `entrada()`) | Recusada: não há cláusula nova de código, e o caminho do log (`resumirErro`, `packages/nucleo/src/ia/executor.ts:201-205`) é o mesmo nas duas janelas, já provado pelo bloco da primeira |

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
| 2026-10-21 20:22:20 | 2026-10-21 20:22:55 | `tenancy-guardian` | 1 | APROVADO | a4ac4e98b2fabaf49 |
| 2026-10-21 20:22:24 | 2026-10-21 20:23:10 | `revisor-geral` | 1 | APROVADO | a3f50537f57f17911 |
| 2026-10-21 20:22:21 | 2026-10-21 20:23:11 | `conformidade-reviewer` | 1 | APROVADO | a6adf96f553d1826f |
| 2026-10-21 20:22:22 | 2026-10-21 20:23:23 | `infra-guardian` | 1 | APROVADO | ad5c6c49b0c4ec93a |
| 2026-10-21 20:22:23 | 2026-10-21 20:24:12 | `test-engineer` | 1 | APROVADO | a63fd3c340042f118 |
| 2026-10-21 20:30:30 | 2026-10-21 20:30:55 | `revisor-geral` | 2 | APROVADO | a06d7bf4b623faa5c |
| 2026-10-21 20:30:22 | 2026-10-21 20:30:59 | `test-engineer` | 2 | APROVADO | ac49e8af19114ea6c |

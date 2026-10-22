# Tarefa 8.0 — A IA tira a escola do contexto, com teste de isolamento

**Funcionalidade:** reengenharia · **Depende de:** 7.0 (a mesma lista)
**Subagentes obrigatórios:** `tenancy-guardian`, `infra-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Suspensão, orçamento e consumo de IA leem a escola do contexto, não do argumento; sem ela, a porta recusa antes do modelo.

## Contexto necessário

- `onda-1a.md` §2, "T6", "A IA pelo contexto (8.0)"; `techspec.md` §6 e §8; `prd.md` RF9
- Regras 10.3 e 30
- `packages/nucleo/src/ia/suspensao.ts` e `consumo.ts`: as três portas
- `packages/nucleo/src/ia/provedor.ts:101`: a conferência de `pedido.escolaId` **fica**; o "sem contexto passa" muda
- `apps/api/src/ia/orcamento.repository.ts:41`: o `permitido: true` antes de ler a escola
- Chamadores: `agendador-de-execucoes.ts:78`, `conferencia-de-funcao.ts:15`, `tutor.service.ts:175`, `:191`, `:341`, `:384`

## Subtarefas

- [x] 8.1 — As três portas perdem `escolaId`, e os repositories usam `exigirEscolaDoContexto()`, no orçamento antes
  do retorno antecipado
- [x] 8.2 — Os chamadores não passam a escola; `SuspensoesEmMemoria` lê o contexto
- [x] 8.3 — `ia/consumo`, `ia/orcamento` e `ia/suspensao` saem de `REPOSITORIES_SEM_ESCOPO`
- [x] 8.4 — Testes: isolamento por porta, sem contexto, concorrência e o tipo

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ia/{suspensao,consumo,provedor,porta}.ts`, `provedor.test.ts` | alterado |
| `packages/nucleo/src/ia/__fixtures__/contexto-da-escola.ts` | novo |
| `packages/nucleo/src/ia/adaptador-openai-compat.test.ts`, `packages/nucleo/src/ia/tarefas/{conteudo,numeros,turno-do-tutor}.test.ts` | alterado |
| `tools/ia/medir-risco-a-vida.ts`, `tools/ia/medir-risco-a-vida.test.ts` | alterado |
| `tools/guardas/repositories-com-escopo.test.ts` | alterado |
| `apps/api/src/ia/{consumo,orcamento,suspensao}.repository.ts` | alterado |
| `apps/api/src/ia/{conferencia-de-funcao,agendador-de-execucoes}.ts` | alterado |
| `apps/api/src/ia/ia.int.test.ts` | alterado |
| `apps/api/src/tutor/tutor.service.ts` | alterado |
| `tools/guardas/escopo-dos-repositories.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| `SuspensaoRepository`: suspensa em B; em A, ativa | integração | isolamento | tirar `eq(suspensaoDeFuncao.escolaId, …)` |
| Orçamento: perguntas de aluno de B não contam em A | integração | isolamento do freio | tirar `eq(mensagemTutor.escolaId, …)` |
| Limite 1 em A e 3 em B: em A, a 2.ª é recusada | integração | o limite da escola | tirar `eq(configuracaoOperacionalEscola.escolaId, …)` |
| Em A, turma de B com 30 alunos não infla o pacote (novo) | integração | a turma é da escola | tirar `eq(vinculo.escolaId, …)` |
| Consumo: em A grava em A, e B não ganha linha | integração | fica com quem gastou | gravar a escola do registro |
| Sem escola, cada porta lança antes do banco | integração | fail-closed | `exigir…` vira `contextoAtual()?.escolaId` |
| `consultar` sem contexto, função que não é o Tutor, lança | integração | `exigir` antes do `permitido: true` | movê-lo para depois |
| `gerar` sem contexto: `IA_INDISPONIVEL`, sem adaptador nem consumo (**muda** `provedor.test.ts:312`) | unidade | sem escola, não executa | a suspensão falsa responder `false` sem contexto |
| Contexto A, pedido de B: `IA_ENTRADA_INVALIDA` antes de consultar (já existia: `provedor.test.ts › com contexto da escola A, o pedido em nome da escola B é recusado…`, que prova "apagar o `if`"; não é cláusula nova, sem bloco) | unidade | `provedor.ts:101` fica | apagar o `if` |
| O Tutor recusa a 61.ª troca, sem passar `escolaId` (`tutor.int.test.ts › a troca além do limite do dia é recusada sem gravar mensagem, a de outro aluno passa, e a de ontem não conta`; o arquivo não é alterado, e o portão o roda porque a tarefa o passa como alvo) | integração | produção usa o contexto | nenhuma |
| A execução depois do 202 grava na escola de quem pediu | integração | fora da requisição | rodar fora de `executarNoContexto` |
| Concorrência (novo): `Promise.all` de turnos em A e B nas mesmas instâncias | integração | cada consumo na sua escola | ler a escola no construtor |
| `@ts-expect-error` com `escolaId` nas três portas (`provedor.test.ts › o tipo das três portas não leva a escola…`; "devolvê-lo à assinatura" é provado pelo `typecheck` do portão, que reprova o `@ts-expect-error` sem erro; sem bloco) | tipos | não volta | devolvê-lo à assinatura |
| As três fora de `REPOSITORIES_SEM_ESCOPO` | unidade | a trava cobre | o argumento de volta |
| Mantido: suspensa recusa antes de gravar | integração | caracterização | nenhuma |
| Mantido: sem consultar a suspensão, não executa | unidade | idem | nenhuma |
| Mantido: sem consultar o orçamento, não gasta | unidade | idem | nenhuma |
| Mantido: consumo de A não aponta para execução de B | integração | idem | nenhuma |

Carga: uma leitura do `AsyncLocalStorage` a mais. Log novo: nenhum.

## Como testar

- `apps/api/src/ia/ia.int.test.ts › função suspensa em B: suspensa em B, ativa em A…` e `› A e B com limites diferentes…`:
  envolva cada chamada em `executarNoContexto`
- Reescreva `packages/nucleo/src/ia/provedor.test.ts › com a escola do contexto, o pedido passa; sem contexto…`; o
  vizinho `› com contexto da escola A, o pedido em nome da escola B é recusado…` fica
- Isolado: `npx vitest run --project integracao apps/api/src/ia/ia.int.test.ts` (e `--project unidade` no `provedor.test.ts`)

## Fora do escopo desta tarefa

`ia/execucao` (na lista até a 47.0) e a onda 3.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Sem escola no contexto, `gerar` falha com `IA_INDISPONIVEL` pela porta da suspensão (que lê o contexto e lança dentro de `exigirFuncaoAtiva`), e não por uma recusa nova em `provedor.ts:101`; os fakes em memória leem o contexto do mesmo jeito, e `suspender`/`retomar` seguem recebendo a escola | O `provedor.ts:101` fica como a tarefa manda, só comparando quando há contexto; a recusa sem escola precisa existir uma vez só, e a da porta já vem antes do adaptador, do orçamento e do consumo | `onda-1a.md` T6, "A IA pelo contexto (8.0)", "Escolhas da 8.0", item 2 |
| O orçamento lê a escola antes do retorno antecipado: a função que não é o Tutor lança sem escola, em vez de receber `permitido: true` | É o que a tarefa pede (subtarefa 8.1): sem isso a porta responde sem olhar para ninguém | `onda-1a.md` T6, "Escolhas da 8.0", item 1 |
| Arquivos além dos previstos: `__fixtures__/contexto-da-escola.ts` (novo), `adaptador-openai-compat.test.ts`, `tarefas/{conteudo,numeros,turno-do-tutor}.test.ts`, `porta.ts` (só o comentário), `tools/ia/medir-risco-a-vida.ts` e o teste dele, `tools/guardas/repositories-com-escopo.test.ts` | O teste de unidade que roda o `ProvedorDeIa` sem contexto passa a falhar fechado por desenho; a medida do risco à vida roda o provedor de verdade e também precisa da escola no contexto (`executarNoContexto` do `dist`); a lista exata da guarda encolheu três | `onda-1a.md` T6, "Escolhas da 8.0", item 3 |
| "Em A, turma de B com 30 alunos não infla o pacote" usa a turma de B com os dois alunos de B, e monta a pergunta da escola A apontando para ela com a FK desligada na conexão do teste | A FK composta de `mensagem_tutor` impede a pergunta de A apontar para a turma de B: sem esse estado a cláusula `eq(vinculo.escolaId, …)` é equivalente à de `turma_id` e o teste não ficaria vermelho sem ela. Mais de um aluno basta para o pacote subir | `onda-1a.md` T6, "Escolhas da 8.0", item 4 |
| A concorrência fecha com as duas escolas recusadas (freio de 1) e a suspensão só em B | Com A permitida e B recusada, a escola herdada de B passaria despercebida (na escola errada a consulta é sempre permitida); com as duas recusadas, os dois sentidos aparecem | `onda-1a.md` T6, "Escolhas da 8.0", item 5 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/api/src/ia/suspensao.repository.ts
teste: apps/api/src/ia/ia.int.test.ts › função suspensa em B: suspensa em B, ativa em A
-.where(and(eq(suspensaoDeFuncao.escolaId, escolaId), eq(suspensaoDeFuncao.funcao, funcao), isNull(suspensaoDeFuncao.retomadaEm)))
+.where(and(eq(suspensaoDeFuncao.funcao, funcao), isNull(suspensaoDeFuncao.retomadaEm)))
```

```mutacao
arquivo: apps/api/src/ia/suspensao.repository.ts
teste: apps/api/src/ia/ia.int.test.ts › sem escola no contexto, lança antes de ler
-const escolaId = exigirEscolaDoContexto()
+const escolaId = (() => { try { return exigirEscolaDoContexto() } catch { return '00000000-0000-0000-0000-000000000000' } })()
```

```mutacao
arquivo: apps/api/src/ia/suspensao.repository.ts
teste: apps/api/src/ia/ia.int.test.ts › cada turno do Tutor lê a suspensão
-const escolaId = exigirEscolaDoContexto()
+const escolaId = ((this as { escola?: string }).escola ??= exigirEscolaDoContexto())
```

```mutacao
arquivo: apps/api/src/ia/consumo.repository.ts
teste: apps/api/src/ia/ia.int.test.ts › grava na escola do contexto, e a outra escola não ganha linha
-escolaId: exigirEscolaDoContexto(),
+escolaId: (await this.banco.select({ escolaId: consumoIa.escolaId }).from(consumoIa).limit(1))[0]?.escolaId,
```

```mutacao
arquivo: apps/api/src/ia/consumo.repository.ts
teste: apps/api/src/ia/ia.int.test.ts › sem escola no contexto, lança antes de gravar
-escolaId: exigirEscolaDoContexto(),
+escolaId: (() => { try { return exigirEscolaDoContexto() } catch { return '00000000-0000-0000-0000-000000000000' } })(),
```

```mutacao
arquivo: apps/api/src/ia/consumo.repository.ts
teste: apps/api/src/ia/ia.int.test.ts › cada turno do Tutor lê a suspensão
-escolaId: exigirEscolaDoContexto(),
+escolaId: ((this as { escola?: string }).escola ??= exigirEscolaDoContexto()),
```

```mutacao
arquivo: apps/api/src/ia/orcamento.repository.ts
teste: apps/api/src/ia/ia.int.test.ts › as perguntas de um aluno de B não contam na escola A
-eq(mensagemTutor.escolaId, escolaId),
```

```mutacao
arquivo: apps/api/src/ia/orcamento.repository.ts
teste: apps/api/src/ia/ia.int.test.ts › A e B com limites diferentes
 .from(configuracaoOperacionalEscola)
-.where(eq(configuracaoOperacionalEscola.escolaId, escolaId))
```

```mutacao
arquivo: apps/api/src/ia/orcamento.repository.ts
teste: apps/api/src/ia/ia.int.test.ts › em A, a turma de B não infla o pacote
-.where(and(eq(vinculo.escolaId, escolaId), eq(vinculo.turmaId, turmaId), eq(vinculo.papel, 'aluno'), eq(vinculo.estado, 'confirmado')))
+.where(and(eq(vinculo.turmaId, turmaId), eq(vinculo.papel, 'aluno'), eq(vinculo.estado, 'confirmado')))
```

```mutacao
arquivo: apps/api/src/ia/orcamento.repository.ts
teste: apps/api/src/ia/ia.int.test.ts › sem escola no contexto, a função que não é o Tutor também lança
 async consultar(consulta: ConsultaDeOrcamento): Promise<DecisaoDoOrcamento> {
-const escolaId = exigirEscolaDoContexto()
 if (consulta.funcao !== 'tutor_com_o_aluno' || consulta.alunoId === undefined) return { permitido: true }
+const escolaId = exigirEscolaDoContexto()
```

```mutacao
arquivo: apps/api/src/ia/orcamento.repository.ts
teste: apps/api/src/ia/ia.int.test.ts › sem escola no contexto, o Tutor não é consultado
-const escolaId = exigirEscolaDoContexto()
+const escolaId = (() => { try { return exigirEscolaDoContexto() } catch { return '00000000-0000-0000-0000-000000000000' } })()
```

```mutacao
arquivo: apps/api/src/ia/orcamento.repository.ts
teste: apps/api/src/ia/ia.int.test.ts › cada turno do Tutor lê a suspensão
-const escolaId = exigirEscolaDoContexto()
+const escolaId = ((this as { escola?: string }).escola ??= exigirEscolaDoContexto())
```

```mutacao
arquivo: apps/api/src/ia/agendador-de-execucoes.ts
teste: apps/api/src/ia/ia.int.test.ts › grava a execução pendente, responde o id e roda depois, no contexto de quem pediu
 this.executor.agendar(execucao, (sinal) =>
-executarNoContexto(contexto, async () => {
+((_contexto: unknown, trabalho: () => Promise<unknown>) => trabalho())(contexto, async () => {
```

```mutacao
arquivo: packages/nucleo/src/ia/suspensao.ts
teste: packages/nucleo/src/ia/provedor.test.ts › sem escola no contexto, cada uma lança antes de ler ou de gravar
-return this.suspensas.has(`${exigirEscolaDoContexto()}:${funcao}`)
+return this.suspensas.has(`${(() => { try { return exigirEscolaDoContexto() } catch { return '' } })()}:${funcao}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/suspensao.ts
teste: packages/nucleo/src/ia/provedor.test.ts › sem escola no contexto, a chamada não executa
-return this.suspensas.has(`${exigirEscolaDoContexto()}:${funcao}`)
+return this.suspensas.has(`${(() => { try { return exigirEscolaDoContexto() } catch { return '' } })()}:${funcao}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/consumo.ts
teste: packages/nucleo/src/ia/provedor.test.ts › sem escola no contexto, cada uma lança antes de ler ou de gravar
-this.registros.push({ ...consumo, escolaId: exigirEscolaDoContexto() })
+this.registros.push({ ...consumo, escolaId: (() => { try { return exigirEscolaDoContexto() } catch { return '' } })() })
```

```mutacao
arquivo: packages/nucleo/src/ia/consumo.ts
teste: packages/nucleo/src/ia/provedor.test.ts › sem escola no contexto, cada uma lança antes de ler ou de gravar
-const escolaId = exigirEscolaDoContexto()
+const escolaId = (() => { try { return exigirEscolaDoContexto() } catch { return '' } })()
```

```mutacao
arquivo: packages/nucleo/src/ia/consumo.ts
teste: packages/nucleo/src/ia/provedor.test.ts › o consumo fica na escola do contexto, e o orçamento conta só a escola em que é perguntado
-const daEscola = this.consumo.registros.filter((registro) => registro.escolaId === escolaId)
+const daEscola = this.consumo.registros
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª), llm-integrator (1ª) | `PedidoDeGeracao.escolaId` ficou redundante com o contexto: só serve à conferência de `provedor.ts:101`; "tirar o campo e acabar com a fonte dupla" | A tarefa 47.0 (`ia/execucao` sai da lista), que a tarefa já cita em "Fora do escopo" e que mexe no mesmo contrato; o `provedor.ts:101` fica como a 8.0 manda |
| llm-integrator (1ª) | O fixture envolve o provedor com `Object.create(ia)`, truque frágil se `ProvedorDeIa` passar a usar campos privados `#` | Recusada por ora: o revisor aprova, o fixture está documentado, e a condição é mudança futura da classe, que traria o teste de unidade vermelho; sem ação nesta tarefa |
| infra-guardian (1ª) | `tutor.service.ts:179` e `:397` chamam `this.orcamento.consultar` direto; sem escola no contexto o `Error` sem tipo de `exigirEscolaDoContexto` sairia como 500 | Recusada: o revisor diz que "atrás da guarda de sessão isso não acontece" e que "não bloqueia"; mudar a falha do `exigirEscolaDoContexto` é contrato dele, de outra tarefa. |
| revisor-geral (1ª) | `onda-1a.md` está com 2.722 palavras e o teto da `techspec.md` é 1.500; o arquivo já passava (2.442 no HEAD) | `TODO.md`: enxugar ou partir o arquivo na próxima tarefa da onda 1a que o tocar; a linha é escrita no `TODO.md` no commit da tarefa |
| revisor-geral (1ª) | O fixture vai para o `dist` do núcleo porque `tsconfig.build.json` só exclui `src/**/*.test.ts`; acrescentar `src/**/__fixtures__/**` ao `exclude` | `TODO.md`: a tarefa não toca o `tsconfig.build.json`; a linha é escrita no `TODO.md` no commit da tarefa |
| revisor-geral (2ª) | `ia.int.test.ts:577-580`: se o próprio `rollback` lançar, ele esconde o erro do `insert`; usar `await cliente.query('rollback').catch(() => undefined)` antes do `throw erro` | Recusada: o `rollback` só lança com a conexão já perdida, e o teste falha de qualquer jeito; o que se perde é o texto do erro do `insert`, só no diagnóstico de um ambiente quebrado |
| revisor-geral (2ª), test-engineer (2ª) | `ia.int.test.ts:694`: os padrões `= 0` em `[consumoAntesDeA = 0, consumoAntesDeB = 0]` não servem, porque `contar` já devolve número; a forma da linha 426 é mais limpa | Recusada: acabamento sem efeito no comportamento nem na prova; entra na próxima vez que alguém mexer nesse teste |
| test-engineer (2ª) | `ia.int.test.ts:427`: o comentário "B primeiro…" sugere que a ordem é o que torna a mutação vermelha; reescrever dizendo que ela garante que a tabela não está vazia quando A grava e que a falha é de escola errada, não de `not null` | Recusada: o revisor confirma que o teste fica vermelho em qualquer ordem, e o comentário atual não diz nada falso sobre o código; é só leitura |
| test-engineer (2ª) | `8_task.md:128`: o `limit(1)` sem `order by` deixa a linha escolhida indefinida; um `order by` deixaria o motivo da falha igual em toda execução | Recusada: o revisor confirma que o vermelho é garantido nos três casos possíveis, e o bloco é o que o portão aplica |

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
| 2026-10-22 14:00:57 | 2026-10-22 14:01:53 | `infra-guardian` | 1 | APROVADO | a4313a71f7966c8bc |
| 2026-10-22 14:00:54 | 2026-10-22 14:02:01 | `tenancy-guardian` | 1 | APROVADO | a89e47f892baed112 |
| 2026-10-22 14:01:00 | 2026-10-22 14:02:01 | `llm-integrator` | 1 | APROVADO | a5f6f3d59fafb52e8 |
| 2026-10-22 14:01:06 | 2026-10-22 14:02:17 | `revisor-geral` | 1 | APROVADO | a8d99ad04cef6146c |
| 2026-10-22 14:01:03 | 2026-10-22 14:04:24 | `test-engineer` | 1 | APROVADO | acaa4e00dd1b33c09 |
| 2026-10-22 14:14:22 | 2026-10-22 14:14:56 | `revisor-geral` | 2 | APROVADO | aaa314d95e34a3190 |
| 2026-10-22 14:14:07 | 2026-10-22 14:15:22 | `test-engineer` | 2 | APROVADO | a9079154b511c90ee |

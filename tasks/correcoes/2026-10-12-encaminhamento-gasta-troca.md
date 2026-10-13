# Correção — o e2e afirma "Hoje: 0 de 60" depois do encaminhamento, que gasta uma troca, e nenhum teste fixa a conta

**Origem:** esteira run 38261610727, job `e2e`, `e2e/aluno-fluxo.spec.ts:166` (linha 199), e o item 3 de "Devolvido sem corrigir" de `tasks/correcoes/2026-10-12-codigo-cru-no-nome-sintetico.md`; a verificação do Arquiteto está em `.processo/ordens/freio-e-assunto-delicado.md` (itens 3 a 5). Pedido do Orquestrador em 12/10/2026, com a decisão do Joaquim: "gasta, por ora".
**Subagentes obrigatórios:** `conformidade-reviewer`, `infra-guardian`
<!-- Os dois vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral` não entra: a correção altera 2 arquivos fora de `tasks/` e não toca `.github/`, `tools/ci/` nem `tools/processo/`. -->

## Sintoma

`e2e/aluno-fluxo.spec.ts:199` espera `Hoje: 0 de 60 perguntas` depois do cartão do assunto delicado, e recebe `Hoje: 1 de 60
perguntas · faltam 59`. A mesma linha passou na `develop` (19,0 s e 16,9 s) e caiu na esteira (24,6 s), no projeto `celular`.

## Fora desta correção

Nada: nenhuma tarefa em curso.

Também não entram, por pedido do Orquestrador: qualquer mudança em código do Tutor (`tutor.service.ts`, `tutor.repository.ts`,
`supervisao.repository.ts`, `orcamento.repository.ts`), o aviso de pausa que aponte um adulto e o 188 (item 2 da verificação, decisão
de produto), e o teto próprio do laço de mensagens delicadas (`TODO.md`, "Assunto delicado sem teto de IA").

## Causa

**A asserção tem o valor errado nos dois lados da corrida, e a conta que ela devia ter fixado nunca foi escrita.**

1. **O servidor conta 1, e está certo para a decisão de hoje.** O encaminhamento (`TutorService.#encaminhar`) grava a pergunta em
   `mensagem_tutor` com `autor = 'aluno'` e termina a execução `concluida`. As quatro contas leem "pergunta de aluno do dia cuja
   execução não `falhou`" e nenhuma olha o tipo do turno: o freio e o pacote (`OrcamentoRepository.trocas`), a barra do aluno
   (`TutorDoAlunoRepository.usoDeHoje`), as trocas de hoje e as do mês que a professora vê (`SupervisaoDoTutorRepository.trocasDeHoje`
   e `trocasDaTurmaNoMes`). O Joaquim ficou com "gasta, por ora" em 12/10/2026.
2. **A tela mostra o cartão antes de a conversa ser relida.** A execução terminada invalida `CHAVE_DA_CONVERSA_DO_TUTOR`
   (`Tutor.tsx`), e na janela entre o cartão e a releitura o `uso` ainda é o da leitura anterior, 0. A asserção `toContainText('Hoje:
   0 …')` passa se a releitura não chegou e cai se chegou: o resultado dependia da velocidade da máquina.
3. **Nenhum teste de integração lia o `uso` depois de um encaminhamento.** O caso "passa na frente do freio do dia" prova só que a
   mensagem fixa chega e o sinal nasce; e "a mesma conta nas três telas" não tem turno delicado no cenário. Por isso a linha 199 do
   e2e era o único lugar que "fixava" o número, e fixava o errado.

De quem é: a linha veio do e2e do fluxo do aluno, escrito com a conta velha na cabeça (`9f230db`, "E2E das telas do aluno…"). Não é
da correção `2026-10-12-teste-de-componente`, que a esteira testava quando a pegou.

## Teste que reproduz

- **O e2e, vermelho na esteira.** `e2e/aluno-fluxo.spec.ts` › `com a avaliação aberta o Tutor aparece pausado, a pergunta comum é
  recusada, e a mensagem de assunto delicado ainda recebe o 188`: `Hoje: 0 de 60 perguntas` esperado, `Hoje: 1 de 60 perguntas ·
  faltam 59` recebido (run 38261610727). A correção troca o valor para o certo e **espera por ele** (`timeout` da tela), em vez de
  ler a barra num instante: lida antes da releitura ela diz 0, e a asserção continua tentando até a releitura chegar. Sem corrida.
- **Três casos de integração**, em `apps/api/src/tutor/tutor.int.test.ts`, dentro de "assunto pessoal delicado (D36)", no grupo
  "o encaminhamento gasta uma troca, por ora":
  1. `a barra do aluno, a lista da professora e o mês da turma passam de 0 a 1 depois do encaminhamento`: aluno novo, `uso.hoje` 0,
     encaminhamento, `uso.hoje` 1, `trocasHoje` da professora 1 e `trocasDaTurmaNoMes` com um a mais.
  2. `com 59 trocas feitas, o encaminhamento é a 60ª: o estado vira limite e a dúvida comum seguinte é recusada`: `ligado` com 59,
     encaminhamento, `limite` com 60, e `429 LIMITE_DIARIO_DO_TUTOR` na dúvida comum.
  3. `no limite, o encaminhamento passa e a conta segue: 60 mais 1, com o estado limite, na barra do aluno e na lista da
     professora`: `limite` com 60, encaminhamento, `limite` com 61 e `trocasHoje` 61.

**Vermelho antes:** o código do Tutor já faz o que os casos afirmam, então não há vermelho de produto a mostrar. A prova de que os
casos falham quando a regra some são as quatro mutações abaixo, que tiram o encaminhamento de cada conta e derrubam o caso que a
fixa. A estabilidade do e2e, com o ambiente construído de pé: `npx playwright test e2e/aluno-fluxo.spec.ts --repeat-each 3 --workers 2`, 12 de 12 verdes (2,5 min, os dois casos em `chromebook` e `celular`, o do encaminhamento com 15,4 s a 16,0 s); antes, uma passada de `tools/ci/e2e.ts` com os 4 verdes.

## Correção

- `e2e/aluno-fluxo.spec.ts`: `Hoje: 1 de 60 perguntas`, com o `timeout` da tela, e o comentário que diz por que o 1 e por que a
  espera. O resto do teste não muda.
- `apps/api/src/tutor/tutor.int.test.ts`: os três casos acima, e o comentário do grupo, que diz que a decisão é "por ora" e que as
  quatro contas mudam juntas se ela mudar.

Não muda: código de produção, contrato, mensagem fixa, `TODO.md`.

## Mutações

Cada bloco tira o encaminhamento (a execução que tem uma resposta `assunto_delicado`) de uma das quatro contas, que leem a mesma
linha. O caso citado tem de cair.

```mutacao
arquivo: apps/api/src/ia/orcamento.repository.ts
teste: apps/api/src/tutor/tutor.int.test.ts › com 59 trocas feitas, o encaminhamento é a 60ª
- eq(mensagemTutor.autor, 'aluno'),
+ eq(mensagemTutor.autor, 'aluno'),
+ sql`not exists (select 1 from mensagem_tutor delicada where delicada.escola_id = ${mensagemTutor.escolaId} and delicada.execucao_id = ${mensagemTutor.execucaoId} and delicada.tipo = 'assunto_delicado')`,
```

```mutacao
arquivo: apps/api/src/tutor/tutor.repository.ts
teste: apps/api/src/tutor/tutor.int.test.ts › a barra do aluno, a lista da professora e o mês da turma passam de 0 a 1
  eq(mensagemTutor.alunoId, alunoId),
- eq(mensagemTutor.autor, 'aluno'),
+ eq(mensagemTutor.autor, 'aluno'),
+ sql`not exists (select 1 from mensagem_tutor delicada where delicada.escola_id = ${mensagemTutor.escolaId} and delicada.execucao_id = ${mensagemTutor.execucaoId} and delicada.tipo = 'assunto_delicado')`,
```

```mutacao
arquivo: apps/api/src/tutor/supervisao.repository.ts
teste: apps/api/src/tutor/tutor.int.test.ts › no limite, o encaminhamento passa e a conta segue: 60 mais 1
  inArray(mensagemTutor.alunoId, [...alunos]),
- eq(mensagemTutor.autor, 'aluno'),
+ eq(mensagemTutor.autor, 'aluno'),
+ sql`not exists (select 1 from mensagem_tutor delicada where delicada.escola_id = ${mensagemTutor.escolaId} and delicada.execucao_id = ${mensagemTutor.execucaoId} and delicada.tipo = 'assunto_delicado')`,
```

```mutacao
arquivo: apps/api/src/tutor/supervisao.repository.ts
teste: apps/api/src/tutor/tutor.int.test.ts › a barra do aluno, a lista da professora e o mês da turma passam de 0 a 1
  eq(mensagemTutor.turmaId, turmaId),
- eq(mensagemTutor.autor, 'aluno'),
+ eq(mensagemTutor.autor, 'aluno'),
+ sql`not exists (select 1 from mensagem_tutor delicada where delicada.escola_id = ${mensagemTutor.escolaId} and delicada.execucao_id = ${mensagemTutor.execucaoId} and delicada.tipo = 'assunto_delicado')`,
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-12 22:19:11 | 2026-10-12 22:19:49 | `infra-guardian` | 1 | APROVADO | a83c2a8fa5d6be5aa |
| 2026-10-12 22:19:10 | 2026-10-12 22:20:00 | `conformidade-reviewer` | 1 | APROVADO | a3089493c798a89f9 |
| 2026-10-12 22:19:12 | 2026-10-12 22:20:53 | `test-engineer` | 1 | APROVADO | aefbdf0be1d3aa383 |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | `tutor.int.test.ts:363`: o 61 de 60 confirma o laço sem teto de IA do encaminhamento; registrar o número no item do TODO | `TODO.md`, itens "O encaminhamento do assunto delicado (D36) gasta uma das 60 trocas do dia (D38)?" e "Assunto delicado sem teto de IA": o Orquestrador registra ao fechar a correção, que declara não mudar o `TODO.md` |
| infra-guardian (1ª) | `tutor.int.test.ts:346`: turma própria no caso do mês, para não depender de o arquivo rodar em sequência | Recusada: só importa se o arquivo passar a rodar com `concurrent`, o que o revisor diz que hoje não acontece; turma própria muda o cenário do caso e não cabe em poucas linhas. Quem ligar o `concurrent` corrige |
| infra-guardian (1ª) | `e2e/aluno-fluxo.spec.ts:202`: a espera com `PRAZO_DA_TELA_MS` resolve a corrida, e o cenário de carga não muda | Sem ação: observação, o revisor não pede mudança |
| conformidade-reviewer (1ª) | `TODO.md:979-981` ficou desatualizado ("nenhum teste fixa a conta", "`aluno-fluxo.spec.ts:199` afirma 0 de 60") e as referências de linha do grupo se deslocaram | `TODO.md`, mesmo item: o Orquestrador aponta para o grupo "o encaminhamento gasta uma troca, por ora" de `tutor.int.test.ts` ao fechar a correção |
| conformidade-reviewer (1ª) | O caso das 59 trocas fixa que um aluno que relata bullying na 59ª troca perde a última dúvida comum do dia: argumento para a decisão definitiva | `TODO.md`, mesmo item (dono: Joaquim), junto do aviso de pausa que aponta um adulto e do 188. Não é código desta correção |
| conformidade-reviewer (1ª) | Afirmar, no caso 1, que o sinal ao professor nasce sem o conteúdo | Recusada: o sinal sem conteúdo já é afirmado por três casos do mesmo arquivo (`tutor.int.test.ts:297`, `:327` e `:378`), e uma afirmação nova pediria bloco em "Mutações" que repete o deles; o grupo novo é da conta |
| test-engineer (1ª) | Nenhum caso afirma que o encaminhamento conta no pacote do mês (`porMes`) | `TODO.md`, mesmo item: caso novo com setup próprio e mutação própria; entra na primeira tarefa que alterar `tutor.int.test.ts` com o pacote |
| test-engineer (1ª) | Nenhum caso com duas chamadas em paralelo e a mesma chave no encaminhamento, provando que a troca conta uma vez só | `TODO.md`, mesmo item: caso novo, e pode achar defeito de produção, que seria `/corrigir` próprio quando o Joaquim fechar a decisão |

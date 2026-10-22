# Achados das revisões — `tasks/correcoes/ouro-base-qualitativa.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## llm-integrator · 1ª rodada · APROVADO · 2026-10-22 11:39:48 · `tasks/correcoes/ouro-base-qualitativa.md`

VEREDITO: APROVADO
Perfis usados: nenhum. A correção só mexe em teste e não faz chamada de modelo. Os testes do ouro rodam sobre os detectores determinísticos, sem provedor.
Custo estimado por professor/mês: não se aplica. Esta correção não adiciona chamada de modelo, então custo adicional é zero.
Prompt versionado: não se aplica (sem prompt novo ou alterado).
Validação de schema: sim. Os casos alterados exercitam o leitor `lerMedidas`/`interpretar` do ouro, que valida o `MEDIDAS.json` com zod e recusa o arquivo quando a base está nula depois da tarefa de `semBaseAte`.
Aprovação humana no caminho: não se aplica.
Bloqueantes: nenhum.

Verifiquei o diff de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/ouro.test.ts`:
- Os dois casos "base nula" agora fixam `base = null` no `MEDIDAS` bruto antes de estragar o resto. Continuam provando a mesma regra, independentes da base real gravada.
- `repositorioFabricado` clona o `MEDIDAS.json` da cópia, põe a base nula e regrava. O caso que prova a lista de tarefas com a 3.0 marcada recusando a base nula continua válido.
- `lerJson`, `Objeto`, `dentro` e `writeFileSync` já estavam importados ou definidos no arquivo.
- Rodei o arquivo: 93 de 93 passam. A medida atual de `saidaQualitativa` é recall 0,931 (54/58), precisão 1 e 0 de 41 legítimas barradas, o que bate com o declarado na tarefa.
- A base e o `SELO.json` não foram tocados, como a tarefa declara.

Recomendações:
- O `it` "não cai da base" para `saidaQualitativa`, como o de `saidaComNota`, está adiado para a próxima mudança de regra do `ouro.test.ts`. Sem ele, uma queda da base fica sem teste que a prove.
- `aponta_erros` está em 8/12, a categoria mais fraca da `saidaQualitativa`. Vale olhar nos próximos exemplos de ouro, sem bloquear nada.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 11:40:33 · `tasks/correcoes/ouro-base-qualitativa.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta correção não traz regra nova, então os cenários são os que já existiam e que a base gravada quebrava.
- O `ouro.test.ts` inteiro volta a carregar com a 3.0 marcada `[x]` na lista real e a base de `saidaQualitativa` preenchida.
- `base nula sem semBaseAte é recusada` continua provando a recusa.
- `base nula depois da tarefa de semBaseAte fica vermelha, e antes dela não` continua provando os dois lados.
- `lerMedidas lê a lista de tarefas três pastas acima do ouro` continua distinguindo a lista com 3.0 aberta da lista com 3.0 fechada.
- A medida de hoje bate com a da ordem do Arquiteto: recall 0,931 (54/58) e 0 de 41 legítimas barradas.

**Cobertos:** todos os cinco.
- Rodei `npx vitest run packages/nucleo/src/ia/ouro.test.ts`: 93 de 93 passam. A linha impressa traz `recall 0.931 (54/58)` e `0 de 41 legítimas barradas`, os mesmos números da ordem em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/.processo/ordens/correcao-ouro-base-qualitativa.md`.
- Conferi as mutações declaradas em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/1_task.md` contra o diff, lendo o código e sem alterar nada. Todas continuam vermelhas pelo motivo certo:
  - **`:233`** (o `refine` vira `() => true`): o teste anula a base e apaga o `semBaseAte`, e nada mais recusa. O teste fica vermelho, enquanto o `lerMedidas()` do topo segue verde porque a base real está preenchida.
  - **`:324` e `:331`** (a condição vira `false` ou `tarefaConcluida('0.0')`): com a base anulada no teste e o predicado `=== '3.0'`, o primeiro `expect(...).toBe(true)` cai. O cenário chega à cláusula.
  - **`:268`** (`'../..'`): continua vermelho por `ENOENT`, tanto no repositório fabricado quanto no topo. É o mesmo caminho de falha já registrado na 1.0.
  - **`:344`** (`Error` no lugar de `OuroRecusado`): no repositório fabricado com `[x]`, a base agora é nula, então ele lança `Error` e o `toThrow(OuroRecusado)` cai.
- O terceiro caso, `repositorioFabricado` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/ouro.test.ts:386-397`, não está na ordem do Arquiteto, mas é necessário. Sem anular a base na cópia, o `[x] 3.0` não lançaria, e o caso ficaria vermelho pelo motivo errado ou deixaria de provar a regra. O documento da correção pegou isso.
- **Mutações:** o diff só mexe em teste e não cria cláusula nova. A declaração "Nenhuma cláusula nova" confere.
- Não há `.skip`, mock nem provedor de IA, e não há operação concorrente envolvida.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `ouro.test.ts:247-259` ("categoria e id do MEDIDAS que não existem no corpus"), vale somar o caso `['base de saidaQualitativa', ...]` com uma categoria `inventada`. Agora que a base existe, a checagem de categoria (`ouro.ts`, `if (base !== null) confere(...)`) também vale para ela, e hoje só as outras cinco políticas têm caso nominal.
2. Ainda não existe um `it` "saidaQualitativa não cai da base", como o de `saidaComNota`. A base está gravada, mas hoje só o alvo protege (recall ≥ 0,9 e 0 legítimas, `:649-665`). Se `aponta_erros` cair de 8/12 para 7/12, nada fica vermelho, porque o recall seguiria em 0,914 (53/58), ainda acima de 0,9. O documento e a ordem deixam isso de fora de propósito, como a próxima mudança de regra. Fica registrado para o `/validar` e o `/retro`, para que não se perca.
3. Em `ouro.test.ts:391`, o `structuredClone` sobre o `lerJson(...)` é redundante, porque o JSON já sai recém-parseado. É detalhe de limpeza.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 11:49:21 · `tasks/correcoes/ouro-base-qualitativa.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta correção não traz cláusula nova. Ela só prepara três testes que já existiam. Por isso, o que precisava ficar provado é:
- cada um dos três testes continua provando a mesma regra, agora que o `MEDIDAS` real tem base em `saidaQualitativa`;
- uma categoria inventada na base de `saidaQualitativa` é recusada, agora que essa base existe;
- a suíte `ouro.test.ts` volta a ficar verde depois que a 3.0 foi marcada como concluída.

**Cobertos:**
- `base nula sem semBaseAte é recusada` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/ouro.test.ts:268`). O teste agora zera a base de propósito antes de tirar o `semBaseAte`. Sem isso, a base real (não nula) faria o caso passar sem chegar à regra.
- `base nula depois da tarefa de semBaseAte fica vermelha, e antes dela não` (`ouro.test.ts:275`). Também zera a base primeiro, e confere os dois lados: recusa com a 3.0 concluída e aceita com a 2.0.
- `lerMedidas lê a lista de tarefas três pastas acima do ouro` (`ouro.test.ts:400`). A cópia que o `repositorioFabricado` monta (`:387-398`) ganha a base nula. A mesma cópia passa com `[ ]` e é recusada com `OuroRecusado` com `[x]`. A única diferença entre os dois lados é a lista de tarefas, então o caso só é recusado pelo motivo certo.
- `base de saidaQualitativa` (`ouro.test.ts:253`) entra na tabela de categorias inventadas. Antes ela não podia entrar, porque a base era nula. Se o caminho até a base quebrasse, o `dentro` lançaria `TypeError`, e o `recusa` deixa esse erro subir em vez de contá-lo como recusa (teste em `:407`). Então o caso não passa por acidente.
- A troca de `structuredClone(lerJson(...))` por `lerJson(...)` em `:392` não muda nada: o objeto é lido de novo do disco a cada chamada e regravado em seguida.
- Rodei `npx vitest run packages/nucleo/src/ia/ouro.test.ts`: 94 de 94 testes passaram. A medida impressa de `saidaQualitativa` (recall 0,931, 54/58, precisão 1, 0 de 41 legítimas barradas) bate com a base que o documento descreve.
- Não há `.skip`, nem mock, nem chamada a provedor. Todos os testes leem as amostras fixas do `ouro`.

**Bloqueantes:** nenhum.

**Recomendações:**
- Nas duas formas de recusa da base nula (`:279` e `:402`), dá para conferir também o texto do erro (`a tarefa 3.0 já fechou e a base continua nula`). Hoje o teste só confere que foi recusado. Não bloqueia, porque o lado de controle de cada caso já isola o motivo, mas deixaria a falha mais fácil de entender se outra validação começar a recusar a mesma cópia.
- O documento já registra que comparar a medida de hoje com a base de `saidaQualitativa` (um "não cai da base", como o de `saidaComNota`) fica para a próxima mudança de regra. Até lá, a base gravada só é validada no formato, e uma piora na medida dessa política não fica vermelha.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/ouro.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/correcoes/ouro-base-qualitativa.md`

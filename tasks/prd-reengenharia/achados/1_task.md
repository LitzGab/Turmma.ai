# Achados das revisões — `tasks/prd-reengenharia/1_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-21 20:19:36 · `tasks/prd-reengenharia/1_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa não muda código de produção. `git status` não mostra mudança em `docs/` nem em `packages/nucleo/src/ia/tarefas/`. Os três arquivos novos só leem o `ouro` e medem funções que já existem. Todos com autor humano? sim, porque nenhum caminho novo grava em `Nota`.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhuma saída de IA nova chega ao aluno.
Supervisão do tutor: ok. As funções do Tutor (`ehAssuntoDelicado`, `pedeRespostaPronta`, `mencionaRiscoAVida`) só são chamadas como medida, sem efeito no fluxo.
Autonomia declarada e visível: sim, sem mudança. Nenhum agente foi criado e nenhum nível foi alterado.
Bloqueantes: nenhum

**O que conferi da regra 70**
- **D55 (item 2a).** `saidaComNota` agora tem piso em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/ouro.test.ts:483`. Nenhuma categoria pode cair abaixo da base. A base também se reproduz exatamente, para cima e para baixo, em :477.
- **Julgamento de texto de aluno.** `julgamentoDeTextoDeAluno` fica preso à reprodução exata da base em :467, que é mais rígida que um piso. Assim nenhuma mudança passa calada até a 2.0.
- **D55, devolutiva qualitativa.** `saidaQualitativa` ainda não tem base e não fica esquecida. Quando a 3.0 for marcada como concluída em `tasks.md`, o leitor fica vermelho se a base continuar nula: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/__fixtures__/ouro.ts:157`, testado em `ouro.test.ts:222`.
- **Selo do corpus.** O corpus que mede as políticas de conformidade está selado em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/selo-do-ouro.test.ts`. Byte trocado, arquivo a mais e arquivo a menos ficam vermelhos cada um. Ninguém consegue afrouxar a medida mexendo nas amostras.
- **Dado de pessoa.** O esquema é estrito. Recusa `fonte` fora de `sintetica`/`revisor` e chave a mais, como `pessoa` ou `nomeDoAluno` (`ouro.test.ts:129`, :150, :162). Isso impede que entre no `ouro` amostra marcada como de aluno real ou com campo de pessoa.
- **O que o teste imprime.** A saída mostra só id e categoria (`quaisErraram`, `linhaDaMedida`), nunca o texto da amostra.
- **Itens 7, 8 e 9.** Não se aplicam: a tarefa não toca sinal sobre aluno, indicador de professor nem tela.
- **Execução.** Rodei os dois arquivos: 70 de 70 testes passaram. As medidas batem com a base, por exemplo `riscoAVida` 16/75, precisão 0,593, e `ameaca_a_terceiro` 1/7.

Recomendações:
1. **Brechas medidas em `saidaComNota`, para a 2.0 tratar primeiro.** A medida de hoje mostra onde o filtro deixa passar nota ou conceito sobre texto de aluno: `nota_numerica` 10/15, `conceito_em_letra` 6/8, `percentual` 0/1, `aprovacao` 0/1 (recall 0,743). Essas são as brechas mais próximas de violar a D55 em produção. A tarefa não abre essa lacuna, só a mede.
2. **Brecha em `julgamentoDeTextoDeAluno`.** `rubrica_com_texto_de_aluno` está em 0/1. Uma rubrica pedida junto com o texto do aluno é justamente a porta para pré-correção, que a regra 70, item 2a, proíbe. A 2.0 deve cobrir esse caso.
3. **Na 2.0, trocar reprodução exata por piso.** Quando `riscoAVida` e `julgamentoDeTextoDeAluno` mudarem de reprodução exata para piso, conferir que o piso continua por categoria. Uma categoria que sobe não pode compensar a que cai, como já faz `quedasDaBase` em `ouro.ts:234`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-21 20:20:01 · `tasks/prd-reengenharia/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/ouro.test.ts:76`: `recusa()` dá certo com qualquer exceção, e não só com a recusa do zod. Os testes que deviam ser vermelhos hoje são, porque o portão aplicou as mutações e todas ficaram vermelhas. Mas um erro sem relação com o caso, por exemplo um `TypeError` no próprio dado montado pelo teste, também passaria como "recusado". O teste ficaria mais forte se conferisse o tipo do erro (`ZodError`) ou o caminho da falha (`issues[0].path`).
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/1_task.md:65` e `:95`: a mutação passou de `/\bmateria\b/` para `/\bmae\b/`. A troca está registrada como divergência e o motivo se confirma. No `assuntoDelicado.json`, "matéria" só aparece no nome da categoria `duvida_da_materia`, nunca no texto de uma amostra. E "mãe", sem acento, aparece na AD-046 (`nao_casa`). Não é divergência da Tech Spec, que não define essa mutação, e esta spec não tem `cenarios.md`. Mesmo assim, a linha da tabela de testes foi reescrita pela mesma mão que implementou. Convém que o `test-engineer` confirme que a troca é dele.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/ouro.test.ts:445-449`: a reprodução exata de `assuntoDelicado` fica vermelha assim que a 2.0 acrescentar padrões a `GATILHOS_DE_RISCO_A_VIDA`, porque `ehAssuntoDelicado` (`turno-do-tutor.ts:203`) também usa esses padrões. A 2.3 já prevê trocar essa reprodução pela regra de não cair da base. Fica o aviso para que a 2.0 não a trate como regressão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-21 20:20:42 · `tasks/prd-reengenharia/1_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Leitor:** as contagens do desenho e cada campo recusado (chave a mais, `fonte`, `esperado`, `contexto`, alvo, categoria, `medidoSem`, base nula, `semBaseAte`, `nao_cair_da_base` em política nova).
- **Reprodução exata da `base`:** cada uma das cinco políticas com função, incluindo `ameaca_a_terceiro` à parte e o `medidoSem`.
- **Mapeamento do README:** `comQuestao` e `turnoAnteriorDoAluno` em `pedidoDeRespostaPronta`, e `turnosDoProfessor` em `julgamentoDeTextoDeAluno`.
- **Comparador:** diferença para cima, queda com o total igual, falso positivo novo numa `nao_casa`.
- **Selo:** a pasta real confere, e byte trocado, arquivo a mais e arquivo a menos ficam vermelhos.
- **Raiz por `import.meta.url`.**
- Concorrência, isolamento e log não se aplicam, porque a tarefa só lê arquivo. Concordo.

**Cobertos:**
- As 24 linhas da tabela têm teste, e cada mutação da tabela tem bloco que aponta o caso certo.
- `npx vitest run --project unidade` nos dois arquivos: 70 testes verdes, com a medida impressa por política.
- Nenhum `.skip`, `.todo` nem mock. As funções reais de `turno-do-tutor.ts` e `propor-ferramenta.ts` são chamadas sobre a amostra fixa, sem provedor.
- O formato de `tasks/prd-reengenharia/tasks.md` (`- [ ] **3.0 — …`) casa com a regex de `tarefaConcluidaNaLista`, então a regra "base nula depois da tarefa de `semBaseAte`" vai disparar na lista real e não só na lista fabricada do teste.

**Bloqueantes:**

1. **Cláusulas novas sem bloco em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/__fixtures__/ouro.ts`.** Nenhum teste fica vermelho se qualquer uma delas sair:
   - `:29-32`: os tipos do `contexto`. Por exemplo, `comQuestao: z.boolean()`: um `"sim"` passaria se virasse `z.unknown()`. Também os `min(1)` de `turnoAnteriorDoAluno`, `turnosDoProfessor` e `mensagemDoProfessor`.
   - `:37` `texto: z.string().min(1)` e `:38` `categoria: z.string().min(1)`.
   - `:48-51`: `regra` e `escritoPor` com `min(1)`, `versao: z.number().int().min(1)`, `amostras: …min(1)`.
   - `:74`: `certos: …int().min(0)` e `total: …int().min(1)`. O refinamento `certos <= total` tem bloco, os limites não. `{ certos: -1, total: 0 }` e `{ certos: 0, total: 0 }` passariam.
   - `:80`: `medidaEm: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`.
   - `:99`: os valores de `perdaMaxima`, `z.number().int().min(0)`.
   - `:119`: `legitimasBarradas: z.number().int().min(0)`.
   - `:198` `contagem.total += 1` e `:203` `positivas += 1`. Hoje os testes do medidor já os pegam, por `toEqual` e pelo recall, mas falta o bloco.

   **Correção exigida:** para cada uma, um caso que recuse o valor (um `it.each` de "campo inválido é recusado" basta) e o bloco `mutacao` apontando para ele. Ou então tire a cláusula, se ela não é regra.

   Algumas são mutantes equivalentes, e nenhum teste consegue deixá-las vermelhas: o `min(1)` das chaves e listas do `MEDIDAS` (`:83`, `:99`, `:102`, `:103`, `:111-113`). A string vazia já é recusada pelo cruzamento com o corpus, porque `categoria` e `id` do corpus não aceitam vazio. Essas devem sair, e não ganhar bloco.

**Recomendações:**
- O piso de `pedidoDeRespostaPronta` (`ouro.test.ts:462`) e o de `saidaComNota` (`:483`) não têm mutação própria; só o de `assuntoDelicado` tem a do `/\bmae\b/`. O comparador está provado nos testes de unidade, mas um bloco por piso, com um falso positivo plantado numa `nao_casa` de cada política, mostraria que a ligação política→base está certa nas três.
- A mutação de `raizDoRepositorio` (`ouro.ts:134`) aponta para o `describe` inteiro e fica vermelha por ENOENT na carga do módulo. Um caso direto, com `lerMedidas(<cópia>)` e um `tasks.md` na raiz fabricada, nomearia a falha.
- `quaisErraram` corta em 40 ids. Na reprodução isso basta, mas vale dizer no texto quantos ficaram de fora quando passar de 40.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-21 20:36:09 · `tasks/prd-reengenharia/1_task.md`

**VEREDITO: APROVADO**

Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. `conferir` diz "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)"
Bloqueantes: nenhum

Esta rodada cobriu o diff da árvore `83580e5` para a `cde9502`. Conferi as três correções exigidas pelo `test-engineer`:

- **`min(1)` tirados do `MEDIDAS`.** Nada se perdeu com isso. Uma chave ou um item vazio no `MEDIDAS` não tem categoria igual no corpus, porque lá `categoria` exige ao menos um caractere. Então o cruzamento em `interpretarMedidas` já recusa esse caso (`packages/nucleo/src/ia/__fixtures__/ouro.ts:144-159`), e a regra continua de pé.
- **`OuroRecusado` e `recusa()`.** A recusa agora tem tipo próprio (`ouro.ts:127`, lançado em `ouro.ts:164`), e `recusa()` só a aceita junto com o `ZodError`. Qualquer outro erro sobe e não passa mais por recusa. Os dois lados têm mutação declarada: uma tira o `ZodError` da lista, a outra tira o `OuroRecusado`.
- **Campos inválidos e `lerMedidas`.** Cada `int()`, `min()` e `regex()` dos casos novos tem um bloco de mutação. O caso de `lerMedidas` monta um repositório falso e testa a regra das "três pastas acima" pelos dois lados: com a tarefa 3.0 aberta não lança, com ela fechada lança `OuroRecusado`. A mutação que antes apontava para o `describe` inteiro agora aponta para esse caso.

A tabela "Recomendações sem aplicar" manda cada item para uma tarefa que existe em `tasks/prd-reengenharia/tasks.md`: 2.0 na linha 22, 3.0 na linha 28 e 27.0 na linha 186. O motivo de cada uma é concreto.

Recomendações:
- `packages/nucleo/src/ia/ouro.test.ts`: `quaisErraram`, a constante de 40 ids e `recusa()` são auxiliares do teste que agora têm testes e mutações próprios. Se outras tarefas forem usar esses auxiliares, vale levá-los para um arquivo de apoio do teste, para não acumular regra dentro do arquivo de teste.
- `ouro.ts:127`: `OuroRecusado` não define `name`. Assim, a mensagem de falha do vitest mostra `Error` e não o nome da classe. Pode ficar, mas um `name = 'OuroRecusado'` deixaria o diagnóstico mais claro.

## test-engineer · 2ª rodada · APROVADO · 2026-10-21 20:37:15 · `tasks/prd-reengenharia/1_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** são as 24 linhas da tabela de testes de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/1_task.md`. Somam-se as cláusulas que a 1ª rodada achou sem bloco, as que a 2ª rodada acrescentou (`OuroRecusado`, o `recusa()` que repassa o erro de outro tipo, o limite de 40 ids em `quaisErraram`) e os dois pisos (`pedidoDeRespostaPronta`, `saidaComNota`). Concorrência, isolamento e log não se aplicam, porque a tarefa só lê arquivo.

**Cobertos:**
- **Correção 1, feita.** Cada cláusula citada agora tem um caso que recusa o valor e um bloco `mutacao` apontando para ele. Conferi que cada caso chega à cláusula pelo motivo certo, e não por outra recusa que já existia:
  - `contexto`: o tipo de `comQuestao` (`'sim'`), os `min(1)` de `turnoAnteriorDoAluno`, `turnosDoProfessor` e `mensagemDoProfessor`, e o tipo de lista de `turnosDoProfessor` (`ouro.test.ts:188-199`).
  - Amostra: `texto` e `categoria` vazios. A categoria vazia só é recusada pelo próprio esquema do corpus, porque o corpus não é cruzado com o `MEDIDAS` (`:201-209`).
  - Corpus: `regra`, `escritoPor`, `versao` (zero e fracionada) e `amostras: []` (`:211-220`).
  - `MEDIDAS`: `certos` e `total` (inteiro e limite), `medidaEm`, `perdaMaxima` e `legitimasBarradas` (`:317-334`).
    - O caso `total: 0` só é recusado pelo `min(1)`, porque o `refine` aceita `0 <= 0`.
    - `perdaMaxima` usa a chave `explicita`, que existe no corpus de `riscoAVida`. Assim o cruzamento com o corpus não mascara a mutação.
  - `contagem.total += 0` e `positivas += 2` ficam vermelhos em "conta o acerto de cada categoria" e em "o recall é das casa…".
- **Correção 2, feita.** O `min(1)` saiu das chaves e listas do `MEDIDAS` (`ouro.ts:84, 100, 103, 104, 112-114`), sem bloco, como pedido.
- **Recomendações aplicadas:**
  - **Um bloco por piso.** O de `pedidoDeRespostaPronta` acrescenta `/\bexplic\w*\b/` a `PEDIDOS_DIRETOS`, a lista que vale sempre. Isso derruba `duvida_legitima`, que hoje está em 14/14 (PR com "dá pra explicar…", "pode explicar de outro jeito?", "me explica…", todas `nao_casa`). O de `saidaComNota` tira o lookahead, e "Separei 3 pontos importantes…" (`numero_que_nao_e_nota`, `nao_casa`) cai.
  - **Caso direto para `raizDoRepositorio`.** `ouro.test.ts:382-385` copia o ouro para um repositório fabricado em pasta temporária e exige `OuroRecusado` quando a 3.0 aparece concluída. A mutação `'../..'` fica vermelha porque `docs/tasks/...` não existe, ou seja, pelo caminho errado.
  - **`quaisErraram` com "e mais N".** Os quatro blocos são mortos pelas asserções de `:407-415`.
  - **`recusa()` confere o tipo do erro.** O `TypeError` sobe (`:389-396`), e os blocos que tiram `ZodError` ou `OuroRecusado` ficam vermelhos em testes que dependem de cada um.
- **A troca de `/\bmateria\b/` por `/\bmae\b/` está certa.** Nenhum texto do corpus `assuntoDelicado` tem "matéria" (só aparece no nome de categoria `duvida_da_materia`), então `/\bmateria\b/` seria um mutante equivalente, que não deixa nenhum teste vermelho. Já AD-046, "a mãe do Bentinho…", é `nao_casa` de `duvida_da_materia` e hoje passa. O texto é normalizado antes do teste (`ehAssuntoDelicado` chama `normalizar`), e a linha de âncora (`turno-do-tutor.ts:116`) está dentro de `GATILHOS_DE_ASSUNTO_DELICADO` (100-124). Com o padrão novo, a categoria cai de 12 para 11 e `quedasDaBase` fica vermelho. O bloco do documento (`1_task.md:553-559`) e a divergência registrada na linha 95 batem com isso.
- **Rodada de agora:** `npx vitest run --project unidade` sobre `ouro.test.ts` e `selo-do-ouro.test.ts`, 95 de 95 verdes. Sem `.skip`, sem mock de código nosso e sem provedor pago.

**Bloqueantes:** nenhum.

**Recomendações:**
- O bloco de `1_task.md:335-339` só tem a linha `-`, ou seja, apaga o `throw`. É válido, mas um `+` explícito (por exemplo `+ if (false) throw new OuroRecusado(...)`) deixaria a intenção mais clara para quem ler o documento.
- No caso de `lerMedidas` (`ouro.test.ts:382`), a mutação `'../..'` fica vermelha por `ENOENT` já no `MEDIDAS = lerMedidas()` do topo do arquivo, e não na asserção do caso. O caminho está certo, mas a falha aparece como erro de carga do arquivo inteiro. Para isolar, o caso poderia montar a raiz sem depender da leitura do topo. Fica para o `/retro`, não bloqueia.

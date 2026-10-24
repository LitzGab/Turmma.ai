# Achados das revisões — `tasks/correcoes/2026-10-24-portao-avisa-divergencia.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 12:46:24 · `tasks/correcoes/2026-10-24-portao-avisa-divergencia.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. É uma correção de processo e não tem Tech Spec. O que foi feito é o que a M3 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tasks/prd-harness/retro.md:223-230` pede: o aviso só informa, sai logo depois do `--faltando` e antes das suítes, e não muda o código de saída nem o carimbo. O que o documento deixa de fora, de propósito (a seção 11 e os commits anteriores da branch), está escrito nele.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

Recomendações:
- `tools/processo/divergencias.ts:19`: o filtro `/^nenhuma\b/i` também descarta uma divergência de verdade que comece por "Nenhuma", por exemplo "Nenhuma rota muda de nome, mas o DTO ganha campo". Exigir a célula ou a frase inteira (`^nenhuma\.?\s*(\||$)`) evita essa falha calada.
- `tools/processo/divergencias.ts:49`: qualquer mudança na `techspec.md` ou no `cenarios.md` cala o aviso, mesmo sem relação com a linha nova. Isso basta para um aviso que só informa, mas vale uma frase no comentário do topo dizendo que a conferência é por arquivo, não por conteúdo, para ninguém tomar o silêncio como prova.
- `tools/processo/divergencias.ts:52-53`: a mensagem cita "o documento que a seção 11 aponta", que o próprio portão não confere (linha 20 do documento da tarefa). Está certo como lembrete, mas pode passar a impressão de que foi conferido.
- `tools/processo/divergencias.test.ts:102`: os repositórios temporários do `mkdtempSync` ficam no `tmpdir` depois do teste. Um `afterEach` com `rmSync` deixa a máquina limpa.
- O item da M3 em `TODO.md` e na retro ainda não está marcado como feito. Pelo padrão da M2 (`6f8e64d7`), isso vai num commit à parte depois do pouso. Fica o lembrete.

Testei à parte `divergenciasNovas` nos `15_task.md`, `18_task.md` e `19_task.md` da X7, comparando a versão de quando as tarefas foram geradas (`d57bf2b5`) com a última. A função achou 6, 7 e 4 linhas, todas divergências de verdade. O parágrafo de instrução do modelo não entrou como falso positivo, porque já está no HEAD desde a geração das tarefas.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tasks/correcoes/2026-10-24-portao-avisa-divergencia.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tools/processo/divergencias.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tools/processo/divergencias.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tools/processo/portao-local.ts`

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 12:47:36 · `tasks/correcoes/2026-10-24-portao-avisa-divergencia.md`

**VEREDITO: APROVADO**

**Cenários exigidos**
- **Caminho feliz:** uma linha nova na seção "Divergências resolvidas nesta tarefa", sem `techspec.md` nem `cenarios.md` alterados, gera o aviso com o documento, a quantidade de linhas e os dois arquivos.
- **Bordas reais do documento de tarefa:** linha que o HEAD já tinha; documento novo, sem versão no HEAD; "nenhuma" em tabela e "Nenhuma." em texto corrido; cabeçalho e separador da tabela; comentário HTML e linha em branco; linha da seção seguinte (`## Mutações`); seção que é a última do documento; documento sem a seção; divergência escrita em texto corrido; `techspec.md` de outra spec ou da raiz, que não vale.
- **Ausência de aviso:** sem linha nova; `techspec.md` alterada; `cenarios.md` alterado.
- **Ligação:** o portão imprime o aviso antes das suítes, e só informa (não tem `process.exit` nem recusa).
- **Permissão, isolamento e concorrência:** não se aplicam. É ferramenta de processo, não toca dado de escola e não tem operação concorrente.

**Cobertos**
- **Os 21 casos passam:** cada cenário acima tem caso próprio em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tools/processo/divergencias.test.ts`. A integração usa um repositório git de verdade, num diretório temporário, com commit e escrita depois do commit.
- **As 15 mutações:** conferi cada uma contra o fonte e contra o caso citado. Todas deixam o caso citado vermelho por asserção, nenhuma por erro de carga. A do `texto === null` lança `TypeError` dentro do caso, que rodou e falhou.
- **Cláusula nova sem bloco:** nenhuma. Conferi as cláusulas de `divergencias.ts:16-19, 25, 28, 29, 31, 39, 47, 49, 65` e a ligação em `portao-local.ts:172-173`. O `--faltando` também diz que nenhuma linha fica sem bloco.
- **Carimbo:** `portao-local.ts conferir` diz que o carimbo vale para o código atual.
- **Proibições da regra 40:** não há `.skip`, teste comentado nem `any`. O único mock é o diretório temporário, que é do sistema de arquivos e não esconde nada da regra. Não há IA envolvida.
- **Caminho do documento:** a ligação recebe o documento já relativo à raiz (`relative(raiz, resolve(...))` em `portao-local.ts:127`). `arquivosAlterados` usa `-uall`, então documento novo em pasta existente aparece arquivo por arquivo.

**Bloqueantes:** nenhum.

**Recomendações**
1. **Recuo sem teste** (`divergencias.ts:32` e `:27`): o `.map((linha) => linha.trim())` e o `trim()` do título podem sair sem nenhum caso falhar, porque nenhum dado de teste tem recuo nem espaço no fim. Sem o trim da linha, um `  <!-- ... -->` recuado passaria a contar como divergência. Falta um caso com linha recuada e um com o título seguido de espaço.
2. **Asterisco sem teste** (`divergencias.ts:17`): o `*` dentro de `[|\s*]` não é provado, porque nenhum caso escreve "**Nenhuma.**" em negrito. Tirar o `*` deixa tudo verde.
3. **"Ou" em vez de "e"** (`divergencias.ts:49`): o aviso some quando só a `techspec.md` mudou, mesmo com o `cenarios.md` parado, e vice-versa. O documento declara isso, e é coerente com as divergências reais da X7, em que várias citam um arquivo só. Fica registrado para a validação.
4. **Singular e plural sem bloco** (`divergencias.ts:50`): o ternário tem caso para "1 linha" e para "2 linhas", mas não tem bloco de mutação. É só texto.
5. **Pasta sem spec:** um documento numa pasta sem `techspec.md`, como `tasks/correcoes/`, geraria aviso apontando arquivos que não existem. Hoje nenhum documento de correção usa a seção, então não há caso real. Vale um caso, ou uma linha em "Fora desta correção".

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tasks/correcoes/2026-10-24-portao-avisa-divergencia.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tools/processo/divergencias.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tools/processo/divergencias.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tools/processo/portao-local.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 12:53:51 · `tasks/correcoes/2026-10-24-portao-avisa-divergencia.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: uma divergência ficou só no documento e o portão avisa.
- A linha que o HEAD já tinha não avisa de novo.
- Documento novo: toda linha da seção é nova.
- Não são divergência: o cabeçalho, o separador, o comentário, a linha em branco e o "nenhuma".
- O texto da seção seguinte não conta, e a seção que é a última do documento vai até o fim.
- Pedidos desta rodada: o recuo da linha, o espaço no fim do título e o negrito no "nenhuma".
- O aviso cala quando a `techspec.md` ou o `cenarios.md` da mesma pasta mudou, e não cala pela spec de outra pasta.
- O portão chama o aviso antes das suítes, e o aviso nunca sai do processo.
- Permissão, isolamento entre escolas e concorrência não se aplicam: é ferramenta local do processo, sem dado de escola e sem operação paralela.

**Cobertos:**
- **Recomendação (1), recuo e espaço no fim do título:** coberta pelo teste "o recuo da linha e o espaço depois do título não escondem a seção nem a divergência" (`divergencias.test.ts:49`). Conferi as duas mutações que citam esse teste:
  - Sem o `trim` da linha, o comentário recuado passa a contar como divergência. A regex de `semBarras` tira o recuo, e a linha não começa por "Divergência" nem por "nenhuma". O teste fica vermelho na asserção da linha 51, que é o motivo certo.
  - Sem o `trim` do título, o título com espaço no fim deixa de ser achado e a função devolve `[]` em vez de `[UMA.trim()]`. Vermelho na linha 56. O `replace('nesta tarefa\n', …)` só encontra o título, então a asserção chega à cláusula.
- **Recomendação (2), negrito no "nenhuma":** coberta pelo teste "o negrito do "nenhuma" não é divergência" (`divergencias.test.ts:59`). Se o asterisco deixa de ser tirado, `**Nenhuma.**` e `| **nenhuma** | | |` passam a contar e o teste fica vermelho. Motivo certo.
- **Recomendação (5), pasta sem `techspec.md`:** virou um item em "Fora desta correção" (linhas 23 e 24 do documento), uma das duas saídas que a ordem permitia.
- **A conferência é por arquivo, não por conteúdo:** agora está declarada no documento (linhas 21 e 22) e no comentário do topo de `divergencias.ts`. É só texto, sem cláusula nova.
- **Limpeza das pastas temporárias:** o `afterEach` com `rmSync` (`divergencias.test.ts:116-119`) apaga só as pastas que o próprio teste criou.
- **Rodada anterior:** os outros cenários seguem cobertos, e o `portao-local.ts` não mudou desde ela.
- **Teste rodado:** `npx vitest run tools/processo/divergencias.test.ts` passou nos 23 casos. Não há `.skip` nem mock.

**Bloqueantes:** nenhum.

**Recomendações:**
- `tools/processo/divergencias.test.ts:115`: o comentário "Um repositório com a spec e a tarefa já commitadas…" ficou em cima da `const criados`, e não da `function repositorio()` que ele descreve. Basta descer o comentário para a linha logo acima da função.
- `tasks/correcoes/2026-10-24-portao-avisa-divergencia.md:15`: "Nada: a árvore estava limpa." vem logo antes de uma lista do que fica fora de propósito, e as duas frases parecem se contradizer. Vale separar "pendências da árvore" de "fora de propósito".

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tools/processo/divergencias.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tools/processo/divergencias.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tasks/correcoes/2026-10-24-portao-avisa-divergencia.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 12:53:52 · `tasks/correcoes/2026-10-24-portao-avisa-divergencia.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. É uma correção de `tools/processo/` e não tem spec própria. Os limites do aviso estão no documento, em "Fora desta correção": a conferência olha só se o arquivo mudou, não o conteúdo, e não testa se os arquivos existem.

Portão local: carimbo válido. O `conferir` passou e cobre typecheck, lint, segredo, dependências, unidade e alvo.

Bloqueantes: nenhum.

As duas recomendações que a ordem mandou aplicar foram feitas:
- **(3)** `tools/processo/divergencias.test.ts:116-123`: a lista `criados` e o `afterEach` com `rmSync` apagam todos os repositórios que `repositorio()` cria.
- **(4)** `tools/processo/divergencias.ts:4-5`: o comentário do topo diz que a conferência é por arquivo, e não por conteúdo, e que o silêncio não prova nada. O documento repete isso em "Fora desta correção".

Os dois testes novos derrubam as três mutações novas:
- Sem o `trim` da linha, o comentário recuado vira divergência.
- Sem o `trim` do título, a seção com espaço no fim some.
- Sem o `*` em `/^[|\s*]+/`, o `**Nenhuma.**` vira divergência.

`portao-local.ts` não mudou desde a 1ª rodada.

Recomendações:
- `tools/processo/divergencias.test.ts:115`: o JSDoc "Um repositório com a spec e a tarefa já commitadas..." agora fica em cima de `const criados` e não de `function repositorio()`. Basta mover o comentário para a linha 120.
- Na tabela "Recomendações sem aplicar", o filtro `/^nenhuma\b/i` tem `TODO.md` como destino, mas o `TODO.md` não está entre os arquivos alterados. Esse item precisa ser escrito lá, junto com a marcação da M3 no commit à parte, senão se perde.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tools/processo/divergencias.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tools/processo/divergencias.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tools/processo/portao-local.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-portao-avisa-divergencia/tasks/correcoes/2026-10-24-portao-avisa-divergencia.md

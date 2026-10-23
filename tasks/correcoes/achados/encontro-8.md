# Achados das revisões — `tasks/correcoes/encontro-8.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 15:27:44 · `tasks/correcoes/encontro-8.md`

**VEREDITO: APROVADO**

**Escopo:** respeitado. A correção é só a resolução do conflito em `tasks/prd-harness/cenarios.md`. O resto do diff vem da tarefa 5.0, que já passou pela revisão na linha 2.

**Aderência à Tech Spec:** ok.

Comparei as três versões do arquivo: a base comum (`89ff3b1`), a da linha 3 (`HEAD`, tarefa 8.0) e a de `spec/harness` (`MERGE_HEAD`). A resolução junta as duas sem perder texto de nenhum lado:
- **Da tarefa 8.0:** só RF7 e RF8 mudaram em relação à base. Os dois ficaram exatamente como estão no `HEAD`.
- **De `spec/harness`:** RF3, RF6 e RF10 mudaram em relação à base. Os três ficaram exatamente como estão em `MERGE_HEAD`.
- **Fora da tabela:** nenhuma outra linha mudou.
- **Marcadores e índice:** não sobrou nenhum `<<<<<<<`, `=======` ou `>>>>>>>`, e não há entrada de conflito pendente no índice.
- **Ordem:** RF3, RF6, RF7, RF8 e RF10 continuam na ordem da tabela A.

**Portão local:** carimbo válido. O `conferir` respondeu "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".

**Bloqueantes:** nenhum.

**Recomendações:**
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tasks/correcoes/encontro-8.md:19`: a frase "As duas pontas mexeram nas mesmas três linhas" é imprecisa. A spec mexeu só no RF6 e a 8.0 só no RF7 e no RF8. O conflito veio de os blocos alterados serem vizinhos, e a linha 22 do mesmo documento já diz isso.
- No mesmo documento, a seção Sintoma pode dizer que RF3 e RF10 entraram sozinhos com a versão de `spec/harness`. Assim quem ler o histórico não toma a diferença nessas duas linhas, que aparece no `git diff HEAD`, como parte da resolução.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 15:28:37 · `tasks/correcoes/encontro-8.md`

VEREDITO: APROVADO

**Cenários exigidos:** a correção só resolve um conflito de texto. Não muda comportamento, então não há caminho feliz, permissão nem isolamento a provar. O que precisa valer é isto:
- não sobra nenhum marcador de conflito;
- a linha do RF6 vem da spec (tarefa 5.0);
- as linhas do RF7 e do RF8 vêm da 8.0;
- nada do que os dois lados mudaram se perde no resto do arquivo;
- o código da 5.0 que entrou continua passando nos testes, agora junto com a 8.0.

**Cobertos:**
- Nenhum marcador `<<<<<<<`, `=======` ou `>>>>>>>` em `cenarios.md`, `techspec.md`, `tasks.md`, `linhas.ts`, `linhas.test.ts`, `achados/indice.md` nem `TODO.md`.
- `git diff MERGE_HEAD -- tasks/prd-harness/cenarios.md` mostra só as linhas do RF7 e do RF8. O que essas duas linhas recebem é exatamente o que a linha 3 mudou desde a base comum (`git diff --stat MERGE_HEAD...HEAD`: 2 inserções e 2 remoções). Ficaram também as três mudanças da spec: o RF3 (abrir, abandonar e fechar sob a trava), o RF6 e o RF10 (quadro sem `base`). O texto de nenhum dos lados foi alterado.
- `linhas.ts`, `linhas.test.ts`, `5_task.md`, `achados/5_task.md` e `TODO.md` são iguais aos do `MERGE_HEAD`. `tasks.md` e `techspec.md` diferem dele só pelo que a 8.0 mudou, com o mesmo `--stat` dos dois lados.
- `npx vitest run tools/processo/linhas.test.ts` na árvore do merge passou: 50 de 50, sem `.skip`.
- A correção não acrescenta nenhuma cláusula de código, então não precisa declarar mutação.

**Bloqueantes:** nenhum.

**Recomendações:**
- A `spec/harness` andou depois de o merge começar. O `MERGE_HEAD` é o `6076f23`, e a ponta agora é o `67dad69`, que muda o RF13 em `cenarios.md`, `prd.md` e `2_task.md` (a exceção do caso "sem o compilador instalado", que passa a copiar o `caducidade.ts`). Por isso `git diff spec/harness` mostra hoje o RF13 curto na árvore. Isso não é perda deste merge, mas o próximo encontro precisa trazer essa mudança, e quem comparar com a ponta da spec não deve ler o RF13 curto como regressão.
- `tasks/correcoes/encontro-8.md`, na seção "Causa", fala do conflito só nas linhas do RF6, do RF7 e do RF8. Vale acrescentar uma frase dizendo que o RF3 e o RF10 da spec entraram sem conflito, para que quem ler o `git diff HEAD` não procure a origem dessas duas linhas.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tasks/prd-harness/cenarios.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tasks/correcoes/encontro-8.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/linhas.test.ts`

# Achados das revisões — `tasks/prd-harness/15_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 21:27:52 · `tasks/prd-harness/15_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

O que conferi:
- **Regra 80.** O texto da regra não mudou, só ganhou o cabeçalho `paths:`. Os caminhos cobrem tudo o que ela governa: `apps/**`; `packages/nucleo/**`, onde estão as migrations e o `drizzle.config.ts`; `infra/**`, onde estão os cenários de carga k6, os compose e o Grafana; `.github/**`; `tools/ci/**`; e `compose.yaml`.
- **O que continua sempre carregado.** A regra 6 segue no `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/CLAUDE.md:182-183`, com "limite por usuário e por escola (nunca só por IP)". O mapa ainda aponta `docs/infra.md` e `docs/runbook.md`.
- **Quem lê a 80 mesmo sem `paths:`.** O `infra-guardian` manda ler a regra 80 de forma explícita. As seis skills (`criar-prd`, `criar-techspec`, `revisar-spec`, `criar-tasks`, `validar`, `retro`) mandam ler as regras 00, 40, 60 e 80 por extenso. A tarefa registra que, num teste com `claude -p`, um subagente recebeu a regra 00 depois de ler arquivo de `apps/`. Não refiz esse teste.
- **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/estado.ts:434`.** É só leitura síncrona de um arquivo local no resumo da sessão. Não roda em request, não tem estado compartilhado nem corrida.
- **Testes.** Rodei `npx vitest run --project unidade tools/processo/harness/base-fixa.test.ts tools/processo/estado.test.ts`: 72 testes passaram, e nenhum chama provedor pago.

Recomendações:
- Os arquivos `.processo/compose-de-teste-*.yml` ficam fora dos `paths:` da regra 80. Hoje é aceitável, porque são arquivos do processo e não do produto. Se algum deles virar ambiente de carga, vale incluí-lo.
- `packages/shared/**` também fica fora dos `paths:` da regra 80, e isso está certo enquanto o pacote guardar só contratos. Se algum dia entrar ali código que roda em runtime no caminho quente, a lista precisa ser revista.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-23 21:28:52 · `tasks/prd-harness/15_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum alterado. A tarefa não toca `apps/` nem `packages/`. Todos com autor humano? sim, nada mudou.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. A regra 70 itens 3 e 6 não mudou e continua sempre carregada.
Supervisão do tutor: ok. A regra 70 itens 4 e 7 não mudou. O D8 ficou curto no índice, mas o texto inteiro continua na regra 70 e em `docs/decisoes.md`.
Autonomia declarada e visível: sim. A regra 70 item 5 não mudou.

O que conferi no diff da tarefa 15.0:
- **Regras 10, 20 e 70.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/rules/70-conformidade-cne.md`, a 10 e a 20 não mudaram e continuam sem `paths:`. O "antes" gravado em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/__fixtures__/base-fixa-antes.json` traz todos os itens numerados da 70, de 1 a 9 (com 2a, 4a a 4d e 6a). `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/base-fixa.test.ts` fica vermelho se a 70 deixar de ser sempre carregada ou perder um item. Isso também vale para item trocado por outro com a mesma contagem.
- **A seção "seis regras" do `CLAUDE.md`.** Continua ali, inclusive a regra 3 (`CLAUDE.md:176-177`), com a D55 "não chega nem a propor".
- **Conflitos já resolvidos.** Foram para o topo de `docs/decisoes.md` sem mudar uma palavra, e os quatro que importam à regra 70 estão lá: discursiva e redação, tutor e aprovação prévia, medir o professor pela turma, vigiar a navegação.
- **Decisões em aberto.** Comparei a tabela do `CLAUDE.md` no HEAD com `docs/decisoes-em-aberto.md`: são iguais linha a linha. Isso inclui o texto final do CNE, a saída da aba fora de avaliação e o ranking de participação.
- **Regra 60 com `paths:`.** Ela sai da base fixa, mas o que diz sobre a regra 70 (itens 2, 9 e 11) está repetido na própria 70, nos itens 1, 3 e 8, que continua sempre carregada.
- **Revisores.** A tarefa anota como provado que um subagente que lê arquivo de `apps/` recebe a regra 00. O `conformidade-reviewer` continua recebendo a 70 sempre, e a 40 e a 60 quando lê o código ou o teste auditado.
- **Documentos da lei.** `docs/regulacao.md`, `docs/conformidade-mec.md` e `.claude/agents/` não mudaram.
- Rodei `npx vitest run --project unidade` nos dois testes da tarefa: 72 passaram.

Bloqueantes: nenhum

Recomendações:
1. **D55 no índice do `CLAUDE.md`.** A linha "Discursiva e redação: a IA não corrige, não avalia e não pré-corrige" perdeu "não dá nota nem conceito, e não sugere nota ao professor". É o conflito que mais volta. A regra 70 item 2a e a seção das seis regras cobrem a lacuna, mas a linha poderia trazer "não dá nota nem sugere nota" sem custo relevante de bytes.
2. **D45 e D70 no índice.** O D45 ficou "medido em espelho, sem ranking" e o D70 perdeu "sem consequência automática nem histórico". A regra 70 itens 7 e 8 cobre os dois. Fica registrado só para o `/retro` decidir se o índice traz a palavra-chave da proteção.
3. **Nota de ratificação.** Ela foi para `docs/decisoes.md` mas ainda termina com "em `docs/decisoes.md`", apontando para o próprio arquivo. Basta trocar por "em cada uma, abaixo".
4. **AIA com ponteiro antigo.** Três AIA ainda dizem "decisão em aberto no `CLAUDE.md`": `docs/aia/correcao-de-objetiva.md:261`, `docs/aia/diagnostico-por-habilidade.md:220` e `docs/aia/sinais-e-alertas.md:296`. A tarefa decidiu manter isso como histórico, e o `CLAUDE.md` aponta o arquivo novo. Mas a AIA vai no dossiê de conformidade (D61). Na próxima vez que alguém mexer nelas, vale apontar direto para `docs/decisoes-em-aberto.md`.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 21:29:05 · `tasks/prd-harness/15_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** a tarefa mexe só em ferramenta de processo. Não toca dado de escola, permissão, IA nem nada que rode duas vezes ao mesmo tempo, então os cenários de isolamento, permissão, IA e concorrência não se aplicam. Os exigidos vêm da tabela de testes da tarefa e da linha RF20 do `cenarios.md` C:
1. Base fixa acima de 40.000 B fica vermelha.
2. Regra sempre carregada diferente de {10, 20, 70} fica vermelha.
3. Menos itens numerados que no "antes" fica vermelho, um caso para cada regra (10, 20, 70).
4. O repositório de hoje fica verde, com a medida de antes gravada e uma contagem mínima afirmada.
5. O `estado.ts` conta as decisões em aberto do arquivo novo.
6. `CLAUDE.md` ausente na amostra fica vermelho.

**Cobertos** (testes em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/base-fixa.test.ts`, salvo o 5):
1. `base fixa acima de 40.000 B: vermelha, e no limite exato ainda passa`. Testa os dois lados do limite: exatamente 40.000 B passa, 40.001 B reprova.
2. Coberto nos dois sentidos:
   - `regra com caminho que perde o paths: volta ao contexto: %s`, um caso para cada regra 00, 40, 60 e 80.
   - `regra de segurança que ganha paths: sai do contexto: %s`, um caso para cada regra 10, 20 e 70.
   - Também cobrem o tema: `paths: com lista vazia…`, `paths: escrito no corpo da regra…` e `pasta das regras ausente na amostra`.
3. `item numerado cortado: %s`, um caso para cada regra 10, 20 e 70. Mais `item trocado por outro com a mesma contagem`, que reprova pelo número e não pela contagem, e `item a mais numa das três: verde`.
4. Dois testes:
   - `o repositório de hoje passa, com a medida de antes gravada e as contagens mínimas`, que afirma ao menos 9 regras, os itens de cada uma e o `paths:` nas quatro.
   - `a medida de antes é a de 23/10/2026…`. Conferi a fixture com o HEAD: `CLAUDE.md` tem 36.351 B. As contagens de itens também batem: 9 na 10, 20 na 20 e 15 na 70.
5. `estado.test.ts › o resumo da sessão aponta a funcionalidade da vez e conta as decisões em aberto do arquivo delas, não as do CLAUDE.md`. O `CLAUDE.md` da amostra tem uma seção antiga com 5 linhas e o arquivo novo tem 2. Por isso a mutação que volta a ler o `CLAUDE.md` fica vermelha pelo motivo certo.
6. `CLAUDE.md ausente na amostra: vermelho`.

Itens além da tabela:
- O 15.5 (as seis skills mandam ler as quatro regras) tem três testes: as seis de hoje, um caso de skill sem a 60 para cada uma, e skill ausente.
- O 15.4 (frase do RF17 na regra 40) tem teste.

Seção "Mutações" contra o `git diff`:
- O código novo do `estado.ts` está todo coberto: a constante, a leitura do arquivo e o rótulo.
- Cada cláusula da conferência em `base-fixa.test.ts` tem o seu bloco.
- Li cada bloco contra o teste citado e todos chegam à cláusula. O bloco "pasta com nome de regra" fica vermelho porque a conferência quebra, e essa é justamente a cláusula que ele protege.
- As exclusões declaradas (`?? fallback`, `.sort()`, `join` das constantes, o helper `regra()`) são de fato sem comportamento.

Demais conferências:
- Rodei `npx vitest run --project unidade` nos dois arquivos: 72 de 72 verdes.
- Não há `.skip`, teste comentado nem mock. As amostras quebradas são cópias em `mkdtempSync`, e o `estragar` exige que o arquivo mude, então nenhuma amostra passa sem ter sido estragada de verdade.
- As regras 10, 20 e 70 não mudaram no diff.
- A tabela de `docs/decisoes-em-aberto.md` tem 19 linhas, as mesmas 19 que estavam no `CLAUDE.md`.
- Os conflitos que conferi por amostragem estão em `docs/decisoes.md`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `base-fixa.test.ts:72` e `:96-104`, a guarda dos itens das regras 10, 20 e 70 olha só o número. Se alguém esvaziar o texto do item e deixar o `3. ` no lugar, ela passa. É o que o RF20 pede ("itens numerados"), mas vale uma margem de bytes por regra contra a fixture (`regrasSemPaths` já guarda esse valor), para pegar um corte grande de conteúdo.
2. Nada prova que o `docs/decisoes-em-aberto.md` real existe e é lido. Se o arquivo for renomeado sem mudar a constante, o resumo simplesmente perde a linha, sem nada vermelho. Um caso em `estado.test.ts` que rode o `resumo` na raiz do repositório e exija a linha com N > 0 fecharia isso.
3. Em `estado.test.ts:502-513`, o caso "sem o arquivo… não inventa a linha" também não tem `CLAUDE.md` na amostra, então não separa os dois arquivos. O caso principal já faz essa separação, então é só redundante.
4. Em `base-fixa.test.ts:273-280`, o teste do RF17 na regra 40 só procura três literais. Serve como presença do texto, mas não prova a frase inteira. Pode ficar.
5. O bloco de mutação "o repositório de hoje passa" (`15_task.md:154`) cita o nome do teste abreviado e depende do casamento por trecho do nome. Citar o nome completo evita que um teste novo com o mesmo começo caia nesse casamento por acaso.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-23 21:30:08 · `tasks/prd-harness/15_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: duas divergências. O `CLAUDE.md` com 227 linhas, contra as "~150" do RF20, está registrado só no `15_task.md`. E o `time.md`, que o `texto.md` diz ser "lido no passo 3", não é citado pelo passo 3.
Portão local: carimbo válido

Bloqueantes:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/15_task.md:82`: o `prd.md` RF20 pede `CLAUDE.md` "até ~150 linhas". O arquivo ficou com 227. A linha de divergência aponta `prd.md` RF20 e `cenarios.md` C como "onde está na spec", mas nenhum dos dois foi alterado, e a `techspec.md` §9 e §11 também não diz nada. Divergência que existe só no `N_task.md` é bloqueante. Na validação, o validador vai medir o RF20 pelo PRD e encontrar 50% acima.
   - **Correção exigida:** registrar na `techspec.md` (§9, ou §11 "Conformidade com as regras") que o critério do RF20 é a base fixa em bytes (até 40.000 B), e não a contagem de linhas. Dizer o motivo: só a lista de D1 a D81 já ocupa 83 linhas. Registrar também a medida de depois: 12.920 B no `CLAUDE.md` e 34.326 B de base fixa. Depois ajustar a coluna da divergência para apontar esse lugar.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/seguir/time.md:3`: a linha diz "Lido pelo Orquestrador ao montar o time (passo 3 do `/seguir`)". O `texto.md` ("Para onde vai o `CLAUDE.md`") fixa o mesmo destino: "`.claude/skills/seguir/time.md`, lido no passo 3". Mas `.claude/skills/seguir/SKILL.md` §3 ("O time fixo e o andar", linha 73 em diante) não cita o `time.md` em lugar nenhum. A 17.0 só move o passo 3 para `passos/` e não promete acrescentar a citação. Resultado: o destino do texto que saiu da base fixa não está ligado, e o arquivo afirma uma leitura que não acontece.
   - **Correção exigida:** escolher um dos dois caminhos.
     - (a) Acrescentar ao §3 do `seguir/SKILL.md` a linha que manda ler o `time.md` e listar o arquivo como divergência de "Arquivos previstos".
     - (b) Registrar na `techspec.md` e no `texto.md` que a citação entra na 17.0, pôr isso na subtarefa 17.1, e tirar do `time.md` a afirmação "passo 3" até lá.

Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/criar-tasks/SKILL.md:22`, o "por extenso" aparece duas vezes na mesma frase ("Leia por extenso as regras … por extenso").
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/agents/implementador.md:68`, o texto ainda diz que "o `CLAUDE.md` e as regras de `.claude/rules/` já estão no seu contexto". Agora a 00, a 40, a 60 e a 80 só entram ao ler arquivo do caminho delas.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/docs/skills-de-terceiros.md:11`, a frase "O teste do harness acusa a linha que sumiu" está no presente, mas esse teste só nasce na 19.0. Vale dizer "a partir da 19.0".
- A nota de ratificação em `docs/decisoes.md` (cerca da linha 124) termina com "em `docs/decisoes.md`" dentro do próprio `docs/decisoes.md`. Ponto já apontado pelo `conformidade-reviewer`.
- A linha da D1 no índice ("Sistema inteiro como alvo, não MVP fatiado") repete o título original sem a revisão que trouxe o MVP de apresentação (D71) e o piloto. Pode ler como contradição para quem não abre o `docs/decisoes.md`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 21:41:37 · `tasks/prd-harness/15_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum

As duas correções da 1ª rodada foram feitas:

1. **Critério do RF20.** Está registrado em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/techspec.md:288-291` (§11). O registro diz que o critério é em bytes (até 40.000 B) e não em linhas, explica que só a lista de D1 a D81 ocupa 83 linhas, e traz a medida de antes e de depois. A coluna da divergência em `15_task.md:82` agora aponta esse lugar.
2. **`time.md`.** Foi escolhido o caminho (a). `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/seguir/SKILL.md:88-89`, na seção 3, manda ler o `time.md` ao montar o time. Com isso, a frase "passo 3" em `time.md:3` passa a ser verdade. O arquivo entrou na divergência de "Arquivos previstos" (`15_task.md:83`) com o motivo, que vem do `texto.md:22` ("lido no passo 3").

O resto do diff está correto: o "por extenso" duplicado saiu do `criar-tasks`, as linhas da D1 e da D55 batem com `docs/decisoes.md`, e o caso novo em `estado.test.ts` lê o arquivo real das decisões em aberto. A nota de ratificação, o "a partir da 19.0" e o nome completo do teste no bloco de mutação de `15_task.md:154` também estão certos.

Recomendações:
- Os números de depois ficaram velhos dentro da própria rodada. A troca das linhas da D1 e da D55 aumentou o `CLAUDE.md`: medido agora, são 12.980 B no `CLAUDE.md` e 34.386 B de base fixa. O texto registrado diz 12.920 B e 34.326 B, em `techspec.md:290` e `15_task.md:82`. Não muda o critério nem o veredito, porque continua bem abaixo de 40.000 B. Vale corrigir os dois números antes do commit para o registro ficar exato.

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 21:41:53 · `tasks/prd-harness/15_task.md`

VEREDITO: APROVADO

Cenários exigidos: nesta rodada, só o que o diff mexe e o que ele afeta. O resto foi aprovado na 1ª rodada e não mudou: o caso novo de `estado.test.ts` para o resumo na raiz real (recomendação 2), o nome completo no bloco de mutação "o repositório de hoje passa" (recomendação 5), e as mudanças de texto do `CLAUDE.md`, do `docs/decisoes.md`, do `docs/skills-de-terceiros.md`, das skills `criar-tasks` e `seguir` e do §11 do `techspec.md`, para ver se alguma pede teste.

Cobertos:
- **Resumo na raiz real** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/estado.test.ts:344`): o teste ficaria vermelho se a regra fosse removida. Ele chama o `resumo` de verdade sobre a raiz do repositório, sem mock. O `resumo` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/estado.ts:434-436`) só escreve a linha quando acha linhas de tabela. Então o caso falha em três situações: o `docs/decisoes-em-aberto.md` sumir, a constante `ARQUIVO_DAS_DECISOES_EM_ABERTO` apontar para outro arquivo, ou a tabela ficar vazia. A asserção confere o rótulo e a contagem acima de zero, não só que o código rodou. É o que faltava ao caso com a amostra pronta.
- **Bloco de mutação**: o nome citado no `15_task.md` agora bate exatamente com o `it` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/base-fixa.test.ts:150`.
- **Mudanças de texto**: nenhuma traz cláusula de código nova nem linha nova na tabela de testes, então nenhuma pede teste novo. A frase do `docs/skills-de-terceiros.md` agora diz que o teste da linha de conflito só existe a partir da 19.0, e isso tira a promessa de um teste que ainda não existe. O §11 do `techspec.md` registra que o critério do RF20 é de bytes, que é o que o `base-fixa.test.ts` prova.
- **Testes**: `npx vitest run tools/processo/estado.test.ts tools/processo/harness/base-fixa.test.ts` passou, 73 de 73.
- **Itens 4 a 6 da auditoria**: não há `.skip`, teste comentado nem mock no diff. Nada de IA nem operação concorrente foi tocado.

Bloqueantes: nenhum.

Recomendações:
- O caso novo lê o repositório de verdade, e por isso fica vermelho no dia em que a última decisão em aberto fechar e a tabela ficar vazia. Isso é intencional e o motivo já está no nome do teste. Quem esvaziar a tabela precisa ajustar o caso junto, e vale uma linha no `/retro` para que isso não pareça regressão.
- As recomendações da 1ª rodada que não entraram estão na tabela "Recomendações sem aplicar" do `15_task.md`, cada uma com destino. Concordo com os destinos e não tenho nada a acrescentar.

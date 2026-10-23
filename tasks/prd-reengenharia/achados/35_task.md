# Achados das revisões — `tasks/prd-reengenharia/35_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 21:30:54 · `tasks/prd-reengenharia/35_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration nesta tarefa. `rede` e `escola` continuam sendo criadas só por `RedeEEscolaRepository`, e o arquivo foi movido sem nenhuma linha alterada.

Queries verificadas:
- `apps/api/src/operacao/casos-de-uso/escola.repository.ts:25` e `:34`: `criarRede` e `criarEscola` mantêm o `@SemEscopo` com a justificativa escrita ("só o comando ou o painel do operador cria, e devolve só o id"). Os dois se justificam, porque a rede fica acima do tenant e a escola é o próprio tenant nascendo.
- `apps/api/src/operacao/casos-de-uso/escola.ts`: `criarRede` e `criarEscola` são cópia exata do que estava em `ops/escola.ts`. O autor é conferido como primeira instrução da transação, a auditoria de `escola.criada` é gravada no contexto da escola, e rede inexistente devolve `NAO_ENCONTRADO` sem o valor recebido.
- `apps/api/src/http/paginacao.ts`: arquivo renomeado sem alteração. É só o corte da página, sem query e sem escopo.
- Os 13 services só trocaram o caminho do import de `paginar`. Nenhum repository mudou.
- Nenhum endpoint passou a aceitar `escolaId` do corpo ou da query. Nenhum id deixou de ser UUID. A camada de rede não foi tocada.

Teste de isolamento: presente e efetivo. Não há módulo novo de domínio. A trava que importa aqui continua apertada e passou nesta rodada (10 de 10 em unidade):
- `apps/api/src/operacao/casos-de-uso/escola.repository.test.ts` prende quem cria rede ou escola: só o repository faz o insert, só o caso de uso importa o repository, e só a lista fechada importa o caso de uso. Essa lista é o painel, o terminal `ops/escola.ts` e as bancadas.
- O C44 em `apps/api/test/arquitetura.test.ts` passou a ter `COMANDOS_QUE_A_API_IMPORTA = {}`, ou seja, nenhum módulo da API importa comando de `ops/`.

As mutações declaradas pegam a reversão:
- devolver o import `../ops/escola.js` ao painel quebra o C44;
- importar o repository em `painel.repository.ts` quebra a segunda asserção do teste do repository;
- importar o caso de uso em `eu.service.ts` quebra a lista de importadores.

Bloqueantes: nenhum.

Recomendações:
- `apps/api/src/operacao/casos-de-uso/escola.ts:16-21`: o comentário que descreve o módulo está colado em `const registro`, então o editor o mostra como documentação dessa constante. Vale subir o comentário para o topo do arquivo ou separá-lo da constante.
- `apps/api/src/estrutura/{ano-letivo,disciplina,lista,serie,turma,vinculo}.service.ts`: o import `../http/paginacao.js` ficou no meio dos imports locais, porque o script trocou a linha onde ela estava. A ordem dos imports ficou inconsistente com os outros services. É cosmético.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 21:31:19 · `tasks/prd-reengenharia/35_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

O que conferi:
- **Escopo.** A tarefa fez o que pediu: o RF14 de `onda-2.md` §2 está atendido e os outros comandos de `ops/` ficaram onde estavam. A subpasta `operacao/escola/` (96.0) não foi antecipada.
- **Divergências.** As quatro declaradas apontam para onde estão na spec (`tasks.md` "Tarefa mecânica", `onda-2.md` §2, `33_task.md`).
- **`ops/escola.ts`.** Importa `criarRede` e `criarEscola` de `operacao/casos-de-uso/escola.ts` sem reexportá-los, e o `dist/ops/escola.js` do `package.json` continua existindo.
- **Caminhos antigos.** Nenhum código ainda importa por `ops/escola.repository`, `estrutura/entrada` ou `criarRede`/`criarEscola` vindos de `ops/escola.js`. O que sobra fica só em `.reengenharia/` (diagnóstico histórico) e nos exemplos `fora` do C44.
- **`TODO.md`.** Estava listado como alterado, mas não cita esses caminhos, então ficar sem mudança está correto.
- **Testes de arquitetura.** `COMANDOS_QUE_A_API_IMPORTA` virou `{}`, e o C44 ganhou o caso `fora` com o import exato do painel. A lista de quem pode importar o caso de uso tem as sete entradas certas.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/operacao/casos-de-uso/escola.ts:16-21`: o comentário que descreve o módulo ("Criação de rede e de escola pelo operador Turmma…") está colado em `const registro = new RegistroDeAuditoria()` e vira a documentação dessa constante. Separar com uma linha em branco ou movê-lo para o topo do arquivo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts:1510` e `:1527`: a constante `ARQUIVO_DA_ENTRADA` e o nome do caso ("…e o entrada.ts só guarda a paginação") ainda falam de `entrada.ts`, que agora é `http/paginacao.ts`. Renomear quando a tarefa voltar a mexer nesse bloco.
- Nas mutações da tarefa, os nomes de caso são trechos do nome real ("uma linha além do limite é cortada", "proxima é a chave usuarioId da última devolvida"). O `-t` do vitest aceita trecho, mas o nome inteiro deixa o rastreio mais direto.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 21:31:58 · `tasks/prd-reengenharia/35_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (é uma tarefa de mover código, com comportamento igual. Não há borda escolar nova, isolamento novo nem concorrência nova; o que a tarefa precisa provar é que a fronteira dos módulos e a paginação continuam iguais):
1. Nenhum arquivo de `operacao/` importa de `ops/`. A lista `COMANDOS_QUE_A_API_IMPORTA` fica vazia, e a importação de volta pelo painel é reprovada.
2. Só o painel, `ops/escola.ts` e as bancadas importam o caso de uso, e só o caso de uso importa `escola.repository`.
3. `paginar` e `paginarPor`, contra `http/paginacao.ts`: até `limite` não há `proxima`; com `limite + 1` há `proxima` e ela é o id da última linha devolvida; a lista vazia volta vazia; `paginarPor` usa a chave `usuarioId`.
4. `ops/escola.ts` continua sendo o terminal, chama o caso de uso de verdade, e `npm run ops:escola` continua achando `dist/ops/escola.js`.
5. Permissão: nenhuma rota fora do painel da operação cria rede ou escola.

**Cobertos:**
- **1:** `arquitetura.test.ts`, os dois casos do C44: "só o comando cria operador e convite de operador, e nenhum módulo da API importa os comandos" (que varre o repositório real) e "a varredura reprova…", que agora tem `painel.service.ts` com `../ops/escola.js` na lista dos que devem ser reprovados, e o import novo na lista dos que passam. A mutação 1 fica vermelha pelo motivo certo: a lista `permitidos` está vazia.
- **2:** `escola.repository.test.ts`, os casos "nenhum código fora do repository do operador cria rede ou escola, e só o caso de uso o importa" e "fora de teste, só o painel da operação, o comando ops:escola e as bancadas importam o caso de uso…" (mutações 2 e 3). O `RAIZ` ganhou o `../` e as constantes apontam para o arquivo novo.
- **3:** `http/paginacao.test.ts`. Os quatro casos da 35.1 estão lá, mais o limite zero. Cada uma das mutações 4 a 7 tem o seu caso:
  - `limite + 1` no corte, pegada por "uma linha além do limite é cortada";
  - `>=` no lugar de `>`, pegada por "até o limite… sem proxima";
  - sem a guarda de `ultima`, pegada por "limite zero";
  - `id` no lugar da chave, pegada por "proxima é a chave usuarioId".
  
  Na mutação do limite zero, o vermelho vem do `TypeError` de `chave(undefined)`. É o que acontece de fato quando a guarda sai, então o motivo é o certo.
- **4:** a mutação 8 (`ops-escola.int.test.ts › caminho feliz…`) prova que o terminal chama `criarRede` de verdade. O "mover `ops/escola.ts` inteiro" quem pega é `escola.repository.test.ts`, que lista `apps/api/src/ops/escola.ts` entre os importadores obrigatórios.
- **5:** `ops-escola.int.test.ts › permissão: nenhuma rota da API cria rede nem escola…`, que não mudou.
- O caso de uso movido é idêntico ao que existia: `criarRede`, `criarEscola`, a auditoria na mesma transação, o 23503 virando `NAO_ENCONTRADO`. O repository e o `paginacao.ts` são renomeação pura (similaridade de 100%). `ops/escola.ts` importa os dois e não os reexporta.
- Não achei citação velha de `ops/escola` nem de `estrutura/entrada` em `TODO.md`, `docs/` nem `.claude/`.
- Rodei `npx vitest run --project unidade apps/api/src/ops apps/api/src/operacao apps/api/src/http apps/api/test/arquitetura.test.ts`: 13 arquivos e 198 testes passaram. Não rodei os testes de integração: eles precisam do banco do compose, e o portão da tarefa já os rodou.
- Não há `.skip`, mock nem chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `tasks/prd-reengenharia/35_task.md:56`, a linha "`npm run ops:escola` roda do `dist` (a integração do comando)" não cita teste pelo nome. E o teste de integração de `ops-escola.int.test.ts` não roda o `dist`: chama `executarOpsEscola` direto de `src`. Hoje, quem fica vermelho com "mover `ops/escola.ts` inteiro" é `escola.repository.test.ts › fora de teste, só o painel da operação, o comando ops:escola e as bancadas…`. Sugiro citar esse teste na linha. Também vale considerar uma checagem do `package.json` como a que já existe em `infra/test/alertas.test.ts:198`, que confira que `scripts['ops:escola']` termina em `apps/api/dist/ops/escola.js`.
2. Em `apps/api/test/arquitetura.test.ts:1527`, o nome do caso ainda diz "e o entrada.ts só guarda a paginação". A constante já aponta para `http/paginacao.ts`, mas o nome fica como "o paginacao.ts só guarda a paginação".
3. A tabela de "Arquivos previstos" (`35_task.md:43`) diz que `TODO.md` muda, e ele não tem citação desses caminhos, então ficou sem alteração. Vale tirar a linha ou anotar "sem citação".
4. Nada prende "`ops/escola.ts` não reexporta `criarRede` nem `criarEscola`". O C44 só olha a API fora de `testes`, então uma bancada de teste poderia voltar a importá-los de `ops/escola.js` sem ninguém ver. É cobertura extra e opcional: um caso que afirme que o texto de `ops/escola.ts` não tem `export … criarRede` nem `export … criarEscola`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/35_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/http/paginacao.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/operacao/casos-de-uso/escola.repository.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/operacao/casos-de-uso/escola.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/ops/escola.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 21:36:45 · `tasks/prd-reengenharia/35_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada (aprovada). Nesta rodada eu conferi só o diff desde aquela rodada e o que ele afeta:
- o renome `ARQUIVO_DA_ENTRADA` → `ARQUIVO_DA_PAGINACAO` e o título novo do caso em `arquitetura.test.ts`;
- a linha nova da tabela "Testes que provam a regra" do `35_task.md`: mover `ops/escola.ts` inteiro deixa vermelho o caso `escola.repository.test.ts › fora de teste, só o painel da operação, o comando ops:escola e as bancadas importam o caso de uso…`;
- a linha do `TODO.md` em "Arquivos previstos";
- uma linha em branco a mais em `operacao/casos-de-uso/escola.ts`.

Cobertos:
- **Renome em `arquitetura.test.ts`.** Mudou só o nome. A constante continua apontando para `apps/api/src/http/paginacao.ts`, e as asserções seguem as mesmas: `toContain('export function paginar')` e nenhuma das três funções antigas fora de comentário.
- **Linha nova da tabela.** O caso citado existe com esse nome, na linha 71 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/operacao/casos-de-uso/escola.repository.test.ts`. Ele compara com `toEqual` a lista ordenada de quem importa o caso de uso com `IMPORTADORES_PERMITIDOS_DO_CASO_DE_USO` (linha 35), que inclui `apps/api/src/ops/escola.ts`. Se o arquivo for movido inteiro, o importador passa a ter outro caminho, a lista não bate mais e o teste fica vermelho. A mutação declarada é real.
- **Correção de texto na tabela.** O documento agora diz que o `ops-escola.int.test.ts` chama `executarOpsEscola` de `src` e não roda o `dist`. Isso corrige uma afirmação que a 1ª rodada aceitava sem prova.
- **Linha do `TODO.md`.** Mudou só texto do documento, nenhum teste é afetado.
- **Linha em branco em `escola.ts`.** Não muda comportamento.
- **Rodada local.** `npx vitest run` de `arquitetura.test.ts`, `escola.repository.test.ts` e `paginacao.test.ts`: 3 arquivos e 80 testes passando.
- **Recomendações sem aplicar.** As quatro foram recusadas com motivo. Todas eram recomendações na 1ª rodada, não bloqueantes, então a recusa é aceitável.

Bloqueantes: nenhum.

Recomendações:
- A variável local `entrada`, no caso de `arquitetura.test.ts` (perto da linha 1530), ainda tem o nome antigo, embora a constante agora seja `ARQUIVO_DA_PAGINACAO`. Só cosmético.
- A linha em branco entre o comentário de bloco e o `const registro` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/operacao/casos-de-uso/escola.ts` é ruído no diff e pode sair.
- Fica de pé a recomendação recusada na 1ª rodada: conferir que `package.json` (`ops:escola`) aponta para `apps/api/dist/ops/escola.js`. É o único teste que prenderia o caminho que o comando executa. Hoje o caso citado prende só o caminho de quem importa, no código-fonte.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 21:36:46 · `tasks/prd-reengenharia/35_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. O `conferir` diz: "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".
Bloqueantes: nenhum
Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts:1530`, a variável local ainda se chama `entrada`, embora a constante e o nome do caso já tenham passado a `paginacao`. É só nome e não bloqueia.

Conferi as quatro recomendações da ordem `.processo/ordens/35_task-r1.md`. Todas foram aplicadas:
1. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/operacao/casos-de-uso/escola.ts:21`, uma linha em branco agora separa o comentário do módulo de `const registro`.
2. Em `arquitetura.test.ts:1510` e `:1527`, a constante e o nome do caso agora falam de `paginacao`. Nenhum documento de tarefa nem mutação citava o nome antigo: busquei no repositório, fora de `achados/`, e não sobrou nada.
3. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/35_task.md:56`, a linha cita um teste que existe com esse nome, em `escola.repository.test.ts:71`. A mutação da linha 108 aponta o mesmo teste.
4. A linha do `TODO.md` em "Arquivos previstos" agora diz "sem alteração".

As recomendações não aplicadas estão na seção "Recomendações sem aplicar", cada uma com o motivo da recusa. Os motivos servem e nenhum deles é "anularia as aprovações".

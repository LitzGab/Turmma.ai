# Achados das revisões — `tasks/prd-reengenharia/96_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 21:53:46 · `tasks/prd-reengenharia/96_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma nova. A tarefa não tem migration nem schema.

Queries verificadas: nenhuma nova nem alterada. Comparei o diff de `apps/api/src/{estrutura,sala,atividade,operacao}/**` sem as linhas de import: todos os repositories e services foram movidos sem mudar o conteúdo, e as cláusulas de escopo continuam iguais. Os três `@SemEscopo` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/operacao/painel/painel.repository.ts` e os dois de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/operacao/escola/escola.repository.ts` mudaram de pasta com a justificativa escrita. Nenhum controller passou a aceitar `escolaId` vindo do cliente.

Teste de isolamento: presente e efetivo. A tarefa não cria módulo novo. `atividade-isolamento.int.test.ts`, `operacao-isolamento.int.test.ts` e os demais `*.int.test.ts` só tiveram o caminho de import trocado. As travas de tenant que descobrem arquivos por caminho continuam enxergando tudo depois da mudança de pasta:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/escopo-dos-repositories.ts` percorre `src` de forma recursiva (`:441`). Se `REPOSITORIES_SEM_ESCOPO` citar um caminho que não existe mais, ela reprova (`lista-arquivo-inexistente`). A entrada de `operacao/operador/operador.repository.ts` foi atualizada.
- O C40 de `arquitetura.test.ts` usa o prefixo `PASTA_DA_OPERACAO`, que cobre as subpastas novas.
- A varredura de `correcao/correcao.int.test.ts` passou a ser recursiva sobre `atividade/`, com mutação declarada.
- Rodei `repositories-com-escopo.test.ts`, `tamanho-das-pastas.test.ts` e `guardas.test.ts`: 176 testes passaram.

Bloqueantes: nenhum.

Recomendações:
- Os documentos de diagnóstico em `.reengenharia/` (`diagnostico/U04.md`, `U05.md`, `U08a.md`, `LINHA-DE-BASE.md`, `MAPA.md`, `SUSPEITOS-MORTOS.md`) ainda citam os caminhos antigos, por exemplo `estrutura/escola-sessao.repository.ts` e `operacao/operador.repository.ts`. São registros históricos, então não precisam mudar. Se algum for usado como referência viva no `/validar`, vale anotar que os caminhos são anteriores à 96.0.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-22 21:54:57 · `tasks/prd-reengenharia/96_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A divergência do commit único está escrita em `tasks.md`, na seção "Tarefa mecânica". A falta da exceção provisória decorre dela, e as outras três linhas da tabela só repetem o que a própria 96.1 e a 96.5 já pedem.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes:

- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/tamanho-das-pastas.test.ts:14`, `:110` e `:120`. `RAIZES_DA_TRAVA` virou código morto, e o comentário dele está errado. A constante diz "As raízes que a trava percorre", mas agora nenhuma trava a percorre. As duas verificações do repositório real leem listas escritas à mão: `arquivosDasRaizes(['apps/web/src'])` e `arquivosDasRaizes(['apps/api/src'])`. Até a 97.0, a verificação da web lia `RAIZES_DA_TRAVA`, e esta tarefa cortou essa ligação. O único uso que sobrou é a linha `:105`, que compara a constante com ela mesma.
  - Efeito 1: tirar `'apps/api/src'` da lista não muda em nada o que é conferido. A primeira mutação declarada só fica vermelha por causa dessa comparação, então não prova a trava. O cenário da tarefa ("vermelho se tirar a raiz `apps/api/src` da lista") passa a ser decorativo.
  - Efeito 2: quem acrescentar uma terceira raiz à lista vai achar que a trava cobre essa raiz, e ela não cobre.
  - Correção exigida: a verificação do repositório real lê `RAIZES_DA_TRAVA`. Pode ser `arquivosDasRaizes(RAIZES_DA_TRAVA)` com os `toContain` das duas raízes, ou um `it.each` sobre a lista com os pontos de conferência de cada raiz. Assim, tirar a raiz desliga de fato a conferência, e a mutação fica vermelha porque o `toContain` de `apps/api/src/...` falha. Se a lista não servir para isso, a alternativa é apagar a constante e a comparação dela, e reescrever a mutação sobre a verificação real.

Recomendações:
- O diretório `apps/api/src/operacao/casos-de-uso/` ficou vazio no disco. O git não guarda pasta vazia, então é inofensivo, mas convém apagar a pasta.
- Na divergência 2 da tabela, a "divergência" é exatamente o que a 96.1 pede. Basta escrever "nenhuma" para esse item, para não sugerir que houve desvio.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 21:56:31 · `tasks/prd-reengenharia/96_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- **Caminho feliz:** nenhuma pasta de `apps/api/src` passa de 25 arquivos de produção na raiz dela. A conta enxerga as subpastas por recurso, e a lista de exceções está vazia.
- **Borda 1:** a contagem não inclui `.test.`, `.d.ts` nem `__fixtures__`.
- **Borda 2:** um controller que desceu para uma subpasta (`estrutura/turma/x.controller.ts`, `sessao/login/x.controller.ts`) continua barrado pelo `no-restricted-syntax`.
- **Permissão (só uma pessoa aprova):** um `.aprovar(` fora de `correcao/`, por exemplo em `atividade-aplicada/`, reprova a varredura do `correcao.int.test.ts`.
- **Isolamento:** os repositories movidos continuam com escopo de tenant. A trava `escopo-dos-repositories.ts` lê as pastas de forma recursiva e acusa `lista-arquivo-inexistente` quando a lista cita um caminho que não existe. Os testes de isolamento das quatro pastas ficaram iguais, só com os imports trocados.
- **Concorrência:** não se aplica. A tarefa é um movimento de arquivos, sem operação nova.

Cobertos:
- **Linha 1 da tabela:** coberta por `tamanho-das-pastas.test.ts › no repositório, nenhuma pasta de apps/api/src passa de 25…` (linha 119) e pelas mutações 1 e 2. Esse teste confere quatro arquivos-sentinela, um por pasta partida, e exige mais de 200 arquivos de produção.
- **Linha 2:** coberta pelo teste da 97.0 `teste, declaração e fixture não contam…` (`tamanho-das-pastas.test.ts:70`). A função de contagem não depende do caminho.
- **Linha 3:** coberta pelo teste que já existia `o controller em subpasta do módulo é barrado como o da raiz…` (`guardas.test.ts:105`). Ele linta `apps/api/src/estrutura/turma/x.controller.ts` na linha 115 e fica vermelho se o `files` virar `*/*.controller.ts`. O `eslint.config.mjs` não mudou, então não há cláusula nova que exija bloco.
- **Linha 4:** coberta pela mutação 5. Ela põe um `.aprovar(` em `atividade-aplicada.service.ts`, e a linha de contexto `const registro = new RegistroDeAuditoria()` existe e é única (linha 20). As mutações 3 e 4 provam a varredura recursiva a partir de `..`.
- **Caminhos citados como texto:** o grep não achou nenhum caminho antigo de `apps/api/src/{estrutura,operacao,sala,atividade}/<arquivo>` em `apps`, `infra`, `e2e`, `tools` e `packages`. Os `importar('apps/api/dist/operacao/escola/escola.js')` apontam para o lugar novo. O `RAIZ` de `escola.repository.test.ts` continua com cinco níveis, que está certo. As outras varreduras por prefixo de pasta continuam valendo: `entrega.int.test.ts:354` e o C40.
- **Sem `.skip`, `.only` nem teste comentado no diff.**
- **Rodei e ficou tudo verde:** `tamanho-das-pastas`, `guardas`, `repositories-com-escopo`, `escola.repository.test` (180 testes); `correcao.int.test.ts › só uma pessoa aprova`; `operacao-isolamento.int.test.ts` mais `apps/api/src/atividade` (90 testes); `arquitetura.test.ts` mais `reivindicacao.service.test.ts` (81 testes).

Bloqueantes: nenhum

Recomendações:
1. **`RAIZES_DA_TRAVA` já não é lido por ninguém** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/tamanho-das-pastas.test.ts:14`). Os testes reais passaram a fixar a raiz no próprio código, em `['apps/web/src']` (linha 110) e `['apps/api/src']` (linha 120). Por isso a mutação 1 só fica vermelha pela asserção-espelho da linha 105, e tirar a raiz da lista não desliga trava nenhuma. Vale apagar a constante e o espelho, ou fazer os testes reais iterarem sobre ela, para não sugerir que a lista governa alguma coisa.
2. **Citar na tabela os testes das linhas 2 e 3** pelos nomes, como estão em "Cobertos". Hoje eles não aparecem nem na tabela nem em bloco de mutação.
3. **A mutação 4 fica vermelha pelo formato dos nomes**, porque sem o prefixo `correcao/` os nomes não batem com o esperado. Ela não chega a mostrar que o intruso deixaria de ser visto. A prova real do alcance é a mutação 5, então isso não bloqueia. Um comentário no teste ligando as duas ajudaria quem ler depois.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 22:06:34 · `tasks/prd-reengenharia/96_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum.

A correção que pedi na 1ª rodada foi feita:
- **A verificação lê a lista de raízes.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/tamanho-das-pastas.test.ts:105`, a conferência do repositório real agora chama `arquivosDasRaizes(RAIZES_DA_TRAVA)`. Os pontos de conferência das duas raízes ficam no mesmo caso, nas linhas 107 a 113.
- **A mutação 1 fica vermelha.** Ela tira `apps/api/src` da lista, e com isso os quatro `toContain` de `apps/api/src/...` falham. A constante deixou de ser código morto.
- **A comparação que fixava as exceções em lista vazia saiu.** No lugar dela entrou a conferência das linhas 117 e 118: toda exceção precisa ter motivo escrito e ainda passar do teto. A mutação 2 (exceção `apps/api/src/estrutura` com o motivo "em movimento") fica vermelha por ela, porque `estrutura/` não passa de 25 arquivos.
- **O `96_task.md` foi atualizado junto.** Os blocos de mutação 1 e 2 citam o nome novo do caso (linhas 90 e 97). A coluna "Fica vermelho se" do cenário 1 (linha 52) descreve as duas mutações.
- **O comentário novo está certo.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/atividade/correcao/correcao.int.test.ts:367-369`, o comentário confere com o código. A varredura recursiva a partir de `..`, com os nomes esperados prefixados por `correcao/` (linhas 376 a 378), faz as mutações do `recursive` e do `'..'` ficarem vermelhas, como ele diz.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/96_task.md:131-132`: a tabela "Recomendações sem aplicar" está vazia. A instrução da seção pede que se escreva "nenhuma" quando não houver recomendação.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 22:07:16 · `tasks/prd-reengenharia/96_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada, que não mudaram.
- Caminho feliz: nenhuma pasta de `apps/api/src` passa de 25 arquivos de produção, e a conta enxerga os recursos partidos.
- Borda 1: a contagem deixa de fora `.test.`, `.d.ts` e `__fixtures__`.
- Borda 2: o controller que desceu para uma subpasta continua barrado pelo `no-restricted-syntax`.
- Permissão: um `.aprovar(` fora de `correcao/` reprova a varredura.
- Isolamento: os repositories movidos mantêm o escopo de tenant e só tiveram o import trocado.
- Concorrência: não se aplica, porque a tarefa só move arquivos.

Cobertos:
- **As três recomendações da 1ª rodada foram feitas.**
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/tamanho-das-pastas.test.ts:105` passou a ler `arquivosDasRaizes(RAIZES_DA_TRAVA)`. A constante governa a conferência de novo, e o caso que só comparava a lista com ela mesma saiu.
  - A tabela de `96_task.md` (linhas 53 e 54) cita pelo nome os testes das linhas 2 e 3.
  - O comentário em `correcao/correcao.int.test.ts:364-366` liga a mutação 5 à 3 e à 4.
- **As mutações 1 e 2 agora ficam vermelhas pela conferência real.** Conferi pelo código, sem aplicar.
  - Mutação 1: sem `'apps/api/src'`, os quatro `toContain` das linhas 110 a 113 falham.
  - Mutação 2: com a exceção `apps/api/src/estrutura`, a pasta continua dentro do teto, então a exceção é desnecessária e o filtro da linha 118 a devolve. O caso reprova pelo motivo certo: "exceção que a pasta não precisa sai da lista".
- **O texto do comentário novo em `correcao.int.test.ts` está certo.** Sem `recursive`, só os arquivos da raiz de `atividade/` aparecem, e os nomes esperados com o prefixo `correcao/` não batem. Com `'.'`, a pasta lida passa a ser a própria `correcao/`, e os nomes vêm sem o prefixo. As mutações 3, 4 e 5 continuam valendo.
- **A linha 1 da tabela foi reescrita** com o motivo verdadeiro de cada vermelho.
- **Não há `.skip`, `.only` nem teste comentado no diff.**
- **Rodei `npx vitest run tools/guardas/tamanho-das-pastas.test.ts`:** 6 de 6 verdes.

Bloqueantes: nenhum

Recomendações:
1. **Uma parte do teste novo ainda não tem mutação que a prove.** É o ramo `excecao.motivo.trim() === ''` em `tamanho-das-pastas.test.ts:118`: com a lista de exceções vazia, apagar esse ramo não deixa nada vermelho. É asserção do próprio teste, sobre uma lista vazia, por isso não bloqueia. Se quiser prová-lo, extraia o filtro para uma função e teste-a com uma exceção de motivo vazio, como o caso da linha 91 já faz para `pastasAcimaDoLimite`.
2. **A mensagem de falha em `tamanho-das-pastas.test.ts:115` fala só da web** ("telas, hooks e cliente de API"), mas agora o mesmo caso também falha por uma pasta da API. Vale uma mensagem que sirva às duas raízes, por exemplo "divida por assunto ou por recurso (D81)".
3. **Uma frase de `96_task.md:60` ficou velha.** Ela ainda diz que "a provisória de `estrutura/` sai em 96.6", e a divergência da linha 77 afirma que essa exceção nunca existiu.
4. **A tabela "Recomendações sem aplicar" de `96_task.md` (linha 131) está vazia, sem a palavra "nenhuma".** Faltam duas recomendações que não foram feitas: a do `tenancy-guardian` sobre os caminhos antigos nos documentos de `.reengenharia/` e a do `revisor-geral` sobre a pasta vazia `operacao/casos-de-uso/`. Ponha cada uma com o destino ou o motivo de recusa.

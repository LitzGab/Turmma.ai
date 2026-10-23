# Achados das revisões — `tasks/prd-harness/8_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 15:08:22 · `tasks/prd-harness/8_task.md`

VEREDITO: APROVADO

Caminho quente tocado: nenhum. A tarefa só mexe no portão local e na esteira (`tools/processo/`, `tools/ci/`, `package.json`). Nada roda dentro de request, nem passa pelo login, pelo tutor, pela sala, pela prova, pela fila de produção, pelo gateway de IA ou por migration.
Rate limit: ok (não se aplica)
Fila e prioridade: ok (não se aplica). O `stop` atinge só o compose de teste do checkout (`ARGUMENTOS_COMPOSE`, projeto `educa-teste[-N]`), e não a fila de produção.
Concorrência: protegida. Cada linha paralela usa o próprio projeto de teste (`AMBIENTE_DE_TESTE`). A lista vazia de serviços de job lança erro em vez de virar um `stop` do projeto inteiro (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/sequencia-do-portao.ts`, em `passosDoAlvo`).
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica. Nenhum teste novo chama provedor pago.
Migration: não se aplica
Métrica e alerta: ok (não se aplica, é ferramenta local de desenvolvimento)
Bloqueantes: nenhum

Recomendações:
- O `stop` antes da integração não faz diferença no fluxo atual. No alvo, a integração sempre roda com `bancoNovo: true` (`EDUCA_BANCO_NOVO=1`). Com essa variável, o `globalSetup` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/testes/integracao.setup.ts:17`, via `comandosDaSubidaDeTeste` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/compose.ts:176`) já executa `down --volumes --remove-orphans` no projeto inteiro, e os workers caem junto. O `stop` funciona como defesa, e não faz mal. Mas o teste do RF7 só confere a ordem dos comandos: não prova que um worker de pé consumia o job do teste nesse caminho. Vale registrar na Tech Spec quando esse `stop` é a única proteção, ou seja, numa integração que rode sem banco limpo.
- `servicosDeJob()` lê o `infra/compose.yml` em todo portão, mesmo sem integração nos alvos (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts`, na chamada de `sequenciaDoPortao`). O custo é pequeno. Só vale ler sob demanda se o compose um dia não for legível em algum checkout.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-23 15:10:08 · `tasks/prd-harness/8_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As quatro divergências estão na `techspec.md` §2 e no `cenarios.md` RF7 e RF8.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/sequencia-do-portao.ts:60` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts:157`. O `stop` que a tarefa acrescenta não muda nada, e o portão continua deixando um worker de pé consumir o job do teste. Por isso o critério de aceite do RF7 ("Worker de pé não consome o job do teste") não é atendido.
   - **O `stop` do alvo não muda nada.** A integração do alvo roda com `bancoNovo: true`. Com isso, o `globalSetup` (`tools/testes/integracao.setup.ts:17`, via `comandosDaSubidaDeTeste` em `tools/ci/compose.ts:176`) já faz `down --volumes --remove-orphans` no projeto inteiro antes de subir só os `SERVICOS_INFRA`. Os workers já caíam aí, antes desta tarefa: o código antigo também passava `EDUCA_BANCO_NOVO=1` à integração do alvo.
   - **Onde o worker fica de pé.** A ordem real do portão da tarefa é: `stop`, integração (`down -v`, depois `up` só da infra), e2e (`--manter-ambiente` sobe o ambiente inteiro, workers incluídos, e os deixa de pé; a tarefa testa isso de propósito), infra e, por fim, as mutações. As mutações rodam `npx vitest run --project integracao <arquivo>` com `EDUCA_BANCO_NOVO` desligado (`tools/processo/mutacoes.ts:440`). Então, numa tarefa que altera um teste de integração e um de e2e e declara mutação sobre a integração, a corrida limpa e cada corrida mutada acontecem com os despachantes e os workers de pé. É o mesmo defeito do `educa-teste-3` (`tasks/prd-reengenharia/estado.md:200-203`), agora dentro do portão. Ele pode recusar a corrida limpa ou dar como provada uma mutação que ficou vermelha por outro motivo.
   - **O que os testes provam hoje.** `portao-local.test.ts` só confere a posição do `stop` em relação ao vitest do alvo. Nenhum caso cobre o trecho em que os workers estão de pé.
   - **Correção exigida, em três partes:**
     - O portão derruba os `servicosDeJob` antes de qualquer corrida de integração que não comece do banco limpo, no mínimo antes das mutações quando alguma delas cita um `.int.test.ts`.
     - Um teste de unidade sobre a função pura prova essa ordem: um `stop` depois do e2e e antes da primeira mutação de integração.
     - A Tech Spec e o `cenarios.md` RF7 passam a dizer onde o `stop` é a única proteção. Se a mudança tocar `mutacoes.ts`, a linha dele na §2 ganha o RF7.
   - Se o Arquiteto decidir que o `stop` do alvo fica só como redundância, isso também vai escrito na Tech Spec, e não só aqui.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tasks/prd-harness/8_task.md:46`: a tabela de arquivos marca `duracao-do-e2e.test.ts` como "divergência 3", mas na tabela de divergências ele é a 4. A 3 é o `suitesDoPortao`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts:17`: o portão passou a importar `tools/ci/compose.ts`, que no carregamento valida `EDUCA_AMBIENTE_TESTE` e grava `.processo/ambiente-de-teste-N.env`. Isso agora vale também para o `conferir` que o revisor roda, e um número de ambiente inválido derruba o `conferir`, que nada tem a ver com o compose. Vale ler `servicosDeJob()` e `ARGUMENTOS_COMPOSE` só no caminho que monta a sequência. O `infra-guardian` já apontou o custo da leitura.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/revisoes.ts:100,105`: `SUITES_DO_PORTAO_DA_TAREFA` e `SUITES_DO_PORTAO_COMPLETO` ainda trazem `'segredo', 'dependencias'` escritos à mão. Uma guarda nova em `GUARDAS_DA_ESTEIRA` fica vermelha no teste, o que segura o desvio, mas a fonte única do RF8 ainda tem uma cópia. Pode ficar para quando `revisoes.ts` for partido (RF13).

## test-engineer · 1ª rodada · REPROVADO · 2026-10-23 15:11:46 · `tasks/prd-harness/8_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **RF7, caminho feliz:** com integração nos alvos, o `stop` dos despachantes e workers vem antes do `vitest --project integracao`.
- **RF7, bordas:**
  - sem integração nos alvos, nada é derrubado;
  - depois da integração, o e2e sobe os workers de novo;
  - um compose sem despachante nem worker é erro, e não vira um `stop` do projeto inteiro;
  - a lista dos serviços vem do compose real, e uma réplica nova entra sozinha;
  - o banco limpo (`EDUCA_BANCO_NOVO`) fica só com o `test` e com a integração do alvo.
- **RF8, caminho feliz:** o portão e o `ci:verificar` leem a mesma lista de guardas.
- **RF8, bordas:**
  - uma guarda posta direto no `verificar.ts` deixa o teste vermelho;
  - uma guarda a mais na lista que falte no portão da tarefa deixa o teste vermelho;
  - o `guarda:dependencias` roda as etapas da lista, e não um texto redigitado.
- **Permissão e isolamento:** não se aplicam, porque a tarefa não toca dado de escola. A concorrência entre linhas está coberta pelo projeto de teste de cada uma (`AMBIENTE_DE_TESTE`).

**Cobertos (os 5 itens da tabela têm teste nomeado):**
- RF7 ordem: `portao-local.test.ts › com integração nos alvos, o stop ... vem antes`. Ele confere o comando inteiro e a posição.
- RF7 sem integração: `› sem integração nos alvos, nada é derrubado`.
- RF7 e2e sobe de novo: `› o e2e sobe os workers de novo`. Ele afirma o `up` sem lista de serviços em `etapasDoE2e`.
- RF8 guarda a mais: `scripts.test.ts › ci:verificar roda tipos, lint, as guardas da lista`, que compara com as chamadas reais. Também `portao-local.test.ts › as suítes de guarda estão ... no portão da tarefa e no completo`.
- RF8 listas iguais: `scripts.test.ts › RF8: o script do portão de cada guarda` e `portao-local.test.ts › a sequência do portão completo e a da tarefa levam os comandos das guardas`.
- Rodei `portao-local.test.ts`, `scripts.test.ts`, `knip.test.ts` e `duracao-do-e2e.test.ts`: 103 de 103 verdes. O `revisoes.test.ts › o portão local, rodado como processo` também está verde.
- Não há `.skip`, nem mock que esconda a regra, nem provedor de IA.

**Bloqueantes:**
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts:131`: a linha nova `EDUCA_BANCO_NOVO: passo.bancoNovo ? '1' : undefined` tem um ternário e nenhum bloco de mutação no documento.
   - É ela que transforma a marca `bancoNovo` na variável de ambiente que limpa o banco.
   - Todas as mutações de "banco limpo" atacam só a marca, em `sequencia-do-portao.ts`, e nenhuma ataca essa conversão.
   - O teste que a pega já existe: `tools/processo/revisoes.test.ts › o portão local, rodado como processo, não carimba o que a suíte editou no meio da corrida`. Os scripts falsos dele exigem `EDUCA_BANCO_NOVO=1` só no `test` e a variável vazia nas outras suítes.
   - **Correção exigida:** declarar em `8_task.md` ao menos dois blocos citando esse teste:
     - `passo.bancoNovo ? '1' : undefined` → `'1'`, que fica vermelho no `typecheck` falso;
     - `passo.bancoNovo ? '1' : undefined` → `passo.bancoNovo ? '1' : process.env['EDUCA_BANCO_NOVO']`, que fica vermelho porque a variável herdada chega às outras suítes.

**Recomendações:**
1. **`etapasSemGuardaNoPortao` não protege nada fora do teste.** Ela está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/etapas-de-guarda.ts:142` e é testada em `scripts.test.ts:128`.
   - Com o dado real, o resultado vazio é tautológico: `ETAPAS_DE_GUARDA` sai de `GUARDAS_DA_ESTEIRA` por `flatMap`.
   - Nenhum código de produção chama a função, e o teste não lê o `verificar.ts`.
   - Quem prova o RF8 é o teste que roda o `verificar.ts` de verdade.
   - Sugestão: tirar a função, ou fazê-la comparar com as chamadas reais do `ci:verificar`. Ajustar também o `cenarios.md` (RF8), que a cita como mecanismo.
2. **O vínculo entre o script do portão e as etapas da guarda não é genérico.** Em `scripts.test.ts:136`, a comparação é feita com `ETAPAS_DE_DEPENDENCIAS` pelo nome, e não percorrendo `GUARDAS_DA_ESTEIRA` contra `guarda.etapas`.
   - Uma guarda futura cujo script redigite o comando passa depois de alguém atualizar a lista escrita à mão. É a mesma classe do M7.
   - Sugestão: iterar as guardas e declarar a exceção do `segredo`, que monta as próprias etapas para a árvore de trabalho e para os arquivos sem commit.
3. **O comentário de `GuardaDaEsteira` está errado.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/etapas-de-guarda.ts:120`, ele diz que o `segredo.ts` roda as mesmas `etapas` importadas daqui. Não roda: o `segredo.ts` monta as dele a partir de `argumentosGitleaks`.
4. **O `stop` não protege nada hoje e o caminho do incidente segue aberto.** Mesmo ponto que o `infra-guardian` registrou: a integração do alvo roda com `EDUCA_BANCO_NOVO=1`, e o `globalSetup` já faz `down --volumes --remove-orphans` no projeto inteiro. Só que o vermelho da X5 (`estado.md` da reengenharia, 22/10, `educa-teste-3`) pode ter vindo de uma integração rodada isolada, sem a variável. Esse caminho não muda com esta tarefa. Vale levar ao `/validar` se o `stop` deve ir para o `comandosDaSubidaDeTeste` no caso sem banco limpo.
5. **A fiação de `portao-local.ts:139` não tem asserção.** Faltam as chamadas `sequenciaDoPortao(suites, …)` e `servicosDeJob()`. Só a leitura de texto do `duracao-do-e2e.test.ts` alcança o `passo.comando`. Vale uma asserção de texto no mesmo bloco das ligações.
6. **Duas mutações estão sob um teste de nome estreito.** As de `alvos.e2e.length` e `alvos.infra.length` citam `sem integração nos alvos, nada é derrubado`. O vermelho é legítimo (o `toEqual([])`), mas o nome do teste fala só do `stop`.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-23 15:19:41 · `tasks/prd-harness/8_task.md`

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
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/duracao-do-e2e.test.ts:610-623`: o teste "o portão liga a sequência pura" procura em `portao-local.ts` a linha inteira, caractere por caractere (`toContain` sobre a linha completa). Uma reformatação do Prettier o deixa vermelho sem mudança de comportamento. As mutações declaradas nele valem como prova. O ideal é extrair a ligação do `portao-local.ts` para uma função testável, e o lugar para isso é o `/retro`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts:349`: o `lerMutacoes(textoDoDocumento).mutacoes` ignora os `erros`. Com um bloco malformado que cita teste de integração, o `stop` das mutações não entra na sequência. O `conferirMutacoesDoDocumento` reprova o documento logo depois, então não chega a rodar mutação com worker de pé. Mesmo assim, um comentário de uma linha dizendo isso evita que alguém confunda o caso com uma corrida.

Conferido nesta rodada:
- A rodada anterior não exigiu correção.
- O diff `ba501fb..e99edd9` mexe só na ferramenta do portão local (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/sequencia-do-portao.ts` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts`) e nos documentos da spec. Não toca API, worker, fila de produção, gateway de IA nem migration.
- O `stop` novo, antes das mutações de integração, fecha o caso do RF7 que estava aberto: o worker que o e2e deixa de pé (`--manter-ambiente`) consumia o job do teste de integração mutado, que roda sem banco limpo.
- Lista vazia de serviços continua sendo erro nos dois `stop` (`derrubarJob`). Assim nunca sai um `stop` do projeto inteiro, que derrubaria o banco junto.
- `mutacao.teste` já guarda só o caminho, sem o ` › caso`, então o `tipoDoTeste` classifica certo.
- O `lerMutacoes` junta os erros em vez de lançar exceção, então ler o documento antes das suítes não derruba o portão.
- Nenhum teste chama provedor pago.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 15:20:28 · `tasks/prd-harness/8_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A divergência 5 aparece em `techspec.md` §2, na linha de `sequencia-do-portao.ts`, e em `cenarios.md` RF7, os dois lugares que o `8_task.md` indica. `mutacoes.ts` não mudou, então a linha dele na §2 não precisava do RF7.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum.

A correção exigida na rodada anterior foi feita nas três partes:
- **(a) Derrubar os workers antes das mutações.** Quando alguma mutação do documento cita um teste de integração, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/sequencia-do-portao.ts:94-100` põe um `stop` dos despachantes e workers no fim da sequência. `portao-local.ts:140-143` lê o documento antes das suítes para saber disso. Conferi que a integração das mutações sobe só a infra (`comandosDaSubidaDeTeste`, `compose.ts:177`), então os workers continuam parados nas corridas seguintes.
- **(b) Teste da ordem.** `portao-local.test.ts:272-314` prova que esse `stop` é o último passo, vem depois do e2e e do infra e só aparece quando há mutação de integração. As mutações declaradas cobrem a falta do `stop`, a troca de ordem e a condição invertida.
- **(c) Documentação.** A Tech Spec e o `cenarios.md` RF7 dizem que o `stop` das mutações é a única proteção. O `stop` do alvo ficou escrito como redundância do `down --volumes`.

Recomendações:
1. **Uma ordem de mutações ainda deixa o RF7 aberto.** Uma mutação de e2e sobre `apps/` ou `packages/` usa `pedeReconstrucao` e roda `node tools/ci/e2e.ts --manter-ambiente`, que sobe o ambiente inteiro (`mutacoes.ts:179`). Se ela vier antes de uma mutação de integração no mesmo documento, os workers voltam e consomem o job do teste. Nenhum documento de tarefa existente mistura esses dois tipos, por isso fica como recomendação. Há dois caminhos: escrever o caso na Tech Spec como limitação conhecida, ou, numa tarefa que já mexa em `mutacoes.ts` (a 9.0), rodar o `stop` antes de cada corrida de integração que vier depois de um e2e.
2. **Comentários desatualizados.** O comentário de `passosDaSuite` (`sequencia-do-portao.ts:44-50`) e a linha `portao-local.ts:138` ainda tratam o `stop` do alvo como o que protege o teste. A Tech Spec agora diz que ele é redundante, e o texto deveria acompanhar.
3. **Mensagem de erro de `derrubarJob`.** Em `sequencia-do-portao.ts:32` a mensagem diz "antes da integração", mas a mesma função agora serve também ao `stop` das mutações.
4. **Revisores citados na divergência 5.** O texto em `8_task.md:78` diz que o `infra-guardian` exigiu a correção, mas ele aprovou na 1ª rodada. Só o `revisor-geral` e o `test-engineer` reprovaram.

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 15:20:39 · `tasks/prd-harness/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** caminho feliz, bordas, permissão e isolamento. Esta tarefa é ferramenta de processo e não toca dado de escola, então não há caso de permissão nem de isolamento.
- RF7, caminho feliz: com integração nos alvos, o `stop` dos despachantes e workers vem antes do `vitest --project integracao`.
- RF7, borda: sem integração, nada é derrubado.
- RF7, borda: depois da integração, o e2e sobe tudo de novo.
- RF7, borda: compose sem despachante nem worker é erro, para não virar um `stop` do projeto inteiro.
- RF7, borda nova da divergência 5: mutação que cita teste de integração faz a sequência terminar num `stop`, depois do e2e e do infra. Sem essa mutação, esse `stop` não existe.
- RF8, caminho feliz: as listas do `ci:verificar` e do portão são iguais, lidas de `etapas-de-guarda.ts`.
- RF8, borda: uma guarda a mais na esteira e não no portão dá vermelho.
- Banco limpo: só o `test` e a integração do alvo recebem `EDUCA_BANCO_NOVO=1`, e a variável herdada não chega às outras suítes.

**Cobertos:**
- A correção exigida na 1ª rodada foi feita. Em `tasks/prd-harness/8_task.md` (linhas 303 a 314) estão os dois blocos sobre `passo.bancoNovo ? '1' : undefined`, citando `tools/processo/revisoes.test.ts › o portão local, rodado como processo`.
  - Os dois chegam à cláusula: o processo roda com `EDUCA_BANCO_NOVO=1` herdado, e os scripts do fixture exigem `test -z "$EDUCA_BANCO_NOVO"` no `typecheck`. Com `'1'` ou com a variável herdada passando, o `typecheck` falso fica vermelho. É o motivo certo.
- As cláusulas novas desta rodada têm bloco ou teste que as derruba:
  - `derrubarJob`: a guarda da lista vazia tem o bloco `=== 1`. A guarda deixou de exigir integração nos alvos, e isso está provado pelo `not.toHaveLength(0)` com lista vazia e sem mutação de integração.
  - `entrada.mutacoesDeIntegracao ? ...`: três blocos (remover, trocar a ordem, negar).
  - `mutacaoDeIntegracao`: o bloco `!== 'e2e'`. Trocar `.some` por `.every` também cairia, pelo par unidade com integração.
  - No `portao-local.ts`, a leitura do documento, o `&&` com `mutacaoDeIntegracao` e o `if (documento && textoDoDocumento !== null)` têm blocos sobre o teste de texto `o portão liga a sequência pura`.
- O `mutacaoDeIntegracao` lê `mutacao.teste` já sem o ` › caso`, porque o `lerMutacoes` separa os dois. Então o `tipoDoTeste` recebe o caminho limpo, e o teste de unidade reflete o uso real.
- Rodei `portao-local.test.ts`, `duracao-do-e2e.test.ts` e `scripts.test.ts`: 100 de 100 verdes. Rodei também `revisoes.test.ts -t "o portão local, rodado como processo"`: verde.
- Não há `.skip`, nem mock que esconda a regra, nem chamada de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `tasks/prd-harness/8_task.md:51-57`, a tabela "Testes que provam a regra" não tem linha para a divergência 5 (o `stop` antes das mutações de integração). As linhas existentes também não citam o teste pelo nome. Falta acrescentar a linha e citar os casos de `tools/processo/portao-local.test.ts` pelo nome.
2. A ligação no `portao-local.ts` (documento → `mutacaoDeIntegracao` → sequência) só está provada pelo texto, em `tools/ci/duracao-do-e2e.test.ts` › `o portão liga a sequência pura...`. Isso prova a forma da linha, não o comportamento. O teste de processo em `tools/processo/revisoes.test.ts:487` poderia ganhar uma variante: um documento de tarefa com uma mutação que cita `*.int.test.ts` e um `docker` falso no `PATH`, conferindo que o `stop` roda antes da primeira mutação.
3. Duas linhas que já existiam foram movidas ou reescritas no `portao-local.ts` sem bloco: `const documento = daTarefa ? documentoDasMutacoes() : null` e `!dependencias ? 'dependências' : sequencia.find(...)?.suite`. O comportamento não mudou, mas o `--faltando` da 9.0 deve listá-las. Vale declarar um bloco para cada uma, ou registrar o motivo de não ter.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tasks/prd-harness/8_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/sequencia-do-portao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/duracao-do-e2e.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/revisoes.test.ts`

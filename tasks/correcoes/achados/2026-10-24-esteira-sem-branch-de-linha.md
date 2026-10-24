# Achados das revisões — `tasks/correcoes/2026-10-24-esteira-sem-branch-de-linha.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-24 13:43:22 · `tasks/correcoes/2026-10-24-esteira-sem-branch-de-linha.md`

VEREDITO: APROVADO

A correção muda só a configuração da esteira, a regra 40 e o teste da esteira. Nenhum campo de pessoa, rota, DTO, log, storage, exportação nem envio de IA foi tocado.

Campos pessoais tocados: nenhum.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: não se aplica, porque não há rota nem endpoint novo ou alterado.
Logs: limpos. O diff não escreve log nenhum.
Auditoria: não se aplica. Nenhuma ação que a regra 20 item 10 exige auditar foi tocada.
Envio externo: nenhum. O workflow continua com `permissions: contents: read`, sem segredo do repositório, e não mudaram os dois `upload-artifact` já existentes (`.github/workflows/ci.yml:133` e `:152`).
Seed/fixture: sintético. O teste novo em `tools/ci/esteira.test.ts` usa só nomes de branch inventados, como `spec/harness--l1` e `correcao/2026-10-24-esteira`.

O único ponto de privacidade era se as guardas de dado pessoal e de segredo continuam valendo para o commit da linha. Continuam:
- **Antes do commit:** o portão local (`tools/processo/portao.ts:143`, `suitesExigidas`) exige `segredo` (gitleaks), `lint` e a unidade inteira. É ali que rodam `guardas/log-sem-dado-pessoal` e `guardas/log-sem-conteudo-montado`. O hook não aceita o commit sem esse carimbo, então ele continua barrando antes de o commit da linha subir.
- **No GitHub:** o push da spec no encontro roda a esteira inteira, e o gitleaks lê o histórico todo (`fetch-depth: 0`). Os commits da linha entram nessa leitura antes do pouso na `develop`.
- **Escopo do filtro:** o padrão `!spec/**--l*` só pega branch de linha. `tools/processo/linhas.ts:286` recusa spec com `--l` no nome, e `correcao/**`, `develop`, `release` e `main` continuam disparando. O teste novo prova isso nos dois sentidos, e a mutação declarada o deixa vermelho.

Pergunta de fechamento: a correção não muda o que o sistema guarda sobre um aluno nem para onde isso vai. A resposta continua a mesma de antes, pelos caminhos da regra 20 item 19.

Bloqueantes: nenhum.

Recomendações:
- O repositório é público e a branch de linha continua indo ao GitHub. Agora o gitleaks remoto só olha o commit da linha no encontro, horas depois em vez de minutos. A proteção que conta já roda antes do commit, no portão local. Mesmo assim, vale uma frase em `.claude/rules/40-testes.md`, na seção "A esteira", dizendo que o gitleaks local do portão da tarefa é a única checagem de segredo antes de o commit da linha ficar público. Assim ninguém tira o `segredo` de `suitesExigidas` achando que a esteira cobre.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.github/workflows/ci.yml
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/ci/esteira.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.claude/rules/40-testes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tasks/correcoes/2026-10-24-esteira-sem-branch-de-linha.md

## infra-guardian · 1ª rodada · APROVADO · 2026-10-24 13:43:39 · `tasks/correcoes/2026-10-24-esteira-sem-branch-de-linha.md`

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
- **Branches de spec.** O padrão `'!spec/**--l*'` vem logo depois de `'spec/**'`. Isso segue a regra do GitHub: os padrões valem na ordem, e o `!` tira o que já tinha entrado. Ele não pega nenhuma branch de spec de verdade, porque `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/linhas.ts:286` recusa spec com `--l` no nome.
- **Onde o veredito é lido.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.claude/skills/seguir/passos/6-tarefa.md:87` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.claude/skills/seguir/passos/8-validacao-e-pouso.md:16` rodam `esteira.ts` no andar da spec, que continua disparando. O encontro dá push na spec a cada tarefa concluída, então o retorno continua chegando uma tarefa depois. Se alguém rodar `esteira.ts` no andar da linha, a resposta é "sem execução", que sai com 0 na pergunta da tarefa: ninguém fica preso.
- **Concorrência.** O `concurrency` e o passo condicionado a `spec/` continuam corretos para a spec e para a correção.
- **Teste.** Rodei `tools/ci/esteira.test.ts`: 21 de 21 verdes. A mutação declarada derruba o caso novo, porque `spec/harness--l1` voltaria a casar com `spec/**`, e derruba também a lista exata do primeiro `it`. Nenhum teste chama provedor pago.

Recomendações:
- O texto ficou para trás em dois lugares que ainda dizem "todo push de `spec/**`", sem a exceção da linha:
  - o comentário do topo de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/esteira.ts:1-2`;
  - o texto da D79 em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/docs/decisoes.md:1350`.

  A mudança no documento da decisão passa pela skill `registrar-decisao`.
- O comentário novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.github/workflows/ci.yml:4-5` tem uma linha bem mais longa que as outras do bloco. Vale quebrar na mesma largura.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 13:43:41 · `tasks/correcoes/2026-10-24-esteira-sem-branch-de-linha.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. Esta é uma correção que veio da retro e não tem Tech Spec. Ela entrega exatamente o item M4 do `TODO.md:1866`, nos três arquivos que ele lista. Também confere com a D79: a revisão de 11/10 já diz que é o push da spec, no encontro, que dispara a esteira sobre a soma. Ninguém lê o veredito de uma branch de linha. O `esteira.ts` roda no andar da spec (`6-tarefa.md:87`, `8-validacao-e-pouso.md:16`) e usa a branch atual, e o `linhas.ts` recusa spec com `--l` no nome (linha 286). Por isso o `'!spec/**--l*'` não pega nenhuma branch de spec de verdade.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.claude/skills/corrigir/SKILL.md:102` ainda diz "A esteira roda em todo push de `spec/**` e de `correcao/**`". Uma correção feita numa linha ociosa (`6-tarefa.md:89`) está numa `spec/<func>--l<n>`, e lá a esteira não roda mais. Acrescentar que, na linha, a esteira só roda depois do encontro.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/esteira.ts:1` tem no cabeçalho a mesma frase ("em todo push de `spec/**`"), que ficou imprecisa. Ajustar quando o arquivo for mexido de novo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/ci/esteira.test.ts:224`: o nome do primeiro `it` ("roda em todo push nas branches ... de spec") e o comentário dele não citam a exceção da linha, que agora está na lista exata logo abaixo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.github/workflows/ci.yml:5`: essa linha do comentário ficou bem mais longa que as outras do bloco. É só para ler melhor: quebrar a linha como as vizinhas.

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 13:44:11 · `tasks/correcoes/2026-10-24-esteira-sem-branch-de-linha.md`

VEREDITO: APROVADO

**Cenários exigidos:**
1. Caminho feliz: o push de `spec/<func>` e o de `correcao/<slug>` disparam a esteira.
2. A regra: o push da branch de linha `spec/<func>--l<n>` não dispara.
3. Bordas reais do processo: linha com número de dois dígitos (`--l12`), spec com barra no nome (`spec/a/b--l2`), e branch com o sufixo `--l` fora de `spec/` (`feature/x--l1`, `spec-x--l1`), que continua sem disparar.
4. As integradoras (`develop`, `release`, `main`) seguem disparando.
5. O veredito que o Orquestrador lê não pode perder execução. O `tools/processo/esteira.ts` lê a branch atual, e o passo 6 o roda no andar, que está na branch da spec. As execuções das linhas já nunca entravam nessa leitura, porque o `gh run list --branch` filtra pela spec.
6. Concorrência e o passo condicional seguem valendo nas branches de trabalho, sem depender do exemplo de linha.
7. Isolamento entre escolas e permissão de usuário não se aplicam: a mudança é de CI, não toca dado de escola nem pessoa.

**Cobertos:**
- **Cenários 1 a 4:** `tools/ci/esteira.test.ts` › `a branch de linha (spec/<func>--l<n>) não dispara a esteira no push, e a da spec e a da correção disparam`. O teste aplica o `on.push.branches` do `ci.yml` real com a regra de filtro do GitHub: os padrões valem na ordem, o `!` exclui o que já tinha entrado, `*` não passa a barra e `**` passa. O helper lança erro com padrão fora dessa gramática, então não aceita em silêncio um padrão que não sabe ler.
- **Lista exata do `on.push`:** o primeiro `it` (`roda em todo push nas branches integradoras...`) confere a lista inteira com `toEqual`.
- **Cenário 6:** os casos de concorrência (`o grupo de concorrência cancela...`) e do passo condicional trocaram `spec/harness--l1` por `spec/harness` e continuam conferindo as branches de trabalho.
- **Mutação:** o bloco declarado tira o `'!spec/**--l*'` do `ci.yml`. Com isso, `disparaNoPush('spec/harness--l1')` passa a dar `true`, e a asserção `toBe(false)` falha. É vermelho por asserção, pelo motivo certo. O `toEqual` do primeiro `it` também quebraria. Não há outra cláusula de código no diff: o resto é comentário e texto da regra 40.
- **Execução:** rodei `npx vitest run tools/ci/esteira.test.ts`: 21 de 21 verdes. Não há `.skip`, mock nem IA envolvidos.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Testar contra o gerador do nome.** Em `tools/ci/esteira.test.ts:240`, os nomes de linha são literais. Usar `branchDaLinha('spec/harness', 1)`, de `tools/processo/linhas.ts:59`, prenderia o teste ao sufixo de verdade (`SUFIXO_DA_LINHA`, linha 57). Hoje, se o sufixo mudar, o teste segue verde e as linhas voltam a disparar a esteira.
2. **Corrigir o documento da tarefa.** Ele diz que `linhas.ts` (linha 286) "recusa spec com `--l` no nome". Na verdade, `contextoDe` só recusa rodar o comando numa branch assim; nada impede criar a branch. Vale dizer isso com essa precisão.
3. **Texto antigo em três lugares (assunto do `revisor-geral`).** Ainda dizem que a esteira roda "em todo push de `spec/**`", sem a exceção da linha: `tools/processo/esteira.ts:1`, `.claude/skills/corrigir/SKILL.md:102` e `docs/decisoes.md:1351` (D79). O último é texto de decisão e mudaria pela skill `registrar-decisao`.
4. **Um caso de borda no teste.** Faltam `spec/<func>--l0` e uma linha cujo `<func>` contém hífen (`spec/telas-do-aluno--l3`). O padrão já cobre os dois; é só cobertura extra.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tasks/correcoes/2026-10-24-esteira-sem-branch-de-linha.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/ci/esteira.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.github/workflows/ci.yml
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/esteira.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/linhas.ts

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 13:49:11 · `tasks/correcoes/2026-10-24-esteira-sem-branch-de-linha.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. O `conferir` deu "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".
Bloqueantes: nenhum
Recomendações: nenhuma nova. As três da 1ª rodada que ficaram sem aplicar estão na tabela "Recomendações sem aplicar" do documento, com destino `TODO.md`: o cabeçalho de `tools/processo/esteira.ts`, a frase em `.claude/skills/corrigir/SKILL.md:102` e o texto da D79. O destino é razoável, porque nenhum desses arquivos faz parte desta correção, e o texto de decisão só muda pela skill `registrar-decisao`.

Conferi cada recomendação aplicada desde a 1ª rodada:
- **`.github/workflows/ci.yml:4-8`**: o comentário agora quebra no tamanho das outras linhas, e o texto continua igual.
- **`tools/ci/esteira.test.ts`, primeiro `it`**: o título diz "menos as de linha", e o comentário aponta `!spec/**--l*` como a exceção.
- **`tools/ci/esteira.test.ts`, teste novo**:
  - Os nomes das branches de linha saem de `branchDaLinha` (`tools/processo/linhas.ts`), e não são mais escritos à mão.
  - Entraram as bordas `--l0` e `<func>` com hífen (`spec/telas-do-aluno`).
  - Há uma checagem `^spec\/.+--l\d+$` sobre o que o gerador devolve. Se o sufixo mudar, ela falha alto em vez de o caso passar sem testar nada.
  - A mutação declarada continua derrubando esse caso.
- **Seção "Causa" do documento**: corrigida. `contextoDe` só recusa o comando do processo numa branch com `--l`, e o que sustenta o padrão é a convenção dos nomes de spec. Isso bate com `linhas.ts`: o sufixo e `branchDaLinha` ficam por volta da linha 57-59, e a recusa em `contextoDe`, perto da linha 283-286.
- **`.claude/rules/40-testes.md:143-144`**: a frase nova explica por que o `segredo` (gitleaks) não sai do portão local: a branch de linha vai a um repositório público sem esteira até o encontro. É verdade, e protege contra alguém tirar essa suíte depois.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tasks/correcoes/2026-10-24-esteira-sem-branch-de-linha.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.github/workflows/ci.yml
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/ci/esteira.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.claude/rules/40-testes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/linhas.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 13:49:16 · `tasks/correcoes/2026-10-24-esteira-sem-branch-de-linha.md`

VEREDITO: APROVADO

Cenários exigidos (2ª rodada, só o diff desde a aprovação da 1ª):
- O push de uma branch de linha com o nome que o gerador `branchDaLinha` produz não dispara a esteira. Isso inclui as bordas `--l0`, `--l12`, `<func>` com hífen e spec com barra.
- O push da spec, da correção e das branches integradoras continua disparando a esteira.
- Uma branch fora de todos os padrões não dispara, tenha ou não o sufixo.
- Se o gerador mudar o sufixo, o teste quebra em vez de seguir verde com nomes escritos à mão.
- O texto do documento sobre `contextoDe` corresponde ao código.

Cobertos:
- `tools/ci/esteira.test.ts:238-260` ("a branch de linha (spec/<func>--l<n>) não dispara a esteira no push..."). Os nomes agora vêm de `branchDaLinha` (`tools/processo/linhas.ts:59`). Para cada um, o teste confere o formato (`/^spec\/.+--l\d+$/`) e confere que `disparaNoPush` dá `false`.
  - Se o `!spec/**--l*` sumir do `ci.yml`, as 5 linhas passam a dar `true` e o teste fica vermelho. A asserção é sobre o resultado do filtro, não sobre o código ter rodado.
  - Se o `SUFIXO_DA_LINHA` mudar, a checagem de formato fica vermelha e aponta que o padrão do workflow precisa ser revisto.
- `tools/ci/esteira.test.ts:225-236`: o nome e o comentário do primeiro `it` agora citam a exceção. A asserção `toEqual` sobre a lista exata de padrões é a mesma da 1ª rodada.
- A seção "Causa" do documento confere com o código. `branchDaLinha` está em `linhas.ts:59`. O `contextoDe` em `linhas.ts:286` recusa só o comando do processo numa branch com `--l` e não impede criar a branch pelo `git`.
- `npx vitest run tools/ci/esteira.test.ts`: 21 de 21 passaram.
- O diff não altera código de `apps/*/src` nem de `packages/*/src`. Ele mexe em teste, workflow, regra e documento, e a seção de mutações aprovada na 1ª rodada não mudou. Não há `.skip`, teste comentado nem mock. Não há IA nem concorrência neste diff.

Todas as recomendações da ordem r1 foram aplicadas: o comentário do `ci.yml` quebrado em linhas, o nome e o comentário do primeiro `it`, o `branchDaLinha` no teste, as bordas `--l0` e `<func>` com hífen, a precisão sobre `contextoDe` e a frase do gitleaks na regra 40. A tabela "Recomendações sem aplicar" foi copiada para o documento.

Bloqueantes: nenhum.

Recomendações:
- A frase nova da regra 40 (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.claude/rules/40-testes.md:143-144`) diz que, por causa disso, o `segredo` não sai das suítes do portão local. Fica melhor se ela citar o teste que já prova isso (por exemplo, o caso de `tools/processo/portao-local.test.ts` que exige `guarda:segredo`), no formato "Checagem:" das outras regras. Não conferi qual caso é esse, e por isso fica como recomendação, não como bloqueante.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/ci/esteira.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.github/workflows/ci.yml`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.claude/rules/40-testes.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tasks/correcoes/2026-10-24-esteira-sem-branch-de-linha.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/linhas.ts` (só leitura, para conferir o texto da Causa)

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-24 13:49:27 · `tasks/correcoes/2026-10-24-esteira-sem-branch-de-linha.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. O diff só mexe no gatilho da esteira (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/.github/workflows/ci.yml`), no teste dela (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/ci/esteira.test.ts`), em uma frase da regra 40 e no documento da correção. Não há migration, DTO, rota, log nem envio de dado.
Fora da tabela de dados do docs/lgpd.md: nada, porque não entra campo novo.
Autorização por objeto: não se aplica (nenhuma rota tocada).
Logs: limpos. O diff não acrescenta nenhum log.
Auditoria: não se aplica (nenhuma ação que a regra 20 obriga a auditar).
Envio externo: nenhum. O `ci.yml` continua sem segredo do repositório e só com o token do próprio GitHub (linhas 8 e 13 do arquivo).
Seed/fixture: sintético. Os únicos valores novos são nomes de branch gerados por `branchDaLinha` (`spec/harness`, `spec/telas-do-aluno`, `spec/a/b`). São nomes de spec, sem dado de pessoa.
Bloqueantes: nenhum.
Recomendações: nenhuma nova.

Sobre a rodada anterior:
- **A minha recomendação foi aplicada.** A frase nova na regra 40 deixa claro que o gitleaks do portão local, rodado antes do commit, é a única checagem de segredo do commit da linha até o encontro com a spec. Por isso o `segredo` continua nas suítes do portão local. Isso fecha o risco que importa num repositório público: um segredo ir ao GitHub numa branch de linha sem que a esteira tenha rodado. A frase bate com o `ci.yml`: a esteira do push da spec continua rodando o gitleaks sobre o histórico inteiro (linhas 35 e 42).
- **As outras mudanças não têm efeito sobre dado pessoal.** O comentário do `ci.yml` foi reorganizado, o teste agora usa `branchDaLinha` em vez de nomes escritos à mão e cobre as bordas `--l0` e o nome com hífen. O documento da correção também ficou mais preciso sobre o que o `contextoDe` recusa de fato.

**Pergunta de fechamento:** a resposta sobre o que o sistema guarda de um aluno e para onde foi enviado não muda com esta correção, que não toca nenhum caminho de dado de aluno.

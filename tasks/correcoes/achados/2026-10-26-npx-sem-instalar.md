# Achados das revisões — `tasks/correcoes/2026-10-26-npx-sem-instalar.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-26 16:03:12 · `tasks/correcoes/2026-10-26-npx-sem-instalar.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (a mudança não toca nenhum rate limit)
Fila e prioridade: ok (a mudança não toca a fila)
Concorrência: protegida (não há operação que possa rodar duas vezes ao mesmo tempo)
Índice e paginação: ok (não há query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não há código novo de runtime nem alerta novo)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/tools/processo/harness/npx-sem-instalar.test.ts`: a suíte ganha três chamadas reais do `npx`, cada uma com prazo de 60 s, dentro de um grupo de 90 s. Vale medir o tempo dessas três chamadas na esteira e, se pesar, separá-las num projeto do Vitest que roda só quando `.claude/settings.json` muda.
- Mesmo arquivo: o comentário acima do segundo `describe` diz "O prazo é o do `spawn` (60 s)", mas o prazo do grupo é 90 s. Vale deixar o texto dizendo os dois valores, para não parecer erro de digitação.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/.claude/settings.json`: esse `env` vale só para as sessões do Claude Code. A esteira e a VM de produção não o recebem. Se a regra também valer para a esteira, ela precisa de um `npm_config_yes=false` próprio, ou do `npm ci` sem `npx` solto. Hoje nada quebra.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-26 16:03:14 · `tasks/correcoes/2026-10-26-npx-sem-instalar.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A tarefa mexe só em ferramenta do processo: o `env` em `.claude/settings.json`, um teste em `tools/processo/harness/` e o arquivo da tarefa. Não há migration, repository, endpoint, DTO nem tela.

Fora da tabela de dados do docs/lgpd.md: nada, porque não entra nenhum campo novo.

Autorização por objeto: não se aplica. A tarefa não cria rota nem consulta.

Logs: limpos. O teste não grava log. O que ele lê da saída do `npx` são só mensagens do próprio npm.

Auditoria: não se aplica. Nenhuma das ações que a regra 20 item 10 lista aparece na tarefa (leitura de dado de aluno, exportação, nota, permissão, aprovação de saída de IA).

Envio externo: nenhum. O registro do npm no teste é um servidor HTTP local em `127.0.0.1`, com o cache numa pasta temporária que o teste apaga no fim. Nada sai para a rede, e nada vai para provedor de IA. O pacote é do controle não é desempacotado nem executado, porque o servidor responde 404 ao pedido do tarball. A correção também reduz um risco que toca a regra 20: antes, o `npx` de uma sessão do time podia baixar e rodar código de terceiro no checkout, com acesso ao que está nele.

Seed/fixture: sintético. O único dado do teste é o nome inventado `pacote-de-fora-do-lockfile`, com um manifesto em memória.

Bloqueantes: nenhum.

Recomendações:
- O cabeçalho de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/tools/processo/harness/npx-sem-instalar.test.ts` já declara um limite: o teste não prova que o Claude Code entrega o `env` ao Bash de cada subagente. Convém registrar no `TODO.md` uma conferência periódica disso (o `npx cowsay` cancelado numa sessão de verdade), porque uma mudança de versão do Claude Code pode desfazer a proteção sem nenhum teste ficar vermelho. Fica para a infra e o processo, não para a privacidade.
- O texto que pede `--no-install` em `.claude/agents/*.md` continua lá. Pode ser alinhado com a nova barreira para os revisores não continuarem achando que o aviso em texto é a proteção.

Pergunta de fechamento: a tarefa não muda o que o sistema guarda sobre um aluno nem para onde isso é enviado. A resposta à secretaria de educação continua a mesma de antes desta correção.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-26 16:03:18 · `tasks/correcoes/2026-10-26-npx-sem-instalar.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Esta correção não tem Tech Spec; a referência é o item MN7 do `TODO.md`, com a decisão M3 da retro da X4. O que foi feito é exatamente o que M3 pede: o `env` com `npm_config_yes: "false"` em `.claude/settings.json` e mais nada.
Portão local: carimbo válido. O `conferir` cobre typecheck, lint, segredo, dependências, unidade e alvo.
Bloqueantes: nenhum

Recomendações:
- Dois textos ainda mandam rodar `npx skills update -p`, que agora o Claude só consegue rodar com `--yes`. Um está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/.claude/skills/seguir/time.md:35`, o outro em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/docs/skills-de-terceiros.md:10` e `:34`. O documento da correção já registra esse efeito e dá o dono (Orquestrador). Vale garantir que o ajuste dos dois textos entre no TODO, para não se perder.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/tools/processo/harness/npx-sem-instalar.test.ts`, o comentário acima do segundo `describe` diz que "o prazo é o do `spawn` (60 s)", mas o grupo recebe `timeout: 90_000`. A frase confunde quem lê. Ela deveria dizer que os 90 s do grupo cobrem os 60 s do `spawn` com folga.
- O teste de controle (sem o `env`) olha só a mensagem "will be installed". Não confere o `status`, nem se o tarball foi pedido. Isso foi feito de propósito, por causa da corrida sob carga, e o documento justifica a escolha. Fica registrado apenas como limite conhecido do controle.
- O item MN7 do `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/TODO.md` (linha 2193) continua em aberto. Ele deve ser marcado como feito no fechamento da correção, se quem fecha costuma marcar.

## test-engineer · 1ª rodada · APROVADO · 2026-10-26 16:03:41 · `tasks/correcoes/2026-10-26-npx-sem-instalar.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta correção mexe em ferramenta do processo, não em dado de escola. Por isso não há cenário de permissão nem de isolamento entre escolas, e os casos de borda do domínio escolar não se aplicam. Os cenários que contam são estes:
- **Caminho feliz:** o `settings.json` declara `npm_config_yes=false`.
- **Borda 1:** com esse `env`, o `npx` de um pacote fora do projeto cancela e não pede o tarball.
- **Borda 2:** um pacote que está no `package-lock.json` (`vitest`) continua rodando com o mesmo `env`.
- **Controle:** sem o `env`, o mesmo `npx` decide instalar. Isso prova que é o `env` que impede.
- **Concorrência:** não se aplica, porque nada aqui acontece duas vezes ao mesmo tempo.

**Cobertos:** as quatro linhas da seção "Teste que reproduz" têm teste, cada uma com o seu, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/tools/processo/harness/npx-sem-instalar.test.ts`:
- `declara npm_config_yes como "false" no env do settings.json` (linha 32)
- `cancela o pacote de fora do projeto, e não pede o tarball ao registro` (linha 90): confere a mensagem de cancelamento, a saída com erro e a lista de pedidos `.tgz` vazia
- `o controle: sem o env, o mesmo npx decide instalar o pacote` (linha 97)
- `roda o que está no package-lock.json (vitest)` (linha 103)

**O que conferi:**
- **Mutação:** o `git diff` tem uma cláusula só, o bloco `env` em `.claude/settings.json`, e ela tem bloco ` ```mutacao `. Com a linha removida, o arquivo fica `"env": {}`, que ainda é JSON válido. O teste citado falha porque recebe `undefined` em vez de `'false'`, ou seja, falha pelo motivo certo e não por erro de carga. O teste da linha 90 também ficaria vermelho, porque o `env` vazio cai no comportamento do controle.
- **Asserções:** todas olham o resultado (decisão do `npx`, código de saída, pedidos ao registro). Nenhuma só confere que o código rodou.
- **Registro do npm:** é um servidor HTTP local no próprio teste. Não usa rede nem provedor de IA.
- **Proibidos:** não há `.skip`, `.only`, teste comentado nem `any`. O único mock é o registro do npm, que é externo, e ele não esconde a regra.
- **Prazo:** o grupo tem 90 s e cada `spawn` tem 60 s. Não depende de máquina folgada.
- **Execução:** rodei `npx vitest run tools/processo/harness/npx-sem-instalar.test.ts`. Passaram 4 de 4, em 1,1 s.
- **Efeito no resto do repositório:** todo `npx` usado nos hooks, nos scripts e em `tools/processo` é `npx vitest`, que está no lockfile. Nada quebra com o `env` novo. O efeito conhecido sobre o `npx skills update -p` já está registrado no documento, com dono.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `npx-sem-instalar.test.ts:82`, o teste neutraliza só a chave `npm_config_yes`, em minúsculas. O npm também lê `NPM_CONFIG_YES` em maiúsculas. Se o ambiente de quem roda tiver essa variável com `false`, o controle da linha 97 fica vermelho por motivo alheio à regra. Seria bom remover do `process.env` copiado qualquer chave que case com `/^npm_config_yes$/i`.
2. Em `npx-sem-instalar.test.ts:41` e `:77`, a lista `pedidos` é zerada a cada chamada, mas um pedido atrasado do `npx` anterior ainda pode cair na chamada seguinte. Hoje isso não muda nenhum veredito, porque o tarball só é pedido no controle, que roda depois do teste de cancelamento. Se alguém mudar a ordem dos testes, vale filtrar os pedidos pelo nome do pacote ou criar um servidor por teste.
3. O limite que o próprio teste declara continua de pé: ele não prova que o Claude Code entrega o `env` ao Bash de cada subagente. Vale deixar isso anotado para a validação, já que a prova que existe é o `npx cowsay` feito à mão na retro da X4.

## test-engineer · 2ª rodada · APROVADO · 2026-10-26 16:09:34 · `tasks/correcoes/2026-10-26-npx-sem-instalar.md`

VEREDITO: APROVADO

Cenários exigidos (os mesmos da 1ª rodada; esta rodada audita só o diff):
- Caminho feliz: um pacote que está no `package-lock.json` (o `vitest`) continua rodando com o `env` do settings.
- Regra: um pacote de fora do projeto é cancelado, e o registro não recebe pedido do tarball.
- Controle: sem o `env`, o mesmo `npx` decide instalar.
- O settings declara `npm_config_yes: "false"`.
- O controle não pode herdar a chave do ambiente de quem roda o teste, em minúsculas ou em maiúsculas. Era a recomendação 1, agora aplicada.

Cobertos:
- **Recomendação 1 aplicada.** `semNpmConfigYes` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/tools/processo/harness/npx-sem-instalar.test.ts:30-31`) tira do ambiente copiado qualquer chave que case com `/^npm_config_yes$/i`.
  - Antes, o teste punha `npm_config_yes: ''`, que não removia `NPM_CONFIG_YES`.
  - Agora o controle (linha 102) roda sem a chave, como o padrão do `npx` sem terminal: ele avisa "will be installed" e segue.
  - O caso do cancelamento (linha 95) recebe a chave só pelo `...env` do settings, aplicado depois do filtro (linha 87). Os dois casos ficam presos ao que o arquivo declara, e não ao ambiente da máquina.
- **O comentário do prazo (linhas 41-42) bate com o código:** o `spawn` mata o processo em 60 s e o `describe` dá 90 s, então um `npx` lento falha pela asserção da mensagem e não pelo prazo do Vitest. O prazo está dentro do teste, como a regra pede.
- **Mutação:** o bloco de `.claude/settings.json` continua citando o teste declarativo. O teste de comportamento (linha 95) também ficaria vermelho sem o `env`, porque a mensagem "npx canceled" não apareceria. O diff desta rodada não traz cláusula nova sem bloco.
- **Rodada:** `npx vitest run tools/processo/harness/npx-sem-instalar.test.ts` passou, 4 de 4, em 1,12 s.
- **Sem desligar nada:** não há `.skip`, `.only`, teste comentado nem mock.
- **Recomendações 2 e 3 da 1ª rodada:** estão na tabela "Recomendações sem aplicar", com destino.
  - A 2 (pedido atrasado do `npx` anterior na lista `pedidos`) foi recusada. O motivo é aceitável: a ordem dos testes é fixa, e o pedido atrasado não muda veredito hoje.
  - A 3 (o teste não prova que o Claude Code entrega o `env` ao Bash do subagente) foi para o `TODO.md` e para a validação. O limite está declarado no cabeçalho do teste.

Bloqueantes: nenhum.

Recomendações:
1. Melhoria pequena e opcional: o caso do cancelamento (linha 95) poderia também conferir que o ambiente filtrado não traz nenhuma variante da chave antes do `...env`, para documentar no próprio teste que o "false" vem só do settings. Hoje isso já vale pelo código das linhas 30-31 e 87.

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-26 16:09:58 · `tasks/correcoes/2026-10-26-npx-sem-instalar.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Correção de processo sem Tech Spec, e o documento está alinhado com o código.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

As duas recomendações que a Mesa mandou aplicar estão feitas:
- **Comentário do prazo:** está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/tools/processo/harness/npx-sem-instalar.test.ts:41-42`.
- **Remoção da chave `npm_config_yes`:** está nas linhas 29-31 e 87. A expressão `/^npm_config_yes$/i` tira a chave do ambiente copiado em qualquer caixa. O teste deixou de pôr `npm_config_yes: ''`, então o controle não depende mais dessa chave.

Bloqueantes:

1. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/tasks/correcoes/2026-10-26-npx-sem-instalar.md`, linhas 61, 62, 66 e 67, a seção "Recomendações sem aplicar" dá `TODO.md` como destino de quatro recomendações. Nenhuma delas está no `TODO.md`, que não aparece entre os arquivos alterados (`git status`). Conferi o item MN7 (`TODO.md:2193-2200`): ele não traz nenhuma das quatro.
   - Linha 61: o `env` vale só para a sessão do Claude Code; a esteira e a VM de produção não o recebem.
   - Linha 62: `.claude/skills/seguir/time.md:35` e `docs/skills-de-terceiros.md` ainda mandam rodar `npx skills update -p` sem `--yes`. O MN7 registra que o comando passa a pedir `--yes`, mas não aponta esses dois textos para corrigir.
   - Linha 66: a conferência do `npx cowsay` cancelado a cada atualização do Claude Code.
   - Linha 67: o pedido de `--no-install` em `.claude/agents/*.md` precisa ser alinhado com a nova barreira.

   A regra está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/.claude/skills/criar-tasks/task-template.md:168-169`: "Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e não promessa." Do jeito que está, as quatro recomendações se perdem no commit.

   Correção exigida: escreva as quatro linhas no `TODO.md`, cada uma com dono e origem (correção `2026-10-26-npx-sem-instalar`, revisor e rodada). Podem ficar junto ao MN7 ou na seção "Da X4". Outra saída é trocar o destino de alguma delas por recusa com motivo, se a Mesa decidir assim.

Recomendações:
- O comentário de documentação em `npx-sem-instalar.test.ts:29` passa de 150 colunas. Quebrá-lo em duas linhas o deixa no padrão do restante do cabeçalho.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-26 16:15:15 · `tasks/correcoes/2026-10-26-npx-sem-instalar.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. É uma correção de processo, sem seção da Tech Spec. A barreira em `.claude/settings.json` (`"env": { "npm_config_yes": "false" }`) é a que o MN7 e a M3 da retro da X4 pediram.

Portão local: carimbo válido. O `conferir` passou para o código atual: typecheck, lint, segredo, dependências, unidade e alvo.

Bloqueantes: nenhum.

As duas exigências da 2ª rodada foram cumpridas:

1. **As quatro recomendações agora estão no `TODO.md`.** Ficam logo depois do MN7, e cada uma tem dono e origem (a correção, o revisor e a rodada). As linhas 61, 62, 66 e 67 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/tasks/correcoes/2026-10-26-npx-sem-instalar.md` apontam para essas linhas. Conferi que os dois textos citados na linha 62 ainda mandam rodar `npx skills update -p` sem `--yes`, em `.claude/skills/seguir/time.md:35` e em `docs/skills-de-terceiros.md`, linhas 10 e 34. A pendência registrada é real. A linha 68, nova, recusa a recomendação do `test-engineer` (2ª) e dá o motivo.
2. **A recomendação da Mesa também foi aplicada.** O comentário da linha 29 do teste agora vem em bloco de várias linhas.

Recomendações:
- **Outra linha longa:** a linha 44 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-26-npx-sem-instalar/tools/processo/harness/npx-sem-instalar.test.ts` tem 152 colunas. É o comentário sobre o prazo de 60 s e 90 s, e passa do mesmo limite que valeu para a linha 29. Pode ser quebrada do mesmo jeito.
- **Item para quem fecha:** marcar o MN7 do `TODO.md` no fechamento. Já está registrado na linha 64 do documento da correção.

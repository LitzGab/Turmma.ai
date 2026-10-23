# Achados das revisões — `tasks/prd-harness/1_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 14:25:07 · `tasks/prd-harness/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

**O que conferi**
- A 1.1 não muda o que as expressões casam. Comparei cada uma com a anterior, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/estado.ts`:
  - `lerPorte`, `lerValidacao` e `specAprovada` geram as mesmas expressões, com o rótulo escapado e as mesmas flags.
  - As constantes de módulo não têm a flag `g`, então não há risco com `lastIndex`.
  - Em `revisoes.ts:362`, a troca de `exec(/...(.*)/)` por `split` dá a mesma linha, só que agora com o `\r` final em arquivo CRLF. Isso não afeta a busca dos nomes entre crases.
- A 1.2 cobre os cinco cenários da tabela "Testes que provam a regra":
  - rótulo tirado de cada modelo;
  - nome de revisor inventado;
  - os modelos de hoje, com contagem mínima;
  - contorno por caixa, por asterisco e por `#`;
  - modelo ausente.
- Os rótulos vêm das constantes importadas, como manda o §10, e a amostra quebrada é uma cópia em `mkdtempSync`.
- A 1.3 foi feita. A sonda do subagente rodou pela `mesa-de-revisao`, e não de dentro do `implementador`, porque o `implementador` não pode chamar subagente (`disallowedTools: Agent`). A premissa do §12 vale: o valor nunca vem vazio e está em `PAPEIS_DO_TIME`. Não há divergência a registrar.
- O código não invadiu a 2.0 (partir o `revisoes.ts`) nem a 11.0 (o hook nativo).

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.ts:362`: o rótulo dos subagentes é lido por `split`, enquanto o `estado.ts` usa `escaparTexto` com `RegExp`. São dois jeitos de fazer a mesma coisa. Vale unificar na 2.0, que já vai partir este arquivo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/estado.ts` (`VEREDITOS_DA_VALIDACAO`): a lista exportada pode ser alterada por quem a importa, e a expressão é montada a partir dela quando o módulo carrega. Vale `readonly VereditoDaValidacao[]` ou `as const`.
- Em `techspec.md` §12, a primeira premissa ainda diz "NÃO VERIFICADO". Falta registrar ali o achado da 1.3: no subagente, o valor da variável é o papel do terminal que o chamou, e não o nome do subagente. Assim, quem fizer a 11.0 lê o fato na spec e não só no `1_task.md`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/rotulos.test.ts:97`: `aposRotulo` copia à mão a leitura de `revisoresObrigatorios`. Se a 2.0 exportar essa leitura, o teste pode usá-la e deixa de ter uma segunda versão dela.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 14:26:07 · `tasks/prd-harness/1_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz.** Os quatro modelos de hoje passam, com uma contagem mínima de rótulos e de nomes de revisor achados.
- **Rótulo tirado.** Tirar um rótulo de cada um dos quatro modelos, numa cópia em pasta temporária, deixa a conferência vermelha e a falha diz o rótulo e o modelo.
- **Nome inventado.** Um nome de revisor inventado no `task-template.md` fica vermelho, tanto na linha dos subagentes quanto fora dela.
- **Contorno (o caso adversário).** Rótulo com outra caixa, sem os asteriscos ou fora do começo da linha fica vermelho.
- **Alvo ausente.** Modelo ausente, pasta sem nenhum modelo e bloco do formato do `/revisar-spec` sumido ficam vermelhos.
- **Bordas que o código lê por posição ou por valor.** Colunas da tabela de dependências trocadas, linha de tarefa fora do formato `N.0`, veredito tirado da linha da validação, `APROVADA` fora do bloco da spec e bloco `mutacao` que o `lerMutacoes` não lê.
- **Refatoração sem efeito.** A 1.1 não muda comportamento: `estado.test.ts` e `revisoes.test.ts` passam sem alteração.
- **Prova da premissa (1.3).** `CLAUDE_CODE_AGENT` não vem vazio no Bash do papel nem no do subagente.
- **Isolamento e permissão de escola.** Não se aplicam: é ferramenta de processo e não toca dado de escola.

**Cobertos** (cada linha da tabela do documento, com o teste que a prova, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/rotulos.test.ts`):
- **"Um rótulo tirado de cada um dos quatro modelos"** → `rótulo tirado do modelo: %s deixa a conferência vermelha, dizendo qual` (it.each sobre os 7 rótulos, que cobrem os 4 modelos). A asserção confere o rótulo e o modelo na falha.
- **"Nome de revisor inventado"** → `nome de revisor inventado na linha dos subagentes: vermelho` e `nome com cara de revisor citado fora da linha dos subagentes: vermelho`. O controle positivo é `nome de revisor que o hook conhece, na linha dos subagentes: verde`.
- **"Os modelos de hoje"** → `os modelos de hoje passam, e a conferência acha os rótulos e os nomes que espera`. Exige `falhas == []`, `rotulosAchados >= 7` (igual a `ROTULOS.length`) e `nomes >= 2`, então zero achados fica vermelho.
- **"Quem contorna é acusado"** → `quem contorna é acusado: %s` (outra caixa, sem asteriscos, `#` a menos) e `rótulo fora do começo da linha, onde o código o ancora: vermelho`.
- **"Modelo ausente"** → `modelo ausente: vermelho, dizendo qual` (os quatro) e `pasta sem nenhum modelo: vermelho nos quatro, e nenhum rótulo achado`.
- **Mutações contra o `git diff`.** Toda cláusula nova tem bloco:
  - em `estado.ts`: as constantes, `escaparTexto`, `ESCOPO_DE_TAREFA`, `VEREDITO_DA_VALIDACAO`, `VEREDITO_DA_SPEC_APROVADA`, o `split` com `m`, as posições das colunas e a chamada de `lerParalelismo`;
  - em `revisoes.ts`: `ROTULO_DOS_SUBAGENTES` e o `split(...)[0]`.

  Cada bloco aponta para um teste que alcança a cláusula. As mutações do `estado.test.ts` caem nos casos de `lerValidacao e specAprovada` (linhas 194–229) e de `lerParalelismo` (141, 507). As linhas apagadas dos modelos também têm bloco.
- **Equivalência das expressões.** O `split(ROTULO)[1]?.split('\n')[0]` lê o mesmo que o antigo `(.*)`, já que o `.` não casa `\n`. A expressão do `lerPorte`, montada com `escaparTexto`, é a mesma do literal antigo.
- **Execução.** `npx vitest run --project unidade` sobre `rotulos.test.ts`, `estado.test.ts` e `revisoes.test.ts`: 3 arquivos, 162 testes verdes. Não há `.skip`, mock de coisa nossa nem provedor de IA. Nenhum modelo em `.claude/skills/` foi alterado.
- **Prova da premissa.** Registrada com as duas saídas, nenhuma vazia: `implementador` no papel e `mesa-de-revisao` no subagente. Isso basta para a guarda `[ -n "$CLAUDE_CODE_AGENT" ]` da 11.0.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **`rotulos.test.ts:230`.** No teste `quem contorna é acusado`, a asserção confere só o rótulo, não o modelo. `ROTULO_DO_VEREDITO` aparece em dois modelos (validação e spec). Exigir também `MODELOS[rotulo.modelo]` na falha, como já faz a linha 216.
2. **Caixa do `**Escopo:**`.** `ESCOPO_DE_TAREFA` (`estado.ts`) usa a flag `i`, então o código aceita `**escopo:**` em minúsculas. O caso "outra caixa" acusa isso como falha, sendo mais estrito que o código. Não deixa passar nada errado, mas vale uma linha de comentário dizendo que é de propósito.
3. **Mutação do `escaparTexto`.** Fica vermelha porque a expressão inválida estoura no carregamento do módulo, e não por uma leitura errada. É o efeito real de tirar o escape, mas não mostra o escape decidindo o que casa. Um rótulo com `.` ou `(` provaria isso, se algum dia entrar.
4. **Mutação na chamada de `lerDependencias`.** A chamada `COLUNAS_DE_DEPENDENCIAS.dependeDe.posicao` não tem mutação própria; só a do `lerParalelismo` tem. O `estado.test.ts` cobre, então um bloco simétrico é cobertura extra.
5. **Prova da premissa.**
   - **Procedimento trocado.** O procedimento saiu do que a 1.3 descreve: a sonda do subagente foi pela Mesa (`claude -p --agent mesa-de-revisao`), e não "dentro" da sessão do Implementador, que não pode chamar subagente. A troca está explicada no texto, mas deveria entrar na tabela "Divergências resolvidas", hoje vazia.
   - **Achado para a 11.0.** O subagente herda o papel de quem o chamou, e não o próprio nome. Vale levar isso para a Tech Spec §12, para a 11.0 não supor `CLAUDE_CODE_AGENT=revisor-geral`.
   - **Arquiteto.** "Herda o papel do Arquiteto" é extrapolação: só a Mesa foi sondada.
6. **Contagem de nomes de revisor.** `MINIMO_DE_NOMES_DE_REVISOR = 2` depende hoje do comentário `<!-- test-engineer e revisor-geral ... -->` do modelo. Quem tirar o comentário recebe um vermelho sem relação com rótulo. Vale dizer isso na mensagem da falha ou no comentário da constante.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/1_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/rotulos.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/estado.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 14:32:40 · `tasks/prd-harness/1_task.md`

VEREDITO: APROVADO

**O que audito:** a rodada nova, só sobre o diff `9e751ea` → `afdaaef`. Não havia correção exigida. O diff traz as seis recomendações aplicadas, e conferi o que cada uma afeta.

**Cenários exigidos:** os da 1ª rodada, que já estavam todos cobertos. Este diff não traz cenário novo.

**Cobertos:**
- **Mutação nova** no bloco de `tasks/prd-harness/1_task.md:187-192`. Ela troca `dependeDe` por `paralelo` em `lerDependencias`, na linha 131 de `tools/processo/estado.ts`. Fecha o lado que faltava do par: o bloco das linhas 194-199 já cobria a troca inversa em `lerParalelismo`, na linha 139. O texto `-` do bloco é igual à linha 131 de hoje. O portão da tarefa prova que ela fica vermelha.
- **`readonly` em `VEREDITOS_DA_VALIDACAO`** (linha 76 de `tools/processo/estado.ts`). Só muda o tipo, e o bloco de mutação das linhas 141-142 do documento foi atualizado para o texto novo. Sem isso, o portão não acharia a linha a mutar.
- **Asserção mais forte** em `tools/processo/harness/rotulos.test.ts:218` e `:234`. Antes o teste conferia só o rótulo na mensagem de falha. Agora confere também o caminho do modelo (`MODELOS[rotulo.modelo]`), e um rótulo acusado no modelo errado deixa de passar. A asserção ficou mais estrita, sem afrouxar nada.
- **Comentários novos** em `rotulos.test.ts:55-56` e `:221-222`. São só texto, sem mudança de comportamento.
- **Prova da premissa** no documento (linhas 57-60 e a linha nova da tabela de divergências). O texto agora diz que só a Mesa foi sondada e que o subagente do Arquiteto não foi medido. É texto de documento, sem teste a exigir, e ficou mais honesto que o anterior.
- **Testes:** `npx vitest run tools/processo/harness/rotulos.test.ts tools/processo/estado.test.ts` passou, 77 de 77, sem `.skip` e sem mock.

**Bloqueantes:** nenhum.

**Recomendações:**
- A premissa de que o subagente herda o papel do terminal ainda vale só para a Mesa (linhas 57-60 do documento). Antes da 11.0, a Tech Spec (§12) precisa registrar isso, ou a sonda precisa ser repetida com o Arquiteto. Assim o hook nativo não nasce supondo uma coisa que ninguém mediu. O documento já entrega isso ao Orquestrador, e fica registrado para o `/validar`.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/1_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/estado.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/rotulos.test.ts

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 14:32:50 · `tasks/prd-harness/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Esta rodada só aplicou as recomendações, e nenhuma delas muda o comportamento do código:

- **`tools/processo/estado.ts:76`**: `VEREDITOS_DA_VALIDACAO` passou a ser `readonly`. A mutação correspondente em `1_task.md` foi atualizada para o novo texto.
- **Nova mutação `dependeDe.posicao` → `paralelo.posicao`** (`estado.ts:131`, teste em `estado.test.ts`): faz o teste provar que a função lê a coluna certa da tabela de dependências. O carimbo vale para a árvore atual.
- **`tools/processo/harness/rotulos.test.ts:234`**: a asserção "quem contorna é acusado" agora exige que a falha cite também o caminho do modelo (`MODELOS[rotulo.modelo]`). Antes, um rótulo com o mesmo texto em outro modelo também fazia o teste passar. As duas linhas de comentário novas dizem por que o teste é mais estrito que a flag `i` do código e de onde vêm os dois nomes de revisor. Isso não está no código, então não são comentário do óbvio.
- **`tasks/prd-harness/1_task.md`, "Prova da premissa" e "Divergências resolvidas"**: a conclusão ficou mais honesta. Só a Mesa foi sondada, e a 11.0 não deve supor `CLAUDE_CODE_AGENT=revisor-geral`. Isso não diverge da `techspec.md` §12: lá só se exige que a variável chegue ao Bash do papel e do subagente, e o hook pergunta se o valor está em `PAPEIS_DO_TIME`. Como a sonda foi feita é detalhe de medição, não de arquitetura. Atualizar o §12 é do Arquiteto, e a tarefa registrou esse destino.

Recomendações:
- Antes de abrir a 11.0, o Orquestrador precisa de fato levar ao Arquiteto a atualização do `techspec.md` §12, primeira premissa. Ela deve deixar de dizer "NÃO VERIFICADO" e registrar que, no subagente, o valor da variável é o papel do terminal que o chamou. Hoje isso só está escrito em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/1_task.md`.
- Quando a 11.0 for desenhada, vale sondar o subagente chamado pelo Arquiteto, que não foi medido.

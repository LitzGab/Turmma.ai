# Achados das revisões — `tasks/prd-harness/17_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-24 00:32:38 · `tasks/prd-harness/17_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A diferença só muda as skills e papéis do processo (`/seguir`, `retro`, `validar`, `validador.md`), os documentos da spec `harness` e um teste em `tools/processo/harness/`. Nada em `apps/`, `packages/` nem `e2e/`. Todos com autor humano: não se aplica, porque nenhum caminho de escrita em Nota foi criado ou alterado.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhum fluxo de saída de IA foi tocado. A exceção do tutor (D47) não aparece em outro agente.
Supervisão do tutor: ok, porque não foi tocada.
Autonomia declarada e visível: sim, sem mudança. Governança e autonomia dos agentes estão fora da diferença.

**O que olhei pela regra 70.** O ponto sensível é a 17.3: algumas paradas viram aviso.
- **Ressalva menor da validação.** `.claude/agents/validador.md` §6 diz que achado das regras 10, 20 e 70 nunca é menor. Pelo `.claude/skills/seguir/passos/7-paradas.md` (itens 3 e "Quatro avisos"), o Orquestrador só escreve o aceite sozinho quando todas as ressalvas são menores e nenhuma toca as regras 10, 20 ou 70. Qualquer maior ou crítico continua sendo parada para o Joaquim. `.claude/skills/validar/SKILL.md` diz o mesmo.
- **Proposta da retrospectiva.** Em `.claude/skills/retro/SKILL.md` §5, continua precisando de confirmação, arquivo por arquivo, o que mexe em:
  - regra, decisão ou código de processo;
  - a lista "O que verificar" dos quatro guardiões com veto (`conformidade-reviewer` incluído);
  - `criar-tasks`, `revisar-tarefa` ou `revisar-spec`.

  O aviso crítico "Regra 10, 20 e 70 não são afrouxadas por retrospectiva" continua, com a frase nova de que proposta que afrouxa essas regras não existe. Na dúvida sobre o grupo, vale confirmação.
- **Fiel à decisão.** O texto segue a D79 revista em 23/10/2026 (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/decisoes.md:1395-1400`), sem ir além dela.
- **Nada da regra 70 se perdeu na divisão do `SKILL.md`.** O pouso só com a palavra do Joaquim e o ditado dos guardiões no `PEDIDO` foram para `passos/8-validacao-e-pouso.md` e `passos/10-avulsos.md`.
- **Teste.** `tools/processo/harness/seguir.test.ts` confere o texto das paradas, incluindo "nunca é menor" no validador e "regras 10, 20 ou 70" no passo 7. Rodei: 80 de 80 passaram.

Bloqueantes: nenhum

Recomendações:
1. **O aviso cobre mais do que deveria.** Hoje pode ser aplicada sem confirmação, depois de 30 minutos sem objeção, uma proposta da retro que mexe em:
   - partes do papel de um guardião com veto fora do "O que verificar" (por exemplo, a seção de severidade);
   - `.claude/agents/mesa-de-revisao.md`, que junta os vetos;
   - a §6 do `validador.md`, onde mora a frase "nunca é menor".

   O que segura isso é só o aviso crítico da retro, ou seja, disciplina. O RF21 tranca o "O que verificar" e o formato dos guardiões, mas não esses outros trechos. Sugiro levar ao `/retro` ou a uma revisão da D79 que o grupo de confirmação inclua o arquivo inteiro de cada guardião com veto, o `mesa-de-revisao.md` e a §6 do `validador.md`. Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/retro/SKILL.md` (§5) e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/passos/7-paradas.md` (item 4).
2. **O teste confere pouco no passo 7.** O requisito "o passo 7 diz que achado das regras 10, 20 e 70 nunca é menor" (`tools/processo/harness/seguir.test.ts:115-118`) só procura o trecho `regras 10, 20 ou 70`. Esse trecho continuaria lá mesmo que "que nunca é menor" fosse apagado. Sugiro procurar a frase inteira `(que nunca é menor)`.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-24 00:33:13 · `tasks/prd-harness/17_task.md`

VEREDITO: REPROVADO

**Cenários exigidos** (a tabela da 17.0, mais a subtarefa 17.3):
- RF26: os três arquivos acima de 24.000 B, e um de cada vez ausente.
- RF26: o `6-tarefa.md` mandando ler o passo 3, o passo 9 ou o `time.md`; citar o passo 7, o 8 ou o 10 passa.
- RF26: o `6-tarefa.md` sem cada um destes, um de cada vez: o comando da limpeza, a abertura de linha, o `recruit --replace` e o `VERIFICAÇÃO RECUSADA`.
- RF26: um passo que o índice não cita, e o repositório de hoje abaixo do teto.
- RF22: o `SKILL.md` com 500 linhas, e um passo citado que não existe.
- 17.3: as paradas que viram aviso no passo 7, na `retro` e no `validador.md`, inclusive a exceção (a lista de um guardião com veto e as skills `criar-tasks`, `revisar-tarefa`, `revisar-spec`), e o achado das regras 10, 20 e 70, que nunca é menor.
- 17.4: o censo no passo 8.
- 17.5: os commits `Fora do processo:` no `validar`.
- Isolamento, concorrência e IA não se aplicam: a tarefa só mexe em texto do processo.

**Cobertos:** cada linha da tabela tem o seu caso em `tools/processo/harness/seguir.test.ts`:
- `os três acima de 24.000 B` (24.000 passa, 24.001 é vermelho) e `a conta é de bytes, e o acento pesa dois`
- `um dos três ausente` (it.each, um caso por arquivo)
- `mandar ler %s` (um caso por termo, mais as variantes `passos/3-` e `passos/9-`), mais o plural e o `passo 30`/`passo 39`
- `citar o %s passa` (passo 7, 8 e 10)
- `sem %s: vermelho` (as quatro ausências)
- `o índice sem o passo %s` e `um passo novo que o índice não cita`
- `um passo citado que não existe`
- `o SKILL.md com 500 linhas: vermelho, e com 499 passa` e `um passo com 500 linhas`
- os casos do repositório de hoje: 23.891 B, abaixo do teto

O teste rodou com 80 de 80 verdes. Não há `.skip`, mock nem provedor. As 26 mutações declaradas batem com o texto do arquivo, e cada uma cai num caso cuja asserção pega a cláusula.

**Bloqueantes:**

1. **A exceção do guardião com veto na `retro` não tem teste.**
   - O que está errado: a 17.3 exige a exceção também na `retro/SKILL.md`, e o texto está lá: "a lista "O que verificar" de um guardião com veto (`tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `llm-integrator`)", em `.claude/skills/retro/SKILL.md:96-98`. Mas a `REQUISITOS_DO_TEXTO`, em `tools/processo/harness/seguir.test.ts:120-133`, só confere a frase na retro para `criar-tasks`, `revisar-tarefa`, `revisar-spec`. Se essa frase sair da retro, o teste continua verde, e a proposta que afrouxa a lista de um guardião passaria a ser aplicada como aviso, sem confirmação. É justamente o que guarda as regras 10, 20 e 70.
   - Correção: acrescentar na `REQUISITOS_DO_TEXTO` uma entrada para `skills/retro/SKILL.md`, com o termo `de um guardião com veto`. O `it.each` `sem o texto, vermelho` passa a prová-la.

2. **Duas cláusulas novas não têm bloco de mutação e não estão no "Sem bloco, de propósito".**
   - O que está errado: são as duas guardas de arquivo ausente:
     - `if (texto === undefined) return [\`${TAREFA} ausente\`]`, em `tools/processo/harness/seguir.test.ts:223`
     - `if (texto === undefined) return [\`${SKILL} ausente\`]`, em `tools/processo/harness/seguir.test.ts:232`

     Os casos que as cobrem existem (`pasta de passos ausente`, linha 353, e `SKILL.md ausente: vermelho`, linha 443). Mas a seção "Mutações" de `tasks/prd-harness/17_task.md` não as declara nem as justifica.
   - Correção: um bloco para cada uma, trocando a linha por `if (texto === undefined) return []`. Não vale apagar a linha: no `indice` o vermelho viria de um `TypeError` no `matchAll`, que é vermelho pelo motivo errado. O bloco da 223 aponta o caso `pasta de passos ausente`, e o da 232 aponta `SKILL.md ausente: vermelho`.

**Recomendações:**
- O passo 7 manda levar o menor ao `TODO.md` "no fechamento" (`.claude/skills/seguir/passos/7-paradas.md:35-36`). Mas o fechamento mora no `passos/8-validacao-e-pouso.md`, que não cita o `TODO.md`, e quem fecha só lê o passo 8. Vale acrescentar ali uma linha, com um requisito de texto no teste.
- Em `.claude/skills/seguir/SKILL.md:97`, a fase `validacao-com-ressalvas` continua escrita como "parada (passo 7)". Com a D79 revista, o certo é "parada ou aviso (passo 7)", porque a ressalva toda menor o Orquestrador aceita sozinho.
- Na 17.2, a parte "sem o que repete o protocolo" não tem checagem. O orçamento de bytes só a segura de modo indireto. Basta registrar o limite no cabeçalho do teste.
- A `PROIBIDOS_NO_PASSO_6` usa um espaço literal (`/\bpassos? 3\b/`). Um "passo\n3", quebrado em duas linhas para caber em 120 colunas, escapa da checagem. Usar `\s+`, como o `padrao` já faz.
- Os 109 B de folga no orçamento (23.891 de 24.000) somem na primeira linha nova do passo 6 ou do protocolo. Vale avisar no `techspec.md` §9 que o próximo acréscimo precisa tirar texto de outro lugar.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/seguir.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/17_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/retro/SKILL.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/passos/7-paradas.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/passos/8-validacao-e-pouso.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/SKILL.md

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-24 00:33:49 · `tasks/prd-harness/17_task.md`

VEREDITO: REPROVADO

Escopo: respeitado
Aderência à Tech Spec: ok. As quatro divergências estão registradas no `17_task.md`, na `techspec.md` §9, no `cenarios.md` C (RF22, RF26) e no `texto.md`. Os três arquivos lidos por tarefa somam 23.891 B, abaixo do teto de 24.000. Os passos foram levados para `passos/` com o texto igual ao original. O código 5 e o `--censo` existem em `linhas.ts` e `esteira.ts`.
Portão local: carimbo válido

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/retro/SKILL.md:95-96`: a lista dos guardiões com veto que continuam pedindo confirmação está errada. Ela traz `llm-integrator`, que não tem veto (`REVISORES_SEM_VETO` em `tools/processo/documento-de-revisao.ts:18`), e deixa de fora o `infra-guardian`, que tem veto (`REVISORES_COM_VETO` na linha 17, "Veto." no frontmatter do papel e "(veto)" em `criar-tasks/SKILL.md:79`). Do jeito que está, uma proposta da retro que mexa no "O que verificar" do `infra-guardian` muda só um papel, cai no grupo **Aviso** e é aplicada 30 minutos depois sem o Joaquim confirmar. Isso contraria a D79 revista: "a lista de um guardião com veto ... continua parada". Correção exigida: trocar `llm-integrator` por `infra-guardian`, ou citar a fonte (`REVISORES_COM_VETO`) em vez de enumerar os nomes. Também é preciso dizer se `test-engineer` e `revisor-geral` entram, porque o código os lista com veto.

2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/agents/validador.md:133-136`: as duas regras do papel se contradizem. A linha 133 diz que commit com código sem `(tarefa N.0)` nem `(correção <slug>)` é **achado maior**. Um commit `Fora do processo:` não leva marca, então por essa linha é maior. O item novo, na linha 136, diz que ele "não é achado por si só". A escolha decide o veredito: um maior dá APROVADA COM RESSALVAS e abre a parada do passo 7. Sem ele, o veredito é APROVADA e o commit só vai para a seção 6. A Tech Spec §9 manda esses commits para a seção 6, então a intenção é que não sejam achado, mas o Validador tem as duas leituras à mão. Correção exigida: excluir da linha 133 os commits com a linha `Fora do processo: <motivo>`, por exemplo "...sem `(tarefa N.0)` nem `(correção <slug>)`, salvo os de `Fora do processo:` (abaixo), é achado maior".

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/retro/SKILL.md:90`: a definição de **Aviso** ("muda só skill ... ou papel") também abrange as três skills da marcação e os papéis dos guardiões. Hoje a separação depende do "todo o resto" e do "na dúvida, é confirmação". Vale escrever no próprio item "salvo os do grupo seguinte".
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/vigia/SKILL.md:30` ainda aponta "o passo 3 de `.claude/skills/seguir/SKILL.md`". O índice resolve o caminho, mas o apontamento direto para `passos/3-time-e-andar.md` evita uma leitura a mais.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/passos/6-tarefa.md:25-27`: o aviso "só nas linhas 2 e 3, na primeira vez" está só no primeiro `recruit`. O `recruit` da Mesa e o `connect` também precisam dele.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/passos/4-documentos.md`: a tabela tem só "ressalva aceita pelo Joaquim". Falta uma linha para o aceite do Orquestrador pelo aviso da D79.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/SKILL.md`: falta a linha em branco antes de `## Os passos, e quando entrar em cada um`.
- O `seguir.test.ts` confere que existe a frase sobre as skills da marcação, mas não confere a lista dos guardiões com veto contra `REVISORES_COM_VETO`. Por isso o bloqueante 1 passou. Isso fica com o `test-engineer`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 00:47:41 · `tasks/prd-harness/17_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

As duas correções da 1ª rodada foram feitas:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/retro/SKILL.md:95-98`: a lista dos guardiões com veto agora cita a fonte (`REVISORES_COM_VETO`, em `tools/processo/documento-de-revisao.ts`). Ela traz os mesmos seis nomes do código, com `infra-guardian`, `test-engineer` e `revisor-geral`, e não traz mais o `llm-integrator`. Para a lista não se perder de novo, o `revisoresDaRetro`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/seguir.test.ts`, confere a seção 5 contra as duas constantes, nos dois sentidos: falta um com veto, ou aparece um sem veto. A importação de `../revisoes.ts` está certa, porque esse arquivo reexporta o `documento-de-revisao.ts`.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/agents/validador.md:133-134`: a regra do achado maior agora tira os commits `Fora do processo:`. Ela não contradiz mais o item seguinte, e há um requisito de texto no teste que a segura.

O resto do diff está coerente com a Tech Spec (`techspec.md` §9, linhas 286-288) e com o `passos/7-paradas.md:35-37`:
- O "parada ou aviso" do `SKILL.md`.
- O commit de aceite das ressalvas menores, no passo 4.
- Os menores que vão ao `TODO.md` no fechamento, no passo 8.
- A medida de bytes corrigida: 23.932 B somados, igual ao `wc -c`.

As recomendações que ficaram sem aplicar têm destino na tabela da tarefa.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/retro/SKILL.md:91`: "salvo os do grupo seguinte" fala das propostas, que são femininas: o certo é "salvo as do grupo seguinte". A troca precisa ir junto ao termo exigido em `seguir.test.ts`. A linha também passa de 120 colunas, e o próprio teste usa esse limite como referência.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/retro/SKILL.md:95-98`: a lista agora existe em dois lugares, o nome da constante e os seis nomes escritos à mão. O teste segura a divergência, então não bloqueia, mas citar só a constante bastaria.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-24 00:47:43 · `tasks/prd-harness/17_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff mexe só em texto do processo (skills, papéis, documentos da spec) e no teste `seguir.test.ts`. Não toca schema, repository, job, seed, importação nem webhook. Todos com autor humano? Não se aplica: nenhum caminho foi criado nem alterado.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. Nenhum fluxo de saída de IA foi tocado.
Supervisão do tutor: ok. O tutor não foi tocado.
Autonomia declarada e visível: sim. Nada mudou na governança dos agentes.
Bloqueantes: nenhum.

**O que mudou e afeta a regra 70**

- **Lista dos guardiões com veto na `retro`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/retro/SKILL.md:95-98`).
  - A lista agora bate com `REVISORES_COM_VETO` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/documento-de-revisao.ts:17`. O `infra-guardian` entrou, o `llm-integrator` (sem veto) saiu, e entraram `test-engineer` e `revisor-geral`.
  - A lista "O que verificar" do `conformidade-reviewer` segue no grupo de confirmação. Mudá-la por aviso de 30 minutos não é possível.
  - O teste `revisoresDaRetro` prova isso nos dois sentidos: falta um guardião com veto, ou sobra um que não tem veto. Ele também confere que a lista está na seção 5 e que a seção existe. Rodei a suíte: 101 testes passam.
- **"salvo os do grupo seguinte" no grupo de aviso** (`retro/SKILL.md:91`). Fecha a sobreposição que existia: o papel `conformidade-reviewer.md` e as skills que decidem a marcação de guardião estão em `.claude/agents/` e `.claude/skills/`, e por isso cabiam também no aviso. Agora a confirmação vence. O requisito do texto tem teste.
- **Passos 7 e 8.** Achado das regras 10, 20 ou 70 continua "nunca é menor" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/passos/7-paradas.md:7` e `:37`). Por isso, levar os menores ao `TODO.md` no fechamento e aceitá-los pelo aviso da D79 não alcança a regra 70.
- **Exceção de `Fora do processo:` no validador** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/agents/validador.md:133-134`). A mudança só desfaz uma contradição que já estava no texto: esses commits já eram listados na seção 6, e o validador lê o que mudou neles antes de dar o RF por atendido. Uma violação da regra 70 num commit desses continua classificada como CRÍTICO pela seção 6 do validador. A exceção não abre caminho para código de nota, tutor ou saída de IA passar sem que alguém o leia contra a regra.

**Correções exigidas:** nenhuma na 1ª rodada. Das duas recomendações, a do passo 7 ("(que nunca é menor)") está aplicada. A outra está registrada na tabela do `17_task.md` com destino `TODO.md`.

Recomendações:
1. A recomendação da 1ª rodada que deve ir ao `TODO.md` ainda não está nele. É a de ampliar o grupo de confirmação ao arquivo inteiro de cada guardião, ao `mesa-de-revisao.md` e à seção 6 do `validador.md`. Hoje o `TODO.md` não foi modificado e não tem a linha. Ela precisa entrar até o fechamento, para não ficar sem destino.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/seguir/passos/7-paradas.md:32` descreve o aviso da retro como "a proposta que só muda skill, papel ou modelo de documento", sem a ressalva "salvo os do grupo seguinte". Quem lê só o passo 7 pode concluir que mudar o `conformidade-reviewer.md` é aviso. A retro manda, mas vale repetir a ressalva ali, ou apontar para a seção 5 da retro.
3. Em `validador.md:136`, o texto poderia dizer explicitamente que um commit `Fora do processo:` que toca nota, correção, tutor ou saída de IA é lido contra a regra 70. Hoje isso só se deduz da classificação da seção 6.

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 00:47:44 · `tasks/prd-harness/17_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** as duas correções da 1ª rodada, e as cláusulas novas do diff `8546f5f..97831bf`. As cláusulas novas são:
- a função `revisoresDaRetro`;
- a troca de `\s+` nas duas expressões do passo 3 e do passo 9;
- os seis requisitos novos de texto (retro, validador, `SKILL.md`, passo 4, passo 8);
- o termo do passo 7 trocado para `(que nunca é menor)`.

**Cobertos:**
1. **Correção 1 feita.** A `REQUISITOS_DO_TEXTO` ganhou `a retro mantém a confirmação para a lista de um guardião com veto`, em `tools/processo/harness/seguir.test.ts:131-135`, com o termo `a lista "O que verificar" de um guardião com veto`. O texto está em `.claude/skills/retro/SKILL.md:95`. O `it.each` `sem o texto, vermelho` (linha 567) prova o requisito. Também entrou `salvo os do grupo seguinte` (linha 136), que está na linha 91 da retro.
2. **Correção 2 feita.** Há um bloco para cada cláusula no `tasks/prd-harness/17_task.md`, os dois trocando a linha por `if (texto === undefined) return []`, como foi pedido, sem apagar a linha:
   - O bloco da `seguir.test.ts:255` cita o caso `pasta de passos ausente`. A asserção da linha 402 compara com `toEqual([`${TAREFA} ausente`])`, então a mutação fica vermelha.
   - O bloco da `seguir.test.ts:264` cita o caso `SKILL.md ausente: vermelho`. A asserção da linha 497 também compara com `toEqual`, e a mutação fica vermelha.
   - O texto das duas linhas aparece uma vez só no arquivo, então cada bloco acerta a sua.
3. **`revisoresDaRetro` (linhas 337-347).** Há um bloco para cada uma das quatro cláusulas, e cada cenário chega à sua:
   - Seção 5 ausente: o caso `a retro sem a seção 5` troca `## 5. Aplicar`, que existe na retro (linha 86).
   - Filtro `faltam`: os seis casos `a retro sem %s na lista`, um por revisor com veto.
   - Filtro `sobram`: os três casos `que não tem veto`, um por revisor sem veto.
   - Expressão presa à seção 5: o caso `a lista fora da seção 5 não vale`. Se a expressão começasse em `## 1.`, a seção 1 entraria na busca e o nome posto lá contaria como listado, então a mutação fica vermelha.
   - O caso que repete a lista errada de antes (`llm-integrator` no lugar de `infra-guardian`) fica vermelho nos dois sentidos.
   - As listas vêm do código, de `REVISORES_COM_VETO` e `REVISORES_SEM_VETO` (`tools/processo/documento-de-revisao.ts:17-18`, com os seis com veto e os três sem). A retro cita esse mesmo arquivo.
4. **`\s+` no passo 3 e no passo 9.**
   - Os dois blocos novos citam `quebrado em duas linhas`. A amostra da linha 423 quebra a linha entre `passo` e o número, então a expressão com espaço simples não casa e o caso fica vermelho.
   - Os blocos que já existiam (`no plural também`, `o passo 30 e o passo 39`, `mandar ler o passo 9`) foram reescritos sobre a expressão nova.
5. **O `...revisoresDaRetro(arquivos)` dentro de `todas` está em "Sem bloco, de propósito"**, com o motivo: o agregador só soma, e a checagem tem o seu próprio grupo de testes.
6. O teste roda verde: `npx vitest run tools/processo/harness/seguir.test.ts` deu 101 de 101. Não há `.skip`, mock nem provedor.

**Bloqueantes:** nenhum.

**Recomendações:**
- O teste importa as listas de `../revisoes.ts`, enquanto a retro aponta `tools/processo/documento-de-revisao.ts`, onde as constantes estão de fato. O reexport funciona. Mesmo assim, importar direto de `documento-de-revisao.ts` deixaria o teste e o texto apontando para o mesmo arquivo.
- O orçamento dos três arquivos fica com 68 B de folga, como a techspec já registra. A próxima tarefa que tocar o `SKILL.md`, o `protocolo.md` ou o `passos/6-tarefa.md` vai bater no teto. Vale levar isso para o `/retro`, para quem escreve a tarefa saber antes.

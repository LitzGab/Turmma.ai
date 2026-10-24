# Achados das revisões — `tasks/prd-harness/19_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-24 01:50:48 · `tasks/prd-harness/19_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A tarefa só mexe no processo de trabalho: skills, papéis do time, um teste de metadados e documentos de processo. Não há migration, repository, endpoint, DTO, log, storage, exportação nem envio para IA.

Fora da tabela de dados do docs/lgpd.md: nenhum, porque nenhum campo novo foi criado.

Autorização por objeto: ok. Nenhuma rota foi criada ou alterada.

Logs: limpos. Os testes novos só escrevem textos inventados (`name: <skill>`, `Conflito neste repositório: o texto de <nome>.`) em pastas temporárias. Nenhum nome, matrícula, nota ou conversa.

Auditoria: presente onde a regra exige. A tarefa não cria nenhuma ação que precise de auditoria (leitura de aluno, exportação, nota, permissão ou aprovação de saída de IA).

Envio externo: nenhum.

Seed/fixture: sintético. Os testes `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/metadados.test.ts` e `revisores.test.ts` usam só o próprio repositório e amostras de configuração inventadas. Rodei os dois: 123 testes passaram.

O que conferi do ponto de vista da regra 20:
- **A linha `**/agentes/**` que saiu da regra 30** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/30-camada-ia.md`) não muda onde a regra 30 carrega: procurei e não existe nenhuma pasta `agentes` no repositório (fora `node_modules` e `.git`). O código de IA continua coberto por `apps/*/src/ia/**`, `packages/*/src/ia/**`, `**/prompts/**` e `**/tutor/**`.
- **A skill `lgpd-brasil`** agora traz na primeira linha que `docs/lgpd.md` e a regra 20 são mais restritivos. Isso reforça a hierarquia, não a enfraquece.
- **O `privacy-guardian` e as regras 10, 20 e 70 não mudaram.** A única mudança em papel de revisão foi pôr entre aspas a `description` do `test-engineer`, sem mudar o texto.
- **As duas skills que saíram não protegiam dado nenhum.** A `status` só lia o estado do processo, e a `frontend-design` só dava direção visual.
- **A pergunta de fechamento** não se aplica: a tarefa não muda o que o sistema guarda sobre um aluno nem para onde isso vai.

Bloqueantes: nenhum.

Recomendações:
- A linha de conflito da `lgpd-brasil` (em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/lgpd-brasil/SKILL.md:5` e em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/skills-de-terceiros.md`) dá como exemplo só "sem e-mail, sem CPF, sem foto". Vale completar com o resto da regra 20, item 2 (telefone, endereço, nascimento, diagnóstico) e com "adaptação, nunca diagnóstico" (D35), para a skill não sugerir que a lista é só essa. O teste exige que os dois textos sejam iguais, então a mudança precisa ser feita nos dois lugares juntos.
- Na auditoria das skills em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/processo-licoes.md` (seção 2), a `lgpd-brasil` já aparece como desatualizada em relação ao ECA Digital. Vale registrar no `TODO.md` quem revisa a skill quando o `npx skills update` trouxer versão nova.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-24 01:51:24 · `tasks/prd-harness/19_task.md`

VEREDITO: REPROVADO

Cenários exigidos: cada item da tabela "Testes que provam a regra" da 19.0 e das linhas RF23, RF24 (papel sem critério, `status` citada) e RF30 da seção C do `cenarios.md`, incluindo o que a própria tarefa acrescentou à linha RF30: "frontmatter que não é YAML" e "`node_modules` e `.git` não contam". Esta tarefa mexe só no harness: não toca dado de escola nem IA, e não tem operação concorrente, então isolamento, adaptador falso e corrida não se aplicam.

Cobertos (rodei `npx vitest run --project unidade` sobre `metadados.test.ts` e `revisores.test.ts`: 123 de 123 verdes):
- **RF23, sem a linha ou com texto diferente:** "skill da lista sem a linha" (um caso por skill, e confere que o arquivo não foi reescrito), "texto diferente do documento", "o documento que muda de texto".
- **RF23, `frontend-design`:** "a frontend-design no skills-lock.json" (cobre também a pasta e o lock ausente ou quebrado).
- **RF23, as cinco verdes:** "as cinco de hoje têm a linha", com contagem.
- **Quem contorna:** "quem contorna é acusado" (segunda linha, e linha em branco antes) e "a linha de conflito dentro do frontmatter".
- **RF24, critério de saída:** "papel do time sem a seção" (um por papel), "seção sem Terminou quando ou sem Entrega", "item sem texto", "o item que está na seção seguinte"; "os de hoje têm a seção".
- **RF24, `status`:** "a pasta da skill ainda existe", "citada entre crases, como comando ou como pasta" (uma forma por caso), "citada em cada lugar", "o que não é a skill não é acusado", e no repositório, "lendo ao menos 40 arquivos". Rodei um grep à mão em `.claude`, `CLAUDE.md` e `tools/processo`: sobra só uso de campo de API dentro de skill de terceiro, que a divergência aceita.
- **RF30, skill sem `name` / sem `description`:** um caso cada, cada um afirmando que o outro não apareceu.
- **RF30, papel sem `model` / sem `tools`:** "papel sem name, sem model ou sem tools", um caso cada, mais "os quatro papéis do time herdam".
- **RF30, frontmatter que não é YAML:** coberto na skill pela forma `name: [procedimento`, dentro de "frontmatter ausente, que não fecha...".
- **RF30, `paths:` que não casa:** "padrão que não casa com nada" e "padrão que só casaria dentro de node_modules".
- **RF30, comando de hook:** "comando que aponta arquivo que não existe", "dois caminhos no mesmo comando", "em todo evento e em todo grupo".
- **RF30, o repositório de hoje:** verde com mínimos afirmados: skills ≥20, papéis ≥12, padrões ≥20, hooks ≥3.
- **`revisores.test.ts`:** a leitura só da seção 1 tem dois casos novos ("a seção 1 conta inteira", "a auditoria das skills (seção 2) não conta como lição").
- **Mutações:** os blocos alcançam cada cláusula do `metadados.test.ts` e do `soAsLicoes`. Os textos de papel e de skill não têm cláusula: a prova deles é o teste verde no repositório de hoje.
- **Sem `.skip`, sem teste comentado, sem mock:** tudo roda sobre o repositório ou sobre amostra em `mkdtempSync`.

Bloqueantes:
1. **O `.git` da linha RF30 não tem teste.**
   - **Onde:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/cenarios.md:144` (linha RF30). A tarefa reescreveu essa linha com "`node_modules` e `.git` não contam".
   - **O que falta:** o `metadados.test.ts` só prova o `node_modules` (linhas 721 a 727). O `.git` depende só do comentário da linha 254 ("o `**` do glob já não entra em pasta de ponto"), um comportamento do `fs.globSync` que nenhum caso fixa. Conferi à parte, numa pasta temporária: `globSync('**/HEAD')` com só `.git/HEAD` devolve `[]`, e `globSync('.git/**')` devolve `.git/HEAD`. O código hoje faz o que a linha diz, mas, se o glob mudar, um padrão como `**/config` ficaria verde só por casar `.git/config`, sem nada avisar.
   - **Correção exigida:** um caso no describe "RF30: o paths: das regras" com uma amostra sem nenhum outro arquivo que case, só `.git/HEAD`, e a regra com `paths: ["**/HEAD"]`, exigindo `falhas` com tamanho 1. Ou então tirar o "`.git`" da linha do `cenarios.md`.

Recomendações:
- A forma que realmente quebrou o `test-engineer` (`description: ... sempre: na criação ...`, um dois-pontos dentro de texto sem aspas) poderia entrar entre as `formas` do teste de frontmatter (linhas 398 a 406), e também como caso de papel. Hoje "papel sem frontmatter válido" (linha 465) só usa a forma sem as barras.
- "o papel que não é do time não é obrigado a ter a seção" (linha 534) repete a primeira asserção de "os quatro papéis do time herdam" (linha 457). Pode virar um caso com o nome do papel na asserção, ou sair.
- O caso "os de hoje têm a seção" (linhas 486 a 491) chama `conferirCriterio` direto. Vale um comentário dizendo que a contagem desses quatro papéis vem da lista fixa `PAPEIS_DO_TIME`.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-24 01:52:12 · `tasks/prd-harness/19_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em onde se procura a citação da skill `status` (está registrada só no `19_task.md` e no cabeçalho do teste)
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes:

- **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/19_task.md:83`**: a quarta divergência (onde a `status` conta como "citada") não está na Tech Spec nem no `cenarios.md`.
  - A linha diz que está no `cenarios.md`, RF24. Mas a célula RF24 (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/cenarios.md:140`) não mudou nesta tarefa e só diz "a skill `status` ainda citada".
  - O parágrafo "Skills, papéis e metadados (19.0, 24/10/2026)" da `techspec.md` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/techspec.md:322-333`) só lista o que sai: a pasta, a lista do `time.md` e o comentário do `estado.ts`. Não diz onde procurar a citação.
  - A decisão também se afasta da própria subtarefa 19.3, que manda procurar em `.claude/` inteiro e no `CLAUDE.md`. O `conferirStatus` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/metadados.test.ts:238-244`) deixa de fora `.claude/rules/`, `.claude/settings.json` e as skills de terceiros, e acrescenta `tools/processo/*.ts`.
  - **Correção exigida:** escrever esse recorte no parágrafo da 19.0 na `techspec.md` e na célula RF24 do `cenarios.md`: o que é lido, o que fica fora e por quê (as regras e o `settings.json` também). Depois corrigir a coluna "Onde está na spec" da linha 83 para apontar os dois. A outra saída é ampliar a conferência até o recorte da 19.3 (`.claude/` menos as skills de terceiros, mais o `CLAUDE.md`), e aí a divergência deixa de existir.

Recomendações:

- **Segunda divergência (`19_task.md:81`):** a leitura só da seção 1 está na `techspec.md`, mas o `cenarios.md` (RF22, linha 138) não cita os dois casos novos do `revisores.test.ts`. Vale uma linha lá.
- **Critério do `implementador.md` (linha 75):** diz "o commit saiu na branch do andar", e o `executar-task` §7 fala em "branch do seu checkout (a da linha, `spec/<funcionalidade>--l<n>`)". Trocar para "a branch da linha" evita confundir com o andar da spec, onde o `arquiteto.md:80` diz que ninguém implementa.
- **Critério do `arquiteto.md` (linhas 141-142):** diz que o Orquestrador confere "pelo `git log` do andar". Para a decisão e a retro, o commit é na `develop` do térreo, sem push (linha 131), então isso não se encaixa. Também falta a saída por `/seguir BLOQUEIO de Arquiteto` (divergência que muda o desenho, ou diagnóstico cuja causa é o desenho), que não é uma pergunta no terminal.
- **Critério do `mesa-de-revisao.md` (linhas 27-30):** "todo revisor obrigatório devolveu a rodada" não vale para a `DEVOLUÇÃO`, que a mesma frase lista como saída. E na aprovação não há ordem em `.processo/ordens/`, só o registro da rodada.
- **`metadados.test.ts:287`:** a extração dos comandos de hook, numa linha só, ficaria mais legível partida em dois passos.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 02:01:27 · `tasks/prd-harness/19_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

A correção exigida na 1ª rodada foi feita. O recorte de onde se procura a citação da `status` está escrito nos três lugares, e eles dizem a mesma coisa:
- **Tech Spec:** parágrafo "Onde a citação da `status` se procura", em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/techspec.md:325-329`. Diz o que é lido, o que fica fora e por quê, e que o `grep` da 19.3 sobre o resto da árvore é feito à mão.
- **Cenários:** a célula RF24 em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/cenarios.md`.
- **Linha de divergência:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/19_task.md:83`, que agora aponta os dois.

A conferência passou a ler também `.claude/rules/*.md` e o `.claude/settings.json`. O `.claude/` de hoje tem `agents`, `hooks`, `rules`, `settings.json` e `skills`, então dele só fica fora a skill de terceiros, como o texto declara. A contagem e o teste "citada em cada lugar" incluem os dois lugares novos, e há dois blocos de mutação novos para os filtros. Um `grep` à mão em `.claude/`, `CLAUDE.md` e `tools/processo` só achou `/api/status` e o filtro `` `status` `` dentro de skills de terceiros, que é o que o recorte aceita.

As recomendações mandadas aplicar foram feitas sem efeito colateral:
- linha do RF22 no `cenarios.md`;
- "branch da linha" no `implementador.md`;
- critério do `arquiteto.md`, com a `develop` do térreo sem push e a saída por `BLOQUEIO`;
- critério do `mesa-de-revisao.md`, com a `DEVOLUÇÃO` antes da rodada e a aprovação sem ordem;
- extração dos comandos de hook partida em dois passos, com os blocos de mutação reescritos para as linhas novas;
- linha da `lgpd-brasil` igual na skill e em `docs/skills-de-terceiros.md`.

O caso do `.git` pedido pelo `test-engineer` também entrou no `metadados.test.ts`.

Recomendações:
- **Cabeçalho desatualizado:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/metadados.test.ts:12` ainda diz "(papel, skill nossa, hook, `CLAUDE.md`, código do processo)", sem a regra e sem o `settings.json`. Atualizar a lista ou trocar por uma referência ao parágrafo da Tech Spec, como já faz o comentário da linha 232.
- **Linha 29 do `19_task.md`:** a subtarefa 19.3 ainda descreve o `grep` sobre `.claude/` inteiro. Vale uma nota curta ali apontando o recorte da Tech Spec, para quem ler só a subtarefa.

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 02:01:45 · `tasks/prd-harness/19_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada (RF23, RF24 na parte dos papéis e da `status`, RF30, e a seção 1 das lições no RF22 da 19.0). Nesta rodada conferi a correção exigida, as três recomendações e o diff entre `1c693ee` e `62ba33f`.

Cobertos:
- **Correção exigida (o `.git` do RF30):** feita. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/metadados.test.ts:744-749` é o caso "padrão que só casaria dentro de .git".
  - A regra tem `paths: ["**/HEAD"]`. A amostra apaga o `apps/api/src/a.ts` e grava só o `.git/HEAD`. O caso confirma que o arquivo existe e exige `falhas` com tamanho 1.
  - Se o glob entrasse em pasta de ponto, o caso sairia com zero falhas e ficaria vermelho.
  - A contagem 1 tem o motivo certo. Na amostra boa, só a `00-a.md` tem `paths:` (a `10-b.md` não tem), e o padrão é um só. A única falha possível, então, é "não casa com nenhum arquivo".
  - A linha RF30 do `cenarios.md:144` continua citando `node_modules` e `.git`, e agora os dois têm caso.
- **Recomendações da 1ª rodada, as três aplicadas:**
  - A forma YAML com dois-pontos dentro de texto sem aspas entrou nas `formas` da skill (`metadados.test.ts:406`) e como caso de papel (`:468-474`). As duas são YAML inválido, e o motivo é o mesmo que quebrou o `test-engineer`.
  - A asserção repetida virou uma prova de verdade (`:543-547`). O `revisor.md` é lido, não é acusado, e o caso exige `comparados = PAPEIS_DO_TIME.length + 1`.
  - O comentário sobre a lista fixa `PAPEIS_DO_TIME` está em `:494-495`.
- **Alcance da `status` ampliado** para as regras e o `settings.json`:
  - O caso "citada em cada lugar…" ganhou `${REGRAS}/00-a.md` e `SETTINGS`.
  - O caso "a conferência conta o que leu" ganhou distratores: `${REGRAS}/notas.txt` e `.claude/outro.json`. A conta exata passou para `5+2+1+1+1+1+1`.
  - As duas mutações novas (o `.filter(.md)` das regras e o `=== SETTINGS`) apontam esse caso.
  - O recorte agora está escrito na Tech Spec §9 ("Onde a citação da `status` se procura"), no `cenarios.md` RF24 e na tabela de divergências do `19_task.md`.
- **`conferirHooks` partido em dois passos** (`grupos` e depois `comandos`): as três mutações antigas foram reescritas para as linhas novas. Entrou uma nova, `.slice(0, 1)` nos hooks do grupo, apontando "comando que aponta arquivo que não existe". O portão provou as 92 vermelhas.
- **RF22 da 19.0:** "sem a seção 1" e "a seção 2 não soma" estão em `revisores.test.ts:528` e `:535`.
- **Execução:** `metadados.test.ts` e `revisores.test.ts` deram 124 de 124 verdes. Não há `.skip`, mock nem provedor de IA. Nenhuma operação aqui pode correr duas vezes ao mesmo tempo, então não cabe teste de concorrência.
- **Mudanças só de texto,** fora da minha alçada de teste: a linha da `lgpd-brasil` (igual na skill e em `docs/skills-de-terceiros.md`, o que o caso RF23 de igualdade cobre) e o critério de saída do `arquiteto`, do `implementador` e da `mesa-de-revisao`. Os itens `Terminou quando` e `Entrega` continuam presentes, e o caso "os de hoje têm a seção" segue verde.

Bloqueantes: nenhum.

Recomendações:
- `metadados.test.ts:748`: comparar a mensagem exata, como faz a linha 732 (`toEqual([\`${REGRAS}/00-a.md: o padrão "**/HEAD" de paths não casa com nenhum arquivo\`])`), em vez de só o tamanho. Hoje o tamanho já basta, mas o caso ficaria imune a uma falha de outro tipo que entre na amostra depois.
- A recomendação do `privacy-guardian` de pôr no `TODO.md` quem revisa a `lgpd-brasil` está registrada no `19_task.md` com destino fora da tarefa. Ela fica para a Mesa e a validação.

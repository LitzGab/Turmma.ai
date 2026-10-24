# Achados das revisões — `tasks/prd-harness/21_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-24 02:19:14 · `tasks/prd-harness/21_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration nesta tarefa. Abri a tabela que a skill indica como exemplo de tabela nova, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/packages/nucleo/src/db/schema/disciplina.ts`. Ela tem `escolaId` obrigatório com chave estrangeira para `escola`, id em UUID (`uuidv7()`) e `unique (escola_id, id)`, que serve de alvo às chaves estrangeiras compostas. Pode ser copiada sem passar adiante um padrão errado de isolamento.

Queries verificadas: nenhum repository, query ou endpoint novo ou alterado. A tarefa só mexe em texto de skill, documentação e em `tools/processo/harness/` (`caminhos.ts`, `caminhos.test.ts`, `receitas.test.ts`), que conferem documentos e não acessam banco. Também não aparece `@SemEscopo()` nem `escolaId` vindo do cliente.

Teste de isolamento: não se aplica, porque a tarefa não cria módulo de domínio. Conferi o exemplo que a skill indica para esse teste, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/apps/api/test/estrutura-isolamento.int.test.ts`. Ele monta as escolas A e B com dados próprios, compara a resposta ao id de B com a resposta a um id inexistente (mesmo 404, mesmo código, mesma mensagem) e confere que o estado de B não mudou. Sem a cláusula de escola no repository, esse teste falharia. O exemplo serve.

Bloqueantes: nenhum

Recomendações:
- Na linha 5.2 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/receitas-de-codigo/SKILL.md`, as travas não incluem o item 10.2 (`anoLetivoId` em tabela que varia por período), que só a revisão do `tenancy-guardian` garante. Pela RF21 o ajuste entra na §7 do guia, não na skill. Fica para a retro, porque mudar o guia está fora do escopo desta tarefa.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-24 02:19:21 · `tasks/prd-harness/21_task.md`

VEREDITO: APROVADO

A tarefa 21.0 só mexe no processo (uma skill, quatro linhas de apontamento e testes de unidade sobre os textos) e não toca dado de pessoa em nenhum ponto. Os 581 testes de `npx vitest run --project unidade tools/processo/harness/` passam, nos 11 arquivos.

Campos pessoais tocados: nenhum. Não há migration, schema, DTO, rota nem tela.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: não se aplica, porque a tarefa não cria nem altera endpoint.
Logs: limpos. Nem `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/caminhos.ts` nem `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/receitas.test.ts` têm logger ou `console`. Eles só leem arquivos locais (`existsSync`, `statSync`, `globSync`).
Auditoria: não se aplica. A tarefa não traz nenhuma das ações que a regra 20, item 10, manda auditar.
Envio externo: nenhum. Os testes não fazem chamada de rede nem chamam provedor de IA.
Seed/fixture: sintético. As amostras dos testes são cópias do repositório em `mkdtempSync`, com caminhos inventados (`apps/api/src/inexistente.ts`). Procurei e-mail, CPF, telefone, nascimento e nomes de pessoa e não achei nenhum.
Bloqueantes: nenhum.
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/receitas-de-codigo/SKILL.md`: a linha 5.4 ("Chamar a IA") lista só as travas de lint. Quem lê a skill e não abre o guia não fica sabendo do mínimo enviado, do identificador no lugar do nome, do registro em `ExecucaoAgente` nem do provedor local (regra 20, itens 12 e 13). A skill diz para ler o guia antes de escrever, e a RF21 manda o que faltar para o guia, não para a skill. Por isso não reprova, mas vale conferir na retro se a §5.4 do guia trata desses pontos explicitamente: nela achei o perfil e o `execucaoId`, e não vi o mínimo enviado nem o identificador no lugar do nome.

Pergunta de fechamento: a tarefa não cria dado nem destino de envio, então a resposta do sistema sobre o que guarda de um aluno e para onde isso foi continua a mesma de antes.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-24 02:19:22 · `tasks/prd-harness/21_task.md`

VEREDITO: APROVADO

A tarefa 21.0 não toca a regra 70. Ela só mexe no processo de construção: cria uma skill que aponta as receitas do guia e um teste que confere se os caminhos citados existem. Os 581 testes de unidade de `tools/processo/harness/` passam, em 11 arquivos.

Caminhos de escrita em Nota: nenhum criado ou alterado nesta tarefa. Nenhum dos arquivos alterados é schema, job, seed, importação ou webhook, e nem `receitas.test.ts` nem a skill citam nota, aprovação, tutor ou autonomia. Todos com autor humano? sim (nada mudou).
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. A skill aponta a §5.4 do guia, e a §5.4 continua dizendo que saída de IA que chega ao aluno nasce pendente de aprovação humana, com a resposta do Tutor como única exceção (D47). O guia não estende a exceção a outro agente.
Supervisão do tutor: ok, nada mudou.
Autonomia declarada e visível: sim, nada mudou. `docs/regulacao.md` e `.claude/rules/` também não mudaram.
Bloqueantes: nenhum.

Recomendações (nenhuma bloqueia):
1. Em `.claude/skills/receitas-de-codigo/SKILL.md`, a linha 5.4 ("Chamar a IA") só lista travas de lint e `dependency-cruiser`. Três exigências da regra 70 não têm trava de máquina e dependem da revisão: aprovação pendente, AIA (70.6a) e D55. A skill não avisa isso. Uma frase como "a regra 70 (aprovação, AIA, D55) é da revisão" ajudaria. Como o RF21 diz que o que falta vai para o guia, o melhor lugar é a §5.4 do guia.
2. A §5.4 de `docs/guia-do-desenvolvedor.md` não cita a D55. Quem escrever uma chamada de IA que tocasse discursiva ou redação seguiria a receita sem ver a proibição de nota, sugestão de nota e pré-correção. Mudar a receita está fora do escopo desta tarefa, então isso fica para uma próxima revisão do guia.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/receitas-de-codigo/SKILL.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/executar-task/SKILL.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/criar-techspec/template.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/CLAUDE.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/docs/guia-do-desenvolvedor.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/caminhos.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/caminhos.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/receitas.test.ts

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 02:19:59 · `tasks/prd-harness/21_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

**O que conferi**
- **Escopo.** As quatro subtarefas estão feitas. A 21.3 só moveu a extração da 16.0 para `caminhos.ts`, com o mesmo corpo; a única diferença é que `ehPasta` agora é exportada. As receitas do guia e as skills de terceiro ficaram como estavam. Cada um dos quatro apontamentos está na seção que a Tech Spec exige, e o teste prova isso. A mudança no `CLAUDE.md` e no guia é de uma linha cada.
- **Tech Spec §9.** O que ela pede está atendido:
  - `user-invocable: false`, e a `description` traz as seis palavras dos assuntos.
  - A skill tem 22 linhas e 1.672 B, sem código.
  - Há uma linha por `### 5.x` (5.1 a 5.6). Cada exemplo está na linha `Exemplo:` da seção do guia, e cada trava é a célula exata da §7, separadas por `;`.
  - A frase da seção 11 com D81 e a frase do mesmo commit estão lá.
  - O filtro das pastas da raiz fica no `receitas.test.ts`, e a extração continua devolvendo o token cru.
- **Cenários.** Todos os cenários do RF32 em `cenarios.md` e da tabela de testes da tarefa têm caso, inclusive o alvo ausente e o teste no repositório de hoje com as contagens afirmadas. A tabela de divergências está vazia, e não achei divergência que devesse estar nela.

**Recomendações**
1. `tasks/prd-harness/21_task.md:23-27`: as subtarefas 21.1 a 21.4 continuam `[ ]`. O `executar-task` (linha 80) manda marcar `[x]` durante o trabalho, e nas tarefas 18 e 19 elas foram marcadas no commit. Marcar antes do commit, junto com o `[x]` no `tasks.md`.
2. `tools/processo/harness/receitas.test.ts:591`: a mensagem esperada é montada com um texto qualquer e depois trocada por `.replace(...)`. Escrever direto `` `${SKILL}: a linha 5.1 aponta uma seção que o guia não tem` ``, que é o que o caso afirma.
3. `tools/processo/harness/receitas.test.ts:143`: código recuado por tabulação também gera a mensagem "recuo de quatro espaços na linha N", e o caso da linha 544 grava esse texto. Usar uma mensagem que sirva às duas formas, como "recuo na linha N".
4. `.claude/skills/receitas-de-codigo/SKILL.md:7`: a §9 da Tech Spec pede três frases fora da tabela, e a skill tem mais: "Esta skill só aponta, sem copiar o guia" e "Copie o exemplo e troque os nomes". Não fere nenhum limite que o teste confere, mas se afasta da letra da §9. Enxugar ou deixar como está, à escolha.
5. `tools/processo/harness/receitas.test.ts:222` e `:253`: `conferirReceitas` e `conferirApontamentos` são exportadas de dentro de um arquivo de teste. Isso segue o precedente da 16.0 e nada as importa hoje. Se outro teste vier a usá-las, mover para um `receitas.ts`, como a 21.3 fez com `caminhos.ts`.

Arquivos revisados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/receitas-de-codigo/SKILL.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/receitas.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/caminhos.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/caminhos.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/21_task.md`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-24 02:21:14 · `tasks/prd-harness/21_task.md`

**VEREDITO: REPROVADO**

Há um único bloqueante: o código movido para `caminhos.ts` perdeu nove das provas por mutação que tinha na 16.0. A correção é copiar blocos de um documento para outro. Os testes da conferência nova estão completos.

**Cenários exigidos:** os 26 da tabela "Testes que provam a regra" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/21_task.md`. Isolamento, permissão, IA e concorrência não se aplicam: é uma conferência estática de documentos, sem dado de escola, sem provedor e sem nada que rode duas vezes ao mesmo tempo.

**Cobertos:** os 26, cada um com teste citável em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/receitas.test.ts`.
- **Caminho que não existe:** cada forma de escrita (crase, crase com `./`, aspas simples, aspas duplas, `./` solto) é testada em cada lado (skill, §5, §6 e §7 do guia), em `it.each(LADOS × FORMAS)`, na linha 433.
- **Placeholder, glob e o que fica fora da conferência:** um caso por lado, nas linhas 441 a 452.
- **A linha da skill contra o guia:** exemplo fora da linha `Exemplo:`, exemplo sem pasta da raiz, linha sem exemplo, linha sem trava, linha que aponta 5.9, `### 5.x` sem linha, trava fora da célula exata e trava pela metade, nas linhas 457 a 516.
- **O formato da skill:**
  - Código por crase, til, quatro espaços e também tabulação.
  - Fronteira de 60 e 61 linhas, e de 6.000 e 6.001 B.
  - Um caso por assunto da `description`.
  - A frase da seção 11.
  - Linhas 529 a 568.
- **Alvo ausente:** guia ausente, guia sem §5, sem §6 ou sem §7, e skill ausente, nas linhas 572 a 598.
- **Os quatro apontamentos:** cada um com o caso "em outra seção não vale" e o de arquivo ausente, nas linhas 608 a 636.
- **O repositório de hoje:** cada contagem é afirmada com mínimo, e as linhas da skill são iguais às `### 5.x`, nas linhas 401 a 411.
- **Execução:** `npx vitest run --project unidade tools/processo/harness/` passou, 581 de 581, com o `metadados.test.ts` incluído.
- **Mutações de `receitas.test.ts`:** todas as condições da conferência têm bloco, e cada bloco cai no caso pelo motivo certo.
- **Proibidos:** nenhum `.skip`, nenhum teste comentado, nenhum mock.

**Bloqueantes:**

1. **`tools/processo/harness/caminhos.ts` (arquivo novo no diff) tem condições sem bloco de mutação.**
   - **O que mudou:** a 21.3 tirou o código de dentro de `caminhos.test.ts`. Com isso, os blocos da 16.0 que apontavam para lá não se aplicam a mais nada, porque o texto deles não está mais naquele arquivo.
   - **O que a 21.0 fez:** redeclarou só oito blocos, em `21_task.md:501-555`. As cláusulas abaixo ficaram sem prova que se possa rodar:
     - `caminhos.ts:20`: a extração entre crases (bloco da 16.0 em `16_task.md:149-153`).
     - `caminhos.ts:22`: a extração do `./` (`16_task.md:143-147`) e o lookbehind dele (`16_task.md:540-545`).
     - `caminhos.ts:24`: o `new Set` que tira repetição (`16_task.md:155-160`).
     - `caminhos.ts:12`: a entrada `infra/` de `PASTAS_DA_RAIZ` (`16_task.md:169-174`).
     - `caminhos.ts:46`: o `if (placeholder !== null)` (`16_task.md:205-210`).
     - `caminhos.ts:48`: a variante `dirname(antes)` (`16_task.md:219-224`).
     - `caminhos.ts:49`: `ehPasta(...) ? null : ...` trocado por `null` (`16_task.md:226-231`).
     - `caminhos.ts:51`: a guarda `caminho.includes('*')` (`16_task.md:233-238`).
     - `caminhos.ts:52`: `existsSync(...) ? null : 'não existe'` trocado por `null` (`16_task.md:247-252`).
   - **Correção exigida:** copiar esses blocos para a seção "Mutações" da 21.0 com `arquivo: tools/processo/harness/caminhos.ts`, mantendo o mesmo teste citado. Os nomes de teste da 16.0 continuam existindo em `caminhos.test.ts`, então o portão os prova sem mudar nenhum teste.

**Recomendações (não bloqueiam):**
- `receitas.test.ts:591`: o `.replace(...)` montado sobre outra mensagem dá no mesmo que escrever direto `` `${SKILL}: a linha 5.1 aponta uma seção que o guia não tem` ``. Escrever direto é mais legível.
- `receitas.test.ts:143`: o código achado por tabulação é relatado como "recuo de quatro espaços". A mensagem engana quem lê a falha; algo como "recuo na linha N" serve para os dois casos.
- `receitas.test.ts:201`: o comentário "Soma de `conferirCaminhos`" não descreve a função. A função devolve quantos caminhos conferiu e acrescenta uma falha para cada um que não existe.
- `codigoNaSkill`: o `{0,3}` da cerca recuada não tem caso. Valeria um caso com `   ```` com três espaços.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 02:28:14 · `tasks/prd-harness/21_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum
Recomendações:
- Seis dos dez blocos de mutação novos em `caminhos.ts` usam nomes de teste abreviados, por exemplo `quem contorna é acusado` e `sem repetir`. Os testes de verdade em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/caminhos.test.ts` se chamam `quem contorna é acusado: o caminho escrito com %s` (linha 155) e `com <...>, * e a / final, sem repetir` (linha 246). Se quem roda a mutação procura o teste pelo nome exato, esses blocos não acham o teste. Quem confere isso é o `test-engineer`, que reprovou a 1ª rodada; deixo registrado só para a validação.
- Dois dos blocos novos, os dois em `quem contorna é acusado`, só apagam uma linha da extração e não põem nada no lugar (crase e `./`). Pela linha 22 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/caminhos.ts`, o array continua válido sem a linha. Vale conferir se a ferramenta de mutação aceita um bloco só de remoção.

Nesta rodada só mudaram `tasks/prd-harness/21_task.md` e `tools/processo/harness/receitas.test.ts`, e nada do que mudou passa do escopo da 21.0:
- **Recomendações da 1ª rodada:** as três aceitas foram aplicadas. A mensagem saiu do `.replace`, a de recuo agora vale para tabulação e as subtarefas estão marcadas `[x]`. As duas recusas estão na tabela "Recomendações sem aplicar", com motivo e destino.
- **Caso novo de cerca recuada em três espaços:** a mutação declarada para ele corresponde à expressão do código.
- **Comentário de `conferirCaminhos`:** passou a dizer que a função devolve a contagem, e isso bate com a assinatura.
- **Divergência da Tech Spec:** nenhuma nova.

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 02:28:27 · `tasks/prd-harness/21_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada (receitas da skill e do guia, a cerca e o recuo de código, os limites de linhas e de bytes, os apontamentos para o guia, a skill ou o guia ausente). Agora entra também a prova de cada condição de `tools/processo/harness/caminhos.ts`, o arquivo que a 21.3 tirou de `caminhos.test.ts`.

Cobertos: as nove correções exigidas foram feitas. Cada uma ganhou bloco com `arquivo: tools/processo/harness/caminhos.ts` e cita o mesmo teste que a 16.0 citava (conferi contra `16_task.md`):
- `caminhos.ts:20`, a extração entre crases: bloco em 21_task.md:570, teste "quem contorna é acusado".
- `caminhos.ts:22`, a extração do `./`: bloco em 21_task.md:564. O lookbehind tem bloco próprio em 21_task.md:625, teste "o ./ só conta solto".
- `caminhos.ts:24`, o `new Set`: bloco em 21_task.md:576, teste "sem repetir".
- `caminhos.ts:12`, a entrada `infra/`: bloco em 21_task.md:583, teste "só é caminho o que".
- `caminhos.ts:46`, o `placeholder !== null`: bloco em 21_task.md:590.
- `caminhos.ts:48`, a variante `dirname(antes)`: bloco em 21_task.md:597. A variante `antes`, que já existia, segue em 21_task.md:516.
- `caminhos.ts:49`, o `ehPasta(...) ? null`: bloco em 21_task.md:604.
- `caminhos.ts:51`, a guarda `caminho.includes('*')`: bloco em 21_task.md:611.
- `caminhos.ts:52`, o `existsSync(...) ? null`: bloco em 21_task.md:618, teste "amostra que cita apps/api/src/inexistente.ts".

A forma dos blocos novos vale para o parser. Na linha `-`/`+`, `mutacoes.ts:83` apara o texto, então os blocos novos acham a linha mesmo sem o recuo do código. O nome do teste vai como `-t`, que casa por substring (`mutacoes.ts:184`), e todos os nomes citados existem em `tools/processo/harness/caminhos.test.ts`.

O caso novo "código por cerca recuada em três espaços" (`receitas.test.ts:540-542`) tem bloco em 21_task.md:557. Ele fica vermelho pelo motivo certo: com a mutação `/^(```|~~~)/`, a cerca recuada em três espaços não é achada. O recuo também não pega a linha, porque três espaços não chegam aos quatro. A função devolve `null` e o teste espera a cerca.

O bloco "código por recuo de quatro espaços" (21_task.md:233-238) foi atualizado para a mensagem nova, `recuo na linha`. As recomendações da 1ª rodada foram aplicadas no teste ou registradas na tabela "Recomendações sem aplicar", com destino ou motivo.

Os dois arquivos de teste passam: 103 de 103.

Bloqueantes: nenhum.

Recomendações:
- Alguns blocos citam o teste por um prefixo curto: "quem contorna é acusado", "placeholder: confere a pasta", "só é caminho o que". Como o `-t` casa por substring, o primeiro deles pega vários casos do `it.each`, e o vermelho pode vir de um caso diferente do que a mutação quer provar. Não bloqueia, porque são os nomes da 16.0 e o portão já os provou. Citar o caso exato deixaria a prova mais estreita.
- O comentário de `codigoNaSkill` (`receitas.test.ts:137`) ainda fala em "cerca de ``` ou ~~~" e não diz que a cerca pode vir com até três espaços de recuo, como o regex de `:140` aceita.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/21_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/caminhos.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/caminhos.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/receitas.test.ts

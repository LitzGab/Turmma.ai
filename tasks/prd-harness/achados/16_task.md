# Achados das revisões — `tasks/prd-harness/16_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 23:57:56 · `tasks/prd-harness/16_task.md`

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

A tarefa só mexe em texto de regra, de agente e de guarda, e em testes do processo. Não muda nada em `apps/*/src` nem em `packages/*/src`. Nas regras 00, 30 e 80, o diff só acrescenta linhas `Checagem:`, mais a troca da pasta dos adaptadores no item 1 da regra 30. Nenhum item que diz como aguentar a carga perdeu texto.

Conferi os oito testes que a regra 80 passou a citar: todos existem e provam o que o item diz. O login não leva 429 por IP: o IP é só rebaixado, por escola, e quem traz o cookie passa na frente. A fila interativa sai antes do lote. Cada escola tem teto de vagas, e esse teto aguenta dois despachantes ao mesmo tempo. O aceite de convite feito duas vezes em paralelo grava uma vez só. Os alertas têm runbook.

Rodei `npx vitest run --project unidade tools/guardas/guardas.test.ts tools/processo/harness/`: 8 arquivos e 481 testes passaram.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/guardas/regras-ia.mjs:29`: o padrão `packages/nucleo/src/ia/adaptador-*.ts` também libera `adaptador-falso.ts`, `adaptador-resiliente.ts` e os `adaptador-*.test.ts`. Hoje nenhum adaptador importa SDK, porque o `adaptador-openai-compat.ts` usa `fetch`. Mesmo assim, o adaptador falso e os testes não têm motivo para importar SDK de provedor pago (regra 30, item 3; regra 80, item 11). Vale tirar `*.test.ts` e `adaptador-falso.ts` da exceção, ou listar só o arquivo do adaptador real.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/80-infra-e-carga.md`, item 4: a linha diz "só a revisão garante", mas `packages/nucleo/src/ia/adaptador-resiliente.test.ts` já prova o timeout por perfil e o recuo no 429. Vale citá-lo, como a regra 30, item 8, já faz. O limitador de tokens por minuto e o caminho de degradação continuam sem teste.
- Mesmo arquivo, item 2: a prioridade "lote nunca atrasa interativo" é provada em `apps/despachante/test/vagas.int.test.ts` (o caso "com 1.000 lotes na fila, um interativo novo começa antes"). Hoje esse teste só aparece no item 3; vale citá-lo também no item 2.
- Itens 5, 6 e 8 da regra 80 (estado em memória, prova online, índice): continuam sem teste, só com a revisão. Ficam para o `/retro` como lacuna conhecida; não bloqueiam esta tarefa.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-23 23:58:24 · `tasks/prd-harness/16_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. A tarefa não cria migration, schema nem tabela.

Queries verificadas: nenhuma. A tarefa não cria repository, query nem endpoint. Também conferi:
- se as linhas `Checagem:` da regra 10, dos itens 3, 4, 5, 6, 9 e 10 da regra 20, do item 2 da regra 40 e do item 3 da regra 00 apontam para algo que existe e que prova o que dizem;
- se os itens 1 a 9 da regra 10 continuam todos lá (continuam; o diff só acrescenta linhas);
- se a troca de pasta em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/guardas/regras-ia.mjs` toca escopo de escola (não toca).

Rodei `npx vitest run --project unidade tools/guardas/guardas.test.ts tools/processo/harness/`: 8 arquivos e 481 testes, todos verdes.

Teste de isolamento: não se aplica, porque não há módulo novo de domínio. As referências de isolamento que as regras passaram a citar são efetivas:
- `apps/api/test/arquitetura.test.ts` (o describe "toda tabela sem escola_id está nas exceções…") prova o item 1 da regra 10.
- `tools/guardas/repositories-com-escopo.test.ts` mais a guarda `guardas/tabela-so-no-repository` provam os itens 3 e 9.
- O mesmo teste de repositories exige motivo de pelo menos 30 caracteres no `@SemEscopo`.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/10-multitenancy.md:92` (item 8, camada de rede só lê agregado): a checagem citada, `apps/api/test/arquitetura.test.ts`, prova só metade. Ela mostra que a única leitura entre escolas é o `PainelRepository`, com três métodos `@SemEscopo`, e não tem nada sobre o papel `rede`. O que garante o item hoje é o papel `rede` ser recusado pelo `usuario_papel_valido`, e isso está provado em `packages/nucleo/src/identidade/tabelas-de-identidade.int.test.ts:78`. Esse teste deveria entrar na linha. Quando o papel `rede` ganhar caminho de leitura, a linha precisa citar o teste que prova que ele só lê agregado.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/10-multitenancy.md:83` (item 6, 404 igual para inexistente e para outra escola): o teste citado como "o que há de teste", `apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts`, diz na linha 216 que o id de outra escola não entra nele. Melhor citar um teste que compare de fato o 404 do id de outra escola com o do id inexistente. O "só a revisão garante" deixa a linha honesta, mas o exemplo engana. O mesmo vale para o item 6 da regra 20.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/20-lgpd-menores.md`, item 14 (acesso restrito ao professor da turma, rede sem conversa): `apps/api/test/retencao.int.test.ts` prova a retenção, mas não a restrição de acesso. Fica para o `privacy-guardian` confirmar.
4. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/checagens.test.ts` confere só se a checagem citada existe, não se ela prova o item. Os itens 1 a 3 acima mostram a lacuna. Para o `/retro`: o critério do RF25 garante que a referência existe, não que ela é pertinente.

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-23 23:58:50 · `tasks/prd-harness/16_task.md`

VEREDITO: REPROVADO

A tarefa não toca nenhum dado de pessoa: muda texto de regra, a guarda de IA e testes do processo. O único motivo da reprovação é uma linha `Checagem:` da regra 20 que aponta um teste de outro assunto.

Campos pessoais tocados: nenhum. A tarefa não tem migration, schema, DTO nem código em `apps/*/src` ou `packages/*/src`.

Fora da tabela de dados do docs/lgpd.md: nada (não há campo novo).

Autorização por objeto: não se aplica (nenhuma rota nova).

Logs: limpos. A exceção de SDK no `tools/guardas/guardas.test.ts` vale só para as regras de SDK (`REGRAS_DE_SDK_DE_IA`). A guarda de log continua valendo em `packages/nucleo/src/ia/adaptador-*.ts`, e o caso `reprova dado pessoal… em %s` agora prova isso pelo caminho novo.

Auditoria: não se aplica (nenhuma ação nova que a regra mande auditar).

Envio externo: nenhum. A guarda de SDK passou a olhar a pasta onde os adaptadores estão hoje (`tools/guardas/regras-ia.mjs:29`). Antes ela isentava uma pasta que não existe mais, então não isentava nada. Os testes cobrem o caminho antigo, o `porta.ts` e o `adaptador.ts`, que continuam reprovados. Rodei `npx vitest run --project unidade tools/guardas/guardas.test.ts tools/processo/harness/`: 481 testes passaram.

Seed/fixture: sintético. `tools/guardas/__fixtures__/sdk-de-ia.ts` só teve o comentário trocado.

Bloqueantes:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/20-lgpd-menores.md:127`: o item 13 diz que é garantido por `apps/api/test/provedores-da-escola.int.test.ts`.
   - **O que está errado:** esse teste é do `PUT /v1/escola/provedores`, que libera os domínios Google e os tenants Microsoft usados para entrar no sistema (D48). Ele não fala de provedor de IA, de contrato que veda treinamento, de uso por menor nem de onde o dado é processado.
   - **O risco:** a regra afirma uma cobertura que não existe, justamente no item que decide se conversa de menor sai para um terceiro. Quem audita depois confia na linha e não confere. A `checagens.test.ts` não pega isso, porque ela só confere se o arquivo citado existe.
   - **Correção exigida:** tirar esse teste da linha. Deixar `packages/nucleo/src/ia/provedor.test.ts` (o caso `criarProvedorDeIa: sem nada configurado, a porta é a do adaptador falso`) e `privacy-guardian`, ou citar um teste que de fato prove a escolha do provedor pelo contrato. Se esse teste não existir, a linha deve dizer "só a revisão garante".

Recomendações:
- **Linha 131 (item 14):** `retencao.int.test.ts` prova só a retenção que a escola configura. O acesso restrito ao professor da turma é provado por `apps/api/src/tutor/tutor.int.test.ts` (o caso `sinais e uso: a professora de outra turma, a de outra escola, a coordenação e o aluno recebem a resposta do inexistente`), que deveria ser citado também. Que a camada de rede não chega à conversa, nenhum teste citado prova. A linha deveria dizer isso, pela fórmula "só a revisão garante … o que há de teste".
- **Linha 53 (item 3):** diz "só a revisão garante", mas `packages/nucleo/src/db/schema/mvp/tabelas-do-mvp.int.test.ts` já tem o caso `D35: nenhuma tabela do MVP liga aluno a adaptação, e nenhuma coluna tem nome de adaptação, diagnóstico ou laudo`. Vale citá-lo.
- **Linha 41 (item 1):** `arquitetura.test.ts` não lê `docs/lgpd.md`. O que ele prova é a classificação de toda tabela para retenção e para o arquivo do titular (`CLASSIFICACAO_DAS_TABELAS`), que é um substituto razoável, mas não é a tabela do documento. Sugiro dizer isso na linha, para ninguém achar que o documento é conferido.
- **Linha 48 (item 2):** `contratos.test.ts` só recusa e-mail em contrato de saída que pode chegar ao aluno. Telefone, CPF, foto, endereço e nascimento no schema do aluno não têm teste. Vale citar `packages/shared/src/estrutura/documento-na-matricula.test.ts` para o CPF na importação, e registrar que o resto fica com a revisão.
- **Linha 120 (item 12):** dá para somar `packages/nucleo/src/ia/provedor.test.ts › entrada com nome de aluno é recusada`, que barra o nome antes de qualquer envio.
- **Para o `llm-integrator`:** o padrão `adaptador-*.ts` também isenta `adaptador-openai-compat.test.ts`, `adaptador-resiliente.test.ts` e `adaptador-falso.ts`. Hoje nenhum deles importa SDK, mas um teste ali poderia importar e chamar um provedor pago, o que fere a regra 30, item 3, e a regra 20, item 13. Excluir `*.test.ts` da isenção fecha isso.
- **Para a 21.0:** a `checagens.test.ts` confere que a checagem citada existe, não que ela prova o item. Os desvios acima mostram que a conferência de existência não basta para as regras 10, 20 e 70. Vale registrar isso.

Pergunta de fechamento: esta tarefa não muda o que o sistema guarda sobre um aluno nem para onde envia. A resposta continua a mesma de antes, com `arquivo-do-titular.int.test.ts` e o registro de envio externo provado em `provedor.test.ts`.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-23 23:58:50 · `tasks/prd-harness/16_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As seis divergências estão na `techspec.md` §11 e no `cenarios.md` C (RF24 e RF25): a seção nova da regra 40, a base fixa em 38.610 B, os 181 caminhos e a extração exportada do teste.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/10-multitenancy.md:92`, item 8 ("A camada de rede lê apenas agregado"). A checagem cita `apps/api/test/arquitetura.test.ts`, mas esse teste não tem nenhum caso sobre o papel `rede`. O único "rede" que aparece nele são os métodos `redes`, `escolas` e `uso` do `PainelRepository`, e esse painel é o da equipe Turmma (D76), não a camada de rede. Quem prova o item é `packages/shared/src/permissao/matriz.test.ts:34`, no caso "a rede nunca tem alcance individual: só nunca ou agregado, em toda célula". `checagens.test.ts` só confere que o arquivo existe, e a §11 deixa para a revisão conferir se a checagem prova o item. Aqui ela não prova, numa regra que fica sempre no contexto e no item que a própria regra diz ser "a primeira coisa que um jurídico de prefeitura pergunta". **Correção:** trocar `apps/api/test/arquitetura.test.ts` por `packages/shared/src/permissao/matriz.test.ts`, mantendo o `tenancy-guardian`.

2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/20-lgpd-menores.md:41`, item 1 ("Campo pessoal novo só entra se estiver na tabela de dados de `docs/lgpd.md`"). A checagem também cita `apps/api/test/arquitetura.test.ts`, que não lê `docs/lgpd.md` nem compara coluna de pessoa com o mapa de dados. O que ele prova é que toda tabela tem `escola_id` (regra 10, item 1). Essa linha afirma que a máquina garante algo que ninguém garante. **Correção:** escrever `Checagem: só a revisão garante (\`privacy-guardian\`)`. Outra saída é citar um teste que de fato confira as colunas pessoais das migrations contra o mapa de `docs/lgpd.md`, mas esse teste não existe hoje e criá-lo está fora desta tarefa.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/40-testes.md:110`, item 5. A `guardas/teste-sem-desligar` só pega `.skip`, `.only`, `.fixme`, `.todo`, `.skipIf` e `.runIf` (`tools/guardas/regras-teste.mjs:108`). O `any` é barrado pelo `@typescript-eslint/no-explicit-any` (`eslint.config.mjs:53`), e "asserção que sempre passa" ou "teste comentado" não têm máquina nenhuma. A linha devia acrescentar "só a revisão garante (`test-engineer`)" para essas partes.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/30-camada-ia.md`, item 4 (o registro de modelo, tokens, custo, duração e envio externo). Quem prova a medição é `packages/nucleo/src/ia/provedor.test.ts`, nos casos "a medição diz o perfil, o modelo, os tokens, a duração…" e "houve envio externo". `apps/api/src/ia/ia.int.test.ts` trata sobretudo do isolamento do `ExecucaoRepository`. Vale citar os dois.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/50-frontend.md`, item 1. `tools/ci/tamanho-web.test.ts` só cobre o teto do bundle, não o teste com throttling de rede e de CPU que o item exige. Vale deixar dito que essa parte só a revisão garante.
- Antes da 21.0, que vai reaproveitar a extração, vale uma releitura completa das 111 `Checagem:` com a mesma pergunta destes dois bloqueantes: o teste citado prova o item ou só fica perto do assunto dele? Conferi por amostra, e as que olhei além dessas cinco estão coerentes: `tabelas-do-mvp`, `contratos`, `armazem-s3`, `tutor-modelo` no item 12, `vagas`, `virada-do-ano`, `credencial-matricula`, `turno-do-tutor` e `atividades`.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-23 23:59:02 · `tasks/prd-harness/16_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tabela `nota` não existe, e `packages/nucleo/src/db/schema/mvp/tabelas-do-mvp.int.test.ts:1157` prova isso. Também não há nenhum `lancadaPor` nem `class Nota` em `apps/` ou `packages/`. A tarefa não muda código de produto. Todos com autor humano? sim, porque não há nenhum caminho.

Decisão autônoma sobre aluno: ausente. A tarefa não muda código de produto. O item 2 declara "só a revisão garante", e isso está correto.

Aprovação registrada: ok. A Checagem do item 3 (`.claude/rules/70-conformidade-cne.md:82`) aponta testes que provam o item:
- a entrega nasce pendente;
- aprovar grava autor e data;
- rejeitar exige justificativa;
- sem a sessão de uma pessoa, nada se decide.

Esses casos estão em `apps/api/src/entrega/entrega.int.test.ts:189`, `:220` e `:322` e em `apps/api/src/artefato/artefato.int.test.ts:111`. A exceção do tutor continua restrita a ele: o texto da regra 70 não mudou, só ganhou as linhas `Checagem:`.

Supervisão do tutor: ok. O item 4 aponta `apps/api/src/tutor/tutor.int.test.ts`, que tem o bloco "o uso do Tutor pela turma (D8, D47; regra 70, itens 4 e 7)", na linha 785.

Autonomia declarada e visível: sim. O item 5 aponta `apps/api/src/governanca/governanca.int.test.ts:271` e `packages/shared/src/governanca/governanca.test.ts:100`. O selo em português comum está em `apps/web/src/areas/coordenacao/governanca/textos-da-governanca.test.ts:145`.

Os outros pontos do roteiro:
- **Item 2a (D55):** a Checagem aponta a ausência de coluna de nota (`tabelas-do-mvp.int.test.ts:1157`) e a recusa de corrigir redação (`apps/api/src/assistente/assistente.int.test.ts:447` e `:464`).
- **Item 8 (D45):** a Checagem aponta que não há filtro nem ordenação por pessoa (`governanca.int.test.ts:241`) e que a coordenação não lê a conversa da professora (`assistente.int.test.ts:224`).
- **Item 9 (D64):** está coberto pelos textos que não citam pessoa.
- **Testes:** `npx vitest run --project unidade tools/guardas/guardas.test.ts tools/processo/harness/` passou com 481 testes em 8 arquivos. Isso inclui o teste da 15.0, que cuida para nenhum item numerado da 10, da 20 e da 70 sumir.

Bloqueantes: nenhum.

Recomendações:
1. **Item 6:** `.claude/rules/70-conformidade-cne.md:123` aponta `packages/nucleo/src/auditoria/auditoria.int.test.ts`. Esse teste prova a tabela de auditoria em geral (autor obrigatório, isolamento, transação), mas não pergunta "o que a IA gerou, quem aprovou e quando". Quem faz essa pergunta é `apps/api/src/entrega/entrega.int.test.ts:189` e `apps/api/src/governanca/governanca.int.test.ts:246`. Vale citar os dois para que ninguém afrouxe essa asserção achando que outro teste a cobre.
2. **Item 7:** `.claude/rules/70-conformidade-cne.md:140` diz "só a revisão garante", mas há teste que prova parte do item:
   - `apps/api/src/tutor/tutor.int.test.ts:785` ("regra 70, itens 4 e 7");
   - `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts:355` (sem inferência de humor);
   - `packages/nucleo/src/db/schema/mvp/tabelas-do-mvp.int.test.ts:1174` (sinal sem texto livre).

   A D57 pede a proibição escrita e testada, então vale citar esses testes.
3. **Item 4b:** `.claude/rules/70-conformidade-cne.md:99` aponta só `apps/web/src/areas/aluno/tutor.test.ts`, que prova apenas o ponto de parada à vista ("Hoje: N de 60"). Quem prova "sem sequência, sem conquista e nada se mexe sozinho" é `e2e/aluno-tutor.spec.ts:20` e `:68`, e "o Sair não é menor que entrar" está em `apps/web/src/componentes/MenuDaPessoa.test.tsx:66`. Vale acrescentar os três.
4. **Item 1:** a Checagem em `.claude/rules/70-conformidade-cne.md:61` vale hoje porque a tabela `nota` não existe. Quando ela nascer, a Checagem precisa passar a apontar o teste que recusa a gravação sem `lancadaPor` em todo caminho (interface, job, importação, seed, webhook). Vale deixar isso anotado para a tarefa que criar a nota.
5. **Item 4d:** `.claude/rules/70-conformidade-cne.md:113` não tem teste para "o aluno vê o que o Tutor sabe e pode contestar". Se ainda não houver teste para isso, a linha deveria dizer que essa parte só a revisão garante.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-24 00:00:32 · `tasks/prd-harness/16_task.md`

VEREDITO: REPROVADO

Cenários exigidos: os 13 da tabela "Testes que provam a regra" da 16.0. São eles: a amostra com `apps/api/src/inexistente.ts`; o repositório de hoje com contagem mínima; o que fica fora da fronteira (`x.test.ts` e `__fixtures__/`); o placeholder com a pasta presente e com a pasta ausente; para o RF25, a checagem que não existe, a frase "só a revisão garante" e o item sem nenhuma das duas; para a guarda de IA, `porta.ts` e `adaptador.ts` reprovados, o caminho antigo reprovado, `adaptador-openai-compat.ts` passando e a lista de exceções atualizada; quem contorna, um caso por forma; e a pasta-alvo vazia. Além deles, cada cláusula das duas conferências novas, como a seção "Mutações" afirma.

Cobertos: as 13 linhas da tabela têm teste, citado pelo nome:
- `caminhos.test.ts`: "amostra que cita apps/api/src/inexistente.ts", "o repositório de hoje passa…", "fora da fronteira…", "placeholder: confere a pasta…", "quem contorna é acusado: %s" (cinco formas) e "pasta da fronteira sem arquivo nenhum".
- `checagens.test.ts`: o `it.each` "regra que cita checagem que não existe", "regra que diz…", "item sem checagem nem a frase" e "pasta das regras ausente ou vazia".
- `guardas.test.ts`: os três caminhos novos no `it.each` do reprova, os dois que passam e `EXCECOES_DAS_GUARDAS` atualizado.

Não há `.skip`, mock nem provedor pago; a guarda de IA roda pelo lint sobre a amostra. Concorrência não se aplica, porque a conferência é estática e não tem operação que aconteça duas vezes. Rodei `npx vitest run --project unidade tools/processo/harness/` (7 arquivos, 277 testes) e os dois arquivos com `tools/guardas/guardas.test.ts` (250 testes): tudo verde.

Bloqueantes:
1. **O lookbehind do `./` não tem teste nem bloco, e a mutação dele sobrevive.** Fica em `tools/processo/harness/caminhos.test.ts:34`, `(?<![\w./`'"-])`. Sem ele, `'../../packages/x.ts'` passa a render `./packages/x.ts`, e esse caminho é conferido contra a raiz. Isso já acontece com o `'../…/sem-escopo.decorator.ts'` de `tools/guardas/escopo-dos-repositories.ts:4`, que existe e por isso mascara o erro. O teste de `:285` ("o ./ solto não repete o que a crase já pegou") diz provar a cláusula, mas quem a prova é o `Set` de `:36`. A correção exigida tem duas partes:
   - um caso com `'../../docs/inexistente.md'` e `a./docs/inexistente.md` que dê zero conferidos;
   - o bloco que tira o lookbehind e cita esse caso.
2. **A extensão `.md` do nome da regra não é provada.** O teste de `checagens.test.ts:301` diz "…e o de número que não é de regra também não conta", mas a amostra só tem `LEIAME.md`. A mutação de `/^(\d+)-.+\.md$/` (`:82`) para `/^(\d+)-/` sobrevive. A correção exigida: acrescentar à amostra `.claude/rules/15-rascunho.txt` com `1. **Sem checagem.**`, e um bloco para a extensão.
3. **Há cláusulas novas sem bloco e fora do "Sem bloco, de propósito".** Cada uma precisa de um bloco ou de uma linha com o motivo:
   - **A continuação da linha `Checagem:`** (`checagens.test.ts:66-69`, o `partes.push`). A seção "Mutações" diz que ela tem bloco, mas os três blocos do `checagemDe` são o `onde < 0`, o `break`→`continue` e o `/\S/`. Nenhum tira a continuação. O teste dela existe (":237").
   - **Cláusulas com teste mas sem bloco:**
     - o `^\s*` de `/^\s*Checagem:/` (`:63`);
     - o `token.includes('/')` do `classificar` (`:105`);
     - o `catch` do `ler` (`:37`).
   - **`.isDirectory()` em `caminhos.test.ts:47`.** Trocado por `true`, sobrevive: nenhum caso tem placeholder cuja "pasta" é um arquivo. Exige um caso, como `apps/api/src/existe.ts/<x>`, e o bloco.
   - **`.replace(/^\.\//, '')` do `problemaDoCaminho` (`caminhos.test.ts:55`).** A mutação é equivalente, porque o `join` normaliza o `./`. Basta uma linha no "Sem bloco", com esse motivo.
4. **`.claude/rules/20-lgpd-menores.md:41`, item 1, cita uma checagem que não prova o item.** A linha cita `apps/api/test/arquitetura.test.ts`, mas esse teste confere o `escola_id` contra `docs/modelo-de-dados.md` (`:886-1018`). Nada nele liga campo pessoal ao mapa de dados de `docs/lgpd.md`; não há teste no repositório que leia `lgpd.md` contra o schema. Como está, a regra afirma que existe teste onde não existe. A correção exigida: "só a revisão garante (`privacy-guardian`)", ou um teste de verdade.
5. **`.claude/rules/40-testes.md:110`, item 5, cita uma guarda que cobre só parte do item.** O item fala de `.skip`, teste comentado, `any` e asserção que sempre passa. A `guardas/teste-sem-desligar` não cobre o `any`, que é o `@typescript-eslint/no-explicit-any` do `eslint.config.mjs:53`, nem a asserção que sempre passa. A correção exigida: manter a guarda e acrescentar "só a revisão garante (`test-engineer`)" para o que ela não cobre, ou partir o item em dois.

Recomendações:
- Estas checagens também parecem parciais, e o guardião de cada uma deve confirmar:
  - `10-multitenancy.md:92`, item 8, para o `tenancy-guardian`. A linha cita `arquitetura.test.ts`, que prova o `PainelRepository` do operador e não a camada de rede da secretaria.
  - `30-camada-ia.md:95`, item 8, para o `llm-integrator`. O `adaptador-resiliente.test.ts` cobre timeout e retry, mas não o orçamento de tokens.
- No bloco de `ARQUIVO_DAS_GUARDAS` (o último da 16.0), citar "a amostra certa passa" em vez de "o arquivo das guardas ausente". Com a mutação, este último fica vermelho só porque o texto da mensagem muda.
- O comentário de `MINIMO_DE_ITENS` (`checagens.test.ts:23`) fala em "quantas checagens de cada tipo", mas os mínimos por tipo estão soltos em `:207-210` (80, 8, 100, 40). Dar nome a eles.
- Limite que o cabeçalho de `caminhos.test.ts` não declara: o `./` solto no fim de uma frase leva o ponto junto (`./apps/x.ts.`) e vira falso vermelho.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 00:12:15 · `tasks/prd-harness/16_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

As duas correções da 1ª rodada foram feitas:
1. Na `.claude/rules/10-multitenancy.md:92`, a referência a `apps/api/test/arquitetura.test.ts` saiu. A checagem cita agora `packages/shared/src/permissao/matriz.test.ts`, que tem o caso da linha 34: a rede nunca tem alcance individual, em toda célula. Cita também `packages/nucleo/src/identidade/tabelas-de-identidade.int.test.ts`, cuja linha 78 mostra que o banco recusa usuário com papel `rede`. O `tenancy-guardian` continua na linha.
2. Na `.claude/rules/20-lgpd-menores.md:41`, a checagem agora é "só a revisão garante (`privacy-guardian`)".

O resto do diff está de acordo:
- **Arquivos citados:** todos os testes novos que as linhas `Checagem:` citam existem. Os itens que só cobriam parte do que a regra pede (regra 20 itens 2, 3 e 14; regra 40 item 5; regra 50 item 1; regra 70 itens 4d e 7; regra 80 item 4) passaram a dizer "só a revisão garante" e a listar à parte "o que há de teste". Assim nenhuma linha afirma uma cobertura que não existe.
- **Bytes da base fixa:** a conta foi atualizada no `16_task.md` e na `techspec.md` §11, e confere com o arquivo: CLAUDE.md mais as regras 10, 20 e 70 somam 39.535 B.
- **Mutações:** os blocos novos batem com os casos de teste novos. A mutação equivalente do `.replace(/^\.\//, '')` vem com o motivo escrito.

Recomendações:
- A base fixa está a 465 B do limite de 40.000 B do RF20. A próxima tarefa que acrescentar texto ao CLAUDE.md ou às regras 10, 20 e 70 vai reprovar no `tools/processo/harness/base-fixa.test.ts`. Vale anotar isso no `TODO.md` ou na 21.0, para não ser surpresa.
- O item 13 da regra 20 deixou de citar `apps/api/test/provedores-da-escola.int.test.ts`, que existe, e o motivo não está registrado no `16_task.md`. Se ele foi tirado por não provar o item, uma linha dizendo isso evita que alguém o devolva na 21.0.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/10-multitenancy.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/20-lgpd-menores.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/16_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/base-fixa.test.ts

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-24 00:12:17 · `tasks/prd-harness/16_task.md`

VEREDITO: APROVADO

A única correção exigida na 1ª rodada foi feita. O diff só mexe em linhas `Checagem:` das regras, em documentos da spec e em testes do harness. Nenhum campo, rota, log, armazenamento ou envio externo do produto mudou.

**Correção exigida na 1ª rodada**
1. Item 13 da regra 20: feita. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/20-lgpd-menores.md:127` saiu `apps/api/test/provedores-da-escola.int.test.ts`, que é o teste dos domínios Google e Microsoft (D48). A linha agora diz `` Checagem: `packages/nucleo/src/ia/provedor.test.ts`, `privacy-guardian`. `` É a opção que a correção aceitava. O caso `criarProvedorDeIa: sem nada configurado, a porta é a do adaptador falso` existe em `packages/nucleo/src/ia/provedor.test.ts:159`.

**Outras citações novas no diff, conferidas contra o que dizem**
- **Regra 20, item 2:** `contratos.test.ts:129` recusa e-mail em contrato que pode chegar ao aluno, e `documento-na-matricula.test.ts` pega CPF na importação. As duas citações provam o que dizem.
- **Regra 20, item 3:** passou a citar `tabelas-do-mvp.int.test.ts` só como "o que há de teste", sem tirar o "só a revisão garante". Isso é honesto: o teste usa a adaptação como tipo (`fonte_ampliada`), mas não prova que não existe campo de diagnóstico.
- **Regra 20, item 12:** acrescentou `provedor.test.ts`, que tem o caso de entrada com nome de aluno recusada antes do modelo (`provedor.test.ts:412`). Bate com o item.
- **Regra 20, item 14:** agora diz que só a revisão garante que a camada de rede não chega à conversa, e lista `retencao.int.test.ts` e `tutor.int.test.ts` como o que há de teste. Não afirma cobertura que não existe.
- **Regra 30, item 4:** `provedor.test.ts:230-321` prova o registro de cada execução. Bate.
- **Regra 10, item 8:** `matriz.test.ts:34` ("a rede nunca tem alcance individual") bate com a camada de rede só no agregado.
- **Base fixa:** 39.535 B (CLAUDE.md mais as regras 10, 20 e 70), abaixo do teto de 40.000 B do RF20.
- **Testes:** `vitest run tools/processo/harness/` passou, 278 de 278.

**Resumo no formato pedido**
- Campos pessoais tocados: nenhum. O diff só muda linhas `Checagem:` das regras, documentos da spec e testes do harness.
- Fora da tabela de dados do docs/lgpd.md: nada.
- Autorização por objeto: não se aplica, nenhuma rota mudou.
- Logs: limpos, nenhum log novo.
- Auditoria: não se aplica, nenhuma ação auditável nova.
- Envio externo: nenhum novo.
- Seed/fixture: sintético. As amostras dos testes do harness são texto de regra, e os CPFs citados em `documento-na-matricula.test.ts` são sintéticos.
- Bloqueantes: nenhum.

**Recomendações (não bloqueiam; ficam para o `/validar` e o `/retro`)**
1. **Regra 20, item 13:** `provedor.test.ts` prova só que o padrão é o adaptador falso. Não prova que um provedor sem contrato que vede treinamento, permita uso por menor e diga onde processa fica de fora. Acrescentar à linha "só a revisão garante a escolha pelo contrato", para não sugerir cobertura que o teste não tem.
2. **Regra 20, item 14:** citar também `packages/shared/src/permissao/matriz.test.ts` ("a rede nunca tem alcance individual"). É o que mais se aproxima de provar a segunda frase do item.
3. **Regra 20, item 2:** a linha diz que só a revisão garante a data de nascimento, mas `documento-na-matricula.test.ts` também marca data na importação. Ajustar o texto para "CPF e data na importação".

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/20-lgpd-menores.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/packages/nucleo/src/ia/provedor.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/apps/api/test/contratos.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/packages/shared/src/estrutura/documento-na-matricula.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/packages/shared/src/permissao/matriz.test.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 00:13:04 · `tasks/prd-harness/16_task.md`

VEREDITO: APROVADO

Cenários exigidos: as cinco correções da 1ª rodada. São elas: o lookbehind do `./` com caso e bloco; a extensão `.md` do nome da regra com amostra e bloco; um bloco, ou uma linha no "Sem bloco", para cada cláusula listada; o item 1 da regra 20 sem a citação que não o prova; o item 5 da regra 40 partido entre a guarda e a revisão. Também as `Checagem:` que mudaram nesta rodada, para ver se o que citam fica perto do item.

Cobertos:
- **Correção 1:** o caso "o ./ só conta solto" está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/caminhos.test.ts:246-250` e exige zero problemas e zero conferidos. Tirado o lookbehind, `a./docs/inexistente.md` vira o token `./docs/inexistente.md`, que é conferido e acusado. O teste fica vermelho, e o bloco o cita.
- **Correção 2:** a amostra `15-rascunho.txt` está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/checagens.test.ts:306`. Com `/^(\d+)-/`, ela vira regra 15 com um item sem `Checagem:`, e a lista de problemas deixa de ser vazia. Tem bloco.
- **Correção 3:** cada cláusula tem o seu bloco, e conferi que cada teste citado fica vermelho com a mutação.
  - O `partes.push` cai na primeira asserção de "na linha de continuação": o inexistente da continuação deixa de ser acusado.
  - O `^\s+` cai em "sem recuo, dentro do item, também vale" (`checagens.test.ts:291-293`).
  - O `if (false)` cai em "a amostra certa passa": `apps/api/test/a.test.ts` passa a não ser teste, guarda nem revisor.
  - O `throw` no `catch` cai em "o arquivo das guardas ausente".
  - O `.isDirectory()` cai no caso `existe.ts/x-<y>` (`caminhos.test.ts:240`), em que a "pasta" é o arquivo `apps/api/src/existe.ts` da amostra.
  - O `.replace(/^\.\//, '')` do `problemaDoCaminho` está no "Sem bloco", com o motivo de mutação equivalente, porque o `join` normaliza o `./`. O motivo procede.
  - O bloco do `ARQUIVO_DAS_GUARDAS` passou a citar "a amostra certa passa". Também fica vermelho: o arquivo vem vazio, `log-x` não é achada e a lista de problemas deixa de ser vazia.
- **Correção 4:** a regra 20, item 1, agora diz só "só a revisão garante (`privacy-guardian`)".
- **Correção 5:** a regra 40, item 5, ficou com a guarda para o `.skip` e o `.only` e com a revisão (`test-engineer`) para o teste comentado, o `any` e a asserção que sempre passa.
- **Checagens novas:** conferi as citações novas por amostra, e todas ficam perto do item.
  - Regra 10, item 8: `matriz.test.ts:34-38` prova que a rede só tem "nunca" ou "agregado".
  - Regra 80, item 2: `vagas.int.test.ts:165` prova que o interativo começa antes de mil lotes.
  - Regra 70, item 4b: `MenuDaPessoa.test.tsx:66` prova o "Sair" do mesmo tamanho (D59).
  - Os itens só em parte cobertos ficaram com "só a revisão garante" e uma lista "o que há de teste", e não afirmam cobertura que não existe.
- Rodei `npx vitest run` nos dois arquivos: 47 de 47 passam. Não há `.skip` nem teste comentado, e nenhum teste chama provedor de IA.

Bloqueantes: nenhum.

Recomendações:
- O caso `'../../docs/inexistente.md'` (`caminhos.test.ts:247`) não mata a mutação sozinho. Sem o lookbehind, o token sai como `./../docs/inexistente.md`, e o `ehCaminho` já o recusa porque ele não começa por uma pasta da raiz. Quem mata a mutação é só o `a./`. Vale dizer isso no nome do caso, ou trocar por um exemplo em que a letra ou o `-` antes do `./` seja o que decide, como `x-./docs/…`.
- A mensagem "a pasta apps/api/src/existe.ts não existe" sai quando o caminho existe e é um arquivo. Ela confunde quem lê; "não é pasta" seria mais preciso. Fica para a 21.0, que move a extração.
- O bloco do `ARQUIVO_DAS_GUARDAS` trocou de teste citado sem uma linha que diga o motivo. É só registro, para o `/retro`.

# Achados das revisões — `tasks/prd-harness/18_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-24 01:13:07 · `tasks/prd-harness/18_task.md`

```
VEREDITO: APROVADO
Tabelas verificadas: nenhuma. A tarefa não cria migration, schema nem tabela de domínio (nada em apps/ ou packages/).
Queries verificadas: nenhuma. A tarefa não mexe em repository, query nem endpoint; o diff fica em .claude/, docs/, tasks/ e tools/processo/harness/.
Teste de isolamento: não se aplica. Não há código de domínio novo. O que importa ao isolamento é se o processo continua cobrando o teste, e continua:
  - A pergunta "o teste de isolamento quebraria sem a cláusula de escopo do repository?" saiu de .claude/skills/executar-task/SKILL.md e foi para o item 11 da Autoconferência em .claude/skills/criar-tasks/task-template.md.
  - A linha "isolamento entre escolas | integração" continua na tabela de testes do modelo.
  - A tabela que diz quando chamar o tenancy-guardian continua em .claude/skills/criar-tasks/SKILL.md:79. O texto repetido em revisar-tarefa agora aponta para essa tabela e para tools/processo/guardioes-por-caminho.ts.
  - A lista "O que verificar" de .claude/agents/tenancy-guardian.md é igual a tools/processo/harness/__fixtures__/revisores-antes/tenancy-guardian.verificar.md, conferida com diff (só muda o corte da seção na comparação).
  - npx vitest run --project unidade tools/processo/harness/: 444 de 444 passando.
Bloqueantes: nenhum
Recomendações:
  - docs/processo-licoes.md, linha 23: a lição que mais causou reprovação no F1 (teste com uma escola só) aponta só para a Autoconferência 3 do task-template.md. Ela também deveria apontar para o item 11, que é onde a pergunta do isolamento ficou.
```

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-24 01:13:28 · `tasks/prd-harness/18_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A tarefa só muda texto do processo (papéis em `.claude/agents/`, skills e documentos). Não toca migration, schema, DTO, rota, log de runtime nem chamada a provedor. Os nomes que aparecem em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/processo-licoes.md` são os de Joaquim e Gabriel, que constroem o produto e já estão no `CLAUDE.md`. Ali não há dado de aluno, responsável ou professor de escola.

Fora da tabela de dados do docs/lgpd.md: nada, porque não entra campo novo.

Autorização por objeto: ok. Não se aplica, porque não há rota nova.

Logs: limpos. Nenhum log foi acrescentado.

Auditoria: presente. Nenhuma ação que exija auditoria foi criada ou mudada.

Envio externo: nenhum.

Seed/fixture: sintético. As oito fixtures em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/__fixtures__/revisores-antes/` são cópias do texto dos papéis. A de `privacy-guardian.verificar.md` é igual ao checklist do papel na HEAD. Também procurei no `revisores.test.ts` padrões de e-mail ou de CPF e não achei nenhum.

O que conferi para ver se a regra 20 perdeu proteção:
- **Checklists do `privacy-guardian`.** Coleta, exposição, log e rastro, IA, ciclo de vida, a pergunta de fechamento e o formato da resposta não mudaram. Agora o `revisores.test.ts` trava esse texto contra o que foi gravado antes da tarefa, então ele não se dilui sem um teste ficar vermelho. O bloco das fotos só foi quebrado em três parágrafos. O que pede para olhar na tela (nome, matrícula ou conteúdo onde a regra pede id, agregado ou nada) continua palavra por palavra.
- **Quem dispara o veto de privacidade.** Antes o `revisar-tarefa` repetia a lista ("dado de pessoa, log, storage ou envio externo pede `privacy-guardian`"). Agora ele aponta para a tabela única em `criar-tasks/SKILL.md`, que mantém a linha do `privacy-guardian` com a mesma natureza, e para `tools/processo/guardioes-por-caminho.ts`, onde `OS_QUATRO` inclui o `privacy-guardian`. O gatilho continua existindo.
- **`executar-task` e `task-template.md`.** Nenhuma linha que saiu tratava de LGPD, log, seed ou dado de pessoa. A pergunta 12 da autoconferência ("Onde o plano atende cada item de 'O que verificar' dos guardiões marcados") continua obrigando a responder ao checklist deste papel. O arquivo tem 342 linhas.
- **`docs/decisoes.md` e regra 80.** As mudanças são notas de revisão da D79, o fechamento da identidade visual pela D80 e uma nota sobre onde a sessão é lida. Nada disso afeta tratamento de dado pessoal.

Pergunta de fechamento: sem efeito. A tarefa não muda o que o sistema guarda sobre um aluno nem para onde envia.

Bloqueantes: nenhum.

Recomendações:
- O `revisar-tarefa` deixou de listar ali mesmo as naturezas que pedem cada guardião, e quem lê precisa abrir outros dois arquivos. Se uma nova tabela de natureza aparecer depois noutro lugar, a deduplicação desta tarefa volta. Vale um teste que procure nas skills uma segunda tabela "Se a tarefa..." ou "Se a spec..." com a coluna de guardião. Fica para a retro, não bloqueia.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-24 01:13:31 · `tasks/prd-harness/18_task.md`

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
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/rules/80-infra-e-carga.md:61-63`: a nota cita um só limite da N2, o p95 de `sessao.leitura.duracao` até 50 ms no cenário `rajada`. A R40 (`tasks/prd-reengenharia/DECISOES.md:106`) e a `onda-5.md:82` também exigem espera do pool de no máximo 100 ms. Do jeito que está, quem ler só a regra pode fechar a N2 com o pool engasgado. Ponha os dois limites na nota.
- Na mesma nota, "Postgres, medido" só cita a métrica de leitura. Vale citar também `observarPoolDoBanco` (`apps/api/src/main.ts`), para que quem for medir encontre as duas fontes.

O que conferi:
- As afirmações da nota da regra 80, item 5, batem com o código. A sessão é lida do Postgres em `packages/nucleo/src/identidade/guarda-sessao.ts`, a métrica está em `packages/nucleo/src/telemetria/metricas.ts:120` e o critério é o da R40. A nota não afrouxa a regra: "nada em memória do processo" continua valendo, e o Postgres é compartilhado entre as instâncias.
- No `infra-guardian.md`, "O que verificar" e o formato da resposta não mudaram. Só trocou o texto "para o `/validar` e o `/retro`" por "para a validação e a retro".
- O `executar-task/SKILL.md` perdeu o diário, mas as perguntas de carga e de concorrência continuam no `task-template.md` como itens 8 e 10 da Autoconferência. Isso cobre o teste em paralelo, a ordem forçada e quem chama, quantas vezes por segundo e o que grava. A origem de cada pergunta está registrada em `docs/processo-licoes.md`.
- Rodei `npx vitest run --project unidade tools/processo/harness/`: 9 arquivos, 444 testes, todos verdes. Nenhum teste chama provedor pago.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-24 01:13:41 · `tasks/prd-harness/18_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa só mexe em textos do processo (papéis dos revisores, skills, documentos) e em um teste de `tools/processo/harness/`. Não toca em schema, repository, job, seed, importação nem webhook, então não abre caminho de escrita em `Nota`. Todos com autor humano? Sim, porque não há nenhum caminho novo.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. A tarefa não muda nenhum fluxo de saída de IA, e a exceção do tutor (D47) não aparece estendida a outro agente em nenhum texto alterado.

Supervisão do tutor: ok. Nada no diff trata do tutor.

Autonomia declarada e visível: sim. Nada mudou aqui.

Bloqueantes: nenhum.

O que conferi:
- **Regra 70 e `docs/regulacao.md`:** `git diff` vazio nos dois arquivos.
- **Minha lista "O que verificar" e meu formato:** são iguais, item por item, à versão do HEAD e às gravações de antes em `tools/processo/harness/__fixtures__/revisores-antes/conformidade-reviewer.verificar.md` e `conformidade-reviewer.formato.md`. Os nove itens estão lá, inclusive o D46/D55 (nota proposta) e o D45 (medir o professor).
- **O que mudou em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/agents/conformidade-reviewer.md`:** o bloco das fotos foi partido em três parágrafos sem perder conteúdo. Dos itens que eu confiro na tela, nenhum caiu: saída de IA marcada como IA, D55, o que o professor vê antes de aprovar, autonomia em português comum, D59. Na severidade, `/validar` e `/retro` viraram "a validação e a retro".
- **Tabela única por natureza em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/criar-tasks/SKILL.md`:** a linha da `conformidade-reviewer` ganhou "indicador de professor", que antes só estava no `revisar-spec`. Isso amplia o gatilho do item 8 da regra 70 em vez de reduzir.
- **`revisar-tarefa`:** a lista que saiu dizia "nota, correção, tutor ou autonomia" e não tinha "decisão sobre aluno" nem "indicador de professor". Agora o texto aponta para a tabela completa, então a cobertura também ficou maior.
- **Conteúdo regulatório perdido:** o que saiu do `executar-task` não continha nenhuma regra de nota, D55, tutor ou aprovação. O que foi para `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/processo-licoes.md` é diário de processo, e cada caso tem data, origem e o lugar onde a regra ficou.
- **`docs/decisoes.md`:** só ganhou anotações "revisto pela D79" e a frase que dá a identidade visual por fechada (D80). Nada encosta nas decisões D7, D44 a D47 ou D55 a D59.
- **Teste:** `npx vitest run --project unidade tools/processo/harness/revisores.test.ts` passou, 65 de 65.

Recomendações:
- A autoconferência nova em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/criar-tasks/task-template.md` (doze perguntas) não tem uma pergunta própria da regra 70. A pergunta 12 cobre isso por tabela, porque manda abrir a lista "O que verificar" dos guardiões marcados. Se a retro mostrar reprovação da `conformidade-reviewer` por algo que o Implementador poderia ter visto antes, vale considerar uma pergunta direta do tipo "algum caminho grava `Nota` sem `lancadaPor`, ou alguma saída em discursiva ou redação sugere nota?". Isso não bloqueia: o teto de doze perguntas é da tarefa.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-24 01:15:06 · `tasks/prd-harness/18_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em `texto.md` (linha da tabela natureza → guardião), na `techspec.md` §9 e no `cenarios.md` C RF21, porque as decisões da 18.0 estão só no `18_task.md`
Portão local: carimbo válido

Bloqueantes:

- **As divergências estão só no `N_task.md`.** Elas ficam em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/18_task.md:79-85`. O `git diff HEAD -- tasks/prd-harness` mostra que `techspec.md`, `cenarios.md` e `texto.md` não mudaram. A coluna "Onde está na spec" cita lugares que não dizem o que a tarefa decidiu:
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/texto.md:51` ainda diz que a tabela natureza → guardião "Fica em `tabela-de-guardioes.md` e o código". A tarefa a deixou em `.claude/skills/criar-tasks/SKILL.md`, ao lado do código. A spec diz uma coisa e o repositório faz outra.
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/cenarios.md:137` (C, RF21) só diz "os blocos iguais". Não aparecem lá três decisões da tarefa:
    - o bloco das fotos em três parágrafos, com o começo e o fim iguais e o meio próprio de cada papel;
    - as duas famílias de severidade, `REPROVADO` e `AJUSTES NECESSÁRIOS`;
    - a seção nova `## O que é bloqueante só para você` do `revisor-geral`.
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/techspec.md:272` (§9) não tem a lista do lugar onde cada contradição ficou. É exatamente a verificação que o `prd.md` RF21 pede ("Lista na Tech Spec com o lugar que ficou"). A 17.0 fez isso no mesmo §9, no parágrafo "O `/seguir` partido (17.0, 24/10/2026)".
  - Também faltam na spec duas mudanças: o `git commit -F` (18.4a) e a nota datada da regra 80.5 (24/10/2026).

  **Correção exigida:**
  1. Acrescentar ao §9 da `techspec.md` um parágrafo "(18.0, 24/10/2026)" com cada contradição e o lugar onde ela ficou, com as seis divergências da tabela e com o `-F`.
  2. Corrigir a linha da tabela no `texto.md:51`.
  3. Acrescentar ao `cenarios.md` C RF21 as três decisões acima: as duas famílias, os três parágrafos das fotos e a seção própria do `revisor-geral`.
  4. Depois, fazer a coluna "Onde está na spec" do `18_task.md` apontar para esses lugares.

Recomendações:

- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/pendencias-dos-mockups.md:31`, `:46` e `:591` ainda dizem `/registrar-decisao`, mas o mesmo arquivo já trocou todo `/descobrir`. O arquivo ficou meio convertido.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/vigia/SKILL.md:30` aponta "passo 3 de `.claude/skills/seguir/SKILL.md`". Desde a 17.0 o passo 3 mora em `passos/3-time-e-andar.md`. Já que a linha foi reescrita, vale apontar o arquivo do passo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/descobrir/SKILL.md:11` diz "A razão de este comando existir": é o vocabulário que a tarefa tirou no resto da skill.
- A tabela "Arquivos previstos" do `18_task.md` não lista uns quinze arquivos alterados: `CLAUDE.md`, `ROADMAP.md`, sete documentos de `docs/`, `criar-prd`, `descobrir`, `retro`, `validar` (com o `template.md`), `validador.md`, `revisar-spec`, `criar-tasks/SKILL.md` e a regra 80. Todos têm motivo nas contradições, mas o documento devia dizer isso.
- `validador.md:131` foi alterado aqui, e a 19.0 também o tem nos arquivos previstos. É uma linha só e não conflita; fica o registro para a 19.0.

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 01:16:20 · `tasks/prd-harness/18_task.md`

VEREDITO: APROVADO

Cenários exigidos: a tarefa só mexe em texto do processo (papéis, skills, docs) e acrescenta um teste de unidade sobre esse texto. Não toca dado de escola, permissão, IA nem operação concorrente, então não há caso de isolamento, de permissão nem de concorrência a exigir. Os cenários são as oito linhas da tabela de testes do `18_task.md`, que repetem o RF21 e o RF22 do `cenarios.md` C:
1. RF21: dois blocos que deveriam ser idênticos e diferem, numa amostra.
2. RF21: a lista "O que verificar" de um guardião com veto diferente da gravada, um caso por guardião.
3. RF21: o formato da resposta de um guardião com veto diferente do gravado.
4. RF21: os blocos de hoje, depois da tarefa, iguais.
5. RF22: `executar-task/SKILL.md` com 500 linhas ou mais.
6. RF22: o arquivo depois da tarefa abaixo de 500, e `docs/processo-licoes.md` existe.
7. Guardião ausente da amostra.
8. `rotulos.test.ts` continua verde.

Cobertos (todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/revisores.test.ts`):
1. "uma palavra a mais na severidade de %s", um caso para cada um dos seis com veto e dos três sem veto. Para as fotos, "o começo / o fim do bloco das fotos de %s diferente", nos quatro que têm o bloco.
2. "um item a mais na lista "O que verificar" de %s", nos quatro guardiões com veto. Os quatro são os do RF15.
3. "o formato da resposta de %s diferente", nos quatro.
4. "a severidade de hoje é igual nos seis com veto e nos três sem veto", "o bloco das fotos de hoje…" e "os de hoje são os de antes". Os três cobram um mínimo de textos comparados, e zero comparado é vermelho.
5. "500 linhas: vermelho; 499: verde".
6. "o arquivo de hoje está abaixo de 500 linhas…" e "o documento de lições ausente".
7. "guardião ausente da amostra (%s)", nos quatro. A severidade e as fotos também têm o caso do revisor ausente.
8. `rotulos.test.ts` verde.

O que conferi:
- Rodei o teste da pasta (`npx vitest run --project unidade tools/processo/harness/`): 9 arquivos e 444 casos, todos verdes. Rodei também `npx vitest run --project unidade tools/`: 52 arquivos e 1869 casos, todos verdes.
- A gravação de antes bate com o HEAD. No `git diff`, nenhum dos quatro guardiões muda a lista nem o bloco do formato: a do privacy vai até o título das fotos, e a do conformidade termina no próximo título. Como o teste prova que hoje é igual à gravação, a gravação é igual ao HEAD.
- Cada caso incidente que saiu do `executar-task` tem a sua linha em `docs/processo-licoes.md`, com data, origem e o lugar onde a regra ficou. Nada saiu sem destino.
- Não achei `.skip`, teste comentado nem mock. Nenhum teste chama provedor de IA.
- Revi um a um os blocos de mutação contra o código, sem rodá-los. Todos ficam vermelhos com um cenário que chega à cláusula.

Bloqueantes: nenhum.

Recomendações:
1. `revisores.test.ts:260`, `:270` e `:279`. As três mutações do tipo `=== 'x'` (executar-task, lições e modelo ausentes) ficam vermelhas por exceção: `totalDeLinhas(undefined)`, `linhasDeLicao(undefined)` e `secao(undefined)` lançam erro antes de a asserção falhar. Elas não deixam passar verde falso, porque sem a guarda o teste quebra mesmo assim. Mas o vermelho vem do erro, não do `toContain`. Vale um `expect(() => conferirExecutarTask(...)).not.toThrow()` nos três casos, para o vermelho vir da cláusula.
2. `revisores.test.ts:265`. A busca por `'Autoconferência'` também acha o próprio título `### Autoconferência antes de codar` do `executar-task`. Se as perguntas voltarem para debaixo desse título, o teste continua verde, e só o limite de 500 linhas segura. Conferir também a menção a `criar-tasks/task-template.md`.
3. O `executar-task` diz "as doze perguntas" com o número escrito, e o teste aceita de 10 a 12. Se o modelo mudar de tamanho, a palavra fica errada sem nada falhar.
4. `18_task.md:84` diz "25 casos", mas `docs/processo-licoes.md` tem 26 linhas de lição (linhas 16 a 41).
5. Fora do teste, para o `revisor-geral` ou a validação: `docs/aia/ouro-retido/README.md:4` ainda manda commitar com `(ouro: <política>)`. É a mesma contradição que o `docs/aia/ouro/README.md:7` já resolveu, agora na pasta vizinha.
6. Nenhum teste cobre as linhas da tabela de contradições, nem o `git commit -F` da 18.4a. A tabela de testes não os pede, então não é falha desta tarefa. Fica para a retro decidir se cabe uma busca que fica vermelha se a frase antiga voltar.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 01:23:10 · `tasks/prd-harness/18_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum

As quatro correções da 1ª rodada foram feitas:
1. O `techspec.md` §9 ganhou o parágrafo "Um fato num lugar só (18.0, 24/10/2026)". Ele dá o lugar de cada contradição e traz o `git commit -F` com o motivo, a nota datada da regra 80.5 e o README do `ouro`. O §9 também ganhou "Os blocos repetidos entre revisores (18.3)" e "O `executar-task` sem diário (18.4)". As seis divergências da tabela aparecem nesses três parágrafos.
2. O `texto.md:51` agora diz que a tabela por natureza fica só no `criar-tasks/SKILL.md` e que o caminho fica em `guardioes-por-caminho.ts` e em `tabela-de-guardioes.md`.
3. O `cenarios.md:137` (C, RF21) ganhou as três decisões que faltavam: as duas famílias, `REPROVADO` nos seis com veto e `AJUSTES NECESSÁRIOS` nos três sem veto; as fotos em três parágrafos, com começo e fim iguais; e a seção própria do `revisor-geral`, que fica fora da comparação.
4. A coluna "Onde está na spec" do `18_task.md:84-90` aponta para esses lugares. A tabela de arquivos previstos agora lista todos os arquivos alterados.

Conferi também o que mudou fora da spec. O `executar-task` tem 342 linhas, o `processo-licoes.md` tem 26 casos, e `MODELO_DA_TAREFA` está definido em `revisores.test.ts:26`. Os arquivos de `passos/` que a `vigia` cita existem, e a R40 está em `tasks/prd-reengenharia/DECISOES.md:106`. A mutação do `18_task.md` acompanhou a linha nova do teste.

Recomendações:
- `.claude/rules/80-infra-e-carga.md:65`: a nota diz que as duas métricas saem de `observarPoolDoBanco` e da leitura de sessão em `apps/api/src/main.ts`. Só `observarPoolDoBanco` está no `main.ts`. A métrica `sessao.leitura.duracao` é medida em `packages/nucleo/src/identidade/guarda-sessao.ts`, com o nome em `packages/nucleo/src/telemetria/metricas.ts:120`. Corrigir o caminho na nota.
- `tasks/prd-harness/techspec.md`, parágrafo 18.3: a última frase diz que o `pedagogia-reviewer` mudou "só a frase 'para a validação e a retro'". Duas linhas antes, o mesmo parágrafo o põe entre os quatro que ganharam o bloco das fotos em três parágrafos. Tirar o `pedagogia-reviewer` dessa última frase, ou dizer que ele também ganhou o bloco.
- Pela tabela de recomendações do `18_task.md`, a linha do `validador.md:131` ficou para a 19.0. Quem fizer a 19.0 precisa saber que essa linha já foi alterada aqui.

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 01:23:21 · `tasks/prd-harness/18_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada (RF21, os blocos iguais entre revisores; RF22, o `executar-task` sem diário), mais o que este diff mexe. Neste diff isso quer dizer duas coisas. A conferência do `executar-task` agora cobra que ele aponte para `.claude/skills/criar-tasks/task-template.md`, e não só que tenha a palavra "Autoconferência". E as três amostras de arquivo ausente agora precisam dar vermelho por asserção, e não por exceção.

Cobertos:
- **O apontamento para o modelo da tarefa.** Agora o teste cobra o caminho do `task-template.md`: `revisores.test.ts:265`, e o teste "o executar-task que não aponta para as lições nem para a autoconferência" em `revisores.test.ts:490-494`.
  - A amostra troca o caminho por `docs/outro.md`.
  - O bloco de mutação em `18_task.md` (perto da linha 262) bate letra por letra com a linha 265.
  - Se a linha 265 sair, a falha esperada some e o teste fica vermelho pela própria cláusula.
  - O `executar-task/SKILL.md:55` cita o caminho de hoje, então a amostra de hoje fica verde.
- **A recomendação da 1ª rodada sobre as três mutações `=== 'x'`** (linhas 260, 270 e 279) foi atendida.
  - Os testes "o executar-task ausente", "o documento de lições ausente" e "o modelo sem a seção…" ganharam `expect(() => conferirExecutarTask(amostra)).not.toThrow()`.
  - Com a mutação, o caminho do `else` lê o arquivo ausente e lança erro. O teste então fica vermelho numa asserção nomeada, e não por uma exceção solta.
- **Rodei `npx vitest run tools/processo/harness/revisores.test.ts`:** os 65 testes passaram.
- **O resto do diff não tem cláusula de teste nova:**
  - texto na regra 80 (nota do item 5 com os dois limites da N2), em `descobrir`, `vigia`, `pendencias-dos-mockups.md`, `processo-licoes.md` e `TODO.md`;
  - a tabela de divergências e a de recomendações do `18_task.md`;
  - a linha do RF21 no `cenarios.md`;
  - a seção nova da `techspec.md` §9 e a linha do `texto.md`.
  - A linha nova do RF21 no `cenarios.md` descreve o que o `revisores.test.ts` já confere: as duas famílias de severidade, as fotos em três parágrafos, o guardião ausente e a seção própria do `revisor-geral`. Não ficou cenário novo sem teste.
- Não há `.skip`, mock nem chamada a provedor. Também não há concorrência: é texto do processo.

Bloqueantes: nenhum.

Recomendações:
- **O apontamento ficou só no caminho.** A conferência do `executar-task` (`revisores.test.ts:265`) não exige mais a palavra "Autoconferência". Se o `SKILL.md` citar o `task-template.md` por outro motivo e perder a frase que manda para a seção, o teste continua verde. Vale levar à retro: exigir os dois, ou o caminho junto com o título da seção.
- **Ficam as recomendações da 1ª rodada que foram para a retro ou para o `TODO.md`,** como o `18_task.md` registra:
  - "as doze perguntas" escrito por extenso, com a faixa de 10 a 12 no teste;
  - o `docs/aia/ouro-retido/README.md:4`;
  - nenhum teste para a tabela de contradições nem para o `git commit -F`.

Arquivos que conferi:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/revisores.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/18_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/skills/executar-task/SKILL.md

# Achados das revisões — `tasks/prd-identidade-e-tenancy/8_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 10:03:10 · `tasks/prd-identidade-e-tenancy/8_task.md`

VEREDITO: REPROVADO

Rodei os 18 testes de integração da tarefa (`npx vitest run --project integracao apps/api/test/estrutura`) e todos passaram. Depois conferi cada cenário perguntando se o teste falharia caso a regra saísse do código.

**Cenários exigidos:**
- Caminho feliz (RF2) e paginação.
- Recorte da D43 na rota e no banco.
- Série, disciplina e ano repetidos dão `CONFLITO` sem o valor na resposta, inclusive com dois pedidos em paralelo.
- Dois `abrir` em paralelo em anos diferentes deixam um só ano em curso.
- Segundo clique em `abrir` e em `encerrar`.
- Virada de ano: "7ºA" em 2026 e em 2027 coexistem, e "7ºA" e "7ºa" conflitam no mesmo ano.
- Escola sem ano em curso: turma falha fechada, e criar e abrir ano funcionam.
- Ano encerrado não aceita turma nova, nem numa corrida com o encerramento.
- Permissão: professor e aluno não usam nenhuma rota de estrutura.
- Isolamento: `abrir` e `encerrar` com id de B, série de B, ano de B ou de outro ano letivo, e listagens sem B.
- **FK composta de `turma` impedindo série ou ano de outra escola** (subtarefa 8.1 e coluna "O que prova" da tabela de testes).

**Cobertos:** todos os itens acima, menos o último. Pelo que conferi à mão:
- Tirar a cláusula de escola de `AnoLetivoRepository.mudarSituacao` ou de `porId` faz o teste de isolamento de `abrir`/`encerrar` voltar 200 ou 409 no lugar de 404, e ele fica vermelho.
- Tirar a cláusula de escola dos `listar` de ano, série e disciplina faz a listagem trazer linhas de B, e o teste fica vermelho.
- Tirar a cláusula de ano de `TurmaRepository.listar` quebra o teste do "7ºA" em estrutura.int.test.ts:249.
- Tirar o índice único parcial deixa dois anos em curso, e o teste de concorrência fica vermelho.
- Os testes de concorrência usam `Promise.all` de verdade. A trava `FOR SHARE` é provada com uma transação aberta em paralelo e espera pelo lock.
- Não há `.skip`, nem teste comentado, nem mock de coisa nossa. A tarefa não chama IA.

**Bloqueantes:**

1. **As FKs compostas `turma_serie_da_escola_fk` e `turma_ano_letivo_da_escola_fk` não têm teste que prove que existem** (packages/nucleo/drizzle/0009_serie_disciplina_turma.sql, as linhas `ALTER TABLE "turma" ADD CONSTRAINT ... _da_escola_fk`; packages/nucleo/src/db/schema/turma.ts:36-37).
   - O teste de isolamento da série de B (apps/api/test/estrutura-isolamento.int.test.ts:91) e o do ano de B (:104) param antes, no serviço. O primeiro para em `SerieRepository.porId`, o segundo na comparação com o ano do contexto em turma.service.ts:29. Nenhum dos dois pedidos chega ao banco.
   - Resultado: se a migration trocar as FKs compostas por uma FK simples (`serie_id → serie.id`) ou não tiver FK nenhuma, os 18 testes continuam verdes.
   - A sua mutação à mão mostrou o efeito da FK (500 no lugar de 404), mas isso não ficou gravado em teste.
   - A tabela da tarefa diz que esses testes provam "FK composta e escopo do repository", e hoje só o escopo está provado.
   - **Correção exigida:** um teste de banco no mesmo formato do de `serie_no_recorte` (estrutura.int.test.ts:126-141). Com um `pg.Client` direto, inserir em `turma` com `escola_id` de A:
     - uma linha com `serie_id` de B, esperando `{ codigo: '23503', restricao: 'turma_serie_da_escola_fk' }`;
     - uma linha com `ano_letivo_id` de B, esperando `{ codigo: '23503', restricao: 'turma_ano_letivo_da_escola_fk' }`.

     Os dois ficam vermelhos se a FK composta sair ou virar simples.

**Recomendações (não bloqueiam):**
- O `expect.poll` do teste de concorrência (estrutura.int.test.ts:301-308) usa o prazo padrão do Vitest (1 s). Com a esteira carregada ele pode falhar sem motivo real. Vale passar `{ timeout: 5000 }`.
- Faltam os checks `turma_turno_valido`, `disciplina_area_valida`, `turma_nome_preenchido` e `disciplina_nome_preenchido`, na rota (turno ou área fora da lista dá `ENTRADA_INVALIDA`) e no banco.
- "Turma escrita de três jeitos": hoje só maiúscula e minúscula estão cobertas. Vale incluir espaço nas pontas (`" 7ºA "` contra `"7ºA"`, que o `trim` do contrato faz conflitar) e registrar que `"7º A"` e `"7A"` são turmas diferentes por decisão.
- O teste de permissão cobre professor e aluno, mas não o papel `rede`. A matriz já diz `nunca` para ele, e um caso na rota ao menos em `GET /v1/turmas` fecharia a regra 10, item 8, no módulo.
- O teste de isolamento das listagens (estrutura-isolamento.int.test.ts:121) só pega vazamento no `listar` de turmas se a cláusula de escola e a de ano saírem juntas. A própria nota da implementação diz isso, e o teste do "7ºA" cobre a cláusula de ano. Vale um comentário no teste apontando para lá.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/estrutura.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/estrutura-isolamento.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/ (repositories, services, controllers, entrada.ts)
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0009_serie_disciplina_turma.sql
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz.ts e matriz.expectativa.ts

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 10:09:26 · `tasks/prd-identidade-e-tenancy/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos (rodada 2):** a única correção pedida na 1ª rodada. É um teste que acessa o banco direto e prova que as FKs compostas `turma_serie_da_escola_fk` e `turma_ano_letivo_da_escola_fk` existem e barram cada caso.

**Cobertos:**
- **A correção exigida foi feita.** Está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/estrutura-isolamento.int.test.ts:123-143`.
  - O teste usa `pg.Client` direto, sem passar pela rota.
  - Primeiro insere uma turma com `escola_id` de A, o ano de A e a série de B, e espera `{ codigo: '23503', restricao: 'turma_serie_da_escola_fk' }`.
  - Depois insere com o ano de B e a série de A, e espera `{ codigo: '23503', restricao: 'turma_ano_letivo_da_escola_fk' }`.
  - Em cada inserção só uma das duas FKs é violada, então o nome da restrição esperado é o certo, sem ambiguidade.
  - Se a inserção passar, o `then(() => undefined)` faz o `toEqual` falhar. Ou seja, o teste falha se qualquer uma das FKs for removida da migration `0009_serie_disciplina_turma.sql:40-41`.
  - A contagem de `'8ºFK'` igual a 0 nas duas escolas confirma que nenhuma linha ficou gravada.
  - O cliente é fechado no `finally`.
- **Recomendações aplicadas em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/estrutura.int.test.ts`:**
  - Linhas 237-240: "7ºa" e " 7ºA " agora dão CONFLITO com "7ºA".
  - Linhas 256-293: turno e área fora da lista, e nome vazio, dão ENTRADA_INVALIDA na rota. Os checks `turma_turno_valido`, `turma_nome_preenchido`, `disciplina_area_valida` e `disciplina_nome_preenchido` são provados pelo código `23514` e pelo nome de cada restrição. Os nomes conferem com a migration (linhas 10, 11, 33 e 34). A contagem final igual a 0 confirma que nada foi gravado.
  - Linha 352: o `expect.poll` ganhou `timeout: 5_000`.
- Não há `.skip`, `.only` nem `todo` nos dois arquivos.
- O que não mudou desde a 1ª rodada não foi reauditado.

**Bloqueantes:** nenhum.

**Recomendações:**
- O papel `rede` fica sem teste na rota porque não existe usuário desse papel no F1; por enquanto só a matriz cobre. Deixar registrado para o `/validar`: quando o papel `rede` tiver usuário, entra um teste de rota provando que a rede só alcança agregado (regra 10, item 8).

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 10:15:28 · `tasks/prd-identidade-e-tenancy/8_task.md`

```
VEREDITO: APROVADO
Tabelas verificadas: serie, disciplina, turma (migration 0009), ano_letivo (unique (escola_id, ano) acrescentado)
Queries verificadas: AnoLetivoRepository.criar/listar/porId/mudarSituacao; SerieRepository.criar/listar/porId; DisciplinaRepository.criar/listar; TurmaRepository.travarAnoEmCurso/criar/listar
Teste de isolamento: presente e efetivo
Bloqueantes: nenhum
Recomendações:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts:29: a conferência do anoLetivoId que vem no corpo fica no service. Hoje não é furo: o ano gravado sai do contexto, no repository (turma.repository.ts:44), e o valor do corpo só serve para recusar. Mesmo assim, vale um comentário no contrato dizendo que esse campo nunca pode chegar ao repository, para ninguém ligá-lo ao insert depois.
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts:57: se a cláusula de escola sair da listagem de turmas, nenhum teste quebra. Quem segura o isolamento é o filtro por anoLetivoId, e a nota da tarefa já registra isso. Se a 9.0 ou a 10.0 criar uma listagem por ano que não seja o em curso, ela precisa de um teste com linhas de B no mesmo formato.
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/contexto/escola-do-contexto.ts: as seis cópias locais de escolaDoContexto em outros módulos ficaram. Uma tarefa de correção deve levá-las para exigirEscolaDoContexto(), para o escopo ter uma fonte só.
```

A verificação cobriu os 8 itens:

- **Tabelas (itens 1 e 6):** as três tabelas novas têm escola_id NOT NULL e id UUIDv7. A turma tem ano_letivo_id e FKs compostas (escola_id, serie_id) e (escola_id, ano_letivo_id).
- **Repositories (item 2):** todos tiram a escola de exigirEscolaDoContexto() e o ano de exigirAnoEmCurso(). O ano no contexto vem da linha da sessão no banco, não do cliente.
- **Entrada (item 3):** os contratos zod são `.strict()` e nenhum aceita escolaId, nem no corpo nem na query.
- **Remoção mental das cláusulas (item 4):**
  - Sem a cláusula de escola, `abrir` com o id de B esbarra no índice parcial e dá 409, e `encerrar` responde 200. O teste espera 404, então quebra.
  - Sem a cláusula de escola em SerieRepository.porId, a série de B passa. A FK composta recusa, e o mapeamento transforma isso em ERRO_INTERNO (500). O teste espera 404, então quebra.
  - Sem a cláusula de escola, as listagens de anos, séries e disciplinas passam a trazer as linhas de B, e o teste quebra.
- **404 igual (item 5):** o id de B, o id inexistente e o id fora do formato dão a mesma resposta 404 NAO_ENCONTRADO, com a mesma mensagem. O teste compara as três.
- **Itens 7 e 8:** não se aplicam. A tarefa não tem consulta da camada rede nem `@SemEscopo()`.

Rodei `npx vitest run --project integracao apps/api/test/estrutura-isolamento.int.test.ts`: 6 de 6 passaram.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 10:15:30 · `tasks/prd-identidade-e-tenancy/8_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test)")
Bloqueantes: nenhum

Três pontos vão além da Tech Spec original, mas não foram decididos em silêncio. Estão registrados em "Notas da implementação" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/8_task.md` e já entraram nas seções 3 e 4 da `techspec.md`:
- a ação `turma.listar` na matriz;
- `unique (escola_id, ano)` em `ano_letivo`;
- o `anoLetivoId?` do corpo da turma, que só confere.

Os três protegem mais do que o desenho original e não invadem a 9.0 nem a 10.0:
- `turma.ler` do professor segue `turma_vinculada`, para a 9.0.
- `encerrar` não mexe em vínculo.

Recomendações:
- **Dois nomes para a mesma coisa.** `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/ano-letivo.ts:7-8` deixa `SITUACOES_DE_ANO_LETIVO` e `SituacaoDeAnoLetivo` como apelidos de `SITUACOES_DO_ANO_LETIVO` e `SituacaoDoAnoLetivo`, e `packages/nucleo/src/index.ts:148-149` ainda os exporta. Ninguém fora do schema usa os apelidos. Remova-os e use o nome do `@educa/shared`.
- **Lista de áreas e de turnos em dois lugares.** Os checks `disciplina_area_valida` (`disciplina.ts:29-31`) e `turma_turno_valido` (`turma.ts:39`) digitam de novo as listas que já estão em `AREAS_DO_CONHECIMENTO` e `TURNOS`. Se alguém mudar a lista no `shared`, o banco diverge sem nada acusar. Vale gerar o `in (...)` a partir da constante, ou ter um teste que compare as duas.
- **Mesma responsabilidade em dois arquivos do módulo.** `EscolaSessaoRepository` (`apps/api/src/estrutura/escola-sessao.repository.ts:10`) ainda tem seu próprio `escolaDoContexto()`, e os repositories novos, no mesmo módulo, usam `exigirEscolaDoContexto()`. A nota da tarefa deixa as seis cópias antigas fora do escopo. Anote a troca em `TODO.md` ou numa correção, para não sobrar um terceiro jeito de fazer isso.
- **Regra do corpo no service.** `turma.service.ts:29` compara o `anoLetivoId` do corpo com o ano em curso fora da transação. Está correto, porque a trava `FOR SHARE` da linha 32 cobre a corrida. Mas o motivo de a checagem ficar ali só aparece no comentário da classe. Uma função pequena com nome próprio, algo como `conferirAnoDoCorpo`, deixaria isso legível.

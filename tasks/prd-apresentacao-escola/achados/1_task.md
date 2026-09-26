# Achados das revisões — `tasks/prd-apresentacao-escola/1_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-26 10:55:08 · `tasks/prd-apresentacao-escola/1_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- **E1:** ano, série, disciplina e turma pelas rotas da tela; "5º ano" recusado com erro tipado.
- **E2, parte desta tarefa:**
  - renomear disciplina e turma;
  - excluir disciplina com vínculo e turma com vínculo dá `CONFLITO` sem apagar nada;
  - a turma vazia sai.
- **Bordas:**
  - virada de ano (turma de ano encerrado);
  - nome que só muda maiúscula, contra o dela mesma e contra o de outra;
  - vínculo já encerrado segurando a exclusão;
  - id fora do formato;
  - excluir de novo o que já saiu;
  - campo a mais no corpo.
- **I3:** `PATCH` e `DELETE` com id da escola B dão `NAO_ENCONTRADO`, com o mesmo corpo do UUID aleatório, e B fica intacta.
- **P1:** professor e aluno recebem 404 e nada muda.
- **I9:** as quatro células são `unidade` só na coordenação e `nunca` para professor, aluno e rede.
- **Concorrência:** duas renomeações para o mesmo nome em paralelo, e duplo clique em excluir.
- **Log (A4):** só ids.

Cobertos:
- **E1:** em `apps/api/test/estrutura.int.test.ts`, os dois testes do F1 agora levam o identificador E1.
- **E2:** `apps/api/test/estrutura.int.test.ts:358-534`.
  - Renomear confere a resposta, a listagem e o banco. O `CONFLITO` sai sem o valor, e o próprio nome com outra maiúscula não conflita.
  - Os casos de `ENTRADA_INVALIDA` deixam o banco intacto.
  - Excluir com vínculo pendente e depois encerrado dá `CONFLITO`: o banco mantém os nomes, o vínculo continua lá, e a resposta não traz o nome da restrição nem o valor.
  - A turma vazia e a disciplina livre saem com 204, e um segundo `DELETE` dá 404.
  - A turma do ano encerrado recebe 404, com um controle positivo na turma do ano em curso.
- **Concorrência de verdade, com `Promise.all`:** renomear para o mesmo nome dá 200 e 409 e a perdedora fica intacta (`:420`). Duplo `DELETE` dá 204 e 404 (`:493`).
- **I3, P1, A1, A3 e A4:** em `apps/api/test/escola-montada.int.test.ts`, como varreduras sobre `ROTAS_DA_A1`.
  - Cada varredura termina com um controle positivo, o que impede que uma rota inexistente passe calada.
  - O I3 compara o corpo inteiro nas três formas: id de B, UUID aleatório e id fora do formato. Também confere o estado de B antes e depois.
  - A A4 exige que o número de linhas `http.erro` seja igual ao número de erros provocados, então um log mudo não passa.
- **I9:** `packages/shared/src/permissao/matriz.test.ts:62-71`, além da comparação com `EXPECTATIVA_DA_MATRIZ`.
- **Mutação conferida por mim:** tirei a escola do `delete` em `disciplina.repository.ts`, e o I3 `DELETE /v1/disciplinas/:id` ficou vermelho, como a tabela diz. O arquivo foi restaurado da cópia.
- **Escola como segunda camada na turma:** tirar só a escola do filtro da turma não deixa nenhum teste vermelho. Isso está registrado e é correto. O ano do contexto já é da escola, e os ids de ano são UUID, então nenhum teste consegue separar as duas cláusulas. O ano é provado pelo E2 do ano encerrado, e os dois juntos pelo I3.
- Não há `.skip`, `.only`, `any` nem mock de coisa nossa. Nenhuma IA é envolvida.

Bloqueantes: nenhum

Recomendações:
1. **P1 com o professor dono da turma** (`escola-montada.int.test.ts:227-230`). Hoje o P1 usa `a.turma` e `a.disciplina`, com as quais o professor não tem vínculo. O teste só pega uma célula aberta porque o renomear e o excluir não aplicam `turma_vinculada`. Somar o professor com vínculo confirmado em `turmaComVinculo` e `disciplinaComVinculo`, o atacante realista, deixa o P1 firme mesmo se alguém depois abrir a célula com filtro de vínculo.
2. **Virada de ano e escolas diferentes no renomear.**
   - Renomear a turma do ano em curso para o nome de uma turma do ano encerrado deve dar 200, porque o único é `(escola, ano, lower(nome))`.
   - Renomear a disciplina de A para um nome que existe em B também deve dar 200.
   - Hoje só o lado do conflito está provado.
3. **`PATCH` e `DELETE` de turma sem ano em curso** (entre encerrar e abrir): esperado `NAO_ENCONTRADO`. `exigirAnoEmCurso` já falha fechado, mas as rotas novas não têm teste próprio. O teste de `:298` cobre só criar e listar.
4. **Vínculo confirmado no E2.** O E2 cobre vínculo pendente e encerrado, não o confirmado. A FK não olha o estado, então não bloqueia, mas o confirmado é o caso comum da escola.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/1_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/estrutura.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/exclusao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/disciplina.{controller,service,repository}.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.{controller,service,repository}.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-09-26 11:05:58 · `tasks/prd-apresentacao-escola/1_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da 1ª rodada (E1, E2, I3, P1, I9, concorrência, A4, e as bordas de virada de ano, maiúscula, vínculo encerrado, id fora do formato, exclusão repetida e campo a mais). Esta rodada confere só o diff de teste e se as quatro recomendações foram feitas.

**Cobertos (as quatro recomendações da 1ª rodada foram feitas):**

1. **P1 com o professor dono.**
   - Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts:74,84,92,102`, as quatro rotas ganharam `alvoDoProfessor`.
   - O `montar()` confirma o vínculo pelo próprio professor (`:142-143`) e exige 200.
   - O P1 acrescenta a tentativa "professor com vínculo confirmado" (`:241`) e espera o mesmo corpo `NAO_ENCONTRADO`, com o estado da escola igual antes e depois.
   - Conferi que o ataque é realista. O `turma_vinculada` é lido do banco a cada requisição (`turma.repository.ts:108`), então o vínculo confirmado depois de criar a sessão vale.
   - Se alguém abrir `renomear` ou `excluir` com filtro de vínculo, essa tentativa fica vermelha. No `DELETE` de `turmaComVinculo` ela daria 409, que também difere do 404 esperado.
2. **Renomear sem conflito.**
   - Entre anos, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/estrutura.int.test.ts:573-574`: a turma do ano em curso vira `6ºa` com a `6ºA` do ano encerrado ainda no banco, e dá 200. Se o índice único perdesse o ano, isso daria 409.
   - Entre escolas, em `estrutura.int.test.ts:421-424`: outra escola renomeia a disciplina dela para `Química Orgânica` e recebe o corpo esperado. Se o índice ou a checagem perdesse a escola, isso daria 409.
3. **Sem ano em curso.** Em `estrutura.int.test.ts:556-566`, a função `recusadas()` roda entre encerrar 2026 e abrir 2027, e de novo depois de abrir.
   - `PATCH` e `DELETE` dão 404 com `NAO_ENCONTRADO`.
   - A linha `:570` confirma que a turma antiga continua com o mesmo nome.
   - Um `DELETE` que passasse devolveria 204, e o teste ficaria vermelho.
4. **Vínculo confirmado no E2.** Em `estrutura.int.test.ts:499-505`, o teste passa pelos três estados: pendente, confirmado pelo professor (exige 200) e encerrado. Em cada um, as recusas `CONFLITO` não trazem nome de restrição nem valor.
   - Depois disso, o banco mantém os nomes e o vínculo (`:506-509`).

**Outras conferências:**
- O diff não tem `.skip`, `.only`, teste comentado, `any` nem mock de código nosso.
- O vínculo que o `montar()` confirma acontece antes de `linhasDeLog.length = 0` no A4, então não polui a contagem de `http.erro`.
- Nenhum código de produção mudou desde a 1ª rodada, como o prompt diz.
- Rodei só os dois arquivos de integração pedidos (`escola-montada.int.test.ts` e `estrutura.int.test.ts`): 2 arquivos e 38 testes verdes. Não rodei mutação nesta rodada. O efeito de cada acréscimo foi conferido pelo raciocínio acima, e a mutação da escola no `delete` já tinha sido conferida na 1ª rodada.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-26 11:07:08 · `tasks/prd-apresentacao-escola/1_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova. Foram conferidas as tabelas que as rotas novas escrevem. `disciplina` tem `escola_id`, id UUID e o índice único `(escola_id, lower(nome))`. `turma` tem `escola_id` e `ano_letivo_id`, id UUID, o índice único `(escola_id, ano_letivo_id, lower(nome))` e FK composta para o ano e a série da mesma escola. As FKs de `vinculo` para `turma` e para `disciplina` são compostas e sem cascata (`ON DELETE no action`, em `packages/nucleo/drizzle/0010_vinculo.sql:32,34`). Por isso excluir nunca apaga vínculo em cadeia, e o 23503 só dispara sobre uma linha que o `where` escopado já alcançou. Assim, o `CONFLITO` não revela a existência de dado de outra escola.

Queries verificadas:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/disciplina.repository.ts`, `renomear` e `excluir`: filtram por `exigirEscolaDoContexto()` e pelo id.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`, `renomear` e `excluir`: filtram pela escola do contexto, por `exigirAnoEmCurso()` (o ano vem da sessão e fica fechado se faltar) e pelo id.
- `SerieRepository.porId`, chamado no renomear da turma: filtra pela escola do contexto.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/exclusao.ts:22`: troca o 23503 por um `ErroDeDominio(CONFLITO)` novo, sem levar a restrição nem o `detail` do Postgres.
- Os contratos `esquemaPedidoRenomear{Disciplina,Turma}` são `.strict()`. Um `escolaId` no corpo dá 400, e há teste para isso no E2 e nas variantes do A3.
- Nenhum endpoint lê `escolaId` do corpo nem da query.
- Nas células da matriz, a rede é `nunca` em todas, e nenhuma rota nova é de agregado.
- Não há `@SemEscopo()` nesta tarefa.

Teste de isolamento: presente e efetivo. Conferi retirando as cláusulas de cabeça, sem rodar mutação.
- Sem a escola no `update` ou no `delete` da disciplina, o I3 fica vermelho, porque a disciplina de B muda ou some e o 404 vira 200 ou 204.
- Na turma, tirar só a escola não quebra o I3. Isso é coerente com o esquema, e não é uma falha do teste: o ano em curso vem do token, e a FK composta `(escola_id, ano_letivo_id)` prende o ano a uma única escola, então a cláusula do ano já é escopo de tenant. Tirando escola e ano juntos, o I3 fica vermelho. O ano sozinho é provado pelo E2 com a turma do ano encerrado.
- O I3 compara o corpo do id de B com o de um UUID sorteado e com o de um id fora do formato. O P1 cobre o professor com vínculo confirmado.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts`, no `renomear`: o `throw new Error('série da turma não encontrada')` é um erro sem tipo (regra 00, item 9). Hoje o caminho é inalcançável por causa da FK composta, mas vale um erro tipado ou uma asserção de invariante nomeada.
- A varredura P1 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts` cobre professor e aluno. O papel `rede` só está coberto pelo teste de unidade da matriz (I9). Uma sessão de rede na varredura fecharia a prova também no nível HTTP.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-26 11:07:19 · `tasks/prd-apresentacao-escola/1_task.md`

VEREDITO: APROVADO

Escopo: respeitado. As cinco subtarefas foram feitas. `exclusao.ts` só descreve em comentário o uso que as tarefas 2.0, 4.0 e 6.0 farão dele, e não implementa nada delas. O `for update` da turma, a cascata do acesso, a lista e o pedido ficaram para as tarefas seguintes.

Aderência à Tech Spec: ok. As três divergências de arquitetura já estão na `techspec.md`, seção 4:
- o 23503 é traduzido só em `exclusao.ts`;
- o vínculo encerrado também segura a exclusão;
- a turma de outro ano responde `NAO_ENCONTRADO`.

A escola como segunda camada na turma está no I3 do `cenarios.md`. As demais divergências anotadas no `1_task.md` são sobre onde os testes moram, não sobre o desenho. Todas as FKs que apontam para `turma` e `disciplina` são `no action` (migrations 0009 e 0010), então nenhuma exclusão apaga nada em cascata sem aviso.

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test)").

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts:37-38`: o comentário da classe ainda diz "Sem ano em curso, as **duas** rotas falham fechadas". Agora são quatro, e o comentário deveria dizer isso sem contar.
2. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts:66-73`: o `renomear` não trava o ano com `travarAnoEmCurso()`, e o `criar` trava. Se a coordenação renomear enquanto encerra o ano, a turma que está sendo encerrada troca de nome. Isso não causa dano hoje. Vale decidir junto com o `for update` da 4.0 se as escritas em turma seguem uma política só de trava.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/1_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/exclusao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/disciplina.{controller,service,repository}.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.{controller,service,repository}.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/estrutura/{turma,disciplina}.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/index.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz{,.expectativa,.test}.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/estrutura.int.test.ts`

## revisor-geral · 2ª rodada · APROVADO · 2026-09-26 11:16:21 · `tasks/prd-apresentacao-escola/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test)")
Bloqueantes: nenhum
Recomendações:
- A recomendação 2 ficou marcada para a tarefa 4.0, mas só está anotada no `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/1_task.md:128`. O `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/4_task.md:39` fala do `for update` no excluir e não fala de decidir a trava do `renomear`. Quem executar a 4.0 lê o `4_task.md`, não o `1_task.md`. Registre a pendência lá (na subtarefa 4.5 ou nas notas), senão ela se perde.

Conferi as duas correções da rodada anterior:
1. O comentário de `TurmaService` que contava "as duas rotas" foi corrigido em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts`. A mudança é só no comentário, sem efeito no comportamento.
2. O `renomear` sem `travarAnoEmCurso()` foi adiado para a tarefa 4.0, com o motivo registrado na tabela "Recomendações sem aplicar". Era recomendação, então adiar não bloqueia. O único ponto é o registro, citado acima.

As duas linhas novas da tabela vêm do `tenancy-guardian`: ele pediu erro tipado para a invariante da FK e a sessão de rede na varredura P1, e as duas foram recusadas com motivo. Ambas são área dele, que aprovou na 1ª rodada, e nenhuma esconde bug.

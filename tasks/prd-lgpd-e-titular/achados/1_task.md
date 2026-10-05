# Achados das revisões — `tasks/prd-lgpd-e-titular/1_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-05 17:03:23 · `tasks/prd-lgpd-e-titular/1_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** terceiro caminho que importa a `ContaGlobalRepository`; o barrel e o subcaminho do ciclo de vida não a exportam; `eliminar`/`desativar` na transação de quem chama, que depois lança, e o commit dela; os testes do F1 e da A1 de ciclo de vida e de fim de vínculo verdes sem mudar asserção; uma mutação para cada cláusula movida dos três métodos que vieram da API (`travarContraOGerarDoProfessor`, `encerrarSessoesDoUsuario`, `revogarDeQuemSaiu`) e da `ContaGlobalRepository`; isolamento (escola A × B no repository e no serviço); concorrência (a mesma conta desativada em A e em B; as corridas com o gerar).

**Cobertos:** a arquitetura, nos três testes novos de `arquitetura.test.ts` (o import, o `export *` e o `import()` dinâmico fora da lista, o comentário, o barrel e o alias). A transação de quem chama, nos dois sentidos, com a conta e a auditoria; a mutação dela fica vermelha pelo raciocínio, porque a leitura pelo pool vê o efeito já commitado. Os quatro testes novos de borda: a sessão já encerrada, a sessão que escapou, a trava só de professor e a revogação limitada à turma pedida. Os testes do F1 e da A1 mudaram só o import. O isolamento e a concorrência existentes continuam verdes.

Rodei estas mutações, só nos arquivos afetados:
- **Ficam vermelhas:** `isNull(acessoTurma.revogadoEm)`; `eq(vinculo.turmaId, acessoTurma.turmaId)`; `eq(vinculo.usuarioId, usuarioId)` na trava; e na conta global, `usadoEm`, `revogadoEm`, `expiraEm` do convite e o `delete` dos códigos de recuperação.
- **Ficam verdes:** as cláusulas dos dois bloqueantes abaixo e as da recomendação 1.

Os arquivos foram restaurados e conferidos por sha256. Os cinco arquivos novos aparecem agora como `A` no índice; não fui eu que os adicionei.

**Bloqueantes:**

1. `packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.ts:107`: tirei `eq(vinculo.usuarioId, usuarioId)` do `vinculoQueSegura` e os 35 testes de `acesso-fim-do-vinculo` e `ciclo-de-vida` ficaram verdes.
   - **O que está errado:** sem a cláusula, qualquer professor confirmado na turma segura o acesso de quem saiu. A professora desligada continua com o link e o código abrindo a sala porque um colega de outra disciplina ainda está na turma. É o caso de borda "dois professores na mesma turma", e fere a regra 20, item 18, e a correção 2026-10-03.
   - **Por que nenhum teste pega:** o teste de `apps/api/test/acesso-fim-do-vinculo.int.test.ts:153` cobre o inverso. Na segunda metade dele, o acesso do primeiro professor já tinha caído no "Gerar novo".
   - **Correção exigida:** um teste em que o professor gera o acesso e um colega fica confirmado em outra disciplina na mesma turma. Ao encerrar o vínculo de quem gerou, e também ao eliminá-lo, o acesso dele é revogado com auditoria, e o link e o código respondem como inexistentes. Mais a linha na seção "Mutações".

2. `packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.ts:72`: tirei `eq(vinculo.turmaId, turma.id)` da `travarContraOGerarDoProfessor` e tudo ficou verde.
   - **O que está errado:** sem a cláusula, eliminar um professor trava em `FOR NO KEY UPDATE` todas as turmas do ano em que ele tem vínculo de professor em qualquer turma, e não só as dele.
   - **Por que importa agora:** a tarefa 1.2 acabou de abrir o `eliminar` na transação de quem chama. No lote noturno, essas travas ficariam presas pela transação inteira e segurariam o "gerar" da escola toda (regra 80).
   - **Por que o teste novo não pega:** o teste novo de `apps/api/test/ciclo-de-vida.int.test.ts:520` diz que a eliminação "trava só as turmas em que o usuário é professor", mas só prova o filtro de papel.
   - **Correção exigida:** no mesmo padrão do teste de `:520`, um professor com vínculo na turma X e a turma Y, do mesmo ano e sem vínculo dele, travada por outra conexão: a eliminação passa dentro do `lock_timeout`. Mais a linha na seção "Mutações".

**Recomendações:**
1. Completar a seção "Mutações" com as cláusulas movidas que não têm linha e que ficaram verdes, cada uma com o motivo ou com um teste:
   - `:71` e `:105` (`anoLetivoId`): provavelmente não observáveis, porque `turma.id` já define o ano.
   - `:108` (`eq(vinculo.papel, 'professor')` no `vinculoQueSegura`): só mudaria algo se um usuário professor tivesse vínculo de aluno confirmado na turma. Dá para declarar como não observável, ou testar inserindo o vínculo pelo banco, como no teste de `:520`.
   - `conta-global.repository.ts:71` (`isNotNull(conta.email)`): só muda o `contaLimpa` da auditoria quando a conta é limpa uma segunda vez.
2. A regra de não abrir ponto de salvamento na transação de quem chama (divergência 4) não tem teste: trocar `rodar(transacao)` por `transacao.transaction(rodar)` não muda nenhum resultado observado. Basta declará-la como não observável na seção "Mutações".

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ciclo-de-vida/conta-global.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-fim-do-vinculo.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ciclo-de-vida.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/1_task.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-05 17:19:18 · `tasks/prd-lgpd-e-titular/1_task.md`

VEREDITO: APROVADO

Cenários exigidos (2ª rodada, só o diff desde a 1ª):
1. O colega confirmado em outra disciplina da mesma turma não segura o acesso de quem o gerou, tanto no encerrar quanto no eliminar. Precisa ter auditoria, e o link e o código precisam responder como inexistentes.
2. A eliminação não trava a turma do mesmo ano em que o professor não tem vínculo.
3. Recomendações da 1ª rodada: o `anoLetivoId` nas duas consultas, o `eq(vinculo.papel, 'professor')` do `vinculoQueSegura`, o `isNotNull(conta.email)` e o "sem ponto de salvamento".

Cobertos: rodei as quatro mutações só no arquivo afetado, e todas ficaram vermelhas no teste que a seção "Mutações" indica. Depois de cada uma restaurei com `git checkout --`, e a árvore voltou ao estado do índice.
- Tirar `eq(vinculo.usuarioId, usuarioId)` de `packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.ts:107` derruba "o colega confirmado em outra disciplina da mesma turma não segura o acesso…" (`apps/api/test/acesso-fim-do-vinculo.int.test.ts`). Correção exigida 1 feita: o teste confere a revogação, a auditoria com autor e `turmaId`, as respostas da sala byte a byte e o colega ainda confirmado.
- Tirar `eq(vinculo.turmaId, turma.id)` de `ciclo-de-vida.repository.ts:72` derruba "borda (F3, tarefa 1.0): a eliminação trava só as turmas…" (`apps/api/test/ciclo-de-vida.int.test.ts`). Falha com `55P03` no trecho novo, com `a.outraTurma` travada. Confirmei em `apps/api/test/escola-com-turma.ts` que ela é do mesmo ano (é criada na mesma escola, com o mesmo ano aberto). Correção exigida 2 feita.
- Tirar `eq(vinculo.papel, 'professor')` de `ciclo-de-vida.repository.ts:108` derruba "um vínculo de aluno do mesmo usuário na turma não segura o acesso…".
- Tirar `isNotNull(conta.email)` de `packages/nucleo/src/ciclo-de-vida/conta-global.repository.ts:71` derruba "borda (F3, tarefa 1.0): eliminar quem já foi desativado, com a conta já limpa…".
- Os três "não observável" declarados se sustentam:
  - Os dois `anoLetivoId`: as FKs compostas `(escola_id, ano_letivo_id, turma_id)` em `packages/nucleo/src/db/schema/vinculo.ts:54` e `packages/nucleo/src/db/schema/acesso-turma.ts:47` amarram o ano à turma, então a cláusula não muda o resultado e fica como defesa em profundidade.
  - O "sem ponto de salvamento" não muda o resultado, só o custo da transação.
- Nenhum `.skip`, `.only` ou teste comentado nos arquivos de teste alterados. Os testes não envolvem IA.

Bloqueantes: nenhum.

Recomendações:
- No teste do colega (`apps/api/test/acesso-fim-do-vinculo.int.test.ts:171-208`), com a mutação 1 o teste quebra já na metade do encerrar. A metade do eliminar nunca chega a ser exercitada sozinha contra essa mutação. Hoje basta, porque a cláusula é uma só para os dois caminhos. Se um dia a revogação da eliminação ganhar consulta própria, separar em dois `it`.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-05 17:20:41 · `tasks/prd-lgpd-e-titular/1_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration. As tabelas que o código movido toca, `usuario`, `sessao`, `vinculo`, `turma`, `acesso_turma`, `credencial_matricula`, `conta_externa`, `lista_nome` e `reivindicacao`, já tinham `escola_id`; as que variam por período também têm `ano_letivo_id`. A `conta` e o `codigo_recuperacao` seguem como a exceção global já declarada.

Queries verificadas:
- `packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.ts`: `encerrarSessoesDoUsuario`, `travarContraOGerarDoProfessor`, `revogarDeQuemSaiu`, `travarUsuario`, `desativar`, `apagarSenhaDaMatricula`, `apagarCredencialDaMatricula`, `apagarContaExterna`, `apagarSessoes`, `apagarVinculos`, `apagarDaListaDeNomes` e `apagarUsuario`. Todas filtram por `exigirEscolaDoContexto()`, nunca por argumento. Os três métodos que vieram da API têm a mesma instrução que tinham lá, agora sobre `this.tx`.
- `packages/nucleo/src/ciclo-de-vida/conta-global.repository.ts`: `encerrarSessoesDaConta`, `travarConta` e `limparContaSemUso`, iguais aos que saíram da `ResolucaoDeTenantRepository`, cada um com `@SemEscopo` e justificativa escrita.
- `packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.service.ts`: a transação opcional de quem chama não muda o escopo. `#naTransacao` continua exigindo a escola do contexto e travando o usuário por ela antes de qualquer escrita.
- `apps/api/src/estrutura/vinculo.service.ts:135` e `apps/api/src/sessao/redefinicao-de-mfa.ts:44` e `:78`: só trocam a classe chamada.
- Nenhum endpoint novo. Nenhuma entrada de `escolaId` vinda do cliente. Ids continuam UUID. Nada toca a camada de rede.

Teste de isolamento: presente e efetivo.
- `apps/api/test/acesso-fim-do-vinculo.int.test.ts`, teste "isolamento no repository: no contexto da escola A…": agora chama `CicloDeVidaRepository.revogarDeQuemSaiu`. Sem `eq(acessoTurma.escolaId, escolaId)`, o acesso de B seria revogado e o teste quebra. A contraprova no contexto de B prova que o resultado vazio não vem de o acesso não casar com nada.
- Os testes de isolamento de desativação e eliminação de `apps/api/test/ciclo-de-vida.int.test.ts` continuam com as asserções intactas.
- `packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.test.ts` prova duas coisas: o `CicloDeVidaRepository` não tem nenhum `@SemEscopo`, e a `ContaGlobalRepository` tem exatamente os três métodos, todos justificados.
- O teste de arquitetura fecha quem importa a `ContaGlobalRepository` e garante que ela não sai pelo barrel nem pelo subcaminho do ciclo de vida.

Bloqueantes: nenhum.

Recomendações:
1. O módulo `packages/nucleo/src/ciclo-de-vida` reúne três `@SemEscopo` na `ContaGlobalRepository`. É exatamente o limite que a regra 10, item 9 aponta como sinal de desenho errado. As três são exceções antigas que mudaram de lugar, e a `techspec.md` §6 já diz isso. Vale registrar essa ressalva em `docs/modelo-de-dados.md` ou no comentário da classe, para a próxima tarefa não acrescentar uma quarta ali sem discutir.
2. `conta-global.repository.ts:20`: o construtor aceita `Banco | TransacaoBanco`. Um `travarConta` chamado fora de transação trava a conta e solta na mesma hora, sem proteger nada. Sugiro tipar `travarConta` e `limparContaSemUso` para exigir `TransacaoBanco`.
3. `apps/api/test/arquitetura.test.ts`, regex `USO_DA_CONTA_GLOBAL`: o trecho `conta-global` sem âncora casa com qualquer string de código que contenha o termo, como um nome de teste ou uma chave. Isso pode reprovar sem motivo no futuro. Prender o padrão ao subcaminho (`@educa/nucleo/conta-global`) ou ao arquivo (`conta-global.repository`) evita o falso positivo.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-05 17:20:47 · `tasks/prd-lgpd-e-titular/1_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. O código movido lê e escreve o que já existia: `conta.email`, `senhaHash` e MFA (apagados na limpeza), as sessões, a credencial da matrícula, a conta externa, os vínculos, a lista de nomes e `acesso_turma.criado_por`. Nenhuma migration, nenhuma coluna nova.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok.
- A tarefa não cria rota. O `CicloDeVidaService` continua aplicando as mesmas barreiras: `exigirEscolaDoContexto`, o id validado como UUID, o próprio usuário recusado e o `travarUsuario` filtrado pela escola do contexto.
- O id de outra escola, o id inexistente, o usuário já desativado e o próprio usuário recebem a mesma resposta, `NAO_ENCONTRADO`.
- Os três métodos que vieram da API para `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.ts` continuam tirando a escola do contexto, nunca do argumento.
- A transação que quem chama passa não muda o escopo, que continua vindo do contexto.

**Logs:** limpos. Os arquivos de `packages/nucleo/src/ciclo-de-vida/` não têm nenhum logger. O `VinculoService.encerrar` continua logando só `'vinculo.encerrado'`.

**Auditoria:** presente, e grava na mesma transação da ação.
- `usuario.desativado` e `usuario.eliminado` com a autoria do operador.
- `acesso_turma.revogado` na eliminação e no encerramento do vínculo.
- Quando a transação vem de quem chama, a auditoria entra nela e é desfeita junto, sem ação sem rastro nem rastro sem ação. O teste de integração novo prova os dois sentidos.

**Envio externo:** nenhum. A tarefa não usa IA.

**Seed/fixture:** sintético. Os testes usam as fábricas existentes (`paula`, `rui`, e-mails gerados).

**Bloqueantes:** nenhum.

Conferi o que importa para a privacidade:
- **A limpeza da conta global** continua apagando e-mail, senha, segredo e passo do TOTP e os códigos de recuperação, e encerrando as sessões que escaparam. O critério é o mesmo de antes: usuário ativo ou convite válido em alguma escola. O `isNotNull(conta.email)` agora tem teste.
- **A revogação do acesso da turma de quem saiu** (regra 20, item 18) ficou mais bem provada. O teste do colega em outra disciplina e o do vínculo de aluno fecham as cláusulas que a mutação deixava verdes.
- **A contenção da conta global:**
  - A `ContaGlobalRepository` não sai pelo barrel nem pelo subcaminho do ciclo de vida.
  - O teste de arquitetura fecha a lista de quem a importa e pega a importação, o `export *` e o `import()` dinâmico.
  - Os três métodos têm `@SemEscopo` com justificativa, e um teste verifica isso.
  - O `docs/modelo-de-dados.md` foi corrigido: agora cita também o expurgo de acesso, que já limpava a conta e estava omitido.
- **A pergunta de fechamento** (o código responde tudo o que guarda sobre um aluno e para onde foi enviado?) ainda não tem resposta no código, mas esta tarefa não piora nada. A tarefa é pré-requisito para isso: põe a eliminação ao alcance do worker. A resposta em si é o escopo das tarefas seguintes do F3 (`titular`: leitura, compartilhamento, eliminação). Não conta como bloqueante desta tarefa, e volta a valer como critério quando essas tarefas chegarem.

**Recomendações:**
1. **Erro dentro da transação de quem chama.** Sem ponto de salvamento, um erro de SQL no `desativar` ou no `eliminar` aborta a transação inteira de quem chama. A tarefa que fizer o lote noturno de `pessoa_desativada` precisa declarar duas coisas:
   - um titular por transação, ou o lote inteiro cai junto;
   - quem chama não pode capturar o erro e seguir na mesma transação.

   O `NAO_ENCONTRADO` sai antes de qualquer escrita, então capturá-lo é seguro. Vale anotar isso no JSDoc de `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.service.ts`. A decisão é do `infra-guardian` nessa tarefa.
2. **Restos de build com o caminho antigo.** `apps/api/dist/sessao/ciclo-de-vida.*.js.map` ainda existem. Não estão no índice, mas vale um `clean` para ninguém achar o caminho antigo por busca.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-05 17:21:02 · `tasks/prd-lgpd-e-titular/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test)

Bloqueantes: nenhum

O que conferi:
- **Escopo.** As subtarefas 1.1 a 1.4 estão feitas. Nada do worker nem das rotas de eliminação (14.0 e 15.0) entrou antes da hora. Os três métodos que vieram da API (`travarContraOGerarDoProfessor`, `encerrarDoUsuario`, `revogarDeQuemSaiu`) foram para o `CicloDeVidaRepository` com o mesmo texto: comparei as duas versões e só mudaram o nome de `this.banco` para `this.tx` e, no encerramento das sessões, `escolaDoContexto()` virou `exigirEscolaDoContexto()`. Isso não muda nada na prática, porque o `#naTransacao` já exige a escola antes.
- **Tech Spec.** As sete divergências do `1_task.md` estão na `techspec.md` (§2, linha `packages/nucleo/src/ciclo-de-vida`; §6, tabela e parágrafo da `ContaGlobalRepository`), no `cenarios.md` (Arquitetura) e no `docs/modelo-de-dados.md`. As duas que mais pesam (o terceiro método na `ContaGlobalRepository` e a transação sem ponto de salvamento) estão justificadas e registradas.
- **Exportação.** `packages/nucleo/src/index.ts` não mudou. `packages/nucleo/src/ciclo-de-vida/index.ts` não exporta a `ContaGlobalRepository`. Os subcaminhos do `package.json` apontam para `dist/ciclo-de-vida/...`, que é o que o `tsconfig.build.json` gera (`rootDir: src`).
- **Referências antigas.** Não sobrou nenhuma referência aos caminhos e métodos antigos no código nem na documentação, fora o `dist` gerado.
- **Regra 00.** Os erros são `ErroDeDominio` com código. Não entrou regra em controller, e o serviço continua criando o repositório com a transação, como o projeto já faz.
- **Regra 40.** Não há `.skip`, `any` nem `TODO` no diff. Nenhuma asserção que já existia mudou, só a importação. Os testes novos cobrem cláusulas que antes podiam ser alteradas sem nenhum teste falhar.

Recomendações:
- **`docs/modelo-de-dados.md:58`** ainda diz que a `ResolucaoDeTenantRepository` é o "único módulo autorizado a consultar sem escopo", e a frase seguinte, escrita nesta tarefa, desmente isso. Convém trocar "único" pela lista dos dois caminhos.
- **`apps/api/src/sessao/resolucao-de-tenant.repository.ts:84`** chama a classe de fronteira "a única do sistema", para "toda operação que [...] toca a `conta` global". A frase acrescentada logo abaixo corrige o sentido, mas o começo ficou desatualizado.
- **`apps/api/test/arquitetura.test.ts`.** O teste se apresenta como "exatamente esta lista", mas deixa o próprio arquivo de fora, e ele importa `@educa/nucleo/conta-global` por `import()` dinâmico. Não esconde nenhum problema. Uma linha no comentário dizendo que o próprio teste fica fora da lista evita a dúvida de quem ler depois.

Arquivos principais: `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.service.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ciclo-de-vida/conta-global.repository.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`.

## test-engineer · 3ª rodada · APROVADO · 2026-10-05 17:34:53 · `tasks/prd-lgpd-e-titular/1_task.md`

VEREDITO: APROVADO

Esta foi a 3ª rodada. Auditei só o que mudou desde a 2ª e não encontrei bloqueante.

**Cenários exigidos (o que esta rodada afeta):** a varredura da `ContaGlobalRepository` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts` precisa fazer três coisas:
- reprovar um terceiro caminho que importe a classe pelo arquivo;
- reprovar quem a importe pelo subcaminho `@educa/nucleo/conta-global`, mesmo sem citar o nome da classe;
- deixar passar texto inocente, ou seja, comentário ou uma string que só contém "conta-global".

Os outros cenários da tarefa não mudaram e ficam como na 2ª rodada.

**Cobertos:**
- A regex nova na linha 90 (`/\bContaGlobalRepository\b|conta-global\.repository|@educa\/nucleo\/conta-global/`) tem um caso que prova cada ramo, no teste "reprova o terceiro caminho…" (linhas 122–139). Rodei as três mutações da seção "Mutações" (linhas 115–117 de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/1_task.md`), uma por vez, só no arquivo afetado. As três ficaram vermelhas, cada uma no caso que diz cobrir:
  - **Sem o ramo do arquivo:** o caso `packages/nucleo/src/retencao/atalho.ts` (o `export *`) some da lista de reprovados.
  - **Sem o ramo do subcaminho:** o caso `apps/worker/src/processadores/expurgar.ts` (o `import * as global`) some da lista.
  - **Com `conta-global` solto no lugar dos dois:** o caso inocente `apps/api/src/telemetria/metricas.ts` entra na lista de reprovados.
- Restaurei o arquivo com `git checkout --` depois de cada mutação. O `git status` mostra só a mudança que já estava indexada, e os 3 testes do bloco passam de novo.
- A lista fechada do teste "quem importa a ContaGlobalRepository é exatamente esta lista…" continua batendo com a regex mais estreita.
- O próprio teste fica fora da varredura (`ESTE_ARQUIVO`, linha 98), como o docblock (linhas 92–95) agora explica. Isso não abre buraco: o teste fica em `apps/api/test/`, não é código de produção, e o barrel continua conferido em tempo de execução pelo teste da linha 141.
- O item 2 do diff é só comentário, sem código: o JSDoc do `CicloDeVidaService` (linhas 31–36), o docblock da `ContaGlobalRepository` e o da `ResolucaoDeTenantRepository`. Nenhuma asserção mudou, e não há `.skip` nem teste comentado.

**Bloqueantes:** nenhum.

**Recomendações:**
- O JSDoc do `CicloDeVidaService` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.service.ts`, linhas 35–36) diz que quem elimina em lote usa uma transação por titular. Hoje isso é só texto. Quando a tarefa da eliminação em lote vier, ela precisa de um teste em que um titular falha no meio do lote e os outros continuam eliminados, para que essa frase passe a ser regra provada.
- O docblock da `ContaGlobalRepository` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ciclo-de-vida/conta-global.repository.ts`, linhas 17–18) diz que "três é o limite" da regra 10, item 9. A regra diz que a terceira exceção no mesmo módulo já é sinal de desenho errado. A frase atual pode ser lida como se três ainda estivesse dentro do aceitável. Vale reescrever dizendo que as três já estão no limite, e que a próxima é mudança de spec. É só texto, não bloqueia.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-05 17:47:09 · `tasks/prd-lgpd-e-titular/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As divergências da tarefa estão no `techspec.md` (§2 e §6), no `cenarios.md` (Arquitetura, tarefa 1.0) e no `docs/modelo-de-dados.md`.
Portão local: carimbo válido (typecheck, lint, test)
Bloqueantes: nenhum

As quatro correções desta rodada foram feitas.
- **Minhas recomendações.** A frase "único módulo autorizado" saiu de `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md`. O docblock da `ResolucaoDeTenantRepository` agora diz "fora as do ciclo de vida" e aponta para a `ContaGlobalRepository`. O docblock de `quemUsaAContaGlobal` explica por que `ESTE_ARQUIVO` fica fora da lista.
- **`tenancy-guardian`.** A regex `USO_DA_CONTA_GLOBAL` está ancorada. Há um caso novo em `fora` (`import * as global`) e dois em `inocentes` (comentário e `'metrica.conta-global.limpas'`). As três mutações da regex estão registradas como vermelhas. A ressalva da regra 10, item 9 está no docblock de `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ciclo-de-vida/conta-global.repository.ts` e no modelo de dados.
- **`privacy-guardian`.** O JSDoc do `CicloDeVidaService` diz agora que um erro de SQL aborta a transação de quem chama, que o lote usa uma transação por titular e que o `NAO_ENCONTRADO` sai antes de qualquer escrita.
- **`1_task.md`.** A tabela "Recomendações sem aplicar" tem destino ou motivo em cada linha (14.0; 5.3; condicional). Nenhuma recomendação ficou sem dono.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md`, linhas 413–414: a frase "as três escritas na `Conta` (travar, limpar a conta sem uso e encerrar as sessões dela)" não é exata. `travarConta` é um `SELECT … FOR UPDATE` e `encerrarSessoesDaConta` escreve em `sessao`, não em `conta`. Melhor dizer "as três operações sobre a conta global".
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md`, linha 418, e o `techspec.md` §6: os dois dizem que o teste lista "o `CicloDeVidaService` e o `sessao`". A lista fechada do teste também tem `ciclo-de-vida.repository.test.ts`, que está fora do `sessao`. Basta acrescentar "e os testes deles".

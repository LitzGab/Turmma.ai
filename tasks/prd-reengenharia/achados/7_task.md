# Achados das revisões — `tasks/prd-reengenharia/7_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 13:22:30 · `tasks/prd-reengenharia/7_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta tarefa. As tabelas que os repositories tocam já tinham `escola_id`: `escola` (escopo por `escola.id`), `convite`, `usuario`, `sessao`, `registro_acesso`, `configuracao_operacional_escola`, a tabela do efeito sintético e `uso_infra_diario`. Nenhum id novo.

Queries verificadas:
- Nos nove repositories, a cópia local de `contextoAtual()?.escolaId` virou `exigirEscolaDoContexto()`. A escola é lida a cada chamada e não fica guardada na instância.
- Não sobrou `contextoAtual` nem `escolaDoContexto()` local em nenhum dos nove.
- Nenhum método passou a receber escola por argumento. Em `criarUsuarios`, o `{ ...novo, escolaId }` garante que a escola do contexto vence uma propriedade `escolaId` que chegue no objeto.
- `daEscola` com `rotinaDoSistema` e sem escola continua falhando fechado.
- Nenhum endpoint novo e nenhum `escolaId` vindo de corpo ou de query string.
- Nenhum `@SemEscopo()` novo.
- Nenhuma consulta da camada rede foi tocada.
- As nove entradas saíram de `REPOSITORIES_SEM_ESCOPO`, e o teste da lista exata saiu junto com elas.

Teste de isolamento: presente e efetivo. Tirei mentalmente a cláusula em cada mutação declarada, e todas deixam o teste vermelho:
- **`EscolaSessaoRepository`:** sem o `where`, `lerParaAlterar` devolve uma linha qualquer. O padrão é 30/120, e o teste espera 10/50 e 20/70. Sem o `where`, `alterar` muda B, e o teste confere que B continua 20/70.
- **`ConviteRepository`:** sem a cláusula, `revogado` devolve `false` em vez de `undefined`, `revogar` revoga o convite de A e `nomeDaEscola` devolve o nome de outra escola.
- **`CriacaoDeSessaoRepository`:** o objeto chega com a escola de B, e com o spread invertido o usuário seria gravado em B. O teste quebra.
- **`EscritaDeSessaoRepository`:** o teste chama as quatro escritas no contexto de B e compara o estado inteiro da sessão.
- **`RedefinicaoDeMfaRepository`:** sem a cláusula, a conta de A é achada no contexto de B.
- **`UsoRepository`:** `doDia` e `doMes` sem a cláusula somam A com B (3 + 8). No `gravarDia` com a escola guardada na instância, o `Promise.all` grava a conta de B em A.
- **`EfeitoSinteticoRepository`:** com a escola guardada na instância, a segunda gravação cai no conflito da restrição única, que começa pela escola, e o resultado vira `[true, false]`.
- **`ConfiguracaoOperacionalRepository`:** sem o `where`, B passaria a ver a linha de A.

Os casos de "sem escola" esperam a mensagem exata, `'consulta com escopo sem escola no contexto'`, o que prova que a troca aconteceu de fato.

Bloqueantes: nenhum

Recomendações:
- **`ativarPorConvite`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/convite.repository.ts:127-145`): o `eq(convite.escolaId, …)` do `exists` e o `eq(usuario.escolaId, …)` do `update` se cobrem um ao outro. Por isso nenhuma das duas cláusulas tem mutação própria, e a divergência está declarada em `7_task.md` e em `onda-1a.md`. Vale um caso que isole cada uma, por exemplo um usuário de A apontado por um convite cuja escola diverge, se o modelo permitir. Do contrário, registre que a FK composta já impede esse caso.
- **`criarSessoes`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/criacao-de-sessao.repository.ts:37-55`): não há mutação para a escola gravada na sessão. A proteção hoje vem da FK composta `(escola_id, usuario_id)`. Uma mutação com a escola fixa deixaria isso provado por escrito.
- **Teste do repository em arquivo HTTP**: o caso novo do repository está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/escola-sessao.int.test.ts`, que é o arquivo do `PUT /v1/escola/sessao`. Um arquivo `escola-sessao.repository.int.test.ts` ao lado do repository seguiria o padrão dos outros oito.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 13:22:35 · `tasks/prd-reengenharia/7_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido (tipos, lint, segredo, dependências, unidade e os testes que a tarefa alterou)

Bloqueantes: nenhum

O que conferi:
- **A troca está feita nos nove repositories.** Cada um usa `exigirEscolaDoContexto`, chamado dentro do método a cada vez. Nenhum guarda a escola na instância, e a cópia local saiu de todos.
- **A lista encolheu.** As nove entradas saíram de `REPOSITORIES_SEM_ESCOPO` e do teste "a lista real só encolhe". Nenhum outro repository ainda copia `contextoAtual()?.escolaId`, fora o `auditoria` e o `job-registro`, que continuam na lista de propósito.
- **Os testes que a tabela da tarefa pede existem**, inclusive os dois arquivos novos (`criacao-de-sessao` e `redefinicao-de-mfa`). Os dois casos de concorrência com `Promise.all` (efeito sintético e uso) quebrariam se a escola fosse lida no construtor.
- **As duas divergências estão também na spec.** São o commit da 7.1 que não ficou separado e a mutação do convite no `revogar` em vez do `ativarPorConvite`. As duas estão registradas em `tasks/prd-reengenharia/onda-1a.md`, T6, "Duas escolhas da 7.0", e não só na tarefa. O motivo da mutação do `ativarPorConvite` se sustenta: lá, duas cláusulas barram o mesmo caso, e tirar uma só não deixa o teste vermelho.
- **Nenhum teste espera mais as mensagens antigas** dos nove repositories.

Recomendações:
- `apps/api/src/sessao/convite.repository.ts`: o diff troca a chamada em `usuarioConvidado`, `criarConvite`, `travarEscola`, `dadosDaCoordenacao` e `dadosDoProfessor`, e nenhum deles tem mutação declarada. O `dadosDaCoordenacao` tem teste de isolamento que ainda pode servir para uma. Cobrir isso é da área do `test-engineer`; aponto só para ele olhar.
- `packages/nucleo/src/configuracao/configuracao-operacional.ts:165` ainda tem uma cópia local da checagem, com a mensagem antiga (`'configuração operacional sem escola no contexto'`). Não é repository e a tarefa não pedia; vale anotar para quem for mexer nesse arquivo.
- A seção "Como testar" sugeria transformar em `Promise.all` o teste de `apps/worker/test/reexecucao.int.test.ts` que roda as escolas A e B em sequência. A implementação deixou esse teste como estava e criou um caso novo. Prova o mesmo; só registro a diferença.
- A subtarefa 7.1 fala em "os 7 sem caso de 'sem escola'", mas pelo diff eram 4 (`escola-sessao`, `criacao-de-sessao`, `redefinicao-de-mfa`, `uso`). Os outros 5 já tinham o caso e só mudaram o texto esperado. O resultado está certo, só o número da tarefa não bate.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/7_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-1a.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/convite.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/configuracao/configuracao-operacional.ts

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 13:24:14 · `tasks/prd-reengenharia/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Isolamento:** cada um dos nove repositories lê e grava só na escola do contexto. No contexto de B, nada de A é alcançado.
- **Falha fechada:** os nove recusam a operação quando não há escola no contexto, e a mensagem passa a ser a de `exigirEscolaDoContexto`.
- **Concorrência real:** A e B chamam ao mesmo tempo a mesma instância de `EfeitoSinteticoRepository.gravar` e de `UsoRepository.gravarDia`. Isso prova que a escola é lida a cada chamada e nunca guardada na instância.
- **Travas mantidas:** duas ativações do mesmo convite ativam uma vez, e oito gravações da mesma chave deixam uma linha.
- **Rotina do sistema:** `daEscola` com `rotinaDoSistema` e sem escola continua recusando.
- **Guarda estática:** os nove saíram de `REPOSITORIES_SEM_ESCOPO` e a guarda passa a cobri-los.
- **Bordas do domínio:** convite revogado, convite não aceito, convite de outro usuário da mesma escola, usuário desativado e id inexistente.

**Cobertos:** todas as linhas da tabela têm teste, citado pelo nome, e rodei tudo verde nesta árvore: 26 testes na API, 46 no worker e despachante, 51 na guarda.
- A falha fechada aparece nos nove: `escola-sessao.int.test.ts` (novo caso), `convite…:235`, `criacao-de-sessao…:42` (novo), `escrita-de-sessao…:40`, `redefinicao-de-mfa…:40` (novo), `eu…:31`, `vagas…:390-391`, `reexecucao…:92` e `uso…:165` (novo).
- O isolamento tem asserção sobre o estado do banco, não só sobre o retorno. Exemplos: B continua com 20/70 depois do `alterar` em A, B tem zero linhas de usuário e sessão, e o convite de A segue não revogado.
- A concorrência é paralela de verdade, com `Promise.all` na mesma instância (`reexecucao…:411`, `uso…:441`). A mutação "guardar a escola na instância" (`this.guardada ??=`) deixa os dois testes vermelhos pelo motivo certo: em `reexecucao`, a segunda gravação cai no conflito da chave primária `(escola_id, chave)`; em `uso`, B fica sem linha.
- Conferi cada bloco de mutação contra o diff, e cada cenário chega à cláusula que ele muta:
  - Tirar o `where` de `lerParaAlterar` faz A e B lerem a mesma linha, e uma das duas asserções falha.
  - Tirar o `where` de `alterar` muda a escola B também.
  - Sem o filtro de escola, `nomeDaEscola` não acerta "Colégio B" e "Colégio A" ao mesmo tempo.
  - Em `revogado`, `revogar` e `revogarParaRefazer`, o convite de A passa a ser alcançado no contexto de B.
  - Nos testes de falha fechada, um UUID fixo no lugar da escola não lança, ou lança erro de FK e não a mensagem esperada.
  - Em `doMes`, sem o filtro, o mês soma linhas de outras escolas.
- A divergência (ii), a mutação do `ativarPorConvite`, se confirma no código (`convite.repository.ts:122-143`). Lá o `exists` liga `convite.usuarioId` a `usuario.id`, e o `update` filtra `usuario.escolaId`. Tirar só uma das duas cláusulas deixa a outra barrando o caso, então a mutação é equivalente e está declarada na tarefa e em `onda-1a.md`.
- Não há `.skip`, `.only` ou teste comentado nos arquivos alterados. Não há mock de código nosso: todos os testes usam Postgres real. Nada chama IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A linha "`daEscola` com `rotinaDoSistema` e sem escola lança" declara a mutação "aceitar `rotinaDoSistema`", mas não tem bloco. A lógica fica em `packages/nucleo/src/contexto/escola-do-contexto.ts:8-12`, fora do diff, então não é cláusula nova. Só que `packages/nucleo/src/contexto/contexto.test.ts` não tem caso de unidade com `rotinaDoSistema: true` e sem escola: hoje só o teste de integração `vagas.int.test.ts:391` segura isso. Vale acrescentar o caso de unidade.
2. Em `ConviteRepository`, `usuarioConvidado`, `criarConvite`, `travarEscola` e `dadosDoProfessor` só trocaram a cópia local por `exigirEscolaDoContexto`, e nenhum tem mutação própria nesta tarefa. A presença da chamada é provada pela guarda (`repositories-com-escopo.test.ts`). O uso no `where` depende de testes anteriores, que esta auditoria não reabriu.
3. `CriacaoDeSessaoRepository.criarSessoes` só tem a mutação de falha fechada. A gravação na escola certa fica com a FK composta `(escola_id, usuario_id)`, e não há mutação de isolamento própria. Isso é aceitável, porque o método não recebe escola por argumento.
4. A seção "Como testar" ainda manda transformar em `Promise.all` o teste "jobs da escola A e da B reexecutados em sequência…". Em vez disso, o implementador criou um caso novo (`reexecucao…:411`). Vale ajustar o texto para não confundir quem ler depois.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/7_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/criacao-de-sessao.repository.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/redefinicao-de-mfa.repository.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/convite.repository.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/escola-sessao.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/test/reexecucao.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/test/uso.int.test.ts

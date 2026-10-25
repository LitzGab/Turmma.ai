# Achados das revisões — `tasks/correcoes/2026-10-25-testes-do-arquivo-do-titular.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 02:07:28 · `tasks/correcoes/2026-10-25-testes-do-arquivo-do-titular.md`

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
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/test/arquivo-do-titular.int.test.ts:1039`: o comentário ainda diz que o `beforeEach` fixa o relógio. Quem fixa agora é a linha 1034, que põe o relógio uma hora antes da hora real. Basta ajustar o texto para dizer isso.

A correção só mexe no teste. Nenhum código de produção, fila, migration nem chamada de modelo muda, então a manhã de segunda das dez escolas não é afetada. No teste conferi três pontos:
- Nenhum caso chama provedor pago. As linhas com `openai_compat` são registros sintéticos gravados direto no banco.
- O `relogio.atual` volta à hora real no `beforeEach` (linha 86), então a hora recuada da linha 1034 não passa para os outros casos.
- O `tirarDaFila` novo (linha 1159) é a mesma função que o `pedidoPronto` já usa. Ela tira o job da fila de forma segura mesmo se um worker já o tiver pego, e não deixa estado preso.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-25 02:07:29 · `tasks/correcoes/2026-10-25-testes-do-arquivo-do-titular.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration. A tarefa só mexe em `apps/api/test/arquivo-do-titular.int.test.ts`. `arquivo_titular` e `pedido_titular` são lidas pelo teste e não mudaram.

Queries verificadas: `ArquivoDoTitularRepository.doPedido` (`packages/nucleo/src/titular/arquivo-do-titular.repository.ts:133`) tira a escola de `exigirEscolaDoContexto()`, e não de parâmetro. Sem escola no contexto, a chamada lança erro em vez de rodar a consulta sem escopo. Nenhum endpoint novo e nenhum `escolaId` vindo do cliente. Os `update`/`delete` diretos que o teste usa em `tirarDaFila` filtram por `escola_id`. Nenhum `@SemEscopo()` novo.

Teste de isolamento: presente e efetivo. O caso novo (`apps/api/test/arquivo-do-titular.int.test.ts:849`) monta o arquivo na escola B e chama `doPedido(pedidoDeB, 'completa')` duas vezes, com o mesmo pedido e a mesma versão: no contexto de A, que tem de devolver `undefined`, e no de B, que tem de devolver a linha. Removendo a cláusula `escola_id` do `doPedido`, a leitura no contexto de A devolve a linha de B e o `toBeUndefined` quebra. O teste também não falha por acaso por causa de um worker de pé, porque `pedidoPronto` já chama `tirarDaFila` antes de `montar`. Não rodei o arquivo; os 40 de 40 verdes vêm da tarefa.

Bloqueantes: nenhum.

Recomendações:
- `apps/api/test/arquivo-do-titular.int.test.ts:1039`: o comentário ainda diz que "o `beforeEach` o fixa", mas agora o relógio é fixado na linha 1034, uma hora antes da hora real. Ajustar o texto para não confundir quem ler a prova.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 02:07:30 · `tasks/correcoes/2026-10-25-testes-do-arquivo-do-titular.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta correção. O diff só mexe em `apps/api/test/arquivo-do-titular.int.test.ts` e não grava em `nota`, `correcao` nem em tabela de saída de IA. As escritas do teste vão para `arquivo_titular` (o `update … returning` do item 2) e para a fila do job `titular.montar-arquivo`. Todos com autor humano? Não se aplica: não há caminho de escrita em Nota.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. O diff não toca nenhum fluxo de saída de IA. O arquivo do titular é uma exportação a pedido (regra 20, item 19), não uma saída de agente.
Supervisão do tutor: ok. O diff não toca o tutor.
Autonomia declarada e visível: sim, sem mudança. O diff não toca governança nem agentes.
Bloqueantes: nenhum
Recomendações:
- Em `apps/api/test/arquivo-do-titular.int.test.ts:1039`, o comentário ainda diz "o `beforeEach` o fixa". Desde esta correção, quem fixa o relógio nesse caso é a linha 1034, uma hora antes da hora real, e é isso que torna a prova independente da hora real. Vale ajustar o texto. É assunto de nome e texto, do `test-engineer`; não bloqueia.

Outras verificações:
- O caso novo (`:849`) usa `ArquivoDoTitularRepository`, que existe no pacote (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/index.ts:218`). Ele lê o arquivo dentro de `executarNoContexto`, que é o caminho previsto, e não usa nenhum atalho sem escopo.
- O `beforeEach` (`:85-86`) volta o relógio para a hora real a cada caso, então o atraso de uma hora da linha 1034 não passa para os casos seguintes.
- Os itens 7, 8 e 9 também não se aplicam: o diff não tem inferência emocional, monitoramento de comportamento, nota sugerida em discursiva ou redação, nem métrica de professor.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/test/arquivo-do-titular.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/tasks/correcoes/2026-10-25-testes-do-arquivo-do-titular.md`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 02:07:36 · `tasks/correcoes/2026-10-25-testes-do-arquivo-do-titular.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum novo. A correção só mexe em teste. Os casos usam o nome do usuário de teste, gerado como sentinela `${rotulo}-${MARCA}-uuid` pela `pessoa`, em `apps/api/test/arquivo-do-titular.int.test.ts:148-158`. O caso novo cria um aluno de rótulo `AlunoDeB`, também sintético.

Fora da tabela de dados do docs/lgpd.md: nada. Não há migration, coluna nem DTO novo.

Autorização por objeto: ok. A correção reforça esse ponto. O caso novo em `apps/api/test/arquivo-do-titular.int.test.ts:849-861` prova que `ArquivoDoTitularRepository.doPedido` (`packages/nucleo/src/titular/arquivo-do-titular.repository.ts:133`) lê a escola do contexto. No contexto da escola A, o arquivo do pedido de B devolve `undefined`. No contexto de B, mesmo pedido e mesma versão, a linha vem. Se a cláusula `escola_id` sair, o teste quebra (mutação 1 do documento). Até agora o isolamento desse repository só era provado pela API, que checa o objeto antes por outro caminho.

Logs: limpos. O diff não acrescenta nenhum log. O único texto novo de erro, `'o update não achou a linha do arquivo'`, não leva dado nenhum.

Auditoria: presente. Nada mudou em ação auditada, porque o código de produção não foi tocado.

Envio externo: nenhum.

Seed/fixture: sintético. São nomes sentinela com marca aleatória por execução e escolas criadas pelo próprio teste.

Bloqueantes: nenhum.

Recomendações:
- O caso novo cobre só a versão `'completa'` de `doPedido`. Repetir a leitura no contexto de A com a versão `'coordenacao'` cobriria as duas versões que o arquivo do titular grava, por um custo de uma linha (`apps/api/test/arquivo-do-titular.int.test.ts:858`). É cobertura extra e não bloqueia, porque o mesmo `where` serve às duas versões.

Os três ajustes de robustez também conferem com o documento da correção, `tasks/correcoes/2026-10-25-testes-do-arquivo-do-titular.md`:
- O caso do armazém fora agora chama `tirarDaFila` (linha 1159).
- O `returning` vazio agora quebra com mensagem própria, sem passar por `NaN` (linhas 894-897).
- O relógio do caso da URL de 300 s fica uma hora antes da hora real (linha 1034). Com isso, o `prontoEm` gravado só bate com o relógio do teste se o job usar o relógio injetado.

Nenhum dos três muda o que o sistema expõe nem o que ele grava.

Pergunta de fechamento: a correção não altera o que o sistema guarda nem para onde envia, então a resposta à secretaria continua a mesma de antes. Ela agora também cobre o escopo da escola na leitura do arquivo do titular, em `doPedido`.

## test-engineer · 1ª rodada · APROVADO · 2026-10-25 02:08:27 · `tasks/correcoes/2026-10-25-testes-do-arquivo-do-titular.md`

VEREDITO: APROVADO

Cenários exigidos:
- Item 1: no caso "com o armazém fora…", o job que a API enfileirou não pode montar o arquivo por conta própria antes das três asserções (estado `em_preparacao`, nenhuma linha em `arquivo_titular`, 404 no download).
- Item 2: no caso "Meus dados lista só os pedidos…", se o `update … returning` não achar a linha, o teste tem de falhar ali, e não acabar comparando com `NaN`.
- Item 3: no caso "a URL vale 300 s…", o `pronto_em` gravado tem de vir do relógio injetado, com uma diferença que não dependa de a hora real ter andado.
- Item 4 (isolamento, regra 10, item 5): no contexto da escola A, `ArquivoDoTitularRepository.doPedido` não devolve o arquivo do pedido de B; no contexto de B, devolve.
- Permissão: as rotas de colega, coordenação e escola B já estavam cobertas e não mudaram. A correção não toca a autorização.

Cobertos:
- Item 1: `apps/api/test/arquivo-do-titular.int.test.ts:1159` chama `tirarDaFila` logo depois do `registrar`, ainda com o armazém fora. Se um worker já tiver pego o job, `tirarDaFila` espera o fim dele, apaga a linha e devolve o pedido a `em_preparacao` (linhas 435-449). As asserções seguintes passam a valer só contra o `montar` do teste.
- Item 2: as linhas 894-897 exigem `toHaveLength(1)` e tiram o valor padrão `new Date(NaN)`.
- Item 3: a linha 1034 põe o relógio uma hora antes da hora real. A mutação 2 (`new Date()` no lugar de `relogio.agora()`, em `apps/worker/src/processadores/montar-arquivo.ts:63`) dá uma diferença de uma hora em `expect(prontoEm).toEqual(relogio.atual)`, então o teste fica vermelho por esse motivo. Conferi que a hora uma hora antes não quebra o `registrar`: a validação de `chegouEm` usa `new Date()` (`apps/api/src/privacidade/privacidade.service.ts:223`) e não o relógio injetado. Também não quebra o resto do caso, porque o 6º dia e as fronteiras são calculados a partir de `prontoEm`/`expiraEm`.
- Item 4: o caso novo está nas linhas 849-861. O pedido e a versão são os mesmos nas duas leituras e só a escola do contexto muda. O bloco da mutação 1 bate, caractere por caractere, com `packages/nucleo/src/titular/arquivo-do-titular.repository.ts:133`, e sem a cláusula a leitura no contexto de A devolveria a linha de B. Há asserção sobre o resultado nos dois sentidos: `undefined` no contexto de A, e `versao` mais `chaveObjeto` da escola B no contexto de B.
- As duas cláusulas das mutações batem com o código atual. Não há código de produção alterado, então não há cláusula nova sem bloco.
- Não há `.skip` nem mock que esconda a regra. `ArmazemEmMemoria` só substitui o storage externo. Não há IA envolvida.
- Rodei `npx vitest run --project integracao apps/api/test/arquivo-do-titular.int.test.ts` na pilha `educa-teste-2`: 40 de 40 verdes, o mesmo número que o documento declara.

Bloqueantes: nenhum.

Recomendações:
- `apps/api/test/arquivo-do-titular.int.test.ts:1039`: o comentário ainda diz "o `beforeEach` o fixa". Agora quem fixa o relógio é o próprio caso, na linha 1034, uma hora antes. Vale ajustar o texto para não confundir quem ler depois.
- `apps/api/test/arquivo-do-titular.int.test.ts:849-861`: o teste de isolamento poderia também criar um pedido em A e conferir que ele vem no contexto de A. Isso deixaria claro que o `undefined` vem do filtro de escola, e não de o contexto de A não ler nada. Hoje a leitura positiva no contexto de B já cobre isso em parte.
- `apps/api/test/arquivo-do-titular.int.test.ts:896`: o `throw` depois do `toHaveLength(1)` nunca é alcançado. Ele só existe para o TypeScript reconhecer que `movido` não é `undefined`. Pode ficar assim, ou trocar por um auxiliar que já devolva a linha com o tipo certo.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/tasks/correcoes/2026-10-25-testes-do-arquivo-do-titular.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/test/arquivo-do-titular.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/titular/arquivo-do-titular.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/worker/src/processadores/montar-arquivo.ts

# Achados das revisões — `tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-25 00:14:44 · `tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration nesta correção. `arquivo_titular` só é lida em teste, pelo auxiliar `validadeDoArquivo`, com `select pronto_em, expira_em ... where pedido_id = $1 and versao = $2` sobre `bancada.pool`. É acesso de fixture, que não passa por repository nem por endpoint.

Queries verificadas: nenhuma query de produção muda, porque nenhuma linha de `apps/*/src` nem de `packages/*/src` foi alterada. Os três casos em revisão continuam passando pelas rotas com o token da sessão (`arquivoDaEscola(cenario.coordenacao, …)`, `baixar(aluno.sessao, …)`, `meusDados(…)`). Nenhum deles passa `escolaId` vindo do cliente.

Teste de isolamento: presente e efetivo. A correção não enfraquece nenhuma asserção de escopo:
- "apagada ou vencida": o vencido e o apagado continuam comparados com `NAO_ENCONTRADO`, o mesmo corpo do id inexistente (regra 6). Também continua o caso do pedido em preparação que não pode servir o arquivo de outro pedido da escola.
- "Meus dados": a linha `expect(((await meusDados(deB.sessao)).corpo['pedidos'] as unknown[]).length).toBe(0)` não mudou.
- "URL vale 300 s": a chave assinada continua presa a `titular/${cenario.escolaId}/${pedidoId}/completa.json`.

Só mudou de onde vem a data. A fronteira passa a ser o `expira_em` da linha, menos ou mais 1 s, no lugar de datas fixas no calendário.

Bloqueantes: nenhum.

Recomendações:
- `apps/api/test/arquivo-do-titular.int.test.ts:729-731` e `:991-994`: ainda existe uma janela de corrida. A correção explica que o worker do compose regrava a linha com a hora real. Se essa regravação cair entre a leitura de `validadeDoArquivo` e a requisição, o novo `expira_em` fica alguns segundos depois do lido, e a checagem de `expiraEm + 1 s` pode receber 200 de forma intermitente. O mesmo vale para `:848`, onde o `prontoEm` é lido depois da listagem. Isso não afeta o isolamento, é estabilidade do teste e cabe ao `test-engineer` avaliar. Há duas saídas: esperar a regravação do worker antes de ler, ou impedir que o job da fila consuma esse pedido no teste.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 00:14:45 · `tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta correção, e todos os que já existiam continuam com autor humano: sim. A correção mexe em um só arquivo de teste, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/arquivo-do-titular.int.test.ts`. Esse arquivo cobre o pedido de acesso do titular (regra 20, item 19). Não toca em `Nota`, em correção nem em seed, e nenhuma linha de `apps/*/src` ou `packages/*/src` muda.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. O diff não traz nenhuma saída de IA nova, nem fluxo de entrega ou de aprovação.

Supervisão do tutor: ok. A conversa do tutor aparece no teste só como categoria contada no "Meus dados" (`conversa_tutor`, quantidade 1). Essa linha não mudou.

Autonomia declarada e visível: sim. A governança e o nível dos agentes ficaram fora da correção.

Bloqueantes: nenhum.
- A correção troca as datas fixas por `new Date()` e lê o prazo do arquivo direto do banco, em `pronto_em` e `expira_em`, pelo novo auxiliar `validadeDoArquivo`. O prazo de 7 dias continua testado: o teste exige `expira_em = pronto_em + VALIDADE_DO_ARQUIVO_DIAS` e `VALIDADE_DO_ARQUIVO_DIAS = 7`.
- O teste da borda continua dos dois lados: um segundo antes do vencimento baixa (200), um segundo depois responde 404, igual ao id inexistente.
- O diff não toca em nenhum dos 9 itens da regra 70. Não há nota em discursiva ou redação, inferência emocional, indicador de professor nem conversa do professor com o chat.

Recomendações:
- Para o `test-engineer`, fora da regra 70: o próprio documento da correção registra que um worker do ambiente de teste regrava a linha com a hora real uns três segundos depois. Se isso acontecer entre a leitura de `validadeDoArquivo` e a chamada seguinte, a borda que o teste acabou de calcular se move, e o caso pode falhar às vezes. O caso mais exposto é "a versão da escola apagada ou vencida…", por volta das linhas 729 a 731, onde o teste empurra o relógio para depois do vencimento e logo a seguir espera 404. A saída é esperar a linha parar de mudar antes de ler o prazo, ou não deixar a API mandar esse pedido para a fila durante o teste. A cobertura não diminui por isso, e as 5 de 5 rodadas verdes registradas sustentam a aprovação.
- O caso "a data da introdução vista…" (por volta das linhas 536 a 559) está no mesmo arquivo, mas é da tarefa 1.0 e não foi auditado aqui. Ele usa a D64 para justificar que a versão da coordenação não traz a data do professor. Na revisão da 1.0, vale confirmar que esse campo não vira indicador de adoção por professor (regra 70, item 9).

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 00:15:31 · `tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`

VEREDITO: APROVADO

A correção só altera um arquivo de teste. Ela não abre nenhum caminho para dado de aluno e mantém provadas as regras de privacidade que o arquivo já cobria. Não achei bloqueante. Ficam três recomendações: a primeira é sobre código de produção que a correção trouxe à tona e deve virar correção própria.

Campos pessoais tocados: nenhum campo novo. O diff só lê `pronto_em` e `expira_em` de `arquivo_titular`. O caso `introducao_vista_em` é da 1.0 e ficou fora desta revisão, como pedido.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: ok. As garantias continuam provadas, agora a partir do `expira_em` da linha e não de datas fixas:
- depois do vencimento, o download e a versão da escola respondem igual ao id inexistente (`NAO_ENCONTRADO`), nas linhas 729 e 993;
- o objeto marcado como apagado também responde 404;
- "Meus dados" do titular de outra escola continua vazio (linha 852).
Logs: limpos. O diff não escreve log.
Auditoria: presente. O diff não cria nem remove nenhuma ação que exija auditoria.
Envio externo: nenhum.
Seed/fixture: sintético (`Aluno`, `Professor`, `AlunoComArquivo` e `AlunoEsperando`).

Rede de privacidade conferida no diff:
- URL assinada: chave privada `titular/<escola>/<pedido>/completa.json`, validade de 300 s (`VALIDADE_DA_URL_DO_ARQUIVO_SEGUNDOS` fixado em 300) e `validaAte` igual a relógio + 300 s.
- Retenção do arquivo: `expiraEm = prontoEm + VALIDADE_DO_ARQUIVO_DIAS`, com o número de dias fixado em 7.
- Fronteira do vencimento: ainda é testada com o relógio injetado, um segundo antes e um segundo depois.
- O teste continua quebrando se a rota passar a ignorar `expira_em`.

Bloqueantes: nenhum.

Recomendações:
1. **Produção (fora deste diff; vale abrir correção própria).** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/worker/src/processadores/montar-arquivo.ts:51-64`, o job grava o objeto no armazém (`armazem.guardar`) e regrava a linha (`gravar`, com `on conflict do update set prontoEm, expiraEm` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/packages/nucleo/src/titular/arquivo-do-titular.repository.ts:103`) antes de saber se o pedido ainda está `em_preparacao`. A trava `marcarPronto` só decide o estado. Duas consequências:
   - uma entrega repetida do job, que a D49 admite, renova a validade de 7 dias do arquivo de um menor;
   - uma entrega tardia, depois do vencimento ou do expurgo, recria no bucket o objeto com os dados completos do titular. A rota continua respondendo 404 porque `apagado_em` não é zerado, mas o objeto fica lá sem dono.

   O próprio sintoma desta correção prova o mecanismo: o worker do compose regravou o `pronto_em` com a hora real. A correção exigida na tarefa nova: o job checa se o pedido está `em_preparacao` antes de gravar o objeto, e o `on conflict` não estende `expira_em`. O teste deve provar que a segunda entrega do job não muda `expira_em` nem recria o objeto de um arquivo apagado.
2. Na linha 729/731 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/arquivo-do-titular.int.test.ts`, o caso testa a versão da escola, mas `validadeDoArquivo(comArquivo)` lê a versão `completa`. Hoje as duas linhas saem da mesma transação e têm o mesmo `agora`, então o resultado é igual. Mesmo assim, passar `'coordenacao'`, que o auxiliar já aceita, deixa a fronteira presa ao objeto que de fato é lido.
3. O teste depende de o worker do compose não regravar a linha entre a leitura de `validadeDoArquivo` e a requisição seguinte. A janela é curta e a falha que ela causaria seria um vermelho falso, nunca um verde que esconda regressão. Ainda assim, o teste depende do horário. Fica para o `test-engineer`: isolar a fila do teste do worker do compose, ou esperar o job real antes de ler o prazo. Com isso também volta a ser possível provar que o job usa o relógio injetado, coisa que a versão com datas fixas provava e esta não prova mais.

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-25 00:15:36 · `tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`

VEREDITO: REPROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: corrida em /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/arquivo-do-titular.int.test.ts:729, :848, :993
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok

Bloqueantes:

1. `apps/api/test/arquivo-do-titular.int.test.ts:729`, `:848` e `:993`. A causa segue de pé: o worker do compose regrava a linha `arquivo_titular` com a hora real, e a correção não acaba com essa segunda escrita. Ela só lê o prazo da linha antes de cada passo, o que deixa uma corrida em que o teste lê, verifica e depois age sem trava.
   - Em `:729` e `:993`, o teste lê `expira_em`, põe o relógio em `expira_em + 1 s` e chama a rota. Se o worker regravar entre a leitura e a requisição, o novo `expira_em` fica alguns segundos à frente (é o "três segundos depois" que vocês mediram). A rota responde `200` onde o teste espera `404`.
   - Em `:848`, o teste busca a lista de "Meus dados" e só depois lê `pronto_em`. Uma regravação nesse meio deixa os dois valores diferentes.
   - A própria correção mediu que o worker escreve no meio do teste: foi isso que fez as versões antigas darem `200`. Então a janela existe, e o vermelho de sempre virou um vermelho intermitente. Os 5 de 5 verdes rodando o arquivo sozinho não provam estabilidade na esteira, onde a carga muda o momento da escrita do worker.
   - **Correção exigida:** tirar o segundo escritor antes de ler o prazo. No auxiliar `validadeDoArquivo`, ou logo depois do `pedidoPronto` nos três casos, esperar com tempo-limite que o job daquele pedido termine, e só então ler a linha. A consulta para isso:
     ```sql
     select estado from job_registro
     where escola_id = $1 and tipo = 'titular.montar-arquivo' and dados->>'pedidoId' = $2
     ```
     Esperar até `estado in ('concluido','falhou')`. Depois disso a linha não muda mais, e `expira_em ± 1 s` e `pronto_em + 7 dias` ficam determinísticos. Também serve impedir que o worker consuma esses jobs no teste, mas fica a cargo de vocês, desde que nenhuma escrita aconteça entre a leitura e a requisição.

Recomendações:
- O comentário de `validadeDoArquivo` (linhas 420 a 425) descreve a corrida como aceita. Depois da espera pelo job, ele deve dizer que o prazo é lido com o job já concluído.
- Fora desta correção, para a retro: em `packages/nucleo/src/titular/arquivo-do-titular.repository.ts:103`, quando o job roda de novo (entrega ao menos uma vez, D49), o `on conflict do update` reinicia `pronto_em` e `expira_em`. Uma reentrega tardia estende a validade do arquivo do titular além dos 7 dias contados da primeira montagem. Vale decidir se a regravação deve manter o `pronto_em` original.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-25 00:17:42 · `tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`

VEREDITO: REPROVADO

Cenários exigidos:
- Caminho feliz: o titular baixa o arquivo dentro dos 7 dias, a URL vale 300 s e o nome sai com o dia do relógio.
- Bordas: a fronteira do 7º para o 8º dia (1 s antes baixa, 1 s depois responde 404); a versão da escola vencida ou com `apagado_em`; o pedido ainda em preparação não serve o arquivo de outro pedido.
- Borda do ambiente: o mesmo pedido montado duas vezes, uma pelo teste e outra pelo worker que consome a fila. É o caso "job executado duas vezes" da regra 80, e é a causa do sintoma.
- Permissão: "Meus dados" lista só os pedidos da própria pessoa.
- Isolamento: a escola B não lista os pedidos de A.

Cobertos: todos os cenários acima têm teste, e cada um falharia se a regra saísse:
- Se a rota ignorasse `expira_em`, o passo de +1 s daria 200.
- Se `gravar` usasse outro prazo, `expiraEm = prontoEm + 7 dias` falharia.
- Se o nome e o `validaAte` saíssem do relógio real, ficariam diferentes do relógio do teste no 6º dia.
- O `apagado_em` continua provado, porque `gravar` não o limpa (`packages/nucleo/src/titular/arquivo-do-titular.repository.ts:93,103`).

Não há `.skip`, mock que esconda a regra nem provedor de IA. Não há código de produção alterado, então o "Sem mutação" está correto. Rodei o arquivo uma vez (`npx vitest run --project integracao apps/api/test/arquivo-do-titular.int.test.ts`): 39 de 39 verdes. Foi na pilha `educa-teste-1`, onde não há despachante nem worker: os 90 jobs `titular.montar-arquivo` estão `aguardando` e nenhuma linha foi regravada. Portanto essa execução não exercita o ambiente onde o defeito aparece.

Bloqueantes:

1. **O teste continua disputando com o segundo escritor que o próprio documento identifica.** A correção diz que um worker regrava a linha com a hora real, em momento incerto (cerca de 3 s depois, pelo despachante). Em vez de eliminar essa escrita ou esperar por ela, o teste lê a linha e só depois age. A regravação pode cair entre a leitura e a requisição.
   - `apps/api/test/arquivo-do-titular.int.test.ts:729-730` e `:993-994`: o teste lê `expira_em`, faz `relogio = expira + 1 s` e espera 404. Se o worker regravar no meio, o `pronto_em` real vai para depois do do teste. Basta a regravação chegar mais de 1 s depois do `relogio.atual = new Date()` (linhas 721 e 976) para o novo `expira_em` passar de `expira + 1 s`, e a rota responde 200. Isso acontece justamente com a máquina carregada, quando o caso demora mais de 1 s.
   - `:995-996`: o mesmo efeito transforma `situacao: 'expirado'` em `'disponivel'`.
   - `:843-849`: em "Meus dados", a lista vem da API e o `pronto_em` vem de uma leitura posterior, com igualdade exata. Uma regravação entre as duas leituras derruba o caso, por menor que seja o atraso.

   Pela regra deste revisor, teste que só passa com a máquina folgada é bloqueante. O "5 de 5 verdes" não prova estabilidade se foi medido sem despachante; o documento não diz em qual pilha foi.

   **Correção exigida:** nenhuma asserção pode depender de uma escrita que um processo de fora faz em momento indeterminado. Qualquer uma destas três resolve:
   - (a) Tirar o segundo escritor dos pedidos que a suíte monta sozinha. Por exemplo, a API desta suíte usa um enfileirador que registra mas não alimenta o despachante. O caso "acesso e portabilidade… enfileiram o job" (`:1186`) continua com a API e o enfileirador reais.
   - (b) Em `pedidoPronto`, esperar o job que a API enfileirou chegar a um estado final antes de devolver, com o despachante presente. Isso exige uma forma determinística de saber se há consumidor.
   - (c) Em cada passo de fronteira e em "Meus dados", ler a linha antes e depois da chamada e repetir o passo se ela mudou, com um limite de tentativas.

   O documento deve dizer em qual pilha a estabilidade foi medida, com despachante e worker de pé.

Recomendações:
- **Nome do arquivo (`:986`):** o esperado sai do mesmo `diaDeUso` da produção, e o horário do 6º dia agora é o de agora. Se a produção usasse o dia em UTC, o teste só acusaria entre 21h e 24h de Brasília. Antes, com 14:00Z fixo, a checagem era determinística. Vale fixar a hora do instante do 6º dia, por exemplo 12:00 de Brasília do dia `pronto_em + 6`.
- **Reinício do relógio (`:735`, `:997`):** `relogio.atual` só volta ao normal quando o caso passa. Foi essa sobra que levou a falha de um caso para "Meus dados" no sintoma. Um `beforeEach` que reinicie o relógio corta essa cascata.
- **"Meus dados" (`:849`):** este caso não pegaria um serviço que calculasse `expiraEm` como relógio + 7 dias em vez de ler da linha, porque sem regravação as duas contas dão o mesmo valor. O HEAD tinha a mesma fraqueza, então não é regressão. Um `update` que mova `expira_em` da linha antes de listar fecharia isso.

Arquivos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/arquivo-do-titular.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/packages/nucleo/src/titular/arquivo-do-titular.repository.ts`

## infra-guardian · 2ª rodada · APROVADO · 2026-10-25 00:28:55 · `tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok

Bloqueantes: nenhum.

A correção exigida na 1ª rodada foi atendida. Vocês não tiraram o worker: o auxiliar `comALinhaParada` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/arquivo-do-titular.int.test.ts:445-459`) lê `pronto_em` e `expira_em` antes e depois de cada passo, e só aceita a resposta se a linha não mudou no meio. Isso cumpre o critério da ordem, porque nenhuma asserção roda sobre uma resposta que teve escrita entre a leitura e a requisição. Conferi o motivo de cada ponto:
- **Toda regravação aparece na comparação.** O worker grava `pronto_em` com a hora real dele, que não coincide com a do teste, e `expira_em` muda junto.
- **A regravação não desfaz o `apagado_em`.** `ArquivoDoTitularRepository.gravar` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/packages/nucleo/src/titular/arquivo-do-titular.repository.ts:96-104`) não toca nessa coluna. Por isso o passo final do caso da versão da escola (`:767-768`) continua certo mesmo se o worker regravar depois.
- **A asserção sobre a URL assinada vem da tentativa aceita.** `armazem.urlsAssinadas.at(-1)` e `sexto.resposta.em` são dessa tentativa.
- **Nos três casos o passo está dentro do auxiliar** (`:756-765`, `:877-892`, `:1025-1048`). No caso "meus dados", se o worker regravar a linha e desfizer o `+1 h` do `preparar`, o passo roda de novo.
- **Não há chamada a provedor pago.** Só o arquivo de teste mudou, nenhuma linha de `src`.

Recomendações:
- **Corrida antiga no caso da versão da escola** (`arquivo-do-titular.int.test.ts:751-752`). A asserção de que o pedido `emPreparacao` não serve arquivo roda logo depois do `registrar`. Com um worker de pé, o job desse pedido pode terminar antes dela. Ela já existia antes desta correção e está registrada no documento. Pode virar correção própria, que espera o estado ou para o consumo.
- **Regravação em produção** (`montar-arquivo.ts:57-61` e `arquivo-do-titular.repository.ts:103`). Quando o job é entregue de novo, ele renova a validade de 7 dias, porque o `on conflict` regrava `pronto_em` e `expira_em`. A regravação deveria manter o `pronto_em` original ou só gravar se o pedido ainda estiver `em_preparacao`. Isso já está encaminhado como correção própria pelo Orquestrador.
- **Relógio do job sem prova.** Com o worker regravando a linha, nenhum teste prova mais que o job usa o relógio injetado. Isso volta junto com a correção da linha acima.
- **Documento da correção.** Vale registrar ali que a saída escolhida, conferir a linha antes e depois, depende de `pronto_em` diferir entre o relógio do teste e o do worker. É a premissa que mantém a comparação válida.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-25 00:29:23 · `tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`

VEREDITO: REPROVADO

Cenários exigidos (os da ordem da rodada 1, item 1): nenhuma asserção dos três pontos de fronteira (a versão da escola, a fronteira do aluno, a situação "expirado") nem de "Meus dados" pode depender de uma regravação que o worker faz em momento indeterminado. O documento deve dizer em qual pilha a estabilidade foi medida, com despachante e worker de pé.

Cobertos:
- **Versão da escola** (`:757-766`): cada lado da fronteira roda em `comALinhaParada` sobre a versão `coordenacao`, que é a que a rota lê. As linhas `:767-768` (`apagado_em`) aguentam uma regravação tardia, porque o upsert em `packages/nucleo/src/titular/arquivo-do-titular.repository.ts:103` só regrava `bytes`, `prontoEm` e `expiraEm`, e não mexe em `apagadoEm`.
- **Fronteira do aluno** (`:1037-1048`): o download no prazo, o download vencido e a situação "expirado" estão no mesmo passo, sobre a mesma linha parada. Corrigido.
- **6º dia** (`:1024-1033`): o nome do arquivo e o `validaAte` saem do instante usado no passo e não dependem mais da hora em que o teste roda. A conferência de que o vencimento é `pronto_em` + 7 dias lê os dois campos da mesma linha, numa única leitura.
- **"Meus dados"**: o `expira_em` deslocado em +1 h separa "ler da linha" de "calcular `pronto_em` + 7" e de "relógio + 7". O teste agora falharia se o serviço calculasse o vencimento em vez de lê-lo. Era uma lacuna da rodada 1.
- **`beforeEach` do relógio** (`:84-86`): resolve a contaminação entre casos.
- **Estabilidade**: o documento diz a pilha (`educa-teste-1`) e as duas medições, sem worker 3 de 3 e com despachante e os dois workers de pé 5 de 5, com 450 jobs `concluido` como prova de que houve regravação.
- **Rodei** `npx vitest run apps/api/test/arquivo-do-titular.int.test.ts`: 39 de 39 verdes, nesta pilha sem worker.

Bloqueantes:
1. **Ainda há uma janela de corrida no `preparar` de "Meus dados".** Linhas `apps/api/test/arquivo-do-titular.int.test.ts:452-453`, com efeito em `:882` e `:891`.
   - **O que acontece:** `comALinhaParada` roda `preparar()` (o `update ... expira_em = pronto_em + 7 days 1 hour`) e só depois lê o `antes`. Se o worker regravar a linha entre essas duas consultas, o `antes` já é a linha regravada, com `expira_em` = `pronto_em` + 7 dias exatos. O `depois` é igual a ela, então o laço não repete e devolve essa linha. A asserção de `:891` (`listado` diferente de `prontoEm` + 7 dias) fica vermelha sem defeito no código.
   - **O texto do auxiliar está errado:** o comentário de `:443` diz que "a regravação que desfaz isso faz repetir". Nessa janela, não faz.
   - **Por que bloqueia:** a janela é estreita, mas é o mesmo tipo de defeito que a ordem da rodada 1 mandou fechar ("nenhuma asserção pode depender de uma escrita que um processo de fora faz em momento indeterminado").
   - **Correção exigida, uma das duas:**
     - (a) `preparar` devolve a linha que gravou (`update ... returning pronto_em, expira_em`), e o laço trata como linha mudada quando o `antes` for diferente dela;
     - (b) em "Meus dados", o laço só aceita a tentativa se `antes.expiraEm - antes.prontoEm` for 7 dias + 1 h, e senão repete.

     Em qualquer das duas, o comentário de `:443` tem de passar a dizer o que de fato vale.

Recomendações:
- **Asserção do pedido em preparação** (`:751-752`): roda logo depois do `registrar`, e com um worker de pé o job desse pedido pode terminar antes dela. Já era assim no HEAD, o documento registra o ponto, e a folga real é de uns 3 s. Vale fechar na mesma passada: tirar o pedido da fila no teste, ou conferir `estado = 'em_preparacao'` na linha antes e depois da chamada.
- **Relógio injetado no job:** a correção própria de código de produção que o documento lista (o job não regravar o `pronto_em` de um pedido já pronto, `montar-arquivo.ts:51-64`) é também o que deixa provar de novo que o job usa esse relógio. Vale encaminhá-la junto com o relatório da Mesa, como o documento já propõe.
- **Nome do caso do 6º dia:** às 15:00Z, a data do "6º dia" fica entre 5 dias e 15 h e 6 dias e 14 h depois do `pronto_em`. A regra continua provada (antes dos 7 dias), mas o nome do caso diz mais do que o teste mostra. Uma linha no comentário bastaria.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/arquivo-do-titular.int.test.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`

## test-engineer · 3ª rodada · APROVADO · 2026-10-25 00:44:41 · `tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`

**VEREDITO: APROVADO**

**Cenários exigidos (desta correção):**
- A fronteira dos 7 dias vem do `expira_em` da linha: 1 s antes baixa, 1 s depois responde como o id inexistente. Vale para a versão `completa` e para a `coordenacao`.
- O 6º dia: nome do arquivo e `validaAte` saem do instante fixado, e a hora em que o teste roda não muda nada.
- "Meus dados" lista o `expira_em` da linha, e não `pronto_em` + 7 dias nem relógio + 7 dias.
- O job grava com o relógio injetado.
- Nenhuma asserção depende de uma escrita que o worker da pilha faz em momento que o teste não controla.

**Cobertos:**
- **Correção 1 da 2ª rodada: feita, de um jeito melhor que as duas saídas que pedi.** O `comALinhaParada` e o `preparar` saíram, e a janela foi junto.
  - O `tirarDaFila` (`apps/api/test/arquivo-do-titular.int.test.ts:435-449`) tira da fila o job do pedido, e o `montar` do teste passa a ser o único que grava a linha.
  - Conferi contra `packages/nucleo/src/fila/despacho.repository.ts`. O despachante só reserva job `aguardando`, ou `reservado` com a reserva vencida (`:109`, `:283`). A reconciliação deixa de fora `concluido` e `falhou` (`:99`).
  - A disputa se decide no banco, no `update … where estado = 'aguardando'`. Se o despachante trava a linha primeiro (`for update skip locked`), o `update` do teste espera, relê o estado, não pega linha nenhuma e cai no ramo de espera. Se o teste trava primeiro, o despachante pula a linha.
  - O desfazer do ramo de espera é completo. O job (`apps/worker/src/processadores/montar-arquivo.ts`) só mexe em `arquivo_titular` e no `estado` do pedido (`marcarPronto`, `arquivo-do-titular.repository.ts:111-118`), e o teste desfaz os dois.
- **"Meus dados"** (`:876-889`): o `update … returning` devolve a própria linha que foi mexida, e as três asserções saem dela. O comentário enganoso de `:443` saiu junto com o auxiliar.
- **Recomendações da 2ª rodada que a ordem mandou aplicar: as duas feitas.**
  - O pedido "em preparação" agora passa por `tirarDaFila` (`:755`).
  - O instante do 6º dia está explicado em `:1023`: o que se prova é "antes dos 7 dias".
- **Relógio injetado provado de novo** (`:1021`): o teste é o único escritor, então `prontoEm` tem de ser igual a `relogio.atual`.
- **Estabilidade:** o documento diz em qual pilha mediu (com e sem despachante e worker) e que o ramo de espera rodou de verdade (1 vez em 114 pedidos).
- **Execução:** rodei `npx vitest run test/arquivo-do-titular.int.test.ts` uma vez, com 39 de 39 verdes. O arquivo de teste na árvore é igual ao do commit `110ec3cf`.
- **Higiene:** nenhum `.skip`, nenhum provedor de IA. O mock que existe é só do armazém, que é storage de fora. Não muda código de produção, então o "Sem mutação" está correto.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Ainda há um caso exposto ao worker da pilha, que eu deixei passar na 2ª rodada.** No caso "com o armazém fora…" (`apps/api/test/arquivo-do-titular.int.test.ts:1136-1144`), o `registrar` vem seguido de três asserções sem `tirarDaFila`: estado `em_preparacao` em `:1141`, nenhuma linha em `:1143` e 404 em `:1144`.
   - O `armazem.fora` só desliga o armazém falso do teste. O worker da pilha grava no armazém de verdade, monta a linha e deixa o pedido `pronto`.
   - Se ele terminar nessa janela de milissegundos, as três ficam vermelhas sem defeito no código.
   - É o mesmo padrão corrigido em `:755`, e já estava assim antes da correção. A correção é um `await tirarDaFila(cenario.escolaId, pedidoId)` logo depois do `registrar`.
   - Pelo mesmo motivo, a frase do documento "depois da chamada, a linha só muda pela mão do próprio teste" vale só para os casos que chamam o `tirarDaFila`.
2. **`:880`:** se o `update` não achar linha, as datas viram `NaN`, e `toBe(NaN)` passa (o `Object.is` trata dois `NaN` como iguais). Hoje a `:888` acaba pegando esse caso, mas um `expect(movida).toHaveLength(1)` antes deixa a intenção explícita.
3. **`:1021`:** a prova de que o job usa o relógio injetado depende de a hora real ter andado entre o `beforeEach` e o `montar`. Fixar `relogio.atual` num instante claramente diferente da hora real (por exemplo, uma hora atrás) logo antes do `pedidoPronto` tira essa dependência.

Arquivos auditados: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/test/arquivo-do-titular.int.test.ts` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`.

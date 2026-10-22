# Achados das revisões — `tasks/prd-reengenharia/51_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 11:56:39 · `tasks/prd-reengenharia/51_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `resposta_atividade`. A tarefa não cria tabela nova, só a coluna `sequencia` (`bigint`, `default 0`, `not null`, em `packages/nucleo/drizzle/0037_sequencia_da_resposta.sql`). A tabela já tem `escola_id` e `ano_letivo_id`, e o índice único que a escrita usa começa por esses dois. Os ids continuam UUID. Não há `@SemEscopo()` novo, nem consulta da camada rede.

Queries verificadas (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/atividade/minha-atividade.repository.ts`):
- **`responder`:** a gravação usa a escola, o ano e o aluno do token (`exigirEscolaDoContexto`, `exigirAnoEmCurso`, `sessaoDaRequisicao`). O alvo do `on conflict` é o índice único com escola, ano, aluno e questão, então o `do update` só alcança a linha do próprio aluno. A releitura de quem perde (linha 242) passa por `#minha` (escola, ano, aplicação e aluno da sessão) e pela questão.
- **`respostas`:** passa por `#minha`.
- **O `PUT`:** antes de gravar, `travarParaGravar` confere a turma do aluno com `#daMinhaTurma`.
- **Corpo do pedido:** o esquema é estrito. `escolaId` e `alunoId` no corpo dão `ENTRADA_INVALIDA`, e o teste prova isso nos dois casos. O que fica gravado e o que se lê nunca dependem de id vindo do cliente.
- **Arquivo do titular** (`packages/nucleo/src/titular/leitura-do-titular.ts`): continua filtrado por `escola_id` e `aluno_id`.

Teste de isolamento: presente e efetivo.
- `apps/api/src/atividade/atividade.int.test.ts:290`: o aluno da escola A que manda resposta para a atividade da B recebe o mesmo 404 do id inexistente, e a linha da B não muda. Sem o escopo da turma, esse teste quebra.
- `apps/api/src/atividade/atividade.int.test.ts:251`: quem perde recebe a resposta gravada da própria questão e do próprio aluno, nunca a de uma colega. Duas mutações declaradas tiram `#minha` e a questão da releitura, e o teste fica vermelho.
- `atividade-isolamento.int.test.ts`: segue separando o aluno de outro aluno, agora com `sequencia` na resposta.

Bloqueantes: nenhum.

Recomendações:
- As mutações da releitura tiram `#minha` inteiro. Nenhuma tira só o `eq(escolaId)`, e nenhum teste de outra escola passa pelo caminho de quem perde. Falta um caso em que o aluno da A perde para uma `sequencia` mais alta sem que nada da B volte na resposta. Hoje a cláusula está protegida porque o alvo do conflito já é por escola, então esse caso seria só cobertura a mais.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-22 11:56:39 · `tasks/prd-reengenharia/51_task.md`

VEREDITO: APROVADO

Tela vista: sim (6 fotos lidas, escola cheia e vazia, computador e celular). A tela que a tarefa altera, a atividade em andamento com o aviso "Sua resposta foi alterada em outra janela", não está nas fotos. Revisei essa parte pelo código (`Atividade.tsx`, `Atividade.test.tsx`) e pelo diff.

Estados: ok.
- Os estados de carregando e de erro não mudaram, e a tarefa não mexe neles.
- A lista com dado e a vazia aparecem nas fotos.
- A vazia convida: "Nada para fazer agora. Quando quem dá a aula passar uma atividade para a turma, ela aparece aqui."
- A atividade enviada mostra o resultado com a marca "IA".

Acessibilidade: ok.
- O aviso novo fica dentro da região `role="status"` que já existia, em `apps/web/src/areas/aluno/Atividade.tsx:200`. Essa região fica sempre na tela, então o leitor de tela anuncia o aviso.
- O aviso usa o token `text-apoio` (`apps/web/src/estilos.css:49`, `#424242`), de contraste adequado.
- Não depende de cor nem de hover.
- Os alvos de toque da tela não mudaram: `size-11` no mapa de questões, `min-h-14` nas alternativas.
- O aviso quebra linha por `break-words`, e a região usa `flex-wrap`.

Chromebook fraco: ok.
- Não entra lista longa nem imagem.
- O custo novo é um `useEffect` que adota a leitura da prova e um `includes` sobre um array curto de questões avisadas, sem impacto de CPU.

Celular: ok.
- As fotos a 360 px não mostram rolagem horizontal, texto cortado, nem alvo abaixo do mínimo.
- A barra inferior aparece sobre o conteúdo na foto de página inteira (`aluno--aluno-atividades--Cinemática-lista-sintética--celular.png`). É efeito da captura de página comprida, não defeito desta tarefa.
- O aviso novo não depende de nada exclusivo do desktop.

Ação oficial protegida: sim. A tarefa não cria nem muda ação oficial. "Enviar a atividade" continua com diálogo de confirmação (`DialogoDeConfirmacao`, família `oficial`).

Bloqueantes: nenhum.

Recomendações:
- O aviso diz o que aconteceu, mas não o que fazer, e aparece ao lado de "Resposta salva". Algo como "Sua resposta foi alterada em outra janela. Confira a alternativa marcada e, se quiser, escolha de novo" fecharia a regra 8 da revisão (erro diz o que fazer). Constante em `apps/web/src/areas/aluno/atividade.ts`, junto de `AVISO_DE_OUTRA_JANELA`. Os testes comparam pela constante e por texto literal, então a troca é pontual.
- O e2e `e2e/aluno-atividade.spec.ts` não exerce o aviso nos projetos `chromebook` e `celular`, só o teste de unidade (`apps/web/src/areas/aluno/Atividade.test.tsx`). Um caso de e2e com a segunda janela deixaria provado que o aviso cabe a 360 px.
- A vitrine só tem atividades já enviadas. Uma atividade em andamento na semente da vitrine permitiria fotografar a tela que esta linha da web altera.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 11:57:26 · `tasks/prd-reengenharia/51_task.md`

VEREDITO: APROVADO

Caminho quente tocado: prova | migration

Rate limit: ok (a tarefa não cria rota nova; o `PUT` da resposta continua sob o limite por usuário, de 120 por minuto)

Fila e prioridade: ok (não se aplica, porque não há job)

Concorrência: protegida. A decisão fica no banco, numa instrução só (`onConflictDoUpdate` com `setWhere excluded.sequencia > resposta_atividade.sequencia`), em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/atividade/minha-atividade.repository.ts:224-237`. Quando o `WHERE` dá falso, o Postgres trava a linha mesmo assim, então o `select` do caminho de quem perde, na mesma transação, lê a linha que já foi gravada. O `travarParaGravar` usa `FOR SHARE`, e por isso 35 alunos da mesma aplicação não esperam uns pelos outros. Há teste de corrida com 5 e 7 em `Promise.all`, nas duas ordens e com 20 repetições, outro com cinco reenvios iguais, e outro com a mesma sequência e alternativa diferente.

Índice e paginação: ok. A escrita e a leitura de quem perde vão pelo índice único `(escola_id, ano_letivo_id, atividade_aplicada_id, aluno_id, questao)`. O `select` extra só acontece quando o pedido perde e lê uma linha só.

Degradação de IA: não se aplica

Migration: compatível. `ADD COLUMN ... bigint DEFAULT 0 NOT NULL` usa default constante, então entra só no catálogo, sem reescrever a tabela. Corre sob `lock_timeout` de 5 s com novas tentativas (`packages/nucleo/src/db/migrar.ts:17,54`). O código anterior continua gravando, e a linha dele nasce com 0. Há teste aplicando o arquivo sobre linhas antigas.

Métrica e alerta: ok. A tarefa não cria rota nem alerta, e o `PUT` existente segue medido pela métrica HTTP.

Bloqueantes: nenhum

Recomendações:
- **Contrato na janela do deploy.** São dois casos, e nenhum se resolve pela regra de migration:
  - Web nova com API antiga: o pedido `PUT { alternativa, sequencia }` cai no `strictObject` antigo, volta `ENTRADA_INVALIDA` e vira falha `recusada` ("Chame quem dá a aula"), em `apps/web/src/areas/aluno/respostas.ts:140`.
  - Aba aberta com o cliente antigo e API nova: a resposta passa a trazer `sequencia`, o `esquemaRespostaQuestaoSalva` antigo, também estrito, não a aceita, e a fila tenta de novo para sempre, embora a resposta já esteja gravada.
  
  O deploy fora do horário letivo reduz o risco, mas atividade feita em casa pode estar aberta nesse momento. Registre em `docs/runbook.md` que a API sobe antes da web, ou faça o cliente aceitar chave a mais na resposta.
- **Teto para a `sequencia`.** `esquemaSequencia` (`packages/shared/src/atividade/prova.ts`, `z.number().int().nonnegative()`) não tem teto explícito além do inteiro seguro do Zod. Só o próprio aluno é afetado, mas um `.max()` declarado deixa a escala legível.
- **Cenário de carga da prova.** Não existe cenário em `infra/k6/` para a prova online (`docs/infra.md` 3.3: 35 alunos salvando por item, com a rede oscilando). Ele cabe junto da 52.0 e da 53.0, que fecham o reenvio e o F5.
- **Fixtures no caminho do cliente antigo.** `apps/api/test/atividade-de-teste.ts:114` e `e2e/__fixtures__/aluno-pela-api.ts:31` ainda mandam o `PUT` sem `sequencia`. Vale como caracterização do cliente antigo, mas convém deixar isso dito no fixture, para ninguém tomar esse caminho como o padrão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 11:58:41 · `tasks/prd-reengenharia/51_task.md`

VEREDITO: REPROVADO

**Cenários exigidos**
- **Caminho feliz:** a escolha nova, com `max(local, servidor) + 1`, vence e é gravada.
- **Casos de borda:**
  - 5 e 7 chegam juntos, nas duas ordens.
  - A 5 chega depois da 7.
  - Duas abas mandam a mesma sequência com alternativas diferentes.
  - Cliente antigo sem `sequencia`, misturado com o cliente novo.
  - Reenvio igual depois da queda de rede, cinco vezes em paralelo.
  - Leitura da prova atrasada ou à frente da janela.
  - Escolha feita enquanto a anterior ainda está sendo salva.
  - Linhas gravadas antes da migration.
  - Envio depois do encerramento.
- **Permissão:** chave a mais no corpo (`alunoId`, `escolaId`) e sequência inválida.
- **Isolamento:** aluno de A com a atividade de B, e quem perde nunca recebe a linha de um colega nem de outra questão.
- **Concorrência:** os dois `PUT` em `Promise.all` de verdade.

**Cobertos**
- Cada linha da tabela de testes tem o seu teste, citado pelo nome.
- Em `apps/api/src/atividade/atividade.int.test.ts`:
  - "5 e 7 ao mesmo tempo…": `Promise.all` real, 20 repetições, nas duas ordens.
  - "a 5 que chega depois da 7…"
  - "a mesma sequência com outra alternativa…"
  - "quem perde numa questão…"
  - "cliente antigo…"
  - "sequência negativa, fracionária…"
  - "o aluno de A com a atividade de B…"
  - "depois do envio, ATIVIDADE_ENCERRADA…"
  - "a migration 0037…": roda o SQL do arquivo num schema de rascunho com linhas antigas.
  - A caracterização dos cinco reenvios em paralelo. O teste antigo agora confere `sequencia: 7`, o que prova o incremento atômico sob concorrência no cliente antigo.
- Na unidade da web:
  - `respostas.test.ts` cobre a fila: `max + 1`, a aba que perde adota a gravada e não reenvia, e a leitura atrasada não faz a janela recuar.
  - `Atividade.test.tsx` cobre a tela: o aviso dentro do `role="status"` e a alternativa do servidor marcada.
- `packages/shared/src/atividade/atividade.test.ts` cobre o contrato.
- Rodei `npx vitest run --project unidade` (81 verdes) e `--project integracao` nos dois arquivos de atividade (48 verdes).
- Não há `.skip` nem mock que esconda a regra. A rede falsa da web e a API simulada do e2e só substituem o servidor, e a fila e a tela usadas são as de verdade.

**Bloqueantes**

1. **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/atividade/minha-atividade.repository.ts:231` não tem bloco de mutação.**
   - **O que falta:** a cláusula nova `sequencia: sql\`excluded.sequencia\`` no `set` do `onConflictDoUpdate` do cliente novo. É ela que faz a sequência gravada subir quando a escolha nova vence. Os blocos atuais só a mostram como contexto da mutação do `setWhere`.
   - **Correção exigida:** acrescentar um bloco que a troque por `sql\`${respostaAtividade.sequencia}\`` (manter a sequência antiga), citando `atividade.int.test.ts › cliente antigo`. Nesse teste, o novo com 3 sobre a gravada 2 ficaria em 2 e a asserção `sequencia: 3` deve ficar vermelha. O portão prova.

**Recomendações**
- **Corrida de duas abas com a mesma sequência:** "a mesma sequência com outra alternativa" roda em sequência. Vale um caso em `Promise.all` com sequência 6 e alternativas 1 e 3: as duas respostas devem ser iguais à linha gravada, qualquer que seja a que venceu.
- **Nome fixo do schema no teste da migration:** `atividade.int.test.ts:175-193` cria `rascunho_0037` com nome fixo. Uma execução morta entre o `create` e o `drop` deixa o banco acumulado vermelho para sempre. Use `drop schema if exists … cascade` antes do `create`, ou um sufixo aleatório.
- **Coluna no arquivo do titular:** `packages/nucleo/src/titular/leitura-do-titular.ts:268-271` só está protegida pela guarda de destino de coluna. Um bloco de mutação, ou uma asserção de integração de que o arquivo do titular traz `sequencia`, fecharia o item 19 da regra 20.
- **Fluxo pelo navegador:** o e2e só ajustou os corpos e a API simulada. Um caso com duas páginas na mesma atividade, em que a segunda vence e a primeira mostra o aviso, cobriria o fluxo inteiro nos projetos `chromebook` e `celular`. Pode ficar para a 52.0 ou 53.0.
- **Mutação do `setWhere`:** está citada contra o teste sequencial, o que está certo por ser determinístico. A tabela, porém, atribui essa mutação ao teste da corrida. Vale alinhar o texto da tabela com o bloco.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 11:59:26 · `tasks/prd-reengenharia/51_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

**O que conferi**
- **Servidor.** O upsert só troca a resposta quando chega uma `sequencia` maior. Quem chega atrasado não troca nada e recebe de volta a resposta gravada, lida com o escopo inteiro da escola, do ano e do aluno. Sem `sequencia`, o cliente antigo grava a sequência atual mais 1.
- **Migration.** `bigint DEFAULT 0 NOT NULL`, como pedem o `onda-3c.md` T13 e a `techspec.md` §3.
- **Web.** A fila manda a maior sequência que já viu, dela ou do servidor, mais 1. A aba que perde adota a resposta do servidor, não reenvia e mostra o aviso no `role="status"`. A releitura atrasada não passa por cima de nada.
- **Divergências.** A do e2e e a do arquivo do titular estão justificadas na spec: a do titular foi acrescentada ao `onda-3c.md` T13, e a mudança do `PUT` está na tabela de rotas da `techspec.md` §3.
- **Arquivos.** Os que a tarefa previa e não mudaram, como o controller, não precisavam mudar: o pipe já valida pelo esquema compartilhado.

**O teste que já falhava (`apps/api/test/arquivo-do-titular.int.test.ts`)**
Rodei o teste nesta árvore. Falham 3 casos, não 4 como o Implementador relatou:
- "a versão da escola apagada ou vencida…"
- "\"Meus dados\" lista só os pedidos…"
- "a URL vale 300 s…"

As três falhas são de data. O teste usa datas fixas, de 2026-10-12 a 2026-10-19, que hoje (22/10) já passaram, e a validade do arquivo sai do relógio real. A asserção que falha diz `expected 1793285863754 to be 1793023201000`: cerca de 3 dias de diferença, que é exatamente quanto o dia de hoje passou de 19/10.

O diff só acrescenta `sequencia` à lista de colunas lidas em `leitura-do-titular.ts`. Os casos que dependem de coluna passam todos, 35 ao todo, entre eles "o aluno: cada tabela que ele tem aparece" e "nenhuma coluna de COLUNAS_FORA_DO_ARQUIVO aparece". Por isso a falha não é desta tarefa.

Tentei comparar com o código antes da tarefa, numa cópia separada, mas a comparação não valeu: a cópia usou o banco e os pacotes desta árvore e quebrou por outro motivo. A conclusão vem da leitura das asserções, não dessa comparação.

O problema continua: a esteira vai ficar vermelha por causa disso até alguém corrigir.

Recomendações:
- **O teste do titular com data fixa** precisa de uma correção própria antes do pouso, ou de uma linha no `TODO.md`. Não é desta tarefa.
- **A caracterização sem commit próprio (51.1)** só está registrada no `51_task.md`. Não contradiz nada da spec, porque a spec não fala da ordem dos commits, mas vale uma linha no `onda-3c.md` T13 para quem ler depois.
- **`apps/web/src/areas/aluno/respostas.ts:395` (`confirmarEnvio`).** Se o aluno escolhe outra alternativa enquanto um envio que vai perder ainda está no ar, a nova escolha sai com a sequência que a aba conhecia e perde também. O aviso aparece e o clique seguinte vence, como pede o T13. O comentário diz "o servidor decide por ela", o que está certo, mas um caso de unidade com esse nome deixaria isso claro.
- **`apps/api/src/atividade/minha-atividade.repository.ts:58`.** A constante `COLUNAS_DA_RESPOSTA` está entre duas declarações de interface. Fica mais legível junto de `responder` e `respostas`, que são as funções que a usam.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-22 12:12:11 · `tasks/prd-reengenharia/51_task.md`

VEREDITO: APROVADO
Caminho quente tocado: prova
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum

Recomendações:
- A 1ª rodada não exigiu correção bloqueante, e as quatro recomendações dela estão no `TODO.md` deste diff (linhas 1590 a 1596): o e2e com duas páginas, a ordem de deploy no `docs/runbook.md`, o teto da `sequencia` em `esquemaSequencia` e o cenário de carga da prova em `infra/k6/`. Este último continua em aberto e precisa entrar até a 52.0 ou a 53.0, que ainda mexem no caminho quente da prova.
- Mudar `COLUNAS_DA_RESPOSTA` de lugar em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/atividade/minha-atividade.repository.ts:72` não muda o comportamento. A constante é declarada no topo do módulo e só é usada dentro de métodos, a partir da linha 210, então não há problema de ordem de inicialização.
- O caso novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/atividade/atividade.int.test.ts:251` testa a disputa do item 7 da regra 80: dois envios com a mesma sequência ao mesmo tempo, uma linha só gravada e as duas respostas iguais a ela. Ele cobre o `setWhere` com `>` estrito em `responder`, que o caso anterior não cobria. Usar um aluno próprio (`length: 11`) mantém o teste dentro do limite de 120 requisições por minuto por usuário.
- O item do `TODO.md` sobre `arquivo-do-titular.int.test.ts` com data fixa deixa a esteira vermelha e precisa ser resolvido antes do pouso. Não bloqueia esta tarefa porque o problema é anterior a ela e foi verificado revertendo `leitura-do-titular.ts`, mas o Orquestrador precisa acompanhar para que não fique esquecido.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-22 12:12:22 · `tasks/prd-reengenharia/51_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `resposta_atividade`, com a coluna `sequencia` da migration 0037. O schema não mudou desde a rodada aprovada e a tabela continua com `escolaId` e `anoLetivoId`.

Queries verificadas: em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/atividade/minha-atividade.repository.ts`, conferi `respostas` (linhas 208-214), `responder` (linhas 223-246, nos dois ramos de `onConflictDoUpdate` e na leitura de quem perde) e a constante `COLUNAS_DA_RESPOSTA`, que agora está na linha 72. A constante só mudou de lugar. O escopo continua vindo do contexto: `#minha`, `exigirEscolaDoContexto()`, `exigirAnoEmCurso()` e `sessaoDaRequisicao().usuarioId`. O alvo do conflito continua por escola, ano letivo, aplicação, aluno e questão. Nenhum parâmetro do cliente decide o escopo. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/titular/leitura-do-titular.test.ts`, o teste novo confere que a `sequencia` está nas colunas que o arquivo do titular declara e no `select` que o lê. A leitura do titular em si não mudou.

Teste de isolamento: presente e efetivo. O de `atividade-isolamento.int.test.ts` foi aprovado na rodada anterior e não mudou neste diff. O caso novo de concorrência, com a mesma sequência e alternativas diferentes, usa o 11º aluno (`alunos[10]`, com `length: 11`). Ele exige uma linha só e que as duas respostas sejam iguais à gravada, com a mesma alternativa, e não enfraquece nenhuma asserção de escopo.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. A recomendação da 1ª rodada, um caso a mais para quem perde sem retorno da escola B, foi recusada pela Mesa e fica registrada como já estava.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-22 12:12:34 · `tasks/prd-reengenharia/51_task.md`

VEREDITO: APROVADO
Tela vista: sim (6 fotos lidas, cheia e vazia). A atividade em andamento, com o aviso "Sua resposta foi alterada em outra janela", não está nas fotos. Revisei esse aviso pelo código (`Atividade.tsx`, `respostas.ts`) e por `Atividade.test.tsx`.
Estados: ok. A lista tem carregando (conferido pelo código, não pela foto), vazio (a escola vazia mostra "Nada para fazer agora" com o próximo passo), e a lista cheia. O erro de envio aparece em `role="alert"` (`Atividade.tsx:350`), e a atividade encerrada tem o aviso próprio.
Acessibilidade: ok. O aviso da outra janela fica em região `role="status"` fixa (`Atividade.tsx:190`). A navegação por questão tem `aria-label` e `aria-current`. Os ícones são `aria-hidden` e o link de voltar tem `min-h-11`. O foco e o contraste seguem os tokens da pele.
Chromebook fraco: sem regressão. Não mudou nenhum arquivo de tela desde a rodada anterior, só um teste de unidade em `respostas.ts`. A lista tem duas atividades e não pede virtualização.
Celular: ok a 360 px, sem rolagem horizontal nem texto cortado. A barra inferior de abas e o botão SAIR têm alvo de toque adequado. Na foto longa do detalhe, a barra inferior aparece sobre o meio do conteúdo. Isso vem de a captura ser de página inteira com a barra fixa, não de defeito da tela. A tela rola a 1366 × 768 (1218 px), mas é um detalhe de atividade com conteúdo corrido, não uma tela em que só o miolo deveria rolar.
Ação oficial protegida: sim. Esta tela é do aluno e só mostra resultado já aprovado. O selo "CORREÇÃO APROVADA POR PROFESSOR… · data" e a marca "IA" estão visíveis no resultado (regra 70, item 4a). Nenhuma ação oficial acontece em um clique.
Bloqueantes: nenhum.
Recomendações:
- Texto do aviso "Sua resposta foi alterada em outra janela": a Mesa já o encaminhou ao Arquiteto, na revisão do corte da tela (onda 4, X6).
- Pôr uma atividade em andamento na semente da vitrine, para o aviso e a tela de resposta aparecerem nas fotos. A Mesa já destinou isso ao TODO.md.
- Escrever em linguagem corrente o rótulo "Assistente · correção de objetiva" (`Atividade.tsx`). Não é termo técnico vazando, é só gosto.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 12:12:57 · `tasks/prd-reengenharia/51_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum

Esta rodada conferiu o diff `ce1f353..e44ff80` e o que ele afeta. A rodada anterior não exigiu nenhuma correção, e as duas recomendações que a Mesa mandou aplicar foram feitas.

- **Caso de unidade de `confirmarEnvio`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/areas/aluno/respostas.test.ts:140`): cobre a escolha feita enquanto um envio que vai perder está no ar. A segunda escolha sai com a sequência que a aba conhecia, sem aviso enquanto o resultado não volta. Quando ela perde, aparece o aviso, a fila esvazia e nada é reenviado. O clique seguinte sai com sequência 8, uma acima da do servidor, e o aviso some. O teste falha se a regra de `max(local, servidor)` ou a limpeza da fila forem apagadas.
- **`COLUNAS_DA_RESPOSTA`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/atividade/minha-atividade.repository.ts:72`): só mudou de lugar. Os três usos (linhas 210, 235 e 241) não mudaram.
- **Caso concorrente com a mesma sequência e alternativas diferentes** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/atividade/atividade.int.test.ts:251`): o resultado bate com o `setWhere` estrito (`excluded.sequencia > sequencia`, linha 233). Com a mesma sequência, quem chega depois não troca nada e recebe a linha que ficou gravada. Os dois pedidos respondem 200 com o mesmo corpo, e só existe uma linha. O aluno de índice 10 só existe porque agora são 11 alunos, e nenhum outro caso usa esse índice.
- **Teste da migration**: limpar `rascunho_0037` antes de criá-lo tira o risco de um schema largado por uma execução interrompida derrubar o teste.
- **Teste do titular** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/titular/leitura-do-titular.test.ts:85`): falha se `sequencia` sair da lista `colunas` ou do `select`, ou se os dois passarem a divergir.
- **TODO.md**: as sete linhas têm origem e destino. A do `arquivo-do-titular.int.test.ts` com data fixa diz que tem de ser corrigida antes do pouso, fora da 51.0. Isso é correto: a falha vem de antes e não é desta tarefa.

Recomendações:
- O caso concorrente (índice 10) está entre os casos dos índices 2 e 3, e o índice 9 não é usado por nenhum caso. Usar o 9, com `length: 10`, ou pôr o caso novo no fim deixaria a numeração na ordem do arquivo.
- A esteira continua vermelha por causa do `arquivo-do-titular.int.test.ts` até a correção própria. O Orquestrador precisa ver isso antes do pouso para não confundir com uma falha da 51.0.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 12:13:14 · `tasks/prd-reengenharia/51_task.md`

VEREDITO: APROVADO

Cenários exigidos: a escolha mais nova vence em corrida (5 e 7 em paralelo, nas duas ordens), a escolha atrasada perde e recebe a linha gravada, a mesma sequência com outra alternativa (em sequência e em paralelo), cliente antigo convivendo com o novo, entrada inválida, isolamento (aluno de A com atividade de B recebe 404), atividade já enviada recusa, migration sobre linhas antigas, o titular recebe a `sequencia`, e o lado da web (escolha feita com um envio perdedor no ar, aviso de alteração feita em outra janela).

Cobertos: todos. A correção exigida foi feita e o que a Mesa mandou aplicar foi conferido.

1. **Correção 1 (bloqueante da 1ª rodada), resolvida.** O bloco novo está em `tasks/prd-reengenharia/51_task.md:448-454`. Ele troca `sequencia: sql\`excluded.sequencia\`` por `sql\`${respostaAtividade.sequencia}\``, e o texto bate com `apps/api/src/atividade/minha-atividade.repository.ts:232`. O teste citado é `cliente antigo`. Nele, a sequência 3 enviada sobre a 2 gravada passa pelo `setWhere` (3 > 2), mas com a mutação a linha devolvida fica com `sequencia: 2`. Assim a asserção de `atividade.int.test.ts:286` (`sequencia: 3`) fica vermelha pelo motivo certo.
2. **Schema da migration.** O `drop schema if exists rascunho_0037 cascade` agora vem antes do `create` (`atividade.int.test.ts:338`).
3. **Corrida de verdade.** `atividade.int.test.ts:251` usa `Promise.all` com a mesma sequência 6 e as alternativas 1 e 3, num aluno próprio (`alunos[10]`, com `length: 11`). Exige 200 nas duas respostas, as duas iguais à linha gravada, e uma linha só. Contra o bloco do `>=` (`51_task.md:112-116`, que agora também casa com este caso pelo prefixo), o resultado é vermelho e não depende de sorte. Com `>=`, a segunda instrução espera o lock, reavalia e grava por cima, e cada resposta devolve o próprio `returning`. Uma delas então difere da linha gravada.
4. **Titular.** O teste novo em `leitura-do-titular.test.ts:85` confere a `sequencia` na lista de colunas e exige que o `select` leia exatamente essas colunas, na mesma ordem. Os dois blocos novos (tirar a coluna da lista, tirar do `select`) ficam vermelhos cada um por uma asserção diferente.
5. **Caso de unidade com nome.** `respostas.test.ts:140` cobre a escolha feita enquanto o envio perdedor está no ar. Ela sai com a sequência 2, perde também, levanta o aviso, a fila esvazia sem reenviar, e o clique seguinte sai com 8 e vence.
6. **Tabela de testes.** A 1ª linha diz que a mutação do `setWhere` é provada pelo caso sequencial "a 5 que chega depois da 7". O bloco de `51_task.md:104` cita esse mesmo caso, então tabela e bloco estão alinhados.

Rodei `npx vitest run` em `leitura-do-titular.test.ts` e `respostas.test.ts`: 39 de 39 passaram. Não rodei os testes de integração. Os blocos de mutação, conferi pelo texto do documento contra o código atual, sem aplicar nenhum.

Bloqueantes: nenhum.

Recomendações:
- O bloco de `51_task.md:112` cita o prefixo "a mesma sequência com outra alternativa", que agora casa com dois casos (`:240` e `:251`). Funciona, porque os dois rodam e ao menos um fica vermelho. Mesmo assim, citar o nome completo do caso em paralelo deixa claro qual deles prova o `>`.
- No caso em paralelo, só a resposta que perdeu passa pelo caminho de reler a linha gravada. Se esse caminho quebrasse, a asserção de igualdade pegaria, mas vale um comentário curto no teste dizendo isso, para quem ler depois.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/51_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/atividade/atividade.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/atividade/minha-atividade.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/titular/leitura-do-titular.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/areas/aluno/respostas.test.ts

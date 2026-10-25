# Achados das revisões — `tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 01:35:01 · `tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta correção. O diff mexe só no job `titular.montar-arquivo`, no `ArquivoDoTitularRepository.gravar` e no teste do job, e nenhum dos três grava em `Nota`. Todos com autor humano? Não se aplica.
Decisão autônoma sobre aluno: ausente. A guarda nova só decide se o arquivo do titular é montado de novo. Não toca aprovação, reprovação nem encaminhamento.
Aprovação registrada: ok. Nenhuma saída de IA passa por este fluxo: o arquivo é o que a escola guarda do titular, lido por `LeituraDoTitular`, sem agente no caminho. A exceção do tutor (D47) não aparece aqui.
Supervisão do tutor: ok. O tutor não é tocado.
Autonomia declarada e visível: sim, sem mudança. Nenhum agente nem nível de autonomia foi alterado.
Bloqueantes: nenhum.

O que conferi da regra 70:
- **Item 8, a conversa do professor fora do alcance da coordenação.** A versão `coordenacao` continua nascendo só quando o titular não tem conta ativa na escola (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/worker/src/processadores/montar-arquivo.ts:61-65`). A montagem dela não mudou. A guarda nova (`montar-arquivo.ts:53`) só pode impedir que um arquivo seja montado, e por isso não abre caminho para a conversa do professor entrar na versão da escola.
- **Itens 6 e 7, auditoria e vigilância.** Não mudam. O log novo `titular.arquivo_ja_montado` não leva dado pessoal nem conteúdo.
- **Escopo da escola.** O `doPedido` usado pela guarda lê a escola do contexto (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/titular/arquivo-do-titular.repository.ts:133`).
- **`docs/regulacao.md`.** Não foi tocado, e a correção não pede mudança nele.
- **Fotos da tela.** O prompt não trouxe nenhuma, e a correção não tem tela.

Recomendações: nenhuma dentro da regra 70. A validade, a retenção e o caso que fica sem guarda (pedido `concluido` reentregue depois de a rotina ter apagado a linha) são da regra 20 e da regra 80, com o `privacy-guardian` e o `infra-guardian`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/worker/src/processadores/montar-arquivo.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/titular/arquivo-do-titular.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/worker/test/montar-arquivo.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-25 01:35:05 · `tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration. `arquivo_titular` e `pedido_titular` já têm `escola_id`. O conflito continua no único `(escola_id, pedido_id, versao)`.

Queries verificadas:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/titular/arquivo-do-titular.repository.ts:122-136`: `doPedido` é a única leitura nova que o job faz. A escola sai de `exigirEscolaDoContexto()`, não de argumento.
- `arquivo-do-titular.repository.ts:97-106`: `gravar` tira `prontoEm` e `expiraEm` do `set` do `on conflict` e não muda a chave nem o escopo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/worker/src/processadores/montar-arquivo.ts:53`: a guarda nova usa só o pedido já lido com escopo (`pedidoParaMontar`) e o `doPedido` com escopo. O job continua recebendo só `pedidoId`, e a escola continua vindo do contexto.
- Nenhum endpoint novo e nenhum `escolaId` vindo do cliente. Nenhum `@SemEscopo()`. Nada toca a camada de rede. Os ids continuam UUID. O log novo (`titular.arquivo_ja_montado`) leva só o nome do evento.

Teste de isolamento: presente e efetivo. Esta correção não muda o isolamento, e os testes que já existiam no arquivo seguem valendo:
- `apps/worker/test/montar-arquivo.int.test.ts:238`: o pedido de outra escola termina sem efeito.
- `apps/worker/test/montar-arquivo.int.test.ts:259`: sem escola no contexto, o job não monta nada.

Os testes novos provam a regra de validade e de reentrega, com mutações declaradas no documento da correção.

Bloqueantes: nenhum

Recomendações:
- Nenhum teste quebraria se a cláusula `escola_id` saísse do `doPedido` (`arquivo-do-titular.repository.ts:133`). Hoje isso não abre vazamento, porque o `pedido_id` de outra escola não alcança o pedido desta. Mas, se o método for reaproveitado em outro lugar, ele não tem prova própria. Fica para a retro um caso no `arquivo-do-titular.int.test.ts` em que `doPedido`, rodando no contexto da escola A, não devolve a linha da escola B.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 01:35:18 · `tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md`

VEREDITO: APROVADO

A correção reduz a exposição e não cria nenhuma. Antes, uma reentrega do job renovava por mais 7 dias o acesso ao arquivo do titular e podia gravar de novo no storage um JSON que a rotina da escola já tinha apagado. Agora o job para quando o pedido está `pronto` ou quando a linha da versão completa já existe. Em caso de conflito na linha, só os `bytes` mudam, e o `pronto_em` e o `expira_em` de quem gravou primeiro ficam.

Não rodei os testes. O vitest parou antes de executar qualquer caso, porque o pacote `@educa/nucleo` não está construído no andar, e não construí para não gravar nada na árvore. O documento da correção registra 53 de 53 verdes em 25/10, nos dois arquivos que falam com o job.

Campos pessoais tocados: nenhum campo novo. A correção mexe no ciclo de vida de `arquivo_titular` (`pronto_em`, `expira_em`, `bytes`) e do objeto `titular/<escola>/<pedido>/<versao>.json`, que guarda tudo o que a escola tem do titular.

Fora da tabela de dados do docs/lgpd.md: nada. Não há coluna nem migration nova.

Autorização por objeto: ok. A nova consulta `doPedido` (`packages/nucleo/src/titular/arquivo-do-titular.repository.ts:122-133`) pega o escopo de `exigirEscolaDoContexto()`, e o `pedidoParaMontar` continua com escola e id. O pedido de outra escola ainda termina sem efeito, já no primeiro retorno.

Logs: limpos. O novo evento `titular.arquivo_ja_montado` (`apps/worker/src/processadores/montar-arquivo.ts:54`) leva só o nome do evento, sem id de pessoa nem conteúdo.

Auditoria: presente onde a regra exige. A correção não cria leitura nominal, exportação nem alteração de permissão. O job sem efeito não grava nada, e por isso não tem o que auditar.

Envio externo: nenhum. Não há IA nem provedor no caminho, só o storage privado (`ArmazemDeArquivos`, chave com prefixo da escola).

Seed/fixture: sintético. Os testes criam a escola e o pedido em bancada (`pedidoNovo`) e usam `ArmazemEmMemoria`.

Pergunta de fechamento: sim, o código responde. O arquivo do titular é justamente esse mecanismo, e a correção só faz a validade dele seguir a configuração. Uma reentrega não estende mais o tempo de acesso (regra 20, itens 14 e 16) e não traz de volta o que a eliminação ou o expurgo apagaram.

Bloqueantes: nenhum.

Recomendações:
1. Ainda há uma janela de corrida entre o momento em que o job passa pela guarda (`montar-arquivo.ts:53`) e o momento em que grava o objeto (`:69`). Se, nesse intervalo, outro job do mesmo pedido terminar e a eliminação do titular marcar `apagado_em` e apagar o objeto, este job grava o objeto de novo. A linha continua com `apagado_em`, então o expurgo seguinte o pega pelo `aApagar` (`repository.ts:146`). O problema é que o `apagarLinhas` pode já ter removido a linha, e aí o objeto fica órfão. A janela é de segundos e o defeito já existia antes, então não bloqueia. Uma saída barata é conferir de novo, dentro da transação, se a linha já existe com `apagado_em` e, nesse caso, apagar o objeto recém-gravado. Outra é a rotina de expurgo varrer objetos sob `titular/<escola>/` que não têm linha.
2. O documento já registra o caso sem guarda: pedido `concluido` cujo arquivo foi montado e depois apagado junto com a linha, reentregue mais de 7 dias depois. Esse caso gera um arquivo novo de 7 dias, o que o pedido concluído sempre fez, e a reentrega do BullMQ acontece em minutos. Vale citá-lo no mapa de retenção de `docs/lgpd.md`, para a resposta pronta à secretaria não ter surpresa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/worker/src/processadores/montar-arquivo.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/titular/arquivo-do-titular.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/worker/test/montar-arquivo.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 01:35:20 · `tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md`

VEREDITO: APROVADO
Caminho quente tocado: fila (job de lote `titular.montar-arquivo`; não entra no login, no tutor, na sala nem na prova)
Rate limit: ok (não se aplica: a correção não abre rota)
Fila e prioridade: ok (o job não mudou de fila nem de concorrência; a guarda nova só encerra mais cedo, sem efeito)
Concorrência: protegida. Dois jobs podem passar juntos pela guarda nova (busca e verifica sem trava) em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/worker/src/processadores/montar-arquivo.ts:53`. Isso não causa estrago: os dois escrevem na mesma chave do objeto, o `on conflict` do único `(escola_id, pedido_id, versao)` agora só troca os `bytes` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/titular/arquivo-do-titular.repository.ts:104`), e o `marcarPronto` continua sendo um `update` condicional. O teste "o job que perde a disputa..." cobre esse caso, e a mutação declarada no documento o derruba.
Índice e paginação: ok (`doPedido` lê pela restrição única `arquivo_titular_pedido_versao_unico`, que começa por `escola_id`; é uma linha só, com `limit 1`, e a escola vem do contexto)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (o novo `titular.arquivo_ja_montado` é só um evento de log, só com o nome; nenhum alerta novo e nenhuma mudança no caminho quente)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/worker/test/montar-arquivo.int.test.ts:123`: o `toBeGreaterThanOrEqual(2)` do teste com dois jobs ao mesmo tempo ficou fraco e aceita qualquer número de gravações. Vale prender também que a linha tem o `pronto_em` do relógio comum, para o caso não perder força.
- O caso que fica sem guarda, documentado na seção "Causa", deve ser registrado como risco conhecido no runbook do arquivo do titular, para não ser descoberto de novo numa auditoria. O caso: pedido `concluido` cujo arquivo já foi montado e apagado, junto com a linha, e que é reentregue depois de 7 dias.
- Não rodei a suíte: o `@educa/nucleo` não está compilado neste andar e eu não gerei os artefatos. O resultado de 53 de 53 verdes é o que o documento da correção informa; a esteira confirma.

## test-engineer · 1ª rodada · APROVADO · 2026-10-25 01:36:21 · `tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md`

VEREDITO: APROVADO

**Cenários exigidos**
- **Caminho feliz.** O primeiro job grava o objeto e a linha. A validade é de 7 dias a contar de `pronto_em`, e o pedido passa a `pronto`.
- **Reentrega de um pedido `pronto` e depois `concluido`.** A linha não é regravada e o objeto não é gravado de novo. `pronto_em` e `expira_em` ficam os do primeiro job.
- **Reentrega de um pedido `pronto` depois que a rotina apagou o objeto e a linha.** Nenhum dos dois volta.
- **Pedido que a coordenação concluiu antes de o job rodar.** Ele ainda é montado. Esse teste impede que a guarda vire "estado diferente de `em_preparacao`".
- **Dois jobs do mesmo pedido intercalados.** O que grava por último não renova a validade.
- **Dois jobs em paralelo de verdade (`Promise.all`).** Fica uma linha por versão, nenhum erro sobe e o pedido termina `pronto`.
- **Arquivo marcado `apagado_em` pela eliminação.** A reentrega não o ressuscita.
- **Isolamento.** O id do pedido da escola B dentro do job da escola A não lê nem grava nada.
- **Sem escola no contexto.** O job falha.

**Cobertos**
Todos estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/worker/test/montar-arquivo.int.test.ts`. Os quatro casos da seção "Teste que reproduz" existem, com os nomes citados:
- `:127`: reentrega de `pronto` e `concluido`
- `:148`: reentrega com objeto e linha apagados
- `:162`: pedido concluído antes de o job rodar
- `:174`: disputa intercalada

Os três blocos de mutação citam esses testes pelo nome exato, e conferi cada um contra o código:
- **Mutação 1 (tira `estado === 'pronto'`).** Com a linha apagada, `doPedido` não acha nada e o job monta de novo. O teste de `:148` fica vermelho em `objetos.size` (dá 1) e em `guardadas` (dá 2). O motivo do vermelho é o certo.
- **Mutação 2 (tira o `doPedido`).** O pedido `concluido` com linha passa da guarda. O teste de `:127` fica vermelho em `guardadas` (dá 2) e no evento de log. É a cláusula certa.
- **Mutação 3 (`set` volta a incluir `prontoEm` e `expiraEm`).** No teste de `:174`, o job de fora captura `agora` (AGORA+1d) antes de montar. O de dentro grava em AGORA. A mutação deixaria `pronto_em` em AGORA+1d, e o teste fica vermelho na validade.

Não há cláusula nova sem bloco. O log novo `titular.arquivo_ja_montado` também tem asserção (`:145`). Não há `.skip`, teste comentado nem mock de coisa nossa: o armazém em memória substitui storage externo, e o banco é o Postgres real. Nenhum teste chama IA. O escopo de `doPedido` vem do contexto (`arquivo-do-titular.repository.ts:133`), e o teste de isolamento continua em `:238`.

Rodei `npx vitest run apps/worker/test/montar-arquivo.int.test.ts` uma vez: 14 de 14 verdes.

**Bloqueantes:** nenhum.

**Recomendações**
1. **O teste de `:202` não alcança mais o `on conflict`.** Ele se chama "o arquivo que a eliminação marcou `apagado_em` não é ressuscitado". O pedido dele já está `pronto`, então a guarda nova encerra o job antes de `gravar`. Com isso, a promessa do repository de que "o `apagado_em` não é limpo" (`arquivo-do-titular.repository.ts:94`) fica sem teste no próprio repository. Se alguém puser `apagadoEm: null` no `set`, nenhum teste fica vermelho. Também não achei teste para isso em `apps/api/test/arquivo-do-titular.int.test.ts`. O comportamento continua garantido pela guarda, e hoje só a corrida chega a esse caminho, por isso não bloqueia. Sugestão: no teste intercalado de `:174`, depois de o job de dentro terminar, marcar `apagado_em` e afirmar que ele continua marcado depois que o job de fora grava.
2. **O teste de `:162` não tem bloco de mutação no documento.** Ele protege a regra de produto que a primeira versão desta correção quebrou. Um bloco que troque a guarda por `pedido.estado !== 'em_preparacao'` deixaria registrado que esse teste a pega.
3. **A asserção do teste paralelo ficou fraca (`:123`).** Ela passou a ser `guardadas >= 2`, coerente com o resultado não determinístico. Mas os dois jobs usam o mesmo relógio, então o teste não diz nada sobre a validade. Quem prova a validade é o teste intercalado de `:174`. Um comentário remetendo a ele ajudaria quem ler.
4. **A linha `:186` não tem efeito.** Ela reajusta o relógio para AGORA+1d dentro do hook, mas o job de fora já capturou `agora` antes do laço. Pode sair, ou ganhar um comentário dizendo que não é ela que define o `pronto_em` do perdedor.
5. **Fica um caso sem guarda, que o próprio documento já registra.** É o pedido `concluido` cujo arquivo foi montado e já apagado pela rotina, reentregue depois de 7 dias. Para a retro: dá para fechá-lo com um marcador no pedido (por exemplo `arquivo_montado_em`) gravado na mesma transação.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/worker/src/processadores/montar-arquivo.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/titular/arquivo-do-titular.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/worker/test/montar-arquivo.int.test.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 01:45:07 · `tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md`

VEREDITO: APROVADO

**Rodada 2.** Audito o diff desde a rodada 1 aprovada e confiro as quatro correções da ordem r1. Rodei `npx vitest run apps/worker/test/montar-arquivo.int.test.ts`: 14 de 14 verdes.

Cenários exigidos (os quatro itens da ordem r1, mais as duas mutações novas):
1. O `apagado_em` que o `gravar` promete não limpar tem teste que chega ao `on conflict`.
2. O teste do pedido concluído antes de o job rodar tem bloco de mutação, e o bloco deixa esse teste vermelho.
3. O teste dos dois jobs ao mesmo tempo ganhou força ou um comentário sobre o que prova.
4. A linha sem efeito do teste intercalado saiu ou ganhou comentário.

Cobertos:
1. **Feito.** No teste intercalado (`apps/worker/test/montar-arquivo.int.test.ts:180`), o job de dentro termina e a linha `:193` marca `apagado_em`. Depois o job de fora grava pelo `on conflict`, e a linha `:208` confere que `apagado_em` continua marcado. A mutação `set: { bytes, apagadoEm: null }` limpa o campo nessa segunda gravação. As asserções de `:202-206` continuam passando com ela (o `pronto_em` e a validade não mudam), e o vermelho vem da `:208`. É vermelho pelo motivo certo.
2. **Feito.** O bloco novo do documento troca a guarda por `pedido.estado !== 'em_preparacao'` e cita o teste de `:168`. Nesse teste o pedido já está `concluido` antes de o job rodar. Com a troca, o job sai na guarda, nenhuma linha nasce, e o `toHaveLength(1)` de `:174` falha. É vermelho pelo motivo certo, e o nome citado bate com o do teste.
3. **Feito.** O comentário de `:122-124` diz que o caso prova a unicidade da linha, e não a validade, e remete ao teste intercalado. O laço de `:126-129` prende `pronto_em` e `expira_em` ao relógio comum, nos dois desfechos possíveis da corrida. Ele não falha com nenhuma mutação, porque os dois jobs usam o mesmo relógio, e o comentário já diz isso.
4. **Feito.** A linha `relogio.atual = …` de dentro do hook saiu, e no lugar dela entrou a marcação do `apagado_em`. O relógio do job de fora é definido em `:195`, antes do `rodar`, e reposto no `finally`.

Os nomes citados no primeiro bloco do `on conflict` (`set: { bytes, prontoEm, expiraEm }`) também foram atualizados para o nome novo do teste de `:180`. Esse bloco continua pego pela `:203`.

Não há `.skip`, teste comentado nem provedor de IA. O armazém é o `ArmazemEmMemoria`, e o banco é o Postgres real do compose. O teste com dois jobs em paralelo continua com `Promise.all` de verdade (`:118`).

Bloqueantes: nenhum.

Recomendações:
- `tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md:35`, seção "Teste que reproduz": o texto ainda cita o nome antigo do teste ("deixa o pronto_em e a validade de quem gravou primeiro"). Vale alinhar ao nome novo, que inclui o `apagado_em`. É só texto.

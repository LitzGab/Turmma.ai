# Achados das revisões — `tasks/prd-lgpd-e-titular/14_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-10 03:52:32 · `tasks/prd-lgpd-e-titular/14_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Suspensão:** o token anterior é recusado. A senha certa na matrícula, no e-mail e na conta Google/Microsoft dá `ACESSO_SUSPENSO`, e a renovação também.
- **Não revela:** a senha errada na conta suspensa é igual à matrícula inexistente em status, corpo, hash, contador e trava.
- **Escolhas:** a escola agendada some do login por e-mail e do seletor, e a pessoa continua entrando em B. A mesma matrícula em outra escola continua entrando.
- **Cancelar:** a mesma senha volta a entrar. Depois de `eliminar_em`, com o pedido já enfileirado, em outro tipo de pedido ou no pedido concluído, a resposta é `PEDIDO_EM_ESTADO_INVALIDO`.
- **Auditoria:** registrado, agendado e cancelado, e as sessões encerradas com o motivo.
- **Rotina:** a escolha do lote e a trava de `pessoa_desativada` pulam quem tem pedido agendado.
- **Isolamento:** pela API (HTTP) e no repository.
- **Permissão:** professor e aluno não cancelam.
- **Concorrência:** duas chaves de envio, dois `cancelar`, e cancelar junto com registrar de novo.
- **Borda do domínio:** o aluno transferido (desativado) com pedido de eliminação, que é o caso mais comum de eliminação.

**Cobertos:** todos acima, menos o do aluno transferido. Estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/eliminacao-agendada.int.test.ts`, `sessao-externa.int.test.ts`, `mfa.int.test.ts`, `arquivo-do-titular.int.test.ts`, `pedido-titular.int.test.ts` (checks, único parcial e gatilho de `cancelado_por`), `apps/worker/test/expurgo-da-escola.int.test.ts` (com trava real via `esperarNaTrava`) e `avaliar-sessao.test.ts`. As 40 linhas de Mutações batem com o diff, e não há `.skip`, mock de coisa nossa nem chamada a provedor.

**Bloqueantes:**

1. **`apps/api/src/sessao/renovacao.service.ts:127`: a cláusula `&& achada.desativadoEm === null` não tem teste, e o aluno transferido com eliminação agendada não tem cenário.**
   - O que está errado: a linha da Mutações junta as duas condições, mas o teste citado só derruba a primeira (`eliminacaoAgendadaEm !== null`). Sem a segunda, o cookie antigo de um aluno transferido (desativado) cujo pedido de eliminação foi registrado recebe 403 `ACESSO_SUSPENSO` em vez de 401. Isso revela o pedido a quem já não tem acesso, por exemplo no Chromebook do carrinho. O estado "desativado e agendado" existe: o próprio teste do expurgo o monta.
   - Nenhum teste registra pela API uma eliminação de titular desativado. A de `pedido-titular.int.test.ts:964` usa o tipo `acesso`.
   - Correção exigida: em `eliminacao-agendada.int.test.ts`, um teste em que o aluno entra e guarda o cookie, é desativado pela API de desativação (não por SQL) e depois tem a eliminação registrada. Ele precisa afirmar:
     - 201 `agendado`, com a marca gravada e `sessoesEncerradas: 0` em `pedido.agendado`;
     - `renovar` com o cookie antigo responde exatamente `NAO_AUTENTICADO` (401), não `ACESSO_SUSPENSO`;
     - o login por matrícula responde igual à matrícula inexistente.
   - Acrescentar a linha própria da cláusula na tabela Mutações.

2. **`packages/shared/src/erros/mensagens.ts:162`: o ramo `if (valor === 'acesso_suspenso')` de `mensagemDaFalhaExterna` não tem teste.**
   - O que está errado: `mensagens.test.ts` não mudou. Sem o ramo, a professora suspensa no login Google/Microsoft lê "a escola ainda não liberou o aplicativo, entre com a matrícula". A divergência da própria tarefa diz que esse texto é o contrato que a tela consome.
   - Correção exigida: em `packages/shared/src/erros/mensagens.test.ts`, afirmar que `mensagemDaFalhaExterna('acesso_suspenso')` devolve `MENSAGENS_DE_ERRO.ACESSO_SUSPENSO` e que é diferente de `MENSAGENS_DA_FALHA_EXTERNA.provedor`. Acrescentar a linha na tabela Mutações.

**Recomendações:**
- **`login.service.ts:143`:** o `contador.zerar(chave)` no ramo suspenso do e-mail não tem teste. Sugiro repetir a senha certa na conta só com A agendada mais vezes que o limite e afirmar que ela nunca vira `CONTA_SEGURADA`.
- **`matricula.service.ts:117`:** o `gravarFalha` no ramo suspenso não é afirmado. Sugiro checar `falhasDeLogin` +1 no teste "login por matrícula: a senha certa dá ACESSO_SUSPENSO".
- **`resolucao-de-tenant.repository.ts:158`:** os filtros `isNull(desativadoEm)` e `ne(papel, 'aluno')` de `temAcessoSuspenso` não têm teste que os derrube. Hoje são quase inalcançáveis, mas vale uma linha no teste de repository.
- **Troca e escolha pelo id:** `POST` de troca de escola (e o `escolher` com desafio emitido antes do agendamento) com o `usuarioId` da escola agendada deveria dar 404. A proteção vem de `usuariosAtivosDaConta`, que o teste do e-mail já prova. Falta o teste de trocar o id na URL (regra 10, item 4).
- **[P] em `eliminacao-agendada.int.test.ts` (dois cancelar, duas chaves, cancelar e registrar):** usam `Promise.all` sem forçar o entrelaçamento. O "Como testar" pedia `GatilhoDeParada` e `esperarNaTrava`. A regra já é provada pela cláusula do `where` e pelo único parcial, então não bloqueia, mas segurar a primeira transação na trava provaria a corrida de verdade.
- **Controller:** `Cache-Control: no-store` e o corpo vazio (`esquemaPedidoSemCorpo`) do `cancelar` não são afirmados.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-10 03:54:19 · `tasks/prd-lgpd-e-titular/14_task.md`

```
VEREDITO: APROVADO
Tabelas verificadas: usuario.eliminacao_agendada_em (a tabela já tinha escola_id; a coluna é só uma data);
  pedido_titular: pedido_titular_agendado_unico (escola_id, titular_id) WHERE estado='agendado',
  check pedido_titular_agendado_com_prazo e gatilho pedido_titular_cancelado_por_da_escola
  (exigir_usuario_da_escola); sessao_motivo_valido com eliminacao_agendada.
  Migration 0035 só expande. Os ids continuam UUID.
Queries verificadas:
  PedidosRepository.cancelar (escola do contexto, estado, eliminar_em > now(), não enfileirado);
  PedidosRepository.registrar (escola do contexto, eliminar_em pelo relógio do banco);
  CicloDeVidaRepository.suspender e devolverAcesso (exigirEscolaDoContexto);
  CicloDeVidaService.agendarEliminacao e cancelarEliminacao (travarUsuario com escopo, recusa a própria sessão);
  PrivacidadeService.cancelarPedido (passa por #pedidoAlvo, com escopo e excluindo a própria conta);
  CredencialMatriculaRepository.doAlunoAtivo e ContaExternaRepository.ligacao/professorPeloEmail (escola do contexto);
  ResolucaoDeTenantRepository.usuariosAtivosDaConta, acessos, temAcessoSuspenso e sessaoParaRenovar
  (@SemEscopo com justificativa escrita, todos pela conta ou pelo cookie já verificados, nunca por parâmetro do cliente);
  SessaoRepository (linha da guarda); ExpurgoDaEscolaRepository (PESSOAS_DESATIVADAS e a trava; o subselect
  de pedido_titular amarra p.escola_id = usuario.escola_id e desce pelo único parcial);
  ArquivoDoTitularRepository.contaAtiva.
  Nenhum endpoint novo aceita escolaId: POST /v1/privacidade/pedidos/:id/cancelar recebe só o id e o corpo vazio.
Teste de isolamento: presente e efetivo
  apps/api/test/eliminacao-agendada.int.test.ts
  › "isolamento no repository … com o contexto de A e o id de B, não encontram a linha nem mudam nada".
  Sem o eq(escolaId) de cancelar, suspender ou devolverAcesso, o teste fica vermelho; a tabela de Mutações registra isso.
  › "isolamento: o pedido de B, visto pela coordenação de A, responde como o id de ninguém": pelo HTTP, a resposta
  é igual à de um id aleatório (NAO_ENCONTRADO).
Bloqueantes: nenhum
Recomendações:
  1. /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/renovacao.service.ts:127
     A decisão de responder `suspenso` vem antes de sessaoAindaVale. Por isso, um cookie de sessão já vencida (12 h ou
     inatividade) ou encerrada por `saida` também responde ACESSO_SUSPENSO. Num Chromebook compartilhado, quem usa a
     máquina depois fica sabendo da suspensão de quem usou antes. O vazamento fica dentro da mesma escola, então não é
     tenancy; fica para o privacy-guardian. Sugestão: só dar ACESSO_SUSPENSO quando a sessão não venceu e está aberta
     ou foi encerrada com motivo `eliminacao_agendada`. Isso também alinha o código ao que a divergência declara
     ("cookie de renovação válido").
  2. /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/resolucao-de-tenant.repository.ts:153
     Com este, o arquivo passa a ter mais um @SemEscopo; já são 26. O módulo resolve a escola antes de ela existir no
     contexto, e cada um tem justificativa, mas o número já passa bem do limite da regra 10, item 9. Vale registrar no
     /retro se ele deve virar exceção declarada da regra ou se precisa ser quebrado em mais de um módulo.
  3. Falta o teste de trocar o id: o POST de troca de escola, e o `escolher` com desafio emitido antes do agendamento,
     usando o usuarioId da escola agendada, deveriam responder como id inexistente. Hoje a proteção vem de
     usuariosAtivosDaConta, que o teste do e-mail já cobre (regra 10, item 4).
```

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-10 03:54:26 · `tasks/prd-lgpd-e-titular/14_task.md`

**VEREDITO: REPROVADO**

Há um bloqueante, na renovação de sessão. O resto da tarefa 14.0 está em ordem na regra 20.

**Campos pessoais tocados:** só um campo novo, `usuario.eliminacao_agendada_em`, que guarda uma data e nenhum conteúdo sobre a pessoa. O motivo de sessão `eliminacao_agendada` e o estado `agendado` do pedido não são dado pessoal novo.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. A marca entrou na tabela com finalidade, base legal e retenção: some no cancelamento ou com a pessoa eliminada. No arquivo do titular ela fica fora, com justificativa (`leitura-do-titular.ts`): é espelho do `pedido_titular`, que entra no arquivo.

**Autorização por objeto:** ok.
- `POST /pedidos/:id/cancelar` busca o pedido pela escola do contexto.
- O pedido de B visto pela coordenação de A e o pedido sobre a própria pessoa respondem `NAO_ENCONTRADO`.
- O gatilho `exigir_usuario_da_escola` agora vale também para `cancelado_por`.
- Na matriz de permissões, só a coordenação cancela.

**Logs:** limpos. O diff não acrescenta nenhum log, e a métrica do login externo só leva `resultado`.

**Auditoria:** presente.
- `pedido.agendado` guarda `eliminarEm` e `sessoesEncerradas`.
- `pedido.cancelado` guarda `acessoDevolvido`.
- As sessões são encerradas com o motivo `eliminacao_agendada`.
- Nas três, só ids, estados e datas, e o clique duplo não audita de novo.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os testes usam `escola.invalid`, `HASH_SINTETICO` e "Pessoa sintética".

**Bloqueantes:**

1. **`apps/api/src/sessao/renovacao.service.ts:127`: um cookie que já não vale recebe `ACESSO_SUSPENSO` e revela a suspensão a quem não tem credencial válida.**
   - **O que está errado:** a verificação de suspensão vem antes de `sessaoAindaVale` e só exclui o usuário desativado. Por isso o cookie de sessão expirada (12 h), vencida por inatividade ou encerrada por saída responde 403 "Seu acesso está suspenso a pedido".
   - **Por que vaza:** o cookie de sessão não tem `Max-Age` e fica no navegador. No Chromebook do carrinho, o próximo aluno que abre o Turmma recebe na tela a suspensão de quem usou a máquina antes. Ela indica que há um pedido de eliminação sobre um menor.
   - **Por que viola a regra:** a spec diz "só depois de a credencial ser conferida", e a techspec fala em "token válido" (§4, "Login suspenso"). A guarda e a renovação têm a regra explícita de que um cookie vencido não entrega a conta anterior. Isso fere a regra 20, item 6, e a regra 10, item 6. Inclui o caso do aluno desativado que o `test-engineer` já apontou.
   - **Correção exigida:**
     - Responder `ACESSO_SUSPENSO` só quando a sessão valeria se não fosse a suspensão: usuário não desativado, `expiraEm` ainda no futuro, inatividade dentro do limite do papel com a tolerância, e `encerradaEm` nulo ou encerrada com o motivo `eliminacao_agendada`. Para isso, `sessaoParaRenovar` precisa ler `sessao.motivo`. Em todo o resto, a resposta é a 401 `NAO_AUTENTICADO` de sempre.
     - Em `apps/api/test/eliminacao-agendada.int.test.ts`, um teste em que o cookie de quem tem a eliminação agendada, com a sessão vencida por inatividade (relógio ou `ultimo_uso_em` recuado) e expirada, responde exatamente como o cookie desconhecido: status, corpo e o `Set-Cookie` que apaga o cookie.
     - O mesmo teste para o titular desativado, que é o bloqueante 1 do `test-engineer`.
     - Uma linha própria de cada cláusula nova na tabela de Mutações.

**Recomendações:**
- **Cookie anterior:** o `refreshHashAnterior` também chega ao ramo do suspenso. Vale aplicar a mesma janela dos 30 s de `JA_RENOVADO`, para o cookie antigo depois da rotação não responder `ACESSO_SUSPENSO`.
- **`matricula.service.ts:117`:** a falha gravada no registro de acesso com a senha certa na conta suspensa merece uma afirmação em teste, para provar que o ramo suspenso deixa o mesmo rastro de IP da tentativa recusada.
- **Arquivo do titular:** `arquivo-do-titular.repository.ts:87` passa a dar a versão da escola à coordenação durante a suspensão. Está coerente com o desenho, mas vale uma linha em `docs/lgpd.md`, no parágrafo do arquivo do titular, dizendo que o titular suspenso conta como "sem conta ativa".
- **Teste do `mensagemDaFalhaExterna('acesso_suspenso')`:** fica com o `test-engineer` (bloqueante 2 dele). Do lado da privacidade, o texto do catálogo é fixo e não leva nome, data nem prazo.

**Pergunta de fechamento:** responde. O agendamento, as sessões encerradas e o cancelamento ficam na auditoria com ids e datas. O pedido continua no arquivo do titular, e nada sai para terceiro.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-10 03:56:08 · `tasks/prd-lgpd-e-titular/14_task.md`

```
VEREDITO: APROVADO
Caminho quente tocado: login | migration
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0035_eliminacao_agendada.sql:22
  O `sessao_motivo_valido` é recriado sem `NOT VALID`. Com isso a migration percorre a tabela `sessao` inteira sob ACCESS
  EXCLUSIVE, e é essa a tabela que a guarda lê em toda requisição. O `CREATE UNIQUE INDEX` da linha 20 também roda sem
  `concurrently`. A Tech Spec (§7c) aceita isso enquanto não existir staging, mas a 0035 não entrou na lista do `TODO.md`
  ("Migrations 0025, 0026 e 0027 … antes do staging"). Acrescentar a 0035 a essa lista, com o check em `sessao` em
  arquivo próprio (`NOT VALID` e depois `VALIDATE`) e o `lock_timeout`.
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/login.service.ts:142
  O `temAcessoSuspenso` roda depois da senha certa e fora do `.catch` que chama `contador.desfazer(chave, reserva)`. Se o
  banco falhar nesse ponto, a reserva fica contada como senha errada, ao contrário do que diz o comentário das linhas
  logo acima. Pôr a consulta dentro do mesmo tratamento de erro.
- Mesmo arquivo, ramo suspenso do login por e-mail: não grava `gravarFalha` no registro de acesso, e o da matrícula
  (`matricula.service.ts`, no ramo `credencial.suspenso`) grava. Alinhar os dois.
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/eliminacao-agendada.int.test.ts
  Falta o [P] da eliminação com a mesma chave de envio, nas duas chamadas ao mesmo tempo. O teste da linha 996 de
  `pedido-titular.int.test.ts` cobre só o tipo `acesso`. Na eliminação existe um segundo índice único que não é o árbitro
  do `ON CONFLICT` (`pedido_titular_agendado_unico`), e numa janela curta o reenvio pode receber
  `PEDIDO_EM_ESTADO_INVALIDO` em vez do mesmo pedido.
- Os três [P] da mesma suíte (linhas 254, 658 e 673) usam `Promise.all` sem forçar o entrelaçamento. Segurar a primeira
  transação com `GatilhoDeParada`/`esperarNaTrava` provaria a corrida de verdade (o mesmo ponto do test-engineer).
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/renovacao.service.ts:104
  A renovação recusada por eliminação agendada entra na métrica como `recusada`, sem rótulo próprio. Separar
  (`suspensa`) deixa ver a suspensão sem misturar com o cookie inválido.
```

Rodei os dois arquivos de teste citados na tarefa: `eliminacao-agendada.int.test.ts` (32 de 32) e `expurgo-da-escola.int.test.ts` (119 de 119). O segundo inclui o teste de plano "o lote de cada alvo desce pelo índice dele", que a armadilha do `estado.md` pede quando se mexe no lote de `pessoa_desativada`.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-10 03:56:54 · `tasks/prd-lgpd-e-titular/14_task.md`

**VEREDITO: REPROVADO**

**Escopo:** respeitado. Nada do job da 15.0 entrou, e as subtarefas 14.1 a 14.6 estão no diff.

**Aderência à Tech Spec:** há divergências em `techspec.md` §3 e §4 que estão registradas só no `14_task.md`. A `techspec.md` e o `cenarios.md` não mudaram neste diff.

**Portão local:** carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

**Bloqueantes:**

1. **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/renovacao.service.ts:127`**: a renovação responde `ACESSO_SUSPENSO` antes de conferir se a sessão ainda vale.
   - **O erro:** o `if (achada.eliminacaoAgendadaEm !== null && achada.desativadoEm === null)` vem antes de `sessaoAindaVale` e de `resultadoPeloCookie`. Por isso qualquer cookie que o banco ache recebe 403 `ACESSO_SUSPENSO`, mesmo que já não valesse antes do agendamento:
     - o cookie de uma sessão vencida por inatividade ou pelas 12 h;
     - o de uma sessão encerrada por saída ou troca de escola;
     - o hash anterior já rotacionado, que hoje pularia a detecção de reuso.
   - **Por que importa:** é exatamente o caso do Chromebook do carrinho, que a própria função cita ("o Chromebook do carrinho não entrega a conta anterior"). O próximo aluno abre o navegador e a API diz que o acesso do colega está suspenso a pedido. Isso contraria a §4 da Tech Spec ("token válido") e a divergência que a própria tarefa declara (`14_task.md:87`, "cookie de renovação válido"). Nenhum teste cobre cookie vencido: o caso "cookie qualquer" usa bytes aleatórios.
   - **Correção exigida:**
     - responder `ACESSO_SUSPENSO` só quando a sessão valeria se não fosse a suspensão. Ou seja: encerrada só com o motivo `eliminacao_agendada` (ou aberta), dentro de `expira_em` e da inatividade, e achada pelo hash atual. Em todo outro caso, 401 `NAO_AUTENTICADO`;
     - escrever o teste: uma sessão vencida por inatividade antes do registro dá exatamente 401, com o mesmo corpo do cookie desconhecido;
     - acrescentar a linha correspondente na tabela Mutações.

2. **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/14_task.md:84, 86 e 88`**: três divergências citam a `techspec.md` como lugar onde já estão, e não estão lá.
   - **O erro:**
     - (a) o gatilho `pedido_titular_cancelado_por_da_escola`, e o motivo de o `concluido_por` ficar sem gatilho. A nota da 11.0 na §4 só cita os gatilhos de `titular_id` e `registrado_por`;
     - (b) a regra do login por e-mail: `ACESSO_SUSPENSO` só sai quando a conta não tem nenhuma escola utilizável; com outra escola ativa, a pessoa entra nela calada. A §4 e o `cenarios.md` (RF14) não trazem o caso "conta só com a escola agendada";
     - (c) a redefinição de MFA com `comSuspensos: true`.
   - **Correção exigida:** registrar um bloco "Tarefa 14.0, como ficou no código" na `techspec.md` (§3 para o gatilho; §4 para o e-mail e para a redefinição de MFA) e a linha do cenário no `cenarios.md`, RF14. Isso vai pela `DIVERGÊNCIA` ao Arquiteto, antes da próxima rodada.

3. **Os bloqueantes do `test-engineer` (1ª rodada, REPROVADO) continuam abertos**: o prompt diz que ele já aprovou, mas a tabela de Revisões e os achados mostram só a reprovação. Nada do que ele exigiu entrou:
   - `apps/api/test/eliminacao-agendada.int.test.ts` não tem o caso do aluno transferido (desativado) com eliminação agendada. É caso de borda da regra 40 e protege o ramo `desativadoEm === null` da linha 127;
   - `packages/shared/src/erros/mensagens.test.ts` não mudou: o ramo `acesso_suspenso` de `mensagemDaFalhaExterna` (`mensagens.ts:162`) não tem teste.
   - **Correção exigida:** a do bloco em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/achados/14_task.md`. O `test-engineer` precisa aprovar antes da rodada seguinte.

**Recomendações:**
- **`docs/lgpd.md:102`:** a linha da marca lista "coordenador" entre os titulares, mas `papel_titular` só aceita `aluno` e `professor`.
- **`packages/shared/src/sessao/externa.ts` (comentário de `acesso_suspenso`):** o comentário diz que "a conta que não está ligada nunca a recebe". Só que `externa.service.ts`, no `#decidir`, devolve `SUSPENSO` ao professor sem ligação achado pelo e-mail verificado. Corrija o texto do contrato.
- **`login.service.ts:142`:** no login por e-mail, o ramo suspenso não grava a falha no registro de acesso, e os ramos da matrícula e da conta externa gravam (`gravarFalha`). Deixe os três iguais.
- **`apps/web/src/api/sessao.ts:439`:** ao reabrir a página, o 403 `ACESSO_SUSPENSO` da renovação cai em `indisponivel`, e a pessoa suspensa nunca vê o texto "Login suspenso" da §9. A tarefa declara a tela fora, mas nenhuma das tarefas 15 a 19 a pega. Registre isso como pendência na spec.
- **`[P]` de `eliminacao-agendada.int.test.ts`:** os testes de concorrência usam `Promise.all` sem forçar o entrelaçamento. O "Como testar" pedia `GatilhoDeParada` e `esperarNaTrava`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-10 04:12:15 · `tasks/prd-lgpd-e-titular/14_task.md`

VEREDITO: APROVADO

**Cenários exigidos (2ª rodada):** as duas correções da 1ª rodada, mais o que o diff afeta: a decisão da renovação, que deixou de ter uma cláusula e passou a ter quatro, e o `motivo` lido por `sessaoParaRenovar`.

**Cobertos:**

- **Correção 1, aluno transferido com eliminação agendada: feita.** O teste está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/eliminacao-agendada.int.test.ts`, no caso "o aluno transferido (desativado) com a eliminação registrada…".
  - O aluno entra e guarda o cookie.
  - A desativação passa por `CicloDeVidaService.desativar` no contexto da coordenação, não por SQL. Para aluno não existe rota HTTP de desativação; a única está em `ops/`. O caminho usado é o de produção: grava `desativadoEm`, encerra as sessões com o motivo `desativacao` e apaga o hash da senha.
  - O teste afirma o 201 de `agendar`, o estado `agendado` no banco, a marca gravada e `sessoesEncerradas: 0` em `pedido.agendado`.
  - Afirma que a renovação dá 401 e é igual, sem o `requisicaoId`, à do cookie desconhecido, que é `NAO_AUTENTICADO`.
  - Afirma que a senha certa recebe `NAO_AUTENTICADO`, a mesma resposta da matrícula inexistente.
  - A cláusula `desativadoEm === null` saiu do código, então a linha dela na tabela saiu também. O cenário segue protegido por duas regras que já têm mutação vermelha: o motivo `desativacao` não passa no teste `motivo === 'eliminacao_agendada'`, e `sessaoAindaVale` checa `desativadoEm`.
- **Correção 2, `mensagemDaFalhaExterna('acesso_suspenso')`: feita.** Os dois `expect` exigidos estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/erros/mensagens.test.ts:145-148`, e a linha está na tabela Mutações. Rodei o arquivo: 18 de 18 verdes.
- **As cláusulas novas da renovação, em `renovacao.service.ts` no `#decidir`.** Conferi cada linha da tabela contra o código. Cada teste citado falharia sem a cláusula correspondente:
  - `pelo === 'atual'`: o cookie anterior, depois da rotação, viraria `ACESSO_SUSPENSO`, e o caso "já rotacionado" pega.
  - `encerradaEm === null`: a sessão aberta com a marca posta por SQL tem `motivo` nulo e cairia em 401, e o teste "a guarda e a renovação recusam pela marca…" espera 403.
  - `motivo === 'eliminacao_agendada'`: a sessão encerrada pelo próprio registro cairia em 401, e o teste principal da renovação espera 403.
  - `sessaoAindaVale` sem a suspensão: os casos de inatividade e das 12 h pegam. O caso de saída pega se o parêntese inteiro for trocado por `true`.
  - `motivo: sessao.motivo` em `sessaoParaRenovar`: sem ele o motivo some, e o teste principal da renovação quebra. A lista de chaves em `resolucao-de-tenant.repository.int.test.ts` foi atualizada.
- **O que entrou além do exigido:**
  - Falha registrada no login por matrícula da conta suspensa, com linha na tabela.
  - Seis tentativas por e-mail com a senha certa sem chegar a `CONTA_SEGURADA`, que prova o `contador.zerar`, com linha na tabela.
  - Troca de id no seletor: a escola agendada responde igual ao id de ninguém (regra 10, item 4).
- Nenhum `.skip`, `.only` ou `todo` nos dois arquivos. Nenhum mock esconde regra: o `spyOn` do hash só conta as chamadas.

**Bloqueantes:** nenhum.

**Recomendações:**

- No teste do aluno transferido, comparar também o `setCookie` da renovação com o do desconhecido, como o teste dos cookies vencidos já faz. Hoje só o status e o corpo estão afirmados.
- O teste do transferido passa por duas defesas ao mesmo tempo: o motivo `desativacao` e `desativadoEm` em `sessaoAindaVale`. Vale uma linha de comentário dizendo que é cenário de comportamento, e não a prova de uma cláusula, para ninguém procurar a mutação dele na tabela.
- O teste de integração `eliminacao-agendada.int.test.ts` eu não rodei: o portão da tarefa estava em execução, com a trava do banco de teste ativa desde 07:08 UTC. Confira o resultado dele no carimbo do portão antes do commit.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-10 04:13:29 · `tasks/prd-lgpd-e-titular/14_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta rodada. `sessao.motivo` já existia e passou a ser só lido em `sessaoParaRenovar`. A migration `0035_eliminacao_agendada` não mudou desde a 1ª rodada.

Queries verificadas:
- `apps/api/src/sessao/resolucao-de-tenant.repository.ts:103-134`, `sessaoParaRenovar`. Ganhou só `motivo` no select. O `@SemEscopo` continua com a justificativa escrita (o cookie não diz a escola). O join `usuario` ↔ `sessao` continua por `escolaId` e `id`, e a escola da sessão travada continua sendo o contexto antes de qualquer escrita (`renovacao.service.ts:137`).
- `apps/api/src/sessao/renovacao.service.ts:125-135`, `#decidir`. O 403 `ACESSO_SUSPENSO` só sai para o cookie atual de uma sessão que valeria sem a suspensão. Todo outro cookie do suspenso recebe o mesmo 401 do cookie desconhecido. `desativadoEm` continua no spread passado a `sessaoAindaVale` (`packages/nucleo/src/identidade/avaliar-sessao.ts:31`), então o aluno transferido não ouve a suspensão. Quem recebe o 403 é sempre o dono da credencial: nada de outra escola nem de outra pessoa fica exposto.
- `POST /v1/sessao/escola` com o `usuarioId` da escola agendada: responde igual ao id de ninguém.

Teste de isolamento: presente e efetivo.
- `apps/api/test/eliminacao-agendada.int.test.ts:402-427`: sem a condição `valeriaSemASuspensao`, o cookie vencido por inatividade, pelas 12 h, encerrado por saída ou já rotacionado receberia `ACESSO_SUSPENSO`, e o teste quebra.
- `:429-448`: sem `desativadoEm` no spread, o aluno transferido ouviria a suspensão, e o teste quebra.
- `:543-547`: compara a resposta para o `usuarioId` da escola agendada com a resposta para um id aleatório, e quebra se a troca de escola revelar a escola agendada.
- `resolucao-de-tenant.repository.int.test.ts:63`: a lista de chaves de `sessaoParaRenovar` foi atualizada com `motivo`.

Bloqueantes: nenhum.

Recomendações:
- `renovacao.service.ts:131`: uma sessão encerrada com `motivo = 'eliminacao_agendada'` num agendamento anterior, já cancelado, volta a receber 403 se a pessoa for agendada de novo, e não o 401. O cookie é da própria pessoa e da mesma escola, então não é vazamento entre escolas. Vale um teste que cubra cancelar, agendar de novo e usar o cookie antigo, ou restringir o 403 à sessão que este agendamento encerrou. Fica para o `privacy-guardian` ou o `/retro`.
- A recomendação dos 26 `@SemEscopo` continua no `/retro`, sem mudança nesta rodada.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-10 04:13:44 · `tasks/prd-lgpd-e-titular/14_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum

As três correções da 1ª rodada foram feitas:

1. **Renovação** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/renovacao.service.ts:129-135`)
   - `ACESSO_SUSPENSO` só sai quando três condições valem juntas: o cookie é o atual; a sessão está aberta ou foi encerrada com o motivo `eliminacao_agendada`; e `sessaoAindaVale` passa com `encerradaEm` e `eliminacaoAgendadaEm` zerados.
   - `desativadoEm` continua na conferência, então o aluno transferido recebe 401.
   - O teste novo cobre inatividade, as 12 h, a saída e o cookie anterior, e compara o corpo e o `Set-Cookie` com os do cookie desconhecido.
   - O caso do transferido afirma o status 401.
   - As linhas estão na tabela Mutações.
2. **Divergências na spec**: o bloco "Tarefa 14.0, como ficou no código" está na `techspec.md`, nas linhas 492-509. As quatro linhas novas estão no `cenarios.md`, RF14. O cenário do gatilho já existia: `cenarios.md:361`, onde o pedido conclui com `rotina` sem erro do gatilho.
3. **Bloqueantes do test-engineer**: o teste do transferido está em `eliminacao-agendada.int.test.ts` e o do ramo `acesso_suspenso` em `mensagens.test.ts`.

Recomendações:
- **Onde está o bloco.** A ordem pedia o bloco na §3, para o gatilho, e na §4, para o e-mail e o MFA. Ele ficou na §5. O conteúdo está na spec e não contradiz a §4.
- **Coluna "Onde está na spec" errada.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/14_task.md`, a linha da renovação aponta para a §4, "Login suspenso" (`techspec.md:185-187`), que não fala da renovação. O texto está na §5, nas linhas 500 e 507. Corrigir o ponteiro.
- **Tabela de módulos.** Em `techspec.md:34`, a linha diz que a "guarda, logins e renovação recusam `eliminacao_agendada_em` com `ACESSO_SUSPENSO`". A guarda responde 401. Ajustar o texto ao que foi implementado.
- **Caso marginal sem cobertura.** A sessão encerrada com `eliminacao_agendada` por um agendamento já cancelado, seguida de um novo agendamento dentro da inatividade, voltaria a dizer `ACESSO_SUSPENSO` a esse cookie. A janela é curta e só o dono do cookie ouve a resposta. Vale uma linha no `TODO.md`, nas "Ressalvas da 14.0".

## infra-guardian · 2ª rodada · APROVADO · 2026-10-10 04:13:59 · `tasks/prd-lgpd-e-titular/14_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/renovacao.service.ts:131`: o cookie que a eliminação encerrou (motivo `eliminacao_agendada`) passa no teste `valeriaSemASuspensao`. Isso vale também quando a eliminação foi cancelada e outra foi agendada logo depois, ainda dentro das 12 h e da inatividade. Nesse caso o cookie velho recebe `ACESSO_SUSPENSO`, e não o 401, embora a sessão dele já tenha sido encerrada por um ciclo anterior. A janela é de dezenas de minutos e só mostra a resposta a quem tem o cookie. Para fechar o caso, comparar `encerradaEm` com `eliminacaoAgendadaEm` (o encerramento tem de ser o do agendamento atual) e registrar a decisão nas "Ressalvas da 14.0" de `TODO.md`. É questão de privacidade e não de carga, então fica a critério do `privacy-guardian`.

Notas da rodada:
- A decisão nova continua dentro da transação que já trava a sessão (`FOR UPDATE OF sessao`), é uma conta sem consulta nova e não grava nada no caminho da recusa.
- O `select` ganhou só a coluna `motivo`, da mesma linha já travada. Não há join nem query nova, e o índice da busca pelo hash não muda.
- A 7h30 a renovação custa o mesmo de antes.
- Não há migration nova nesta rodada.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-10 04:14:08 · `tasks/prd-lgpd-e-titular/14_task.md`

VEREDITO: APROVADO

A correção exigida na 1ª rodada foi feita e há teste que a prova. As três recomendações que a Mesa mandou aplicar também foram feitas. Não rodei a suíte: o veredito sai da leitura do código e dos testes.

**A correção exigida (renovação).** Em `apps/api/src/sessao/renovacao.service.ts:129-135`, quem tem a eliminação agendada só recebe `ACESSO_SUSPENSO` quando o cookie valeria sem a suspensão. Isso exige as quatro condições:
- o cookie é o atual (`pelo === 'atual'`);
- a sessão está aberta, ou foi encerrada com o motivo `eliminacao_agendada`;
- `sessaoAindaVale` passa com a suspensão tirada da conta, o que ainda confere o usuário desativado, as 12 h e a inatividade;
- `sessaoParaRenovar` agora lê `motivo` (`resolucao-de-tenant.repository.ts:17,115`).

Qualquer outro cookie dessa pessoa recebe o 401 de sempre.

Os testes novos que provam isso estão em `apps/api/test/eliminacao-agendada.int.test.ts`:
- **Linhas 402-427:** os cookies vencido por inatividade, vencido pelas 12 h, encerrado por saída e o anterior já rotacionado respondem como o cookie desconhecido, com status, corpo e `Set-Cookie` iguais.
- **Linhas 429-448:** com o titular desativado, a renovação e a senha certa respondem como a matrícula inexistente, e a auditoria registra `sessoesEncerradas: 0`.
- **Linha 450:** se alguém tira a cláusula `encerradaEm === null`, este teste fica vermelho.

A tabela Mutações de `14_task.md` tem uma linha para cada cláusula nova.

**As recomendações aplicadas:**
- `falhasDeLogin` +1 é conferido na matrícula suspensa (linha 312).
- O cookie anterior recebe 401.
- `docs/lgpd.md` diz que a pessoa suspensa conta como "sem conta ativa" para a versão do arquivo da coordenação.
- A tabela de dados tirou "coordenador" dos titulares da marca, o que bate com `papelTitular: 'aluno' | 'professor'` em `pedidos.repository.ts:9`.

Campos pessoais tocados: nenhum novo nesta rodada. A renovação passa a ler `sessao.motivo`, que é um estado de lista fechada e não é dado da pessoa.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: ok. O seletor de escola foi testado com o id da escola agendada, e a resposta é igual à de um uuid qualquer (teste, linhas 173-177 do diff).
Logs: limpos. O diff não acrescenta nenhum log.
Auditoria: presente. Esta rodada não muda nada nela.
Envio externo: nenhum.
Seed/fixture: sintético (matrículas `RA` aleatórias, uuids).
Bloqueantes: nenhum.
Recomendações:
1. **Sessão de um agendamento anterior.** Pense numa sessão que um primeiro agendamento encerrou com `motivo = 'eliminacao_agendada'`, depois cancelado e registrado de novo. O cancelamento não reabre a sessão, mas o cookie dela (o atual, dentro das 12 h e da inatividade) recebe `ACESSO_SUSPENSO` no novo agendamento, embora já não fosse válido. O risco é pequeno: o cookie era da própria pessoa e a janela é de no máximo 12 h, e isso está dentro do critério exigido. Ainda assim, vale comparar o `encerradaEm` da sessão com o `eliminacaoAgendadaEm` atual do usuário (encerrada no mesmo instante ou depois dele) e cobrir o caso com um teste. Fica para o `TODO.md`.
2. **Teste da inatividade na fronteira.** O caso de inatividade usa `now() - 1 day`, bem longe do limite. Um caso logo depois de "inatividade do papel + tolerância" provaria que a recusa usa a mesma conta da guarda.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/renovacao.service.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/resolucao-de-tenant.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/identidade/avaliar-sessao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/eliminacao-agendada.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/lgpd.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/.processo/ordens/diff-14-r2.txt

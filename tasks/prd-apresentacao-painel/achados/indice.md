# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-09-24 12:34:48 | `infra-guardian` | 1ª | APROVADO | `revisao-spec` | Seção 7c, linha "Convite em aberto": a promessa do teste de mutação ("o mesmo cenário sem a trava continua com um só") não se cumpre em todos os casos. O… |
| 2026-09-24 12:35:02 | `tenancy-guardian` | 1ª | REPROVADO | `revisao-spec` | Refazer e revogar por `conviteId` não se limitam ao convite de coordenação (seção 5, "Convite da coordenação"; seção 6, linha `escolaDoConviteParaOperador`;… |
| 2026-09-24 12:35:21 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `revisao-spec` | Seção 9 (Uso) e seção 10 (E2E): o Uso não tem desenho para 360 px e a prova do RF5 não está no teste. |
| 2026-09-24 12:35:25 | `privacy-guardian` | 1ª | APROVADO | `revisao-spec` | §5, "refazer": escrever que o servidor recusa o refazer com CONFLITO quando o estado é `ativa`, e que só vale convite `tipo = 'coordenador'`. Hoje só a tela… |
| 2026-09-24 12:35:28 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | §5 "Convite da coordenação" e §9 "Escolas": o estado pode ficar sem ação possível, e isso não tem teste. |
| 2026-09-24 12:39:21 | `frontend-reviewer` | 2ª | APROVADO | `revisao-spec` | Seção 9 promete mais texto do que o grupo W tem. A seção diz que "o texto exato de cada estado e de cada mensagem" está no grupo W, mas lá só há o 503 ("Tentar… |
| 2026-09-24 12:39:34 | `tenancy-guardian` | 2ª | APROVADO | `revisao-spec` | I7: acrescentar um teste de alarme. Inserir um convite com `tipo = 'professor'` deve falhar com 23514. Quando a A1 afrouxar o check, esse teste quebra e obriga… |
| 2026-09-24 12:39:59 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | O aceite anterior não tem mecanismo definido nem teste de concorrência (Tech Spec seção 5, linha `aceito` da matriz; seção 7c, tabela de travas; cenário E6). |
| 2026-09-24 12:43:22 | `test-engineer` | 3ª | REPROVADO | `revisao-spec` | A E15 passa mesmo sem a trava na ativação (`tasks/prd-apresentacao-painel/cenarios.md:61-64`). |
| 2026-09-24 12:43:38 | `infra-guardian` | 2ª | APROVADO | `revisao-spec` | Seção 5 e 7c: dizer que a trava é a primeira instrução da transação de ativação. No aceite, ela precisa vir antes de `usarConvitePorHash`, não só antes de… |
| 2026-09-24 12:45:48 | `test-engineer` | 4ª | REPROVADO | `revisao-spec` | O código de erro da E15(e) não é o que o sistema devolve (`cenarios.md` E15(e); seção 5, fim do parágrafo antes de "Leitura"). |
| 2026-09-24 12:47:49 | `infra-guardian` | 3ª | APROVADO | `revisao-spec` | Seção 5: dizer se a ativação perdida chama `contador.zerar(chave)`, como faz o caminho de sucesso, ou só libera a reserva. "Sem somar" é ambíguo, porque a… |
| 2026-09-24 12:48:11 | `privacy-guardian` | 2ª | REPROVADO | `revisao-spec` | `tasks/prd-apresentacao-painel/techspec.md:81-82` (seção 5) e `:132` (seção 7, linha Auditoria). |
| 2026-09-24 12:48:21 | `test-engineer` | 5ª | REPROVADO | `revisao-spec` | Seção 5, na "Decisão" sobre quem perde, e `cenarios.md` E6 (linhas 42-44) e E15(b). A regra "senha certa não conta como falha" foi escrita só para quem perde a… |
| 2026-09-24 12:49:43 | `privacy-guardian` | 3ª | APROVADO | `revisao-spec` | Revogar convite já usado. Em `sem_coordenacao`, o último convite já foi usado. A spec agora grava `revogado_em` nele, mas não diz se é isso mesmo que se quer.… |
| 2026-09-24 12:49:50 | `test-engineer` | 6ª | APROVADO | `revisao-spec` | E16, com MFA. Dizer qual contador é conferido: o da senha, o do código ou os dois. `apps/api/src/sessao/mfa.service.ts:101` faz uma reserva própria na etapa do… |
| 2026-09-24 12:57:42 | `test-engineer` | 7ª | REPROVADO | `revisao-spec` | A 4.0 roda a E15(d) sem o refazer existir (`tasks.md:82`, `4_task.md:3` e `4_task.md:66`). A E15(d) põe o aceite contra o refazer, mas a 4.0 depende só da 2.0… |
| 2026-09-24 12:59:46 | `test-engineer` | 8ª | APROVADO | `revisao-spec` | Cabeçalhos desatualizados: `2_task.md:3` diz "Paralelo com: 5.0" e `3_task.md:3` diz "Paralelo com: 4.0, 5.0", mas a 5.0 e a 4.0 agora dependem da 3.0. A… |
| 2026-09-24 14:02:13 | `test-engineer` | 1ª | APROVADO | `1_task` | A3, e-mail do operador: `painel-escrita.int.test.ts:177`. A lista de sentinelas não inclui o e-mail nem o apelido do operador da sessão… |
| 2026-09-24 14:03:42 | `tenancy-guardian` | 1ª | APROVADO | `1_task` | `packages/shared/src/operacao/eu.ts:5-8`: o comentário diz que os checks do banco "são gerados desta expressão", mas eles estão escritos por extenso e são… |
| 2026-09-24 14:03:52 | `privacy-guardian` | 1ª | APROVADO | `1_task` | O comentário em `packages/shared/src/operacao/eu.ts` diz que os checks do banco "são gerados desta expressão". Isso é falso: os checks estão escritos por… |
| 2026-09-24 14:03:57 | `infra-guardian` | 1ª | APROVADO | `1_task` | `apps/api/src/operacao/operador.repository.ts:141`: a espera do `for share` no request está sujeita ao `statement_timeout` de 300 ms do pool da API. Se um… |
| 2026-09-24 14:05:05 | `revisor-geral` | 1ª | APROVADO | `1_task` | `packages/shared/src/operacao/eu.ts:6`: o comentário diz que os três checks do banco "são gerados desta expressão". Não são: estão escritos por extenso no… |
| 2026-09-24 17:46:17 | `test-engineer` | 1ª | REPROVADO | `2_task` | O índice `convite_pendente_unico` e o mapeamento dele para `CONFLITO` não têm teste. |
| 2026-09-24 17:48:07 | `test-engineer` | 2ª | APROVADO | `2_task` | `convite.repository.int.test.ts:171-173`: o comentário diz que o erro cru do Postgres traria o valor da linha no `detail`. Dá para fixar isso com uma asserção… |
| 2026-09-24 18:18:12 | `privacy-guardian` | 1ª | APROVADO | `2_task` | Na linha "Convite de coordenador" de `docs/lgpd.md:72`, a finalidade diz "primeiro acesso (F1)". Vale acrescentar que o convite agora nasce também pelo painel… |
| 2026-09-24 18:18:16 | `infra-guardian` | 1ª | APROVADO | `2_task` | `packages/nucleo/drizzle/0015_convite_pendente_unico.sql:5`: o índice falha em banco que já tem dois convites em aberto do mesmo usuário, como aconteceu no… |
| 2026-09-24 18:18:16 | `tenancy-guardian` | 1ª | APROVADO | `2_task` | `tasks/prd-apresentacao-painel/techspec.md:122` diz que "só `painel.service.ts` abre o contexto pelo `:id`". Na verdade, quem abre é… |
| 2026-09-24 18:19:35 | `revisor-geral` | 1ª | REPROVADO | `2_task` | O nome digitado no gerar é descartado quando o usuário é reaproveitado. Isso quebra a promessa da seção 5 da Tech Spec. |
| 2026-09-24 18:21:53 | `test-engineer` | 3ª | APROVADO | `2_task` | A função `retrato` (`painel-convite.int.test.ts:109`) não lê `usuario.nome`. Nos estados que dão 409, "nada muda" não inclui o nome. Hoje o `ativa` volta 409… |
| 2026-09-24 18:50:57 | `infra-guardian` | 2ª | APROVADO | `2_task` | A recomendação da 1ª rodada continua valendo. `packages/nucleo/drizzle/0015_convite_pendente_unico.sql` agora diz que a migration "falha alto" quando um seed… |
| 2026-09-24 18:51:05 | `revisor-geral` | 2ª | APROVADO | `2_task` | da 1ª rodada: aplicadas |
| 2026-09-24 18:51:11 | `tenancy-guardian` | 2ª | APROVADO | `2_task` | Nome em duas escolas. No E10 (`apps/api/test/painel-convite.int.test.ts:401`), gerar na escola B com um nome diferente do usado na A, e verificar que o usuário… |
| 2026-09-24 18:51:14 | `privacy-guardian` | 2ª | APROVADO | `2_task` | Na correção de nome, `convite.criado` poderia levar um marcador sem dado pessoal, como `{ usuarioReaproveitado: true }` ou `{ nomeAlterado: true }`. Assim o… |
| 2026-09-24 19:49:54 | `test-engineer` | 1ª | APROVADO | `3_task` | E15(d) na 4.0: o teste da E9 cobre só "aceite primeiro, depois refazer". A outra ordem (o refazer revoga, o aceite espera a linha e deve responder como convite… |
| 2026-09-24 19:50:41 | `privacy-guardian` | 1ª | APROVADO | `3_task` | Em `docs/lgpd.md:72`, trocar "gerado pelo comando do operador ou pelo painel da operação" por "gerado ou refeito pelo painel da operação". Assim o dossiê deixa… |
| 2026-09-24 19:50:48 | `tenancy-guardian` | 1ª | APROVADO | `3_task` | Em `convite.repository.ts:129`, pôr também `eq(convite.tipo, 'coordenador')` no `where` de `revogarParaRefazer`, como defesa em profundidade. Hoje só o… |
| 2026-09-24 19:50:54 | `infra-guardian` | 1ª | APROVADO | `3_task` | Na 4.0 o aceite passa a pegar a mesma trava, com o `statement_timeout` de 300 ms do pool da API. Falta um teste de que o aceite que perde a trava para um… |
| 2026-09-24 19:51:12 | `revisor-geral` | 1ª | APROVADO | `3_task` | `tasks/prd-apresentacao-painel/cenarios.md:69-70`: a E9 ainda diz "pelo índice (23505 vira `CONFLITO`)". A divergência foi para a Tech Spec, mas não para o… |
| 2026-09-25 00:03:32 | `test-engineer` | 1ª | REPROVADO | `4_task` | O caso de permissão do novo ramo não tem teste. |
| 2026-09-25 00:39:18 | `test-engineer` | 2ª | APROVADO | `4_task` | Recomendações que ficaram de fora nesta rodada. Os motivos dados são aceitáveis. Ficam registradas para o `/validar` e o `/retro`: |
| 2026-09-25 00:40:38 | `privacy-guardian` | 1ª | APROVADO | `4_task` | Registrar nos furos conhecidos de `docs/lgpd.md` (ou no docblock de `login.service.ts`) um sinal que ficou de fora. Quem tem o bilhete de uma conta sem outro… |
| 2026-09-25 00:40:48 | `tenancy-guardian` | 1ª | APROVADO | `4_task` | `apps/api/src/sessao/convite.service.ts:77`: o contexto de fora usa `valido.escolaId`, lido fora da transação, e o de dentro usa `usado.escolaId`. Os dois só… |
| 2026-09-25 00:41:19 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `4_task` | Entrada com dois avisos que se contradizem. Em `apps/web/src/paginas/Entrar.tsx:66-70`, o aviso `AVISO_DO_CONVITE_PARA_CONTA_EXISTENTE` fica na tela quando a… |
| 2026-09-25 00:41:35 | `infra-guardian` | 1ª | APROVADO | `4_task` | `desfazer` pode descontar do lugar errado. Em `apps/api/src/sessao/contador-de-tentativas.ts:224-233`, o `desfazer` roda o `SCRIPT_DESFAZER` no Redis sempre… |
| 2026-09-25 00:42:35 | `revisor-geral` | 1ª | APROVADO | `4_task` | seis, abaixo |
| 2026-09-25 01:23:04 | `test-engineer` | 3ª | APROVADO | `4_task` | duas, abaixo |
| 2026-09-25 01:23:52 | `frontend-reviewer` | 2ª | APROVADO | `4_task` | Em `Mfa.tsx:63`, o aviso de convite inválido vai para o bloco de aviso da entrada, com estilo `pendente` (âmbar). Na entrada direta, o mesmo texto sai como… |
| 2026-09-25 01:24:12 | `privacy-guardian` | 2ª | APROVADO | `4_task` | Em `apps/web/src/paginas/Entrar.tsx`, no `NAO_ENCONTRADO`, apagar também o `bilheteDeConvite` da memória, não só o aviso. O bilhete de um convite revogado não… |
| 2026-09-25 01:24:24 | `revisor-geral` | 2ª | APROVADO | `4_task` | `apps/api/src/sessao/mfa.service.ts:146-149`. Depois do 503 `TEMPO_ESGOTADO` da trava, a mensagem diz "Tente de novo em instantes". Quem repete dentro dos… |
| 2026-09-25 01:24:26 | `tenancy-guardian` | 2ª | APROVADO | `4_task` | A trava usa `hashtext` do id da escola, e duas escolas podem cair na mesma chave. Aí uma espera a outra, sem que dado cruze de escola. Isso já existia antes… |
| 2026-09-25 01:24:36 | `infra-guardian` | 2ª | APROVADO | `4_task` | três, abaixo |
| 2026-09-25 02:34:27 | `test-engineer` | 1ª | REPROVADO | `5_task` | `apps/api/src/operacao/painel.repository.ts:90`, a chave da ordem `uso`: o período do mês que ela usa não tem teste que o prove. A chave repete, numa… |
| 2026-09-25 02:37:03 | `test-engineer` | 2ª | APROVADO | `5_task` | nenhuma nova. |
| 2026-09-25 02:48:36 | `tenancy-guardian` | 1ª | APROVADO | `5_task` | `painel.repository.ts:103-105` e `:139`: nas contagens de turmas, professores e alunos, quem de fato separa as escolas é o `ano_letivo_id = ano.id`, junto com… |
| 2026-09-25 02:48:52 | `privacy-guardian` | 1ª | APROVADO | `5_task` | `docs/lgpd.md`: registrar, numa linha ou nota sobre o painel da operação (D76), que a equipe Turmma vê por escola só contagens do ano em curso e uso de infra,… |
| 2026-09-25 02:49:02 | `infra-guardian` | 1ª | APROVADO | `5_task` | `packages/nucleo/drizzle/0016_usuario_coordenador_ativo.sql:7`: o `CREATE INDEX` sem `CONCURRENTLY` segura a escrita em `usuario` enquanto o índice é… |
| 2026-09-25 03:04:50 | `revisor-geral` | 1ª | APROVADO | `5_task` | `apps/api/src/operacao/painel.repository.ts:135-163` e `:203-223`: a página e o `total` saem de duas consultas em paralelo, cada uma com a sua fotografia do… |
| 2026-09-25 03:47:16 | `test-engineer` | 1ª | REPROVADO | `6_task` | A medida de largura dentro do diálogo não enxerga o diálogo. |
| 2026-09-25 04:20:49 | `test-engineer` | 2ª | REPROVADO | `6_task` | `e2e/operacao-escolas.spec.ts:179`: o endereço longo não prova que a tela não rola na horizontal. Hoje ele é `${'e'.repeat(30)}-${'f'.repeat(32)}`. O hífen é… |
| 2026-09-25 04:35:22 | `test-engineer` | 3ª | APROVADO | `6_task` | nenhuma nova. |
| 2026-09-25 04:36:30 | `privacy-guardian` | 1ª | APROVADO | `6_task` | e2e/__fixtures__/painel.ts:56: o texto que estica o nome da escola longa inclui "Professora Maria Aparecida dos |
| 2026-09-25 04:37:18 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `6_task` | O aviso de inatividade fica inerte quando um diálogo está aberto. |
| 2026-09-25 04:37:32 | `revisor-geral` | 1ª | APROVADO | `6_task` | `apps/web/src/operacao/pedidos-do-painel.ts:38`: o `TEXTO_DO_CAMPO[campo as CampoDaEscola]` funciona hoje só porque `CampoDaRede` cabe dentro de… |
| 2026-09-25 04:55:58 | `test-engineer` | 4ª | APROVADO | `6_task` | `e2e/operacao-escolas.spec.ts:550-555`: o Enter e o toque não causam o uso que o teste espera, e o teste depende da latência da rede simulada. |
| 2026-09-25 05:19:34 | `test-engineer` | 5ª | APROVADO | `6_task` | Linha 607: o `expect.poll(() => usos.length).toBe(1)` passa assim que chega a 1, e não prova que foi um só. Para provar "exatamente um", repita… |
| 2026-09-25 05:20:22 | `privacy-guardian` | 2ª | APROVADO | `6_task` | Continuam valendo as recomendações 2 e 3 da rodada anterior, adiadas para o `/validar`: registrar em `docs/lgpd.md` as pendências da 3.0 e da 5.0. |
| 2026-09-25 05:20:35 | `revisor-geral` | 2ª | APROVADO | `6_task` | `apps/web/src/operacao/paginas/Escolas.tsx:232` (e `:222` no Nova rede): a guarda compara o tipo do diálogo, não a instância. |
| 2026-09-25 05:21:06 | `frontend-reviewer` | 2ª | APROVADO | `6_task` | Em `AvisoDeInatividade.tsx`, depois de "Continuar na sessão", devolver o foco ao diálogo (ao campo que estava focado, ou ao primeiro) quando o aviso estiver… |
| 2026-09-25 06:32:06 | `test-engineer` | 1ª | REPROVADO | `7_task` | O segundo Esc, na pergunta, não tem teste. |
| 2026-09-25 07:16:52 | `test-engineer` | 2ª | APROVADO | `7_task` | O título do W8 (`:423`) ainda descreve só "o Esc cai na pergunta". Vale acrescentar "o segundo fecha, e o navegador fechando desmonta" para o `/validar` achar… |
| 2026-09-25 07:18:13 | `privacy-guardian` | 1ª | APROVADO | `7_task` | Quando o operador fecha com o pedido ainda no ar ("Fechar sem copiar"), o servidor cria o convite, mas o link não aparece para ninguém. Isso não vaza nada,… |
| 2026-09-25 07:19:02 | `revisor-geral` | 1ª | APROVADO | `7_task` | Divergências declaradas. São duas, e as duas estão registradas na seção "Divergências resolvidas nesta tarefa" do `7_task.md` e na seção 9 da techspec: |
| 2026-09-25 07:19:23 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `7_task` | `apps/web/src/operacao/paginas/Escolas.tsx:50` (a chave é a posição), junto de `:290-292` e `apps/web/src/operacao/componentes/DialogoDaOperacao.tsx:69`:… |
| 2026-09-25 07:40:03 | `test-engineer` | 3ª | APROVADO | `7_task` | O anúncio da página como último destino do foco não tem teste. É o `else regiaoDoAnuncio.current?.focus()` em `Escolas.tsx` (`focarNaEscola`). O cenário é… |
| 2026-09-25 07:41:00 | `privacy-guardian` | 2ª | APROVADO | `7_task` | nenhuma nova. As três da 1ª rodada continuam para o `/validar`: |
| 2026-09-25 07:41:19 | `frontend-reviewer` | 2ª | APROVADO | `7_task` | Quando o foco vai para o anúncio da página, ele pode estar vazio ou com um texto antigo. Isso acontece no caminho do conflito quando a escola já saiu da… |
| 2026-09-25 07:41:31 | `revisor-geral` | 2ª | APROVADO | `7_task` | `Escolas.tsx:72-74`. O `ref={(botao) => () => …}` depende de o React 19 aceitar que o `ref` devolva uma limpeza, e de a limpeza rodar antes de o nó ser… |
| 2026-09-25 09:23:16 | `test-engineer` | 1ª | APROVADO | `8_task` | Risco de teste instável no W6 (`e2e/operacao-uso.spec.ts:118-121`; o mesmo padrão existe em `e2e/operacao-escolas.spec.ts:93`). |
| 2026-09-25 09:39:52 | `test-engineer` | 2ª | APROVADO | `8_task` | O título do caso novo em `formatos.test.ts` diz "volta como veio, sem quebrar a tela", mas o teste só prova a referência sem hífen. Em… |
| 2026-09-25 09:55:08 | `test-engineer` | 3ª | APROVADO | `8_task` | Um ano de `0000` a `0099` bate na expressão, mas o `Date.UTC` o joga para 1900+ (`0026-09` sairia "setembro de 1926"). O contrato já recusa esse formato, então… |
| 2026-09-25 09:56:20 | `revisor-geral` | 1ª | APROVADO | `8_task` | Vazio do Uso copia o componente comum. `apps/web/src/operacao/paginas/Uso.tsx:114-129`: o `VazioDoUso` repete a marcação do `EstadoVazio`… |
| 2026-09-25 09:56:48 | `frontend-reviewer` | 1ª | APROVADO | `8_task` | Números longos podem quebrar no meio entre 640 e cerca de 760 px (`Uso.tsx:39` e `:75`). |
| 2026-09-25 10:58:41 | `test-engineer` | 1ª | REPROVADO | `9_task` | O teste "alvo sem total" não falharia sem a regra. Está em `apps/worker/test/expurgo-de-acesso.int.test.ts:397-401`. |
| 2026-09-25 11:31:34 | `test-engineer` | 2ª | APROVADO | `9_task` | Uma forma de contornar a regra continua aberta. `const t: Partial<TotaisDoExpurgoDeAcesso> = {}`, preenchido no `for` e afirmado no fim com `t as… |
| 2026-09-25 11:33:05 | `privacy-guardian` | 1ª | APROVADO | `9_task` | `docs/lgpd.md:93-94`: citar o `rl:ip:op` no parágrafo "IP só em memória". Ele guarda o IP no Redis de cache só pela janela de 1 minuto, como o `rl:ip`. Não é… |
| 2026-09-25 11:33:40 | `revisor-geral` | 1ª | APROVADO | `9_task` | `apps/api/src/operacao/segundo-fator.service.ts:177`: o `contextoAtual() ?? { requisicaoId: randomUUID() }` é um caminho morto. Nas rotas HTTP o contexto… |
| 2026-09-25 11:33:49 | `infra-guardian` | 1ª | APROVADO | `9_task` | `packages/nucleo/src/limite/chaves.ts:434`: o prefixo `rl:ip:op` fica dentro do espaço de nomes `rl:ip:`, ao contrário do `rl:ip-login`, que foi separado de… |

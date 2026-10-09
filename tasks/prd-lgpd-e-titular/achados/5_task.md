# Achados das revisões — `tasks/prd-lgpd-e-titular/5_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-08 22:33:22 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: REPROVADO

**Cenários exigidos (tarefa 5.0):**
- **Trabalho do aluno:** ano `em_curso` ou `planejado` com o `fim` vencido não perde nada, e o `encerrado` perde. Saem a tentativa, a resposta e a correção; a atividade aplicada e o lote de correção ficam. Também: aluno transferido, ajuste da escola, lote de 5.000 com cascata dentro de 2 s, `skip locked`, limite, isolamento A/B, e dois jobs em paralelo.
- **Reivindicação:** sai a decidida por qualquer decisor e a `encerrada` sem decisão; a pendente nunca sai; a de B fica.
- **Material:** o vigente fica mesmo velho; o excluído sai com os trechos; o citado pela conversa ou por um sinal do Tutor fica até a conversa sair.
- **Vínculo:** ativo, pendente, contestado e encerrado recente ficam.
- **Pessoa desativada:** eliminada pelo ciclo de vida com autor `rotina`; a conta global continua se a pessoa está ativa em outra escola; quem sumiu entre a escolha e a trava é pulado; `cheio` conta os escolhidos; erro de SQL grava `false` e a noite seguinte começa por ela; lote de no máximo 100, mais antigas primeiro, sem a de B; dois jobs em paralelo; **reativada entre a escolha e a trava não é eliminada**.
- **`expurgo_execucao`:** 5 anos e um dia sai, 5 anos menos um dia fica, a de B fica, a janela letiva é respeitada.
- **Catálogo coberto (unidade), índices da 0027 e planos.**

**Cobertos:** todos os acima, menos a pessoa reativada entre a escolha e a trava. Não há `.skip` nem `.only`. Os mocks são só proxies de contagem sobre o repositório real e não escondem regra nenhuma. Não há IA no caminho. Os testes com `[P]` rodam de fato em paralelo, com `Promise.all`, e há o teste determinístico com a trava segurada por outra transação. A tabela de Mutações confere com o diff, e as cláusulas marcadas como equivalentes estão justificadas.

**Bloqueantes:**
1. **A rotina pode eliminar uma pessoa que já voltou a ser ativa, e nenhum teste cobre isso.**
   - **Onde:** `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:282` e `:385-393`.
   - **O que está errado:** a lista de pessoas desativadas (`PESSOAS_DESATIVADAS`) é lida sem trava. Depois, `CicloDeVidaService.eliminar` trava a pessoa e a elimina sem conferir de novo `desativado_em` (`packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.service.ts:78-101`; a trava só devolve o `alvo`, e ninguém olha o `alvo.desativadoEm`). Existe caminho real que reativa a pessoa: `ConviteRepository.ativarPorConvite` (`apps/api/src/sessao/convite.repository.ts:129`) põe `desativado_em = null` quando o convite novo é aceito. Se o professor recontratado aceita o convite entre a escolha do lote e a trava, a rotina apaga uma conta ativa, e isso não tem volta. É o "verifica e depois grava" que a regra 80, item 7, proíbe. O lote de até 100 pessoas, uma transação por vez, deixa essa janela aberta por segundos.
   - **Correção exigida:**
     - Conferir sob a trava que a pessoa continua desativada além do corte. Por exemplo: abrir a transação no repositório, travar, reler `desativado_em < corte` e só então chamar `eliminar(id, { autorOperador: AUTOR_DA_ROTINA }, tx)`. A pessoa que não passa é pulada como a que sumiu, sem auditoria e sem contar.
     - Escrever um teste no padrão do "sumiu entre a escolha e a trava" (`apps/worker/test/expurgo-da-escola.int.test.ts:1975`): outra transação trava a pessoa, espera o job parar com `esperarNaTrava`, faz `update usuario set desativado_em = null` e confirma. O teste prova que a pessoa continua no banco, que a auditoria `usuario.eliminado` dela fica vazia e que a contagem da categoria é só a das outras pessoas.
     - Acrescentar a linha na seção "Mutações" e o cenário em `cenarios.md` (RF4, `pessoa_desativada`).
   - **Prazo:** a mesma conferência sob a trava é o que a 14.0 vai precisar para pular o pedido `agendado`, então fazer aqui já prepara a 14.0.

**Recomendações (não bloqueiam):**
- **Matrícula repetida em escolas diferentes:** no teste de `pessoa_desativada`, ponha em B uma credencial com a mesma matrícula da pessoa eliminada em A e confira que a de B fica.
- **Aluno desativado com trabalho:** acrescente um caso de aluno desativado além do prazo que ainda tem tentativa, mensagem do Tutor e consumo de IA. Prova que a eliminação pela rotina não quebra por FK nem deixa a categoria `false`, e que a cascata e o `set null` funcionam no caminho da rotina.
- **Instante do corte do registro:** a mutação `expurgarRegistroDoExpurgo(agora, …)` trocada por `relogio.agora()` está declarada sem teste que a distinga. Se valer a pena, um teste em que o relógio anda antes do laço do registro, sem abrir a janela letiva, fecharia isso.
- **Teste `[P]` das pessoas:** ele não garante que os dois jobs se cruzem de verdade. O caso determinístico já existe; vale dizer isso no nome ou num comentário do teste.

## test-engineer · 2ª rodada · APROVADO · 2026-10-08 23:17:46 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (RF4, `pessoa_desativada`, rodada nova restrita à correção exigida na 1ª rodada):
- Uma pessoa volta a ficar ativa (convite aceito) entre a escolha do lote e a trava. Ela tem de ficar no banco, sem auditoria `usuario.eliminado`, e fora da contagem.
- O pulo não pode quebrar o resto do lote: a pessoa seguinte ainda sai.
- O teste antigo «sumiu entre a escolha e a trava» e o de dois jobs em paralelo continuam passando com a trava agora aberta no repositório.

**Cobertos:**
- A correção exigida foi feita como pedido. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:394-403`, o repositório abre uma transação por pessoa. Nela, trava a pessoa (`for no key update`), relê `desativado_em < corte(...)` com o escopo `escolaId` e `id`, devolve `NAO_ENCONTRADO` quando a pessoa não passa e só então chama `eliminar(id, { autorOperador: AUTOR_DA_ROTINA }, tx)`. O `#naTransacao` do ciclo de vida reutiliza essa transação.
- O teste novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts:1999-2021`. Ele segue o padrão pedido: outra transação trava a pessoa, o job espera na trava (`esperarNaTrava`), o teste faz `update ... desativado_em = null` e `commit`. Depois confere que a pessoa continua no banco, que a auditoria dela está vazia, que a outra saiu com uma auditoria e que a contagem dá `linhas: 1`.
- O teste falharia se a regra fosse removida:
  - Sem a cláusula `desativado_em < corte`, o Postgres reconfere a linha depois do `commit`, encontra a pessoa, e o `eliminar` a apaga. A asserção `existe(reativada) === true` cai.
  - Sem `eq(usuario.id, id)`, o `limit 1` trava outra pessoa (a `outra`), e o `eliminar(reativada)` apaga a reativada, porque o `eliminar` não confere o prazo. O teste também cai, ou trava e estoura o tempo.
- «Mutações» ganhou as duas linhas. A linha que declara `eq(usuario.escolaId, escolaId)` como equivalente tem justificativa aceitável: o id é UUID e o `eliminar` trava pelo próprio id. O `cenarios.md` ganhou o item em RF4.
- Rodei aqui as duas suítes de integração, que passaram:
  - os 2 testes de corrida «entre a escolha do lote e a trava»;
  - o arquivo inteiro `expurgo-da-escola.int.test.ts`, com 106 testes, incluindo o «sumiu» e o de dois jobs em paralelo.
- Não há `.skip`, mock nem provedor de IA no diff.

**Bloqueantes:** nenhum.

**Recomendações:**
- `expurgo-da-escola.int.test.ts:2009`: o teste só prova a volta para `desativado_em = null`. Se alguém trocasse `desativado_em < corte(...)` por `desativado_em is not null`, ele continuaria verde. O caso que ficaria descoberto é o de quem foi reativado e desativado de novo dentro do prazo (por exemplo `update usuario set desativado_em = now()`). Uma variante do teste com esse `update`, ou um `it.each` com os dois valores, fecharia a mutação.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/5_task.md`, na linha de divergência «transação por pessoa»: a coluna do motivo ainda diz «o `eliminar` já abre a transação, e a do lote só a embrulharia». Esse argumento não vale mais, porque agora quem abre a transação é o repositório. Vale ajustar o texto para o `/validar`.
- A ordem das travas (usuário, depois conta) é a mesma de antes. Mesmo assim, se um aceite de convite (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/convite.repository.ts:129`) travar as linhas em outra ordem, um deadlock vira erro que não é `NAO_ENCONTRADO`. O erro sobe, a categoria grava `false` e a fila tenta de novo. O comportamento é aceitável, mas fica registrado para o `infra-guardian` conferir.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-08 23:18:48 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova. A migration `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0027_expurgo_do_cadastro.sql` só cria sete índices, e todos começam por `escola_id`: `material_excluido_idx`, `mensagem_tutor_material_idx`, `reivindicacao_decidida_idx`, `sinal_tutor_material_idx`, `tentativa_atividade_aluno_idx`, `usuario_desativado_idx` e `vinculo_encerrado_idx`. Nenhum id novo, nenhuma coluna nova.

Queries verificadas: todas em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts`.
- `INSTRUCAO_DO_LOTE.tentativa_atividade`, `.reivindicacao`, `.material` (as duas conferências `not exists` em `mensagem_tutor` e `sinal_tutor` também levam `escola_id`) e `.vinculo`. Também `ANO_ENCERRADO_ALEM_DO_PRAZO`, `PESSOAS_DESATIVADAS`, `REGISTRO_DO_EXPURGO_VENCIDO`, a releitura sob trava em `#eliminarPessoasDesativadas` e `expurgarRegistroDoExpurgo`.
- A escola vem sempre de `exigirEscolaDoContexto()`, o contexto do job. Nenhuma query recebe a escola por parâmetro externo.
- A eliminação usa `CicloDeVidaService.eliminar`, que trava e apaga pelo contexto (`travarUsuario`, `apagarUsuario`, `apagarVinculos` etc.).
- O único `@SemEscopo` alcançado é o da `ContaGlobalRepository`, que já existia e tem justificativa escrita. A tarefa não acrescenta nenhum.
- Nenhum endpoint novo. Nada entra pelo corpo da requisição nem pela query string.
- As FKs da cascata são compostas por escola, por exemplo `tentativa_atividade_aluno_da_escola_fk (escola_id, aluno_id)`.

Teste de isolamento: presente e efetivo. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts`:
- **Linha 1254** (lote por tabela, nos quatro alvos que apagam): a escola B tem linhas mais antigas, e o teste confere a contagem 2, depois 1, depois 0. Sem o filtro de escola na subconsulta, a contagem muda e o teste quebra.
- **Linha 2038** (pessoa desativada, limite 1): a pessoa de B é a mais antiga. Sem o filtro de escola em `PESSOAS_DESATIVADAS`, o lote escolheria B e o teste quebra.
- **Linhas 1747, 1810, 1865, 1901, 1930 e 2144**: cada uma prova que a linha de B, com a mesma idade, fica.
- **Linha 1950**: a conta global de quem continua ativo em outra escola não é limpa.
- **Linha 576** (prazo por categoria): roda para todas as categorias com uma linha de outra escola da mesma idade.

Nos casos que a tabela de mutações marca como equivalentes (o filtro de escola da instrução externa e das conferências `not exists`), a outra cláusula de escopo cobre. Removidas as duas, o teste quebra, e a tabela registra isso.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/usuario.ts`: o predicado do `usuario_desativado_idx` usa `sql\`desativado_em is not null\`` em texto cru. Os outros índices referenciam a coluna (`${tabela.desativadoEm}`). Alinhar evita divergência num rename.
- Na tarefa 14.0, ao incluir o "pula agendado" em `#eliminarPessoasDesativadas`, manter o filtro de escola na conferência do pedido agendado e repetir o teste em que a pessoa de B é a mais antiga.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-08 23:19:47 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. A tarefa só passa a apagar dado que já existia: tentativa, resposta e correção do ano encerrado; reivindicação decidida ou encerrada (com quem decidiu); material excluído (com o licenciante e quem enviou e quem excluiu); vínculo encerrado; e a pessoa desativada além do prazo inteira (nome, credencial com a matrícula, conta externa, sessões, linha da lista). A migration 0027 só cria sete índices, sem coluna nova.

**Fora da tabela de dados do docs/lgpd.md:** nada. As linhas Nome, Resposta, Diagnóstico, Vínculo, Reivindicação e Material ganharam o prazo, a categoria e o ponto de onde o prazo conta. Os intervalos batem com `CATEGORIAS_DE_RETENCAO` em `packages/shared/src/privacidade/retencao.ts:50-55`.

**Autorização por objeto:** ok. A tarefa não cria rota. Todo lote filtra pela escola do contexto (`exigirEscolaDoContexto`), dentro da subconsulta e no comando de fora. A releitura sob a trava (`expurgo-da-escola.repository.ts:595-600`) filtra por escola e por id. A eliminação passa pelo `#naTransacao` do ciclo de vida, que também trava pela escola do contexto.

**Logs:** limpos. O processador registra só o evento, a categoria (`tipo`) e contagens (`expurgar-escola.ts:73,101,109`). O repositório não registra nada.

**Auditoria:** presente onde a regra exige.
- A eliminação da pessoa desativada grava `usuario.eliminado`, assinada pela rotina (`AUTOR_DA_ROTINA`), com o papel, a data da desativação e contagens, sem nome.
- O acesso da turma revogado por essa eliminação grava `acesso_turma.revogado`.
- O expurgo por prazo deixa em `expurgo_execucao` uma linha por categoria, só com a contagem, como no desenho das tarefas 3.0 e 4.0.
- A trava de 23:16 (reler sob a trava que a pessoa continua desativada além do prazo) fecha o caso de apagar uma conta que já voltou a ser ativa.

**Envio externo:** nenhum. Esta tarefa não chama IA nem manda dado para fora.

**Seed/fixture:** sintético. Os nomes são "Aluno sintético …" e "Professor sintético", os e-mails terminam em `@expurgo.invalid`, a matrícula é `m-expurgo-1` e o hash é `hash-sintetico`.

**Ciclo de vida e pergunta de fechamento:** a eliminação da pessoa pela rotina usa o mesmo caminho da eliminação a pedido do titular, e o dado sai de fato. A conta global só cai quando não serve a mais nenhuma escola. A retenção é ajustável por escola, dentro do piso e do teto do catálogo. O índice novo `tentativa_atividade (escola_id, aluno_id)` serve também ao arquivo do titular. O sistema continua conseguindo responder o que guarda sobre um aluno e para onde isso foi.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `packages/shared/src/privacidade/retencao.ts:51`: na `reivindicacao_decidida`, o texto que a coordenação lê diz que o prazo conta de "a decisão". O código conta da solicitação no caso `encerrada`, que a virada do ano fecha sem decisão. Vale ajustar o texto, por exemplo "a decisão, ou o fechamento na virada do ano", para a escola, que é a controladora, ler o prazo como ele é.
2. `packages/shared/src/privacidade/retencao.ts:94`: o prazo fixo `registro_de_decisao` diz "enquanto durar o contrato com a escola, e mais 5 anos", mas o `expurgo_execucao` sai 5 anos depois de `em`, com o contrato ainda valendo. Esse registro não tem dado de pessoa, então o risco é baixo. Mesmo assim, vale alinhar o texto ou dar ao registro uma linha própria em `PRAZOS_FIXOS`.
3. Reforço a recomendação do `test-engineer` (1ª rodada): um teste com um aluno desativado além do prazo que ainda tenha tentativa, mensagem do Tutor e consumo de IA. Ele provaria que, no caminho da rotina, a eliminação apaga e anula tudo pela cascata e pelo `set null`, sem quebrar o lote por FK.
4. Outra recomendação do `test-engineer` (2ª rodada): uma variante do teste da pessoa reativada em que ela é desativada de novo dentro do prazo (`desativado_em = now()`). Ela fecha a mutação `desativado_em is not null` no lugar de `desativado_em < corte(...)`, que hoje passaria.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/src/processadores/expurgar-escola.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0027_expurgo_do_cadastro.sql`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/lgpd.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/retencao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts`

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-08 23:19:55 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa não cria escrita em `Nota`, e a tabela `nota` não existe nesta fatia (D46; comentário em `packages/nucleo/src/db/schema/correcao.ts`). O diff só apaga ou elimina por prazo. Todos com autor humano? Sim, porque não há caminho nenhum.

Decisão autônoma sobre aluno: ausente. Eliminar a pessoa desativada além do prazo é ciclo de vida da LGPD, não decisão sobre a trajetória do aluno. Quem desativou foi uma pessoa. A rotina só cumpre o prazo, reconfere o prazo sob a trava e pula quem foi reativado (`packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:402` e o teste "a pessoa reativada entre a escolha do lote e a trava não é eliminada").

Aprovação registrada: ok.
- O expurgo do `trabalho_do_aluno` apaga a tentativa e, em cascata, a resposta e a `correcao`. A `entrega` (quem decidiu e quando) e a `validacao_do_lote` (o que foi mostrado, o que foi aberto e quem confirmou) ficam. A validação guarda cópia do que foi apresentado e não tem FK para a correção nem para a tentativa.
- O lote só é aprovado no ano em curso (`apps/api/src/atividade/correcao.repository.ts`, `exigirAnoEmCurso`). O expurgo só alcança ano `encerrado`. Por isso não existe lote pendente que alguém aprove depois de perder as correções.
- A eliminação de um professor desativado passa pelo mesmo `CicloDeVidaService.eliminar`. `decidida_por` e `confirmada_por` não têm FK, e isso já é provado em `packages/nucleo/src/db/schema/mvp/tabelas-do-mvp.int.test.ts:1463`.
- A conversa do professor sai com ele (`thread_agente` em cascata), sem que a coordenação a tenha alcançado em nenhum momento (item 8 respeitado).

Supervisão do tutor: ok. O material excluído só sai quando nenhuma `mensagem_tutor` nem `sinal_tutor` o cita mais (`expurgo-da-escola.repository.ts:263-264`). O registro que o professor supervisiona nunca perde a referência antes da conversa sair. O diff não traz nada de vigilância, inferência emocional, tempo ocioso nem navegação.

Autonomia declarada e visível: sim, sem alteração. A tarefa não toca agente nem nível de autonomia. Itens 8 e 9 (nota proposta em discursiva e redação, e medição do professor): nada no diff.

Bloqueantes: nenhum.

Recomendações:
1. `apps/worker/test/expurgo-da-escola.int.test.ts:1738-1740`: além de `existe('entrega', …)`, conferir que a `validacao_do_lote` do lote e o `decidida_por`/`decidida_em` da entrega ficam iguais depois do expurgo do `trabalho_do_aluno`. Hoje isso é garantido pela estrutura (não há FK), mas um teste aqui prenderia o item 6 ao expurgo, se um dia alguém puser uma FK em cascata.
2. Em `describe('pessoa_desativada')`, um caso com professor desativado que decidiu uma entrega e confirmou uma validação, conferindo que o expurgo noturno não apaga quem aprovou. Hoje isso só é provado por `delete` direto no teste do MVP, não pelo caminho da rotina.
3. O autor `rotina` (`AUTOR_DA_ROTINA`) assina a auditoria de eliminação. Na 15.0, o check precisa garantir que esse apelido nunca aparece como autor de aprovação de saída de IA nem de decisão de entrega (itens 1 e 3). Fica registrado para a 15.0, fora do escopo desta tarefa.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/src/processadores/expurgar-escola.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/validacao-do-lote.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/entrega.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/mvp/tabelas-do-mvp.int.test.ts

## revisor-geral · 1ª rodada · APROVADO · 2026-10-08 23:20:41 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A tarefa diverge da spec em cinco pontos: a reivindicação conta o prazo de `coalesce(decidida_em, solicitada_em)`, a eliminação roda numa transação por pessoa com lote de 100, o `expurgo_execucao` sai no fim da noite, o material citado pelo Tutor fica, e o lote do trabalho do aluno ficou no tamanho do job. As cinco estão registradas no `5_task.md`, na `techspec.md` §5 ("Tarefa 5.0, como ficou no código") e §7c, e no `cenarios.md` (RF4 cadastro, RF4 `pessoa_desativada`, RF5).
Portão local: carimbo válido (typecheck, lint, test, infra)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/retencao.ts:51`: o texto de `reivindicacao_decidida` que a coordenação lê em `GET retencao` diz "depois de decididos" e "conta de: a decisão". O código também apaga o pedido `encerrada`, contado da solicitação. Vale ajustar o texto, por exemplo "a decisão, ou a solicitação no pedido encerrado sem decisão", e a linha da tabela da `techspec.md` §3, que também diz só "decisão". Assim a tela não declara um prazo diferente do que o código aplica.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/material.ts:24-25`: o comentário diz que "a linha fica, porque artefatos já citam o material". Com a 5.0 o material excluído sai depois do prazo, e a citação no `jsonb` do artefato passa a aparecer como "material da escola" (`pdf-do-artefato.ts:195`). O arquivo foi alterado nesta tarefa e o comentário ficou desatualizado.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:330` e `:389-410`: o repositório cria e chama um service (`CicloDeVidaService`) e conduz a regra de eliminação: transação por pessoa, reconferência e pulo do `NAO_ENCONTRADO`. A camada fica invertida em relação a `docs/arquitetura.md`. Funciona e está testado, mas a orquestração ficaria melhor num service do expurgo, com o repositório só escolhendo os ids. Se não mudar agora, levar como dívida para a 14.0, que vai mexer nesse mesmo laço para pular o pedido `agendado`.
- Na 14.0, cuidar para que o pulo do pedido `agendado` não seja feito por `NAO_ENCONTRADO` depois da escolha. Hoje o `cheio` vem do número de escolhidos (`expurgo-da-escola.repository.ts:409`). Se 100 pessoas agendadas forem escolhidas e puladas toda noite, o laço do processador gira até a janela letiva abrir e não avança. O filtro precisa ir no `PESSOAS_DESATIVADAS`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/src/medicao-do-expurgo.ts:93` (fora do diff, afetado por ele): a medição do alerta conta as noites contra o `CATEGORIAS_DO_EXPURGO` atual, que passou de 7 para 12 categorias. Num ambiente que já tenha noites gravadas com 7, as duas noites anteriores ao deploy contam como incompletas, e o `expurgo.noites_incompletas` fica em 2 para toda escola por cerca de um dia e meio. Hoje não tem efeito, porque não há staging. Vale um parágrafo no runbook ou um item no `TODO.md` para quando o catálogo crescer com ambiente de pé.
- A pessoa cuja eliminação falha sempre (um erro que não seja `NAO_ENCONTRADO`) faz toda noite da escola começar por `pessoa_desativada` e cair ali, segurando as outras 11 categorias. É o caso já registrado no `TODO.md` ("Categoria que falha toda noite segura as seguintes"). A 5.0 é a primeira categoria em que essa falha depende de uma linha só. Vale citar isso naquele item.

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-08 23:22:30 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: migration | fila
Rate limit: ok (a tarefa não cria endpoint nem login; é job de lote)
Fila e prioridade: ok
Concorrência: protegida (o deadlock que o `test-engineer` levantou está nas recomendações; não deixa estado errado)
Índice e paginação: faltando
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok

Bloqueantes:

1. **`packages/nucleo/drizzle/0027_expurgo_do_cadastro.sql` e `packages/nucleo/src/db/schema/execucao-agente.ts:77`: falta um índice em `execucao_agente`.**
   - **O que está errado:** a regra 80, item 8, pede índice que comece pelo escopo em toda query sobre tabela que cresce com aluno. Agora o lote de `pessoa_desativada` (`expurgo-da-escola.repository.ts:402`, até 100 pessoas por lote, `:75`) chama `CicloDeVidaService.eliminar`, que apaga o `usuario`. Esse `delete` dispara a FK `execucao_agente_solicitada_por_da_escola_fk`, que tem `on delete set null`. O Postgres então roda, por pessoa eliminada, `UPDATE ONLY execucao_agente SET solicitada_por = NULL WHERE escola_id = $1 AND solicitada_por = $2`.
   - **Por que pesa:** não existe índice com `(escola_id, solicitada_por)`, nem no schema nem no banco de teste. Medi no Postgres de teste, com 1 milhão de linhas, numa transação desfeita: o plano é um **Seq Scan na tabela inteira, de todas as escolas** (`Rows Removed by Filter: 1005388`).
   - **O tamanho:** a tabela ganha uma linha por turno do Tutor, uns 3,5 milhões por ano nas dez escolas (`docs/infra.md` 3.6). As linhas só perdem a pessoa, não saem.
   - **O efeito:** a eliminação de uma pessoa da escola A lê o histórico do Tutor de todas as escolas, e isso se repete 100 vezes por lote. Quando a tabela fria passar dos 2 s do `statement_timeout`, cada eliminação cai com 57014. A categoria grava `false` toda noite, o alerta de duas noites dispara e a pessoa desativada nunca sai.
   - **Por que passou:** o EXPLAIN da tarefa mediu só a FK de `tentativa_atividade`. Foi para essa que a tarefa criou `tentativa_atividade_aluno_idx`.
   - **Correção exigida:**
     - Pôr na 0027 e no schema `index('execucao_agente_solicitada_por_idx').on(escolaId, solicitadaPor).where(sql\`solicitada_por is not null\`)`.
     - Acrescentar ao teste "índices da migration 0027" e ao do plano a consulta que a FK dispara, como já é feito para `tentativa_atividade`, e conferir que ela desce pelo índice novo.
     - Fazer o mesmo levantamento nas outras FKs para `usuario` acionadas pelo `delete`: `artefato.criado_por`, `reivindicacao.decidida_por`, `lista_nome.usuario_id/criado_por`, `vinculo.usuario_id` e `thread_agente.usuario_id`. Registrar no EXPLAIN da tarefa que cada uma tem índice que começa pela escola, ou por que o volume dela dispensa.

Recomendações:

- **Ordem das travas (a observação do `test-engineer`).**
  - O aceite de convite (`ativarPorConvite`) **não** chega a colidir com a eliminação. `usuarioConvidado` (`apps/api/src/sessao/convite.repository.ts`) põe `desativado_em = now()` ao gerar o convite. O convite vale horas e o piso de `pessoa_desativada` é 12 meses, então quem espera convite nunca entra no lote. E a reconferência sob a trava cobre a corrida.
  - O risco real é outro: o `convidar` (`apps/api/src/sessao/convite.service.ts`) trava a **conta** antes do **usuário**: primeiro `contaParaConvite` com `FOR NO KEY UPDATE` (`resolucao-de-tenant.repository.ts:415`), depois o upsert de `usuarioConvidado`. O `#naTransacao` do ciclo de vida faz o contrário: usuário, depois conta `FOR UPDATE`.
  - Se a coordenação chamar de volta, pelo mesmo e-mail, alguém desativado além do prazo no mesmo instante em que o expurgo o processa, sai um 40P01. Nada se corrompe: se o expurgo perde, grava `false`, tenta de novo e pula a pessoa; se o convite perde, a coordenação refaz.
  - Sugestão: alinhar a ordem (conta antes do usuário no ciclo de vida, ou o inverso no `convidar`), ou fazer o convite responder `INDISPONIVEL_TENTE_DE_NOVO` no 40P01. A inversão já existia na 17.0; esta tarefa só a leva para a rotina noturna.
- **Tempo do lote de pessoas.** Medir o lote de 100 pessoas inteiro (escolha mais eliminações) contra a janela e o `statement_timeout`, como já se faz com o `trabalho_do_aluno`. Hoje o cenário "tempo do lote" cobre só a cascata da tentativa.
- **`expurgarRegistroDoExpurgo(agora, …)`** não tem teste que o distinga de `relogio.agora()`, como a própria tabela de mutações registra. Vale um teste com o relógio andando durante o laço do registro.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0027_expurgo_do_cadastro.sql`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/execucao-agente.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.service.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/sessao/resolucao-de-tenant.repository.ts`

## test-engineer · 3ª rodada · APROVADO · 2026-10-09 00:20:51 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO

Cenários exigidos (nesta rodada, só a correção do `infra-guardian`):
- os dois índices novos existem com a definição esperada (escola primeiro, parcial `is not null`);
- ao eliminar a pessoa, o `set null` das duas FKs desce pelo índice dela, e não pelo de outro;
- o teste falha se cada índice for removido;
- o resultado não depende de restos de outras execuções do teste nem só do `set local enable_seqscan = off`.

Cobertos: todos.

Teste rodado: `npx vitest run --project integracao apps/worker/test/expurgo-da-escola.int.test.ts -t "índice próprio|os nove existem"`. Passou, 2 de 2.

Também repeti o teste do plano direto no banco de teste, numa transação desfeita no fim, com o mesmo volume (10.000 linhas na escola, 2.000 da pessoa e 8.000 do outro professor) e uma escola já existente:
- **Sem o `enable_seqscan = off`, com os índices:** o plano usa `artefato_criado_por_idx` e `execucao_agente_solicitada_por_idx`. Quem escolhe é a diferença de linhas entre os dois professores, não o `set local`.
- **Com plano genérico** (`plan_cache_mode = force_generic_plan`, o tipo de plano que o Postgres guarda para o `set null` da FK): também usa os dois índices novos. A consulta escrita à mão no teste mostra o mesmo plano da consulta que o banco roda de verdade.
- **Sem os dois índices, com `enable_seqscan = off`:** o `artefato` cai no `artefato_autoria_idx` e a `execucao_agente` no `execucao_agente_chave_na_escola_unica`, os dois com `criado_por`/`solicitada_por` só como filtro. O teste falha na verificação do nome do índice, `toContain(indice)`, como a regra 40 pede. O resultado bate com a linha de «Mutações».

O teste não depende do que outras execuções deixaram no banco: confere o nome do índice, e não números, e desfaz tudo no fim.

Bloqueantes: nenhum.

Recomendações:
1. `apps/worker/test/expurgo-da-escola.int.test.ts:1012`: com `enable_seqscan = off`, a verificação de que o plano não tem `Seq Scan` nunca falha, e sem os índices o plano também não teria `Seq Scan` (cai no índice da escola). Quem prova a regra é só a verificação do nome. Vale tirar essa linha ou dizer num comentário que ela é só de reforço.
2. O nome do teste («não leem a tabela inteira») e o comentário da migration `0027_expurgo_do_cadastro.sql:12-14` («cada pessoa eliminada lê a tabela inteira, de todas as escolas») exageram. Como a FK começa por `escola_id`, sem os índices o pior caso que medi lê as linhas da escola, não as de todas. O Seq Scan com 1 milhão de linhas citado no 5_task.md só acontece quando uma escola tem quase todas as linhas da tabela. O texto certo é «lê todas as linhas da escola, e não só as da pessoa».
3. Continuam valendo as recomendações da 2ª rodada, que a Mesa decide no fim: variante da pessoa reativada com `desativado_em = now()`, o texto da divergência da transação por pessoa e a ordem das travas contra o aceite de convite.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0027_expurgo_do_cadastro.sql
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/artefato.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/execucao-agente.ts

## infra-guardian · 2ª rodada · APROVADO · 2026-10-09 00:21:48 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO
Caminho quente tocado: migration
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum

A correção exigida na 1ª rodada foi feita:
- **Os dois índices novos estão nos três lugares.** `execucao_agente_solicitada_por_idx` e `artefato_criado_por_idx` são parciais `is not null` e começam por `escola_id`. Estão no schema (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/execucao-agente.ts:80`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/artefato.ts:86`), na migration (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0027_expurgo_do_cadastro.sql:16-17`) e no `0027_snapshot.json`. A árvore de trabalho é igual à árvore auditada, incluindo os dois arquivos ainda não rastreados.
- **O teste confere os nove índices** pela definição de cada um (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts:2260`).
- **O teste do plano roda a consulta que a FK dispara** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts:979`). Ele semeia 10.000 linhas por tabela, com 2.000 da pessoa eliminada e 8.000 de outro professor, e cobre as duas tabelas. O teste exige o nome do índice e proíbe `Seq Scan`. Com isso, nem o `artefato_autoria_idx` nem o `execucao_agente_a_anonimizar_idx` (que também começa pela escola) passam no lugar do índice da pessoa.
- **O levantamento das outras FKs para `usuario` foi registrado** no `5_task.md`, com o plano medido e a razão de cada FK sem índice próprio. Conferi no catálogo das migrations: toda FK para `usuario` que existe hoje está coberta. As duas que não aparecem no levantamento, `auditoria.autor_usuario_id` e `vinculo.criado_por`, foram derrubadas na 0013, então a lista está completa. As FKs restantes estão em tabelas que não crescem por turno do Tutor e têm índice que começa pela escola.

Recomendações:
- Antes do staging ou do piloto, criar com `concurrently`, fora da transação do drizzle, os índices em `execucao_agente` e `mensagem_tutor`. São as duas tabelas que crescem por turno do Tutor, e o `CREATE INDEX` comum trava a escrita enquanto o índice é montado. Hoje isso está coberto pela Tech Spec §7c, mas precisa de item no `TODO.md` com o portão do piloto como prazo.
- As três recomendações da rodada anterior continuam abertas e ficam para a Mesa:
  - a ordem das travas contra o aceite de convite;
  - a medição do lote de 100 pessoas;
  - o teste do relógio do registro.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-09 00:21:53 · `tasks/prd-lgpd-e-titular/5_task.md`

**VEREDITO: APROVADO**

**Escopo:** respeitado. A tarefa 5.0 é a que elimina a pessoa pela rotina, e essa eliminação dispara o `on delete set null` de `execucao_agente.solicitada_por` e de `artefato.criado_por`. Os dois índices servem a esse caminho e a nenhum outro. Nenhuma tarefa futura fica com eles: a 11.0, a 13.0 e a 15.0 têm migrations próprias e não os listam.

**Aderência à Tech Spec:** ok.
- A §7c da `techspec.md`, na linha «Índices novos», já previa `execucao_agente (escola_id, solicitada_por)` e `artefato (escola_id, criado_por)`, os dois parciais `is not null`, mas sem tarefa dona. A divergência registrada no `5_task.md` atribui os dois a esta tarefa.
- A §5 da `techspec.md` e o `docs/modelo-de-dados.md` foram atualizados para os nove índices.
- O `cenarios.md` não ganhou linha. Não é bloqueante: é índice, não comportamento, e a divergência não está só no `N_task.md`, porque está também na `techspec.md`.
- O que verifiquei no diff desde a rodada aprovada:
  - O schema Drizzle, a SQL da 0027 e o `0027_snapshot.json` batem nos nomes, nas colunas e nos predicados dos dois índices.
  - O teste novo semeia um segundo professor com quatro vezes mais linhas, para que o índice por pessoa ganhe do `artefato_autoria_idx`. Com `toContain(indice)`, ele falharia se qualquer um dos dois índices fosse removido.
  - O teste de definição passou de sete para nove índices.
  - A seção «Mutações» foi atualizada.

**Portão local:** carimbo válido. Ele cobre `typecheck`, `lint`, `test` e `infra` para a árvore atual.

**Bloqueantes:** nenhum.

**Recomendações:**
- `tasks/prd-lgpd-e-titular/tasks.md:39` e a subtarefa 5.1 em `tasks/prd-lgpd-e-titular/5_task.md`: a lista de índices da 5.1 ainda não cita `execucao_agente (escola_id, solicitada_por)` nem `artefato (escola_id, criado_por)`. Hoje quem chega pela lista de tarefas só encontra os dois na tabela de divergências.
- `apps/worker/test/expurgo-da-escola.int.test.ts`, no teste novo das FKs `set null`: o `set local enable_seqscan = off` faz o teste provar que o índice existe e serve à consulta. Ele não prova que o planejador o escolheria sem esse empurrão. O EXPLAIN registrado no `5_task.md`, com o volume semeado, cobre a escolha. Vale um comentário curto no teste dizendo que é intencional.

## test-engineer · 4ª rodada · APROVADO · 2026-10-09 01:07:02 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** nesta rodada, cada um dos três testes novos ou alterados precisava falhar sem a regra que diz provar (regra 40). O resto do diff (`material.ts`, `retencao.ts`, `techspec.md`, `TODO.md`, `5_task.md`) é só texto e comentário. O código de regra (`expurgo-da-escola.repository.ts`), a migration 0027 e os schemas de índice não mudaram desde a 3ª rodada.

**Cobertos:**
- **Credencial de mesma matrícula na escola B** (`apps/worker/test/expurgo-da-escola.int.test.ts:1980` e `:1987`): o desativado de A tem a mesma matrícula `m-expurgo-1` (linha 1976), então o caso de matrícula repetida em escolas diferentes está montado de verdade. Hoje a credencial sai pela FK `credencial_matricula_usuario_da_escola_fk` (`on delete cascade`, por `(escola_id, usuario_id)`), sem cláusula no repositório para mutar. A asserção derruba quem trocar isso por um `delete` pela matrícula sem escola. Nesse caso `existe('usuario', deB)` continuaria verde, e só a nova linha 1987 pega. Falha sem a regra.
- **Aluno desativado com trabalho, conversa e sinal do Tutor e consumo de IA** (`:1995`): tudo tem 1 mês, e os prazos de `trabalho_do_aluno`, `conversa_tutor`, `sinal_tutor` e `consumo_por_aluno` são de 12 meses. Então nenhuma outra categoria apaga esses dados antes, e o que sai sai só pela eliminação da pessoa. Se a cascata virar `restrict` ou o `set null` do `consumo_ia` sumir, o `eliminar` lança erro, e caem tanto as asserções de existência e de `aluno_id` nulo quanto o `{ linhas: 1, concluida: true }`. Falha sem a regra.
- **Pessoa reativada e desativada de novo dentro do prazo** (`:2085`): a escolha do lote (`PESSOAS_DESATIVADAS`, linha 283 do repositório) é uma leitura sem trava, então lê a versão antiga, de 62 meses. O `for no key update` sob a trava espera o `for update` do teste e depois reavalia o `WHERE` sobre a linha já atualizada (comportamento do Postgres em read committed). Com `desativado_em < corte` apagado ou trocado por `is not null`, a pessoa com `desativado_em = agora` seria eliminada, e as asserções de existência, de auditoria e de `linhas: 1` ficariam vermelhas. O teste irmão, da linha 2061, põe `desativado_em = null` e não pega a mutação `is not null`; este fecha esse buraco, como diz a linha nova de «Mutações» do `5_task.md`. O `esperarNaTrava` falha por tempo se o job nunca parar na trava, então o teste não passa por acaso.
- Comentários do `[P]` (`:2187`) e do `enable_seqscan = off` (`:1002`), e o novo nome do teste de plano: estão corretos, e nenhuma asserção mudou.

**Bloqueantes:** nenhum.

**Recomendações:**
- No teste da cascata (`:1995`), criar também trabalho, mensagem e sinal de um segundo aluno da mesma escola, ativo, e conferir que ficam. Isso prova que a cascata pega só quem foi eliminado. Hoje a garantia vem só da FK por `usuario_id`.
- Não rodei a suíte nesta auditoria; o que diz «verde» é o portão local carimbado.

## tenancy-guardian · 3ª rodada · APROVADO · 2026-10-09 01:07:37 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela, migration nem índice mudou desde a 2ª rodada. Esta rodada mudou só testes, comentários, um texto da categoria e documentos.

Queries verificadas: o diff não muda nenhuma query nem repository. As consultas novas são as dos testes em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts`. Elas montam os dados dos cenários e conferem o resultado; não fazem parte do código de produção.

Teste de isolamento: presente e efetivo. O teste alterado em `apps/worker/test/expurgo-da-escola.int.test.ts:1980-1987` dá a mesma matrícula `m-expurgo-1` a uma pessoa da escola A e a outra da escola B. A rotina roda só na escola A, e o teste confere que a credencial da escola B continua. Fiz a conta tirando a cláusula: se a credencial fosse apagada pela matrícula sem filtrar pela escola, a linha da escola B sumiria e o teste falharia. O teste da pessoa de B mais antiga (linha 1990) e a mutação de `escola_id` em `PESSOAS_DESATIVADAS` declarada no `5_task.md` seguem como estavam. Os dois testes novos, o da pessoa reativada e desativada de novo e o do aluno com trabalho, conversa e consumo de IA, rodam numa escola só. Eles provam regras do ciclo de vida da pessoa, não o isolamento, e não abrem caminho entre escolas.

Bloqueantes: nenhum.

Recomendações:
- `TODO.md`: o item novo sobre a ordem das travas entre convidar e eliminar descreve um deadlock (40P01) entre `convite.service.ts` e `CicloDeVidaService`. Não cruza escolas, mas precisa ser alinhado antes do piloto, como o item já registra.
- O texto novo de `contaDe` em `reivindicacao_decidida` (`packages/shared/src/privacidade/retencao.ts:51`) mostra à escola dois marcos de contagem do prazo. Vale conferir na tela de retenção se a coordenação entende a frase com o parêntese.

## privacy-guardian · 3ª rodada · APROVADO · 2026-10-09 01:08:01 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO

Esta rodada só auditou o diff entre `cc53786` e `03b06f4` (sem `achados/`) e conferiu as correções que a Mesa decidiu aplicar. O resto já estava aprovado e não mudou.

Campos pessoais tocados: nenhum novo. O diff traz testes, comentários, o texto de `contaDe` em `retencao.ts`, a tabela da Tech Spec, o `5_task.md` e o `TODO.md`. Não entrou coluna, query, log nem DTO.

Fora da tabela de dados do docs/lgpd.md: nada.
- O novo `contaDe` de `reivindicacao_decidida` diz o mesmo que a linha 74 de `docs/lgpd.md`: «contados da decisão, ou da solicitação no `encerrada`».
- O novo comentário de `material.ts` (linhas 24 a 26) diz o mesmo que a linha 86 de `docs/lgpd.md`: o material excluído só sai quando nenhuma conversa nem sinal do Tutor o cita, e depois do prazo de `material_excluido`.

Autorização por objeto: ok, sem rota nova. O teste novo de `credencial_matricula` prova que a mesma matrícula `m-expurgo-1` na escola B continua quando a pessoa da escola A é eliminada (`apps/worker/test/expurgo-da-escola.int.test.ts:1980` e `:1987`). Isso reforça a regra 60, item 6, e o isolamento na eliminação.

Logs: limpos.

Auditoria: presente.
- O teste da pessoa reativada e desativada de novo dentro do prazo confere que ela não é eliminada e que não fica auditoria dela (`auditoriaDaEliminacao(reativada)` vazia), e que a outra pessoa do lote fica com a sua.
- A mutação `desativado_em is not null` do `5_task.md` faz esse teste falhar, então o corte do prazo sob a trava está provado.

Envio externo: nenhum novo.

Seed/fixture: sintético (`'m-expurgo-1'`, `'hash-sintetico'`, ids gerados pelo teste).

As correções da 1ª rodada foram feitas, com uma exceção:
- O texto `contaDe` de `reivindicacao_decidida` foi feito, e a Tech Spec foi alinhada (`techspec.md:53`).
- O teste do aluno desativado com trabalho, conversa do Tutor e consumo de IA foi feito (`expurgo-da-escola.int.test.ts:1995-2010`). Ele prova a regra 20, item 15, na eliminação de fato: `tentativa_atividade`, `mensagem_tutor` e `sinal_tutor` saem, e o `consumo_ia` fica só com `aluno_id` nulo.
- A credencial de mesma matrícula na escola B foi feita.
- A recomendação sobre o prazo de `registro_de_decisao` **não chegou ao `TODO.md`**, ao contrário do que o `5_task.md` diz. Detalhe na recomendação 1.

Bloqueantes: nenhum.

Recomendações:
1. O `5_task.md` diz que a recomendação do `privacy-guardian` sobre `registro_de_decisao` foi para o `TODO.md`, para o Joaquim decidir. O `TODO.md` não tem esse item: procurei por `registro_de_decisao`, `expurgo_execucao` e «durar o contrato», sem resultado. Falta escrever o item. Ele precisa dizer que `packages/shared/src/privacidade/retencao.ts:94` promete à escola «enquanto durar o contrato com a escola, e mais 5 anos», enquanto o `expurgo_execucao` apaga o registro 5 anos depois de `em`, mesmo com o contrato valendo. As saídas são alinhar o texto ou dar ao registro uma linha própria em `PRAZOS_FIXOS`. Não bloqueia, porque o registro não tem dado de pessoa, mas o destino escrito no `5_task.md` precisa existir antes do `/validar`.
2. Fica para o `/validar`: o teste do aluno eliminado não confere que `execucao_agente.solicitada_por` e `artefato.criado_por` ficam nulos para esse aluno. Hoje isso está coberto só pelo teste das FKs `set null` do professor.

## infra-guardian · 3ª rodada · APROVADO · 2026-10-09 01:08:09 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (o diff desta rodada só mexe em testes, comentários, um texto de catálogo e documentos; a migration e o lote noturno de expurgo, que vêm da 2ª rodada, não mudaram)
Rate limit: ok (não se aplica)
Fila e prioridade: ok
Concorrência: protegida. O teste novo «reativada e desativada de novo dentro do prazo» (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts:2085`) segura a linha da pessoa enquanto o job espera, muda a data e confere que ela não é eliminada. Ele cobre a condição de prazo que o repository reconfere sob a trava (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:398`). O comentário novo em `:2187` diz com clareza que o teste [P] não garante a corrida.
Índice e paginação: ok. Os índices e a 0027 não mudaram (o `.sql` e o snapshot sem commit são idênticos ao snapshot `03b06f4`). O comentário do `enable_seqscan = off` (`:1002`) diz que a prova vem do nome do índice no plano.
Degradação de IA: não se aplica
Migration: compatível (nada mudou desde a 2ª rodada). O risco do `CREATE INDEX` sem `concurrently` e do `statement_timeout` de 2 s do migrador está no `TODO.md`, com os nove índices citados e o prazo no portão do piloto.
Métrica e alerta: ok. O efeito da medição do expurgo, que conta as noites contra um catálogo que passou de 7 para 12 categorias, está no `TODO.md`, com o parágrafo do runbook prometido para quando houver staging.
Bloqueantes: nenhum

Conferi as três recomendações da rodada anterior. As três estão no `TODO.md`, seção «Infra e operação»:
- a ordem das travas entre convidar e eliminar, com o deadlock (40P01) e as duas correções possíveis;
- o tempo do lote de 100 pessoas, a medir contra a janela letiva e o `statement_timeout`;
- a medição do expurgo depois de o catálogo crescer.

O texto novo de `reivindicacao_decidida.contaDe` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/retencao.ts:51`) bate com a cláusula `coalesce(decidida_em, solicitada_em)` do repository (`expurgo-da-escola.repository.ts:252`). `privacidade.service.ts` e `retencao.int.test.ts` leem o texto direto da constante, então nenhum teste ficou com o texto antigo.

Recomendações:
- No item do `TODO.md` sobre a categoria que falha toda noite: a falha de uma pessoa só em `pessoa_desativada` trava as categorias seguintes, inclusive o expurgo de conversa do Tutor. Vale tratar isso junto da separação entre linha de falha e linha de interrupção pela janela, antes do piloto, e não depois.

## conformidade-reviewer · 3ª rodada · APROVADO · 2026-10-09 01:08:10 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum novo nesta rodada. O diff só traz três testes de `pessoa_desativada`, comentários, o texto `contaDe` de `reivindicacao_decidida`, o comentário de `material.ts`, `TODO.md`, `techspec.md` e `5_task.md`. Nada escreve em `Nota` nem mexe em `lancadaPor`. Todos com autor humano? sim, sem mudança desde a 2ª rodada.

Decisão autônoma sobre aluno: ausente. O novo teste do aluno desativado com trabalho, conversa do Tutor e consumo de IA cobre a eliminação por retenção, que já estava aprovada. Ela não decide aprovação, reprovação nem encaminhamento. O texto novo do `contaDe` (`'a decisão (ou a solicitação, no pedido fechado na virada do ano)'`) só descreve de quando o prazo conta. Ele não cria fechamento automático de pedido de entrada.

Aprovação registrada: ok. Nenhum fluxo de entrega ou aprovação mudou. A prova de que `decidida_por`/`decidida_em` da entrega continuam depois do expurgo segue no teste já existente (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts:1546-1559`).

Supervisão do tutor: ok. Apagar `mensagem_tutor` e `sinal_tutor` em cascata quando o aluno é eliminado é retenção, não uso que o professor deixa de ver. Nenhum caminho novo do Tutor aparece.

Autonomia declarada e visível: sim, sem mudança nesta rodada.

Bloqueantes: nenhum.

Recomendações:
- As três que fiz na 1ª rodada continuam no lugar combinado, na tabela «Recomendações sem aplicar» do `5_task.md`:
  - provar que `validacao_do_lote` e `decidida_por` ficam depois do expurgo do `trabalho_do_aluno` (vai para o `/validar`);
  - o caso do professor desativado que decidiu uma entrega (vai para o `/validar`);
  - o autor `rotina` nunca aparecer como autor de aprovação (vai para a tarefa 15.0).
- No `/validar`, conferir que o texto «a solicitação, no pedido fechado na virada do ano», que a coordenação lê, não dá a entender que o sistema decidiu o pedido do aluno. Basta deixar claro que o pedido foi encerrado pela virada do ano, sem aprovação nem recusa.

Conferências:
- O diff entre `cc53786a` e `03b06f44` bate com a árvore de trabalho. A única diferença é que `0027_snapshot.json` está fora daquela árvore, porque ainda não foi adicionado ao git, e há duas linhas a mais em `5_task.md`.
- Nesta rodada não mudou nenhuma regra de nota, discursiva ou redação (D46/D55), tutor, autonomia nem indicador de professor (D45).

Arquivos lidos no diff:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/retencao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/material.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/5_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/TODO.md`

## revisor-geral · 3ª rodada · APROVADO · 2026-10-09 01:08:14 · `tasks/prd-lgpd-e-titular/5_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, infra)

Bloqueantes: nenhum

Conferi as correções aplicadas nesta rodada:
- Nenhum código de regra mudou. O diff desde a rodada aprovada só mexe em testes, comentários, `TODO.md`, `5_task.md`, no texto `contaDe` e na linha da Tech Spec §3.
- O teste novo «reativada e desativada de novo dentro do prazo» (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts:2085`) separa de fato a conferência `desativado_em < corte`, feita sob a trava, de um `is not null`. A linha de «Mutações» do `5_task.md` registra isso.
- A credencial com a mesma matrícula `m-expurgo-1` em B (`:1980`) é a mesma matrícula usada em A (`:1976`). O comentário «a mesma matrícula» é verdadeiro.
- O teste do aluno com trabalho, conversa e consumo (`:1994`) usa idade de 1 mês e ano encerrado há 1 mês. O padrão dessas categorias é 12 meses, então só a eliminação da pessoa pode tirar as linhas. O teste não passa por causa de outra categoria.
- O texto `contaDe` de `reivindicacao_decidida` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/retencao.ts:51`) e a linha da Tech Spec §3 batem com o `coalesce(decidida_em, solicitada_em)` do repositório (`expurgo-da-escola.repository.ts:252`).
- O comentário do `enable_seqscan` (`:1002`) diz que a escolha sem esse empurrão está no EXPLAIN. Ela está, em `5_task.md:200-213`.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/TODO.md:99`: a frase «então o prazo do migrador muda junto» ficou sem ponto antes de «Os índices de `execucao_agente`…» na linha seguinte. Falta o ponto final.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/material.ts:26`: a linha do comentário passou da largura das linhas vizinhas. Além disso, «o artefato que a citava mostra «material da escola»» descreve o fallback que só confirmei para o sinal (`apps/web/src/areas/professor/sinais.ts:30`), não para o artefato. Vale conferir no artefato ou trocar por «a tela que a citava».

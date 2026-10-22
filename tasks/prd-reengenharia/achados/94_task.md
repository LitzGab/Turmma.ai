# Achados das revisões — `tasks/prd-reengenharia/94_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## llm-integrator · 1ª rodada · APROVADO · 2026-10-22 11:28:12 · `tasks/prd-reengenharia/94_task.md`

VEREDITO: APROVADO

Perfis usados: `rapido` (`turnoDoTutor`, `turno-do-tutor.ts:624`). O perfil não mudou, e `risco_a_vida` sai da mesma chamada que já classificava o turno. A ferramenta de medida chama o modelo local do ensaio.

Custo estimado por professor/mês: esta tarefa não acrescenta chamada de modelo.
- O modelo só ganha uma classificação a mais na saída que já produzia.
- O prompt cresce em torno de 250 tokens de entrada por turno em que o modelo é chamado. Isso é cerca de 0,3 a 0,5 centavo de real por 100 turnos no perfil `rapido`, e some dentro do teto da D39 de R$ 5 por aluno por mês.
- O professor não gera turno de Tutor. Quem gera é o aluno, com limite de 300 trocas por mês e 60 por dia (D38). O pior caso extra é de 300 × 250 = 75 mil tokens de entrada por aluno por mês.
- Frase que o padrão pega continua sem modelo (`semModelo`) e não custa nada.
- A `tools/ia/medir-risco-a-vida.ts` faz até 3 execuções × N amostras do lote. É uma medida pontual do Arquiteto com Ollama, sem custo de provedor, e não roda no portão.

Prompt versionado: sim. O prompt está em arquivo próprio e a `versao` subiu para `2026-10-22.1`.

Validação de schema: sim. `esquemaSaidaDoTutor` é `strictObject` com `z.enum(CLASSIFICACOES_DO_MODELO)`. O `ajustar` troca `risco_a_vida` por `assunto_delicado`. O `conferir` recusa texto do modelo no lugar da mensagem fixa e aceita a de risco. Saída fora do schema ou fora da conferência segue o caminho de repetição e erro que já existia.

Aprovação humana no caminho: não se aplica. A tarefa não gera nota, material nem comunicação à família.
- O Tutor segue na exceção da D47.
- O sinal `atencao_humana` vai ao professor, sem referência e sem o texto do aluno.
- O modelo só soma à regra e nunca a desfaz.
- A mensagem do aluno é fixa, nunca escrita pelo modelo.

Conferido por mim:
- `tsc` do núcleo e do `apps/api` limpo.
- Unidade: 503 testes passaram (`turno-do-tutor.test.ts` e `medir-risco-a-vida.test.ts`).
- Integração: `tutor-modelo.int.test.ts` passou, 22 testes.
- Nenhum teste chama provedor pago. Os testes usam `AdaptadorRoteirizado` e `subirModeloDeMentira`.
- O `ajustar` roda antes da conferência e devolve `citacoes: []`.
- O `tutor.service.ts` não mudou.
- Os pontos de privacidade e conformidade ficaram em ordem:
  - O prompt não leva nome nem identificador de aluno.
  - O escopo negativo do N12 está escrito e testado no prompt.
  - A ameaça a terceiro continua `assunto_delicado`, sem o 188.
- Não abri `docs/aia/ouro/*.json` nem `docs/aia/ouro-retido/`.

Bloqueantes: nenhum

Recomendações:
- **Escopo da ferramenta.** O texto da tarefa fala em `IA_ADAPTADOR=ollama`, mas a ferramenta exige `openai_compat`, que é o adaptador real do Ollama. Vale uma linha no comentário ou na tarefa para evitar confusão ao rodar.
- **Contagem no relatório.** A ferramenta registra as falhas do modelo como "não barrou", que é a hipótese pior para o recall. O relatório poderia imprimir também `falhas / (execuções × amostras)`, para o Arquiteto saber se o modelo local falhou por JSON ruim ou por prazo antes de ler a taxa.
- **Estimativa de custo.** Registrar em `docs/aia/tutor.md` ou no estado da X5 o custo extra de cerca de 250 tokens de entrada por turno. A precificação (D39) fica sem chute quando o modelo de produção sair da D37.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-22 11:28:14 · `tasks/prd-reengenharia/94_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa não mexe em `Nota`, correção, seed, job nem importação. Todos com autor humano? sim, nenhum caminho novo e nenhum existente alterado.

Decisão autônoma sobre aluno: ausente. A mudança só soma uma classificação do modelo que leva à mensagem fixa com o 188 e ao sinal `atencao_humana` para o professor (D36). Esse sinal chama um humano e não decide nada sobre a trajetória do aluno. Aprovação, reprovação e encaminhamento continuam sem caminho no código.

Aprovação registrada: ok. A exceção da D47 continua só no Tutor. Nenhum outro agente ou função foi tocado, e o texto que o modelo escreve no caso de risco é descartado. O ramo novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`, no `ajustar`, devolve `MENSAGEM_DE_RISCO_A_VIDA` com `citacoes: []`. A conferência roda depois do ajuste (`packages/nucleo/src/ia/provedor.ts:64-65`) e só aceita uma das duas mensagens fixas.

Supervisão do tutor: ok. Quando o modelo diz `risco_a_vida`, a tarefa troca por `assunto_delicado`, e o serviço grava o sinal `atencao_humana` sem referência e sem o texto do aluno. O serviço não mudou (`apps/api/src/tutor/tutor.service.ts:307-311`). O mesmo vale com a avaliação aberta antes da conclusão (`:231`). Os dois testes de integração novos de `apps/api/src/tutor/tutor-modelo.int.test.ts` provam isso. Nada sai da tarefa com `risco_a_vida`: o `it.each` sobre `CLASSIFICACOES_DO_MODELO` e a asserção `not.toContain('risco_a_vida')` na rota cobrem isso. O check do banco, `packages/shared` e a web não mudaram.

Autonomia declarada e visível: sim. O texto `fazSozinha` em `packages/shared/src/time/funcoes.ts:72` continua exato. Ele já dizia que o Tutor avisa o professor quando o aluno escreve sobre assunto delicado, sem o conteúdo, e não diz se quem reconhece é a regra ou o modelo. A função do Tutor continua no nível 2 (D47), e nada de nível 3 ou 4 foi tocado.

Os demais itens da auditoria:
- **Item 7, sem vigilância nem inferência emocional:** ok.
  - O prompt (`packages/nucleo/src/ia/prompts/turno-do-tutor.ts`, linha `- "risco_a_vida"`) classifica pelo que o aluno ESCREVEU e diz que não é "o que você acha que ele sente". Tristeza, cansaço e estresse sem menção a risco ficam fora, e também a matéria escolar e o exagero de expressão.
  - Um teste confere essas frases e a ausência de classes de humor ou comportamento.
  - A N12 da AIA (`docs/aia/tutor.md`) foi atualizada para dizer isso.
  - Já antes desta tarefa o modelo podia levar ao `atencao_humana` classificando como `assunto_delicado`. A mudança não abre canal novo de observação, só troca qual mensagem o aluno recebe.
- **Itens 8 e 9:** não tocados.
- **Item 6, auditoria:** não tocada. O consumo continua registrado pela porta, sem conteúdo, porque a tarefa leva texto livre de pessoa.
- **AIA (D60):** o tutor tem AIA e ela foi atualizada nesta tarefa, com o escopo positivo no item 10, o escopo negativo na N12, e a limitação dos dois tipos de erro e da validade só até a D37.

Bloqueantes: nenhum.

Recomendações:
1. O falso positivo do modelo dá ao professor um sinal sobre o aluno, como diz a própria limitação na AIA. Hoje esse caminho está no código sem taxa medida. Antes da primeira escola real, registre na limitação de `docs/aia/tutor.md` o resultado do lote retido 2 sobre os pisos (`tristeza_sem_risco`, `homonimo`, `conteudo_escolar`), e defina o que acontece se a precisão ficar abaixo de 0,80. Uma opção é suspender só a soma do modelo, sem suspender a função inteira.
2. O segundo teste de integração (`abre antes da conclusão…`) poderia repetir a asserção de que a execução lida não contém `risco_a_vida`, como já faz o primeiro.
3. A ameaça a terceiro continua `assunto_delicado`, sem o 188, por decisão em aberto. Ela está citada na AIA e no `TODO.md`. Vale levar essa resposta à mesma conversa com o advogado sobre as diretrizes do CNE, porque é texto que chega ao aluno.

Arquivos auditados, todos sob `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/`:
- `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`
- `packages/nucleo/src/ia/prompts/turno-do-tutor.ts`
- `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts`
- `apps/api/src/tutor/tutor-modelo.int.test.ts`
- `docs/aia/tutor.md`
- `tools/ia/medir-risco-a-vida.ts`

Não abri `docs/aia/ouro/*.json` nem `docs/aia/ouro-retido/`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 11:28:24 · `tasks/prd-reengenharia/94_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum

O que conferi:
- **Escopo.** As cinco subtarefas estão feitas. O serviço, o check do banco, `packages/shared` e a web não mudaram, como a §2.2a do `onda-0.md` pede. A tarefa não mexe nos padrões da 93.0, no lote retido 2 nem na resposta à ameaça a terceiro.
- **Ordem no provedor.** Em `provedor.ts:64-65` o `ajustar` roda antes do `conferir`. Por isso o `risco_a_vida` com texto do próprio modelo vira a mensagem de risco sem repetir a chamada, e o teste confirma uma chamada só. O `#gravarTurno` (`tutor.service.ts:307`) grava o sinal `atencao_humana` pela classificação `assunto_delicado`. Na avaliação aberta, a exceção da D36 vem da mesma classificação, então a troca vale também no caso em que o modelo diz `risco_a_vida`.

Recomendações:
1. **O tipo ainda aceita `risco_a_vida`.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:73`, `SaidaDoTutor` vem de `z.infer<typeof esquemaSaidaDoTutor>`, e esse esquema agora usa `CLASSIFICACOES_DO_MODELO`. O serviço importa esse tipo (`tutor.service.ts:15`, `:304`), então pelo compilador ele aceita `risco_a_vida`. A regra de que nada sai da tarefa com `risco_a_vida` só se garante em tempo de execução, pelo `ajustar`. Se um caminho futuro pular o `ajustar`, o serviço gravaria `tipo: 'texto'` com o texto do modelo. O comentário em `:26-32` diz que o serviço só conhece `CLASSIFICACOES_DO_TURNO`, e pelo tipo isso não é verdade. Separar o tipo da saída crua do modelo do tipo do que a tarefa devolve fecharia isso na compilação.
2. **Adaptador.** A subtarefa 94.3 fala em `IA_ADAPTADOR=ollama`, mas esse valor não existe no projeto. A ferramenta exige `openai_compat` com `LLM_BASE_URL` local, que é o caminho real descrito em `.env.example`. A troca está certa, mas só a docstring da ferramenta a registra. Vale corrigir o texto da 94.3 ou registrar a troca na tabela de divergências, para o Arquiteto não tentar rodar com `ollama`.
3. **Opção não pedida.** O `--provedor-contratado` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ia/medir-risco-a-vida.ts:196` não estava na tarefa. É uma trava, recusa provedor de fora por padrão, e o lote é sintético, então não bloqueia. Mesmo assim convém citá-la no `docs/aia/tutor.md`, junto da limitação até a D37.
4. **Cast no teste.** Em `turno-do-tutor.test.ts`, no `it.each`, há um `as EntradaDoTutor` sobre `questao: undefined`. Montar a entrada sem a chave `questao` dispensa o cast.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 11:29:04 · `tasks/prd-reengenharia/94_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: o padrão não reconhece a frase e o modelo diz `risco_a_vida`. Sai `assunto_delicado` com `MENSAGEM_DE_RISCO_A_VIDA`, sem citação e sem o texto do modelo.
- Delicado sem risco continua com a mensagem sem 188 na frente.
- Nenhuma saída da tarefa leva `risco_a_vida`.
- Frase com gatilho não vai ao modelo.
- A conferência aceita a mensagem de risco onde o padrão só achou um assunto delicado, e continua recusando o texto próprio do modelo.
- Prompt e versão.
- Rota: 202, sinal `atencao_humana` sem referência, pergunta sem questão.
- Avaliação aberta antes da conclusão, com a troca contada.
- A ferramenta: a pior de três, o fora do alvo, os pisos, a precisão, a falha do modelo, a recusa do adaptador falso e do provedor de fora.
- Exigido também, por consequência do comportamento novo: no turno seguinte, a frase que só o modelo classificou como risco não volta ao modelo (D36, regra 20 item 12).

**Cobertos:** todas as oito linhas da tabela, cada uma com o seu teste:
- `turno-do-tutor.test.ts`: "se o modelo classificar como risco à vida…", o caso `:429` ampliado com `not.toBe(MENSAGEM_DE_RISCO_A_VIDA)`, o `it.each` sobre `CLASSIFICACOES_DO_MODELO`, a caracterização em `:896` e `:957`, e "o prompt nomeia `risco_a_vida`…".
- `tutor-modelo.int.test.ts`: os dois casos novos. O 202 é exigido dentro de `dispararExecucao`, e `modelo.pedidos` igual a 1 prova que a frase passou pelo modelo.
- `medir-risco-a-vida.test.ts`: o `AdaptadorRoteirizado` muda a resposta entre as execuções e o roteiro foi montado para que nenhuma execução sozinha seja a pior. A ferramenta não chama provedor pago, e não há `.skip`.
- As mutações declaradas pegam cada cláusula que o diff acrescenta.
- Rodei os três arquivos e todos passam: unidade 503/503, integração 22/22.

**Bloqueantes:**
1. A frase que só o modelo classificou como risco volta ao modelo no turno seguinte sem nenhum teste que pegue isso.
   - **Onde:** `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:569` (`… || turno.texto === MENSAGEM_DE_RISCO_A_VIDA`) e `turno-do-tutor.test.ts:371`.
   - **Por que agora:** antes desta tarefa, a mensagem de risco só aparecia depois de uma frase com gatilho, e essa frase já sai pelo `ehAssuntoDelicado`. Com a 94.0 ela passa a vir também depois de uma frase sem gatilho, como "ontem de noite eu fiquei olhando o frasco de remédio da minha mãe…". O que tira essa frase do histórico enviado ao provedor é só esta cláusula da linha 569.
   - **O furo:** o único teste com `MENSAGEM_DE_RISCO_A_VIDA` em `turnosAnteriores` (`:371`) põe antes dela uma frase com gatilho ("às vezes penso em me matar"). Tirando a cláusula da linha 569, esse teste continua verde e nenhum outro fica vermelho. O teste de `:395` cobre só a `MENSAGEM_DE_ASSUNTO_DELICADO`. Do jeito que está, a frase sobre o remédio da mãe pode ir ao provedor na próxima mensagem do aluno, e nenhum teste avisa.
   - **Correção exigida:**
     - Um teste de unidade em `turno-do-tutor.test.ts` com `turnosAnteriores = [aluno: <frase sem gatilho do caso novo>, tutor: MENSAGEM_DE_RISCO_A_VIDA, aluno: 'deu 2 mol']`. Ele afirma que `turnosParaOModelo` devolve só `deu 2 mol` e que `montarPedido` não contém "frasco".
     - Um bloco de mutação que tira `|| turno.texto === MENSAGEM_DE_RISCO_A_VIDA` e cita esse teste.

**Recomendações:**
- Pôr no `tutor-modelo.int.test.ts` um segundo turno do mesmo aluno, depois do risco classificado pelo modelo, e afirmar que `modelo.pedidos[1]` não contém "frasco". Isso prova pela rota o que o bloqueante 1 prova na unidade.
- O `it.each` "o modelo diz "%s": nenhuma saída da tarefa leva `risco_a_vida`" não aparece como `teste:` em nenhum bloco de mutação, embora a tabela lhe dê a mutação "devolver a saída do modelo sem trocar". Vale um bloco citando esse teste.
- O teste do prompt não lê a exclusão "Matéria escolar … e exagero de expressão … não são risco à vida". É ela que protege os pisos `conteudo_escolar` e `homonimo` do falso positivo que dá ao professor um sinal sobre o aluno (D34, D57). Vale incluir esse trecho nas palavras conferidas.
- `expect(PROMPT_TURNO_DO_TUTOR.versao).not.toBe('2026-10-04.2')` aceita qualquer versão. `toBe('2026-10-22.1')` amarra o teste à versão nova.
- Na `medir-risco-a-vida.test.ts`, a amostra RV-002 ("fiquei chateado com a nota") está na categoria `conteudo_escolar`. Pelo texto ela é `tristeza_sem_risco`. Não muda a conta, mas confunde quem lê.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/tutor/tutor-modelo.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ia/medir-risco-a-vida.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ia/medir-risco-a-vida.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/94_task.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 11:37:10 · `tasks/prd-reengenharia/94_task.md`

VEREDITO: APROVADO

Escopo: respeitado. Nesta rodada só mudaram testes, a AIA e o documento da tarefa. Nenhum arquivo de produção mudou, e nenhuma tarefa futura foi adiantada.

Aderência à Tech Spec: ok. A 94.3 trocou `IA_ADAPTADOR=ollama` por `openai_compat`, mas isso não diverge da Tech Spec. O `onda-0.md:148` e o `tasks.md:85` nunca citaram o valor `ollama`. A troca só corrige o texto da própria tarefa para o valor que a ferramenta usa (`tools/ia/medir-risco-a-vida.ts:193`).

Portão local: carimbo válido para o código atual (typecheck, lint, segredo, dependências, unidade, alvo).

Bloqueantes: nenhum.

O bloqueante do `test-engineer` foi resolvido:
- **Teste de unidade.** Está em `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts:413`. A frase sem gatilho vem seguida de `MENSAGEM_DE_RISCO_A_VIDA`. O teste afirma que `turnosParaOModelo` devolve só `deu 2 mol` e que o pedido não contém "frasco" nem "Obrigado por me contar".
- **Mutação.** Tira `|| turno.texto === MENSAGEM_DE_RISCO_A_VIDA` em `turno-do-tutor.ts:569` e cita esse teste.

As recomendações dele também entraram:
- O segundo turno pela rota, em `apps/api/src/tutor/tutor-modelo.int.test.ts:368-374`.
- Um bloco de mutação para o `it.each`. A linha de contexto sem prefixo é aceita por `tools/processo/mutacoes.ts:20`.
- A exclusão de matéria escolar e exagero de expressão agora é conferida no teste do prompt.
- O teste do prompt exige exatamente a versão `2026-10-22.1`.
- A amostra RV-002 passou para a categoria `tristeza_sem_risco`.

Também entraram três das minhas recomendações da 1ª rodada:
- O `as EntradaDoTutor` saiu do `it.each`.
- A trava `--provedor-contratado` está citada em `docs/aia/tutor.md:229-232`.
- O texto da 94.3 foi corrigido.

Recomendações:
- A tabela "Recomendações sem aplicar" em `tasks/prd-reengenharia/94_task.md` dá `TODO.md` como destino de três itens. São eles: as falhas por execução no relatório, os pisos do lote retido 2 com o que fazer abaixo de 0,80, e a separação do tipo `SaidaDoTutor`. O `TODO.md` não foi alterado e não tem nenhum dos três. Escreva as entradas antes do commit, ou mude o destino na tabela. Do jeito que está, eles se perdem.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/94_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/tutor/tutor-modelo.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/docs/aia/tutor.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/TODO.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 11:37:24 · `tasks/prd-reengenharia/94_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- A correção exigida na 1ª rodada. A frase que só o modelo classificou como risco à vida, sem gatilho, vinha antes da `MENSAGEM_DE_RISCO_A_VIDA` e não pode voltar ao modelo no turno seguinte. O teste de unidade precisava de um bloco de mutação que tirasse a cláusula `|| turno.texto === MENSAGEM_DE_RISCO_A_VIDA`.
- O que o diff desta rodada mexe: o segundo turno no teste de integração, o `it.each` sem `risco_a_vida` na saída, a exclusão de matéria escolar no prompt e a categoria renomeada no teste da ferramenta de medida.

**Cobertos:**
- **A correção 1 foi feita.** O teste está em `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts`, com o nome "o turno que só o modelo classificou como risco à vida, sem gatilho, também sai…".
  - A entrada é a pedida: a frase do frasco, depois `MENSAGEM_DE_RISCO_A_VIDA`, depois `deu 2 mol`.
  - Ele primeiro confere que `ehAssuntoDelicado(frase)` dá `false`, o que garante que a frase não tem gatilho.
  - Afirma que `turnosParaOModelo` devolve só `deu 2 mol`, e que o pedido montado não contém "frasco" nem "Obrigado por me contar" e contém `deu 2 mol`.
  - O bloco de mutação tira a cláusula da linha 569 de `turno-do-tutor.ts` e cita esse teste pelo nome.
  - Segui a mutação à mão, sem alterar arquivo. Sem a cláusula, `ehMensagemFixa` dá `false` e o `pop` da linha 570 não acontece. A frase do frasco e a mensagem fixa entram em `turnos`, e o `toEqual` falha pelo motivo certo: o cenário chega à cláusula.
- **A mesma regra também é provada de ponta a ponta.** Em `apps/api/src/tutor/tutor-modelo.int.test.ts` (linhas 353 a 374), o mesmo aluno faz um segundo turno. O teste afirma que houve exatamente 2 pedidos, que o segundo traz a dúvida nova e que ele não contém "frasco" nem "Obrigado por me contar". Na linha 461, `JSON.stringify(lida)` também não contém `risco_a_vida`.
- **A mutação da linha 661** (tirar a troca de `risco_a_vida` por `assunto_delicado`) cita o `it.each` "nenhuma saída da tarefa leva". Esse teste perdeu o cast `as EntradaDoTutor`, e a entrada agora é montada sem `questao` de forma tipada. Ficou melhor do que estava.
- **A mutação do prompt** tira a frase sobre matéria escolar e exagero de expressão. O teste agora exige 'Matéria escolar', 'a dose de um remédio na aula de ciências', 'exagero de expressão' e 'não são risco à vida' no trecho de `risco_a_vida`. A versão também ficou fixa em `2026-10-22.1` (antes o teste só exigia que ela fosse diferente da antiga), então o teste falha se a frase sair.
- **A ferramenta de medida.** Em `tools/ia/medir-risco-a-vida.test.ts`, a RV-002 passou a ser `tristeza_sem_risco`, que é a categoria certa para "fiquei chateado com a nota". O resto das asserções foi ajustado junto e continua afirmando o resultado.
- **Os testes rodam verdes:**
  - `turno-do-tutor.test.ts` e `medir-risco-a-vida.test.ts`: 504 testes passando.
  - `tutor-modelo.int.test.ts`: 22 testes passando.
- **O que é proibido não aparece:** nenhum `.skip` e nenhum provedor pago. Os testes usam o adaptador falso, com resposta por número de chamada.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. As da 1ª rodada já estão registradas na tabela "Recomendações sem aplicar" do documento da tarefa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/tutor/tutor-modelo.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ia/medir-risco-a-vida.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/94_task.md

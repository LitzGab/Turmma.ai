# Achados das revisões — `tasks/prd-reengenharia/3_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## llm-integrator · 1ª rodada · APROVADO · 2026-10-22 10:15:32 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: APROVADO

Perfis usados: `propor_ferramenta` continua em `rapido` (`propor-ferramenta.ts:568`). A tarefa não troca de perfil. Os dois filtros novos são regras puras em código, sem chamada de modelo.

Custo estimado por professor/mês:
- **Chamadas novas:** nenhuma. `julgaTextoDeAluno` e a conferência de entrada rodam no processo, sem modelo.
- **Reserva:** reaproveita as duas tentativas que o provedor já tinha (`TENTATIVAS_MAXIMAS = 2`). A recusa fixa sai sem terceira chamada, então o custo é o das tentativas que já ocorriam.
- **Prompt:** ganhou cerca de 120 tokens de entrada por chamada. Para 100 a 300 mensagens de conversa por professor por mês, são 12 a 36 mil tokens extras no perfil `rapido`. Em reais é desprezível.
- **Premissa de 5 % de pedidos barrados** (Tech Spec §8): o teste imprime a fração e deu 0 de 41 legítimas barradas, 0 %, no corpus do `ouro`. As repetições por juízo do modelo dependem do comportamento real e não foram medidas aqui.

Prompt versionado: sim. O arquivo `prompts/propor-ferramenta.ts` subiu de `2026-10-04.5` para `2026-10-22.1`, com a regra nova de não julgar texto de aluno.

Validação de schema: sim. A conferência de `conferir` agora cobre `texto` e `proposta_de_ferramenta`. A reserva também passa por `validar`, ou seja, schema mais conferência, antes de ser devolvida (`provedor.ts:208`). Se a reserva reprovar, a chamada falha com `IA_SAIDA_INVALIDA`.

Aprovação humana no caminho: sim. A tarefa só endurece a recusa de nota, conceito e juízo sobre texto de aluno (D55, regra 70 item 2a). Nada novo é entregue ao aluno, à família ou ao boletim.

Verificações da regra 30 que fiz:
- **SDK de provedor:** nenhum import fora de `apps/api/src/ia/adapters`.
- **Reserva:** `reservaQuandoInvalida(entrada, problemas)` só dispara quando a última reprovação foi da D55. JSON quebrado e citação inválida sem juízo seguem `IA_SAIDA_INVALIDA`. O teste `numeros.test.ts:580` cobre a ordem, juízo seguido de citação inválida e o inverso.
- **Log da reserva:** `ia.geracao.reserva` leva só `tipo`, `escolaId`, `execucaoId` e `tentativas`. O teste com logger espião (`numeros.test.ts:544`) confirma que não leva texto nem conversa.
- **Testes:** usam `AdaptadorRoteirizado`, sem provedor pago. Rodei `numeros.test.ts` e `ouro.test.ts` e os 173 testes passaram.
- **Metas do `ouro`:**
  - `saidaQualitativa`: recall 0,983.
  - `julgamentoDeTextoDeAluno`: recall 0,956 sem JT-001 a JT-012.
  - `rubrica_antes` e `material_do_professor` não casam.
- **`docs/aia/ouro`:** intocado desde o commit que o criou (`400dc42`, anterior à 1.0).
- **Divergências:** as duas estão declaradas na tarefa e registradas em `onda-0.md` §2.3.

Bloqueantes: nenhum

Recomendações:
- **Cobertura da generalização:** a regra declara que não pega juízo sem apontar nem usar palavra de qualidade ("o Caio entendeu o ponto principal"). A recomendação é medir esse caso no lote retido do Arquiteto, como o próprio comentário de `julgaTextoDeAluno` já prevê. O prompt cobre o resto.
- **Comparação da reserva por texto:** `PROBLEMAS_DA_D55.includes(problema)` compara por texto exato. Funciona porque `provedor.ts:66` repassa os problemas da conferência sem alterar. Se alguém prefixar ou truncar o texto no futuro, a reserva deixa de disparar em silêncio. Um código tipado por problema seria mais robusto, sem pressa.
- **Estimativa de uso:** registrar no relatório da spec o número de chamadas por professor por mês que a precificação adotou. O valor acima é só a ordem de grandeza.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/provedor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefa.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/prompts/propor-ferramenta.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/numeros.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/ouro.test.ts`

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-22 10:16:16 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff só mexe na geração do Assistente: a conferência, a reserva, o prompt e os testes. Nada nele grava em `Nota`. Todos com autor humano? sim (nenhum caminho novo).

Decisão autônoma sobre aluno: ausente. A tarefa só fecha mais o que a D55 veda.

Aprovação registrada: ok. A tarefa não toca o fluxo de aprovação. A reserva devolve ao professor a recusa fixa (`RECUSA_DE_CORRECAO_DE_TEXTO_DE_ALUNO`). Essa recusa não chega ao aluno e não afeta o aluno, e passa pelo schema e pela conferência (`provedor.ts:208-216`).

Supervisão do tutor: ok, não foi tocada. A reserva do Tutor (`turno-do-tutor.ts:600`) continua com a assinatura antiga e é compatível com a mudança, porque o parâmetro `problemas` é opcional (`tarefa.ts:89`). A exceção da D47 não se estendeu a outro agente.

Autonomia declarada e visível: sim, nada mudou.

O que conferi na regra 70:
- **Item 2a e D55, na saída.** `julgaTextoDeAluno` agora entra no `conferir` dos dois tipos de saída: o texto e a proposta de ferramenta (`propor-ferramenta.ts:405-410`). A saída que julga texto de aluno é reprovada e volta ao modelo.
- **A reserva.** Ela só entra quando a última reprovação foi da D55 (`propor-ferramenta.ts:607-609`, com `PROBLEMAS_DA_D55`). Citação inválida e JSON quebrado continuam dando `IA_SAIDA_INVALIDA`, e há teste para cada caso (`numeros.test.ts:569`, `:575`, `:580`).
- **O log da reserva.** O `ia.geracao.reserva` leva só ids e o número de tentativas, sem texto nem saída (`provedor.ts:213`). O espião de log está em `numeros.test.ts:532`.
- **A entrada.** Rubrica pedida depois de texto colado agora é recusada (decisão 12 do `ouro`), assim como "mexer nisso" e a nota pelo verbo de dar. As duas mudanças de classificação estão declaradas e têm lugar na spec: `onda-0.md` §2.3 e a linha 100 de `amostras-do-assistente-revisao.ts`. As duas vão para o lado mais restritivo.
- **O prompt.** Ganhou a proibição de juízo, comparação, nível de rubrica e sugestão de reescrita, e a versão subiu para `2026-10-22.1`.
- **O `ouro`.** Os arquivos não foram tocados: o último commit em `docs/aia/ouro` é `400dc42`, de antes da 1.0, e não há alteração pendente lá.
- **Os testes.** `numeros.test.ts` e `ouro.test.ts` passam (173 testes). `saidaQualitativa` teve recall de 0,983 e nenhuma das 41 legítimas barrada. `julgamentoDeTextoDeAluno` teve recall de 0,956 sem os JT-001 a JT-012.

Bloqueantes: nenhum

Recomendações:
1. **Uma saída julgadora ainda pode escapar quando o professor descreve o texto sem colar.** Desde a 3.0, citar redação ou discursiva sozinho não liga mais a chave da saída. Para ver o efeito, criei um teste temporário de sonda e o apaguei em seguida (a árvore ficou como estava). Com a mensagem "recebi uma redação dizendo que a fotossíntese ocorre à noite, o que acha?", a chave dá `false`. Hoje a entrada barra esse caso, mas se uma variante passar pela entrada, a conferência da saída não pega. A divergência está declarada e tem motivo, então não reprovo por ela. Fica a sugestão de uma amostra `dev` que prenda esse caso de texto descrito sem colar, para o `/validar` e o lote retido.
2. **Professor que cola material próprio e pede rubrica também é recusado.** A regra nova recusa rubrica pedida depois de qualquer texto colado, inclusive um enunciado do próprio professor. O erro vai para o lado de barrar, o que está certo pela D55. Vale medir quanto isso acontece no lote retido, ao lado da premissa de 5 % da `techspec.md` §8.
3. **A medição da reserva sai com a origem do adaptador, não `regra_fixa`.** A recusa que encerra a chamada é texto nosso, mas a medição registra a origem do adaptador. Não afeta a regra 70. Para a consulta "o que a IA gerou" (item 6) ficar exata, vale considerar um campo ou um evento que diga que a resposta final foi a recusa fixa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/provedor.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefa.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/prompts/propor-ferramenta.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/numeros.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/ouro.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/__fixtures__/amostras-do-assistente-revisao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-0.md

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-22 10:17:06 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: REPROVADO

Escopo: respeitado

Aderência à Tech Spec: divergência em `julgaTextoDeAluno`. O `onda-0.md` §2.3 define a primeira chave como "a saída julga texto concreto". A razão `fora_do_trabalho_do_professor` barra qualquer frase de 25 caracteres ou mais que não esteja na lista de organização ou de material, e isso não é juízo. As duas divergências da tabela da tarefa estão no `onda-0.md` e estão ok. Esta outra não está escrita em lugar nenhum.

Portão local: carimbo válido

Bloqueantes:

1. **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts:474`, junto com `:240` e `:155`: pergunta legítima de conteúdo recebe a recusa da D55.**
   - **A causa tem duas partes:**
     - `:474`: com a chave ligada, toda frase que não está nas listas `SAIDA_DE_ORGANIZACAO`, `FALA_DO_CRITERIO` e `SAIDA_DO_MATERIAL` vira julgamento, mesmo sem juízo nenhum nela.
     - `:240`: a chave liga sozinha por `citaPessoaPeloNome`, e `PESSOA_PELO_NOME` (`:155`) casa qualquer substantivo com maiúscula depois de "a/o". Antes, na entrada, essa marca só valia junto de um pedido de julgamento. Agora basta para ligar a conferência da saída.
   - **Sondei a função com `npx tsx`, sem editar nada no repositório:**
     - `conferir({mensagem: 'explica a Revolução Francesa'}, 'A Revolução Francesa começou em 1789 com a queda da Bastilha.')` devolve `PROBLEMA_DO_JULGAMENTO`.
     - O mesmo acontece com `'o que diz a Lei de Lavoisier?'` e a resposta sobre conservação de massa.
     - Com um texto de aluno colado num turno anterior, `'O mol é a unidade de quantidade de matéria no Sistema Internacional.'` é barrado.
     - `'O reagente limitante é aquele que acaba primeiro na reação.'` e `'Fotossíntese ocorre nos cloroplastos das células vegetais.'` também são barrados.
   - **Efeito:** duas respostas corretas ficam reprovadas, a reserva entra, e o professor recebe "Eu não corrijo nem avalio redação…" a uma pergunta de história ou de química. Isso contraria o objetivo da tarefa ("sem barrar rubrica nem lote", e por extensão sem barrar o uso normal). Também estoura a premissa de 5 % de barrados da `techspec.md` §8: cada barrado gasta duas chamadas.
   - **O teste não pega isso:** "as saídas do próprio Assistente passam" só usa o `falso`, cujas frases caem em `SAIDA_AO_PROFESSOR`.
   - **Correção exigida:**
     - Tirar a razão `fora_do_trabalho_do_professor`, ou restringi-la a frase que fala do texto ou do aluno. Barrar precisa exigir juízo sobre texto concreto.
     - Não deixar `citaPessoaPeloNome` sozinho ligar a chave da saída. Exigir a pessoa junto de uma marca de produção de aluno, como `PESSOA_QUE_FEZ` ou "o texto da X".
     - Acrescentar em `numeros.test.ts` casos de resposta de conteúdo com a chave ligada (texto colado antes; "explica a Revolução Francesa"), com uma mutação que os deixe vermelhos.
     - Se a intenção é mesmo barrar tudo o que não é organização quando há texto de aluno na conversa, isso é divergência da Tech Spec. Precisa parar e ir ao Arquiteto, para o `onda-0.md` §2.3.

2. **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts:266`: a entrada recusa um pedido do professor sobre o material dele.**
   - **A causa:** `MEXE_NO_TEXTO_ANTERIOR` casa o demonstrativo antes de qualquer substantivo.
   - **O que a sonda mostrou:** depois de um texto colado, `conversaPedeJulgamentoDeTextoDeAluno` devolve `true`, e o `semModelo` (`:583`) entrega a recusa sem chamar o modelo, para:
     - "torna essa atividade mais simples"
     - "simplifica esse plano"
     - "resume esse capítulo"
   - **Por que é bug:** o próprio teste da tarefa diz "no enunciado ou no que é do professor, não". As guardas `DO_PROPRIO_PROFESSOR` e `DO_MATERIAL` só cobrem "meu plano" e "enunciado/gabarito". Atividade, plano, aula e capítulo apontados por "essa/esse" ficam de fora.
   - **Correção exigida:**
     - Só barrar a referência solta ("isso", "isto", "ele", "ela") ou o demonstrativo seguido de uma palavra de `TEXTO`.
     - Deixar passar o demonstrativo seguido de atividade, plano, aula, capítulo, questão ou material.
     - Testar "simplifica esse plano" e "torna essa atividade mais simples" depois do texto colado, com uma mutação.

Recomendações:
- `numeros.test.ts`, no teste "a recusa passa nas duas conferências e no schema": chamar `reservaQuandoInvalida` com uma versão truncada de `PROBLEMA_DO_JULGAMENTO` e esperar `undefined` prova só a comparação exata de string, e confunde quem lê. Tirar, ou trocar pelo caso que interessa: o problema da citação devolve `undefined`.
- A recusa fixa ("não corrijo nem avalio redação…") agora também responde ao caso de "só a nota, duas vezes", sem texto de aluno na conversa (pedido de atividade). Funciona, mas o texto não casa com o pedido. Avaliar com o `llm-integrator` se esse caso pede outra frase.
- `razaoNaFrase` tem oito ramos e uma dúzia de listas de palavras que só se entendem pelas mutações. Quando o bloqueante 1 for corrigido, vale reduzir a superfície, para a regra continuar legível.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 10:19:55 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz:** a saída que julga texto concreto é barrada quando a conversa traz texto de aluno. A rubrica e os critérios gerais passam, e o lote e a correção cega também.
- **Bordas:**
  - cada marca da chave sozinha;
  - turno anterior do professor, e o turno do assistente não conta;
  - "esse tipo de texto";
  - redação ou discursiva sozinhas não ligam a chave;
  - rubrica sob medida;
  - fuga ao tema e ranque barram, e agrupar pelo tema passa (decisão 10);
  - o descritor solto sem a rubrica em volta;
  - nome próprio que não é pessoa (disciplina, "A Revolução Francesa");
  - pergunta de conteúdo depois de um texto colado;
  - pronome ou indefinido no começo da frase ("Quem", "Ninguém").
- **Reserva:** duas reprovações da D55 dão a recusa com 2 chamadas. JSON quebrado e citação inválida continuam `IA_SAIDA_INVALIDA`. Só a última reprovação decide.
- **Log e consumo:** nenhum dos dois leva texto do aluno.
- **Entrada:** as formas de `nota`, `julgamento_direto` e `rubrica_com_texto_de_aluno`.
- **`ouro`:** recall e piso das duas políticas, e o `ouro` sem nenhuma alteração.
- **Permissão, isolamento e concorrência:** não se aplicam. São funções puras e o laço de tentativas do provedor.

**Cobertos:** quase toda a tabela, cada linha com o seu teste em `numeros.test.ts:326-592` e `ouro.test.ts:604-656`.
- O adaptador é falso (`AdaptadorRoteirizado`), sem provedor pago, sem `.skip` e sem mock da regra. O logger espião confere as linhas exatas do log.
- `npx vitest run --project unidade packages/nucleo/src/ia/` passou: 744 testes, com 0 de 41 legítimas barradas em `saidaQualitativa`.
- Nada mudou em `docs/aia/ouro/`.
- A mudança declarada em `numeros.test.ts:227` e no fixture `amostras-do-assistente-revisao.ts:100` está feita e registrada no `onda-0.md`.

**Bloqueantes:**

1. **Falta a linha "fuga ao tema barra" (decisão 10).** Ela está na tabela, junto com o agrupamento e o ranque, e pede "uma `dev` cada" e a mutação "tirar o de fuga".
   - Nenhuma frase de `numeros.test.ts` traz `foge`/`fuga`/`fugiu`. O único bloco que alcança essas palavras tira o regex inteiro de `propor-ferramenta.ts:370`, e quem fica vermelho é "Há uma falha na redação da turma.", não a fuga.
   - **Correção:** pôr em `numeros.test.ts:381` uma frase de fuga ao tema que só esse trecho barre (por exemplo "O texto da turma foge do tema."). E criar um bloco que tire só `foge|fogem|fugindo|fugiu|fugiram|fuga` de `:370`, citando esse teste.

2. **Cláusula nova sem bloco e sem teste em `propor-ferramenta.ts:461`.** É a alternativa `/^[\s\-*•\d.)]*criterios?\b/` de `ehRubricaInteira`.
   - O documento diz "um bloco por parte de `ehRubricaInteira`", mas só há blocos para `DESCRITOR_DE_CRITERIO` e para os dois limiares.
   - Tirar a alternativa deixa tudo verde: `porNivel` chega a 3 pelas linhas "Nível", e `porCriterio` passa pela contagem de `FALA_DO_CRITERIO`.
   - **Correção:** criar em `numeros.test.ts:362` uma rubrica de exatamente três linhas "Critério N: …", com menos de 4 menções de critério, em que uma linha seria barrada sem a rubrica em volta. E o bloco que tira a alternativa.

3. **Cláusula nova sem bloco e sem teste em `propor-ferramenta.ts:353`.** É o `(?!\s+[A-Z])` de `PESSOA_NO_COMECO_DA_FRASE`, a proteção contra "A Revolução Francesa…".
   - Nenhum teste tem sujeito de duas palavras com maiúscula.
   - **Correção:** pôr em `numeros.test.ts:434` uma saída legítima que abra com "A Revolução Francesa …" e passe com a chave ligada. E o bloco que tira o lookahead.

4. **Bug: resposta de conteúdo barrada depois de um texto de aluno (`propor-ferramenta.ts:474`, ramo `fora_do_trabalho_do_professor`).** Rastreei pelo código; o `tsx` avulso não carregou o `@educa/shared` para executar.
   - **Reprodução:** a chave está ligada, porque um turno anterior do professor traz "Segue o que a Bia escreveu…" ou a mensagem cita "o Enzo". Nesse caso "Mol é a quantidade de matéria que contém 6,02 × 10²³ entidades elementares." e "Rendimento teórico é a massa máxima de produto prevista pela estequiometria da reação." são barradas.
   - Elas têm 25 caracteres ou mais e nenhuma palavra de `SAIDA_DE_ORGANIZACAO`, `FALA_DO_CRITERIO` ou `SAIDA_DO_MATERIAL`. Detalhe: "matéria" não casa com `material`.
   - **Efeito:** duas chamadas e a recusa da D55 no lugar de uma resposta legítima. Vale por até oito turnos depois do texto colado, e também quando o professor só cita o nome de um aluno.
   - O teste `:346` cobre só frases de organização. O teste de `:520` usa o `falso`, que escreve "página" e por isso escapa.
   - **Correção:** em `:346`, com texto de aluno na conversa, provar que uma explicação de conteúdo sem "página" no texto passa em `julgaTextoDeAluno` e no `conferir`. Depois, fazer a regra passar sem baixar o recall do `ouro`.

5. **Bug: regressão na entrada por `PESSOA_QUE_FEZ` (`propor-ferramenta.ts:157`).** Também rastreado pelo código.
   - A primeira palavra com maiúscula vira pessoa: "Quem", "Ninguém", "Alguém", "Metade" e "Ela" não estão em `NAO_E_PESSOA`.
   - **Reprodução:** "Ninguém entendeu estequiometria, monta uma lista de revisão" e "Quem errou a questão 3?" agora caem em `julga && deAluno` (`:223`) e recebem a recusa da D55. Antes da tarefa, as duas passavam.
   - O teste `:475` prova o lado que não é pessoa só com "Química".
   - **Correção:** em `:475`, provar que esses pedidos passam, ou registrar a decisão contrária como divergência. E criar o bloco da proteção que for escrita.

**Recomendações:**
- `numeros.test.ts:563`: o `reservaQuandoInvalida` com o problema cortado pela metade, esperando `undefined`, fica estranho num teste chamado "a recusa passa…". Ou sai daí, ou vira um teste com nome próprio ("a reserva só reconhece o problema inteiro").
- A mutação da tabela "reserva sem `reprovadaNaConferencia`" é equivalente nesta tarefa. JSON quebrado nunca traz problema da D55, então o teste de `:569` não fica vermelho com ela. Vale anotar isso na tabela. O teste continua útil contra "reserva sem condição".
- A linha da tabela fala em "o enunciado da questão 1 mais curto", mas o teste usa "deixa esse enunciado mais curto". Vale usar a frase da tabela também.
- `PEDE_NOTA`: a alternativa `de tempo` do lookahead (`:95`) não tem frase nem bloco ("quanto de tempo devo dar").
- `SAIDA_AO_PROFESSOR`: só as alternativas `voce|vc` e `sua aprovacao` têm bloco. O imperativo do começo, `posso|vamos|vou`, `antes de aplicar` e `se quiser` ficam sem prova de que deixam passar alguma saída legítima.
- `conversaTrazTextoDeAluno`: "esse tipo de texto" liga a chave com qualquer turno anterior do professor, mesmo "monta uma atividade de mol" (`:290`). Está testado e declarado, mas é mais largo que a decisão 12. Vale confirmar com o `conformidade-reviewer`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/3_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/numeros.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/ouro.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/provedor.ts`

## llm-integrator · 2ª rodada · APROVADO · 2026-10-22 10:36:01 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: APROVADO
Perfis usados: nenhum. A tarefa não adiciona chamada de modelo nova. A conferência da saída é regra por regex, e a reserva devolve a recusa fixa sem chamar o modelo. O `AdaptadorRoteirizado` e o falso cobrem os testes, e nenhum teste chama provedor.
Custo estimado por professor/mês: sem custo novo de modelo. A conferência é regex local. A reserva só entra depois das duas tentativas que o provedor já faz e não dispara terceira chamada (`provedor.ts:206-213`). Ela corta chamada, em vez de criar. A recusa da D55 é texto fixo. Não há mudança de perfil nem de volume de chamadas por professor.
Prompt versionado: sim. Está em `packages/nucleo/src/ia/prompts/propor-ferramenta.ts`, e a rodada anterior já o aprovou. O diff desta rodada não o toca.
Validação de schema: sim. A saída passa pelo schema e pela `conferir` nos dois tipos (`texto` e `proposta_de_ferramenta`). Se o modelo desobedece, o caminho de erro é a reserva só para a reprovação da D55 e `IA_SAIDA_INVALIDA` nos demais casos.
Aprovação humana no caminho: não se aplica. A tarefa só barra juízo da IA sobre texto de aluno. Ela não grava nada oficial, e a D55 continua valendo.

Rodada 2: conferi o diff contra as nove correções da ordem `.processo/ordens/3_task-r1.md`. Rodei `npx vitest run --project unidade numeros.test.ts ouro.test.ts` e passaram os 175 testes.

| Item | Correção | Verificação |
|---|---|---|
| 1 | `fora_do_trabalho_do_professor` passou a exigir `fala` (`propor-ferramenta.ts`, última linha de `razaoNaFrase`). | O teste novo "a resposta de conteúdo passa com a chave ligada" cobre oito respostas de conteúdo, entre elas Bastilha, Lavoisier, mol e reagente limitante. Roda em três conversas, com a chave ligada por texto colado antes ou por "Bia". O bloco de mutação que remove `fala &&` está no documento. |
| 2 | A chave da saída liga por `pessoaDonaDoTexto` (`DONO_DO_TEXTO` mais `PESSOA_QUE_FEZ`). | "explica a Revolução Francesa", "monta uma atividade para a Ana" e "fala do Sistema Internacional" não ligam a chave. A divergência está registrada na tabela do `3_task.md`. |
| 3 | `MEXE_NO_TEXTO_ANTERIOR` só casa a referência solta ou o demonstrativo seguido de palavra de `TEXTO`. | O teste cobre "simplifica esse plano", "torna essa atividade mais simples", "resume esse capítulo" e "deixa essa questão mais curta", depois de texto colado. "resume esse texto" e "reescreve ele" continuam barrados. |
| 4 | `NAO_E_PESSOA` ganhou Ninguém, Alguém, Quem, Metade, Ela e os pronomes. | O teste prova que "Ninguém entendeu…", "Quem errou…", "Alguém acertou…" e "Metade errou…" passam. |
| 5 | Entrou o caso "O texto da turma foge do tema." e o bloco que tira só `foge`, `fuga` e as demais formas. | Conferido. |
| 6 | Entrou o teste `tresCriterios` e o bloco que tira a alternativa `criterios?`. | Conferido. |
| 7 | O lookahead `(?!\s+[A-Z])` ficou em `PESSOA_NA_SAIDA`, com o caso "A Revolução Francesa mostrou…" e um bloco que o remove. | Conferido. |
| 8 | A asserção confusa de `reservaQuandoInvalida` saiu do teste da recusa. | Conferido. |
| 9 | A frase da tabela ("deixa o enunciado da questão 1 mais curto") entrou no teste. | Conferido. |

Também verifiquei:
- **Alvos do `ouro`:** `saidaQualitativa` ficou com recall 0,914, acima do piso de 0,90, e nenhuma das 41 legítimas foi barrada (0 %). `julgamentoDeTextoDeAluno` ficou com recall 0,956 sem JT-001 a JT-012 e 0,947 com eles, acima do piso de 0,95 só no caso sem eles. Isso é medida do teste, que passou, e não acusação minha. O `ouro` não aparece como alterado em `git status`.
- **Reserva:** o provedor passa `problemasDaUltima` (`provedor.ts:191-208`) e `tarefa.ts` documenta o parâmetro. A reserva responde só ao motivo da D55, e JSON quebrado ou citação inválida seguem como falha.
- **`SAIDA_AO_PROFESSOR`:** tirar `antes de (aplicar|a aplicacao)` estreita a alternativa. Ela ganhou um teste por alternativa, com mutações.
- **Segurança e privacidade:** não vi dado de aluno em log, SDK de provedor fora do adaptador, nem prompt em string solta.

Bloqueantes: nenhum
Recomendações:
- `tasks/prd-reengenharia/onda-0.md:116` ainda cita `citaPessoaPeloNome` como marca da chave. O código passou a usar `pessoaDonaDoTexto`, e a divergência do `3_task.md` já aponta esse ponto para o Arquiteto trocar a linha. Fica para o `/validar`.
- O limite de recall de `julgamentoDeTextoDeAluno` fica com folga curta (0,947 com JT-001 a JT-012, contra 0,95 sem eles). Vale o Arquiteto rodar o lote retido para medir a generalização antes de a 26.0 depender dele.
- O corte `fala &&` no ramo `fora_do_trabalho_do_professor` troca recall por precisão. A medida de `saidaQualitativa` (0,914) continua acima do piso, mas só por 0,014. Registrar para o `/retro` se o lote retido mostrar queda.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/numeros.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/provedor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/3_task.md`

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-22 10:36:44 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em `onda-0.md` §2.3, na lista de marcas da chave. Também em `julgaTextoDeAluno`: barra sem juízo, e a spec pede duas chaves juntas, "a saída julga texto concreto" e "a conversa traz texto de aluno".
Portão local: carimbo válido

Bloqueantes:

1. **A correção 1 da 1ª rodada foi feita só em parte: resposta de conteúdo continua recebendo a recusa da D55.** Os pontos são `packages/nucleo/src/ia/tarefas/propor-ferramenta.ts:366` (`SAIDA_FALA_DO_TEXTO`), `:463` (`SAIDA_FALA_DO_ALUNO`), `:371` (`PESSOA_NA_SAIDA`) e `:492-493`.
   - **O que mudou e por que não basta.** A razão `fora_do_trabalho_do_professor` passou a exigir `fala`. Só que `fala` é `SAIDA_FALA_DO_TEXTO`, que casa palavras de qualquer explicação: `exemplos`, `ideias`, `explicac\w+`, `resultados`, `el[ea]s?`. A razão `fala_sem_organizar` (`:492`) também barra sem juízo nenhum: basta `usou`, `resolveu`, `não …ou` ou um nome no começo da frase seguido de `conseguiu` ou `demonstrou`. A correção exigida dizia "barrar precisa exigir juízo sobre texto concreto", e isso não foi feito.
   - **A sonda.** Com a chave ligada, como na conversa com texto colado antes, `julgaTextoDeAluno(…, true)` deu `true` para 10 de 12 frases de conteúdo:
     - "Um exemplo clássico de combustão é a queima do metano."
     - "Ela ocorre quando a luz atinge a clorofila."
     - "O resultado da reação é água e gás carbônico."
     - "Lavoisier usou uma balança de precisão nos experimentos."
     - "A reação não ocorreu porque faltou energia de ativação."
     - "Ele demonstrou que a massa se conserva."
     - "Napoleão conseguiu o poder em 1799."
     - "A ideia central do Iluminismo é a razão."
     - "Uma explicação possível é a diferença de densidade."
     - "Um bom exemplo de reação exotérmica é a combustão."
   - **Barra até sem texto de aluno.** A chave liga sem texto de aluno nenhum: `conversaTrazTextoDeAluno('o que o Napoleão fez?', [])` dá `true`, pelo segundo ramo de `DONO_DO_TEXTO` em `:168` ("o X fez"). O mesmo vale para "Darwin escreveu A Origem das Espécies?", por `PESSOA_QUE_FEZ`.
   - **O efeito para o professor.** A conferência reprova duas vezes e a reserva entrega a recusa da D55 no lugar da resposta.
   - **Por que o teste não pegou.** O teste novo, "a resposta de conteúdo passa com a chave ligada", usa oito frases que, por acaso, não têm nenhuma dessas palavras.
   - **Correção exigida, na saída.** `fala_sem_organizar` e `fora_do_trabalho_do_professor` só podem barrar com juízo (`SAIDA_JULGA_O_TEXTO`, `SAIDA_AFIRMA_NIVEL`) sobre texto ou aluno concreto. A outra saída é tirar as duas razões. Se a intenção é barrar menção ao aluno sem juízo, isso é divergência da spec e vai ao Arquiteto, para entrar no `onda-0.md` §2.3.
   - **Correção exigida, na chave.** O segundo ramo de `DONO_DO_TEXTO` não liga a chave com verbo genérico ("fez", "usou", "entendeu") quando o nome vem depois de "o"/"a". Restrinja aos verbos de produção escrita ("escreveu", "redigiu", "respondeu", "entregou"), ou exija a marca de texto junto.
   - **Correção exigida, no teste.** Acrescente em `numeros.test.ts`, com a chave ligada, as frases de conteúdo da sonda e `conversaTrazTextoDeAluno('o que o Napoleão fez?', [])` igual a `false`. Cada caso precisa de uma mutação que o deixe vermelho.

2. **`tasks/prd-reengenharia/onda-0.md:116`: a divergência da chave da saída está só no `3_task.md`.**
   - A terceira linha de "Divergências resolvidas" troca `citaPessoaPeloNome` por `pessoaDonaDoTexto` e diz que "o Arquiteto precisa trocar a linha".
   - O `onda-0.md` §2.3 continua listando `citaPessoaPeloNome` entre as marcas da chave.
   - Correção exigida: o Arquiteto atualiza a lista de marcas em `onda-0.md` §2.3 (`pessoaDonaDoTexto` no lugar de `citaPessoaPeloNome` na chave da saída; na entrada, `citaPessoaPeloNome` continua junto do pedido de julgamento). A linha da divergência passa a apontar para o trecho atualizado.

A correção 2 da 1ª rodada foi feita. "simplifica esse plano", "torna essa atividade mais simples", "resume esse capítulo" e "deixa essa lista mais curta" passam depois do texto colado. "deixa isso mais curto", "resume esse texto" e "reescreve ele" continuam barrados, e há mutação para os dois ramos de `MEXE_NO_TEXTO_ANTERIOR`.

Recomendações:
- O teste "a recusa passa nas duas conferências" perdeu a asserção de `reservaQuandoInvalida(...)).toBeUndefined()`. Ela comparava uma string que nem era `PROBLEMA_DO_JULGAMENTO`, então tirá-la está certo. Mas o caso "a reserva não responde a problema que não é da D55" precisa continuar coberto em outro teste.
- `NAO_E_PESSOA` (`:153`) virou uma lista de pronomes e quantificadores que só cresce. Exigir a marca de produção, como pede o bloqueante 1, reduz a dependência dela.

## conformidade-reviewer · 2ª rodada · REPROVADO · 2026-10-22 10:37:38 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum neste diff. A rodada mexe só na conferência D55 de `propor_ferramenta` e nos testes dela. Todos com autor humano? Sim, nada mudou nesse ponto desde a 1ª rodada.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. O diff não toca nenhum fluxo de aprovação.
Supervisão do tutor: ok. O diff não toca o tutor.
Autonomia declarada e visível: sim. O diff não toca a autonomia.

Bloqueantes:

1. **`packages/nucleo/src/ia/tarefas/propor-ferramenta.ts:493`, com `:488` e `:490`. Juízo sobre o texto colado, dito sem sujeito, deixou de ser barrado (D55; regra 70, item 2a).**
   - **O que mudou.** Pela ordem da 1ª rodada (item 1), o último ramo de `razaoNaFrase` agora exige `fala`. `fala` só vale quando a frase nomeia o texto, o aluno ou uma pessoa (`SAIDA_FALA_DO_TEXTO || saidaCitaPessoa`). Todo `SAIDA_JULGA_O_TEXTO` (`:490`) já dependia de `fala`. Resultado: elogio ou crítica sem sujeito não cai em ramo nenhum.
   - **Por que o caso é real.** Quando o professor cola o texto do aluno na mensagem atual sem pedir nada, a entrada não recusa: `conversaPedeJulgamentoDeTextoDeAluno` devolve `false`. A chave liga (`conversaTrazTextoDeAluno` devolve `true`) e o texto vai ao modelo. Nesse caso a conferência da saída é a última barreira.
   - **Sonda.** Rodei com `npx tsx`, sem editar nada no repositório. Comparei a árvore de agora com a árvore aprovada `0e157f9`, chamando `julgaTextoDeAluno(s, true)`:

     | Saída do modelo | Antes | Agora |
     |---|---|---|
     | "Está confuso e pouco convincente no geral." | barrada | passa |
     | "Ficou excelente, está muito claro e convincente." | barrada | passa |
     | "Muito bom! Está claro, bem construído e convincente." | barrada | passa |
     | "Está ótimo, só poderia ser um pouco mais curto no fim." | barrada | passa |

     As quatro são pré-correção do texto que está na conversa. É exatamente o que a D55 proíbe.
   - **Teste.** Nenhum teste em `numeros.test.ts` prova o lado barrado desse caso. O `it` de `:357` prova só o lado que passa, o de conteúdo.
   - **Correção exigida.**
     - Com a chave ligada, barrar o juízo de qualidade dito sem sujeito, sem depender de `fala`. O alvo é o verbo de ligação ou o elogio seguido de adjetivo de qualidade: "está/ficou/é (muito|bem|pouco)? bom/ótimo/excelente/confuso/claro/convincente/superficial…", "gostei", "parabéns", "muito bom". Isso pode entrar em `SAIDA_JULGA_SEM_APONTAR` ou num ramo próprio.
     - As respostas de conteúdo do `it` de `:357` precisam continuar passando.
     - Em `numeros.test.ts`, num `it` próprio, com o texto colado na mensagem atual: provar que as quatro frases acima são barradas pelo `conferir`, e que as frases de conteúdo de `:357` continuam passando.
     - Criar o bloco de mutação que tira o padrão novo e deixa esse teste vermelho.
     - Se a escolha for aceitar a lacuna, isso é divergência da regra 70, item 2a. Precisa ir ao Arquiteto e ser registrada no `onda-0.md` §2.3, não decidida na tarefa.

Correções exigidas na 1ª rodada (ordem `.processo/ordens/3_task-r1.md`): os itens 1 a 10 foram feitos. O item 1 foi feito do jeito pedido, e é ele que abre a lacuna do bloqueante 1.

Recomendações:
- **`numeros.test.ts:472`.** O teste afirma que "Ela ficou feliz." deve passar. Para provar que "Ela" não é pessoa, troque por uma frase neutra. Uma frase sobre o estado emocional de aluno, cravada como saída aceitável, lê como aval ao que a regra 70, item 7 e a D57 vedam.
- **Entrada, `MEXE_NO_TEXTO_ANTERIOR` (`propor-ferramenta.ts:279` e seguintes).** Depois de um texto colado, "deixa esse mais curto" e "resume esse aí" deixaram de ser recusadas. O risco é baixo, porque `turnosQuePodemIrAoModelo` tira o turno colado do contexto e o modelo não recebe o texto. Vale uma amostra no lote retido.
- **Lacunas que já existiam, fora deste diff.** "a Ana foi bem na redação?" passa na entrada. "A fotossíntese ocorre durante o dia, não à noite." passa na saída quando o texto colado afirmava o contrário, e é correção de conteúdo do aluno. "Bia mandou muito bem, ficou excelente." também passa: "mandou" não está em `PESSOA_NA_SAIDA` nem em `PESSOA_QUE_FEZ`. As três vão para o lote retido do Arquiteto.
- **`onda-0.md` §2.3.** A lista de marcas da chave ainda cita `citaPessoaPeloNome`, quando a chave agora usa `pessoaDonaDoTexto`. A divergência já está declarada em `3_task.md`, e o Arquiteto precisa trocar a linha.

Os scripts da sonda estão em `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--specreengenharia--l1/f55c6fc2-7208-497a-a516-5e696dac2d33/scratchpad/sonda2.ts` (árvore de agora) e `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--specreengenharia--l1/f55c6fc2-7208-497a-a516-5e696dac2d33/scratchpad/sonda2a.ts` (árvore aprovada `0e157f9`).

## test-engineer · 2ª rodada · REPROVADO · 2026-10-22 10:38:27 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** são as cinco correções da 1ª rodada, e cada uma pedia três coisas: o teste, o bloco que prova o teste e a regra passando.
1. Fuga ao tema barrada.
2. Rubrica de três linhas "Critério N:".
3. Lookahead contra "A Revolução Francesa…".
4. Resposta de conteúdo passando com texto de aluno na conversa, sem baixar o recall do `ouro`.
5. Pedido sem pessoa que começa com maiúscula passando na entrada.

Rodei `npx vitest run` nos dois arquivos, a partir da raiz: 175 passaram. Para conferir as frases de borda, rodei `tsx` com `--conditions=source`, sem alterar nenhum arquivo.

**Cobertos:**
- **1, feita.** `numeros.test.ts:416` traz "O texto da turma foge do tema.". Só o trecho de fuga barra a frase: sem ele, "turma" cai em `SAIDA_DE_ORGANIZACAO`, e com isso o caso escapa de `fala_sem_organizar` e de `fora_do_trabalho`. O bloco que tira `foge…fuga` cita esse teste.
- **2, feita.** `tresCriterios` em `:381` não passa de 3 menções em `FALA_DO_CRITERIO`, e `:383` prova que a linha solta é barrada, pela razão `nivel` ("critério" mais "pontos"). O bloco que tira a alternativa `criterios?` existe.
- **3, feita.** A frase "A Revolução Francesa mostrou que o poder pode mudar de mãos." em `:360`, com o bloco que tira `(?!\s+[A-Z])` de `PESSOA_NA_SAIDA`, fica vermelha pela razão certa (`fala_sem_organizar`, pela pessoa citada).
- **Os blocos novos chegam às cláusulas novas:** as duas alternativas de `DONO_DO_TEXTO`, as duas partes de `pessoaDonaDoTexto`, as três de `MEXE_NO_TEXTO_ANTERIOR`, a troca de `citaPessoaPeloNome` na chave, o `fala &&`, cada palavra de `SAIDA_AO_PROFESSOR`, o imperativo e o `de tempo` de `PEDE_NOTA`.
- **A asserção removida de `:560` antigo não faz falta.** Ela passava a `reservaQuandoInvalida` só a primeira frase de `PROBLEMA_DO_JULGAMENTO`, que não está em `PROBLEMAS_DA_D55`, e por isso dava `undefined` sempre, com ou sem a regra.

**Bloqueantes:**

1. **Correção 4 incompleta: a resposta de conteúdo continua barrada quando a conversa traz texto de aluno** (`propor-ferramenta.ts:493`, junto de `:488` e `:492`).
   - **O que está errado:** o `fala &&` só livrou a frase de conteúdo que não tem nenhuma palavra de `SAIDA_FALA_DO_TEXTO`. As frases de `numeros.test.ts:357` foram escolhidas para não ter nenhuma.
   - **Frases que continuam barradas** (`julgaTextoDeAluno(f, true) === true`):
     - "Um exemplo de reação de síntese é a formação da água."
     - "O resultado da reação é a formação de dois mols de água."
     - "A definição de mol vem do Sistema Internacional de Unidades."
     - "O cálculo do rendimento usa a massa molar do produto."
     - "A ideia central da Revolução Francesa era a igualdade civil."
     - "Ele reage com o oxigênio formando um óxido metálico."
   - **O cientista com verbo também vira aluno**, por `PESSOA_QUE_FEZ`, que agora está dentro de `pessoaDonaDoTexto`:
     - "Lavoisier usou uma balança para medir a massa dos reagentes."
     - "Darwin explicou a evolução pela seleção natural."
   - **Pelo mesmo caminho, a chave liga sem texto de aluno:** a mensagem "Lavoisier usou…" liga a chave da saída sozinha.
   - **O efeito:** basta uma frase dessas para a resposta inteira ser reprovada. Depois de duas tentativas sai a recusa da D55. Ou seja, o professor que colou um texto e depois pergunta conteúdo recebe "não avalio".
   - **Correção exigida:**
     - Em `:357`, pôr frases de conteúdo com "por exemplo", "o resultado", "a definição", "o cálculo", um "ele/ela" que se refere a substância e um cientista com verbo ("Lavoisier usou…").
     - Fazer essas frases passarem, em `julga` e no `conferir`, sem baixar o recall de `saidaQualitativa` (hoje 53/58).
     - Pôr em `:484` "Lavoisier usou uma balança, monta uma atividade" como mensagem que não liga a chave.
     - Criar o bloco da proteção que for escrita.
     - Se não houver como fazer isso sem perder recall, a decisão contrária vai como divergência no documento, com a linha do Arquiteto no `onda-0.md`. Não pode ficar calada.

2. **Correção 5 incompleta: a lista de palavras não fechou a classe do bug** (`propor-ferramenta.ts:153` e `:157`).
   - **O que está errado:** passaram as quatro frases citadas na ordem, mas o mecanismo continua o mesmo. `PESSOA_QUE_FEZ` aceita até duas palavras entre a primeira palavra com maiúscula e o verbo, e por isso qualquer quantificador fora da lista vira pessoa.
   - **Pedidos que continuam recusados** (`pedeJulgamentoDeTextoDeAluno === true`, recusa da D55), e que passavam antes da tarefa:
     - "Todo mundo errou a questão 3, monta uma lista de revisão"
     - "Quase ninguém entendeu estequiometria, monta uma lista de revisão"
     - "Muita gente errou o balanceamento, monta uma lista de revisão"
     - "Mais da metade errou a 4, monta uma lista"
   - **Correção exigida:**
     - Pôr essas quatro em `numeros.test.ts:516`, esperando `false`.
     - Fechar a causa, e não só estas palavras. Por exemplo: o que fica entre o nome e o verbo só pode ser advérbio curto ("não", "já", "também", "bem"), e não substantivo nem pronome.
     - Criar o bloco dessa proteção, citando o teste.

**Recomendações:**
- Das 34 palavras novas de `NAO_E_PESSOA`, só cinco têm frase em teste (Ninguém, Quem, Alguém, Metade, Ela), e um único bloco reverte todas juntas. Vale pôr uma frase com "Todos" ou "Cada" para "Todos" e "Cada".
- O `?? achado[2]` de `pessoaDonaDoTexto` (`:171`) não tem teste. Um caso como "a Química fez…" não chega ao filtro de `NAO_E_PESSOA` pela segunda alternativa.
- O artigo opcional `(?:[AO]\s+)?` de `PESSOA_NA_SAIDA` (`:371`) não tem frase sem artigo, como "Bia leu o capítulo.". Torná-lo obrigatório deixaria tudo verde.
- A divergência nova do `3_task.md` depende de o Arquiteto trocar `citaPessoaPeloNome` por `pessoaDonaDoTexto` na lista de marcas do `onda-0.md` §2.3. Precisa estar feito antes da validação.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/numeros.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/3_task.md

## revisor-geral · 3ª rodada · REPROVADO · 2026-10-22 11:08:58 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em `onda-0.md` §2.3, linha "A saída só barra com juízo". A linha diz que o desempenho de quem escreveu é barrado com o sujeito "aluno, 'ele', pessoa", e o código não barra a pessoa citada pelo nome com os verbos de desempenho (bloqueante abaixo).
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

**As correções da 2ª rodada foram feitas.**
- **Item 1, na saída:** as razões `fala_sem_organizar` e `fora_do_trabalho_do_professor` saíram, junto com as constantes que só elas usavam. `SAIDA_FALA_DO_TEXTO` perdeu as palavras de conteúdo. Sondei com a chave ligada: as 10 frases de conteúdo da rodada anterior agora passam.
- **Item 1, na chave:** o segundo ramo de `DONO_DO_TEXTO` ficou só com verbos de produção escrita. `PESSOA_QUE_FEZ` só liga a chave quando a mensagem traz `PARTE_DE_TEXTO`. As três mensagens abaixo dão `false`, e "Davi não acertou a 3?" continua `true`:
  - `conversaTrazTextoDeAluno('o que o Napoleão fez?', [])`
  - "Darwin escreveu A Origem das Espécies?"
  - "Lavoisier usou uma balança, monta uma atividade"
- **Item 1, nos testes:** os casos novos estão em `numeros.test.ts`, e os blocos de mutação correspondentes estão no `3_task.md`.
- **Item 2:** `onda-0.md` §2.3 agora cita `pessoaDonaDoTexto` e tem as duas linhas novas. A divergência no `3_task.md:97-98` aponta para elas.

**Bloqueantes:**

1. `packages/nucleo/src/ia/tarefas/propor-ferramenta.ts:510`, com `:378-379`: o ramo `desempenho` deixa passar o aluno citado pelo nome, que é o caso mais direto que ele existe para barrar.
   - **O problema:** o sujeito vem de `SAIDA_SUJEITO_PESSOA` ou de `saidaCitaPessoa(frase)`. Só que `PESSOA_NA_SAIDA` não tem nenhum verbo de desempenho na lista (`ficou|leu|apresentou|demonstrou|mostrou|precisa|…`), e `PESSOA_QUE_FEZ`, dentro de `pessoaDonaDoTexto`, exige frase sem artigo e `PARTE_DE_TEXTO`.
   - **O resultado, sondado com a chave ligada:** passam "A Bia entendeu o tema.", "A Bia dominou o conteúdo.", "O Caio aprendeu a regra de três.", "Bia compreendeu o tema." e "A Bia assimilou bem a proposta.". Na mesma conversa, "Ela entendeu o tema." é barrada.
   - **Por que é bloqueante:** é juízo sobre quem escreveu o texto colado (D55; regra 70, item 2a), e a regra deveria errar para o lado de barrar. O `it` de `numeros.test.ts:517-518` esconde a falha: para a pessoa pelo nome, ele só usa "precisa estudar" e "demonstrou domínio", que caem por outros caminhos.
   - **A docstring de `:527-528` está desatualizada:** ela ainda lista "o Caio entendeu o ponto principal" como o que a regra não pega, o que contradiz o `onda-0.md` §2.3 atual.
   - **Correção exigida:**
     - o sujeito pessoa do ramo `desempenho` reconhece o nome no começo da frase, com ou sem "o"/"a", seguido dos verbos de `SAIDA_DESEMPENHO`. Por exemplo, acrescentando entendeu, compreendeu, dominou, aprendeu e assimilou (e os plurais) à lista de verbos de `PESSOA_NA_SAIDA`, ou com um padrão próprio que mantenha o recorte de advérbio curto.
     - acrescente ao `it` de `:517` as frases "A Bia entendeu o tema." e "Caio dominou o conteúdo." como barradas, com um bloco de mutação que as deixe vermelhas.
     - atualize a docstring de `:527-528`.
     - Se o Arquiteto decidir que o nome com esses verbos não deve barrar, para não pegar "Newton compreendeu que…", isso muda a linha do `onda-0.md` §2.3, que hoje diz "pessoa", e precisa ser registrado lá. Não pode ficar só no código.

**Recomendações:**
- `propor-ferramenta.ts:481`: a docstring de `SAIDA_AO_PROFESSOR` ainda cita "espera a sua aprovação", mas essa alternativa saiu da regex.
- Ainda há resposta de conteúdo barrada, com a chave ligada, em pontos aceitos pelo diagnóstico mas que vale medir na fração de 5 % (`techspec.md` §8):
  - "Gostei da pergunta! O mol é…", porque `\bgostei\b` pega em qualquer posição;
  - "Está correto dizer que…" e "Ficou claro, na Revolução Francesa, …", porque a guarda `(?!\s+que\b)` só cobre o "que" logo depois do adjetivo;
  - "A célula precisa de revisão do material genético";
  - "A melhor introdução para o tema é…";
  - "A tese de Darwin é clara" e "O texto de Machado de Assis é … bem construído", ou seja, a aula de literatura com texto colado.
- Na chave, "o que o Machado escreveu?" e "a Clarice escreveu A Hora da Estrela, faz um resumo" ligam a chave. É coerente com a correção aceita ("escreveu" é produção escrita), mas cabe registrar como limite conhecido para a aula de literatura.
- O scratchpad desta sessão é dividido com outra sessão em paralelo: um arquivo meu foi sobrescrito durante a sondagem. Por isso as sondas desta rodada estão numa subpasta própria, `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--specreengenharia--l1/f55c6fc2-7208-497a-a516-5e696dac2d33/scratchpad/revisor-geral-r3/`.

## llm-integrator · 3ª rodada · APROVADO · 2026-10-22 11:09:03 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: APROVADO

Perfis usados: `propor_ferramenta` roda no perfil `rapido` (`packages/nucleo/src/ia/tarefas/propor-ferramenta.ts:605`). É o perfil adequado para propor uma ferramenta. Esta rodada não mudou perfil, provedor nem adaptador.

Custo estimado por professor/mês: esta tarefa não adiciona chamada de modelo nova.
- A conferência da saída é regex local e custa zero token.
- A única chamada que a tarefa pode acrescentar é a reserva: no pior caso, uma segunda chamada quando a primeira saída é reprovada na D55. Isso soma 1 chamada, no perfil `rapido`, a cada saída reprovada.
- O `techspec.md` §8 estima 5 % de barrados, então o custo extra é cerca de 5 % sobre o consumo atual de `propor_ferramenta`.
- Esta rodada não trouxe uma estimativa em reais por professor/mês. Recomendo anexá-la ao `techspec.md`, porque a precificação ainda depende dela.

Prompt versionado: sim. `prompts/propor-ferramenta.ts` está na versão `2026-10-22.1`, e este diff não o tocou.
Validação de schema: sim. Os esquemas `esquemaSaidaDoAssistente` e `esquemaPropostaDoAssistente` seguem como estavam. A reserva só dispara quando a última reprovação foi da D55, e JSON quebrado ou citação inválida seguem para `IA_SAIDA_INVALIDA`.
Aprovação humana no caminho: sim. A conferência barra o juízo sobre texto de aluno (D55, regra 70 item 2a), e a saída sem juízo continua sujeita ao fluxo de entrega pendente.

Bloqueantes: nenhum.

Conferi o código contra o `diagnostico-3.md`, ponto a ponto.
- **Ponto 1:** saíram os ramos `fala_sem_organizar` e `fora_do_trabalho_do_professor`, e com eles `SAIDA_FALA_DO_ALUNO`, `SAIDA_DE_ORGANIZACAO` e `SAIDA_DO_MATERIAL`. Um `grep` não achou nenhuma referência restante. O ramo `desempenho` entrou depois de `SAIDA_AO_PROFESSOR || SAIDA_QUE_RECUSA`, com sujeito pessoa, sem `FALA_DO_CRITERIO` e com verbo de desempenho.
- **Ponto 2:** `SAIDA_FALA_DO_TEXTO` perdeu as palavras de conteúdo e a alternativa de verbos.
- **Ponto 3:** todas as alternativas pedidas estão no código: excesso, aquém do esperado, superlativo de parte do texto, `pode`/`precisa` + reescrita, "pontos a corrigir", `precisa de`/`falta de`, juízo sem sujeito com intensidade e guarda `que`, elogio sozinho e "gostei".
- **Ponto 4:** `DONO_DO_TEXTO` ficou só com verbo de produção escrita. `PARTE_DE_TEXTO` é exigida para `PESSOA_QUE_FEZ` e só advérbio curto cabe entre o nome e o verbo.
- **Ponto 5:** o `it` de `:469` mudou de lado como o diagnóstico mandou. "Bia demonstrou domínio pleno." e "o que a Bia escreveu?" foram acrescentados.
- **Ponto 6:** os blocos de mutação das constantes removidas saíram do `3_task.md`, e os novos entraram. Passei os 164 blocos por `lerMutacoes`: nenhum erro de leitura e todas as linhas âncora existem no arquivo. Os quatro blocos com âncora repetida usam linha de contexto, como antes.
- **Ponto 7:** `onda-0.md` §2.3 e a tabela "Divergências resolvidas" do `3_task.md` estão atualizados, cada divergência com a coluna "Onde está na spec" preenchida.

Rodei os testes e conferi o resultado.
- `numeros.test.ts` passa com 84 de 84, e `packages/nucleo/src/ia` passa com 748 de 748.
- `ouro.test.ts`:
  - `saidaQualitativa` ficou em 53/58, com recall 0,914, e 0 de 41 legítimas barradas.
  - `julgamentoDeTextoDeAluno` sem JT-001 a JT-012 ficou em 43/45.
  - Os números batem com o que o Arquiteto previu.
  - Não abri o corpus e não procurei amostra.
- Testei à parte, num arquivo temporário que apaguei, as cinco frases "não pode barrar" e várias de conteúdo e de juízo. Todas ficaram do lado certo.

Recomendações (não bloqueiam):
1. Furo conhecido: com a chave ligada, o aluno nomeado com "entendeu", "dominou" ou "aprendeu" escapa.
   - Passam hoje: "A Bia entendeu o capítulo.", "O Caio dominou o conteúdo." e "O Caio entendeu bem a matéria e já domina o balanceamento."
   - O sujeito do ramo `desempenho` é `saidaCitaPessoa`, e `PESSOA_NA_SAIDA` (`propor-ferramenta.ts:378`) não tem esses verbos.
   - O docstring de `julgaTextoDeAluno` admite o exemplo "o Caio entendeu o ponto principal". Falta teste que fixe o limite ou o feche.
   - Sugiro acrescentar esses verbos a `PESSOA_NA_SAIDA` com um `it` de sujeito nomeado, ou registrar o limite no lote retido.
2. A alternativa de sugestão agora inclui `pode` e `precisa`, e `julga` roda antes de `SAIDA_AO_PROFESSOR`. Por isso saídas dirigidas ao professor também são barradas com a chave ligada: "Você pode pedir ao aluno que reescreva o texto." e "O professor pode pedir que o aluno reescreva." O custo é cair na recusa fixa. Vale acompanhar na medição dos 5 %.
3. O adjetivo de qualidade sem sujeito barra conteúdo legítimo em alguns casos com a chave ligada: "Está correto afirmar que a massa se conserva." e "Montei a atividade, está completa e com 10 questões." O ouro não acusa, porque são 0 de 41. É risco de precisão, a medir no lote retido.
4. Ao fechar a tarefa, marcar como lidas no `RETIDOS.json` as cinco amostras que o Arquiteto leu, no commit `(ouro: saidaQualitativa)`, como o diagnóstico prevê.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/numeros.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/3_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-0.md`

## test-engineer · 3ª rodada · REPROVADO · 2026-10-22 11:09:04 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: REPROVADO

**Cenários exigidos (3ª rodada: as duas correções da 2ª e o diagnóstico 3):**
- A resposta de conteúdo passa com a chave ligada: "exemplo", "resultado", "definição", "cálculo", "ideia", "ele" de substância, "Lavoisier usou…", "Darwin explicou…". Testado em `julga` e no `conferir`, e as cinco frases que não podem ser barradas também passam.
- "Lavoisier usou uma balança, monta uma atividade", "o que o Napoleão fez?" e "Darwin escreveu A Origem das Espécies?" não ligam a chave.
- As quatro frases da turma inteira ("Todo mundo…", "Quase ninguém…", "Muita gente…", "Mais da metade…") passam na entrada, e "Davi não acertou a 3?" continua recusada.
- O ramo `desempenho` barra, e a menção ao aluno sem juízo passa.
- Os juízos que só os ramos por exclusão pegavam (excesso, aquém do esperado, superlativo de parte do texto, "pode/precisa" com reescrita, "pontos a corrigir", "precisa de"/"falta de").
- O juízo sem sujeito: as quatro frases do conformidade-reviewer são barradas pelo `conferir` com o texto colado e passam sem ele.
- O artigo opcional de `PESSOA_NA_SAIDA` tem caso próprio.
- O piso do `ouro` se mantém.

**Cobertos:**
- `numeros.test.ts` e `ouro.test.ts` rodam verdes: 177 de 177. O `ouro` mostra `saidaQualitativa` em 53/58, 0 de 41 legítimas barradas, e `julgamentoDeTextoDeAluno` em 43/45.
- Rodei as frases exigidas na 2ª rodada pelo código, sem editar nada:
  - As oito frases de conteúdo da correção 1 passam (`julga = false`).
  - "Lavoisier usou uma balança, monta uma atividade" não liga a chave.
  - As quatro da correção 2 passam na entrada, e "Davi não acertou a 3?" continua recusada.
- As duas correções da 2ª rodada foram feitas. Os pontos 1 a 7 do diagnóstico estão no código, nos testes e no `onda-0.md` §2.3:
  - `numeros.test.ts:357`, `:474`, `:485`, `:517` e `:541`;
  - `queAPessoaEscreveu` em `:537`;
  - `:573` e `:574`.
- Os blocos dos ramos que saíram foram removidos. Os blocos novos cobrem o `desempenho` (condição por condição), `SAIDA_AO_PROFESSOR` e `SAIDA_QUE_RECUSA` guardando o `desempenho`, cada palavra de conteúdo que não pode voltar para `SAIDA_FALA_DO_TEXTO`, e cada alternativa nova de juízo (incluindo a intensidade, a guarda "que", a vírgula, o começo da frase e o elogio).
- Não há `.skip`, `.only` nem teste comentado. O provedor nos testes é o `AdaptadorRoteirizado`, falso. Não há operação concorrente nesta tarefa.

**Bloqueantes:**
1. **`propor-ferramenta.ts:170`, `PARTE_DE_TEXTO`: constante nova sem bloco, e metade dela sem teste.**
   - O único bloco é o que tira a conjunção `PARTE_DE_TEXTO.test(semAcentos) &&` (`:179`). Nenhum bloco mexe no conteúdo da constante.
   - A alternativa `\b${TEXTO}\b` não tem teste que dependa dela. Sonda: "Bia errou o parágrafo 2?" e "Davi errou a tese?" ligam a chave hoje só por essa alternativa. Nenhum `it` as cita, então tirar a alternativa deixa a suíte verde.
   - Correção exigida:
     - pôr "Bia errou o parágrafo 2?" nas marcas do `it` de `numeros.test.ts:537`, esperando `true`;
     - criar dois blocos citando esse `it`: um com `PARTE_DE_TEXTO` só com a segunda alternativa (fica vermelho por "Bia errou o parágrafo 2?") e outro só com `${TEXTO}` (fica vermelho por "Bianca usou bem os conectivos?").
2. **`propor-ferramenta.ts:157`, `PESSOA_QUE_FEZ`: o grupo de advérbios é cláusula nova sem bloco.**
   - O único bloco devolve `(?:\w+\s+){0,2}` e prova as quatro frases da turma. Nenhum bloco tira `(?:(?:nao|ja|tambem|bem|so|ainda|mal|nunca)\s+){0,2}`.
   - O teste que ficaria vermelho já existe (`numeros.test.ts:573`, "Davi não acertou a 3?"), mas o bloco não está declarado.
   - Correção exigida: criar o bloco que tira o grupo de advérbios, citando `numeros.test.ts › uma pessoa pelo nome que faz o que o aluno faz`.

**Recomendações:**
- **Lacunas abertas ao tirar a exclusão** (para o lote retido ou o conformidade-reviewer):
  - "O aluno foi muito bem." passa com a chave ligada. Antes caía em `fala_sem_organizar`. É desempenho dito sem verbo da lista de `SAIDA_DESEMPENHO`.
  - "Ela tirou nota baixa." passa em `julga`. Confirme que a conferência de nota pega essa frase.
- Palavras que saíram de `SAIDA_FALA_DO_TEXTO` sem frase que as prove: `afirmac\w+`, `explicac\w+`, `passagens?`, `titulos?`. "A explicação de Lavoisier é clara: a massa se conserva." passa hoje e caberia no `:357`, porque "clara" é adjetivo de qualidade.
- Partes de `QUALIDADE_SEM_SUJEITO` e da alternativa do juízo sem sujeito sem caso próprio:
  - "parece" e "soa";
  - "mal escrito": o `(?:bem |mal )?` só é exercitado por "bem", que a lista de intensidade já cobre.
- O `(a )?sua aprovacao` saiu de `SAIDA_AO_PROFESSOR` sem linha que registre o motivo (o ramo que ele guardava deixou de existir). O `it` de `:621` continua verde. Vale uma linha em "Divergências resolvidas" do `3_task.md`.
- As frases da correção 1 entraram no `:357` com variantes, e não as da ordem. Todas passam (conferi), mas pôr as originais deixaria a ordem rastreável.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/numeros.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/3_task.md

## conformidade-reviewer · 3ª rodada · REPROVADO · 2026-10-22 11:09:24 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum neste diff. A tarefa só mexe na conferência de texto do `propor_ferramenta`, e nada nela escreve em `Nota`. Todos com autor humano? sim, porque não há caminho novo.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. A tarefa não cria saída nova ao aluno, e a exceção da D47 continua só no tutor.
Supervisão do tutor: ok, o diff não toca o tutor.
Autonomia declarada e visível: sim, sem alteração.

**A correção da 2ª rodada, item por item**

A minha exigência tinha cinco alvos; três foram cumpridos e dois não.

- **Feito:**
  - As quatro frases da sonda agora são barradas pelo `conferir` quando o texto do aluno está colado. O `it` próprio está em `numeros.test.ts:485`.
  - As frases de conteúdo do `it` de `:357` passam, e também as cinco que o diagnóstico manda não barrar.
  - Os blocos de mutação existem para o padrão novo, a intensidade, a guarda do "que", a vírgula, o elogio sozinho e o "gostei".
  - Os dois ramos que barravam por exclusão saíram, e entrou o ramo `desempenho`, como o diagnóstico pede nos pontos 1 a 5.
  - O `onda-0.md` §2.3 e a tabela de divergências do `3_task.md` estão atualizados.
  - Rodei `numeros.test.ts`: 84 de 84 verdes.
- **Não feito:** o verbo "é" e o elogio composto. Sondei `julgaTextoDeAluno(s, true)`, que é o que o `conferir` faz quando a conversa traz texto de aluno.

Bloqueantes:

1. **`packages/nucleo/src/ia/tarefas/propor-ferramenta.ts:441`: o juízo sem sujeito dito com "é" passa** (D55; regra 70, item 2a).
   - **O que está errado:** a lista de verbos é `esta|estao|ficou|ficaram|parece|soa`. A correção exigida nomeava "está/ficou/**é**". Passam "É confuso.", "É vago e superficial.", "É bem escrito." e "É um bom começo.".
   - **Lacuna não registrada:** o `onda-0.md` §2.3 não diz que "é" ficou de fora. Pela própria exigência, aceitar a lacuna precisava ser decisão do Arquiteto, registrada lá, e não do código.
   - **Correção exigida:** pôr `e` ("é" depois de `paraARegra`) entre os verbos de ligação. Manter a guarda `(?!\s+que\b)` e somar uma guarda contra o verbo no infinitivo logo depois, para não barrar "É bom lembrar que…" e "É correto afirmar que…", que hoje passam e precisam continuar passando.
   - **Teste:** no `it` de `:485`, "É confuso e pouco convincente." e "É muito bom." barrados. No `it` de `:357`, "É bom lembrar que a massa se conserva." e "É correto afirmar que o mol é unidade." passando.
   - **Mutação:** um bloco que tira o `e` e deixa o `:485` vermelho, e outro que tira a guarda do infinitivo e deixa o `:357` vermelho.
2. **`packages/nucleo/src/ia/tarefas/propor-ferramenta.ts:443`: o elogio só é barrado quando é a frase inteira** (D55; regra 70, item 2a).
   - **O que está errado:** o padrão `^…(muito bom|bom trabalho|parabens)\s*$` não pega o jeito mais comum de dizer o elogio. Passam "Muito bom, parabéns!", "Parabéns pelo esforço!" e "Bom começo!". "Parabéns" e "muito bom" eram alvos nomeados na exigência.
   - **Correção exigida:** barrar a frase feita só de elogios separados por vírgula (`muito bom|bom trabalho|parabens|bom comeco`, um ou mais) e "parabéns" seguido de "pelo/pela/por". "Ótimo! Aqui está a atividade de mol." precisa continuar passando.
   - **Teste:** no `it` de `:485`, "Muito bom, parabéns!" e "Parabéns pelo esforço!" barrados. "Ótimo! Aqui está a atividade de mol." já está no `:357` e tem de continuar passando.
   - **Mutação:** um bloco que volta o padrão de `:443` à forma de hoje e deixa o `:485` vermelho.

Recomendações:

- **A chave não reconhece o nome no começo da frase.** `DONO_DO_TEXTO`, em `propor-ferramenta.ts:167-168`, só aceita artigo e palavra de texto em minúscula, e a lacuna já existia antes deste diff. Por isso "O Caio respondeu: a mitocôndria produz energia." e "Resposta do Caio: …" não ligam a chave. Com resposta curta colada assim, sem pedido nenhum, a conferência da saída fica desligada.
  - Este diff tirou "fez" do segundo ramo, então "a Bia fez isso: x = 2" também deixou de ligar.
  - Vale ler a mensagem com a regex sem diferenciar maiúscula, ou aceitar `[Oo]|[Aa]`, e pôr esses casos no `it` "cada marca da mensagem, sozinha, liga a chave".
- **Elogio e juízo que ainda passam com a chave ligada:** "Excelente!", "Muito bem!", "Mandou bem!", "Achei confuso e vago.", "Confuso e vago." e "Claro e convincente.". Ficam para a medição do lote retido do `ouro`. Se a recall de `saidaQualitativa` cair, este é o primeiro lugar a olhar.
- **Frase sobre o estado emocional do aluno passa pela conferência:** "Ela parece triste." e "Ele está ansioso." passam. Não é da D55, e o teste deixou de cravar "Ela ficou feliz." como aceitável, como pedi na 2ª rodada. Mas a D57 pede proibição testada, e a saída do Assistente sobre aluno não tem conferência de inferência emocional. Fica para a AIA ou para uma tarefa própria.
- **`SAIDA_AO_PROFESSOR` (`:482`) perdeu `(a )?sua aprovacao`.** Faz sentido sem os ramos por exclusão, e só deixa a regra mais rígida. Mesmo assim, vale um caso no teste que prove que as saídas fixas do próprio Assistente ("a versão adaptada espera a sua aprovação") continuam passando no `conferir` com a chave ligada.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/numeros.test.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-0.md`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/3_task.md`. As sondas que rodei estão em `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--specreengenharia--l1/f55c6fc2-7208-497a-a516-5e696dac2d33/scratchpad/sonda.ts` e `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--specreengenharia--l1/f55c6fc2-7208-497a-a516-5e696dac2d33/scratchpad/sonda2.ts`; rodam com `npx tsx --conditions=source <arquivo>`.

## revisor-geral · 4ª rodada · APROVADO · 2026-10-22 11:23:49 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: APROVADO

Escopo: respeitado. A rodada fez os cinco pontos e a lacuna do ponto 6 do diagnóstico 3b, e nada além disso.

Aderência à Tech Spec: ok. As duas mudanças desta rodada, o desempenho dito com o nome e o "é" entre os verbos de ligação, estão registradas em três lugares: em `onda-0.md` §2.3, na linha nova "O que a conferência não pega, medido em 22/10", e na tabela "Divergências resolvidas" do `3_task.md`. Essa tabela também registra a saída de `(a )?sua aprovacao` de `SAIDA_AO_PROFESSOR`.

Portão local: carimbo válido. O conferir confirmou typecheck, lint, segredo, dependencias, unidade e alvo, e a impressão das mutações confere.

Bloqueantes: nenhum.

A correção exigida na rodada anterior foi feita, e chequei cada ponto rodando a conferência com a chave ligada:
- **Ponto 1:** a lista de verbos de `PESSOA_NA_SAIDA` (`propor-ferramenta.ts:379`) agora tem entendeu, compreendeu, dominou, aprendeu e assimilou, também no plural. As cinco frases que escapavam na rodada anterior agora são barradas, e "A Bia ainda não dominou a crase." também. O `it` de `numeros.test.ts:520` ganhou "A Bia entendeu o tema." e "Caio dominou o conteúdo.", e há um bloco de mutação que devolve a lista antiga. A docstring de `:530-532` foi atualizada.
- **Ponto 2:** a marca `parteDeTextoPelaPalavra` entrou em `:539`, com dois blocos de mutação, um para cada metade de `PARTE_DE_TEXTO`.
- **Ponto 3:** existe o bloco que tira os advérbios de `PESSOA_QUE_FEZ`. Ele cita o `it` de `:572`, e é esse `it` que prova "Davi não acertou a 3?", por `pedeJulgamentoDeTextoDeAluno`.
- **Ponto 4:** "É confuso.", "É vago e superficial." e "É bem escrito." agora são barradas. "É bom lembrar que…", "É correto afirmar que…" e "Está correto dizer que…" passam. Há uma mutação para cada parte, o `e` na lista e a guarda do infinitivo.
- **Ponto 5:** `ELOGIO` e a regex composta (`:435`, `:446`) seguem a forma que o diagnóstico pediu. "Ótimo! Aqui está a atividade de mol." passa, e há três blocos de mutação.
- **Ponto 6:** a linha nova entrou no `onda-0.md` §2.3, e a entrada da AIA do Assistente entrou no `TODO.md`.

Recomendações:
- O "é" sem acento casa também a conjunção "e" depois de vírgula, pelo ramo `,\s*` de `propor-ferramenta.ts:444`. Com a chave ligada, isso barra conteúdo como "O sal é branco, e forte no sabor." e "O gabarito é a letra C, e correta segundo a tabela.". O mesmo vale para o adjetivo que abre a frase com "é": "É forte a relação entre massa e mol." é barrada. Pelo escopo do diagnóstico, isso vai para a lista de custo de precisão do `onda-0.md` §2.3.
- "Darwin aprendeu muito na viagem." cai na recusa pelo mesmo motivo de "Newton compreendeu que…". Vale citar esse caso na mesma linha do §2.3, para a lacuna ficar declarada inteira.
- A docstring de `SAIDA_AO_PROFESSOR` (`propor-ferramenta.ts:484`) ainda dá "espera a sua aprovação" como exemplo, mas a alternativa saiu da regex. Tire o exemplo.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/numeros.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-0.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/3_task.md`

## test-engineer · 4ª rodada · APROVADO · 2026-10-22 11:23:51 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: APROVADO

Cenários exigidos: os cinco pontos do diagnóstico 3b, mais a lacuna declarada do ponto 6 (`onda-0.md` §2.3).
1. `PESSOA_NA_SAIDA` com os verbos de desempenho ditos com o nome da pessoa.
2. As duas metades de `PARTE_DE_TEXTO`, cada uma com seu bloco.
3. Um bloco que tira o grupo de advérbios de `PESSOA_QUE_FEZ`.
4. O "é" entre os verbos de ligação, com a guarda do infinitivo.
5. O elogio composto.
6. A lacuna declarada.

Cobertos:
- **Ponto 1 (correção exigida pelo revisor-geral):** feito. "A Bia entendeu o tema." e "Caio dominou o conteúdo." entraram no `queEscapam` do `it` "o desempenho de quem escreveu…" (`numeros.test.ts:520`). Há um bloco que devolve a lista de verbos à forma anterior, citando esse `it`. Os dois blocos antigos de `PESSOA_NA_SAIDA` foram reescritos sobre a linha nova. A docstring de `julgaTextoDeAluno` não cita mais "o Caio entendeu…".
- **Ponto 2 (minha correção 1):** feito. `parteDeTextoPelaPalavra: 'Bia errou o parágrafo 2?'` está nas marcas (`numeros.test.ts:539`). Há dois blocos citando esse `it`:
  - um tira `\b${TEXTO}\b|`. Fica vermelho por "Bia errou o parágrafo 2?": `PESSOA_QUE_FEZ` casa, e "parágrafo" só está em `TEXTO`.
  - o outro deixa só `\b${TEXTO}\b`. Fica vermelho por "Bianca usou bem os conectivos?".
- **Ponto 3 (minha correção 2):** feito. Há um bloco que tira `(?:(?:nao|ja|…)\s+){0,2}`, citando `uma pessoa pelo nome que faz o que o aluno faz`. Ele fica vermelho por "Davi não acertou a 3?" (`:575`).
- **Ponto 4:** "é" virou `e` na lista, com `(?!\s+\w+(?:ar|er|ir)\b)` depois. Os testes:
  - "É confuso e pouco convincente." e "É muito bom." estão em `:488`, barradas com o texto da Bia e intocadas sem ele.
  - "É bom lembrar que…" e "É correto afirmar que…" estão em `:381-382`, passando.
  - Um bloco tira o `e` (cita `:487`) e outro tira a guarda (cita o `it` de conteúdo). Fica vermelho por "É bom lembrar".
  - Os blocos anteriores dessa regex (advérbios, `(?!\s+que)`, as duas âncoras) foram reescritos sobre a linha nova, e cada um continua chegando à sua cláusula.
- **Ponto 5:** criada a constante `ELOGIO`. "Muito bom, parabéns!", "Parabéns pelo esforço!" e "É um bom começo." estão em `:488`. "Ótimo! Aqui está a atividade de mol." continua no `it` de conteúdo (`:376`). São cinco blocos em vez de um: sem `gostei`, sem o elogio de frase inteira, sem `parabens pelo/pela/por`, sem a repetição por vírgula, e `ELOGIO` sem `bom comeco`. Cada um tem uma frase de teste que só ele pega. O bloco antigo da regex literal saiu junto com a regex.
- **Ponto 6:** a linha "O que a conferência não pega, medido em 22/10" está no `onda-0.md` §2.3. Traz as frases que escapam, o custo de precisão, a chave que não liga com "O Caio respondeu: …", e o encaminhamento para a X6. "Está correto dizer que…" ficou fora da lista, e está certo: a guarda do infinitivo a solta, e `incorret\w+` não casa "correto". "Ela parece triste." foi para o `TODO.md` (AIA do Assistente, D57). As duas linhas novas estão em "Divergências resolvidas" do `3_task.md`.
- **Testes rodados nesta auditoria:**
  - `npx vitest run packages/nucleo/src/ia/tarefas/numeros.test.ts`: 84/84 verdes.
  - `ouro.test.ts`: 93/93 verdes. `saidaQualitativa` ficou em 54/58, acima do piso de 53/58, com 0 de 41 legítimas barradas.
- **Itens 4 a 6 do roteiro:** sem `.skip`, sem mock que esconda a regra, e o ouro é uma amostra fixa, sem provedor pago. A tarefa não tem operação concorrente.

Bloqueantes: nenhum.

Recomendações:
1. **Vírgula seguida de "e" (conjunção) no ponto 4** (`propor-ferramenta.ts:444`): o `e` novo também casa a conjunção depois de vírgula, porque a regex começa com `(?:^…|,\s*)`. Com a chave ligada, frases de conteúdo como estas seriam barradas:
   - "A reação libera calor, e completa o ciclo."
   - "…, e corretamente se usa…"
   - "A água ferve a 100 °C, e claro, depende da pressão."

   Esse é um custo de precisão novo, vindo do próprio ponto 4, e não está no ponto 6. Não consegui rodar a sonda, porque o `tsx` não resolve `@educa/shared` sem o build; li à mão contra a regex. Prender o `e` só ao ramo do começo de frase resolve. A outra saída é declarar o custo no §2.3 e pôr uma dessas frases no `it` de conteúdo.
2. **Um verbo por forma no ponto 1:** o bloco devolve a lista inteira, e só "entendeu" e "dominou" têm frase. Tirar "aprendeu", "compreendeu" ou "assimilou", ou os plurais, deixa a suíte verde. Uma frase a mais no `queEscapam` ("O Caio aprendeu a regra.") fecha isso de graça.
3. **Partes opcionais de `ELOGIO`:** `(?:e )?(?:um )?` não tem bloco próprio. "Um bom começo!" sem o "É" não está em teste nenhum.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/numeros.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/3_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-0.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/TODO.md

## conformidade-reviewer · 4ª rodada · APROVADO · 2026-10-22 11:24:02 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: APROVADO

As duas correções que exigi na 3ª rodada foram feitas, e também os pontos 1 a 6 do diagnóstico 3b. Rodei `numeros.test.ts` (84 de 84 passam). Testei frases contra o `julgaTextoDeAluno` atual e contra cópias do módulo, com cada parte da correção desfeita. Tudo isso foi feito no scratchpad, sem tocar na árvore.

**Correção 1, o "é" (`propor-ferramenta.ts:444`).** O `e` entrou na lista de verbos, junto com a guarda do infinitivo `(?!\s+\w+(?:ar|er|ir)\b)`.
- Agora são barradas, com a chave ligada: "É confuso.", "É vago e superficial.", "É bem escrito.", "É confuso e pouco convincente.", "É muito bom.", "É bom." e "É excelente.". Com a chave desligada, nenhuma delas é barrada.
- Continuam passando: "É bom lembrar que…", "É correto afirmar que…", "Está correto dizer que…", "É claro que…" e "É comum confundir…".
- Tirar o `e` faz duas frases do `it` de `:487` voltarem a passar. Tirar a guarda faz duas frases do `it` de `:357` serem barradas. Os blocos de mutação existem e citam esses dois `it`.
- O `onda-0.md` §2.3 registra que a guarda do infinitivo deixa passar "Está correto dizer que…".

**Correção 2, o elogio composto (`propor-ferramenta.ts:435` e `:446`).** Agora são barradas "Muito bom, parabéns!", "Parabéns pelo esforço!", "Parabéns por isso!", "Parabéns, bom trabalho.", "É um bom começo." e "Bom começo!". "Ótimo! Aqui está a atividade de mol." continua passando. Voltar a regex à forma antiga faz três frases do `:487` passarem. Os blocos cobrem cada parte separadamente: a repetição por vírgula, o "parabéns pelo/pela/por", o `gostei` e o `bom comeco`.

**Diagnóstico 3b:**
- **Ponto 1:** "A Bia entendeu o tema." e "Caio dominou o conteúdo." são barradas. Com a lista de verbos antiga, as duas passam. A docstring de `:530` foi atualizada.
- **Pontos 2 e 3:** os blocos de `PARTE_DE_TEXTO` e de `PESSOA_QUE_FEZ` existem. A entrada `parteDeTextoPelaPalavra` está no `it` de `:538`.
- **Ponto 6:** a lacuna está declarada no `onda-0.md` §2.3, com o que passa, o custo de precisão e o envio para a X6. O `TODO.md` tem a linha da AIA do Assistente (D57). As duas linhas novas estão na tabela de divergências do `3_task.md`.

Caminhos de escrita em Nota: nenhum nesta rodada. O diff só mexe na conferência de saída do Assistente e em documentos. Todos com autor humano? sim, nada mudou.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. A exceção da D47 não aparece neste agente: com texto de aluno na conversa, a conferência leva a uma recusa fixa.
Supervisão do tutor: ok, fora do escopo do diff.
Autonomia declarada e visível: sim, sem mudança.
Bloqueantes: nenhum

Recomendações:
1. O 3_task.md não tem o bloco único que "volta o padrão de `:443` à forma de hoje", que a correção 2 pedia literalmente. Os cinco blocos por parte cobrem o mesmo e são mais finos. Vale citar isso numa linha do `3_task.md`, para o `/validar` não estranhar.
2. A guarda do infinitivo abre uma brecha que não está listada no §2.3: "É ruim estruturar assim." passa com a chave ligada. Ela pode entrar na linha "O que a conferência não pega", junto das outras.
3. Encontrei um custo de precisão que não está listado: "É errado dizer que peso é massa." é barrada com a chave ligada, provavelmente por outro ramo da conferência. Vale pôr junto de "Newton compreendeu que…" no §2.3.
4. Para a X6, nenhuma das duas impede a aprovação: a guarda pega qualquer palavra terminada em -ar/-er/-ir. "É bom começar pela tese." ainda é barrada, mas por outro ramo, e não pela guarda.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/numeros.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/3_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-0.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/TODO.md

## llm-integrator · 4ª rodada · APROVADO · 2026-10-22 11:24:07 · `tasks/prd-reengenharia/3_task.md`

VEREDITO: APROVADO

Perfis usados: sem mudança. Esta rodada mexe só na conferência determinística da saída de `propor_ferramenta`, em regex. Não há chamada de modelo nova, e o prompt continua em `2026-10-22.1`.

Custo estimado por professor/mês: sem chamada nova, então o custo não muda. A conferência roda em memória, sem tokens.

Prompt versionado: sim, sem alteração.

Validação de schema: sim, sem alteração. A conferência continua como segunda barreira depois do schema.

Aprovação humana no caminho: sim. A recusa fixa e a chave seguem o desenho da D55 e da regra 70 (2a). Esta rodada só amplia o que é barrado.

Bloqueantes: nenhum. Conferi os cinco pontos e a lacuna do ponto 6 contra o `diagnostico-3b.md`:

1. **Pessoa pelo nome com verbo de desempenho.**
   - `PESSOA_NA_SAIDA` ganhou entendeu, entenderam, compreendeu, compreenderam, dominou, dominaram, aprendeu, aprenderam, assimilou e assimilaram, como pedido.
   - A docstring de `julgaTextoDeAluno` já aponta para o `onda-0.md` §2.3.
   - O teste inclui "A Bia entendeu o tema." e "Caio dominou o conteúdo.". O `it` de conteúdo continua verde.
2. **`PARTE_DE_TEXTO` nas duas metades.** A marca `parteDeTextoPelaPalavra` entrou no `it` da chave. As duas mutações ficam vermelhas: tirar `\b${TEXTO}\b|` e tirar a alternativa dos conectivos.
3. **Advérbios de `PESSOA_QUE_FEZ`.** O bloco existe e fica vermelho em "uma pessoa pelo nome que faz o que o aluno faz", por "Davi não acertou a 3?".
4. **O "é" com a guarda do infinitivo.**
   - O `e` está na lista e a guarda `(?!\s+\w+(?:ar|er|ir)\b)` foi aplicada.
   - "É bom lembrar que…" e "É correto afirmar que…" entraram no `it` de conteúdo; "É confuso e pouco convincente." e "É muito bom." entraram no `it` do juízo sem sujeito.
   - As duas mutações ficam vermelhas, cada uma no `it` certo.
5. **Elogio composto.**
   - A constante `ELOGIO` e a nova regex estão aplicadas.
   - O teste cobre "Muito bom, parabéns!", "Parabéns pelo esforço!" e "É um bom começo.".
   - "Ótimo! Aqui está a atividade de mol." continua passando.
   - Há mutações para a composição, a alternativa "parabéns pelo", o `gostei`, o "bom começo" e a regex inteira.
6. **Lacuna declarada.**
   - O `onda-0.md` §2.3 lista as frases que passam e as que caem na recusa. Conferi cada uma por sonda e todas batem.
   - O `TODO.md` traz a linha da AIA do Assistente (D57).
   - O `3_task.md` ganhou as duas linhas de "Divergências resolvidas".

Verifiquei com execução:
- `numeros.test.ts` passa, 84 de 84.
- Apliquei as sete mutações novas em cópias descartáveis (`adv`, `pt1`, `pt2`, `verbos`, `e`, `inf`, `eloc`). Cada uma deixa exatamente um caso vermelho, o do `it` que o bloco cita. As cópias foram removidas e a árvore ficou intacta.
- `ouro.test.ts` passa, 93 de 93. `saidaQualitativa` fica em 54/58 com precisão 1, acima do piso de 53/58, e 0 de 41 legítimas são barradas.

Recomendações (não bloqueiam):
- **Falso positivo novo no "é".** "O mol é a unidade, é claro." e "Aqui está o resultado, é correto." são barradas com a chave ligada, porque `,\s*e\s+claro` e `,\s*e\s+correto` casam. "É claro que…" escapa pela guarda do `que`, mas o aposto ", é claro" não. Vale listar no `onda-0.md` §2.3 como custo de precisão e medir no lote retido do `ouro` na X6. A sonda também mostrou "É completo o balanceamento: 2H2 + O2." barrada, pelo mesmo mecanismo.
- **Mais um custo de precisão.** "Lavoisier aprendeu química." é barrada pelo verbo `aprendeu`. É o mesmo tipo de custo do "Newton compreendeu", já declarado.
- **Prova do portão.** As mutações já estão nos blocos do `3_task.md`, então o portão da tarefa as aplica.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/propor-ferramenta.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/tarefas/numeros.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-0.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/3_task.md`

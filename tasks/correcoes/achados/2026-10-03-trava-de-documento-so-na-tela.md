# Achados das revisões — `tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-03 21:20:02 · `tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** a matrícula normal continua passando na prévia, na gravação e no nome avulso.
- **Bordas reais:**
  - CPF pontuado, data em três formatos e CPF sem pontuação como o Excel exporta.
  - Uma matrícula numérica de 11 algarismos que tem o dígito certo por acaso não pode ser barrada.
  - A matrícula vazia não entra na conta da maioria.
  - Quando a linha também se repete, o erro de documento aparece antes do de repetição.
  - Espaço nas pontas no nome avulso.
  - Os 11 algarismos iguais ficam de fora.
- **Chamada sem a tela:** quem chama a API direto também é recusado. Este é o objetivo do G2.
- **Log:** o valor recusado não vai para o log.
- **Isolamento e permissão:** não há rota, query nem repository novos. A varredura das cinco rotas da lista já está em `escola-montada.int.test.ts`.
- **Concorrência:** não há operação nova que possa acontecer duas vezes ao mesmo tempo.

**Cobertos:** fiz as mutações de cabeça, cláusula por cláusula. Todas derrubam algum teste.
- **Tirar a conferência de documento de `errosDasLinhas`:** falham `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.test.ts:177` e os dois testes G2 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/lista.int.test.ts` (prévia, gravação e retrato do banco igual).
- **Tirar o `.refine` de `esquemaPedidoNomeAvulso`:** falha `lista.int.test.ts`, no avulso com e sem espaço nas pontas.
- **Tirar `MINIMO_DE_CPFS_NA_COLUNA`:** falha `documento-na-matricula.test.ts`, no caso `[a]` que espera `[false]`.
- **Trocar `>` por `>=` na maioria:** falha o caso `[a, b, '1003', '1004']`.
- **Contar as vazias em `preenchidas`:** falha o caso `[a, '', b, '1004']`.
- **Tirar a exclusão dos 11 iguais ou o cálculo do dígito verificador:** falham os casos `'11111111111'`, `'12345678900'` e `'52998224724'`.
- **Pôr a conferência de documento depois da repetição:** falha o caso com `'01/02/2012'` duas vezes, que espera `matricula_parece_documento`.
- **Tela, voltar `podeGravar` ao `comErro > 0`:** o motivo vira "Corrija…" e falha `previa-da-lista.test.ts`.
- **Tela, tirar `linha.erro === 'matricula_parece_documento'` de `avisosDaPrevia`:** falha o caso `'12345678909'`, que só a API marca.
- **Tela, tirar `|| pareceDocumento(...)`:** falha o caso `comOutroErro` (`sem_nome` com forma de CPF).
- **Controles positivos:** o terceiro teste G2 prova que nada é barrado demais (um CPF solto grava e o avulso com CPF sem pontuação entra). O controle no fim do primeiro teste também prova isso.
- **Log:** a sentinela `987.654.321-00` passa pelo avulso recusado e pela prévia.
- **Restante:** nenhum `.skip`, nenhum mock de coisa nossa, Postgres real, nenhuma IA envolvida.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **CPF com zero à esquerda (borda real que não foi tratada).** Quando o Excel exporta o CPF como número, ele perde o zero à esquerda: `012.345.678-90` vira `1234567890`, com 10 algarismos. `pareceCpfSemPontuacao` não reconhece essa forma.
   - Hoje o efeito é pequeno: a lista inteira já é recusada pelas outras linhas da coluna.
   - Mas a coordenação conserta só as linhas marcadas, e na segunda prévia as de 10 algarismos ficam abaixo da maioria e podem gravar.
   - Vale registrar em `TODO.md`, ou testar e completar com zeros à esquerda para conferir o dígito.
2. **Seção "Mutações".** `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md` não tem essa seção. Valeria pôr uma, como em `2026-10-03-acesso-sobrevive-ao-vinculo.md`, ligando cada cláusula ao teste que a derruba (a lista acima serve de rascunho). Ajuda o `/validar`.
3. **Tela do nome avulso.** A recusa antes de enviar, agora com o `pareceDocumento` do contrato, não tem teste de unidade na web nem e2e citado no diff. Não bloqueia, porque a API recusa e o teste de integração prova isso. Mas um caso no e2e do avulso fecharia o aviso na tela.
4. **Contagem no e2e.** O ajuste em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/estrutura.spec.ts:843` está certo. Um caso com CPF sem pontuação em maioria provaria de ponta a ponta a parte nova do critério, que hoje só a integração cobre.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-03 21:20:45 · `tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md`

VEREDITO: APROVADO

Estados: ok. A correção não mexe em carregamento, vazio nem erro da prévia, e esses três continuam como estavam. Com dado, a linha que parece CPF ou data agora chega da API como erro. Ela aparece entre as linhas de erro, em vermelho, com "Erro: Parece CPF ou data de nascimento, e não matrícula: confira esta linha.", e a contagem a soma em "linha com erro". O aviso amarelo da coluna continua em cima. O motivo de não gravar é o da coluna quando esse é o único erro, e o genérico quando há outro erro (`podeGravar`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/previa-da-lista.ts:71-80`).

Acessibilidade: nada piorou. O texto da linha mantém o prefixo "Erro:", então a cor não é o único sinal. A região `status` com a contagem, o foco no título da prévia e os rótulos e mensagens de erro dos campos do nome avulso ficaram iguais. O vermelho de erro é o mesmo token que as outras linhas de erro já usavam.

Chromebook fraco: nada muda. A troca é de lógica, sem dependência nova, e as expressões só mudaram de pacote (`packages/shared/src/estrutura/documento-na-matricula.ts`). O cálculo do dígito do CPF roda no máximo 200 vezes, só na API.

Celular: o layout é o mesmo. A linha de erro usa as mesmas classes (`min-w-0`, `break-words`) da linha comum. O e2e ajustado (`e2e/estrutura.spec.ts:843-850`) roda nos dois projetos, como o resto do arquivo, e ainda estava em execução no portão quando terminei. O resultado dele fica com o portão.

Ação oficial protegida: não se aplica, porque gravar a lista não é ação oficial. A gravação segue travada com o motivo na tela, e agora a API recusa também (`ENTRADA_INVALIDA`), vindo de qualquer cliente.

Bloqueantes: nenhum.

Recomendações:
- O nome avulso não traduz o `ENTRADA_INVALIDA` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:579-582`, que só traduz `CONFLITO` e `NAO_ENCONTRADO`). Hoje a tela segura antes de enviar com a mesma função do contrato, então esse erro não chega. Mas a API agora recusa por esse código, e vale mapear um texto que diga o que fazer, por exemplo "A matrícula parece CPF ou data de nascimento. Confira e digite a matrícula do aluno." Assim uma divergência futura não cai no texto genérico.
- A coluna de CPF sem pontuação (`12345678909` na maioria das linhas) só tem prova na unidade da web, montada com `comErro`, e na integração da API. Uma linha a mais no e2e mostraria esse caso de ponta a ponta, que é exatamente o que antes passava pela tela também.
- O aviso da coluna é amarelo e a linha marcada é vermelha, e as duas falam da mesma coisa. Está coerente com o resto da prévia (aviso pendente, linha com erro). Fica registrado só para o `/validar` conferir se a coordenação lê os dois como um problema só.

## test-engineer · 2ª rodada · APROVADO · 2026-10-03 21:21:49 · `tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md`

VEREDITO: APROVADO

**Cenários exigidos:** na 2ª rodada, só as três correções da 1ª rodada (que estava APROVADA).
- O nome avulso precisa explicar a recusa `ENTRADA_INVALIDA` da API.
- O documento da correção precisa ter as seções "Mutações" e "Recomendações".
- O `TODO.md` precisa registrar duas pendências: o CPF que perde o zero à esquerda (10 algarismos) e o e2e da coluna em que a maioria é CPF sem pontuação.

**Cobertos:**
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:582-583`: a entrada nova em `textoDaFalha` só acrescenta texto, e a regra não muda. A tela continua barrando antes de enviar: na linha 560, `pareceDocumento` vem do contrato. A recusa da API é a que vale, e os testes de `lista.int.test.ts` (G2 do avulso, com CPF e data) já a provam. A frase cobre também o outro `ENTRADA_INVALIDA` possível, o do nome, porque começa por "Confira o nome e a matrícula". Nenhuma asserção nem caminho testado foi afetado.
- A seção "Mutações" (linhas 72-86 do documento da correção) cobre cada cláusula nova do diff da 1ª rodada: a forma de documento em `errosDasLinhas`, o `refine` do avulso, o mínimo de duas linhas, "mais da metade", a linha vazia fora da conta, o dígito verificador e os 11 algarismos iguais, a ordem antes da checagem de repetição, `podeGravar` e o aviso. Cada uma aponta um teste que falharia sem ela, e esses testes conferem com o que auditei na 1ª rodada.
- `TODO.md`: as duas pendências estão registradas com causa, impacto e caminho de correção. Os dois itens resolvidos ficaram marcados e apontam para a correção.

**Bloqueantes:** nenhum.

**Recomendações:**
- O texto novo do `ENTRADA_INVALIDA` no avulso só aparece se a regra da tela e a da API divergirem, e nenhum teste o exercita. Como é um caminho de reserva, só com texto, não bloqueia. Quando o e2e da lista for dividido, vale um teste de unidade do mapa de textos ou uma interceptação no Playwright que devolva 400.
- O documento da correção diz que o e2e do avulso com CPF e data já existe. Esse teste exercita a barreira da tela, não a mensagem da API. Convém deixar isso explícito na seção "Recomendações", para o `/validar` não ler como cobertura da mensagem nova.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-03 21:21:49 · `tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md`

VEREDITO: APROVADO
Estados: ok. Nesta rodada mudou só o texto de falha do diálogo "Acrescentar um nome". Os quatro estados da tela foram auditados na 1ª rodada e não mudaram.
Acessibilidade: sem mudança. A mensagem nova aparece pelo mesmo caminho das outras falhas do diálogo (`falha` do `DialogoDeFormulario`), que a 1ª rodada já tinha conferido. O texto não depende de cor nem de ícone para ser entendido.
Chromebook fraco: sem impacto. É uma string a mais no mapa de `textoDaFalha`, sem render, rede ou bundle a mais que se meça.
Celular: sem impacto no layout. A frase quebra linha dentro do diálogo como as mensagens de CONFLITO e NAO_ENCONTRADO ao lado, que são do mesmo tamanho.
Ação oficial protegida: não se aplica. Acrescentar um nome à lista não é nota nem decisão sobre aluno.

A correção pedida na 1ª rodada foi feita. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:583`, o `NomeAvulso` agora trata `ENTRADA_INVALIDA` dizendo o que fazer ("Confira o nome e a matrícula: a matrícula não pode ter forma de CPF ou de data de nascimento.") e que nada foi gravado. O texto está em português simples e não vaza termo técnico. Antes, se a trava da tela e a do contrato divergissem, a recusa da API caía na mensagem genérica. O comentário da linha 582 explica por que o caso existe.

Bloqueantes: nenhum.

Recomendações:
- A mensagem cobre só o caso da matrícula, mas a API também recusa com `ENTRADA_INVALIDA` um nome inválido, como o longo demais que escapasse do `maxLength`. "Confira o nome e a matrícula" ainda orienta a coordenadora nesse caso. Se um dia a API mandar o campo que causou a recusa, a mensagem pode apontar o campo certo. Não bloqueia.
- O que ficou da rodada anterior continua aberto. O e2e da coluna com maioria de CPF sem pontuação está no `TODO.md`. O aviso amarelo com a linha vermelha vai para o `/validar`.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-03 21:22:21 · `tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A correção só restringe o que entra em `lista_nome.matricula`: a API agora recusa a matrícula com forma de CPF ou de data.

Fora da tabela de dados do docs/lgpd.md: nada. A linha "Lista de nomes da turma" em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md` passou a registrar a recusa pela API, na lista e no nome avulso.

Autorização por objeto: ok. As rotas, os guards e o escopo de turma e escola continuam os mesmos. A regra nova é conferida sobre o texto, antes de procurar a turma.

Logs: limpos. O teste de log em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/lista.int.test.ts` agora usa o CPF `987.654.321-00` como sentinela, no nome avulso recusado e na prévia, e confere que ele não aparece em nenhuma linha de log. O teste também cobre a 7ª linha `http.erro`.

Auditoria: presente. Nenhuma ação nova exige auditoria. A recusa acontece antes de qualquer gravação, e os testes provam com `retrato` que nada foi gravado.

Envio externo: nenhum.

Seed/fixture: sintético. Os CPFs dos testes são números fictícios de teste com o dígito verificador calculado (`12345678909`, `52998224725`, `11144477735`). As datas são genéricas e os nomes e matrículas são gerados.

Bloqueantes: nenhum.

Recomendações:
- A prévia devolve na linha o valor com forma de documento (`matricula: documento`) que a própria coordenação mandou. É o contrato que já existia, não grava nada e não vai ao log. Vale deixar registrado na Tech Spec que esse valor só aparece na resposta à própria coordenação e nunca em cache persistente nem em URL na tela.
- Levar ao `TODO.md`, como a correção já propõe, o CPF sem o zero à esquerda (10 algarismos) e o e2e da coluna com maioria de CPF sem pontuação.
- O CPF sem pontuação sozinho, no nome avulso ou em lista sem maioria, passa por desenho, porque não dá para distinguir de uma matrícula numérica. Esse risco aceito deveria ficar escrito em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`, na lista de furos conhecidos, para a conversa com o advogado e com a escola piloto.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/estrutura/documento-na-matricula.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/estrutura/lista.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/lista.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/previa-da-lista.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-03 21:22:39 · `tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md`

**VEREDITO: REPROVADO**

O único bloqueante é o carimbo vencido do portão local. O código e os documentos não têm bloqueante.

**Escopo:** respeitado. Entraram as três frentes combinadas: a regra foi para o contrato, a API recusa na prévia, na gravação e no avulso, e o CPF sem pontuação é marcado pela maioria da lista. O falso positivo e as colunas a mais continuam no `TODO.md`, como o orquestrador decidiu.

**Aderência à Tech Spec:** ok. O código de erro de linha novo, o `refine` do avulso e o critério de "mais da metade e pelo menos duas" estão na `techspec.md` (seções da lista e da tela) e no `cenarios.md` (E4a, W10 e RF4), não só no documento da correção.

**Portão local:** `apps/web/src/areas/coordenacao/ListaDaTurma.tsx mudou em 2026-10-03 21:21:11, depois do início do último (2026-10-03 19:21:02). Rode node tools/processo/portao-local.ts de novo.`

**Bloqueantes:**
- **Carimbo do portão** (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md`): o último portão começou às 19:21, antes desta correção. Nenhum typecheck, lint, teste ou e2e rodou sobre a árvore atual. A correção mexe em tela (`ListaDaTurma.tsx` e `e2e/estrutura.spec.ts`), então o e2e entra.
  - Correção exigida: rodar `node tools/processo/portao-local.ts --e2e` e conferir que o carimbo cobre a árvore final.

**Recomendações:**
- **Comentário quebrado** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts:83-85`): o comentário foi refeito e ficou com "antes" sozinho no fim de uma linha curta. Vale realinhar o parágrafo.
- **Linhas largas na Tech Spec** (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md`, trechos do avulso e da tela): algumas linhas novas passam da largura das vizinhas. O mesmo vale para o W10 do `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md`.
- **Linha inválida contando na maioria** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts:120`): `matriculasQueParecemDocumento` recebe todas as matrículas, inclusive as das linhas que já deram `matricula_invalida`. Essas entram na contagem de preenchidas e diluem a maioria. O efeito é mínimo, mas o critério ficaria mais claro só com as matrículas que passaram nas conferências anteriores, ou com uma linha dizendo que a inclusão é de propósito.
- **Condição dupla em `podeGravar`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/previa-da-lista.ts:386-390`): a condição `previa.comErro > 0 || avisos…` depende de `outrosErros === 0` ter sido conferido na linha anterior. Uma variável com nome, como "só erro de documento", deixaria isso legível.

## test-engineer · 3ª rodada · APROVADO · 2026-10-03 21:23:41 · `tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md`

VEREDITO: APROVADO

Cenários exigidos: nenhum cenário novo nesta rodada. As mudanças só dão nome a uma condição e acrescentam comentários, sem alterar comportamento. Valem os cenários da 2ª rodada: documento na matrícula travado na API e na tela, CPF pontuado e data, coluna de CPF sem pontuação decidida pela maioria, linha com outro erro e só erro de documento, nada novo para gravar, e o e2e do avulso.

Cobertos: continuam cobertos pelos mesmos testes da 2ª rodada. Conferi os três trechos citados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/previa-da-lista.ts:78`: `soErroDeDocumento = previa.comErro > 0` é a mesma condição que estava escrita direto antes. A ordem das saídas de `podeGravar` não mudou: primeiro outros erros, depois o bloqueio por documento, depois "nada novo". Os testes de unidade de `previa-da-lista` que travam esse caminho continuam valendo, e cairiam se a condição fosse removida.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts:120-121`: só comentário. Ele descreve a contagem da maioria, e o código bate: `matriculasQueParecemDocumento` recebe todas as matrículas, também as de linha com outro erro.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts`: só comentário realinhado, sem efeito em teste.
- A linha do risco aceito do CPF sem pontuação sozinho em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md` só documenta. Ela não pede teste novo, porque o comportamento correspondente (o CPF sem pontuação sozinho passa quando não há maioria) já está nos testes de `documento-na-matricula`.

Bloqueantes: nenhum.

Recomendações:
- Confirmem que o portão local com e2e, que ainda está rodando, termina verde antes do commit. Esta aprovação não cobre o resultado dele.
- Herdada da 2ª rodada, já registrada no documento da correção: o e2e do avulso prova a trava da tela, mas não o texto novo do motivo. Fica para o `/validar`.

## frontend-reviewer · 3ª rodada · APROVADO · 2026-10-03 21:23:57 · `tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md`

VEREDITO: APROVADO

Estados: ok. Esta rodada não tocou nos estados. A única mudança deu nome a uma condição.

Acessibilidade: nada mudou. A mensagem de bloqueio continua em texto, que o leitor de tela anuncia.

Chromebook fraco: nada mudou. `podeGravar` continua percorrendo a prévia uma vez só, com o mesmo custo.

Celular: nada mudou. A lógica é a mesma e nenhuma tela mudou.

Ação oficial protegida: sim. A gravação continua bloqueada em três casos:
- quando alguma linha tem erro que não é de documento;
- quando sobra erro de documento (`soErroDeDocumento`), ou a coluna inteira parece documento (`coluna_parece_documento`);
- quando nenhum nome novo entra.

Bloqueantes: nenhum.

O diff em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/previa-da-lista.ts:73-82` só troca `previa.comErro > 0` por `soErroDeDocumento`. A linha 74 já trata os outros erros e sai antes, então na linha 78 só pode sobrar erro de documento, e o nome corresponde ao que a condição faz. O comportamento não mudou. O comentário novo também está certo: o aviso explica o que fazer e o motivo do bloqueio só diz que a gravação espera.

Recomendações:
- O nome só vale porque `previa.comErro` conta as mesmas linhas que `previa.linhas` marca com `resultado === 'erro'`. Se um dia a API contar de outro jeito, o nome passa a dizer algo falso. Seria mais robusto contar de `previa.linhas` os erros `matricula_parece_documento`, do mesmo jeito que a linha 74 conta os outros. Não bloqueia.
- O motivo "Nada é gravado enquanto a segunda coluna parecer CPF ou data de nascimento." aparece também quando o problema está em uma linha só, e não na coluna inteira. "Nada é gravado enquanto houver matrícula que pareça CPF ou data de nascimento." serve aos dois casos. É só texto.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-03 21:24:33 · `tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A mudança vale para os campos que já existiam: a matrícula e o nome na lista da turma e no nome avulso.

Fora da tabela de dados do docs/lgpd.md: nada. A linha "Lista de nomes da turma" agora registra que a API recusa matrícula com forma de CPF ou de data. A seção 4 ganhou a linha "CPF ou nascimento entrando como matrícula", que era a recomendação da 1ª rodada. Ela traz o risco aceito do CPF sem pontuação sozinho e do CPF sem o zero à esquerda, e diz onde a prévia devolve a linha recusada: só na resposta à coordenação, fora de cache, URL e armazenamento do navegador. Os dois riscos estão no `TODO.md` com a correção citada.

Autorização por objeto: ok. Este diff não muda rota nem repository.

Logs: limpos. O texto novo de `ENTRADA_INVALIDA` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:583` é fixo e não repete nenhum valor de campo. `textoDaFalha` só escolhe o texto pelo código do erro (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/texto-da-falha.ts:9`).

Auditoria: presente. Esta rodada não cria nenhuma ação que exija auditoria.

Envio externo: nenhum.

Seed/fixture: sintético. O diff não toca nenhum dos dois.

Bloqueantes: nenhum.

Conferi as três mudanças desde a 1ª rodada:
- **`podeGravar`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/previa-da-lista.ts:74-79`): o comportamento não mudou. Quando a lista tem outro erro, `outrosErros` já devolve antes. Então `soErroDeDocumento` (`comErro > 0`) só é verdadeiro quando todo erro que sobra é `matricula_parece_documento`, e a gravação continua bloqueada.
- **Fim da trava só na tela**: a tela não marca mais a linha suspeita por conta própria. Ela mostra o erro que vem da API. `pareceDocumento` saiu da web e veio de `@educa/shared`, então a tela e a API usam a mesma regra.
- **Comentários na API**: nenhum deles leva dado.

Recomendações:
- O motivo "Nada é gravado enquanto a segunda coluna parecer CPF ou data de nascimento" continua dizendo "segunda coluna" mesmo quando é uma linha só. Já está registrado no `TODO.md` (`frontend-reviewer`).

## revisor-geral · 2ª rodada · APROVADO · 2026-10-03 21:45:04 · `tasks/correcoes/2026-10-03-trava-de-documento-so-na-tela.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. O `conferir` responde "portão local válido para o código atual (typecheck, lint, test, e2e)".
Bloqueantes: nenhum.

A 1ª rodada exigiu uma correção, o carimbo, e ela foi feita: o portão com e2e rodou sobre a árvore final. As recomendações daquela rodada foram aplicadas, e nenhuma trouxe problema novo:
- o comentário do `gravar` foi realinhado;
- `errosDasLinhas` ganhou uma linha dizendo que a maioria conta, de propósito, também a matrícula de linha com outro erro;
- a condição em `podeGravar` ganhou o nome `soErroDeDocumento`;
- as linhas largas da `techspec.md` e do `cenarios.md` foram quebradas.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx` (texto de `ENTRADA_INVALIDA` no `NomeAvulso`): a mensagem atribui toda recusa `ENTRADA_INVALIDA` à forma de CPF ou de data. A rota também responde esse código para nome ou matrícula vazios, longos demais ou com caractere de controle. A tela hoje segura esses casos antes de enviar, mas se tela e API divergirem nesses limites, o texto vai apontar a causa errada. Um texto que comece por "Confira o nome e a matrícula" e cite a forma de documento como um dos casos cobriria as duas situações.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts`, docstring de `errosDasLinhas`: a última frase continua numa linha só, mais larga que o resto do bloco. É cosmético.

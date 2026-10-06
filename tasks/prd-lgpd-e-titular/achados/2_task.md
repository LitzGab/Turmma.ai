# Achados das revisões — `tasks/prd-lgpd-e-titular/2_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-05 19:51:33 · `tasks/prd-lgpd-e-titular/2_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- RF1: escola nova lê todas as categorias com origem "padrão".
- Teste de arquitetura reprova tabela fora da classificação, tabela classificada que não existe, tabela sem "entra no arquivo" e coluna proibida que não existe.
- RF2: piso exato aceito; piso − 1 e acima do teto recusados com `RETENCAO_FORA_DO_LIMITE`, sem gravar.
- RF2: categoria fixa (registro de acesso e auditoria) recusada.
- RF2, travas: `texto_do_modelo` acima de `conversa_professor` recusado, `consumo_por_aluno` acima de `conversa_tutor` recusado, baixar a categoria-mãe aceito.
- RF2: `retencao.ajustada` na auditoria com o operador e a referência do contrato; o `GET` mostra a origem ajustada.
- RF2 [P]: dois `ajustar` da mesma escola ao mesmo tempo passam um de cada vez, e o segundo audita o primeiro como anterior.
- RF2: contrato só inteiro positivo; texto ou zero recusados como argumento, sem gravar.
- Isolamento: ajuste em A não muda o `GET` de B.
- Permissão: aluno, professor e coordenação sem MFA não chegam; o teste percorre as rotas de `/v1/privacidade` e falha com lista vazia.
- Implícito no comando: só operador ativo ajusta ou lista (regra do autor conferido na transação, A0b §7c, que o próprio `comando.ts` agora diz valer para `ops:retencao`).

**Cobertos:**
- RF1, em `retencao.int.test.ts`: `toEqual` campo a campo, schema estrito que pega campo a mais na resposta, `no-store` e nenhuma linha gravada.
- Arquitetura: `problemasDaClassificacao` e `colunasDasTabelas` testados com DDL sintético, um caso por problema, além da conferência real contra as migrations.
- Piso, teto, categorias fixas e travas: por integração e por unidade, com fronteira exata.
- Auditoria: a linha inteira é conferida, inclusive o encadeamento do `antes` no segundo ajuste.
- Concorrência: paralelismo de verdade, com `GatilhoDeParada` e `esperarNaTrava`. Sem o `for no key update` o teste fica vermelho.
- Argumentos: contrato em texto e zero recusados; a mensagem de erro é conferida com `toBe` exato e não repete o valor recebido.
- Isolamento: nos dois sentidos. Fica vermelho se o filtro por `escolaId` sair do repository.
- Permissão: falha com lista vazia; a coordenação sem MFA usa o token de desafio, no mesmo padrão do `mfa.int.test.ts`.
- Checks do banco: um teste por restrição, e o check de categoria comparado com o catálogo.
- Não há `.skip`, teste comentado nem mock de código nosso. Não há IA no caminho.

**Bloqueantes:**

1. **Nenhum teste prova que `ops:retencao` recusa `OPERADOR` inexistente ou desativado.**
   - **O que está errado:** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/retencao.ts:149` (`autorDoComando(operador)`), consumido em `:89` e `:118`, a conferência do autor não tem teste. Se a linha 149 virar `async () => operador`, nenhum teste fica vermelho.
     - O `retencao.int.test.ts` só testa `OPERADOR` ausente, que é recusado pelo formato antes de abrir o banco.
     - A mutação declarada ("trocado por um apelido fixo") prova só o valor gravado na auditoria, não a recusa.
     - A suíte C2, que prova essa regra comando a comando, é `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-operador.int.test.ts:200` (`const casos`). Ela lista todos os `ops:*` de escola e não ganhou `ops:retencao`.
     - Na prática, alguém da equipe já desligado poderia encurtar ou alongar a retenção de uma escola, gravando a auditoria com o nome de um operador que não está mais ativo.
   - **Correção exigida:** acrescentar a `casos` duas entradas.
     - **`retencao ajustar`:** escola existente, categoria válida, contrato válido. O `nadaFeito` confere zero linhas em `retencao_escola` e zero `retencao.ajustada` naquela escola. O `passou` espera código 0.
     - **`retencao listar`:** o `nadaFeito` não grava nada, e o recusado tem saída vazia. O `passou` espera código 0.
   - Registrar a linha correspondente na seção "Mutações" do `2_task.md`.

**Recomendações:**
- **Papel rede:** o comentário do controller diz que a rede também recebe a resposta de inexistente, mas o teste de permissão em `retencao.int.test.ts:340` não inclui uma sessão de rede. Hoje isso só está coberto pela expectativa da matriz, em teste de unidade. Vale acrescentar.
- **Status fixo da coordenação:** o laço de permissão espera 200 da coordenação em toda rota de `/v1/privacidade`. As rotas POST das tarefas 8.0, 9.0 e seguintes vão quebrar essa suposição. Ou se deixa anotado no teste que cada rota nova traz o status esperado, ou se monta já um mapa de rota para status.
- **Corrida entre trava e mãe:** a trava da escola também serializa um ajuste da categoria-mãe que rode ao mesmo tempo que o da categoria travada (por exemplo, `conversa_professor` caindo para 3 enquanto `texto_do_modelo` sobe para 12). Hoje isso não gera prazo efetivo errado, porque a trava é reaplicada na leitura, mas um cenário [P] com categorias diferentes documentaria a intenção.

## test-engineer · 2ª rodada · APROVADO · 2026-10-05 20:47:43 · `tasks/prd-lgpd-e-titular/2_task.md`

VEREDITO: APROVADO

**Rodada:** 2ª. Auditei o diff desde a 1ª rodada e o que ele afeta. O que não mudou não foi reauditado.

**Cenários exigidos:** os mesmos da 1ª rodada, agora com a correção exigida. `ops:retencao ajustar` e `ops:retencao listar` precisam recusar um `OPERADOR` inexistente, um desativado e um que não seja operador ativo, sem gravar nada e com saída vazia. O operador ativo passa.

**Cobertos:**
- **Correção exigida, feita.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-operador.int.test.ts:244-261`, `casos` ganhou as duas entradas.
  - `retencao ajustar`: o `nadaFeito` confere zero linhas em `retencao_escola` e zero `retencao.ajustada` na escola da sala, e o `passou` espera código 0 com o JSON exato do prazo efetivo.
  - `retencao listar`: o `nadaFeito` não confere nada, o que está certo porque `listar` não grava. A saída vazia do recusado é garantida pelo laço comum (`toEqual({ codigo: 2, saida: '', erro: RECUSA_DO_OPERADOR })`, com `ninguem`, `bruno` desativado e `fundadora`).
  - O teste falharia sem a regra. Se `autorDoComando(operador)` virasse `async () => operador`, `ninguem` passaria com código 0 e saída preenchida. Se `await autor(tx)` sumisse do `listarRetencao`, `listar` sairia com código 0. A escola vem de `sala.escolaId`, criada no `beforeAll` de cada execução, então o ajuste do `passou` não contamina a próxima rodada da suíte.
- **Mutações.** A seção "Mutações" do `2_task.md` traz as linhas de `executarOpsRetencao › autorDoComando`, `listarRetencao › await autor(tx)` e `ajustarRetencao › autor(tx)`, cada uma apontando para o caso C2 certo.
- **Novo teste de concorrência**, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/retencao.int.test.ts:302-327`. As duas chamadas rodam de fato em paralelo: a mãe fica parada no gatilho depois de gravar 3, e a travada é disparada enquanto isso. O `Promise.race` faz a prova pelo efeito.
  - Sem o `.for('no key update')`, a travada lê a mãe ainda no padrão (12) e grava `texto_do_modelo` em 12, sem bloqueio, porque a chave é outra e o gatilho só para `conversa_professor`. Aí as asserções `{ codigo: 1, saida: '' }`, a linha única em `retencao_escola` e a auditoria única ficam vermelhas.
  - Com a trava, a travada lê 3 e é recusada com `RETENCAO_FORA_DO_LIMITE`. A rejeição de `naTrava` no caminho sem trava é absorvida pelo `.catch`, então o teste não trava.
- **Docblock do controller.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/privacidade/privacidade.controller.ts:6-10` não afirma mais que a rede recebe a resposta do inexistente. Diz que ela tem `nunca` na matriz até o F14.
- **Recusa da sessão de rede.** Está registrada em "Recomendações sem aplicar" com motivo aceitável: `PAPEIS_DE_USUARIO` não tem rede, e o `nunca` fica provado por `matriz.expectativa.ts`.
- **`apps/api/src/ops/retencao.ts`.** Li o arquivo inteiro. A conferência do autor é a primeira instrução das duas transações, `ajustar` trava a escola antes de ler os ajustes e nenhum valor de argumento aparece na mensagem de erro. Não encontrei cláusula nova sem linha em "Mutações".
- **Execução.** Rodei `ops-operador.int.test.ts` e `retencao.int.test.ts` com Postgres e Redis reais: 40 testes, 40 verdes. Não rodei as mutações, porque não edito arquivo. Elas foram conferidas pela leitura das asserções.

**Bloqueantes:** nenhum.

**Recomendações:**
- `ops-operador.int.test.ts:259`: o `passou` de `retencao listar` poderia conferir que a saída traz as doze categorias, e não só o código 0. Não bloqueia: `retencao.int.test.ts` já prova o conteúdo do `listar`.
- `retencao.int.test.ts:316`: um comentário curto dizendo que a rejeição de `naTrava` por prazo é o caminho esperado sem a trava ajudaria quem ler o teste depois.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-05 20:48:53 · `tasks/prd-lgpd-e-titular/2_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** `retencao_escola`, criada em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0024_retencao_escola.sql`, com o schema em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/retencao-escola.ts`.
- `escola_id` é `NOT NULL`, tem chave estrangeira para `escola` e é a primeira coluna da chave primária (`escola_id`, `categoria`).
- A tabela não tem `anoLetivoId`, e a ausência tem justificativa escrita: o prazo vem do contrato da escola e não muda na virada do ano.
- Não há id próprio. A chave é composta por um UUID e uma categoria fechada pelo check, então não existe id sequencial.

**Queries verificadas:**
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/retencao-da-escola.repository.ts`: `ajustes()`, `travarEscola()` e `gravar()` tiram a escola de `contextoAtual()` e lançam erro quando o contexto não tem escola. Nenhum método recebe a escola por argumento e nenhum usa `@SemEscopo`.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/privacidade/privacidade.service.ts`: o `GET /v1/privacidade/retencao` lê a escola do token pelo repository. A rota não aceita `escolaId` no corpo nem na query string. O DTO é montado campo a campo e passa pelo schema estrito, sem quem ajustou nem o número do contrato.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/retencao.ts`: o `--escola` é argumento de linha de comando da operação, não entrada de cliente. O comando abre o contexto da escola antes de ler e gravar, e o `listar` confere se a escola existe por `AcessoDaEscolaRepository.nome()`, que também é escopado pelo contexto. Os outros `ops:*` seguem o mesmo padrão.
- Respostas: professor e aluno recebem 404 `NAO_ENCONTRADO`, a mesma resposta de rota inexistente. A coordenação sem MFA recebe 401. A rede tem `nunca` na matriz.
- Camada rede: não se aplica nesta tarefa, porque a rede ainda não tem usuário e tem `nunca` na matriz.

**Teste de isolamento:** presente e efetivo. Fica em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/retencao.int.test.ts:224`. Se eu removo mentalmente o `eq(retencaoEscola.escolaId, …)` de `ajustes()`, o `GET` de A passa a trazer também o `sinal_tutor` de B, e o `toEqual` com a lista de ajustes de A falha. O teste de permissão, a partir da linha 367, percorre as rotas de `/v1/privacidade` e falha se a lista vier vazia.

**Bloqueantes:** nenhum.

**Recomendações:**
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/retencao.int.test.ts:234`: o teste de isolamento confere só a auditoria de B. Vale conferir também que a auditoria de A não leva o ajuste de B, para cobrir o escopo da gravação da auditoria em dobro.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-05 20:49:48 · `tasks/prd-lgpd-e-titular/2_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido

Bloqueantes: nenhum.

As seis divergências declaradas já estão na `techspec.md` (§3, §4, §7, §7c) e no `cenarios.md` (RF2, o cenário [P] e o do contrato inteiro), exceto a do `escola.repository.test.ts`. Essa mexe só no teste e não muda regra, então não precisa ir para a spec. O conferir do portão saiu válido (typecheck, lint, test).

O que olhei:
- **Escopo.** A tarefa não traz nada do expurgo (3.0 a 5.0) nem da tela (6.0). A classificação ficou só nas tabelas que já existem, como a spec agora pede.
- **Controller.** Não tem regra: só a permissão e o `no-store`.
- **Repository.** É o único lugar que toca a `retencao_escola`, com o escopo vindo do contexto e sem nenhum `@SemEscopo`.
- **DTO de saída.** É montado campo a campo e conferido pelo schema estrito do contrato. Não sai quem ajustou nem o número do contrato.
- **Contrato e erro.** O contrato está em `packages/shared`, e o erro é tipado (`RETENCAO_FORA_DO_LIMITE`, 422).
- **Auditoria.** É gravada na mesma transação do ajuste, com o autor conferido logo no começo.
- **Concorrência.** Resolvida no banco pela trava `for no key update` da escola.

Recomendações:
1. **Texto do prazo da equipe Turmma.** Em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/privacidade/retencao.ts:96`, o prazo de `equipe_turmma` diz "registro, 5 anos". O `docs/lgpd.md:95` e a Tech Spec §3 dizem "vigência + 5 anos" para a `auditoria_operacao`, e a classificação aplica `FIM_DE_CONTRATO`. Esse texto chega à coordenação pelo `GET retencao`. Vale alinhar com o mapa de dados antes da tela da 6.0.
2. **Leitura da escola do contexto.** Em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/retencao-da-escola.repository.ts:26-30`, o `#escolaId()` refaz o que o `exigirEscolaDoContexto()` (`packages/nucleo/src/contexto/escola-do-contexto.ts`) já faz. É um segundo jeito de fazer a mesma coisa.
3. **Formato da saída do comando.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/retencao.ts:150`, o `listar` imprime `{ categorias: [...] }` e o `ajustar` imprime a categoria solta. Um formato só ajuda quem consome a saída com script.
4. **Texto de "quem aplica".** Na classificação, os textos de `operador` e `codigo_recuperacao_operador` ("desativação do operador (A0)", "uso do código e desativação do operador (A0)") são diferentes do que a Tech Spec §3 diz ("A0 e `sistema.expurgar-acesso`"). Só a descrição muda, mas convém manter um texto só.

Arquivos centrais da revisão:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/privacidade/retencao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/privacidade/classificacao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/retencao-da-escola.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/retencao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/privacidade/`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0024_retencao_escola.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/retencao.int.test.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-05 20:50:20 · `tasks/prd-lgpd-e-titular/2_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** um campo novo, `retencao_escola.alterada_por`. Guarda o apelido do operador Turmma, da nossa equipe, e nenhuma pessoa da escola. `referencia_contrato` é um número inteiro do contrato e não identifica pessoa. As outras colunas novas são categoria, meses e data, e nenhuma diz respeito a pessoa.

**Fora da tabela de dados do docs/lgpd.md:** nada. A linha "Apelido do operador Turmma no ajuste de retenção da escola" entrou com finalidade, base legal e retenção. A retenção de `correcao.destaque_aberto_por` também ficou explícita e vai junto com a correção, na categoria `trabalho_do_aluno`.

**Autorização por objeto:** ok.
- `GET /v1/privacidade/retencao` não recebe id. O escopo vem do contexto do token, pelo `RetencaoDaEscolaRepository`, que não tem `@SemEscopo`.
- Professor e aluno recebem 404 `NAO_ENCONTRADO`, a mesma resposta do inexistente. Coordenação sem o segundo fator recebe 401.
- O teste percorre todas as rotas de `/v1/privacidade` e falha se a lista vier vazia.
- Há teste de isolamento: o ajuste na escola A não muda o que a escola B lê, e vice-versa.
- A rede tem `nunca` na matriz e na expectativa.

**Logs:** limpos. Não há logger novo. Os erros do comando saem só com o nome da opção e o código, e o erro cru do Postgres passa por `resumirErro`.

**Auditoria:** presente.
- `retencao.ajustada` grava, na mesma transação do ajuste, o `autor_operador` conferido, o prazo anterior com a origem dele, a categoria, os meses, o número do contrato e a finalidade fixa `contrato_da_escola`.
- A leitura da coordenação devolve só configuração da escola, sem dado de pessoa, então não exige auditoria.

**Envio externo:** nenhum.

**Seed/fixture:** sintético.

**DTO de saída:** explícito, montado campo a campo e conferido por `esquemaRespostaRetencao` (`z.strictObject`). Não leva `alterada_por` nem `referencia_contrato`. A resposta tem `Cache-Control: no-store`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **A ligação ao aluno não alcança o que está em jsonb, e precisa estar resolvida antes da tarefa 13.0.**
   - Em `packages/shared/src/privacidade/classificacao.ts`, a `auditoria` se liga ao titular só por `autor_usuario_id`, e a `validacao_do_lote` só por `confirmada_por`.
   - O `docs/lgpd.md` diz outra coisa. Na auditoria, chama o `alunoId` da decisão da reivindicação de "o elo que liga o aluno à aprovação da identidade dele na pergunta de fechamento da regra 20". Na `validacao_do_lote`, lista como titular também "o aluno do destaque, só pelo id". `acoes.ts:475` também grava `alunoId` no `depois`.
   - Como a ligação hoje só aceita nome de coluna, o arquivo do aluno que sair desta lista vai ficar sem esses registros.
   - A implementação segue a Tech Spec §3 ("a auditoria em que ele é autor"), por isso não bloqueia aqui. A 13.0 precisa estender o tipo, por exemplo com um caminho em jsonb ou `depois.alunoId`, ou registrar a divergência com o `docs/lgpd.md`.
2. **Na 13.0, a ligação por coluna de outra pessoa não pode trazer o dado do aluno para o arquivo do professor.** `correcao.destaque_aberto_por`, `reivindicacao.decidida_por` e `validacao_do_lote.confirmada_por` ligam ao professor linhas que são do trabalho ou da identidade do aluno. O arquivo do professor deve mostrar só as colunas que são dele (o ato e a data), nunca a linha inteira.
3. **`convite.usuario_id` e `acesso_turma.criado_por` são dado de pessoa e estão fora do arquivo.** As duas tabelas ficam como prazo fixo sem ligação, o que segue a lista da Tech Spec. Vale decidir de forma explícita se as datas do convite entram no arquivo do titular (direito de acesso, art. 18, II) e registrar a decisão.
4. **O teste de arquitetura não pega coluna de pessoa em tabela marcada como fora do arquivo.** Ele não reprova uma tabela com `entra: false` que tenha coluna `*_por`, `usuario_id` ou `aluno_id`. Uma sentinela desse tipo mostraria casos como o do item 3 quando aparecerem tabelas novas.

**Pergunta de fechamento:** ainda não responde, e não cabe a esta tarefa responder. O arquivo do titular é a 13.0. Esta tarefa entrega a base, que é a classificação de toda tabela das migrations, conferida nos dois sentidos, com as colunas de segredo fora do arquivo. Para essa base responder pelo aluno, falta resolver o item 1 das recomendações.

Arquivos principais auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/privacidade/retencao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/privacidade/classificacao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/retencao-da-escola.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0024_retencao_escola.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/retencao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/privacidade/privacidade.controller.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/privacidade/privacidade.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/retencao.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`

## test-engineer · 3ª rodada · APROVADO · 2026-10-05 21:05:30 · `tasks/prd-lgpd-e-titular/2_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** pela rodada nova, só o que o lote mudou.
1. O repository continua com o escopo da escola do contexto nos três métodos.
2. O texto do prazo de `equipe_turmma` mudou.
3. O `ops:retencao listar` passa a provar o conteúdo da saída, e não só que rodou.
4. O isolamento confere a auditoria das duas escolas.
5. O registro das recomendações que ficaram sem aplicar está completo.

**Cobertos:**
- **Item 1.** O diff só troca a função. `exigirEscolaDoContexto()` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/contexto/escola-do-contexto.ts`) faz o mesmo que o `#escolaId()` fazia: lança sem escola no contexto e não deixa a consulta sair sem a cláusula. As cláusulas `eq(retencaoEscola.escolaId, …)`, `eq(escola.id, …).for('no key update')` e `values({ escolaId: … })` continuam as mesmas. Os testes que as provam continuam valendo: "isolamento: …", "escola inexistente…" e os dois de concorrência. Esses dois rodam as chamadas em paralelo de verdade, com gatilho e espera na trava, e não em sequência.
- **Item 2.** "registro, enquanto durar o contrato, e mais 5 anos" bate com o "vigência + 5 anos" do `docs/lgpd.md` (linha 60) e com o texto de `registro_de_decisao`. Nenhum teste confere essa string, então a troca não deixa nada sem prova.
- **Item 3.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-operador.int.test.ts`, no caso `retencao listar`: o `toEqual([...CHAVES_DE_RETENCAO])` falha se o `listar` deixar de fora uma categoria, mudar a ordem ou devolver outra coisa. Antes, o caso só provava o código 0 e o erro vazio.
- **Item 4.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/retencao.int.test.ts`:
  - Linhas 234–235: a auditoria de A e a de B são conferidas por conteúdo exato (categoria, meses e contrato). Se a escola da auditoria vazasse de uma para a outra, ou se a gravação usasse a escola errada, o teste quebraria. O `toHaveLength(1)` de antes não pegava a categoria trocada.
  - Linhas 316–318: o comentário explica o `catch`, que só impede a rejeição de virar erro solto do processo. O teste continua provando pelo efeito, nas asserções seguintes, e por isso o `catch` não esconde a regra.
- **Item 5.** A tabela "Recomendações sem aplicar" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/2_task.md` (linhas 137–145) dá motivo para as três recusadas e destino, a tarefa 13.0, para as quatro do `privacy-guardian`.
- Não achei `.skip`, teste comentado nem mock novo no diff. Não li a saída do portão: o carimbo e os 4166 testes verdes são o que o pedido informa.

**Bloqueantes:** nenhum.

**Recomendações:**
- A linha 99 da seção "Mutações" em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/2_task.md` ainda cita `eq(retencaoEscola.escolaId, this.#escolaId())`, e esse método não existe mais. Trocar por `exigirEscolaDoContexto()`, para que quem audita depois consiga achar a cláusula no código.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-05 21:06:20 · `tasks/prd-lgpd-e-titular/2_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Olhei só o lote aplicado. O que já estava aprovado na 1ª rodada não mudou e não foi auditado de novo.

**Campos pessoais tocados:** nenhum campo novo. O lote só refatora o escopo do repository, troca um texto de prazo e reforça testes.

**Fora da tabela de dados do docs/lgpd.md:** nenhum.

**Autorização por objeto:** ok. Em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/retencao-da-escola.repository.ts`, as linhas 31, 40 e 48 (`ajustes`, `travarEscola` e `gravar`) tiram a escola de `exigirEscolaDoContexto()`. A função está em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/contexto/escola-do-contexto.ts:8-12`, lê só o contexto autenticado e lança erro quando não há escola, sem nunca rodar a consulta sem o filtro. Nenhum método recebe a escola por argumento. O comportamento é o mesmo do `#escolaId()` que saiu.

**Logs:** limpos. O lote não adiciona log.

**Auditoria:** presente. A ação `retencao.ajustada` não mudou. O teste de isolamento agora confere o conteúdo da auditoria de A e de B (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/retencao.int.test.ts:234-235`), e ela traz só a categoria, os meses e o número do contrato, sem dado de pessoa.

**Envio externo:** nenhum.

**Seed/fixture:** sintético.

**Texto do prazo:** em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/privacidade/retencao.ts:96`, "registro, enquanto durar o contrato, e mais 5 anos" agora bate com a linha da auditoria da operação em `docs/lgpd.md:95` ("vigência + 5 anos"). A divergência que a coordenação via no `GET retencao` deixou de existir.

**Minhas recomendações da 1ª rodada:** as quatro estão em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/2_task.md:142-145`, encaminhadas à tarefa 13.0, com o motivo de cada uma. Aceito o destino, porque as quatro dependem de como o arquivo do titular será montado.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. As quatro da 1ª rodada continuam valendo e precisam ser fechadas na 13.0.
- Ligar o aluno pelos caminhos em jsonb: `auditoria.depois.alunoId` e o aluno do destaque na `validacao_do_lote`.
- No arquivo do professor, mostrar só o ato dele e a data, nunca a linha do aluno.
- Decidir se `convite.usuario_id` e `acesso_turma.criado_por` entram no arquivo do titular.
- Criar a sentinela de arquitetura para tabela fora do arquivo que tenha coluna de pessoa.

# Achados das revisões — `tasks/prd-apresentacao-operacao/3_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-23 21:28:19 · `tasks/prd-apresentacao-operacao/3_task.md`

**VEREDITO: REPROVADO**

**Cenários exigidos:** C1 (bootstrap), C2 (os cinco `ops:*` e o `criar`), C3 (dois `criar` de bootstrap em paralelo), C4, C5 (inclusive o paralelo), C6 (sem a parte `SESSAO_ENCERRADA`, que vai para a 4.0), a parte do C7 que é desta tarefa, C8, C45 e U1.

**Cobertos:**
- **C1:** o autor gravado é `bootstrap` e não o `OPERADOR`. O terminal não mostra nome, e-mail nem token. O convite guarda o hash, vale 72 h, e o `ops:uso` roda no bootstrap.
- **C2:** há um caso por comando, e cada um recusa três `OPERADOR`: inexistente, desativado e fora da lista. Conferi que sem o `conferirOperador` cada caso sai com código 0 ou 1 e o teste fica vermelho. O ativo passa com o resultado do próprio comando.
- **C3:** é concorrência de verdade. O teste segura o `pg_advisory_xact_lock` e espera as duas chamadas aparecerem no `pg_locks` antes de soltar. Os apelidos e e-mails são diferentes, então só a trava segura o resultado `[0,2]`. Se a trava for pega depois da conferência, ou não for pega, o teste falha.
- **C4:** confere autor, ação e alvo em sequência. Inclui o caso sem convite pendente, que não grava revogação.
- **C5:** estão cobertos o apelido inexistente e o já desativado, o último ativo e o "a si mesmo" com outro ativo. No paralelo cruzado passa um só, e resta um ativo.
- **C6:** a linha fica sem dado pessoal, os códigos somem, o convite é revogado e a sessão fica com motivo `desativacao`. Um segundo operador, com o mesmo tipo de dado, fica intacto, o que prova o filtro por alvo. O check do banco recusa devolver nome depois de desativado. A falha injetada na última gravação desfaz tudo.
- **C7 (parte):** o `convite` revoga o pendente, o único parcial é provado direto no banco, e convite para operador desativado ou inexistente não gera nada.
- **C8:** o arquivo nasce 0600 no `criar` e no `convite`. Arquivo que já existe é recusado antes de abrir o banco, e o arquivo é apagado em caso de conflito.
- **C45:** a varredura pega import, alias, namespace, reexportação, o arquivo do schema e o nome em SQL, com casos positivos e negativos, e confere que o repository não toca outra tabela.
- **U1:** o formato do apelido tem seus limites testados, e `bootstrap` é reservado.

**Bloqueantes:**
1. **O `convite` pedido por `OPERADOR` recusado não tem teste.** A regra está em `apps/api/src/ops/operador.ts:189` e na divergência "Os três subcomandos passam pela trava" do `3_task.md`. Se alguém trocar ali o `autorSobATrava` por `travarOperadores()` e `autor = operadorDoAmbiente`, todos os testes continuam verdes: C4, C7 e C8 só chamam o `convite` com operador ativo. Não é detalhe. Um membro desativado da equipe conseguiria gerar, num arquivo dele, o token de convite de um operador ativo, e isso é caminho para tomar a conta.
   - **Correção exigida:** em `apps/api/test/ops-operador.int.test.ts:171-217`, acrescentar ao `casos` do C2 o caso `operador convite`, com `['convite', '--apelido', 'ana', '--saida', arquivoNovo()]`. O `nadaFeito` deve provar que o convite pendente de `ana` continua o mesmo e que nenhum convite novo foi criado. O arquivo do recusado não pode ficar, e isso o loop já confere.
   - **Mesma correção:** acrescentar também o caso `operador desativar`, com `['desativar', '--apelido', <um terceiro ativo>]`. Hoje o `desativar` recusado só é provado de forma indireta, pelo perdedor do paralelo do C5.

**Recomendações:**
- **C6:** `estadoDe` (`ops-operador.int.test.ts:330`) lê uma lista fixa de colunas. Uma coluna pessoal nova na tabela `operador` passaria despercebida. Sugiro `select *` com o conjunto exato de chaves, deixando `mfa_versao` explícito como contador que fica, para que "só id, apelido e datas" seja uma asserção fechada.
- **Apelido `bootstrap`:** a recusa está provada só no comando (`operador.test.ts:44`). Falta um insert direto que prove o check `operador_apelido_formato <> 'bootstrap'` no banco, como já foi feito para o `operador_desativado_sem_dado_pessoal`.
- **`ops:uso`:** passou a exigir `OPERADOR`, e não há teste de unidade para "sem `OPERADOR`, sai com 2 sem abrir o banco", como o `operador.test.ts:73` faz para o `ops:operador`.
- **Os cinco `ops:*`:** a conferência roda fora de transação e sem a trava, então um `desativar` simultâneo deixa passar uma última execução. Para comando manual é aceitável, mas vale registrar como dívida para o `/retro`.
- **C6, falha injetada:** a ordenação `order by em, acao` depende de o `now()` ser o mesmo dentro da transação e diferente entre transações seguidas. Funciona, mas um comentário no teste evitaria confusão futura.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-operador.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/operador.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/operador.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-09-23 21:38:25 · `tasks/prd-apresentacao-operacao/3_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada. Nesta rodada conferi só a correção exigida e o diff dos testes.
- Nos sete `ops:*`, o comando é recusado quando o OPERADOR não existe (`ninguem`), está desativado (`bruno`) ou é o apelido reservado `fundadora`. Cada recusa não deixa efeito nenhum, e o operador ativo passa.
- Isso vale também para os casos `operador desativar` e `operador convite`, que faltavam na 1ª rodada.
- O `ops:uso` confere o OPERADOR antes de abrir o banco.
- A cópia de `bootstrap` é barrada pelo check do banco.

Cobertos:
- **Correção exigida, feita.** Ela está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-operador.int.test.ts`.
  - **`operador desativar` (linhas 221 a 226):** o caso tenta desativar `carla`, que está ativa. Depois de cada recusa, os ativos continuam `['ana','carla']`. Quando `ana` roda o comando, sai exatamente `{ codigo: 0, saida: 'ok\n', erro: '' }`.
  - **`operador convite` (linhas 228 a 240):** depois de cada recusa, os convites de `ana` são exatamente `[{ id: conviteDaAna, pendente: true }]`. Isso prova duas coisas ao mesmo tempo: nenhum convite novo nasceu e o pendente não foi revogado. O loop (linhas 256 e 257) também confere que o arquivo de `--saida` do recusado não ficou no disco.
  - **O teste falharia sem a regra.** Sem a checagem de `autorSobATrava` no `gerarConviteDeOperador`, o recusado geraria um convite, o `toEqual` quebraria e o arquivo existiria. É a mesma mutação que vocês relataram ter feito, e bate com o que a asserção prova.
  - **O setup de cada caso está certo.** `ana` é criada com `fundadora` como OPERADOR, `bruno` é criado e desativado por `ana`, e `carla` fica ativa. O `conviteDaAna` é gravado de novo a cada caso (linha 245), então o `nadaFeito` compara com o convite certo.
- **`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/uso.test.ts:56-68`:**
  - **Os dois casos cobertos:** sem OPERADOR, e com OPERADOR fora do formato.
  - **O que as asserções provam:** a saída é 2, a mensagem de erro é exata, e o `abrirBanco` injetado não é chamado. Esse mock é a porta de abrir o banco, não a regra testada, então não esconde nada. Se a conferência fosse tirada ou passasse para depois de abrir o banco, o teste falharia.
- **Recomendações da 1ª rodada, aplicadas.**
  - **`estadoDe` (linhas 382 a 391):** a asserção agora cobre todas as colunas do operador, com `mfa_versao: 1` explícito.
  - **Apelido reservado (linhas 413 e 414):** um insert direto com apelido `bootstrap` é recusado com `constraint: 'operador_apelido_formato'`.
  - **Ordenação:** há comentário sobre o `order by em, acao`.
- **Nenhum `.skip`, `.only` ou `todo`** nos três arquivos de teste.

Bloqueantes: nenhum.

Recomendações:
- **Conferência fora da trava (já registrada para o `/retro`).** Os `ops:*` conferem o OPERADOR fora de transação e sem a trava. Por isso, um `desativar` que rode ao mesmo tempo ainda deixa passar uma última execução manual. Hoje é aceitável: é um comando manual da equipe, com auditoria. Se um dia virar um problema, o teste de verdade seria um `desativar` em paralelo com um `ops:escola` do mesmo operador.
- **`nadaFeito` vazio em três casos.** Em `revogar-convite`, `redefinir-mfa` e `uso`, o `nadaFeito` é `async () => undefined`. Isso se sustenta porque o alvo é um UUID aleatório e a saída exata com código 2 já prova que a recusa veio antes. Um comentário de uma linha dizendo isso evitaria que um leitor achasse que o caso está incompleto.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-23 21:39:14 · `tasks/prd-apresentacao-operacao/3_task.md`

```
VEREDITO: APROVADO
Tabelas verificadas: operador, codigo_recuperacao_operador, convite_operador, sessao_operador, acesso_operacao, auditoria_operacao (packages/nucleo/drizzle/0014_operador.sql, packages/nucleo/src/db/schema/operador.ts). Todas com PK UUID (uuidv7) e sem escola_id nem ano_letivo_id. Isso é o desvio declarado na Tech Spec, seção 11 (tabelas da equipe, sem dado de escola nem de aluno, e sem variação por período). Nenhuma tabela entra no `schema` do criarBanco (packages/nucleo/src/db/banco.ts), então `banco.query.*` não as alcança sem import. A migration só cria tabelas novas.
Queries verificadas: os métodos de apps/api/src/operacao/operador.repository.ts: travarOperadores, situacaoDoAutor, ativoParaAtualizar (FOR UPDATE), contarAtivos, criar, criarConvite, revogarConvitePendente, desativar, apagarCodigosDeRecuperacao, encerrarSessoes e auditar. Nenhum toca tabela de escola e todos filtram por operadorId ou apelido. Também verifiquei conferirOperador em apps/api/src/ops/comando.ts e a chamada dele nos cinco ops:* (escola, convite-coordenador, revogar-convite, redefinir-mfa, uso). Nenhuma rota ou endpoint novo. Nenhum `@SemEscopo()` novo. O `--escola` do ops:uso já existia: é argumento de CLI interna nossa, não parâmetro de cliente, e a consulta segue pelo UsoRepository com escopo.
Teste de isolamento: presente e efetivo. Para tabela sem escola_id, o contrapeso é o C45 (apps/api/test/arquitetura.test.ts, linhas 489-530). Ele varre apps, packages, infra, tools e e2e por import nomeado, alias, namespace, reexport, import do arquivo do schema e nome físico em SQL, e confere que o repository não toca outra tabela. Remover a restrição, por exemplo com um segundo arquivo importando `conviteOperador` ou um `delete from acesso_operacao` no worker, deixa o teste vermelho. Os casos sintéticos das linhas 506-524 provam a varredura nas duas direções. Pelo grep, hoje nenhum arquivo fora do repository, do schema, do barrel e dos testes cita as seis tabelas. O C2 (apps/api/test/ops-operador.int.test.ts:171-262) cobre os seis comandos, com os casos inexistente, desativado e bootstrap-antigo, e confere que nada foi feito.
Bloqueantes: nenhum
Recomendações:
- apps/api/src/ops/comando.ts:41: nos cinco ops:* de escola, conferirOperador roda fora da transação de escrita e sem a trava 7_000_002. Se alguém desativar o operador ao mesmo tempo, sobra uma janela TOCTOU pequena, em que ele ainda grava `auditoria.autor_operador` com um apelido recém-desativado. Não vaza dado entre escolas. Vale registrar como dívida para o /retro, ou conferir dentro da transação de cada service quando isso for mexido.
- apps/api/test/arquitetura.test.ts:434: quando o expurgo da 9.0 chegar, incluí-lo em QUEM_PODE_TOCAR_A_OPERACAO na mesma tarefa. O comentário já prevê isso; fica anotado para o /validar.
```

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-23 21:39:25 · `tasks/prd-apresentacao-operacao/3_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** só da nossa equipe, nenhum de aluno nem de escola. São `operador` (apelido, nome, e-mail em citext, hash de senha, segredo TOTP cifrado, versão, passo e data de ativação do segundo fator), `codigo_recuperacao_operador` (só o HMAC), `convite_operador` (SHA-256 do token e datas), `sessao_operador` (hashes do cookie, horários e motivo, sem IP), `acesso_operacao` (IP, evento e data) e `auditoria_operacao` (autor, ação da lista fechada, alvo e data).

**Fora da tabela de dados do docs/lgpd.md:** nenhum campo. As linhas de conta, convite, sessão, acesso e auditoria da operação cobrem as seis tabelas, com finalidade e retenção. Há um ajuste de texto pequeno na linha da sessão, que está nas recomendações.

**Autorização por objeto:** não se aplica, porque a tarefa não cria rota. O que faz esse papel no comando está certo:
- Com operador ativo, o `OPERADOR` precisa ser um deles, conferido antes de qualquer escrita nos cinco `ops:*` (`conferirOperador`) e dentro da transação, sob `pg_advisory_xact_lock`, no `ops:operador` (`autorSobATrava`).
- Apelido inexistente e apelido desativado dão a mesma resposta: `NAO_ENCONTRADO`, "operador ativo não encontrado".
- As seis tabelas ficam fora do `schema` do `criarBanco`, e o C45 em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts` prova que só o `OperadorRepository` as toca, por import, por namespace e pelo nome em SQL.

**Logs:** limpos.
- O terminal mostra só ids e o caminho do arquivo. Nome, e-mail e token nunca aparecem, e o teste de integração confere isso.
- `OperadorRecusado` tem mensagem fixa, sem o valor da variável.
- O erro cru do Postgres passa por `resumirErro`, que devolve só o sqlstate e a constraint.

**Auditoria:** presente em todas as ações que a exigem.
- `operador.criado`, `operador.desativado`, `convite_operador.gerado` e `convite_operador.revogado` ficam na mesma transação da mudança.
- O C4 confere autor e alvo, e a falha injetada por trigger (C6) prova que nada fica pela metade.

**Eliminação e retenção:**
- Desativar zera nome, e-mail, senha, segredo e passo do segundo fator, apaga os códigos, revoga o convite pendente e encerra as sessões. O check `operador_desativado_sem_dado_pessoal` garante isso também no banco.
- O convite é de uso único, vence em 72 h, pode ser revogado e tem no máximo um pendente por operador (índice único parcial). O token vai para um arquivo com modo 0600, criado com `wx`, e o banco guarda só o hash.
- O expurgo está previsto para a tarefa 9.0, como declarado.

**Envio externo:** nenhum.

**Seed/fixture:** sintético (`Pessoa Sintética …`, `@turmma.invalid`), com uma ressalva nas recomendações.

**Pergunta de fechamento:** não muda com esta tarefa. As seis tabelas não guardam nada sobre aluno.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`, a linha "Sessão de operador Turmma" poderia citar o motivo de encerramento (`saida`, `reuso_de_refresh`, `desativacao`) e o hash anterior do cookie de renovação, como a linha da sessão da escola já faz. As duas colunas existem no schema.
2. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/operador.test.ts:31` e `:75`, os casos negativos usam `joaquim@turmma.com` e `Joaquim Paes`, que parecem dado real da equipe num domínio real. Troque por valores `.invalid` sintéticos, como no resto do arquivo.
3. `--nome` e `--email` entram pela linha de comando e ficam visíveis no `ps` e no histórico do shell de quem roda o comando. É dado da equipe e segue o que o `ops:convite-coordenador` do F1 já faz, mas vale considerar ler esses dois pela entrada padrão numa tarefa futura.
4. No nascimento, a auditoria grava o autor `bootstrap`, e o valor do `OPERADOR` que rodou o comando se perde. Foi decidido assim, mas o dossiê da operação deveria explicar que o primeiro operador nasce sem autor nominal.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-23 21:39:49 · `tasks/prd-apresentacao-operacao/3_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As sete divergências estão escritas em "Divergências resolvidas nesta tarefa" no `3_task.md`, e as que mudam o modelo de dados subiram para a seção 3 da `techspec.md`. Nenhuma foi decidida em silêncio.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test)")
Bloqueantes: nenhum
Recomendações:
- **Hash do token feito de dois jeitos.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/token-do-convite.ts:145-152` refaz o que `apps/api/src/sessao/convite.service.ts:12,20,153` já faz com `BYTES_DO_TOKEN_DE_CONVITE` e `hashDoToken`. Esse arquivo também não está na lista de arquivos previstos. O melhor é tirar a peça pura do F1 para um lugar comum e usar a mesma nas duas pontas, antes da tarefa 5.0 (aceite do convite), que vai procurar por esse hash.
- **Comentário desatualizado sobre a trava.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts:14-18` diz que a trava ordena só o `criar` e o `desativar`. Pela divergência declarada, os três subcomandos passam por ela, e o comentário precisa dizer isso.
- **Conferência fora da transação nos outros `ops:*`.** Em `escola.ts`, `convite-coordenador.ts`, `revogar-convite.ts`, `redefinir-mfa.ts` e `uso.ts`, o `conferirOperador` roda fora da transação que grava e sem a trava. Um `desativar` concorrente pode passar entre a conferência e a escrita. A Tech Spec não exige a trava ali e o risco é baixo, mas vale uma linha na seção 13 ou a conferência dentro da transação de cada serviço.
- **Recusas sem código de domínio.** `DesativacaoRecusada` (`apps/api/src/ops/operador.ts:60`) e `OperadorRecusado` (`apps/api/src/ops/comando.ts:41`) estendem `Error` e não `ErroDeDominio`. No comando funciona, porque a saída imprime `CONFLITO`. Quando a tarefa 4.0 levar essas regras para rota, elas precisam virar erro com código (regra 00, item 9).
- **README desatualizado.** `/home/joaquimdp/Documentos/git/Educa.ia/README.md:64-67` lista os `ops:*` com `OPERADOR=<voce>`, mas não traz o `ops:operador` (`criar`, `desativar`, `convite`, bootstrap), nem avisa que, com um operador ativo, `OPERADOR` precisa ser um deles.

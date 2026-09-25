# Achados das revisões — `tasks/prd-apresentacao-painel/4_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-25 00:03:32 · `tasks/prd-apresentacao-painel/4_task.md`

VEREDITO: REPROVADO

Encontrei um bloqueante. Falta o caso de permissão do novo ramo `NAO_ENCONTRADO`: um bilhete válido que é de **outra** conta. O resto dos testes prova a regra: cada mutação que você listou deixa pelo menos um teste vermelho, e conferi pelo código que cada uma seria mesmo pega.

**Cenários exigidos:**
- E15(a) a (e): a trava segurada, o gerar primeiro, a ativação primeiro, o aceite contra refazer e revogar nas duas ordens, e a espera além do `statement_timeout`.
- E16 com e sem MFA: senha certa sem `login_falho`, senha ou código errados contando, outro usuário ativo, e revogação entre a senha e o código.
- 4.1: o aceite que não ativa responde convite inválido, nunca 500.
- E6 (login): gerar em `aceito` e em `sem_coordenacao`.
- W10 em unidade e e2e.
- `desfazer` do contador, no Redis e no seguro em memória.
- Permissão: o bilhete tem de ser desta conta.

**Cobertos:**
- **E15(a):** coberto nos dois logins e no aceite, pela espera na trava (`wait_event = 'advisory'`) e pelo `for update nowait` nas linhas. Sem a trava, a espera estoura o prazo e o teste falha.
- **E15(b):** coberto com e sem MFA. Confere contador, registro de acesso, auditoria e estado. O caso "mesmo e-mail" só roda sem MFA.
- **E15(c):** coberto nos dois logins, com `CONFLITO` e um convite só.
- **E15(d):** coberto nas quatro combinações. A ordem "aceite primeiro" pega o 40P01 quando a trava vem depois de `usarConvitePorHash`.
- **E15(e):** coberto nos dois logins e no aceite, com 503, `Retry-After`, contador igual ao de antes e nada gravado.
- **E16:** coberto, inclusive o contador em 2 (e não 3 nem 0), o que separa `desfazer` de `zerar`. Também coberto: `escolher` sem a escola do convite, e a revogação entre as etapas com 0 e com 1 outro usuário.
- **4.1:** coberto com o `desativado_em` no futuro.
- **E6 (login):** coberto.
- **Contador:** as unidades e a integração do `desfazer` separam `desfazer` de `zerar` e cobrem soltar a espera.
- **W10:** unidade nos dois catálogos (entrada e segundo fator). O e2e cobre só `/entrar`, nos dois projetos, com axe e largura.
- **Qualidade dos testes:** nenhum `.skip`, e nada chama provedor de IA.

**Bloqueantes:**

1. **O caso de permissão do novo ramo não tem teste.**
   - **Onde:** `apps/api/src/sessao/convite.service.ts:127` (`verificado?.contaId === contaId ? verificado.conviteId : undefined`) e `apps/api/src/sessao/login.service.ts:380-385`.
   - **O que está errado:** `usuarioComConviteAceito` já filtra por `contaId` (`resolucao-de-tenant.repository.ts:403`). Por isso, antes desta tarefa, apagar a checagem de conta não mudava nada que se visse. Agora ela é a única coisa que separa o `NAO_ENCONTRADO` (sem `login_falho`, reserva desfeita) da recusa única do RF6.
   - **O risco:** sem a checagem, qualquer um com um bilhete válido da **própria** conta tenta senhas de uma conta sem usuário ativo. A senha errada volta 401, a certa volta 404 e ainda desfaz a reserva. Isso revela quando a senha acertou, e é exatamente o que o RF6 existe para esconder.
   - **Por que nenhum teste pega:** os testes de bilhete de outra conta (`apps/api/test/convite.int.test.ts:427-447`) usam sempre contas com usuário ativo. Nelas o resultado é `pronta` com ou sem a checagem.
   - **Correção exigida:** em `apps/api/test/login-convite-revogado.int.test.ts`, no bloco "sem MFA, conta sem outro usuário ativo" (linhas 52-89), e também com MFA, adicionar este teste:
     - Montagem: a conta Y, sem usuário ativo, faz login com a senha certa dela e o bilhete válido da conta X, cujo convite foi revogado.
     - Esperado: 401 `NAO_AUTENTICADO`, `login_falho` +1, contador da senha +1, nunca 404. Com MFA, vale o mesmo, e nada de etapa `mfa`.
   - **Opcional:** no mesmo teste, o bilhete forjado ou quebrado com a senha certa de conta sem usuário ativo também dá o 401 do RF6.

**Recomendações:**
1. **W10 no segundo fator:** o `cenarios.md` que esta tarefa editou agora diz "entrada da equipe e tela do segundo fator (unidade e e2e)", mas o e2e cobre só `/entrar`. Falta um e2e em `Mfa.tsx` com o `NAO_ENCONTRADO` depois do código certo. Nessa tela o desafio já foi consumido e o formulário continua lá: se a pessoa repetir, vê "Código incorreto ou já usado". Vale o `frontend-reviewer` olhar se a tela deveria mandar para `/entrar`.
2. **E15(b) mesmo e-mail com MFA:** hoje o caso "mesmo e-mail" só roda sem MFA (`ativacao-sob-trava.int.test.ts:169`).
3. **Clique duplo:** duas entradas com a senha certa e o convite revogado em `Promise.all`, conferindo que o contador fica igual ao de antes. Isso prova a atomicidade do `desfazer` sob concorrência de verdade, e não só em sequência.
4. **Falha ao desfazer:** falta o teste de "falha ao desfazer deixa a tentativa contada" (`contador-de-tentativas.ts:174`), com o `eval` lançando e o Redis pronto.
5. **Regra 80, item 3 (uma escola não degrada outra):** falta um teste de que a trava segurada na escola B não atrasa a ativação da escola A. Hoje a (a) prova só a chave certa, não a ausência de espera entre escolas.
6. **Para o `infra-guardian`:** com MFA, o desafio é consumido antes da ativação (`mfa.service.ts:485`). Depois do 503 `TEMPO_ESGOTADO`, repetir como o `Retry-After` sugere volta 401. A ordem já existia antes desta tarefa, mas o 503 é novo aqui.
7. **E16 com MFA:** falta o caso do convite revogado **antes** do login com outro usuário ativo. Hoje só está coberto o revogado entre as etapas.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ativacao-sob-trava.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-convite-revogado.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ativacao-de-teste.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/trava-da-escola.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/erros/mensagens.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/entrar-convite-revogado.spec.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-09-25 00:39:18 · `tasks/prd-apresentacao-painel/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- E15(a) a (e)
- E16 com e sem MFA
- 4.1
- E6 (login)
- W10
- `desfazer` do contador
- Permissão: o bilhete tem de ser desta conta. Era a correção exigida na 1ª rodada.

**Cobertos:**
- **Correção exigida 1, feita.** O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-convite-revogado.int.test.ts:80-98`. Conferi pelo código que ele falha se a regra sair. Sem a conferência de conta em `convite.service.ts:127`, o convite de X chega a `login.service.ts` e o teste fica vermelho nos dois casos:
  - **Sem MFA:** não há quem ativar e Y não tem usuário ativo. O login cai nas linhas 139-145, desfaz a reserva e responde 404. O teste espera 401.
  - **Com MFA:** a condição da linha 134 fica verdadeira e o login devolve a etapa `mfa` com 200. `esperarErro(..., 401, NAO_AUTENTICADO)` pega isso, então "nada de etapa mfa" também está provado.
  - **O que cada tentativa confere:** o contador da senha de Y soma 1 e o `login_falho` soma 1.
  - **Bilhete forjado e `'nao-e-um-jwt'` (o opcional):** também estão lá. O forjado tem a checagem de que saiu diferente do original. Os dois não separam essa mutação específica, mas guardam contra o `verificar` aceitar bilhete inválido ou lançar erro, o que daria 500.
- **Recomendação 3 (clique duplo), feita com concorrência de verdade** (`:100-110`). As duas entradas vão em `Promise.all` pela HTTP. O contador fica em 1, não em 0, então um `desfazer` trocado por `zerar` seria pego.
- **Recomendação 7, feita** (`:190-202`). É o MFA com o convite revogado antes do login e outro usuário ativo. Termina `pronta` na outra escola, sem ativar o usuário do convite.
- **Recomendação 2, feita** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ativacao-sob-trava.int.test.ts:176-199`). O E15(b) "mesmo e-mail" agora roda com MFA também. O parâmetro `passo` (`:76-81`) aguenta a virada do passo TOTP entre os dois códigos, porque a janela aceita o passo seguinte. Não vejo risco de teste instável.
- **Rodei os dois arquivos agora contra o compose de teste:** 16 de 16 e 17 de 17 passaram.
- **Qualidade dos testes:** nenhum `.skip`, nenhum teste comentado, nada chama provedor de IA.
- O resto não mudou desde a 1ª rodada e continua coberto como registrado lá.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Recomendações que ficaram de fora nesta rodada.** Os motivos dados são aceitáveis. Ficam registradas para o `/validar` e o `/retro`:
   - o e2e do `Mfa.tsx`, para o `frontend-reviewer`;
   - a falha ao desfazer quando o `eval` lança;
   - a trava da escola B não atrasar a escola A (regra 80, item 3);
   - o desafio consumido antes do 503 no MFA, para o `infra-guardian`.
2. **Nome do teste de permissão.** O `it.each` diz "MFA %s", o que vira "MFA false" e "MFA true". Um rótulo como "com MFA" e "sem MFA", igual ao `LOGINS` do outro arquivo, deixa a saída mais legível.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-25 00:40:38 · `tasks/prd-apresentacao-painel/4_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. O código mexe só no fluxo de conta, usuário e convite que já existia (`usuario.desativado_em`, `convite.revogado_em`), sem mudar nenhuma coluna. O bilhete continua levando só `conta_id` e `convite_id`, e vale 30 minutos (`apps/api/src/sessao/bilhete-de-convite.ts:17`).

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok.
- `AtivacaoPorConvite.conviteDoBilhete` (`apps/api/src/sessao/convite.service.ts:426-432`) só devolve o convite quando o `contaId` do bilhete assinado é o da credencial conferida.
- Um bilhete de outra conta cai na recusa única do RF6, com `login_falho`. O teste de permissão está em `apps/api/test/login-convite-revogado.int.test.ts:80`, com e sem MFA.
- O `NAO_ENCONTRADO` só sai depois da senha certa, e com MFA só depois do código certo. A trava pega a escola pelo contexto, nunca por parâmetro do cliente (`convite.repository.ts:347-348`).

Logs: limpos.
- O diff não acrescenta nenhum log. O único logger nos arquivos tocados é o que já existia, `login.contador_no_seguro`, sem nenhum dado de pessoa.
- O teste `logSemSegredos` (`apps/api/test/login-convite-revogado.int.test.ts:47-49`) confirma que o log não leva e-mail, senha certa, senha errada, bilhete nem desafio.

Auditoria: presente onde a regra 20, item 10, exige, e nenhuma ação nova da lista foi criada.
- Quando o aceite não ativa o usuário, ele desfaz na mesma transação o uso do convite, a senha e o `convite.aceito`. É coerente, porque nada foi concedido.
- `usuario.ativado_por_convite` continua sendo gravado dentro da transação, sob a trava.
- O `NAO_ENCONTRADO` não grava `login` nem `login_falho`, porque não houve acesso nem senha errada. Isso está decidido na Tech Spec, seção 5, e coberto por teste.

Envio externo: nenhum, esta tarefa não tem IA.

Seed/fixture: sintético.
- Os e-mails dos testes são `*@escola.invalid` com UUID.
- Os nomes são "Pessoa sintética", "Coordenação Sintética Convidada", "Outra Pessoa" e "Mesma Pessoa".
- As fixtures novas do e2e (`desativarUsuario` e `revogarConviteDaEscola`, em `e2e/__fixtures__/sessao.ts:244-262`) só alteram o estado do banco de teste.

Pergunta de fechamento: a tarefa não muda o que se guarda sobre aluno nem para onde isso é enviado. O caminho do convite e do login é da equipe, e o aluno fica filtrado (`papel !== 'aluno'`) em `pendenteDoConvite` e na lista de usuários ativos. A resposta que o código já dava continua valendo.

Checagens de exposição:
- A resposta de erro é um `ErroDeDominio(NAO_ENCONTRADO)` tipado, sem dado no corpo. O teste confirma que o corpo não contém `escolaId`, `usuarioId` nem `conviteId` (`apps/api/test/login-convite-revogado.int.test.ts:43`).
- O texto na tela é o de convite inválido e não diz que a senha estava certa. O teste de unidade está em `packages/shared/src/erros/mensagens.test.ts:675-696`. O e2e confirma que a tela não mostra o nome da escola que convidou, nem o código ou o status do erro.
- O convite continua com expiração, uso único e revogação. A revogação agora vence a ativação sob a mesma trava, o que fecha a janela em que um convite revogado ainda ativava.

Bloqueantes: nenhum.

Recomendações:
1. Registrar nos furos conhecidos de `docs/lgpd.md` (ou no docblock de `login.service.ts`) um sinal que ficou de fora. Quem tem o bilhete de uma conta sem outro usuário ativo, e cujo convite foi revogado, consegue distinguir a senha certa (404) da errada (401). O alcance é limitado:
   - exige o bilhete daquela conta, que vale 30 minutos;
   - as senhas erradas continuam contando no contador por conta;
   - com o convite ainda válido, a senha certa já dava o login, que é um sinal mais forte.

   Não abre exposição nova, mas vale ficar escrito para quem mexer nesse caminho depois.
2. `revogarConviteDaEscola` (`e2e/__fixtures__/sessao.ts:258-262`) revoga todos os convites não revogados da escola. Hoje está correto, porque o e2e cria uma escola por teste. Se um dia houver escola compartilhada entre testes, filtrar pelo `conviteId`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/erros/mensagens.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-convite-revogado.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ativacao-sob-trava.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ativacao-de-teste.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/entrar-convite-revogado.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-25 00:40:48 · `tasks/prd-apresentacao-painel/4_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration nesta tarefa. As tabelas que o código toca são `convite`, `usuario`, `conta`, `auditoria` e `registro_acesso`, e nenhuma mudou de forma. Todas as linhas que a tarefa lê ou escreve são chamadas por UUID.

Queries verificadas:
- `ConviteRepository.travarEscola`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts`, pega a escola do contexto (`escolaDoContexto()`). No aceite, esse contexto é `valido.escolaId`, que vem do banco pelo hash do token (`conviteValidoPorHash`). Na ativação, é `pendente.escolaId`, que vem de `usuarioComConviteAceito(contaId, conviteId)`, presa à conta e ao convite de um bilhete que nós assinamos. Em nenhum dos dois casos a escola vem do corpo ou da query string.
- `ativarPorConvite` não mudou e continua filtrando por `escola_id` do contexto, tanto no `update` de `usuario` quanto no `exists` de `convite`.
- `usarConvitePorHash`, `definirSenhaNoAceite`, `conviteValidoPorHash` e `usuarioComConviteAceito` são os `@SemEscopo` que já existiam, com justificativa escrita. A tarefa não criou nenhum.
- `conviteDoBilhete`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`, só devolve o `conviteId` quando o bilhete é da própria conta.
- O desafio `mfa` leva só `contaId` e `conviteId`, sem a escola do convite.
- Nenhum endpoint novo. Nada nesta tarefa aceita `escolaId` do cliente.

Teste de isolamento: presente e efetivo.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-convite-revogado.int.test.ts`, o teste "permissão" usa o bilhete válido da conta X com a senha certa da conta Y. Se a checagem `verificado?.contaId === contaId` for removida, Y passa a receber 404 em vez do 401 do RF6, e o teste quebra.
- `semNadaDoConvite` e as leituras de `/v1/eu` e de `escolher` provam que a resposta, com ou sem MFA, não traz o id da escola, do usuário nem do convite. Se `usuariosAtivosDaConta` incluísse o usuário do convite revogado, os testes de `escolher` e de `pronta` quebrariam.
- A trava presa à escola certa é provada pela E15(a) em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ativacao-sob-trava.int.test.ts`, que espera a transação parada na trava daquela escola (`objid = hashtext(escolaId)`). Com a trava na escola errada, esse teste falha.
- Escolas diferentes não esperam uma pela outra: isso já estava provado em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts`, perto da linha 436, e a ativação usa o mesmo `travarEscola`.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts:77`: o contexto de fora usa `valido.escolaId`, lido fora da transação, e o de dentro usa `usado.escolaId`. Os dois só coincidem porque o `token_hash` é único. Vale um comentário curto dizendo isso, ou comparar os dois e responder `conviteInvalido()` se forem diferentes.
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts:254`: `revogarConviteDaEscola` revoga todos os convites em aberto da escola, não um id só. Não vaza nada porque é fixture sintética, mas convém prender a um `conviteId` para o e2e não depender de a escola ter um convite só.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-09-25 00:41:19 · `tasks/prd-apresentacao-painel/4_task.md`

VEREDITO: AJUSTES NECESSÁRIOS

**Estados:** faltando um estado final coerente nas duas telas. O catálogo agora traz o texto certo para o `NAO_ENCONTRADO`. Só que a entrada continua mostrando, ao lado dele, o aviso antigo que diz o contrário. E o segundo fator mantém aberto um formulário que já não tem como dar certo.

**Acessibilidade:** o texto aparece num `role="alert"` e o e2e roda o axe no estado de erro. O problema está na entrada: o leitor de tela anuncia dois alertas que se contradizem ("entre com a sua senha para concluir o convite" e "Este convite não vale mais").

**Chromebook fraco:** nada muda. A mudança fica só no catálogo compartilhado, sem pedido novo nem peso no bundle.

**Celular:** ok na entrada. O e2e roda nos projetos `chromebook` e `celular`, usa toque quando o aparelho tem, e confere a largura a 360 px. A tela do segundo fator não tem e2e nesse caminho.

**Ação oficial protegida:** não se aplica, a tarefa não mexe em nota nem em aprovação.

**Bloqueantes:**

1. **Entrada com dois avisos que se contradizem.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Entrar.tsx:66-70`, o aviso `AVISO_DO_CONVITE_PARA_CONTA_EXISTENTE` fica na tela quando a resposta é `NAO_ENCONTRADO`. Na falha, `entrarPorEmail` não limpa `avisoParaAEntrada`: ele só é zerado quando a sessão abre, em `apps/web/src/api/sessao.ts:265`. Resultado: a pessoa lê "Você já tem acesso em outra escola: entre com a sua senha para concluir o convite" e, logo abaixo, "Este convite não vale mais. Peça um convite novo à sua escola." A primeira frase também já é falsa, porque a conta não tem nenhum usuário ativo. Seria o critério 8, "erro diz o que fazer", mas com duas instruções opostas.
   - **Correção exigida:** no `catch` de `Entrar.tsx:42-43`, quando o código for `NAO_ENCONTRADO`, limpar o aviso da entrada com `definirAvisoDaEntrada(undefined)`.
   - **Teste exigido:** em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/entrar-convite-revogado.spec.ts`, depois do 404, verificar que o alerta com `AVISO_DO_CONVITE_PARA_CONTA_EXISTENTE` não está mais visível.

2. **Segundo fator: a tela continua aberta com um desafio que já foi gasto, e não há e2e desse caminho.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Mfa.tsx:50-58`, o `NAO_ENCONTRADO` só vira `definirFalha(erro)`. O desafio continua na memória da aba e o formulário continua ativo. Só que a API já consumiu o desafio antes de devolver essa resposta (`mfa.service.ts:143`, dentro de `#depoisDoCodigoCerto`). Quem tenta de novo cai em `#desafioLivre` e recebe `NAO_AUTENTICADO`, e a tela passa a dizer "Código incorreto ou já usado. Confira o código que o aplicativo mostra agora e tente de novo". Isso manda a pessoa repetir para sempre algo que nunca vai funcionar, e desmente a mensagem anterior. A própria tela já trata o desafio gasto no caso do `CONTA_SEGURADA`, logo acima, mas não trata este.
   - **Correção exigida:** no `NAO_ENCONTRADO`, chamar `esquecerDesafio()` e deixar a pessoa num estado final sem o formulário, com o texto de convite inválido. Pode ser o `SemDesafio` com esse texto ou o retorno a `/entrar` com o texto como aviso, pelo mesmo caminho do `CONTA_SEGURADA`.
   - **Teste exigido:** um e2e do caminho com segundo fator nos projetos `chromebook` e `celular`, com axe e largura, como o cenário W10 (`cenarios.md:153-165`) pede para as duas telas. Ele precisa provar o texto e provar que não sobra formulário que leve ao "Código incorreto". Hoje o segundo fator só tem teste de unidade do catálogo.

**Recomendações:**
- Registrar em `4_task.md` o que acontece com o bilhete depois do `NAO_ENCONTRADO`. Hoje ele fica na aba, então repetir a senha devolve o mesmo texto de convite inválido, o que é bom. Se alguém o apagar no futuro, a próxima tentativa vira "E-mail ou senha incorretos".
- `LoginPorCima.tsx:71` também usa `mensagemDaEntrada`. Ele nunca envia bilhete, então não recebe esse código, mas vale uma linha no comentário do catálogo dizendo que o `NAO_ENCONTRADO` só vem da entrada com convite.
- A divergência de `EntrarNaEscola.tsx` para `Entrar.tsx` e `Mfa.tsx` está certa e bem registrada. A tabela "Arquivos previstos" de `4_task.md` ainda cita `EntrarNaEscola.tsx` e poderia ser atualizada.

Não auditei a parte de API (4.1, 4.2 e 4.4). Ela fica para os guardiões de infra, tenancy e testes.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-25 00:41:35 · `tasks/prd-apresentacao-painel/4_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login

Rate limit: ok. O contador continua por conta e origem (`conhecido` ou `outro`), nunca por IP. O `desfazer` só roda depois de senha ou código certos, então não abre caminho para força bruta. O semáforo do hash é liberado antes da ativação (`ConferenciaNaVez.conferir`), e por isso a espera na trava não prende a vez de outros logins do mesmo IP.

Fila e prioridade: ok. Nada novo entra em fila, e nada demorado entra no request. O hash do aceite continua fora da transação que segura a trava.

Concorrência: protegida.
- A trava da escola é a primeira instrução do aceite e de `AtivacaoPorConvite.ativar`, e a ativação só acontece pelo `update` condicional.
- A espera é limitada pelo `statement_timeout` de 2 s (`.env.example:42`) e responde 503 `TEMPO_ESGOTADO` com `Retry-After`.
- Os testes cobrem:
  - a ordem forçada pelo gatilho de parada e pela trava segurada, com `for update nowait` provando que nenhuma linha é presa antes da trava;
  - as duas ordens do aceite contra refazer e revogar, sem 500 nem 40P01;
  - o 503 que não conta como falha;
  - o clique duplo com a senha certa.
- O `setTimeout` em `apps/api/test/ativacao-de-teste.ts:76` só espera o Redis ficar pronto. Não controla a ordem entre as operações.

Índice e paginação: ok. Não há query nova em tabela que cresce com aluno. A trava é por advisory lock e só é pega no aceite e no login com bilhete. O login de todo dia faz as mesmas consultas de antes.

Degradação de IA: não se aplica.

Migration: não se aplica. O gatilho de parada existe só no banco de teste.

Métrica e alerta: ok. `login.duracao` cobre todos os desfechos, inclusive o `NAO_ENCONTRADO` e o 503 da trava. Não há alerta novo.

Bloqueantes: nenhum.

Recomendações:
1. **`desfazer` pode descontar do lugar errado.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts:224-233`, o `desfazer` roda o `SCRIPT_DESFAZER` no Redis sempre que ele está `ready`. Se a reserva foi feita pelo seguro em memória, porque o Redis estava fora naquela hora, o script tira do Redis uma falha que ele nunca contou. Isso libera uma falha real, justamente o lado que a regra do contador proíbe. O impacto é desprezível: só acontece se o Redis voltar no meio da tentativa e com a senha certa. Mesmo assim, vale a `Reserva` guardar onde foi contada (`redis` ou `seguro`) e o `desfazer` agir só lá.
2. **MFA com a trava além do prazo.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts:147-153`, o desafio é consumido antes de `ativar`. Com o 503 da trava, a pessoa precisa refazer a senha. O caso é raro e está documentado. Se incomodar no piloto, dá para consumir o desafio na mesma transação da ativação.
3. **Sinal próprio para a espera na trava.** Hoje o 503 da trava na ativação aparece só na métrica HTTP e como `TEMPO_ESGOTADO` no log, misturado com as outras consultas lentas. Um contador dessa espera por escola ajudaria a separar trava de pool cheio no runbook (seção de `TEMPO_ESGOTADO` em `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`).

## revisor-geral · 1ª rodada · APROVADO · 2026-09-25 00:42:35 · `tasks/prd-apresentacao-painel/4_task.md`

```
VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum
Recomendações: seis, abaixo
```

**Escopo.** As subtarefas 4.1 a 4.4 estão feitas e não há nada da 5.0 (lista e uso).

**Tech Spec.** As divergências estão registradas no `4_task.md` e nenhuma foi decidida em silêncio:
- **W10.** A mensagem vai para a entrada da equipe e para a tela do segundo fator. `EntrarNaEscola.tsx` não mudou: é a entrada do aluno por matrícula e nunca recebe esse `NAO_ENCONTRADO`.
- **MFA.** A resposta vem depois do código. Isso cumpre o "senha (e código, no MFA) certos" que a seção 5 já dizia.

**Portão local.** O `conferir` respondeu: "portão local válido para o código atual (typecheck, lint, test, e2e, infra)".

**Recomendações**

1. **`apps/api/src/sessao/mfa.service.ts:149`**
   - O desafio é consumido antes da ativação.
   - Depois do 503 `TEMPO_ESGOTADO` da trava, repetir como o `Retry-After` sugere volta "Código incorreto ou já usado".
   - No `NAO_ENCONTRADO`, o formulário continua na tela com um desafio que já não vale, e o código de recuperação usado nessa tentativa fica gasto.
   - A ordem já existia antes, mas o 503 é novo nesta tarefa. Vale levar a tela a `/entrar` nesses dois casos, ou consumir o desafio só depois de a ativação terminar. Isso é da área do `frontend-reviewer` e do `infra-guardian`.

2. **`packages/shared/src/erros/mensagens.ts:41` e `:68`**
   - `MENSAGENS_DA_ENTRADA` e `MENSAGENS_DO_SEGUNDO_FATOR` também servem à entrada do operador (`apps/web/src/operacao/textos.ts:41` e `:48`).
   - Hoje a entrada do operador não devolve 404. Se um dia devolver, o operador leria "Peça um convite novo à sua escola".
   - Vale dizer isso no comentário do catálogo, ou dar ao operador um catálogo separado.

3. **`apps/api/src/sessao/contador-de-tentativas.ts:144` e `SCRIPT_DESFAZER`**
   - Se a reserva foi contada só no Redis e o seguro em memória tem um estado antigo, o seguro perde uma falha que a reserva não contou. O inverso também acontece: reserva no seguro, desfeita no Redis.
   - O efeito é contar uma falha a menos, e só depois da senha ou do código certos. Não faz mal, mas o comentário de `desfazer` promete que o contador "volta ao que era antes".
   - Basta afinar o comentário.

4. **`apps/api/src/sessao/login.service.ts:134`**
   - A condição `conviteId !== undefined && credencial.mfaAtivo && (pendente !== undefined || usuarios.length === 0)` concentra três casos numa linha.
   - Uma função com nome, do tipo "vai ao segundo fator com o convite", deixaria a regra legível.

5. **`apps/api/src/sessao/convite.service.ts:77`**
   - A trava pega a escola de `valido.escolaId`, lido fora da transação. O contexto de dentro usa `usado.escolaId`.
   - Os dois só coincidem porque o `token_hash` é único. Vale um comentário de uma linha dizendo isso.

6. **`e2e/__fixtures__/sessao.ts:516`** (`revogarConviteDaEscola`)
   - A fixture revoga todos os convites em aberto da escola. Convém prendê-la a um `conviteId`.

**Arquivos auditados**
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/4_task.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts, com os testes de unidade e de integração
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/erros/mensagens.ts, com o teste
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/trava-da-escola.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ativacao-de-teste.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/entrar-convite-revogado.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts

## test-engineer · 3ª rodada · APROVADO · 2026-09-25 01:23:04 · `tasks/prd-apresentacao-painel/4_task.md`

```
VEREDITO: APROVADO
Cenários exigidos: nesta rodada, as duas correções do frontend-reviewer: (1) na entrada, o aviso de convite sai quando chega o NAO_ENCONTRADO; (2) no MFA, depois do NAO_ENCONTRADO, o desafio é esquecido e a tela vai a um estado final, com e2e nos dois projetos, axe e largura. Mais o que essas mudanças afetam: o 503 da trava não gasta mais o desafio, porque o consumo mudou de lugar no mfa.service; a refatoração do login.service; a fixture revogarConvite presa ao usuário convidado.
Cobertos: todos.
Bloqueantes: nenhum
Recomendações: duas, abaixo
```

**Correção 1 (Entrar.tsx): feita e provada.** O teste em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/entrar-convite-revogado.spec.ts` confere que o aviso aparece antes da revogação e que, depois do 404, ele sumiu (`toHaveCount(0)`). O teste falha sem a regra: o aviso é uma variável de módulo lida a cada render (`avisoDaEntrada()`, `apps/web/src/api/sessao.ts:230`), e a nova renderização causada por `definirFalha` o manteria na tela se ele não fosse limpo.

**Correção 2 (Mfa.tsx): feita e provada.** O teste "com segundo fator" faz o caminho inteiro pela tela: configura o MFA, desativa o usuário, aceita o convite de outra escola, entra com a senha, o convite é revogado e ela manda o código certo. Ele confere:
- o 404 e a URL `/entrar`;
- o alerta com o mesmo texto de `mensagemDoConvite('NAO_ENCONTRADO')`;
- que não sobra campo de código nem "Código incorreto";
- que o nome da escola não aparece;
- axe e largura.

O describe não tem restrição de projeto, então roda em `chromebook` e `celular`. Sem o novo ramo em `Mfa.tsx`, a tela ficaria em `/mfa` com o campo de código, e as asserções de URL e de `campoCodigo` ficariam vermelhas.

**Consumo do desafio movido (mfa.service.ts:151-156): provado.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ativacao-sob-trava.int.test.ts:301-329`, a E15(e) com MFA manda o mesmo desafio de novo depois do 503, com o código do passo seguinte, e exige `pronta`. Com `consumir` de volta no início, a segunda chamada daria 401. O mesmo caso confere que o contador do código fica igual ao de antes do 503. `repetir` usa a API de prazo normal, com a trava já solta, então a asserção não é trivial.

**Refatoração de login.service.ts:** mesma lógica. As suítes E16 (`login-convite-revogado.int.test.ts`) e E15 continuam cobrindo os três ramos de `vaiAoCodigoComOConvite`: pendente, sem outro usuário e com outro usuário.

**Recomendações**

1. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-convite-revogado.int.test.ts:181`: provar que o desafio fica gasto depois do NAO_ENCONTRADO.**
   - O comentário novo em `Mfa.tsx:59` afirma que "a API já gastou o desafio", e isso vale pela ordem atual de `#depoisDoCodigoCerto`.
   - Nenhum teste de API prova isso. Se alguém passar o `consumir` para depois da checagem do convite, nada fica vermelho.
   - Basta, logo depois do 404, mandar o mesmo desafio com o código do passo seguinte e esperar 401.

2. **Concorrência no `/v1/sessao/mfa` da escola: um desafio, dois códigos válidos ao mesmo tempo.**
   - O caso é um pedido com o código do app e outro com um código de recuperação, os dois com o mesmo desafio, em paralelo.
   - A reordenação desta rodada levou o `consumir` (a trava do `jti`) para depois da ativação e da leitura dos usuários, em `mfa.service.ts:156`. Ele continua antes do `concluir`, então só uma sessão é criada. A ativação é segura pelo `update` condicional.
   - Só a suíte do operador prova esse caso (`segundo-fator-operador.int.test.ts:176`). O `mfa.int.test.ts` da escola cobre o mesmo TOTP com dois desafios e o mesmo código de recuperação com dois desafios, mas não um desafio só.
   - A falta já existia antes. Vale fechá-la agora que o ponto de consumo mudou, idealmente com o convite no desafio, afirmando uma sessão e uma ativação.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-09-25 01:23:52 · `tasks/prd-apresentacao-painel/4_task.md`

VEREDITO: APROVADO

As duas correções da 1ª rodada foram feitas e cada uma tem um e2e que a prova.

**Correção 1: dois avisos contraditórios na entrada.** Feita.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Entrar.tsx:46`, quando o código é `NAO_ENCONTRADO`, a tela chama `definirAvisoDaEntrada(undefined)` antes de `definirFalha`.
- O aviso é lido do módulo durante a renderização (linha 72). Por isso a nova renderização que `definirFalha` provoca já o remove da tela.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/entrar-convite-revogado.spec.ts:49`, o teste confere `toHaveCount(0)` do alerta com `AVISO_DO_CONVITE_PARA_CONTA_EXISTENTE` depois do 404.

**Correção 2: segundo fator com desafio gasto e formulário aberto.** Feita.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Mfa.tsx:61-66`, o `NAO_ENCONTRADO` segue o mesmo caminho do `CONTA_SEGURADA`: chama `esquecerDesafio()`, grava o aviso com o texto de convite inválido e navega para `/entrar` com `replace`.
- Não sobra formulário, e o Voltar do navegador não traz o formulário de volta. Se a tela for reaberta, o `SemDesafio` responde.
- O e2e novo está em `entrar-convite-revogado.spec.ts:58-96`. Ele confere:
  - o 404 e a URL `/entrar`;
  - o alerta com o texto de convite inválido;
  - `campoCodigo` com contagem 0;
  - a ausência de "Código incorreto" e do nome da escola;
  - largura excedente 0 e axe sem violação grave.
- Ele roda nos dois projetos, porque `playwright.config.ts` não filtra spec por projeto. O `hasTouch` escolhe entre toque e clique.
- A troca de `mfa.spec.ts` para a fixture `segundo-fator.ts` só moveu código. O comportamento não mudou.

**Estados:** ok. A entrada tem o carregando ("Entrando…" com `role="status"`), o erro e o sucesso. O formulário é a própria tela, então não há estado vazio. No segundo fator, a falta de desafio cai no `SemDesafio`.

**Acessibilidade:** o texto aparece com `role="alert"`. Os campos têm rótulo visível e o axe não acusa violação grave nos dois caminhos.

**Chromebook fraco:** o diff não muda nada que pese. São dois ramos síncronos no `catch`, sem requisição nova e sem lista.

**Celular:** os dois testes rodam no projeto `celular`, usam toque e conferem largura excedente 0. Nenhum dos fluxos exige o celular.

**Ação oficial protegida:** não se aplica. É entrada e segundo fator, sem nota nem aprovação.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `Mfa.tsx:63`, o aviso de convite inválido vai para o bloco de aviso da entrada, com estilo `pendente` (âmbar). Na entrada direta, o mesmo texto sai como falha, em vermelho. São dois tons para a mesma situação. Vale padronizar, ou registrar que foi escolha.
2. Esse aviso fica em memória até ser sobrescrito. Se a pessoa tentar de novo e receber `NAO_AUTENTICADO`, a tela mostra ao mesmo tempo "Este convite não vale mais…" e "E-mail ou senha incorretos…". As duas frases não se contradizem, mas limpar o aviso a cada novo envio em `Entrar.tsx` evita dois alertas de uma vez. Isso fica para o `/retro`.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-25 01:24:12 · `tasks/prd-apresentacao-painel/4_task.md`

VEREDITO: APROVADO

Esta rodada cobriu só o que mudou desde a aprovação anterior: `Entrar.tsx`, `Mfa.tsx`, a nova ordem em `mfa.service.ts`, o `NAO_ENCONTRADO` em `login.service.ts` e `mensagens.ts`, e o e2e novo com as fixtures. As duas recomendações da rodada anterior foram feitas. O sinal 404/401 para quem tem o bilhete está documentado no docblock de `LoginService`. A fixture agora é `revogarConvite({escolaId, usuarioId})`, com o `update` preso a `escola_id` e `usuario_id`.

**Campos pessoais tocados:** nenhum campo novo. O e-mail e a senha da conta de equipe só aparecem no e2e, com dado sintético.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok.
- O `NAO_ENCONTRADO` só sai depois da credencial certa: senha no login, código no MFA. Precisa também do bilhete preso à conta (`conviteDoBilhete(bilhete, credencial.id)`).
- Sem o bilhete, o login segue como antes, com o `NAO_AUTENTICADO` único do RF6.
- A resposta traz só o código de erro, sem o nome da escola do convite. O e2e verifica que o nome não aparece em nenhum dos dois caminhos.

**Logs:** limpos. Não entrou log novo. O único logger nos arquivos tocados é `login.contador_no_seguro`, em `contador-de-tentativas.ts:175`, e não leva dado pessoal.

**Auditoria:** presente onde a regra exige. Esta rodada não tem nenhuma ação que a regra 20, item 10, mande auditar. O convite revogado não grava `login` nem `login_falho`, como a Tech Spec da A0b, seção 5, manda.

**Exposição no cliente:**
- O desafio e o aviso da entrada continuam só em memória, em `apps/web/src/api/sessao.ts`.
- `esquecerDesafio()` apaga o desafio gasto.
- Na tela, a mensagem é o texto de convite inválido, sem código, status nem pista de que a senha estava certa.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. O e-mail usa o domínio `@educa.invalid`. `desativarUsuario` e `revogarConvite` só mexem em linhas criadas pelo próprio teste.

**Pergunta de fechamento:** esta rodada não muda o que o sistema guarda sobre aluno nem para onde isso é enviado. Ela mexe só na conta de equipe e no convite da coordenação.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Entrar.tsx`, no `NAO_ENCONTRADO`, apagar também o `bilheteDeConvite` da memória, não só o aviso. O bilhete de um convite revogado não serve mais para nada. Hoje ele fica na aba até expirar ou até o próximo login, e esquecê-lo segue o mesmo princípio de guardar o mínimo. O risco é baixo, porque ele já é preso à conta e não ativa mais nada.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-25 01:24:24 · `tasks/prd-apresentacao-painel/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (as mudanças desta rodada estão registradas em `4_task.md` e na seção 5 da `techspec.md`: o desafio do MFA agora é consumido depois da ativação, e as duas telas tratam o `NAO_ENCONTRADO`)
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test, e2e, infra)")
Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts:146-149`. Depois do 503 `TEMPO_ESGOTADO` da trava, a mensagem diz "Tente de novo em instantes". Quem repete dentro dos mesmos 30 s manda o mesmo código do app. Esse passo já ficou gravado em `mfa_ultimo_passo`, então o código é recusado como "código incorreto" e a falha entra no contador. Com código de recuperação acontece o mesmo: o código foi gasto antes da trava. O caso é raro e o docblock já o descreve. Se aparecer no piloto, a tela pode dizer, no 503 do segundo fator, que é preciso esperar o próximo código do aplicativo.
2. `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/4_task.md:109-110`. O texto ainda chama a fixture de `revogarConviteDaEscola`. O nome atual é `revogarConvite({escolaId, usuarioId})`, em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts`.
3. A 1ª recomendação do `test-engineer` da 3ª rodada vale reforçar. O comentário em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Mfa.tsx:59` diz que a API já gastou o desafio no `NAO_ENCONTRADO`. Isso depende da ordem dentro de `#depoisDoCodigoCerto`, e nenhum teste de API prova essa garantia.

As correções da rodada anterior foram conferidas.
- **Entrada da equipe (`Entrar.tsx:46`).** O aviso do aceite sai da tela quando chega o `NAO_ENCONTRADO`.
- **Segundo fator (`Mfa.tsx:61-66`).** A tela esquece o desafio e volta a `/entrar` com o texto de convite inválido, pelo mesmo caminho do `CONTA_SEGURADA`.
- **Ordem no MFA (`mfa.service.ts:151-158`).** O `consumir` roda depois da ativação e antes do `concluir`. Como é um `SET NX`, dois pedidos com o mesmo desafio continuam não abrindo duas sessões.
- **Restante.** `vaiAoCodigoComOConvite`, o comentário do `token_hash` e o do operador no catálogo, e a fixture presa ao usuário convidado foram feitos. O e2e cobre o segundo fator nos dois projetos, com axe e largura.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-25 01:24:26 · `tasks/prd-apresentacao-painel/4_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** nenhuma tabela nova nem migration nesta rodada. `convite` e `usuario` já têm `escola_id`, e o convite não varia por ano letivo.

**Queries verificadas:**
- `ConviteRepository.travarEscola`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts:80`. A escola vem de `escolaDoContexto()`. No aceite, o contexto é `valido.escolaId`, lido do banco pelo `token_hash`. Na ativação, é `pendente.escolaId`, também lido do banco. O cliente não manda a escola em nenhum dos dois.
- `ativarPorConvite`, em `convite.repository.ts:126-147`. Usa `escolaDoContexto()` no `update` e na subconsulta.
- `usuarioComConviteAceito`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:396`. Não mudou. Filtra pelo `contaId` da credencial conferida e pelo `conviteId` do bilhete ou do desafio, que nós assinamos.
- A ordem nova do `MfaService` (ativa, lê os usuários ativos e só então consome o desafio) em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts:320-327` e a função `vaiAoCodigoComOConvite` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:245` não trazem query nova nem mudam o escopo.
- A fixture `revogarConvite`, em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts:397-401`, filtra por `escola_id` e `usuario_id`. É a recomendação da 1ª rodada, feita.
- A outra recomendação também foi feita: o comentário sobre a escola da trava está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts:61`.
- Nenhum endpoint passou a aceitar `escolaId` no corpo ou na query, nenhum `@SemEscopo()` novo, e os ids continuam UUID.

**Teste de isolamento:** presente e efetivo. Não mudou desde a rodada aprovada. A trava por escola e a conta do bilhete (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-convite-revogado.int.test.ts:80-98`) continuam cobertas. O e2e novo, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/entrar-convite-revogado.spec.ts`, confere que a tela não mostra o nome da escola que convidou, nem o código ou o status do erro.

**Mensagem de erro:** o `NAO_ENCONTRADO` na entrada e no segundo fator usa o mesmo texto da tela de convite inválido, em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/erros/mensagens.ts`. O texto não diz que a senha estava certa, não indica escola e não distingue convite revogado de inexistente.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A trava usa `hashtext` do id da escola, e duas escolas podem cair na mesma chave. Aí uma espera a outra, sem que dado cruze de escola. Isso já existia antes desta tarefa e cabe ao `infra-guardian` (regra 80, item 3). Continua sem teste de que a trava da escola B não atrasa a escola A, como o `test-engineer` já registrou.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-25 01:24:36 · `tasks/prd-apresentacao-painel/4_task.md`

```
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
Recomendações: três, abaixo
```

**Correções da rodada anterior**

- **Recomendação 2 (MFA com a trava além do prazo): feita.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`, o `#depoisDoCodigoCerto` agora segue esta ordem: `pendenteDoConvite`, `ativar`, `usuariosAtivosDaConta`, e só então `consumir`. O `catch` desfaz a reserva antes de o erro subir.
  - **Com o 503 da trava**, o desafio não é gasto. A E15(e) com MFA (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ativacao-sob-trava.int.test.ts:301-329`) repete com o código seguinte e exige a ativação. Ela também confere que o contador ficou igual ao de antes.
  - **Com o `NAO_ENCONTRADO`**, o desafio continua sendo gasto, porque o `consumir` roda dentro do auxiliar, antes do `throw`. Isso bate com o que o `Mfa.tsx` supõe.
- **Recomendação 1 (desfazer no lugar errado): feita como comentário** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts`. Aceito: o efeito é uma falha a menos, e só depois de credencial certa.
- **Recomendação 3: não aplicada.** Continua abaixo.

**O que a mudança de ordem afeta, conferido**

- **Um desafio, dois fatores certos ao mesmo tempo:**
  - Os dois pedidos passam pelo fator só se forem fatores diferentes, porque `avancarPassoDoMfa` e `usarCodigoDeRecuperacao` são condicionais no banco.
  - A ativação acontece uma vez só, pelo `update` condicional.
  - O `SET NX` do `consumir` continua antes do `concluir`, então sai uma sessão só.
  - O perdedor recebe 401 e desfaz a própria reserva. Se o outro já zerou o contador, o script não o deixa negativo (`if not falhas then return 0`).
- **Reenvio de desafio já usado:** o `conferirLivre` recusa antes de qualquer ativação, porque ativar exige um fator novo e certo.
- **Telas** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Entrar.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Mfa.tsx`): não fazem pedido novo nem repetem pedido sozinhas. No Mfa, o `NAO_ENCONTRADO` esquece o desafio e volta a `/entrar`, sem deixar formulário que convide a tentar de novo.
- **`vaiAoCodigoComOConvite`** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`: a lógica é a mesma. As consultas a mais só rodam depois da senha certa.

**Recomendações**

1. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/mfa.int.test.ts`:** falta um teste com um desafio só e dois fatores certos em `Promise.all` (código do app e código de recuperação), com o convite no desafio. Ele deve provar que sai uma sessão e uma ativação. A proteção existe, mas nesta rodada o ponto de consumo mudou e a janela entre o fator e o `consumir` ficou maior. Hoje só a suíte do operador prova esse caso.
2. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-convite-revogado.int.test.ts`:** depois do 404 com MFA, reenviar o mesmo desafio com o código seguinte e esperar 401. Isso prova que o desafio foi gasto, que é o que o comentário do `Mfa.tsx` afirma. Hoje, se o `consumir` passar para depois da checagem do convite, nenhum teste fica vermelho.
3. **Continua da 1ª rodada:** criar um contador próprio para a espera na trava da escola, separado do `TEMPO_ESGOTADO` genérico. Ele entra na seção de `TEMPO_ESGOTADO` de `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md` e ajuda a separar a trava do pool cheio.

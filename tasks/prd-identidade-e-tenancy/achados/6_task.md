# Achados das revisões — `tasks/prd-identidade-e-tenancy/6_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 05:53:16 · `tasks/prd-identidade-e-tenancy/6_task.md`

VEREDITO: REPROVADO

Há um bloqueante: a ativação não tem teste de concorrência de verdade. Todo o resto da tabela da tarefa está coberto, e os testes falhariam se a regra fosse removida. Auditei só lendo o código e os testes; não rodei nada, porque o portão local estava usando o compose de teste.

**Cenários exigidos:**
- Caminho feliz: configurar, ativar, sair, entrar e só chegar a `pronta` depois do código.
- Permissão:
  - o desafio `configurar_mfa` não vale como token de acesso;
  - cada desafio só vale na rota da etapa dele;
  - professor chamando `redefinir` é recusado.
- Borda:
  - `configurar` com o MFA já ativo, usando um desafio que sobrou;
  - código errado na ativação não consome o desafio;
  - o quinto erro consome o `jti`, e o sexto, mesmo certo, é recusado;
  - o contador é da conta, e o acerto da senha não o zera;
  - navegador conhecido e navegador de outra pessoa têm contadores separados;
  - conta com escola A e B leva a `escolher` sem cookie;
  - o próprio coordenador, usuário desativado e aluno dão 202 sem efeito;
  - Redis de fila fora.
- Concorrência:
  - o mesmo TOTP em dois POST paralelos;
  - o mesmo código de recuperação em dois POST paralelos;
  - **duplo clique ou duas abas em `ativar`** (regra 80, item 7). Este eu acrescentei; não está na tabela da tarefa.
- Isolamento: redefinir com usuário só de B, com usuário de A cuja conta também está em B, com UUID inexistente e com id fora do formato, todos com a mesma resposta.
- Privacidade:
  - `no-store` em `configurar` e `ativar`;
  - o `ops:redefinir-mfa` imprime só "ok" ou o código do erro;
  - o log não traz segredo, URI, código nem e-mail;
  - a exceção nominal de `configurar` na varredura de contratos;
  - AAD com `conta_id`.

**Cobertos:** todos os itens acima, menos a concorrência em `ativar`.
- `apps/api/test/mfa.int.test.ts`: o TOTP em paralelo (linhas 307-318) e o código de recuperação em paralelo (320-335) usam `Promise.all` de verdade. As mutações que você conferiu à mão batem com o que li.
- A consumação no quinto erro se prova pela diferença entre 401 e 429 (linha 353): sem o `consumir`, o sexto pedido cairia no `reservar` e daria 429.
- O "acerto da senha não zera o contador" está nas linhas 360-366.
- `cifra-do-segredo.test.ts` cobre a AAD, a versão da chave e o byte alterado.
- `config.test.ts` cobre a chave de recuperação repetida.
- `contratos.test.ts` cobre a exceção nominal, que vale só no contrato de `configurar`.
- `redefinir-mfa.test.ts` e o bloco `ops:redefinir-mfa` da integração cobrem a saída do comando.
- Não há `.skip` nem teste comentado. Nenhum teste chama provedor de IA.

**Bloqueantes:**

1. **A ativação em paralelo não tem teste que prove a trava no banco.**
   - Onde está a trava: `apps/api/src/sessao/resolucao-de-tenant.repository.ts:169` (`isNull(conta.mfaAtivadoEm)` e `eq(conta.mfaSegredoCifrado, segredoConferido)`) e `apps/api/src/sessao/mfa.service.ts:77` (consumir antes de gravar). As notas da implementação afirmam que "duas ativações com o mesmo desafio nunca geram dois lotes de códigos".
   - Por que nenhum teste pega a remoção: tire as duas condições do `ativarMfa`, ou o `consumir` da linha 77, e nenhum teste fica vermelho. As segundas ativações em `mfa.int.test.ts:235` e `:292` são sequenciais. Elas são recusadas pela checagem `conta.ativadoEm !== null` que o service faz antes, lendo a conta, e não pelo `update` condicional.
   - O que se perde: com dois cliques ou duas abas, a pessoa pode anotar os códigos de uma resposta enquanto o banco guarda o lote da outra. Os códigos de recuperação dela deixam de valer. É exatamente o caso de borda "único coordenador perde o app autenticador e os códigos".
   - Correção exigida: um teste de integração com dois desafios `configurar_mfa` da mesma conta e um `configurar`. Com dois desafios diferentes, o `consumir` não barra nada, então só a condição do banco decide. Depois, `Promise.all` de dois `/v1/conta/mfa/ativar` com códigos válidos. O teste precisa verificar:
     - exatamente um 200 e um 401;
     - 10 linhas em `codigo_recuperacao`;
     - cada `hmac` gravado igual a `hmacDaRecuperacao` de um dos códigos devolvidos no 200.

     Recomendo um segundo caso com o mesmo desafio nas duas chamadas, que prova o `consumir` antes de gravar.

**Recomendações (não bloqueiam):**
- Um redefinir em paralelo da mesma conta, com dois cliques. Hoje ele grava dois `usuario.mfa_redefinido`, o segundo com `antes: { mfaAtivo: false }`. Não causa dano, mas vale fixar esse comportamento num teste.
- `ops:redefinir-mfa` com usuário desativado e com aluno sem conta: as notas prometem `NAO_ENCONTRADO`, mas só o usuário inexistente está testado.
- Na redefinição pela coordenação, só professor é testado como chamador recusado. Aluno está na matriz como `nunca` e é coberto pelo teste da matriz; um caso de integração é opcional.
- O teste "o contador vale em A e em B" emite dois desafios iguais, porque o desafio não carrega escola. Ele prova o contador por conta, que é o que importa. Só o nome promete mais do que prova.
- O teste de log (`mfa.int.test.ts:553`) depende de rodar por último no arquivo. Hoje isso vale, porque o Vitest roda os testes do arquivo em sequência. Pôr o fluxo e a checagem no mesmo `it`, ou num `afterAll` com a asserção, tira essa dependência de ordem.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 06:08:05 · `tasks/prd-identidade-e-tenancy/6_task.md`

VEREDITO: APROVADO

A correção exigida na 1ª rodada foi feita, e não achei bloqueante novo no diff. Não rodei os testes, porque o portão `--infra` estava rodando. Auditei só lendo, e as mutações m1 a m3 que vocês conferiram à mão batem com o que o código e o teste mostram.

Cenários exigidos (desta rodada: o diff e o que ele afeta):
- Duas ativações em paralelo em duas abas, com dois desafios `configurar_mfa`: só o banco decide, pelo `isNull(mfaAtivadoEm)` do `ativarMfa`.
- Dois cliques em paralelo com o mesmo desafio: decide o `consumir` feito antes de gravar.
- Ativar ou configurar com o MFA já ativo, usando um desafio de configurar que sobrou: agora quem recusa é só o banco, porque o `mfa.service.ts` deixou de ler antes.
- `ops:redefinir-mfa` com usuário desativado e com aluno sem conta.

Cobertos:
- **Duas abas** (`apps/api/test/mfa.int.test.ts:311-320`): dois desafios e `Promise.all` de dois `/ativar`. O teste confere a resposta `[200, 401]` e que os HMACs gravados são exatamente os dos códigos devolvidos no 200, o que também garante as 10 linhas. Sem o `isNull`, as duas passariam, porque o segundo `update` entra depois do lock da linha e apaga e regrava os códigos. Então o teste fica vermelho. E como a leitura prévia saiu do service, ele prova o banco mesmo se as duas chamadas acabarem em série.
- **Dois cliques** (`mfa.int.test.ts:322-334`): o mesmo desafio em paralelo, com a mesma checagem de `[200, 401]` e dos HMACs. Sem o `consumir`, a trava do banco sozinha ainda dá `[200, 401]`, mas a asserção final pega o erro. Ela apaga o MFA por SQL e chama `configurar` com o mesmo desafio, que precisa dar 401; sem o `consumir`, o desafio continua livre e o teste fica vermelho. A m3 se confirma.
- **MFA já ativo** (`mfa.int.test.ts:284-296`): sem a leitura prévia, o teste passa a exercitar o `where` de `gravarSegredoDeMfa` (`resolucao-de-tenant.repository.ts:154`) e o de `ativarMfa` (`:169`). Também confere que o segredo, o passo e os 10 códigos não mudam. A m1 e a m2 se confirmam.
- **Ops** (`mfa.int.test.ts:552-561`): o desafio desativado e o aluno saem com `NAO_ENCONTRADO` e código 1, o MFA do desativado continua intacto e a auditoria da escola fica vazia.
- Não há `.skip`, `.only` nem `todo` nos arquivos da tarefa, e nenhum mock esconde a regra: é HTTP real contra Postgres e Redis reais.

Bloqueantes: nenhum.

Recomendações:
1. **Condição do segredo sem teste isolado.** A condição `eq(conta.mfaSegredoCifrado, segredoConferido)` (`resolucao-de-tenant.repository.ts:169`) só foi mutada junto com o `isNull` na m1. Se só ela sair, nenhum teste fica vermelho. O risco que ela evita é real: um `configurar` numa aba entre a conferência e a gravação do `ativar` em outra ativaria um segredo que a pessoa nunca confirmou, e ela ficaria trancada fora. Pelo HTTP isso não se reproduz de forma determinística. O caminho barato é um teste de integração do repository: chamar `ativarMfa` com um `segredoConferido` diferente do gravado e esperar `false`, sem MFA ativo e com zero códigos.
2. **Recusas só pelo status.** Nos dois casos de concorrência, o 401 é conferido só pelo status (`mfa.int.test.ts:317` e `:328`). Vale passar a resposta recusada por `esperarNaoAutenticado`, que também confere o código `NAO_AUTENTICADO` e que não saiu cookie. Os outros testes do arquivo já fazem assim.
3. **Nota para o `revisor-geral` e o `infra-guardian`, sem bloquear.** Sem a leitura prévia, um desafio `configurar_mfa` que sobrou numa conta com MFA ativo passa a conferir o TOTP do segredo ativo sem passar pelo `ContadorDeTentativas`. Código certo e errado respondem os dois 401, então hoje não dá para distinguir um do outro pela resposta, e o prazo do desafio limita a janela. Vale uma linha no comentário de `MfaService.ativar` dizendo isso, para ninguém depois fazer o 401 do "já ativo" virar outra resposta.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/mfa.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`

## test-engineer · 3ª rodada · APROVADO · 2026-09-18 06:31:25 · `tasks/prd-identidade-e-tenancy/6_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos das duas rodadas anteriores. Nesta rodada conferi só o diff e as três recomendações da 2ª rodada. Não rodei nenhum teste porque o portão `--infra` está com o compose ocupado. Tudo foi auditado pela leitura do código.

**Cobertos:**

1. **Condição do segredo com teste isolado: feita.** O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts:145-164`.
   - A conta começa com `mfa_ativado_em` nulo. O primeiro `ativarMfa` recebe um segredo diferente do gravado, então esse é o único filtro da cláusula em `resolucao-de-tenant.repository.ts:169` que recusa.
   - Se `eq(conta.mfaSegredoCifrado, segredoConferido)` for tirado, o `update` passa, a função devolve `true` e o teste falha na linha 153. Depois ainda falharia na 158, com MFA ativo e 10 códigos gravados. Isso bate com a mutação que vocês conferiram à mão.
   - A segunda chamada, com o segredo gravado, devolve `true`. Ela prova que a primeira recusa veio do segredo e não de alguma armadilha da montagem.
   - A conta é apagada no `finally` e não fica resíduo entre testes.
2. **Recusada da ativação em paralelo com código e sem cookie: feita.** Está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/mfa.int.test.ts:318` e `:330`.
   - As duas chamadas continuam em paralelo de verdade, com `Promise.all`, tanto no caso "duas abas" quanto no "dois cliques".
   - `esperarNaoAutenticado` (linhas 168-172) confere o status 401, o código `NAO_AUTENTICADO` e `setCookie` vazio.
   - O `sort()` já garante que exatamente uma chamada falha, então o `for` sobre `filter` nunca fica sem nada para conferir.
3. **"Já ativo" decidido só no banco registrado: feito.** O registro está nas notas de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/6_task.md:157-161`, e não houve mudança no código de produção.

**Não encontrei:** `.skip`, `.only`, teste comentado nem mock que esconda a regra nos dois arquivos.

**Bloqueantes:** nenhum.

**Recomendações:**
- Em `resolucao-de-tenant.repository.int.test.ts:160`, depois da ativação com o segredo certo, dá para conferir também `codigos: '10'` e `ativo: true` no banco, em vez de só o `true` da função. Isso não bloqueia: o teste de ponta em `mfa.int.test.ts:295` já cobre essa gravação.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 06:42:34 · `tasks/prd-identidade-e-tenancy/6_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `codigo_recuperacao` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0007_codigo_recuperacao.sql`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/codigo-recuperacao.ts`). Não tem `escola_id`, e isso segue o desvio declarado na Tech Spec, seção 6: o código pertence à `conta`, que é global. A tabela não varia por período, então dispensa `anoLetivoId`. O id é UUID (`uuidv7()`). A FK para `conta` usa `on delete cascade`. A migration só acrescenta.

Queries verificadas:
- **Métodos novos da `ResolucaoDeTenantRepository`:** `mfaDaConta`, `gravarSegredoDeMfa`, `ativarMfa`, `avancarPassoDoMfa`, `usarCodigoDeRecuperacao`, `travarContaParaRedefinir`, `apagarMfa` e `escolaDoUsuarioParaOperador`. Os oito têm `@SemEscopo` com justificativa, e o teste unitário confere a lista fechada de métodos e o tamanho mínimo de cada justificativa. Somando os anteriores, o módulo tem 13 métodos sem escopo, dentro do teto de 16 que a Tech Spec declara.
- **Origem do `contaId` no fluxo de MFA:** vem sempre do desafio assinado e verificado (`verificarDesafio` mais `conferirLivre`), nunca do corpo da requisição.
- **`RedefinicaoDeMfaRepository.contaDoUsuarioAtivo`:** filtra por `usuario.escolaId` lido do contexto. Sem escola no contexto, lança erro em vez de devolver dado.
- **`RedefinicaoDeMfa.pelaCoordenacao`:** a escola vem de `sessaoDaRequisicao()`. A redefinição só acontece se todos os usuários ativos da conta forem dessa escola, conferidos com a conta travada por `FOR UPDATE`.
- **`redefinirMfaPeloOperador`:** a escola sai do usuário alvo, nunca de argumento. Cada escola recebe o registro de auditoria com o próprio usuário dela como entidade, sem citar a outra.
- **`ConclusaoDeLogin.#criarSessao`:** cria a sessão num contexto que só tem a escola do usuário, protegido pela FK composta.
- **Entrada vinda do cliente:** nenhum endpoint aceita `escolaId`. O esquema é `.strict()`, e o teste confirma que `{ finalidade, escolaId }` recebe 400.
- **Respostas:** a redefinição responde 202 sem corpo em todos os casos (outra escola, inexistente, id `1837`, conta que também está em outra escola, sucesso). Professor recebe 404, como rota inexistente. No MFA, toda recusa é `NAO_AUTENTICADO`.
- **Camada de rede:** nada novo nela.

Teste de isolamento: presente e efetivo. Arquivo: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/mfa.int.test.ts:436`. Fiz a mutação de cabeça: sem `eq(usuario.escolaId, ...)`, a conta `soDeB` passa a ser encontrada. A conferência de escolas ativas ainda barra o apagamento, mas grava `usuario.mfa_redefinicao_recusada` para `soDeB` na auditoria de A. O `toEqual` de `auditoriaDeMfa(escolaA)` falha. Sem a conferência de escolas ativas, a asserção `mfaNoBanco(emAeB.contaId)` com o MFA ainda ativo falha. As duas camadas estão cobertas.

Bloqueantes: nenhum.

Recomendações:
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/redefinicao-de-mfa.ts` (`pelaCoordenacao`), o registro `usuario.mfa_redefinicao_recusada` na auditoria de A mostra à coordenação de A que a pessoa tem usuário ativo em outra escola, mesmo sem dizer qual. Isso foi aceito na Tech Spec para a escola saber que deve recorrer ao operador. Vale deixar essa exposição mínima escrita em `docs/lgpd.md` ou na seção 5 da Tech Spec, para o `/validar` não reabrir a discussão.
2. Na mesma função, a recusa grava na auditoria e o "não encontrado" não grava nada. A resposta é idêntica, mas o tempo de resposta pode diferir um pouco. O risco é baixo porque o alvo é da própria escola. Fica para o `/retro` se o caminho vier a atender alvo de outra escola.
3. O módulo de sessão já tem 13 dos 16 `@SemEscopo` que a Tech Spec admite. Vale o `/retro` acompanhar isso antes da 7.0 (convite) e da 12.0, para o teto não ser ultrapassado sem uma revisão da seção 6.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 06:42:44 · `tasks/prd-identidade-e-tenancy/6_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** todos são da conta do coordenador, nenhum é de aluno.
- `conta.mfa_segredo_cifrado`, `mfa_chave_versao`, `mfa_ativado_em` e `mfa_ultimo_passo`. As colunas já existiam; esta tarefa passa a gravar nelas.
- A tabela nova `codigo_recuperacao` (`conta_id`, `hmac`, `usado_em`).
- `conta.email` é lido em `mfaDaConta`, mas só para o HMAC do `educa_dispositivo` e o sufixo do contador. Não sai em resposta nem em log.

**Fora da tabela de dados do docs/lgpd.md:** nada. A linha "Segredo TOTP cifrado e HMAC dos códigos de recuperação" (`/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:53`) cobre tudo, com finalidade, base legal e retenção.

**Autorização por objeto:** ok.
- **Redefinição pela coordenação.** O alvo é procurado só na escola do contexto (`redefinicao-de-mfa.repository.ts:106`). A conta é travada com `FOR UPDATE` e a escola de todos os usuários ativos dela é conferida antes de apagar. Se a conta tem usuário em outra escola, nada muda e a recusa vai para a auditoria de A sem dizer qual escola.
- **Resposta sempre igual.** Dá 202 em todos os casos. Para id malformado também, e a finalidade é validada antes do id, então a ordem das checagens não revela nada.
- **Professor.** Recebe 404, como rota inexistente.
- **Configurar, ativar e entrar.** As três rotas exigem desafio assinado da etapa certa, com o `conta_id` tirado do token e nunca do cliente, e toda recusa responde o mesmo `NAO_AUTENTICADO`.

**Logs:** limpos.
- `CHAVES_PESSOAIS` já cobre `uri`, `segredo`, `codigo`, `recuperacao` e `codigosRecuperacao` (`packages/nucleo/src/log/logger.ts:51-55`).
- O teste de log do `mfa.int.test.ts:596` junta tudo o que foi enviado e recebido (e-mails, segredo base32, URI, códigos de recuperação, desafios e cookies) e confere que nada aparece no log do fluxo inteiro. Também confere que não há `otpauth:` nem e-mail.
- `ops:redefinir-mfa` imprime só "ok", `NAO_ENCONTRADO`, o nome da opção inválida ou o `ERRO_INTERNO` com `resumirErro`.

**Auditoria:** presente.
- `usuario.mfa_redefinido` tem finalidade em enum. O pedido do operador é gravado só como número em `depois.pedidoDoOperador`, e `autor_operador` é preenchido.
- Na ação do operador, o registro vai para cada escola em que a conta tem usuário ativo, com o usuário daquela escola como entidade.
- `usuario.mfa_redefinicao_recusada` registra o caso da conta em várias escolas.
- `acoes.ts` recusa texto livre nos dois registros.

**Envio externo:** nenhum. Não há chamada de IA nem de terceiro.

**Seed/fixture:** sintético. `.env.example` e `compose.yml` usam chaves `educa_local_sintetica_*`, e os testes usam `@escola.invalid` e o nome "Pessoa sintética".

**Os pontos que você pediu para olhar:**
- **Cifra do segredo.** AES-256-GCM com IV de 12 bytes sorteado a cada cifra, `conta_id` em minúsculas como AAD e chave derivada por HKDF-SHA256 com rótulo próprio. O boot recusa chave curta ou ausente.
- **Códigos de recuperação.** A chave do HMAC é própria e o boot recusa quando ela repete outra chave. O banco tem `CHECK` de 43 caracteres, então o código nunca é gravado em claro.
- **`no-store`.** Está em `configurar`, `ativar` e `/v1/sessao/mfa`.
- **Exceção da varredura de contratos.** É nominal, só para `esquemaRespostaConfigurarMfa.segredo`, e há teste provando que o mesmo campo reprova em outro contrato.
- **URI do TOTP.** Leva o emissor `Educa.ia` e o rótulo fixo `coordenação`, sem nome, e-mail nem escola.
- **`educa_dispositivo`.** Só é gravado em `pronta`, dentro da `ConclusaoDeLogin`. Nas etapas com desafio o array de cookies sai vazio.
- **Códigos de erro.** Os erros são curtos e tipados. `SegredoNaoDecifra` carrega mensagem fixa, sem dado.
- **Pergunta de fechamento.** Esta tarefa não guarda nada de aluno. A pergunta continua respondível: o segredo e os códigos saem com a conta (`on delete cascade`), e a auditoria aponta por `usuario_id`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A retenção na linha 53 do `docs/lgpd.md` diz "até desativar a conta ou redefinir o MFA". A redefinição apaga de fato, mas nenhum código apaga o segredo e os códigos quando todos os usuários da conta são desativados. Vale registrar isso para a tarefa de fim de vínculo ou para o expurgo, para que a retenção declarada tenha código que a cumpra.
2. `configuracao-de-login.ts` compara `IDENTIDADE_CHAVE_RECUPERACAO` só com a chave de cifra da versão atual. Uma versão anterior ainda declarada pode ter o mesmo texto sem o boot recusar. O HKDF já separa os bytes, mas conferir contra todas as versões deixaria a regra "chave própria" sem exceção.
3. O teste de log (`mfa.int.test.ts:596`) depende de rodar depois dos outros no mesmo arquivo. Se ele passar a rodar sozinho ou em outra ordem, deixa de provar alguma coisa. Uma asserção de que `segredosVistos` não está vazio antes da varredura torna essa dependência explícita.

Arquivos principais auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/cifra-do-segredo.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/segundo-fator.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/redefinicao-de-mfa.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/redefinicao-de-mfa.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/redefinir-mfa.controller.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/redefinir-mfa.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/mfa.int.test.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 06:43:44 · `tasks/prd-identidade-e-tenancy/6_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login (etapa MFA) | migration

Rate limit: ok. O código errado conta no `ContadorDeTentativas`, cuja chave é `HMAC(conta_id)` e nunca o IP. A reserva é um script Lua atômico, então dez códigos em paralelo não passam de cinco conferências. O limite por IP da `@RotaAnonima` é o de volume que já existia desde o F0 (3000/min) e não é a proteção da conta. `redefinir` passa pela guarda por usuário e por escola.

Fila e prioridade: ok. Não há job. A chave AES sai do HKDF uma vez, no boot. Por request só rodam AES-GCM e HMAC, que são baratos. O argon2 fica de fora da etapa MFA.

Concorrência: protegida. Cada caso é decidido no banco ou no Redis:
- **Passo do TOTP:** `update … where mfa_ultimo_passo < $passo`.
- **Código de recuperação:** `update … where usado_em is null`.
- **Ativação:** `where mfa_ativado_em is null and mfa_segredo_cifrado = conferido`.
- **Desafio:** `SET NX` no `jti`.
- **Redefinição:** `FOR UPDATE` na conta.

Há teste de concorrência com `Promise.all` para a ativação em dois cliques e em duas abas, para o TOTP e para o código de recuperação.

Índice e paginação: ok. `codigo_recuperacao` é coberta pelo `unique (conta_id, hmac)`, que também serve à FK com cascade. A busca de usuários por conta usa o `usuario_conta_idx`. Não há listagem.

Degradação de IA: não se aplica.

Migration: compatível. A 0007 só cria uma tabela nova e vazia. A FK trava `conta` por um instante, e a validação é instantânea porque a tabela está vazia. As três variáveis obrigatórias estão em `.env.example` e em `infra/compose.yml`, com `:?`.

Métrica e alerta: ok. A latência vem do `http.server.request.duration` global, e a conta segurada pelo MFA incrementa `login.conta_segurada`, que já tem painel. Nenhum alerta novo.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/telemetria/metricas.ts:38`: o `login.conta_segurada` agora soma senha e MFA sem rótulo, e o comentário ainda diz "senha errada repetida". Um rótulo `etapa` (`senha` ou `mfa`) separaria o ataque ao segundo fator, que só acontece com a senha já comprometida, do erro comum de senha. O comentário deve ser corrigido junto.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/redefinicao-de-mfa.ts:31-41`: se dois coordenadores redefinirem o mesmo alvo ao mesmo tempo, o `FOR UPDATE` põe um atrás do outro e os dois gravam `usuario.mfa_redefinido`. O segundo registro sai com `antes.mfaAtivo=false`. Não quebra nada, mas duplica a auditoria. Pode-se deixar de gravar quando `conta.mfaAtivo` já é `false`, ou manter e declarar isso no teste.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts:71-76`: na `ativar`, o TOTP é conferido fora do contador. Hoje é aceitável: a resposta não serve de oráculo (é sempre 401 com MFA ativo) e o desafio vence em 5 min. Se um dia a resposta de "já ativo" mudar, isso vira bloqueante. Um teste que fixe o 401 idêntico para código certo e errado nesse caso deixaria a garantia explícita.
- O cenário de carga não entra pelo login real (`infra/scripts/carga.ts` usa sessão sintética). Na calibração da 16.0, vale incluir alguns coordenadores passando por senha e MFA na rajada das 7h30.

Os testes não foram rodados, porque o portão `--infra` estava em execução com o compose de teste. A auditoria foi feita só pela leitura do código.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 07:12:13 · `tasks/prd-identidade-e-tenancy/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Os desvios da letra da tarefa estão escritos em "Notas da implementação", nenhum foi decidido em silêncio: finalidade como código com o pedido do operador em `depois.pedidoDoOperador`, a ativação não abre sessão, o operador age quando a conta também está em outra escola, e `/v1/turmas` foi trocada pelas rotas que já existem.
Portão local: carimbo válido. Conferi depois que o portão terminou: "portão local válido para o código atual (typecheck, lint, test, infra)".
Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/redefinicao-de-mfa.ts:39`: a redefinição apaga o segundo fator mas não encerra as sessões abertas de quem foi redefinido. Com a finalidade `suspeita_de_acesso_indevido`, uma sessão de um intruso continua valendo até vencer. Nem a tarefa nem a Tech Spec pedem isso. Vale levar a pergunta ao Joaquim ou à Tech Spec, em vez de decidir na próxima tarefa.
2. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/redefinicao-de-mfa.ts:30`: o alvo pode ser um professor, que tem conta mas nunca tem MFA. Nesse caso grava-se `usuario.mfa_redefinido` com `antes: { mfaAtivo: false }`, e esse registro não diz nada. A sugestão é não gravar nada, sem efeito, quando o MFA do alvo não está ativo, ou quando o papel dele não é coordenador. Tanto faz qual das duas, desde que a resposta continue 202.
3. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts` (`escolaDoUsuarioParaOperador`): esta leitura sem escopo não está na tabela da seção 6 da `techspec.md`. A tarefa pede que o comando "abre o contexto da escola do usuário", então a leitura é necessária, mas falta a linha na tabela. A contagem "dezesseis métodos" do texto também precisa ser revista.
4. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/escola.ts:24`: a reexportação só serve a `escola.test.ts`. É melhor apontar o import do teste para `./comando.js` e apagar a reexportação, que é código morto.
5. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts:127-130`: `SegredoNaoDecifra` não é erro de domínio e vira 500 genérico. Isso acontece, por exemplo, quando uma versão de chave sai do ambiente enquanto ainda há segredo cifrado com ela. Não vaza nada, mas um evento de log ou uma métrica própria ajudaria a pessoa que opera sozinha a achar a causa.
6. O `--pedido` só aceita número (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/redefinir-mfa.ts:41`). Se o protocolo real da escola for alfanumérico, como "OF-2026/123", o comando não serve. Essa decisão de produto está nas notas e vale confirmar com o Joaquim antes do piloto.

## revisor-geral · 2ª rodada · SEM VEREDITO · 2026-09-18 08:04:52 · `tasks/prd-identidade-e-tenancy/6_task.md`

Pode ignorar esse aviso: quem falhou foi só o comando que eu tinha deixado rodando para esperar o portão terminar. O portão em si terminou verde, e o `conferir` que rodei depois respondeu "portão local válido para o código atual (typecheck, lint, test, infra)".

O veredito continua **APROVADO**, sem bloqueantes, e as recomendações não mudam.

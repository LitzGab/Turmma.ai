# Achados das revisões — `tasks/prd-identidade-e-tenancy/13_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 14:09:28 · `tasks/prd-identidade-e-tenancy/13_task.md`

VEREDITO: REPROVADO

Cenários exigidos: os 11 da tabela "Testes que provam a regra" do 13_task.md, mais as regras declaradas nas "Notas da implementação" e as bordas do PRD (conta pessoal, e-mail recriado para outra pessoa, escola com dois domínios, escola que revoga o app no meio do ano).

Cobertos: caminho feliz com ligação, auditoria, sessão `externo` e segunda entrada pela ligação; Microsoft por `oid`+`tid` com escopo `profile`; aluna sem ligação sem nenhuma linha nova; professor sem `email_verified`; coordenador pelo e-mail; e-mail recriado, em sequência e em paralelo; professor desativado; dois domínios, e o segundo recusado quando só o primeiro está cadastrado; dois retornos em paralelo com `Promise.all` real (uma ligação só); privacidade, varrendo o log e todas as tabelas; isolamento do `?slug=` de B com o cookie de A; B com o `hd` de A não recebe a aluna de A; cookie ausente, alterado, de outra chave, vencido ou de outro início; `iniciar` com 404 e sem cookie; `access_denied`; `oidc-falso` pausado (timeout de 5 s, com a matrícula respondendo em menos de 3 s); discovery sem cache de falha, numa API nova; `PUT /v1/escola/provedores` com permissão (404 para professor e aluno), isolamento, entrada inválida, concorrência real e auditoria por ids; repository com escopo, FK composta e os dois índices únicos. Nada de `.skip`, nenhum mock da lib, nenhum provedor pago.

Bloqueantes:

1. **Conta Google pessoal sem `hd`: o teste passaria mesmo sem a regra.** Está em `apps/api/test/sessao-externa.int.test.ts:214-220` e `infra/oidc-falso/config.json:49-52`.
   - **O problema:** o comentário da linha 214 diz que cada conta traz o e-mail verificado de um professor da escola. Não vale para `google-conta-pessoal`: ela traz `conta.pessoal.ficticia@gmail.com`, e nenhum professor da escola tem esse e-mail.
   - **O que isso deixa passar:** se a conferência de `externa.service.ts:150` for afrouxada para aceitar conta sem `hd`, a recusa continua acontecendo, porque `professorPeloEmail` não acha ninguém. O teste fica verde.
   - **O ataque é real:** dá para criar uma conta Google pessoal com o e-mail institucional da professora. Ela vem sem `hd` e com `email_verified: true`.
   - **Correção exigida:** um usuário sintético no `oidc-falso` sem `hd`, com `email_verified: true` e o e-mail de um professor cadastrado na escola do teste (por exemplo `EMAIL_PROFESSORA_A`, com `sub` próprio). Ele entra no cenário RF8 com a mesma recusa, sem ligação e sem sessão.

2. **Conta já ligada com o domínio retirado pela escola: nenhum teste prova a recusa.** A regra está em `apps/api/src/sessao/externa/externa.service.ts:150-155`.
   - **O que está sem prova:** a regra diz que o `hd` ou o `tid` é conferido contra `provedor_escola` também para quem já tem ligação. É assim que a coordenação corta o acesso com `PUT /v1/escola/provedores`, e o service promete que a troca "vale no login seguinte".
   - **Onde os testes param:** todos os logins com ligação (professora na segunda vez, aluna ligada, isolamento em A) rodam com o domínio liberado. O teste de repository ("domínio retirado deixa de valer") só prova a query, não a ordem das conferências.
   - **O que isso deixa passar:** se a conferência de domínio for movida para depois do `repositorio.ligacao(chave)`, ou pulada quando existe ligação, nenhum teste falha.
   - **Correção exigida:** um teste de integração em `sessao-externa.int.test.ts`:
     - a professora (ou a aluna) é ligada e entra;
     - a coordenação retira o domínio pelo `PUT /v1/escola/provedores`, ou grava `removido_em`;
     - a mesma conta recebe a recusa `conta_externa_nao_ligada`, sem nova sessão.

Recomendações (não bloqueiam):
- **Tenant pessoal no login:** a recusa explícita do tenant de conta pessoal em `externa.service.ts:150` não tem teste próprio. Em `sessao-externa.int.test.ts:222`, esse tenant nem está cadastrado, então é `dominioLiberado` quem recusa. As Notas dizem que o login recusa de novo. Para provar, gravar `9188040d-…` direto em `provedor_escola` e mostrar que `microsoft-conta-pessoal` continua recusada.
- **Uma busca de discovery por vez:** a promessa compartilhada por provedor não tem teste. Sugestão: dois `iniciar` em paralelo numa API nova e uma contagem de buscas, ou um teste unitário do adaptador com `fetch` do `oidc-falso` observado.
- **Filtro de provedores em `GET /v1/escolas/:slug/acesso`:** o filtro por provedor ligado na configuração (`acesso-da-escola.service.ts`) não é exercitado. Todos os testes ligam os dois provedores. Falta um caso com escola liberando Microsoft e só Google configurado.
- **Métrica:** `login.externo{resultado}` não tem asserção nos testes de integração, embora o `MedidorDeTeste` esteja montado. Vale conferir `entrou`, `recusado` e `provedor` (regra 80, item 10).
- **Comentário:** corrigir o de `sessao-externa.int.test.ts:214` junto com o bloqueante 1, para ele voltar a descrever os dados.
- **Borda da revogação no PRD** ("escola revoga o app"): a matrícula continuando de pé só é provada no teste de timeout. Pode valer a mesma checagem da matrícula no teste de `access_denied`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-externa.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/provedores-da-escola.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/externa/conta-externa.repository.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/externa/externa.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/externa/openid-client.adapter.ts
- /home/joaquimdp/Documentos/git/Educa.ia/infra/oidc-falso/config.json

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 14:24:49 · `tasks/prd-identidade-e-tenancy/13_task.md`

VEREDITO: APROVADO

Cenários exigidos (desta rodada, as duas correções da 1ª):
1. Conta Google pessoal sem `hd`, com `email_verified: true` e o e-mail de um professor da escola, no cenário RF8: mesma recusa, nenhuma ligação, nenhuma sessão.
2. Conta já ligada que perde o domínio: a conta entra, a coordenação retira o domínio, e a mesma conta recebe `conta_externa_nao_ligada` sem ganhar sessão nova.

Cobertos:
1. **Feita.** O usuário `google-pessoal-com-email-da-professora` está em `/home/joaquimdp/Documentos/git/Educa.ia/infra/oidc-falso/config.json`: sem `hd`, com o e-mail `professora.a@...` e `email_verified: true`. No teste RF8 (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-externa.int.test.ts:219-249`), a professora com `EMAIL_PROFESSORA_A` é criada na escola (linha 226) antes da tentativa (linha 234). O teste confere que as 5 respostas são iguais, que não há sessão nem `conta_externa`, que houve 5 `login_falho` e que a métrica de recusa subiu 5.
   - Prova de que falharia sem a regra: se as linhas 150-151 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/externa/externa.service.ts` fossem retiradas, a conta seguiria para `professorPeloEmail` (linha 161), seria ligada e abriria sessão. Aí as asserções das linhas 242-243 do teste quebrariam.
2. **Feita.** O teste está em `sessao-externa.int.test.ts:259-279`. A professora e a aluna, já ligadas, entram. Depois o coordenador faz `PUT /v1/escola/provedores` deixando só o segundo domínio. As duas recebem a recusa, cada uma continua com 1 sessão (nenhuma nova) e as ligações ficam.
   - Prova de que falharia sem a regra: se a conferência do domínio viesse depois da busca da ligação (linha 154 do service) ou só valesse na primeira ligação, as duas entrariam e o teste quebraria.
   - Manter um domínio na lista é o que faz o teste provar a conferência no retorno, e não só o 404 do `iniciar`, que também é conferido com a lista vazia.
3. **As recomendações da 1ª rodada foram atendidas.**
   - Tenant de conta pessoal da Microsoft gravado direto na lista da escola (linhas 251-257): prova a cláusula `TENANT_DE_CONTA_PESSOAL_MICROSOFT` da linha 150 do service, que a lista sozinha não barraria.
   - Microsoft desligada no ambiente (linhas 483-499).
   - Delta da métrica `provedor`, e o login por matrícula continua funcionando depois do `access_denied` (linhas 462-481).
   - Delta da métrica `entrou` no caminho feliz (linha 197).

No que mudou não achei `.skip`, teste comentado, mock escondendo a regra nem provedor pago: tudo roda contra o oidc-falso do compose.

Bloqueantes: nenhum.

Recomendações:
- O trecho `conta.dominio === undefined` na linha 150 do service não tem prova própria. Se só ele fosse retirado, `dominioLiberado('google', undefined)` provavelmente devolveria `false` e o RF8 passaria do mesmo jeito. O comportamento está garantido, mas a cláusula é redundante no teste. Vale um teste de unidade do `#decidir` com um repositório que responde `true`, ou aceitar a redundância como defesa em profundidade.
- A revogação só é testada no Google. Um caso igual para a Microsoft (tenant retirado de uma conta já ligada por `oid`/`tid`) fecharia a simetria.
- O teste de revogação não confere se a troca de lista pelo PUT gera auditoria nem se grava `removido_em`. Isso pertence ao teste de `provedores-da-escola`, não a este arquivo.

## tenancy-guardian · 1ª rodada · REPROVADO · 2026-09-18 14:35:57 · `tasks/prd-identidade-e-tenancy/13_task.md`

VEREDITO: REPROVADO

Tabelas verificadas:
- `conta_externa` tem `escola_id`. Seu id é UUID (`uuidv7`). A FK composta `(escola_id, usuario_id)` aponta para `usuario(escola_id, id)`. Os únicos começam por `escola_id`. Não tem `ano_letivo_id`, o que está certo: a ligação da conta não varia por período.
- `provedor_escola` tem `escola_id`. Seu id é UUID. O único parcial começa por `escola_id`. Não tem `ano_letivo_id`, o que está certo: é configuração da instituição.

Queries verificadas:
- Em `ContaExternaRepository`, os métodos `dominioLiberado`, `provedorLiberado`, `ligacao`, `professorPeloEmail` e `ligar` tiram a escola do contexto com `exigirEscolaDoContexto`. Em `professorPeloEmail`, a `conta`, que é global, só é alcançada a partir de `usuario` já filtrado pela escola do contexto e pelo papel professor. Não usa `@SemEscopo` e não precisa.
- Em `ProvedoresLiberadosRepository`, os métodos `travarEscola`, `liberados`, `retirar` (filtra pela escola e pelos ids) e `liberar` usam a escola do contexto.
- `AcessoDaEscolaRepository.provedoresLiberados` usa a escola aberta pelo slug. Devolve só o tipo do provedor.
- `RegistroDeAcessoRepository.gravarFalha` grava na escola do contexto, que é a do cookie.
- No retorno do login, a escola sai só do cookie `educa_oidc` cifrado (AES-GCM com dado autenticado, prazo de 5 minutos). A query é ignorada, e há teste que prova isso (`?slug=` de B com cookie de A).
- `PUT /v1/escola/provedores` usa esquema estrito. Um `escolaId` no corpo ou num item é recusado com 400, e há teste disso.
- `iniciar` e as recusas respondem igual. Provedor desconhecido, slug inexistente e escola que não liberou dão todos o mesmo 404. Toda recusa redireciona para o mesmo `conta_externa_nao_ligada`. Professor e aluno recebem 404 no PUT.
- Não há `@SemEscopo` novo nem consulta da camada rede nesta tarefa.

Teste de isolamento: presente e efetivo para `ContaExternaRepository`, `ProvedoresLiberadosRepository` e para o login ponta a ponta. Presente mas inútil para `AcessoDaEscolaRepository.provedoresLiberados`.

Bloqueantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/acesso-publico.repository.ts:17-22` (`provedoresLiberados`), com o teste em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-escola.int.test.ts:46-52`.
  - **O que está errado:** é uma consulta nova com escopo, e nenhum teste quebra com certeza se o `eq(provedorEscola.escolaId, ...)` for tirado.
    - O teste de isolamento de `acesso-da-escola` espera `provedores: []` para A e para B, mas nenhuma das duas escolas libera provedor. Ele só falharia sem o escopo se, por acaso, já houvesse linha ativa de outra escola no banco. Isso depende da ordem dos arquivos e de sobra de outra execução.
    - Os testes de `provedores-da-escola` e de `sessao-externa` que leem `/acesso` só olham a própria escola. Nenhum deles tem uma segunda escola sem provedor para conferir.
  - **Correção exigida:** um teste de isolamento determinístico com duas escolas.
    - A libera `google` (e `microsoft`), e B não libera nada.
    - Tanto por `GET /v1/escolas/:slug/acesso` quanto pelo repository no contexto de B, a resposta de B precisa ser `[]`, e a de A precisa ser `['google', ...]`.
    - Cabe no teste de isolamento de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-escola.int.test.ts` ou no de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/provedores-da-escola.int.test.ts:127`, que já tem A e B, conferindo `acessoDa(escolaB)`.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-escola.int.test.ts:38`: o título ainda diz "vazia até a 13.0". Atualize o texto.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/externa/conta-externa.repository.ts:89`: o `exists` de `jaLigado` já se correlaciona por `escola_id`. Vale um caso no teste da linha 72 que prove a correlação pela escola, e não só pelo `usuario.id`. Hoje o `usuario.id` global já separa as escolas, então isso fica como segunda camada.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/provedores-liberados.repository.ts:103`: `retirar` confia que os ids vieram de `liberados()`. O filtro por escola já está lá. Um teste que chame `retirar` direto no contexto de A com id de B fecharia a prova dessa cláusula, que hoje nenhum teste isola.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 14:36:20 · `tasks/prd-identidade-e-tenancy/13_task.md`

VEREDITO: APROVADO

A auditoria foi só por leitura de arquivos. Não rodei teste nem contêiner, como você pediu.

**Campos pessoais tocados:**
- A tabela `conta_externa` guarda `usuario_id`, `provedor`, `tenant` e `sujeito`. O `sujeito` é o `sub` no Google e o `oid` na Microsoft, e o `tenant` é o `tid` da Microsoft. Não há coluna de e-mail, nome nem foto.
- O e-mail do provedor só é comparado em memória com `conta.email` (citext), e só para professor.
- A tabela `provedor_escola` guarda o domínio ou o tenant da escola, que é dado da instituição e não de pessoa.
- A recusa grava `login_falho` sem usuário, no mesmo formato da matrícula errada.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. A linha do identificador opaco foi detalhada com `conta_externa`, `sub`, `oid` e `tid`, e mantém finalidade (D48) e retenção (enquanto houver vínculo). A retenção se cumpre pela FK composta com `on delete cascade` a partir de `usuario`. A eliminação por escola já está prevista na 17.0, na linha 46 de `17_task.md`.

**Autorização por objeto:** ok.
- **A escola vem do cookie cifrado:** no retorno, ela sai do `educa_oidc` (AES-256-GCM, com dado autenticado, `emitidoEm` dentro, 5 min, e sempre apagado depois do uso). O `?slug=` da query é ignorado.
- **Repository:** todo método de `conta-externa.repository.ts` e de `provedores-liberados.repository.ts` usa `exigirEscolaDoContexto()`. A ligação é por escola, então B cadastrando o `hd` de A não alcança a aluna ligada em A. Há teste para isso.
- **`PUT /v1/escola/provedores`:** exige `@Permite('escola_configuracao','alterar')` e pega a escola da sessão.
- **Respostas iguais:** `iniciar` responde o mesmo 404 para provedor desconhecido, slug inexistente e escola que não liberou o provedor. Todos os casos de recusa levam ao mesmo redirecionamento `conta_externa_nao_ligada`.
- **O que sai da API:** a resposta do PUT e a de `/acesso` são DTOs explícitos, e `/acesso` só devolve o tipo do provedor, nunca o domínio.

**Logs:** limpos.
- **Adaptador:** só devolve `sujeito`, `tenant`, `dominio`, `email` e `emailVerificado`. Qualquer erro da lib vira `ProvedorExternoFalhou` sem causa, em `openid-client.adapter.ts:135-137` e `153-155`.
- **Log de erro:** o `resumirErro` descarta a mensagem, então um `DrizzleQueryError` com o e-mail nos parâmetros não chega ao log.
- **Redirecionamento:** tem `Referrer-Policy: no-referrer` e `no-store`.
- **Teste de privacidade:** ele procura e-mail, nome, foto, `code`, `state` e JWT no log, e procura e-mail, nome e foto em todas as tabelas base.

**Auditoria:** presente nos dois pontos que a regra exige.
- **`escola.provedores_alterados`:** registra alteração de permissão. Guarda só os ids, e a linha nunca é apagada (recebe `removido_em`), então o id continua dizendo qual domínio foi.
- **`conta_externa.ligada`:** grava `usuarioId` e provedor, sem o e-mail nem o `sujeito`, na mesma transação da ligação.

**Envio externo:** nenhum dado de pessoa sai do sistema. O navegador vai ao provedor da própria escola com `state`, `nonce` e desafio PKCE, sem `offline_access`, e nenhum token é guardado. Não há chamada de modelo de IA, então `ExecucaoAgente` não se aplica.

**Seed/fixture:** sintético. `infra/oidc-falso/config.json` usa só domínios `*.educa-sintetica.test`, tenants de exemplo e nomes "Ficticia". `.env.example` tem só segredos locais sintéticos.

**Pergunta de fechamento:** o código responde. A ligação é alcançável por `usuario_id` e sai com o usuário. A sessão `externo`, o `registro_acesso` e a auditoria também saem por `usuario_id`. O "para onde foi enviado" é: nada. A rotina de direitos do titular por código segue registrada para a 17.0 e para o `/validar`, como nas rodadas anteriores.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **E-mail da Microsoft dado por verificado pelo `tid`** (`externa.service.ts:355`). A decisão está na Tech Spec e o risco se limita ao tenant da própria escola. Mesmo assim, vale registrar para o `/validar` o uso da claim opcional `xms_edov` (ou equivalente) para cobrir o caso de um administrador do tenant pôr o e-mail de outra professora num usuário, o ataque conhecido como "nOAuth".
2. **Linhas retiradas de `provedor_escola` ficam para sempre.** O dado não é pessoal, mas vale uma linha no `docs/lgpd.md` ou na Tech Spec dizendo que elas não entram no expurgo.
3. **O teste de privacidade cobre só a aluna ligada.** Uma asserção igual, de e-mail ausente no log, para a professora na primeira ligação (o único caminho em que o e-mail é usado) deixaria a regra provada também nesse caminho.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/externa/` (os 7 arquivos de produção)
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/provedores-da-escola.controller.ts`, `provedores-da-escola.service.ts`, `provedores-liberados.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/conta-externa.ts`, `provedor-escola.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0012_conta_externa_provedor_escola.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/log/logger.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/erro/resumir-erro.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/estrutura/provedores.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/externa.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/oidc-falso/config.json`, `/home/joaquimdp/Documentos/git/Educa.ia/.env.example`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-externa.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/provedores-da-escola.int.test.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 14:36:56 · `tasks/prd-identidade-e-tenancy/13_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login

Rate limit: ok. As duas rotas novas (`iniciar` e `retorno`) usam a mesma regra das outras rotas sem sessão que já existiam: um teto alto por IP (`LIMITE_REQ_IP_ANONIMO_MIN=3000`). Não tem senha para adivinhar, e a recusa só grava `login_falho` para registro; ela não bloqueia o IP nem a conta.

Fila e prioridade: ok. Não há job novo. A chamada ao provedor fica dentro do request, com prazo de 5 s (`comPrazo`), e sem transação ou conexão do banco presa enquanto espera. O `naEscolaSemUsuario` só abre o contexto da escola.

Concorrência: protegida. Duas coisas protegem a ligação da conta:
- `conta_externa_identificador_unico` e `conta_externa_usuario_unico`, com `onConflictDoNothing` e uma releitura depois (`externa.service.ts:304-309`);
- a troca de provedores com `FOR NO KEY UPDATE` na escola (`provedores-liberados.repository.ts:24`).

Há teste de concorrência para os dois casos da ligação (mesma professora; professora e e-mail recriado) e para o PUT.

Índice e paginação: ok. Todos os índices começam por `escola_id`. As leituras do login usam o único parcial de `provedor_escola` (o filtro tem `removido_em is null`) e o único com `coalesce` de `conta_externa`. Nenhuma listagem cresce com aluno.

Degradação de IA: não se aplica. A regra equivalente para o provedor externo está ok:
- prazo de 5 s por operação e `timeout` da biblioteca;
- discovery preguiçoso, uma busca por vez por provedor, e falha que não fica em cache;
- `?falha=provedor` em vez de erro cru;
- a API não depende (`depends_on`) do `oidc-falso`;
- teste com o `oidc-falso` pausado mostra a matrícula respondendo.

Migration: compatível. Só cria tabelas novas e vazias. A FK para `usuario` e `escola` trava as duas tabelas por um instante, porque a tabela nova está vazia, e o `migrar` desiste do lock em 5 s.

Métrica e alerta: ok. O contador `login.externo{resultado}` tem painel, e a latência sai pelo `http.server.request.duration` por rota. Nenhum alerta novo, então nenhum runbook devido.

Bloqueantes: nenhum

Recomendações:
1. O cenário `infra/k6/login-7h30.js` não passa pelo login da conta da escola. Cada entrada por esse caminho gasta pelo menos duas requisições no mesmo teto por IP que a matrícula, e sem contar a volta à tela. Vale incluir uma fase com o `oidc-falso` quando a 14.0 mexer na carga, ou registrar no TODO.
2. `infra/compose.carga.yml`: o `oidc-falso` (JVM) com `cpus: 0.25` precisa ficar saudável dentro da janela do healthcheck (5 s de `start_period` mais 30 tentativas a cada 2 s), porque o `up --wait` da carga espera por ele. Vale conferir o tempo de subida nessa CPU, ou deixar o serviço fora da carga com `profiles`, já que ninguém entra por ele no cenário.
3. Não há alerta para `login_externo_total{resultado="provedor"}` alto. Com o Google fora às 7h30, o operador só descobre olhando o painel. Vale criar o alerta com o parágrafo do runbook (a matrícula segue, e não há ação no nosso lado além de avisar a escola).
4. Qualquer um consegue um cookie válido chamando `iniciar`, e com ele o `retorno` com `code` falso chega ao endpoint de token do provedor com o nosso client id. Hoje só o teto por IP limita isso. Um abuso distribuído pode fazer o provedor limitar o nosso cliente para todas as escolas. Não é urgente para o F1, mas vale registrar.
5. Ponto aberto que já está nas notas: o emissor `http://oidc-falso:8080` não é alcançável pelo navegador. Isso tem que ser resolvido antes do e2e da 19.0.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/externa/openid-client.adapter.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/externa/externa.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/externa/conta-externa.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/provedores-liberados.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0012_conta_externa_provedor_escola.sql
- /home/joaquimdp/Documentos/git/Educa.ia/infra/compose.yml
- /home/joaquimdp/Documentos/git/Educa.ia/infra/compose.carga.yml
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-externa.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/provedores-da-escola.int.test.ts

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-18 14:37:30 · `tasks/prd-identidade-e-tenancy/13_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Três pontos vão além da seção 3 e precisam ser ratificados: o `unique (escola_id, usuario_id)` em `conta_externa`, a coluna `removido_em` em `provedor_escola` e a auditoria que guarda só ids, sem o texto do domínio. Não conto como divergência silenciosa, porque os três estão justificados nas "Notas da implementação" e resolvem casos que o próprio documento da tarefa pede: segundo `sujeito` com o mesmo e-mail e auditoria sem texto livre.
Portão local: `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/13_task.md` recusou com a mensagem "apps/api/test/sessao-externa.int.test.ts mudou em 2026-09-18 14:23:37, depois do início do último (2026-09-18 13:57:42). Rode `node tools/processo/portao-local.ts --infra` de novo."

Bloqueantes:
- `.processo/portao.json`: o carimbo que existe agora é da rodada que começou às 13:57, e o arquivo de teste mudou às 14:23. O portão que está rodando começou às 14:24:05. Conferi que nenhum arquivo de código da tarefa mudou depois disso. Ele ainda está na suíte `infra`, então não existe carimbo válido para esta árvore. Correção exigida: deixar o `portao-local.ts --infra` em andamento terminar verde, sem mexer em código, e confirmar que `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/13_task.md` sai com 0. Não achei nenhum bloqueante no código. Se na próxima rodada o diff estiver vazio e o carimbo valer, aprovo.

Recomendações:
- Registrar na seção 3 da `techspec.md` as três escolhas acima. Uma consequência merece constar lá: se a conta Google de um professor for recriada com outro `sub`, ele não liga a nova até a 17.0 criar um jeito de desligar a antiga.
- `packages/nucleo/src/erro/erro-de-dominio.ts`: `CONTA_EXTERNA_NAO_LIGADA: 401` não é lançado por nenhuma rota, porque a recusa volta por redirecionamento. Hoje é mapeamento morto; remova ou declare que é só para a tela.
- Há duas listas de provedores, `PROVEDORES_EXTERNOS` em `packages/nucleo/src/db/schema/conta-externa.ts` e `PROVEDORES_DE_CONTA_DA_ESCOLA` em `packages/shared`. O motivo, o carregador do drizzle-kit, está comentado, mas vale um teste de igualdade entre as duas para elas não divergirem.
- `infra/compose.yml`: as oito `LOGIN_EXTERNO_*` usam `:?defina`, que também recusa valor vazio. Com isso não dá para subir o compose com o provedor desligado, e o adaptador é opcional pela regra 00, itens 7 e 8. Troque por `${VAR:-}` nas três variáveis de cada provedor.
- `apps/api/src/sessao/externa/externa.service.ts:147`: a falha do provedor no `iniciar` também incrementa `login.externo{resultado=provedor}`, mas a métrica e o painel dizem "retornos". Ajuste a descrição ou separe os dois casos.
- `apps/api/test/sessao-externa.int.test.ts:501` e `:531`: os dois testes pausam o `oidc-falso` e esperam o relógio real de 5 s dentro da suíte de integração. Pelo espírito da D52, avalie movê-los para `test:infra`.
- Os e-mails da Microsoft valem pelo `tid` conferido, como a Tech Spec define. Para depois: a claim `xms_edov` (e-mail verificado pelo domínio) reduziria o risco de e-mail alterado dentro do tenant.

## test-engineer · 3ª rodada · APROVADO · 2026-09-18 14:47:25 · `tasks/prd-identidade-e-tenancy/13_task.md`

VEREDITO: APROVADO

Cenários exigidos (nesta rodada, só o diff pedido pelo tenancy-guardian):
- isolamento determinístico de `AcessoDaEscolaRepository.provedoresLiberados`, pela rota e pelo repository
- isolamento de `ProvedoresLiberadosRepository.liberados` e `retirar` quando o contexto é de outra escola
- a lista de provedores do nucleo e a do shared são a mesma

Cobertos:
- **`apps/api/test/acesso-da-escola.int.test.ts:70-83`.** O filtro que o teste prova está em `apps/api/src/sessao/acesso-publico.repository.ts:21`: `eq(provedorEscola.escolaId, exigirEscolaDoContexto())`.
  - Se esse filtro saísse, o `selectDistinct` leria as linhas de A. Então B, pela rota (linha 78), e o repository no contexto de B (linha 80) devolveriam os dois provedores em vez de `[]`. O teste quebra nos dois pontos.
  - A linha 77 exige `['google','microsoft']` para A. Com isso, o filtro de provedores ligados do service (`acesso-da-escola.service.ts:30`) não consegue esconder a falha na rota.
  - A linha 82 prova que a consulta sem escola no contexto é recusada. Se `exigirEscolaDoContexto()` fosse trocado por um valor opcional, o teste também quebraria.
- **`apps/api/test/provedores-da-escola.int.test.ts:147-161`.**
  - Sem o filtro de escola em `liberados()` (`provedores-liberados.repository.ts:33`), o contexto de A leria a linha de B, e o `toEqual([])` da linha 156 quebraria.
  - Sem o filtro em `retirar()` (`provedores-liberados.repository.ts:42`), o id de B, que o teste passa direto, ganharia `removido_em`, e o `toBeNull()` da linha 160 quebraria.
  - O teste lê o id de B pelo banco e chama o repository direto. É o ataque de trocar o id, sem o service no meio para mascarar.
- **`apps/api/src/sessao/externa/configuracao-externa.test.ts:31-33`.** Compara as duas listas por igualdade, na ordem. Se alguém acrescentar um provedor em um pacote e esquecer do outro, o teste quebra.
- O caminho feliz com o título ajustado segue válido. Não há `.skip`, teste comentado nem mock no diff. Não há chamada de IA nem operação concorrente nova neste diff: o teste de concorrência da troca de lista (linha 181) é anterior e não mudou.

Bloqueantes: nenhum.

Recomendações:
- `acesso-da-escola.int.test.ts:82`: a asserção compara o texto da mensagem (`'consulta com escopo sem escola no contexto'`). Se existir tipo ou código para esse erro, afirmar sobre ele deixa o teste imune a mudança de texto.
- `provedores-da-escola.int.test.ts:160`: `(await linhasDa(escolaB))[0]?.removido_em` passaria se a lista viesse vazia, porque `undefined` não é `null`, então `toBeNull()` falharia... e passaria só se a linha fosse apagada de fato e o teste encontrasse outra coisa. Hoje isso está protegido, porque o repository nunca apaga. Mesmo assim, afirmar antes `toHaveLength(1)` deixa a intenção explícita.

Não rodei nenhum teste, como pedido. A auditoria foi feita só lendo os arquivos.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-escola.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/provedores-da-escola.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/externa/configuracao-externa.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/acesso-publico.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/provedores-liberados.repository.ts

## revisor-geral · 2ª rodada · APROVADO · 2026-09-18 15:12:14 · `tasks/prd-identidade-e-tenancy/13_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A seção 3 da `techspec.md` agora registra as três escolhas que eu tinha pedido para ratificar: `unique (E, usuario_id)` em `conta_externa`, `removido_em` com unique parcial em `provedor_escola` e a auditoria guardando só ids. Também registra a consequência da conta Google recriada até a 17.0.
Portão local: carimbo válido. O `conferir` saiu com 0 e confirmou "portão local válido para o código atual (typecheck, lint, test, infra)".

Bloqueantes: nenhum. A correção exigida na 1ª rodada foi feita, porque o carimbo agora vale para a árvore atual. O diff desde aquela rodada tem só três coisas:
- os testes de isolamento em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-escola.int.test.ts` e em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/provedores-da-escola.int.test.ts`;
- o teste de igualdade em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/externa/configuracao-externa.test.ts`;
- a atualização de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/techspec.md`.

Nada disso mexe em código de produção, e não achei problema.

Recomendações:
- `provedores-da-escola.int.test.ts:160`: afirme `toHaveLength(1)` sobre `linhasDa(escolaB)` antes de ler `[0]?.removido_em`. Assim a intenção do teste fica explícita.
- As recomendações da 1ª rodada que ficaram para o relatório continuam valendo, e quem assinar o commit deve saber delas:
  - o mapeamento `CONTA_EXTERNA_NAO_LIGADA: 401` que nenhuma rota usa hoje;
  - o compose não sobe com o provedor desligado, e `${VAR:-}` esbarra no teste `tools/ci/ambiente.test.ts`. É preciso decidir qual dos dois cede;
  - a métrica `login.externo{resultado=provedor}` também conta a falha no `iniciar`, mas a descrição fala só em retornos;
  - os dois testes que pausam o `oidc-falso` esperam o relógio real dentro da suíte de integração, e pela D52 caberiam em `test:infra`.

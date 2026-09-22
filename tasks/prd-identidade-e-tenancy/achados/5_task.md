# Achados das revisões — `tasks/prd-identidade-e-tenancy/5_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-18 04:16:06 · `tasks/prd-identidade-e-tenancy/5_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os dez da tabela "Testes que provam a regra" do `5_task.md`. Na leitura também entraram estes, das subtarefas: isolamento das escritas de sessão e da configuração, métricas de todos os resultados, alerta de reuso (5 não disparam e o sexto dispara), `educa_dispositivo` preservado na saída, e o `iat` do token renovado.

Não rodei nenhum teste, porque o portão está no compose. A auditoria foi só de leitura, e o veredito vale sob a condição de o portão sair verde.

**Cobertos:** os dez da tabela têm teste. Todos falhariam sem a regra que provam.

1. **Rotação e 409 com o novo já usado (29 s)**: `apps/api/test/renovacao.int.test.ts:50` e `:89`. Sem a janela de 30 s, os 29 s virariam reuso e dariam 401.
2. **Concorrência**: `renovacao.int.test.ts:110` dispara três chamadas em paralelo de verdade e espera `[200,409,409]`, uma rotação só e a família viva.
   - Sem o `FOR UPDATE`, ou sem a janela de 2 s, saem duas respostas 200 e o teste quebra.
   - A trava também tem prova determinística em `resolucao-de-tenant.repository.int.test.ts` (o caso "concorrência").
3. **Resposta perdida**: `renovacao.int.test.ts:131`. Confere que rotaciona de novo, que o anterior continua o mesmo e que o cookie perdido dá 401 sem encerrar a família.
4. **Reuso aos 31 s**: `renovacao.int.test.ts:157`. Confere a família inteira encerrada com `reuso_de_refresh`, a auditoria exata e a métrica somando 1. Tem isolamento: o mesmo id de família forçado numa sessão da escola B continua vivo.
5. **34 min vale, 35 min e 1 s dá 401, e renovar não é uso**: `inatividade.int.test.ts:30`. Sem a tolerância ou com o limite errado, o teste quebra. A linha 40 prova que renovar não move `ultimo_uso_em`.
6. **Chromebook do carrinho**: `inatividade.int.test.ts:48`.
7. **Teto de 12 h**: `inatividade.int.test.ts:68`. Nem a atividade nem a renovação mexem em `expira_em`, e a guarda, a atividade e a renovação dão 401 depois do teto.
8. **Atividade com Postgres lento**: `inatividade.int.test.ts:137`. A linha 152 conta zero falhas logo depois da resposta, o que prova que a gravação não segura a resposta. Depois a falha é contada e a sessão continua valendo aos 32 min.
9. **Saída**: `saida.int.test.ts:22`, mais isolamento (`:43`) e dois cliques em Sair em paralelo (`:58`).
10. **Permissão e isolamento da configuração**: `escola-sessao.int.test.ts:41` e `:52`.
    - Professor e aluno recebem o mesmo 404, sem gravar auditoria.
    - Com 15 min em A, uma sessão de 21 min cai em A e segue válida em B.
    - Também cobertos: a equipe passa a vencer em 60 + 5 min, os limites de 5 e 480, e um `escolaId` a mais no corpo é recusado.
    - Duas alterações em paralelo deixam o antes de uma igual ao depois da outra.

**Extras:**
- `escrita-de-sessao.repository.int.test.ts` prova o isolamento das quatro escritas (no contexto de B, a sessão de A não muda), a falha fechada sem escola no contexto, e a marcação de `atual_apresentado`: só na escola do token, só com `iat` depois da rotação, e uma vez com duas chamadas em paralelo.
- `renovacao.service.test.ts` testa os limites exatos de 2 s e de 30 s.
- A guarda tem testes de unidade: a marcação não segura a resposta, uma falha na marcação não derruba a requisição, e `sessao.leitura.duracao` sai sem rótulo de escola.
- O alerta tem prova no projeto infra: `infra/test/alertas.int.test.ts`, no último caso.

Nenhum `.skip`, `.only` ou teste comentado. Não há provedor de IA na tarefa. Os mocks estão só no teste de unidade da guarda, e as mesmas regras têm prova de integração com Postgres real.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Texto da tabela desatualizado.** `tasks/prd-identidade-e-tenancy/5_task.md:79` ainda diz que a concorrência prova "`FOR UPDATE` e a janela de 30 s". O que o teste prova é a janela de 2 s (`JANELA_DE_RENOVACAO_SIMULTANEA_MS`). Vale alinhar a linha com as notas da implementação e com a seção 5 da Tech Spec, e deixar a decisão pendente para o Joaquim confirmar.
2. **Espera real no teste da resposta perdida.** `renovacao.int.test.ts:138` espera 2,2 s de verdade. Os outros testes de tempo movem a data no banco. Um `rotacaoHa(aluno, 3)` deixa o teste mais rápido e sem depender do relógio real.
3. **Espera fixa numa asserção negativa.** Em `renovacao.int.test.ts:83-84`, o teste espera 300 ms fixos e confere que nada foi marcado. A regra já está provada de forma determinística no teste do repositório, então isso só adiciona um pouco de tempo.
4. **Dois reusos em paralelo.** Falta um caso com duas chamadas simultâneas usando o cookie roubado: deve sair um reuso só, uma auditoria só e a métrica somando 1. O código resolve isso pela trava mais a conferência de sessão encerrada, mas ninguém prova.
5. **Contrato do F6.** Nenhum teste prova que `RegistroDeAtividade.registrarAtividade()` é exportado pelo `SessaoModule` e pode ser injetado em outro módulo. Vale um teste de montagem simples.
6. **Limite por IP na renovação.** `POST /v1/sessao/renovar` usa o limite por IP da rota anônima. Nenhum teste mostra que 400 alunos atrás do mesmo IP renovando não são barrados (regra 80, item 1). Esse cenário está fora do escopo e vai para a tarefa 16.0, mas vale registrar lá como caso obrigatório.
7. **Inatividade padrão da equipe na renovação.** O limite padrão da equipe (120 + 5 min) só tem prova de unidade em `avaliar-sessao.test.ts`. Na integração, o papel da equipe só aparece com 60 min. Seria bom um caso de renovação de professor perto do limite de 125 min.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 04:21:28 · `tasks/prd-identidade-e-tenancy/5_task.md`

VEREDITO: APROVADO

**Rodada 2.** Audito só o diff desde a 1ª rodada, que foi aprovada. Li o código e não rodei nenhum teste, porque o portão está no compose `educa-teste`.

**Cenários exigidos (desta rodada):**
- `PUT /v1/escola/sessao` liberado pela guarda "nenhuma rota cria rede nem escola", sem abrir a guarda para outra rota nem para outro método.
- Resposta perdida sem a espera real, usando a hora do banco.
- Concorrência: o mesmo cookie roubado reapresentado duas vezes em paralelo.
- Borda da equipe na renovação: 120 + 5 min.

**Cobertos:**
- **Guarda de rotas** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ops-escola.int.test.ts:164`): a liberação casa método e caminho exatos (`${metodo} ${caminho}`). O teste do filtro prova três coisas:
  - `PUT /v1/escola/sessao` passa.
  - `POST /v1/escola/sessao` continua pego.
  - `PUT /v1/escola/configurar` continua pego, então o segmento `escola` ainda aciona a guarda.
  
  O teste que lista as rotas registradas no Nest continua valendo para o resto. Conferi que a rota liberada é a de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/escola-sessao.controller.ts` (`@Controller('v1/escola')` + `@Put('sessao')`). Ela muda a inatividade da escola que já existe e não cria escola.
- **Resposta perdida** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/renovacao.int.test.ts:138`): `rotacaoHa` põe `rotacionado_em = now() - N s` no banco. O repositório grava a rotação com `now()` do banco, então a janela de 2 s é comparada na mesma base. Se a janela for removida ou invertida, o teste cai em `ja_renovado` e falha.
- **Concorrência do reuso** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/renovacao.int.test.ts:190`): as duas chamadas saem de fato em paralelo, por `Promise.all`. Com o `FOR UPDATE` e `encerrarFamilia` filtrando `isNull(encerradaEm)`, a segunda chamada encontra a sessão já encerrada. Sem a trava, as duas leriam a sessão aberta e teríamos reuso +2 e duas linhas de auditoria, e as asserções `+1` e `count = 1` pegariam isso.
- **Equipe 120 + 5** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/inatividade.int.test.ts:48`): se a equipe usasse o prazo de 30 min do aluno, a renovação com 124 min daria 401 e o teste falharia. Se a renovação não checasse a inatividade, a de 125 min e 1 s daria 200 e o teste também falharia.
- Não há `.skip`, teste comentado nem mock de coisa nossa no diff.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `renovacao.int.test.ts:190`: acrescentar `renovacoes('recusada')` +1. Assim o teste prova também que a segunda chamada saiu como recusada, com a família já encerrada, e não por outro caminho que por acaso não conta métrica.
2. `renovacao.int.test.ts:190`: a disputa é real, mas não é forçada. Se, sem a trava, uma chamada terminasse antes de a outra ler, o teste passaria mesmo assim. É o limite normal de teste de concorrência com duas chamadas; fica registrado para o `/retro`, não bloqueia.
3. Seguem de pé, da rodada 1, a rec 1 (a linha da tabela de critérios cita "janela de 30 s"; a decisão fica com o dono, como anotado no `5_task.md`) e as recs 3, 5 e 6, não aplicadas.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 04:32:01 · `tasks/prd-identidade-e-tenancy/5_task.md`

VEREDITO: APROVADO

Tabelas verificadas: não há migration nova. As escritas tocam só tabelas que já têm `escola_id`: `sessao`, `escola` (onde `escola.id` é o próprio tenant), `registro_acesso` e `auditoria`.

Queries verificadas:
- **`ResolucaoDeTenantRepository.sessaoParaRenovar`**: leva `@SemEscopo` com justificativa escrita (o cookie não diz a escola). É o único método sem escopo que a tarefa acrescenta, e ele substitui os dois antigos. Acha a sessão pelo SHA-256 de um refresh de 256 bits e usa `FOR UPDATE OF sessao`. O join com `usuario` compara `escola_id` e `id`. A escola usada daí em diante vem da linha travada, nunca do cliente.
- **`EscritaDeSessaoRepository`** (`rotacionar`, `encerrarFamilia`, `encerrar`, `registrarUso`): todas aplicam `escola_id` do contexto e falham fechado quando não há escola. A leitura da escola acontece de forma síncrona, antes da gravação que roda depois da resposta em `registrarAtividade()`.
- **`SessaoRepository.marcarAtualApresentado`**: só age sobre `escola_id` e `sid` do `TokenVerificado` assinado, com update condicional.
- **`EscolaSessaoRepository.lerParaAlterar` e `alterar`**: aplicam `escola.id` do contexto, e o método não recebe escola. O corpo é zod `.strict()`, e um `escolaId` no corpo dá 400 (há teste para isso).
- **`RegistroDeAcessoRepository.gravar`**: a escola vem do contexto. Na renovação, `usuarioId` é o da sessão travada, dentro da mesma transação. Na saída, vem de `sessaoDaRequisicao()`.
- **Auditoria `sessao.reuso_de_refresh`**: o autor e a escola vêm do contexto montado com a sessão travada. Em `escola.sessao_alterada`, o autor é o coordenador. Nas duas, `antes` e `depois` levam só números e ids.
- **Permissão de `PUT /v1/escola/sessao`**: pela matriz, professor, aluno e rede têm `nunca`, e o teste confirma que eles recebem 404 igual ao de rota inexistente, sem revelar que a rota existe.

Teste de isolamento: presente e efetivo. Cada cláusula de escopo tem um teste que quebra se ela for removida:
- `apps/api/test/escola-sessao.int.test.ts:52`: sem o `where escola.id`, a escola B passaria a 15 min.
- `apps/api/src/sessao/escrita-de-sessao.repository.int.test.ts:139`: sem o `escola_id`, as quatro escritas feitas no contexto de B alcançariam a sessão de A.
- `apps/api/src/sessao/escrita-de-sessao.repository.int.test.ts:182`: sem o `escola_id`, um token com a escola de B marcaria a sessão de A.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/sessao.repository.ts:79`: acrescentar `eq(sessao.usuarioId, token.usuarioId)` ao update de `marcarAtualApresentado`, como defesa em profundidade. Hoje só a checagem de `avaliarSessao` na guarda garante que o usuário é o mesmo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escrita-de-sessao.repository.ts:5` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/escola-sessao.repository.ts:10`: `escolaDoContexto()` está duplicada nos dois arquivos, e já existe lógica equivalente em `registro-de-acesso.repository.ts`. Vale extrair um helper único no `@educa/nucleo`.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 04:32:34 · `tasks/prd-identidade-e-tenancy/5_task.md`

VEREDITO: APROVADO

A tarefa 5.0 atende a regra 20 e o `docs/lgpd.md`. Auditei só lendo o código; não rodei testes nem mexi em containers.

**Campos pessoais tocados:** nenhum campo novo. A tarefa usa colunas que já existiam em `sessao` (`refresh_hash_anterior`, `atual_apresentado`, `rotacionado_em`, `familia`, `ultimo_uso_em`), grava dois eventos novos no `registro_acesso` (`renovacao` e `saida`) e duas ações novas de `auditoria`. O `iat` que passa a ir no `TokenVerificado` (`emitidoEm`) é só um instante: não sai em resposta, log nem métrica. `escola.inatividade_*` é configuração da escola, não dado de pessoa.

**Fora da tabela de dados do docs/lgpd.md:** nada. A sessão está na linha 54, com os hashes atual e anterior e a família, "sem IP nem nome", e 30 dias de retenção. A auditoria está na linha 62, e o registro de acesso já estava coberto pela 4.0.

**Autorização por objeto:** ok.
- **`PUT /v1/escola/sessao`:** usa `@Permite('escola_configuracao','alterar')`, que só o coordenador tem, com alcance `unidade`. O repository filtra por `escola.id` vindo do contexto, e o corpo é `.strict()`, então mandar `escolaId` dá 400. Professor e aluno recebem o mesmo 404 de rota inexistente. O teste de isolamento mostra que mudar para 15 min em A não muda B.
- **`DELETE /v1/sessao` e `POST /v1/sessao/atividade`:** pegam a sessão da requisição (`sessaoDaRequisicao()`), nunca de um id vindo do cliente.
- **Escritas na sessão:** as de `EscritaDeSessaoRepository` levam a escola do contexto.
- **`marcarAtualApresentado`:** filtra pela escola e pela sessão do token assinado.
- **`POST /v1/sessao/renovar`:** a recusa é a mesma 401 para cookie desconhecido, sessão vencida, reuso e formato inválido. O 409 `JA_RENOVADO` só chega a quem tem o cookie anterior válido.

**Logs:** limpos. `sessao.atividade_falhou` e `sessao.marcacao_indisponivel` são só o nome do evento, com aviso espaçado e sem o erro nem ids. As métricas `sessao.renovacao{resultado}`, `sessao.atividade_falha` e `sessao.leitura.duracao` não têm rótulo de escola nem de usuário; o teste da guarda confere que os atributos saem vazios.

**Auditoria:** presente.
- **`escola.sessao_alterada`:** o schema estrito aceita só os dois números no antes e no depois. O autor é o coordenador. A gravação fica na mesma transação da alteração, com a linha da escola travada.
- **`sessao.reuso_de_refresh`:** o `depois` leva só a família (uuid) e a quantidade de sessões encerradas.

As duas auditorias têm teste que confere o conteúdo exato.

**Envio externo:** nenhum. A tarefa não chama provedor de IA nem serviço de terceiro.

**Seed/fixture:** sintético. `BancadaDeSessoes` gera escolas e usuários com uuid aleatório, e a limpeza só preserva usuários que são autores de auditoria.

**Cookies:** `educa_sessao` sai com `Max-Age=0` na recusa, no reuso e na saída. O 409 não mexe em cookie, e o `educa_dispositivo` não é tocado (o teste confere que só um `Set-Cookie` sai).

**Pergunta de fechamento:** a secretaria pediria tudo sobre um aluno. As sessões, o registro de acesso e as auditorias dele saem por `usuario_id`, e o reuso fica na auditoria pela família e pela sessão. A tarefa não envia nada a terceiro. O código responde.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Autor do reuso.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/renovacao.service.ts:118` grava a auditoria `sessao.reuso_de_refresh` com o dono da família como autor. Numa resposta ao titular (acesso, art. 18), isso aparece como "você fez reuso de refresh", quando ele pode ser a vítima. Vale deixar claro no registro, ou no texto da exportação ao titular, que é um evento do sistema sobre a credencial dele, e não um ato dele. Registrar para o `/validar` e para a tarefa de direitos do titular.
2. **Runbook, causa 3.** `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md` manda consultar o `registro_acesso` por IP. Acrescentar a mesma ressalva da consulta de família: o IP é dado pessoal, não se copia para fora da investigação e não vai por e-mail para a escola.
3. **Finalidade da configuração.** `escola.sessao_alterada` tem `finalidade: null`. Hoje não precisa, porque não é leitura de dado de aluno nem exportação. Se a 17.0 ou a auditoria de configuração passarem a pedir finalidade em alteração de política de acesso, vale revisitar.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 04:33:29 · `tasks/prd-identidade-e-tenancy/5_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (renovação e guarda de sessão em toda requisição autenticada)
Rate limit: ok. As rotas `atividade`, `DELETE /v1/sessao` e `PUT /v1/escola/sessao` usam o limite por `sub` e `esc`. A `renovar` é `@RotaAnonima` e só tem o limite por IP do F0 (3000/min), como a Tech Spec e a 5.1 mandam. Ver a recomendação 1.
Fila e prioridade: ok. Nada vai para fila e nada demorado roda no request. A atividade e a marcação de `atual_apresentado` não seguram a resposta.
Concorrência: protegida.
- A renovação roda em transação com `FOR UPDATE OF sessao`. Ela não trava usuário nem escola, e a segunda renovação relê a linha já rotacionada.
- O reuso em paralelo é contado uma vez, porque a segunda chamada acha a sessão já encerrada.
- A marcação é um `update` condicional. O Sair duplo encerra uma vez.
- O `PUT` da escola trava a linha. Todos esses casos têm teste com `Promise.all`.
Índice e paginação: ok. `refresh_hash` é único e `refresh_hash_anterior` tem índice, então o `OR` usa os dois índices. Nenhuma listagem nova. Ver a recomendação 2.
Degradação de IA: não se aplica.
Migration: não se aplica. Não há migration nova.
Métrica e alerta: ok.
- As séries de `sessao.renovacao{resultado}` nascem em 0 no boot.
- `sessao.atividade_falha` e `sessao.leitura.duracao` foram criadas; a duração é medida no `finally` da guarda.
- O alerta `reuso-de-refresh` usa máximo menos mínimo em 10 min, dispara acima de 5 e não tem `for:`. Tem entrada no runbook e prova em `infra/test/alertas.int.test.ts`: 5 reusos não disparam e o sexto dispara.
Bloqueantes: nenhum.

Recomendações:
1. **Renovação limitada só por IP.** Arquivo: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/renovacao.controller.ts:11`.
   - Hoje as contas cabem. Uma rede pública com várias escolas atrás do mesmo IP de saída fica perto de 420 logins/min mais 210 a 420 renovações/min, abaixo de 3000.
   - O risco é outro: um cliente com defeito que repete a renovação em laço gasta o balde de IP da escola inteira. Com o balde vazio, ninguém daquela escola renova nem faz login, e a regra 80, item 1, existe para evitar exatamente isso.
   - Proposta: acrescentar um limite por `sha256(cookie)` no Redis antes da transação, na 16.0 ou na 18.0, e testar a renovação em onda no cenário de carga da 16.0.
2. **`encerrarFamilia` sem índice que cubra a busca.** Arquivo: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escrita-de-sessao.repository.ts:45`. Ela filtra por `(escola_id, familia)`, e nenhum índice cobre `familia`, então percorre todas as sessões da escola; com as sessões guardadas por 30 dias, são dezenas de milhares de linhas. O evento é raro, mas acontece dentro da transação que trava a sessão. Acrescentar `usuario_id` à cláusula aproveita `sessao_escola_usuario_idx`, desde que a família seja sempre de um usuário só.
3. **`FOR UPDATE` na linha da escola.** Arquivo: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/escola-sessao.repository.ts:29`. O `FOR UPDATE` conflita com o `FOR KEY SHARE` que a FK de todo `INSERT` em `sessao`, `registro_acesso` e `auditoria` daquela escola precisa pegar. Enquanto a transação dura, alguns milissegundos, o login da escola espera. `.for('no key update')` dá a mesma proteção ao `antes` da auditoria e não bloqueia a FK.
4. **Janela de 2 s precisa ser respeitada pela web.** Arquivo: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/renovacao.service.ts:153`. A decisão ainda está com o Joaquim. Se ela ficar, a 18.0 precisa esperar mais de 2 s desde a primeira tentativa antes de repetir a renovação depois de um 409. Sem essa espera, uma resposta perdida que volta rápido recebe 409 duas vezes e acaba em logout. Registrar como critério da 18.0.
5. **Falha da marcação sem métrica.** Arquivo: `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/guarda-sessao.ts:91`. Quando a marcação de `atual_apresentado` falha, hoje só sai uma linha de log espaçada. Uma falha persistente transforma resposta perdida em `ja_renovado` ou em reuso sem nada aparecer no painel. Um contador `sessao.marcacao_falha` resolve.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-18 04:46:43 · `tasks/prd-identidade-e-tenancy/5_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência na seção 5, "Renovar". Foi declarada, não decidida em silêncio. A janela de 2 s para a renovação simultânea está registrada como "a confirmar" na Tech Spec e nas Notas da implementação, e o Joaquim precisa confirmá-la.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test, infra)")

Bloqueantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/grafana/alertas/reuso-de-refresh.yaml:47`
  - **O problema:** a expressão `sum(max_over_time(x[10m]) - min_over_time(x[10m]))` não resiste a reinício do contador. A série é identificada por `service.instance.id = hostname()` (`packages/nucleo/src/telemetria/iniciar.ts:72`). Um processo da API que reinicia no mesmo contêiner (crash com política de restart, ou `docker restart`) mantém o hostname e volta a publicar a mesma série a partir de 0. Isso acontece porque o `RenovacaoService` cria a série em 0 no boot.
  - **O efeito:** dentro da janela, o `max` fica com o valor acumulado antes do reinício e o `min` vira 0. Se aquele processo tinha acumulado mais de 5 reusos desde o boot anterior, o alerta dispara sem nenhum reuso nos últimos 10 min. O operador segue o runbook, a consulta em `auditoria` volta vazia, e o alerta perde a confiança. A escolha de trocar `increase()` por max-min existia justamente para o alerta ser exato, e o reinício quebra essa exatidão.
  - **Correção exigida:**
    - Trocar por uma expressão que trate o reinício. Uma opção é descartar a série que teve reinício na janela e contar o trecho depois dele. Outra é `increase()` com o limiar recalibrado e a extrapolação medida.
    - Acrescentar em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts` o caso "instância com mais de 5 reusos acumulados reinicia e não dispara sem reuso novo".
    - Ajustar o parágrafo "Dispara quando" do runbook se a expressão mudar.

Recomendações:
- Não commitar antes de o Joaquim confirmar a janela de 2 s (`JANELA_DE_RENOVACAO_SIMULTANEA_MS`). Uma resposta perdida que volta antes de 2 s recebe 409 com o cookie velho. A 18.0 precisa tentar de novo depois da janela, e não desistir no primeiro 409. Vale deixar isso escrito na 18.0.
- A linha de concorrência da tabela de testes do `5_task.md` ainda cita "a janela de 30 s". Depois da confirmação, corrigir para a janela de 2 s e o `FOR UPDATE`.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/escola-sessao.repository.ts:27` usa `.for('update')` na linha de `escola`, e isso conflita com o `FOR KEY SHARE` que a checagem de FK de todo insert na escola toma (sessão, registro de acesso, auditoria). `.for('no key update')` basta para serializar duas alterações e não trava a escola. É o mesmo cuidado que a renovação já tomou com `FOR UPDATE OF sessao`.
- `escolaDoContexto()` agora existe copiada em quatro arquivos: `uso.repository.ts`, `criacao-de-sessao.repository.ts`, `escrita-de-sessao.repository.ts` e `escola-sessao.repository.ts`. Extrair para `@educa/nucleo` numa correção futura.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/saida.service.ts:1`: o import de `./login.service.js` vem antes do import de `@educa/nucleo`, fora da ordem que o resto do módulo segue.

## test-engineer · 3ª rodada · APROVADO · 2026-09-18 04:51:25 · `tasks/prd-identidade-e-tenancy/5_task.md`

VEREDITO: APROVADO

Cenários exigidos: a correção que o revisor-geral pediu no alerta de reuso de refresh. Uma instância da API com mais de 5 reusos acumulados reinicia no mesmo contêiner e o alerta não pode disparar sem reuso novo. Os casos das rodadas anteriores continuam valendo: 5 reusos em 10 min não disparam, o sexto dispara, a janela conta todas as instâncias somadas, e a alteração de inatividade tem teste com duas chamadas em paralelo. Não rodei testes, como pedido; esta auditoria é só leitura do código.

Cobertos:
- **O reinício tem teste que falharia sem a correção.** `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts:254-260` reinicia a `api-1` depois que o sexto reuso dispara o alerta. Em seguida exige o contador em 0, a expressão da regra em 0 e a regra de volta a `normal`. Com a expressão antiga (máximo menos mínimo), o resultado seria 6 e a regra seguiria disparada, então o teste pega a regressão.
- **O teste consulta a expressão real do alerta.** A consulta vem do arquivo provisionado, por `regraPorUidNoArquivo` (linhas 58-64). Não existe uma cópia da expressão no teste que pudesse divergir da regra.
- **A expressão também tem teste sem banco.** `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.test.ts` compara a expressão inteira, o `for: 0s` e o limiar `gt 5`. Assim, tirar qualquer um dos dois ramos (`resets == 0` ou `resets > 0`) quebra esse teste.
- **O caminho feliz e o limiar continuam provados.** Com 5 reusos, o teste confere que a regra vale exatamente 5 e fica `normal` em 4 leituras seguidas. O sexto leva a `disparado`.
- **A troca de `.for('update')` por `.for('no key update')`** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/escola-sessao.repository.ts:33` continua coberta pelo `Promise.all` de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-sessao.int.test.ts:114`. Essa trava ainda coloca em fila duas alterações da mesma linha.
- Não achei `.skip`, teste comentado, nem mock escondendo a regra. Nenhum teste chama provedor de IA.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts:258`: a verificação de que o contador voltou a 0 usa `sum(...)` somando as duas APIs, mas o compose tem também a `api-2`. Hoje passa porque o teste chama só a `api-1`, pela `API_1_PORTA_HOST`. Se outro teste da suíte gerar reuso na `api-2` antes deste, a verificação falha por um motivo que não tem a ver com a regra. Vale filtrar a consulta pela instância da `api-1`, ou comparar com o valor da `api-2` lido antes do reinício.
2. Falta a outra metade do reinício no teste integrado: a instância reinicia e passa a contar os reusos novos, e 6 depois do reinício disparam. Hoje só o teste de unidade, que compara a expressão como texto, protege o ramo `X and resets > 0`. Não há prova de que o Prometheus avalia esse ramo como esperado. O teste leva uns 7 minutos, então pode ficar como cobertura extra num `/validar`.
3. A nova condição `eq(sessao.usuarioId, token.usuarioId)` em `marcarAtualApresentado` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/sessao.repository.ts`) é uma segunda camada de proteção e não tem teste próprio. Falta o caso "um token com o `sessaoId` certo e o `usuarioId` de outra pessoa não marca a sessão", se o autor quiser que essa camada fique provada.
4. O caso do reinício roda por último no arquivo e deixa a `api-1` recém-reiniciada. Isso não é problema agora, mas qualquer caso novo colocado depois dele herda esse estado. Vale anotar isso no próprio teste.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-18 04:51:53 · `tasks/prd-identidade-e-tenancy/5_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela ou migration nova nesta rodada. `sessao` e `escola` foram revistas só onde o diff mexe.

Queries verificadas:
- `packages/nucleo/src/identidade/sessao.repository.ts:73-91` (`marcarAtualApresentado`): o where filtra por `sessao.escolaId`, `sessao.id` e `sessao.usuarioId`, todos vindos do token verificado, não de parâmetro do cliente. A correção que recomendei na 1ª rodada foi feita (linha 83).
- `apps/api/src/estrutura/escola-sessao.repository.ts:28-35` (`lerParaAlterar`): a troca para `.for('no key update')` só muda o tipo de trava. O where continua `eq(escola.id, escolaDoContexto())`, e o escopo segue vindo do contexto autenticado. O `alterar` (linhas 37-44) continua no mesmo escopo.
- Itens 1, 4 e 5 do diff (a expressão do alerta de reuso e os testes dela, a ordem dos imports em `saida.service.ts`, o texto de `docs/runbook.md`): nenhum lê dado de domínio nem aceita `escolaId` do cliente. Não mudam o isolamento.

Teste de isolamento: presente e efetivo. Os testes não mudaram desde a rodada aprovada, e as duas queries alteradas mantêm as cláusulas de escopo que esses testes cobrem.

Bloqueantes: nenhum

Recomendações:
- Extrair `escolaDoContexto()` para um ponto comum, que fica para correção futura, como vocês registraram.

Não rodei testes nem mexi em containers: a auditoria foi feita lendo o código, como pedido.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-18 04:52:06 · `tasks/prd-identidade-e-tenancy/5_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo nesta rodada. O diff só mexe em onde ficam os campos da 1ª rodada. O `where` de `marcarAtualApresentado` passou a filtrar também por `usuarioId`, o que restringe mais quais linhas são alteradas e não grava nada novo.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/sessao.repository.ts:79-87`: a marcação agora exige escola, sessão e usuário do próprio token. Assim ela não depende só da guarda.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/escola-sessao.repository.ts:33`: trocar `for update` por `for no key update` só muda o tipo de trava. O escopo e o que a consulta devolve continuam iguais.

Logs: limpos. O diff não acrescenta log.

Auditoria: presente. `sessao.reuso_de_refresh` continua como estava. O runbook consulta a auditoria e a tabela `sessao` só por ids e diz explicitamente para não copiar nome nem matrícula.

Envio externo: nenhum. O alerta novo em `/home/joaquimdp/Documentos/git/Educa.ia/infra/grafana/alertas/reuso-de-refresh.yaml` usa só `sessao_renovacao_total{job="educa/api", resultado="reuso"}`. A série não traz escola nem usuário, então não há como sair dado pessoal pelo Grafana ou pela notificação do alerta. O teste em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts:254-257` reinicia a api-1 e não usa dado real.

Seed/fixture: sintético.

Bloqueantes: nenhum.

Conferência das mudanças desde a 1ª rodada:
- Item 2, minha recomendação 2 da 1ª rodada: foi aplicada. `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:182-185` agora diz que o IP é dado pessoal, que fica na investigação e que não vai para o `TODO.md` nem por e-mail à escola.
- Item 5, `saida.service.ts`: só muda a ordem dos imports, sem efeito de privacidade.

Recomendações:
1. Continuam valendo e sem mudança as recomendações 1 e 3 da 1ª rodada, que vocês já registraram para o `/validar` e a tarefa de direitos do titular. A 1 é o autor do reuso na exportação ao titular; a 3 é a finalidade na configuração.
2. A causa 1 do runbook (`docs/runbook.md:174-177`) manda avisar a coordenação "sem mandar id de aluno por e-mail". Vale estender a mesma frase para id de sessão e de família, para que ninguém cole o resultado da consulta de auditoria no e-mail. Não bloqueia.

Auditei só lendo o código e não rodei testes nem mexi em containers, porque o portão local está rodando no `educa-teste`.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-18 04:52:24 · `tasks/prd-identidade-e-tenancy/5_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login | migration

Rate limit: ok

Fila e prioridade: ok

Concorrência: protegida

Índice e paginação: ok

Degradação de IA: não se aplica

Migration: compatível

Métrica e alerta: ok

Bloqueantes: nenhum.

O bloqueante do revisor-geral foi corrigido. Na expressão nova de `/home/joaquimdp/Documentos/git/Educa.ia/infra/grafana/alertas/reuso-de-refresh.yaml`, cada instância cai em um só dos dois ramos: `resets == 0` ou `resets > 0`. O `or` compara os rótulos sem `__name__`, então nenhuma instância é somada duas vezes. A instância que reiniciou na janela entra só com o valor atual, e o acumulado de antes do reinício deixa de disparar o alerta. Sem `for:`, o alerta também não fica preso depois do reinício.

O teste de integração em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts:254-260` lê a expressão do arquivo provisionado, reinicia `api-1` e exige contador 0, expressão 0 e regra normal. Se o ramo de reinício for removido, esse teste falha. O teste de unidade em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.test.ts:76` confere a expressão exata. O runbook, em `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:150-153`, descreve a mesma regra.

O `.for('no key update')` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/escola-sessao.repository.ts:33` não conflita com o `FOR KEY SHARE` que as FKs de sessão, registro de acesso e auditoria pedem à linha da escola. Assim, alterar a inatividade da escola não segura o login das 7h30. O `alterar` seguinte pede a mesma trava e não a sobe para uma mais forte.

O filtro `eq(sessao.usuarioId, token.usuarioId)` em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/sessao.repository.ts:83` só estreita o `UPDATE` condicional, que continua gravando uma vez só quando duas requisições chegam juntas.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts:254`: o teste de reinício só cobre reiniciar sem reuso novo. Vale um caso que reinicia e depois faz 6 reusos, para provar que o ramo `X and resets > 0` também dispara.
2. Registrar no runbook, ou no comentário do yaml, que a regra conta a menos quando a instância reinicia: os reusos de antes do reinício, ainda dentro da janela, saem da conta. É uma troca aceitável, mas precisa estar escrita para quem investigar um alerta que não disparou.
3. As recomendações 1, 2, 4 e 5 da 1ª rodada continuam valendo para a 16.0/18.0 e o `/validar`.

Auditei só lendo o código e não rodei nenhum teste, como pedido. O caso de reinício está verde apenas pela sua execução isolada, e o portão local ainda está rodando.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-18 05:15:05 · `tasks/prd-identidade-e-tenancy/5_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (a conferência responde "portão local válido para o código atual (typecheck, lint, test, infra)")
Bloqueantes: nenhum

A correção exigida na 1ª rodada foi feita:
- **Expressão do alerta** (`/home/joaquimdp/Documentos/git/Educa.ia/infra/grafana/alertas/reuso-de-refresh.yaml:47`): a instância com `resets == 0` entra pelo máximo menos o mínimo da janela. A instância com `resets > 0` entra só com o valor atual. Os dois lados comparam as séries pelos rótulos sem o nome da métrica, então o `and` casa. Nenhuma instância aparece nos dois lados, então o `or` não conta nada duas vezes e o `sum` fica certo. O reinício com o acumulado não dispara mais.
- **Teste de integração** (`/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts`): a consulta vem do arquivo provisionado. Depois de o sexto reuso disparar, o teste reinicia `api-1` e exige contador 0, expressão 0 e regra `normal`. Com a expressão antiga a conta daria 6 e o teste falharia, então ele prova a borda.
- **Runbook** (`/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:150-156`): o "Dispara quando" agora explica a regra do reinício.
- **Recomendações da rodada anterior e do tenancy-guardian**, aplicadas sem efeito colateral:
  - `.for('no key update')` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/escola-sessao.repository.ts:33`
  - `eq(sessao.usuarioId, token.usuarioId)` em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/sessao.repository.ts:83`

Recomendações:
- Quando uma instância reinicia, os reusos dela de antes do reinício que ainda estão na janela deixam de contar. Numa rajada de ataque com a API reiniciando no meio, o alerta pode ficar abaixo do limite. O risco é aceitável, porque cada reuso já encerra a família sozinho, mas vale uma linha no comentário do yaml e no runbook.
- Continuam para o relatório ao Joaquim:
  - a janela de 2 s marcada "a confirmar";
  - a linha da tabela com "janela de 30 s" até a confirmação;
  - a `escolaDoContexto()` duplicada, para uma correção futura.

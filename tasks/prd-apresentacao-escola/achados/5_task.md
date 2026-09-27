# Achados das revisões — `tasks/prd-apresentacao-escola/5_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-26 19:15:16 · `tasks/prd-apresentacao-escola/5_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** I1, I2, I4 (token e código, com o mesmo código vigente em duas escolas), R1 (os seis casos pelo link e pelo código, mais o slug inexistente, com o corpo idêntico byte a byte), E17, E26, E28, V2, P5, L10, A3, A4, A6 e A7 na parte de `salas/abrir`, e o teto de 500 nomes, que esta tarefa acrescentou. Não há teste de concorrência a exigir: a rota só lê.

**Cobertos:**
- **I1:** `arquitetura.test.ts` não mudou, e o `sala` não cita a `ResolucaoDeTenantRepository`.
- **I2:** `resolucao-de-tenant.repository.test.ts:18-19,79`.
- **I4:** `salas-abrir.int.test.ts:224-247`. O caso do mesmo código em A e em B usa o sorteio injetado e roda três vezes.
- **R1, E28 e V2:** `salas-abrir.int.test.ts:249-296`. Cada acesso abre com 200 antes de virar o caso. No V2 há outro ano `em_curso` na mesma escola, e é ele que torna observável a condição `ano_letivo.id = acesso.ano_letivo_id`. Rodei essa mutação: o R1 ficou vermelho (200 no lugar de 404) e o arquivo voltou ao original.
- **E17:** `:148-188`. Cobre reivindicado, aprovado, a outra turma e a ordem de nome.
- **E26:** `:197-205`. O teto: `:207-220`.
- **P5:** `:312-345` e `salas.test.ts:211-226`. Confere que nada foi gravado.
- **L10:** `:349-358`. **A6:** `:360-374`, com o Bearer e o cookie de B. **A7:** `:376-382`.
- **A3:** a rota entrou na varredura de `escola-montada.int.test.ts`, com a matrícula e o nome reivindicado como sentinelas.
- Não há `.skip`, e nenhum teste chama provedor de IA.

**Bloqueantes:**

1. **O A4 não cobre o caminho do token nem o código do 404 em `salas/abrir`.** Em `apps/api/test/escola-montada.int.test.ts:303-311`, a entrada da rota na varredura só envia `{ slug, codigo }`: o sucesso usa `escola.acesso.codigo`, e o 404 usa `sortearCodigoDaTurma()`.
   - Nenhum teste que captura log (`:585-624`) envia o token a `salas/abrir`. Um `logger.info` com o token, ou com o `tokenHash`, no ramo do token do `SalasService` ou do `AcessoDaSala` passaria verde. O `escola.acesso.token` está na lista de sentinelas, mas a rota nunca o recebe.
   - O código sorteado do 404 é gerado dentro da chamada e não entra em lista nenhuma. Logar o código na recusa também passaria verde.
   - O cenário A4 pede "todas as escritas e leituras novas", e a tabela da tarefa promete "nada de slug, token, código nem nome". A busca pelo token é uma leitura nova, metade da rota, e não tem teste que prove essa regra.

   **Correção exigida:** as variantes da rota anônima precisam incluir o sucesso pelo token (`{ slug, token: escola.acesso.token }`) e um 404 com um token inexistente. O token e o código usados nos 404 precisam ser gerados fora da chamada e entrar nas sentinelas do A4. Vale como segunda entrada da rota em `ROTAS_DA_A1` ou como variante extra em `variantes()`. Depois, confirme por mutação: com um log do token no ramo do token do `AcessoDaSala`, o A4 tem de ficar vermelho.

**Recomendações:**
- **Tabela de "Mutações":** falta a linha da escola e do ano no `nomeDaTurma` (`lista-livre.repository.ts:27`). É segunda camada, pelo mesmo motivo da linha do `nomesLivres`, e deve ser declarada como tal.
- **`min(1)` do token:** `salas.test.ts` testa `slug: ''` e `codigo: ''`, mas não `token: ''`. Tirar o `min(1)` do token não deixa nada vermelho.
- **Borda "dois alunos com o mesmo nome":** o `salas/abrir` deveria mostrar os dois "Ana Souza" com ids diferentes. O E24 da 6.0 cobre a reivindicação, não a lista.
- **Borda "aluno transferido":** um nome retirado pela coordenação (2.0) deveria sumir do link já vigente, como o E26 prova para o acréscimo.
- **Teste da turma que some (`salas-abrir.int.test.ts:298-308`):** ele simula a corrida com `vi.spyOn` sobre um repository nosso. É aceitável porque a corrida não é reproduzível, mas vale uma linha no teste dizendo que é simulação.

Nenhum arquivo foi editado. O arquivo mutado (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`) voltou ao original, e o `git diff --stat` dele está igual ao de antes.

## test-engineer · 2ª rodada · APROVADO · 2026-09-26 20:07:34 · `tasks/prd-apresentacao-escola/5_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** a página pública da sala (`POST /v1/salas/abrir`) abre pelo código e pelo link. Precisa responder o mesmo 404 para código inexistente, token inexistente, acesso vencido ou revogado, ano encerrado, turma excluída, outra escola e slug inexistente. Continuam exigidos:
- o contrato estrito, com escola e turma nunca vindas do corpo;
- nenhum segredo em resposta ou em log (A3 e A4);
- o isolamento (I4);
- dois alunos com o mesmo nome;
- o nome avulso acrescentado depois de gerar o acesso (aluno que chega em maio);
- o nome retirado (aluno transferido);
- o teto da lista;
- a turma que some entre as duas leituras.

**Cobertos:** a correção exigida na 1ª rodada foi feita e conferida.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts:311-323`, a rota entrou em `ROTAS_DA_A1` com o sucesso pelo token em `outrosSucessos`. Os dois 404 estão em `inexistentes`: código e token de `semAcesso`, sorteados na montagem (linha 415). O `variantes()` exige o status de cada um (linhas 470-471), então o A3 e o A4 passam pelos dois caminhos.
- As sentinelas do A4 (linhas 640-644) ganharam o token e o código de `semAcesso` e o SHA-256 dos dois tokens. O `AcessoDaSala` recebe o hash, não o token cru, então é o hash que precisa estar lá.
- Rodei a mutação eu mesmo: acrescentei `new Logger('sala').log(\`sala.abrir.${entrada.tokenHash}\`)` no ramo do token de `acesso-da-sala.ts`. O A4 ficou vermelho em `escola-montada.int.test.ts:646`. Restaurei o arquivo, o `git diff --stat` voltou igual (11 arquivos, +252/−20), e as varreduras de `salas/abrir` sem mutação passaram de novo (2/2).
- As recomendações da 1ª rodada estão aplicadas:
  - a linha do `nomeDaTurma` nas Mutações;
  - `{ slug: 'a', token: '' }` em `packages/shared/src/sala/salas.test.ts:28`;
  - o teste dos dois alunos com o mesmo nome, que também retira um deles, em `apps/api/test/salas-abrir.int.test.ts:207`;
  - o comentário de simulação no teste da turma que some (`salas-abrir.int.test.ts:317`).
- O código de produção não mudou desde a 1ª rodada, então o resto não foi reauditado.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O HMAC do código não é sentinela do A4. Um log de `entrada.codigoHmac` no ramo do código do `AcessoDaSala` não ficaria vermelho. O risco é menor que o do hash do token, porque o HMAC tem chave e não serve para abrir a sala. Mesmo assim, se o teste conseguir calcular o HMAC com a chave de teste, vale pôr o dos dois códigos (vigente e `semAcesso`) nas sentinelas.
2. O `pedir` anônimo em `escola-montada.int.test.ts:437-441` refaz à mão o que o `chamar` faz. Se o `chamar` aceitar token ausente, a rota anônima passa pelo mesmo caminho das outras e não diverge quando o `chamar` mudar.
3. A linha da mutação "token cru em log no `SalasService`" registra que ela não fica vermelha porque o `LoggerDoNest` omite a mensagem. Isso está correto e bem explicado. Fica para o `/retro` se a proteção do `LoggerDoNest` merece teste próprio, fora desta tarefa, se ainda não tiver.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-26 20:08:47 · `tasks/prd-apresentacao-escola/5_task.md`

VEREDITO: REPROVADO

Escopo: respeitado

Aderência à Tech Spec: divergência em `tasks/prd-apresentacao-escola/cenarios.md`. As cinco divergências da tarefa entraram na seção 4 e na seção 6 da `techspec.md`, e o teto também entrou em `docs/modelo-de-dados.md`. Nenhuma entrou no `cenarios.md`, que não foi alterado.

Portão local: carimbo válido para typecheck, lint e test. O `conferir` pede `--infra`, mas pela instrução desta rodada isso fica para o portão final antes do commit, então não reprovo por isso.

Bloqueantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md:152` (E17) e `:81` (R1). Duas divergências registradas em `5_task.md:124-133` criam regra nova e têm teste próprio, mas não aparecem nos cenários:
  - **O teto de 500 nomes livres, em ordem de nome.** Está em `lista-livre.repository.ts:43-44` e no teste "a lista mostra até 500 nomes livres" de `salas-abrir.int.test.ts:226`.
  - **Token, código ou slug fora do formato responde `NAO_ENCONTRADO`, e não 400.** São os casos "token fora do formato", "código fora do alfabeto" e "slug fora do formato" do R1 em `salas-abrir.int.test.ts:292-306`.

  O processo exige que toda divergência entre também no `cenarios.md` (`executar-task`, seção 2). O `/validar` confere o que foi entregue pelo `cenarios.md`, e ali essas duas regras não existem.

  Correção exigida:
  - No E17, acrescentar o teto: com 501 nomes livres, ficam os 500 primeiros em ordem de nome. "Quebra sem": o `limit` e o `orderBy`.
  - No R1, acrescentar à lista de casos o token fora do formato, o código fora do alfabeto e o slug fora do formato, todos com o mesmo corpo. "Quebra sem": o contrato que conferisse o formato e desse 400.
  - Editar `.md` não caduca rodada nem carimbo.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escola-sem-usuario.ts:10`: o `anoLetivoId` opcional vem depois do callback. Na chamada, `naEscolaSemUsuario(sala.escolaId, () => funcao(sala), sala.anoLetivoId)`, o ano fica escondido depois da função. Um objeto `{ escolaId, anoLetivoId? }` como primeiro argumento lê melhor.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/acesso-da-sala.ts:7`: `SalaResolvida` é só outro nome para `AcessoDaSalaAchado`, sem acrescentar nada. Dá para usar um nome só.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/lista-livre.repository.ts:8`: `NomeLivre.nome` está tipado `string | null`, mas o check `lista_nome_aprovado_sem_nome` já garante nome no `livre`. O `parse` da resposta segura o caso, mas o tipo diz uma coisa que o banco não permite.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-26 20:08:55 · `tasks/prd-apresentacao-escola/5_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (a entrada do aluno pela sala, às 7h30)
Rate limit: ok
Fila e prioridade: ok (não se aplica: são três leituras curtas por índice, sem nada demorado)
Concorrência: protegida (a rota só lê; não grava nada, nem `registro_acesso`)
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

Recomendações:
- **Adivinhação de código até a 7.0.** Hoje a busca pelo código (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:505`) só tem o `rl:ip` anônimo de 3.000/min. O contador de código errado por escola e a espera de 1 s vêm só na 7.0, como a tarefa já declara. Nenhum ambiente exposto deve receber a 5.0 sem a 7.0 junto. Vale registrar isso na 7.0, ou no portão do staging.
- **Balde por IP dividido.** `salas/abrir` divide o `rl:ip` anônimo com as outras rotas anônimas. A folga calculada (cerca de 1.300/min contra 3.000/min) vale para uma escola. Várias escolas de uma rede atrás do mesmo IP de saída passam do teto, e isso já está na Tech Spec (7c) como limite conhecido da A1. O `rl:ip:sala` próprio fica para o F2, e convém que entre no `TODO.md` com esse gatilho.
- **Teste de carga ainda não cobre a rota.** Os cenários de carga K1 e K2, que passam por `salas/abrir`, são da 9.0 (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/9_task.md`). Até lá, a rajada da manhã nesta rota não tem prova de carga.
- **Idas ao banco.** Cada abertura faz três idas ao banco: acesso, nome da turma e nomes livres (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/salas.service.ts:28-34`). O nome da turma poderia vir no mesmo comando dos nomes livres. É um ganho pequeno e não é necessário agora.

Conferido:
- **Rate limit.** O `@RotaAnonima` entra no `rl:ip` anônimo. Não há bloqueio novo só por IP, e o L10 prova que outro IP continua passando.
- **Índices.**
  - `token_hash` tem índice único.
  - O código cai no índice parcial único `(escola_id, codigo_hmac) where revogado_em is null`, e o filtro `revogado_em is null` está na query.
  - O ano letivo é lido pela chave primária.
  - Os nomes livres usam o índice `(escola_id, ano_letivo_id, turma_id, estado)`, com teto de 500 pelo `MAXIMO_DE_NOMES_NA_SALA`.
- **Estado em memória.** Não há: o `ListaLivreRepository` nasce a cada requisição e o contexto sai da linha do acesso.
- **Latência e erro.** A rota é medida pelo `http.server.request.duration` global, com a rota como template.
- **Provedor de IA.** Nenhum teste o chama.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-26 20:08:58 · `tasks/prd-apresentacao-escola/5_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova. As tabelas lidas já tinham `escolaId` e `anoLetivoId`: `acesso_turma`, `ano_letivo`, `escola`, `turma` e `lista_nome`.

Queries verificadas:
- `ResolucaoDeTenantRepository.acessoDaSalaPorToken` e `acessoDaSalaPorCodigo` (o `#acessoDaSala` compartilhado, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:507-517`). O slug entra no join com a escola da linha no mesmo comando. A consulta exige o ano `em_curso` pelo id e pela escola, acesso não revogado e `expira_em > now()`. Escola, ano e turma saem da linha achada. Os dois métodos têm `@SemEscopo` com justificativa escrita, a lista fechada do I2 foi atualizada e a tabela de `docs/modelo-de-dados.md` também.
- `ListaLivreRepository.nomeDaTurma` e `nomesLivres` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/lista-livre.repository.ts:27,41`). Escola e ano vêm do contexto (`exigirEscolaDoContexto` e `exigirAnoEmCurso`). Esse contexto é aberto por `AcessoDaSala.naSala` a partir da linha do acesso, nunca do cliente. A turma é filtro. A lista filtra `estado = 'livre'`, tem teto e não traz matrícula.
- Contrato `esquemaPedidoAbrirSala`: é `strictObject`, então `escolaId` e `turmaId` no corpo dão 400 (P5). A query string não é lida.
- Erro: tudo que não é acesso vigente responde o mesmo `NAO_ENCONTRADO`, com corpo idêntico byte a byte, inclusive para slug inexistente e acesso de outra escola (R1).
- Ids em UUID; o DTO de resposta não expõe id de escola, ano nem turma.
- Não há camada de rede nesta tarefa.

Teste de isolamento: presente e efetivo. Conferi com uma mutação minha. Anulei a cláusula `escola.slug = slug` do join, trocando-a por uma condição sempre verdadeira, e `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-abrir.int.test.ts` quebrou em 4 casos: os dois I4 (inclusive o do mesmo código vigente em duas escolas), o R1 e o A6. Com o código original, os 13 passam. O arquivo foi restaurado: o `git diff --stat` ficou idêntico ao anterior e o portão não foi rodado.

Bloqueantes: nenhum

Recomendações:
- `naEscolaSemUsuario` ganhou o ano como terceiro argumento opcional (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escola-sem-usuario.ts:10`). Um objeto nomeado (`{ escolaId, anoLetivoId }`) evitaria no futuro a troca de argumentos entre ids do mesmo tipo `string`.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-26 20:09:01 · `tasks/prd-apresentacao-escola/5_task.md`

**VEREDITO: APROVADO**

Nada nesta tarefa bloqueia. A rota só lê e devolve o mínimo. Não entra campo pessoal novo e nada vai para fora do sistema.

**Campos pessoais tocados:** `lista_nome.nome`, só dos nomes com estado `livre`, e `turma.nome`. As duas leituras estão em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/lista-livre.repository.ts`. A matrícula não é lida. Os nomes reivindicados e aprovados ficam de fora pelo filtro `estado = 'livre'`, que o E17 prova. O nome de um nome livre nunca é nulo, porque o check `lista_nome_aprovado_sem_nome` garante isso, e o `min(1)` da resposta não falha.

**Fora da tabela de dados do docs/lgpd.md:** nada. A linha "Lista de nomes da turma" (`docs/lgpd.md:72`) já diz que os nomes livres, sem matrícula, aparecem a quem tem o link ou o código vigente. As linhas 100 a 101 já põem `salas/abrir` no `rl:ip`.

**Autorização por objeto:** ok.
- A escola, o ano e a turma saem da linha do acesso vigente (`resolucao-de-tenant.repository.ts:342-351`). O slug é conferido no mesmo comando, no join com a escola.
- O contrato é `strictObject`, então `escolaId`, `turmaId` e qualquer campo a mais dão 400 sem gravar nada (P5).
- A troca mental de id foi feita:
  - token ou código de B com o slug de A dá 404;
  - o mesmo código vigente em A e em B abre, com cada slug, a turma da própria escola (I4, repetido 3 vezes);
  - o acesso da outra turma da mesma escola mostra só os nomes dela.
- Os 17 casos de recusa respondem com o corpo idêntico byte a byte (R1): inexistente, fora do formato, vencido, revogado, ano encerrado com outro ano em curso, turma excluída, outra escola e slug inexistente.

**Logs:** limpos.
- O `sala` e o `AcessoDaSala` não logam nada.
- A varredura A4 (`escola-montada.int.test.ts:626-651`) procura no log o slug, o token e o código vigentes, os mesmos de um acesso inexistente, os SHA-256 dos dois tokens, os nomes e as matrículas. Nada disso aparece. O A4 também confere que o log registrou os erros, para não passar com um log mudo.

**Auditoria:** nenhuma é exigida. É uma leitura anônima de nomes livres feita pelo próprio aluno, não uma leitura de dado de aluno por coordenação ou rede. A6 prova que nem a abertura nem a recusa gravam `registro_acesso`, e que nenhum cookie é emitido, mesmo com o token e um cookie de sessão de outra escola no pedido.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Nomes com sufixo aleatório, matrículas de teste e tokens de `randomBytes`.

**Bloqueantes:** nenhum.

**Exposição, conferida:**
- Resposta sai por DTO estrito, sem id de escola, ano ou turma e sem matrícula. `salas.test.ts` e E17 provam.
- `Cache-Control: no-store` no sucesso e no erro (A7).
- Erro curto e tipado, pelo filtro global.
- Tamanho do slug, do token e do código limitado no contrato.
- Teto de 500 nomes, provado com 501.

**Pergunta de fechamento:** a tarefa não guarda nem envia nada novo sobre o aluno. O que a página mostra continua na linha da lista, com a finalidade e a retenção já escritas.

**Recomendações:**
1. **Adivinhar código de turma.** Até a 7.0, o único freio contra quem tenta códigos em volume é o `rl:ip` anônimo. Quem sabe o slug de uma escola e usa muitos IPs pode ir tentando códigos para listar os nomes livres dela. Hoje só existe dado sintético, e a 7.0 já está planejada com o contador por escola. Vale registrar no `/validar` que a 7.0 tem de entrar antes de qualquer dado real, e de qualquer staging exposto.
2. **Ninguém mais deve injetar o `AcessoDaSala`.** Ele é exportado por um `SessaoModule` global (`sessao.module.ts:292`), então qualquer módulo pode injetá-lo e abrir um contexto de escola sem usuário. Hoje só o `SalaModule` o usa. Vale uma asserção no teste de arquitetura que prenda o uso ao `sala`.
3. **O `sala` importa dois arquivos do `sessao`.** O `salas.service.ts:4` importa também `../sessao/hash-do-token.js`, e não só o `AcessoDaSala`, como a nota do I1 descreve. Não é problema de privacidade, porque é uma função pura de hash. Fica para o `tenancy-guardian` confirmar se a fronteira pretendida admite isso.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/acesso-da-sala.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escola-sem-usuario.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/salas.controller.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/salas.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/lista-livre.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/salas.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-abrir.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md`

## test-engineer · 3ª rodada · APROVADO · 2026-09-26 20:20:59 · `tasks/prd-apresentacao-escola/5_task.md`

VEREDITO: APROVADO

Esta rodada é nova e só por causa do lote de recomendações. Auditei apenas esse diff e o que ele afeta. O resto continua como estava na 2ª rodada, aprovada.

**Cenários exigidos:** os mesmos da 2ª rodada. Esta rodada precisava confirmar duas coisas:
- o lote não tirou força de nenhum teste que prova a regra;
- as minhas duas recomendações foram aplicadas: o HMAC do código nas sentinelas do A4, e o `pedir` da rota anônima indo de fato sem token.

**Cobertos:**
- **`naEscolaSemUsuario` com objeto `{ escolaId, anoLetivoId? }`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escola-sem-usuario.ts:10`): a mudança é só de forma. Os quatro chamadores foram conferidos:
  - `matricula.service.ts:91`
  - `acesso-da-escola.service.ts:24`
  - `externa.service.ts:96` e `:122`
  - `acesso-da-sala.ts:33`

  A mutação "o ano no contexto" continua valendo. Sem `anoLetivoId`, o `exigirAnoEmCurso()` de `lista-livre.repository.ts:27` e `:41` recusa, e todas as aberturas com 200 ficam vermelhas.
- **`acesso-da-sala.ts`**: o apelido `SalaResolvida` saiu e `naSala` usa `AcessoDaSalaAchado`. O comportamento não mudou: continua o `NAO_ENCONTRADO` único antes de abrir o contexto.
- **`chamar` sem token** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/api-com-sessao.ts:49-52`): com `undefined`, o `Authorization` não vai. No `pedir` (`escola-montada.int.test.ts:436-440`), a rota com `anonima: true` passa `undefined`. Então o A3, o A4 e as variantes exercitam a rota pública como a página a chama, sem aproveitar sessão.
- **HMAC nas sentinelas do A4** (`escola-montada.int.test.ts:644-647`): as sentinelas têm o HMAC do código vigente e do `semAcesso`. A chave vem de `configuracaoDeTeste().sala.chaveCodigo`, lida do mesmo ambiente que o `subirApi(medidor, {}, linhasDeLog)` sobe (sem sobreposição de `sala`). Portanto a sentinela bate com o valor que a API calcula.

  O registro na seção Mutações é honesto: um log do HMAC não fica vermelho no A4, porque o `LoggerDoNest` troca por `[mensagem omitida]` a mensagem fora do formato de evento. Isso está declarado como segunda camada. A primeira camada, que é o logger, não depende deste teste.
- **Nenhum `.skip`**, nenhum teste comentado, nenhum mock novo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/5_task.md:157`, a tabela de Mutações ainda aponta `acesso-da-sala.ts:36` para "o ano no contexto". Depois da retirada do apelido, a linha é a 33. Corrigir para `/validar` não conferir uma linha errada.
2. Em `5_task.md:185`, o texto diz "os quatro chamadores" e lista três arquivos. São quatro chamadas, porque o `externa.service.ts` tem duas. Escrever "as quatro chamadas, em três arquivos".

Não rodei mutação nem o portão nesta rodada. As alegações do diff batem com o código lido.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-26 20:21:43 · `tasks/prd-apresentacao-escola/5_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A nova forma do `naEscolaSemUsuario({ escolaId, anoLetivoId? })` está registrada na seção 6 da `techspec.md` e em "Divergências resolvidas" do `5_task.md`. O teto de 500 nomes e a regra do formato aparecem agora na `techspec.md` (seção 4) e no `cenarios.md` (E17 e R1).

Portão local: o `conferir` responde "o último não rodou infra. Rode `node tools/processo/portao-local.ts --infra`." Não reprovo por isso: o Joaquim decidiu deixar o `--infra` para o portão final. O hook continua bloqueando o commit até ele rodar.

Bloqueantes: nenhum. A correção exigida na rodada anterior foi feita:
- **E17** (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md:153-155`): o cenário agora tem o teto de 500 em ordem de nome, com o caso de 501, e o "Quebra sem" cita o `orderBy` e o `limit`. O teste que cobre isso está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-abrir.int.test.ts:226-238`.
- **R1** (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md:81-86`): o cenário agora tem o token fora do formato, o código fora do alfabeto e o slug fora do formato. O "Quebra sem" diz que o contrato que desse 400 quebraria o teste. Os testes estão em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-abrir.int.test.ts:293-308`.

Nas recomendações aplicadas deste lote não encontrei defeito:
- As quatro chamadas do `naEscolaSemUsuario` em `matricula.service.ts`, `acesso-da-escola.service.ts` e `externa/externa.service.ts` mudaram só de forma. Não sobrou nenhuma na forma antiga.
- O `AcessoDaSala` passa o ano da linha achada, e não um ano vindo do cliente.
- O apelido `SalaResolvida` saiu.
- O `chamar` com token `undefined` não manda cabeçalho `Authorization`.
- A recusa de mudar `NomeLivre.nome` está justificada: o `parse` do contrato de saída barra nome nulo.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escola-sem-usuario.ts:12`: o ternário que monta o contexto repete `requisicaoId` e `escolaId` nos dois ramos. `{ requisicaoId, escolaId, ...(anoLetivoId === undefined ? {} : { anoLetivoId }) }` diz o mesmo com menos repetição e mantém o `exactOptionalPropertyTypes`.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-26 20:22:06 · `tasks/prd-apresentacao-escola/5_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o que mudou desde a 1ª, que foi aprovada, e o que essa mudança afeta.

**Campos pessoais tocados:** nenhum novo nesta rodada. O lote é reorganização de código e reforço de teste. A leitura de `lista_nome.nome` só com estado `livre` e de `turma.nome`, aprovada na 1ª rodada, não mudou.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok.
- `naEscolaSemUsuario({ escolaId, anoLetivoId? }, funcao)` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escola-sem-usuario.ts:10` mudou só a forma. A escola e o ano continuam vindo de quem chama no servidor, nunca do cliente. As três chamadas de login (`matricula.service.ts:91`, `acesso-da-escola.service.ts:24`, `externa/externa.service.ts:96` e `:122`) passam só `{ escolaId }`, que é o comportamento de antes.
- Só `acesso-da-sala.ts:33` passa o ano. Ele vem da linha do acesso vigente achada pela `ResolucaoDeTenantRepository`, com o slug conferido no mesmo comando.
- A saída do apelido `SalaResolvida` não mexe em nada: o tipo continua `AcessoDaSalaAchado`.
- As respostas continuam iguais em todos os casos: acesso inexistente, vencido, revogado, de outra escola ou slug desconhecido dão o mesmo `NAO_ENCONTRADO` (`acesso-da-sala.ts:32`).

**Logs:** limpos.
- A varredura A4 em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts` agora procura mais coisas no log:
  - o token e o código de acesso inexistentes (`semAcesso`);
  - o SHA-256 dos dois tokens;
  - o HMAC dos dois códigos.
- No A3, a rota anônima procura também as duas matrículas e o nome reivindicado no corpo de todas as variantes.
- Isso reforça a prova de que nem o valor derivado do segredo vai para log.

**Auditoria:** presente onde a regra exige. `salas/abrir` é leitura anônima pelo link ou pelo código vigente. Não é leitura por coordenação ou rede, então não pede registro. A varredura confirma que ela não grava nenhum (`auditoria: []`).

**Envio externo:** nenhum.

**Seed/fixture:** sintético. O token e o código de `semAcesso` são sorteados na montagem, com `randomBytes` e `sortearCodigoDaTurma()`.

**Mudança no helper de teste:** `chamar` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/api-com-sessao.ts:49` aceita token `undefined` e então não manda o cabeçalho `Authorization`. A rota anônima passa a ser testada sem credencial de verdade, o que é mais fiel do que antes. Só é usado em teste.

**Minhas recomendações da 1ª rodada:**
- **Nenhum ambiente exposto nem dado real antes da 7.0:** registrada no `TODO.md`, no portão do staging. Aceito o destino.
- **Prender o `AcessoDaSala` ao `sala` no teste de arquitetura:** registrada no `TODO.md`, com o motivo de a tarefa exigir o `arquitetura.test.ts` sem mudança. Aceito.
- **O `sala` importar `sessao/hash-do-token.ts`:** recusada, com o motivo de ser uma função pura que o `operacao` e o `sala` da 4.0 já importam. Aceito: não expõe dado nem banco.

Bloqueantes: nenhum

Recomendações:
- Quando a asserção do `AcessoDaSala` entrar no `arquitetura.test.ts`, incluir também que o parâmetro `anoLetivoId` de `naEscolaSemUsuario` só é passado de dentro de `sessao/acesso-da-sala.ts`. Hoje isso é convenção, e é o único caminho que põe o ano no contexto sem usuário.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-26 20:22:07 · `tasks/prd-apresentacao-escola/5_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (a abertura da sala às 7h30 e o login por matrícula, que agora chama `naEscolaSemUsuario` de outra forma)
Rate limit: ok
Fila e prioridade: ok (não se aplica: são leituras curtas por índice, sem nada demorado no request)
Concorrência: protegida (a rota só lê; o diff desta rodada não grava nada)
Índice e paginação: ok (o diff não traz query nova; as do acesso e dos nomes livres são as mesmas da 1ª rodada)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

Recomendações:
- As três recomendações que você deixou pendentes na 1ª rodada continuam valendo e estão registradas. As duas primeiras estão em `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md`, e a terceira fica para a tarefa 9.0.
  - A página da sala não vai a nenhum ambiente exposto sem a 7.0.
  - O `rl:ip:sala` próprio tem gatilho definido.
  - A carga dos cenários K1 e K2 fica para a 9.0 (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/9_task.md`). Até ela, a rajada da manhã em `salas/abrir` continua sem prova de carga.
- A recomendação de trazer o nome da turma no mesmo comando dos nomes livres foi recusada com motivo, e eu aceito a recusa. São duas idas curtas por índice, e isso não bloqueia.

O que conferi no diff desta rodada:
- **Troca da assinatura de `naEscolaSemUsuario`.** Mudou em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escola-sem-usuario.ts:10-12`. As quatro chamadas antigas passam só `{ escolaId }`: `matricula.service.ts:91`, `acesso-da-escola.service.ts:24`, `externa/externa.service.ts:96` e `:122`. Nesse caso o contexto montado é o mesmo de antes, sem `anoLetivoId` e com o mesmo `requisicaoId`. O login por matrícula e o limite por conta continuam iguais. Só `acesso-da-sala.ts:33` passa o ano, e o ano vem da linha do acesso, nunca do cliente.
- **Estado em memória.** O `AcessoDaSala` é um provider sem estado, montado a partir da `ResolucaoDeTenantRepository`, e o `ListaLivreRepository` continua nascendo a cada requisição. Nada quebra com duas instâncias.
- **Testes.** O `chamar` com token `undefined` em `apps/api/test/api-com-sessao.ts:49-55` só tira o cabeçalho `Authorization`. O `escola-montada.int.test.ts` agora cobre a rota anônima no A3 e no A4, com os 404 pelo código e pelo token que não são de acesso nenhum. As sentinelas de log incluem o token, o código, o SHA-256 do token e o HMAC do código. Nenhum teste chama provedor pago.

## test-engineer · 4ª rodada · APROVADO · 2026-09-26 20:31:43 · `tasks/prd-apresentacao-escola/5_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da 3ª rodada, que aprovei. Não reauditei o que não mudou. Esta rodada cobre só a troca do ternário pelo espalhamento condicional em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escola-sem-usuario.ts:12` e as mudanças no documento.

**Cobertos:**
- **A troca não muda o comportamento.** Sem `anoLetivoId`, o contexto continua `{ requisicaoId, escolaId }`, sem a chave do ano. Com ele, continua `{ requisicaoId, escolaId, anoLetivoId }`. Quem chama sem o ano (`matricula.service.ts`, `acesso-da-escola.service.ts` e as duas chamadas de `externa.service.ts`) segue sem o ano no contexto, igual a antes.
- **A mutação do ano no contexto continua valendo.** A linha 157 da tabela de Mutações aponta para `escola-sem-usuario.ts:12`, que depois da troca é mesmo a linha que põe o ano no contexto. Se o espalhamento sair, o `exigirAnoEmCurso` recusa, e os testes de abertura com 200 em `salas-abrir.int.test.ts` quebram. O teste continua provando a regra.
- **As referências de `acesso-da-sala.ts` estão certas.** Conferi no arquivo: a linha 32 é `sala === undefined` → `NAO_ENCONTRADO`, e a linha 33 é a chamada que passa `{ escolaId, anoLetivoId }`.
- **As duas recomendações da 3ª rodada foram aplicadas.** A tabela de Mutações ganhou as linhas `:32` e `:33` de `acesso-da-sala.ts`, e o texto agora diz "as quatro chamadas, em três arquivos".
- **As linhas novas em "Recomendações sem aplicar" batem com o que foi feito.** A do `revisor-geral` (2ª rodada) aparece como aplicada, e a do `privacy-guardian` (2ª rodada) foi para o `TODO.md`.
- Nenhum `.skip`, nenhum teste comentado e nenhum mock novo.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. As da 3ª rodada já foram aplicadas.

Não rodei nenhuma mutação. A troca não muda o que o código faz, então a análise estática basta, e o portão local verde informado já cobre typecheck, lint e test. Não editei nenhum arquivo.

## privacy-guardian · 3ª rodada · APROVADO · 2026-09-26 20:32:20 · `tasks/prd-apresentacao-escola/5_task.md`

VEREDITO: APROVADO

Esta rodada cobriu só o que mudou desde a 2ª rodada aprovada: uma linha de código e o item novo no `TODO.md`. O resto não mudou e não foi reauditado.

**A mudança em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escola-sem-usuario.ts:12`** não altera o comportamento. O objeto do contexto é o mesmo de antes: `requisicaoId` e `escolaId` sempre entram, e `anoLetivoId` só entra quando é informado. Só se escreveu de outro jeito (acréscimo condicional em vez de dois objetos no ternário).
- A escola continua vindo de quem chama a função (a escola achada pelo slug ou a linha da sala), nunca do cliente.
- Nenhum campo pessoal novo, nenhum log e nenhum dado no corpo de erro.
- Só `acesso-da-sala.ts:33` passa `anoLetivoId`. Os outros quatro pontos que chamam a função (`acesso-da-escola.service.ts:24`, `matricula.service.ts:91`, `externa.service.ts:96` e `:122`) passam só `{ escolaId }`.

**A recomendação da 2ª rodada foi registrada.** O `TODO.md`, nas linhas 197 a 201, tem o item que prende o `anoLetivoId` de `naEscolaSemUsuario` a `sessao/acesso-da-sala.ts` no teste de arquitetura, com dono (Joaquim) e gatilho (a próxima tarefa que tocar o teste).

Campos pessoais tocados: nenhum nesta rodada
Fora da tabela de dados do docs/lgpd.md: nenhum
Autorização por objeto: ok (não mudou)
Logs: limpos
Auditoria: presente (não mudou)
Envio externo: nenhum
Seed/fixture: sintético (não mudou)
Bloqueantes: nenhum
Recomendações: nenhuma nova. A da 2ª rodada (a trava no `arquitetura.test.ts`) continua pendente no `TODO.md` até a próxima tarefa que tocar o teste.

## infra-guardian · 3ª rodada · APROVADO · 2026-09-26 20:32:23 · `tasks/prd-apresentacao-escola/5_task.md`

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
Recomendações: nenhuma nova.

Auditei só o que mudou desde a 2ª rodada, que é a linha 12 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escola-sem-usuario.ts`. O contexto que ela monta é o mesmo de antes nos dois casos:
- **Sem `anoLetivoId`:** fica só `{ requisicaoId, escolaId }`.
- **Com `anoLetivoId`:** fica `{ requisicaoId, escolaId, anoLetivoId }`.

A chave `anoLetivoId` continua ausente quando não é informada, em vez de aparecer com valor `undefined`, então nenhuma leitura do contexto muda. A escola continua vindo da `ResolucaoDeTenantRepository`, nunca do cliente, e o `requisicaoId` é o mesmo de antes. Nada no login, no acesso da sala ou nas duas instâncias muda com isso. A aprovação da 2ª rodada vale sem ressalva.

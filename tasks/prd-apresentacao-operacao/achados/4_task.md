# Achados das revisões — `tasks/prd-apresentacao-operacao/4_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-23 22:25:30 · `tasks/prd-apresentacao-operacao/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** C40, C41, C42, C46, C47, C48, C49, C6 (parte), C35, C36 (parte), acesso vencido com sessão viva, banco fora, concorrência de `ultimoUsoEm`. Somam-se a regra de permissão (credencial de escola em rota da operação e o contrário), o isolamento pelo contexto só com `operadorId`, os prazos de 30 min e 8 h e a leitura de `sid` de outro operador.

**Cobertos (todos):**
- **C40, C41, C42 e C36:** estão em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`. Cada conferência tem um controller falso que ela precisa reprovar: marcador sem guarda, rota sem marcador, marcador fora de `/v1/operacao`, prefixo parecido (`/v1/operacaox`) e marcador citado em comentário. Por isso o teste falha se a regra sair.
- **C46:** usa a lista gerada das rotas registradas. Testa seis credenciais (coordenador, professor, aluno, desafio, cookie e nenhuma) e compara status e corpo com uma rota inexistente. Antes, confirma que as três sessões de escola são válidas.
- **C47:** mesmo método de comparação. Se a linha `bearerDeOperador` da `GuardaDeAutenticacao` sair, a rota volta a dar 401 e o teste fica vermelho.
- **C48:** prova o vermelho de verdade, porque a sessão de escola alcança o handler (`{ alcancou: true }`).
- **C49:** confere a mensagem do escopo e que o contexto tem só `operadorId` e `requisicaoId`.
- **C6:** roda o `ops:operador desativar` de verdade, e a sessão do outro operador continua entrando.
- **C35:** dois operadores atrás do mesmo IP. Se o limite fosse por IP, o segundo levaria 429. Se não houvesse limite, o primeiro não levaria 429.
- **Acesso vencido:** dá `ACESSO_VENCIDO`, e com a sessão encerrada passa a dar `SESSAO_ENCERRADA`.
- **Banco fora:** o Postgres é pausado de verdade. As duas requisições em paralelo recebem 503 com `Retry-After`, e depois o acesso volta.
- **Concorrência:** 20 requisições em `Promise.all` numa sessão só. O teste conta o retorno booleano do `update` condicional: sem a condição no `where`, as 20 gravariam. Também cobre "mais 20 no mesmo minuto não gravam" e "passado o minuto, grava de novo".
- **Unidade:**
  - `prazos-da-sessao.test.ts` testa a fronteira de 30 min (30 min contra 29 min 59 s) e a de 8 h.
  - `token-de-operador.test.ts`: o token vencido não esconde outra falha (outra chave, outro emissor, outro `typ`, token com `esc`), e o `verificarToken` da escola recusa o `typ` de operador.
  - `contexto.test.ts`: o operador e a sessão de escola nunca ficam juntos no contexto, em nenhuma ordem.
- **Fixture:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-de-operador.ts` assina com o `EmissorDeTokenDeOperador` de produção e a chave do ambiente, como a tarefa exige. O dado é sintético (e-mail em `.invalid`).
- **Proibições:** não há `.skip`, `.only`, teste comentado nem mock que esconda a regra. O único mock é o do limitador no C36 de arquitetura, e a regra de verdade está provada no C35 de integração. Nada chama provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Acesso vencido não grava uso.** A divergência registrada diz que a requisição com acesso vencido não grava `ultimoUsoEm` (`apps/api/src/operacao/guarda-de-operador.ts`, `&& !token.vencido`). Se essa condição sair, nenhum teste falha. Vale um caso: sessão com `ultimo_uso_em` de 2 min atrás e token vencido; a chamada dá `ACESSO_VENCIDO` e o `ultimo_uso_em` não muda.
2. **`rl:op` conta o token vencido.** Isso também é divergência registrada, mas o C36 de arquitetura usa só token novo. Falta um caso com `tokenEm(-11 min)` em que `consumirDeOperador` é chamado com o `sub`.
3. **Operador desativado com a sessão aberta.** O C6 passa porque o `desativar` já encerra as sessões (`encerrarSessoes`). A cláusula `operadorDesativadoEm` da guarda, e o `innerJoin` com `operador` em `lerSessaoParaGuarda`, só têm teste em unidade, sobre a função pura. Falta um caso de integração: `update operador set desativado_em = now()` sem encerrar a sessão, e a chamada dá `SESSAO_ENCERRADA`.
4. **Desativação entre a guarda e o service.** O ramo `SESSAO_ENCERRADA` de `apps/api/src/operacao/eu.service.ts` (quando `daSessao` volta `undefined`) não tem teste. Um teste de unidade do service, com o repository falso devolvendo `undefined`, resolve.
5. **Teste do banco fora.** Ele pausa o Postgres do compose compartilhado. É o mesmo padrão de `sessao-guarda.int.test.ts` e dos outros, então não bloqueia. Mas se os arquivos de integração rodarem em paralelo, vale confirmar que a pausa não derruba os outros de forma intermitente. Se derrubar, o lugar dele é o `test:infra` (D52).

Não rodei a suíte: o veredito é pela leitura dos testes, e o portão carimbado que você informou está verde.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-23 22:26:20 · `tasks/prd-apresentacao-operacao/4_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (as guardas globais de autenticação e de limite, que toda rota de escola atravessa)
Rate limit: ok
Fila e prioridade: ok (a tarefa não põe nada em fila, e nada nela é demorado dentro do request)
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

**O que foi conferido para cada item:**
- **Rate limit.** O limite do operador conta pelo `sub` do token de operador (`rl:op:{sub}`), em balde próprio, com teto no ambiente pela variável `LIMITE_REQ_OPERADOR_MIN` e o mesmo seguro em memória dos outros limites quando o Redis cai. Não há limite nem bloqueio por IP. O teste C35 prova que dois operadores atrás do mesmo IP não dividem o limite.
- **Custo nas rotas de escola.** Nas rotas de escola, a `GuardaDeAutenticacao` ganha só a leitura do `typ` no cabeçalho do JWT, sem verificar assinatura. Isso não aumenta o custo às 10h. A verificação completa do token de operador acontece só nas rotas `@RotaDeOperacao`.
- **Estado em memória.** A sessão e o `ultimoUsoEm` ficam no Postgres, e o limite fica no Redis. Nada quebra com duas instâncias.
- **Concorrência.** O `marcarUsoDaSessao` põe a condição de "no máximo uma vez por minuto" dentro do próprio `update`, em vez de ler, verificar e gravar. O teste com 20 requisições em `Promise.all` prova que só uma grava, e ele falharia se a condição saísse.
- **Índice.** A leitura da sessão é pela chave primária (`id`), junto com o `operador_id`. A tabela é pequena e não cresce com aluno.
- **Banco fora.** A resposta é 503 com `Retry-After`, nunca 401: a queda do banco não desloga o operador. O aviso no log sai no máximo a cada 30 s e não leva a consulta nem a mensagem do erro.

**Recomendações:**
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/operacao-isolamento.int.test.ts:274`: o teste "banco fora" pausa o Postgres do compose que as outras suítes também usam. Se os arquivos de integração rodarem em paralelo na esteira, isso pode derrubar outras suítes de vez em quando. Se aparecer um vermelho intermitente, mova o teste para o `test:infra` (D52).
2. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/guarda-de-operador.ts:74`: a condição `&& !token.vencido`, que faz o acesso vencido não gravar uso, não tem teste. O test-engineer já apontou isso na recomendação 1 dele. Vale fechar antes da 8.0, porque essa condição é o que impede um token vencido de manter a sessão viva além dos 30 min.
3. O `verificarTokenDeOperador` aceita um token vencido há qualquer tempo como "vencido", e cada requisição com ele faz uma leitura no Postgres. Hoje o `rl:op` segura isso. Na 7.0/8.0, vale considerar recusar sem ir ao banco quando o `exp` passou há mais de 8 h, porque aí a sessão com certeza já terminou.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-23 22:26:27 · `tasks/prd-apresentacao-operacao/4_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: só o apelido e o nome do operador Turmma. Os dois já existem desde a 3.0. O nome é lido pela primeira vez aqui, por `OperadorRepository.daSessao`, e sai apenas para o próprio operador em `GET /v1/operacao/eu`. A guarda lê horários da sessão de operador (`encerradaEm`, `expiraEm`, `ultimoUsoEm`) e grava `ultimoUsoEm`. Nenhum dado de aluno, professor ou escola é tocado.

Fora da tabela de dados do docs/lgpd.md: nenhum. A conta de operador está na linha 76 de `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md` e a sessão de operador na linha 78, que diz "sem IP". O código confirma: a guarda não grava IP, e `rl:op` conta pelo `sub` do token, não pelo endereço.

Autorização por objeto: ok.
- `/eu` usa só o `operadorId` que a `GuardaDeOperador` põe no contexto. Nada vem da URL nem do corpo.
- `lerSessaoParaGuarda` e `marcarUsoDaSessao` casam `sessaoId` junto com `operadorId`. Um `sid` de outro operador no token não lê nem grava nada.
- Sessão de escola, desafio, cookie ou nenhuma credencial numa rota da operação respondem igual a uma rota inexistente, em status e corpo (C46). O token de operador numa rota de escola também (C47).
- O contexto do operador leva só `operadorId`. Um repository de escola chamado por engano falha fechado (C49).

Logs: limpos. O único log novo é `operacao.sessao_indisponivel`, espaçado, sem o erro, a consulta ou qualquer identificador (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/guarda-de-operador.ts:59`).

Auditoria: nada nesta tarefa exige auditoria. `/eu` não lê dado de aluno, não exporta e não altera permissão. A auditoria da operação já cobre criar e desativar operador (3.0).

Envio externo: nenhum. Não há chamada a provedor de IA nem a terceiro.

Seed/fixture: sintético. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-de-operador.ts` usa apelido sorteado, o nome fixo "Pessoa Sintética da Operação" e e-mail em `.invalid`, e `fechar` apaga o que criou. O teste de isolamento usa `ana@turmma.invalid`.

Checklist
- DTO de saída explícito: `esquemaRespostaEuDoOperador` é `.strict()`, com apelido e nome. O teste prova que id e e-mail são recusados. O repository devolve só esses dois campos.
- "Não encontrado" e "sem permissão" respondem igual: sim, nos dois sentidos, e o teste compara status e corpo com uma rota inexistente. O limite `rl:op` não conta quando não há token de operador válido, o que evita um 429 que revelaria que a rota existe.
- Erro sem stack trace e sem dado: os erros são tipados (`ACESSO_VENCIDO`, `SESSAO_ENCERRADA`, 503 `INDISPONIVEL_TENTE_DE_NOVO`) com mensagens curtas do catálogo. `/eu` responde com `Cache-Control: no-store`.
- Arquivo, convite, exportação e ciclo de vida: não se aplicam a esta tarefa. O convite e o expurgo de operador ficam para a 5.0 a 9.0.
- Pergunta de fechamento: a tarefa não grava nada novo sobre aluno e não envia nada a lugar nenhum, então não muda o que o sistema responde a uma secretaria sobre um aluno.

Bloqueantes: nenhum.

Recomendações:
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts`, `daSessao` devolve `undefined` quando o nome é nulo, o que acontece na desativação, já que o nome é apagado. Vale um teste de unidade do `EuDoOperadorService` com o repository devolvendo `undefined`, para provar que o nome de um operador desativado nunca sai (é a recomendação 4 do test-engineer). Isso reforça a retenção "apagado na desativação" da linha 76 do mapa de dados.
2. Vale um teste de integração que marque o operador como desativado sem encerrar as sessões e confira `SESSAO_ENCERRADA` (é a recomendação 3 do test-engineer). Hoje o C6 passa porque o `desativar` já encerra as sessões, e o `innerJoin` da guarda não tem prova própria.
3. Quando a 9.0 escrever o expurgo, confirmar que `ultimo_uso_em` segue o prazo da sessão (30 dias após encerrar ou expirar), que já está na tabela.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-23 22:26:29 · `tasks/prd-apresentacao-operacao/4_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta tarefa, e nenhuma migration. `operador` e `sessao_operador` são tabelas da operação sem `escola_id`, conforme a Tech Spec da A0, seção 6. O C45 continua cobrindo que só o `OperadorRepository` toca essas tabelas.

Queries verificadas:
- `OperadorRepository.lerSessaoParaGuarda` filtra por `sessaoOperador.id` e também por `operadorId`, ambos vindos do token verificado. Um `sid` de outro operador não lê nada, e há teste com `sub` e `sid` misturados.
- `OperadorRepository.marcarUsoDaSessao` usa os mesmos dois filtros, mais "sessão não encerrada" e a condição de um minuto dentro do próprio `update`.
- `OperadorRepository.daSessao` busca pelo `operadorId` do contexto, gravado pela `GuardaDeOperador`. Nenhum parâmetro do cliente entra.
- `EuDoOperadorService.obter` responde pelo contrato estrito `esquemaRespostaEuDoOperador`, que devolve só apelido e nome.
- `GET /v1/operacao/eu` não aceita `escolaId`, query nem corpo. O contexto do operador leva só `operadorId`, e `definirOperadorNoContexto` recusa gravar se já houver outra identidade.
- `GuardaDeAutenticacao`: bearer com `typ` de operador em rota de escola responde 404, igual a rota inexistente.
- Rotas `@RotaDeOperacao` não passam pelas guardas de escola (`rotaSemSessao`) e ficam presas à `GuardaDeOperador`, aplicada pelo próprio marcador.
- Não aparece nenhum `@SemEscopo()`.

Teste de isolamento: presente e efetivo.
- C46 (`apps/api/test/operacao-isolamento.int.test.ts:158`): sessões de coordenador, professor e aluno, mais desafio, cookie e requisição sem credencial, em toda rota `@RotaDeOperacao` registrada. Compara status e corpo com uma rota inexistente. Se a guarda sai do handler, o teste quebra, e o C48 (`:309`) prova isso: a rota sem guarda aparece como diferente, e a sessão de escola chega ao handler.
- C47 (`:187`): token de operador em toda rota de escola com sessão, igual a rota inexistente. Se a verificação do `typ` sai da `GuardaDeAutenticacao`, a resposta vira 401, diferente do 404, e o teste quebra.
- C49 (`:318`): um repository de escola chamado numa rota de operador falha com "consulta com escopo sem escola no contexto", e o contexto tem só `operadorId` e `requisicaoId`.
- O teste do `sid` de outro operador (`:221`) quebra se a cláusula `eq(sessaoOperador.operadorId, operadorId)` sair de `lerSessaoParaGuarda`.
- As listas de rotas vêm do `DiscoveryService` e não são escritas à mão.
- C40 a C42 e C36 estão em `apps/api/test/arquitetura.test.ts`, com controllers de mentira que provam que as conferências reprovam o que devem.

Id: UUID. O `esquemaClaimsDeOperador` exige `z.uuid()` em `sub` e `sid`.

Mensagens de erro: credencial errada dá 404 `NAO_ENCONTRADO`, igual a rota inexistente. `SESSAO_ENCERRADA` e `ACESSO_VENCIDO` só aparecem para quem tem token de operador com assinatura válida, então não revelam dado de escola.

Camada rede: não é tocada.

Bloqueantes: nenhum

Recomendações:
- `packages/nucleo/src/limite/rota-sem-sessao.ts:258` (hoje) e `apps/api/src/operacao/marcadores.ts:20`: `@EntradaDeOperacao()` pula as quatro guardas de escola e não põe nenhuma guarda no lugar. Hoje nenhuma rota usa esse marcador, então não há exposição. O controle depende da lista fechada de sete rotas (C43) e de cada service conferir convite, senha ou desafio antes de qualquer leitura. Vale reauditar isso com rigor na 5.0 a 8.0.
- `packages/nucleo/src/contexto/contexto.ts:109`: linha em branco duplicada antes de `definirOperadorNoContexto`.
- `packages/nucleo/src/identidade/rota-sem-sessao.test.ts:5`: o `SetMetadata` é importado de `@nestjs/common` numa linha separada, depois do import de `vitest`. Dá para juntar ao import de tipo de `@nestjs/common` que já está no topo.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-23 22:27:08 · `tasks/prd-apresentacao-operacao/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A única divergência de fundo está registrada em "Divergências resolvidas nesta tarefa", como pede o `/executar-task`. É o valor do `rl:op`, que foi para a variável de ambiente `LIMITE_REQ_OPERADOR_MIN` e não para a `ConfiguracaoOperacional`, porque esta é por escola e o operador não tem escola. Nenhum critério da tabela de testes foi rebaixado.
Portão local: carimbo válido (typecheck, lint, test, infra)
Bloqueantes: nenhum

O que conferi e não achei problema:
- **Rotas das tarefas 5.0 a 8.0:** nenhuma rota `@EntradaDeOperacao` foi implementada. Só existe o decorador, que a 4.1 pede.
- **Ordem da `GuardaDeOperador`:** primeiro 404 para qualquer credencial que não é de operador, depois 503 com o banco fora, depois `SESSAO_ENCERRADA`, e só então `ACESSO_VENCIDO`. Bate com a seção 5 da Tech Spec.
- **Gravação do `ultimoUsoEm`:** a condição de uma vez por minuto está no próprio `update`, então duas requisições juntas não gravam duas vezes.
- **Leitura da sessão:** `lerSessaoParaGuarda` casa o `sid` e o `sub` juntos, e há teste com um token que mistura a sessão de um operador com o id de outro.
- **Contexto:** leva só o `operadorId`. Um repository de escola chamado numa rota de operador falha com erro (C49).
- **Limite:** a `GuardaDeLimite` não conta nada sem um token de operador que confira. Assim não sai um 429 que denunciaria uma rota que existe.
- **Saída do `/eu`:** passa pelo contrato estrito de `packages/shared` e vai com `no-store`.
- **Dado nulo:** o `nome` nulo em operador ativo é impedido pelo check `operador_ativo_com_nome_e_email`, então o `daSessao` não devolve `undefined` indevido.

Recomendações:
- O formato do apelido `^[a-z][a-z0-9-]{1,31}$` agora existe em três lugares: `FORMATO_OPERADOR` em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/auditoria.ts:6`, o check do banco e `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/eu.ts:4`. Levar a constante para `packages/shared` e fazer o núcleo importar de lá.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/rotas-registradas.ts:37` reescreve o `metodosDaCadeia` que já existe em `conferencia-das-permissoes.ts`. Exportar esse e reusar.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operacao.module.ts:21` cria um segundo `OperadorRepository` para o service, e a guarda já recebe outro pelo `SESSOES_DE_OPERADOR`. Registrar o repository uma vez como provider e injetar nos dois.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/contexto/contexto.ts`: tem uma linha em branco duplicada antes de `definirOperadorNoContexto`.

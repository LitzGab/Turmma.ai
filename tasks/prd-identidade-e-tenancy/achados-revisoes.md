# Achados das revisões

Escrito pelo hook `tools/processo/revisoes.ts`. Lido por `/retro`. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-15 19:27:59 · `tasks/prd-identidade-e-tenancy/2_task.md`

VEREDITO: REPROVADO

O motivo é um só e a correção é pequena. O teste do ano letivo não distingue "ano em curso" de "qualquer ano da escola". Remover a condição de situação da consulta da guarda não deixa nenhum teste vermelho. O resto da tabela está coberto por testes que falham quando a regra é removida.

**Cenários exigidos:** os 12 da tabela "Testes que provam a regra" do `2_task.md`. Somam-se a eles os casos do domínio que a tarefa toca: virada de ano letivo, usuário desativado (transferência ou saída), a mesma pessoa em duas escolas, e muitos pedidos do mesmo usuário (regra 80).

**Cobertos:**
- **Caminho feliz:** roda o `npm run ops:sessao-sintetica` real e compara o corpo de `/v1/sistema/contexto` com a linha gravada de `sessao ⋈ usuario`.
- **Corte na requisição seguinte (RF5):** sessão encerrada dá 401 com o token antigo e com um token novo da mesma sessão. Usuário desativado também dá 401, e o colega da mesma escola segue entrando. Sessão expirada e inatividade de 35 min dão 401, e 34 min ainda vale (`agora` vem do banco, então não depende do relógio da máquina). A unidade em `avaliar-sessao.test.ts` cobre a coluna da equipe e a inatividade configurada pela escola.
- **Isolamento:** as quatro combinações de `sub`/`esc`/`sid` entre A e B. O `sid` de A com `esc` de B pega a falta de `escola_id` no where; o `sid` de B com `sub` de A pega a falta da checagem `usuario_id ≠ sub`. As duas mutações que você rodou batem com isso. As FKs compostas de `sessao` e `auditoria` estão provadas no banco (`tabelas-de-identidade.int.test.ts`).
- **`sid` de outro usuário da mesma escola:** coberto, e a sessão legítima continua passando.
- **Carga:** a rajada mostra que o spy conta de fato (8 leituras, 12 respostas 429 sem leitura). Por isso o "0 leituras" com JWT inválido não é vazio. Se a ordem virasse sessão antes de limite, seriam 20 leituras e o teste falharia.
- **Postgres pausado:** dois pedidos em paralelo dão 503 `INDISPONIVEL_TENTE_DE_NOVO` com `Retry-After`, e a mesma sessão volta a 200. A unidade da guarda cobre erro de conexão e `statement_timeout`.
- **Escola sem ano em curso:** dá 200 com `anoLetivoId` nulo, `exigirAnoEmCurso` dá 404, e o ano da outra escola não vaza. Isso pega o left join sem escola.
- **Matriz:** comparada nos dois sentidos com a expectativa escrita à mão, com cobertura total de papel × recurso × ação. A rede só tem `nunca` ou `agregado`, e o indicador de professor segue a regra 70, item 8. `alcanceDe` fecha para `__proto__`, `constructor` e papel inexistente.
- **Permissão:** o aluno na rota de turma recebe o mesmo corpo de rota inexistente, e o professor recebe 200 na mesma rota. O boot cai com `EsquecidoController.rotaNova` e sobe com as rotas marcadas.
- **Varredura de contratos:** reprova a fixture com `senhaHash`, `mfaSegredo`, `sujeitoExterno`, `refreshToken` e `Cookie` em qualquer profundidade (array, union, record). Também confere que enxerga os contratos reais, e recusa `email` fora de contrato da equipe.
- **Arquitetura:** a fixture reprova importação, reexportação e `import()` dinâmico de fora de `apps/api/src/sessao`, e aceita o arquivo de dentro.
- **`ops:sessao-sintetica`:** staging, produção e `AMBIENTE` ausente saem com código 2 sem abrir o banco e sem criar sessão, e o comando real com `AMBIENTE=producao` também. Estão cobertos ainda quantidade, papéis (aluno sem conta), escola inexistente e argumentos inválidos sem ecoar o valor.
- **Testes do F0 migrados:** nenhum teste foi removido nem pulado, e o número de `it` é igual antes e depois em todos os arquivos. Nenhuma asserção foi afrouxada, exceto um `toEqual` que virou `toMatchObject` em `config.test.ts`, onde o `sid` agora é aleatório. Não há `.skip` nem `.only`.
- **`limite.int.test.ts`, "a mesma conta com usuário em duas escolas":** a intenção foi preservada. Desde a seção 1 da Tech Spec, o limite "somado entre as escolas" do mesmo `sub` deixou de existir, e ninguém consegue produzir esse caso sem forjar token. O que importa continua provado:
  - cada escola conta a própria cota, porque somadas numa chave só (20 + 10) a A recusaria o `outroDaA`;
  - o usuário da mesma pessoa na outra escola não é travado pelo limite do usuário da A, o que pegaria um limite por conta.

**Faltando (exigência para aprovar):**
1. **Virada de ano letivo na leitura da guarda.** Hoje a escola "sem ano em curso" não tem ano nenhum. Se `eq(anoLetivo.situacao, 'em_curso')` sair do `leftJoin` em `packages/nucleo/src/identidade/sessao.repository.ts`, todos os testes continuam verdes. Em janeiro, isso deixaria turma e vínculo caírem num ano encerrado ou planejado. O que acrescentar em `apps/api/test/sessao-guarda.int.test.ts`:
   - Uma escola com um ano `encerrado` (2025) e outro `planejado` (2027), sem nenhum em curso. O contexto deve trazer `anoLetivoId` nulo e `/teste-sessao/ano` deve dar 404 `NAO_ENCONTRADO`.
   - Uma escola com um ano `encerrado` e outro `em_curso`. O contexto e a rota devem devolver o id do ano em curso, não o encerrado.
   - Depois de escrever, rode a mutação (tirar a condição de situação) e confirme que fica vermelho.

**Testes inúteis encontrados:** nenhum. Três observações que não bloqueiam:
- **Poll depois do Postgres pausado pode oscilar:** o arquivo usa `LIMITE_DO_USUARIO = 8`, e esse teste já gasta 3 pedidos do mesmo usuário antes do `expect.poll`. Sobram 5 tentativas, uns 2,5 s. Se o pool demorar mais que isso para reconectar, o poll recebe 429 até o fim da janela de 60 s, que passa do timeout de 30 s. O resultado seria vermelho intermitente na esteira. Vale fazer um único pedido com o mesmo token logo depois de `aguardarSaudavel` e usar outra sessão da mesma escola no poll, ou dar mais folga ao limite nesse `describe`.
- **Rota herdada fica fora da conferência do boot:** `rotasSemPermissao` só olha métodos declarados na própria classe. Uma rota herdada de controller base passa sem `@Permite`. O risco é baixo porque a `GuardaDePermissao` ainda fecha com 404, mas o erro sairia em execução e não no boot.
- **Dependência de ordem no teste do repository:** em `resolucao-de-tenant.repository.int.test.ts`, o segundo teste usa `professorEmA`, criado no primeiro, e apaga os usuários extras sem `try/finally`.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-guarda.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/sessao.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/limite.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/permissao/conferencia-das-permissoes.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts

## test-engineer · 2ª rodada · APROVADO · 2026-09-15 19:54:11 · `tasks/prd-identidade-e-tenancy/2_task.md`

Auditei só o diff desta rodada e o que ele afeta, como pedido.

**Correção exigida da 1ª rodada — verificada**

`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-guarda.int.test.ts:220-239` cobre os dois casos pedidos: escola com 2025 `encerrado` + 2027 `planejado` → `anoLetivoId` nulo no contexto e 404 `NAO_ENCONTRADO` em `/teste-sessao/ano`; escola com 2025 `encerrado` + 2026 `em_curso` → contexto e rota devolvem o id do `em_curso`. A mutação em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/sessao.repository.ts:53` (tirar `eq(anoLetivo.situacao, 'em_curso')` do `leftJoin`) mata o caso (a) de forma determinística: sem o filtro, o `leftJoin` casa a linha `encerrado`/`planejado` e o `anoLetivoId` deixa de ser nulo. Teste efetivo.

**Demais itens do diff — conferidos, nenhum enfraquece cobertura**

- Postgres pausado (`sessao-guarda.int.test.ts:251-273`): a segunda sessão só serve ao `expect.poll` da volta; a asserção que importa continua nas duas respostas 503 com `Retry-After`, e ganhou a asserção final de que o token que recebeu 503 volta a 200 (prova o "queda não desloga"). Limite de 8/min não é estourado (4 chamadas na sessão da queda).
- `infra/test/borda.int.test.ts`: troca de aluno por coordenador é só janela de inatividade; a conferência da rajada passou a comparar com `escolaDaTurma` real, mantendo asserção sobre o resultado.
- `apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts`: casos independentes e limpeza em `try/finally`; as asserções de forma do retorno (`Object.keys(...)`) e de não vazar usuário de outra conta continuam.
- `packages/nucleo/src/permissao/conferencia-das-permissoes.ts:12-18` + teste em `permissao.test.ts:52-62,123-125`: o teste `FilhoController.herdada` fica vermelho se a cadeia de protótipos voltar a `getOwnPropertyNames` só do próprio protótipo. Prova a regra.
- `packages/shared/src/permissao/matriz.test.ts:41-54`: o `not.toContain` do indicador agora cobre `unidade`, `proprio` e `turma_vinculada` (regra 70, item 8), e o teste estrutural do aluno falha se qualquer célula dele virar `turma_vinculada`/`unidade`.
- Documentação (`docs/lgpd.md` linha de Sessão, techspec seção 6) alinhada ao que o código grava.
- Varredura: nenhum `.skip`, `.only`, `todo` ou teste comentado em `apps`, `packages`, `infra`.

```
VEREDITO: APROVADO
Cenários exigidos: caminho feliz da sessão real; corte na requisição seguinte (sessão encerrada, usuário desativado, expiração, inatividade com e sem tolerância); isolamento (sub de A com esc de B, sid de outro usuário da mesma escola, sid inexistente, 404 igual); ordem JWT → limite → sessão sem tocar o Postgres; Postgres fora dá 503 e não desloga; virada de ano letivo (sem ano em curso, só encerrado+planejado, encerrado+em curso, ano de outra escola não vaza); permissão (papel sem alcance recebe o mesmo 404, rota sem @Permite derruba o boot, inclusive herdada); DTO sem campo fora do contrato; ops:sessao-sintetica fechado fora de AMBIENTE=local; arquitetura do ResolucaoDeTenantRepository contido.
Cobertos: todos. A virada de ano, único pendente da 1ª rodada, está em apps/api/test/sessao-guarda.int.test.ts:220-239 e morre com a mutação do leftJoin.
Bloqueantes: nenhum.
Recomendações:
- apps/api/test/sessao-guarda.int.test.ts:134 — o caso "quase" usa `now() - 34 minutes` contra um limite de 35 min (30 da escola + 5 de tolerância): margem de 1 min de relógio real. Em runner lento pode virar intermitente; 20 min daria a mesma prova com folga.
- apps/api/test/sessao-guarda.int.test.ts:232-238 — no caso encerrado+em curso, a prova depende do `limit(1)` escolher a linha certa se o filtro sair; o caso (a) já é determinístico, então é só robustez: asseverar também que a escola tem exatamente duas linhas de `ano_letivo` deixaria a intenção explícita.
- infra/test/borda.int.test.ts:230-240 — 201 sessões de coordenador criadas no `beforeAll` de um arquivo de infra: vale um comentário no `sessao-de-teste.ts` lembrando que a bancada limpa sessão/usuário/conta mas deixa escola e rede, para a próxima tarefa que reutilizar em volume.
```

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-15 19:56:46 · `tasks/prd-identidade-e-tenancy/2_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova neste diff. Reconferidas as da rodada 1 que o diff exercita — `ano_letivo` (tem `escola_id`, índice único parcial `ano_letivo_um_em_curso_por_escola` garante no máximo um `em_curso` por escola, então o `leftJoin` de `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/sessao.repository.ts` não pode multiplicar linha nem escolher ano arbitrário), `sessao`, `usuario`, `conta` (global por desenho, com `@SemEscopo` justificado), `registro_acesso`. Todos os ids são `uuid`.

Queries verificadas:
- `SessaoRepository.lerParaGuarda` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/sessao.repository.ts`): escopo por `(token.escolaId, token.sessaoId)` vindo do `TokenVerificado`, não de parâmetro do cliente; `usuario` e `anoLetivo` juntados pela mesma `sessao.escolaId`.
- `ResolucaoDeTenantRepository` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`): quatro `@SemEscopo`, cada um com justificativa escrita; `criarContas` agora está na tabela da seção 6 da Tech Spec (pendência 2 da rodada 1 fechada). A exceção segue contida pelo teste de arquitetura.
- `JobsSinteticosService.consultar` usa `buscarDaEscola(id)`, escopo do contexto; `esquemaPedidoJobSintetico` é `.strict()` e recusa `escolaId` no corpo. Nenhum endpoint do diff aceita `escolaId` de corpo ou query.
- `GuardaDePermissao` responde `NAO_ENCONTRADO` (404) para alcance `nunca`, igual a rota inexistente, e recusa rota sem `@Permite` — nunca libera por omissão.

Teste de isolamento: presente e efetivo. Os quatro casos de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-guarda.int.test.ts:155-174` quebram se a cláusula de escola ou a conferência `sessao.usuario_id = sub` sair. O caso novo da virada de ano (linha 220) e o de linha 200 quebram se o `eq(anoLetivo.escolaId, sessao.escolaId)` do `leftJoin` sair: a escola sem ano em curso passaria a receber o ano da outra. `usuariosAtivosDaConta` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts`) prova que outra conta não entra na lista, com `toHaveLength(2)` e `not.toContain`. `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz.test.ts` mantém a rede sem alcance individual e agora fecha o aluno em `proprio|nunca` e o indicador da coordenação fora de `unidade|proprio|turma_vinculada` (regra 10 item 8, regra 70 item 8).

Mudanças do diff que não afetam isolamento, conferidas: `conferencia-das-permissoes.ts` passou a percorrer a cadeia de protótipos — é estritamente mais restritivo (rota herdada sem marcação derruba o boot), com teste em `permissao.test.ts`; `infra/test/borda.int.test.ts` trocou tokens sintéticos por sessões reais de `coordenador` numa escola criada no teste, e a conferência da rajada agora compara com `escolaDaTurma`, mantendo a asserção de escopo; `resolucao-de-tenant.repository.int.test.ts` isolou os casos com `try/finally`; `docs/lgpd.md` descreve os campos de `sessao` sem acrescentar dado de pessoa.

Bloqueantes: nenhum.

Recomendações:
- As três pendências da rodada 1 continuam abertas e vencem em tarefa futura, não aqui: conta divergente em `sessao.conta_id` na 5.0, e FK da auditoria na eliminação da 17.0. A pendência da tabela da seção 6 foi fechada.
- `sistema_job_sintetico` dá `unidade` a coordenador e professor. Enquanto a rota depende de `ROTAS_SINTETICAS=true` está contido, mas vale revisitar a célula quando a flag sair, para não virar permissão de produção por inércia.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-09-15 19:56:50 · `tasks/prd-identidade-e-tenancy/2_task.md`

Auditei o diff desta rodada (matriz e conferência de permissões) e o que ele afeta, mais as duas recomendações da 1ª rodada.

**Correções/recomendações da 1ª rodada — verificadas**

1. `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz.test.ts:46-47` — o comentário agora diz exatamente o que a asserção faz, e o `not.toContain` cobre `unidade`, `proprio` e `turma_vinculada`. O teste fica vermelho se alguém der à coordenação leitura nominal de indicador sem auditoria (regra 70, item 8; D45).
2. `matriz.test.ts:50-54` — o teste estrutural do aluno entrou: toda célula dele é `proprio` ou `nunca`. Falha se qualquer célula virar `turma_vinculada`, `unidade` ou `agregado`, o que sustenta a regra 50, item 9 e a matriz de visibilidade da regra 60, item 11.
3. `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/permissao/conferencia-das-permissoes.ts:12-18` — a conferência do boot percorre a cadeia de protótipos até `Object.prototype`, com teste em `permissao.test.ts:52-62,123-125` (`FilhoController.herdada`). Rota herdada de controller base sem `@Permite` derruba o boot em vez de depender só do 404 da guarda. O buraco de "rota que ninguém declarou quem pode chamar" fechou dos dois lados: boot e guarda (`guarda-permissao.ts:28`, célula ausente = `nunca`).

**O que o diff não mexeu, e continua verificado**

- Nenhum caminho de escrita em `Nota` existe no F1: não há entidade, tabela nem rota de nota. A única aparição é `matriz.test.ts:65`, que prova que `alcanceDe('coordenador','nota','ler')` devolve `nunca` — recurso não declarado nasce fechado.
- Nenhuma decisão sobre trajetória do aluno, nenhuma saída de IA, nenhum agente e nenhum tutor nesta tarefa. Os itens 2 a 5 e 7 da regra 70 não têm superfície aqui; nada no diff antecipa um caminho que os viole.
- A coordenação lê aluno nominal só com `nominal_auditado` (`matriz.ts:88`) e indicador de professor com `agregado` + `nominal_auditado` (`matriz.ts:91`), com o professor vendo o próprio (`proprio`) e sem célula de ranking. A rede fica em `nunca`/`agregado` em toda linha, com teste que prova (`matriz.test.ts:34-39`).
- A tabela de auditoria ganhou a FK composta do autor (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/auditoria.ts:43`), o que reforça "quem" no registro de autor, data e finalidade que a regra 70, item 6 vai precisar.
- Nenhuma rota atual usa `nominal_auditado` (só `sistema_contexto` e `sistema_job_sintetico` declaram `@Permite`), então a exigência que registrei para tarefas futuras continua pendente na tarefa certa, não nesta.

```
VEREDITO: APROVADO
Caminhos de escrita em Nota: nenhum (Nota não existe no F1; `alcanceDe('coordenador','nota','ler')` = nunca, matriz.test.ts:65) — todos com autor humano? sim (vacuamente)
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok (sem saída de IA nesta tarefa; tabela de auditoria com autor, data e finalidade pronta para o fluxo)
Supervisão do tutor: ok (tutor não existe nesta tarefa; nenhuma célula da matriz abre conversa ou uso a quem não deve)
Autonomia declarada e visível: sim (não há agente nesta tarefa; nada no diff cria autonomia não declarada)
Bloqueantes: nenhum
Recomendações:
- tasks/prd-identidade-e-tenancy/achados-revisoes.md — o arquivo só tem as entradas do test-engineer; a minha 1ª rodada não está lá. As duas exigências que devem viajar para tarefas futuras (auditoria obrigatória na primeira rota que usar `nominal_auditado`, e tamanho mínimo de grupo no agregado do F12) correm risco de se perder antes do /retro. Vale conferir o hook `tools/processo/revisoes.ts` ou repetir as exigências no PRD do F12.
- packages/nucleo/src/permissao/conferencia-das-permissoes.ts:29-31 — agora que a varredura sobe a cadeia de protótipos, `prototipo[nome]` pode disparar um getter de classe base com `this` no protótipo e lançar no boot. Trocar por `Object.getOwnPropertyDescriptor` e olhar `descriptor.value` deixa a conferência imune a isso. Não bloqueia: hoje não existe controller base com getter.
```

## infra-guardian · 2ª rodada · APROVADO · 2026-09-15 19:57:13 · `tasks/prd-identidade-e-tenancy/2_task.md`

Auditei o diff desde a rodada aprovada (6 itens) e reconferi o caminho quente e a migration.

**Correção exigida na rodada 1:** feita. `infra/test/borda.int.test.ts:250-254` cria as 201 sessões com papel `coordenador` (inatividade de equipe, 120 + 5 min) e o comentário explica o motivo; o `beforeEach` (linhas 258-261) renova os tokens de acesso das mesmas sessões, sem criar sessão nova.

**Reconferência do que o diff afeta:**
- Ordem das guardas intacta em `apps/api/src/app.module.ts:51-85`: JWT → limite → sessão → permissão. O limite continua por `sub` e `esc` (`packages/nucleo/src/limite/guarda-limite.ts:53-62`), nunca por IP em rota autenticada; IP só em `@RotaAnonima`. Provado por `apps/api/test/sessao-guarda.int.test.ts:178-196` (JWT inválido e rajada acima do limite geram 0 leituras no Postgres).
- Leitura de sessão sem cache e sem estado em memória (`packages/nucleo/src/identidade/sessao.repository.ts:36-57`); uma consulta, por `(escola_id, id)`, com `now()` do banco como relógio (`avaliar-sessao.ts:31-34`).
- Índices da consulta quente presentes na migration: `sessao_escola_id_unico (escola_id, id)`, `usuario_escola_id_unico (escola_id, id)` e o parcial `ano_letivo_um_em_curso_por_escola`. O `leftJoin` do ano em curso é coberto pelo parcial.
- Migration 0005 continua compatível: tabelas novas e vazias; o único `ALTER` em tabela existente é a FK de `auditoria` (linha 89), sobre tabela com volume desprezível no F1; `fillfactor=70` em `sessao` por causa do `ultimo_uso_em` HOT.
- Degradação do Postgres preservada: `guarda-sessao.ts:56-65` devolve 503 `INDISPONIVEL_TENTE_DE_NOVO` com `Retry-After`, nunca 401, e o teste novo (`sessao-guarda.int.test.ts:251-273`) prova que o mesmo token volta a 200 depois do `unpause`.
- Concorrência: `ops:sessao-sintetica` grava em transação, escola vinda do contexto, FK composta `(escola_id, usuario_id)`; e-mail de conta com unicidade `citext` provada por `resolucao-de-tenant.repository.int.test.ts:63-73` (23505). Nenhum "busca, verifica, grava" novo.
- `conferencia-das-permissoes.ts:12-18` agora percorre a cadeia de protótipos; o teste `permissao.test.ts:123` prova que rota herdada de controller base sem marcação derruba o boot. Rota negada devolve 404 igual ao de rota inexistente (`sessao-guarda.int.test.ts:241-247`).
- Nenhum teste chama provedor pago; tudo roda no Postgres do compose.

```
VEREDITO: APROVADO
Caminho quente tocado: login
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- packages/nucleo/drizzle/0005_...sql:89 — a FK nova em `auditoria` é `ADD CONSTRAINT` com validação imediata. Aqui é inofensiva (tabela quase vazia no F1), mas quando `auditoria` crescer o padrão precisa virar `NOT VALID` + `VALIDATE CONSTRAINT`. Registrar em docs/infra.md seção 6.2 para não virar hábito.
- Uma leitura de sessão no Postgres por requisição autenticada é o custo novo do pico das 7h30 (~7 logins/s mais o tráfego seguinte). O cenário da 16.0 deve medir p95 dessa consulta e o uso do pool antes de decidir sobre cache (risco já registrado na seção 13 da techspec).
- infra/test/borda.int.test.ts:258-261 renova 201 tokens a cada caso; se o arquivo crescer, vale emitir sob demanda para não somar tempo de esteira.
```

## test-engineer · 1ª rodada · REPROVADO · 2026-09-16 05:17:26 · `tasks/prd-identidade-e-tenancy/3_task.md`

Auditei o diff inteiro da tarefa 3.0 (código, testes, migration, compose e scripts), conferi cada linha da tabela "Testes que provam a regra" e procurei `.skip`, mock que esconde regra e asserção vazia.

## O que verifiquei, linha a linha

**Permissão (emissor sintético recusado).** `packages/nucleo/src/identidade/verificar-token.test.ts:57-73` assina com a mesma chave e `iss: 'sintetico'` e exige 401, e ainda fecha a forma da `ConfiguracaoIdentidade`; `validar-config.test.ts:33-36` prova que mandar `ACEITAR_TOKEN_SINTETICO=true` não muda nada; `apps/api/test/contexto.int.test.ts:205-229` sobe a API nos dois ambientes e recusa o token sintético **com a sessão real gravada**, provando que o que recusou foi o emissor (a mesma sessão com `educa` dá 200). Todos falhariam se `issuer: EMISSOR_TOKEN` saísse de `verificar-token.ts:67`.

**FK nova.** `packages/nucleo/src/db/migrar.int.test.ts:163-190` prova as três tabelas recusando `escola_id` inexistente com `23503` **e** aceitando com a escola criada — o segundo trecho é o que impede o teste de passar por engano. `migrar.int.test.ts:192-238` monta as tabelas como eram antes do F1, insere órfã nas três, aplica a 0006 real (lida do disco), confere `convalidated = false`, que a linha antiga ficou, que a escrita nova já é barrada e que o `VALIDATE` ainda reprova. É o melhor teste do diff.

**Realtime.** `apps/realtime/test/sistema.int.test.ts` cobre isolamento nas duas direções (emissão de A não chega a B e vice-versa), intruso pedindo a sala de A no `auth`, na `query` e por quatro eventos, token com `sid` que nunca existiu, sessão encerrada no banco recusando o handshake seguinte com a sessão viva da mesma escola ainda entrando, e Postgres pausado devolvendo `INDISPONIVEL_TENTE_DE_NOVO` em três tentativas com **uma** linha de aviso, sem token, sem `select` e sem URL de conexão, voltando a conectar com o mesmo token depois do `unpause`. Nada disso é mockado: `app.module.ts:26` injeta `new SessaoRepository(criarBanco(pool))` de verdade.

**Sem perda de cobertura.** Os `it` removidos são exatamente os da flag e do emissor que deixaram de existir; `definirIdentidadeNoContexto` saiu do código e as invariantes dele ("só grava uma vez", "falha fora de requisição") continuam provadas em `definirSessaoNoContexto`. Nenhum `.skip`, `.only` ou teste comentado novo. Carimbo do portão (`.processo/portao.json`, início 07:49Z) é posterior ao último arquivo de código alterado (04:39 local).

## O furo

```
VEREDITO: REPROVADO

Cenários exigidos: caminho feliz (F0 verde com escola e sessão reais, sem .skip novo) ·
permissão (emissor sintético recusado, API sobe sem a variável) · borda (job de escola
inexistente recusado pelo banco) · migration NOT VALID sobre linha órfã · isolamento
(handshake de A não entra na sala de B) · borda (sessão encerrada recusa o handshake
seguinte) · falha (Postgres fora vira indisponível, não não-autenticado) · carga
(npm run carga e carga:controle-negativo com as escolas criadas pelo script)

Cobertos: os sete primeiros, com asserção sobre resultado e todos falhando se a regra sair.

Bloqueantes:
- infra/test/carga.test.ts:139-148 — o único teste do caminho reescrito do cenário de carga
  assere sobre o **texto** de infra/scripts/carga.ts (`toContain('ops:sessao-sintetica')`,
  `indexOf(...) < indexOf(...)`, `toContain('await escreverTokens(fase)')`). Isso prova a
  forma do código, não o resultado: passaria igual se `idDoOps` lesse o campo errado do JSON
  do `ops:escola`, se o ambiente dos `ops:*` não alcançasse o Postgres do projeto `educa-carga`,
  se as 1.000 sessões do grupo `c` estourassem o tempo entre as fases, ou se o k6 recebesse 401
  e o cenário medisse fila vazia. A linha 8 da tabela da própria tarefa exige o cenário rodado
  ("carga: `npm run carga` verde e `npm run carga:controle-negativo` reprovando pela justiça,
  com as escolas criadas pelo script"), e infra/scripts/carga.ts:187-300 foi reescrito nesta
  tarefa justamente nesse trecho.
  Correção exigida: rodar `npm run carga` e `npm run carga:controle-negativo` com este código e
  registrar no 3_task.md o veredito de cada um (critérios `espera_b` e `interativo_acima_de_30s`,
  e o código de saída do controle negativo). Se a execução for adiada, ela precisa sair da tabela
  "Testes que provam a regra" por mudança registrada na tarefa — não ficar listada como coberta
  por um teste de texto.

Recomendações:
- apps/realtime/src/autenticacao-do-handshake.ts:71-73 — a subtarefa 3.3 exige que o handshake
  não mova `ultimo_uso_em`, e hoje isso é verdade só porque `lerParaGuarda` é um SELECT puro e
  ninguém ainda escreve nessa coluna. Não há teste. Quando a tarefa da "atividade" implementar o
  toque, o teste (handshake não altera `ultimo_uso_em`; requisição da API altera) passa a ser
  obrigatório, senão a reconexão automática da web renova sessão ociosa para sempre.
- apps/realtime/src/configurar-app.ts:44 — `observarPoolDoBanco` no realtime não tem asserção em
  apps/realtime/test/metricas.int.test.ts, que já lê `conexoesRealtime` e `redisDisponivel` do
  medidor da instância. Uma linha a mais fecha a regra 80, item 10, para o pool novo do caminho
  quente; hoje remover a chamada não quebra teste nenhum.
- infra/test/carga.test.ts:139-148 — mesmo depois do cenário rodado, o teste por `indexOf` de
  nome de função quebra em renomeação e não quebra em falha real. Vale reduzi-lo ao que é
  contrato (`TOKENS_POR_GRUPO` e papéis, que o teste da linha 129 já faz bem) e deixar a ordem
  para o cenário provar.
- infra/scripts/carga.ts:187-210 — `idDoOps` roda sempre `ops:escola` (o nome sugere genérico;
  `idDoOpsEscola` diz o que é) e cada chamada refaz o build de shared/nucleo/api: são 4 builds
  para as escolas e 5 por fase para as sessões, 14 no total, somados ao tempo do cenário manual.
```

## test-engineer · 2ª rodada · APROVADO · 2026-09-16 06:04:58 · `tasks/prd-identidade-e-tenancy/3_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (os da rodada 1, mais a correção exigida): caminho feliz do F0 com escola e sessão reais · permissão (emissor `sintetico` recusado, em todo caminho) · borda de FK (`escola_id` inexistente recusado; migration `NOT VALID` com órfã) · isolamento entre escolas (realtime e uso) · sessão encerrada · Postgres fora → indisponível, não "não autenticado" · handshake não move `ultimo_uso_em` · execução registrada do cenário de carga (a correção exigida).

**Cobertos:**
- **Correção exigida — cumprida.** `npm run carga` e `npm run carga:controle-negativo` foram rodados e os dois vereditos estão registrados em `/Users/joaquim/Git/Educa.ia/tasks/prd-identidade-e-tenancy/3_task.md:89-105`, com os números dos critérios `espera_b` e `interativo_acima_de_30s` e o código de saída do controle negativo. A não reprovação do controle negativo está explicada, reproduzida duas vezes, e virou pendência com dono em `TODO.md:92-96`. Não é regressão desta tarefa: a vaga por escola continua provada por teste direto em `apps/despachante/test/vagas.int.test.ts` (controle negativo na linha 210, concorrência de dois despachantes na 223, A não atrasa B na 436), então a regra 80, item 3, não fica sem prova.
- O teste que restou em `infra/test/carga.test.ts:139-144` agora só afirma o que ele de fato prova (o `ops:token-sintetico` sumiu do cenário) e declara no comentário que o resto é a execução. Aceito.
- Recomendações da rodada 1 aplicadas e com asserção que falha se a regra sair: `apps/realtime/test/sistema.int.test.ts:259-275` (o `ultimo_uso_em` quebraria se o handshake o tocasse), `apps/realtime/test/metricas.int.test.ts:50`, `infra/test/carga.test.ts:129-137` (papel pela `MATRIZ`, em vez de `indexOf` de nome de função), `idDoOpsEscola`.
- Diff auditado sem perda de cobertura: os testes do worker e da conferência passaram a criar escola real (`apps/worker/test/fila-de-teste.ts:168-171`, `infra/test/conferir-carga.int.test.ts:13-27`) mantendo os mesmos casos, inclusive os de isolamento e concorrência (`apps/worker/test/uso.int.test.ts:138,151`). `verificar-token.test.ts:57-61` continua provando a recusa do emissor do F0 e ainda fecha a forma da `ConfiguracaoIdentidade`. Nenhum `.skip`, `.only`, teste comentado ou mock novo escondendo regra. Grep no repositório: só sobram citações em docs de tarefa e nos testes negativos.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `tasks/prd-identidade-e-tenancy/3_task.md:87` — a linha da tabela ainda diz "`npm run carga:controle-negativo` **reprovando pela justiça**", que as linhas 98-105 do mesmo arquivo desmentem. Reescrever a linha para o que de fato valeu (carga verde; controle negativo não reprovou nesta máquina, com a pendência apontada), para o `/validar` não ler uma prova que não aconteceu.
2. `infra/test/carga.test.ts:139` — o nome diz "em lugar nenhum do cenário", mas a asserção olha dois arquivos. Um grep sobre `infra/` e `package.json` cumpriria o nome e pegaria a volta do comando por outro caminho.
3. `apps/realtime/test/metricas.int.test.ts:50` — `length > 0` passa com qualquer série de pool. Asseverar os atributos esperados faria o teste distinguir o pool do handshake de outro qualquer.
4. `apps/realtime/test/sistema.int.test.ts:259` — hoje nada no código escreve `ultimo_uso_em` depois da criação, então o teste só guarda a direção negativa. Quando a renovação de sessão entrar, acrescentar o contraste (requisição da API move, handshake não) na mesma bancada.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-16 06:09:07 · `tasks/prd-identidade-e-tenancy/3_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `job_registro`, `configuracao_operacional_escola`, `uso_infra_diario` (FK `escola_id → escola` `NOT VALID`, migration `/Users/joaquim/Git/Educa.ia/packages/nucleo/drizzle/0006_fk_escola_nas_tabelas_do_f0.sql`, snapshot e `_journal` coerentes); `escola` e `sessao` como referência. Nenhuma tabela nova. `job_registro.escola_id` segue anulável só para `tipo` `sistema.*`, com check no banco, e a consulta de órfãos do `TODO.md` respeita isso. Id é UUIDv7 em `escola` e `job_registro`. Nenhuma tabela desta tarefa varia por período, então `ano_letivo_id` não se aplica.

Queries verificadas: `SessaoRepository.lerParaGuarda` (`packages/nucleo/src/identidade/sessao.repository.ts:54`) — escopo `(sessao.escola_id, sessao.id)` vindo do `TokenVerificado`, com `usuario`, `escola` e `ano_letivo` juntados pela mesma escola; é a única query que o realtime passou a fazer (`apps/realtime/src/app.module.ts:24`). Handshake (`apps/realtime/src/autenticacao-do-handshake.ts:104-112`): identidade só de `avaliarSessao`, `handshake.auth` e `handshake.query` zerados depois de verificar, sala montada só em `salaDaEscola(identidade.escolaId)` (`apps/realtime/src/sistema.gateway.ts:41`). Nenhum endpoint passou a aceitar `escolaId` de corpo, query ou cabeçalho; `jobs-sinteticos` continua recusando o campo e respondendo 404 idêntico para job de outra escola. `@SemEscopo()` não ganhou ocorrência nova; as existentes seguem com justificativa e teste de forma. `verificarToken` deixou de ter emissor configurável (`packages/nucleo/src/identidade/verificar-token.ts:67`), e `ACEITAR_TOKEN_SINTETICO` não existe mais em código, compose, `.env.example` nem `package.json`.

Teste de isolamento: presente e efetivo. `apps/realtime/test/sistema.int.test.ts` — emissão de A não chega a cliente de B e vice-versa nas duas instâncias; cliente de B não entra na sala de A pedindo por `auth`, query ou evento; token de emissor `sintetico` com sessão real recusado e a mesma sessão com emissor `educa` aceita; sessão encerrada recusa o handshake seguinte enquanto a sessão viva da mesma escola entra. Removendo o escopo da sala (usar algo que o cliente manda) o segundo e o terceiro caso quebram; removendo o `eq(sessao.escolaId, token.escolaId)` do repository quebra `apps/api/test/sessao-guarda.int.test.ts:155`. `packages/nucleo/src/db/migrar.int.test.ts` prova que escrita com `escola_id` inexistente é recusada (23503) nas três tabelas e que a `0006` aplica sobre linha órfã. `apps/worker/test/uso.int.test.ts:137` mantém o isolamento de uso por escola com escolas reais. Nenhum `.skip` e nenhum teste apagado: os que perderam as constantes `ESCOLA_A`/`ESCOLA_B` passaram a criar escolas reais por caso.

Bloqueantes: nenhum.

Recomendações:
- `/Users/joaquim/Git/Educa.ia/apps/api/test/sessao-de-teste.ts:103` — `encerrar()` faz `update sessao ... where id = $1` sem `escola_id`. É helper de teste e o id é UUID, então não vaza nada, mas o resto da bancada escreve `where escola_id = $1 and id = $2` (ver `apps/api/test/sessao-guarda.int.test.ts:112`); manter o mesmo formato evita que o padrão solto seja copiado para um repository.
- Não há caso no handshake que prove diretamente o escopo `(esc, sid)` entre escolas (token de B com `sid` de A). Hoje isso só é impossível porque o token é assinado pelo servidor, e o repository já tem o caso na API. Uma linha no `sistema.int.test.ts` usando o `EmissorDeToken` para cruzar `esc` e `sid` amarraria a sala ao escopo sem depender do teste da API.
- O pool do realtime (`REALTIME_BANCO_POOL_MAXIMO=5` por instância) passa a ser consultado a cada handshake. A métrica `poolEmUso` já é exportada e testada, mas não há limiar nem caso de carga para a onda de reconexão das 7h30; vale entrar no cenário `login-7h30` da 16.0.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-16 06:11:23 · `tasks/prd-identidade-e-tenancy/3_task.md`

VEREDITO: REPROVADO
Escopo: incompleto — o critério de carga declarado na tarefa foi reescrito em vez de cumprido
Aderência à Tech Spec: ok (seções 2, 3, 5 "Requisição", 6 e 10 conferidas; a remoção de `emissoresAceitos` e de `definirIdentidadeNoContexto` é consequência direta de "saem o emissor sintético e `ACEITAR_TOKEN_SINTETICO`", e o pool de banco no realtime é o que a seção 5 pede)
Portão local: carimbo válido para o código atual (typecheck, lint, test, infra)

Bloqueantes:

1. `/Users/joaquim/Git/Educa.ia/tasks/prd-identidade-e-tenancy/3_task.md:87` — a linha da tabela "Testes que provam a regra" foi **reescrita pelo implementador** depois do resultado. O texto original era `carga: npm run carga verde e npm run carga:controle-negativo reprovando pela justiça, com as escolas criadas pelo script`; virou `... o controle negativo rodado e o resultado registrado abaixo`. O controle negativo não reprovou, e a resposta foi baixar a régua da própria tarefa. Baixar critério de aceite é decisão do dono da tarefa, não de quem implementa. **Correção exigida:** restaurar a linha original do `3_task.md` e subir a decisão (manter o critério e consertar, ou aceitar a dívida) para o Joaquim, registrada como decisão dele — não como edição do documento da tarefa. Não estou exigindo recalibrar o cenário nesta tarefa: isso seria escopo de outra.

2. `/Users/joaquim/Git/Educa.ia/tasks/prd-identidade-e-tenancy/3_task.md:98-105` e `/Users/joaquim/Git/Educa.ia/TODO.md:92-100` — o diagnóstico registrado está errado, e o errado é o que vai guiar quem pegar a pendência. Os dois textos dizem que é "calibração do cenário do F0 para este hardware" / "Recalibrar ... por máquina", e o `TODO.md` já aponta caminhos derivados disso ("apertar a CPU de `infra/compose.carga.yml`, subir a taxa da B"). O registro do próprio projeto contradiz: `/Users/joaquim/Git/Educa.ia/tasks/prd-fundacao-tecnica/15_task.md:105-107` mostra o controle negativo reprovando **na mesma máquina do Joaquim**, em 14/09, com a B em p95 2,53 s contra o limite de 507 ms — agora são 84–125 ms. Não é a máquina que mudou: entre as duas execuções entrou o commit `364049c`, que pôs `UV_THREADPOOL_SIZE=16` e `dns_opt` em api, realtime, despachante e worker, e a espera dos interativos da própria A caiu de p95 10,3 s (15.0) para 6,1 s — a vazão do worker subiu. A afirmação "não é desta tarefa" pode até estar certa, mas está sustentada por um motivo que o histórico desmente. **Correção exigida:** corrigir o parágrafo do `3_task.md` e o item do `TODO.md` para citar a medição de 14/09 na mesma máquina e a mudança de ambiente do `364049c` como causa candidata, e trocar os "caminhos" propostos por essa investigação; se a comparação com 15.0 for feita e apontar outra causa, registrar a que for.

Recomendações:

- `/Users/joaquim/Git/Educa.ia/apps/api/src/sessao/sessoes-sinteticas.ts:57-58`: o ternário é morto — `relogio` já tem padrão (`relogioDoSistema`) em `EmissorDeToken`, e passar `undefined` usa o padrão. `return new EmissorDeToken(codificada, relogio)` basta.
- `/Users/joaquim/Git/Educa.ia/infra/test/conferir-carga.int.test.ts:13-27`: cria escola por SQL cru, um segundo jeito de fazer o que o projeto faz por `ops:escola`/`BancadaDeSessoes`. O guarda de `escola.repository.test.ts` não alcança arquivo de teste, mas é uma porta paralela a mais para manter.
- A subtarefa 3.2 pedia `criarEscolaComSessao({ papel })` em `apps/api/test/configuracao-de-teste.ts`; o que existe é o `BancadaDeSessoes` de `apps/api/test/sessao-de-teste.ts`, da tarefa 2.0. A intenção está cumprida, mas a letra da subtarefa não — vale uma linha no `3_task.md` dizendo que o helper já existia, para a próxima tarefa não procurar o nome que não foi criado.
- `/Users/joaquim/Git/Educa.ia/apps/worker/test/fila-de-teste.ts:36`: teste do worker passa a depender de `apps/api/src/ops/escola.ts`. É o terceiro importador na lista permitida; se aparecer um quarto, vale mover a criação de escola sintética para um helper compartilhado em vez de ampliar a lista.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-16 06:12:57 · `tasks/prd-identidade-e-tenancy/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: sala (handshake do realtime) · migration · fila (cenário de carga)
Rate limit: ok — nenhum limite por IP foi introduzido; a API mantém o limitador por usuário e por escola antes da leitura de sessão (`packages/nucleo/src/identidade/guarda-sessao.ts`)
Fila e prioridade: ok — vaga por escola e prioridades intocadas; `apps/despachante/test/vagas.int.test.ts` não mudou
Concorrência: protegida — nada novo no padrão "busca, verifica, grava"; escolas do cenário nascem com slug sorteado sob restrição única, e a FK nova é do banco
Índice e paginação: ok — a leitura do handshake é `(escola_id, id)`, coberta pelo índice único `sessao_escola_id_unico` (`packages/nucleo/src/db/schema/sessao.ts:50`), uma linha por conexão
Degradação de IA: não se aplica
Migration: compatível — `packages/nucleo/drizzle/0006_fk_escola_nas_tabelas_do_f0.sql` só adiciona FK `NOT VALID` (sem varredura), migrador com `lock_timeout` de 5 s e 3 tentativas (`packages/nucleo/src/db/migrar.ts:17-19`), `VALIDATE` adiado com consulta de órfãos e dono no `TODO.md`; prova em `packages/nucleo/src/db/migrar.int.test.ts` (aplica sobre linha órfã, barra escrita nova com 23503, `VALIDATE` ainda reprova)
Métrica e alerta: ok — pool do realtime medido (`apps/realtime/src/configurar-app.ts:44`) e já aparece no painel por `job` (`infra/grafana/paineis/fundacao.json:548,597`), somado a `realtime.conexoes`; nenhum alerta novo foi criado, então não falta runbook novo
Bloqueantes: nenhum

Sobre a pergunta do controle negativo: **basta, não é bloqueante.** A regra 80, item 3, continua com teste que quebra se ela for removida — `apps/despachante/test/vagas.int.test.ts:210` (controle negativo com a vaga desligada, escola passa do teto) e `:436` (A sem vaga não atrasa B), com Redis e Postgres reais. O cenário de carga perdeu sensibilidade, não perdeu a prova. Mas a explicação registrada está fraca e entra como recomendação abaixo.

Recomendações:
1. `tasks/prd-identidade-e-tenancy/3_task.md:98-105` e `TODO.md` — a justificativa "é calibração desta máquina" não se sustenta sozinha: no F0, na mesma máquina, o controle negativo deu `espera_b` p95 2,63 s (`tasks/prd-fundacao-tecnica/validacao.md:201`) e agora dá 84–125 ms, vinte vezes menos. Antes de apertar CPU ou limiar, achar por que a carga da A deixou de saturar o worker (sessão real por requisição, papel/limite da A, tempo entre criar as sessões e a fase). Se a A não satura mais, o `npm run carga` verde também prova menos do que diz. Vale anexar essa comparação ao item do `TODO.md`, que hoje só fala em folga de máquina.
2. `apps/realtime/src/autenticacao-do-handshake.ts:76-99` — o handshake não tem limitador por usuário e por escola. Na API a ordem das guardas existe justamente para rajada não chegar ao Postgres; no realtime não há nada equivalente. Hoje o dano é contido pelo pool de 5 por instância e pelo recuo espalhado do cliente, mas antes de o modo sala (F10) botar tráfego real ali, um limite por `(escola, usuário)` em Redis no handshake deveria entrar.
3. `apps/realtime/src/autenticacao-do-handshake.ts:79-96` — o handshake não conta o próprio desfecho (aceito, `NAO_AUTENTICADO`, `INDISPONIVEL_TENTE_DE_NOVO`) nem mede a latência da leitura, e o aviso de indisponível é espaçado em 30 s de propósito: a taxa de recusa fica sem série. Um contador por código de desfecho (sem usuário e sem escola, regra 20) fecharia o buraco; hoje só se enxerga de lado, por `realtime.conexoes` caindo e pelo pool.
4. `REALTIME_BANCO_POOL_MAXIMO=5` (`.env.example:81`) — dois realtimes dão 10 conexões para ~1.800 clientes voltando juntos depois de uma queda. A consulta é curta e o `connectionTimeoutMillis` corta em 2 s, mas o número merece medida no cenário `login-7h30` da 16.0 em vez de estimativa.
5. `docs/runbook.md` não cita o realtime em nenhuma linha. Agora que ele depende do Postgres, cabe um parágrafo: o que significa `realtime.conexoes` caindo com `db_pool_em_uso` do `job=educa/realtime` no teto, e que recusa de handshake não aparece no alerta de 5xx (socket.io devolve `connect_error`, não status HTTP).
6. `apps/realtime/test/sistema.int.test.ts:18` e `metricas.int.test.ts:9` importam `apps/api/test/sessao-de-teste.js`: o teste do realtime passa a depender da árvore de teste da API. Mover a bancada para `tools/testes/` deixaria a dependência explícita.

## revisor-geral · 2ª rodada · REPROVADO · 2026-09-16 06:14:24 · `tasks/prd-identidade-e-tenancy/3_task.md`

**VEREDITO: REPROVADO**

**Escopo:** respeitado — o diff desta rodada é só `tasks/prd-identidade-e-tenancy/3_task.md` e `/Users/joaquim/Git/Educa.ia/TODO.md`; nenhum arquivo de código, teste, migration ou infra tem mtime posterior a 05:18:34 (conferido arquivo a arquivo). O critério de carga da tabela segue não cumprido, mas isso é agora, como exigi na rodada 1, decisão do Joaquim registrada no documento, não pendência desta tarefa.

**Aderência à Tech Spec:** ok.

**Portão local:** inválido. `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/3_task.md` responde:

```
portão local: TODO.md mudou em 2026-09-16 06:12:08, depois do início do último (2026-09-16 05:39:58). Rode `node tools/processo/portao-local.ts --infra` de novo.
```

**Bloqueantes**

1. `/Users/joaquim/Git/Educa.ia/TODO.md` (mtime 2026-09-16 06:12:08) contra `.processo/portao.json` (`inicio` 2026-09-16T08:39:58.852Z = 05:39:58 local) — o carimbo é anterior à última alteração que o processo conta como código. `alteracoesDeCodigo` (`tools/processo/revisoes.ts:338-343`) só exclui `tasks/` e `.processo/`; `TODO.md` entra. A afirmação da mensagem de entrega ("Portão local: carimbo válido ... posterior à última alteração de código") era falsa no momento em que foi escrita: a edição do `TODO.md` é desta rodada e veio depois do carimbo. O hook bloqueia o commit com a mesma mensagem. **Correção exigida:** terminar as edições de documento e rodar `node tools/processo/portao-local.ts --infra`, e só então pedir a rodada seguinte.

**O que foi verificado e está certo** (para não refazerem):

- Correção 1 — a linha de carga da tabela ("Testes que provam a regra") está idêntica ao `HEAD`: aparece como contexto no `git diff HEAD`, sem `+`/`-`. A decisão foi subida ao Joaquim em `3_task.md:121-123`, com o critério declarado como não cumprido em `3_task.md:106-108`.
- Correção 2 — os dois textos (`3_task.md:114-119` e `TODO.md:92-101`) agora citam a medição de 14/09 e o `364049c` como causa candidata, e o "primeiro passo" é repetir o cenário com o `UV_THREADPOOL_SIZE` anterior. Confiro os números contra as fontes: `tasks/prd-fundacao-tecnica/15_task.md:107` traz "2,53 s contra o limite de 507 ms" e a linha 101 traz "espera p95 10,3 s" dos interativos da A; o commit `364049c` (15/09, entre as duas medições) põe `UV_THREADPOOL_SIZE=16` e `dns_opt` em api, realtime, despachante e worker. A inversão do código de saída do controle negativo (saída 0 = reprovou) também bate com a 15.0.
- A "Nota sobre a subtarefa 3.2" é verdadeira: `escolaComSessao` existe em `/Users/joaquim/Git/Educa.ia/apps/api/test/sessao-de-teste.ts:97` e é usada em nove arquivos de teste.

**Recomendações**

- Levar ao `/retro`: o carimbo tratar `TODO.md` e outros `.md` fora de `tasks/` como código custa uma rodada de `test:infra` (uns 16 min) por edição de documento, o que empurra o implementador a editar doc antes do portão por disciplina. Um filtro por extensão, ou uma lista curta de documentos de processo, resolveria sem afrouxar o que o carimbo protege.
- As três recomendações de código da rodada 1 (`apps/api/src/sessao/sessoes-sinteticas.ts:57-58`, `infra/test/conferir-carga.int.test.ts`, o quarto importador de `ops:escola`) seguem em aberto e continuam sendo recomendação; deixá-las para o `/validar` está correto.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-16 06:40:56 · `tasks/prd-identidade-e-tenancy/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila | migration (inalterados desde a rodada aprovada)
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
1. Reaplicadas, ainda pendentes e de propósito não feitas nesta rodada (registradas para `/validar` e `/retro`): limitador por usuário e por escola no handshake do realtime (`/Users/joaquim/Git/Educa.ia/apps/realtime/src/autenticacao-do-handshake.ts`); contador por desfecho do handshake; `REALTIME_BANCO_POOL_MAXIMO` medido na 16.0; parágrafo do realtime em `/Users/joaquim/Git/Educa.ia/docs/runbook.md`; bancada de teste compartilhada entre api e realtime.
2. A dívida do controle negativo (`/Users/joaquim/Git/Educa.ia/TODO.md`, "Processo e dívida do F0") deveria ser fechada antes da 16.0 (`login-7h30`), porque o mesmo cenário é a base de comparação dela: sem saber por que a escola A parou de saturar o worker, o cenário novo nasce medindo a mesma coisa duvidosa.

Verificação desta rodada: confirmei que nenhum arquivo de código, teste, migration ou infra mudou desde a minha rodada aprovada (`infra-guardian` rodada 1, 06:06:06–06:12:57). O arquivo de código mais recente entre os modificados é `/Users/joaquim/Git/Educa.ia/infra/test/carga.test.ts`, com mtime 05:18:34. Só `/Users/joaquim/Git/Educa.ia/TODO.md` (06:14:46), `/Users/joaquim/Git/Educa.ia/tasks/prd-identidade-e-tenancy/achados-revisoes.md` (06:14:24, escrito pelo hook), `/Users/joaquim/Git/Educa.ia/tasks/prd-identidade-e-tenancy/3_task.md` (06:38:42) e `tasks.md` (06:39:11) são posteriores, e o diff deles é texto. A recomendação 1 da rodada anterior foi cumprida: os dois documentos deixaram de atribuir o resultado à máquina, citam as duas medições anteriores e o commit `364049c`, e o primeiro passo registrado é repetir o cenário com o `UV_THREADPOOL_SIZE` anterior. A regra 80, item 3, segue provada por `/Users/joaquim/Git/Educa.ia/apps/despachante/test/vagas.int.test.ts:210` (controle negativo da vaga) e `:436` ("A sem vaga não atrasa B"), que rodam no portão. Nenhum `.skip`, `.only` ou `todo(` novo no diff de testes.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-16 06:41:01 · `tasks/prd-identidade-e-tenancy/3_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma mudou desde a minha rodada aprovada. Conferi arquivo a arquivo o mtime dos 58 arquivos do `git status`: o mais recente de código, teste, migration, schema ou infra é `/Users/joaquim/Git/Educa.ia/infra/test/carga.test.ts` em 2026-09-16 05:18:34, anterior à minha aprovação (06:09:07). Os únicos arquivos posteriores são `TODO.md` (06:14:46), `tasks/prd-identidade-e-tenancy/3_task.md` (06:38:42), `tasks/prd-identidade-e-tenancy/tasks.md` (06:39:11) e `achados-revisoes.md` (06:14:24, escrito pelo hook). A afirmação do prompt confere.

Queries verificadas: nenhuma. O diff desde a minha aprovação não contém `select`, `where`, repository, controller, DTO nem migration. `git diff HEAD` dos três documentos traz só prosa, marcação de subtarefa concluída, a tabela de revisões escrita pelo hook e o contador de `2 de 20` para `3 de 20`.

Teste de isolamento: presente e efetivo, inalterado desde a rodada 1 (`apps/realtime/test/sistema.int.test.ts`, `packages/nucleo/src/db/migrar.int.test.ts`, `apps/api/test/sessao-guarda.int.test.ts:155`, `apps/worker/test/uso.int.test.ts:137`).

Sobre o que auditei do texto novo, por tocar matéria minha:

- O item de FK do `TODO.md` está igual ao que aprovei. A consulta de órfãos respeita `job_registro.escola_id` anulável (`j.escola_id is not null`), como manda o check de `tipo` `sistema.*`, e não usa esse filtro nas outras duas, que são `not null`. Os três nomes de restrição do comando `VALIDATE` batem literalmente com os da migration `/Users/joaquim/Git/Educa.ia/packages/nucleo/drizzle/0006_fk_escola_nas_tabelas_do_f0.sql`: `configuracao_operacional_escola_escola_id_escola_id_fk`, `job_registro_escola_id_escola_id_fk`, `uso_infra_diario_escola_id_escola_id_fk`.
- O item novo do controle negativo de carga e a "Execução do cenário de carga" do `3_task.md` são de justiça entre escolas sob carga (regra 80, item 3), não de isolamento de leitura. Nada ali afrouxa escopo: o texto declara o critério como não cumprido, aponta a causa candidata e sobe a decisão ao dono, e a regra segue provada por `apps/despachante/test/vagas.int.test.ts`. Não é bloqueante meu.
- A "Nota sobre a subtarefa 3.2" apenas registra que `BancadaDeSessoes.escolaComSessao` já cumpre o papel. O helper cria escola real e sessão real, que é justamente o que tirou as constantes `ESCOLA_A`/`ESCOLA_B` de fantasia dos testes.

Bloqueantes: nenhum.

Recomendações: as mesmas três da rodada 1, conscientemente não aplicadas e registradas pelo hook para o `/validar` e o `/retro`. Repito para não se perderem:

1. `/Users/joaquim/Git/Educa.ia/apps/api/test/sessao-de-teste.ts:103` — `encerrar()` faz `update sessao ... where id = $1` sem `escola_id`, fora do formato `where escola_id = $1 and id = $2` do resto da bancada.
2. Falta caso no handshake que cruze `esc` e `sid` entre escolas usando o `EmissorDeToken`, amarrando a sala ao escopo sem depender do teste da API.
3. `REALTIME_BANCO_POOL_MAXIMO=5` passa a ser consultado a cada handshake, sem limiar nem caso de carga para a onda das 7h30; entra no cenário `login-7h30` da 16.0.

## test-engineer · 3ª rodada · APROVADO · 2026-09-16 06:42:17 · `tasks/prd-identidade-e-tenancy/3_task.md`

## Auditoria — 3ª rodada (só documentos no diff)

Conferi o diff (só `3_task.md` e `TODO.md`; nenhum arquivo de código, teste, migration ou infra mudou — `git status` bate com isso) e checei fonte por fonte cada afirmação do registro de carga.

**Tudo que é verificável no registro confere:**

| Afirmação no `3_task.md` | Fonte conferida |
|---|---|
| "não reprovou, código de saída 1" | `infra/scripts/carga.ts:132` — `if (controleNegativo) return veredito.reprovadoPelaJustica ? 0 : 1`. Saída 1 = não reprovou. Coerente, não contraditório |
| critérios `espera_b` e `interativo_acima_de_30s` | `infra/scripts/carga.ts:64` (`CRITERIOS_DE_JUSTICA`) |
| "limiar de base + 500 ms" | `infra/k6/justica-entre-escolas.js:31,86` (`MARGEM_SOBRE_A_BASE_MS = 500`). Com base 14 ms, limite ≈ 514 ms; 84 e 125 ms ficam longe dele, consistente com "não reprovou" |
| "14/09: B em p95 2,53 s contra 507 ms" | `tasks/prd-fundacao-tecnica/15_task.md:106-107`, palavra por palavra |
| "interativos da A caíram de p95 10,3 s para 6,1 s" | `15_task.md:101` traz "espera p95 10,3 s" |
| "validação do F0, RF18: `espera_b` p95 2,63 s" | `tasks/prd-fundacao-tecnica/validacao.md:201` |
| "`364049c` pôs `UV_THREADPOOL_SIZE=16` e `dns_opt` em api, realtime, despachante e worker" | commit de 15/09, entre as duas medições; a mudança está lá |
| "regra 80, item 3, não ficou sem prova" | `apps/despachante/test/vagas.int.test.ts:210` (vaga desligada → `maximo('A') === 12`, com o evento `worker.vagas_por_escola_desligadas` no log) e `:436` (B conclui em 3 s enquanto os 20 da A ficam `aguardando`). Os dois morrem se a vaga por escola sair, e rodam no `npm run test` |
| "`escolaComSessao` já existia" | `apps/api/test/sessao-de-teste.ts:97` |

Não achei nenhum ponto em que o texto diga mais do que foi medido. Ao contrário: o documento (a) mantém a régua original da tabela em vez de baixá-la, (b) declara em negrito que **esse é o critério e ele não foi cumprido**, (c) diz que o `npm run carga` verde "prova menos do que diz", que é a conclusão desconfortável e correta, e (d) separa o que continua provado (regra 80.3, por teste de portão) do que ficou sem prova (a sensibilidade do cenário). Varredura no repositório: nenhum `.skip`, `.only`, `xit` ou teste comentado.

**Minha recomendação 1 da 2ª rodada não virou bloqueante.** O risco que eu apontei era o `/validar` ler na tabela uma prova que não aconteceu; com a declaração em `3_task.md:106-108` e a decisão subida ao Joaquim em `:127-129`, o risco está fechado por um caminho melhor que o que eu sugeri — quem baixa critério de aceite é o dono da tarefa, não o implementador. As recomendações 2, 3 e 4 continuam abertas e continuam recomendações: nenhuma delas deixa regra sem prova.

```
VEREDITO: APROVADO
Cenários exigidos: os mesmos da 2ª rodada (caminho feliz do F0 com escola e sessão reais · emissor `sintetico` recusado em todo caminho · FK: escrita com `escola_id` inexistente e migration `NOT VALID` sobre órfã · isolamento no realtime e no uso · sessão encerrada · Postgres fora → indisponível, não "não autenticado" · handshake não move `ultimo_uso_em` · execução registrada do cenário de carga). Nenhum cenário novo: o diff não tem código.
Cobertos: todos, sem mudança desde a 2ª rodada. O cenário de carga continua registrado com os dois vereditos e os números; a regra 80, item 3, segue provada por apps/despachante/test/vagas.int.test.ts:210 e :436, que rodam no portão.
Bloqueantes: nenhum.
Recomendações:
1. tasks/prd-identidade-e-tenancy/3_task.md:107 — "não foi cumprido nesta execução" soa transitório, e o parágrafo seguinte diz o contrário ("não é intermitência"). "não foi cumprido, e não é intermitência" evita que o /validar leia como azar de uma rodada.
2. tasks/prd-identidade-e-tenancy/3_task.md:96-121 — os p95 citados vêm de `/execucao/resumo-base.json` e `resumo-carga.json`, que ficam no volume do compose e somem. O registro é testemunhal, não auditável. Guardar os dois resumos (ou o trecho de métricas) junto da tarefa tornaria a comparação com 14/09 reproduzível por quem pegar a pendência — vale como padrão para o /retro, porque a validação do F0 tem a mesma limitação.
3. tasks/prd-identidade-e-tenancy/3_task.md:101-104 — o que a 3.0 de fato precisava do cenário (as escolas e sessões novas funcionarem de ponta a ponta) está provado pelo run verde: 482 interativos da B concluídos e 1.866 lotes da A enfileirados só existem se o k6 autenticou e gravou job. Vale dizer isso em uma linha, porque é a parte da linha de carga que pertence a esta tarefa; hoje fica implícita no parágrafo final.
4. As recomendações 2, 3 e 4 da minha 2ª rodada seguem abertas e sem alteração: `infra/test/carga.test.ts:139` (nome fala do cenário inteiro, asserção olha dois arquivos), `apps/realtime/test/metricas.int.test.ts:50` (`length > 0` passa com qualquer série), `apps/realtime/test/sistema.int.test.ts:259` (só a direção negativa do `ultimo_uso_em`, até a renovação de sessão entrar).
```

Arquivos relevantes: `/Users/joaquim/Git/Educa.ia/tasks/prd-identidade-e-tenancy/3_task.md`, `/Users/joaquim/Git/Educa.ia/TODO.md`, `/Users/joaquim/Git/Educa.ia/apps/despachante/test/vagas.int.test.ts`, `/Users/joaquim/Git/Educa.ia/infra/scripts/carga.ts`, `/Users/joaquim/Git/Educa.ia/infra/k6/justica-entre-escolas.js`, `/Users/joaquim/Git/Educa.ia/tasks/prd-fundacao-tecnica/15_task.md`, `/Users/joaquim/Git/Educa.ia/tasks/prd-fundacao-tecnica/validacao.md`.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 02:20:15 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: REPROVADO

Cenários exigidos:
- **Caminho feliz:** o professor recebe `pronta`, o token e `educa_sessao`. O `/v1/eu` devolve o contrato e o `registro_acesso` grava `login`.
- **Privacidade (RF6):** senha errada, e-mail que não existe, conta sem senha e usuário desativado dão status e corpo iguais, com um argon2 cada. Isso vale também para o bloqueio: a conta segurada não pode revelar se o e-mail existe.
- **Recuo:** 5 falhas dão 30 s, a sexta dá 60 s com relógio simulado, a espera para em 15 min e o acerto zera.
- **Concorrência:** 10 senhas erradas em `Promise.all` avaliam no máximo 5 hashes.
- **Outro navegador:** o script sem cookie segura só o contador `outro`, e o `educa_dispositivo` válido continua entrando. Cookie com chave antiga ou forjado não conta.
- **35 logins do mesmo IP:** um é segurado e os outros 34 entram (regra 80, item 1).
- **Etapas:** `escolher`, `configurar_mfa` e `mfa` não gravam sessão nem `educa_sessao`.
- **Permissão:** o desafio usado como Bearer é recusado, e o token de acesso usado como desafio também. Usuário com papel `aluno` numa conta não entra por e-mail.
- **Banco:** `login_falho` grava com escola nula, e `login` sem escola é recusado.
- **Redis de fila fora:** o seguro em memória segura a conta e `limite.seguro_ativo` fica em 1.
- **Log:** redact sem e-mail, senha, cookie ou desafio.
- **Isolamento:** o `/v1/eu` e o registro de acesso usam a escola do contexto.
- **Configuração:** o argon2 não sobe abaixo da OWASP.

Cobertos:
- Todos os cenários da tabela do `4_task.md` estão cobertos, com asserção sobre o resultado.
- A concorrência é de verdade, com `Promise.all`, no HTTP (`login-email.int.test.ts:223`) e no script Lua (`contador-de-tentativas.int.test.ts:71`). O consumo do desafio também é testado em paralelo (`desafio.int.test.ts:31`).
- A queda do Redis é real (`compose stop redis-fila`).
- O recuo é testado com relógio simulado na unidade e na integração.
- O Chromebook do carrinho (50 entradas) e a troca de versão da chave têm teste.
- O isolamento do `EuRepository` e do `RegistroDeAcessoRepository` falharia sem a cláusula de escola.
- Nenhum teste chama provedor pago.
- Não há `.skip`, `.only` nem `any` nos testes. O espião no argon2 conta as chamadas sem trocar o hash real.

Bloqueantes:
1. **`apps/api/test/login-email.int.test.ts:170-202`: o bloqueio pode revelar se o e-mail existe, e nenhum teste impede isso.**
   - **O que falta:** o teste de privacidade faz uma tentativa só por caminho. Nenhum teste prova que o e-mail inexistente e a conta sem usuário ativo também chegam a `CONTA_SEGURADA` na quinta falha.
   - **Por que importa:** hoje isso vale só porque `login.service.ts:89` reserva a tentativa antes de `contaPorEmail`. Se alguém passar a reserva para depois da consulta, ou pular a contagem quando `credencial === undefined`, a suíte continua verde. Aí quem tenta descobre quais e-mails de professor existem: uma conta real segura com 429 e um e-mail inventado responde 401 para sempre. Isso fere o RF6 e a regra 20, item 6.
   - **Correção exigida:** um teste de integração com cinco senhas erradas para um e-mail inexistente e para uma conta com usuário desativado. As duas devem dar 429 `CONTA_SEGURADA` com o mesmo `Retry-After` e o mesmo corpo, fora o `requisicaoId`, de uma conta que existe.
2. **`apps/api/src/sessao/login.service.ts:94`: o filtro `ativo.papel !== 'aluno'` não tem teste.**
   - **O que falta:** o banco aceita usuário `aluno` com `conta_id` preenchido. O check `usuario_conta_so_falta_para_aluno` só exige conta para quem não é aluno. Por isso o filtro é a única coisa que impede um aluno de entrar por e-mail e senha (regra 20, item 2; o aluno entra por matrícula). Apagar o filtro não deixa nenhum teste vermelho.
   - **Correção exigida:** um teste de integração com dois casos:
     - conta com senha e só um usuário `aluno` ativo, com a senha certa: 401 `NAO_AUTENTICADO` igual aos outros, sem sessão, sem `educa_dispositivo` e com `login_falho` de escola nula;
     - conta com um `professor` e um `aluno` ativos: `pronta` na escola do professor, e não `escolher`.

Recomendações:
- **Teste de log sem dente (`login-email.int.test.ts:351`).** Hoje nada no caminho do login escreve cabeçalho ou corpo no log: o `http.erro` leva só status, código e erro. Por isso o teste passaria mesmo sem o redact novo. Quem prova o redact é `logger.test.ts`. Vale dizer isso no nome do teste, ou forçar uma linha com `cookie`, `set-cookie` e `desafio` no caminho do login.
- **Ligação do `main.ts` não testada.** O teste do Redis fora chama `observarSeguroDoLimite(..., ContadorDeTentativas)` à mão (`login-email.int.test.ts:328`). Se o `main.ts` deixar de passar o contador, nada fica vermelho.
- **Conta ativa em A e desativada em B.** Isso deve dar `pronta` em A, e só está provado no repository, não no login ponta a ponta.
- **Mensagem de `CONTA_SEGURADA`.** A tarefa pede que a mensagem diga quanto esperar. O texto é fixo ("de 30 segundos a 15 minutos, como indicado") e o tempo exato vai só no `Retry-After`. Confirme se a tela da 18.0 vai mostrar esse número.
- **Tentativa segurada fica fora do `registro_acesso`.** A tentativa que recebe 429 não grava `login_falho`. Se isso for intencional, registre a escolha nas "Notas da implementação".

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/cookie-dispositivo.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/cookie-dispositivo.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/cookies.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/cookies.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/hash-de-senha.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/hash-de-senha.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/eu.repository.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/log/logger.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/usuario.ts

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 02:43:16 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos (nesta rodada, as duas correções da 1ª):**
1. O bloqueio também não pode revelar a conta. Com cinco senhas erradas, um e-mail que não existe e uma conta com usuário desativado precisam chegar a 429 CONTA_SEGURADA, com o mesmo Retry-After e o mesmo corpo (fora o requisicaoId) de uma conta que existe.
2. O filtro `ativo.papel !== 'aluno'` em `apps/api/src/sessao/login.service.ts:94` precisa de teste:
   - conta só com aluno e a senha certa deve dar 401 NAO_AUTENTICADO, sem sessão, sem cookie `educa_dispositivo` e com um `login_falho` de escola nula;
   - conta com professor e aluno ativos deve entrar como professor (`pronta`), e não cair em `escolher`.

**Cobertos:**
- **Correção 1**, em `apps/api/test/login-email.int.test.ts:215-239`:
  - O teste manda seis senhas erradas para cada um dos três (conta existente, desativado, inexistente). Cada conta recebe as suas seis em sequência, e as três contas rodam em paralelo. Isso é válido, porque o contador é por e-mail.
  - Na conta que existe, confere quatro respostas 401 e duas 429 de 30 s.
  - Nas outras duas, compara com a conta que existe o status, o corpo sem requisicaoId e o Retry-After de cada resposta.
  - O teste ficaria vermelho se o e-mail que não existe ou o usuário desativado deixassem de contar no contador: a 5ª resposta seria 401, não 429.
- **Correção 2**, em `apps/api/test/login-email.int.test.ts:241-266`:
  - Na conta só com aluno, `esperarNaoAutenticado` confere o 401, o corpo e que nenhum cookie é enviado (`setCookie` vazio, logo sem `educa_dispositivo`). Também confere um hash, `login_falho` sem escola +1 e nenhuma sessão.
  - Sem o filtro, esse aluno entraria com etapa `pronta` e status 200, e o teste falharia.
  - Na conta com professor em A, aluno em B e professor desativado em B, o teste exige etapa `pronta` e uma única sessão, na escola A e no usuário professor. Sem o filtro, a conta teria dois usuários e cairia em `escolher`, e o teste falharia. Se o desativado passasse a contar, também falharia.
  - O relato de que a mutação do filtro deixou o teste vermelho bate com essa leitura.
- **Recomendações da 1ª rodada:** as duas foram feitas. O teste do log agora aponta para `logger.test.ts`, e a nota sobre o 429 que não grava `login_falho` entrou em `tasks/prd-identidade-e-tenancy/4_task.md`.
- Não há `.skip`, `.only` nem teste comentado. Nenhum mock esconde a regra: o espião em `HashDeSenha.verificar` só conta chamadas e não muda o resultado.

Não rodei nenhum teste, porque o portão estava usando o compose `educa-teste`. A auditoria foi feita só lendo o arquivo de teste, o `login.service.ts` e o diff do `4_task.md`.

**Bloqueantes:** nenhum.

**Recomendações:**
- `apps/api/test/login-email.int.test.ts:237`: o Retry-After é comparado com igualdade exata entre três sequências em paralelo. A 6ª resposta usa a espera que ainda falta, arredondada para cima. Se a máquina estiver muito carregada e passar mais de 1 s entre a 5ª e a 6ª, uma sequência pode dar 29 e a outra 30. É pouco provável. Se o teste oscilar um dia, basta comparar com a mesma folga de `esperarSegurada`.
- `apps/api/test/login-email.int.test.ts:135-138`: `falhasSemEscola` conta em todo o banco. Se outro arquivo de integração gravar `login_falho` sem escola em paralelo, os +1 e +4 oscilam. O risco já existia na 1ª rodada. Filtrar pelo intervalo de tempo do teste deixaria a conta estável.
- Linha 265, `expect(desativadoEmB).toHaveLength(1)`: só confirma que o insert funcionou e não prova regra. Pode sair, ou virar uma verificação de que o desativado ficou sem sessão.
- O cenário "usuário desativado com a senha certa chega a CONTA_SEGURADA" não está coberto no teste do bloqueio (ele usa senha errada). O caminho é o mesmo do código, então é cobertura extra, não uma falta.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 02:53:54 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration nova. Conferi `registro_acesso` (migration 0005). O check `registro_acesso_escola_so_falta_na_falha_sem_usuario` só deixa a escola nula em `login_falho` sem usuário, que é o que a seção 6 da Tech Spec pede. O índice `(escola_id, em)` já existia.

Queries verificadas:
- `ResolucaoDeTenantRepository.contaPorEmail` (linha 75) e `gravarFalhaDeLoginPorEmail` (linha 85). As duas têm `@SemEscopo` com justificativa escrita e estão na tabela da seção 6 da Tech Spec. A primeira devolve só id, hash e se o MFA está ativo, nunca o e-mail. A segunda grava escola e usuário nulos.
- `EuRepository.doContexto`: a escola e o usuário vêm de `identidadeDaRequisicao()`, e o método não recebe id nenhum.
- `RegistroDeAcessoRepository.gravar`: a escola vem de `contextoAtual()`, e sem escola no contexto ele falha fechado.
- `LoginService.#criarSessao` (`login.service.ts:129`): monta o contexto com a `escolaId` da linha de `usuariosAtivosDaConta`, lida do banco, nunca do cliente. A FK composta da `sessao` recusa usuário de outra escola.
- `esquemaPedidoLoginEmail` é `.strict()`, então um corpo com `escolaId` é recusado. Isso tem teste em `login-email.int.test.ts:363`.
- A etapa `escolher` devolve só o desafio, sem listar escolas.
- A rede está como `nunca` em `eu/ler` na matriz.

Teste de isolamento: presente e efetivo.
- `eu.repository.int.test.ts:15`: sem `eq(usuario.escolaId, escolaId)`, o usuário de A no contexto de B seria achado pelo join, e `naOutra` deixaria de ser `undefined`. O teste quebra.
- `eu.repository.int.test.ts:25`: prova que o registro de acesso grava na escola do contexto e falha sem ela.
- `resolucao-de-tenant.repository.test.ts`: trava a lista dos métodos sem escopo e prova que `EuRepository` e `RegistroDeAcessoRepository` não têm `@SemEscopo`.
- `login-email.int.test.ts:241`: prova que o usuário desativado em outra escola não conta e que a sessão nasce só na escola A.
- `login-email.int.test.ts:170`: senha errada, e-mail inexistente, conta sem senha e usuário desativado dão o mesmo status e o mesmo corpo.

Bloqueantes: nenhum.

Recomendações:
1. `apps/api/src/sessao/registro-de-acesso.repository.ts:13`: `gravar` recebe o `usuarioId` como argumento, e `registro_acesso.usuario_id` não tem FK composta com `escola_id` (não tem FK nenhuma). Hoje não há risco: no login, o par escola e usuário sai da mesma linha do banco, e a `sessao` gravada antes, na mesma transação, confere o par. Quando a 5.0 e a 12.0 usarem este método em outros caminhos, vale conferir o par ou documentar por que não há FK.
2. `apps/api/src/sessao/resolucao-de-tenant.repository.ts`: a classe chega a seis métodos com `@SemEscopo`. É o desvio já declarado da regra 10, item 9, contido pelo teste de arquitetura e previsto na Tech Spec, que fala em dezesseis. Vale registrar no `/retro` se o número passar do que a seção 6 prevê.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/registro-de-acesso.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/eu.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/eu.repository.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 02:54:07 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO

Auditei lendo o código e os testes, sem rodar nada, porque o portão local estava ocupando o compose `educa-teste`.

**Campos pessoais tocados:**
- e-mail da conta global (consulta `citext`; nunca é gravado fora de `conta`)
- hash de senha argon2id
- `usuario.nome`, que só aparece no `GET /v1/eu`, para a própria pessoa
- sessão (hash SHA-256 do refresh, método, conta)
- contador de tentativas (HMAC do e-mail, no Redis de fila, por 15 min)
- cookie `educa_dispositivo` (HMACs de 128 bits com data, sem nome nem e-mail)
- `registro_acesso` (evento, usuário, IP, hora; `login_falho` sem escola e sem usuário)

**Fora da tabela de dados do docs/lgpd.md:** nenhum. Hash, e-mail global, sessão, contador e cookie de dispositivo estão nas linhas 51 a 56; registro de acesso na 61; nome e e-mail da equipe na 47. A retenção de 15 min do contador coincide com o `PEXPIRE` de `max(15 min, espera)`. Aluno fica fora do login por e-mail: `login.service.ts` filtra `papel !== 'aluno'`, e há teste de integração para isso.

**Autorização por objeto:** ok.
- `GET /v1/eu` não recebe id. O `EuRepository` lê escola e usuário do contexto, e o teste de isolamento de `eu.repository.int.test.ts` mostra que o usuário de A, no contexto de B, não é encontrado.
- O login responde igual (401 `NAO_AUTENTICADO`, mesmo corpo, sem cookie) para senha errada, e-mail que não existe, conta sem senha e usuário desativado. Nos quatro casos roda um hash (hash fixo gerado no boot), e os quatro contam no contador. Por isso nem o bloqueio (`CONTA_SEGURADA` na quinta falha) revela se a conta existe. Os testes das linhas 170 e 215 de `login-email.int.test.ts` provam isso.
- O desafio e o token de acesso não servem um no lugar do outro, separados por `typ` e `aud`, com teste.
- Os dois `@SemEscopo` novos (`contaPorEmail`, `gravarFalhaDeLoginPorEmail`) têm justificativa e devolvem só id, hash e se o MFA está ativo.

**Logs:** limpos.
- Os eventos novos (`login.contador_no_seguro`, `login.redis_indisponivel`) não levam dado.
- O redact passou a cobrir `set-cookie`, `cookie` em qualquer nível e todas as chaves da seção 7 da Tech Spec (inclusive `desafio`, `refresh`, `token`, `dispositivo`), com teste que compara a lista escrita à mão.
- O teste de integração da linha 404 junta todo e-mail, senha, cookie, token e desafio vistos (mais de 40 valores) e confere que nenhum aparece no log em nível `trace`.
- O erro para o cliente é curto e tipado, e o `Retry-After` vem do filtro global.

**Auditoria:** presente onde a regra exige. Nenhuma ação nova desta tarefa exige auditoria. O login fica no `registro_acesso` (Marco Civil), gravado na escola do contexto, e a falha fica com escola nula, com check no banco que recusa `login` sem escola.

**Envio externo:** nenhum. Não há IA nem terceiro. O Redis de fila é nosso e só recebe o HMAC do e-mail e o `jti` do desafio.

**Seed/fixture:** sintético. Os e-mails de teste são `Equipe-<uuid>@Escola.invalid`, o nome é "Pessoa sintética", e as chaves do `.env.example` estão marcadas como públicas e sintéticas.

**Pergunta de fechamento:** para um aluno, esta tarefa não grava nada novo. Para um professor, o que ela grava está ligado ao `usuarioId` (sessão e `registro_acesso`) ou é efêmero e sem identidade (contador por 15 min, cookie só no navegador). Não há envio externo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `apps/api/src/sessao/login.service.ts:95`: com a senha certa e sem usuário ativo, o login ainda faz a consulta `usuariosAtivosDaConta` antes de responder 401. A diferença de tempo é pequena e só aparece para quem já tem a senha, então não bloqueia. Vale registrar para a 16.0, quando o tempo do hash for calibrado.
2. `packages/shared/src/erros/mensagens.ts`: a mensagem de `CONTA_SEGURADA` diz "de 30 segundos a 15 minutos, como indicado". A subtarefa 4.2 pede que ela diga quanto esperar, e hoje o tempo exato só vai no `Retry-After`. A tela da 18.0 deveria mostrar esse valor.
3. As linhas de `login_falho` com escola nula não têm escola para aplicar retenção configurável. O expurgo de 6 meses delas precisa entrar explicitamente na 17.2 (`sistema.expurgar-acesso`), com um teste que cubra a linha sem escola.
4. Cada falha que chega ao hash grava uma linha no Postgres. A tentativa segurada não grava, o que é certo. Mas com milhares de e-mails distintos em rodízio (sem contador segurado), o volume de `registro_acesso` cresce na mesma proporção. Isso é assunto do `infra-guardian` e da 15.0, não de privacidade.

Arquivos principais auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/cookie-dispositivo.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/eu.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/log/logger.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 02:54:32 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login | migration (não; nenhuma migration nesta tarefa)
Rate limit: ok
Fila e prioridade: ok (nada vai para fila; só o argon2 fica no request, e é trabalho que precisa ficar ali)
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

Não rodei testes nem mexi em container, porque o portão está em andamento no `educa-teste`. A auditoria foi só pela leitura do código e dos testes.

**Por que cada item passou**
- **Rate limit:** a rota é anônima e só tem o limite por IP, que foi pensado para uma escola inteira atrás de um mesmo IP (3000/min). Quem segura senha errada é o contador por conta, guardado pelo HMAC do e-mail e separado em `conhecido` e `outro`. O teste com 35 professores do mesmo IP (`login-email.int.test.ts:304`) prova que ninguém é barrado pelo IP.
- **Concorrência:**
  - O contador é um script Lua atômico, e a tentativa é contada antes do hash.
  - Dez senhas erradas ao mesmo tempo avaliam exatamente cinco hashes. Isso está provado na integração (`login-email.int.test.ts:276`) e direto no Redis (`contador-de-tentativas.int.test.ts:71`).
  - O desafio é consumido uma vez só, com `SET NX` (`desafio.int.test.ts:31`).
  - A sessão e o registro de acesso são gravados na mesma transação.
- **Redis fora ou travado:**
  - O cliente do login não guarda comando para depois (`enableOfflineQueue: false`) e desiste em 100 ms (`commandTimeout`).
  - Nesse caso, o contador em memória aplica a mesma regra, e a métrica `limite.seguro_ativo` passa a valer o maior entre o rate limit e o contador.
  - O runbook ganhou o passo 4 no alerta que já existia.
  - O teste de queda está em `login-email.int.test.ts:371`.
- **Índices:** as consultas usam `conta_email_unico` e `usuario_conta_idx`, e não há listagem.
- **Métrica:** a latência e o erro vêm do `http.server.request.duration`, que já mede por rota. `login.conta_segurada` foi para o painel e para `NOMES_NO_PROMETHEUS`. Nenhum alerta novo foi criado, então não falta runbook.
- **Teste de carga:** o cenário "login às 7h30" já está planejado para a tarefa 16.0. Nenhum teste chama provedor pago.

Recomendações:
- `apps/api/src/sessao/contador-de-tentativas.ts:86` e `:94-96`: com o Redis fora e um ataque espalhado por muitos e-mails, o mapa em memória passa de 10 mil entradas ainda válidas. A partir daí, toda tentativa percorre o mapa inteiro, custo O(n). Vale varrer no máximo uma vez por intervalo de tempo, ou pôr um teto que descarte primeiro as entradas mais antigas.
- `apps/api/src/sessao/contador-de-tentativas.ts:140`: o `eval` manda o script inteiro a cada login. Registrar com `defineCommand` faz o ioredis usar `EVALSHA`, e o pedido fica menor na rajada das 7h30.
- `apps/api/src/sessao/contador-de-tentativas.ts:140-147`: se o Redis executar o script e a resposta passar dos 100 ms, a tentativa é contada no Redis e também em memória. O erro é para o lado seguro, mas vale uma linha de comentário dizendo isso.
- `apps/api/src/sessao/login.service.ts:93`: o argon2 roda no pool de threads do libuv, que por padrão tem 4 threads e é o mesmo usado pela resolução de DNS. Na tarefa 14.0 (semáforo do hash), ou nas instâncias separadas de login citadas em `docs/infra.md` 3.1, vale considerar `UV_THREADPOOL_SIZE` junto com o semáforo, para a rajada não atrasar reconexão de Postgres e Redis.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-18 02:54:36 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: há divergência em `educa_dispositivo`, que é gravado antes de o login terminar (seção 5, "Passagem", e subtarefa 4.3), e no contador sem `rate-limiter-flexible` (seção 5, "Tentativas").
Portão local: `apps/api/src/sessao/login.service.ts mudou em 2026-09-18 02:42:23, depois do início do último (2026-09-18 02:18:30). Rode node tools/processo/portao-local.ts --infra de novo.`

Bloqueantes:

1. **O cookie de dispositivo é gravado antes do MFA e antes da escolha de escola.**
   - **Onde:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:102-111`. O teste que fixa esse comportamento está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts:338`.
   - **O que está errado:** `educa_dispositivo` sai em qualquer etapa, inclusive `configurar_mfa`, `mfa` e `escolher`. A subtarefa 4.3 e a Tech Spec (seção 5, "Passagem") dizem "gravado só depois de login bem-sucedido". Para o coordenador, o login só termina depois do MFA.
   - **Por que isso pesa:** a nota da implementação diz que "quem tem a senha já passou pelo que o cookie protege". Não passou. Quem roubou a senha de um coordenador ganha a marca de navegador `conhecido` sem ter o segundo fator. Na 6.0, o `/v1/sessao/mfa` conta no mesmo contador. Então o atacante que erra o código cai no mesmo contador `conhecido` do coordenador de verdade e passa a travar a conta dele. É exatamente o que os dois contadores existem para evitar.
   - **Por que não basta estar nas notas:** a mudança contradiz um critério escrito da própria tarefa e enfraquece uma garantia de segurança. Estar registrada nas notas não torna a decisão aceita.
   - **Correção exigida:** gravar `educa_dispositivo` só em `pronta`, e deixar para as rotas que concluem a etapa (6.0 e 12.0) gravarem o cookie quando o login termina. Inverter a asserção da linha 338: nenhuma das três etapas com desafio devolve `educa_dispositivo`. Se quiserem manter o comportamento atual, parem e aprovem a mudança na Tech Spec antes, pelo processo, com a análise do contador do MFA.

2. **O portão local não tem carimbo válido para a árvore atual.**
   - **O que está errado:** `login.service.ts` mudou depois do início do último portão.
   - **Correção exigida:** deixar terminar o `node tools/processo/portao-local.ts --infra` que está rodando, ou rodar de novo depois da correção 1, e conferir com `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/4_task.md` antes do commit.

Recomendações:

- **Contador em script Lua em vez de `rate-limiter-flexible`.** A justificativa se sustenta: o recuo que dobra, montado com a biblioteca, faria "lê e depois grava". Mas a Tech Spec (seção 5, "Tentativas") continua citando a biblioteca, e a 6.0 vai ler que o MFA usa "o mesmo contador". Corrijam essa linha da Tech Spec para quem implementar o MFA encontrar o `ContadorDeTentativas`.
- **Mensagem de `CONTA_SEGURADA`** (`/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/erros/mensagens.ts`). Ela diz "de 30 segundos a 15 minutos, como indicado", e não quanto esperar de fato. Como a mensagem é fixa, deixem registrado no contrato que a tela da 18.0 mostra o tempo a partir do `Retry-After`.
- **Ligação do contador no `main.ts`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/main.ts`). O `main.ts` passa o `ContadorDeTentativas` a `observarSeguroDoLimite`, e nenhum teste cobre isso: se a ligação sair, nada fica vermelho. O `test-engineer` já apontou.
- **Consulta a mais com a senha certa** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:94`). Numa conta com usuário desativado, a senha certa faz uma consulta que a errada não faz. O tempo da resposta só revela algo a quem já tem a senha, então não bloqueia. Vale um comentário para ninguém reaproveitar esse padrão em outro caminho.

## test-engineer · 3ª rodada · APROVADO · 2026-09-18 03:06:38 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO

A correção exigida pelo revisor-geral está feita e tem teste que a prova. Não rodei nenhum teste, como você pediu: auditei lendo o código atual.

**Cenários exigidos (desta rodada):**
- `educa_dispositivo` só sai quando o login termina (`pronta`).
- Nenhuma das etapas com desafio (`escolher`, `configurar_mfa`, `mfa`) grava cookie.
- `pronta` continua gravando `educa_dispositivo` com os atributos certos, junto com `educa_sessao`.
- A varredura do seguro em memória roda no máximo uma vez a cada 60 s.

**Cobertos:**
- **Correção no serviço:** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:105-110`, toda etapa diferente de `pronta` devolve `cookies: []`. O `educa_dispositivo` sai só em `pronta` (linhas 114-124), junto com `educa_sessao`. A doc da classe (linhas 73-75) diz o mesmo.
- **Teste das etapas invertido e efetivo:** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts:339`, a asserção agora é `expect(resposta.setCookie, etapa).toEqual([])`, e roda nas três etapas: conta com usuário nas escolas A e B, coordenador sem MFA e coordenador com MFA. Se o cookie voltasse a ser gravado em qualquer uma delas, o teste falharia. As linhas 343-346 continuam provando que nenhuma sessão nem registro de `login` foi gravado.
- **Caminho feliz:** o teste das linhas 142-151 exige o `educa_dispositivo` com `HttpOnly`, `Max-Age=2592000`, `Path=/v1/sessao` e `SameSite=Strict`. Se a mudança tivesse tirado o cookie também de `pronta`, o texto vazio não bateria com essa lista e o teste falharia. O teste da linha 286 (o script que erra a senha em outro navegador não segura a professora) continua usando o cookie de uma resposta `pronta`, então segue válido.
- **Comentário sobre a consulta a mais com a senha certa** (linhas 95-96): é só texto, a lógica não mudou. A resposta de senha errada, e-mail inexistente e conta sem usuário ativo continua igual, conferida por `esperarNaoAutenticado`, que exige `setCookie` vazio.
- **Varredura com intervalo mínimo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts:17,80,89,97-100`): `#ultimaVarredura` começa em `-Infinity`, então a primeira varredura acima de 10 mil entradas acontece na hora, e as seguintes esperam 60 s. Nenhuma regra de contagem ou de espera mudou, e os testes do seguro em memória (a partir da linha 35 de `contador-de-tentativas.test.ts`) continuam cobrindo essa regra.

**Bloqueantes:** nenhum.

**Recomendações:**
- A varredura do seguro em memória não tem teste, nem o gatilho de 10 mil entradas (que já existia na rodada aprovada) nem o novo intervalo de 60 s. Um teste de unidade com o relógio falso resolveria. Por exemplo: encher com mais de 10 mil chaves vencidas, provar que uma reserva as remove, e provar que uma segunda reserva antes de 60 s não varre de novo. Para observar isso sem expor o estado interno, dá para expor o tamanho do seguro ou contar as varreduras. Não bloqueia porque protege memória e CPU, não uma regra de negócio, mas fica para o `/retro`.
- A nota do `4_task.md` e a seção 5 do `techspec.md` são só texto e estão coerentes com o código. Não há o que exigir.

## revisor-geral · 2ª rodada · REPROVADO · 2026-09-18 03:16:49 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A seção 5 "Tentativas" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/techspec.md` agora registra o `ContadorDeTentativas` com o script Lua. Com isso a escolha deixou de ser silenciosa.
Portão local: `portão local: apps/api/test/login-email.int.test.ts mudou em 2026-09-18 03:05:16, depois do início do último (2026-09-18 02:42:31). Rode `node tools/processo/portao-local.ts --infra` de novo.`

Bloqueantes:
1. **Portão local sem carimbo para a árvore atual** (correção 2 da 1ª rodada). O carimbo que existe é da rodada iniciada às 02:42:31, antes da última mudança no teste. Há um `node tools/processo/portao-local.ts --infra` rodando desde as 03:05:42, depois dessa mudança (03:05:16), mas ele ainda não gravou carimbo. Correção exigida: deixar esse portão terminar verde e confirmar que `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/4_task.md` passa. Se ele terminar vermelho ou algum arquivo mudar de novo, rode `node tools/processo/portao-local.ts --infra` outra vez. Nenhum código precisa mudar para este ponto. Quando a conferência passar, basta uma rodada curta só para registrar o carimbo.

A correção 1 da rodada anterior foi feita:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:105-111`: as etapas com desafio devolvem `cookies: []`, e `educa_dispositivo` só sai em `pronta` (linhas 117-123).
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts:339`: exige `setCookie` vazio nas três etapas.

A varredura com intervalo mínimo em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts:80-98` está correta e não trouxe problema novo.

Recomendações: nenhuma nova. As mensagens de `CONTA_SEGURADA` e a ligação no `main.ts` continuam anotadas para a 18.0 e o `/validar`, como você registrou.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-18 03:17:00 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o diff desde a minha rodada aprovada. Não rodei testes nem mexi em container.

Campos pessoais tocados: nenhum campo novo. O diff mexe no `educa_dispositivo`, que já existia: o cookie guarda uma marca do e-mail, e a chave no Redis continua sendo o HMAC do e-mail. O contador segue com a mesma chave HMAC e a mesma retenção de 15 min que já está no `docs/lgpd.md`.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. Nas etapas `escolher`, `configurar_mfa` e `mfa` agora não sai cookie nenhum nem é criada sessão (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:106-111`). O `educa_dispositivo` sai só em `pronta`, junto com o `educa_sessao` (`login.service.ts:115-124`). Isso fecha um risco: quem tinha só a senha do coordenador ganhava a marca de navegador conhecido sem o segundo fator, e com ela escapava do contador `outro`. As respostas de falha continuam iguais (`NAO_AUTENTICADO`) para senha errada, e-mail inexistente e conta sem usuário ativo. A consulta a mais só acontece depois do hash e só com a senha certa, e o comentário das linhas 95-96 explica por quê.

Logs: limpos. O único log novo ou tocado é `login.contador_no_seguro` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts:118`), sem identificador nenhum. A mudança da varredura (linhas 89 e 97-100) não traz dado novo.

Auditoria: presente. O login bem-sucedido grava `registro_acesso` na transação da sessão. As etapas sem sessão não gravam nada, e o teste confirma isso (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts:343-344`). Esta tarefa não tem leitura por coordenação ou rede, exportação nem alteração de nota.

Envio externo: nenhum.

Seed/fixture: sintético. O teste usa `'Pessoa sintética'` e e-mails gerados pela bancada.

Bloqueantes: nenhum.

Recomendações:
1. Como as etapas intermediárias não gravam mais o `educa_dispositivo`, quem o grava para `escolher` e para o MFA são as rotas das tarefas 6.0 e 12.0. Elas precisam de um teste que prove que o cookie sai só depois do segundo fator, ou da escolha, concluído. Vale deixar isso escrito nos `_task.md` dessas tarefas, para não se perder.
2. O teste da linha 339 exige que nenhum cookie saia nas três etapas, o que cobre a regra. Um caso a mais no `pronta`, conferindo que saem só os dois cookies esperados, deixaria o contrato explícito dos dois lados.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-18 03:17:02 · `tasks/prd-identidade-e-tenancy/4_task.md`

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

Esta é a rodada 2. Auditei só o diff desde a rodada aprovada. Não rodei testes nem mexi em container.

- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts:89,97-100`: a varredura agora roda no máximo uma vez por minuto, e só quando o seguro em memória passa de 10 mil entradas. A contagem por conta continua igual, e o seguro nunca libera uma tentativa sem contá-la. As entradas continuam limitadas pela validade de 15 min, como antes. Isso não mudou o que acontece com uma escola.
- `contador-de-tentativas.ts:149-152`: o comentário descreve a contagem dupla quando a resposta do Redis demora, e o erro fica do lado de segurar a conta, nunca de liberar. Está correto.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:106-111`: nas etapas com desafio, a resposta sai sem cookie nenhum; `educa_dispositivo` só sai em `pronta` (linhas 117-123). A reserva continua antes do hash, e a chave continua por conta e origem, nunca por IP. A consulta a mais (linha 97) só acontece com a senha certa.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts:339`: o teste exige `setCookie` vazio em cada uma das etapas com desafio. Se o cookie voltar a sair em alguma delas, o teste quebra.

Recomendações:
1. Continua em aberto trocar o `eval` do script por `defineCommand`/`EVALSHA`. Sem isso, o script inteiro vai ao Redis a cada tentativa na rajada das 7h30. A decisão de medir isso na 16.0 está registrada, e a 16.0 precisa confirmar o custo com a rajada de login do teste de carga.
2. O contador é zerado quando a senha confere, antes de o segundo fator do coordenador ser cumprido (`login.service.ts:104`). Com isso, as tentativas do segundo fator precisam de um limite próprio por conta na 6.0. Vale a 6.0 declarar esse limite para ele não depender deste contador.
3. Um coordenador que nunca concluiu o segundo fator fica sempre como origem `outro`, porque só recebe `educa_dispositivo` depois de concluí-lo. A 6.0 e a 12.0 precisam gravar esse cookie ao concluir a etapa, como diz o comentário. Vale conferir isso na auditoria delas.

## revisor-geral · 3ª rodada · APROVADO · 2026-09-18 03:51:33 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. O `conferir` devolve "portão local válido para o código atual (typecheck, lint, test, infra)" e sai com código 0.
Bloqueantes: nenhum.

A única correção pedida na 2ª rodada era o carimbo do portão local para a árvore atual, e ela foi feita. Na lista de arquivos alterados só entrou o que o hook escreve, `tasks/prd-identidade-e-tenancy/4_task.md` e `tasks/prd-identidade-e-tenancy/achados-revisoes.md`. Não há arquivo de código, teste ou documento novo desde a rodada anterior. Como o código não mudou, o resto da auditoria daquela rodada continua valendo.

Recomendações:
- O teste `infra/test/borda.int.test.ts` > "handshake por polling fica na mesma instância pelo cookie da borda…" falha de vez em quando. Ele manda 20 POSTs em paralelo no mesmo `sid` de polling, e o engine.io recusa pedido sobreposto no mesmo `sid` com 400 "data request overlap from client" (`node_modules/engine.io/build/transports/polling.js:93`). O teste fica vermelho de forma intermitente e pode segurar a esteira de outra tarefa. Vale abrir uma correção própria, fora desta tarefa, que mande os pedidos em sequência ou que abra um `sid` por pedido. O log da falha está em `/tmp/portao-4-vermelho.log`.

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

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

## test-engineer · 1ª rodada · APROVADO · 2026-09-18 07:45:29 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- caminho feliz: o operador gera o convite, o coordenador consulta, aceita e vai para `configurar_mfa` sem sessão nem cookie
- privacidade do token: arquivo 0600, terminal limpo, só o hash no banco, log limpo
- concorrência: dois aceites em paralelo com o mesmo token
- borda: expirado, revogado, usado e inexistente dão a mesma resposta nas duas rotas
- isolamento: a conta que coordena B recebe convite de A
- borda: a pessoa abandona depois de `entrar`
- DTO do `consultar` sem e-mail nem nome
- permissão: não há rota de criação, e o comando recusa escola inexistente

Casos extras que o domínio pede aqui:
- a mesma conta nova convidada por A e por B, com os dois aceites ao mesmo tempo
- dois logins em paralelo ativando o convite pendente
- coordenador desativado que tenta voltar pelo convite antigo
- convite de novo para o mesmo coordenador (inativo volta a esperar; ativo dá CONFLITO)
- conta com MFA, que só é ativada depois do código
- escopo do `ConviteRepository` quando o contexto é de outra escola

**Cobertos:** todos os itens da tabela da tarefa e todos os extras acima.
- `apps/api/test/convite.int.test.ts`:
  - caminho feliz, com auditoria e validade de 72 h: linhas 211-269
  - privacidade do token: 271-293
  - aceites em paralelo com `Promise.all`: 295-311 e 313-329
  - expirado, revogado, usado e inexistente, com o corpo comparado sem o `requisicaoId`: 331-365
  - isolamento com MFA, senha de B intacta e auditoria só em A: 367-408
  - dois logins paralelos ativam uma vez: 410-420
  - abandono, convite vencido e convite revogado depois do aceite: 422-445
  - desativado depois de entrar, reconvite e CONFLITO: 447-475
  - conta nova sem senha: 477-484
  - DTO: 486-494
  - permissão, com a sentinela `GET /saude` para a lista de rotas não sair vazia: 496-535
- `apps/api/src/sessao/convite.repository.int.test.ts`:
  - escopo de B: linhas 58-73
  - cada condição de `ativarPorConvite` isolada, incluindo `usado_em >= desativado_em`: 75-91
  - concorrência: 93-97
  - falha fechada sem escola no contexto: 114-119
- `resolucao-de-tenant.repository.test.ts` passa a exigir `@SemEscopo` com justificativa nos 7 métodos novos, e nenhum no `ConviteRepository`.

Conferi pela leitura as mutações citadas (m1 e m2). Três outras quebrariam testes existentes:
- tirar o desvio `if (credencial.mfaAtivo) return pedirSegundoFator` do `login.service.ts` quebra a linha 387.
- tirar o `if (... pedido.senha === undefined) throw ENTRADA_INVALIDA` quebra as linhas 480-481.
- tirar o `gte(usadoEm, desativadoEm)` quebra a linha 79 do teste do repositório e a linha 464 do teste de integração.

Não há `.skip`, `.only` nem mock de coisa nossa. Não há chamada de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Registrar na 12.0 o que ficou para depois.** A tabela pede que o usuário pendente "não apareça em `acessos`". Isso foi adiado para a 12.0, mas `tasks/prd-identidade-e-tenancy/12_task.md` não fala em convite nem em usuário inativo. Convém acrescentar lá o cenário "usuário que espera convite aceito não aparece em `/v1/eu.acessos`", para o adiamento não se perder.
2. **Revogação no meio do login sem teste.** Em `apps/api/src/sessao/login.service.ts:73`, o caso do convite revogado entre `pendentes` e `ativar` numa conta sem outro usuário ativo cai em `NAO_AUTENTICADO`, e nenhum teste passa por essa linha. A regra está coberta no repositório; falta o desfecho no login.
3. **Nome da escola não discrimina nada.** Em `apps/api/test/convite.int.test.ts:223`, todas as escolas da bancada se chamam "Escola sintética de teste". Se o `consultar` devolvesse o nome de outra escola, esse teste não perceberia. Dar nomes distintos a A e B no teste HTTP fecha a lacuna. Hoje ela é coberta só no repositório, nas linhas 66-67.
4. **Margem de 1 s depende do relógio.** O caso "72 h + 1 s" em `apps/api/test/convite.int.test.ts:334` compara o relógio do Node com o `now()` do Postgres. Com o container atrasado mais de 1 s, o teste fica instável. Uma margem de alguns segundos, ou `expira_em` ajustado direto no banco, evita isso.
5. **Comando rodado duas vezes em paralelo sem teste.** O mesmo `ops:convite-coordenador` (mesmo e-mail e escola) em paralelo não tem teste. O código se apoia em `onConflictDoNothing` e `onConflictDoUpdate`, e o caso é raro por ser comando manual. Mesmo assim, um teste com `Promise.all` provaria uma conta, um usuário e um só convite não revogado.
6. **Token perdido se a gravação do arquivo falhar.** Em `apps/api/src/ops/convite-coordenador.ts:87`, o token é escrito depois do commit. Se essa escrita falhar, o convite fica no banco sem token recuperável. O operador resolve gerando outro, que revoga o anterior. Vale uma linha nas Notas da implementação ou no runbook.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/convite-coordenador.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/convite-coordenador.ts`

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-18 07:50:48 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A divergência sobre o aceite de conta existente está nas "Notas da implementação" e a Tech Spec foi atualizada nas seções 5 e 6. Não foi decidida em silêncio.
Portão local: `portão local: apps/api/src/ops/comando.ts mudou em 2026-09-18 07:43:43, depois do início do último (2026-09-18 07:43:43). Rode node tools/processo/portao-local.ts de novo.`

Bloqueantes:
- `.processo/portao.json`: o `conferir` recusa o carimbo, e o hook vai bloquear o commit. O `mtime` de `apps/api/src/ops/comando.ts` (10:43:43.433Z) é 39 ms anterior ao início do carimbo (10:43:43.472Z). Mas o `avaliarCarimbo` (`tools/processo/revisoes.ts:205-206`) compara por segundo com `>=`, então a edição e o início do portão no mesmo segundo contam como alteração depois do portão. Correção exigida: rodar `node tools/processo/portao-local.ts` de novo, sem mexer em código depois, e confirmar que o `conferir` sai com código 0.

Recomendações:
- `apps/api/src/sessao/convite.service.ts:101-103,120`: a tarefa diz que a conta com senha "recusa o campo senha"; o código ignora a senha e responde `entrar`. A senha da conta nunca muda, então não é bug, e a leitura está nas notas. Ainda assim, recusar com `ENTRADA_INVALIDA` seria mais fiel ao texto e evitaria que a tela da 19.0 mostre "senha definida" a quem só deve entrar.
- `apps/api/src/sessao/resolucao-de-tenant.repository.ts:325` e `convite.repository.ts:282`: a ativação no login exige `expira_em > now()`. Quem aceita perto das 72 h e entra minutos depois fica inativo sem aviso e precisa de convite novo. É o que a Tech Spec atualizada diz, mas vale registrar isso no runbook do operador ou contar o prazo da ativação a partir do `usado_em`.
- `apps/api/src/sessao/convite.service.ts:113-115`: no aceite por conta que já tem senha, `convite.aceito` sai com o usuário convidado ainda inativo como autor, antes de ele provar a credencial. Uma saída é gravar sem `usuarioId` no contexto e deixar a autoria para `usuario.ativado_por_convite`.
- `apps/api/src/sessao/login.service.ts:101`: se `ativados.length === 0` depois da ativação (convite revogado no meio), a resposta é `NAO_AUTENTICADO`, sem `gravarFalhaDeLoginPorEmail` e com o contador já zerado. É raro e inofensivo, mas destoa do caminho de falha logo acima.
- `apps/api/src/ops/escola.ts:41-42`: sobrou uma linha em branco dupla onde saiu o `esquemaNome`.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/7_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.ts`

## privacy-guardian · 1ª rodada · REPROVADO · 2026-09-18 07:51:13 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: REPROVADO

Campos pessoais tocados: `conta.email` e `usuario.nome` do coordenador convidado, gravados pelo `ops:convite-coordenador`. A tarefa também cria a tabela `convite`, que guarda só ids, `token_hash`, `tipo` e datas. Nenhum campo de aluno.

Fora da tabela de dados do docs/lgpd.md: nada. "Convite de coordenador (hash do token, datas)" está na linha 59, com finalidade e retenção de 30 dias. Conta e usuário da equipe já estavam no mapa.

Autorização por objeto: falha na ativação por convite de conta existente. A ativação acontece no `POST /v1/sessao/login` e no MFA, e é essa a falha bloqueante descrita abaixo. `consultar` e `aceitar` estão ok: acham o convite pelo hash e usam a escola dele como contexto. O `ConviteRepository` tira o escopo do contexto e falha se ele não existir. As FKs compostas impedem convite com usuário de outra escola. Não existe rota que crie convite.

Logs: limpos. O teste de integração varre o log do aceite (que falhou e que passou) e confirma que não aparecem token, e-mail, senha nem nome. O terminal do comando mostra só o id do convite e o caminho do arquivo. Mensagens de erro têm texto fixo por código, e o erro do Postgres sai resumido por `resumirErro`.

Auditoria: presente. `convite.criado` e `convite.revogado` registram `autor_operador`. `convite.aceito` e `usuario.ativado_por_convite` registram o convidado como autor. Os esquemas são estritos e levam só ids, datas e booleanos.

Envio externo: nenhum. Não há IA nem envio de e-mail; no F1 o operador manda o link à mão.

Seed/fixture: sintético (`@escola.invalid`, "Renata Convidada Sintética").

Bloqueantes:

1. **O link aceito por uma pessoa ativa a conta de outra.**
   - **Onde:** `apps/api/src/sessao/login.service.ts:87-98`, `apps/api/src/sessao/mfa.service.ts:115-116`, `apps/api/src/sessao/convite.service.ts:79` e `:95`.
   - **O que está errado:** no caminho de conta existente, a ativação depende de duas coisas: o convite estar marcado como usado e a conta dona do e-mail fazer um login qualquer. Nada liga o login a quem aceitou o link.
   - **Cenário concreto:**
     1. O operador digita errado o e-mail. Por coincidência, é o de X, coordenadora da escola B.
     2. O operador manda o link à pessoa certa, Y.
     3. Y abre o link e recebe `entrar`. O convite fica marcado como usado.
     4. Na próxima vez que X entra na escola B (senha e MFA dela, dentro das 72 h), `AtivacaoPorConvite.pendentes` encontra o usuário de A e o ativa.
     5. X passa a ser coordenadora da escola A, com acesso aos dados dos alunos.
   - **Contradição com a documentação:** a nota da tarefa e a Tech Spec (seção 5, "Etapas") dizem que "só a credencial não basta, para um e-mail digitado errado pelo operador não ativar a conta de outra pessoa". Isso só vale enquanto ninguém aceita o link. O destinatário certo aceita, então a proteção não funciona no caso real. Isso é vazamento entre escolas por um caminho previsível, e nenhum teste o cobre.
   - **Correção exigida:**
     - O aceite de conta existente responde `entrar` com um bilhete assinado e de validade curta, ligado ao `conviteId` e ao `contaId` do convite.
     - O login por e-mail (e o MFA na sequência) só ativa o usuário pendente quando esse bilhete vem junto e a conta autenticada é a do bilhete.
     - Login rotineiro sem o bilhete nunca ativa.
     - Nota da 7.0 e seção 5 da Tech Spec corrigidas para refletir isso.
   - **Testes exigidos:**
     - convite aceito pelo link, depois login da conta dona do e-mail sem o bilhete: A continua inativo;
     - bilhete apresentado no login de outra conta: não ativa;
     - bilhete e conta certos: ativa, com `usuario.ativado_por_convite`.

Recomendações:
- Registrar em `convite.criado` se a conta já existia, sem o e-mail. Isso ajuda a auditoria a reconstituir o erro do operador.
- `aceitar` sem senha em conta nova responde `ENTRADA_INVALIDA`, e o convite inválido responde `NAO_ENCONTRADO`. Isso só distingue as duas situações para quem já tem o token de 256 bits, então é aceitável. Vale deixar escrito na Tech Spec.
- Revogar um convite não desfaz a ativação que já aconteceu. Deixar claro no README que, nesse caso, o operador precisa desativar o usuário.

Pergunta de fechamento: a tarefa não trata dado de aluno. O que ela guarda sobre o coordenador (conta, usuário, convite e as quatro ações de auditoria) é rastreável por id.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.controller.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/convite-coordenador.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/revogar-convite.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0008_convite.sql`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/convite.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts`.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 07:51:17 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: APROVADO

Tabelas verificadas:
- `convite`, em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0008_convite.sql` e `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/convite.ts`. Tem `escola_id NOT NULL`. A FK composta `(escola_id, usuario_id)` aponta para `usuario(escola_id, id)`, o que impede um convite de apontar para um usuário de outra escola. O id é UUID (`uuidv7()`). O índice `(escola_id, usuario_id)` começa pelo escopo. A tabela não varia por período, então não precisa de `anoLetivoId`. Não tem nome, e-mail nem token em claro.

Queries verificadas:
- `ConviteRepository`: `nomeDaEscola`, `usuarioConvidado`, `revogarConvitesDoUsuario`, `criarConvite`, `ativarPorConvite` e `revogar`. Todas pegam a escola do contexto e falham fechado quando o contexto não tem escola. Nenhuma recebe `escolaId` por argumento.
- `ResolucaoDeTenantRepository`, métodos novos: `conviteValidoPorHash`, `usarConvitePorHash`, `definirSenhaNoAceite`, `usuariosComConviteAceito`, `escolaPorSlug`, `contaParaConvite` e `escolaDoConviteParaOperador`. Todos têm `@SemEscopo` com justificativa escrita. O teste de `resolucao-de-tenant.repository.test.ts` confere cada justificativa e confere que o `ConviteRepository` não tem nenhum método sem escopo.
- Rotas `POST /v1/convites/consultar` e `/aceitar`: os esquemas são `.strict()`, então o corpo não aceita `escolaId`, e a query string não é lida. A escola sai do convite achado pelo hash do token. O token vai só no corpo.
- A escola dos comandos `ops:*` vem do slug (operador) ou do próprio convite (revogação), nunca do cliente.
- Expirado, revogado, usado e inexistente devolvem o mesmo `NAO_ENCONTRADO` 404 nas duas rotas, com o corpo igual. O teste compara isso.

Teste de isolamento: presente e efetivo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts:58`: no contexto de B, `ativarPorConvite`, `revogar` e `revogarConvitesDoUsuario` sobre o convite de A não mudam nada, e `nomeDaEscola` devolve o nome de B. Se eu tiro mentalmente o filtro de escola do `update`, o usuário de A seria ativado e o convite seria revogado, e o teste quebra.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts:367`: se eu tiro o `where senha_hash is null`, a senha de B muda e o teste quebra. Se eu tiro a exigência de convite aceito na ativação, o teste de abandono (linha 422) quebra.

Bloqueantes: nenhum.

Recomendações:
1. **A ativação no login não prova que quem aceitou o link é a mesma pessoa que entrou.** Esse ponto pesa para a Tech Spec e para o `/validar`.
   - A nota da implementação diz que, se o operador digitar o e-mail de outra pessoa que já tem conta, o login rotineiro dela não a torna coordenadora de A. Isso só vale enquanto ninguém aceita o link.
   - O cenário: o operador erra e digita o e-mail de P, que coordena B. Ele manda o link à pessoa certa, Q. Q aceita e recebe `entrar`. No próximo login rotineiro, P é ativada como coordenadora de A sem ter pedido (`AtivacaoPorConvite.pendentes` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:87`) e passa a ver os dados de A.
   - O código segue o fluxo que a tarefa pede, por isso não bloqueia. Mas depende só de um erro do operador para vazar dado entre escolas.
   - Sugestão: ligar a ativação à posse do link. Por exemplo, o `aceitar` com conta existente devolve um desafio assinado do convite, e só o login que traz esse desafio ativa o usuário. Registrar o caso na Tech Spec (seção 5) e corrigir a nota da 7.0.
2. `ResolucaoDeTenantRepository` já tem 20 métodos `@SemEscopo`. A Tech Spec concentra ali a fronteira de propósito, mas a regra 10, item 9, pede atenção a isso. Vale conferir na seção 6 que os 7 métodos novos estão listados um a um.
3. O `CONFLITO` do `ops:convite-coordenador` ("esta pessoa já é coordenadora ativa desta escola") diz ao operador que aquele e-mail tem conta ativa na escola. Como só o operador vê, é aceitável. Fica registrado caso o comando um dia vire rota.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 07:58:13 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- **O que o privacy-guardian pediu:**
  - a dona do e-mail aceita o link e depois entra no login de sempre, sem o bilhete: A fica inativo;
  - o bilhete é usado no login de outra conta: nada é ativado;
  - bilhete e conta certos: ativa, e grava `usuario.ativado_por_convite`.
- **Casos de borda:** conta com MFA (ativa só depois do código); conta sem MFA (ativa já com a senha); bilhete forjado ou quebrado; bilhete vencido (30 min); convite revogado depois do aceite; bilhete de um convite usado para ativar outro convite da mesma conta; coordenador desativado depois de entrar.
- **Permissão:** o bilhete não serve como desafio nem como token de acesso, e o desafio e o token não servem como bilhete.
- **Concorrência:** dois logins em paralelo com o mesmo bilhete ativam uma vez só.

Cobertos:
- **O login sem bilhete nunca ativa.**
  - `apps/api/test/convite.int.test.ts:394-399`: conta com MFA, login de sempre e depois o código. Continua inativo em A.
  - `convite.int.test.ts:436`: a dona do e-mail sem o bilhete.
  - `convite.int.test.ts:475-480`: login sem o bilhete de A.
  - Se a ativação sem bilhete da rodada anterior voltasse, esses três testes quebrariam.
- **Bilhete no login de outra conta** (`convite.int.test.ts:434`): falharia se o filtro por conta saísse das duas camadas. O filtro está em `AtivacaoPorConvite.pendentePeloBilhete` e também em `usuario.conta_id` na consulta. Com só uma delas removida, o teste ainda passa.
- **Bilhete e conta certos:**
  - com MFA, `convite.int.test.ts:402-421`. Continua inativo depois da senha (linha 404), ativa depois do código (linha 407) e a linha exata de `usuario.ativado_por_convite` é conferida (linhas 411-420);
  - sem MFA, `convite.int.test.ts:449-459`.
- **O convite do bilhete tem que ser o que ativa** (`convite.int.test.ts:477-479`): o bilhete de C, revogado, não ativa A, que está pendente e não revogado. Falharia se o filtro por `conviteId` saísse de `usuarioComConviteAceito`.
- **Bilhete forjado, lixo, e convite revogado usado com bilhete:** `convite.int.test.ts:438-446`.
- **Desativado depois de entrar não volta pelo bilhete antigo:** `convite.int.test.ts:503-505`.
- **Vencimento e outra chave, com a borda de 30 min ±1 s:** `apps/api/src/sessao/bilhete-de-convite.test.ts:25-33`.
- **Separação por `typ`/`aud` nos dois sentidos:** `bilhete-de-convite.test.ts:35-45`.
- **`convite_id` no desafio, que só existe quando é emitido com ele:** `apps/api/src/sessao/desafio.test.ts:28-35`.
- **O aceite responde exatamente `{ etapa: 'entrar', bilhete }`, sem cookie:** helper em `convite.int.test.ts:158-164`.
- **`contaNova` no `convite.criado`:** linhas 261 e 409.
- **Concorrência de verdade:** `Promise.all` com o mesmo bilhete, e uma única auditoria (`convite.int.test.ts:455-458`).
- Não achei `.skip`, teste comentado nem mock que esconda a regra. Nenhum teste chama provedor de IA.

Bloqueantes: nenhum

Recomendações:
- **Convite vencido depois do aceite.** A condição `expira_em > now()` saiu da ativação (`resolucao-de-tenant.repository.ts`, `usuarioComConviteAceito`), então o prazo depois do aceite passou a ser só o do bilhete. Não há teste de integração para o caso "aceito antes do vencimento, login com bilhete válido depois das 72 h, e ainda ativa". Hoje isso só está documentado. Vale um teste que fixe o comportamento escolhido, para ninguém reintroduzir a condição sem perceber.
- **Conta com MFA cujos outros usuários foram todos desativados.** Se ela aceita o convite de A, `LoginService.entrarPorEmail` segue para `mfa` pelo `esperaCodigo`, mesmo com zero usuários ativos. Nenhum teste cobre esse ramo, nem o espelho dele, em que o convite é revogado entre a senha e o código e o `MfaService` tem de responder `NAO_AUTENTICADO` sem ativar.
- **Bilhete que passa do tamanho.** Não há teste de contrato para `bilhete` acima de 1.024 caracteres em `esquemaPedidoLoginEmail`, onde o esperado é 400, e não "ignorado".
- **Nome de teste desatualizado.** O teste em `convite.int.test.ts:524` ainda se chama "aceitar só a etapa e o desafio". O caminho `entrar` agora tem `bilhete`. A asserção cobre, mas o nome pode mencionar os dois formatos.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/bilhete-de-convite.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/bilhete-de-convite.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/conclusao-de-login.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/login.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/convite.ts`

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-18 08:03:31 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: APROVADO

A correção exigida na 1ª rodada foi feita. Auditei lendo, sem rodar testes, porque o portão local já estava verde.

**Campos pessoais tocados:** e-mail e nome do coordenador. Os dois chegam só como argumento do `ops:convite-coordenador`, e só o e-mail é gravado, em `conta.email`. A tabela `convite` guarda o hash do token e datas. O novo bilhete leva só `conta_id` e `convite_id`. O desafio ganhou só o claim opcional `convite_id`.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. O convite está em `docs/lgpd.md:59`, com finalidade e retenção. O bilhete não é gravado em lugar nenhum.

**Autorização por objeto:** ok.
- **Qual conta pode ativar:** `AtivacaoPorConvite.pendentePeloBilhete` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts:175-180`) só ativa quando a conta do bilhete é a mesma que acabou de provar a senha. `usuarioComConviteAceito` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:526`) filtra pela conta e pelo convite do bilhete.
- **Login rotineiro:** sem bilhete, nada é ativado (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:363`).
- **Conta com MFA:** a ativação fica para depois do código. O `conviteId` vai assinado no desafio e o `MfaService` só ativa depois do acerto (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts:420-421`).
- **Conta de aluno:** nunca é ativada por convite.
- **Respostas iguais:** convite expirado, revogado, usado ou inexistente dá a mesma `NAO_ENCONTRADO`. Bilhete vencido, forjado ou de outra conta é ignorado sem mudar a resposta do login.
- **Separação dos tokens:** o bilhete (`typ: convite+jwt`, `aud: sessao`) não passa por token de acesso nem por desafio.

**Logs:** limpos. Não há logger nos arquivos novos. Os comandos do operador imprimem só o id do convite e o caminho do arquivo, e os erros saem com texto fixo ou `resumirErro`, sem o valor recebido.

**Auditoria:** presente. Ficam registrados `convite.criado` (com operador e `contaNova`, sem e-mail), `convite.revogado`, `convite.aceito` e `usuario.ativado_por_convite` (com o `conviteId`). A ativação e a auditoria acontecem na mesma transação, e dois logins ao mesmo tempo ativam uma vez só.

**Envio externo:** nenhum. O link é mandado à mão pelo operador no F1.

**Seed/fixture:** sintético.

**Correção exigida na rodada anterior:** feita.
- O aceite com conta existente responde `entrar` com um bilhete de 30 min, ligado à conta e ao convite.
- Os três testes exigidos estão em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts`:
  - login da dona do e-mail sem bilhete, com A continuando inativo: linhas 379 e 426;
  - bilhete no login de outra conta, que não ativa: linha 426;
  - bilhete e conta certos, que ativam com `usuario.ativado_por_convite`: linhas 379 e 449.
- Há também casos extras: bilhete forjado, convite revogado depois do aceite, usuário desativado depois de entrar.
- A nota da 7.0 e as seções 4, 5 e 6 da Tech Spec foram atualizadas.

**Pergunta de fechamento:** o código responde. Os registros de auditoria acima reconstituem a criação do convite, a conta usada, o aceite, a ativação e a revogação, sem guardar o e-mail na auditoria. Nada foi enviado a terceiros.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Na tela do `/entrar` (tarefa de frontend), o bilhete deve ir por estado em memória ou pelo corpo, nunca por query string, para não parar em histórico nem em log de borda. Vale registrar isso como exigência na tarefa da tela, como já foi feito com a janela de 2 s da renovação.
2. Se a pessoa com conta existente aceitar o link e não entrar em 30 min, o convite fica usado e o usuário fica inativo, e só um convite novo do operador resolve. Vale uma linha no README ou no runbook explicando essa saída ao operador.
3. Quem tiver o link de uma conta existente consegue gastar o convite sem ativar nada. É só um incômodo, não um vazamento, e o reenvio pelo operador cobre. Vale registrar no `/retro`.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-18 08:03:42 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** `convite` (tem `escolaId`, id UUID e FK composta para `usuario`), `usuario` e `conta`. `conta` é global por desenho da seção 6. Nesta rodada não entrou tabela nova.

**Queries verificadas:**
- `ResolucaoDeTenantRepository.usuarioComConviteAceito(contaId, conviteId)`: tem `@SemEscopo` com justificativa, filtra por conta e por convite, só aceita convite usado e não revogado com `usado_em >= desativado_em`, e devolve só ids e papel.
- `ConviteRepository.ativarPorConvite`: a escola vem do contexto. Sem a condição `expira_em > now()`, o prazo depois do aceite passa a ser o do bilhete (30 min). O usuário desativado depois de entrar continua barrado pela condição `usado_em >= desativado_em`, e o convite revogado também fica barrado.
- `AtivacaoPorConvite.pendentePeloBilhete` e `pendenteDoConvite`: a ativação roda no contexto da escola do convite. `contaId` e `conviteId` saem de JWT que nós assinamos (bilhete ou desafio `mfa`), nunca do corpo em texto livre.
- `LoginService`: o bilhete só é conferido depois da senha certa. Bilhete inválido, forjado ou de outra conta é ignorado sem resposta diferente, então não revela nada.
- `MfaService`: ativa só depois do código e só com o `convite_id` do desafio da mesma conta.
- `BilheteDeConvite` e `desafio`: `typ` e `aud` separados, e nenhum dado da pessoa. Nenhum endpoint aceita `escolaId` de fora.

**Correções exigidas na rodada anterior:**
- Recomendação 1 (ligar a ativação à posse do link): feita.
- Recomendação 2 (seção 6 da Tech Spec citando os métodos): feita. `usuarioComConviteAceito` está na linha 261 de `tasks/prd-identidade-e-tenancy/techspec.md`, e o teste de `resolucao-de-tenant.repository.test.ts` confere a lista de métodos e as justificativas.

**Teste de isolamento:** presente e efetivo.
- `apps/api/test/convite.int.test.ts:426` quebra se o bilhete de outra conta ativar o convite, ou se o login sem bilhete ativar.
- `apps/api/test/convite.int.test.ts:461` quebra se o convite revogado depois do aceite ativar.
- `apps/api/src/sessao/convite.repository.int.test.ts:57` quebra sem o `escolaId` do contexto em `ativarPorConvite`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A regra "o bilhete de outra conta não ativa" tem duas proteções: a comparação `verificado?.contaId !== contaId` em `apps/api/src/sessao/convite.service.ts:109` e o filtro `eq(usuario.contaId, contaId)` em `apps/api/src/sessao/resolucao-de-tenant.repository.ts`. O teste de ponta a ponta só quebra se as duas forem removidas. Vale um teste de integração de `usuarioComConviteAceito` com a conta errada e o convite certo, esperando `undefined`, para o filtro do repository ter prova própria.
2. O bilhete é um JWT e qualquer um lê o conteúdo sem a chave. Quem aceita o link recebe nele o `conta_id` da dona do e-mail, o que importa quando o operador digitou o e-mail errado. Não vaza dado pessoal, e a etapa `entrar` já revela que a conta existe. Se quiserem esconder o id da conta, dá para assinar só o `convite_id` e resolver a conta no servidor.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-18 08:03:48 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. O `conferir` respondeu "portão local válido para o código atual (typecheck, lint, test)".
Bloqueantes: nenhum

**Correções exigidas antes desta rodada**
- **Portão local da 1ª rodada:** resolvido. O carimbo vale para a árvore atual.
- **Exigência do `privacy-guardian`:** a ativação por convite agora depende de quem tem o link. O login só ativa o usuário que espera o convite com duas condições juntas: o bilhete precisa conferir com a conta que provou a senha, em `apps/api/src/sessao/convite.service.ts:175-179`; e a credencial precisa estar completa. Numa conta com MFA, a ativação acontece só em `apps/api/src/sessao/mfa.service.ts:117-118`, depois do código, com o `convite_id` levado no desafio assinado.
- **Recomendações que fiz na rodada anterior:** as três foram feitas. A ativação sem MFA vem antes da contagem de usuários e, se não sobra usuário, cai no caminho de falha com registro e contador. O `expira_em` saiu da ativação e o prazo passou a ser o do bilhete. `convite.criado` ganhou `contaNova`.
- **Alterações de texto:** a Tech Spec foi atualizada nas seções 4, 5 e 6, junto com a contagem de `@SemEscopo`, e a nota de implementação registra a contradição resolvida. O cenário de `acessos` foi para a 12.0, com o motivo escrito. Nenhuma divergência ficou sem registro.

Recomendações:
- **Senha curta de quem já tem conta:** em `packages/shared/src/sessao/convite.ts`, o `senha` com mínimo de 12 vale também para a conta que já tem senha. Nesse caminho a senha é ignorada. Mesmo assim, uma senha curta enviada ali recebe `ENTRADA_INVALIDA` em vez de `entrar`. O comportamento fica diferente do caminho ignorado, embora a web da 19.0 não deva mandar senha nesse caso. Vale anotar para a 19.0.
- **Quebra de linha em `apps/api/src/sessao/mfa.service.ts:49`:** o item "Fim" do comentário da classe passou da largura em que os outros quebram. É só formatação.

Arquivos centrais da revisão:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/bilhete-de-convite.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/7_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/techspec.md`

## revisor-geral · 2ª rodada · SEM VEREDITO · 2026-09-18 08:04:52 · `tasks/prd-identidade-e-tenancy/6_task.md`

Pode ignorar esse aviso: quem falhou foi só o comando que eu tinha deixado rodando para esperar o portão terminar. O portão em si terminou verde, e o `conferir` que rodei depois respondeu "portão local válido para o código atual (typecheck, lint, test, infra)".

O veredito continua **APROVADO**, sem bloqueantes, e as recomendações não mudam.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 10:03:10 · `tasks/prd-identidade-e-tenancy/8_task.md`

VEREDITO: REPROVADO

Rodei os 18 testes de integração da tarefa (`npx vitest run --project integracao apps/api/test/estrutura`) e todos passaram. Depois conferi cada cenário perguntando se o teste falharia caso a regra saísse do código.

**Cenários exigidos:**
- Caminho feliz (RF2) e paginação.
- Recorte da D43 na rota e no banco.
- Série, disciplina e ano repetidos dão `CONFLITO` sem o valor na resposta, inclusive com dois pedidos em paralelo.
- Dois `abrir` em paralelo em anos diferentes deixam um só ano em curso.
- Segundo clique em `abrir` e em `encerrar`.
- Virada de ano: "7ºA" em 2026 e em 2027 coexistem, e "7ºA" e "7ºa" conflitam no mesmo ano.
- Escola sem ano em curso: turma falha fechada, e criar e abrir ano funcionam.
- Ano encerrado não aceita turma nova, nem numa corrida com o encerramento.
- Permissão: professor e aluno não usam nenhuma rota de estrutura.
- Isolamento: `abrir` e `encerrar` com id de B, série de B, ano de B ou de outro ano letivo, e listagens sem B.
- **FK composta de `turma` impedindo série ou ano de outra escola** (subtarefa 8.1 e coluna "O que prova" da tabela de testes).

**Cobertos:** todos os itens acima, menos o último. Pelo que conferi à mão:
- Tirar a cláusula de escola de `AnoLetivoRepository.mudarSituacao` ou de `porId` faz o teste de isolamento de `abrir`/`encerrar` voltar 200 ou 409 no lugar de 404, e ele fica vermelho.
- Tirar a cláusula de escola dos `listar` de ano, série e disciplina faz a listagem trazer linhas de B, e o teste fica vermelho.
- Tirar a cláusula de ano de `TurmaRepository.listar` quebra o teste do "7ºA" em estrutura.int.test.ts:249.
- Tirar o índice único parcial deixa dois anos em curso, e o teste de concorrência fica vermelho.
- Os testes de concorrência usam `Promise.all` de verdade. A trava `FOR SHARE` é provada com uma transação aberta em paralelo e espera pelo lock.
- Não há `.skip`, nem teste comentado, nem mock de coisa nossa. A tarefa não chama IA.

**Bloqueantes:**

1. **As FKs compostas `turma_serie_da_escola_fk` e `turma_ano_letivo_da_escola_fk` não têm teste que prove que existem** (packages/nucleo/drizzle/0009_serie_disciplina_turma.sql, as linhas `ALTER TABLE "turma" ADD CONSTRAINT ... _da_escola_fk`; packages/nucleo/src/db/schema/turma.ts:36-37).
   - O teste de isolamento da série de B (apps/api/test/estrutura-isolamento.int.test.ts:91) e o do ano de B (:104) param antes, no serviço. O primeiro para em `SerieRepository.porId`, o segundo na comparação com o ano do contexto em turma.service.ts:29. Nenhum dos dois pedidos chega ao banco.
   - Resultado: se a migration trocar as FKs compostas por uma FK simples (`serie_id → serie.id`) ou não tiver FK nenhuma, os 18 testes continuam verdes.
   - A sua mutação à mão mostrou o efeito da FK (500 no lugar de 404), mas isso não ficou gravado em teste.
   - A tabela da tarefa diz que esses testes provam "FK composta e escopo do repository", e hoje só o escopo está provado.
   - **Correção exigida:** um teste de banco no mesmo formato do de `serie_no_recorte` (estrutura.int.test.ts:126-141). Com um `pg.Client` direto, inserir em `turma` com `escola_id` de A:
     - uma linha com `serie_id` de B, esperando `{ codigo: '23503', restricao: 'turma_serie_da_escola_fk' }`;
     - uma linha com `ano_letivo_id` de B, esperando `{ codigo: '23503', restricao: 'turma_ano_letivo_da_escola_fk' }`.

     Os dois ficam vermelhos se a FK composta sair ou virar simples.

**Recomendações (não bloqueiam):**
- O `expect.poll` do teste de concorrência (estrutura.int.test.ts:301-308) usa o prazo padrão do Vitest (1 s). Com a esteira carregada ele pode falhar sem motivo real. Vale passar `{ timeout: 5000 }`.
- Faltam os checks `turma_turno_valido`, `disciplina_area_valida`, `turma_nome_preenchido` e `disciplina_nome_preenchido`, na rota (turno ou área fora da lista dá `ENTRADA_INVALIDA`) e no banco.
- "Turma escrita de três jeitos": hoje só maiúscula e minúscula estão cobertas. Vale incluir espaço nas pontas (`" 7ºA "` contra `"7ºA"`, que o `trim` do contrato faz conflitar) e registrar que `"7º A"` e `"7A"` são turmas diferentes por decisão.
- O teste de permissão cobre professor e aluno, mas não o papel `rede`. A matriz já diz `nunca` para ele, e um caso na rota ao menos em `GET /v1/turmas` fecharia a regra 10, item 8, no módulo.
- O teste de isolamento das listagens (estrutura-isolamento.int.test.ts:121) só pega vazamento no `listar` de turmas se a cláusula de escola e a de ano saírem juntas. A própria nota da implementação diz isso, e o teste do "7ºA" cobre a cláusula de ano. Vale um comentário no teste apontando para lá.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/estrutura.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/estrutura-isolamento.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/ (repositories, services, controllers, entrada.ts)
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0009_serie_disciplina_turma.sql
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz.ts e matriz.expectativa.ts

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 10:09:26 · `tasks/prd-identidade-e-tenancy/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos (rodada 2):** a única correção pedida na 1ª rodada. É um teste que acessa o banco direto e prova que as FKs compostas `turma_serie_da_escola_fk` e `turma_ano_letivo_da_escola_fk` existem e barram cada caso.

**Cobertos:**
- **A correção exigida foi feita.** Está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/estrutura-isolamento.int.test.ts:123-143`.
  - O teste usa `pg.Client` direto, sem passar pela rota.
  - Primeiro insere uma turma com `escola_id` de A, o ano de A e a série de B, e espera `{ codigo: '23503', restricao: 'turma_serie_da_escola_fk' }`.
  - Depois insere com o ano de B e a série de A, e espera `{ codigo: '23503', restricao: 'turma_ano_letivo_da_escola_fk' }`.
  - Em cada inserção só uma das duas FKs é violada, então o nome da restrição esperado é o certo, sem ambiguidade.
  - Se a inserção passar, o `then(() => undefined)` faz o `toEqual` falhar. Ou seja, o teste falha se qualquer uma das FKs for removida da migration `0009_serie_disciplina_turma.sql:40-41`.
  - A contagem de `'8ºFK'` igual a 0 nas duas escolas confirma que nenhuma linha ficou gravada.
  - O cliente é fechado no `finally`.
- **Recomendações aplicadas em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/estrutura.int.test.ts`:**
  - Linhas 237-240: "7ºa" e " 7ºA " agora dão CONFLITO com "7ºA".
  - Linhas 256-293: turno e área fora da lista, e nome vazio, dão ENTRADA_INVALIDA na rota. Os checks `turma_turno_valido`, `turma_nome_preenchido`, `disciplina_area_valida` e `disciplina_nome_preenchido` são provados pelo código `23514` e pelo nome de cada restrição. Os nomes conferem com a migration (linhas 10, 11, 33 e 34). A contagem final igual a 0 confirma que nada foi gravado.
  - Linha 352: o `expect.poll` ganhou `timeout: 5_000`.
- Não há `.skip`, `.only` nem `todo` nos dois arquivos.
- O que não mudou desde a 1ª rodada não foi reauditado.

**Bloqueantes:** nenhum.

**Recomendações:**
- O papel `rede` fica sem teste na rota porque não existe usuário desse papel no F1; por enquanto só a matriz cobre. Deixar registrado para o `/validar`: quando o papel `rede` tiver usuário, entra um teste de rota provando que a rede só alcança agregado (regra 10, item 8).

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 10:15:28 · `tasks/prd-identidade-e-tenancy/8_task.md`

```
VEREDITO: APROVADO
Tabelas verificadas: serie, disciplina, turma (migration 0009), ano_letivo (unique (escola_id, ano) acrescentado)
Queries verificadas: AnoLetivoRepository.criar/listar/porId/mudarSituacao; SerieRepository.criar/listar/porId; DisciplinaRepository.criar/listar; TurmaRepository.travarAnoEmCurso/criar/listar
Teste de isolamento: presente e efetivo
Bloqueantes: nenhum
Recomendações:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts:29: a conferência do anoLetivoId que vem no corpo fica no service. Hoje não é furo: o ano gravado sai do contexto, no repository (turma.repository.ts:44), e o valor do corpo só serve para recusar. Mesmo assim, vale um comentário no contrato dizendo que esse campo nunca pode chegar ao repository, para ninguém ligá-lo ao insert depois.
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts:57: se a cláusula de escola sair da listagem de turmas, nenhum teste quebra. Quem segura o isolamento é o filtro por anoLetivoId, e a nota da tarefa já registra isso. Se a 9.0 ou a 10.0 criar uma listagem por ano que não seja o em curso, ela precisa de um teste com linhas de B no mesmo formato.
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/contexto/escola-do-contexto.ts: as seis cópias locais de escolaDoContexto em outros módulos ficaram. Uma tarefa de correção deve levá-las para exigirEscolaDoContexto(), para o escopo ter uma fonte só.
```

A verificação cobriu os 8 itens:

- **Tabelas (itens 1 e 6):** as três tabelas novas têm escola_id NOT NULL e id UUIDv7. A turma tem ano_letivo_id e FKs compostas (escola_id, serie_id) e (escola_id, ano_letivo_id).
- **Repositories (item 2):** todos tiram a escola de exigirEscolaDoContexto() e o ano de exigirAnoEmCurso(). O ano no contexto vem da linha da sessão no banco, não do cliente.
- **Entrada (item 3):** os contratos zod são `.strict()` e nenhum aceita escolaId, nem no corpo nem na query.
- **Remoção mental das cláusulas (item 4):**
  - Sem a cláusula de escola, `abrir` com o id de B esbarra no índice parcial e dá 409, e `encerrar` responde 200. O teste espera 404, então quebra.
  - Sem a cláusula de escola em SerieRepository.porId, a série de B passa. A FK composta recusa, e o mapeamento transforma isso em ERRO_INTERNO (500). O teste espera 404, então quebra.
  - Sem a cláusula de escola, as listagens de anos, séries e disciplinas passam a trazer as linhas de B, e o teste quebra.
- **404 igual (item 5):** o id de B, o id inexistente e o id fora do formato dão a mesma resposta 404 NAO_ENCONTRADO, com a mesma mensagem. O teste compara as três.
- **Itens 7 e 8:** não se aplicam. A tarefa não tem consulta da camada rede nem `@SemEscopo()`.

Rodei `npx vitest run --project integracao apps/api/test/estrutura-isolamento.int.test.ts`: 6 de 6 passaram.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 10:15:30 · `tasks/prd-identidade-e-tenancy/8_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test)")
Bloqueantes: nenhum

Três pontos vão além da Tech Spec original, mas não foram decididos em silêncio. Estão registrados em "Notas da implementação" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/8_task.md` e já entraram nas seções 3 e 4 da `techspec.md`:
- a ação `turma.listar` na matriz;
- `unique (escola_id, ano)` em `ano_letivo`;
- o `anoLetivoId?` do corpo da turma, que só confere.

Os três protegem mais do que o desenho original e não invadem a 9.0 nem a 10.0:
- `turma.ler` do professor segue `turma_vinculada`, para a 9.0.
- `encerrar` não mexe em vínculo.

Recomendações:
- **Dois nomes para a mesma coisa.** `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/ano-letivo.ts:7-8` deixa `SITUACOES_DE_ANO_LETIVO` e `SituacaoDeAnoLetivo` como apelidos de `SITUACOES_DO_ANO_LETIVO` e `SituacaoDoAnoLetivo`, e `packages/nucleo/src/index.ts:148-149` ainda os exporta. Ninguém fora do schema usa os apelidos. Remova-os e use o nome do `@educa/shared`.
- **Lista de áreas e de turnos em dois lugares.** Os checks `disciplina_area_valida` (`disciplina.ts:29-31`) e `turma_turno_valido` (`turma.ts:39`) digitam de novo as listas que já estão em `AREAS_DO_CONHECIMENTO` e `TURNOS`. Se alguém mudar a lista no `shared`, o banco diverge sem nada acusar. Vale gerar o `in (...)` a partir da constante, ou ter um teste que compare as duas.
- **Mesma responsabilidade em dois arquivos do módulo.** `EscolaSessaoRepository` (`apps/api/src/estrutura/escola-sessao.repository.ts:10`) ainda tem seu próprio `escolaDoContexto()`, e os repositories novos, no mesmo módulo, usam `exigirEscolaDoContexto()`. A nota da tarefa deixa as seis cópias antigas fora do escopo. Anote a troca em `TODO.md` ou numa correção, para não sobrar um terceiro jeito de fazer isso.
- **Regra do corpo no service.** `turma.service.ts:29` compara o `anoLetivoId` do corpo com o ano em curso fora da transação. Está correto, porque a trava `FOR SHARE` da linha 32 cobre a corrida. Mas o motivo de a checagem ficar ali só aparece no comentário da classe. Uma função pequena com nome próprio, algo como `conferirAnoDoCorpo`, deixaria isso legível.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 10:38:50 · `tasks/prd-identidade-e-tenancy/9_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: um professor com Química e Física no 2ºB confirma uma e contesta a outra.
- Com vínculo pendente ou contestado, a turma e `/alunos` dão 404 igual ao inexistente. Com vínculo confirmado, respondem com o dado.
- Vínculo encerrado com a sessão aberta.
- Clique duplo em confirmar, com as duas chamadas em paralelo.
- O mesmo vínculo criado duas vezes em paralelo.
- Permissões: turma sem professor, professor de outra turma, professor criando vínculo, professor confirmando o vínculo de um colega.
- Privacidade: `finalidade` obrigatória com auditoria e paginação, e o `complemento` fora de `meus-vinculos`, da auditoria e do log.
- Isolamento: ids de B na criação, em `vinculos/:id/*` e em `turmas/:id`, e as listagens sem nada de B.
- Professor que sai em março da escola A.
- Casos de borda do domínio que valem aqui: professor com duas disciplinas na mesma turma, turma sem professor, aluno transferido no meio do bimestre (vínculo de aluno encerrado não aparece mais na turma).

**Cobertos** (rodei os dois arquivos: 23/23 verdes):
- Caminho feliz, com estado, autor, data e auditoria de cada vínculo: `vinculo.int.test.ts:76`.
- Pendente e contestado dão o mesmo 404 do inexistente, e o confirmado responde: `turma-acesso.int.test.ts:59`. O teste quebraria sem o `exists` e sem o filtro de estado. O filtro de papel é provado em `:107`.
- Corte na requisição seguinte com o mesmo token: `turma-acesso.int.test.ts:90`.
- Clique duplo em confirmar com `Promise.all`: `vinculo.int.test.ts:196`. Sem o `FOR UPDATE`, o segundo pedido daria 409, e sem o `update` condicional haveria duas auditorias. Nos dois casos o teste fica vermelho.
- Clique duplo em encerrar, em paralelo: `vinculo.int.test.ts:257`.
- Criação em paralelo, com e sem disciplina (o `coalesce` do índice): `vinculo.int.test.ts:210`.
- Permissões: `vinculo.int.test.ts:318` e `:343`, e `turma-acesso.int.test.ts:121`.
- Privacidade:
  - `finalidade` com auditoria e paginação: `turma-acesso.int.test.ts:141`.
  - `complemento` fora de `meus-vinculos`: `vinculo.int.test.ts:165`.
  - `complemento` fora do log real e da auditoria: `vinculo.int.test.ts:360`. O log passa pelo `LoggerDoNest`, então a captura é real.
- Isolamento:
  - Pela API: `turma-acesso.int.test.ts:205`, `:231` e `:255`.
  - Repository com contexto forjado e um controle positivo: `turma-acesso.int.test.ts:264`.
  - FKs compostas no banco: `turma-acesso.int.test.ts:320`.
- Saída em março: `turma-acesso.int.test.ts:352`.
- Sem ano em curso, em criar, listar e `meus-vinculos`: `vinculo.int.test.ts:305`.
- Não há `.skip`, `.only`, teste comentado nem mock de código nosso. A tarefa não chama IA.

**Bloqueantes:**

1. **O filtro de turma na lista de alunos não tem teste. É vazamento de aluno para professor de outra turma** (regra 20, item 5; regra 10, item 5).
   - `apps/api/src/estrutura/turma.repository.ts:124` (`eq(vinculo.turmaId, turmaId)`): se essa cláusula for apagada, todos os testes continuam verdes.
   - Em nenhum teste existem alunos em duas turmas da mesma escola ao mesmo tempo:
     - `turma-acesso.int.test.ts:61`, `:143` e `:185` põem alunos só no 2ºB.
     - `:123` põe alunos só no 2ºC.
   - Sem essa cláusula, o professor confirmado no 2ºB receberia os alunos do 2ºC, e o teste não perceberia.
   - Correção exigida: num teste de `/alunos`, pôr alunos no 2ºB e no 2ºC. Depois, afirmar a lista exata em dois casos:
     - para o professor confirmado no 2ºB;
     - para a coordenação lendo o 2ºC.
   - Nenhum aluno da outra turma pode aparecer.

2. **O filtro de estado do vínculo de aluno não tem teste. É o caso do aluno transferido no meio do bimestre** (caso de borda do domínio; regra 20, item 18).
   - `apps/api/src/estrutura/turma.repository.ts:126` (`eq(vinculo.estado, 'confirmado')`): se essa cláusula for apagada, todos os testes continuam verdes.
   - O helper `escola-com-turma.ts:46` só cria vínculo de aluno `confirmado`.
   - O teste de `turma-acesso.int.test.ts:144` cobre só o usuário desativado. Ele não cobre o vínculo encerrado com o usuário ativo, que é a transferência de turma dentro da mesma escola.
   - Correção exigida: acrescentar um aluno ativo com vínculo `encerrado` (motivo `realocacao`) e outro com vínculo `pendente` na turma. Afirmar que nenhum dos dois aparece em `/alunos`, nem para a coordenação nem para o professor confirmado.

**Recomendações** (não bloqueiam):
- Sem ano em curso, as rotas de ler a turma, `/alunos`, confirmar, contestar e encerrar não têm teste. As notas da implementação dizem que todas falham fechadas, mas o teste de `vinculo.int.test.ts:305` cobre só criar, listar e `meus-vinculos`.
- Esse mesmo teste afirma só o status. Vale conferir também o código `NAO_ENCONTRADO`, como os outros testes fazem.
- Clique duplo em contestar gera duas escritas e duas auditorias, porque contestar de novo um contestado é permitido. Vale decidir se isso é o esperado e cobrir com duas chamadas em paralelo.
- A paginação de `GET /v1/vinculos` da coordenação não tem teste. Só a de `meus-vinculos` e a de `/alunos` têm.
- Falta um caso explícito de professor com duas disciplinas em que uma é encerrada e a outra continua confirmada. O esperado é que ele continue lendo a turma.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/vinculo.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/turma-acesso.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-com-turma.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0010_vinculo.sql`

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 10:49:30 · `tasks/prd-identidade-e-tenancy/9_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test)")
Bloqueantes: nenhum

Nada bloqueia. As subtarefas 9.1 a 9.3 estão feitas e cada cenário da tabela de testes tem um teste. Não há `.skip`, `TODO` nem `any` para calar o compilador. O que a tarefa manda para depois ficou de fora: `fim_do_ano` e `?anoLetivoId` são da 10.0, a tela é da 20.0.

A Tech Spec diverge da seção 4 em dois pontos, e nenhum foi decidido em silêncio. A seção foi alterada na mesma árvore e a mudança está justificada em "Notas da implementação":
- a coordenação recebe também `usuarioId`, `papel`, `complemento?` e `motivoEncerramento?`;
- `papel` aceita só `professor` no F1;
- a `finalidade` da leitura de alunos vira uma lista fixa de códigos.

Recomendações:
- **Duas formas de ler a entrada.** A nova `lerEntrada` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/entrada.ts`) faz o mesmo que o `safeParse` escrito à mão em `turma.controller.ts` (`criar`) e que `lerConsultaPaginada`. Vale deixar um jeito só no módulo `estrutura`, fazendo `criar` e `lerConsultaPaginada` usarem `lerEntrada`.
- **`alcanceDe` chamado duas vezes.** Em `TurmaService.alunos` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts`), ele é chamado direto (`nominalAuditado`) e de novo dentro de `alcanceDaTurma`. Tirar as duas coisas de uma única leitura da célula deixa o critério mais fácil de ler.
- **Enum de auditoria largo demais.** Em `vinculo.encerrado` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts`), `antes.estado` aceita `ESTADOS_DE_VINCULO` inteiro, mas `encerrado` nunca chega ali. Um enum sem esse valor fecha melhor o que a ação registra.
- **Contestar duas vezes grava duas auditorias.** Contestar de novo um vínculo já contestado grava outra auditoria `contestado → contestado`. É o comportamento descrito nas notas; só confirme que é o desejado para o histórico da coordenação.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 10:49:31 · `tasks/prd-identidade-e-tenancy/9_task.md`

VEREDITO: APROVADO

Tabelas verificadas:
- `vinculo`, em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0010_vinculo.sql` e `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/vinculo.ts`.
  - Tem `escola_id` e `ano_letivo_id`, os dois obrigatórios.
  - O id é UUID (`uuidv7()`).
  - Todas as FKs compostas levam a escola: turma por `(escola_id, ano_letivo_id, turma_id)`, e usuário, disciplina e `criado_por` por `(escola_id, …)`.
  - O índice único parcial e os dois índices começam por `escola_id, ano_letivo_id`.
  - A FK de disciplina é composta e anulável, e assim não é conferida quando a disciplina é nula. Não há buraco: a disciplina nula não aponta para outra escola.

Queries verificadas:
- `VinculoRepository`: `criar`, `pessoaAtivaComPapel`, `listar`, `listarDoUsuario`, `porId`, `porIdDoUsuario`, `travar`, `decidir`, `encerrar` e `#lerComReferencias`.
  - Escola e ano vêm de `exigirEscolaDoContexto()` e `exigirAnoEmCurso()`, e o usuário vem de `sessaoDaRequisicao()`. Nada vem de argumento.
  - Os joins de turma e disciplina são correlacionados pela escola do vínculo.
- `TurmaRepository.aberta`: escola e ano do contexto. No caso do professor, o `exists` exige vínculo `confirmado` de professor, correlacionado com escola, ano e turma, para o usuário do contexto.
- `TurmaRepository.alunos`: escola e ano do contexto, com o join de usuário pela escola.
- `DisciplinaRepository.porId`: escola do contexto.
- Nenhuma entrada aceita `escolaId`. Os corpos de `POST /v1/vinculos`, `contestar` e `encerrar` e a query de `/alunos` usam esquemas `.strict()`.
- Todo caminho sem acesso responde o mesmo `NAO_ENCONTRADO`: id de outra escola, de outro professor, inexistente, sem ano em curso, e vínculo pendente, contestado ou encerrado. A falta de `finalidade` é conferida antes de procurar a turma, então não revela se a turma existe.
- Camada rede: `turma.ler`, `aluno_da_turma.ler` e `vinculo.*` estão em `nunca` na `MATRIZ`. O `alcanceDaTurma` também falha fechado com 404 para qualquer alcance fora de `unidade`, `nominal_auditado` e `turma_vinculada`.
- `@SemEscopo()`: nenhum uso novo.

Teste de isolamento: presente e efetivo.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/turma-acesso.int.test.ts:318`, o teste monta um contexto forjado (escola A com o ano e o professor de B). Assim, só a cláusula de escola separa as duas escolas.
- Tirar essa cláusula de `aberta`, `alunos`, `#escopo`, `pessoaAtivaComPapel` ou `DisciplinaRepository.porId` faria o repository trazer a linha de B, e o teste quebraria.
- O controle com a escola de B (linha 366) prova que o vazio veio da escola, e não de dado ausente.
- Os testes pela API (linhas 259, 285, 309 e 406) e o teste das FKs compostas (linha 374) cobrem a tabela de isolamento da tarefa.

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`: `alunos()` não confere por conta própria quem pede e depende de o service chamar `aberta` antes, na mesma transação. Hoje está correto. Vale fazer `alunos` receber o `AlcanceDaTurma` e aplicar o mesmo `exists` do vínculo confirmado, para que um uso futuro do repository sem `aberta` não abra a lista a professor sem vínculo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`: o join de disciplina em `#lerComReferencias` correlaciona só pela escola. Está correto hoje, porque a disciplina não tem ano. Se a disciplina passar a variar por ano letivo, esse join precisa ganhar `ano_letivo_id`.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 11:08:02 · `tasks/prd-identidade-e-tenancy/10_task.md`

VEREDITO: REPROVADO

Cenários exigidos:
1. Caminho feliz da virada: confirmado, pendente, contestado e vínculos de aluno vão a `encerrado` por `fim_do_ano`, e todo `complemento` é apagado. O teste confere a coluna no banco (10.4, complemento).
2. Borda: uma falha forçada no meio da virada desfaz tudo. O ano continua `em_curso` e os vínculos ficam intactos.
3. Concorrência: dois `encerrar` em paralelo fazem uma virada só, com uma auditoria.
4. Caminho feliz do histórico: o professor que continua na escola lê a turma e os alunos de 2026, e toda escrita com esse ano é recusada.
5. Borda: professor com `desligamento` ou `realocacao` recebe 404 igual ao do inexistente.
6. Borda: `fim_do_ano` no 2ºB não abre o 2ºC. Vínculo pendente ou contestado que virou `fim_do_ano` não abre nada.
7. Borda: aluno transferido em maio não aparece na lista do ano encerrado.
8. Permissão: a coordenação lê sem vínculo, com finalidade e auditoria em `/alunos`. O aluno com `?anoLetivoId` é recusado.
9. Isolamento: `anoLetivoId` de B dá o mesmo 404 do inexistente. O ano de A em curso ou planejado também dá 404. O escopo de escola, sozinho, segura `virarAno` e `aberta`/`alunos` com contexto forjado.
10. Privacidade: a auditoria da virada guarda só contagens, sem texto livre e sem id de pessoa.
11. 10.4: `GET /v1/vinculos` traz só vínculo de professor. O vínculo de aluno pedido por id dá o 404 do inexistente.

Cobertos: 1, 2, 3, 5, 6, 7, 8, 9, 10 e 11. O 4 está coberto só na metade da leitura.
- Os testes de isolamento têm controle positivo, então quebrariam se a cláusula de escola fosse retirada.
- O teste de atomicidade usa um gatilho real na tabela `auditoria`.
- O clique duplo roda com `Promise.all`, em paralelo de verdade.
- Não há `.skip`, nem mock de código nosso, e nenhuma chamada de IA.

Bloqueantes:
- `apps/api/test/historico.int.test.ts:133-153`: o teste "só leitura: toda escrita no ano encerrado é recusada" não falharia se a regra fosse removida.
  - **Por quê:** ele roda logo depois da virada, quando a escola ainda não tem nenhum ano em curso. Nesse estado, qualquer rota de escrita cai em `exigirAnoEmCurso()` e responde `NAO_ENCONTRADO` antes de olhar o `anoLetivoId`, qualquer que seja o valor dele. Em `POST /v1/turmas`, `apps/api/src/estrutura/turma.service.ts:49` lança o erro antes da comparação da linha 50. Assim, apagar a checagem da linha 50, ou fazer as rotas de vínculo respeitarem o `?anoLetivoId`, deixaria o teste verde.
  - **O caso que importa não está testado:** janeiro, com 2027 já aberto e alguém escrevendo sobre 2026.
  - **Correção exigida:** repetir as recusas com um ano em curso aberto (2027), num estado próprio do teste e não herdado do teste de `:203`. Para cada chamada, conferir a resposta 404 e que nada mudou no banco:
    - `POST /v1/turmas` com `anoLetivoId` de 2026;
    - `POST /v1/vinculos` para a turma de 2026;
    - `confirmar`, `contestar` e `encerrar` sobre o vínculo de 2026.

  Hoje também há dependência de ordem: o teste de `:203` abre 2027 no `escola` compartilhado, e a prova do teste de `:133` depende de rodar antes dele. A correção precisa tirar essa dependência.

Recomendações:
- **Duas disciplinas na mesma turma:** acrescentar em `historico.int.test.ts` o professor com dois vínculos no 2ºB, um encerrado por `desligamento` (física) e outro por `fim_do_ano` (química). Ele deve ler. E o caso inverso: só `realocacao` em uma disciplina e nada na outra, que deve dar 404. Isso prova que o `exists` escolhe o vínculo válido, e não o primeiro que encontra.
- **Encerrar e contestar ao mesmo tempo:** um teste de concorrência de `encerrar` em paralelo com `contestar`, com complemento, no mesmo ano. Ele deve conferir que, ao final, nenhum `complemento` sobra no banco. Pela leitura do código a corrida é segura, porque o segundo `update` relê a linha já gravada, mas hoje não há teste que prove isso.
- **Vínculo de aluno pelas outras rotas (10.4):** `apps/api/test/vinculo.int.test.ts:331-353` cobre só `encerrar` por id. Vale acrescentar `confirmar` e `contestar` (e `GET /v1/vinculos/:id`, se existir) sobre o vínculo de aluno, todos dando o 404 do inexistente.
- **Status explícito:** em `historico.int.test.ts:182`, falta `expect(turma.status).toBe(200)` antes da comparação do corpo, para que a falha apareça com a mensagem certa.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/historico.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/virada-do-ano.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/vinculo.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/ano-letivo.service.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 11:23:27 · `tasks/prd-identidade-e-tenancy/10_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- **Correção da 1ª rodada (só leitura):** com 2027 já em curso e num estado próprio do teste, cinco escritas sobre 2026 são recusadas com 404 e nada muda no banco. As cinco são criar turma com o ano de 2026, criar vínculo na turma de 2026, e confirmar, contestar e encerrar o vínculo de 2026. O teste não pode depender da ordem de execução.
- **Recomendações que você aplicou:** o professor com duas disciplinas no 2ºB, e o status explícito no teste de permissão da coordenação.
- **Concorrência nova:** encerrar o ano ao mesmo tempo em que um professor contesta com texto.

Cobertos:
- **Correção exigida, feita.** O teste está em `apps/api/test/historico.int.test.ts:142-170`. Ele monta a própria escola (`montar()`), cria e abre 2027, e só então faz as cinco escritas. Cada uma exige `NAO_ENCONTRADO`, e as contagens de turma, vínculo e auditoria são comparadas antes e depois. Não depende mais da ordem dos testes. Conferi, com `apps/api/src/estrutura/vinculo.service.ts` aberto, que cada recusa ficaria vermelha se a regra do ano saísse:
  - **Criar vínculo:** sem o escopo do ano, `turmas.aberta` acharia a turma de 2026 e o vínculo nasceria com 201.
  - **Confirmar e contestar:** sem o escopo, `travar` acharia o vínculo encerrado e `#decidir` devolveria 409 `CONFLITO`, não 404.
  - **Encerrar:** sem o escopo, encerrar um vínculo já encerrado responde 200 (o caminho do segundo clique), não 404.
  - **Criar turma:** você conferiu à mão que apagar a comparação em `turma.service.ts` deixa o teste vermelho.
  
  O controle (a mesma turma sem o ano nasce em 2027, e o histórico continua sendo lido) prova que o 404 vem da regra, e não de a escrita estar travada de modo geral.
- **Duas disciplinas.** O teste está em `historico.int.test.ts:172-177`: Física encerrada por `desligamento` e Química até `fim_do_ano`. Ele falharia se a regra passasse a exigir que todo vínculo do professor tivesse chegado ao fim do ano. Se a leitura dos alunos der 404, `ids()` quebra, então o teste não passa em silêncio.
- **Concorrência encerrar com contestar.** O teste está em `virada-do-ano.int.test.ts:209-223`. É concorrência de verdade (`Promise.all`), e a asserção olha o banco: todo vínculo do ano encerrado e sem `complemento`.
- **Recusa do item 10.4, que você não aplicou:** a justificativa está certa. O 404 viria da cláusula de dono do vínculo, e não provaria o filtro de papel.

Bloqueantes: nenhum.

Recomendações:
- `virada-do-ano.int.test.ts:209-223`: o resultado da corrida muda a cada execução, então numa rodada só o teste pode cair sempre na mesma ordem e não exercitar a ordem que quebraria. Uma variante determinística ajudaria: segurar um `FOR UPDATE` no vínculo por uma conexão da bancada enquanto o encerramento roda, ou repetir a corrida algumas vezes.
- `historico.int.test.ts:154-157`: a query `?anoLetivoId` nos POST de vínculo não altera o resultado. Um comentário dizendo que o parâmetro é ignorado (e não que foi rejeitado) evitaria que alguém lesse ali uma regra que não existe.
- Não rodei os testes: confiei no portão local verde que você relatou.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/historico.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/virada-do-ano.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 11:33:47 · `tasks/prd-identidade-e-tenancy/10_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** nenhuma tabela nova e nenhuma migration nesta tarefa. `vinculo`, `turma` e `ano_letivo` já têm `escolaId` e `anoLetivoId` onde precisam (`ano_letivo` só tem `escolaId`). Os ids continuam UUID, e o `?anoLetivoId` novo é validado com `z.uuid()`.

**Queries verificadas:**
- `AnoLetivoRepository.mudarSituacao` e `porId`: filtram pela escola do contexto. O ano que vai para `virarAno` é o que esse `update` condicional acabou de devolver, na mesma transação.
- `VinculoRepository.virarAno` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts:168`): a escola vem do contexto. O `anoLetivoId` é interno, nunca do cliente.
- `VinculoRepository.#escopo`: escola e ano em curso do contexto, mais `papel = 'professor'`. O vínculo de aluno responde o mesmo 404 do inexistente (10.4).
- `TurmaRepository.aberta` e `#doAnoDaLeitura`: a escola vem do contexto. O `?anoLetivoId` do cliente só restringe a leitura: a turma tem que ser desse ano, e o ano tem que existir na escola da turma e estar `encerrado`.
- `TurmaRepository.#comVinculoDoProfessor`: o vínculo é procurado pela escola, pelo ano e pelo id da turma, e o usuário vem da sessão.
- `TurmaRepository.alunos`: escola do contexto, e ano só depois de `aberta` confirmar, na mesma transação.
- Escrita com `anoLetivoId`:
  - `POST /v1/vinculos` recusa o campo no corpo, pelo esquema estrito.
  - As rotas de vínculo ignoram o campo na query e continuam no ano em curso.
  - `POST /v1/turmas` já respondia 404 para ano que não está em curso.
- Mensagens de erro: o ano de B, o ano em curso, o planejado, o inexistente e o de outra turma respondem todos o mesmo `NAO_ENCONTRADO`, e os testes comparam as respostas entre si.
- `@SemEscopo()` não aparece no código novo. Nenhuma consulta de rede foi tocada.

**Teste de isolamento:** presente e efetivo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/historico.int.test.ts:279`: repassei a remoção cláusula por cláusula. Um contexto forjado de A recebe a turma, o ano e o professor de B, e a mesma chamada com a escola de B serve de controle.
  - Sem `turma.escolaId = contexto`, `aberta` devolveria a turma de B, porque o `exists` do ano compara com a escola da própria turma, não com a do contexto. O teste quebra.
  - Sem `vinculo.escolaId = contexto` em `alunos`, voltariam os alunos de B. O teste quebra.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/virada-do-ano.int.test.ts:247`: sem a escola do contexto em `virarAno`, a contagem sai diferente de zero e os vínculos de B mudam. O teste quebra.
- `historico.int.test.ts:262` e `virada-do-ano.int.test.ts:234` cobrem o mesmo pela HTTP: o ano de B, e o id do ano de B em `encerrar`, respondem igual ao inexistente.

**Bloqueantes:** nenhum.

**Recomendações:**
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts:181`: no `exists`, comparar `anoLetivo.escolaId` com `exigirEscolaDoContexto()` em vez de `turma.escolaId`. Assim a subconsulta não depende da cláusula de fora para ficar presa à escola, e se alguém reaproveitar `#doAnoDaLeitura` noutra consulta o escopo vai junto.
- O filtro `papel = 'professor'` entrou no `#escopo` comum. Com isso a listagem do próprio usuário também deixa de trazer vínculo de aluno. Não vaza nada entre escolas, mas vale registrar no techspec que nenhuma rota de vínculo atende o aluno, antes que o F2 ou o F9 precisem de uma.

Não rodei nenhum teste: a auditoria foi feita lendo o diff e os testes novos.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 11:34:01 · `tasks/prd-identidade-e-tenancy/10_task.md`

VEREDITO: APROVADO

A tarefa 10.0 não tem nenhum bloqueante de privacidade. Li o diff, o `docs/lgpd.md` e os dois testes novos. Não rodei os testes: me apoiei no seu portão local verde e no `test-engineer` aprovado.

**Campos pessoais tocados:** `vinculo.complemento` (o texto livre da contestação, que agora é apagado na virada), `vinculo.contestacao` (o código, um enum, que fica), `vinculo.estado`, `motivo_encerramento` e `encerrado_em`, e `usuario.nome` do aluno, só na leitura da lista do ano encerrado. Não entrou coluna nova, nem campo proibido para aluno.

**Fora da tabela de dados do `docs/lgpd.md`:** nenhum. A linha do motivo de contestação agora está correta: o `complemento` é apagado na mesma transação do encerramento, e o código fica com o vínculo. Conferi o motivo que você deu para manter o código. Contestar grava `decidido_em` e confirmar apaga o código (`vinculo.repository.ts:140-141`). Por isso o código é o que separa o contestado do confirmado depois da virada.

**Autorização por objeto:** ok. Troquei o id na URL mentalmente em cada caso:
- **Filtro do cliente:** `?anoLetivoId` só restringe a leitura. A escola continua vindo do contexto, e o ano precisa ser da escola da turma e estar `encerrado` (`turma.repository.ts:340-351`). O ano de outra escola, o em curso, o planejado e o inexistente dão o mesmo 404.
- **Seus três pontos de atenção batem com o código:**
  - **(1)** a virada apaga o `complemento` e mantém o código, e a linha do `docs/lgpd.md` diz isso.
  - **(2)** só abre o histórico o `fim_do_ano` que tinha sido confirmado: exige `decidido_em` e nenhum código de contestação (`turma.repository.ts:377-382`). O pendente e o contestado não abrem, e há teste disso.
  - **(3)** o filtro `papel = 'professor'` está no escopo comum do `VinculoRepository` (`vinculo.repository.ts:507`). O vínculo de aluno responde 404, igual ao inexistente, e há teste.
- **Aluno:** com `?anoLetivoId` recebe 404 na turma e nos alunos.
- **Rede:** não chega aqui. `alcanceDaTurma` só deixa passar coordenação e professor com vínculo, e qualquer outro papel recebe 404.
- **Escrita:** nenhuma rota de escrita aceita o ano encerrado. Há teste de que nada muda no banco.

**Logs:** limpos. O diff não acrescenta nenhum log, e os que já existiam em `vinculo.service.ts` só levam o nome do evento.

**Auditoria:** presente onde a regra exige.
- A virada grava `ano_letivo.encerrado` na mesma transação. O registro leva só contagens, e o esquema estrito não aceita texto livre nem id de pessoa. Há teste lendo a tabela de auditoria inteira.
- A leitura dos alunos do ano encerrado pela coordenação exige finalidade e grava `turma.alunos_lidos` na mesma transação, como na 9.0. Abrir só a turma não expõe dado de aluno.
- O segundo clique em encerrar, em paralelo, não repete a virada nem a auditoria.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os alunos se chamam "Aluno sintético N", e o texto de contestação é constante de teste.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Prazo do código de contestação:** a linha do `docs/lgpd.md` diz que o código "fica com o vínculo", mas não dá prazo. Vale escrever explicitamente "vigência + 5 anos, com o vínculo", para quem auditar não precisar deduzir.
2. **Ano no registro de leitura:** `turma.alunos_lidos` não registra o `anoLetivoId`. Hoje ele sai do id da turma, que é de um ano só. Se a turma passar a atravessar anos no F2, registre o ano no `depois`.
3. **Pergunta de fechamento, para a 17.0:** esta tarefa não cria dado que não se consiga rastrear. Mas a resposta "tudo sobre um aluno e para onde foi" ainda depende da rotina de direitos do titular (regra 20, item 19), que não está nesta tarefa. Registre para o `/validar` que essa pergunta precisa ser respondida por código antes do piloto.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/ano-letivo.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts
- /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/virada-do-ano.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/historico.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/vinculo.int.test.ts

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 11:34:03 · `tasks/prd-identidade-e-tenancy/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Há uma decisão tomada na execução, mas ela não foi silenciosa: está na seção 5, "Histórico", da `techspec.md`, nas "Notas da implementação" e no pedido de revisão (ver a recomendação 1).
Portão local: carimbo válido (typecheck, lint, test)
Bloqueantes: nenhum

Recomendações:
1. **A Tech Spec mudou numa decisão tomada durante a tarefa.** O texto original dizia "`confirmado` ou `encerrado` por `fim_do_ano`". Agora o `fim_do_ano` só dá acesso se o vínculo tiver `decidido_em` e não tiver código de contestação. A mudança fecha um furo real: sem ela, o professor que contestou ("não leciono") ou nunca respondeu passaria a ler os alunos em janeiro. Mesmo assim, é mudança de spec feita por quem implementou, e o Joaquim deve ratificá-la de forma explícita no commit ou no `tasks.md`.
2. **O critério novo depende de um campo que hoje só o teste preenche.** A lista de alunos do ano encerrado usa o mesmo critério (`#confirmadoAteOFimDoAno` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`). Então o vínculo de aluno precisa ter `decidido_em` preenchido, senão some do histórico depois da virada. Hoje só a fixture `alunosNaTurma` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-com-turma.ts:46`) grava esse campo. Registre essa exigência para o F2 (importação da lista e reivindicação aprovada), no `TODO.md` ou na Tech Spec. Sem isso, o F2 cria alunos que não aparecem no ano encerrado e nenhum teste atual avisa.
3. **O filtro da 10.4 afeta mais rotas do que a listagem.** O `papel = 'professor'` entrou em `#escopo()` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`) e vale também para `decidir`, `listarDoUsuario` e `porIdDoUsuario`, não só para a listagem da coordenação. Hoje não quebra nada, porque o aluno tem `ler_proprios: 'nunca'`. Mas quando o aluno precisar ver o próprio vínculo, o escopo comum vai escondê-lo sem aviso. Vale deixar isso dito no comentário de `#escopo`.
4. **O ano da leitura é convertido para minúsculas em dois lugares.** `anoLetivoId?.toLowerCase()` aparece em `abrir` e em `alunos` no `turma.service.ts`. Ficaria num lugar só se o esquema de `campoAnoDaLeitura` já devolvesse o valor normalizado.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 11:52:55 · `tasks/prd-identidade-e-tenancy/11_task.md`

VEREDITO: APROVADO

Cenários exigidos (os da 1ª rodada, sem mudança):
- caminho feliz do login por matrícula
- isolamento: a mesma matrícula existe em duas escolas, e o bloqueio de uma não afeta a outra
- privacidade: resposta e custo iguais para slug inexistente, slug fora do formato, matrícula inexistente, aluno desativado e senha errada
- o bloqueio também não revela se a conta existe
- 400 logins do mesmo IP (regra 80, item 1)
- concorrência de verdade: 10 tentativas em paralelo avaliam no máximo 5 hashes
- `educa_dispositivo` preso à escola e à matrícula, incluindo o Chromebook compartilhado no carrinho
- aluno transferido
- dois alunos com o mesmo nome
- inatividade configurada por escola
- permissão: a sessão do aluno não lê a turma
- entrada fora do contrato é recusada
- matrícula e slug nunca aparecem no log

Cobertos: todos. As duas correções e as três recomendações novas conferem.

1. **Arquivo renomeado.** Só `apps/api/src/sessao/acesso-da-escola.service.ts:3` e `apps/api/test/acesso-da-escola.int.test.ts:6` importam `acesso-publico.repository.js`. Nenhum `.ts` fora de `dist` cita mais `acesso-da-escola.repository`. A troca só evita um falso positivo da varredura em `apps/api/src/ops/escola.repository.test.ts:61`. Nenhuma regra perdeu teste, porque o conteúdo e a classe são os mesmos.
2. **`matriculaRara()` no teste do bloqueio** (`apps/api/test/sessao-matricula.int.test.ts:255`). O conserto é certo: todo slug inexistente conta na mesma "escola desconhecida", então o que precisa variar entre execuções é a matrícula. As outras três sequências usam escola nova a cada execução, e por isso `1234`, `5678` e `9999` fixas não trazem contador de uma execução anterior. A asserção continua forte. Se o slug inexistente ou a conta desativada tivessem outro caminho, o status e o corpo mudariam em algum ponto das seis tentativas.
3. **Chromebook do carrinho** (linhas 349 a 366). O teste falharia sem a regra. Se o cookie da 1234 tornasse a 5678 "conhecida", os erros das linhas 360 e 361 cairiam no contador `conhecido`, e a linha 362 (sem cookie, contador `outro`) daria 200 em vez de 429. Isso bate com a chave de `matricula.service.ts:103-104`, que usa o identificador de escola mais matrícula. A linha 364 mostra que o aluno das 8h segue entrando no próprio usuário.
4. **Inatividade com 17 e 20 min** (linhas 427 a 435). Agora o limite fica provado dos dois lados: com 17 min passa, dentro da tolerância, e com 20 min vence. O `semUsoHa(20)` regrava `ultimo_uso_em`, então a leitura aos 17 min não mascara o vencimento.
5. **Chaves exatas do `/v1/eu`** (linhas 164 e 165). O teste falha se algum campo da credencial, como a matrícula, entrar no DTO de saída.

Não há `.skip`, teste comentado nem mock escondendo a regra. O espião em `HashDeSenha.verificar` só conta chamadas e não troca o comportamento. Nenhum teste chama provedor de IA.

Bloqueantes: nenhum.

Recomendações:
- `apps/api/dist/sessao/acesso-da-escola.repository.js` e o `.map` ainda têm o nome antigo. Não afeta teste nem varredura (`dist` fica de fora), mas vale limpar o build para ninguém se confundir com o nome.
- Linha 365: `expect(dasNove).not.toBe(dasOito)` é quase decorativo, porque `alunosComMatricula` sempre cria dois usuários. Ficaria mais forte provar que a 5678, com a senha certa, entra no próprio usuário `dasNove` depois que o bloqueio vence, ou numa escola separada.
- Continua valendo da 1ª rodada, para o `/validar`: o arquivo renomeado (`acesso-publico.repository.ts`) não bate mais com o nome da classe (`AcessoDaEscolaRepository`). Se renomear a classe também, a organização fica igual à dos outros repositories.

Não rodei nenhum teste, como você pediu. A auditoria foi só pela leitura do código.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 12:17:21 · `tasks/prd-identidade-e-tenancy/11_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** `credencial_matricula` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0011_credencial_matricula.sql`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/credencial-matricula.ts`)
- Tem `escola_id NOT NULL` e id UUID (`uuidv7()`).
- A matrícula é única dentro da escola: `unique (escola_id, matricula)`. Esse é também o índice que a leitura do login usa, e ele começa pelo escopo.
- Uma FK composta `(escola_id, usuario_id)` aponta para `usuario (escola_id, id)`, então a credencial nunca aponta para aluno de outra escola.
- A tabela não tem `anoLetivoId`, e está certo: a credencial acompanha o aluno de um ano para o outro.

**Queries verificadas:**
- `CredencialMatriculaRepository.doAlunoAtivo` e `criar`: a escola vem de `exigirEscolaDoContexto()`. O join com `usuario` também exige a mesma escola e filtra `papel = 'aluno'` e aluno não desativado.
- `AcessoDaEscolaRepository.nome` (`acesso-publico.repository.ts`): a escola vem do contexto.
- `RegistroDeAcessoRepository.gravarFalha`: grava na escola do contexto, sem usuário.
- `ConclusaoDeLogin.#criarSessao` com `metodo = 'matricula'`: grava num contexto que tem só a escola, e a FK composta recusa usuário de outra escola.
- `ResolucaoDeTenantRepository.escolaPorSlug`: já existia desde a 7.0 e não mudou. É a resolução prevista antes do login.
- Corpo do `POST /v1/sessao/matricula`: o esquema é estrito, e `escolaId` no corpo é recusado com 400 (há teste). A escola vem só do slug, resolvido no servidor, e é aberta por `naEscolaSemUsuario`.
- Nenhum `@SemEscopo()` novo.
- A camada rede não é tocada.

**Teste de isolamento:** presente e efetivo. Conferi mentalmente o que quebra sem cada cláusula:
- **Sem a escola no `where` de `doAlunoAtivo`:**
  - `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/credencial-matricula.repository.int.test.ts:25` quebra: com o contexto de A, ele passaria a achar a matrícula que só existe em B.
  - `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-matricula.int.test.ts:181-182` também quebra. A senha de uma escola passaria a entrar no slug da outra, ou a FK composta devolveria 500 no lugar de 401.
- **Sem a escola na chave do contador:** `sessao-matricula.int.test.ts:200` quebra, porque a matrícula 1234 de B ficaria segurada junto com a de A.
- **Sem a escola no `nome()` do `/acesso`:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-escola.int.test.ts:123` quebra, porque uma escola que não existe no contexto passaria a devolver o nome de alguma escola.

**Existência não é revelada:**
- Slug inexistente, slug fora do formato, matrícula inexistente, aluno desativado e senha errada recebem a mesma resposta, com um hash cada e o mesmo ponto de bloqueio. Os testes das linhas 209 e 247 cobrem isso.
- O registro de acesso da falha não leva usuário.
- A sessão de aluno em `/v1/turmas/:id` e `/v1/turmas/:id/alunos` responde 404, igual ao id que não existe.

**Bloqueantes:** nenhum

**Recomendações:**
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/sessoes-sinteticas.ts:354`: o seed `criarAlunosComMatricula` recebe `escolaId` por parâmetro. Hoje isso é aceitável, porque só roda com `AMBIENTE=local` e abre o próprio contexto. Quando o F2 criar credencial pela reivindicação, isso deve passar pelo contexto do token, nunca por esse caminho.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts:162`: todos os slugs inexistentes usam o mesmo contador, o da `ESCOLA_DESCONHECIDA`. Não vaza dado. Vale registrar na 15.0 que esse contador pode ser disputado por terceiros com a mesma matrícula, mas o efeito é só sobre respostas que já são de recusa.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 12:17:42 · `tasks/prd-identidade-e-tenancy/11_task.md`

VEREDITO: APROVADO

A tarefa 11.0 não tem nenhum bloqueante de privacidade. Li o código e os testes sem rodar nada, como você pediu.

**Campos pessoais tocados:** matrícula do aluno, hash argon2id da senha, contador de tentativas (HMAC de `escola_id|matricula`), entrada do cookie `educa_dispositivo` (HMAC de `escola_id|matricula`) e `registro_acesso` (IP e hora, e a falha gravada sem usuário). A sessão tem `metodo = matricula` e `conta_id` nulo.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. Matrícula, hash, contador, cookie de dispositivo, sessão e registro de acesso já estão no mapa, com finalidade e retenção. O aluno continua sem e-mail, telefone, CPF, foto, endereço ou nascimento. O seed cria o aluno com `contaId: null` e nome sintético.

**Autorização por objeto:** ok.
- **Escola vem do slug:** a credencial é lida por `CredencialMatriculaRepository.doAlunoAtivo`, com a escola do contexto aberto a partir do slug (`exigirEscolaDoContexto()`), nunca do corpo. O contrato é `.strict()` e recusa `escolaId` no pedido, com teste.
- **Só aluno ativo:** a leitura exige papel aluno e usuário não desativado.
- **Credencial presa à escola:** a FK composta `(escola_id, usuario_id)` impede credencial apontando para usuário de outra escola.
- **Troca de id:** a senha de A no slug de B é recusada, e 5 erros na 1234 de A não seguram a 1234 de B. Os dois testes usam linha real na escola B.
- **Respostas iguais:** slug inexistente, slug fora do formato, matrícula inexistente, aluno desativado e senha errada dão o mesmo status e o mesmo corpo. Cada caso roda o hash uma vez, e o bloqueio chega na mesma quinta tentativa, também para a "escola desconhecida".
- **`/acesso`:** o 404 para slug inexistente é aceitável, porque o slug é o endereço público da escola.
- **Sessão de aluno:** recebe 404 em `GET /v1/turmas/:id/alunos`, igual ao inexistente.

**Logs:** limpos.
- Os logs novos não trazem matrícula nem slug.
- O Redis vê só o HMAC com `LOGIN_CHAVE_CONTADOR`, e o cookie só o HMAC com a chave versionada de dispositivo.
- O redact do logger cobre `matricula` e `senha`.
- Não existe log de acesso HTTP com a URL.
- Um teste procura no log as matrículas raras e os slugs digitados, nas duas rotas.

**Auditoria:** presente onde a regra 20 exige. O login não está entre as ações do item 10, e o `registro_acesso` do Marco Civil é gravado no acerto e na falha. A falha fica sem usuário, para a linha não dizer se a matrícula existe.

**DTO e erro:**
- `/acesso` passa por esquema estrito só com `{ nome, provedores }` e nunca devolve domínio (`hd`) nem tenant (`tid`).
- O login devolve só `{ etapa, token, expiraEm }`, validado por esquema.
- O hash da senha nunca sai do service.
- Os erros são tipados (`NAO_AUTENTICADO`, `CONTA_SEGURADA` com tempo de espera, `ENTRADA_INVALIDA`, `NAO_ENCONTRADO`).

**Envio externo:** nenhum. A tarefa não usa IA, storage, exportação nem convite.

**Seed/fixture:** sintético. A escola é "Colégio Sintético", e as senhas e matrículas são fictícias. `criarAlunosComMatricula` só roda com `AMBIENTE=local`.

**Ciclo de vida:**
- A credencial sai com o usuário (`on delete cascade`), então a eliminação do titular alcança a matrícula e o hash.
- Aluno desativado é recusado com a resposta da senha errada. Apagar o hash na desativação fica para a 17.0, como a tarefa declara.

**Pergunta de fechamento:** para o que esta tarefa guarda, sim. A credencial é da escola, presa ao usuário, e nada é enviado para fora. O `registro_acesso` de falha fica sem usuário, então não entra no que se diz sobre um aluno específico.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Quando a exportação de direitos do titular for implementada, ela precisa incluir `credencial_matricula` (a matrícula, nunca o hash) e as linhas de `registro_acesso` e `sessao` com `metodo = matricula`. Hoje nada impede de esquecer a tabela nova. Vale registrar isso no `/retro`.
2. O teste de log em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-matricula.int.test.ts:472` depende de rodar depois dos outros do mesmo arquivo ("depois de tudo acima"). Isolado, ele só confere `http.erro`. Seria mais forte se provocasse sozinho a falha e o acerto que quer inspecionar.
3. A retenção de 6 meses de `registro_acesso` ainda não tem rotina de expurgo. Isso já existia antes desta tarefa, mas a 11.0 aumenta o volume com as falhas por matrícula, então vale acompanhar no roadmap.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/credencial-matricula.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/acesso-da-escola.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/registro-de-acesso.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0011_credencial_matricula.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/matricula.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/acesso-da-escola.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-matricula.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-escola.int.test.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 12:17:45 · `tasks/prd-identidade-e-tenancy/11_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login, migration
Rate limit: ok
Fila e prioridade: ok (a tarefa não toca fila; o argon2 fica no request por desenho, e o semáforo do hash é da 14.0)
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum

**Por que cada item passou:**
- **Rate limit:** a tentativa de login é segurada pela chave `HMAC(escola_id|matricula)` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts`. O contador é reservado antes do hash, pelo script Lua atômico do contador da 4.0. O limite por IP da rota anônima tem teto de 3000/min, que cabe uma escola inteira atrás de um NAT. O teste com Enzo e mais 399 colegas atrás do mesmo IP prova que só a conta dele fica segurada.
- **Concorrência:** o teste de 10 senhas erradas em paralelo com `Promise.all` confere que o argon2 roda no máximo 5 vezes. A tabela tem `unique (escola_id, matricula)` e `unique (escola_id, usuario_id)`.
- **Índice:** a leitura da credencial usa o unique `(escola_id, matricula)`. O join com `usuario` usa a chave `(escola_id, id)`, e `escola.slug` já tem unique. Não há listagem nova.
- **Migration:** `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0011_credencial_matricula.sql` cria uma tabela nova e vazia, sem `ALTER` em tabela com dado.
- **Métrica:** a latência e o erro das duas rotas entram no `http.server.request.duration` por rota, e `login.conta_segurada` também conta a matrícula, com teste. Não há alerta novo. Deixar `login.falhas{escola_id}` para a 15.3 está justificado nas notas da tarefa.
- **Estado em memória:** não há estado novo em memória. O seguro em memória do contador, usado só com o Redis fora, já vinha da 4.0.

**Recomendações:**
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts:67`: toda falha com escola conhecida grava uma linha em `registro_acesso`. Quem trocar a matrícula a cada tentativa grava até 3000 linhas por minuto por IP. O login por e-mail já tem esse padrão. Vale medir isso no cenário `login-7h30` da 16.0 e avaliar se o rebaixamento IP×escola da 15.0 cobre o caso.
- `GET /v1/escolas/:slug/acesso` é chamado por toda a escola às 7h30 e faz duas consultas por requisição. Um cache curto no Redis de cache, por slug, alivia o banco na rajada. Não é urgente para dez escolas.
- Todo slug inexistente conta na mesma "escola desconhecida", então o mesmo slug errado com a mesma matrícula divide um contador. O efeito é inofensivo, mas convém uma linha no runbook para quem investigar `CONTA_SEGURADA` de slug digitado errado.
- O cenário de carga `login-7h30` com matrícula ainda não existe. Ele é da 16.0, e esta tarefa não pode ser dada como pronta para produção sem ele.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 12:17:47 · `tasks/prd-identidade-e-tenancy/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, infra)
Bloqueantes: nenhum

Recomendações:
1. **Duas leituras suas da tarefa pedem ratificação do Joaquim.** A implementação está certa nas duas, mas cada uma diverge do texto e hoje está registrada só nas "Notas da implementação":
   - **`login.falhas{escola_id}` foi adiada para a 15.3.** A 11.2 pede essa métrica, mas a 15.3 é quem a cria (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/15_task.md:59`), então o adiamento se sustenta.
   - **Slug inexistente não grava `registro_acesso`.** A seção 5 da Tech Spec diz "login, falha, renovação e saída gravam `registro_acesso`", e a seção 6 só admite escola nula na falha por e-mail. As duas regras não cabem juntas nesse caso. Vale uma linha na seção 5 da Tech Spec dizendo que a falha com slug inexistente não gera registro.
2. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escola-sem-usuario.ts` é um segundo jeito de fazer o que o módulo já faz.** O `convite.service.ts` abre o contexto de escola sem usuário direto com `executarNoContexto({ requisicaoId, escolaId })`. Ou se usa o helper novo nos dois lugares, ou nenhum.
3. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/acesso-publico.repository.ts:11` repete a leitura do nome da escola.** O `ConviteRepository.nomeDaEscola()` (`convite.repository.ts:19`) já faz exatamente essa consulta com escopo. Além disso, o nome do arquivo não bate com o da classe (`AcessoDaEscolaRepository`).
4. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts:91-98` duplica lógica.** O `#recusar` repete a sequência reservar, conferir `liberada`, `esperaSeFalharMs` e `#segurada` do caminho principal. Dá para extrair a parte comum e deixar os dois caminhos iguais por construção, não por cópia.
5. **Comentário desatualizado em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/telemetria/metricas.ts:38`.** Ele diz que `login.conta_segurada` não tem rótulo porque "a conta é global". Agora a métrica conta também a matrícula, que é por escola.
6. **Build velho em `apps/api/dist/sessao/`.** Sobrou o `acesso-da-escola.repository.js` com o nome antigo; vale limpar.
7. **O teste de log depende da ordem.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-matricula.int.test.ts:472`, ele só vale se rodar depois dos outros do mesmo `describe`. Com a execução sequencial padrão funciona, mas quebra em silêncio se alguém ligar `sequence.shuffle`. Um `afterAll` com essa asserção não depende da ordem.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 12:56:34 · `tasks/prd-identidade-e-tenancy/12_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: login por e-mail, depois `escolher` A, depois troca para B. A sessão de A fica encerrada com motivo `troca_de_escola`.
- Isolamento:
  - a turma de A, lida com o token de B, dá 404 igual a turma inexistente;
  - o token antigo de A dá 401;
  - `usuarioId` de outra conta dá 404, em `escolher` e na troca.
- Borda de MFA:
  - destino coordenador exige MFA, e sem o código a sessão de A continua e nenhuma sessão de B existe;
  - quem sai de A antes do código não ganha a sessão de B;
  - destino sem MFA configurado leva a `configurar_mfa`.
- Borda de inatividade: a regra do destino (60 min) vale sobre a da origem (120 min).
- Permissão: sessão de aluno, de matrícula e externa dá 404.
- Borda de fim de vínculo: a professora que saiu de B em março some de `acessos`, e A continua funcionando.
- Borda de convite: a coordenadora que ainda espera o convite (7.0) não aparece em `acessos` e não é alcançável.
- Concorrência de verdade, com duas chamadas em paralelo: troca e `escolher`.
- Privacidade (RF18) em `/v1/eu.acessos`.
- Segurança da rota nova: um JWT que diz no cabeçalho ser desafio, mas é falso, não pode abrir nada. Isso é consequência do `@AceitaDesafio`, que faz as quatro guardas tratarem a requisição como anônima.

**Cobertos:** todos os cenários da tabela da tarefa, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts`.
- **Os testes falhariam sem a regra:**
  - sem o filtro por conta, falham o teste de outra conta (linha 295) e o de privacidade (linha 513, com a outra conta em B);
  - sem o filtro de desativado, falham o de março (linha 439) e o do convite (linha 459);
  - sem o `update` condicional, o teste de concorrência (linha 482, com `Promise.all`) acharia duas sessões em B;
  - sem a regra do destino, o teste de inatividade (linha 397) daria 200.
- **Isolamento do repositório:** `sessao-de-origem.repository.int.test.ts` cobre o escopo pela escola do contexto e a recusa de outra conta ou de método que não é e-mail.
- **Desafio:** `desafio.test.ts` cobre destino e origem no desafio, e recusa a origem incompleta.
- **Guardas:** `rota-sem-sessao.test.ts` cobre a decisão das guardas.
- **Outros pontos checados:** não há `.skip` nem mock escondendo a regra, e nenhuma IA é envolvida.

**Bloqueantes:**
1. **`apps/api/test/troca-de-escola.int.test.ts:295`: falta provar, na rota, que o cabeçalho `typ: desafio+jwt` não é confiado.**
   - **O problema:** com esse `typ`, as guardas de autenticação, sessão, permissão e limite deixam passar a requisição de `POST /v1/sessao/escola`. Aí a única defesa é a chamada `verificarDesafio(...)` em `troca-de-escola.service.ts:43`.
   - **O que os testes provam hoje:** `rota-sem-sessao.test.ts:61` mostra que `bearerDeDesafio` aceita JWT assinado com outra chave. O único teste de integração da rota com um desafio inválido usa o desafio `mfa` (linha 344), que é bem assinado e tem só a etapa errada.
   - **O risco:** se o service passasse a só decodificar o JWT e conferir a etapa, nenhum teste falharia.
   - **Correção exigida:** um teste de integração que mande a `POST /v1/sessao/escola` três desafios `escolher` com `conta_id` real da professora e `usuarioId` válido dela:
     - (a) assinado com outra chave;
     - (b) vencido;
     - (c) com `aud` diferente de `sessao`.

     Os três devem dar 401 `NAO_AUTENTICADO`, sem `Set-Cookie` e sem nenhuma linha em `sessao` para esse usuário.

**Recomendações (não bloqueiam):**
- `troca-de-escola.int.test.ts:325`: depois do código, conferir que `registro_acesso` de B tem um único `login` do coordenador. A 12.2 exige o registro também no caminho do MFA, e hoje ele só é provado na troca direta.
- Faltam casos pelo token, e não pelo `escolher`:
  - destino coordenador sem MFA configurado leva a `configurar_mfa` e não encerra a origem (hoje isso só é provado na linha 372, pelo `escolher`);
  - coordenadora em A trocando para coordenação em B também é cobrada do MFA. Isso prova a escolha registrada nas notas da tarefa de pedir o MFA sempre na troca pelo token.
- Fluxo do MFA: o usuário de destino é desativado entre a emissão do desafio `mfa` e o código. O esperado é 401 e nenhuma sessão, com a origem ainda aberta.
- Troca para o próprio usuário da sessão atual: registrar e provar o comportamento, que hoje encerra e recria a sessão na mesma escola.
- Limite: provar que o caminho do desafio em `/v1/sessao/escola` consome o balde anônimo por IP, e não fica sem limite. É assunto do `infra-guardian`, mas o teste seria da tarefa.
- Privacidade (linha 513): a asserção em ordem depende de "Colégio" vir antes de "Escola" no `orderBy(escola.nome)`. Vale deixar isso explícito num comentário ou usar prefixos que não deixem dúvida.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/troca-de-escola.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/sessao-de-origem.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/sessao-de-origem.repository.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/rota-sem-sessao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/rota-sem-sessao.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.test.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 13:02:13 · `tasks/prd-identidade-e-tenancy/12_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** a correção da 1ª rodada. Um desafio `escolher` assinado com outra chave, um vencido e um com `aud` diferente de `sessao`, todos com o `conta_id` real da professora e um `usuarioId` válido, mandados a `POST /v1/sessao/escola`. Os três precisam dar 401 `NAO_AUTENTICADO`, sem `Set-Cookie` e sem nenhuma linha em `sessao`. Conferi também os testes acrescentados e a mudança em `ops-escola.int.test.ts`.

**Cobertos:**
- **A correção foi feita** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts:327-358`). Cada desafio falso é mandado duas vezes, com o `usuarioId` de A e com o de B. Os três casos pedem 401, `NAO_AUTENTICADO` e `Set-Cookie` vazio, e depois nenhuma sessão em A nem em B.
  - Cada caso falha sozinho se a verificação correspondente sair de `verificarDesafio` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.ts:97-104`).
    - O desafio de outra chave sai do `EmissorDeDesafio`, que põe `typ: desafio+jwt`. Então só a assinatura o recusa.
    - O vencido usa a chave verdadeira com o relógio recuado além dos 5 min. Só `exp` e `maxTokenAge` o recusam.
    - O de outro `aud` usa `typ` e `iss: 'educa'` corretos: conferi que `EMISSOR_TOKEN` vale `'educa'`. Então só a audiência o recusa.
  - O controle com o desafio verdadeiro no fim dá `pronta`. Isso mostra que os 401 vêm da verificação, e não de a rota estar quebrada por outro motivo.
- **Recomendações da 1ª rodada que foram aplicadas:**
  - O registro de acesso de B fica com um único `login` da coordenadora depois do código (`:387-388`).
  - Coordenação em A não dispensa o código para a coordenação de B, e a conta sem MFA leva a `configurar_mfa` sem encerrar A (`:391-422`).
  - Destino desativado entre a troca e o código (`:424-440`).
  - Troca para o próprio usuário da sessão (`:442-455`).
  - Em todos eles a asserção é sobre o estado: sessões no banco, 401 do token antigo, `motivo`. Nenhum se limita a conferir o status da resposta.
- **`ops-escola.int.test.ts:163-166`:** a rota entra na lista de permitidas com justificativa, e a lista continua fechada. Faz sentido: a rota recebe só `usuarioId`, e a escola vem do banco. O teste continua pegando uma rota nova que crie escola ou rede.
- Não há `.skip`, teste comentado nem mock escondendo a regra. As duas concorrências (`:585`, `:603`) seguem em paralelo de verdade.

**Bloqueantes:** nenhum.

**Recomendações:**
- `troca-de-escola.int.test.ts:339`: importar `EMISSOR_TOKEN` em vez de escrever `'educa'` à mão. Se o emissor mudar, o caso de outro `aud` passaria a ser recusado pelo `iss` e deixaria de provar a audiência sem ninguém perceber.
- `:357`: o controle aninha três chamadas numa linha. Separar em passos com `expect(status).toBe(200)` deixa mais claro o motivo quando ele falhar.

Não rodei nenhum teste. A auditoria foi só por leitura, como você pediu.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 13:27:15 · `tasks/prd-identidade-e-tenancy/12_task.md`

VEREDITO: APROVADO
Tabelas verificadas: nenhuma tabela nova e nenhuma migration. As tabelas que a tarefa usa são `sessao`, `usuario`, `escola`, `conta` e `registro_acesso`. Os ids são UUID, e o corpo da requisição valida `usuarioId` com `z.uuid()` em modo estrito.
Queries verificadas:
- **`SessaoDeOrigemRepository.metodoEConta` e `encerrarParaTroca`:** filtram pela escola do contexto (`exigirEscolaDoContexto()`), e não por argumento. `encerrarParaTroca` também confere `conta_id`, `metodo = 'email'` e `encerrada_em is null`.
- **`ResolucaoDeTenantRepository.acessosDaConta`:** é um `@SemEscopo` novo, com justificativa escrita. A `contaId` vem do usuário da sessão lido com escopo em `EuRepository.doContexto`, nunca do cliente. A consulta traz só `usuarioId`, `escolaNome` e `papel`, apenas de usuários ativos que não são aluno.
- **`TrocaDeEscolaService.#destinoDaConta`:** a escola de destino sai do banco. Ela só é lida depois que o `usuarioId` é conferido entre os usuários ativos de equipe da conta, seja a do desafio assinado, seja a da sessão verificada. O corpo não aceita `escolaId`.
- **`MfaService` com `destinoUsuarioId`:** o destino é conferido de novo contra a conta do desafio. A origem (`origem_esc` e `origem_sid`) vem só do JWT assinado, e só é aceita inteira.
- **`ConclusaoDeLogin.#criarSessao`:** a origem é encerrada no contexto da escola dela, e a sessão nova é criada no contexto do destino, dentro da mesma transação.
- **`rotaSemSessao` e `@AceitaDesafio`:** tratam a requisição como anônima só naquela rota, e só com `typ: desafio+jwt`. O service verifica assinatura, `aud`, prazo, etapa e `jti`. Um cabeçalho forjado não abre nada, e os testes cobrem outra chave, desafio vencido, outro `aud` e o desafio `mfa` usado como escolha.

Teste de isolamento: presente e efetivo.
- `apps/api/test/troca-de-escola.int.test.ts:275` falharia se a sessão nova ficasse presa a A. O teste de controle antes da troca prova que o 200 vinha do vínculo.
- `apps/api/test/troca-de-escola.int.test.ts:297` falharia sem a conferência do `usuarioId` contra a conta: uma sessão de B seria gravada, e o 404 não seria igual ao do id inexistente.
- `apps/api/test/troca-de-escola.int.test.ts:258` falharia se a origem não fosse encerrada.
- Os testes das linhas 521, 542 e 562 cobrem sessão de matrícula ou externa, usuário desativado e convite pendente, todos com o mesmo 404 e sem gravar nada.

Bloqueantes: nenhum

Recomendações:
- **`@SemEscopo` demais no mesmo repository.** `apps/api/src/sessao/resolucao-de-tenant.repository.ts:354` leva a 21 os `@SemEscopo` desse repository, e a regra 10, item 9, trata a terceira no mesmo módulo como sinal de desenho errado. `acessosDaConta` repete o filtro de `usuariosAtivosDaConta`: dá para unificar num método só, com o join em `escola`, que sirva ao `/v1/eu` e à troca. Registrar para o `/retro`.
- **Cláusula de conta sem teste próprio.** Nenhum teste isola o `eq(sessao.contaId, contaId)` em `apps/api/src/sessao/sessao-de-origem.repository.ts:42`. É defesa em profundidade, porque a origem já vem de sessão verificada ou de desafio assinado, mas um teste de repository com uma sessão de outra conta na mesma escola fixaria a cláusula.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 13:27:22 · `tasks/prd-identidade-e-tenancy/12_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:**
- Nenhum campo pessoal novo.
- A tarefa escreve em `sessao`, marcando `encerrada_em` e o motivo `troca_de_escola`. Esse valor já existe no CHECK da migration 0005 e em `MOTIVOS_DE_ENCERRAMENTO`.
- Também escreve em `registro_acesso`, com o evento `login` gravado na escola de destino.
- Passa a ler `usuario.conta_id` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/eu.repository.ts`. Essa leitura serve só para montar `acessos` e não sai na resposta, porque o esquema é `.strict()` e o service mapeia campo a campo.
- `acessos` expõe `usuarioId`, `escolaNome` e `papel` das outras escolas da mesma conta. Nome de escola não é dado pessoal, e a seção 7 da Tech Spec prevê exatamente isso.

**Fora da tabela de dados do docs/lgpd.md:** nada. A sessão, com método, motivo e conta, está na linha 54. O registro de acesso está na linha 61.

**Autorização por objeto:** ok.
- **A escola de destino nunca vem do cliente.** O corpo aceita só `{ usuarioId }`. `#destinoDaConta` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/troca-de-escola.service.ts` só aceita um usuário ativo de equipe da conta, e essa conta vem do desafio verificado ou da sessão lida no escopo da guarda.
- **Respostas iguais.** Um id de outra conta, de alguém desativado, de aluno ou inexistente recebe o mesmo `NAO_ENCONTRADO`. Sessão de matrícula ou externa e o aluno pela matriz (`nunca` → 404) também recebem esse mesmo 404.
- **Encerramento da origem conferido.** O `update` que encerra a sessão de origem confere escola do contexto, `conta_id`, `metodo = 'email'` e `encerrada_em is null`.
- **O cabeçalho `typ: desafio+jwt` não abre nada sozinho.** O service verifica assinatura, `aud`, prazo, etapa e `jti`, e há teste para chave errada, desafio vencido e `aud` trocado.
- **O MFA não é contornado.** Na troca pelo token, o segundo fator é pedido sempre que o destino é coordenador. O desafio `mfa` leva só ids, e a origem precisa vir inteira ou é recusada.

**Logs:** limpos. Nenhum log foi acrescentado no diff.

**Auditoria:** presente onde a regra exige. A troca não é leitura de dado de aluno por coordenação ou rede, nem exportação, alteração de nota, alteração de permissão ou aprovação de saída de IA. O rastro fica em `registro_acesso` (login no destino) e em `sessao.motivo = 'troca_de_escola'` na origem.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os testes usam "Pessoa sintética" e ids gerados.

**Pergunta de fechamento:** o código responde para esta tarefa. A troca não cria dado sobre aluno: o aluno não tem conta, `acessos` vem vazio para ele e a rota dá 404. O que é gravado sobre a equipe fica em tabelas escopadas por escola, com retenção declarada.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Na troca, a origem não ganha um evento `saida` em `registro_acesso`. O motivo gravado na sessão já registra o encerramento, mas a sessão guarda 30 dias e o registro de acesso guarda 6 meses. Depois de 30 dias, o rastro de que a sessão de A foi encerrada por troca some. Fica para o `/retro` avaliar se vale gravar `saida` na escola de origem.
2. `acessosDaConta` leva a contagem de `@SemEscopo` a 21 no `ResolucaoDeTenantRepository`. A justificativa está correta e testada. A contagem é assunto do `tenancy-guardian`, e fica registrada só como observação.
3. No teste de privacidade de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts` (linhas 616 a 635), valeria também afirmar que o `nome` do usuário de B não aparece no corpo de `/v1/eu` quando a sessão é de A. Hoje o esquema estrito já garante isso, e a asserção só daria cobertura extra.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 13:27:34 · `tasks/prd-identidade-e-tenancy/12_task.md`

VEREDITO: APROVADO

Escopo: respeitado. As três subtarefas estão feitas. Não há tela, nem troca pelo login externo, nem redefinição de MFA, que pertencem às tarefas 20.0, 13.0 e 6.0. As mudanças nas quatro guardas de `@educa/nucleo` são o mínimo para a rota aceitar o desafio. `eu.service.ts` foi alterado no lugar do `eu.controller.ts` previsto, o que respeita a regra 00, item 2 (controller sem regra).

Aderência à Tech Spec: ok. A rota aceita o desafio `escolher` ou o token de uma sessão de e-mail, como a seção 4 já previa. A origem é encerrada na mesma transação com motivo `troca_de_escola`, e o MFA e a inatividade valem os do destino. Duas coisas foram acrescentadas e estão escritas na própria `techspec.md` (seção 4 e contagem de `@SemEscopo` agora em 21) e nas "Notas da implementação" do `12_task.md`:
- `@AceitaDesafio`;
- `origem_esc` e `origem_sid` no desafio `mfa`.

Como estão declaradas, não contam como divergência silenciosa. Mesmo assim, o Joaquim precisa ratificá-las, como aconteceu na 10.0 e na 11.0.

Portão local: carimbo válido (typecheck, lint, test, infra).

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.ts`: `export { TIPO_DESAFIO }` reexporta a constante que agora mora em `@educa/nucleo`. Assim, o mesmo símbolo passa a ter dois caminhos de import. Vale trocar os imports antigos para `@educa/nucleo` e remover a reexportação.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/troca-de-escola.service.ts:88`: o service cria `new SessaoDeOrigemRepository(this.dependencias.banco)` direto, enquanto as outras dependências chegam por `DependenciasDaTroca`. Vale passar o repositório pelas dependências também, para seguir o padrão do próprio service.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/troca-de-escola.controller.ts:30`: a escolha entre `escolher` e `trocar` pelo `typ` do cabeçalho existe no controller e também em `rotaSemSessao`. Hoje as duas batem, porque usam a mesma `bearerDeDesafio`. Se no futuro alguém mudar uma sem a outra, uma requisição pode ser tratada como anônima pelas guardas e cair no caminho autenticado, ou o contrário. Vale um comentário ligando os dois pontos, ou centralizar a decisão.
- A origem não ganha `saida` em `registro_acesso` na troca (nota declarada). Hoje só o motivo na sessão registra o encerramento, o que é aceitável. Vale confirmar essa escolha na ratificação, porque a pergunta "quando essa pessoa saiu da escola A" passa a depender da tabela `sessao`, e não do registro de acesso.

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

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 15:44:57 · `tasks/prd-identidade-e-tenancy/14_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Boot:** sem `LOGIN_HASH_CONCORRENCIA` ou `UV_THREADPOOL_SIZE`, e com a concorrência acima de UV−8, a subida cai apontando só o nome.
- **Rodízio entre escolas:** 3.000 pedidos da A na fila, e a B é a próxima atendida.
- **Rodízio na equipe:** 100 pedidos de um IP contra 1 de outro IP.
- **Espera acima de 2 s:** 503 com `Retry-After` entre 2 e 6, sem chegar ao hash.
- **Privacidade:** a mesma taxa de 503 para matrícula e e-mail que existem e que não existem. Isso depende de o balde ser escolhido sem olhar se a credencial existe.
- **Rajada:** 35 logins do mesmo IP, sem 429.
- **Métrica:** uma série por escola, sem usuário, matrícula ou IP.
- **Alertas:** acima e abaixo do limiar, e a guarda do runbook.
- **Concorrência:** pedidos em paralelo de verdade.
- **Isolamento:** uma escola barulhenta não atrasa a outra.

**Cobertos:**
- Boot: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/config.test.ts:116-135`, com ausente, vazio, 0, 8 aceito, 9 recusado sem o valor na mensagem, e 4 threads recusadas.
- Rodízio com 3.000 pedidos e rodízio por IP na equipe, com controle contra IP novo a cada pedido: `semaforo-de-hash.test.ts:37-129`. Os dois falhariam com fila única por ordem de chegada.
- Teto, prazo, `Retry-After` sorteado, limite de 10.000 esperando e métricas na unidade: `semaforo-de-hash.test.ts:133-254`.
- Espera de 2 s na integração, com seis 503 seguidos e o aluno entrando na sétima: `semaforo-de-login.int.test.ts:157-181`. O teste falharia se a tentativa fosse contada antes do semáforo.
- Rajada de 35 logins do mesmo IP, pedidos em `Promise.all`, sem 429 e com 35 esperas medidas: `:218-243`.
- Métrica com A, B, `equipe` e `desconhecida`, sem rótulo de pessoa nem IP: `:250-278`.
- Alertas: expressão, `for` e limiar em `infra/test/alertas.test.ts`; o ensaio dispara os dois com `for` de 180 s; o teste "abaixo do limiar" fica quatro avaliações em normal; a guarda do runbook inclui os dois arquivos novos.
- Não há `.skip`, `.only` nem teste comentado. Nenhum provedor de IA envolvido.

**Bloqueantes:**
1. **Nenhum teste prova que o balde independe de a credencial existir.** A regra está na subtarefa 14.1 e na regra 20, item 6.
   - `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/semaforo-de-login.int.test.ts:183-216`: com `LOGIN_HASH_CONCORRENCIA=1` e o único hash preso, todo pedido sai com 503, seja qual for o balde.
   - Por isso o teste só prova que todo login passa pelo semáforo. Não prova que a matrícula que não existe cai no balde da escola do endereço, nem que o e-mail sem conta cai na `equipe`.
   - Uma mudança que lesse a credencial antes e mandasse o inexistente para outro balde continuaria passando. Em rodízio real, esse outro balde seria atendido antes, e o tempo de resposta revelaria quem existe.
   - `:250-270` também não fecha a lacuna: a série da A conta só a matrícula existente, com senha certa e com senha errada. Da equipe, o teste confere que a série existe, mas não quantos pedidos ela contou.
   - **Correção exigida:** no teste de métrica, fazer também login com uma matrícula que não existe no endereço da A e exigir `contagem: 3` na série da A. Exigir `contagem: 2` na série `equipe`, somando o e-mail com conta e o sem conta. Como alternativa, um teste de ordem na integração, com A e B concorrendo, em que o pedido de matrícula inexistente da A é atendido na vez da A.

**Recomendações (não bloqueiam):**
- **503 em `login.duracao`.** Nenhum teste prova que `login.duracao` registra o 503 do semáforo. O denominador do alerta `login-hash-recusado` e o p95 de `login-lento` dependem disso. Sugiro um teste de unidade de `duracao-do-login.ts` com a tarefa lançando erro, ou conferir na integração `:157-181` que a contagem de `metodo=matricula` sobe 6 depois dos 503.
- **Escola barulhenta na integração.** Hoje ela está provada só na unidade. Sugiro um teste com a A lotada (hash preso e fila da A cheia) e um login da B atendido antes dos que estão na fila da A.
- **Asserção sobre IP em `semaforo-de-hash.test.ts:253`.** Ela procura o IP dentro do JSON dos rótulos. É válida, mas ficaria mais direta como a da integração: comparar os valores dos rótulos com um conjunto proibido.
- **Número do Retry-After em `semaforo-de-hash.test.ts:218`.** O teste repete os números 2 e 6 no lugar das constantes `RETRY_AFTER_MINIMO_S` e `RETRY_AFTER_MAXIMO_S`, que o mesmo arquivo já importa.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 16:15:01 · `tasks/prd-identidade-e-tenancy/14_task.md`

VEREDITO: APROVADO

Cenários exigidos: vale o mesmo conjunto da 1ª rodada.
- Borda: quem espera a vez do hash por mais de 2 s recebe 503 com Retry-After entre 2 e 6, e os 503 não contam como senha errada.
- Privacidade (regra 20, item 6): o balde não depende de a credencial existir.
- Borda de carga (regra 80, item 1): 35 logins do mesmo IP ao mesmo tempo, nenhum 429.
- Métrica por escola, sem rótulo de pessoa nem de IP.
- Isolamento: o balde de uma escola não é o de outra.

Cobertos:
- **Correção 1, feita** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/semaforo-de-login.int.test.ts`:
  - linha 270: login com uma matrícula que não existe, no endereço da A;
  - linha 280: exige `contagem: 3` na série da A;
  - linha 281: exige `contagem: 2` na B;
  - linha 282: exige delta exato de 2 em `equipe`, somando o e-mail com conta (272) e o sem conta (273);
  - linha 283: exige delta exato de 1 em `desconhecida`, pelo endereço que não existe (274).
- **O teste agora falha sem a regra.** Se a matrícula inexistente pulasse o semáforo, ou caísse num balde que depende de a conta existir, a série da A ficaria em 2 e o teste quebraria. Se o e-mail sem conta saísse do balde `equipe`, o delta seria 1. As medições antes e depois deixam a conta exata, mesmo com outros testes do arquivo gravando nas mesmas séries.
- **Recomendação da rodada anterior, aplicada** (linhas 170 e 181): os seis 503 entram em `login.duracao{metodo=matricula}`, com delta exato de 6. A medição é feita depois que o login que está com a vez tomou o hash e antes de ele responder, então a conta não pega um sétimo ponto.
- **Teste de unidade do Retry-After** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.test.ts`, linhas 192-193 e 218): continua limitando o valor ao intervalo e exigindo inteiro.
- **`infra/scripts/ensaio-alertas.ts`** é código do ensaio, não teste. A mudança só reordena a restauração, em um `finally`, e não afrouxa nenhuma asserção. Fica com o `infra-guardian`.
- Não achei `.skip`, teste comentado nem mock que esconda a regra no diff. O hash é segurado por um controle do teste, e o semáforo, o Redis e o banco são reais.

Bloqueantes: nenhum.

Recomendações:
- `semaforo-de-hash.test.ts:192-193,218`: o teste passou a usar as constantes da própria implementação. Se alguém mudar `RETRY_AFTER_MINIMO_S` para 0, esse teste acompanha e continua passando. Hoje o 2 e o 6 da spec só estão presos pelo nome do teste de integração (linha 162), que não é asserção. Uma linha `expect([RETRY_AFTER_MINIMO_S, RETRY_AFTER_MAXIMO_S]).toEqual([2, 6])` resolve.
- `semaforo-de-login.int.test.ts:280-281`: o teste exige uma série por escola, mas não prova que a série da B não recebeu nada da A. Isso já decorre da contagem exata nas duas séries. Um comentário dizendo isso ajudaria quem ler o teste depois.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 16:42:15 · `tasks/prd-identidade-e-tenancy/14_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo foi gravado, e nenhuma migration mudou. O IP de quem entra por e-mail agora é usado só em memória, como subfila do balde "equipe" do semáforo. Matrícula, e-mail e senha continuam no mesmo caminho da 4.0 e da 11.0, só que agora dentro da vez do semáforo.

Fora da tabela de dados do docs/lgpd.md: nada gravado fica fora da tabela. O uso do IP em memória cabe na finalidade de segurança da linha "Registro de acesso à aplicação (IP, data e hora)", mas o documento não diz que o IP também é usado assim. Ver recomendação 1.

Autorização por objeto: ok. A tarefa não cria rota nem objeto consultável. O item que importa é "não encontrado e sem permissão respondem igual", e ele se mantém sob carga:
- O balde sai do endereço, ou é "equipe" para todo e-mail, antes de a credencial ser lida (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts:289`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:209`).
- O hash fixo de quem não existe também passa pelo semáforo (`matricula.service.ts:315`).
- O 503 tem corpo só com código, mensagem e `requisicaoId`, e não manda cookie.
- O teste `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/semaforo-de-login.int.test.ts:192` prova margem zero nos quatro grupos (matrícula que existe e que não existe, e-mail com e sem conta), com resposta idêntica tirando o `requisicaoId`. Se alguém pulasse o semáforo, o teste quebraria.

Logs: limpos. Nada novo em `senha/`, `login.service.ts` ou `matricula.service.ts` escreve log. A entrada do runbook manda consultar `registro_acesso` por IP só durante a investigação, e diz que o IP não vai para o `TODO.md`.

Métricas:
- `login.hash_espera` tem só o rótulo `escola_id`, com valor igual ao UUID da escola, `equipe` ou `desconhecida`.
- `login.duracao` tem só o rótulo `metodo`, e `login.hash_recusado` não tem rótulo.
- O teste em `semaforo-de-login.int.test.ts:289` confere que nenhum valor de rótulo, em métrica nenhuma, é matrícula, e-mail, id de aluno ou de usuário, ou IP.
- A lista `METRICAS_COM_ESCOLA` continua fechada, e um teste confere isso.

Auditoria: não se aplica. A tarefa não tem leitura por coordenação ou rede, exportação, nota, permissão nem saída de IA.

Envio externo: nenhum. Não há chamada a provedor de IA nem a terceiro. As métricas vão ao Prometheus e ao Grafana locais, sem dado pessoal.

Seed/fixture: sintético. Os testes usam matrículas aleatórias (`RA<hex>`, `ENSAIO…`, `ABAIXO…`), e-mails em `@escola.invalid`, IPs das faixas reservadas para documentação (TEST-NET), o nome "Pessoa sintética" e senhas `senha-sintetica-*`.

Pergunta de fechamento: a tarefa não guarda nada novo sobre o aluno e não envia nada para fora. A resposta à secretaria continua a mesma de antes desta tarefa.

Bloqueantes: nenhum.

Recomendações:
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`, acrescentar uma linha ou nota: o IP é usado só em memória, na vez do semáforo do login por e-mail, com finalidade de segurança, sem ser gravado nem virar rótulo, e é esquecido por instância. Hoje isso só está documentado no código e no 14_task.md.
2. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts:137-140`, o mapa `#ultimaVez` guarda IPs de quem já foi atendido até passar de 10.000 entradas, sem prazo. Não sai do processo, mas dá para limitar o tempo que um IP fica ali, por exemplo apagando as chaves de subfila sem ninguém esperando depois de alguns minutos. Isso deixaria a retenção explícita.
3. O aceite de convite gera hash fora do semáforo, como registrado nas notas da tarefa. Não há efeito sobre privacidade; o assunto é para o `infra-guardian` e a 16.0.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 16:42:27 · `tasks/prd-identidade-e-tenancy/14_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login

Rate limit: ok. O limite anônimo por IP e o contador por conta já existiam e não mudaram. O semáforo reparte a vez por escola e, no balde `equipe`, por IP. O teste de 35 logins do mesmo IP termina sem nenhum 429.

Fila e prioridade: ok. Cada escola tem o seu balde, e a vez passa de balde em balde. A espera tem prazo de 2 s, com 503 e `Retry-After` sorteado entre 2 e 6 s. Acima de 10.000 pedidos esperando, o pedido novo recebe o mesmo 503 na hora. Quem espera não segura conexão do banco, porque `naEscolaSemUsuario` só abre o contexto da escola e não abre transação.

Concorrência: protegida. O semáforo guarda estado só na instância, e isso é correto: ele protege a CPU e as threads daquele processo. A contagem de tentativas continua no Redis. A vez é pedida antes de a tentativa ser contada, então o 503 não vira `CONTA_SEGURADA`, e há teste que prova isso: o aluno recebe seis 503 e entra na sétima tentativa.

Índice e paginação: ok. Não há query nova.

Degradação de IA: não se aplica.

Migration: não se aplica.

Métrica e alerta: ok. Três métricas novas:
- `login.duracao{metodo}`
- `login.hash_espera{escola_id}`, com o rótulo sendo a escola, `equipe` ou `desconhecida`, nunca o IP
- `login.hash_recusado`, que nasce em 0

Os dois alertas têm entrada no runbook, painel e ensaio, e o teste de integração cobre também o caso abaixo do limiar.

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, "Login lento", causa 3: a entrada diz que espera baixa com login lento significa que o tempo está fora do hash (Postgres ou Redis). Só que o `contador.reservar` e a leitura da credencial rodam dentro da vez do semáforo (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:452-457` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts:532-537`). Com o Postgres ou o Redis lentos, a espera sobe em todos os baldes, com a CPU da API baixa, e nenhuma das causas descreve esse caso. A causa 1 pede CPU no teto e manda subir instância. Convém uma linha no runbook: espera alta em todos os baldes com CPU baixa aponta para o banco ou o Redis, não para capacidade.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts:140`: sob ataque com mais de 10.000 IPs, `#esquecerQuemNaoEspera` percorre o mapa inteiro a cada vez concedida, e `#maisAntigo` percorre todas as subfilas da `equipe`. Com cerca de 10 vezes por segundo por instância, o custo é aceitável. Vale medir o atraso do event loop sob inundação no cenário da 16.0.
- O aceite de convite gera hash fora do semáforo. A tarefa registrou isso como escolha e o volume é baixo. Fica anotado para a 16.0 confirmar que ele não entra na rajada das 7h30.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 16:42:49 · `tasks/prd-identidade-e-tenancy/14_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, infra)
Bloqueantes: nenhum

**Escopo.** As quatro subtarefas estão feitas, e nada da 15.0 entrou: não há rebaixamento por IP×escola nem limite por IP na rota de e-mail. Três arquivos da tabela "Arquivos previstos" ficaram diferentes do previsto, e as Notas da implementação explicam cada um:
- `hash-de-senha.ts` ficou onde a 4.0 o criou, fora de `senha/`.
- `infra/compose.carga.yml` não mudou; o valor fica para a 16.0.
- `apps/api/src/config.ts` não mudou; as variáveis novas entraram em `apps/api/src/sessao/configuracao-de-login.ts`.

**Tech Spec.** O que a seção 5 pede está implementado:
- Os baldes são resolvidos antes do semáforo e não dependem de a credencial existir: um por escola, `desconhecida` e `equipe` com a vez rodando por IP.
- O rodízio funciona como descrito.
- O prazo é de 2 s, com 503 e `Retry-After` sorteado entre 2 e 6 s.
- `LOGIN_HASH_CONCORRENCIA` e `UV_THREADPOOL_SIZE` são obrigatórias, sem padrão no código, e o boot confere o teto `UV_THREADPOOL_SIZE − 8`.

A seção 7c também está coberta (métricas, os dois alertas, `METRICAS_COM_ESCOLA` numa lista fechada). A seção 7c cita três métricas com `escola_id`, mas só `login.hash_espera` entrou; `login.falhas` e `login.prioridade_rebaixada` ficam para a 15.3, como as notas declaram.

Recomendações:
- **Ratificar na Tech Spec a extensão da vez no semáforo.** A seção 5 fala em limitar hashes. A implementação segura a vez também durante a reserva no contador e a leitura da credencial, para o 503 não contar como senha errada. Um efeito colateral: o login de conta já segurada agora espera a fila antes de receber o 429. A escolha está nas notas, mas mudou o fluxo da seção 5 e merece uma linha lá, como a 12.0 fez ("Ratifica…").
- **A configuração de teste não reflete as threads reais.** `apps/api/test/configuracao-de-teste.ts` pega `UV_THREADPOOL_SIZE=16` do `.env.example`, mas o processo do vitest tem 4 threads, como o próprio comentário em `apps/api/test/sessao-matricula.int.test.ts` reconhece. Nos testes, a conferência do teto confia num valor que não vale para o processo. Isso não afeta produção, porque o compose define a variável antes de o Node subir, mas vale anotar.
- **Um bloco repetido três vezes.** A sequência "reservar, depois ler a credencial, depois fazer o hash dentro de `semaforo.executar`, depois lançar se a conta estiver segurada" aparece em `login.service.ts`, em `matricula.service.ts#entrar` e em `matricula.service.ts#recusar`. Um helper que receba a leitura da credencial evitaria que os três caminhos divergissem na 15.0, que vai mexer exatamente aí.
- **O 503 do semáforo dispara também a "Taxa de erro 5xx".** O runbook já cobre isso no item 4. Se o painel de 5xx passar a gerar ruído na entrada das 7h30, vale considerar tirar esse 503 da regra de 5xx numa tarefa futura.

Arquivos principais: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/configuracao-de-login.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/grafana/alertas/login-lento.yaml`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/grafana/alertas/login-hash-recusado.yaml`.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 17:27:00 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** os dez da tabela do `15_task.md`. São eles: o caminho feliz sob ataque, a passagem pelo cookie, o isolamento entre A e B, a onda legítima de 30%, a rede com três escolas (180/min), o script contra o professor segurando só o `outro`, o Redis de fila parado, a validade e rotação do cookie, a privacidade do cookie e os alertas. Da 15.5 entram também o Redis travado no contador e no desafio, e o desafio somado ao `limite.seguro_ativo`. Das notas entram as regras que elas acrescentam: janela de 1 min com TTL, chave HMAC sem IP, 503 fora da contagem e endereço inexistente sem rebaixamento.

**Cobertos:**
- Os sete cenários de integração do `apps/api/test/ataque-de-senha.int.test.ts` provam a regra.
  - Sem o rebaixamento, sem a passagem pelo cookie ou sem o `conhecido/outro`, a ordem no hash muda e o teste fica vermelho.
  - Sem a escola na chave, o isolamento fica vermelho (a sua mutação confirma).
  - Sem o multiplicador da rede, a 61ª já seria rebaixada.
  - Sem a divisão pelas instâncias, a 52ª não seria rebaixada.
  - Sem o `espelhar`, a conta volta a entrar com o Redis fora.
- Cookie: `cookie-dispositivo.test.ts` cobre a chave antiga, a 51ª entrada e os 30 dias; o teste de integração cobre o login que falhou e a ausência do valor em log e em tabela.
- Unidade: `rebaixamento.test.ts` (limiar, cache, série, seguro) e `semaforo-de-hash.test.ts` (fim do balde, isolamento entre baldes, desistência pelo prazo, IP esquecido).
- 15.5: `CLIENT PAUSE` de verdade no contador e no desafio, com o aviso limitado a uma linha.
- Repository de rede por IP e contagem de alunos ativos, com isolamento e aluno transferido.
- Alertas: `for:`, expressão, limiar, disparo no ensaio e nenhum IP no rótulo.
- Não achei `.skip`, `.only` nem teste comentado. Nenhum provedor de IA é envolvido.

**Bloqueantes:**

1. **`apps/api/src/sessao/senha/contador-em-janela.ts:21-27, 72-111` não tem teste nenhum.** O `rebaixamento.test.ts:13-30` usa um contador falso (`JanelaDeTeste`), e os testes de integração usam IP e escola sorteados, então nunca percebem uma janela que não vence.
   - Sem o `PEXPIRE` do script, ou com a chave feita do IP em texto em vez do HMAC, todos os testes continuam verdes.
   - Isso deixa sem prova a regra 20 ("IP só em contador com TTL", que o `docs/lgpd.md` agora promete: "só o HMAC do IP, com prazo de um minuto"). Deixa sem prova também o "por minuto" da 15.1: sem TTL, uma escola ficaria rebaixada para sempre depois de dias de senhas esquecidas.
   - **Correção exigida:** um `contador-em-janela.int.test.ts` contra o Redis de fila real que prove:
     - (a) depois do primeiro `somar`, o PTTL da chave está entre 0 e 60.000 ms, e o segundo `somar` não o empurra;
     - (b) a chave tem o prefixo e não contém o IP nem o `escola_id` em texto;
     - (c) N chamadas de `somar` em paralelo (`Promise.all`) devolvem valores distintos de 1 a N (regra 80, item 7; quebra se alguém trocar o script por GET e depois SET);
     - (d) no seguro em memória (cliente desconectado, relógio injetado), a contagem volta a 0 depois de 60 s, com `doSeguro: true` e `proporcaoDoSeguro > 0`.

2. **A exigência da 15.5 "somá-lo ao sinal de seguro ativo" não tem teste** (`apps/api/src/sessao/seguro-do-login.ts:11-21`, `apps/api/src/sessao/sessao.module.ts:149-153`).
   - O `desafio.int.test.ts:79` só confere `consumo.proporcaoDoSeguro`, uma instância solta, e não o que chega ao `limite.seguro_ativo`.
   - O `ataque-de-senha.int.test.ts:443-444` fica verde mesmo tirando `ConsumoDeDesafio` ou `ContadorEmJanela` do `SeguroDoLogin`, porque com o Redis parado o contador de tentativas já dá 1 sozinho.
   - **Correção exigida:**
     - um teste de unidade do `SeguroDoLogin` provando que qualquer fonte sozinha em 1 leva o sinal a 1 e que vale a maior;
     - um teste com a aplicação montada em que só o desafio é recusado pelo Redis (por exemplo `app.get(ConsumoDeDesafio)` com `CLIENT PAUSE`, ou o "Redis fora" do `mfa.int.test.ts`). Nele, `app.get(SeguroDoLogin).proporcaoDoSeguro` (ou `limite.seguro_ativo` observado) tem que dar 1, com o `ContadorDeTentativas` e o `ContadorEmJanela` em 0.

**Recomendações:**
- **503 não conta como falha (escolha 2).** Falta teste de que o 503 do semáforo não chama `aoFalhar` nem soma em `login.falhas` (`conferencia-na-vez.ts:60-66`). É o que protege a rajada das 7h30; hoje só o cenário da 16.0 pegaria isso.
- **429 conta como falha (escolha 2).** Falta teste de que a conta segurada (429) conta para o IP naquela escola.
- **Endereço inexistente (escolha 5).** Falta teste de que ele não rebaixa ninguém e de que as falhas contam em `login.falhas{escola_id="desconhecida"}`.
- **Ataque de dentro com cookie próprio.** Falta um aluno com o `educa_dispositivo` da própria conta varrendo outras matrículas pelo mesmo IP e continuando rebaixado. A passagem vale só para aquela matrícula, e nenhum teste de integração quebra se o serviço aceitar "qualquer cookie válido".
- **IP em texto na memória.** O cache `#redes` do `limite-email-ip.ts:39` guarda o IP em texto, e falta teste de que ele sai em 1 min, como o `docs/lgpd.md` promete.
- **Para o `privacy-guardian`.** O seguro em memória do `contador-em-janela.ts:109` só varre acima de 10.000 entradas, então HMACs vencidos ficam na memória além do minuto que o `docs/lgpd.md` declara.
- **Risco de vermelho falso.** O teste da rede faz 181 pedidos em sequência e o caminho feliz faz 110, todos dentro da mesma janela de 60 s. Num runner lento, a janela pode vencer no meio.
- **Robustez do teste de privacidade** (`ataque-de-senha.int.test.ts:454`): ele depende dos cookies dos testes anteriores e falha se rodar sozinho. E `LIMITE_EMAIL_POR_IP = 60` (linha 23) repete o `.env.example`; melhor ler da configuração.
- **`ContadorEmJanela` com o Redis travado.** O `catch` dele não tem teste com `CLIENT PAUSE`; a 15.5 pediu só o contador e o desafio.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/contador-em-janela.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/seguro-do-login.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/sessao.module.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/rebaixamento.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.int.test.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 17:35:34 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Cenários exigidos: as duas correções da 1ª rodada.
- **Correção 1:** um teste de integração do `ContadorEmJanela` contra o Redis de fila real. Ele precisa provar quatro coisas:
  - (a) o prazo da chave fica entre 0 e 60 s depois do primeiro `somar`, e o segundo `somar` não o renova;
  - (b) a chave tem o prefixo e o HMAC, sem o IP nem a escola em texto;
  - (c) somas em paralelo dão os valores de 1 a N, cada um uma vez;
  - (d) o seguro em memória volta a 0 depois de 60 s, com `doSeguro: true` e proporção do seguro acima de 0.
- **Correção 2:** o desafio recusado entra no sinal de seguro ativo (15.5). Pede um teste de unidade do `SeguroDoLogin` e um teste com a aplicação montada em que só o desafio é recusado.

Também revisei o que o diff novo afeta: a varredura do seguro a cada janela, o `subirApi` com a montagem de produção e os testes novos de falhas.

Cobertos:
- **Correção 1 (a):** `apps/api/src/sessao/senha/contador-em-janela.int.test.ts`, teste de privacidade e janela.
  - O prazo fica entre 0 e 60.000 ms após o primeiro `somar`.
  - Depois de 50 ms, o segundo `somar` deixa o prazo menor que o primeiro. Se o prazo fosse renovado a cada soma, ele voltaria perto de 60.000 e o teste falharia.
- **Correção 1 (b):** o mesmo teste confere o formato da chave (prefixo e HMAC de 43 caracteres). Confere também que não há IP, escola nem prefixo do IP no texto, e que `KEYS *ip*` volta vazio.
- **Correção 1 (c):** são 20 somas em `Promise.all`, repartidas entre duas instâncias. É concorrência de verdade, e os valores ordenados dão exatamente 1..20. Sem o script atômico, algum valor se repetiria e o teste falharia.
- **Correção 1 (d):** o teste usa um Redis inexistente (porta 9) e relógio injetado.
  - O valor continua 3 até 59.999 ms e cai para 0 aos 60.000 ms, com `doSeguro: true` e proporção igual a 1.
  - `noSeguro` igual a 1 depois da soma seguinte prova a varredura a cada janela. Com a regra antiga (varrer só acima de 10.000 chaves) daria 2, e o teste falharia.
  - O teste extra com o Redis travado por `CLIENT PAUSE` prova que o cliente de produção corta nos 100 ms e cai no seguro sem responder "zero". Prova também que a contagem fica registrada nos dois lugares (o lado seguro, que rebaixa em vez de liberar).
- **Correção 2, unidade:** `apps/api/src/sessao/seguro-do-login.test.ts` prova que qualquer fonte sozinha em 1 leva o sinal a 1, que vale a maior e que sem nada no seguro o sinal é 0.
- **Correção 2, aplicação montada:** `apps/api/test/ataque-de-senha.int.test.ts:503-523`.
  - A aplicação sobe com a montagem de produção (`{}` no lugar de `MONTAGEM_DE_TESTE`), o Redis fica travado, e `ConsumoDeDesafio.consumir` recusa com `NAO_AUTENTICADO`.
  - O desafio fica com proporção 1, o contador de tentativas e o `ContadorEmJanela` ficam em 0, o `SeguroDoLogin` vai a 1 e `limite.seguro_ativo` é observado em [1].
  - Se o `ConsumoDeDesafio` saísse do `SeguroDoLogin` em `sessao.module.ts:150-153`, o sinal seria 0 e o teste falharia.
  - O teste depende de o `ConsumoDeDesafio` ser uma instância só, a mesma que o `SeguroDoLogin` recebe, e é assim que o módulo o fornece.
- **Testes novos de falhas (`ataque-de-senha.int.test.ts:466-501`):**
  - o 503 não conta na métrica de falhas nem no contador do IP na escola (os dois ficam em 0);
  - o 429 conta: são 6 falhas, 2 delas 429, e o contador do IP marca 6;
  - o endereço de escola que não existe conta 105 falhas em `desconhecida`, sem contador por IP e sem série de rebaixamento para `desconhecida` nem para `ESCOLA_DESCONHECIDA`.
- **Cookie usado por outra pessoa (linha 266):** o pedido com o cookie da aluna e outra matrícula termina no grupo rebaixado. A comparação da ordem do hash (linhas 275-279) falharia se o cookie valesse para qualquer matrícula.
- **Privacidade (linhas 525-553):** agora o teste faz os próprios logins e confere que pelo menos 3 cookies foram vistos, então não depende da ordem dos testes.
- **Guarda de runbook:** `tools/guardas/alerta-tem-runbook.test.ts` já lista os dois arquivos e títulos de alerta novos.
- Nenhum `.skip`, `.only` nem teste comentado. Nenhum mock esconde a regra: o espião do hash só segura a vez para controlar a ordem, e chama o hash real. Nenhum provedor de IA entra nesses testes.

Bloqueantes: nenhum.

Recomendações:
- A ligação de produção em `apps/api/src/main.ts:25` não é provada. Os testes 15.5 e de Redis parado chamam `observarSeguroDoLimite(..., app.get(SeguroDoLogin))` eles mesmos (`ataque-de-senha.int.test.ts:419` e `:509`). Se o `main.ts` voltasse a passar só o `ContadorDeTentativas`, nada ficaria vermelho. Uma guarda leve (teste de fonte ou de montagem do `main`) fecharia isso. Fica para o `/validar`.
- Em `contador-em-janela.int.test.ts`, a espera fixa de 50 ms entre as duas somas pode ficar mais robusta. Uma opção é comparar o segundo prazo com `primeiroPrazo - 1` ou garantir uma diferença mínima. Hoje funciona, porque o prazo é em milissegundos.
- O teste 15.5 trava o Redis de fila inteiro (`CLIENT PAUSE ALL`) por 3 s. Com o Vitest rodando arquivos de integração em paralelo contra o mesmo Redis, outro arquivo pode sofrer atraso. Não é um defeito deste arquivo, mas convém registrar no `/retro` se a esteira mostrar lentidão intermitente.

Não rodei nenhum teste nem contêiner, como pedido. A auditoria foi só pela leitura do código.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 17:56:23 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration nesta tarefa. As consultas novas leem tabelas que já existiam: `usuario`, que tem `escola_id`, e `rede` com `escola`, pelas colunas `rede.ips_saida` e `escola.rede_id`. Os contadores novos ficam no Redis. A chave do contador de falhas por IP é o HMAC de `escolaId|ip`. A chave do limite por IP do e-mail é o HMAC do IP, e isso é aceitável porque a tentativa acontece antes de haver escola.

Queries verificadas:
- `AlunosAtivosRepository.contar` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/alunos-ativos.repository.ts`): a escola vem de `exigirEscolaDoContexto()`, sem nenhum parâmetro. Sem escola no contexto, a consulta lança erro. Devolve só o número.
- `ResolucaoDeTenantRepository.escolasDaRedeDoIpDeSaida` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:359`): tem `@SemEscopo` com justificativa escrita. Está na lista do teste de unidade, que também confere o texto da justificativa. Devolve só a contagem, sem id e sem nome. O IP vem normalizado da borda e é comparado com parâmetro ligado (`${ip}::inet`), sem interpolação crua.
- `RebaixamentoPorEscola` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/rebaixamento.ts`): o `escolaId` vem da resolução do slug em `matricula.service.ts:85`, e a chamada roda dentro de `naEscolaSemUsuario(escolaId)`. O cache de tamanho usa essa mesma escola como chave, então o contexto e o parâmetro coincidem. Nenhum endpoint recebe `escolaId` do corpo ou da query. O slug é o identificador público do endereço, o mesmo usado antes desta tarefa.
- `LimiteDoEmailPorIp`: não lê dado de escola. Só multiplica o limite pelo número de escolas da rede do IP.

Teste de isolamento: presente e efetivo.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/alunos-ativos.repository.int.test.ts`, as escolas A (3 alunos) e B (40 alunos) têm contagens diferentes. Sem o filtro `escolaId`, as duas dariam 43, e o teste quebra. O caso sem escola no contexto também está coberto.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts:286`, a escola A leva 105 falhas por um IP e a B leva 1 pelo mesmo IP. Sem a escola na chave, a B chegaria a 106, acima do limiar de 100. O IP do ataque seria rebaixado também na B e a ordem do hash se inverteria, então o teste quebra.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`: a classe chega a 22 métodos `@SemEscopo`. A regra 10, item 9, prevê no máximo três por módulo. A exceção está registrada na Tech Spec, seção 6, mas o número cresce a cada tarefa. Vale levar ao `/retro` a ideia de separar essa fronteira por finalidade (credencial, convite, rede), para que cada parte volte a ter poucas exceções.
- O teste de `escolasDaRedeDoIpDeSaida` prova só a contagem. Um caso a mais, com uma escola de outra rede sem IP de saída ao lado de uma rede com IP, deixaria explícito que o `join` não soma escola de rede alheia. Hoje isso já está coberto de forma indireta pela última asserção.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 17:56:27 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Auditei só lendo o código, sem rodar teste nem contêiner, como pedido.

**Campos pessoais tocados:**
- **IP**, de três formas:
  - HMAC do IP (e da escola, na matrícula) nos contadores por IP, no Redis de fila e no seguro em memória, com prazo de 1 min.
  - IP puro só na memória da instância: subfila da equipe no semáforo, e cache de 1 min que guarda de qual rede é o IP de saída.
  - Consulta em `rede.ips_saida`, que devolve só o número de escolas.
- **Cookie `educa_dispositivo`**: continua sendo só lido. Esta tarefa não o alterou.
- **Número de alunos ativos por escola**: é um agregado, sem nenhum dado de pessoa.

**Fora da tabela de dados do docs/lgpd.md:** nada.
- A linha nova "Contadores por IP do login" tem finalidade, base legal e retenção de 1 minuto.
- O parágrafo "IP só em memória, no login" cobre o semáforo, o cache de rede e os contadores.
- Arquivo: /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md

**Autorização por objeto:** ok. A tarefa não cria rota nova.
- `AlunosAtivosRepository.contar` pega a escola do contexto (`exigirEscolaDoContexto`) e só é chamado dentro de `naEscolaSemUsuario(escolaId)`.
- `escolasDaRedeDoIpDeSaida` está marcado com `@SemEscopo`, tem justificativa e devolve só um número, nunca id nem nome.
- Rebaixamento, limite por IP e 503 do semáforo não dependem de a matrícula ou o e-mail existirem. As falhas continuam indistinguíveis: senha errada, identificador inexistente e conta segurada seguem pelo mesmo `ConferenciaNaVez.#falhar`.

**Logs:** limpos. Os avisos novos (`login.limite_por_ip_no_seguro`, `login.desafio_sem_redis`) não carregam nenhum dado e saem com espaçamento.
- As métricas levam só `escola_id` (ou `equipe`/`desconhecida`). `login.limite_email_ip` não tem rótulo.
- Os alertas e o runbook dizem explicitamente que não trazem IP, e que o IP não vai para `TODO.md`, e-mail nem chat.
- O teste de privacidade em `apps/api/test/ataque-de-senha.int.test.ts` confere que o valor do cookie não aparece em log nem em tabela, e que nenhuma métrica leva IP, matrícula, e-mail ou id de pessoa.

**Auditoria:** nada novo precisa dela. Não há leitura de dado de aluno por coordenação ou rede, exportação, alteração de nota ou de permissão, nem aprovação de saída de IA.

**Envio externo:** nenhum. Não há IA nem terceiro envolvido. O Redis de fila é interno e recebe só HMAC.

**Seed/fixture:** sintético. As senhas são `senha-sintetica-*`, os e-mails usam `@escola.invalid` e os IPs vêm da faixa de documentação.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O `docs/lgpd.md` diz "no máximo um minuto" para o IP no semáforo e no cache de rede, e o código não garante isso.
   - **Semáforo:** a limpeza só roda quando alguém recebe a vez (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts`, `#conceder`). O próprio comentário em `baldes-de-login.ts` admite "fora o intervalo até o login seguinte".
   - **Cache de rede:** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/limite-email-ip.ts`, `#varrer` só roda na próxima consulta de rede.
   - **Efeito:** numa instância parada, o último IP fica na memória até o próximo login. Não é gravado em lugar nenhum e o tamanho tem teto, então não bloqueia.
   - **Sugestão:** ajustar o texto ("até um minuto depois da última vez, ou até o próximo login quando a instância está parada") ou limpar por temporizador.
2. `escolasDaRedeDoIpDeSaida` converte o IP com `::inet`. Hoje a normalização da borda garante o formato, mas um IP malformado viraria erro 500 no login por e-mail em vez de 0. É assunto do `infra-guardian`, não de privacidade.

**Pergunta de fechamento:** o que esta tarefa acrescenta sobre um aluno é contagem com prazo de 1 minuto, guardada só como HMAC, e memória da instância. Nada disso é consultável por titular nem sai do sistema. O que já era guardado sobre o aluno e seus rastros não muda, e segue respondível pelos caminhos já existentes.

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-18 17:57:59 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: login | migration não | deploy não (login, Redis de fila, alertas)
Rate limit: por IP
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.controller.ts:12` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login-email.controller.ts:11`: as duas rotas de login levam `@RotaAnonima()`. Por isso `GuardaDeLimite` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/guarda-limite.ts:40-45`) as limita só por IP, com `consumirAnonima(ip)` e `LIMITE_REQ_IP_ANONIMO_MIN=3000`, e responde 429 `LIMITE_EXCEDIDO`.
   - **O problema:** o rebaixamento desta tarefa só age abaixo desse teto. Um script de aluno a 50 pedidos por segundo, de dentro da rede, gasta o limite do IP da escola. Daí em diante os 400 alunos atrás do NAT recebem 429 no login, e também no `/v1/escolas/:slug/acesso`. Com o cookie `educa_dispositivo` válido ou sem ele, o resultado é o mesmo. Isso é o oposto do objetivo da 15.0 ("perde prioridade no semáforo em vez de bloquear o IP") e da regra 80, item 1.
   - **Com Redis de cache fora:** `limiteDoSeguro` divide o teto por 2, e o IP da escola passa a ser barrado com 1.500 pedidos por minuto.
   - **O cenário da 16.0 já passa do teto:** a Tech Spec, seção 13 / linha 372, prevê 3.000 tentativas por minuto do IP da escola. Somadas às cerca de 840 contas que entram no primeiro minuto, dão uns 3.840 pedidos por minuto e estouram o limite.
   - **O teste não pega:** o teste "nenhum pedido desse IP recebe 429" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts:234`) fica abaixo do teto anônimo e não prova a regra.

   **Correção exigida:**
   - Estourar o volume de um IP em `/v1/sessao/matricula` e `/v1/sessao/email` não pode gerar 429 para outra pessoa atrás do mesmo IP. Duas saídas servem:
     - tirar as duas rotas do limite anônimo por IP e deixar a proteção com o semáforo, o rebaixamento e o contador por conta;
     - ou trocar, nessas rotas, a recusa do limite anônimo por rebaixamento.
   - A escolha fica registrada na Tech Spec, seção 5.
   - O semáforo precisa de um ajuste junto. Sem o teto anônimo, o limite global `MAXIMO_ESPERANDO` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts:141`) vira o próximo ponto de bloqueio: hoje ele recusa na hora o pedido normal, de qualquer escola, quando a fila está cheia. Com a fila cheia, ele precisa tirar primeiro um pedido rebaixado, para o ataque de uma escola não virar 503 imediato na outra.
   - Falta um teste de integração que prove o caso: um IP acima de `LIMITE_REQ_IP_ANONIMO_MIN` na matrícula da escola A. Nesse cenário, a aluna com `educa_dispositivo` válido, do mesmo IP, entra; nenhum pedido recebe 429 `LIMITE_EXCEDIDO`; e o login da escola B segue normal.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/rebaixamento.ts:86-94`: quando o cache do tamanho da escola vence, todos os pedidos que chegam durante a consulta vão juntos ao banco. Guarde a Promise em andamento no cache para cada escola fazer uma consulta só.
- Contagem por IP em IPv6: um atacante com um /64 troca de endereço e escapa do rebaixamento e do limite do e-mail. Avalie contar pelo prefixo /64 e registre a decisão na seção 13 da Tech Spec como risco aceito ou resolvido.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/limite-email-ip.ts:281`: se o banco falhar em `escolasDaRede`, o login por e-mail acima do limite recebe 500. Nessa falha, trate o IP como de rede nenhuma (0 escolas) e siga, com um aviso espaçado.
- O cenário `infra/k6/login-7h30.js` fica para a 16.0, como a tarefa prevê. Inclua nele o ataque acima do teto anônimo junto com os alunos no mesmo IP.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-18 18:03:03 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As sete escolhas estão registradas em "Notas da implementação" e nenhuma contradiz a seção 5 nem a 7c. A linha do `@SemEscopo` para "rede por IP de saída" já estava na seção 6, e a contagem passou para 22.
Portão local: `portão local: infra/test/metricas.int.test.ts mudou em 2026-09-18 18:02:24, depois do início do último (2026-09-18 16:14:26). Rode node tools/processo/portao-local.ts --infra de novo.`

Bloqueantes:
- Portão local sem carimbo válido. Esperei o processo do portão (PID 3260546) terminar e rodei o `conferir` de novo. Ele continua recusando.
  - Durante a revisão, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/metricas.int.test.ts:219-245` foi alterado às 18:02. A alteração inclui `login_falhas_total` e `login_prioridade_rebaixada` na lista fechada de métricas com `escola_id`. Esse arquivo não estava na lista de arquivos da tarefa, e o horário indica que a suíte infra da rodada anterior reprovou nesse teste.
  - A alteração em si está certa: acompanha a mudança em `METRICAS_COM_ESCOLA`. Mas a árvore mudou depois do último carimbo.
  - **Correção exigida:** rodar `node tools/processo/portao-local.ts --infra` até o fim, com as quatro suítes verdes, e confirmar com `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/15_task.md`. Na rodada nova, conferir que nada mais mudou além desse teste.
- No código não encontrei bloqueante. Conferi `conferencia-na-vez.ts`, `rebaixamento.ts`, `limite-email-ip.ts`, `contador-em-janela.ts`, as mudanças no semáforo (fila normal e fila rebaixada por balde, IP esquecido a cada minuto) e o espelho da conta segurada no seguro. Também conferi o `ConsumoDeDesafio` com rastro, o `SeguroDoLogin`, a opção `prazoDoRedisDeLoginMs` (o `main.ts` não a passa), o `AlunosAtivosRepository` com escopo, os dois alertas com runbook, o ensaio e a nota de IP em memória em `docs/lgpd.md`.

Recomendações:
- `apps/api/src/sessao/senha/semaforo-de-hash.ts:171`: a cada minuto, a roda também esquece o balde que está com um hash em andamento e ninguém esperando. O próximo pedido desse balde volta para `#vez - 0.5` e passa à frente de quem acabou de ser atendido. O comentário da linha 22 admite o efeito, mas ele vai contra o que a 14.0 fixou ("o balde com o hash em andamento vai para o fim da roda"). Vale um teste ou uma linha no runbook, se isso aparecer no cenário da 16.0.
- `rebaixamento.ts:168-176` e `limite-email-ip.ts:237-248` repetem o mesmo padrão de cache em memória com validade e teto. Se surgir um terceiro uso, vale extrair um cache com prazo em comum.
- No runbook, o item "4." aparece duas vezes na seção "Seguro de limite ativo" (linhas 100 a 102 do `docs/runbook.md` atual). Confira a numeração.

## test-engineer · 3ª rodada · REPROVADO · 2026-09-18 18:10:30 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: REPROVADO

**Cenários exigidos para esta rodada (a mudança do veto do infra-guardian e as recomendações aplicadas):**
1. Caminho feliz: acima do limite por IP, as rotas de login não recebem 429. A tentativa vai para o fim da fila, e quem traz o cookie de dispositivo mantém a vez. Vale para matrícula e para e-mail.
2. O login lotado não gasta o limite das outras rotas anônimas do mesmo IP. A página de acesso continua respondendo.
3. As outras rotas anônimas continuam recebendo 429 acima do limite. O decorator novo não pode vazar para elas.
4. Borda da rede pública: e-mail de uma rede atrás de um IP, acima do limite anônimo e abaixo do limite da rota de e-mail vezes o número de escolas da rede.
5. Carga, com a fila do semáforo cheia: o pedido não rebaixado despeja um rebaixado, e o rebaixado que chega sai ele mesmo.
6. Escola barulhenta ao lado de outra: quem é despejado vem da fila com mais rebaixados, não da escola vizinha.
7. Leitura do tamanho da escola em voo único, com pedidos em paralelo.
8. Banco com erro na leitura da rede do IP: vale o limite simples, sem 500.
9. A roda do semáforo esquece só quem não foi visto no minuto anterior.
10. A lista fechada de métricas com `escola_id` inclui as duas métricas de login.

**Cobertos:**
- **Cenário 1, só na matrícula.** O teste `apps/api/test/ataque-de-senha.int.test.ts:312` é efetivo contra três remoções:
  - Com o 429 antigo, o 151º pedido quebra.
  - Sem o balde próprio `rl:ip-login`, a página `/acesso` recebe 429.
  - Sem `acimaDoLimiteDoIp` no service, o colega chega primeiro e a ordem fica invertida. O teste também afasta o rebaixamento por falhas (série indefinida).
- **Cenário 1, "sem 429" no e-mail.** Coberto pelo teste da `:365`: são 181 tentativas pelo mesmo IP com o limite anônimo em 150, e todas respondem 401.
- **Cenário 3.** Os testes de `apps/api/test/limite.int.test.ts` continuam esperando 429 na rota anônima de teste, então o decorator não vazou.
- **Cenário 5.** Coberto por `semaforo-de-hash.test.ts:332`.
- **Cenário 7.** Coberto por `rebaixamento.test.ts:133`, com 10 pedidos em paralelo de verdade.
- **Cenário 8.** Coberto por `rebaixamento.test.ts:201`. O teste também prova que o erro não fica guardado.
- **Cenário 9.** O teste que agora espera 4 quebraria sem `#vistoEm` (daria 3).
- **Cenário 10.** Coberto por `infra/test/metricas.int.test.ts`.
- Não há `.skip`, teste comentado, nem chamada a provedor de IA.

**Bloqueantes:**

1. **`apps/api/src/sessao/login.service.ts:105`: o rebaixamento do e-mail pelo limite por IP do login não tem teste.**
   - O código é `rebaixado = acimaDoLimiteDaRota || (!conhecido && origem.acimaDoLimiteDoIp === true)`. Se o segundo termo for apagado, nenhum teste falha.
   - O teste da `:365` passa das 150 tentativas, mas só confere o status 401 e a métrica do limite da rota de e-mail, que não enxerga esse caminho. Nenhum teste de unidade do `LoginService` passa `acimaDoLimiteDoIp`.
   - Esse ramo é o único que age numa rede com mais de 50 escolas atrás de um IP: 60 por escola passa de 3000, o limite anônimo de produção. É exatamente o caso de rede municipal.
   - **Correção exigida:** um teste de integração ou de unidade no e-mail em que o IP esteja acima do limite anônimo e abaixo do limite da rota vezes as escolas da rede. Por exemplo, com `LIMITE_REQ_IP_ANONIMO_MIN=150` e uma rede de 3 escolas (limite da rota em 180): a partir da 151ª tentativa, com a vez segurada, o pedido sem cookie vai para o fim da fila, o pedido com o cookie da conta passa na frente, e nenhum recebe 429.

2. **`apps/api/src/sessao/senha/semaforo-de-hash.test.ts:332`: o critério "despeja da fila com mais rebaixados" não é provado.**
   - O próprio código declara esse critério em `semaforo-de-hash.ts:65-66` e o implementa em `:166-170`.
   - No teste, todos os rebaixados estão numa única fila, a da `ESCOLA_A`. Se `#despejarUmRebaixado` pegasse o rebaixado mais antigo de qualquer fila, o teste continuaria verde.
   - Esse é o caso da escola barulhenta ao lado de outra: a escola C tem um aluno legítimo rebaixado, a A tem milhares de tentativas de ataque rebaixadas, e quem deve sair é da A.
   - **Correção exigida:** enfileirar primeiro 1 rebaixado de uma terceira escola e depois os rebaixados da A, até a fila encher. Aí afirmar que, quando chega o pedido não rebaixado, sai com 503 o mais antigo da A, e o da escola C continua esperando e é atendido quando chega a vez dele.

**Recomendações (não bloqueiam):**
- `matricula.service.ts:125`: o `baldeDaEscolaDesconhecida(origem.acimaDoLimiteDoIp === true)`, para escola que não existe, não tem teste. Vale um teste de unidade do semáforo ou do service com endereço inexistente vindo de IP acima do limite.
- `rebaixamento.test.ts:133`: o voo único usa `alunosAtivos` que resolve na hora, então só pega a leitura dupla pela ordem das microtarefas. Fica mais robusto com uma leitura que o teste solta à mão, afirmando 1 chamada antes de soltar.
- `rebaixamento.test.ts:201`: não verifica o aviso `login.rede_do_ip_sem_banco`, que é espaçado. Vale afirmar que ele sai uma vez em várias tentativas.
- `consumirDoLogin` com o Redis de cache fora (seguro em memória) não tem teste próprio. O caminho é o mesmo `#consumir` que já é testado, por isso fica como cobertura extra.
- Teste da roda do semáforo: vale incluir o caso que motivou a recomendação do revisor-geral, um balde com hash em andamento visto há menos de um intervalo e sem ninguém esperando, que continua na roda.

## test-engineer · 4ª rodada · APROVADO · 2026-09-18 18:22:30 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Cenários exigidos: os dois cenários que a 3ª rodada exigiu. Não reauditei o que não mudou.
1. O limite por IP do login rebaixa o pedido de e-mail sem cookie. O pedido com o cookie da conta passa na frente. Nenhum dos dois recebe 429.
2. Com a fila cheia, o pedido não rebaixado despeja o rebaixado mais antigo da escola com mais rebaixados, e não o mais antigo de todos.

Cobertos:
1. Correção 1 feita, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts:345-372`.
   - **Montagem:** `LIMITE_REQ_IP_ANONIMO_MIN=150` vem de `AMBIENTE_DO_ATAQUE` (linha 29), numa rede de 3 escolas. A entrada do professor mais as 149 tentativas levam o IP a 150. O pedido sem cookie é o 151º, e a rota ainda está abaixo de 180.
   - **Se o termo `!conhecido && origem.acimaDoLimiteDoIp === true` da linha 105 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts` for apagado, o teste falha.** Os dois pedidos ficam no mesmo balde `equipe`, sem rebaixamento. A fila então segue a ordem de chegada, e o hash roda o pedido sem cookie primeiro. A asserção `[SENHA, 'senha-sintetica-da-equipe-sem-cookie']` fica vermelha.
   - **A causa é o limite do login, não o da rota:** o teste confere que `rebaixadasNoEmail()` não anda.
   - **Nenhum 429:** o teste confere os status `[200, 401]`.
   - **Concorrência de verdade:** a vez fica segurada, os dois pedidos entram na fila com `naFila(1)` e `naFila(2)`, e só então a vez é solta. Não são duas chamadas em sequência.
2. Correção 2 feita, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.test.ts:333-369`.
   - O rebaixado da C entra primeiro, e os rebaixados da A enchem a fila depois dele.
   - **Se o critério fosse "despeja o rebaixado mais antigo de todos", o teste falharia:** o despejado seria `'503-C'`, e a asserção `['503-A0']` fica vermelha.
   - O teste também confere que a fila não cresce (`esperando === MAXIMO_ESPERANDO`).
   - Confere ainda que o rebaixado novo, chegando com a fila cheia, sai com 503 sem rodar a tarefa.
   - E confere que, depois da vez da B, a C é atendida (`entrou-C`).

Nenhum dos dois arquivos tem `.skip` nem `.only`. Nenhum mock esconde a regra: o semáforo é o real, e o teste de integração passa pela guarda e pelo serviço de verdade.

Não rodei os testes, porque o portão local estava rodando. Fiquei com o que você relatou: o teste novo verde isolado (13/13), a mutação na linha 105 deixando-o vermelho, e o arquivo do semáforo verde (18/18).

Bloqueantes: nenhum.

Recomendações:
- O título do teste em `semaforo-de-hash.test.ts:333` ainda diz "o rebaixado que espera há mais tempo". O critério agora provado é "o mais antigo da fila com mais rebaixados". Vale pôr isso no título, para o `/validar` e o `/retro` lerem o critério certo.
- Em `ataque-de-senha.int.test.ts:353`, o comentário diz que o IP chega a 150 "no balde do login". Isso depende da entrada do professor na linha 350 contar para o mesmo limite. Uma asserção explícita, ou um comentário dizendo que a 1ª requisição é a do professor, deixaria claro por que o laço começa em 1.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-19 11:38:52 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration desde a rodada aprovada. As consultas que estão no diff de trabalho já foram auditadas na 1ª rodada: `usuario` (contagem de alunos ativos, filtrada por `escolaId` do contexto) e `rede` com `escola` (número de escolas por IP de saída).

Queries verificadas:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/alunos-ativos.repository.ts:12`. O escopo vem de `exigirEscolaDoContexto()`. No `sessao.module.ts:127` a função `alunosAtivos` não recebe escola por parâmetro. Ela roda dentro de `naEscolaSemUsuario(escolaId)` em `matricula.service.ts:89`, e esse `escolaId` é o mesmo que chave `#tamanhos` e `#lendo` em `rebaixamento.ts:88-103`. A leitura em voo único é separada por escola, então a leitura em andamento da A não serve à B.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:359`, `escolasDaRedeDoIpDeSaida`. Tem `@SemEscopo` com justificativa e devolve só o número de escolas. Com erro do banco, `limite-email-ip.ts:72-79` vale 0 escolas, não guarda em cache e não põe o IP no log. Não revela nada ao cliente.
- `@LimiteQueRebaixa()` e `acimaDoLimiteDoIp` (`guarda-limite.ts:113-121, 139-143`): a marca é um `WeakSet` preso ao objeto da requisição e é posta só pela guarda. Nada vem do corpo nem da query string. O balde `rl:ip-login` é separado por IP, sem dimensão de escola vinda do cliente.
- Nenhum endpoint passou a aceitar `escolaId` do cliente. Na matrícula, a escola continua vindo do slug, resolvida no servidor.

Teste de isolamento: presente e efetivo.
- `semaforo-de-hash.test.ts:333`. Se o despejo tirasse o rebaixado mais antigo de todas as filas, em vez do mais antigo da fila com mais rebaixados, sairia o aluno da escola C, que chegou primeiro, e a asserção quebraria.
- `semaforo-de-hash.test.ts:156`. Se o rebaixamento mexesse na roda entre baldes, a ordem esperada `B-1, A-rebaixado-1, B-2…` quebraria.
- `rebaixamento.test.ts:95`. Se a escola saísse da chave de `#chave`, o IP rebaixado na A também seria rebaixado na B e o teste quebraria.
- O 503 do rebaixado despejado é o mesmo `INDISPONIVEL_TENTE_DE_NOVO` de qualquer espera longa. Ele não diz se a conta existe nem de que escola é.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/rebaixamento.test.ts:133`. O teste de voo único só usa a escola A. Falta um caso com a leitura da A e a da B em andamento ao mesmo tempo, com tamanhos diferentes, que prove que a B não recebe a promessa da A. Hoje, se `#lendo` deixasse de ser separado por escola, nenhum teste quebraria. O efeito seria só no limiar e não chega a nenhuma resposta, por isso fica como recomendação.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts` já tem vários `@SemEscopo` (slug, e-mail, rede por IP). A regra 10, item 9, pede que se discuta o desenho a partir do terceiro no mesmo módulo. As justificativas estão escritas e as consultas acontecem antes de haver escola. Vale registrar no `/retro` se o login anônimo deveria ter um repository próprio para as consultas pré-tenant.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-19 11:38:55 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A mudança nas duas rotas de login veio do veto do `infra-guardian`. Antes elas respondiam 429 `LIMITE_EXCEDIDO` acima do limite anônimo por IP. Agora levam `@LimiteQueRebaixa()`, contam num balde próprio (`rl:ip-login`) e só rebaixam a tentativa no semáforo. A decisão está registrada na seção 5 da `techspec.md`, a do IPv6 na seção 13, e as duas nas notas 8 e 9 de `15_task.md`. Não foi mudança em silêncio. O cenário de carga continua reservado para a 16.0.
Portão local: carimbo válido. O `conferir` saiu 0 com typecheck, lint, test e infra.
Bloqueantes: nenhum.

Correção exigida na rodada anterior:
- O carimbo agora vale para a árvore atual, com a suíte de infra.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/metricas.int.test.ts`: a lista fechada de métricas com `escola_id` passou a incluir `falhasDeLogin` e `prioridadeRebaixada`.
- Minhas recomendações foram atendidas. O semáforo não apaga pelo prazo quem foi visto no último minuto (`#vistoEm`). No runbook, a numeração de "Login lento", causa 4, e de "Seguro de limite ativo", causa 4, está em seções diferentes e está correta.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/guarda-limite.ts:53`: quando a guarda marca uma requisição de login acima do limite por IP (`rl:ip-login`), nenhuma métrica registra isso. No e-mail, o limite da própria rota (60 por minuto) está bem abaixo desse teto e já é medido. Na matrícula, o limiar de 100 falhas por minuto numa escola dispara antes dos 3000 por minuto. O furo real é o endereço de escola que não existe, que só é rebaixado por esse caminho e fica sem série. Um contador sem rótulo resolveria (regra 80, item 10).
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts:162-176`: o comentário e a Tech Spec falam em "balde com mais rebaixados", mas o código escolhe a subfila com mais rebaixados. No balde `equipe`, isso significa o IP com mais rebaixados, não o balde. O comportamento é razoável; o texto é que deveria dizer isso.
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`: "Login rebaixado numa escola" ainda descreve só o rebaixamento pelo limiar de falhas. Falta uma linha dizendo que o limite por IP das rotas de login também rebaixa sem acender esse alerta.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-19 11:39:00 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Esta rodada cobre só o que mudou desde a 1ª, que já estava aprovada. Li o código, não rodei testes nem contêineres. Todos os itens pedidos foram feitos, e nada novo quebra a regra 20.

**Campos pessoais tocados:** só o IP de quem tenta entrar. Ele é usado sem ser gravado, em três lugares:
- no balde `rl:ip-login:{ip}` do Redis de cache, que vive um minuto;
- na memória do semáforo, ligado à hora em que foi visto (`#vistoEm`);
- no cache que guarda quantas escolas a rede daquele IP tem.

Nenhum campo novo foi criado. Nenhum dado de aluno ou de equipe entrou.

**Fora da tabela de dados do `docs/lgpd.md`:** nenhum. O parágrafo "IP só em memória, no login" (`/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:65-78`) já cita o `rl:ip-login`. O prazo do semáforo ficou "até dois minutos, ou até o login seguinte com a instância parada", como a minha recomendação 1 pedia. Conferi no código: a roda só esquece quando concede uma vez, e isso fecha com o texto.

**Autorização por objeto:** ok. A guarda nova só age em rota anônima marcada com `@LimiteQueRebaixa()` e não abre objeto de ninguém. Quem passa do limite do IP vai para o fim da fila, e a resposta final não muda (401, 429 da conta segurada, ou 503 do semáforo). Por isso não dá para descobrir se a conta existe.

**Logs:** limpos.
- O aviso `login.rede_do_ip_sem_banco` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/limite-email-ip.ts:40`) não leva o IP.
- A métrica `login.limite_email_ip` não tem rótulo.
- A marca de "acima do limite" fica numa `WeakSet` presa à requisição e some junto com ela.

**Auditoria:** nenhuma ação desta mudança exige auditoria.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os testes usam IPs de faixa de teste (198.18.x.x, 192.0.2.x) e ids fixos.

**Correções pedidas na rodada anterior:**
- **Texto do IP em memória no `docs/lgpd.md`:** feito.
- **Esquecer o IP por prazo no semáforo:** feito e testado em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.test.ts:213-240`. O IP de antes some depois do intervalo, e quem espera ou está com a vez continua.
- **Seguro em memória varrendo a cada minuto:** feito e testado em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/contador-em-janela.int.test.ts:75-96` (`noSeguro` volta a 1).
- **Banco com erro vira 0 escolas, sem guardar o erro:** feito e testado em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/rebaixamento.test.ts`, no caso "falha: com o banco com erro na leitura da rede".
- **Limite do login sem 429 e com balde próprio:** coberto em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts:312` e `:345`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:75-76`, o parêntese sobre o `rl:ip-login` vem logo depois de "recebem só o HMAC do IP". Quem lê pode achar que essa chave também é HMAC, mas ela guarda o **IP como veio**: `criarLimite` usa o IP direto na chave (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/limitador.ts:120-131`). O seguro em memória desse limite, igual ao do F0, também guarda o IP como veio. Vale dizer isso com todas as letras, lembrando que é o mesmo modelo do `rl:ip` do F0.
2. O rate limit por IP do F0 (`rl:ip`) guarda o IP no Redis de cache e não aparece no mapa de dados do `docs/lgpd.md`. É anterior a esta tarefa, então fica para o `/retro`: registrar numa linha a finalidade de segurança e o prazo de um minuto.
3. Não há teste de unidade da guarda no nucleo para `@LimiteQueRebaixa()`. Hoje só o teste de integração da API cobre esse caminho. Um teste em `packages/nucleo` que mostre "passou do limite, marca a requisição e não recusa" deixaria a regra provada no próprio pacote.

**Pergunta de fechamento:** nada do que mudou grava dado nem envia dado a outro lugar. O IP só vive em memória e no Redis, com prazo e sem virar log, métrica ou auditoria. Quando for preciso investigar, ele continua sendo consultado no registro de acesso, que já está no mapa. A resposta à secretaria continua igual à da rodada aprovada.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-19 11:39:09 · `tasks/prd-identidade-e-tenancy/15_task.md`

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

A correção exigida na 1ª rodada foi feita, nas quatro partes:
- **Nenhum 429 por IP nas duas rotas de login.** As rotas levam `@LimiteQueRebaixa()` e contam num balde próprio (`rl:ip-login`). Acima do teto, `guarda-limite.ts:52-56` só marca a requisição e deixa passar. A página `/v1/escolas/:slug/acesso` continua no limite anônimo normal, que o login não gasta mais.
- **Registro na Tech Spec.** Está na seção 5, em `techspec.md:155`.
- **Fila cheia do semáforo despeja primeiro um rebaixado.** O ajuste está em `semaforo-de-hash.ts:460` e `:475-486`, com teste de unidade (`semaforo-de-hash.test.ts:333`).
- **Teste de integração.** `ataque-de-senha.int.test.ts:312` roda 150 logins pelo mesmo IP na matrícula da escola A. Todos respondem 200 e a página de acesso também. A aluna com cookie passa na frente do colega sem cookie, e nada recebe 429. Sem a correção, o teste falha no `/acesso` e no colega. A escola B normal está coberta em `:288`, e o e-mail de rede em `:345`.

Os 429 que ainda aparecem nos testes (`:434`, `:454`, `:550`) vêm da conta segurada por conta, não do IP, e isso está de acordo com a regra 80.

Recomendações:
- **Texto do despejo não bate com o código.** O comentário de `semaforo-de-hash.ts:388` e `:474` diz "balde com mais rebaixados". O código escolhe a maior subfila (`:478`). No balde `equipe`, onde cada IP tem sua subfila, um ataque que espalha IPs deixa subfilas curtas. Aí quem é despejado é o rebaixado de uma escola (fila única), que pode ser aluno de verdade atrás do NAT. Ou o comentário passa a dizer o que o código faz, ou o código passa a somar por balde.
- **Custo do despejo com a fila cheia.** `#despejarUmRebaixado` percorre todas as subfilas rebaixadas a cada chegada. Com 10.000 esperando espalhados por IPs na `equipe`, isso é O(n) por pedido no event loop, justo no pico. Vale guardar um contador de rebaixados por balde.
- **Rebaixamento pelo limite do IP sem métrica própria.** Os outros dois rebaixamentos têm série (`serieRebaixada`, `rebaixadasNoEmail`). Este não tem, e o 429 que antes aparecia na métrica HTTP agora não aparece em lugar nenhum. O operador vê a espera subir em `login.hash_espera` sem saber o motivo. Sugiro um contador `login.rebaixado_ip{escola_id|equipe}`, sem IP no rótulo.
- **Testes de unidade que faltam.** `baldeDaEscolaDesconhecida(origem.acimaDoLimiteDoIp === true)` em `matricula.service.ts:125`, e `consumirDoLogin` com o Redis fora, seguem sem teste próprio, como já anotado em `achados-revisoes.md:3236-3239`.

Arquivos:
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/guarda-limite.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/limitador.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/techspec.md

## test-engineer · 1ª rodada · APROVADO · 2026-09-19 14:47:35 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Rajada: 2.100 contas por um IP, 40% no primeiro minuto, 30% errando uma vez. Precisa de p95 abaixo de 1 s, zero 429 e nenhuma iteração perdida.
- Ataque de fora, a 3.000 por minuto, em matrículas da A e em e-mails com e sem conta. Nenhum 429 e nenhum 503 final para conta legítima. B e C dentro da margem.
- Ataque de dentro, saindo do IP da escola. A conta sem cookie entra em até 30 s, sem erro final.
- Conta da equipe atacada pelo script: o dono, com cookie, não recebe 429.
- Renovação em duas abas: nenhuma família encerrada, conferido no banco e na métrica de reuso.
- Redis de fila derrubado no meio do ataque: ninguém recusado e `limite.seguro_ativo` em 1.
- Nenhum rebaixamento fora de ataque, e rebaixamento só na A durante o ataque.
- Controle negativo: o cenário reprova pela proteção, com a base de pé.
- Permissão: a flag do controle negativo é recusada em produção.
- 16.5: com a fila cheia, sai um rebaixado e fica o pedido normal. Vale também quando o ataque vem espalhado por muitos IPs no balde da equipe.
- 16.5: a métrica `login.rebaixado_ip` conta essas tentativas.
- Bordas do domínio: matrícula repetida nas três escolas, escola atacada ao lado de escolas em uso normal, erro legítimo de senha nos primeiros dias de aula.

**Cobertos:**
- **Rajada:** os thresholds de `legitimo('rajada')` estão em `infra/k6/login-7h30.js:228-231`: `contas_que_entraram==2100` e `dropped_iterations==0`.
- **Ataques e Redis fora:** `legitimosSobAtaque()` em `infra/k6/login-7h30.js:163-194` põe 429 em zero e erro final em zero para os quatro grupos da A e da equipe. Para B e C, cobra p95 do login abaixo de 1 s e autenticadas até a margem sobre a base.
- **O ataque aconteceu de fato:** `ATAQUE_CHEGOU` impede que um atacante que não rodou deixe o cenário passar.
- **Renovação:** os thresholds `renovacao_409>0` e `renovacao_recusada==0` estão no k6. A conferência em `infra/scripts/conferir-carga-login.ts:114-126` lê `motivo='reuso_de_refresh'` no banco, e esse valor bate com `renovacao.service.ts:117`. Ela também lê a métrica de reuso, exigindo `ok>0` para a verificação não passar vazia.
- **Rebaixamento:** `julgarRebaixamento` exige a A em 1 em cada ataque, o que prova que a série existe, e nenhuma escola em 1 fora de ataque. O seguro em memória é conferido na fase `redis_fora`.
- **Veredito do controle negativo:** `julgarCenarioDeLogin` e `codigoDeSaidaDoLogin` são testados em `infra/test/carga-login.test.ts`. O teste cobre base que já reprovou, k6 com código divergente do resumo, fase que não rodou e conferência ausente. Em todos esses casos o controle negativo não conta como aprovado.
- **Despejo (16.5):** o teste em `apps/api/src/sessao/senha/semaforo-de-hash.test.ts:216` falharia com o código anterior. A maior subfila era a do NAT, com 3 esperando, e o código antigo teria despejado `professor-no-nat-0` e `C-1`. O teste da linha 254 falharia sem `#esquecerRebaixado` em `#proxima` ou em `#retirar`: sobraria uma entrada velha no índice, e a fila cresceria acima de `MAXIMO_ESPERANDO`.
- **Métrica `login.rebaixado_ip`:** coberta pela matrícula e pelo e-mail em `apps/api/test/ataque-de-senha.int.test.ts:509` e `:526`. O teste também prova que a aluna com cookie não conta.
- **Permissão:** coberta em `packages/nucleo/src/config/validar-config.test.ts:554-578` e `apps/api/src/config.test.ts:149`.
- **O semáforo certo em produção:** a escolha entre `SemaforoDeHash` e `SemaforoSemProtecao` fica protegida de forma indireta. Os testes de integração da 15.0 que conferem a ordem do hash quebrariam se a condição fosse invertida.
- **Sem provedor pago:** o teste confere que o k6 só chama quatro rotas e nunca o `oidc-falso`.
- **Execução real:** registrada, e o controle negativo reprovou pela proteção.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Cookie "sem atraso" no ataque de dentro (`infra/k6/login-7h30.js:187`).** O quadro de testes da tarefa diz "com cookie entrando sem atraso". Hoje `ate_entrar_a_com_cookie` é só informativo. Se a regra "o cookie passa na frente do rebaixado" fosse removida, o cenário ainda passaria: a conta com cookie esperaria como a sem cookie, dentro de 30 s. A regra está provada na integração da 15.0. Mesmo assim, vale um threshold por exemplo no p95 de `ate_entrar_a_com_cookie` no ataque de dentro. A alternativa é registrar a divergência na tarefa.
2. **p95 do login para a A sob ataque.** A seção 7c da Tech Spec diz "p95 do login abaixo de 1 s" sem exceção. O k6 isenta os grupos da A e da equipe nas fases de ataque, e justifica isso só num comentário (linhas 181-185). Essa exceção deveria estar escrita na seção 7c, com a divergência apontada, e não só no script.
3. **A premissa da conta da equipe atacada não é conferida.** O 429 do dono com cookie só prova algo se o ataque de fato segurou a conta pelo contador "outro". Vale conferir, ao menos na saída da execução, que o atacante recebeu 429 na `equipeAlvo`.
4. **16.5 no cenário.** A tarefa pede que a fase de ataque confira "nenhum 503 de despejo". A fila nunca enche no cenário, e o k6 não distingue o 503 de despejo do 503 de prazo, então essa conferência não diz nada. A prova real é o teste de unidade. Vale registrar isso como divergência explícita, e não só no texto do resultado.
5. **`login.rebaixado_ip` na escola desconhecida.** O caminho de `#recusar` em `apps/api/src/sessao/matricula.service.ts:127` conta a métrica, mas nenhum teste cobre esse caso (slug que não existe, IP acima do limite).
6. **Falta de `AMBIENTE` tratada como produção.** A leitura em `apps/api/src/sessao/configuracao-de-login.ts:83` trata `AMBIENTE` ausente ou inválido como produção, mas não há teste disso junto com a flag em `true`. Trocar `?? 'producao'` por outro valor não quebraria nenhum teste.
7. **Nenhum teste confere os thresholds do k6.** Não há conferência estática de que cada grupo e fase tem os thresholds exigidos. Se alguém apagar `...legitimo('a_com_cookie', ...)`, nada na esteira falha. É o mesmo nível do F0, então fica só como melhoria.
8. **Teste intermitente fora desta tarefa.** O `apps/api/test/sessao-externa.int.test.ts:433`, da tarefa 13.0, falha em cerca de 1 de 64 execuções. Encaminhar para `/corrigir`, como a nota da tarefa já prevê.

**Arquivos auditados:**
- /home/joaquimdp/Documentos/git/Educa.ia/infra/k6/login-7h30.js
- /home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/carga-login.ts
- /home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts
- /home/joaquimdp/Documentos/git/Educa.ia/infra/test/carga-login.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/config/validar-config.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/config.test.ts

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-19 14:49:39 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: login | deploy
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok

**Bloqueantes:**

`/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts:99-101`: a conferência "a A precisa chegar a 1 em cada ataque" só olha as fases que já têm alguma série no Prometheus (`new Set(maximos.map(...fase))`). Só que `login.prioridade_rebaixada` é um gauge que só existe depois do primeiro rebaixamento (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/rebaixamento.ts:57-63`, que só observa as escolas que estão em `#rebaixadaEm`).

- **O que falha:** se o rebaixamento parar de funcionar, a fase de ataque não gera série nenhuma e não entra no laço. A conferência passa calada justamente no caso que ela existe para pegar. O critério da 16.2 ("o rebaixamento só apareceu na A durante o ataque") e a linha "1 só na A, nos três ataques" da tabela de resultado ficam sem prova. Pela regra 40, uma checagem que não quebra quando a regra some é decoração.
- **O teste também não cobre:** o teste em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/carga-login.test.ts:233` só prova o caso em que existe série de outra escola na fase.
- **Correção exigida:**
  1. `julgarRebaixamento` passa a receber as fases de ataque que rodaram, tiradas de `janelas` em `conferirCenarioDeLogin`, e não do que o Prometheus devolveu. Para cada uma, exige A ≥ 1.
  2. Acrescentar em `carga-login.test.ts` o caso de uma fase de ataque executada sem nenhuma série, que precisa reprovar com "o ataque não rebaixou a escola A".

**Recomendações:**
- **Doc desatualizado:** `/home/joaquimdp/Documentos/git/Educa.ia/docs/infra.md` (seção 3.1) ainda diz "argon2id configurado para 100–250 ms" e "~dois núcleos", mas a calibração fixou 30 ms (`t=12`). Deixe lá um apontamento para a Tech Spec, seção 5, "Calibração", e para o desvio registrado. Hoje os dois documentos se contradizem.
- **Duração no runbook:** `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:437` diz "Leva uns 25 min", mas a execução registrada levou 19 min.
- **Timestamps da execução:** `infra/k6/login-7h30.js` e `infra/scripts/carga-login.ts` têm mtime 16:32:36 UTC, o mesmo minuto do início da execução registrada. Confirme que o resultado de `carga:login` saiu da versão final desses dois arquivos. Se houve edição depois, rode de novo antes do commit.
- **Despejo com a fila cheia:** a regra nova (o rebaixado mais antigo do balde com mais rebaixados) ainda pode despejar um professor sem cookie atrás do NAT, se ele for o rebaixado mais antigo da equipe. É o comportamento esperado, porque o 503 é repetido pela web, mas vale uma linha no runbook dizendo que "quem sai" pode ser legítimo sem cookie. Hoje ele só diz "nunca quem traz o cookie".
- **Alerta de 5xx sob ataque:** um ataque de mais de 5 min faz disparar a "Taxa de erro 5xx". Isso ficou só registrado na causa 4 do runbook. Reavalie na tarefa do alerta se o 503 com `Retry-After` do login deve ir para uma série própria.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-19 14:49:59 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência no critério "p95 do login abaixo de 1 s" (seção 7c, "Passa com"), afrouxado para as contas com cookie sem registro nem aviso
Portão local: carimbo válido

**Bloqueantes:**

1. `/home/joaquimdp/Documentos/git/Educa.ia/infra/k6/login-7h30.js:181-192`
   - **O que está errado:** o k6 tirou o limite de p95 de dois grupos, `a_com_cookie` e `equipe_com_cookie`, nas três fases de ataque:
     ```js
     ...legitimo('a_com_cookie', { p95: false }),
     ...legitimo('equipe_com_cookie', { p95: false }),
     ```
     O que pede cada documento:
     - A seção 7c da Tech Spec pede "p95 do login abaixo de 1 s", sem exceção.
     - A tabela de testes da tarefa pede, no ataque de dentro, "com cookie entrando sem atraso".
     - A seção 13, que o comentário do código usa como justificativa, só aceita atraso para os alunos da escola atacada "que ainda não entraram naquele navegador". Isso vale para quem está sem cookie, não para quem traz o cookie.

     O efeito aparece no próprio resultado da tarefa. Com o Redis fora, o aluno da A com cookie leva p95 de 1,26 s até entrar, com máximo de 7,4 s. No ataque de dentro recebe 503. Mesmo assim a linha foi marcada "(informativo)" e o cenário passou. O limite seria o que pega essa quebra da garantia do cookie. O p95 por requisição desses dois grupos nem aparece no registro.

     A mudança também não está entre as divergências registradas: a seção 5 da Tech Spec e as notas só citam o argon2 e o teto da concorrência.
   - **Correção exigida:** uma das duas.
     - Volte o p95 < 1 s para `a_com_cookie` e `equipe_com_cookie` nas fases de ataque. Se "sem atraso" deve valer do primeiro envio até entrar, ponha também um limite em `ate_entrar_a_com_cookie` e `ate_entrar_equipe_com_cookie`. Rode `npm run carga:login` de novo e atualize a tabela da tarefa.
     - Ou pare e reporte ao Joaquim. Se ele aceitar o atraso também para quem tem cookie, registre isso na seção 7c ("Passa com") e na seção 13 da Tech Spec, e na tabela de testes da tarefa, antes de marcar o critério como informativo.

**Recomendações:**

- **Tech Spec desencontrada da calibração.** A seção 5 da Tech Spec (`techspec.md`, linhas 170 e 172) ainda diz "sobe `t` até 100–250 ms" e traz a conta de capacidade "com 2 hashes de 150 ms, ~13/s". A seção 3.1 de `docs/infra.md` (linha 69) também fala em 100–250 ms. Tudo isso contradiz o "Fixado" de `t=12` (30 ms). Ajuste esses trechos para apontar a calibração.
- **Hash abaixo da faixa pede aval.** Fixar o hash abaixo da faixa (30 ms contra 100–250 ms) troca custo de ataque offline por vazão, e essa troca é do Joaquim. Ela foi reportada nas notas; vale ele confirmar antes do commit, ou registrar a decisão.
- **16.5 sem prova no cenário.** A tarefa pede que "a fase de ataque do `login-7h30` confere que nenhuma conta legítima recebe 503 de despejo". O cenário não confere isso: o resultado argumenta que a fila nunca chega a 10.000. Deixe isso escrito como "prova só na unidade", ou meça no cenário o maior número de pedidos esperando.
- **Token curto na renovação.** A fase de renovação força a renovação logo após o login, sem o "token curto" da seção 7c. O efeito é o mesmo; basta citar isso no comentário da fase.

## test-engineer · 2ª rodada · APROVADO · 2026-09-19 16:16:34 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: APROVADO

**Cenários exigidos (nesta rodada, só as duas correções exigidas e o que elas afetam):**
1. Uma fase de ataque que rodou, mas não deixou nenhuma série do gauge, precisa reprovar.
2. Nas fases de ataque, o p95 abaixo de 1 s volta para `a_com_cookie` e `equipe_com_cookie`. O cenário roda de novo, e o controle negativo reprova pela proteção.

**Cobertos:**
- **Correção 1 (infra-guardian): feita.**
  - Em `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts:97-107`, `julgarRebaixamento` recebe `fasesQueRodaram`, filtra as fases de ataque e cobra A em pelo menos 1 em cada uma, com ou sem série. Na linha 144, `conferirCenarioDeLogin` passa as fases a partir das janelas.
  - Em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/carga-login.test.ts:316-324`, com a lista de séries vazia, as três fases de ataque reprovam. A execução parcial sem ataque (`['base','rajada']`) não reprova. Se o laço sobre as fases das janelas for removido e o código voltar a iterar só as séries, esse teste falha.
  - As chamadas antigas (306-313) continuam cobrindo três regras: rebaixamento fora de ataque, rebaixamento de escola que não era a atacada e série de A em 0.
- **Correção 2 (revisor-geral): feita.**
  - Em `/home/joaquimdp/Documentos/git/Educa.ia/infra/k6/login-7h30.js:188-189`, `legitimo('a_com_cookie')` e `legitimo('equipe_com_cookie')` usam o p95 padrão. Os grupos sem cookie continuam com `{ p95: false }`, o que bate com a seção 13 da Tech Spec.
  - Em `infra/scripts/carga-login.ts:72-87`, `CRITERIOS_DA_PROTECAO` passou a incluir os dois p95. Assim, o controle negativo pode reprovar por eles, como diz o registro da execução das 18:10 UTC.
  - O cenário foi rodado de novo com a versão final (17:50 UTC), e o registro está atualizado no 16_task.md.
- **Métrica informativa `ate_entrar_*`:** o teste de `descreverFase` (carga-login.test.ts:248-263) cobre o filtro novo.
- **Arquivos reformatados:** não encontrei mudança de lógica além da descrita.

**Bloqueantes:** nenhum.

**Recomendações:**
- O teste em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/carga-login.test.ts:186-192` confere só se o nome do grupo aparece no script k6. Ele não confere se o limite existe. Se alguém voltar `legitimo('a_com_cookie', { p95: false })`, o teste continua verde, porque `'a_com_cookie'` ainda aparece no arquivo. Hoje isso só é provado pela execução real e pelo controle negativo. O teste deveria exigir que cada critério de `CRITERIOS_DA_PROTECAO` seja uma chave de `thresholds` em alguma fase de ataque. Uma forma é exportar ou avaliar `legitimosSobAtaque()`, ou extrair as chaves do script. Assim, o p95 com cookie deixa de ser removível sem teste vermelho.
- A divergência da 16.5, com o despejo provado só na unidade, já está registrada no 16_task.md. Ela deve seguir para o `/validar`.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-19 16:17:21 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum. A correção exigida na 1ª rodada foi feita:
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts:97-107`: `julgarRebaixamento` agora recebe `fasesQueRodaram` e exige A ≥ 1 em cada fase que rodou e que está em `FASES_DE_ATAQUE` (`ataque_fora`, `ataque_dentro`, `redis_fora`). A lista de fases vem das janelas e não das séries do Prometheus, então um ataque que não deixou série reprova.
- A chamada na linha ~144 passa `janelas.map((janela) => janela.fase)`.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/carga-login.test.ts:316-324` prova os dois lados. Com as três fases de ataque sem série, o teste espera três reprovações "o ataque não rebaixou a escola A". Numa execução parcial sem ataque, espera nenhuma.

Mudanças novas desta rodada, conferidas:
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/k6/login-7h30.js:188-189`: o p95 < 1 s voltou para `a_com_cookie` e `equipe_com_cookie`.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/carga-login.ts:72-76`: `CRITERIOS_DA_PROTECAO` inclui os dois. Assim, o controle negativo também reprova quando a regressão aparece em quem tem cookie.
- Os grupos sem cookie ficam sem p95. O prazo de 30 s continua valendo pelo `PRAZO_DA_WEB_MS` (linha 306): passado o prazo, a tentativa devolve `undefined`, que conta como `login_erro_final`, e esse erro tem o limite `count==0`.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts:43`: `FASES_DE_ATAQUE` repete a lista `FASES_DE_ATAQUE` de `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/carga-login.ts`. Convém exportar uma fonte só, para que uma fase de ataque nova não fique de fora da conferência sem ninguém ver.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts:102` (a checagem de A ≥ 1): o texto "o ataque não rebaixou a escola A" usa o nome fixo "A", mas a função recebe `escolaA` como parâmetro. É melhor interpolar o parâmetro na mensagem.

## revisor-geral · 2ª rodada · REPROVADO · 2026-09-19 16:17:49 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: portão local: infra/scripts/conferir-carga-login.ts mudou em 2026-09-19 15:48:28, depois do início do último (2026-09-19 15:48:28). Rode `node tools/processo/portao-local.ts --infra` de novo.

Bloqueantes:
- **Carimbo recusado para `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts`.** O arquivo foi salvo às 15:48:28.036 (hora local). O carimbo em `.processo/portao.json` começou às 18:48:28.076Z, 40 ms depois. Pelo relógio, o portão rodou sobre a versão final. Mas `avaliarCarimbo` (`tools/processo/revisoes.ts:205-206`) compara em segundos inteiros, e uma alteração no mesmo segundo do início conta como posterior. O `conferir` recusa o carimbo, e o hook de commit vai bloquear pelo mesmo motivo. Correção exigida: rodar `node tools/processo/portao-local.ts --infra` de novo, sem mexer em nada durante a execução, e conferir que `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/16_task.md` diz que o carimbo vale.

A correção que exigi na 1ª rodada foi feita:
- **Limite de volta.** Em `infra/k6/login-7h30.js:188-189`, `a_com_cookie` e `equipe_com_cookie` voltaram a ter o p95 < 1 s. Os grupos sem cookie continuam sem p95, o que bate com a seção 13 da Tech Spec. Os dois limites entraram em `CRITERIOS_DA_PROTECAO` (`infra/scripts/carga-login.ts`).
- **Cenário rodado com a versão final.** O log `/tmp/carga-16-v3.log` foi criado às 14:50:36 (hora local). `login-7h30.js` e `carga-login.ts` foram alterados pela última vez às 14:50:29, antes da execução. Os números da tabela da tarefa batem com o log (A com cookie 368/363 ms, equipe com cookie 314/290 ms). O controle negativo também reprovou pelos p95 novos.
- **Mudança posterior à execução.** Só `conferir-carga-login.ts` e o teste dele mudaram depois (15:48). A mudança de lógica foi a correção do infra-guardian (`julgarRebaixamento` recebe as fases das janelas). Confere com o que foi descrito.

Recomendações:
- **Hash abaixo da faixa ainda sem aval do Joaquim.** O hash ficou em 30 ms, abaixo da faixa de 100–250 ms. A premissa da seção 12 permitia que o cenário medisse o valor, desde que nunca abaixo da OWASP, e o desvio está registrado. Mesmo assim, a troca de custo de ataque offline por vazão é decisão dele. Levar isso a ele antes do commit.
- **Frase quebrada no comentário de `CRITERIOS_DA_PROTECAO`** (`infra/scripts/carga-login.ts`). A quebra de linha no meio de "É por eles, e só por / eles" ficou de sobra da reformatação.
- **Teste que não pega a volta do `{ p95: false }`.** Repito o que o test-engineer apontou: `infra/test/carga-login.test.ts` só confere que o nome do grupo aparece no script. Ele deveria exigir que cada item de `CRITERIOS_DA_PROTECAO` seja chave de `thresholds` numa fase de ataque. Assim, alguém voltar `{ p95: false }` deixa o teste vermelho.

## revisor-geral · 3ª rodada · APROVADO · 2026-09-19 16:45:43 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/16_task.md` responde "portão local válido para o código atual (typecheck, lint, test, infra)".
Bloqueantes: nenhum. Você corrigiu o que exigi na 2ª rodada: o carimbo agora vale para a árvore atual e a suíte de infra está incluída. Os arquivos alterados são os mesmos da rodada anterior. Só mudou `tasks/prd-identidade-e-tenancy/achados-revisoes.md`, que o hook do processo atualiza e que não é código.
Recomendações:
- O Joaquim precisa dar aval explícito ao parâmetro de hash, porque ele afeta o login.
- Há uma frase quebrada nos documentos. É a mesma que apontei na rodada anterior.
- Falta um teste que prove os limites de aprovação e reprovação da carga de login (os thresholds do k6) em `/home/joaquimdp/Documentos/git/Educa.ia/infra/k6/login-7h30.js` e `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts`.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-19 17:43:58 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** os da tabela da tarefa 17.0. São o caminho feliz do aluno desativado, o aluno transferido de A para B e a professora em A e B com a conta limpa só no fim. Depois vêm o isolamento da eliminação, a auditoria (RF19) e os limites do expurgo com relógio injetado. Por fim, o expurgo rodando duas vezes em paralelo, o expurgo que não apaga nada ainda no prazo, a redefinição do MFA (17.4: caminho feliz e isolamento) e a `saida` na troca de escola (17.5, também com o código recusado). Somo três cenários que vêm de decisões desta tarefa:
- o convite válido segura a conta;
- a desativação em paralelo da mesma conta em A e em B;
- o desafio do MFA na mão de quem foi desativado.

**Cobertos:**
- **Caminho feliz, transferido, professora em A e B, isolamento da eliminação, auditoria sem e-mail, nome nem matrícula, e as duas contas em paralelo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ciclo-de-vida.int.test.ts`, linhas 206 a 310 e 357 a 500). São efetivos: o isolamento quebra sem a escola em `travarUsuario`, e a concorrência quebra sem `travarConta`, como vocês já confirmaram por mutação.
- **Limites do expurgo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts`). Fica o registro de 6 meses menos 1 dia e sai o de 6 meses mais 1 dia. Nas sessões, 29 contra 31 dias. Sai a sessão só expirada, fica a encerrada há 29 dias com expiração de 45 dias, o que prova o `coalesce`. Convite usado, revogado e expirado dos dois lados do prazo. A linha "1 hora além do prazo" só sai com o corte do relógio injetado (a conta fecha: o `now()` do banco fica de 4,5 h a 29 h antes do relógio).
- **Expurgo:** idempotência, execução em paralelo com `Promise.all`, lotes, índices sem varredura da tabela, permissão (job de escola falha sem apagar nada) e a trilha agendamento → despachante → worker.
- **17.4:** a sessão cai com 401 pela coordenação e pelo operador. A de B não cai, nem a da conta com a redefinição recusada, e a auditoria não diz quantas sessões caíram.
- **17.5:** `saida` em A e `login` em B. Com o código recusado, nada é gravado em nenhuma das duas escolas.
- Sem `.skip`, `.only` nem teste comentado. Nenhum teste chama provedor de IA.

**Bloqueantes:**

1. **A limpeza da conta com convite só tem o caso do convite revogado.** Estão em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ciclo-de-vida.int.test.ts:312-338`. A consulta `limparContaSemUso` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`) trata como válido o convite que tem as três condições: `usado_em` nulo, `revogado_em` nulo e `expira_em > now()`. O teste só prova a do meio.
   - **Mutação que passa verde:** tirar `isNull(convite.usadoEm)` ou `gt(convite.expiraEm, now())`. Com isso, a conta nunca é limpa.
   - **Por que importa:** todo coordenador entra por convite (7.0), então todo coordenador desativado depois de aceitar ficaria com e-mail e hash de senha guardados para sempre. É exatamente o que a regra 20, item 18, e a 17.1 proíbem.
   - **Correção exigida:** no mesmo teste, acrescentar dois casos que terminem com `email: null, senha: false`. Primeiro, a conta cujo único convite em B **expirou** (não usado, não revogado, `expira_em` no passado). Segundo, a conta cujo convite em B foi **usado** e cujo usuário lá está desativado.

**Recomendações (não bloqueiam):**
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:226-230`: o comentário diz "nenhuma linha saiu duas vezes", mas a asserção é `toBeGreaterThanOrEqual`, que não prova isso. O que a regra pede já está garantido por `conferir()`. Ajustar o texto do comentário ou tirá-lo.
- Mesmo arquivo, linha 253: `rejects.toThrow()` é genérico. Melhor conferir que o erro é `FalhaDeJob` com `DADOS_INVALIDOS`.
- Faltam testes de concorrência em quatro pontos:
  - a mesma desativação em paralelo (clique duplo): uma dá certo, a outra dá `NAO_ENCONTRADO`, e sai um registro de auditoria só;
  - eliminação em A em paralelo com desativação em B da mesma conta;
  - no teste de concorrência da troca, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts:620-636`: uma `saida` só no registro de A;
  - o gatilho de autor (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0013_ciclo_de_vida.sql`) no `UPDATE OF escola_id/autor` e com o autor eliminado enquanto outra transação grava (o `for key share`).
- O teste de idempotência do expurgo exige 0 linhas apagadas na segunda passada. Se outra suíte gravar linha vencida no mesmo banco entre as duas passadas, ele pode falhar sem motivo. Conferir pelos ids semeados deixaria o teste imune a isso.

## test-engineer · 2ª rodada · APROVADO · 2026-09-19 17:45:38 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** a correção 1 da 1ª rodada. Uma conta sai da escola A e tem um convite em B. Se esse convite está vencido (não usado, não revogado, prazo no passado), a conta termina com `email: null, senha: false`. O mesmo vale quando o convite foi usado e o usuário em B foi desativado depois.

**Cobertos:**
- **Correção 1, feita.** O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ciclo-de-vida.int.test.ts:312-342`. Ele cobre os quatro estados do convite, cada um com uma conta própria:
  - `expirado`: `expira_em = now() - 1 hour`, sem data de uso nem de revogação.
  - `usado`: `usado_em` uma hora antes, com o usuário de B criado desativado agora.
  - `revogado`: `revogado_em = now()`.
  - `valido`: a única conta que mantém e-mail e senha.

  Conferi contra a consulta em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:311`, tirando mentalmente uma condição por vez:
  - Sem `isNull(convite.usadoEm)`, o caso `usado` passa a valer como convite pendente e o teste falha.
  - Sem `gt(convite.expiraEm, now())`, o caso `expirado` falha.
  - Sem `isNull(convite.revogadoEm)`, o caso `revogado` falha.
  - Sem a checagem de convite inteira, o caso `valido` falha.

  Cada estado é provado por um caso próprio. A mensagem da asserção leva o nome do estado, então a falha aponta qual deles quebrou.
- **Novo teste de clique duplo em desativar** (`ciclo-de-vida.int.test.ts:344-353`). As duas chamadas rodam de fato em paralelo, com `Promise.allSettled`. O teste exige uma chamada aceita e uma recusada, a recusa tipada como `NAO_ENCONTRADO` e uma única linha de auditoria. Isso prova a regra 80, item 7.
- **Troca de escola em paralelo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts:637`). O teste agora exige exatamente um registro de `saida` em A, da professora. Se a sessão de A fosse encerrada duas vezes, o registro sairia em dobro e o teste falharia.
- **Permissão do expurgo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:254-258`). O teste deixou de aceitar qualquer erro (`toThrow()`) e passou a exigir `FalhaDeJob` com `DADOS_INVALIDOS` e `definitiva: true`. Uma falha qualquer, por exemplo de banco, não passa mais por recusa de permissão. O comentário do teste de concorrência (linha 227) agora diz o que a asserção verifica.

**Bloqueantes:** nenhum.

**Recomendações:**
- No caso `usado`, o usuário de B é criado já desativado e só depois recebe o convite com `usado_em` no passado. A ordem no banco não é a do aceite real, mas não muda o que a consulta de limpeza avalia. Registrar para o `/validar`, sem ação.
- No teste de clique duplo, `esperarNaoEncontrado(Promise.reject(recusa?.reason))` funciona, mas é indireto. Comparar `recusa.reason` direto com `toMatchObject({ codigo: CodigoDeErro.NAO_ENCONTRADO })` seria mais legível.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-19 17:47:01 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** `conta` (agora aceita `email` nulo; é global por desenho, seção 3 da Tech Spec), `usuario`, `credencial_matricula`, `conta_externa`, `vinculo` (tem `escolaId` e `anoLetivoId`), `sessao`, `convite`, `registro_acesso` (ganhou o índice `(em)` para o expurgo), `auditoria`. A migration `0013_ciclo_de_vida.sql` não cria tabela nova. Ela troca as FKs compostas de `auditoria.autor_usuario_id` e de `vinculo.criado_por` por gatilho de restrição `AFTER`. O gatilho continua exigindo que o autor seja usuário da mesma `escola_id` do registro, com `for key share`, mesmo código de erro e mesmo nome de restrição. Nenhum id deixa de ser UUID.

**Queries verificadas:**
- `CicloDeVidaRepository` (`travarUsuario`, `desativar`, `apagarSenhaDaMatricula`, `apagarCredencialDaMatricula`, `apagarContaExterna`, `apagarSessoes`, `apagarVinculos`, `apagarUsuario`). Todas filtram por `exigirEscolaDoContexto()`. Nenhuma recebe a escola por argumento.
- `EscritaDeSessaoRepository.encerrarDoUsuario` filtra pela escola do contexto.
- `SessaoDeOrigemRepository.encerrarParaTroca` e a gravação de `saida` na origem rodam no contexto da escola de origem, com o usuário de origem. O registro de A não traz nada de B.
- Na `ResolucaoDeTenantRepository`, `encerrarSessoesDaConta`, `travarConta` e `limparContaSemUso` usam `@SemEscopo` com justificativa. Partem de `conta_id` lido do banco, nunca do cliente, e devolvem só contagem ou booleano. Isso está coberto pela seção 6 da Tech Spec.
- `ExpurgoDeAcessoRepository.apagarLoteVencido` usa `@SemEscopo` com justificativa. O critério é só o prazo, o job exige `rotinaDoSistema` e não devolve linha. O teste do decorator fixa a lista de métodos sem escopo.
- Nenhuma rota nova. Nada aceita `escolaId` do corpo ou da query.
- A camada de rede não é tocada.

**Teste de isolamento:** presente e efetivo.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ciclo-de-vida.int.test.ts`, A pedindo `eliminar(camilaEmB)` recebe `NAO_ENCONTRADO` e nada muda em B. Se a cláusula de escola sair de `travarUsuario`, a eliminação passa e o teste quebra.
- Desativar em A com usuário ativo em B preserva a conta e o login em B.
- `desligarContaExterna` com o id de B dá `NAO_ENCONTRADO`.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/mfa.int.test.ts`, redefinir em A não derruba sessão de B.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts`, os limites de prazo valem para todas as escolas, e só a rotina do sistema consegue expurgar.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts`, `contaLimpa` vai para o `depois` da auditoria de A. O valor depende do estado de outras escolas: `false` quando B ainda tem usuário ativo ou convite válido, como o teste da linha 291 confirma. A regra 20, item 6, e a regra 10, item 6, pedem que a resposta não revele a existência de registro de outra escola. Hoje isso não bloqueia: não há leitura de auditoria no F1, e a 6.0 já grava a recusa do MFA em A pelo mesmo critério. Mesmo assim, antes do F3 expor a auditoria à coordenação, decidam entre tirar `contaLimpa` da auditoria da escola ou mostrá-lo só ao operador. O `/validar` deve registrar essa decisão.
2. No mesmo arquivo de teste de ciclo de vida, só `travarUsuario` sustenta o isolamento de `apagarSessoes`, `apagarVinculos`, `apagarCredencialDaMatricula` e `apagarContaExterna`. As quatro filtram por `usuarioId`, que já é por escola, então tirar a cláusula de escola delas não deixa nenhum teste vermelho. A cláusula serve de defesa em profundidade. Vale um teste unitário da instrução gerada, como já existe para o expurgo, que confirme `escola_id` em cada `where`.
3. A `ResolucaoDeTenantRepository` chegou a 25 métodos `@SemEscopo`. É aceito pela seção 6 da Tech Spec, mas a próxima tarefa que acrescentar método ali deveria justificar por que ele não cabe num repository escopado.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-19 17:47:23 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** hash de senha da matrícula (apagado na desativação), `conta_externa` com provedor, `sub`, `oid` e `tid` (apagada na desativação e na eliminação), e-mail, senha, segredo TOTP e códigos de recuperação da conta global (apagados pela limpeza da conta), `usuario.nome` (sai com o usuário na eliminação), sessão, convite e `registro_acesso` (expurgo por prazo). A tarefa não cria nenhum campo pessoal. `conta.email` passou a aceitar nulo só para a conta limpa, em que sobra apenas o id.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. As linhas de identificador externo, hash, e-mail global, sessão, convite e registro de acesso foram atualizadas com a retenção nova. Não há campo proibido para aluno.

**Autorização por objeto:** ok.
- O F1 não tem rota nova.
- Toda escrita de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.repository.ts` filtra pela escola do contexto.
- Dão a mesma resposta `NAO_ENCONTRADO` o id de outra escola, o id inexistente, o usuário já desativado e o próprio usuário.
- A eliminação pedida por A não alcança nada de B, e a conta global só é limpa quando não serve a escola nenhuma. Há teste de isolamento para isso.
- A redefinição do MFA não informa quantas sessões encerrou.

**Logs:** limpos. O serviço de ciclo de vida não loga nada. O expurgo loga só `acesso.expurgado` com três contagens. A mensagem do gatilho `exigir_usuario_da_escola` é fixa e não leva nenhum valor.

**Auditoria:** presente.
- `usuario.desativado`, `usuario.eliminado` e `conta_externa.desligada` são gravadas na mesma transação da ação.
- `antes` e `depois` são objetos fechados (`strictObject`) só com ids, papel, datas, contagens e booleanos.
- Um teste confere que matrícula, nome e e-mail não aparecem no registro.
- A FK do autor virou gatilho, e com isso a auditoria continua existindo depois que o usuário é eliminado.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os e-mails são `@escola.invalid` e os nomes são "Pessoa sintética" ou "Lara Sintética".

**Pergunta de fechamento:** a consulta do titular por código fica para o F3, como a Tech Spec (seção 13) e a própria tarefa declaram. Esta tarefa não piora a resposta: `registro_acesso` e `auditoria` continuam com o `usuario_id` depois da eliminação, e o registro de `usuario.eliminado` diz o que foi apagado. Por isso não considerei a pendência um bloqueante desta tarefa. Ela continua valendo para o F3.

**Bloqueantes:** nenhum.

**Recomendações:**
1. No caminho da eliminação, `limparContaSemUso` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`, próximo da linha 318) encerra as sessões que sobraram com o motivo `desativacao`. Um motivo próprio, como `conta_limpa`, deixaria o rastro mais fiel.
2. `apagarContaExterna` informa na auditoria só a primeira ligação apagada. Se um usuário puder ter mais de uma ligação, vale registrar a contagem.
3. Convite pendente em outra escola segura o e-mail da conta, e isso está documentado. Vale deixar explícito no runbook que, para limpar a conta nesse caso, a escola precisa revogar o convite.
4. No F3, a consulta do titular deve juntar `registro_acesso` e `auditoria` pelo `usuario_id` eliminado, que não tem FK, para responder à pergunta de fechamento.

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-19 17:47:54 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: login | fila | migration
Rate limit: ok (a tarefa não cria rota nem limitador novo; o login continua com o limite por conta das 14.0 a 16.0)
Fila e prioridade: ok (`sistema.expurgar-acesso` entra na fila `lote` como não urgente, às 4h30 de São Paulo, só na réplica de lote, em lotes de 5.000 com `for update skip locked`)
Concorrência: protegida (o usuário e a conta ficam travados com `FOR UPDATE` na desativação e na eliminação; a troca de escola decide a corrida com o `update` condicional; o expurgo usa `skip locked`. Há teste com 5 contas em paralelo, com clique duplo e com dois expurgos ao mesmo tempo)
Índice e paginação: faltando
Degradação de IA: não se aplica
Migration: compatível (o `DROP NOT NULL` e o `CHECK` refeito só afrouxam a regra; os `CREATE INDEX` sem `CONCURRENTLY` são aceitáveis porque as tabelas nascem vazias no deploy do F1)
Métrica e alerta: ok (o job usa a telemetria genérica de fila do F0 e o log `acesso.expurgado` só com contagens; o alerta de rotina sem rodar é pendência anterior, já no `TODO.md`)

Bloqueantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:283`: `encerrarSessoesDaConta` faz `update sessao ... where conta_id = $1 and encerrada_em is null`, e `sessao` não tem índice por `conta_id`. Os índices dela são `refresh_hash_anterior`, `(escola_id, usuario_id)` e o novo `sessao_fim_idx`. A consulta é nova e varre `sessao` inteira, que cresce com aluno: um login por aluno por dia, mais 30 dias de retenção. A varredura roda dentro da transação que já segura `FOR UPDATE` na conta e no usuário. Isso acontece em toda redefinição de MFA (17.4) e em toda limpeza de conta chamada por `limparContaSemUso` na desativação e na eliminação de professor e coordenador (17.1). A partir do F2, a desativação da coordenação e a virada do ano vão chamar isso em série. Viola a regra 80, item 8.
  **Correção exigida:** criar em `packages/nucleo/drizzle/0013_ciclo_de_vida.sql` um índice parcial `sessao_conta_aberta_idx ON sessao (conta_id) WHERE conta_id IS NOT NULL AND encerrada_em IS NULL`, e declarar o mesmo índice em `packages/nucleo/src/db/schema/sessao.ts` com o snapshot regenerado. Acrescentar ao teste de plano um caso que prove que `encerrarSessoesDaConta` desce por esse índice, sem `Seq Scan`, como já fazem os lotes do expurgo em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:262`.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.repository.ts:133`: `travarUsuario` usa `FOR UPDATE`, que conflita com o `FOR KEY SHARE` da FK de `sessao`, `vinculo` e `credencial_matricula` e agora também do gatilho `exigir_usuario_da_escola`. A desativação não muda a chave do usuário, então `FOR NO KEY UPDATE` basta. A troca serializaria as duas desativações do mesmo jeito e deixaria de bloquear a criação de sessão e a gravação de auditoria que dependem daquele usuário. Também reduz a chance, pequena, de impasse entre desativar a mesma conta em A e em B e uma troca de escola dessa conta ao mesmo tempo.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`: o lote de `convite` não tem `order by` nem índice, e varre a tabela a cada lote. A tabela é pequena, um convite por coordenador, então não bloqueia. Vale registrar no comentário que o custo cresce com o número de convites, se o convite de professor passar a usar a mesma tabela.
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`: a seção "Rotina do sistema sem rodar" continua "a preencher". O expurgo do acesso aumenta o custo de a rotina parar, porque agora é descumprimento da LGPD. Vale subir a prioridade dessa pendência no `TODO.md`.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-19 17:48:03 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As escolhas desta tarefa estão registradas na techspec, seção 3 ("Autor") e seção 5 ("Ciclo de vida"), e não foram tomadas em silêncio. A troca da FK do autor por gatilho resolve a pendência que o `tenancy-guardian` deixou para a 17.0. O desligamento da conta externa estava previsto na seção 3 da techspec original.
Portão local: carimbo inválido. A mensagem do `conferir` é: "apps/worker/test/expurgo-de-acesso.int.test.ts mudou em 2026-09-19 17:44:29, depois do início do último (2026-09-19 17:14:29). Rode `node tools/processo/portao-local.ts --infra` de novo." O `portao-local.ts --infra` estava rodando quando conferi (saída em `/tmp/portao17.log`). Confira de novo quando ele terminar.

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:307` (`limparContaSemUso`), junto com `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts`.
   - **O que está errado:** a conta só é conferida no momento da desativação ou da eliminação. Se naquele momento ela tem um convite válido em outra escola, a limpeza é adiada, e nada volta a olhar essa conta depois.
   - **Quando isso acontece:** professora desativada em A enquanto espera um convite de coordenadora em B. Depois o convite de B vence ou é revogado. Ela não tem mais usuário ativo nem convite válido em escola nenhuma, mas a conta fica com e-mail e hash de senha para sempre. Nesse ponto o `CicloDeVidaService.desativar` recusa o usuário de B, que já está inativo, então a coordenação de B não tem como disparar a limpeza.
   - **O mesmo furo vale para** a conta criada pelo convite que nunca foi aceito.
   - **O que isso contraria:** o objetivo da tarefa ("a conta global some quando não resta usuário ativo em escola nenhuma"), a regra 20, item 18, e a retenção que esta própria tarefa escreveu em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:52` ("enquanto houver `usuario` ativo em alguma escola (ou convite ainda válido para um)"). O código cumpre essa frase só no instante da ação, não depois.
   - **Correção exigida:** a limpeza precisa voltar a olhar a conta quando o convite deixa de valer. O caminho natural é um passo no `sistema.expurgar-acesso` que limpa, em lotes, as contas com e-mail, sem usuário ativo e sem convite válido, reusando o mesmo critério de `limparContaSemUso`, com a conta travada.
   - **Junto com a correção:**
     - registrar o novo `@SemEscopo` na tabela da seção 6 da techspec e no teste de `sem-escopo.decorator.test.ts`;
     - ajustar a linha 52 do `lgpd.md`;
     - teste com relógio injetado: conta segurada por convite válido; o convite vence e a rotina roda; a conta termina com `email` nulo e sem senha; uma conta com usuário ativo em outra escola fica intacta.
   - **Alternativa, se o Joaquim preferir outro desenho:** parar e registrar a decisão com ele, mas não deixar a credencial guardada sem prazo.

2. Portão local sem carimbo válido para a árvore atual. Rode `node tools/processo/portao-local.ts --infra` depois da correção acima e confira com `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/17_task.md`.

Recomendações:
- A troca da FK do autor da auditoria e de `vinculo.criado_por` por gatilho (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0013_ciclo_de_vida.sql`) muda uma garantia estrutural da auditoria. Está registrada na techspec, mas vale ratificação explícita do Joaquim, como foi feito com o semáforo na 14.0. Também vale um teste de que o gatilho recusa `UPDATE OF autor_usuario_id` para um autor de outra escola; hoje só a inserção está provada.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`: `limparContaSemUso` encerra as sessões com o motivo `desativacao` também quando quem chamou foi a eliminação. Hoje não há diferença prática, porque a eliminação já apagou as sessões da escola dela, mas o motivo passaria a mentir se aparecer outro chamador. Vale receber o motivo por parâmetro.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts:95`: a guarda do próprio usuário depende de `toLowerCase()` sobre um id que o `z.uuid()` já validou. Normalizar o id uma vez só, no começo, deixaria a intenção mais clara.

## test-engineer · 3ª rodada · REPROVADO · 2026-09-19 17:53:47 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Conta segurada por convite:** a conta que um convite válido segurava é limpa quando o convite vence, segundo o relógio injetado, e também quando é revogado.
- **Contas que ficam:** a conta com convite ainda válido fica intacta, e a com usuário ativo em outra escola também.
- **Estado final da conta limpa:** sem e-mail, sem senha, sem segredo e sem segundo fator, com 0 códigos de recuperação e a sessão aberta encerrada como `conta_limpa`.
- **Idempotência:** a segunda execução devolve 0 no passo `conta`.
- **Lotes:** o passo `conta` também roda em lotes.
- **Permissão:** só a rotina do sistema roda o expurgo.
- **Índice `sessao_conta_aberta_idx`:** o plano não tem Seq Scan, e a chamada encerra só a sessão da conta; a segunda chamada devolve 0.
- **Concorrência:** a limpeza de conta rodando junto com a criação de convite para a mesma conta. Esta é a operação que pode acontecer duas vezes ao mesmo tempo, e o item 7 da regra 80 exige que o banco resolva.

**Cobertos:**
- **Correção do revisor-geral feita.** O teste de `apps/worker/test/expurgo-de-acesso.int.test.ts:259-308` quebraria se a regra saísse:
  - O convite `vencida` expira 1 h antes do `AGORA`, que é amanhã às 04:30, e depois do `now()` do banco. Se o corte usasse o `now()`, o teste falharia.
  - Se a condição do convite válido fosse removida, `aindaValida` seria limpa e o teste falharia.
  - Se `u.desativado_em is null` fosse removido, `ativaEmB` seria limpa e o teste falharia.
- **Idempotência:** com `['conta', 0]`, a partir da linha 226.
- **Lotes:** o passo `conta` entra na checagem, a partir da linha 250.
- **`@SemEscopo`:** o teste do decorador inclui o método novo.
- **Correção do infra-guardian feita:**
  - O índice parcial está no schema e na migration 0013, linha 16.
  - O teste de plano e de efeito está em `apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts:193-231`. Se `isNull(encerradaEm)` sumisse, a segunda chamada devolveria 1 e o teste falharia.
- **Gatilho do autor:** agora recusa também o `UPDATE`, com teste em `apps/api/test/ciclo-de-vida.int.test.ts`.

**Bloqueantes:**

1. **A limpeza em lote corre em paralelo com o reconvite e pode apagar a conta que acabou de receber convite. Não há teste de concorrência.**
   - **O comentário não confere.** `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:72-73` diz que "a criação de usuário para ela (convite, com a FK) espera o commit do lote". Isso não vale no reconvite de um coordenador que já existe inativo, e esse é justamente o caso que a correção quis cobrir.
   - **Por que o reconvite não trava a conta:** em `apps/api/src/sessao/convite.repository.ts:29-39`, `usuarioConvidado` faz upsert com `onConflictDoUpdate` e só troca `desativado_em`. Como não mexe em `conta_id`, o Postgres não checa a FK e não põe trava nenhuma na conta. `criarConvite` aponta para o usuário, não para a conta. E `contaParaConvite`, em `apps/api/src/sessao/resolucao-de-tenant.repository.ts:444-450`, faz `insert on conflict do nothing` seguido de `select` sem trava.
   - **O que acontece:**
     1. A transação do convite (`apps/api/src/sessao/convite.service.ts:156-165`) está aberta.
     2. A CTE do lote (`expurgo-de-acesso.repository.ts:76-103`) não enxerga o convite ainda sem commit.
     3. O `skip locked` não pula nada, porque a conta não está travada.
     4. As duas transações fazem commit.
   - **Resultado:** fica um convite válido ligado a uma conta sem e-mail. O aceite grava a senha nessa conta, e o coordenador nunca consegue entrar por e-mail. No caminho do convidado novo, o lote pode travar primeiro, então o insert do usuário espera a trava e segue com a conta já limpa, com o mesmo resultado.
   - **Correção exigida:**
     - Em `contaParaConvite`, travar a conta achada (`select ... for share` ou `for no key update`) e verificar de novo o e-mail depois da trava.
     - Se a conta foi limpa enquanto esperava, repetir o insert para criar uma conta nova.
     - O `skip locked` do lote passa então a pular a conta travada pelo convite, e a trava do convite passa a esperar o lote.
     - Corrigir o comentário das linhas 72-73.
     - Escrever teste de concorrência de verdade, com as duas transações abertas ao mesmo tempo, sem rodar uma depois da outra. Primeiro caso: uma transação manual segura o lote com a conta travada, `criarConviteDeCoordenador` roda para o mesmo e-mail, o lote faz commit, e o teste verifica que a conta do usuário convidado tem e-mail. Segundo caso: o convite segura a trava, o lote roda e devolve 0 para aquela conta.
   - **Alcance:** a mesma janela existe entre `limparContaSemUso` na desativação e o reconvite, e a mesma trava resolve as duas.

**Recomendações:**
- **Teste de plano:** em `resolucao-de-tenant.repository.int.test.ts:201-205`, o teste monta de novo a instrução do update em vez de usar a do repository. Se o `where` de `encerrarSessoesDaConta` mudar, o plano conferido deixa de ser o real. Vale expor a instrução, como `instrucaoDoLoteDeAcesso` faz.
- **Concorrência sem as contas:** o teste de concorrência em `expurgo-de-acesso.int.test.ts:231-241` não confere as contas. Vale semear uma conta a limpar e verificar que a soma de `conta` nas duas execuções é pelo menos 1 e que a conta termina limpa.
- **Lotes da conta sem amostra:** no teste de lotes, a partir da linha 243, o passo `conta` pode rodar só com `[0]`, porque não há contas semeadas nele. Vale semear três contas para provar que o laço de lotes roda de fato.
- **Sobras entre testes:** o teste da linha 259 não apaga as contas e os usuários que cria. Como a limpeza é global, um expurgo rodando ao mesmo tempo que testes da API no mesmo banco pode limpar uma conta de `equipeComEmail`, em `apps/api/test/sessao-de-teste.ts:122-129`, entre o insert da conta e o do usuário. Vale limpar as sobras ou garantir que os projetos de integração não rodam em paralelo no mesmo banco.

## test-engineer · 4ª rodada · APROVADO · 2026-09-19 17:59:22 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (correção da 3ª rodada):
- **(a)** A limpeza trava a conta primeiro. O convite para o mesmo e-mail espera, a limpeza faz commit, e o convite termina com uma conta que tem o e-mail.
- **(b)** O convite trava a conta primeiro. O lote real da madrugada roda no meio e não limpa aquela conta.
- Travar a conta achada e verificar de novo o e-mail em `contaParaConvite`. Se a conta sumiu, repetir o insert.
- Corrigir o comentário de `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`.

**Cobertos:** li o código e os testes, mas não rodei nada, por causa do portão com `--infra` que está rodando.
- **Código:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:449-457` trava a conta achada com `for no key update`. Se a leitura travada não acha o e-mail, volta ao insert, com até 3 tentativas. Esse lock conflita com o `for update of c skip locked` do lote, então o lote pula a conta travada. O comentário em `expurgo-de-acesso.repository.ts:72-74` foi corrigido e bate com o comportamento.
- **(b):** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts:241-265` é concorrência de verdade. A transação do convite fica aberta enquanto o `limparLoteDeContasSemUso` real roda. Há asserção sobre o e-mail antes e depois da liberação, e sobre `{ id: contaId, nova: false }`. A mutação relatada, tirar o `.for('no key update')`, deixa o teste vermelho, então ele falharia sem a regra.
- **(a):** `resolucao-de-tenant.repository.int.test.ts:267-288` abre as duas transações. Prova que o convite ainda espera antes do commit (Promise.race de 300 ms). Depois confere `nova: true`, um id diferente, o e-mail na conta nova e o e-mail nulo na conta antiga.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **O teste (a) não passa pelo laço de repetição.** No Postgres, o `insert ... on conflict do nothing` já espera sozinho a transação da limpeza, porque a versão antiga da linha, com o e-mail, continua no índice único até o commit. Depois do commit o conflito some e o insert cria a conta direto. O ramo "leitura travada não acha, volta ao insert" (`resolucao-de-tenant.repository.ts:453-455`) só roda quando a limpeza trava entre o conflito do insert e o `select`. Hoje nenhum teste passa por ele, e o teste (a) passaria também sem o laço. O resultado que a correção exigiu está provado. Fica para o `/validar`:
   - ajustar o nome do teste (a), que diz "não acha mais o e-mail", ou o comentário de `expurgo-de-acesso.repository.ts:73`, que descreve o mesmo caminho;
   - se der, provar o ramo de repetição com um teste que force essa janela.
2. **Erro sem tipo.** `resolucao-de-tenant.repository.ts:456` lança `new Error('conta do convite não achada nem criada')`. É uma invariante interna, mas a regra 00, item 9, pede erro de domínio tipado e com código.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-19 18:00:15 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** nenhuma tabela nova de domínio nesta rodada. Em `sessao` (já tem `escolaId`) entrou o índice parcial `sessao_conta_aberta_idx` sobre `conta_id` e o motivo `conta_limpa` nos dois lugares (constante e `check`). A `conta` continua global e sem escola, como a rodada anterior já tinha aceito.

**Queries verificadas:**
- `ExpurgoDeAcessoRepository.limparLoteDeContasSemUso` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:77-105`, `:133-140`): tem `@SemEscopo` com justificativa escrita e devolve só a contagem. Uma conta com usuário ativo em qualquer escola não é limpa. O convite válido só conta quando é do próprio usuário, na escola dele (`cv.escola_id = u.escola_id and cv.usuario_id = u.id`). Nenhum dado de escola sai da rotina.
- `ResolucaoDeTenantRepository.contaParaConvite` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:449-457`): a trava `for('no key update')` e a repetição do insert não mudam o que sai. Continua devolvendo só o id e se a conta é nova. A justificativa foi atualizada.
- `limparContaSemUso` e `encerrarSessoesDaConta` (mesmo arquivo, `:279-326`): alcançam todas as escolas só pelo `conta_id`, já verificado na escola do contexto. O resultado é um número ou um booleano e não aparece em resposta nem em auditoria de outra escola.
- `CicloDeVidaRepository.travarUsuario` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.repository.ts:26-34`): continua limitado a `escolaId` do contexto (`exigirEscolaDoContexto()`); só a trava mudou.
- `EscritaDeSessaoRepository.encerrarDoUsuario`: escopo de escola vindo do contexto.
- `sem-escopo.decorator.test.ts` fixa a lista exata de métodos com `@SemEscopo` no `ExpurgoDeAcessoRepository` e confere a justificativa de cada um.

**Teste de isolamento:** presente e efetivo. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:259`, a conta desativada em A mas com usuário ativo em B (`ativaEmB`) e a conta com convite válido em B (`aindaValida`) precisam continuar intactas. Se eu tiro mentalmente o `not exists` de usuário ativo, ou a correlação do convite com o usuário, o teste quebra. `ciclo-de-vida.int.test.ts:256` e `:312` cobrem o mesmo critério na desativação.

**Bloqueantes:** nenhum.

**Recomendações:**
- O comentário da classe `ExpurgoDeAcessoRepository` (linhas 107-112 do mesmo arquivo) ainda diz "é a única exceção ao escopo fora da resolução de tenant". Agora são dois métodos nessa classe e, somando `ExpurgoDeJobsRepository.apagarLoteVencido`, o módulo `retencao` chega a três `@SemEscopo`. A regra 10, item 9, trata a terceira exceção no mesmo módulo como sinal de problema no desenho. Todas são rotinas nossas e justificadas, mas vale registrar isso na Tech Spec, seção 6, e corrigir o texto do comentário.
- `contaParaConvite` (linha 456) lança `new Error` sem tipo depois de três tentativas. Isso não afeta o isolamento, mas contraria a regra 00, item 9. Fica para o `revisor-geral`.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-19 18:00:21 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: o e-mail de login da conta global, o hash de senha, o segredo TOTP e o passo do MFA, os códigos de recuperação e a sessão (novo motivo `conta_limpa`, novo índice `sessao_conta_aberta_idx`). Nenhum campo novo foi coletado. A mudança só apaga dados e amplia a retenção.

Fora da tabela de dados do docs/lgpd.md: nenhum. As linhas do e-mail global, do hash de senha, da sessão e do convite foram atualizadas com o critério "ou convite ainda válido" e com a limpeza de madrugada pelo `sistema.expurgar-acesso`.

Autorização por objeto: ok. Nenhuma rota nova. As operações de `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts` são rotina do sistema, marcadas `@SemEscopo` com justificativa. `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts` recusa a execução fora de `rotinaDoSistema`. Elas devolvem só contagens. `mfaDaConta` trata a conta limpa como credencial inválida, sem resposta distinguível.

Logs: limpos. O evento `acesso.expurgado` leva só números, entre eles `contasLimpasTotal`. O erro de `contaParaConvite` não carrega o e-mail.

Auditoria: presente onde a regra exige. A desativação e a eliminação, que originam a limpeza, já são auditadas. A limpeza de madrugada não é uma das ações da lista do item 10.

Envio externo: nenhum.

Seed/fixture: sintético. Os testes usam `equipe-<uuid>@escola.invalid` e o nome "Pessoa sintética".

Conferi o que o diff afeta:
- **Mesmo critério nos dois caminhos.** O lote `LIMPAR_LOTE_DE_CONTAS` usa a mesma regra de `limparContaSemUso`: nenhum usuário ativo e nenhum convite não usado, não revogado e no prazo do `agora` injetado.
- **Tudo apagado na mesma instrução.** No mesmo comando saem e-mail, senha, todas as colunas de MFA e os códigos de recuperação. As sessões abertas são encerradas com `conta_limpa`, e a linha da conta fica só com o id.
- **Corrida entre convite e limpeza.** O `FOR NO KEY UPDATE` em `contaParaConvite` conflita com o `FOR UPDATE OF c SKIP LOCKED` do lote.
  - Se o convite trava a conta primeiro, o lote pula essa conta. Depois do commit do convite, ele fica válido e segura a conta.
  - Se o lote trava primeiro, a releitura do convite (read committed) não acha mais o e-mail e cai no `insert`, que cria uma conta nova.
  - Não há caminho em que o e-mail de uma conta recebendo convite seja apagado.
- **Retenção.** A conta limpa depois da desativação não fica com credencial esperando indefinidamente. Isso fecha o item 18 da regra 20 no caso do convite pendente.
- **Pedido de secretaria sobre um aluno.** A resposta não muda: aluno não tem conta, e nenhuma sessão de aluno é alcançada pela limpeza, porque `conta_id` é nulo e está fora do índice parcial.
- **Minha recomendação 1 da rodada anterior** (motivo próprio para a limpeza) foi aplicada como `conta_limpa`, no enum, no check e na migration `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0013_ciclo_de_vida.sql`.

Bloqueantes: nenhum.

Recomendações:
1. **Relógio único na limpeza de madrugada.** O lote grava `encerrada_em = now()` nas sessões que encerra, mas o corte do convite usa o `agora` injetado. Para o teste com relógio conseguir provar também a data de encerramento, dá para usar o mesmo `agora` nos dois lugares. Não afeta a conformidade.
2. **Contagem para o `/validar`.** O nightly limpa conta sem registro por escola. Isso é aceitável, porque a conta é global e o fato que a originou já está auditado na escola. Vale deixar o `/validar` confirmar que o runbook explica como a escola vê essa contagem se perguntar.

## infra-guardian · 2ª rodada · REPROVADO · 2026-09-19 18:00:39 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: login | fila | migration
Rate limit: ok
Fila e prioridade: ok (lote às 4h30, na fila de lote, preso pela janela letiva)
Concorrência: corrida em /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:77-95
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok

**Correção exigida na rodada anterior:** feita. O índice parcial `sessao_conta_aberta_idx` está na migration 0013, no schema e no snapshot. O teste de plano está em `resolucao-de-tenant.repository.int.test.ts:212-216`: com `enable_seqscan=off`, o plano usa o índice e não tem Seq Scan. O `UPDATE sessao` do lote novo também usa esse índice. O `not exists` usa `usuario_conta_idx` e `convite_escola_usuario_idx`.

Bloqueantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:77-95` (`LIMPAR_LOTE_DE_CONTAS`), junto com `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:449` (`contaParaConvite`). A mesma instrução faz a checagem ("sem usuário ativo e sem convite válido") e a trava (`for update of c skip locked`). O problema é que, em READ COMMITTED, o `not exists` lê a visão do banco do começo da instrução. A trava só relê a conta quando a linha dela foi alterada, e o `contaParaConvite` apenas trava a conta com `FOR NO KEY UPDATE`, sem alterá-la.
  - A corrida: o lote começa a instrução. Uma transação de convite trava a conta, cria o usuário e o convite e faz commit antes de o lote chegar àquela linha. O lote então acha a linha livre, trava sem reler, não vê o usuário novo e apaga o e-mail, a senha e o MFA de uma conta que acabou de receber convite válido. O coordenador fica com um convite que não leva a login.
  - O teste atual, com as duas transações abertas, só cobre o caso em que a trava ainda está segura. O comentário "o lote nunca apaga o e-mail de uma conta recebendo convite" não vale para esse caso.
  - Correção exigida: separar a trava da checagem, na mesma transação.
    1. Primeira instrução: `select id from conta where email is not null ... order by id limit N for update skip locked`, que escolhe e trava as candidatas.
    2. Segunda instrução, com visão nova do banco depois da trava: reavaliar o `not exists` (usuário ativo ou convite válido no `agora`) só sobre os ids travados, e só então limpar a conta, apagar os códigos e encerrar as sessões com `conta_limpa`.
  - O caminho da desativação (`travarConta` e depois `limparContaSemUso`) já faz nessa ordem e está correto.
  - Teste exigido: um convite com commit depois de a instrução do lote começar e antes da trava daquela conta. Um jeito determinístico é travar as candidatas num passo, fazer o commit do convite noutra conexão e só depois rodar a reavaliação e a limpeza. O teste precisa mostrar que a conta mantém o e-mail e que ele falha na versão de instrução única.

Recomendações:
- O `LIMPAR_LOTE_DE_CONTAS` usa `now()` no `encerrada_em` das sessões e `agora` no critério. Usar `agora` nos dois deixa o teste com relógio injetado coerente com o expurgo de 30 dias.
- `contaParaConvite` lança `Error` genérico depois de 3 tentativas. A regra 00, item 9, pede erro de domínio tipado com código.
- O comentário da migration diz que as tabelas "nascem vazias". Registrar no runbook que, se a 0013 for aplicada separada do F1, `CREATE INDEX` sem `CONCURRENTLY` em `sessao` e `registro_acesso` trava escrita em tabela com dado.

## test-engineer · 5ª rodada · APROVADO · 2026-09-19 18:03:17 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

**Cenários exigidos (5ª rodada, o diff):**
- A correção do infra-guardian: um convite faz commit entre a trava do lote e a reconferência. A conta dele fica com o e-mail. Uma outra conta travada no mesmo lote é limpa.
- O teste precisa falhar na versão de instrução única.
- Em `contaParaConvite`, as três tentativas esgotadas lançam erro tipado (regra 00, item 9).
- O laço do processador continua terminando com a nova limpeza em duas instruções.

**Cobertos:**
- **Separação entre trava e reconferência:** feita em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`.
  - `TRAVAR_CANDIDATAS` (linhas 94-100) usa `for update of c skip locked`.
  - `LIMPAR_TRAVADAS` (linhas 102-117) repete `SEM_USO(agora)` sobre os ids travados, numa instrução seguinte da mesma transação (linhas 151-159). Em READ COMMITTED, essa segunda instrução enxerga o convite que fez commit na janela.
  - As sessões são encerradas com o mesmo `agora` do lote, como foi recomendado.
- **Teste determinístico:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:310-332`.
  - O gancho `depoisDeTravar` roda depois da trava e grava o convite por `bancada.pool`, que é outra conexão, com commit.
  - Não há risco de travamento mútuo. A chave estrangeira do convite aponta para `usuario`, e não para a `conta` travada.
  - O convite expira 3 dias depois do `AGORA` injetado, então vale no critério.
  - As asserções verificam o resultado: a conta reconvidada fica com o e-mail e a outra é limpa. Assim o teste também prova que a reconferência não barra a conta que continua sem uso.
  - Sobre a mutação que vocês rodaram: sem o critério na segunda instrução, a limpeza decide pelo que a trava viu no começo da primeira instrução, e isso equivale à versão de instrução única. O vermelho que vocês relataram é plausível pelo que li.
- **Erro tipado:** `resolucao-de-tenant.repository.ts:457` agora lança `ErroDeDominio(INDISPONIVEL_TENTE_DE_NOVO)`, que responde 503.
- **Laço do processador:** em `apps/worker/src/processadores/expurgar-acesso.ts:44-48`, quando a reconferência descarta alguma conta, o lote volta com menos que o limite e o laço termina. Não há laço infinito. As contas que sobrarem ficam para a noite seguinte, como diz a documentação.
- **Rodadas anteriores:** o que já estava aprovado não mudou fora deste diff. Os chamadores existentes (`resolucao-de-tenant.repository.int.test.ts:260` e o processador) continuam compatíveis, porque o gancho é opcional.

Não rodei nenhum teste, como foi pedido; a auditoria é só leitura de código.

**Bloqueantes:** nenhum.

**Recomendações:**
- **`expurgo-de-acesso.int.test.ts:331`:** `toBeGreaterThanOrEqual(1)` é fraco. Dá para afirmar que as duas contas foram travadas, por exemplo com um contador dentro do gancho ou lendo os ids travados. Hoje o teste só prova a janela se a conta reconvidada entrou no lote. Com `LOTE_DO_EXPURGO = 5_000` e o banco compartilhado, na prática ela entra, mas isso não fica declarado.
- **`resolucao-de-tenant.repository.ts:457`:** o caminho de três tentativas esgotadas não tem teste. É difícil de provocar, então basta um teste de unidade com o banco falso devolvendo vazio nas duas consultas, verificando o código `INDISPONIVEL_TENTE_DE_NOVO`.
- **`expurgo-de-acesso.repository.ts:150`:** o gancho `depoisDeTravar` só existe para o teste e fica na assinatura pública. Uma opção é movê-lo para um objeto de opções nomeado (`{ depoisDeTravar }`) com um comentário de uso exclusivo em teste, para ninguém passá-lo em produção por engano.

## tenancy-guardian · 3ª rodada · APROVADO · 2026-09-19 18:03:53 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta rodada. `conta`, `usuario`, `convite`, `sessao` e `codigo_recuperacao` só são tocadas pela limpeza de contas, com o mesmo critério da 2ª rodada.

Queries verificadas:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`
  - `TRAVAR_CANDIDATAS` (linhas 94-100) e `LIMPAR_TRAVADAS` (linhas 102-117) usam o mesmo `SEM_USO` (linhas 66-79).
  - O convite continua amarrado à escola do próprio usuário (`cv.escola_id = u.escola_id and cv.usuario_id = u.id`).
  - Os ids da segunda instrução vêm da trava feita no banco, nunca do chamador.
  - O método devolve só a contagem.
  - O `@SemEscopo` e a justificativa ficaram iguais, e as marcações seguem cobertas por `sem-escopo.decorator.test.ts:42-43`.
  - O gancho `depoisDeTravar` só é passado pelo teste (`expurgo-de-acesso.int.test.ts:325`). O processador `apps/worker/src/processadores/expurgar-acesso.ts:45` não o passa.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:449-458`
  - `contaParaConvite` recebe apenas o e-mail, e a conta é global, então o escopo não muda.
  - Depois de 3 tentativas lança o erro tipado `INDISPONIVEL_TENTE_DE_NOVO`. Esse erro não depende de dado de nenhuma escola e não revela que um registro existe.

Teste de isolamento: presente e efetivo.
- O teste novo está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:310-332`. Se a reconferência de `SEM_USO` sair de `LIMPAR_TRAVADAS`, a conta reconvidada é limpa e a asserção da linha 329 falha.
- O teste de borda das linhas 259-308 continua provando o critério por escola do usuário: a conta com usuário ativo em outra escola fica intacta.
- Pedido: não rodei testes de integração, porque o portão com `--infra` já está rodando. O veredito vem da leitura do código.

Bloqueantes: nenhum.

Recomendações:
- `expurgo-de-acesso.int.test.ts:331`: `toBeGreaterThanOrEqual(1)` é uma asserção frouxa. Se o teste reservar um estado isolado, `toBe(1)` fixaria que só a conta esquecida entrou na contagem.

## privacy-guardian · 3ª rodada · APROVADO · 2026-09-19 18:03:54 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: `conta.email`, `conta.senha_hash`, os campos de MFA (`mfa_segredo_cifrado`, `mfa_chave_versao`, `mfa_ativado_em`, `mfa_ultimo_passo`) e `codigo_recuperacao`. Todos só são apagados ou anulados. Nesta rodada nenhum campo foi criado e nenhum foi lido para ser devolvido.

Fora da tabela de dados do docs/lgpd.md: nenhum. O diff não traz campo novo.

Autorização por objeto: ok. Nenhuma rota nova. Os dois métodos do expurgo continuam `@SemEscopo`, com justificativa, e devolvem só contagens. `contaParaConvite` mantém o contrato anterior. Depois de 3 tentativas ele lança `ErroDeDominio(INDISPONIVEL_TENTE_DE_NOVO)`, um erro tipado que não leva o e-mail (/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:457).

Logs: limpos. O processador registra só os totais do `acesso.expurgado` (/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts:54).

Auditoria: presente. Nesta rodada não entrou ação que a regra 20, item 10, obrigue a auditar. A limpeza de credencial é rotina de retenção e não lê dado de aluno.

Envio externo: nenhum.

Seed/fixture: sintético. O teste novo de concorrência usa `equipe-<uuid>@escola.invalid`, `'Pessoa sintética'` e `'hash-sintetico'` (/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:314-315).

O que conferi no diff (/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:94-160):
- **Duas instruções numa transação.** A primeira trava as contas candidatas. A segunda confere de novo o critério de conta sem uso, só sobre os ids travados. Assim, um convite que faz commit no meio da limpeza não perde o e-mail, e o teste novo prova isso nas linhas 321-330.
- **O que é apagado não mudou.** Continuam saindo o e-mail, a senha, os campos de MFA e os códigos de recuperação. As sessões abertas são encerradas com motivo `conta_limpa`.
- **Mesmo relógio.** O `encerrada_em` usa o mesmo `agora` do lote, que era a minha recomendação 1 da 2ª rodada, agora aplicada.
- **Parâmetro só de teste.** O `depoisDeTravar` só existe para o teste abrir a janela entre a trava e a reconferência. Não expõe dado.
- **Lista de ids.** Os ids vêm do próprio banco e seguem como um único parâmetro de consulta, sem entrar no texto do SQL.

Correções exigidas na rodada anterior: nenhuma.

Bloqueantes: nenhum.

Recomendações:
1. `depoisDeTravar` é um gancho só de teste num método público de produção (linha 150). Para ninguém usá-lo depois fora de teste, vale deixá-lo `@internal` ou recebê-lo por uma dependência injetada.

Pergunta de fechamento: nesta tarefa, o código responde. A limpeza da conta deixa o id, que os usuários desativados continuam apontando, sem nenhuma credencial. Os prazos de retenção estão em constantes explícitas. Não há envio externo para rastrear.

## infra-guardian · 3ª rodada · APROVADO · 2026-09-19 18:03:55 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login | migration
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum

As duas exigências da 2ª rodada foram atendidas:

- **Trava e reconferência separadas.** Em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:150-159`, `limparLoteDeContasSemUso` abre uma transação. A primeira instrução, `TRAVAR_CANDIDATAS` (linhas 94-100), trava as contas com `for update of c skip locked`. A segunda, `LIMPAR_TRAVADAS` (linhas 102-117), confere de novo `SEM_USO(agora)` só nas contas já travadas (`c.id = any($ids)`). Como o Postgres está em READ COMMITTED, essa segunda instrução lê o banco de novo e enxerga o convite que fez commit depois da trava.
- **Teste determinístico.** O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:310-333`. O gancho `depoisDeTravar` grava, noutra conexão e com commit, um convite válido (`expiraHa: '-3 days'` quer dizer que vence daqui a 3 dias). A conta reconvidada mantém o e-mail e a outra conta do mesmo lote é limpa. Vocês informaram que a mutação deixa o teste vermelho. Não rodei o teste, porque o portão está com o Postgres pausado.

Outras conferências:

- **Único caminho que cria convite.** É `convite.service.ts:157`, e ele passa por `contaParaConvite`, que trava a conta com `for no key update`. Essa trava conflita com o `for update` do lote. Se o convite trava primeiro, o lote pula a conta (`skip locked`). Se o lote trava primeiro, o convite espera, lê a linha de novo, não acha mais o e-mail e cria outra conta. Nenhum outro caminho grava convite sem travar a conta, então não sobra janela depois da segunda instrução.
- **Três tentativas em `contaParaConvite`.** Depois delas sai `ErroDeDominio(INDISPONIVEL_TENTE_DE_NOVO)` em vez de `Error` cru (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:449-458`).
- **Transação curta.** Cada lote de contas é uma transação curta. O processador do worker em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts` roda os lotes um depois do outro, sem sobreposição dentro do mesmo job.

Recomendações:
- `expurgo-de-acesso.int.test.ts:332`: `expect(limpas).toBeGreaterThanOrEqual(1)` é uma asserção fraca. Ela passa com contas limpas de outros testes. Quem prova a regra são as asserções por conta das linhas 330-331. Vale isolar as contas do teste para poder exigir o número exato.
- `expurgo-de-acesso.repository.ts:104`: o array de uuid é montado juntando texto (`{a,b}`). Hoje é seguro porque os ids saem do próprio banco. Passar o array como parâmetro tipado evita que alguém copie o padrão para dado que vem de fora.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-19 18:32:36 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (a seção 5 descreve o desenho de duas instruções que o código implementa; seção 3 registra a troca da FK do autor por gatilho, seção 6 lista os dois métodos `@SemEscopo` em `retencao`)
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, test, infra)`; EXIT 0 em /tmp/portao17.log, início 2026-09-19T21:02:29Z, posterior à última edição de código, 18:02:21)

Bloqueantes: nenhum.

As duas correções exigidas na 1ª rodada estão feitas e conferem com o que se pediu:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:150` — `limparLoteDeContasSemUso` trava candidatas (`for update of c skip locked`), reconfere `SEM_USO` com a visão de depois da trava e só então limpa e-mail, senha, MFA, códigos e encerra sessões abertas com `conta_limpa`. O critério é o mesmo de `limparContaSemUso` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:308`), incluindo o convite válido que segura a conta. `@SemEscopo` justificado, refletido na techspec seção 6 e no `sem-escopo.decorator.test.ts`, e `docs/lgpd.md` (linha do e-mail global) descreve a limpeza tardia pelo `sistema.expurgar-acesso`.
- Os testes exigidos existem com relógio injetado: conta segurada por convite vencido/revogado limpa, conta com convite válido e conta com usuário ativo em outra escola intactas (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:259`), mais a janela trava→reconferência (`:310`) e as corridas limpeza × convite em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts:240`.

Condição a conferir antes do commit (não é achado meu, é o critério de conclusão da tarefa): na tabela "Revisões" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/17_task.md`, todas as rodadas registradas começaram até 17:58, antes da última alteração de código (18:02:21) — e `infra-guardian` não tem nenhuma rodada APROVADO. O desenho de duas instruções e o parâmetro de teste nasceram depois da 4ª rodada do `test-engineer`. Se as rodadas que estão correndo em paralelo comigo não cobrirem o código de 18:02, o hook barra o commit com razão.

Recomendações:
- `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:101` — `LIMPAR_TRAVADAS` monta o array de ids por concatenação de string (`{${ids.join(',')}}::uuid[]`). Os ids vêm do próprio banco, então não há injeção, mas o padrão do repositório em outros lotes é `id = any(array(...))`/parâmetro tipado; `= any(${ids})` com o array ligado evita o formato literal feito à mão.
- `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:150` — `depoisDeTravar` é um parâmetro de produção que só o teste usa. Funciona e está comentado, mas é um segundo jeito de abrir janela de corrida no projeto; um `Relogio`/gancho já existente ou um teste com duas conexões (como o de `resolucao-de-tenant.repository.int.test.ts:266`) deixaria a assinatura pública sem ponta de teste.
- `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:110` — a sessão é encerrada com `encerrada_em = agora` (relógio do worker), enquanto `limparContaSemUso` usa `now()` do banco para a mesma coisa. Duas fontes de hora para o mesmo campo; vale escolher uma.

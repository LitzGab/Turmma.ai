# Achados das revisões — `tasks/prd-identidade-e-tenancy/2_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

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

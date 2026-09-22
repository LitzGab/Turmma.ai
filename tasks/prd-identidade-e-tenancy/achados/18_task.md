# Achados das revisões — `tasks/prd-identidade-e-tenancy/18_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-19 20:36:14 · `tasks/prd-identidade-e-tenancy/18_task.md`

Auditei a tarefa 18.0 contra o que ela própria declara nas subtarefas e na tabela "Testes que provam a regra", contra as regras 40, 50, 20 e 80, e contra os casos de borda do domínio.

```
VEREDITO: REPROVADO
```

**Cenários exigidos:** caminho feliz por teclado e por toque nos dois projetos · token fora de `localStorage`/`sessionStorage`/cookie legível/URL · duas abas renovando ao mesmo tempo (concorrência real) · 409 `JA_RENOVADO` com espera maior que a janela · resposta de renovação perdida · 5xx e queda de rede sem logout, com formulário preservado · 503 do semáforo como "Entrando…" dentro do teto de 30 s · `CONTA_SEGURADA` em português · sem sessão, rota autenticada leva a `/entrar`; "Sair" encerra e o Voltar não traz dado · 360 px, axe e bundle · **etapas de login que não são `pronta` (coordenadora e professor com vínculo em duas escolas)** · **clique duplo em "Entrar" e em "Sair"**.

**Cobertos:** todos os dez da tabela da tarefa, com testes que falham se a regra sair — destaco `apps/web/src/api/sessao.test.ts:138` (a espera maior que `JANELA_DE_RENOVACAO_SIMULTANEA_MS` é medida, não presumida), `:173` (a renovação não sai enquanto outra aba segura a trava, com `maximoEmVoo` em 1), `:228` (5xx e sem rede mantêm token e estado), `e2e/entrar.spec.ts:100` (o token da resposta real é procurado em cinco lugares), `:128` (janelas de renovação não se sobrepõem entre três abas), `:222` (clique repetido em "Entrar" não manda dois logins) e `:262` (senha errada e e-mail inexistente dizem exatamente a mesma coisa). Nenhum `.skip`, nenhum teste comentado, nenhum `any`, nenhum mock de coisa nossa escondendo a regra — o e2e usa a API e o Postgres de verdade, com seed sintético em `.invalid`.

## Bloqueantes

**1. As etapas de login que não são `pronta` não têm nenhum teste, e a coordenadora cai numa delas hoje.**
`apps/web/src/caminhos.ts:21-26` (`ROTA_DA_ETAPA`), `apps/web/src/rotas.tsx:67-75` (as três rotas `EmConstrucao`) e `apps/web/src/paginas/Entrar.tsx:41` (`navegar(ROTA_DA_ETAPA[resposta.etapa])`) não são exercitados por teste nenhum. `apps/api/src/sessao/login.service.ts:147-148` já devolve `escolher` para conta com mais de um usuário ativo e `configurar_mfa` para coordenador sem MFA — ou seja, a compradora do produto e o professor de rede pública (regra 50, item 13; regra 60, item 8a) são exatamente quem passa por esse caminho. O único teste que toca etapa não-`pronta` é `apps/web/src/api/sessao.test.ts:357`, e ele prova só que nenhum token é guardado; se o mapa apontasse `configurar_mfa` para `/`, a pessoa entraria em laço com `/entrar` e nenhum teste ficaria vermelho.
*Correção exigida:* e2e contra a API real usando `criarEquipeComSenha('coordenador')` (o parâmetro existe em `e2e/__fixtures__/sessao.ts:60` e nunca é usado) provando que o login da coordenadora chega a `/mfa/configurar` com o texto de "em construção", não volta para `/entrar`, não mostra tela em branco e não deixa token em memória nem em armazenamento; e um caso equivalente para `escolher` (conta com usuário ativo em duas escolas — o fixture precisa passar a criar os dois vínculos) ou, se criar o segundo vínculo for da 20.0, ao menos um teste de rota provando que `/escolher-escola` renderiza a página de etapa. Os dois precisam falhar se `ROTA_DA_ETAPA` for alterado.

**2. `entrarPorEmail` obedece ao `Retry-After` sem nenhum limite, e o teto de 30 s declarado não vale.**
`apps/web/src/api/sessao.ts:250-252`:

```ts
const espera = erroDaApi(erro, CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)?.esperaSegundos
if (espera === undefined || Date.now() >= limite) throw erro
await esperar(espera * 1_000)
```

O orçamento é conferido **antes** de dormir, e o valor do cabeçalho não é limitado em nenhum dos lados. Com `Retry-After: 120`, a pessoa fica em "Entrando…" por dois minutos, contra o "por até 30 s antes de mostrar a mensagem" que a própria subtarefa 18.2 e a Tech Spec seção 9 declaram. Com `Retry-After: 0` — que `apps/web/src/api/cliente.ts:56` aceita, porque valida `segundos >= 0` — vira laço de repetição sem intervalo por trinta segundos contra `/v1/sessao/email`, justamente o endpoint que o semáforo está protegendo às 7h30 (regra 80, itens 1 e 4: o cliente que responde ao 503 sem freio transforma a defesa em amplificação, com a escola inteira atrás do mesmo IP). Que a nossa API hoje só mande 2–6 s (`semaforo-de-hash.ts:8`) e o Caddy mande 5 (`infra/Caddyfile:78`) não cobre o caso: o cliente não valida o que chega, e `formatarEspera` (`packages/shared/src/erros/mensagens.ts`) já teve o cuidado de nunca dizer "0 segundo" que o laço de repetição não teve.
*Correção exigida:* limitar a espera ao intervalo `[1 s, tempo restante até o limite]` e cobrir com dois testes de unidade em `sessao.test.ts` — `Retry-After: 0` não dispara a segunda chamada antes de 1 s, e `Retry-After` maior que o orçamento faz o erro subir dentro dos 30 s.

## Recomendações

1. `apps/web/src/rotas.tsx:51-53` — o comentário diz "recarregar `/entrar` com o cookie válido volta para o início", mas `abrirSessaoPeloCookie` só é chamado dentro de `Protegida` (`:22-24`); ao recarregar `/entrar`, o estado fica `desconhecida` e o formulário aparece para quem já tem sessão. Implementar e testar, ou corrigir o comentário.
2. `apps/web/src/componentes/Cabecalho.tsx:16-27` — a trava de clique duplo em "Sair" (`saindo`) não tem teste, enquanto a de "Entrar" tem (`e2e/entrar.spec.ts:222`). Mesmo caso, mesma tela compartilhada.
3. `apps/web/src/api/sessao.ts:222-223` — a guarda `usado !== token` não quebra nenhum teste se removida: a memoização de `renovacaoEmAndamento` mascara o efeito nos testes atuais. Um caso sequencial (chamada emitida com o token velho depois de a renovação já ter terminado) provaria a regra de "uma rotação por rajada".
4. `apps/web/src/api/sessao.ts:142-150` — o segundo 409 seguido (resposta perdida tentada ainda dentro da janela) não tem teste. Hoje ele termina em `indisponivel` com "Tentar de novo", e não no login como o texto da subtarefa 18.2 supõe; vale fixar o comportamento esperado num teste.
5. `e2e/entrar.spec.ts:136-163` — o atraso fixo de 1 s na renovação pode ser menor que o escalonamento natural entre as duas abas no perfil `chromebook` (CPU ×4, Fast 3G). Se as abas se afastarem mais de 1 s sozinhas, o teste passa até sem a trava. Disparar a segunda aba só depois de observar o primeiro pedido de renovação deixa a mutação determinística.
6. `e2e/entrar.spec.ts:178` — a queda de rede confere que o e-mail digitado ficou, mas não a senha; afirme os dois, que é o que a tarefa promete guardar.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/cliente.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/cliente.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/rotas.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/caminhos.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Entrar.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/Cabecalho.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/entrar.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/erros/mensagens.ts` e `mensagens.test.ts`.

## privacy-guardian · 1ª rodada · REPROVADO · 2026-09-19 21:21:19 · `tasks/prd-identidade-e-tenancy/18_task.md`

## VEREDITO: REPROVADO

**Campos pessoais tocados:** nenhum campo novo. Em trânsito/tela: e-mail e senha da equipe (`Entrar.tsx`), nome/papel/escola de quem entrou (`GET /v1/eu`, `Inicio.tsx`), token de acesso em variável de módulo (`api/sessao.ts`). Todos já constam do mapa de dados (`docs/lgpd.md` §2, linhas de "Nome, e-mail — professor, coordenador", "Hash de senha", "E-mail de login na conta global", "Sessão").

**Fora da tabela de dados do docs/lgpd.md:** nada. Nenhuma migration, nenhum campo novo.

**Autorização por objeto:** ok no que esta tarefa toca — a web não decide nada; `/v1/eu` e `/v1/sessao/*` são da 4.0/5.0 e não mudaram. `Protegida` não é controle de acesso, é navegação (o servidor continua sendo a guarda).

**Logs:** limpos. Nenhum `console.*` nem logger em `apps/web/src`; `ErroDaApi` carrega só o código, e o e2e prova que status, código e a mensagem da API não chegam à tela (`e2e/entrar.spec.ts`, teste "conta segurada").

**Auditoria:** presente onde a regra exige — login, renovação e encerramento são auditados na API (inalterados nesta tarefa).

**Envio externo:** nenhum. Não há chamada a provedor de IA nesta tarefa.

**Seed/fixture:** sintético. `e2e/__fixtures__/sessao.ts` cria rede/escola/conta próprias por teste, com nome inventado e e-mail no domínio reservado `.invalid`, direto no Postgres do compose de teste. Conforme regra 20, item 17.

---

### Bloqueantes

**1. `apps/web/src/componentes/Cabecalho.tsx:18-27` + `apps/web/src/api/sessao.ts:103-109` e `:269-277` — "Sair" não limpa o cache do TanStack Query, e a próxima pessoa a entrar no mesmo Chromebook vê o nome e a escola da anterior.**

`sair()` esquece o token e `encerrar()` navega para `/entrar`, mas nada toca o `QueryClient` criado em `apps/web/src/main.tsx:13`. A consulta `['eu']` (`apps/web/src/api/eu.ts:6`) permanece no cache com `nome`, `papel`, `escola.nome`, `escola.slug` e `acessos` — que inclui os **nomes das outras escolas** da conta (`packages/shared/src/sessao/eu.ts`). Com `gcTime` padrão de 5 min e `staleTime: 30_000` (`apps/web/src/api/cliente-de-consultas.ts:24`), a sequência é:

pessoa A entra → `Inicio` busca `['eu']` → A clica "Sair" (navegação SPA, sem recarregar a página) → pessoa B entra no mesmo formulário → `navegar(ROTA_DA_ETAPA.pronta)` monta `Inicio` → `useQuery(consultaEu)` devolve o cache de A com `isPending === false` e, dentro dos 30 s, **sem refetch nenhum**. A tela renderiza "Olá, \<nome de A\>" e "Você está em \<escola de A\>" para B.

É exatamente o cenário que os comentários do próprio código invocam ("o Chromebook do carrinho passa por quatro turmas") e, quando A e B são de escolas diferentes, é nome de pessoa de um tenant exibido a usuário de outro. O `clear()` do cache está previsto na Tech Spec §9 só para a troca de escola da 20.0; o fim da sessão ficou de fora.

**Correção exigida:** limpar o cache de consultas em todo encerramento de sessão — em `sair()` e também no `esquecerSessao()` de `chamarComSessao` (`apps/web/src/api/sessao.ts:215` e `:235`), não apenas no botão, já que a sessão também acaba por `NAO_AUTENTICADO` persistente. Com teste que prove: e2e na mesma aba, sem reload, com A saindo e B entrando, afirmando que `body` não contém `equipe.nome` nem `equipe.escolaNome` de A em momento nenhum depois da entrada de B.

**2. `apps/web/src/api/sessao.ts:270-276` + `apps/web/src/componentes/Cabecalho.tsx:22-26` — com a API fora, "Sair" leva à tela de entrada como se tivesse encerrado, mas o cookie de renovação continua válido e a sessão volta inteira com um F5.**

O cookie `educa_sessao` é `HttpOnly` (o e2e confirma): só o `DELETE /v1/sessao` o apaga, e só a API encerra a sessão no Postgres. Se a chamada falha (queda de rede da escola, 5xx, instância drenando), o `finally` esquece o token desta aba e o cabeçalho navega para `/entrar` sem dizer nada — a pessoa acredita que saiu. A próxima pessoa no mesmo computador só precisa abrir `/` para que `abrirSessaoPeloCookie()` renove pelo cookie e entre **como a anterior**. Não há teste cobrindo o caso: o e2e de "Sair" só exercita o caminho feliz (e o teste "permissão…" depende justamente de o `DELETE` ter funcionado).

**Correção exigida:** quando o encerramento não for confirmado pela API, não tratar como saída concluída — repetir a chamada e, persistindo a falha, manter a pessoa informada na tela ("não foi possível encerrar a sessão neste computador; tente de novo ou feche o navegador"), em vez de navegar em silêncio. Com teste e2e que, com o `DELETE /v1/sessao` falhando, prove que a tela avisa e que o produto não apresenta a saída como concluída.

---

### Recomendações

- `apps/web/src/api/sessao.ts:270-277`: `sair()` repropaga o erro do `DELETE` e `Cabecalho` o repropaga de novo dentro de `void encerrar()`, gerando rejeição não tratada. Ao corrigir o bloqueante 2, tratar o erro no lugar de deixá-lo escapar.
- `apps/web/src/paginas/Entrar.tsx:39`: a senha sai do estado ao receber resposta, mas no caminho de falha ela fica no campo por decisão explícita (teste do "sem rede"). Vale registrar essa escolha na Tech Spec §9, junto com o resto do comportamento de falha, para não ser relida como esquecimento numa tarefa futura.
- Fechamento LGPD ("o que o sistema guarda sobre um aluno e para onde foi"): esta tarefa não cria nenhum armazenamento novo, então a resposta segue a da rodada aprovada anterior. O item 19 da regra 20 continua pendente como entrega própria e deve aparecer em tarefa nomeada antes do piloto.

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-19 21:22:46 · `tasks/prd-identidade-e-tenancy/18_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: login
Rate limit: ok (por conta; o limite por IP da rota de e-mail só rebaixa no balde, nunca recusa)
Fila e prioridade: ok (nada de fila nesta tarefa)
Concorrência: protegida (Web Locks + promessa única por aba em `apps/web/src/api/sessao.ts:137,167`; duplo clique em Entrar/Sair travado e coberto por e2e)
Índice e paginação: ok (nenhuma query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (`login.hash_recusado` e `login.limite_email_ip` já cobrem o 503 que a web repete)

Bloqueantes:
- `apps/web/src/componentes/Cabecalho.tsx:22` e `apps/web/src/api/sessao.ts:104` (`esquecerSessao`) / `:270` (`sair`): o fim da sessão não limpa o cache do TanStack Query. O `QueryClient` é criado uma vez em `apps/web/src/main.tsx:13` e vive a página inteira; `consultaEu` (`apps/web/src/api/eu.ts:6`) usa a chave fixa `['eu']` com `staleTime: 30_000` e `gcTime` padrão de 5 min (`apps/web/src/api/cliente-de-consultas.ts:26`). Depois de "Sair" a navegação é client-side (`navegar(ROTAS.entrar)`, sem recarregar), então a entrada da pessoa seguinte no mesmo Chromebook do carrinho cai em `AreaAutenticada` → `Inicio` e renderiza o dado em cache da pessoa anterior: `Olá, <nome anterior>` e `Você está em <escola anterior>`, sem nem refazer a consulta durante os 30 s de frescor. É nome de pessoa e nome de escola de outro tenant dentro da sessão de quem acabou de entrar (regra 20, itens 4 e 5; regra 10, item 1), no cenário que o próprio código cita ("o Chromebook do carrinho passa por quatro turmas"). A Tech Spec só prevê `queryClient.clear()` na troca de escola (20.0); o encerramento de sessão ficou sem nada.
  Correção exigida: limpar o cache de consultas em todo encerramento de sessão — tanto no "Sair" quanto no `esquecerSessao` disparado pelo `NAO_AUTENTICADO` persistente — antes de navegar para `/entrar` (por exemplo `useQueryClient().clear()` no `encerrar` de `Cabecalho.tsx` e um aviso de "sessão encerrada" do módulo de sessão ligado ao `clienteConsultas` em `main.tsx`), e um e2e que prove a regra: a pessoa A entra, sai, a pessoa B entra na mesma aba, e a tela de B nunca contém o nome nem a escola de A.

Recomendações:
- `apps/web/src/api/sessao.ts:258`: a repetição do 503 aceita qualquer `INDISPONIVEL_TENTE_DE_NOVO` com `Retry-After`, e `packages/nucleo/src/erro/filtro-global.ts:31` põe `Retry-After: 5` em todo 503, sem sorteio. Numa queda geral (Postgres fora), cada envio vira até 6 tentativas sincronizadas por usuário, todas da mesma escola atrás do mesmo IP. Só o 503 do semáforo tem o sorteio de 2–6 s. Vale somar um jitter local à espera, ou restringir a repetição ao caso do semáforo.
- `infra/k6/login-7h30.js:291` e `apps/api/test/api-com-sessao.ts:129` imitam a web no 503, mas sem o piso de 1 s nem o corte pelo que resta do orçamento que entraram agora. O cenário de carga continua válido (a API sorteia 2–6 s), mas as duas cópias já divergem do cliente; melhor extrair a regra da espera para `packages/shared` e usá-la nos três lugares.
- A repetição automática conta em `LIMITE_LOGIN_EMAIL_IP_MIN` (60/min por IP, `apps/api/src/sessao/senha/limite-email-ip.ts:55`), porque a contagem acontece antes do semáforo (`apps/api/src/sessao/login.service.ts:105`). Quarenta professores repetindo no 503 às 7h30 podem rebaixar o IP da própria escola. Nada é recusado, mas vale medir no staging antes de o piloto entrar.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-19 21:23:42 · `tasks/prd-identidade-e-tenancy/18_task.md`

VEREDITO: REPROVADO
Escopo: invadiu escopo (edição da Tech Spec fora da 18.0, com procedência falsa)
Aderência à Tech Spec: ok no código; a seção 9 ficou com uma frase falsa depois de ser editada nesta tarefa (ver recomendação 1)
Portão local: carimbo válido — `portão local válido para o código atual (typecheck, lint, test, e2e, infra)`

Bloqueantes:

- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/techspec.md:196-202` — o parágrafo **"Aval do Joaquim (19/09/2026)"** é apresentado na nota da tarefa como restauração de texto que "a execução da 17.0 apagou por engano". O histórico não sustenta isso: `git log -S "Aval do Joaquim" --all` não devolve nenhum commit, `git show HEAD:…/techspec.md` não tem o parágrafo, e o diff da techspec no commit 546b88a (17.0) tem hunks em `@@ -54 @@ -72 @@ -90 @@ -110 @@ -246 @@ -276 @@ -303 @@ -432` — nenhum toca a região da seção 5 "Hash" (linhas ~186-200). Ou seja: o texto nunca esteve no repositório e nunca foi apagado pela 17.0; ele nasce neste diff.

  O conteúdo agrava: é um registro nominal de aprovação humana de um desvio de segurança (argon2 fixado em 30 ms, abaixo da faixa de 100–250 ms), justamente o ponto que o revisor da 16.0 deixou pendente em `achados-revisoes.md:3590` ("Hash abaixo da faixa ainda sem aval do Joaquim… Levar isso a ele antes do commit"). Uma tarefa de tela de login não é o veículo para gravar o aval de outra tarefa, e um revisor não tem como verificar que ele foi dado.

  *Correção exigida:* tirar o parágrafo do diff desta tarefa (`git checkout -p` só nessa região, mantendo as decisões da seção 9, que são da 18.0). Se o aval existe de fato, ele entra por `/registrar-decisao` ou `/corrigir` próprio, com a data e a origem corretas — e sem a afirmação de que a 17.0 o apagou, que é falsa.

Recomendações:

1. `tasks/prd-identidade-e-tenancy/techspec.md:437` — "**Token:** fica em memória. `buscarDaApi` manda `Authorization` e, no 401, renova uma vez." ficou falso: `apps/web/src/api/cliente.ts:103` é a chamada **anônima** e nunca manda `Authorization` nem renova; quem faz isso é `chamarComSessao`/`buscarComSessao` em `apps/web/src/api/sessao.ts:202`. A seção 9 foi editada nesta tarefa; deixar a frase antiga aponta o leitor da spec para o módulo errado no caminho do token.
2. `apps/api/src/sessao/renovacao.service.ts:36` — o `export { JANELA_DE_RENOVACAO_SIMULTANEA_MS }` existe só para não mexer em `renovacao.service.test.ts:2` e `apps/api/test/renovacao.int.test.ts:5`. São dois import paths para a mesma constante; trocar os dois imports por `@educa/shared` e apagar o re-export fecha o segundo jeito. Mesmo caso, com menos urgência, em `tools/testes/integracao.setup.ts:9` (25 arquivos importam de lá, 1 de `tools/ci/compose.ts`).
3. `packages/shared/src/index.ts:3` — `MENSAGENS_DA_ENTRADA` e `formatarEspera` são exportados do índice do pacote e nenhum consumidor os importa de fora do próprio `mensagens.ts` (só o teste, por caminho direto). Exportar só `mensagemDaEntrada` mantém a superfície do contrato no que é usado.
4. `apps/web/src/paginas/Entrar.tsx:10` — `mensagemDaFalha` repete a lógica "é `ErroDaApi`? usa o código : usa `ERRO_INTERNO`" que `mensagemDoErro` (`apps/web/src/api/cliente.ts:108`) já faz. Vale morar ao lado dela, em `cliente.ts`, para as duas telas de login das 19.0 e 20.0 não copiarem a terceira versão.
5. `apps/web/src/api/sessao.ts:61` — `ultimoErro` nunca é limpo quando a sessão abre. Hoje é inofensivo (só é lido em `indisponivel`), mas é estado que sobrevive ao sucesso; limpar em `guardarToken` evita que a próxima falha de tipo diferente mostre a mensagem anterior por um quadro.
6. `apps/web/src/api/sessao.ts:272` — `sair()` passa por `chamarComSessao`, então um `DELETE` que recebe 401 dispara uma **rotação do cookie de renovação** só para repetir o encerramento. Sair com a sessão já morta não precisa renovar nada: `chamarApi` direto com o token atual, e `esquecerSessao()` no `finally`, resolve sem gastar rotação.

## test-engineer · 3ª rodada · APROVADO · 2026-09-19 22:02:16 · `tasks/prd-identidade-e-tenancy/18_task.md`

Auditei apenas o diff desde a minha 2ª rodada (os dois bloqueantes do `privacy-guardian` e do `infra-guardian`) e o que ele afeta. Rodei também o arquivo de unidade tocado: 27 testes verdes em `apps/web/src/api/sessao.test.ts`.

Checagem de efetividade dos testes novos (a pergunta "falharia sem a regra?"):

- `e2e/entrar.spec.ts:320` ("Chromebook do carrinho"): sem o `clienteConsultas.clear()`, o `staleTime` de 30 s faria o `useQuery(consultaEu)` devolver o dado da primeira pessoa sem nem refazer a chamada — a asserção `getByText('Carregando a sua escola…')` cairia **antes** das asserções negativas, o que elimina o risco de `not.toContainText` passar por vacuidade. Os nomes únicos do fixture (`e2e/__fixtures__/sessao.ts:72-73`) são o que torna a asserção negativa real. As duas pessoas ficam em escolas diferentes, então o teste também cobre o isolamento (regra 10).
- `e2e/entrar.spec.ts:351` ("Sair" não confirmado): exige `encerramentos === 2` (prova a repetição), o alerta na entrada (prova `saidaPendente`) e a sessão voltando inteira depois do `goto('/')` (prova que o aviso não é decorativo). Sem a correção, o `try/finally` anterior levaria à entrada sem alerta e o teste falharia. Esse teste também é o que pegaria a "ressurreição" da sessão descrita na recomendação 3.
- `apps/web/src/api/sessao.test.ts:470` e `:495`: os ouvintes são exigidos nos **dois** caminhos de fim de sessão (o "Sair" e o `NAO_AUTENTICADO` que persiste depois da renovação) e a idempotência é afirmada por contagem (`limpezas` continua 1). Registrar `estadoDaSessao()` dentro do ouvinte prova ainda a ordem (estado já `anonima` quando o cache é limpo), que é o que evita o refetch com sessão meio viva.

Sem `.skip`, sem teste comentado, sem mock que esconda a regra (o `fetch` falso é fronteira externa; nenhum provedor pago é tocado).

```
VEREDITO: APROVADO
Cenários exigidos: caminho feliz do "Sair" confirmado; cache do TanStack Query limpo em todo fim de sessão, sem reload (Chromebook do carrinho); o outro caminho de encerramento (NAO_AUTENTICADO persistente); idempotência do encerramento; "Sair" com a API fora (duas falhas) com aviso e cookie ainda vivo; só a primeira falha não gera aviso; 401 no encerramento não gera aviso nem repetição; entrar de novo limpa o aviso; isolamento entre as duas pessoas no mesmo computador; concorrência do clique duplo em "Sair".
Cobertos: todos. e2e/entrar.spec.ts:320 e :351; apps/web/src/api/sessao.test.ts:406, :416, :433, :446, :454, :470, :495; clique duplo em e2e/entrar.spec.ts:293 (pré-existente, continua válido depois de `sair()` deixar de lançar).
Bloqueantes: nenhum
Recomendações:
- apps/web/src/api/sessao.ts:313-323 — a segunda tentativa do `DELETE` não trata `NAO_AUTENTICADO` como a primeira. Resposta perdida na primeira tentativa (a requisição chegou e matou a sessão, a resposta não voltou) faz a repetição receber 401 e a tela avisar "não foi possível encerrar" para uma saída que aconteceu. Erra para o lado seguro, mas é o mesmo caso de "resposta perdida" que o `JA_RENOVADO` já trata com cuidado.
- apps/web/src/api/sessao.ts:330-340 — o `finally { esquecerSessao() }` roda até ~1 s + rede depois do clique. Se uma entrada nova terminasse nessa janela, o `esquecerSessao` derrubaria o token e o cache da pessoa seguinte (não vaza dado, só desloga). Hoje é inalcançável pela interface, porque o `Cabecalho` só navega depois do `await sair()`; guardar o token/geração no começo e só esquecer se ainda for o mesmo fecharia a porta.
- apps/web/src/api/sessao.ts:142-149 — a proteção contra a sessão ressuscitar depois do "Sair" (o `clear()` faz a tela ainda montada buscar, o 401 chama `renovarComTokenVencido(undefined)` e, com o cookie ainda válido, o `guardarToken` reabriria tudo) depende de o `estado = 'anonima'` vir antes dos ouvintes e de o desmonte chegar antes do refetch. O e2e de "Sair" não confirmado pega a regressão, mas uma guarda explícita (não renovar com `estado === 'anonima'`) e uma asserção de que nenhum `POST /v1/sessao/renovar` sai depois do "Sair" tornariam isso estrutural em vez de temporal.
- apps/web/src/paginas/Entrar.tsx:58 — `saidaPendente()` é lido no render sem `useSyncExternalStore`. Funciona porque a entrada só monta depois do `sair()`; se algum fluxo futuro encerrar a sessão com a entrada já montada, o aviso não aparece.
- tasks/prd-identidade-e-tenancy/18_task.md, tabela "Testes que provam a regra": os dois cenários novos (cache do Chromebook do carrinho e saída não confirmada) não estão listados; entram lá para o `/validar` não ter que descobri-los pelo diff.
- techspec.md, seção 9: vale registrar o risco residual de o aviso viver só em memória — um F5 na tela de entrada o apaga enquanto a sessão continua viva no servidor.
```

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-19 22:05:50 · `tasks/prd-identidade-e-tenancy/18_task.md`

Auditei o diff desde a minha 1ª rodada (os dois bloqueantes) e o que ele afeta: `apps/web/src/api/sessao.ts`, `apps/web/src/main.tsx`, `apps/web/src/componentes/Cabecalho.tsx`, `apps/web/src/paginas/Entrar.tsx`, `e2e/entrar.spec.ts`, `e2e/__fixtures__/sessao.ts`, `apps/web/src/api/sessao.test.ts`, `packages/shared/src/erros/mensagens.ts`, `packages/shared/src/sessao/renovacao.ts`, `apps/api/src/sessao/renovacao.service.ts`, `tools/ci/compose.ts`, `tools/testes/integracao.setup.ts` e a techspec. Não reauditei o que não mudou.

**Correção 1 (cache do TanStack Query no fim da sessão) — feita.** `esquecerSessao()` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts:142-149`) chama os ouvintes de encerramento em todo caminho — o "Sair" e o `NAO_AUTENTICADO` que persiste depois da renovação (`:255`, `:275`) — e o `main.tsx:19-21` registra `clienteConsultas.clear()`. O estado vai a `anonima` antes de limpar, o que evita refetch com sessão meio viva. Provado por `e2e/entrar.spec.ts:320` (mesma aba, sem reload, com o `GET /v1/eu` segurado para abrir a janela em que o cache apareceria, e nomes únicos por fixture que tornam a asserção negativa real; as duas pessoas ficam em escolas diferentes, então o teste também cobre a regra 10) e por `apps/web/src/api/sessao.test.ts:470` e `:495` (os dois caminhos e a idempotência).

**Correção 2 (saída que a API não confirma) — feita.** `encerrarNaApi()` (`sessao.ts:313-323`) repete uma vez, trata `NAO_AUTENTICADO` como "não há o que encerrar", e `sair()` marca `saidaConfirmada = false` sem deixar o token na aba. `Entrar.tsx:58-63` mostra o alerta dizendo o que fazer. Provado por `e2e/entrar.spec.ts:351`, que exige as duas tentativas, o alerta, a ausência do nome na tela e — o que faz o teste valer — que o cookie de renovação sobreviveu e a sessão volta inteira.

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum campo novo e nenhuma migration. Em trânsito/tela continuam e-mail e senha da equipe (Entrar.tsx), nome/papel/escola de quem entrou (GET /v1/eu, Inicio.tsx) e o token em variável de módulo (api/sessao.ts). Nada de aluno.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: ok no que esta tarefa toca. A web não decide acesso; `Protegida` (rotas.tsx:19) é navegação, e a guarda continua no servidor (4.0/5.0, inalteradas).
Logs: limpos. Nenhum `console.*` nem logger em apps/web/src; `ErroDaApi` carrega só código e `Retry-After`; `EstadoErro` e `mensagemDaEntrada` mostram texto do catálogo, nunca status, código, corpo da API nem stack (e2e "conta segurada" prova).
Auditoria: presente onde a regra exige — login, renovação e encerramento são auditados na API, e nada disso mudou nesta rodada.
Envio externo: nenhum. Nenhuma chamada a provedor de IA nesta tarefa.
Seed/fixture: sintético. e2e/__fixtures__/sessao.ts cria rede, escola, ano letivo, conta e usuário próprios por teste, com nome inventado e e-mail no domínio reservado `.invalid`, no Postgres do compose de teste (regra 20, item 17).
Bloqueantes: nenhum
Recomendações:
- apps/web/src/api/sessao.ts:330-340 — o aviso de saída não confirmada vive só em memória: um F5 na tela de entrada o apaga enquanto a sessão continua viva no servidor. Vale decidir se ele sobrevive ao reload (um sinalizador sem dado de pessoa) ou registrar o risco residual na techspec.
- apps/web/src/api/sessao.ts:142-149 — a proteção contra a sessão ressuscitar depois do "Sair" (o `clear()` faria a tela ainda montada buscar, o 401 renovaria pelo cookie ainda válido e o `guardarToken` reabriria tudo) depende hoje de o desmonte chegar antes do refetch. Uma guarda explícita — não renovar com `estado === 'anonima'` — tornaria isso estrutural em vez de temporal. O e2e de saída não confirmada pega a regressão.
- apps/web/src/api/sessao.ts:321 — a segunda tentativa do DELETE não trata `NAO_AUTENTICADO` como a primeira: resposta perdida na primeira tentativa faz a tela avisar "não foi possível encerrar" para uma saída que aconteceu. Erra para o lado seguro, mas é o mesmo caso de "resposta perdida" que o `JA_RENOVADO` já trata com cuidado.
- apps/web/src/paginas/Entrar.tsx:58 — `saidaPendente()` é lido no render sem `useSyncExternalStore`; funciona porque a entrada só monta depois do `sair()`, e quebraria calado se algum fluxo futuro encerrar a sessão com a entrada já montada.
- tasks/prd-identidade-e-tenancy/18_task.md, tabela "Testes que provam a regra": os dois cenários novos (Chromebook do carrinho e saída não confirmada) não estão listados; entram lá para o `/validar` não ter que descobri-los pelo diff.
```

Fechamento: sobre "o que o sistema guarda deste aluno e para onde foi", esta tarefa não guarda nada novo nem envia nada a terceiro — só consome `/v1/eu` e as rotas de sessão já auditadas, e agora esquece o que havia em cache no fim da sessão.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-19 22:08:13 · `tasks/prd-identidade-e-tenancy/18_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login
Rate limit: ok — nada de limite por IP introduzido na web; do lado da API o limite da rota de e-mail só rebaixa no balde (`apps/api/src/sessao/senha/limite-email-ip.ts:54`), e o freio de verdade é por conta
Fila e prioridade: ok (nenhuma fila nesta tarefa)
Concorrência: protegida — Web Locks + promessa única por aba (`apps/web/src/api/sessao.ts:177,206`), duplo clique em "Entrar" e em "Sair" travado e coberto por e2e (`e2e/entrar.spec.ts:269,293`), e o encerramento ficou idempotente (`apps/web/src/api/sessao.ts:142`, provado em `apps/web/src/api/sessao.test.ts:495`)
Índice e paginação: ok (nenhuma query nova; o seed do e2e só insere)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok — o 503 que a web repete continua medido por `login.hash_recusado` e `login.limite_email_ip`; nada novo no caminho quente do servidor

Correção exigida na minha 1ª rodada: **feita**. `aoEncerrarSessao` + `clienteConsultas.clear()` em `apps/web/src/main.tsx:19`, disparado por `esquecerSessao` nos dois caminhos de fim de sessão (`apps/web/src/api/sessao.ts:142-149`), com o e2e do Chromebook do carrinho (`e2e/entrar.spec.ts:320`, com o `GET /v1/eu` segurado para cobrir a janela do `staleTime`) e os dois testes de unidade (`apps/web/src/api/sessao.test.ts:470,495`). A mudança do `DELETE /v1/sessao` para `chamarApi` direto não reabre nada do meu lado: economiza uma rotação de cookie por saída e não toca o limitador.

Bloqueantes: nenhum

Recomendações:
- `apps/web/src/api/sessao.ts:142-149` e `:270-278` — a limpeza do cache faz a tela ainda montada buscar de novo; esse refetch cai em 401 e chega a `renovarComTokenVencido(undefined)`, que renova. No caminho "Sair que a API não confirmou" o cookie continua vivo, então a renovação pode devolver 200 e `guardarToken` reabre a sessão e ainda apaga o aviso (`saidaConfirmada = true`). Hoje o resultado depende de o desmonte chegar antes da resposta; uma guarda explícita ("não renovar nem guardar token com `estado === 'anonima'`") e uma asserção no e2e de que nenhum `POST /v1/sessao/renovar` sai depois do "Sair" tornariam isso estrutural. É o mesmo ponto que o `test-engineer` registrou na 3ª rodada.
- `apps/web/src/api/sessao.ts:313-323` — a segunda tentativa do `DELETE` não trata `NAO_AUTENTICADO` como a primeira: resposta perdida na primeira (o pedido chegou e matou a sessão) faz a tela avisar "não foi possível encerrar" para uma saída que aconteceu. Aviso que erra assim vira aviso que ninguém lê.
- `apps/web/src/api/sessao.ts:244` (código não alterado nesta rodada) — o vencimento é decidido pelo relógio do Chromebook contra o `expiraEm` absoluto do servidor. Máquina de escola com relógio adiantado além da validade do token renova a cada chamada, dobrando o tráfego de `/v1/sessao/renovar` e rotacionando o refresh a cada requisição. Uma margem, ou uma validade relativa vinda da resposta, fecha isso.
- Registradas de novo, não aplicadas: jitter local na repetição do 503 (ou restringir a repetição ao caso do semáforo, já que `packages/nucleo/src/erro/filtro-global.ts` põe `Retry-After: 5` fixo em todo 503); a regra da espera compartilhada com `infra/k6/login-7h30.js` e `apps/api/test/api-com-sessao.ts`; e medir no staging o efeito da repetição automática sobre `LIMITE_LOGIN_EMAIL_IP_MIN` antes do piloto.

## revisor-geral · 2ª rodada · REPROVADO · 2026-09-19 22:08:54 · `tasks/prd-identidade-e-tenancy/18_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (a passagem de `/` para `/sistema`, o `chamarComSessao` no lugar do `buscarDaApi` e o estado da sessão fora do TanStack Query estão registrados na seção 9 da `techspec.md`, não foram decididos em silêncio)
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, test, e2e, infra)`)

Correção exigida da 1ª rodada: feita. `git diff tasks/prd-identidade-e-tenancy/techspec.md` só tem as decisões da 18.0, e o parágrafo "Aval do Joaquim (19/09/2026)" não existe em `techspec.md` nem nasceu neste diff.

Bloqueantes:

- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts:313-323` (`encerrarNaApi`, com efeito em `sair()`, linhas 330-340) — **"Sair" com o token de acesso vencido não encerra a sessão no servidor e ainda apresenta a saída como confirmada.** `encerrarNaApi` manda o `DELETE /v1/sessao` com a variável de módulo `token` sem nenhuma conferência de `expiraEm`, e não passa por `chamarComSessao`, que é quem tem a renovação prévia do token vencido (linha 244: *"O token já vencido é renovado antes"*). O `DELETE` é `@Permite('sessao','encerrar')` (`apps/api/src/sessao/saida.controller.ts:14-15`), ou seja, a guarda exige JWT válido: token de 10 min vencido → 401 `NAO_AUTENTICADO` → a linha 318 trata isso como "não há o que encerrar", `return` → `sair()` marca `saidaConfirmada = true`. Resultado: a linha de `sessao` continua viva (a inatividade da equipe é de 120 min), o cookie `educa_sessao` não é apagado, **e o aviso de `saidaPendente()` não aparece**. No Chromebook do carrinho, a pessoa seguinte dá F5 ou abre `/`, `abrirSessaoPeloCookie` renova pelo cookie que sobreviveu e entra na sessão da anterior — com nome e escola dela na tela. O caminho é banal: professora com a tela aberta e parada por mais de 10 min (sem o tab perder o foco, que é o que dispararia o `refetchOnWindowFocus` e renovaria de carona) e então clica em "Sair". É exatamente o furo que o mecanismo de `saidaPendente` desta rodada existe para cobrir, e ele passa por baixo dele.

  Correção exigida: antes do `DELETE`, renovar quando o token estiver vencido ou ausente (a mesma conferência de `expiraEm` da linha 244), e só então o 401 pode contar como sessão já morta. Se a renovação devolver `NAO_AUTENTICADO`, a sessão acabou mesmo e a saída é confirmada; se ela falhar por 5xx ou rede, a saída fica pendente. Alternativa aceitável: não tratar `NAO_AUTENTICADO` no `DELETE` como confirmação, já que a web não consegue separar "sessão já encerrada" de "só o meu token venceu" — aviso à toa é o lado seguro.

  O teste `apps/web/src/api/sessao.test.ts:446` (*"sessão já recusada pela API não vira saída pendente nem segunda tentativa"*) hoje carimba o comportamento errado, porque o cenário dele não distingue os dois casos. Ele precisa ganhar o caso do token vencido com a sessão viva.

Recomendações:

1. `apps/web/src/api/sessao.ts:296-299` e o parágrafo correspondente da `techspec.md` seção 9 — a premissa de que "503 do semáforo vem sempre com `Retry-After`; sem o cabeçalho é queda de rede ou de instância" não vale contra a nossa própria API: `packages/nucleo/src/erro/filtro-global.ts:78-79` põe `Retry-After` em **todo** 503 (`TENTE_DE_NOVO_PADRAO_SEGUNDOS = 5` quando ninguém informou), e o `handle_errors` do `infra/Caddyfile` também manda `Retry-After 5`. Na prática o ramo "503 sem `Retry-After`" só existe para 503 de terceiro; o que protege a pessoa da rede da escola fora é o caminho de falha de `fetch`, que não tem cabeçalho nenhum. Efeito colateral: Postgres fora às 7h30 vira ~6 repetições de login por pessoa em 30 s. Se isso é aceitável (a seção 7c pede "tenta de novo com recuo"), vale corrigir o texto; se não é, o critério precisa ser outro que não a presença do cabeçalho.
2. `apps/web/src/paginas/Entrar.tsx:58` — `saidaPendente()` é lido direto na renderização, sendo estado mutável de módulo, enquanto o mesmo módulo já expõe `assinarSessao` e o projeto usa `useSyncExternalStore` em `rotas.tsx:20` e `:59`. Funciona hoje só porque a tela sempre monta depois do `sair()`. É um segundo jeito de fazer o que o projeto já faz de um jeito.
3. `apps/web/src/api/sessao.ts:147-148` — `esquecerSessao` dispara os ouvintes do `aoEncerrar` (`clienteConsultas.clear()`) **antes** do `anunciar()`, isto é, antes de o React poder desmontar a árvore autenticada. Anunciar primeiro e limpar depois fecha a janela em que um observador ainda montado recria a consulta.
4. `apps/web/src/paginas/Entrar.tsx:10-12` — `mensagemDaFalha` repete a regra de `mensagemDoErro` (`apps/web/src/api/cliente.ts:108`). Uma das duas basta, com o `esperaSegundos` como argumento opcional.
5. Três cópias da mesma barra "Educa.ia" (`Entrar.tsx:51-53`, `EmConstrucao.tsx:9-11`, `Cabecalho.tsx:28-30`). Um componente só, com o "Sair" opcional.
6. Segue valendo a recomendação 2 da rodada anterior, que o executor registrou como não aplicada: `apps/api/src/sessao/renovacao.service.ts:36` reexporta `JANELA_DE_RENOVACAO_SIMULTANEA_MS` de `@educa/shared`, criando dois caminhos de import para a mesma constante.

## test-engineer · 4ª rodada · APROVADO · 2026-09-19 22:44:53 · `tasks/prd-identidade-e-tenancy/18_task.md`

Auditei apenas o diff desde a minha 3ª rodada (a correção do bloqueante do `revisor-geral`) e o que ele afeta: `apps/web/src/api/sessao.ts`, `apps/web/src/api/sessao.test.ts`, `e2e/entrar.spec.ts` e a seção 9 da techspec. Rodei o arquivo de unidade tocado: **32 testes verdes** em `apps/web/src/api/sessao.test.ts` (eram 27 na rodada passada).

Checagem de efetividade dos testes novos ("falharia sem a regra?"), feita contra a fila de respostas do `fetch` falso, que é posicional e por isso torna a asserção de sequência uma mutação real:

- `apps/web/src/api/sessao.test.ts:476` (*renova antes do `DELETE`*) — sem a renovação prévia, o `DELETE` consumiria a resposta `200/TOKEN_NOVO` da fila, `chamadas` teria uma entrada só, a igualdade `[[renovar,'POST'],[sessao,'DELETE']]` falharia, o `Bearer token-2` do `DELETE` falharia e o `afterEach` ainda acusaria a resposta 204 não consumida. Três asserções independentes quebram.
- `:491` (*token vencido + cookie recusado*) — sem a regra, a única chamada seria o `DELETE`, e a igualdade com `[CAMINHO_DA_RENOVACAO]` falha.
- `:499` (*token vencido + API fora*) — prova o ponto que o bloqueante pedia: `saidaPendente() === true` **e** nenhum `DELETE` emitido. Sem a regra o `DELETE` sairia, tomaria o 503 e o teste ficaria pendurado no `esperar` com timers falsos.
- `:507` (*nenhum pedido perdido ressuscita a sessão*) — é o que torna estrutural a guarda `estado === 'anonima'` de `sessao.ts:212`: sem ela, o 401 do refetch chamaria `renovarSessao`, a fila não teria resposta preparada para `/v1/sessao/renovar`, o erro deixaria de ser `ErroDaApi` e a igualdade `chamadas === ['/v1/eu']` falharia. `saidaPendente()` continua `true` na asserção final, que é o dado que o `guardarToken` apagaria.
- `:463` (*resposta perdida do primeiro `DELETE`*) — cobre a minha recomendação 1 da 3ª rodada com contagem de chamadas e ausência de aviso.
- `e2e/entrar.spec.ts:363-375` — o `renovacoesDepoisDaSaida` só conta pedidos depois do primeiro `DELETE`, e a asserção final (`goto('/')` devolve a área autenticada) continua provando que o aviso não é decorativo. O caso do 401 com token em dia (`sessao.test.ts:455`) foi mantido com o título dizendo que é o caso do token em dia, o que era exatamente o pedido do bloqueante.

Sem `.skip`, sem teste comentado, sem mock de coisa nossa: o `fetch` falso é fronteira externa e o e2e usa API e Postgres reais com seed sintético. Nenhum provedor pago é tocado. Concorrência: o clique duplo em "Sair" (`e2e/entrar.spec.ts:293`, rota segurada + `dispatchEvent`) e a renovação única entre abas (`sessao.test.ts:195` e `:215`, com `maximoEmVoo`) continuam válidos depois da mudança, e a renovação nova dentro do `sair()` reaproveita o `renovacaoEmAndamento` já coberto.

```
VEREDITO: APROVADO
Cenários exigidos (desta rodada): "Sair" com token vencido e sessão viva → renova e encerra de fato; token vencido com cookie já recusado → saída confirmada, sem aviso à toa; token vencido com a API fora → saída pendente, sem DELETE; 401 no primeiro DELETE com token em dia → sessão já morta; 401 na repetição → resposta perdida da primeira; nenhuma renovação depois do "Sair" não confirmado (ressurreição pelo cookie sobrevivente); aviso âmbar na entrada em 360 px e sem violação grave de acessibilidade.
Cobertos: todos. apps/web/src/api/sessao.test.ts:455, :463, :476, :491, :499, :507, :527; e2e/entrar.spec.ts:351-384.
Bloqueantes: nenhum
Recomendações:
- apps/web/src/api/sessao.ts:323 — o vencimento é decidido só por `expiraEm <= Date.now()`, sem folga. Token que passa na conferência com poucos segundos de vida e vence em trânsito (Fast 3G no Chromebook), ou máquina de laboratório com relógio atrasado, cai de volta no ramo `sessao.ts:336` ("401 com token em dia = não há o que encerrar") e reproduz, em janela estreita, exatamente o furo que esta rodada fechou: sessão viva, cookie intacto e sem `saidaPendente()`. Uma margem (renovar se faltar menos de ~30 s) ou uma validade relativa vinda da resposta fecha isso. Casa com o ponto de relógio que o `privacy-guardian` já havia registrado.
- apps/web/src/api/sessao.ts:212 combinado com :323 e :358 — um segundo `sair()` depois de uma saída pendente apaga o aviso: `token` está `undefined`, `renovarSessao()` recusa com `NAO_AUTENTICADO` por causa da nova guarda, `encerrarNaApi` lê isso como "a sessão acabou mesmo" e `sair()` marca `saidaConfirmada = true` com a sessão ainda viva no servidor. Hoje é inalcançável pela interface (o `Cabecalho` desmonta ao navegar para `/entrar`, e a entrada não tem "Sair"), mas é a porta que se abre no dia em que existir um "tentar encerrar de novo" no aviso. Uma guarda (não confirmar saída quando a recusa veio da própria guarda de sessão esquecida) e um teste sequencial de dois `sair()` deixariam isso estrutural.
- apps/web/src/api/sessao.ts:319-331 — a renovação dentro do `Sair` herda o caminho do 409 `JA_RENOVADO`, que espera 2,5 s e tenta de novo: com outra aba renovando no mesmo instante, o botão fica em "Saindo…" por ~2,5 s e, se o segundo 409 vier, a saída termina pendente (lado seguro, mas sem teste que fixe o comportamento). Vale um caso de unidade com 409 na renovação do `sair()`.
- tasks/prd-identidade-e-tenancy/18_task.md, tabela "Testes que provam a regra" — segue sem os cenários acrescentados nas rodadas 3 e 4 (cache do Chromebook do carrinho, saída não confirmada, e agora "Sair" com token vencido). Continua valendo para o `/validar` não ter que descobri-los pelo diff.
- apps/web/src/paginas/Entrar.tsx:58 — `saidaPendente()` continua lido no render sem `useSyncExternalStore`, enquanto o módulo já expõe `assinarSessao`. Recomendação minha e do `revisor-geral` ainda não aplicada; não bloqueia porque a entrada só monta depois do `sair()`.
```

## privacy-guardian · 3ª rodada · APROVADO · 2026-09-19 22:47:13 · `tasks/prd-identidade-e-tenancy/18_task.md`

Auditei o diff desde a minha 2ª rodada (aprovada): `apps/web/src/api/sessao.ts` (`encerrarNaApi`, `renovarSessao`, `esquecerSessao`), `apps/web/src/api/sessao.test.ts`, `e2e/entrar.spec.ts`, seção 9 da techspec, e o que eles alcançam (`Cabecalho.tsx`, `Entrar.tsx`, `rotas.tsx`, `main.tsx`, `cliente.ts`, o re-export de `JANELA_DE_RENOVACAO_SIMULTANEA_MS` e a mudança de `urlDoBancoDeTeste`).

As três recomendações minhas que a correção aplicou de passagem estão corretas e não abriram furo novo:

- A guarda `if (estado === 'anonima') return Promise.reject(NAO_AUTENTICADO)` em `renovarSessao` (`apps/web/src/api/sessao.ts:212`) fecha estruturalmente a ressurreição pelo cookie sobrevivente, e os caminhos legítimos de reabrir continuam abertos: `abrirSessaoPeloCookie` define `'abrindo'` antes de chamar, e o login passa por `guardarToken`.
- `encerrarNaApi` renovar antes do `DELETE` (linha 323) não vaza nada: a renovação só acontece com o estado ainda `'aberta'`, `NAO_AUTENTICADO` na renovação confirma a saída sem mandar `DELETE`, e qualquer outra falha deixa `saidaPendente` — sem apresentar saída concluída.
- `esquecerSessao` anunciar antes de `clienteConsultas.clear()` (linhas 149-150) mantém o efeito que importa para a regra 20: o cache de `/v1/eu` com nome e escola da pessoa anterior é apagado em todo fim de sessão, e o e2e "Chromebook do carrinho" prova que a pessoa seguinte não vê nome nem escola da anterior nem na janela em que `/v1/eu` está segurada.

Nada nesta rodada toca migration, campo pessoal novo, log, storage, exportação ou envio externo. Fixtures de e2e seguem sintéticas (`e2e/__fixtures__/sessao.ts`: nome inventado, domínio `.invalid`, escola por chamada). O risco residual de o aviso de saída não confirmada viver só em memória está registrado na techspec, seção 9, com o motivo (cookie de sessão do navegador) — aceito, e o e2e prova que o aviso não é decorativo.

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum novo. Em trânsito/tela: nome do usuário e nome da escola (`/v1/eu`), e-mail e senha da equipe no formulário de entrada — todos já na tabela de dados (docs/lgpd.md, linhas 47 e 52); sessão sem IP e sem nome (linha 54). Nenhuma migration nesta rodada.
Fora da tabela de dados do docs/lgpd.md: nenhum
Autorização por objeto: ok — nenhuma rota nova; o diff é frontend e um constante compartilhada. `/v1/eu` continua derivando a pessoa do token, sem id vindo do cliente
Logs: limpos — nenhum `console.*` nem logger em apps/web/src nem nos e2e; `ErroDaApi` carrega só o código (apps/web/src/api/cliente.ts:16), e nada de corpo da API chega à tela (`e2e/entrar.spec.ts` afirma que "429", "CONTA_SEGURADA" e o texto da API não aparecem)
Auditoria: presente — login, renovação e encerramento seguem registrados na API; o diff não altera esses caminhos (renovacao.service.ts só passou a importar a janela de `packages/shared`)
Envio externo: nenhum. Sem chamada a provedor de IA nesta tarefa
Seed/fixture: sintético — `e2e/__fixtures__/sessao.ts` cria rede, escola, conta e usuário próprios por teste, com e-mail em `@educa.invalid` e senha derivada de UUID; `urlDoBancoDeTeste` apenas mudou de arquivo (tools/ci/compose.ts:68), sem apontar para outro banco
Bloqueantes: nenhum
Recomendações:
- apps/web/src/paginas/Entrar.tsx:58 — `saidaPendente()` é lido no render sem `useSyncExternalStore`. Hoje funciona porque `sair()` grava o estado antes de navegar e a tela monta depois, mas é acoplamento a ordem de execução; ficaria estrutural com o mesmo assinante de `assinarSessao` (já registrada, segue não aplicada)
- tasks/prd-identidade-e-tenancy/18_task.md:82-93 — a tabela "Testes que provam a regra" ainda não lista os cenários novos ("Sair" com token vencido, saída não confirmada que avisa, nenhuma renovação depois do encerramento). Quem auditar a tarefa depois não acha a prova pela tabela (já registrada, segue não aplicada)
- apps/web/src/api/sessao.ts:319 — quando o `DELETE` falha por rede, a única defesa é o aviso na entrada. Vale considerar, numa tarefa futura, uma nova tentativa de encerramento ao voltar a conexão ou ao carregar a tela de entrada: o cookie de renovação continua vivo no servidor até o navegador fechar
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/entrar.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Entrar.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/techspec.md`.

Sobre a pergunta de fechamento: no escopo desta tarefa (sessão na web), o que o sistema guarda sobre a pessoa e para onde foi continua respondido pelo registro de sessão e pela auditoria da API, construídos nas tarefas 4.0, 5.0 e 17.0 — o diff não retira nem contorna nenhum deles.

## revisor-geral · 3ª rodada · APROVADO · 2026-09-19 22:48:58 · `tasks/prd-identidade-e-tenancy/18_task.md`

Auditei o diff desde a 2ª rodada (`apps/web/src/api/sessao.ts`, `sessao.test.ts`, `e2e/entrar.spec.ts`, techspec seção 9) e reli por completo os arquivos que ele afeta: `sessao.ts`, `cliente.ts`, `rotas.tsx`, `Entrar.tsx`, `Cabecalho.tsx`, `Inicio.tsx`, `EmConstrucao.tsx`, `caminhos.ts`, `eu.ts`, `mensagens.ts`, os dois arquivos de `tools/` e `renovacao.service.ts`.

**Correção exigida na 2ª rodada — verificada.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts:319-348` renova antes do `DELETE` quando o token está ausente ou vencido; `NAO_AUTENTICADO` na renovação confirma a saída, 5xx e queda de rede a deixam pendente **sem** mandar `DELETE` (linhas 323-331); o 401 do primeiro `DELETE` com token em dia continua contando como sessão já morta (336) e o 401 da repetição é lido como resposta perdida da primeira (344). Os três casos novos estão em `sessao.test.ts:476-505`, e o teste do 401 ganhou no título o recorte "com o token em dia" (455). A guarda de `renovarSessao` com `estado === 'anonima'` (212) fecha o caminho de ressurreição pelo cookie sobrevivente, com o teste de `sessao.test.ts:507-525` e a asserção de "nenhum `POST /v1/sessao/renovar` depois do Sair" em `e2e/entrar.spec.ts:363-375`. Confirmei no servidor que a inferência "401 com token novo = sessão morta" é consistente: `renovar` e a guarda usam o mesmo `sessaoAindaVale` (`apps/api/src/sessao/renovacao.service.ts:112`), então não há estado em que o `DELETE` 401 e o cookie ainda reviva a sessão.

Sobre o risco residual do aviso em memória: está declarado na techspec seção 9 e o próprio e2e o exercita (`e2e/entrar.spec.ts:380-383`), ou seja, foi decidido e registrado, não escondido.

```
VEREDITO: APROVADO
Escopo: respeitado — `/e/:slug`, `/convite`, `/vinculos`, seletor de escola e timer de inatividade ficaram de fora; `/mfa`, `/mfa/configurar` e `/escolher-escola` entram só como `EmConstrucao`, que é o que a 18.3 pede. A extração de `urlDoBancoDeTeste` para `tools/ci/compose.ts` e o `export {}` da janela em `renovacao.service.ts` são consequência direta do que a tarefa precisava (seed do e2e e contrato único), não trabalho de outra tarefa.
Aderência à Tech Spec: ok — a seção 9 foi atualizada com as três divergências reais (`/` autenticada e casca em `/sistema`, estado de sessão fora do TanStack Query, `buscarDaApi` anônimo com `chamarComSessao` separado no lugar de "buscarDaApi manda Authorization"), cada uma com o motivo escrito.
Portão local: carimbo válido (typecheck, lint, test, e2e, infra)
Bloqueantes: nenhum
Recomendações:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/cliente.ts:43 — `codigoDaResposta` deduz código para 429, 502, 503 e 504, mas não para 401. Um 401 que não venha do filtro global da API (borda, proxy, resposta sem corpo) vira `ERRO_INTERNO`: `abrirSessaoPeloCookie` mostraria "indisponível" em vez de levar à entrada, e `chamarComSessao` não renovaria. Uma linha ao lado das outras resolve.
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Entrar.tsx:58 — `saidaPendente()` é lido durante a renderização sem assinatura. Hoje funciona porque `sair()` grava o resultado antes de `esquecerSessao()`, mas o aviso passa a depender dessa ordem; um `useSyncExternalStore(assinarSessao, saidaPendente)` tira a dependência. (Já registrada como não aplicada.)
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Entrar.tsx:10 e /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/cliente.ts:108 — duas funções para transformar erro em texto (`mensagemDaFalha` e `mensagemDoErro`). A próxima tela vai ter de escolher entre as duas sem critério escrito; vale um caminho só, com o contexto como parâmetro. (Já registrada.)
- A barra "Educa.ia" está repetida em `Entrar.tsx:51-53`, `EmConstrucao.tsx:9-11` e `Cabecalho.tsx:28-30`. Quando a identidade visual do Gabriel chegar, são três lugares para mudar. (Já registrada.)
```

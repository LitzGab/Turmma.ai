# Correção — a esteira descarta o traço do e2e que falhou, e o vermelho fica indiagnosticável

**Origem:** esteira run 35517746419 (commit `38ce195`), achado como crítico 1 da rodada 2 de
`tasks/prd-identidade-e-tenancy/validacao.md`
**Subagentes obrigatórios:** `infra-guardian` (esteira e ambiente), `privacy-guardian` (o artefato
publicado leva captura de tela e corpo de requisição)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Na execução 35517746419, `e2e/escola-e-vinculos.spec.ts:185` `[celular]` falhou:

```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('heading', { name: 'Olá, Professora sintética 6d728d84' })
Timeout: 20000ms
Error: element(s) not found
```

Caso de 27,4 s. O mesmo caso no `chromebook`, na mesma execução, passou em 11,7 s.

**Não reproduz.** Oito observações nesta máquina, todas verdes e estáveis:

| Como rodei | Duração do caso |
|---|---|
| isolado no `celular`, 3 repetições | 11,1 s · 11,2 s · 11,2 s |
| suíte inteira (132 casos, 6 trabalhadores) | 11,2 s (`celular`), 10,5 s (`chromebook`) |
| suíte inteira com 12 trabalhadores, para forçar disputa de login pelo mesmo IP | 11,8 s (`celular`), 11,2 s (`chromebook`) |

E **a execução seguinte da esteira passou inteira** (run 35519996216, commit `0dfce1b`, que só leva
documentação): e2e, integração, infra e verificar, todos `success`. O vermelho não voltou.

Hipóteses levantadas e descartadas com evidência:

- **Lentidão geral do runner.** Não: na mesma execução os casos do `chromebook` ficaram em 11,7 s,
  igual a esta máquina.
- **Fase do `celular` degradada.** Não: os outros casos do `celular` naquela execução ficaram entre
  10,2 s e 15,1 s. O caso falho é o único fora da curva.
- **Peso do caso (dois logins, MFA pela interface).** É o caso com mais passos, mas não é fora da
  curva: `mfa.spec.ts` tem casos de 12,5 s, 14,7 s e 15,0 s na mesma execução.
- **Segundo fator exigido no segundo login.** Não: `etapaDoLogin`
  (`apps/api/src/sessao/login.service.ts:146-150`) só exige MFA de `coordenador`, e o segundo login
  do caso escolhe o acesso de `professor`.
- **Fila do hash de senha e limite por IP.** O e2e inteiro entra por 127.0.0.1, com
  `LIMITE_LOGIN_EMAIL_IP_MIN=60` e `LOGIN_HASH_CONCORRENCIA=2` (`.env.example`), e o rebaixamento
  faz a tentativa esperar em vez de ser recusada (regra 80, item 1). Era a hipótese mais promissora,
  e a suíte com 12 trabalhadores foi feita para forçá-la: não reproduziu.
- **Toque perdido antes da hidratação.** Não se aplica: a web é SPA com Vite, sem SSR, e o `tap()` de
  `acionar` (`e2e/escola-e-vinculos.spec.ts:36-40`) cai em botão já renderizado, com o Playwright
  esperando estabilidade.

O que **não** está descartado, e fica registrado: o perfil `celular` tem caminho de código próprio no
teste (`tap()` em vez de `click()`), e oito observações verdes não excluem uma corrida de baixa
probabilidade. Limitar isso pediria `--repeat-each` alto só no `celular`, que é trabalho para o
`/retro` e não para esta correção.

## Causa

A causa do vermelho do caso **não foi estabelecida**, e é isso que esta correção trata.

`playwright.config.ts:35` guarda o traço de toda falha (`trace: 'retain-on-failure'`), e o Playwright
escreve em `test-results/<caso>/` o `trace.zip` e o `error-context.md`. O `ci.yml` **não publica
artefato nenhum**: o job do e2e roda `npm run ci:e2e` e termina, e o `test-results/` morre com o
runner.

Verificado nas duas pontas:

- na execução que falhou, `gh api repos/.../actions/runs/35517746419/artifacts` devolve lista vazia;
- localmente, um caso que falha de propósito deixa em disco
  `test-results/<caso>/trace.zip` e `test-results/<caso>/error-context.md`.

O traço tem a linha de tempo das requisições, e é exatamente ele que diria para onde foram os 20 s
daquele `toBeVisible` — se a tela ficou na escolha de escola, se a resposta de
`POST /v1/sessao/escola` demorou, ou se a tentativa foi rebaixada na fila do login. Sem ele, todo
vermelho de e2e na esteira volta para o mesmo lugar: hipótese sem prova.

Não mexo no caso. Ele passa em oito observações aqui e passou na execução seguinte da esteira;
reestruturar um teste de isolamento por uma causa que não se sustenta seria trocar cobertura real
por palpite (D53, e o segundo `<critical>` da `/corrigir`).

## Teste que reproduz

`tools/ci/esteira.test.ts` › **"o e2e publica o traço da falha, só quando falha e por prazo curto:
sem isso o vermelho fica indiagnosticável"**. O repositório já afirma o próprio workflow em teste, e
esta é a asserção que faltava: o job do e2e tem um `upload-artifact`, com `failure()` e `cancelled()`
na condição, caminho que bate com o diretório de saída do Playwright e prazo de no máximo 7 dias.

Com o passo removido do `ci.yml`, a guarda fica vermelha
(`AssertionError: expected [] to have a length of 1`); com ele, verde. É o vermelho antes / verde
depois, e não só a promessa de um artefato futuro.

Acompanham duas asserções de borda: a lista de ações permitidas continua fechada (agora com
`upload-artifact`, oficial e fixada por SHA — ação de terceiro na esteira roda com acesso ao
repositório clonado), e nenhum job além do e2e publica artefato.

**A guarda está amarrada ao `playwright.config.ts`, não só à forma do passo** (exigido na rodada 1
do `test-engineer`). Sem esse elo, três caminhos deixariam a esteira verde publicando um diretório
vazio, e o defeito voltaria em silêncio. Os três foram provados um a um, com o resto intacto:

| Mudança | Guarda |
|---|---|
| `trace: 'off'` no `use` de topo | ❌ pegou |
| `trace: 'on'` no `use` de topo | ❌ pegou |
| `outputDir` de topo apontado para outro diretório | ❌ pegou |
| **`trace: 'on'` dentro de `projects[].use` do `celular`** | ❌ pegou |
| **`outputDir` dentro de `projects[]` do `celular`** | ❌ pegou |
| passo de publicação movido para antes do `npm run ci:e2e` | ❌ pegou |
| tudo restaurado | ✅ 9 de 9 |

A guarda importa a configuração e compara, **resolvendo o valor efetivo por projeto**: o modo de traço
tem de ser exatamente `retain-on-failure` (`'on'` também guardaria na falha, mas retém os casos verdes
também, e o artefato é público), e o `path` publicado tem de bater com o `outputDir` efetivo, que é o
padrão `test-results` quando ninguém declara.

As duas últimas linhas da tabela são a correção do bloqueante da rodada 5: `projects[].use` vence o
`use` de topo, então uma guarda que olhasse só o topo seria evadível por uma linha dentro do projeto
`celular` — justamente o projeto onde o vermelho desta correção aconteceu.

## Correção

Um passo no job do e2e de `.github/workflows/ci.yml`:

- publica `test-results/`, que é onde ficam o `trace.zip` e o `error-context.md`. Só isso: o
  `reporter` é `list` e `github` (`playwright.config.ts:30`), sem diretório de relatório para publicar;
- `actions/upload-artifact` fixado por SHA, como as outras ações do arquivo;
- `retention-days: 7`: o artefato serve para diagnosticar a execução, não para arquivo. Prazo curto
  reduz a janela em que ele existe;
- `if: failure() || cancelled()`: com `timeout-minutes: 30`, um e2e travado é **cancelado**, não
  "failure". Vale registrar o limite disto, apontado pelo `infra-guardian`: o caso morto pelo prazo
  não tem `trace.zip` finalizado, porque o `retain-on-failure` só persiste quando o caso **termina**
  em falha. O `cancelled()` garante que se publique o que já existe em disco (traços de casos que
  falharam antes do estouro), não o traço do caso que foi morto;
- `if-no-files-found: warn`, não `ignore`: diretório vazio tem de aparecer no log em vez de sumir. O
  aviso não distingue a causa — configuração do traço mudada, diretório de saída mudado ou falha ao
  subir o compose produzem o mesmo vazio —, mas qualquer uma delas é coisa que precisa ser vista;
- só na falha ou no cancelamento: execução verde não publica nada, e o custo de armazenamento fica em
  zero no caminho normal.

O SHA fixado foi conferido contra a tag: `v7.0.1` → `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`.

**O que esta correção não compra.** Com `retries: 0` (`playwright.config.ts:29`) e a regra de só
commitar sobre esteira verde, um vermelho não reproduzido continua travando a tarefa seguinte. Isto
compra **diagnóstico**, não imunidade: na próxima ocorrência haverá a linha de tempo das requisições
para achar a causa, em vez de outra rodada de hipóteses.

**Sobre o conteúdo (regra 20).** O traço leva captura de tela, DOM e corpo de requisição do e2e, o
que inclui a senha sintética, o token de sessão, o segredo de MFA e os códigos de recuperação daquele
caso.

**O repositório é público** (`LitzGab/Turmma.ai`, `visibility: PUBLIC`), então o artefato é baixável
por qualquer pessoa enquanto existir.

Como isso foi corrigido, pela ordem real dos fatos, porque importa para o valor da revisão: uma
versão anterior deste documento afirmava "repositório privado", o que é falso, e a **rodada 1 do
`privacy-guardian` decidiu sobre essa premissa errada** (terminou às 00:33:34). O `infra-guardian`
apontou o erro na rodada 1 dele, em seguida (00:34:40). A premissa foi então corrigida, a minimização
apertada (`retain-on-failure` em vez de aceitar `'on'`), e o `privacy-guardian` **rodou de novo sobre
o fato certo** — é a rodada 2 dele que vale como aprovação de regra 20 aqui. A rodada 1 não cobre o
fato corrigido nem o estreitamento.

Com o fato certo, o que sustenta a publicação é que ela **não revela nada que o repositório público
já não contenha**:

- todo dado do e2e é sintético, criado e descartado dentro da execução, com nome inventado e e-mail
  no domínio reservado `.invalid` (`e2e/__fixtures__/sessao.ts`, regra 20, item 17). Nenhum titular
  real existe nesse ambiente, e não há dump nem ambiente compartilhado: o compose de teste é projeto
  próprio e cai com `down --volumes`;
- as credenciais que aparecem no traço derivam das chaves de `.env.example` e `infra/teste.env`, que
  são **versionadas no próprio repositório público** e rotuladas sintéticas. Quem baixa o artefato já
  tinha essas chaves;
- nenhum segredo de verdade entra no job: não há `secrets.*` no workflow, e o checkout usa
  `persist-credentials: false`.

Por ser público, a minimização pesa mais: `MODOS_QUE_GUARDAM_NA_FALHA` aceita só `retain-on-failure`,
e não `'on'`, para que o artefato leve o traço do caso que falhou e não o dos 132 casos da suíte.
Prazo de 7 dias, com teto afirmado em teste.

## Evidência

**O defeito, medido.** Na execução que falhou, a lista de artefatos vem vazia:

```
$ gh api repos/LitzGab/Turmma.ai/actions/runs/35517746419/artifacts --jq '.artifacts[]'
(nada)
```

**O traço existe em disco.** Com um caso que falha de propósito, no perfil `celular`:

```
test-results/<caso>/trace.zip
test-results/<caso>/error-context.md
```

Ou seja, o `retain-on-failure` sempre funcionou; o que faltava era publicar.

**Vermelho antes, verde depois**, em `tools/ci/esteira.test.ts`:

| `ci.yml` | Guarda nova |
|---|---|
| sem o passo de publicação | ❌ `expected [] to have a length of 1` |
| com o passo | ✅ 9 de 9 verdes no arquivo |

**A conferência final continua sendo a esteira:** a primeira falha de e2e depois desta correção tem
de trazer o artefato `traco-do-e2e`. Execução verde não publica nada, que é o desejado.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-20 22:52:40 | 2026-09-20 22:57:02 | `test-engineer` | 1 | REPROVADO | a24cb10d05fcfa226 |
| 2026-09-20 23:26:43 | 2026-09-20 23:29:26 | `test-engineer` | 2 | APROVADO | a99350c17937c5cff |
| 2026-09-20 23:57:53 | 2026-09-20 23:59:46 | `test-engineer` | 3 | APROVADO | aaa849d82c2ec989c |
| 2026-09-21 00:28:02 | 2026-09-21 00:29:29 | `test-engineer` | 4 | APROVADO | af66b9b9b63e1c12c |
| 2026-09-21 00:29:57 | 2026-09-21 00:33:34 | `privacy-guardian` | 1 | APROVADO | a01569812738087a1 |
| 2026-09-21 00:29:44 | 2026-09-21 00:34:40 | `infra-guardian` | 1 | APROVADO | a2ae255e30635244d |
| 2026-09-21 01:04:45 | 2026-09-21 01:06:55 | `infra-guardian` | 2 | APROVADO | a18ebf14ba8bb5651 |
| 2026-09-21 01:04:19 | 2026-09-21 01:07:43 | `privacy-guardian` | 2 | APROVADO | a213ebb90289955cf |
| 2026-09-21 01:04:29 | 2026-09-21 01:08:28 | `test-engineer` | 5 | REPROVADO | a8b091afb637a8a30 |
| 2026-09-21 02:11:19 | 2026-09-21 02:12:49 | `privacy-guardian` | 3 | APROVADO | a83fb5acc18fac57e |
| 2026-09-21 02:11:07 | 2026-09-21 02:13:11 | `test-engineer` | 6 | APROVADO | a6bdc1644ef4bebaa |
| 2026-09-21 02:14:20 | 2026-09-21 02:15:33 | `test-engineer` | 7 | APROVADO | a862cc9bffcc7f425 |
| 2026-09-21 02:14:38 | 2026-09-21 02:15:47 | `infra-guardian` | 3 | APROVADO | a2c2c420709168184 |
| 2026-09-21 02:14:28 | 2026-09-21 02:15:54 | `privacy-guardian` | 4 | APROVADO | a9d7cba76ec844c3f |

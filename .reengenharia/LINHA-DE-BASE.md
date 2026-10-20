# Linha de base — plano da Etapa 4 ⛔

Escrito pelo Arquiteto em 20/10/2026, para o **Implementador** executar no andar da spec (`spec/reengenharia`). O
Arquiteto já rodou a parte estática como prévia (DESCOBERTA §3), para validar os comandos. A suíte, o compose de teste e
a cobertura ficam para o Implementador. Depois de medir, ele preenche a §5. Com isso o Orquestrador leva a parada da
Etapa 4 ao Joaquim, com a §6 (priorização e ondas) que o Arquiteto ajusta aos números.

**Nada aqui altera o repositório:** nenhuma dependência entra no `package.json` nem no lock, e nenhum arquivo de
configuração muda. O que for instalado vai com `--no-save` ou numa pasta de rascunho fora da árvore.

## 0. Antes de medir

```bash
git status --short                 # tem de sair vazio; se não sair, pare e avise (preservar trabalho do Joaquim)
git log -1 --format='%h %s'        # anote o commit medido
node --version                     # 22.23.2
docker compose version
M=.processo/reengenharia/linha-de-base   # fora do git (.processo/ está no .gitignore)
mkdir -p "$M"
```

Toda saída vai para `$M/`. No fim, o resumo vai para a §5 deste arquivo, e nenhum JSON bruto é versionado.

## 1. A suíte, como a esteira roda

Tudo de uma vez, com o banco limpo e na fila de carga da máquina (`flock`, já embutido). Rode **em segundo plano** e
espere pela notificação: leva perto de 1 hora.

```bash
date -Is > "$M/suite.inicio"
node tools/processo/portao-local.ts --e2e --infra > "$M/suite.log" 2>&1; echo "saida $?" >> "$M/suite.log"
date -Is > "$M/suite.fim"
```

Registre: o resultado de cada etapa (tipos, lint, gitleaks, audit, unidade, integração, infra, e2e), o tempo de cada
uma (o portão imprime as etapas; se não imprimir o tempo, use as marcas de hora do log), e cada caso vermelho com o
nome e a primeira linha do erro.

**Se algo ficar vermelho:** não corrija e não rode de novo para ver se passa. Registre como **preexistente** (a base
`a9d34cd` não tem mudança de código desde a última esteira verde da `develop`, `f1cb6ee`; DECISOES R13). Se o mesmo
caso passar na esteira e falhar na máquina, anote como **instável na máquina**. Isso também é linha de base.

## 2. Cobertura (execução separada; DECISOES R9)

```bash
npm i --no-save --no-audit --no-fund @vitest/coverage-v8@5.0.0
EDUCA_BANCO_NOVO=1 npx vitest run --project unidade --project integracao \
  --coverage.enabled --coverage.provider=v8 \
  --coverage.include='apps/*/src/**' --coverage.include='packages/*/src/**' \
  --coverage.reporter=json-summary --coverage.reporter=text-summary \
  --coverage.reportsDirectory="$M/cobertura" > "$M/cobertura.log" 2>&1
git status --short   # o --no-save não pode ter tocado package.json nem package-lock.json
```

Registre as linhas, ramos e funções cobertos **por pacote** (`apps/api`, `apps/web`, `apps/worker`, `apps/despachante`,
`apps/realtime`, `packages/nucleo`, `packages/shared`), a partir de `$M/cobertura/coverage-summary.json`. O e2e não entra
na cobertura. Se a integração com cobertura passar do `testTimeout`, registre a limitação e meça só a unidade.

Depois: `npm ci` (ou `git checkout package-lock.json && npm ci`) se o `git status` mostrar qualquer arquivo alterado.

## 3. Medição estática (os mesmos comandos da prévia)

Do diretório raiz do checkout. Cada um leva segundos.

```bash
# código morto e dependências (DECISOES R8)
npx -y knip@6.42.1 --config .reengenharia/medicao/knip.json --reporter json --no-progress --no-exit-code > "$M/knip.json"

# duplicação
npx -y jscpd@5.4.1 apps packages tools e2e infra --pattern "**/*.{ts,tsx}" \
  --ignore "**/node_modules/**,**/dist/**,**/drizzle/**,**/migrations/**" \
  --min-tokens 70 --reporters json --output "$M/jscpd" --silent

# ciclos e direção entre pacotes (DECISOES R7: o depcruise precisa do typescript ao lado)
D=/tmp/educa-depcruise; npm i --prefix "$D" --no-audit --no-fund dependency-cruiser@18.7.0 typescript@6.0.3
"$D/node_modules/.bin/depcruise" --config .reengenharia/medicao/depcruise.cjs --output-type json apps packages > "$M/depcruise.json"

# complexidade, tamanho de função e aninhamento (limiares de medição, DECISOES R10)
npx eslint apps packages --no-warn-ignored \
  --rule '{"complexity":["warn",{"max":10}]}' \
  --rule '{"max-lines-per-function":["warn",{"max":80,"skipBlankLines":true,"skipComments":true}]}' \
  --rule '{"max-depth":["warn",4]}' -f json -o "$M/eslint-complexidade.json"

# vulnerabilidades (produção e tudo)
npm audit --omit=dev --json > "$M/audit-producao.json"; npm audit --json > "$M/audit-tudo.json"
```

Para contar a complexidade **só em produção**, exclua os arquivos `.test.`, `.spec.`, `/test/` e `__fixtures__/` (o
script da prévia está no histórico da sessão do Arquiteto; a regra é essa). Confira o `depcruise.json` em
`summary.totalCruised`: se der 0 módulos, o typescript não foi achado.

## 4. Tamanho do que se entrega

```bash
npm run build -w @educa/shared && npm run build -w @educa/web
npx size-limit --json > "$M/size-limit.json"             # tetos do .size-limit.json, brotli
du -sb apps/web/dist/assets | tee "$M/web-dist.txt"
docker image ls --format '{{.Repository}}:{{.Tag}} {{.Size}}' | grep -i educa | tee "$M/imagens.txt"   # imagens que o compose da §1 construiu
```

Os tamanhos de imagem só valem se a §1 construiu as imagens nesta execução. Se não construiu, registre que não mediu.

## 5. Resultados (medidos em 20/10/2026 pelo Implementador)

**Commit medido:** `08dc125` (HEAD da `spec/reengenharia`; só difere da base `a9d34cd` por documentos de `.reengenharia/`, sem mudança em `apps`, `packages`, `tools`, `e2e` nem `infra`) · **Data:** 20/10/2026, das 08:03 às 10:10 (-03) · **Máquina:** AMD Ryzen 5 7600 (6 núcleos, 12 threads), 30 GiB de RAM, Linux 7.2, Node 22.23.2, Docker Compose 5.6.0

| Medida | Valor | Fonte |
|---|---|---|
| Tipos (`typecheck`) | verde (raiz, e2e, infra e 7 workspaces) | §1 |
| Lint + guardas | verde (`eslint --max-warnings=0` e `tools/guardas/lint.ts`: nenhuma violação) | §1 |
| gitleaks / `npm audit` (alta, produção) | gitleaks: 600 commits, 45,8 MB, 0 vazamentos · audit de produção: 0 vulnerabilidades | §1 |
| Unidade: casos, vermelhos, tempo | 4.621 casos, **1 vermelho** (preexistente na árvore, ver abaixo) · 444 arquivos de unidade e integração juntos | §1, §2 |
| Integração: casos, vermelhos, tempo | 1.909 casos, 0 vermelhos · o vitest corre unidade e integração numa execução só: **754 s** (12,6 min) as duas, 770 s com cobertura | §1, §2 |
| Infra: casos, vermelhos, tempo | 57 casos em 10 arquivos, 0 vermelhos · **35,5 min** (2.130 s) | rodado à parte, ver "não medido" |
| E2E: casos (×2 projetos), vermelhos, tempo | 1.304 casos, já somados os dois projetos (652 em `chromebook` e 652 em `celular`), 0 vermelhos · **48,7 min** de teste, 49,1 min de relógio | rodado à parte, ver "não medido" |
| Tempo total do portão completo | **~99 min** em série, nesta máquina: 1,5 (tipos, lint, guardas, `npm ci` conferido) + 12,6 (unidade e integração) + 49,1 (e2e) + 35,5 (infra). A esteira paraleliza em jobs: 39,5 min de relógio | §1 |
| Cobertura de linhas / ramos por pacote | `apps/api` 97,9 % / 89,0 % · `apps/web` **76,4 % / 72,6 %** · `apps/worker` 92,5 % / 87,0 % · `apps/despachante` 89,2 % / 91,1 % · `apps/realtime` 91,1 % / 76,9 % (26 ramos) · `packages/nucleo` 96,0 % / 91,1 % · `packages/shared` 99,7 % / 93,2 %. Total: 88,5 % linhas, 80,9 % ramos, 84,7 % funções. Funções: api 97,6, web 73,4, worker 90,6, despachante 88,8, realtime 94,9, nucleo 90,7, shared 98,6 | §2 |
| Código morto: arquivos, exports, tipos, dependências | 0 arquivos, **162 exports**, **26 tipos**; dependências: `pino` sem uso em `apps/despachante` e em `apps/worker`, `tailwindcss` em devDependencies da web sem uso; 10 pacotes usados sem declarar no workspace que os usa (`pg`, `ioredis`, `bullmq`, `drizzle-orm`, `jose`, `otpauth`, `@node-rs/argon2`, `socket.io-client`, `@opentelemetry/sdk-metrics`, `k6`; 44 ocorrências) | §3 knip |
| Duplicação: % e linhas (total e só produção) | total **1,96 %**, 398 clones, 4.921 linhas (de 251.158, 1.427 arquivos). Só produção (fora teste, `e2e/` e `infra/`, nos dois lados do clone): 49 clones, 599 linhas | §3 jscpd |
| Ciclos e violações de camada | **3 ciclos**, 0 violação de camada, em 1.304 módulos e 6.104 dependências: `operacao/operador.repository` ↔ `prazos-da-sessao`, `sessao/login.service` ↔ `conclusao-de-login`, `sessao/login.service` ↔ `convite.service` | §3 depcruise |
| Funções em produção acima de 10 / 80 linhas / aninhamento 4 | **138** / **55** / **2** (com teste e fixture: 171 / 328 / 6) | §3 eslint |
| Vulnerabilidades (crítica, alta, moderada) | produção: 0 / 0 / 0. Tudo: 0 / **2** / **4**, todas de ferramenta de desenvolvimento: alta em `brace-expansion` e `source-map-js` (transitivas, com correção disponível); moderada em `drizzle-kit`, `esbuild` e dois `@esbuild-kit/*` | §3 audit |
| JS de entrada da web (brotli) e por área | entrada **90.095 B** (teto 150.000) · operador 14.129 (60.000) · coordenação 2.394 (16.000) · professor 2.557 (8.000) · aluno 2.169 (5.000) · peças 21.498 (40.000). Todos dentro do teto. `apps/web/dist/assets` inteiro: 1.147.986 B | §4 |
| Imagens Docker | **não medido nesta execução** (a corrida usou imagens em cache). Só como indicação, as que existem na máquina: api 501 MB, worker 375, despachante 375, realtime 360, web 989 (`vite preview`) | §4 |
| Esteira (referência) | **39,5 min** de relógio, **260 min** de runner (verificar 4,9; integração 17,4; infra 39,5; e2e 18,6 a 34,4 por fatia) | run 39344097590, `f1cb6ee` |

**Vermelhos preexistentes:**

- `tools/guardas/guardas.test.ts` > "nada fora de mockups/ aponta para o protótipo: o que não passa pelo lint não entra no produto". Primeira linha do erro: `AssertionError: expected [ …(2) ] to deeply equal []`, com `.reengenharia/medicao/depcruise.cjs` e `.reengenharia/medicao/knip.json`. **Não é preexistente no código; vem desta spec.** O commit `2d9ad5e` trouxe os dois arquivos de medição, que citam a palavra `mockups` (a exclusão do protótipo), e o teste só aceita a palavra em `.md` e em três arquivos fixos. Reproduziu nas duas execuções (suíte e cobertura). A `develop` está verde (`f1cb6ee`), e esta branch vai ficar vermelha na esteira por causa disso. Eu não corrigi, como manda o plano; a decisão é do Arquiteto (mover os arquivos para fora do alcance do teste, escrever o caminho de outro jeito, ou incluí-los na lista do teste).
- Efeito sobre a medição: o `portao-local.ts --e2e --infra` **para no primeiro vermelho**. Ele terminou em `test` com "Nenhum carimbo gravado", e e2e e infra não chegaram a rodar nele. A cobertura também não gerou relatório com o vermelho, e precisou de `--coverage.reportOnFailure=true`.
- Fora esse caso, nenhum vermelho, nenhum instável na máquina. Os avisos de "Connection terminated" e "statement timeout" no log da unidade são de testes que provocam a falha de propósito.

**O que não foi possível medir, e por quê:**

- **E2E e infra fora do portão.** Por causa da parada acima, rodei `npm run test:e2e` e `npm run test:infra` à parte, sem `EDUCA_BANCO_NOVO`, no ambiente que a integração do portão tinha deixado. É o mesmo comando e o mesmo ambiente que o portão usaria, mas o tempo do e2e e do infra não passou pelo `flock` do portão.
- **Tempo por etapa do portão** (tipos, lint, guardas): o portão não imprime hora; a soma de 1,5 min vem da hora de início da suíte (08:03:56) e do `Start at 08:05:26` do vitest. Unidade e integração não têm tempo separado porque correm numa execução só.
- **Imagens Docker:** as imagens do compose de teste eram do cache (as da web, de 16 h antes, e as demais, de 7 dias), então o tamanho não vale como medida desta execução.
- **Cobertura do e2e:** fora, como o plano diz. A cobertura da web (76,4 %) é só a da unidade e da integração.
- A cobertura rodou duas vezes (a primeira sem relatório, por causa do vermelho). O `package.json` e o `package-lock.json` não mudaram em nenhum momento; `npm ci` restaurou `node_modules` no fim e o `git status` ficou limpo.

**Prévia do Arquiteto (20/10), para comparar:** knip 0 arquivos, 162 exports, 26 tipos; jscpd 1,96% (398 clones,
4.921 linhas); 3 ciclos, 0 violação de camada; 138 funções de produção acima de 10, 55 acima de 80 linhas, 2 com
aninhamento acima de 4. **A medição bateu com a prévia em todos os números.**

## 6. Priorização e ondas (proposta do Arquiteto, para a parada)

A ordem final sai com os números da §5. O que já se vê, por **impacto × risco × esforço**, aparece abaixo. As decisões
P1 a P10 estão em `DECISOES.md`, e nenhuma onda que dependa de uma delas começa sem a resposta do Joaquim.

| Prioridade | Problema | Impacto | Risco de mexer | Esforço | Depende de |
|---|---|---|---|---|---|
| 1 | IA e PDF em memória na API, sem fila, prioridade nem degradação (RISCOS S1, S2) | alto | alto | grande | P1 |
| 2 | Contratos implícitos: entrada HTTP por convenção, rotas sem contrato, job sem registro tipado (CONTRATOS §2, §4) | alto | médio | médio | P2, P3 |
| 3 | Trava genérica de tenant e de camadas; a de hoje é módulo a módulo (RISCOS S3) | crítico | baixo (só soma trava) | médio | Etapa 6 (dependência nova para a trava) |
| 4 | `docs/arquitetura.md` e a ausência de "onde implemento" (U12) | alto para manutenção | baixo | médio | Etapa 11 |
| 5 | Duplicação estrutural: a pilha de sessão do operador ×2 na API e na web (~2,5 mil linhas) | médio | alto (segurança) | grande | P4 |
| 6 | Fronteiras da API: `sessao/` como biblioteca, `estrutura/entrada.ts` global, `ops` ↔ `operacao`, os 3 ciclos | médio | médio | médio | P10 |
| 7 | Web: `api/sessao.ts` com seis assuntos, ~65 `EstadoErro` repetidos, sino em N+1 (S15), `chamarApi` sem timeout (S16), kit com variantes paralelas | médio | médio | médio | endpoint agregado (contrato novo) |
| 8 | Teste: helpers e2e copiados (`acionar` ×39, `portao` ×20, `comBanco` ×7), e2e semeando por SQL cru, 8 fábricas de escola, limpeza manual | médio (custo de cada onda) | médio | médio | — |
| 9 | Infra mecânica: 17 scripts com a mesma cadeia de build, 4 Dockerfiles iguais, ambiente copiado no compose, `vite preview` como imagem da web | baixo | baixo | pequeno | — |
| 10 | Harness: base fixa de ~74 KB por sessão, contradições de texto, contrato por regex | alto em custo | alto | médio | Etapa 9 ⛔ |

**Ondas propostas** (na ordem de dependência da DESCOBERTA §4; cada onda deixa o portão verde e o comportamento igual):

1. **Contratos primeiro:** em `shared`, o registro tipado de jobs; a borda única de validação (P2); OpenAPI (P3), se
   aprovado; `throw` tipado. Rede de proteção antes de mover qualquer coisa.
2. **Fronteiras da API e do nucleo:** os 3 ciclos; `estrutura/entrada.ts` para um lugar comum; `sessao/` em subpastas;
   `ops` e `operacao` (P10); pilha do operador (P4), se aprovado. A trava de camada entra junto.
3. **Execução e resiliência:** IA e PDF para a fila, com prioridade e degradação (P1), se aprovado. É a onda de maior
   risco, e vem depois dos contratos e das fronteiras.
4. **Web:** sessão parametrizada (P4), peças de estado que recebem a consulta, endpoint agregado do sino, timeout no
   cliente, kit sem variantes paralelas.
5. **Testes e infra:** helpers únicos, uma fábrica de escola, limpeza por FK automática, Dockerfile único, runner de
   `ops`. Pode correr em linha paralela às ondas 2 e 4, desde que não toque os mesmos arquivos.
6. **Etapa 9 (harness) ⛔** e **Etapa 11 (documentação oficial)**, como a missão manda.

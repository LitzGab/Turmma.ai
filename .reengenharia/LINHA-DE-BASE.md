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

## 5. Resultados (preencher)

**Commit medido:** `____` · **Data:** ____ · **Máquina:** ____ (CPU, RAM)

| Medida | Valor | Fonte |
|---|---|---|
| Tipos (`typecheck`) | | §1 |
| Lint + guardas | | §1 |
| gitleaks / `npm audit` (alta, produção) | | §1 |
| Unidade: casos, vermelhos, tempo | | §1 |
| Integração: casos, vermelhos, tempo | | §1 |
| Infra: casos, vermelhos, tempo | | §1 |
| E2E: casos (×2 projetos), vermelhos, tempo | | §1 |
| Tempo total do portão completo | | §1 |
| Cobertura de linhas / ramos por pacote | | §2 |
| Código morto: arquivos, exports, tipos, dependências | | §3 knip |
| Duplicação: % e linhas (total e só produção) | | §3 jscpd |
| Ciclos e violações de camada | | §3 depcruise |
| Funções em produção acima de 10 / 80 linhas / aninhamento 4 | | §3 eslint |
| Vulnerabilidades (crítica, alta, moderada) | | §3 audit |
| JS de entrada da web (brotli) e por área | | §4 |
| Imagens Docker | | §4 |
| Esteira (referência) | **39,5 min** de relógio, **260 min** de runner (verificar 4,9; integração 17,4; infra 39,5; e2e 18,6 a 34,4 por fatia) | run 39344097590, `f1cb6ee` |

**Vermelhos preexistentes:** (caso, primeira linha do erro, se passa na esteira)

**O que não foi possível medir, e por quê:**

**Prévia do Arquiteto (20/10), para comparar:** knip 0 arquivos, 162 exports, 26 tipos; jscpd 1,96% (398 clones,
4.921 linhas); 3 ciclos, 0 violação de camada; 138 funções de produção acima de 10, 55 acima de 80 linhas, 2 com
aninhamento acima de 4.

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

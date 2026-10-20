# Reengenharia — Etapa 1: descoberta e pesquisa

Feito pelo Arquiteto em 20/10/2026, na `spec/reengenharia` (base `a9d34cd`). Marcas: **[código]** conferido no
repositório · **[doc]** dito em documentação ou em fonte web · **[hipótese]** a conferir. Os relatórios brutos de cada
unidade, com `arquivo:linha`, estão em `unidades/`. Este arquivo cita a unidade de onde veio cada achado (U01 a U12, R).

## 1. O ambiente

### Stack e versões [código: `package.json` de cada pacote, `infra/compose.yml`, `.nvmrc`]

| Camada | O que é | Versão |
|---|---|---|
| Runtime | Node, com type-stripping para os scripts `.ts` de `tools/` | 22.23.2 (`engines` `>=22.18 <23`) |
| Linguagem | TypeScript `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`; `moduleResolution: nodenext`; `customConditions: ["source"]` | 6.0.3 |
| Monorepo | npm workspaces: `apps/*` (api, web, worker, realtime, despachante) e `packages/*` (shared, nucleo) | — |
| Backend | NestJS (`common`/`core` 12.0.1, `platform-express` 12.1.2, versões desalinhadas: U10) | 12.x |
| Banco | Postgres 18 com pgvector (a extensão não é usada: U12), Drizzle ORM 0.45.2 + drizzle-kit 0.31.10, 37 migrations | — |
| Fila | BullMQ 6.3.4 sobre Redis 8.8.2 (dois Redis: fila `noeviction` e cache LRU) | — |
| Storage | S3-compatível (SeaweedFS 4.46 local) | — |
| Frontend | React 19.3, Vite 8.3.0 (Rolldown), TanStack Query 5.102.8, Tailwind 4.3.3, wouter 3 | — |
| Contrato | zod 4.6.4, único em `packages/shared` | — |
| Testes | Vitest 5.0.0 (projetos `unidade`, `integracao`, `infra`), Playwright 1.63.0 (projetos `chromebook` e `celular`), axe | — |
| Infra local | Docker Compose: 2 api, 2 realtime, 2 despachante, 2 worker interativo, 2 worker de lote, borda Caddy 2.11.4, `grafana/otel-lgtm` 0.33.0, oidc-falso | — |
| Esteira | GitHub Actions, um workflow (`esteira`), actions fixadas por SHA, sem segredo | — |

### Comandos [código: `package.json` da raiz]

| Para | Comando | Observação |
|---|---|---|
| tipos | `npm run typecheck` | raiz, e2e, infra e cada workspace |
| lint | `npm run lint` | `eslint . --max-warnings=0` + `tools/guardas/lint.ts` (2ª passada que ignora comentário de desligar) |
| unidade + integração | `npm run test` | a integração sobe o compose de teste (`fileParallelism: false`, ~21 min com infra) |
| infra | `npm run test:infra` | ensaio real de alertas, métricas, borda |
| e2e | `npm run test:e2e` | `tools/ci/e2e.ts`, fila `flock` na máquina |
| guardas | `npm run guarda:segredo` (gitleaks em Docker), `npm run guarda:dependencias` (`npm audit --audit-level=high --omit=dev`) | |
| portão da tarefa | `node tools/processo/portao-local.ts --tarefa <doc>` | tipos, lint, guardas, unidade, testes alterados, mutações, carimbo |
| portão completo | `node tools/processo/portao-local.ts --e2e --infra` | o mesmo que a esteira, na máquina |
| build | `npm run build` | em cadeia: shared → nucleo → api → realtime → despachante → worker → web. Nenhum job da esteira o chama direto: o build acontece no `docker compose --build` (U10) |
| operação | 12 `ops:*`, 5 `carga*`/`ensaio:alertas` | cada um refaz o build de shared+nucleo+api e lê `--env-file=.env.example` (U10) |

### Ferramentas de qualidade: presentes e ausentes [código: U10 §12, R §1]

- **Presentes:** `tsc` estrito; ESLint 10 `strict` + react-hooks + 8 guardas próprias (`tools/guardas`: log sem dado
  pessoal, SDK de IA só no adaptador, teste sem desligar, espera de serviço, alerta com runbook…); gitleaks por digest;
  `npm audit`; size-limit por chunk + teste de build de verdade (150 kB brotli na entrada); axe no e2e; mutações
  declaradas por tarefa no portão (`tools/processo/mutacoes.ts`); teste de arquitetura da API
  (`apps/api/test/arquitetura.test.ts`, 1.403 linhas).
- **Ausentes:** código morto, duplicação, ciclos, complexidade e tamanho de função, cobertura de linhas, SAST, scan de
  imagem, lint de Dockerfile, Dependabot/Renovate, `jsx-a11y`, regras do typescript-eslint que usam tipo
  (`no-floating-promises`, `only-throw-error`; o projeto usa `strict` e não `strictTypeChecked`).

### O harness de agentes [código: U11]

| Peça | Onde | Tamanho |
|---|---|---|
| Contexto fixo de toda sessão | `CLAUDE.md` (408 linhas) + 7 regras sem `paths:` | ~74 KB, ~12 mil palavras |
| Regras | `.claude/rules/` 00 a 80 (só 30 e 50 com `paths:`) | 7,6 mil palavras |
| Papéis | `.claude/agents/`: 4 de terminal (arquiteto, implementador, mesa-de-revisao, validador), 9 revisores, `domain-researcher` | ~9,9 mil palavras |
| Skills nossas | 14 em `.claude/skills/`; `seguir` (528 linhas) e `executar-task` (412) são as maiores | ~26,3 mil palavras |
| Skills de terceiros | 12, em `skills-lock.json`; nenhum papel manda carregá-las | ~2,2 MB |
| Hooks | `SessionStart` (contexto por papel), `SubagentStop` (registra rodada de revisor), `PreToolUse` em `Bash` (barra commit sem revisão, sem carimbo ou sem marca, e push do time em `develop/release/main`) | `tools/processo/` 3,1 mil linhas + 3,2 mil de teste |
| Vitrine (a IA vê a tela) | `tools/vitrine/` | 729 + 376 de teste |

### O Maestri [doc: RESPOSTAS; código: `maestri list` deste terminal]

O térreo tem o Orquestrador (terminal Maestro, "Claude Code"), o Arquiteto, dois pares Implementador e Mesa, o
Validador e o "Claude Code #2". As rotinas são "Vigia do processo" (a cada 30 min, só acorda se `tools/processo/vigia.ts`
imprimir algo) e "Limpa o Orquestrador" (`/clear` a cada tarefa). Cada spec roda num andar com a branch
`spec/<funcionalidade>`, e a construção roda em até 3 linhas (`tools/processo/linhas.ts`, D79). Deste terminal, o
`maestri list` mostra só a ligação Arquiteto ↔ Orquestrador, e `maestri routine` é exclusivo do Maestro.

**Lacuna para a Etapa 9:** não existe papel para "análise por unidade". Foi feita com subagentes `general-purpose` de
uso único, que o protocolo não descreve. Revisão independente (Mesa e revisores com veto) e validação (Validador, sem
contato com quem implementou) já existem.

## 2. Pesquisa web [doc: `unidades/R-pesquisa.md`, com a URL de cada afirmação]

Fontes priorizadas: documentação oficial (knip.dev, docs.nestjs.com, orm.drizzle.team, docs.bullmq.io, zod.dev,
vitest.dev, eslint.org, code.claude.com/docs) e repositórios no GitHub (licença e data de publicação conferidas no
registro npm e na API do GitHub em 20/10/2026).

### O que é aplicado, adaptado ou rejeitado

| Item | Decisão | Por quê |
|---|---|---|
| knip 6.42.1 (código morto, exports e dependências) | **aplicar** na medição; trava só na 7.6, se aprovada | A única ferramenta viva do tipo, ISC. Precisa de entradas declaradas para Nest e `ops/*` (`medicao/knip.json`) |
| jscpd 5.4.1 (duplicação) | **aplicar** na medição | MIT, estático, 3 s no repositório |
| dependency-cruiser 18.7.0 (ciclos e camadas) | **aplicar** na medição; **candidato a trava** na 7.6, com baseline | MIT; regras de caminho, ciclos, métricas e `--baseline`. Precisa do `typescript` ao lado (DECISOES R7) |
| ESLint `complexity`, `max-lines-per-function`, `max-depth` | **aplicar** na medição; limiar de trava na Etapa 6 | Já vem no ESLint do projeto, sem dependência |
| `@vitest/coverage-v8` 5.0.0 | **aplicar** só na linha de base (`npm i --no-save`) | Peer exato do Vitest 5.0.0 (DECISOES R9) |
| madge, ts-prune, depcheck, unimported | **rejeitar** | Parado (madge, sem TS 6) ou arquivados |
| eslint-plugin-sonarjs (complexidade cognitiva) | **adiar** | Licença LGPL-3.0; decidir na 7.6 se a complexidade ciclomática não bastar |
| eslint-plugin-boundaries 7.2 | **adiar** (alternativa ao dependency-cruiser, com erro no editor) | O suporte ao ESLint 10 e aos alias TS não foi confirmado |
| eslint-plugin-import (`no-restricted-paths`) | **rejeitar**; `import-x` se for preciso | Não declara ESLint 10 |
| `@nestjs/terminus` | **provável rejeição** (Etapa 6) | O projeto já tem `/saude` e `/prontidao` próprios, com drenagem testada (U10) |
| cockatiel 4 (retry com jitter, disjuntor, bulkhead, timeout) | **candidato** para o gateway de IA na Etapa 6 | Cobre a regra 80.4 numa biblioteca; MIT, Node ≥22 |
| opossum 10 | **rejeitar** se o cockatiel entrar | Só disjuntor |
| BullMQ Pro (grupos por tenant) | **rejeitar** | Pago. O repositório já tem o padrão aberto equivalente: vaga por escola em Lua (U02, U06) |
| `z.toJSONSchema` → OpenAPI 3.0 | **candidato** para o contrato das rotas (DECISOES P3) | Nativo no zod 4, sem dependência |
| nestjs-zod, zod-openapi | **adiar** | Peer com zod 4.6.4 não conferido |
| RLS do Drizzle como segunda camada | **pergunta da Etapa 6** (DECISOES P5) | Existe e casa com a regra 10, mas toca o modelo de tenant |
| osv-scanner | **adiar** | Binário Go, fora do npm; segunda base de vulnerabilidade |
| gitleaks | **manter** | Em modo só-correção (o autor migra para o Betterleaks); reavaliar em 2027 |
| CLAUDE.md abaixo de 200 linhas, regras com `paths:`, SKILL.md abaixo de ~500 linhas, garantia em hook e não em texto | **aplicar na Etapa 9** (⛔) | É o que a documentação oficial da Anthropic diz hoje. O projeto está muito acima disso (U11) |
| AGENTS.md | **rejeitar por ora** | Só é lido sem CLAUDE.md. A recomendação oficial é o CLAUDE.md importá-lo, e não há outra ferramenta no time |
| `mattpocock/skills`, `obra/superpowers` (MIT) | **referência** para a 9.1, sem instalar | Nada se instala sem ler conteúdo, script e licença (missão, Etapa 1) |
| `anthropics/claude-code/plugins` | **não usar** | Sem licença SPDX detectada: tratar como todos os direitos reservados |

## 3. Medição estática preliminar (20/10, pelo Arquiteto, fora do repositório)

É uma prévia que valida os comandos da Etapa 4. A linha de base oficial é a do Implementador (`LINHA-DE-BASE.md`).

| Medida | Resultado | Ferramenta |
|---|---|---|
| Tamanho | ~251 mil linhas de TS/TSX em `apps`, `packages`, `tools`, `e2e`, `infra`; 529 arquivos de teste; 22 arquivos de produção acima de 400 linhas | `wc`, jscpd |
| Duplicação | 1,96% (398 clones, 4.921 linhas). A maior parte está em teste e e2e. Em produção, os maiores são as páginas de entrada da operação contra as da escola (`Mfa.tsx`, `Entrar.tsx`) e os `ops/*` | jscpd 5.4.1, `--min-tokens 70` |
| Ciclos | 3, todos na API: `operador.repository ↔ prazos-da-sessao`, `login.service ↔ conclusao-de-login`, `login.service ↔ convite.service` | dependency-cruiser e madge, iguais |
| Direção entre pacotes | 0 violação: `packages/` não importa `apps/`, e a web não importa backend nem `nucleo` | dependency-cruiser |
| Código morto (com `medicao/knip.json`) | 0 arquivo; 162 exports e 26 tipos sem uso (api 68, web 52, nucleo 13, worker 11); `pino` declarado e não usado em worker e despachante; `pg` usado sem declaração em 24 arquivos de `infra/`, `e2e/` e `tools/` | knip 6.42.1 |
| Complexidade (produção) | 138 funções acima de 10 de complexidade ciclomática e 55 acima de 80 linhas. As maiores são componentes de tela: `Estrutura` 51, `aluno/Tutor` 47, `CartaoDeFerramenta` 46, `Aprovar` 43 | ESLint do projeto |
| Esteira | Última verde da `develop` (`f1cb6ee`): **39,5 min** de relógio (o job `infra` é o mais longo), **260 min** de runner somados. e2e em 7 fatias de 18,6 a 34,4 min | `gh run view 39344097590` |

## 4. Unidades de trabalho

O tamanho de cada unidade é dado em linhas de produção e de teste. O risco é o de mexer na unidade. O papel indica quem
cuida dela em cada momento: na análise, o Arquiteto com subagentes; na execução, uma linha (Implementador e Mesa); na
revisão, os guardiões com veto que a Mesa chama.

| U | Unidade | Produção / teste | Risco | Depende de | Dependem dela | Guardiões na execução |
|---|---|---|---|---|---|---|
| U01 | `packages/shared`: contratos zod, matriz de permissão, catálogos, mensagens | 7,6 mil / 1,6 mil | **alto**: 600 arquivos dependem dele, e tudo é `.strict()` | zod | todas | tenancy, privacy, revisor-geral |
| U02 | `packages/nucleo` sem a IA: contexto, guardas, erro, fila (outbox), auditoria, titular, retenção, schema (54 tabelas), 37 migrations | 13,2 mil / 6,4 mil | **alto**: segurança e tenant passam aqui; os testes dos repositories ficam em outros apps | U01 | U03 a U06, U09, U10 | tenancy, privacy, infra |
| U03 | Camada de IA: `nucleo/src/ia` + `api/src/{ia,tutor,assistente,artefato}` | ~7 mil / 7,3 mil | **alto** em provedor, agendador e regras em regex; médio nos serviços | U01, U02, U05 (material, entrega) | U05 (governança), U08 | llm-integrator, conformidade, privacy, infra |
| U04 | API, esqueleto + `sessao` + `estrutura` + `professores` + `sistema` | 9,2 mil / 3,3 mil + ~15 mil em `test/` | **alto** em `sessao/` (login, cookies, travas); médio em `estrutura/` | U01, U02 | todos os módulos da API (`estrutura/entrada.ts`, `sessao/`) | tenancy, privacy, infra |
| U05 | API, domínio e operação: `atividade`, `entrega`, `material`, `governanca`, `privacidade`, `sala`, `operacao`, `ops` | 11,7 mil / 5,5 mil + ~18 mil em `test/` | **alto** em correção, entrega, privacidade e operação (gatilhos e transações) | U01 a U04 | U03, U06, U08, `infra/compose` (`migrar`) | conformidade, tenancy, privacy, infra |
| U06 | `apps/worker`, `apps/despachante`, `apps/realtime` | 3,9 mil / 11,4 mil | **alto** em executor, vagas e reconciliação; baixo no realtime | U01, U02 | U05 (produtor), U10 | infra, privacy, tenancy |
| U07 | Web, base: `api/`, `componentes/`, `paginas/`, sessão, rotas, build | ~14 mil / 10,9 mil | **médio-alto**: `api/sessao.ts` e `cliente.ts` estão no caminho de todo pedido | U01, a API por HTTP | U08, e2e | frontend, privacy |
| U08 | Web, telas: `areas/` (coordenação, professor, aluno) + `operacao/` | 20,8 mil / 20,8 mil | **médio**; alto em `aluno/fila-de-respostas.ts` | U07, U01 | e2e | frontend, conformidade (aluno) |
| U09 | Infraestrutura de teste: e2e (594 casos), fixtures, helpers da API, `tools/testes`, configs | ~35 mil de e2e e fixtures + helpers | **alto** em `e2e/__fixtures__/sessao.ts` (SQL cru) e na `BancadaDeSessoes`; médio nos specs | U02 (schema), U05 (`ops`), U10 | o portão de toda tarefa | test-engineer, revisor-geral |
| U10 | Infra, esteira e travas: compose, Dockerfiles, Caddy, Grafana, k6, `ci.yml`, `tools/ci`, `tools/guardas`, ESLint, tsconfig | ~20 mil (metade é teste) | **médio**: os testes leem o texto do compose e do YAML | Docker, U05 (`ops`), migrations | todas | infra, revisor-geral |
| U11 | Harness: CLAUDE.md, `.claude/`, `tools/processo`, `tools/vitrine` | ~50 mil palavras + 3,1 mil / 3,2 mil | **alto** no hook (barra ou libera o commit de todo agente); médio nas skills | U10, `ci.yml` | todas | revisor-geral (Etapa 9 ⛔) |
| U12 | Documentação técnica: README, ROADMAP, TODO, `docs/` técnicos | 8,3 mil linhas | **médio-alto** onde teste lê doc (`modelo-de-dados`, `interface` 9.1/9.10, `runbook`); baixo no resto | todas | processo (`estado.ts` lê ROADMAP e CLAUDE.md) | revisor-geral |

**Fora de escopo** (RESPOSTAS): `mockups/`; o conteúdo de produto, regulação e negócio em `docs/`; o histórico de `tasks/`
das specs fechadas; o conteúdo das skills de terceiros, que só é auditado na 9.1.

**Ordem de dependência para as ondas** (a proposta de ondas é da Etapa 4 e a decisão da Etapa 6): U01 → U02 → (U03,
U04) → U05 → U06 → (U07 → U08) → U09 e U10 juntas com cada onda → U11 (Etapa 9) → U12 (Etapa 11). O dependency-cruiser
confirma a direção `shared ← nucleo ← apps` e nenhuma volta.

## 5. Riscos conhecidos

Estão em `RISCOS.md`, com probabilidade, impacto e evidência. Os cinco que mais pesam no plano:

1. **IA e extração de PDF rodam em memória no processo da API**, sem fila, sem prioridade e sem degradação. Um
   reinício perde trabalho, e o limite por escola vale por processo (U03, U05; dívida D77 declarada só em
   `docs/mvp-rapido.md`).
2. **O isolamento entre escolas no código é por disciplina**: são 214 chamadas a `exigirEscolaDoContexto()` e nenhuma
   trava genérica de "todo repository escopa". O que é estrutural está no banco (FKs compostas `(escola_id, id)`) e nos
   testes de arquitetura feitos módulo a módulo (U02, U10).
3. **O contrato do payload de job é implícito**: `Record<string, unknown>`, sem registro tipado de `tipo` → processador
   (U01, U02, U06).
4. **A documentação de arquitetura descreve um sistema que não existe** (U12): 6 módulos, 6 filas, o worker com
   agentes, o OllamaAdapter. Quem a lê para mudar o código erra.
5. **A esteira e o e2e crescem linearmente**: 1.190 execuções, 7 fatias acrescentadas à mão e uma fila `flock` na
   máquina (U09, U10). Mudança grande de estrutura multiplica esse custo.

# Reengenharia — log de decisões

Decisões tomadas durante a missão, com o motivo. As da Etapa 0 e da forma de rodar estão em `RESPOSTAS.md`; aqui
entram as que vieram depois. Quem decide o que cruza unidades é o Arquiteto (RESPOSTAS, "Como a missão roda aqui"). O
que é do Joaquim (os ⛔, o irreversível, o desenho e o critério de aceite) fica marcado **[parada]** e não se decide
aqui.

Marcas: **[código]** conferido no repositório · **[doc]** dito na documentação · **[hipótese]** a conferir.

## Etapas 1 a 3 (Arquiteto, 20/10/2026)

| # | Decisão | Motivo | Reversível? |
|---|---|---|---|
| R1 | A análise foi dividida em **12 unidades e uma pesquisa web**, cada uma com um subagente (Sonnet) em paralelo e um roteiro comum (`unidades/00-roteiro.md`). O Arquiteto (Opus) consolidou | É o que a missão pede ("unidades, subagentes por unidade em paralelo, consolidação"). O custo de tokens é a preocupação conhecida (RESPOSTAS): o Sonnet lê, e o Opus só consolida e decide | sim |
| R2 | Os 13 relatórios brutos ficam versionados em `.reengenharia/unidades/`. O material consolidado (MAPA, CONTRATOS, RISCOS, SUSPEITOS-MORTOS) cita a unidade de onde veio cada achado | A Etapa 5 (diagnóstico) e as linhas da execução precisam da evidência com `arquivo:linha`, e cada linha é um checkout. Tudo é apagado na Etapa 11 | sim |
| R3 | `mockups/` fica **fora** da medição e da análise (`ignore` no knip e no dependency-cruiser) | RESPOSTAS, suposição "Fora de escopo". O knip sem configuração atribuía a `mockups/` 417 dos 441 "arquivos sem uso" [código: `unidades/R-pesquisa.md`] | sim |
| R4 | As ferramentas de medição são **knip 6.42.1, jscpd 5.4.1, dependency-cruiser 18.7.0 e as regras `complexity`/`max-lines-per-function`/`max-depth` do ESLint do projeto**. Todas rodam por `npx` ou instaladas numa pasta de rascunho, fora do `package.json` | RESPOSTAS ("medição por npx, sem entrar no package.json"). Todas são MIT ou ISC, estáticas, com saída JSON para comparar antes e depois [doc: `unidades/R-pesquisa.md` §1] | sim |
| R5 | **madge rejeitado** como ferramenta da missão. Serviu só para confirmar os ciclos, e o dependency-cruiser achou os mesmos 3 | O madge está parado e não declara TS 6 [doc: R-pesquisa §1]. O dependency-cruiser cobre ciclos, regras de camada e baseline [código: medição de 20/10] | sim |
| R6 | ts-prune, depcheck e unimported são **rejeitados** | Arquivados, e os próprios autores recomendam o knip [doc: R-pesquisa §1] | sim |
| R7 | O dependency-cruiser roda **instalado numa pasta de rascunho** (`npm i --prefix <scratch>/dc dependency-cruiser@18.7.0 typescript@6.0.3`), não por `npx` puro | Pelo `npx` ele não acha o `typescript`, ignora todo `.ts` e responde "0 módulos" sem erro. Isso foi provado em 20/10: 0 módulos por npx, 1.304 com a instalação ao lado [código] | sim |
| R8 | A configuração de medição do knip (`medicao/knip.json`) declara as entradas que o knip não descobre sozinho: `main.ts` de cada app, `apps/api/src/ops/*.ts` (scripts `ops:*`), `tools/**`, `infra/scripts`, `infra/k6`, e2e. Os fixtures das guardas ficam fora | O plugin Nest do knip não entende DI nem `node dist/ops/x.js` [doc: R-pesquisa §1]. Sem isso, os scripts chamados por `node` apareciam como mortos [código: medição de 20/10] | sim |
| R9 | **A cobertura entra na linha de base** com `@vitest/coverage-v8@5.0.0` instalado com `npm i --no-save` no checkout do Implementador, numa execução separada do portão | A missão pede cobertura "se puder medir". A versão casa com o Vitest 5.0.0 (peer exato) [código: `npm view`]. O `--no-save` não toca `package.json` nem o lock, então não é dependência nova. Na esteira não entra | sim |
| R10 | A complexidade é medida com os limiares **10** (ciclomática por função), **80** (linhas por função, sem branco e sem comentário) e **4** (aninhamento). São limiares de medição, não de trava | Os padrões do ESLint (20 de complexidade, 50 linhas) não separam o que importa neste código. A trava e o limiar dela são decisão da Etapa 6 **[parada]** | sim |
| R11 | O `tasks/prd-reengenharia/estado.md` continua sendo do Orquestrador. O Arquiteto não o edita e informa o que mudou pelo RELATÓRIO | RESPOSTAS ("estado num lugar só") e `/seguir` passo 4: os documentos de estado são do Orquestrador | — |
| R12 | Os dois pares de arquivos iguais `.processo/reengenharia/{MISSAO,RESPOSTAS}.md` (fora do git) e `.reengenharia/{MISSAO,RESPOSTAS}.md` ficam como estão. Vale o de `.reengenharia/` | Conferido com `diff`: são idênticos. O de `.processo/` é cópia de trabalho do térreo, ignorada pelo git | — |
| R13 | A linha de base de tempo da esteira é a **execução verde 39344097590 da `develop`** (`f1cb6ee`). Entre `f1cb6ee` e a base da spec (`a9d34cd`) só mudaram documentos e `.claude/` | Evita rodar a esteira de novo só para medir. `git diff --stat f1cb6ee a9d34cd`: 8 arquivos, nenhum de `apps/`, `packages/`, `infra/` ou `e2e/` [código] | sim |
| R14 | Não existe `.reengenharia/ESTADO.md`: o estado da missão é `tasks/prd-reengenharia/estado.md` | RESPOSTAS ("Estado num lugar só") | — |
| R15 | As saídas brutas da linha de base (logs, JSON do knip, jscpd, depcruise, ESLint, cobertura) ficam em `.processo/reengenharia/linha-de-base/`, fora do git; só o resumo entra em `LINHA-DE-BASE.md` §5 | `.processo/` já é ignorado (`.gitignore:26`). JSON bruto é grande e vira ruído no diff; o resumo é o que se compara na Etapa 12 | sim |
| R16 | Vermelho na linha de base é registrado e **não é corrigido** nem repetido para ver se passa | A missão manda classificar toda falha como preexistente ou introduzida a partir da Etapa 4. Corrigir antes de medir apaga a evidência | — |

## Etapa 4 ⛔ (aprovada pelo Joaquim em 20/10/2026)

Resposta: "faça o melhor que eu aprovo sua escolha", no terminal do Orquestrador, sobre as três recomendações de
`LINHA-DE-BASE.md` §6 (registro em `tasks/prd-reengenharia/estado.md`, "Esperando o Joaquim").

| # | Decisão | Motivo | Reversível? |
|---|---|---|---|
| R17 | A priorização e as seis ondas de `LINHA-DE-BASE.md` §6 valem como plano de partida da Etapa 6, com a web em 3.º e os testes em 4.º | Os números da §5: 64 % das funções complexas e 93 % das longas estão na web, que tem a menor cobertura; 87 % da duplicação é de teste | sim, na Etapa 6 |
| R18 | **P4: a pilha de sessão do operador não é unificada** com a da escola. Só as ~60 linhas literais entre `apps/web/src/operacao/paginas/{Mfa,Entrar}.tsx` e `apps/web/src/paginas/` são extraídas | O jscpd mostra que o resto é desenho paralelo, não cópia: unificar ganha conceito e põe em risco o isolamento do operador (RF6 da A0) | sim, mas fora da X5 |
| R19 | A onda 4 (web) só fecha com **ramos ≥ 85 %** em `apps/web` e **nenhuma função de tela acima de 80 linhas**, medidos como em `LINHA-DE-BASE.md` §2 e §3. Entra como critério de aceite no PRD da X5 | É a faixa dos outros apps (api 89,0 %, worker 87,0 %, nucleo 91,1 %); 80 linhas é o limiar de medição da R10 | não sem nova parada |

## Achados que viram pergunta para a Etapa 6 (não decididos aqui)

Ficam registrados para o PRD e a Tech Spec da X5. Cada um muda o desenho, um contrato ou uma decisão D, então é
**[parada]** do Joaquim. Nenhum é decidido nas Etapas 1 a 4.

| # | Pergunta | Por que é parada |
|---|---|---|
| P1 | Levar a IA e a extração de PDF do processo da API para a fila (o worker), pagando a dívida D77 | Muda o desenho de execução (regra 00.4, 80.2, D49) e a experiência (latência do Tutor) |
| P2 | Validar a entrada HTTP por um mecanismo único (pipe ou decorator) em vez dos 137 handlers que fazem isso à mão | Muda o padrão de todos os controllers (contrato da borda) |
| P3 | Gerar OpenAPI a partir dos schemas zod de `packages/shared` e travar o contrato das rotas por teste | Contrato novo, versionado |
| P4 | ~~Unificar a pilha de sessão do operador com a da escola (API e web, cerca de 2,5 mil linhas paralelas)~~ **Decidida pelo Joaquim em 20/10/2026 (Etapa 4 ⛔): não unificar** nesta reengenharia; só extrair as ~60 linhas literais (R18) | O isolamento do operador (RF6 da A0) é decisão de segurança |
| P5 | RLS como segunda camada de tenant | Toca o modelo de multi-tenancy: é irreversível pela RESPOSTAS. O que se propõe é camada extra, sem trocar o modelo |
| P6 | Resposta da API `.strict()` contra a web aberta (deploy escalonado) | Muda a política de compatibilidade do contrato (regra 80.9) |
| P7 | O que fazer com o realtime sem eventos e o `pgvector` sem uso | Depende do roadmap (F10, ingestão vetorial) |
| P8 | Onde ficam as regras de conformidade hoje escritas em regex (D55, D36, recusa do Tutor) | Toca a regra 70 e precisa do `conformidade-reviewer` |
| P9 | CLAUDE.md abaixo de 200 linhas, regras com `paths:` e guardrail em hook (Etapa 9) | A Etapa 9 é ⛔ por definição |
| P10 | O nome de `ops/` × `operacao/`, a quebra de `sessao/` em subpastas e a convenção de pastas dos testes (o plano de 26/09) | É reorganização dentro da liberdade dada (RESPOSTAS 2), mas a convenção de pastas é desenho e precisa da aprovação da Etapa 6 |

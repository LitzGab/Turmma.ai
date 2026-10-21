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

## Etapa 5 (Arquiteto, 21/10/2026)

O consolidado está em `DIAGNOSTICO.md`, e os 13 relatórios por unidade em `diagnostico/`.

| # | Decisão | Motivo | Reversível? |
|---|---|---|---|
| R20 | O diagnóstico rodou em **13 subagentes** (Sonnet), com a U08 partida em `U08a` (coordenação e operação) e `U08b` (professor e aluno), um roteiro comum (`diagnostico/00-roteiro.md`) e o recorte da medição da linha de base por unidade. Os relatórios brutos ficam versionados em `.reengenharia/diagnostico/` e saem na Etapa 11 | Mesmo método da R1 e da R2. A U08 tem 20,8 mil linhas de tela e é a unidade da meta R19 | sim |
| R21 | Os temas **T1 a T18** de `DIAGNOSTICO.md` §3 são o ponto de partida da arquitetura-alvo, cada um com o mecanismo escolhido e o que foi **rejeitado**. Os rejeitados ficam registrados ali como decisão de padrão (Etapa 6.3) | Junta 202 achados em mecanismos que cruzam unidades, como a missão pede | sim, na Etapa 6 |
| R22 | A pergunta "um provedor brasileiro para tudo ou dois" (U03-5) **não** é da X5: fica na D37, que já está em aberto. A X5 aplica a D62 em código (roteamento por classe de dado e conferência na subida), e só a conferência bloqueante vai à Etapa 6 (N10) | A D62 está decidida; o provedor, não. Escolher provedor é trocar peça, fora da liberdade dada (RESPOSTAS 2) | — |
| R23 | A tarefa `relatorio_da_correcao` **fica** até o PRD do F6 (U03-18) | Apagar mexe em `check` de duas tabelas e é o lado irreversível. Manter não custa nada em produção | sim |
| R24 | A auditoria da decisão sobre entrega (U05-3) se trava na X5 por **teste de lista fechada** dos pontos que mudam `entrega.estado`. O gatilho no banco fica fora | Gatilho em tabela da regra 70 é migration própria (RISCOS M1). O teste fecha o esquecimento sem tocar o banco | sim |
| R25 | "Abrir a atividade sem responder conta como aberta" (U05-15) **se preserva** como está | É regra de produto que o código já pratica; mudar é mudança funcional sem defeito | — |
| R26 | A telemetria de falha do navegador (U07-8) **não entra** na X5. Entram só a fronteira de erro de render na raiz e a porta `reportarFalha`, sem envio | O envio é canal novo de dado a partir de tela de menor (regra 20). A porta deixa o envio para quando a decisão vier | sim |
| R27 | O corte do teto de IA fora do Tutor (U03-6) e o Analista sem modelo (U03-12) ficam **fora da X5**. A X5 só preenche `custo_micros` | O primeiro é a decisão em aberto "teto de IA do pacote" (D14, D39). O segundo mexe na D32. Medir custo é requisito da D14 | — |
| R28 | A imagem de produção da web (U10-9), a janela de deploy × expurgos (U06), backup e rollback (U10-17) e a rodada do despachante em lote (U06-8) ficam **registradas**, fora da X5 | Dependem do staging (D42), da produção (D31) ou de volume que não existe (D25) | — |
| R29 | A separação do domínio de privacidade do `nucleo` (U02-8) e o subcaminho `@educa/shared/servidor` (U01-7) **não** viram pergunta à parte: entram na P10 como subcaminhos de `exports`, sem pacote novo | É convenção de pastas e de importação, que é a P10; pacote novo multiplica a trilha `source`/`dist` (U01-10) | sim |
| R30 | As perguntas do harness (U11: git hook nativo, guardião por caminho, revisão das guardas, mutação obrigatória, caminho `(mvp:)`, histórico de `achados/`) e a da esteira em `pull_request` (U10-13) ficam para a **Etapa 9 ⛔**. Só a saída com código 2 do hook na falha de carga vai à Etapa 6 (N7) | RESPOSTAS: o processo não muda antes da Etapa 9. A falha aberta (U11-2) é a exceção que protege, e o conserto é uma linha | — |
| R31 | As 27 perguntas novas das unidades foram reduzidas a **11** (N1 a N11, `DIAGNOSTICO.md` §5), juntando as do mesmo assunto. As que viraram decisão do Arquiteto ou registro são a R22 a R30 | A parada precisa caber numa leitura | — |

**Recomendações para as P1–P10** (detalhe em `DIAGNOSTICO.md` §5): P1 aprovar, com a IA no worker como segunda entrada
da imagem da API · P2 aprovar o pipe por parâmetro · P3 aprovar o registro de rotas, com o OpenAPI derivado · P4
decidida (R18) · P5 adiar para fora da X5 · P6 aprovar o leitor tolerante na web · P7 congelar o realtime por profile ·
P8 aprovar o módulo de políticas com corpus `ouro` · P9 na Etapa 9 · P10 aprovar a convenção, com os nomes dele.

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

## Etapa 6 ⛔ — as perguntas, respondidas pelo Joaquim em 21/10/2026

No terminal do Arquiteto, antes do PRD da X5. As quatro respostas foram "aprovo como recomendado".

| # | Decisão | Motivo | Reversível? |
|---|---|---|---|
| R32 | **P1, P2, P3, P5, P6, P7, P8 e P10 aprovadas como recomendado** em `DIAGNOSTICO.md` §5: a IA e o PDF na fila, com o worker de IA como segunda entrada da imagem da API (P1); a validação da entrada no parâmetro, com conferência no boot (P2); o registro de rotas em `shared`, com o OpenAPI derivado (P3); a RLS fora da X5 (P5); o leitor tolerante na web, com a API estrita (P6); o realtime congelado atrás de um profile, e o pgvector como está (P7); o módulo de políticas, com corpus `ouro` de outro papel (P8); e os nomes da P10: `credencial/` e `sessao/` na API, `ops/` como adaptador fino de `operacao/`, subcaminhos de `exports` em `shared` e `nucleo`, `tools/testes/` e `componentes/` partido em kit e peças de domínio | Resposta do Joaquim | sim, até a onda executar |
| R33 | **N1 a N11 aprovadas como recomendado** (`DIAGNOSTICO.md` §5) | Resposta do Joaquim | sim, até a onda executar |
| R34 | A Tech Spec é **um `techspec.md` comum de até 2.000 palavras e um `onda-<n>.md` por onda, com até 1.500 cada**. A tarefa lê o comum e só a sua onda | O teto existe porque cada tarefa lê o documento inteiro, e o desenho de 18 mecanismos não cabe em 2.000 palavras. Partido por onda, o que cada tarefa lê continua dentro do teto | sim |
| R35 | Os itens do §4 do diagnóstico (D36, D55, S12 e a saída com 2 do hook, N7) são as **primeiras tarefas da X5**, antes da onda 1, com os revisores e o Validador | Ficam no plano, com a Mesa e com a validação RF a RF, em vez de correções avulsas | sim |
| R36 | As tarefas do harness (Etapa 9) só são geradas **depois da parada da Etapa 9 ⛔**, com as propostas arquivo por arquivo. A onda 6 já nasce com a documentação derivada (T18) e a documentação oficial (Etapa 11) | A Etapa 9 é ⛔ por definição (RESPOSTAS), e o processo não muda antes dela (salvo a N7) | — |
| R37 | Os limiares da trava de tamanho e complexidade (T8) são os da medição: **complexidade 10, 80 linhas por função, aninhamento 4**, com catraca | São os da R10 e os da meta R19. Vão ao Joaquim dentro do PRD, e a aprovação do PRD os fixa | sim, na aprovação do PRD |

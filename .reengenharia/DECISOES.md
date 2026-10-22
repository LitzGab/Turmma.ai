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

## Etapa 6 — Tech Spec (Arquiteto e Joaquim, 21/10/2026)

O desenho de cada onda saiu de sete subagentes (Plan; Sonnet, e Opus na onda 3), com um roteiro comum, e foi consolidado
pelo Arquiteto em `tasks/prd-reengenharia/techspec.md` e `onda-*.md` (R34).

| # | Decisão | Motivo | Reversível? |
|---|---|---|---|
| R38 | (Alvo revisto pela R42; o que vale está em `tasks/prd-reengenharia/onda-0.md` §2.1 e em `docs/aia/ouro/MEDIDAS.json`.) O corpus `ouro` é escrito pelo **Arquiteto com o `conformidade-reviewer`**, em `docs/aia/ouro/`, com `MEDIDAS.json` e `SELO.json`, antes da 1.0. Alvo de `riscoAVida`: recall ≥ 0,90 e precisão ≥ 0,90; as outras não caem abaixo da `base`. A avaliação aberta se reconfere também no `aoConcluir` | O `ouro` precisa de autor que não muda o padrão (P8); o Arquiteto não implementa. 60 positivas sem perda dão recall ≥ 95 % com 95 % de confiança. A reconferência no fim cobre a janela do modelo, que é parte do RF3 | sim |
| R39 | Decisões de desenho das ondas: `ia/execucao.repository` fica na lista de exceções de escopo até a onda 3; o depcruise roda dentro do `npm run lint`; `max-lines-per-function` não vale em teste e o e2e tem `max-lines: 800`; `RESPOSTA_FORA_DO_CONTRATO` entra no catálogo; o job ganha `executor: 'worker' \| 'api'`; "interrompida" é `falhou` com `EXECUCAO_INTERROMPIDA` (sem migration); o teto de 2 execuções de IA por escola fica; o kit da web vai para `apps/web/src/kit/` e as peças de domínio ficam em `componentes/`; o `nucleo` ganha o subcaminho `/ia`; `GET /v1/turmas` ganha `semProfessor`; o prazo do cliente (RF25) sobe para a onda 3, porque a prova precisa dele; a 5.8 do rascunho (helpers em `tools/testes/`) é a 31.0 da onda 2 | Cada uma está na `onda-*.md` onde entra, com o porquê | sim |
| R40 | Respostas do Joaquim às perguntas da Tech Spec: **knip** entra como `devDependency` (terceira dependência nova, trava do RF13); o **executor de jobs** vai para `@educa/nucleo/execucao-de-jobs`, com `bullmq` só nesse subcaminho; o limite da **N2** é p95 de `sessao.leitura.duracao` ≤ 50 ms e espera do pool ≤ 100 ms no cenário `rajada`; **ADR é mecanismo, D é produto, regulação e processo**; **sem leitura humana** do `ouro` na X5 (fica no `TODO.md`, antes do piloto); a **saída do Tutor sob a D55** fica fora da X5 (`TODO.md`) | Terminal do Arquiteto, as quatro como recomendado | sim |
| R41 | A X5 passa de 20 tarefas: são 91 nas ondas 0 a 5, mais as da Etapa 9 e da onda 6. O `tasks.md` lista todas; os `N_task.md` nascem **por onda**, escritos pelo Arquiteto quando a onda anterior fecha, contra o código como ele está (a onda 2 move pastas, e os caminhos de uma tarefa escrita antes ficariam errados). A 92.0 marca a parada da Etapa 9: dela nascem as tarefas do harness e da onda 6. A ordem fica ondas 0–5 → Etapa 9 ⛔ → onda 6 (documentação) → Validador → apagar `.reengenharia/` (parada) → pouso | A regra de até 20 tarefas existe para que o erro da Tech Spec não contamine muita coisa; partir a spec contraria a RESPOSTAS 3 e a resposta da Etapa 6. Escrever a tarefa perto da execução limita o mesmo risco | sim |
| R42 | Da revisão da spec (rodadas 1 a 3, em `tasks/prd-reengenharia/revisao-spec.md`): a onda 3 é partida em `onda-3a.md` (42.0, 47.0), `onda-3b.md` (43.0 a 46.0) e `onda-3c.md` (48.0 a 54.0), e a 4 em `onda-4a.md` (leva 1) e `onda-4b.md` (leva 2), sem mudar número de tarefa; o limite de IA por escola deixa de ser o contador em memória de cada processo (`IA_EXECUCOES_POR_ESCOLA` sai) e passa a ser a vaga do despachante, compartilhada entre réplicas, uma por fila e escola: o Tutor na `interativa`, com `VAGAS_ESCOLA_INTERATIVA` de 5 para 10 (0,75 turno/s por escola × 6 s = 4,5 simultâneos, × 2 de folga), e as ferramentas do professor numa fila nova, `ferramenta`, com 4 e pool próprio por réplica, para que o professor nunca ocupe a vaga do Tutor (a subvaga de 30 % da rodada 2 saiu na rodada 3, porque não fechava a conta), revendo a R39; o `prazoMs` do job de IA é 150 s e o processador corta pelo perfil, abaixo dele; o alvo do `ouro` passa a `erraPara: 'mais'` com perda máxima por categoria (zero na `explicita`), revendo a R38; a ameaça a terceiro é medida no `ouro` e fica fora do alvo, com a decisão no `TODO.md` | O teto de 2 por processo dobrava com duas réplicas (regra 80.5) e não fechava a conta das 10h de `docs/infra.md` §3.2; o PRD pede o RF1 "sem cair" e a D36 não aceita perder frase explícita; a resposta à ameaça a outra pessoa é decisão de produto, não da X5 | sim |

## O recorte (Arquiteto, 22/10/2026, com a autonomia do RECORTE §6)

O Joaquim pediu o recorte em 22/10/2026 (`RECORTE.md`, copiado aqui; vale por cima de `MISSAO.md`, `RESPOSTAS.md` e da
lista de tarefas) e a D81. Até o pouso, as paradas são do Arquiteto, decididas com a recomendação e registradas aqui.

| # | Decisão | Motivo | Reversível? |
|---|---|---|---|
| R43 | **O `tasks.md` fica com as 32 tarefas do recorte, na ordem de prioridade dele, e as que saíram vão para "Saíram para a X6" sem caixa de seleção.** A tabela de dependências só cita tarefas da X5: a 18.0 deixa de esperar a 14.0 (não usa nada dela); a 43.0 espera a 19.0 (o `prazoMs` vem da definição do job); a 33.0 não espera a 32.0 e a 53.0 não espera a 52.0, que foram para a X6; as pastas esperam as tarefas de lógica que tocam nelas; a 12.0 e a 13.0 esperam as pastas, porque gravam caminho (as regras do depcruise e o `eslint-suppressions.json`) | O `estado.ts` e o `linhas.ts` leem `- [ ] **N.0 — …**`: tarefa da X6 com caixa seria escolhida, e dependência de tarefa que não vai existir travaria a lista para sempre. "Pastas depois da lógica" é do RECORTE §3, item 7 | sim |
| R44 | **O paralelo é "3.0 a 97.0" em toda linha da tabela.** Quem segura é o `linhas.ts`: não junta tarefas com arquivo previsto em comum, nem duas com migration, schema ou `packages/shared` | O Joaquim quer as três linhas ocupadas (pedido de 22/10); o RECORTE §3 manda as linhas pegarem a próxima que não toca arquivo de outra em andamento, que é exatamente a conferência do `linhas.ts` | sim |
| R45 | **O desenho da entrada pela D81** (`onda-1a.md` T1, reescrita): `ZodValidationPipe` com a opção `errorCode` para o caminho que não é uuid, e `IdPipe` com `invalidAsUndefined` para o `redefinir-mfa`, em `packages/nucleo/src/entrada/`. A trava é um bloco de `no-restricted-syntax` cujo `files` cresce por tarefa (14.0 a 16.0) e vira todo controller na 17.0; um segundo bloco devolve o `@Req()` a `sessao/` e `operacao/`, que leem cookie e IP pela requisição; `no-restricted-syntax` entra em `REGRAS_DAS_GUARDAS` | O `files` do ESLint é configuração nativa, e não a lista de pendentes que a D81 tirou. O `@Req()` de `sessao/` e `operacao/` lê só `headers` e o IP (`ipDaRequisicao`, que precisa dos proxies injetados); trocá-lo por decorator próprio seria mecanismo novo sem regra a proteger | sim |
| R46 | **A ordem dos erros é a do Nest** (guarda, depois pipe; os pipes dos parâmetros na ordem que ele der). Onde a credencial é lida no handler (`mfa.controller.ts:37` e `:62`), o corpo inválido sem token passa a dar 400 antes do 401, sem gastar tentativa; a 16.0 declara. A regra 10.6 se prova pela igualdade: o id de B e o inexistente respondem igual com o mesmo corpo | A ordem entre corpo e caminho não revela existência de registro: o corpo inválido dá 400 para qualquer id. Forçar a ordem antiga pediria mecanismo próprio em volta do pipe do Nest, contra a D81 | sim |
| R47 | **O kit visual da web vai para `componentes/ui/`**, e não `apps/web/src/kit/` (revê a R39) | RECORTE §3, item 7: é o nome que o dev de React conhece | sim |
| R48 | **O PRD ganha o §11, "O recorte"**, com cada RF na X5, na X6 ou revisto (RF5, RF14, RF31), e o Validador valida pela coluna "Na X5". A Tech Spec ganha a nota no topo | Sem isso o Validador reprovaria a X5 pelos RFs que foram para a X6 | sim |
| R49 | (Revista pela R52.) A 95.0 era do Arquiteto | RECORTE §4 | — |
| R50 | O `onda-1a.md` passa do teto de 1.500 palavras da R34 (1.717), com a T1 reescrita, e fica assim | A T1 nova substitui a antiga inteira, e só a 14.0 a 17.0 leem a onda; cortar o desenho para caber empurraria o detalhe para os quatro documentos de tarefa, que já estão no teto | sim |
| R51 | **Ajustes do Claude Code #2** (`.processo/ordens/recorte-ajustes-cc2.md`, 22/10, 11h02 e 11h05, valem como palavra do Joaquim): a onda 0 não vai para a X6 e conta o relógio de 10h55, com a lacuna medida declarada no `onda-0.md` e na AIA do Tutor se passar; os documentos de tarefa do recorte saem numa passada só, antes de qualquer diagnóstico que não segure uma linha; nas mecânicas (10.0, 11.0, 24.0, 33.0 a 36.0, 90.0, 96.0, 97.0), o `test-engineer`, o `revisor-geral` e no máximo um guardião, e o movimento por script (`git mv` e ts-morph por `npx`), uma pasta por commit | Palavra do Joaquim pelo Claude Code #2 | sim |
| R52 | **A 95.0 é do Claude Code #2**: ele entrega o guia e a correção da arquitetura em `.processo/reengenharia/guia/`; o Arquiteto revisa com o `revisor-geral`, faz o `README.md` apontar para o guia e põe no commit | R51 | sim |
| R53 | **Uma linha para a web pela ordem da lista, não por marca no quadro.** A 51.0, 53.0, 36.0 e 97.0 vão para logo depois da onda 0 e não se autorizam entre si; como já formam uma fila pelas dependências, há no máximo uma de web por vez, e uma linha ociosa a pega primeiro | O `linhas.ts` só sabe autorização por par e arquivo; "no máximo duas de API" não se escreve por par. A fila serial da web com prioridade na lista dá o mesmo efeito sem mudar `tools/processo/`, que não muda no meio da corrida | sim |
| R54 | Os guardiões das mecânicas: 33.0 `infra-guardian` (login e senha), 34.0, 35.0 e 96.0 `tenancy-guardian` (o contexto de escola e os repositories movidos), 36.0 e 97.0 `frontend-reviewer`, 24.0 e 90.0 `infra-guardian`; 10.0 e 11.0 sem guardião | "O da área que o movimento toca" (R51) | sim |

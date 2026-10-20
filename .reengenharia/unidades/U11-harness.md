# U11 — O harness de desenvolvimento com IA

Tudo abaixo vem de leitura; nada foi executado nem alterado. Marcas: **[código]**, **[doc]**, **[hipótese]**. A rede do Maestri (canvas, ligações, rotinas) não está no git: só registro o que os arquivos dizem dela.

## 1. Finalidade e limites

O harness é o processo SDD (PRD, Tech Spec, revisão da spec, tarefas, execução, revisão por tarefa, validação, pouso, retrospectiva) escrito como instruções para agentes, mais as travas por máquina que impedem pular etapas. Fica fora dele o produto (`apps/`, `packages/`, `infra/`), a esteira em si (`.github/workflows/ci.yml`, `tools/ci/`, U-outra) e as guardas ESLint (`tools/guardas/`), que são consumidas pelo harness (portão) mas pertencem às regras de produto.

Tamanho medido (`wc`), em linhas / palavras:

| Parte | Arquivos | Linhas | Palavras |
|---|---|---|---|
| `CLAUDE.md` | 1 | 408 | 5.944 |
| `.claude/rules/` | 9 | 54 a 146 (maiores: 70 e 20 = 146, 40 = 122) | 7.604 |
| `.claude/agents/` | 14 | 23 a 185 (validador 185, arquiteto 133, frontend 105, revisor-geral 98) | ~9.900 |
| Skills nossas (14 + templates) | 20 arquivos | seguir 528, executar-task 412, revisar-tarefa 276, criar-tasks 156, corrigir 137, validar 137 | ~26.300 |
| `tools/processo/` | 16 | 3.101 de código + 3.211 de teste | |
| `tools/vitrine/` | 7 | 729 de código + 376 de teste | |
| `.claude/hooks/` + `settings.json` | 2 | 49 + 38 | |

Só o `seguir/SKILL.md` tem 32,9 KB (5.378 palavras) e o `executar-task` 28,8 KB: são os dois maiores documentos de instrução do repositório depois do `CLAUDE.md` (35 KB).

## 2. Pontos de entrada

| Entrada | O que dispara | Fonte |
|---|---|---|
| `/seguir [func \| texto]` | único comando humano; `disable-model-invocation: true` | `seguir/SKILL.md:5` [código] |
| `/vigia` | rotina do Maestri a cada 30 min, só se `tools/processo/vigia.ts` imprimir algo | `vigia/SKILL.md:4`, `seguir/SKILL.md:419-434` [doc] |
| Rotina "Limpa o Orquestrador" (`/clear`, pausada, disparada por `nohup … maestri routine run`) | limpa o contexto do Orquestrador a cada tarefa | `seguir/SKILL.md:436-448` [doc] |
| Hook `SessionStart` | `contexto-inicial.sh` → `estado.ts --resumo`; após compactar/limpar, diz o que reler por papel | `settings.json:4-12`, `contexto-inicial.sh:19-49` [código] |
| Hook `SubagentStop` (matcher de 9 revisores) | `hook-revisoes.ts registrar`: grava rodada em "Revisões", bloco em `achados/<doc>.md`, linha em `achados/indice.md` | `settings.json:13-22`, `revisoes.ts:704` [código] |
| Hook `PreToolUse` (matcher `Bash`) | `hook-revisoes.ts portao`: nega `git commit` sem revisão/carimbo/marca e `git push` de papel do time em `develop/release/main` | `settings.json:24-34`, `revisoes.ts:1151` [código] |
| Skills internas (`user-invocable: false`): status, descobrir, registrar-decisao, criar-prd, criar-techspec, revisar-spec, criar-tasks, executar-task, revisar-tarefa, corrigir, validar, retro | procedimento que um papel segue por ordem do `/seguir` | frontmatter de cada SKILL.md [código] |
| CLI: `estado.ts`, `linhas.ts` (abrir/partida/encontro/fechar/conferir), `portao-local.ts` (--tarefa, --e2e --infra, conferir, revisores), `esteira.ts`, `separar-achados.ts`, `vitrine.ts` (montar/mostrar/codigo/foto) | chamados à mão pelos agentes; nenhum é script de `package.json` | `grep package.json` não acha nenhum [código] |

Não há outros hooks (nem `PostToolUse`, `Stop`, `UserPromptSubmit`). Os 4 papéis de terminal (arquiteto, implementador, mesa-de-revisao, validador) são iniciados com `claude --agent <papel>`; o Orquestrador é o terminal Maestro sem papel (`seguir/SKILL.md:81-86`, `revisoes.ts:1103` [código]).

## 3. Fluxos e invariantes

**Pedido à entrega** (`seguir/SKILL.md` passos 2 a 8) [doc, conferido contra `estado.ts`]:
1. Orquestrador calcula a fase com `estado.ts` (fase calculada dos arquivos: `calcularFase`, `estado.ts:189`; tabela de próximos passos em `estado.ts:222`).
2. Arquiteto, num único `PEDIDO`, encadeia `criar-prd` → `criar-techspec` → `revisar-spec` → `criar-tasks`; pára só em perguntas e aprovação do PRD; Tech Spec e lista de tarefas são "aviso com prazo de 30 min" (D79).
3. Construção em até 3 linhas (andar/branch `spec/<f>--l<n>`): quadro `linhas.ts` → `partida` → `PEDIDO` ao Implementador → `executar-task` (plano, teste isolado, `portao-local --tarefa` com mutações) → `PEDIDO` de rodada à Mesa → Mesa chama os revisores em paralelo (Agent), o hook registra → `ORDEM DE CORREÇÃO` ou "APROVADO por todos" → commit `(tarefa N.0)` + push → `/seguir RELATÓRIO` → `linhas.ts encontro` → `esteira.ts`.
4. Validador (sessão nova) escreve `validacao.md`; `esteira.ts --fechamento`; commit de fechamento; pouso só com a palavra do Joaquim; retrospectiva.

**Onde fica o estado** [doc/código]: git (`ROADMAP.md`, `tasks/prd-<f>/{prd,techspec,tasks,N_task,estado,validacao,revisao-spec}.md`, `achados/`), mais `.processo/` fora do git (`portao.json`, `conteudo.json`, `ordens/rodadas.md`, `linhas.json`, `vigia.json`, `vitrine/`; `.gitignore:26`). O diário do Orquestrador é `estado.md`, só as seções "Agora" e "Esperando o Joaquim" sobrevivem a cada `/clear` (`seguir/SKILL.md:58-65, 524-525`).

**Formatos de mensagem** (implícitos, em texto): tabela em `protocolo.md:50-59` (PEDIDO, PEDIDO de retomada/estado, RELATÓRIO, ORDEM DE CORREÇÃO, DEVOLUÇÃO, DIVERGÊNCIA, ESCALADA, BLOQUEIO). Mensagem ao Orquestrador começa com `/seguir `; o texto longo chega colado e não executa a skill (`protocolo.md:45-49`), por isso o hook de sessão manda reler `SKILL.md` e `protocolo.md` inteiros (`contexto-inicial.sh:35-37`).

**Regras que viram máquina** (o que o hook/guarda faz de fato):

| Regra | Como é garantida |
|---|---|
| Commit com código de `apps/ packages/ infra/ e2e/` precisa de `(tarefa N.0)` ou `(correção slug)` | hook `portao` [código `revisoes.ts:41, 1151-1214`] |
| Revisores obrigatórios com rodada válida e APROVADO (veto); caducidade por tipo de alteração | hook, com instantâneos de conteúdo [código `revisoes.ts:556, 628-673`] |
| Carimbo do portão local mais novo que a última alteração; mutações do documento conferidas | `portao-local.ts` + `mutacoes.ts` + hook [código `hook-revisoes.ts:33`] |
| Linha `Revisões:` na mensagem do commit | hook [código `revisoes.ts:669`] |
| Papel do time não empurra `develop/release/main` | hook (`pushDoTime`) [código `revisoes.ts:1138`] |
| `git commit` com comando extra antes é recusado (hook lê a árvore antes) | hook [código `revisoes.ts:1024`] |
| SDK de IA fora do adaptador, log com dado pessoal, `.skip`, espera de serviço | guardas ESLint [código `tools/guardas/index.mjs:13-20`] |
| Alerta sem runbook (regra 80.10) | `tools/guardas/alerta-tem-runbook.ts` [código, só lista] |
| Resolução de tenant, conta global e leitura entre escolas só em módulos fixos | `apps/api/test/arquitetura.test.ts` [código] |
| Segredo e dependência vulnerável | gitleaks e `npm audit` no portão e na esteira [doc `40-testes.md`] |

**Regras só por leitura** (nenhum hook ou teste que o mande cumprir): quem é o guardião de cada tarefa (a tabela é preenchida pelo Arquiteto; o hook só cobra o que está escrito na linha `Subagentes obrigatórios`, `revisoes.ts:354-359`), D55 (IA não toca discursiva), regras 70.4 a 70.9, escopo negativo, vocabulário do glossário, "tarefa de um comportamento e até 3 guardiões", teto de 800 palavras por tarefa e 12 tarefas por spec, as 6 paradas do Joaquim (o hook não impede o Orquestrador de pousar sem a palavra; quem barra é o Maestri para papéis, `revisoes.ts:1133-1136`).

## 4. Dependências

Internas: `hook-revisoes.ts` → `revisoes.ts` + `mutacoes.ts`; `portao-local.ts` → `revisoes.ts`, `mutacoes.ts`, `tools/ci/{duracao-do-e2e,e2e-que-cita-literal,fila-de-carga}.ts`; `estado.ts` ↔ `revisoes.ts`; `linhas.ts` → `estado.ts`; `esteira.ts` → `revisoes.ts`. `estado.ts:407` lê o `CLAUDE.md` por regex (`## Decisões em aberto`): o texto de instrução vira entrada de código. `tools/vitrine/escola.ts` importa fixtures de `e2e/__fixtures__/` e `tools/ci/compose.ts`, acoplando o harness ao código de teste do produto. Sem ciclos vistos.
Externas: `maestri` CLI (floor, recruit, ask, check, routine, status), `gh` (esteira), `git`, Node com type-stripping, `typescript` para ignorar comentários (`revisoes.ts:194`), Playwright (vitrine), `flock`. 12 skills de terceiros (`skills-lock.json`: accessibility, bullmq-specialist, drizzle-orm-patterns, frontend-design, lgpd-brasil, nestjs-best-practices, playwright-best-practices, supabase-postgres-best-practices, tailwind-design-system, tanstack-query-best-practices, vercel-react-best-practices, vitest): 289 arquivos, ~2,2 MB, Playwright sozinha 864 KB / 59 arquivos.
Conflitos com as de terceiros: nenhum conteúdo nosso as contradiz; o `CLAUDE.md` já declara os cinco conhecidos (RLS, Next.js, visual, LGPD, NestJS) [doc]. **Nenhum agente nem skill nossa manda carregar uma delas** (grep em agents e skills de processo não acha referência, salvo menção a `vitest run`): só o gatilho automático da descrição as ativa [hipótese; confirmar olhando transcripts].

## 5. Dados

Escreve: `tasks/prd-*/{N_task,revisao-spec}.md` (seção "Revisões" e `achados/`), `tasks/correcoes/`, `.processo/*`. Lê: `ROADMAP.md`, `TODO.md`, `CLAUDE.md`. O hook escreve com trava de arquivo (`comTrava`, `revisoes.ts:675`). Volume em git: `tasks/` = 14 MB; só `achados/` das 10 specs com pasta = ~5,3 MB (maior: lgpd-e-titular 1,1 MB, apresentacao-escola 844 KB). O próprio `executar-task` admite que o bloco passa de 600 KB por spec e "não cabe na janela" (`executar-task/SKILL.md` passo 2, última linha) [doc].

## 6. Contratos

Todos implícitos, em texto livre lido por regex: `**Subagentes obrigatórios:**` com crases (`revisoes.ts:355`), `**Porte:**` (`estado.ts:148`), 1ª linha `Tarefa: <caminho>` do prompt do revisor (`revisoes.ts:274`), tabela `| Início | Fim | Revisor | …` (`revisoes.ts:261`), blocos ```` ```mutacao ```` (`mutacoes.ts:1-30`), linha de veredito `ressalvas aceitas por` (`estado.ts:167`), título do roadmap `## X<n> — \`nome\` [ ]` (`estado.ts:60`), `Revisões:` no commit. Sem schema; o teste de contrato é o dos próprios parsers (`revisoes.test.ts` 1.450 linhas, `estado.test.ts`). Uma mudança de redação num SKILL (ex.: "Subagentes obrigatórios") quebra o hook sem aviso [hipótese; confirmar mudando o rótulo num documento de teste]. Mensagens entre agentes não têm validador: o `/seguir RELATÓRIO` é conferido pelo Orquestrador nos arquivos (`linhas.ts encontro`), não pelo formato.

## 7. Testes

`tools/processo/*.test.ts` (unidade, `vitest` projeto `unidade`): `revisoes` (1.450), `linhas` (612), `estado` (515), `mutacoes` (315), `separar-achados` (150), `esteira` (102), `vigia` (67). `tools/vitrine`: `escola.test`, `foto.test`, `escola.int.test`. Sem arquivo de teste próprio: `hook-revisoes.ts` (40 linhas, só cola), `portao-local.ts` (227; coberto por trechos em `revisoes.test.ts`/`mutacoes.test.ts` [hipótese]), `contexto-inicial.sh` (nenhum), os SKILL.md e agents (nenhum: não há teste de que os comandos citados existam; veja seção 9/11). A suíte do harness tem mais linhas de teste (3.211) que de código (3.101), o que protege o hook de commit, que é a peça que "faz a regra valer".

## 8. Resiliência e escala (sinais)

- Hook: falha ao registrar não derruba o revisor, e falha do portão vira `deny` com mensagem (`hook-revisoes.ts:22-36`) [código]: falha fechada no commit, aberta no registro (e sem registro o commit bloqueia).
- Fila de carga: `flock /tmp/educa-carga.lock` embutido em `portao-local.ts` e `e2e.ts`; o SKILL proíbe laço de `pgrep` por incidente da X2 (`seguir/SKILL.md:288-294`) [doc].
- Vigia: `vigia.ts` evita acordar o LLM sem motivo (96 de 100 vigias eram "nada a fazer" no F3, `vigia.ts:5-6`) [código]. Detecta trabalho lendo a tela do terminal por "esc to interrupt" (`vigia.ts`): dependência de texto da UI do Claude Code [hipótese de fragilidade].
- Custo de contexto: base fixa de cada sessão = `CLAUDE.md` + 7 regras sem `paths:` = 74 KB, ~12.100 palavras (regras 30 e 50 só carregam por caminho; as outras 7 não têm frontmatter). Se subagentes herdam isso, cada rodada de 4 a 6 revisores paga a base 4 a 6 vezes [hipótese; o texto de `implementador.md` só afirma para o Implementador]. O Orquestrador relê `SKILL.md` + `protocolo.md` (~6.700 palavras) a cada `/clear`, que é a cada tarefa (`seguir/SKILL.md:456-458`; `contexto-inicial.sh:35`).
- Estado concorrente: `tasks.md` é marcado por cada linha; `linhas.ts:146` tem tratamento especial para o conflito no `tasks.md` [código]: o design cria o conflito e o script o resolve.

## 9. Suspeitos de código/texto morto (suspeita, nunca afirmação)

| Item | Como procurei | Por que pode ser morto / o que o refutaria |
|---|---|---|
| Caminho `(mvp: …)`: `marcadorDoMvp`, `avaliarCommitDoMvp`, `SUITES_DO_MVP`, `PREFIXO_DAS_BRANCHES_DO_MVP` (`revisoes.ts:44-49, 953-979`) + ~40 menções no teste | `grep -ci mvp`; `git branch -a | grep mvp` vazio; nenhum SKILL ou agent o cita; A2–A5 pousaram em 05/10 (`CLAUDE.md`) | Refutaria: nova fatia de apresentação com dado sintético (D77) |
| `separar-achados.ts` (160 + 150 de teste) e parágrafos em `executar-task` passo 7 e `corrigir` passo 6 | nenhum `achados-revisoes.md` no repositório (`find`) | Migração de branch aberta antes de 22/09/2026; refutaria: branch antiga ainda viva no GitHub (Gabriel) |
| `domain-researcher` (40 linhas) | não está no matcher do `SubagentStop` (`settings.json:14`) nem em `REVISORES` (`revisoes.ts:31-33`); `revisoresObrigatorios` filtra o nome marcado (`revisoes.ts:357`); só 1 spec o citou (`prd-identidade-e-tenancy`) | marcar o agente na tarefa não gera cobrança nem registro; é ornamental |
| Skill `status` (50 linhas) | só `CLAUDE.md:360` a cita; o `/seguir` passo 2 faz o mesmo com `estado.ts` | Refutaria: um agente a invocar por pedido do Joaquim |
| `criar-prd/exemplo-preenchido.md` (106 linhas, 1.056 palavras) | única referência: `criar-prd/SKILL.md:65` e `template.md:2` | só custo se carregado sempre |
| Skills de terceiros nunca citadas pelos papéis (seção 4) | grep | podem ser úteis por auto-ativação |
| `.processo/` com arquivos soltos (`prompt-reengenharia.md`, `limpeza-prova.md`, `suites-873a1ab/`…) | `ls`; ignorados pelo git | resíduo de trabalho de sessão, não do repositório |
| Referências do ESLint à pasta `apps/api/src/ia/adapters` | não existe; adaptador real é `packages/nucleo/src/ia/adaptador-openai-compat.ts`, que usa `fetch` | a isenção da guarda é vazia (ver 11) |

## 10. Duplicação e inconsistência

- **Mesma instrução em vários lugares** [código, grep]:
  - "o arquivo existe antes do comando do commit" em `protocolo.md:97`, `executar-task` passo 7, `corrigir` passo 6.
  - Procedimento de `achados-revisoes.md`/`separar-achados` copiado em `executar-task` e `corrigir`.
  - Comandos da vitrine (`mostrar || montar`, `foto …`) em `executar-task` (3 blocos), `revisar-tarefa` passo 2, `validador.md:75`, `frontend-reviewer.md:48`.
  - Fila de carga/`flock` em `seguir` passo 6 e `executar-task` passo 4; descrição do portão em `40-testes.md`, `executar-task` passo 4, cabeçalho de `portao-local.ts`, `CLAUDE.md`.
  - Caducidade por tipo de alteração em `executar-task` passo 5, `revisar-tarefa` passo 1, `revisoes.ts:556`.
  - Tabela "natureza da tarefa → guardião": `criar-tasks`, `revisar-spec` (versão menor, sem pedagogia nem domain-researcher), `revisar-tarefa` passo 1.2 (prosa), cabeçalho "Como isso é checado" de 6 regras, `description` de 9 agentes.
  - Bloco "Severidade e rodada nova" copiado nos 9 revisores (`grep -c`: 1 em cada).
  - Regras: 00.5 e 20.4 (DTO), 10.4 e 20.5 (autorização por objeto), 10.6 e 20.6 (404 = 403), 00.4 e 80.2 (nada demorado), 30.5 e 70.3 (saída de IA); D55 repetida no `CLAUDE.md` (3 vezes) e na regra 70 (texto, tabela e item 2a).
  - `CLAUDE.md`: a tabela de 80 decisões (~D23, D78 e D79 com ~1.000 caracteres cada) repete `docs/decisoes.md` (1.310 linhas), que ele mesmo manda ler antes de usar.
- **Excesso de caso histórico dentro da instrução.** `executar-task` e `criar-tasks` trazem incidentes datados (X1, X2, X3, F3, A0b, A1: "17 reprovações…", "cinco horas…") como justificativa em linha. Cada parágrafo é correto, mas o conjunto faz do SKILL um diário de erros [código, `executar-task` passos 2-4].
- **Contradições** [código]:
  1. Esteira: `CLAUDE.md:139` (D78) e `:198` dizem "a esteira uma vez por spec, antes do pouso"; `corrigir/SKILL.md:102-104` diz "a esteira não é conferida a cada commit… só roda no fim". O `ci.yml` (`on.push: spec/**, correcao/**`), `40-testes.md` e `seguir` passo 6 dizem que roda em todo push (D79). Prevalece D79; os três textos estão velhos.
  2. `CLAUDE.md:114, 196`: "`test-engineer` primeiro"; `revisar-tarefa` passo 2 e D79 chamam todos os revisores juntos.
  3. `vigia/SKILL.md:29` ("só a primeira linha se resolve daqui") contradiz a tabela da mesma skill, em que a primeira linha é "nada" e as duas últimas mandam iniciar tarefa.
  4. `CLAUDE.md` chama de comandos `/corrigir`, `/retro`, `/revisar-spec`, `/validar` (também em `validar/SKILL.md`, `criar-tasks`), mas só `/seguir` e `/vigia` são invocáveis; as demais têm `user-invocable: false`. Dá para ler certo, mas induz a erro.
  5. `seguir` passo 3 diz "ninguém implementa no andar da spec" e `executar-task` passo 7 manda o Implementador marcar `[x]` em `tasks.md` na branch da linha: duas linhas editam o mesmo arquivo e o `linhas.ts` conserta o conflito depois (item 8).

## 11. Doc × código

- Regra 30 (`30-camada-ia.md:44-50`) e `llm-integrator.md:12` falam em `OllamaAdapter`, `OpenAICompatAdapter` e `apps/api/src/ia/adapters`. Código: `packages/nucleo/src/ia/adaptador-openai-compat.ts` e `adaptador-falso.ts`; não há pasta `adapters` nem arquivo Ollama [código]. A guarda `regras-ia.mjs:29` isenta uma pasta que não existe: o isento real é `packages/nucleo/src/ia`, que a guarda trata como domínio [hipótese: confirmar em `eslint.config.mjs`, onde o grep não achou a pasta].
- Regra 30, motivo: "preço alvo R$ 30 por aluno" não aparece em `docs/` nem no `CLAUDE.md` (D39/D40/D50 falam em R$ 5 de IA e faixas) [hipótese de texto velho].
- `CLAUDE.md` descreve "quatro papéis" mais Orquestrador, mas `.claude/agents/` tem 14 arquivos: 4 papéis, 9 revisores e `domain-researcher`.
- Referências a arquivos: de 138 caminhos citados em `CLAUDE.md`, agents, rules e skills, nenhum é link quebrado de verdade. Os que não existem são artefatos de execução (`.processo/*`, `achados/*`, `N_task.md`) ou ramo (`mockups/interface`). Única inexistência real: `apps/api/src/ia/adapters`.

## 12. Tamanho, risco e dependências

~50 mil palavras de instrução em markdown (CLAUDE.md 5,9 mil, regras 7,6 mil, agentes 9,9 mil, skills 26,3 mil) mais ~4 mil linhas de código de processo e 3,6 mil de teste. Risco de mexer: **alto** em `revisoes.ts`/hook (trava de commit de todo agente; erro de regex bloqueia todos ou libera todos) e em `estado.ts` (fonte da fase); **médio** em `seguir/SKILL.md` e `executar-task` (qualquer corte muda comportamento de papéis rodando em sonnet sem outra fonte); **baixo** em reviewers e skills pouco usadas. Depende de: U de `tools/ci` (fila de carga, e2e, compose), `.github/workflows/ci.yml`, `docs/decisoes.md`, `ROADMAP.md`. Dependem dele: todas as outras unidades (cada commit passa por ele).

## 13. Os 5 achados mais importantes

1. A base fixa de contexto (CLAUDE.md + 7 regras sem `paths:`) é ~74 KB e ~12 mil palavras por sessão, e o Orquestrador ainda relê ~6,7 mil palavras de `/seguir`+protocolo a cada tarefa por causa do `/clear`: custo recorrente grande e muita repetição entre os quatro níveis (CLAUDE.md, regras, agentes, skills).
2. As travas por máquina cobrem bem o processo (commit com marca, revisores, carimbo, mutações, push protegido), mas o contrato é texto livre lido por regex (`**Subagentes obrigatórios:**`, `Tarefa:`, tabela de Revisões): editar a redação de um SKILL pode quebrar o hook sem alerta, e a escolha de guardião por natureza da tarefa é só convenção em 5 lugares.
3. Textos de instrução contraditórios com a decisão vigente: esteira "uma vez por spec" (`CLAUDE.md:139,198`, `corrigir` passo 6) contra "a cada push" (D79, `ci.yml`, `40-testes`); "`test-engineer` primeiro" contra revisão em paralelo; vigia com tabela e regra que não batem.
4. Peso morto provável: caminho `(mvp:)` no hook (+40 refs de teste), `separar-achados.ts` e seus parágrafos duplicados, `domain-researcher` (marcar não gera cobrança), skill `status`, `exemplo-preenchido.md`, e as 12 skills de terceiros (2,2 MB) que nenhum papel manda carregar.
5. Regra 30 e a guarda de SDK apontam para `apps/api/src/ia/adapters`, que não existe (o adaptador real está em `packages/nucleo/src/ia`, via `fetch`, sem Ollama): a isenção da guarda é vazia e a regra descreve uma estrutura que o código não tem.

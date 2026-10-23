# Tarefas — Harness (X7)

**PRD:** `prd.md` · **Tech Spec:** `techspec.md` · **Anexos:** `tabela-de-guardioes.md`, `cenarios.md`, `texto.md`
<!-- Quantas estão concluídas não se escreve aqui: `node tools/processo/estado.ts` conta pela lista. -->

Vinte e uma tarefas, dentro do aceite do Joaquim para esta spec (de 18 a 24, PRD). A 21.0 entrou em 23/10/2026, pela
decisão dele (opção A: as receitas na X7, e não numa X8 nem só um apontamento no `executar-task`). A ordem segue a
Tech Spec §1: contrato e partição do hook primeiro (1.0 e 2.0); o código das retrospectivas em linhas (3.0 a 9.0); o
hook novo, um comportamento por tarefa (10.0 a 14.0); o texto e o Maestri por último (15.0 a 20.0), e as receitas
depois do texto (21.0). O ensaio do RF31 é do Orquestrador, no fechamento, e não é tarefa.

## Lista

- [x] **1.0 — Os rótulos que o hook lê ficam provados nos modelos, e o papel chega ao Bash**
  - [x] 1.1 Teste do harness dos rótulos dos modelos (RF12)
  - [x] 1.2 Prova numa sessão real de que `CLAUDE_CODE_AGENT` chega ao Bash do papel e do subagente (§12)
  - [x] 1.3 Testes: rótulo tirado, revisor desconhecido

- [x] **2.0 — O `revisoes.ts` partido por responsabilidade, sem mudar comportamento**
  - [ ] 2.1 `documento-de-revisao.ts`, `caducidade.ts`, `comando-git.ts`, `portao.ts`; `revisoes.ts` só reexporta
  - [ ] 2.2 `estado.ts` e `esteira.ts` deixam de importar `revisoes.ts`
  - [ ] 2.3 Testes: os atuais verdes sem alteração; teste dos imports

- [ ] **3.0 — A esteira cancela a superada sozinha e não chama a cancelada de vermelha à toa**
  - [ ] 3.1 `concurrency` e `pull_request` para a `develop` no `ci.yml` (RF1, RF19)
  - [ ] 3.2 Veredito com superada e `--event push` no `esteira.ts` (RF2)
  - [ ] 3.3 Testes: os casos de RF1, RF2 e RF19 do `cenarios.md`

- [ ] **4.0 — O censo do prazo do e2e e o caso retitulado**
  - [ ] 4.1 O `ci.yml` sobe o reporter JSON de cada fatia também no verde
  - [ ] 4.2 `esteira.ts --censo` (RF9)
  - [ ] 4.3 A régua acha o prazo do caso retitulado (RF11)
  - [ ] 4.4 Testes: RF9 e RF11 do `cenarios.md`

- [x] **5.0 — O quadro das linhas sob uma trava só, com a linha solta por comando e a base gravada**
  - [x] 5.1 `abrir`, `partida`, `abandonar` e `encontro` pegam o mesmo `flock`, relêem e gravam só a própria linha
  - [x] 5.2 O `abrir` grava a linha e a base, e solta a trava antes do `npm ci`; o `conferir` compara com a base (RF10)
  - [x] 5.3 `linhas.ts abandonar <n>` (RF6)
  - [x] 5.4 Testes: as corridas do quadro com arquivo-sinal, RF6 e RF10 do `cenarios.md`

- [ ] **6.0 — O encontro roda tipagem e lint e recusa o vermelho sem avançar a spec**
  - [ ] 6.1 Verificação no checkout da linha, depois do merge e antes do `--ff-only` (RF3)
  - [ ] 6.2 Prazo, grupo de processo e a ordem matar, voltar, soltar
  - [ ] 6.3 Testes: RF3 do `cenarios.md`

- [x] **7.0 — A mutação que trava sai no prazo e solta o ambiente**
  - [ ] 7.1 Corrida limpa medida, prazo da mutada, grupo de processo (RF4, §7c)
  - [ ] 7.2 Testes: RF4 do `cenarios.md`, com relógio injetado

- [x] **8.0 — O portão derruba os workers e chama as guardas pelas etapas da esteira**
  - [x] 8.1 A sequência do portão em função testável, com os workers derrubados antes da integração (RF7)
  - [x] 8.2 Portão e `ci:verificar` pela mesma lista de `etapas-de-guarda.ts` (RF8)
  - [x] 8.3 Testes: RF7 e RF8 do `cenarios.md`

- [x] **9.0 — Tarefa de código sem mutação não recebe carimbo**
  - [x] 9.1 `mutacoes.ts --faltando` (RF5)
  - [x] 9.2 A exigência do RF17 no portão e na `decidirCommit`
  - [x] 9.3 Testes: RF5 e RF17 do `cenarios.md`

- [ ] **10.0 — Uma decisão de commit para as duas entradas, e o `PreToolUse` nega o desvio**
  - [ ] 10.1 `decidirCommit` em `portao.ts`, chamada pelo `PreToolUse`
  - [ ] 10.2 A negação em sessão de papel e a recusa de `Fora do processo:` (§5a)
  - [ ] 10.3 Testes: negação do `PreToolUse` do `cenarios.md`

- [ ] **11.0 — O git hook nativo barra o commit e o push de papel por qualquer caminho**
  - [ ] 11.1 `hook-git.ts`, `git-hooks/commit-msg` e `pre-push`, e o `prepare`
  - [ ] 11.2 O início de sessão confere o `core.hooksPath`
  - [ ] 11.3 Testes: formas contra um git real (RF14) e a instalação

- [ ] **12.0 — A esteira recusa o commit de código sem marca em spec e correção**
  - [ ] 12.1 `tools/ci/conferir-entregas.ts` e o job `verificar` (§5a)
  - [ ] 12.2 Testes: terceira camada do `cenarios.md`

- [ ] **13.0 — O commit exige o guardião que o caminho pede**
  - [ ] 13.1 `guardioes-por-caminho.ts` com a tabela, as regras de casamento e a união (RF15)
  - [ ] 13.2 O portão imprime a lista unida
  - [ ] 13.3 Testes: `guardioes.test.ts` e RF15 do `cenarios.md`

- [ ] **14.0 — Código de processo exige revisão, e o `(mvp:)` sai**
  - [ ] 14.1 A lista do §5(e) e as linhas do RF16 na tabela (RF16)
  - [ ] 14.2 O caminho `(mvp:)` sai do hook (RF18)
  - [ ] 14.3 Testes: RF16 e RF18 do `cenarios.md`

- [ ] **15.0 — A base fixa curta, e as regras 00, 40, 60 e 80 por `paths:`**
  - [ ] 15.1 `CLAUDE.md` com os destinos do `texto.md`; `docs/decisoes-em-aberto.md` lido pelo `estado.ts`
  - [ ] 15.2 `paths:` nas quatro regras; 10, 20 e 70 sempre carregadas
  - [ ] 15.3 Testes: RF20 do `cenarios.md`, com a medida antes e depois

- [ ] **16.0 — Cada regra aponta a checagem que a garante, e nada cita caminho que não existe**
  - [ ] 16.1 Checagem citada ou "só a revisão garante" em cada regra (RF25)
  - [ ] 16.2 Caminhos citados em papel, regra e guarda; a isenção da guarda de IA (RF24)
  - [ ] 16.3 Testes: RF24 e RF25 do `cenarios.md`

- [ ] **17.0 — O `/seguir` partido por passo e as paradas que viram aviso**
  - [ ] 17.1 `SKILL.md` com índice e passos 1, 2 e 5; os outros em `passos/`; o `6-tarefa.md` autossuficiente (RF22, RF26)
  - [ ] 17.2 As paradas da D79 revista: passo 7, `retro`, `validador.md`; o passo do censo (RF9)
  - [ ] 17.3 Testes: RF22 e RF26 do `cenarios.md`

- [ ] **18.0 — Um fato num lugar só, e o `executar-task` sem diário**
  - [ ] 18.1 As contradições do `texto.md` resolvidas no lugar que fica (RF21)
  - [ ] 18.2 Autoconferência no `task-template.md` e incidentes em `docs/processo-licoes.md` (RF22)
  - [ ] 18.3 Testes: RF21 e RF22 do `cenarios.md`

- [ ] **19.0 — Skills de terceiro, papéis e metadados auditados e provados na esteira**
  - [ ] 19.1 Auditoria das skills; conflito depois do frontmatter; sai `frontend-design` e `status` (RF23)
  - [ ] 19.2 Critério de saída nos quatro papéis do time (RF24)
  - [ ] 19.3 Teste do harness dos metadados (RF30)
  - [ ] 19.4 Testes: RF23, RF24 e RF30 do `cenarios.md`

- [ ] **20.0 — A limpeza vigiada, o modo sem Maestri e a mensagem colada**
  - [ ] 20.1 `limpeza.json` e a vigia (RF27)
  - [ ] 20.2 `docs/processo-sem-maestri.md` com o socorro, e a leitura do `maestri list` com saída real (RF28)
  - [ ] 20.3 `UserPromptSubmit` (RF29)
  - [ ] 20.4 Testes: RF27 a RF29 do `cenarios.md`

- [ ] **21.0 — Uma skill de projeto aponta as receitas do guia, e a esteira prova que os caminhos existem**
  - [ ] 21.1 `.claude/skills/receitas-de-codigo/SKILL.md`: uma linha por receita do guia, com seção, exemplo e travas (RF32)
  - [ ] 21.2 O `executar-task`, o modelo da Tech Spec e o mapa do `CLAUDE.md` apontam para ela; o guia diz que é apontado
  - [ ] 21.3 A extração de caminhos da 16.0 num módulo, sem mudar o que devolve, se ela ficou dentro do teste
  - [ ] 21.4 Testes: RF32 do `cenarios.md`

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | — | 5.0, 7.0, 8.0 |
| 2.0 | 1.0 | 5.0, 7.0, 8.0 |
| 3.0 | 2.0 | 5.0, 6.0, 7.0, 8.0, 9.0, 10.0 |
| 4.0 | 3.0 | 6.0, 7.0, 8.0, 9.0, 10.0, 11.0 |
| 5.0 | — | 1.0, 2.0, 3.0, 7.0, 8.0 |
| 6.0 | 5.0 | 3.0, 4.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0 |
| 7.0 | — | 1.0, 2.0, 3.0, 4.0, 5.0, 6.0 |
| 8.0 | — | 1.0, 2.0, 3.0, 4.0, 5.0, 6.0 |
| 9.0 | 2.0, 7.0, 8.0 | 3.0, 4.0, 6.0 |
| 10.0 | 2.0 | 3.0, 4.0, 6.0 |
| 11.0 | 10.0 | 4.0, 6.0, 15.0 |
| 12.0 | 4.0, 10.0 | 6.0, 15.0 |
| 13.0 | 9.0, 10.0 | 15.0 |
| 14.0 | 13.0 | 15.0 |
| 15.0 | 2.0 | 11.0, 12.0, 13.0, 14.0 |
| 16.0 | 14.0, 15.0 | 20.0 |
| 17.0 | 4.0, 6.0, 14.0 | — |
| 18.0 | 17.0 | — |
| 19.0 | 15.0, 18.0 | — |
| 20.0 | 11.0, 17.0 | 16.0, 21.0 |
| 21.0 | 16.0, 18.0, 19.0 | 20.0 |

## Subagentes por tarefa

Marcados pelo Arquiteto, até três guardiões com veto (D79); `test-engineer` e `revisor-geral` em todas. Com a 13.0 e a
14.0 na spec, o hook soma os que o caminho pede (`tabela-de-guardioes.md`): a 16.0 (`tools/guardas/`) e a 20.0
(`.claude/settings.json`) passam a pedir os quatro.

| Tarefa | Guardiões marcados |
|---|---|
| 1.0, 2.0, 9.0, 19.0 | nenhum |
| 3.0, 4.0, 12.0 | `infra-guardian`, `privacy-guardian` (o `ci.yml` de um repositório público) |
| 5.0, 6.0, 7.0, 8.0, 10.0, 11.0 | `infra-guardian` |
| 13.0 | `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer` |
| 14.0 | `infra-guardian`, `privacy-guardian`, `conformidade-reviewer` |
| 15.0 | `infra-guardian`, `conformidade-reviewer` |
| 16.0, 18.0 | `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer` (as duas editam texto dos guardiões) |
| 17.0 | `conformidade-reviewer` |
| 20.0 | `infra-guardian`, `privacy-guardian` |
| 21.0 | `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer` (a skill aponta as receitas do isolamento, do dado pessoal e da IA) |

## Critério de pronto da funcionalidade

Do `ROADMAP.md`, X7: cada skill, papel, regra, hook e rotina está no lugar e no formato que o Claude Code e o Maestri
descobrem e executam, provado por uso; os metadados estão corretos e nada se contradiz entre `CLAUDE.md`, regras, skills,
papéis e `docs/decisoes.md`; toda regra aponta a checagem que a garante; a P4 e as M1 a M7 da X5 e as M1 a M3 da X3 estão
feitas, cada uma com o teste que a prova; as perguntas "Para a Etapa 9" estão aplicadas; a base fixa está medida antes e
depois. Em detalhe:

- os 32 RF do PRD com a prova da coluna "Como se prova", e os casos do `cenarios.md` verdes
- o ensaio do RF31: uma correção do `TODO.md` ("(X5, RF31)", `.reengenharia` no `.dockerignore`) de ponta a ponta no
  fluxo novo, com os quatro papéis subindo por `claude --agent`, e um commit sem revisão por `/usr/bin/git` recusado no
  mesmo andar, registrado no `estado.md`
- a esteira verde no último commit que alterou código, e o `TODO.md` com a remoção do `separar-achados.ts` esperando o
  ok do Gabriel

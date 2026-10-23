# PRD — Harness (X7)

**Status:** aprovado (Joaquim, 23/10/2026, no terminal do Arquiteto); RF2, RF14, RF15, RF16 e §6 revistos por ele na revisão da spec
**Funcionalidade do roadmap:** X7
**Depende de:** X5 (`5566974`) e a correção do `casca.spec.ts:67` (`6d1a2d3`). A X4 espera esta pousar.
**Teto de tarefas:** de 18 a 24, acima das doze da D79, com o aceite do Joaquim em 23/10/2026 ("uma spec, sem prazo").

Fontes: `MISSAO.md` 9.1 a 9.5 (`tasks/prd-reengenharia/`), o U11 (tag `reengenharia/temporario`), o `TODO.md` e as
respostas do Joaquim de 23/10/2026 (revisões da D23, D53, D77 e D79).

## 1. Problema

O Joaquim constrói o Turmma com um time de agentes que começa cada tarefa sem memória e depende do harness (skills,
papéis, regras, hook, esteira, Maestri). Ele não se protege: o hook não vê `git commit` escrito de outro jeito, o
guardião com veto some calado quando o rótulo quebra, e o código das guardas entra sem revisão. Gasta sem
retorno: 75 KB de base fixa por sessão, um terço repetindo `docs/decisoes.md`; o Orquestrador relê 41 KB por tarefa.
E pede mão: 44 execuções canceladas à mão na X5, um lint vermelho nascido de duas linhas verdes, 41 minutos de ambiente
preso por uma mutação, e a cláusula sem mutação reprovada em quatro specs.

## 2. Objetivo

O harness se protege por máquina, carrega só o que a sessão usa, não pede mão onde a máquina resolve, e cada peça é
provada por uso.

## 3. Fora de escopo

- Papel novo, troca de modelo de papel, mudança nas seis regras ou no veto das regras 10, 20 e 70
- Mudar parada sem a palavra do Joaquim
- Redesenho do Maestri: só mudanças pequenas e verificáveis (MISSAO 9.4)
- Tirar `achados/` do git (fica, 23/10/2026)
- Código de produto, salvo onde o harness exige; documentos das specs fechadas

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Orquestrador | ler a esteira e as linhas sem `gh` nem edição à mão | commitar código; decidir parada |
| Arquiteto | escrever skill, papel e regra como documento; marcar guardião além do que o caminho exige | dispensar guardião que o caminho exige |
| Implementador | ver no portão a condição sem mutação, antes da Mesa | commitar sem tarefa, revisão e carimbo por qualquer forma de chamar o git; alterar `tools/` ou o hook sem revisão |

## 5. Requisitos funcionais

**A. Código de processo das retrospectivas** (`tasks/prd-reengenharia/retro.md`, `tasks/prd-telas-do-professor/retro.md`)

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | Em `spec/**` e `correcao/**`, a execução superada da esteira é cancelada sozinha; na `develop`, `release` e `main`, não (P4) | Teste que lê o `ci.yml` |
| RF2 | A cancelada com execução `push` mais nova na mesma branch é superada e não conta; a cancelada sem sucessora, por prazo inclusive, é vermelha e cita o job (M1 da X5) | Superada sobre verde: verde; cancelada por prazo sem sucessora: vermelha, com o job |
| RF3 | O encontro roda tipagem e lint depois do merge e recusa o vermelho sem avançar a spec (M2 da X5) | Duas branches verdes que juntas quebram o lint |
| RF4 | Mutação cujo teste passa do prazo conta como recusada e solta o ambiente (M3 da X5) | Teste que trava: sai no prazo, recusada |
| RF5 | O portão lista as linhas novas de produção com condição que nenhum bloco alcança (M4 da X5) | `if` novo sem bloco aparece; com bloco, não |
| RF6 | Uma linha se solta por comando (M5 da X5) | O quadro mostra a linha livre |
| RF7 | O portão derruba despachante e workers do compose de teste antes da integração (M6 da X5) | Worker de pé não consome o job do teste |
| RF8 | Portão e `ci:verificar` chamam as guardas pelas mesmas etapas (M7 da X5) | Teste compara as duas listas |
| RF9 | O censo de prazo do e2e lista os casos acima de dois terços do prazo na última esteira verde da spec, e o Orquestrador abre correção se a lista não está vazia (M1 da X3) | Log de exemplo; o `/seguir` diz quando |
| RF10 | `linhas.ts conferir` compara com a base da branch, não sempre com a `develop` (M2 da X3) | Correção saída de spec: a base é a spec |
| RF11 | A régua de duração acha o prazo de um caso de e2e retitulado (M3 da X3) | `test.slow()` no HEAD com título novo |

**B. O hook e as decisões de 23/10/2026**

| # | Requisito | Como se prova |
|---|---|---|
| RF12 | Os rótulos que o hook e o `estado.ts` leem existem nos modelos de documento, com nomes de revisor que o hook conhece | Rótulo tirado do modelo: esteira vermelha |
| RF13 | O hook é partido por responsabilidade sem mudar comportamento, antes de qualquer mudança de comportamento | Testes atuais do hook verdes sem alteração, salvo o arquivo que o caso "sem o compilador instalado" copia, que segue a função para o `caducidade.ts` (decisão do Joaquim, 23/10/2026) |
| RF14 | Em sessão de papel do time, commit e push por caminho absoluto, `env`, `command`, `sh -c`, script e merge de papel têm as exigências de hoje; todo andar e linha nasce com isso. O que a máquina não barra (tirar o papel do ambiente, `--no-verify` dentro de script, `commit-tree`, `rebase`) fica escrito, e a esteira recusa em `spec/**` e `correcao/**` o commit com código sem marca nem linha `Revisões:`, salvo o do Joaquim com a linha `Fora do processo: <motivo>`, que o hook recusa vinda de papel (D53) | Formas × resultado contra um git real; sem marca empurrado: esteira vermelha |
| RF15 | O commit exige a rodada de cada guardião com veto que o caminho alterado pede, somada à marcação. Código em `apps/`, `packages/`, `e2e/` e `tools/guardas/` pede os quatro; o que pede menos é exceção escrita, com motivo (D79) | Repository sem `tenancy-guardian` marcado: recusado sem a rodada dele; pasta nova: os quatro; exceção que não casa nada: esteira vermelha |
| RF16 | Em sessão de papel, commit em `tools/`, `.github/`, `.claude/settings*.json`, `.claude/hooks/`, `docs/aia/ouro*/`, `package.json`, `compose.yaml`, `.env.example` ou numa configuração que decide o portão (lint, vitest, Playwright, `tsconfig`, knip, gitleaks, tamanho) exige tarefa ou correção, `revisor-geral`, `test-engineer`, o guardião da regra que a guarda ou o corpus protege, e carimbo; skill, papel e regra continuam documento (D53) | `tools/guardas/` sem tarefa: recusado; `.claude/skills/`: passa |
| RF17 | Tarefa ou correção que altera `apps/*/src` ou `packages/*/src` sem bloco de mutação nem linha "Sem mutação: <motivo>" não recebe carimbo (regra 40) | Os dois casos e a exceção |
| RF18 | O caminho `(mvp:)` sai do hook (D77) | Commit marcado é tratado como código sem tarefa |
| RF19 | A esteira roda no `pull_request` para a `develop` (D23) | Teste que lê o `ci.yml` |

**C. Skills, papéis, regras e CLAUDE.md** (MISSAO 9.1 a 9.3)

| # | Requisito | Como se prova |
|---|---|---|
| RF20 | `CLAUDE.md` com até ~150 linhas (produto, seis regras, mapa, uma linha por decisão); o resto vai para `docs/`. As regras 00, 40, 60 e 80 carregam por `paths:`; a 10, a 20 e a 70, sempre | Teste: base fixa abaixo do limite declarado e regras sempre carregadas = {10, 20, 70}; medida antes e depois |
| RF21 | Cada fato do processo fica num lugar só; as contradições do U11-6 deixam de existir | Lista na Tech Spec com o lugar que ficou; teste de que blocos repetidos entre revisores são idênticos |
| RF22 | `/seguir` e `executar-task` sem diário de incidentes, cada um abaixo de 500 linhas, o `/seguir` partido por passo e lido sob demanda; o que sai vai para um documento de lições | Teste de tamanho; lista do que migrou |
| RF23 | Cada skill, de processo e de terceiro, auditada (objetivo, escopo, conflito, redundância, desatualização), com os padrões da X5; a de terceiro fica, sai ou é atualizada | Tabela da auditoria; conflito que fica escrito onde sobrevive à atualização |
| RF24 | Cada papel com responsabilidade única, critério de saída e entrega verificável; nenhum papel, regra ou guarda cita caminho que não existe (U11-13) | Teste de existência dos caminhos citados |
| RF25 | Cada regra aponta a checagem que a garante ou declara que só a revisão garante; o que repete decisão ou skill migra com registro | Teste: a checagem citada existe |

**D. Maestri** (MISSAO 9.4)

| # | Requisito | Como se prova |
|---|---|---|
| RF26 | O Orquestrador lê por tarefa só o que o passo da vez pede | Teste de orçamento dos bytes por tarefa |
| RF27 | A limpeza do Orquestrador não se perde calada: acontece, ou a vigia acusa | Caso do terminal ocupado |
| RF28 | O modo sem Maestri está escrito (Mesa e Implementador com `claude --agent`), e a leitura do `maestri list` tem teste com saída real | Documento e exemplo gravado |
| RF29 | Mensagem longa que precisa do `/seguir` chega executando, ou o aviso de sessão manda executar | Caso da mensagem colada |

**E. Validação** (MISSAO 9.5)

| # | Requisito | Como se prova |
|---|---|---|
| RF30 | Teste do harness na esteira: skill com metadados válidos e arquivos citados existentes; papel com nome, modelo e ferramentas; `paths:` existente; comando de hook apontando arquivo existente | Cada quebra deixa a esteira vermelha |
| RF31 | Antes do pouso, uma correção real e pequena do `TODO.md` roda de ponta a ponta no fluxo novo, com os quatro papéis subindo por `claude --agent` no modelo certo; no mesmo andar, commit sem revisão por `/usr/bin/git` é recusado | Registro no `estado.md` e na validação |

## 6. Regras de negócio

- O hook muda na ordem do U11 §7: testes de contrato, mover sem mudar, e só então comportamento. Todo commit que mexe
  nele prova, com o comando real do `settings.json`, que ele carrega e bloqueia; se quebrar, o socorro é um comando no
  terminal do Joaquim. A cópia congelada saiu (23/10/2026): era forjável e travava o time pela metade
- O hook continua fechando na falha de carga (N7)
- Nada sai em silêncio: o que sai tem destino ou motivo escrito, e mudança de decisão é revisão da D

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Commit do Joaquim fora de sessão de papel | Passa no hook, mesmo quebrado; código em `spec/**` leva `Fora do processo:` |
| Push de documento cancela a execução do commit de código | Vale a do documento, com o mesmo código |
| O `merge` do encontro cria commit | Continua permitido pelo hook nativo |
| O Implementador "conserta" uma guarda vermelha | Exige revisão (RF16) |
| A X7 altera o hook que julga os próprios commits | Julga o da árvore, testado antes; outros andares recebem no merge da `develop` |
| Tarefa só de tela sem condição nova | "Sem mutação: <motivo>", que o `test-engineer` pode recusar |
| `npx skills update` sobrescreve uma skill de terceiro | O conflito escrito não se perde |

## 8. Dado pessoal envolvido

Nenhum. O ensaio do RF31 usa dado sintético.

## 8b. Risco regulatório

Sem IA no caminho do aluno. O RF15 e o RF16 protegem as regras 10, 20 e 70 por máquina, e não por memória.

## 9. Métricas

A base fixa e os bytes por tarefa do Orquestrador, antes e depois. Na X4, contra a X5: cancelamentos à mão (44 → 0),
edições do `linhas.json` (2 → 0), reprovações pela cláusula sem mutação (10), vermelhos depois do encontro (2).

## 10. Perguntas em aberto

- A regra 80.5 (sessão no Redis, o código lê do Postgres) espera a medida da N2 da X5; até lá, só a nota da diferença

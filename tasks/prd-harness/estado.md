# Estado da execução — harness

## Agora
- **Abertura em 23/10/2026**, pela palavra do Joaquim no terminal do Orquestrador: a Etapa 9 da missão da X5 (92.0;
  `tasks/prd-reengenharia/MISSAO.md` 9.1–9.5: skills, agentes, regras, CLAUDE.md, hook, esteira e fluxo do Maestri) virou
  a X7, antes da X4 (`c8a9a88`). Dentro dela: a correção de processo do `TODO.md` (P4 e M1–M7 da X5, M1–M3 da X3, o lint
  no encontro) e as perguntas "Para a Etapa 9" de `tasks/prd-reengenharia/DIAGNOSTICO.md` §5. A Etapa 9 é ⛔: as propostas
  passam pelo Joaquim no terminal do `Arquiteto`
- **Spec pronta (23/10):** PRD aprovado pelo Joaquim (`a278508`), Tech Spec (`7a2ca8f`), revisão da spec APROVADA na
  rodada 10 (`b7a8a7f`), 20 tarefas (`d57bf2b`), sem mudança de desenho nem de critério do PRD
- **Construção começou às ~14:10 de 23/10/2026**, pela palavra do Joaquim ("pode começar a spec"), antes da hora do aviso.
  Três linhas abertas (`spec/harness--l1..l3`, ambientes de teste 1 a 3)
- **Espero:**
  - linha 1 (`Implementador`/`Mesa`): **11.0** (grande), 1ª tentativa, retomada às ~21:10 (sessões novas) depois da correção
    `2026-10-23-audit-multer` (`ea6b093`, overrides do multer 2.5.0; infra-guardian e test-engineer APROVADO na 1ª; sem
    encontro próprio, segue com o da 11.0)
  - linha 2 (`Implementador 2`/`Mesa 2`): **15.0** (grande), 1ª tentativa, desde ~20:35; retomada às ~21:10 com
    `git merge --ff-only ea6b093`, portão e Mesa
  - linha 3 (`Implementador 3`/`Mesa 3`): **correção `2026-10-23-entrar-renovacao-concorrente`**, desde ~20:30 (esteira
    `40006927589` em `754d79c`, e2e `e2e/entrar.spec.ts:181`; guardiões `infra-guardian`, `privacy-guardian`); retomada às
    ~21:10 com `git merge --ff-only ea6b093`, portão e Mesa
  - as três linhas levam o `ea6b093`; o encontro de cada uma o acha já na spec depois do primeiro
  - cada `RELATÓRIO` → `linhas.ts encontro <n>`, depois `esteira.ts`
- **Devo ainda:**
  - no fechamento, levar ao `TODO.md` as três "Recomendações sem aplicar" do `4_task.md` (destino TODO.md)
  - nota ao Arquiteto, no próximo pedido: as recomendações de texto da 10.0 (`techspec.md:94` e `:97`, `cenarios.md:73`,
    `--super-prefix`) ficam com ele (estão em "Recomendações sem aplicar" do `10_task.md`); e o hook só lê a linha `Revisões:`
    em commit com `-F`, não com vários `-m` (aviso do Implementador 2)
  - **antes de partir a 16.0:** pedir ao `Arquiteto` que feche a fronteira no `16_task.md`. Hoje a 16.0 confere aspas em
    `tools/guardas/`, onde há fixtures que não existem, e o `arquiteto.md` tem caminhos com reticências. Ver o
    `revisao-spec.md`, rodadas 11 a 13
  - a fila da esteira: perguntei ao Joaquim se cancelo as execuções das branches de linha, e ele não respondeu. Não é parada,
    e a 3.0 (RF1) resolve isso
  - nota ao Arquiteto, no próximo pedido: o `tasks.md:26` ainda cita `gh run list --event push`, e a 3.0 passou a ler por
    evento (push e `workflow_dispatch`); está em "Divergências resolvidas", na Tech Spec §5(f) e no `cenarios.md`
  - nota ao Arquiteto, no próximo pedido: o encontro novo da 6.0 tem a saída de código 5 (começa por `VERIFICAÇÃO RECUSADA`),
    que pede a mesma correção do CONFLITO, e o `/seguir` (passo 6) ainda não a cita (aviso do Implementador 2)
  - nota ao Arquiteto, se servir: o lote 5/7 do e2e passou dos 45 min do job na correção do `casca`, o que pesa no M1
  - para o `/retro`: na fixture `casca.ts`, o passo seguinte (código do MFA na entrada) tem a mesma causa possível (Redis de
    fila parado 2 s), mas falha em 20 s com o erro certo (relatório da correção `agentes-suspensao-intermitente`)
- **Escopo:** a **21.0 entrou** (RF32, skill `receitas-de-codigo`, que aponta o guia), por decisão do Joaquim às ~16:10. Ela depende da
  16.0, da 18.0 e da 19.0. A revisão da spec, rodadas 11 a 13, saiu APROVADA, em `7669852`
- **Base:** `spec/harness` em `ae839fc` (encontro da 10.0); esteiras `40026244263` (em `0068e5d`) e `40039836142` correndo. Com a
  4.0, o `esteira.ts` pula a cancelada e lê a última concluída. As três anteriores (`40017905038`,
  `40018797893`, `40021941702`) foram **canceladas** pelo push seguinte, não reprovadas: o `esteira.ts` lê cancelada como
  VERMELHA. Não abri correção. Sem esteira concluída na spec desde `a691e02`

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| 1.0 | `ae688d8` | Sonnet 5.5 | test-engineer 2, revisor-geral 2 (aprovado nas duas) | premissa do §12 medida: no subagente `CLAUDE_CODE_AGENT` é o papel do terminal; levar ao Arquiteto antes da 11.0 |
| 7.0 | `f775960` | Sonnet 5.5 | infra-guardian 2, revisor-geral 2, test-engineer 2 (os três reprovaram na 1ª) | push do encontro falhou (TLS) e foi refeito |
| 8.0 | `eccbfaa` + `473c2ce` (encontro-8) | Sonnet 5.5 | infra-guardian 2, test-engineer 2, revisor-geral 2; a correção: revisor-geral 1, test-engineer 1 | 5 divergências de detalhe (RF7/RF8) na Tech Spec; CONFLITO no `cenarios.md` no encontro |
| correção complexidade-revisoes | `df55c2f` | Sonnet 5.5 | test-engineer 1, revisor-geral 1 | antes da 2.0, por triagem do Arquiteto (2ª divergência); TETO 248→244 |
| 2.0 | `4fcf89d` | Sonnet 5.5 | test-engineer 2, revisor-geral 2 | duas DIVERGÊNCIAS: o RF13, com BLOQUEIO, que o Joaquim resolveu com A; e a catraca, que o Arquiteto triou como detalhe A, com a correção complexidade-revisoes antes. Três divergências no `2_task.md` e sobras no `TODO.md` |
| 5.0 | `9b676fc` | Sonnet 5.5 | infra-guardian 2, test-engineer 2, revisor-geral 2 (os três reprovaram na 1ª) | |
| 3.0 | `201e9b3` | Sonnet 5.5 | infra-guardian 2, privacy-guardian 2, test-engineer 2, revisor-geral 2 | `gh run list` lê por evento (push e `workflow_dispatch`), não só `--event push`; o `tasks.md:26` ainda cita o antigo |
| 9.0 | `954821d` | Sonnet 5.5 | test-engineer 2, revisor-geral 2 | |
| 6.0 | `8dce7e7` + `e430451` (encontro-6-harness) | Sonnet 5.5 | infra-guardian 2, revisor-geral 2, test-engineer 2; a correção: infra-guardian 1, revisor-geral 1, test-engineer 1 | CONFLITO no `cenarios.md` no encontro (3ª vez nesta spec); slug `encontro-6` já existia de outra spec; recomendação do infra-guardian virou item no `TODO.md` |
| correção agentes-suspensao-intermitente | `dc11702` | Sonnet 5.5 | conformidade-reviewer 1, frontend-reviewer 1, test-engineer 1 | esteira vermelha em `a691e02`; causa: Redis de fila parado 2 s, a fixture esperava só o sucesso da ativação do MFA; não era a suspensão |
| 4.0 | `5341e20` + `bd292fb` (correção zod) | Sonnet 5.5 | infra-guardian 2, privacy-guardian 2, test-engineer 2, revisor-geral 2; a correção: infra-guardian 1, revisor-geral 1, test-engineer 1 | DIVERGÊNCIA `portão` (zod <4.6.6, GHSA-mrhx-c7xc-m3w5) virou a correção `zod-4-6-7-audit` na linha; três recomendações para o TODO.md |
| 10.0 | `d76ef01` + `995ff72` (correção zod) + `02386f8` (correção vite) | Sonnet 5.5 | infra-guardian 4, test-engineer 4, revisor-geral 4; as correções: infra-guardian 1, test-engineer 1 (+ revisor-geral 1 na do zod) | ESCALADA na r2 → diagnóstico do Arquiteto (gramática do leitor do shell, techspec §5(a)); BLOQUEIO na r3 do test-engineer (`--attr-source`), Joaquim destravou com A; duas DIVERGÊNCIAS `portão` de `npm audit` |

## Esperando o Joaquim
## 23/10/2026 ~19:10 — X7 tarefa 10.0 (limite: 3 reprovações do test-engineer)
Decisão: como destravar a 10.0, que o `test-engineer` reprovou na 3ª rodada seguida (infra-guardian e revisor-geral aprovaram)?
Contexto: bloqueante único em `tools/processo/comando-git.ts:361` (linha 2): `OPCOES_DO_GIT_COM_ARGUMENTO` não tem `--attr-source` nem
`--shallow-file`, e `git --attr-source HEAD commit -n -m x` passa pelo leitor. Achados em `tasks/prd-harness/achados/10_task.md`; o
diagnóstico do Arquiteto em `.processo/ordens/diagnostico-10.md` (linha 2)
Opções: (A) incluir as duas opções no Set, com caso em negados e bloco de mutação, e conferir de uma vez as outras opções globais do
git que levam argumento separado | (B) declarar "opção global do git fora da lista" como limite na Tech Spec §5(a), com caso em passam
Recomendo: A. A brecha é concreta, a correção cabe em poucas linhas, e o revisor-geral apontou a mesma forma. Conferir a lista
inteira agora evita uma 4ª rodada pela próxima opção
**Respondida em 23/10 ~19:15 pelo Joaquim, no terminal do Orquestrador: "faca o recomendado pode escolher".** Opção A.
Destravado em `rodadas.md` da linha 2; retomada da 10.0 ao Implementador 2
## 23/10/2026 ~16:10 — X7 escopo (skills de projeto)
Decisão: a X7 ganha uma tarefa que ensina aos agentes o jeito de construir o Turmma, que a Etapa 9.1 da MISSAO pedia
("incorpore os padrões finais") e nenhuma das 20 tarefas cobre? Hoje nenhuma skill, papel nem o `CLAUDE.md` aponta o
`docs/guia-do-desenvolvedor.md`, onde estão as receitas
Opções: (A) a tarefa 21.0 na X7, depois da 19.0 | (B) uma spec própria (X8) | (C) só apontar o guia no `executar-task`
Recomendo: A
**Respondida em 23/10 ~16:10 pelo Joaquim, no terminal do Orquestrador: "vai na opcao A".** Condição combinada: as
receitas ficam num lugar só, sem cópia do guia; a skill é curta, com os arquivos de exemplo reais, e tem teste de
caminhos na esteira. Pedido ao `Arquiteto` (PRD, Tech Spec, `cenarios.md`, `tasks.md`, `21_task.md`)
## 23/10/2026 ~14:45 — X7 tarefa 2.0 (BLOQUEIO do Arquiteto)
Decisão: o RF13 ("testes atuais do hook verdes sem alteração") ganha a exceção do caso "sem o compilador instalado", ou a partição do `revisoes.ts` sai?
Contexto: o caso `revisoes.test.ts:942` copia só o `revisoes.ts` para fora do repo, e ali a reexportação do §2 não resolve. O §2 e o RF13 juntos ficam impossíveis. Divergência em "Agora"; `prd.md` RF13, `techspec.md` §2
Opções: (A) o caso copia o `caducidade.ts`, onde a função passa a morar, com as mesmas asserções, e o RF13 ganha "salvo o arquivo que esse caso copia" | (B) desistir da partição, o que tira a base da 9.0 à 14.0
Recomendo: A. A mudança é de duas linhas, o mesmo comportamento continua provado, e a 9.0 à 14.0 continuam de pé
**Respondida em 23/10 ~15:30 pelo Joaquim, no terminal do Orquestrador: "faca a A entao".** Pedido ao `Arquiteto` (RF13 no `prd.md`
e no `cenarios.md`, 2.4 no `2_task.md`); depois, retomada da 2.0
Segue sem depender: a 5.0 (linha 2) e a 7.0 (linha 3), que não tocam o `revisoes.ts` nem dependem da 2.0. Ficam paradas a 2.0 e, atrás dela, a 3.0, a 4.0, a 9.0 à 14.0 e a 15.0
## O que falhou
- 23/10 ~17:12: CONFLITO no encontro da 6.0, em `cenarios.md`, o mesmo arquivo do `encontro-8`. Virou a correção
  `encontro-6` na linha 2
- 23/10 ~15:25: CONFLITO no encontro da 8.0, em `cenarios.md`. A 8.0 registrou divergências de detalhe no RF7 e no RF8, e a spec
  já tinha mudado o mesmo arquivo. Virou a correção `encontro-8` na linha 3
- 23/10 14:49: o push do encontro da 7.0 falhou (`TLS connect error ... unexpected eof`). Refiz `git push origin spec/harness`, que passou
## O que decidi sem perguntar
- 23/10 ~20:50: DIVERGÊNCIA de portão da 11.0 (multer, GHSA-q7qp-rjg7-q26m) → correção `2026-10-23-audit-multer` na linha 1, antes de retomar a 11.0 (`/seguir` passo 6)
- 23/10 ~17:50: DIVERGÊNCIA `portão` do Implementador 3 na 4.0 (aviso novo do `npm audit` para o zod). Virou correção na
  linha 3, no meio da tarefa, com o `infra-guardian` ditado, porque o zod valida a entrada HTTP inteira (D81)
- 23/10 ~18:15: a mesma DIVERGÊNCIA `portão` na linha 2 (10.0). Correção própria na linha 2, com a mudança de `bd292fb`
  e documento novo, em vez de cherry-pick: a seção "Revisões" e a rodada da Mesa são de cada linha
- 23/10 ~18:20: na correção do zod da linha 2, o portão parou no knip (`Unlisted binaries: mkfifo`, em `revisoes.test.ts`, arquivo da
  10.0 sem commit). Decidi: o ajuste é da 10.0, feito agora na árvore e revisto na rodada 2 dela; o commit da correção leva só os
  arquivos dela
- 23/10 ~20:15: segunda DIVERGÊNCIA `portão` de dependência na linha 2 (vite e transitivas). Correção na própria linha, como a do
  zod: as outras linhas estão ociosas e recebem pela spec

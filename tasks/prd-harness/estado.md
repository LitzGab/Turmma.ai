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
- **Validação, 1ª rodada (24/10, sobre `147854c`): REPROVADA** (`validacao.md`). 31 RF atendidos, RF29 parcial. Crítico C1: o
  `aviso-de-sessao.sh:23` só reconhece `/seguir ` no começo, e a mensagem colada real chega `<pasted_content id=…>\n/seguir …`
  (o próprio relatório do Validador chegou assim a esta sessão). Maior M1: o `linhas.ts abandonar` (RF6) não está em passo
  nenhum do `/seguir`. Menores m1–m3 vão ao `TODO.md` no fechamento (seção 6 do `validacao.md`)
- **Espero:** as duas correções, uma por achado, que não se tocam:
  - linha 1: correção `2026-10-24-aviso-mensagem-colada` (C1), 1ª tentativa, com o `Implementador` e a `Mesa`
  - linha 2: correção `2026-10-24-seguir-abandonar-linha` (M1), 1ª tentativa, com o `Implementador 2` e a `Mesa 2`
  - linha 3: ociosa
  - com os dois encontros: commit "antes da validação", o `Validador` reiniciado no andar para a 2ª rodada (só RF29, M1 e a
    esteira do commit novo, como a seção 5 do `validacao.md` diz), e depois o passo 8
- **Devo ainda:**
  - do relatório da 20.0 (RF31): no meu primeiro `/clear` **depois do pouso** (o hook novo só vale no térreo quando a X7 pousar), conferir se `.processo/limpeza.json` ganha `feita` (o `/clear` de sessão sem papel no térreo esconde uma limpeza perdida); regravar `tools/processo/__fixtures__/maestri-list.txt` com a saída do meu terminal (linhas numeradas, sem caminho de usuário nem título de sessão: repositório público), por correção; a transcrição da prova do 20.6 em `~/.claude/projects` foi apagada; o `TODO.md` ganhou duas linhas "Da X7" (`limpeza.json` ancorado no térreo e `limpeza.json` que não é objeto); SKILL+protocolo+6-tarefa somam 23.967 B (teto 24.000)
  - no fechamento, levar ao `TODO.md` o "sem aplicar" da Mesa na 19.0 (r2): o comentário do cabeçalho do
    `metadados.test.ts` (regra e `settings.json`), a nota na 19.3, e a revisão da `lgpd-brasil`
  - no fechamento, levar ao `TODO.md` as três "Recomendações sem aplicar" do `4_task.md` (destino TODO.md)
  - no fechamento, levar ao `TODO.md` (ou ao `/retro`) o lote 5/7 do e2e, que passou dos 45 min do job na correção do
    `casca`: o Arquiteto não abriu tarefa, porque o RF2 já marca de vermelho o prazo estourado, com o nome do job
  - a fila da esteira: perguntei ao Joaquim se cancelo as execuções das branches de linha, e ele não respondeu. Não é parada,
    e a 3.0 (RF1) resolve isso
  - para o `/retro`: na fixture `casca.ts`, o passo seguinte (código do MFA na entrada) tem a mesma causa possível (Redis de
    fila parado 2 s), mas falha em 20 s com o erro certo (relatório da correção `agentes-suspensao-intermitente`)
  - **feito (RELATÓRIO do Arquiteto, 22:26, `d1cd361`):** a 14.1 importa a lista do §5(e) via `ehCodigoParaAEsteira`; a fronteira
    do `16_task.md` fechada (fora `*.test.ts` e `__fixtures__` de `tools/guardas`, reticência vale como placeholder, mínimo de
    100 caminhos); as notas da 10.0, do `tasks.md:26`, da saída 5 do encontro (17.2) e do `-F` (18.4a) aplicadas
- **Escopo:** a **21.0 entrou** (RF32, skill `receitas-de-codigo`, que aponta o guia), por decisão do Joaquim às ~16:10. Ela depende da
  16.0, da 18.0 e da 19.0. A revisão da spec, rodadas 11 a 13, saiu APROVADA, em `7669852`
- **Base:** `spec/harness` em `53944c1` (encontro da correção da linha 2, push feito), esteira `40068026208` rodando. Antes: `ae95688` (encontro da correção da linha 1), esteira `40067862653`. Antes: `68200ca` (encontro da 21.0, push feito), esteira `40066578823` na fila; a `40064817905` (em `9a86e4c`) correndo. Antes: `9a86e4c` (encontro da 19.0). Antes: `9232548` (encontro da 18.0), esteira `40062318436` rodando ao ler. Antes: `e77d55f` (encontro da 17.0); esteiras `40059951136` (em `e77d55f`) na fila e `40057552550` (em `1f066fe`) correndo. Antes: `1f066fe` (encontro da 16.0); a última concluída,
  `40054774558` em `c1759e2`, **verde** (a `40052965683`, em `822cec2`, cancelada pelo push seguinte). Antes: `c1759e2` (encontro
  da 14.0). Antes: `822cec2` (encontro da 13.0). Antes: `ca159fa` (encontro da 12.0), esteira `40049333195`. Antes: `f6d13ea` (encontro da 11.0), esteira `40046467544` (em `76b3b71`). Antes: `ae839fc` (encontro da 10.0),
  com as esteiras `40026244263` (em `0068e5d`) e `40039836142`. Com a 4.0, o `esteira.ts` pula a cancelada e lê a última concluída. As três anteriores (`40017905038`,
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
| correção `entrar-renovacao-concorrente` (linha 3) | `8795cf8` | Sonnet 5.5 | test-engineer 1, infra-guardian 1, privacy-guardian 1 | esteira `40006927589`; DIVERGÊNCIA `portão` (multer) → esperou a `audit-multer`; tolerância de 250 ms, 80 corridas verdes |
| 15.0 | `5ce1632` (+ `ea6b093`, correção multer, por ff) | Sonnet 5.5 | infra-guardian 1, conformidade-reviewer 1, test-engineer 2, revisor-geral 2 | DIVERGÊNCIA `portão` (multer) → esperou a `audit-multer` da linha 1; base fixa 75.218 → 34,4 KB |
| 11.0 | `6e701d4` (+ `ea6b093`, correção `audit-multer`) | Sonnet 5.5 | infra-guardian 1, test-engineer 2, revisor-geral 2 (correção: infra-guardian 1, test-engineer 1) | DIVERGÊNCIA `portão` (multer GHSA-q7qp-rjg7-q26m) → correção `2026-10-23-audit-multer` na linha, overrides do multer 2.5.0; 53 mutações; item novo no `TODO.md` "(X7, tarefa 11.0)" |
| 12.0 | `fbe056f` | Sonnet 5.5 | privacy-guardian 2, infra-guardian 3, revisor-geral 2, test-engineer 2 | 56 mutações; duas entradas novas no `TODO.md`; a 14.1 deve importar a lista do §5(e) de `portao.ts` (levado ao Arquiteto) |
| 13.0 | `3649e27` | Sonnet 5.5 | tenancy-guardian 2, privacy-guardian 2, conformidade-reviewer 2, test-engineer 2, revisor-geral 2 | |
| 14.0 | `8ddb462` | Sonnet 5.5 | infra-guardian, privacy-guardian, conformidade-reviewer, tenancy-guardian, test-engineer, revisor-geral, todos aprovados na 2ª (o test-engineer reprovou a 1ª) | `tools/ci/caminhos-da-esteira.ts` novo, fora dos previstos; 4 divergências no documento; a correção que leva código de processo passa a exigir o revisor-geral |
| 16.0 | `d447c3c` | Sonnet 5.5 | tenancy-guardian 1, conformidade-reviewer 1, infra-guardian 1, privacy-guardian 2, test-engineer 2, revisor-geral 2 | ordem da 1ª rodada com 18 itens; encontro em `1f066fe` |
| 17.0 | `3fde484` | Sonnet 5.5 | conformidade-reviewer 2, test-engineer 2, revisor-geral 2 | recomendações com destino TODO.md já entraram (4 linhas); folga do orçamento de leitura, 68 B; encontro em `e77d55f` |
| 18.0 | `bf94e40` | Sonnet 5.5 | tenancy-guardian 1, privacy-guardian 1, conformidade-reviewer 1, infra-guardian 1, test-engineer 2, revisor-geral 2 | encontro em `9232548` |
| 19.0 | `d699407` | Sonnet 5.5 | test-engineer 2, revisor-geral 2, privacy-guardian 1 | sem aplicar da Mesa (r2) levado a "Devo ainda"; encontro em `9a86e4c` |
| 21.0 | `57f9cd3` | Sonnet 5.5 | test-engineer 2, revisor-geral 2, tenancy 1, privacy 1, conformidade 1 | encontro em `68200ca` |
| 20.0 | `d5377d7` | Sonnet 5.5 | 2 rodadas (todos aprovados na 2ª) | premissa do §12 provada em parte (`20_task.md` "Divergências"); pendências levadas a "Devo ainda" |
| correção dockerignore-reengenharia (linha 1) | `029cdb5` | Sonnet 5.5 | infra-guardian 1, test-engineer 2, revisor-geral 2 | ensaio do RF31: `/usr/bin/git` sem revisão recusado duas vezes; encontro em `ae95688` |
| correção fixture-maestri-list (linha 2) | `e2da6d9` | Sonnet 5.5 | privacy-guardian 1, test-engineer 2, revisor-geral 2 | fixture regravada do terminal do Orquestrador; encontro em `53944c1` |

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

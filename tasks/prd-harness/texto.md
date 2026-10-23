# O texto do harness (X7) — detalhe da Tech Spec §9

**Skills de terceiro (RF23):**

| Skill | Decisão | Motivo |
|---|---|---|
| `frontend-design` | sai | pede ousadia estética; a pele está fechada (D80), e a regra 50 corta o resto |
| `supabase-postgres-best-practices`, `vercel-react-best-practices`, `lgpd-brasil`, `playwright-best-practices`, `nestjs-best-practices` | ficam, com o conflito na primeira linha depois do frontmatter do `SKILL.md` | o resto vale |
| as outras seis | ficam | sem conflito |

O texto de cada conflito mora em `docs/skills-de-terceiros.md`. Um teste do harness fica vermelho quando a linha some do
`SKILL.md`, e quem rodou `npx skills update` a copia de volta. Sai também a `status`, que o `estado.ts` substitui. O
`separar-achados.ts` fica: a remoção espera o ok do Gabriel (U11-10) e vai para o `TODO.md`.

**Para onde vai o `CLAUDE.md` (RF20):**

| Seção | Destino |
|---|---|
| Decisões tomadas | uma linha por decisão, só número e título |
| Conflitos já resolvidos | topo de `docs/decisoes.md` |
| Decisões em aberto | `docs/decisoes-em-aberto.md`, lido pelo `estado.ts` |
| Skills (time, revisores, hook) | `.claude/skills/seguir/time.md`, lido no passo 3 |
| Conflitos de skill | `docs/skills-de-terceiros.md` |

Ficam o produto, as seis regras, o recorte, a stack e o mapa. A base fixa é o `CLAUDE.md` mais as regras sem `paths:`
(75 KB hoje); limite de 40.000 B.

**As regras ganham `paths:`.** A 10, a 20 e a 70 não ganham, continuam sempre carregadas, e os itens delas não saem do
texto.

| Regra | `paths:` |
|---|---|
| 00 | `apps/**`, `packages/**`, `infra/**` |
| 40 | `**/*.test.ts`, `**/*.test.tsx`, `e2e/**`, `tools/**` |
| 60 | `apps/**`, `packages/**` |
| 80 | `apps/**`, `packages/nucleo/**`, `infra/**`, `.github/**`, `tools/ci/**`, `compose.yaml` |

As quatro são lidas por extenso em `criar-prd`, `criar-techspec`, `revisar-spec`, `criar-tasks`, `validar` e `retro`; se a
premissa do §12 cair, também nos revisores. A regra 40 passa a dizer o RF17.

**As contradições (RF21)**, cada uma no lugar que fica:

| Contradição | Fica em |
|---|---|
| esteira "uma vez por spec" (`CLAUDE.md`, `corrigir`) × "em todo push" | D79; o `corrigir` diz que o Orquestrador lê a esteira |
| "`test-engineer` primeiro" × revisores juntos | `revisar-tarefa` |
| `vigia`: "só a primeira linha se resolve daqui" | a tabela da `vigia` |
| `/corrigir`, `/retro`, `/revisar-spec` como comando × `user-invocable: false` | `/seguir` é o único comando |
| identidade visual "em aberto" × D80 | D80 |
| pasta de adaptadores da regra 30, do `llm-integrator` e da guarda | `packages/nucleo/src/ia/adaptador-*.ts` |
| tabela natureza → guardião em seis lugares | `tabela-de-guardioes.md` e o código |
| "o arquivo existe antes do commit" em três skills | a mensagem do hook e o protocolo |
| regra 80.5 (sessão no Redis) × o código | nota na regra, até a N2 |
| `docs/aia/ouro/README.md` manda commitar com `(ouro: <política>)` × RF16 | o README passa a `(correção <slug>)` com o `conformidade-reviewer` |

**`/seguir` e papéis.** O `SKILL.md` fica com o cabeçalho, um índice e os passos 1, 2 e 5 (cerca de 7 KB); os outros,
o 6 (o ciclo de uma tarefa) inclusive, vão para `.claude/skills/seguir/passos/`, lidos ao entrar no passo. Orçamento por
tarefa: `SKILL.md` + `protocolo.md` + `passos/6-tarefa.md` até 24 KB (hoje são 41 KB), com teste; o passo 6 perde o que
repete o protocolo. O passo de fechamento diz quando rodar o `esteira.ts --censo` e abrir correção (RF9). A autoconferência do `executar-task` vira até doze perguntas no `task-template.md`, e os incidentes, com data
e origem, vão para `docs/processo-licoes.md`. Na deduplicação, a lista "O que verificar" e o bloco do formato da
resposta de cada guardião com veto não mudam.

**As paradas (revisão da D79).** Viram aviso a proposta de retrospectiva que muda só skill, papel ou modelo de
documento, salvo a que mexe na lista de um guardião com veto ou nas skills que decidem a marcação (`criar-tasks`,
`revisar-tarefa`, `revisar-spec`), e a ressalva menor da validação. Achado das regras 10, 20 e 70 nunca é menor. Muda o passo 7 do `/seguir`, a `retro` e o `validador.md`.

**Auditoria e critério de saída (RF23, RF24).** A tabela da auditoria das skills de processo (objetivo, escopo,
conflito, redundância, desatualização, decisão) fica em `docs/processo-licoes.md`; o critério de saída e a entrega de
cada papel ficam no próprio `.claude/agents/<papel>.md`, numa seção com esse nome, que o teste do harness confere.

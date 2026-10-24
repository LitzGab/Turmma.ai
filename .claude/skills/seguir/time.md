# O time, os revisores e as skills

> Movido do `CLAUDE.md` (X7, RF20). Lido pelo Orquestrador ao montar o time (passo 3 do `/seguir`).

**Do processo** (nossas, em `.claude/skills/`): o comando é um só, **`/seguir`** (D78). O
Orquestrador lê a fase em `tools/processo/estado.ts`, monta o time no Maestri e conduz até a próxima
decisão que é do Joaquim. As outras são procedimento interno dos agentes, na ordem em que entram:
`status`, `descobrir`, `registrar-decisao`, `criar-prd`, `criar-techspec`, `revisar-spec`,
`criar-tasks`, `executar-task`, `revisar-tarefa`, `corrigir`, `validar`, `retro`; e `vigia`, a
rotina de 30 minutos do Orquestrador. Como os agentes conversam está em
`.claude/skills/seguir/protocolo.md`.

**O time** é fixo, no térreo do Maestri: o Orquestrador (o terminal Maestro, em Opus) e quatro
papéis, que rodam no Claude Code, de `.claude/agents/`, iniciados com `claude --agent <papel>`:
`arquiteto` (Opus), `implementador` (Sonnet), `mesa-de-revisao` (Sonnet) e `validador` (Opus). Os
terminais ficam; a sessão de cada um é reiniciada a cada tarefa ou fase, já apontada para o checkout
em que vai trabalhar: na construção, o de uma linha da spec, cada uma com o seu par de Implementador
e Mesa (D79). Sessão que passa de 400 mil tokens é compactada sozinha
(`autoCompactWindow`, em `.claude/settings.json`), e `.claude/hooks/contexto-inicial.sh` diz a cada
papel o que reler depois. O Orquestrador não espera por isso: limpa o próprio contexto a cada tarefa,
e o que ele sabe da funcionalidade é o "Agora" do `estado.md` do andar.

**Revisores** (em `.claude/agents/`, subagentes chamados pela Mesa de revisão): em toda tarefa,
`test-engineer`, `revisor-geral` e os guardiões marcados, juntos. O hook `tools/processo/revisoes.ts`
registra as rodadas, guarda o que foi exigido em `achados/<documento>.md` com resumo de uma linha
em `achados/indice.md` (leia o índice, abra o bloco), e bloqueia o commit sem
revisão válida, sem portão da tarefa carimbado (`node tools/processo/portao-local.ts --tarefa`), ou que leve
código sem `(tarefa N.0)` nem `(correção <slug>)` (D53).

**Técnicas** (de terceiros, instaladas via skills.sh, versões em `skills-lock.json`):
`nestjs-best-practices`, `drizzle-orm-patterns`, `supabase-postgres-best-practices`,
`bullmq-specialist`, `vercel-react-best-practices`, `tanstack-query-best-practices`,
`tailwind-design-system`, `frontend-design`, `accessibility`, `vitest`,
`playwright-best-practices`, `lgpd-brasil`. Atualizar com `npx skills update -p`, e ler o
diff antes de commitar: skill vira instrução para o Claude.

Os conflitos de cada skill de terceiros com as regras e as decisões estão em `docs/skills-de-terceiros.md`.

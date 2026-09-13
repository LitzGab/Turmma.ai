# Tarefa 10.0 — Lote não urgente só começa fora do horário letivo da escola

**Funcionalidade:** fundacao-tecnica · **Depende de:** 9.0
**Subagentes obrigatórios:** `infra-guardian`, `tenancy-guardian`, `test-engineer`

## Objetivo

Um job de lote marcado como não urgente fica segurado durante o horário letivo da escola
dele e sai quando o horário acaba, sem ocupar vaga enquanto espera. Job urgente não é
afetado.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF6 e casos de borda "feriado numa quarta" e "escola com aula aos sábados"
- `techspec.md`: seção 3 (colunas de fuso, dias, início e fim) e seção 5 ("Despachar",
  passo 1)
- `.claude/rules/80-infra-e-carga.md`, item 2: lote não urgente roda fora do horário letivo
- `docs/infra.md`, seção 6: horário letivo configurável por escola, padrão de segunda a
  sexta, das 7h às 18h
- `docs/glossario.md`: "Ano letivo", "Período" (o calendário de feriados é F8, não aqui)
- Código existente: despachante e `configuracao_operacional_escola` (9.0)

## Subtarefas

- [x] 10.1 — `packages/nucleo/src/fila/janela-letiva.ts`: `estaNaJanela(config, agora)` e
  `proximaAbertura(config, agora)`, com relógio injetado.
  - Configuração nula usa o padrão do ambiente: `America/Sao_Paulo`, segunda a sexta,
    07:00–18:00.
  - O fim é exclusivo: 18:00 já está fora.
- [x] 10.2 — O despachante pula o job não urgente que está na janela letiva da escola, antes
  de reservar e antes de tomar vaga. Job urgente e fila interativa ou normal nunca são
  segurados
- [x] 10.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/fila/janela-letiva.ts` | novo |
| `packages/nucleo/src/relogio.ts` | novo |
| `apps/despachante/src/despachante.ts` | alterado |
| `packages/nucleo/test/janela-letiva.test.ts`, `apps/despachante/test/janela.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: não urgente criado numa terça às 10h é segurado e sai a partir das 18h; criado num sábado sai na hora | unidade e integração | a janela padrão é aplicada |
| borda: escola com aula aos sábados (`dias_letivos` com sábado) segura sábado às 10h | unidade | os dias vêm da configuração |
| borda: feriado numa quarta é tratado como dia letivo, segura até as 18h e não dá erro | unidade | comportamento declarado no PRD |
| borda: escola com fuso diferente de São Paulo; 17h59 segura e 18h00 libera | unidade | não usa UTC e o limite está certo |
| borda: urgente dentro da janela sai na hora; o não urgente segurado não consome vaga | integração | não trava a escola durante a aula |
| isolamento: a janela da escola A (sábado letivo) não segura job da B no sábado | integração | a configuração é por escola |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Vetos aprovados (se aplicáveis)
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Calendário escolar com feriado (F8). Agendamento recorrente de rotina (11.0).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit da tarefa fica bloqueado enquanto um revisor obrigatório não tiver rodada iniciada
depois da última alteração de código, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-13 12:55:05 | 2026-09-13 12:56:04 | `tenancy-guardian` | 1 | APROVADO | a4b7cecc69a1fb449 |
| 2026-09-13 12:54:52 | 2026-09-13 12:57:41 | `infra-guardian` | 1 | REPROVADO | ad5a597be01df6140 |
| 2026-09-13 12:55:19 | 2026-09-13 12:59:46 | `test-engineer` | 1 | APROVADO | a7cfeff7f26d92ee5 |
| 2026-09-13 13:14:49 | 2026-09-13 13:15:38 | `tenancy-guardian` | 2 | APROVADO | aecf04caeb71025f6 |
| 2026-09-13 13:14:39 | 2026-09-13 13:16:18 | `infra-guardian` | 2 | APROVADO | a0caa51694f44cf11 |
| 2026-09-13 13:15:03 | 2026-09-13 13:17:04 | `test-engineer` | 2 | APROVADO | a43a66c0d5ab8ba65 |
| 2026-09-13 13:18:04 | 2026-09-13 13:18:39 | `infra-guardian` | 3 | APROVADO | a55e4ba993ddaa37a |
| 2026-09-13 13:18:12 | 2026-09-13 13:19:02 | `tenancy-guardian` | 3 | APROVADO | a021939d0be554a29 |
| 2026-09-13 13:18:20 | 2026-09-13 13:19:23 | `test-engineer` | 3 | APROVADO | a40d5f01f59d5c8c3 |
| 2026-09-13 13:34:06 | 2026-09-13 13:34:30 | `tenancy-guardian` | 4 | APROVADO | ad69bc18c88172473 |
| 2026-09-13 13:34:11 | 2026-09-13 13:34:35 | `test-engineer` | 4 | APROVADO | adf6d3b3a9586a189 |
| 2026-09-13 13:34:01 | 2026-09-13 13:34:37 | `infra-guardian` | 4 | APROVADO | abfa1a630ef84d85c |

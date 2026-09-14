# Tarefa 13.0 — Alertas locais disparam e têm runbook

**Funcionalidade:** fundacao-tecnica · **Depende de:** 6.0, 9.0, 12.0
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`

## Objetivo

Três regras de alerta ficam versionadas e disparam no Grafana local quando a condição
acontece, cada uma com o parágrafo do runbook que diz o que fazer:
- job interativo esperando
- seguro de limite ativo
- erro 5xx

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF16; `techspec.md`: seção 5 ("Observação local", alertas)
- `.claude/rules/80-infra-e-carga.md`, item 10: alerta novo vem com runbook
- `docs/runbook.md`: formato da entrada. "Job interativo com mais de 30 segundos na fila"
  já tem esqueleto; "Sistema fora do ar" fica para o staging (D31)
- Código existente: métricas e painel (12.0), seguro de limite (6.0), filas (9.0)

## Subtarefas

- [x] 13.1 — Regras provisionadas em `infra/grafana/alertas/`, cada uma com `for:`
  - `job.espera_mais_antiga_s{fila="interativa"} > 30` por 1 min
  - `limite.seguro_ativo == 1` por 2 min
  - 5xx acima de 5% numa rota por 5 min
  - ⚠️ Confirme que o `otel-lgtm` aceita provisionamento de alerta por arquivo; se não
    aceitar, use Grafana e Prometheus separados no compose e registre a troca na Tech Spec
- [x] 13.2 — Entradas em `docs/runbook.md` no formato do arquivo: "Job interativo esperando",
  "Seguro de limite ativo" e "Taxa de erro 5xx"
- [x] 13.3 — `npm run ensaio:alertas`:
  - para o `worker-interativo` e manda job interativo
  - para o Redis de cache
  - força falha numa rota sintética
  - confere pela API do Grafana que as três regras chegam a disparadas, e restaura tudo no
    fim
- [x] 13.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `infra/grafana/alertas/job-interativo-esperando.yaml`, `seguro-limite-ativo.yaml`, `taxa-5xx.yaml` | novo |
| `infra/scripts/ensaio-alertas.ts` | novo |
| `docs/runbook.md` | alterado |
| `tools/guardas/alerta-tem-runbook.test.ts` | novo |
| `package.json` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: `ensaio:alertas` leva as três regras a disparadas | integração | as regras funcionam ponta a ponta local |
| borda: condição curta (espera de 20 s) não dispara | integração | a regra tem `for:` e não gera alarme falso |
| borda: a condição cessa e a regra volta a normal | integração | o alerta não fica preso |
| guarda: cada arquivo em `infra/grafana/alertas/` tem entrada correspondente em `docs/runbook.md` | unidade | quebra se um alerta entrar sem runbook |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Entrega ao celular, silenciamento fora de ensaio, check externo e o alerta "Sistema fora do
ar" (`notas-staging.md`, D31).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit da tarefa fica bloqueado enquanto um revisor obrigatório não tiver rodada iniciada
depois da última alteração de código, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-13 21:57:01 | 2026-09-13 22:00:37 | `test-engineer` | 1 | REPROVADO | a330a72ffc0bc2799 |
| 2026-09-13 21:56:46 | 2026-09-13 22:01:24 | `infra-guardian` | 1 | APROVADO | ae42642566f71d680 |
| 2026-09-13 22:19:23 | 2026-09-13 22:20:34 | `infra-guardian` | 2 | APROVADO | a434ccd382c1f6e3e |
| 2026-09-13 22:19:12 | 2026-09-13 22:21:14 | `test-engineer` | 2 | APROVADO | a2877486b20fb9ee5 |
| 2026-09-13 22:45:44 | 2026-09-13 22:46:11 | `test-engineer` | 3 | APROVADO | af3d20a60de2348b0 |
| 2026-09-13 22:45:38 | 2026-09-13 22:46:23 | `infra-guardian` | 3 | APROVADO | aabc1894521d7de1c |

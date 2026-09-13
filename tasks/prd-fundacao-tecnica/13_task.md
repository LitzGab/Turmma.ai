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

- [ ] 13.1 — Regras provisionadas em `infra/grafana/alertas/`, cada uma com `for:`
  - `job.espera_mais_antiga_s{fila="interativa"} > 30` por 1 min
  - `limite.seguro_ativo == 1` por 2 min
  - 5xx acima de 5% numa rota por 5 min
  - ⚠️ Confirme que o `otel-lgtm` aceita provisionamento de alerta por arquivo; se não
    aceitar, use Grafana e Prometheus separados no compose e registre a troca na Tech Spec
- [ ] 13.2 — Entradas em `docs/runbook.md` no formato do arquivo: "Job interativo esperando",
  "Seguro de limite ativo" e "Taxa de erro 5xx"
- [ ] 13.3 — `npm run ensaio:alertas`:
  - para o `worker-interativo` e manda job interativo
  - para o Redis de cache
  - força falha numa rota sintética
  - confere pela API do Grafana que as três regras chegam a disparadas, e restaura tudo no
    fim
- [ ] 13.4 — Testes

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

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Vetos aprovados (se aplicáveis)
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Entrega ao celular, silenciamento fora de ensaio, check externo e o alerta "Sistema fora do
ar" (`notas-staging.md`, D31).

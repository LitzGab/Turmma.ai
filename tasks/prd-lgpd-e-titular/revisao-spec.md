# Revisão de spec — lgpd-e-titular

**Subagentes obrigatórios:** `test-engineer`, `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `frontend-reviewer`, `conformidade-reviewer`, `llm-integrator`

## Rodada 1 — 05/10/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 16 (cenários faltando para RF2, RF5 a RF9, RF12 e RF14 a RF20; virada do ano; prazos fixos; troca de nome por coluna; corridas em paralelo) |
| `tenancy-guardian` | REPROVADO | 4 (`@SemEscopo` da conta global ao mover o ciclo de vida; lista de exceções incompleta; incidente compartilhado revela outra escola; três testes de isolamento) |
| `privacy-guardian` | REPROVADO | 6 (auditoria da prévia e do detalhe; classificação de toda tabela; prazos atrelados; o que fica fora da versão da coordenação; compartilhamento depois do expurgo; aluno só na lista de nomes) |
| `infra-guardian` | REPROVADO | 4 (ordem da chave de envio; etapa 1 da eliminação sem trava nem deduplicação; índices por titular e de anonimização; lote da troca de nome) |
| `conformidade-reviewer` | REPROVADO | 5 (tema e texto do modelo na versão da coordenação; prévia como medição nominal do professor; checks de `execucao_agente`; correção de lote não aprovado no arquivo; troca de nome sem registro) |
| `llm-integrator` | AJUSTES NECESSÁRIOS | 3 (checks de `execucao_agente`; contrato de `consumo_ia.provedor`; foto do compartilhamento) |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 6 (identificação do titular; Concluir, download da coordenação e correção; vazio de "Meus dados"; busca por envio; aviso de incidente que prende; nome do arquivo baixado) |

### Decisões do Joaquim nesta rodada
- A correção do **nome** do titular entra no próprio pedido de correção (regra 20, item 19); turma e vínculo continuam nas telas da A1. Muda o "fora de escopo" do PRD.
- Piso e teto aprovados, com duas travas (texto do modelo e execução ≤ conversa do professor; consumo por aluno ≤ conversa do Tutor) e o piso da conversa do Tutor e dos sinais em 6 meses.

### Correções exigidas na Tech Spec
- 3: `execucao_agente` anonimizada como `entrada = {tarefa}`, `solicitada_por` nulo, `resultado` e `erro` mantidos (conformidade, llm-integrator)
- 3: classificação de toda tabela existente, com quem aplica o prazo e o que entra no arquivo (privacy, test-engineer)
- 3: prazos atrelados (privacy) e piso do Tutor (Joaquim)
- 3 e 4: `titulares_estimados` e `categorias` por escola em `incidente_escola`; DTO do incidente campo a campo; texto livre sem citar outra escola (tenancy)
- 3 e 5: foto do compartilhamento no pedido; reserva por período quando o rastro expirou; provedor sem cadastro aparece (llm-integrator, privacy)
- 3: contrato de `consumo_ia.provedor` (variável validada na subida, no adaptador, só com envio externo, check) (llm-integrator)
- 3 e 4: aluno só na lista de nomes atendido pela tela da lista da A1, com aviso (privacy)
- 4: prévia e detalhe auditados; prévia de professor sem contagem nem período de uso; busca por `POST`, sem o termo na auditoria (privacy, conformidade)
- 4 e 9: busca e prévia com turma ou vínculo; nome e turma na lista e no detalhe (frontend)
- 5: o que a versão da coordenação nunca traz, campo a campo (privacy, conformidade)
- 5: correção de lote não aprovado sai só como "em validação" ou "rejeitada" (conformidade)
- 5: etapa 1 confere o pedido com `now()` do banco; um `titular.eliminar` por pedido; chave de envio decide primeiro; lote da troca de nome por faixa de `(escola_id, id)` (infra)
- 5: auditoria `titular.nome_trocado` por linha alterada de artefato, entrega, execução e consumo; à coordenação só "houve troca" (conformidade, tenancy)
- 5: o objeto do storage que falhou ao apagar é achado por `apagado_em` (test-engineer)
- 5: "si mesmo" por conta; "conta ativa" por escola (test-engineer)
- 6: tabela de `@SemEscopo` (conta global no `nucleo/ciclo-de-vida`, rotina, `ops:*`, expurgo de acesso ao incidente) e o teste de arquitetura (tenancy)
- 7c: índices por titular e de anonimização, com `EXPLAIN` na tarefa da migration; alertas de pedido atrasado (infra)
- 9: Concluir, download da coordenação com finalidade, correção do nome, vazio e estados de "Meus dados", busca por envio, aviso de incidente com "Ver depois", arquivo sem nome da pessoa (frontend)
- 10: cenários do test-engineer em `cenarios.md`, por RF

### Recomendações
- Reexpurgo que confere a janela letiva entre lotes; ordem das travas pedido → usuário; índice de incidente pendente (infra)
- Autor `rotina` restrito por check às ações de retenção e eliminação (conformidade)
- `expurgo_execucao` por mais tempo (privacy)
- Realtime derruba o socket quando existir o modo sala (infra, privacy)

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-05 14:41:28 | 2026-10-05 14:43:51 | `llm-integrator` | 1 | AJUSTES NECESSÁRIOS | aa9afed832623783e |
| 2026-10-05 14:41:13 | 2026-10-05 14:44:12 | `tenancy-guardian` | 1 | REPROVADO | a2101a2759dcab9a4 |
| 2026-10-05 14:41:10 | 2026-10-05 14:44:18 | `test-engineer` | 1 | REPROVADO | a13be1a0324b1f9eb |
| 2026-10-05 14:41:22 | 2026-10-05 14:44:36 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a25ed3ca6c6509a3a |
| 2026-10-05 14:41:25 | 2026-10-05 14:45:08 | `conformidade-reviewer` | 1 | REPROVADO | a5b886e4b9a143052 |
| 2026-10-05 14:41:19 | 2026-10-05 14:45:48 | `infra-guardian` | 1 | REPROVADO | a0b9d2e2faae2e388 |
| 2026-10-05 14:41:17 | 2026-10-05 14:45:56 | `privacy-guardian` | 1 | REPROVADO | a90f932e360665986 |

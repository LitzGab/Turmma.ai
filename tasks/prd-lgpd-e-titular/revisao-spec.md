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

## Rodada 2 — 05/10/2026

**Veredito: REPROVADA** (convergindo: os bloqueantes da rodada 1 foram atendidos; os novos são pontuais)

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 8 (rate limit da busca; `consumo_ia.provedor`; trava do aluno; check `rotina`; imutabilidade do pedido; RF13b e eliminação; aluno da lista; `no-store`) |
| `tenancy-guardian` | REPROVADO | 2 (leitura de `suboperador`/`incidente` pela escola sem repository declarado; `ACESSO_SUSPENSO` antes da senha) |
| `privacy-guardian` | REPROVADO | 4 (o que entra no arquivo e as colunas proibidas; auditoria da listagem; `ACESSO_SUSPENSO`; caminho real do aluno da lista) |
| `infra-guardian` | REPROVADO | 2 (a chave "escola + noite" não existe no `job_registro`; índice `consumo_ia (escola_id, execucao_id)`) |
| `conformidade-reviewer` | REPROVADO | 2 (prévia e compartilhamento de professor separam quem usou a IA, D64; lista fechada e teste do autor `rotina`) |
| `llm-integrator` | AJUSTES NECESSÁRIOS | 3 (check `NOT VALID` quebra o `UPDATE` de linha antiga; testes do provedor; foto refeita depois de anonimizar) |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 3 (homônimo na prévia; aviso de apagar no download da coordenação; Privacidade do aluno não existe) |

### Correções aplicadas (Tech Spec, PRD e `cenarios.md`)
- 3: `COLUNAS_FORA_DO_ARQUIVO` e o que entra no arquivo por tabela; check de `provedor` com corte fixo; `job_registro.chave_idempotencia`; único de `arquivo_titular`; lista fechada do autor `rotina`, com apelido reservado; tipo da porta une `envioExterno` e `provedorId`
- 4: prévia com `homonimo`; prévia de professor igual para quem usou e quem não usou (D64); `pedidos.listados`; finalidade fixa; `corrigir-nome` com estados e limites; caminho real do aluno da lista; `ACESSO_SUSPENSO` só depois da credencial
- 5: o `Enfileirador` com chave; eliminações e arquivos antes das categorias; janela letiva a cada lote e entre faixas; compartilhamento pelo `SuboperadorDaEscolaRepository`, refeito antes de anonimizar, e de professor só por período; cancelar zera `eliminacao_agendada_em`; etapa 3 com `for update`; o ciclo de vida aceita a transação de quem chama
- 6: `SuboperadorDaEscolaRepository` e `IncidenteDaEscolaRepository` (só leitura), forma da consulta; barrel da `ContaGlobalRepository`
- 7c: índice `consumo_ia (escola_id, execucao_id)`; `EXPLAIN` com volume de Tutor
- 9: aviso de homônimo; aviso de apagar no download da coordenação; Privacidade do aluno criada nesta fatia; textos dos estados
- 13: limite conhecido do nome anterior a uma correção; realtime
- PRD: RF15 ("só se houve troca"); exceção da D64 na versão do professor sem conta ativa; foto do compartilhamento no mapa
- `cenarios.md`: os cenários exigidos pelos sete revisores

## Rodada 3 — 05/10/2026

**Veredito: REPROVADA** (cinco aprovados; dois bloqueantes pontuais em dois revisores)

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `tenancy-guardian` | APROVADO | — |
| `privacy-guardian` | APROVADO | — |
| `conformidade-reviewer` | APROVADO | — |
| `llm-integrator` | APROVADO | — |
| `frontend-reviewer` | APROVADO | — |
| `test-engineer` | REPROVADO | 2 (segundo check de `provedor` sem cenário; janela letiva no meio da troca de nome) |
| `infra-guardian` | REPROVADO | 2 (o check de `provedor` válido na 0024 quebra o código anterior no deploy; texto da janela letiva desalinhado) |

### Correções aplicadas
- 3: a 0024 leva só `provedor is null or envio_externo`; a exigência de `provedor` vai para a contração `0025` (`NOT VALID` e `VALIDATE`), aplicada com o código novo em todas as instâncias; check `chave_idempotencia is null or escola_id is not null`
- 5: colisão da chave devolve o id existente; a troca de nome confere a janela entre faixas e, se ela abrir, termina sem a etapa 3, com o pedido `agendado`; reenfileiramento em 20 h; autor `rotina` só quando quem registrou não é mais usuário ativo; execução `pendente` encerrada pela varredura
- 7b, 7c e PRD seção 6: "fora da versão `coordenacao` de professor sem conta ativa"; a carga não promete reenfileirar
- `cenarios.md`: insert no formato antigo aceito depois da 0024; recusado depois da 0025; janela entre faixas; falha na etapa 3 desfaz tudo; expurgo parcial e noite seguinte; aluno no cenário do provedor sem cadastro; os repositórios da escola só leem

## Rodada 4 — 05/10/2026

**Veredito: REPROVADA** (só `test-engineer` e `infra-guardian` chamados; os dois bloqueantes da rodada 3 foram resolvidos em parte)

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 1 (o autor da etapa 3, quem registrou ou `rotina`, sem cenário) |
| `infra-guardian` | REPROVADO | 1 (a contração do check de `provedor` no mesmo release ainda quebra o rollback, porque o `migrar` aplica tudo antes de as instâncias subirem) |

### Correções aplicadas
- 3: a contração sai do F3 e vai num release posterior, em arquivo próprio, com o corte tirado do registro do deploy e o `drop constraint` no runbook; o cenário da contração sai do `cenarios.md`; `expurgo_execucao.concluida` para o alerta
- 5 e 7c: `on conflict` com o predicado do índice parcial; colisão devolve o id ou nulo; uma chave só, "escola + data local"; o alerta de `agendado` passa a 48 h; `NOT VALID` em arquivo próprio a partir do staging
- `cenarios.md`: o autor da etapa 3 nos dois lados; a chave sem escola recusada; o mesmo id nas duas chamadas

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
| 2026-10-05 14:58:04 | 2026-10-05 14:59:55 | `frontend-reviewer` | 2 | AJUSTES NECESSÁRIOS | acbd7014904d0fecb |
| 2026-10-05 14:57:39 | 2026-10-05 14:59:58 | `test-engineer` | 2 | REPROVADO | a62449459c0f52a6b |
| 2026-10-05 14:58:01 | 2026-10-05 15:00:00 | `llm-integrator` | 2 | AJUSTES NECESSÁRIOS | a41c83096dee7d225 |
| 2026-10-05 14:57:44 | 2026-10-05 15:00:02 | `tenancy-guardian` | 2 | REPROVADO | a46fa838dca723f9d |
| 2026-10-05 14:57:53 | 2026-10-05 15:00:51 | `infra-guardian` | 2 | REPROVADO | a8d745019ca6ade1d |
| 2026-10-05 14:57:48 | 2026-10-05 15:01:02 | `privacy-guardian` | 2 | REPROVADO | a4b86d5626f44a3c0 |
| 2026-10-05 14:57:57 | 2026-10-05 15:01:58 | `conformidade-reviewer` | 2 | REPROVADO | aeb7c9a1f7aec7c52 |
| 2026-10-05 15:12:46 | 2026-10-05 15:14:07 | `tenancy-guardian` | 3 | APROVADO | a56148fa267b57070 |
| 2026-10-05 15:13:03 | 2026-10-05 15:14:08 | `frontend-reviewer` | 3 | APROVADO | a55e61df536312fab |
| 2026-10-05 15:12:42 | 2026-10-05 15:14:14 | `test-engineer` | 3 | REPROVADO | a51c82c06a148f659 |
| 2026-10-05 15:12:56 | 2026-10-05 15:14:19 | `conformidade-reviewer` | 3 | APROVADO | aaf6da52b19576287 |
| 2026-10-05 15:12:49 | 2026-10-05 15:14:34 | `privacy-guardian` | 3 | APROVADO | a9df14b29b445c306 |
| 2026-10-05 15:13:00 | 2026-10-05 15:14:45 | `llm-integrator` | 3 | APROVADO | ac43cbc516bad8c33 |
| 2026-10-05 15:12:53 | 2026-10-05 15:15:13 | `infra-guardian` | 3 | REPROVADO | ad7e2a329c9e41616 |
| 2026-10-05 15:16:04 | 2026-10-05 15:17:05 | `test-engineer` | 4 | REPROVADO | a1028e83462c49214 |
| 2026-10-05 15:16:08 | 2026-10-05 15:18:44 | `infra-guardian` | 4 | REPROVADO | a380fd950e0b9d173 |

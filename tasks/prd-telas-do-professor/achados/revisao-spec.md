# Achados das revisões — `tasks/prd-telas-do-professor/revisao-spec.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-13 02:40:06 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: APROVADO

Tela vista: não. É revisão de spec e ainda não há tela nem fotos. As telas serão vistas na validação, ao lado do mockup (PRD, métrica 3).

Estados: ok. Tech Spec §10 exige, por tela, carregando, vazio, erro e com dado em teste de componente, com o foco depois de cada ação. §7c mostra `EstadoErro` com "Tentar de novo". O sino tem estados próprios: "Tudo em dia", leitura parcial, "100 ou mais" (PRD RF4, §7).

Acessibilidade: ok.
- Axe no e2e de cada tela, nos dois projetos (§10).
- Foco depois de cada ação (§10).
- Nome acessível do sino (tarefa 1.0).
- Texto da pessoa preservado em sessão vencida (§9).
- Contraste vem dos tokens da X1.

Chromebook fraco: ok, com ressalva (recomendações 1 e 2).
- Sem biblioteca nova.
- O sino fica fora da entrada, por `lazy()`, com teto do `size-limit` e pedaços `tela-professor-*` (§7c).
- As leituras por turma saem em série e param na primeira recusa por limite.
- Nenhuma leitura é por tempo (RF5).

Celular: ok.
- RF22 exige 360 px.
- §9 e as tarefas 1, 3, 7 e 9 fixam alvos de 44 px, filtros em diálogo, painel em folha de baixo e barra presa acima da barra da casca.
- Nada depende de hover. O convite não exige celular.
- Os e2e rodam nos dois projetos.

Ação oficial protegida: sim.
- A API segue recusando o lote com destaque fechado (§7b).
- `podeAprovar` libera o botão e o oficial fica na barra presa, nas três abas.
- A versão adaptada continua decidida por `decidir`, na tela do Assistente. O sino só leva até ela e nada se decide nele.
- "Aplicar à turma" continua um ato registrado à parte.

Resposta por item da lista:

| Item | Resposta |
|---|---|
| 1 Quatro estados | Garantido (§10, §7c) |
| 2 Feed nunca vazio | Garantido. O Início sempre tem caixa e atalhos. O vazio do sino é "Tudo em dia", não feed. "Falta uma turma confirmada" só vale sem turma (PRD §7) |
| 3 Seletor de escola | Não se altera: a casca da A1 é mantida. §6 e PRD §7 fazem sino e Criados seguirem a escola ativa |
| 4 Ação oficial | Garantido por manutenção (RF20, §7b) |
| 5 e 5a Máquina fraca e celular | Ver acima |
| 6 Acessibilidade | Garantido |
| 7 Português | Garantido. O teste de vocabulário é estendido aos textos novos (§7b) |
| 8 Erro diz o que fazer | Garantido (§7c, `EstadoErro`) |

Isolamento (regra 10): a chave `pedidos-da-turma` e as outras são esvaziadas por `resetQueries` em `apps/web/src/main.tsx:26`, em toda troca de sessão e de escola. A Tech Spec §6 acrescenta os testes do sino na troca de escola e na segunda pessoa. Dado pessoal: o sino descarta a lista antes do cache, e as leituras nominais ficam com `gcTime: 0` (§7).

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
1. Tech Spec §5/§9: o texto de Criados diz "Ver mais" só nas tarefas (`tasks.md` 5.2). Escreva na Tech Spec que a lista é limitada ou paginada, sem virtualização nova, para atender regra 50 item 1 e regra 80 item 8. Pergunte também se `GET /v1/artefatos` já limita o retorno; não vi `limite` no controller (`apps/api/src/artefato/artefato.controller.ts:27`).
2. §10: acrescente um caso com throttling de rede e de CPU (projeto `chromebook`) para o sino e para Criados. Hoje só o teto de bundle cobre a regra 50 item 1.
3. §6/§7: diga que a chave do sino (contagem) é distinta da chave da lista nominal de pedidos. Com o mesmo `queryKey` e formatos de dado diferentes, a aba Alunos poderia ler o cache só com a contagem.
4. §9: escreva nela os alvos de toque (24 px, 44 px na ação principal) e "sem hover". Hoje isso só está nas tarefas.
5. §12: o limite por usuário das leituras do sino fica não verificado. Reduza o risco: 12 leituras ao abrir a casca, mais 1 na volta do foco, saem para toda aba. Considere agregar a contagem em uma só leitura quando a API permitir.

Arquivos: `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-do-professor/prd.md`, `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-do-professor/techspec.md`.

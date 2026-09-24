# Retrospectiva — apresentacao-operacao (A0)

24/09/2026. Comparação com a retrospectiva do F1 (`tasks/prd-identidade-e-tenancy/retro.md`).

## Medidas

```
Tarefas: 11 · Rodadas de revisor: 60 · Reprovações: 7 (11,7%)
Por revisor: test-engineer 17/3 · revisor-geral 14/2 · privacy-guardian 11/0 · infra-guardian 7/1
             tenancy-guardian 6/0 · frontend-reviewer 5/1 (AJUSTES NECESSÁRIOS)
Rodadas por tarefa: média 5,5, piores 6.0 e 11.0 com 8
Rodadas que caducaram sem reprovação: 6 de 60 (10%) — 6.0 (3), 11.0 (2), 9.0 (1)
Correções fora de tarefa: 3 — duas de esteira em 23/09 (borda com polling sobreposto, porta na faixa
                          efêmera) e uma do /validar (modelo de dados sem as tabelas da operação)
Duração: 23/09 20:42 → 24/09 07:31 (10,8 h) · mediana 1,3 h por tarefa · pior 2,7 h (1.0, com a
         geração das tarefas no meio)
Revisão da spec: 22 rodadas, 17 não aprovadas · test-engineer 9/8 · infra-guardian 4/3 ·
                 privacy-guardian 3/2 · tenancy-guardian 3/2 · frontend-reviewer 3/2
Ressalvas do /validar: rodada 1 (0 críticos, 1 maior) · rodada 2 APROVADA
```

| | F1 | A0 |
|---|---|---|
| Reprovações nas tarefas | 23% | 11,7% |
| Rodadas por tarefa | 10 | 5,5 |
| Caducadas sem reprovação | 31,5% | 10% |
| Reprovação por carimbo | 10 | 1 (5.0) |
| Mediana por tarefa | 3,0 h | 1,3 h |

A proposta 1 do F1 (carimbo e caducidade por conteúdo) fez o que prometia: a maior causa do F1
praticamente sumiu. Tarefas 1, 2, 4, 7, 8 e 9 passaram sem reprovação.

**O custo migrou para a revisão da spec.** Foram 22 rodadas antes da primeira linha de código, e o
`test-engineer` reprovou oito das nove. As rodadas 4 a 7 dele levaram menos de dois minutos cada, e
cada uma achou um buraco novo **na mesma trava** do segundo fator: configurar em duas abas, operador
ativo nas condições, a sessão fora da trava, e o C6b escrito de um jeito impossível de passar. É
sinal de que a trava estava sendo desenhada por partes, na revisão, em vez de por inteiro, na spec.
A rodada 9 (a conferência do mapa de tarefas) terminou REPROVADO e nunca teve rodada APROVADO depois.
O conteúdo foi atendido, mas o registro não fechou.

## Grupos de causa

| Causa | Ocorrências | Tarefas | Onde evitar |
|---|---|---|---|
| Trava de concorrência desenhada por partes | 5 | spec (test-engineer 4ª a 7ª), 5.0 | Tech Spec |
| Limite de taxa declarado sem dizer como cada rota o usa | 3 | spec (infra-guardian 1ª a 3ª) | Tech Spec |
| Divergência que cria regra entra sem o cenário que a prova | 3 bloqueantes | 3.0, 5.0, 6.0 | autoconferência |
| Tela que não recomeça (segunda pessoa na aba, mesma entrada de novo) | 3 bloqueantes + 3 recomendações | 10.0, 11.0 | `N_task.md` |
| Código que refaz peça que já existe | 4 recomendações (e 3 no F1) | 3.0, 4.0, 5.0, 6.0 | autoconferência |
| Linha de log nova sem teste do conteúdo | 3 recomendações | 7.0, 8.0, 9.0 | `N_task.md` |
| Desvio de regra ou de arquitetura sem o documento de referência | 2 | 5.0, `/validar` | Tech Spec e `criar-tasks` |

**Divergência que cria regra.** Na 3.0, os três subcomandos passaram a usar a mesma trava, mas o
`convite` pedido por operador recusado não tinha teste. Um membro desativado conseguiria gerar o token
de convite de um operador ativo. Na 5.0, o `for update` da linha do operador entrou por divergência sem
teste de concorrência. Na 6.0, "vale também para a tentativa segurada" pôs um `INSERT` por requisição
numa rota anônima, sem teto. A lição do F1 ("divergência se registra") foi seguida: as três estavam
registradas. O que faltou foi tratar a divergência como regra nova, com teste e com a pergunta do
guardião.

**Tela que não recomeça.** É a mesma classe da segunda maior causa do F1 (nove achados), cuja proposta
de seção obrigatória na Tech Spec foi recusada. A Tech Spec da A0 descreveu o esvaziamento do cache
entre operadores, mas o teste não o provava (10.0). Na 11.0, o mesmo link colado de novo na aba não
mudava o estado, e a tela ficava presa com o token na barra. A proposta desta vez é mais estreita:
uma linha condicional na tabela de testes, não uma seção em toda spec.

**Desvio sem documento.** O único maior do `/validar` foi o `docs/modelo-de-dados.md` declarando
fechada uma lista de exceções que não tinha as seis tabelas da operação. Na 5.0, o `SessaoModule`
virou global sem registro no `docs/arquitetura.md`. A correção do `/validar` acrescentou um teste que
confere a lista contra as migrations. A proposta 6 cobre o resto.

## Falsos positivos

Nenhum. A reprovação por carimbo da 5.0 foi real: o código mudou depois do portão.

## O que não se tira

Nada. Nenhum item de checklist se mostrou inútil nesta funcionalidade, e regras 10, 20 e 70 não se
afrouxam por retrospectiva.

## Propostas

O Joaquim deixou a escolha comigo ("você decide"; "terminar com o melhor resultado para o projeto").
As seis foram aplicadas, porque cada uma é curta e ataca causa com duas ou mais ocorrências.

1. **Divergência que muda comportamento ganha cenário e a pergunta do guardião antes do código.**
   `.claude/skills/executar-task/SKILL.md`, autoconferência. Aceita.
2. **"Qual peça que já existe faz isto?"** Reaproveitar importando, ou mover para arquivo próprio ou
   para o `nucleo`, nunca copiar. `.claude/skills/executar-task/SKILL.md`, autoconferência. Aceita.
3. **Linha de recomeço da tela** na tabela de testes: segunda pessoa na aba sem reload, a mesma
   entrada de novo e a resposta atrasada da anterior. Só vale em tarefa com tela.
   `.claude/skills/criar-tasks/task-template.md`. Aceita.
4. **Linha "log novo"** na tabela de testes: a linha capturada não leva dado pessoal.
   `.claude/skills/criar-tasks/task-template.md`. Aceita.
5. **Seção 7c da Tech Spec.** Uma linha por trava, com todas as condições de estado, o que fica na
   mesma transação, o que o perdedor recebe e o cenário paralelo. O limite de taxa por rota nova,
   dizendo se recusa ou só rebaixa, com o teste do 429. `.claude/skills/criar-techspec/template.md`.
   Aceita.
6. **Seção 11 da Tech Spec** ganha a coluna "Documento que registra o desvio", e cada desvio vira
   subtarefa de documento. `.claude/skills/criar-techspec/template.md` e
   `.claude/skills/criar-tasks/SKILL.md`. Aceita.

Efeito esperado: as rodadas da revisão da spec sobre trava e limite (7 das 17) passam a ser
respondidas no primeiro texto; as três reprovações por divergência e as três por tela deixam de
acontecer; o `/validar` não acha documento desalinhado com desvio declarado.

## Pendências para a A0b

Recomendações de revisor da A0 que ficaram sem destino. O Joaquim decidiu que viram subtarefas da
A0b: o `/criar-tasks` da A0b lê esta tabela e distribui cada linha pelas tarefas que mexem no mesmo
código. A A0b mexe nos mesmos `ops:*` e na mesma área da web.

| Origem | O que falta | Onde |
|---|---|---|
| 3.0 (tenancy, test-engineer) | nos cinco `ops:*` de escola, o `conferirOperador` roda fora da transação e sem a trava `7_000_002` | `apps/api/src/ops/comando.ts` |
| 4.0 (revisor-geral) | o formato do apelido existe em três lugares | `FORMATO_OPERADOR`, check da migration, check da auditoria |
| 5.0 (tenancy, revisor-geral) | `throw new Error(...)` sem código (regra 00, item 9) | `apps/api/src/operacao/operador.repository.ts` |
| 5.0 (privacy) | o aceite troca a senha e zera o segundo fator sem `AuditoriaOperacao` | `convite-operador.service.ts` |
| 5.0 (revisor-geral) | motivo `convite_aceito`: o aceite não derruba as sessões abertas da conta recuperada | `SessaoOperador.motivo` |
| 5.0 (revisor-geral) | o `SessaoModule` global não está registrado em `docs/arquitetura.md` | doc |
| 6.0 (test-engineer) | nenhum teste prova que a senha certa zera o contador | `entrada.service.ts` |
| 7.0 (test-engineer) e 9.0 (privacy) | o log espaçado `operacao.desafio_sem_redis` sem teste, nem do conteúdo | `desafio-de-operador.ts` |
| 7.0 (revisor-geral) | `contador.zerar` roda depois do commit da sessão | `segundo-fator.service.ts` |
| 8.0 (test-engineer) | renovar e sair em paralelo sem teste | `operador.repository.ts`, `rotacionarSessao` |
| 8.0 (privacy) | nenhum teste confere o conteúdo da linha `operacao.reuso_de_refresh` | `sessao.service.ts` |
| 8.0 (infra) | o `rl:ip` é um balde só para todas as rotas anônimas | `packages/nucleo/src/limite/guarda-limite.ts` |
| 9.0 (infra) | o lote `convite_operador` do expurgo sem `order by` | `expurgo-de-acesso.repository.ts` |
| 9.0 (revisor-geral) | `{} as Record<…>` esconde alvo sem total | `apps/worker/src/processadores/expurgar-acesso.ts` |
| 10.0 (test-engineer) | renovações em paralelo na web; clique duplo em "Entrar" do segundo fator e em "Sair" | `apps/web/src/operacao/api/sessao.ts`, e2e |
| 10.0 e 11.0 (frontend, privacy) | a fronteira de erro sem `document.title`; limpar a senha no estado depois de falha; aceite em andamento durante um `hashchange` | `apps/web/src/rotas.tsx`, `Entrar.tsx`, `Convite.tsx` |
| `/validar` | o e2e semeia o convite por SQL e repete o hash, em vez de `hashDoTokenDeConvite`; o E5 sem o identificador no nome do teste | `e2e/__fixtures__/operacao.ts`, `e2e/casca.spec.ts` |
| `/validar` | a métrica "do convite ao primeiro login com segundo fator em até 3 min" (PRD, seção 9) não é medida | A0b |
| correção de 24/09 (test-engineer, tenancy) | `tabelasSemEscola` só reconhece o DDL que o drizzle gera (`IF NOT EXISTS`, `"public"."x"`, `RENAME`, `DROP COLUMN` passam) | `apps/api/test/arquitetura.test.ts` |

E uma de processo, sem código: a revisão da spec terminou com a rodada 9 do `test-engineer` REPROVADO e
sem rodada APROVADO depois. Na próxima, a conferência do mapa de tarefas roda de novo até aprovar.

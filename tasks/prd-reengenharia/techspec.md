# Tech Spec — Reengenharia (X5)

**PRD:** `tasks/prd-reengenharia/prd.md` · **Status:** rascunho
**Forma (R34, aceite do Joaquim em 21/10/2026):** este arquivo comum tem até 2.000 palavras, e cada onda tem um
`onda-<n>.md` de até 1.500: `onda-0`, `onda-1a`, `onda-1b`, `onda-2`, `onda-3`, `onda-4`, `onda-5` e `onda-6`. A tarefa
lê este arquivo e só a sua onda. As decisões estão em `.reengenharia/DECISOES.md` (R32 a R41).

## 1. Resumo da abordagem

A X5 refatora o sistema em ondas por dependência:
1. o que os outros usam (contratos, travas, fronteiras);
2. a execução e a resiliência;
3. a web, com a rede de teste antes do corte;
4. os testes e a infra, em paralelo às ondas 2 a 4;
5. a documentação.

Cada onda deixa a esteira verde, e a falha preexistente não some sem registro (`LINHA-DE-BASE.md` §5). Comportamento sem
teste ganha um de caracterização num commit anterior ao da mudança. Cada mecanismo nasce com a trava que impede o jeito
antigo de voltar (lint, teste de arquitetura, conferência no boot ou `--check`). Os mecanismos são os T1 a T18 de
`DIAGNOSTICO.md` §3, com a R32, a R33 e a R40.

## 2. Módulos afetados

| Onde | Ondas | O quê |
|---|---|---|
| `packages/shared` | 1B, 2 | registro de rotas, `DEFINICOES_DE_JOB`, subcaminho `servidor`, esquemas do "esperando" |
| `packages/nucleo` | 0 a 3 | `conformidade/`, `entrada/`, `ErroDeInvariante`, subcaminhos, adaptador resiliente |
| `apps/api` | todas | pipe nos 137 handlers, `credencial/`, `sessao/<fluxo>/`, `esperando/`, Command de IA, `main-worker.ts` |
| `apps/worker`, `apps/despachante` | 1B, 3 | validação pela definição, executor no nucleo, prazo, alerta de falha final |
| `apps/web` | 1B a 4 | leitor tolerante, `chamarRota`, `kit/`, `comPrazo`, sessão injetável, `<Leitura>`, os cortes |
| `infra/`, `tools/`, `docs/` | 0 a 6 | `worker-ia` e `worker-pdf`, alertas, travas, helpers únicos, semente, `aia/ouro/`, gerador de documentos, ADRs |
| `.claude/settings.json` | 0 | só a N7. O resto do harness espera a Etapa 9 |

## 3. Modelo de dados

| Migration | Tabela | O quê |
|---|---|---|
| uma (onda 3, 51.0) | `resposta_atividade` | `sequencia bigint not null default 0`, aditiva e compatível com o código anterior (regra 80.9) |

Nenhuma tabela nova. "Interrompida" é `falhou` com `EXECUCAO_INTERROMPIDA` (R39), e a retenção de `falhou` muda no
expurgo, sem schema.

## 4. API

| Método | Rota | Papel | Onda |
|---|---|---|---|
| GET | `/v1/professor/esperando` | professor | 2 (37.0) |
| GET | `/v1/coordenacao/esperando` | coordenação | 2 (38.0) |
| GET | `/v1/escola/roteiro` | coordenação | 2 (39.0) |
| GET | `/v1/turmas` ganha `semProfessor`; `/v1/privacidade/pedidos` ganha `prazo` | os de hoje | 2 |
| POST | o envio de material ganha `substitui` | coordenação | 2 (41.0) |
| PUT | a resposta da prova ganha `sequencia` | aluno | 3 (51.0) |

Comandos de terminal novos: `ops:reprocessar-job` e `ops:descartar-job` (46.0). Erros novos: `RESPOSTA_FORA_DO_CONTRATO`,
só da web (20.0), e `TEMPO_ESGOTADO` do job (43.0).

## 5. Fluxo

**A ordem das ondas.**
1. Onda 0, 1.0 a 5.0.
2. Onda 1A, 6.0 a 17.0, e 1B, 18.0 a 29.0, ao mesmo tempo: o tronco de `shared` corre em série.
3. Onda 2, 30.0 a 41.0.
4. Onda 3, 42.0 a 54.0.
5. Onda 4, 55.0 a 80.0.
6. A onda 5, 81.0 a 91.0, corre ao lado das 2 a 4.
7. A Etapa 9 ⛔ (92.0).
8. A onda 6.
9. O Validador, o apagar de `.reengenharia/` (uma parada) e o pouso.

**As tarefas nascem por onda (R41).** O `tasks.md` lista todas as tarefas, mas o `N_task.md` de uma onda nasce quando a
anterior fecha. Quem o escreve é o Arquiteto, contra o código daquele momento: a onda 2 move pastas, e os caminhos de uma
tarefa escrita antes ficariam errados. O aviso de `estado.ts` ("a N.0 está liberada, mas o documento N_task.md não existe")
é o sinal para o Orquestrador pedir a onda seguinte ao Arquiteto.

**O fecho de uma onda:** a esteira verde no último commit dela, e o Arquiteto atualiza `.reengenharia/MAPA.md` e escreve
os documentos da próxima. Mudança de comportamento fora do PRD é divergência.

**O plano de ondas, com dono e validação:** o dono de cada tarefa é o Implementador, com a Mesa e os vetos da tabela de
cada `onda-<n>.md`; a validação da onda é a seção "Falha" e a de testes do mesmo arquivo. **Os padrões adotados e os
rejeitados** são a coluna "Rejeitado" de `DIAGNOSTICO.md` §3, que vira ADR na onda 6.

## 6. Isolamento

O isolamento só ganha trava, e nenhuma é afrouxada:
- **6.0 a 9.0:** todo repository prova o escopo ou declara a exceção; a tabela só se importa em repository; a IA tira a
  escola do contexto.
- **14.0 a 17.0:** a entrada estrita impede escola no corpo (regra 10.3).
- **12.0 e 30.0 a 35.0:** as camadas e as superfícies de `credencial/` e `sessao/` ficam travadas no depcruise.

**Os testes de isolamento novos.**
- As três portas de IA, com escola A e B (8.0).
- Cada rota do "esperando", com duas escolas e na oráculo `matriz.expectativa.ts` (37.0 a 39.0).
- O `substitui` com um id de outra escola (41.0).
- O worker de IA, com o contexto vindo da linha da execução e nunca do payload (47.0).

O teste "remova a cláusula e veja quebrar" (regra 10.5) vale para cada um.

## 7. Dado pessoal

| Item | Resposta |
|---|---|
| Campos e `docs/lgpd.md` | duas linhas novas: `job_registro`, só ids, 7 dias o concluído e 30 o que falhou (44.0); o pendente da prova no navegador, até o envio ou o fim da sessão (53.0). Mais o PDF temporário no storage (45.0) |
| O que vai para log | só id. Erro de entrada sem `issues` (14.0), `reportarFalha` sem mensagem nem pilha (56.0) |
| Auditoria | `ops:reprocessar-job` e `ops:descartar-job` (46.0), `material.substituido` (41.0) |
| Envio externo | nenhum novo. A D62 passa a bloquear a subida (50.0) |
| Autorização e DTO | a `MATRIZ` e o escopo do repository; `.strict()`, sem nome de aluno no "esperando" |

## 7b. Conformidade CNE

- **RF1 (D36) e RF2 (D55)** deixam a regra mais estrita. O corpus `ouro` (R38) é escrito pelo Arquiteto com o
  `conformidade-reviewer`, e o Implementador não o altera (29.0).
- **A aprovação humana** e a autonomia dos agentes não mudam.
- **O Tutor continua supervisionado** (D47). Muda onde ele roda (onda 3), e a avaliação aberta se confere também na
  execução e na conclusão.
- **O `conformidade-reviewer` revisa** toda tarefa de política, de Tutor, de Aprovar e de prazo legal.
- **Fica fora (R40):** a saída do Tutor sob a D55 e a leitura humana do `ouro` (`TODO.md`).

## 7c. Carga e falha

| Item | Resposta |
|---|---|
| Caminho quente | Tutor (onda 3), prova (51.0, 53.0), login (16.0, 54.0) e fila (18.0, 19.0, 43.0) |
| Manhã de segunda | ~45 turnos de Tutor às 10h (`docs/infra.md` §3.2), na fila interativa, com 2 réplicas × 25 |
| Fila e prioridade | Tutor: interativa. Analista: normal. PDF: lote, em réplica própria |
| Limite por escola | a vaga da fila continua, e as 2 execuções de IA por escola também (R39) |
| Rate limit | o teto de tokens por minuto é 80 % do contratado (49.0) |
| Corridas | o envio da prova fora de ordem (`where excluded.sequencia > sequencia`, 51.0); a troca de material (update condicionado na transação, 41.0); o job duplicado (chave `execucaoId`, 47.0) |
| Índices novos | nenhum previsto: o `EXPLAIN` do "esperando" se confere na 37.0 e na 38.0 |
| Quando algo cai | provedor de IA: aviso em menos de 1 s, e a troca não conta. Redis de fila: o segundo fator dá 503 sem gastar tentativa. Rede da escola: "Tentar de novo", e a prova volta depois do F5 |
| Métrica e alerta | `job.falhos{tipo}`, "Provedor de IA fora" e "Tokens acima de 80 %", cada um com parágrafo no runbook |
| Cenário de carga | `infra/k6/justica-entre-escolas.js` mede o turno antes (42.0) e depois (47.0), e `carga:login` mede a N2 (88.0) |

## 8. Uso de IA

Nenhum caso de uso novo, nenhum perfil novo e nenhum prompt alterado: se a 3.0 tocar o prompt, sobe a versão (regra
30.6). Muda onde a IA roda (onda 3) e a resiliência do adaptador (48.0, 49.0). O custo por aluno não muda: a 5xx deixa
de se repetir, o que tende a baixá-lo. O `llm-integrator` revisa da 42.0 à 50.0.

## 9. Frontend

O comportamento é igual, salvo "Tentar de novo" quando a rede pende (52.0), a tela de erro na falha de render (56.0) e
"há uma versão nova" (20.0); o resto está em `onda-4.md`. O prazo do cliente não usa `AbortSignal.timeout` nem `any`
(alvo `chrome99`), e o sino cai de até 14 chamadas para 1. Nenhum corte mexe na casca, que é a dona da altura, e o
`paginaNaoRola` entra nos testes de toda tarefa de tela.

## 10. Testes

| Camada | O que prova |
|---|---|
| Unidade | políticas com mutação e metamórficos, catraca, analisador de repositories, leitor tolerante, `comPrazo`, componentes da onda 4 |
| Integração | entrada inválida em toda rota, registro × rotas montadas, job inválido, "esperando", `substitui` concorrente, S12, `sequencia` |
| E2E | os da regra 40 seguem verdes; o F5 com pendente; cada tela cortada, nos dois projetos |
| Isolamento | os da §6 |
| Falha | um por mecanismo: os de `onda-3.md` §3 e `onda-5.md` §3 |

**As mutações.** Cada cláusula nova leva a sua no `N_task.md`. Uma refatoração pura declara as mutações dos testes de
caracterização que ela precisa manter vermelhos.

## 11. Conformidade com as regras

| Regra | Como se cumpre | Desvio | Onde fica registrado |
|---|---|---|---|
| 00, 10, 20, 30, 50, 70 | camadas (12.0), erro tipado (25.0), fila (onda 3), §6, §7, §7b; Chrome 99 e celular | — | `docs/lgpd.md` na 44.0 e na 53.0 |
| 40 | caracterização antes do corte, mutação por cláusula, nenhum teste removido sem dizer o que continua protegendo | tarefas acima de 20 (R41) | `DECISOES.md` R41 |
| 80 | §7c | a 80.5 diz Redis, e a sessão está no Postgres: se a 88.0 provar o limite, o texto muda na Etapa 9 | `DECISOES.md` R40, N2 |
| Missão | dependências novas: `dependency-cruiser`, `cockatiel` e `knip` | três, e não duas | R33 (N9) e R40 |
| `.claude/` antes da Etapa 9 | só a N7 | `executar-task/SKILL.md` cita caminho que a 33.0 move | lista da 92.0 |

## 12. Premissas não verificadas

- ⚠️ O Nest 12 guarda `schema` por parâmetro (`ROUTE_ARGS_METADATA`). A 14.0 prova com um controller sintético.
- ⚠️ O `z.toJSONSchema` cobre os `union` de hoje. A 21.0 confere.
- ⚠️ O exit 2 do hook bloqueia a ferramenta no Claude Code. A 5.0 prova numa sessão de teste.
- ⚠️ O compose da esteira ativa o profile do serviço nomeado. A 91.0 prova antes de mudar.
- ⚠️ A latência a mais do Tutor na fila fica entre 20 e 500 ms. A 47.0 mede.

## 13. Riscos técnicos

| Risco | O que fazer |
|---|---|
| O tronco da onda 2 (30.0 a 35.0) segura o paralelo | uma tarefa move uma coisa só, com a busca pelo nome antigo no `N_task.md` |
| A IA fora do processo (47.0) erra sob carga | a 45.0 estreia o worker pelo PDF, e a 47.0 só fecha com o k6 e o `kill -9` |
| 91 tarefas antes da Etapa 9 | linhas em paralelo, e um `N_task.md` por onda limita o erro de desenho |
| O corte da web muda a tela sem querer | caracterização, e2e à mão e foto antes e depois (`onda-4.md` §2.2) |
| A catraca pega quem só moveu o arquivo | `--prune-suppressions` na mesma tarefa, com o teto igual |

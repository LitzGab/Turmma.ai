# Tech Spec — Reengenharia (X5)

**PRD:** `tasks/prd-reengenharia/prd.md` · **Status:** implementada em 23/10/2026 (rascunho até a aprovação da spec na 5ª rodada, `7fac74f`, em 21/10/2026)
**Forma (R34, aceite do Joaquim em 21/10/2026):** este arquivo comum tem até 2.000 palavras, e cada onda tem um
`onda-<n>.md` de até 1.500: `onda-0`, `onda-1a`, `onda-1b`, `onda-2`, `onda-3a`, `onda-3b`, `onda-3c`, `onda-4a`,
`onda-4b` (a 3 e a 4 partidas na revisão, R42), `onda-5` e `onda-6`. A tarefa lê este arquivo e a sua onda. As decisões: `tasks/prd-reengenharia/DECISOES.md`
(R32 a R42).

> **Recorte de 22/10/2026 (D81).** Vale por cima deste documento e dos `onda-<n>.md`: a X5 fica com as 32 tarefas do
> `tasks.md`, e o resto vai para a X6 (`prd.md` §11). O desenho muda em três pontos: a entrada HTTP pelo
> `ZodValidationPipe` e pelo `IdPipe`, com a trava no ESLint (`onda-1a.md` T1, reescrita); o registro de rotas e o
> OpenAPI derivado (T2, `onda-1b.md`) e a documentação gerada (T18, `onda-6.md`) saem; e a pasta segue uma por recurso,
> com o kit da web em `componentes/ui/` (no lugar de `kit/`). Peça técnica tem o nome do framework, em inglês.

## 1. Resumo da abordagem

A X5 refatora em ondas por dependência: o que os outros usam (contratos, travas, fronteiras), a execução e a
resiliência, a web com a rede de teste antes do corte, os testes e a infra ao lado, e a documentação.

Cada onda deixa a esteira verde, e a falha preexistente não some sem registro (`LINHA-DE-BASE.md` §5). Comportamento sem
teste ganha caracterização num commit anterior, e cada mecanismo nasce com a trava que impede o jeito antigo de voltar. Os mecanismos são os T1 a T18 de
`DIAGNOSTICO.md` §3, com a R32, a R33 e a R40.

## 2. Módulos afetados

| Onde | Ondas | O quê |
|---|---|---|
| `packages/shared`, `packages/nucleo` | 0 a 3 | rotas, `DEFINICOES_DE_JOB`, subcaminhos, `conformidade/`, `entrada/`, adaptador resiliente |
| `apps/api` | todas | pipe, `credencial/`, `sessao/`, `esperando/`, Command de IA, `main-worker.ts` |
| `apps/worker`, `apps/despachante` | 1B, 3 | validação, executor, prazo, alerta |
| `apps/web` | 1B a 4 | leitor tolerante, `kit/`, `comPrazo`, sessão injetável, `<Leitura>`, cortes |
| `infra/`, `tools/`, `docs/` | 0 a 6 | workers, alertas, travas, helpers, semente, `aia/ouro/`, gerador, ADRs |
| `.claude/settings.json` | 0 | só a N7 |

## 3. Modelo de dados

| Migration | Tabela | O quê |
|---|---|---|
| 44.0 | `job_registro` | índice parcial `job_registro_falhos_idx (tipo) where estado = 'falhou'`, só para a medição `job.falhos{tipo}` (0038) |
| 45.0 | `material` | `processado_em` e `objeto_apagado_em`, nulas, com índice parcial `where objeto_apagado_em is null` |
| 47.0 | `job_registro`, `configuracao_operacional` | os checks de fila aceitam `ferramenta` |
| 51.0 | `resposta_atividade` | `sequencia bigint not null default 0` |

Todas aditivas e compatíveis com o código anterior (regra 80.9). Nenhuma tabela nova. "Interrompida" é `falhou` com `EXECUCAO_INTERROMPIDA` (R39), e a retenção de `falhou` muda no
expurgo, sem coluna nova (44.0: só o índice acima, que a medição pede).

## 4. API

| Método | Rota | Papel | Onda |
|---|---|---|---|
| GET | `/v1/professor/esperando` | professor | 2 (37.0) |
| GET | `/v1/coordenacao/esperando` | coordenação | 2 (38.0) |
| GET | `/v1/escola/roteiro` | coordenação | 2 (39.0) |
| GET | `/v1/turmas` ganha `semProfessor`; `/v1/privacidade/pedidos` ganha `prazo` | os de hoje | 2 |
| POST | o envio de material ganha `substitui` | coordenação | 2 (41.0) |
| PUT | a resposta da prova ganha `sequencia` | aluno | 3 (51.0) |

Comandos novos: `ops:jobs-que-falharam`, `ops:reprocessar-job` e `ops:descartar-job`, com as ações `job.reprocessado` e
`job.descartado` (46.0). Job novo: `sistema.varrer-temporarios-de-material` (45.0). Fila nova: `ferramenta` (47.0).
Variáveis novas, com os padrões nas ondas 3A a 3C: `VAGAS_ESCOLA_FERRAMENTA`, `WORKER_IA_POOL_*`,
`WORKER_IA_BANCO_POOL_MAXIMO`, `WORKER_PDF_BANCO_POOL_MAXIMO`, `IA_LATENCIA_FALSA_MS_PADRAO`, `IA_REPLICAS` (≥ 1),
`LLM_TIMEOUT_MS_*`, `LLM_TOKENS_POR_MINUTO` e `LLM_MODELO_MENOR_<PERFIL>`. Mudam `VAGAS_ESCOLA_INTERATIVA` (5 → 10) e `POSTGRES_CONEXOES_MAXIMAS`
(250 → 300); saem `IA_EXECUCOES_POR_ESCOLA`, `IA_EXECUCOES_TOTAL` e `IA_EXECUCAO_TIMEOUT_MS`. Erros novos: `RESPOSTA_FORA_DO_CONTRATO`,
só da web (20.0), e `TEMPO_ESGOTADO` do job (43.0).

## 5. Fluxo

**A ordem das ondas:** 0 (1.0 a 5.0); 1A (6.0 a 17.0) e 1B (18.0 a 29.0) juntas, com o tronco de `shared` em série;
2 (30.0 a 41.0); 3 (42.0 a 54.0); 4 (55.0 a 80.0); a 5 (81.0 a 91.0) ao lado das 2 a 4; a Etapa 9 ⛔ (92.0); a 6; o
Validador; o apagar da pasta temporária da missão, com o que importa em `tasks/prd-reengenharia/` (R64); e o pouso.

**As tarefas nascem por onda (R41).** O `tasks.md` lista todas, e o `N_task.md` de uma onda nasce quando a anterior
fecha, contra o código daquele momento (a onda 2 move pastas). O aviso "o documento N_task.md não existe" do `estado.ts`
é o sinal para o Orquestrador pedir a onda seguinte.

**O fecho de uma onda:** a esteira verde no último commit dela, e o Arquiteto atualizava o `MAPA.md` da missão (apagado na R64; lido na tag `reengenharia/temporario`) e escreve
os documentos da próxima. Mudança de comportamento fora do PRD é divergência.

**Dono e validação:** o Implementador, com a Mesa e os vetos de cada `onda-<n>.md`; valida a onda o seu "Falha" e os
seus testes. Os padrões rejeitados (`DIAGNOSTICO.md` §3) viram ADR na onda 6.

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
- Os workers: a escola vem de `job_registro.escola_id`, e um `execucaoId` (47.0) ou `materialId` (45.0) de outra
  escola não roda nada.
- O expurgo do PDF e a varredura do órfão (45.0): com duas escolas, cada `apagar` roda em `executarNoContexto` da escola
  dona, e a chave do objeto só se monta com a escola do contexto.

Cada um quebra sem a cláusula (regra 10.5).

## 7. Dado pessoal

| Item | Resposta |
|---|---|
| Campos e `docs/lgpd.md` | duas linhas novas: `job_registro`, só ids, 7 dias o concluído e 30 o que falhou (44.0); o pendente da prova no navegador, até o envio, o "Sair", a troca de dono da sessão ou o fechamento da aba (53.0). Mais o PDF no storage até a extração, com o órfão apagado em até 25 h (45.0, `onda-3b.md`) |
| O que vai para log | só id. Erro de entrada sem `issues` (14.0), `reportarFalha` sem mensagem nem pilha (56.0) |
| Auditoria | `ops:reprocessar-job` e `ops:descartar-job` (46.0), `material.substituido` (41.0) |
| Envio externo | nenhum novo. A D62 passa a bloquear a subida (50.0) |
| Autorização e DTO | a `MATRIZ` e o escopo do repository; `.strict()`, sem nome de aluno no "esperando" |

## 7b. Conformidade CNE

- **RF1 (D36) e RF2 (D55)** apertam a regra, medidas contra o `ouro` (R38), com o alvo de `onda-0.md` e o selo desde a 1.0.
- **A aprovação humana** e a autonomia não mudam. O Tutor segue supervisionado (D47), e no `concluir` o encaminhamento
  da D36 é gravado mesmo com a avaliação aberta ou a saída descartada.
- **O `conformidade-reviewer` revisa** toda tarefa de política, Tutor, Aprovar, "esperando" e prazo legal.
- **Fica fora (`TODO.md`):** a saída do Tutor sob a D55, a leitura humana do `ouro` e a ameaça a terceiro.

## 7c. Carga e falha

| Item | Resposta |
|---|---|
| Caminho quente | Tutor (onda 3), prova (51.0, 53.0), login (16.0, 54.0) e fila (18.0, 19.0, 43.0) |
| Manhã de segunda | 45 turnos de Tutor, 12 ferramentas (27 no pior caso) e 2 do Analista às 10h; uma réplica segura o nominal, e duas o pior caso (conta em `onda-3a.md`) |
| Fila e prioridade | Tutor: `interativa`, corte em 20 s. Ferramentas do professor: `ferramenta`, fila própria. Analista: normal. PDF: lote, `naoUrgente: false`, em réplica própria |
| Limite por escola | a vaga do despachante, uma por fila e escola, compartilhada entre réplicas: 10 da `interativa` (era 5) e 4 da `ferramenta`; o professor nunca ocupa a do Tutor (R42) |
| Rate limit | tokens por minuto a 80 % do contratado (49.0) |
| Corridas | a prova fora de ordem (`sequencia`, 51.0), a troca de material (update condicionado, 41.0), o job duplicado (`execucaoId`, 47.0) |
| Índices novos | o parcial de `job_registro` dos `falhou` (44.0, `EXPLAIN` da medição e do expurgo conferidos); o parcial de `material` (45.0); o `EXPLAIN` do "esperando" se confere (37.0, 38.0) |
| Quando algo cai | IA fora: aviso, sem gastar a troca. Redis de fila: 503 no segundo fator, sem gastar tentativa. Rede: "Tentar de novo"; a prova volta depois do F5 |
| Métrica e alerta | `job.falhos{tipo}` (44.0: só o tipo, teto de 10.000 por tipo; o painel "Jobs que falharam de vez, por tipo" e o alerta "Job que falhou de vez", aceso enquanto houver linha do tipo), "Provedor de IA fora", "Tokens acima de 80 %", cada um no runbook |
| Cenário de carga | a `FASE=sala` do `justica-entre-escolas.js`, com latência por perfil, antes e depois (47.0); `carga:login`, a N2 (88.0) |

## 8. Uso de IA

Nenhum caso de uso, perfil ou prompt novo. A 42.0 fixa as mensagens montadas e o hash do prompt contra a `versao`
(regra 30.6). **Custo:** a RF2 soma até 8 chamadas `rapido` por
professor por mês (premissa: 150 pedidos × 5 % barrados × ~2.000 tokens = ~16 mil), de R$ 0,02 a 0,06: o §2 de
`docs/avaliacao-de-modelos.md` dá R$ 0,75 a 2,40 por 650 mil tokens do Tutor, ou R$ 1,15 a 3,70 por milhão, nos modelos
pequenos que o `rapido` usa (R$ 0,12 em 2027); o `padrao` não ganha chamada, e a RF1 e o fim da repetição do 5xx tiram
chamadas. A 3.0 mede os 5 % no `ouro`. O `llm-integrator` revisa da 42.0 à 50.0.

## 9. Frontend

O comportamento é igual, salvo "Tentar de novo" quando a rede pende (52.0), o aviso da aba que perde a corrida da prova
(51.0), a tela de erro na falha de render (56.0) e "há uma versão nova" (20.0); o resto está em `onda-4a.md` e `onda-4b.md`. O sino cai de até 14 chamadas para 1. Nenhum corte mexe na casca, que é a dona da altura, e o
`paginaNaoRola` entra nos testes de toda tarefa de tela.

## 10. Testes

Cada onda lista os seus testes por camada, e o seu §3 dá um teste de falha por mecanismo; o isolamento está no §6, e os
e2e da regra 40 seguem todos. Cada cláusula nova leva a sua mutação no `N_task.md`, e a refatoração pura declara as da
caracterização.

## 11. Conformidade com as regras

| Regra | Como se cumpre | Desvio | Onde fica registrado |
|---|---|---|---|
| 00, 10, 20, 30, 50, 70 | camadas (12.0), erro tipado (25.0), fila (onda 3), §6, §7, §7b; Chrome 99 e celular | — | `docs/lgpd.md` na 44.0 e na 53.0 |
| 40 | caracterização antes, mutação por cláusula, teste removido diz o que continua protegendo | mais de 20 tarefas | R41 |
| 80 | §7c | a 80.5 diz Redis e a sessão está no Postgres: com o limite da 88.0, o texto muda na Etapa 9 | R40, N2 |
| Missão | dependências novas: `dependency-cruiser`, `cockatiel` e `knip` | três, e não duas | R33 (N9) e R40 |
| `.claude/` antes da Etapa 9 | só a N7 | `executar-task/SKILL.md` cita caminho que a 33.0 move | lista da 92.0 |

## 12. Premissas não verificadas

- ⚠️ O Nest 12 guarda `schema` por parâmetro. A 14.0 prova com um controller sintético.
- ⚠️ O `z.toJSONSchema` cobre os `union` de hoje. A 21.0 confere.
- ⚠️ O exit 2 do hook bloqueia a ferramenta no Claude Code. A 5.0 prova numa sessão de teste.
- ⚠️ O compose da esteira ativa o profile do serviço nomeado. A 91.0 prova.
- ⚠️ O bucket de produção não tem versionamento, ou o objeto apagado sobrevive. Confere-se no staging (D42; `onda-3b.md`).
- ⚠️ A latência a mais do Tutor na fila fica entre 20 e 500 ms. A 47.0 mede.

## 13. Riscos técnicos

| Risco | O que fazer |
|---|---|
| O tronco da onda 2 (30.0 a 35.0) segura o paralelo | uma tarefa move uma coisa só |
| A IA fora do processo (47.0) erra sob carga | a 45.0 estreia o worker pelo PDF, e a 47.0 só fecha com o k6 e o `kill -9` |
| 91 tarefas antes da Etapa 9 | linhas em paralelo, e um `N_task.md` por onda limita o erro de desenho |
| O corte da web muda a tela sem querer | caracterização, e2e e foto antes e depois (`onda-4a.md` §2.2) |
| A catraca pega quem só moveu o arquivo | `--prune-suppressions` na mesma tarefa |

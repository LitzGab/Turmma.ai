# PRD — Reengenharia (X5)

**Status:** aprovado (Joaquim, 21/10/2026, no terminal do Arquiteto)
**Funcionalidade do roadmap:** X5
**Depende de:** X3 (concluída). A X4 fica congelada até esta pousar.
**Teto:** ~2.270 palavras (2.065 sem as barras das tabelas), acima das 2.000: são seis ondas numa spec só (RESPOSTAS 3),
com 33 requisitos. Partir o PRD por onda separaria os requisitos transversais dos que eles protegem.

A missão e o que vale sobre ela estão em `.reengenharia/MISSAO.md` e `RESPOSTAS.md`; o diagnóstico (temas T1 a T18), em
`DIAGNOSTICO.md`; as decisões, em `DECISOES.md` (R1 a R37; as P e as N respondidas em 21/10 são a R32 e a R33).

## 1. Problema

Quem mantém o Turmma (o Joaquim, o Gabriel e os agentes, que recomeçam cada tarefa sem memória) lê uma tela de 300
linhas inteira para mudar uma linha, e a trava de tenant depende de lembrar de chamá-la (25 de 71 repositories não a
chamam). Para a escola, o risco é a manhã de segunda: a IA roda no processo da API, a web não tem prazo de rede, a
escolha de prova se perde no F5, e um job que falhou de vez some em 7 dias sem avisar.

## 2. Objetivo

O sistema fica legível sem a IA que o escreveu, cresce estendendo pontos claros, tem isolamento, conformidade e forma
verificados por máquina, e cada falha conhecida fica contida, visível e recuperável, sem a escola ver outra mudança.

## 3. Fora de escopo

- Trocar peça de stack (D16) ou mudar decisão D1 a D80 (RESPOSTAS 2)
- RLS (P5), unificar a sessão do operador (P4), apagar realtime ou pgvector (P7)
- O que a R24 a R28 deixaram fora (teto de IA fora do Tutor, telemetria do navegador, gatilho de auditoria, staging,
  backup e rollback)
- `.claude/`, `tools/processo/` e as regras antes da Etapa 9 ⛔, salvo a N7. As tarefas da Etapa 9 nascem depois dela
  (R36)
- `mockups/`, as decisões de `docs/` e o histórico de `tasks/` das specs fechadas

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Aluno | recuperar a escolha de prova depois do F5; tentar de novo o segundo fator com o Redis fora | ver a escolha pendente de outro aluno no computador compartilhado |
| Professor | receber o sinal de risco à vida nas frases novas, sem conteúdo | receber julgamento de IA sobre discursiva ou redação (D55) |
| Coordenação | ver o painel e o sino de uma leitura pronta | ver nome de aluno no "esperando" |
| Operador Turmma | receber alerta de job que falhou de vez, reprocessar ou descartar pelo terminal | ver dado de pessoa (D76) |

## 5. Requisitos funcionais

**Antes da onda 1** (DIAGNOSTICO §4, R35)

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | Frase de risco à vida que hoje escapa ("me jogar", "melhor sem mim", "sumir", as do corpus `ouro`) recebe a mensagem fixa com o CVV e o sinal ao professor (D36, N11) | Recall no `ouro` medido antes e depois, sem cair |
| RF2 | Saída de IA que julga texto de aluno em discursiva ou redação é barrada também quando é qualitativa, além de nota, conceito e pontuação (D55, N11) | Amostras qualitativas do `ouro` barradas; falsos positivos medidos |
| RF3 | Se uma avaliação da turma abre entre o pedido do aluno e a execução, o Tutor não responde e a troca não conta (S12) | Teste com a avaliação abrindo entre as duas fases |
| RF4 | O hook de commit bloqueia quando não consegue carregar (N7) | Import quebrado no hook: commit recusado |

**Onda 1 — contratos e travas**

| # | Requisito | Como se prova |
|---|---|---|
| RF5 | Toda rota que recebe corpo, consulta ou id valida a entrada por esquema declarado; a API não sobe com rota sem esquema (P2) | Subida falha com rota sem esquema; entrada inválida tem o mesmo erro tipado em toda rota |
| RF6 | As rotas são um contrato só, lido pela API e pela web, e o OpenAPI é gerado dele (P3) | Rota montada fora do registro, ou divergente, falha a esteira |
| RF7 | A web aceita campo que não conhece; resposta que quebra o contrato mostra "há uma versão nova", sem repetir sem fim (P6) | Teste do cliente com campo extra e com campo obrigatório ausente |
| RF8 | Todo tipo de job declara fila, esquema, retentativa, prazo e escopo; dado inválido é recusado ao enfileirar e no worker | Tipo sem declaração não compila; payload inválido recusado nos dois lados |
| RF9 | Todo repository prova o escopo de tenant ou declara a exceção com motivo; só repository importa tabela; os três da IA tiram a escola do contexto | Repository novo sem escopo nem exceção falha a esteira |
| RF10 | A direção `shared ← nucleo ← apps` e as camadas da API ficam travadas por ferramenta, sem ciclo (N9) | Os 3 ciclos somem; import contra a direção ou ciclo novo falha a esteira |
| RF11 | O lint barra complexidade acima de 10, função com mais de 80 linhas e aninhamento acima de 4, com catraca: supressão de hoje pode sair, nova não entra (R37) | Supressão nova ou função nova acima do limite falha o lint |
| RF12 | Cada regra de conformidade em padrão de texto (risco à vida, assunto delicado, pedido de resposta, D55) fica num lugar só, com corpus `dev`, do autor, e `ouro`, de outro papel, que a tarefa que muda o padrão não altera (P8) | Tirar qualquer padrão deixa uma amostra vermelha; mudar o `ouro` junto com o padrão é recusado |
| RF13 | Dependência usada é declarada no pacote que a usa, sem sobra; erro de domínio é sempre tipado | knip e lint de `throw` limpos |

**Onda 2 — fronteiras**

| # | Requisito | Como se prova |
|---|---|---|
| RF14 | As pastas seguem a P10 (R32), com o comportamento igual | Suíte verde; nenhum import no caminho antigo |
| RF15 | O sino e o "esperando" de cada papel vêm de uma leitura pronta do servidor, sem nome de aluno; "turma sem professor", "escola montada" e o prazo de 15 dias do titular só existem na API; a troca do material que falhou é atômica (N6) | Teste de contrato de cada leitura; uma chamada do sino por papel |

**Onda 3 — execução e resiliência**

| # | Requisito | Como se prova |
|---|---|---|
| RF16 | IA e extração de PDF rodam no worker; nenhuma requisição da API espera modelo nem PDF (P1) | Turno do Tutor e ingestão passam pela fila certa; o p95 do turno no k6 piora no máximo 1 s |
| RF17 | Todo job tem prazo pelo tipo; execução de IA interrompida termina `interrompida` e não roda de novo sozinha | Teste com worker morto no meio e com prazo estourado |
| RF18 | Job que falhou de vez dispara alerta com runbook, fica 30 dias ou até ser reprocessado ou descartado, e se reprocessa por comando de terminal (N1) | Testes do alerta, do comando e do expurgo; `docs/lgpd.md` atualizado |
| RF19 | Provedor de IA lento, recusando por limite ou fora não derruba a aula: prazo, retentativa só no idempotente, disjuntor, tokens por minuto e a degradação da regra 80.4, sem erro cru ao aluno (N9) | Um teste de falha por caso: lento, 429, fora |
| RF20 | A API não sobe com o Tutor ligado sem provedor declarado com processamento no Brasil; o falso e o local contam como locais (D62, N10) | Teste de subida com provedor sem a declaração |
| RF21 | Na prova, envio atrasado não sobrescreve resposta mais nova; a escolha pendente sobrevive ao F5, só com ids, e é limpa no envio e na troca de sessão; envio pendurado não trava os outros (N5) | Testes de reenvio fora de ordem, F5 com pendente e troca de sessão |
| RF22 | Com o Redis de fila fora, segundo fator e escolha de escola respondem "indisponível, tente de novo", sem gastar tentativa (N3) | Teste com o Redis fora |

**Onda 4 — web, rede primeiro**

| # | Requisito | Como se prova |
|---|---|---|
| RF23 | Os testes de componente de Aprovar, Time, Tutor e Atividade existem antes de a tela ser partida | O commit do teste antecede o do corte |
| RF24 | `apps/web` com ramos ≥ 85 %, cada pasta (base, aluno, professor, coordenação, operação) ≥ 80 %, e nenhuma função de tela acima de 80 linhas (R19, N4) | Medido como em `LINHA-DE-BASE.md` §2 e §3 |
| RF25 | Toda chamada da web tem prazo, que termina em "tentar de novo"; falha de render na raiz mostra tela de erro, não página branca | Testes com rede pendurada e com componente que lança |
| RF26 | As ~60 linhas literais entre a entrada do operador e a da escola existem uma vez, sem juntar as sessões (R18) | jscpd sem o clone; testes do operador verdes |

**Onda 5 — testes e infra**

| # | Requisito | Como se prova |
|---|---|---|
| RF27 | O e2e cria escola por uma fábrica e semeia por caminho tipado; helper usado em mais de um lugar existe uma vez; toda espera da infra de teste tem prazo | Lint recusa helper copiado; a duplicação de teste cai |
| RF28 | São medidos o tempo por arquivo do infra, o p95 da leitura de sessão no k6 (N2) e o custo da rede lenta no e2e (N8); o que depender deles volta ao Joaquim | Números no relatório |
| RF29 | Um Dockerfile para as apps; e2e sem observabilidade; realtime atrás de profile (P7) | Esteira verde; imagens medidas antes e depois |

**Onda 6 — documentação**

| # | Requisito | Como se prova |
|---|---|---|
| RF30 | Os quadros de rotas, tabelas, filas, jobs e exceções de escopo são gerados do código, e a esteira recusa quadro velho | `--check` vermelho com quadro velho |
| RF31 | A documentação oficial responde às oito perguntas da Etapa 11 da missão, e `.reengenharia/` sai sem perder nada necessário | Leitura do Validador contra as oito |

**Transversal**

| # | Requisito | Como se prova |
|---|---|---|
| RF32 | Cada onda fecha com a suíte verde (ou com as falhas da linha de base inalteradas), e os e2e obrigatórios da regra 40 e as invariantes das regras 10 e 70 seguem provados | Esteira verde no último commit; nenhum deles enfraquecido sem justificativa |
| RF33 | O relatório final compara com a linha de base só o que foi medido, e diz o que ficou pendente | Relatório contra `LINHA-DE-BASE.md` §5 |

## 6. Regras de negócio

- Mudança funcional só com defeito ou requisito deste PRD; dependência nova, só as duas da N9
- A trava de tenant soma ao escopo no repository, não o substitui (regra 10)
- A conferência de conformidade continua determinística, sem modelo na entrada (D36, D62)
- Teste removido diz o que continua protegendo; expectativa não muda só para passar (regra 40)

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| O professor abre a prova com a dúvida de um aluno na fila | O Tutor não responde, e a troca não conta |
| A rede cai na prova, e o aluno aperta F5 | A escolha volta e sai quando a rede volta |
| O worker morre com um turno do Tutor rodando | `interrompida`; o aluno pergunta de novo |
| A eliminação de um menor falha cinco vezes | Alerta ao operador; o rastro fica até ele agir |
| "Tô triste" (delicado, não risco à vida) | Como hoje: orientação, sem CVV |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Já está em `docs/lgpd.md`? |
|---|---|---|---|---|
| Job que falhou de vez (payload só com ids) | aluno, professor | o operador ver e reprocessar a falha, inclusive de pedido do titular | 30 dias ou até reprocessar ou descartar (hoje 7); o de `titular.eliminar` só sai com a ação do operador | não; entra na tarefa (RF18) |
| Escolha pendente no `sessionStorage` (ids de atividade, questão, alternativa) | aluno | não perder resposta (regra 80.6) | até o envio, o "Sair", a troca de dono da sessão ou o fechamento da aba | não; entra na tarefa (RF21) |
| PDF do material, guardado até a extração (hoje não é guardado) | coordenação, licenciante | a extração rodar no worker (RF16) | até a extração terminar, com teto para o órfão | não; entra na tarefa (RF16) |
| Corpus `ouro` | nenhum (sintético) | medir as políticas da regra 70 | permanente, em `docs/aia/` | não se aplica |

## 8b. Risco regulatório

RF1 e RF2 tocam Tutor e correção (alto risco). A aprovação humana não muda, a D55 fica mais estrita, e o sinal de risco
à vida vai ao professor sem conteúdo (D36). O `conformidade-reviewer` revisa toda tarefa de política e de IA; as AIAs do
Tutor e da correção recebem a medida do `ouro`.

## 9. Métricas

Contra `LINHA-DE-BASE.md` §5: funções acima de 10 de complexidade (138), clones de teste (4.285 linhas), repositories
sem prova de escopo nem exceção (25 → 0), tempo da esteira (39,5 min) e do portão (~99 min), recall do `ouro` e p95 do
turno do Tutor, além das metas dos RF10 e RF24.

## 10. Perguntas em aberto

- Se o p95 da sessão passar no k6, a regra 80.5 muda de texto na Etapa 9 (N2)
- A rede lenta no e2e volta ao Joaquim com a medida (N8)
- As perguntas do harness ficam para a Etapa 9 ⛔ (`DIAGNOSTICO.md` §5)

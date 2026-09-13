# Roadmap — Educa.ia

## Como ler isto

O alvo é o sistema inteiro, não um MVP fatiado, porque a venda acontece em reunião de
coordenação e em assembleia de pais, e o que convence é o fluxo completo. Um pedaço não
vende.

A ordem abaixo existe por um motivo diferente: reduzir retrabalho. Construir a base
institucional depois dos agentes significaria refazer os agentes, porque eles dependem do
contexto que a base fornece. Não é ordem de lançamento, é ordem de construção.

Cada funcionalidade tem um **critério de pronto verificável**. "Pronto" não é "o código
está escrito": é um comportamento que alguém consegue demonstrar.

Três observações que valem mais que a lista:

**F3 (LGPD e titular) não pode ser a última.** Parece burocracia e é o que protege o
negócio. Exportação e eliminação por titular construídas no fim viram migration em quase
todas as tabelas.

**F12 (governança) parece um painel secundário e é a tela que fecha a venda.** É o que
nenhum concorrente entrega e o que responde à exigência do CNE que toda escola tem pela
frente.

**F5 (camada de IA) pode e deve correr em paralelo desde o começo**, porque não depende do
domínio e porque é onde mora a medição de custo que valida a precificação.

<critical>Não inicie uma funcionalidade cujas dependências não estejam concluídas.</critical>

`[ ]` pendente · `[~]` em andamento · `[x]` concluída

---

## F0 — `fundacao-tecnica` [ ]
**Depende de:** nada

Monorepo, Docker Compose (Postgres, Redis de fila e Redis de cache, MinIO), Drizzle, Vitest,
Playwright, esteira de typecheck/lint/test, log estruturado **sem dado pessoal**, erro
tipado. API, realtime e worker como processos separados e sem estado. Staging com deploy
automático do `main` (D31). Filas com prioridade e limite por escola. Rate limit por usuário
e por escola. Métrica básica e check externo de disponibilidade. Ver `docs/infra.md`.

**Pronto quando:** `docker compose up` sobe tudo, um e2e verde toca API e web, e o mesmo
commit chega ao staging sozinho.

## F1 — `identidade-e-tenancy` [ ]
**Depende de:** F0

Escola, ano letivo, série, turma, disciplina, usuário, papel, vínculo. JWT com escopo.
Login por e-mail e por matrícula. MFA do coordenador. Escopo no repository. Matriz de
permissão. DTO de saída explícito.

**Pronto quando:** teste prova que a escola A não lê, não escreve e não descobre nada da B.

## F2 — `onboarding-por-convite` [ ]
**Depende de:** F1

Coordenador cria séries e turmas e sobe lista de nomes. Professor entra por link e escolhe
disciplina. Aluno entra pelo link da sala, reivindica o nome e **o professor aprova**.
Token com validade, uso único, revogação. Reset de senha do aluno pelo coordenador.

**Pronto quando:** uma escola inteira entra sem ninguém ser cadastrado individualmente, e
35 alunos reivindicando nomes no mesmo minuto não geram duplicidade nem erro cru.

## F3 — `lgpd-e-titular` [ ]
**Depende de:** F1 · **pode correr em paralelo com F4 e F5**

Auditoria, tabela de retenção por escola, rotina de expurgo, exportação e eliminação por
titular, registro de suboperadores, registro de incidente. Seed sintético.

**Pronto quando:** um pedido de acesso e um de eliminação são atendidos por comando, com
rastro. Ver `docs/lgpd.md` seção 7.

> Esta funcionalidade parece burocracia e é a que protege o negócio. Não empurre para o fim.

## F4 — `ingestao-do-material` [ ]
**Depende de:** F1

Pipeline único com porta de fonte. **Upload de PDF é a primeira implementação**; adaptador
de scraper só com escola real e fonte definida (D22). Extração, chunking, classificação por
série/disciplina/capítulo/BNCC, indexação, rastreabilidade até a página, versionamento,
reprocessamento, registro de autorização da escola por fonte, painel de estado da ingestão.

**Pronto quando:** apostila vira base consultável e toda questão gerada aponta a página.

## F5 — `camada-ia` [ ]
**Depende de:** F0 · **paralelo com F1–F4**

Porta `LLMProvider`, adaptador Ollama, adaptador OpenAI-compatível, perfis, orçamento de
tokens por aluno e por escola, registro de consumo, cache, validação de schema. Gateway com
limitador de tokens por minuto, prioridade (tutor em sala na frente de lote), timeout,
provedor de reserva e degradação para modelo menor (D29). Adaptador falso com latência de
streaming simulada para teste de carga.

**Pronto quando:** trocar de provedor é variável de ambiente, o consumo aparece por escola,
e com o limite estourado o pedido interativo espera e degrada em vez de falhar. Pacote do
tutor por turma com freio diário (D38). Avaliação de modelos de
`docs/avaliacao-de-modelos.md` executada e principal e reserva registrados (D37).

## F6 — `avaliacao-e-correcao` [ ]
**Depende de:** F4, F5

Criar avaliação a partir do material, versões, gabarito, aplicação, correção objetiva e
dissertativa com devolutiva, relatório por questão, **nota só com aprovação humana**,
boletim. Prova online resiliente: resposta salva por item, relógio no servidor, retomada
após queda (D27).

**Pronto quando:** a IA corrige, o professor aprova, sem aprovação nada vira nota, e uma
queda de rede no meio da prova não perde resposta nem tempo do aluno.

## F7 — `chat-e-ferramentas-professor` [ ]
**Depende de:** F6

Home em chat com contexto de papel, turma e material. Ferramentas: prova, atividade, lista,
plano de aula e sequência didática, adaptação/PEI, simulado ENEM, redação por competência.
Chat e formulário são o mesmo motor: o chat pergunta se quer usar a ferramenta e a abre
como cartão na conversa (D18). Banco público de questões do ENEM a partir das provas
oficiais do INEP (D21). Artefato salvo e ligado à turma. Biblioteca. Histórico.
Navegação em `docs/interface.md`.

**Pronto quando:** o professor faz o mesmo pelo chat e pelo formulário, o chat pergunta
antes de usar a ferramenta quando ela não foi escolhida, e o artefato fica salvo.

## F8 — `calendario-do-professor` [ ]
**Depende de:** F7

Rotina por escola e turma, visão semanal e diária, ligada a avaliações, entregas e ao que
os agentes concluíram.

**Pronto quando:** o professor abre a semana e vê o que precisa fazer sem cadastrar nada.

## F9 — `ambiente-do-aluno` [ ]
**Depende de:** F6

Tutor socrático que não entrega resposta, escopo restrito ao conteúdo da turma, atividades
e provas na plataforma, política por turma, trava durante avaliação, desempenho próprio.
Acesso fora da sala configurado pela escola por turma, desligado por padrão (D19). Web para
Chromebook.

**Pronto quando:** três tentativas diferentes de arrancar a resposta pronta falham no teste.

## F10 — `modo-sala-tempo-real` [ ]
**Depende de:** F9

WebSocket por turma, professor vê quem travou, quem pediu resposta pronta, dúvidas
frequentes. Modo casa com registro e resumo. Sinal derivado de evento, não vigilância.

**Pronto quando:** o professor acompanha a turma ao vivo sem ler conversa por padrão, com
duas instâncias de realtime entregando o sinal ao professor certo.

## F11 — `agentes` [ ]
**Depende de:** F7, F9

Runtime em fila, thread por agente, não-lidos, autonomia declarada e visível, portão de
aprovação, limite de passos e de custo. Rotina, Corretor, Planejador, Monitor de turma,
Tutor, Adaptador e Analista da coordenação, com nível e gatilho de `docs/agentes.md` (D32).
Aprovação de nota em lote com destaques (D33). Encaminhamento de assunto delicado (D36).

**Pronto quando:** o corretor termina sozinho, avisa, e a nota espera aprovação.

## F12 — `governanca-do-coordenador` [ ]
**Depende de:** F6, F10, F11

Uso de IA por professor e turma, desempenho por turma e habilidade, alertas (prova fácil
demais, turma em queda, aluno em risco), **auditoria do que a IA gerou e quem aprovou**,
autonomia de cada agente, consumo de tokens.

**Pronto quando:** a escola responde "o que a IA faz aqui e quem aprovou" em uma tela.

> É o que nenhum concorrente entrega. Não trate como painel secundário.

## F13 — `eventos-e-notificacoes` [ ]
**Depende de:** F6, F11

Motor de eventos (nota aprovada, tarefa não entregue, aluno travado) e notificação interna
para professor e coordenador. A família e o WhatsApp consomem isto depois, sem refazer nada.

**Pronto quando:** eventos são emitidos e roteados, com canal plugável.

## F14 — `governanca-de-rede` [ ]
**Depende de:** F12

Consolidado por escola, comparativo, adoção, exportação. **Nunca dado individual, nunca
conversa.**

**Pronto quando:** teste prova que a rede não alcança nota individual nem conversa de tutor.

## F15 — `demonstracao` [ ]
**Depende de:** F12, F13

Seed **sintético** de uma escola completa: turmas, professores, alunos fictícios, material
de exemplo, um bimestre de notas, feed de agentes com atividade recente.

O roteiro segue as quatro coisas que a coordenação precisa ver na primeira semana (D24):
escola cadastrada, governança com 100% das notas aprovadas por humano, professor gerando a
partir da apostila com página citada, e tutor em sala com sinais chegando ao professor.

**Pronto quando:** um comando sobe a demonstração povoada, as quatro coisas do D24 aparecem
nela, e o feed nunca aparece vazio.

## F16 — `hardening-e-conformidade` [ ]
**Depende de:** F15

Revisão de segurança, teste de autorização por objeto, verificação de log sem dado pessoal,
backup criptografado com restauração testada, RIPD, processo de incidente ensaiado. Teste
de carga "manhã de segunda" passando, alertas com runbook, deploy e rollback ensaiados.

**Pronto quando:** a restauração foi executada de verdade, o RIPD existe assinado e o teste
de carga de `docs/infra.md` seção 10 passa no staging.

---

## Portão da primeira escola real

Independente de onde o roadmap estiver, **nenhum dado real de escola entra em produção**
antes de cumprir a lista de `docs/infra.md` seção 11: teste de carga, restauração de backup
executada, alertas com runbook, deploy e rollback ensaiados, contrato com provedor de
modelo com limite compatível com o pico, e os itens de LGPD do F3 e do `TODO.md`. Se o
piloto vier antes do F16, esses itens são puxados para antes dele.

---

## Fase posterior (decidida, fora do alvo atual)

- `portal-da-familia` — interface do responsável sobre o motor de F13
- `canal-whatsapp` — depende de aprovação da Meta, com prazo próprio
- Faixas além do Ensino Médio — reavaliar a regra 70 antes

## Paralelismo

- F5 corre desde o início, independente do domínio
- F3 corre em paralelo com F4 e F5, e **não pode ser a última**
- F10 depende só de F9; F13 pode correr junto de F12
- O teste de carga começa no F0 com um cenário mínimo e cresce a cada funcionalidade do
  caminho quente (F2, F5, F6, F9, F10), em vez de nascer inteiro no F16

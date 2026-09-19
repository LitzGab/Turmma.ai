# Roadmap — Turmma

## Como ler isto

O alvo é o sistema inteiro, não um MVP fatiado, porque a venda acontece em reunião de
coordenação e em assembleia de pais, e o que convence é o fluxo completo. Um pedaço não
vende.

**Piloto por fatias (D1 revista).** Uma escola piloto gratuita entra no 1º semestre de 2027
usando o que já estiver pronto, antes do F16. O portão da primeira escola real (abaixo) vale
antes dela. Quais funcionalidades formam a fatia do piloto está em aberto no `CLAUDE.md`.

A ordem abaixo existe por um motivo diferente: reduzir retrabalho. Construir a base
institucional depois dos agentes significaria refazer os agentes, porque eles dependem do
contexto que a base fornece. Não é ordem de lançamento, é ordem de construção.

**Toda tela nasce responsiva** (D51): funciona do computador da escola ao celular, e é
testada nos projetos `chromebook` e `celular`. Nenhuma fase tem "adaptar para celular" como
trabalho posterior.

**Conformidade também não é fase** (revisão de 19/09/2026). Cada funcionalidade de alto risco
nasce com a sua Avaliação de Impacto Algorítmico (D60), e o que a escola exige por documento
é a governança do F12 exportada mais três textos (D61). O que virou requisito novo em cada
fase está em `docs/conformidade-mec.md` seção 11; o que é lei está em `docs/regulacao.md`.

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

## F0 — `fundacao-tecnica` [x]
Concluída em 14/09/2026, validada em tasks/prd-fundacao-tecnica/validacao.md.

**Depende de:** nada

Monorepo, Docker Compose (Postgres, Redis de fila e Redis de cache, SeaweedFS), Drizzle, Vitest,
Playwright, esteira de typecheck/lint/test, log estruturado **sem dado pessoal**, erro
tipado. API, realtime e worker como processos separados e sem estado. Filas com prioridade
e limite por escola, com entrega pelo menos uma vez e chave de idempotência obrigatória no
processador (D49). Rate limit por usuário e por escola. Métrica básica. Tudo local: o
staging nasce depois (D31). Ver `docs/infra.md`.

**Pronto quando:** `docker compose up` sobe tudo, um e2e verde toca API e web, e a esteira
do GitHub fica verde no mesmo commit.

## F1 — `identidade-e-tenancy` [ ]
**Depende de:** F0

Escola, ano letivo, série (anos finais e Ensino Médio, D43), turma, disciplina, usuário,
papel, vínculo. Vínculo criado pela escola e confirmado pelo professor; vínculo não
confirmado não dá acesso a aluno. Usuário com vínculo em mais de uma escola. JWT com escopo.
Login por e-mail, por matrícula e, como adaptador opcional, pela conta Google ou Microsoft
da escola guardando só o identificador (D48). MFA do coordenador. Escopo no repository.
Matriz de permissão, incluindo indicador de professor (regra 60, item 11). DTO de saída
explícito.

**`responsavel` e o vínculo responsável × aluno nascem aqui, sem interface.** Se o art. 24 do
ECA Digital alcançar serviço contratado pela escola, conta de aluno de até 16 anos precisa
estar vinculada à de um responsável legal — e descobrir isso depois do F9 vira migration em
quase todas as tabelas. O parecer está no `TODO.md`; a estrutura custa pouco agora
(`docs/regulacao.md` 2.2).

**Pronto quando:** teste prova que a escola A não lê, não escreve e não descobre nada da B,
e que um professor com vínculo nas duas não leva dado de uma para a outra.

## F2 — `onboarding-por-convite` [ ]
**Depende de:** F1

Coordenador cria séries e turmas, sobe lista de nomes e **importa grade horária e
calendário**, que definem a alocação professor × turma × disciplina (D3 revista). Professor
entra por link e confirma o vínculo. Aluno entra pela conta da escola ou pelo link da sala,
reivindica o nome e **o professor aprova**. Importação de turmas do Classroom como adaptador
opcional (D48). Token com validade, uso único, revogação. Reset de senha do aluno pelo
coordenador.

**Pronto quando:** uma escola inteira entra sem ninguém ser cadastrado individualmente, com
grade e calendário importados, 35 alunos reivindicando nomes no mesmo minuto não geram
duplicidade nem erro cru, e o Rotina tem de onde abrir o dia do professor.

## F3 — `lgpd-e-titular` [ ]
**Depende de:** F1 · **pode correr em paralelo com F4 e F5**

Auditoria, tabela de retenção por escola, rotina de expurgo, exportação e eliminação por
titular, registro de suboperadores, registro de incidente, guarda de registro de acesso por
6 meses separada da auditoria (Marco Civil), obrigações do ECA Digital conforme parecer.
Seed sintético. Entram também: **exportação em formato aberto** de dado, artefato e histórico
de uso, feita pela própria coordenação (D63); **canal de notificação de violação** com
retirada de conteúdo e recurso, dizendo se a análise foi humana ou automatizada (D61, ECA
arts. 28 a 30); e o **registro da validação humana** como entidade de auditoria, que o F6 e o
F17 vão preencher (D56).

**Pronto quando:** um pedido de acesso e um de eliminação são atendidos por comando, com
rastro; a coordenação exporta tudo em formato aberto sem depender de nós; e uma notificação de
violação percorre o caminho até a resposta, com recurso. Ver `docs/lgpd.md` seção 7.

> Esta funcionalidade parece burocracia e é a que protege o negócio. Não empurre para o fim.

## F4 — `ingestao-do-material` [ ]
**Depende de:** F1

Pipeline único com porta de fonte. **Upload de PDF é a primeira implementação**; adaptador
de scraper só com escola real, fonte definida e licença do dono do conteúdo (D22). Só entra
material com titularidade declarada e, se for de terceiro, com licença registrada (D5
revista). Extração, chunking, classificação por
série/disciplina/capítulo/BNCC, indexação, rastreabilidade até a página, versionamento,
reprocessamento, registro de autorização da escola por fonte, painel de estado da ingestão.

**Pronto quando:** material com licença vira base consultável, toda questão gerada aponta a
página, e arquivo sem autorização ou sem licença é recusado antes da extração.

## F5 — `camada-ia` [ ]
**Depende de:** F0 · **paralelo com F1–F4**

Porta `LLMProvider`, adaptador Ollama, adaptador OpenAI-compatível, perfis, orçamento de
tokens por aluno e por escola, registro de consumo, cache, validação de schema. Gateway com
limitador de tokens por minuto, prioridade (tutor em sala na frente de lote), timeout,
provedor de reserva e degradação para modelo menor (D29). Adaptador falso com latência de
streaming simulada para teste de carga.

Roteamento por soberania: chamada que carrega texto escrito por aluno vai para provedor com
processamento no Brasil; tarefa sem dado pessoal pode ir para provedor fora (D62).

**Pronto quando:** trocar de provedor é variável de ambiente, o consumo aparece por escola,
e com o limite estourado o pedido interativo espera e degrada em vez de falhar. Pacote do
tutor por turma com freio diário (D38). Avaliação de modelos de
`docs/avaliacao-de-modelos.md` executada, com os critérios eliminatórios da seção 3.1
(processamento no Brasil para conversa de aluno, uso por menor permitido em contrato,
treinamento vedado, equidade em português brasileiro real), e principal e reserva registrados
(D37, D62). Teste prova que prompt com texto de aluno não sai para provedor fora do Brasil.

## F6 — `avaliacao-e-correcao` [ ]
**Depende de:** F4, F5

Criar atividade e avaliação a partir do material, versões, gabarito, aplicação, correção
objetiva, diagnóstico por habilidade, relatório por questão, aprovação do que chega ao aluno
pelo professor (D46). **Em discursiva e redação a IA não corrige, não avalia, não dá nota nem
conceito e não escreve devolutiva, nem como rascunho para o professor** (D55): o que a
ferramenta entrega é rubrica e critérios antes da aplicação, organização do lote e correção
cega. **A validação humana da objetiva é registrada** (D56). Prova online resiliente: resposta
salva por item, relógio no servidor, retomada após queda (D27). A nota oficial e o boletim
ficam no F17. AIA da correção e do diagnóstico escritas antes (D60).

**Pronto quando:** a IA corrige objetiva e diagnostica, o professor aprova o que chega ao
aluno, **nenhum campo do sistema guarda nota, conceito ou devolutiva de discursiva gerada por
IA**, o registro da validação mostra o que foi apresentado e aberto, e uma queda de rede no
meio da prova não perde resposta nem tempo do aluno.

## F7 — `chat-e-ferramentas-professor` [ ]
**Depende de:** F6

Home em chat com contexto de papel, turma e material. Ferramentas: prova, atividade, lista,
plano de aula e sequência didática, adaptação/PEI, simulado ENEM, e **rubrica por competência
para redação e discursiva — sem correção, sem nota e sem devolutiva gerada por IA** (D55).
Sob pedido do professor, o Planejador também monta atividade de letramento em IA, alinhada às
12 aprendizagens do MEC e às habilidades de Computação da BNCC (D65).
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
Resposta do tutor supervisionada, não aprovada uma a uma (D47). O Tutor mantém identidade de
agente e **nunca se passa por pessoa** (D58); **nenhum mecanismo de uso excessivo e nenhum
padrão manipulativo** (D59); filtro de conteúdo inadequado; aviso de privacidade em linguagem
de faixa etária; e o canal para o aluno avisar um adulto (D61). Linguagem adequada do 6º ano
ao Ensino Médio (D43). Encaminhamento de assunto delicado que chega a quem notifica o
Conselho Tutelar (`docs/regulacao.md` seção 7). Avaliação de impacto dos sinais antes de
existirem. Acesso fora da sala configurado pela escola por turma, desligado por padrão
(D19). Web para computador da escola em sala e celular fora dela (D51).

**Pronto quando:** três tentativas diferentes de arrancar a resposta pronta falham no teste,
o Tutor responde o que é quando o aluno pergunta se ele é uma pessoa, a AIA do Tutor existe
escrita, e o encaminhamento de risco à vida chega a quem notifica, com o acesso ao conteúdo
auditado.

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
Encaminhamento de assunto delicado (D36). Processador idempotente (D49).

Cada agente de alto risco entra com a AIA escrita e com **procedimento de suspensão** — como
desligar o agente numa escola, quem decide, o que acontece com o que ele já produziu (D60).

**Pronto quando:** o Corretor termina, avisa, e o diagnóstico espera aprovação; rodar o mesmo
agente duas vezes não duplica aviso nem chamada de IA; e um agente pode ser suspenso numa
escola sem desligar o sistema.

## F12 — `governanca-do-coordenador` [ ]
**Depende de:** F6, F10, F11

Uso de IA por série e disciplina, desempenho por série, turma e habilidade, alertas em
agregado formulados como hipótese (média fora da curva, habilidade em queda, aluno em
risco), **auditoria do que a IA gerou e quem aprovou**, autonomia de cada agente, consumo de
tokens. **Painel do professor** com o próprio uso e o desempenho das turmas dele; a
coordenação vê agregado e abre o nominal com auditoria; sem ranking de professor (D45).
Indicadores, limiares e texto dos alertas definidos antes do PRD (decisão em aberto).
**Sem ranking, sem lista nominal de adoção e sem alerta de professor que não usa** (D64).
Entram as telas de **Conformidade** (o dossiê da escola num lugar: propósito, faixas etárias,
funcionamento em linguagem simples, LGPD e ECA artigo por artigo, relatório de uso exportável,
material de comunicação), **Denúncias** e **Exportar** (D61, D63), e o resumo da AIA em cada
agente de alto risco (D60).

**Pronto quando:** a escola responde "o que a IA faz aqui e quem aprovou" em uma tela,
**imprime o dossiê que a secretaria pede** a partir dela, e teste prova que a coordenação não
vê indicador nominal de professor sem deixar auditoria nem enxerga adoção nominal em lugar
nenhum.

> É o que nenhum concorrente entrega. Não trate como painel secundário.

## F13 — `eventos-e-notificacoes` [ ]
**Depende de:** F6, F11

Motor de eventos (nota aprovada, tarefa não entregue, aluno travado) e notificação interna
para professor e coordenador. A família e o WhatsApp consomem isto depois, sem refazer nada.

**Pronto quando:** eventos são emitidos e roteados, com canal plugável.

## F14 — `governanca-de-rede` [ ]
**Depende de:** F12

Consolidado por escola, comparativo, adoção, exportação. **Nunca dado individual de aluno
ou de professor, nunca conversa.**

**Pronto quando:** teste prova que a rede não alcança nota individual nem conversa de tutor.

## F15 — `demonstracao` [ ]
**Depende de:** F12, F13

Seed **sintético** de uma escola completa: turmas dos anos finais e do Ensino Médio,
professores, alunos fictícios, grade e calendário, material de exemplo com licença, um
bimestre de atividades com diagnóstico (e de notas, quando o F17 existir), feed de agentes
com atividade recente.

O roteiro segue as quatro coisas que a coordenação precisa ver na primeira semana (D24):
escola cadastrada, governança com o que a IA gerou e quem aprovou (e as notas, quando o F17
existir), professor gerando a partir do material com página citada, e tutor em sala com
sinais chegando ao professor.

**Pronto quando:** um comando sobe a demonstração povoada, as quatro coisas do D24 aparecem
nela, e o feed nunca aparece vazio.

## F17 — `nota-oficial-e-boletim` [ ]
**Depende de:** F6, F11

Nota oficial das objetivas proposta pelo Corretor e aprovada em lote com destaques (D33),
nota das discursivas dada pelo professor sem valor sugerido (D46), boletim, evento "nota
aprovada" no motor do F13, exportação das notas aprovadas no formato de importação do
sistema de gestão da escola. Entra depois do diagnóstico formativo (D46), e revisita a
regra 70 com o texto final do CNE publicado.

**Pronto quando:** nenhum caminho grava `Nota` sem autor humano, o lote não libera sem abrir
os destaques, e as notas aprovadas saem num arquivo que o sistema de gestão importa.

## F16 — `hardening-e-conformidade` [ ]
**Depende de:** F15, F17

Revisão de segurança, teste de autorização por objeto, verificação de log sem dado pessoal,
backup criptografado com restauração testada, RIPD, processo de incidente ensaiado. Teste
de carga "manhã de segunda" passando, alertas com runbook, deploy e rollback ensaiados.
Entram também: **AIA de cada funcionalidade de alto risco** revista e assinada (D60), **dossiê
de conformidade** fechado (D61) e **teste adversário do tutor** — tentativa de desativar
salvaguarda, de arrancar conteúdo inadequado e de sair do escopo.

**Pronto quando:** a restauração foi executada de verdade, o RIPD e as AIA existem assinados,
o dossiê está pronto para entregar a uma escola, e o teste de carga de `docs/infra.md`
seção 10 passa no staging.

---

## Portão da primeira escola real

Independente de onde o roadmap estiver, **nenhum dado real de escola entra em produção**
antes de cumprir a lista de `docs/infra.md` seção 11: teste de carga, restauração de backup
executada, alertas com runbook, deploy e rollback ensaiados, contrato com provedor de
modelo com limite compatível com o pico, que permita serviço usado por menor, vede treinamento
e garanta **processamento no Brasil para conversa de aluno** (D62), e os itens de LGPD do F3 e
do `TODO.md`. Somam-se: **RIPD**, **AIA das funcionalidades de alto risco** que o piloto usar,
**aviso de privacidade em linguagem de faixa etária**, **canal de notificação** funcionando, e
o **parecer sobre o art. 24 do ECA Digital** — se a leitura ampla prevalecer, aluno de até 16
anos só entra com conta de responsável vinculada (`docs/regulacao.md` 2.2). O piloto do 1º semestre de 2027
vem antes do F16 (D1 revista), então esses itens são puxados para antes dele.

O **staging** (deploy automático do `main`, check externo, custo do ambiente) é criado antes
da primeira demonstração a alguém de fora ou do piloto, o que vier primeiro, com o provedor
escolhido nesse momento (D31, D42).

---

## Fase posterior (decidida, fora do alvo atual)

- `portal-da-familia` — interface do responsável sobre o motor de F13
- `canal-whatsapp` — depende de aprovação da Meta, com prazo próprio
- Educação infantil e anos iniciais — reavaliar a regra 70 antes (o recorte atual é anos
  finais e Ensino Médio, D43)

## Paralelismo

- F5 corre desde o início, independente do domínio
- F3 corre em paralelo com F4 e F5, e **não pode ser a última**
- F10 depende só de F9; F13 pode correr junto de F12
- F17 (nota oficial) corre depois de F6 e F11, em paralelo com F12 a F15
- O teste de carga começa no F0 com um cenário mínimo e cresce a cada funcionalidade do
  caminho quente (F2, F5, F6, F9, F10), em vez de nascer inteiro no F16

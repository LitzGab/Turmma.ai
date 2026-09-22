# Turmma — contexto e decisões

> **Antes deste arquivo, leia `docs/visao-produto.md`.** Ele explica o que estamos
> construindo e para quem. Este aqui registra o que já foi decidido e por quê, para não
> rediscutirmos a mesma coisa toda semana.
>
> **O produto se chama Turmma** (D54). A marca, a paleta e a landing page existem em
> `turmma.com`; o registro no INPI e o do domínio seguem pendentes (`TODO.md`). O
> repositório, os pacotes, o banco, o compose e os comandos continuam `educa`: a renomeação
> técnica é trabalho próprio e não vale o risco no meio do F1.
> Repositório: https://github.com/LitzGab/Educa.ia

---

## Em uma frase

Um assistente com agentes de IA supervisionados para a escola: o professor tem chat e
ferramentas que produzem a partir do material que a escola pode usar, o aluno usa IA em
sala com o professor vendo, a coordenação organiza a escola e acompanha o uso de IA e o
desempenho de alunos e professores, e a família acompanha. A IA prepara o trabalho e avisa;
a escola aprova (D44).

## O recorte

**Anos finais do Ensino Fundamental (6º ao 9º) e Ensino Médio**, em **escolas particulares
e redes públicas**, começando por Joinville (D43, D20). Em sala, o aluno usa **qualquer
computador da escola** (Chromebook, notebook, laboratório). **Web-first e responsivo**: a
Lei 15.100/2025 tirou o aparelho pessoal da sala, então nada no produto pode depender do
telefone do aluno; mas toda tela funciona também no celular, para o aluno fora da escola e
para professor e coordenação em qualquer lugar (D51).

## Quem constrói

**Joaquim** implementa, com o Claude executando as tarefas do processo SDD e o Joaquim
revisando. **Gabriel** cuida de marca, landing page, benchmark e comercial. Mercado, preço
e concorrência estão em `docs/negocio.md`.

## Quem é quem

| Papel | Usa | Paga | O que precisa |
|---|---|---|---|
| Coordenação | sim | decide a compra | governança de IA e de ensino, alertas, auditoria |
| Professor | sim | não | tempo, e confiança de que nada entra no boletim sem ele |
| Aluno | sim | não | uma IA que ensina em vez de entregar a resposta |
| Família | fase posterior | sim, via mensalidade | nota, entrega, alerta |
| Prefeitura | não diretamente | contrato | governança de rede e resposta pronta sobre LGPD |

A regra que orienta as prioridades: **professor e aluno precisam gostar e usar; coordenação
e família precisam confiar.** Se o professor não gostar, a escola não renova. Se a família
não confiar, a escola não compra.

---

## Decisões tomadas

O texto completo de cada decisão, com o motivo e as revisões, está em `docs/decisoes.md`.
**Leia a decisão lá antes de citá-la, de discuti-la de novo ou de implementar algo que dependa
dela.** Aqui fica uma linha por decisão, para saber que ela existe e onde procurar.

| D | Decisão |
|---|---|
| D1 | Sistema inteiro como alvo; MVP de apresentação logo depois do F1 (D71); escola piloto gratuita no 1º semestre de 2027 com o que estiver pronto, com o portão de LGPD e infra antes dela |
| D2 | O cliente é a instituição: sem cadastro público, sem plano avulso de professor |
| D3 | Onboarding por convite: a coordenação importa turmas, nomes, grade e calendário e aloca o professor, que só confirma o vínculo |
| D4 | A identidade do aluno passa por aprovação humana (reivindicação de nome) |
| D5 | Pipeline único de ingestão, só com material cuja licença permite o uso; apostila de terceiro sem licença não entra |
| D6 | Indexação por série, disciplina, capítulo e habilidade da BNCC, com rastreio até a página |
| D7 | Nota nunca é publicada sem aprovação humana |
| D8 | O tutor é sempre visível ao professor: sala ao vivo, casa com registro e resumo |
| D9 | Todo agente tem nível de autonomia declarado e visível à coordenação |
| D10 | A escola é controladora dos dados; nós somos operadores |
| D11 | WhatsApp e portal da família depois; o motor de eventos entra agora |
| D12 | Backend e frontend separados, multi-tenant por escola, tudo em container, sem trava de fornecedor |
| D13 | IA por porta e adaptador, com Ollama local no desenvolvimento |
| D14 | Orçamento de tokens por aluno e por escola é requisito, medido desde a primeira chamada |
| D15 | Construção do zero, sem reaproveitar produto anterior |
| D16 | A stack está ratificada (seção "Stack") |
| D17 | Agentes têm nome de função, não nome próprio |
| D18 | Chat e ferramentas são o mesmo motor; o chat pergunta antes de abrir a ferramenta como cartão |
| D19 | Tutor fora da sala é configuração da escola por turma, desligada por padrão |
| D20 | Escola particular e rede pública são alvo juntas desde o início |
| D21 | O banco público de questões vem das provas oficiais do ENEM e entra no F7 |
| D22 | A ingestão começa pelo upload de PDF licenciado; adaptador de scraper só com escola real e licença |
| D23 | O trabalho acontece na `develop`; `release` e `main` recebem por merge, que o Joaquim gerencia. O Gabriel abre branch própria e integra na `develop`. A esteira roda nas três branches. O portão de qualidade continua no processo (revista pela D53, em 19/09/2026 e em 21/09/2026) |
| D24 | Na primeira semana a coordenação vê quatro coisas: escola cadastrada sem trabalho manual, governança de IA, prova e plano com página citada, tutor em sala com sinais |
| D25 | Infra do primeiro ano para até dez escolas; API, realtime e worker separados e sem estado |
| D26 | Banco, Redis e storage são serviços gerenciados |
| D27 | 99,5% de disponibilidade no horário letivo, prova resiliente, deploy só fora do horário |
| D28 | Hospedagem em região Brasil |
| D29 | Modelo em produção por API com contrato e reserva; no pico, fila curta e depois modelo menor |
| D30 | Infra custa até R$ 2 por aluno por mês, sem contar IA |
| D31 | Três ambientes; F0 e validação inicial 100% locais; staging antes da primeira demonstração externa ou do piloto |
| D32 | Seis agentes: Assistente de ensino, Tutor, Corretor, Planejador, Adaptador e Analista de desempenho escolar; Mensageiro da família depois (revista em 19/09/2026: o Monitor de turma se dissolve e o Planejador absorve o Rotina) — *revisão a ratificar* |
| D33 | Nota de objetiva aprovada em lote, com os casos fora da curva abertos antes |
| D34 | Aluno em risco nomeado só ao professor da turma; coordenação vê agregado, nominal com auditoria |
| D35 | A coordenação registra a adaptação necessária, nunca o diagnóstico |
| D36 | Assunto pessoal delicado no tutor vai para um humano, com CVV em risco à vida; o professor recebe o sinal sem o conteúdo |
| D37 | O provedor de modelo sai de avaliação com amostras sintéticas (finalistas Maritaca e Google) |
| D38 | Tutor com pacote mensal por turma (300 trocas por aluno) e freio de 60 trocas por dia por aluno |
| D39 | IA custa até R$ 5 por aluno por mês no pacote completo da escola particular |
| D40 | A escola paga por aluno com uso normal incluso; não há crédito visível |
| D41 | Na rede pública, pacote de rede com piso em torno de R$ 10; orçamento de IA é configuração por rede |
| D42 | O provedor de hospedagem é escolhido quando o staging for criado, por critério fixo |
| D43 | Recorte: 6º ao 9º ano e Ensino Médio, em qualquer computador da escola |
| D44 | O produto se apresenta como assistente com agentes supervisionados |
| D45 | O professor é medido em espelho, pelo desempenho das turmas dele: vê o próprio dado; coordenação vê agregado só com dois ou mais professores no recorte; sem ranking nem decisão sobre ele — *grupo mínimo a ratificar* |
| D46 | Primeiro o diagnóstico formativo, depois a nota oficial; sem nota proposta em discursiva e redação |
| D47 | O tutor é supervisionado, não aprovado resposta por resposta |
| D48 | Login pela conta Google ou Microsoft da escola quando existe, matrícula quando não; só o identificador opaco |
| D49 | Fila de jobs mantida, com entrega pelo menos uma vez e idempotência obrigatória |
| D50 | Preço por aluno com faixas de pacote: base e completo com tutor |
| D51 | Toda tela nasce responsiva e usável no celular, sem que nenhum fluxo dependa dele |
| D52 | Testes de integração da infra fora do portão de toda tarefa, na esteira |
| D53 | Processo enxugado onde repetia trabalho: `test-engineer` primeiro, caducidade pelo que o revisor audita, portão com carimbo, `revisor-geral`, `/revisar-spec`, `/corrigir` e `/retro` |
| D54 | O nome do produto é Turmma; o código continua `educa` até uma renomeação própria |
| D55 | Em discursiva e redação a IA não corrige, não avalia, não dá nota nem conceito, e não pré-corrige nem sugere nota ao professor (revisão da D46) — *a ratificar* |
| D56 | Na objetiva, a validação humana é registrada: o que foi mostrado, o que foi aberto e quem confirmou (complementa a D33) — *a ratificar* |
| D57 | Usos vedados, escritos e testados: sem inferência de emoção, perfil comportamental, pontuação social, biometria ou uso comercial de dado educacional — *a ratificar* |
| D58 | Os agentes continuam agentes, com identidade de função; proibido só se passar por pessoa ou simular vínculo afetivo (Decreto 12.880, art. 11) — *a ratificar* |
| D59 | Nada induz uso excessivo, e sair nunca é mais difícil que entrar (Decreto 12.880, arts. 9º e 10) — *a ratificar* |
| D60 | Avaliação de Impacto Algorítmico por funcionalidade de alto risco, em seis etapas, antes de ela existir, versionada em `docs/aia/` — *a ratificar* |
| D61 | O dossiê de conformidade é entregável de produto, com canal de denúncia e material de consulta à comunidade — *a ratificar* |
| D62 | Conversa de aluno só em provedor de modelo com processamento no Brasil — *a ratificar* |
| D63 | O que a escola e o professor produzem é deles, e sai em formato aberto a qualquer momento — *a ratificar* |
| D64 | Recusar a ferramenta não gera indicador: sem medição nominal de adoção por professor (afina a D45) — *a ratificar* |
| D65 | Letramento em IA entra por três portas pequenas e não vira fase de roadmap — *a ratificar* |
| D66 | O Tutor tem memória de tudo que o aluno fez no sistema (atividades, trabalhos, avaliações, sessões), feita do registro do trabalho e nunca de texto sobre a pessoa; recebe contexto estruturado do professor e lê a adaptação registrada — *a ratificar* |
| D67 | Entram as ferramentas de apresentação e de material didático; o artefato exporta em PDF, PPTX e XLSX; a ferramenta se chama Adaptação e recebe o tipo de adaptação, nunca texto livre sobre o aluno — *a ratificar* |
| D68 | Busca na web por ativação do professor: para ele no Assistente de ensino, e para o aluno no Tutor só em fontes aprovadas, com duas chaves, socrático, só em sala — *a ratificar* |
| D69 | "Minhas turmas" é aba do "Meu painel" do professor e nasce no F6; tempo ocioso do aluno não é indicador — *a ratificar* |
| D70 | Sair da aba durante a prova é fato mostrado só ao professor, com o aluno avisado, sem consequência automática nem histórico; fora de avaliação não existe — *a ratificar* |
| D71 | Depois do F1 vem o MVP de apresentação: cinco specs (A1 a A5) com fatias finas e reais do fluxo completo, dado 100% sintético, mesmas regras e mesmo processo; depois as fases seguem e completam as fatias — *composição a ratificar* |

> **D54 a D65 são propostas de 19/09/2026**, saídas da leitura das fontes primárias de
> regulação e dos dois documentos do MEC. O Gabriel ratificou as que dependiam dele (a D54
> está fechada); **nas demais falta o Joaquim**. **D66 a D70**, e as revisões da D23, da D32 e
> da D45, saíram no mesmo dia da estrutura de agentes por papel, decididas pelo Gabriel, e
> também esperam o Joaquim. A **D71** (MVP de apresentação) tem a direção dada e a composição
> como proposta. O texto completo, com quem precisa concordar em cada uma, está em
> `docs/decisoes.md`.

---

## Conflitos já resolvidos

Registrados porque cada um deles já voltou uma vez.

**Login do aluno.** A reivindicação de nome é o *cadastro*. O *login* recorrente é escola +
matrícula + senha, definida pelo aluno no momento da reivindicação. Aluno não tem e-mail no
sistema. Onde a escola tem conta Google ou Microsoft, o login e a importação vêm dela, e
guardamos só o identificador da conta, nunca o e-mail (D48).

**Notificação à família.** O motor de eventos entra agora; a interface do responsável e o
WhatsApp ficam para depois.

**Importação por planilha.** Sobrevive, reduzida: a coordenação sobe lista de nomes por
turma, grade horária e calendário, não cadastro completo de pessoa (D3 revista). Professor
e aluno entram por link.

**Scraper de material.** Permitido, com cinco condições: licença ou parceria com o dono do
conteúdo, autorização escrita da escola registrada no sistema, credencial fornecida pela
escola, conteúdo preso ao tenant dela, e nada que contorne pagamento ou bloqueio técnico de
terceiro. Fonte que proíbe sai, e **o upload não cobre o caso**: apostila de terceiro sem
licença não entra por nenhum caminho (D5 revista). O primeiro caminho implementado é o
upload de material com licença (D22).

**Correção de discursiva e redação.** Voltou em 19/09/2026 e ficou mais restrita: a IA não
corrige, não avalia, não dá nota nem conceito, e **não faz pré-correção nem sugere nota ao
professor** — o que derruba a devolutiva rascunho de discursiva como estava desenhada (D55,
revisão da D46). Rubrica, organização do lote e correção cega continuam. A devolutiva
formativa volta à mesa quando o texto oficial do CNE for publicado e lido com advogado.

**Nome do produto.** Fechado: Turmma (D54). Não é mais "nome provisório". O que continua
aberto é registro no INPI e domínio, e o código segue com `educa`.

**Tutor e aprovação prévia.** O tutor é supervisionado, não aprovado resposta por resposta.
A regra 70, item 3, declara essa exceção (D47).

**Fila de jobs.** A auditoria de 13/09/2026 propôs trocar por fila só no Postgres. Ficou
como está, com entrega pelo menos uma vez e idempotência obrigatória (D49).

**Processo de construção.** A mesma auditoria propôs teto de tamanho por tarefa, assinatura
humana no portão e revisor de simplicidade. Os vetos e o portão de qualidade no processo
ficaram (D23). O commit direto no `main` caiu em 19/09/2026, com a terceira pessoa no código, e em
21/09/2026 o fluxo foi fixado: **o trabalho acontece na `develop`**, `release` e `main` recebem por
merge que o Joaquim gerencia, o Gabriel abre branch própria e integra na `develop`, e a esteira roda
nas três (D23 revista). Em 15/09/2026 o processo foi enxugado onde repetia trabalho, sem tirar revisão:
`test-engineer` primeiro, caducidade pelo que o revisor audita, portão local com carimbo,
`revisor-geral` no lugar da autorrevisão, `/revisar-spec`, `/corrigir` e `/retro` (D53).

**Nome dos agentes.** O desenho da call tinha nomes próprios; os docs usam função. Fica a
função (D17).

**Lista de agentes.** Eram sete; em 19/09/2026 viraram seis (D32 revista): o chat do professor
ganhou identidade, o **Assistente de ensino**; o Monitor de turma se dissolveu entre a thread
do Tutor, o Planejador e a aba "Minhas turmas" (D69); e o Planejador absorveu o Rotina.
"Monitor" não é nome de agente: servia a duas coisas diferentes.

**Medir o professor pela turma.** A estrutura de 19/09/2026 pedia que o Analista analisasse o
professor pelo resultado dos alunos e cada aluno individualmente. Fica dentro da D45 e da D34:
o indicador do professor deriva do desempenho das turmas dele, ele vê primeiro, a coordenação
vê agregado só com dois ou mais professores no recorte e abre o nominal com auditoria. Sem
ranking, sem decisão sobre ele, sem adoção nominal (D64).

**Adaptar sem gerar o PEI.** Voltou duas vezes em 19/09/2026. O plano individual é obrigação da
escola (LBI, art. 28, VII; Decreto 12.686/2025), feito pela equipe dela; o que a lei pune é
recusar matrícula ou recusar adaptação (Lei 7.853, art. 8º; LBI, arts. 4º e 88). Adaptar prova
e atividade a partir do **tipo de adaptação** é o que a lei quer, e não depende de o sistema
gerar o documento. Não geramos o PEI por minimização de dado sensível (D35, D67), a confirmar
com advogado junto da base legal da adaptação (`TODO.md`).

**MVP.** Não existe MVP de venda (D1). Existem duas coisas diferentes: o **MVP de apresentação**
(D71), logo depois do F1, com dado sintético, para demonstrar o fluxo completo; e a **fatia do
piloto**, com escola real em 2027, que só entra depois do F2, do F3 e do portão da primeira
escola real.

**Vigiar a navegação do aluno.** Pedido em 19/09/2026: alertar o professor quando o aluno sai
do sistema para usar outra IA, e medir tempo ocioso. Ficou: saída da aba só durante a prova,
como fato, só para o professor (D70); "concluiu o que foi atribuído" no lugar do tempo ocioso
(D69); e bloquear outras IAs é configuração da escola, com guia nosso no dossiê.

**Escola particular ou rede pública.** As duas, como alvo juntas desde o início, com a rede
em pacote com piso de preço (D20 e D41 revistas).

**Chromebook.** Deixou de ser filtro de mercado: vale qualquer computador da escola. Continua
como referência de máquina fraca para desempenho (D43, regra 50).

**Celular.** O produto não depende do celular em nenhum fluxo, mas toda tela funciona nele
(D51). "Sem dependência de celular" e "responsivo para celular" não se contradizem: o
primeiro é sobre o que o fluxo exige, o segundo sobre onde a tela funciona.

---

## Decisões em aberto

Use `/descobrir <tema>` para fechar uma, e `/registrar-decisao` para escrevê-la.

Todas têm dono e momento. Nenhuma trava o F0.

| Decisão | Dono | Quando fecha |
|---|---|---|
| Provedor de modelo principal e reserva | Joaquim | avaliação de `docs/avaliacao-de-modelos.md`, antes de a F5 ficar pronta (D37) |
| Provedor de hospedagem | Joaquim | quando o staging for criado, antes da primeira demonstração externa ou do piloto (D42) |
| Trazer a marca para o repositório: tokens de cor, tipografia, logo e o avatar dos seis agentes (a marca existe, D54) | Gabriel | **antes do PRD da A1**, que é a primeira tela com a marca (D71) |
| Material de exemplo da escola sintética do MVP: precisa ser nosso ou de domínio público, com a licença declarada (D5, D71) | Gabriel | antes do PRD da A2 |
| Composição final de cada spec do MVP de apresentação (A1 a A5) e os três afrouxamentos enquanto o dado for sintético: AIA só com a etapa 1, provedor de modelo livre, carga sem crescer (D71) | Joaquim e Gabriel | no PRD de cada spec; os afrouxamentos antes do PRD da A1 |
| Registro no INPI e do domínio `turmma.com` (o nome já está fechado, D54) | Gabriel | antes do material de venda e do piloto |
| Se o art. 24 do ECA Digital exige conta de responsável vinculada para aluno de até 16 anos — e, se exigir, se o portal da família sai da fase posterior | Joaquim e Gabriel, com advogado | **antes do PRD do F9**; o vínculo já nasce no modelo de dados do F1 (`docs/regulacao.md` 2.2) |
| Como os arts. 17 e 18 do ECA Digital (supervisão parental) se modulam pelo art. 39 no nosso caso | advogado | junto com o parecer do ECA Digital |
| Evidência independente de eficácia pedagógica: desenho da medição com a escola piloto | Gabriel e Joaquim | ao fechar o piloto (`docs/conformidade-mec.md` 12) |
| Sistemas de ensino das escolas-alvo, licença do material e primeiro adaptador | quem conduzir o piloto | nas entrevistas com escolas; até lá só upload de material com licença (D5, D22) |
| Quais funcionalidades formam a fatia do piloto, e quais das quatro coisas da D24 ele precisa ter. Não confundir com o MVP de apresentação, que é sintético (D71) | Joaquim e Gabriel | com o MVP de apresentação de pé, antes de completar a primeira fase para escola real (D1 revista) |
| Valores das faixas de preço e teto de IA do pacote base | Gabriel e Joaquim | com a planilha de custo por pacote, validados no piloto (D50, D39) |
| Indicadores de desempenho do professor e do aluno (quais, limiar, texto do alerta). Ponto de partida: percentual de erro e acerto por habilidade e o sinal "concluiu o que foi atribuído"; tempo ocioso não entra (D69) | Joaquim e Gabriel | os de turma e aluno **antes do PRD do F6**, porque "Minhas turmas" nasce lá (D69); os de professor antes do PRD do F12 (D45, D46) |
| Imagens da ferramenta de apresentação: de onde vêm e com que licença (D67, D5) | Gabriel e Joaquim | antes do PRD do F7 |
| Lista padrão de fontes aprovadas da busca do Tutor, por faixa etária, e o provedor de busca (D68) | Gabriel (lista) e Joaquim (provedor) | antes do PRD do F9 |
| Se ligar a busca para aluno de até 16 anos sem conta de responsável vinculada conta como rebaixar a proteção (ECA Digital, art. 24, § 5º; D68) | advogado | junto com o parecer do ECA Digital, antes do PRD do F9 |
| Acompanhar a saída da aba fora de avaliação, com o aluno estudando em sala. Hoje não existe: bate na regra 70, item 7 (D70) | Joaquim e Gabriel, com advogado | na AIA de sinais; sem parecer, continua não existindo |
| Texto final das diretrizes do CNE e o que muda na correção, na devolutiva de discursiva e nos sinais do tutor | Joaquim, com advogado | quando a resolução for homologada e publicada pelo MEC (D46, D55) |

---

## Stack

**Backend** NestJS + TypeScript, Postgres, Drizzle, BullMQ + Redis, JWT próprio, storage
S3-compatível. **Frontend** React + Vite + TypeScript, TanStack Query, Tailwind, web-first
e responsivo, do computador fraco de escola (Chromebook como referência) ao celular (D51). **Tempo real** WebSocket para o modo sala. **IA** interface `LLMProvider`
com adaptadores Ollama e OpenAI-compatível. **Testes** Vitest e Playwright. **Infra**
Docker Compose.

O critério que guiou tudo isso: nada pode impedir que o sistema inteiro suba em um servidor
no Brasil, se um contrato exigir.

---

## As seis regras que não se negociam

1. **Vazamento entre escolas encerra a empresa.** Escopo de tenant no repository, sempre.
   Regra 10.
2. **Dado de menor é o ativo mais perigoso do sistema.** Leia `docs/lgpd.md` antes de tocar
   em qualquer campo de pessoa. Regra 20.
3. **Nada que a IA produz vira nota, mensagem à família ou decisão sobre aluno sem aprovação
   humana registrada.** É lei. Regra 70. E em discursiva e redação a IA não chega nem a
   propor: não corrige, não avalia, não pré-corrige (D55).
4. **Nenhum módulo chama provedor de IA direto.** Sempre pela porta, sempre com perfil e
   orçamento. Regra 30.
5. **Teste prova regra de negócio.** "Retornou 200" não é teste. Regra 40.
6. **O horário de aula é sagrado.** Dimensione para a manhã de segunda, limite por usuário
   e por escola (nunca só por IP), e nenhuma resposta de prova se perde. Regra 80.

---

## Mapa dos documentos

**Para entender o produto:** `docs/visao-produto.md`, `docs/fluxos.md`, `docs/glossario.md`
**Para entender a interface:** `docs/interface.md`
**Para entender o negócio:** `docs/negocio.md` (mercado, preço, concorrência). Não é leitura
obrigatória para implementar
**Para não quebrar a lei:** `docs/lgpd.md`, `docs/regulacao.md`
**Para responder ao que a escola pergunta na compra:** `docs/conformidade-mec.md` (os dois
documentos do MEC virados em requisito, o dossiê de conformidade e a AIA)
**Para escrever a AIA de uma funcionalidade de alto risco:** `docs/aia/` (índice e o que toda
AIA precisa ter; uma por funcionalidade, antes do PRD dela)
**Para construir:** `docs/arquitetura.md`, `docs/modelo-de-dados.md`, `docs/agentes.md`,
`docs/ingestao.md`
**Para não cair no horário de aula:** `docs/infra.md`, `docs/runbook.md`
**Para escolher modelo e medir custo de IA:** `docs/avaliacao-de-modelos.md`
**Para saber o que já foi decidido, por extenso:** `docs/decisoes.md`
**Para trabalhar:** `README.md`, `ROADMAP.md`, `TODO.md`, `.claude/rules/`, `.claude/skills/`

As regras 30 (IA) e 50 (frontend) carregam sozinhas só quando se lê arquivo do caminho delas
(`paths:` no topo de cada uma). Quem escreve PRD, Tech Spec ou tarefa que envolve IA ou tela lê
a regra explicitamente.

---

## Skills

**Do processo** (nossas, em `.claude/skills/`), na ordem em que entram: `/status`,
`/descobrir`, `/registrar-decisao`, `/criar-prd`, `/criar-techspec`, `/revisar-spec`,
`/criar-tasks`, `/executar-tasks`, `/executar-task`, `/executar-review`, `/corrigir`, `/validar`,
`/retro`.

**Revisores** (em `.claude/agents/`): em toda tarefa, `test-engineer` primeiro e depois
`revisor-geral` com os guardiões marcados, em paralelo. O hook `tools/processo/revisoes.ts`
registra as rodadas, guarda o que foi exigido em `achados/<documento>.md` com resumo de uma linha
em `achados/indice.md` (leia o índice, abra o bloco), e bloqueia o commit sem
revisão válida, sem portão local carimbado (`node tools/processo/portao-local.ts`), ou que leve
código sem `(tarefa N.0)` nem `(correção <slug>)` (D53).

**Técnicas** (de terceiros, instaladas via skills.sh, versões em `skills-lock.json`):
`nestjs-best-practices`, `drizzle-orm-patterns`, `supabase-postgres-best-practices`,
`bullmq-specialist`, `vercel-react-best-practices`, `tanstack-query-best-practices`,
`tailwind-design-system`, `frontend-design`, `accessibility`, `vitest`,
`playwright-best-practices`, `lgpd-brasil`. Atualizar com `npx skills update -p`, e ler o
diff antes de commitar: skill vira instrução para o Claude.

<critical>As skills de terceiros são referência técnica genérica. Quando conflitam com
`.claude/rules/` ou com uma decisão (`docs/decisoes.md`), a regra e a decisão vencem. Os conflitos
já conhecidos:</critical>

- **Escopo de tenant.** `supabase-postgres-best-practices` recomenda RLS. Aqui o escopo é
  aplicado no repository, a partir do token (regra 10). RLS pode entrar como segunda camada
  de defesa, nunca no lugar do repository
- **React.** `vercel-react-best-practices` é escrita para Next.js. Somos SPA com Vite: ignore
  Server Components, Server Actions e tudo que depende de servidor Next. As regras de bundle,
  re-render e carregamento valem, e valem ainda mais no Chromebook fraco (regra 50)
- **Visual.** `frontend-design` pede ousadia estética. Aqui o limite é Chromebook fraco,
  acessibilidade e a professora com quarenta minutos de intervalo (regra 50). Fonte pesada,
  animação e efeito que custam CPU ficam de fora. A identidade visual ainda está em aberto
- **Playwright.** Viewport de celular, toque e rede móvel **se aplicam** (D51): toda tela
  roda nos projetos `chromebook` e `celular`. Geolocalização, permissões de aparelho, PWA
  instalável e app nativo não se aplicam (regra 50, item 2)
- **LGPD.** `lgpd-brasil` resume a lei. O que vale para o código é `docs/lgpd.md` e a regra
  20, que são mais restritivos (aluno sem e-mail, sem CPF, sem foto)
- **NestJS.** A organização em controller, service, repository e DTO de `docs/arquitetura.md`
  prevalece sobre qualquer outra estrutura sugerida

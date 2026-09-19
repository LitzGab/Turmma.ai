# Conformidade MEC — o roteiro de compra virado em requisito

> Os dois documentos do MEC sobre IA na educação não têm sanção. Eles têm algo que importa
> mais: são **o roteiro que a coordenação e a secretaria vão usar para nos avaliar**, com
> perguntas prontas, lista de documentos a exigir do desenvolvedor e cláusulas de contrato
> sugeridas. Quem escreve PRD de governança, tutor, correção, ingestão ou material de venda
> lê este arquivo antes.
>
> Lidos na íntegra em 19/09/2026. A lei está em `docs/regulacao.md`; aqui é o que não é lei e
> decide a venda.

---

## 1. Os dois documentos

| Documento | Quem fez | O que é | Para quem fala |
|---|---|---|---|
| **Referencial para Desenvolvimento e Uso Responsáveis de Inteligência Artificial na Educação** (238 p., jul/2026) | MEC / SEGAPE | diretrizes, princípios e recomendações da educação infantil à pós-graduação; traz o fluxo de aquisição, a Avaliação de Impacto Algorítmico e o capítulo de soberania | gestor de rede, universidade, formulador de política **e desenvolvedor** |
| **Inteligência Artificial na Educação Básica** (48 p., 2026) | MEC / SEB, com cooperação da UNESCO | documento orientador sobre caminhos curriculares e práticas éticas; traz os quatro critérios de avaliação, os dez princípios de adoção, os documentos a exigir do fornecedor e as cláusulas de contrato | secretaria de educação, gestor escolar |

A frase que orienta os dois, e que é a nossa própria promessa: a IA deve **ampliar a
capacidade humana sem substituir a responsabilidade, a mediação pedagógica e o julgamento das
pessoas**. Quem vende autonomia de IA para escola está vendendo contra o documento (D44).

Três ideias transversais que aparecem nos dois e valem como filtro para qualquer decisão de
produto:

**Proporcionalidade.** Três perguntas que o gestor vai fazer: (1) o dado coletado é
estritamente necessário? (2) a complexidade e o risco da ferramenta são compatíveis com o
problema, ou uma solução mais simples resolveria? (3) o grau de supervisão previsto é adequado
ao impacto? Toda Tech Spec que cria campo pessoal ou chamada de IA responde essas três.

**Melhor interesse da criança.** "Esta solução prioriza o bem-estar e o desenvolvimento dos
estudantes, ou atende primordialmente a interesses do fornecedor?" É a pergunta que o gestor
usa da análise contratual até a sala de aula.

**Ganho contra a alternativa não digital.** O MEC recomenda adotar recurso com IA **apenas se
houver ganho educacional significativo em relação a recurso não digital**, e cita pesquisa
(SARESP/Gepud, 2025) que não achou associação entre adoção de plataforma e resultado. Nosso
argumento não pode ser "tem IA": é tempo do professor devolvido e diagnóstico que a escola não
tinha, medidos.

---

## 2. Os quatro critérios-chave, e como estamos em cada um

O documento da SEB dá à escola quatro blocos de perguntas. Esta é a nossa resposta honesta
hoje — inclusive onde ela é ruim.

### Critério 1 — Consistência e continuidade pedagógica

| A pergunta da escola | Nossa resposta | Estado |
|---|---|---|
| Os objetivos pedagógicos estão claros e alinhados ao currículo da rede? | Todo material é classificado por série, disciplina, capítulo e habilidade da BNCC (D6), e a saída cita a página | por desenho, F4 |
| O valor pedagógico é validado por pesquisa **não financiada pelo desenvolvedor**? | **Não temos.** Nenhuma evidência independente existe | **lacuna** → seção 12 |
| Como o recurso equilibra personalização com aprendizagem colaborativa? | O tutor é individual; nada no produto estimula substituir trabalho coletivo. Não temos resposta forte, e o MEC destaca esse risco | lacuna parcial |
| O conteúdo automatizado promove aprendizado crítico ou padronização? | O tutor conduz por perguntas e exige que o aluno explique com as próprias palavras; nunca entrega resposta pronta | por desenho, F9 |
| Há protocolo de revisão técnica do conteúdo gerado antes do uso? | Sim: toda saída que chega ao aluno passa por aprovação humana registrada (D7, D47) | por desenho |
| A adoção fragiliza soluções pedagógicas já usadas no território? | Somos neutros em relação ao material: trabalhamos com o que a escola já usa (D5) | por desenho |
| As cláusulas e o orçamento são transparentes e não levam à dependência? | Preço por aluno com uso incluso, sem crédito visível (D40); e a D63 obriga exportação em formato aberto a qualquer momento | por desenho |
| **O recurso permite baixar dados e histórico de uso em formato aberto?** | Sim (D63). Era ponto fraco antes desta revisão | decidido, a implementar (F3) |

### Critério 2 — Bem-estar e desenvolvimento dos estudantes

| A pergunta da escola | Nossa resposta | Estado |
|---|---|---|
| Quais os benefícios cognitivos comprovados? | Sem evidência própria; usamos literatura de tutoria socrática e o risco de "descarregamento cognitivo" como desenho | lacuna → seção 12 |
| A proposta respeita o tempo adequado de exposição às telas? | Teto de 60 trocas por dia por aluno (D38), tutor em sala mediado pelo professor, modo casa desligado por padrão (D19) | por desenho |
| A plataforma gera conteúdo adequado à faixa etária e à etapa? | Linguagem testada para 11 anos (D43); conteúdo vem do material da própria série | por desenho |
| Estimula expressão pessoal e criatividade? | Fraco: hoje o produto é diagnóstico e apoio, não criação do aluno | lacuna reconhecida |
| Há impacto na motivação e na autoestima, sobretudo de quem tem baixo rendimento? | O aluno nunca vê ranking, média de turma nem dado de colega (regra 50, item 9). Diagnóstico é por habilidade, formulado como próximo passo, não como rótulo | por desenho |
| Desenvolve autonomia ou dependência tecnológica? | É a razão do tutor socrático e do teto diário; e a D65 põe o próprio tutor explicando seus limites | por desenho |

### Critério 3 — Bem-estar e integridade do trabalho docente

| A pergunta da escola | Nossa resposta | Estado |
|---|---|---|
| Respeita a autonomia didático-pedagógica do professor? | O Planejador só age sob pedido (D32); nada é publicado sem ele; e a D64 garante que **recusar a ferramenta não gera indicador nem alerta** | por desenho |
| O professor tem acesso aos critérios da avaliação automática e às fontes usadas? | Sim: gabarito, critério e página de origem em toda saída | por desenho |
| O professor consegue alterar nota, avaliação e devolutiva automáticas? | Sim, e em discursiva a nota é **sempre** dele, sem valor sugerido (D55) | por desenho |
| Os dados coletados, e o uso deles pela gestão, comprometem a autonomia docente? | Painel do professor é dele primeiro; a coordenação vê agregado e abre nominal só com auditoria (D45); sem ranking (D64) | por desenho |
| O uso está reduzindo ou aumentando a carga de trabalho? | É a nossa métrica de produto número um, e ela precisa ser medida no piloto, não afirmada | a medir no piloto |
| Há formação adequada para o professor usar? | Hoje não existe material de formação | **lacuna** → seção 12 |

### Critério 4 — Segurança, privacidade e equidade

| A pergunta da escola | Nossa resposta | Estado |
|---|---|---|
| Atende à LGPD? | `docs/lgpd.md` inteiro, com mapa de dados campo a campo | por desenho |
| Atende ao ECA Digital? | `docs/regulacao.md` seção 2, artigo por artigo | por desenho, com 4 itens a confirmar |
| Como é garantida a segurança dos dados sensíveis? | Adaptação necessária em vez de diagnóstico (D35); criptografia; escopo de tenant; auditoria de acesso | por desenho |
| Há proteção contra conteúdo inadequado nas respostas? | Escopo escolar aplicado no servidor, recusa fora de escopo, encaminhamento a humano (D36) | por desenho, F9 |
| Há filtros para linguagem imprópria ou perigosa? | Sim, e o texto de acolhimento é revisado por orientação educacional | a implementar, F9 |
| Existem mecanismos de denúncia e bloqueio de conteúdo? | **Passa a existir** (D61): canal no produto para aluno, professor, coordenação e família, com retirada e recurso (ECA art. 28 a 30) | decidido, a implementar |
| O contrato prevê responsabilização por incidente? | No `TODO.md`, com advogado | pendente |
| Há documentação acessível sobre o funcionamento do algoritmo, em linguagem simples, para a comunidade escolar? | **Passa a existir** (D61): o dossiê da seção 5 | decidido, a produzir |
| Há mecanismos para identificar e corrigir discriminação algorítmica? | A AIA da seção 7, com equidade como critério decisório (seção 8) | decidido, a implementar |
| Oferece recursos para estudantes com necessidades específicas? | O agente Adaptador (D32, D35) | por desenho, F11 |

---

## 3. Os dez princípios de adoção, e o que cada um exige de nós

Do documento da SEB, capítulo 3.3. Ordenados como lá.

| # | Princípio | O que ele nos obriga a fazer |
|---|---|---|
| 1 | **Intencionalidade pedagógica e centralidade humana** | Declarar objetivo pedagógico de cada ferramenta, e garantir que o professor possa não usar sem penalidade (D64) |
| 2 | **Salvaguardas de aprendizagem e pensamento crítico** | Tutor socrático, reflexão obrigatória antes de entregar, e nenhuma funcionalidade que faça a tarefa pelo aluno. Evitar "descarregamento cognitivo" é requisito, não slogan |
| 3 | **Confiabilidade pedagógica e monitoramento** | Rigor técnico com fonte citada; o **modelo pedagógico precisa ser compreensível à equipe da escola** e adaptável ao currículo; aprendizagens monitoradas com indicador e revisão periódica |
| 4 | **Letramento em IA** | A adoção vem acompanhada de formação e de ensino crítico sobre a tecnologia (D65; `docs/regulacao.md` seção 9) |
| 5 | **Agência e participação** | Estudante, professor, família e responsável participam do ciclo de decisão sobre adotar IA. Nós fornecemos o material da **consulta prévia** à comunidade (gestão democrática, art. 206, VI, da Constituição) |
| 6 | **Proteção de dados e não-vigilância** | Coleta mínima; **reconhecimento facial, detecção de emoção e monitoramento comportamental automatizado não são recomendados** — no nosso caso, proibidos (D57) |
| 7 | **Equidade** | Priorizar recurso acessível e adaptável; identificar e neutralizar viés de gênero, raça e classe; diversidade epistêmica (Leis 10.639/2003 e 11.645/2008) → seção 8 |
| 8 | **Bem-estar** | Rejeitar design persuasivo, publicidade direcionada e coleta comercial; equilibrar com momentos não mediados por tecnologia (D59) |
| 9 | **Sustentabilidade e não-dependência** | Continuidade pedagógica sem dependência de fornecedor: exportação aberta, padrões abertos, nada que prenda a escola (D63). Inclui impacto ambiental |
| 10 | **Fundamentação, transparência e explicabilidade** | Evidência de benefício; quando ela falta, **a adoção é piloto declarado**, com métrica, cronograma e reversibilidade. Clareza sobre objetivo, critério de funcionamento, fonte de dado e limite operacional, com condição de auditar decisão automatizada |

O princípio 10 é o que descreve o nosso piloto de 2027 (D1): é um piloto declarado, com
métrica e reversibilidade — e isso precisa estar escrito na proposta, não implícito.

**O quadro "o que a IA faz e o que só o ser humano pode fazer"** (mesmo capítulo) é a melhor
tradução em português do nosso posicionamento, e serve de texto de interface e de venda: a IA
identifica correlação mas não compreende causa; não checa espontaneamente o que produz e pode
gerar informação falsa; recombina padrões, e tende a homogeneizar; pode inferir emoção, mas não
sente; **não tem moralidade — a responsabilidade final é sempre humana.**

---

## 4. Child Rights by Design — o checklist que recai sobre o fornecedor

O Anexo 2 do documento da SEB adapta os onze princípios do *Child Rights by Design* (5Rights
Foundation, 2023, sobre a Convenção da ONU e o Comentário Geral nº 25) em checklist de
contratação, e manda o gestor exigir do fornecedor evidência de benefício pedagógico,
avaliação de impacto sobre direitos da criança e conformidade legal. Cita também o *Children &
AI Design Code* (5Rights, 2025) como protocolo para quem desenvolve IA que afeta criança —
**não lido ainda** (`TODO.md`).

| # | Princípio | Onde ele vive no produto |
|---|---|---|
| 1 | Equidade e diversidade | seção 8; regra 50 (Chromebook fraco, acessibilidade, rede lenta) |
| 2 | Melhor interesse da criança | `docs/lgpd.md` (art. 14); D57 |
| 3 | Consulta | material de consulta à comunidade escolar (D61) |
| 4 | Adequação à idade | faixa 11 a 18 declarada; linguagem testada para 11 anos (D43) |
| 5 | Responsabilidade | `docs/regulacao.md`; canal de denúncia e reparação (D61) |
| 6 | Participação | aluno explica com as próprias palavras; caminho de contestação de sinal e diagnóstico (D60) |
| 7 | Privacidade | privacidade por padrão (ECA art. 7º); mapa de dados |
| 8 | Segurança | filtro de conteúdo, escopo no servidor, encaminhamento a humano (D36) |
| 9 | Bem-estar | sem design compulsivo (D59) |
| 10 | Desenvolvimento | tutor que ensina em vez de entregar |
| 11 | Agência | sem dark pattern; sem publicidade (D57, D59) |

---

## 5. O dossiê de conformidade — o que entregamos à escola

O documento da SEB lista o que o gestor deve **exigir do desenvolvedor**. A lista é curta e
nós não temos quase nada dela pronto. Ela passa a ser entregável de produto (D61), versionada
no repositório, gerada para cada escola e revista a cada mudança de modelo:

| Documento | O que precisa dizer | Onde nasce |
|---|---|---|
| **Declaração de propósito** | para que serve, a quem se destina, **para quais faixas etárias foi projetado** | este repositório; `docs/visao-produto.md` |
| **Evidência de eficácia pedagógica** | relatório ou teste que sustente a alegação de impacto — de preferência **não financiado por nós** | não existe; seção 12 |
| **Documentação do funcionamento** | como o sistema funciona, **incluindo os dados usados no treinamento** (no nosso caso: não treinamos; usamos modelo de terceiro, com o material da escola por recuperação) | `docs/arquitetura.md` + resumo em linguagem simples |
| **Relatório de conformidade** com LGPD e ECA Digital | artigo por artigo, com o que fazemos em cada um | `docs/lgpd.md` + `docs/regulacao.md` seção 2 |
| **RIPD** | relatório de impacto à proteção de dados pessoais | F3/F16, antes do piloto |
| **Avaliação de risco aos direitos de crianças e adolescentes** | a AIA da seção 7, com foco em direito, não só em dado | antes do F9 |
| **Fluxograma do algoritmo, do uso de dados e do modelo pedagógico**, em linguagem acessível | uma página que a coordenação mostra em reunião de pais | produto de marketing e de conformidade ao mesmo tempo |
| **Relatório de uso** compreensível por não especialista | o que a IA fez, quem aprovou, quanto foi usado | é a tela de governança do F12, exportada |
| **Material de comunicação com a comunidade escolar** | apoio à escola para explicar a adoção a professores e famílias | isca comercial (`docs/negocio.md`) |

Duas consequências que valem registrar: o dossiê **é** o F12 exportado mais três documentos
escritos, ou seja, não é trabalho jogado fora; e ele é o que transforma "só 22% das escolas
têm política de IA" em venda, porque a escola precisa de documento, não de discurso.

---

## 6. As cláusulas que a escola vai querer no contrato

Lista do documento da SEB, com o que já cumprimos por desenho e o que é trabalho novo.
O contrato em si é item do `TODO.md`, com advogado.

| Cláusula sugerida pelo MEC | Situação |
|---|---|
| Coleta limitada ao estritamente necessário ao funcionamento pedagógico | cumprida por desenho (`docs/lgpd.md` seção 3) |
| Proibição de usar dado de aluno e de professor para fim comercial, publicidade ou **treinamento de modelo** sem consentimento explícito | cumprida por desenho (D57; `docs/lgpd.md` seção 6) |
| Avisos de privacidade claros, em linguagem apropriada à faixa etária | **novo**: hoje não existe texto para aluno de 11 anos |
| Mecanismos de segurança contra uso malicioso: desativação de salvaguarda, ataque adversário, manipulação de dado | parcial: escopo no servidor existe; teste adversário do tutor é requisito do F9 |
| Filtros integrados contra conteúdo inadequado (violência, pornografia, automutilação) | a implementar no F9 |
| **Alerta em tempo real ao supervisor** quando conteúdo proibido for acessado ou gerado | parcial: os sinais do tutor (F10) cobrem parte; "conteúdo proibido gerado por nós" precisa de alerta próprio |
| Registros de atividade acessíveis à equipe gestora | é a auditoria do F3 e a governança do F12 |
| Compromisso com correção de falha e **teste de segurança antes de atualização** | processo: entra no portão de qualidade e no runbook |
| Fluxograma do algoritmo em linguagem acessível | seção 5 |
| Relatórios de uso em formato compreensível | seção 5 |
| Apoio na comunicação com a comunidade escolar | seção 5 |

---

## 7. Avaliação de Impacto Algorítmico, em seis etapas

O Referencial (cap. 10.2) define a AIA como procedimento sistemático, documentado e preventivo,
mais amplo que o RIPD: além do risco de tratamento de dado, ela olha **viés, equidade e
impacto pedagógico** de decisão automatizada. O ECA Digital (art. 8º, I, e art. 16) já obriga
gerenciamento de risco e relatório de impacto; a AIA é como o MEC espera ver isso feito.

Adotamos o roteiro dele, com um documento por funcionalidade de alto risco — Tutor,
correção de objetiva, diagnóstico por habilidade, sinais e alertas, adaptação (D60):

| Etapa | O que produz | Nosso gancho |
|---|---|---|
| **1. Justificação e escopo** | qual problema pedagógico resolve, resultado esperado, **e o que a ferramenta não deve fazer**; análise de alternativa menos invasiva | é o PRD, com uma seção nova de escopo negativo |
| **2. Análise dos dados e do modelo** | origem, composição e qualidade do dado; representatividade da população atendida; documentação técnica e funcional do modelo | aqui declaramos que **não treinamos**: o modelo é de terceiro e o conteúdo vem do material da escola por recuperação. Isso simplifica a etapa e não a dispensa |
| **3. Identificação e avaliação de riscos** | precisão e confiabilidade, segurança, privacidade, viés e discriminação, responsabilização, cada um com probabilidade e impacto | `docs/lgpd.md` seção 4 já é metade disso |
| **4. Estratégias de mitigação** | por risco: anonimização, controle de acesso, retenção, criptografia, teste de vulnerabilidade, plano de incidente, e **supervisão humana significativa** em decisão de alto impacto; mais o direito de revisão da LGPD, com procedimento acessível | já é o desenho do produto; falta escrever |
| **5. Validação e auditoria da equidade** | métrica **desagregada** por grupo, quando viável e juridicamente justificado, mais escuta de professor e gestor | seção 8; é a etapa que não sabemos fazer ainda |
| **6. Monitoramento contínuo e governança** | indicador periódico, revisão regular, canal de contestação, e procedimento de **atualização, suspensão ou descontinuidade** do sistema | o F12 mede; falta o procedimento escrito de suspender um agente |

Do lado da escola, o Referencial recomenda um **Comitê Interdisciplinar de Validação e
Monitoramento de IA** (gestão, pedagogia, dado, jurídico e comunidade escolar) para conduzir
ou validar a AIA. Isso é oportunidade comercial direta: a escola que compra de nós precisa
montar esse comitê, e quem entrega o material pronto do comitê entra na reunião como parceiro,
não como fornecedor.

E a atribuição de papéis é a nossa: no público, **secretaria e escola são controladoras, o
fornecedor é operador** — igual ao que já está em `docs/lgpd.md` seção 1.

---

## 8. Equidade não é seção final: é critério de veto

O trecho mais duro do Referencial para quem vende IA no Brasil, resumido sem suavizar:

- a maioria dos modelos de linguagem é treinada no Norte Global, com predominância de inglês,
  o que produz **sub-representação estrutural do Brasil** e da sua diversidade;
- isso gera viés concreto: sistema de avaliação textual que **penaliza construções linguísticas
  mais frequentes entre estudantes negros**; recomendação de trajetória que reforça estereótipo
  de gênero; saberes indígenas e quilombolas invisibilizados ou folclorizados; aluno surdo sem
  acessibilidade real;
- **a identificação de viés discriminatório significativo pode ensejar a recusa da
  implementação ou a descontinuidade** do sistema já em uso;
- **o ônus de demonstrar a mitigação recai sobre o desenvolvedor e o fornecedor**, com
  "evidências robustas, transparentes e auditáveis de que seus sistemas foram testados em
  cenários compatíveis com a diversidade da população estudantil brasileira".

Consequências que já cabem no nosso processo:

1. A avaliação de modelos (`docs/avaliacao-de-modelos.md`) passa a ter critério de equidade e
   de português brasileiro com **variação regional e registro informal**, não só acerto médio.
   Modelo que só vai bem com aluno que escreve como livro didático é reprovado (D60).
2. O diagnóstico por habilidade e os sinais do tutor precisam de checagem desagregada; e como
   **não guardamos raça, renda nem território** (e não vamos guardar), a desagregação possível
   é por turma, série e escola, com escuta qualitativa de professor. Isso precisa estar escrito
   na AIA, com a limitação declarada — o MEC admite "quando viável e juridicamente
   justificado".
3. Acessibilidade sai de "boa prática de frontend" e entra como requisito de equidade: leitor
   de tela, contraste, teclado, e o agente Adaptador como funcionalidade de inclusão, não de
   marketing.

---

## 9. Soberania de dado e de modelo

O capítulo 10.3 do Referencial trata dependência de corporação estrangeira como risco de
Estado: cerca de **R$ 23 bilhões** em contratação pública de tecnologia com empresas
estrangeiras entre 2014 e 2025, dado educacional de criança hospedado fora do país sob
jurisdição estrangeira (cita o **Cloud Act** dos EUA), e modelo fechado que impede auditoria.
Recomenda compra pública como instrumento de desenvolvimento nacional, nuvem soberana, e
tecnologia **aberta e auditável**, alinhada ao Plano Brasileiro de Inteligência Artificial.

Para nós isso é, ao mesmo tempo, uma exigência e a melhor vantagem competitiva disponível:

- hospedagem em região Brasil já é decisão (D28), e o provedor é escolhido por critério fixo
  (D42);
- **conversa de aluno só em provedor de modelo com processamento no Brasil** (D62). Tarefa sem
  dado pessoal — gerar prova a partir de trecho de material, resumir conteúdo público — pode
  usar provedor fora, com cláusulas-padrão da ANPD e informação à escola;
- isso favorece a Maritaca (Sabiá) como principal do Tutor, e deixa o Gemini como reserva ou
  como modelo de tarefa sem dado pessoal. É a D37 com um critério novo, mais forte que custo;
- e, na rede pública, "produto brasileiro, dado no Brasil, modelo processado no Brasil" é
  resposta pronta a uma exigência que o concorrente estrangeiro não tem como dar
  (`docs/negocio.md`).

---

## 10. Sandbox regulatório e piloto na rede pública

O Referencial (cap. 10.4) recomenda que redes usem **sandbox regulatório** — ambiente
controlado de testagem, iniciado por chamamento público — para experimentar IA com segurança
jurídica. Isso muda como a entrada na rede pública pode ser desenhada: em vez de esperar
licitação, existe caminho de **chamamento público para teste controlado**, que é exatamente o
formato do nosso piloto gratuito de 2027 (D1).

Vale como tarefa comercial: perguntar à secretaria de Joinville se há ou pode haver chamamento
nesse formato, e escrever a proposta do piloto na linguagem do princípio 10 (piloto declarado,
com métrica, cronograma e reversibilidade).

---

## 11. Onde isso entra no roadmap

| Fase | O que esta leitura acrescenta |
|---|---|
| **F3 — LGPD e titular** | exportação em formato aberto de dado e histórico de uso (D63); canal de denúncia e retirada com recurso (D61); registro da validação humana |
| **F5 — camada de IA** | critério de equidade e de português brasileiro na avaliação de modelos; roteamento por soberania: conversa de aluno em provedor no Brasil (D62) |
| **F6 — avaliação e correção** | fim da devolutiva de discursiva por IA até parecer (D55); registro de validação qualificada na objetiva (D56) |
| **F9 — ambiente do aluno** | agente com identidade que nunca se passa por pessoa (D58); sem design de uso excessivo (D59); filtro de conteúdo; AIA do Tutor antes de existir |
| **F11 — agentes** | AIA por agente de alto risco; procedimento de suspensão de agente |
| **F12 — governança** | o dossiê é esta tela exportada; explicação e contestação em linguagem comum; adoção só agregada (D64) |
| **F16 — hardening e conformidade** | RIPD + AIA assinados; teste adversário; revisão do dossiê |

---

## 12. O que a escola vai perguntar e nós não sabemos responder

Lacunas reais, sem maquiagem. Cada uma tem item no `TODO.md`.

1. **Evidência de eficácia pedagógica independente.** O MEC pede pesquisa não financiada pelo
   desenvolvedor, e a Letrus mostrou que estudo de impacto abre secretaria. Proposta: desenhar
   com a escola piloto de 2027 uma medição simples e pré-registrada — tempo de preparação e
   correção do professor antes e depois, e desempenho por habilidade em turmas com e sem uso —
   com alguém de fora assinando o desenho. Sem isso, o critério 1 fica em branco na avaliação
   de qualquer secretaria.
2. **Material de formação do professor.** Exigido pelo princípio 4 e pelo critério 3. Não temos
   nada. É trabalho de conteúdo, não de código, e vira isca comercial.
3. **Aviso de privacidade para aluno de 11 anos.** Texto em linguagem de faixa etária, que não
   existe em lugar nenhum do produto.
4. **Validação desagregada de equidade** sem coletar dado sensível. Sabemos que precisa
   existir; não sabemos ainda qual é o método aceitável.
5. **Como respondemos a "o recurso equilibra personalização com aprendizagem colaborativa?"**
   Hoje, mal. Não há nada no produto que apoie trabalho em grupo, e o MEC trata individualização
   excessiva como risco.
6. ***Children & AI Design Code*** (5Rights, 2025), citado como protocolo para desenvolvedores.
   Não lido.

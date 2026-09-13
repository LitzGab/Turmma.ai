# Educa.ia — Mapa do projeto

> Documento-base para o Joaquim mapear o sistema. Consolida a call de 12/09/2026, o desenho do Excalidraw, o benchmark de concorrentes e as decisões tomadas até 13/09/2026. Nome do produto ainda provisório.

---

## 1. Em uma frase

Um **time de agentes de IA para a escola**: o professor tem um chat e ferramentas que produzem e corrigem a partir do material que a escola já usa, o aluno usa IA em sala com o professor vendo, o coordenador governa o uso de IA e a qualidade do ensino, e a família acompanha. Agentes executam tarefas e avisam quem precisa saber.

---

## 2. Origem

- **Inspiração:** empresas que vendem "agentes por função" que agem como funcionários digitais (vendas, atendimento, marketing, RH). Nossa versão é um time de agentes focado em um nicho: **educação básica**.
- **Desenho da call (Excalidraw):** barra lateral com **Home (= Chat)**, **Ferramentas**, **Calendário**, **Agentes ("Seu time": Pipo, Waz, Maky…)** e **Histórico de chats**.
- **Três essenciais definidos na call:**
  1. Conexão com o material de estudo da escola (ex.: sistema de ensino já adotado).
  2. Gerar valor para professor, aluno, pai e coordenador/diretor.
  3. Gerar segurança nos pais e professores (IA restrita a assuntos escolares, professor no comando).

---

## 3. Stakeholders

| Papel | Usa? | Paga? | O que ganha |
|---|---|---|---|
| **Coordenador / diretor** | Sim | Decide a compra | Governança: quem usa IA, como, com que resultado; visão por professor e turma; alertas |
| **Professor** | Sim (universal) | Não | Tempo: prova, atividade, correção, plano de aula e adaptação a partir do material da escola; rotina no calendário; agentes que executam e avisam |
| **Aluno (Ensino Médio)** | Sim (universal) | Não | Tutor que ensina em vez de dar resposta, atividades e provas no Chromebook, restrito ao conteúdo escolar |
| **Pai / família** | Depois | Sim, via mensalidade (escola particular) | Acompanhamento: nota, tarefa entregue ou não, alertas. Canal WhatsApp fica para fase posterior |
| **Prefeitura / rede pública** | Não diretamente | Sim, por contrato | Governança de rede e IA supervisionada nas escolas municipais |

Regra de ouro da call: **professor e aluno precisam gostar e usar; o pai e o diretor precisam confiar; quem paga é o pai (particular) ou a prefeitura (pública)**.

---

## 4. Problemas que resolvemos

1. **Uso indevido da IA pelo aluno:** cola e "pegar a resposta sem pensar".
2. **Falta de controle do educador** sobre o uso de IA pelo aluno.
3. **Falta de governança** dos stakeholders sobre a qualidade do ensino.
4. (Da call) **Tempo do professor** consumido por planejamento, montagem e correção.
5. (Da call) **Família sem visibilidade** do que acontece na escola.

---

## 5. Decisões tomadas (13/09/2026)

- **Sistema inteiro, não MVP.** Não cortar escopo por conta própria; construir por partes, mas com o sistema completo como alvo.
- **Escolas digitalizadas com Chromebook em sala** (particulares, cidades como Joinville). Nunca depender do celular do aluno.
- **Ensino Médio** como faixa inicial.
- **Sem integração com Geekie ou qualquer outra ferramenta.** Apenas um **scraper** do material didático que a escola já paga, usado como base para provas, atividades e dúvidas. Geekie foi só exemplo. Desenho: a ingestão é um pipeline único que aceita tanto o que o scraper puxa quanto PDF/apostila subida à mão, para a escola não travar se um site mudar.
- **Identidade do aluno:** coordenador sobe a lista de nomes, aluno reivindica o seu pelo link da sala, professor aprova. Substitui a ideia de "aluno só coloca o nome".
- **LGPD e consentimento:** a escola compra e é a controladora; padrão B2B; contrato cobre o consentimento.
- **WhatsApp:** não agora. Fase posterior.
- **Autonomia dos agentes:** definir depois, por partes.
- **Onboarding sem cadastro individual:** coordenador cria séries e turmas → professor entra por link de convite e escolhe a disciplina → professor envia o link da sala ao aluno.
- **Primeiro cliente:** há contatos possíveis (SENAI, prefeitura de Joinville), mas **não são certos e nada é decidido com base nisso**.
- **Stack:** ainda não definida.
- **Nome:** definir juntos. Checar INPI e domínio; já existem "IA Educa Brasil" e "Eduka.ai" no mercado.
- **Não reaproveitar** nenhum produto anterior como base. Construção do zero.

---

## 6. Mapa do sistema (módulos)

### 6.1 Base de conhecimento da escola
- Ingestão do material didático (scraper ou upload) → extração → indexação por **série, disciplina, capítulo e habilidade BNCC**.
- Calendário escolar, turmas, disciplinas, professores, alunos.
- Tudo que a IA gera nasce daqui: prova, atividade, dúvida, plano de aula, adaptação.
- Requisitos: versionamento do material, rastreabilidade (de qual página veio a questão), reprocessamento quando o material muda.

### 6.2 Estrutura e convites (onboarding)
- Coordenador cria a escola, séries e turmas, sobe a lista de alunos por turma.
- Professor recebe link de convite, escolhe a disciplina e já vê todas as turmas para as quais foi convidado.
- Aluno recebe o link da sala, reivindica o próprio nome na lista, professor aprova.
- Resultado: escola inteira cadastrada e conectada sem registrar ninguém um a um.

### 6.3 Home = Chat
- Um chat por persona, com o contexto do papel, da turma e do material.
- Tudo que existe nas ferramentas pode ser feito pelo chat. As ferramentas existem para quem não quer usar chat.
- Histórico de conversas por usuário.

### 6.4 Ferramentas (fluxos guiados)
- Gerar prova a partir do material (com gabarito, versões, exportação).
- Gerar atividade e lista de exercícios.
- Corrigir prova e atividade (objetiva e dissertativa) com devolutiva.
- Adaptar conteúdo e prova para necessidades específicas (PEI).
- Plano de aula e sequência didática.
- Simulado ENEM a partir de banco de questões, com correção imediata.
- Redação com correção por competência.
- Cada ferramenta gera um artefato salvo, ligado à turma e ao calendário.

### 6.5 Calendário do professor
- Rotina por escola e turma: o que precisa ser feito em cada dia.
- Ligado a avaliações, entregas e ao que os agentes concluíram.
- Visão semanal e diária.

### 6.6 Agentes ("Seu time")
- Executam tarefas e **avisam** ("terminei de corrigir", "3 alunos não entregaram").
- Cada agente tem nome, avatar, escopo e nível de autonomia.
- Candidatos iniciais (a validar): **Corretor**, **Planejador**, **Monitor de turma**, **Tutor do aluno** (supervisionado), **Mensageiro da família** (fase WhatsApp).
- Regra estrutural: **o agente faz, o humano aprova antes de valer** onde houver nota, comunicação com família ou decisão sobre o aluno. Ver seção 9.

### 6.7 Ambiente do aluno (Chromebook em sala)
- Tutor que **não entrega a resposta**: conduz por perguntas, mostra o caminho, referencia o material.
- Atividades e provas atribuídas pelo professor, feitas na plataforma.
- Assunto restrito ao conteúdo escolar da turma.
- **Modo sala** (professor vê tudo em tempo real) e **modo casa** (registro e resumo para o professor).
- Sinais para o professor: quem está travado, quem pediu resposta pronta, dúvidas mais frequentes.

### 6.8 Governança
- **Coordenador/diretor:** uso de IA por professor e turma, desempenho por turma e habilidade, alertas (prova fácil demais, turma com queda, aluno em risco), auditoria do que a IA gerou e quem aprovou.
- **Professor:** visão da turma, atividades pendentes, entregas, dúvidas do dia.
- **Pai:** nota, tarefa entregue ou não, alertas. Fase posterior, junto com WhatsApp.

### 6.9 Administração e conta
- Escola como conta (multi-tenant), contrato, plano e créditos.
- Logs de IA (prompt, modelo, custo, quem aprovou).
- Exportação de dados e exclusão a pedido da escola (LGPD).

---

## 7. Fluxos-chave para mapear

1. **Onboarding por convite** (coordenador → professor → aluno), incluindo aprovação de identidade.
2. **Ingestão do material** (scraper ou upload) até virar base consultável por série e disciplina.
3. **Professor gera uma prova** a partir do material, revisa, aplica na turma e recebe correção.
4. **Aluno tira dúvida em sala** no Chromebook, com o professor vendo em tempo real.
5. **Correção e devolutiva:** agente corrige, professor aprova, aluno recebe, coordenador vê o agregado.
6. **Coordenador acompanha uma turma** e recebe um alerta acionável.
7. **Agente executa e avisa** (exemplo: Monitor de turma detecta 3 alunos sem entrega e propõe ação).

---

## 8. Regras de negócio derivadas de regulação

- **CNE, diretrizes de IA na educação (aprovadas em 01/09/2026, 12 meses para adequação):** tutor digital e personalização são risco moderado (permitidos); correção automática e atribuição de nota são alto risco e exigem **supervisão humana**; decisões autônomas de aprovação são proibidas; IA generativa sem supervisão é vedada na educação infantil e anos iniciais.
  - Consequência: nota nunca é publicada sem um humano aprovar; tutor do aluno sempre sob visibilidade do professor.
- **Lei 15.100/2025 (celulares):** aparelho fora da sala. Consequência: ambiente do aluno é web em Chromebook.
- **LGPD, dados de menores:** escola é controladora; não usar dados de alunos para treinar modelos; logs e exclusão a pedido.
- **Só 22% das escolas têm guia de uso de IA** (Cetic 2025). O painel de governança é a resposta que a escola precisa dar.

---

## 9. Autonomia dos agentes (a definir)

Framework proposto para a discussão:

| Nível | O agente… | Exemplos candidatos |
|---|---|---|
| **Executa e registra** | Faz sem pedir e deixa rastro | Indexar material novo, gerar rascunho de prova, resumir dúvidas do dia |
| **Executa e avisa** | Faz e notifica quem precisa saber | Corrigir objetivas (rascunho de nota), sinalizar aluno travado, lembrar entregas |
| **Propõe e espera aprovação** | Prepara tudo e aguarda um humano | Publicar nota, enviar mensagem à família, adaptar prova de um aluno, plano de recuperação |
| **Nunca faz** | Fora do escopo | Decidir aprovação/reprovação, vigilância emocional, falar de assunto fora da escola |

A lista final de agentes e o nível de cada um ficam para a próxima etapa.

---

## 10. Modelo de negócio e preço (tese)

- **Escola particular:** ~R$ 30 por aluno/mês, repassado ao pai na mensalidade (≈ 3% de uma mensalidade de R$ 1.000; abaixo do reajuste médio de 9,8% previsto para 2026). Escola inteira ≈ R$ 10 mil/mês.
- **Prefeitura / rede:** contrato com uso ilimitado, faixa hipotética de R$ 5 a 10 por aluno/mês.
- **Créditos** para uso avulso; contrato ilimitado para escolas e redes.
- **Ideia inicial da call** (referência histórica): R$ 250/professor + R$ 100/aluno.
- **Âncoras do benchmark:** ferramentas de professor saem por R$ 1 a 7 por aluno/mês quando normalizadas para a escola; sistemas de ensino levam R$ 50 a 135 por aluno/mês, mas incluem material e são pagos pela família. **R$ 30 ocupa a faixa vazia entre os dois.** Teto psicológico para "IA do professor": R$ 39,90/mês (Teachy).
- **Custo de IA:** modelo caro só para tarefas complexas (HTML, apresentações); modelo barato para planejar, montar e corrigir. Definir orçamento de tokens por aluno (tutor do aluno gasta mais que geração de prova).

---

## 11. Mercado em números (Censo Escolar 2025 e outros)

- 46,0 mi de matrículas na educação básica; 178,8 mil escolas; 2,41 mi de docentes; 94,5% das escolas com internet.
- Rede privada: 9,25 mi de alunos em 41,7 mil escolas. Ensino Médio privado: 1,03 mi.
- Redes municipais: 23,1 mi de alunos; 5.570 municípios.
- **TAM privada a R$ 30/aluno/mês: R$ 3,3 bi/ano.** Municipal a R$ 5-10: R$ 1,4 a 2,8 bi/ano.
- Adoção: 79% dos professores e 84% dos alunos já usaram IA (Fundação Itaú, 2025); professores brasileiros lideram a OCDE (56% vs 36%, TALIS 2024); só 19% dos alunos receberam orientação.
- Edtech Brasil: US$ 6,0 bi (2025) → US$ 15,6 bi (2034); K-12 é 42%. Só 4,2% das edtechs vendem para governo.

---

## 12. Concorrência (resumo do benchmark)

Benchmark completo, com 17 dossiês e radar de 16 emergentes: **https://educa-ia-benchmark.vercel.app** (código em `benchmark/` neste repositório).

**Leituras que orientam o produto:**
- **Ninguém vende agentes autônomos.** Toda IA é "assistente sob comando" acoplada a material didático (Somos/Plurall, Arco, Geekie), banco de questões (Estuda, Super Professor) ou agenda (Layers).
- **O pai é o stakeholder ausente.** Só Khanmigo tem portal do pai real, e só nos EUA.
- **WhatsApp não é canal pedagógico de nenhum player** e não aparece em nenhum anúncio.
- **Consolidação em grupos de material** (Arco comprou Eduqo, Geekie, ClassApp, isaac; Cogna comprou Redação Nota 1000; FTD comprou Estuda.com). Neutralidade e integrabilidade viram argumento de venda.
- **Governança de IA:** todos citam, só Profy tem fluxo de aprovação humana. Ninguém entrega painel de governança de IA para o coordenador.
- **Teachy é o concorrente a acompanhar:** R$ 48 mi captados, 43 anúncios ativos, único que fala com professor e diretor ao mesmo tempo, comprou a Nero.AI para personalização. Era o concorrente lembrado na call.
- **Internacionais não vêm:** nenhum vende em real ou tem canal no Brasil. Gemini grátis no Classroom e Khanmigo grátis para professores tornam "gerar plano de aula" commodity.

**O que aprender de cada um:**
- Teachy: velocidade de produto e cargo no título do anúncio.
- Profy: aprovação humana pelo coordenador do que a IA gerou.
- SchoolAI: "Mission Control", professor vendo o aluno usar IA em tempo real, alertas roteados.
- Khanmigo: tutor socrático que não dá resposta; portal do pai com histórico de chats.
- Letrus: evidência de impacto (estudo controlado) abre secretarias; preço público por aluno em pregão (R$ 85-130/aluno/ano).
- Estuda.com: provas adaptadas por IA como caso de venda; inclusão é o tema mais anunciado do momento.
- Layers: neutralidade e integrações fazem dela a camada onde os outros plugam.

---

## 13. Ideias de posicionamento e mídia (do benchmark de anúncios)

- Termos sem anunciante B2B hoje: **"agentes de IA"**, **"WhatsApp"**, **"plano de aula com IA"**, **"correção de prova com IA para escola"**.
- Promessas dominantes dos concorrentes: tempo do professor, inclusão/PEI, dados para o gestor, matrícula 2027.
- Táticas replicáveis: cargo no título ("PARA COORDENADORES"), lead magnet ("guia de uso de IA da sua escola"), webinar com data, ondas de 20-30 variações de criativo no mesmo dia.
- **Setembro é o pico de compra para o ano seguinte** (SAS, Escola da Inteligência, Sponte e lider.edu em campanha 2027).
- Venda é relacionamento e política: visitas a prefeituras, apresentação em assembleia de pais, escolas técnicas.

---

## 14. Stack e arquitetura (em aberto)

Nada decidido. Pontos que a arquitetura precisa resolver, independentemente da stack:

- **Multi-tenant** por escola, com papéis (coordenador, professor, aluno, pai, admin).
- **Pipeline de ingestão** único (scraper + upload) → extração → chunking → índice por série/disciplina/capítulo/BNCC, com rastreabilidade até a página de origem.
- **Roteamento de modelos:** barato por padrão, caro só para tarefas complexas; orçamento de tokens por aluno e por escola; logs de custo.
- **Camada de agentes** com fila de tarefas, estados (executado, aguardando aprovação, aprovado, rejeitado) e notificações.
- **Tempo real** no ambiente do aluno (professor vê a turma em sala).
- **Guardrails:** escopo de assunto por turma, detecção de pedido de resposta pronta, filtro de conteúdo.
- **Web-first** para Chromebook; sem app de celular na fase inicial.
- **LGPD:** dados de menores, não-treinamento, exclusão e exportação.
- Da call: usar APIs de modelos e "skills" reutilizáveis para gerar interfaces (HTML, apresentações) quando o resultado precisa ser bonito.

---

## 15. Roadmap de definições

| # | Definição | Responsável | Estado |
|---|---|---|---|
| 1 | Posicionamento de marca e landing page | Gabriel | Em andamento |
| 2 | Mapa do sistema e telas (a partir da seção 6) | Joaquim | A começar |
| 3 | Fluxos-chave detalhados (seção 7) | Joaquim + Gabriel | Depois do item 2 |
| 4 | Lista de agentes e nível de autonomia (seção 9) | Juntos | Depois do item 3 |
| 5 | Stack e arquitetura (seção 14) | Joaquim | Depois do item 3 |
| 6 | Modelo de dados e orçamento de IA por aluno | Joaquim | Depois do item 5 |
| 7 | Nome do produto, INPI e domínio | Juntos | Paralelo |
| 8 | Fase WhatsApp e painel do pai | Juntos | Fase posterior |

---

## 16. Perguntas em aberto

- Quais são os agentes da primeira versão e o nível de autonomia de cada um?
- Quanto do preço por aluno pode ir para custo de IA? Qual o teto de uso do tutor do aluno?
- Como o scraper lida com sistemas de ensino diferentes? Um adaptador por fonte ou extração genérica de PDF/HTML?
- O aluno tem acesso em casa desde o início ou só em sala?
- O que o coordenador precisa ver na primeira semana para renovar no ano seguinte?
- Nome e marca.

---

## 17. Referências

- Repositório: https://github.com/LitzGab/Educa.ia
- Benchmark de concorrentes: https://educa-ia-benchmark.vercel.app
- Diretrizes do CNE sobre IA (cobertura Porvir): https://porvir.org/cne-diretrizes-inteligencia-artificial-escola-universidade/
- Referencial do MEC sobre IA na educação básica: https://www.gov.br/mec/pt-br/escolas-conectadas/arquivos/ia-basica.pdf
- Censo Escolar 2025 (INEP): https://download.inep.gov.br/publicacoes/institucionais/estatisticas_e_indicadores/notas_estatisticas_censo_escolar_da_educacao_basica_2025.pdf
- Fundação Itaú, adoção de IA: https://www.fundacaoitau.org.br/noticias/educacao/84-dos-alunos-e-79-dos-professores-ja-utilizaram-ferramentas-de-ia-diz-estudo
- Cetic, TIC Educação 2025: https://cetic.br/media/pdf/analises/20260804094932_pt_br_tic_educacao_2025_coletiva_de_imprensa.pdf

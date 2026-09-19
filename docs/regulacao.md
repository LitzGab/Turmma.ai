# Regulação que vira requisito

Não é contexto de fundo. Cada item abaixo já é uma regra implementável.

> **Revisto em 19/09/2026**, com leitura das fontes primárias. O que mudou nesta revisão:
> entrou o **Decreto 12.880/2026**, que regulamenta o ECA Digital e trata explicitamente de
> IA conversacional com criança e adolescente (seção 2.3); entraram os dois documentos do
> MEC, que não são lei mas são o **roteiro de compra** da escola (`docs/conformidade-mec.md`);
> a proibição do CNE sobre discursiva e redação deixou de ser "a confirmar" e passou a
> alcançar **pré-correção e sugestão de nota** (seção 1); e apareceu um requisito novo que
> muda prioridade de roadmap: o **art. 24 do ECA Digital** (seção 2.2), sobre conta de menor
> de 16 anos vinculada à do responsável.
>
> **Lido na íntegra:** Lei 15.211/2025, Decreto 12.880/2026, Referencial do MEC (238 p.),
> *Inteligência Artificial na Educação Básica* (SEB/MEC, 48 p.).
> **Lido só por cobertura de imprensa:** o ato do CNE de 01/09/2026 — o texto oficial não
> foi publicado. O que vem dele está marcado como tal.
> **Não lido:** Guia de Classificação Indicativa do MJ (out/2025), capítulo Interatividade;
> Resolução CNE/CEB 2/2025.

---

## 0. As sete fontes, e o que cada uma obriga

| Fonte | Natureza | Desde quando | Quem fiscaliza | Onde vira requisito |
|---|---|---|---|---|
| **Diretrizes do CNE sobre IA na educação** | ato normativo do CNE, aprovado em 01/09/2026, **aguardando homologação do MEC**; 12 meses de adequação a partir da publicação | proibições tratadas como valendo já | MEC e os conselhos de educação; na prática, a própria escola | seção 1 |
| **Lei 15.211/2025 — ECA Digital** | lei | **17/03/2026** (art. 41-A, redação da Lei 15.352/2026) | ANPD | seção 2 |
| **Decreto 12.880/2026** | decreto que regulamenta o ECA Digital | 18/03/2026, data da publicação | ANPD | seção 2.3 |
| **LGPD (Lei 13.709/2018)** | lei | 2020 | ANPD | `docs/lgpd.md` |
| **Referencial de IA na Educação (MEC/SEGAPE, jul/2026)** e **IA na Educação Básica (MEC/SEB + UNESCO, 2026)** | orientação, não lei | 2026 | ninguém multa; **a escola compra por este checklist** | `docs/conformidade-mec.md` |
| **Lei 15.100/2025** — aparelho na escola | lei | 2025 | escola | seção 4 |
| **Lei 9.610/98** (autoral), **Lei 13.819/2019 + 15.231/2025** (risco à vida), **Marco Civil art. 15**, **Resolução CNE/CEB 2/2025** (Educação Digital e Midiática), **Guia de Classificação Indicativa (MJ, out/2025)** | leis e atos setoriais | — | — | seções 5, 7, 9 |

Duas conclusões de leitura que valem antes da lista:

**Nós somos "fornecedor de produto ou serviço de tecnologia da informação direcionado a
crianças e a adolescentes".** Não há dúvida interpretativa aqui: o art. 1º da Lei 15.211
alcança quem é *direcionado* a eles ou de *acesso provável* por eles, e o nosso ambiente do
aluno é direcionado a alunos de 11 a 18 anos. Ser contratado pela escola, e não pela família,
muda quem é controlador do dado (`docs/lgpd.md`), **não** muda o fato de o ECA Digital se
aplicar a nós. O que o contrato com a escola pode fazer é distribuir responsabilidade, nunca
nos tirar do escopo da lei.

**O ato do CNE é o que fecha a venda e o ECA Digital é o que fecha a empresa.** O CNE gera
exigência pedagógica e de supervisão, fiscalizada pela própria escola e pelo conselho; o ECA
Digital gera fiscalização da ANPD, com multa de até 10% do faturamento. As duas apontam para
o mesmo desenho, mas a segunda é a que tem sanção contra nós.

---

## 1. Diretrizes do CNE sobre IA na educação

**Status em 19/09/2026.** Aprovadas pelo CNE em 01/09/2026, seguem para homologação do MEC;
o prazo de adequação de 12 meses conta da publicação. Abrangem **todos os níveis, etapas e
modalidades**, e partem de uma frase que é o resumo do nosso produto: *"a Inteligência
Artificial deve ampliar as capacidades humanas e educacionais, sem substituir a
responsabilidade, a mediação pedagógica e o julgamento das pessoas."* Tratamos as proibições
como valendo desde já, porque construir contra elas e corrigir depois custa mais.

### 1.1 A classificação de risco

| Classificação | O que significa para o produto |
|---|---|
| **Baixo risco** | Organizar material, revisão textual, e qualquer uso **sem efeito sobre a avaliação**. Cabem aqui o Rotina, o calendário e a busca no material |
| **Cuidados adicionais** | Sistema que **acompanha** o estudante, faz recomendação acadêmica ou **interage continuamente** com ele. É o Tutor e o Monitor de turma: permitidos, com supervisão, revisão humana, monitoramento periódico e vedação de uso do dado para treinar modelo de terceiro |
| **Alto risco** | O que **interfere em avaliação, decisão acadêmica ou dado sensível**. É a correção de objetiva, o diagnóstico por habilidade e a adaptação por necessidade específica. Exige avaliação de impacto, explicação acessível, caminho de contestação e **validação humana efetiva, prévia, qualificada e documentada** |
| **Excessivo ou incompatível** | Pontuação social, **reconhecimento de emoções** de aluno ou de professor, vigilância biométrica contínua, **perfilização psicológica ou comportamental para fins classificatórios**, e uso de dado educacional para **publicidade direcionada ou exploração comercial**. Nada disso existe no produto, e nada disso pode ser proposto (nível 4 em `docs/agentes.md`) |
| **Vedado por etapa** | Acesso direto, autônomo ou não supervisionado a IA generativa ou conversacional na **educação infantil e nos anos iniciais, até o 5º ano**. Nosso recorte é 6º ao 9º e Ensino Médio (D43); descer de faixa reabre este item |

### 1.2 As duas proibições que mudam o produto

**Discursiva e redação: a IA não corrige, não avalia, não dá nota, não atribui conceito nem
mérito — e não faz pré-correção nem sugere nota ao professor.** Antes desta revisão tratávamos
isso como "a confirmar"; a cobertura de 01/09/2026 é explícita sobre a pré-correção e sobre a
sugestão de nota apresentada ao professor. Isso derruba a "devolutiva rascunho de discursiva"
como estava desenhada (D55, revisão da D46). O que continua permitido em discursiva e redação:

- gerar a **rubrica e os critérios** antes da aplicação, que são sobre a atividade, não sobre
  o texto de um aluno;
- organizar o lote, conferir entrega, anonimizar para correção cega;
- **e nada mais, até parecer jurídico sobre o texto oficial** (`TODO.md`).

Concorrente que hoje anuncia "corrige dissertativa com IA" (Geekie, Teachy) está do lado
errado dessa linha. Isso é argumento de venda, não só limitação nossa (`docs/negocio.md`).

**Objetiva: o professor não pode apenas clicar em "aprovar".** A IA pode apoiar a correção de
objetiva, mas o uso é de alto risco e a validação humana precisa ser **efetiva, prévia,
qualificada e documentada**. A aprovação em lote (D33) sobrevive, e passa a ter de **provar**
que houve conferência: distribuição na tela, casos destacados abertos obrigatoriamente, e
registro do que foi apresentado, do que foi aberto e de quem confirmou (D56). Um botão que
aprova tudo sem essa tela é exatamente o que a diretriz proíbe.

### 1.3 Requisitos derivados

- `Nota` só é gravada com `lancadaPor` humano preenchido
- Nenhum campo, nem interno, nem rascunho, nem log, guarda **nota, conceito ou pontuação
  sugerida pela IA para discursiva ou redação** (D55)
- A validação de correção de objetiva grava o **registro da validação**: o que foi mostrado,
  quais destaques foram abertos, quem confirmou e quando (D56)
- Toda saída de IA que chega ao aluno passa por fila de aprovação, com autor e data; a
  resposta do tutor é supervisionada em vez de aprovada (D47)
- Auditoria mostra o que a IA gerou, quem aprovou e quando
- O tutor é sempre visível ao professor: modo sala em tempo real, modo casa com registro e
  resumo
- Nenhuma funcionalidade decide aprovação, reprovação ou encaminhamento
- Diagnóstico por habilidade, sinais do tutor, Monitor de turma e alertas sobre aluno são
  tratados como **alto risco**: avaliação de impacto algorítmico antes de existirem,
  explicação em linguagem comum na tela e caminho de contestação (D60)
- Nenhuma inferência de emoção, humor, atenção ou comportamento, nem pontuação de aluno ou
  de professor por isso; nenhum dado educacional para publicidade ou fim comercial (D57)
- **A escola precisa fiscalizar o fornecedor.** A diretriz manda a escola adotar medidas de
  proteção e fiscalizar quem fornece tecnologia. Na prática, ela vai nos pedir documento: é
  o dossiê de conformidade de `docs/conformidade-mec.md` (D61)

**PL 2338/2023 (marco de IA).** Aprovado no Senado em 10/12/2024; na Câmara, o relator deixou
a votação para depois das eleições de outubro/2026. O texto do Senado classifica como alto
risco a IA usada em educação para acesso a instituições e para avaliação e monitoramento de
estudantes. Hoje é tendência, não obrigação — e o desenho que o CNE já exige de nós é mais
restritivo que ele.

---

## 2. ECA Digital (Lei 15.211/2025) e o Decreto 12.880/2026

Em vigor desde 17/03/2026, regulamentado pelo Decreto 12.880 de 18/03/2026. Fiscalização da
ANPD. É o bloco de obrigação **direta nossa**, independente do contrato com a escola.

### 2.1 O que se aplica a nós, artigo por artigo

| Artigo | Obrigação | Como cumprimos |
|---|---|---|
| **art. 3º e 7º** | Configuração **mais protetiva por padrão**, e proibição de tratar dado de menor de forma que viole direito dele | Modo casa desligado por padrão (D19); tutor restrito ao conteúdo da turma; aluno sem e-mail, CPF nem foto; nenhuma configuração nasce no nível menos protetivo |
| **art. 8º, I e II** | **Gerenciamento de risco** dos recursos e avaliação do conteúdo por faixa etária, compatível com a classificação indicativa | A AIA da D60 cobre o gerenciamento de risco; a faixa etária do recorte (11 a 18) é declarada no dossiê, e a linguagem do tutor é testada para 11 anos |
| **art. 8º, IV** | Configuração, por padrão, que **evite uso compulsivo** | D59: sem recompensa por tempo de uso, sem sequência de dias, sem conteúdo que se inicia sozinho, notificação só em horário útil da escola, teto do tutor visível ao aluno (D38) |
| **art. 16, parágrafo único** | Mapear riscos e **elaborar relatório de impacto** quando há tratamento de dado de menor | RIPD + AIA antes do piloto (D60), compartilhável com a ANPD |
| **art. 17 e 18** | Ferramentas de supervisão parental, com aviso de que estão ativas | Ver 2.2: **a confirmar**, modulado pelo art. 39 |
| **art. 22 e 26** | Vedado **perfilamento para publicidade**, análise emocional para esse fim, e criação de **perfil comportamental** de menor | Não fazemos publicidade nem perfil comportamental. Isso vira proibição escrita (D57) e teste, não só ausência de funcionalidade |
| **art. 28** | **Canal de notificação** de violação de direito de criança e adolescente, acessível e divulgado (Decreto art. 41: gratuito, efetivo, amplamente divulgado) | Canal dentro do produto, para aluno, professor, coordenação e família, com encaminhamento à escola e registro (D61) |
| **art. 29 e 30** | Retirada de conteúdo violador quando notificado, com direito de contestação, informando se a análise foi humana ou automatizada | Vale para material ingerido e para saída de IA: caminho de retirada, motivo, autoria da análise e recurso |
| **art. 31** | Relatório semestral público | **Não se aplica**: é para provedor com mais de 1 milhão de usuários nessa faixa |
| **art. 39** | As obrigações dos arts. 6º, 17, 18, 19, 20, 27, 28, 29, 31, 32 e 40 são **moduladas** por funcionalidade, grau de interferência sobre conteúdo, número de usuários e porte do fornecedor | É o artigo que nos salva de obrigação de rede social. Não é dispensa automática: a modulação precisa estar **argumentada por escrito** no dossiê |
| **art. 40** | Representante legal no País | Somos empresa brasileira. Vale para o **provedor de modelo estrangeiro** que contratarmos |

### 2.2 O art. 24 — o achado que muda prioridade

> "Os provedores de produtos ou serviços direcionados a crianças e a adolescentes ou de
> acesso provável por eles deverão garantir que usuários ou contas de crianças e de
> adolescentes de **até 16 anos** estejam vinculados ao usuário ou à conta de um de seus
> **responsáveis legais**." (art. 24, *caput*)

O artigo está no Capítulo IX, "Das redes sociais", e o *caput* fala de "produtos ou serviços",
não de rede social. As duas leituras existem:

- **Leitura estrita** (pelo capítulo): o art. 24 é obrigação de rede social, e não nos alcança.
- **Leitura ampla** (pelo *caput*): alcança qualquer serviço direcionado a menor de 16, e
  então **todo aluno do 6º ao 9º ano e parte do 1º do Médio precisa de conta de responsável
  vinculada** — que hoje está em "fase posterior" (D11).

Isso não é detalhe jurídico: na leitura ampla, o vínculo com o responsável deixa de ser
funcionalidade de venda e passa a ser condição de operar com aluno de 11 a 15 anos, que é
metade do nosso recorte (D43). O § 5º do mesmo artigo reforça: sem conta de responsável, é
**vedado** rebaixar a proteção abaixo do padrão dos arts. 3º e 7º.

**Postura até o parecer** (`TODO.md`, prioridade máxima): o modelo de dados do F1 já nasce com
`responsavel` e o vínculo responsável × aluno, ainda sem interface, para que a leitura ampla
não vire migration em todas as tabelas; e o modo casa (D19) continua desligado por padrão,
que é o uso fora da supervisão direta da escola. A decisão de antecipar o portal da família
depende do parecer.

### 2.3 O Decreto 12.880/2026, art. 11 — o artigo mais importante para o Tutor

É o único dispositivo em vigor no Brasil que fala **diretamente** de IA conversacional com
criança e adolescente. Vale para "modelos de linguagem, agentes conversacionais e interfaces
similares", e a ANPD regulamenta e fiscaliza:

| Inciso | Obrigação | Requisito no produto |
|---|---|---|
| **I** | Ser **transparente quanto ao caráter sintético e automatizado** da interação | O Tutor se identifica como sistema automatizado no início de cada sessão e em qualquer tela onde um aluno possa confundi-lo com uma pessoa; a identificação não é removível por configuração da escola (D58) |
| **II** | **Prevenir a manipulação comportamental** | Sem persona que simule vínculo afetivo, sem linguagem que crie obrigação de continuar, sem incentivo a voltar. O Tutor conduz por perguntas sobre o conteúdo e encerra |
| **III** | **Avaliar o risco algorítmico** à segurança e à saúde | AIA específica do Tutor antes de ele existir, revista a cada mudança de modelo ou de prompt (D60) |
| **IV** | Implementar **salvaguardas ao desenvolvimento físico, mental e psicossocial** | Escopo escolar, recusa de assunto fora do escopo, encaminhamento a humano em assunto delicado (D36), teto diário (D38), e o texto de acolhimento revisado por orientação educacional |

Os arts. 9º e 10 do mesmo decreto completam o desenho, e são requisitos de interface:

**Art. 9º — mecanismos de incentivo a uso excessivo, proibidos:** ocultar pontos naturais de
parada; iniciar conteúdo novo sem solicitação; recompensa por tempo de uso; notificação
excessiva.

**Art. 10 — práticas manipulativas, proibidas:** obstrução (dificultar sair, cancelar ou
mudar preferência por caminho mais longo que o de aceitar); exploração de vulnerabilidade
cognitiva (urgência fabricada, pressão emocional, inferência emocional); e dificultar o
acesso a controle de privacidade, supervisão ou revogação.

Os dois viram teste de tela, não só recomendação (D59).

### 2.4 Aferição de idade

O Capítulo IV da lei e o Capítulo VII do decreto tratam de **experiência adequada à idade**;
a verificação documental de idade (art. 9º da lei, art. 15 do decreto) é exigida de quem
oferece conteúdo **proibido** a menor — armas, álcool, aposta, pornografia —, o que não é o
nosso caso. A nossa faixa etária vem da **série informada pela escola**, que é dado
institucional e não autodeclaração, e é mais confiável que qualquer sinal de loja de
aplicativos. Isso precisa estar **escrito** no dossiê, com o art. 24 do decreto (proporção
entre solução e risco) como fundamento. **A confirmar** com advogado.

### 2.5 Sanção

Fiscalização da ANPD, com sanções previstas a partir de novembro/2026: advertência, multa
simples de até 10% do faturamento no Brasil, multa diária, suspensão e proibição de
atividade. A ANPD pôs proteção de criança e IA entre os temas prioritários de fiscalização
em 2026–2027.

---

## 3. LGPD, Marco Civil e transferência internacional

`docs/lgpd.md` é o documento operacional. Em resumo: escola controladora, nós operadores,
dado de menor com proteção reforçada (art. 14; Enunciado CD/ANPD 1/2023 aceita qualquer base
dos arts. 7º ou 11 desde que prevaleça o melhor interesse), sem treinamento de modelo com
dado de escola, direitos do titular atendidos por código.

- **Marco Civil, art. 15:** guarda de registro de acesso por 6 meses, separada da auditoria
- **Transferência internacional (Resolução CD/ANPD 19/2024):** desde 23/08/2025, só com as
  cláusulas-padrão da ANPD, e a escola publica informação simplificada sobre a transferência.
  O Referencial do MEC vai além e trata dado educacional de menor fora do país como risco de
  soberania, citando o Cloud Act: por isso **conversa de aluno só em provedor com
  processamento no Brasil** (D62)
- **Art. 20:** revisão de decisão só automatizada que defina perfil, inclusive profissional.
  Vale para indicador de professor (D45)

---

## 4. Lei 15.100/2025 — aparelhos na escola

A lei fala em "aparelhos eletrônicos portáteis pessoais". O computador da escola (Chromebook,
notebook de carrinho, laboratório) não é pessoal e fica fora da proibição. Aparelho pessoal
do aluno só é permitido em sala para fins estritamente pedagógicos, conforme orientação do
professor, e nunca no intervalo. A lei não alcança o uso fora da escola (modo casa, D19).

**Requisitos derivados:** ambiente do aluno em sala é **web, no computador da escola** (D43).
A mesma web é responsiva e funciona no celular fora da escola (D51), mas não há app nativo.
Nada de fluxo que dependa do aluno ter telefone — nem para autenticar, nem para receber
código, nem para fotografar. Há leis estaduais além da federal; a de Santa Catarina não foi
verificada.

---

## 5. Material didático de terceiro, e o material de quem é da escola

A ingestão só aceita material que a escola **pode ceder para esse uso** (D5 revista): apostila
e material próprios da escola, material do professor, livro com licença para esse uso, domínio
público e provas oficiais do ENEM. Com editora ou sistema de ensino, o caminho é licença ou
parceria com o dono do conteúdo.

Por quê: a Lei 9.610/98, art. 29, IX, exige autorização prévia e expressa do autor para
"inclusão em base de dados, o armazenamento em computador", e a exceção do art. 46, VIII só
vale para pequenos trechos. A escola não é dona do direito, então a autorização dela não
basta. Os termos do Plurall (Somos, versão de 01/08/2024) vedam mineração de dados, reproduzir
e transferir o conteúdo a terceiros e compartilhar senha, e o livro digital só é lido dentro
da plataforma. Subir o PDF só muda quem executa: a obra continua sendo transferida para nós e
para o provedor de modelo. E os donos desse conteúdo já vendem IA própria.

Condições que valem como regra técnica, para qualquer fonte:

- Licença ou parceria com o dono do conteúdo, registrada, quando o material não é da escola
- A escola autoriza por escrito, e a autorização fica registrada no sistema
- As credenciais usadas são **da escola**, fornecidas por ela, nunca obtidas por nós
- O conteúdo ingerido fica **restrito ao tenant daquela escola**. Nunca é reaproveitado para
  outra escola, nem vira banco de questões nosso
- Não contornamos pagamento, bloqueio técnico nem termo de uso de terceiro

**Se essas condições não puderem ser satisfeitas, o material não entra — nem por upload.**

**O outro lado, que o MEC cobra e que faltava aqui:** o material e o artefato que o professor
produz no sistema continuam **dele e da escola**. O documento da SEB lista, como risco de
contratação, "perda da propriedade intelectual da produção docente" e plataforma que passa a
poder comercializar o que o professor criou. Nosso contrato e o produto dizem o contrário:
sem reaproveitamento entre escolas, sem treinamento de modelo, e exportação em formato aberto
a qualquer momento, inclusive no fim do contrato (D63).

**A confirmar:** termos de Arco/SAS, Positivo e Bernoulli; se escanear apostila impressa muda
algo; art. 104 da Lei 9.610 (responsabilidade de quem armazena obra reproduzida sem
autorização).

---

## 6. Dado que a escola é obrigada a guardar

Registro escolar tem prazo de guarda próprio, definido pela norma da rede. Nossa retenção não
pode ser mais curta que a obrigação da escola nem mais longa que o necessário. A tabela de
retenção em `docs/lgpd.md` é o lugar onde isso é resolvido, e cada rede pode pedir ajuste — o
prazo precisa ser configurável por escola.

---

## 7. Risco à vida e proteção do aluno

A Lei 13.819/2019, art. 6º, ampliada pela Lei 15.231/2025, obriga a **escola** a notificar o
Conselho Tutelar em caso suspeito ou confirmado de automutilação ou tentativa de suicídio. O
encaminhamento do tutor (D36) está certo, mas precisa de um caminho auditado para a orientação
ou direção ver o conteúdo e cumprir a notificação, e o sinal precisa chegar a quem notifica,
não só ao professor da turma.

Duas obrigações somadas nesta revisão:

- O ECA Digital, art. 17, § 4º, IX, pede **conexão a serviços de suporte emocional e de
  bem-estar**, com conteúdo adequado à faixa etária, quando há risco psicossocial
  identificado. O CVV (188) e o contato da orientação da escola são isso, e ficam no texto
  fixo (D36), revisado por orientação educacional de verdade
- O Decreto 12.880, art. 10, proíbe **inferência emocional**. O gatilho continua sendo o que o
  aluno escreveu de forma explícita, nunca leitura de estado emocional (D57)

**A detalhar** no PRD do F9, com advogado e orientação educacional.

---

## 8. O professor como titular e como empregado

Indicador de professor gerado a partir do uso do sistema é dado pessoal dele (D45). O
monitoramento de empregado é lícito quando transparente e proporcional. A convenção coletiva
do SINPRONORTE 2026/2027 (Joinville) não tem cláusula sobre IA, monitoramento ou avaliação de
desempenho; outras convenções não foram lidas. Na rede pública vale o estatuto do servidor e o
processo de avaliação de desempenho de cada município. Por isso a métrica é apoio pedagógico,
nunca nota do professor, e nada no produto a liga a decisão sobre ele (regra 70, item 8).

O MEC acrescenta um requisito que não estava escrito aqui e que é mais forte que o nosso
desenho: **o professor pode recusar a ferramenta sem ser penalizado**, e a rede precisa
garantir isso. Consequência no produto (D64): não existe indicador de adoção nominal por
professor, nem alerta de "professor que não usa", nem ranking de uso. Adoção é agregada, e é
métrica nossa de produto, não instrumento de cobrança da coordenação sobre o professor.

---

## 9. Ensino *sobre* IA, e não só *com* IA

As diretrizes do CNE determinam que o ensino relacionado a IA seja incorporado aos currículos
de forma **progressiva e transversal**, articulado com educação digital, midiática e
computacional — sem disciplina própria. A base curricular disso já existe: Resolução CNE/CEB
2/2025 (Educação Digital e Midiática), Lei 14.533/2023 (Política Nacional de Educação Digital)
e as habilidades de Computação da BNCC. O documento da SEB traz **12 aprendizagens
fundamentais para a era da IA**, e exige que a adoção de qualquer recurso com IA venha
acompanhada de ensino crítico sobre a própria tecnologia.

Não vendemos currículo, e isso não vira fase de roadmap agora. O que vira requisito (D65):

- o Tutor, quando o aluno pergunta sobre ele mesmo, **explica o que é, como funciona, o que
  não sabe e que pode errar**, em linguagem da faixa etária — é obrigação de transparência
  (Decreto art. 11, I) e letramento ao mesmo tempo;
- o Planejador gera, **sob pedido do professor**, atividade alinhada às 12 aprendizagens e às
  habilidades de Computação da BNCC, como qualquer outro conteúdo do material;
- o dossiê (`docs/conformidade-mec.md`) inclui o material que a escola usa para conversar com
  professores e famílias sobre o uso de IA — a "política de IA da escola" que 78% delas não
  têm, e que é a nossa isca comercial mais barata.

---

## 10. O que não é lei e já é exigência de compra

Os dois documentos do MEC não têm sanção. Eles têm algo pior: são o roteiro que a coordenação
e a secretaria vão usar para nos avaliar, com perguntas prontas, lista de documentos a exigir
do desenvolvedor e cláusulas de contrato sugeridas. Está tudo traduzido em requisito em
**`docs/conformidade-mec.md`**, que é o documento a ler antes de qualquer PRD de governança,
tutor, correção ou material de venda.

---

## 11. O que está a confirmar

Cada item aqui é um risco aberto, com dono no `TODO.md`:

| # | A confirmar | Por que importa |
|---|---|---|
| 1 | Texto oficial do ato do CNE, depois da homologação do MEC | Define se a devolutiva formativa de discursiva volta a ser possível (D55) e o que exatamente é "validação qualificada e documentada" (D56) |
| 2 | Se o art. 24 do ECA Digital alcança serviço educacional contratado pela escola | Define se conta de responsável vinculada é requisito para aluno de 11 a 15 anos, e se o portal da família sai da "fase posterior" (seção 2.2) |
| 3 | Como os arts. 17 e 18 (supervisão parental) se modulam pelo art. 39 no nosso caso | Define se precisamos de ferramenta de supervisão parental própria ou se a política da escola cumpre o papel |
| 4 | Nossa justificativa de aferição de idade pela série informada pela escola | Se não bastar, entra mecanismo de sinal de idade (seção 2.4) |
| 5 | Regulamentação da ANPD sobre o art. 11 do Decreto 12.880 | Pode trazer requisito técnico novo para o Tutor; acompanhar publicação |
| 6 | Guia de Classificação Indicativa do MJ (out/2025), capítulo Interatividade | O MEC manda o desenvolvedor seguir; não foi lido |
| 7 | Termos de Arco/SAS, Positivo e Bernoulli, e apostila impressa escaneada | Define o primeiro material do piloto (seção 5) |
| 8 | Base legal da conversa do tutor e dos sinais, na particular e na pública | Sustenta o F9 e o F10 |
| 9 | Contrato do provedor de modelo: menor de idade, treinamento vedado, processamento no Brasil | Sustenta a D62 e o portão da primeira escola real |

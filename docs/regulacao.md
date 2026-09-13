# Regulação que vira requisito

Não é contexto de fundo. Cada item abaixo já é uma regra implementável.

> Revisto em 13/09/2026 com pesquisa de fonte. O que está marcado **a confirmar** saiu de
> imprensa ou de texto preliminar e precisa ser conferido no texto oficial ou com advogado
> antes de virar material de venda.

## 1. Diretrizes do CNE sobre IA na educação (aprovadas pelo CNE em 01/09/2026)

**Status.** Até 13/09/2026 o texto aguardava homologação do MEC e publicação como
resolução. O prazo de adequação de 12 meses conta da publicação, não de 01/09. Uma matéria
(ICL Notícias) fala em "aplicação imediata" das proibições, e as demais não; tratamos as
proibições como valendo desde já. Só o texto de consulta pública de maio/2026 foi lido na
íntegra.

| Classificação | O que significa para o produto |
|---|---|
| **Risco moderado — permitido** | Tutor digital e personalização de aprendizagem. Nosso ambiente do aluno cabe aqui, **desde que supervisionado**, com revisão humana, monitoramento periódico e vedação de uso do dado para treinar modelo de terceiro |
| **Alto risco — exige supervisão humana** | Correção de objetiva e atribuição de nota: a IA corrige, mas **a nota só existe quando um humano aprova**, com validação "qualificada e documentada" (o professor não pode só aprovar automaticamente). No texto de consulta, também "perfilização acadêmica individualizada" e "inferências comportamentais relevantes", que exigem avaliação de impacto algorítmico, explicação acessível e caminho de contestação |
| **Proibido — risco excessivo** | Decisão exclusivamente automatizada com efeito relevante sobre promoção, retenção, certificação ou permanência, e vigilância emocional. **A confirmar:** segundo a imprensa, a versão final proíbe também a IA de corrigir, avaliar ou sugerir nota em **redação e prova discursiva**, inclusive como pré-correção para o professor |
| **Vedado** | IA generativa sem supervisão na educação infantil e anos iniciais. Nosso recorte é anos finais e Ensino Médio (D43); se um dia descermos de faixa, este item volta |

**Requisitos derivados:**

- `Nota` só é gravada com `lancadaPor` humano preenchido
- Em discursiva e redação, a IA entrega só devolutiva formativa, sem nota proposta, até o
  texto final ser lido (D46)
- Toda saída de IA que chega ao aluno passa por fila de aprovação, com autor e data; a
  resposta do tutor é supervisionada em vez de aprovada (D47)
- Auditoria mostra o que a IA gerou, quem aprovou e quando
- O tutor do aluno é sempre visível ao professor: modo sala em tempo real, modo casa com
  registro e resumo
- Nenhuma funcionalidade decide aprovação, reprovação ou encaminhamento sozinha
- Sinais do tutor, Monitor de turma e alertas sobre aluno tratados como possível alto
  risco: avaliação de impacto antes de existir, explicação em linguagem comum, e caminho
  para aluno ou família contestar

**PL 2338/2023 (marco de IA).** Aprovado no Senado em 10/12/2024; na Câmara, o relator
deixou a votação para depois das eleições de outubro/2026. O texto do Senado classifica
como alto risco a IA usada em educação para acesso a instituições e para avaliação e
monitoramento de estudantes. Hoje é tendência, não obrigação.

## 2. Lei 15.100/2025 — aparelhos na escola

A lei fala em "aparelhos eletrônicos portáteis pessoais". O computador da escola
(Chromebook, notebook de carrinho, laboratório) não é pessoal e fica fora da proibição.
Aparelho pessoal do aluno (celular, tablet, notebook) só é permitido em sala para fins
estritamente pedagógicos, conforme orientação do professor, e nunca no intervalo. A lei não
alcança o uso fora da escola (modo casa, D19).

**Requisitos derivados:** ambiente do aluno em sala é **web, no computador da escola**
(D43). A mesma web é responsiva e funciona no celular fora da escola (D51), mas não há app
nativo. Nada de fluxo que dependa do aluno ter telefone — nem para autenticar, nem
para receber código, nem para fotografar. Se a escola permitir aparelho pessoal em alguma
aula, é decisão dela, e o produto não depende disso. Há leis estaduais além da federal; a de
Santa Catarina não foi verificada.

## 3. LGPD, ECA Digital e Marco Civil

Ver `docs/lgpd.md`, que é o documento operacional. Em resumo: escola controladora, nós
operadores, dado de menor com proteção reforçada (art. 14; Enunciado CD/ANPD 1/2023 aceita
qualquer base dos arts. 7º ou 11 desde que prevaleça o melhor interesse), sem treinamento de
modelo com dado de escola, direitos do titular atendidos por código.

Obrigações próprias nossas, mesmo como operador:

- **ECA Digital (Lei 15.211/2025)**, em vigor desde 17/03/2026, para serviço direcionado a
  criança e adolescente ou de acesso provável por eles: privacidade máxima por padrão e
  avaliação de impacto. Fiscalização da ANPD, sanções a partir de novembro/2026, multa de
  até 10% do faturamento. **A confirmar** com advogado se e como se aplica a plataforma
  contratada pela escola
- **Marco Civil, art. 15:** guarda de registro de acesso por 6 meses, separada da auditoria
- **Transferência internacional (Resolução CD/ANPD 19/2024):** desde 23/08/2025, só com as
  cláusulas-padrão da ANPD, e a escola publica informação simplificada sobre a transferência
- **Art. 20:** revisão de decisão só automatizada que defina perfil, inclusive profissional.
  Vale para indicador de professor (D45)
- A ANPD pôs proteção de criança e IA entre os temas prioritários de fiscalização em
  2026–2027

## 4. Material didático de terceiro

A ingestão só aceita material que a escola **pode ceder para esse uso** (D5 revista):
apostila e material próprios da escola, material do professor, livro com licença para
esse uso, domínio público e provas oficiais do ENEM. Com editora ou sistema de ensino, o
caminho é licença ou parceria com o dono do conteúdo.

Por quê: a Lei 9.610/98, art. 29, IX, exige autorização prévia e expressa do autor para
"inclusão em base de dados, o armazenamento em computador", e a exceção do art. 46, VIII só
vale para pequenos trechos. A escola não é dona do direito, então a autorização dela não
basta. Os termos do Plurall (Somos, versão de 01/08/2024) vedam mineração de dados,
reproduzir e transferir o conteúdo a terceiros e compartilhar senha, e o livro digital só é
lido dentro da plataforma. Subir o PDF só muda quem executa: a obra continua sendo
transferida para nós e para o provedor de modelo. E os donos desse conteúdo já vendem IA
própria.

Condições que valem como regra técnica, para qualquer fonte:

- Licença ou parceria com o dono do conteúdo, registrada, quando o material não é da escola
- A escola autoriza por escrito, e a autorização fica registrada no sistema
- As credenciais usadas são **da escola**, fornecidas por ela, nunca obtidas por nós
- O conteúdo ingerido fica **restrito ao tenant daquela escola**. Nunca é reaproveitado
  para outra escola, nem vira banco de questões nosso
- Não contornamos pagamento, bloqueio técnico nem termo de uso de terceiro

**Se essas condições não puderem ser satisfeitas, o material não entra — nem por upload.**
O comprador aqui é um coordenador que precisa confiar em nós; um processo por violação de
direito autoral mata a venda em toda a rede.

**A confirmar:** termos de Arco/SAS, Positivo e Bernoulli; se escanear apostila impressa
muda algo; art. 104 da Lei 9.610 (responsabilidade de quem armazena obra reproduzida sem
autorização).

## 5. Dado que a escola é obrigada a guardar

Registro escolar tem prazo de guarda próprio, definido pela norma da rede. Nossa retenção
não pode ser mais curta que a obrigação da escola nem mais longa que o necessário. A
tabela de retenção em `docs/lgpd.md` é o lugar onde isso é resolvido, e cada rede pode
pedir ajuste — o prazo precisa ser configurável por escola.

## 6. Risco à vida e proteção do aluno

A Lei 13.819/2019, art. 6º, ampliada pela Lei 15.231/2025, obriga a **escola** a notificar o
Conselho Tutelar em caso suspeito ou confirmado de automutilação ou tentativa de suicídio. O
encaminhamento do tutor (D36) está certo, mas precisa de um caminho auditado para a
orientação ou direção ver o conteúdo e cumprir a notificação, e o sinal precisa chegar a
quem notifica, não só ao professor da turma. **A detalhar** no PRD do F9 com advogado e
orientação educacional.

## 7. O professor como titular e como empregado

Indicador de professor gerado a partir do uso do sistema é dado pessoal dele (D45). O
monitoramento de empregado é lícito quando transparente e proporcional. A convenção
coletiva do SINPRONORTE 2026/2027 (Joinville) não tem cláusula sobre IA, monitoramento ou
avaliação de desempenho; outras convenções não foram lidas. Na rede pública vale o estatuto
do servidor e o processo de avaliação de desempenho de cada município. Por isso a métrica é
apoio pedagógico, nunca nota do professor, e nada no produto a liga a decisão sobre ele
(regra 70, item 8).

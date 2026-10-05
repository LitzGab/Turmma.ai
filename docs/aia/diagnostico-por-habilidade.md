# AIA — Diagnóstico por habilidade

> **Funcionalidade:** o diagnóstico formativo por habilidade (D46), que sai da correção e
> alimenta "Turmas", a memória do Tutor e, em agregado, a visão da coordenação.
> **Função coberta** (`FUNCOES`, em `packages/shared/src/time/funcoes.ts`): a parte de diagnóstico
> de `correcao_de_objetiva` — agente Assistente de ensino, autonomia 2 (executa e avisa), alto
> risco. **O diagnóstico não tem chave própria.** Quem lê o diagnóstico depois são
> `tutor_com_o_aluno` (`docs/aia/tutor.md`) e `resumo_e_alerta` (`docs/aia/sinais-e-alertas.md`).
> **Estado:** etapa 1 fechada para o MVP em 05/10/2026, com as decisões do Joaquim da seção 1.9;
> revisão do Gabriel pendente; etapas 2 a 6 devidas antes do primeiro aluno real. O texto é do
> Claude (04/10/2026); o Joaquim decidiu os itens listados em 1.9, não leu o texto inteiro.
> **Etapas 2 a 6:** devidas antes do primeiro aluno real (D60, D71). Enquanto o dado for 100%
> sintético, a etapa 1 basta para o MVP de apresentação.
> **Sobre as fontes:** o ato do CNE de 01/09/2026 foi lido só por cobertura de imprensa
> (`docs/regulacao.md`). O que esta AIA atribui a ele vale até a leitura do texto oficial.

---

## Etapa 1 — Justificação e escopo

### 1.1 Para que existe, e que problema da escola resolve

Uma nota diz quanto o aluno acertou. Ela não diz **o que** ele ainda não aprendeu. O professor
que quer saber qual habilidade retomar com a turma precisa cruzar, à mão, cada questão com o que
ela cobra, e quase nunca tem tempo. O diagnóstico faz esse cruzamento: de cada atividade ou
avaliação corrigida, mostra o acerto por habilidade, para a turma e para cada aluno.

É o que a D46 pôs antes da nota oficial: o diagnóstico é formativo, não vai para o boletim e tem
menos risco que a nota. É também o "diagnóstico que a escola não tinha", um dos dois ganhos que
dizemos entregar em relação à alternativa sem tecnologia (`docs/conformidade-mec.md`, seção 1).

**Resultado esperado:** o professor sabe o que retomar e com quem; o aluno vê o próximo passo, e
não um rótulo; a coordenação vê a escola em agregado.

### 1.2 Por que IA, e a alternativa menos invasiva

A conta do diagnóstico **não usa modelo**: é aritmética sobre a correção, que por sua vez é
comparação com o gabarito. Essa já é a alternativa menos invasiva.

O ponto em que um modelo interfere fica antes: **a habilidade de cada questão é atribuída pelo
modelo** quando o Assistente de ensino gera a atividade. Classificar por habilidade não é
determinístico (regra 40). Uma questão classificada na habilidade errada produz um diagnóstico
errado para a turma inteira, com aparência de precisão. A alternativa sem modelo é o professor
classificar cada questão à mão; o desenho atual fica no meio do caminho, porque a atividade é
rascunho do professor até ele usar. Se a tela do artefato mostra a habilidade de cada questão
para ele conferir, e se ele pode trocá-la, é ponto a verificar na etapa 2.

O diagnóstico é alto risco por outro motivo também: acompanhado no tempo, ele forma o **perfil
acadêmico individual** do aluno, que as diretrizes do CNE tratam como alto risco
(`docs/regulacao.md`, seção 1.3; regra 70).

### 1.3 Quem é afetado

- **O aluno.** O diagnóstico diz o que ele ainda não domina, fica guardado e é lido por outras
  partes do sistema. Diagnóstico errado manda o aluno estudar o que ele já sabe, ou esconde o
  que ele não sabe.
- **O professor da turma.** Decide o que retomar a partir dele. E o indicador do próprio
  professor deriva do desempenho das turmas dele (D45): o diagnóstico é também dado sobre o
  professor.
- **A coordenação.** Vê agregado por série e disciplina.
- **A família**, na fase posterior.

### 1.4 O que a função faz (escopo positivo)

1. Depois de corrigir (`docs/aia/correcao-de-objetiva.md`), calcula o acerto por habilidade da
   turma e de cada aluno, e o inclui no lote que o professor valida.
2. **Nível de autonomia 2: executa e avisa.** O cálculo é feito sem pedir. O diagnóstico só passa
   a valer, e só chega ao aluno, depois que o professor abre os destaques e aprova o lote.
3. Depois da aprovação:
   - o **professor da turma** vê o acerto por habilidade em "Turmas", da turma e de cada aluno;
   - o **aluno** vê o próprio diagnóstico, formulado como próximo passo;
   - a **coordenação** vê agregado, e abre o detalhe de um aluno só com registro em auditoria
     (D34);
   - a **memória do Tutor** passa a contar com esse resultado, para orientar o estudo do aluno
     (D66).
4. Na fase definitiva, acompanha a evolução no tempo e, em "Turmas", sustenta as dificuldades
   da turma e o "aluno que precisa de atenção" (D69), este coberto em
   `docs/aia/sinais-e-alertas.md`.

### 1.5 O que a função não faz (escopo negativo)

Cada item traz o fundamento e o jeito de conferir, por teste automatizado ou por leitura de tela.

**N1. Não é nota, não gera `Nota` e não vai para o boletim.**
Fundamento: D46; `docs/glossario.md` ("Diagnóstico"); regra 70, item 1.
Como se confere: teste em que aprovar o lote não cria nota; leitura das telas, que dizem
"diagnóstico" e nunca "nota".

**N2. Não aparece para o aluno, em "Turmas" nem para a coordenação antes de o professor aprovar o
lote.**
Fundamento: regra 70, item 3; `FUNCOES` ("o diagnóstico só chega ao aluno depois que o professor
abre os casos destacados e aprova o lote").
Como se confere: teste em que o diagnóstico do aluno responde como inexistente, e o desempenho
da turma não muda, enquanto a entrega do lote está pendente.

**N3. O Tutor não usa resultado de lote ainda não aprovado.** Dizer ao aluno o que ele errou é
fazer o resultado chegar a ele.
Fundamento: regra 70, item 3; D66 (a memória é registro do trabalho, que o aluno vê e contesta).
Como se confere: teste em que a memória do Tutor não traz acerto, erro nem habilidade de uma
atividade cujo lote está pendente ou foi rejeitado.

**N4. Não rotula o aluno.** Não existe nível, faixa, perfil nem adjetivo guardado sobre ele. O que
se guarda é o acerto por habilidade em cada atividade.
Fundamento: D57; `docs/conformidade-mec.md`, seção 2, critério 2 ("formulado como próximo passo,
não como rótulo"); regra 70, item 4d.
Como se confere: o registro do diagnóstico só tem número, habilidade e a atividade de origem,
sem campo de texto sobre a pessoa; leitura da tela do aluno.

**N5. Não mostra ao aluno ranking, média da turma nem resultado de colega.**
Fundamento: regra 50, item 9.
Como se confere: o que a API devolve ao aluno só tem o que é dele.

**N6. Não ranqueia alunos, turmas nem professores.**
Fundamento: D45; D64; nível 4 de `docs/agentes.md`.
Como se confere: nenhuma tela ordena pessoas por desempenho como classificação; a governança não
tem coluna, filtro nem ordenação por professor.

**N7. Não decide nem recomenda aprovação, reprovação, recuperação ou encaminhamento de aluno.**
Fundamento: regra 70, item 2; nível 4 de `docs/agentes.md`.
Como se confere: nenhuma saída traz recomendação sobre a situação escolar do aluno; leitura de
"Turmas" e do resumo do Analista.

**N8. Não usa nada além do resultado de questões.** Tempo de resposta, tempo ocioso, navegação,
saída da aba e o que o aluno escreveu ao Tutor não entram no diagnóstico.
Fundamento: regra 70, item 7; D57; D69; D70.
Como se confere: a entrada do cálculo é só a correção e a habilidade de cada questão; teste de
que o diagnóstico é idêntico com e sem conversa do Tutor e com e sem saídas da aba.

**N9. Em discursiva e redação, a IA não produz juízo nenhum sobre o texto do aluno para compor o
diagnóstico.**
Fundamento: D55; regra 70, item 2a.
Como se confere: nenhum campo guarda avaliação de IA sobre texto discursivo; no MVP não há item
discursivo.

**N10. A coordenação não vê aluno nomeado por padrão.** Vê agregado, e abre o detalhe com
registro em auditoria. A rede só lê agregado.
Fundamento: D34; regra 10, item 8; regra 20, item 10.
Como se confere: teste em que a rota de desempenho devolve agregado à coordenação e em que a
leitura nominal grava auditoria; teste de isolamento da camada de rede.

**N11. Não vira medida do professor para decisão sobre ele.** O indicador que deriva do
diagnóstico é espelho: o professor vê o dele; a coordenação vê agregado só com dois ou mais
professores no recorte, e abre o nominal com auditoria. Sem ranking, sem alerta sobre o professor.
Fundamento: D45; D64; regra 70, itens 8 e 9.
Como se confere: teste de que o recorte com um professor só não devolve agregado à coordenação
sem auditoria.

**N12. Não é guardado para sempre.** Segue a retenção do mapa de dados e pertence a um ano
letivo.
Fundamento: `docs/lgpd.md`, linha "Diagnóstico por habilidade"; regra 60, item 5; regra 20,
item 16.
Como se confere: a rotina de expurgo cobre o diagnóstico, com teste. No MVP a rotina não existe.

**N13. Não sai para provedor de modelo com nome nem com o histórico inteiro.** Quando o Tutor o
usa, vão só as habilidades em jogo e o trecho recuperado por relevância.
Fundamento: regra 20, item 12; `docs/lgpd.md`, seção 6, item 2; D62.
Como se confere: teste que captura, no adaptador falso, o que foi montado para o modelo.

**N14. Não serve a publicidade, a treinamento de modelo nem a qualquer fim comercial.**
Fundamento: D57; `docs/lgpd.md`, seção 6, item 5.
Como se confere: não existe exportação do diagnóstico para fora da escola a não ser a que a
própria coordenação pede (D63).

**N15. Não aparece sem dizer de onde saiu.** Cada número aponta a atividade e as questões que o
formaram.
Fundamento: D60 e `docs/regulacao.md`, seção 1.3 (explicação em linguagem comum na tela e caminho
de contestação).
Como se confere: leitura das telas do professor e do aluno. O caminho de contestação ainda não
está desenhado (1.8, item 3).

### 1.6 O dado que entra, e o que sai para terceiro

**Entra:** a correção das respostas de lotes aprovados; a habilidade de cada questão, que vem do
artefato; a turma, a série e a disciplina. A tabela de habilidades da BNCC é pública e não tem
dono.

**Fica guardado:** o acerto por habilidade, por aluno e por turma, ligado à atividade de origem.

**Linhas do mapa de `docs/lgpd.md`:**

- "Diagnóstico por habilidade" — aluno; acompanhamento pedagógico formativo (D46); retenção de
  ano letivo + 1 ano, marcada lá como **proposta, a confirmar com a escola**.
- "Resposta de avaliação", que é a origem.
- "Memória do Tutor", que lê o diagnóstico (perfil acadêmico individual; AIA antes de existir).
- "Indicadores de uso e das turmas do professor" — titular: o professor; base legal marcada lá
  como **a confirmar com advogado**.
- "Auditoria", para a leitura nominal pela coordenação.

**Sai para terceiro (provedor de modelo):** do cálculo, nada, porque ele não chama modelo. O
diagnóstico sai quando outra função o usa: no Tutor, como habilidades em jogo, sem nome, junto de
conversa de aluno, e por isso só para provedor com processamento no Brasil (D62); no resumo do
Analista, em agregado. Cada uma dessas saídas é tratada na AIA da função que a faz.

### 1.7 Suspensão da função numa escola

**O que já está decidido (D60, revista em 23/09/2026):** a suspensão é por função e por escola,
decidida pela coordenação, com registro próprio (quem, quando, motivo) e auditoria, e vale no
servidor.

**A consequência do desenho atual (aceita pelo Joaquim para o MVP em 05/10/2026, 1.9):** o diagnóstico não tem chave própria. Ele é suspenso junto
com a correção, pela chave `correcao_de_objetiva`, e não há como suspender um sem o outro. Se
isso é aceitável ou se o diagnóstico ganha chave, é decisão do Joaquim (1.8, item 1).

**O que acontece com o que já foi produzido — decidido pelo Joaquim em 05/10/2026:**

- com a função suspensa, nenhum diagnóstico novo é calculado;
- o diagnóstico de lote já aprovado continua visível ao professor e ao aluno, porque uma pessoa
  o validou;
- o que o Tutor e o Analista leem do diagnóstico não muda com esta suspensão; para tirar o
  diagnóstico da conversa do Tutor, a escola suspende `tutor_com_o_aluno`;
- se o motivo da suspensão for erro no diagnóstico (habilidade classificada errada, por exemplo),
  falta um jeito de **retirar** um diagnóstico já aprovado, com registro. Isso não está decidido
  em documento nenhum.

### 1.8 O que está em aberto

1. **Decidido para o MVP (1.9; a rever antes do primeiro aluno real).** **Chave própria para o diagnóstico em `FUNCOES`**, ou suspensão sempre junto com a correção.
   Depende do Joaquim.
   *Decisão:* sem chave própria, suspenso junto de `correcao_de_objetiva`.
2. **Quais indicadores, com que limiar e com que texto.** É decisão em aberto no `CLAUDE.md`, do
   Joaquim e do Gabriel, a fechar antes do PRD do F6. Entra aí o **número mínimo de questões por
   habilidade** para o diagnóstico afirmar alguma coisa: com uma questão só, um erro vira "0% na
   habilidade".
3. **O caminho de contestação**, para o aluno e para o professor, e a explicação em linguagem
   comum. Exigidos pela D60; ainda sem desenho. Etapas 4 e 6.
4. **Retirar um diagnóstico já aprovado** (1.7). Depende do Joaquim. **Continua em aberto:** a decisão de 1.9 sobre a chave não a resolve.
5. **A retenção** de ano letivo + 1 ano é proposta, a confirmar com a escola (`docs/lgpd.md`).
6. **O roteiro da demonstração e o N3.** No passo 3 de `docs/mvp-rapido.md`, o Tutor "lembra do
   que ele errou" antes de o professor aprovar a correção, que é o passo 4. Para o N3 valer, o
   erro lembrado precisa vir de um lote já aprovado. Depende do Joaquim.
7. **Base legal dos indicadores do professor** que derivam do diagnóstico. Depende de advogado
   (`TODO.md`; D45).
8. **O método da etapa 5.** `docs/conformidade-mec.md`, seção 12, item 4, registra que não
   sabemos ainda qual é o método aceitável de validação desagregada sem coletar dado sensível.

Os itens restantes não bloqueiam o MVP de apresentação (dado sintético, D71); bloqueiam o primeiro aluno real (etapas 2 a 6).

### 1.9 Decisões do Joaquim para o MVP (05/10/2026)

1. **Suspensão (1.7).** Aceita a proposta de 1.7 tal como escrita: com a função suspensa nenhum diagnóstico novo é calculado; o diagnóstico de lote já aprovado continua visível, porque uma pessoa o validou; o registro da validação nunca é apagado. Foi o que o MVP implementou, e a revisão da fase 4 aprovou. O jeito de **retirar** um diagnóstico aprovado não foi decidido (1.8, item 4).
2. **Chave (1.8, item 1), para o MVP:** o diagnóstico por habilidade não tem chave própria e é suspenso junto de `correcao_de_objetiva`. **A rever antes do primeiro aluno real.**

---

## Etapa 2 — Análise dos dados e do modelo

Falta: como a habilidade de cada questão é atribuída, a taxa de acerto mínima dessa classificação
num conjunto fixo de amostras (regra 40), e a declaração de que não treinamos modelo. Antes do
primeiro aluno real.

## Etapa 3 — Identificação e avaliação de riscos

Falta: a lista com probabilidade e impacto — habilidade classificada errada, amostra pequena,
diagnóstico lido como rótulo, perfil acadêmico usado para decidir sobre o aluno ou sobre o
professor. Antes do primeiro aluno real.

## Etapa 4 — Estratégias de mitigação

Falta: a mitigação por risco, a explicação em linguagem comum na tela e o caminho de contestação
e de revisão (LGPD, art. 20). Antes do primeiro aluno real.

## Etapa 5 — Validação e auditoria da equidade

Falta: o método. Não guardamos raça, renda nem território, então a desagregação possível é por
turma, série e escola, com escuta de professor (`docs/conformidade-mec.md`, seção 8, que cita o
diagnóstico por habilidade pelo nome). Antes do primeiro aluno real.

## Etapa 6 — Monitoramento contínuo e governança

Falta: os indicadores periódicos, a revisão a cada troca de modelo ou de prompt, o canal de
contestação e o procedimento de suspensão fechado (1.7 ainda tem proposta a confirmar). Antes do
primeiro aluno real.

---

## O que o MVP de apresentação implementa desta funcionalidade

Conforme `docs/mvp-rapido.md`, com dado 100% sintético.

**Existe agora:**

- o acerto por habilidade, calculado na correção determinística e incluído no lote;
- em "Turmas", o acerto por habilidade **só de lotes aprovados**, para o professor da turma, e em
  agregado para a coordenação (`GET /turmas/:id/desempenho`); turma sem correção aprovada mostra
  estado vazio;
- o aluno vê o próprio diagnóstico só depois da aprovação do lote
  (`GET /atividades-aplicadas/:id/meu-diagnostico`);
- **sem `Nota`** (D46);
- as habilidades vêm de um catálogo curto por disciplina, em código, e não da BNCC completa.

**Fica para a fase definitiva (F6, F10 e F12):**

- a BNCC completa e a classificação de material por habilidade (D6);
- a evolução no tempo e a comparação com a série;
- o "aluno que precisa de atenção" em "Turmas": não consta do contrato do MVP, e a tela de
  desempenho do aluno está fora do roteiro;
- a tela "O que o Tutor sabe de mim" é apoio e é a primeira a ser cortada se o prazo apertar;
- a explicação e o caminho de contestação;
- a rotina de expurgo conforme a retenção.

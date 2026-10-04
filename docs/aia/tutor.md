# AIA — Tutor

> **Funcionalidade:** o Tutor com o aluno — a conversa socrática, a memória da trajetória do
> aluno no sistema e a leitura do tipo de adaptação (D66), a busca em fontes aprovadas (D68) e o
> encaminhamento de assunto delicado (D36).
> **Função coberta** (`FUNCOES`, em `packages/shared/src/time/funcoes.ts`): `tutor_com_o_aluno` —
> agente Tutor, autonomia 2 (executa e avisa), alto risco. O que o Tutor avisa ao professor é
> outra função, `sinais_para_o_professor`, e está em `docs/aia/sinais-e-alertas.md`.
> **Estado:** rascunho da **etapa 1**, escrito pelo Claude em 04/10/2026, a revisar pelo Joaquim e
> depois pelo Gabriel. Nada aqui vale como avaliação concluída antes dessas duas revisões.
> **Etapas 2 a 6:** devidas antes do primeiro aluno real (D60, D71). Enquanto o dado for 100%
> sintético, a etapa 1 basta para o MVP de apresentação.
> **Sobre as fontes:** o ato do CNE de 01/09/2026 foi lido só por cobertura de imprensa
> (`docs/regulacao.md`). O que esta AIA atribui a ele vale até a leitura do texto oficial. Os
> artigos do ECA Digital (Lei 15.211/2025) e do Decreto 12.880/2026 são citados a partir de
> `docs/regulacao.md`, que registra a leitura integral dos dois.
> **Sobre a classificação:** na leitura de `docs/regulacao.md`, seção 1.1, a conversa contínua com
> o aluno cai em "cuidados adicionais", e a memória, que forma perfil acadêmico individual, em
> alto risco (seção 1.3). A D60 trata o Tutor inteiro como alto risco para efeito de AIA, e é o
> que esta avaliação segue.

---

## Etapa 1 — Justificação e escopo

### 1.1 Para que existe, e que problema da escola resolve

Numa sala de trinta alunos, cada um trava num ponto diferente da mesma lista, e o professor
atende um por vez. Quem não é atendido para, copia do colega ou pergunta a uma IA aberta, fora
da vista de todos, que entrega a resposta pronta. A escola fica com dois problemas: o aluno que
não aprende porque delegou o raciocínio (o "descarregamento cognitivo" que o MEC manda prevenir),
e um uso de IA em sala que ninguém supervisiona.

O Tutor responde à dúvida do aluno na hora, sobre o material da turma, conduzindo por perguntas
em vez de entregar a resposta, e deixa o professor ver o que está acontecendo.

**Resultado esperado:** o aluno destrava explicando o próprio raciocínio; o professor sabe quem
travou e onde; a escola tem uso de IA pelo aluno que é visível, limitado e explicável à família.

**O que ainda não sabemos:** não temos evidência independente de que isso melhora a
aprendizagem (`docs/conformidade-mec.md`, seção 12, item 1). Pelo princípio 10 do MEC, enquanto
ela faltar, a adoção é piloto declarado, com métrica e reversibilidade.

### 1.2 Por que IA, e a alternativa menos invasiva

Conduzir por perguntas a partir da dúvida específica de um aluno exige gerar linguagem em
resposta ao que ele escreveu. As alternativas sem modelo são três, e nenhuma faz isso:

- **o professor atende cada aluno** — é a melhor, e não escala para a turma inteira ao mesmo
  tempo; o Tutor não a substitui, e é o professor quem decide quando ligá-lo;
- **dica fixa por questão**, escrita antes — não responde à dúvida que o aluno de fato tem;
- **gabarito comentado** — entrega a resposta, que é o contrário do objetivo.

A alternativa menos invasiva **dentro** do uso de IA é a adotada: assunto preso ao material da
turma, sem web aberta, só em sala por padrão, com teto diário, com o professor vendo, e com a
memória feita do registro do trabalho, não de texto sobre a pessoa.

### 1.3 Quem é afetado

- **O aluno, de 11 a 18 anos.** É quem conversa com a IA. Escreve ali o que não entende, e às
  vezes o que não escreveria numa prova (`docs/lgpd.md`, seção 6, item 6). O Decreto 12.880,
  art. 11, trata diretamente deste caso.
- **O aluno com adaptação registrada.** O Tutor lê o tipo de adaptação para ajustar a forma.
- **O professor da turma.** Supervisiona: vê o uso, os sinais, o registro e o resumo.
- **A orientação educacional ou a direção.** É quem a lei obriga a notificar o Conselho Tutelar
  em caso de automutilação ou tentativa de suicídio (Lei 13.819/2019, ampliada pela Lei
  15.231/2025).
- **A coordenação.** Decide se o Tutor funciona fora da sala e se a busca é liberada na escola.
- **A família.** É a quem a escola explica o que essa IA faz com o filho.

### 1.4 O que a função faz (escopo positivo)

1. **Responde ao aluno em tempo real, quando ele pergunta. Nível de autonomia 2.** É a única
   saída de IA que chega ao aluno sem aprovação prévia: ela é **supervisionada**, não aprovada
   resposta por resposta (D47; regra 70, item 3). Nenhuma outra função herda essa exceção.
2. **Conduz por perguntas**, pede que o aluno explique com as próprias palavras e **cita a
   página** do material.
3. **Fica restrita ao conteúdo escolar da turma**, com o escopo aplicado no servidor, pela
   recuperação do material, e não só pedido no prompt.
4. **Trava durante avaliação em andamento**, qualquer que seja a política da turma.
5. **Tem identidade de função** e se apresenta como IA. Perguntada sobre si, explica o que é,
   como funciona, o que não sabe e que pode errar, em linguagem da faixa etária (D58, D65).
6. **Lembra do trabalho do aluno** (D66): atividades, trabalhos, avaliações, práticas e sessões,
   com o resultado por habilidade, a devolutiva que o professor escreveu e o resumo de cada
   sessão em formato fixo (assunto, habilidade, exercício, onde travou, como terminou). A cada
   conversa busca só o que importa para aquela dúvida. O aluno vê o que o Tutor sabe do
   desempenho dele e pode contestar.
7. **Usa o contexto que o professor informou**, sempre estruturado: por turma, o que está sendo
   dado, a lista ativa e o foco da semana; por aluno, as habilidades a reforçar, escolhidas de
   uma lista.
8. **Lê o tipo de adaptação registrado** para ajustar a forma da conversa — frases mais curtas,
   passos menores, resposta compatível com leitor de tela —, nunca o que é cobrado.
9. **Pesquisa em fontes aprovadas**, quando a coordenação liberou na escola e o professor ligou
   para a turma, com prazo (D68): só no modo sala, nunca em avaliação, com teto diário, com a
   consulta escrita pelo modelo, a resposta rotulada "da web" com o link, e o professor vendo o
   que foi pesquisado. Continua socrático: traz a fonte e pergunta.
10. **Encaminha assunto pessoal delicado a um humano** (D36): responde com mensagem fixa,
    revisada pela escola, que acolhe e orienta a procurar o professor ou a orientação
    educacional e, havendo menção a risco à vida, o CVV (188); e gera o sinal "precisa de
    atenção humana".
11. **Respeita o pacote da turma e o freio de 60 trocas por dia por aluno** (D38), mostrados ao
    aluno como salvaguarda.
12. **Deixa rastro para o professor:** em sala, acompanhamento ao vivo; fora da sala, quando a
    escola ligou o modo casa naquela turma, registro e resumo (D8, D19).

### 1.5 O que a função não faz (escopo negativo)

Cada item traz o fundamento e o jeito de conferir, por teste automatizado ou por leitura de tela.

#### Sobre o que o Tutor responde

**N1. Não entrega a resposta pronta**, nem quando o aluno insiste, muda a forma do pedido ou diz
que o professor autorizou.
Fundamento: `docs/agentes.md`; `FUNCOES`; `docs/conformidade-mec.md`, seção 3, princípio 2.
Como se confere: conjunto fixo de tentativas de arrancar a resposta, com taxa mínima de recusa
declarada (regra 40); teste de ponta a ponta "tutor recusando entregar resposta".

**N2. Não responde durante avaliação em andamento.**
Fundamento: `docs/fluxos.md` (trava automática, independente da política); `docs/interface.md`.
Como se confere: teste em que a mensagem ao Tutor é recusada com atividade avaliativa aberta;
leitura da tela ("Avaliação: o Tutor fica pausado").

**N3. Não fala de assunto fora do conteúdo escolar da turma.**
Fundamento: nível 4 de `docs/agentes.md`; Decreto 12.880, art. 11, IV.
Como se confere: teste de recusa com perguntas fora do material; a recusa é aplicada no
servidor, e o teste falha se o escopo for retirado de lá.

**N4. Não revela gabarito, explicação da alternativa correta nem resultado de lote que o
professor ainda não aprovou.**
Fundamento: regra 70, item 3.
Como se confere: teste em que o que é montado para o modelo não contém gabarito da atividade
aberta nem resultado de lote pendente.

**N5. Não avalia, não corrige, não dá nota nem conceito e não comenta com juízo um texto
discursivo ou uma redação do aluno**, nem quando ele cola o texto e pergunta se está bom.
Fundamento: D55; D66 ("o Tutor não avalia o texto"); regra 70, item 2a.
Como se confere: conjunto fixo de amostras em que o aluno pede avaliação do próprio texto, com
taxa mínima de recusa.

**N6. Não decide nada sobre o aluno** e não recomenda aprovação, reprovação, recuperação ou
encaminhamento.
Fundamento: regra 70, item 2.
Como se confere: nenhuma saída do Tutor é lida por rotina que altere a situação do aluno.

#### Sobre como o Tutor se apresenta

**N7. Não afirma ser pessoa e não usa nome que sugira pessoa real.**
Fundamento: D58; D17; Decreto 12.880, art. 11, I.
Como se confere: amostras em que o aluno pergunta "você é uma pessoa?", com resposta correta em
todas; leitura da tela: nome de função e selo de IA em toda resposta.

**N8. Não simula vínculo afetivo nem dependência**, e não usa linguagem que crie obrigação de
continuar ("senti sua falta", "não me deixe agora").
Fundamento: D58; Decreto 12.880, art. 11, II.
Como se confere: revisão do prompt e conjunto fixo de amostras pelo `conformidade-reviewer` e
pelo `pedagogia-reviewer`.

**N9. Não induz uso.** Não há recompensa por tempo de uso, sequência de dias, mensagem que o
Tutor começa sozinho, notificação fora do horário útil da escola, rolagem infinita nem ponto de
parada escondido. Sair nunca é mais difícil que entrar.
Fundamento: D59; Decreto 12.880, arts. 9º e 10; ECA Digital, art. 8º, IV.
Como se confere: leitura de tela pelo `frontend-reviewer`; não existe rota em que o Tutor inicia
conversa; o teto diário aparece para o aluno.

**N10. Não mostra erro cru ao aluno.** Quando o provedor falha ou recusa por limite, o aluno vê
aviso de fila ou de pausa.
Fundamento: regra 80, item 4.
Como se confere: teste com o adaptador falso devolvendo falha e limite.

#### Sobre o que o Tutor sabe e guarda

**N11. Não guarda texto sobre a pessoa.** Não existe campo, escrito por modelo ou por gente, sobre
o jeito, o humor, a atenção ou o comportamento do aluno. A memória é registro do trabalho.
Fundamento: D66; D57; regra 70, item 4d.
Como se confere: leitura do esquema das tabelas do Tutor; o resumo de sessão só tem os cinco
campos do formato fixo; teste que recusa resumo com campo a mais.

**N12. Não infere emoção, humor, atenção nem estado psicológico.** O gatilho do encaminhamento é
o que o aluno escreveu de forma explícita.
Fundamento: D36; D57; ECA Digital, art. 26; Decreto 12.880, art. 10.
Como se confere: a lista de gatilhos é fechada e revisada; nenhum campo guarda estado emocional;
teste em que mensagem sem menção explícita não gera o sinal.

**N13. Não aconselha em assunto pessoal delicado.** A resposta é a mensagem fixa.
Fundamento: D36.
Como se confere: teste em que, acionado o gatilho, o texto devolvido é idêntico ao fixo, com o
188 quando há menção a risco à vida, e o modelo não é chamado para escrevê-lo.

**N14. Não tem memória que o aluno não possa ver.**
Fundamento: D66 ("o aluno vê e contesta").
Como se confere: tudo que entra no contexto do Tutor sobre o aluno aparece na tela "O que o
Tutor sabe de mim"; teste que compara as duas listas.

**N15. Não recebe o motivo da adaptação, e a adaptação não muda o que é cobrado.**
Fundamento: D66; D35.
Como se confere: o que é montado para o modelo traz o tipo de adaptação, sem nome e sem motivo.

**N16. Não mede tempo ocioso e não acompanha a navegação do aluno.**
Fundamento: regra 70, item 7; D69; D70.
Como se confere: não há evento de inatividade nem de foco de aba no contrato do Tutor.

#### Sobre para onde o dado vai

**N17. Não envia ao provedor de modelo nome, matrícula nem o histórico inteiro do aluno.**
Fundamento: regra 20, item 12; `docs/lgpd.md`, seção 6, itens 2 e 3.
Como se confere: teste que captura, no adaptador falso, o que foi montado para o modelo.

**N18. Não manda conversa de aluno a provedor sem processamento no Brasil.**
Fundamento: D62. **Exceção vigente:** enquanto o dado for 100% sintético, vale o afrouxamento 2
da D71, e a D62 volta a valer antes do primeiro aluno real.
Como se confere: na fase definitiva, teste de roteamento do perfil do Tutor; no MVP, não se
aplica.

**N19. Não usa a conversa para treinar modelo, nosso ou de terceiro, nem para publicidade ou
qualquer fim comercial.**
Fundamento: D57; regra 20, item 13; `docs/lgpd.md`, seção 6, itens 1 e 5.
Como se confere: cláusula do contrato com o provedor; sem contrato que vede o treinamento, só
provedor local.

**N20. Não deixa a conversa visível a quem não é o professor da turma.** A rede nunca alcança
conteúdo de conversa, só agregado. O caminho da orientação ou da direção para ver o conteúdo, no
caso de risco à vida, é auditado.
Fundamento: regra 20, item 14; `docs/regulacao.md`, seção 7.
Como se confere: teste de autorização por objeto na conversa; teste de isolamento da rede.

**N21. Não funciona às escondidas do professor.**
Fundamento: D8; regra 70, item 4.
Como se confere: a tela do aluno tem a faixa de supervisão, que não fecha; toda conversa fica
registrada para o professor da turma.

#### Sobre onde e quando o Tutor funciona

**N22. Não funciona fora da sala, a menos que a escola tenha ligado o modo casa naquela turma.**
Fundamento: D19; ECA Digital, arts. 3º e 7º (configuração mais protetiva por padrão).
Como se confere: teste de que a turma nasce com o modo casa desligado.

**N23. Não pesquisa na web aberta.** A busca só alcança fontes aprovadas, só com as duas chaves
ligadas, só no modo sala, nunca em avaliação; a consulta não leva o texto nem o identificador do
aluno; e o conteúdo de página é tratado como dado, nunca como instrução.
Fundamento: D68; regra 70, item 4c; `docs/lgpd.md`, seção 6, item 9.
Como se confere: na fase definitiva, teste de cada condição e teste adversário com página que
tenta mandar no Tutor. **No MVP a busca não existe.**

**N24. Não passa do freio diário.**
Fundamento: D38; D59.
Como se confere: teste em que a troca seguinte ao limite é recusada, com a tela no estado de
limite.

**N25. Não atende educação infantil nem anos iniciais.**
Fundamento: `docs/regulacao.md`, seção 1.1 (vedado por etapa); D43.
Como se confere: o recorte de séries do sistema começa no 6º ano. Descer de faixa reabre esta AIA.

### 1.6 O dado que entra, e o que sai para terceiro

**Entra:** o que o aluno escreve; o trecho do material da turma; o registro do trabalho do aluno;
o contexto estruturado do professor; o tipo de adaptação.

**Fica guardado:** as mensagens, o resumo de cada sessão em formato fixo, a execução do agente e
o consumo.

**Linhas do mapa de `docs/lgpd.md`:**

- "Conversa com o tutor" — aluno; aprendizagem e supervisão docente; legítimo interesse da
  escola; 12 meses.
- "Memória do Tutor" — leitura de dados que já estão no mapa, mais o resumo de sessão; cada dado
  segue a própria retenção, e o resumo segue a conversa.
- "Contexto do Tutor informado pelo professor" — ano letivo.
- "Adaptação pedagógica necessária" — dado sensível (art. 11); base legal **a confirmar com
  advogado**.
- "Busca do Tutor" — a consulta escrita pelo modelo e as fontes abertas; 12 meses.
- "Sinal 'precisa de atenção humana' (sem conteúdo)" — 12 meses.

**Sai para terceiro:**

- **Provedor de modelo:** a dúvida do aluno, o trecho do material, o trecho do histórico
  recuperado por relevância, as habilidades em jogo e o tipo de adaptação. Nunca o nome, nunca o
  histórico inteiro, nunca o motivo da adaptação. Só provedor com processamento no Brasil,
  escrito em contrato (D62), com contrato que vede treinamento e permita serviço usado por menor
  de idade (regra 20, item 13). O provedor ainda não está escolhido (D37).
- **Provedor de busca:** terceiro fora do País. Recebe só a consulta escrita pelo modelo, sem o
  texto nem o identificador do aluno, saindo do nosso servidor e nunca do navegador do aluno. Entra
  no registro de suboperadores (D68). Ainda não está escolhido.

Todo envio externo é registrado na execução do agente (`docs/lgpd.md`, seção 6, item 4).

### 1.7 Suspensão da função numa escola

**O que já está decidido (D60, revista em 23/09/2026):** a suspensão é por função e por escola.
A coordenação suspende `tutor_com_o_aluno` sem desligar o Assistente de ensino nem o Analista. A
suspensão vale no servidor: função suspensa recusa executar. Fica um registro próprio, com quem
suspendeu, quando e o motivo, e com auditoria. A busca tem as duas chaves próprias dela (D68), e
o modo casa é configuração por turma (D19): desligar qualquer um dos dois não exige suspender o
Tutor.

**O que acontece com o que a função já produziu — proposta desta AIA, a confirmar pelo Joaquim:**

- o aluno vê o Tutor como indisponível, com texto simples, sem mensagem de erro;
- a conversa em andamento para na mensagem seguinte; nada é apagado;
- as conversas e os resumos de sessão já gravados continuam visíveis ao professor da turma, e
  seguem a retenção de 12 meses;
- o canal de notificação da D61 ("avisar um adulto"), quando existir, não depende do Tutor e não
  é desligado pela suspensão.

### 1.8 O que está em aberto

1. **Provedor de modelo principal e reserva** (D37), com a D62 como critério. Depende do Joaquim,
   antes de a F5 ficar pronta. O contrato do provedor (menor de idade, treinamento vedado,
   processamento no Brasil) está em `docs/regulacao.md`, seção 11, item 9.
2. **Art. 24 do ECA Digital:** se conta de aluno de até 16 anos precisa estar vinculada à de um
   responsável. Depende de advogado, e **bloqueia o PRD do F9** (`docs/regulacao.md`, seção 2.2).
3. **Arts. 17 e 18 do ECA Digital** (supervisão parental), modulados pelo art. 39. Depende de
   advogado.
4. **Base legal da conversa do Tutor**, na escola particular e na rede pública. O mapa diz
   legítimo interesse; a confirmação com advogado está no `TODO.md`.
5. **Regulamentação da ANPD sobre o art. 11 do Decreto 12.880.** Pode trazer requisito novo.
   Acompanhar (`docs/regulacao.md`, seção 11, item 5).
6. **Busca para aluno de até 16 anos sem conta de responsável vinculada:** se conta como rebaixar
   a proteção (ECA Digital, art. 24, § 5º). Depende de advogado, antes do PRD do F9.
7. **Lista padrão de fontes aprovadas, por faixa etária, e o provedor de busca.** Depende do
   Gabriel (lista) e do Joaquim (provedor), antes do PRD do F9.
8. **Protocolo de risco à vida:** quem notifica o Conselho Tutelar e como o sinal chega a essa
   pessoa, com acesso auditado ao conteúdo. Depende da escola, de advogado e de orientação
   educacional; a detalhar no PRD do F9.
9. **O texto da mensagem fixa e a lista de gatilhos do assunto delicado.** Passam pelo
   `conformidade-reviewer` e pelo `pedagogia-reviewer`, e por orientação educacional de verdade,
   antes de existirem com aluno real.
10. **A política de tutor "livre".** O glossário, `docs/fluxos.md` e `docs/modelo-de-dados.md`
    listam três políticas por turma: bloqueado, socrático e livre. `docs/agentes.md` e `FUNCOES`
    dizem que o Tutor nunca entrega a resposta pronta. Nenhum documento diz o que "livre" permite.
    Esta AIA cobre o Tutor socrático; "livre" precisa ser definida, ou sair, antes do PRD do F9.
    Depende do Joaquim e do Gabriel.
11. **"Onde travou" e "como terminou", no resumo de sessão.** São escritos pelo modelo. Para o
    N11 valer, precisam apontar para a questão ou a habilidade, e não ser frase livre sobre o
    aluno. Falta definir o formato desses dois campos. Depende do Joaquim.
12. **Aviso de privacidade em linguagem para aluno de 11 anos.** Não existe
    (`docs/conformidade-mec.md`, seção 12, item 3).
13. **Explicação em linguagem comum e caminho de contestação** do que o Tutor sabe. Exigidos pela
    D60 e pela D66; o desenho fecha nas etapas 4 e 6.
14. **Responsabilidade por resposta errada do Tutor**, no contrato com a escola. Depende de
    advogado (`TODO.md`).

---

## Etapa 2 — Análise dos dados e do modelo

Falta: qual modelo, a declaração de que não treinamos, o resultado da avaliação de modelos com
português brasileiro de variação regional e registro informal (`docs/conformidade-mec.md`,
seção 8), e a taxa de recusa da resposta pronta em amostras fixas. Antes do primeiro aluno real.

## Etapa 3 — Identificação e avaliação de riscos

Falta: a lista com probabilidade e impacto — resposta errada, resposta pronta entregue, conteúdo
inadequado, falha em reconhecer pedido de ajuda, dependência, vazamento de conversa, instrução
escondida em página da web. Antes do primeiro aluno real.

## Etapa 4 — Estratégias de mitigação

Falta: a mitigação por risco, o teste adversário do Tutor, o filtro de conteúdo, a explicação em
linguagem comum e o caminho de contestação da memória. Antes do primeiro aluno real.

## Etapa 5 — Validação e auditoria da equidade

Falta: o método. Não guardamos raça, renda nem território, então a desagregação possível é por
turma, série e escola, com escuta de professor (`docs/conformidade-mec.md`, seção 8). Modelo que
só vai bem com aluno que escreve como livro didático é reprovado (D60). Antes do primeiro aluno
real.

## Etapa 6 — Monitoramento contínuo e governança

Falta: os indicadores periódicos, a revisão a cada troca de modelo ou de prompt, o canal de
contestação e o procedimento de suspensão fechado (1.7 ainda tem proposta a confirmar). Antes do
primeiro aluno real.

---

## O que o MVP de apresentação implementa desta funcionalidade

Conforme `docs/mvp-rapido.md`, com dado 100% sintético.

**Existe agora:**

- o aluno escreve ao Tutor a partir de uma atividade ou de um material; a caixa é só de texto;
- o Tutor recusa a resposta pronta, conduz por perguntas, cita a página e diz que é uma IA;
- fica **travado em atividade avaliativa aberta**;
- usa a mensagem fixa de assunto delicado, com o 188 e "Avisar um adulto", e gera o sinal
  "precisa de atenção humana" sem o conteúdo;
- lembra do que o aluno fez, e o aluno consulta o que o Tutor sabe dele (`GET /tutor/memoria`); a
  tela é apoio, e é a primeira a ser cortada se o prazo apertar;
- a tela mostra a faixa de supervisão, que não fecha, o contador "Hoje: N de 60" e quatro
  estados: ligado, avaliação, fora e limite;
- a coordenação suspende e retoma a função na governança, e a suspensão vale no servidor;
- as respostas da demonstração saem do adaptador falso, determinístico; o modelo local só entra
  no ensaio final.

**Fica para a fase definitiva (F9, F10 e F11):**

- **a busca em fontes aprovadas (D68): não está no MVP.** Nenhuma busca na web existe;
- **o roteamento por soberania (D62):** no MVP o provedor é o que houver pela porta, porque não
  há texto de aluno real (afrouxamento 2 da D71);
- o tempo real: no MVP a tela consulta o servidor a cada segundo, sem WebSocket;
- o gateway de IA com limitador, fila curta e provedor de reserva, e a fila de jobs (D77);
- o contexto estruturado informado pelo professor e a leitura do tipo de adaptação: não constam
  do contrato do MVP;
- o modo casa, a política de tutor por turma e o pacote mensal por turma: não constam do contrato
  do MVP, que traz só o freio diário;
- o caminho auditado para a orientação ou a direção ver o conteúdo em caso de risco à vida;
- o filtro de conteúdo, o teste adversário e o canal de notificação de violação (D61).

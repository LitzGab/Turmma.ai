# PRD — Telas do professor

**Status:** aprovado, por delegação do Joaquim em 12/10/2026 ("você pode tomar todas as decisões para o projeto, eu Joaquim permito"); ele revê ao ler
**Funcionalidade do roadmap:** X3
**Depende de:** X1 (da X2, só a peça do sino; sem ela, a primeira tarefa a cria)

## 1. Problema

A professora abre o sistema no intervalo e o que espera por ela está em cinco lugares: a Home, a faixa do
Assistente, o aviso do Tutor, a aba Alunos de cada turma e "Confirme suas turmas". O que ela gerou fica no pé de
Ferramentas, e a turma aberta mistura tudo. O Gabriel reprovou isso vendo e redesenhou a área (D80).

## 2. Objetivo

A professora faz tudo o que faz hoje por quatro lugares e por um sino que junta o que espera por ela, sem que
nenhuma regra mude.

## 3. Fora de escopo

- Rota, tabela, permissão, contrato da API ou texto de erro de segurança novo
- O grupo "Conversas" e o histórico (F7); anexo e busca na web (D5, D75, D68)
- A faixa "começar aula", a visão Semana e a aula ao vivo (F8, F10)
- "Quem precisa de atenção", situação e ficha do aluno, ordem por média, boletim e exportar notas (F6, F17)
- Abrir conversa de aluno, contestar sinal, "Gerar revisão" e sinal do Tutor no sino (F9, F10)
- As ferramentas que o catálogo não tem (F7, D55)
- Destinatário da versão adaptada, "Lado a lado", envio agendado, Imprimir, Apresentar, PPTX, buscar e apagar
- Trocar o gabarito, tirar aluno do lote, recado da correção e saída da aba como destaque (F6, D70)
- "Meu uso", "Configurações", "Como a IA funciona", ajustes da turma, a introdução e a onça inteira (D64; X4)

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Professor | Tudo o que faz hoje, pelos quatro lugares e pelo sino, nas turmas com vínculo confirmado da escola ativa | Ver turma, artefato ou pendência de outra escola ou de turma que não é dele (regra 10) |
| Coordenador | Nada muda | Ver o sino, a conversa ou o que o professor criou (regra 70, item 8) |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | A lateral e a barra de baixo do celular têm **Início, Turmas, Ferramentas e Criados**, nessa ordem, sem "Seu time". "Meus dados" continua no menu da pessoa, antes de "Sair" | e2e dos lugares, nas três larguras; e2e `meus-dados` |
| RF2 | Nenhum endereço de hoje muda; o único novo é `/professor/criados`. `/professor/time/assistente` continua abrindo a tela do Assistente; `/professor/time/tutor` leva à aba Hoje da turma única, ou a Turmas | Os e2e de hoje, sem trocar `toHaveURL`; casos novos dos dois |
| RF3 | O sino "Esperando você", em toda tela do professor, lista o que espera decisão dela: correção para revisar, versão adaptada para decidir, pedidos de nome (um item por turma, com a quantidade) e turma a confirmar. O item leva à tela da decisão e sai quando ela acontece | Teste da conta, tipo a tipo; e2e por tipo |
| RF4 | O número do sino é o de itens; sem item não há número, e a lista diz "Tudo em dia". Com leitura que falhou, o sino diz o que não leu e não afirma "Tudo em dia" | Teste de componente dos estados |
| RF5 | O sino não insiste: não pisca, não soa, não relê por tempo, e o contador não anima (D59) | Teste de componente conta as chamadas; e2e |
| RF6 | Tudo o que "Seu time" mostrava tem tela: as entregas, com aprovar e rejeitar, e o que cada função do Assistente faz, a um clique do sino; os sinais, a atenção humana, o uso do Tutor por aluno e o que o Tutor faz sozinho, na aba Hoje | e2e acha os sete blocos pelo nome de hoje |
| RF7 | O **Início** mostra a saudação pela hora, com a onça do Assistente, a função e o selo "IA"; a caixa de pedido com a turma; um atalho por ferramenta que existe; e "O Assistente é uma IA e pode errar". "Esperando você" sai dele | Teste de componente dos quatro estados; e2e |
| RF8 | Pedido escrito sem ferramenta escolhida não abre o cartão sozinho: o Assistente pergunta, com duas opções do mesmo desenho (D18). O atalho é escolha explícita, como o menu de hoje. A Adaptação nunca recebe o texto da caixa (D35, D67) | Teste de componente; os e2e de hoje |
| RF9 | A **Conversa** mantém uma thread só, a assinatura com função e selo em toda resposta, o cartão com o mesmo formulário e a recusa de corrigir redação | Os e2e de hoje |
| RF10 | **Ferramentas** mostra o catálogo nas categorias da D74, só com as ferramentas que existem; categoria vazia não aparece; a função suspensa aparece no cartão | Teste de unidade; e2e |
| RF11 | O formulário é o mesmo motor do cartão. Ao lado, "Como vai sair" diz em texto fixo o que a ferramenta entrega. Não há prévia inventada | Teste de unidade; e2e |
| RF12 | **Criados** lista o que a professora gerou, por turma, com tipo, data e, na versão adaptada, o estado da decisão. Os filtros de tipo, turma e estado ficam no endereço | Teste de componente; e2e com os filtros |
| RF13 | O **documento aberto** mostra o conteúdo numa folha, com a página de cada questão, e mantém renomear, exportar em PDF, pedir versão adaptada, quem decidiu cada versão, aplicar com "é avaliativa?" e encerrar | Os e2e do artefato e da aplicação |
| RF14 | **Turmas** mostra um cartão por turma e disciplina confirmada e, antes, "Confirme sua turma", com confirmar e contestar. Só o confirmado abre a turma | e2e de vínculos |
| RF15 | A **turma aberta** tem três abas, **Hoje, Atividades e Alunos**, guardadas no endereço (`?aba=`); sem aba, abre em Hoje | e2e recarrega e volta pelo histórico |
| RF16 | **Hoje** mostra a atenção humana, sem conteúdo (D36); os sinais em agregado; o detalhe e o uso do Tutor por aluno a um clique; e o acerto por habilidade, só de correção aprovada | Teste de componente; e2e |
| RF17 | **Atividades** lista as atividades aplicadas, com o estado e os envios, e leva a aplicar, encerrar e "Revisar a correção" | Teste de componente; e2e |
| RF18 | **Alunos** mostra os alunos em ordem de nome, com os acertos de correção aprovada, o estado do acesso e os pedidos de nome, com as regras de hoje | Teste de componente; e2e de pedidos |
| RF19 | "Convidar alunos" abre num diálogo. Gerar, gerar novo e revogar continuam, e **o link e o código aparecem uma vez** | Os e2e do acesso |
| RF20 | **Aprovar** mantém a ação oficial em grafite, única na tela, desligada até o último destaque ser aberto, a confirmação que diz o que acontece e o registro da validação (D33, D56) | Os e2e de aprovar |
| RF21 | Nenhuma tela do professor mostra nota, média, ranking, ordem por acerto, tempo ocioso, conversa de aluno nem campo de texto sobre aluno (D46, D57, D69) | Teste de vocabulário; e2e |
| RF22 | Toda tela tem carregando, vazio, erro e com dado, cabe em 1366 × 768 e funciona a 360 px | Teste de componente por tela; e2e nos dois projetos |
| RF23 | Nenhum teste que prova regra é apagado, pulado ou enfraquecido | A contagem de casos do e2e; a esteira verde |

## 6. Regras de negócio

Regra vence desenho (D80, item 7). Os pontos do inventário (`mockup.md`, fechamento e):

- **D18 (1):** entra diferente. O Assistente pergunta antes; só o atalho abre o cartão direto
- **D55 (2):** não entra. Atividade é só objetiva, e nada diz "resolveram certo" sobre questão aberta
- **D46 (3):** entra com o vocabulário do produto: acertos, correção e diagnóstico
- **Aprovar e aplicar (4):** continuam dois atos registrados, e o lote, em dois passos
- **Indicadores (5, 6, 7):** não entram. A lista fica em ordem de nome, e os destaques são os da API
- **Conversa de aluno (8), anexo (9), busca (10), D64 e D9 (12, 13):** não entram
- **Adaptação (11):** segue pelo tipo, de lista fechada. Nenhuma tela diz qual aluno tem adaptação (D35)
- **Convite (15, 16):** o link e o código aparecem uma vez; o WhatsApp fica como hoje
- **Catálogo (17):** só as três ferramentas que existem
- **Estados (18):** a spec define carregando e erro, que o mockup não desenha
- **O nome do aluno** só aparece ao professor da turma, e a tela não o guarda ao sair (D34)

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Professor que dá duas disciplinas na mesma turma | Dois cartões em Turmas; a turma aberta é uma; os pedidos contam uma vez |
| Professora de duas escolas | O sino e Criados são só da escola ativa; trocar de escola os esvazia |
| Sem turma confirmada | Início sem caixa, com "Falta uma turma confirmada"; o sino só com "Confirme sua turma" |
| Vínculo encerrado com a turma aberta | "Turma indisponível", igual para a inexistente e a de outra escola |
| Entrega decidida em outra aba | A tela se atualiza e diz que já estava decidida; o item sai do sino |
| Mais de 100 entregas esperando | O sino diz "100 ou mais" |
| Dois alunos com o mesmo nome | Duas linhas em Alunos, em ordem estável |
| Sessão vencida com o convite aberto | O link e o código saem com o diálogo |
| Função suspensa pela escola | O atalho, o cartão e o formulário explicam |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Já está em `docs/lgpd.md`? |
|---|---|---|---|---|
| Nome do aluno na lista da turma (a web passa a ler `GET /v1/turmas/:id/alunos`, que o professor da turma já alcança) | Aluno | O professor reconhecer a turma dele | A da conta do aluno | Sim |

Nenhum dado novo é gravado.

## 8b. Risco regulatório (quando há IA no caminho do aluno)

Nenhuma função de IA muda. Correção de objetiva e sinais continuam de alto risco, e o Tutor, de cuidados
adicionais (regra 70). A aprovação humana fica onde está: a entrega da versão adaptada, "Aplicar à turma" e o lote
com os destaques abertos. A supervisão do Tutor passa de "Seu time" para a aba Hoje, com o mesmo conteúdo (D8).

## 9. Métricas

- Cliques do sino até a decisão, por tipo de item
- O e2e da A1 à A4 verde nos dois projetos, sem perder caso
- A foto de cada tela ao lado do mockup: o Gabriel aprova ou aponta

## 10. Perguntas em aberto

**Respondido por delegação:**

- Sinal do Tutor no sino: **não entra**. Sem "visto" no servidor, o item ficaria para sempre; fica na aba Hoje
- "Como vai sair": texto fixo. O motor não tem o que mostrar antes de gerar
- Alunos lê uma rota que existe e a web não usava; a versão adaptada segue decidida na tela do Assistente
- Aprovar ganha abas (Destaques, Outras, Resumo), sem mudar os passos
- O menu "Ferramenta" sai da caixa do Início e fica na da Conversa

**Para a Tech Spec:**

- Onde o sino se prende na casca, e quantas leituras faz, sem guardar nome de aluno
- Como os specs de várias telas viram um por tela, para as tarefas correrem em paralelo

# PRD — Telas da coordenação

**Status:** aprovado, por delegação do Joaquim em 12/10/2026 ("você pode tomar todas as decisões para o projeto, eu Joaquim permito"); ele revê ao ler
**Funcionalidade do roadmap:** X2
**Depende de:** X1

## 1. Problema

A coordenadora acha sete itens na lateral e nenhum que diga o que espera por ela: convite vencido, contestação e material que falhou só aparecem na tela certa. O Gabriel reprovou a área vendo e a redesenhou (D80).

## 2. Objetivo

A coordenação e a operação fazem tudo o que fazem hoje em telas compostas como no mockup de outubro, com um lugar que diz o que espera por elas, sem regra, permissão nem contrato de API novos.

## 3. Fora de escopo

- **Backend:** nenhuma rota, tabela, permissão ou campo de DTO
- **Dado que o produto não tem** (D80, item 7c): frequência, faltas, nota do diário, APOIA, Ideb, a grade turma × limiar, "Onde trava", os filtros de série e trimestre
- **Analista em conversa:** campo de pergunta, relatório em PDF, CSV, anexo
- **Escola:** "Grade e calendário" e "Importar listas" (F2); adaptação e painel do aluno; mudar de turma; encerrar matrícula; exportar lista; retirar material com motivo; encerrar vínculo; busca
- **Registros:** Avisos, encaminhamento, Auditoria, Exportar, Dossiê (F9, F12); o painel de cada registro; "Por série"
- Configurações da escola, "Minha conta", introdução (X4), rede (F14), família
- **Operação:** custo e teto de IA, convite da secretaria, redefinir o segundo fator, grupo por rede
- Contar o que só se lê com auditoria (seção 6)
- Do F3: m4 e m5 pedem campo no DTO; m6 é da X3
- A peça `ListaDePedidos`

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Coordenador | Tudo o que faz hoje, pelos quatro lugares e pelo sino | Ver indicador de uso ou de desempenho por professor ("provas a aprovar", "sem chamada"); abrir conversa do Tutor; ver nome de aluno sem a leitura auditada |
| Operador Turmma | Criar rede e escola, convidar a coordenação e ver o uso, numa página | Ver dado de pessoa da escola (D76) |
| Professor, aluno | Nada muda | Alcançar tela da coordenação |

Convite vencido e contestação de vínculo são pendência da escola, sem relação com adoção (D64): um item por convite ou vínculo, que sai quando a coordenação resolve.

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | A lateral e, no celular, a barra de baixo têm **Painel, Analista, Escola e Registros**, nessa ordem, e o sino "Esperando você" em toda tela | e2e `areas`, nas três larguras |
| RF2 | A coordenação abre no **Painel** (`/coordenacao/painel`). Nenhum endereço de hoje muda: cada um abre a tela equivalente, no lugar e na aba dela | Os e2e de hoje sem trocar `toHaveURL`, fora o de onde ela abre |
| RF3 | De qualquer tela, toda tela de hoje fica a até dois cliques (lugar e aba); Empresas e Incidentes, a três; o que espera por ela, a dois, pelo sino | e2e conta os cliques |
| RF4 | O sino lista o que espera a coordenação: incidente sem confirmação, professor que contestou a turma, convite vencido, material que falhou e turmas sem professor. O item leva à tela que resolve e sai quando o estado muda. Vazio: um ícone ilustrado e "Tudo em dia", só com as leituras que existem completas | Teste da conta, tipo a tipo; teste de componente; e2e de um item |
| RF5 | O sino não pisca, não soa, não relê por tempo, e abrir a lista não faz leitura | Teste de componente conta as chamadas |
| RF6 | O **Painel** mostra o incidente a confirmar, a função de IA suspensa, os quatro números da governança, o consumo do mês, a fila do sino e "Para terminar a escola", com o link de cada passo que falta | Teste de componente por bloco; e2e |
| RF7 | Nenhum número nem item do Painel ou da fila é indicador de professor, de turma, de turma e disciplina, nem de pedido de titular; os tipos da fila são os cinco do RF4, sem contador por professor | Teste com dois professores de pendências diferentes, no Painel e no sino; teste que fecha os tipos |
| RF8 | O **Analista** é uma página de leitura, assinada por ele: resumo a pedido, alertas como hipótese, acerto por série e disciplina só com dois ou mais professores. Sem campo de pergunta | e2e `analista`; teste: nenhum `textbox` |
| RF9 | O dado nominal de uma turma abre na página do Analista, com o aviso antes, turma, finalidade e uma auditoria por leitura | e2e de hoje, pelo caminho novo |
| RF10 | **Escola** tem as abas Turmas, Professores e Material | e2e: pelo clique e pelo endereço |
| RF11 | **Turmas**: tabela por série; a linha abre a lista da turma; turno, professores e a marca "Sem professor"; filtro "Todas" e "Sem professor"; "Nova turma" é o único botão cheio; renomear e excluir no menu da linha | Teste de componente; e2e `estrutura` |
| RF12 | Ano letivo, séries e disciplinas ficam num painel ao lado, com tudo o que a Estrutura faz hoje; "O que falta para a escola começar" mantém os sete passos, a lista de nomes sem marca | e2e `estrutura` |
| RF13 | **Professores**: tabela com nome, disciplinas, turmas e situação, sem e-mail; a linha abre o painel do professor; cadastrar, copiar o link uma vez, refazer e revogar como hoje | e2e `professores` |
| RF14 | A **alocação** mora no painel do professor: as turmas dele, com estado e contestação, e "Acrescentar turma" só para quem é alocável; o vínculo nasce esperando a confirmação | e2e `alocacao` |
| RF15 | **Material**: tabela com o que falhou primeiro; "Enviar material" abre um diálogo com os campos de hoje; a linha abre o painel, com "Tentar de novo" e "Excluir" | e2e `material` |
| RF16 | A **lista da turma** faz tudo o que faz hoje e mostra os professores da turma | e2e `lista-da-turma`, `pedidos` |
| RF17 | **Registros** tem as abas IA, Pedidos e Privacidade (Prazos de guarda, Empresas e Incidentes num seletor, nunca aba dentro de aba) | e2e `privacidade`, `incidentes` |
| RF18 | **IA**: os quatro números, a tabela "O que a IA gerou e quem aprovou" sem turma nem quem decidiu, o filtro por estado e o consumo por função | e2e `governanca` |
| RF19 | **"Como cada IA trabalha"** é uma página com "‹ Registros": uma IA por vez, o que faz sozinha, o que espera aprovação, o que nunca faz, e suspender e retomar por função, com confirmação | e2e `agentes` |
| RF20 | **Pedidos**: a lista mostra o prazo e marca o vencido em texto (m3); registrar e o detalhe fazem o que fazem hoje | Teste de componente; os dois e2e de hoje |
| RF21 | A **operação** é uma página com as abas Escolas e Uso, nos endereços de hoje; a tabela diz o estado da coordenação em texto, nos sete estados, sem nome de pessoa | Os e2e `operacao-*` |
| RF22 | Toda tela tem carregando, vazio, erro com "Tentar de novo" e com dado; o vazio só com a leitura terminada e sem erro | Teste de componente por tela |
| RF23 | A 1366 × 768 a página não rola: o que passa rola dentro da lista, alcançável pelo teclado. A 360 px nada rola de lado | e2e, `chromebook` e `celular` |
| RF24 | Nenhum teste que prova regra é apagado, pulado ou enfraquecido | Diff dos testes por tarefa |

## 6. Regras de negócio

- **Regra vence desenho** (D80, item 7). Os doze pontos da seção 14 do `mockup.md`:
  1. Dado que não existe: fora
  2. Indicador de professor (D45, D64): não entram LP/MAT por turma, "sem chamada", "provas a aprovar" por turma, a coluna "Aprovado por", nem busca ou filtro por professor
  3. Grupo pequeno: a tela mostra o que o servidor devolve e não calcula recorte novo
  4. Nominal: **cada leitura pede a finalidade e grava auditoria**, também a repetida
  5. Recomendação sobre aluno: o Analista só mostra hipótese sobre conteúdo (regra 70, item 2)
  6. Conversa do Tutor: a coordenação não abre trecho (regra 20, item 14)
  7, 8, 10 e 12. Adaptação, texto livre perto de aluno, rede e anexo no Analista: as telas estão fora
  9. Operação: nenhuma ação nova sobre conta de pessoa
  11. Emoção: nada a tirar
- **Leitura auditada não sai sozinha** (regra 20, item 10): lista de nomes, pedidos de nome e pedidos de titular só são lidos quando a coordenação abre ou pede. Por isso não existem "sem lista", contagem de nomes nem pedido de titular no sino
- **Suspender função** continua com confirmação, motivo de lista fechada e auditoria (D9, D60)
- **Licença do material** é obrigatória, e a recusa fica na auditoria (D5, D75)
- **Vínculo é da escola**; o professor só confirma (regra 60, item 8a)
- **A onça não entra no sino** nesta spec; o vazio usa ícone ilustrado. A mascote de corpo inteiro no vazio fica para o Joaquim decidir (Tech Spec, seção 12)

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Escola recém-criada, sem ano letivo | Painel e Escola mostram "Comece pelo ano letivo"; o sino diz "Tudo em dia" |
| Turma sem professor alocado | Marca "Sem professor" na linha e um item no sino, com a contagem |
| Professor com duas disciplinas na mesma turma | Duas linhas no painel dele; a turma aparece uma vez na tabela |
| Professor que contestou a turma | Item no sino com o nome dele; o painel mostra o motivo e o complemento |
| Fila que falha em parte | Mostra o que leu e diz que parte não carregou; nunca "Tudo em dia" |
| Virada de ano, sem ano em curso | Turmas pede para abrir o ano; o sino não conta turmas |
| Lista lida só até o limite de páginas | Como a fila que falha em parte, com "Parte da lista não carregou" |
| Segunda pessoa da coordenação na mesma aba | Nada da fila, do Painel nem do painel aberto da anterior |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Já está em `docs/lgpd.md`? |
|---|---|---|---|---|
| Nenhum dado novo | — | — | — | — |

A fila mostra o nome de professor que a coordenação já vê em Professores. Nada vai para o navegador, e o endereço só leva id.

## 8b. Risco regulatório (quando há IA no caminho do aluno)

Nenhuma função de IA muda. O Analista continua de alto risco (regra 70): agregado, hipótese e nunca recomendação, com a regra dos dois professores no servidor. O vazio do sino não leva mascote.

## 9. Métricas

- Cliques até cada tela (RF3)
- O e2e da A0b, da A1, da A5 e do F3 verde, sem perder caso
- A foto de cada tela ao lado do mockup

## 10. Perguntas em aberto

**Respondido por delegação**

- "Sem lista" e pedido de titular no sino e no Painel: **não entram** (seção 6). O Painel tem a porta "Pedidos dos titulares", sem número, e o prazo aparece na lista (m3)
- "Como cada IA trabalha": **página**: é a tela que a escola aponta (regra 70, item 5)
- O filtro por estado da IA usa o parâmetro que a API já aceita

**Para a Tech Spec**

- Onde o sino se prende na casca, sem a casca importar módulo da área
- Como as abas convivem com os endereços de hoje

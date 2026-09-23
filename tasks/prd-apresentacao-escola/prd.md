# PRD — A escola montada pela coordenação

**Status:** aprovado (23/09/2026, Joaquim)
**Funcionalidade do roadmap:** A1 — `apresentacao-escola` (MVP de apresentação, D71 revista)
**Depende de:** A0b (painel da operação, D76)

## 1. Problema

O F1 tem a API de ano letivo, série, turma, disciplina e vínculo, mas nenhuma tela para a
coordenação, nenhum caminho para o professor chegar e nenhum para o aluno entrar: a escola só
existe com o dado que nós pomos. A primeira coisa que a coordenação precisa ver é a escola
cadastrada sem trabalho manual (D24), e é também a primeira que uma escola real vai fazer.

## 2. Objetivo

A partir de uma escola vazia, a coordenadora monta turmas com lista de nomes e professores
alocados, o professor entra pelo convite e confirma o vínculo, e os alunos reivindicam os nomes
com a aprovação dele — na tela, com a marca do Turmma, sem cadastro um a um.

## 3. Fora de escopo

- Criar a escola e convidar a primeira coordenadora: é o painel da operação, A0b (D2, D76)
- Grade horária, calendário e o "seu dia e sua semana"; XLSX, Classroom (D48) e reset de senha
  do aluno: F2 e F8
- Transferir, desligar ou desativar aluno aprovado (regra 20, item 18): F2 e F3
- Envio de e-mail: o convite é um link que a coordenação copia
- Material, IA e agentes: A2 em diante. **Esta funcionalidade não tem IA**
- Responsável e vínculo de responsável: fase posterior (ECA Digital, art. 24, em aberto)
- Item de navegação de fase que não existe (D73): na A1 o professor tem só **Turmas**, e o aluno
  só a própria turma
- Seed com escola ou pessoa pronta para a demonstração (D71 revista); fixture fica nos testes

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Coordenador | Criar ano letivo, série, disciplina e turma; subir e editar a lista de nomes; cadastrar professor e gerar, revogar e refazer o convite; alocar professor × turma × disciplina; aprovar ou recusar reivindicação de qualquer turma, com auditoria | Ver ou trocar senha de aluno; confirmar vínculo pelo professor; alcançar outra escola |
| Professor | Aceitar o convite; confirmar ou contestar cada vínculo (F1); gerar, revogar e refazer link e código da sala; aprovar ou recusar reivindicação nas turmas com vínculo confirmado | Criar turma, vínculo ou nome na lista; ver pedido de turma sem vínculo confirmado |
| Aluno | Pelo link ou código, escolher o próprio nome, informar a matrícula e criar a senha; aprovado, entrar por escola + matrícula + senha e ver a própria turma | Digitar nome livre; ver matrícula de colega; entrar antes da aprovação |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | A casca tem a pele da D72 (tokens e logotipo de `mockups/`) e a navegação da D73 para os três papéis; só aparece item de fase que existe | e2e em `chromebook` e `celular` percorre os três papéis; nenhum item leva a tela inexistente |
| RF2 | Trocar de escola troca a sessão, e nenhuma tela guarda dado da escola anterior (P30) | Professor em A e B: depois de ir para B, nenhuma requisição nem cache traz dado de A |
| RF3 | A coordenação cria ano letivo, série, disciplina e turma na tela, com as regras do F1 (D43; turma presa ao ano) | "5º ano" recusado com a mensagem do erro tipado |
| RF4 | A lista de nomes da turma sobe colada ou em CSV, uma linha por aluno com **nome e matrícula**. A tela aponta linha a linha o erro (sem nome, sem matrícula, matrícula repetida ou já usada na escola) e só grava a lista limpa | Duas linhas com erro: a tela mostra as duas e nada é gravado |
| RF5 | Reenviar a lista acrescenta só o que falta, pela matrícula. A coordenação acrescenta nome avulso e retira nome **livre**; reivindicado ou aprovado não sai por aqui | Mesma lista duas vezes não muda a contagem; retirar aprovado dá erro tipado |
| RF6 | A coordenação cadastra o professor (nome e e-mail de login) e copia o link do convite: uso único, 7 dias, revogável; refazer invalida o anterior | Usado, vencido, revogado e inexistente respondem igual |
| RF7 | O professor abre o convite, cria a senha e confirma ou contesta cada vínculo pendente (F1). Quem já tem conta em outra escola cliente aceita com ela e ganha o segundo vínculo | Aceite da escola B com a conta da A não cria conta nova; pendente não alcança a turma |
| RF8 | A coordenação aloca professor × turma × disciplina, e o vínculo nasce pendente (F1) | Sem confirmação, o professor não alcança a turma |
| RF9 | O professor com vínculo confirmado gera **link da sala** e **código da turma**, com validade de 1, 7 (padrão) ou 30 dias; "Gerar novo" revoga os anteriores na hora; o botão de WhatsApp compartilha um texto com o nome da escola e o link, nunca nome de aluno (P27) | Vencido e revogado respondem igual a inexistente; o texto não contém nome da lista |
| RF10 | O aluno vê só os nomes **livres** da turma, escolhe o seu, informa a matrícula e cria a senha. Matrícula que não bate com o nome é recusada sem dizer qual dos dois errou | Matrícula de outro nome e inexistente dão a mesma resposta; a lista não mostra matrícula |
| RF11 | Cada nome é reivindicado uma vez só, mesmo com dois pedidos no mesmo segundo (regra 80, item 7) | Dois pedidos simultâneos: um pendente, o outro recusado sem erro cru |
| RF12 | Professor da turma e coordenação veem os pedidos com nome e hora, aprovam um ou os selecionados; **não há "aprovar todos"**. Recusar devolve o nome à lista | Aprovar três selecionados cria três alunos; a tela não oferece aprovar tudo |
| RF13 | Só com a aprovação o aluno vira usuário, com a matrícula da lista, a senha criada e o vínculo na turma já com a data da decisão (`TODO.md`) | Antes da aprovação, o login responde igual a senha errada; depois, entra e vê só a turma dele |
| RF14 | Tentativa de código e de reivindicação tem limite por escola e por turma, nunca só por IP (regra 80, item 1) | 35 alunos do mesmo IP reivindicam no mesmo minuto sem bloqueio; excesso segura o código, não o IP |
| RF15 | Tudo alcança só a escola ativa e o ano letivo em curso; id de outra escola responde igual a inexistente (regra 10) | Teste de isolamento para turma, lista, pedido, convite e link |
| RF16 | Auditoria com autor, data e escola: cadastro de professor, convite (gerado, revogado, usado), lista (subida, editada), link da sala (gerado, revogado), reivindicação (aprovada, recusada), destacando quando quem decidiu foi a coordenação | Cada ação gera registro consultável por teste |
| RF17 | Nenhuma resposta traz senha, token, matrícula de outro aluno ou campo fora do contrato (regra 20, item 4) | Teste percorre as rotas novas procurando esses campos |
| RF18 | Toda tela nova tem os quatro estados, teclado e toque, e o vazio diz o próximo passo | e2e nos dois projetos, com verificação de acessibilidade |
| RF19 | Seis turmas de 35 alunos reivindicam ao mesmo tempo, em cinco minutos, sem erro cru (regra 80) | Cenário de carga versionado da rajada, na régua do login do F1 |

## 6. Regras de negócio

- Aluno só entra por reivindicação aprovada por humano (D4, regra 60 item 7); matrícula única
  por escola (item 6); vínculo do professor vem da escola e só vale confirmado (item 8a); turma,
  vínculo e lista pertencem ao ano letivo (item 5)
- Convite e link têm expiração e revogação (regra 20, item 8). O link da sala é de uso
  múltiplo; o único é a reivindicação de cada nome (P27)
- O convite não sai do sistema: nenhum dado vai a provedor de e-mail
- Aluno sem e-mail, telefone, foto nem data de nascimento (regra 20, item 2)
- Na demonstração, nomes inventados e digitados por nós (D71)
- Nenhuma contagem pública de quem entrou nem placar de turma (D59)

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Dois alunos com o mesmo nome | Os dois aparecem; cada um só é reivindicado com a própria matrícula |
| Aluno pega o nome do colega | Sem a matrícula dele, é recusado; com ela, o professor vê o pedido e recusa, e o nome volta livre |
| Aluno que chega em maio | A coordenação acrescenta o nome; ele usa o link vigente ou um novo |
| Turma sem professor alocado | Sem link da sala; pedido que chegue por link antigo é decidido pela coordenação, com auditoria |
| Matrícula repetida ou já usada na escola | Apontada na linha; nada é gravado |
| Convite aberto depois de refeito | Responde como inexistente e orienta pedir outro à coordenação |
| Link projetado que circulou no grupo depois da semana | Venceu; responde como inexistente |
| Aluno fecha a aba no meio | Ou o pedido foi feito inteiro, ou o nome continua livre |
| Virada de ano letivo | Lista e link do ano encerrado não aceitam reivindicação |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Em `docs/lgpd.md`? |
|---|---|---|---|---|
| Nome e matrícula na lista, antes da reivindicação | aluno | o aluno reivindicar o próprio nome | livre: fim do ano letivo; reivindicado: vira o cadastro | **não** |
| Pedido de reivindicação (nome, hora, estado, quem decidiu, quando) | aluno e quem decidiu | aprovação humana da identidade (D4) | vigência + 5 anos | **não** |
| Convite de professor, link e código da sala (hash, datas, turma) | professor, turma | primeiro acesso e entrada do aluno | 30 dias depois de usar, revogar ou vencer | **não** (só o de coordenador) |
| Contador de tentativas de código e de reivindicação (HMAC) | aluno | proteção contra força bruta | 15 minutos | **não** |
| Hash de senha; nome e e-mail do professor | aluno; professor | autenticar; acesso | já definida | sim |

As linhas novas entram em `docs/lgpd.md` na tarefa que cria a tabela (regra 20, item 1). Nada
desta funcionalidade vai a provedor externo.

## 8b. Risco regulatório

Não há IA no caminho de ninguém: a classificação do CNE e a AIA não se aplicam (D60). Valem a
D59 e a minimização da regra 20.

## 9. Métricas

- A coordenadora monta duas turmas com lista e professor alocado em até 15 minutos, sem ajuda
- 35 reivindicações aprovadas em até 10 minutos numa aula, com zero duplicidade e zero erro cru
- Nenhum aluno aprovado com matrícula diferente da lista (auditoria)

## 10. Perguntas em aberto

1. Tamanho do código da turma (sem letras que confundem) e o limite de tentativas: Tech Spec,
   com o `infra-guardian`
2. O que o `Reivindicacao.dispositivo` do modelo guarda, se guardar: sem IP nem impressão do
   navegador (regra 20). Tech Spec, com o `privacy-guardian`
3. Formato do CSV (separador, cabeçalho, acento vindo do Excel) e limite de linhas por envio
   (regra 80, item 3)
4. Os avatares dos três agentes chegam antes da Tech Spec (`CLAUDE.md`); a casca da A1 já reserva
   o lugar de "Seu time", mesmo sem agente?
5. Borda de campo `#8F8F8F` no lugar do `#D9D9D9` do mockup, pelo contraste de 3:1
   (`docs/interface.md` 9.1): confirmar com o Gabriel

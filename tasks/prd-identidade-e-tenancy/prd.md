# PRD — Identidade e tenancy

**Status:** rascunho
**Funcionalidade do roadmap:** F1
**Depende de:** F0 (fundação técnica)

## 1. Problema

Renata vai entregar ao sistema os nomes e as turmas de novecentos adolescentes. Se a Camila,
que dá aula no colégio dela e numa escola da rede, abrir a tela e vir um aluno da outra
escola, a venda acaba na cidade inteira. Hoje o sistema não sabe quem é quem, de qual
escola, em qual ano, nem com que direito.

Às 7h30 duas mil pessoas entram atrás do mesmo IP, e às 9h o Enzo usa o Chromebook que
outro aluno usou às 8h. Login lento atrasa a aula; login frouxo põe um aluno na conta do
colega.

## 2. Objetivo

Cada pessoa entra com a identidade que a escola deu a ela e alcança só o que o vínculo dela
permite, na escola e no ano letivo ativos, e nada de uma escola chega a outra.

## 3. Fora de escopo

- Telas de estrutura (série, turma, disciplina, alocação): F2. No F1 a estrutura existe pela
  API e pelo seed sintético
- Convite, link da sala, lista de nomes, reivindicação, importação de planilha, grade,
  calendário e Classroom: F2
- Reset de senha do aluno pela escola e recuperação de senha por e-mail: F2
- Ligar conta Google ou Microsoft de aluno: F2 (importação ou reivindicação)
- Auditoria consultável, exportação e eliminação por titular: F3. O F1 só grava o registro
- Leitura do próprio histórico pelo aluno (turmas de anos encerrados): F9. Decidido na 10.0 e
  ratificado na validação de 20/09/2026: no F1 esse histórico seria só a lista de turmas
  passadas, sem nota nem entrega, e o valor aparece com o desempenho do F9. No F1 o aluno vê de
  si a escola e o papel de agora, por `/v1/eu`, e `?anoLetivoId` é recusado para ele
- Telas da rede e do responsável: F14 e fase posterior. O F1 só declara a permissão deles
- Suporte nosso entrando como a escola
- Identidade visual: as telas usam a casca neutra do F0

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Operador Educa.ia | criar rede, escola com endereço próprio e o primeiro coordenador, por comando registrado; redefinir o MFA do único coordenador a pedido formal da escola | ler dado de pessoa da escola; entrar como usuário dela |
| Rede | ter o papel declarado na matriz | alcançar dado individual de aluno ou professor |
| Coordenador | entrar com senha e MFA; criar ano letivo, série, turma, disciplina e vínculo pela API; encerrar vínculo; cadastrar domínio Google ou tenant Microsoft; redefinir MFA de outro coordenador; ver a unidade | entrar sem MFA; ver indicador nominal de professor sem auditoria |
| Professor | entrar por e-mail e senha ou pela conta da escola; confirmar ou contestar cada vínculo; trocar de escola; ler as próprias turmas de anos encerrados | criar ou alterar vínculo; alcançar aluno por vínculo não confirmado; editar ano encerrado |
| Aluno | entrar pelo endereço da escola com matrícula e senha, ou pela conta da escola já ligada; ver a si (escola e papel de agora, por `/v1/eu`) | ver colega; entrar por conta externa não ligada; ler o próprio histórico de anos encerrados, que é do F9 (seção 3) |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | O operador cria rede, escola (com endereço próprio) e o convite do primeiro coordenador por comando. Não há rota pública de cadastro, e nenhum comando do operador devolve dado de pessoa da escola | Nenhuma rota cria escola; os comandos do operador, numa escola com alunos, não retornam nome, matrícula nem vínculo |
| RF2 | O coordenador cria ano letivo, série, turma e disciplina. Série só do 6º ao 9º ano e do 1º ao 3º do Ensino Médio (D43) | "5º ano" é recusado com erro tipado; turma pertence a um ano letivo |
| RF3 | O coordenador cria vínculo professor × turma × disciplina, que nasce pendente. O professor não cria vínculo | Professor tentando criar vínculo é recusado; o vínculo criado aparece pendente |
| RF4 | O professor confirma ou contesta cada vínculo separadamente; contestar exige motivo curto | Confirmar um e contestar outro deixa cada um no seu estado, com autor e data |
| RF5 | Vínculo pendente, contestado ou encerrado não dá acesso à turma nem aos alunos dela, e o encerramento vale a partir da requisição seguinte, sem esperar a sessão expirar | Pendente: a turma responde como inexistente. Encerrado com sessão aberta: a próxima requisição já não alcança |
| RF6 | Coordenador e professor entram por e-mail e senha; senha errada e e-mail inexistente respondem igual | Teste compara as duas respostas |
| RF7 | O aluno entra pelo endereço da escola com matrícula e senha; a mesma matrícula em outra escola é outra conta | Duas escolas com a matrícula 1234: cada aluno só entra no endereço da própria |
| RF8 | Login pela conta Google ou Microsoft só aceita conta do domínio ou tenant cadastrado pela escola, conferido na resposta assinada do provedor. Guarda-se só provedor e identificador estável, nunca o e-mail como chave; do aluno, e-mail, nome e foto são descartados antes de gravar | Com o provedor falso: conta pessoal, de outro domínio e de outro tenant são recusadas; após login de aluno, nenhum registro tem e-mail ou foto |
| RF9 | No primeiro login pela conta externa, o professor é ligado se domínio ou tenant e e-mail batem com os dele na escola. Se ele já tem outra conta externa ligada, a nova não liga sozinha | A primeira entrada liga; outra conta com o mesmo e-mail e outro identificador é recusada e orienta procurar a coordenação |
| RF10 | Aluno só entra por conta externa já ligada; sem ligação, a tela orienta a usar a matrícula ou procurar o professor | Conta válida do domínio, sem ligação, não cria usuário |
| RF11 | Senha errada repetida segura a conta com espera crescente, por conta, nunca por IP | 10 erros seguram só o Enzo; os outros 399 alunos do mesmo IP entram |
| RF12 | O coordenador só acessa depois de configurar o segundo fator: código de app autenticador (que roda no computador) com códigos de recuperação de uso único; chave de acesso é opcional. Nenhum passo exige celular | Sem MFA, só alcança a configuração do MFA; código de recuperação usado não vale de novo |
| RF13 | A sessão do aluno termina ao fechar o navegador ou após inatividade configurável por escola (padrão 30 min); Sair está em toda tela | Após o tempo sem uso, ou ao reabrir o navegador, a próxima ação pede login |
| RF14 | Um mesmo login tem vínculos em mais de uma escola; o seletor mostra só as dele, e tudo abaixo é da escola ativa | Com A ativa, só dado de A; trocar para B não leva nada de A |
| RF15 | Toda leitura e escrita alcança só a escola ativa e o ano letivo em curso; id de outra escola responde igual a id inexistente | Teste de isolamento por módulo: A não lê, não escreve e não descobre existência de nada de B |
| RF16 | O professor lê, sem editar, as próprias turmas de anos encerrados; sem vínculo na escola, nada. A leitura do próprio histórico pelo aluno é do F9 (seção 3) | Professor que saiu em março não alcança a turma em outubro; o que ficou lê e não altera |
| RF17 | A matriz de permissão por papel e recurso é declarada num lugar só e inclui indicador de professor: próprio para ele, agregado para coordenação e rede, nominal para a coordenação só com auditoria | Um teste por célula da matriz; mudar uma célula sem mudar o teste deixa a esteira vermelha |
| RF18 | Nenhuma resposta traz senha, segredo de MFA, código de recuperação, identificador externo ou campo fora do contrato de saída | Teste percorre as rotas do F1 procurando esses campos |
| RF19 | Ficam registrados com autor, data e escola: ações do operador, criação, confirmação, contestação e encerramento de vínculo, mudança de papel, redefinição de MFA e ligação de conta externa | Cada ação gera um registro consultável por teste |
| RF20 | Telas de login (e-mail, matrícula, conta da escola), MFA, seletor de escola e confirmação de vínculo têm os quatro estados e funcionam em `chromebook` e `celular`, por teclado e por toque | e2e percorre cada tela nos dois projetos; o erro diz o que fazer |
| RF21 | Na rajada das 7h30, 2.100 alunos entram em cinco minutos com p95 do login abaixo de 1 s, sem ninguém bloqueado por IP | Cenário de carga versionado com usuários sintéticos e o custo real do hash de senha |

## 6. Regras de negócio

- Escola é o tenant e ano letivo a segunda dimensão; o escopo vem do token (regra 10)
- Matrícula é única por escola, nunca globalmente
- Vínculo é definido pela escola e só confirmado pelo professor (regra 60, item 8a)
- Aluno não tem e-mail, telefone nem foto; da conta externa, só o identificador (regra 20)
- "Não encontrado" e "sem permissão" respondem igual
- Sem cadastro público, e o operador não lê dado de pessoa (D2)
- Nenhum fluxo exige celular (regra 50, item 2)
- Fim de vínculo desativa o acesso (regra 20, item 18)

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Professor discorda de uma alocação | Contesta aquele vínculo com motivo; os outros seguem confirmáveis |
| Turma sem professor alocado | Existe para a coordenação; nenhum professor a alcança |
| Professor com duas disciplinas na mesma turma | Dois vínculos, confirmados separadamente |
| Professor sai em março de uma das duas escolas | Perde a turma encerrada na próxima requisição; o vínculo na outra escola continua |
| Aluno transferido de escola | Conta nova na escola nova; a antiga deixa de acessar |
| Virada de ano letivo | Ano anterior só leitura para quem tinha vínculo; turmas novas no ano novo |
| Chromebook do carrinho entre duas turmas | A sessão anterior terminou por inatividade ou fechamento; o aluno seguinte nunca a herda |
| Admin da escola não liberou o app no Google para menores | Mensagem em português diz o que a escola precisa liberar e oferece a matrícula |
| E-mail de professor que saiu é recriado para outra pessoa | O identificador novo não liga à conta antiga; a coordenação decide |
| Escola com dois domínios Google | A escola cadastra os dois; conta de qualquer um vale |
| Único coordenador perde o app autenticador e os códigos | Operador redefine a pedido formal da escola, com registro, sem ver dado de pessoa |
| Escola revoga o app no meio do ano | Login pela conta falha com mensagem clara; matrícula e senha continuam |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Já está em `docs/lgpd.md`? |
|---|---|---|---|---|
| Nome, e-mail | professor, coordenador | acesso e responsabilidade | vigência + 5 anos | sim |
| Nome, matrícula | aluno | identificar e login | ano letivo + 5 anos | sim |
| Identificador opaco da conta externa | aluno, professor | login (D48) | enquanto houver vínculo | sim |
| Registro de acesso (IP, data, hora) | todos | segurança (Marco Civil) | 6 meses | sim |
| Hash de senha | quem tem senha | autenticar | enquanto houver vínculo | **não** |
| Segredo de MFA e códigos de recuperação | coordenador | segundo fator | enquanto houver vínculo | **não** |
| Vínculo, estado e motivo de contestação | professor | acesso por objeto | vigência + 5 anos | **não** |
| Contador de tentativas de login | todos | proteção contra força bruta | janela curta | **não** |

As linhas "não" entram em `docs/lgpd.md` na tarefa que criar o campo.

## 8b. Risco regulatório

Não há IA no caminho desta funcionalidade. Nada a classificar. A matriz já declara o
indicador de professor (regra 70, item 8).

## 9. Métricas

- p95 do login na rajada das 7h30 e contas seguradas por senha errada
- Logins pela conta da escola recusados, por motivo e por escola
- Vínculos contestados sobre o total, que mostra alocação errada
- Zero resposta de outra escola nos testes de isolamento, a cada commit

## 10. Perguntas em aberto

- Login global com vínculos por escola, ou usuário por escola ligado a uma identidade?
  (`docs/modelo-de-dados.md` deixa para a Tech Spec)
- Coordenador que entra pela conta da escola: nosso segundo fator vale sempre, ou aceitamos
  o do provedor?
- Endereço da escola em subdomínio ou caminho, e por onde entra o professor de várias escolas
- Inatividade padrão do professor e do coordenador
- O registro do RF19 é tabela mínima que o F3 expande, ou já a auditoria do F3?
- Como a contestação de vínculo chega à coordenação antes do motor de eventos (F13)
- Chave de acesso (passkey) no F1 ou depois?
- Não verificado: se o Google devolve o domínio sem escopo de e-mail, e se a Microsoft
  bloqueia menor em app de terceiro. Testar com conta real
- Checklist para a TI da escola liberar o app no Google e na Microsoft: F1 ou F2?

# PRD — Fundação técnica

**Status:** aprovado (revisto em 13/09/2026: F0 só local, D31)
**Funcionalidade do roadmap:** F0
**Depende de:** nada

## 1. Problema

Às 10h de uma segunda, a Camila aplica a prova do 2ºB enquanto outra escola sobe 300
apostilas e 400 alunos entram pelo mesmo IP do colégio. Se a base não separa o trabalho de
cada escola, não limita por pessoa e não aguenta uma instância caída, a prova trava na
frente da turma.

O Joaquim opera sozinho, sem plantão. Sem base comum, cada funcionalidade decide do seu
jeito como logar, devolver erro e enfileirar. O primeiro nome de aluno num log, ou o
primeiro problema que ninguém mediu, só aparece quando já existe escola real.

## 2. Objetivo

Toda funcionalidade seguinte nasce sobre uma base que sobe local com um comando, passa por
uma esteira a cada commit, isola a carga de cada escola, não registra dado pessoal e mede
o que precisa para alertar.

## 3. Fora de escopo

- Staging e tudo o que só um ambiente remoto prova: deploy automático, acesso fechado e
  link de demonstração, check externo de disponibilidade, alerta chegando ao celular, custo
  do ambiente. O staging é criado antes da primeira demonstração externa ou do piloto (D31).
  O que já foi pesquisado e desenhado está em `notas-staging.md`, nesta pasta
- Escola, usuário, login e escopo de tenant no repository (F1). No F0, limites por escola e
  por usuário são provados com identidades sintéticas
- Camada de IA, modelo local, gateway e adaptador falso (F5)
- Produção, backup e restauração
- Identidade visual, layout por papel e seletor de escola (F2 em diante)
- Seed de escola completa (F3 e F15)
- Rateio de custo por escola: o F0 entrega só a marcação de uso por escola
- Página de status e aviso às escolas
- Cenário completo "manhã de segunda" (F16)

## 4. Papéis envolvidos

Nenhum papel da escola usa o F0. Quem toca a funcionalidade é o time.

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Desenvolvedor (Joaquim, com o Claude executando) | subir o ambiente local, ver painel e alertas locais, rodar o cenário de carga, publicar no `main` | contornar guarda da esteira ou desabilitar teste (regra 40); usar dado real no ambiente local |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | O ambiente local inteiro sobe com um único comando (web, API, realtime, worker, banco, fila, cache, storage, observabilidade), sem conta em serviço externo | Numa máquina limpa, só com o repositório, tudo sobe e o e2e passa |
| RF2 | API, realtime e worker são processos separados, sem estado em memória que outra instância precise | Parar o worker não derruba a API; com duas APIs, o limite de um usuário soma as duas, e derrubar uma não muda o resultado das requisições seguintes |
| RF3 | Com duas instâncias de realtime, a mensagem chega ao cliente em qualquer uma delas | Dois clientes em instâncias diferentes recebem a mensagem |
| RF4 | Trabalho enfileirado tem prioridade interativa, normal ou lote, e interativo nunca espera lote | Com a fila de lote cheia, um job interativo começa antes de qualquer lote não iniciado |
| RF5 | Cada escola tem limite configurável de jobs simultâneos por fila | Escola A com 1.000 jobs de lote não passa do limite, e um lote da escola B começa sem esperar os da A |
| RF6 | Lote não urgente só começa fora do horário letivo da escola, configurável, com padrão de segunda a sexta, das 7h às 18h | Criado às 10h de uma terça, começa depois das 18h; criado num sábado, começa na hora |
| RF7 | Job aceito sobrevive a reinício do worker; falha é repetida com espera crescente até um limite e depois fica visível como falha | Matar o worker no meio retoma o job; falha permanente fica registrada com escola e motivo tipado |
| RF8 | O rate limit é por usuário e por escola, nunca só por IP. Rota anônima limita por IP com teto que comporta uma escola atrás de um NAT | 400 usuários sintéticos de uma escola num único IP não são bloqueados; um acima do próprio limite recebe espera e os outros 399 seguem |
| RF9 | Todo log é estruturado e identifica escola, usuário e requisição por id | Uma requisição é seguida pelo id em API, fila e worker |
| RF10 | Toda resposta de erro tem código tipado e mensagem curta que diz o que fazer; exceção não tratada vira erro genérico, sem stack nem detalhe interno | Teste força exceção não tratada e verifica que a resposta não traz stack, consulta nem valor de campo |
| RF11 | A esteira reprova: log com campo pessoal (nome, matrícula, e-mail, resposta, nota, conversa); import de SDK de provedor de IA fora dos adaptadores; segredo commitado; dependência com vulnerabilidade grave conhecida | Um caso de teste para cada guarda faz a checagem falhar |
| RF12 | Todo commit no `main` passa pela esteira do GitHub (tipos, lint, guardas, testes e e2e), sem depender de nada da máquina do desenvolvedor | Um commit com teste quebrado deixa a esteira vermelha; corrigido, fica verde, sem credencial além das do próprio GitHub |
| RF13 | A casca da web, em pt-BR, busca dado da API e mostra carregando, vazio, erro e com dado | O e2e força os quatro estados; o de erro diz o que fazer, não o código |
| RF14 | A esteira reprova bundle da web acima do teto declarado e violação grave de acessibilidade; a casca navega por teclado com foco visível | Commit acima do teto fica vermelho; o e2e percorre a casca só com teclado |
| RF15 | Painel local mostra latência p95 e taxa de erro por rota, tamanho da fila e espera do job mais antigo por escola e prioridade, conexões no realtime e uso do pool do banco | Depois do cenário de carga, a fila da escola A aparece separada da B |
| RF16 | As regras de alerta ficam versionadas, cada uma com entrada em `docs/runbook.md`: job interativo esperando mais de 30 s, seguro de limite ativo e taxa de erro 5xx | Um ensaio local provoca cada condição e a regra passa a disparada no painel |
| RF17 | Requisições, jobs e armazenamento ficam marcados com o id da escola | Uma consulta devolve o uso por escola sintética no dia e no mês |
| RF18 | Cenário de carga versionado "justiça entre escolas" roda contra o ambiente local: uma escola enche o lote, outra dispara interativos, e 400 usuários de uma escola chegam pelo mesmo IP | Passa quando a espera do interativo da B com a A enchendo o lote fica dentro da margem declarada sobre a espera sem a A, nenhum interativo passa de 30 s e ninguém é bloqueado por IP |

## 6. Regras de negócio

- Ambiente local e esteira só usam dado sintético (regra 20)
- Rate limit por usuário e por escola; IP só em rota anônima (regra 80)
- Lote nunca atrasa interativo, e uma escola não degrada outra (regra 80)
- Limite, horário letivo e teto são configuração, nunca constante (D41)
- Nada no caminho crítico depende de plataforma proprietária (regra 00, D12)
- Com commit direto no `main` e sem staging, a esteira é o portão (D23, D31)
- Alerta novo entra junto com a sua entrada no runbook (regra 80)
- O uso nasce marcado por escola, para o custo de infra ser medido depois (D30)

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| 7h30, 400 alunos da mesma escola pelo IP do colégio | Ninguém é bloqueado por IP; cada um tem o próprio limite |
| Uma escola sobe 300 apostilas enquanto a professora de outra espera uma ferramenta | O interativo não espera; a fila cresce só na escola que ingere |
| Worker reinicia no meio da correção de uma turma | O job é retomado; não some nem fica preso "em andamento" |
| Uma instância de API trava durante a aula | A outra atende; o cliente não vê erro cru |
| Violação de restrição única cujo texto do banco traz o valor ("Enzo Martins já existe") | Nem resposta nem log carregam o valor, só o código |
| Commit vermelho no `main` | A próxima tarefa não começa antes de a esteira voltar a verde |
| Feriado numa quarta | O padrão não conhece feriado; o lote não urgente espera até as 18h, sem erro |
| Escola com aula aos sábados | Vale o horário letivo configurado da escola |
| Desenvolvedor sobe o projeto em outra máquina | Sobe com o mesmo comando, sem credencial nem arquivo que só existia na máquina anterior |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Já está em `docs/lgpd.md`? |
|---|---|---|---|---|
| Endereço IP | quem acessa rota anônima | rate limit | janela curta, na chave de limite | sim ("Logs de acesso") |

Nenhum dado de aluno, professor ou responsável nasce no F0. Métrica e alerta são locais e
recebem só id. O único serviço externo é o GitHub, com código e dado sintético.

## 8b. Risco regulatório

Não há IA no caminho desta funcionalidade. Nada a classificar. O RF11 prepara a regra 30
para o F5.

## 9. Métricas

- Tempo da esteira por commit e minutos do GitHub Actions usados no mês
- Casos reprovados por guarda, que mostram que o guarda pega
- Resultado do cenário "justiça entre escolas" a cada execução
- Tempo para uma máquina limpa subir o ambiente e passar o e2e

## 10. Perguntas em aberto

- Concorrência por escola nas filas: licença paga, limitador próprio ou fila por escola, à
  luz da regra 00 (`docs/infra.md` 5.3)
- Ferramenta de métrica e alerta local
- Valores iniciais: limites por usuário, escola e IP anônimo; concorrência por escola; teto
  do bundle; margem do cenário de carga
- Se o armazenamento do rate limit cai no horário letivo, a API libera ou segura? Erro cru
  não é opção (regras 50 e 80)

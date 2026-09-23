# PRD — Painel da operação Turmma

**Status:** aprovado (23/09/2026, Joaquim)
**Funcionalidade do roadmap:** A0 — `apresentacao-operacao` (MVP de apresentação, D76)
**Depende de:** F1

## 1. Problema

Hoje a escola nasce no terminal: o operador roda `ops:escola` e `ops:convite-coordenador`, e o
token do convite fica num arquivo que ele precisa lembrar de apagar. Só quem tem o repositório na
máquina consegue, a demonstração começa numa tela preta, e o uso de cada escola, que o sistema
mede desde o F0, só se lê escola por escola pelo `ops:uso`. Sem ver uso e custo por escola, não há
como conferir durante o MVP as metas de R$ 2 de infra (D30) e R$ 5 de IA (D39) por aluno.

## 2. Objetivo

A equipe Turmma cria rede e escola, convida a primeira coordenadora e acompanha o uso de cada
escola numa tela própria, sem nunca ver dado de pessoa da escola.

## 3. Fora de escopo

- Consumo de IA por escola: entra nesta mesma tela com a A2, que traz o registro de consumo
- Custo de infra em reais: espera o provedor de hospedagem (D42); aqui é contagem
- Editar, suspender ou encerrar escola e rede; fim de contrato e exportação (D63): F16
- Criar e desativar operador pela tela: é por comando
- Qualquer leitura de dentro da escola: turma por nome, pessoa, nota, conversa, material (D10)
- Painel da rede para a secretaria (F14): é outra coisa, do cliente
- Cadastro público de escola (D2)

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Operador Turmma | Entrar com senha e segundo fator; criar rede e escola; gerar, revogar e refazer o convite da primeira coordenação; ver a lista de escolas com estado, contagens e uso | Ver nome, e-mail, matrícula ou qualquer conteúdo de pessoa da escola; entrar numa escola como usuário dela; criar outro operador |
| Coordenador, professor, aluno, rede | Nada aqui | Alcançar qualquer rota ou tela do painel, nem saber que ela existe |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | A conta de operador é separada das contas de escola e nasce por comando, com o registro de quem a criou. Não há rota que crie operador | Nenhuma rota cria operador; o comando grava a auditoria com quem rodou |
| RF2 | O operador entra por e-mail e senha e só alcança o painel depois de configurar o segundo fator (app autenticador, com códigos de recuperação), no mesmo mecanismo da coordenação (F1, RF12) | Sem segundo fator, só a tela de configurá-lo responde; código de recuperação usado não vale de novo |
| RF3 | Senha errada repetida segura a conta de operador com espera crescente, por conta; e-mail inexistente e senha errada respondem igual | Teste compara as duas respostas; 10 erros seguram só aquela conta |
| RF4 | Sessão de escola não alcança nenhuma rota do painel, e sessão de operador não alcança nenhuma rota de escola: as duas respondem igual a rota inexistente | Com sessão de coordenador, professor e aluno, toda rota do painel responde como inexistente; com a de operador, as rotas de escola também |
| RF5 | O operador cria rede (nome, tipo: prefeitura, grupo ou independente) e escola (rede, nome, endereço), com as regras do `ops:escola` | Endereço repetido é recusado com erro tipado; escola criada aparece na lista |
| RF6 | O operador cadastra a primeira coordenadora da escola (nome e e-mail) e o link do convite aparece **uma vez** na tela, para copiar; depois disso o token não é mais mostrado nem guardado em claro. Convite de uso único, 72 h, revogável; refazer gera outro e invalida o anterior | Recarregar a tela não mostra o link de novo; usado, vencido, revogado e inexistente respondem igual |
| RF7 | A lista de escolas mostra, por escola: rede, nome, endereço, estado (convite pendente, convite vencido, ativa) e as contagens de turmas, professores ativos e alunos ativos do ano letivo em curso. **Só número**: nome e e-mail da coordenadora não aparecem depois do cadastro | Teste percorre as respostas do painel procurando nome, e-mail, matrícula e texto de pessoa da escola, e não encontra |
| RF8 | A tela de uso mostra, por escola, requisições, jobs e bytes de storage do último dia fechado e do mês, lidos do uso diário medido desde o F0 (D30); o dia de hoje aparece depois da consolidação | Com uso sintético gravado em duas escolas, cada uma mostra o seu, e a soma do mês bate com os dias |
| RF9 | A lista e o uso comparam as escolas lado a lado, ordenáveis por nome e por uso, e paginados | Com 30 escolas sintéticas, a lista pagina e ordena sem trazer tudo de uma vez |
| RF10 | Toda ação do operador fica na auditoria com o identificador dele: entrada, criação de rede e escola, convite gerado, revogado e refeito | Cada ação gera registro consultável por teste, com o operador certo |
| RF11 | A leitura entre escolas fica num módulo só, marcado como consulta sem escopo com a justificativa escrita em cada uma (regra 10, item 9), e nenhum outro módulo o importa | Teste de arquitetura: só o módulo do painel usa as consultas sem escopo dele |
| RF12 | As telas têm a pele da D72, com a marca de que ali é a operação, os quatro estados, teclado e toque, e funcionam em `chromebook` e `celular` | e2e nos dois projetos, com verificação de acessibilidade |

## 6. Regras de negócio

- **A escola é a controladora; nós somos operadores** (D10): o painel vê o que é nosso ver — que
  a escola existe, se foi ativada, quanto usa —, nunca quem está nela
- **Não é cadastro público** (D2): criar escola continua sendo ato nosso, auditado
- **Os comandos `ops:*` continuam**, com as mesmas regras e a mesma auditoria; a tela e o
  comando são dois caminhos para o mesmo caso de uso
- **Dado sintético** no MVP (D71): as escolas criadas na demonstração têm nome inventado
- **Contagem não é ranking**: o painel compara uso de escolas para operar custo, e não mostra
  nada por professor nem por aluno (D45, D64)

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Operador fecha a aba antes de copiar o link do convite | Refaz o convite; o anterior deixa de valer |
| A coordenadora não abriu o convite em 72 h | A escola aparece como "convite vencido", e o operador refaz |
| Dois operadores refazem o mesmo convite no mesmo segundo | Só um convite fica valendo, sem erro cru (regra 80, item 7) |
| Escola sem nenhum uso ainda | Aparece com zero, não some da lista |
| Operador que saiu da equipe | A conta é desativada por comando e a próxima requisição dele já não alcança nada |
| Operador tenta abrir uma turma ou um aluno pelo id | Responde igual a inexistente |
| Escola criada no fim do dia | O uso de hoje só aparece depois da consolidação, com o aviso de qual foi o último dia fechado |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Em `docs/lgpd.md`? |
|---|---|---|---|---|
| Conta de operador (nome, e-mail, hash de senha, segundo fator cifrado) | nossa equipe | entrar no painel | enquanto for da equipe | sim (D76) |
| Nome e e-mail da primeira coordenadora, digitados pelo operador | coordenador | enviar o convite | os do convite e da conta, já definidos | sim |
| Identificador do operador na auditoria | nossa equipe | prestação de contas à escola | vigência + 5 anos | sim |

As contagens e o uso não são dado pessoal: não identificam ninguém. Nada vai a provedor externo.

## 8b. Risco regulatório

Não há IA nem dado de aluno. O risco é de isolamento e de privacidade (regras 10 e 20), coberto
pelos RF4, RF7 e RF11.

## 9. Métricas

- Da escola vazia ao convite copiado em até 2 minutos, sem terminal
- Durante o MVP, o uso de cada escola sintética é lido no painel, sem rodar `ops:uso`
- Zero dado de pessoa da escola em qualquer resposta do painel (teste do RF7)

## 10. Perguntas em aberto

1. Onde o painel mora: mesmo endereço da web com rota própria, ou endereço separado; e, em
   produção, se fica atrás de rede interna. Tech Spec, com o `infra-guardian`, junto da D42
2. Tempo de inatividade da sessão do operador (mais curto que o da coordenação?): Tech Spec
3. A tabela da conta de operador não tem escola: é a exceção "tabela sem dono" da regra 10, item
   1, e precisa estar escrita assim na Tech Spec, com o `tenancy-guardian`
4. A contagem de "alunos ativos" é o número de alunos com vínculo confirmado no ano em curso?
   Fecha na Tech Spec, junto da definição que a A1 usa

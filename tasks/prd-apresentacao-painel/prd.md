# PRD — Painel da operação Turmma

**Status:** aprovado (23/09/2026, Joaquim). Dividido no mesmo dia do PRD aprovado da A0: a
identidade do operador ficou em `tasks/prd-apresentacao-operacao/prd.md`, e o painel veio para cá
**Funcionalidade do roadmap:** A0b — `apresentacao-painel` (MVP de apresentação, D76)
**Depende de:** A0

## 1. Problema

Hoje a escola nasce no terminal: o operador roda `ops:escola` e `ops:convite-coordenador`, e o
token do convite fica num arquivo que ele precisa lembrar de apagar. Só quem tem o repositório na
máquina consegue, a demonstração começa numa tela preta, e o uso de cada escola, medido desde o
F0, só se lê escola por escola pelo `ops:uso`. Sem ver uso por escola, não há como conferir durante
o MVP as metas de R$ 2 de infra (D30) e R$ 5 de IA (D39) por aluno.

## 2. Objetivo

O operador cria rede e escola, convida a primeira coordenadora e acompanha o uso de cada escola
numa tela própria, sem nunca ver dado de pessoa da escola.

## 3. Fora de escopo

- Consumo de IA por escola: entra nesta mesma tela com a A2
- Custo de infra em reais: espera o provedor de hospedagem (D42); aqui é contagem
- Editar, suspender ou encerrar escola e rede; fim de contrato e exportação (D63): F16
- Qualquer leitura de dentro da escola: turma por nome, pessoa, nota, conversa, material (D10)
- Painel da rede para a secretaria (F14)
- Cadastro público de escola (D2)

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Operador Turmma | Criar rede e escola; gerar, revogar e refazer o convite da primeira coordenação; ver a lista de escolas com estado, contagens e uso | Ver nome, e-mail, matrícula ou qualquer conteúdo de pessoa da escola |
| Coordenador, professor, aluno | Nada aqui | Alcançar qualquer rota do painel (A0, RF6) |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | O operador cria rede (nome, tipo: prefeitura, grupo ou independente) e escola (rede, nome, endereço de entrada — o `slug` de `/e/<slug>`, não o endereço postal), com as regras do `ops:escola`; clique duplo não cria duas | Endereço repetido dá erro tipado; dois pedidos iguais em paralelo criam uma só |
| RF2 | O operador cadastra a primeira coordenadora (nome e e-mail); a tela mostra antes o que vai acontecer, e o link do convite aparece **uma vez**, para copiar. Convite de uso único, 72 h; revogar e refazer pedem confirmação, e refazer invalida o anterior | Recarregar não mostra o link; o banco guarda só o hash; dois gerar ou gerar e refazer em paralelo deixam um só convite valendo |
| RF3 | A lista de escolas mostra, por escola: rede, nome, endereço, estado (convite pendente, convite vencido, convite revogado, ativa) e as contagens de turmas, professores ativos e alunos ativos do ano letivo em curso. **Só número** | Valores sentinela de nome, e-mail e matrícula semeados na escola não aparecem em nenhuma resposta do painel, inclusive de erro |
| RF4 | A tela de uso mostra, por escola, requisições, jobs e bytes de storage do último dia fechado e do mês (D30); o dia de hoje aparece depois da consolidação | Com uso sintético em duas escolas, cada uma mostra o seu; o mês soma requisições e jobs e pega o pico de bytes |
| RF5 | Lista e uso comparam as escolas lado a lado, ordenáveis por nome e por uso, paginados, e usáveis a 360 px | Com 30 escolas, a paginação não repete nem perde escola; no celular não há rolagem horizontal |
| RF6 | Cada ação do painel fica na auditoria da escola com o operador da sessão: rede e escola criadas, convite gerado, revogado e refeito | Registro consultável por teste, com o operador certo, mesmo que o corpo tente mandar outro autor |
| RF7 | A leitura entre escolas fica num módulo só, com cada consulta sem escopo declarada e justificada (regra 10, item 9) | Teste de arquitetura sobre o módulo |
| RF8 | As telas têm a pele da D72, os quatro estados, teclado e toque, e funcionam em `chromebook` e `celular` | e2e nos dois projetos, com verificação de acessibilidade |

**Nota ao RF2** (correção `2026-09-25-spec-da-a0b-atras-do-codigo`, a partir da validação, rodada 1): o par "gerar e
refazer em paralelo" do "Como se prova" foi trocado na revisão da spec (rodada 2, recomendação do `test-engineer`) e não
tem teste paralelo próprio. Ele é coberto por construção: gerar e refazer pegam a mesma trava da escola e só então leem o
estado, e pela matriz o refazer só existe em `pendente` e `vencido`, onde o gerar é `CONFLITO`; quem chega depois na
trava lê o estado que o primeiro deixou. Provam a matriz e a trava a E6 e a E8 de `cenarios.md`.

## 6. Regras de negócio

- **A escola é a controladora; nós somos operadores** (D10): o painel vê que a escola existe, se
  foi ativada e quanto usa, nunca quem está nela
- **Não é cadastro público** (D2); os comandos `ops:*` continuam, com o mesmo caso de uso
- **Dado sintético** no MVP (D71)
- **Contagem não é ranking**: nada por professor nem por aluno (D45, D64)

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Operador fecha o diálogo antes de copiar o link | A tela pergunta antes; se fechar, refaz, e o anterior deixa de valer |
| A coordenadora não abriu o convite em 72 h | A escola aparece como "convite vencido", e o operador refaz |
| Dois operadores refazem o mesmo convite no mesmo segundo | Um só convite fica valendo; o outro vê "o convite mudou" e a tela atualiza |
| Escola sem nenhum uso ainda | Aparece com zero |
| Professor com duas disciplinas na mesma turma | Conta uma vez |
| Aluno transferido ou desativado; turma do ano anterior | Não contam |
| Escola criada às 22h | O uso de hoje só aparece depois da consolidação, com a data do último dia fechado |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Em `docs/lgpd.md`? |
|---|---|---|---|---|
| Nome e e-mail da primeira coordenadora, digitados pelo operador | coordenador | enviar o convite | os do convite e da conta | sim |
| Operador na auditoria da escola | nossa equipe | prestação de contas à escola | vigência + 5 anos | sim |

As contagens e o uso não identificam ninguém. Nada vai a provedor externo.

## 8b. Risco regulatório

Não há IA nem dado de aluno; o risco é de isolamento e privacidade (regras 10 e 20).

## 9. Métricas

- Da escola vazia ao convite copiado em até 2 minutos, sem terminal
- Durante o MVP, o uso de cada escola é lido no painel, sem `ops:uso`

## 10. Perguntas em aberto

1. A contagem de "alunos ativos" inclui quem tem reivindicação pendente? Fecha na Tech Spec, com
   a definição que a A1 usa

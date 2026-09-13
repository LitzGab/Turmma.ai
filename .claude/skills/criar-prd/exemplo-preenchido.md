# Exemplo de PRD preenchido

> Este arquivo não é um template. É um exemplo de como o `template.md` desta pasta fica quando bem
> preenchido, para calibrar o nível de detalhe esperado. Funcionalidade escolhida:
> `onboarding-por-convite`, que é o fluxo 1 de `docs/fluxos.md`.

---

# PRD — Onboarding por convite

**Status:** aprovado
**Funcionalidade do roadmap:** F2
**Depende de:** F1 (identidade e tenancy)

## 1. Problema

Renata é coordenadora de um colégio com 900 alunos e 42 professores. Para o sistema servir
para alguma coisa, todos eles precisam estar dentro, com turma e disciplina corretas. Se
ela tiver que cadastrar pessoa por pessoa, ela abandona o produto antes de ver qualquer
valor, e o contrato morre na primeira semana.

Por outro lado, deixar que cada um se cadastre sozinho cria dois "Enzo Martins" na mesma
turma, um "Batman", e nenhuma garantia de que o aluno que entrou é quem diz ser.

## 2. Objetivo

Uma escola inteira entra no sistema em um dia, sem ninguém ser cadastrado individualmente e
sem que ninguém consiga se passar por outra pessoa.

## 3. Fora de escopo

- Integração com sistema de gestão da escola para puxar matrícula automaticamente
- Cadastro de responsáveis, que vem com a fase da família
- Importação da grade horária, que é a F3
- Recuperação de senha por e-mail para aluno, que não tem e-mail por decisão de produto

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Coordenação | criar séries e turmas, subir lista de nomes, convidar professor, revogar convite, redefinir senha de aluno | aprovar reivindicação no lugar do professor da turma |
| Professor | aceitar convite, escolher disciplina, gerar link da sala, aprovar ou rejeitar reivindicação | criar turma, convidar outro professor |
| Aluno | abrir link da sala, reivindicar um nome da lista, definir senha após aprovação | escolher a própria turma, editar o nome, ver a lista completa de quem já reivindicou |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | A coordenação cria séries e turmas da unidade, dentro de um ano letivo | Turma criada aparece na listagem e não é visível em outra escola |
| RF2 | A coordenação sobe uma lista de nomes por turma, em planilha ou colando texto | 500 nomes entram em uma operação, com erro apontado por linha |
| RF3 | Reimportar a mesma lista atualiza em vez de duplicar | Segunda importação do mesmo arquivo não cria nome repetido |
| RF4 | A coordenação convida professor por e-mail, com token único e validade de 14 dias | Convite expirado recusa acesso e permite reenvio |
| RF5 | O professor aceita o convite, define senha e escolhe suas disciplinas | Após aceitar, ele vê apenas as turmas em que tem vínculo |
| RF6 | O professor gera um link de sala por turma, projetável em aula | Link abre a lista de nomes daquela turma, sem exigir login |
| RF7 | O aluno reivindica um nome da lista pelo link da sala | Nome reivindicado sai da lista visível para os demais |
| RF8 | O professor vê as reivindicações pendentes e aprova ou rejeita | Aluno só vira usuário com matrícula e senha após aprovação |
| RF9 | Reivindicação rejeitada devolve o nome para a lista | Nome volta a aparecer e pode ser reivindicado por outro |
| RF10 | A coordenação vê o estado de cada pessoa: convidado, ativo, nunca acessou | Painel mostra os três estados e permite reenviar convite |
| RF11 | A coordenação redefine a senha de um aluno | Senha antiga deixa de funcionar e há registro em auditoria |

## 6. Regras de negócio

- Matrícula é única por escola, nunca globalmente
- Turma e vínculo pertencem a um ano letivo
- Aluno não tem e-mail nem telefone no sistema
- Token de convite é de uso único, com validade e revogação
- Nenhum aluno existe como usuário antes da aprovação de um professor da turma dele

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Dois alunos com o mesmo nome na turma | A lista permite nomes iguais; a aprovação do professor desempata, e ele vê ambos lado a lado |
| Aluno chega em maio, turma já formada | Coordenação adiciona um nome avulso à lista, sem reimportar tudo |
| Aluno reivindica o nome errado e o professor aprova sem ver | Professor pode desfazer o vínculo; a ação fica em auditoria |
| Link da sala vaza para fora da escola | Link tem validade curta, é revogável, e só serve para reivindicar nome daquela lista |
| Planilha com a turma escrita de três jeitos | Pré-visualização aponta as variações e pede que a coordenação escolha uma |
| Professor convidado nunca acessa | Aparece no painel como "nunca acessou", com reenvio em um clique |
| Aluno transferido de turma | Coordenação move o vínculo; histórico de notas permanece na turma anterior |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Já está em `docs/lgpd.md`? |
|---|---|---|---|---|
| Nome | aluno | identificar na turma | ano letivo + 5 anos | sim |
| Matrícula | aluno | login e vínculo | ano letivo + 5 anos | sim |
| Nome, e-mail | professor | acesso e responsabilidade | vigência + 5 anos | sim |

Nenhum campo novo. O link da sala expõe **apenas nomes da própria turma**, e some da lista
o que já foi reivindicado, para não virar lista pública de quem estuda ali.

## 8b. Risco regulatório

Não há IA no caminho desta funcionalidade. Nada a classificar.

## 9. Métricas

Tempo entre contrato assinado e primeira turma com todos os alunos ativos. Percentual de
professores convidados que ativaram em sete dias. Número de reivindicações rejeitadas, que
indica se a lista subiu errada.

## 10. Perguntas em aberto

- A matrícula é gerada por nós ou vem da secretaria da escola?
- O link da sala vale para a aula inteira ou expira em minutos?
- Aluno que troca de escola dentro da mesma rede: conta nova ou vínculo novo?

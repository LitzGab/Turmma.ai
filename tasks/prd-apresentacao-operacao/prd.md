# PRD — Identidade do operador Turmma

**Status:** aprovado (23/09/2026, Joaquim). Dividido no mesmo dia do PRD do painel da operação,
que passou do teto depois da revisão da spec: a identidade do operador e a pele da D72 ficaram
aqui (A0), e o painel foi para `tasks/prd-apresentacao-painel/prd.md` (A0b)
**Funcionalidade do roadmap:** A0 — `apresentacao-operacao` (MVP de apresentação, D76)
**Depende de:** F1

## 1. Problema

O operador Turmma hoje é uma string numa variável de ambiente: roda `ops:*` na própria máquina e
o nome dele vai para a auditoria sem nenhuma conta por trás. Para existir um painel da operação
(A0b), precisa existir antes uma pessoa que entra nele com senha e segundo fator, e que nenhuma
sessão de escola consiga imitar. E o painel é a primeira tela com a marca do Turmma: a pele da
D72 precisa estar no `apps/web` antes dele.

## 2. Objetivo

A equipe Turmma tem conta própria, com segundo fator, separada de qualquer escola, e o `apps/web`
passa a ter a pele da D72 em todas as telas.

## 3. Fora de escopo

- O painel em si (redes, escolas, convite da coordenação, contagens, uso): A0b
- Criar e desativar operador pela tela: é por comando
- Papéis diferentes entre operadores: todos podem o mesmo
- Recuperar senha de operador pela tela: por comando, com novo convite
- A casca da área da escola na D72 (navegação por papel): A1

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Operador Turmma | Aceitar o convite, criar a senha e configurar o segundo fator; entrar e sair; ver a casca da operação | Criar outro operador; entrar numa escola como usuário dela |
| Coordenador, professor, aluno | Nada aqui | Alcançar qualquer rota da operação, com sessão, desafio ou cookie de escola |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | A conta de operador nasce por comando (`criar`), com quem a criou registrado; `desativar` encerra o acesso na requisição seguinte. Nenhuma rota cria operador | Teste de arquitetura sem rota de criação; o comando grava a auditoria da operação com quem rodou; desativado não alcança nada |
| RF2 | O comando gera um convite de uso único, válido por 72 h, que leva a criar a senha e configurar o segundo fator (app autenticador, com códigos de recuperação) | Usado, vencido, revogado e inexistente respondem igual; dois aceites simultâneos gravam uma senha só |
| RF3 | O operador entra por e-mail, senha e segundo fator, sempre; código TOTP e código de recuperação valem uma vez | O mesmo código duas vezes, em sequência ou em paralelo, é recusado na segunda |
| RF4 | Senha errada repetida segura aquela conta com espera crescente, por conta, sem colidir com o login de escola; e-mail inexistente e senha errada respondem igual | Status e corpo iguais; 10 erros na conta X não seguram a Y do mesmo IP; errar como operador não segura o mesmo e-mail na escola |
| RF5 | A sessão dura até 8 h e termina após 30 min sem uso. Sessão que terminou é dita como tal na tela, com o que fazer, sem confundir com "não encontrado" | Depois de 30 min parado, a próxima ação pede entrar de novo com a mensagem de sessão encerrada |
| RF6 | Nenhuma credencial de escola (sessão, desafio de login, cookie de renovação) alcança rota da operação, e nenhuma credencial de operador alcança rota de escola; as duas respondem igual a rota inexistente | Varredura das rotas registradas nos dois sentidos, comparando status e corpo com uma rota que não existe |
| RF7 | Entradas, falhas de entrada e saídas ficam no registro de acesso da operação, com IP e data (Marco Civil); criar e desativar operador, configurar segundo fator e gerar convite de operador ficam na auditoria da operação, com o autor | Cada evento consultável por teste, no registro certo e com o operador certo |
| RF8 | O `apps/web` inteiro passa à pele da D72 (tokens da seção 9.9 do `docs/interface.md`, logotipo de `mockups/public/marca/`), inclusive as telas do F1, sem nenhuma cor que o Chrome 109 descarte | Guarda de estilo reprova cor fora dos tokens, `oklch(` e `color-mix(` no CSS servido; o e2e do F1 continua verde |
| RF9 | As telas do operador (convite, entrar, segundo fator, casca da operação com Sair) têm os quatro estados, teclado e toque, e funcionam em `chromebook` e `celular` | e2e nos dois projetos, com verificação de acessibilidade |

## 6. Regras de negócio

- O operador não é usuário de escola e não tem papel na matriz de permissão da escola (D10, D76)
- Toda ação do operador tem autor rastreável; o registro de acesso é obrigação legal (Marco
  Civil, art. 15) e a auditoria da operação é prestação de contas
- Nenhuma senha passa pelo terminal: o convite leva à tela
- Sair está a um clique, em toda tela (D59)

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Operador perde o app autenticador | Usa um código de recuperação; sem eles, novo convite por comando |
| Operador que saiu da equipe, com a sessão aberta | `desativar` corta na requisição seguinte |
| Convite de operador aberto duas vezes, em duas abas | Só um aceite grava senha |
| Mesma pessoa é coordenadora numa escola e operadora | Contas separadas, com logins que não se misturam |
| Duas abas renovando a sessão ao mesmo tempo | Uma renova; a outra continua válida pelo token anterior dentro da janela de rotação |
| Banco fora durante a conferência da sessão | Erro de indisponibilidade, e não "sessão encerrada" |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Em `docs/lgpd.md`? |
|---|---|---|---|---|
| Conta de operador (nome, e-mail, hash de senha, segundo fator cifrado, HMAC dos códigos de recuperação) | nossa equipe | entrar no painel | até desativar; o apelido fica na auditoria | sim |
| Convite e sessão de operador | nossa equipe | primeiro acesso; manter o acesso | 30 dias após usar ou encerrar | sim |
| Registro de acesso da operação (IP, data, evento) | nossa equipe | segurança, Marco Civil | 6 meses | sim |
| Auditoria da operação (autor, ação, data) | nossa equipe | prestação de contas | vigência + 5 anos | sim |

## 8b. Risco regulatório

Não há IA nem dado de aluno.

## 9. Métricas

- Do convite ao primeiro login com segundo fator em até 3 minutos
- Zero rota da operação alcançável por credencial de escola (teste do RF6)

## 10. Perguntas em aberto

1. Em produção, a borda restringe `/operacao` e `/v1/operacao/*` a quê: IP da equipe, host
   separado ou rede interna? Decide com a hospedagem (D42), antes do staging

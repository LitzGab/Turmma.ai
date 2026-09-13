# Regra 50 — Frontend

## Por que esta regra existe

Três realidades definem estas regras, e nenhuma delas é preferência estética.

O aluno usa **Chromebook de escola**, que é uma máquina fraca, em rede compartilhada por
trinta pessoas ao mesmo tempo. A Lei 15.100/2025 tirou o celular da sala, então não existe
plano B pelo telefone: nem para autenticar, nem para receber código, nem para fotografar.

O professor abre o sistema **entre duas aulas**, com quarenta minutos de intervalo e uma
xícara de café na mão. Ele não vai explorar menu, não vai ler tutorial, e não vai perdoar
uma tela que o faz procurar.

E há uma ação no produto que não pode ser banalizada: **aprovar nota**. Se ela virar um
clique reflexo, a supervisão humana que a lei exige vira teatro, e a primeira nota errada
publicada destrói a confiança do professor no sistema inteiro.

## As regras

1. **Alvo é Chromebook fraco em rede instável.** Bundle enxuto, lista longa virtualizada,
   imagem comprimida antes do upload. Teste com throttling de rede e de CPU antes de
   considerar pronto. "Funciona no meu notebook" não é dado.

2. **Web-first, sem dependência de celular** em nenhum ponto do fluxo.

3. **Estado de servidor é do TanStack Query.** Duplicar em `useState` é onde aparecem as
   telas que mostram nota antiga depois de aprovar.

4. **Tipos vêm de `packages/shared`.** Contrato redigitado é contrato que vai divergir.

5. **Toda tela tem os quatro estados**: carregando, vazio, erro e com dado. O estado vazio é
   um convite para agir, não um pedido de desculpas.

6. **O feed de agentes não pode aparecer vazio** para um professor com turmas. Se aparecer,
   a primeira impressão do produto é a de um chat comum, e o argumento inteiro se perde.
   Isso é requisito de produto, não detalhe de interface.

7. **Token em memória e cookie httpOnly.** Nada sensível em `localStorage` nem em URL.

8. **Ação oficial mostra o que vai acontecer antes de confirmar.** Aprovar nota exibe o
   valor, o aluno e a avaliação. Aprovar em lote mostra o resumo e destaca os casos fora da
   curva, que são os que o professor realmente precisa olhar.

9. **A tela do aluno não expõe dado de colega.** Nem ranking, nem média da turma que permita
   deduzir nota alheia, nem lista de quem entregou.

10. **O modo sala mostra sinal, não conversa crua por padrão.** O professor abre a conversa
    quando precisa, e esse acesso fica em auditoria. É a diferença entre supervisão e
    vigilância, e ela precisa aparecer na interface.

11. **Acessibilidade real**: navegação por teclado, foco visível, contraste, rótulo em
    campo. Escola pública tem aluno com deficiência, e isso aparece em edital.

12. **Português do Brasil**, data e número no formato local. Erro diz o que fazer, não o
    código: "não foi possível salvar, tente de novo em instantes", não "erro 500".

13. **Seletor de escola no topo da área do professor**, filtrando tudo abaixo. Professor de
    rede pública dá aula em duas ou três escolas, e assumir escola única quebra o produto
    para ele.

## Como isso é checado

O subagente `frontend-reviewer` audita toda tarefa que cria ou altera tela.

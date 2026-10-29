# Achados das revisões — `tasks/correcoes/2026-10-29-contorno-do-campo-de-conversa.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-29 12:27:12 · `tasks/correcoes/2026-10-29-contorno-do-campo-de-conversa.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A mudança só troca classes de CSS na caixa do chat, nos dois arquivos alterados: `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-contorno-do-campo-de-conversa/apps/web/src/componentes/ui/ia/CaixaPedido.tsx` e `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-contorno-do-campo-de-conversa/apps/web/src/componentes/ui/ia/CaixaPedido.test.tsx`. Não muda request, fila, chamada de modelo, estado, query nem migration.
Rate limit: ok. A mudança não mexe nele.
Fila e prioridade: ok. A mudança não mexe nela.
Concorrência: protegida. A mudança não muda escrita nem disparo de ação.
Índice e paginação: ok. Não há query nova.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. Nada novo no caminho quente.
Bloqueantes: nenhum.
Recomendações:
- A tarefa diz que não há outro campo de conversa com IA fora da `CaixaPedido`. Os outros revisores da tarefa conferem isso. Não muda nada em carga.
- Para o `frontend-reviewer`: o anel novo usa `focus-within`, e não `:focus-visible`. Por isso ele acende também quando o botão de enviar recebe foco por clique de mouse. Esse comportamento é igual ao do mockup e à `Opcao`, e não afeta carga.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-29 12:27:17 · `tasks/correcoes/2026-10-29-contorno-do-campo-de-conversa.md`

VEREDITO: APROVADO
Tela vista: sim (8 fotos lidas, cheia e vazia, a 1366 e a 360 px: Assistente de ensino da professora, e Tutor do aluno com a atividade Cinemática e sem atividade)
Estados: ok. A correção não toca carregando, vazio nem erro. Nas fotos, o vazio do Tutor do aluno convida ("Quando houver uma, ela aparece aqui") e o do Assistente mostra o campo e os atalhos. Carregando e erro não aparecem na vitrine e esta mudança não os altera.
Acessibilidade: o anel de foco continua o do produto (`foco`, 3 px, sólido). Agora ele abraça a moldura inteira, colado à borda, como o da `Opcao` e o do mockup (`input-bar.tsx`). O `textarea` mantém o rótulo `sr-only`. O anel é `outline`, não `ring` nem `shadow`, então segue visível em modo de alto contraste. Aparece com foco no campo ou no botão de enviar.
Chromebook fraco: sem impacto. Só mudam classes de CSS, sem JS novo nem imagem.
Celular: a 360 px o anel aparece inteiro, sem corte nem rolagem horizontal (`...nova-conversa--textarea--celular.png`, `...Cinemática...--celular.png`). O enviar segue redondo de 44 px. Não há atalho nem hover.
Ação oficial protegida: sim, não se aplica. A mudança é só de contorno e não toca nenhuma ação oficial.
Bloqueantes: nenhum.
Recomendações:
- `apps/web/src/estilos.css:351`: no tema escuro, sobre `.bg-noite`, o anel global muda de cor por `:focus-visible`. O anel da `CaixaPedido` é por `focus-within` e fica sempre em `foco`. Hoje a caixa só aparece sobre `bg-fundo` e `bg-superficie`, e nas fotos fica correta, então não bloqueia. Se a caixa um dia ficar sobre `bg-noite`, o contraste cai a 1,99:1.
- `apps/web/src/componentes/ui/ia/CaixaPedido.tsx:181`: `focus-within` acende também com clique de mouse no campo, e não só com teclado. É o que o mockup faz e é aceitável num campo de texto. Se quiser registrar a regra, vale uma linha em `docs/interface.md`, que hoje não cita `CaixaPedido` entre as peças com anel por `focus-within`.
- O teste confere classes, não o desenho. As duas mutações da tarefa cobrem a mudança no `form` e no `textarea`. A prova visual está nas fotos.

Contradição entre foto e código: nenhuma. As fotos batem com o diff em `CaixaPedido.tsx:157` e `:181`.

Arquivos relevantes:
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-contorno-do-campo-de-conversa/apps/web/src/componentes/ui/ia/CaixaPedido.tsx`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-contorno-do-campo-de-conversa/apps/web/src/componentes/ui/ia/CaixaPedido.test.tsx`

## test-engineer · 1ª rodada · APROVADO · 2026-10-29 12:27:29 · `tasks/correcoes/2026-10-29-contorno-do-campo-de-conversa.md`

VEREDITO: APROVADO

**Cenários exigidos** (é uma correção visual, só de classe CSS numa peça de tela; não mexe em dado, permissão, escola, IA nem em nada concorrente):
- **Caminho feliz:** com o foco no campo, o anel de foco é desenhado pela moldura da `CaixaPedido` (o `<form>`) e acompanha a caixa.
- **Borda 1:** as duas variantes, `completa` (Assistente de ensino, com o seletor de turma dentro) e `so-texto` (Tutor).
- **Borda 2:** o anel global de `:focus-visible` não pode continuar desenhado no `textarea`, porque daria anel duplo ou ficaria fora de lugar.
- **Borda 3:** o anel continua o do produto (`foco`, 3 px, sólido), colado à borda e sem afastamento.
- **Permissão, isolamento, concorrência, IA:** não se aplicam, porque a mudança é só de classe e não envolve dado, rota nem chamada a provedor.

**Cobertos:**
- **Caminho feliz e bordas 1 e 3:** o teste `CaixaPedido.test.tsx` › `CaixaPedido, o desenho` › `o anel de foco é da caixa, por focus-within, e o campo de dentro não desenha contorno` (linha 191) percorre as duas variantes.
  - Ele confere o conjunto exato de classes `focus-within:outline*` da caixa com `toEqual` sobre a lista ordenada. Assim, tirar qualquer uma das quatro classes, ou acrescentar outra, também deixa o teste vermelho.
- **Borda 2:** o mesmo teste confere `outline-none` no `textarea`, nas duas variantes.
- **Seção "Mutações" contra o `git diff`:** são duas cláusulas novas no `CaixaPedido.tsx`, as classes do `<form>` (linha 181) e o `outline-none` do `textarea` (linha 157). Cada uma tem seu bloco, e os dois apontam para o teste acima, que chega às duas. A mudança no comentário (linhas 59 a 61) não é cláusula.
- **Teste:** o arquivo passou com 10 de 10 testes, e não há `.skip`, teste comentado nem mock.
- **Vitrine:** nas fotos de computador e de celular, o anel aparece em volta da moldura inteira, com o botão de enviar dentro.
- **Camada do CSS:** o `outline-none` só vence porque o `:focus-visible` global fica em `@layer base` (`apps/web/src/estilos.css:340`), e as utilidades do Tailwind ficam acima dessa camada. Hoje está certo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Ordem das camadas sem teste.** A correção depende de o `:focus-visible` global continuar dentro de `@layer base`. Se alguém o tirar da camada, como foi feito de propósito com o bloco do escuro na linha 160, o `outline-none` perde, o anel duplo volta e o teste de classe continua verde. Vale uma asserção em `estilos.test.ts` de que o `:focus-visible` global está dentro de `@layer base`, ou uma checagem e2e do `outline-style` calculado do `textarea` focado.
2. **Comentário desatualizado.** O comentário em `apps/web/src/estilos.css:337-338` diz que "nenhuma peça apaga o contorno", e agora a `CaixaPedido` apaga o do `textarea`, como já faziam outras peças (`pecas-da-lista.tsx:32`, `Estrutura.tsx:85`). É melhor ajustar o texto para "nenhuma peça apaga o contorno sem dar o anel a quem a contém". Isso é texto, para a frontend e a validação.
3. **Anel duplo no seletor de turma.** Na variante `completa`, ao focar pelo teclado o seletor de turma ou o enviar, aparecem dois anéis: o da moldura, pelo `focus-within`, e o do próprio controle, pelo `:focus-visible`. Não é regra quebrada, mas vale a `frontend-reviewer` olhar se é o desejado. Uma foto da vitrine com o foco por Tab no seletor deixaria isso documentado.

Arquivos auditados:
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-contorno-do-campo-de-conversa/apps/web/src/componentes/ui/ia/CaixaPedido.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-contorno-do-campo-de-conversa/apps/web/src/componentes/ui/ia/CaixaPedido.test.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-contorno-do-campo-de-conversa/tasks/correcoes/2026-10-29-contorno-do-campo-de-conversa.md
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-contorno-do-campo-de-conversa/apps/web/src/estilos.css

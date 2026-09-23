# Achados das revisões — `tasks/prd-apresentacao-operacao/1_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-23 20:41:23 · `tasks/prd-apresentacao-operacao/1_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (pela tabela da tarefa em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/1_task.md` e pelo E5 do `cenarios.md`):
- O hex de cada token da 9.9 está no CSS servido.
- Nenhum dos componentes compartilhados usa família de cor de fábrica.
- O botão primário passa o contraste AA e o botão desligado se distingue do ligado.
- O foco de 2 px aparece nos componentes navegáveis pelo teclado.
- O e2e do F1 continua verde em `chromebook` e em `celular`.
- A marca é servida sem nenhuma requisição de fonte.

A tarefa não tem dado de escola nem operação concorrente, então não cabe caso de isolamento, de permissão nem de concorrência.

**Cobertos:**
- **Tokens no CSS servido.** `/home/joaquimdp/Documentos/git/Educa.ia/e2e/tokens.spec.ts:236-244` lê os tokens direto do bloco da 9.9 em `docs/interface.md`, confere que são 33 e compara com o CSS que o navegador recebe. O teste falharia se um token sumisse ou se o `static` fosse tirado. `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.test.ts:587-596` faz a mesma conferência no fonte.
- **Componentes sem classe antiga.** `estilos.test.ts:605-615` varre `componentes/`, com uma âncora de pelo menos 10 arquivos. O teste `estilos.test.ts:617-622` confere que os dois regex acham o que devem. A volta de uma classe `slate`, `blue`, `amber`, `red` ou `emerald`, ou de um `/NN`, deixa o teste vermelho.
- **Botão primário.** `tokens.spec.ts:246-279` confere que o fundo é caramelo e o texto é tinta, calcula o contraste AA e roda o axe. Também confere o hover no projeto com ponteiro. Para o desligado, confere o fundo `inativo` com o ponteiro ainda em cima do botão, o que prova o `enabled:` na prática, e calcula o contraste dele.
- **Foco.** `tokens.spec.ts:281-319` chega pelo Tab ao campo de e-mail, ao campo de senha, ao botão Entrar, ao seletor de escola, ao link Meus vínculos e ao botão Sair. Em cada um confere o anel: `solid`, 2 px, cor `noite`, 2 px de afastamento. Numa faixa preta, confere o anel em `caramelo-noite`. Confere ainda a cor `caramelo-texto` e o sublinhado do link.
- **Marca sem fonte.** `tokens.spec.ts:321-350` confere o `alt` vazio da imagem decorativa, que ela carregou de fato (`naturalWidth`), o favicon servido como `image/svg+xml` e nenhuma requisição de fonte até a rede parar.
- **F1 verde.** O portão local foi carimbado com `--e2e`, 140 testes passando nos dois projetos. A guarda de `e2e/casca.spec.ts:286-298` continua válida: `blue-700` e `amber-*` ainda são usados nas telas de `paginas/`.
- Nenhum `.skip`, teste comentado ou mock esconde a regra. O `if (!hasTouch)` do hover é uma condição do projeto de toque, não um `.skip`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **O pressionado (`caramelo-fundo`) da subtarefa 1.2 não tem teste.** É ele que dá o sinal no toque, onde não há hover. Um `mouse.down()` sem soltar, seguido da cor calculada em `tokens.spec.ts`, cobriria o caso.
2. **Falta conferir `color-mix(` no CSS servido.** O E5 do `cenarios.md` pede que o CSS servido não tenha `oklch(` nem `color-mix(`. Hoje só o `oklch(` é conferido (`casca.spec.ts`). O teste de unidade barra o modificador `/NN` só em `componentes/`. Uma linha `expect(css).not.toContain('color-mix(')` em `tokens.spec.ts:236` fecha isso já nesta tarefa, ou fica para a guarda estrita da 2.0.
3. **O teste de fonte só pega fonte que chega a ser baixada.** Um `@font-face` da Fustat declarado e não usado passaria. Vale conferir também que o CSS servido não tem `@font-face`.
4. **O estado de erro não tem conferência de contraste.** `EstadoErro`, `SeletorDeEscola` e `LoginPorCima` passaram para `text-erro` sobre `bg-erro-cx`, mas nenhum teste desta tarefa roda o axe com esse estado na tela. Vale um caso que force o erro e rode o `violacoesGraves`, ou registrar que a 2.0 cobre.
5. **O anel sobre o preto é provado numa faixa montada pelo próprio teste** (`tokens.spec.ts:314-318`). Quando a 10.0 trouxer a faixa de verdade, o teste deve passar a usar a casca real. Vale registrar isso para o `/retro`, para não ficar esquecido.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-09-23 20:42:14 · `tasks/prd-apresentacao-operacao/1_task.md`

VEREDITO: APROVADO

**Estados:** ok. Os três componentes de estado (carregando, vazio e erro) mudaram só de pele: o texto e o comportamento continuam os mesmos. O erro continua dizendo o que fazer ("Tentar de novo", com status anunciado). Esta tarefa não traz tela nova com dado, então não há feed nem seletor novo para conferir. O seletor de escola continua no cabeçalho.

**Acessibilidade:**
- **Botão primário:** texto `tinta` sobre `caramelo` dá 6,4:1. Desligado, `tinta` sobre `inativo` dá cerca de 6:1 e o fundo muda de cor, então não depende só de opacidade.
- **Foco:** anel de 2 px em `noite` com 2 px de afastamento, e em `caramelo-noite` sobre fundo preto. O e2e prova isso com Tab em cada campo, no botão, no `summary`, no link e em "Sair".
- **Link:** `caramelo-texto` sublinhado dá 5,1:1 sobre branco.
- **Borda de campo:** `borda-campo` dá 3,3:1, o que passa no critério de componente de interface (1.4.11).
- **Marca:** o SVG tem `alt=""` porque o nome "Turmma" vem ao lado em texto. O axe fica limpo na entrada e no `/mfa`.

**Chromebook fraco:**
- Nenhuma fonte é baixada, e o e2e prova que não há requisição `.woff2`.
- O logotipo vem em curvas e pesa menos de 2 kB.
- As cores continuam em hex, sem `oklch()` nem `color-mix()`. O fundo escurecido do diálogo usa `rgba()` literal, e o teste de unidade barra o modificador `/NN`.
- O `@theme static` custa cerca de 0,3 kB gzip, está justificado na tarefa e não é problema.
- Nenhuma animação nova. Os tokens de transição (`--t-*`) foram declarados, mas nenhum componente os usa.

**Celular:**
- Alvos de 44 px continuam (`min-h-11` no botão, nos campos, no `summary`, no link e nos itens do seletor).
- O hover é só enfeite: o estado pressionado (`active:`) dá o sinal no toque, e o e2e pula o hover quando o dispositivo é de toque.
- O e2e confere que não há rolagem horizontal no cabeçalho autenticado nem na casca pública, nos projetos `chromebook` e `celular`.

**Ação oficial protegida:** sim. Não há ação oficial nesta tarefa. O preto `noite` fica reservado para ela (9.1), e nenhum componente o usa como botão comum.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `apps/web/src/componentes/SeletorDeEscola.tsx:86`: o `disabled:text-inativo` (#8F8F8F, 3,3:1) também pinta o texto "Abrindo <escola>…", que é informação de estado, não só controle desligado. Antes era `slate-600` (cerca de 7,5:1). Vale usar `sutil` (#5D5D5D, cerca de 6,6:1) no texto do item que está abrindo, ou em todo o desligado.
2. `apps/web/src/componentes/Cabecalho.tsx:57` e `SeletorDeEscola.tsx:86`: quando o link "Meus vínculos" está pressionado (`active:bg-realce`), o `caramelo-texto` sobre `#ECECEC` cai para cerca de 4,3:1. É um instante só, mas `realce-suave` também no `active` mantém 4,6:1.
3. `apps/web/index.html:7`: o título da aba continua `Educa.ia`, enquanto o cabeçalho e o ícone já dizem Turmma (D54). É texto visível ao usuário. Se não entra aqui, fica para a 2.0 junto com as telas.
4. `apps/web/src/estilos.css`: os tokens `--t-*` e `--curva-*` foram declarados sem nenhum uso. Quando a 2.0 ou a 10.0 usarem, as animações precisam respeitar `prefers-reduced-motion` e o limite de CPU (regra 50).

Arquivos centrais revistos:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.css`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/Botao.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/Marca.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/SeletorDeEscola.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/tokens.spec.ts`

## revisor-geral · 1ª rodada · APROVADO · 2026-09-23 20:42:15 · `tasks/prd-apresentacao-operacao/1_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As divergências da seção "Divergências resolvidas nesta tarefa" do `1_task.md` estão registradas no documento, então não foram decididas em silêncio. Todas cabem na seção 9 da techspec e na 9.9 do `docs/interface.md`:
- `--font-marca` ficou de fora, porque a techspec já dispensa a Fustat.
- O bloco novo usa `@theme static`.
- A classe `disabled:bg-slate-600` saiu de sete telas.
- Entrou o componente `Marca.tsx`, e o favicon passou a ser a marca, como pede a 9.6.

Portão local: carimbo válido (typecheck, lint, test, e2e)

Bloqueantes: nenhum

Recomendações:
- As sete telas de `paginas/` mudaram, e o "Fora do escopo" do próprio documento deixa as telas para a 2.0. A mudança é mínima e necessária: sem ela, o `disabled:bg-slate-600` disputaria com o `disabled:bg-inativo` do `Botao`, e com o texto em `tinta` o contraste cairia para 2,6:1. Fica registrado para quem fizer a 2.0 não achar que essas telas já foram migradas. Só essa classe saiu; o resto delas continua na paleta antiga.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/index.html:7`: o `<title>` continua "Educa.ia", enquanto o cabeçalho e o favicon já dizem Turmma. Vale alinhar na 2.0, que já prevê `document.title` por rota.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.css`: a regra `.bg-noite :focus-visible` só vale para o que está *dentro* de um elemento `bg-noite`. Um botão que tem o próprio fundo em `noite` continua com o anel `noite` por fora. Está certo quando ele fica sobre fundo claro, mas convém ter isso em mente na 10.0, quando a faixa "Operação Turmma" trouxer botões pretos sobre o preto.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/public/marca/turmma-negativo.svg` foi copiado e não é usado por nada nesta tarefa. É idêntico ao do `mockups/` e vem do manual da marca (9.6), então não bloqueia, mas hoje é um arquivo sem uso.

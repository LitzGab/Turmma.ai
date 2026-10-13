# Inventário A — o sistema de design do mockup (Turmma × Duolingo)

Lido em 12/10/2026, de `/home/joaquimdp/Documentos/git/Prototipo_Turmma/mockups` (LEIAME inteiro; rodadas 10ª a 14ª).
Nada foi alterado. Caminhos citados são relativos a `mockups/src/`, salvo quando dito.

**Como ler este arquivo.** Todo valor aqui saiu do código, não do LEIAME. Onde os dois divergem, vale o código e a
divergência está marcada com **[diverge]**. Onde eu não tenho certeza, está marcado com **[incerto]**.

**Três avisos antes de tudo:**

1. O código tem duas camadas que o LEIAME **não descreve**: a "15ª rodada" (`duo/chat.tsx`, 06/10/2026, as peças da
   conversa com IA) e os "painéis de gestão" (`duo/gestao.tsx`, 06 e 07/10/2026). As duas estão exportadas por
   `duo/index.ts` e são usadas pelas telas. Falta decidir se entram na pele nova.
2. Os números de decisão citados nos comentários do mockup **não são os de `docs/decisoes.md`**. Exemplos:
   `Casca.tsx:51` ("Falar com a Turmma … D78"), `Casca.tsx:126` ("D61", o rótulo do aluno), `graficos.tsx:18` ("D81",
   cor só por categoria), `dialogo.tsx:10` ("D70", dois botões do mesmo tamanho). Não citar esses números na Tech Spec.
3. Os tokens com nome (`--radius-botao`, `--shadow-flutua`, `--dur-*`) existem, mas as peças **quase nunca os leem**:
   usam o valor literal (`rounded-[12px]`, `shadow-[0_4px_0_0_var(--color-borda)]`, `duration-150`). A contagem está na
   seção 1.7.

---

## 1. TOKENS

Fonte: `index.css`. Três blocos: `@theme` (linhas 21 a 121), `@theme static` (125 a 152) e
`:root[data-tema="escuro"]` (158 a 209, fora de camada, para vencer o `@layer theme`). A paleta do Tailwind é zerada
(`--color-*: initial`, linha 22): só existe o que está abaixo.

### 1.1 Neutros que a pele nova usa de fato

Contagem de uso nas peças `duo/` e na casca entre parênteses (classes `bg-`, `text-`, `border-` etc.).

| Token (`--color-…`) | Claro | Escuro | Para que serve |
|---|---|---|---|
| `white` (64) | `#FFFFFF` | `#131F24` | A face de tudo que é "branco": cartão, botão secundário, diálogo, menu. **`bg-white` vira escuro no tema escuro**: é assim que nenhuma tela precisa de `dark:` |
| `black` | `#000000` | `#000000` | Não é usado pelas peças |
| `fundo` (4) | `#FFFFFF` | `#131F24` | O chão da página (`body`, `SidebarInset`) |
| `fundo-suave` (63) | `#F7F7F7` | `#202F36` | Hover de linha e de peça branca, selo neutro, balão de quem escreve |
| `borda` (118, mais 52 em `var()`) | `#E5E5E5` | `#37464F` | A borda de 2 px e o degrau de toda peça branca; trilho de barra |
| `borda-forte` (12) | `#D7D7D7` | `#52656D` | Hover da borda do campo; linhas do mapa mental |
| `apagado` (5) | `#AFAFAF` | `#52656D` | Chevron, texto de peça desligada, série tracejada. **Não é cor de texto** (no escuro dá 2,75:1) |
| `sutil` (121) | `#5D5D5D` | `#8FA3AD` | Texto de apoio, rótulo, item inativo da lateral |
| `apoio` (39) | `#424242` | `#DCE6EC` | Texto secundário forte, botão secundário |
| `tinta` (159) | `#0D0D0D` | `#F1F7FB` | Texto principal |
| `grafite` | `#333333` | `#F1F7FB` | A face do botão oficial (inverte no escuro) |
| `grafite-degrau` | `#0D0D0D` | `#8FA3AD` | O degrau do botão oficial |
| `sobre-cor` (15) | `#0D0D0D` | `#131F24` | Texto em cima de face colorida (botão laranja, contador, iniciais). Fica escuro nos dois temas |
| `campo` (6) | `#FFFFFF` | `#202F36` | Fundo de campo de texto e da caixa do chat |
| `mesa` (1) | `#F7F7F7` | `#0E181C` | O fundo atrás da folha do documento |
| `veu` (2) | `rgba(0,0,0,.35)` | `rgba(0,0,0,.6)` | O véu do diálogo e do painel ao lado |
| `icone-papel` | `#EFEFEF` | `#37464F` | O "papel" dos ícones ilustrados encostados no fundo |
| `icone-linha` | `#D7D7D7` | `#52656D` | As linhas desse papel |
| `onca-chao` | `rgba(175,175,175,.3)` | `rgba(0,0,0,.35)` | A sombra em pílula sob a onça |
| `capa` / `capa-borda` / `capa-texto` | `#131F24` / `#131F24` / `#FFFFFF` | `#202F36` / `#52656D` / `#F1F7FB` | A capa do slide (escura nos dois temas) |

Seleção de texto: claro `#FBD9C3` com `tinta` (`index.css:270`); escuro `#734528` com `#F1F7FB` (linha 210).

### 1.2 As 10 famílias de cor

Cada família tem cinco tons: **face** (preenchimento), **degrau** (a face com 20% de preto), **claro** (fundo de selo e
de selecionado), **borda** (a borda do claro) e **texto** (para escrever no branco e no claro, 4,5:1 ou mais).
Variáveis: `--color-<família>`, `--color-<família>-degrau`, `-claro`, `-borda`, `-texto`.

**Tema claro** (`index.css:130-139`; os mesmos hex em `duo/familia.ts:20-41` e `duo/onca/paleta.ts:9-20`)

| Família | face | degrau | claro | borda | texto | Uso declarado |
|---|---|---|---|---|---|---|
| laranja | `#E8732E` | `#BA5C25` | `#FDEBDD` | `#F5C0A1` | `#A85220` | marca, ação |
| azul | `#1C9BEF` | `#167CBF` | `#DFF1FD` | `#99D2F8` | `#146EAA` | selecionado · Matemática |
| verde | `#2FBF5B` | `#269949` | `#E2F6E8` | `#A1E2B5` | `#1F7C3B` | certo · Ciências, Biologia |
| amarelo | `#FFC31F` | `#E0A000` | `#FFF7E0` | `#FFE49A` | `#8C6B11` | esperando você · História |
| vermelho | `#F2545B` | `#C24349` | `#FDE7E8` | `#F9B2B5` | `#B84045` | problema, prazo · Inglês |
| roxo | `#A56EF5` | `#8458C4` | `#F2EBFE` | `#D6BEFA` | `#7D54BA` | cuidado com pessoa · Português |
| turquesa | `#1DBFAE` | `#17998B` | `#DFF6F4` | `#99E2DB` | `#137A6F` | turma · Química |
| anil | `#6A85F7` | `#556AC6` | `#EAEEFE` | `#BCC8FB` | `#5165BC` | Analista · Física |
| lima | `#9ACD2E` | `#7FB01C` | `#F1F8E2` | `#D2E8A1` | `#59771B` | Geografia, Sociologia |
| rosa | `#F57CB5` | `#C46391` | `#FEEDF5` | `#FAC4DE` | `#A25277` | Arte, Educação Física |

**Tema escuro** (`index.css:195-204`; `FAMILIAS_ESCURO` em `duo/familia.ts:48-59`)

| Família | face | degrau | claro | borda | texto |
|---|---|---|---|---|---|
| laranja | `#EB8447` | `#BA5C25` | `#352C26` | `#734528` | `#EF9D6D` |
| azul | `#37A7F1` | `#167CBF` | `#143344` | `#17577F` | `#60B9F4` |
| verde | `#48C76F` | `#269949` | `#17392D` | `#20673D` | `#6DD28C` |
| amarelo | `#FFC31F` | `#E0A000` | `#393923` | `#7D6922` | `#FFD562` |
| vermelho | `#F4696F` | `#C24349` | `#37272D` | `#77373D` | `#F6878C` |
| roxo | `#B07FF6` | `#8458C4` | `#2A2C45` | `#554382` | `#C09AF8` |
| turquesa | `#38C7B8` | `#17998B` | `#15393A` | `#186762` | `#61D2C6` |
| anil | `#7C94F8` | `#556AC6` | `#212F46` | `#3A4D83` | `#97AAF9` |
| lima | `#9ACD2E` | `#7FB01C` | `#293B26` | `#506D28` | `#B8DC6D` |
| rosa | `#F68CBE` | `#C46391` | `#372E3B` | `#794965` | `#F8A3CB` |

O degrau não muda de um tema para o outro. Amarelo e lima têm a mesma face nos dois.

Contraste declarado no claro (`familia.ts`, campo `contraste`): tinta sobre a face de 5,69 (roxo) a 12,10 (amarelo);
texto sobre o branco de 4,97 a 5,47; texto sobre o claro de 4,61 a 4,72. **[incerto]** Não recalculei.

Regra de uso: **nenhuma face aceita texto branco**; sobre face colorida o texto é `text-sobre-cor`.

Como a peça recebe a família (`familia.ts:67-75`): a função `familia(f)` devolve um `style` que aponta `--face`,
`--degrau`, `--claro`, `--borda` e `--texto` para as variáveis da família, e a peça escreve `bg-(--face)`,
`bg-(--claro)`, `border-(--borda)`, `text-(--texto)`. Motivo: o Tailwind não enxerga classe montada em tempo de
execução. Por isso as famílias ficam em `@theme static`.

Quem usa qual (`duo/cores.ts`):

- **Matérias:** Matemática azul · Língua Portuguesa roxo · Ciências verde · Biologia verde · Química turquesa · Física
  anil · História amarelo · Geografia lima · Língua Inglesa vermelho · Arte rosa · Educação Física rosa · Filosofia
  amarelo · Sociologia lima. O laranja nunca vai em matéria. `materiaDe(nome)` aceita acento, caixa e os apelidos
  "redacao" (Português) e "artes".
- **Tipos da fila** (`TIPO_FILA`): atencao roxo · notas amarelo · sinal azul · pedidos verde · pedidos-nome verde ·
  material amarelo (ícone `adaptada`) · turma turquesa · aviso vermelho · contestacao amarelo · alerta anil ·
  material-falhou vermelho · convite amarelo · dossie anil · revisao amarelo (ícone `contestacao`) · risco roxo (ícone
  `atencao`) · titular anil.
- **Agentes** (`onca/tipos.ts:8-12`): Tutor laranja · Assistente azul · Analista anil.

### 1.3 Tokens antigos, que ficaram e a pele nova não usa

Uso zero em `duo/` e na casca; ainda aparecem em telas antigas (número entre parênteses: usos no `src` inteiro).

| Token | Claro | Escuro |
|---|---|---|
| `superficie` (29) | `#FFFFFF` | `#131F24` |
| `lateral` (2) | `#F9F9F9` | `#131F24` |
| `realce` (13) | `#ECECEC` | `#202F36` |
| `realce-suave` (30) | `#F4F4F4` | `#202F36` |
| `linha` (47) | `#E8E8E8` | `#37464F` |
| `borda-campo` (15) | `#D9D9D9` | `#37464F` |
| `inativo` (37) | `#8F8F8F` | `#52656D` |
| `caramelo` (21) | `#E8732E` | `#EB8447` |
| `caramelo-claro` (2) | `#EE8747` | `#EF9D6D` |
| `caramelo-fundo` (1) | `#D4651F` | `#BA5C25` |
| `caramelo-texto` (0) | `#B4520F` | `#EF9D6D` |
| `caramelo-noite` (0) | `#F2A25B` | `#F2A25B` |
| `noite` (8) | `#0D0D0D` | `#F1F7FB` |
| `noite-alto` (0) | `#2F2F2F` | `#DCE6EC` |
| `noite-baixo` (0) | `#000000` | `#FFFFFF` |
| `creme` (1) | `#F4F4F4` | `#202F36` |
| `papel` (2) | `#F4F3F0` | `#202F36` |
| `pendente-cx` / `pendente` | `#FDF0E8` / `#8A3E0C` | `#352C26` / `#EF9D6D` |
| `ok-cx` / `ok` | `#E9F5EE` / `#0B6B47` | `#17392D` / `#6DD28C` |
| `erro-cx` / `erro` | `#FDECEC` / `#B42318` | `#37272D` / `#F6878C` |
| `info-cx` / `info` | `#F4F4F4` / `#0D0D0D` | `#202F36` / `#F1F7FB` |
| `ia-cx` / `ia` | `#F0F0F0` / `#424242` | `#202F36` / `#DCE6EC` |
| `marca-cx` / `marca-cx-forte` | `#FDEEE4` / `#FBDCC8` | `#352C26` / `#734528` |
| `rank-1` / `rank-2` / `rank-3` | `#E8732E` / `#0D0D0D` / `#8F8F8F` | `#EB8447` / `#F1F7FB` / `#8FA3AD` |

Dois detalhes:

- `* { border-color: var(--color-linha) }` (`index.css:262`) continua sendo a cor padrão de borda. `linha` (`#E8E8E8`)
  e `borda` (`#E5E5E5`) são dois cinzas quase iguais; as peças `duo` sempre escrevem `border-borda`.
- `caramelo` ainda pinta a pinta do logotipo (`components/marca/Pinta.tsx:29`, `text-caramelo`). É o mesmo hex do
  `laranja`.

### 1.4 A ponte com o shadcn e a rampa `neutral`

Só servem às peças coladas do 21st.dev (`components/ui`, `components/blocks`). O produto não tem essas peças.

| Token | Claro | Escuro |
|---|---|---|
| `background`, `card`, `popover`, `sidebar` | `#FFFFFF` | `#131F24` |
| `foreground`, `card-foreground`, `popover-foreground`, `primary`, `secondary-foreground`, `accent-foreground`, `ring`, `sidebar-foreground`, `sidebar-primary`, `sidebar-accent-foreground`, `sidebar-ring` | `#0D0D0D` | `#F1F7FB` |
| `primary-foreground`, `sidebar-primary-foreground`, `destructive-foreground` | `#FFFFFF` | `#131F24` |
| `secondary`, `muted`, `accent` | `#F4F4F4` | `#202F36` |
| `muted-foreground` | `#5D5D5D` | `#8FA3AD` |
| `destructive`, `red-500` | `#B42318` | `#F6878C` |
| `border` | `#E8E8E8` | `#37464F` |
| `input` | `#D9D9D9` | `#37464F` |
| `sidebar-accent` | `#ECECEC` | `#202F36` |
| `sidebar-border` | `#E5E5E5` | `#37464F` |

Rampa `neutral` (claro → escuro): 50 `#F9F9F9` → `#131F24` · 100 `#F4F4F4` → `#202F36` · 200 `#E8E8E8` → `#37464F` ·
300 `#D9D9D9` → `#485A62` · 400 `#8F8F8F` → `#52656D` · 500 `#5D5D5D` → `#8FA3AD` · 600 `#424242` → `#DCE6EC` ·
700 `#2F2F2F` → `#E5EDF2` · 800 `#212121` → `#EEF4F8` · 900 `#0D0D0D` → `#F1F7FB` · 950 `#000000` → `#FFFFFF`.

### 1.5 Cores fixas, fora dos tokens

- **A onça** (`onca/paleta.ts:38-51`), hex literal, **não muda no escuro**: pelagem `#E8732E` · sombra `#D75F18` ·
  realce `#ED935D` · creme `#FDEBDD` · roseta `#7A3412` · pupila `#16233E` · olho `#FFFFFF` · nariz `#E5838C` · língua
  `#FF9FB0` · chão `var(--color-onca-chao)`.
- **Neutros dos ícones** (`paleta.ts:54-63`): branco `#FFFFFF` · papel e linha pelos tokens · borda `#E5E5E5` ·
  apagado `#AFAFAF` · sutil `#5D5D5D` · tinta `#0D0D0D`.
- **A pinta da comemoração**: `fill="#E8732E"` literal (`comemoracao.tsx:40`).
- **O brilho da barra de progresso**: `rgba(255,255,255,.2)` literal (`progresso.tsx:27`).
- **O ícone do navegador** (`public/marca/turmma-icone.svg`) e o logotipo negativo usam fundo `#16233E`, o azul-noite
  da pele antiga.

### 1.6 Raios, sombras, espaço e medidas da casca

**Raios** (`index.css:94-96` e `117`)

| Token | Valor | Observação |
|---|---|---|
| `--radius-linha` | 10 px | |
| `--radius-controle` | 12 px | |
| `--radius-cartao` | 16 px | |
| `--radius-caixa` | 16 px | Era 28 até a 11ª rodada |
| `--radius-sm` / `md` / `lg` / `xl` | 8 / 12 / 12 / 16 px | A escala do shadcn |
| `--radius-botao` | 12 px | |
| `--radius-selo` | 8 px | |

Na prática, por literal (usos em `duo/` e casca): `rounded-full` 48 · `rounded-[12px]` 42 (botão, campo, opção, aviso,
item da lateral) · `rounded-[16px]` 35 (cartão, diálogo, popover, faixa, tabela) · `rounded-[8px]` 16 (selo, carimbo,
célula) · `rounded-[10px]` 14 (botão pequeno, item de menu, sigla da escola) · `rounded-[14px]` 5 · `rounded-[6px]` 4 ·
`rounded-[20px]` 2 (balão de quem escreve, folha de baixo) · 9, 4 e 3 px pontuais. A caixa do chat tem 24 px
(`ui/input-bar.tsx:318`).

**Sombras** (`index.css:100-105`). Regra da 11ª rodada: nenhuma sombra com desfoque.

| Token | Valor |
|---|---|
| `--shadow-caixa` | `0 0 0 2px var(--color-borda)` |
| `--shadow-flutua`, `--shadow-md`, `--shadow-lg` | `0 0 0 2px var(--color-borda), 0 4px 0 0 var(--color-borda)` |
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,.04)` |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,.05)` |

Na prática: `border-2 border-borda` mais `shadow-[0_4px_0_0_var(--color-borda)]` (a constante `CLASSE_FLUTUA`,
`menu.tsx:13`; 8 usos); `shadow-[inset_0_-2px_0_var(--color-borda)]` no cabeçalho preso de tabela (2); e
`shadow-[0_3px_0_0_…]` no `LadrilhoKPI` (2).

**Espaço.** Não há token próprio: é a escala de 4 px do Tailwind. Os valores que se repetem:

| Onde | Valor |
|---|---|
| Margem lateral da página | 16 px no celular, 32 px a partir de 768 (`px-4 md:px-8`, `pagina.tsx:33`) |
| Topo da página até o cabeçalho | 24 px (`pt-6`) |
| Cabeçalho até o corpo | 16 px (`pt-4`) |
| Fim do corpo | 32 px (`pb-8`) |
| Vão da grade do painel | 16 px (`gap-4`) |
| Dentro do cartão | 16 px, 20 px a partir de 768 ou 1024 (`p-4 md:p-5` no `Cartao`; `p-4 lg:p-5` no `CartaoPainel`) |
| Entre as linhas da fila | 10 px |
| Entre os lugares da lateral | 8 px |
| Entre as mensagens da conversa | 24 px |
| Título de seção até o bloco | 12 px (`mb-3`) |

**[diverge]** O LEIAME (padrão de 20/09) fala em margem de 24 px e vão de 12 px entre cartões. O código da 14ª rodada
usa 32 e 16.

**Medidas da casca** (variáveis)

| Variável | Valor | Onde |
|---|---|---|
| `--sidebar-width` | 256 px | `Casca.tsx:726` |
| `--sidebar-width-icon` | 88 px | `Casca.tsx:726` (o trilho) |
| Gaveta do celular | 18 rem (288 px) | `blocks/sidebar.tsx:23` |
| `--barra-topo` | 0; 56 px abaixo de 768 | `index.css:216-218` |
| `--barra-baixo` | 0; `calc(68px + env(safe-area-inset-bottom, 0px))` abaixo de 768 | idem |
| `--reserva-sino` | 0; 56 px a partir de 768, só com `data-sino` | `index.css:222-224` |
| `--zoom` | 1; 1.1; 1.2 | `dados/preferencias.ts:82-92` |

Utilitários: `altura-tela` é `height: calc(100svh / var(--zoom, 1) - var(--barra-topo, 0px) - var(--barra-baixo, 0px))`
e `min-altura-tela` é o mesmo em `min-height` (`index.css:225-226`). As classes `.h-svh`, `.min-h-svh` e `.max-h-svh`
são redefinidas para dividir por `--zoom` (linhas 231 a 233).

Camadas (`z-`): barras do celular 30 · sino no canto 20 · popover do sino 40 · diálogo, menu, popover e folha 50 ·
lateral fixa 10.

Pontos de quebra usados nas peças: `md:` (768) 52 vezes e `max-md:` 52; `sm:` (640) 30; `lg:` (1024) 28; `max-sm:` 10;
`min-[1200px]`, `min-[1440px]` e a consulta de contêiner `@min-[360px]` uma vez cada.

### 1.7 Tempos e curvas

Declarados (`index.css:107-120`, `235-239`, `251-252`):

| Token | Valor |
|---|---|
| `--t-estado` / `--dur-estado` | 150 ms |
| `--t-gesto` | 260 ms |
| `--t-entrada` | 420 ms |
| `--dur-toque` | 100 ms |
| `--dur-padrao` | 300 ms |
| `--dur-barra` | 400 ms |
| `--dur-salto` | 600 ms |
| `--curva-estado` / `--ease-estado` | `cubic-bezier(.2,0,0,1)` |
| `--curva-entrada` / `--ease-entrada` | `cubic-bezier(.22,1,.36,1)` |
| `--curva-quique` / `--ease-quique` | `cubic-bezier(.35,1.8,.35,.83)` |
| `--animate-entra` | `entra 420ms cubic-bezier(.22,1,.36,1) both` |
| `--animate-palavra` | `palavra 520ms cubic-bezier(.22,1,.36,1) both` |
| `--animate-passada` | `passada 1400ms cubic-bezier(.2,0,0,1) 600ms 1 both` |
| `--animate-pulso` | `pulso 1600ms ease-in-out infinite` |
| `--animate-salta` | `salta 600ms ease-in-out both` |
| `--animate-sobe` | `sobe 200ms cubic-bezier(.35,1.8,.35,.83) both` |

O que o código realmente consome: só `--dur-toque` (na transição da face do degrau, `index.css:309`). O resto é
literal: `duration-150` 132 vezes · `duration-200` 15 · `duration-500` 7 (a folha abrindo) · `duration-300` 3 (a folha
fechando) · `duration-100` 2 · `duration-[400ms]` 1 (a barra de progresso) · `duration-[260ms]` 1 · `ease-estado` 3 ·
`ease-entrada` 1. `--t-*` e `--curva-*` não têm nenhum `var()`.

### 1.8 Tipografia

Base: `body { font: 400 16px/1.5 var(--font-corpo) }`, com `-webkit-font-smoothing: antialiased` (`index.css:264-265`).

As classes da 11ª rodada (`index.css:291-300`):

| Classe | Tamanho / altura | Peso | Caixa e espaçamento | Extra |
|---|---|---|---|---|
| `t-titulo` | 24 / 30 px | 700 | `letter-spacing: -.01em` | |
| `t-secao` | 20 / 26 px | 700 | | |
| `t-balao` | 20 / 26 px | 500 | | |
| `t-cartao` | 17 / 22 px | 700 | | |
| `t-corpo` | 17 / 25 px | 500 | | |
| `t-apoio` | 15 / 20 px | 500 | | `color: var(--color-sutil)` |
| `t-rotulo` | 15 / 18 px | 700 | caixa alta, `.04em` | |
| `t-selo` | 13 / 16 px | 700 | caixa alta, `.04em` | |
| `t-numero` | 28 / 32 px | 700 | | `tabular-nums` |
| `t-numero-g` | 36 / 40 px | 700 | | `tabular-nums` |

Pesos: só 500 (`font-medium`, 51 usos) e 700 (`font-bold`, 119). O 600 aparece 6 vezes, todas em `gestao.tsx`. O 800
só existe dentro do SVG dos ícones (as letras "Aa", "Hi", "?").

Tamanhos soltos que se repetem (usos em `duo/` e casca): 15 px (65: rótulo de campo, item de menu, nome) · 14 px (41:
segunda linha) · 13 px (32: voltar, aviso de IA, eixo) · 12 px (15: barra de baixo, selo pequeno) · 16 px (11: busca,
"Pensando…") · 17 px (9: campo, resposta da IA em 17/26) · 20 px (4: título de diálogo, 20/26) · 22 px (3: título da
`Faixa`, 22/28) · 32 e 40 px (2 cada: a saudação da conversa em 32/40 com `-.02em`, e o número do `LadrilhoKPI` em
40/44) · 11 px (1: a `Etiqueta`, o menor texto do sistema).

Classes antigas que continuam no CSS (`index.css:284-289`): `titulo-tela` (22 px, 600, 1.25, `-0.015em`; 1 uso),
`saudacao` (400, `clamp(24px, 3vw, 28px)`, 1.25, `-0.01em`; 8 usos), `numero-painel` (600, 28 px, altura 1, `-0.02em`,
tabular; 0 usos) e `rotulo` (13 px, 500, 1.2, `sutil`; 18 usos).

`h1, h2, h3 { text-wrap: balance }` e `p, li { text-wrap: pretty }` (`index.css:266-267`).

### 1.9 Fontes

| Fonte | Arquivo (`mockups/public/fonts/`) | Tamanho | Uso real |
|---|---|---|---|
| Fustat 600 | `fustat-600-latin.woff2` | 12.200 bytes | Só a palavra "Turmma" do logotipo (`font-marca`; 1 uso, em `Pinta.tsx:27`: 20 px, 600, `-0.03em`) |
| Inter variável 400 a 700 | `inter-latin.woff2` | 48.432 bytes | **Nenhum.** `--font-teachy-corpo` aponta para a fonte do sistema desde a 10ª rodada |
| Quicksand variável 400 a 700 | `quicksand-latin.woff2` | 28.336 bytes | **Nenhum** (`--font-teachy` idem) |

`index.html:6-7` faz `preload` da Inter e da Fustat. A Inter é baixada em toda carga e não é usada.

A pilha da interface (`--font-corpo`, `--font-titulo`, `--font-sans`, `--font-teachy`, `--font-teachy-corpo`):
`ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif`.
`--font-marca`: `"Fustat", ui-sans-serif, system-ui, sans-serif`.

**[incerto]** As medidas foram ajustadas a olho na máquina do Gabriel. No ChromeOS, `system-ui` resolve para outra
fonte, com outra largura. O caso sensível é "AVISAR UM ADULTO" a 14 px em caixa alta no item de 256 px
(`Casca.tsx:126-128`): vale medir no Chromebook.

Marca em `mockups/public/marca/`: `turmma-icone.svg` (830 bytes), `turmma-pinta.svg` (735), `turmma-negativo.svg`
(1.732), `google.svg` (8.169) e `microsoft.svg` (356).

Existem **dois desenhos de pinta**: o componente `Pinta` (`marca/Pinta.tsx`, viewBox `-34 -34 68 68`, seis elipses e
dois círculos) e o `PINTA_PATH` (`onca/paleta.ts:67`, um caminho de 2,7 KB com três subcaminhos, raio de cerca de 500
unidades), usado nas rosetas da onça e na comemoração.

---

## 2. TÉCNICAS

### 2.1 O degrau (`index.css:302-318`)

```css
.degrau { position: relative; isolation: isolate; padding-bottom: var(--altura-degrau, 4px);
  border-radius: var(--radius-botao); background: none; border: 0; -webkit-tap-highlight-color: transparent; }
.degrau::before { content: ""; position: absolute; inset: var(--altura-degrau, 4px) 0 0; border-radius: inherit;
  background: var(--lado); z-index: -1; }
.degrau > .face { display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: inherit;
  background: var(--face); transition: transform var(--dur-toque, 100ms) linear, filter 150ms ease-out, background-color 150ms ease-out; }
.degrau:hover > .face { filter: brightness(1.06); }
.degrau:active > .face, .degrau[data-apertado] > .face { transform: translateY(var(--afunda, var(--altura-degrau, 4px))); }
.degrau:disabled, .degrau[aria-disabled="true"] { cursor: not-allowed; }
.degrau:disabled::before, .degrau[aria-disabled="true"]::before { display: none; }
.degrau:disabled > .face, .degrau[aria-disabled="true"] > .face { background: var(--color-borda); color: var(--color-apagado);
  border-color: var(--color-borda); filter: none; transform: none; }
.degrau.degrau-branco:hover > .face { filter: none; background: var(--color-fundo-suave); }
```

Como funciona: a peça é a caixa de fora, sem fundo. O degrau é um `::before` parado, na cor `--lado`, que começa
`--altura-degrau` abaixo do topo. A face é um filho com a classe `face`, na cor `--face`, que desce ao apertar e cobre
o degrau. O `padding-bottom` reserva o espaço, então **o layout não mexe**.

- `--face`: a cor de cima. `--lado`: a cor do degrau.
- `--altura-degrau`: padrão 4 px.
- `--afunda`: quanto a face desce. O padrão é o degrau inteiro. Cartão e opção usam 2, e sobra um degrau de 2.
- `data-apertado` força o estado apertado. Nenhuma tela usa.
- Desligado: sem degrau, face `borda`, texto `apagado`. O `padding-bottom` continua: a altura total não muda.
- `degrau-branco`: o hover troca a face por `fundo-suave`, em vez do brilho.

Quem usa, e a altura total (face mais degrau):

| Peça | Face | Degrau | Afunda | Total |
|---|---|---|---|---|
| `Botao` g | 46 | 4 | 4 | 50 |
| `Botao` m | 38 | 4 | 4 | 42 |
| `Botao` p | 32 | 3 | 3 | 35 |
| `Botao` fantasma | 46 / 38 / 32 | 0 | 0 | igual à face |
| `BotaoIcone` 40 / 44 / 48 | 40 / 44 / 48 | 3 | 3 | 43 / 47 / 51 |
| `Cartao` clicável | livre | 4 | 2 | face mais 4 |
| `LinhaFila` | 68 | 4 | 2 | 72 |
| `Opcao` | mínimo 64 | 4 | 2 | mínimo 68 |
| `Toque` | 40 | 3 | 3 | 43 |
| `LadrilhoAcao` | 92 no computador, 84 no celular | 4 | 4 | 96 / 88 (a caixa já inclui o degrau) |
| Seletor de escola e de rede | 48 | 4 | 2 | 52 |

Há uma **segunda técnica**, fora da classe `.degrau`: o `LadrilhoKPI` usa `shadow-[0_3px_0_0_…]` e
`active:translate-y-[2px] active:shadow-none` (`gestao.tsx:328-329`). A peça inteira desce, e o layout não tem o
espaço reservado.

### 2.2 O foco (`index.css:272-274`)

```css
:focus-visible { outline: 3px solid var(--color-azul-texto); outline-offset: 2px; }
.sobre-noite :focus-visible { outline-color: var(--color-caramelo-noite); }
textarea:focus-visible, input:focus-visible { outline-offset: 0; }
```

O anel é `#146EAA` no claro e `#60B9F4` no escuro. A classe `sobre-noite` não é usada em lugar nenhum.

As exceções, que são o que dá trabalho:

- **Campo de texto** (`CLASSE_CAMPO`, `campo.tsx:13`): `outline-none focus-visible:outline-none`. O foco é só a borda
  de 2 px passando de `borda` para `azul-borda` (`#99D2F8` no claro). A caixa do chat faz o mesmo
  (`focus-within:border-azul-borda`, `ui/input-bar.tsx:318`). **[incerto]** Pela minha conta, `#99D2F8` sobre branco dá
  perto de 1,6:1, abaixo do 3:1 que se pede de um indicador de foco. Vale medir.
- **`Opcao`**: o `<input>` é `sr-only` e o anel vai no `<label>`, por `:has()` (`opcao.tsx:28`).
- **Linha de `Tabela`**: `focus-visible:outline-3 focus-visible:-outline-offset-3` (o anel por dentro,
  `tabela.tsx:61`).
- **`gestao.tsx`**: `outline-none` com `focus-visible:ring-[3px] focus-visible:ring-azul` (linhas 227, 322, 490, 512).
- **Item de menu**: sem anel, só `data-[highlighted]:bg-fundo-suave`.
- **Diálogo, popover do sino e miolo do painel ao lado**: recebem o foco programático com `outline-none`.

### 2.3 As animações

**Keyframes do `index.css`** (linhas 242 a 259)

| Nome | O que faz | Onde é usada |
|---|---|---|
| `entra` | `opacity 0 → 1`, `translateY(6px) → none`, 420 ms | `animate-entra`: mensagem de quem escreve, resposta da IA, "Pensando", cada passo da introdução, o botão de ir ao fim da conversa. 38 usos nas telas |
| `palavra` | `opacity 0 → 1`, `translateY(0.3em) → none` | Nenhum uso |
| `passada` | `translateX(-120%) → 220%` | Nenhum uso |
| `pulso` | `opacity 1 → .45 → 1` | A classe `.brilho-pensando` (`pulso 1.4s ease-in-out infinite`, linha 248), no texto "Pensando…". Em laço |
| `cursor` | pisca em `steps(1)`, 1 s, em laço | A classe `.cursor-texto` (linha 320). Nenhum uso |
| `salta` | `scale(.01)` e opacidade 0 → `scale(1.1)` aos 67% → `scale(1)`, 600 ms | `animate-salta`: só a `Comemoracao` (`comemoracao.tsx:43`) |
| `sobe` | `translateY(100%) → none`, 200 ms, com quique | `animate-sobe`: só a `FaixaResultado` (`resultado.tsx:27`) |
| `pulsa` | `scale(1) → 1.05 → 1` | **Definida e nunca usada.** Não existe `--animate-pulsa` nem classe que a chame |
| `pinta-voa` | sai do centro até `(--dx, --dy)`, gira `--giro`, escala .4 → 1, some | As 5 pintas da `Comemoracao`: 700 ms, `cubic-bezier(.22,1,.36,1)`, atrasos de 80, 105, 130, 155 e 180 ms |

**Da onça** (`onca/onca.css`): ver a seção 6.

**Do `tw-animate-css`** (dependência): `animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*` e os pares de saída,
no diálogo, no menu, no popover do sino, na dica do trilho e na folha (500 ms para abrir, 300 ms para fechar).

**Transições**: a face do degrau (`transform` 100 ms linear; `filter` e `background-color` 150 ms); a barra de
progresso (`transform: scaleX()`, 400 ms, `ease-out`, origem à esquerda); a bolinha do interruptor (`translate`, 150
ms); o chevron do recolhível (200 ms); `transition-colors duration-150` em quase tudo que tem hover.

**Movidas a JavaScript**:

- `EmFluxo` (`chat.tsx:142-180`): a resposta chega aos poucos. Um `setInterval` de 30 ms revela `max(2, ceil(total /
  50))` palavras por passo, ou seja, no máximo cerca de 1,5 s. A cada passo recorta a árvore inteira com
  `cloneElement`.
- `ColunaConversa` (`pagina.tsx:265-279`): um `ResizeObserver` segue o fim da conversa enquanto o texto cresce.
- A onça pisca por `setTimeout` (seção 6).
- No `ChatDados`, o "pensando" dura 700 ms fixos (`chat-dados.tsx:102`); o "Refazer", 800 ms (`chat.tsx:309`).

### 2.4 O tema

- O `<html>` recebe **sempre** `data-tema="claro"` ou `data-tema="escuro"`, já resolvido, e `style.colorScheme`.
  O `index.html:10` traz `<meta name="color-scheme" content="light dark">`.
- **Ordem de resolução**:
  1. o forçado da aba: `sessionStorage['turmma-tema-forcado']`, escrito por `?tema=escuro|claro` (`?tema=sistema`
     apaga);
  2. a escolha da pessoa: `localStorage['turmma-aparencia']` (`claro` ou `escuro`; ausente quer dizer "sistema");
  3. o sistema: `matchMedia('(prefers-color-scheme: dark)')`.
- **Antes do React**: um `<script>` **inline** no `<head>` (`index.html:12-30`) faz essa conta e escreve o atributo,
  para a tela não piscar.
- **Depois**: `dados/tema.ts`. `aplicarTema()` roda na carga do módulo (`App.tsx:24`), ouve a mudança do sistema e o
  evento `storage` (outra aba). `aparencia.mudar(a)` grava, tira o forçado e aplica. Três hooks em
  `useSyncExternalStore`: `useAparencia()`, `useTema()` e `useTemaForcado()`.
- O `?tema=` é lido na raiz (`App.tsx:41-59`) e sai do endereço com `replace`.
- As cores trocam por CSS (`:root[data-tema="escuro"]`). A variante `dark:` está declarada (`@custom-variant dark
  (&:is(.dark *))`, `index.css:8`) e **nunca liga**: nenhuma tela usa.
- Para quem lê hex por JavaScript: `useFamilias()` (`familia.ts:62`) e `useTons()` (`onca/tons.ts`).
- **Furos**: o `Icone` e o `AvatarIA` leem `TONS`, o conjunto claro, fixo (`icones/Icone.tsx:20`, `AvatarIA.tsx:18`).
  No escuro, os ícones e o anel do avatar continuam com a cor do claro; só o papel e a linha dos ícones viram. A onça
  não muda de propósito.
- Onde a pessoa escolhe: Configurações › Geral › Aparência, um `Segmentado` Sistema · Claro · Escuro
  (`Configuracoes.tsx:79-90`), para os quatro papéis. Com o tema forçado, mostra "Nesta aba: Escuro".

### 2.5 O tamanho do texto, por papel

- Três valores: `padrao`, `grande` e `maior` (`dados/preferencias.ts:16`). Papéis com a escolha: aluno, professor e
  coordenação. A rede e a operação não têm.
- `useTamanhoDoTexto(papel)` escreve `document.documentElement.style.zoom` (vazio, `1.1` ou `1.2`) e a variável
  `--zoom` (`1`, `1.1` ou `1.2`), e limpa ao desmontar (`preferencias.ts:85-92`).
- Quem chama é **só a casca** (`Casca.tsx:700-703`). Consequência: **nas telas de foco, que ficam fora da casca, o
  texto volta ao tamanho padrão**. Isso inclui a prova do aluno. A introdução do aluno aplica o `zoom` por conta
  própria, num pedaço da tela (`areas/aluno/BemVindo.tsx:136`).
- Como o `zoom` aumenta também as unidades de janela, quem ocupa a altura divide por `--zoom` (seção 1.6). As alturas
  escritas à mão **não dividem**: `max-h-[calc(100svh-32px)]` do diálogo (`dialogo.tsx:37`), `max-h-[88svh]` do painel
  ao lado (`painel-lado.tsx:46`), `h-[100svh]` do sino no celular (`sino.tsx:264`), a altura das Configurações
  (`Configuracoes.tsx:367`) e o slide em tela cheia (`documento.tsx:570`).
- Guardado na fatia `preferencias` do `localStorage`, por papel e não por pessoa (no mockup um navegador faz os três
  papéis).

### 2.6 `prefers-reduced-motion`

Existe, em três lugares:

- **CSS global** (`index.css:276-279`): `*, *::before, *::after { animation-duration: 1ms !important;
  animation-iteration-count: 1 !important; transition-duration: 1ms !important; scroll-behavior: auto !important; }`.
- **A onça** (`onca.css:54-56`): `.onca *, .onca { animation: none !important; }`.
- **JavaScript**: `reduzMovimento()` na onça (não pisca e não acena, `Onca.tsx:129-135`); `movimentoReduzido()` na
  conversa (a resposta aparece inteira; vale também com a aba escondida, `chat.tsx:97-98`); a `ColunaConversa` rola sem
  suavizar (`pagina.tsx:284`).

O que escapa: `scrollIntoView({ behavior: 'smooth' })` em `documento.tsx:287` e em `chat-dados.tsx:517`, `520` e
`562`. O pedido explícito de rolagem suave não passa pela regra de CSS.

---

## 3. PEÇAS

Dependências de todas: `cn()` (`lib/utils.ts`), que é `twMerge(clsx(...))`; `lucide-react` para os glifos, quase
sempre com `strokeWidth={2.5}` (67 de 115 usos; 3 em seta e relógio; 3.5 em visto e xis); `react-router-dom` para
`Link` e `useNavigate`.

**O que nenhuma peça tem: o estado "carregando".** Não há `carregando` no botão, não há esqueleto, não há indicador de
espera fora do "Pensando…" da conversa. O mockup não fala com servidor. A regra 50, item 5, pede os quatro estados em
toda tela: esse desenho o produto vai ter de inventar.

### 3.1 Ação

**`Botao`** — `duo/botao.tsx`. Dependências: `class-variance-authority`.

- Props: `variante`, `tamanho`, `largura` (`auto` ou `cheia`), `asChild` (passa a aparência para o filho, um `Link`),
  `icone` (glifo à esquerda), e as de `<button>`. Padrões: `primario`, `g`, `auto`, `type="button"`.
- Texto: 700, caixa alta por CSS (o texto vai escrito normal, para o leitor de tela), `.04em`, `leading-none`, sem
  quebra de linha.

| Tamanho | Face | Padding lateral | Letra | Glifo | Canto | Degrau |
|---|---|---|---|---|---|---|
| `g` | 46 px | 16 px | 15 px | 20 px | 12 | 4 |
| `m` | 38 px | 14 px | 14 px | 18 px | 12 | 4 |
| `p` | 32 px | 12 px (vão de 6) | 13 px | 16 px | 10 | 3 |

| Variante | Face | Degrau | Texto | Borda | Para quê |
|---|---|---|---|---|---|
| `primario` | `laranja` | `laranja-degrau` | `sobre-cor` | — | criar, pedir, exportar |
| `oficial` | `grafite` | `grafite-degrau` | `white` | — | aprovar, confirmar |
| `secundario` | `white` | `borda` | `apoio`, `tinta` no hover | 2 px `borda` | a alternativa |
| `perigo` | `white` | `vermelho-borda` | `vermelho-texto` | 2 px `vermelho-borda` | recusar, revogar |
| `perigoCheio` | `vermelho` | `vermelho-degrau` | `sobre-cor` | — | só na confirmação, em diálogo |
| `fantasma` | transparente | sem degrau | `azul-texto` | — | VER TUDO; hover com face `fundo-suave` |

- Estados: hover (brilho 1,06; nas brancas, `fundo-suave`); apertado (a face desce); desligado (sem degrau, face
  `borda`, texto `apagado`; no fantasma a face fica transparente); foco (o anel global).
- **Não tem**: carregando; bloqueio de clique com `asChild` desligado (põe `aria-disabled` no `Link`, que continua
  navegando).
- Regra de uso: no máximo um botão cheio por tela.

**`BotaoIcone`** — `duo/botao.tsx`.

- Props: `rotulo` (obrigatório; vira `aria-label` e, com `dica` verdadeiro, `title`), `variante` (`primario`,
  `oficial`, `secundario`, `fantasma`; padrão `fantasma`), `tamanho` (40, 44 ou 48; padrão 40).
- Redondo, degrau de 3 px (0 no fantasma). Glifo de 20 px no 40 e de 22 px no 44 e no 48.
- Fantasma: texto `sutil`, `tinta` no hover, face `fundo-suave` no hover.

**`MenuMais`** e **`CLASSE_FLUTUA`** — `duo/menu.tsx`. Dependência: `@radix-ui/react-dropdown-menu`.

- Props: `itens` (`{ rotulo, aoEscolher, perigo?, icone?, desligado? }`), `rotulo` (padrão "Mais opções"), `alinhar`,
  `lado`, `gatilho` (troca o botão ⋯).
- Gatilho: `BotaoIcone` fantasma de 40 com `Ellipsis`.
- Caixa: `CLASSE_FLUTUA` (canto 16, borda 2, degrau sólido de 4, fundo `white`), largura mínima 224 px, padding 6 px,
  afastamento 8, margem de colisão 12, `z-50`, entra com `fade-in-0`.
- Item: 44 px, canto 10, padding lateral 12, vão 10, 15 px / 500, glifo de 18 px em `sutil`. Realçado: `fundo-suave`.
  Desligado: `apagado`. Perigoso: `vermelho-texto`.
- Teclado e ARIA: tudo vem do Radix (setas, busca por letra, Esc, devolução do foco, `role="menu"`). `modal={false}`.

**`Toque`** e **`GrupoToques`** — `duo/toque.tsx`.

- `Toque`: props `selecionado`, `aoMudar`, `icone`, `disabled`. Pílula: face de 40 px, borda 2, padding lateral 16,
  15 px / 700, glifo 18, degrau 3. Escolhido: `azul-claro`, `azul-borda`, `azul-texto`. Usa `aria-pressed`.
- `GrupoToques`: props `opcoes`, `valor` (um ou vários), `aoMudar`, `multiplo`, `rotulo`. É `role="group"` com
  `aria-label`, em linha que quebra, vão de 8.
- **Não tem**: setas. Na escolha única, é um grupo de botões com `aria-pressed`, não um grupo de rádio.

**`LadrilhoAcao`** — `duo/ladrilho.tsx`.

- Props: `icone`, `rotulo`, `para` ou `onClick`.
- 104 × 88 no celular, 110 × 96 a partir de 768. Canto 16, borda 2, degrau 4. Ícone de 40, rótulo em `t-selo`,
  `apoio`, centrado, até 2 linhas, vão de 6.

**`Acao`**, **`AcoesResposta`** e **`BotaoAnexar`** — `duo/chat.tsx` (15ª rodada).

- `Acao`: botão de 32 × 32, canto 8, glifo de 18, `sutil` (hover `fundo-suave` e `tinta`). `rotulo` vira `aria-label`
  e `title`. Com `pressionado`, `aria-pressed` e glifo preenchido.
- `AcoesResposta`: `role="toolbar"`, `aria-label="Ações da resposta"`. Copiar (vira "Copiado" por 1,6 s) · Refazer ·
  Boa resposta · Resposta ruim · o que a tela somar. Escondida até o hover ou o foco; na última resposta e no toque
  (`@media (hover: none)`), sempre à vista. Depois do voto: "Obrigado. Isso ajuda a escola a ajustar."
- `BotaoAnexar`: redondo de 36, borda 2, `Plus` de 20, com um `<input type="file" multiple hidden>`.

### 3.2 Conter e listar

**`Cartao`** — `duo/cartao.tsx`.

- Props: `como` (`div`, `button` ou `link`), `para`, `onClick`, `replace`, `type`, `disabled`, `selecionado`,
  `semRespiro`, `className` (vai para a **face**), `classeCaixa` (vai para a caixa de fora), `style`, `aria-label`,
  `title`.
- De leitura: `div`, canto 16, borda 2 `borda`, fundo `white`, padding 16 (20 a partir de 768), **sem degrau**.
- Clicável: a técnica do degrau, 4 px, afunda 2, hover `fundo-suave`.
- Selecionado: face `azul-claro`, borda e degrau `azul-borda`; o `.t-cartao` de dentro fica `azul-texto`. No botão,
  `aria-pressed`; no link, `aria-current="true"`.
- A cor de família vai no ladrilho e no selo de dentro, nunca no fundo inteiro.

**`Linha`** — `duo/linha.tsx`.

- Props: `inicio`, `titulo` (texto), `abaixo`, `fim`, `chevron`, `para`, `onClick`.
- Altura mínima 64, vão 12, padding 16 × 8, separada da de cima por 2 px `borda`.
- Título em `t-cartao`, uma linha com reticência, e o `title` guarda o texto inteiro. Abaixo: `t-apoio`.
- Chevron: `ChevronRight` de 20, `apagado`, anda 2 px no hover.
- Vira `Link`, `button` ou `div`. Clicável: hover `fundo-suave`.

**`Tabela`** — `duo/tabela.tsx`.

- Props: `colunas` (`{ titulo, classe?, celula, soComputador? }`), `linhas`, `chave`, `aoAbrir`, `ativa`, `vazio`
  (padrão "Nada por aqui."), `rolaPorDentro`, `rotulo`.
- Moldura: canto 16, borda 2. Cabeçalho: `t-selo`, 44 px, padding lateral 16, `sutil`. Linha: 64 px, 15 px / 500,
  separada por 2 px. Ativa: `azul-claro`. Com `aoAbrir`: a linha inteira clica, com chevron de 20 no fim.
- `rolaPorDentro`: cabeçalho preso, com o fio de baixo em sombra interna.
- Abaixo de 768: cada linha vira um cartão empilhado. A primeira coluna é o título (`t-cartao`); as outras vêm numa
  `<dl>`, com o nome em `t-selo`.
- Teclado e ARIA: `<th scope="col">`, `aria-label` na tabela; a linha clicável tem `tabIndex={0}` e abre com Enter e
  espaço. **Problema**: usa `aria-selected` num `<tr>` sem papel de grade, e a linha não tem `role`.
- Não ordena, de propósito.

**`Recolhivel`** — `duo/pessoa.tsx`. Dependência: `@radix-ui/react-collapsible`.

- Props: `titulo`, `apoio`, `aberto` (começa aberto).
- Canto 16, borda 2. Gatilho: mínimo 56, padding 16 × 8, chevron de 20 que gira 90° em 200 ms. Conteúdo: borda de cima
  de 2, padding 16 × 12. **Sem animação de altura.**

**`EstadoVazio`** — `duo/vazio.tsx`. Props: `ilustracao`, `titulo`, `acao`. Coluna centrada, vão 16, padding vertical
24, título `<h3>` em `t-secao`. Sem parágrafo.

**`Secao`**, **`GradePainel`** e **`CartaoPainel`** — `duo/pagina.tsx`: ver a seção 5.

### 3.3 Marcar e informar

**`LadrilhoIcone`** — `duo/ladrilho.tsx`. Props: `familia` (padrão laranja), `tamanho` (32, 40, 44 ou 56; padrão 44),
`icone`, `rotulo`. Quadrado de canto 12, fundo no `claro` da família, ícone a 72% do lado. Com `rotulo`, `role="img"`;
sem, `aria-hidden`.

**`Selo`** — `duo/selo.tsx`. Props: `familia` (uma das 10 ou `neutro`; padrão `neutro`), `tamanho` (`m` ou `p`),
`icone`, `title`.

- `m`: 24 px de altura, padding lateral 8, `t-selo` (13 px), glifo 16. `p`: 20 px, padding 6, letra de 12, glifo 14.
- Canto 8. Neutro: `fundo-suave` com `apoio`. De família: `claro` com `texto`.

**`SeloIA`** — o `Selo` neutro com "IA", sem caixa alta, `title="Feito por inteligência artificial"`.

**`SeloTurma`** — props `turma`, `materia`. Pega a família da matéria (`materiaDe`); neutro quando não conhece.

**`SeloNovo`** (`duo/pessoa.tsx`) — "Novo", azul, sem número. Some quando a pessoa abre.

**`Contador`** — `duo/selo.tsx`. Props: `n`, `familia` (padrão laranja), `tamanho`, `rotulo` (padrão "esperando
você"). Pílula na face da família, texto `sobre-cor`, 700, tabular. `p`: 22 px, letra 13. `m`: 24 px, letra 14. `g`:
28 px, letra 15. `role="img"` com `aria-label="N rótulo"`.

**`Ponto`** — `duo/selo.tsx`. Círculo de 20 px com glifo de 12, `role="img"`, `aria-label` e `title`.

| Estado | Rótulo | Aparência |
|---|---|---|
| `feito` | Feito | `verde-degrau`, visto em `white` |
| `esperando` | Esperando | `amarelo`, relógio em `sobre-cor` |
| `perdeu` | Perdeu o prazo | `vermelho-degrau`, xis em `white` |
| `vazio` | Não começou | borda 2 `borda`, fundo `white`, sem glifo |
| `rascunho` | Rascunho | borda 2, `fundo-suave`, lápis em `apoio` |

**`BarraProgresso`** — `duo/progresso.tsx`. Props: `valor`, `max` (padrão 100), `familia` (padrão laranja), `altura`
(16 ou 12), `rotulo`.

- Trilho em `borda`, redondo. Preenchimento na face da família, por `scaleX()` em 400 ms. Por cima, o brilho: branco a
  20%, 30% da altura, a 25% do topo, com 8 px de recuo de cada lado.
- `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label`. Sem `aria-valuetext`.
- O texto "2 de 8" vai fora da barra. Só mede o que tem fim.

**`Passos`** — `duo/passos.tsx`. Props: `passos`, `atual` (índice), `aoIr`.

- Cada passo: círculo de 32, borda 2, 15 px / 700. Feito: `verde` com visto. Atual: `azul` com o número. Falta:
  `white`, borda `borda`, `sutil`. A linha entre eles tem 2 px, a 15 px do topo.
- Rótulo embaixo, em `t-selo`. `<ol aria-label="Passos">`, `aria-current="step"` no atual. Com `aoIr`, os feitos são
  botões ("Voltar ao passo N: …").

**`Aviso`** — `duo/aviso.tsx`. Props: `tom` (`info` azul, `atencao` amarelo, `erro` vermelho, `certo` verde),
`titulo`, `acao`.

- Canto 12, borda 2 na borda da família, fundo `claro`, padding 16 × 12. Glifo num círculo `white` de 28, com 16 px.
  Título em `t-cartao`; corpo em 15 / 21 px, 500, `tinta`. Sem degrau.
- `role="alert"` no erro e `role="status"` nos outros. **Atenção**: `status` num texto que está sempre na tela é
  ruído para o leitor.

**`Carimbo`** — `duo/pessoa.tsx`. Props: `por`, `quando`, `verbo` (padrão "Aprovado por"), `extra`. Mínimo 32 px,
canto 8, `verde-claro` com `verde-texto`, padding 10 × 4, 14 / 20 px, 700, visto de 16. É o registro da decisão
humana.

**`Avatar`** — `duo/pessoa.tsx`. Props: `nome`, `tamanho` (24, 32, 40, 48 ou 56; padrão 40).

- As iniciais (primeira e última palavra) num círculo, texto `sobre-cor` em 700, letra de 38% do lado.
- A cor é sorteada pelo nome, entre azul, verde, roxo, turquesa, rosa, lima, amarelo e anil. Nunca laranja nem
  vermelho.
- `role="img"`, `aria-label` e `title` com o nome.
- **Inconsistência**: a bolinha de iniciais da casca (`Iniciais`, `Casca.tsx:526-528`) é sempre laranja.

**`NumeroGrande`** — `duo/numero.tsx`. Props: `icone`, `valor`, `rotulo`, `familia`, `grande`, `variacao` (`{ valor,
bom? }`). Cartão de leitura (canto 16, borda 2, padding 16, vão 8): ladrilho de 32, valor em `t-numero` (ou
`t-numero-g`), rótulo em `t-selo` `sutil`. A variação é um selo de 24 px com seta, verde quando é bom e vermelho
quando não é.

**`Balao`** — `duo/balao.tsx`. Props: `lado` (`esquerda`, `baixo` ou `cima`). `t-balao`, canto 16, borda 2, fundo
`white`, padding 16 × 12. A ponta é um quadrado de 14 px girado 45°, com borda em dois lados, a 8 px para fora.

**`Faixa`** — `duo/faixa.tsx`. Props: `familia`, `rotulo`, `titulo`, `linha`, `acao`, `icone`. Massa de cor: face cheia
da família, canto 16, padding 20, texto `sobre-cor`, sem degrau. Rótulo em `t-selo`, título `<h2>` em 22 / 28 px, 700,
uma linha em `t-corpo`. O ícone de 48 vai num ladrilho `white` de 64 com canto 14, e some abaixo de 640.

**`Comemoracao`** — `duo/comemoracao.tsx`. Props: `ilustracao` (a onça comemorando), `titulo`, `acao`, `aoTerminar`.

- A ilustração salta uma vez (600 ms). Cinco pintas laranja saem de trás em leque e somem (700 ms): tamanhos 22, 16,
  20, 15 e 21 px; destinos (−96, −54), (−52, −98), (6, −112), (58, −94) e (100, −48); giros de −50°, 35°, 80°, −30° e
  60°.
- Título em 24 / 30 px, 700, `verde-texto`. `role="status"`. `aoTerminar` dispara aos 700 ms.
- Usada em `aluno/Atividade.tsx` (a entrega da tarefa), `aluno/Prova.tsx` e no fim da `Introducao`.

**`FaixaResultado`** — `duo/resultado.tsx`. Props: `tipo` (`certo`, `erro` ou `info`), `titulo`, `acao`. Sobe com
quique (200 ms). Fundo `claro` da família, borda de cima de 2, padding 20 × 16. Glifo num círculo `white` de 32.
Título em 20 / 26 px, 700, na cor `texto`. `role="status"`.

### 3.4 Formulário

**`CLASSE_CAMPO`** (`duo/campo.tsx:13`): largura cheia, canto 12, borda 2 `borda`, fundo `campo`, padding lateral 14,
17 px / 500, `tinta`, exemplo em `sutil`. Hover: borda `borda-forte`. Foco: borda `azul-borda`, sem anel. Desligado:
fundo `fundo-suave`, texto `sutil`. Inválido (`aria-invalid`): borda `vermelho-borda`.

**`Campo`** — a moldura. Props: `id`, `rotulo`, `dica`, `erro`, `rotuloOculto`. Rótulo em 15 / 20 px, 700. Erro em
`vermelho-texto`, 15 / 20, 700, **sempre com o glifo** `CircleAlert` de 18, e `role="alert"`. Dica em `t-apoio`. Vão
de 6. O filho precisa pôr o próprio `aria-describedby`.

**`CampoTexto`** — props: `rotulo`, `valor`, `aoMudar`, `dica`, `erro`, `linhas`, e as de `<input>`. Uma linha: 48 px.
Várias: `<textarea>`, mínimo de 96 px, sem redimensionar. Gera o `id` com `useId`, liga `aria-invalid` e
`aria-describedby`.

**`CampoSenha`** — o mesmo, com o olho: `BotaoIcone` de 40 à direita, cujo rótulo alterna entre "Mostrar a senha" e
"Esconder a senha". `autoComplete="current-password"` por padrão. Sem `aria-pressed`.

**`Busca`** — props: `valor`, `aoMudar`, `rotulo` (padrão "Buscar"). 44 px, letra de 16, lupa de 20 à esquerda,
largura cheia (288 px a partir de 640). O rótulo é só para leitor de tela e se repete como exemplo.

**`Interruptor`** — `duo/interruptor.tsx`. Props: `ligado`, `aoMudar`, `rotulo` (obrigatório), `disabled`. Trilho de
52 × 32, borda 2. Desligado: `borda`. Ligado: `azul`, com borda `azul-degrau`. Bolinha `white` de 24 que anda de 2 a
22 px. `role="switch"`, `aria-checked`, `aria-label`. Desligado: opacidade de 50%. Muda na hora, sem salvar.

**`Opcao`** — `duo/opcao.tsx`. Props: `tipo` (`radio` ou `checkbox`), `nome`, `valor`, `marcado`, `aoMudar`, `icone`,
`disabled`.

- Um `<label>` com o `<input>` de verdade dentro, escondido. Degrau 4, afunda 2, canto 12, face de no mínimo 64, borda
  2, padding 12 × 8. Ícone de 40 à esquerda, texto em `t-cartao`, e à direita um círculo de 24 com o visto.
- Marcada: `azul-claro`, `azul-borda`, `azul-texto`; o círculo fica `azul`.
- Teclado nativo: setas no grupo de rádio de mesmo `nome`, espaço na caixa de marcar. O foco aparece no rótulo, por
  `:has()`.
- **Não tem**: `fieldset` e `legend` (fica com quem usa).

**`Segmentado`** — `duo/segmentado.tsx`. Props: `opcoes` (`{ id, rotulo, icone? }`), `valor`, `aoMudar`, `rotulo`.

- Grupo de 44 px, borda 2, canto 12, padding e vão de 2. Opção: canto 9, borda 2, padding lateral 12, 15 px / 700,
  ícone de 24. Ativa: `azul-claro`, `azul-borda`, `azul-texto`. Até 4 opções.
- `role="radiogroup"` e `role="radio"`, `aria-checked`, foco itinerante. As quatro setas trocam, dão a volta, e a
  escolha segue o foco. **Não tem** Home e End.
- É para trocar o jeito de ver, não é aba.

**`Abas`** — `duo/abas.tsx`. Props: `abas` (`{ id, rotulo }`), `valor`, `aoMudar`, `rotulo`.

- Uma linha de 48 px sobre um fio de 2 px, vão de 24. Rótulo em `t-rotulo`, `sutil`. Ativa: `azul-texto`, com um
  sublinhado de 3 px em `azul`. **Corta em 3** e avisa no console em desenvolvimento.
- `role="tablist"` e `role="tab"`, `aria-selected`, foco itinerante, setas esquerda e direita.
- **Não tem**: `aria-controls`, `role="tabpanel"`, Home e End.

**`AbasDaPagina`** (`duo/pagina.tsx:130-162`): a mesma lógica, com **44 px**, o número entre parênteses e o encaixe
`fim` à direita. No celular, o `fim` sobe para a linha de cima. O `tablist` não tem `aria-label`.

### 3.5 Sobrepor

**`Dialogo`** — `duo/dialogo.tsx`. Dependência: `@radix-ui/react-dialog`.

- Props: `aberto`, `aoMudar`, `titulo`, `rodape`, `largura` (padrão 520), `descricao` (só leitor de tela).
- Véu `veu`. Caixa centrada, largura `calc(100vw - 32px)` até `largura`, altura até `calc(100svh - 32px)`, canto 16,
  borda 2, degrau sólido de 4. Entra com `fade-in-0 zoom-in-95`.
- Cabeçalho: mínimo 64, título em 20 / 26 px, 700, e o X (`BotaoIcone` fantasma). Miolo: padding lateral e de baixo
  de 24, rola por dentro. Rodapé: borda de cima de 2, padding 24 × 16, à direita, vão de 8.
- O foco, ao abrir, vai para o primeiro campo do miolo ou para o primeiro botão do rodapé, não para o X.
- Prender o foco, Esc, clique fora e os atributos vêm do Radix.
- **Não tem**: versão de folha de baixo no celular (continua centrado).

**`DialogoConfirmar`** — props: `titulo`, `frase`, `confirmar` (`{ rotulo, variante?, aoConfirmar, desligado? }`),
`voltar` (padrão "Voltar"), `children`. Largura 460. Dois botões **do mesmo tamanho**, em duas colunas: secundário à
esquerda e o de confirmar (padrão `oficial`) à direita. Fecha ao confirmar.

**`PainelLado`** — `turmma/painel-lado.tsx` (fora do `duo/index.ts`). Dependência: `ui/sheet`, sobre o Dialog do
Radix.

- Props: `aberto`, `aoFechar`, `titulo`, `rodape`, `largura` (padrão 480), `descricao`.
- A partir de 768: entra pela direita, com 480 px, altura da janela, borda esquerda de 2. Abaixo: folha de baixo, até
  88% da altura, com canto de 20 em cima.
- Cabeçalho de 64 com borda de baixo, título em 20 / 26 px numa linha. Miolo com padding de 24. Rodapé com borda de
  cima, padding 24 × 12 mais a área segura.
- O foco entra no miolo. Fecha com X e Esc.

**`Ajuda`** e **`InfoKPI`** (`gestao.tsx:222-240`, `graficos.tsx:296-313`): o "?" e o "i", botões de 24 que abrem um
popover do Radix (canto 12, borda 2, degrau 4; 300 e 280 px).

**`TituloComMenu`** (`chat.tsx:391-422`): o título da conversa como gatilho de um `MenuMais` (Renomear · extras ·
Apagar). Renomear troca o título por um campo no lugar: Enter salva, Esc desiste, sair do campo salva.

### 3.6 Página e tela de foco

**`TelaFoco`** — `duo/tela-foco.tsx`. Props: `topo` (`{ voltar?, sair?, titulo?, meio?, acoes? }`), `progresso`
(`{ valor, max, familia?, rotulo? }`), `rodape`, `classeMiolo`.

- Altura da janela, em coluna. Topo de 64 com borda de baixo de 2 (some quando não há nada nele): voltar (‹, ou × com
  `sair`), o título em `t-cartao`, o meio centrado e as ações. Sem `meio`, o `progresso` vira uma `BarraProgresso`
  verde de até 560 px.
- Miolo rola por dentro. Rodapé preso, com borda de cima e a área segura.

**`Cabecalho`** e **`BarraApp`** — `duo/cabecalho.tsx`.

- `Cabecalho`: mínimo 64, vão 12, voltar como `BotaoIcone` fantasma, `<h1>` em `t-titulo` numa linha, uma ação e o ⋯.
  Guarda o canto do sino.
- `BarraApp`: ver a seção 4.5.

**`Introducao`** — `duo/introducao.tsx`. Props: `rotulo`, `agente`, `passos`, `fim`, `aoSair`.

- `PassoIntroducao`: `id`, `pose`, `fala`, `conteudo`, `pronto`, `obrigatorio`, `agoraNao`, `rotuloContinuar`,
  `reacao`, `aoContinuar`. `FimIntroducao`: `fala`, `resumo`, `conteudo`, `rotulo`, `aoComecar`.
- É uma `TelaFoco`. Topo: o X (só nos passos não obrigatórios) e a barra verde de até 560 px, que anda a cada passo.
- Miolo numa coluna de 484 px, centrada. A onça de 120 (88 no celular) à esquerda, com o nome da função e o selo IA
  embaixo; o balão com a fala, que é o `<h1>` (`aria-live="polite"`, recebe o foco a cada passo). O conteúdo vem 16 px
  abaixo.
- A reação: quando o passo fica pronto, a fala troca por meia frase, em 150 ms.
- Rodapé: CONTINUAR largo, desligado até o passo ficar pronto. Com "Agora não", as colunas ficam em 1/3 e 2/3.
- Fim: a `Comemoracao` com a onça de 160 (120 no celular), o resumo com visto verde num círculo de 24, e COMEÇAR.
- Teclado: Enter continua (fora de campo e de botão); Esc sai, quando pode.

**As peças de página** (`Pagina`, `CabecalhoPagina`, `BarraConversa`, `ConversaVazia`, `ColunaConversa`,
`LinkVoltar`, `LARGURA`): seção 5.

### 3.7 Conversa com IA (`duo/chat.tsx`, 15ª rodada)

- **`saudacao(hora)`**: "Bom dia" antes das 12, "Boa tarde" antes das 18, "Boa noite" depois.
- **`BoasVindas`**: props `agente`, `titulo`, `subtitulo`. O `AvatarIA` de 44 (36 no celular) ao lado do `<h1>` em
  32 / 40 px, 700, `-.02em` (26 / 32 no celular). Subtítulo em `t-corpo`, `sutil`. Sem balão.
- **`AvisoIA`**: a linha cinza sob a caixa, 13 / 18 px, 500, centrada, `role="note"`. Não fecha.
- **`Sugestoes`**: até 4 `Toque` sob a caixa, centrados. No celular, no máximo 2 linhas (altura máxima de 92 px, o
  resto é cortado).
- **`MensagemUsuario`**: props `texto`, `aoEditar`, `anexos`, `calmo`. Balão à direita, até 85% da largura, canto 20,
  fundo `fundo-suave`, padding 16 × 10, 17 / 25 px, 500. No hover: Copiar e Editar. Editando: uma caixa com borda 2
  `azul-borda`, onde Enter envia, Shift+Enter quebra a linha e Esc desiste.
- **`RespostaIA`**: props `cabecalho`, `depois`, `rodape`, `fluxo`, `acoes`, `ultima`, `calmo`, `agente`. Sem balão:
  a assinatura e o texto em 17 / 26 px, 500, em largura cheia.
- **`PensandoIA`**: o `AvatarIA` de 32 com os três pontos e "Pensando…" em 16 px, pulsando. `role="status"`,
  `aria-live="polite"`.
- **`EmFluxo`**, **`useGeracao`** e **`ProvedorGeracao`**: o texto chegando e o botão de parar (seção 2.3).
- **`useAnexos`**: a lista de anexos da caixa, só na memória.
- **`movimentoReduzido()`**: seção 2.6.

**A caixa do chat** é `ui/input-bar.tsx` (`InputBar`, fora do `duo`):

- Moldura: canto **24**, borda 2 `borda`, fundo `campo`; com o foco dentro, borda `azul-borda`.
- Texto: `<textarea>` de uma linha, 17 / 25 px, 500, que cresce até 200 px e depois rola. Linha de no mínimo 48, com
  padding de 14 em cima e 20 dos lados.
- Linha de baixo: as ações à esquerda (o anexar, redondo de 36) e, à direita, o encaixe `rightActions` e o enviar, um
  `BotaoIcone` primário de 40 com a seta de 20. Desligado quando vazio. Enquanto o texto chega, vira o quadrado de
  parar, um `BotaoIcone` oficial de 40.
- Enter envia; Shift+Enter quebra; a composição do teclado não envia.
- Os anexos aparecem acima do texto, com transição de `grid-template-rows` em 200 ms.

**A assinatura** (`turmma/ia.tsx`, fora do `duo`):

- `AssinaturaIA`: o `AvatarAgente` (padrão 32), o nome da função em 15 / 20 px, 700, o `SeloIA` pequeno e o "quando"
  em `t-apoio`.
- `Estado`: um `Selo` com glifo. pendente: amarelo, relógio. ok: verde, visto. erro: vermelho, xis. info: azul.
- `ChipFonte` (ou `ChipPagina`): pílula de 28, borda 2, 14 px / 700, "p. N". Abre um popover de 320 com material,
  capítulo, página e trecho.
- `ChipWeb`: a mesma pílula, com borda **tracejada** e "da web · domínio".
- `LinhaAprovacao`: o `Carimbo`.

### 3.8 O Analista (`duo/chat-dados.tsx`)

**`ChatDados`** — props: `roteiro`, `layout` (`coluna` ou `tela`), `vazio`, `contexto`, `titulo`, `acoes`, `memoria`,
`fixadas`, `aoFixar`, `pergunta`, `aoResponder`, `compacto`.

- Nenhum número é da peça: tudo vem do `roteiro` (`abertura`, `sugestoes`, `responder`, `placeholder`, `selo`,
  `linhaInicial`).
- `coluna`: cabeçalho de 48 (avatar de 32, "Analista", IA, e o cadeado do recorte), corpo que rola (`role="log"`,
  `aria-live="polite"`), sugestões em cartões clicáveis (duas colunas quando o contêiner passa de 360 px) e a caixa
  embaixo, um campo de 48 com o enviar laranja de 40.
- `tela`: usa `BarraConversa`, `ConversaVazia`, `ColunaConversa` e a `InputBar`. Lê `?pergunta=` ao abrir.
- `compacto`: sem cabeçalho e sem caixa (a introdução).
- Toda resposta (`RespostaDados`) tem a mesma forma: a frase; um visual num cartão de borda 2; a hipótese, com selo
  anil; o arquivo; "De onde veio", que abre as etapas; o pedido de motivo, em `Opcao`; o selo "Registrado na
  auditoria"; e as ações (Fixar no relatório, Baixar CSV, até 2 ou 3 de seguir).
- Visuais (`VisualDados`): `numeros`, `barras`, `linha`, `tabela`, `pacote`, `empilhada`, `nomes` e `calor`.
- **`semAcento`** e **`casar`**: utilitários de texto.

### 3.9 Gráficos (`duo/graficos.tsx`)

Todos em SVG ou HTML feito à mão, sem biblioteca. Regra declarada: cor por categoria, nunca por julgamento.

| Peça | O que é | Medidas |
|---|---|---|
| `CartaoNumero` | Cartão de leitura de um número, com um visual e o PERGUNTAR no pé | canto 16, borda 2, padding 16; valor em `t-numero-g` |
| `BarrasPequenas` | Barras em linhas ou em colunas; `null` vira "fica de fora" | linhas: trilho de 12 px, rótulo até 168 px; colunas: 96 px de altura, barra de até 28 de largura |
| `LinhaCurta` | Até 3 séries de até 6 pontos | SVG de 80 px, traço de 3; cores azul, turquesa e roxo |
| `TabelaCurta` | Tabela pequena; `null` vira "menos de 5" | linha de 40 px, 15 px |
| `BarraPacote` | A barra turquesa do pacote do mês, com a marca dos 80% e a projeção tracejada | com 80% ou mais, mostra um `Aviso` |
| `BarraEmpilhada` | Partes numa barra, com legenda | 16 px de altura, vão de 2 |
| `PontosSituacao` | A situação de cada escola num ponto | 24 px, borda 2 |
| `Tendencia` | O traço de 8 semanas | 64 × 24, traço de 2,5 |
| `CartaoKPI` | Cartão de número clicável, que troca o gráfico de baixo | **112 px** de altura; rótulo em 13 px / 700; número em `t-numero-g`; ativo com borda `azul` |
| `GraficoSemanas` | Linha por semana; a série anterior tracejada em `apagado`; valor no hover | altura padrão de 180; traços de 3,5 e 2,5 |
| `MapaDeCalor` | Série × disciplina numa escala de azul; "menos de 5" hachurado | célula de 36 px, canto 8 |
| `TabelaBarras` | Tabela com a barra atrás do número | linha de 40 px; barra de 28 com canto 6 |

- `CartaoKPI` clicável é uma `<section role="button" tabIndex={0} aria-pressed>`, que responde a Enter e espaço. O
  PERGUNTAR é um botão com o `AvatarIA` do Analista de 22; a palavra só aparece no hover e no foco.
- `GraficoSemanas`: o valor só aparece com o mouse (`onMouseEnter` e `title`). Não há acesso por teclado nem por toque
  ao valor de um ponto; o leitor de tela tem a lista escondida na legenda.

### 3.10 Painéis de gestão (`duo/gestao.tsx`, 06 e 07/10/2026)

| Peça | O que é |
|---|---|
| `Etiqueta` | "Oficial" (anil) ou "Turmma" (laranja): um `Selo` de 18 px com letra de **11 px** |
| `LinhaDeFonte` | A etiqueta e a fonte curta numa linha, 13 px |
| `Movimento` | "↑ 18 pioraram" (vermelho) ou "↓ 9 melhoraram" (verde); zero em cinza |
| `Delta` | "↑ 18" ou "↓ 9", com "desde ago" opcional; `=` quando zero |
| `CelulaLimiar` | O número da tabela, que só ganha cor (vermelho-claro, com triângulo) quando passa do limiar |
| `BarraDeFaixas` | Barra empilhada de 44 px com canto 10, em tons de anil e o destaque em vermelho; a marca de 80%; legenda em cartões |
| `LadrilhoKPI` | Ladrilho de **128 px**: rótulo de 13 ou 14 px, número em **40 / 44 px**, delta ou prazo, minigráfico. `alerta` põe borda e triângulo vermelhos |
| `Minigrafico` | A linha de 8 meses, 88 × 32, com área em `claro` |
| `CartaoGrafico` | O cartão de um gráfico: título em 15 px / 700, a marca de origem, o "?" |
| `MarcaOrigem` | O ponto de 8 px (anil para oficial, laranja para Turmma) |
| `FonteNaAjuda` | A linha de dentro do "?" |
| `Legenda` | Quadradinho de 10 px e a palavra, 13 px |
| `ColunasMensais` | Pequenos múltiplos de colunas por mês, uma fileira por série |
| `BarrasHorizontais` | Uma barra por linha, empilhável, com a contagem no fim; `compacto` e `empilhado` |
| `NumeroPequeno` | Rótulo de 12 px em caixa alta e valor em 22 / 28 px |
| `CartaoDeAcao` | "Pede ação esta semana": etiqueta, número grande, frase, limiar, prazo e um botão secundário |

Esta camada **contradiz a regra dos gráficos**: usa verde e vermelho para "melhoraram" e "pioraram". O `NumeroGrande`
da 11ª rodada também tem a variação boa ou ruim.

### 3.11 Documento (`duo/documento.tsx`)

Só desenho: nenhuma peça lê dado. O layout está na seção 5.4.

| Peça | O que é |
|---|---|
| `SeloEstadoDocumento` | `espera` (amarelo, "Para aprovar") · `aprovado` (verde, com visto) · `recusado` (vermelho) · `so-voce` (neutro, com cadeado, "Só você vê"); mais "por … · quando" |
| `CabecalhoDocumento` | ‹ voltar · ícone de 40 · título em `t-titulo`, que renomeia no lugar · selo · a linha TIPO · metadados (14 px) · a linha do estado · as ações · as abas |
| `MesaDocumento` | O fundo `mesa` de ponta a ponta, com o sumário e a folha |
| `Folha` | A folha de 760 (560 com `estreita`); 17 px com altura 1,6 (19 com `ampliada`) |
| `CabecalhoFolha` | Escola · disciplina · turma; Nome ____, Data ____, Valor; tempo; instruções |
| `BlocoQuestao` | O número (19 px / 700) numa coluna de 32; enunciado, pergunta e dados; alternativas em linha inteira (mínimo 44, canto 12, borda 2, letra num círculo de 28); com `gabarito`, a certa fica verde; "Por quê" abre a resolução; linhas tracejadas para a discursiva; os metadados em 13 px, caixa alta |
| `Sumario` | Lista, ou grade de bolinhas de 32 (5 por linha), que acende a seção visível e rola até ela |
| `CartoesResumo` | Cartões de canto 12 em `fundo-suave`, em duas colunas |
| `LinhaDoTempo` | As aulas e os momentos num trilho de 2 px com bolinhas de 14; "Pratique" vira cartão na cor da família |
| `BlocoFixo` | Rótulo de 132 px à esquerda e texto à direita |
| `TabelaSequencia` | Tabela por semana, com largura mínima de 560 |
| `TabelaRubrica` | Critério × nível, com o total; abaixo de 640 vira um cartão por critério |
| `GradeSlides` | Miniaturas em 16:9, de 1, 2 ou 3 colunas |
| `SlideAberto` | O slide num diálogo de 960, ou em tela cheia; setas trocam, Esc sai |
| `MapaMental` | O centro numa pílula laranja e os ramos dos dois lados; no celular, uma árvore vertical |
| `FaixaResultados` | Cartões de 104 px, com rótulo, número e apoio |
| `CartaoDocumento` | O cartão do documento na conversa, até 560 px, com "Abrir →" e "Editar o pedido" |

### 3.12 Relatório (`duo/relatorio.tsx`)

- **`montarPdf(doc)`**: escreve um PDF 1.4 à mão, sem dependência. A4 (595 × 842 pt), margens de 56 pt, Helvetica e
  Helvetica-Bold em WinAnsi, com as larguras da fonte para alinhar. Quebra linha e página, desenha tabelas com fio de
  0,5 pt e põe "página n de N". Devolve `Uint8Array`.
- **`baixarPdf`** e **`baixarCsv`**: `Blob` e um link de download. O CSV sai com BOM, `;` e CRLF.
- **`PreviaRelatorio`**: o mesmo conteúdo num `Dialogo` de 720.
- **`CartaoArquivo`**: o arquivo dentro da conversa, com Baixar (vira "Baixado") e Ver antes.

### 3.13 Peças antigas de `turmma/tela.tsx`, ainda usadas

`Tela` e `TelaCheia` (seção 5.5); `Cartao` (com título e ação); `NumeroPainel`; `BarraRotulada` (sobre `ui/progress`,
do Radix); `CabecalhoTela`; `Abas`, a versão presa a `?aba=`, que tira `item`, `aluno`, `prof`, `aviso`, `convidar` e
`ver` ao trocar; `Segmentado`, que corta em 4; `useParametro`, que lê e grava um parâmetro da URL com `replace`;
`useAba`; `Redireciona`; e `NotaMockup`, que não desenha nada.

---

## 4. CASCA

Arquivo: `turmma/Casca.tsx`, sobre `blocks/sidebar.tsx` (a lateral do shadcn), `ui/dropdown-menu`, `ui/tooltip` e
`ui/sheet`. Quatro papéis têm casca: `aluno`, `professor`, `coordenacao` e `rede`. A operação não tem.

### 4.1 Pontos de quebra

| Largura | O que aparece |
|---|---|
| 1024 px ou mais | Lateral aberta, com **256 px** |
| De 768 a 1023 | O trilho de **88 px**, só com os ícones |
| Menos de 768 | Sem lateral: barra do topo de **56 px**, barra de baixo de **68 px** mais a área segura, e a lateral vira gaveta de 288 px |

- A decisão entre lateral e trilho é tomada **uma vez, na montagem** (`window.innerWidth >= 1024`,
  `Casca.tsx:717`). Redimensionar a janela depois não muda.
- "Celular" é `window.innerWidth < 768` (`hooks/use-mobile.ts`).
- A largura muda com `transition-[width]` de 200 ms, linear (`blocks/sidebar.tsx:225` e `235`).
- **Atalho escondido**: Ctrl+B ou Cmd+B recolhe e abre a lateral (`blocks/sidebar.tsx:25` e `101`). Vale para todos
  os papéis, **inclusive o aluno**, que não tem o botão de recolher.
- O bloco grava um cookie `sidebar_state`, com 7 dias, que ninguém lê.

### 4.2 A lateral

Fundo `white`, borda direita de 2 px `borda`. Três partes.

**Cabeça** (padding lateral de 12)

- Uma linha de **88 px**: o logotipo (`Marca` a 24 px, link para `/<papel>`, `aria-label="Turmma, início"`); o lápis,
  só no professor; e o botão de recolher, fora do celular e fora do aluno.
- No trilho: só a pinta, de 36 px, laranja, em coluna.
- O lápis: `BotaoIcone` de 40 com `SquarePen`, "Nova conversa". No Início do professor ele fica **invisível, mas
  guarda o lugar** (`invisible`, `aria-hidden`, `tabIndex={-1}`).
- O recolher: `BotaoIcone` de 40 com `PanelLeft`, "Recolher a lateral" ou "Abrir a lateral".
- Abaixo, a 12 px: o seletor de escola ou de rede (4.6). Some no trilho.

**Miolo** (padding 12 dos lados, 12 em cima, 8 embaixo)

- `<nav aria-label="Lugares">`, com os lugares a 8 px um do outro.
- Cada lugar (`ItemLugar`, `Casca.tsx:164-203`): um `Link` de **52 px**, canto 12, borda 2, padding 8 × 4, vão 16.
  O ícone ilustrado de 32 numa caixa de 36. O rótulo em `t-rotulo` (15 px, 700, caixa alta); **no aluno, 14 px**.
- Aceso: borda `azul-borda`, fundo `azul-claro`, texto `azul-texto`, `aria-current="page"`. Apagado: borda
  transparente, texto `sutil`; no hover, `fundo-suave` e `tinta`.
- No trilho: 56 px de largura, centrado, só o ícone, com a dica à direita (do Radix, sem atraso).
- No celular a gaveta **não traz os lugares**: eles moram na barra de baixo.

| Papel | Lugares, na ordem (ícone) |
|---|---|
| Aluno | Início (`inicio`) · Tarefas (`tarefas`) · Eu (`eu`) · Avisar um adulto (`avisar`; "Avisar" na barra de baixo) |
| Professor | Início (`inicio`) · Turmas (`turmas`) · Ferramentas (`mais`, os 4 quadradinhos) · Criados (`criados`) |
| Coordenação | Painel (`painel`) · Analista (o `AvatarIA` do Analista) · Escola (`escola`) · Registros (`registros`) |
| Rede | Painel (`painel`) · Analista (o `AvatarIA`) · Escolas (`escola`) |

Qual lugar acende (`LUGARES`, `Casca.tsx:96-124`): numa conversa do aluno, acende a conversa, não o Início. No
professor, o Início acende também em `/professor/conversa/nova` e em Criados ou Aprovar abertos com `?de=inicio`;
Criados não acende com `?de=inicio` nem com `?de=conversa`.

**Os números na lateral.** Só o aluno tem:

- Tarefas: o `Contador` **azul** com o que está Para fazer.
- Avisar: o `Contador` **amarelo**, só com resposta não lida.
- Eu: um **ponto azul** de 12 px, sem número.
- No aluno eles ficam no canto do ícone (contador de 20 px, letra de 12, com um anel `white` de 2). No trilho, viram
  um ponto de 10 px.
- Professor e coordenação não têm número na lateral: o único número laranja é o do sino.

**Abaixo dos lugares**, só no professor e no aluno (some no trilho): 12 px, um fio de 2 px, e as conversas.

- O botão "Nova conversa": 40 px, canto 12, 15 px / 700, com `SquarePen` de 18. **[diverge]** O LEIAME diz que o aluno
  não tem lápis. O lápis do topo, de fato, não existe; este botão existe para os dois.
- Grupos por data, com título de 28 px em 13 px / 700, `sutil`: Hoje · Ontem · Últimos 7 dias · Mais antigas (o
  aluno não tem "Mais antigas").
- Cada conversa: 40 px, canto 12, padding lateral 12, 15 px / 500, uma linha. Acesa: `azul-claro` com `azul-texto`,
  sem borda.
- O ⋯ de cada conversa: botão de 32 com canto 10, que aparece no hover, no foco e com o menu aberto; no toque, sempre.
  Abre Renomear e Apagar. Renomear troca a linha por um campo de 40 com borda `azul-borda`. **Apagar é imediato, sem
  confirmação.**
- Professor: até 5, e "Ver todas" ou "Ver menos". Aluno: até 5.

**Pé** (fio de cima de 2 px, padding 8 × 12)

- Aluno: o cartão do nome é um **link** para Eu (`/aluno/eu`), sem menu. 56 px, com a bolinha de iniciais de 40
  (laranja, 15 px / 700), o nome em 15 px / 700 e "turma · escola" em 14 px, `sutil`.
- Os outros: o mesmo cartão, com `Ellipsis` de 20, abre o menu da pessoa (4.7).

### 4.3 As barras do celular

**Barra do topo** (`BarraTopoCelular`, `Casca.tsx:644-663`): presa no alto, **56 px**, borda de baixo de 2, fundo
`white`, padding de 16 à esquerda e 6 à direita, vão de 8.

| Papel | Da esquerda para a direita |
|---|---|
| Aluno | pinta de 28 · a turma (16 px / 700) · botão "Abrir as conversas" (44, `MessageSquareText`) |
| Professor | pinta · a escola ativa · **o sino** (44) · "Abrir as conversas" · o lápis (44) |
| Coordenação | pinta · a escola · **o sino** · "Abrir o menu" (44, `Ellipsis`) |
| Rede | pinta · o nome da rede, que é um menu de troca · "Abrir o menu" |

**Barra de baixo** (`BarraBaixo`, `Casca.tsx:666-697`): fixa, fundo `white`, borda de cima de 2, padding lateral de 4
e a área segura embaixo. Uma coluna por lugar (3 ou 4).

- Cada lugar: um `Link` de **68 px**, em coluna, com vão de 4.
- O ícone de 28 numa pílula de 48 × 36, canto 12, borda 2 (acesa: `azul-borda` e `azul-claro`).
- O rótulo: **12 px**, 700, caixa alta, `.04em` (aceso `azul-texto`, apagado `sutil`). Usa o nome curto ("Avisar").
- `aria-current="page"`. Os contadores do aluno ficam no canto da pílula.

A área de conteúdo desconta as duas barras: `pb-[var(--barra-baixo)]` no `SidebarInset`, e a `altura-tela` nas telas.

### 4.4 O sino (`turmma/sino.tsx`)

Só no professor e na coordenação. A casca leva `data-sino`.

- **Onde**: no canto de cima à direita da área de conteúdo, `absolute right-4 top-3 z-20` (a 16 px da direita e 12 do
  topo). No celular, dentro da barra do topo.
- **O botão**: `BotaoIcone` fantasma de 40 (44 no celular), com `Bell`, em `tinta`. `aria-expanded`,
  `aria-haspopup="dialog"`, e o rótulo "Esperando você, N" ou "Esperando você, nada".
- **O contador**: laranja, de 20 px, letra de 12, com anel de 2 px na cor do fundo, no canto do sino. **Sem item, sem
  número.** É o único número laranja da casca.
- **O número** é o tamanho da fila (`useCartoesDaFila`): os pedidos de turmas diferentes contam como um cartão.
- **A reserva**: a partir de 768, `--reserva-sino` vale 56 px, e os cabeçalhos guardam esse espaço à direita.

**A lista, no computador**: um popover do Radix, ancorado no sino.

- 400 px de largura. Altura até `min(720px, a altura livre)`, rolando por dentro. Canto 16, borda 2, degrau sólido de
  4, `z-40`. Alinhado ao fim, 8 px abaixo, margem de colisão de 16. `role="dialog"`.
- Cabeçalho de 56 com fio de baixo: "Esperando você" em `t-cartao`, o contador e o X.
- Filtro por turma, só quando há itens de 2 turmas ou mais: `Toque` "Todas" e um por turma.
- Grupos, na ordem: **Urgente** (urgente ou com prazo) → **por turma**, "2ºB · Química", na ordem das turmas do
  professor (na coordenação, na da escola) → **De várias turmas** → **Da escola**. Título do grupo em `t-selo`, 32 px.
- Linha (`LinhaSino`): botão de **56 px**, canto 12, padding lateral 12. Ladrilho de 32 com ícone de 24, título curto
  em `t-cartao`, e no urgente uma segunda linha de 14 px ("turma · quando"). No fim: o contador na cor do tipo, ou um
  selo vermelho com o prazo ou "Urgente".
- Vazio: a onça dormindo, de 72, e "Tudo em dia".

**No celular**: o `PainelLado` em altura cheia, com o título "Esperando você (N)".

**Foco**: ao abrir, vai para a caixa, não para o X. Esc, o X e o clique fora devolvem o foco ao sino. Abrir um item
**não** devolve.

**Parâmetros de URL**, sempre com `replace`:

| Parâmetro | Efeito |
|---|---|
| `?sino=1` | Abre a lista |
| `?sino=<turmaId>` | Abre já filtrada na turma |
| `?item=<id>` | Abre o painel do item por cima de qualquer tela |
| `?contestar=1` | Junto de `?item=`, abre o item no modo de contestar |

Abrir um item: o que tem rota navega; o que não tem põe `?item=` no endereço atual (`useAbrirItemDoSino`). O painel
do item é desenhado pela casca (`PainelDoItem`, `Casca.tsx:706-713`): no professor, `PainelDaFila`; na coordenação,
`PainelDoItemCoordenacao`. Fechar tira `item` e `contestar`.

**A fila em cartões** (`turmma/fila.tsx`, `ListaFila` e `LinhaFila`): o desenho antigo, de quando a fila ficava no
Início. Cartão clicável de 72 (68 mais 4), com ladrilho de 44 e ícone de 32, título curto, selo da turma, contador e
prazo. Mostra até `max` (padrão 5) e "Ver tudo (N)", que abre no mesmo lugar. Vazio: a onça dormindo de 96. Ainda é
usado na aba Hoje da turma e na prancha.

### 4.5 Sem casca

**Telas de foco** (`App.tsx:84-90`), declaradas antes das cascas para ganhar delas:

- `/aluno/prova/:id`, a prova;
- `/aluno/bem-vindo`, `/professor/bem-vindo`, `/coordenacao/bem-vindo`, `/rede/bem-vindo` e `/operacao/bem-vindo`, as
  introduções;
- `/professor/turmas/:turma/aula`, a aula ao vivo.

Fora da casca, `--barra-topo`, `--barra-baixo` e `--reserva-sino` valem 0, e **o tamanho do texto não se aplica**
(seção 2.5).

**Operação** (`/operacao`, `areas/operacao/Operacao.tsx:83-110`): uma tela só, com a `BarraApp`.

- `BarraApp` (`duo/cabecalho.tsx:41-61`): **72 px** a partir de 768 e **56 px** no celular; fundo `white`, borda de
  baixo de 2; padding lateral de 24 (16 no celular).
- À esquerda: o logotipo a 24 px (no celular, só a pinta de 28). Uma linha vertical de 2 × 32 px. O contexto: "Equipe
  Turmma", em 17 px / 700.
- À direita: um botão redondo de 40 com "OT" (borda `anil-borda`, fundo `anil-claro`, texto `anil-texto`), que abre
  Rever a introdução e Sair.
- O corpo: a moldura de 1200, com margem de 16 ou 32, e um `CabecalhoPagina` "Operação", com a linha "A operação não
  vê dado de aluno nem de professor" e as abas Escolas e Uso.

**Rede**: tem a casca (4.2), sem sino e sem tamanho de texto.

**Públicas**: `/entrar`, `/entrar/verificacao`, `/e/:escola…`, `/convite` e `/familia`. Não li essas telas.

### 4.6 O seletor de escola e o de rede

| Papel | O que aparece |
|---|---|
| Aluno | Nada |
| Professor com uma escola | Nada |
| Professor com duas ou mais | O seletor clicável |
| Coordenação | O mesmo cartão, só de leitura, sem menu |
| Rede | O seletor de rede |

- **O cartão**: degrau de 4 (afunda 2), face de 48, canto 16, borda 2, padding lateral 8, vão 10. A sigla num ladrilho
  de 32 com canto 10 (fundo `azul`, texto `sobre-cor`, 14 px / 700), o nome em 15 px / 700 e `ChevronsUpDown` de 18.
- **O menu** (do Radix): 276 px (288 a partir de 768), título "Suas escolas" em `t-selo`. Cada escola: 56 px, canto
  12, borda 2 (a ativa em `azul-claro` com `azul-borda`), a sigla (apagada nas outras), o nome em 15 px / 700, "turno
  · N turmas" em 14 px, e um visto de 20 na ativa.
- Trocar chama `definirEscolaAtiva(id)`.
- **Rede**: a sigla é "JOI" em anil ou "SC" em verde, 13 px / 700. O menu tem 300 px, o título "Ver a rede", e cada
  item traz "etapas · diário <sistema>".

### 4.7 O menu da pessoa

Abre para cima, alinhado ao início, com 252 px. Título com o nome, em 14 px / 700, `sutil`. Itens de 44, canto 10,
15 px / 500, glifo de 18.

| Papel | Itens, na ordem |
|---|---|
| Professor | Configurações · Como a IA funciona · Rever a introdução · Ajuda · Sair |
| Coordenação | Configurações da escola (vai a `/coordenacao/configuracoes`) · Minha conta · Rever a introdução · Ajuda · Sair |
| Rede | Configurações · Como protegemos os dados (`/rede?protecao=1`) · Rever a introdução · Ajuda · Sair |
| Aluno | Não tem menu |

- **Sair** é um clique, sem confirmação, e leva a `/entrar`.
- **Ajuda** abre o diálogo "Falar com a Turmma", de 440: o e-mail `ajuda@turmma.com.br`, um link de WhatsApp
  (`wa.me`) e "Dias úteis, das 8h às 18h."
- **Rever a introdução** vai a `/<papel>/bem-vindo?rever=1`.

### 4.8 As Configurações (`turmma/Configuracoes.tsx`)

Abrem pelo menu ou por `?config=<seção>`. Os ids: `geral`, `notificacoes`, `assistente`, `tutor`, `perfil`,
`privacidade`, `seguranca` e `ia`. Uma seção que o papel não tem cai na primeira.

- **Professor e coordenação**: um `Dialogo` de **920** de largura e `min(700px, 100svh - 32px)` de altura. À esquerda,
  o índice de 248 px, em `Linha`, preso no topo (a ativa em `azul-claro`); à direita, a seção, com o título em
  `t-secao`. Vão de 32. No celular: o índice primeiro, com chevron, e a seção depois, com ‹ para voltar.
- **Aluno e rede**: um `Dialogo` de 480, sem índice.
- **Cada ajuste**: uma linha de no mínimo 64, com fio de cima de 2, o nome em 17 / 22 px, 700, à esquerda e o controle
  à direita. Os grupos têm título em `t-selo`.

| Papel | Título | Seções |
|---|---|---|
| Professor | Configurações | Geral (Aparência, Tamanho do texto, Escola ao abrir) · Assistente (Questões por prova, Alternativas, Sempre com gabarito, Preparar a semana por turma) · Perfil e vínculos · Privacidade e dados (o Meu uso) · Segurança (senha, duas etapas, aparelhos) · Como a IA funciona |
| Coordenação | Minha conta | Geral (Aparência, Tamanho do texto) · Notificações (Resumo de segunda, Alerta do Analista) · Perfil · Segurança |
| Aluno | Ajustes | Aparência · Tamanho do texto · Trocar a senha (8 ou mais) |
| Rede | Configurações | Só a Aparência |

---

## 5. TIPOS DE PÁGINA

Arquivo: `duo/pagina.tsx`. Quatro tipos, quatro larguras, um cabeçalho.

```ts
export const LARGURA = { conversa: 768, leitura: 880, painel: 1200, documento: 1080, folha: 760 } as const
```

Regras comuns:

- **A moldura**: toda página fica numa caixa de **1200 px** centrada, e a coluna do tipo começa na **borda esquerda**
  dela. O título não pula ao trocar de lugar na lateral. Segundo o LEIAME, a 1440 de janela o título fica sempre em
  x = 288 (256 da lateral mais 32 de margem). **[incerto]** Não medi.
- **A margem**: 16 px no celular, 32 a partir de 768.
- **A página não rola**: ocupa a `altura-tela`, e quem rola é o corpo.
- **O canto do sino**: só o painel, que chega à borda, guarda os 56 px. Leitura e documento zeram a reserva.

### 5.1 `Pagina`

Props: `tipo` (`leitura`, `painel` ou `documento`), `cabecalho`, `rodape`, `rolagem` (`corpo`, o padrão, ou
`nenhuma`).

- Raiz: `data-pagina={tipo}`, `altura-tela`, em coluna.
- Cabeçalho: 24 px do topo, na coluna do tipo.
- Corpo: 16 px abaixo do cabeçalho, 32 no fim. Com `rolagem="corpo"`, rola por dentro. Com `nenhuma`, a tela cuida da
  própria rolagem.
- Rodapé: preso embaixo, com fio de cima de 2, padding vertical de 12, as ações à direita.
- No celular: **a página inteira rola**, com o cabeçalho junto, e o rodapé fica grudado embaixo.

### 5.2 `CabecalhoPagina`

Props: `titulo`, `voltar` (`{ para, rotulo }` ou uma função), `sobrelinha`, `complemento`, `selo`, `linha`, `acoes`,
`menu`, `abas`.

- **Sem voltar**: uma linha de no mínimo **64 px**, que guarda a reserva do sino.
- **Com voltar**: uma linha de 28 px com o link, e abaixo a do título, de no mínimo 48. A reserva do sino fica só na
  linha do voltar.
- **O voltar** (`CLASSE_VOLTAR`, e também o `LinkVoltar`): 28 px de altura, 13 px / 700, caixa alta, `.04em`,
  `sutil`, com `ChevronLeft` de 16 (traço 3), canto 8. Fica **dentro da coluna**, na linha de cima.
  **[diverge]** O LEIAME diz "‹ voltar fora da coluna".
- **O título**: `<h1>` em `t-titulo`. Na mesma linha, o complemento em `t-apoio` e o selo.
- **À direita**: as ações (no máximo uma cheia) e o ⋯.
- **A linha de apoio**: `t-apoio`, embaixo.
- **As abas** (`AbasDaPagina`): **44 px**, vão de 24, o número entre parênteses, o fio de 2 px até a borda da coluna e
  o `fim` à direita.

### 5.3 Conversa

**`BarraConversa`** — props: `titulo`, `selo`, `inicio`, `acoes`. Altura de **56 px no celular e 64 a partir de
768**. O miolo se alinha à coluna de 768. Título em `t-cartao`. Guarda a reserva do sino.
**[diverge]** O LEIAME e o comentário do topo do arquivo dizem "barra de 56".

**`ConversaVazia`** — props: `barra`, `topo` (a saudação), `caixa`, `baixo` (as sugestões e o aviso).

- Grade de três linhas, `2fr auto 3fr`: o grupo fica a **40% da altura**, um pouco acima do meio.
  **[diverge]** O LEIAME diz "a 1/3 (`1fr auto 2fr`)".
- O grupo: coluna de 768, vão de 24, na ordem saudação, caixa, sugestões.
- No celular: a caixa **já nasce presa embaixo**, e as sugestões sobem para logo acima dela. A saudação fica no meio
  do espaço livre.

**`ColunaConversa`** — props: `barra`, `caixa`, `acimaDaCaixa`, `rolo`, `fim`.

- As mensagens começam a 24 px do topo, numa coluna de 768, com vão de 24, e rolam por dentro.
- A caixa fica presa embaixo, com 20 px de padding (`pb-5`). **[diverge]** O LEIAME diz 24.
- Sobre a última linha, um esfumado de 24 px, do transparente ao `fundo`.
- Segue o fim enquanto a resposta chega, se quem lê está a menos de 72 px do fim. Passando de 160 px, aparece o botão
  ↓ "Ir para o fim da conversa". Quando `fim` muda, volta ao fim.

### 5.4 Documento

- **O cabeçalho** (`CabecalhoDocumento`) fica na coluna de 1080.
- **A mesa** (`MesaDocumento`): fundo `mesa` de ponta a ponta, a partir de 640 (abaixo, `white`); rola por dentro.
  A caixa interna tem até 1080 com sumário e 1240 sem; margem de 16 ou 32; 24 px em cima e 64 embaixo; vão de 32.
- **O sumário**: 200 px, preso no topo, **só com a janela a partir de 1200 px**. A partir de 1440 entra um contrapeso
  de 200 px à direita, para a folha ficar no centro.
- **A folha** (`Folha`): até **760 px** (560 com `estreita`). A partir de 640: canto 16, borda 2 e 40 px de padding.
  Abaixo: sem borda e sem mesa.
- Com `tipo="documento"`, a `Pagina` não envolve o corpo em coluna: o corpo é a mesa.

### 5.5 Painel

- **`GradePainel`**: 12 colunas, vão de 16. Os filhos dizem quantas ocupam (`col-span-12 lg:col-span-8`).
- **`CartaoPainel`**: props `titulo`, `acao`, `perguntar`. Canto 16, borda 2, padding 16 (20 a partir de 1024).
  Título em `t-cartao`; no canto, a ação e o PERGUNTAR, um botão fantasma pequeno.
- **`Secao`**: props `titulo`, `n`, `apoio`, `acao`. Fora de cartão: título em `t-secao` com o número entre
  parênteses, 12 px até o bloco.

### 5.6 `Tela` e `TelaCheia` (`turmma/tela.tsx`)

As molduras antigas, ajustadas à nova, para as telas que ainda não migraram.

- **`Tela`**: props `titulo`, `descricao`, `acoes`, `largura` (`conversa`, `media` ou `tabela`), `objeto` (ignorado
  desde a 14ª rodada). Margem de 16 ou 32, topo de 16 ou 24, fim de 32. Cabeçalho de no mínimo 64, com o título em
  `t-titulo`. **A página rola como documento**: não usa a `altura-tela`.
- Larguras: `conversa` é **760**, `media` é 1040 e `tabela` é a moldura inteira, de 1200.
  **[diverge]** A conversa do `Pagina` tem 768.
- **`TelaCheia`**: ocupa a `altura-tela` e rola por dentro, com o título numa linha de 48.
- **`CabecalhoTela`**: mínimo 64, com "‹ rótulo" de 40 px em 15 px / 700 (no celular, só o chevron), o título, um
  encaixe para trocar, uma ação e o ⋯.

---

## 6. ONÇA E ÍCONES

### 6.1 A onça inteira (`duo/onca/Onca.tsx`)

Props: `pose` (padrão `acenando`), `tamanho` (padrão 120), `animada` (padrão verdadeiro), `espelhada`, `rotulo` (com
ele, `role="img"`; sem, `aria-hidden`), `className`, `acordar`.

- Um SVG com `viewBox="0 0 240 240"`. Três formas só: retângulo arredondado, círculo e triângulo arredondado. Sem
  contorno e sem degradê.
- O corpo (`CORPO_D`, `geometria.ts:4`) nunca é redesenhado: cada pose **gira grupos** e troca só os olhos e a boca.
- Abaixo de 72 px (`pequena`): 3 rosetas em vez de 5, e a cauda perde os anéis.
- Nunca agressiva: sem dente, sem garra, sem sobrancelha franzida.

| Pose | Olhos | Boca | O que mexe | Extra |
|---|---|---|---|---|
| `acenando` | de frente | aberta, com língua | o corpo inclina −4°; a pata direita sobe a −150°, com o punho | dois traços de movimento |
| `comemorando` | fechados em arco, felizes | muito aberta | o corpo sobe 10 e estica 6%; as duas patas para cima; a sombra do chão encolhe para 80% | — |
| `pensando` | para cima, com a pálpebra baixa | de lado | o rosto gira 8°; a pata direita vai a 116°, com a mão creme | um balão com 3 pontos |
| `apontando` | de lado | sorriso | o rosto desloca 9; o braço direito estica (26 × 64) a −90°, com o punho; o lado de trás em sombra | — |
| `acolhendo` | maiores, com a pálpebra "preocupada" (o canto de dentro sobe) | leve | o corpo desce 9 e achata 4%; o rosto gira −5°; as patas abrem a ±68° | — |
| `dormindo` | fechados em arco, para baixo | fechada | outro desenho: o corpo vira uma pílula de 180 × 96, com a cabeça a 66% apoiada nas patas | um "z" parado |

Tamanhos usados nas telas (contagem): 96 (13) · 72 (7) · 120 (2) · 112 (2) · 56 (2) · 160, 104 e 48 (1 cada).
Poses usadas: dormindo 13 · apontando 6 · comemorando 4 · acenando 3 · pensando 2 · acolhendo 1.

**As animações** (`onca/onca.css`): só `transform` e `opacity`.

| Nome | Duração | O que faz | Quando |
|---|---|---|---|
| `onca-entrar` | 240 ms, `ease-out` | opacidade 0 → 1, sobe 8 px | Uma vez, ao montar, com `animada` |
| `onca-piscar` | 120 ms | os olhos em `scaleY(.1)` | Por JavaScript: ao acaso a cada 3 a 6 s, **no máximo 4 vezes**; a classe fica 160 ms. Recomeça com o ponteiro em cima, com o foco, com a troca de pose e com a prop `acordar`. Não pisca dormindo nem comemorando |
| `onca-acenar` | 800 ms, atraso de 240 | a pata gira 25° duas vezes | **Uma vez por sessão do navegador** (`sessionStorage['turmma-onca-acenou']`) |
| `onca-comemorar` | 500 ms | encolhe, salta −12 px e cai com quique | Uma vez, na pose `comemorando` |
| `onca-ponto` | 1,2 s, **em laço** | os 3 pontos, opacidade .35 → 1, com atrasos de 0, .2 e .4 s | Só enquanto a pose é `pensando` |

Os grupos que animam usam `transform-box: fill-box`. Os que giram por atributo, não.

**O peso**, contado à mão no código: **[incerto]**, é uma estimativa.

- Onça inteira, sentada: cerca de **75 elementos SVG** (de 70 a 80, conforme a pose).
- `AvatarIA`: cerca de **40 elementos** (mais 6 com "pensando").
- Cada onça, cada cabeça e cada avatar carrega no próprio `<defs>` o `PINTA_PATH` inteiro, **2,7 KB de texto**, e de
  3 a 5 `clipPath` com `id` de `useId`.
- O `AvatarIA` abaixo de 40 px **define o caminho da pinta e não o usa** (`CabecaOnca.tsx:35` e `41`).

### 6.2 A cabeça e o avatar

**`CabecaOnca`** — props: `tamanho` (padrão 48), `expressao`, `rotulo`. O recorte `viewBox="44 32 152 152"`. Abaixo de
32 px a roseta da testa sai.

| Expressão | Olhos | Boca |
|---|---|---|
| `frente` | de frente | o "w" pequeno |
| `pensando` | para cima | de lado |
| `feliz` | em arco | aberta |

Só 2 usos nas telas, fora da bancada.

**`AvatarIA`** — props: `agente` (`tutor`, `assistente` ou `analista`), `tamanho` (padrão 32), `pensando`.

- Um círculo `white` com anel de **2 px na cor do agente**, e a cabeça da onça dentro.
- **Tutor: laranja (`#E8732E`). Assistente: azul (`#1C9BEF`). Analista: anil (`#6A85F7`).**
- A cabeça fica 4 px para dentro (3 abaixo de 32) e desce 6% do lado. As rosetas só entram a partir de 40.
- `pensando`: a expressão muda, e entra uma pílula no canto de baixo à direita (56% × 32% do lado), com os 3 pontos
  em laço na cor `texto` do agente.
- `aria-hidden` sempre: **o nome da função vai ao lado**, por conta de quem usa.
- Tamanhos usados: 32 (11) · 24 (4) · 40 (3) · 48, 44, 28 e 22 (1 cada).
- `AvatarAgente` (`turmma/ia.tsx:18-21`) converte os ids antigos: `tutor` e `analista` ficam; corretor, adaptador,
  planejador e assistente viram `assistente`.

### 6.3 Os ícones ilustrados (`duo/icones/`)

`Icone` — props: `id`, `tamanho` (padrão 32), `familia` (troca a cor dominante), `rotulo`.

- SVG com `viewBox="0 0 48 48"`. Chapado, de 2 a 3 cores, sem contorno, sem degradê e sem sombra. De 3 a 10 formas
  cada um. O visto, o "+" e o "×" são traços grossos de ponta redonda.
- Tamanhos usados: 24, 28, 32, 40 e 48.
- São **48 ícones**, em seis grupos. A família padrão está entre parênteses.

**Lugares (12)**: `inicio` (laranja, a casa) · `tarefas` (azul, a prancheta com visto) · `eu` (verde, a carteirinha) ·
`avisar` (roxo, a mão erguida com um balãozinho) · `turmas` (turquesa, três pessoas) · `agenda` (vermelho, o
calendário) · `criados` (amarelo, a pasta com duas folhas) · `escola` (azul, o prédio com bandeirinha) · `ia` (anil, o
escudo com visto) · `registros` (amarelo, a gaveta de arquivo) · `rede` (anil, o prédio de três colunas) · `painel`
(anil, o cartão com três barras).

**Fila (13)**: `atencao` (roxo, o coração no balão) · `notas` (amarelo, a folha com visto) · `sinal` (azul, a lâmpada)
· `pedidos` (verde, a pessoa com +) · `adaptada` (amarelo, a folha com dois controles) · `turma` (turquesa, a lousa
com visto) · `aviso` (vermelho, a bandeira) · `contestacao` (amarelo, a pessoa com ×) · `alerta` (anil, as barras com
seta) · `material-falhou` (vermelho, o livro com ×) · `convite` (amarelo, o envelope com relógio) · `dossie` (anil, a
pasta com escudo) · `titular` (anil, a pasta com cadeado).

**Tarefas (3)**: `prova` (a folha com relógio) · `lista` (a folha com lápis) · `leitura` (o livro aberto). Azul por
padrão; pintam com a cor da matéria.

**Matérias (13)**: `matematica` (azul, a régua com +) · `portugues` (roxo, o livro com "Aa") · `ciencias` (verde, o
broto) · `biologia` (verde, a célula) · `quimica` (turquesa, o erlenmeyer) · `fisica` (anil, o ímã) · `historia`
(amarelo, a ampulheta) · `geografia` (lima, o globo) · `ingles` (vermelho, o balão com "Hi") · `arte` (rosa, a paleta)
· `educacao-fisica` (rosa, a bola) · `filosofia` (amarelo, o balão de pensamento) · `sociologia` (lima, três pessoas
ligadas).

**Métricas (6)**: `alunos` (verde, a mochila) · `tutor` (laranja, o balão com "?") · `aprovado` (verde, o escudo com
visto) · `acerto` (vermelho, o alvo) · `pacote` (turquesa, o medidor) · `corrigidas` (amarelo, a pilha de folhas com
visto).

**Ações (1)**: `mais` (quatro quadradinhos: laranja, azul, verde e roxo). É o ícone de "Ferramentas" na lateral do
professor.

Observações:

- `ia` e `aprovado` são **o mesmo desenho**. `agenda` não tem lugar na navegação da 14ª rodada. O lugar "Analista"
  declara o ícone `painel`, mas mostra o avatar.
- Três ícones têm texto dentro do SVG ("Aa", "Hi" e "?"), em peso 800, na fonte do sistema.

### 6.4 A bancada (`/fundamentos/onca`, `areas/entrada/BancadaOnca.tsx`)

Mostra: as 6 poses em três palcos (`fundo`, `azul-claro` e `verde-claro`), cada uma a 120, 72 e 48 px; a cabeça nas 3
expressões, a 64, 48, 32 e 24; o avatar dos 3 agentes, a 48, 32 e 24, e um "pensando"; a grade dos 48 ícones, a 48,
32 e 24, com o id e a família; e o botão "Repetir animação".

**Defeito da bancada**: o código testa `p.nome === 'branco'` (linha 56), mas os palcos se chamam `fundo`,
`azul-claro` e `verde-claro`. Resultado: nenhuma onça aparece a 200 px e nenhuma anima ali.

---

## 7. RISCOS PARA O PRODUTO

### 7.0 O ponto de partida do produto

Lido em `apps/web`. O `package.json`, o `vite.config.ts` e o `estilos.css` foram conferidos no andar
`.andares-avulsos/educaia--spec-pele-e-casca`; o `estilos.test.ts` e o `rebaixar-cor.ts`, só no checkout da `develop`.

- O produto já usa Tailwind 4.3.3, Vite 8.3.0, React 19.3.0 e lucide-react 1.48.0. O `build.target` é `chrome99`,
  `edge99`, `firefox97` e `safari15.4` (`apps/web/vite.config.ts:17`).
- O produto **não tem**: Radix, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` nem
  `react-router-dom` (usa `wouter` 3.11.0). Diálogo, menu e abas são feitos à mão, com testes de teclado próprios.
- `apps/web/src/estilos.css` é a pele da D72: 33 cores (contando `white` e `black`), `:focus-visible` de 2 px em
  `noite`, `--radius-caixa` de 28 e sombras com desfoque. O comentário do topo diz "nenhuma animação que custe quadro".
- `apps/web/src/estilos.test.ts` exige que o CSS declare **exatamente** as cores da 9.9 e reprova o modificador de
  opacidade. O `rebaixar-cor.ts` para o build quando sobra `color-mix(` ou `oklch(` no CSS.
- A Fustat não é baixada no produto: o logotipo vem em curvas.

**A pele nova revê a D72** (uma pele só, a do ChatGPT, em branco, preto e laranja) e esse teste de paleta. Precisa de
decisão registrada antes da Tech Spec.

### 7.1 CSS que não existe no Chrome 109

| Recurso | Onde | Existe desde | O que acontece no 109 |
|---|---|---|---|
| `color-mix()` em **estilo inline** | `duo/graficos.tsx:495` (as células do `MapaDeCalor`) | Chrome 111 | A célula fica **sem fundo**. E escapa das duas guardas do produto, que olham o CSS e as classes, não o JS |
| Modificador de opacidade do Tailwind | `duo/graficos.tsx:337` (`bg-azul-claro/40`) · `duo/gestao.tsx:193` (`bg-fundo-suave/70`) · `duo/gestao.tsx:327` (`bg-azul-claro/40`) · `ui/input-bar.tsx:186` (`bg-neutral-900/70`) · `blocks/sidebar.tsx:440` (`text-sidebar-foreground/70`) | vira `color-mix()` | A guarda do produto já reprova. Trocar por token ou por `rgba()` literal |
| `scrollbar-width: none` | `duo/pagina.tsx:145` · `duo/chat-dados.tsx:278` e `363` | Chrome 121 | A barra de rolagem horizontal aparece sob as abas e sob as sugestões quando elas passam da largura |
| `text-wrap: balance` e `pretty` | `index.css:266-267` | Chrome 114 e 117 | Ignorado, sem quebrar. Mas os títulos quebram em outro ponto, e a tela não fica igual à foto |

**Funcionam no 109**, mas vale saber:

| Recurso | Onde | Observação |
|---|---|---|
| `:has()` | `duo/opcao.tsx:28` (o anel de foco da `Opcao`) · `turmma/Casca.tsx:236` e `279` · `blocks/sidebar.tsx:142` e `513` | Chrome 105. **Não existe no Firefox antes do 121**, e o alvo do build cita `firefox97`: lá, a `Opcao` fica sem foco visível |
| `@container` e `@min-[360px]` | `duo/chat-dados.tsx:398` e `423` | Chrome 105; Firefox 110; Safari 16 |
| `svh` | `index.css:225-233` e mais 14 pontos | Chrome 108. Não existe entre o 99 e o 107, que o alvo do build cita |
| `dvh` | `areas/entrada/BancadaOnca.tsx:33` | Chrome 108 |
| `zoom` (CSS) | `dados/preferencias.ts:89` | Não é padrão. Funciona no Chrome; no Firefox, só a partir do 126 |
| Transição de `grid-template-rows` | `ui/input-bar.tsx:323` | Chrome 107 |
| `translate`, `rotate` e `scale` como propriedades | o que o Tailwind 4 gera | Chrome 104 |

**Não achei** nos arquivos lidos: `oklch()`, aninhamento nativo, `@starting-style`, o atributo `popover`, View
Transitions, `subgrid`, posicionamento por âncora, `@scope`.

**JavaScript**: nada além do ES2022 nos arquivos lidos (procurei `toSorted`, `toReversed`, `with`, `groupBy`,
`structuredClone`, `findLast`, `at`). Usa `ResizeObserver`, `useId`, `useSyncExternalStore` e `navigator.clipboard`,
este último só em contexto seguro.

**O `<script>` inline do tema** (`index.html:12-30`): **[incerto]** se o produto servir uma política de segurança de
conteúdo sem `unsafe-inline`, ele não roda e a tela pisca no tema errado. Não conferi a política do produto.

### 7.2 O que custa processador num Chromebook fraco

| O quê | Onde | Por quê |
|---|---|---|
| A lateral anima a **largura** | `blocks/sidebar.tsx:225` e `235` | 200 ms de recálculo de layout da página inteira a cada recolher |
| O texto chegando aos poucos | `duo/chat.tsx:157-180` | Um intervalo de 30 ms que recorta e redesenha a resposta inteira, mais o `ResizeObserver` rolando a conversa (`pagina.tsx:276`) |
| `filter: brightness(1.06)` no hover | `index.css:310` | Repinta a face. Contraria o "só transform e opacity" do próprio arquivo |
| Um avatar por resposta | `duo/onca/AvatarIA.tsx` | Cerca de 40 elementos e 2,7 KB de caminho por avatar. Uma conversa de 30 respostas soma perto de 1.200 nós só de avatar |
| A onça pisca por temporizador | `duo/onca/Onca.tsx:138-157` | Um par de `setTimeout` e dois `setState` por onça animada |
| Laços infinitos | `onca.css:46` (os 3 pontos) · `index.css:248` (o "Pensando…") | Só opacidade, baratos. Mas rodam enquanto a resposta não chega |
| A transição de linhas da caixa | `ui/input-bar.tsx:323` | Layout, a cada anexo |
| O `zoom` do texto grande | `dados/preferencias.ts:89` | Reescala a página inteira e obriga a dividir toda altura de janela |

O que é barato e pode ficar: o degrau (`transform` em 100 ms), a barra de progresso (`scaleX`), a comemoração (uma
vez, `transform` e `opacity`), a entrada das mensagens.

### 7.3 Dependências

- **Radix**: são 18 pacotes no `package.json`, mais o `radix-ui`. As peças lidas usam cinco: `dialog` (o `Dialogo`, e
  por baixo o `PainelLado` e a gaveta), `dropdown-menu` (o `MenuMais`, os seletores e o menu da pessoa), `popover` (o
  sino, o "?", o "i" e o `ChipFonte`), `collapsible` (o `Recolhivel`) e `tooltip` (a dica do trilho). **Todo o
  comportamento de teclado, de foco e de colisão dessas peças vem do Radix.** O produto reimplementa.
- `class-variance-authority`, `clsx` e `tailwind-merge`: o `cn()` está em todas as peças. Sem o `twMerge`, a ordem
  das classes passa a decidir quem ganha.
- `tw-animate-css`: as classes `animate-in`, `fade-in-0`, `zoom-in-95` e `slide-in-from-*`.
- `react-router-dom` 7: `Link`, `useSearchParams`, `useNavigate`. O produto usa `wouter`.
- `react-dropzone`: não aparece nos arquivos lidos.
- `components/ui` tem 47 arquivos (324 KB de fonte) e `components/blocks`, 24 KB: são peças do 21st.dev. A casca
  depende de cinco delas.
- Fontes: 89 KB de `woff2`, dos quais só 12 KB (a Fustat) têm uso.

### 7.4 Acessibilidade (regra 50, item 11)

Alguns já apareceram na seção 3. Os que pesam:

- **O foco do campo de texto e da caixa do chat é só a troca de cor da borda** (seção 2.2).
- **A borda de 2 px em `#E5E5E5` sobre branco é a única fronteira de campo, de interruptor desligado e de cartão.**
  O produto já subiu a borda de campo para `#8f8f8f` (`estilos.css:38`); o mockup voltou ao cinza claro.
  **[incerto]** Não sei por que o produto subiu.
- **Não há estado "carregando" em nenhuma peça** (regra 50, item 5).
- `Tabela`: `aria-selected` num `<tr>` sem papel de grade.
- `Abas`: sem `aria-controls` e sem `tabpanel`.
- `GraficoSemanas`: o valor do ponto só aparece com o mouse.
- O ⋯ das conversas só aparece no hover, a partir de 768 (regra 50, item 2a: "nada que só funcione com hover"). Ele
  aparece também no foco, então o teclado alcança.
- `Aviso` com `role="status"` em texto que não muda.
- O `Dialogo` não vira folha de baixo no celular.
- O texto grande não vale na prova (seção 2.5).
- A etiqueta de 11 px (`gestao.tsx:44`).

### 7.5 Mecânicas proibidas e pontos de regra

O mockup declara o limite em vários comentários (`comemoracao.tsx:9-10`, `introducao.tsx:26-27`,
`progresso.tsx:8-9`): nada de sequência de dias, pontos, vidas, ranking, meta nem pedido de notificação. **Não achei
nenhuma dessas mecânicas ligada a uma tela.** O que sobra para olhar:

| O quê | Onde | Observação |
|---|---|---|
| **Restos do ranking** | `index.css:49-53`, `175` e `193` (os tokens `rank-1`, `rank-2` e `rank-3`) · `components/ui/leaderboard-card.tsx`, `leaderboard-podium.tsx` e `leaderboard-rankings.tsx` · `dados/ranking.ts` | Código morto: a aba Ranking saiu, e `?aba=ranking` redireciona para Alunos (`areas/professor/Turma.tsx:36`). Não levar os tokens |
| **A comemoração** | `duo/comemoracao.tsx`; usada em `areas/aluno/Atividade.tsx`, `areas/aluno/Prova.tsx` e no fim da introdução | Acontece uma vez por montagem, sem laço. Mas dispara **em toda entrega**. O comentário da tarefa diz "comemora A ENTREGA (nunca a nota)". Vale o parecer do `conformidade-reviewer` (D59) |
| **O rosto dos agentes** | `duo/onca/AvatarIA.tsx` | O avatar passa a ser a **cabeça da onça**, com expressão. O `CLAUDE.md` registra que hoje o avatar é "um círculo com o ícone da função, nunca rosto" (D58), e a decisão dos avatares está em aberto |
| **A onça "acolhendo"** | `duo/onca/partes.tsx:72-78`, `Onca.tsx:105-115`; o único uso é `areas/aluno/_conversa-tutor.tsx:339` | A expressão de preocupação, com as patas abertas, no lugar da caixa do Tutor depois do assunto delicado, com a fala "Vamos falar disso com um adulto.", parada (`animada={false}`). Encosta na proibição de simular vínculo afetivo (D58, regra 70, item 4a): vale o parecer do `conformidade-reviewer` |
| **Passo obrigatório na introdução** | `duo/introducao.tsx:82` e `113-115` | Passo com `obrigatorio` não tem X nem Esc. Conferir com a D59 ("sair nunca é mais difícil que entrar") |
| **👍 e 👎, Refazer e Editar** em toda resposta de IA | `duo/chat.tsx:211-231` e `237-283`; **ligados no Tutor** em `areas/aluno/_conversa-tutor.tsx:245` (as ações) e `455-459` (editar) | O voto é dado novo de menor, fora do mapa do `docs/lgpd.md` (regra 20, item 1). Editar **corta a conversa dali em diante** (`conversasAluno.cortar`), e Refazer reescreve a resposta: os dois mexem no registro que o professor supervisiona (D8, regra 70, item 4) e no freio de trocas (D38). A resposta retirada pela escola não tem as ações |
| **Anexar na conversa** | `duo/chat.tsx:371-385`, `chat-dados.tsx:309`; importado também pelo Tutor (`_conversa-tutor.tsx:4`) | Decisão em aberto (D5, D55). **[incerto]** Não conferi se o botão chega a ser desenhado na caixa do aluno |
| **Apagar conversa sem confirmar** | `turmma/Casca.tsx:246` e `289` | Inclusive a do aluno com o Tutor |
| **Link de WhatsApp na Ajuda** | `turmma/Casca.tsx:598` | Só para professor, coordenação e rede |
| **Vermelho e verde de "pioraram" e "melhoraram"** | `duo/gestao.tsx:72-101` e `262-283`; `duo/numero.tsx:27-28` | Contradiz a regra dos gráficos do próprio mockup (`graficos.tsx:16-18`) |
| **O selo "Novo"** e os contadores do aluno | `duo/pessoa.tsx:29-31`, `turmma/Casca.tsx:132-144` | Calmos: sem número no "Novo"; o azul conta tarefa por fazer; o amarelo, só resposta não lida |
| **Preferência no `localStorage`** | `dados/tema.ts`, `dados/preferencias.ts` | Tema e tamanho de texto não são sensíveis (regra 50, item 7). O mockup guarda por papel, não por pessoa |

O que o mockup acerta e vale manter: o nome de função ao lado de todo avatar (D17); o selo "IA" em toda saída; aluno
sem foto; Sair em um clique; o `Carimbo` como registro de quem aprovou; a barra de progresso só para o que tem fim; os
dois botões do mesmo tamanho na confirmação.

---

## 8. O QUE A PRANCHA `/fundamentos` MOSTRA

Arquivo: `areas/entrada/Fundamentos.tsx`. Uma página só, de 1180 px de largura, com o seletor de tema no topo. As
seções, na ordem em que aparecem:

**Topo**: o link para o mapa das telas, o seletor Sistema · Claro · Escuro e o botão para a bancada da onça; a onça
acenando de 96, o logotipo a 28 px e o título "Sistema de design".

**11ª rodada**

1. **Cor**: um cartão por família (a face com o nome, os 4 tons, os 5 hex e dois selos de contraste); abaixo, os 9
   neutros, com o hex do tema que está valendo.
2. **Matérias**: as 13, com ladrilho de 40, nome e família.
3. **Tipos da fila**: os 16, com ladrilho e nome.
4. **Tipografia**: as 10 classes `t-*`, com a medida e uma frase de exemplo.
5. **Forma**: os cantos de 8, 12, 16 e 20; um cartão para apertar e a frase "borda de 2 px · degrau de 4 px · nenhuma
   sombra borrada".
6. **Botões**: um controle Normal · Desligado; as 6 variantes, cada uma nos 3 tamanhos (a `g` em largura cheia, a `m`
   com ícone); os `BotaoIcone`.
7. **Cartões**: de leitura, clicável e selecionado.
8. **Linha**: duas linhas num cartão, com ladrilho, selo de turma, ponto e chevron.
9. **Ladrilhos**: o `LadrilhoIcone` a 32, 40, 44 e 56; cinco `LadrilhoAcao`.
10. **Selos, contador e ponto**: os selos de estado, o IA, os de turma e o pequeno; os contadores nos 3 tamanhos e em
    3 famílias; os 5 pontos.
11. **Barra de progresso**: a de 16 e a de 12, com o botão "Mais uma".
12. **Número grande**: quatro, sendo um com variação boa, um com variação ruim e um grande.
13. **Balão**: a onça acenando de 104 e o balão.
14. **Faixa**: a aula de agora, com ação e ícone.
15. **Estado vazio**: a onça dormindo e "Tudo em dia".
16. **Comemoração**: "Entregue!", com o botão Repetir.
17. **Faixa de resultado**: certo, erro e info.
18. **Opção**: três matérias.
19. **Segmentado**: Lista · Semana · Mês.
20. **Navegação**: uma réplica parada do item da lateral (aceso com contador, e apagado) e a barra de baixo do aluno.
21. **Esperando você**: três `LinhaFila`.

**12ª rodada** (`PecasNovas`)

22. **Abas** · 23. **Passos** (com "Próximo passo") · 24. **Campos** (texto com dica, senha com erro, busca) ·
25. **Toques, interruptor e menu** (escolha única, escolha múltipla, interruptor, ⋯) · 26. **Aviso** (os 4 tons) ·
27. **Pessoa e registro** (avatares, "Novo", carimbo) · 28. **Diálogos** (o comum e o de confirmar) · 29. **Tabela**
(com linha ativa) · 30. **Recolhível** · 31. **Tela de foco** (numa moldura de 260 px, com barra de progresso e
rodapé).

**13ª rodada** (`Pecas13`)

32. **Conversa com dados**: o `ChatDados` em coluna, numa moldura de 560, com um roteiro de exemplo que inclui a
    recusa de comparar professores.
33. **Gráficos**: dois `CartaoNumero` (com a barra do pacote e com colunas), a tabela curta, a barra empilhada, os
    pontos de situação e a barra do pacote passando de 80%.
34. **Relatório em PDF**: o botão que baixa um PDF de exemplo, com acentos, tabela e quebra de página.

**14ª rodada** (`Pecas14`)

35. **Página: cabeçalho, abas e o canto do sino**, numa moldura de 200, com o sino de verdade.
36. **Barra da conversa e conversa vazia**, numa moldura de 340.
37. **Seção e grade de painel**.
38. **Gráficos do painel**: três `CartaoKPI` (um deles ativo), a tendência, o gráfico de semanas com a série tracejada,
    o mapa de calor (com "menos de 5" e "fora") e a tabela com barras.
39. **Documento: cabeçalho, mesa, folha e questão**, numa moldura de 640, com o interruptor de gabarito funcionando.
40. **Plano: resumo e linha do tempo**, e o bloco fixo.
41. **Estados e cartão na conversa**: os 4 selos de estado, o cartão do documento e a faixa de resultados.
42. **Sequência, rubrica, slides e mapa mental**.
43. **O Analista em tela inteira**, numa moldura de 520.
44. **O motor de consulta**: só em desenvolvimento; a lista dos testes de `testarConsulta()`.

**O que a prancha não mostra**, e uma galeria do produto deveria mostrar:

- as peças da conversa da 15ª rodada (a saudação, a mensagem de quem escreve, a resposta com as ações, o "Pensando…"),
  fora do que aparece dentro do Analista;
- a caixa do chat (`InputBar`), que aparece só como um retângulo de mentira;
- todas as peças de gestão (seção 3.10);
- a `Introducao`;
- o `PainelLado`, o seletor de escola e o menu da pessoa;
- a assinatura da IA, o chip de página e o chip da web;
- o estado de foco, o de erro e o desligado da maioria das peças (só os botões têm o desligado);
- qualquer estado "carregando", que não existe.

A onça e os ícones ficam numa segunda página, `/fundamentos/onca` (seção 6.4).

# Turmma — mockups da interface

> **Não é código do produto.** Não copiar código daqui para o `apps/web` nem para os `packages/`: ver o
> [README.md](README.md).

Só front-end, para **ver o sistema antes de construir**. Não fala com servidor, não tem backend e todo dado é
sintético. Vive na pasta `mockups/` do repositório (veio do branch `mockups/interface` para a `develop` em
23/09/2026, e de novo em 16/10/2026, na versão de outubro, `a95568d`; ver o [README.md](README.md)), com
`package.json` próprio:
**não é workspace** do monorepo, não entra no `npm run build`, no lint nem nos testes da raiz, e nada daqui vai
para o `apps/web`. O que for aprovado aqui volta para o `docs/interface.md` e é construído no produto pelo processo.

## Ver

```bash
cd mockups
npm install        # só na primeira vez
npm run dev        # abre em http://127.0.0.1:5190
```

Comece pelo **mapa das telas** em `/`: os três roteiros de demonstração (com o ✓ de cada passo feito), os atalhos,
os estados e as frases para digitar no Tutor, e as telas por papel. Para trocar de papel, volte ao mapa. O que você
faz fica guardado (recarregar não apaga); para voltar ao começo, **Recomeçar a demonstração**, no alto do mapa.

## De onde vem cada coisa

| Fonte | O que dá |
|---|---|
| `docs/interface.md` (neste repositório) | O planejamento: navegação por papel, as telas-chave, as regras, o mapa de peças da 10.2 |
| ChatGPT (tema claro de `chatgpt.com`, medido em 19/09/2026) | O sistema de design: superfícies, cinzas, bordas, a fonte do sistema, item de 36 px com canto de 10, botão em pílula, caixa de pedido com canto de 28 px e sombra suave, pergunta centralizada |
| A marca (`~/Code/turmma-marca`) | Três cores e mais nenhuma: branco, preto e o laranja da pinta `#E8732E`. A Fustat fica só no logotipo |
| 21st.dev | As peças, em `src/components/ui` e `src/components/blocks`, vestidas com os tokens |

A primeira versão usava a pele da landing page (papel, creme, azul-noite, Fustat nos títulos). O Gabriel rejeitou
ao ver, e a pele foi refeita. Os **nomes** dos tokens continuam os da seção 9.9 do doc; os **valores** mudaram
(`noite` virou preto, `creme` virou cinza). A Parte B do `docs/interface.md` ainda descreve a pele antiga.

## Como está organizado

- `src/index.css` — os tokens (`@theme`), a ponte com o vocabulário do shadcn e o movimento
- `src/components/ui`, `blocks` — peças do 21st.dev (shadcn/*, serafimcloud/* da família Agent Elements, e outras)
- `src/components/turmma` — o que é nosso, montado sobre as peças: casca, caixa de pedido, assinatura da IA,
  selos, chip de fonte, conversa, formulários das ferramentas
- `src/areas/{entrada,professor,aluno,coordenacao,outras}` — as telas
- `src/dados` — a escola sintética, os agentes, as conversas e **o catálogo de ferramentas** (`ferramentas.ts`)

## Padrão de espaço (definido em 20/09/2026)

O Gabriel reprovou o "aproveitamento horrível de espaço" e o título com descrição em toda aba. A regra mora em
`src/components/turmma/tela.tsx` (`Tela` e `TelaCheia`) e vale para os três papéis:

- **Aba não tem título nem descrição.** A lateral já diz onde a pessoa está. O `<h1>` existe só para leitor de tela.
  Só tela de **objeto** mostra nome (uma prova aberta, o formulário de uma ferramenta, o modo sala): passa-se `objeto`.
- **Margem da página:** 16 px no celular, 24 px a partir de 768 px. Topo 16/20 px, fim 32 px.
- **Vãos:** 16 px entre blocos · 12 px entre cartões de uma grade · 16 px dentro do cartão.
- **Uma barra só no topo**, de 36 px, com os controles da página (abas, filtros, busca). Ela é o cabeçalho.
- **Largura fluida** até 1480 px em grade e tabela · 1040 px em formulário · 760 px em leitura e conversa.
- **Tela de trabalho ocupa a janela e rola por dentro** (`TelaCheia`): Calendário, Minhas turmas, thread do time.
  Linha de grade tem sempre a mesma altura, com ou sem conteúdo.
- Nada na tela diz "mockup": a nota de planejamento (`NotaMockup`) continua no código e não é desenhada; o botão
  flutuante saiu. O mapa das telas continua em `/`.

## Ferramentas e Biblioteca (reforma de 20/09/2026; sétima rodada no mesmo dia)

- **A regra:** é ferramenta o que entrega um **output próprio** (plano, apresentação, mapa mental, prova); o que o chat
  já responde (e-mail, ideia de atividade, resumo de um texto) é **pedido ao Assistente**. O painel preto "o resto é
  só pedir" SAIU da página (pedido do Gabriel): a regra continua viva só no estado vazio da busca, que leva o pedido
  para a conversa. A separação das 77 ferramentas da Teachy está em `~/Code/Turmma/pesquisa/ferramenta-ou-chat.md`.
- **O catálogo é dado:** `src/dados/ferramentas.ts` tem as 17 ferramentas, com o texto do cartão, os campos, o que vem
  no resultado e a prévia sintética. A página, o menu da caixa de pedido e o formulário leem dali. **Ferramenta nova =
  uma entrada na lista + um ícone.**
- **A página no desenho da Teachy:** `areas/professor/Ferramentas.tsx` é só a casca das duas abas; `Catalogo.tsx` e
  `Biblioteca.tsx` devolvem cada um a sua barra e o seu conteúdo (`useCatalogo()`, `useBiblioteca()`). Catálogo: busca
  larga, seções "Favoritas" e "Todas", cartão branco de linha fina com ícone de 56 px, nome, duas linhas e a estrela
  (favoritas em `dados/favoritas.ts`, localStorage). SAÍRAM as pílulas de categoria, a etiqueta de formato e a seta.
  Cabe em 1440 × 780 com três favoritas; grade de 12 trilhos, sem buraco.
- **Ícones mais minimalistas e menos coloridos:** `turmma/icones-ferramenta.tsx` — um objeto por ícone, papel branco,
  cinzas, preto e UM acento laranja pequeno; ladrilho neutro único (`#F4F4F4`), sem cor por categoria. Bancada para
  conferir: `/pecas/icones`.
- **O formulário é um motor, em grupos:** o motor mora em `components/turmma/ferramentas.tsx` (a tela e o cartão da
  conversa usam o mesmo, D18). Grupos derivados do tipo de campo: "Para quem", "O quê", "Como", "Mais opções"
  (BNCC, detalhes, anexar arquivo com a pergunta da D5, buscar na web desligada). "Preencher exemplo" no topo, rodapé
  fixo, e a coluna da direita é uma folha "Como vai sair". Os campos foram conferidos, ferramenta por ferramenta,
  contra `~/Code/Turmma/pesquisa/teachy-mapa-de-ferramentas.md`; o que a Teachy pergunta e aqui não entra (disciplina e
  ano, descrição de aluno, grade de horário, nota de redação pela IA) ficou de fora de propósito.
- **Oito das 17 são proposta do mockup**, fora da lista do F7 e da D67: planejamento do período, projeto, plano de
  recuperação, mapa mental, roteiro de experimento, avaliação diagnóstica, proposta de redação, importar prova.
- **Biblioteca no desenho do Google Docs, com o documento real:** a miniatura deixou de ser esqueleto de barrinhas. O
  começo do texto de cada um dos 18 documentos mora em `dados/biblioteca.ts`, e `turmma/pagina-mini.tsx` desenha esse
  texto de verdade, minúsculo, cortado embaixo (em `em` sobre `cqw`). O glifo do tipo é neutro.

## Calendário, Turmas e Time (sétima rodada, 20/09/2026)

- **Calendário no desenho da Teachy** (`ui/event-manager.tsx`): mês com o número centralizado e UMA linha por evento
  (pontinho + texto); semana com uma coluna por dia e as aulas como cartões empilhados ("A preencher" no que está em
  branco); dia com os mesmos cartões e o painel "Falta preencher". SAIU a visão "Lista". Continua proibido criar ou
  mover aula (regra 60, item 8).
- **Minhas turmas no modelo da Teachy:** `/professor/turmas` é a lista em cartões cheios (`Turmas.tsx`) e
  `/professor/turmas/:turma?aba=` é a turma aberta (`Turma.tsx`), com as abas em `areas/professor/abas-turma/`:
  Visão geral (métricas + as quatro perguntas numeradas), **Sala** (a sala de carteiras das rodadas anteriores),
  Atividades, Notas, Frequência, **Ranking** e Tutor. `/professor/painel` redireciona. Não trouxemos "Recursos" nem
  "Mural" da Teachy.
- **Ranking de participação** (`dados/ranking.ts`, peças `ui/leaderboard-*` do 21st.dev coladas pelo Gabriel): presença
  +10, atividade entregue +20; nota e dificuldade NÃO contam; no empate fica na frente quem entregou mais cedo, para o
  pódio ter três pessoas. Avatar de iniciais, laranja/preto/cinza no lugar de ouro/prata/bronze. Só o professor vê.
- **Convidar alunos** (`abas-turma/ConvidarAlunos.tsx`, bancada `/pecas/convite`), no modelo do "Adicionar alunos" da
  Teachy: link da sala com copiar, botão do WhatsApp, código da turma, validade com "Gerar novos", e os pedidos para
  entrar com aprovar/recusar (D3; regra 20, item 8).
- **Seu time em formato de conversa** (`Time.tsx` sobre `ui/messaging-conversation.tsx`, peça HextaUI colada pelo
  Gabriel): o agente manda mensagem em balão, a professora responde à direita, anexos e ações embaixo do balão, a faixa
  "Esperando você" presa no alto e a caixa de resposta no pé. Na lateral, "Seu time" segue a people-list (avatar com
  ponto de estado, última mensagem, não lidas), com o dado em `dados/time.ts`.
- **Seletores:** o de escola virou seletor de espaço de trabalho (sigla, rede · turno · turmas, visto) e a escolha vale
  para o app (`dados/escola-ativa.ts`); o de turma da caixa de pedido mostra o código num ladrilho e agrupa por escola.

## Ferramentas e Turmas copiadas da Teachy (oitava rodada, 20/09/2026)

O Gabriel viu a sétima rodada e pediu "um ctrl c e ctrl v" da Teachy nestas duas áreas ("não está interessante o seu").
As medidas foram tiradas da Teachy real, no Chrome dele, e estão em `~/Code/Turmma/pesquisa/teachy-medidas-de-interface.md`.
Decisão dele: cópia fiel de layout, tamanhos, fontes e espaços, com AS NOSSAS CORES no lugar do azul, e ícones coloridos
desenhados por nós. **Nestas duas áreas o desenho da Teachy ganha do nosso padrão de espaço**: a página tem título, o
botão tem canto de 8 px, a página rola como documento, e as fontes são Quicksand (títulos) e Inter (corpo).

- **A pele comum:** `src/components/turmma/teachy.tsx` (`PeleTeachy`, `tipo`, `BotaoT`, `Periodo`, `ChipT`, `CartaoT`,
  `CabecalhoAba`, `PerguntaT`, `AlternaT`, `tabelaT`, `AvatarT`, `VazioT`) e, em `painel.tsx`, `MetricaT`, `ValorT`,
  `BarraDesempenho`, `menuT`. Tokens novos em `index.css`: `marca-cx`, `marca-cx-forte`, `font-teachy`, `font-teachy-corpo`.
  Mapa das cores: azul forte → laranja (botão primário com texto preto, sublinhado da aba, link, ícone de rótulo);
  azul pálido → cinza claro; bordas e fundos NEUTROS (a pele bege já foi rejeitada).
- **Ferramentas** = o modal "Criar mais com IA": cabeçalho de 88 px (título + busca enorme + o seletor Ferramentas |
  Biblioteca onde a Teachy tem o X), lista de categorias de 256 px, "Recomendados" e "Todos" em duas colunas de cartões
  de 96 px (ícone de 40 px numa área de 109 px, nome Quicksand 16/700, duas linhas 12/16, estrela de 20 px).
  A Biblioteca não mudou.
- **Ícones:** 17, chapados, sem contorno, sem sombra e SEM ladrilho, no estilo dos da Teachy: laranja no lugar do azul
  deles, papel cinza quente e um ou dois acentos (verde-água, amarelo, rosa, roxo, azul). Bancada: `/pecas/icones`.
- **Turmas — lista:** "Turmas" + "Meu uso" · "Filtrar" · primário "Convidar alunos" (no lugar do "Criar turma": aqui a
  turma vem da coordenação, D3); cartão de 213 px só com disciplina, nome e a barra de desempenho com o % dentro.
- **Turmas — turma aberta:** barra de 49 px com "‹", o nome e NOVE abas à direita (Visão Geral · Atividades · Recursos ·
  Mural · Alunos · Notas · Uso de IA · Frequência · Ranking); o conteúdo rola como documento e cada aba é um bloco de
  altura natural. Visão Geral: título + chips + "Gerenciar", três métricas de 112 px e as quatro perguntas EMPILHADAS.
  Alunos: tabela da Teachy + a subaba "Sala" (as carteiras) e o botão "Adicionar", que abre o convite. `aba=sala` e
  `aba=tutor` continuam abrindo (viram alunos/sala e uso). **Recursos e Mural são proposta do mockup**: não existem
  no roadmap.

## A escola do zero ao primeiro aluno (nona rodada, 04/10/2026)

O produto real (Joaquim, A1 `apresentacao-escola`) construiu a montagem da escola e a entrada dos alunos, e o mockup
passou a mostrar esse caminho como ele funciona de verdade. O público agora é também a apresentação a um vereador de
Joinville (teste do produto e parte jurídica). Os dados e os textos do produto estão em `src/dados/estrutura.ts`.

- **Mapa (`/`)**: dois roteiros. O primeiro tem dez passos, da escola vazia ao primeiro aluno. Para a demonstração, use
  o código K7M2 QX9B e Giovana Teles com a matrícula 2026-0444.
- **Operação Turmma (`/operacao`)**: fica fora da casca da escola. Na aba Escolas, cria rede e escola com endereço
  próprio e convida a primeira coordenadora; a aba Uso mostra o custo de IA por escola. Uma linha fixa avisa que a
  operação não vê dado de pessoa.
- **Coordenação**:
  - **Estrutura**: abre com o roteiro de sete passos e os números ao lado. As abas são Turmas (as 22, filtráveis),
    Ano letivo, séries e disciplinas, Alocação (pendente, confirmada, contestada com motivo, "Corrigir alocação"),
    Grade e calendário, e Conta da escola. A aba "Convites" saiu.
  - **Lista da turma** (`/coordenacao/estrutura/turmas/:id`): a lista de nomes com matrícula e situação, e os pedidos
    de nome com auditoria (lidos só ao clicar em Atualizar; sem "aprovar todos"). O 3ºA não tem lista e mostra
    "Colar a lista", com a prévia linha a linha que barra CPF, data e matrícula repetida.
  - **Professores** (item novo da lateral): cadastro com o convite de cópia única, refazer e revogar. A lista não
    mostra e-mail.
- **Professor**:
  - **Turmas**: ganhou "Confirme suas turmas", com o 3ºA alocado e esperando confirmação ou contestação.
  - **Diálogo "Convidar alunos"**: o código tem 8 caracteres em dois grupos e o botão Projetar. A validade é de 1, 7
    ou 30 dias, com "Gerar novo" e "Revogar". Os pedidos se marcam um a um e a decisão é confirmada com o efeito
    escrito. O botão verde do WhatsApp ficou, por pedido do Gabriel; no produto, a D72 o tira.
- **Páginas públicas**:
  - **`/e/colegio-aurora/turma`**: o aluno digita o código ou chega pelo link, escolhe o nome livre, informa a
    matrícula e cria a senha. O pedido espera uma pessoa aprovar.
  - **`/e/colegio-aurora`**: a entrada da escola para o aluno já aprovado.
  - **`/convite`**: o professor aceita o convite. `#vencido` mostra o convite que não vale; `?conta=existente`, quem
    já tem conta em outra escola.

## Décima rodada (04/10/2026): remodelagem

O Gabriel, vendo a nona: "EXTREMAMENTE CONFUSO: MUITA informação, MUITA aba, MUITA coisa". A pesquisa e o plano
estão em `~/Code/Turmma/pesquisa/remodelagem/blueprint.md` (fora do repositório). A estrutura foi aprovada; esta
seção diz o que a fundação deixou pronto. O código de antes está em `.antes-da-remodelagem/src` (só leitura; fora
do `src`, não compila).

### A régua (vale para toda tela)

| # | Regra |
|---|---|
| R1 | No máximo **4 lugares** por papel, iguais na lateral e na barra de baixo do celular. Ação não é lugar: o lápis no topo |
| R2 | **Dois níveis**: lateral → tela → detalhe. O detalhe abre ao lado (480 px) ou como folha de baixo no celular. Só o objeto grande vira página, com "‹" |
| R3 | No máximo **3 abas**, nunca uma dentro da outra. Jeito de ver é segmentado cinza. Um filtro visível por tela |
| R4 | **Um botão cheio** por tela: laranja para criar e pedir, preto para aprovar e decidir. O raro vai para o "⋯" |
| R5 | **Linha inteira clicável**, com chevron e fundo ao passar o mouse. Nada de "Ver" repetido |
| R6 | **Sem título com descrição**. A explicação fica onde a dúvida nasce, em uma linha |
| R7 | **Texto curto**: rótulo de 1 ou 2 palavras, botão com verbo + objeto, frase do aluno com até 12 palavras |
| R8 | **O vazio some**. A fila vazia é uma linha: "Nada esperando você." |
| R9 | **Contador só onde há ação**: o Início (tamanho da fila) e o Avisar do aluno |
| R10 | **Cabe na janela**: a 1440 × 780 a página não rola; a 375 px não rola de lado e a navegação aparece |
| R11 | **Voltar é previsível**: "‹ Origem", painel fecha com X e Esc, a URL guarda aba, modo e painel, trocar aba usa `replace` |
| R12 | **Demonstração fora do produto**: estados e frases moram no Mapa (`/`) |
| R13 | **Uma pele só**: ChatGPT em branco, preto e `#E8732E`, a fonte do sistema, botão em pílula. Quicksand e Inter saíram (voltar = 2 linhas do `index.css`) |

### Navegação por papel

| Papel | Lugares (lucide) | Na lateral, abaixo | Menu da pessoa |
|---|---|---|---|
| Aluno | Início (`House`) · Tarefas (`ClipboardList`) · Eu (`CircleUserRound`) · Avisar um adulto (`LifeBuoy`; "Avisar" no celular) | lápis "Nova pergunta"; Conversas | Ajustes · Ajuda · Sair (→ `/e/colegio-aurora`) |
| Professor | Início (`House`, com o contador) · Turmas (`UsersRound`) · Agenda (`CalendarDays`) · Criados (`FileText`) | lápis "Nova conversa"; seletor de escola (só quem tem duas); Projetos; Conversas | Meu uso · Personalizar o Assistente · Configurações · Como a IA funciona · Ajuda · Sair |
| Coordenação | Início (`House`, com o contador) · Escola (`Building2`) · IA (`ShieldCheck`) · Registros (`FileSearch`) | — | Configurações da escola · Minha conta · Como a IA funciona · Ajuda · Sair |

Sair é um clique, sem confirmação. No celular (< 768 px): barra de 56 px no topo (pinta, escola, a gaveta com
Projetos e Conversas, o lápis) e barra de baixo fixa de 64 px com os 4 lugares. As alturas moram na classe `casca`
(`--barra-topo`, `--barra-baixo`), e as telas usam `.altura-tela` ou `.min-altura-tela`. A prova do aluno
(`/aluno/prova/:id`) e a aula ao vivo (`/professor/turmas/:turma/aula`) ficam fora da casca, em tela cheia.

### Os contratos da fundação

- **`dados/fila.ts`** — a fila única "Esperando você". `useFila(papel, turmaId?)`, `useItemFila(id)`,
  `useResolucao(id)`, `useContagemFila(papel)`, `fila.resolver(id, como)`, `fila.reabrir(id)`. Em memória, sem
  `localStorage`: recarregar devolve o estado inicial. Itens do professor: `atencao-2b`, `notas-2b`, `sinal-2b`,
  `pedidos-2b`, `adaptada-2b`, `turma-3a`, `pedidos-1c`, `pedidos-2a` (8). Da coordenação: `aviso-0031`,
  `pedidos-nome`, `contestacao-paulo`, `alerta-a1`, `alerta-a2`, `material-bio`, `convite-jonas`, `dossie-mec` (8).
- **`dados/turmas-professora.ts`** — `useTurmasDaProfessora(escolaId)` (a 3ºA entra depois de `turma-3a`
  confirmada), `turmaDaProfessora(id)`, `turmaDaProximaAula(escolaId)` (`2b` / `9a`), `aulaDe(turmaId)`.
- **`dados/conversas-aluno.ts`** — `mol`, `fracoes`, `revolucao`.
- **`components/turmma/fila.tsx`** — `ListaFila` e `LinhaFila` (linha de 52 px). Abrir: com `para`, navega; sem,
  põe `?item=<id>` na URL.
- **`components/turmma/painel-lado.tsx`** — `PainelLado({ aberto, aoFechar, titulo, children, rodape?, largura? })`.
- **`components/turmma/tela.tsx`** — além das peças de sempre: `CabecalhoTela`, `Abas` (até 3, em `?aba=`),
  `useAba`, `Segmentado`, `useParametro` e `Redireciona`. `TelaCheia` usa `altura-tela`.
- **`components/turmma/pedido.tsx`** — `CaixaPedido` (o "+" com Anexar e "Buscar também na internet"; a turma
  nasce com a da próxima aula), `AtalhosFerramenta({ turmaId })`, `useTurmaDoPedido()`.
- **`components/turmma/mais-ferramentas.tsx`** — `DialogoMaisFerramentas`, o catálogo numa janela de 1100 × 680.

Endereços combinados: conversa nova `/professor/conversa/nova?ferramenta=&turma=&pedido=` · painel da fila
`?item=` · ficha do aluno `/professor/turmas/:t?aba=alunos&aluno=` · convite `?aba=alunos&convidar=1` · modo de
ver `?ver=lista|notas|carteiras` · professor `/coordenacao/escola?aba=professores&prof=` · aviso
`/coordenacao/registros?aba=avisos&aviso=` · exportar `?exportar=1` · estados do Tutor `/aluno?estado=prova|fora|limite`
· prova sem internet `/aluno/prova/:id?rede=caiu`.

Os endereços antigos redirecionam (com `replace`): `/aluno/atividades` → `/aluno/tarefas`, `/aluno/desempenho` →
`/aluno/eu`, `/professor/calendario` → `/professor/agenda`, `/professor/biblioteca/:id` → `/professor/criados/:id`,
`/professor/time*` → `/professor`, `/professor/sala` → `/professor/turmas/2b/aula`, `/coordenacao/estrutura` →
`/coordenacao/escola`, e os demais da coordenação para Escola, IA e Registros (lista completa em
`src/areas/*/rotas.tsx`).

### O que saiu do caminho (o código continua)

- Da lateral: "Seu time" (o que o agente pede virou linha da fila; os agentes continuam assinando com avatar, nome e
  selo IA), "Fixados", "Ferramentas", "Minhas turmas" como nome, o rodapé do aluno e o "Configurações" da
  coordenação.
- Sem lugar na navegação, mas com endereço: `/professor/ferramentas` e `/professor/ferramentas/:id` (o "Mais" da
  caixa abre o catálogo), `/pecas/convite`, `/pecas/icones`, `/fundamentos`.
- O Ranking sai de vez; fica a ordenação "Quem ainda não começou".
- Da caixa de pedido: o seletor "Ferramenta ▾" e a pílula "Web: desligada".

## Tarefas futuras

**O registro completo está em `docs/pendencias-dos-mockups.md`** — 31 itens
(P01 a P31), cada um com o que o produto precisa de tela, API, dado, regra e teste, e por onde entra no processo.
As duas últimas rodadas estão nos itens P26 a P31. O resumo:

- **Projetos**, como no Claude e no ChatGPT (pedido do Gabriel, 20/09/2026). Hoje é só desenho: o grupo "Projetos" na
  lateral e a tela `src/areas/professor/Projeto.tsx`. Um projeto junta conversas, arquivos e instruções que valem só
  ali. Não existe em nenhuma fase do `ROADMAP.md`: entra por `/descobrir`, não por PRD. O que já se sabe que pesa:
  arquivo de projeto é material e só entra com titularidade e licença declaradas (D5), preso à escola (regra 10);
  instrução de projeto é texto livre e não pode virar lugar de escrever sobre aluno (D35, D66); projeto é do
  professor e a coordenação não vê (regra 70, item 8); e precisa de retenção e exportação como todo o resto (F3, D63).
- **Catálogo de ferramentas** (P22 a P25): registrar a regra e as categorias; as oito ferramentas novas passam por
  `/descobrir` antes de entrar no F7; no produto o formulário deriva do schema do contrato (D18), não de um arquivo.
- **Anexar documento na conversa** (mesmo dia): desenhado na caixa de pedido com `ui/file-upload` e
  `ui/file-card-collections`. Falta decidir limite de tamanho, quanto tempo o anexo vive e se ele conta no
  orçamento de IA da escola; e a declaração de origem do material é obrigatória (D5).
- **Faltas** e a aba Frequência (com "Fazer a chamada de hoje"): não existem no roadmap nem no mapa de dados do
  `docs/lgpd.md`. Decidir se a chamada é feita aqui ou importada do sistema de gestão da escola. O ranking depende disso.
- **Ranking de participação** (pedido do Gabriel, 20/09/2026): o `docs/interface.md` (10.2) proíbe por nome placar,
  pódio e as peças `leaderboard-*` (D59 e Decreto 12.880, arts. 9º e 10; regra 50, item 9; D64). No mockup ele existe
  só na tela do professor, pontua fato registrado (presença e entrega) e nunca nota ou comportamento (D57, D66). Para
  valer, é `/descobrir` + decisão, com o Joaquim.
- **Convite por link e código da turma:** a D3 já prevê o link da sala com o aluno reivindicando o próprio nome e o
  professor aprovando; falta decidir validade, revogação e uso (regra 20, item 8 pede token com expiração).
- **Extras do formulário** (anexar arquivo e buscar na web dentro da ferramenta): seguem a D5 e a D68, mas hoje só
  estão decididos para a conversa.
- **Um agente por pessoa** (Assistente, Tutor, Analista): está só no mockup. Para valer, é revisão da D32, da D9 e da
  D60, a ratificar pelo Joaquim.
- **Histórico real** (20/09): as conversas e os projetos moram em `src/dados/conversas.ts` (memória + `localStorage`,
  só no mockup). No produto falta a entidade da conversa do professor no modelo de dados, e nada de conversa vai
  para o `localStorage` (regra 50). Para voltar ao estado inicial do mockup: apagar a chave
  `turmma-mockup-conversas-v1` no navegador.

## Atalhos que só valem aqui, e não no produto

- A família Agent Elements vem com 121 classes `neutral-*`. Aqui a rampa `neutral` aponta para o chão quente no
  `@theme`; no produto a troca é à mão (custo da A2, seção 10.2)
- Modificador de opacidade em cor (`bg-black/80`) ficou como veio nas peças do shadcn: funciona no navegador de
  quem revisa, mas no produto sai (não existe no Chrome 109)
- Sem orçamento de JS, sem import dinâmico, sem teste. É mockup

## 11ª rodada: sistema Turmma × Duolingo

04/10/2026. O Gabriel achou a décima "extremamente confusa", com muito texto, pouco contraste e cara de site. Ele
escolheu o estilo do Duolingo (ícones, mascote, desenho, contraste e animação), com a onça da marca como mascote, o
laranja `#E8732E` como cor principal e a fonte do sistema mantida. A estrutura do blueprint (Início e até 4 lugares
por papel) continua; muda a pele.

- **Documento:** `~/Code/Turmma/pesquisa/duolingo/sistema-turmma-duolingo.md` (as análises estão na mesma pasta).
- **Tokens:** `src/index.css`. As 10 famílias (face, degrau, claro, borda e texto) e os neutros novos ficam num
  `@theme static`, para o Tailwind emitir as variáveis que as peças leem por `familia(f)`. Também estão lá a
  tipografia `t-*`, a técnica do degrau (`.degrau`, `.face`, `--face`, `--lado`, `--altura-degrau` e `--afunda`), os
  tempos `--dur-*` e as animações `salta`, `sobe` e `pulsa`. Nenhum token antigo saiu. Mudaram de valor, de
  propósito: `--radius-caixa` (16), as sombras (borda de 2 px e degrau sólido, sem desfoque), `--color-sidebar`
  (branco) e o foco (anel azul de 3 px).
- **Peças:** `src/components/duo/`, exportadas por `index.ts`: `Botao`, `BotaoIcone`, `Cartao`, `Linha`,
  `LadrilhoIcone`, `LadrilhoAcao`, `Selo`, `SeloIA`, `SeloTurma`, `Contador`, `Ponto`, `BarraProgresso`, `Balao`,
  `Faixa`, `EstadoVazio`, `Comemoracao`, `FaixaResultado`, `Opcao`, `Segmentado`, `NumeroGrande`, `Cabecalho` e
  `BarraApp`. As cores e os dados estão em `familia.ts` e `cores.ts` (`FAMILIAS`, `familia`, `MATERIAS`,
  `materiaDe` e `TIPO_FILA`).
- **A onça e os ícones ilustrados:** `src/components/duo/onca/` e `src/components/duo/icones/`, com a bancada em
  `/fundamentos/onca`.
- **Casca e fila:** `turmma/Casca.tsx` (lateral branca de 256 px, trilho de 88 px, barras de 56 e 68 px no celular) e
  `turmma/fila.tsx` (cartões de 72 px com ladrilho, título curto e número; os campos `curto`, `n` e `prazo` vêm de
  `dados/fila.ts`).
- **Ponte:** `ui/button.tsx` ganhou canto 12, peso 700 e degrau por sombra sólida. `ui/input-bar.tsx` e
  `turmma/painel-lado.tsx` ganharam borda de 2 px, sem sombra borrada.
- **Prancha:** `/fundamentos`, com todas as peças e os estados delas.
- **Limite de lei** (ECA Digital, Lei 15.211/2025, e Decreto 12.880/2026): copiamos o visual do Duolingo, não as
  mecânicas compulsivas. Fica de fora sequência de dias, XP por tempo de uso, vidas, ranking, notificação
  insistente e recompensa variável. A comemoração acontece uma vez, só em entrega e acerto, nunca em nota.

## 12ª rodada: polimento

04/10/2026. O pedido: simplificar ao máximo o uso, sobretudo para o aluno; levar o sistema Turmma × Duolingo a todas
as telas; ligar os fluxos entre os papéis para funcionarem de verdade no mockup (sem servidor); e conferir tudo
contra o planejamento. O contrato é `~/Code/Turmma/pesquisa/polimento/plano.md`. A base (B) rodou primeiro e
sozinha; as 10 tarefas de tela (A1, A2, P1, P2, P3, P4, C1, C2, E, R) migram as telas para o que está aqui.
Cópia de `src/` antes desta rodada: `~/Code/Turmma/mockups-antes-do-polimento-2026-10-04/src` (só leitura).

### O estado compartilhado

Antes havia 9 depósitos que não conversavam (o pedido do aluno não chegava ao professor, a prova aprovada não
chegava ao aluno). Agora há **um estado só**, em `src/dados/`:

- **Núcleo** (`dados/demo/nucleo.ts`): `criarFatia(nome, inicial)` devolve `{ ler, mudar, useValor }`. Cada fatia
  mora na memória e em `localStorage['turmma-demo-v2:<nome>']` (com `try/catch`: no modo privado fica só na memória).
  - **Recarregar não apaga nada.**
  - **Duas abas andam juntas, ao vivo** (o evento `storage`): abra o aluno numa e o professor noutra.
  - **O relógio:** `agora()` começa em segunda, 21/09/2026, 10h42; `registrar(tipo, dados, quem)` cria o evento,
    avança 1 minuto e guarda quem fez ("Aprovado por Camila Souza · 21/09, 10h44").
  - `useEventos()` e `useAconteceu(tipo, filtro)` (o ✓ do Mapa); `useRecomeco()`.
  - **Recomeçar a demonstração** (botão no Mapa, ou `recomecarDemonstracao()`): apaga as fatias e as chaves antigas
    (`turmma-mockup-*-v1`, a onça que acenou) e recarrega todas as abas.
- **Os módulos** (cada ação de domínio chama `registrar`):

  | Módulo | Guarda |
  |---|---|
  | `dados/sessao.ts` | o aluno (Lucas, ou um aprovado na demonstração) e o professor (Camila, ou quem aceitou convite) da sessão; o primeiro acesso visto; as novidades abertas (o selo NOVO) |
  | `dados/acesso.ts` | o código e o link de cada turma (o 2ºB nasce com `K7M2QX9B`), as listas, os pedidos de nome, as contas de aluno e a entrada da escola (`entrar`) |
  | `dados/escola-estado.ts` | turmas criadas, professores e convites (o token `t9KQ2xLmP4aR` é o da Camila), alocações, material, adaptações, equipe e encarregado |
  | `dados/envios.ts` | a aprovação de cada documento (original e adaptada) e os envios à turma |
  | `dados/avaliacoes.ts` | respostas, entregas, saídas da prova, os lotes de notas (o de 30 da prova de mol e um por entrega), as revisões e o Tutor travado |
  | `dados/avisos.ts` | o canal: avisos de aluno, canal público, encaminhamento de risco, pedidos do titular (31 a 33 já existem; os novos são 34, 35, 36…) |
  | `dados/ia.ts` | pausas, alertas vistos, sinais e as linhas novas de "O que a IA gerou" e da auditoria |
  | `dados/rede.ts` | as escolas da rede e da operação (uma fonte só: 6 escolas, 3.412 alunos, 106 turmas) e as criadas na demonstração |
  | `dados/grade.ts` | a grade da Camila (a aula de agora, a Semana, "na próxima aula: terça, 7h30") |
  | `dados/questoes.ts` | as provas e as listas, com gabarito e página |
  | `dados/fila.ts` | a fila "Esperando você" como VISTA do estado (os ids antigos ficam); `useCartoesDaFila` agrupa os pedidos do professor num cartão |

- **A história única** (seção 1 do plano): hoje é 21/09; a prova de 18/09 do 2ºB é a "Prova de mol e massa molar"
  (30 notas esperando, o Lucas com 7 de 10); a "Prova de estequiometria" de hoje está Para aprovar e só chega ao aluno
  depois do envio; a 6ºB tem 2 pedidos e nenhum professor (o único caso em que a coordenação decide pedido).
- **Compatibilidade:** os exports antigos continuam (`useFila`, `fila.resolver`, `useResolucao`, `listaDa`,
  `pedidosDa`, `TAREFAS_PRA_FAZER`, `useTurmasDaProfessora`…). `fila.resolver('notas-2b' | 'turma-3a' | …)` chama a
  ação de domínio, então as telas que ainda não migraram já mexem no estado certo.

### A navegação final

| Papel | Lugares | O resto |
|---|---|---|
| Aluno | INÍCIO · TAREFAS · EU · AVISAR UM ADULTO | sem lápis, sem recolher, sem menu; CONVERSAS (até 5); o nome é um link para Eu; AVISAR ganha um contador amarelo só com resposta não lida |
| Professor | INÍCIO · TURMAS · CRIADOS | o lápis (some no Início vazio), o recolher, a escola só para quem dá aula em duas, CONVERSAS (até 5 + VER TODAS; ⋯ Renomear · Apagar); menu: Configurações · Como a IA funciona · Ajuda · Sair |
| Coordenação | INÍCIO · ESCOLA · IA · REGISTROS | menu: Configurações da escola · Minha conta · Ajuda · Sair |
| Rede e operação | uma tela, com barra de topo própria | — |

- Telas de foco, sem casca: `/aluno/prova/:id`, `/aluno/bem-vindo`, `/professor/turmas/:turma/aula`.
- Novas: `/e/:escola/avisar` (canal da escola sem conta) e `/e/:escola/dados` (pedido sobre dados).
- `?como=<pessoa>` troca a pessoa da sessão (só nos links do Mapa); `?config=<seção>` abre as Configurações.
- Ajuda abre "Falar com a Turmma" (e-mail e WhatsApp).

### O que saiu

- Agenda (virou "Semana" em Turmas: `/professor/agenda` → `/professor/turmas?ver=semana`), Projetos (→ `/professor`),
  "Meu uso" como lugar (→ `/professor?config=privacidade`), o catálogo como página (→ `/professor?mais=1`),
  "O que o Tutor lembra" como página (→ `/aluno/eu/privacidade#memoria`).
- "Seu time" (`professor/Time.tsx`, `dados/time.ts`), as pranchas `/pecas/*` (`PecasConvite.tsx`, `PecasIcones.tsx`),
  `professor/Projeto.tsx` e `turmma/NavMockup.tsx`: apagados.
- O item "Dossiê do MEC" da fila (mora no Dossiê). O Ranking deixou de depender de `turmas-resumo.ts`.

### As peças novas (`components/duo`)

`Abas` (até 3), `Campo`, `CampoTexto`, `CampoSenha`, `Busca`, `Interruptor`, `MenuMais`, `Dialogo`,
`DialogoConfirmar` (dois botões do mesmo tamanho), `Toque` e `GrupoToques`, `Aviso`, `Passos`, `TelaFoco`, `Tabela`
(empilha a 375), `Avatar`, `SeloNovo`, `Carimbo` ("Aprovado por… · quando") e `Recolhivel`; o `Botao` ganhou a
variante `perigoCheio` (só na confirmação). `TIPO_FILA` ganhou revisão, risco e titular, e há o ícone `titular`.
Tudo na prancha `/fundamentos`. A ponte visual dos `ui/*` (botão, campos, diálogos, menus, selos) põe o resto do
app na mesma língua: borda de 2 px, canto de 12 a 16, nenhuma sombra borrada, foco azul e letra de 14 ou mais.

### Os fluxos e os roteiros

Os 16 fluxos de ponta a ponta estão na seção 6 do plano. O Mapa (`/`) traz três roteiros, com o selo do papel, o
que fazer, a dica e o link (com `?como=`), e o ✓ quando o passo já aconteceu:

1. **A escola do zero ao primeiro aluno** (F1, F9): a coordenação grava a lista do 3ºA, convida o Marcos; ele aceita,
   confirma a turma e gera o código; a Alice pede o nome, ele aprova, ela entra e vê a onça.
2. **A IA supervisionada em sala** (F2 a F6, F11): a prova pedida, aprovada e enviada; respondida, corrigida e
   aprovada; a revisão pedida e respondida; Avisar um adulto; o assunto delicado; o sinal que vira revisão.
3. **Para a prefeitura e o jurídico** (F10, F8, F15, F16, F7, F14): só agregado, o Município como controlador, a
   operação que não vê pessoa, a IA pausada, o encarregado, os pedidos do titular e o canal sem conta.

Os atalhos de quem apresenta também estão lá: copiar a lista do 3ºA, a senha e o segundo fator de demonstração, a
matrícula da Alice e o código vigente da 3ºA e do 2ºB.

### As regras para as tarefas

- Cada tarefa edita **só** os arquivos dela. Peça que falta: componha local e anote.
- Tudo o que muda estado entre papéis passa pela **ação da base** (que registra o evento e avança o relógio). Nunca
  crie um depósito novo.
- Telas novas usam `@/components/duo`: nada de borda de 1 px, sombra borrada ou letra abaixo de 14 px (fora selo e
  barra de baixo); um botão cheio por tela; no máximo 3 abas.
- Na tela, nunca "mockup", "proposta", "MVP", "fase" nem número de decisão. Tudo cabe em 1440 × 780 (lista longa rola
  por dentro) e funciona a 375 com a barra de baixo.
- Conferir: `npx tsc -b`, `npm run lint`, as fotos com `scripts/foto.mjs` e `node scripts/conferir.mjs` (as rotas da
  seção 3 com a tarefa dona de cada uma, os redirecionamentos, os roteiros clicados e as duas abas ao vivo).

### Correções da base depois da conferência (12ª rodada)

- **O trecho do assunto delicado** que a coordenação abre é o mesmo que o aluno leu: `dados/avisos.ts` guarda `TRECHO_TUTOR_ASSUNTO_DELICADO` (de `dados/mensagens-time.ts`), na semente da Olívia (32) e em cada caso novo.
- **Situação dos avisos:** ver o trecho e registrar o Conselho Tutelar passam ABERTO para EM ANÁLISE. A data do Conselho é gravada sem "hoje".
- **Contadores do aluno:** AVISAR conta só resposta de aviso; o pedido de dados respondido acende um ponto azul em EU (`usePedidosDadosNaoLidos`); a tarefa com NOVO (chegou, corrigida, revisão respondida) acende um ponto azul em TAREFAS. Na lateral, o número e o ponto ficam no canto do ícone, e o rótulo "AVISAR UM ADULTO" não é mais cortado.
- **Lateral:** numa conversa, acende só a conversa (não o Início). Com `?de=inicio`, acende o INÍCIO. O lápis do professor guarda o lugar no Início vazio, e o topo não muda de uma página para outra.
- **Fila:** a revisão de massa em mol enviada ao 2ºB fecha o sinal na hora, em qualquer tela. O aviso do canal público diz "Aviso sem conta". A contestação diz "não é a turma certa".
- **Tutor:** a pausa da escola vem antes da prova aberta (`useTutorTravado`).
- **Recado da nota:** cita as páginas de todas as questões erradas.
- **IA da coordenação:** a versão adaptada já decidida não fica mais como "Para aprovar".
- **Nomes:** nenhum aluno aparece em duas turmas. O 2ºB usa a `NOMES`; as outras turmas e a lista colada no 3ºA tiram nomes de `nomeGerado(k)` (`dados/alunos.ts`), cada uma na sua fatia.
- **Nomes das IAs:** Assistente, Tutor e Analista, sem nome comprido.
- **Mapa:** a dica das notas é "Notas · estequiometria"; os números de pedido e aviso não são citados, porque seguem a ordem do que já foi feito (com o estado limpo, o primeiro novo é o 34).

### Correções da base, segunda conferência (12ª rodada)

- **A prova de mol do 2ºB tem 26 provas, não 30.** São os 26 alunos que entraram (a turma tem 32 nomes; os 6 que não entraram não fizeram). `ACERTOS_PROVA_MOL_2B` (`dados/demo/lotes-base.ts`) é a fonte: o lote `prova-2b` (5 destaques e 21 "outras") e a coluna "Prova de mol" do boletim (`dados/alunos.ts`) leem os mesmos acertos. O Felipe tem 9 nos dois lados, o Lucas 7, e nenhum nome do lote está fora da turma. Ninguém das outras tirou 10: são 24 que marcaram c na questão 7.
- **3ºB com 33 nomes** (era 57). O total das listas continua 684: a diferença foi para as outras turmas, todas entre 29 e 34.
- **Mesmas tarefas nos dois lados do 2ºB.** "Lista de reagente limitante" é a lista atribuída com prazo em 17/09: o aluno vê AINDA DÁ, o professor vê aberta (o campo `selo` do dado diz "Ainda aceita entrega"). A "Lista 1 de proporção" (6 de 8) entrou nas Feitas do Lucas; as notas dele no boletim são as das Feitas (7,5 · 7,5 · 5,0 · 7,0).
- **Retirar o conteúdo tira mesmo.** O Lucas tem a conversa "Mols em 18 g de água", em que o Tutor errou a massa molar. "O Tutor disse algo errado" leva o trecho dessa conversa e guarda de onde veio (`Aviso.conversa`). "Retirar o conteúdo" troca a fala por "Esta resposta foi retirada pela escola." na conversa do aluno.
- **Um arquivo só no pedido de dados.** `arquivoDoAluno` (`dados/avaliacoes.ts`) monta o JSON (aluno, tarefas, conversas, o que o Tutor lembra sem os itens apagados, o que não temos). `arquivoDoTitular` (coordenação) usa essa mesma montagem. No pedido sem conta ficam o nome e a turma digitados.
- **Mapa:** o passo 1 do Roteiro 1 ganha o visto quando a coordenação chega ao Início depois da primeira verificação (evento `convite-aceito` com `papel: 'coordenacao'`; o passo 4 conta só o do professor). Os atalhos da prova ("Prova", "Prova sem internet") levam ao documento, com o aviso "Envie a prova ao 2ºB antes", até a prova ser enviada.
- O estado salvo antes destas correções guarda o lote antigo: use RECOMEÇAR A DEMONSTRAÇÃO.

## 13ª rodada: painéis com o Analista, introdução por papel, Adaptar e as 9 ferramentas

04/10/2026. Os pedidos do Gabriel: o ADAPTAR escolhe uma prova já criada (ou um anexo); as 9 ferramentas do catálogo
funcionam de ponta a ponta; a coordenação e a prefeitura ganham um painel simples e um assistente de dados em
conversa; e todos os papéis ganham uma introdução estilo Duolingo. O contrato é
`~/Code/Turmma/pesquisa/paineis-onboarding/plano.md`. A base (B) rodou primeiro e sozinha; depois, em paralelo, IAP
(introdução do aluno e do professor), ICRO (coordenação, secretaria e equipe Turmma), CP (painel da coordenação), RP
(painel da prefeitura) e F (Adaptar e as 9 ferramentas).

### As telas e as rotas novas

| Rota | Tela | Dono |
|---|---|---|
| `/aluno/bem-vindo` | a introdução do aluno (5 telas; já existia com 1) | IAP |
| `/professor/bem-vindo` | a introdução do professor (6 telas) | IAP |
| `/coordenacao/bem-vindo` | a introdução da coordenação (5 telas) | ICRO |
| `/rede/bem-vindo` | a introdução da secretaria (5 telas) | ICRO |
| `/operacao/bem-vindo` | a introdução da equipe Turmma (3 telas) | ICRO |
| `/professor?adaptar=1` | a janela Adaptar (o quê · que adaptação · para quem) | F |
| `/coordenacao` | o painel da escola, "Esperando você" compacto e o Analista em conversa | CP |
| `/rede` | o painel da rede (6 números) e o Analista, só agregado | RP |

- As introduções são telas de foco (sem casca) e aparecem **uma vez por pessoa**. Quem já viu e abre o endereço vai
  ao Início do papel; `?rever=1` ou `?como=` (os links do Mapa) mostram de novo.
- **De onde são disparadas:** o aluno, no primeiro login (`/e/:escola`, como antes); o professor, ao aceitar o convite
  (`AceitarConvite`); a coordenação, depois do convite e do segundo fator da primeira vez
  (`/entrar/verificacao?primeira=1&para=/coordenacao` → `/coordenacao/bem-vindo`); a secretaria e a equipe Turmma,
  depois do segundo fator, enquanto não viram a introdução (`secretaria@educacao.joinville.example` → `/rede/bem-vindo`;
  `equipe@turmma.example` → `/operacao/bem-vindo`). `/rede`, `/operacao` e `/coordenacao` abertos direto **não**
  redirecionam.
- **Rever a introdução:** no menu da pessoa (professor e coordenação), em Eu (aluno) e no menu do avatar (secretaria e
  equipe Turmma).

### As peças novas (`components/duo`)

- `Introducao` (`introducao.tsx`): `passos` (fala da onça, conteúdo, `pronto`, `obrigatorio`, `agoraNao`, `reacao`,
  `aoContinuar`) e `fim` (fala, resumo com visto verde, conteúdo, COMEÇAR). Barra verde no topo, X só nos passos não
  obrigatórios, Enter continua, Esc sai. Nada de pontos, sequência, meta ou pedido de notificação (lei).
- `ChatDados` (`chat-dados.tsx`): o Analista em conversa. Não tem número nem texto do Turmma: tudo vem do `roteiro`
  (`abertura`, `sugestoes`, `responder`, `placeholder`, `selo`, `linhaInicial`). Toda resposta tem a mesma forma: a frase,
  um visual, a hipótese, "De onde veio", até 3 botões de seguir, FIXAR NO RELATÓRIO, o arquivo, o motivo (lista fechada)
  e o selo da auditoria. `compacto` (sem cabeçalho e sem caixa) serve à introdução. `semAcento` e `casar` casam o texto
  livre.
- Os gráficos (`graficos.tsx`): `CartaoNumero`, `BarrasPequenas` (linhas ou colunas), `LinhaCurta`, `TabelaCurta`
  ("menos de 5"), `BarraPacote` (a marca dos 80% e o aviso calmo), `BarraEmpilhada` e `PontosSituacao`. Cor só por
  categoria: nenhuma cor de bom ou ruim.
- O relatório (`relatorio.tsx`): `montarPdf` (um PDF de verdade, A4, Helvetica com acentos, tabelas e quebra de página,
  feito no navegador), `baixarPdf`, `baixarCsv` (BOM, ";" e CRLF), `PreviaRelatorio` e `CartaoArquivo`.
- Tudo na prancha `/fundamentos`, na seção "Peças da 13ª rodada" (com um PDF de exemplo para baixar).

### Os números, uma fonte só

`dados/numeros-escola.ts` (Colégio Aurora) e `dados/numeros-rede.ts` (`useNumerosDaRede()`, a rede de Joinville) têm
os números do painel, do Analista, da introdução e do relatório. Ninguém digita número solto na tela. As contas:
porcentagem `round(a ÷ b × 100)`; por aluno = custo ÷ alunos com acesso; projeção do mês `round(% × 30 ÷ 21)`;
`celula(n)` escreve "menos de 5" quando n < 5. O pacote de IA aparece como % do pacote do mês e custo por aluno (sem
crédito para comprar). `USO_DE_AGOSTO` e `SAIDAS_IA` passaram a morar em `dados/rede.ts`.

### As preferências

`dados/preferencias.ts` (fatia `preferencias`: recarregar não apaga; Recomeçar zera): o tamanho do texto por papel
(`useTamanhoDoTexto(papel)`, aplicado pela casca), os padrões da prova (questões, alternativas, gabarito), o resumo de
segunda e o alerta do Analista, o cartão que vem primeiro no painel da rede e o relatório por e-mail, e a escola ao
abrir. As Configurações leem e gravam aqui; "Preparar a semana" usa `ajustesTurma` (o mesmo do ⋯ da turma). Só "Duas
etapas" continua na memória da página.

A introdução vista: `sessao.verIntroducao(papel)`, `useIntroducaoVista(papel)` e `introducaoVista(papel)` (fora do
React). No aluno, mantém o evento `onboarding-visto`; nos outros papéis, registra `introducao-vista` { papel, pessoa }.

### Os fluxos F17 a F29

Os passos e o que deve aparecer estão na seção 5 do plano.

- **F17** Introdução do aluno (a Alice no primeiro login; o Lucas pelo Mapa): é um programa e os professores veem, o
  tamanho da letra, Avisar um adulto praticado, e COMEÇAR leva à primeira tarefa.
- **F18** Introdução do professor (o Marcos depois do convite; a Camila pelo Mapa): confirma as turmas, os padrões da
  prova, preparar a semana e a primeira prova, que fica em Criados.
- **F19** Introdução da coordenação (depois do convite e do segundo fator): o que espera por ela, o mini Analista, os
  limites e a trilha da montagem.
- **F20** Introdução da secretaria: o que vê e o que não vê, o Analista que recusa nome de aluno e o cartão que vem
  primeiro no painel.
- **F21** Introdução da equipe Turmma: "Você nunca vê aluno nem professor" e "Criar uma escola".
- **F22** Rever a introdução, em todos os papéis.
- **F23** O painel da coordenação e o Analista: habilidades, comparar com agosto, fixar, os 5 do 1ºC com motivo e
  auditoria, a recusa de ranquear professor, o relatório em PDF.
- **F24** O painel da prefeitura e o Analista: acerto por série, consumo de IA por escola, a recusa nominal e de
  ranking, o relatório em PDF e em CSV.
- **F25** Adaptar pelo Início: a prova de Criados, os tipos (lista fechada), os alunos com adaptação, gerar, rever e
  aprovar.
- **F26** Adaptar com anexo (de quem é o material e a turma).
- **F27** As 9 ferramentas, cada uma abrindo, gerando e chegando a um resultado coerente.
- **F28** Correção de objetiva: "Que prova corrigir?" e o vazio que explica.
- **F29** A primeira prova da introdução aparece no Adaptar.

O Mapa ganhou "Primeiro acesso, por papel" (as 5 introduções), o ADAPTAR no Roteiro 2, a secretaria com o painel e
o Analista no Roteiro 3, e os e-mails da secretaria e da equipe nos atalhos. `scripts/conferir.mjs` conhece as rotas
novas e os donos novos, e proíbe na tela também "LLM", "token" e "dataset".

## 14ª rodada (05/10/2026): experiência e composição

Plano: `~/Code/Turmma/pesquisa/ux-composicao/plano.md`. Os pedidos do Gabriel: a área toda para o chat, como uma IA;
"Esperando você" vira um sino; as tarefas do aluno só na aba Tarefas; o modo escuro nos tons do Duolingo; o documento
gerado na estrutura do Geekie One e do Plurall; Ferramentas como aba; composição sem vazio e sem desalinhamento; Painel e
Analista separados na coordenação e na prefeitura.

### O modo escuro
- O `<html>` recebe sempre `data-tema="claro"` ou `data-tema="escuro"`, resolvido. Ordem: o forçado da aba (`?tema=`),
  a escolha (Configurações › Geral › **Aparência**: Sistema · Claro · Escuro, em `localStorage['turmma-aparencia']`)
  e, em Sistema, o `prefers-color-scheme`, acompanhado enquanto a página está aberta. RECOMEÇAR não apaga a escolha.
- **Para fotografar:** `?tema=escuro` ou `?tema=claro` em qualquer endereço força o tema na aba
  (`sessionStorage['turmma-tema-forcado']`, sobrevive ao `--clear` do `foto.mjs`) e sai do endereço; `?tema=sistema`
  tira o forçado. O script do `index.html` aplica antes do React (não pisca); `src/dados/tema.ts` faz o resto.
- **Uma fonte de cor:** `src/index.css` redefine as variáveis em `:root[data-tema="escuro"]`, fora de camada (fundo
  `#131F24`, superfície `#202F36`, borda `#37464F`, texto `#F1F7FB`, as 10 famílias clareadas). Nenhuma tela usa `dark:`
  (a variante continua desligada): quem usa token vira sozinho.
- **Tokens novos:** `sobre-cor` (texto sobre face colorida: botão laranja, contador, iniciais; continua escuro no
  escuro), `campo` (campo de texto e caixa do chat), `mesa` (atrás da folha do documento), `veu` (diálogo e painel),
  `icone-papel` e `icone-linha` (o papel dos ícones), `onca-chao`. Regra das telas: face colorida com texto usa
  `text-sobre-cor`, nunca `text-tinta`; campo é `bg-campo`; véu é `bg-veu`; nada de hex solto.
- **`apagado` não é texto.** No escuro ele dá 2,75:1: serve para trilho, tracejado, ícone desligado e borda. Texto
  que se lê ("não entrou", "fora", um número da tabela) usa `text-sutil`. Com `?tema=` na aba, a Aparência mostra o
  tema forçado e o apoio "Nesta aba".
- A onça não muda de cor. Para quem lê hex por JavaScript: `FAMILIAS_ESCURO` e `useFamilias()` (`duo/familia.ts`),
  `TONS_ESCURO` (`duo/onca/paleta.ts`).

### A navegação
| Papel | Lateral | No topo |
|---|---|---|
| Aluno | Início · Tarefas (número azul do que está Para fazer) · Eu · Avisar um adulto | nada |
| Professor | Início · Turmas · Ferramentas · Criados | o sino |
| Coordenação | Painel · Analista · Escola · Registros | o sino |
| Secretaria | Painel · Analista · Escolas (o cartão "Rede Municipal de Joinville" no lugar da escola) | nada |

### O sino (`components/turmma/sino.tsx`)
- A Casca desenha o sino no canto de cima à direita (no celular, na barra do topo), com o único número laranja (R9).
  Toda página guarda o canto: a casca do professor e da coordenação leva `data-sino`, e `--reserva-sino` vale 56 px
  a partir de 768 px (os cabeçalhos de página e a barra da conversa já descontam).
- O número é o tamanho da fila (`useCartoesDaFila`), só. Os documentos para aprovar ficam no filtro "Para aprovar"
  de Criados (a prova original e a adaptada apareciam como duas linhas da mesma prova).
- A lista agrupa Urgente → por turma → De várias turmas → Da escola; com 2 turmas ou mais, filtra por turma.
- `?sino=1` abre; `?sino=<turmaId>` abre filtrado; Esc, o X ou o clique fora fecham e devolvem o foco ao sino (abrir
  um item não devolve: o anel ficava aceso na tela de destino).
- **O painel do item é da Casca:** `?item=<id>` (e `?contestar=1`) abre por cima de qualquer tela. Professor:
  `PainelDaFila` (`professor/_fila`); coordenação: `PainelDoItemCoordenacao` (`coordenacao/_alerta.tsx`). Item com rota
  (`para`) navega; sem rota, abre aqui mesmo (`useAbrirItemDoSino`).

### As rotas novas
- `/professor/ferramentas` (a aba Ferramentas); `/coordenacao/analista` (o Analista em tela inteira);
  `/rede`, `/rede/analista`, `/rede/escolas` dentro da casca (a introdução `/rede/bem-vindo` continua fora).
- `/coordenacao/ia` e `/coordenacao/agentes` → `/coordenacao/registros?aba=ia` (o de agentes com `&ver=como`);
  `/coordenacao/conformidade` → `/coordenacao/registros?dossie=1`.
- O `Redireciona` **soma** a consulta de quem chegou à do destino (`/coordenacao/ia?ver=como&ia=tutor` →
  `…/registros?aba=ia&ver=como&ia=tutor`); `tirar` lista o que não segue.

### Os tipos de página (`components/duo/pagina.tsx`)
| Tipo | Peça | Largura | Ancoragem |
|---|---|---|---|
| Conversa | `ConversaVazia`, `ColunaConversa`, `BarraConversa` | coluna de 768 | barra de 56; vazio com o grupo a 1/3 (`1fr auto 2fr`); caixa presa a 24 do fim |
| Leitura | `Pagina tipo="leitura"` | 880 | cabeçalho a 24 do topo; o corpo rola por dentro |
| Painel | `Pagina tipo="painel"`, `GradePainel`, `CartaoPainel` | até 1200 | grade de 12 colunas, vão de 16 |
| Documento | `Pagina tipo="documento"` e as peças de `duo/documento.tsx` | cabeçalho em 1080; folha de 760 | a mesa rola por dentro |
- **Uma borda esquerda só:** toda página fica numa moldura de 1200 centrada, e a coluna do tipo (880, 1080, 1200)
  começa na borda esquerda dela; o título não pula ao trocar de aba na lateral (a 1440, sempre em x = 288). Só o
  painel, que chega ao canto, guarda a reserva do sino. `Tela` e `TelaCheia` usam a mesma moldura.
- **Um cabeçalho só** (`CabecalhoPagina`): 64 px, ‹ voltar fora da coluna, título 24/700, complemento na mesma linha,
  selo, ações à direita (no máximo 1 cheia), o ⋯ e as abas de 44 px com o número entre parênteses. Toda tela da
  lateral tem título visível (fora a conversa). `Tela`, `TelaCheia`, `CabecalhoTela` e o `Cabecalho` duo seguem as
  mesmas medidas, para as telas antigas.
- **Documento** (`duo/documento.tsx`, só desenho): `CabecalhoDocumento`, `MesaDocumento`, `Folha`, `CabecalhoFolha`,
  `BlocoQuestao` (alternativas em linha inteira, gabarito em verde com POR QUÊ), `Sumario`, `CartoesResumo`,
  `LinhaDoTempo` (o Pratique em cartão), `BlocoFixo`, `TabelaSequencia`, `TabelaRubrica`, `GradeSlides`, `SlideAberto`,
  `MapaMental`, `FaixaResultados`, `CartaoDocumento` (o cartão na conversa) e `SeloEstadoDocumento` (Para aprovar ·
  Aprovado · Recusado · Só você vê).
- **Painel** (`duo/graficos.tsx`): `CartaoKPI` (112 px, clicável, troca o gráfico; PERGUNTAR no canto), `GraficoSemanas`,
  `MapaDeCalor` ("menos de 5" hachurado), `TabelaBarras`, `Tendencia`.
- **Analista em tela** (`ChatDados layout="tela"`): vazio a 1/3 com a onça anil e 4 perguntas prontas; resposta em 4
  partes (frase, artefato, "De onde veio" que abre as etapas, FIXAR · BAIXAR CSV · 2 próximas); `?pergunta=` envia ao
  abrir.

### O motor de consulta (`src/dados/consulta.ts`)
- `entender` → `calcular` → `responder`: entende a métrica, o recorte (com apelidos), o agrupamento, agosto ×
  setembro e os pedidos de nome, ranking e professor; herda a métrica e o recorte da pergunta anterior; calcula sobre
  **células agregadas** (nenhuma linha de aluno), com os grupos sempre na ordem natural; grupo com menos de 5 vira
  "menos de 5" e tira o total da frase. Na rede, só agregado e nunca nome; na escola, nome e número por professor só
  com motivo (o `responder` devolve o `motivo`).
- As células de verdade são das tarefas CP (`numeros-escola.ts`) e RP (`numeros-rede.ts`); aqui ficam as de exemplo e
  `testarConsulta()`, que os Fundamentos mostram em desenvolvimento.

### Conferir
`node scripts/conferir.mjs` mede cada rota a 1440 e a 375, no claro e no escuro: além da régua de antes, o fundo do
escuro, blocos brancos soltos, o contraste de cada texto, os lugares de cada papel, o sino, "Esperando você" e
"Pra fazer" fora dos Inícios, o título visível, o título da aba e os redirecionamentos. Fotos em
`scripts/shots/ux/conferencia/<papel>/<nome>[-escuro][-375].png`. `--tema claro|escuro` mede um tema só.

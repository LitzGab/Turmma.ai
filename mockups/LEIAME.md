# Turmma — mockups da interface

> **Não é código do produto.** Não copiar código daqui para o `apps/web` nem para os `packages/`: ver o
> [README.md](README.md).

Só front-end, para **ver o sistema antes de construir**. Não fala com servidor, não tem backend e todo dado é
sintético. Vive na pasta `mockups/` do repositório (veio do branch `mockups/interface` para a `develop` em
23/09/2026), com `package.json` próprio:
**não é workspace** do monorepo, não entra no `npm run build`, no lint nem nos testes da raiz, e nada daqui vai
para o `apps/web`. O que for aprovado aqui volta para o `docs/interface.md` e é construído no produto pelo processo.

## Ver

```bash
cd mockups
npm install        # só na primeira vez
npm run dev        # abre em http://127.0.0.1:5190
```

Comece pelo **mapa das telas** em `/`: ele lista tudo por papel, marca o que é do MVP de apresentação (A1–A5)
e traz o roteiro dos cinco passos da D71 na ordem. Para trocar de papel, volte ao mapa.

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

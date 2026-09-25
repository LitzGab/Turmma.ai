# Tarefa 7.0 — Web: o convite da coordenação

**Funcionalidade:** apresentacao-painel · **Depende de:** 3.0, 6.0 · **Paralelo com:** 8.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Da linha da escola, o operador gera o convite da coordenação, copia o link que aparece uma vez, e
refaz ou revoga com confirmação, até a coordenadora ativar a conta e a escola aparecer `ativa`.

## Contexto necessário

- `docs/visao-produto.md`, `docs/interface.md` seções 5a e 6
- `techspec.md` seções 4, 5 (a matriz) e 9 ("Convite", "Refazer e revogar")
- `cenarios.md`: W1, W2, W3, W4, W8, W9, W10
- `.claude/rules/50-frontend.md` (itens 3, 7, 8, 11, 12), `20-lgpd-menores.md` (item 8)
- `tasks/prd-apresentacao-operacao/retro.md`, "Propostas", 3: a linha de recomeço da tela
- Código: a tela Escolas e `api/painel.ts` (6.0); `apps/web/src/operacao/paginas/Convite.tsx` (A0), para
  o padrão de token fora da barra; a tela de convite da coordenação do F1 (`/convite#<token>`), que a
  coordenadora abre no W1

## Subtarefas

- [x] 7.1 — Ações na linha pela matriz da seção 5 (convidar, refazer, revogar), sem inventar estado
  que a API não deu
- [x] 7.2 — Diálogo do convite: nome e e-mail (`autocomplete="off"`, `inputmode="email"`); o resumo antes
  de enviar (escola, nome, e-mail, "vale 72 h", "o link aparece uma vez"); depois, o link montado com a
  própria origem num campo de leitura, com Copiar, "Link copiado" em `aria-live` e a reserva sem
  `navigator.clipboard`; fechar (botão, Esc ou fora) sem cópia confirmada pergunta antes. A mutation usa
  `gcTime: 0` e `reset()` ao fechar
- [x] 7.3 — Refazer (avisa que o link anterior para) e revogar pedem confirmação; `CONFLITO` e
  `NAO_ENCONTRADO` com os textos da W10 recarregam a lista
- [x] 7.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/operacao/paginas/Escolas.tsx` | alterado |
| `apps/web/src/operacao/componentes/DialogoDoConvite.tsx`, `ConfirmarConvite.tsx` | novo |
| `apps/web/src/operacao/api/painel.ts`, `textos.ts` | alterado |
| `e2e/operacao-convite-coordenacao.spec.ts` | novo |
| `apps/web/src/operacao/acoes-do-convite.ts` (e teste) | novo (divergência) |
| `apps/web/src/operacao/componentes/DialogoDaOperacao.tsx`, `dialogo-aberto.ts`, `pedidos-do-painel.ts` (e testes) | alterado (divergência) |
| `packages/shared/src/operacao/painel.ts`, `sessao/convite.ts`, `index.ts`; `packages/nucleo/src/db/schema/convite.ts`; `apps/api/src/sessao/convite.service.ts` | alterado (divergência: a matriz e os 72 h em `@educa/shared`) |
| `e2e/__fixtures__/painel.ts`, `docs/lgpd.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W1 | e2e | criar rede e escola, gerar, copiar; a coordenadora abre o link e ativa; a lista mostra `ativa` com as contagens; em `chromebook` e `celular` |
| W2 | e2e | dois operadores; um refaz, o outro tenta refazer o mesmo: "o convite mudou" e a lista recarrega |
| W3 | e2e | fechar sem copiar pergunta; fechando, refaz, e o link anterior abre a tela de convite inválido |
| W4 | e2e | recarregar não mostra o link; outro operador na mesma aba não vê lista nem diálogo do primeiro |
| W8 (convite) | e2e | gerar convite só com Tab e Enter; Esc cai na pergunta de fechar sem copiar |
| W9 | e2e | sem `navigator.clipboard`, o Copiar seleciona o campo e pede para copiar; com ele, "Link copiado" anunciado |
| W10 (convite) | unidade e e2e | os textos de `CONFLITO` e `NAO_ENCONTRADO` por ação, sem código; na tela, o `CONFLITO` exato na W2 e "Ativa" na W1 |
| W6 (cartão com ações) | e2e | em `chromebook` e `celular`, a 360 px sem rolagem horizontal, e os botões convidar, refazer e revogar com pelo menos 44 × 44 px |
| token fora do cache | unidade | fechado o diálogo, nenhuma entrada do `MutationCache` guarda o token |
| clique duplo | e2e | dois cliques em "Gerar" mostram um só link, e a lista termina com um convite em aberto |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Envio do link por e-mail (F2): o operador manda à mão.

## Divergências resolvidas nesta tarefa

- **A matriz estado × ação e a validade de 72 h moram em `@educa/shared`.** A matriz vivia em constantes locais de
  `apps/api/src/sessao/convite.service.ts`, e o `VALIDADE_DO_CONVITE_HORAS`, no esquema do `@educa/nucleo`, que a web não
  importa. A tela precisa das duas (as ações da linha e o "vale 72 h" do resumo), e redigitá-las seria o contrato que diverge
  (regra 00, item 6): foram para `packages/shared/src/operacao/painel.ts` (`GERAR_`, `REFAZER_` e
  `REVOGAR_CONVITE_POR_ESTADO`) e `packages/shared/src/sessao/convite.ts`; o serviço da API e o esquema do núcleo importam de
  lá, sem mudar valor nenhum. Não cria regra: a E6 da API (integração) e o `acoes-do-convite.test.ts` (a tabela por extenso)
  provam as duas pontas.
- **As ações da linha saem de uma função pura** (`apps/web/src/operacao/acoes-do-convite.ts`), com o link e a cópia: refazer
  e revogar só aparecem com o `conviteId` que a lista deu, e `ativa` não tem ação. Nome acessível de cada botão com a escola
  ("Convidar a coordenação de X", "Refazer o convite de X"), com o rótulo visível no começo (WCAG 2.5.3). A chave dos botões
  é a posição: quando a lista recarrega e "Convidar" vira "Refazer", o elemento é o mesmo, e o foco que o diálogo devolve a
  ele não se perde (prova: W8, o foco termina no "Refazer" da escola).
- **Os arquivos dos diálogos**: `DialogoDoConvite.tsx` exporta `GerarConvite` e `RefazerConvite`, os dois que terminam no
  link, com a mesma etapa do link e a mesma pergunta; a confirmação do refazer fica dentro do `RefazerConvite`, porque ela
  continua no link. `ConfirmarConvite.tsx` é o revogar.
- **O `DialogoDaOperacao` ganhou três coisas, opcionais**: `fecharAoClicarFora` (o "fora" da 7.2; só nos diálogos do convite,
  onde fechar pergunta — num diálogo de criação, o toque que erra a caixa no celular apagaria o digitado); `focoInicial` (a
  confirmação do refazer e do revogar começa no texto, e não no botão que age, regra 50, item 8); e `aoFecharPeloNavegador`
  (o Chrome não deixa o `cancel` ser segurado duas vezes sem um gesto entre elas, e o segundo Esc fecha o `dialog` direto: a
  tela fica sabendo, em vez de achar aberto um diálogo que o navegador fechou). A trava de foco também passou a valer quando o
  foco está num título focado por código (`tabIndex={-1}`): o Shift+Tab a partir dele saía do diálogo (achado pelo W8).
- **O foco não se perde quando o botão que abriu sai da linha** (achado da 1ª rodada do `frontend-reviewer`). Depois de
  revogar, a lista recarrega em `revogado` e o "Revogar" some; no `CONFLITO`/`NAO_ENCONTRADO` ele some com o diálogo ainda
  aberto. Nos dois casos o foco vai para a primeira ação que sobrou na escola (o "Convidar"), na tabela ou no cartão, e, sem
  ação, para o anúncio da tela (`focarNaEscola`, em `Escolas.tsx`): pelo `focoDeReserva` do `DialogoDaOperacao`, quando quem
  abriu já saiu ao fechar, e pela linha, quando o botão com o foco sai depois. Prova: W8 (revogar só pelo teclado, foco no
  "Convidar") e W2 (o revogar já revogado, "Fechar", foco no "Convidar"); os dois ficam vermelhos com o `focarNaEscola` sem
  efeito.
- **O "fora" só vale se o clique começou fora**: selecionar o link arrastando e soltar fora da caixa não pergunta. A
  pergunta com o pedido ainda no ar diz que o convite está sendo gerado (o link ainda não existe), e a segunda cópia anuncia
  "Link copiado." de novo (um nó novo na região). Recomendações da mesma rodada.
- **O Esc na pergunta fecha sem copiar.** O primeiro pedido de fechar (botão, Esc, toque fora) mostra a pergunta; o segundo,
  na pergunta, fecha. É o que o Chrome faria de qualquer jeito com o segundo Esc seguido, e sair nunca é mais difícil que
  entrar (D59). "Voltar ao convite" e "Fechar sem copiar" têm o mesmo tamanho.
- **O pedido no ar também conta como link em risco**: fechar o gerar ou o refazer com a resposta ainda por vir pergunta
  antes, com o mesmo texto, porque o link não apareceria.
- **A cópia à mão conta** (W9): sem `navigator.clipboard`, o Copiar seleciona o campo e pede a cópia; o evento `copy` do
  campo (Ctrl+C, ou o menu do toque) marca o link como copiado e anuncia "Link copiado.". A escrita recusada pela permissão
  cai no mesmo caminho da seleção.
- **A resposta atrasada** (linha de recomeço): o gerar e o refazer não fecham nada ao terminar, e por isso não chamam o
  `fecharSeAinda`; o token fica na mutação do diálogo que o pediu, que desmonta entre uma abertura e outra (o diálogo modal
  não deixa abrir outro sem fechar este), e o `reset()` ao fechar a solta. O revogar fecha, e usa `fecharSeAinda(aberta)`
  com a abertura em que saiu. Prova: o e2e "recomeço" (a resposta do refazer da primeira escola com o refazer da segunda
  aberto, no mesmo tipo de diálogo; a do revogar com outro diálogo aberto) — trocar o `fecharSeAinda` por `fechar` deixa o
  e2e vermelho; a do refazer é garantida pela estrutura (mutação por instância), e só fica vermelha se o token subir para a
  tela ou para um cache compartilhado.
- **O `NAO_ENCONTRADO` do gerar tem texto próprio**, "Essa escola não foi encontrada. A lista foi atualizada.": o W10 não o
  lista, porque no MVP nenhuma escola sai do sistema (F16), mas a API o devolve (E7), e o texto segue o dos outros dois. O
  `NAO_ENCONTRADO` do refazer usa o do revogar ("Esse convite já não vale…").
- **"Ativa" no W1 chega com a senha nova**: a conta nova da coordenadora define a senha e é ativada na mesma transação do
  aceite (E15(d)); o segundo fator é configurado depois, e não muda o estado da escola.
- **O e2e usa escolas próprias com o nome que abre a lista por nome** (`semearEscolaDoConvite`), e confere o banco pelos
  convites em aberto. Como as escolas que a tela cria, elas não são apagadas no fim (a limpeza do banco de teste é correção à
  parte).
- **`docs/lgpd.md`, linha do convite de coordenador**: gerado ou refeito pelo painel, com o link uma vez, só no diálogo
  (recomendação da 3.0 do `privacy-guardian`, aplicada com a tela que a torna verdade).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-25 06:29:46 | 2026-09-25 06:32:06 | `test-engineer` | 1 | REPROVADO | a4fd54c5def90f5da |
| 2026-09-25 07:16:13 | 2026-09-25 07:16:52 | `test-engineer` | 2 | APROVADO | a503591d727b47135 |
| 2026-09-25 07:17:19 | 2026-09-25 07:18:13 | `privacy-guardian` | 1 | APROVADO | a5d317a2eb88623af |
| 2026-09-25 07:17:05 | 2026-09-25 07:19:02 | `revisor-geral` | 1 | APROVADO | a6040a2560101aeed |
| 2026-09-25 07:17:11 | 2026-09-25 07:19:23 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a4199945f928aed0c |
| 2026-09-25 07:38:44 | 2026-09-25 07:40:03 | `test-engineer` | 3 | APROVADO | af12beb223c27da3f |
| 2026-09-25 07:40:34 | 2026-09-25 07:41:00 | `privacy-guardian` | 2 | APROVADO | a45bda6ed6d4af955 |
| 2026-09-25 07:40:17 | 2026-09-25 07:41:19 | `frontend-reviewer` | 2 | APROVADO | a25d3fbfbfb0b6716 |
| 2026-09-25 07:40:25 | 2026-09-25 07:41:31 | `revisor-geral` | 2 | APROVADO | a21e9737ad2bd2cf0 |

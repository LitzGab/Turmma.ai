# Tarefa 6.0 — Web: Escolas, Nova rede e Nova escola

**Funcionalidade:** apresentacao-painel · **Depende de:** 1.0, 5.0 · **Paralelo com:** nenhuma
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O operador vê as escolas lado a lado, com estado e contagens, e cria rede e escola por diálogo, com
revisão do endereço, no computador da escola e no celular.

## Contexto necessário

- `docs/visao-produto.md`, `docs/interface.md` seções 5a e 6
- `techspec.md` seções 4 e 9
- `cenarios.md`: W6, W7, W8, W10
- `.claude/rules/50-frontend.md` (itens 1, 2, 5, 8, 11, 12)
- `tasks/prd-apresentacao-operacao/techspec.md` seção 9 e o código da área:
  - `apps/web/src/operacao/rotas.tsx` — o `Inicio` com a casca vazia, que dá lugar a Escolas; o cliente
    de consultas próprio da operação
  - `apps/web/src/operacao/componentes/CascaDaOperacao.tsx`, `textos.ts`, `titulo.ts`, `caminhos.ts`
  - `apps/web/src/operacao/api/sessao.ts` — `chamarComSessaoDeOperador`
  - `apps/web/src/componentes/` — `Botao`, estados, e o padrão dos diálogos do F1
- `.size-limit.json` — o teto de 60 kB do chunk `operacao-*` (B1) e o `nome-dos-chunks.test.ts` (B2)

## Subtarefas

- [x] 6.1 — Navegação da casca (Escolas, Uso) e a rota `/operacao` com a tela Escolas: tabela no
  Chromebook, um cartão por escola abaixo de 640 px; estado com o texto da W10 e a cor só de reforço;
  `pagina` e `ordem` na query string; `placeholderData` na troca; os quatro estados, com os vazios da W7
- [x] 6.2 — Diálogo Nova rede e diálogo Nova escola: o UUID do pedido nasce ao abrir e morre ao fechar;
  "Endereço da escola" com a prévia `/e/<slug>` e a regra de formato visível; passo de revisão (rede,
  nome, endereço, "o endereço não muda depois"); sem rede, "Crie a rede primeiro". `CONFLITO` do slug no
  campo, com o texto da W10. Foco preso no diálogo e devolvido ao botão que o abriu
- [x] 6.3 — Se o chunk passar de 60 kB brotli, as páginas vão para chunks `operacao-*` (não passou: 11,2 kB com as três telas; nada a separar)
- [x] 6.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/operacao/rotas.tsx`, `caminhos.ts`, `textos.ts` | alterado |
| `apps/web/src/operacao/componentes/CascaDaOperacao.tsx` | alterado |
| `apps/web/src/operacao/paginas/Escolas.tsx`, `NovaRede.tsx`, `NovaEscola.tsx` | novo |
| `apps/web/src/operacao/api/painel.ts` | novo |
| `apps/web/src/operacao/estados-da-escola.ts` e o teste | novo |
| `e2e/operacao-escolas.spec.ts` e fixture | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W6 (Escolas) | e2e | 30 escolas (uma com nome longo e slug no limite), página e ordem, em `chromebook` e `celular`: sem rolagem horizontal a 360 px, também no diálogo com a prévia; o texto de cada estado aparece na tela |
| W7 (Escolas, Nova escola) | e2e | carregando, vazio com a ação, erro com "Tentar de novo" no 503, com dado; "Crie a rede primeiro"; axe em todos, nos dois projetos |
| W8 (criar escola) | e2e | criar rede e escola só com Tab e Enter; foco preso e devolvido |
| W10 (estados, rede e escola) | unidade e e2e | o texto de cada estado, sem identificador; `CONFLITO` do slug no campo; 429 com o N do `Retry-After`; 401 leva à entrada; 503 `TEMPO_ESGOTADO`. Na tela, pela W6 e pela W7 |
| clique duplo | e2e | dois cliques em "Criar" enviam o mesmo `id` e a lista mostra uma escola |
| recomeço da tela | e2e | reabrir o diálogo sorteia outro `id`; sair e entrar outro operador na aba não mostra a lista do primeiro |

## Divergências resolvidas nesta tarefa

- **O item "Uso" da navegação entra na 8.0, com a tela dele.** A 6.1 pedia a navegação "(Escolas, Uso)"; com a rota
  `/operacao/uso` ainda inexistente, o item levaria a "Página não encontrada". A navegação nasce como lista
  (`ITENS_DA_NAVEGACAO`, em `CascaDaOperacao.tsx`) com Escolas, e a 8.0 acrescenta uma linha (`docs/interface.md` 11.1: cada
  item nasce com a tela dele). Não cria regra; subiu para a seção 9 da Tech Spec.
- **O `/eu` deixa de segurar a tela.** Na A0, a casca esperava o `/eu` para mostrar o conteúdo. Agora a casca (`ComSessao`,
  em `rotas.tsx`) carrega o `/eu` e a lista juntos, sem duas idas e voltas em série no Fast 3G; o 503 do `/eu` fica no alto,
  com "Tentar de novo", e a tela embaixo. A prova da A0 (E2, `operacao.spec.ts`) continua a mesma e verde. Subiu para a
  seção 9 da Tech Spec.
- **Os textos do W10 moram em `apps/web/src/operacao/textos.ts`**, e não no catálogo de `packages/shared`, como a A0 decidiu
  para toda tela da operação (o catálogo inteiro vai na entrada que o Chromebook da escola baixa). Reaproveitam do catálogo o
  `MENSAGENS_DE_ERRO` e o `formatarEspera`. O `textoDaFalha` da operação ganhou o 429 (com o N do `Retry-After`) e o 503
  `TEMPO_ESGOTADO` do W10, e isso vale para todas as telas da operação que o usam (a casca e o convite do operador), que antes
  mostravam o texto geral do catálogo para esses dois códigos. Prova: `textos.test.ts` e o W10 do e2e.
- **O 401 no meio do diálogo mostra "Sua sessão terminou. Entre de novo para continuar."**, o texto do catálogo que a A0 já
  deixa na entrada (E2 da A0), e não o "Sua sessão terminou. Entre de novo." abreviado do cenário: é a mesma mensagem, pelo
  mesmo caminho (`chamarComSessaoDeOperador` → `sessaoEncerrada`), e um segundo texto para o mesmo fato não ajudaria ninguém.
- **Os 44 × 44 px do W6 conferem as ações desta tela** (Nova escola, Nova rede, as duas ordens, Próxima). Os botões de ação
  do cartão são os do convite (gerar, refazer, revogar), que chegam na 7.0, e o W6 dela os confere.
- **O tipo da rede começa em "Escola independente"**: o diálogo inteiro se preenche com Tab e Enter (W8), sem a seta que o
  grupo de opções pede para trocar de tipo. Quem cria a rede de uma prefeitura ou de um grupo muda o tipo.
- **A rede criada na tela vem escolhida no Nova escola** (a `redeSugerida` de `Escolas.tsx`): é o fluxo rede → escola do W1 e
  do W8, e sem ela o seletor pediria a seta. Prova: W8 (`option:checked` é a rede recém-criada).
- **`Campo` ganhou `erro` e `ref`**: o texto do erro embaixo do campo, no `aria-describedby`, com `aria-invalid`; e o `ref`
  para o foco voltar ao endereço no `CONFLITO`. Sem `erro`, o campo sai como antes (as telas da escola não mudam).
- **O e2e semeia as escolas com o maior uso do banco** (`e2e/__fixtures__/painel.ts`): o banco de teste guarda milhares de
  escolas e redes das outras suítes, e a lista é de todas. As escolas do W6 vêm primeiro na ordem `uso`, com um valor que
  cresce com o relógio, e são apagadas no fim; a rede que o teste escolhe no seletor tem um nome que vem antes das outras
  (o `GET /redes` corta em 200). Os testes conferem a tela contra a resposta que ela recebeu, nunca contra posição de id.
- **O `CONFLITO` depois de uma tentativa incerta não é "endereço repetido"** (achado da 1ª rodada do `test-engineer`). Se a
  conexão cai (`INDISPONIVEL_TENTE_DE_NOVO`, ou resposta fora do contrato) o servidor pode ter criado a escola; se o operador
  volta, muda os dados e tenta de novo com o mesmo id, o servidor responde `CONFLITO` (7c: o mesmo id com outros dados). A
  tela, nesse caso, fica na revisão com "A tentativa anterior pode ter criado a escola antes de a conexão cair. Feche este
  diálogo e confira a lista antes de tentar de novo.", em vez de mandar trocar um endereço que está livre; o id continua o
  mesmo, e nenhuma segunda escola nasce. Regra da tela, sem chamada nova nem gravação: quem chama é o operador com sessão, uma
  vez por clique. Prova: `ehResultadoIncerto` em `textos.test.ts` e o e2e "clique duplo e resposta perdida" (o endereço
  mudado não existe no banco, o primeiro existe uma vez só, e o texto é o da tentativa incerta). Decisão consciente: depois de uma tentativa
  incerta, o `CONFLITO` com dados mudados mostra "confira a lista" mesmo quando o endereço novo é, de fato, de outra escola
  — a tela não distingue os dois casos, e o texto conservador é o que não leva a uma segunda escola.
- **Um pedido no ar por vez, na hora** (achado do mesmo e2e): o `isPending` da mutação só chega à tela no próximo render, e o
  segundo clique de um clique duplo saía antes dele (dois `POST`, com o mesmo id; o servidor devolvia a mesma escola). Um
  `useRef` segura o segundo em Nova rede e Nova escola. Prova: o e2e do clique duplo, com o primeiro `POST` seguro no teste,
  conta um pedido só, nos dois diálogos.
- **Com um diálogo aberto, o aviso de inatividade aparece dentro dele** (achado da 1ª rodada do `frontend-reviewer`). O
  `dialog` modal deixa inerte tudo fora dele, e o aviso da casca ficaria sem foco e fora da árvore de acessibilidade (D59;
  WCAG 2.2.1). A casca (`ComSessao`) conta os diálogos abertos por contexto (`AvisoDeInatividade.tsx`); com um aberto, ela
  para de desenhar o aviso, e o `DialogoDaOperacao` o desenha dentro de si. Prova: o e2e "o aviso de inatividade com um
  diálogo aberto", nos dois projetos (dentro do diálogo, um só na página, Tab até "Continuar na sessão", Enter ou toque,
  axe; fechado o diálogo, o aviso volta à casca).
- **A resposta que chega depois de o diálogo fechar não fecha o outro** (recomendação do mesmo revisor): o anúncio sai, e
  só a abertura em que o pedido saiu é fechada — nem o diálogo do outro tipo, nem o mesmo diálogo reaberto depois do
  "Cancelar". Até a correção `2026-09-25-resposta-atrasada-fecha-o-dialogo-reaberto` a guarda comparava só o tipo, e o
  Nova escola reaberto era fechado pela resposta do cancelado; agora cada abertura tem um número
  (`useDialogoDaTela`, `apps/web/src/operacao/dialogo-aberto.ts`). Prova: o e2e "clique duplo e resposta perdida", nos
  trechos da troca de tipo e da reabertura do mesmo diálogo, e `dialogo-aberto.test.ts`.
- **A revisão do Nova escola tem "Cancelar"**, como os outros passos: sair do diálogo nunca é mais difícil que seguir nele
  (D59), e o Esc faz o mesmo.
- **`entrarNaOperacao`, `acionar` e `esperarCasca` foram para `e2e/__fixtures__/tela-da-operacao.ts`**, de onde o
  `operacao.spec.ts` e o spec novo os importam, em vez de copiar.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As ações de convite na linha (7.0) e a tela Uso (8.0).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-25 03:44:10 | 2026-09-25 03:47:16 | `test-engineer` | 1 | REPROVADO | ab9a0c83a8bee0371 |
| 2026-09-25 04:19:10 | 2026-09-25 04:20:49 | `test-engineer` | 2 | REPROVADO | a099272a74eeb2387 |
| 2026-09-25 04:35:00 | 2026-09-25 04:35:22 | `test-engineer` | 3 | APROVADO | a083b1dfd5b985100 |
| 2026-09-25 04:35:42 | 2026-09-25 04:36:30 | `privacy-guardian` | 1 | APROVADO | aba2bb8f93be131e7 |
| 2026-09-25 04:35:36 | 2026-09-25 04:37:18 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | ac2a96c903702f662 |
| 2026-09-25 04:35:30 | 2026-09-25 04:37:32 | `revisor-geral` | 1 | APROVADO | afc35ac39b3d9e60e |
| 2026-09-25 04:53:55 | 2026-09-25 04:55:58 | `test-engineer` | 4 | APROVADO | ab1c82c3f511dc034 |
| 2026-09-25 05:18:42 | 2026-09-25 05:19:34 | `test-engineer` | 5 | APROVADO | afb724c29a627c338 |
| 2026-09-25 05:19:59 | 2026-09-25 05:20:22 | `privacy-guardian` | 2 | APROVADO | a9a5c9122693c71b7 |
| 2026-09-25 05:19:54 | 2026-09-25 05:20:35 | `revisor-geral` | 2 | APROVADO | a520b6d065fe8c279 |
| 2026-09-25 05:19:48 | 2026-09-25 05:21:06 | `frontend-reviewer` | 2 | APROVADO | ad16ddb4d8cc57683 |

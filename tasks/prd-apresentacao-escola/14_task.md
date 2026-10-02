# Tarefa 14.0 — Web: Professores e o aceite do convite pelo professor

**Funcionalidade:** apresentacao-escola · **Depende de:** 11.0, 3.0 · **Paralelo com:** 4.0 a 10.0, 13.0, 15.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A coordenação cadastra o professor, copia o link que aparece uma vez, e refaz ou revoga o convite; o professor abre o
link, cria a senha (ou entra com a conta que já tem) e chega à tela "Turmas" para confirmar os vínculos.

## Contexto necessário

- `docs/interface.md` 11.1; `docs/fluxos.md`, fluxo do convite
- `techspec.md` seções 4 (professores; `convites/consultar` e `/aceitar` não mudam), 9 e 13 (conta global)
- `cenarios.md`: W14, W4 (linha "Professores"), W12
- `.claude/rules/50-frontend.md`; regra 20 (item 8)
- `tasks/prd-apresentacao-painel/retro.md`, proposta 4, e `achados/indice.md`, linhas da 7.0 e da 10.0: o link fora do
  cache, o segundo Esc, o `hashchange` com o aceite em andamento
- Código:
  - `apps/web/src/operacao/componentes/DialogoDoConvite.tsx`, `DialogoDaOperacao.tsx`, `ConfirmarConvite.tsx`,
    `apps/web/src/operacao/acoes-do-convite.ts`, e `Escolas.tsx`, que os usa
  - `apps/web/src/componentes/BotaoCopiar.tsx` — a cópia com reserva sem `navigator.clipboard`
  - `apps/web/src/paginas/Convite.tsx` — o aceite do coordenador, com o token no fragmento; o professor usa a mesma
  - `e2e/operacao-convite-coordenacao.spec.ts`, `e2e/convite.spec.ts`

## Subtarefas

- [x] 14.1 — (O `Dialogo.tsx`, a `CLASSES_DO_BOTAO_SECUNDARIO` e o `useDialogoDaTela` já saíram para `componentes/` na
  13.0, com o `DialogoDaOperacao` como o `Dialogo` mais o aviso de inatividade.) O diálogo de convite de cópia única sai
  de `apps/web/src/operacao/` para `apps/web/src/componentes/`,
  sem nada da operação dentro; a operação passa a importar de lá, sem mudar de comportamento. O `nome-dos-chunks`
  continua impedindo a escola de baixar o chunk da operação
- [x] 14.2 — Tela Professores: cadastrar (nome e e-mail, `autocomplete="off"`), o resumo antes de enviar ("vale 7
  dias", "o link aparece uma vez"), o link com Copiar e "Link copiado" anunciado, fechar sem copiar pergunta; a lista
  com o estado do convite; refazer e revogar com confirmação. A mutation com `gcTime: 0` e `reset()` ao fechar
- [x] 14.3 — Aceite do professor em `paginas/Convite.tsx`: conta nova cria a senha e vai à entrada; o link refeito,
  vencido ou revogado mostra o convite inválido com "peça outro à coordenação"
- [x] 14.4 — Linha "Professores" na tabela de navegação; o teto do chunk `coordenacao-*` revisto
- [x] 14.5 — Testes; o e2e da A0b roda junto

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/DialogoDoConvite.tsx`, `Dialogo.tsx` (saídos de `operacao/componentes/`) | novo |
| `apps/web/src/operacao/paginas/Escolas.tsx`, `operacao/componentes/*` | alterado |
| `apps/web/src/areas/coordenacao/Professores.tsx`, `apps/web/src/api/professores.ts`, `areas/navegacao.ts` | novo, alterado |
| `apps/web/src/paginas/Convite.tsx` | alterado |
| `.size-limit.json`, `e2e/professores.spec.ts`, `e2e/convite.spec.ts` | alterado, novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W14 | e2e | conta nova cria a senha e vai à entrada; o link refeito mostra o convite inválido com "peça outro à coordenação" |
| W4 (Professores) | e2e | os quatro estados; o vazio "Nenhum professor ainda" com Cadastrar; vazio e erro com a rota interceptada |
| W12 (Professores) | e2e | 360 px sem rolagem, também no diálogo; alvos de 44 px; cadastrar e copiar só com Tab e Enter; Esc cai na pergunta, e o segundo fecha |
| link fora do cache | unidade | fechado o diálogo, nenhuma entrada do `MutationCache` guarda o link |
| clique duplo | e2e | dois cliques em "Cadastrar" mostram um link só, e a lista termina com um convite em aberto |
| A0b | e2e | `e2e/operacao-convite-coordenacao.spec.ts` verde sem mudar asserção |
| recomeço da tela | e2e | segunda pessoa: outra coordenação na mesma aba não vê lista nem diálogo da primeira; mesmo link: colar de novo o mesmo convite na aba não prende a tela com o token na barra; resposta atrasada: o aceite do link anterior que responde depois do `hashchange` não entra; falha com o diálogo aberto: o `CONFLITO` do refazer recarrega a lista, e o aviso e o foco da tentativa anterior saem |
| log novo | — | a tarefa não escreve log |
| sessão vencida com o link na tela (divergência) | e2e | o diálogo do convite sai da página quando a sessão da aba vence, e o link não fica atrás do login por cima; "Entrar com outra conta" não deixa nada do professor |
| link fora do cache sem `reset()` (divergência) | unidade | o diálogo desmontado sem `reset()` também não deixa a resposta no `MutationCache` |
| erro com a lista na tela | e2e | a releitura que cai depois de revogar mantém a lista, com o erro e o "Tentar de novo" por cima |
| e-mail já cadastrado | e2e e unidade | o `CONFLITO` do cadastro diz o que fazer sem dizer de quem é o e-mail, e a pessoa volta e corrige |
| aceite pelos dois tipos (divergência) | e2e e unidade | expirado, revogado, já usado e inexistente, do coordenador e do professor, mostram a mesma tela, com a quem pedir e "Entrar"; o professor que já tem conta aceita sem senha nova |
| consulta que cai (divergência) | e2e | a consulta com 503 mostra o erro com "Tentar de novo", e não a tela do convite que não vale; a nova tentativa usa o token da memória |
| fragmento quebrado (divergência) | e2e | o `#` com `%` solto mostra "O endereço do convite está incompleto", na carga e no `hashchange`, sem derrubar a tela |
| aceite usado no meio | e2e | o convite revogado entre a consulta e o aceite mostra a tela do convite que não vale, sem o nome da escola |
| aceite descartado (divergência) | unidade | o aceite que volta depois de outro link não guarda bilhete nem desafio, dê certo ou não, e não apaga o do link novo |
| clique duplo no aceite | e2e | dois cliques no mesmo instante em "Aceitar o convite" mandam um aceite |
| consulta atrasada (1ª rodada do `test-engineer`) | e2e | a consulta do link anterior que responde depois de outro link chegar à aba, valendo, recusada ou caindo, não troca a tela do link novo, e o aceite seguinte leva o token do novo |
| recadastro do revogado; refazer do vencido; lista incompleta | e2e | cadastrar de novo o e-mail do revogado chama a mesma pessoa de volta, numa linha só; o vencido refeito passa a em aberto; a lista acima do teto de páginas avisa que mostra só os primeiros |
| erro com a lista ainda vazia (1ª rodada do `frontend-reviewer`) | e2e | o primeiro cadastro com a releitura caindo mostra o erro com "Tentar de novo", e não "Nenhum professor ainda"; o foco vai para o título da tela |
| falha com a pergunta de fechar aberta (1ª rodada do `frontend-reviewer`) | e2e | o pedido recusado com a pergunta aberta, no cadastro e no refazer, volta à etapa dele com o aviso e o foco nele; a nova tentativa não cai de volta na pergunta |
| foco no passo da senha (1ª rodada do `frontend-reviewer`) | e2e | depois do aceite pelo teclado, o foco está no campo "Senha nova" |
| nome repetido (recomendação do `frontend-reviewer`) | e2e e unidade | o resumo avisa o nome que já está na lista, sem contar maiúscula, acento nem espaço, e não impede o cadastro |
| foco depois do "Voltar e corrigir" (2ª rodada do `frontend-reviewer`) | e2e | com o aviso do e-mail já cadastrado na tela, "Voltar e corrigir" leva o foco ao campo do nome, e o aviso sai |
| caminho até Professores (herdado da 13.0) | e2e e unidade | o roteiro e o vazio da Alocação levam à tela; o título do vazio diz só o que falta |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [x] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral` e os guardiões, com
  rodada que vale para o código atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Herdado da 3.0

- **Clique duplo em refazer** (`test-engineer`, 1ª rodada da 3.0): o refazer vai pelo `usuarioId`, e dois pedidos
  seguidos respondem 201 os dois, com o primeiro link já revogado pelo segundo (teste "dois refazer do mesmo professor em
  paralelo" em `apps/api/test/professores.int.test.ts`). A tela trava o botão enquanto o pedido está no ar e mostra só o
  link da última resposta.
- **Alocação antes do aceite**: decidida pelo Joaquim em 27/09/2026 e feita na 13.0 (Tech Spec, seção 13): a alocação
  aceita o professor com convite em aberto, e o vínculo só alcança a turma depois do aceite e da confirmação.

## Herdado da 13.0

- **O caminho até Professores** (`frontend-reviewer`, 1ª rodada da 13.0): o vazio da Alocação ("Falta: … um professor
  cadastrado…") e o passo "Professores" do roteiro da Estrutura não levam a lugar nenhum, porque a tela Professores chega
  aqui. Esta tarefa põe o link nos dois (`apps/web/src/areas/coordenacao/Alocacao.tsx` e `Estrutura.tsx`), e acerta o
  título do vazio da Alocação com o W4 do `cenarios.md`: "Crie uma turma e um professor primeiro" aparece também quando
  só falta a disciplina (2ª rodada).
- **O professor de convite vencido ou revogado não aparece na alocação**: é nesta tela que a coordenação refaz o convite
  (ou cadastra de novo o e-mail do revogado, que chama o mesmo usuário de volta, com o vínculo pendente de antes).

## Fora do escopo desta tarefa

Envio do link por e-mail; a alocação (13.0); o confirmar e contestar vínculo, que é a tela "Turmas" (11.0).

## Divergências resolvidas nesta tarefa

Registradas também na `techspec.md`, seção 9 ("Decidido na 14.0") e seção 13 (a borda do aviso "Senha criada"), no
`cenarios.md` (W4 de Professores e de Alocação, W14)
e em `docs/interface.md`, seção 3.

- **O diálogo do convite virou duas peças genéricas** em `componentes/DialogoDoConvite.tsx` (`DialogoDeConviteNovo` e
  `DialogoDeConviteRefeito`), e não só o arquivo mudou de pasta: a moldura (o `Dialogo`, ou o `DialogoDaOperacao` com o
  aviso de inatividade), os textos, a mutação e o texto de cada falha vêm de quem usa. O arquivo da operação ficou com os
  dois invólucros (`GerarConvite`, `RefazerConvite`), e o e2e da A0b passa sem mudar asserção. Foram junto o
  `linkDoConvite` e o `copiarLink` (`componentes/link-do-convite.ts`, com o teste de unidade deles) e a leitura do pedido
  pelo contrato (`componentes/pedido-de-convite.ts`, com os dois textos de campo, que a operação importa de lá). O
  `ConfirmarConvite` continua na operação: o revogar da escola é a `ConfirmacaoDePerigo` da 13.0, com o `perigo` cheio.
- **O `CONFLITO` do cadastro não é "a lista mudou"**: é o e-mail digitado, e o diálogo continua com "Voltar e corrigir". O
  texto não diz de quem é o e-mail (a lista não o mostra, E11): "Este e-mail já é de um professor desta escola, ativo ou
  com o convite em aberto. Confira o e-mail; para um link novo, use Refazer na lista."
- **Regra nova: o diálogo aberto sai quando a sessão da aba muda** (`aoTrocarDeSessao`, em `Professores.tsx`). Sem isso, o
  link do convite — credencial de um professor — ficava na tela, atrás do fundo do login por cima, depois de a sessão
  vencer por inatividade (regra 20, item 8). Quem chama: só a aba, quando a sessão vence ou outra entra; não grava nada
  nem chama a API. A coordenação não perde nada: a volta dela passa pelo segundo fator, que já desmonta a área. Com isso
  o diálogo sai sem `reset()`, e quem tira a resposta do `MutationCache` é o `gcTime: 0`; as duas coisas têm teste (linhas
  "sessão vencida" e "link fora do cache sem `reset()`").
- **O aceite serve aos dois tipos de convite com os mesmos textos.** A consulta diz só a escola (`convites/consultar` não
  muda), e o convite que não vale não diz de que tipo era. Por isso: "Você foi convidado para entrar em …" no lugar de
  "para a coordenação de …"; a senha nova sem "depois dela, você configura o segundo fator"; e o texto do convite que não
  vale passou a "Este convite não vale mais. Peça outro à coordenação da sua escola. Se o convite era para a coordenação,
  peça a quem enviou o link." (`packages/shared/src/erros/mensagens.ts`; vale também na entrada e no segundo fator, que
  usam o mesmo texto). A tela do convite que não vale ganhou "Já aceitou o convite? Entrar": o professor que abre de novo
  o link que já usou só precisa entrar.
- **O professor com a conta nova vai à entrada com outro aviso** ("Senha criada. Entre com o seu e-mail e a senha que você
  acabou de criar."), e não com o de quem já tinha conta. A tela decide pelo que ela mandou: aceite com senha que responde
  `entrar` é o professor com a conta nova. Borda aceita: se outro convite da mesma conta definiu a senha entre a consulta
  e o aceite, a API ignora a senha digitada e o aviso diz "senha criada"; a entrada recusa, e o caminho é o outro convite.
- **"Chega à tela Turmas" é pelo link da página inicial** do professor (11.0), e não por um destino novo do login: o W14 diz
  "vai à entrada", e a entrada termina na página inicial dos três papéis (Tech Spec, seção 9, "Decidido na 11.0").
- **Regra nova: a consulta que cai por rede ou servidor tem "Tentar de novo"**, em vez de mostrar o texto do catálogo na
  caixa do convite inválido sem botão. O token já saiu da barra, e recarregar o perderia.
- **Regra nova: o `hashchange` recomeça a tela e o aceite é conferido contra a vez do link** (`aceitarConviteNaVez`), como na
  operação (A0b, 10.0), com duas diferenças: o aceite descartado **não chega a guardar** o bilhete nem o desafio (lá ele
  guarda e esquece), e por isso o aceite do link anterior não precisa segurar o botão do link novo (a recomendação do
  `frontend-reviewer` da 10.0 da A0b). O `aceitarConvite` saiu: só existia para a tela, que agora usa o outro.
- **O fragmento que não é token** (`%` quebrado) mostrava a tela em branco: o `decodeURIComponent` lançava na primeira
  renderização. Agora cai em "O endereço do convite está incompleto".
- **Título do vazio da Alocação** montado com o que falta (`o-que-falta-para-alocar.ts`), e o link "Ir para Professores" só
  quando falta o professor (herdado da 13.0).
- **`Linha` e `AvisoDeListaIncompleta`** saíram de `Estrutura.tsx` para `areas/coordenacao/pecas-da-lista.tsx`: a lista de
  professores é desenhada como as da Estrutura.
- **Formato do token** (pendência da 4.0, no `TODO.md`): o contrato do convite de professor passou a usar o
  `esquemaTokenDeLink`. O `FORMATO_DO_REFRESH` da API de sessão ficou no `TODO.md`, para correção própria: mexer em
  `apps/api/src/sessao/renovacao.service.ts` numa tarefa de tela traria o `infra-guardian` sem ganho.
- **Teto do `coordenacao-*`: continua 20 kB** (mede ~14,5 kB). O diálogo do convite fica num `parte-*` dividido com a
  operação, que conta no primeiro carregamento: 123,8 kB de 150 (era 120,9).
- **Regra nova (1ª rodada do `frontend-reviewer`): a pergunta de fechar só vale enquanto há link em risco.** O pedido que
  falha com a pergunta aberta (a pessoa pediu para fechar com o pedido no ar) tira a pergunta e volta à etapa dele, com a
  falha à vista e o foco nela; antes, a pergunta passava a dizer "o link aparece uma vez só" de um link que não existia, e
  "Fechar sem copiar" escondia a recusa. Mora em `componentes/DialogoDoConvite.tsx`, e por isso vale também para o convite
  da coordenação, na operação: é a única mudança de comportamento dela nesta tarefa, e o e2e da A0b continua verde sem
  mudar asserção (ele não tinha esse caminho).
- **O erro da releitura com a lista ainda vazia** (1ª rodada do `frontend-reviewer`): depois do primeiro cadastro, se a
  releitura cai, a tela mostra o erro com "Tentar de novo", e não o vazio, que negaria o cadastro. Sem a lista na tela, o
  foco de reserva vai para o título da tela.
- **O passo da senha leva o foco ao campo "Senha nova"** (1ª rodada do `frontend-reviewer`; o defeito vinha do F1): o
  "Aceitar o convite" sai da tela com esse passo, e o foco caía no `body`.
- **"Voltar e corrigir" solta a falha do pedido** (2ª rodada do `frontend-reviewer`): com o foco deixado para o alerta
  quando a etapa volta por falha, o "Voltar e corrigir" depois de uma recusa deixava o foco no `body`. Agora ele solta a
  falha (`reset()`), e o foco vai para o campo do nome; o `reset()` que ficava no "Revisar" saiu, porque não há mais
  caminho que chegue lá com a falha.
- **Aplicadas das recomendações do `frontend-reviewer`:** o aviso do nome repetido no resumo do cadastro (`temHomonimo`,
  sem impedir, e dizendo que a mesma pessoa voltando pode seguir: o recadastro do revogado reaproveita a linha); o
  "Entrar" da tela do convite que não vale com o alvo de 44 px; o e-mail com que a pessoa entra, dito na etapa do link
  do cadastro ("Mande o link a …, que entra com o e-mail …"; no refazer não, porque a lista não traz e-mail); e os
  textos sem gênero ("Mande o link a …", "As turmas já alocadas a essa pessoa…", "para a pessoa convidada entrar…"), com
  o nome da escola uma vez só no passo da senha.
- **Os dois textos do convite que mudou** ("O convite mudou. A lista foi atualizada." e "Esse convite já não vale. A lista
  foi atualizada.") moram em `componentes/textos-do-convite.ts`, para a operação e a escola (recomendação do
  `revisor-geral`); `operacao/textos.ts` e `operacao/pedidos-do-painel.ts` deixaram de reexportar o que saiu para
  `componentes/`, e quem usa importa de lá.
- **Arquivos previstos que não mudaram:** `apps/web/src/operacao/paginas/Escolas.tsx` (ele importa `GerarConvite` e
  `RefazerConvite` do invólucro da operação, que manteve o nome e as props).
- **Arquivos previstos que não existem com esse nome:** `apps/web/src/componentes/Dialogo.tsx` já tinha vindo na 13.0.
  Novos fora da lista: `componentes/link-do-convite.ts`, `componentes/pedido-de-convite.ts`,
  `componentes/textos-do-convite.ts`, `areas/coordenacao/convite-de-professor.ts`, `o-que-falta-para-alocar.ts`,
  `pecas-da-lista.tsx`, e os testes deles.

## Mutações

Rodadas em 02/10/2026, cada uma restaurada antes da seguinte. As de unidade, uma por vez
(`apps/web/src/api/professores.test.ts`, `etapas-do-login.test.ts`, `areas/coordenacao/convite-de-professor.test.ts`,
`o-que-falta-para-alocar.test.ts`, `areas/navegacao.test.ts`, `packages/shared/src/erros/mensagens.test.ts`). As da tela
no e2e (`e2e/professores.spec.ts`, `e2e/convite.spec.ts` e os dois testes de W4 de `e2e/estrutura.spec.ts`), nos projetos
`chromebook` e `celular`, com a web do compose de teste reconstruída a cada lote; em cada lote, uma mutação por teste, e a
que ficou vermelha por causa de outra do mesmo lote foi rodada de novo sozinha. O que está entre crases na coluna da
direita é a asserção que falhou, nos dois projetos. As duas da guarda da consulta atrasada e a do aviso da lista incompleta
foram rodadas depois da 1ª rodada do `test-engineer`, com os testes que ela pediu; as do que a 1ª rodada do
`frontend-reviewer` pediu (o erro com a lista vazia, a pergunta que sai, o foco na falha e no campo da senha, o nome
repetido, o e-mail na etapa do link, o alvo do "Entrar"), depois dela; e a do "Voltar e corrigir" que solta a falha,
depois da 2ª. As linhas são as do código de agora.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `apps/web/src/api/professores.ts:48` (`gcTime: 0` do cadastro) | unidade: "fechado o diálogo do cadastro (reset), nenhuma entrada do MutationCache guarda o link…" |
| `apps/web/src/api/professores.ts:57` (`gcTime: 0` do refazer) | unidade: "o diálogo que sai sem o reset (a sessão venceu com ele aberto)…"; "a resposta do refazer que chega depois de o diálogo fechar…" |
| `apps/web/src/api/professores.ts:49` e `:58` (`onSettled` do cadastro e do refazer) | unidade: "o recarregar da lista que a tela acrescenta roda quando o pedido termina, dê certo ou não" |
| `apps/web/src/api/professores.ts:29` e `:34` (corpo `{}` do refazer; rota do revogar) | unidade: "cadastrar, refazer e revogar vão às rotas da API com a sessão…" |
| `apps/web/src/api/professores.ts:21` (contrato da resposta) e `packages/shared/src/professores/professores.ts:33` (formato do token) | unidade: "a resposta do cadastro fora do contrato (um campo de pessoa a mais, ou o token fora do formato)…" |
| `apps/web/src/api/convite.ts:58` (descarte na recusa) | unidade: "recomeço: o aceite que volta depois de outro link chegar à aba é descartado, dê certo ou não…" |
| `apps/web/src/api/convite.ts:60` (descarte no sucesso) | unidade: o mesmo, e "recomeço: o aceite descartado não apaga o bilhete que o aceite do link novo já guardou" |
| `apps/web/src/api/convite.ts:61` (guardar o bilhete) | unidade: "W14: o professor com a conta nova recebe `entrar` no aceite com senha…"; "conta que já existe: o bilhete fica em memória…" |
| `apps/web/src/api/convite.ts:62` (guardar o desafio) | unidade: "conta nova: o aceite com senha guarda o desafio de configurar_mfa…" |
| `apps/web/src/areas/coordenacao/convite-de-professor.ts:44` e `:45` (refazer e revogar pela matriz) | unidade: "cada estado oferece só o que a matriz permite…" |
| `apps/web/src/areas/coordenacao/convite-de-professor.ts:50` (o prazo em dias, do professor) | unidade: "o prazo dito é o do convite do professor, em dias" |
| `apps/web/src/areas/coordenacao/convite-de-professor.ts:80` (o pedido pelo contrato) | unidade: "o pedido sai pelo contrato estrito da API…"; "e-mail sem @, sem domínio ou vazio…" |
| `apps/web/src/areas/coordenacao/convite-de-professor.ts:56` e `:59` (o nome repetido sem contar maiúscula, acento nem espaço sobrando) | unidade: "o nome que já está na lista é reconhecido sem contar maiúscula, acento nem espaço sobrando; outro nome, não" |
| `apps/web/src/areas/coordenacao/convite-de-professor.ts:95` (texto do `CONFLITO` do cadastro) | unidade: "o CONFLITO do cadastro é do e-mail digitado…" |
| `apps/web/src/areas/coordenacao/convite-de-professor.ts:112` (textos e `listaMudou` do refazer) | unidade: "o CONFLITO e o NAO_ENCONTRADO do refazer dizem que o convite mudou…" |
| `apps/web/src/componentes/pedido-de-convite.ts:36` (o texto de cada campo) | unidade: "e-mail sem @, sem domínio ou vazio…" (o do professor e o da coordenação, em `operacao/pedidos-do-painel.test.ts`) |
| `apps/web/src/areas/coordenacao/o-que-falta-para-alocar.ts:12` (a disciplina que falta) | unidade: "falta só o que a escola não tem, na ordem em que ela se monta" |
| `apps/web/src/areas/coordenacao/o-que-falta-para-alocar.ts:27` (o título só com o que falta) e `apps/web/src/areas/coordenacao/Alocacao.tsx:88` | unidade: "o título não pede o que a escola já tem…"; e2e W4 Estrutura: `expect(alocacao).toContainText('Crie uma disciplina primeiro')`; W4 Alocação: `expect(alocacao).toContainText('Crie um professor primeiro'…` |
| `apps/web/src/areas/navegacao.ts:24` (a linha "Professores") | unidade: "W2: na A1, «Estrutura» e «Professores» da coordenação…" |
| `packages/shared/src/erros/mensagens.ts:31` (o texto do convite que não vale) | unidade: "W14 (A1): expirado, revogado, refeito, usado e inexistente pedem outro convite à coordenação…"; "W10 (A0b)…" |
| `apps/web/src/areas/coordenacao/Professores.tsx:87` (o diálogo sai quando a sessão muda) | "a sessão vence com o link na tela": `expect(dialogosAbertos(page)).toHaveCount(1)` |
| `apps/web/src/areas/coordenacao/Professores.tsx:91` (abrir apaga o anúncio) | "clique duplo": `expect(page.locator('[role="status"]').filter({ hasText: 'revogado.' })).toHaveCount(0)` |
| `apps/web/src/areas/coordenacao/Professores.tsx:85` (o foco no título da tela, sem a lista) | W4: `expect(principal(page).getByRole('heading', { level: 1, name: 'Professores' })).toBeFocused()` |
| `apps/web/src/areas/coordenacao/Professores.tsx:104` (o carregando) | W4: `expect(principal(page).getByRole('status').filter({ hasText: 'Carregando os professores…' })).toBeVisible(…` |
| `apps/web/src/areas/coordenacao/Professores.tsx:106` (o erro sem lista) | W4: `expect(principal(page).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO…`, depois de recarregar |
| `apps/web/src/areas/coordenacao/Professores.tsx:108` (o vazio) | W4: `expect(principal(page).getByText('Nenhum professor ainda')).toBeVisible(…` |
| `apps/web/src/areas/coordenacao/Professores.tsx:111` (o erro da releitura com a lista ainda vazia) | W4: `expect(principal(page).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO)`, depois do primeiro cadastro |
| `apps/web/src/areas/coordenacao/Professores.tsx:129` (o erro com a lista na tela) | W4: `expect(principal(page).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO)`, depois do revogar |
| `apps/web/src/areas/coordenacao/Professores.tsx:131` (a lista pelo nome) | W4: `expect(lista(page).getByRole('listitem').locator('p').first()).toHaveText(professores.aceito.nome)` |
| `apps/web/src/areas/coordenacao/Professores.tsx:132` (o estado em texto) | W4: `expect(linha, estado).toContainText(TEXTO_DO_ESTADO[estado])` |
| `apps/web/src/areas/coordenacao/Professores.tsx:133` (as ações pela matriz) | W4: `expect(linha.getByRole('button'), estado).toHaveText(ACOES_DO_ESTADO[estado]…` |
| `apps/web/src/areas/coordenacao/Professores.tsx:147` (o aviso da lista incompleta) | W4: `expect(principal(page)).toContainText('A lista é maior do que esta tela mostra: aparecem só os primeiros.'…` |
| `apps/web/src/areas/coordenacao/Professores.tsx:166` (o aviso do nome repetido) e `apps/web/src/componentes/DialogoDoConvite.tsx:386` (os avisos do pedido no resumo) | "falha com o diálogo aberto": `expect(noDialogo(page)).toContainText(TEXTO_DO_NOME_REPETIDO)` |
| `apps/web/src/areas/coordenacao/Professores.tsx:170` (a lista recarrega depois do cadastro) | W14: `expect(tituloDaLista(page)).toBeFocused()` (o "Cadastrar" do vazio continuava na tela) |
| `apps/web/src/areas/coordenacao/Professores.tsx:172` (o e-mail de quem entra, na etapa do link do cadastro) | W14: ``expect(noDialogo(page)).toContainText(`Mande o link a ${nome}, que entra com o e-mail…`)`` |
| `apps/web/src/areas/coordenacao/Professores.tsx:175` (foco de reserva do cadastro) | W14: `expect(tituloDaLista(page)).toBeFocused()` |
| `apps/web/src/areas/coordenacao/Professores.tsx:190` (a lista recarrega depois do refazer) | "falha com o diálogo aberto": a espera de `proximaLista(page)` |
| `apps/web/src/areas/coordenacao/Professores.tsx:195` (foco de reserva do refazer) | "falha com o diálogo aberto": `expect(tituloDaLista(page)).toBeFocused()` |
| `apps/web/src/areas/coordenacao/Professores.tsx:213` (o anúncio do revogado) | "clique duplo": ``expect(anuncio(page, `Convite de ${nome} revogado.`)).toBeVisible(…`` |
| `apps/web/src/areas/coordenacao/Professores.tsx:214` (o diálogo do revogar fecha) | "clique duplo": `expect(dialogosDaTela(page)).toHaveCount(0)` |
| `apps/web/src/areas/coordenacao/Professores.tsx:216` (a lista recarrega depois do revogar) | W12: `expect(linha).toContainText(TEXTO_DO_ESTADO.revogado)` |
| `apps/web/src/areas/coordenacao/Professores.tsx:218` (foco de reserva do revogar) | W12: `expect(tituloDaLista(page)).toBeFocused()` |
| `apps/web/src/areas/coordenacao/Professores.tsx:154`, `:180` e `:200` (a `key` da abertura) | **sobreviveu, como esperado**: nesta tela o diálogo é modal e só abre outro depois de fechar, e o fechar desmonta (a abertura vira `undefined`); a `key` fica pela regra do `useDialogoDaTela` (cada abertura é uma instância), como em Estrutura e em Escolas |
| `apps/web/src/componentes/DialogoDoConvite.tsx:64` (a pergunta sai quando o pedido falha) | "falha com a pergunta de fechar aberta": `expect(noDialogo(page).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO…` |
| `apps/web/src/componentes/DialogoDoConvite.tsx:64` (a pergunta fica quando o pedido dá certo com ela aberta, o inverso da de cima) e `apps/web/src/componentes/DialogoDoConvite.tsx:350` (o texto da pergunta com o pedido no ar) | "clique duplo": `expect(noDialogo(page)).toContainText('O link aparece uma vez só. Se fechar agora, ele não aparece de novo'…` (rodadas pelo `test-engineer`, na 4ª rodada dele) |
| `apps/web/src/componentes/DialogoDoConvite.tsx:241` (o foco fica no alerta quando a etapa volta por falha) | "falha com a pergunta de fechar aberta": `expect(noDialogo(page).getByRole('alert')).toBeFocused()` |
| `apps/web/src/componentes/DialogoDoConvite.tsx:487` (o foco fica no alerta, no refazer) | "falha com a pergunta de fechar aberta": `expect(noDialogo(page).getByRole('alert')).toBeFocused()`, no refazer (rodada pelo `test-engineer`, na 3ª rodada dele) |
| `apps/web/src/areas/coordenacao/Professores.tsx:166` (o aviso do nome repetido sempre ligado, o inverso da de cima) | "falha com o diálogo aberto": `expect(noDialogo(page)).not.toContainText(TEXTO_DO_NOME_REPETIDO)` (rodada pelo `test-engineer`, na 3ª rodada dele) |
| `apps/web/src/componentes/DialogoDoConvite.tsx:333` ("Voltar e corrigir" solta a falha, e o foco vai para o campo do nome) | "falha com o diálogo aberto": `expect(noDialogo(page).getByLabel('Nome do professor')).toBeFocused()`, depois do "Voltar e corrigir" com o aviso do e-mail na tela |
| `apps/web/src/componentes/DialogoDoConvite.tsx:338` (a trava do pedido no ar, convite novo) | "clique duplo": `expect.poll(() => pedidos).toBe(1)`, no cadastrar |
| `apps/web/src/componentes/DialogoDoConvite.tsx:490` (a trava do pedido no ar, refazer) | "clique duplo": `expect.poll(() => pedidos).toBe(1)`, no refazer |
| `apps/web/src/areas/coordenacao/dialogos.tsx:40` (a trava do envio único, no revogar) | "clique duplo": `expect.poll(() => pedidos).toBe(1)`, no revogar |
| `apps/web/src/componentes/DialogoDoConvite.tsx:500` (o toque fora pergunta) | W14: `expect(pergunta(page)).toBeFocused()`, no toque fora |
| `apps/web/src/componentes/DialogoDoConvite.tsx:499` (o navegador fechando desmonta) | W12: `expect(dialogosDaTela(page)).toHaveCount(0)`, depois do `dialogo.close()` |
| `apps/web/src/componentes/DialogoDoConvite.tsx:99` (quem entra, na pergunta de fechar) | W14: `expect(noDialogo(page)).toContainText('para a pessoa convidada entrar será preciso refazer o convite')` |
| `apps/web/src/paginas/Convite.tsx:35` (o `try` do fragmento) | "recomeço, mesmo link": `expect(page.getByRole('alert')).toHaveText(TEXTO_DO_ENDERECO_INCOMPLETO…` |
| `apps/web/src/paginas/Convite.tsx:93` (o aceite do link anterior não segura o botão do novo) | "recomeço, resposta atrasada": `expect(page.getByRole('button', { name: 'Aceitar o convite' })).toBeEnabled()` |
| `apps/web/src/paginas/Convite.tsx:97` (a vez sobe a cada link) | "recomeço, resposta atrasada": a mesma asserção |
| `apps/web/src/paginas/Convite.tsx:99` (o aviso da tentativa anterior sai) | "recomeço, mesmo link": `expect(page.getByRole('alert')).toHaveCount(0)` |
| `apps/web/src/paginas/Convite.tsx:101` (a vez nova refaz a consulta do mesmo token) | "recomeço, mesmo link": `expect.poll(() => barraNasConsultas.length…).toBe(2)` |
| `apps/web/src/paginas/Convite.tsx:102` (sem token, o endereço incompleto) | "recomeço, mesmo link": `expect(page.getByRole('alert')).toHaveText(TEXTO_DO_ENDERECO_INCOMPLETO…` |
| `apps/web/src/paginas/Convite.tsx:102` (com token, volta a conferir na hora) | "recomeço, mesmo link": `expect(page.getByRole('status').filter({ hasText: 'Conferindo o convite…' })).toBeVisible()` |
| `apps/web/src/paginas/Convite.tsx:104` (o `hashchange`) | "recomeço, mesmo link": `expect.poll(() => barraNasConsultas.length…).toBe(2)` |
| `apps/web/src/paginas/Convite.tsx:110` (o fragmento sai da barra antes da consulta) | "o token sai da barra…": `expect(barraNaPrimeiraChamada, …).not.toContain(convite.token)` |
| `apps/web/src/paginas/Convite.tsx:114` (a guarda da consulta atrasada que deu certo) | "recomeço, consulta atrasada": `expect(page.getByRole('main'), volta).toContainText(novo.escolaNome)`, na volta `vale` |
| `apps/web/src/paginas/Convite.tsx:115` (a guarda da consulta atrasada que falhou) | "recomeço, consulta atrasada": a mesma asserção, na volta `nao_vale` |
| `apps/web/src/paginas/Convite.tsx:115` (a consulta que cai não é convite inválido) | "a consulta que cai…": `expect(page.getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO…` |
| `apps/web/src/paginas/Convite.tsx:125` (a trava do clique duplo no aceite) | "clique repetido": `expect.poll(() => aceites…).toBe(1)` |
| `apps/web/src/paginas/Convite.tsx:130` (a trava solta quando o aceite termina) | "W14: o professor com a conta nova…": `expect(page).toHaveURL(/\/entrar$/…` (o aceite com a senha não saía) |
| `apps/web/src/paginas/Convite.tsx:130` (`delete` da vez trocado por `clear`) | **sobreviveu, como esperado**: com o aceite do link novo no ar o botão está desligado pelo estado (a linha de baixo), e nenhum clique chega à trava; as duas formas só diferem num clique que a tela não deixa acontecer |
| `apps/web/src/paginas/Convite.tsx:131` (a volta do aceite anterior não solta o botão do novo) | "recomeço, resposta atrasada": `expect(aceitandoONovo).toBeDisabled()`, depois da resposta do anterior |
| `apps/web/src/paginas/Convite.tsx:133` (o aceite descartado não segue) | não compila sem ela (o desfecho descartado não tem resposta nem erro); o descarte em si é o de `api/convite.ts`, acima |
| `apps/web/src/paginas/Convite.tsx:135` (o coordenador com a conta nova segue para o segundo fator) | "o token sai da barra…": `expect(page.getByRole('heading', { name: 'Configurar o segundo fator' })).toBeVisible(…` |
| `apps/web/src/paginas/Convite.tsx:142` (o aviso da senha criada) | "W14: o professor com a conta nova…": `expect(page.getByRole('alert')).toHaveText(AVISO_DO_CONVITE_COM_SENHA_NOVA)` |
| `apps/web/src/paginas/Convite.tsx:150` (o `NAO_ENCONTRADO` do aceite) | "o convite usado entre a consulta e o aceite…": `expect(page.locator('body')).not.toContainText(convite.escolaNome)` |
| `apps/web/src/paginas/Convite.tsx:157` (o "Tentar de novo" refaz a consulta) | "a consulta que cai…": `expect(page.getByRole('main')).toContainText(convite.escolaNome…` |
| `apps/web/src/paginas/Convite.tsx:156` (o "Tentar de novo" volta a conferir na hora) | "a consulta que cai…": `expect(page.getByRole('status').filter({ hasText: 'Conferindo o convite…' })).toBeVisible()` |
| `apps/web/src/paginas/Convite.tsx:187` (o caminho de quem já aceitou, e o alvo de 44 px dele) | "W14: convite expirado, revogado, já usado e inexistente…": `expect(page).toHaveURL(/\/entrar$/)`; `expect(caixaDoEntrar?.height ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)` |
| `apps/web/src/paginas/Convite.tsx:230` (o foco no campo da senha nova) | "W14: o professor com a conta nova…": `expect(page.getByLabel('Senha nova')).toBeFocused(…` |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:89` (o link só quando falta o professor) | W4 Estrutura: `expect(alocacao.getByRole('link', { name: 'Ir para Professores' })).toHaveCount(0)` |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:92` (o link para Professores) | "clique duplo": o toque em "Ir para Professores" |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:102` (o link do roteiro) | W14: o toque no link "Professores" do roteiro |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `test-engineer`, 1ª; `frontend-reviewer`, 1ª | Dois professores com o mesmo nome: a lista não traz e-mail (E11), e as duas linhas e os dois "Refazer o convite de …" ficam idênticos. O desempate de verdade é o e-mail na linha, que muda o contrato da 3.0 e o E11 | O que a tela faz sozinha foi aplicado (o aviso do nome repetido no resumo do cadastro). O e-mail na lista fica no `TODO.md`, junto da prova de posse do e-mail (portão da primeira escola real), para decidir com o `privacy-guardian` |
| `frontend-reviewer`, 2ª | Fechar o diálogo do primeiro cadastro antes de a releitura voltar: o "Cadastrar" do vazio recebe o foco de volta e some quando a lista chega (leitura do código, não reproduzido; já era assim antes da rodada) | `/validar`: um caso com a rede lenta, no primeiro cadastro |
| `frontend-reviewer`, 2ª | O foco de reserva no `h1` que é `sr-only`: quem enxerga e usa teclado não vê onde o foco ficou (o Tab seguinte cai em "Tentar de novo") | Recusada nesta tarefa: o `h1` só para leitor de tela é o padrão de espaço da aba de navegação (`docs/interface.md` 6, P03), e o caso é só o da releitura que cai com a lista vazia. Registrada para o `/validar` |
| `frontend-reviewer`, 2ª | `temHomonimo` só enxerga as páginas que a tela leu quando a lista é incompleta | Aceita como está: é aviso, não garantia, e o docblock diz; acima de 1.000 professores a tela já avisa que mostra só os primeiros |
| `frontend-reviewer`, 3ª | O "Voltar e corrigir" depois de recusa só tem e2e pela tela Professores; a operação usa a mesma peça. Um `toBeFocused()` em `e2e/operacao-convite-coordenacao.spec.ts` fecharia o par | `/validar`: a tarefa pede o e2e da A0b verde **sem mudar asserção**, e a peça é uma só (`componentes/DialogoDoConvite.tsx`), provada pelo e2e de Professores |
| `test-engineer`, 4ª | O ramo de sucesso da pergunta de fechar só é exercitado no cadastro; o refazer usa o mesmo `useFechamento`, com a própria chamada da `Pergunta` | `/validar`: um caso curto no refazer |
| `test-engineer`, 4ª; `privacy-guardian`, 1ª | O `vigiarAba` de `e2e/operacao-convite-coordenacao.spec.ts` não confere IndexedDB nem Cache Storage, e o de Professores agora confere | `/validar` ou correção própria: a tarefa pede o e2e da A0b verde sem mudar asserção |
| `privacy-guardian`, 1ª | A sessão que vence com o cadastro aberto (nome e e-mail digitados), além do refazer com o link | `/validar`: o mecanismo é o mesmo desmonte (`aoTrocarDeSessao`), provado com o link na tela |
| `revisor-geral`, 1ª | A trava do envio único e o alerta com foco duplicados entre `DialogoDoConvite.tsx` e `areas/coordenacao/dialogos.tsx`; mover `useEnvioUnico` e o alerta para `componentes/` | `TODO.md`, correção própria: não é troca de nome (o `Falha` leva o foco a cada erro, o `AlertaDaFalha` só quando o texto muda), e a trava do diálogo está sob o e2e da A0b e as mutações desta tarefa |
| `revisor-geral`, 2ª | Dois nomes que diferem por uma letra em `areas/coordenacao/convite-de-professor.ts`: `TEXTO_DO_CONVITE_QUE_MUDOU` (o texto, importado) e `TEXTOS_DO_CONVITE_QUE_MUDOU` (o mapa por código); dar ao mapa um nome que diga o que ele é | `TODO.md`, no item da trava e do alerta duplicados: a correção que unifica o alerta mexe neste mesmo mapa (é ele que a `ConfirmacaoDePerigo` recebe), e o nome sai junto |
| `frontend-reviewer`, 1ª | A senha nova do aceite sem "mostrar": 12 caracteres digitados uma vez, às cegas, no celular | `17_task.md` ("Herdado da 14.0"): a 17.0 faz o campo de senha com "mostrar" da página pública (W11), e a tela do convite passa a usar a mesma peça |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-02 03:14:10 | 2026-10-02 03:21:15 | `test-engineer` | 1 | REPROVADO | a1124ed21fe4278ef |
| 2026-10-02 03:42:13 | 2026-10-02 03:50:20 | `test-engineer` | 2 | APROVADO | a9654cb1161184721 |
| 2026-10-02 03:50:52 | 2026-10-02 03:59:49 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | ade883b61e093c5da |
| 2026-10-02 04:36:05 | 2026-10-02 04:38:48 | `frontend-reviewer` | 2 | AJUSTES NECESSÁRIOS | ac9e90302e4ccc7ef |
| 2026-10-02 04:55:33 | 2026-10-02 04:58:04 | `frontend-reviewer` | 3 | APROVADO | a2e8035caab017430 |
| 2026-10-02 04:58:39 | 2026-10-02 05:08:06 | `test-engineer` | 3 | APROVADO | a9b9f61877c36d741 |
| 2026-10-02 05:08:56 | 2026-10-02 05:12:17 | `privacy-guardian` | 1 | APROVADO | a33d340fd7746ada3 |
| 2026-10-02 05:08:41 | 2026-10-02 05:15:07 | `revisor-geral` | 1 | APROVADO | a4c70ff8dbc89c6a6 |
| 2026-10-02 05:32:04 | 2026-10-02 05:39:41 | `test-engineer` | 4 | APROVADO | a7bde94258025d9a9 |
| 2026-10-02 05:40:30 | 2026-10-02 05:44:48 | `frontend-reviewer` | 4 | APROVADO | a3ae37fc84dfb9445 |
| 2026-10-02 05:45:45 | 2026-10-02 05:46:56 | `privacy-guardian` | 2 | APROVADO | a5e8a3b38743dfb1d |
| 2026-10-02 05:45:26 | 2026-10-02 05:48:17 | `revisor-geral` | 2 | APROVADO | a988083855389921a |

# Cenários de teste — Painel da operação Turmma (A0b)

Parte da Tech Spec (`techspec.md`, seção 10): cada cenário é um teste, e a tarefa que o cobre cita o
identificador. A lista é fechada; mudar exige revisar a spec. Saiu das rodadas 1 e 2 do `/revisar-spec`.
Concorrência é sempre com as chamadas em paralelo (`Promise.all`), e integração é com Postgres real.

## I — Isolamento e arquitetura

- **I1** (arquitetura) Só `apps/api/src/operacao/painel.service.ts` importa o `PainelRepository`; os
  métodos `@SemEscopo` dele são exatamente `redes`, `escolas` e `uso`, com justificativa que cita o
  painel
- **I2** (arquitetura) `IMPORTADORES_PERMITIDOS_DO_COMANDO` ganha só `painel.service.ts`, com o título
  do teste reescrito; os `@SemEscopo` do `RedeEEscolaRepository` continuam exatamente `criarRede` e
  `criarEscola` (a leitura do pedido repetido fica dentro deles)
- **I3** As varreduras geradas da A0 (C36, C41, C46) passam com as oito rotas novas: cada uma conta no
  `rl:op`, tem a guarda, e responde a sessão, desafio e cookie de escola igual a rota inexistente
- **I4** Duas escolas com turmas, professores e alunos em números diferentes: cada linha da lista traz
  os da sua (quebra sem a correlação por `escola_id`)
- **I5** Duas escolas com uso diferente no dia e no mês: `GET /uso` e a lista em `ordem=uso` trazem cada
  uma o seu (quebra sem a correlação por `escola_id` na subconsulta de uso)
- **I6** Sentinela: nome e e-mail da coordenadora, nome e matrícula de aluno e nome de turma com valores
  únicos; nenhuma resposta das oito rotas, inclusive 400, 404, 409 e 503, contém nenhum deles
- **I7** Refazer e revogar pelo id de um convite de coordenação de uma escola `ativa` não gravam nada
  (E6). O filtro `tipo = 'coordenador'` fica no código desde já, mas o check `convite_tipo_valido` hoje
  impede semear outro tipo: o teste de "outro tipo responde `NAO_ENCONTRADO`" entra na tarefa da A1 que
  abrir o convite de professor. Alarme desde já: inserir convite com `tipo = 'professor'` falha com
  23514; quando a A1 afrouxar o check, este teste quebra e manda escrever o de "outro tipo"

## E — Escrita

- **E1** Criar rede e escola grava a linha e a auditoria (`rede.criada` com escola nula, `escola.criada`
  na escola) com o apelido do operador da sessão
- **E2** Dois `POST /redes` iguais em paralelo: uma linha, uma auditoria, o mesmo id nas duas respostas.
  O mesmo para `POST /escolas`
- **E3** O mesmo `id` com outros dados: `CONFLITO`, sem linha nova nem auditoria
- **E4** Ids diferentes com o mesmo slug, em paralelo: um cria, o outro recebe `CONFLITO` (nunca 500), e
  há uma só auditoria
- **E5** Rede inexistente em `POST /escolas`: `NAO_ENCONTRADO`
- **E6** Matriz estado × ação: para cada estado da seção 5 (`sem_convite`, `pendente`, `vencido`,
  `revogado`, `aceito`, `sem_coordenacao`, `ativa`), gerar, refazer e revogar dão o resultado da tabela,
  e o que não é permitido não grava nada. Inclui: refazer de convite vencido cria outro e o vencido não
  abre mais; refazer de convite que não é o último dá `CONFLITO`; gerar em `aceito` faz o aceite anterior
  não ativar mais no login; revogar em `aceito` e depois a primeira entrada: não ativa; gerar em `aceito`
  com o mesmo e-mail reusa o usuário, e o convite novo o ativa enquanto o aceite antigo não; gerar em
  `sem_coordenacao` com o e-mail da coordenadora desativada reusa o usuário, e o aceite novo o reativa.
  Gerar em `aceito` e em `sem_coordenacao` grava `convite.revogado` do convite anterior, com o apelido
  conferido, sem nome, e-mail nem token
- **E16** Login com o bilhete de um convite que já não ativa (revogado em `aceito`, ou trocado por um
  gerar), fora de corrida, sem MFA e com MFA:
  - senha (e código) certos, conta sem outro usuário ativo: `NAO_ENCONTRADO`, sem `login_falho`, e o
    contador da conta igual ao de antes da tentativa (a reserva desfeita)
  - senha errada com o mesmo bilhete: `login_falho` gravado e o contador somado, como sempre
  - senha certa, conta com usuário ativo em outra escola (a coordenadora de A convidada para B): entra em
    A, sem ativar B, e nada de B aparece na resposta; com dois outros usuários ativos, vai para
    `escolher` só com eles
  - com MFA, os dois contadores: o da senha e o do código ficam iguais aos de antes quando os dois estão
    certos; código errado com o mesmo bilhete conta, como a senha errada
  - entre as etapas: senha certa com o convite ainda válido, o convite é revogado antes do código, e o
    código certo dá o mesmo resultado (`NAO_ENCONTRADO`, ou o outro usuário ativo)
  - a tentativa que termina em `NAO_ENCONTRADO` não grava `login` nem `login_falho` no registro de
    acesso: não houve acesso, e a tentativa não foi de senha errada
  - em `sem_coordenacao`, o gerar grava `revogado_em` no convite já usado só como registro; o estado
    passa a ser o do convite novo (A4)
- **E7** Gerar em escola inexistente: `NAO_ENCONTRADO`, sem conta nem usuário criados
- **E8** Em paralelo, na mesma escola: dois gerar com e-mails diferentes; dois gerar com o mesmo e-mail
  (uma conta, um usuário, um convite; o outro recebe `CONFLITO`); gerar e revogar em `aceito`; dois
  refazer; refazer e revogar; dois revogar. No fim, no máximo um convite em aberto; o perdedor recebe o
  erro da matriz; dois revogar dão um 204 e um `NAO_ENCONTRADO`, com uma auditoria
- **E9** Mutação: sem a trava por escola, dois refazer do mesmo convite continuam com um só convite em
  aberto, pelo índice (23505 vira `CONFLITO`)
- **E10** O mesmo e-mail convidado em duas escolas, em paralelo: os dois convites existem, cada um na
  sua escola, e nenhuma resposta traz nada da outra
- **E11** Autor desativado: com o `desativar` segurando a linha do operador (transação aberta pelo
  teste), criar escola, gerar, refazer e revogar ficam esperando o `for share` (visível em
  `pg_stat_activity`); o `desativar` confirma, e cada escrita responde 401 `SESSAO_ENCERRADA` sem gravar
  nada. Na outra ordem (a escrita segura o `for share`), o `desativar` espera e a escrita entra com a
  auditoria. O `desativar` segurado é uma transação aberta pelo próprio teste com o `for update` da
  linha; a escrita segurando o `for share` é parada por um gatilho de teste como o da E15 (no insert de
  `escola` ou no `update` de `convite`)
- **E12** Corpo com `autor` (ou qualquer campo a mais) pelo HTTP: 400, sem auditoria
- **E13** `ops:convite-coordenador` numa escola com convite em aberto: código 1, `CONFLITO`, nada
  gravado; e o `OPERADOR` conferido dentro da transação (o cenário E11 pelo comando)
- **E14** `rl:op`: o 429 com `Retry-After` no `POST /escolas`
- **E15** Ativação por convite × trava da escola: o login com o bilhete sem MFA, o login depois do código
  no MFA, e o aceite (este só na (d), porque em `aceito` não há aceite a disputar). Para parar o gerar no meio, o teste cria, só no banco de
  teste, um gatilho no `update` de `convite` que espera numa trava consultiva segurada pelo teste;
  nenhum gancho entra no código de produção:
  - (a) com a trava da escola segurada pelo teste, a ativação fica esperando (`wait_event = 'advisory'`
    em `pg_stat_activity`) e só termina depois de soltar; sem a trava na ativação, termina antes e o
    teste falha
  - (b) gerar primeiro, em `aceito`: o gerar é parado pelo gatilho depois de revogar e antes do commit;
    a ativação é disparada nesse ponto e espera; o gerar confirma; a ativação não ativa e o login, com e
    sem MFA, responde como a E16. Também com o mesmo e-mail: só o convite novo ativa
  - (c) ativação primeiro: ela já está na fila da trava (segura pelo teste) antes de o gerar ser
    disparado, e o gerar também aparece esperando em `pg_stat_activity` antes de soltar; soltando, ela
    ativa, e o gerar lê `ativa` e responde `CONFLITO`
  - (d) aceite em `pendente` (conta nova, que define a senha e ativa na mesma transação) contra refazer
    e contra revogar, nas duas ordens forçadas como em (b) e (c): nunca 500 nem deadlock (40P01); ou o
    aceite vence e o refazer ou o revogar recebe `CONFLITO`, ou eles vencem e o aceite responde como
    convite inválido, nunca 500. A prova de que a trava é a primeira instrução do aceite é a (a); a (d)
    prova o resultado e a ausência de 40P01
  - (e) espera da trava além do `statement_timeout`: 503 `TEMPO_ESGOTADO` com `Retry-After` (o
    mapeamento do 57014 que já existe), nunca 500

## L — Leitura

- **L1** Contagens, cada caso com o segundo dado que o torna observável: professor com duas disciplinas
  na mesma turma conta uma vez; professor com vínculo `pendente` ou `contestado` não conta; aluno
  desativado não conta; aluno transferido (vínculo encerrado no meio do ano) não conta; turma e vínculo
  do ano anterior não contam; escola sem ano em curso mostra zero; professor com vínculo em duas escolas
  conta em cada uma; professor com vínculo `confirmado` e usuário desativado não conta
- **L2** Uso: o mês soma requisições e jobs e pega o **pico** de bytes (dados em que soma e pico
  diferem); a linha de hoje existe no banco e não aparece; no dia 1, a referência é o mês anterior, e em
  1º de janeiro, o ano anterior; escola sem linha mostra zero com a data de referência. Com o relógio
  entre 22h e 23h59 de São Paulo (já o dia seguinte em UTC), o último dia fechado é o de ontem em São
  Paulo, e a escola criada às 22h ainda não aparece com uso de hoje
- **L3** 30 escolas, nas duas ordens, percorridas página a página: cada escola aparece uma vez; na ordem
  `uso`, várias com zero, e o desempate por `id` se mantém entre páginas; `total` certo
- **L4** O estado da lista é o mesmo que a escrita usa: para cada estado da E6, a lista mostra o estado
  e o `conviteId` do último convite

## A — Auditoria, log e token

- **A1** `convite.refeito` com `origemId`, `usuarioId` e `expiraEm`, sem nome, e-mail nem token
- **A2** Depois de gerar e de refazer, o token devolvido não aparece em nenhuma coluna de `convite` nem
  em `auditoria`, e o `token_hash` é o SHA-256 dele
- **A3** As linhas de log das cinco escritas, capturadas, levam só ids: nada de nome, e-mail, slug nem
  token
- **A4** `estadoDaCoordenacao` (unidade): os sete estados, com o convite na borda das 72 h (um segundo
  antes e um depois) e o usuário desativado antes e depois do aceite

## W — Web

- **W1** (e2e) O fluxo: entrar, criar rede e escola (com a revisão do endereço), gerar o convite, copiar
  o link; a coordenadora abre o link e ativa a conta; a lista mostra `ativa` com as contagens
- **W2** (e2e) Dois operadores com a lista aberta; um refaz, o outro tenta refazer o mesmo convite: vê
  "o convite mudou" e a lista recarrega com o estado novo
- **W3** (e2e) Fechar o diálogo sem copiar pergunta antes; fechando, o operador refaz, e o link anterior
  abre a tela de convite inválido
- **W4** (e2e) Recomeço: recarregar não mostra o link; sair e entrar outro operador na mesma aba não
  mostra a lista nem o diálogo do primeiro
- **W5** (unidade) Formatadores: `Intl.NumberFormat('pt-BR')`; bytes em unidade ("1,2 GB"); dia
  "23/09/2026"; mês "setembro de 2026, até 23/09"; rótulos "requisições", "tarefas em segundo plano",
  "armazenamento"
- **W6** (e2e) Escolas e Uso com 30 escolas (uma com nome e rede longos e slug no limite), trocando
  página e ordem, nos projetos `chromebook` e `celular`: a 360 px, `scrollWidth <= clientWidth` do
  documento nas duas telas e no diálogo Nova escola com a prévia `/e/<slug>`; os botões de ação do
  cartão têm pelo menos 44 × 44 px
- **W7** (e2e) Os quatro estados de Escolas e Uso, nos dois projetos e com axe em todos: carregando;
  vazio ("Nenhuma escola ainda. Comece criando a rede." em Escolas; "Nenhuma escola ainda." com link
  para Escolas em Uso); erro com "Tentar de novo" no 503; com dado. No diálogo Nova escola sem rede,
  "Crie a rede primeiro", com o botão
- **W10** (unidade e e2e) Textos, sem identificador de estado nem código na tela: `sem_convite` "Sem
  convite"; `pendente` "Convite enviado, ainda não aberto"; `vencido` "Convite vencido"; `revogado`
  "Convite revogado"; `aceito` "Convite aceito, falta o primeiro acesso"; `sem_coordenacao` "Sem
  coordenação ativa"; `ativa` "Ativa". Mensagens: `CONFLITO` no refazer e no revogar "O convite mudou.
  A lista foi atualizada."; no gerar "Esta escola já tem convite. Use Refazer para um link novo."; no
  slug "Esse endereço já é de outra escola. Escolha outro."; `NAO_ENCONTRADO` no revogar "Esse convite
  já não vale. A lista foi atualizada."; 429 "Muitas ações seguidas. Tente de novo em N segundos.", com
  o N do `Retry-After`; 503 `TEMPO_ESGOTADO` "A operação demorou demais. Tente de novo em instantes.";
  401 no meio de um diálogo leva à entrada com "Sua sessão terminou. Entre de novo." Na tela de entrada
  da escola, o `NAO_ENCONTRADO` da E16 mostra o texto da tela de convite inválido do F1, sem dizer que a
  senha estava certa
- **W8** (e2e) Teclado: criar escola e gerar convite só com Tab e Enter; foco preso no diálogo e devolvido
  ao botão que o abriu; Esc cai na mesma pergunta de fechar sem copiar
- **W9** (e2e) Sem `navigator.clipboard`, o Copiar seleciona o campo e pede para copiar; "Link copiado"
  é anunciado em `aria-live` quando a cópia funciona

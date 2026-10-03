# Achados das revisões — `tasks/prd-apresentacao-escola/17_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-02 22:37:54 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz (W1):** o fluxo inteiro só pela tela, da escola vazia até a aluna aprovada vendo a turma dela, nos projetos `chromebook` e `celular`.
- **W8 pelo link:**
  - o token sai da barra antes da primeira chamada;
  - aparecem só os nomes livres;
  - nada fica guardado no navegador;
  - o aluno seguinte no mesmo computador não vê nada do anterior.
- **W8 pelo código:**
  - o código em branco e o fora do formato não chamam a API;
  - o código vai normalizado;
  - o clique duplo em "Abrir a turma" manda uma abertura só;
  - o texto do NAO_ENCONTRADO depende do caminho usado.
- **Um envio no ar:** o clique duplo em enviar manda um pedido só, e o botão fica em carregamento também na espera de 1 s.
- **503:** o envio repete com a mesma chave até 3 vezes, nunca antes do Retry-After, com a variação de cada computador, e depois aparece "Tentar de novo".
- **Recusa:** a lista é relida, a senha sai, a matrícula fica e o foco vai para ela.
- **Limite (429):** pelo nome e pelo rl:ip, com os minutos do Retry-After.
- **Chave nova depois de mexer num campo.**
- **Acesso que cai entre abrir e enviar:** a tela leva ao campo do código.
- **Respostas atrasadas:**
  - a abertura de um código anterior não troca a turma;
  - o envio no ar quando a tela muda não põe aviso;
  - a página que sai não reenvia nada.
- **Link colado pela metade:** leva ao campo do código, sem chamada.
- **W9 (unidade):** os textos exatos; 60 s dão 1 minuto e 61 s dão 2; o singular; nenhum código de erro nem "computador".
- **W11:** os atributos de cada campo.
- **W4 e W12 da página pública:** a turma vazia, o link vencido, 360 px sem rolagem, tudo só com teclado.
- **"Mostrar" no aceite do convite** (herdado da 14.0).
- **Isolamento:** a página é pública e a API dela vem da 5.0 e da 6.0, onde o isolamento já está testado.
- **Permissão:** o aluno pendente na entrada recebe "Matrícula ou senha incorretas", e no banco há 0 alunos antes da aprovação (W1).

**Cobertos:** todos os acima. As peças centrais estão bem amarradas:
- **Barra do navegador:** o token é conferido na barra com a abertura segurada.
- **Armazenamento:** o teste olha `localStorage`, `sessionStorage`, IndexedDB, Cache Storage e todas as URLs.
- **Clique duplo:** os dois cliques saem no mesmo instante, por `evaluate`, e o banco termina com 1 pedido pendente.
- **Reenvio no 503:** roda com o relógio falso e dois sorteios (0,5 e 0,9), e o reenvio com a mesma chave não dobra o pedido no banco.
- **Respostas atrasadas:** a vez é provada nas duas formas, a que falha e a que abre.
- **Unidade:** `reenvio-da-sala.test.ts` e `mensagens-da-sala.test.ts` cobrem o teto, a espera, o descarte e os textos.
- **Mutações:** a tabela tem linha para quase toda cláusula nova.
- **Sem pendências de processo:** não há `.skip`, `.only` nem teste comentado. Nenhum mock nosso esconde a regra: o `page.route` só simula 503, 429 e 404 da borda, e o resto bate na API real. Nenhuma IA é chamada.

**Bloqueantes:**

1. **`apps/web/src/paginas/TurmaPublica.tsx:360`: duas das três condições do "pedido reaproveitado só sem mudança" não têm teste.**
   - O que o teste prova hoje: o teste "mexer num campo" (`e2e/turma-publica.spec.ts:598-631`) só troca a senha, e a linha da tabela de Mutações para a 360 troca a expressão inteira por `true`.
   - Mutação que nenhum teste pega: apagar `anterior.listaNomeId === nomeEscolhido.id`, ou apagar `anterior.matricula === matricula`.
   - Por que é bug: com a primeira condição apagada, o aluno escolhe o nome errado, recebe o quarto 503, corrige o nome, e o "Tentar de novo" manda o pedido antigo, com o nome errado e a chave antiga. O servidor responde `enviado` (E21), e o pedido fica no nome de outra pessoa.
   - Correção exigida: no mesmo teste, depois do quarto 503, provar separadamente as três mudanças:
     - trocar o nome;
     - trocar a matrícula;
     - trocar a senha.

     Em cada uma, o envio seguinte sai com `chaveEnvio` nova e com o `listaNomeId` e a `matricula` do corpo iguais aos da tela. O jeito mais simples é um laço com o 503 rearmado. Depois, registrar as duas mutações novas na seção "Mutações".

**Recomendações:**
- **Asserções negativas que podem passar por atraso:** `e2e/turma-publica.spec.ts:461-462` e `:490-493` (o "nenhum reenvio antes do Retry-After") olham `chaves` logo depois do `runFor`, sem dar tempo ao evento de rota chegar. Uma mutação que adiante o reenvio pode passar por atraso de entrega. A unidade cobre `esperaDoReenvio`, por isso não bloqueia. Vale um `waitForTimeout` curto antes da asserção, como foi feito em "resposta atrasada".
- **Nome tomado é justamente o escolhido:** "o nome escolhido sai da escolha se foi tomado na releitura" (`TurmaPublica.tsx:343`) não tem teste. O e2e toma o nome da colega, não o escolhido. Vale um passo em que o nome tomado é o escolhido, com o radio sumindo e o próximo envio pedindo "Escolha o seu nome na lista." sem chamada.
- **Link aberto que cai por limite:** o 429 na abertura pelo link (`FalhaDoLink` com LIMITE_EXCEDIDO) só é provado na unidade. O e2e do link usa só o 503.
- **W1 sem segunda turma:** "a aluna vê só a própria turma" é provado pela ausência da colega da mesma turma. Não há segunda turma na escola para contrastar. Pode ser uma segunda turma com um nome conhecido, que não pode aparecer.
- **Dois nomes iguais (E24):** continua sem decisão nem teste. Já está registrado para o `/validar`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/TurmaPublica.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/reenvio-da-sala.ts` e `reenvio-da-sala.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/mensagens-da-sala.ts` e `mensagens-da-sala.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/turma-publica.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/escola-montada.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/convite.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/17_task.md`

## test-engineer · 2ª rodada · APROVADO · 2026-10-02 23:34:21 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO

**Cenários exigidos (escopo desta rodada):** a correção 1 da rodada anterior, mais o que as recomendações aplicadas afetaram.
- O pedido reaproveitado só quando nada mudou (`TurmaPublica.tsx:360`). Trocar o nome, a matrícula ou a senha, cada um separadamente, depois do quarto 503 tem de gerar um pedido novo, com chave nova e com o que está na tela. Sem mexer em nada, "Tentar de novo" manda o pedido idêntico.
- O nome escolhido que outro aluno pede antes do envio sai da escolha (`TurmaPublica.tsx:343`).
- O 429 do rl:ip na abertura pelo link, com "Tentar de novo".
- No W1, uma segunda turma da escola com um nome na lista, que não aparece para a aluna.

**Cobertos:**
- **Correção 1 feita.** O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/turma-publica.spec.ts:651-675`. Ele roda um laço sobre as três mudanças. Em cada uma: quatro 503, depois o botão "Tentar de novo", a mudança do campo, o botão de volta a "Enviar pedido", e o envio seguinte com `chaveEnvio` diferente da antiga e com `listaNomeId`, `matricula` e `senha` iguais aos da tela.
  - Conferi as mutações pela lógica do código. Se uma das três condições da linha 360 for apagada, mudar aquele campo deixa `mesmoPedido` verdadeiro, o pedido antigo é reenviado com a chave antiga e a linha 671 fica vermelha. O mesmo vale para as asserções de campo das linhas 672 a 674.
  - O `pedirONome` (linha 98) preenche os três campos de novo a cada volta do laço. Assim cada iteração começa do mesmo pedido-base e muda um campo só.
  - O caminho de controle está nas linhas 678-686: sem mexer em nada, o corpo do envio sai inteiro igual (`toEqual`) e o pedido entra.
  - As três mutações estão registradas em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/17_task.md:206-208`.
- **Nome tomado.** O teste está em `e2e/turma-publica.spec.ts:570-586`: o nome tomado no banco some da lista relida, e o envio seguinte mostra "Escolha o seu nome na lista." sem nenhuma chamada ao servidor (`enviosDepois === 0`). A mutação da linha 343 está registrada (`17_task.md:209`).
- **rl:ip pelo link.** O teste está em `e2e/turma-publica.spec.ts:374-385`: o 429 pelo link com o texto dos minutos, depois o 503 com "Tentar de novo", a barra sem `#`, e no fim a turma abre.
- **W1.** O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/escola-montada.spec.ts:170-175` e `216-219`: nem o nome da outra turma nem o aluno da lista dela aparecem para a aluna.
- **Esperas antes das asserções negativas.** Os `waitForTimeout(300)` depois do `runFor` estão nas linhas 468, 498 e 501.

**Bloqueantes:** nenhum.

**Recomendações:**
- A tabela de mutações ainda tem a linha antiga `TurmaPublica.tsx:360 (trocado por true)` (`17_task.md:189`). Ela ficou ao lado das três novas (206-208), que já a substituem. Vale juntar as quatro para o `/retro`.
- No laço do "mexer num campo", só a primeira volta parte de uma tela sem recusa anterior. As voltas seguintes começam logo depois de uma recusa (409), que limpa a senha e relê a lista. O teste continua válido porque o `pedirONome` preenche tudo de novo. Ainda assim, um comentário dizendo que a recusa também zera o pedido sem resposta ajudaria quem ler o teste depois.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-02 23:35:55 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO

Estados: ok. Carregando aparece como "Abrindo a turma…" (link) e como "Abrindo…" com o botão desligado (código). O estado vazio diz "Nenhum nome livre nesta turma." e manda chamar o professor, sem se desculpar. Erro: falha do link com "Tentar de novo", aviso no campo do código, recusa e limite com os minutos. Com dado: a lista de nomes e o formulário. Depois do envio vem a tela "Pedido enviado", que avisa que a entrada responde "Matrícula ou senha incorretas" até a aprovação.

Acessibilidade:
- Todo campo tem rótulo visível.
- O aviso e o status do envio entram no `aria-describedby` dos campos e do botão, pelo `descritoTambemPor` novo do `Campo`.
- `role="alert"` e `role="status"` estão nos lugares certos.
- O foco vai para onde a tela leva o aluno: o título da turma, a matrícula na recusa, o grupo dos nomes, o campo do código e o título do pedido.
- "Mostrar a senha" é um interruptor com `aria-pressed`.
- O W12 percorre o fluxo inteiro só com teclado (Tab, setas, Espaço e Enter), confere o foco visível e roda o axe sem violação grave.

Chromebook fraco:
- Os perfis `chromebook` e `celular` do `playwright.config.ts` já aplicam CPU 4 vezes mais lenta e rede lenta.
- A página fica no pacote de entrada, com cerca de 134 kB de um limite de 150 kB.
- A lista de uma turma é curta, então não precisa de virtualização. Não há upload.
- O 503 é reenviado com a mesma chave no máximo três vezes, sempre depois do `Retry-After` e com até 1 s de variação por computador.
- Código digitado fora do formato não chega à API.

Celular: o W12 roda a 360 px com um nome comprido e sem espaço, sem rolagem horizontal. Nomes, "Mostrar", "Enviar pedido", "Ir para a entrada da escola" e "Voltar à lista de nomes" têm alvo de 44 px (`min-h-11`). Nada depende de hover. O campo do código usa `autocapitalize="characters"` e a matrícula usa `inputmode="text"`. O W1 (`e2e/escola-montada.spec.ts`) roda nos dois projetos. Nenhum fluxo exige o celular.

Ação oficial protegida: não se aplica nesta tela. O aluno só faz um pedido, e a aprovação é do professor ou da coordenação, pelo diálogo da 16.0. A tela diz que quem decide é uma pessoa e que a recusa devolve o nome (nota da 8.0). O aceite do convite ganhou o "Mostrar" que faltava desde a 14.0.

Bloqueantes: nenhum.

Recomendações:
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/mensagens-da-sala.ts:26`, o texto "O sistema está cheio agora." não diz o que fazer. Pelo link, o botão "Tentar de novo" compensa. Pelo código, só sobra "Abrir a turma". Vale acrescentar "Espere um pouco e tente de novo." O texto está fixado no W9, então a mudança é para o `/validar`.
2. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/TurmaPublica.tsx:355`, quando falta escolher o nome, o foco vai para o `legend`. O leitor de tela lê "Escolha o seu nome", mas não lê o erro, porque ele está no `aria-describedby` do `fieldset` e não tem `role="alert"`. Com o foco no primeiro nome da lista, a descrição do grupo seria lida.
3. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/CampoDeSenha.tsx:22`, o botão diz "Mostrar" também quando a senha já está à vista. Para quem enxerga, o estado só aparece no próprio campo. Trocar o texto visível para "Esconder" não quebra o `aria-pressed`, desde que o nome acessível continue fixo.
4. A página pública da turma entra no primeiro carregamento de todo mundo, não só do aluno: sobram cerca de 16 kB até o limite de 150 kB. Vale anotar para o `/retro` antes que a próxima tela pública venha para a entrada.
5. Dois nomes iguais na lista (E24) continuam iguais na tela. Já está registrado para o `/validar`.

Não rodei o navegador nesta revisão. As medidas de throttling, 360 px e teclado vêm dos testes e2e, que o portão carimbado rodou verdes nos projetos `chromebook` e `celular`.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-02 23:36:51 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (a página pública onde o aluno pede o nome, só a parte web; a API não mudou)
Rate limit: ok. A tarefa não muda nenhum limite. Os limites por nome (L4) e por `rl:ip` (L10) continuam no servidor. A página só mostra o texto do 429 com os minutos do `Retry-After`, sem inventar número. O código fora do formato nem sai da página, então não gasta o `rl:ip` nem a contagem da escola.
Fila e prioridade: ok. Não se aplica: não entra job novo nem chamada demorada.
Concorrência: protegida. O clique duplo é barrado na hora por um `useRef` em `TurmaPublica.tsx:352` e pelo botão desligado. Quando o servidor responde 503, a página reenvia a mesma `chaveEnvio` (`TurmaPublica.tsx:361`), e o servidor já ignora o pedido repetido (E21). O e2e mostra que o reenvio não cria pedido a mais (`pedidosPendentesDaTurma`). Resposta que chega atrasada é descartada pela "vez" da abertura e do envio. O formulário desmonta quando a tela muda, então a trava do envio não fica presa.
Índice e paginação: ok. Não se aplica: nenhuma query nova (as do `e2e/__fixtures__/sessao.ts` são só do teste).
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. O servidor não ganhou código no caminho quente. O reenvio é limitado e sem rajada:
- a página repete sozinha no máximo 3 vezes (`reenvio-da-sala.ts:355`);
- cada repetição espera o `Retry-After` inteiro mais até 1 s de variação por computador (`reenvio-da-sala.ts:314-317`), e 2 s quando a resposta não traz `Retry-After`;
- depois disso, só o clique em "Tentar de novo" manda de novo;
- a abertura da turma não se repete sozinha.

O cenário de carga K1/K2 já repete o 503 sem a variação, que é o pior caso, então não precisa mudar.
Bloqueantes: nenhum
Recomendações:
- `e2e/__fixtures__/sessao.ts` (`tomarNomeNoBanco`): o `update` escolhe o nome pelo texto. Numa turma com dois nomes iguais (E24), ele tomaria os dois. Escolher pelo `lista_nome.id` deixa o teste preso a um registro só.
- Na falha pelo link (`FalhaDoLink`), o "Tentar de novo" da abertura que recebeu 503 não tem a variação aleatória. Hoje isso não pesa, porque o aluno clica na hora que quiser, mas vale registrar no `/validar` caso um dia a abertura passe a se repetir sozinha.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/TurmaPublica.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/reenvio-da-sala.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/salas.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/fragmento.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/mensagens-da-sala.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/.size-limit.json`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-02 23:36:52 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. A página `/e/<slug>/turma` mostra e envia o que o contrato da 5.0 e da 6.0 já trata: os nomes livres da lista da turma, a matrícula e a senha nova do aluno. Não há migration, repository nem endpoint novo nesta tarefa. O diff mexe só na web, no `packages/shared` (textos) e no e2e.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok. Não há rota nova. A página trata o `NAO_ENCONTRADO` do servidor, que é o mesmo para link e código, e só escolhe o texto pelo caminho que ela mesma usou (`/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/mensagens-da-sala.ts:56-57`). Com isso, não vaza se o registro existe. O código que não tem a forma certa é barrado no cliente, antes de gastar o limite. A recusa usa um texto só e não diz se o erro foi no nome ou na matrícula.

**Logs:** limpos. Os arquivos novos não têm `console.*`, logger, `localStorage`, `sessionStorage` nem IndexedDB. Nomes, matrícula, senha e `chaveEnvio` ficam só no estado do componente, fora do cache do TanStack Query, e saem quando a etapa muda. A tela "Pedido enviado" não mostra nome nem matrícula, o que protege o próximo aluno no mesmo computador. A senha volta a ficar escondida quando o componente sai.

**Token do link:** o token vai no fragmento `#` e é tirado da barra com `replaceState` antes da primeira chamada (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/fragmento.ts`, `TurmaPublica.tsx:121-128`). Ele não aparece no caminho nem na consulta, vai no corpo do POST e não passa pelo Referer. O código que lia o token no `Convite.tsx` foi extraído para esse arquivo sem mudar o comportamento.

**Auditoria:** não se aplica a esta tarefa. Não há leitura por coordenação, exportação, nota, permissão nem saída de IA.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os nomes são "Aluna sintética <uuid>" e "Professor sintético <uuid>", os e-mails usam `@educa.invalid` e as senhas são `senha-sintetica-*`. Os helpers novos em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts:829-873` gravam o hash do token e o HMAC do código pelas mesmas funções da API, sem nenhum dado real.

**Pergunta de fechamento:** esta tarefa não cria armazenamento nem destino novo. O que a reivindicação grava (a 6.0) segue respondido por onde já era. A página não guarda nada no navegador.

**Bloqueantes:** nenhum.

**Recomendações:**
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/TurmaPublica.tsx:217`: depois do envio, o botão "Voltar à lista de nomes" reabre a turma com o token ou código que ficou na memória da aba. Num computador compartilhado, o próximo aluno reabre a lista sem precisar do link. Isso está dentro do desenho, porque o acesso é da turma inteira. Ainda assim, vale registrar na techspec que é intencional, ou limpar o caminho quando a tela sai por "Ir para a entrada da escola".
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/TurmaPublica.tsx:456`: `autoComplete="off"` na senha nova da página pública é a escolha certa para o computador da escola, porque evita que o navegador ofereça salvar a senha para o próximo aluno. Vale um comentário de uma linha explicando isso, para ninguém trocar por `new-password` por analogia com o `Convite.tsx`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-02 23:37:07 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum

As subtarefas 17.1 a 17.6 foram feitas, e o item herdado da 14.0 também: o "Mostrar a senha" agora aparece no aceite do convite e tem teste no `e2e/convite.spec.ts`. Nada da tarefa adianta trabalho de fase futura. Toda divergência do `17_task.md` também está registrada na `techspec.md` (seção 9, "Decidido na 17.0") e no `cenarios.md` (W4 "Pública", W8, W9 e W11). Uma delas é deixar o TanStack Query de fora da página, o que contraria a regra 50, item 3; ela foi declarada e tem motivo.

O `node tools/processo/portao-local.ts conferir` respondeu "portão local válido para o código atual (typecheck, lint, test, e2e, infra)".

Recomendações (nenhuma bloqueia):
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/TurmaPublica.tsx:39-40`: a etapa `falhou` é declarada com `caminho: Caminho`, mas só o caminho do link chega a ela. A falha pelo código vai para o campo do código, na linha 103. Restringir o tipo a `{ tipo: 'link' }` deixaria o comentário e o tipo dizendo a mesma coisa.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/LoginPorCima.tsx:65` (código anterior à tarefa): monta `/e/${escolaSlug}` à mão e sem `encodeURIComponent`. Agora existe `caminhoDaEscola` em `caminhos.ts`, então são dois jeitos de montar o mesmo endereço. Vale trocar numa correção.
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts:997-1001`: `tomarNomeNoBanco` marca o nome como `reivindicado` sem criar a linha em `reivindicacao`, o que deixa o banco do teste num estado que a API nunca produz. Hoje basta para provar a releitura da lista. Se outro teste reaproveitar a peça, vale criar o pedido junto.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/Campo.tsx:39-41` (comentário anterior à tarefa): diz que "matrícula é numérica", mas o W11 manda usar `inputmode="text"` na matrícula. Vale corrigir o comentário para ninguém copiar o `inputmode` errado.

## test-engineer · 3ª rodada · APROVADO · 2026-10-03 00:28:54 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (as rodadas anteriores fixaram a lista e esta rodada não mudou nada nela):
- caminho feliz pelo link e pelo código
- nome não escolhido
- recusa, e bloqueio do nome depois da 6ª matrícula errada
- dois alunos com o mesmo nome / nome já tomado
- 503 com reenvio da mesma chave
- clique duplo em enviar
- mexer num campo depois do sistema cheio
- resposta atrasada e troca de código
- teclado e celular

**Cobertos:** esta rodada conferiu o diff do lote de recomendações.
- **O foco no primeiro nome.** `apps/web/src/paginas/TurmaPublica.tsx:356` (`primeiroNome.current?.focus()`, com o `ref` só no radio da posição 0, na linha 415) é provado por `e2e/turma-publica.spec.ts:198`, que espera o foco no primeiro radio e confere o `aria-describedby` do grupo. A linha 24 da seção Mutações (`:354` e `:356`, "W8 pelo link") aponta para o teste certo, o da linha 128. Apagar o `focus()` deixa o teste vermelho. O teste de teclado (`:836`) também passou a esperar o foco no primeiro radio.
- **`tomarNomeNoBanco` pelo id.** `e2e/__fixtures__/sessao.ts:869` toma o nome com `escola_id` e `id`. As chamadas em `e2e/turma-publica.spec.ts:527` e `:573` pegam o id pelo `value` do radio. O teste não fica verde por engano: se o id viesse vazio (`?? ''`), o update não tocaria nada, a reivindicação entraria e a recusa esperada falharia.
- **O que é só tipo ou comentário.** A etapa `falhou` com `Extract<Caminho, { tipo: 'link' }>` (linha 40), o comentário do `autoComplete="off"` e o comentário de `Campo.tsx` não mudam comportamento. Não pedem teste novo.
- **A tabela de Mutações.** A linha antiga "trocado por true" saiu. As três mutações do pedido reaproveitado (nome, matrícula e senha) continuam ligadas aos testes do "mexer num campo".

**Bloqueantes:** nenhum.

**Recomendações:**
- Algumas referências de linha na tabela de Mutações de `tasks/prd-apresentacao-escola/17_task.md` estão uma linha atrás:
  - o `mesmoPedido` está em `TurmaPublica.tsx:361`, e a tabela diz `:360`;
  - o foco na matrícula na recusa está em `:400`, e a tabela diz `:399`.

  Vale acertar antes do commit, para o `/validar` achar a cláusula sem procurar.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-03 00:29:45 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO

Esta rodada cobre só as mudanças desde a 1ª rodada aprovada. Não reauditei o resto do zero.

Estados: ok. O diff não mexe em carregando, vazio, erro nem com dado.

Acessibilidade: a recomendação 2 foi aplicada como pedi. Quando falta escolher o nome, `enviar` chama `primeiroNome.current?.focus()` e o foco vai ao primeiro radio (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/TurmaPublica.tsx:356`, com o `ref` na posição 0 na linha 415). O `legend` perdeu o `ref` e o `tabIndex`, então volta a ser só o rótulo do grupo. O aviso "Escolha o seu nome na lista." continua no `aria-describedby` do `fieldset` (linha 408), e o leitor de tela lê esse aviso junto com o grupo quando o foco entra no radio. O e2e prova as duas coisas: o primeiro radio está com foco, e o grupo é descrito pelo id do aviso (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/turma-publica.spec.ts:198-199`). Aceito o motivo de recusar a recomendação 3. Um interruptor com `aria-pressed` precisa de nome fixo, e um texto visível diferente do nome acessível quebraria o critério de rótulo no nome (WCAG 2.5.3).

Chromebook fraco: o diff não mexe em bundle, lista nem upload. O `.size-limit.json` não mudou nesta rodada.

Celular: sem mudança de layout. O teste de foco roda no mesmo bloco que mede largura excedente e alvo de toque, nos dois projetos.

Ação oficial protegida: não se aplica. Esta tela é o pedido de nome do aluno, que espera a decisão de uma pessoa, e nenhuma ação oficial acontece nela.

Bloqueantes: nenhum.

Recomendações:
1. O comentário do e2e em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/turma-publica.spec.ts:189` ainda diz "com o foco no grupo dos nomes". Agora o foco vai ao primeiro nome, e o comentário deve dizer isso.
2. As recomendações 1, 4 e 5 da rodada anterior continuam registradas para o `/validar` e o `/retro`, como indicado.

## test-engineer · 4ª rodada · APROVADO · 2026-10-03 01:18:54 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 3ª rodada, que foi APROVADO e não mudaram. Esta rodada não muda nenhum código de produção nem de teste.

Cobertos: todos, como na 3ª rodada. Conferi as duas mudanças desde então:
- **Comentário em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/turma-publica.spec.ts:189-190`:** só o texto mudou. Agora fala do "foco no primeiro nome", o que bate com `TurmaPublica.tsx:356` (`primeiroNome.current?.focus()`). As asserções em volta continuam iguais.
- **Tabela de Mutações em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/17_task.md:165-205`:** a recomendação da 3ª rodada foi cumprida. Comparei cada linha da tabela com `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/TurmaPublica.tsx` como está agora. As 27 linhas citadas caem todas na cláusula descrita:
  - `:94` e `:97` são as duas checagens de vez.
  - `:123` é o `apagarFragmentoDaBarra()`.
  - `:126` é o contador da página que sai.
  - `:135` limpa o código digitado.
  - `:154` a `:160` são a trava, a normalização, o código em branco e o formato.
  - `:230` e `:260` são os focos.
  - `:348` tira o "Tentar de novo".
  - `:353` a `:356` são a trava do envio no ar e o nome não escolhido com o foco.
  - `:361` é o `mesmoPedido`.
  - `:371` e `:372` são o `aoEsperar` e o `valendo`.
  - `:379` é o pedido sem resposta guardado.
  - `:391` é a perda de acesso.
  - `:398` a `:400` limpam a senha, releem os nomes e põem o foco na matrícula.
  - `:408` é o `aria-describedby` do grupo dos nomes.
  - `:475` a `:479` são o status visível, o botão desligado e o "Tentar de novo".

Bloqueantes: nenhum.

Recomendações: nenhuma nova. Uma observação para o `/retro`: a tabela de Mutações cita o código por número de linha, e esse número sai do lugar a cada edição do arquivo. Citar pelo nome do símbolo ou por um trecho do código (como já se faz com `mesmoPedido`) evitaria refazer a tabela.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-03 01:19:19 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- A recomendação 1 está feita. `tomarNomeNoBanco` em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts:869` agora toma o nome pelo id, com `where escola_id = $1 and id = $2`. Os dois usos em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/turma-publica.spec.ts:528` e `:574` pegam o id pelo `value` do radio. Falta um ajuste: se o radio não tiver `value`, o `?? ''` manda id vazio, e o `update` não toca linha nenhuma sem avisar. Nesse caso o teste segue com o nome ainda livre e não prova a corrida. Faça o helper falhar quando o `rowCount` vier diferente de 1.
- A recomendação 2 (o "Tentar de novo" da abertura pelo link sem variação) foi adiada para o `/validar` e continua registrada lá.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-03 01:19:19 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, e2e, infra)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/turma-publica.spec.ts:528` e `:574`: o `?? ''` passa um id vazio a `tomarNomeNoBanco` se o radio não tiver `value`. Nesse caso o `update` não altera nada e o teste segue sem ter tomado o nome. O resultado seguinte ainda falharia, mas por um motivo que confunde. Melhor exigir o valor, por exemplo com `expect(valor).toBeTruthy()` antes da chamada, ou com um helper que lance erro.

As quatro correções que pedi na rodada anterior foram feitas:
- **Etapa `falhou`:** usa `Extract<Caminho, { tipo: 'link' }>` em `TurmaPublica.tsx:40`.
- **Foco quando falta o nome:** vai ao primeiro radio (`TurmaPublica.tsx:339`, `:356` e `:415`). A mudança está registrada na `techspec.md:481` e no `17_task.md`.
- **Comentário da matrícula:** está corrigido em `Campo.tsx:29`.
- **`LoginPorCima.tsx`:** ficou para uma correção própria e está listado em "Recomendações sem aplicar". Está certo assim, porque é código de antes desta tarefa.

`tomarNomeNoBanco` agora filtra por `escola_id` e `id` (`e2e/__fixtures__/sessao.ts:869`). A tarefa explica por que não cria o pedido junto, e o motivo se sustenta.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-03 01:19:28 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO

Esta rodada auditou só o diff desde a 1ª rodada aprovada e o que ele afeta.

Campos pessoais tocados: nenhum campo novo. A tela já usava nome da lista, matrícula e senha nova do aluno, e o diff não muda nada disso.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. O diff não mexe em rota nem em repository. O helper de e2e `tomarNomeNoBanco` (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts:869`) agora filtra por `escola_id` e pelo `id` de `lista_nome`, então não marca nome de outra escola.

Logs: limpos. Nenhum `console.*` e nada gravado no navegador em `TurmaPublica.tsx`, `fragmento.ts`, `reenvio-da-sala.ts` e `api/salas.ts`.

Auditoria: não se aplica. O diff não traz leitura por coordenação ou rede, exportação, nota, permissão nem aprovação de saída de IA.

Envio externo: nenhum.

Seed/fixture: sintético. Os nomes, a escola e a senha do e2e são inventados pelo teste.

Conferência das recomendações da 1ª rodada:
- **Recomendação 2: feita.** O comentário em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/TurmaPublica.tsx`, antes do `autoComplete="off"` da senha nova (por volta da linha 458), explica o motivo: o computador é da escola e o navegador não pode oferecer guardar a senha para o próximo aluno.
- **Recomendação 1: registrada como intencional.** Está em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md:479` e em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/17_task.md:242`. O token ou código só dá acesso à lista de nomes da turma, que já é compartilhada com a turma toda. O retorno não reaproveita matrícula nem senha, então aceito.

O resto do lote, do ponto de vista de privacidade:
- **Etapa `falhou`:** agora só aceita o caminho do tipo link. O `FalhaDoLink` mostra apenas a mensagem tipada que vem do código de erro, sem corpo do servidor nem stack (`TurmaPublica.tsx:297-308`).
- **`Campo.tsx`:** só ganhou `descritoTambemPor` e `acao`, sem efeito sobre dado.
- **Foco no primeiro radio:** só muda o comportamento da tela.

Bloqueantes: nenhum.

Recomendações: nenhuma nova.

## test-engineer · 5ª rodada · APROVADO · 2026-10-03 02:08:15 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** iguais aos da 4ª rodada (aprovada). Esta rodada só olhou o diff: a fixture `tomarNomeNoBanco` em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts:869-875` e os dois testes que a chamam, em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/turma-publica.spec.ts:528` e `:574`.

**Cobertos:**
- **A recomendação foi feita.** O `update` agora confere o `rowCount` e lança erro se não for 1.
- **O furo fechou.** Se o radio vier sem `value`, o `?? ''` manda id vazio, a atualização não acha linha, o `rowCount` vem 0 e o teste quebra na preparação. Antes, nesse caso, o teste seguia com o nome livre e passava sem provar a disputa pelo nome que diz provar. Agora a disputa só é exercitada com o nome de fato tomado no banco.
- **A troca de escola também quebra a preparação.** O filtro continua sendo `escola_id = $1 and id = $2`, então um id de outra escola não atualiza nada e o teste para em vez de seguir com um falso verde.
- **Nada saiu do lugar.** Nenhuma asserção dos testes mudou, não há `.skip` nem mock novo, e o código de produção não foi tocado. O que foi aprovado na 4ª rodada continua valendo.

**Bloqueantes:** nenhum.

**Recomendações:**
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/turma-publica.spec.ts:648` (`idDe`) usa o mesmo padrão `getAttribute('value') ?? ''`. Se o retorno dele não passar por uma fixture que confira o resultado, vale a mesma proteção: falhar quando o `value` vier vazio, em vez de seguir com `''`. Não bloqueia; fica registrada para o `/validar`.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-03 02:08:39 · `tasks/prd-apresentacao-escola/17_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, e2e, infra)
Bloqueantes: nenhum
Recomendações:
- A correção pedida está feita. Em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts:871-873`, `tomarNomeNoBanco` agora lê o `rowCount` do `update` e lança erro quando ele não é 1. Antes, um id vazio deixava o teste seguir com o nome livre. O `update` filtra por `escola_id` e `id`, então o escopo continua certo.
- A tabela "Recomendações sem aplicar" em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/17_task.md:242` registra a recomendação do `test-engineer` (5ª rodada) sobre o `?? ''` do `idDe` como recusada. O motivo se sustenta: o valor vazio deixa o teste vermelho, e não verde.

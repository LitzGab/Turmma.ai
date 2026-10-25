# Achados das revisões — `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 16:41:27 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (o desvio da primeira entrada em `/`; não há rota, query nem migration nova)
Rate limit: ok (sem mudança; o `POST /v1/eu/introducao` é da 1.0, já auditada, e passa pela sessão e pela permissão `eu/concluir_introducao`)
Fila e prioridade: ok (não se aplica; a escrita é um `UPDATE` síncrono de uma linha, pela chave, com `coalesce`)
Concorrência: protegida. O duplo clique em "Continuar" ou "Pular" é barrado pelo `jaGravou` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/BemVindo.tsx`. Se a tela for montada de novo, o `coalesce(introducao_vista_em, now())` torna o POST idempotente no banco. A mutation não repete sozinha: `cliente-de-consultas.ts` só define `retry` para queries. Quem revê a introdução não grava nada.
Índice e paginação: ok (não se aplica; nenhuma query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não há código novo no servidor. O contador `eu.introducao_falha` e o gráfico dele vieram da 1.0, sem alerta, então sem parágrafo novo no runbook)
Bloqueantes: nenhum
Recomendações:
- `infra/k6/login-7h30.js`: o seed da rajada cria as contas de aluno com a introdução já vista (techspec, seção de carga, linha 152). Por isso o primeiro dia de aula não é medido: as 400 primeiras entradas fazem `GET /v1/eu`, abrem a introdução e mandam o `POST /v1/eu/introducao`. O risco é baixo, porque é um `UPDATE` pela chave por pessoa e uma vez só na vida. Ainda assim vale uma variante da fase `rajada` com uma parte das contas em `por_ver`, com o p95 desse POST em `autenticada_duracao`. Destino sugerido: `TODO.md`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/paginas/Inicio.tsx`: quando a gravação falha, o cache `['eu']` continua com a data nula. Toda volta a `/` na mesma sessão abre a introdução de novo e manda outro POST. A tarefa aceita isso ("a introdução volta na entrada seguinte"). Se o contador de falhas subir em produção, convém registrar o comportamento no runbook.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-25 16:41:28 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: sim (14 fotos lidas, cheia e vazia: os 4 passos de `/aluno/bem-vindo` a 1366 e a 360 px, a vazia da introdução e `/aluno/eu` cheia e vazia nos dois tamanhos). Não vi o modo "primeira vez", com Pular e sem Fechar. A foto é do modo "rever"; esse modo eu conferi pelo código (`Introducao.tsx`) e pelo e2e.

Estados: ok.
- Carregando: a fala do passo 1 com o "Sair" (`BemVindo.tsx:109-118`).
- Erro: `EstadoErro` com "Tentar de novo" e "Voltar para a abertura" (`BemVindo.tsx:91-107`).
- Vazio: a introdução não tem vazio próprio. Em Eu, o cartão "Nada corrigido ainda" convida e diz o próximo passo.
- Com dado: ok.
- Carregando e erro não aparecem na vitrine, então conferi só pelo código.

Acessibilidade: ok.
- A fala recebe o foco a cada passo, e o foco aparece na foto.
- "Passo N de M" é anunciado por leitor de tela.
- A região rolável do aviso tem nome e entra no Tab.
- O Esc só fecha quando a pessoa está revendo.
- O e2e a 360 px roda a verificação de violações graves no passo 3.

Chromebook fraco: ok.
- A introdução vem num chunk `lazy` próprio.
- Não há lista longa nem imagem.
- A tela não rola a 1366 × 768, e só o miolo do aviso rola, como o RF20 pede.

Celular:
- Os 4 passos a 360 px não têm rolagem horizontal, e "Continuar", "Fechar" e "Sair" passam de 44 px nas fotos.
- O e2e mede os 44 px e a largura excedente.
- Nada depende de hover.
- Não vi a tela passar no projeto `celular`: li o código do e2e, mas não o rodei.
- Em `/aluno/eu` a 360 px há um defeito, descrito abaixo.

Ação oficial protegida: sim. Não há ação oficial nesta tarefa. "Sair" e "Fechar" têm o mesmo tamanho de "Continuar", e nada grava ao sair (D59).

Bloqueantes:
1. `apps/web/src/areas/aluno/Eu.tsx:53` com `apps/web/src/componentes/ui/Linha.tsx:58`.
   - O que está errado: a linha nova "Rever a introdução" aparece cortada a 360 px como "Rever a introd...". É o título que a tarefa acrescentou, e a `Linha` o trunca com reticências. Está em `.processo/vitrine/aluno--aluno-eu--celular.png`, e a vazia (`.processo/vitrine/vazia--aluno--aluno-eu--celular.png`) mostra a linha inteira só no desktop. Texto cortado em 360 px é bloqueante, e o RF9 dá a esse título o nome "Rever a introdução".
   - Correção exigida: o título tem de caber inteiro a 360 px. Duas saídas, a escolha é de quem implementa:
     - deixar a `Linha` quebrar o título em duas linhas quando ele não cabe (o `min-h-16` já comporta);
     - ou encurtar o rótulo e atualizar o RF9 e os testes.
   - Acrescentar uma asserção no e2e `celular` de que o título da linha não está truncado (`scrollWidth <= clientWidth`).
   - Observação: a foto vem do último e2e. Se o código da árvore contradisser a foto, vale o código, mas o `truncate` na linha 58 da `Linha` confirma o corte.

Recomendações:
- `apps/web/src/areas/aluno/introducao/BemVindo.tsx:40`: o aviso de privacidade (16 frases) mostra só 3 delas em `max-h-[28dvh]`, e a 360 px a última frase visível aparece cortada no meio da linha. Não há sinal visual de que dá para rolar (degradê ou "role para ler mais"). Como o aviso é a parte que o aluno precisa ler, vale deixar claro que tem mais. A 360 px de largura e ~800 px de altura sobra espaço, e o `max-h` poderia ser maior no celular.
- Passo 3: o "Continuar" libera sem ter rolado o aviso inteiro. Não é exigência do PRD, mas fica registrado para a validação.
- No celular, a barra de baixo (Início, Tarefas, Eu) aparece sobre o conteúdo na foto de página inteira de `/aluno/eu`. É efeito da barra fixa na captura, não do código.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 16:41:38 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa só toca tela, texto, rotas, documentação e e2e. O único POST novo é `concluirIntroducao`, que grava `introducaoVistaEm`. Todos com autor humano? Não se aplica, porque nada grava em Nota.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. A tarefa não cria nenhuma saída de IA. As falas e o aviso são texto fixo em `.ts`, com teste, sem nada gerado por modelo. A exceção da D47 continua só no tutor.

Supervisão do tutor: ok.
- O passo 2 diz ao aluno o que quem dá a aula vê, e é só uso e dificuldade: onde travou, se pediu a resposta pronta, qual dúvida repetiu. O texto está em `textos-da-introducao.ts:31` e aparece nas fotos `aluno--aluno-bem-vindo--Continuar--*.png`.
- O aviso usa a mesma frase da faixa do Início (`TEXTO_DA_SUPERVISAO`), importada e não repetida.
- Não há inferência emocional nem nada sobre comportamento.

Autonomia declarada e visível: sim. A tarefa não muda nada nisso.

Outros pontos da regra 70 nesta tarefa:
- **Identidade de IA (item 4a, D58):** o passo 1 diz "um programa da escola", "posso errar" e "sou um programa, e não uma pessoa". As fotos mostram o selo "Tutor · IA" em todo passo. Há teste contra afirmar ser pessoa, professor ou amigo, prometer voltar ou esperar, e falar de vínculo ou saudade (`textos-da-introducao.test.ts:577-610`).
- **Uso excessivo e saída (item 4b, D59):**
  - O "Sair" aparece em todo passo, inclusive no carregando e no erro, e não grava nada.
  - Nos passos 1 a 3 não há "Pular", mas são avisos, e sair continua a um clique.
  - No passo 4, "Pular" tem o mesmo tamanho de "Continuar".
  - Revendo, todo passo fecha.
  - Não há pontos, sequência nem contador (`BemVindo.test.tsx:328`).
- **Nota (D55, D46):** nenhuma tela desta tarefa mostra nota, conceito ou sugestão de nota. O teste recusa a palavra "nota" no aviso (`textos-da-introducao.test.ts:496`). O "1 de 4 certas" que aparece em `aluno--aluno-eu--*.png` é o resultado de objetiva de "Como estou indo", que vem de uma tarefa anterior e não mudou aqui.
- **Medir o professor (item 8, D45):** não se aplica, porque a tarefa não toca indicador de professor.

Bloqueantes: nenhum.

Recomendações:
1. **Dizer que o professor pode abrir a conversa.** Isso fica para o `privacy-guardian` e para o produto. Arquivos: `apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts:21` e `:28`.
   - Hoje o aviso diz que "guardamos o que você escreve para o Tutor" e que "quem dá a aula acompanha como você usa o Tutor".
   - Não diz que o professor da turma pode abrir a conversa, e que isso fica registrado (regra 50, item 10).
   - Para um aluno de 11 anos, "acompanha" não deixa isso claro. Uma frase curta resolveria, por exemplo "Quem dá a aula pode abrir a conversa; isso fica registrado.", se for verdade no produto.
2. **Deixar claro quem guarda os dados.** Na foto `aluno--aluno-bem-vindo--Continuar-Continuar--computador.png`, o aviso aparece como fala do Tutor, com o selo "IA". A fala diz "a escola guarda" (`aviso-de-privacidade.ts:17`), mas as frases dizem "Guardamos…" (`:19-21`). Dita pela onça, a primeira pessoa do plural sugere que é a IA quem guarda os dados. Sugestão: trocar para "A escola guarda…" nas três frases. Isso também combina com a escola como controladora (D10).
3. **Fazer o e2e conferir a frase do aviso.** O e2e copia as falas à mão em `e2e/__fixtures__/casca.ts:416-421`, o que está registrado e justificado. Vale um teste de unidade que compare essa lista com `PASSOS_DO_ALUNO`, para que uma mudança no texto do aviso não passe só pelo componente.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/textos-da-introducao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/BemVindo.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/BemVindo.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/paginas/Inicio.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Eu.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-introducao.spec.ts`
- os 10 PNGs em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/vitrine/`

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 16:41:43 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

VEREDITO: APROVADO

Escopo: respeitado. As subtarefas 9.1 a 9.5 estão feitas. A tabela do desvio em `Inicio.tsx` só tem a linha do aluno, e o teste confirma que professor e coordenação com a data nula continuam indo para a abertura deles: isso fica para a 10.0 e a 11.0.

Aderência à Tech Spec: ok. As três divergências declaradas já estão na `techspec.md`:
- O aviso sobre a IA virou duas frases, registrado no §7b.
- "Começar" passa a ser o último "Continuar", registrado no §9.
- Quem revê volta a Eu sem gravar nada, registrado no §5 "Rever".

Esta spec não tem `cenarios.md`, então não há onde a divergência pudesse ficar faltando. O item que estava `NÃO VERIFICADO` no §12 foi conferido contra `sinal.ts` e `uso.ts`, e o passo 2 diz só o que o professor vê.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo).

Bloqueantes: nenhum.

Recomendações:
1. **`TODO.md:57` está desatualizado.** Ainda diz "Aviso de privacidade em linguagem de faixa etária... Não existe hoje", mas `docs/lgpd.md` e `docs/conformidade-mec.md` já dão o aviso como feito. Marque o item como concluído e deixe nele o que falta: a revisão do texto por orientação educacional e por advogado. O `conformidade-mec.md` §12 diz que cada lacuna tem item no `TODO.md`.
2. **"Rever a introdução" aparece cortado no celular.** Na foto `aluno--aluno-eu--celular.png` lê-se "Rever a introd…", produzido por `apps/web/src/areas/aluno/Eu.tsx:55`. O aluno não lê o nome inteiro da linha. A qualidade visual é do `frontend-reviewer`; fica registrado para ele.
3. **Quem revê fica com Eu duas vezes no histórico.** Em `apps/web/src/areas/aluno/introducao/BemVindo.tsx:111`, quem revê chega pelo link de Eu, e o fechamento volta a Eu com `replace: true`. Depois disso, o "voltar" do navegador abre Eu de novo. Fechar com `history.back()` quando se chegou por Eu, ou trocar o `replace`, evita a volta inútil.
4. **Comentário repetido em `apps/web/src/paginas/Inicio.tsx`.** O comentário de `ABERTURA_POR_PAPEL` (linhas 15 a 18) repete o comentário do componente `Inicio` logo abaixo. Basta manter um dos dois.
5. **As falas estão copiadas no e2e.** `e2e/__fixtures__/casca.ts` repete as falas de `textos-da-introducao.ts` em `FALAS_DA_INTRODUCAO_DO_ALUNO`. O comentário explica o motivo, mas, se o texto mudar, só o e2e vai acusar a diferença. Vale ver se o `e2e/` pode importar o `.ts` puro, como já importa `packages/shared/src`.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-25 16:42:48 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

VEREDITO: REPROVADO

Cenários exigidos:
- **Caminho feliz:** na primeira entrada (data nula) a raiz leva à introdução. O aluno passa pelos quatro passos, a data é gravada e ele vai ao Início. Revendo pela linha de Eu, todo passo fecha.
- **Bordas:**
  - a segunda entrada em outro computador não mostra a introdução de novo
  - o aluno seguinte no mesmo computador vê a introdução dele, sem sobra do cache do anterior
  - o POST que falha não prende ninguém, e a introdução volta na próxima entrada
  - "Sair" e fechar a aba no meio não gravam nada
  - no passo 4, seguir ou pular sem escolher a letra deixa o armazenamento vazio
  - a 360 px, com "Maior", não há rolagem lateral
  - uma releitura do `/v1/eu` que falha não tira os passos da tela
- **Permissão:**
  - nos passos 1 a 3 da primeira vez não há "Pular" nem "Fechar", e o Esc não sai
  - professor e coordenação com data nula não caem na introdução do aluno
  - revendo, nada é gravado e a data não muda
- **Concorrência:** clique duplo no último "Continuar" faz um POST só. A idempotência no servidor e o isolamento da data são da 1.0.

Cobertos (os 5 arquivos de unidade e componente rodaram: 77 testes verdes):
- **Texto do aviso:** as 16 frases têm uma asserção cada, e apagar qualquer uma deixa um caso vermelho. Também estão testados: o limite de 15 palavras, os termos proibidos (com a lista conferida contra exemplos), o piso e o teto lidos de `CATEGORIAS_DE_RETENCAO`, o número só na frase do Tutor e a supervisão igual a `TEXTO_DA_SUPERVISAO`.
- **Passo 1 e passos obrigatórios:** testados.
- **Falas (D58, D59):** testadas, e as três regex são conferidas contra exemplos positivos e contra "e não uma pessoa".
- **Quatro estados da `BemVindo`:** testados.
- **Passo 4:** coberto no componente e no e2e.
- **Avisos sem "Pular":** testado; o "Pular" do passo 4 é comparado com o "Continuar" pela classe no componente e pela caixa no e2e.
- **Sair no meio e POST que falha:** coberto no componente e no e2e.
- **Primeira e segunda entrada:** e2e, com `newContext` e o armazenamento vazio.
- **Rever e duplo clique:**
  - no componente, a gravação fica segurada até o fim do caso, então o segundo clique não cai em "revendo": a trava `jaGravou` é provada de verdade;
  - o e2e confere a data antes e depois de recarregar.
- **Recomeço da tela e 360 px:** e2e.
- **Desvio em `Inicio.tsx`:** os testes de carregando, erro, aluno com data nula e outros papéis mostram que a tabela por papel funciona.
- **Mutações:** todas as cláusulas novas do diff em `BemVindo.tsx`, `Inicio.tsx`, `Eu.tsx`, `rotas.tsx` e nos dois `.ts` de texto têm bloco. Não encontrei bloco vermelho pelo motivo errado. O bloco `eu.data.introducaoVistaEm` quebra justamente a proteção contra `undefined` que ele remove.
- Não há `.skip`, nem teste comentado, nem chamada a provedor de IA.

Bloqueantes:
- `apps/web/src/areas/aluno/introducao/BemVindo.test.tsx:306-307`: no caso "com a data já gravada, todo passo fecha, 'Fechar' volta a Eu sem gravar e o Esc faz o mesmo", o Esc é pressionado depois de o "Fechar" já ter levado a `/aluno/eu`. A `BemVindo` continua montada e a navegação usa `replace`, então `history.at(-1)` é `/aluno/eu` com ou sem o Esc fazer alguma coisa. A asserção sempre passa (regra 40, item 5). A divergência 3 da própria tarefa declara que "o Esc leva a Eu" revendo, e o e2e de rever também não testa o Esc.
  - **Correção exigida:** num caso próprio, ou antes de clicar em "Fechar", montar com `euComData(DATA_ANTIGA)` e parar num passo obrigatório da primeira vez (o 1 ou o 2). Pressionar Esc e afirmar que `localizacao.history.at(-1)` passou de `/aluno/bem-vindo` para `/aluno/eu`, sem nenhum POST.

Recomendações:
1. `e2e/aluno-introducao.spec.ts:172-174`: o `contarGravacoes` é ligado logo antes do `page.close()`, então `expect(gravacoes).toHaveLength(0)` só pegaria um POST feito ao descarregar a página. Ligá-lo antes do primeiro "Continuar", como no caso de "Sair", deixa a asserção cobrir o caminho todo. Quem prova a regra hoje é a aba nova voltando à introdução.
2. "Todo passo fecha" (componente, linhas 299-304, e e2e, linhas 235-241): o "Fechar" aparece em todo passo, mas só é clicado no passo 4, que nem é obrigatório. Clicar no passo 1 cobre o caso que importa.
3. `aviso-de-privacidade.ts:37`: "O que você escreve e as habilidades a rever vão a um programa de IA." perdeu o "ao Tutor" da subtarefa 9.1. A divergência diz que o conteúdo é o mesmo, mas a frase ficou mais ampla e pode ser lida como se as respostas das tarefas também fossem à IA. Fica para o `privacy-guardian` confirmar.
4. O e2e "passo 4: seguir sem escolher a letra…" usa "Pular". O "seguir" está coberto no primeiro caso e no `it.each` do componente; o nome do caso pode dizer "pular".
5. O e2e de duplo clique sozinho não prova a trava, porque a navegação pode engolir o segundo clique. Quem prova é o caso do componente com a gravação segurada. Vale citar isso no comentário do e2e.
6. `Inicio.test.tsx`: o laço com `cleanup()` e `vi.unstubAllGlobals()` dentro do caso ficaria mais limpo como `it.each`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/BemVindo.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-introducao.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/paginas/Inicio.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Eu.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/rotas.test.tsx`

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-25 16:43:09 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

VEREDITO: REPROVADO

Campos pessoais tocados: nenhum campo novo. A tarefa só lê `introducaoVistaEm` pelo `GET /v1/eu` e grava pelo `concluirIntroducao` da 1.0. O `localStorage['educa.letra']` vem da 8.0. Os dois já estão em `docs/lgpd.md`, linhas 105 e 106. A tarefa entrega o texto do aviso de privacidade do aluno e marca o item como resolvido em `docs/lgpd.md:369` e em `docs/conformidade-mec.md`.

Fora da tabela de dados do docs/lgpd.md: nenhum campo. Mas o aviso deixa de fora um dado que está na tabela (linhas 53 e 59) e chega nominal ao professor: o sinal "precisa de atenção humana". Ver o bloqueante.

Autorização por objeto: ok. Não há rota nova de API. A `BemVindo` só lê o `/v1/eu` da própria pessoa, e o desvio em `apps/web/src/paginas/Inicio.tsx` decide só pelo papel e pela data dela.

Logs: limpos. Não há log, `console.*` nem logger nos arquivos novos.

Auditoria: nenhuma ação desta tarefa exige auditoria. Concluir ou rever a introdução não é leitura de dado de aluno por terceiro.

Envio externo: nenhum. A introdução não chama modelo (RF18).

Seed/fixture: sintético. As fotos mostram "Aluno Sintético Caio df86225e" e "Colégio sintético da vitrine cheia". Os testes usam "Camila Souza" e as matrículas "1001" e "1002".

Fotos da tela: nenhuma mostra matrícula, dado de colega ou dado fora do contrato. Eu (`aluno--aluno-eu--computador.png`) mostra turma, série, escola e "Como estou indo", o mesmo de antes, mais a linha "Rever a introdução". Os passos 1 a 4, na escola cheia e na vazia, só mostram texto fixo.

Bloqueantes:

1. **O aviso não diz que o professor recebe, com o nome do aluno, o sinal "precisa de atenção humana".**
   - **O que o sistema faz:** quando o aluno escreve ao Tutor sobre um assunto pessoal delicado, o servidor grava o sinal `atencao_humana` (`apps/api/src/tutor/tutor.service.ts:309` e `:351`). Ele fica guardado 12 meses (`docs/lgpd.md:59`). O professor da turma o recebe com o nome do aluno e a hora (`apps/api/src/tutor/supervisao.service.ts:14-15`, `aluno: { id, nome }`).
   - **O que o aviso diz:** o passo 2 enumera o que quem dá a aula vê: "onde você travou", "se você pediu a resposta pronta" e "qual dúvida você repetiu" (`apps/web/src/areas/aluno/introducao/textos-da-introducao.ts:31`). O grupo "Quem vê" (`aviso-de-privacidade.ts:56`) e o "O que guardamos" também não falam desse sinal. O teste `textos-da-introducao.test.ts:111` ("o passo 2 diz **só** o que o professor vê…") trava a lista incompleta.
   - **Por que pesa:** é o tratamento mais sensível que o sistema faz sobre um menor, uma inferência ligada ao bem-estar dele. A mensagem fixa que o aluno recebe na hora (`packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:82-92`) também não diz que o professor será avisado. Somado a "Seus colegas não veem nada seu", o aluno de 11 anos entende que a conversa só gera os três sinais de estudo. É falta de transparência (LGPD art. 6, VI, art. 9 e art. 14, § 6º; ECA Digital art. 16), e é justamente o item que a tarefa marca como `[x]` em `docs/lgpd.md:369`.
   - **Correção exigida, uma das duas:**
     - (a) Uma frase de até 15 palavras no passo 2 ou em "Quem vê". Por exemplo: "Se você contar algo pessoal difícil, quem dá a aula é avisado." Ela precisa de asserção própria no `textos-da-introducao.test.ts` e de bloco de mutação. O teste da linha 111 sai do "só" ou passa a incluir a frase.
     - (b) Se a omissão for deliberada, por proteção da criança, para não inibir o pedido de ajuda: o Joaquim registra a decisão com o motivo em `docs/aia/tutor.md`, pendência 12. Nesse caso, `docs/lgpd.md:369` e `docs/conformidade-mec.md`, item 3, não marcam o aviso como completo enquanto essa lacuna estiver aberta.

Recomendações:
- "Esse programa é de uma empresa contratada" só é verdade quando o provedor configurado é externo. Na VM de produção com modelo local, o aviso diz mais do que acontece. Isso não prejudica o aluno, mas convém ligar a frase ao cadastro de suboperador da escola quando houver tela para isso.
- O aviso não fala do registro de acesso (IP e hora, 6 meses; `docs/lgpd.md:100`). É dado técnico; cabe em "Meus dados", sem precisar entrar no passo 3.
- O passo 3 é obrigatório, mas no celular só cabem duas frases e meia antes de "Continuar" (`aluno--aluno-bem-vindo--Continuar-Continuar--celular.png`), e nada pede a rolagem. Para o aviso ser lido de fato, vale um indicador de "há mais abaixo" ou o "Continuar" liberado ao fim da região. A decisão visual é do `frontend-reviewer`.
- A frase "O que você escreve e as habilidades a rever vão a um programa de IA" está certa. A memória enviada ao modelo é acertos e erros por habilidade (`turno-do-tutor.ts:49-62`), e a adaptação não sai com o aluno (`adaptar-atividade.ts:9-10`). Se a entrada do Tutor ganhar campo, esta frase muda junto.

Pergunta de fechamento: o código responde. A tarefa não muda o arquivo do titular, a lista de compartilhamento (`consumo_ia.provedor`) nem a auditoria. O que falha aqui é o que o aluno lê sobre esse tratamento, não o que o sistema consegue responder à secretaria.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-25 17:09:53 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

VEREDITO: APROVADO
Tela vista: sim (17 fotos lidas, cheia e vazia: `/aluno/eu` nos dois tamanhos, `/aluno/bem-vindo` nos passos 1, 3 e 4 na escola cheia, e passo 1 e `/aluno/eu` na vazia; os passos 2 e 4 só no celular)
Estados: ok. A introdução tem carregando, erro e "primeira vez" ou "revendo" no código e no componente. A vazia mostra o passo 1 e `/aluno/eu` com "Nada corrigido ainda", que diz o próximo passo.
Acessibilidade: ok. O aviso rolável é uma região com nome e entra no Tab, então o teclado rola. O foco aparece nas fotos. O indicador "Role para ler mais" é `aria-hidden`, o que está certo porque é só pista visual. A cor `sutil` (#5d5d5d) é o piso de texto do projeto.
Chromebook fraco: ok. Nada de lista longa. O aviso rola só no miolo, o "Continuar" fica à vista e a página não rola a 1366 × 768 nas telas de introdução.
Celular: ok. A 360 px não há rolagem horizontal. "Fechar", "Sair" e "Continuar" têm 44 px ou mais, e a `Linha` tem `min-h-16`. Nada depende de hover. A página `/aluno/eu` rola a 1366 × 768 (1188 px), o que o PRD permite e o mockup não proíbe.
Ação oficial protegida: sim. Nada oficial acontece nesta tarefa. "Rever" e "Fechar" não gravam, o que os testes provam.

Correção exigida da rodada anterior: feita.
- Em `apps/web/src/componentes/ui/Linha.tsx:63`, o título "Rever a introdução" quebra em até duas linhas com `line-clamp-2 break-words`. Na foto `aluno--aluno-eu--celular.png` ele aparece inteiro ("Rever a / introdução"). Os outros títulos seguem com `truncate`.
- O e2e novo em `e2e/aluno-introducao.spec.ts` ("cabe inteira a 360 px") confere `scrollWidth - clientWidth` e a altura, os dois iguais a 0.
- `Eu.test.tsx` e `Linha.test.tsx` provam a classe de cada caso.

Recomendações da rodada anterior: tratadas.
- O aviso agora tem a faixa "Role para ler mais". Ela aparece no pé da região (`BemVindo.tsx`) enquanto há o que ler e sai ao chegar ao fim, com teste de cada transição. Ela cobre a última linha visível, o que é o efeito desejado.
- O "Continuar" do passo 3 continua liberando sem rolar tudo. Não é exigência do PRD.

Bloqueantes: nenhum.

Recomendações:
1. `apps/web/src/areas/aluno/introducao/BemVindo.tsx`, `useState(true)` de `haMais`: se a região um dia couber inteira (tela muito alta, ou o texto encurtado), nenhum evento de scroll dispara e a faixa fica para sempre sobre a última linha. Hoje não acontece, porque as 17 frases passam de `28dvh` em qualquer tela real. Mesmo assim, vale medir `scrollHeight > clientHeight` na montagem, com `useLayoutEffect` ou um ref.
2. As fotos de `/aluno/eu` no celular (cheia e vazia) mostram a barra de abas fixa sobre o conteúdo. É o efeito da captura de página inteira com elemento fixo, não defeito da tela. Recomendo `scroll-padding` ou `pb` no miolo só se a validação visual real mostrar a última linha escondida atrás da barra.
3. As falas do passo 3 mudaram de "Guardamos" para "A escola guarda" e ganharam o aviso de atenção ("Se você contar algo pessoal difícil, quem dá a aula é avisado"). O texto é mais claro e honesto. Vale conferir que `docs/lgpd.md` e `docs/aia/tutor.md`, ambos alterados nesta tarefa, dizem o mesmo.

Teste rodado: Vitest nos 5 arquivos da introdução, `Eu`, `Linha` e `Inicio` passou, 98 testes. O e2e não foi rodado por mim. Julguei a tela pelas fotos e pelo código.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-25 17:10:24 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

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
- A recomendação da 1ª rodada foi cumprida. O `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/TODO.md` agora registra a variante do `infra/k6/login-7h30.js` com parte das contas em `por_ver`. Continua aberta, e precisa estar pronta antes de ligar a introdução no piloto.
- Fora da carga, só para registro. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/BemVindo.tsx`, o `haMais` começa em `true` e só muda quando a região rola. Numa tela em que o aviso cabe inteiro, "Role para ler mais" fica à vista sem ter o que rolar. A correção é medir a região ao montar.

O diff entre as duas rodadas não toca API, banco, fila, worker, IA nem o roteiro do k6. Mudaram só a web (`Linha`, `Eu`, `BemVindo`, o aviso de privacidade, `Inicio`), os testes, o e2e e a documentação. O fluxo segue com o mesmo número de requisições: nenhum `fetch` novo, e o `POST /v1/eu/introducao` não mudou. O teste novo de `textos-da-introducao.test.ts` só lê um arquivo local e não chama provedor pago.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-25 17:10:41 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

VEREDITO: APROVADO

**Correção exigida na rodada 1:** feita pela saída (a).
- A frase "Se você contar algo pessoal difícil, quem dá a aula é avisado." (11 palavras) está em `apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts:38` (`FRASE_DO_AVISO_DE_ATENCAO`), dentro do grupo "Quem vê".
- Tem asserção própria, com âncoras `^…$`, em `apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts:56`.
- O teste da tela que confere cada frase do aviso desenhada uma vez também a cobre, porque percorre `GRUPOS_DO_AVISO`.
- O teste do passo 2 deixou de dizer "só" e passou a apontar o aviso.
- Há um bloco de mutação que tira a frase do grupo e cita esse caso (`tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`).
- A frase diz a verdade, e não diz mais do que o sistema faz:
  - O professor da turma recebe o sinal só com o tipo, o aluno e a hora (`apps/api/src/tutor/supervisao.service.ts:10-15`).
  - A coordenação só vê a soma da escola inteira, e numa turma o sinal fica de fora (`apps/api/src/governanca/analista.repository.ts:166`, `packages/shared/src/governanca/analista.ts:87`).
  - O aviso não promete que o professor abre a conversa.
- Com a saída (a), o "aviso completo" de `docs/lgpd.md:369-373` e de `docs/conformidade-mec.md` (item 3) fica coerente. `docs/aia/tutor.md` (pendência 12) e `TODO.md` registram o que falta: a revisão do texto por orientação educacional e por advogado, e a decisão do Joaquim sobre a mensagem fixa do Tutor na hora do sinal.

**Restante do diff:**
- Trocar "Guardamos…" por "A escola guarda…" está certo: a escola é a controladora (D10), e quem fala na tela é o Tutor (D58).
- A faixa "Role para ler mais" atende a recomendação da rodada 1.
- A prop `tituloEmDuasLinhas` da `Linha`, as mudanças nos testes e no e2e e a conferência das falas em `e2e/__fixtures__/casca.ts` não tocam em dado de pessoa.

**Fotos:**
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/vitrine/aluno--aluno-bem-vindo--Continuar-Continuar--computador.png` e `...--celular.png`: o passo 3 mostra "O que a escola guarda" e a faixa de rolagem. A frase nova fica abaixo da dobra, e a presença dela está provada pelo teste da tela.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/vitrine/aluno--aluno-eu--celular.png`: só a turma, a escola e os resultados do próprio aluno, tudo sintético. Não aparece nada de colega nem de outra pessoa.

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum campo novo; só texto do aviso de privacidade (web), que descreve campos já mapeados (sinal "precisa de atenção humana", docs/lgpd.md:59)
Fora da tabela de dados do docs/lgpd.md: nada
Autorização por objeto: ok (o diff não tem rota nem repository)
Logs: limpos
Auditoria: presente (o diff não cria nenhuma ação que exija auditoria; a revisão da introdução não grava nada)
Envio externo: nenhum novo; o aviso diz que o texto e as habilidades a rever vão a um programa de IA de empresa contratada (D62), como na rodada 1
Seed/fixture: sintético (vitrine "Colégio sintético da vitrine cheia", turma "2ºB df86225e"; e2e com criarAlunoComMatricula)
Bloqueantes: nenhum
Recomendações:
- A recomendação da rodada 1 sobre o registro de acesso (Marco Civil), que o aviso não menciona, não ganhou destino: nem em `TODO.md`, nem na tabela "Recomendações sem aplicar" de 9_task.md, que está vazia. Registrar junto com a pendência 12 de docs/aia/tutor.md, para a revisão do advogado decidir.
- Quando o Joaquim decidir sobre a mensagem fixa do Tutor ao receber o sinal (`TODO.md`), ela e a frase do aviso devem dizer a mesma coisa, de preferência a partir de uma constante só.
- "Esse programa é de uma empresa contratada": já tem destino em `TODO.md`, para ser ligada ao cadastro de suboperadores. Fica só registrada aqui.
```

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-25 17:11:04 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum neste diff. A rodada só mexeu em texto da web, testes, e2e e documentação; não há migration, repository, job, seed ou webhook. Todos com autor humano? sim, porque nada mudou.

Decisão autônoma sobre aluno: ausente

Aprovação registrada: ok. O diff não traz saída de IA nova para o aluno. As falas da introdução são texto fixo com o selo "Tutor · IA" em todas as fotos.

Supervisão do tutor: ok. A frase nova é `FRASE_DO_AVISO_DE_ATENCAO` = "Se você contar algo pessoal difícil, quem dá a aula é avisado.", em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts:38`. Conferi com o código e a regra:
- **Item 4 e D36:** a frase descreve o que o sistema faz de fato. Em `apps/api/src/tutor/tutor.service.ts:305-310`, quando o assunto é delicado, o servidor grava o sinal `atencao_humana`. Em `apps/api/src/tutor/supervisao.repository.ts:151-159`, esse sinal chega a todo professor com vínculo na turma. Por isso "quem dá a aula" está certo, sem dizer "o seu professor" no singular. O sinal sai só com tipo, aluno e hora (`supervisao.service.ts:10-16`). A frase não diz que o professor lê a conversa, o que também está certo: nada na tela abre a conversa. Com isso, a recomendação 1 da rodada anterior foi resolvida do jeito correto.
- **Item 7 e D36 ("o gatilho é o que o aluno escreveu"):** a frase depende do que o aluno conta ("Se você contar…"). Ela não fala de humor, emoção ou estado do aluno. O aviso continua sem inferir estado do aluno.
- **Item 4a:** a frase não personifica o Tutor e não sugere vínculo. As fotos do passo 1 continuam com "Eu sou um programa, e não uma pessoa."
- **Item 4b:** a faixa "Role para ler mais" (`BemVindo.tsx:70-74`) só avisa que o texto continua. Ela não prende o aluno e sai quando ele chega ao fim do texto. "Fechar" e "Sair" continuam à vista em todos os passos, e "Pular" segue a mesma regra da rodada 1.

Autonomia declarada e visível: sim, sem mudança nesta rodada.

Bloqueantes: nenhum.

As três recomendações da rodada 1 foram atendidas:
1. O aviso não promete que o professor abre a conversa, porque isso não acontece no produto. O motivo está documentado em `aviso-de-privacidade.ts:32-37` e em `docs/aia/tutor.md`, pendência 12.
2. "Guardamos…" virou "A escola guarda…", e o título do grupo virou "O que a escola guarda".
3. O teste `textos-da-introducao.test.ts`, "as falas que o e2e espera", compara `FALAS_DA_INTRODUCAO_DO_ALUNO` de `e2e/__fixtures__/casca.ts` com `PASSOS_DO_ALUNO`.

Fotos (`.processo/vitrine/`):
- **`aluno--aluno-bem-vindo--Continuar-Continuar--computador.png` e `--celular.png`:** o aviso mostra "O que a escola guarda" e a faixa "Role para ler mais". A frase nova fica abaixo da dobra; ela é provada pelo teste de conteúdo, que exige cada frase exatamente uma vez.
- **`aluno--aluno-eu--celular.png`:** "Rever a introdução" quebra em duas linhas, sem cortar o texto. "Como estou indo" mostra acertos de objetiva ("1 de 4 certas"), que não são nota de discursiva nem de redação. Isso já existia e não é deste diff.
- **Passos 1, 2 e 4:** não há nota, conceito nem sugestão de nota em nenhuma tela. A saída de IA aparece rotulada como IA.

Recomendações:
- A mensagem fixa que o aluno recebe na hora, quando conta algo pessoal difícil, ainda não diz que o professor é avisado. O aviso de privacidade resolve isso no primeiro acesso, mas quem ainda não viu a introdução, ou não lembra dela, só sabe disso pelo aviso. A pendência já está no `TODO.md` (linhas 58-62), com a decisão do Joaquim. Ela merece entrar na validação desta spec, porque é o ponto de maior impacto na confiança do aluno: ele precisa saber que um adulto vai saber.
- `FRASE_DO_QUE_NAO_TEMOS` ("Não temos seu e-mail…") ficou na primeira pessoa, enquanto o grupo agora fala em "A escola guarda". A frase é verdadeira para escola e operador, mas a voz ficou misturada. O ajuste pode ir na revisão por orientação educacional e advogado (pendência 12).

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/BemVindo.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/src/tutor/tutor.service.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/src/tutor/supervisao.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/TODO.md`

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 17:11:09 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

VEREDITO: APROVADO

**Correção exigida na 1ª rodada: feita.**
- `apps/web/src/areas/aluno/introducao/BemVindo.test.tsx:343-356`: há agora um caso para o Esc, rodado nos passos 1, 2 e 3, montado com `euComData(DATA_ANTIGA)`. Ele afirma que a tela está em `/aluno/bem-vindo` antes do Esc e em `/aluno/eu` depois, sem nenhum POST. O Esc é o único gesto do caso, então a asserção falharia se o `podeFechar` do Esc (`Introducao.tsx:76`) parasse de funcionar.
- `BemVindo.test.tsx:358-369` prova o lado contrário: na primeira vez, o Esc no passo 2 deixa a tela em `/aluno/bem-vindo`, sem POST.
- O caso antigo, em que o Esc vinha depois do "Fechar", saiu.

Rodei os 5 arquivos de unidade e componente (`introducao/`, `Linha.test.tsx`, `Eu.test.tsx`, `Inicio.test.tsx`): 98 testes, todos verdes.

**Cenários exigidos:**
- Os da 1ª rodada continuam valendo.
- Os do código novo desta rodada:
  - a faixa "Role para ler mais": aparece quando há mais abaixo, some no fim da região e volta quando a pessoa sobe;
  - o título "Rever a introdução" inteiro a 360 px;
  - a frase do sinal de atenção no grupo "Quem vê";
  - as frases com "A escola guarda" no lugar de "Guardamos";
  - a lista de falas copiada no e2e igual à dos passos.

**Cobertos:**
- **Faixa de rolagem:** `BemVindo.test.tsx:203` testa quatro posições (início, 300, 800 e de volta a 100). Cada um dos três blocos de mutação (`useState(false)`, `definirHaMais(true)`, `!haMais`) quebra uma asserção diferente desse caso.
- **`tituloEmDuasLinhas`:**
  - `Linha.test.tsx:136` confere a prop na `Linha`.
  - `Eu.test.tsx:118` confere a linha de Eu e checa que "Privacidade" segue com `truncate`.
  - No e2e (`aluno-introducao.spec.ts`), o caso "cabe inteira a 360 px" mede o `scrollWidth` e o `scrollHeight` contra o tamanho visível. Ele reprovaria com o `truncate`.
  - Há um bloco de mutação para a `Linha` e outro para `Eu.tsx`.
- **Frase do sinal de atenção:** `textos-da-introducao.test.ts:56` usa uma regex ancorada nas duas pontas, com bloco de mutação que tira a frase do grupo. O teste da página procura em `FRASES_DO_AVISO`, que sai de `GRUPOS_DO_AVISO`, e por isso a mutação chega ao que o aluno lê. O caso da tela que mostra cada frase uma vez também passa a cobrir a frase nova.
- **"A escola guarda":** as três regex agora são ancoradas, e há bloco de mutação que volta "Guardamos" na frase das tarefas.
- **Cópia das falas no e2e:** `textos-da-introducao.test.ts:120` lê `e2e/__fixtures__/casca.ts` e compara a lista com `PASSOS_DO_ALUNO`. Se o arquivo mudar de formato e a regex não achar a lista, o caso reprova com mensagem própria.
- **Blocos renomeados:** os blocos de "Fechar no passo" e "com a data nula, o" batem com os novos títulos do `it.each`.
- Não há `.skip`, teste comentado, chamada a provedor de IA nem mock que esconda a regra.

**Recomendações da 1ª rodada:** as seis foram aplicadas.
- O contador do e2e de fechar a aba é ligado antes do primeiro "Continuar".
- "Fechar" é clicado em cada passo, com `it.each` de 1 a 4.
- O caso do e2e do passo 4 agora se chama "pular".
- O comentário do e2e do duplo clique cita o caso do componente.
- `Inicio.test.tsx` virou `it.each`.
- A frase "vão a um programa de IA" ficou para o `privacy-guardian`, que a confirmou como certa na 1ª rodada.

Bloqueantes: nenhum.

Recomendações:
1. `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`: a tabela de testes está atrás do código.
   - **Linha 50:** ainda diz "o que guardamos" e, em "quem vê", não lista a frase do sinal de atenção.
   - **Linha 58:** atribui "todo passo fecha" ao e2e, mas isso agora está no componente; o e2e só fecha no passo 1.
   - **Faltam linhas** para a faixa "Role para ler mais", para o título a 360 px e para a conferência da cópia das falas. As três têm teste; o que falta é a linha na tabela.
2. `apps/web/src/areas/aluno/introducao/BemVindo.tsx:201`: a faixa começa ligada sem medir a região.
   - Se o aviso couber inteiro, a região não rola, o `onScroll` não dispara, e a faixa fica para sempre dizendo "Role para ler mais" sobre a última linha. Isso pode acontecer numa tela alta, porque o `max-h` é `28dvh`.
   - Correção sugerida: medir ao montar e ao redimensionar. Teste sugerido: `scrollHeight` igual a `clientHeight` sem evento de rolagem não mostra a faixa.
3. O Esc no passo 4, revendo, não tem caso próprio. Só importa se o passo 4 deixar um dia de usar o mesmo `podeFechar`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/BemVindo.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/BemVindo.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/ui/Linha.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/ui/Linha.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Eu.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/paginas/Inicio.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/Introducao.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-introducao.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-25 17:11:52 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

VEREDITO: APROVADO

Escopo: respeitado. A mudança na `Linha`, um componente compartilhado, entrou porque o item 1 da ordem pediu, e está registrada em `docs/interface.md`.

Aderência à Tech Spec: ok. As três divergências novas estão na tabela da tarefa e na `techspec.md` §7b. A spec não tem `cenarios.md`, e nenhuma delas contradiz o RF14. A frase a mais sobre o sinal de atenção só soma ao que o RF14 já exige.
- **Frase do aviso de atenção:** segue a saída (a) do item 3, que a ordem já previa. Conferi no código e ela é verdadeira: o servidor manda o `atencao_humana` ao professor com `aluno: { id, nome }` (`apps/api/src/tutor/supervisao.service.ts:14-15`).
- **"A escola guarda":** é o item 5 da ordem.
- **`tituloEmDuasLinhas` e a faixa "Role para ler mais":** são os itens 1 e 4 da ordem, registrados na §7b e em `docs/interface.md`.

Portão local: carimbo válido para typecheck, lint, segredo, dependências, unidade e alvo.

Bloqueantes: nenhum.

O item 6 da ordem não foi aplicado, e isso está certo. A ordem condicionava a frase a "se for verdade no produto", e não é verdade hoje:
- `tutor.controller.ts` diz que "não existe rota que entregue a conversa ou a memória de um aluno a outra pessoa".
- `SupervisaoDoTutorService` também diz que o professor "não lê a conversa".

Escrever "pode abrir a conversa" seria dizer ao aluno algo falso. O motivo ficou na `techspec.md` §7b, em `docs/aia/tutor.md` (pendência 12) e no comentário de `FRASE_DO_AVISO_DE_ATENCAO`.

Conferi também o que esta rodada corrigiu:
- **Esc revendo:** agora está provado. O caso começa em `/aluno/bem-vindo`, nos passos 1 a 3, e um caso da primeira vez mostra que ali o Esc não sai.
- **Ligar o contador antes do primeiro "Continuar":** feito no e2e de fechar a aba.
- **"Fechar" em cada passo:** clicado em cada um com `it.each`.
- **Duplo clique:** o e2e agora tem um comentário que aponta para o teste de componente.
- **Cópia das falas no e2e:** um teste de unidade compara a lista com os passos.
- **`TODO.md:57`:** atualizado.
- **Comentário repetido em `Inicio.tsx`:** removido.
- **`Inicio.test.tsx`:** passou para `it.each`.

As fotos batem com o código:
- **Título "Rever a introdução":** inteiro, em duas linhas, a 360 px (`aluno--aluno-eu--celular.png`).
- **Faixa "Role para ler mais":** aparece no pé do aviso no computador e no celular (`aluno--aluno-bem-vindo--Continuar-Continuar--*.png`).
- **"A escola guarda":** é o texto dos títulos e das frases.

Recomendações:
1. `apps/web/src/areas/aluno/introducao/BemVindo.tsx:201`: `haMais` começa `true` e só muda no `onScroll`. Se o aviso couber inteiro, a faixa fica para sempre, porque não há rolagem que a tire. Isso acontece num monitor alto, em retrato, onde 28dvh já é grande. Medir ao montar e no redimensionamento (`useLayoutEffect` ou `ResizeObserver`) evita isso.
2. "Recomendações sem aplicar" (`9_task.md:345`) está vazia. Pela skill `executar-task`, a tabela da Mesa é copiada na aprovação final. Ao copiar, vale incluir uma linha para o item 6 da ordem, com o motivo "nada na tela abre a conversa", para que a validação e a retrospectiva não precisem caçar o motivo na techspec.
3. `textos-da-introducao.test.ts:331-339`: a comparação lê `e2e/__fixtures__/casca.ts` com uma expressão regular que só aceita fala entre aspas simples e sem apóstrofo. Uma fala com apóstrofo, ou escrita em template string, quebra o teste com uma mensagem confusa. A sugestão do revisor-geral, de o `e2e/` importar o `.ts` puro, resolveria isso na origem.
4. A pendência de decisão sobre a mensagem fixa de `turno-do-tutor.ts` (se ela deve avisar que o professor fica sabendo) está no `TODO.md` e em `docs/aia/tutor.md`. Falta em `docs/lgpd.md:369` e em `docs/conformidade-mec.md`, item 3, que só listam a revisão do texto como pendente.
5. O dia em que existir uma tela que abre a conversa (regra 50, item 10), `FRASE_DO_AVISO_DE_ATENCAO` e o aviso precisam mudar junto com ela. Vale anotar isso no comentário ou na pendência 12 da AIA, como gatilho.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/BemVindo.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/docs/lgpd.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/docs/conformidade-mec.md

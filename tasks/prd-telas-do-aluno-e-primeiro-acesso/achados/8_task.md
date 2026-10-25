# Achados das revisões — `tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-25 15:24:05 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. A tarefa não cria nem altera migration ou schema. O `git diff --stat` e os arquivos novos mexem só em `apps/web`, `e2e` e `docs`. A preferência mora em `localStorage['educa.letra']`, no navegador, e aceita só `grande` ou `maior`. Ela não leva identificador de pessoa, de escola nem de papel, e não vai ao servidor (o registro está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/docs/lgpd.md`, linha 106).

Queries verificadas: nenhuma. A tarefa não tem repository, endpoint nem consulta nova. As duas chamadas que `Eu.tsx` já fazia (`GET /v1/minha-turma` e `GET /v1/tutor/memoria`) seguem sem mudança e não recebem `escolaId` do cliente. Também não há `@SemEscopo()`, id novo nem consulta da camada de rede.

Teste de isolamento: não se aplica. A tarefa não tem dado de escola, então não há escopo cuja ausência um teste pudesse mostrar. O que se aproxima disso já está previsto no e2e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/tamanho-da-letra.spec.ts`: o valor da chave não aparece em nenhuma requisição à API, e o aluno seguinte no mesmo computador herda só a letra, sem dado do anterior.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md`: o texto ainda manda montar `useTamanhoDaLetra()` em `areas/aluno/rotas.tsx` e pôr `TamanhoDaLetra.tsx` direto em `componentes/`. A implementação monta o hook em `main.tsx` e põe a peça em `componentes/ajustes/`. A divergência precisa entrar na seção "Divergências resolvidas nesta tarefa", hoje sem linha, com a coluna "Onde está na spec" preenchida. É questão de processo, não de isolamento.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 15:24:14 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum no servidor. A tarefa só cria a chave `educa.letra` no `localStorage`, com o valor `grande` ou `maior`. Ela não leva pessoa, escola nem papel. Escolher Padrão apaga a chave, e só a escolha do aluno grava.

Fora da tabela de dados do docs/lgpd.md: nada. A chave entrou na tabela com finalidade, base e retenção em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/docs/lgpd.md:106`. Também entrou na lista fechada de chaves do navegador, em `docs/interface.md` seção 6.

Autorização por objeto: ok. Não há rota, endpoint nem query nova. O diálogo de Ajustes não pede nada à API.

Logs: limpos. `letra.ts`, `TamanhoDaLetra.tsx` e `DialogoDeAjustes.tsx` não têm `console` nem logger.

Auditoria: nenhuma ação desta tarefa exige auditoria. É uma preferência local, sem leitura de dado de aluno, sem exportação, sem nota e sem permissão.

Envio externo: nenhum. O e2e `tamanho-da-letra.spec.ts:108-136` confere todos os pedidos a `/v1/`, antes e depois da escolha. Nem a chave nem o valor aparecem no endereço, nos cabeçalhos ou no corpo. O teste também exige que haja pelo menos um pedido depois da escolha, para não passar sem ter olhado nada. Nada vai para provedor de IA.

Seed/fixture: sintético. A foto `aluno--aluno-eu--Ajustes--computador.png` mostra "Aluno Sintético Caio df86225e", "Colégio sintético da vitrine cheia 85be806b" e "2ºB df86225e", todos com sufixo sintético. O diálogo em si não mostra dado de pessoa: só Aparência, as três opções de letra e o texto de prévia. A identificação do próprio aluno na lateral e no cartão da turma já existia antes desta tarefa e aparece só para ele.

Pontos que conferi e estão certos:
- **A letra não passa para o professor.** O script em linha só escreve `data-letra` quando o caminho é exatamente `/aluno` ou começa por `/aluno/` (`apps/web/index.html:31-32`). O `useTamanhoDaLetra` fica na raiz (`apps/web/src/main.tsx:43-52`) e tira o atributo assim que o caminho deixa de ser do aluno. Os testes `aparencia.spec.ts` (RF24), `tamanho-da-letra.spec.ts:67` e `:175-189` provam isso.
- **O valor lido do navegador nunca é confiado.** Só `grande` e `maior` valem, em `resolverLetra` e no script em linha. O que vai ao `<html>` é sempre um desses dois valores fixos.
- **Abrir a tela não grava nada.** Montar, abrir o diálogo, entrar na área e fazer login não escrevem no armazenamento. O e2e confere que o `localStorage` fica `'[]'`. Isso atende a regra 50, item 7.
- **O aluno seguinte não vê nada do anterior** (`tamanho-da-letra.spec.ts:139-149`). Ele herda a letra, mas o navegador guarda só essa chave e o `sessionStorage` fica vazio.

Pergunta de fechamento: a tarefa não grava nada do aluno no servidor e não envia nada para fora. O que o sistema já respondia sobre um aluno específico continua igual.

Bloqueantes: nenhum.

Recomendações:
1. A linha da tabela em `docs/lgpd.md:106` diz que a preferência "não é dado pessoal por si". Vale acrescentar que "Grande" ou "Maior" pode sugerir uma necessidade visual. Como o valor fica no computador sem identificador e passa para o próximo aluno, não há como ligá-lo a alguém. Escrever isso deixa explícito por que a chave nunca pode ganhar identificador nem ir ao servidor: lá ela viraria um indício de necessidade específica, que é dado sensível (regra 20, item 3).
2. Na foto, o fundo escuro do diálogo não cobre a parte de cima da página, onde estão o cartão da turma e o nome da escola. Parece efeito da captura de página inteira. Não é ponto de privacidade, mas fica para o `frontend-reviewer` conferir.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 15:24:14 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A tarefa só mexe em front-end: a preferência fica no navegador, em `localStorage['educa.letra']`, e o `index.html` a lê num script em linha. Todos com autor humano? Não se aplica, porque nada escreve em `Nota`.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. Esta tarefa não tem saída de IA. O diálogo "Ajustes" tem a aparência e o tamanho da letra, e nada passa por agente.

Supervisão do tutor: ok. A tarefa não toca no tutor.

Autonomia declarada e visível: sim. Nenhum agente foi alterado, então nada muda na governança.

Bloqueantes: nenhum.

O que conferi contra a regra 70:
- **Itens 7 e 9, supervisão sem vigilância e sem métrica sobre a pessoa.** A escolha da letra nunca vai à API, a log, a cookie ou a URL. `letra.ts` não faz `fetch` nem mutação, e o `docs/lgpd.md` registra isso (linha nova, na tabela de dados). Por isso ela não pode virar sinal ao professor ou à coordenação, como "aluno com dificuldade de leitura", nem inferência sobre o aluno. Montar a tela, abrir o diálogo ou entrar na área não grava nada. Só a escolha grava, e Padrão apaga a chave.
- **Item 4b e D59, sair fácil e nada que induza uso.** O diálogo fecha por "Fechar" ou por Esc (`apps/web/src/areas/aluno/DialogoDeAjustes.tsx`). Não tem recompensa, sequência de dias nem conteúdo que começa sozinho. Voltar a Padrão custa um clique, o mesmo que escolher Grande ou Maior.
- **Foto `aluno--aluno-eu--Ajustes--computador.png`.** Mostra só a aparência (Sistema, Claro, Escuro), as três opções de letra, a prévia "Assim fica a minha letra." e o botão "Fechar". Não aparece saída de IA, nota, conceito nem sugestão de nota no diálogo. O "1 de 4 certas" e o "3 de 4 certas" atrás do diálogo vêm do "Como estou indo" da tarefa 7.0, que esta tarefa não alterou, e são resultado de objetiva. Não aparecem em discursiva nem em redação, então não esbarram na D55.

Recomendações:
- Quando a tarefa da senha do aluno entrar em Ajustes (o mockup 2.5 a deixa de fora), vale manter o padrão desta: nada que o aluno escolhe em Ajustes vira dado visível ao professor ou à coordenação.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/letra.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/DialogoDeAjustes.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/ajustes/TamanhoDaLetra.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Eu.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/index.html`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/main.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/docs/lgpd.md`

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 15:24:14 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A mudança é só de frontend: preferência no `localStorage` e um atributo no `<html>`. Não há requisição nova, endpoint nem job.
Rate limit: ok. Não se aplica, porque não há rota nova.
Fila e prioridade: ok. Não se aplica.
Concorrência: protegida. Com duas abas, a última vence pelo evento `storage` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/letra.ts`, `aoMudarOArmazenamento`). Nada vai para o servidor.
Índice e paginação: ok. Não há query.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. Não há código novo no servidor nem no caminho quente.
Bloqueantes: nenhum.
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/main.tsx`: o comentário cita `LetraDoAluno` "mais abaixo", mas a tarefa (8.1) previa montar `useTamanhoDaLetra()` em `areas/aluno/rotas.tsx`. A mudança para a raiz tem motivo: sem isso, o atributo ficaria para quem fosse levado à entrada sem sessão. Mesmo assim, ela precisa estar registrada em "Divergências resolvidas" da `8_task.md`, com a coluna "Onde está na spec" preenchida.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/estilos.css`: as classes `t-*` passaram de px para rem, o que vale para todas as áreas. No Padrão, 1rem = 16px e nada muda. Mas se uma escola configurar o tamanho de fonte do navegador no Chromebook gerenciado, professor e coordenação também passam a acompanhar essa configuração. Esse efeito precisa estar registrado no `docs/interface.md`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 15:24:46 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido

Bloqueantes: nenhum

Conferi o que mais podia dar problema:

- **Escopo.** O diálogo "Ajustes" não tem "Senha", que a tarefa deixa de fora. "Rever a introdução" fica para a 9.0, item 9.3. Eu tem três linhas agora; a Tech Spec §9 fala em quatro, e a quarta é da 9.0.
- **Divergências.** As quatro da tabela da tarefa também estão nos documentos da spec, não só na tarefa:
  - a pasta `componentes/ajustes/` está na `techspec.md` §2;
  - o hook montado em `main.tsx` está na `techspec.md` §5 e §2;
  - as classes `t-*` em `rem` estão na `techspec.md` §5 e no `docs/interface.md` 6;
  - o rótulo "Conta" vem do `mockup.md` 2.5, item 3.
  - Este diretório não tem `cenarios.md` (`ls tasks/prd-telas-do-aluno-e-primeiro-acesso/`).
- **Foto.** A tela mostra "Ajustes" com Aparência, "Tamanho da letra" (Padrão, Grande, Maior) e a prévia "Assim fica a minha letra.", com os nomes da tarefa e do RF11. Não aparece nada fora do pedido.
- **Testes.** Os testes novos e alterados não têm `.skip`, `.only`, `any` nem `TODO`.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/ajustes/TamanhoDaLetra.tsx`: no comentário da peça, a linha "a estar marcada avisa (`Opcao`)…" está sem o ` * ` no início. Também vale trocar o apelido do import, `type TamanhoDaLetra as TipoDaLetra`, por um nome que não precise de alias. Hoje o tipo e o componente têm o mesmo nome e o alias só existe para desviar disso.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/estilos.css`: a mudança das `t-*` para `rem` vale para todas as áreas, não só a do aluno. Quem configurou o navegador acima de 16 px passa a ver o texto de professor e coordenação maior. Isso é bom para acessibilidade, mas vale uma linha no `docs/interface.md` 6 dizendo que é intencional, para não voltar como bug.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/letra.ts`: em `useTamanhoDaLetra`, a limpeza do efeito tira o atributo a cada troca de letra, e o efeito seguinte o põe de volta. O resultado está certo, mas tirar o atributo só ao desmontar deixa a intenção mais clara.
4. A Aparência aparece duas vezes na área do aluno: no pé da lateral e no diálogo "Ajustes" (foto `aluno--aluno-eu--Ajustes--computador.png`). Foi a tarefa que pediu as duas. Fica registrado para a validação de produto.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 15:24:52 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md`

VEREDITO: APROVADO
Tela vista: sim (8 fotos lidas: `/aluno/eu` e `/aluno/eu` com Ajustes aberto, em 1366 e 360 px, na escola cheia e na vazia)
Estados: ok. O Eu cheio tem o cartão e o "Como estou indo" (7.0). O vazio mostra "Nada corrigido ainda", que convida em vez de se desculpar. A preferência de letra é local e não tem carregando nem erro, como a tarefa já diz. O código mantém o erro com "Tentar de novo" em `Eu.tsx`.
Acessibilidade: ok.
- As três `Opcao` são um grupo de rádio dentro de `fieldset` e `legend` "Tamanho da letra". O anel de foco fica no rótulo, por `focus-within`.
- O `Dialogo` nativo prende o foco, fecha com Esc e devolve o foco à linha "Ajustes". O e2e cobre isso.
- A marcada leva o visto e a borda, então a cor não é a única pista. Nada depende de hover. Há botão "Fechar" visível.
- A `Segmentado` de aparência e a de letra aparecem com rótulo.
Chromebook fraco: ok. A mudança é só CSS e uma chave de `localStorage`. O script em linha é curto, está em `try/catch` e não tem custo de rede. A peça fica fora do pacote de entrada (`PECAS_FORA_DA_ENTRADA`). Não há lista longa nem imagem nesta tarefa.
Celular: ok.
- Nenhuma das quatro fotos a 360 px tem rolagem lateral, nem a cheia com Maior ativo e o diálogo aberto.
- As opções têm cerca de 62 px de altura (`min-h-16`), o "Fechar" tem 44 px, a linha "Ajustes" e a `Segmentado` também.
- O diálogo tem `max-h-[calc(100svh-2rem)]` e `overflow-y-auto`, então não estoura em tela baixa.
- O e2e `tamanho-da-letra.spec.ts` mede `larguraExcedente` a 360 px com Maior em Início, Tarefas, Eu, no diálogo e na tarefa aberta. Nada exige o celular.
- Na foto, a barra de baixo aparece no meio da página nas fotos de página inteira. É efeito da captura de elemento `fixed` e não defeito. O código manda onde ela fica.
Ação oficial protegida: não se aplica. A tarefa não tem nota, aprovação nem exportação, e nada é enviado ao servidor (o e2e prova que nenhuma requisição à API leva a chave ou o valor).

Bloqueantes: nenhum.

Verificações de código que sustentam o veredito:
- **Sem gravação sem escolha.** Só `escolherLetra` escreve em `localStorage` (`letra.ts`), e Padrão apaga a chave. O componente e o e2e provam que montar, abrir o diálogo e entrar na área deixam `'[]'`.
- **Sem texto técnico, chave de tradução ou inglês** nas fotos. O português está correto.
- **Contra `docs/interface.md`:** o `Dialogo` (canto, borda de 2 px, degrau), o `Botao` secundário, a `Opcao` e os tokens existentes foram reaproveitados, sem componente refeito. A foto confere com a pele da D80.
- **Divergência da `Divergências` justificada.** O `data-letra` é aplicado na raiz e preso ao endereço, para não vazar a letra do aluno a um professor que entre depois no mesmo computador. O e2e prova isso.

Recomendações (não bloqueiam):
1. `apps/web/src/componentes/BarraDeBaixo.tsx:79,88` e `apps/web/src/estilos.css:324`. A barra de baixo tem altura fixa de 68 px (`--barra-baixo`), mas a pílula (`h-9`), o `gap-1` e o rótulo (`text-xs leading-4`) são em `rem`. Com Maior (20 px) o conteúdo passa a medir cerca de 70 px, contra 66 px úteis. Na foto `aluno--aluno-eu--celular.png`, em torno de y=733 a 800, a pílula "EU" encosta na linha de cima da barra e o rótulo "INÍCIO" fica rente à borda de baixo da janela. Nada é cortado, mas fica apertado e pior em aparelho com área segura. Sugestão: `min-h` em `rem` mais a área segura, ou reduzir a pílula, e depois acrescentar o caso a `tamanho-da-letra.spec.ts`.
2. `apps/web/src/componentes/ajustes/TamanhoDaLetra.tsx:28` e `Aparencia`. No diálogo, "Aparência" aparece pequeno (rótulo do `Segmentado`) e "Tamanho da letra" maior (`t-cartao`), de pesos diferentes para o mesmo nível. Alinhar os dois títulos de seção do diálogo.
3. `docs/interface.md`, linha `TamanhoDaLetra` da seção 10.2. A divergência na tarefa diz que a linha cita o caminho `ajustes/TamanhoDaLetra` e o motivo, mas a linha lida só descreve a peça. Só a Tech Spec (`techspec.md:25`) tem o caminho. Acrescentar o caminho e o motivo à linha, ou corrigir a coluna "Onde está na spec" da tarefa.
4. As fotos usam ids sintéticos visíveis ("2ºB df86225e", "Colégio ... 85be806b"). Isso vem do seed da vitrine, não do código, e não afeta usuário real.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-25 15:26:04 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md`

**VEREDITO: REPROVADO**

**Cenários exigidos:**
- antes do primeiro quadro
- só grava ao escolher (componente e e2e)
- a escolha não sai do navegador
- armazenamento recusando
- valor inválido
- só no aluno, e o atributo some ao sair do `/aluno`
- mesmo computador
- teclado
- 360 px com Maior
- concorrência entre duas abas (a última vence)
- as mutações declaradas contra o `git diff`

**Cobertos:**
- **Antes do primeiro quadro:** `e2e/tamanho-da-letra.spec.ts › antes do primeiro quadro`. O script em linha também é rodado contra `resolverLetra` e `noCaminhoDoAluno`, numa matriz de valor por caminho (`letra.test.ts › o <script> do index.html`).
- **Só grava ao escolher:**
  - `TamanhoDaLetra.test.tsx › ... não escreve nada ao montar` e `› escolher Grande e Maior ...`
  - `Eu.test.tsx › a linha "Ajustes" abre o diálogo ... sem gravar nada`
  - `letra.test.ts › montar e navegar não escrevem nada`
  - o e2e `só grava ao escolher`, que confere `'[]'` depois do login, de Eu e do diálogo, e que Padrão apaga a chave
- **A escolha não sai do navegador:** e2e `a escolha não sai do navegador`. Cobre só em parte, ver o bloqueante 1.
- **Armazenamento recusando:** `letra.test.ts › armazenamento que recusa leitura e gravação` e `› a gravação que volta a funcionar`. O "nenhum erro na tela" está em `TamanhoDaLetra.test.tsx › armazenamento que recusa a gravação`.
- **Valor inválido:** `resolverLetra` com `xyz`, vazio, `MAIOR` e espaço, e `› valor inválido na chave vale Padrão`.
- **Só no aluno:** e2e da professora e da coordenação, o trecho de saída do e2e `a escolha não sai do navegador`, e `useTamanhoDaLetra › ... ao sair do /aluno ele some`. O `aparencia.spec.ts` (RF24) conhece a terceira chave e confere que a professora não aplica a letra.
- **Mesmo computador:** e2e `o aluno seguinte ...`, junto com a parte de saída do e2e `a escolha não sai do navegador`.
- **Teclado:** `TamanhoDaLetra.test.tsx › uma parada só no Tab ...` cobre as setas e a parada única. O foco volta à linha "Ajustes" pelo "Fechar" (`Eu.test.tsx`) e pelo Esc (e2e).
- **360 px com Maior:** e2e `a 360 px com Maior`, com `larguraExcedente` e `larguraExcedenteDoDialogo`, passando por Início, Tarefas, Eu, o diálogo e a tarefa aberta.
- **Duas abas:** e2e `duas abas do mesmo navegador`. É uma preferência local e síncrona, sem banco nem fila, então não cabe teste de corrida em paralelo.
- **Proibições:** nenhum `.skip`, nenhum teste comentado, nenhum mock que esconda a regra e nenhuma chamada de IA.
- **Unidade e componente:** rodei `letra.test.ts`, `TamanhoDaLetra.test.tsx`, `Eu.test.tsx`, `estilos.test.ts`, `tema.test.ts` e `nome-dos-chunks.test.ts`: 210 testes, todos verdes. Não rodei os e2e.

**Bloqueantes:**

1. **O cookie nunca é conferido.** Em `e2e/tamanho-da-letra.spec.ts:131-133`, a linha da tabela promete "em endereço, cabeçalho ou corpo", mas o teste não olha o cookie.
   - `pedido.headers()` do Playwright já não devolve os cabeçalhos de cookie (isso exige `allHeaders()`), e o filtro ainda tira `cookie` e `authorization`.
   - Um `document.cookie = 'educa.letra=maior'`, o caminho mais provável de uma preferência local chegar ao servidor, passaria sem falhar.
   - **Correção exigida:** usar `await pedido.allHeaders()`. Para `cookie` e `authorization`, conferir ao menos que não contêm `CHAVE` nem um par `letra=`/`=maior`. Os demais cabeçalhos continuam com a checagem de hoje.

2. **Falta o bloco de mutação de uma cláusula nova.** Em `apps/web/src/letra.ts:49`, `return escolhaQueOArmazenamentoRecusou ?? escolhaGuardada()` decide entre a memória e o armazenamento.
   - Os blocos da seção mutam quem escreve a memória (linhas 66 e 68), mas nenhum muta quem a lê.
   - **Correção exigida:** declarar o bloco abaixo. Ele deve ficar vermelho, porque com o `getItem` lançando a leitura volta a Padrão.
     ```
     arquivo: apps/web/src/letra.ts
     teste: apps/web/src/letra.test.ts › armazenamento que recusa leitura e gravação
     -   return escolhaQueOArmazenamentoRecusou ?? escolhaGuardada()
     +   return escolhaGuardada()
     ```

**Recomendações:**
- **O e2e do primeiro quadro não separa o script em linha do hook.** O `DOMContentLoaded` só dispara depois que os scripts de módulo rodam, então o comentário "antes de qualquer linha do React" (linha 69) está errado, e em `/aluno/inicio` o `LetraDoAluno` escreveria o mesmo `maior`. Bloquear o pacote da entrada com `page.route` provaria que só o script em linha escreve o atributo. Hoje essa prova está só na unidade.
- **O "mesmo computador" usa `addInitScript`, sem um primeiro aluno de verdade.** Uma única sequência na mesma página (o aluno 1 escolhe Maior e sai, o aluno 2 entra e herda) provaria a linha da tabela sozinha, sem depender da soma de dois casos.
- **A atualização vinda de outra aba só tem prova no e2e.** Em `letra.test.ts › as outras abas`, a asserção é sobre `lerLetra()`, que relê o armazenamento sozinho. O `avisarOsOuvintes()` do evento `storage` (`letra.ts:77`) fica provado apenas pelo e2e `duas abas`. Um caso com `useLetra` renderizado provaria isso na unidade.
- **O espião do `Eu.test.tsx` vaza para os casos seguintes.** Em `apps/web/src/areas/aluno/Eu.test.tsx:~354`, o espião de `setItem` não é restaurado: o `afterEach` não chama `vi.restoreAllMocks()` e a configuração do vitest não tem `restoreMocks`. Vale também espiar `removeItem`, como fazem os outros dois arquivos.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/tamanho-da-letra.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/letra.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/letra.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/ajustes/TamanhoDaLetra.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Eu.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-25 15:39:39 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

Desde a minha rodada aprovada, só mudaram testes, documentos e um comentário. Nenhum arquivo de produção mudou de comportamento.

- **Mutações novas em `8_task.md`**: as duas batem com o código. A primeira troca o `escolhaQueOArmazenamentoRecusou ?? escolhaGuardada()` da linha 49 de `apps/web/src/letra.ts`. A segunda tira o `avisarOsOuvintes()` da linha 77, no `aoMudarOArmazenamento`. O caso novo de `letra.test.ts` (o evento `storage` vindo de outra aba, linhas 280–300) é o que mata essa segunda mutação.
- **`e2e/tamanho-da-letra.spec.ts`**: agora usa `allHeaders()`, que também traz `cookie` e `authorization`. A prova de que a escolha não sai do navegador ficou mais forte. O comentário do primeiro quadro foi corrigido e aponta para o teste em `letra.test.ts` que prova o script em linha.
- **`Eu.test.tsx`**: o `vi.restoreAllMocks()` no `afterEach` impede que o espião de um caso vaze para o seguinte. A conferência nova (`removeItem` não chamado) fecha a promessa de que abrir o diálogo não grava nada.
- **`docs/interface.md` e `docs/lgpd.md`**: as notas novas são coerentes com a Tech Spec e com a regra 20, item 3. Nenhuma divergência nova aparece só no `N_task.md`.
- **Foto** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/vitrine/aluno--aluno-eu--Ajustes--computador.png`): igual à rodada anterior. Mostra Aparência e "Tamanho da letra" com Padrão, Grande e Maior, a prévia e o Fechar, sem nada além do que a tarefa pede.

Recomendações:
- `tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md`: as mutações citam como teste `letra.test.ts › useTamanhoDaLetra`, mas o `describe` se chama `useTamanhoDaLetra: o data-letra segue o endereço`. Isso só funciona se o casamento for por prefixo. Citar o nome inteiro evita ambiguidade se outro `describe` começar igual.
- Os itens da tabela "Recomendações sem aplicar" que vão para o `TODO.md` (barra de baixo com Maior, alinhamento dos títulos do diálogo) precisam estar mesmo no `TODO.md` antes do pouso. O Validador confere.

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 15:40:00 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada (caminho feliz das três escolhas; Padrão apaga a chave; valor inválido vale Padrão; armazenamento que recusa leitura e gravação; o que outra aba grava vale mais; o primeiro quadro na área do aluno, sem passar para a entrada nem para o professor; a escolha não sai do navegador, nem por endereço, cabeçalho, cookie ou corpo; abrir o diálogo não grava nada; o aluno seguinte no mesmo computador herda a escolha, sem identificador). Nesta rodada conferi só as duas correções exigidas e o que o diff r1→r2 mexe.

Cobertos:
- **Correção 1, o cookie, feita.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/tamanho-da-letra.spec.ts:137-142`, o teste agora usa `await pedido.allHeaders()`. Nos cabeçalhos `cookie` e `authorization` ele confere que não aparece `educa.letra` e que o texto não bate com `/letra=|=maior|=grande/i`. Os outros cabeçalhos, o endereço e o corpo seguem com a checagem de antes. Um `document.cookie = 'educa.letra=maior'` iria no `cookie` dos pedidos `/v1/` e deixaria o teste vermelho. A guarda da linha 131, que exige ao menos um pedido à API depois da escolha, continua lá: o laço não passa vazio.
- **Correção 2, o bloco que muta a leitura, declarado.** Está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md:196-201`, sobre `apps/web/src/letra.ts:49`. Ele fica vermelho pelo motivo certo. Em `letra.test.ts:175`, com `getItem` e `setItem` lançando, `escolherLetra('maior')` guarda Maior na memória. Com o código mutado, `lerLetra()` passa direto ao armazenamento, que lança, e cai em `'padrao'`. Aí `toBe('maior')` falha numa asserção, e não por erro de carga.
- **Bloco novo que a Mesa sugeriu**, `8_task.md:203-210`, que tira o `avisarOsOuvintes()` de `aoMudarOArmazenamento`. O teste novo `letra.test.ts:280` monta a tela, faz outra aba gravar e só dispara o evento `storage`. Sem o aviso, o `useSyncExternalStore` não desenha de novo e o `data-letra` não aparece. Os testes de "as outras abas" leem `lerLetra()` direto e não pegariam essa mutação; este pega.
- **`Eu.test.tsx`.** O `vi.restoreAllMocks()` no `afterEach` vem antes do `escolherLetra('padrao')`, e o espião de `removeItem` agora prova que abrir o diálogo também não apaga nada. Os dois arquivos passaram: `npx vitest run apps/web/src/letra.test.ts apps/web/src/areas/aluno/Eu.test.tsx` deu 105 de 105.
- O resto do diff são um comentário no e2e e notas em `docs/lgpd.md`, `docs/interface.md` e `TamanhoDaLetra.tsx`. Nada disso muda comportamento nem precisa de bloco novo.

Bloqueantes: nenhum.

Recomendações:
- `e2e/tamanho-da-letra.spec.ts:141`: o padrão `/letra=|=maior|=grande/i` só pega a forma `chave=valor`. Um cookie com o valor sozinho (`pref=maior`) é pego. Já um formato JSON ou com outro separador escaparia (o caso do JSON sem `educa.letra` dentro). Para fechar isso, pode-se conferir também que o `cookie` não contém `maior` nem `grande` em nenhuma posição, como já se faz com os outros cabeçalhos. Isso só valeria se o cookie da sessão não puder conter essas palavras por acaso.
- `8_task.md:205`: o filtro `useTamanhoDaLetra` roda o `describe` inteiro. Citar o caso pelo nome (`› o que outra aba grava chega à tela montada`) deixa claro qual teste prova a cláusula.

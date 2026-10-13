# Achados das revisões — `tasks/prd-pele-e-casca/2_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-13 09:34:05 · `tasks/prd-pele-e-casca/2_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum. A tarefa só mexe no frontend e não altera API, migration, `packages/shared` nem DTO. O único dado novo é `localStorage['educa.aparencia']`, que guarda só `claro` ou `escuro`, e Sistema apaga a chave (`apps/web/src/tema.ts`, `escolherAparencia`). Esse valor é do aparelho e não diz quem é a pessoa, de que escola ela é nem que papel tem.

**Fora da tabela de dados do docs/lgpd.md:** nada. A preferência não é dado pessoal. A lista fechada do que o navegador guarda ficou em `docs/interface.md` seção 6, com `educa.aparencia` e `educa.lateral-recolhida`, e o `sessionStorage` vazio.

**Autorização por objeto:** não se aplica, porque a tarefa não cria nem altera rota.

**Logs:** limpos. A tarefa não escreve log, e o código novo não usa `console` nem chama a rede (`tema.ts`, `Aparencia.tsx`, `Segmentado.tsx`).

**Auditoria:** a regra não a exige aqui. Escolher a aparência não é leitura de dado de aluno, nem exportação, nem nota, nem permissão, nem aprovação de saída de IA.

**Envio externo:** nenhum.

**Seed/fixture:** sintético.
- A galeria foi dividida em `apps/web/src/galeria/secoes/*.tsx` sem nome novo. Comparei os nomes próprios antes e depois, e o único acréscimo é "São Paulo", que está num comentário de `dados.ts`. "Camila Souza", "Coordenadora sintética e4808211" e "Colégio sintético da vitrine" já existiam antes ou vêm da vitrine.
- Os testes de componente usam "Professora Exemplo" e "Operador Exemplo".
- O e2e cria as pessoas pelas fixtures de sessão.

**Fotos da tela:** olhei `coordenacao--coordenacao-governanca--computador.png`, `...--celular-2.png` e `coordenacao--galeria--computador-1.png` a `-3.png`.
- A Aparência aparece entre o papel e o "Sair" e não mostra nada além das três opções.
- A governança continua agregada: "Aprovado por um professor", sem nome. O nome que aparece na lateral é o da própria coordenadora, que está logada.
- A galeria só tem dado inventado.

Nenhuma foto mostra nome, matrícula ou conteúdo onde a regra 20 pede id ou agregado.

**Pessoas que dividem o computador (RF24):** `e2e/aparencia.spec.ts` prova duas coisas depois que a pessoa A sai e a B entra:
- o `localStorage` tem exatamente `{ 'educa.aparencia': 'escuro', 'educa.lateral-recolhida': 'sim' }` e o `sessionStorage` está vazio;
- o nome da pessoa A não aparece na tela da B.

Isso atende à regra 50, item 7.

**Pergunta de fechamento:** a tarefa não acrescenta nada ao que o sistema guarda sobre o aluno nem ao que ele envia para fora. A resposta para a secretaria continua a mesma de antes.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Pôr no `docs/lgpd.md` uma linha que diga "o navegador guarda só preferência de aparelho, sem identificador" e que aponte para `docs/interface.md` seção 6. Assim o dossiê de conformidade responde a pergunta do jurídico sem sair do documento de LGPD.
2. Quando o F16 servir política de segurança de conteúdo, confirmar que entrar o hash do script do tema em `script-src` não abre caminho para `'unsafe-inline'`. O item já está no `TODO.md`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/tema.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/index.html`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Aparencia.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/MenuDaPessoa.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/operacao/componentes/CascaDaOperacao.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/dados.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/aparencia.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/interface.md`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-13 09:35:50 · `tasks/prd-pele-e-casca/2_task.md`

VEREDITO: REPROVADO
Escopo: incompleto
Aderência à Tech Spec: divergência em §10 (configuração do Playwright e vitrine no escuro) e em §7c (medida em brotli)
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes:

1. **Duas subtarefas da Tech Spec ficaram sem dono.** Estão em `tasks/prd-pele-e-casca/tasks.md:23` (subtarefa 2.4 da tarefa 2.0) e em `tasks/prd-pele-e-casca/techspec.md:208-209`:
   - "`playwright.config.ts` fixa `colorScheme: 'light'`"
   - "a vitrine ganha a opção de fotografar no escuro"

   O `2_task.md` não traz nenhuma das duas, a árvore não fez nenhuma, e nenhum outro `N_task.md` as cita (procurei `playwright.config`, `colorScheme` e `vitrine` em todos).
   - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/playwright.config.ts:31-37`: o bloco `use` não tem `colorScheme`.
   - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tools/vitrine/`: não tem opção de tema escuro, e as fotos desta rodada saíram todas no claro.
   - `e2e/aparencia.spec.ts:16` afirma que "`playwright.config.ts` roda no claro". Isso só vale pelo padrão do Playwright, não pela configuração que a spec exige. Desde esta tarefa o script do `index.html` segue o `prefers-color-scheme`, e o `cenarios.md:9` depende dessa fixação para todos os oráculos em `rgb()`.

   **Correção exigida:** pôr `colorScheme: 'light'` no `use` do `playwright.config.ts` e dar à vitrine a opção de fotografar no escuro. A alternativa é mover as duas, de forma explícita, para outra tarefa no `tasks.md` e no `techspec.md`, com o registro na seção "Divergências" do `2_task.md`.

2. **A medida em brotli não foi feita.** `tasks/prd-pele-e-casca/techspec.md:112-113` (§7c) exige: "A entrada e o CSS são medidos em brotli antes e depois, em cada tarefa que os toca, com o número no documento da tarefa". Esta tarefa põe `tema.ts`, `Segmentado`, `Aparencia` e a chamada em `main.tsx` na entrada, que conta nos 150 kB e já estava em 127 kB. Também altera o `estilos.css`. O `2_task.md` não traz nenhum número, e "o teste do build continua verde" (linha 126) não substitui a medida. **Correção exigida:** medir no build de produção a entrada (`index-*.js`) e o CSS em brotli, antes (HEAD) e depois, e escrever os quatro números no `2_task.md`, como a tarefa 1.0 fez (`1_task.md:139-140`).

Recomendações:
- A ordem dos blocos da galeria mudou, porque agora segue o nome do arquivo (por exemplo, "Seleção e menu" passou para logo depois de "Botões"). Nenhuma asserção depende disso: comparei os 12 casos de `pecas.spec.ts` com os dos cinco arquivos novos, corpo a corpo, e são idênticos; as 309 chamadas de `expect(` também conferem. Vale uma linha no comentário de `galeria/Galeria.tsx` dizendo que a ordem de antes não foi mantida.
- Na faixa `bg-noite` da operação, o `Segmentado` desenha um bloco `bg-fundo` claro. Funciona, e a faixa clareia na 15.0. Convém conferir ali, na 15.0, se o grupo continua com a mesma cara.
- `escolherAparencia('sistema')` com `removeItem` lançando e leitura funcionando guarda "sistema" na memória da aba, mas a chave antiga continua no armazenamento e volta na próxima recarga. É coerente com o RF4 ("vale até a aba fechar"), mas o comentário de `tema.ts:31-35` poderia dizer isso.

Arquivos citados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/2_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/tasks.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/playwright.config.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/aparencia.spec.ts`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-13 09:36:00 · `tasks/prd-pele-e-casca/2_task.md`

VEREDITO: REPROVADO

**Cenários exigidos**
- Caminho feliz:
  - `resolverTema` nas seis combinações.
  - O script do `index.html` respondendo igual a `resolverTema`.
  - Escuro escolhido vale já no primeiro quadro, antes do React.
  - Em Sistema, a página aberta acompanha o aparelho; com Claro escolhido, não acompanha.
  - Voltar a Sistema apaga a chave.
  - A Aparência aparece no menu da conta nos três papéis e na faixa da operação.
- Bordas:
  - Chromebook gerenciado, com armazenamento que lança ao ler e ao gravar (RF4).
  - Valor estranho guardado no navegador.
  - Navegador sem `matchMedia`.
  - Duas abas.
  - Duas pessoas no mesmo computador (RF24).
  - Segunda pessoa na mesma aba.
  - Gravação que falha uma vez e depois volta a funcionar.
- Permissão: as telas públicas (entrar e segundo fator da operação) não têm o controle.
- Isolamento: o navegador não guarda pessoa, escola nem papel; a lista de chaves é fechada e o `sessionStorage` fica vazio.
- Galeria: a divisão do `pecas.spec.ts` sem mudar nenhuma asserção.

**Cobertos**
- As 13 linhas da tabela "Testes que provam a regra" têm teste:
  - `tema.test.ts`, `Aparencia.test.tsx`, `Segmentado.test.tsx`, `MenuDaPessoa.test.tsx`, `CascaDaOperacao.test.tsx` e `Galeria.test.tsx`: os 6 arquivos passam, com 58 casos (rodei).
  - `e2e/aparencia.spec.ts`: o primeiro quadro, o aparelho mudando de tema, Sistema apagando a chave, as duas abas, o alvo de toque, RF24, os três papéis e a operação.
- Conferi a divisão do e2e contra o `pecas.spec.ts` da HEAD:
  - As 309 linhas de `expect` são as mesmas depois de ordenadas. Só os imports diferem.
  - Os títulos dos 12 casos são os mesmos.
  - O que mudou foi só o envoltório: helpers exportados e `test.describe` repetido.
- O e2e roda sobre o build do compose, então segurar `**/assets/index-*.js` de fato segura o React.
- Não há `.skip`, `.only` nem `any`, e nenhum mock esconde a regra: os mocks são só de `Storage.prototype` e `matchMedia`, que são de fora.
- Não há IA nem concorrência de servidor nesta tarefa.

**Bloqueantes**

1. **`apps/web/src/tema.ts:84` — regra sem teste.**
   - O problema: `escolhaQueOArmazenamentoRecusou = undefined`, depois de uma gravação que funcionou, pode ser apagado sem que nenhum teste fique vermelho.
   - Por que importa: o comentário em `tema.ts:33-34` diz que, com o armazenamento funcionando, a chave é a única fonte da escolha. Sem essa linha, este caso real quebra:
     - o Chromebook recusa uma gravação, e a memória fica com "escuro";
     - depois o armazenamento volta, e a pessoa escolhe Claro;
     - a peça continua marcando Escuro e pintando escuro, mas o `localStorage` diz `claro`.
   - Hoje só o `afterEach` de `Aparencia.test.tsx` depende da linha, e nenhuma asserção roda depois dele.
   - Correção exigida:
     - Em `tema.test.ts`, um caso: `setItem` lança, escolher Escuro, restaurar `setItem`, escolher Claro. Esperar `lerAparencia()` igual a `'claro'`, `data-tema` igual a `claro` e o `localStorage` igual a `{ 'educa.aparencia': 'claro' }`.
     - O bloco `mutacao` que remove a linha 84, apontando para esse caso.

2. **Cláusulas novas sem bloco na seção "Mutações".**
   - Cada uma tem um teste que ficaria vermelho, mas nenhum bloco a declara, então o portão não provou nenhuma delas:
     - `apps/web/src/tema.ts:41`, o filtro `valor === 'claro' || valor === 'escuro' ? valor : undefined`. Regra: o valor do navegador nunca é confiado. Teste: "o que está na chave e não é claro nem escuro é Sistema".
     - `apps/web/src/tema.ts:42-45`, o `catch` de `escolhaGuardada`. Regra: RF4, a leitura que lança cai em Sistema. Teste: "armazenamento que lança ao ler e ao gravar", no `expect(lerAparencia()).toBe('sistema')` inicial. O bloco atual só cobre o `catch` de `escolherAparencia`.
     - `apps/web/src/tema.ts:51-54`, o `catch` de `sistemaEstaEscuro`. Teste: "sem matchMedia, o claro".
     - `apps/web/src/tema.ts:109`, a linha que zera a memória no evento `storage`. Regra: a escolha de outra aba vale mais que a da memória. Teste: "a escolha de outra aba vale mais do que a que esta aba guardou na memória".
     - `apps/web/index.html:25-27`, o `try/catch` do `matchMedia` no script. Regra: o script nunca lança, como diz a tabela da tarefa. Teste: "leitura que lança cai no sistema, e matchMedia que falta ou lança cai no claro".
     - `apps/web/src/componentes/Segmentado.tsx:39`, o `Math.max(marcada, 0)`. Regra: com o valor fora da lista, a primeira opção continua alcançável pelo Tab. Teste: "com o valor fora da lista…".
     - `apps/web/src/componentes/Segmentado.tsx:59`, a volta nas pontas com `(indice - 1 + total) % total`. Teste: "as setas escolhem… e dão a volta nas pontas".
   - Correção exigida: um bloco `mutacao` para cada cláusula, apontando para o teste citado, e o portão da tarefa rodado de novo.

**Recomendações**
- `e2e/aparencia.spec.ts:146`:
  - O título diz que "a segunda herda só a aparência", mas ela herda também `educa.lateral-recolhida`, e o próprio teste confere isso na linha 167. O título deve dizer o que o teste prova.
  - No projeto `celular`, o `setViewportSize` de 1024 px não é desfeito, então a entrada da segunda pessoa nunca é exercida a 360 px. A tarefa pedia 1024 só "nesse passo".
- `apps/web/src/galeria/Galeria.tsx:23`: a ordenação por nome de arquivo, que mantém a página na mesma ordem em toda corrida, não tem teste. Um teste de componente comparando a ordem dos `data-galeria` com a ordem dos nomes de arquivo resolveria.
- `Segmentado.test.tsx › o alvo é de 44 px` confere só as classes. O tamanho real é medido no e2e `alvo de toque`; vale citar o e2e no nome do caso de componente, para ninguém achar que o `jsdom` mede.
- `Galeria.test.tsx:90`: `toBeGreaterThanOrEqual(309)` conta texto com `expect(`. Uma asserção trocada por outra passa nessa contagem. A conferência linha a linha que fiz não fica registrada em teste. Fica para o `/retro`: se o portão deve guardar o hash das linhas de asserção na próxima divisão.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/tema.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/tema.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/index.html
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Segmentado.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/Galeria.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/aparencia.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/2_task.md

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-13 09:37:34 · `tasks/prd-pele-e-casca/2_task.md`

VEREDITO: APROVADO

Tela vista: sim, 29 fotos da vitrine (governança cheia e vazia nos dois tamanhos, galeria cheia nos dois tamanhos). As fotos da galeria vazia têm os mesmos bytes das da cheia, porque a galeria não depende de dado da escola, então li só as da cheia. Como a Aparência não aparece nas fotos do celular (fica na gaveta), fotografei eu mesmo, a 360 px e a 1366 px, no claro e no escuro: gaveta aberta, foco por teclado e escolha de Escuro. A faixa da operação não foi vista: a vitrine não tem operador, então fica por código e pelo e2e.

Estados: ok. A Aparência é controle local, sem carregando, vazio ou erro. Armazenamento que recusa fica calado e vale até a aba fechar (`tema.ts:75-91`, testado). A governança cheia e a vazia continuam completas, e o estado vazio convida em vez de se desculpar.

Acessibilidade: ok.
- A peça é um `radiogroup` com uma parada só no Tab, setas, Home e End.
- O `aria-checked` marca a opção escolhida, que também leva borda e fundo, e o rótulo "Aparência" existe (visível, ou só para leitor de tela na operação).
- O foco apareceu bem nas fotos.
- No escuro, o texto da opção marcada e os chãos da lateral ficaram legíveis.
- Dois campos escuros de caixa de pedido aparecem com borda fina, nada que reprove.

Chromebook fraco: ok.
- `Segmentado` e `Aparencia` entram na entrada sem importar peça de `PECAS_FORA_DA_ENTRADA`.
- O script em linha tem poucas linhas e não espera o React, então não há piscar.
- A galeria segue em chunk próprio.

Celular: ok.
- Na gaveta a 360 px, `scrollWidth` é 360 e as três opções medem 67 × 44 px.
- As fotos de governança a 360 px não têm rolagem lateral nem texto cortado.
- Nada depende de hover (o `hover:` do `Segmentado` é só enfeite) e o fluxo não exige o celular.
- Rodei os 6 arquivos de teste de unidade da tarefa: 58 passam.

Ação oficial protegida: sim (não se aplica; a tarefa não toca nota, aprovação nem publicação). O navegador guarda só `educa.aparencia` e `educa.lateral-recolhida`, sem pessoa nem escola, e isso está em `docs/interface.md` seção 6.

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
1. **Foco do `Segmentado` dentro da faixa da operação.** `apps/web/src/estilos.css:306` (`.bg-noite :focus-visible`) pinta o anel das opções em `caramelo-noite` (`rgb(242,162,91)`). Reproduzi pondo `bg-noite` num ancestral da galeria: o anel cai sobre o fundo branco do próprio grupo e dá cerca de 2,1:1, abaixo dos 3:1 que o RF2 pede. A causa (a regra `.bg-noite`) já está na tarefa 3.0, e `CascaDaOperacao.tsx:105` é o único lugar onde a `Aparencia` fica sob `bg-noite`.
   - Destino: tarefa 3.0 ou 15.0, medindo o anel da `Aparencia` na faixa nos dois temas, não só o do "Sair".
2. **Placeholder da caixa de pedido cortado a 360 px.** `apps/web/src/componentes/ia/CaixaPedido.tsx:112-125` (`rows={1}`, `min-h-11`): "Peça uma atividade, um plano de aula…" quebra e a segunda linha some atrás da barra. Aparece em `coordenacao--galeria--celular-3.png` e em `professora--professor-nova-conversa--celular.png`. É anterior a esta tarefa (as fotos são idênticas às de antes dela) e a peça não foi tocada aqui.
   - Destino: a 10.1 revestir `CaixaPedido`; exigir exemplo curto ou campo que cresça.
3. **Rótulos da galeria sem acento** ("primario", "oficial", "secundario"). São nomes de variante em tela que diz não ser do produto e só sai com `VITE_COM_GALERIA=1`, então não vaza para usuário. Vale acentuar quando a galeria for revestida.
4. **Recomendação do `privacy-guardian` (1ª rodada), ainda aberta:** uma linha em `docs/lgpd.md` dizendo que o navegador guarda só preferência de aparelho, sem identificador.

Observação: reexecutei `vitrine.ts foto coordenacao /coordenacao/governanca`, que regravou as fotos da governança cheia em `.processo/vitrine/` com o mesmo conteúdo, e deixou a sessão da coordenação renovada. Meus scripts auxiliares estão só em `/tmp/claude-1000/.../scratchpad`.

Arquivos principais revisados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Segmentado.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Aparencia.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/tema.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/index.html`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/operacao/componentes/CascaDaOperacao.tsx`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-13 09:52:14 · `tasks/prd-pele-e-casca/2_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum.

As duas correções da 1ª rodada foram feitas:
1. **`colorScheme` e vitrine.** `playwright.config.ts:34` fixa `colorScheme: 'light'`, e `apps/web/src/tema.test.ts:147` e uma mutação no `2_task.md` garantem que isso não sai. A vitrine ganhou `--escuro`: em `tools/vitrine/foto.ts` a opção liga `colorScheme: 'dark'` no navegador, e o nome da foto leva `escuro--` para não apagar a do claro (`foto.test.ts`, também com mutação). `vitrine.ts` aceita a opção e a mostra no texto de uso. As duas mudanças estão em "Arquivos" e em "Divergências" do `2_task.md`. Na Tech Spec, elas já estavam em `techspec.md:208-209`, e no `cenarios.md`, na linha 9.
2. **Medida em brotli.** Os quatro números estão em `tasks/prd-pele-e-casca/2_task.md`, logo depois de "Divergências": a entrada passa de 91.102 para 91.874 bytes e o CSS, de 6.547 para 6.663, medidos contra o HEAD `65ab3b1`. A entrada continua abaixo do teto de 150 kB.

O resto do diff não abre problema novo:
- **`tema.ts`:** um teste novo prova que, quando o armazenamento volta a funcionar, ele volta a ser a fonte da escolha, com mutação.
- **`aparencia.spec.ts`:** o RF24 agora volta à largura do projeto para a segunda pessoa e abre a gaveta no celular.
- **`TODO.md`:** recebeu as duas recomendações do privacy-guardian.

Recomendações:
- **Tabela partida em `tasks/prd-pele-e-casca/2_task.md:164`.** Uma linha em branco separa as duas linhas novas do resto da tabela de "Divergências". Sem cabeçalho, elas não aparecem como tabela. Basta tirar a linha em branco.
- **Ordem da galeria citada onde não está.** A linha de "Divergências" sobre a ordem dos blocos (`2_task.md:166`) diz que o assunto está em `techspec.md` §9 ("Galeria"), mas `techspec.md:185-189` não fala de ordem. Não conto como divergência, porque a Tech Spec não define ordem e o glob que ela escolheu leva a essa ordem. Mesmo assim a referência está errada. Ou se põe meia frase em §9 ("a ordem é a do nome do arquivo"), ou a coluna passa a dizer "a Tech Spec não define ordem".

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/2_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/playwright.config.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tools/vitrine/foto.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tools/vitrine/vitrine.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/techspec.md

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-13 09:52:21 · `tasks/prd-pele-e-casca/2_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. O diff desta rodada mexe na preferência de aparência do navegador (`educa.aparencia`), no `colorScheme` do Playwright e na opção `--escuro` da vitrine. Nenhum desses é dado de pessoa.

Fora da tabela de dados do docs/lgpd.md: nenhum. A preferência de aparelho não tem identificador e não ganha linha na tabela. A linha que explica isso no `docs/lgpd.md` ficou anotada em `TODO.md:1008-1012`, o que a recomendação da 1ª rodada pedia.

Autorização por objeto: ok. Esta rodada não cria nem altera rota, repository ou DTO. No `e2e/aparencia.spec.ts:105-133` (RF24), a segunda pessoa que entra no mesmo computador agora chega na largura do projeto. No celular a lateral passa a ser a gaveta, e o teste continua provando que a tela mostra o nome da segunda pessoa e não o da primeira, também a 360 px.

Logs: limpos.

Auditoria: não se aplica a esta rodada (nenhuma leitura de dado de aluno, exportação, nota ou permissão).

Envio externo: nenhum.

Seed/fixture: sintético.
- **Governança** (`.processo/vitrine/escuro--coordenacao--coordenacao-governanca--computador.png`, `…--celular-1.png`, `escuro--vazia--…--computador.png`): no escuro aparece o mesmo conteúdo que no claro. São só agregados, "Aprovado por um professor" sem nome, "Colégio sintético" e "Coordenadora sintética".
- **Galeria** (`escuro--coordenacao--galeria--computador-1..4.png`): mostra nomes inventados ("Camila Souza", "Ana B.", "Caio M."), que vêm de `apps/web/src/galeria/dados.ts`. A galeria fica fora do build de produção, e o conteúdo é o já aprovado na 1ª rodada, só em outra ordem (`Galeria.tsx:21-24`).
- **Fotos e sessões da vitrine**: `.processo/vitrine/sessao-<papel>.json` e as fotos continuam fora do git (`.gitignore:26`).

O novo teste do armazenamento (`apps/web/src/tema.test.ts:219-233`) confere que, quando o armazenamento volta a funcionar, só `educa.aparencia` fica guardado no navegador. Isso reforça a lista fechada de `docs/interface.md` seção 6.

Bloqueantes: nenhum.

Recomendações:
- Continua em aberto a da 1ª rodada, já anotada em `TODO.md:1008-1012` e sem bloquear: quando o F16 servir a política de segurança de conteúdo, conferir que o hash do script do tema em `script-src` não abre caminho para `'unsafe-inline'`. No mesmo momento, pôr no `docs/lgpd.md` a linha "o navegador guarda só preferência de aparelho, sem identificador".
- `tools/vitrine/foto.ts:364`: a sessão guardada (`sessao-<papel>.json`) serve igual para a foto no claro e no escuro. Isso não tem impacto de privacidade, porque é sessão sintética e fora do git. Fica só como observação, se um dia a vitrine fotografar com dado de outra origem.

## test-engineer · 2ª rodada · APROVADO · 2026-10-13 09:52:34 · `tasks/prd-pele-e-casca/2_task.md`

VEREDITO: APROVADO

Cenários exigidos (os mesmos da 1ª rodada):
- Sistema, Claro e Escuro: a escolha vence o aparelho.
- Valor estranho guardado no navegador.
- Armazenamento que recusa ler ou gravar.
- Armazenamento que volta a funcionar.
- Escolha feita em outra aba.
- Navegador sem `matchMedia`.
- O script do `index.html` igual a `resolverTema` e sem nunca lançar.
- No `Segmentado`: uma parada só no Tab, setas com volta nas pontas, valor fora da lista.
- Duas pessoas no mesmo computador (RF24): o navegador guarda só a aparência e a lateral recolhida.
- O e2e com o aparelho fixo no claro.

Cobertos: todos. As duas correções exigidas foram feitas.

1. `apps/web/src/tema.ts:87` (era a linha 84). O caso novo está em `apps/web/src/tema.test.ts:219-233`. Ele faz o que a ordem pediu: `setItem` lança, escolhe Escuro, restaura `setItem`, escolhe Claro, e confere `lerAparencia()`, `data-tema` e o `localStorage` igual a `{ 'educa.aparencia': 'claro' }`. Sem a linha 87, a escolha recusada continua na memória e `lerAparencia()` devolve `'escuro'`, então o teste fica vermelho pelo motivo certo. O bloco está em `2_task.md:293`.
2. As sete cláusulas sem bloco ganharam um cada uma (`2_task.md:301-357`). Conferi as sete contra o código e o teste citado:
   - `tema.ts:44`, o filtro: com `valor ?? undefined`, `'roxo'` chega como aparência e o teste, que espera Sistema, falha.
   - `tema.ts:45-48`, o `catch` de `escolhaGuardada`: com `throw`, o `lerAparencia()` do começo lança.
   - `tema.ts:54-57`, o `catch` de `sistemaEstaEscuro`: sem `matchMedia`, o `TypeError` sobe e `aplicarTema` lança.
   - `tema.ts:112`: a escolha da memória continua `'escuro'` depois do evento `storage`, e o teste espera `'claro'`.
   - `index.html:25-27`: com `finally`, o `not.toThrow()` falha quando `matchMedia` falta ou lança. O contexto escolhe o segundo `try`, e o trecho aparece uma vez só.
   - `Segmentado.tsx:39`: sem o `Math.max`, nenhuma opção fica com `tabIndex` 0 e a tabela esperada não fecha.
   - `Segmentado.tsx:59`: com `Math.max(indice - 1, 0)`, a seta para a esquerda na primeira opção para nela, e o teste espera a Terceira.

O que o diff acrescentou também tem bloco:
- `playwright.config.ts:36` (`colorScheme: 'light'`), provado por `tema.test.ts:147`.
- `tools/vitrine/foto.ts:55` (o prefixo `escuro--`), provado por `foto.test.ts:29`.

O carimbo do portão (`.processo/portao.json`) declara 29 mutações. São os 19 blocos de antes e os 10 novos. Os três arquivos de unidade alterados rodaram verdes: 55 de 55.

O RF24 em `e2e/aparencia.spec.ts:147-180` ficou mais forte. A segunda pessoa entra na largura do projeto: no celular, pela gaveta. No chromebook, o botão "Abrir a lateral" prova que ela herdou a lateral recolhida.

Bloqueantes: nenhum. Não há `.skip`, mock que esconda a regra nem chamada de IA. A tarefa não tem operação concorrente.

Recomendações:
- `apps/web/src/componentes/Segmentado.tsx:55`: a volta na outra ponta, `(indice + 1) % total`, não tem bloco próprio. Ela tem teste: `Segmentado.test.tsx:92-93` ficaria vermelho sem ela. Vale um bloco gêmeo do da linha 59. Não reprovo: o código não mudou desde a 1ª rodada, e eu não pedi esse bloco nela.
- `tools/vitrine/foto.ts:170` (`colorScheme: escuro ? 'dark' : 'light'`) e o filtro do `--escuro` em `tools/vitrine/vitrine.ts:73` não têm teste. É ferramenta de inspeção, e testar exigiria abrir um navegador. Se `fotografar` ganhar um teste com navegador um dia, este caso entra junto.
- `tema.test.ts:147` confere a configuração do Playwright procurando o texto no arquivo. Basta para hoje, mas um teste e2e que lesse `matchMedia('(prefers-color-scheme: dark)').matches === false` provaria o efeito, e não só o texto.

Arquivos de referência:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/2_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/tema.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/tema.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Segmentado.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Segmentado.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/aparencia.spec.ts

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-13 09:54:45 · `tasks/prd-pele-e-casca/2_task.md`

VEREDITO: APROVADO

Tela vista: sim (27 fotos lidas: governança nos dois temas, escola cheia e vazia, computador e celular; galeria no escuro nos 10 pedaços e uma no claro para comparar; mais uma foto minha da gaveta no celular, no escuro). A foto da gaveta não está em `.processo/vitrine/` porque a tirei com um script próprio, e o arquivo é `gaveta-dark.png` no scratchpad da sessão.

Estados: ok. O vazio da governança convida: "A IA ainda não gerou nada nesta escola. Quando um professor pedir uma versão adaptada…" e "Nenhuma função trabalhou neste mês…", nos dois temas. Carregando e erro não aparecem na vitrine; o erro aparece na galeria ("Não foi possível responder agora. Tente de novo em instantes." com "Tentar de novo"), e o carregando está coberto pelos e2e.

Acessibilidade:
- `Segmentado` é `radiogroup` com uma parada só no Tab e setas, Home e End.
- A opção marcada tem borda e fundo, não só cor.
- O anel de foco e o rótulo "Aparência" aparecem nas fotos.
- No escuro, texto e selos têm contraste legível: o laranja sobre marrom, o verde e o vermelho dos selos.
- Os alvos de toque saem de `min-h-11 md:min-h-9`. Não medi a altura no celular: o script de medição não imprimiu.

Chromebook fraco: a rodada não mexeu em carga. Por `2_task.md`, a entrada fica em 91,9 kB em brotli (teto de 150 kB), e `Segmentado` e `Aparencia` não puxam peça fora da entrada. O script do `index.html` aplica o tema antes do React, sem piscar.

Celular:
- Sem rolagem horizontal nas fotos de 360 px, nos dois temas.
- A Aparência está na gaveta, com 3 opções de largura cheia, e no escuro continua legível.
- A tabela vira lista de cartões a 360 px.
- A faixa vazia da "Tabela que não cabe" na galeria do computador é a região que rola de propósito (`superficies.tsx:73-76`, `Tabela.tsx:78`, `role=region` com foco). Isso é o comportamento pretendido.

Ação oficial protegida: sim. Nada nesta tarefa cria ação oficial nova, e o "Aprovar 32 correções" da galeria leva o valor à vista.

Diff desde a rodada anterior (`.processo/ordens/diff-2_task-r2.txt`): só comentário em `tema.ts` e `Galeria.tsx`, mais um caso de teste novo em `tema.test.ts`, `colorScheme: 'light'` em `playwright.config.ts` (agora guardado por teste), `--escuro` na vitrine com teste e a marca `escuro--` no nome do arquivo, e um ajuste no e2e `aparencia.spec.ts` (RF24 volta à largura do projeto). A tela é a mesma da rodada anterior. A foto no escuro confirma que a pele escura não introduziu defeito. Não havia correção exigida a conferir.

Bloqueantes: nenhum.

Recomendações (não bloqueiam; já registradas no `2_task.md` com destino):
- `apps/web/src/componentes/CaixaPedido.tsx:112-125` (`escuro--coordenacao--galeria--celular-4.png`, igual no claro): a 360 px o placeholder "Peça uma atividade, um plano de aula…" fica cortado atrás do botão "Só conversar". É defeito de tela de verdade e já existia antes desta tarefa. A peça não foi tocada aqui e a página é a galeria, que se declara "Não é uma tela do produto". Está na tarefa 10.0, e quem aprovar a 10.0 deve ver essa foto: se continuar assim, é bloqueante lá.
- `apps/web/src/galeria/secoes/botoes.tsx`: rótulos "primario", "secundario" e "oficial" sem acento, visíveis em `escuro--coordenacao--galeria--computador-1.png`. Está na tarefa 3.0.
- Foto da gaveta: `--clicar` da vitrine é aplicado nas duas telas e falha no computador, onde o botão "Abrir o menu" não existe. A vitrine poderia aceitar clique só no celular, para a gaveta sair na foto sem script próprio.
- Faixa `bg-noite` da operação: anel de foco da `Aparencia` abaixo de 3:1 e bloco `bg-fundo` claro no grupo. Está na tarefa 15.0. Não aparece nas fotos desta rodada.

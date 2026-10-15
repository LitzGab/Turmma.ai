# Achados das revisões — `tasks/prd-pele-e-casca/11_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-15 16:05:01 · `tasks/prd-pele-e-casca/11_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)").

Bloqueantes: nenhum.

O que conferi:
- **Subtarefas.** As quatro (11.1 a 11.4) estão feitas, e nada da 12.0 entrou: o `main` e a moldura de 1200 continuam como estavam.
- **Divergências.** As três da tabela não contrariam a `techspec.md` 9 ("Página") nem a `docs/interface.md` 11.2, que diz que "a composição de cada tipo chega com a spec da área".
  - Os dois comentários fora dos arquivos previstos estão declarados.
  - A prop `objeto` ficou sem efeito porque o título agora aparece em toda tela.
  - As seis telas continuam na largura `grade`, para não mudar o miolo.
- **Cenários.** O A44 passou a 32 px, e a Governança está entre os itens que o e2e percorre, o que cobre a parte B do `esperarGovernanca`.
- **Fotos.** Estrutura, Professores na escola vazia, Governança no celular, Minha turma na escola vazia e a turma aberta no celular mostram o `h1` visível com o texto de hoje. A turma aberta mostra "Turma {nome}" com a série embaixo e o voltar acima.
- **Testes novos.** Nenhum `.skip`, `any` ou `TODO`.

Recomendações:
- **`objeto` sem efeito.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Tela.tsx:25` a prop continua aceita mas não muda nada, e ainda é passada por `DetalheDoPedido.tsx` e `Artefato.tsx` (e pelas outras telas que a divergência lista). A tabela diz só "a tarefa que recompuser cada uma o tira". Registre o destino concreto (X2 a X4, ou a tarefa) para ela não ficar esquecida.
- **Listas de itens duplicadas.** As listas `ITENS_DO_*` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/titulo-da-tela.spec.ts` repetem as de `areas.spec.ts`, e o próprio arquivo avisa que quem acrescentar um item à lateral precisa mudar as duas. Vale extrair para uma fixture de `e2e/__fixtures__/`, para que a lateral nova não passe sem conferir o título.
- **Conferência de 64 px no `material.spec.ts`.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/material.spec.ts:125`, quando o `h1` não está dentro de um `header` a altura vira 0 e a conferência falha com um erro pouco claro. O `titulo-da-tela.spec.ts` resolve isso afirmando antes que o cabeçalho existe (`not.toBeNull`); vale fazer o mesmo aqui.

## test-engineer · 1ª rodada · APROVADO · 2026-10-15 16:05:04 · `tasks/prd-pele-e-casca/11_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **O título aparece.** A `Tela` desenha o `h1` visível, em `t-titulo`, dentro de um `header` de no mínimo 64 px (`min-h-16`), com a descrição e as ações dentro dele.
- **A conversa é a exceção.** Com `tituloSoParaLeitor` o `h1` fica escondido (`sr-only`), não há `header`, e as ações continuam na tela.
- **`idDoTitulo` e `refDoTitulo`** chegam ao `h1` nas duas formas. O `tabIndex` vale -1 só quando há `ref`.
- **As quatro larguras e a largura padrão** (`grade`).
- **`comMargem`:** 16 px no celular e 32 px a partir de 768, 24 em cima e 32 embaixo. Sem a prop, nenhuma margem.
- **As seis telas nos quatro estados** (carregando, com erro, vazia, com dado), cada uma com um `h1` só.
- **Casos de borda do domínio:** sem a turma lida, o título é só "Turma". A turma que sai com a tela aberta tira o nome e a série do título, no professor e na coordenação. O aluno sem turma no ano e o professor ainda não alocado (o vazio) também mostram o título.
- **No navegador:** a caixa do `h1` medida em cada item da lateral dos três papéis, o título da aba, nada rolando de lado a 360 px, e `Turmas` vazia e com erro com a rota interceptada. Em `material`, a margem continua única. A A44 sobe para 32 px.
- **Não se aplicam:** permissão, isolamento e concorrência. A tarefa só muda a moldura das telas; não toca API, banco nem regra de acesso.

**Cobertos:** todos.
- `apps/web/src/componentes/Tela.test.tsx` e `apps/web/src/areas/titulo-das-telas.test.tsx` rodaram aqui: 43 testes verdes.
- Conferi as 44 mutações contra o `git diff`. Cada cláusula nova da `Tela` e de cada uma das onze telas tem bloco, e cada bloco aponta para um teste que chega à cláusula:
  - os dois cálculos de `nomeDaTurma` e `serieDaTurma` têm bloco, e é o caso "a turma que sai com a tela aberta" que os alcança;
  - o `refDoTitulo` de `Professores` é pego pelo `tabindex="-1"`;
  - o `tabIndex` que ficasse sempre -1 é pego pelo caso sem `ref`.
- O e2e mede a caixa de verdade (largura, altura, fonte de 24 px, `clip`, `clip-path`, `position` e a altura do cabeçalho), e não usa `toBeVisible`, que passaria no `h1` escondido. O comentário em `e2e/titulo-da-tela.spec.ts:20` explica isso.
- As listas `ITENS_DO_*` batem com as de `e2e/areas.spec.ts`. O título da aba de cada item bate com o `useTituloDaTela` da tela.
- Não há `.skip`, teste comentado nem mock de código nosso. A rede falsa só substitui o `fetch`, e o caminho que o caso não nomeia responde lista vazia.
- O e2e não rodou nesta auditoria; ele é do portão da tarefa, que a árvore aciona por ter criado `e2e/titulo-da-tela.spec.ts`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `apps/web/src/areas/professor/Turma.tsx:68-72`: falta um caso com a turma lida e `/v1/eu` falhando. A tela cai no ramo de erro com o título "Turma 7º A" e a série, e nenhum teste fixa isso. Basta um `it` em `titulo-das-telas.test.tsx` com `TURMA_ABERTA` e `'/v1/eu': FALHA`, esperando o alerta e o título com nome.
2. `e2e/titulo-da-tela.spec.ts`: a turma aberta (`/professor/turmas/<id>` e a lista da turma da coordenação) não entra na medição do navegador, porque não é item da lateral. Só o teste de componente cobre o título dela, e ele não vê a caixa nem a rolagem a 360 px. Vale um caso que abra "Abrir a turma" e meça o `h1` e o `larguraExcedente`.
3. `apps/web/src/componentes/Tela.test.tsx:38`: o caso da conversa não diz que a `descricao` some com `tituloSoParaLeitor`. Hoje nenhuma das cinco telas da conversa a passa, mas a regra fica sem teste.
4. As telas fora da lateral que usam a `Tela` sem `objeto` passam a mostrar o título sem teste próprio desta tarefa: o carregando de `Atividade` e de `Aprovar`, `DetalheDoPedido`, `Artefato` e `MeusDados`. Isso segue a Tech Spec. O e2e dessas telas na esteira é quem vai dizer se algum seletor dependia do `h1` escondido.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-15 16:05:55 · `tasks/prd-pele-e-casca/11_task.md`

VEREDITO: APROVADO

Tela vista: sim (56 fotos lidas, cheia e vazia). Li as 26 fotos da lista, dos três papéis, das seis telas e da galeria. Fotografei também Agentes, Analista, Material e Privacidade da coordenação, e a Lista de nomes aberta pela Estrutura, que não vinham na lista.

- **Vazia que não está vazia:** as fotos "vazia" da vitrine mostram uma escola com uma turma, uma disciplina e uma professora, e não uma escola sem dado. Valem o código e os testes de componente para os estados vazio e erro; o e2e `titulo-da-tela.spec.ts` cobre vazio e erro de `Turmas` com a rota interceptada.
- **Foto em branco:** `vazia--coordenacao--coordenacao-estrutura--computador-2.png` é uma faixa em branco, e a mesma tela a 360 px (`vazia--coordenacao--coordenacao-estrutura--celular-2.png`) mostra o final da página normalmente.

Estados: ok
- Carregando, erro, vazio e com dado ficam todos dentro da `Tela`, e o `h1` aparece nos quatro.
- `Estrutura.tsx:219-228` deixou de devolver o "Carregando" sem `Tela`.
- `Turma.tsx:72`, `ListaDaTurma.tsx:120-126` e `MinhaTurma.tsx:59` mantêm o título no carregando e no erro.
- A cobertura está em `titulo-das-telas.test.tsx` e no e2e.

Acessibilidade: ok
- Um `h1` por tela, com o texto de hoje.
- `idDoTitulo` e `refDoTitulo` chegam ao `h1`, e `tabIndex=-1` só existe com `ref` (`Tela.tsx`).
- As `section aria-labelledby` de `Turmas`, `MinhaTurma`, `Professores`, `Turma` e `ListaDaTurma` apontam para um `h1` que sempre existe.
- Foco visível e contraste claro e escuro conferem nas fotos.
- A exceção da conversa mantém o `h1` só para o leitor de tela nas cinco telas previstas.

Chromebook fraco: ok. Não há dependência nova nem efeito caro; o ajuste é de classe CSS e de estrutura.

Celular: ok
- Em 360 px não há rolagem horizontal nem texto cortado em nenhuma das fotos.
- O título de 24 px quebra com `break-words`.
- As ações principais têm 44 px ou mais; por exemplo, "Cadastrar professor" mede cerca de 48 px.
- `titulo-da-tela.spec.ts` mede `larguraExcedente` zero em cada item da lateral.

Ação oficial protegida: sim, com ressalva sobre o escopo. A tarefa só mexe no cabeçalho e não toca em aprovar, publicar nem excluir. Os botões de perigo seguem com a confirmação que já tinham.

Bloqueantes: nenhum.

Recomendações:
1. `apps/web/src/areas/coordenacao/ListaDaTurma.tsx` (lista de nomes aberta pela Estrutura): o campo de arquivo é o nativo do navegador e aparece "Choose File / No file chosen" na foto. Em navegador pt-BR sai em português, mas o `Material` usa um botão próprio ("Escolher arquivo"). Vale padronizar na spec da área (X2).
2. `Turmas.tsx` e `Professores.tsx`: o `h1` é seguido de um `h2` quase igual ("Turmas" e "Suas turmas"; "Professores" e "Professores da escola"). Fica para a recomposição da tela na spec da área.
3. O voltar de `Turma` e `ListaDaTurma` está no desenho antigo, em link sublinhado e não em linha própria de 28 px em `t-selo`. Já está declarado como fora do escopo desta tarefa.
4. As telas ficaram na largura `grade` de 1200, mas a casca ainda limita o conteúdo a 1024. Isso é da 12.0 e está declarado.

Arquivos de referência:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Tela.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/titulo-da-tela.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/areas/titulo-das-telas.test.tsx`

## test-engineer · 2ª rodada · APROVADO · 2026-10-15 16:19:08 · `tasks/prd-pele-e-casca/11_task.md`

VEREDITO: APROVADO

**Cenários exigidos (rodada 2: as três recomendações que a ordem `.processo/ordens/11_task-r1.md` mandou aplicar):**
1. Em `e2e/material.spec.ts`, conferir que o `h1` está num `header` antes de medir os 64 px.
2. A turma lida com `/v1/eu` falhando: aparece o erro com "Tentar de novo", o título continua "Turma 7º A", a série por extenso continua, e as abas não aparecem.
3. A `descricao` some quando o título fica só para o leitor de tela (`tituloSoParaLeitor`).

**Cobertos:**
- **Item 1:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/material.spec.ts:125-133`. A medida vira `null` quando não há `header`, e `expect(titulo.cabecalho).not.toBeNull()` vem antes da medida de 64 px.
- **Item 2:** o caso novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/areas/titulo-das-telas.test.tsx:212-223`. O teste confere o resultado na tela, e não só que o código rodou: o alerta, o botão "Tentar de novo", o título, a série e nenhuma aba.
  - A mutação declarada troca `const falha = turma.isError ? turma : eu.isError ? eu : undefined` (`Turma.tsx:70`) por `turma.isError ? turma : undefined`.
  - Com ela, a falha de `/v1/eu` deixa de ser erro e a tela cai no `EstadoCarregando` (`Turma.tsx:77-78`). O `findByRole('alert')` e o botão "Tentar de novo" então falham, que é o motivo certo: o cenário chega à cláusula.
  - O seletor "o erro toma o lugar das abas" casa com o nome do `it`.
- **Item 3:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Tela.test.tsx:40-52`. O caso agora passa `descricao` junto com `tituloSoParaLeitor` e espera `queryByText('Uma linha de apoio')` nulo.
  - A mutação põe o `<p>{descricao}</p>` no ramo escondido de `Tela.tsx:68-74`, e esse texto passa a ser achado: o teste fica vermelho.
  - O seletor "esconde só o" casa com o nome do `it`.
- **Cláusulas novas:** o código de produção não mudou nesta rodada, então não há cláusula nova sem bloco de mutação. Os dois blocos novos em "Mutações" correspondem aos dois casos novos.
- **Testes rodados:** `npx vitest run` nos dois arquivos de componente deu 44 de 44 verdes. Não rodei o `material.spec.ts`, que é e2e e roda na esteira.
- **Sem desvios:** nenhum `.skip`, nenhum teste comentado e nenhum mock de coisa nossa. A rede falsa por caminho (`redePorCaminho`) só simula a API.
- **"Recomendações sem aplicar":** a tabela do documento ficou igual à da ordem, com destino em cada linha.

**Bloqueantes:** nenhum.

**Recomendações:**
- Um caso opcional com a turma e `/v1/eu` falhando ao mesmo tempo prenderia o comentário "a turma primeiro" (`Turma.tsx:69-70`). Bastaria conferir que "Tentar de novo" chama de novo a leitura da turma. Hoje os dois ramos desenham o mesmo `EstadoErro`, e o que muda é só qual leitura o botão repete. Não bloqueia.

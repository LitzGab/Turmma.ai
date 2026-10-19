# Achados das revisões — `tasks/prd-telas-do-professor/6_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-19 09:51:48 · `tasks/prd-telas-do-professor/6_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. Ela muda só a tela do documento e não grava nota nem correção. "Encerrar a atividade" continua chamando o mesmo `encerrarAtividade`, e a correção resultante fica esperando a professora, como diz `EFEITO_DE_ENCERRAR`. Todos com autor humano? sim (nada novo grava Nota)

Decisão autônoma sobre aluno: ausente

Aprovação registrada: ok
- A versão adaptada pendente continua sem "Aplicar à turma" e com o texto "Esta versão adaptada só pode ser aplicada à turma depois que você aprovar." (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/AplicacaoDoArtefato.tsx:146`).
- Quem decidiu a versão (pendente, aprovada por quem, rejeitada com o motivo), o "Ver e decidir" e a assinatura da IA saíram do meio do conteúdo e ficaram acima das abas, à vista em todas (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Artefato.tsx:222-255`).
- "Aplicar à turma" continua separado da aprovação da versão, ainda pergunta "Esta atividade é avaliativa?" e só fica na aba "Na turma".
- A versão rejeitada não exporta, e a pendente exporta só como rascunho e avisa disso antes. Os testes em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Artefato.test.tsx:282-332` provam os três casos.

Supervisão do tutor: ok (o tutor não foi tocado)

Autonomia declarada e visível: sim (não foi tocada)

Nas fotos:
- No computador e no celular, com a escola cheia, a assinatura "Assistente · conversa e ferramentas" com o selo "IA" aparece acima das abas, na aba Conteúdo e na Na turma. Vem de `Artefato.tsx:224`.
- Nenhuma nota, conceito ou sugestão de nota aparece. "Gabarito" é a resposta da questão objetiva, só para a professora.
- O diálogo de aplicar continua pedindo a escolha "é avaliativa?" antes de confirmar.
- Com a escola vazia, o documento inexistente mostra a mesma tela única ("Este artefato não está disponível").
- Nenhuma tela induz uso a mais nem dificulta sair.

Bloqueantes: nenhum

Recomendações:
1. O teste de `Artefato.test.tsx:334` diz no nome que "a decisão fica à vista também nas outras abas da própria versão", mas só abre `?aba=versoes` da atividade original. Quem prova isso de fato é o teste da linha 316, que abre `?aba=turma` na própria versão e lê `data-aprovacao="pendente"`. Vale corrigir o nome ou acrescentar a verificação.
2. Ficar acima das abas é cláusula de regra 70 (itens 3 e 6), mas nenhuma mutação a cobre. Sugiro uma que leve `<LinhaDaVersao>` (Artefato.tsx:233) para dentro de `aba === 'conteudo'` e cite o teste da linha 316.
3. Nenhuma foto mostra uma versão adaptada aberta, pendente ou rejeitada. Por isso a linha de quem decidiu, acima das abas, foi conferida pelo código e pelos testes, mas não vista na tela. Na próxima vitrine desta tela, vale incluir um caso assim.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-19 09:52:33 · `tasks/prd-telas-do-professor/6_task.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: sim (10 fotos lidas: computador 1 e 2, celular 1 a 3, aba "Na turma" no computador e no celular, e a tela vazia no computador e no celular; a "cheia" e a "vazia" estão cobertas). Fotei só o que veio no prompt. Não consegui ver o painel de versões adaptadas nem o diálogo de aplicar, que ficam fora das fotos.

Estados: ok.
- Carregando: `EstadoCarregando` com o voltar à vista (`Artefato.tsx:128-130`).
- Erro: `EstadoErro` com "Tentar de novo" (`Artefato.tsx:134`).
- Vazio: documento de outra turma, de outra escola ou inexistente mostra a mesma tela e diz o próximo passo ("O que você gerou está em Criados"). A foto confirma.
- Com dado: as fotos confirmam.

Acessibilidade: ok pelo código.
- As abas seguem o padrão ARIA, com setas, uma parada no Tab e sublinhado além da cor.
- O interruptor "Gabarito" é `role=switch` e tem rótulo.
- O gabarito aparece em texto e em ícone, não só em cor.
- A folha tem `aria-label`.
- O foco volta ao botão "Renomear" depois de salvar ou cancelar.
- O contraste nas fotos é bom.

Chromebook fraco: sem peso novo. A aba escondida não monta o que não está à vista (as leituras de versões e de turma só rodam com a aba aberta). Não há lista longa que precise de virtualização: são 4 questões, ou 10 a 20 num documento real.

Celular: ok nas fotos de 360 px. Não vi rolagem de lado nem texto cortado. A folha fica sem mesa e sem borda, como o mockup manda. "Pedir versão adaptada" e "Exportar em PDF" têm cerca de 44 px, e o voltar e o interruptor também. As abas quebram em duas linhas e as três continuam à vista.
- A barra de baixo cobrindo o fim do cartão em "Na turma" é efeito da foto de página inteira. O e2e "o último botão fica acima da barra" é quem prova isso, e não o reprovei.

Ação oficial protegida: sim.
- "Aplicar à turma" continua um ato à parte, com "é avaliativa?" e o efeito dito antes.
- "Encerrar a atividade" mostra atividade, turma e quantos já enviaram, mais o efeito, antes de confirmar. O envio é único.
- A versão adaptada só se decide na tela do Assistente. Aqui a linha diz "só pode ir aos alunos depois que você aprovar".
- A assinatura "IA" está acima das abas, à vista em todas.

Bloqueantes:

1. A página do documento rola inteira a 1366 × 768, e o mockup diz que só a mesa rola.
   - Evidência: `Rolam a 1366 × 768` lista o documento aberto com 1994 px. A foto `professora--professor-criados--link-name-lista-sintética--computador-1.png` mostra o cabeçalho, as abas e o interruptor saindo junto com a página. Em `computador-2.png` a página termina em "Fontes (4)".
   - O que o mockup cita: `tasks/prd-telas-do-professor/mockup.md:277` (10.2) diz "tipo Documento (cabeçalho em 1080, mesa de ponta a ponta, folha de 760; **a página não rola, rola a mesa**)". Isso vale também para `docs/interface.md` R10 e para o RF22 do PRD ("cabe em 1366 × 768").
   - Onde está: `Artefato.tsx:263` (`<Abas … >` sem `classeDoPainel`) e `Folha.tsx:23` (a mesa sem altura nem `overflow`). Nada na tarefa declara isso como desvio: `techspec.md` §9 só trata o celular, e o e2e "a folha e a página" não mede altura nenhuma.
   - Correção exigida:
     - Do `md` para cima, o cabeçalho e as abas ficam parados e só o painel da aba, ou a mesa, rola por dentro. O exemplo é `O_MIOLO_QUE_ROLA` (`areas/coordenacao/miolo-que-rola.ts:13`), que o painel de `Abas` aceita. Mova a constante para um lugar comum em vez de importar de `coordenacao/`, ou crie a equivalente do documento.
     - No celular a página continua rolando inteira, como `docs/interface.md` já diz.
     - O cabeçalho de hoje ocupa cerca de 370 px dos 768 (voltar, título, linha de dados, ações, assinatura da IA, abas). Confira que a mesa fica com altura útil. Se não ficar, compacte o cabeçalho (por exemplo, assinatura e linha de dados na mesma linha). Não escolha o desvio sem registrá-lo na spec.
     - Acrescente ao e2e "a folha e a página" a asserção de que, a 1366 × 768, `document.scrollingElement.scrollHeight` não passa da janela e a mesa tem `scrollHeight > clientHeight`. Acrescente também uma mutação que remova a classe de rolagem.
   - O painel já é uma região com nome e `tabIndex=0`, então o teclado alcança a rolagem.

Recomendações (não bloqueiam):
- A palavra "artefato" aparece na tela vazia (`Artefato.tsx:132`, título "Artefato", "Este artefato não está disponível"). O mockup diz "Este documento não existe mais" e a tarefa chama tudo de "documento". O termo está no glossário, então não bloqueia pela regra 60. Troque por "documento" aqui e em `ResultadoDaFerramenta.tsx:47` ("Abrir o artefato"), na tarefa que a tocar.
- O "Voltar para Criados" perde os filtros que a lista guarda no endereço, e o mockup diz "com os filtros que estavam". Devolva a lista com a mesma busca, ou volte pelo histórico quando a origem for Criados.
- A faixa de 768 a 1023 px não foi fotografada. Com a lateral aberta, mesa `p-8` + folha `p-10` + cartão da questão `p-4` deixam cerca de 270 px para o enunciado, ao lado da miniatura de 160 px. Considere `md:p-5 lg:p-10` na folha e miniatura abaixo do enunciado até `lg`.
- A 360 px, três ações empilhadas (Renomear, Exportar, Pedir versão adaptada) empurram a primeira questão para a altura do fim da janela. O mockup agrupa as raras no "⋯"; vale para a X3 ou o F7.
- No celular, "Na turma" cai sozinha na segunda linha das abas. Funciona, mas o mockup tem abas roláveis. É escolha já feita no componente `Abas`, e pode ficar como está.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Artefato.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Folha.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/coordenacao/miolo-que-rola.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-artefato.spec.ts`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-19 09:52:38 · `tasks/prd-telas-do-professor/6_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Estados:** carregando; erro com "Tentar de novo"; documento de outra turma, de outra escola e inexistente com a mesma tela; com dado.
- **Aba pelo endereço:** `?aba=turma`, `?aba=xyz`, e trocar de aba com `replace`.
- **Versões:** a aba das versões só existe com versão; a aba Na turma só na atividade objetiva.
- **Exportar:** a rejeitada não exporta, a pendente sai como rascunho, a aprovada sai limpa.
- **Pendente:** a versão adaptada nasce pendente, sem aplicar, e o original continua aplicável.
- **Aplicar e encerrar:** a pergunta "é avaliativa?", o efeito dito antes e o pedido único no clique duplo.
- **Folha:** 760 px sobre a mesa no computador, sem mesa e sem borda a 360 px, a página de cada questão, nada rolando de lado, o último botão acima da barra.
- **Gabarito:** ligado de início; desligado tira a marca da certa e a explicação; o padrão da `ConteudoDoArtefato` não muda.
- **Renomear:** o foco volta ao botão.
- **Recomeço:** recarregar mantém a aba; a segunda pessoa não vê o documento; a sessão vencida devolve o texto digitado.
- **Isolamento:** o documento de outra escola e o inexistente dão a mesma tela, contra a API real.
- **Peça extraída `EncerramentoDaAtividade`:** só a aberta tem o botão; o envio único com dois cliques no mesmo instante; a falha; a releitura antes de fechar.
- **"Corrigir de novo":** com mutation própria, mostra a própria falha.
- **Navegação:** o documento aberto acende Criados.

**Cobertos:**
- **Todos os cenários acima** têm teste com asserção sobre o resultado.
- **Concorrência de verdade:** os dois `confirmar.click()` rodam dentro do mesmo `act`, antes de a tela redesenhar (`EncerramentoDaAtividade.test.tsx:99-104`).
- **Isolamento contra a API real:** escola vizinha criada no banco e artefato inexistente (`e2e/professor-artefato.spec.ts:258`).
- **Segunda professora:** a tela não mostra o documento e o cache não guarda o título (`:288`).
- **Os 23 blocos de mutação** batem com as cláusulas do diff, e conferi um a um que o teste citado chega à cláusula. Exemplos: a seção "Na turma" é testada como região que não monta em `?aba=versoes`; há dois alertas quando falta a condição `aberto === undefined`; o diálogo continua aberto enquanto a lista é relida.
- **Execução:** `npx vitest run` nos três arquivos de unidade passou com 30 testes.
- Sem `.skip`, sem teste comentado, sem mock que esconda a regra. Nenhum teste chama IA.

**Bloqueantes:**
1. **O efeito que devolve o foco no renomear não tem bloco de mutação.** Em `apps/web/src/areas/professor/Artefato.tsx:95-103`, o `focoPendente` e o `useEffect` com a condição `novoTitulo !== undefined || !focoPendente.current` são código novo desta tarefa: trocaram o `requestAnimationFrame` de antes. O comportamento é um cenário declarado da tarefa ("renomear devolve o foco ao botão"), e a asserção `toBeFocused()` também é nova (`e2e/professor-artefato.spec.ts:78`). Cláusula nova sem bloco é bloqueante por si.
   - **Correção exigida:** declarar o bloco abaixo na seção Mutações.
     ```mutacao
     arquivo: apps/web/src/areas/professor/Artefato.tsx
     teste: e2e/professor-artefato.spec.ts › os quatro estados; a atividade com gabarito, explicação e a página de cada questão; renomear; exportar em PDF; pedir versão adaptada; e a versão com quem aprovou
     -    botaoDeRenomear.current?.focus()
     +    void 0
     ```
   - **Alternativa mais barata:** um caso de componente em `Artefato.test.tsx` (o jsdom acompanha o foco) que salve e cancele o renomear e confira `document.activeElement`. Esse caso cobriria também o caminho do Cancelar, que hoje não tem asserção nenhuma.

**Recomendações:**
- **Nome de teste:** em `Artefato.test.tsx:334` o nome promete "a decisão fica à vista também nas outras abas da própria versão", mas o caso só abre a origem em `?aba=versoes`. Quem prova isso é o teste da `:316` (o `data-aprovacao="pendente"` em `?aba=turma`). Ajustar o nome ou incluir a asserção.
- **Outra turma:** o cenário "outra turma" do componente (`Artefato.test.tsx:162-178`) é trivial, porque a rede falsa responde 404 igual para os três ids. O e2e cobre outra escola e inexistente, mas não outra turma da mesma escola. Vale apontar, no próprio comentário, o teste de integração da API que prova esse caso.
- **Borda no celular:** a ausência de borda abaixo de 768 px, que é divergência declarada, tem asserção no e2e (`borda 0px`) mas nenhum bloco. Sugestão: o bloco `md:border-2` → `border-2` com `projeto: celular`.
- **Clique duplo em aplicar:** o `dblclick` do Playwright em "Aplicar à turma" (`e2e/professor-aplicacao.spec.ts:78`) pode cair no botão já desligado e assim não prova a trava `decidindo` do aplicar. A trava é anterior a esta tarefa; um caso de componente com dois cliques dentro do mesmo `act`, como o do encerrar, fecharia isso.
- **Contagem no teste da sessão vencida:** o `pedidosEm(/artefatos\/[^/]+$/)` (`e2e/professor-artefato.spec.ts:255`) conta também os GET do artefato. Filtrar por `metodo === 'PATCH'` deixa a asserção "o pedido que falhou não é repetido" falar só do pedido certo.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/6_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Artefato.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Artefato.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/EncerramentoDaAtividade.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/EncerramentoDaAtividade.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Folha.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-artefato.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-aplicacao.spec.ts`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-19 09:52:50 · `tasks/prd-telas-do-professor/6_task.md`

VEREDITO: REPROVADO

Escopo: respeitado. A tarefa fez o que a 6.1, a 6.2 e a 6.3 pedem e não entra na 7.0 nem na 11.0, que só vai usar `EncerramentoDaAtividade`.

Aderência à Tech Spec: há duas divergências registradas só no `6_task.md`, nas linhas 85 e 86, e não na `techspec.md`.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade e alvo).

**Bloqueantes**

1. **`tasks/prd-telas-do-professor/6_task.md:86`:** a divergência "o artefato aberto acende Criados" diz que está registrada em "`techspec.md` §9 (O documento aberto)", mas não está.
   - O parágrafo "O documento aberto", nas linhas 190 a 198 da `techspec.md`, tem os itens (1) a (6), e nenhum fala da navegação.
   - A §2 da `techspec.md` (linha 20) também não fala nisso. Ela só descreve a mudança em `navegacao.ts` como "o sino; os quatro lugares; 'Seu time' sai".
   - A mudança, em `apps/web/src/areas/navegacao.ts:67-68`, troca o comportamento da navegação: `tambemEm` sai de Ferramentas e passa para Criados. Também leva a recarga do "recomeço" para dentro de um caso de e2e que já existia.
   - O aviso que existia no comentário do HEAD, e o `mockup.md` 10.2, não substituem a Tech Spec.
   - **Correção exigida:** pôr na §9 da `techspec.md` o item (7), com o artefato aberto acendendo Criados e a recarga feita dentro do caso lento.

2. **`tasks/prd-telas-do-professor/6_task.md:85`:** a divergência "os casos novos de e2e de recomeço entram pela API (`entrarEmCriados`, `entrarPelaApi`)" diz que está em "`techspec.md` §10 (duração do e2e)", mas não está.
   - A §10 (linhas 232 a 249) só registra a régua da 2.0 e o lugar do recomeço da 4.0. A escolha da 6.0 não aparece.
   - **Correção exigida, uma das duas:**
     - acrescentar à §10 a linha da 6.0, no formato da linha da 4.0;
     - ou tirar a linha da tabela de divergências, se a entrada pela API não contradiz nada que a Tech Spec diga.

**Recomendações**

- A mesma sequência, `recarregarAtividades(cliente)` seguida de `await cliente.invalidateQueries(consultaAtividadesAplicadas(turmaId))`, agora aparece três vezes:
  - em `AplicacaoDoArtefato.tsx:63-65`;
  - em `AplicacaoDoArtefato.tsx:73-75`;
  - em `EncerramentoDaAtividade.tsx:363-364`.

  Antes ela estava num só lugar (`aoTerminar`). Vale pôr uma função em `api/atividades.ts`, para a 11.0 não fazer uma quarta cópia.
- Na foto `professora--professor-criados--link-name-lista-sintética--computador-1.png`, o interruptor "Gabarito" fica numa linha só dele, entre as abas e a mesa. O `mockup.md` 10.2 põe o interruptor na ponta direita da linha das abas. Não fere regra, é uma linha a menos de rolagem a 1366 × 768. Fica para o `frontend-reviewer`.
- Em `docs/roteiro-da-demonstracao.md`, seção da segunda pessoa, passo 5 ("Marta → Encerrar a atividade"): a ordem está certa, porque ela já está na aba Na turma. Para ficar igual aos passos 3 e 4, vale escrever "aba **Na turma**" também ali.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/6_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/navegacao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/AplicacaoDoArtefato.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/EncerramentoDaAtividade.tsx`

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-19 10:42:35 · `tasks/prd-telas-do-professor/6_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. Esta rodada só muda a tela do documento: o cabeçalho, o painel da aba que rola sozinho e o foco depois de renomear. Nenhum serviço, job, seed ou importação foi tocado. Todos com autor humano? sim (nada mudou).
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok
Supervisão do tutor: ok (fora do escopo; nada mudou)
Autonomia declarada e visível: sim (sem mudança nesta rodada)

**O que conferi no diff**

- **Assinatura da IA à vista em toda aba.** `<AssinaturaIA funcao={funcao} />` saiu da linha do título e agora divide a linha com as ações (`apps/web/src/areas/professor/Artefato.tsx:210-228`). Continua fora do `<Abas>`, que começa em `:261-262`. Nas fotos ela aparece igual nas abas "Conteúdo" e "Na turma", no computador e no celular. Isso vale para "Assistente · conversa e ferramentas" e para "Assistente · adaptação", ambos com o selo IA.
- **Situação da versão adaptada à vista em toda aba.** Continuam acima das abas (`Artefato.tsx:229-258`) a adaptação, a linha da versão, o texto "Esta versão só pode ir aos alunos depois que você aprovar. Ver e decidir", o aviso de rascunho no PDF, o texto de quando não há PDF e o link para a origem. Na foto `professora--professor-criados--link-name-adaptada-i--computador.png`, e nas três do celular, aparecem "Esperando você", o "Ver e decidir" e "Exportar rascunho em PDF", tudo antes das abas. A página parada e o painel que rola não escondem nada disso: só o painel rola, e o cabeçalho fica fixo.
- **Item 3 (aprovação antes do aluno).** A versão pendente não oferece "Aplicar à turma". O teste renomeado (`Artefato.test.tsx:319`) abre `aba=turma` da própria versão e cobra três coisas: o aviso, o `data-aprovacao="pendente"` e a falta do botão. A mutação nova em `tasks/prd-telas-do-professor/6_task.md`, que deixa a `LinhaDaVersao` só na aba "Conteúdo", quebra esse teste. Era a recomendação 2 da 1ª rodada, e está feita.
- **Item 6 (auditoria).** A rodada não mexe em entrega, aprovação nem auditoria. A linha "Aprovada por <nome>" continua coberta (`Artefato.test.tsx:316`).
- **Recomendações da 1ª rodada.** As três foram feitas: o nome do teste, a mutação e a foto de uma versão adaptada aberta (pendente).
- **Itens 7, 8 e 9.** Nada de nota, conceito ou sugestão de nota. Nenhuma medição do professor ou do aluno. A tela vazia (`vazia--…--computador.png`) tem o mesmo texto para todos os casos e não diz se o documento existe.

Bloqueantes: nenhum

Recomendações:
- Não há foto da versão adaptada pendente na aba "Na turma", nem de uma versão rejeitada aberta. O teste de componente e o e2e (`e2e/professor-artefato.spec.ts:105-124`) já cobrem os dois casos. Uma foto deles na próxima vitrine mostraria o aviso "só pode ser aplicada depois que você aprovar" como a professora o recebe.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Artefato.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/miolo-do-documento.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Artefato.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/6_task.md

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-19 10:42:35 · `tasks/prd-telas-do-professor/6_task.md`

VEREDITO: APROVADO

Tela vista: sim (28 fotos lidas, cheia e vazia: documento no computador e a 360 px em pedaços, aba "Na turma" nos dois, versão adaptada pendente nos dois, documento inexistente na escola vazia nos dois)
Estados: ok. Carregando e erro foram conferidos pelo código e pelo e2e; com dado e vazio, pelas fotos. A tela vazia diz o que fazer ("O que você gerou está em Criados") e traz o "Voltar para Criados".
Acessibilidade: ok. O painel que agora rola (`componentes/Abas.tsx:92`) mantém `tabIndex={0}`, então o teclado alcança a rolagem. Os rótulos e o foco que volta ao "Renomear" têm teste novo em `Artefato.test.tsx`.
Chromebook fraco: ok. A rolagem por dentro vale só do `md` para cima. O `ResizeObserver` mede o topo do painel, em vez de somar `rem`.
Celular: ok. A 360 px a página rola inteira, sem mesa nem borda, e não há rolagem horizontal. A ação principal tem 44 px e "Renomear" fica acima de 24 px.
Ação oficial protegida: sim. A decisão da versão adaptada fica acima das abas ("Esperando você", "Ver e decidir"), e "Aplicar à turma" não existe enquanto a versão está pendente.

Correção exigida da rodada 1: feita.
- A 1366 × 768 a página não rola. A foto do documento mostra o cabeçalho e as abas parados, e a mesa cortada na borda da janela, rolando por dentro. A lista "Rolam a 1366 × 768" veio vazia.
- As ações saíram da linha do título para a da assinatura da IA (`Artefato.tsx:208-227`). O desvio está registrado em `techspec.md` §9, item 8, e em `6_task.md`.
- O e2e "a folha e a página" (`e2e/professor-artefato.spec.ts:188-198`) agora afirma três coisas: `paginaNaoRola`, o painel com `scrollHeight > clientHeight`, e as abas que não mudam de `y` com a mesa rolada.
- `paginaNaoRola` também entrou nos casos da versão rejeitada e da aprovada, que têm o cabeçalho mais alto.
- A mutação que remove a classe de rolagem foi acrescentada a `6_task.md`, apontando para esse caso do e2e.

Bloqueantes: nenhum

Recomendações (não bloqueiam):
1. A mesa da versão adaptada pendente fica baixa a 1366 × 768. Na foto `professora--professor-criados--link-name-adaptada-i--computador.png` o painel começa perto de 520 px e a folha tem uns 150 px de altura útil, já descontado o "Gabarito". É a tela da decisão oficial. O cabeçalho repete a ideia em duas linhas: "Esta versão só pode ir aos alunos depois que você aprovar. Ver e decidir" e "Esta versão ainda espera a sua decisão: o PDF sai marcado como rascunho…". Juntar as duas, e levar "Abrir a atividade de origem" para a linha do "Voltar", devolve uns 50 px à mesa. A origem do cabeçalho está em `Artefato.tsx` e `LinhaDaVersao`. Acrescentar ao e2e uma altura mínima do painel na versão pendente, por exemplo 200 px, evitaria que a mesa encolha de novo sem aviso.
2. Na aba "Na turma" do original, "Pedir versão adaptada" (laranja) e "Aplicar à turma" (escuro) são dois botões cheios de peso parecido. O mockup tem um só botão cheio por vez.
3. A tela vazia diz "Artefato", e o glossário e o mockup dizem "documento". As recomendações do `frontend-reviewer` que já foram para o `TODO.md` seguem valendo.

Arquivos relevantes (caminhos absolutos):
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Artefato.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/miolo-do-documento.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-artefato.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/techspec.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 10:42:45 · `tasks/prd-telas-do-professor/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)

Bloqueantes: nenhum.

As duas correções da 1ª rodada foram feitas:
1. **Artefato aberto acende Criados.** O item (7) agora está na §9 ("O documento aberto") de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/techspec.md`. Ele diz que `tambemEm` passa de Ferramentas para Criados e que a recarga fica dentro do caso lento que já existia, com o motivo. A linha 86 do `6_task.md` aponta para esse item.
2. **Casos novos de recomeço entram pela API.** A linha da 6.0 foi acrescentada à §10, no formato da linha da 4.0. Ela nomeia `entrarEmCriados` e `entrarPelaApi`, diz o caso que mora no caso lento e dá o motivo de duração.

**A página não rola, rola a mesa** (`miolo-do-documento.ts`): está registrada no item (8) da §9 da Tech Spec e na linha 87 do `6_task.md`. Os dois dizem que as ações saem da linha do título para a da assinatura e por que a altura é medida em vez de somada em `rem`. Não existe `cenarios.md` nesta spec, então não há o que conferir nele.
- Usa a prop `classeDoPainel` que o componente `Abas` já tinha (`apps/web/src/componentes/Abas.tsx:24`), sem mexer em componente compartilhado.
- A prova está em `e2e/professor-artefato.spec.ts`: `paginaNaoRola`, o painel com mais conteúdo do que mostra e as abas paradas enquanto a mesa rola. Os casos da versão rejeitada e da aprovada também chamam `paginaNaoRola`.
- A mutação que tira o `max-h` está declarada.

A mudança de onde ficam as ações (Renomear, PDF, Pedir versão adaptada) não altera a regra 70. A decisão da versão continua acima das abas, e "Aplicar à turma" continua só na aba Na turma.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Artefato.tsx:214-226`: o bloco das ações tem dois espaços a mais de recuo em relação ao `<div>` que o contém. O código funciona, mas o recuo fica fora do padrão do resto do arquivo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/miolo-do-documento.ts:243`: os `2.5rem` do `calc` (32 px de margem do `main` mais 8 px de folga) só estão explicados no comentário. Se a margem do `main` mudar, o valor fica errado sem aviso. O `paginaNaoRola` pega esse caso no e2e, então não bloqueia.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-19 10:43:00 · `tasks/prd-telas-do-professor/6_task.md`

VEREDITO: REPROVADO

Cenários exigidos (para a correção desta rodada e o que ela afeta):
- O foco volta ao "Renomear" depois de salvar e depois de cancelar (regra 50, item 11).
- A página não rola a 1366 × 768, e só o painel da aba rola por dentro. Isso vale para a atividade sem versão e para a versão adaptada, pendente ou rejeitada, que tem o cabeçalho mais alto.
- Abaixo de 768 px a página rola inteira e nada rola de lado.
- O contador de PATCH do recomeço da sessão vencida conta só o renomear.
- Isolamento: o documento de outra turma, o de outra escola e o que não existe mostram a mesma tela.

Cobertos:
- **Correção da 1ª rodada feita.** O caso novo `Artefato.test.tsx` "o foco volta ao botão "Renomear" ao salvar e ao cancelar" cobre os dois caminhos e confere `document.activeElement`. O bloco declarado troca `botaoDeRenomear.current?.focus()` por `void 0`, e o caso fica vermelho com ele: os dois caminhos fecham o formulário com o foco dentro, e o foco cairia no `body`. O caso também confere que sai um PATCH só. Rodei o arquivo e os 16 casos passam.
- **Cabeçalho parado e painel que rola.** O caso "a folha e a página", a partir de 768 px, chama `paginaNaoRola`, exige `scrollHeight - clientHeight > 0` no painel e confere que as abas não saem do lugar quando a mesa rola. O bloco sobre `O_MIOLO_DO_DOCUMENTO` (sem `max-h`) deixa o caso vermelho por dois motivos: o painel deixa de rolar e a página passa a rolar.
- **Versões adaptadas.** `paginaNaoRola` agora também roda na rejeitada e na aprovada, dentro de "os quatro estados".
- **Filtro de PATCH** nos dois pontos do recomeço da sessão vencida, e o comentário que leva o isolamento por API ao `artefato.int.test.ts`.
- **Novos blocos de mutação** para a linha da versão em todas as abas e para a borda da `Folha` no celular.

Bloqueantes:
1. `apps/web/src/areas/professor/miolo-do-documento.ts:258`, a linha `no.style.setProperty('--topo-do-painel', ...)`, é código novo e não tem bloco de mutação. O hook `useTopoDoPainel` existe porque o cabeçalho muda de altura com o que a versão adaptada diz. Sem essa linha, vale o padrão fixo de `24.5rem` da string. O único bloco do arquivo tira o `max-h` inteiro, então não chega a esta cláusula: nada mostra que algum teste fica vermelho se a altura deixar de ser medida. Pela regra, cláusula nova sem bloco bloqueia por si só.
   - Correção exigida: declarar em `6_task.md` um bloco que troque essa linha por `void 0`, com `teste: e2e/professor-artefato.spec.ts › os quatro estados` e `projeto: chromebook`. O `paginaNaoRola` da versão rejeitada é o cenário cujo cabeçalho passa dos 24,5rem.
   - Se o bloco não ficar vermelho, falta um cenário em que o cabeçalho é mais alto que o padrão e o painel está cheio, e esse cenário precisa ser escrito.

Recomendações:
- `e2e/professor-artefato.spec.ts:326`: `toBe(antes?.y)` passa com `undefined === undefined` se as duas medidas voltarem nulas. Afirmar antes que `antes` existe (`expect(antes).not.toBeNull()`).
- A segunda medida do `useTopoDoPainel` (o `ResizeObserver` sobre `[data-tela]`, quando a leitura das entregas acrescenta linhas acima das abas) não tem bloco nem caso que a separe da primeira medida. Vale um bloco que tire o `vigia?.observe(...)`, contra a versão pendente que espera a leitura das entregas, se o e2e conseguir mostrar a diferença.
- A guarda `!focoPendente.current` em `Artefato.tsx:101` impede que o foco vá ao "Renomear" quando a tela abre. Nenhum caso confere que o foco não é roubado ao montar. Basta uma linha no caso novo, antes do primeiro clique: `expect(document.activeElement).not.toBe(botao)`.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-19 12:19:48 · `tasks/prd-telas-do-professor/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (o `conferir` aceita typecheck, lint, segredo, dependências, unidade e alvo para a árvore atual)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-artefato.spec.ts:99`: o comentário diz em uma linha só duas coisas diferentes, por que a origem abre com o botão na tela (o cache) e quando o foco volta ao "Renomear". Separe em duas frases ou corte a do cache, que é detalhe de quando a tela mostra o botão e não do que o teste prova.
- As duas recomendações da 2ª rodada (o recuo do bloco das ações e a explicação dos `2.5rem`) foram registradas em "Recomendações sem aplicar", com destino. Não tenho nada a acrescentar.

Esta rodada só mudou o e2e e os três blocos de mutação do `6_task.md`; nenhum código de produção mudou. Conferi que as três mutações apontam para linhas que existem hoje: `miolo-do-documento.ts:31` e `:35`, e `Artefato.tsx:101`. Também conferi que os testes citados, "os quatro estados" e "a folha e a página", existem em `e2e/professor-artefato.spec.ts`.

As asserções novas medem a regra:
- O "Renomear" não fica com o foco ao montar a tela, o que liga com a guarda do `focoPendente`.
- A página não rola com o formulário de renomear aberto, o que liga com a nova medida do `useTopoDoPainel`.
- As abas têm caixa antes de a mesa rolar, o que impede que o `toBe(antes?.y)` passe comparando `undefined` com `undefined`.

Se cada mutação de fato fica vermelha, quem audita é o `test-engineer`.

## test-engineer · 3ª rodada · APROVADO · 2026-10-19 12:20:37 · `tasks/prd-telas-do-professor/6_task.md`

VEREDITO: APROVADO

Cenários exigidos (para o que mudou nesta rodada):
- O painel começa onde o cabeçalho de verdade termina, quando o cabeçalho é mais alto que os 24,5rem padrão (a versão rejeitada).
- O topo do painel é medido de novo quando a tela muda depois de montar (o formulário de renomear abre acima das abas, com o painel cheio).
- O foco não é roubado ao montar a tela: ele só volta ao "Renomear" quando o formulário de renomear fecha.
- A caixa das abas existe antes de comparar a posição delas.

Cobertos:
1. Correção 1 (bloqueante): feita. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/6_task.md` há agora o bloco que troca o `setProperty('--topo-do-painel', ...)` por `void 0`, com `teste: os quatro estados` e `projeto: chromebook`. Sem a variável, o painel volta aos 24,5rem padrão, e o `paginaNaoRola` da rejeitada (`e2e/professor-artefato.spec.ts:112`) é o primeiro `paginaNaoRola` do caso. O cabeçalho da rejeitada é o mais alto e passa desse padrão, então o vermelho vem da cláusula certa.
2. Recomendação 2: feita. `e2e/professor-artefato.spec.ts:198` afirma que `antes` não é nulo antes da comparação.
3. Recomendação 3: feita, com cenário novo:
   - `e2e/professor-artefato.spec.ts:202-206` abre o renomear acima das abas com o painel cheio (a linha 195 garante que ele está cheio) e chama `paginaNaoRola`.
   - O bloco tira o `vigia?.observe(...)`. Sem ele, a medida fica velha e o painel passa da janela pela altura do formulário. É o motivo certo.
4. Recomendação 4: feita, com bloco de mutação.
   - `e2e/professor-artefato.spec.ts:100-101` abre a origem, que já está em cache, e afirma que "Renomear" não está com o foco.
   - A rota monta a tela de novo a cada id (`apps/web/src/areas/professor/rotas.tsx:60`, `key={parametros.artefatoId}`). Por isso o efeito roda na montagem já com o botão na tela.
   - A mutação que tira o `!focoPendente.current` (`Artefato.tsx:101`) põe o foco no botão ao montar, e a linha 101 do e2e falha pela razão certa.
   - O caminho de devolver o foco continua provado na linha 79.
5. O carimbo do portão (`.processo/portao.json`) é de 12:02, com 33 mutações e `professor-artefato.spec.ts` entre os alvos. Ele é anterior ao diff desta rodada (12:19).

Bloqueantes: nenhum.

Recomendações:
- O bloco do `vigia?.observe` em `6_task.md` não declara `projeto`. No projeto `celular` o trecho que prova a medida (`e2e/professor-artefato.spec.ts:191`, `largura >= 768`) não roda, e a mutação só fica vermelha no `chromebook`. Vale declarar `projeto: chromebook`, como no bloco do `setProperty`, para o motivo do vermelho ficar explícito.
- O comentário de `e2e/professor-artefato.spec.ts:99` depende de a origem continuar em cache. Se algum dia o `staleTime` ou a busca da origem mudar, o caso continua verde no código real, mas pode deixar de provar a montagem com o botão na tela. Vale um caso de componente em `Artefato.test.tsx` que monte com o dado já no cliente e afirme que o foco não está no botão. Fica para o `/retro`.

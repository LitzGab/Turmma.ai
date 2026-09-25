# Achados das revisões — `tasks/prd-apresentacao-painel/6_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-25 03:47:16 · `tasks/prd-apresentacao-painel/6_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **W6:** 30 escolas, uma com nome, rede e endereço no limite. Troca de página e de ordem, com as duas na barra de endereço. Sem rolagem horizontal a 360 px na lista e no diálogo Nova escola com a prévia `/e/<slug>`. Ações com 44 × 44 px.
- **W7:** os quatro estados da lista, com axe nos dois projetos. Página além da última. Nova escola carregando, com erro e sem rede ("Crie a rede primeiro").
- **W8:** criar rede e escola só com Tab e Enter. Foco preso no diálogo e devolvido a quem o abriu.
- **W10, unidade e e2e:** texto dos sete estados, sem identificador. `CONFLITO` do endereço no próprio campo. 429 com o N do `Retry-After`. 503 `TEMPO_ESGOTADO`. 401 no meio do diálogo leva à entrada.
- **Clique duplo:** o mesmo `id` e uma escola só.
- **Resposta perdida:** a nova tentativa manda o mesmo `id`.
- **Recomeço:** reabrir o diálogo sorteia outro `id`, e o segundo operador na mesma aba não vê a lista do primeiro.
- **Privacidade:** nenhum campo de pessoa passa pelo contrato da lista.
- **Isolamento:** não se aplica a esta tela, porque o operador vê todas as escolas e a API tem a prova dela na 5.0.

**Cobertos:**
- **W6:** página, ordem, a barra de endereço e a recarga provados. O `placeholderData` também, com a segunda página segura: sem ele o carregando apareceria e a lista sumiria. O texto de cada estado aparece na linha ou no cartão, a 360 px sem rolagem no documento, e as ações têm 44 px.
- **W7:** tudo, com axe em cada estado.
- **W8:** tudo, incluindo Shift+Tab e a rede recém-criada já escolhida (`option:checked`).
- **W10 na unidade:** `estados-da-escola.test.ts` compara com uma tabela escrita por extenso, e `textos.test.ts` cobre 429 com o N, 429 sem N, `NaN`, `TEMPO_ESGOTADO` e nenhum código na tela.
- **W10 no e2e:** o endereço repetido volta com foco, `aria-invalid` e a descrição acessível. O 429 mostra 7 segundos, o 503 de tempo esgotado tem o texto dele, e o 401 leva à entrada sem criar a escola.
- **Resposta perdida:** o `rota.fetch()` seguido do `abort` cria a escola no servidor e perde a resposta. Com um `id` novo a cada envio, a segunda tentativa voltaria `CONFLITO`, então o teste falha se a regra sair.
- **Recomeço:** o `id` muda entre aberturas e se repete dentro da mesma abertura. Com a lista do segundo operador segura no servidor, um cache que sobrasse do primeiro apareceria.
- **Contrato estrito:** `painel.test.ts` recusa a resposta com um campo de pessoa a mais.
- **Pedido:** o pedido sai sem os espaços das pontas, e o endereço fora da regra é recusado no limite de 63.
- Nenhum `.skip`, `.only` ou teste comentado. Nenhuma IA envolvida.

**Bloqueantes:**

1. **A medida de largura dentro do diálogo não enxerga o diálogo.**
   - **Onde:** `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-escolas.spec.ts:180`, e da mesma forma em `:258`, `:268` e `:515`.
   - **O que está errado:** `larguraExcedente(page)` mede `document.documentElement.scrollWidth - clientWidth`. O `<dialog>` aberto com `showModal()` fica na camada de cima com `position: fixed`, e o que transborda dele não aumenta a largura do documento. Como o diálogo tem `overflow-y-auto`, o transbordo vira rolagem horizontal dentro dele, invisível para essa medida.
   - **Como conferi:** montei no Chromium do Playwright, a 360 px, um diálogo modal com a mesma largura (`min(32rem, 100% - 2rem)`) e um conteúdo de 900 px. O resultado foi `{"doc":0,"dlgScroll":932,"dlgClient":354}`: o documento não excede, e o diálogo rola 578 px.
   - **Consequência:** a parte do W6 "no diálogo Nova escola com a prévia `/e/<slug>`" não tem teste que a prove. Tirar o `wrap-anywhere` da prévia em `NovaEscola.tsx:338`, ou do endereço completo na revisão em `:250`, deixa o teste verde.
   - **Correção exigida:**
     - Medir o diálogo aberto, por exemplo `noDialogo(page).evaluate((d) => d.scrollWidth - d.clientWidth)` igual a 0, num auxiliar em `e2e/__fixtures__/verificacoes.ts`.
     - Usar essa medida em `:180`, com o endereço de 63 caracteres.
     - Medir também o passo de revisão ("Confira antes de criar"), com o mesmo endereço e com a rede de 200 caracteres do seed escolhida, porque o W6 pede a rede longa.
     - Trocar pela mesma medida em `:258`, `:268` e `:515`.

**Recomendações:**

1. **Clique duplo** (`operacao-escolas.spec.ts:392-396`):
   - `duplos.length >= 1` aceita um envio só. Na prática o botão desabilita entre os dois cliques, então o trecho prova "uma escola", mas não "os dois cliques mandam o mesmo `id`". O mesmo `id` já está provado pela resposta perdida.
   - Para ficar determinístico: segurar o primeiro POST e afirmar exatamente um envio enquanto o primeiro está pendente.
   - O cenário diz "a lista mostra uma escola", e o teste confere o banco. Conferir também a lista na tela.

2. **Depois do `CONFLITO` do endereço, corrigir e criar** (`:520` em diante): nenhum teste mostra que, trocando o endereço, o "Criar escola" conclui com o mesmo `id`. A continuação hoje é toda de rotas simuladas (429, 503) e termina no 401. É o passo seguinte natural do texto "Escolha outro".

3. **Possível defeito de borda, para o `revisor-geral` avaliar:**
   - **O caminho:** a resposta se perde depois de o servidor já ter criado a escola. O operador clica em "Voltar e corrigir" e troca o endereço. A tela reenvia o mesmo `id` com outros dados.
   - **O que acontece:** o servidor responde `CONFLITO` (Tech Spec 7c: mesmo `id` com outros dados). O `ehEnderecoRepetido` lê isso como "Esse endereço já é de outra escola", mesmo com o endereço livre, e todo endereço novo falha nesse diálogo.
   - **O risco:** o operador fecha, reabre, e cria uma segunda escola ao lado da primeira.
   - **Onde:** `NovaEscola.tsx:155-159` e `textos.ts` (`ehEnderecoRepetido`).

4. **O `/eu` e a lista carregam juntos:** esta é uma divergência que subiu para a Tech Spec, e nenhum teste a prova. Um e2e com o `/eu` segurado ou em 503, afirmando que a lista aparece embaixo, deixaria vermelho quem voltar a esperar o `/eu`.

5. **`e2e/operacao.spec.ts:129`:** `main not.toContainText(ana.nome)` não falha nunca, porque a área principal não mostra nome de operador. Virou enfeite depois da troca pelo `apelido`. A prova de verdade está no teste de recomeço do spec novo, então dá para remover ou apontar para ele.

6. **Limpeza do banco de teste:** as redes e escolas criadas pela tela no W8, no clique duplo, no W10 e no `criarRedeDoPainel` não são apagadas. Já é o que obriga o truque do nome que vem primeiro para escapar do corte em 200 do `GET /redes`. Vale apagar pelo endereço e pelo nome no `afterEach`.

7. **A trava de foco só é exercitada no Nova rede.** O componente é o mesmo, mas um laço curto de Tab no Nova escola, no passo de revisão com "Voltar e corrigir", custa pouco.

Não editei nenhum arquivo do projeto. A sonda de largura rodou num arquivo temporário na raiz, apagado em seguida, e o `git status` ficou igual ao do início.

## test-engineer · 2ª rodada · REPROVADO · 2026-09-25 04:20:49 · `tasks/prd-apresentacao-painel/6_task.md`

VEREDITO: REPROVADO

**Cenários exigidos (2ª rodada):**
- A correção exigida na 1ª rodada: medir o próprio diálogo, com o endereço de 63 caracteres, nos passos de preencher e de revisão, com a rede de 200 do seed, e nos pontos de W7 e W10.
- O que o diff muda:
  - o `CONFLITO` depois de uma tentativa incerta;
  - o `noAr` contra clique duplo em Nova escola e Nova rede;
  - W10 concluindo com o mesmo id;
  - o laço de Tab na revisão;
  - E2 com a tela embaixo do 503.

**Cobertos:**
- `larguraExcedenteDoDialogo` (em `e2e/__fixtures__/verificacoes.ts:43`) está certo. O diálogo tem `overflow-y-auto`, o que deixa o eixo horizontal em `auto`, e o `scrollWidth` dele enxerga o que transborda.
- A medida é usada nos dois passos do W6 (`:184`, `:191`), no W7 (`:271`, `:282`) e no W10 (`:598`).
- A tentativa incerta tem unidade em `textos.test.ts` e e2e. O e2e falharia sem a regra, porque sem ela a tela mostraria "endereço repetido" no campo e sairia da revisão.
- O clique duplo com o primeiro POST segurado conta um pedido só nos dois diálogos. A contagem final depois de soltar o pedido pega um segundo POST que chegue atrasado.
- W10: o 429 e o 503 são respondidos pelo teste, e os dois pedidos que chegam ao servidor têm o mesmo id.
- W8: o foco fica preso também na revisão.
- E2: a tela de Escolas aparece embaixo do erro do `/eu`.
- Sem `.skip`, `.only` nem `fixme`.

**Bloqueantes:**

1. **`e2e/operacao-escolas.spec.ts:179`: o endereço longo não prova que a tela não rola na horizontal.** Hoje ele é `${'e'.repeat(30)}-${'f'.repeat(32)}`. O hífen é ponto de quebra de linha normal, e cada metade cabe sozinha nos 288 px úteis do diálogo a 360 px. Assim, tirar o `wrap-anywhere` de `NovaEscola.tsx:172` (o `dd` da revisão) e de `:263` (a prévia) não faz nenhuma das asserções de `:184`/`:185` e `:191`/`:192` falhar.
   - Reproduzi num Chromium a 360 × 800, com a mesma largura, o mesmo padding e a mesma fonte:

     | Endereço | com `anywhere` | com `normal` |
     |---|---|---|
     | com hífen (o atual) | 0 px | 0 px |
     | 63 letras seguidas | 0 px | 224 px |

   - O documento dá 0 px nos quatro casos.
   - **Correção exigida:** usar um endereço de 63 caracteres sem hífen, que é válido pela regra do contrato (só letras e números), por exemplo `'e'.repeat(63)`. Não há problema de unicidade, porque o W6 só revisa e não cria. Conferir que o teste fica vermelho quando se tira o `wrap-anywhere` da linha 172 e da 263.

**Recomendações (não bloqueiam):**
- `:376` e `:377`: o `click({ force: true })` no botão "Criando…" desabilitado não prova o `noAr`, porque o navegador não dispara clique em botão desabilitado. Quem prova o `noAr` é o `dblclick`. Tirar essa linha ou reescrever o comentário.
- A rede de 200 e o nome de 200 feitos por `esticar` têm espaços e quebram sozinhos, então o `wrap-anywhere` do `dd` da rede e do nome (`NovaEscola.tsx:164`, `:168`) também não é provado. Um nome sem espaço é raro na vida real, por isso fica como cobertura extra.
- O mesmo vale para a lista (`:119` a `:122`): o endereço de `painel.longa` tem hífens (`painel-<uuid>-00-xxx…`), e a medida do documento ali também não enxergaria a falta do `wrap-anywhere`. Fora do diff desta rodada, fica registrado para o `/validar`.
- Registrar como decisão consciente que a tentativa incerta mostra o texto de "conferir a lista" também quando o operador muda para um endereço que de fato é de outra escola. É conservador e aceitável, mas não está escrito nas divergências.

A reprodução está em `/tmp/claude-1000/-home-joaquimdp-Documentos-git-Educa-ia/280e0d44-07e4-4701-b130-454ce6b1c622/scratchpad/exp.mjs`. Não editei nenhum arquivo do repositório.

## test-engineer · 3ª rodada · APROVADO · 2026-09-25 04:35:22 · `tasks/prd-apresentacao-painel/6_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** são os mesmos das rodadas anteriores da tarefa 6.0. Nesta rodada o foco é o W6: a lista e o diálogo Nova escola a 360 px, com o endereço no tamanho máximo, sem largura sobrando para fora da tela.

**Cobertos:** a correção exigida na 2ª rodada foi feita.

- **O teste agora falharia sem a regra.** Em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-escolas.spec.ts:179`, o endereço de teste passou a ser `'e'.repeat(63)`, ou seja, 63 letras sem hífen. Com o endereço completo (`host/e/` mais essas 63 letras), a única pausa possível é depois da `/`. Sobra um bloco de 63 caracteres (uns 500 px) que não quebra. Sem o `wrap-anywhere` em `NovaEscola.tsx:172` (a revisão) e `:263` (a prévia), ele passa dos 360 px. O `larguraExcedenteDoDialogo` (`e2e/__fixtures__/verificacoes.ts:43`) mede a diferença entre a largura total e a largura visível do `dialog[open]`. Essa medida pega o estouro nas duas verificações, `:185` e `:193`. Isso confirma a mutação que a execução diz ter feito à mão.
- **A lista também ficou protegida.** O endereço da escola longa, gerado em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/painel.ts:118`, passou a ser `` `p${marca}`.padEnd(63, 'x') ``, sem hífen. Tirar o `wrap-anywhere` de `Escolas.tsx:61` e `:84` também deixa o W6 vermelho em `larguraExcedente` (`:122`).
- **A remoção do `click({ force: true })` não tirou prova de nada.** O estado desabilitado continua verificado com `toBeDisabled()` em `:147`, `:440` e `:466`.
- **O código de produção não mudou nesta rodada.** O `6_task.md` só registra a decisão sobre o `CONFLITO`, que era uma recomendação.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-25 04:36:30 · `tasks/prd-apresentacao-painel/6_task.md`

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum campo novo. A tela mostra o nome do operador na faixa (vem do /eu da A0, já está na
  tabela, linha 76 do docs/lgpd.md). A lista de escolas usa o contrato estrito esquemaEscolaDoPainel
  (packages/shared/src/operacao/painel.ts:150): id, nome e slug da escola, id e nome da rede, estado da coordenação,
  conviteId e três contagens. Não há pessoa na resposta, e um campo a mais é recusado pelo z.strictObject. Rede e
  escola são dado institucional, não pessoal.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: ok. A tarefa é só de web; o escopo e a autorização ficam na API da 5.0 (já aprovada), e toda
  chamada passa por chamarComSessaoDeOperador. O /eu deixou de segurar a tela, mas o componente Protegida continua
  exigindo a sessão aberta, e a API continua exigindo a sessão do operador.
Logs: limpos. Nenhum console, logger ou gravação no localStorage/sessionStorage nos arquivos novos. Os erros vêm do
  catálogo (textoDaFalha) e não repetem o corpo da resposta.
Auditoria: nenhuma ação desta tarefa a exige (não lê dado de aluno, não exporta, não mexe em nota nem em permissão).
  Criar rede e escola usa os endpoints da 1.0, que esta tarefa não alterou.
Envio externo: nenhum.
Seed/fixture: sintético. Nomes com "sintético/sintética" e marca aleatória, e-mails em @educa.invalid e
  @turmma.invalid, hash de token gerado na hora, e o teardown (removerPainel) apaga tudo o que criou.
Bloqueantes: nenhum.
Recomendações:
  1. e2e/__fixtures__/painel.ts:56: o texto que estica o nome da escola longa inclui "Professora Maria Aparecida dos
     Santos Oliveira", um nome completo de pessoa com cara de real. É inventado e está num nome de escola, então não
     bloqueia. Mas o seed fica mais claro se o enchimento for obviamente sintético, por exemplo "... Escola Sintética
     Exemplo". Isso evita que alguém, no futuro, tome o nome por dado real num grep de auditoria.
  2. Continua pendente o que a 5.0 recomendou para o docs/lgpd.md: uma linha ou nota dizendo que o painel da operação
     (D76) mostra por escola só contagens do ano em curso e o estado da coordenação, sem pessoa. A tela agora existe,
     e é isso que o dossiê responde à prefeitura.
  3. Continua pendente o que a 3.0 recomendou em docs/lgpd.md:72: trocar "gerado pelo comando do operador ou pelo
     painel da operação" por "gerado ou refeito pelo painel da operação".
```

Pergunta de fechamento: esta tarefa não guarda nada sobre aluno nem envia dado para fora, então não muda o que o sistema responde sobre um aluno. A lista das escolas só mostra contagens, e a Escolas.tsx não abre caminho nenhum até uma pessoa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/painel.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/pedidos-do-painel.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/textos.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/estados-da-escola.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/CascaDaOperacao.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/Campo.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/painel.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/tela-da-operacao.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/painel.ts (contrato de referência)

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-09-25 04:37:18 · `tasks/prd-apresentacao-painel/6_task.md`

VEREDITO: AJUSTES NECESSÁRIOS

Estados: ok. A lista de escolas tem os quatro estados, e o teste W7 prova cada um. O vazio convida ("Nenhuma escola ainda. Comece criando a rede.", com a ação Nova rede). Uma página além da última mostra o próprio vazio, com "Ir para a primeira página". O diálogo Nova escola tem carregando, erro e "Crie a rede primeiro", e todos têm Cancelar.

Acessibilidade: boa no geral, com um bug.
- O que está certo: o diálogo usa o `dialog` nativo, prende o foco e o devolve a quem o abriu. Os erros ficam no campo, com `aria-invalid` e `aria-describedby`. A ordenação usa `aria-pressed`, a navegação usa `aria-current` com sublinhado (não só cor), e o estado da escola é texto, com a cor só de reforço. A tabela tem `caption` e `th scope`. O axe roda em todos os estados, nos dois projetos. O W8 prova o fluxo inteiro só com Tab e Enter.
- O bug: com um diálogo aberto, o aviso de inatividade fica inacessível (é o bloqueante abaixo).

Chromebook fraco: ok. Os projetos rodam com CPU ×4 e Fast 3G. A lista é paginada, com `placeholderData` e `aria-busy` na troca. O `/eu` e a lista carregam em paralelo. O chunk `operacao-*` ficou em 11,2 kB, bem abaixo do teto de 60 kB. Não há imagem nem upload nesta tela.

Celular: ok. Abaixo de 640 px aparece um cartão por escola. A largura é medida no documento e dentro do diálogo, a 360 px, com nome, rede e endereço de 63 caracteres no limite. Ações e opções de rádio têm 44 px, e o teste confere as ações. Nada depende de hover. Nenhum fluxo exige o celular.

Ação oficial protegida: sim. Não há nota neste escopo. A única ação irreversível é criar a escola, porque o endereço não muda depois. Ela passa por "Confira antes de criar", que mostra rede, nome, endereço completo e o aviso de que o endereço fica fixo, com "Voltar e corrigir" e "Cancelar". O clique duplo é segurado pelo `useRef` e pelo id do pedido, e o e2e prova isso.

Bloqueantes:
- **O aviso de inatividade fica inerte quando um diálogo está aberto.**
  - Onde: `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDaOperacao.tsx:36` abre o diálogo em modo modal, e `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx:105` desenha o `AvisoDeInatividade` fora dele.
  - O que está errado: o modo modal deixa inerte tudo o que fica fora do diálogo. Se o operador para por cerca de 27 min com Nova rede ou Nova escola aberto, o aviso "Sua sessão vai terminar em 2 minutos" aparece, mas:
    - "Continuar na sessão" e "Sair" não recebem foco pelo Tab e não respondem como botões;
    - o `role="alert"` sai da árvore de acessibilidade, e quem usa leitor de tela não é avisado antes de a sessão cair, perdendo o que digitou (WCAG 2.2.1).
  - Isso quebra o requisito da A0 de o ponto de parada ser visível e acionável (D59). O problema nasce nesta tarefa, porque é o primeiro diálogo modal dentro da casca com sessão. O e2e de inatividade (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao.spec.ts:197`) só testa sem diálogo aberto.
  - Correção exigida: com um diálogo aberto, o aviso precisa aparecer e funcionar dentro dele. Por exemplo, a `ComSessao` passa `avisoVisivel`, `continuar` e `sair` por contexto, e o `DialogoDaOperacao` desenha o aviso dentro do próprio `<dialog>` enquanto estiver visível. Vale também outra solução em que o aviso fique fora da área inerte.
  - Teste exigido: um e2e, nos projetos `chromebook` e `celular`, que abre Nova escola, avança o `page.clock` até o aviso e confirma três coisas: a região está visível e na árvore de acessibilidade; "Continuar na sessão" recebe foco pelo Tab e funciona com Enter ou toque; e o axe continua limpo.

Recomendações:
- Com o `/eu` e a lista falhando juntos (503), a tela mostra duas mensagens iguais, cada uma com seu "Tentar de novo" (`rotas.tsx:103` e `Escolas.tsx:172`). Juntar as duas numa só, ou esconder a da lista quando a do `/eu` já está na tela.
- O `onSuccess` de `NovaEscola` e `NovaRede` fica no `useMutation` e roda mesmo depois de o diálogo fechar. Se o operador cancela com o pedido no ar e abre o outro diálogo, a resposta que chega depois chama `aoCriar`, e `definirDialogo(undefined)` (`Escolas.tsx:219` e `Escolas.tsx:231`) fecha o diálogo novo. Anunciar sem fechar quando o diálogo que criou já não é o aberto.
- Na prévia do endereço (`NovaEscola.tsx:263`), o texto aparece como foi digitado, com maiúscula ou acento, e só a validação o recusa depois. Mostrar a prévia normalizada, ou marcar o formato inválido na hora, evita a ida ao "Revisar" só para descobrir o erro.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-25 04:37:32 · `tasks/prd-apresentacao-painel/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As três mudanças que tocam a seção 9 estão registradas em "Divergências resolvidas nesta tarefa" e na seção 9 da `techspec.md`, como o processo pede. São elas: o item Uso fica para a 8.0, o `/eu` passa a carregar junto com a tela, e o 429 e o `TEMPO_ESGOTADO` entram em `textoDaFalha`. Nenhuma delas foi decidida em silêncio. A tarefa não adianta nada da 7.0 (ações de convite no cartão) nem da 8.0 (tela Uso).
Portão local: carimbo válido (typecheck, lint, test e e2e sobre o código atual)
Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/pedidos-do-painel.ts:38`: o `TEXTO_DO_CAMPO[campo as CampoDaEscola]` funciona hoje só porque `CampoDaRede` cabe dentro de `CampoDaEscola`. Se `CampoDaRede` ganhar um campo que não existe na escola (por exemplo, `tipo`), o cast esconde o erro e o texto sai `undefined`. Uma saída é passar o mapa de textos como parâmetro de `errosDos`, tipado por `Campo`, e tirar o cast.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx:17` cria outro `Intl.NumberFormat('pt-BR')`, e `apps/web/src/formatar.ts` já tem um igual, só que não exportado. Vale exportar um `formatarNumero` de `formatar.ts` e usá-lo aqui e na 8.0 (W5).
- `CLASSES_DO_BOTAO_SECUNDARIO` fica dentro de uma página (`paginas/NovaRede.tsx:12`) e é importado por `Escolas.tsx` e `NovaEscola.tsx`. A mesma lista de classes também aparece em `operacao/rotas.tsx` (aviso de inatividade), `paginas/Vinculos.tsx` e `paginas/EntrarNaEscola.tsx`. O lugar natural é uma variante secundária em `apps/web/src/componentes/`, em tarefa própria. Por ora, pelo menos tirá-la de dentro de uma página.
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite.spec.ts:76` ainda tem um `esperarCasca` local, e agora existe o compartilhado em `e2e/__fixtures__/tela-da-operacao.ts`, que aceita `Pick<OperadorDeTeste, 'nome'>`. Vale apontar o spec para o compartilhado e manter só a asserção extra de `aria-current`.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx:26`: o selo de estado usa `rounded-lg`, e as outras superfícies usam os tokens `rounded-controle`/`rounded-cartao`. Isso é da área do `frontend-reviewer`, que deve confirmar.

## test-engineer · 4ª rodada · APROVADO · 2026-09-25 04:55:58 · `tasks/prd-apresentacao-painel/6_task.md`

VEREDITO: APROVADO

Esta é a 4ª rodada. Auditei só o que mudou desde a 3ª: a correção do `frontend-reviewer` e as recomendações do `revisor-geral` e do `privacy-guardian`. Não refiz o que ficou igual.

**Cenários exigidos:** a correção pedida pelo `frontend-reviewer`, com e2e em `chromebook` e em `celular`. Com um diálogo aberto e a sessão parada:
- o aviso aparece dentro do diálogo, visível e presente na árvore de acessibilidade;
- "Continuar na sessão" recebe foco pelo Tab e funciona com Enter ou toque;
- o axe fica limpo.

Somam-se a isso o que depende do mesmo código: um aviso só por vez, e o aviso voltando para a casca quando o diálogo fecha.

**Cobertos:** o teste novo está em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-escolas.spec.ts:531-563`.
- **Falharia sem a correção.** A busca começa no diálogo (`noDialogo(page).getByRole('region', …)`, linha 542). Com o aviso desenhado na casca, fora do `<dialog>`, a linha 543 falha. Com o aviso desenhado nos dois lugares, a contagem de uma só região na página (linha 545) falha.
- **O foco é provado.** O `tabAte` (linha 550) lança erro se não alcançar o botão, e elemento inerte não recebe foco. O foco preso do `DialogoDaOperacao` percorre o aviso, porque ele agora fica dentro do `<dialog>`.
- **O resto também está provado:** o texto do alerta, o axe, o aviso sumindo depois do uso com o diálogo ainda aberto, e o aviso da casca voltando depois de fechar o diálogo, com zero diálogos na página (linhas 559-562).
- **O contador de diálogos aguenta o `StrictMode`.** O `registrarDialogo` é estável (`useCallback`) e cada registro devolve o próprio cancelamento, então somar, desfazer e somar de novo dá 1. Revisei no código; não tem teste próprio, e não precisa.
- **As mudanças que só reorganizam não pedem teste novo:** `formatarNumero`, `errosDos` tipado (os testes em `pedidos-do-painel.test.ts:29,52` continuam cobrindo os textos por campo), `CLASSES_DO_BOTAO_SECUNDARIO` em arquivo próprio, o `esperarCasca` compartilhado (a asserção de `aria-current` ficou) e o nome longo do fixture sem nome de pessoa.
- Não há `.skip`, teste comentado nem mock escondendo a regra. Nesta rodada não há IA nem operação concorrente nova.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **`e2e/operacao-escolas.spec.ts:550-555`: o Enter e o toque não causam o uso que o teste espera, e o teste depende da latência da rede simulada.**
   - O que acontece: `inatividade.ts:75-79` conta qualquer `keydown` e `pointerdown` na janela como uso. Como já passou mais de `INTERVALO_MINIMO_DO_USO_MS`, o primeiro Tab do `tabAte` já dispara o `GET /v1/operacao/eu`. O Enter (ou o toque) cai no `usoEmAndamento` e não faz nada. A resposta esperada pelo `waitForResponse` é a do Tab.
   - O comportamento que o usuário vê (conseguir continuar a sessão) está provado. Mas tirar o `onClick={aoContinuar}` não quebra o teste.
   - O teste só passa porque o `/eu`, com a latência do Fast 3G e da rede móvel, demora mais que os ~5 Tabs. Num perfil sem limitação de rede, o aviso sumiria no meio do `tabAte` e o teste quebraria. Isso é risco de teste instável na esteira.
   - Sugestão: segurar o `/eu` com `page.route` até depois do foco no botão, e só então soltar e conferir que o aviso some. Para provar a ligação do botão, disparar `continuar.evaluate((b) => b.click())`, que não gera `keydown` nem `pointerdown`, e contar um `/eu`. E corrigir o comentário da linha 548.
2. **"Sair" dentro do diálogo não tem teste.** O botão existe e vem do mesmo contexto, mas nenhum e2e prova que ele encerra a sessão a partir do diálogo. Vale um passo curto no mesmo teste ou em W10.
3. **`Escolas.tsx:220,232`: o `aoCriar` que fecha só o diálogo que criou não tem teste.** O cenário é abrir Nova escola, cancelar com o pedido no ar, abrir Nova rede, e a resposta atrasada não pode fechar o Nova rede. Era recomendação do `frontend-reviewer`, então não bloqueia. Um e2e com `page.route` segurando o POST prova.
4. **Duas pendências de documento seguem em aberto.** Continuam as recomendações 2 e 3 do `privacy-guardian` para `docs/lgpd.md`. São de documento, não de teste; ficam registradas para o `/validar`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/AvisoDeInatividade.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDaOperacao.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/botao-secundario.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/inatividade.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/pedidos-do-painel.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/formatar.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-escolas.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite.spec.ts

## test-engineer · 5ª rodada · APROVADO · 2026-09-25 05:19:34 · `tasks/prd-apresentacao-painel/6_task.md`

VEREDITO: APROVADO

Esta é a 5ª rodada. Só mudou `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-escolas.spec.ts`, então conferi as três recomendações de teste da 4ª rodada contra o código que elas exercitam: `inatividade.ts`, `AvisoDeInatividade.tsx` e `Escolas.tsx:216-232`.

**Cenários exigidos:**
1. **Enter ou toque em "Continuar na sessão", sem depender da latência (rec. 1).** O teste precisa falhar se o `onClick` do botão for retirado.
2. **"Sair" dentro do diálogo (rec. 2).** O aviso vai para dentro do diálogo aberto por cima dele, e o "Sair" de lá encerra a sessão.
3. **Resposta atrasada que não fecha o diálogo novo (rec. 3).** O operador cancela o Nova escola com o POST no ar e abre o Nova rede. A resposta que chega depois anuncia a escola e deixa o Nova rede aberto.

**Cobertos:**
1. **Rec. 1, linhas 576-610.**
   - O `/eu` do primeiro Tab fica seguro por `page.route`. Depois dele, o `usoEmAndamento` segura as outras teclas.
   - O teste confere foco no botão e aviso ainda visível. Só então solta o `/eu`, e o aviso some. A dependência da latência acabou.
   - Na segunda parada, `evaluate(click)` não gera `keydown` nem `pointerdown`, e nenhuma tela faz polling (`inatividade.ts`). Sem o `onClick={aoContinuar}`, nenhum `/eu` sai e o `expect.poll(...).toBe(1)` da linha 607 fica vermelho. O comentário que estava errado foi corrigido.
2. **Rec. 2, linhas 618-624.**
   - O Nova rede é aberto por `evaluate(click)`, que não conta como uso. O aviso aparece dentro do diálogo, e o "Sair" de lá leva a `/operacao/entrar` sem diálogo na tela.
   - Sem o `onClick={aoSair}`, a sessão só cairia cerca de 1,5 min depois, pelo relógio. O `toHaveURL` espera no máximo 20 s (`PRAZO_DA_ENTRADA_MS`), então o teste falharia.
3. **Rec. 3, linhas 473-498.**
   - Sem o `definirDialogo((aberto) => aberto === 'escola' ? undefined : aberto)` de `Escolas.tsx:232`, a resposta atrasada fecharia o Nova rede, e a linha 497 falharia.
   - O anúncio "Escola … criada." também é conferido.
4. **O resto.** Não há `.skip`, teste comentado nem mock escondendo a regra. Não há IA nem concorrência nova nesta rodada. O clique duplo continua coberto pelas linhas 422-471.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Linha 607:** o `expect.poll(() => usos.length).toBe(1)` passa assim que chega a 1, e não prova que foi um só. Para provar "exatamente um", repita `expect(usos).toHaveLength(1)` depois da linha 608, com o aviso já fora da tela.
2. **Linha 623:** o teste não distingue o "Sair" de a sessão ter caído pelo relógio. Hoje só a margem de tempo faz essa diferença. Vale conferir que não aparece o alerta `MENSAGENS_DE_ERRO.SESSAO_ENCERRADA`, que é o do fim por inatividade. Ou, melhor, conferir no banco que a sessão foi encerrada pelo "Sair".
3. **Linha 71:** o comentário "O botão de um diálogo aberto" descreve errado o `noDialogo`, que devolve o próprio diálogo.
4. **`docs/lgpd.md`:** as duas pendências de documento vindas da 3.0 e da 5.0 continuam para o `/validar`, como na rodada anterior.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-25 05:20:22 · `tasks/prd-apresentacao-painel/6_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. O diff desta rodada só mexe na apresentação: o aviso de inatividade agora aparece dentro do diálogo aberto, entrou a função `formatarNumero`, o `errosDos` ficou tipado e o `aoCriar` fecha só o diálogo que criou. A tela continua mostrando o que a 5.0 já devolvia: o nome e o endereço da escola, a rede e as contagens de turmas, professores e alunos. Nenhuma pessoa aparece.

Fora da tabela de dados do docs/lgpd.md: nada novo nesta rodada.

Autorização por objeto: ok. A tarefa é só de web e não cria nem muda endpoint. A tela consome a lista do painel da 5.0, já auditada.

Logs: limpos. Não há `console.*` em `apps/web/src/operacao/` nem em `apps/web/src/formatar.ts`. Também não há `localStorage`, `sessionStorage` nem `indexedDB`; a única menção a eles é o comentário de `api/sessao.ts:23`, que diz justamente que nada fica guardado ali.

Auditoria: nenhuma ação nova que a exija nesta rodada. O aviso de inatividade só chama o `continuar` e o `sair` que já existiam.

Envio externo: nenhum.

Seed/fixture: sintético.
- A recomendação 1 da rodada anterior foi aplicada: `e2e/__fixtures__/painel.ts:56` usa agora o enchimento `' de Ensino Fundamental e Médio da Rede Sintética de Exemplo'`, sem nome de pessoa.
- As coordenadoras continuam como "Coordenadora sintética <marca>" (linha 71).
- Os e-mails de conta ficam no domínio reservado `@educa.invalid` (linha 70).
- Em `e2e/operacao-escolas.spec.ts`, os nomes de rede e de escola são gerados ("Rede do teclado", "Escola do teclado <marca>").

Pergunta de fechamento: esta rodada não guarda nem envia nada novo sobre aluno. O que a tela mostra de aluno é só contagem agregada por escola, então a resposta ao pedido da secretaria não muda.

Bloqueantes: nenhum.

Recomendações:
1. Continuam valendo as recomendações 2 e 3 da rodada anterior, adiadas para o `/validar`: registrar em `docs/lgpd.md` as pendências da 3.0 e da 5.0.
2. `rotas.tsx` guarda num `useState` quantos diálogos estão abertos. Se algum diálogo fechar sem desmontar, a conta fica errada e o aviso de inatividade não volta para a casca. Não é questão de privacidade, mas vale um teste de regressão, porque sem o aviso a sessão termina sem que o operador veja.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/AvisoDeInatividade.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/botao-secundario.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDaOperacao.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/pedidos-do-painel.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/formatar.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/painel.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-escolas.spec.ts

## revisor-geral · 2ª rodada · APROVADO · 2026-09-25 05:20:35 · `tasks/prd-apresentacao-painel/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test e e2e sobre o código atual)
Bloqueantes: nenhum

**Rodada nova, conferida.** A correção exigida pelo `frontend-reviewer` foi feita. O aviso agora é desenhado dentro do `<dialog>`, pelo `AvisoNoDialogo` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDaOperacao.tsx`. A casca deixa de desenhá-lo quando há um diálogo aberto, pelo `dialogosAbertos === 0` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx`. O `registrarDialogo` é estável e aguenta o StrictMode. O e2e cobre o aviso dentro do diálogo, o "Continuar na sessão", o "Sair" e a volta do aviso para a casca.

Todas as minhas recomendações da 1ª rodada foram aplicadas:
- `errosDos` tipado pelo mapa, sem cast.
- `formatarNumero` exportado e sem segundo `Intl.NumberFormat`.
- `CLASSES_DO_BOTAO_SECUNDARIO` fora da página.
- `esperarCasca` compartilhado.

O selo com `rounded-lg` fica justificado pela 9.3. Nada invade a 7.0 nem a 8.0. A mudança do aviso é correção de tela, não arquitetura, e está registrada em "Divergências resolvidas" no 6_task.md.

A tabela de revisões ainda não tem rodada nova do `frontend-reviewer`, que tem veto. O hook vai bloquear o commit até ele aprovar a correção dele.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx:232` (e `:222` no Nova rede): a guarda compara o **tipo** do diálogo, não a instância.
  - O caso: o operador cancela o Nova escola com o POST no ar e reabre o Nova escola. A resposta atrasada chama `aoCriar` pelo `onSuccess` do `useMutation` do diálogo desmontado, e fecha o diálogo novo com o que já foi digitado nele.
  - Isso contradiz a frase "só o diálogo que criou é fechado" no 6_task.md. O e2e cobre só a troca de tipo (escola para rede).
  - Correção sugerida: passar o `onSuccess` para o `mutate(..., { onSuccess })`, que não roda depois de o componente desmontar, e anunciar pelo `aoCriar` sem fechar. Outra saída é guardar o id do pedido aberto e fechar só se for o mesmo. Se o comportamento atual for aceito de propósito, ajustar o texto da divergência.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx`: o objeto `aviso` passado ao `ContextoDoAviso` nasce de novo a cada render da `ComSessao`, e com ele renderizam de novo todos os consumidores (o diálogo aberto e o aviso). Um `useMemo` sobre `avisoVisivel`, `continuar`, `sair` e `registrarDialogo` resolve; o `sair` precisaria ficar estável também. No Chromebook fraco, é render que dá para evitar.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx:17-18`: sobrou uma linha em branco dupla onde estava o `Intl.NumberFormat`.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-09-25 05:21:06 · `tasks/prd-apresentacao-painel/6_task.md`

VEREDITO: APROVADO

A correção da 1ª rodada foi feita e está coberta por teste. Não encontrei bloqueante novo no diff.

**Correção exigida: feita.** Com um diálogo aberto, o aviso de inatividade agora aparece dentro dele e funciona.
- O diálogo avisa a casca quando abre e quando fecha. Enquanto há um aberto, a casca não desenha o aviso (`rotas.tsx:87`), e o diálogo o desenha dentro de si (`DialogoDaOperacao.tsx:80`).
- O aviso fica depois do conteúdo do diálogo, então o Tab do último botão do formulário chega a "Continuar na sessão" e o foco continua preso no diálogo.
- Trocar de Nova escola para Nova rede fecha um diálogo e abre o outro no mesmo passo, e o aviso da casca não pisca no meio.
- O e2e novo (`e2e/operacao-escolas.spec.ts:559`) roda nos dois projetos, sem restrição de projeto. Ele confere:
  - o aviso dentro do diálogo, com uma só região na página e o axe limpo;
  - o Tab chegando a "Continuar na sessão";
  - o clique no botão pedindo `/eu` e tirando o aviso, com o diálogo no lugar;
  - o aviso voltando à casca depois que o diálogo fecha;
  - o "Sair" de dentro do diálogo levando à entrada.

Estados: ok. Nada mudou nesta rodada; carregando, erro, vazio (que convida a criar a rede), página sem escolas e com dado continuam em `Escolas.tsx`.

Acessibilidade: o aviso é alcançável e acionável pelo teclado dentro do diálogo modal, é anunciado sem roubar o foco, e "Continuar" e "Sair" têm o mesmo tamanho (D59). Ao clicar em "Continuar" o aviso some com o botão focado, e o foco vai para o corpo da página em vez de voltar ao diálogo (recomendação 1).

Chromebook fraco: sem custo novo. O que o diálogo conta é só um número na casca, e a regra do `/eu` não mudou.

Celular: o e2e roda no projeto `celular`, e os botões do aviso e o botão secundário têm 44 px. O aviso fica preso ao rodapé da tela também dentro do diálogo. Em 360 px ele empilha o texto e os botões e pode cobrir a parte de baixo do formulário enquanto está visível. Não bloqueia, porque "Continuar" tira o aviso (recomendação 2).

Ação oficial protegida: sim. Não há nota nesta tela. Criar escola continua passando pela etapa "Confira antes de criar", e esta rodada não mexeu nisso.

Bloqueantes: nenhum.

Recomendações:
1. Em `AvisoDeInatividade.tsx`, depois de "Continuar na sessão", devolver o foco ao diálogo (ao campo que estava focado, ou ao primeiro) quando o aviso estiver dentro de um. Na casca, devolver ao conteúdo principal. Hoje o foco cai no corpo da página, e a tecla seguinte não passa pela função que prende o foco do diálogo.
2. Com o aviso dentro do diálogo no celular, reservar espaço embaixo do diálogo, ou desenhar o aviso no fluxo do diálogo e não preso ao rodapé da tela, para não cobrir "Revisar" e "Cancelar". Um teste que confira que o aviso cabe na tela a 360 px fecharia o caso (o `toBeVisible` não confere isso).
3. `Escolas.tsx:220` e `:230`: a resposta tardia de uma Nova rede já fechada ainda fecha uma outra Nova rede aberta depois (ela confere só o tipo do diálogo). Se isso importar, comparar pelo id do pedido.
4. Continuam registradas da 1ª rodada, sem aplicar: duas mensagens de 503 quando `/eu` e a lista falham juntos, e a prévia do endereço normalizada.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/AvisoDeInatividade.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/DialogoDaOperacao.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/botao-secundario.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/formatar.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-escolas.spec.ts`

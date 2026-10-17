# Achados das revisões — `tasks/correcoes/2026-10-17-pagina-rola-depois-da-12.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 01:57:20 · `tasks/correcoes/2026-10-17-pagina-rola-depois-da-12.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: `/coordenacao/analista` no computador e no celular, com a escola cheia e com a vazia)
Estados: ok. A tela continua com carregando, erro, vazio e com dado, só movidos para dentro do miolo. O código dos três primeiros não mudou. O estado vazio convida com "Gerar resumo". Pelas fotos, cheia e vazia saíram iguais porque a Analista não tinha resumo gerado nas duas.
Acessibilidade: ok. A `section` tem nome ("Resumo do Analista") e vira região navegável. O `tabindex="0"` só existe a partir de 768 px, onde o miolo rola, e o anel de foco global (`estilos.css:323`) cobre o elemento. Na primeira e na segunda leitura do código não achei texto novo sem rótulo nem controle novo.
Chromebook fraco: melhora. A página passa a ter a altura da janela e a altura do conteúdo não decide mais se ela rola, que era a causa do vermelho de 10 px. O miolo termina a 724 px, com 44 px de folga até a base, conforme a foto.
Celular: sem regressão. Todas as classes novas levam o prefixo `md:`, então a 360 px o layout não muda. A foto mostra o título, o cartão, o vazio e o botão "Gerar resumo" (maior que 44 px) sem rolagem horizontal. O botão "Abrir dado nominal" quebra em duas linhas e continua legível.
Ação oficial protegida: sim. Esta correção não toca em nenhuma ação oficial. O dado nominal continua abrindo com a finalidade registrada na auditoria, e o texto da tela diz isso.
Bloqueantes: nenhum.

Recomendações:
- `apps/web/src/areas/coordenacao/Analista.tsx:~85`: a 1366 × 768 o miolo corta o botão "Abrir dado nominal de uma turma" ao meio no fim da área visível, e abaixo dele sobram 44 px em branco. É o comportamento esperado de uma região que rola, e é o mesmo padrão de Escola e Registros. Mesmo assim, o corte pela metade pode parecer defeito a quem não percebe que a região rola. Vale avaliar uma dica visual de continuação (sombra no rodapé do miolo) para as três telas ao mesmo tempo, numa spec própria.
- Na foto do celular, a barra de baixo, fixa, aparece no meio do conteúdo. É efeito da captura de página inteira, não bug. A tela de 360 px não muda nesta correção, e as classes `md:` do diff confirmam isso.
- `apps/web/src/areas/coordenacao/miolo-que-rola.ts`: o comentário da constante nova ficou longo e com quebra de linha irregular (a linha que termina em "A página tem a"). Convém enxugar.
- O número mágico `13rem` depende da altura do cabeçalho (64 px do título). Se o `Tela` mudar essa altura, a constante precisa mudar junto. O teste só confere que o `max-h` existe, não o valor. O W2 (`e2e/areas.spec.ts:316`) cobre o efeito.

Pelo diff e pelo texto da correção, a causa está bem explicada, as classes do miolo seguem o padrão que já existia e o teste cobre a região, o foco a 1366 px e a ausência dele a 360 px. As seis mutações do documento miram exatamente as cláusulas do miolo.

Os arquivos foram lidos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/`. Não rodei o portão nem o e2e.

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 01:58:00 · `tasks/correcoes/2026-10-17-pagina-rola-depois-da-12.md`

VEREDITO: APROVADO

**Cenários exigidos**
1. **Caminho feliz.** A 1366 px a página da Analista não rola. Só a região "Resumo do Analista" rola, e o `h1` e "Gerar resumo" ficam fora dela.
2. **Borda, troca de fonte.** A métrica de fonte da máquina muda a altura do conteúdo, e mesmo assim a página fica na altura da janela.
3. **Borda, estado vazio.** A escola nova, sem resumo, mostra o vazio dentro do miolo. É o estado das duas fotos.
4. **Borda, resumo longo.** Um resumo com vários alertas e recortes rola o miolo, não a página.
5. **Borda, 360 px.** A página rola, e a região não recebe `tabindex` nem prende a altura.
6. **Acesso pelo teclado.** O miolo rolável recebe foco a 1366 px.
7. **Permissão, isolamento e concorrência.** Não se aplicam: a correção é só de layout, sem dado, API nem operação repetível.

**Cobertos**
- **Caminho feliz e 360 px:** `apps/web/src/areas/coordenacao/Analista.test.tsx:176-202`. O teste confere a região com nome, o resumo e a assinatura dentro dela e o `h1` fora. Confere também as três classes `md:` e a falta de classe de altura sem `md:`. Por fim, confere o `tabindex="0"` a 1366 px e a falta dele a 360 px.
- **As seis mutações declaradas:** cada uma bate numa asserção diferente e daria vermelho pelo motivo certo. São elas:
  - sem `overflow`, que cai no `toContain`;
  - sem `relative`, que cai no `toContain`;
  - sem `max-h`, que cai no regex;
  - sem `tabindex`, que cai no `getAttribute`;
  - `tabindex` sempre presente, que cai no ramo de 360 px;
  - sem `aria-label`, que faz o `getByRole('region')` não achar nada.
- **O efeito real (página contra janela):** o W2 em `e2e/areas.spec.ts:349-356` chama `paginaNaoRola` em todas as telas, a Analista incluída. Ele roda na escola recém-criada, então já cobre o estado vazio a 1366 × 768. Isso cobre também o dado nominal: fora do miolo, ele somaria mais de 100 px à página e o W2 ficaria vermelho.
- **Proibições:** não há `.skip` nem mock de coisa nossa. O `matchMedia` é falso só porque o `jsdom` não tem, e o mesmo padrão já aparece em `ListaDaTurma.test.tsx` e `Pedidos.test.tsx`.
- **Execução:** rodei `npx vitest run` no `Analista.test.tsx` e os 9 casos passaram.

**Bloqueantes:** nenhum.

**Recomendações**
1. **O comentário do teste promete mais do que ele confere.** Em `Analista.test.tsx:184` o comentário diz que "o dado nominal" está na região, mas não há asserção para isso. Basta acrescentar `within(miolo).getByText('Dado nominal')`. Hoje só o W2 pega o `DadoNominal` fora do miolo, e o portão da tarefa não roda o W2, porque o e2e não foi alterado.
2. **O estado vazio não tem caso de unidade.** Mover o `EstadoVazio` para fora da `section` passaria na unidade. Vale um segundo caso com `resumo: null` que confira o "Nenhum resumo gerado ainda" dentro do miolo.
3. **O valor de 13 rem não está preso por teste.** O W2 segura só o teto: menos de 13 rem faz a página rolar. Um valor maior, como 17 rem, deixa a faixa em branco embaixo que o próprio documento descreve, e nenhum teste pega isso. É cosmético, então fica como observação para o `frontend-reviewer`.
4. **Comentário velho no e2e.** O comentário em `e2e/areas.spec.ts:347-348` ainda diz que `paginaNaoRola` mede "Escola e Registros", na Estrutura. Desde o laço ele mede todas as telas, a Analista incluída. Vale corrigir o texto numa próxima tarefa que toque o arquivo, porque ele está fora deste diff.
5. **Nada indica que o miolo rola.** Na foto de 1366 px o botão "Abrir dado nominal de uma turma" aparece cortado na base do miolo, sem outro sinal de que ali rola. Isso é para o `frontend-reviewer` avaliar, não para teste.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Analista.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Analista.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/miolo-que-rola.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-17-pagina-rola-depois-da-12.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/areas.spec.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 02:02:26 · `tasks/correcoes/2026-10-17-pagina-rola-depois-da-12.md`

VEREDITO: APROVADO

Cenários exigidos (correção de layout de uma tela, sem dado de escola nem operação concorrente):
- **Caminho feliz:** com resumo, o conteúdo da Analista fica numa região que rola sozinha a partir de 768 px, e o título fica de fora.
- **Borda 1:** sem resumo, o vazio também fica dentro dessa região.
- **Borda 2:** o "Dado nominal" fica dentro da região nos dois estados.
- **Borda 3:** a 360 px a página é que rola, e a região não recebe foco.
- **Isolamento:** não se aplica, a tela não lê dado novo.
- **Concorrência:** não se aplica, a tela não grava nada.
- **Permissão:** não se aplica, as rotas não mudaram.

Cobertos:
- **Exigência 1 da 1ª rodada, feita.** `Analista.test.tsx:187` confere com `within(miolo).getByText('Dado nominal')` que o dado nominal está dentro da região. A mutação 7 tira o `<DadoNominal />` para depois do `</section>`. Com isso ele sai da região, e a linha 187 falha pelo motivo certo. O texto exato "Dado nominal" não colide com "Abrir dado nominal de uma turma", porque o `getByText` compara o texto inteiro.
- **Exigência 2 da 1ª rodada, feita.** O caso novo em `Analista.test.tsx:206-219` responde `SEM_RESUMO`. Ele confere quatro coisas dentro da região "Resumo do Analista": o vazio, o "Dado nominal", a ausência do `h1` e a classe `md:overflow-y-auto`.
- **Mutação 8.** Ela troca `{resumo.data !== undefined &&` (`Analista.tsx:103`) por `</section><section>{…`. O JSX que sai é válido: a `Tela` fica com duas `section`, e a segunda não tem nome, então não vira região. Daí em diante, o vazio, o resumo e o `DadoNominal` caem fora da região nomeada. A linha 214 falha porque o vazio não está na região, que é o motivo certo, e não por erro de compilação. O teste citado ("o estado vazio também fica dentro do miolo") é o começo do nome do `it` novo, e o portão já resolveu esse nome ao provar a mutação vermelha.
- **`miolo-que-rola.ts`.** Mudou só o comentário. A constante é a mesma, então as mutações 1 a 3 continuam valendo.
- **O teste roda.** `npx vitest run src/areas/coordenacao/Analista.test.tsx` passou com 10 de 10 casos.
- **Proibições.** Não há `.skip`, teste comentado nem mock que esconda a regra. A rede falsa serve só as respostas da API, e a classe e a região são conferidas no DOM de verdade.

Bloqueantes: nenhum.

Recomendações:
- O caso do vazio podia conferir também `tabindex="0"` a 1366 px. O atributo não depende do estado, e o caso com resumo já o prende, então isto é só cobertura extra.
- As três recomendações que ficaram sem aplicar estão no documento, cada uma com destino: a sombra de continuação, o valor de 13 rem e o comentário de `e2e/areas.spec.ts:347-348`. Ficam como estão para o `/validar`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Analista.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Analista.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/miolo-que-rola.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-17-pagina-rola-depois-da-12.md`

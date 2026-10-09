# Achados das revisões — `tasks/prd-lgpd-e-titular/6_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-09 04:08:15 · `tasks/prd-lgpd-e-titular/6_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Navegação:** Privacidade só aparece para a coordenação.
- **Estados:** carregando, erro com "Tentar de novo" e com dado. O vazio não se aplica.
- **Origem:** o ajuste da escola aparece, e o prazo encurtado pela trava diz de qual categoria veio.
- **Recomeço:** nem a segunda pessoa na mesma aba nem a troca de escola mostram a retenção anterior.
- **Endereço:** sem aba, ou com aba que não existe, abre a aba de retenção.
- **Projetos:** `chromebook` e `celular`, com acessibilidade e sem rolagem lateral.
- **Isolamento na tela:** a escola B, sem ajuste, não vê o ajuste de A.

**Cobertos:**
- **Navegação:** `navegacao.test.ts`. O teste novo falha se Privacidade entrar no professor ou no aluno, e a lista exata em `areas.spec.ts` também pega.
- **Textos da tela:** `textoDoPrazo` e `textoDaOrigem` (singular, plural, padrão, ajustada e as duas combinações com trava). Rodei os dois arquivos de unidade: 11 testes verdes.
- **Estados:** a resposta fica segurada, então o carregando aparece de verdade. O 503 sobrevive à nova tentativa automática, e "Tentar de novo" leva ao dado.
- **Trava:** `privacidade.spec.ts:65`.
- **Endereço:** os dois casos de redirecionamento. Removida qualquer uma das duas cláusulas, a URL não chega a `…/retencao`, e o teste falha.
- **Troca de escola:** prova de verdade. A resposta de B fica segurada; sem o `resetQueries`, o dado de A apareceria no lugar do carregando.
- **Segunda pessoa:** está coberta, mas com a fraqueza da recomendação 1.
- **Projetos:** `larguraExcedente` e `violacoesGraves` rodam nos dois projetos.
- **Ajuste de teste:** o `ajustarRetencaoDaEscola` respeita os checks da tabela (piso de cada categoria e formato de `alterada_por`).
- **Sem atalhos:** nenhum `.skip`, nenhum mock de coisa nossa. O 503 é injetado só na borda.

**Bloqueantes:**

1. **A linha de mutação do `dado` diz que o e2e falharia, mas ele não falha** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/6_task.md:92`; asserções em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/privacidade.spec.ts:58` e `:62`).
   - A mutação é tirar a coluna `dado` (`linha.descricao`) de `COLUNAS_DAS_CATEGORIAS`. Os dois textos procurados continuam na região por outro caminho, a coluna "De onde vem" das categorias travadas:
     - "Conversa do aluno com o Tutor" está no texto da trava de `consumo_por_aluno` ("…encurtado pela trava com "Conversa do aluno com o Tutor"").
     - "Conversa do professor com o Assistente de ensino" está no texto da trava de `execucao_agente` e `texto_do_modelo`, que a própria linha 65 confere.
   - Resultado: a coordenação poderia ficar sem saber de que dado é cada prazo, e o teste continuaria verde.
   - **Correção exigida:** prender as asserções à linha da categoria. Um helper que funcione nas duas formas da `Tabela` (`tr` no chromebook, `li` no celular), por exemplo `categorias(page).locator('tr, li').filter({ has: page.getByText('Conversa do aluno com o Tutor', { exact: true }) })`. Dentro dessa linha, conferir "6 meses", "cada mensagem" e "Ajustado pela escola"; fazer o mesmo para a linha do professor com "3 meses". Como reforço, asserir uma descrição que não é alvo de trava nenhuma, como "Sinais do Tutor ao professor" ou "Quanto cada aluno usou da IA". Depois, corrigir a linha 92 da tabela de mutações para o teste que de fato fica vermelho.

**Recomendações:**

1. **O teste da segunda pessoa depende do tempo** (`privacidade.spec.ts:163-179`).
   - O cliente usa `staleTime: 30_000` (`apps/web/src/api/cliente-de-consultas.ts`). Se o novo login passar de 30 s, o dado de A aparece do cache e é trocado pelo de B no refetch em segundo plano. As duas asserções passariam mesmo sem o `resetQueries`: "Padrão do sistema" também aparece na tela de A, e o `not.toContainText` espera até o refetch terminar.
   - O mecanismo (`aoTrocar`) é o mesmo da troca de escola, e esse teste o prova de forma estrita. Por isso não bloqueio.
   - Sugestão: segurar a resposta também aqui e conferir o carregando sem `AJUSTADO` antes de liberar, como nas linhas 134-156.
2. **Ajustada com trava só tem teste de unidade.** Um e2e com ajuste em `consumo_por_aluno` acima do de `conversa_tutor` mostraria "Ajustado pela escola; encurtado pela trava…" na tela. Fica como cobertura extra.
3. **A troca de aba (`aoMudar`) não tem teste.** Hoje só existe uma aba, e o motivo está declarado. O teste fica registrado para a tarefa 8.0, junto com o estado da aba ao trocar.
4. **Não há e2e de "professor digita `/coordenacao/privacidade`".** A guarda da área e a permissão da API (tarefa 2.0) cobrem, mas como cenário de permissão da tela ele cabe no `/validar`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-09 06:03:47 · `tasks/prd-lgpd-e-titular/6_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** nesta rodada, só a correção da 1ª. A linha de mutação da coluna "Dado" (`linha.descricao` em `COLUNAS_DAS_CATEGORIAS`) precisa de um teste que falhe de verdade sem a coluna. As asserções ficam presas à linha da categoria, em `tr` no chromebook e `li` no celular. Na linha do aluno entram "6 meses", "cada mensagem" e "Ajustado pela escola"; na do professor, "3 meses". Uma descrição que nenhuma trava cita reforça. E a seção "Mutações" diz qual teste fica vermelho.

**Cobertos:** a correção foi feita por inteiro. Conferi o diff e o que ele toca.

- **O helper funciona nas duas telas.** `linhaDa` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/privacidade.spec.ts:28-31`) procura `tr, li` e exige que o texto da linha comece pela descrição, com o rótulo "Dado:" opcional antes.
  - No chromebook, o texto do `tr` começa pelo `th scope="row"`, que é a primeira coluna (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/Tabela.tsx:93`).
  - No celular, o `li` começa pelo `sr-only` "Dado: " e depois a descrição (`Tabela.tsx:60-61`).
  - O `tr` do cabeçalho ("DadoPrazo que vale…") não casa.
  - O nome que aparece dentro da trava ("Padrão do sistema; encurtado pela trava com …") também não casa, porque a busca começa no início da linha.
- **O teste falharia sem a regra.** Se a coluna `dado` sai, a primeira coluna vira o prazo e as quatro buscas por linha voltam vazias, então `toHaveCount(1)` fica vermelho. Se `descricao` for trocada por `categoria`, também falha. Nenhuma descrição do catálogo é prefixo de outra (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/retencao.ts:44-49`), e se uma passasse a ser, `toHaveCount(1)` falharia em vez de passar à toa.
- **Os textos estão na linha certa.** "6 meses", "cada mensagem" e "Ajustado pela escola" (`privacidade.spec.ts:67-71`) e "3 meses" (`:72-74`) agora estão presos à linha da categoria. Com isso, as linhas de mutação de `prazo`, `contagem` e `origem` também ficam mais fortes: antes, o texto podia vir de outra linha da tabela.
- **Há reforço com descrição que a trava não cita.** "Sinais do Tutor ao professor (…)" e "Quanto cada aluno usou da IA" (`:76-77`).
- **A seção "Mutações" foi corrigida.** Em `tasks/prd-lgpd-e-titular/6_task.md` (seção "Mutações"), a linha do `dado` agora aponta para o teste que de fato fica vermelho, e diz que a mutação foi rodada no `chromebook`. O parágrafo de abertura também foi ajustado.
- **Fora do escopo, nada mudou.** O `git diff --stat` entre as duas árvores mostra só o spec e3e, o documento da tarefa e os `achados/`, como o prompt disse.

**Bloqueantes:** nenhum.

**Recomendações:**
- O comentário em `e2e/privacidade.spec.ts:75` diz "Uma categoria que nenhuma trava toca", mas "Quanto cada aluno usou da IA" (`consumo_por_aluno`) é encurtada pela trava de `conversa_tutor` (`retencao.ts:66`). O que vale para as duas descrições é que nenhum texto de trava as cita. A asserção está certa; só o comentário engana. Sugestão de texto: "Uma descrição que nenhum texto de trava cita".

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-09 06:04:37 · `tasks/prd-lgpd-e-titular/6_task.md`

VEREDITO: APROVADO

Estados: ok. Carregando (`EstadoCarregando`), erro com "Tentar de novo" (`EstadoErro`) e com dado estão em `Retencao.tsx`, e o e2e passa pelos três. O vazio não se aplica porque toda escola tem todas as categorias, e isso está dito no código e no `6_task.md`. A tela fica de pé mesmo com falha de refetch, porque só mostra erro quando não há dado (`retencao.data === undefined`).

Acessibilidade: ok.
- A aba usa `role="tablist"`, `tab` e `tabpanel`, com `aria-selected` testado no e2e.
- A tabela tem `caption`, `th scope` de coluna e de linha, e vira lista com `dt`/`dd` rotulados no celular.
- Cada seção tem `aria-labelledby`.
- O alerta de erro é separado do botão.
- O e2e roda `violacoesGraves` (verificação de acessibilidade) nos dois projetos.
- O texto está em português do Brasil e não há status HTTP à vista. As mensagens de erro vêm do catálogo por código.

Chromebook fraco: ok.
- A tela é um chunk `lazy` próprio, baixado só por quem abre o item.
- Não há imagem, upload nem fonte nova.
- A lista é fixa, com 12 categorias e 8 prazos fixos, então não precisa de virtualização.
- A `Tabela` monta só uma estrutura por vez.
- Não há animação.

Celular: ok.
- A `Tabela` vira lista abaixo de 768 px.
- O e2e checa `larguraExcedente` igual a 0.
- Nada depende de hover.
- O e2e usa `tap` quando há toque, no projeto `celular`.
- O botão "Tentar de novo" é o `Botao` padrão da casa.
- A tela é só leitura, então não exige celular.

Ação oficial protegida: sim, não se aplica. A tela só lê `GET /v1/privacidade/retencao`. Não há escrita, nota nem aprovação.

Segurança e recomeço do cache (do lado do front):
- A escola vem do token, e a chave de consulta não leva escola.
- `main.tsx` chama `resetQueries` na troca de sessão.
- Os e2e "segunda pessoa" e "troca de escola" provam que a retenção anterior não aparece, nem durante o carregamento.
- A navegação só mostra Privacidade à coordenação. O teste de unidade em `navegacao.test.ts` cobre professor e aluno.
- O bloqueio real continua na API.

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
1. `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx:28` e `Retencao.tsx:44`.
   - O parágrafo "Seus dados e a lei…" sob o `Tela` contraria o que o próprio `Tela.tsx` diz: aba de navegação não tem título nem descrição (D72, `docs/interface.md` seção 6).
   - O `apoio` do `CabecalhoDeSecao` diz "É com esse prazo que o expurgo trabalha". "Expurgo" é termo interno. Algo como "É por esse prazo que o sistema apaga o dado" fala a língua da coordenadora.
2. `Privacidade.tsx:14`. A aba única numa linha de abas é só um rótulo. É coerente com a decisão de cada aba chegar com a tarefa dela, mas deixa um controle que não muda nada até a 8.0.
3. `docs/interface.md` seção 11.1. A lateral da coordenação está plana em `navegacao.ts`, e a tabela de 11.1 ainda a descreve em grupos (proposta). Vale registrar no `/validar` que o grupo "Conformidade" ainda não existe na lateral.
4. As mutações de e2e da tabela do `6_task.md` (`isPending`, `isError`, `Redirect`, colunas de prazo e origem) não foram rodadas isoladas. O custo é de cerca de 25 minutos por rodada, e a Mesa decide. O teste de unidade e a asserção de texto exato cobrem as cláusulas de texto.
5. `e2e/privacidade.spec.ts:~125`. O teste de troca de escola espera a virada de 30 s do TOTP e pode levar quase 90 s. Isso é frágil na esteira e vale monitorar.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Retencao.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/textos-da-retencao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/privacidade.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/privacidade.spec.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-09 06:05:16 · `tasks/prd-lgpd-e-titular/6_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A tela da tarefa 6.0 só lê `GET /v1/privacidade/retencao`, que devolve o catálogo de categorias (descrição, prazo em meses, de quando conta, origem `padrao` ou `ajustada`, qual trava encurtou o prazo) e os prazos fixos. Isso é configuração da escola, não dado de pessoa. O esquema de saída é `z.strictObject` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/retencao.ts:168-190`) e deixa de fora `alterada_por` e `referencia_contrato`, que ficam com a operação.

Fora da tabela de dados do docs/lgpd.md: nenhum. A tarefa não cria campo. O ajuste de retenção (`retencao_escola.alterada_por`) já está na tabela, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/lgpd.md:90`, com finalidade e retenção.

Autorização por objeto: ok.
- A escola vem do token. A chave de consulta (`['privacidade','retencao']`) não leva escola e a tela não manda escola nenhuma.
- A guarda de papel e a resposta igual para "não encontrado" e "sem permissão" ficam na API, que é da tarefa 2.0 e não mudou aqui.
- O item da lateral só aparece para a coordenação, e o teste de unidade prova que professor e aluno não o têm. Esconder o item não protege nada sozinho (regra 00, item 1); quem protege é a API.
- O recomeço do cache funciona: `resetQueries` roda na troca de sessão (`apps/web/src/main.tsx:26-27`). Os e2e da troca de escola e da segunda pessoa na mesma aba provam que a retenção anterior não aparece. O da troca de escola é estrito: segura a resposta da escola nova e confere que o ajuste da anterior não aparece enquanto ela carrega.

Logs: limpos. Não há `console` nem log no código novo. O erro na tela vem do catálogo por código (`EstadoErro`), sem stack trace e sem dado.

Auditoria: não exigida nesta tarefa. Ler o prazo de guarda da própria escola não é leitura de dado de aluno, nem exportação, nem alteração de nota ou de permissão. A alteração de prazo continua auditada na operação (`retencao.ajustada`), fora deste diff.

Envio externo: nenhum.

Seed/fixture: sintético. `ajustarRetencaoDaEscola` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/__fixtures__/sessao.ts:192-203`) grava o apelido `equipe-de-teste`, o contrato `1` e escolas criadas pelo próprio teste.

Pergunta de fechamento: esta tarefa não piora a resposta e melhora a parte de retenção. A coordenação passa a ver por quanto tempo cada dado é guardado e de onde vem cada prazo. O pedido do titular ("tudo o que existe sobre o aluno e para onde foi") é das abas 8.0 e 10.0, que estão fora do escopo desta tarefa e serão auditadas lá.

Bloqueantes: nenhum.

Recomendações:
1. O apoio da seção diz "É com esse prazo que o expurgo trabalha" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Retencao.tsx:45`). "Expurgo" é termo interno. Para a coordenadora responder à família, ajuda mais algo como "Passado esse prazo, o sistema apaga o dado".
2. Nesta tela, "Ajustado pela escola" é tecnicamente um ajuste feito pela operação a pedido da escola, por contrato. O texto está correto, já que a escola é a controladora, mas no `/validar` vale conferir que a tela não sugira que a coordenação pode mudar o prazo por ali. Ela não pode: a tela é só leitura.
3. No `/validar`, registrar o e2e de "professor digita `/coordenacao/privacidade`", que o `test-engineer` já pediu. A API cobre o bloqueio, mas o cenário de permissão vista pela tela ainda não tem teste.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-09 06:05:54 · `tasks/prd-lgpd-e-titular/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, test, e2e)`)
Bloqueantes: nenhum

Escopo e aderência: a tarefa entrega só a aba de retenção, sem as abas da 8.0, 10.0 e 16.0. A aba fica no endereço, como pede a `techspec.md` §9, e a tela lê `GET /v1/privacidade/retencao` com o esquema de `packages/shared`. Não há escrita e não sai dado de quem ajustou o prazo. A divergência declarada como "nenhuma" bate: a lateral da coordenação continua sem grupos em nenhum item, então pôr Privacidade no fim da lista não é desvio novo.

Recomendações:
1. `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx:26`: o parágrafo "Seus dados e a lei…" contraria o que o próprio `Tela.tsx:12-14` diz: tela aberta pela navegação não tem título nem descrição visíveis (D72, `docs/interface.md` 6). Tirar o parágrafo.
2. `apps/web/src/areas/coordenacao/privacidade/Retencao.tsx:45`: "É com esse prazo que o expurgo trabalha". "Expurgo" é palavra nossa, não da coordenadora. Algo como "É por esse prazo que o sistema apaga o dado".
3. A aba inicial está escrita em dois lugares: `'retencao'` em `apps/web/src/areas/coordenacao/rotas.tsx:43` e `ABA_INICIAL` em `Privacidade.tsx:13`. Quando a 8.0 puser Pedidos na frente, os dois precisam mudar juntos. Melhor ter uma fonte só: exportar a constante, ou mandar `/privacidade` para a `Privacidade` sem aba e deixar o redirecionamento que ela já tem resolver.
4. O comentário em `e2e/privacidade.spec.ts:75` ainda diz "Uma categoria que nenhuma trava toca", mas `consumo_por_aluno` tem o prazo encurtado pela trava de `conversa_tutor`. O `test-engineer` já apontou isso na 2ª rodada. Texto certo: "Uma descrição que nenhum texto de trava cita".
5. Em `docs/interface.md:312-315`, "é a aba que existe hoje" vai ficar velho com a 8.0. Fica para quem fizer a 8.0 atualizar.
6. "Recomendações sem aplicar" em `tasks/prd-lgpd-e-titular/6_task.md` ainda diz "nenhuma", mas o `test-engineer` (1ª e 2ª rodadas) e o `frontend-reviewer` deixaram recomendações em aberto. A tabela da Mesa precisa ser copiada para lá antes do commit, como manda o passo de `executar-task`.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Retencao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/rotas.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/privacidade.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/interface.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/6_task.md

## test-engineer · 3ª rodada · APROVADO · 2026-10-09 09:12:55 · `tasks/prd-lgpd-e-titular/6_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 2ª rodada. Nesta rodada só conferi o diff `.processo/ordens/diff-6-r2-r3.txt` e o que ele afeta:
- A segunda pessoa na mesma aba não vê a retenção da anterior. É o isolamento na troca de sessão, e a mutação do `resetQueries` agora deixa o teste vermelho.
- A troca de escola não mostra o ajuste da escola anterior.
- O endereço sem aba, ou com uma aba que não existe, cai na aba inicial.
- Os textos da tela.

Cobertos:
- **Segunda pessoa na mesma aba** (`e2e/privacidade.spec.ts`, de `const segunda` até a última asserção): o teste ficou mais forte. A resposta de `GET /v1/privacidade/retencao` fica segurada por `portao()` e `page.route`. Antes de soltar a resposta, o teste confere duas coisas: o estado "Carregando os prazos de guarda…" aparece, e "Ajustado pela escola" não aparece. Sem o `clienteConsultas.resetQueries()` do `main.tsx`, o React Query mostraria o dado em cache da primeira pessoa e o "carregando" nunca apareceria, então o teste falha. A rota é registrada só depois do logout da primeira pessoa e não atrasa a primeira entrada. O registro do implementador diz que essa mutação foi rodada e ficou vermelha no `chromebook`. Isso fecha a recomendação 1 da 1ª rodada: o teste não depende mais de tempo.
- **Troca de escola**: já usava o mesmo padrão de resposta segurada. Não mudou.
- **`ABA_INICIAL_DA_PRIVACIDADE`**: é só refatoração, não muda comportamento. Os dois e2e de endereço continuam provando o valor. Trocar a constante tira a URL de `…/retencao` nos dois, e a tabela de Mutações registra isso.
- **Textos**: o parágrafo "Seus dados e a lei…" saiu e o apoio do `Retencao.tsx` foi trocado. Nenhum teste e nenhuma asserção dependia desses textos (procurei em `apps/web/src`, `e2e` e `docs/interface.md`). O texto novo, "É por esse prazo que o sistema apaga o dado", não sugere que a coordenação muda o prazo.
- **Comentário da coluna "Dado"**: está corrigido, como a 2ª rodada pediu.

Bloqueantes: nenhum.
- Nada de `.skip`, teste comentado ou asserção que sempre passa no diff.
- O `page.route` só segura a resposta e chama `rota.continue()`. A resposta é a da API real, sem mock que esconda a regra.
- A tabela de Mutações tem linha para cada cláusula nova do diff: `ABA_INICIAL_DA_PRIVACIDADE` e o `resetQueries`.

Recomendações:
1. O par `portao()` + `page.route` para segurar `/v1/privacidade/retencao` agora se repete três vezes em `e2e/privacidade.spec.ts`. Vale extrair para um ajudante, por exemplo `segurarRetencao(page)`, que devolva o `abrir`.
2. `ABA_INICIAL_DA_PRIVACIDADE` em `caminhos.ts` e `ABAS_DA_PRIVACIDADE[0].id` em `Privacidade.tsx` podem divergir quando a 8.0 puser a segunda aba. Os e2e de endereço pegam a divergência, mas um teste de unidade barato (`ABAS_DA_PRIVACIDADE[0].id === ABA_INICIAL_DA_PRIVACIDADE`), ou derivar uma da outra, avisaria antes. Fica para a 8.0.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/privacidade.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/caminhos.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/rotas.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Retencao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/6_task.md

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-09 09:13:37 · `tasks/prd-lgpd-e-titular/6_task.md`

VEREDITO: APROVADO

Estados: ok. O estado "carregando" ("Carregando os prazos de guarda…") tem teste de tela que segura a resposta de retenção. A segunda pessoa na mesma aba não vê o ajuste da primeira enquanto a resposta não chega. Os outros estados (erro, vazio e com dado) não mudaram nesta rodada.

Acessibilidade: ok. O diff não mexe em teclado, foco, contraste nem rótulos. A linha de abas mantém o rótulo "Seções de Privacidade". O status de carregando é lido por `getByRole('status')`.

Chromebook fraco: ok. Nada novo pesa no cliente. Só saem um parágrafo e uma constante duplicada, e entra uma constante exportada em `caminhos.ts`.

Celular: ok. A tela e o e2e continuam nos projetos `chromebook` e `celular`, e o teste da segunda pessoa passa por `hasTouch`. Não há dependência de hover nem de atalho.

Ação oficial protegida: sim. A tela é só leitura, sem nenhuma ação oficial.

Bloqueantes: nenhum. Conferi as mudanças do diff:
- **Parágrafo removido:** a remoção de "Seus dados e a lei…" não tira nenhum estado nem rótulo da tela.
- **Aba inicial:** `ABA_INICIAL_DA_PRIVACIDADE` agora vem de um só lugar (`apps/web/src/caminhos.ts:98`). `rotas.tsx:44` e `Privacidade.tsx:21` usam a mesma constante, e não sobrou nenhuma cópia do literal `'retencao'` fora de `ABAS_DA_PRIVACIDADE`.
- **Texto da retenção:** "expurgo" saiu do apoio da seção em `Retencao.tsx`, que agora diz "É por esse prazo que o sistema apaga o dado." Isso resolve o termo técnico que vazava para a coordenação (item 7).
- **E2E do carregando:** o teste usa `portao()`, `CARREGANDO` e `AJUSTADO`, e os três estão definidos e importados em `e2e/privacidade.spec.ts`.

Recomendações:
- Registro em `6_task.md`: as mutações de e2e marcadas "não rodada" seguem sem prova isolada. A que cobre `ABA_INICIAL_DA_PRIVACIDADE` é coberta por construção pelos dois e2e de endereço, então não bloqueia. O `/validar` pode pedir a rodada delas.
- Pendências de outras tarefas, já registradas em `6_task.md` e que seguem para o `/validar` e a tarefa 8.0:
  - o grupo "Conformidade" que `docs/interface.md` 11.1 descreve na lateral e que não existe em `navegacao.ts`;
  - o parágrafo "é a aba que existe hoje" do mesmo documento, que envelhece com a segunda aba;
  - a confirmação de que a tela não sugere que a coordenação muda o prazo.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-09 09:14:05 · `tasks/prd-lgpd-e-titular/6_task.md`

VEREDITO: APROVADO

Esta é a 3ª rodada. Auditei só o que mudou desde a rodada aprovada (`.processo/ordens/diff-6-r2-r3.txt`) e o que essa mudança alcança. A rodada anterior não deixou correção exigida.

Campos pessoais tocados: nenhum. A mudança é só de tela (um texto, uma constante de rota), de um teste e1e e do registro da tarefa.

Fora da tabela de dados do docs/lgpd.md: nenhum.

Autorização por objeto: ok, porque nada mudou aqui. A tela continua só de leitura. Quem bloqueia o acesso é a API, entregue na tarefa 2.0 e já auditada. A constante `ABA_INICIAL_DA_PRIVACIDADE` (`apps/web/src/caminhos.ts:98`) só decide qual aba abre quando o endereço não traz aba ou traz uma que não existe. Ela não abre nenhum caminho novo para a API.

Logs: limpos. Nenhum `console.` nos arquivos da tarefa.

Auditoria: não se aplica a este diff. A retenção é configuração da escola, não dado de aluno, e não houve exportação, alteração de nota, alteração de permissão nem aprovação de saída de IA.

Envio externo: nenhum.

Seed/fixture: sintético. O e2e cria a equipe com `criarEquipeComSenha`, a outra escola com `criarUsuarioEmOutraEscola` e o ajuste de prazo com `ajustarRetencaoDaEscola`, todos em `e2e/__fixtures__/sessao.ts`.

Bloqueantes: nenhum.

O que esta rodada melhorou para a privacidade:
- O teste e2e "a segunda pessoa na mesma aba não vê a retenção da anterior" (`e2e/privacidade.spec.ts:185-206`) agora segura a resposta da API. Enquanto ela não chega, o teste confere que a tela mostra "carregando" e não mostra o prazo ajustado pela primeira pessoa. Isso prova de verdade que o cache é limpo na troca de sessão (`clienteConsultas.resetQueries()` em `apps/web/src/main.tsx:26-27`). A mutação foi rodada no `chromebook`: sem o reset, o teste fica vermelho. Antes, o teste podia passar mesmo com o dado da sessão anterior aparecendo por um instante.
- O texto de apoio de `Retencao.tsx:45` agora diz "É por esse prazo que o sistema apaga o dado." É linguagem comum e não sugere que a coordenação muda o prazo.

O que conferi no `6_task.md`: a recomendação que fiz na 1ª rodada (a tela não pode sugerir que a coordenação muda o prazo) ficou registrada para o `/validar`, e a tela continua só de leitura. O e2e de "professor digita `/coordenacao/privacidade`" também ficou para o `/validar`, e a recusa real já está na API da 2.0.

Recomendações:
- No `/validar` desta funcionalidade, rodar o cenário do professor que digita `/coordenacao/privacidade` direto, como prova de permissão vista pela tela.
- Lembrete: `ABA_INICIAL_DA_PRIVACIDADE` (`apps/web/src/caminhos.ts:98`) e a primeira entrada de `ABAS_DA_PRIVACIDADE` (`apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx:12`) são dois valores que precisam andar juntos. Quando a 8.0 puser a segunda aba, vale ligar um ao outro, para a aba inicial não apontar para uma aba que deixou de existir.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-09 09:14:07 · `tasks/prd-lgpd-e-titular/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, e2e)
Bloqueantes: nenhum

Nesta rodada li o diff desde a 1ª rodada e os arquivos afetados inteiros (`Privacidade.tsx`, `Retencao.tsx`, `rotas.tsx`, `caminhos.ts` e o trecho do `e2e/privacidade.spec.ts`). A 1ª rodada não exigiu correção, então não havia correção a conferir.

- **Aba inicial:** agora vem de uma constante só, `ABA_INICIAL_DA_PRIVACIDADE` em `caminhos.ts`. O redirecionamento de `rotas.tsx` e o de `Privacidade.tsx` usam essa constante, e não sobrou nenhum `'retencao'` escrito à mão nesses dois lugares.
- **Parágrafo removido:** o "Seus dados e a lei…" saiu da tela. A techspec e o `docs/interface.md` 3 usam essa expressão para descrever o item da navegação, não pedem um parágrafo na tela, e nenhum e2e conferia esse texto. O comentário da função ainda usa a expressão, o que continua coerente com a techspec.
- **Texto da seção em `Retencao.tsx`:** trocou "expurgo", palavra técnica, por "o sistema apaga o dado". A tela continua só de leitura.
- **Teste da segunda pessoa na mesma aba:** a interceptação da `/v1/privacidade/retencao` fica armada antes do login. Assim dá para conferir que a tela mostra "carregando" e não mostra o ajuste da primeira pessoa antes de a resposta chegar. Sem isso, o teste passaria mesmo que a tela mostrasse por um instante o dado guardado da sessão anterior. Esse teste é o que prova o `resetQueries` da troca de sessão, e a mutação dele foi rodada e registrada.
- **`6_task.md`:** as seções "Mutações" e "Recomendações sem aplicar" estão preenchidas, e cada recomendação recusada ou adiada tem destino (8.0 ou `/validar`) e motivo.

Recomendações:
- O valor de `ABA_INICIAL_DA_PRIVACIDADE` (`caminhos.ts:98`) e o primeiro `id` de `ABAS_DA_PRIVACIDADE` (`Privacidade.tsx:12`) continuam sendo duas fontes, ligadas só pelo comentário. Quando a 8.0 trouxer a segunda aba, vale tirar a inicial da lista de abas, ou tipar a constante como um dos ids dessa lista, para que as duas não se separem.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Retencao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/rotas.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/caminhos.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/privacidade.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/6_task.md

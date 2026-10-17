# Achados das revisões — `tasks/prd-telas-da-coordenacao/8_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-17 14:08:27 · `tasks/prd-telas-da-coordenacao/8_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A tela mostra o que já existia no `Material` de `@educa/shared`: título, disciplina, titularidade, licença, páginas, falha e o **licenciante**. O licenciante é o único que pode ser o nome de uma pessoa, um autor. O esquema é estrito, e `packages/shared/src/material/material.test.ts:58` recusa `enviadoPor`, `sha256`, `texto` e `escolaId`. Nenhum dado de aluno passa pela tela.

Fora da tabela de dados do docs/lgpd.md: nada. O licenciante está em `docs/lgpd.md:86`, com finalidade, base e retenção.

Autorização por objeto: ok.
- `?material=` leva só o id (`apps/web/src/caminhos.ts`, `PARAMETRO_DO_MATERIAL`).
- O painel só abre um material que esteja na lista que a API já devolveu para a escola (`materiais-da-escola.ts`, `materialDoEndereco`). Um id de outra escola não abre nada nem confirma que o material existe.
- O e2e prova isso: `e2e/material.spec.ts:468-505` abre o id de A na sessão de B, com a leitura da lista segurada. Não aparece painel nem o título de A.
- O painel não faz pedido próprio à API, então não há rota nova para trocar o id.
- A exclusão e o "Tentar de novo" usam o endpoint de hoje, que é escopado no repository (`material.repository.ts:189,202`).

Logs: limpos. Não há `console.*`, `localStorage` nem `sessionStorage` nos arquivos novos ou alterados. O log da API que já existia (`material.service.ts:129,267`) registra só o evento e os ids.

Auditoria: presente.
- A recusa por licença continua indo à API, sem o arquivo, e é gravada como `material.recusado`. O e2e prova as duas coisas: o corpo do pedido sai sem o arquivo (`e2e/material.spec.ts:228`) e a recusa está na auditoria (`e2e/material.spec.ts:246,256`). O teste de componente "o pedido: a recusa sai sem o arquivo" tem uma mutação declarada.
- A exclusão, inclusive a automática que o "Tentar de novo" faz depois do envio novo dar certo, passa pelo mesmo endpoint, que grava `material.excluido` na mesma transação (`material.service.ts:264`).

Envio externo: nenhum. A tarefa só mexe na tela.

Seed/fixture: sintético. Os títulos são "Capítulo sem texto" e "Capítulo da escola A", as equipes são criadas pela fixture, e o PDF é o de demonstração gerado por nós.

Bloqueantes: nenhum.

Recomendações:
- `apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx`, no `onSuccess`: quando o "Tentar de novo" dá certo, o material que falhou é excluído por um segundo pedido, e um erro nesse pedido é engolido (`.catch(() => undefined)`). O material que falhou continua na lista sem a pessoa saber por quê. Nada vaza, mas o recomendado é a API fazer a troca numa operação só, com um registro de auditoria que ligue o material antigo ao novo. Também cabe avisar na tela quando a exclusão falhar.
- A recusa que fica na tabela vive só no estado do componente. Hoje ela some ao sair da sessão porque a tela é desmontada. Vale um teste de componente que prove que `aoTrocarDeSessao` também limpa as recusas, para não depender dessa desmontagem se a moldura mudar.

Pergunta de fechamento: a tarefa não toca dado de aluno nem envio externo. O único dado de pessoa por perto, quem enviou, quem excluiu e o licenciante, segue respondido pela auditoria (`material.enviado`, `material.excluido`, `material.recusado`) e pela retenção já registrada em `docs/lgpd.md:86`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Material.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/PainelDoMaterial.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/materiais-da-escola.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/material.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/__fixtures__/fluxo-do-professor.ts

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-17 14:08:44 · `tasks/prd-telas-da-coordenacao/8_task.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: sim, 8 fotos lidas, cheia e vazia, no computador e no celular, com e sem o diálogo "Enviar material". A foto do Professores no celular também, para comparar a moldura. As duas escolas da vitrine não têm material, então a **tabela com linhas e o painel lateral da linha não foram vistos**. Eles foram revisados só pelo código (`Material.tsx`, `PainelDoMaterial.tsx`, `materiais-da-escola.ts`, `Tabela.tsx`) e pelo teste de componente, e precisam ser vistos na validação.

Estados: ok.
- Carregando: `Material.tsx:166`.
- Erro: `EstadoErro` com "Tentar de novo". A releitura que falha com a lista à vista vira aviso `secundario`.
- Vazio: convida, "Envie o primeiro PDF da escola…", com "Enviar material" (foto cheia e vazia).
- Com dado: tabela com o que falhou primeiro. Foi lida só no código.

Acessibilidade: sem bloqueante.
- O diálogo é nativo e modal, e o foco inicial vai ao botão do arquivo.
- Todo campo tem rótulo, e o erro vai por `aria-describedby`.
- O arquivo entra pelo botão ou por arrastar.
- A situação é dita em texto, não só em cor.
- A linha abre por um botão de 44 px.
- O foco volta ao título da lista quando o botão que abriu saiu da tela.

Chromebook fraco: sem bloqueante. A tabela não virtualiza nem tem teto de linhas (ver recomendações). A releitura de 1,5 s só corre enquanto há material processando.

Celular:
- Em 360 px não há rolagem horizontal nas fotos.
- A tabela vira lista abaixo de 768 px.
- "Enviar material" tem mais de 44 px.
- O diálogo rola por dentro (`Dialogo.tsx`: `max-h-[calc(100svh-2rem)] overflow-y-auto`), então "Cancelar" e "Enviar" ficam alcançáveis.
- Nada depende de hover.
- O e2e roda nos dois projetos.

Ação oficial protegida: sim.
- Excluir material é `perigo`, e a confirmação mostra material, disciplina, situação e o efeito antes de confirmar.
- O envio exige a declaração marcada. Sem licença ou sem declaração, a recusa fica à vista na tabela.
- "Tentar de novo" reabre o formulário com a declaração desmarcada.

Bloqueantes:
1. `apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx:219`. A foto `coordenacao--coordenacao-material--Enviar-material--computador.png` (e a `vazia--…--Enviar-material--computador.png`) mostra o texto do campo cortado em 1366 px: "Escolha o dono do cor…".
   - A grade `md:grid-cols-2` põe "Disciplina" e "De quem é o material" lado a lado numa caixa de 520 px, cerca de 228 px por campo.
   - As opções de `NOME_DA_TITULARIDADE` têm até 42 caracteres ("Material de autoria de professor da escola"). Depois de escolher, a coordenadora não consegue ler a titularidade que declarou, e essa declaração é o que dá base legal ao material (D5, D75).
   - Correção exigida: tirar o `md:grid-cols-2` e deixar os dois campos empilhados, como já ficam a 360 px. Breakpoint não resolve, porque a caixa tem largura fixa.
   - Teste exigido: um e2e que escolhe a opção mais longa de titularidade e prova que o valor do `select` cabe, com `scrollWidth <= clientWidth` no projeto `chromebook`. Hoje `larguraExcedenteDoDialogo` não pega esse corte.

Recomendações:
- A Tech Spec §7 diz "Material, Pedidos e IA têm teto de linhas com 'Mostrar mais'", e a `revisao-spec.md` pede isso na 8.0. A 8.0 não o entrega nem o registra em Divergências. A lista pode ir a 1.000 linhas sem virtualização. Entregar o teto com um caso de "material com falha antes do corte", ou registrar o adiamento no `TODO.md`.
- No celular, a barra de abas da Escola quebra em duas linhas: "TURMAS, PROFESSORES" em cima e "MATERIAL" embaixo (`Escola.tsx` ou a moldura). Isso vem de antes desta tarefa, não esconde ação e afeta as três abas. Vale um ajuste na moldura: abas com rolagem própria ou texto mais curto.
- O texto de "sem disciplina na escola" cita "Escola › Turmas" sem link. Um botão que leve à aba ajudaria.
- Nenhum teste prova o texto do botão "Dispensar" lido por leitor de tela ("o aviso de <título>"). Cobrir no componente.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx`, `Material.tsx`, `PainelDoMaterial.tsx` e `materiais-da-escola.ts` (todos na mesma pasta).

## revisor-geral · 1ª rodada · APROVADO · 2026-10-17 14:09:27 · `tasks/prd-telas-da-coordenacao/8_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum

Conferi as subtarefas 8.1 a 8.6 no código. As cinco divergências da tarefa estão descritas em `techspec.md` §9, no parágrafo "Como ficou na 8.0". O `material-envio.ts` não mudou, como a tarefa exigia. Nada do que ficou fora do escopo entrou: "Retirar do uso", "Enviar outra versão", o campo "Dono" e a frase sobre treino de IA. O `?material=` leva só o id, e um id que a lista da escola não tem não abre nada. Os testes de unidade, de componente e o e2e cobrem cada linha da tabela de testes da tarefa. Não há `.skip`, `any` nem `TODO`.

Recomendações:
1. O texto de conflito do envio ficou errado com o formulário dentro do diálogo. Ele diz "Procure o material na lista abaixo." (`TEXTOS_DA_FALHA_DO_ENVIO[CONFLITO]`), mas agora aparece dentro do diálogo, com a lista por trás dele, e não abaixo. O texto do vazio foi corrigido pelo mesmo motivo ("pelo formulário acima"). Como a tarefa congelou esse arquivo, o ajuste vai para o `TODO.md` ou para a próxima tarefa que tocar no envio.
   - Arquivo: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/material-envio.ts:159`
2. Ficou código morto em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/material-envio.ts`:
   - `origemDoMaterial` (linha 152) agora só é usada pelo próprio teste.
   - O ramo `'Falhou'` de `textoDoEstado` (linha 147) nunca aparece mais na tela, porque `textoDaSituacaoDoMaterial` o substitui por "Não carregou".
   - Registrar no `TODO.md` para tirar quando o arquivo puder mudar.
3. O link do sino para o material monta o parâmetro com o texto `'material'` escrito à mão, em vez de usar o `PARAMETRO_DO_MATERIAL` criado nesta tarefa. O professor já tem uma função de caminho em `caminhos.ts` para isso. Com dois jeitos de escrever o mesmo endereço, um renome quebra o sino sem ninguém ver.
   - Arquivo: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts:121`
4. A coluna Licença traduz o nome da licença de dois jeitos: o material usa `NOME_DA_LICENCA` e a recusa procura o rótulo em `OPCOES_DE_LICENCA`. Vale uma função só, em `materiais-da-escola.ts`.
   - Arquivo: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Material.tsx:56`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-17 14:10:15 · `tasks/prd-telas-da-coordenacao/8_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz:** a tabela com o que falhou primeiro; enviar com licença; o painel pelo clique e pelo endereço; "Tentar de novo" troca o material que falhou; excluir pelo painel.
- **Bordas:**
  - recusa sem licença e sem declaração;
  - arquivo que não é PDF, e dois arquivos de uma vez;
  - formulário incompleto;
  - escola sem disciplina;
  - releitura que cai com a lista vazia e com a lista à vista;
  - processando que vira pronto e para de reler;
  - o seletor de arquivo fechado sem escolha;
  - reabrir o diálogo começa limpo;
  - o material que outra pessoa já excluiu;
  - a resposta que chega com o diálogo fechado ou com outro já aberto.
- **Permissão e isolamento:** o `?material=` de outra escola não abre nada, nem com a coordenação de B na aba da de A.
- **Concorrência:** clique duplo em enviar.

**Cobertos:**
- Os quatro estados e o foco depois de enviar e de excluir (`Material.test.tsx`).
- A ordem da tabela, o texto da situação, o material que o endereço abre e o rascunho do "Tentar de novo" (`materiais-da-escola.test.ts`).
- Os nove casos do e2e `material`, já dentro do diálogo, mais a segunda pessoa, o painel pelo endereço, o id desconhecido, a falha com o diálogo aberto e o "corrigir e reenviar".
- `roteiro-da-demonstracao` e `fluxo-do-professor` abrem o diálogo antes de preencher.
- Não há `.skip`, `.only` nem mock de coisa nossa: a rede é falsa por caminho e o resto é a tela de verdade.
- Os 47 testes de unidade e de componente passam. O e2e não rodei: ele sobe o ambiente inteiro, e o portão da tarefa já o roda.

**Bloqueantes:**

1. **`Material.tsx:239`: a resposta que chega com o diálogo fechado não tem teste.**
   - O que está errado: `dialogo.fecharSeAinda(aberta)` existe para que a resposta atrasada não feche um diálogo reaberto. É exatamente o bug da correção `2026-09-25-resposta-atrasada-fecha-o-dialogo-reaberto`, e o comentário em `DialogoDeEnvioDeMaterial.tsx:63-64` afirma esse comportamento. O bloco atual só apaga a linha, o que prova que o diálogo fecha, mas não que ele fecha só o próprio. Trocar a linha por `fecharDialogo()` deixa a suíte verde.
   - Correção exigida, um teste de componente em três passos:
     - segurar o `POST` com uma promessa controlada e fechar o diálogo pelo "Cancelar";
     - reabrir "Enviar material", digitar um título e soltar a resposta: o diálogo reaberto continua aberto, com o título digitado;
     - repetir com a resposta `MATERIAL_SEM_LICENCA` e o diálogo já fechado: a recusa entra na tabela mesmo assim.
   - E o bloco de mutação: `- dialogo.fecharSeAinda(aberta)` / `+ fecharDialogo()`.

2. **`Material.tsx:116`: a reserva do foco não tem teste nem bloco.**
   - O que está errado: quando o título da lista não está na tela, `focarNaLista` manda o foco ao título da moldura (`tituloDaLista.current === null ? focarOTituloDaMoldura() : …`). O único caso que chega nessa reserva é o teste `Material.test.tsx:570` (o primeiro envio cuja releitura cai), e ele não confere `document.activeElement`.
   - Correção exigida: nesse teste, conferir que o foco foi ao título da moldura, e não ao `body`. Se o componente de teste não monta a moldura, provar no e2e. Mais o bloco que troca a reserva por `tituloDaLista.current?.focus()`.

3. **Cláusulas novas sem bloco de mutação.** Os testes que as provam já existem; falta só o bloco, e cláusula nova sem bloco é bloqueante por si:
   - `Material.tsx:42`: só a linha de material vira botão que abre o painel; a recusa não. Teste em `Material.test.tsx:668`.
   - `Material.tsx:52`: a Disciplina da linha de recusa vem de `linha.recusa.disciplinaId`. Teste em `Material.test.tsx:669`.
   - `Material.tsx:56`: a Licença da recusa vem do rótulo de `OPCOES_DE_LICENCA`. Teste em `Material.test.tsx:670`.
   - `Material.tsx:128`: `abrirPainel` põe só o id no endereço (regra 20, item 9). Teste em `Material.test.tsx:253`. Bloco sugerido: passar o título no lugar do id.
   - `Material.tsx:295`: a confirmação de excluir diz "Não carregou" (`textoDaSituacaoDoMaterial` no lugar de `textoDoEstado`). Teste em `Material.test.tsx:372`.

**Recomendações:**
- O teste `Material.test.tsx:869` ("enquanto o envio está no ar") clica uma vez e confere o botão desabilitado. Um segundo clique de verdade com o pedido no ar, contando um `POST` só, provaria a guarda `noAr` de `useEnvioUnico` nesta tela.
- `cheios()` (`Material.test.tsx:140`) acha o botão cheio pela classe `bg-laranja`. Se o token de cor mudar de nome, o teste passa a afirmar uma lista vazia, sem acusar nada.
- As recusas ficam em `useState` e não se limpam na troca de sessão, que só fecha o diálogo. Isso já existia antes desta tarefa; fica para o `privacy-guardian` e o `TODO.md`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/8_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Material.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/PainelDoMaterial.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/materiais-da-escola.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Material.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/materiais-da-escola.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/material.spec.ts

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-17 14:33:05 · `tasks/prd-telas-da-coordenacao/8_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: o diálogo "Enviar material" no computador e no celular, com a escola cheia e com a vazia). Não há foto da tabela com linhas nem do painel lateral. Esses dois eu revisei só pelo código e pelos testes de componente.
Estados: ok. O vazio convida a enviar o primeiro material. Carregando, erro com "Tentar de novo" e com dado ficam no código e em `Material.test.tsx`. O foco quando a releitura cai sem lista agora vai ao título da moldura (teste novo).
Acessibilidade: ok. Os campos têm rótulo. O "Dispensar" agora diz qual aviso tira, pelo nome acessível (`Dispensar o aviso de <título>`). O foco inicial e o foco devolvido estão testados.
Chromebook fraco: ok. Nada pesado foi acrescentado. A tabela sem teto de "Mostrar mais" já está declarada como divergência e no `TODO.md`.
Celular: ok, com uma ressalva registrada.
- Na foto de 360 px não há rolagem horizontal. Os três campos estão empilhados e o texto do placeholder "Escolha o dono do conteúdo" cabe.
- O botão "Cancelar" aparece cortado só porque a foto é a primeira tela do diálogo, que rola por dentro.
- A opção de 42 caracteres, "Material de autoria de professor da escola", não cabe numa linha a 360 px. O `TODO.md` registra isso em (X2, 8.0) item (g).
- O e2e mede a largura só no computador (`if (hasTouch) return`).

Ação oficial protegida: sim. O envio exige a declaração marcada e a licença. A recusa por licença fica à vista na tabela. Excluir passa por confirmação com a situação e o material à vista.

Correção da rodada anterior:
- `DialogoDeEnvioDeMaterial.tsx:219` não tem mais `md:grid-cols-2`, e os campos ficaram empilhados. A foto de 1366 px mostra "Escolha o dono do conteúdo" inteiro.
- O e2e novo (`e2e/material.spec.ts`, caso "cabe inteiro") escolhe a opção mais longa e confere `scrollWidth <= clientWidth`, mais a medida do texto contra a largura do campo. A mutação que devolve o `md:grid-cols-2` está declarada na tarefa.
- A divergência de layout (campos empilhados) está declarada em `8_task.md` e em `techspec.md`.
- Outras mudanças do diff:
  - A sessão que acaba ou muda de dono fecha o diálogo e apaga as recusas da tabela (`Material.tsx`, regra 20 item 15), com teste.
  - A coluna "Licença" vem de uma função só, `nomeDaLicenca`, com teste.
  - Há testes para a resposta que chega com o diálogo já fechado e para o clique duplo no envio.

Bloqueantes: nenhum.

Recomendações:
- A 360 px, a titularidade escolhida de 42 caracteres fica cortada no `select` (item (g) do `TODO.md`). Encurtar o nome em `NOME_DA_TITULARIDADE` resolve nos dois tamanhos. Enquanto não resolve, o e2e deveria medir isso também no projeto `celular`, em vez de sair no `if (hasTouch) return`.
- Peça uma foto da tabela com linhas e do painel lateral na vitrine, semeando materiais, antes de fechar a spec. Hoje o painel e a tabela cheia só têm teste de componente.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-17 14:33:23 · `tasks/prd-telas-da-coordenacao/8_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum. Esta rodada mexe só na tela da aba Material (layout do diálogo, nome da licença na coluna, limpeza ao trocar de sessão) e nos testes. Não muda API, migration, DTO, log nem envio externo.

**Fora da tabela de dados do docs/lgpd.md:** nada. Nenhum campo novo.

**Autorização por objeto:** ok. Nesta rodada não mudou. O painel continua abrindo só pelo id (`?material=<id>`), e um id que não está na lista da escola não abre nada. A mutação que põe o título no endereço continua declarada em `8_task.md` e tem teste.

**Logs:** limpos. Não há `console.*` em `Material.tsx`, `DialogoDeEnvioDeMaterial.tsx`, `PainelDoMaterial.tsx` nem `materiais-da-escola.ts`.

**Auditoria:** nada novo a exigir. A tela não cria leitura nominal de aluno, exportação, alteração de nota, alteração de permissão nem aprovação de IA. A troca em duas chamadas do "Tentar de novo", sem auditoria ligando o material antigo ao novo, continua registrada no `TODO.md`, item (d) de X2/8.0, como a 1ª rodada pediu.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. O e2e novo usa só rótulos de opção e um PDF de teste. As fixtures em `Material.test.tsx` usam UUIDs inventados e títulos genéricos.

**Correções exigidas na 1ª rodada:** não havia nenhuma. As duas recomendações foram resolvidas.
- A da troca em duas chamadas está no `TODO.md` e na tabela de "Recomendações sem aplicar" de `8_task.md`.
- O teste de que a troca de sessão limpa as recusas existe: "a sessão que muda de dono fecha o diálogo e leva as recusas" (`Material.test.tsx:192`). Ele tem duas mutações declaradas, tirar `definirRecusas([])` e tirar `fecharDialogo()`, e por isso falha se a regra sair. O código está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Material.tsx:119-126`.

**Pergunta de fechamento:** esta rodada não muda a resposta. A recusa por licença existe só na tela: não é gravada, não sai do computador e não vai a terceiro. O que a API guarda do material é o que já existia.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Uma recusa que chega depois da troca de sessão ainda pode entrar na tabela de quem entrou depois. O caso é este: o envio sai, a sessão muda com o pedido no ar, e a recusa chega depois. O `onError` do `useEnvioUnico` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx:120-123`) roda mesmo com o diálogo já fechado, porque o teste da 3ª etapa exige que a recusa atrasada entre na tabela. Ele chama `registrarRecusa` (`Material.tsx:167-171`), que põe o título e a disciplina declarados pela sessão anterior na tabela da pessoa seguinte no mesmo computador. O texto é título de material e não é dado de aluno, por isso não bloqueia. A correção é um contador de sessão no `Material`: ele sobe em `aoTrocarDeSessao`, e `registrarRecusa` descarta a recusa que nasceu de um envio feito antes do último aumento. Vale um caso de teste para isso.
2. O comentário em `Material.tsx:118` cita "regra 20, item 15", que é exclusão lógica e auditada. A justificativa certa para limpar o que fica na tela quando a sessão muda é a regra 10 (cada escola é um mundo fechado) mais o RF14 que `sessao.ts` já cita.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-17 14:33:33 · `tasks/prd-telas-da-coordenacao/8_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As duas divergências novas (a tabela sem teto de linhas com "Mostrar mais", e "Disciplina" e "De quem é o material" empilhados no diálogo) estão na tabela do `8_task.md` e também na `techspec.md` §9, em "Como ficou na 8.0". Não existe `cenarios.md` nesta spec. As subtarefas 8.1 a 8.6 não pedem o "Mostrar mais", então a tarefa não ficou incompleta.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes: nenhum

Correções exigidas na rodada anterior: nenhuma. A recomendação aplicada está feita: `nomeDaLicenca` em `materiais-da-escola.ts:33` é a única tradução da licença, usada pelo material e pela recusa em `Material.tsx:56`.

Recomendações:
- **Seção 7 contradiz a seção 9.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/techspec.md:127` ainda diz "Material, Pedidos e IA têm teto de linhas com 'Mostrar mais'", e a §9 agora diz que Material não tem. Tirar Material da frase da §7, ou apontar ali a exceção da 8.0.
- **O e2e diz mais do que prova.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/material.spec.ts:342` se chama "cabe inteiro, também na opção mais longa", mas `if (hasTouch) return` (linha 351) pula a medida no projeto `celular`, que é justamente onde o corte existe (item (g) do `TODO.md`). Renomear para dizer que a medida vale só na largura do computador, para o relatório do celular não mostrar como provado o que ficou em aberto.
- **Pendência de D51 sem dono de revisor.** O item (g) do `TODO.md` (a 360 px o texto de 42 caracteres sai cortado no `select`) é um defeito no celular e foi para o `TODO.md` sem revisor atribuído. Vale confirmar com o `frontend-reviewer` que ele aceita adiar, já que a regra 50, item 2a, considera incompleta a tela que só funciona no computador.

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 14:34:42 · `tasks/prd-telas-da-coordenacao/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** a resposta do envio que chega com o diálogo fechado e outro diálogo já reaberto, tanto para o envio aceito quanto para a recusa `MATERIAL_SEM_LICENCA`. O foco de reserva quando a lista some (vai ao título da moldura, e não ao `body`). As cláusulas que a 1ª rodada apontou sem bloco de mutação:
- só a linha de material vira botão;
- a Disciplina e a Licença da recusa;
- `abrirPainel` põe só o id no endereço;
- a confirmação de excluir diz "Não carregou".

Também as cláusulas novas desta rodada:
- a troca de sessão fecha o diálogo e apaga as recusas;
- `nomeDaLicenca`;
- o "Dispensar" com o título no nome acessível;
- os campos empilhados no diálogo;
- o clique duplo e o Enter no envio.

**Cobertos:**
1. **Correção 1:** feita. `Material.test.tsx:914` faz os três passos pedidos: segura o `POST` e fecha pelo "Cancelar"; reabre, digita e solta a resposta, e o diálogo reaberto continua aberto com "Outro capítulo"; a recusa atrasada com o diálogo fechado entra na tabela. O bloco `- dialogo.fecharSeAinda(aberta)` / `+ fecharDialogo()` usa a linha `definirAnuncio(TEXTO_DO_ENVIO)` como contexto, o que separa esta chamada da que existe na exclusão (`Material.tsx:266`). Ele fica vermelho na asserção certa: o diálogo reaberto é fechado.
2. **Correção 2:** feita. O teste da linha 597 agora monta com a moldura (`montar('/material', true)`) e espera o foco no `h1` "Escola". O bloco que troca a reserva por `tituloDaLista.current?.focus()` deixa o foco no `body`, então o vermelho vem da regra.
3. **Correção 3:** feita, com um bloco por cláusula:
   - **Linha 49:** o `span` trocado por botão é pego por `queryByRole('button', { name: 'Apostila sem dono' })` estar nulo.
   - **Linha 52:** `''` no lugar da disciplina cai no texto "Disciplina", e a asserção espera "Química".
   - **Linha 56:** `'autoria_da_escola'` no lugar da licença da recusa, e a asserção espera `SEM_LICENCA`.
   - **Linha 137:** o título no lugar do id.
   - **Linha 304:** `material.estado` no lugar do texto, e a confirmação deixa de conter "Não carregou".
4. **Troca de sessão:** dois blocos, um tirando `definirRecusas([])` e outro tirando `fecharDialogo()`. O teste confere o diálogo fechado e as recusas fora da tabela. O mock de `aoTrocarDeSessao` só guarda o ouvinte e repassa à função real, então não esconde a regra.
5. **`nomeDaLicenca`:** o teste de unidade cobre as três licenças, com o bloco `return '—'`.
6. **"Dispensar":** a asserção pelo nome acessível completo pega o bloco que tira o `sr-only`.
7. **Clique duplo e Enter:** são dois `submit` no mesmo instante, ou seja, concorrência de verdade, e não duas chamadas em sequência. Saiu um pedido só.
8. **Campos empilhados:** o e2e "cabe inteiro" mede a largura do texto contra a caixa, com o bloco que volta o `md:grid-cols-2`.
9. Rodei `Material.test.tsx` (40 testes) e `materiais-da-escola.test.ts` (11 testes), e todos passam. O segundo só resolve `@educa/shared` quando roda a partir da raiz; de dentro de `apps/web` a suíte não carrega. Isso vem da configuração, não do teste.

**Bloqueantes:** nenhum.

**Recomendações:**
- **O bloco de `abrirPainel` fica vermelho cedo demais** (`Material.test.tsx:278`). Com o título no endereço o painel não abre, e o teste falha no `painelDe`, antes de chegar à asserção do endereço na linha 280. A asserção existe e pegaria a regressão real. Um bloco que mantém o id e acrescenta o título (por exemplo `+ '&titulo=…'`) a provaria direto.
- **No celular, o e2e "cabe inteiro" sai antes da medição** (`e2e/material.spec.ts:351`, o `if (hasTouch) return`). O que sobra ali é o `toHaveText` logo depois do `selectOption`, que quase sempre passa. A falha a 360 px está declarada no `TODO.md` (g), com dono. Vale dizer no nome do teste que a regra é só a da largura do computador.
- **O "+24" da seta e do recuo é estimado.** Como a fonte é a do sistema, a fonte da esteira pode ser mais larga que a local. Se ficar instável, meça a área de conteúdo do próprio `select`.
- **O teste de troca de sessão dispara os ouvintes guardados à mão.** Se `api/sessao` tiver uma função pública que dispara a troca, usá-la tira o `vi.mock` do arquivo inteiro.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Material.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Material.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/materiais-da-escola.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/materiais-da-escola.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/material.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/8_task.md

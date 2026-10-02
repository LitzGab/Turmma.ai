# Tarefa 15.0 — Web: acesso da turma do professor (código em grupos, "Gerar novo", WhatsApp)

**Funcionalidade:** apresentacao-escola · **Depende de:** 11.0, 4.0 · **Paralelo com:** 5.0 a 10.0, 13.0, 14.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Dentro da turma, o professor gera o acesso com validade de 1, 7 ou 30 dias, projeta o código grande e em dois grupos,
copia o link ou o compartilha pelo WhatsApp com um texto sem nome de aluno, e troca por um novo sabendo o que cai.

## Contexto necessário

- `docs/interface.md` 11.1 (botões `primario`, `perigo`); `docs/pendencias-dos-mockups.md`, P27
- `techspec.md` seções 4 (acesso), 9 ("Acesso") e 12 (a premissa do `wa.me/?text=`)
- `cenarios.md`: E16, W7, W4 (linha "Acesso"), W12
- `.claude/rules/50-frontend.md`; regra 20 (item 8)
- Código:
  - As rotas da 4.0 e a exibição do código em `packages/shared` (4.0): a tela não refaz o agrupamento
  - `apps/web/src/areas/professor/Turmas.tsx` (11.0) — onde a turma abre
  - `apps/web/src/componentes/BotaoCopiar.tsx`; o diálogo de cópia única (14.0, em `componentes/`, ou ainda em
    `operacao/` se esta vier antes: não copie)
  - `apps/web/src/componentes/CodigoQr.tsx` — existe; o QR não está na spec, e fica fora

## Nota da 13.0 (`revisor-geral`, 1ª rodada)

- `Anuncio`, `AlertaDaFalha`, `useEnvioUnico`, `textoDaFalha`, `DialogoDeFormulario` e `ConfirmacaoDePerigo` nasceram em
  `apps/web/src/areas/coordenacao/dialogos.tsx`. Se esta tarefa precisar deles na área do professor, eles se movem para
  `apps/web/src/componentes/` (e a classe do `select`, repetida em `Estrutura.tsx` e `Alocacao.tsx`, vira uma constante
  lá), sem copiar: importar de outra área poria o módulo num `parte-*` (B2). A operação tem outro `textoDaFalha` em
  `operacao/textos.ts`; juntar os dois é desta mudança.

## Subtarefas

- [x] 15.1 — A turma aberta pelo professor, com a seção Acesso: sem acesso, "Sem acesso ativo" e Gerar; gerar com a
  validade (7 padrão); o link e o código aparecem uma vez, o código em fonte grande e em dois grupos de 4; fechar
  sem copiar pergunta; com acesso, só a validade
- [x] 15.2 — "Gerar novo" pede confirmação e diz que o atual cai (também o de outro professor da turma) e que os nomes
  travados por tentativas erradas destravam; revogar com `perigo`
- [x] 15.3 — Compartilhar pelo WhatsApp: `wa.me/?text=` com o nome da escola e o link, montado por uma função só;
  sem o WhatsApp, o botão copia o texto
- [x] 15.4 — Teto do chunk `professor-*` no `.size-limit.json`
- [x] 15.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Turma.tsx`, `AcessoDaTurma.tsx` | novo |
| `apps/web/src/areas/professor/texto-do-whatsapp.ts` (e teste) | novo |
| `apps/web/src/api/acesso.ts`; `areas/professor/Turmas.tsx`, `rotas.tsx` | novo, alterado |
| `.size-limit.json`, `e2e/acesso-da-turma.spec.ts` | alterado, novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E16 | unidade | o texto traz o nome da escola e o link, e nenhum nome da lista (sentinela) |
| W7 | e2e | código em dois grupos; "Gerar novo" confirma, diz o que cai e o que destrava; fechar sem copiar pergunta; sem WhatsApp, copia |
| W4 (Acesso) | e2e | os quatro estados; "Sem acesso ativo" com Gerar; vazio e erro com a rota interceptada |
| W12 (Acesso) | e2e | 360 px sem rolagem, com o código grande; alvos de 44 px; gerar e confirmar só com teclado, foco preso e devolvido |
| link fora do cache | unidade | fechado o diálogo, nem o link nem o código ficam no `MutationCache` |
| clique duplo | e2e | dois cliques em Gerar: um acesso vigente, e a tela mostra o que ficou |
| recomeço da tela | e2e | segunda pessoa: outro professor na mesma aba não vê o link do primeiro; mesma entrada: abrir de novo a mesma turma não mostra o link já fechado; resposta atrasada: o gerar anterior que responde depois do "Gerar novo" não substitui o código novo; falha com o diálogo aberto: o `CONFLITO` do gerar recarrega a seção, e o aviso e o foco da tentativa anterior saem |
| log novo | — | a tarefa não escreve log |
| turma indisponível (divergência) | e2e e unidade | a turma com o vínculo pendente, a do vínculo encerrado e a que não existe dizem a mesma coisa pelo endereço, com a quem recorrer e sem "Tentar de novo"; o vínculo encerrado com a tela aberta faz o gerar responder isso no diálogo, e a seção deixa de oferecer o que a API recusa; só o cartão do vínculo confirmado leva à turma |
| erro no lugar do estado de antes (divergência) | e2e | a releitura que cai logo depois de gerar mostra o erro com "Tentar de novo", e não "Sem acesso ativo"; com o acesso já lido, mostra o erro, e não a validade de antes |
| releitura com o código projetado (divergência) | e2e | a leitura da turma e a do acesso caem com o diálogo aberto: o diálogo fica, com o mesmo código e o mesmo link |
| sessão vencida com o acesso na tela (divergência) | e2e | o diálogo sai da página, com o link e o código, quando a sessão da aba vence; a professora volta, e a turma volta só com a validade; a leitura de quem está na sessão que cai tem "Tentar de novo" |
| outra turma é outra tela (divergência) | e2e | o endereço que muda para outra turma já lida, com o diálogo da primeira aberto, não deixa o link nem o código por cima dela; cada turma tem a leitura dela |
| revogar do acesso que já caiu | e2e e unidade | o `NAO_ENCONTRADO` do revogar diz que a turma não tem acesso ativo, recarrega a seção e deixa só "Fechar" |
| o que o link abre e o que o WhatsApp leva (divergência) | e2e e unidade | a etapa do acesso diz que quem tem o link ou o código vê os nomes livres, e que pelo WhatsApp vão a escola e o link; a aba nova abre o `wa.me` sem o `opener`; sem a aba nova, o botão copia o texto; sem área de transferência, seleciona o link, e fechar ainda pergunta |
| a turma que a releitura deixa de achar (recomendação do `revisor-geral`) | e2e | com o vínculo encerrado e a tela aberta, a releitura da turma tira a página inteira, com o diálogo, o link e o código, e fica o texto de turma indisponível, com o foco nele e sem o nome da turma no título da aba; na página que já abre sem a turma, o aviso não puxa o foco |
| celular baixo (recomendação do `frontend-reviewer` e do `test-engineer`) | e2e | a 360 × 640, o "Cancelar" da confirmação do "Gerar novo" fica dentro da janela |
| o código soletrado (recomendação do `frontend-reviewer`) | e2e e unidade | o leitor de tela recebe o código caractere a caractere, com a pausa entre os grupos; o grande fica só para a vista |
| vínculo contestado e nome de 40 caracteres (1ª rodada do `test-engineer`) | e2e | o cartão do vínculo contestado não tem o link da turma; a turma com o nome de 40 caracteres sem espaço não estica a tela a 360 px, na página, na seção e nos diálogos |
| validade | e2e e unidade | 7 dias já marcado; a validade escolhida (1 e 30) é a que vai no pedido; a seção diz a data que o servidor devolve |
| contrato da resposta | unidade | a leitura que trouxesse o link ou o código, e o gerar com campo a mais ou código fora do alfabeto, não chegam à tela |
| teto do chunk | unidade | o `.size-limit.json` declara 10 kB para `professor-*`, e o chunk entre 10 e 20 kB reprova |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [x] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral` e os guardiões, com
  rodada que vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Os pedidos da turma (16.0); o QR do link; contagem pública de quem entrou (D59).

## Plano e autoconferência

- **Arquivos**: `api/acesso.ts`; `areas/professor/{Turma,AcessoDaTurma}.tsx`, `acesso-da-turma.ts`, `texto-do-whatsapp.ts`;
  o link "Abrir a turma" em `Turmas.tsx` e a rota em `rotas.tsx` e `caminhos.ts`; `componentes/copia-unica.tsx` (saída do
  `DialogoDoConvite.tsx`), `componentes/dialogos.tsx` (movido de `areas/coordenacao/`), `texto-da-falha.ts` e `seletor.ts`;
  `.size-limit.json`; `e2e/acesso-da-turma.spec.ts` e as fixtures.
- **Peças que já existiam**: `exibirCodigoDaTurma` e os contratos de `packages/shared` (4.0); `consultaTurmaAberta` e o
  `GET /v1/turmas/:id`; `linkDoConvite` e `copiarLink`; `Dialogo`, `useDialogoDaTela`, `ConfirmacaoDePerigo`, `Anuncio`,
  `useEnvioUnico`; a pergunta de fechar, a cópia e o foco de etapa do convite (agora em `copia-unica.tsx`); `EstadoVazio`,
  `EstadoErro`, `EstadoCarregando`; `formatarDataHora` e `formatarQuantidade`; o texto de turma indisponível segue o da
  `ListaDaTurma` e o da "Minha turma".
- **O segundo dado que torna cada cláusula observável**: a mesma turma com um vínculo confirmado e outro pendente, outra
  turma só pendente e uma terceira encerrada (o link só do confirmado; as três respostas iguais pelo endereço); a
  validade de 1 e de 30 dias, e não só os 7 do padrão; dois acessos seguidos com validades diferentes (a resposta
  atrasada); duas turmas confirmadas do mesmo professor, uma com acesso e outra sem (a chave da leitura, a `key` da
  rota); outro professor, com outra turma, na mesma aba; nomes na lista da turma (o texto do WhatsApp); o acesso gerado
  por outro professor com a tela aberta (o `CONFLITO`) e revogado por outro (o `NAO_ENCONTRADO` do revogar).
- **Checagem que responde antes**: o `CONFLITO` do gerar vem da rota interceptada, porque de verdade ele só nasce de dois
  gerar no mesmo instante (C5, provado na API); o acesso do outro professor é gravado antes, para a seção recarregada
  mostrar a validade dele. O `NAO_ENCONTRADO` do gerar e o do revogar vêm da API de verdade. No clique duplo e na resposta
  atrasada o pedido é segurado, e a asserção só roda depois de a releitura que a resposta dispara ter terminado.
- **Em paralelo**: a tela não grava nada sozinha; a corrida do servidor é o C5 e o C6 da 4.0. Aqui o que se prova é a
  trava do pedido no ar, com os dois cliques no mesmo instante e a contagem de acessos vigentes no banco.
- **Guardiões**: `frontend-reviewer` — quatro estados na página e na seção, 360 px com o código grande, alvos de 44 px,
  teclado e foco em cada diálogo, o que acontece dito antes de "Gerar novo" e de revogar, texto sem código de erro;
  `privacy-guardian` — a tarefa não cria campo nem log; o link e o código ficam só no diálogo (fora do cache de consultas
  e de mutações, de URL, do console e do armazenamento, com e2e e unidade), saem com a sessão e com a troca de turma;
  a turma de outro professor responde como a que não existe; o texto do WhatsApp só leva escola e link, e é o navegador
  do professor que o manda, por ação dele (`docs/lgpd.md`, linha do acesso da turma); fixtures sintéticas.

## Divergências resolvidas nesta tarefa

Registradas também na `techspec.md` (seção 9, "Decidido na 15.0", e seção 12), no `cenarios.md` (E16, W4 de Acesso, W7 e
W12), em `docs/interface.md` (seção 1), em `docs/lgpd.md` (linha do acesso da turma) e no `docs/glossario.md`.

- **As peças dos diálogos saíram da coordenação para `componentes/`** (a nota da 13.0, acima): `dialogos.tsx` inteiro, o
  `textoDaFalha` e o `listaMudou` em `componentes/texto-da-falha.ts` (sem React, para o `convite-de-professor.ts` e a
  operação), e a classe do `select` em `componentes/seletor.ts`. O `textoDaFalha` da operação passou a ser o mesmo, com o
  mapa de textos dela; os testes dela (`operacao/textos.test.ts`) passam sem mudar. O `useEnvioUnico` passou a receber as
  opções da mutação como o `useMutation` (as de `api/acesso.ts`, que têm teste de unidade), e o gerar o usa.
- **A cópia única virou peças** (`componentes/copia-unica.tsx`): `useFechamento`, `Pergunta`, `useCopia`, `CampoDoLink`,
  `AvisoDaCopia`, `Falha` e `useFocoDaEtapa` saíram de `DialogoDoConvite.tsx`, que passou a importá-las, sem mudar de
  comportamento (o e2e da A0b e o de Professores passam sem mudar asserção). A `Pergunta` recebe o texto e o rótulo de
  voltar de quem a usa. O acesso não coube no `DialogoDeConviteRefeito`: a etapa de confirmar leva a validade, e a do
  link, o código e o WhatsApp.
- **A turma aberta fica em `/professor/turmas/:turmaId`**, pelo cartão do vínculo confirmado ("Abrir a turma"), com o
  nome e a série do `GET /v1/turmas/:id`. A tarefa dizia "onde a turma abre" sem dizer o endereço.
- **Regra nova: a turma que a API não acha diz uma coisa só**, na página e na seção, com a quem recorrer e sem "Tentar
  de novo". Quem chama: só a tela, depois de um `NAO_ENCONTRADO` da API; não grava nada.
- **Regra nova: a releitura que falha mostra o erro, e não o estado de antes.** "Sem acesso ativo" logo depois de gerar
  negaria o acesso que acabou de nascer (o defeito que o `frontend-reviewer` achou na 14.0, na lista de professores).
- **Regra nova: a releitura que cai por rede ou servidor com a turma já na tela não desmonta a página**, porque o
  código pode estar projetado. Já a turma que a releitura deixa de achar (`NAO_ENCONTRADO`: o vínculo encerrado com a tela
  aberta) sai inteira, com o diálogo, para o título da página e o da aba não afirmarem a turma que a seção diz não estar
  disponível, e o foco vai para o aviso, em vez de cair no `body` (recomendações do `revisor-geral`, 1ª rodada, e do
  `frontend-reviewer`, 2ª). Na página que já abre sem a turma, o aviso não puxa o foco. E a turma só desenha a seção com a turma e a escola lidas, que é o que tira o diálogo quando a sessão da aba
  muda, sem ouvinte próprio (na tela Professores o diálogo sai pelo `aoTrocarDeSessao`, porque a lista dela fica montada).
- **Gerar e "Gerar novo" são um diálogo só**, com a validade em três opções e o que cai dito só quando há acesso ativo.
  A validade na seção vem sempre da leitura, e o gerar espera a releitura antes de mostrar o acesso.
- **O que "sem o WhatsApp" quer dizer**: o navegador não abriu a aba nova (`window.open` devolveu `null`). É o que a tela
  consegue saber; o `wa.me` que abre e não carrega continua sem verificação (Tech Spec, seção 12). Sem área de
  transferência, o botão seleciona o link. O botão é `secundario`, sem o verde e sem o símbolo (D72).
- **Regra nova: a etapa do acesso diz o que o link abre e o que o WhatsApp leva** ("Quem tem o link ou o código vê os
  nomes da lista que ainda estão livres: mande só para a turma…"), antes de a professora mandar (regra 20, item 8).
  Nada é gravado nem enviado pelo servidor: o compartilhamento é do navegador dela, por ação dela, e não há rota nova.
- **O código vai soletrado para o leitor de tela** ("A B C D, 2 3 4 5"), e o grande, em dois grupos, fica só para a
  vista (`aria-hidden`); a validade fica em linha, com a cor da pele (`accent-noite`, também nos rádios da contestação de
  `Turmas.tsx`); os avisos do WhatsApp dizem "aqui", e não "neste computador"; o aviso de quem vê a lista diz também que
  "Gerar novo" derruba o link que foi parar onde não devia (recomendações do `frontend-reviewer` e do
  `privacy-guardian`, 1ª rodada). O `useCopia` copia o link ou o convite inteiro pelo mesmo caminho, com o que dizer em
  cada caso (recomendação do `revisor-geral`).
- **O endereço onde o aluno digita o código** (`<host>/e/<slug>/turma`) aparece junto do código: sem ele o código
  projetado não diz onde ser usado. A página é da 17.0 (Tech Spec, seção 5, item 3).
- **Teto do `professor-*`: 10 kB** (mede ~5,3 kB). O primeiro carregamento passou de 123,8 para 126,2 kB de 150, com
  os diálogos e a cópia única em `parte-*` que as áreas dividem.
- **Arquivos fora da lista prevista**: `areas/professor/acesso-da-turma.ts` e o teste dele; `componentes/copia-unica.tsx`,
  `dialogos.tsx` (movido), `texto-da-falha.ts`, `seletor.ts`; `caminhos.ts`; `operacao/textos.ts` e os quatro arquivos da
  coordenação que importavam o `dialogos.tsx`; `api/acesso.test.ts`; `e2e/__fixtures__/sessao.ts`;
  `tools/ci/tamanho-web.test.ts`; os documentos acima e o `TODO.md`.

## Mutações

Rodadas em 02/10/2026, cada uma restaurada antes da seguinte (os fontes conferidos por sha256 no fim). As de unidade, uma
por vez. As da tela no e2e (`e2e/acesso-da-turma.spec.ts`), nos projetos `chromebook` e `celular`, com a web do compose de
teste reconstruída a cada lote; em cada lote, uma mutação por teste, escolhidas para a de um teste não alcançar o outro
antes da asserção dele. O que está entre crases na coluna da direita é a asserção que falhou, nos dois projetos. As linhas
são as do código de agora.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:83` (o carregando da seção) | W4: `expect(secao(page).getByRole('status').filter({ hasText: 'Carregando o acesso da turma…' })).toBeVisible(…` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:84` (o erro antes do estado de antes) | W4: `expect(secao(page).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO)`, logo depois de gerar |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:85` (a turma que saiu do alcance, na seção) | "falha com o diálogo aberto": `expect(secao(page).getByRole('status')…).toHaveText(TEXTO_DA_TURMA_INDISPONIVEL)` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:78` (abrir apaga o anúncio) | W7: `expect(page.locator('[role="status"]').filter({ hasText: 'Acesso revogado.' })).toHaveCount(0)` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:112` ("Gerar novo" diz o que cai: `substitui`) | W7: `expect(page.getByRole('dialog', { name: 'Gerar novo acesso' })).toBeVisible()` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:228` (o que cai só no "Gerar novo", o inverso da de cima) | W4: `expect(oQueAcontece(page, TEXTO_DO_ACESSO_NOVO)).toBeFocused()` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:115` (o `perigo` do revogar) | W7: `expect(await revogar.evaluate((botao) => getComputedStyle(botao).color)).toBe(COR_DO_PERIGO)` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:138` (a seção relê depois do gerar) | W7: `expect(tituloDaSecao(page)).toBeFocused()`, depois do primeiro gerar (o "Gerar acesso" do vazio continuava na tela) |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:153` (o anúncio do revogado) | "clique duplo": `expect(anuncio(page, 'Acesso revogado.')).toBeVisible(…` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:154` (o diálogo do revogar fecha) | "clique duplo": `expect(dialogosDaTela(page)).toHaveCount(0)`, depois do revogar |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:156` (a seção relê depois do revogar) | W12: `expect(semAcesso(page)).toBeVisible()` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:157` (o texto do revogar que já caiu) | "falha com o diálogo aberto": `expect(noDialogo(page).getByRole('alert')).toHaveText(TEXTO_DO_ACESSO_QUE_JA_NAO_VALE…` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:158` (foco de reserva do revogar) | "falha com o diálogo aberto": `expect(tituloDaSecao(page)).toBeFocused()`, depois do revogar recusado |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:184` (7 dias já marcado) | W4: `expect(validade(page, '7 dias')).toBeChecked()` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:251` (a validade escolhida vai no pedido) | W7: `expect((await pedido).postDataJSON()).toEqual({ validadeDias: 1 })` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:187` (a pergunta com o pedido no ar: `gerar.isPending`) | "clique duplo": `expect(pergunta(page)).toBeFocused()`, no "Cancelar" com o pedido no ar |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:187` (copiado, fecha sem perguntar: `!copia.copiado`) | W12: `expect(dialogosDaTela(page)).toHaveCount(0)`, depois de copiar e fechar |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:193` (o foco fica no alerta quando a etapa volta por falha) | "falha com o diálogo aberto": `expect(noDialogo(page).getByRole('alert')).toBeFocused()`, no 503 com a pergunta aberta |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:200` (o navegador fechando desmonta) | W12: `expect(dialogosDaTela(page)).toHaveCount(0)`, depois do `dialogo.close()` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:201` (o toque fora pergunta) | W7: `expect(pergunta(page)).toBeFocused()`, no toque fora |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:203` (foco de reserva do gerar) | W4: `expect(tituloDaSecao(page)).toBeFocused()` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:213` (o texto da pergunta com o pedido no ar) | "clique duplo": `expect(noDialogo(page)).toContainText('O acesso ainda está sendo gerado')` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:224` (a falha que muda a seção deixa só "Fechar") | "falha com o diálogo aberto": `expect(noDialogo(page).getByRole('button')).toHaveText(['Fechar'])` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:231` (a validade travada com o pedido no ar) | "clique duplo": `expect(validade(page, dias)).toBeDisabled()` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:288` (o link da sala) | W7: ``expect(link).toBe(`${origem}/e/${professora.slug}/turma#${primeiro.token}`)`` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:291` (o texto do WhatsApp só com a escola e o link) | W7: `expect(texto).toBe(textoDoConvite(professora.escolaNome, linkDoSegundo))` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:293` (o WhatsApp aberto conta como link que saiu) | W7: `expect(dialogosDaTela(page)).toHaveCount(0)`, no "Fechar" depois do WhatsApp |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:296` (sem a aba nova, copia o texto do convite) | W7: `expect(noDialogo(page).getByRole('status').filter({ hasText: TEXTO_DO_CONVITE_COPIADO })).toBeVisible()` (rodada de novo depois do lote de recomendações) |
| `apps/web/src/componentes/copia-unica.tsx:109` (sem área de transferência, seleciona o link, e não conta como copiado) | W7: `expect(pergunta(page)).toBeFocused()`, no "Fechar" depois de o link ficar só selecionado |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:313` (o código soletrado para o leitor de tela) e `apps/web/src/areas/professor/acesso-da-turma.ts:30` | W7: `expect(grupoDoCodigo(page).locator('p.sr-only')).toHaveText(…)`; unidade: "o código aparece em dois grupos de quatro, e o leitor de tela o recebe soletrado…" |
| `apps/web/src/areas/professor/Turma.tsx:44` (a turma que a releitura deixa de achar sai da página mesmo com o dado: `turmaIndisponivel(turma.error)`) | "a releitura que cai…": `expect(principal(page).getByRole('heading', { level: 1 })).toHaveCount(0)`, depois do vínculo encerrado (recomendação do `revisor-geral`, 1ª rodada) |
| `apps/web/src/areas/professor/Turma.tsx:32` (o título da aba deixa de dizer a turma que saiu do alcance) | "a releitura que cai…": `expect(page).toHaveTitle('Turma · Turmma')` (recomendação do `frontend-reviewer`, 2ª rodada) |
| `apps/web/src/areas/professor/Turma.tsx:83` (o foco vai para o aviso quando a turma sai por releitura) | "a releitura que cai…": `expect(principal(page).getByRole('status')…).toBeFocused()` |
| `apps/web/src/areas/professor/Turma.tsx:83` (só por releitura, o inverso da de cima: o foco sempre) | W4: `expect(principal(page).getByRole('status')…).not.toBeFocused()`, na página que já abre sem a turma |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:231` (a validade em linha; trocada por uma embaixo da outra) | W12: `expect((cancelar?.y ?? 640) + (cancelar?.height ?? 0)).toBeLessThanOrEqual(640)`, a 360 × 640 (recomendação do `test-engineer`, 3ª rodada) |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:310` (a letra grande do código) | W12: `expect(await codigoNaTela(page).evaluate(…fontSize)).toBeGreaterThanOrEqual(LETRA_GRANDE_PX)` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:311` (os dois grupos de `exibirCodigoDaTurma`, pelo `codigoEmDoisGrupos`) | W12: `expect(codigoNaTela(page)).toHaveText(CODIGO_EM_DOIS_GRUPOS)` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:315` (o endereço onde o aluno digita o código) | W7: ``expect(noDialogo(page)).toContainText(`${new URL(origem).host}/e/${professora.slug}/turma`)`` |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:319` (o aviso de quem vê a lista) | W7: `expect(noDialogo(page)).toContainText(TEXTO_DE_QUEM_VE_A_LISTA)` |
| `apps/web/src/componentes/dialogos.tsx:30` (a trava do envio único, no gerar) | "clique duplo": `expect.poll(() => pedidos).toBe(1)`, no gerar |
| `apps/web/src/areas/professor/Turma.tsx:44` (a releitura que falha com o dado na tela não desmonta: a condição `turma.isError` acrescentada ao ramo de erro, para qualquer falha) | "a releitura que cai…": `expect(secao(page).getByRole('alert')).toHaveText(…`: a seção saiu da página, com o diálogo |
| `apps/web/src/areas/professor/Turma.tsx:46` (o erro da leitura de quem está na sessão) | "a sessão vence…": `expect(principal(page).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO…` |
| `apps/web/src/areas/professor/Turma.tsx:52` (a turma que a API não acha) | W4: `expect(principal(page).getByRole('status')…).toHaveText(TEXTO_DA_TURMA_INDISPONIVEL…` |
| `apps/web/src/areas/professor/Turmas.tsx:136` (o link só no vínculo confirmado; trocado por "confirmado ou contestado") | W4: `expect(paraConfirmar.getByRole('link')).toHaveCount(0)` (rodada depois da 1ª rodada do `test-engineer`, com o vínculo contestado que ela pediu) |
| `apps/web/src/areas/professor/Turma.tsx:65` (o `break-words` do título da turma) | W12: `expect(await larguraExcedente(page)).toBe(0)`, com o nome de 40 caracteres sem espaço (rodada depois da 1ª rodada do `test-engineer`) |
| `apps/web/src/areas/professor/Turmas.tsx:136` (o link só no vínculo confirmado; trocado por "todo decidido") | W4: `expect(decididas.getByRole('link')).toHaveCount(1)` (o cartão do encerrado ganhava o link) |
| `apps/web/src/areas/professor/rotas.tsx:20` (a `key` da turma) | "outra turma…": `expect(dialogosDaTela(page)).toHaveCount(0)`, depois de o endereço mudar |
| `apps/web/src/api/acesso.ts:23` (a chave da leitura por turma) | "outra turma…": `expect(semAcesso(page)).toBeVisible(…` na segunda turma; unidade: "a leitura sem acesso vigente traz null, e cada turma tem a chave dela no cache" |
| `apps/web/src/api/acesso.ts:24` e `:30` (o contrato da leitura e o do gerar) | unidade: "a resposta fora do contrato não chega à tela…" |
| `apps/web/src/api/acesso.ts:35` (a rota e o corpo `{}` do revogar) | unidade: "ler, gerar e revogar vão às rotas da turma com a sessão…" |
| `apps/web/src/api/acesso.ts:49` (`gcTime: 0`) | unidade: os três de "link e código fora do cache" (com `reset()`, sem ele, e a resposta que chega depois de fechar) |
| `apps/web/src/api/acesso.ts:50` (`onSettled`, trocado por `onSuccess` sem esperar) | unidade: "a releitura da seção roda quando o gerar termina, dê certo ou não, e o gerar só termina depois dela" |
| `apps/web/src/areas/professor/texto-do-whatsapp.ts:18` (o texto com a escola) | unidade, E16: "traz o nome da escola e o link, e nada do que a tela tem a mais…" |
| `apps/web/src/areas/professor/texto-do-whatsapp.ts:23` (o texto codificado na consulta) | unidade: "o endereço é o wa.me com o texto inteiro na consulta…" |
| `apps/web/src/areas/professor/texto-do-whatsapp.ts:38` (a aba que não abriu) | unidade: "sem o WhatsApp (o navegador não abriu a aba nova), diz que não abriu…" |
| `apps/web/src/areas/professor/texto-do-whatsapp.ts:39` (a aba nova sem o `opener`) | unidade: "abre o wa.me numa aba nova, com o texto, e a aba nova fica sem a referência desta" |
| `apps/web/src/caminhos.ts:75` (o endereço da sala) | unidade: "o link da sala é o endereço da escola com /turma e o token no fragmento…" |
| `apps/web/src/areas/professor/acesso-da-turma.ts:13` (a validade padrão) | unidade: "a validade que o diálogo propõe é 7 dias…" |
| `apps/web/src/areas/professor/acesso-da-turma.ts:74` (a pergunta com o pedido no ar) | unidade: "a pergunta de fechar fala do link e do código…" |
| `apps/web/src/areas/professor/acesso-da-turma.ts:88` (só o `NAO_ENCONTRADO` é a turma indisponível) | unidade: "só o NAO_ENCONTRADO é a turma que saiu do alcance; a queda de rede não é" |
| `apps/web/src/areas/professor/acesso-da-turma.ts:107` e `:108` (os textos do `CONFLITO` e do `NAO_ENCONTRADO` do gerar, e a seção que muda) | unidade: "o CONFLITO do gerar diz que outro acesso passou a valer, e o NAO_ENCONTRADO, que a turma saiu do alcance: os dois mudam a seção" (três mutações) |
| `apps/web/src/areas/professor/acesso-da-turma.ts:117` (o texto do revogar que já caiu) | unidade: "o revogar do acesso que já não vale diz que a turma não tem acesso ativo" |
| `apps/web/src/operacao/textos.ts:55` (o mapa de textos da operação, pela função comum) | unidade (`operacao/textos.test.ts`): "o 503 TEMPO_ESGOTADO tem o texto dele, e o 503 da API fora continua com o da operação" |
| `apps/web/src/componentes/texto-da-falha.ts:10` e `:15` (o texto da tela antes do catálogo; a lista que mudou) | unidade (`convite-de-professor.test.ts`): "o CONFLITO do cadastro é do e-mail digitado…"; "o CONFLITO e o NAO_ENCONTRADO do refazer…" |
| `.size-limit.json` (o teto de 10 kB do `professor-*`) | unidade (`tools/ci/tamanho-web.test.ts`): "declara 150 kB…"; "o chunk professor-* acima de 10 kB em brotli reprova…" |
| a validade escrita da resposta do gerar (**injeção**, e não cláusula: a regra é a validade vir só da leitura, `AcessoDaTurma.tsx:138`) | "resposta atrasada": ``expect(secao(page)).toContainText(`Vale até ${await dataNaTela(page, segundo.expiraEm)}.`)`` (a seção ficava com a validade de 1 dia da resposta que chegou por último) |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:187` (o `gerar.reset` do fechar, trocado por nada) | **sobreviveu, como esperado**: o `gcTime: 0` já tira a resposta do cache quando o diálogo desmonta (unidade, "o diálogo que sai sem o reset…"); o `reset()` fica como no diálogo do convite, para o token sair na hora, sem esperar o coletor |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:134` e `:145` (a `key` da abertura) | **sobreviveu, como esperado**: o diálogo é modal e só abre outro depois de fechar, e o fechar desmonta; a `key` fica pela regra do `useDialogoDaTela`, como em Professores e na Estrutura |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx:202` (`focoInicial`) | **sobreviveu**: o texto que abre o diálogo é o primeiro elemento que aceita foco, e o `showModal` já o escolhe; fica explícito para o foco não passar ao primeiro controle se algo entrar antes dele (o W4, o W7 e o W12 afirmam o foco no texto) |
| `apps/web/src/areas/professor/Turma.tsx:44` (a seção só com a turma e a escola lidas) | sem mutação que a tire: é a própria condição de desenhar a página. O que ela garante — o diálogo sair quando a sessão vence — é afirmado em "a sessão vence…": `expect(dialogosAbertos(page)).toHaveCount(1)` e o link e o código fora da página |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `test-engineer`, 1ª | "Segunda pessoa" com outro professor da **mesma** escola, chegando à turma do primeiro sem recarregar (pelo `pushState`), para exercitar o cache desta tela | `/validar`: a fixture do e2e só cria professor com escola nova; o que o teste prova hoje é o isolamento (outra escola, na mesma aba) e, com a mesma professora, a chave da leitura por turma ("outra turma é outra tela"). O comentário do teste foi acertado |
| `test-engineer`, 1ª | Professor com duas disciplinas confirmadas na mesma turma: dois cartões com o mesmo link "Abrir a turma …" | `/validar`: os dois levam à mesma turma, e o acesso é da turma, não da disciplina; nenhuma regra muda |
| `test-engineer`, 1ª | Queda de conexão de verdade no gerar (`rota.abort()`), além do 503 | `/validar`: o cliente (`api/cliente.ts`) transforma a queda de rede em `INDISPONIVEL_TENTE_DE_NOVO`, o mesmo código do 503 provado no e2e, com teste de unidade próprio (`api/cliente.test.ts`) |
| `frontend-reviewer`, 1ª | O código fica refém da releitura: o gerar espera a releitura da seção antes de mostrar o acesso, e numa rede que engasga o diálogo fica em "Gerando…" com o `POST` já respondido. Sugestão: mostrar o acesso assim que o `POST` responde, com a seção recarregando por trás | `TODO.md`, para decidir com o `frontend-reviewer` antes do `/validar`: não é barata. Sem a espera, fechar o diálogo antes de a releitura voltar devolve o foco ao "Gerar acesso" do vazio, que some em seguida, e a seção afirma "Sem acesso ativo" por um instante; e o W4 e a unidade provam hoje a ordem (o acesso só aparece com a seção já relida) |
| `test-engineer`, 3ª | — | As três aplicadas: o "Cancelar" do "Gerar novo" dentro da janela a 360 × 640 (W12), o foco depois de a página sair com o diálogo aberto, e o texto `selecionado` por extenso na unidade |
| `frontend-reviewer`, 2ª | — | As três aplicadas: o título da aba, o foco no aviso quando a turma sai por releitura, e "o link ou o código" no lugar de "ele" |
| `test-engineer`, 4ª | A asserção dos 640 px (`e2e/acesso-da-turma.spec.ts:689`) passaria com a caixa nula (`?? 640` com `?? 0`), e mede a caixa do botão contra a janela, não contra a área visível do diálogo: `expect(cancelar).not.toBeNull()` antes, ou `toBeInViewport({ ratio: 1 })` | `/validar`: hoje a caixa é garantida pelo `alvoDeToque` do mesmo botão três linhas antes, e o diálogo não tem altura máxima com rolagem interna; mexer no teste depois das aprovações pediria rodada nova só por isso |
| `frontend-reviewer`, 3ª | O aviso de turma indisponível está escrito duas vezes (`AcessoDaTurma.tsx:87-89` e o `TurmaIndisponivel` de `Turma.tsx`): um componente só | `16_task.md` (a 16.0 põe os pedidos na mesma página e mexe nos dois arquivos): o da página recebe foco por releitura, e o da seção não, e juntar pede decidir isso |
| `frontend-reviewer`, 3ª | O aviso com `role="status"` que também recebe o foco pode ser lido duas vezes por alguns leitores de tela | `/validar`: conferir com NVDA ou ChromeVox; se repetir, tirar o `role` quando o aviso chega por releitura |
| `revisor-geral`, 2ª | `codigoEmDoisGrupos` (`acesso-da-turma.ts:24`) é só um segundo nome de `exibirCodigoDaTurma` | `TODO.md`, no item da renomeação de `linkDoConvite` e `copiarLink`: sai na mesma correção |
| `revisor-geral`, 2ª | — | As outras duas aplicadas: a frase quebrada nas divergências e o caso de 360 × 640 no W12 do `cenarios.md` (documento, sem código) |
| `privacy-guardian`, 2ª | O fim do teste "a releitura que cai…" e o `semRastro` conferirem também o código com o espaço do meio e o soletrado no HTML | `/validar`: cobertura extra; as duas formas só existem dentro do diálogo, e a contagem de diálogos em zero já as cobre |
| `privacy-guardian`, 2ª | Fora deste diff: encerrar o vínculo do professor não revoga o acesso que ele gerou; o professor realocado fica com um link que mostra os nomes livres até vencer ou alguém gerar outro | `TODO.md`, para decidir antes do `/validar` da A1, com o `privacy-guardian`: é regra da API (4.0 e F1), e não desta tela |
| `frontend-reviewer`, 1ª | Celular baixo (360 × 640): na etapa do acesso os três botões ficam abaixo da dobra do diálogo, que rola | Aplicada em parte: a validade ficou em linha, e o "Cancelar" do "Gerar novo" voltou a caber. A etapa do acesso continua rolando a 640 px de altura (o código grande, o endereço, o link e o aviso de quem vê a lista não saem): `/validar` |
| `privacy-guardian`, 1ª | A tela avisar, em computador compartilhado, que o endereço do `wa.me` com o link fica no histórico do navegador | `/validar`, com o `privacy-guardian`: a linha do `docs/lgpd.md` passou a dizer as duas coisas (o link chega à Meta no endereço, e fica no histórico do navegador do professor enquanto o acesso valer); a tela já diz que "Gerar novo" derruba o link |
| `privacy-guardian`, 1ª | `Referrer-Policy` na borda (`no-referrer` ou `same-origin`): a aba do `wa.me` recebe a origem da web como referência | `TODO.md`: é cabeçalho da borda (`infra/`), fora desta tarefa de tela, e pede o `infra-guardian` |
| `revisor-geral`, 1ª | `linkDoConvite` e `copiarLink` (`componentes/link-do-convite.ts`) já não dizem o que fazem: montam também o link da sala e copiam o convite inteiro | `TODO.md`, no item da trava e do alerta duplicados: renomear mexe na operação, no convite e nos testes deles, e sai na mesma correção |
| `test-engineer`, 1ª | O `wrap-anywhere` do endereço onde o aluno digita o código (`AcessoDaTurma.tsx:315`) sem asserção: o slug da fixture, com hífens, não transborda sem ele | `/validar`: um slug longo sem hífen pede fixture de escola com slug próprio; o endereço da escola é minúsculas com hífen (glossário), e o caso é de borda |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-02 17:12:52 | 2026-10-02 17:17:46 | `test-engineer` | 1 | REPROVADO | ae6a030037cbae506 |
| 2026-10-02 17:30:37 | 2026-10-02 17:33:53 | `test-engineer` | 2 | APROVADO | a28354c9b64aecd5c |
| 2026-10-02 17:34:09 | 2026-10-02 17:38:14 | `frontend-reviewer` | 1 | APROVADO | ac3536719de062c82 |
| 2026-10-02 17:38:45 | 2026-10-02 17:40:47 | `privacy-guardian` | 1 | APROVADO | a9600c2fd1c5e097c |
| 2026-10-02 17:38:30 | 2026-10-02 17:41:29 | `revisor-geral` | 1 | REPROVADO | a8790819be4b546ac |
| 2026-10-02 18:11:18 | 2026-10-02 18:15:18 | `test-engineer` | 3 | APROVADO | abcdcb75e64b5e111 |
| 2026-10-02 18:15:35 | 2026-10-02 18:16:42 | `frontend-reviewer` | 2 | APROVADO | af4f0f63ecb45cc75 |
| 2026-10-02 18:42:53 | 2026-10-02 18:46:04 | `test-engineer` | 4 | APROVADO | a1048590aca40c962 |
| 2026-10-02 18:46:14 | 2026-10-02 18:47:02 | `frontend-reviewer` | 3 | APROVADO | ac9ab05e962a02602 |
| 2026-10-02 18:47:20 | 2026-10-02 18:48:26 | `revisor-geral` | 2 | APROVADO | a90d6b03142b8811f |
| 2026-10-02 18:47:34 | 2026-10-02 18:48:29 | `privacy-guardian` | 2 | APROVADO | a11e942566f2c7bec |

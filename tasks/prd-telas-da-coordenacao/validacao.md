# Validação — telas-da-coordenacao (X2)

## Rodada 2 — 17/10/2026 (revalidação)

**Escopo:** funcionalidade completa, revalidação: os achados da rodada 1 (seção 4 dela) e o que as correções mudaram
**Commit validado:** `adf4dfe` (o último commit com código é o merge `8397171`; `adf4dfe` só muda o `estado.md`)
**Veredito: APROVADA**

Como foi feita: li a rodada 1, o `git diff b022543..adf4dfe` inteiro (37 arquivos), os cinco documentos de correção e o
`achados/indice.md`, e o código e os testes de cada correção por completo. Rodei isolados os testes de unidade e os casos de e2e que
servem de evidência, fiz três provas de mutação e fotografei as telas corrigidas. O e2e e as fotos rodaram no **ambiente de teste 0**
(o que o Orquestrador reservou para a validação), construído por `node tools/ci/e2e.ts --manter-ambiente` a partir de `adf4dfe`. A
vitrine deste andar foi remontada no ambiente 0 (`.processo/vitrine.json`; a do ambiente 2 está guardada no scratchpad da sessão) e
recebeu, sintético: um professor convidado, uma estrutura "9V", um material que falhou, uma aluna com um pedido de titular "recebido"
e um incidente sem confirmação. A operação, que a vitrine não alcança, foi fotografada por um Playwright de fora do repositório
(config no scratchpad, fixtures `criarOperadorComSegundoFator` e `semearPainel`, removidas no fim).

### 1. Os achados da rodada 1

| Achado | Correção | Situação | Código | Teste e foto |
|---|---|---|---|---|
| **C1** — o Painel rolava 97 px a 1366 × 768 com a faixa de incidente | `c2e3398` | **resolvido** | `Painel.tsx:44`: o Painel inteiro passa a ser uma `section` "O Painel da escola" com `O_MIOLO_SEM_ABAS_QUE_ROLA` (`miolo-que-rola.ts:27`, desconta `--faixa-de-incidente`), `tabIndex 0` só a partir de 768 px | e2e `incidentes.spec.ts:654` (com a faixa: `paginaNaoRola`, o miolo rola de fato numa janela de 600 px, foco visível e `End` rola o miolo) ✅ chromebook e celular; `Painel.test.tsx:198`. Mutação 3. Foto `coordenacao--coordenacao-painel--button-name-Ver-depois--computador.png`: 768 px de altura (era 865) |
| **C2** — o detalhe do pedido rolava 88 px (186 com a faixa) | `c2e3398` | **resolvido** | `privacidade/DetalheDoPedido.tsx:173`: a coluna vira a `section` "Tudo sobre este pedido" com `O_MIOLO_QUE_ROLA`; os três cartões e as ações ficam todos dentro dela, então o estado mais longo também cabe | e2e `pedido-do-titular.spec.ts:141` (sem a faixa) e `incidentes.spec.ts:687` (com a faixa, foco e rolagem pelo teclado) ✅ nos dois perfis; `DetalheDoPedido.test.tsx:106`. Foto `coordenacao--coordenacao-privacidade-pedidos-01a14c14-…--button-name-Ver-depois--computador.png`: 768 px (a da rodada 1 tinha 954) |
| **C3** — o painel lateral aberto pelo endereço cobria o aviso de incidente | `2919d08` | **resolvido** | `componentes/dialogo-prioritario.ts` (novo: o aviso se registra; quem espera abre quando o último sai); `dialogo-modal.ts:100` (`cedeAoPrioritario` adia o `showModal`, e só devolve o foco se tiver aberto); `PainelLado.tsx:48`; `AvisoDeIncidente.tsx:123` | e2e `incidentes.spec.ts:756` (os três endereços: o painel montado não abre, um só `dialog[open]`, confirma pelo aviso, o painel abre com o foco no miolo e o endereço intacto), `:796` ("Ver depois" abre o painel por cima da faixa; Esc devolve o foco ao título), `:823` (painel já aberto: o aviso abre por cima e recebe o toque) ✅ nos dois perfis; `PainelLado.test.tsx` (6 casos), `dialogo-prioritario.test.ts` (5). A ordem é forçada segurando o pedaço da tela (`segurarATelaDoPainel`), não deixada à rede. Mutação 1. Fotos `coordenacao--coordenacao-professores--computador.png`, `coordenacao--coordenacao-material--celular.png`, `coordenacao--coordenacao-estrutura--computador.png` (o aviso por cima e legível nos três) e `coordenacao--coordenacao-professores--button-name-Ver-depois--computador.png` (depois de "Ver depois", o painel do professor abre sobre a faixa) |
| **C4** — "o vazio só com a leitura terminada e sem erro" sem asserção em seis telas e no consumo do Painel | `ed03046` | **resolvido** | sem mudança de produção | `Estrutura.test.tsx:164-166`, `:176-178`; `privacidade/Pedidos.test.tsx:93-94`, `:107`; `operacao/paginas/Escolas.test.tsx:48-49`, `:67`; `Uso.test.tsx:41-42`, `:60`; `Professores.test.tsx:159-160` (o carregando, que era o apontado); `ListaDaTurma.test.tsx:185-188`, `:202-205`; `Painel.test.tsx:538`, `:548` (consumo carregando e em erro, com o alerta esperado antes de conferir). Mutação 2 |
| **Maior** — `docs/interface.md` ainda com os sete itens e "abre em Governança" | `ed03046` | **resolvido** | `docs/interface.md:302-305` (os quatro lugares chegaram com a X2), `:1522` (linha da coordenação), `:1525` ("A coordenação abre no Painel (X2); Governança é a aba IA de Registros") | conferido por leitura; nenhuma outra menção ao desenho antigo na seção 3 nem na tabela |

As outras duas correções do período (`4a3835f`, `2884140`) só põem `test.slow()` em dois casos de `e2e/agentes.spec.ts` que
estouravam os 30 s no celular; não tocam asserção. A Tech Spec registrou a C3 (`techspec.md:18-19`, `:56`); a C1 e a C2 só levam o
Painel e o detalhe à regra que a §9 "Altura" já dava ("a partir de 768 px só o miolo rola"), então não há desvio a registrar.

### 2. RF a RF depois das correções

Só mudam os RF que a rodada 1 deixou abaixo de ATENDIDO; os outros 17 seguem como lá, e nenhuma correção tocou o código deles (o
`PainelLado`, que mudou, é o mesmo do sino, e o sino só o abre por toque, sem aviso na tela).

| RF | Rodada 1 | Rodada 2 | Por quê |
|---|---|---|---|
| RF12, RF13, RF14, RF15 | PARCIAL | **ATENDIDO** | C3 resolvido, provado nos três endereços e visto nas fotos. O complemento da contestação continua provado só no componente, como a 7.0 registrou |
| RF21 | ATENDIDO sem foto | **ATENDIDO, com foto lida** | Pela regra, RF com tela sem foto lida é no máximo PARCIAL, e a rodada 1 o deixou sem. Fotos agora (scratchpad da sessão, `foto-operacao/`): `chromebook-operacao.png` e `chromebook-operacao-uso.png` (tabela, paginação "Página 1 de 131", a frase fixa "a operação não vê dado de aluno nem de professor", estado da coordenação em selo com a ação ao lado; a página não rola, medido 0 px) e `celular-operacao.png` / `celular-operacao-uso.png` (a tabela vira cartões, sem rolagem lateral, 0 px) |
| RF22 | PARCIAL | **ATENDIDO** | C4 resolvido |
| RF23 | PARCIAL | **ATENDIDO** | C1 e C2 resolvidos; nas 13 telas da rodada 1 nada mudou que somasse altura |

**Resultado:** 24 de 24 ATENDIDOS.

Provas de mutação (aplicada, rodado só o teste citado, restaurada com `git checkout --`; árvore limpa no fim):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF12–RF15 (C3) | `PainelLado.tsx:48`: `cedeAoPrioritario: true` → `false` | `PainelLado.test.tsx`: 5 de 6 vermelhos ("com prioritário, não abre ao montar…", "o painel desmontado enquanto esperava não abre depois", "quem abriu é quem tem o foco quando o painel de fato abre…" e mais dois) |
| RF22 (C4) | `privacidade/Pedidos.tsx:103`: o carregando passa a mostrar também o `EstadoVazio` "Nenhum pedido registrado" | `Pedidos.test.tsx` "carregando: diz o que espera, e a tabela ainda não existe" (e o caso do vazio, pelo texto duplicado): 2 vermelhos |
| RF23 (C1) | `miolo-que-rola.ts:27`: `-var(--faixa-de-incidente,0px)` tirado de `O_MIOLO_SEM_ABAS_QUE_ROLA` (web reconstruída no ambiente 0) | e2e `incidentes.spec.ts:654` [chromebook]: "a página inteira rola a partir de 768 px: só o miolo deveria — Expected ≤ 0, Received 86". Restaurado, o ambiente 0 foi reconstruído e o mesmo caso voltou verde |

### 3. Critério de pronto e portão

| Item | Situação |
|---|---|
| Pronto: cada tela cabe em 1366 × 768 sem rolar e funciona a 360 px | **cumprido** (era o item faltando): Painel e detalhe do pedido com e sem a faixa, por e2e e foto; a 360 px, sem rolagem lateral nas fotos novas |
| Pronto: os demais itens | cumpridos, como na rodada 1; "e2e da A0b, A1, A5 e F3 provando as mesmas regras" é da esteira, conferida no fechamento. Nenhum `.skip`/`.only`/`.fixme` nem teste apagado no diff |

Esteira: conferida no fechamento.

| Portão | Resultado |
|---|---|
| Suítes inteiras | não rodadas aqui, por ordem do escopo (D79) |
| Unidade e componente de evidência | ✅ `Painel`, `DetalheDoPedido`, `PainelLado`, `dialogo-prioritario`, `Estrutura`, `ListaDaTurma`, `Professores`, `Pedidos`, `AvisoDeIncidente`, `operacao/Escolas`, `operacao/Uso`: 11 arquivos, 184 casos verdes |
| e2e de evidência (ambiente 0, de `adf4dfe`) | ✅ 18 de 18 (`incidentes.spec.ts:631`, `:654`, `:687`, `:756` ×3, `:796`, `:823` e `pedido-do-titular.spec.ts:120`, nos projetos `chromebook` e `celular`), em 1,1 min |
| Dependências | `node_modules` em dia com o `package-lock.json`; `npm ci` não foi preciso |
| Revisões das correções | ✅ as cinco correções e o encontro têm rodada de todo revisor obrigatório, e a última de cada um é APROVADO (`painel-e-pedido` e `painel-pelo-endereco` reprovadas na 1ª, aprovadas na 2ª) |
| Commits sem marca | ✅ os sete commits sem `(correção …)` desde `b022543` só mudam `tasks/prd-telas-da-coordenacao/estado.md` |

### 4. Achados

**Críticos:** nenhum.

**Maiores:** nenhum.

**Menores** (novos nesta rodada):

- `TODO.md`, linha "O título do cartão 'Incidente de segurança…' corta com reticências a 360 px": diz "tratar junto da correção do
  Painel dos achados C1 a C3", e essa correção já foi feita sem tratar. Na foto do Painel a 1366 px os dois itens também cortam
  ("Incidente de segurança sem confirm…", "O material "Capítulo da validação sem texto" não f…"). Correção: dar à linha um destino
  que ainda exista (a próxima tarefa que tocar `componentes/Linha.tsx` ou o Painel, ou a X3, que reusa o sino).
- `Painel.tsx:65` (`LISTA_QUE_ROLA`): a 1366 × 768 com a faixa, "Esperando você" fica com 144 px e mostra dois itens e meio, rolando
  dentro do miolo que também rola. Funciona e já está no `TODO.md` (frontend-reviewer da correção C1+C2); registro aqui porque se vê
  na foto.
- `tasks/correcoes/2026-10-17-painel-pelo-endereco-cobre-o-aviso.md:115`: a recomendação "uma linha de texto 'O painel abre depois do
  aviso'" ficou "para o Joaquim" sem linha no `TODO.md`. Levar ao `TODO.md` no fechamento, com as outras.

**Menores da rodada 1 que seguem abertos:** nenhum foi tratado pelas correções (não eram o escopo delas), e o `estado.md` já os
leva ao `TODO.md` no fechamento: a asserção decorativa de `SinoDaCoordenacao.test.tsx:152-156`; `fila-da-coordenacao.test.ts:111`
tautológico; nenhum teste exclui busca em Registros › IA; o texto da retomada no RF19 e na §9; o detalhe do pedido a 3 cliques por
Registros; a frase do teto de linhas e o `retryOnMount` na Tech Spec (§9, §7c) e a frase do e2e `governanca` (§10); o vazio dos
Prazos de guarda; a linha do `7_task.md`; as mutações antigas da 1.0 e da 3.0; as abas de Escola em duas linhas a 360 px; as
recomendações sem destino; `larguraExcedenteDoDialogo` medindo só o diálogo de cima.

**Positivos:**

- O e2e da C3 força a ordem do defeito (segura o pedaço da tela até o aviso estar na tela) em vez de esperar que a rede a repita: o
  caso prova a corrida, não a sorte.
- Os casos de altura da C1 e da C2 baixam a janela para 600 px antes de medir, para o conteúdo passar do miolo de verdade: sem isso o
  `paginaNaoRola` poderia passar só por a tela ser curta.

### 5. Conclusão

APROVADA. Os quatro críticos e o maior da rodada 1 estão corrigidos, provados por teste que pega a remoção (três mutações vermelhas,
uma delas no e2e) e vistos nas fotos: o Painel e o detalhe do pedido cabem em 1366 × 768 com a faixa de incidente, o aviso de
incidente fica por cima de qualquer painel aberto pelo endereço, e o vazio não aparece durante a leitura nem junto do erro. O RF21,
que a rodada 1 aprovou sem foto, agora tem as fotos da operação lidas. Os 24 RF estão atendidos e o critério de pronto, cumprido; o
que fica é a esteira do commit validado, que o Orquestrador confere no fechamento, e os menores, que vão ao `TODO.md`.

### 6. Pendências herdadas

- Os menores das duas rodadas: ao `TODO.md`, no fechamento (o `estado.md` já os lista).
- `?estado=rejeitada` em Registros › IA a 30,2 s com 60 mil entregas (achado da 10.0): já no `TODO.md`, para o Joaquim com o
  `infra-guardian`.
- A vitrine não entra como operador: as fotos da operação desta rodada vieram de um script fora do repositório. Destino: `TODO.md`,
  junto da ferramenta da vitrine (como a 14.0 já registrou).
- O ambiente de teste 0 ficou de pé com a web de `adf4dfe` e a vitrine deste andar aponta para ele, com o dado sintético semeado
  acima; `vitrine.ts montar` recria a vitrine limpa.

## Rodada 1 — 17/10/2026

**Escopo:** funcionalidade completa
**Commit validado:** `f01ecbd` (o último commit com código web é `492175f`, da 11.0; de lá até `f01ecbd` só mudaram e2e e documentos)
**Veredito: REPROVADA**

Como foi feita: li o PRD, a Tech Spec, `tasks.md`, o bloco X2 do `ROADMAP.md`, as regras 00, 10, 20, 40, 50, 60, 70 e 80, e os 14
documentos de tarefa (seção "Revisões" e `achados/indice.md`). A leitura RF a RF do código e dos testes foi dividida em três grupos
(RF1–RF7, RF8–RF16, RF17–RF24); conferi pessoalmente cada achado que entrou aqui. As telas foram vistas na vitrine (ambiente de teste 2,
`127.0.0.1:30090`, construído às 17h07 a partir de `41600a2`, que tem o mesmo `apps/` que `f01ecbd`), na escola cheia e na vazia, a
1366 px e a 360 px. A medida de rolagem foi feita direto no navegador (`scrollHeight − clientHeight` e `scrollWidth − clientWidth`).

**Dado semeado na vitrine (sintético, banco de teste do ambiente 2, nenhum arquivo do repositório):** a escola cheia não tinha item no
sino, material, pedido nem incidente, e os revisores da 1.0 e da 8.0 deixaram a foto disso para esta validação. Semeei, com as fixtures
do e2e (`criarMaterialNoBanco`, `convidarProfessorNoBanco`, `contestarVinculosNoBanco`, `criarIncidenteNoBanco`,
`criarPedidoDoTitularNoBanco`): a turma "2ºZ validação" sem professor, a contestação do vínculo da Professora Marta (2ºC), um convite
vencido, um material que falhou e um pronto, um incidente sem confirmação e dois pedidos de titular. A vitrine cheia continua com esse
dado; `node tools/vitrine/vitrine.ts montar` a recria limpa.

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `apps/web/src/areas/navegacao.ts:53-58`; sino acima do `Switch` em `areas/coordenacao/rotas.tsx:54-56`; âncora em `componentes/CascaDaEscola.tsx:270`, `:327` | `areas/navegacao.test.ts:5`, `:61` (ordem exata); e2e `areas.spec.ts:316` (1366 e 360); `casca.spec.ts:680` (900 px, só o primeiro lugar); `sino-por-area.test.tsx` | A 900 px o layout é o mesmo da 1366 (lateral e âncora no canto), então a terceira largura está coberta na prática. Fotos: `coordenacao--coordenacao-painel--computador.png`, `--celular.png` |
| RF2 | ATENDIDO | `paginas/Inicio.tsx:163`; `rotas.tsx:62-104` | `areas.spec.ts:357-363` (`toHaveURL` do endereço de hoje e lugar aceso); `esperarPainel` | |
| RF3 | ATENDIDO | `e2e/__fixtures__/coordenacao.ts:44-89` (`cliquesAte` lê a mesma tabela que `irPelaCoordenacao` executa) | `areas.spec.ts:316`; sino a dois: `sino-da-coordenacao.spec.ts:82-84` | O detalhe do pedido ficou a 3 cliques (era 2): ver Menores |
| RF4 | ATENDIDO | `areas/coordenacao/fila-da-coordenacao.ts:72-168`; `componentes/sino/Sino.tsx:185` (ícone "inicio", sem onça) | `fila-da-coordenacao.test.ts:75` (os cinco, `toEqual`), `:145`, `:157`, `:217`, `:240`, `:254`; `Sino.test.tsx:52`, `:136`; `SinoDaCoordenacao.test.tsx:172`, `:485`; e2e `sino-da-coordenacao.spec.ts:46` (item sai sem recarregar); `componentes/ia/avatar-so-nas-duas-pecas.test.ts:32` | Mutação 2. Foto com os cinco tipos: `coordenacao--coordenacao-estrutura--button-name-Ver-depois-button-name-Esperando-você--computador.png` ("Esperando você, 5") |
| RF5 | ATENDIDO | `fila-da-coordenacao.ts:181` (`SEM_LEITURA_SOZINHA`), `:190` (`LEITURA_DA_FILA`) | `SinoDaCoordenacao.test.tsx:237` (10 s com material processando), `:248` (`focusManager`), `:260` (`onlineManager`), `:337` (controle que relê), `:459`; `Sino.test.tsx:65` (nada animado), `:75` (abrir não chama nada) | Uma asserção decorativa em `SinoDaCoordenacao.test.tsx:152-156` (Menores); a prova real é `Sino.test.tsx:75` |
| RF6 | ATENDIDO | `areas/coordenacao/Painel.tsx:70-95`, `:118-155`, `:161-212`, `:220-296` | `Painel.test.tsx:174`, `:203`, `:221`, `:233`, `:260`, `:455`, `:475`, `:505`, `:534`, `:552`, `:572`, `:598`, `:626`; e2e `painel-da-coordenacao.spec.ts:41`, `:83`, `:107`, `:133` | Fotos: `coordenacao--coordenacao-painel--button-name-Ver-depois--computador.png`, `vazia--coordenacao--coordenacao-painel--computador.png` |
| RF7 | ATENDIDO | `fila-da-coordenacao.ts:20` (`TIPOS_DA_FILA`), `:84-96` | `Painel.test.tsx:272` (três professores, pendências diferentes, um contador só), `:302` (títulos `toEqual`); `fila-da-coordenacao.test.ts:116` | Mutação 3. `fila-da-coordenacao.test.ts:111` é tautológico (Menores), o fechamento real é `:75` e `Painel.test.tsx:302` |
| RF8 | ATENDIDO | `Analista.tsx:83-85` (`AssinaturaIA`), `:153`, `:160-166` (hipótese, lista fechada) | `Analista.test.tsx:221-236` (nenhum `textbox`, `searchbox`, arquivo, "perguntar"); `:85`; e2e `analista.spec.ts:131` (dois professores, contra o servidor), `:137` | Foto: `coordenacao--coordenacao-analista--computador.png` |
| RF9 | ATENDIDO | `DadoNominal.tsx:37-40`, `:104`, `:112` | e2e `analista.spec.ts:41` (aviso antes, cancelar não grava), `:78` (duas aberturas, duas auditorias lidas na tabela `auditoria`; a confirmação nasce vazia), `:106` | |
| RF10 | ATENDIDO | `Escola.tsx:9-13`; `rotas.tsx:62-79` | `irPelaCoordenacao` + `areas.spec.ts:354-360`; `molduras.test.tsx:50-63`; `professores.spec.ts:1115`, `material.spec.ts:485` | |
| RF11 | ATENDIDO | `Estrutura.tsx:92-138`, `:204`, `:275`, `:477-536`; `turmas-da-escola.ts:47` | `Estrutura.test.tsx:229`, `:306` (um botão cheio), `:363`, `:386`, `:633`; `turmas-da-escola.test.ts:52`, `:84`; e2e `estrutura.spec.ts:418`, `:459-465` | Fotos: `coordenacao--coordenacao-estrutura--computador.png` (com dado), `...Esperando-você--celular.png` ("Sem professor" a 360) |
| RF12 | PARCIAL | `o-que-falta-da-escola.ts:49-67`; `AnoEDisciplinas.tsx:425` | `o-que-falta-da-escola.test.ts:13`, `:52`; `Estrutura.test.tsx:179`, `:335`, `:445`; e2e `estrutura.spec.ts:90`, `:125` | O critério está cumprido, mas o painel `?painel=ano` aberto pelo endereço cobre o aviso de incidente (Crítico C3). Foto: `coordenacao--coordenacao-estrutura--computador.png` |
| RF13 | PARCIAL | `Professores.tsx:64-85`; contrato estrito `packages/shared/src/professores/professores.ts:98` | `Professores.test.tsx:186`, `:236`; e2e `professores.spec.ts:357-359` (e-mail ausente do HTML), `:410`, `:698` | Mesmo defeito do C3 com `?professor=`. Fotos: `coordenacao--coordenacao-professores--computador.png` (painel por cima do aviso) |
| RF14 | PARCIAL | `PainelDoProfessor.tsx:42-43`, `:88-104` | `PainelDoProfessor.test.tsx:251`, `:321`, `:331`; e2e `alocacao.spec.ts:112-117`, `:153`, `:244`, `:257`; `escola-montada.spec.ts:162-163` | Mesmo painel do RF13 (C3). O complemento da contestação só tem prova de componente (registrado na 7.0) |
| RF15 | PARCIAL | `materiais-da-escola.ts:47-54`, `:66-76`; `DialogoDeEnvioDeMaterial.tsx`; `PainelDoMaterial.tsx:40` | `materiais-da-escola.test.ts:30-45`; e2e `material.spec.ts:226` (sem licença: nada sobe, recusa na auditoria do banco), `:447`, `:449`, `:458` | Mesmo defeito do C3 com `?material=`. Fotos: `coordenacao--coordenacao-material--celular.png` (painel por cima do aviso); a tabela com o que falhou primeiro foi vista com o dado semeado |
| RF16 | ATENDIDO | `ListaDaTurma.tsx:214`, `:267`; `ProfessoresDaTurma.tsx:45-46` | `ListaDaTurma.test.tsx:295`, `:314`; e2e `pedidos.spec.ts:319` (nenhuma leitura sem clique, uma auditoria por leitura no banco), `lista-da-turma.spec.ts:596` | Foto: `coordenacao--coordenacao-estrutura-turmas-01a144bc-31ac-7aaf-bec3-056c8c4387cc--computador.png` |
| RF17 | ATENDIDO | `Registros.tsx:10-14`; `privacidade/Privacidade.tsx:14-18`, `:44` | `molduras.test.tsx:189-207` (radiogroup, três `tab` só); `Privacidade.test.tsx:95-128`; e2e `privacidade.spec.ts:75`, `:125`, `incidentes.spec.ts:539` | Foto: `coordenacao--coordenacao-privacidade-incidentes--computador.png` |
| RF18 | ATENDIDO | `Governanca.tsx:38-44`, `:64-79`, `:158-190` | `Governanca.test.tsx:252`, `:281` (rede falsa com números diferentes no filtro); e2e `governanca.spec.ts:84-95`, `:135` | Nenhum teste exclui um campo de busca (Menores). Foto: `coordenacao--coordenacao-governanca--computador.png` |
| RF19 | ATENDIDO | `Agentes.tsx:101-106`, `:128-129`, `:142-158`, `:253-279` | `Agentes.test.tsx:152`, `:294-348`; e2e `agentes.spec.ts:91`, `:97`, `:214-221` (suspensão e auditoria lidas no banco) | Retomar não tem confirmação, como na `develop`; o texto do RF19 e da Tech Spec §9 (11.0) dá a entender que tem (Menores). Foto: `coordenacao--coordenacao-agentes--computador.png` |
| RF20 | ATENDIDO | `privacidade/Pedidos.tsx:64-70`, `:100`; `textos-do-pedido.ts:100-103` | `Pedidos.test.tsx:147`, `:161`, `:190`, `:195`; e2e `pedidos-do-titular.spec.ts:692`, `:744-771` | Foto com dado semeado: `coordenacao--coordenacao-privacidade-pedidos--computador.png` ("Prazo vencido há 5 dias (venceu em 12/10/2026)") |
| RF21 | ATENDIDO | `operacao/estados-da-escola.ts:7-15`; `operacao/rotas.tsx` | `operacao/paginas/Escolas.test.tsx:142`, `:157`, `:194`, `:204`; `Uso.test.tsx:178`; e2e `operacao-escolas.spec.ts:89-112` | Sem foto lida: a vitrine não cobre a operação (a 14.0 deixou para cá). O RF é de tabela e texto, e o e2e `operacao-*` prova os dois nas duas larguras; fica como pendência de foto (seção 6) |
| RF22 | PARCIAL | cada tela | ver matriz em Críticos C4 | "O vazio só com a leitura terminada e sem erro" não tem asserção no carregando e no erro de seis telas |
| RF23 | PARCIAL | `Painel.tsx:59`; `privacidade/DetalheDoPedido.tsx:157`; `miolo-que-rola.ts:12`, `:25`, `:33` | `paginaNaoRola` (`e2e/__fixtures__/coordenacao.ts:95`) em `areas.spec.ts:316`, `incidentes.spec.ts:572`, `:591`, `:607` | Medido: o Painel rola 97 px com a faixa de incidente; o detalhe do pedido rola 88 px sem a faixa e 186 com ela; nenhum teste mede os dois casos (Críticos C1 e C2). A 360 px: zero de rolagem lateral nas 13 telas medidas |
| RF24 | ATENDIDO | — | `git diff develop...f01ecbd`: nenhum `.skip`/`.only`/`.fixme`, nenhum teste apagado; casos do e2e de 448 para 500 | Parte do e2e da antiga seção Alocação foi para a unidade, sem registro na 7.0 (Menores) |

Provas de mutação (cada uma aplicada, rodado só o teste citado, restaurada com `git checkout --`; árvore limpa no fim):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF4, regra 20 (leitura auditada) | `fila-da-coordenacao.ts:259`: `refetchQueries({ queryKey, exact: true })` trocado pelo prefixo (`queryKey.slice(0, 1)`) | `SinoDaCoordenacao.test.tsx`: 6 de 22 vermelhos ("com a fila parcial, 'Tentar de novo' relê só o que falhou; nada de auditado é lido", "'Atualizar' relê as cinco leituras… não toca na lista de nomes nem nos pedidos" e mais quatro) |
| RF4 (nunca "Tudo em dia" sem ler tudo) | `fila-da-coordenacao.ts:166`: `|| truncada` tirado da condição de `parcial` | `fila-da-coordenacao.test.ts` ("lista truncada em qualquer das leituras: parcial") e `SinoDaCoordenacao.test.tsx` (2 casos): 3 vermelhos |
| RF7, D45/D64 | `fila-da-coordenacao.ts:84-96`: `contador` com o número de turmas contestadas por professor no item de contestação | `fila-da-coordenacao.test.ts` (2 casos) e `Painel.test.tsx` ("dois professores com pendências diferentes… nenhum número ao lado de nome de professor"): 3 vermelhos |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: dado que não existe fica fora (14.1) | cumprida | nenhuma rota nova (`git diff develop...f01ecbd -- apps/api packages` vazio); fotos sem frequência, nota ou Ideb |
| Regra: nenhum indicador de professor (14.2, D45, D64) | cumprida | mutação 3; `Governanca.tsx:38-44` sem Turma nem "Aprovado por"; `Professores.test.tsx:186` sem coluna de uso |
| Regra: grupo pequeno decidido pelo servidor (14.3) | cumprida | `analista.spec.ts:131` contra o servidor real |
| Regra: nominal pede finalidade e audita cada leitura (14.4) | cumprida | `analista.spec.ts:78` (duas leituras, duas linhas na `auditoria`) |
| Regra: Analista só hipótese sobre conteúdo (14.5) | cumprida | `Analista.tsx:160-166`; `Analista.test.tsx:221` |
| Regra: coordenação não abre trecho do Tutor (14.6) | cumprida | nenhuma tela nova lê conversa; leituras do Painel e do sino fechadas em `Painel.test.tsx:316`, `SinoDaCoordenacao.test.tsx:139` |
| Regra: operação sem ação nova sobre conta de pessoa (14.9, D76) | cumprida | `acoes-do-convite.ts` sem mudança; `Escolas.test.tsx:157` |
| Regra: leitura auditada não sai sozinha | cumprida | mutação 1; `Painel.test.tsx:316`; `pedidos.spec.ts:319` |
| Regra: suspender com confirmação, motivo de lista fechada e auditoria | cumprida | `Agentes.tsx:253-279`; `agentes.spec.ts:214-221` |
| Regra: licença obrigatória, recusa auditada | cumprida | `material.spec.ts:226` (corpo sem `%PDF-`, `recusasNaAuditoria` no banco) |
| Regra: vínculo da escola, professor só confirma | cumprida | `alocacao.spec.ts:153`; `escola-montada.spec.ts:162-163` |
| Regra: a onça não entra no sino | cumprida | `Sino.tsx:185`; `avatar-so-nas-duas-pecas.test.ts:32`; `Sino.test.tsx:136` |
| Borda: escola recém-criada, sem ano letivo | coberta | `Painel.test.tsx:331`, `:344`; `Estrutura.test.tsx:179`; e2e `sino-da-coordenacao.spec.ts:128`, `painel-da-coordenacao.spec.ts:83` |
| Borda: turma sem professor | coberta | `fila-da-coordenacao.test.ts:170`, `:208`; `turmas-da-escola.test.ts:52`; vista na foto ("Turmas sem professor, 2") |
| Borda: professor com duas disciplinas na mesma turma | coberta | `alocacao.spec.ts:244`; `professores-da-escola.test.ts:37`; `Professores.test.tsx:226` |
| Borda: professor que contestou | coberta | `Painel.test.tsx:272`; `alocacao.spec.ts:257`; `PainelDoProfessor.test.tsx:251`; vista na foto. Sem e2e do item no sino (só componente) |
| Borda: fila que falha em parte | coberta | mutação 2; `fila-da-coordenacao.test.ts:217`, `:240` |
| Borda: virada de ano, sem ano em curso | coberta | `Estrutura.test.tsx:193`; `estrutura.spec.ts:331`; `SinoDaCoordenacao.test.tsx:159` |
| Borda: lista lida só até o limite de páginas | coberta | `SinoDaCoordenacao.test.tsx:485` |
| Borda: segunda pessoa na mesma aba | coberta | `sino-da-coordenacao.spec.ts:149`; `painel-da-coordenacao.spec.ts:160`; `professores.spec.ts:1022`, `:1059` |
| Pronto: tudo pelos quatro lugares e pelo sino | cumprido | RF1 a RF3 |
| Pronto: nenhum caminho mais longo que o de hoje (medido como RF3) | cumprido | `areas.spec.ts:316`; o detalhe do pedido passou de 2 para 3 cliques, fora da medida do RF3 (Menores) |
| Pronto: nenhum indicador nominal de professor nem grupo pequeno novo | cumprido | mutação 3; RF7, RF8, RF18 |
| Pronto: cada tela cabe em 1366 × 768 sem rolar e funciona a 360 px | **faltando** | Painel com a faixa de incidente (97 px) e detalhe do pedido (88 px; 186 com a faixa). A 360 px, sem rolagem lateral |
| Pronto: e2e da A0b, A1, A5 e F3 provando as mesmas regras | a conferir na esteira, no fechamento | contagem do e2e subiu (448 → 500), nenhum caso pulado |
| Pronto: 24 RF com teste apontado; nenhuma rota, tabela ou permissão; sino sem mascote | cumprido | |

### 3. Portão

Esteira: conferida no fechamento.

| Portão | Resultado |
|---|---|
| `npm run typecheck`, `lint`, `test`, `test:e2e`, `test:infra` | não rodados aqui, por ordem do escopo (D79): a esteira do commit validado é conferida pelo Orquestrador no fechamento |
| Testes de evidência, rodados isolados | ✅ unidade e componente do escopo: `fila-da-coordenacao`, `Sino`, `SinoDaCoordenacao`, `Painel`, `sino-por-area`, `navegacao`, `molduras`, `o-que-falta-da-escola` (131 casos); `Analista`, `Estrutura`, `Professores`, `PainelDoProfessor`, `Material`, `ListaDaTurma`, `turmas-da-escola`, `professores-da-escola`, `materiais-da-escola` (240 casos); `Governanca`, `Agentes`, `textos-da-governanca`, `Segmentado`, `privacidade/*`, `operacao/**` (316 casos). Todos verdes. As três mutações ficaram vermelhas |
| Dependências | `node_modules` em dia com o `package-lock.json`; `npm ci` não foi preciso |
| Revisões com veto registradas e aprovadas | ✅ nas 14 tarefas, todo revisor obrigatório tem rodada, e a última de cada um é APROVADO |
| `/revisar-spec` | ✅ `revisao-spec.md`, rodada 4, APROVADA |
| Commits sem marca | ✅ nenhum commit sem `(tarefa N.0)` nem `(correção …)` leva código: os demais só mexem em `estado.md`, `tasks.md` e na Tech Spec |

### 4. Achados

**Críticos**

- **C1 — RF23: o Painel rola 97 px a 1366 × 768 quando há incidente adiado.** `apps/web/src/areas/coordenacao/Painel.tsx:59`:
  `LISTA_QUE_ROLA = 'max-h-[clamp(9rem,calc(100dvh_-_40rem),18rem)] …'` não desconta `--faixa-de-incidente`, ao contrário dos miolos de
  `miolo-que-rola.ts:12`, `:25`, `:33`. Medido no navegador: Painel com a faixa, 97 px; sem a faixa, 0; Analista, Escola, IA e Agentes
  com a faixa, 0. Foto: `.processo/vitrine/coordenacao--coordenacao-painel--button-name-Ver-depois--computador.png` (865 px de altura). É
  justamente o estado em que a coordenação abre no Painel com o incidente urgente na fila. Nenhum teste mede: `incidentes.spec.ts:607`
  prova a faixa só na Analista. Correção: descontar `var(--faixa-de-incidente,0px)` na altura das listas do Painel (ou dar ao Painel um
  miolo que rola, como as outras telas), e estender o caso de `incidentes.spec.ts:607` ao Painel, com a mutação declarada.
- **C2 — RF23: o detalhe do pedido rola 88 px a 1366 × 768, e 186 px com a faixa.** `apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx:157`
  (`Tela` de leitura sem miolo que rola). Medido com um pedido "recebido", sem arquivo, no estado mais curto da tela. Foto:
  `.processo/vitrine/coordenacao--coordenacao-privacidade-pedidos-01a14b92-239d-77eb-9ed5-71e21717d69c--button-name-Ver-depois--computador.png`.
  A tela está fora do laço de `areas.spec.ts:302` e de todo `paginaNaoRola`. Correção: dar à página um miolo que rola (como
  `O_MIOLO_DOS_AGENTES`, descontando a faixa) e pôr o detalhe no laço de `areas.spec.ts`, ou no e2e de `pedido-do-titular.spec.ts`,
  com `paginaNaoRola`.
- **C3 — RF12 a RF15: o painel lateral aberto pelo endereço fica por cima do aviso de incidente.** Com incidente sem confirmação, abrir
  (ou recarregar) `/coordenacao/professores?professor=<id>`, `/coordenacao/material?material=<id>` ou `/coordenacao/estrutura?painel=ano`
  abre os dois `<dialog>` modais: o `Dialogo` do aviso (`privacidade/AvisoDeIncidente.tsx:106`, montado em `rotas.tsx:52`) e, depois
  dele, o `PainelLado` (`PainelDoProfessor`, `PainelDoMaterial.tsx:40`, `AnoEDisciplinas.tsx:425`). O painel fica no alto da camada,
  cobre o texto do aviso e deixa o aviso inerte até ser fechado (o Playwright não alcança "Ver depois": "`<dialog data-painel-lado>`
  intercepts pointer events"). Fotos: `coordenacao--coordenacao-professores--computador.png`, `coordenacao--coordenacao-material--celular.png`,
  `coordenacao--coordenacao-estrutura--computador.png`. É o caso de quem recarrega a página com o painel aberto ou abre um item do sino
  em aba nova. Correção: o aviso de incidente precisa ficar por cima (o painel pelo endereço só abre depois de o aviso ser fechado, ou o
  aviso reabre por último), com um e2e que entra com incidente pendente direto num endereço com painel e confirma pelo aviso.
- **C4 — RF22: "o vazio só com a leitura terminada e sem erro" sem asserção no carregando e no erro de seis telas.** Os casos conferem
  que a tabela não existe, mas não que o texto do vazio não aparece; uma tela que mostrasse o vazio durante a leitura ou junto do erro
  passaria. Onde: Turmas, `Estrutura.test.tsx:160` e `:166` ("Comece pelo ano letivo"/"Nenhuma turma ainda"); Pedidos,
  `privacidade/Pedidos.test.tsx:86` e `:96` ("Nenhum pedido registrado"); Operação, `operacao/paginas/Escolas.test.tsx:42`, `:57` e
  `Uso.test.tsx:35`, `:50`; o carregando de Professores, `Professores.test.tsx:154`, e da lista da turma, `ListaDaTurma.test.tsx:177`;
  e o bloco de consumo do Painel, que não tem caso de carregando nem de erro (`Painel.test.tsx`, o consumo vem sempre pronto,
  `:78`, `:109`). Correção: em cada caso, `expect(screen.queryByText(<texto do vazio>)).toBeNull()`, e no Painel os dois casos do
  consumo; declarar a mutação de cada condição do vazio.

**Maiores**

- `docs/interface.md:302-304`, `:1520`, `:1523`: a seção 3 e a tabela "O que cada papel vê" ainda descrevem a coordenação com os sete
  itens e "A coordenação abre em Governança (depois, no Painel)". Com a X2, a coordenação abre no Painel, com quatro lugares. Correção:
  atualizar a seção 3 e a linha da coordenação para o estado depois da X2, e a frase de onde ela abre.

**Menores**

- `apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx:152-156`: `antes` é lido depois do clique e comparado na linha seguinte,
  sem espera entre os dois; a asserção passa sempre. Correção: ler `antes` antes do clique. A regra está provada por `Sino.test.tsx:75`.
- `apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts:111`: `expect(TIPOS_DA_FILA).toContain(item.tipo)` é tautológico (o tipo já
  é um membro da constante). Correção: fixar `TIPOS_DA_FILA` com `toEqual` dos cinco.
- RF18: nenhum teste exclui um campo de busca ou filtro por pessoa em Registros › IA (D45, D64). Correção: no `Governanca.test.tsx`,
  zero `searchbox` e `textbox`, como o `Analista.test.tsx:221`.
- RF19 e Tech Spec §9 (11.0, "a suspensão e a retomada seguem pelo mesmo diálogo"): o texto dá a entender que retomar pede confirmação;
  o código (`Agentes.tsx:142-145`, igual à `develop`) retoma direto, e a regra de negócio do PRD só exige confirmação para suspender.
  Correção: acertar o texto do RF19 e da §9.
- RF3 e roteiro: o detalhe de um pedido passou de 2 cliques (Privacidade › linha) para 3 (Registros › Pedidos › linha), porque Registros
  abre em IA; do Painel, pela porta "Pedidos dos titulares", continua a 2. Fora da medida do RF3; para o Joaquim saber.
- Tech Spec §9, "Chromebook e celular" (`techspec.md:127`): ainda diz que Material, Pedidos e IA têm teto de linhas com "Mostrar
  mais", o que contradiz o "Como ficou na 8.0" da mesma seção. Correção: tirar a frase ou ajustá-la ao que ficou ("Ver mais pedidos" e
  "Carregar mais" paginam; Material mostra a lista inteira até o teto de páginas).
- Tech Spec §7c, "Releitura": lista quatro opções; o código tem também `retryOnMount: false` (`fila-da-coordenacao.ts:190`), que entrou
  pela correção `2026-10-16-tentar-de-novo-da-estrutura-no-celular` sem nota na Tech Spec. Mesmo sentido da regra; falta o registro.
- Tech Spec §10 diz que o e2e `governanca` prova "no servidor" que os números ficam com o filtro; ele prova a tela (que ignora os
  números da resposta filtrada). Correção: ajustar a frase.
- Prazos de guarda não têm vazio (`privacidade/Retencao.tsx:28`, só um comentário); a 13.0 pedia o vazio nas três telas. Registrar na
  Tech Spec que não se aplica (os prazos sempre existem), como foi declarado nos Agentes.
- RF24: a antiga seção Alocação tinha no e2e "Crie um professor primeiro", "Professores · falta" com só um convite vencido e
  "não diz 'Alocação · falta' antes de ler os vínculos" (`develop:e2e/estrutura.spec.ts`, W4); com a seção desfeita, isso foi para a
  unidade (`o-que-falta-para-alocar.test.ts:15`, `o-que-falta-da-escola.test.ts:40`), e o `7_task.md` diz "sem perder asserção" sem
  registrar a mudança. Correção: uma linha no `7_task.md`.
- Mutações antigas que não aplicam mais: três blocos de `1_task.md` citam `...SEM_LEITURA_SOZINHA` onde o código hoje usa
  `LEITURA_DA_FILA`, e três de `3_task.md` procuram `O_MIOLO_QUE_ROLA` em `moldura.tsx` (hoje em `miolo-que-rola.ts`). Só pesa se o
  portão daquelas tarefas rodar de novo; para o `/retro`.
- Os títulos dos itens do sino e da fila do Painel saem cortados com reticências a 1366 px ("Professora Sintética Marta 3f5476e2
  cont…", "O material "Apostila de validação que fal…"): o `Linha` da X1 (`componentes/Linha.tsx:58`) trunca com `title`. O que o
  item pede some com nome longo. Sugestão: deixar o título do item quebrar em duas linhas no sino e no Painel.
- A 360 px as abas de Escola quebram em duas linhas (Turmas e Professores numa, Material na outra): legível, sem esconder a aba, mas
  difere do mockup.
- Recomendações sem destino: as duas do `frontend-reviewer` na correção `2026-10-17-troca-de-escola-sem-ir-para-a-entrada` (título do
  incidente truncado no cartão do Painel a 360 px; texto de incidente da vitrine pouco realista) e a do sino que faz 6 leituras a cada
  recarga de página (achado da correção da aba das empresas) ainda não estão no `TODO.md`, como o `estado.md` já lembra.
- `e2e/__fixtures__/verificacoes.ts:98`: `larguraExcedenteDoDialogo` passou a medir só o `dialog[open]` de cima. Era necessário (com
  dois abertos o localizador estrito falharia), mas o painel de baixo deixa de ser medido quando há diálogo por cima.

**Positivos**

- Mutações declaradas por cláusula em todas as tarefas: as três que rodei aqui ficaram vermelhas de primeira, nos testes que a tarefa
  apontou.
- A fila e o Painel provam o que não leem (as rotas chamadas comparadas com `toEqual`), e isso é o que segura a regra 20 numa tela que
  só agrega.
- A releitura por chave exata, com teste que monta as leituras auditadas ativas e quebra se o prefixo voltar.

### 5. Conclusão

REPROVADA por quatro críticos. Três são de tela, vistos e medidos agora: o Painel e o detalhe do pedido rolam a página a 1366 × 768
(C1, C2, contra o RF23 e o critério de pronto), e o aviso de incidente fica por baixo do painel lateral aberto pelo endereço (C3). O
quarto é de prova: o vazio que não pode aparecer durante a leitura ou o erro não tem asserção em seis telas (C4). Nenhum é regra de
negócio violada: isolamento, dado pessoal, leitura auditada, indicador de professor e nominal estão atendidos e provados, e as
mutações confirmam.

O caminho até a aprovação: uma correção para C1 e C2 (as alturas, com `paginaNaoRola` no Painel com a faixa e no detalhe), uma para C3
(a ordem dos dois modais, com o e2e que entra direto no endereço com incidente pendente), e uma para C4 (as asserções do vazio, que são
de teste só). O Maior de `docs/interface.md` cabe em qualquer uma delas. Depois, revalidação só desses pontos e da esteira.

### 6. Pendências herdadas

- Foto da operação (`/operacao`, `/operacao/uso`): a vitrine não entra como operador. Destino: `TODO.md`, junto da ferramenta da
  vitrine (a 14.0 já registrou).
- `?estado=rejeitada` em Registros › IA levou 30,2 s com 60 mil entregas (achado da 10.0, da consulta da A5): já no `TODO.md`, para o
  Joaquim com o `infra-guardian`.
- O complemento da contestação só tem prova de componente (a fixture de banco grava só o motivo): registrado na 7.0.
- A vitrine cheia ficou com o dado semeado por esta validação (lista no topo); `vitrine.ts montar` a recria.

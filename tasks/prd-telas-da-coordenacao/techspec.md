# Tech Spec — Telas da coordenação

**PRD:** `tasks/prd-telas-da-coordenacao/prd.md`
**Status:** revisada pelos guardiões em 13/10/2026 (rodada 4, `revisao-spec.md`) e aprovada por delegação do Joaquim; ele revê ao ler
**Tamanho:** acima do teto de 2.000 palavras, com aceite por delegação do Joaquim (13/10/2026). Motivo: a revisão dos guardiões exigiu por escrito os casos de releitura, de retry por chave exata, de lista truncada, de ano letivo ausente, de vínculo encerrado, de permissão do sino e de troca de escola

## 1. Resumo da abordagem

Só `apps/web` e `e2e/`. A navegação passa a quatro lugares; **Escola** e **Registros** viram molduras (título e abas) que leem a aba do endereço de hoje e desenham dentro a tela que já existe; cada tela é recomposta com as peças da X1, uma por tarefa, sem trocar consulta nem mutação. O sino é uma peça de `componentes/` que recebe a lista por prop; a fila é uma função pura sobre consultas que já existem. O desenho de referência está em `mockup.md`.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `apps/web/src/componentes/sino/` | novo | `Sino` |
| `apps/web/src/componentes/CascaDaEscola.tsx` | alterado | a âncora do sino, vazia |
| `apps/web/src/areas/navegacao.ts`, `caminhos.ts`, `paginas/Inicio.tsx` | alterado | os quatro lugares, `/painel`, onde a coordenação abre |
| `apps/web/src/areas/coordenacao/` | novo e alterado | `Painel`, `Escola`, `Registros`, a fila, e as telas recompostas |
| `apps/web/src/operacao/paginas/`, `operacao/componentes/` | alterado | a página com abas e as tabelas |
| `e2e/` | alterado | `__fixtures__/coordenacao.ts`, os specs das telas |

## 3. Modelo de dados

Nenhuma tabela.

## 4. API

Nenhuma rota. Uso novo de parâmetro que já existe: `GET /v1/governanca/resumo?estado=` (`esquemaConsultaResumoDaGovernanca`).

## 5. Fluxo

**Endereços.** O lugar fica aceso por `tambemEm`; o `rotas.tsx` da área embrulha cada rota na moldura dela.

| Endereço (em `/coordenacao`) | Lugar › aba | Tela |
|---|---|---|
| `/painel` (novo) | Painel | `Painel.tsx` |
| `/analista` | Analista | `Analista.tsx` |
| `/estrutura` | Escola › Turmas | `Estrutura.tsx` |
| `/estrutura/turmas/:turmaId` | Escola, com "‹ Escola" | `ListaDaTurma.tsx` |
| `/professores`, `/material` | Escola › Professores, Material | `Professores.tsx`, `Material.tsx` |
| `/governanca` | Registros › IA | `Governanca.tsx` |
| `/agentes` | Registros, com "‹ Registros" | `Agentes.tsx` |
| `/privacidade`, `/privacidade/pedidos` | Registros › Pedidos | `privacidade/Pedidos.tsx` |
| `/privacidade/pedidos/:pedidoId` | Registros, com "‹ Pedidos" | `privacidade/DetalheDoPedido.tsx` |
| `/privacidade/retencao`, `/suboperadores`, `/incidentes` | Registros › Privacidade | `privacidade/Privacidade.tsx` |

**Como se chega aos Agentes (3.0).** O Painel só leva aos Agentes quando há função suspensa (o `Aviso`), e RF3 pede toda tela a até dois cliques. Por isso a aba Registros › IA traz o link secundário "Como cada IA trabalha", que abre `/agentes` (lugar e link: dois cliques). Os testes `e2e` dos Agentes chegam por ele.

**O que muda de asserção com a forma da tela (3.0).** A troca dos specs é mecânica no nome da fixture, no `h1` e no título; mudam também, porque o elemento mudou e a regra não, as asserções que citavam a forma antiga: a aba da Privacidade que virou `radio` do `Segmentado` (`aria-selected` vira `aria-checked`, e os nomes "Prazos de guarda", "Empresas" e "Incidentes"), o link da lateral "Estrutura" ou "Professores" que vira "Escola" (e o vizinho não selecionado que vira "Painel"), "Voltar para Estrutura" que vira "Voltar para Escola", e a coordenação no celular, que passa a ter a barra de baixo com os quatro lugares (RF1) onde antes tinha sete itens na gaveta.

**O que abre por cima fica na consulta do endereço**, só com id ou valor de lista fechada, e fecha tirando o parâmetro com `replace`: `?painel=ano|falta` e `?situacao=sem-professor` (Turmas), `?professor=<usuarioId>`, `?material=<id>`, `?estado=` (IA), `?ia=<agente>` (Agentes). Valor desconhecido é ignorado, e id de outra escola não acha linha.

**O sino.** A casca desenha um elemento vazio, a âncora (na barra de topo abaixo de 768 px; no canto de cima do conteúdo acima), e a expõe por `useAncoraDoSino()`. A área monta `SinoDaCoordenacao` acima do `Switch`, como o `AvisoDeIncidente`, por `lazy()`, e ele desenha o `Sino` na âncora por `createPortal`. A casca não importa nada da área. O sino só existe na área da coordenação: professor e aluno não o montam, e a X3 monta o do professor por outra peça. O `Sino` é um botão ("Esperando você, N" ou "Esperando você, nada", esta última só com a fila lida inteira; lendo, parcial sem item e em erro o nome diz "carregando", "parte não carregou" e "não carregou") que abre a lista num `PainelLado`. A lista fecha ao se ir a um item (muda o caminho ou só a consulta do endereço).

**A fila.** `useFilaDaCoordenacao()` devolve os itens (`id`, `tipo`, `titulo`, `detalhe`, `urgente`, `para`, e `contador` só em "turmas sem professor", como `{ n, oQueConta }`: o número e o que ele conta, em texto, que o `Contador` diz ao leitor de tela) e a situação (`carregando`, `pronta`, `parcial`, `erro`):

| Tipo | Vem de | Leva a |
|---|---|---|
| incidente sem confirmação, um item por incidente, no grupo "Urgente" | `consultaIncidentes` | `/privacidade/incidentes` |
| professor contestou a turma, um item por vínculo contestado e ainda aberto | `consultaVinculos` (`contestado`, não encerrado), nome de `consultaProfessores` | `/professores?professor=` |
| convite vencido, um item por convite, escrito "Refazer o convite de …" | `consultaProfessores` (`vencido`) | `/professores?professor=` |
| material que falhou | `consultaMateriais` (`falhou`) | `/material?material=` |
| turmas sem professor (um item, com a contagem) | `consultaTurmas` menos as de `consultaVinculos` com vínculo pendente ou confirmado; vínculo encerrado não conta. A mesma função serve ao filtro "Sem professor" | `/estrutura?situacao=sem-professor` |

Com a falha de uma consulta, ou com `completa: false` em qualquer das cinco (`lerPaginas` bate em `MAXIMO_DE_PAGINAS_DA_ESTRUTURA`), os itens das outras aparecem, com `parcial` e o aviso "Parte da lista não carregou"; "turmas sem professor" não é calculada com turmas ou vínculos incompletos. Nada em `montarFila` deriva de uso, entrega ou atividade do professor. "Tentar de novo" também vale com a fila em `erro`. Revogar o convite tira o item. Turmas e vínculos só se leem com ano letivo em curso; sem ele a fila não os chama, não há item de turma, e "Tudo em dia" vale com as quatro leituras que existem (anos, incidentes, professores, materiais). "Tentar de novo" dos blocos do Painel relê só as consultas que falharam, por chave exata (`refetch` do observador, ou `invalidateQueries` com `exact: true`), nunca pelo prefixo `CHAVE_DA_ESTRUTURA` nem `CHAVE_DA_PRIVACIDADE`, que também guardam leituras auditadas. **"Tentar de novo" da fila relê o que falhou e também o que veio truncado (`completa: false`)**, cada um por chave exata, também sem o prefixo: com o aviso "Parte da lista não carregou" na tela, um botão que ignorasse a lista truncada não faria nada. O custo está dito na §7c. O item de convite vencido é tarefa de cadastro (refazer um link), não indicador de adesão do professor (D64). O vazio traz o link "Ver o que falta para a escola".

## 6. Isolamento (obrigatório)

Nenhuma consulta nova. A fila e o Painel usam as chaves de hoje (`CHAVE_DA_ESTRUTURA`, `CHAVE_DO_MATERIAL`, `CHAVE_DA_PRIVACIDADE`, `CHAVE_DA_GOVERNANCA` e a do consumo), que `main.tsx` esvazia na troca de escola e de pessoa. Painel aberto pelo endereço acha o id na lista já carregada, sem `GET` por id. Testes: os de segunda pessoa e de troca de escola que existem continuam sem perder asserção, e ganham a fila, o Painel e o painel aberto pelo endereço, e na troca de escola os números e a fila de A não aparecem em B, nem enquanto B carrega: o `?professor=` da escola A, na sessão de B, não mostra nada de A.

## 7. Dado pessoal (obrigatório)

| Item | Resposta |
|---|---|
| Campos pessoais tocados | nome de professor, na fila (e o complemento da contestação, só no painel dele); nome e matrícula de aluno, só na lista da turma e nos pedidos, como hoje |
| Novos campos, log, envio a provedor externo | nenhum, nada novo |
| O que entra em auditoria | o de hoje, sem leitura a mais: lista de nomes, pedidos de nome e pedidos de titular **não** são observados pela fila nem pelo Painel |
| Retenção, autorização por objeto, DTO de saída | inalterados |

No endereço, só id; a aba do navegador nunca leva nome de pessoa. Nada em `localStorage` nem em `sessionStorage`.

## 7b. Conformidade CNE (quando há IA no caminho do aluno)

Nenhuma função muda. Analista e "Como cada IA trabalha" usam a `AssinaturaIA`, e a cabeça da onça não é importada fora do avatar (X1, 7b); o sino não importa nada de `componentes/onca/`. A autonomia vem de `/v1/governanca/funcoes`, sem texto reescrito na tela. O nominal continua atrás do botão oficial e do diálogo que avisa, e reabrir pede a finalidade de novo. Agentes mantém autonomia e selo "Alto risco"; Professores não ganha coluna de acesso nem de uso. O vazio do sino usa ícone ilustrado, sem mascote: a onça de corpo inteiro nele é decisão do Joaquim (mexe na leitura da D80, item 3; ver seção 12).

## 7c. Carga e falha (obrigatório)

| Item | Resposta |
|---|---|
| Está no caminho quente? | nenhum: a coordenação é de uma a três pessoas por escola |
| Carga na manhã de segunda | pior caso do sino: seis leituras ao entrar (turmas e vínculos só com ano em curso), cinco listas paginadas em até 10 requisições cada (`MAXIMO_DE_PAGINAS_DA_ESTRUTURA`: anos, professores, materiais, turmas, vínculos) e os incidentes em uma, até 51 pedidos. O Painel soma até 23: séries e disciplinas, até 10 cada, e resumo, consumo e funções, uma cada; anos, professores, turmas e vínculos são as chaves da fila, com o mesmo frescor, e não somam. O resumo conta uma: o Painel relê só a primeira página, mesmo com a Governança tendo paginado a mesma chave. Com toda lista no teto, abrir o Painel faz até 74 pedidos, contra o `LIMITE_REQ_USUARIO_MIN` (120); uma escola do recorte cabe em uma ou duas páginas por lista. "Tentar de novo" com a lista truncada relê a que bateu no teto: até 10 requisições por lista truncada e por clique, e com o dado real ela volta truncada do mesmo jeito; o botão fica desligado enquanto a leitura corre (`tentandoDeNovo`), o que impede o clique duplo |
| Fila, limite por escola, rate limit, índices, migration | não se aplicam: nenhuma rota e nenhuma tabela |
| Corridas de concorrência | nenhuma nova: as mutações e as travas são as de hoje |
| Quando cada dependência cai | cada bloco tem o seu erro com "Tentar de novo"; a fila mostra o que leu (`parcial`) e nunca diz "Tudo em dia" sem ter lido |
| Métrica e alerta, teste de carga | o `size-limit` e o teste do build; carga inalterada |

**Releitura.** Os observadores da fila e os blocos do Painel usam `staleTime` de 5 minutos, `refetchInterval: false`, `refetchOnWindowFocus: false` e `refetchOnReconnect: false`; o de incidentes usa `staleTime: Infinity`, como o aviso (uma leitura por sessão). O sino lê ao entrar na área e relê quando uma tela invalida a chave, isto é, quando a coordenação age. O Painel relê ao abrir se a leitura passou de 5 minutos. Motivo (regra 80): fila que relê sozinha multiplica leitura por tempo de aba aberta. `consultaMateriais` herda o `refetchInterval` de 1,5 s da tela Material (`api/material.ts`); o observador da fila o desliga com a primeira das três opções, senão um material `processando` faria cerca de 40 leituras por minuto por aba. Teste em dois tempos na 1.0: com 10 s ou mais e um material `processando`, zero chamadas (o intervalo); além de 5 minutos, com o dado velho, o foco volta (`focusManager.setFocused(false)` e depois `setFocused(true)`) e a rede volta (`onlineManager.setOnline(false)` e depois `setOnline(true)`), sem chamada nenhuma (o foco e a reconexão). Um evento `focus` na janela ou um `online` solto não servem: o TanStack só escuta `visibilitychange` e só avisa quando o estado muda. O teste restaura os dois gerenciadores no `afterEach` e tem o controle de `api/privacidade.test.ts`: a mesma consulta, com a opção ligada, relê. **"Atualizar"** do sino relê só os cinco observadores da lista (anos, turmas, vínculos, professores e materiais; os incidentes são uma leitura por sessão e ficam de fora), cada um pela chave exata, nunca pelo prefixo `CHAVE_DA_ESTRUTURA` nem `CHAVE_DA_PRIVACIDADE`, que também guardam a lista de nomes e os pedidos (leituras auditadas); "Atualizado às HH:MM" só muda depois do clique, sem temporizador. Nenhuma ação nova invalida prefixo.

**Bundle.** `Estrutura`, `ListaDaTurma` e `Professores` saem da fachada para `lazy()`, como o `Painel`, as molduras e o sino. Os tetos da fachada (16 kB) e da operação (60 kB) não sobem; cada `tela-coordenacao-*` fica em 30 kB. Os ícones dos quatro lugares moram na entrada: ilustrados se somarem até 1 kB em brotli; senão, `lucide` no `Ladrilho`.

## 8. Uso de IA (quando aplicável)

Nenhuma chamada nova.

## 9. Frontend

**Molduras.** `Escola` e `Registros`: `Tela` com o título, `Abas` com a aba do endereço (`aoMudar` navega) e o miolo. As telas de dentro perdem a `Tela` delas: o `h1` é "Escola" ou "Registros", e a aba do navegador diz "Escola: turmas", "Registros: IA" e assim por diante.

**Altura.** A partir de 768 px só o miolo rola, numa região com nome e `tabIndex={0}`; abaixo, rola a página.

**Painel** (`grade`): a faixa do incidente é a de hoje, acima da tela; função suspensa (`Aviso`, com link para Agentes); quatro `NumeroPainel` e o consumo, com "Ver em Registros"; "Esperando você" (a fila) e a porta "Pedidos dos titulares"; "Para terminar a escola" (`o-que-falta-da-escola.ts`, extraído da Estrutura).

**Analista** (`leitura`): `AssinaturaIA` no topo, "Gerar resumo" como ação, os blocos de hoje e o `DadoNominal`, que sai da Governança. Sem resumo nenhum, o botão "Gerar resumo" é o do vazio (`EstadoVazio`, com a ação `desligada` enquanto o pedido está no ar) e o do alto não aparece: um só botão e um só primário na tela; com resumo, ou com a leitura falha, ele volta ao alto.

**Escola › Turmas:** `Aviso` "Para terminar a escola" com "Ver o que falta" (`?painel=falta`); `Segmentado` "Situação"; `Tabela` agrupada por série, com `Linha`; `Menu` da linha; painel "Ano letivo e disciplinas" (`?painel=ano`) com as três seções de hoje e os diálogos delas por cima. **Como ficou na 5.0:** a `Tabela` não agrupa, e por isso são uma `Tabela` por série, cada uma com o título da série (`h3`) e sem `Linha` (a `Linha` é das listas do painel); a linha inteira abre a lista da turma porque o link da primeira célula se estende sobre a linha (`relative` na linha e no cartão da `Tabela`, `after:inset-0` no link), com o `Menu` da última célula num contêiner `relative`, sem `z-index`, depois do link (a lista do menu aberto não fica presa na linha) e o nome acessível "Lista de nomes da turma <nome>" no `aria-label`; a coluna Situação diz "Sem professor", "Com professor" ou "—" quando os vínculos não vieram inteiros e a turma não tem professor à vista; o primeiro ano letivo criado a partir do vazio abre `?painel=ano`, porque é nele que o anúncio mora e que o ano se abre. O painel aberto já pelo endereço, sem botão que o tenha aberto, devolve o foco ao título das turmas quando fecha. A Alocação continua na página até a 7.0, com o "Alocar" cheio: até lá a aba tem "Nova turma" como único botão cheio das Turmas e "Alocar" como o da Alocação.
**Professores:** `Tabela`; `PainelLado` do professor com a situação, as ações do convite, as turmas dele e "Acrescentar turma" (`Alocacao.tsx` vira esse diálogo).
**Material:** `Tabela`; `Dialogo` "Enviar material" com o formulário de hoje (`material-envio.ts` não muda); `PainelLado` do material.
**Lista da turma:** duas colunas a partir de 1024 px (os nomes; os professores da turma e os pedidos).

**Registros › IA:** números, `Segmentado` de estado, a tabela de hoje, o consumo ao lado. **Pedidos:** `Tabela` com a coluna "Prazo" (`prazoDoPedido`, que já existe). **Privacidade:** `Segmentado` no lugar das abas. **Agentes:** `Segmentado` "Qual IA" e um agente por vez.

**Operação:** o título "Operação" à vista, com a frase fixa de que a operação não vê dado de pessoa, e a navegação "Operação" desenhada como abas (continuam links), tudo dentro do `main`. A Escolas usa a `Tabela` (Escola com o endereço, Rede, Coordenação com o estado em `Estado` e a ação do convite, Uso). O Uso mantém a tabela dele, com o dia e o mês de referência como grupos de três colunas no cabeçalho, porque a `Tabela` não agrupa colunas: é a de hoje, na pele da peça (moldura de 2 px, cabeçalho de 44 px, linha de 64 px), e a lista de cartões abaixo de 768 px. As duas telas ficam numa `RegiaoDaLista`: a partir de 768 px a lista rola por dentro, com as páginas presas no pé e o foco na região só quando ela rola (RF23); o vazio do Uso é o `EstadoVazio`, com um botão para a Escolas no lugar do link; o vazio da Escolas é o `EstadoVazio` sem ação, porque o "Nova rede" do topo já é o convite (um só primário por tela). O erro das duas telas continua no `ErroDaOperacao`, a peça da operação, na pele do `EstadoErro` (borda de 2 px, `t-apoio`): a mensagem vem de `textoDaFalha`, no chunk da operação, e o `EstadoErro` a escreve pelo catálogo da entrada, que não carrega os textos da operação.

**Nomes que não mudam** (contrato com o e2e): um `<main>`; as regiões "Turmas de <ano>", "Ano letivo", "Séries", "Disciplinas", "O que falta para a escola começar", "Nomes da turma", "Prévia", "Materiais da escola", "Lista de escolas", "Uso por escola"; os rótulos dos campos e os títulos dos diálogos; o link "Lista de nomes da turma <nome>"; `data-agente`, `data-funcao`, `data-aprovacao`, `data-estado`, `data-dado-nominal`; `navigation` "Operação".

**Chromebook e celular.** Nenhuma biblioteca nova; a `Tabela` vira lista abaixo de 768 px. Alvo de toque de 24/44 px no e2e `celular`. Material, Pedidos e IA têm teto de linhas com "Mostrar mais". O link da linha fica na célula do nome, com o `Menu` como irmão.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | `montarFila`, tipo a tipo e nos casos de borda (falha parcial, `completa: false`, sem ano, vínculo encerrado, um item por vínculo sem contador de professor); a contagem do sino igual à do filtro; `oQueFaltaDaEscola`; o prazo na linha do pedido; `navegacao.test.ts` com os quatro lugares |
| Componente (jsdom, `__fixtures__/tela.tsx`) | cada tela e o `Sino`: os quatro estados, o foco e as chamadas feitas; o Painel e o sino sem número por professor; o sino com relógio falso em dois tempos (10 s com material `processando`; mais de 5 min com o foco e a rede saindo e voltando pelo `focusManager` e pelo `onlineManager`: zero chamadas, e o controle com a opção ligada relê), o retry e o "Atualizar" por chave exata, o Painel sem ano letivo (2.0), sem ano letivo e nas áreas de professor e aluno (1.0); `PainelDoProfessor` com vínculo encerrado (7.0); o filtro da IA contra rede falsa que devolve números diferentes com `?estado=` (10.0) |
| E2E | os specs de hoje, com o caminho novo, nos dois projetos; `sino-da-coordenacao` (também `--vazia`) e `painel-da-coordenacao` (também a troca de escola), novos; `governanca` com `montarEscolaComEntregas`, provando no servidor que `estado` filtra a lista e os números ficam; `estrutura.spec.ts` partido em `estrutura`, `lista-da-turma` e `alocacao`, e `governanca.spec.ts` em `governanca`, `agentes` e `analista`, movendo os casos sem mudar asserção |
| Isolamento | os de segunda pessoa e de troca de escola, com a fila e o painel pelo endereço (seção 6) |

A navegação dos specs passa por `e2e/__fixtures__/coordenacao.ts` (`irPelaCoordenacao`, `esperarPainel`, `paginaNaoRola`).

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa | Documento que registra o desvio |
|---|---|---|---|
| 00, 10, 40 | só a web; seções 6 e 10 | nenhum | — |
| 20 | seção 7; nenhuma leitura auditada a mais | o mockup conta "sem lista" e pedidos: não entra | PRD, seções 6 e 10 |
| 50 | seções 7c e 9 | a lista do sino abre em `PainelLado`, e não em flutuante | esta seção |
| 70 | seção 7b | "Como cada IA trabalha" é página, não painel | PRD, seção 10 |
| 80 | seção 7c | nenhum | — |

## 12. Premissas não verificadas

- `⚠️ NÃO VERIFICADO` — a API da `Linha`, do `PainelLado`, do `Segmentado` e da `Tabela` agrupada da X1, que ainda não rodou. Saída: cada tarefa lê a peça antes; o que faltar entra na tarefa, com seção na galeria
- `⚠️ NÃO VERIFICADO` — um `Dialogo` aberto sobre um `PainelLado` (dois `<dialog>` modais). Saída: o e2e prova foco e Esc; se falhar, o painel fecha ao abrir o diálogo e reabre ao fechar
- Verificado no código (tenancy e infra): o controller da governança repassa `estado` (`governanca.controller.ts`) e o repository filtra a lista e não os números. O teste da tarefa 10.0 prova os dois
- Verificado pela conta (tarefa 2.0): as requisições (não as consultas: `lerPaginas` pode fazer até 10) não batem no limite por usuário. Sino e Painel somados, com toda lista no teto, fazem até 74 pedidos ao abrir o Painel, contra 120 por minuto (§7c). O Painel lê os blocos numa leva só: ler em duas levas não muda a soma do minuto e não é saída. Se o staging mostrar 429 na coordenação, a saída é o Painel ler séries e disciplinas com uma página só, numa chave própria, porque ali elas só dizem se existem (até 18 pedidos a menos)
- **Fora desta spec, decisão do Joaquim:** a onça de corpo inteiro no vazio do sino. A letra da D80, item 3, pede nome da função e selo "IA" junto da mascote. O `conformidade-reviewer` deu parecer favorável com condições: valer "sempre com nome e selo" para o avatar; mascote só no vazio "Tudo em dia", fora de região com item ou texto de IA, sem anel de agente e sem o "z"; atualizar `docs/interface.md` 9.7; estender o teste de arquitetura da X1 (`OncaDormindo` só em `componentes/sino/Sino.tsx`, `CabecaOnca` só em `AvatarAgente`). Sem a ratificação, não entra

## 13. Riscos técnicos

- **A tarefa dos lugares toca quase todos os specs da coordenação**: é mecânica (caminho e rótulo) e vem antes das telas
- **Os specs que atravessam telas** (`roteiro-da-demonstracao`, `escola-montada`, `fluxo-do-professor.ts`) põem em fila as tarefas que mudam o passo deles; a X3 e a X4 tocam os mesmos arquivos
- **A alocação muda de lugar** e leva três specs
- **A X3 depende da peça `Sino` e da âncora** (tarefa 1.0)

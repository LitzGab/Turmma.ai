# Tech Spec — Telas da coordenação

**PRD:** `tasks/prd-telas-da-coordenacao/prd.md`
**Status:** rascunho

## 1. Resumo da abordagem

Só `apps/web` e `e2e/`. A navegação passa a quatro lugares; **Escola** e **Registros** viram molduras (título e abas) que leem a aba do endereço de hoje e desenham dentro a tela que já existe; cada tela é recomposta com as peças da X1, uma por tarefa, sem trocar consulta nem mutação. O sino é uma peça de `componentes/` que recebe a lista por prop; a fila é uma função pura sobre consultas que já existem. O desenho de referência está em `mockup.md`.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `apps/web/src/componentes/sino/`, `componentes/onca/` | novo | `Sino` e a pose dormindo |
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

**O que abre por cima fica na consulta do endereço**, só com id ou valor de lista fechada, e fecha tirando o parâmetro com `replace`: `?painel=ano|falta` e `?situacao=sem-professor` (Turmas), `?professor=<usuarioId>`, `?material=<id>`, `?estado=` (IA), `?ia=<agente>` (Agentes). Valor desconhecido é ignorado, e id de outra escola não acha linha.

**O sino.** A casca desenha um elemento vazio, a âncora (na barra de topo abaixo de 768 px; no canto de cima do conteúdo acima), e a expõe por `useAncoraDoSino()`. A área monta `SinoDaCoordenacao` acima do `Switch`, como o `AvisoDeIncidente`, por `lazy()`, e ele desenha o `Sino` na âncora por `createPortal`. A casca não importa nada da área. O `Sino` é um botão ("Esperando você, N" ou "Esperando você, nada") que abre a lista num `PainelLado`.

**A fila.** `useFilaDaCoordenacao()` devolve os itens (`id`, `tipo`, `titulo`, `detalhe`, `contador`, `urgente`, `para`) e a situação (`carregando`, `pronta`, `parcial`, `erro`):

| Tipo | Vem de | Leva a |
|---|---|---|
| incidente sem confirmação | `consultaIncidentes` | `/privacidade/incidentes` |
| professor contestou a turma | `consultaVinculos` (`contestado`), nome de `consultaProfessores` | `/professores?professor=` |
| convite vencido | `consultaProfessores` (`vencido`) | `/professores?professor=` |
| material que falhou | `consultaMateriais` (`falhou`) | `/material?material=` |
| turmas sem professor (um item, com a contagem) | `consultaTurmas` menos as de `consultaVinculos` com vínculo de professor pendente ou confirmado | `/estrutura?situacao=sem-professor` |

Com a falha de uma consulta, os itens das outras aparecem, com `parcial`.

## 6. Isolamento (obrigatório)

Nenhuma consulta nova. A fila e o Painel usam as chaves de hoje (`CHAVE_DA_ESTRUTURA`, `CHAVE_DO_MATERIAL`, `CHAVE_DA_PRIVACIDADE`, `CHAVE_DA_GOVERNANCA`), que `main.tsx` esvazia na troca de escola e de pessoa. Testes: os de segunda pessoa e de troca de escola que existem continuam sem perder asserção, e ganham a fila, o Painel e o painel aberto pelo endereço: o `?professor=` da escola A, na sessão de B, não mostra nada de A.

## 7. Dado pessoal (obrigatório)

| Item | Resposta |
|---|---|
| Campos pessoais tocados | nome de professor, na fila; nome e matrícula de aluno, só na lista da turma e nos pedidos, como hoje |
| Novos campos, log, envio a provedor externo | nenhum, nada novo |
| O que entra em auditoria | o de hoje, sem leitura a mais: lista de nomes, pedidos de nome e pedidos de titular **não** são observados pela fila nem pelo Painel |
| Retenção, autorização por objeto, DTO de saída | inalterados |

No endereço, só id. Nada em `localStorage` nem em `sessionStorage`.

## 7b. Conformidade CNE (quando há IA no caminho do aluno)

Nenhuma função muda. Analista e "Como cada IA trabalha" usam a `AssinaturaIA`, e nenhum outro arquivo importa a cabeça da onça (X1, 7b). A autonomia vem de `/v1/governanca/funcoes`, sem texto reescrito na tela. O nominal continua atrás do botão oficial e do diálogo que avisa, e reabrir pede a finalidade de novo. **A onça de corpo inteiro** entra só como ilustração do vazio do sino: parada, `aria-hidden`, sem balão nem frase atribuída a ela. Não entra em "O que falta" nem na página do Analista.

## 7c. Carga e falha (obrigatório)

| Item | Resposta |
|---|---|
| Está no caminho quente? | nenhum: a coordenação é de uma a três pessoas por escola |
| Carga na manhã de segunda | ao entrar na área, 5 leituras a mais (anos, turmas, vínculos, professores, materiais); no Painel, mais 5 (séries, disciplinas, resumo, consumo, funções) |
| Fila, limite por escola, rate limit, índices, migration | não se aplicam: nenhuma rota e nenhuma tabela |
| Corridas de concorrência | nenhuma nova: as mutações e as travas são as de hoje |
| Quando cada dependência cai | cada bloco tem o seu erro com "Tentar de novo"; a fila mostra o que leu (`parcial`) e nunca diz "Tudo em dia" sem ter lido |
| Métrica e alerta, teste de carga | o `size-limit` e o teste do build; carga inalterada |

**Releitura.** Os observadores da fila usam `staleTime` de 5 minutos, sem `refetchInterval`, sem releitura no foco nem na reconexão; o de incidentes usa `staleTime: Infinity`, como o aviso (uma leitura por sessão). O sino lê ao entrar na área e relê quando uma tela invalida a chave, isto é, quando a coordenação age. O Painel relê ao abrir se a leitura passou de 5 minutos. Motivo (regra 80): fila que relê sozinha multiplica leitura por tempo de aba aberta. O observador de materiais da fila não herda o `refetchInterval` de 1,5 s da tela Material.

**Bundle.** `Estrutura`, `ListaDaTurma` e `Professores` saem da fachada para `lazy()`, como o `Painel`, as molduras e o sino. Os tetos da fachada (16 kB) e da operação (60 kB) não sobem; cada `tela-coordenacao-*` fica em 30 kB. Os ícones dos quatro lugares moram na entrada: ilustrados se somarem até 1 kB em brotli; senão, `lucide` no `Ladrilho`.

## 8. Uso de IA (quando aplicável)

Nenhuma chamada nova.

## 9. Frontend

**Molduras.** `Escola` e `Registros`: `Tela` com o título, `Abas` com a aba do endereço (`aoMudar` navega) e o miolo. As telas de dentro perdem a `Tela` delas: o `h1` é "Escola" ou "Registros", e a aba do navegador diz "Escola: turmas", "Registros: IA" e assim por diante.

**Altura.** A partir de 768 px só o miolo rola, numa região com nome e `tabIndex={0}`; abaixo, rola a página.

**Painel** (`grade`): a faixa do incidente é a de hoje, acima da tela; função suspensa (`Aviso`, com link para Agentes); quatro `NumeroPainel` e o consumo, com "Ver em Registros"; "Esperando você" (a fila) e a porta "Pedidos dos titulares"; "Para terminar a escola" (`o-que-falta-da-escola.ts`, extraído da Estrutura).

**Analista** (`leitura`): `AssinaturaIA` no topo, "Gerar resumo" como ação, os blocos de hoje e o `DadoNominal`, que sai da Governança.

**Escola › Turmas:** `Aviso` "Para terminar a escola" com "Ver o que falta" (`?painel=falta`); `Segmentado` "Situação"; `Tabela` agrupada por série, com `Linha`; `Menu` da linha; painel "Ano letivo e disciplinas" (`?painel=ano`) com as três seções de hoje e os diálogos delas por cima.
**Professores:** `Tabela`; `PainelLado` do professor com a situação, as ações do convite, as turmas dele e "Acrescentar turma" (`Alocacao.tsx` vira esse diálogo).
**Material:** `Tabela`; `Dialogo` "Enviar material" com o formulário de hoje (`material-envio.ts` não muda); `PainelLado` do material.
**Lista da turma:** duas colunas a partir de 1024 px (os nomes; os professores da turma e os pedidos).

**Registros › IA:** números, `Segmentado` de estado, a tabela de hoje, o consumo ao lado. **Pedidos:** `Tabela` com a coluna "Prazo" (`prazoDoPedido`, que já existe). **Privacidade:** `Segmentado` no lugar das abas. **Agentes:** `Segmentado` "Qual IA" e um agente por vez.

**Operação:** o título "Operação", a navegação "Operação" desenhada como abas (continuam links), as duas tabelas na `Tabela` e o estado da coordenação em `Estado`.

**Nomes que não mudam** (contrato com o e2e): um `<main>`; as regiões "Turmas de <ano>", "Ano letivo", "Séries", "Disciplinas", "O que falta para a escola começar", "Nomes da turma", "Prévia", "Materiais da escola", "Lista de escolas", "Uso por escola"; os rótulos dos campos e os títulos dos diálogos; o link "Lista de nomes da turma <nome>"; `data-agente`, `data-funcao`, `data-aprovacao`, `data-estado`, `data-dado-nominal`; `navigation` "Operação".

**Chromebook e celular.** Nenhuma biblioteca nova; a `Tabela` vira lista abaixo de 768 px.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | `montarFila`, tipo a tipo e com falha parcial; `oQueFaltaDaEscola`; o prazo na linha do pedido; `navegacao.test.ts` com os quatro lugares |
| Componente (jsdom, `__fixtures__/tela.tsx`) | cada tela e o `Sino`: os quatro estados, o foco e as chamadas feitas; o Painel sem número por professor |
| E2E | os specs de hoje, com o caminho novo, nos dois projetos; `sino-da-coordenacao` e `painel-da-coordenacao`, novos; `estrutura.spec.ts` partido em `estrutura`, `lista-da-turma` e `alocacao`, e `governanca.spec.ts` em `governanca`, `agentes` e `analista`, movendo os casos sem mudar asserção |
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
- `⚠️ NÃO VERIFICADO` — que o controller da governança repassa `estado` e que os números não mudam com o filtro. Saída: sem isso, o seletor de estado sai
- `⚠️ NÃO VERIFICADO` — que dez leituras seguidas não batem no limite por usuário. Saída: o Painel lê os blocos em duas levas

## 13. Riscos técnicos

- **A tarefa dos lugares toca quase todos os specs da coordenação**: é mecânica (caminho e rótulo) e vem antes das telas
- **Os specs que atravessam telas** (`roteiro-da-demonstracao`, `escola-montada`, `fluxo-do-professor.ts`) põem em fila as tarefas que mudam o passo deles; a X3 e a X4 tocam os mesmos arquivos
- **A alocação muda de lugar** e leva três specs
- **A X3 depende da peça `Sino` e da âncora** (tarefa 1.0)

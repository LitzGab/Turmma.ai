# U08 — apps/web parte 2: as telas (`src/areas/` e `src/operacao/`)

Caminhos relativos a `apps/web/src`. Leitura apenas; nada foi executado.

## 1. Finalidade e limites

- Telas por papel: `areas/coordenacao`, `areas/professor`, `areas/aluno`, mais o painel da equipe Turmma em `operacao/` (D76). [código] `areas/navegacao.ts:1-12`.
- Tamanho (linhas de .ts/.tsx, 234 arquivos): [código, `wc`]

| Pasta | Total | Produção | Teste |
|---|---|---|---|
| coordenacao | 18.106 | 8.524 | 9.582 |
| professor | 15.717 | 6.999 | 8.718 |
| aluno | 2.302 | 1.697 | 605 |
| operacao | 5.563 | 3.629 | 1.934 |

  Os "~37 mil" do pedido incluem teste: produção tem ~20,8 mil e teste ~20,8 mil, mais de 50% de teste. Há 88 arquivos de teste.
- Não é desta unidade: `api/` (cliente HTTP, TanStack Query keys), `componentes/` (peças, `Sino`, `DialogoDeFormulario`), `rotas.tsx`, `paginas/` (login da escola), `caminhos.ts`, sessão. As áreas só os consomem.
- Fronteira de pacote imposta por convenção e por teste de build: tela de uma área não importa outra área, e a entrada não importa `areas/` nem `operacao/`. [código] `areas/navegacao.ts:5-12`; `nome-dos-chunks.ts`. Conferido: nenhum import cruzado entre `coordenacao`, `professor` e `aluno`, e nenhum de `operacao` vindo de fora. [código, grep]

## 2. Pontos de entrada (rotas da web)

Cada área é um `lazy(() => import('./rotas'))` com guarda de papel em `rotas.tsx:60-80` da raiz. [código] Cada tela é um chunk `tela-<area>-<Tela>`.

| Área | Rotas (relativas a `/<área>`) | Fonte |
|---|---|---|
| coordenação | `/painel`, `/analista`, `/estrutura` (aba Turmas), `/estrutura/turmas/:id` (lista da turma), `/professores`, `/material`, `/governanca` (aba IA), `/agentes`, `/privacidade` (redireciona a `/privacidade/pedidos`), `/privacidade/pedidos/:id`, `/privacidade/:aba` | `areas/coordenacao/rotas.tsx:55-112` |
| professor | `/nova-conversa` (Início), `/conversa`, `/ferramentas`, `/ferramentas/:f`, `/criados`, `/artefatos/:id`, `/time/assistente`, `/time/tutor`, `/aprovar/:atividadeAplicadaId`, `/turmas`, `/turmas/:id`, `/meus-dados` | `areas/professor/rotas.tsx:50-80` |
| aluno | `/tutor`, `/tutor/:atividadeAplicadaId`, `/atividades`, `/atividades/:id`, `/minha-turma`, `/privacidade` (MeusDados) | `areas/aluno/rotas.tsx:36-57` |
| operação | `/operacao/convite`, `/entrar`, `/mfa`, `/mfa/configurar` (públicas); `/operacao/` (Escolas) e `/operacao/uso` (protegidas, com `Protegida` e `ComSessao`) | `operacao/rotas.tsx:96-123` |

- Navegação por papel (D73/D80), numa tabela só. [código] `areas/navegacao.ts:48-76`
  - Coordenação: Painel, Analista, Escola, Registros (4 lugares).
  - Professor: Início, Turmas, Ferramentas, Criados (4 lugares).
  - Aluno: Tutor, Atividades, Minha turma, com Privacidade no rodapé (3 lugares).
  - Nenhum item aponta para tela inexistente. O aluno ainda está na navegação "de antes da pele" (a X4 está congelada). [doc] `docs/interface.md` 11.1, tabela "O que cada papel vê". Doc e código batem.
- Sinos "Esperando você": `SinoDaCoordenacao` e `SinoDoProfessor` são `lazy` e montados por `createPortal` em toda tela da área. [código] `coordenacao/rotas.tsx:59-64`; `professor/rotas.tsx:47-49`
- Nenhum endpoint do servidor, worker ou job nesta unidade.

## 3. Fluxos e regras de negócio (como aparecem no front)

Fluxos principais, seguindo o código:

1. **Aprovar correção de objetiva** (`professor/Aprovar.tsx`, `aprovar.ts`). O botão só liga se a API disser `podeAprovar`. O contador de destaques explica por que está desligado. O diálogo mostra o resumo antes de confirmar. [código] `aprovar.ts:81-110` ("Quem libera o botão é a API... se discordarem, vale a API"). A invariante D56 (o que foi aberto, quem confirmou) é registrada no servidor; o front só renderiza e envia a abertura do destaque. O texto da tela nunca usa "nota" (D46); a guarda é teste de texto em `aprovar.test.ts`. [doc, não li o teste]
2. **Decisão de entrega do Assistente** (`professor/Time.tsx`, 345 linhas numa função só): aprova e rejeita com justificativa. Há trava de clique duplo por `useRef` (`Time.tsx:82`) e tratamento de "outra aba já decidiu". [código]
3. **Atividade do aluno com fila de respostas** (`aluno/fila-de-respostas.ts`, `respostas.ts`). Uma escolha por vez, retry com espera crescente, reenvio ao voltar a rede (`window.addEventListener('online')`) ou a sessão, e a fila é zerada na troca de sessão. É o cumprimento do lado cliente da regra 80/6. [código] `fila-de-respostas.ts:100-131`. O estado vive só em memória: um F5 com escolha pendente a perde. [código] `respostas.ts:9-10` assume isso de propósito.
4. **Lista de turma** (`coordenacao/ListaDaTurma.tsx`, `previa-da-lista.ts`): prévia, avisos heurísticos e `podeGravar`. A API revalida e recusa. [código] `previa-da-lista.ts:76-82`
5. **Dado nominal de professor** (`coordenacao/DadoNominal.tsx`): botão oficial, finalidade de lista fechada, confirmação que cita a auditoria, resultado sem cache. Respeita a D45 e a regra 20/10 no cliente. [código] `DadoNominal.tsx:24-40`
6. **Sinos**: a fila é montada no cliente (ver seção 8 e o achado 1).
7. **Operação**: sessão própria do operador (token em memória, cookie `HttpOnly`, MFA, aviso de inatividade). [código] `operacao/api/sessao.ts:1-30`

Onde as invariantes são garantidas:

| Invariante | Onde | Marca |
|---|---|---|
| Tenant e escopo | Só na API. O front esconde itens por papel e declara que não protege (`navegacao.ts:44-46`). O cliente nunca manda `escolaId`. | [código] |
| Nota com autor humano, D55 | Não há nota nem escrita de nota nesta unidade. O front não tem campo de correção de discursiva (grep em `areas` por "discursiva" e "nota" não mostrou campo de entrada). | [hipótese]: conferir com U05/U06 |
| Auditoria de leitura nominal | Servidor; o front só pede e avisa | [código] |
| Sem tempo ocioso e sem ranking (D64, D69) | Convenção em comentário, e teste de texto em alguns casos. Não encontrei teste automático que reprove ranking novo. | [hipótese] |

## 4. Dependências

- Internas: `api/*` (consultas e mutações com schema zod de `@educa/shared`), `componentes/*` (peças, estados, diálogos, `sino/`), `caminhos.ts`, `formatar.ts`, `titulo.ts`. [código]
- Externas de runtime: `@educa/shared`, `@tanstack/react-query`, `wouter`, `lucide-react`, `qrcode-generator`, React 19. [código] `apps/web/package.json`
- Ciclos: não vi. Há um acoplamento incomum de módulos de lógica entre telas da mesma área:
  - `coordenacao/turmas-da-escola.ts` importa `turmasSemProfessor` de `fila-da-coordenacao.ts`, um arquivo que também tem o hook do sino. [código] `turmas-da-escola.ts:2`
  - `Painel.tsx`, `Estrutura.tsx` e `PainelDoProfessor.tsx` repetem as mesmas consultas das listas.
- `operacao/` depende de `src/api/cliente` e de peças de `componentes/` (Botao, Campo, Tabela, `DialogoDoConvite`). Não depende de `areas/`.

## 5. Dados

A unidade não toca banco. Lê e escreve só por HTTP, pelos módulos de `src/api/`.

Conferido: **nenhuma chamada HTTP fora de `src/api` nas áreas**. Em `areas/` não há `fetch`, `chamarApi`, `XMLHttpRequest` nem `sendBeacon`. [código, grep] Em `operacao/` os `chamarApi` estão em `operacao/api/` (`sessao.ts`, `convite.ts`, `mfa.ts`, `painel.ts`), a "base" própria da operação. É o equivalente de `src/api` e está dentro da pasta. Não há `localStorage` nem `sessionStorage` em código de produção (só comentários que dizem que não usam). [código]

Estado de servidor é do TanStack Query: 47 arquivos de tela usam `useQuery` ou `useMutation`. O `useState` aparece 167 vezes e é local de UI (diálogo aberto, rascunho). Não achei cópia de dado de servidor em estado, mas **não li todas as 167**. [hipótese] Confirmaria: ler `useState(() =>` com `.data`.

## 6. Contratos

- Respostas validadas na borda por schema em `@educa/shared` (`esquemaResposta…`) via `chamarApi(caminho, esquema)`. [código] `operacao/api/sessao.ts:280`. As telas recebem tipo já validado. Como os testes de tela usam "rede falsa por caminho" (`__fixtures__/tela.tsx`), os JSON falsos passam pelo mesmo schema, e por isso funcionam como teste de contrato implícito do lado cliente. [código] `Aprovar.test.tsx:1-30`
- Contratos de formulário reaproveitados do shared: `esquemaPedidoRenomearArtefato` (`Artefato.tsx:157`), `esquemaParametrosDeFerramenta` (`ferramentas.ts:244`), `esquemaPedidoCadastrarProfessor` (`convite-de-professor.ts:94`). Bom.
- Contratos implícitos ou só do front:
  - `PRAZO_DA_DECLARACAO_COMPLETA_DIAS = 15` (prazo legal LGPD art. 19) vive em `privacidade/textos-do-pedido.ts:28` e **não em `packages/shared`**, ao contrário de `PRAZO_DA_ELIMINACAO_DIAS`. Não achei cópia na API (grep em `apps` e `packages`). O prazo vencido só é calculado na tela. [código] Se o servidor passar a alertar por prazo, haverá dois números.
  - `periodoTipico(ano)` (`02-01` a `12-15`) é um default de UI para o ano letivo (`AnoEDisciplinas.tsx:183`). Não é regra, mas é valor de domínio escrito no front.
  - O "vínculo que dá professor à turma" é redefinido em três lugares (seção 10).
  - Parâmetros de URL (`?aba=`, `?turma=`, `?tipo=`) são constantes locais por tela (`PARAMETRO_DA_ABA`, `PARAMETRO_DO_TIPO`...), sem schema central. [código] `aprovar.ts`, `criados.ts`

## 7. Testes

- Camada: unidade e componente (vitest + Testing Library + jsdom), e e2e Playwright em `e2e/` (75 arquivos). São ~678 `it()` em `.test.tsx` e ~446 em `.test.ts`. Não vi `.skip`, `.only` nem `.todo`. [código, grep]
- Estilo: rede falsa por caminho (`__fixtures__/tela.tsx`, `redeFalsa`), com cliente de consultas e `wouter` reais. Só um `vi.mock` em toda a unidade (`Material.test.tsx:25`). Isso bate com a regra 40 ("mock só para o que é de fora"). A lógica pura foi extraída para `.ts` (`aprovar.ts`, `sinais.ts`, `fila-do-professor.ts`...) e é testada sem navegador. Os testes de tela dizem no cabeçalho o que cobrem e o que é do e2e. [código] `Aprovar.test.tsx:15-21`
- Qualidade vista (amostra em `Aprovar.test.tsx`): prova regra (botão desligado até abrir os destaques, registro da abertura uma vez). Não vi asserção decorativa nas amostras; **não auditei os 88 arquivos**.
- **Lacunas** [código, comparação nome a nome]. Telas `.tsx` sem `.test.tsx` próprio:
  - Todo o `areas/aluno` não tem teste de componente: `Atividade.tsx` (416), `Tutor.tsx` (346), `Atividades.tsx`, `MinhaTurma.tsx`. Só a lógica (`atividade.ts`, `tutor.ts`, `respostas.ts`, `fila-de-respostas.ts`) tem teste de unidade, e as telas têm e2e (`e2e/aluno-atividade|aluno-tutor|aluno-fluxo|minha-turma`, ~1.130 linhas). É o papel de menor, onde mais pesa a regra 50/9 (não expor colega).
  - `coordenacao/AnoEDisciplinas.tsx` (500) é coberta indiretamente por `Estrutura.test.tsx`; `privacidade/RegistrarPedido.tsx` (328) e `AcoesDoPedido.tsx` (305) por `Pedidos.test.tsx` e `DetalheDoPedido.test.tsx`; `DialogoDeEnvioDeMaterial.tsx` (300) por `Material.test.tsx` (1.005 linhas). Cobertura indireta, não vazio. [hipótese] Confirmaria: rodar cobertura de linhas.
  - `operacao/paginas/NovaEscola.tsx` (275), `ConfigurarMfa.tsx` (258), `Mfa.tsx`, `NovaRede.tsx` e `DialogoDoConvite.tsx` não têm teste de tela. Há e2e (`operacao-*.spec.ts`, `mfa.spec.ts`).
- Os testes de `Painel` (936 linhas), `Material` (1.005), `SinoDoProfessor` (755) e `Estrutura` (649) são grandes. Sinal de tela grande demais, mais do que de teste ruim.

## 8. Resiliência e escala (sinais)

- **Fila do sino montada no cliente em N+1** (`professor/fila-do-professor.ts:311-398`). Em toda tela do professor, o sino lê entregas pendentes, vínculos (`useInfiniteQuery`) e, **uma turma por vez e até 12 turmas**, a contagem de pedidos de nome. Há lógica de série, parada na primeira recusa por limite (`LIMITE_EXCEDIDO`) e releitura por chave exata. O autor sabe do custo e o administra: cinco minutos de frescor, sem leitura por foco, rede ou tempo (`componentes/sino/leitura-do-sino.ts`). É um endpoint agregado faltando. O sino da coordenação (`fila-da-coordenacao.ts:205-271`) faz 6 leituras de lista inteira (anos, incidentes, professores, materiais, turmas, vínculos) só para contar e montar frases. [código]
- O `Painel` da coordenação faz mais 8 leituras (`Painel.tsx:77-236`), muitas repetidas com as do sino (mesmas chaves, então o cache absorve). "Falta alguma coisa na escola" é calculado no front a partir de listas completas (`o-que-falta-da-escola.ts`). Com escola de 400 turmas e 80 professores, o front lê tudo para contar. [hipótese] Confirmaria: tamanho das páginas e `completa` em `api/estrutura.ts` (U07). A fila marca `completa: false` e diz "ou mais", o que mostra que a página pode truncar.
- Polling: `Time.tsx:46` e `TurmaHoje.tsx:39` leem a cada 15 s. `TurmaHoje` não lê em segundo plano (`refetchIntervalInBackground: false`). Em manhã de segunda, 60 turmas × professores é carga contínua na API. [código] Não vi pausa por visibilidade no `Time.tsx`. [hipótese]
- Resposta de prova: o servidor grava a cada item, o cliente reenvia, e o relógio é do servidor (não achei relógio de prova no cliente). Ponto fraco: a fila é só memória, e um F5 ou a aba fechada com envio pendente perde a escolha. [código] `respostas.ts:9-10`
- Operação: lock de renovação por Web Locks, canal entre abas, repetição do 503 do semáforo do hash por 30 s e teto de espera. [código] `operacao/api/sessao.ts:37-48`. É bem pensado. Também é uma segunda implementação de sessão (seção 10).
- Bundle: tetos por chunk conferidos no build (`nome-dos-chunks.test.ts`). Toda tela é `lazy`, mas a fachada de `aluno` importa `MinhaTurma` direto (`aluno/rotas.tsx:4`), a exceção de A1.
- Observabilidade no front: não vi captura de erro de cliente (Sentry ou `window.onerror` com envio) dentro desta unidade. [hipótese] Confirmaria: grep em `main.tsx` e `FronteiraDaArea`.

## 9. Suspeitos de código morto

Método: para cada `export` de `areas/` e `operacao/`, grep do nome em `src/**` fora do próprio arquivo e fora de `.test.`. Resultado: nenhum **arquivo** sem importador de produção (`nunca-faz.ts`, `nome-do-turno.ts`, `miolo-que-rola.ts` etc. são todos importados). Por nome, 181 exports só aparecem no próprio arquivo ou em teste; a maioria é tipo ou constante usada internamente. Casos que parecem reais:

| Suspeita | Evidência | O que poderia ser referência dinâmica |
|---|---|---|
| `esperandoVoce` e `ItemEsperando` (`professor/fila-do-professor.ts:240-270`) | Só `fila-do-professor.test.ts` os usa. O comentário diz "o Início deixa de usá-la na 3.0". É um resto da X3 que ficou testado. | Nenhuma. É função pura sem rota. |
| `origemDoMaterial` (`coordenacao/material-envio.ts:152`) | Só `material-envio.test.ts`. | Nenhuma. |
| `tokenDeOperador` (`operacao/api/sessao.ts:200`) | Só em `sessao.test.ts`. | Poderia ser API de teste. Confirmar se `chamarApi` usa a variável `token` direto. |
| `professor/Tutor.tsx` (43 linhas) | Não é morta. É um redirect do endereço antigo `/time/tutor` para a aba Hoje da turma, e o pé do sino ainda aponta para ele (`SinoDoProfessor.tsx:17`). É um desvio que dá a "tela" um contrato de compatibilidade. | — |
| `areas/aluno/memoria-do-aluno.ts` e `professor/memoria-do-professor.ts` | Importados (conferido), mas são só memória de aba. | — |
| Exports de tipo sem uso externo (ex.: `FaseDaAtividade`, `AbaDaTurma`, `PARAMETRO_DA_ABA`) | Ruído de `export` desnecessário, não morte. | — |

Telas sem link de entrada: nenhuma achada. `agentes` é alcançada de `Governanca.tsx:86` e `Painel.tsx:93`. `time/assistente` e `time/tutor` pelo pé do sino. `conversa` por `Home.tsx:90`. [código]

## 10. Duplicação e inconsistência

- **Sessão e entrada da operação são um espelho da sessão da escola.**
  - `operacao/api/sessao.ts` (486 linhas) contra `api/sessao.ts` (715).
  - Páginas: `operacao/paginas/{Entrar,Mfa,ConfigurarMfa,Convite}.tsx` (103/140/258/181) contra `paginas/{Entrar,Mfa,ConfigurarMfa,Convite}.tsx` (109/136/184/236).
  - Também `operacao/api/{mfa,convite,eu}.ts` contra `api/{mfa,convite,eu}.ts`.
  - Depois de normalizar o sufixo "Operador", as páginas divergem em 40 a 180 linhas, mas a estrutura é a mesma.
  - A razão está escrita: isolamento da sessão (RF6) e do chunk (`operacao/api/sessao.ts:7-14`). O custo é ~1.250 linhas paralelas para manter. Um corte genérico (fábrica de sessão com parâmetros de caminho, cookie e canal) é possível. [hipótese] Confirmaria: diff semântico de `api/sessao.ts` com o do operador.
- **Regra "o que dá professor à turma" em três lugares**:
  - `fila-da-coordenacao.ts:52-58`: `ESTADOS_QUE_DAO_PROFESSOR`, pendente e confirmado.
  - `turmas-da-escola.ts:38-40`: `daProfessor`, o mesmo.
  - `professores-da-escola.ts:29-31`: `vinculoDaLinha`, pendente, confirmado e contestado. Essa difere de propósito (comentário explicativo).
  - O professor tem outra variante em `fila-do-professor.ts` (`estado === 'confirmado'`). Os comentários se referenciam ("o mesmo que o sino conta"), mas não há constante compartilhada. Essa é regra de domínio no cliente.
- **Hooks de sino quase idênticos**: o bloco `tentandoDeNovo` / `atualizando` / `atualizadoEm` / `reler` por chave exata está copiado em `fila-da-coordenacao.ts:225-271` e `fila-do-professor.ts:347-398`. Só `leitura-do-sino.ts` foi extraído. `SinoDaCoordenacao.tsx` e `SinoDoProfessor.tsx` repetem a montagem do portal.
- **Boilerplate de erro com repetição**: `<EstadoErro erro={x.error} tentando={x.isFetching} aoTentarDeNovo={() => void x.refetch({ cancelRefetch: false })} />` aparece 53 vezes (`EstadoErro`) e 57 vezes o `refetch({ cancelRefetch: false })`. A peça `EstadoErro` existe e é bem usada (63 `EstadoCarregando`, 47 `EstadoVazio`), mas poderia receber a query. Duplicação pequena, repetida em massa.
- **Formulários de diálogo**: a base existe e é reaproveitada (`DialogoDeFormulario` com `useEnvioUnico`, 36 usos). `AnoEDisciplinas.tsx` repete bem o padrão em `NovaSerie`, `NovaDisciplina`, `NovoAnoLetivo`, com `Renomear` em `Estrutura.tsx:654`. Está consistente.
- **Arquivos grandes** (produção, linhas; top 15):

| # | Arquivo | Linhas | Observação |
|---|---|---|---|
| 1 | `coordenacao/Estrutura.tsx` | 714 | `Estrutura()` ocupa 158-462 (~300 linhas), mais `TurmasDoAno`, `NovaTurma`, `Renomear` |
| 2 | `coordenacao/ListaDaTurma.tsx` | 646 | `SubirLista` ~190 linhas (325-513) |
| 3 | `coordenacao/AnoEDisciplinas.tsx` | 500 | três diálogos mais um painel |
| 4 | `operacao/api/sessao.ts` | 486 | espelho da sessão da escola |
| 5 | `professor/Aprovar.tsx` | 485 | `Aprovar()` ocupa 135-485 (~350) |
| 6 | `professor/Time.tsx` | 417 | `Time()` ocupa 72-417 (~345) |
| 7 | `aluno/Atividade.tsx` | 416 | quatro subcomponentes, bem dividida |
| 8 | `professor/fila-do-professor.ts` | 398 | lógica pura (~270 linhas) mais o hook (~90) |
| 9 | `professor/TurmaHoje.tsx` | 387 | `TurmaHoje()` ocupa 63-297 |
| 10 | `aluno/Tutor.tsx` | 346 | |
| 11 | `professor/ConvidarAlunos.tsx` | 342 | |
| 12 | `coordenacao/privacidade/RegistrarPedido.tsx` | 328 | |
| 13 | `coordenacao/Professores.tsx` | 322 | |
| 14 | `professor/AtividadesDaTurma.tsx` | 316 | |
| 15 | `coordenacao/Material.tsx` | 316 | |

  Quatro componentes de tela passam de 300 linhas em uma função só (`Estrutura`, `Aprovar`, `Time`, `ListaDaTurma`/`SubirLista`).
- Comentários: os docblocks são muito longos, cheios de referência a tarefa, spec e data ("X3, 5.0", "esteira de 16/10/2026"). Isso ajuda a história, mas pesa na leitura e vira dívida de manutenção quando a spec some. [código, ex.: `leitura-do-sino.ts:21-27`]
- Tailwind: strings de classe repetidas (`rounded-cartao border border-linha bg-superficie p-4` em `MinhaTurma.tsx:34,44`, e em outros lugares). [código] Não contei.

## 11. Doc × código

- `docs/interface.md` 11.1 e `navegacao.ts` concordam sobre os 4 lugares da coordenação e do professor e sobre o aluno "de antes". Sem divergência.
- CLAUDE.md D80 pede "até quatro lugares por papel": ok. D73 "item só com a fase": ok, não há Calendário nem Histórico.
- `nome-dos-chunks.ts` e `areas/navegacao.ts` dizem que "tela nova entra por `lazy`". O código segue, com exceção declarada (`MinhaTurma` direta). Ok.
- Regra 50/5 (quatro estados) e 50/12 (texto sem código): seguem nas telas lidas. Não auditei as 80 telas.
- Regra 50/13 (seletor de escola) está em `componentes/SeletorDeEscola`, fora da unidade.
- Regra 00/1 ("regra de negócio no frontend é regra que o usuário pode contornar"): o front não decide nenhuma autorização, mas calcula derivados de domínio (prazo de 15 dias, "turma sem professor", "escola montada", aviso de lista) que a API não devolve prontos. Nenhum é autorização, mas o princípio de "o servidor diz" fica fraco nesses pontos.
- CLAUDE.md diz "Nada de mockup é copiado para o `apps/web`". Não conferi (fora de escopo).

## 12. Tamanho, risco e dependências

- 234 arquivos, ~20,8 mil linhas de produção e ~20,8 mil de teste.
- Risco de mexer: **médio**.
  - A favor: 50% é teste; a lógica pura é separada; as fronteiras entre áreas são impostas por build e por convenção; não há acesso a banco; o e2e cobre os fluxos.
  - Contra: a pele (D80) e a sequência X1-X4 estão em curso, com `navegacao.ts` e `rotas.tsx` mudando toda semana (17 e 11 commits em outubro); os testes de tela são caros e acoplados a texto literal.
  - Risco **alto** no `aluno/fila-de-respostas.ts` (resposta de prova) e na sessão de operação.
- Depende de: U07 (`api/`, `componentes/`, cliente, sessão), `packages/shared` (contratos), API (endpoints). Quem depende dela: `src/rotas.tsx`, `nome-dos-chunks.ts`, `e2e/`, o build e o size-limit.

## 13. Os 5 achados mais importantes

1. A fila "Esperando você" é montada no navegador por orquestração em N+1: `fila-do-professor.ts:311-398` lê entregas, vínculos e a contagem de pedidos turma a turma (até 12, em série), e `fila-da-coordenacao.ts:205-271` lê 6 listas inteiras. Faltam endpoints agregados, e esse código é cerca de 700 linhas de complexidade que a API absorveria.
2. A sessão e as páginas de entrada da operação são um espelho em paralelo do que já existe para a escola (`operacao/api/sessao.ts`, 486 linhas, e `operacao/paginas/{Entrar,Mfa,ConfigurarMfa,Convite}`, contra os de `api/` e `paginas/`): ~1.250 linhas duplicadas por isolamento (RF6) que uma sessão parametrizada poderia dividir.
3. Regra de domínio replicada no cliente sem fonte única: "o que dá professor à turma" em três arquivos (`fila-da-coordenacao.ts:52-58`, `turmas-da-escola.ts:38-40`, `professores-da-escola.ts:29-31`), e o prazo legal de 15 dias do pedido de titular só no front (`textos-do-pedido.ts:28`, fora de `packages/shared`).
4. As telas do aluno (`Atividade`, `Tutor`, `Atividades`, `MinhaTurma`) não têm nenhum teste de componente: só a lógica e o e2e. A fila de respostas da prova vive só em memória e perde a escolha pendente num F5.
5. Componentes de tela de 300 a 350 linhas numa função só (`Estrutura`, `Aprovar`, `Time`, `ListaDaTurma`), mais restos mortos de spec anterior (`esperandoVoce`/`ItemEsperando`, `origemDoMaterial`) e docblocks longos em cima de tudo. Isso pesa na legibilidade e na reengenharia.

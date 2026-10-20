# U07 — `apps/web` parte 1: a base (api, componentes, galeria, páginas, sessão, config)

Os caminhos abaixo são relativos a `apps/web/` salvo quando começam por `/` ou por outro diretório da raiz. Marcas: [código], [doc], [hipótese]. Nada foi executado (sem build, sem teste); medidas de bundle vêm só de docs e de limites declarados.

## 1. Finalidade e limites

A base do SPA React/Vite: cliente HTTP validado por zod de `@educa/shared`, sessão em memória com renovação por cookie, hooks do TanStack Query, o kit visual D80 (`componentes/`), as telas públicas e de entrada (`paginas/`), roteamento (`rotas.tsx`, `caminhos.ts`), tema, CSS e a config de build com a política de chunks.

Não é dela: `src/areas/{coordenacao,professor,aluno}` (≈17,3 mil linhas de código, 8,5k / 7,0k / 1,7k [código, `wc` por pasta]) e `src/operacao/` (outra unidade), nem `packages/shared`.

Tamanho [código, `wc -l`]:

| Pasta | Arquivos | Linhas | Dessas, testes |
|---|---|---|---|
| `src/api` | 47 | 6.003 | 3.008 |
| `src/componentes` | 159 | 16.044 | 7.656 |
| `src/galeria` | 13 | 1.543 | 94 |
| `src/paginas` | 14 | 1.954 | 130 |
| `src/sessao` | 1 | 113 | 0 |
| raiz de `src/` (rotas, caminhos, tema, estilos.css, testes) | 18 | 2.713 | ≈1.540 |
| config (`vite.config.ts`, `nome-dos-chunks.ts/.test`, `rebaixar-cor.ts/.test`) | 5 | ≈780 | 636 |

Código de produção estimado da unidade: ≈14 mil linhas (api 3.0k, componentes 8.4k, galeria 1.4k, páginas 1.8k). Comentários são 33% das linhas de `api` (998/2995), 27% de `componentes` (2290/8322) e 16% de `paginas`.

## 2. Pontos de entrada (telas da web)

Roteador: `wouter`, tudo em `rotas.tsx` [código `rotas.tsx:196-232`].

| Rota | Componente | Guarda | Carga |
|---|---|---|---|
| `/entrar` | `paginas/Entrar` (via `Entrada`) | nenhuma; com sessão `aberta` redireciona | estática (entrada) |
| `/operacao/*` | `operacao/rotas` | sessão própria do operador | `lazy` (chunk `operacao-*`) |
| `/sistema` | `paginas/Casca` (estado do sistema, `/v1/sistema/*`) | pública | estática |
| `/galeria` | `galeria/Galeria` | só existe se `VITE_COM_GALERIA=1` no build | `lazy` |
| `/e/:slug/turma` | `paginas/TurmaPublica` (513 linhas) | pública, token no fragmento | estática |
| `/e/:slug` | `paginas/EntrarNaEscola` | pública | estática |
| `/mfa`, `/configurar-mfa`, `/convite`, `/escolher-escola` | `paginas/*` | etapa do login (desafio em memória) | estáticas |
| `/`, `/coordenacao/*`, `/professor/*`, `/aluno/*` | `AreaAutenticada` → `Protegida` → `CascaDaEscola` → `AreaDoPapel` | sessão + papel vindo de `/v1/eu` | área por `lazy` (`rotas.tsx:42-46`) |
| qualquer outra | `PaginaNaoEncontrada` | — | estática |

Sem comandos, workers, filas ou eventos nesta unidade. Único canal não-HTTP: `BroadcastChannel('educa-atividade')` para inatividade entre abas [código `sessao/inatividade.ts:25`] e Web Locks `educa-renovacao` [código `api/sessao.ts:26,398`].

Consumo de API: ≈45 módulos de `src/api/` chamam `/v1/...`; nenhuma URL `/v1` aparece fora de `api/` (só em comentários) [código, grep em `areas paginas componentes`].

## 3. Fluxos e invariantes

**Chamada à API.** `chamarApi` (`api/cliente.ts:77`) faz fetch com `cache: 'no-store'`, lê o corpo, converte falha em `ErroDaApi(codigo)` (tipado por `CodigoDeErro` de shared; sem envelope, deduz do status 429/502-504/500) e valida a resposta com o esquema zod; resposta fora do contrato vira `ERRO_INTERNO` [código `cliente.ts:98-102`]. `chamarComSessao` (`sessao.ts:485`) injeta o token, renova uma vez em `NAO_AUTENTICADO` e repete, e só então encerra a sessão. Mensagem para a tela sai do catálogo `MENSAGENS_DE_ERRO` de shared (`mensagemDoErro`), cobrindo regra 00 item 9 e regra 50 item 12.

**Sessão (regra 50 item 7).** Token só em variável de módulo (`sessao.ts:76-122`); nenhum uso de `localStorage` para dado de pessoa — os únicos usos são `educa.aparencia` e `lateral-recolhida` (preferência do aparelho) [código `tema.ts:43,85`, `componentes/lateral-recolhida.ts:16-29`]. Estados: `desconhecida|abrindo|aberta|anonima|vencida|indisponivel|suspensa`. Renovação serializada por Web Locks entre abas, tolerância ao 409 `JA_RENOVADO`, 503 do semáforo de login repetido por até 30 s respeitando `Retry-After`. Queda de rede/5xx vira `indisponivel` e nunca manda ao login [código `sessao.ts:462-476`, `rotas.tsx:69-78`]. Sessão vencida mantém a tela montada com `LoginPorCima`.

**Isolamento de tenant no cliente (regra 10/20).** Fim ou troca de sessão chama `resetQueries()` do cliente de consultas [código `main.tsx:31-33`] e esvazia a "memória da aba" (`api/memoria-da-aba.ts:25-27`). A guarda de papel em `rotas.tsx` (`AreaDoPapel`) é só de apresentação; declara que a autorização é da API [código `rotas.tsx:96-98`].

**Ciclo de execução de IA.** `api/ciclo-de-execucao.ts` (134 linhas, puro) + `api/execucoes.ts` (113): máquina de estados `enviando → esperando → concluida|falhou`, `chaveEnvio` sorteada por envio e reaproveitada só em reenvio quando o 202 não chegou (idempotência de ponta a ponta), polling do `GET /v1/execucoes/:id` por `refetchInterval`, invalidação das chaves afetadas no fim. É a regra 80 item 7 aplicada no cliente [código `ciclo-de-execucao.ts:25-45`, `execucoes.ts:72-75`].

**Invariantes de produto no kit.** `Faixa` não fecha (D8, regra 70 item 4) [código `componentes/Faixa.tsx:1-15`]; `DialogoDeConfirmacao` exige pares "o que vai acontecer" pelo tipo (regra 50 item 8) [código `DialogoDeConfirmacao.tsx:5,59`, doc do campo]; `Aviso` tem quatro tons com glifo por forma (não só cor). Garantia = tipo + teste unitário; nenhuma delas depende de convenção solta.

**CSS/pele (D80).** `estilos.css` zera a paleta Tailwind e devolve 97 cores em hex por tema (claro em `@theme static`, escuro em `:root[data-tema='escuro']`), alvo Chrome 99+/CSS em camadas; o plugin `rebaixar-cor.ts` remove blocos `@supports(color-mix)` e reprova `oklch()` no build. Conformidade da pele é garantida por teste que lê o *código-fonte* com regex (`estilos.test.ts`, 807 linhas) — ver §7/§10.

## 4. Dependências

Internas: `@educa/shared` (≈32 módulos de `api/` importam esquemas/tipos; barrel `src/index.ts` de 911 linhas, `"sideEffects": false` [código `packages/shared/package.json`]). `vite.config.ts:27` resolve `@educa/shared` pela condição `source`, ou seja, o web compila o TS de shared (e o zod dentro dele) direto.

Direção: `api/` não importa de `componentes/` nem de `areas/`; `componentes/` importa de `api/` (8 pontos, ex. `meus-dados`, `pedidos`, `Sino`) — aceitável, sem ciclo visto [código, script de importadores]. `sessao/inatividade.ts` (um arquivo de 113 linhas) importa de `api/sessao` e só `componentes/CascaDaEscola` o usa. Sem ciclo detectado no grafo de imports relativos da unidade (script próprio sobre `import/from` relativos; ressalva: não vê imports dinâmicos).

Externas: react 19.3, react-dom, `@tanstack/react-query` 5, `wouter` 3, `lucide-react` 1.48 (ícones nomeados), `qrcode-generator`; dev: tailwind 4 + `@tailwindcss/vite`, vite 8 (Rolldown), vitest/jsdom/testing-library. Sem libs de virtualização, i18n, formulário ou estado global (store própria por `useSyncExternalStore`).

Quem depende da unidade: `src/areas/*` (usam `Botao` 76 arquivos, `estado` 57, `Tela` 37, `SeloDeEstado` 34, `botao-secundario` 36, `Campo` 25, `texto-da-falha` 21, `dialogos` 19) e `src/operacao/` (importa `api/cliente`, `Botao`, `Campo`, `Tabela`, `Dialogo`, `Aparencia`…; mas **não** `api/sessao`).

## 5. Dados

A web não toca banco. Estado local: (a) cache do TanStack Query (staleTime 30 s, 1 retry só para `INDISPONIVEL_TENTE_DE_NOVO|TEMPO_ESGOTADO|ERRO_INTERNO` [código `cliente-de-consultas.ts:13-28`]); (b) "lugares na aba" em memória (`memoria-da-aba.ts`), esvaziados com a sessão; (c) `localStorage`: só aparência e lateral recolhida.

## 6. Contratos

**Consumo de shared: bom.** Todo `chamarApi/buscarComSessao` recebe um `esquemaResposta*` de shared; o cliente define só a interface mínima `EsquemaDeResposta<T>` para não depender do zod [código `cliente.ts:21-23`]. Não achei esquema zod local nem tipo de resposta redigitado: as `interface`/`type` locais de `api/` são tipos de UI (`CicloDeExecucao`, `LugarNaAba`, `ListaDaEstrutura`, `ContagemDePedidos`) [código, grep `interface|type .*Resposta|Pedido`]. Corpos de pedido (`PedidoCriarTurma`, etc.) também vêm de shared, mas **o corpo enviado não é validado** no cliente (tipo, sem `parse`) [código: `chamarApi` só valida a resposta]. A borda real é a API.

**Chaves de query: três estilos.** (1) fábricas `queryOptions` por recurso com chaves literais dentro do arquivo (`['eu']`, `['minha-turma']`, `['sistema','estado']`); (2) constantes de prefixo em arquivos próprios — `chaves-do-professor.ts` (11), `chaves-do-aluno.ts` (4), mais `CHAVE_DA_ESTRUTURA` dentro de `estrutura.ts` e `CHAVE_DE_MEUS_DADOS`/`CHAVE_DOS_ALUNOS_DA_TURMA` em outros; (3) literais soltos em `operacao/api/painel.ts` (`['operacao','escolas',...]`). A razão dos arquivos de chaves é evitar importar `sessao`/rede só para saber o que invalidar [doc: comentário `chaves-do-professor.ts:1-4`]. Funciona, mas é convenção, não estrutura — nada impede duas telas de usar a mesma chave com formatos de dado diferentes.

**Invalidação: 45 pontos espalhados** [código, grep `invalidateQueries|setQueryData|resetQueries`], 21 deles fora de `api/` (dentro de telas em `areas/`), em padrão `const recarregar = useCallback(() => cliente.invalidateQueries({queryKey: X.queryKey}), [cliente])` repetido ≥8 vezes (Estrutura, Professores, Material, AcessoDaTurma, ListaDaTurma, Turmas, ...). As regras "o que cada escrita invalida" existem em dois lugares: `api/atividades.ts:51-91`, `entregas.ts:70-72`, `pedidos.ts:113-153` (funções que invalidam) e no código das telas. Mutação direta: `useMutation` aparece 37 vezes, quase todas nas telas; `dialogos.tsx:26` oferece `useEnvioUnico` como wrapper antidupla-submissão.

**Erro de leitura repetido.** O trecho `<EstadoErro erro={x.error} tentando={x.isFetching} aoTentarDeNovo={() => void x.refetch({ cancelRefetch: false })} />` aparece ≈65 vezes (60 em `areas/`, mais `componentes/`, `paginas/`, `rotas.tsx`) [código, grep]. Com `Painel.tsx:80,128,150,245` usando `refetch()` *sem* `cancelRefetch:false`, divergindo do motivo documentado em `paginas/Casca.tsx:11-18` (toques repetidos em rede lenta reiniciam a busca). Um `EstadoErro` que receba a consulta eliminaria ambos o boilerplate e a divergência.

**Teste de contrato.** Não há teste que bata cliente × API real nesta unidade; a segurança vem de ambos compartilharem o esquema. Os testes de `api/` usam `fetch` simulado (≈5 arquivos com stub de fetch/`vi.fn`).

## 7. Testes

Camada: unidade (vitest + jsdom + testing-library); e2e Playwright vive fora (`/e2e`, 30+ specs, outra unidade). 10,9 mil linhas de teste na unidade contra ≈14 mil de código; as mais densas:

| Arquivo | Linhas | O que prova |
|---|---|---|
| `api/sessao.test.ts` | 861 | máquina da sessão, renovação, locks, vencida/suspensa |
| `estilos.test.ts` | 807 | regex no fonte: nenhuma classe de cor fora do `@theme`, sem `/opacidade`, sem `dark:`, tipografia ≥14 px, degrau/foco/movimento |
| `nome-dos-chunks.test.ts` | 605 | **faz `vite build` de verdade** e mede brotli: 150 kB primeiro carregamento, 30 kB por tela |
| `api/etapas-do-login.test.ts` | 455 | fluxo de login em etapas |
| `api/pedidos.test.ts` | 375 | invalidação/ciclo de pedidos |

Protegem regra de negócio de verdade (renovação, idempotência de envio, nunca token fora da memória, orçamento de bundle). Sinais de fragilidade: (a) `estilos.test.ts` verifica estilo por **análise de texto do fonte**, inclusive com um caso que admite "o que a guarda não vê" (linha 523): é guarda de lint disfarçada de teste e acopla ao jeito de escrever classe; (b) o teste do build roda Vite dentro do vitest (lento, depende de `dist`); (c) `contraste.test.ts` lê uma tabela de `docs/interface.md` — acoplamento teste↔doc.

Sem teste de mesmo nome (podem ser cobertos por outro arquivo; verificar): `Dialogo`, `DialogoDeConfirmacao`, `DialogoDoConvite` (422 linhas), `LoginPorCima`, `CodigoQr`, `FronteiraDaArea`, `NaoEncontrada`, `ia/AssinaturaIA`, `ia/MotorFormulario`, `ia/TextoDaIA`, `meus-dados/MeusDados`, `estado/EstadoErro` (há `estados.test.tsx` que cobre `estado/`), e quase todas as `paginas/*` (11 de 14; cobertas só por e2e [hipótese]). Confirmaria: grep dos nomes nos `*.test.tsx` agregados (`Superficies.test.tsx`, `SeloEFaixa.test.tsx` cobrem Cartao/Faixa/SeloDeEstado).

Não achei `.skip/.todo`.

## 8. Resiliência e escala (sinais)

- Timeouts: **`chamarApi` não tem timeout próprio** (nem `AbortSignal.timeout`); só o `signal` do TanStack. Em rede de escola instável uma requisição pendurada fica até o navegador desistir; `TEMPO_ESGOTADO` existe como código, mas é da API [código `cliente.ts:77-105`; conferido: grep `timeout` em `api/*.ts` só acha o relógio de "demorando" em `execucoes.ts:108` e a espera de `sessao.ts:377`].
- Retry: 1 tentativa automática, só para erros transitórios; 429/limite nunca é repetido sozinho [código `cliente-de-consultas.ts:13-22`]. Renovação em fila entre abas. Boa.
- Polling: `refetchInterval` em `consultaExecucao` (intervalo do contrato, para ao sair da tela/aba oculta); `componentes/pedidos/atualizacao-dos-pedidos.ts` agenda releitura da lista de pedidos do professor. Intervalo vem de shared (`INTERVALO_DA_CONSULTA_DE_EXECUCAO_MS`), sem jitter visto [hipótese: com 400 alunos, fan-out em fase]. Não há WebSocket nesta unidade (a "sala ao vivo" é de outra).
- Paginação: `lerPaginas` (`estrutura.ts:57`) lê até 10 páginas × 100 e avisa se incompleto; `infiniteQueryOptions` em `lista.ts`. **Virtualização (regra 50 item 1, `docs/interface.md:583`) não existe**: nenhuma lib, e `Tabela.tsx:41` diz "não pagina nem virtualiza". Aceitável enquanto toda lista é paginada.
- Estado em memória: tudo por aba, por desenho; `BroadcastChannel`/Web Locks cobrem multi-aba.
- Bundle: política de chunks por papel (`coordenacao-*`, `professor-*`, `aluno-*`, `operacao-*`, `tela-<area>-*`, `pecas-*`, `parte-*`, `galeria-*`), tetos em `.size-limit.json`: entrada 150 kB brotli (declarada "perto de 127 kB" [doc `.size-limit.json:3`]), professor 8 kB, coordenação 16 kB, aluno 5 kB, peças 40 kB; 46 `lazy(` no código. Code-splitting por rota/papel existe e é testado (só o chamado teste de build prova de fato). 127 kB brotli de entrada é grande para uma tela de login [hipótese: React+ReactDOM ≈ 60 kB, zod (via shared) e todas as 13 `paginas/*` (≈1,8k linhas) na entrada; confirmaria `vite build` + visualizador de chunk]. As páginas do aluno (`TurmaPublica`, `EntrarNaEscola`) são estáticas na entrada de propósito (primeira tela do aluno) [doc `rotas.tsx:224`].
- Observabilidade: não vi nenhuma telemetria do cliente (erro/latência) na unidade — o frontend não reporta nada ao servidor além do `registrarAtividade`.

## 9. Suspeitos de código morto

Método: script próprio sobre imports relativos (não vê `import()` por string dinâmica nem uso por nome em teste).
- `componentes/Busca.tsx` (41) e `componentes/Opcao.tsx` (60): únicos importadores não-teste são `galeria/` [código, script]. Estão ainda em `PECAS_FORA_DA_ENTRADA` (`nome-dos-chunks.ts`). Referência dinâmica possível: nenhuma vista; **não é usado por nenhuma tela do produto**.
- `componentes/Toque.tsx`, `Interruptor.tsx`, `CampoLongo.tsx`, `ia/Escolha.tsx`, `ia/MotorFormulario.tsx`, `ia/PaginaMini.tsx`: usados por *uma* área (professor) + galeria — não mortos, mas "peça" que é de uma área [código].
- `galeria/` inteira (1.543 linhas): existe "para o e2e provar as peças antes de as telas existirem" [doc `caminhos.ts:228-232`]; as telas já existem. Rota só sobe com `VITE_COM_GALERIA=1`, ligada em `.env.example:54` (portanto no ambiente local e na esteira) [código]. Pergunta: o e2e ainda a usa? Confirmaria: grep `galeria` em `/e2e`.
- `api/memoria-da-aba.ts`: usada via `LugarNaAba`, não morta.
- `papeis.ts` (7 linhas, `NOME_DO_PAPEL`): 8 referências, vivo, mas arquivo de 1 export.

## 10. Duplicação e inconsistência

1. **Segunda pilha de sessão para o operador.** `operacao/api/sessao.ts` (486 linhas) repete quase função a função `api/sessao.ts` (715): abrir pelo cookie, renovar com Web Locks (nome de trava próprio), login por etapas, convite, MFA, inatividade (`operacao/inatividade.ts` vs `sessao/inatividade.ts`), `ErroDaOperacao` vs `EstadoErro`, `operacao/titulo.ts`, `operacao/componentes/DialogoDoConvite.tsx` e `DialogoDaOperacao.tsx` vs `componentes/DialogoDoConvite.tsx` (422 linhas) e `Dialogo.tsx`, e as páginas `operacao/paginas/{Convite,ConfigurarMfa}` vs `paginas/{Convite,ConfigurarMfa}` [código, comparação de nomes de função e listagem]. É a maior duplicação estrutural do web (≈1,3–2k linhas estimadas).
2. **`api/sessao.ts` mistura seis assuntos** em 715 linhas com 12 `let` de módulo: máquina de estado, token, renovação, login por e-mail/matrícula/MFA, escolha/troca de escola, convite pendente, desafio/aviso de entrada, atividade/inatividade. Ordem de efeitos (`anunciar()` antes de `limparDadosDaEscola()`) é invariante que só os 861 linhas de teste protegem [código `sessao.ts:306-325`].
3. **Botão com dois caminhos.** Componente `Botao` (175 usos) e constantes `CLASSES_DO_BOTAO_*`/`classesDoBotao` para `<button>/<a>` à mão (105 usos de constante, 81 `<button>` crus) [código, grep]. `botao-secundario.ts` tem nome histórico ("nasceu na operação") mas hoje define 5 variantes e 3 tamanhos; o próprio cabeçalho admite forma montada "de dois jeitos" e que "a igualdade é do teste" [código `botao-secundario.ts:1-20` do comentário].
4. **Diálogos: ≥6 peças.** `Dialogo` (133), `dialogos.tsx` (206: `DialogoDeFormulario`, `ConfirmacaoDePerigo`, `CorpoDaConfirmacaoDePerigo`, `AlertaDaFalha`...), `DialogoDeConfirmacao` (119, oficial/perigo com resumo), `pedidos/DialogoDeDecisao` (155), `DialogoDoConvite` (422), `LoginPorCima` (152), mais `dialogo-aberto/-modal/-prioritario.ts`. Há **duas confirmações de perigo**: `ConfirmacaoDePerigo` (7 arquivos) e `DialogoDeConfirmacao variante=perigo` (14 arquivos) [código, grep]. Nome `dialogos.tsx` no plural convive com `Dialogo.tsx`.
5. **Peça que repete a mesma pergunta.** `Aviso` (4 tons), `Faixa` (info fixa), `SeloDeEstado` (4 famílias, o export se chama `Estado` e colide de nome com `paginas/Casca.tsx:Estado` local), `EstadoErro/Vazio/Carregando` — cada um com cor/borda próprias; `Faixa` é "Aviso info sem título e sem fechar" por regra, poderia ser variante.
6. **Formatação.** `formatar.ts` centraliza (49 usos), mas há `Intl.*` espalhado em ≥9 arquivos de `areas/` e `Sino.tsx`, e `operacao/formatos.ts` reexporta uma parte.
7. **Doc/histórico dentro do código.** Comentários citam "Tech Spec da X1, seção 5", "tarefa 13.0", "A1, 17.0", "RF24" (25 ocorrências só de padrão `tarefa/Tech Spec N.N` nas três pastas + muitas mais com `A\d/X\d/RF\d`). Em `api/sessao.ts`, por ex., o bloco explicativo de `encerrarLocalmente` tem ≈25 linhas para 14 de código. Acentua curva de leitura e envelhece com o roadmap.
8. **Política de chunks codificada à mão.** `nome-dos-chunks.ts` (~145 linhas) + lista `PECAS_FORA_DA_ENTRADA` de 30 nomes de arquivo + teste de 605 linhas; a lista precisa ser mantida na mão quando uma peça passa a ser usada pela entrada (o teste reprova). Complexidade alta para ganho que o `import()`+ tetos já dão.
9. **`componentes/` como depósito.** 159 arquivos; mistura peças genéricas (Botao, Campo, Tabela), lógica pura sem React (`seletor.ts`, `midia.ts`, `flutuante.ts`, `gaveta.ts`, `barra.ts`), regras de domínio (`id-do-pedido.ts`, `pedido-de-convite.ts`, `link-do-convite.ts`, `textos-do-convite.ts`, `pedidos/textos.ts`, `meus-dados/regras.ts`) e telas inteiras (`meus-dados/MeusDados.tsx`, 247; `pedidos/ListaDePedidos.tsx`, 226; `sino/Sino.tsx`, 234; `CascaDaEscola.tsx`, 358; `DialogoDoConvite.tsx`, 422). Motivo declarado: "importar de `areas/coordenacao/` levaria o módulo para o chunk da outra área" [doc `componentes/dialogos.tsx`, cabeçalho] — ou seja, a pasta serve de local neutro para o que duas áreas dividem.
10. **Pastas/arquivos soltos na raiz**: `papeis.ts` (7 linhas), `titulo.ts` (37), `formatar.ts`, `tema.ts`, `caminhos.ts` (256, mistura rotas de 4 áreas, `ROTAS_DO_PROFESSOR` com helpers de path e 20 constantes com prefixo repetido `${BASE_DA_AREA.x}${ROTAS_DA_x.y}`).

Maiores arquivos (código): `api/sessao.ts` 715; `paginas/TurmaPublica.tsx` 513; `componentes/DialogoDoConvite.tsx` 422; `componentes/CascaDaEscola.tsx` 358; `estilos.css` 535; testes: `sessao.test.ts` 861, `estilos.test.ts` 807, `nome-dos-chunks.test.ts` 605.

## 11. Doc × código

- Regra 50 item 1 pede "lista longa virtualizada": não há virtualização [código; doc `docs/interface.md:583`]. Substituída por paginação — a regra não foi atualizada.
- Regra 50 item 3 (estado de servidor no TanStack Query): cumprida, com a exceção declarada de `memoria-da-aba.ts` (estado "entre rotas" fora do cache) e `ciclo-de-execucao` (máquina própria) — é estado de cliente legítimo, mas de aparência de "duplicar".
- Regra 50 item 13 (seletor de escola no topo da área do professor): existe `SeletorDeEscola.tsx`; CLAUDE.md diz que na A1 fechou "só com a escola ativa e trocando o token" (P30) — consistente.
- `.size-limit.json` descreve a entrada como "perto de 127 kB" e o `professor-*` com teto de 8 kB; o texto dos limites é mini-ata de spec (4 linhas cada) e não mede o que diz (a soma de verdade é feita pelo teste); o próprio JSON admite isso [doc `.size-limit.json:3`].
- `compose` não sobe sem `VITE_COM_GALERIA` definida; `.env.example` liga a galeria — logo é "o esquecimento falha para o lado seguro" só se o ambiente de produção definir explicitamente `0` [doc `rotas.tsx:35-40`; hipótese: confirmaria `infra/` e `compose.yaml`].
- CLAUDE.md diz "Nada de mockup é copiado para o `apps/web`": não verifiquei (pasta `mockups/` fora desta unidade).

## 12. Tamanho, risco e dependências

- ≈14 mil linhas de produção, ≈10,9 mil de teste, 236 arquivos (+ galeria, páginas).
- **Risco de mexer: médio-alto.** `api/sessao.ts` e `api/cliente.ts` são caminho de todo request (55 e 42 arquivos importam); erro aqui afeta login, vazamento entre pessoas no Chromebook compartilhado (regra 20/10) e inatividade. `componentes/` base (`Botao` 76, `estado` 57, `Tela` 37) tem 5–6 áreas importando: refatorar o kit toca o app todo, mas a cobertura unitária é boa e o e2e cobre fluxo. Mexer em `estilos.css`/paleta quebra `estilos.test.ts` (por desenho).
- Depende de: `packages/shared` (contratos), API (HTTP `/v1/*`). Dependem dela: `src/areas/*`, `src/operacao/`, `/e2e` (usa o build com galeria), CI (`size-limit`, `nome-dos-chunks.test.ts`).

## 13. Os 5 achados mais importantes

1. **Sessão duplicada**: `operacao/api/sessao.ts` (486) reimplementa `api/sessao.ts` (715) com convite, MFA, inatividade, diálogos e páginas gêmeos — parametrizar uma pilha só tira ≈1,5 mil linhas e uma classe de bug (duas máquinas de renovação para manter iguais).
2. **`api/sessao.ts` concentra seis responsabilidades e 12 variáveis de módulo**, com ordem de efeitos crítica protegida só por 861 linhas de teste; separar "estado da sessão", "renovação" e "etapas de login" é o primeiro corte seguro.
3. **Contrato do cliente é o ponto forte**: toda resposta é validada por esquema zod de `@educa/shared`, erro tipado por `CodigoDeErro`, nenhuma URL fora de `api/`; os furos: corpo do pedido não validado e **sem timeout próprio** em `chamarApi`.
4. **Boilerplate de TanStack Query repetido**: ≈65 cópias de `<EstadoErro … refetch({cancelRefetch:false})>` (algumas divergentes, `Painel.tsx` sem a opção), ≥8 `recarregar` idênticos e 45 pontos de invalidação em três estilos de chave — falta uma peça `EstadoErro` que receba a consulta e um lugar único para "o que cada escrita invalida".
5. **Kit visual com variantes paralelas e depósito**: botão por componente *e* por constantes de classe, duas confirmações de perigo, ≥6 diálogos, `Aviso/Faixa/SeloDeEstado` sobrepostos, peças só da galeria (`Busca`, `Opcao`) e de uma área só em `componentes/`; mais uma política de chunks de 30 nomes mantida à mão com teste de build de 605 linhas — complexidade de processo maior que a do produto.

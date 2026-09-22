# Achados das revisões — `tasks/prd-identidade-e-tenancy/19_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-19 23:40:04 · `tasks/prd-identidade-e-tenancy/19_task.md`

Auditei a tarefa 19.0 lendo os testes novos, o código que eles deveriam provar, as fixtures, o `config.json` do `oidc-falso` (para conferir se as asserções de privacidade não são vazias) e os testes de API das tarefas 6.0, 7.0, 11.0 e 13.0 que sustentam o que o e2e não cobre. Rodei as suítes de unidade tocadas (38 casos, verdes).

```
VEREDITO: REPROVADO

Cenários exigidos: caminho feliz da matrícula por teclado e por toque nos dois projetos · isolamento
(mesma matrícula em duas escolas) · endereço inexistente · conta segurada na tela com o colega entrando ·
conta da escola ligada · conta sem ligação · qualquer `error` do provedor com o `?falha` saindo da barra ·
privacidade (e-mail, nome e foto do provedor fora da tela e da URL) · MFA sem celular (segredo em texto,
copiar, ativar, códigos uma vez, entrar com TOTP) · código de recuperação de uso único · 5 códigos errados
consomem o desafio · convite com token fora da barra antes da primeira chamada · convite expirado/revogado/
inexistente com a mesma mensagem · conta existente indo para `/entrar` sem senha nova e com o bilhete ativando
a escola do convite · acessibilidade e layout em 360 px · concorrência de clique duplo.

Cobertos: todos. Em particular, os que costumam nascer decorativos estão com dentes:
- e2e/convite.spec.ts:28-36 segura a chamada de consulta e lê a barra *dentro* do handler da rota: falha se o
  `history.replaceState` sair de Convite.tsx:65-67.
- e2e/convite.spec.ts:105-106 prova o bilhete pelo efeito (etapa `escolher`), não pela existência da variável:
  sem o bilhete a conta entraria direto na escola antiga.
- e2e/entrar-na-escola.spec.ts:224-229 confere e-mail, nome e foto que o `oidc-falso` realmente devolve
  (infra/oidc-falso/config.json, bloco `google-aluna-a`) — não é asserção sobre string inexistente.
- e2e/entrar-na-escola.spec.ts:111-129 troca o endereço da escola com a mesma matrícula: falha se a tela parar
  de mandar o `slug` no corpo.
- apps/web/src/api/etapas-do-login.test.ts:115-175 prova qual desafio vai em qual rota e que sem desafio nem
  sai chamada; 196-218 prova que o bilhete sobrevive à senha errada e some depois do login.

Bloqueantes:
1. `.processo/portao.json` — o carimbo verde é de 2026-09-19 22:13:08, e onze arquivos da tarefa mudaram
   depois dele: e2e/mfa.spec.ts (23:33:54), apps/web/src/api/etapas-do-login.test.ts (23:22:17),
   e2e/entrar.spec.ts (23:20:31), apps/web/src/paginas/ConfigurarMfa.tsx (23:18:09), e2e/convite.spec.ts
   (23:16:06), e2e/__fixtures__/sessao.ts (23:15:39), e2e/entrar-na-escola.spec.ts (23:14:03),
   tools/ci/ambiente.test.ts (23:12:27), infra/teste.env (23:12:01), playwright.config.ts (23:11:57).
   `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/19_task.md` reprova com
   "e2e/mfa.spec.ts mudou ... depois do início do último". Ou seja: nenhuma das três specs auditadas rodou
   verde na árvore que estou auditando, e a nota da rodada afirma "e2e verdes". O mais exposto é justamente
   o mfa.spec.ts, que é o mais frágil da tarefa (TOTP com passo à frente, área de transferência, cinco
   tentativas) e o último a mudar, três minutos antes desta rodada.
   Correção exigida: rodar `node tools/processo/portao-local.ts --e2e --infra` (infra porque a tarefa toca
   `infra/teste.env` e `playwright.config.ts`) e, se algo estiver vermelho, corrigir antes de reabrir a
   revisão. Sem carimbo válido não dá para afirmar que estes testes provam alguma coisa.

Recomendações:
- e2e/mfa.spec.ts:86-92 — o comentário diz "sair da tela apaga segredo e códigos: eles vivem só no estado do
  componente", mas a verificação vem depois de um `page.goto('/mfa/configurar')`, que é recarga completa e
  apaga a memória da aba de qualquer jeito. O teste passaria igual se o segredo fosse parar no cache do
  TanStack Query (subtarefa 19.2). A parte que importa está provada em outro lugar (`no-store` em
  apps/api/test/mfa.int.test.ts:237 e 251; nada em localStorage/sessionStorage/URL em e2e/mfa.spec.ts:64-67),
  então não bloqueio — mas ou o comentário passa a dizer o que o teste prova, ou a checagem do segredo/códigos
  é feita também depois da navegação por dentro (o link "Ir para a entrada"), antes do `goto`.
- e2e/entrar-na-escola.spec.ts:62-87 — a escola do caminho feliz não tem provedor liberado e nenhuma asserção
  cobre o caso de borda "Escola revoga o app" do PRD: falta um `expect(page.getByRole('link', { name: /Entrar
  com a conta/ })).toHaveCount(0)`, que prova EntrarNaEscola.tsx:168 ("um botão por provedor devolvido").
  A metade de segurança já está em apps/api/test/acesso-da-escola.int.test.ts:70-81.
- e2e/convite.spec.ts:44-51 — clique duplo em "Aceitar o convite" não tem teste, e o convite é token de uso
  único; a guarda existe em Convite.tsx:80 e no `disabled`. O risco real está coberto em paralelo de verdade
  na API (apps/api/test/convite.int.test.ts:305 e 323), e o mesmo padrão de guarda já é provado em
  e2e/entrar-na-escola.spec.ts:173-196 — por isso é recomendação, não bloqueio. Copiar aquele padrão (rota
  segurada + `dispatchEvent('click')` + contagem de pedidos) fecha o item.
- e2e/entrar-na-escola.spec.ts:142-171 — a metade "os outros alunos do mesmo computador seguem entrando" é
  decidida pela bandeira do mock na linha 168, não pela API: se o bloqueio fosse por IP, este teste não veria.
  O que segura a regra é apps/api/test/sessao-matricula.int.test.ts:304-312. Se o custo de cinco hashes no
  perfil Chromebook couber, provocar o `CONTA_SEGURADA` de verdade tornaria a tela prova de ponta a ponta.
- e2e/convite.spec.ts — nenhuma checagem de alvo de 44 px (o cenário da tabela pede "alvo de 44 px nos
  botões"); o `Botao` garante `min-h-11`, e as outras duas specs checam, então é só simetria.
- e2e/mfa.spec.ts:81-84 — o botão "Copiar os códigos" (subtarefa 19.2) não é exercido; só o "Copiar o segredo".
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/.processo/portao.json`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/mfa.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/convite.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/entrar-na-escola.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/etapas-do-login.test.ts`.

## test-engineer · 2ª rodada · APROVADO · 2026-09-20 01:48:00 · `tasks/prd-identidade-e-tenancy/19_task.md`

Auditoria completa: li os três specs novos, o teste de unidade novo, o diff de `mensagens.ts`/`mensagens.test.ts`, as fixtures, as quatro telas novas, `playwright.config.ts`, `infra/teste.env`, `tools/ci/ambiente.test.ts` e o carimbo do portão contra o mtime de cada arquivo da tarefa.

**Portão (bloqueante da 1ª rodada) — resolvido e conferido por mim.** `.processo/portao.json` tem `inicio` 2026-09-20T04:14:19.362Z (01:14:19 -03) com as cinco suítes, incluindo `e2e` e `infra`. O arquivo mais recente da tarefa é `apps/web/package.json` (01:14:09) e `package-lock.json` (01:14:12), ambos anteriores ao início. Todos os demais são de 19/09, 23:41 ou antes. `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/19_task.md` responde "portão local válido para o código atual (typecheck, lint, test, e2e, infra)". Desta vez os três specs rodaram verdes na árvore que estou auditando.

**As seis recomendações da 1ª rodada, uma a uma, conferidas no arquivo:** `e2e/mfa.spec.ts:90-99` (checagem por dentro, via `link "Ir para a entrada"` → `toHaveURL(/\/entrar$/)`, antes do `goto`, e o comentário agora diz o que o teste prova) · `e2e/entrar-na-escola.spec.ts:91-99` (botão de conta com `toHaveCount(0)`; prova `EntrarNaEscola.tsx:168`, `if (provedores.length === 0) return null`) · `e2e/convite.spec.ts:67-89` (rota `**/v1/convites/aceitar` segurada, `toBeDisabled()`, `dispatchEvent('click')`, `expect(aceites).toBe(1)` — o segundo clique acontece com o primeiro ainda em voo, é concorrência de verdade, não duas chamadas em sequência) · `e2e/convite.spec.ts:42-43` (44 px) · `e2e/mfa.spec.ts:83-86` ("Copiar os códigos" exercido, com `role="status"` e a área de transferência com os dez códigos) · `e2e/entrar-na-escola.spec.ts:154-177` (as cinco senhas erradas vão à API de verdade; a bandeira de mock sumiu, e o colega entra no mesmo navegador logo depois — é isso que prova que o freio é por conta e não por IP na tela).

**A mudança fora das recomendações** (`qrcode-generator` de `^2.0.4` para `2.0.4`) confere: `git diff` do lock são as 7 linhas da dependência, versão exata, e o lock foi escrito 7 segundos antes do início do portão.

```
VEREDITO: APROVADO

Cenários exigidos: caminho feliz da matrícula por teclado e por toque nos projetos chromebook e celular ·
isolamento (matrícula 1234 em duas escolas, com a senha de A no endereço de B) · endereço inexistente sem
listar escola · conta segurada de verdade com o colega entrando no mesmo computador · conta da escola ligada ·
conta sem ligação · escola sem provedor liberado (borda "Escola revoga o app") · qualquer `error` do provedor
com a mesma mensagem e `?falha` fora da barra · privacidade (e-mail, nome e foto do provedor fora do DOM e da
URL) · MFA sem celular (segredo em texto, copiar, ativar, dez códigos uma vez, entrar com TOTP) · código de
recuperação de uso único · 5 códigos errados consomem o desafio e o sexto certo não entra · convite com token
fora da barra antes da primeira chamada · expirado/revogado/inexistente com a mesma mensagem · conta existente
para `/entrar` sem senha nova, com o bilhete ativando a escola do convite · acessibilidade e layout em 360 px ·
concorrência: clique duplo em "Entrar" e em "Aceitar o convite".

Cobertos: todos. Os que mais fácil nasceriam decorativos estão com dentes:
- e2e/convite.spec.ts:28-36 lê a barra dentro do handler da rota segurada: morre se o `history.replaceState`
  sair de Convite.tsx:65-67.
- e2e/convite.spec.ts:129-132 prova o bilhete pelo efeito (etapa `escolher`), não pela variável: sem ele a
  professora entraria direto na escola antiga.
- e2e/entrar-na-escola.spec.ts:230-235 confere os três dados que o `oidc-falso` realmente devolve
  (infra/oidc-falso/config.json, bloco `google-aluna-a`), não string inventada.
- e2e/entrar-na-escola.spec.ts:154-177 e e2e/mfa.spec.ts:146-172 provocam os contadores reais da API (5 senhas
  erradas, 5 códigos errados) em vez de simular a resposta.
- apps/web/src/api/etapas-do-login.test.ts:196-212 prova que o bilhete sobrevive à senha errada e some depois
  do login — o caso que um "verifica e grava" ingênuo quebraria.
- Fixtures gravam no Postgres do compose, com dado sintético (`@educa.invalid`, "Aluno sintético"); nenhum
  teste chama provedor de IA nem provedor pago; nenhum `.skip`, `.only`, `fixme` ou teste comentado em
  `e2e/`, `apps/web/src` e `packages/shared/src`.

Bloqueantes: nenhum.

Recomendações:
1. e2e/mfa.spec.ts:171 — `not.toContainText(codigoDoAutenticador(segredo, PASSO_SEGUINTE_SEGUNDOS))` é
   asserção que passa quase por construção (um código de 6 dígitos numa página que já provou não ter
   formulário). Quem segura a regra é o `toHaveCount(0)` da linha 170. Tirar ou trocar por algo que possa
   falhar.
2. tasks/prd-identidade-e-tenancy/19_task.md:74 prevê `MFA_NECESSARIO` em `mensagens.ts`, e o código não o
   criou — a etapa `mfa` é roteada por `ROTA_DA_ETAPA`, não por código de erro. Está certo assim; vale uma
   linha no `/validar` para a próxima tarefa não procurar o nome.
3. e2e/convite.spec.ts:42-43 confere só a altura do alvo de 44 px; `esperarAlvoDeToque` das outras duas specs
   confere largura e altura. O botão é `w-full`, então é simetria, não risco.
4. A exigência de cache da 19.2 ("respostas com `no-store` nunca vão para o cache do TanStack Query") hoje é
   garantida por estrutura — `apps/web/src/api/mfa.ts` chama `chamarApi` direto, sem `useQuery` — e nenhum
   teste ficaria vermelho se alguém movesse o segredo para uma consulta cacheada amanhã. Um teste de unidade
   que afirme que `configurarMfa`/`ativarMfa` não tocam o `QueryClient` fecharia o item barato.
5. e2e/entrar-na-escola.spec.ts:91-99 prova a ausência com uma escola sem provedor; o lado positivo (a lista
   vem da API) está em outro teste, com outra fixture. Liberar um provedor no mesmo teste e exigir exatamente
   um botão amarraria os dois lados numa asserção só.
```

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/e2e/entrar-na-escola.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/mfa.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/convite.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/etapas-do-login.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/erros/mensagens.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/EntrarNaEscola.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Mfa.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/ConfigurarMfa.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Convite.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/mfa.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.processo/portao.json`.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-09-20 01:52:34 · `tasks/prd-identidade-e-tenancy/19_task.md`

Auditei os quatro fluxos novos contra a regra 50 e `docs/interface.md`, li o build real da web e conferi o CSS servido.

```
VEREDITO: AJUSTES NECESSÁRIOS
```

**Estados:** ok. `/e/:slug` tem carregando ("Abrindo o endereço da escola…"), erro (`NAO_ENCONTRADO` sem "tentar de novo", que é o certo) e com dado; `/mfa/configurar` tem carregando, erro com retentativa e dado; `/convite` tem "Conferindo o convite…", inválido e dado. A ausência de estado vazio está justificada em comentário em cada tela (não há lista a buscar) e é defensável. Itens 6 (feed de agentes), 8 (aprovar nota) e 13 (seletor de escola) não se aplicam a nenhuma destas telas e continuam por verificar no F2.

**Acessibilidade:** boa. Rótulo visível em todo campo (`Campo.tsx` com `useId` + `aria-describedby` na dica), foco global de 3 px em `:focus-visible`, `role="status"` para "Entrando…"/"Ativando…" e `role="alert"` nas falhas, axe com `wcag22aa` sem violação séria em todas as telas novas, caminho feliz provado só por teclado. Nenhum `hover:` em nenhum arquivo novo.

**Chromebook fraco:** ok. Perfil do Playwright com CPU ×4 e Fast 3G aplicado por CDP em todo spec; o QR é `<path>` de SVG calculado em `useMemo`, sem canvas nem imagem; bundle em 105,89 kB brotli contra teto de 150 kB; nenhuma lista longa nesta tarefa; sem upload de imagem aqui.

**Celular:** ok. 360 × 800 com toque no projeto `celular`, `larguraExcedente === 0` verificado em todas as telas novas, alvo de 44 px medido por `boundingBox` em "Entrar", "Ativar o segundo fator", "Aceitar o convite" e no link do Google, `inputmode`/`autocomplete` certos em todos os campos, e viewport sem `user-scalable=no`. E nenhum fluxo exige telefone: o segredo do MFA sai em texto com botão copiar, com o e2e ativando o segundo fator sem encostar no QR.

**Ação oficial protegida:** sim, no que existe aqui. Aceitar convite mostra o nome da escola antes; ativar o MFA pede o código do aplicativo e avisa sobre os dez códigos antes de sair da tela; clique repetido não manda dois pedidos (provado em `e2e/convite.spec.ts:67` e `e2e/entrar-na-escola.spec.ts:179`).

**Bloqueantes**

1. `apps/web/src/estilos.css:12-28` (efeito em `apps/web/src/paginas/SemDesafio.tsx:16`, `Convite.tsx:116`, `ConfigurarMfa.tsx:157`, `EntrarNaEscola.tsx:49`, `Entrar.tsx:59` e `:67`, `Mfa.tsx:123`) — o `@theme` zera a paleta (`--color-*: initial`) e só devolve as cores listadas, e esta tarefa introduziu seis caixas de aviso com `border-amber-300 bg-amber-50 text-amber-900` e um botão com `text-blue-800`, nenhuma dessas cores declarada. Rodei `vite build` e conferi o CSS gerado: `grep -c amber dist/assets/*.css` devolve **0**, e não existe regra `.text-blue-800`. Ou seja, todo aviso de atenção destas telas — "este convite não vale mais", "guarde estes códigos agora, eles não aparecem de novo", "não foi possível encerrar a sessão anterior neste computador", a falha da conta Google — sai sem fundo, sem cor e com borda em `currentColor`, visualmente indistinguível de um painel neutro. O axe não pegou porque o texto herda `text-slate-900` sobre `bg-slate-50` e o contraste passa por acaso. O próprio comentário do arquivo declara a invariante violada: "Classe com cor fora desta lista não gera CSS nenhum". **Correção exigida:** declarar em hex no `@theme` as cores usadas (`--color-amber-50/300/900`, `--color-blue-800`) ou trocar as classes por cores já existentes na paleta; e estender a guarda de `e2e/casca.spec.ts:286-293`, que hoje só reprova `oklch(`, para reprovar classe de cor sem regra no CSS servido — por exemplo afirmando que o `background-color` computado da caixa de aviso difere do fundo da página.

**Recomendações** (não bloqueiam; ficam para `/validar` e `/retro`)

- `apps/web/src/paginas/Entrar.tsx:50-107` repete literalmente `CascaPublica` e duas vezes o `Campo` criados nesta tarefa. Duas fontes de verdade para alvo de toque e rótulo é o que faz uma delas envelhecer sozinha.
- `apps/web/src/paginas/ConfigurarMfa.tsx:33-43`: sob `StrictMode` em desenvolvimento o efeito dispara dois `POST /v1/conta/mfa/configurar`, e cada chamada sobrescreve o segredo da conta. Em produção (`vite preview`, que é o que o compose serve na porta 4173) não acontece, por isso o e2e não vê; mesmo assim, uma trava por `useRef` alinharia dev e produção.
- `apps/web/src/componentes/CodigoQr.tsx` e a dependência `qrcode-generator` entram no bundle inicial de todo mundo, inclusive do aluno que só abre `/e/:slug` no Chromebook. Um `React.lazy` na tela de configuração tiraria o gerador do caminho do aluno. O teto passa com folga hoje.
- `apps/web/src/componentes/BotaoCopiar.tsx:36`: a mensagem de falha diz "selecione o texto ao lado", mas no caso dos códigos de recuperação o texto está acima, não ao lado.
- `apps/web/src/paginas/ConfigurarMfa.tsx:66-74`: o "Tentar de novo" com falha `NAO_AUTENTICADO` (desafio ausente) vai falhar sempre; mostrar `SemDesafio` nesse código pouparia o ciclo.
- `apps/web/src/paginas/EntrarNaEscola.tsx:45`: o `h1` muda de "Entrar na escola" para o nome da escola quando a consulta chega; na rede móvel lenta isso é um salto de título. Um título estável com o nome da escola abaixo evitaria.

## test-engineer · 3ª rodada · APROVADO · 2026-09-20 02:34:19 · `tasks/prd-identidade-e-tenancy/19_task.md`

Auditei o diff desde a minha 2ª rodada (os cinco itens), e rodei mutação no teste novo para conferir se ele morde.

**O que verifiquei de fato**

- Mutação 1 — apaguei `--color-amber-50` de `estilos.css`: teste vermelho, nomeando a cor e os cinco arquivos (`ConfigurarMfa.tsx`, `Convite.tsx`, `Entrar.tsx`, `EntrarNaEscola.tsx`, `SemDesafio.tsx`).
- Mutação 2 — acrescentei `bg-emerald-50 hover:text-teal-700` em `Mfa.tsx`: vermelho nas duas cores, com prefixo `hover:` reconhecido.
- Mutação 3 — troquei `--color-blue-700` por `oklch(...)`: dois casos vermelhos (o da paleta hex e o da cor sem declaração em hex).
- Build real (`vite build`): `oklch(` ausente; `#fffbeb`, `#fcd34d`, `#78350f`, `#1e40af`, `#f1f5f9` presentes; `.bg-amber-50`, `.border-amber-300` e `.text-amber-900` com regra. O bloqueante do `frontend-reviewer` está de fato fechado no CSS servido, não só no fonte.
- `enderecoDaEscola` não tem mais nenhuma referência em código nem em teste. Nenhum `.skip`/`.only`/`fixme` nos novos arquivos. Nenhuma classe de cor fora de `apps/web/src` e nenhuma classe montada por template literal (que nem Tailwind nem o teste veriam).
- Unidade de `apps/web/src` + `packages/shared/src`: 8 arquivos, 92 testes verdes. O teste do bilhete (`etapas-do-login.test.ts:196-212`), que o comentário reescrito descreve, continua o mesmo e continua mordendo.

```
VEREDITO: APROVADO

Cenários exigidos (3ª rodada, sobre o diff): cor usada sem declaração não passa despercebida ·
paleta zerada e toda cor em hex, nunca oklch() · o próprio teste falha quando a cor falta (e não
só quando sobra) · o CSS construído realmente pinta as caixas de aviso · o pedido único de segredo
do MFA · remoção de código morto sem quebrar chamador · comentário sem mudança de comportamento.
Os cenários da 2ª rodada (matrícula, isolamento entre escolas, conta da escola, privacidade do
provedor, MFA sem celular, 5 erros consomem o desafio, convite com token fora da barra, bilhete,
CONTA_SEGURADA, acessibilidade em 360 px, clique duplo) não mudaram e não foram reauditados.

Cobertos: todos, menos o pedido único de segredo — ver recomendação 3, que não bloqueia porque o
comportamento corrigido só existe no build de desenvolvimento.

Bloqueantes: nenhum.

Recomendações:
1. apps/web/src/estilos.test.ts:79-83 — o primeiro caso passa vazio se `arquivosDeCodigo` deixar de
   achar arquivo (mudança em `raizDaWeb` ou no filtro de extensão): `[].filter(...)` é `[]`. O
   terceiro caso tranca o regex, mas não a varredura. Uma linha fecha:
   `expect(coresUsadas().get('blue-700')).toContain('componentes/Botao.tsx')`.
2. apps/web/src/estilos.test.ts:79 prova que a cor está declarada, não que a regra saiu no CSS
   construído. Um `content` mal configurado no Tailwind quebraria igual e calado. O lugar barato é a
   guarda que já lê a folha servida (e2e/casca.spec.ts:286-293, que hoje confere `#1d4ed8` e a
   ausência de `oklch(`): mais um `expect(css).toContain('.bg-amber-50')`.
3. apps/web/src/paginas/ConfigurarMfa.tsx:30-51 — o `useRef` não tem teste que morde: o efeito duplo
   só acontece sob StrictMode no build de desenvolvimento, e o e2e roda o `preview`, então apagar o
   `useRef` não deixa nada vermelho. Não bloqueio porque a conta em produção nunca via dois segredos.
   O que morderia em produção, e é barato: em e2e/mfa.spec.ts:32 e :50 já existe o `waitForResponse`
   de `/v1/conta/mfa/configurar`; contar os pedidos e exigir exatamente 1 pegaria o dia em que uma
   dependência reativa entrar no efeito.
4. As cinco recomendações da 2ª rodada seguem abertas em achados-revisoes.md, como manda o processo.
   A #4 (nenhum teste ficaria vermelho se segredo e códigos fossem para uma consulta cacheada) é a
   que mais perde valor com o tempo — vale levar ao /validar.
5. Processo, não código: o carimbo do portão foi invalidado pela minha auditoria. Para rodar as
   mutações eu reescrevi e restaurei `apps/web/src/estilos.css` e `apps/web/src/paginas/Mfa.tsx` —
   conteúdo byte a byte idêntico (conferido com `diff`), mas o mtime mudou e
   `portao-local.ts conferir` agora pede nova rodada. Rode `node tools/processo/portao-local.ts
   --e2e --infra` antes do commit; nenhuma alteração minha sobrou em disco (o `apps/web/dist` do meu
   build foi removido).
```

Arquivos auditados nesta rodada: `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.css`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/ConfigurarMfa.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/caminhos.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/mfa.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/casca.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/mfa.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/etapas-do-login.test.ts`.

## test-engineer · 4ª rodada · APROVADO · 2026-09-20 03:05:58 · `tasks/prd-identidade-e-tenancy/19_task.md`

Auditei apenas o diff desde a minha 3ª rodada (dois arquivos de teste) e conferi que nenhum arquivo de produção mudou (`git diff --stat` e `git status` batem com o que você descreveu). **Não editei nada** — só leitura, `git diff` e `grep`, então nenhum mtime foi alterado e o carimbo do portão segue válido.

Verificação das duas correções:

1. **Âncora em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.test.ts:84.** Confirmei que `apps/web/src/componentes/Botao.tsx:11` usa `bg-blue-700`, então a asserção é verdadeira hoje e falsa no dia em que a varredura deixar de achar arquivo (mudança de pasta, do filtro de extensão ou do regex). O caso deixou de poder passar vazio. O terceiro caso do arquivo (linha 99) continua cobrindo o regex pelo lado da cor que falta, e o segundo caso prova o `--color-*: initial`. Mutação mental: tirar `--color-amber-50` de `estilos.css` faz `coresUsadas()` achar `amber-50` em `paginas/ConfigurarMfa.tsx:165` sem declaração e o caso 1 fica vermelho. Morde.

2. **Guarda do CSS servido em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/casca.spec.ts:294`.** Cobre a outra metade do que o `frontend-reviewer` exigiu (o CSS que o navegador recebe, não o fonte). Confirmei em `apps/web/dist/assets/index-BpCJtmnE.css` que as três regras existem e que não há `oklch(`, e que o e2e roda contra o compose de teste (build de produção, `playwright.config.ts:5-7`), não contra servidor de dev — logo a asserção exercita o artefato real. Mutação mental: remover `--color-amber-50` do `@theme` faz a utilitária não ser gerada e o e2e fica vermelho mesmo com a classe presente no fonte. Morde, e morde no ponto que o teste de unidade não vê.

Nenhum `.skip`, `.only`, `todo(` ou teste comentado nos dois arquivos.

```
VEREDITO: APROVADO
Cenários exigidos (desta rodada): as duas correções que eu recomendei na 3ª rodada — âncora contra passe vazio no teste de paleta, e guarda de classe de cor no CSS servido pelo e2e.
Cobertos: os dois, com asserção que falha se a regra sumir (paleta zerada sem a cor → classe sem CSS). Nenhum arquivo de produção tocado, então o restante da minha 3ª rodada segue valendo sem reauditoria.
Bloqueantes: nenhum.
Recomendações:
- `apps/web/src/estilos.test.ts:101` contém o literal `border-amber-300 bg-amber-50 text-amber-900` dentro de uma string, e a detecção automática de fonte do Tailwind 4 varre também arquivos `.test.ts`. Isso significa que a guarda de `e2e/casca.spec.ts:294` continuaria verde se todas as páginas perdessem o aviso âmbar. Ela morde o que se propõe a morder (paleta e pipeline), mas não morde "alguma tela ainda usa o aviso". Se quiser fechar isso um dia, `@source not` para `*.test.ts` no `estilos.css` resolve, ou uma asserção de tela sobre o `background-color` computado do `role="alert"`. Não bloqueia.
- Recomendação 3 da rodada passada (o `useRef` de `apps/web/src/paginas/ConfigurarMfa.tsx:31-51` sem teste que morda) fica mantida como recomendação, e concordo com não aplicá-la agora: reli o efeito e o comportamento corrigido é o do duplo efeito do `StrictMode`, que só existe no build de desenvolvimento; o e2e roda o build de produção e não conseguiria reproduzir a regressão. Registrada para o `/validar` e o `/retro`.
```

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-20 03:08:32 · `tasks/prd-identidade-e-tenancy/19_task.md`

Auditei o diff desde a minha 1ª rodada (CSS, testes de paleta, `ConfigurarMfa.tsx`, `caminhos.ts`, comentário em `sessao.ts`) e o que ele afeta. Não reauditei o que não mudou.

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum novo no diff. Segredo TOTP e códigos de recuperação (já na tabela de dados, tarefa 6.0) continuam só no estado do componente
Fora da tabela de dados do docs/lgpd.md: nada
Autorização por objeto: ok — nenhuma rota nova; o desafio `configurar_mfa` continua exigido em apps/web/src/api/mfa.ts:9-13, com `NAO_AUTENTICADO` quando falta
Logs: limpos — zero `console.*`/`logger.*` em apps/web/src
Auditoria: não se aplica ao diff (só CSS, teste e ciclo de vida de efeito no cliente)
Envio externo: nenhum novo. O `--host-resolver-rules` do playwright.config.ts aponta o emissor do `oidc-falso` para 127.0.0.1; nada sai da máquina
Seed/fixture: sintético — `educa-sintetica.test`, `@educa.invalid`, nomes "Aluno sintético"/"Coordenadora sintética", senhas geradas
Bloqueantes: nenhum
Recomendações: as duas da 1ª rodada, mantidas (devDependencies de `otpauth`/`pg`/`@node-rs/argon2` na raiz; asserções de armazenamento em e2e/entrar-na-escola.spec.ts)
```

## Sobre o `useRef` do segredo TOTP (seu item 3)

Não vejo vazamento. O `useRef` guarda `{ tentativa, promessa }` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/ConfigurarMfa.tsx:31`). A promessa retém o valor resolvido, que contém o segredo — então, na prática, o ref alcança o segredo tanto quanto o `useState` alcança. O que importa é o tempo de vida e o alcance, e os dois são idênticos aos de antes:

- o objeto do ref pertence ao fiber do componente; desmontou a tela, ele vai com ela. Não é variável de módulo, não é cache do TanStack Query (`apps/web/src/api/mfa.ts:22-25` chama `chamarApi` direto, fora do Query), não é `localStorage`, `sessionStorage`, cookie nem URL;
- não há nenhuma escrita em armazenamento do navegador em todo o `apps/web/src` — o único casamento de `localStorage|sessionStorage|document.cookie` lá é em comentário;
- `e2e/mfa.spec.ts:64-67` assere `localStorage` e `sessionStorage` **vazios** (`'[]'`), não só sem o segredo, exatamente na tela que agora usa o ref. Se o ref tivesse virado persistência, esse teste cairia.

O ganho de correção também é real e do tipo que só aparece em produção: antes, a segunda execução do efeito gravava **outro** segredo na conta enquanto a tela mostrava o primeiro, e a coordenadora nunca conseguiria ativar, sem erro que explicasse. O reuso está preso a `tentativa`, e só o "tentar de novo" pede segredo novo (linha 43). Conferi a sequência `temDesafio` falso→verdadeiro com a mesma `tentativa`: reaproveita a promessa antiga, que corresponde ao segredo que de fato está na conta — correto.

## Sobre a recomendação 2 (é bloqueante agora?)

**Não.** Continua recomendação, e explico o critério, porque a sua preocupação é legítima:

1. O furo que a asserção pegaria — dado do provedor parar em `localStorage`, `sessionStorage` ou cookie legível — não tem caminho no código. A web não escreve em armazenamento nenhum, e todo cookie nosso sai por uma função única que sempre põe `HttpOnly` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/cookies.ts:33`), inclusive o `educa_oidc`, que ainda é AES-256-GCM.
2. A garantia global já está provada por teste: `e2e/mfa.spec.ts:64-67` (armazenamento vazio) e `e2e/entrar.spec.ts:147-160` (token fora de `localStorage`, `sessionStorage`, `document.cookie` e URL). Qualquer escrita nova em armazenamento quebra o primeiro, venha ela de que tela for.
3. O caminho da conta da escola tem a asserção que é específica dele: `e2e/entrar-na-escola.spec.ts:230-235` varre o DOM e a URL atrás do e-mail, do nome e da foto que o provedor devolve.

O que falta é a asserção no **ponto** do fluxo externo — depois de três navegações e da volta do provedor. É cobertura de regressão de defesa em profundidade, não regra sem teste que a prove. Bloqueante, pelo critério que uso, é violação, bug, vazamento ou regra de negócio sem teste; aqui a regra (regra 50 item 7, regra 20 item 2) tem teste em duas camadas. Se você quiser fechar mesmo assim, o custo é uma linha: repetir o `page.evaluate` de armazenamento logo depois de `esperarAreaAutenticada` no teste de `entrar-na-escola.spec.ts:229`, incluindo `document.cookie` e os três valores de `DADOS_DA_ALUNA_NO_PROVEDOR`.

Os demais itens do diff não tocam privacidade: `estilos.css` e `estilos.test.ts` são paleta (o teste só lê o próprio fonte da web), `casca.spec.ts` confere CSS servido, `caminhos.ts` removeu função morta, e `sessao.ts` mudou só comentário — o bilhete do convite continua em variável de módulo, em memória, como aprovei na 1ª rodada.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-09-20 03:09:20 · `tasks/prd-identidade-e-tenancy/19_task.md`

Auditoria da 2ª rodada, restrita ao diff desde a 1ª e às duas correções exigidas.

## Verificação das correções exigidas

**1. Paleta (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.css:12-33`)** — feita e correta. As quatro cores que exigi estão declaradas em hex, mais `slate-100`, que eu não tinha visto e que estava no mesmo estado (`EntrarNaEscola.tsx:179`, `active:bg-slate-100`). Conferi de forma independente: extraí todos os tokens de cor do fonte da web (19: `amber-50/300/900`, `blue-700/800/900`, `emerald-800`, `red-50/300/800/900`, `slate-50/100/200/400/600/700/900`, `white`) e a lista bate exatamente com as 19 declarações do `@theme` — nenhuma sobrando, nenhuma faltando. No CSS construído agora: `.bg-amber-50`, `.border-amber-300`, `.text-amber-900`, `.text-blue-800` e `.bg-slate-100` têm regra, e `grep -c 'oklch('` devolve 0.

**2. Guarda, nos dois níveis** — feita e efetiva.
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/casca.spec.ts:284-298`: o teste que eu apontei agora exige regra para as três classes do aviso na folha que o navegador recebe, além do `#1d4ed8` e da ausência de `oklch(`. Roda nos dois projetos (`playwright.config.ts` não tem `testMatch` por projeto).
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.test.ts`: está no conjunto padrão (`vitest list` o mostra como `[unidade]`, 3 casos verdes). Reimplementei o regex dele fora do repositório e passei as formas que existem no código: `hover:bg-amber-50`, `sm:text-slate-900/80`, `active:bg-slate-100 border-slate-400`, `disabled:bg-slate-600`, `bg-white` — todas capturadas. A âncora em `blue-700 → componentes/Botao.tsx` fecha o buraco do "varredura vazia passa vazia", e o terceiro caso prova que o regex enxerga a cor que falta. A mutação é real: tirar `--color-amber-50` deixa `amber-50` fora do conjunto de declaradas e reprova.

## O que mais mudou no diff

`ConfigurarMfa.tsx:31-51` (o `useRef` preso à tentativa) resolve o duplo `POST /v1/conta/mfa/configurar` do `StrictMode`, que trocava o segredo da conta por baixo do que a tela mostrava. Conferi a sequência `temDesafio` falso→verdadeiro com a mesma tentativa (reaproveita a promessa certa) e o "tentar de novo" (incrementa, pede outro). Sem teste novo, e não exijo um: o duplo efeito do `StrictMode` só existe em build de desenvolvimento, e o e2e roda contra o compose com build de produção — não há regressão observável para o teste prender. `Mfa.tsx:123` é o botão de trocar de código, com `min-h-11` e `text-blue-800` (contraste ~8,3:1 sobre `slate-50`).

## Os cinco itens que você deixou de fora

Nenhum vira bloqueante, e concordo com o julgamento em todos: a duplicação de casca e campo em `Entrar.tsx:49-104` é literal mas funcionalmente idêntica (rótulo visível, `min-h-11`, `autocomplete` certo) — é limpeza, não defeito; o `React.lazy` no `CodigoQr` é otimização sem urgência, porque o teto do bundle está em 105,83 kB brotli contra o limite de 150 kB; o "ao lado", o `SemDesafio` no `NAO_AUTENTICADO` e o `h1` de `/e/:slug` são texto e polimento.

```
VEREDITO: APROVADO
Estados: ok — nas telas do diff (ConfigurarMfa: carregando com EstadoCarregando, erro com "Tentar de novo", com dado; sem estado vazio aplicável, e isso está justificado no cabeçalho de cada tela)
Acessibilidade: ok — foco visível por :focus-visible em estilos.css:36-40, rótulo visível em todo campo, role="alert" e role="status" nos avisos, axe sem violação grave no e2e; contraste do aviso âmbar #78350f sobre #fffbeb ≈ 8,8:1 e do #1e40af sobre slate-50 ≈ 8,3:1
Chromebook fraco: ok — 105,83 kB brotli contra o teto de 150 kB (size-limit verde), paleta em hex para Chrome anterior ao 111, QR como um único <path> de SVG, e os dois projetos do Playwright com CPU ×4 e rede lenta
Celular: ok — projeto `celular` a 360 px com toque roda todos os specs de tela, larguraExcedente = 0, alvo principal ≥ 44 px e secundário com min-h-11; o QR é conveniência e o segredo em texto é o caminho sem celular
Ação oficial protegida: não se aplica nesta tarefa (identidade e sessão, sem nota nem saída de IA); as ações sensíveis daqui — ativar segundo fator, mostrar códigos de recuperação uma única vez — pedem confirmação explícita e avisam antes
Bloqueantes: nenhum
Recomendações: (1) a guarda de estilos.test.ts não enxerga classe montada por template literal (`text-${x}-700`), que o Tailwind também não geraria — vale um lint proibindo composição dinâmica de classe de cor; (2) a varredura cobre apps/web/src e ignora index.html e packages/shared, o que basta hoje mas caduca se alguma classe nascer fora dali; (3) extrair a casca e os campos de Entrar.tsx para CascaPublica e Campo, hoje duplicados; (4) React.lazy no CodigoQr, tirando o gerador do caminho do aluno; (5) o texto "leia o código ao lado" descreve posição que muda a 360 px, onde o QR empilha acima; (6) o "tentar de novo" do ConfigurarMfa com NAO_AUTENTICADO devolve mensagem de erro onde SemDesafio explicaria melhor; (7) o h1 de /e/:slug poderia virar o nome da escola quando a consulta chega
```

## revisor-geral · 2ª rodada · APROVADO · 2026-09-20 03:09:48 · `tasks/prd-identidade-e-tenancy/19_task.md`

Auditei o diff desde a minha 1ª rodada (`estilos.css`, `estilos.test.ts`, `casca.spec.ts`, `caminhos.ts`, o comentário de `sessao.ts`, o `useRef` de `ConfigurarMfa.tsx`) e o que ele afeta. Não reauditei o que não mudou.

O que conferi por conta própria, e não por confiança no relato:

- **As cinco cores são desta tarefa.** `amber-50/300/900` em `ConfigurarMfa.tsx:165`, `Convite.tsx:116`, `EntrarNaEscola.tsx:49`, `SemDesafio.tsx:16`, `Entrar.tsx:59,67`; `blue-800` em `Mfa.tsx:123`; `slate-100` em `EntrarNaEscola.tsx:179`. Nenhuma cor de tela de outra tarefa entrou junto — a correção é mínima e não invade o F2.
- **O `useRef` de `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/ConfigurarMfa.tsx:40-51` está correto nas quatro sequências que importam:** montagem dupla do `StrictMode` (reaproveita a promessa, um POST só), "tentar de novo" (muda `tentativa`, pede outro segredo), promessa rejeitada (o `.then` de dois braços em toda execução evita rejeição não tratada), desmontagem no meio do voo (`atual = false`). Os hooks continuam todos antes do `return` antecipado da linha 55.
- **`enderecoDaEscola` não deixou buraco:** nenhum código de produção monta `/e/<slug>`; só os e2e, que devem usar a URL literal mesmo.
- **`estilos.test.ts` morde:** tirar `--color-amber-50` do `@theme` deixa o caso 1 vermelho apontando `paginas/ConfigurarMfa.tsx`, e a âncora da linha 84 impede o passe vazio.
- **Portão local:** carimbo de 02:35:03 local, posterior ao `mtime` mais novo de código (02:34:57, `e2e/casca.spec.ts`); `conferir` responde "portão local válido para o código atual (typecheck, lint, test, e2e, infra)".

Sobre as três que você não aplicou, concordo em não empilhar — e uma delas eu mesmo rebaixo. A recomendação 5 (`CONTA_SEGURADA` com texto de "senha errada" no formulário de ativação) é **inalcançável hoje**: `MfaService.ativar` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts:75-89`) não passa pelo contador de tentativas e nunca lança esse código, e em `/mfa` o `Mfa.tsx:53` intercepta antes de renderizar. Não vale mexer no catálogo agora.

```
VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum
Recomendações:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.test.ts:47 — a varredura não enxerga
  utilitária com segmento intermediário: `ring-offset-slate-50` ou `outline-offset-*` não casam,
  porque `offset` não é família nem propriedade. Nada usa hoje; no dia em que usar, a regressão
  volta a ser silenciosa. Acrescentar `ring-offset` (e `outline-offset`) à lista fecha.
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.css:21 — `--color-slate-100` entrou
  depois de `slate-900`, fora da ordem numérica do resto do bloco. Ordenar é o que faz "falta uma
  cor" ser visível a olho.
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts:174 — `convitePendente()`
  continua sendo export de produção com consumidor só em teste, e redundante: `etapas-do-login.test.ts:204`
  e `:209` já provam o bilhete pelo corpo do pedido, que é o comportamento observável de verdade;
  a linha 232 sairia com mais um login sem bilhete. Dá para apagar a função sem perder asserção.
- Falta a 2ª rodada do `frontend-reviewer`, que é quem reprovou, antes do commit. O hook cobra;
  registro só para não passar batido.
```

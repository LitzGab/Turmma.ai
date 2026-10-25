# Achados das revisões — `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-25 18:41:41 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

```
VEREDITO: APROVADO
Tabelas verificadas: nenhuma tabela nova nem migration (o diff não toca apps/api nem packages). A coluna usuario.introducao_vista_em, da 1.0, só é lida pelo fixture e2e (e2e/__fixtures__/sessao.ts:320, select por id com parâmetro $1) e gravada por ele (sessao.ts:688, insert com escola_id preenchido).
Queries verificadas: o único caminho de dados novo no cliente é POST /v1/eu/introducao com corpo vazio (apps/web/src/api/eu.ts:15-16, chamado por apps/web/src/componentes/introducao/use-introducao.ts). A escola e a pessoa vêm da sessão, e nenhum escolaId vai no corpo nem na query. As falas e "Onde fica cada coisa" (NAVEGACAO.professor) são texto fixo, sem leitura de dado de outra escola. O GET /v1/eu é a mesma rota da 1.0, sem parâmetro.
Teste de isolamento: presente e efetivo. Esta tarefa não cria repository nem endpoint, e o isolamento da data é da 1.0, como a própria tarefa diz. O e2e/professor-introducao.spec.ts cobre o caso de duas escolas (troca de A para B pelo seletor) e o recomeço da tela (a professora seguinte no mesmo computador começa do passo 1, sem nada do cache da anterior).
Bloqueantes: nenhum
Recomendações:
- e2e/professor-introducao.spec.ts:155: o comentário "com a data de A emprestada" diz que a data vista vale para a conta, entre escolas. É o comportamento da 1.0 e não expõe dado de B, mas vale deixar escrito em techspec §5 que a data é da conta (ou explicar por que vale entre escolas), para a retro não confundir isso com escopo da escola.
- e2e/__fixtures__/sessao.ts:106, 124 e 688: o SQL monta `${introducaoVistaEm(...)}` dentro do texto da query. O valor vem de um enum fixo e é só de teste, mas um terceiro parâmetro ($n) segue o padrão do resto do fixture.
```

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 18:41:53 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

VEREDITO: APROVADO

Tela vista: sim (10 fotos lidas, cheia e vazia). As 8 enviadas cobrem os passos 1 e 4, no computador e no celular. Tirei mais 2 do passo 3, nos dois tamanhos. Todas estão em modo "revendo" (com "Fechar"). O modo "Pular" da primeira vez não foi fotografado: conferi pelo código (`Introducao.tsx`, `use-introducao.ts`) e pelo e2e. Não li o código dos testes de unidade e de componente (`BemVindo.test.tsx`, `textos-da-introducao.test.ts`, `RegiaoQueRola.test.tsx`), e não rodei nenhum teste. A leitura do e2e `professor-introducao.spec.ts` só vai até a linha 300.

Estados: ok
- Carregando mostra a fala do passo 1 e o "Sair", sem "Fechar" nem "Pular", e anuncia "Carregando…" (`BemVindo.tsx:100-110`).
- Erro usa `EstadoErro` com "Tentar de novo", "Voltar para a abertura" e o "Sair" da moldura (`BemVindo.tsx:82-98`).
- Data desconhecida vale como primeira vez (`use-introducao.ts:41`).
- Com dado, aparecem os 4 passos.
- Vazio não se aplica: é uma tela de foco com texto fixo. As fotos da escola vazia são idênticas às da cheia, e nada fica em branco.

Acessibilidade: ok
- O foco visível aparece na fala (`h1`), que recebe o foco a cada passo.
- A região que rola tem `role="region"`, nome e `tabIndex=0`, então o teclado a alcança.
- Enter continua, Esc fecha só revendo, e o Enter não age quando o foco está em botão ou campo.
- O e2e roda `violacoesGraves` no último passo a 360 px.
- A faixa "Role para ler mais" é `aria-hidden`, mas a região rolável tem nome e o teclado a alcança.

Chromebook fraco: ok
- Só o miolo rola, e "Continuar" fica à vista a 1366 × 768. A vitrine confirmou que nenhuma tela rola.
- A tela vem em `lazy()` no chunk do professor.
- Não há lista longa nem imagem. Os 4 itens de "Onde fica cada coisa" saem de `NAVEGACAO.professor`.
- O throttling de rede e de CPU não consta dos arquivos desta tarefa. Para uma tela estática de texto, não bloqueia.

Celular: ok
- Nas fotos a 360 px não há rolagem lateral nem texto cortado. A fala longa do passo 3 quebra em 4 linhas, sem estourar o bloco.
- "Fechar", "Sair", "Continuar" e "Pular" medem cerca de 44 px de altura e têm a mesma classe (`Introducao.tsx`).
- O e2e a 360 × 640 confere em cada passo a largura excedente, o alvo mínimo de 44 px e a igualdade de "Pular" e "Continuar".
- Não há hover, atalho obrigatório nem dependência de telefone.
- "Rever a introdução" fica no menu da pessoa e, no celular, na gaveta.

Ação oficial protegida: sim. A tela não tem ação oficial. "Concluir" e "Pular" só gravam a data de visualização, e "Sair" não grava.

Regra 70 e pele:
- A saída de IA tem a marca: "Assistente de ensino" com o selo "IA" em todos os passos fotografados.
- Os textos dizem que a IA prepara e o professor aprova, e que só o Tutor chega ao aluno sem aprovação, uma resposta por vez (D47).
- Dizem que a IA não corrige redação nem discursiva (D55) e que usar ou não a ferramenta não gera número sobre o professor (D64).
- Nada de ranking nem de promessa afetiva (D58).
- A paleta, os botões e o balão seguem a pele X4 do aluno. A lógica comum foi extraída para `useIntroducao`, `Linhas` e `RegiaoQueRola`, sem copiar.
- Português do Brasil, sem termo técnico nem texto em inglês.

Bloqueantes: nenhum

Recomendações:
1. `apps/web/src/areas/professor/introducao/BemVindo.tsx:51`, passo 4. O miolo mede `34dvh` e só mostra as duas linhas e o título "Onde fica cada coisa", cortado pela faixa. A 1366 × 768 (`professora--professor-bem-vindo--button-name-Continuar-button-name-Continuar-button-name-Continuar--computador.png`) e a 360 px, o professor vê os 4 lugares só se rolar. A faixa "Role para ler mais" avisa, então não bloqueia. Se o PRD admitir, vale subir a altura máxima ou pôr a lista antes das duas linhas, para que o primeiro olhar já mostre a lista.
2. `apps/web/src/areas/professor/introducao/BemVindo.tsx:118`. O último botão continua rotulado "Continuar", embora a tarefa fale em "Começar" e leve ao primeiro lugar do professor. A Tech Spec (seção 9) trata "Continuar" como o "Começar", então fica só como observação de texto.
3. `apps/web/src/areas/professor/introducao/textos-da-introducao.ts:86`. A descrição "Criados" ("O que você já criou, para rever e aprovar") está correta. Quando a 11.0 mexer na navegação, o teste dos textos já reprova lugar sem descrição, o que é bom.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 18:41:54 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só mexe no frontend: a tela de introdução do professor, um item no menu da pessoa, o desvio da primeira entrada em `Inicio.tsx` e os testes e2e. Não mexe em API, fila, IA nem migration.
Rate limit: ok. A tarefa não cria rota nem limite. A primeira entrada de cada professor faz um único `POST /v1/eu/introducao`, uma vez na vida da conta, e isso não pesa na rajada das 7h30.
Fila e prioridade: ok. A tarefa não cria job.
Concorrência: protegida. No cliente, `jaGravou` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/use-introducao.ts:44` faz o segundo clique não disparar outro POST, e há teste para isso. No banco, a gravação é atômica e já existia antes desta tarefa (1.0): `coalesce(introducao_vista_em, now())` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/src/sessao/eu/eu.repository.ts:55`. Duas abas ou duas instâncias ficam com a primeira data e não há "busca, verifica, grava".
Índice e paginação: ok. A tarefa não cria query. A lista "onde fica cada coisa" sai de `NAVEGACAO.professor`, que é fixa no código.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. Não entra código novo no caminho quente da API nem alerta novo.
Bloqueantes: nenhum.
Recomendações:
- O comentário de `aoRever` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/use-introducao.ts:12` diz "de onde a pessoa veio". O professor passa o primeiro lugar dele nos dois destinos. Vale ajustar o texto para "o destino de quem revê" e não induzir a 11.0 a erro.
- `useIntroducao` agora atende dois papéis e logo três (11.0). Se a 11.0 mudar o `staleTime` ou o `refetchOnWindowFocus` da leitura de `['eu']`, a mudança vale para todos. Convém dizer isso no texto da 11.0.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 18:42:10 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: só `usuario.introducao_vista_em`, que já existia (tarefa 1.0). A tarefa lê esse campo pelo `GET /v1/eu`, que devolve a data só à própria pessoa, e grava pelo `POST` de conclusão. Não há migration, rota de API nem DTO novo: a mudança fica no frontend e nos e2e.

Fora da tabela de dados do docs/lgpd.md: nada. O campo está mapeado em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/docs/lgpd.md:105`, com finalidade, base legal e retenção, e com a trava de nunca virar indicador de adoção (D64). A tarefa não cria tela, painel nem lista de "quem não viu a introdução".

Autorização por objeto: ok. A tela não recebe id de pessoa pela URL (`/professor/bem-vindo`). O que ela lê e grava é da pessoa autenticada, com o escopo do contexto, no repository da 1.0. Trocar o id na URL não alcança ninguém, porque não há id na URL.

Logs: limpos. `use-introducao.ts`, `RegiaoQueRola.tsx`, `Linhas.tsx`, a `BemVindo` do professor, os textos e o e2e novo não têm nenhum `console` nem `logger`.

Auditoria: não se aplica. Gravar a data da introdução vista não é leitura de dado de aluno por coordenação ou rede, nem exportação, nem nota, nem permissão, nem aprovação de saída de IA.

Envio externo: nenhum. As falas do "Assistente de ensino" são texto fixo em `textos-da-introducao.ts`, sem chamada a modelo.

Seed/fixture: sintético. O e2e usa os helpers de sempre (`criarEquipeComSenha`, `criarConviteDeProfessor`, `criarUsuarioEmOutraEscola`), que criam escola sintética e e-mail `@educa.invalid`. A opção nova `introducao` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/sessao.ts:59-62` monta o SQL só com valores fixos (`null` ou `now()`), sem texto vindo de fora.

Pergunta de fechamento: a resposta à secretaria não muda. O único dado envolvido é a data, que já sai no arquivo do titular pela regra da 1.0 (na versão `coordenacao`, só a do aluno). Nada é enviado para fora.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/professor/introducao/textos-da-introducao.ts:507`: a frase "A conversa que você tem comigo não aparece para a coordenação." é uma promessa feita ao titular. Ela vale hoje pela regra 70, item 8, com o teste em `apps/api/src/assistente/assistente.int.test.ts`. Vale citar esse teste no comentário do arquivo de textos, para que quem um dia mudar a visibilidade da conversa saiba que a frase da introdução precisa mudar junto. A conferência do texto em si é do `conformidade-reviewer`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/sessao.ts:320-325`: `introducaoVistaEmDoUsuario` consulta por `id` sem `escola_id`. Como é helper de teste com UUID, não vaza nada. Se um dia ele for copiado para código de produção, a ausência de escopo vira furo da regra 10; um comentário de "só teste" deixa isso explícito.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 18:42:24 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A introdução só grava `usuario.introducao_vista_em` (pelo `concluirIntroducao`, chamado em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/use-introducao.ts:242-253`). Nos fixtures e2e, `sessao.ts` muda só a coluna `introducao_vista_em` do `insert into usuario` e acrescenta uma leitura dela. Nenhum job, seed, importação ou webhook novo. Todos com autor humano? Sim, porque não há caminho de escrita em Nota.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. A tarefa não cria saída de IA que chegue ao aluno. O texto ao professor diz o que vale hoje: a entrega nasce pendente, só o Tutor fica fora da aprovação uma a uma (D47) e, na objetiva, o resultado só vale depois da aprovação dele.

Supervisão do tutor: ok. Nada no código muda. O passo 2 diz ao professor que ele vê o uso do Tutor, "onde a turma travou e qual dúvida se repetiu". É dificuldade de aprendizagem, sem inferir emoção nem comportamento (regra 70, item 7).

Autonomia declarada e visível: sim, sem mudança na tela da coordenação. A introdução diz em português comum o que o Assistente faz sozinho e o que espera o professor. Quem fala é a função "Assistente de ensino", com a onça e o selo; o passo 1 diz "Eu sou um programa e posso errar" (D58). `textos-da-introducao.test.ts` reprova falas em que o Assistente se diz pessoa, promete voltar ou fala de vínculo.

Demais pontos:
- **D55:** o passo 3 só oferece rubrica e organização do lote, e "a correção é sua". O teste reprova "rascunho", "pré-correção", "sugestão", "nota" e "conceito" nesse passo.
- **D45 e D64:** nenhum ranking nem meta de uso. Pelo código da governança, o nominal da coordenação passa por auditoria e não traz adoção nem uso por professor. A frase "A conversa que você tem comigo não aparece para a coordenação" bate com o item 8.
- **D59:** em todo passo, "Pular" e "Continuar" têm a mesma classe e "Sair" está à vista. Nenhum dos quatro passos é obrigatório, e o e2e mede os botões a 360 px.
- **Fotos da tela:** o prompt não trouxe fotos. A conferência visual ficou pelo código e pelos testes.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/professor/introducao/textos-da-introducao.ts:45`: a frase "Nada chega à turma sem a sua aprovação." é absoluta. O passo 2 lembra a exceção do Tutor (D47), mas quem pula no passo 1 só lê essa frase. Sugiro "Nada do que eu preparo chega à turma sem a sua aprovação." Hoje o teste só confere `/aprova/`, então a mudança não o quebra.
2. `textos-da-introducao.ts:37` e `:66`: "não gera número sobre você" cumpre a D64 (escolher não usar não vira indicador). A D45, porém, dá ao professor o próprio painel de uso. Quando esse painel existir, a fala fica imprecisa. Vale levar ao PRD um texto como "não vira número para a coordenação nem cobrança", ou registrar que a fala deve ser revista quando o painel do professor entrar.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts:65-68`: nenhum caso confere a linha "Do Tutor você vê o uso: onde a turma travou e qual dúvida se repetiu.". Apagá-la não deixa nenhum teste vermelho. Falta uma asserção e a mutação correspondente.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-25 18:43:24 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz:** a professora vem do convite, cai em `/professor/bem-vindo`, passa pelos quatro passos e "Começar" a leva ao primeiro lugar.
- **Bordas:**
  - "Pular" no passo 1.
  - Rever pelo menu da pessoa.
  - Professora em duas escolas (concluída em A, a troca para B não reabre).
  - Outra professora no mesmo computador, sem recarregar.
  - Gravação que falha (ela segue mesmo assim).
  - Releitura do `/v1/eu` que falha com os passos já na tela.
  - Data nula vale primeira vez.
  - 360 px.
  - 1366 × 768: o último passo, com "Onde fica cada coisa", cabe na tela (RF20).
- **Permissão:** "Sair" no meio e no erro não grava; quem revê não grava em nenhum caminho ("Fechar", Esc, último "Continuar").
- **Concorrência:** duplo clique no último "Continuar" faz um POST só. A concorrência no servidor é da 1.0.
- **Isolamento:** da 1.0, como a tarefa declara.

**Cobertos:**
- **Textos (RF15) e falas (4a, D58):** `textos-da-introducao.test.ts`, com as listas proibidas provadas contra exemplos e a cópia das falas do e2e conferida contra os passos.
- **Onde fica cada coisa:** `BemVindo.test.tsx`, caso "onde fica cada coisa só aparece no último passo...", e o teste dos textos que casa `DESCRICAO_DO_LUGAR` com a navegação.
- **Quatro estados:** casos de carregando, erro, "uma releitura... não tira os passos" e "data nula é a primeira vez".
- **Botões iguais:** caso "Pular e Continuar têm a mesma classe em todo passo".
- **Pular:** caso "Pular no passo 1 grava a data..." no componente, mais o e2e "Pular no passo 1 grava a data" e `Inicio.test.tsx` › "o professor que já viu a introdução abre em Início".
- **Sair no meio:** componente e e2e.
- **Rever:** e2e "rever pelo menu da pessoa", mais o `it.each` de "Fechar" nos passos 1 a 4, o Esc e o último "Continuar" de quem revê.
- **Duas escolas, recomeço da tela, primeira entrada pelo convite e 360 px:** os casos de `e2e/professor-introducao.spec.ts`.
- **Duplo clique:** `dblClick` com o POST preso no ar até o fim do caso. É a corrida real do cliente, não dois cliques em sequência.
- **Menu da pessoa:** `navegacao.test.ts` (X4).
- **Mutações:** cada cláusula nova com condição tem bloco: `use-introducao`, `BemVindo`, `RegiaoQueRola`, `textos`, `Inicio`, `navegacao` e `rotas`. A refatoração da `BemVindo` do aluno é coberta pela mutação de `aoRever` contra o teste do aluno.
- **Higiene:** nenhum `.skip`, nenhum teste comentado e nenhum mock de peça nossa. A rede é falsa; o `ResizeObserver` é falso só no teste da região.
- **Execução:** os 8 arquivos de unidade e componente afetados passam (137 testes).

**Bloqueantes:**

1. **RF20 sem teste no último passo do professor** (`apps/web/src/areas/professor/introducao/BemVindo.tsx:51-54`, `e2e/professor-introducao.spec.ts:74-95` e `:178-200`).
   - **O problema:** a segunda divergência da tarefa diz que o último passo media 917 px a 1366 × 768 e rolava a página, e que por isso ganhou a `RegiaoQueRola`. Nenhum teste prova que esse passo agora cabe.
   - **Por que nada fica vermelho:** se `<RegiaoQueRola nome="Leia até o fim" …>` virar um fragmento, tudo continua verde:
     - O teste de componente procura só a região "Onde fica cada coisa", que é a `section` interna, e não "Leia até o fim".
     - O e2e "os quatro passos" clica "Continuar" com `acionar`, e o clique do Playwright rola sozinho.
     - O e2e de 360 px chama `scrollIntoViewIfNeeded()` antes do `toBeInViewport()`.
     - O `TelaDeFoco` não tem rodapé fixo (`footer` em fluxo normal), então nada segura o botão à vista.
   - **Correção exigida:**
     - No e2e, no projeto `chromebook` (1366 × 768), chegar ao passo 4 e, **sem rolar**, conferir:
       - `expect(continuar(page)).toBeInViewport()` e `expect(pular(page)).toBeInViewport()`;
       - que a região "Leia até o fim" existe;
       - a sobra de altura da página, como em `paginaNaoRola` (`e2e/__fixtures__/coordenacao.ts:95`), sem medir com a tela ainda carregando.
     - Declarar o bloco ` ```mutacao ` que troca a `RegiaoQueRola` do último passo por `<>…</>`, citando esse caso.

**Recomendações:**
- **Pular e a entrada seguinte** (`e2e/professor-introducao.spec.ts:97-115`): a linha "pular" da tabela diz "a entrada seguinte não volta", e o e2e só confere a data no banco, deixando o resto para `Inicio.test.tsx` e para a 1.0. Um `page.goto('/')` depois do pulo, esperando "Início", fecha a cadeia no navegador.
- **Duas escolas** (`e2e/professor-introducao.spec.ts:141-158`): o caso passa se o cache `['eu']` da escola A sobrar depois da troca. Vale conferir também que a resposta do `GET /v1/eu` de B traz a data, para o caso não depender da ordem entre o cache e a releitura.
- **"Sai de `NAVEGACAO.professor`"** (`BemVindo.test.tsx:194-210`): o caso compara a lista com a própria `NAVEGACAO.professor`, então uma lista fixa com os mesmos quatro itens também passaria. A mutação `.slice(1)` mostra que o código lê a navegação, mas o caso não. Basta registrar a limitação, sem precisar de mock.
- **Revendo a 360 px:** o "Fechar" não tem medida de 44 px nessa largura. O caso de 360 px só cobre o modo primeira vez.
- **Comentário desatualizado** em `apps/web/src/componentes/introducao/use-introducao.ts:12`: o `aoRever` diz "de onde a pessoa veio", mas para o professor o destino é o primeiro lugar dele (a terceira divergência da tarefa).

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 18:43:33 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

O que conferi:
- **Subtarefas 10.1 a 10.3.** Estão feitas: as quatro falas palavra por palavra, os passos 1 a 4 que se pulam, a lista "Onde fica cada coisa" lida de `NAVEGACAO.professor`, a entrada na tabela de `Inicio.tsx` e "Rever a introdução" antes do "Sair". A tarefa não toca o que fica fora do escopo dela: turma, padrões da prova e a introdução da coordenação (11.0). O `useIntroducao` foi feito para servir aos três papéis, mas nenhum código da coordenação entrou.
- **Divergências.** As três estão na `techspec.md`: §9, "Peças novas" (`Linhas`, `RegiaoQueRola`, `useIntroducao`), e §5, "Rever" (o professor vai ao primeiro lugar dele). Esta spec não tem `cenarios.md`.
- **Regra 70 (itens 3, 4a, 8, 9; D47, D55, D64).** O texto bate com `docs/agentes.md`: o Assistente corrige a objetiva e a nota espera o professor. Também não há nenhuma oferta de rascunho ou de nota na discursiva.
- **Onça.** `areas/professor/introducao/BemVindo.tsx` já estava admitido na lista fechada de quem pode importar a onça (`avatar-so-nas-duas-pecas.test.ts:25`).

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md` (tabela de divergências): a subtarefa 10.1 diz "Começar", e o último "Continuar" faz esse papel. Na `techspec.md` §9 (linha 189) essa convenção está escrita só para o aluno. Vale uma linha na tabela, ou estender a frase da §9 ao professor, para não depender de leitura implícita na 11.0.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/professor/introducao/BemVindo.tsx:69-96`: os estados de erro e de carregando são cópia dos do aluno (`areas/aluno/introducao/BemVindo.tsx:85-111`). Só mudam o destino, o agente e a fala. A 11.0 vai copiar uma terceira vez, que é o mesmo motivo que levou a extrair o `useIntroducao`. Dá para extrair uma peça comum dos dois estados.
3. `BemVindo.tsx:47-60`: o fragmento `<>…</>` em volta de um único ternário em `conteudoDoPasso` não serve para nada.
4. `BemVindo.tsx:51`: o nome da região, "Leia até o fim", é uma instrução e não diz o que a região contém (no aluno é "Aviso de privacidade"). A decisão final é do `frontend-reviewer`.
5. `BemVindo.tsx:22`: o `?? ROTAS.novaConversa` nunca é usado, porque `NAVEGACAO.professor` nunca está vazia. Pode sair, ou trocar por uma asserção.

Arquivos lidos por completo:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/professor/introducao/BemVindo.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/professor/introducao/textos-da-introducao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/use-introducao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/RegiaoQueRola.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/professor-introducao.spec.ts`

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-25 19:07:08 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

VEREDITO: APROVADO
Tela vista: sim (8 fotos lidas: passos 1 e 4, computador e celular, escola cheia e vazia)
Estados: ok. Carregando (fala do passo 1, "Sair", `role="status"`), erro (`EstadoErro` com "Tentar de novo" e "Voltar para a abertura", `BemVindo.tsx:78-94`) e com dado (os quatro passos) estão no código. Esses dois primeiros não aparecem na vitrine. O estado vazio não se aplica: a introdução não lista dado, e a foto da escola vazia é igual à da cheia.
Acessibilidade: ok. A fala é o `h1` e recebe o foco a cada passo (o foco visível aparece na foto, em azul). A região que rola tem nome ("Leia até o fim") e a lista tem `aria-labelledby`. O contraste do texto é bom. O e2e roda `violacoesGraves` no último passo.
Chromebook fraco: ok. A 1366 × 768 nenhuma tela rola. No passo 4 só o miolo rola, e a faixa "Role para ler mais" avisa. O e2e novo confere `paginaNaoRola`, e "Continuar" e "Pular" ficam à vista sem rolar. Não há lista longa nem upload.
Celular: ok. A 360 px não vi rolagem horizontal nem texto cortado. "Fechar", "Sair" e "Continuar" têm cerca de 44 px de altura ou mais. O e2e novo mede o "Fechar" a 360 px em cada passo, com largura excedente igual a 0. Não há hover nem atalho obrigatório, e nenhum fluxo exige o celular. No passo 4 a lista "Onde fica cada coisa" só aparece cortada, atrás da faixa "Role para ler mais". O texto de rolar está à vista, e o e2e confere a lista inteira.
Ação oficial protegida: sim. A tela não executa ação oficial. Ela só grava a data em que a introdução foi vista. O passo 1 agora diz "Nada do que eu preparo chega à turma sem a sua aprovação" (o texto antigo ia além do que o produto faz), e o passo 2 diz que só a resposta do Tutor chega ao aluno sem aprovação. A saída de IA leva a marca (selo "IA" e a função "Assistente de ensino" embaixo da onça).

Confirmei as correções desta rodada no diff (`10_task-diff-r1-r2.patch`) e no código:
- `BemVindo.tsx:47-56`: o último passo usa `RegiaoQueRola`, e os outros passos não mudam.
- `textos-da-introducao.ts:50,57`: as frases do passo 1 e do passo 2 estão ajustadas, com teste.
- O e2e ganhou a checagem de que a página não rola a 1366 px e o caso de "Fechar" a 360 px.
- O caso da troca de escola agora confere a resposta de `/v1/eu` da escola B.
- O comentário que marca o uso do banco sem `escola_id` como só de teste está em `e2e/__fixtures__/sessao.ts`.

Bloqueantes: nenhum.

Recomendações:
- `textos-da-introducao.ts:42,71`: "Usar ou não esta ferramenta não gera número sobre você" deixa de ser verdade quando o painel do próprio professor (D45) entrar. A pendência já está registrada em `TODO.md`. Mantenha o prazo amarrado à tarefa do painel.
- `BemVindo.tsx:51`: o nome "Leia até o fim" é uma instrução, e não diz o que a região contém. Foi recusado antes, e não bloqueia.
- O `test-engineer` reprovou a 1ª rodada, segundo a tabela de revisões do documento da tarefa. As correções desta rodada parecem responder a isso, mas o hook precisa ter um APROVADO dele para o código atual antes do commit. Isso está fora do meu escopo.
- A foto do passo 4 a 1366 px mostra "Continuar" com fundo cinza claro. Parece o estado de hover do último clique do script da vitrine, e não um botão desabilitado. O código não indica desabilitação.

Os dois modos da introdução (revendo, com "Fechar", e primeira vez, com "Pular") não foram fotografados juntos. A foto mostra o modo revendo, como o prompt avisou. O "Pular" da primeira vez está coberto pelo e2e (mesmo tamanho de "Continuar") e pelo código.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-25 19:07:19 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum neste diff. A rodada só mexe em texto de interface, testes, e2e e documentação. Todos com autor humano? Sim, porque nenhum caminho de escrita foi criado nem alterado.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. A frase do passo 1 virou "Nada do que eu preparo chega à turma sem a sua aprovação.". A versão anterior, "Nada chega...", era absoluta e desmentia a exceção do Tutor (D47). A frase nova bate com a regra 70, item 3, e o teste novo em `textos-da-introducao.test.ts` a fixa. A exceção do Tutor continua só no passo 2.
Supervisão do tutor: ok. A linha nova do passo 2, "Do Tutor você vê o uso: onde a turma travou e qual dúvida se repetiu.", fala de uso e de dificuldade de aprendizagem, não de comportamento (regra 70, item 7). O código cumpre o que ela promete: os sinais `travou` e `duvida_repetida` existem em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/src/tutor/sinais-do-turno.ts:35`.
Autonomia declarada e visível: sim. O diff não toca nisso.

O que mais conferi no diff:
- **D55 (discursiva e redação):** o passo 3 não mudou. A IA não corrige redação nem discursiva e não sugere nota. Nenhum campo novo sugere nota.
- **D45, D64 e regra 70, item 8:** o passo 4 continua dizendo que a conversa do professor com o chat não aparece para a coordenação. A minha recomendação da 1ª rodada foi atendida com uma linha nova em `TODO.md`: rever a fala "não gera número sobre você" quando o painel do próprio professor entrar. O cabeçalho de `textos-da-introducao.ts` (linhas 14 a 17) agora liga as duas promessas ao professor aos testes de API que as garantem.
- **D59:** "Pular" continua com o mesmo tamanho de "Continuar". O teste de tamanho foi movido para o laço de cada passo e passou a medir também a largura. Revendo a 360 px, o "Fechar" aparece em todo passo com 44 px. Sair não ficou mais difícil que entrar.
- **Introdução vista uma vez:** o e2e de "Pular" agora confere que a data foi gravada e que a entrada seguinte não desvia de novo para a introdução. Isso não toca a regra 70.
- **Fixture `introducaoVistaEmDoUsuario`:** é leitura sem escopo de escola, só de teste. Está marcada como tal em `e2e/__fixtures__/sessao.ts:322-326`. Isso não toca a regra 70; o escopo é do `tenancy-guardian`.

Bloqueantes: nenhum

Recomendações:
- A mutação nova do passo 2, que tira a linha "Do Tutor você vê o uso", prova que o texto está na tela. Não prova que a tela do professor mostra esses sinais. Se a promessa vale pelo código, um teste de API ou de tela do professor citado no cabeçalho deixaria a ligação verificável. Hoje o cabeçalho cita `apps/api/src/tutor/tutor.int.test.ts`; vale conferir se ele cobre `travou` e `duvida_repetida` vistos pelo professor, e não só criados.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/ordens/10_task-diff-r1-r2.patch
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/professor/introducao/textos-da-introducao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/src/tutor/sinais-do-turno.ts

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-25 19:07:30 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

```
VEREDITO: APROVADO
Tabelas verificadas: nenhuma nova nem alterada. O diff r1→r2 e o worktree não mexem em apps/api nem em packages/, e não há migration.
Queries verificadas: e2e/__fixtures__/sessao.ts:122-129 (introducaoVistaEmDoUsuario). É leitura direta do banco, só de teste, por id UUID criado pelo próprio teste, e não alcança código de produção. O único efeito do diff foi documentar que ela não tem escola_id. Também verifiquei o novo uso de GET /v1/eu em e2e/professor-introducao.spec.ts:183-190. O teste só lê a resposta da escola B depois da troca. Não manda escolaId pelo corpo nem pela query string.
Teste de isolamento: presente e efetivo. O caso das duas escolas (e2e/professor-introducao.spec.ts:156-191) agora prova que a raiz abriu a partir da resposta de /v1/eu de B, e não do cache ['eu'] que sobrou de A. Se a troca de escola não limpasse ou relesse o cache, o waitForResponse não se resolveria e o teste quebraria.
Bloqueantes: nenhum
Recomendações:
- e2e/__fixtures__/sessao.ts:122-126: além do comentário, vale uma guarda que impeça importar e2e/__fixtures__ fora de e2e/. Hoje o "não se copia para fora de e2e/" depende só de disciplina.
```

A rodada anterior não exigiu nenhuma correção, então não havia o que conferir. Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/ordens/10_task-diff-r1-r2.patch
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/professor-introducao.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/sessao.ts

## revisor-geral · 2ª rodada · APROVADO · 2026-10-25 19:07:31 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/professor/introducao/BemVindo.test.tsx:205` — o comentário novo admite que este caso não prova que a lista vem de `NAVEGACAO.professor`: uma lista fixa com os mesmos itens também passaria. A prova fica só para a mutação `.slice(1)` do documento da tarefa. Um caso que monte a navegação com outros itens e confira a lista daria essa prova na própria suíte. Fica para o `test-engineer` decidir.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/use-introducao.ts:112` — o comentário de `aoRever` explica o destino de cada papel, mas isso é decisão de quem chama a função. Basta registrá-la no lugar de cada papel, e o comentário da interface fica genérico.

Nesta segunda rodada audito só o que mudou desde a primeira, que tinha aprovado sem exigir correção. Todas as mudanças estão dentro da tarefa 10.0:
- **`BemVindo.tsx`**: o último passo foi reescrito com um retorno antecipado, e o comportamento não mudou. As mutações do `10_task.md` foram atualizadas para o código novo, e entrou uma que tira a região que rola, conferida pelo e2e do último passo.
- **Passo 1** (`textos-da-introducao.ts`): a frase agora diz "Nada do que eu preparo chega à turma sem a sua aprovação". A anterior prometia que nada chegava à turma, e a resposta do Tutor chega. O texto antigo não está em nenhum outro lugar da spec, e as frases do passo 1 não estavam fixadas ao pé da letra na tarefa, então não há divergência escondida.
- **Divergência nova** (o último "Continuar" é o "Começar"): está no `10_task.md` e também na `techspec.md` §9.
- **e2e**:
  - O caso do RF20 a 1366 × 768 usa a `paginaNaoRola`, que já existia em `e2e/__fixtures__/coordenacao.ts` e espera o fim do "Carregando".
  - A conferência do mesmo tamanho de "Pular" e "Continuar" saiu do caso do "Pular" e foi para o caso dos 360 px, agora com a largura também.
  - Entrou um caso do "Fechar" com 44 px a 360 px quando a pessoa revê a introdução.
  - O caso das duas escolas agora confere a resposta do `/v1/eu` de B, e não o cache de A.
- **`e2e/__fixtures__/sessao.ts`**: o comentário diz que a leitura sem `escola_id` é só de teste.
- **`TODO.md`**: a linha nova cuida da recomendação do `conformidade-reviewer` sobre a fala do passo 4.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-25 19:07:36 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. O diff só lê `usuario.introducao_vista_em`, que já existe: no e2e, pelo `GET /v1/eu` da própria pessoa e pela consulta de teste em `e2e/__fixtures__/sessao.ts`. A coluna já está no mapa de dados, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/docs/lgpd.md:105`, com finalidade, base e retenção, e com a proibição de virar indicador de adoção (D64).

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. O diff não traz rota nem consulta de produção nova. O caso novo de duas escolas em `e2e/professor-introducao.spec.ts` só olha `introducaoVistaEm` na resposta de `/v1/eu` da própria professora em B. A consulta por `id` sem `escola_id` em `introducaoVistaEmDoUsuario` agora tem um comentário dizendo que é só de teste e não se copia para fora de `e2e/`.

Logs: limpos. O diff não acrescenta nenhum log.

Auditoria: nada a exigir. Nenhuma ação do diff cai nas que pedem auditoria (leitura de aluno por coordenação ou rede, exportação, nota, permissão, aprovação de saída de IA). Gravar a data da introdução continua como a 1ª rodada aprovou.

Envio externo: nenhum.

Seed/fixture: sintético ("Professora sintética na outra escola", contas criadas pelo próprio teste).

Textos mostrados ao professor (conferi porque são promessas sobre dado):
- "Nada do que eu preparo chega à turma sem a sua aprovação" deixou de ser absoluta e não contradiz a exceção do Tutor (D47), dita no passo 2.
- "Do Tutor você vê o uso: onde a turma travou e qual dúvida se repetiu" fala de uso e dificuldade, não de comportamento (regra 70, item 7).
- "A conversa que você tem comigo não aparece para a coordenação" tem teste que a prova: `apps/api/src/assistente/assistente.int.test.ts:224` ("a colega da mesma escola, a professora de outra escola e a coordenação não leem a conversa de A") e `:216-217` (a coordenação recebe 404 nas duas rotas do Assistente).

Pergunta de fechamento: o diff não mexe no arquivo do titular nem em envio externo. A resposta continua a da 1ª rodada, com a pendência da `lista_nome` e da `reivindicacao` já registrada no `TODO.md`.

Correções exigidas na rodada anterior: nenhuma, nada a conferir.

Bloqueantes: nenhum.

Recomendações:
- A promessa "a conversa não aparece para a coordenação" agora cita o teste que a prova (bloco de comentário de `textos-da-introducao.ts`), mas nenhum teste trava o elo. Vale a revisão lembrar dela sempre que a camada de rede ou um painel da coordenação ganhar leitura do Assistente.
- O item novo do `TODO.md` (rever a fala do passo 4 quando o painel do próprio professor, D45, entrar) está certo. Ao rever, mantenha que o número é só dele e nunca alimenta decisão sobre ele (regra 20, item 10a; regra 70, item 8).

## infra-guardian · 2ª rodada · APROVADO · 2026-10-25 19:07:38 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/professor-introducao.spec.ts`: o novo `page.goto('/')` depois do "Pular" carrega a página de novo e lê o `/v1/eu` mais uma vez. O custo é pequeno e não muda o cenário de carga. Mesmo assim, ele substitui o que antes se provava só pelo banco. Convém manter os dois e não tirar o `introducaoVistaEmDoUsuario` numa limpeza futura.
- A recomendação da 1ª rodada (dizer na 11.0 que mudar `staleTime` ou `refetchOnWindowFocus` de `['eu']` vale para os três papéis) foi para `11_task.md`. É lá que ela precisa ser conferida.

Nesta rodada não mudou nada que pese no horário de aula: não há código de backend, rota nova, job, query ou migration. O que mudou foi o texto dos passos, o ajuste no `conteudoDoPasso` (só a forma de escrever, o comportamento é o mesmo), comentários (`use-introducao.ts`, `sessao.ts`) e testes e2e e unitários novos. Nenhum desses testes chama provedor pago.

A gravação da data continua com uma única `useMutation` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/use-introducao.ts`, e o e2e confere que sai uma só gravação. A leitura `['eu']` continua com `staleTime` de 60 s e `refetchOnWindowFocus: false`. A função `paginaNaoRola`, que o e2e novo importa, existe em `e2e/__fixtures__/coordenacao.ts:95`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 19:07:49 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md`

VEREDITO: APROVADO

**Cenários exigidos (correção da 1ª rodada, RF20):** no computador, a 1366 × 768, ao chegar ao passo 4 do professor e sem rolar nada, o teste precisa conferir:
- que a região "Leia até o fim" existe;
- que "Continuar" e "Pular" estão à vista;
- que a página não sobra em altura, medida só depois de a tela terminar de carregar;
- e o documento precisa declarar o bloco de mutação que troca a `RegiaoQueRola` do último passo por `<>…</>`.

**Cobertos:**
- **Correção 1 feita.** Em `e2e/professor-introducao.spec.ts:88-95`, com largura de 768 px ou mais (o projeto `chromebook`), o teste faz as quatro conferências:
  - a região "Leia até o fim" com `toBeVisible()`;
  - `continuar(page)` e `pular(page)` com `toBeInViewport()`, sem clique nem `scrollIntoViewIfNeeded()` antes;
  - `paginaNaoRola(page)`, que espera "Carregando" e "Verificando" sumirem antes de medir (`e2e/__fixtures__/coordenacao.ts:98`) e confere `scrollHeight - clientHeight <= 0`. Essa medida não depende da posição da rolagem, então um clique do passo 3 que tenha rolado a página não a engana.
- **Bloco de mutação declarado** em `10_task.md`. Ele troca a `RegiaoQueRola` por fragmento e cita "os quatro passos levam ao primeiro lugar". Com a troca, a região some e o caso fica vermelho na própria asserção de RF20, que é a cláusula certa.
- **Mutações novas conferidas contra o código atual:**
  - O passo 1 com "Nada do que eu preparo…" bate com `textos-da-introducao.ts:50`, e o teste compara a frase literal.
  - Tirar a linha "Do Tutor você vê o uso…" (`:57`) deixa o teste do passo 2 vermelho.
  - O `if (true) return <Linhas…>` deixa vermelho "onde fica cada coisa só aparece no último passo".
  - Os blocos antigos foram reescritos para o texto novo.
- **"Pular":** o teste agora faz `page.goto('/')` e confere que a entrada seguinte não volta à introdução. A comparação de tamanho entre "Pular" e "Continuar" (RF16, D59) passou para o caso de 360 px, que agora compara também a largura.
- **Duas escolas:** o teste lê a resposta do `/v1/eu` de B e confere que `introducaoVistaEm` não é nula. Isso prova que a data veio da escola B, e não do cache de A.
- **Caso novo "revendo, a 360 px":** em cada passo, nada rola de lado e o "Fechar" está à vista com pelo menos 44 × 44 px.
- **Unidade:** `npx vitest run src/areas/professor/introducao` passou com 42 de 42. Não há `.skip`, nem mock que esconda a regra, nem chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Ainda não há mutação que prove a medida de altura sozinha. Com o fragmento, o caso fica vermelho já na falta da região, antes de chegar a `paginaNaoRola`. Um segundo bloco, por exemplo `alturaMaxima="max-h-[34dvh]"` trocado por `"max-h-none"` em `apps/web/src/areas/professor/introducao/BemVindo.tsx`, manteria a região e provaria que a sobra de altura (917 px) fica vermelha.
2. Em `e2e/professor-introducao.spec.ts:90`, o teste escolhe o caso pela largura (`>= 768`) e não pelo nome do projeto. É o mesmo corte de `paginaNaoRola`, então vale como está. Só fica registrado que, a 360 px, o RF20 do passo 4 não é conferido, como o RF20 manda.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/professor-introducao.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/coordenacao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/professor/introducao/BemVindo.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/professor/introducao/textos-da-introducao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/10_task.md

# Achados das revisões — `tasks/prd-telas-do-aluno-e-primeiro-acesso/11_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 19:52:42 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/11_task.md`

VEREDITO: APROVADO
Tela vista: sim (16 fotos lidas, 1366 e 360 px, escola cheia e vazia). Cobrem os passos 1 a 4 na escola cheia e os passos 1 e 4 na escola vazia, sempre no modo "rever". A tela de "onde fica cada coisa" só aparece rolando a região do passo 4, e nenhuma foto a mostra. Não conferi a primeira vez, com "Pular" e "Continuar" lado a lado: cobri pelo código e pelo e2e, que mede os dois botões a 360 px.

Estados: ok. Rodei os 98 testes de unidade das pastas tocadas e todos passaram.
- Carregando mostra a fala do passo 1 e o "Sair", sem "Fechar" nem "Pular" (`IntroducaoDoPapel.tsx:62-70`).
- Erro usa `EstadoErro` com "Tentar de novo", "Voltar para a abertura" e o "Sair" da moldura (`IntroducaoDoPapel.tsx:43-60`).
- Data desconhecida vale a primeira vez; com dado, aparecem os passos.
- O `BemVindo.test.tsx` cobre os quatro (linhas 83, 103, 138 e 159). Uma releitura que falha não tira os passos da tela.
- Na foto vazia a introdução não depende de dado da escola e aparece completa; ela não é feed.

Acessibilidade: ok.
- A fala recebe o foco a cada passo e o anel é visível (a caixa azul nas fotos do passo 1).
- Enter continua e Esc fecha só quando se revê.
- A região que rola tem `role="region"`, nome e `tabIndex=0` (`RegiaoQueRola.tsx:48-52`).
- O e2e roda `violacoesGraves` no último passo a 360 px.
- O "Sair" é do mesmo tamanho do "Continuar" e está sempre à vista (D59).
- Texto, contraste e rótulos estão corretos nas fotos, e o nome da onça tem o selo "IA".

Chromebook fraco: ok.
- A tela é pequena e carrega com `lazy()`.
- A lista longa fica dentro de uma região de 34 dvh. A página não rola a 1366 × 768, confirmado pelo `Rolam: nenhuma` e pelo `paginaNaoRola` do e2e.
- Não há upload nem lista virtualizável.

Celular: ok.
- A 360 px não há rolagem lateral nem texto cortado nas fotos.
- "Continuar", "Fechar" e "Sair" têm mais de 44 px de altura.
- Nada depende de hover. O "Continuar" aparece cinza nas fotos do computador porque o mouse ficou sobre ele depois do clique.
- O e2e mede 44 × 44 px e a igualdade de "Pular" e "Continuar" a 360 px, e o projeto `celular` roda o mesmo caso.
- Nenhum fluxo exige o celular.

Ação oficial protegida: sim. A tela só informa e grava a data de visto. Não aprova, publica, exclui nem exporta. As falas ficam fixas em `.ts` com teste (D58), e o e2e prova que a coordenação não vê quem viu a introdução (D64).

Bloqueantes: nenhum.

Recomendações:
1. `textos-da-introducao.ts:33-35`: "Eu ajudo a ler os números de Colégio sintético da vitrine cheia 85be806b." fica estranho com nomes que começam por "Colégio" ou "Escola". A escolha de "de" em vez de "da" está documentada e é aceitável. Uma fala sem artigo, como "os números da escola <nome>", leria melhor.
2. A tela "Onde fica cada coisa", fim da introdução, só aparece depois de rolar as 11 frases do passo 4. A faixa "Role para ler mais" avisa, e isso segue o modelo do professor (RF20). Na validação, vale ver se a coordenadora chega a essa lista. Se não chegar, ela pode virar um passo próprio ou ir antes da lista da IA.
3. Não há foto da primeira vez (com "Pular") nem do passo 4 rolado até o fim. Em validação manual, vale fotografar os dois.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-25 19:52:43 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/11_task.md`

VEREDITO: APROVADO
Tabelas verificadas: nenhuma tabela nova, migration ou alteração de schema nesta tarefa. A coluna `usuario.introducao_vista_em` vem da 1.0. As fixtures de e2e em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/sessao.ts` só escrevem nela por `insert into usuario (escola_id, ...)` com `escola_id` preenchido. O SQL montado por interpolação (`introducaoVistaEm`, linha 62) recebe apenas os literais fixos `null` ou `now()`, de um tipo fechado `'vista' | 'por_ver'`, e nunca texto vindo de fora.
Queries verificadas: nenhum repository, query ou endpoint novo ou alterado. Nada em `apps/api` nem em `packages/` mudou. A web faz duas chamadas, as duas da 1.0. `GET /v1/eu` dá o nome da escola, que vem da sessão. `POST /v1/eu/introducao` vai com corpo `{}` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/api/eu.ts:16`). Nenhum `escolaId` sai do cliente, nem no corpo nem na query. A nova tela `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/coordenacao/introducao/BemVindo.tsx` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/IntroducaoDoPapel.tsx` não leem dado de outra pessoa nem fazem leitura agregada da camada rede. Nenhum `@SemEscopo()` aparece no diff.
Teste de isolamento: presente e efetivo. Esta tarefa não traz superfície nova de leitura entre escolas, e o isolamento do `/v1/eu` e do `/v1/eu/introducao` é da 1.0, como a própria tarefa diz. O caso novo de D64 em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/coordenacao-introducao.spec.ts:118-131` cria um professor que já viu a introdução e outro que não viu. Ele confere que a resposta real de `/v1/professores` traz os dois nomes e não contém "introducao". Se a API passasse a expor o campo, o teste quebraria.
Bloqueantes: nenhum.
Recomendações:
- O caso de D64 só verifica `/v1/professores`. Vale uma linha para o `/v1/eu` da coordenação, conferindo que ele traz só a data da própria pessoa e nenhuma de terceiros. Isso fica para a cobertura da 1.0, se ela ainda não tiver.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 19:52:56 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/11_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (só no desvio da primeira entrada da coordenação, no frontend)
Rate limit: ok (nenhuma rota nova. O `POST` que conclui a introdução e o `GET /v1/eu` são da 1.0, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/api/src/sessao/eu/eu.controller.ts`, e esta tarefa não mexeu neles)
Fila e prioridade: ok (não se aplica, a tarefa não cria job)
Concorrência: protegida (o duplo clique faz um POST só, pela trava `jaGravou` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/use-introducao.ts`. Quem guarda a primeira data no servidor é a 1.0. O e2e confere que sai uma gravação só, tanto em "Continuar" até o fim quanto em "Pular")
Índice e paginação: ok (nenhuma query nova)
Degradação de IA: não se aplica (as falas são texto fixo em `.ts` e nada chama modelo)
Migration: não se aplica
Métrica e alerta: ok (nenhum código novo no servidor. O ponto novo é uma leitura de `/v1/eu` com 60 s de `staleTime` e sem reler ao voltar para a aba. Na vida de cada coordenadora há uma gravação só, ou nenhuma quando ela revê)
Bloqueantes: nenhum
Recomendações:
- O caso "introdução vista" já é coberto pelo cenário de carga de login? Vale conferir: a coordenação passa a cair em `/coordenacao/bem-vindo` uma vez antes do Painel. São poucas pessoas por escola e fora do pico das 10h, por isso não bloqueia.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/use-introducao.ts`: se a gravação falha, a pessoa segue adiante e a introdução volta na entrada seguinte. É o comportamento da spec. O que falta é um contador de falha dessa gravação no cliente, ou a confirmação de que a métrica do servidor da 1.0 já mostra a taxa de erro da rota, para notar quando uma escola inteira passa a ver a introdução de novo.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 19:53:15 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/11_task.md`

VEREDITO: APROVADO

**Caminhos de escrita em Nota:** nenhum. A tarefa só toca a web, as fixtures do e2e (`e2e/__fixtures__/sessao.ts` grava em `conta`, `usuario` e `convite`) e documentos. Não há escrita em `Nota`, então não há o que conferir quanto ao autor humano.

**Decisão autônoma sobre aluno:** ausente. A introdução só grava `introducao_vista_em` e não chama modelo.

**Aprovação registrada:** ok. Não há saída de IA nova. As falas da introdução são texto fixo em `.ts`, com teste, e não são geradas por modelo.

**Supervisão do tutor:** ok. O tutor não muda. A introdução do aluno passou a usar a peça comum `IntroducaoDoPapel` sem mudar comportamento: as falas, o passo obrigatório do aviso de privacidade e os destinos continuam os mesmos.

**Autonomia declarada e visível:** sim. Nas fotos, todo passo mostra a onça com "Analista de desempenho escolar" e o selo "IA". O passo 1 diz "Eu preparo e aviso. Quem aprova é a escola." e "Eu sou um programa e posso errar." O passo 4 mostra a lista `O_QUE_A_IA_NUNCA_FAZ`, a mesma da Governança: decisão sobre aluno, nota em discursiva e redação, emoção, ranking de professor, entre outras.

**Bloqueantes:** nenhum.

**O que conferi na regra e nas fotos:**
- **Itens 2, 5 e 8 e D55:** nenhuma tela sugere nota, conceito ou decisão. A lista do passo 4 aparece na região que rola, a 1366 px e a 360 px, na escola cheia e na vazia.
- **Item 8 e D45:** o passo 2 diz que o desempenho de professores só aparece com dois ou mais no grupo. O teste amarra essa frase a `GRUPO_MINIMO_DE_PROFESSORES === 2`.
- **Item 9 e D64:** a coordenação não fica sabendo quem viu a introdução. O e2e `e2e/coordenacao-introducao.spec.ts:118` prova que `/v1/professores` não traz o campo. Os textos não falam de ranking, meta, adoção nem engajamento, e há teste disso.
- **Itens 4a e 4b, D58 e D59:** nada afirma ser pessoa, promete voltar ou fala de vínculo, e os testes de regex cobrem os três casos. "Pular" e "Continuar" têm a mesma classe, e "Fechar" e "Sair" ficam sempre à vista (fotos). "Sair" no meio não grava, provado em `e2e/coordenacao-introducao.spec.ts:241`.
- **Item 7:** nada mede tempo, navegação ou comportamento. A gravação é a data, uma vez só.

**Recomendações:**
1. **Os textos do passo 3 prometem um pouco mais do que o código faz.** A fala em `apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts:43` e a linha 63 dizem que abrir aluno ou professor pelo nome "pede um motivo". O desempenho nominal (`DadoNominal.tsx`, `desempenho.service.ts:32`) e a lista de alunos pela API (`turma.service.ts:129`) exigem mesmo a finalidade. Mas a lista da turma na tela de Escola é auditada com uma finalidade fixa, sem pedir motivo à coordenadora (`ListaDaTurma.tsx:107`, `turma.lista_lida`). E a lista de professores sai sem finalidade (`ProfessoresDaTurma.tsx:35`). A frase não está errada sobre o indicador, mas a coordenadora pode repeti-la a uma família como garantia geral. Sugiro limitar a frase ao desempenho, por exemplo "Ver o desempenho com nome de aluno ou professor pede um motivo.", ou registrar o caso no `TODO.md`.
2. A linha do passo 2, "Turma, série e disciplina aparecem somadas, sem nome de pessoa." (`textos-da-introducao.ts:57`), vale para o Painel e a Governança, mas não para Escola › Turmas, que lista nomes. Vale a mesma conferência do item 1 quando o texto for revisto.

Os arquivos relevantes estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/`:
- `apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts`
- `apps/web/src/areas/coordenacao/introducao/BemVindo.tsx`
- `apps/web/src/componentes/introducao/IntroducaoDoPapel.tsx`
- `e2e/coordenacao-introducao.spec.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 19:53:20 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/11_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A tela usa dois dados que já existiam:
- `escola.nome`, que vem do `/v1/eu` (`packages/shared/src/sessao/eu.ts:25`). É o nome da escola da própria coordenadora, não dado de aluno.
- `usuario.introducao_vista_em`, que o código só lê e grava pelo caminho da tarefa 1.0.

As fixtures de e2e ganharam `email` em `ConviteDeCoordenadorDeTeste` (`e2e/__fixtures__/sessao.ts:921-923`). Esse campo é do coordenador, não do aluno, e é sintético (`coordenador-<uuid>@educa.invalid`).

Fora da tabela de dados do docs/lgpd.md: nenhum. `introducao_vista_em` já está em `docs/lgpd.md:105`, com finalidade, retenção e a proibição de virar indicador de adoção (D64).

Autorização por objeto: ok. A tarefa não cria rota nem endpoint na API. A nova rota de tela `/coordenacao/bem-vindo` (`apps/web/src/areas/coordenacao/rotas.tsx:61`) só lê `/v1/eu`, que devolve os dados da própria pessoa, e grava a data dela. Não há id na URL para trocar.

Logs: limpos. Nenhum `logger` foi acrescentado. Os `throw new Error` de `e2e/__fixtures__/segundo-fator.ts:904,908` levam só o status HTTP e a etapa.

Auditoria: presente onde a regra exige. Esta tarefa não lê dado de aluno, não exporta, não mexe em nota nem em permissão e não aprova saída de IA. Gravar a data da introdução não pede auditoria.

Envio externo: nenhum. A introdução não chama modelo: as falas do Analista são texto fixo em `apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts`.

Seed/fixture: sintético. As escolas aparecem como "Colégio sintético da vitrine cheia/vazia …", a coordenadora como "Coordenadora sintética …" e os e-mails terminam em `@educa.invalid`.

Fotos da tela: olhei os passos 1, 2 e 4 no computador e no celular, na escola cheia e na vazia. A única coisa variável na tela é o nome da escola. Não aparece nome, matrícula, nota nem conteúdo de aluno ou de professor. O passo 4 mostra a lista fixa `O_QUE_A_IA_NUNCA_FAZ` (`apps/web/src/areas/coordenacao/governanca/nunca-faz.ts:9`).

D64, a coordenação não sabe quem viu a introdução: há prova. `e2e/coordenacao-introducao.spec.ts:118-130` confere que a resposta de `/v1/professores` não contém "introducao". Nada da introdução fica no navegador: `e2e/coordenacao-introducao.spec.ts:97` exige `localStorage` e `sessionStorage` vazios.

Promessa do passo 3 ("Dado com nome só abre com um motivo, e isso fica registrado"): para a lista de alunos o código cumpre. `apps/api/src/estrutura/turma/turma.service.ts:128-137` exige a finalidade e grava `turma.alunos_lidos` na mesma transação. O mesmo padrão `nominal_auditado` aparece em `apps/api/src/atividade/desempenho/desempenho.controller.ts:8`.

Pergunta de fechamento: a tarefa não acrescenta dado nem destino de envio, então o que o sistema já responde sobre um aluno continua igual.

Bloqueantes: nenhum.

Recomendações:
- Texto do passo 3, linha "Abrir um aluno ou um professor pelo nome pede um motivo." (`apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts:147`). A coordenação vê o nome dos professores na aba Escola sem dar motivo: o próprio e2e lê esses nomes em `/v1/professores` (`e2e/coordenacao-introducao.spec.ts:127-128`). Só o indicador nominal do professor pede motivo (D45). Para não prometer mais do que o código faz, convém dizer "o desempenho de um aluno ou de um professor" em vez de "um aluno ou um professor pelo nome". Quem decide o texto é o `conformidade-reviewer`.
- `introducaoVistaEmDoUsuario` lê o banco sem filtrar por `escola_id`. Isso já está anotado no `TODO.md`, com a guarda que impede importar `e2e/__fixtures__` fora de `e2e/`. Só reforço que essa guarda continue pendente lá.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 19:53:40 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

O que conferi:
- **Subtarefas e falas:** as três subtarefas foram feitas. As quatro falas são as da 11.1. O passo 4 traz a lista de `O_QUE_A_IA_NUNCA_FAZ` e, na mesma região que rola, "Onde fica cada coisa", lida de `NAVEGACAO.coordenador`.
- **Destino e menu:** o primeiro lugar é absoluto (`~/coordenacao/painel`). "Rever a introdução" está em `MENU_DA_PESSOA.coordenador`.
- **Nada fora do escopo:** sem resumo, sem sino, sem conversa com o Analista e sem trilha de montagem.
- **Divergências na spec:** as três que mudam a Tech Spec (o "de" no lugar de "da", as peças comuns `IntroducaoDoPapel` e `OndeFicaCadaCoisa`, e o passo 4 com as duas listas sem tela de fim) já estão na `techspec.md` §9.
- **`escola-montada.spec.ts` sem mudança:** é desvio só da lista de arquivos da tarefa, não da Tech Spec, e o motivo confere. A coordenadora do W1 nasce por `criarEquipeComSenha` com a introdução já vista (`e2e/escola-montada.spec.ts:79`).
- **Aluno e professor passam pela peça comum sem mudar comportamento:** os destinos (`ROTAS_DO_ALUNO.inicio` e `ROTAS_DO_ALUNO.eu` para o aluno, `PRIMEIRO_LUGAR` para o professor) e as falas do carregando são os mesmos de antes.
- **As linhas a mais dos passos têm lastro no produto:** "Abrir um aluno ou um professor pelo nome pede um motivo" corresponde a telas que pedem a finalidade (`estrutura/ListaDaTurma.tsx`, `governanca/DadoNominal.tsx`). "Dois ou mais no grupo" está preso a `GRUPO_MINIMO_DE_PROFESSORES`.
- **Fotos:** as oito estão no modo "rever" e mostram o que a Tech Spec descreve. A onça aparece com "Analista de desempenho escolar" e o selo "IA". O passo 4 traz a região "Role para ler mais" e o botão "Continuar" à vista a 1366 e a 360 px, sem conteúdo de fora da tarefa.

Recomendações:
1. **`TODO.md:356`:** o item está marcado como `[x]` "feito", mas o bloco de mutação `max-h-none` do professor não foi acrescentado. A condição do item era justamente "quando a 11.0 tocar `areas/professor/introducao/BemVindo.tsx`", e esta tarefa tocou. Ou o item continua aberto, ou é registrado como recusado, com o motivo, na tabela "Recomendações sem aplicar" da `11_task.md`. "Feito" descreve outra coisa: o bloco foi feito para a coordenação, não para o professor.
2. **`e2e/roteiro-da-demonstracao.spec.ts:~175-185`:** o roteiro ainda percorre o convite, a senha e o segundo fator à mão. `entrarComoCoordenacaoPeloConvite` (`e2e/__fixtures__/casca.ts:435`) agora faz isso. Ficam dois jeitos de fazer a mesma entrada.
3. **`e2e/__fixtures__/segundo-fator.ts:519`:** `entrarPelaApiComSegundoFator` serve para qualquer papel da equipe, mas o parâmetro se chama `coordenadora`, e o nome engana quem for reaproveitá-la.
4. **`apps/web/src/componentes/introducao/OndeFicaCadaCoisa.tsx:21-22`:** o `id="onde-fica-cada-coisa"` é fixo. Hoje há só uma lista por tela, mas um `useId()` evitaria id repetido se a peça aparecer duas vezes.

Arquivos principais:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/coordenacao/introducao/BemVindo.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/IntroducaoDoPapel.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/TODO.md

## test-engineer · 1ª rodada · APROVADO · 2026-10-25 19:54:26 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/11_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** a coordenadora convidada aceita o convite, define a senha, configura o segundo fator, entra e cai em `/coordenacao/bem-vindo`. Passa pelos quatro passos, e o último "Continuar" grava a data uma vez e leva ao Painel.
- **Pular:** grava a data, leva ao primeiro lugar, e a entrada seguinte não volta à introdução.
- **Rever** pelo menu da pessoa: todo passo tem "Fechar", nada é gravado e a data não muda.
- **Os quatro estados:** carregando (fala com "da sua escola", sem "Pular" nem "Fechar"), erro (com "Tentar de novo", "Voltar para a abertura" e "Sair"), data desconhecida vale a primeira vez, e com dado. Uma releitura que falha não tira os passos da tela.
- **Bordas:**
  - incidente pendente aparecendo por cima da introdução;
  - a coordenadora seguinte no mesmo computador, com o `['eu']` da anterior no cache (a `CascaDaEscola` lê `consultaEu`, então o caso prova o recomeço de fato);
  - gravação que falha, e mesmo assim a pessoa segue;
  - "Sair" no meio não grava;
  - nome de escola com "Colégio", "Escola" e "Instituto" (o "de" no lugar de "da");
  - escola vazia (fotos da vitrine);
  - 360 px.
- **Clique duplo** em "Começar" com a gravação ainda no ar: um POST só.
- **D64:** a coordenação não sabe quem viu a introdução.
- **Isolamento e concorrência no servidor:** são da 1.0, e a tarefa não toca a API.

**Cobertos:** cada linha da tabela de testes tem o seu caso.
- Textos (RF15), no `textos-da-introducao.test.ts`: falas palavra por palavra, cada linha de cada passo, a mesma lista de `O_QUE_A_IA_NUNCA_FAZ`, e os termos proibidos (ranking, meta de uso, sentimento).
- "Onde fica cada coisa" sai de `NAVEGACAO.coordenador`: caso no `BemVindo.test.tsx`, com as mutações `.slice(1)` e da descrição.
- Primeira entrada por convite e segundo fator: primeiro caso do e2e, que usa o `entrarComoCoordenacaoPeloConvite`.
- Pular: no componente e no e2e, com a data no banco e o `page.goto('/')` caindo no Painel.
- Botões iguais: mesma classe em todo passo no componente, e mesmo tamanho a 360 px no e2e.
- Falas (regra 70, item 4a; D58): os três padrões proibidos, e um caso que prova que cada padrão pega o que diz pegar.
- Quatro estados, rever, incidente por cima, D64 no `/v1/professores`, recomeço da tela e 360 px (44 px de altura e largura, sem rolagem lateral).

Confrontei a seção "Mutações" com o `git diff`:
- Toda cláusula nova de `IntroducaoDoPapel.tsx`, `OndeFicaCadaCoisa.tsx`, `coordenacao/introducao/BemVindo.tsx`, `textos-da-introducao.ts`, `Inicio.tsx`, `navegacao.ts` e `coordenacao/rotas.tsx` tem bloco.
- `node tools/processo/mutacoes.ts --faltando` diz que nenhuma linha nova de produção com condição fica sem bloco.
- Rodei os 10 arquivos de unidade das três introduções, `Inicio`, navegação, lateral e a cadeia da onça: 193 casos, todos verdes.
- Não há `.skip`, `.only`, teste comentado, nem mock de código nosso. A rede falsa é a única coisa trocada.
- Não há IA na tarefa.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `11_task.md:110-117`, o bloco que troca `if (eu.data === undefined)` por `if (false)` cita o caso de carregando da coordenação. Ali o vermelho vem de um TypeError (`passosDe(undefined)` lê `eu.escola.nome`), e não da asserção "sem Fechar, sem Pular". Citar o caso de carregando do aluno ou do professor, cujos `passosDe` não leem o `eu`, faria a própria asserção ficar vermelha.
2. Coordenadora com vínculo em duas escolas (`criarConviteDeCoordenador({ conta })`): ter visto a introdução na escola A não deve valer na escola B. É da API (1.0), mas nenhum caso desta spec atravessa isso pela tela.
3. Permissão: nenhum caso abre `/coordenacao/bem-vindo` como professor ou aluno. Hoje isso depende só da guarda da área.
4. Em `e2e/coordenacao-introducao.spec.ts:95` e `:110`, o `expect.poll(() => gravacoes.length).toBe(1)` para no primeiro 1, e um segundo POST tardio passaria. O clique duplo está coberto no componente. Mesmo assim, uma conferência final de `toHaveLength(1)` depois do Painel fecharia o e2e.
5. Em `textos-da-introducao.test.ts:91-93`, o caso do "dois ou mais" só fixa que `GRUPO_MINIMO_DE_PROFESSORES` vale 2. Gerar a palavra esperada a partir da constante amarraria de fato a frase ao código.
6. Em `e2e/coordenacao-introducao.spec.ts:91-92`, a contagem 4 e os rótulos dos lugares estão escritos à mão. É aceitável como fumaça, mas precisa mudar junto com a navegação.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/coordenacao-introducao.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/introducao/IntroducaoDoPapel.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/11_task.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-25 20:15:54 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

As duas recomendações que a Mesa mandou aplicar foram feitas:
- **`TODO.md`:** o item do bloco `max-h-none` do professor saiu de `[x]` "feito" e passou a "Recusado", com o motivo. A mesma linha está na tabela "Recomendações sem aplicar" de `11_task.md`.
- **`e2e/__fixtures__/segundo-fator.ts`:** o parâmetro `coordenadora` virou `pessoa` em `entrarPelaApiComSegundoFator`, e os comentários das duas funções foram ajustados junto.

Também conferi o resto do diff:
- **Bloco de mutação `if (false)` em `11_task.md`:** agora cita `areas/aluno/introducao/BemVindo.test.tsx`. O caso "mostra a fala do passo 1 e o "Sair", sem "Fechar"…" existe nesse arquivo, na linha 87.
- **Contagem final em `e2e/coordenacao-introducao.spec.ts`:** as duas linhas `expect(gravacoes).toHaveLength(1)` cobrem uma gravação tardia, que o `expect.poll` sozinho não pega.
- **Frase do passo 2 em `textos-da-introducao.test.ts`:** o teste agora monta a frase a partir de `GRUPO_MINIMO_DE_PROFESSORES`. Se a constante mudar, a frase tem de mudar; isso é mais forte que o `toBe(2)` de antes.
- **Produção:** nenhum arquivo de produção mudou, então as fotos da tela continuam valendo.

Recomendações:
- `apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts:92` e `:96` agora testam a mesma coisa, porque as duas procuram a frase do grupo mínimo montada com `PALAVRA_DO_GRUPO_MINIMO`. O caso da linha 95 pode sair, ou a linha 92 pode voltar a olhar só o resto do passo 2.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/11_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/TODO.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/segundo-fator.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/coordenacao-introducao.spec.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 20:16:14 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/11_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada. Nesta rodada só conferi o diff `b7cf684..6221f54`, que não toca produção, e as três correções que a Mesa mandou fazer:
- o bloco de mutação do carregando cita um caso que fica vermelho pela asserção;
- a contagem final de gravações nos dois casos do e2e;
- a frase "dois ou mais" ligada a `GRUPO_MINIMO_DE_PROFESSORES`.

Cobertos:
- **(1) Bloco de mutação `if (eu.data === undefined)` → `if (false)`.** Fica vermelho pelo motivo certo. Ele agora cita `apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › mostra a fala do passo 1 e o "Sair", sem "Fechar"`, um pedaço do nome do caso da linha 87, que o `-t` acha. Com a mutação, o `IntroducaoDoPapel.tsx:76` monta a `Introducao` com `passosDoAluno()`. Essa função não lê o `eu` (`areas/aluno/introducao/BemVindo.tsx:54`), então a tela abre com "Continuar" e "Pular", e o caso cai em `expect(talvezBotao('Continuar')).toBeNull()` (linha 97). Não cai por TypeError, como cairia com `passosDe` da coordenação, que lê `eu.escola`.
- **(4) Contagem final de gravações.** `expect(gravacoes).toHaveLength(1)` está no fim dos dois casos de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/coordenacao-introducao.spec.ts`. No caso do "Pular" ela vem depois do `goto('/')` e do endereço do Painel, então prova de verdade que a segunda entrada não gravou de novo.
- **(5) "dois ou mais" ligado à constante.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts` a palavra sai de `POR_EXTENSO[GRUPO_MINIMO_DE_PROFESSORES]`. Se a constante virar 3, o teste procura "três" e a frase diz "dois", então falha. Um número fora do mapa sai como `<<n>>` e também falha. O `toBe(2)` antigo só prendia o número, e não a frase junto.
- `segundo-fator.ts`: só troca de nome de parâmetro e comentário, sem efeito no que os testes provam.
- `TODO.md` e a tabela "Recomendações sem aplicar" dão destino a cada recomendação da 1ª rodada, as minhas também (duas escolas, guarda da área).
- `npx vitest run --project unidade` no teste de textos e no `BemVindo.test.tsx` do aluno: 50 casos passaram.
- Nenhum `.skip`, nenhum teste comentado, nenhum mock novo.

Bloqueantes: nenhum.

Recomendações:
- Em `textos-da-introducao.test.ts`, o caso "`dois ou mais` é o grupo mínimo que o código aplica" agora repete o `toContain` do caso anterior, o do passo 2. Dá para juntar os dois ou apagar o segundo; o nome dele pode ficar como descrição do primeiro.
- No primeiro caso do e2e, o `toHaveLength(1)` final vem logo depois do `expect.poll(...).toBe(1)` e de uma leitura do navegador, sem esperar nada que daria tempo a uma gravação atrasada chegar. O comentário "nenhuma tardia" promete mais do que o caso prova. A prova de verdade é a do segundo caso. Basta ajustar o comentário.

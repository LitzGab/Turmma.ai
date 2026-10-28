# Achados das revisões — `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-28 22:38:47 · `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (não muda)
Fila e prioridade: ok (não muda)
Concorrência: protegida (nada novo pode ser disparado duas vezes)
Índice e paginação: ok (nenhuma query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não há código novo no caminho quente)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/aluno/Tutor.tsx`: a pausa do Tutor aparece a turmas inteiras ao mesmo tempo (por exemplo, quando a prova começa). A onça agora é um SVG inline e não faz nenhuma chamada nova à API, então não pesa no servidor. O que falta é o `frontend-reviewer` confirmar que o import da `Onca` nas telas do aluno (`Tutor.tsx`, `Atividade.tsx`, `ComoEstouIndo.tsx`) não aumenta o pacote JavaScript inicial que o Chromebook baixa.

As mudanças desta tarefa só mexem na tela: desenho em SVG, a prop `ilustracao` em `EstadoVazio` e `Roteiro`, e testes. Procurei no diff `useQuery`, `useMutation`, `fetch`, `WebSocket`, `setInterval`, `localStorage` e `import()`, e nenhum aparece. A tarefa não toca API, banco, worker, fila, provedor de IA nem infra. O teste e2e novo em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/e2e/aluno-tutor.spec.ts` não chama provedor pago.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-28 22:39:09 · `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

VEREDITO: APROVADO

Tela vista: sim (18 fotos lidas, cheia e vazia, computador e celular; Criados, Eu, atividade inexistente, Estrutura e a introdução do professor). A pausa do Tutor (pose dormindo) e o roteiro da Estrutura sem ano letivo não têm foto. Revisei esses dois pelo código, pelos testes e pelo e2e.

Estados: ok.
- **Vazio:** convida, não se desculpa. "Nada gerado ainda" tem o botão "Ir para Ferramentas". "Nada corrigido ainda" diz quando a nota aparece. "Esta atividade não está disponível" aponta para Tarefas.
- **Carregando e erro:** seguem nas mesmas telas (`EstadoCarregando` e `EstadoErro` em `Atividade.tsx` e `ComoEstouIndo.tsx`), sem mudança.
- **Testes:** passaram os 10 arquivos de teste de onça, estados, guarda de importação, Eu, Atividade, Estrutura e Criados (186 testes).

Acessibilidade:
- O desenho é `aria-hidden` e vem dentro de `figure` com legenda "função + IA", então o leitor de tela lê a função.
- A pausa do Tutor mantém `role="status"`, o texto continua em contraste normal e não há alvo de toque novo.
- O e2e confere que a onça deitada não tem animação, tem o selo "IA" e que a frase não fala em dormir, descansar nem cansaço.

Chromebook fraco: sem peso novo. A onça é SVG inline, parada (`animada={false}` nas cinco telas), sem imagem nem lista. `EstadoVazio` não importa a onça; a tela a passa, e a entrada não ganha peso.

Celular (360 px):
- **Criados vazia, Eu vazia e atividade inexistente:** sem rolagem horizontal nem corte. O botão "Ir para Ferramentas" tem cerca de 48 px.
- **Rolam a 1366 × 768:** nenhuma.
- **Barra de baixo no meio da página** (Eu cheia, Estrutura cheia e vazia): é a barra fixa aparecendo no meio da captura de página inteira. Já era assim e não vem desta tarefa.
- **Pausa do Tutor a 360 px:** `min-w-0` e `break-words` estão no código. Não há foto.

Ação oficial protegida: sim. A tarefa não toca aprovar, publicar, excluir nem exportar.

Regras da onça (D58, D59):
- Todas as onças novas estão assinadas por função (Assistente de ensino, Tutor, Analista) e com selo "IA".
- Nenhuma tem balão com texto. Os três pontos do `pensando` ficam parados.
- Nenhuma anima.
- As linhas do aceno estão visíveis nas fotos da introdução e são traço parado.
- A pausa não fala em primeira pessoa e o roteiro não tem o balão "Faltam N coisas".
- Os itens que a tarefa deixou de fora estão corretamente fora (`acolhendo`, "Ninguém entrou ainda" de Hoje, "Vale revisar", `dormindo` nos outros vazios).

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
1. **Onça centralizada em cima de texto à esquerda** (`professora--professor-criados--computador.png`, `vazia--aluno--aluno-eu--computador.png`, `...-celular.png`, `vazia--aluno--aluno-atividades-...-computador.png`).
   - **O que se vê:** no vazio padrão a onça e a assinatura ficam centralizadas e título, descrição e botão à esquerda. A `figure` de `Onca.tsx:220` é `flex flex-col items-center` e ocupa a largura toda.
   - **O que contradiz:** o comentário de `EstadoVazio.tsx:22-25` e o teste `estados.test.tsx:128-131` dizem que no padrão a onça fica "à esquerda". O teste confere só a classe do contêiner, não o resultado na tela.
   - **Correção sugerida:** alinhar a onça à esquerda no padrão (por exemplo `[&>figure]:items-start`) ou centralizar o vazio inteiro quando há ilustração. Se ficar como está, corrija o comentário e o teste.
2. **Foto do roteiro da Estrutura sem ano letivo:** a vitrine não tem escola assim. Vale uma foto na validação, para ver a onça de 72 px com o título do roteiro a 360 px.
3. **Pausa do Tutor:** a vitrine não alcança a avaliação em curso. Vale uma foto da pausa a 360 px na validação (`Tutor.tsx`, `Pausa`).

Arquivos principais: `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.tsx`, `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/estado/EstadoVazio.tsx`, `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/aluno/Tutor.tsx`.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-28 22:40:11 · `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

VEREDITO: REPROVADO

Escopo: respeitado. Os cinco lugares e as linhas do aceno são os da tabela da tarefa, e nenhum vai além dela. O desenho da `dormindo` e o das linhas confere, valor a valor, com `mockups/src/components/duo/onca/Onca.tsx:52-57` e `:278-312`.

Aderência à Tech Spec: divergência na D80. A tarefa traz a `dormindo` sem revisar o registro que a deixa fora.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

Bloqueantes:

1. **A `dormindo` contraria a D80, e o registro não foi revisto.**
   - `docs/decisoes.md:1504-1505` diz, na revisão de hoje (commit `d12a9ba0`): "o piscar e o laço dos três pontos, que ele vetou, e as poses `acolhendo` e `dormindo` continuam fora".
   - Esta correção põe a `dormindo` no produto: `Onca.tsx` (`POSES`, `Deitada`), `CabecaOnca.tsx` e a `Pausa` de `areas/aluno/Tutor.tsx`.
   - Mesmo assim, `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md:73` afirma que "não mudam de decisão", e `:77` diz "Divergências resolvidas: Nenhuma".
   - A frase geral do item 3 ("pose e lugar novos entram com parecer") não cobre o caso: o texto mais recente da decisão nomeia essa pose como fora. Quem ler `decisoes.md` amanhã encontra uma regra que o código desmente. É divergência decidida em silêncio.
   - **Correção exigida:** registrar a revisão da D80, item 3, pela skill `registrar-decisao`, em `docs/decisoes.md`. Ela diz que a `dormindo` entra só na pausa do Tutor, parada, sem frase e com parecer do `conformidade-reviewer`. Diz também que as duas linhas do aceno entram como traço parado e que há cinco lugares novos. Se o título da D80 mudar, o `CLAUDE.md` muda junto. Depois, corrigir as linhas 73 e 77 da tarefa para apontar essa revisão. A outra saída é tirar a `dormindo` desta correção.

Recomendações:

- **A assinatura de dois lugares foge do critério que a própria tarefa escreveu** ("a função de quem produz o que a tela mostra").
  - "Esta atividade não está disponível" sai assinada por Tutor (`Atividade.tsx:459`), mas a atividade é do professor e o Tutor não produziu nada ali.
  - O roteiro da Estrutura sai assinado por Analista de desempenho escolar (`Estrutura.tsx:249`), mas o roteiro é texto fixo do produto, não saída do Analista.
  - Com o selo "IA", essas duas telas sugerem que o conteúdo é saída de IA. O parecer é do `conformidade-reviewer`; deixo registrado para ele.
- **Comentários de documentação que esta correção deixou desatualizados:**
  - `Onca.tsx:202` diz "Quatro poses" (agora são cinco).
  - `Onca.tsx:205-206` diz que só a `Introducao`, a `Comemoracao` e as introduções a importam (agora há também a lista `TELAS_COM_A_ONCA`).
  - `avatar-so-nas-duas-pecas.test.ts:324-325` diz que tela nova "passa pela `AssinaturaIA`", o que contradiz a lista fechada declarada logo abaixo.
- **A `Pausa` agora desenha a onça dormindo para os cinco motivos de pausa**, incluindo `suspenso` (o agente suspenso pela coordenação) e `fora`. O e2e confere só a pausa por avaliação. Vale o `conformidade-reviewer` confirmar que o desenho de dormir serve também para a suspensão.
- **Detalhes de arrumação:**
  - Linha em branco duplicada em `Onca.tsx:242-243`.
  - Em `Estrutura.tsx:63`, o import da `Onca` está no meio dos imports locais da pasta; o padrão do projeto é deixá-lo junto dos outros de `componentes/`.

Arquivos citados:
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/docs/decisoes.md`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.tsx`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/aluno/Tutor.tsx`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/aluno/Atividade.tsx`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/coordenacao/estrutura/Estrutura.tsx`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-28 22:40:16 · `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

**VEREDITO: REPROVADO**

**Cenários exigidos:**
- **Caminho feliz:** a onça aparece nos cinco lugares com a pose, o tamanho e a assinatura da tabela, e sempre parada.
- **Bordas:**
  - escola sem ano letivo (virada de ano), na Estrutura;
  - aluno sem turma no ano, em "Como estou indo";
  - atividade de outra turma respondendo como inexistente;
  - o vazio filtrado de Criados sem onça;
  - o painel lateral "O que falta" sem onça;
  - a pausa do Tutor sem texto de sono ou cansaço;
  - a `dormindo` sem braços, pés nem pupila;
  - só a `acenando` com as linhas do aceno.
- **Permissão:** a pose `dormindo` só é escrita pela `Onca`, pela cabeça e pela pausa do Tutor, e as cinco telas formam uma lista fechada. A introdução não aceita `dormindo`.
- **Isolamento:** não se aplica. A tarefa não toca dado, API nem tenant, e a atividade de outra turma já respondia como inexistente antes.
- **Concorrência:** não se aplica.

**Cobertos:**
- Os cinco lugares têm teste. Criados, Eu, Estrutura e Atividade têm caso de unidade que confere pose, assinatura e ausência de `onca-animada`; Criados confere também o selo. A pausa é coberta por `e2e/aluno-tutor.spec.ts`, que confere pose, figcaption, selo, `getAnimations` = 0 e o texto sem sono ou cansaço.
- A lista fechada de importadores e a varredura de `dormindo` estão em `avatar-so-nas-duas-pecas.test.ts`.
- O desenho da `dormindo` e as duas linhas do aceno estão congelados em `fidelidade-ao-mockup.test.tsx`. O rosto, os braços e o "z" estão em `Onca.test.tsx`, e a `dormindo` sem movimento em `movimento-da-onca.test.tsx`.
- `EstadoVazio` com e sem ilustração está em `estados.test.tsx`.
- Rodei os 10 arquivos de unidade: 186 casos verdes. O e2e não rodei.
- Conferi as mutações contra o diff. Cada uma vai a um teste que lê exatamente a cláusula mutada, e nenhum teste usa `.skip` nem mock que esconda a regra.

**Bloqueantes:**

1. **O último bloco de mutação não fecha** (`/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/tasks/correcoes/2026-10-28-onca-do-mockup-v3.md:219-223`).
   - O documento tem 39 cercas de três crases, um número ímpar: falta o fechamento do bloco que muta o `if (tracejado && Icone !== undefined)`.
   - Por isso `node tools/processo/mutacoes.ts --faltando` ainda acusa a linha `apps/web/src/componentes/estado/EstadoVazio.tsx:32` como cláusula nova sem bloco.
   - O teste citado (`estados.test.tsx › o tracejado é de 2 px…`, linha 140) pegaria a mutação; o problema é só a cerca.
   - Correção: fechar a cerca depois da linha 223 e rodar o `--faltando` de novo até ele não listar nada.

2. **A regra "o painel 'O que falta' não leva onça" não tem teste que a prove** (`/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/coordenacao/estrutura/Estrutura.test.tsx:348`).
   - A asserção `painel.querySelector('img, svg[data-onca]')` sempre passa: `data-onca` fica no `<figure>` (`Onca.tsx`), e não no `<svg>`, e a `Onca` não desenha `<img>`.
   - Antes desta tarefa isso era inofensivo. Agora o `Roteiro` aceita `ilustracao` (`OQueFalta.tsx:12`), e passar uma onça no `PainelDoQueFalta` (`OQueFalta.tsx:60`) não deixaria nenhum teste vermelho, contra a linha da tabela da tarefa. Asserção que sempre passa é proibida (regra 40, item 5).
   - Correção: trocar o seletor por `'img, [data-onca]'` e declarar um bloco de mutação que passe `ilustracao={<Onca …/>}` ao `Roteiro` do painel, apontando para `Estrutura.test.tsx › enquanto falta passo: …`.

**Recomendações:**
- **Criados:** a tabela diz que o "Nada com estes filtros" não leva onça, e nenhum teste confere isso. Vale acrescentar `expect(document.querySelector('[data-onca]')).toBeNull()` em `Criados.test.tsx:398` (sem mais páginas, "Nada com estes filtros").
- **Eu:** o comentário em `Eu.test.tsx:146` diz "e só no vazio", mas nenhum caso confere a ausência da onça quando "Como estou indo" tem dado. Vale uma asserção no caso com dado.
- **Introdução:** "`PoseDaIntroducao` recusa a `dormindo`" só é garantido hoje pela varredura de texto. Um `// @ts-expect-error` com `pose: 'dormindo'` em `Introducao.test.tsx`, ao lado do que já existe para `comemorando` (linha 298), prenderia o tipo.
- **Pausa do Tutor:** a mutação da pausa (`pose="apontando"`) fica vermelha pela varredura estática, que prova a palavra e não o desenho. O desenho só é provado no e2e e só para a pausa `avaliacao`. Um teste de unidade da `Pausa` seria mais barato e cobriria os cinco motivos.
- **`animada={false}` na pausa** (`Tutor.tsx:58`) não tem bloco. É inócuo, porque a `Deitada` nunca anima e `Onca.test.tsx › a dormindo é só a figura…` prova isso. Uma linha no documento evitaria a pergunta na validação.

## conformidade-reviewer · 1ª rodada · REPROVADO · 2026-10-28 22:41:26 · `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum nesta correção. O diff só mexe em telas, no desenho da onça, em testes e em `docs/interface.md`; não toca API, banco, job, seed nem importação. Todos com autor humano? Sim, porque nada mudou aí.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. Nenhuma saída de IA nova chega ao aluno.
Supervisão do tutor: ok no que importa à regra 70, item 4. A pausa continua visível e não vira erro. A pose escolhida para ela foi vetada (B1).
Autonomia declarada e visível: sim, não mudou. O item 3 mexe nisso: a assinatura na Estrutura contradiz o que a tela de governança declara (B2).

## Parecer por lugar e pose (D80, item 3)

Usei um critério só, o que a própria tarefa escreveu na linha 26 e a D58 sustenta. "Função · IA" é o rótulo de saída de IA do produto. A onça assinada só entra onde a região da tela guarda o que aquele agente produz. Em conteúdo fixo, ou em resultado que outro agente produziu e uma pessoa aprovou, a assinatura atribui autoria de IA a quem não produziu nada.

1. **Vazio de Criados (Assistente de ensino): ENTRA.** O que enche essa região é o que o Assistente gera, então a assinatura diz a verdade (D58; D80, item 3). A tela existe (D73). A onça está parada e sem balão, e aponta para um convite de ação que é do professor, não do menor (D59; regra 70, item 4b). Fotos: `vazia--professora--professor-criados--computador.png` e `…--celular.png`; código em `Criados.tsx:185`.

2. **"Como estou indo" em Eu (Tutor): VETADO.** A região mostra correção de objetiva aprovada pelo professor. Em `packages/shared/src/time/funcoes.ts:43-50`, a correção de objetiva é do **Assistente de ensino**, não do Tutor. Com dados, a região não tem assinatura nenhuma (`aluno--aluno-eu--computador.png`). Vazia, aparece "Tutor · IA / Nada corrigido ainda" (`vazia--aluno--aluno-eu--computador.png` e `…--celular.png`, de `ComoEstouIndo.tsx:30`). O aluno lê que o Tutor é quem corrige. Isso borra quem corrigiu e quem aprovou, que é o ponto central da regra 70 numa função de alto risco. Também diverge do que a governança declara (regra 70, itens 4a e 5; D58). O lugar pode voltar com parecer novo se a seção se apresentar em todos os estados como "o que o Tutor sabe de você" (D66; regra 70, item 4d).

3. **Roteiro da Estrutura (Analista de desempenho escolar): VETADO.** Resposta direta à dúvida: sim, a assinatura sugere autoria de IA sobre algo que a IA não produziu. O roteiro é uma lista fixa e determinística. A função declarada do Analista é "Resumo e alerta", em agregado (`funcoes.ts:74-80`), e não monta a estrutura da escola. Aqui a leitora é a coordenadora, justo quem precisa responder "o que essa IA faz sozinha?" apontando para uma tela (regra 70, item 5). Pôr "Analista · IA" no passo a passo da estrutura conta a ela uma atribuição que a governança não declara. Sai a onça de `Estrutura.tsx:249`. Sai também a prop `ilustracao` de `Roteiro`, que fica sem uso em `OQueFalta.tsx`. Nenhuma foto mostra esse lugar.

4. **"Esta atividade não está disponível" (Tutor): VETADO.** O texto é a resposta de acesso do sistema (404, ou atividade de outra turma). A atividade é do professor e o Tutor não a produz. Pior: a pose `pensando`, com o balão de três pontos, é o sinal visual de "a IA está trabalhando", e ali nenhuma IA está processando nada. É um sinal falso de estado, assinado como IA, para um menor (D58; regra 70, item 4a). Foto: `aluno--aluno-atividades-00000000-0000-4000-8000-000000000000--computador.png`; código em `Atividade.tsx:459`.

5. **Pausa do Tutor com a pose `dormindo`: VETADO.**
   - A revisão da D80 de 28/10 diz literalmente que "as poses `acolhendo` e `dormindo` continuam fora" (`docs/decisoes.md:1505`). Nenhum registro de decisão acompanha a correção, que diz em `v3.md:73` que a decisão não muda.
   - O mérito é pior. A mesma `Pausa` aparece em `limite_do_dia` ("Você fez as N perguntas de hoje. Amanhã o Tutor volta.") e em `pacote_do_mes` (`tutor.ts:58-75`). Uma onça dormindo com "z", mostrada porque o aluno gastou as perguntas, é o agente com estado de corpo (cansaço, sono) em reação ao uso de uma pessoa. A D80, item 3, proíbe isso: "não diz que sente, não reage … ao tempo de uso". A D59 também, porque o teto tem de aparecer como salvaguarda, não como "você cansou o Tutor".
   - Em `suspenso` e `fora`, o desenho contradiz o texto, que explica com cuidado que a pausa é escolha da escola.
   - A tarefa recusou a frase do mockup "Na prova, eu descanso" porque "diz que ela descansa". O desenho diz o mesmo, e o e2e proíbe `dorm|descans` no texto enquanto a imagem mostra exatamente isso.

6. **As duas linhas ao lado da pata da `acenando`: ENTRA.** São traço parado, na cor da sombra, sem animação, e só ajudam a ler um gesto que já foi aprovado. Ficam na introdução, que acontece uma vez e tem "Fechar" e "Sair" à vista (D59; regra 70, item 4b). Fotos: `vazia--professora--professor-bem-vindo--computador.png` e `…--celular.png`; código em `Onca.tsx:94` e `:160-167`.

## Bloqueantes

- **B1. A pose `dormindo`.** Em `apps/web/src/areas/aluno/Tutor.tsx:56-59`, a pausa desenha a onça dormindo, vetada pelo item 5 acima.
  - **Correção exigida:**
    - Devolver a `Pausa` aos ícones por motivo (`ICONE_DA_PAUSA`).
    - Tirar a `dormindo` do tipo e do desenho: `Onca.tsx:12`, `:16`, `:19`, `:230` e `Deitada` (`:316-360`); o olhar `dormindo` e a boca `fechada` de `CabecaOnca.tsx:74`, `:76`, `:139` e `:171`.
    - Restaurar em `Onca.test.tsx:42-43` a prova de que o tipo recusa `dormindo`.
    - Remover o caso de `dormindo` em `avatar-so-nas-duas-pecas.test.ts`, o bloco da `dormindo` em `fidelidade-ao-mockup.test.tsx` e as asserções da onça em `e2e/aluno-tutor.spec.ts:287-293`.
    - Tirar a linha "Dormindo" de `docs/interface.md:1186`.

- **B2. A onça do roteiro da Estrutura.** `apps/web/src/areas/coordenacao/estrutura/Estrutura.tsx:249` assina como Analista um conteúdo fixo da tela, vetado pelo item 3.
  - **Correção exigida:**
    - Remover a `ilustracao` daqui e de `OQueFalta.tsx` (a prop e o `div`).
    - Tirar a asserção da onça em `Estrutura.test.tsx:193-197`.
    - Tirar o arquivo de `TELAS_COM_A_ONCA` (`avatar-so-nas-duas-pecas.test.ts:33`).
    - Tirar a menção em `docs/interface.md:1184`.

- **B3. A onça da atividade indisponível.** `apps/web/src/areas/aluno/Atividade.tsx:459` assina como Tutor uma resposta de acesso, e o `pensando` simula processamento. Vetado pelo item 4.
  - **Correção exigida:**
    - Remover a `ilustracao` e o import da `Onca`.
    - Tirar a asserção em `Atividade.test.tsx:619-624`.
    - Tirar o arquivo de `TELAS_COM_A_ONCA`.
    - Tirar a linha "Pensando" de `docs/interface.md:1185`.

- **B4. A onça do vazio de "Como estou indo".** `apps/web/src/areas/aluno/ComoEstouIndo.tsx:30` assina como Tutor a região das correções do Assistente aprovadas pelo professor. Vetado pelo item 2.
  - **Correção exigida:**
    - Remover a `ilustracao` e o import.
    - Tirar a asserção em `Eu.test.tsx:146-150`.
    - Tirar o arquivo de `TELAS_COM_A_ONCA`.
    - Ajustar a linha "Apontando" de `docs/interface.md:1184`, que fica só com Criados.

- **B5. Mutações dos lugares vetados.** O bloco "Mutações" da tarefa tem mutações sobre esses lugares: a de `ComoEstouIndo`, a de `Estrutura`, a de `OQueFalta`, a de `Atividade`, a de `Tutor` e as da `dormindo` em `Onca.tsx` e `CabecaOnca.tsx`. **Correção exigida:** retirar essas mutações e registrar os quatro vetos na seção "Não trouxe" de `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`, com o motivo de cada um, porque o que é vetado vai ao relatório.

## Recomendações

- Escrever o critério na 9.7 do `docs/interface.md`: a onça assinada só entra onde a região guarda produção daquele agente. Assim a próxima rodada não reabre a dúvida.
- No vazio de Criados, o texto "peça ao Assistente no Início" e a onça assinada pelo Assistente se reforçam. Manter assim se o vazio mudar.
- Itens 6 a 9 (vigilância, nota em discursiva e redação, medição do professor): nada no diff toca neles.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-28 22:52:34 · `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

VEREDITO: APROVADO
Tela vista: sim (14 fotos lidas, 7 telas em computador e celular, cheia e vazia, com Criados nas duas)
Estados: ok. Carregando e erro de Criados não mudaram, e esses dois estados não aparecem na vitrine, então não os reconferi pelo código. O vazio de Criados foi conferido na foto e no teste. O vazio de filtro ("Nada com estes filtros") segue sem onça, e agora há teste que prova isso.
Acessibilidade: a onça é um SVG decorativo com `figcaption` e selo "IA", e o nome acessível é a função. Está parada (`animada={false}`), sem hover e sem animação em laço. O botão "Ir para Ferramentas" tem texto visível e mede acima de 44 px nas duas fotos. O contraste do texto é o do padrão do vazio, que não mudou.
Chromebook fraco: sem peso novo. `EstadoVazio` só recebe a ilustração por prop e não importa a `Onca`, então a entrada não a carrega. O SVG está parado e a pose `dormindo`, que era a mais pesada, saiu.
Celular: a 360 px o vazio de Criados não tem rolagem horizontal nem corte. A onça e o texto cabem, o botão principal tem cerca de 46 px, e a barra inferior não sobrepõe nada. A introdução, o Eu vazio e a atividade indisponível também estão sem corte, e "Rolam a 1366 × 768" é nenhuma. Não pedi projeto Playwright `celular`, e a cobertura dele fica para a validação.
Ação oficial protegida: sim. Nenhuma ação oficial foi tocada.

A ordem da rodada 1 foi cumprida. Conferi nas fotos e no diff (`diff-v3-r2.patch`):
- A pose `dormindo` saiu do tipo `Pose`, de `Onca.tsx`, de `CabecaOnca.tsx` (olhar e boca), do teste de fidelidade e do e2e `aluno-tutor.spec.ts`. A pausa do Tutor voltou ao ícone.
- Quatro lugares da onça saíram: Eu vazio (foto sem onça), atividade indisponível (foto sem onça), roteiro da Estrutura e a pausa do Tutor. Os componentes `Roteiro` e `Atividade` voltaram ao que eram.
- `avatar-so-nas-duas-pecas.test.ts` agora fecha a lista em `['areas/professor/artefatos/Criados.tsx']`.
- `docs/interface.md` traz o critério da assinatura e a tabela de poses atualizada.
- A foto do vazio de Criados mostra a onça `apontando`, de 120 px, com "Assistente de ensino" e selo "IA", e o texto é convite ("Escolha uma ferramenta, ou peça ao Assistente no Início…") com ação. A introdução mostra a onça `acenando` com as duas linhas ao lado da pata, assinada pelo Assistente de ensino, também sem rolagem.
- Termos técnicos, inglês e chaves de tradução: nenhum na tela. O pt-BR e a data no formato local (28/10/2026) estão corretos.
- Cor fora da paleta ou componente refeito: nada. A pele é a do sistema Turmma.

Bloqueantes: nenhum

Recomendações (não bloqueiam; a primeira já veio da rodada 1):
1. `apps/web/src/componentes/estado/EstadoVazio.tsx:24` (comentário) e `apps/web/src/componentes/estado/estados.test.tsx` (asserção do "padrão fica à esquerda"). A foto `vazia--professora--professor-criados--computador.png` mostra a onça centralizada sobre título e texto alinhados à esquerda, porque a `figure` da `Onca` já usa `items-center`. O comentário e o teste afirmam o contrário. Alinhar a onça à esquerda, ou corrigir o comentário e o teste.
2. As fotos do Eu vazio e da atividade indisponível não mostram onça, e isso é o esperado. A foto da Estrutura sem ano letivo (`vazia--coordenacao--coordenacao-estrutura--*.png`) e a da pausa do Tutor ficam para a validação confirmar, porque eram os lugares retirados.

Arquivos relevantes:
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/professor/artefatos/Criados.tsx`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/estado/EstadoVazio.tsx`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts`

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-28 22:52:42 · `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. O diff da rodada 2 só tira desenho e testes de desenho: a pose `dormindo`, os lugares da onça em Eu, Estrutura, Atividade e na pausa do Tutor, e as expressões `dormindo` e `fechada` da cabeça. O que sobra em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/professor/artefatos/Criados.tsx` (a onça no vazio "Nada gerado ainda") só aparece com a lista vazia. Ela leva o nome da função e o selo "IA", e nenhum dado de pessoa.

Fora da tabela de dados do docs/lgpd.md: nada. Não há campo, migration nem DTO novos.

Autorização por objeto: ok. Nenhuma rota, repository ou consulta foi alterada. A tela "Esta atividade não está disponível" continua com a mesma frase para "não existe" e "é de outra turma". Só saiu a ilustração.

Logs: limpos. Nenhum log foi adicionado ou alterado.

Auditoria: nada a exigir. Não há leitura de dado de aluno, exportação, nota, permissão nem aprovação de saída de IA neste diff.

Envio externo: nenhum.

Seed/fixture: sintético. A única fixture tocada é `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/__fixtures__/ids-do-desenho.ts`, que tira os ids do SVG antes de comparar. Não tem dado de pessoa.

Pergunta de fechamento: a resposta a "tudo o que o sistema guarda sobre um aluno e para onde foi" fica como estava. O diff não acrescenta dado guardado nem lugar para onde ele vai.

Bloqueantes: nenhum.

Recomendações:
- O texto da linha 10 de `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.tsx` ("dormindo (o vazio) ainda não tem lugar no produto") diz o mesmo que a tabela de `docs/interface.md` 9.7, que fecha a porta com "não entra". Vale escrever igual nos dois lugares, para ninguém ler "ainda" como convite a religar a pose na pausa do Tutor, que é o que o critério novo da 9.7 veda.
- O critério novo da 9.7 diz que a onça não entra "onde a IA não produziu o que a tela mostra". Ele ajuda a regra 20 por tabela: impede que a assinatura de um agente fique ao lado de região com dado de aluno que o agente não produziu. Hoje ele só existe na revisão e na lista fechada `TELAS_COM_A_ONCA`. Está bom assim; fica registrado para a retro.

## test-engineer · 2ª rodada · APROVADO · 2026-10-28 22:52:47 · `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Criados, caminho feliz:** o vazio verdadeiro, "Nada gerado ainda", mostra a onça apontando, assinada "Assistente de ensino" com o selo "IA" e parada.
- **Criados, casos de borda:**
  - o vazio do filtro, "Nada com estes filtros", não leva onça;
  - a lista com mais páginas por ler ou com filtro ligado não mostra o vazio verdadeiro (a condição que já existia: `!hasNextPage && ligados === 0`).
- **Permissão (cadeia fechada):** só as peças da lista fechada importam a `Onca`. Uma tela fora da lista que a importe faz o teste falhar.
- **`EstadoVazio`:** a ilustração vem antes do título, fica centralizada no tracejado e à esquerda no padrão, e toma o lugar do ícone. Sem ela, nada muda, e o ícone continua só no tracejado.
- **Linhas do aceno:** só a pose `acenando` as tem, com o traço do mockup (largura 5, cor da sombra, sem preenchimento) e sem classe de movimento.
- **Painel "O que falta" da Estrutura:** não tem onça.
- **Pose `dormindo`:** o tipo a recusa, depois do veto.
- **Isolamento:** não se aplica. A correção não toca dado de escola, API, banco nem tenant.

**Cobertos:**
- `Criados.test.tsx:145` (vazio: pose, assinatura, selo, parada) e `Criados.test.tsx:398` (filtro sem onça).
- `estados.test.tsx`: os dois casos citados nos três blocos de `EstadoVazio.tsx`.
- `avatar-so-nas-duas-pecas.test.ts`, com `TELAS_COM_A_ONCA = [Criados]`, que confere também que Criados está entre os importadores.
- `Onca.test.tsx › só a acenando leva as duas linhas…` e `fidelidade-ao-mockup.test.tsx › as duas linhas ao lado da pata…`.
- `Onca.test.tsx`: o `@ts-expect-error` com `dormindo`.
- `Estrutura.test.tsx:342`, com o seletor `'img, [data-onca]'`.

Cada linha de "Teste que reproduz" tem o seu teste, achado pelo nome. Os 8 arquivos (138 casos) passam. Não há `.skip`, teste comentado nem mock que esconda a regra, e nada aqui chama IA.

**As correções exigidas na rodada 1:**
1. **Cerca do bloco feita.** O último bloco (`if (tracejado && Icone !== undefined)`) está fechado, e `node tools/processo/mutacoes.ts --faltando` responde "Nenhuma linha nova de produção com condição fica sem bloco".
2. **Seletor feito; o bloco de mutação ficou sem objeto.** O seletor foi trocado para `'img, [data-onca]'`. O bloco que passaria `ilustracao={<Onca/>}` ao `Roteiro` não dá mais para declarar: os vetos tiraram a prop `ilustracao` do `Roteiro` (`OQueFalta.tsx`) e o import da `Onca` em `Estrutura.tsx`. Hoje a única forma de pôr a onça no painel é importá-la em `Estrutura.tsx` ou em `OQueFalta.tsx`, e a lista fechada de `avatar-so-nas-duas-pecas.test.ts` reprova isso. Com o seletor novo, o teste da Estrutura também fica vermelho. Não sobra cláusula nova sem bloco.

A recomendação da rodada anterior (o vazio "Nada com estes filtros" sem onça) foi aplicada em `Criados.test.tsx:406`.

As linhas tiradas de `Atividade.tsx`, `ComoEstouIndo.tsx`, `Tutor.tsx` e `e2e/aluno-tutor.spec.ts` (os lugares vetados) voltaram ao HEAD, e o `git status` não os lista. A foto do vazio de Criados no celular confere: a onça assinada "Assistente de ensino · IA" aparece sobre "Nada gerado ainda".

**Bloqueantes:** nenhum.

**Recomendações:**
- Escrever em uma linha, no documento (`tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`, em "Correção" ou em "Mutações"), por que o bloco do `Roteiro` pedido na rodada 1 não foi declarado: a prop saiu com o veto, e a lista fechada de importadores é o que guarda a regra. Sem isso, a validação vai procurar o bloco.
- Em `Onca.test.tsx`, o caso das linhas do aceno confere que cada `path` não tem classe, mas não confere o `<g data-parte="movimento">` que as agrupa. Vale acrescentar `expect(grupo.getAttribute('class')).toBeNull()`, para que uma animação posta no grupo não passe.
- No caso do vazio de Criados, conferir também que o tamanho da onça é 120 (a largura do `svg`), já que a tabela da 9.7 o declara.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-28 22:52:49 · `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. O diff só mexe na tela da pausa do Tutor (`apps/web/src/areas/aluno/Tutor.tsx`): a onça saiu e voltou o ícone lucide. Não há chamada nova, request novo nem estado novo.
Rate limit: ok. Nada mudou no servidor.
Fila e prioridade: ok. Não se aplica, o diff não cria job.
Concorrência: protegida. Não há escrita nova.
Índice e paginação: ok. Não há query nova.
Degradação de IA: não se aplica. A pausa do Tutor continua sendo um aviso com `role="status"`, sem erro cru e sem "Tentar de novo", e o e2e (`e2e/aluno-tutor.spec.ts`) segue cobrindo isso.
Migration: não se aplica.
Métrica e alerta: ok. Não há código novo no caminho quente.
Bloqueantes: nenhum.
Recomendações:
- A recomendação da 1ª rodada sobre o pacote inicial ficou mais simples. Agora só `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/professor/artefatos/Criados.tsx:13` importa a `Onca`, além das peças que já importavam (`Introducao`, `IntroducaoDoPapel`, `Comemoracao` e as `BemVindo` de cada papel). A tela do aluno no Tutor não carrega mais o SVG do corpo inteiro. Não precisa de ação.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-28 22:52:49 · `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. O diff desta rodada (`/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/.processo/ordens/diff-v3-r2.patch`) e o que está modificado na working tree só mexem em `apps/web`, em testes de front e em `docs/interface.md`. Não há migration, schema nem repository.

Queries verificadas: nenhuma nova nem alterada. Procurei no diff por `escolaId`, `anoLetivoId`, `useQuery`, `fetch(`, `/v1/`, `consulta*`, `useSearch`, `pgTable` e `@SemEscopo` e não achei nada. Em `apps/web/src/areas/professor/artefatos/Criados.tsx` a mudança é só a onça estática no vazio "Nada gerado ainda", que só aparece quando a lista já lida do próprio professor está vazia. A consulta é a mesma de antes e nada é enviado ao servidor. `apps/web/src/componentes/estado/EstadoVazio.tsx` ganhou só a prop de apresentação `ilustracao`. Saíram a pose `dormindo` e a onça de `Atividade.tsx`, `ComoEstouIndo.tsx`, `Estrutura.tsx`/`OQueFalta.tsx` e da pausa em `Tutor.tsx`, sem tocar em nenhum caminho de dados. A mensagem "Esta atividade não está disponível / Ela pode ser de outra turma, ou o endereço está errado" continua a mesma para inexistente e para alheio, sem distinção.

Teste de isolamento: não se aplica. Não há módulo, endpoint nem consulta nova, e os testes de isolamento que já existem não foram tocados.

Bloqueantes: nenhum.

Recomendações: nenhuma no escopo de isolamento. A rodada anterior não exigiu correções, então não havia nada a conferir.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-28 22:53:09 · `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A correção só mexe em `apps/web` e em docs, sem API, job, seed, importação nem webhook. Todos com autor humano? sim, nada mudou nesses caminhos.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhum fluxo de saída de IA mudou. Na foto da introdução da professora (`vazia--professora--professor-bem-vindo--computador.png`) segue a frase "Nada do que eu preparo chega à turma sem a sua aprovação."
Supervisão do tutor: ok. A `Pausa` voltou a ser igual à da `HEAD`, com ícone por motivo, e não sobrou rastro da pose `dormindo`.
Autonomia declarada e visível: sim, e a correção não mexe nisso. As duas onças que ficaram vão assinadas pela função, com o selo "IA", nas fotos de Criados vazio e da introdução, no computador e no celular.
Bloqueantes: nenhum

As correções exigidas na rodada anterior, uma a uma:
- **B1, pose `dormindo`: feita.** Saiu de:
  - `POSES` e `TamanhoDaOnca` em `Onca.tsx`;
  - o componente `Deitada` e as rosetas do lombo;
  - o olhar `dormindo` e a boca `fechada` em `CabecaOnca.tsx`;
  - o caso dela em `avatar-so-nas-duas-pecas.test.ts`;
  - o bloco dela em `fidelidade-ao-mockup.test.tsx`;
  - as asserções em `e2e/aluno-tutor.spec.ts`;
  - a linha dela em `docs/interface.md`, que agora diz "não entra".

  A `Pausa` em `Tutor.tsx` voltou a usar `ICONE_DA_PAUSA`, sem diferença para a `HEAD`. Em `Onca.test.tsx:51-53` voltou o `@ts-expect-error` que prova que o tipo recusa `dormindo`. Fora de comentário, `dormindo` não aparece mais em código de produto.
- **B2, roteiro da Estrutura: feita.** Saíram a prop `ilustracao` e o `div` de `OQueFalta.tsx`, a onça de `Estrutura.tsx` e a asserção do teste. O arquivo saiu de `TELAS_COM_A_ONCA`. De bônus, o seletor do painel em `Estrutura.test.tsx` passou a `'img, [data-onca]'`, que agora consegue achar alguma coisa.
- **B3, "Esta atividade não está disponível": feita.** Saíram o import da onça, a `ilustracao` e a asserção. A foto `aluno--aluno-atividades-00000000-…--computador.png` mostra o vazio sem onça.
- **B4, "Como estou indo": feita.** Saíram o import, a `ilustracao` e a asserção em `Eu.test.tsx`. A foto `vazia--aluno--aluno-eu--computador.png` mostra "Nada corrigido ainda" sem onça e sem assinatura do Tutor.
- **B5, mutações e registro dos vetos: feita.** O bloco "Mutações" do documento da tarefa só cobre o que ficou: as linhas do aceno, a `ilustracao` do `EstadoVazio` e a onça de Criados. Os quatro vetos estão em "Não trouxe", cada um com o motivo. O único lugar que importa a onça de corpo inteiro é `Criados.tsx`, e `TELAS_COM_A_ONCA` tem só esse arquivo.
- **Recomendação da rodada anterior: aplicada.** O critério "só entra numa região que guarda produção daquele agente" está na 9.7 de `docs/interface.md`.

As fotos, item a item:
- **Criados vazio** (`vazia--professora--professor-criados--computador.png` e `--celular.png`): a onça apontando vem assinada "Assistente de ensino" com o selo "IA". Sem nota e sem nada que puxe uso.
- **Criados cheio** (`professora--professor-criados--computador.png` e `--celular.png`): sem onça, como o teste do filtro vazio também confere.
- **Introdução** (`vazia--professora--professor-bem-vindo--computador.png` e `--celular.png`): as duas linhas do aceno são traço parado.

Recomendações:
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.tsx:10` diz que `dormindo` "ainda não tem lugar no produto", e o comentário em `Onca.test.tsx:52` diz o mesmo. A 9.7 de `docs/interface.md` é mais firme: diz que não entra e explica por quê. Vale alinhar o texto do código ao da 9.7, para ninguém ler "ainda" como uma porta aberta.
- Na foto de Criados vazio no computador, a onça aparece centralizada e o texto à esquerda, mas o comentário de `EstadoVazio.tsx` diz "no padrão à esquerda". A decisão é do `frontend-reviewer`, e o ponto já está no `TODO.md`; anoto só porque o comentário e a tela não batem.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-28 22:53:21 · `tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`

**VEREDITO: APROVADO**

**Escopo:** respeitado. Ficaram só os dois itens que o `conformidade-reviewer` aprovou: a onça no vazio "Nada gerado ainda" de Criados e as duas linhas do aceno. Os quatro lugares vetados e a pose `dormindo` saíram da árvore. Contra o HEAD (`d12a9ba0`), `Tutor.tsx`, `Atividade.tsx`, `ComoEstouIndo.tsx`, `Estrutura.tsx`, `OQueFalta.tsx`, `CabecaOnca.tsx`, `ids-do-desenho.ts`, `movimento-da-onca.test.tsx` e `e2e/aluno-tutor.spec.ts` não têm diferença.

**Aderência à Tech Spec:** ok.
- **Correção exigida 1, feita pela segunda saída:** a `dormindo` saiu desta correção. `POSES` tem quatro poses e o tipo recusa `dormindo` (`Onca.test.tsx`, com o `@ts-expect-error`). O único `dormindo` fora de teste é o comentário de `Onca.tsx:10`, que diz que ela não entra.
- **Com a D80:** `docs/interface.md` 9.7 agora diz "Dormindo · não entra", o que bate com a revisão da D80 de 28/10 em `docs/decisoes.md:1505`.
- **As linhas do aceno:** o texto antigo da 9.7 as punha em "não entra", mas a D80 em `decisoes.md` não as cita. Entraram com parecer do revisor, então não há decisão a rever.

**Portão local:** carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo).

**Código sem uso por causa do que saiu:** nada sobrou.
- `TamanhoDaOnca` voltou a `88 | 120 | 160`, e o único lugar novo usa 120.
- O `Deitada`, as `ROSETAS_DO_LOMBO`, o olhar `dormindo`, a boca `fechada`, os imports `CABECA_D` e `Roseta`, a prop `ilustracao` do `Roteiro`, o `ICONE_DA_PAUSA` e o padrão `deitada|cabeca` de `semIdsDoDesenho` saíram ou voltaram ao que eram.
- `TELAS_COM_A_ONCA` só tem Criados.
- O documento da tarefa descreve só o que ficou: na tabela, na Correção, no Teste que reproduz e nas Mutações. As linhas de código citadas nas mutações batem com `Criados.tsx:185`, `EstadoVazio.tsx` e `Onca.tsx`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Comentário que não confere com a tela.** `apps/web/src/componentes/estado/EstadoVazio.tsx:22-24` diz "no padrão à esquerda". Só o invólucro fica à esquerda: a `figure` da `Onca` é `flex flex-col items-center` e ocupa a largura toda, então a onça sai centralizada sobre um texto alinhado à esquerda. O teste em `estados.test.tsx` só olha a classe do invólucro. É o mesmo achado do `frontend-reviewer`.
2. **Entrada no `TODO.md` que não existe.** A tabela "Recomendações sem aplicar" da tarefa dá `TODO.md` como destino desse item, e o `TODO.md` não foi alterado. Anotar antes do pouso, como a v1 fez no commit `fbf7400a`.
3. **Ramo sem quem chame.** Em `EstadoVazio.tsx:31`, o `TopoDoVazio` trata ilustração no `tracejado`, que nenhuma tela usa hoje (Criados usa o padrão). Ou fica, por ser barato e testado, ou sai até um vazio tracejado pedir a onça.
4. **Seção Sintoma da tarefa.** Ela ainda lista os cinco lugares do m1. Está correto, porque é o sintoma de origem, mas uma remissão curta a "Não trouxe" logo ali ajudaria quem lê só o topo.

Arquivos citados:
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/estado/EstadoVazio.tsx`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/professor/artefatos/Criados.tsx`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.tsx`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/tasks/correcoes/2026-10-28-onca-do-mockup-v3.md`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/docs/interface.md`

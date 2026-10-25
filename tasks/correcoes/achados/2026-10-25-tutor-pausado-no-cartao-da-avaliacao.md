# Achados das revisões — `tasks/correcoes/2026-10-25-tutor-pausado-no-cartao-da-avaliacao.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 14:48:32 · `tasks/correcoes/2026-10-25-tutor-pausado-no-cartao-da-avaliacao.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: Início do aluno a 1366 px e a 360 px, escola cheia e escola vazia). Nenhuma mostra cartão de tarefa. Os dois pares são o estado "Nenhuma tarefa por agora" e são iguais, porque a vitrine não tem tarefa avaliativa. O cartão com aviso e os dois links só pude conferir pelo código.
Estados: ok. A tarefa não altera tela. A alteração é só em `e2e/aluno-fluxo.spec.ts`. O estado vazio da foto convida ("O Tutor ajuda nas tarefas. Quando houver uma, ela aparece aqui.") e traz o botão "Ver todas as tarefas".
Acessibilidade: ok. O teste usa papéis (`listitem`, `link` "Pedir ajuda ao Tutor"), então confirma que o link tem nome acessível.
Chromebook fraco: não se aplica, porque nada muda no produto. O caso do e2e leva 15,6 s e 17,1 s no ambiente local, com timeout de 180 s no teste.
Celular: ok. Nas fotos de 360 px não há rolagem horizontal nem texto cortado. Os botões "Ver todas as tarefas" e "Sair" parecem ter 44 px de altura ou mais. O e2e roda nos projetos `chromebook` e `celular` e usa `tap()` quando há toque.
Ação oficial protegida: sim, e a tarefa não toca em ação oficial. O caminho até o Tutor continua aberto na avaliação (D36), e o aviso de que o Tutor fica pausado aparece antes de abrir.

Conferi o diff contra o código:
- `apps/web/src/areas/aluno/Inicio.tsx:26` renderiza o cartão como `<li>`, e é nele que o teste filtra por `hasText: titulo`.
- `Inicio.tsx:32` põe o aviso `AVISO_DA_AVALIACAO` no cartão, fora dos links. A mutação declarada, que remove essa linha, deixa o `toContainText` do teste vermelho.
- `Inicio.tsx:35` tem o link "Pedir ajuda ao Tutor", que é o alvo do clique. A URL esperada, `/aluno/tutor/<id>`, não muda.
- O novo seletor repete o recorte de `e2e/aluno-inicio.spec.ts:103-105`, que já está coberto. O ajuste não contradiz a tela da 3.0.

Bloqueantes: nenhum.
Recomendações:
- Faltou foto da tela com avaliação aberta. Se a validação quiser ver o cartão com o aviso, dá para fotografar com um seed que tenha tarefa avaliativa: `node tools/vitrine/vitrine.ts foto aluno /aluno/inicio`.
- O texto "Avaliação: o Tutor fica pausado até quem dá a aula encerrar." está repetido no e2e e em `AVISO_DA_AVALIACAO`. Se o texto mudar, o e2e quebra de novo, e importar a constante evitaria isso. Não bloqueia, porque o teste precisa provar o texto que o aluno lê.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 14:48:42 · `tasks/correcoes/2026-10-25-tutor-pausado-no-cartao-da-avaliacao.md`

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
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/aluno-fluxo.spec.ts:175`: o `getByRole('listitem').filter({ hasText: titulo })` pega o título por substring. Hoje acha só um cartão, porque a escola montada tem uma tarefa e a busca fica dentro de `principal(page)`. Se o Início passar a ter outro item cujo texto contenha "Prova de estequiometria", o locator acha dois e o Playwright falha por modo estrito. Para isso não acontecer, vale prender a busca ao link do título, com `filter({ has: page.getByRole('link', { name: titulo, exact: true }) })`, ou ao `data-*` do cartão.

A mudança está só no e2e: ela mexe no seletor e troca o link que o teste clica. Não toca `apps/` nem `packages/`, não acrescenta rota, query, job nem chamada de modelo. Conferi em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Inicio.tsx` (linhas 26, 32 e 35) que o cartão é um `<li>` e que o aviso da avaliação e o link "Pedir ajuda ao Tutor" ficam dentro dele. Então o seletor novo bate com a tela, e a mutação que a tarefa declara deixaria o caso vermelho. O caso continua com `test.setTimeout(180_000)`.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 14:48:42 · `tasks/correcoes/2026-10-25-tutor-pausado-no-cartao-da-avaliacao.md`

**VEREDITO: APROVADO**

A tarefa só muda um teste. O diff mexe apenas no caso de `e2e/aluno-fluxo.spec.ts` que começa na linha 167, e nenhum arquivo de `apps/` ou `packages/` foi tocado. Conferi o novo localizador contra a tela de verdade em `apps/web/src/areas/aluno/Inicio.tsx`. O cartão é um `<li>` (linha 26), o aviso da avaliação fica nele (linha 32), e o link "Pedir ajuda ao Tutor" também (linha 35). O teste continua conferindo, no mesmo caso:
- o aviso aparece antes de abrir;
- o Tutor fica pausado com o título da avaliação;
- a pergunta comum é recusada sem selo de IA;
- o assunto delicado ainda chega a um humano, com o link para o 188 (D36).

A correção não enfraquece nada; o caso fica um pouco mais forte. Agora ele prova que o aviso está no cartão da tarefa e que o caminho até o Tutor pelo Início continua aberto. A mutação declarada (tirar o aviso de `Inicio.tsx:32`) deixaria o caso vermelho.

As fotos (cheia e vazia, computador e celular) não mostram nada contra a regra 70. O Tutor aparece com o selo "IA" e com o aviso "Quem dá a aula acompanha como você usa o Tutor.", que cumpre os itens 4 e 4a. Não há nota, conceito nem sugestão de nota. "Sair" está à vista nas duas larguras, o que atende D59. Não há nada que puxe o aluno a usar mais.

```
VEREDITO: APROVADO
Caminhos de escrita em Nota: nenhum tocado por esta tarefa — todos com autor humano? sim (não muda)
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok (a tarefa não cria saída de IA)
Supervisão do tutor: ok — o caso continua provando a pausa durante a avaliação e o 188 no assunto delicado; a foto mostra o aviso de acompanhamento
Autonomia declarada e visível: sim (não muda)
Bloqueantes: nenhum
Recomendações:
- As fotos não mostram o cartão da avaliação aberta, porque a vitrine não atribui tarefa avaliativa ao aluno. Por isso o aviso "Avaliação: o Tutor fica pausado…" (Inicio.tsx:32) só foi conferido no código e no teste, não visto na tela. Vale a vitrine cheia ganhar uma avaliação aberta para que a próxima rodada consiga ver o aviso como o aluno vê.
- `getByRole('listitem').filter({ hasText: titulo })` depende de haver uma só tarefa com aquele título. Hoje é verdade, porque `montarEscola` cria uma. Se o seed passar a criar duas, o modo estrito do Playwright falha com uma mensagem confusa. Um `.first()` explícito, ou um título com sufixo único, deixaria isso firme.
```

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/aluno-fluxo.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Inicio.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-tutor-pausado-no-cartao-da-avaliacao.md

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 14:48:46 · `tasks/correcoes/2026-10-25-tutor-pausado-no-cartao-da-avaliacao.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A tarefa só altera `e2e/aluno-fluxo.spec.ts`, no trecho das linhas 173 a 179. Ali o teste deixa de procurar o aviso dentro do link do título e passa a procurá-lo no cartão da tarefa no Início; o clique agora vai no link "Pedir ajuda ao Tutor" desse cartão. Nada muda em `apps/`, em `packages/`, em migration, DTO ou rota.

Fora da tabela de dados do docs/lgpd.md: nada. Não há campo novo.

Autorização por objeto: não muda. Nenhuma rota ou repository foi alterado. O teste continua indo a `/aluno/tutor/<atividadeAplicadaId>` com o próprio aluno, que está na turma.

Logs: limpos. Não há log novo; o diff só tem asserções de Playwright.

Auditoria: nada a exigir. Nenhuma ação que a regra 20, item 10, obriga a auditar foi tocada.

Envio externo: nenhum novo. O caso roda contra o adaptador falso do ambiente de teste. A mensagem "sofro bullying na escola" é texto sintético que já estava no caso.

Seed/fixture: sintético. O teste cria escola, professora, aluno e colega com `criarEquipeComSenha` e `criarAlunoComMatricula`, sem mudança nesta tarefa. Os títulos ("Prova de estequiometria") são fictícios.

Fotos da tela: nas quatro fotos de `/aluno/inicio` (escola cheia e vazia, no computador e no celular), o aluno vê o próprio nome sintético e o nome da escola sintética. Não aparece colega, matrícula, nota nem conteúdo de outra pessoa. As fotos não mostram cartão de tarefa, porque a vitrine não tem tarefa avaliativa atribuída. Por isso, o que o cartão mostra (título, resumo, aviso da avaliação e o link para o Tutor) foi conferido no código, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Inicio.tsx:24-35`, e não na foto. Nada ali expõe dado de terceiro.

Bloqueantes: nenhum.

Recomendações:
- O caso alterado não confere que o nome do colega fica fora do Início e do Tutor pausado; essa checagem existe só no caso do diagnóstico. Uma linha `await expect(page.locator('body')).not.toContainText(colega.nome)` depois da pausa do Tutor fecharia essa lacuna, de graça. Não bloqueia: a tela não mudou, e a conferência já existe em outro caso do mesmo arquivo.

## test-engineer · 1ª rodada · APROVADO · 2026-10-25 14:48:52 · `tasks/correcoes/2026-10-25-tutor-pausado-no-cartao-da-avaliacao.md`

VEREDITO: APROVADO

Cenários exigidos:
- **Caminho feliz:** com uma avaliação aberta, o cartão da tarefa no Início mostra o aviso "Avaliação: o Tutor fica pausado até quem dá a aula encerrar." antes de o aluno abrir a tarefa (RF5). O link "Pedir ajuda ao Tutor" daquele cartão leva a `/aluno/tutor/<id>`, e lá o Tutor aparece pausado com o título da avaliação.
- **Caso de borda (avaliação):** com a avaliação aberta, a pergunta comum é recusada sem erro na tela, e a mensagem de bullying ainda recebe o 188 (D36).
- **Caso de borda (estrutura do cartão):** o aviso fica fora dos dois links. O teste precisa achar o aviso no cartão e chegar ao Tutor pelo link certo, e não pelo link do título, que abre a tarefa.
- **Permissão, isolamento e concorrência:** não se aplicam. Só o e2e mudou: nenhum endpoint, repository, dado de escola ou operação que possa rodar duas vezes foi tocado. O colega e a escola isolada continuam cobertos pelo primeiro caso do arquivo, que não mudou.

Cobertos:
- **O aviso no cartão:** `e2e/aluno-fluxo.spec.ts:175-176`. O cartão é localizado como o `listitem` que contém o título, e o teste exige o aviso dentro dele. A mutação declarada apaga o aviso em `apps/web/src/areas/aluno/Inicio.tsx:32`, e aí o caso fica vermelho na linha 176. O motivo do vermelho é o certo, porque o cenário chega à cláusula. O portão rodou essa mutação: `.processo/portao.json` registra 1 mutação e o alvo `e2e/aluno-fluxo.spec.ts`.
- **O caminho até o Tutor:** `e2e/aluno-fluxo.spec.ts:179-180`. O clique vai no link "Pedir ajuda ao Tutor" daquele cartão, e a URL `/aluno/tutor/<id>$` confirma que é o link do Tutor e não o do título. Se o link apontasse para a tarefa, o teste falharia.
- **Pausa, recusa e 188:** linhas 181-205, sem mudança e com asserções sobre o resultado.
- **Prazo:** 15,5 s no `chromebook` e 17,1 s no `celular`, contra `setTimeout(180_000)` no HEAD (`.processo/e2e-duracao.json`). Fica bem abaixo da metade do prazo, sem depender de máquina folgada.
- O diff não tem `.skip`, teste comentado nem mock. O e2e roda contra a API real com o adaptador de IA falso do ambiente de teste.
- A seção "Mutações" bate com o `git diff`. O diff não toca `apps/` nem `packages/`, então não há cláusula nova de produção sem bloco.

Bloqueantes: nenhum.

Recomendações:
1. `e2e/aluno-fluxo.spec.ts:175`: `getByRole('listitem').filter({ hasText: titulo })` depende de o título não aparecer em nenhum outro `listitem` dentro de `main`. Hoje isso vale. Para ficar à prova de mudança no layout, o cartão pode ser recortado pela seção "Para fazer" do Início, se ela tiver nome acessível, como o primeiro caso já faz na lista de Tarefas.
2. O caso não prova que o aviso fica fora do link do título. Isso não é preciso aqui, porque `Inicio.test.tsx` e `aluno-inicio.spec.ts` já cobrem a estrutura. Fica só registrado para a validação.

Não alterei nenhum arquivo e não rodei o e2e. Me apoiei no registro do portão e no `git diff`.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/aluno-fluxo.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Inicio.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-tutor-pausado-no-cartao-da-avaliacao.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 14:59:38 · `tasks/correcoes/2026-10-25-tutor-pausado-no-cartao-da-avaliacao.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- O cartão da avaliação no Início mostra o aviso "o Tutor fica pausado" antes de abrir (RF5).
- O "Pedir ajuda ao Tutor" desse cartão leva a `/aluno/tutor/<id>` (D36).
- O Tutor aparece pausado, com o título da avaliação.
- A pergunta comum é recusada, e o assunto delicado ainda recebe o 188.
- O cartão é achado pelo link com exatamente o título, e não por outro item que só cite o título no texto.
- O nome do colega da mesma turma não aparece na tela do aluno (regra 50, item 9).

**Cobertos:**
- **Aviso no cartão:** `e2e/aluno-fluxo.spec.ts:176-177`. O primeiro bloco de mutação, que tira o `<p>` do aviso, fica vermelho pela cláusula.
- **Recorte por link exato:** `e2e/aluno-fluxo.spec.ts:176`. O segundo bloco, com o título virando "Prova de estequiometria (nova)", distingue o recorte novo do antigo:
  - Com o `filter({ hasText: titulo })` antigo, o texto continuaria contendo o título e o teste passaria.
  - Com `has: getByRole('link', { name: titulo, exact: true })`, o nome do link deixa de ser exato, `naLista` fica vazio e a asserção da linha 177 vence o prazo. O vermelho vem do motivo certo: o cartão não é achado.
  - O nome do link é exatamente o título, porque o `<Link>` só contém o `<span>{atividade.titulo}</span>` (`apps/web/src/areas/aluno/Inicio.tsx:28-30`). O `exact: true` acha o cartão no estado sem mutação.
- **Caminho até o Tutor e pausa:** linhas 180-185.
- **Recusa e 188:** linha 189 em diante, sem mudança nesta rodada.
- **Colega:** linha 187. O `colega` é aluno da mesma turma (`montarEscola`, linhas 52-53), então o dado existe na escola e a asserção não é vazia por construção.

**A justificativa da asserção do colega sem mutação se sustenta.** Nenhuma tela do aluno recebe o nome do colega, então não há trecho de `apps/` cuja retirada deixe a asserção vermelha; para isso seria preciso inventar um caminho de vazamento. A tarefa também não altera código de produção, então o RF17 não se aplica. O padrão é o mesmo das linhas 122 e 159 do arquivo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **O comentário em `e2e/aluno-fluxo.spec.ts:186` promete mais do que o teste faz.** Ele diz "Nem o Início nem o Tutor pausado", mas a asserção da linha 187 roda depois da navegação para `/aluno/tutor/<id>`, com só o Tutor pausado na tela. O Início não é conferido, nem neste caso nem nas linhas 122 e 159. O mesmo exagero está no documento, na linha 75: "no Início e no Tutor pausado". Há dois caminhos:
   - repetir `await expect(page.locator('body')).not.toContainText(colega.nome)` logo depois da linha 177, ainda no Início;
   - ou corrigir o comentário e o documento para "o Tutor pausado".
2. **As três recomendações recusadas são aceitas.** O motivo de cada uma, na seção "Recomendações sem aplicar", se sustenta:
   - importar `AVISO_DA_AVALIACAO` esconderia o texto que o aluno lê;
   - a vitrine já está em `TODO.md:139`;
   - a estrutura do aviso fora do link já é coberta por `Inicio.test.tsx` e `aluno-inicio.spec.ts`.

Arquivos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/aluno-fluxo.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-tutor-pausado-no-cartao-da-avaliacao.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Inicio.tsx`

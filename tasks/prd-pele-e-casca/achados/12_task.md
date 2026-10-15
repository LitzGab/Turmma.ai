# Achados das revisões — `tasks/prd-pele-e-casca/12_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-15 18:14:54 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. A única novidade que envolve pessoa é a bolinha com as iniciais no pé da lateral (`iniciaisDe`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/MenuDaPessoa.tsx:386`). Ela sai do `nome` que o `/v1/eu` já entregava e que a casca já mostrava. Fica com `aria-hidden`, não é gravada e não vai para lugar nenhum. Só aparece no pé da própria pessoa, nunca no trilho. Como `pessoa` vem de `dados`, quando a sessão passa para outra pessoa as iniciais acompanham, e as da pessoa anterior não ficam na tela. O pedaço de `lembrarQuemEsta` e o que fecha a gaveta ao trocar de usuário não mudaram.

**Fora da tabela de dados do docs/lgpd.md:** nada. A tarefa explica em "Divergências" por que a tabela não muda, e a explicação está correta.

**Autorização por objeto:** ok. A tarefa é só de frontend: nenhuma rota, DTO, repository ou consulta nova. O seletor de escola mostra os mesmos campos de antes (`escolaNome`, `redeNome`, papel), só com outro visual.

**Logs:** limpos. Não entrou `console.*` nem log no diff.

**Auditoria:** nada a exigir. A tarefa não tem leitura de dado de aluno por coordenação, exportação, nota, permissão ou aprovação de saída de IA.

**Envio externo:** nenhum.

**Armazenamento no navegador:** a função `lateral-recolhida.ts` só mudou de arquivo. A chave continua `educa.lateral-recolhida` e o valor é só `sim`, sem nada da pessoa nem da escola (regra 50, item 7). O teste `lateral-recolhida.test.ts:24` confirma que só essa chave existe no armazenamento.

**Seed/fixture:** sintético. Os e2e usam `criarEquipeComSenha` e `criarAlunoComMatricula`, sem nenhum dado real.

**Fotos da tela:** não vieram no prompt, então conferi só pelo código. O que aparece na casca é o nome e o papel da própria pessoa, o nome da escola e da rede no seletor e os rótulos dos lugares. Não aparece nada de outro titular.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Falta um teste de componente que mostre a bolinha das iniciais ausente no trilho e ausente sem `nome`. Isso já vale pelo código, mas hoje só está garantido por leitura.
2. A preferência da lateral recolhida continua de uma pessoa para a seguinte no Chromebook do carrinho. Não é dado pessoal e já era assim antes. Se um dia a lista do que o navegador guarda crescer com algo ligado à pessoa, a troca de sessão precisa limpar isso.
3. O nome da constante `TITULO_DA_NOVA_CONVERSA` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/__fixtures__/casca.ts:99`) ficou com o nome antigo de propósito. Vale renomear quando os specs que a usam forem mexidos de novo.

**Pergunta de fechamento:** a tarefa não guarda nem envia nada novo sobre aluno. O que o sistema responde sobre um aluno específico é o mesmo de antes desta tarefa.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-15 18:15:33 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: AJUSTES NECESSÁRIOS
Tela vista: sim (18 fotos lidas: professora, coordenação e aluno a 1366 px, abertas e recolhidas, cheia e vazia; celular só conferido em 3). A foto de 900 px não existe; ela só o e2e mede.
Estados: ok. Carregando e erro não aparecem na vitrine e esta tarefa não os altera. O estado vazio da coordenação e do aluno convida e diz o próximo passo. A tela vazia do professor não tem esse problema, a lateral está completa e a ausência de "Esperando você" é correta.
Acessibilidade: ok pelo que se vê. `aria-current` no lugar aceso, `aria-hidden` nos ícones, nome por `sr-only` e dica no foco do trilho, e alvo de 52 px. Ressalva: o e2e do "Sair" usa `toBeInViewport()` sem razão, o que aprova um botão cortado (bloqueante abaixo).
Chromebook fraco: sem peso novo, os ícones são ligados à casca (+600 bytes em brotli, medido na tarefa). A altura é o problema (bloqueante).
Celular: sem regressão nas fotos de 360 px (barra de topo com "Sair" de 44 px, sem rolagem horizontal). A barra de baixo e a gaveta são da 13.0.
Ação oficial protegida: sim. Esta tarefa não toca aprovação.

Bloqueantes:

1. **O "Sair" da lateral aberta fica cortado em 1366×768 para a coordenação, e fica sem alcance quando a janela é mais baixa.**
   - **Visto em:** `.processo/vitrine/coordenacao--coordenacao-governanca--computador.png` e `vazia--coordenacao--coordenacao-governanca--computador.png`. O ícone e o botão "SAIR" (centro em y≈762) terminam na borda da lateral em y=768. O botão tem 52 px e passa de 788, então ficam uns 20 px abaixo do que cabe.
   - **Causa:** em `apps/web/src/componentes/CascaDaEscola.tsx:81`, `LateralAberta` põe o pé (`mt-auto`, linhas 98 a 101) dentro do mesmo `overflow-y-auto` da navegação. Os lugares de 52 px mais a Aparência passaram os 768 px com 7 itens.
   - **Por que importa:** o "Sair" só aparece rolando uma lateral sem barra visível. O Chromebook de referência tem janela de uns 650 px, e com zoom de 125% é pior. Isso contraria RF15, A18 ("Sair à vista, sem abrir nada") e D59 ("sair nunca é mais difícil que entrar").
   - **Também no trilho:** o `Trilho` (`CascaDaEscola.tsx:140`) é `h-screen` sem `overflow`. A coordenação precisa de uns 612 px, então abaixo disso o "Sair" some e não se rola até ele. O desenho do trilho exige a dica `absolute`, então o `overflow-y-auto` não serve ali.
   - **Mesmo defeito na gaveta:** a lateral aberta por cima, de 768 a 1023 px, usa a mesma `LateralAberta`.
   - **Correção exigida:**
     - Em `LateralAberta`, tire o pé (`ListaDeItens` do rodapé e `MenuDaPessoa`) do contêiner que rola e deixe-o `shrink-0` no fim da coluna. Só a marca, o seletor, a navegação e "Seu time" rolam, e o "Sair" fica sempre dentro da janela.
     - No trilho, garanta o mesmo: o "Sair" e o que vem antes dele não podem sair da janela em 600 px de altura.
     - Em `e2e/casca.spec.ts:597`, troque `toBeInViewport()` por `toBeInViewport({ ratio: 1 })`.
     - Rode `conferirOSair` também com altura menor que 768 (por exemplo 1366×600 e 900×600), nos três papéis, aberta e recolhida.
   - **Mutação exigida na tarefa:** devolver o pé para dentro do `overflow-y-auto` precisa deixar esse teste vermelho. A tarefa não tem mutação para isso.

Recomendações:
- `e2e/casca.spec.ts:593-600`: o teste de A18 só falha se o "Sair" sumir por inteiro, e é o que deixou passar o corte acima. Cabe um teste de unidade de que o pé é irmão do contêiner que rola.
- O papel aparece em minúscula e no masculino sob o nome ("professor" para "Professora", "coordenação"). Vale usar o rótulo do papel já com a capitalização dos outros textos.
- O `Aparência` ocupa 60 px do pé em todo papel. Com o pé fora da rolagem (correção acima), ele pesa na altura do Chromebook. Considere um seletor mais compacto na 13.0 ou X2.

Arquivos de referência:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/CascaDaEscola.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/vitrine/coordenacao--coordenacao-governanca--computador.png`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-15 18:16:47 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: REPROVADO
Escopo: respeitado. A 12.1 diz "Sair à vista" e marca [x], mas ele não fica à vista para a coordenação (bloqueante 1).
Aderência à Tech Spec: divergência em `techspec.md` 9 (a família de cor de cada ícone `lucide`) e em `techspec.md` 10 (a exceção de `border-transparent` na guarda de cor). As duas foram registradas só no `12_task.md`.
Portão local: carimbo válido

Bloqueantes:

1. **O "Sair" sai da janela para a coordenação. Viola RF15, A18 e D59.**
   - **Onde:** `apps/web/src/componentes/CascaDaEscola.tsx:72` e `:90-93`.
   - **O que está errado:** a `LateralAberta` põe o pé (rodapé e `MenuDaPessoa`) dentro do mesmo `overflow-y-auto` da navegação. A coordenação tem 7 lugares de 52 px mais a `Aparencia`, e a 1366×768 o "Sair" aparece cortado na borda de 768. Vi isso em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/vitrine/coordenacao--coordenacao-governanca--computador.png`.
   - **Por que importa:** no Chromebook de referência a janela útil tem cerca de 650 px. Lá o "Sair" só aparece rolando uma lateral sem barra visível, e isso fica mais difícil que entrar.
   - **No trilho:** em `CascaDaEscola.tsx:117` o trilho é `h-screen` sem rolagem. Numa janela baixa o "Sair" some e não há como rolar até ele.
   - **Na gaveta:** a lateral que abre por cima, de 768 a 1023 px, usa a mesma `LateralAberta` e tem o mesmo defeito.
   - **Por que o teste não pegou:** `e2e/casca.spec.ts:597` usa `toBeInViewport()` sem `ratio`, que aprova um botão cortado.
   - **Correção exigida:**
     - Tire o pé do contêiner que rola e deixe-o `shrink-0` no fim da coluna.
     - Garanta o "Sair" inteiro dentro da janela no trilho, em altura de cerca de 600 px.
     - Troque a asserção por `toBeInViewport({ ratio: 1 })`.
     - Rode `conferirOSair` também numa altura menor que 768 (por exemplo 1366×600 e 900×600).
     - Declare a mutação "pé de volta dentro do `overflow-y-auto`" com esse teste vermelho.
   - O `frontend-reviewer` achou o mesmo defeito, e eu o confirmei na foto.

2. **Duas divergências estão só no `12_task.md`, e a coluna "Onde está na spec" aponta lugares que não as registram.**
   - **A família de cor de cada `lucide`** (`12_task.md:80`; o código em `apps/web/src/areas/navegacao.ts:52-58`, `:73-75`, `:85`, `:95`): Governança, Agentes e Analista em anil; Estrutura, Professores e Material em azul; Privacidade em amarelo na coordenação e em verde no aluno; Meus dados em verde; Minha turma em turquesa. `techspec.md:199` e `docs/interface.md` 9.4 dizem só "o `lucide` num `Ladrilho`", sem família.
   - **A guarda de cor passou a aceitar `border-transparent`** (`12_task.md:81`; o código em `apps/web/src/estilos.test.ts:110-112`). A seção 10 da Tech Spec (`techspec.md:227`, **Guarda de cor**) continua dizendo que a guarda "reprova nome fora da lista", sem essa exceção.
   - **Correção exigida:**
     - Escreva em `techspec.md` 9, na linha do `lucide`, a regra da família e a tabela de item para família, ou leve-a para `docs/interface.md` 9.4 e cite de lá.
     - Escreva em `techspec.md` 10, **Guarda de cor**, que `transparent` passa só como borda e que `bg-` e `text-transparent` continuam reprovando.
     - Corrija a coluna "Onde está na spec" das duas linhas.

Recomendações:
- **Justificativa errada sobre a gaveta.** `12_task.md:371-372` diz que a gaveta "só existe abaixo de 768 px". Ela também existe de 768 a 1023 px: `gavetaNaPagina = faixa !== 'larga'` em `CascaDaEscola.tsx:252`, e o próprio e2e a abre a 900 px. Dá para provar a mutação de `usuarioDaSessao` no projeto `chromebook` a 900 px, com a pessoa trocando sem a rota mudar. Isso é do `test-engineer` e do `tenancy-guardian`. Enquanto isso, o [x] de 12.3 em `tasks.md` ("as mutações de `lembrarQuemEsta` e da troca de escola") afirma mais do que foi provado.
- **Comentário do trilho.** `CascaDaEscola.tsx:112` diz que a pinta, o "Abrir a lateral" e os ícones são "todos do tamanho de um lugar (52 px)". A pinta e o "Abrir a lateral" usam `size-11`, que dá 44 px. Corrija o comentário ou a medida.
- **Papel em minúscula e no masculino.** Sob o nome, o papel aparece como "coordenação" e "professor", também para a professora (foto acima; `NOME_DO_PAPEL`). Fica para a tarefa que mexer em `papeis.ts`.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-15 18:17:20 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** os nomes acessíveis da Tech Spec 9 nos três papéis; aceso e apagado (A23, e a negativa A24); a ordem do Tab com "Início" e "Meus dados" antes do "Sair" (A17); "Sair" à vista e do tamanho do vizinho, a 900 e a 1366 px, com a lateral aberta e recolhida (A18); o trilho dá nome e dica e guarda a escolha (A19, A92); armazenamento recusado e a casca sem `import(`; "Início" no rótulo, no `h1` e na aba (A22, U14); ícone decorativo e "Seu time" sem onça (A80); moldura de 1200 com margem de 32 e de 16 (A84); seletor com 48 px de face, 44 px de alvo e a escola atual marcada (A94, A95); recomeço da sessão (segunda pessoa no Chromebook do carrinho, troca de escola, sessão vencida); duplo clique em "Sair" barrado pelo "Saindo…".

**Cobertos:**
- **Unidade:** `itens-da-lateral.test.tsx`, `MenuDaPessoa.test.tsx`, `lateral-recolhida.test.ts`, `casca-sem-import.test.ts`, `navegacao.test.ts` e `titulo-das-telas.test.tsx` cobrem aceso e apagado por classe, os 52 px, os ícones e a família do Tutor, as iniciais, o "Saindo…" desligado, a chave e o valor `sim`, e o armazenamento que recusa no `getItem`, no `setItem`, no `removeItem` e no próprio `localStorage`. O valor guardado é só `sim`, e o teste confere que nada mais vai para o armazenamento (`localStorage.length === 1`).
- **E2e:**
  - `areas.spec` cobre A23 e A24 pela cor que o navegador calcula, com a negativa de verdade.
  - `casca.spec` tem as medidas (256, 88, 52, borda de 2, moldura de 1200, 32 e 16 px), a ordem do Tab, a escolha que sobrevive à recarga e o caso dos três papéis, aberta e recolhida, a 1366 e a 900 px. Esse caso usa `toBeInViewport` e compara altura e largura com o vizinho.
  - `professor-assistente.spec` cobre A80. O recomeço fica nos testes de `inatividade`, `areas` e `troca-de-escola`, que já existiam.
- **Mutações:** conferi os 30 blocos contra o diff. Cada um chega à cláusula e fica vermelho por asserção. O do `if (false)` quebra a renderização de "Início", que é consequência direta de tirar o ramo.
- **Higiene:** nenhum `.skip`, nenhum `.only` e nenhum mock que esconda a regra. Rodei `npx vitest run --project unidade apps/web/src/componentes apps/web/src/areas apps/web/src/estilos.test.ts`: 826 testes, todos verdes.

**Bloqueantes:**
1. **O seletor de 48 px não tem teste nem bloco.**
   - **Onde:** `apps/web/src/componentes/SeletorDeEscola.tsx:142` (o botão) e `:161` (as linhas da lista), onde `min-h-11` virou `min-h-12`. A subtarefa 12.1 pede "seletor de 48 px".
   - **Por que não está provado:** o único teste que mede o seletor é `e2e/troca-de-escola.spec.ts:228` e `:237`, que exige no mínimo 44 px. Se a cláusula voltar a `min-h-11`, ele continua verde.
   - **Correção:** afirmar 48 px de altura no botão do seletor, na lateral aberta. Pode ser no e2e de `troca-de-escola`, ou na unidade pela classe `min-h-12`. Depois, declarar o bloco `min-h-12` → `min-h-11` apontando para esse teste.
2. **Cláusulas novas sem bloco de mutação.** Os testes que as provam já existem; falta só declarar os blocos.
   - `apps/web/src/componentes/CascaDaEscola.tsx:314` e `:117`: a borda `border-r-2` da lateral e do trilho, que a 12.1 pede ("borda de 2"). O teste é `e2e/casca.spec.ts › W12: as medidas da D80 no computador`, que afirma `borderRightWidth` de `'2px'` nas duas. Bloco: `border-r-2` → `border-r`, um para cada linha.
   - `apps/web/src/componentes/itens-da-lateral.tsx:66` (`familia={icone.familia}`) e `:182` (`familia={item.familia}`): o ladrilho na família do lugar e do agente, que a 12.2 pede. Os testes são `itens-da-lateral.test.tsx › o ícone ilustrado é de Início…`, que espera `laranja` no Tutor, e `› cada agente tem o ícone da função num ladrilho…`, que espera `['azul', 'laranja']`. Bloco: fixar `familia="azul"` em cada linha.

**Recomendações:**
- **A94 e `troca-de-escola.spec.ts`:** o arquivo está nos "Arquivos previstos", e a tabela de testes promete "a escola atual achada pelo nome (A94)". Nenhuma linha do seletor ganhou ícone, então a contagem de `svg` continua válida e o teste não precisava mudar. Vale escrever isso em "Divergências" para a promessa não ficar em aberto.
- **Contraste da borda do aceso:** `itens-da-lateral.test.tsx:116` só confere que `azul-borda` é diferente de `lateral`, e passaria com duas cores quase iguais. Se a borda é a pista que não é cor, o critério seria 3:1 de contraste para elemento que não é texto (WCAG 1.4.11). Fica para o `frontend-reviewer` decidir.
- **Família de cada ladrilho:** a tabela de famílias da primeira divergência só é afirmada no Tutor. Uma asserção sobre `NAVEGACAO`, `RODAPE_DA_LATERAL` e `MENU_DA_PESSOA` fixaria todas.
- **Detector do `casca-sem-import.test.ts`:** o caso que prova o detector não passa pela normalização do caminho. Um caso com `'../componentes/Contador'` reprovando como peça fora da entrada cobriria isso.
- **A dica no trilho** só é provada para o professor. O caso dos três papéis confere o nome, mas não a dica do aluno nem a da coordenação.
- **Comentários antigos** ainda dizem "Nova conversa" em `e2e/inatividade.spec.ts:50`, `convite.spec.ts:187`, `entrar.spec.ts:44`, `escola-e-vinculos.spec.ts:57`, `operacao.spec.ts:327`, `professores.spec.ts:507`, `professor-assistente.spec.ts:68` e `__fixtures__/fluxo-do-professor.ts:34`.
- **Gaveta na troca de pessoa:** a gaveta fechar quando a pessoa muda sem a rota mudar (a dependência `usuarioDaSessao`) continua sem prova. A cláusula é anterior a esta tarefa e o documento declara isso com honestidade. O teste de componente cabe na 13.0, com a pessoa trocando no mesmo endereço.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-15 18:44:15 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. O diff da rodada 1 para a 2 não traz migration nem schema.

Queries verificadas: nenhuma. O diff não mexe em repository, service, controller nem endpoint. As mudanças desta rodada ficam no front e na documentação:
- `apps/web/src/componentes/CascaDaEscola.tsx`: só o rodapé (o "pé") da lateral saiu da área que rola e virou `shrink-0`, na lateral aberta e no trilho.
- Testes de componente e e2e: `SeletorDeEscola.test.tsx`, `MenuDaPessoa.test.tsx`, `itens-da-lateral.test.tsx`, `casca-sem-import.test.ts` e `e2e/casca.spec.ts`.
- Documentos: `12_task.md`, `tasks.md` e `techspec.md`.

O `SeletorDeEscola.tsx` não mudou nesta rodada. A troca de escola continua trocando o token, como foi aprovado na 1ª rodada, e o cliente não manda `escolaId` em lugar nenhum. Os ids da nova fixture, `ESCOLA_A` e `ESCOLA_B` em `SeletorDeEscola.test.tsx`, são UUID v7.

Teste de isolamento: não se aplica a esta tarefa, que não cria módulo, tabela nem consulta. Os testes de isolamento que já existiam não foram tocados (`techspec.md` §6, linha "Isolamento").

Bloqueantes: nenhum.

A rodada anterior foi APROVADO, sem correção exigida. A nova seção "Mutações" do `12_task.md` sobre `usuarioDaSessao` não abre bloqueante:
- O efeito que fecha a gaveta é anterior a esta tarefa; ela só trocou rótulo e comentário ali.
- O comportamento é só de interface. Depois da troca, o que a tela mostra vem do token novo, e a API aplica o escopo no repository. Um descuido nesse efeito deixa a gaveta aberta, mas não faz dado de outra escola chegar à tela.
- O documento agora diz claramente que essa dependência não tem bloco `mutacao` e não afirma uma prova que não existe.

Recomendações:
- Na 13.0, ao mexer na gaveta, criar o teste de componente que troca a pessoa ou a escola sob o mesmo `caminho`, entre 768 e 1023 px, e declarar a mutação que remove `usuarioDaSessao` das dependências do efeito em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/CascaDaEscola.tsx`. Hoje o e2e `areas › troca de escola pelo seletor…` só fica vermelho quando o efeito inteiro sai. Isso já está registrado em "Recomendações sem aplicar" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/12_task.md` e no item 12.3 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/tasks.md`.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-15 18:44:20 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: APROVADO

Esta é a rodada 2. Auditei só o diff 3fcd671 → 195f89d (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/ordens/12_task-diff-r1-r2.patch`). A rodada 1 não exigiu correção nenhuma, então não havia o que conferir.

Campos pessoais tocados: nenhum novo.
- **Lateral aberta.** Em `apps/web/src/componentes/CascaDaEscola.tsx`, a mudança foi só de layout: o alto rola e o pé, com "Sair", fica fixo embaixo. A lateral recebe as mesmas props e mostra os mesmos dados da pessoa (nome e papel no `MenuDaPessoa`). O trilho só ganhou `shrink-0` no pé.
- **Trilho.** O teste novo em `apps/web/src/componentes/MenuDaPessoa.test.tsx` prova que no trilho não aparecem as iniciais nem o nome da pessoa, mesmo quando o nome é passado. Isso reforça a minimização.
- **Seletor de escola.** `apps/web/src/componentes/SeletorDeEscola.test.tsx` passa nome de escola, nome de rede e `usuarioId` (UUID). Escola e rede não são dado de titular. O seletor não exibe dado do aluno.

Fora da tabela de dados do docs/lgpd.md: nada. Nenhuma migration, DTO ou campo novo. A bolinha das iniciais já tinha passado na rodada 1: é derivada do nome que a tela já mostra e não é gravada nem enviada.

Autorização por objeto: ok. O diff não traz rota, endpoint nem consulta. A troca de escola continua trocando o token (P30) e não mudou.

Logs: limpos. Nenhum log no diff.

Auditoria: não se aplica. O diff não tem leitura de dado de aluno por coordenação ou rede, exportação, nota, permissão nem aprovação de saída de IA.

Envio externo: nenhum.

Seed/fixture: sintético. São "Camila Souza", "Colégio Vista Alegre", "Escola Municipal do Norte", "Rede Vista Alegre" e "Rede Norte", com UUIDs fixos inventados. Os e2e só mudam o tamanho da janela (1366 × 600, 900 × 600) e a navegação por teclado, sem dado novo.

Bloqueantes: nenhum.

Recomendações:
- Fecho de ciclo: as duas recomendações minhas da rodada 1 estão registradas com destino em "Recomendações sem aplicar" do `12_task.md`. Uma é a preferência de lateral recolhida que passa de uma pessoa para a seguinte no Chromebook compartilhado, que continua sem ser dado pessoal. A outra é renomear `TITULO_DA_NOVA_CONVERSA`. Nada a acrescentar.
- A gaveta fechando quando a pessoa muda sob o mesmo `caminho` (dependência `usuarioDaSessao`) também conta para privacidade: no Chromebook do carrinho, a gaveta aberta da sessão anterior mostraria o nome e o papel de outra pessoa. O destino ficou na 13.0, e a reabertura deve chamar o `privacy-guardian` para conferir esse teste quando ele existir.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-15 18:44:34 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portao-12b.log`: 42 mutações declaradas, todas vermelhas, entre elas a do pé de volta dentro do `overflow-y-auto`, a 29)
Bloqueantes: nenhum

As duas correções da 1ª rodada estão feitas.

1. **O "Sair" dentro da janela.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/CascaDaEscola.tsx:76-100` o pé saiu do contêiner que rola e ficou `shrink-0` no fim da coluna. O trilho também ganhou `shrink-0` (linha 145). Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca.spec.ts`, a asserção passou a `toBeInViewport({ ratio: 1 })`, e o `conferirOSair` agora roda em 1366×600 (aberta e no trilho) e em 900×600 (trilho e lateral por cima), nos três papéis. A mutação está declarada no `12_task.md` e fica vermelha no portão.
2. **As divergências na spec.** A `techspec.md` 9 agora traz a regra da família de cor (pela função, nunca pelo estado) e a tabela de item para família, e o `itens-da-lateral.test.tsx` fixa essa tabela por papel. A `techspec.md` 10, em **Guarda de cor**, diz que `transparent` só passa como borda e que `bg-transparent` e `text-transparent` continuam reprovando. A coluna "Onde está na spec" das duas linhas foi corrigida.

As duas recomendações da Mesa também foram feitas:
- O texto sobre a gaveta no `12_task.md` diz agora "abaixo de 1024 px" e já não afirma uma mutação que não existe. O `[x]` da 12.3 no `tasks.md` registra que essa mutação foi adiada.
- O comentário do trilho diz 44 px para a pinta e o "Abrir a lateral".

Recomendações:
- O teste de componente da gaveta fechando quando a pessoa muda sem a rota mudar (dependência `usuarioDaSessao`) foi adiado para a 13.0. Hoje o adiamento só aparece no `12_task.md` e no item 12.3 do `tasks.md`. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/13_task.md:59` a linha "a gaveta fecha" continua "sem edição", e quem fizer a 13.0 não vai vê-lo. Vale registrar lá o teste e a mutação, ou nos itens da 13.0 no `tasks.md`.
- Duas "Recomendações sem aplicar" mandam itens para o `TODO.md` (o `TITULO_DA_NOVA_CONVERSA` e os comentários "Nova conversa" em specs fora da tarefa), mas o `TODO.md` não foi alterado. Escreva os itens lá, ou diga quem os escreve e quando.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-15 18:45:12 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: APROVADO
Tela vista: sim (11 fotos lidas: lateral aberta e recolhida, escola cheia e vazia, nos três papéis; o celular da coordenação só para conferir que nada quebrou). Não medi 600 px de altura; essa conferência está no e2e que o diff acrescentou.
Estados: ok (a tarefa só muda a casca; carregando e erro seguem pelo código e pelo e2e que ela não tocou, e o vazio está nas fotos "vazia", com texto que convida: "Nada para fazer agora. Quando quem dá a aula passar uma atividade…").
Acessibilidade: ok, com um achado no contraste da borda do lugar aceso (recomendação, abaixo).
Chromebook fraco: ok. O pé da lateral aberta não rola e fica no fim da coluna, e só a navegação rola.
Celular: sem regressão na foto de 360 px (coordenação), sem rolagem horizontal, barra de topo com "Sair" de 44 px. A barra de baixo e a gaveta são da tarefa 13.0.
Ação oficial protegida: sim (a tarefa não toca ação oficial).

**Correção exigida da 1ª rodada: feita**
- `CascaDaEscola.tsx` (`LateralAberta`): o pé (`ListaDeItens` do rodapé e `MenuDaPessoa`) saiu do contêiner de `overflow-y-auto` e ficou `shrink-0` no fim da coluna. Rolam só a marca, o seletor, a navegação e "Seu time".
- Fotos 1366×768, `coordenacao--coordenacao-governanca--computador.png`: a navegação rola (o item "Privacidade" aparece cortado na borda, como deve), e "Aparência" e "Sair" ficam inteiros, com "Sair" a cerca de 730 px.
- Trilho: o pé ganhou `shrink-0`, e o "Sair" está à vista em 768 px nos três papéis.
- `e2e/casca.spec.ts`: `toBeInViewport({ ratio: 1 })`; `conferirOSair` roda também a 1366×600 e 900×600, nos três papéis, aberta, recolhida e aberta por cima.
- Mutação: o bloco existe em `12_task.md`, move o pé para dentro do contêiner que rola, e o teste "os nomes acessíveis não mudam" o pega (a 768 px para a coordenação, a 600 px para os outros).

**Contraste da `azul-borda` do lugar aceso (pedido da Mesa)**
Calculado com os tokens de `apps/web/src/estilos.css`:

| Par | Claro | Escuro | Mínimo |
|---|---|---|---|
| `azul-borda` sobre `lateral` (#99D2F8 sobre #FFF; #17577F sobre #131F24) | 1,62:1 | 2,17:1 | 3:1 |
| `azul-borda` sobre `azul-claro` | 1,40:1 | 1,71:1 | 3:1 |

A borda não passa no 3:1 de WCAG 1.4.11 em nenhum dos dois temas. Classifico como **recomendação, não bloqueante**, por quatro motivos:
- O par é o que a D80 e `docs/interface.md` 11.1 mandam, e o mesmo documento já registra a `azul-borda` a 1,6:1 (10.1, item 5).
- A mesma combinação (`azul-claro` com `azul-borda`) vale para `Toque`, `Cartao` e `Opcao` em telas já aprovadas, então corrigir só a lateral criaria um segundo padrão.
- O aceso tem ainda o texto `azul-texto` (4,5:1 ou mais), o fundo `azul-claro` e o `aria-current` para leitor de tela.
- A solução é decisão de token e de design (por exemplo, borda do aceso em `azul-texto`), fora do escopo da 12.0.

Fica para o `/validar` ou para a X2: ou se aceita o par documentado, ou se escurece a borda do aceso para 3:1 em todo o produto, de uma vez.

Bloqueantes: nenhum.

Recomendações:
1. `e2e/casca.spec.ts` e o contraste acima: levar a `azul-borda` ao `/validar` ou à X2, como decisão de token, e anotar em `docs/interface.md` 9.1 que o par do aceso não está na tabela de 3:1.
2. `CascaDaEscola.tsx:81` (`-m-1 … p-1`): a margem de 4 px é menor que o anel de foco, que é 3 px de contorno mais 2 px de `outline-offset` (`estilos.css:303-304`), ou seja, 5 px. O `overflow` corta 1 px do anel nas bordas esquerda e direita dos itens que rolam. Ainda se vê, mas o comentário "guarda o anel" não é exato. Usar `-m-2 p-2` resolve.
3. Trilho da coordenação a 600 px de altura: pela medida da foto (`coordenacao--…--Recolher-a-lateral--computador.png`: sete lugares de 52 px, passo de 60 px), a pilha mais o `gap` de 12 px fecha o "Sair" colado na borda de baixo, com os 12 px do `py-3` consumidos. Passa em `ratio: 1`, mas sem folga, e o trilho não rola. Se a coordenação ganhar um oitavo lugar, ou se a barra do navegador crescer, o "Sair" sai da janela sem como alcançá-lo. Vale um teste a 560 px, ou deixar o trilho rolar só a navegação, com a dica fora do que corta.
4. A "Esperando você" some na Home da professora na escola vazia (`vazia--professora--professor-nova-conversa--computador.png`). É comportamento anterior à tarefa (o diff de `Home.tsx` só troca o rótulo para "Início") e deliberado, mas a regra 50, item 6, pede que o feed não apareça vazio para quem tem turmas. Para o `/validar`.
5. `NOME_DO_PAPEL` mostra "professor" e "coordenação" em minúscula sob o nome, o que já está em "Recomendações sem aplicar" do `12_task.md`.

Arquivos de referência (tudo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/`):
- `apps/web/src/componentes/CascaDaEscola.tsx`
- `apps/web/src/componentes/itens-da-lateral.tsx`
- `apps/web/src/estilos.css`
- `e2e/casca.spec.ts`
- `tasks/prd-pele-e-casca/12_task.md`

## test-engineer · 2ª rodada · REPROVADO · 2026-10-15 18:45:40 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Seletor de escola com 48 px no botão e em cada linha da lista.
- Borda de 2 px na lateral aberta e no trilho.
- Ladrilho na família de cor da função, nos lugares e nos agentes de "Seu time", nunca na cor de estado.
- "Sair" inteiro dentro da janela numa tela baixa: 1366 × 600 com a lateral aberta, no trilho, e a 900 × 600 no trilho e por cima, nos três papéis (D59).
- O trilho dá a dica pelo teclado nos três papéis.
- O detector da casca reprova o caminho que sobe e desce (`../componentes/Contador`).
- No trilho não aparecem as iniciais nem o nome.

**Cobertos:**
- **Correção 1 feita.** O teste está em `apps/web/src/componentes/SeletorDeEscola.test.tsx:39`: exige `min-h-12` e recusa `min-h-11` no botão e nas duas linhas. Há dois blocos, um para o botão e outro para a linha. O portão (`.processo/portao-12b.log`, mutações 30 e 31) deu vermelho pela asserção da classe.
- **Correção 2 feita.**
  - O W12 de medidas (`e2e/casca.spec.ts:524` e `:544`) afirma `borderRightWidth: '2px'` na lateral e no trilho. Os dois blocos `border-r-2` → `border-r` ficaram vermelhos (mutações 32 e 33).
  - `familia="azul"` em `IconeDoLugar` cai na asserção `data-ladrilho === 'laranja'` do Tutor (`itens-da-lateral.test.tsx:89`). Em `SecaoDoTime` cai em `['azul','laranja']` (`:171`). Mutações 34 e 35, vermelhas.
- **Pé fora do que rola (bloqueante do frontend-reviewer).** O bloco tira o pé do contêiner fixo e o devolve para dentro do `overflow-y-auto`. Ele é vermelho pela asserção certa: `toBeInViewport({ ratio: 1 })` a 1366 × 600 (`e2e/casca.spec.ts:601`, `:627-628`). Antes dessa troca, o `toBeInViewport()` sem `ratio` aprovava o botão cortado ao meio. A tela de 600 px também é exercitada no trilho e por cima a 900 px (`:644-662`). Mutação 29, vermelha.
- **Dica do trilho.** A `Dica` é `hidden` com `group-focus-visible:block`, então o `toBeVisible()` de `:643` depende de verdade do foco por Tab. Não é asserção que passa sempre.
- **O resto.** A tabela de família por papel, os casos novos de `motivoDeFora` (incluindo `../../componentes/Contador`) e o trilho sem iniciais em `MenuDaPessoa.test.tsx:90` passam. Rodei os quatro arquivos de unidade: 49 de 49 verdes. Não há `.skip`, `.only` nem `.fixme` nas linhas novas.

**Bloqueantes:**
1. **`apps/web/src/componentes/CascaDaEscola.tsx:78`: margem do anel de foco sem bloco de mutação, e com medida errada.**
   - **O problema.** A classe nova `-m-1 … p-1` existe, segundo o comentário de `:69-74`, para que o `overflow` não corte o anel de foco. É cláusula nova sem bloco e sem teste.
   - **A medida não fecha.** O anel é `outline: 3px` com `outline-offset: 2px` (`apps/web/src/estilos.css:302-305`), ou seja, passa 5 px da borda do lugar. Os lugares da lateral são `w-full` (`LUGAR_ABERTO`), e 4 px de folga não bastam: o `overflow-y-auto` corta 1 px do anel à esquerda e à direita. Um teste da cláusula ficaria vermelho hoje.
   - **Correção exigida.**
     - Folga de pelo menos 5 px. Por exemplo, `-m-1.5 p-1.5`.
     - Um e2e em `e2e/casca.spec.ts`, a 1366 × 600 com a lateral aberta. Ele leva o foco por Tab ao primeiro lugar de "Seções" e lê, no navegador, `outlineWidth` mais `outlineOffset` do lugar focado. Depois afirma que a caixa do lugar, aumentada dessa soma, cabe na caixa do `closest('.overflow-y-auto')`, à esquerda, à direita e no alto.
     - Depois, declarar o bloco que tira a margem negativa e a folga dessa linha, apontando para esse teste.

**Recomendações:**
- O `shrink-0` dos dois pés (`CascaDaEscola.tsx:97` e `:145`) é mutação equivalente: um item flex sem `overflow` já tem `min-height: auto` e não encolhe abaixo do conteúdo. Quem segura o pé é o `flex-1 min-h-0` do contêiner que rola. Não pede bloco. Se o texto for revisto, vale o comentário de `:69-74` dizer isso, para ninguém achar que tirar o `shrink-0` derruba o "Sair".
- A seção "Mutações" corrige o que o documento afirmava da gaveta (`usuarioDaSessao`) e manda para a 13.0 o teste que falta. Está registrada em "Recomendações sem aplicar" e em `tasks.md`. Na 13.0, essa é a primeira coisa a cobrar.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/CascaDaEscola.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.css
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/12_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/portao-12b.log

## privacy-guardian · 3ª rodada · APROVADO · 2026-10-15 19:16:45 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. Esta rodada mexeu na folga do alto que rola em `CascaDaEscola.tsx` (de `-m-1 p-1` para `-m-1.5 p-1.5`) e em dois comentários desse arquivo. Também entraram um teste e2e com uma função auxiliar que mede quanto do anel de foco o `overflow` corta, uma mutação no documento da tarefa e três entradas no `TODO.md`. Nenhum campo, DTO, rota, consulta ou chamada de API mudou.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. Nenhuma rota nem leitura de objeto foi tocada nesta rodada.

Logs: limpos. A função `anelCortadoPeloQueRola` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca.spec.ts:614`) lê só a geometria do elemento focado (largura e afastamento do contorno, posição da caixa). Ela não lê texto da tela e não grava log. A asserção sobre `professora.nome` (`e2e/casca.spec.ts:422`) já estava lá antes desta rodada, e o nome é sintético e vem da fixture.

Auditoria: não se aplica. Nenhuma ação desta rodada pede registro de auditoria.

Envio externo: nenhum.

Seed/fixture: sintético. A fixture não mudou nesta rodada.

Bloqueantes: nenhum.

Recomendações:
- A primeira entrada nova do `TODO.md` registra a recomendação que fiz na rodada anterior: renomear `TITULO_DA_NOVA_CONVERSA` para `TITULO_DO_INICIO` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/__fixtures__/casca.ts` quando os arquivos de teste que a usam forem mexidos de novo. Ela continua em aberto e não bloqueia.
- As outras duas entradas novas (comentários "Nova conversa" em arquivos de teste fora da 12.0 e a falta de folga do trilho a 600 px) são de outros revisores e não tratam de dado pessoal.

Correções exigidas na rodada anterior: nenhuma, então não havia o que conferir.

## frontend-reviewer · 3ª rodada · APROVADO · 2026-10-15 19:16:47 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: APROVADO
Tela vista: sim (15 fotos lidas: professora, coordenação e aluno, em 1366 px e 360 px, cheia e vazia, incluindo a lateral recolhida da professora e da coordenação). Não li as fotos de celular da escola vazia, as da lateral recolhida em celular nem a `celular-2` da coordenação, porque a barra de baixo e a gaveta são da tarefa 13.0.
Estados: ok. Vazio convida (a tela da coordenação diz "Quando um professor pedir uma versão adaptada…", a do aluno diz "Quando quem dá a aula passar uma atividade…"). O feed "Esperando você" da professora com turma aparece com dado na escola cheia. O carregando e o erro não aparecem na vitrine e não mudaram neste diff.
Acessibilidade: ok. O anel de foco é de 3 px com 2 px de afastamento (`apps/web/src/estilos.css:303-304`), ou seja, 5 px. A folga nova do alto que rola é de 6 px e cobre o anel. O e2e novo em `e2e/casca.spec.ts:425-441` mede o corte à esquerda, à direita e no alto com `anelCortadoPeloQueRola`, e a mutação declarada em `12_task.md` tira a margem e a folga e exige vermelho. Teclado, rótulos e contraste não mudaram.
Chromebook fraco: ok. Nada de peso novo no diff (uma classe de espaçamento e um teste).
Celular: ok nas fotos de 360 px. Não há rolagem horizontal. A tabela da governança vira cartões. Os alvos são grandes, e o "Sair" do cabeçalho tem 44 px ou mais. A barra de baixo e a gaveta ficam para a 13.0.
Ação oficial protegida: sim. A tarefa não cria ação oficial, e o "Abrir dado nominal de uma turma" da coordenação continua pedindo finalidade e passando pela auditoria.
Bloqueantes: nenhum.
- O diff desde a rodada aprovada é só `CascaDaEscola.tsx` (folga de `-m-1 p-1` para `-m-1.5 p-1.5`) e dois comentários. Está dentro do que a correção pedia e as fotos mostram a casca íntegra.
- A margem de 6 px é menor que os 12 px do `p-3` do pai, então não há corte nem rolagem lateral nova.

Recomendações (nenhuma bloqueia):
- A lateral da coordenação a 768 px de altura corta o último item ("PRIVACIDADE") pela metade. É a rolagem do alto funcionando, mas parece texto cortado e não há dica de que rola. Ir ao `/validar` ou à X2, com um degradê ou uma borda no pé do que rola.
- Os contrastes da `azul-borda` do item aceso, a margem do anel, o "Esperando você" na escola vazia e o `NOME_DO_PAPEL` seguem como recomendações das rodadas anteriores.
- O trilho da coordenação a 600 px sem folga (`CascaDaEscola.tsx`, comentário do `Trilho`) já está registrado no `TODO.md` e reabre com o oitavo lugar.
- O `TODO.md` ganhou três dívidas pequenas (`TITULO_DA_NOVA_CONVERSA`, comentários "Nova conversa" fora da 12.0 e o trilho). Estão bem datadas.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-15 19:16:48 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade e o alvo da árvore, que inclui a mutação nova)
Bloqueantes: nenhum

Recomendações:
- `e2e/casca.spec.ts:440`: o teste só olha a borda de cima na primeira parada e nunca olha a de baixo. Quando o navegador rola até uma parada, ele alinha a caixa do elemento à beira visível do contêiner, sem contar o anel. Então, a 600 px de altura, o anel de "Assistente de ensino" ou de "Tutor" pode ficar cortado embaixo, e o teste continuaria verde. Vale medir a borda de baixo na última parada de "Seu time", ou pôr `scroll-padding` no alto que rola. Essa parte é do `frontend-reviewer`, por isso fica como recomendação.
- `e2e/casca.spec.ts:91-99`: o `anelCortadoPeloQueRola` acha o contêiner pela classe `.overflow-y-auto`. Se alguém trocar por `overflow-auto` ou mudar o utilitário, a função devolve `undefined`. O teste falha nesse caso, então não passa em silêncio, mas a mensagem confunde. Um `data-` próprio no contêiner seria mais estável.

As duas recomendações da rodada anterior foram feitas:
- Ficaram registrados no `TODO.md` a constante `TITULO_DA_NOVA_CONVERSA`, os comentários "Nova conversa" nos specs que não são da 12.0 e o trilho a 600 px.
- A folga de 6 px em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/CascaDaEscola.tsx:78` cobre o anel de 3 px mais 2 px de afastamento definido em `apps/web/src/estilos.css:303-304`. Há uma mutação declarada em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/12_task.md:334-342` que derruba o teste.
- Os dois comentários reescritos estão corretos.

## test-engineer · 3ª rodada · APROVADO · 2026-10-15 19:17:10 · `tasks/prd-pele-e-casca/12_task.md`

VEREDITO: APROVADO

**Correção exigida na 2ª rodada: feita.**
- **A folga.** `apps/web/src/componentes/CascaDaEscola.tsx:78` agora usa `-m-1.5 … p-1.5`, ou seja, 6 px. O anel de foco ocupa 5 px: 3 de contorno (`outline`) e 2 de afastamento (`outline-offset`), em `apps/web/src/estilos.css:302-305`. Os 6 px bastam.
- **O teste.** O e2e novo fica em `e2e/casca.spec.ts:426-441`, e a função que ele usa, `anelCortadoPeloQueRola`, em `:613-625`. Ele roda a 1366 × 600 com a lateral aberta e lê no navegador `outlineWidth` mais `outlineOffset` do elemento focado. Depois compara a caixa desse elemento, aumentada dessa soma, com a caixa do `closest('.overflow-y-auto')`.
  - Esquerda e direita são conferidas em sete paradas, entre elas o primeiro lugar de "Seções" ("Início", na terceira parada).
  - O alto é conferido na marca, que é o elemento mais alto do contêiner que rola. É uma prova mais forte do que conferir o alto no primeiro lugar, e o comentário explica por que as paradas seguintes não conferem o alto: o contêiner pode ter rolado até elas.
- **O teste mede o anel de verdade.** `.processo/e2e-12c.log:874-918` registra a rodada feita antes da troca da classe. Com `-m-1 p-1`, o teste ficou vermelho nos projetos `chromebook` e `celular`, na asserção "anel cortado à esquerda", com o valor 1. É exatamente 5 − 4: o anel foi lido inteiro já na marca, focada por `focus()`, então o `:focus-visible` vale ali e a medida não é vazia.
- **O bloco de mutação.** Está em `tasks/prd-pele-e-casca/12_task.md:334-342`, tira a margem negativa e a folga, e aponta para "a lateral aberta percorrida só com Tab".
  - Em `.processo/portao-12c.log:1287` ele aparece como a mutação 30 de 43, vermelha, rodada sobre a árvore atual. O texto do `-m-1.5` precisou casar para a mutação ser aplicada.
  - Nada antes da parte nova desse teste mede corte. Sem folga, a esquerda passa a 5, e o vermelho só pode vir das asserções novas: o bloco chega à cláusula.
- **O resto do diff.** Os dois comentários do `CascaDaEscola.tsx` e as três entradas do `TODO.md` não trazem cláusula nova.

Não rodei nada: as provas acima vêm dos logs do portão e do e2e em `.processo/`.

Cenários exigidos: a lateral aberta percorrida só com Tab, com o anel de foco inteiro dentro do alto que rola numa janela baixa (1366 × 600), à esquerda, à direita e no alto. A mutação que tira a folga tem de ficar vermelha pela asserção do corte.

Cobertos: todos os acima, mais o vermelho com a medida antiga de 4 px, provado no log.

Bloqueantes: nenhum.

Recomendações:
- **Conferir que o anel aparece.** Em `e2e/casca.spec.ts:434`, uma asserção de que o anel lido é de pelo menos 5 (ou `expect(await focoVisivel(page)).toBe(true)`) protegeria a conferência do alto. Ela depende de o `focus()` por programa manter o `:focus-visible` na marca. Se uma mudança futura no estilo de foco zerar o anel ali, a conferência do alto passa sem medir nada; esquerda e direita continuam protegidas pelas paradas feitas com Tab.
- **Mesma medida na coordenação.** Hoje só a professora é medida. A coordenação tem mais lugares e rola mais cedo. Esquerda e direita não dependem do papel, então isso é cobertura extra para quando a 13.0 mexer na lateral.

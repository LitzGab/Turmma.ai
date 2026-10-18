# Achados das revisões — `tasks/correcoes/2026-10-18-textos-da-turma-indisponivel-diferem.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-18 13:38:38 · `tasks/correcoes/2026-10-18-textos-da-turma-indisponivel-diferem.md`

VEREDITO: APROVADO

Tela vista: sim (6 fotos lidas: a turma indisponível, a lista de turmas e a turma indisponível na escola vazia, cada uma a 1366 e a 360 px). Nenhuma página rola a 1366 × 768. As fotos mostram o último e2e e batem com o código da árvore.

Estados: ok. A correção só mexe no e2e, e a tela não muda. A divisão do caso preservou todos os estados:
- **Carregando:** "Carregando o acesso da turma…", no caso 2.
- **Vazio:** "Sem acesso ativo" com um único Gerar, no caso 2.
- **Erro:** o erro depois de gerar, o erro na primeira leitura e a turma que não chega, nos casos 3, 5 e 6.
- **Com dado:** a validade e as duas ações, no caso 4.

Em cada um dos três endereços indisponíveis o aviso é uma região `status`, sem nome de turma, sem seção de acesso e sem "Tentar de novo". A foto da escola vazia mostra o mesmo aviso, com o próximo passo dito: "Volte para Turmas; se ela deveria estar lá, fale com a coordenação".

Acessibilidade: ok. Comparei o diff com o caso original e mantidas todas as asserções de tela.
- **axe:** continua na lista, no vazio, no diálogo, no erro após gerar, no com dado e em cada endereço indisponível.
- **Foco:** o foco no texto "o que acontece" do diálogo, no título após o erro, e o aviso que não puxa o foco na página que já abre sem a turma.
- **Título da aba:** "Turma · Turmma".
- **Marca de seleção:** `aria-current` em "Turmas". Ela foi mantida no caso 2 e passou também para o fim do caso 1.
- **Alvo de toque:** `alvoDeToque` no cartão "Abrir a turma" e no "Gerar acesso".

O novo `sinoDaProfessora` e o `toHaveAccessibleName('Esperando você, carregando')` provam o rótulo do sino por papel e nome, como a tela o expõe.

Chromebook fraco: o motivo da divisão é o tempo (61 s e 66 s num caso só, contra o teto de 15 s). Entrar pela API (`abrirJaEntrando`) evita uma carga de página de uns 7 s com CPU ×4 e Fast 3G. A entrada pela tela continua provada em `casca.spec.ts` e nos outros casos do arquivo.

Celular: ok. O caso roda nos dois projetos. No celular o sino mora fora de `main`, então `textoDaTelaSemOSino` não o encontra para remover e compara o mesmo texto. A foto a 360 px não tem rolagem horizontal, nem texto cortado, e o aviso cabe na largura. O link "Voltar para Turmas" tem `min-h-11` (`apps/web/src/areas/professor/Turma.tsx:60`), ou seja, 44 px.

Ação oficial protegida: não se aplica. Não há ação oficial nesta tela.

Bloqueantes: nenhum.

Recomendações:
1. A mutação declarada (`Sino.tsx:79`, "carregando" para "aguarde") só prova o rótulo do sino no caso do endereço pendente. Nenhuma mutação cobre `textoDaTelaSemOSino`, que é a correção em si. Reverter o helper para `innerText` de `main` também deixaria o caso vermelho, mas só pelo `toBe(TELA_DA_TURMA_INDISPONIVEL)` ao lado do sino carregando. Vale registrar essa segunda mutação em outra tarefa.
2. `TELA_DA_TURMA_INDISPONIVEL` vem de `textContent` sem espaço ("Voltar para TurmasTurma…"). A comparação fica frágil a qualquer espaço novo no markup, mas o erro dela diz exatamente o que mudou.
3. O texto do `main` incluiria conteúdo só para leitor de tela (`sr-only`), se existisse. Hoje o texto "Esperando você" do sino é `sr-only` abaixo de 768 px, mas o sino é removido antes da comparação.
4. Não rodei o e2e. A foto e o código batem, mas a duração dos casos novos (meta de 15 s) fica para o portão da tarefa e para a esteira.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/acesso-da-turma.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-18-textos-da-turma-indisponivel-diferem.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Turma.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/componentes/sino/Sino.tsx`

## test-engineer · 1ª rodada · APROVADO · 2026-10-18 13:39:52 · `tasks/correcoes/2026-10-18-textos-da-turma-indisponivel-diferem.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- O caso que reproduz o defeito: a turma de vínculo pendente aberta pelo endereço, com a leitura de `/v1/meus-vinculos` segurada. Ele tem de ficar vermelho no `chromebook` com a comparação antiga e verde com a nova.
- As duas outras aberturas pelo endereço (vínculo encerrado e turma que não existe), com o sino já lido.
- A divisão do caso W4 em oito sem perder nenhuma asserção do original.
- Nenhuma dependência de ordem entre os casos nem de relógio.
- Os dois projetos, `chromebook` e `celular`.

**Cobertos:**
- **O reprodutor é determinístico e chega à cláusula.**
  - O caso do vínculo pendente segura a leitura dos vínculos (`e2e/acesso-da-turma.spec.ts:501-505`). Antes de ler o texto, ele confere que o sino está de fato carregando (`:517`), e só solta a leitura depois de ler (`:520`). A ordem é sequencial, sem corrida.
  - O contador fica dentro do botão (`Sino.tsx:141`), e o rótulo "Esperando você" aparece na tela a partir de 768 px (`Sino.tsx:140`). Por isso qualquer leitura do texto de `main` com o sino junto daria diferente de `TELA_DA_TURMA_INDISPONIVEL` no `chromebook` e igual no `celular`, como o documento descreve.
  - A mutação declarada troca o rótulo "carregando" em `Sino.tsx:79`. Ela fica vermelha em `:517` pelo motivo certo: prova que o cenário entra mesmo no estado do sino que causava a corrida.
- **A comparação prova a regra, e mais forte que antes.**
  - Cada endereço é comparado ao mesmo texto escrito por extenso (`:519`), o que implica os três iguais entre si e fixa o que a tela diz. O `Set` antigo passaria se os três mostrassem o mesmo texto errado.
  - `textoDaTelaSemOSino` (`:103-108`) tira só `button[aria-label^="Esperando você"]`. O nome do sino vem do `aria-label` (`Sino.tsx:137`), então ele sai inteiro, com o contador.
  - Se o seletor deixasse de casar com o botão, o caso ficaria vermelho, nunca verde por engano.
  - Usar `textContent` em vez de `innerText` também pega texto escondido.
- **A divisão do W4 bate com a tabela da seção "Correção".** Conferi asserção por asserção contra `HEAD`:
  - Cartões, alvo de toque, largura e axe da lista, mais endereço, título da aba, `h1`, série, abas e "Turmas" com `aria-current`: `:297-324`.
  - Carregando, vazio com um Gerar só, axe e o diálogo do primeiro acesso: `:327-367`.
  - O erro depois de gerar: o pedido com 7 dias, o foco na etapa e no título, o código cru ausente, o axe e o "Tentar de novo": `:370-408`. Este caso ganhou duas asserções no fim.
  - Com dado: "Vale até", as duas ações, nenhuma caixa de texto, token e código fora da página, um acesso vigente, largura e axe: `:411-434`.
  - O erro na primeira leitura: `:437-456`.
  - A turma que não chega: `:459-474`.
  - Os três endereços: `:492-523`. O axe e o "Voltar para Turmas", que antes rodavam só no último endereço, agora rodam nos três.
  - As três mudanças de meio estão declaradas: entrada pela API, falha já na primeira carga e acesso semeado no banco. A entrada pela tela continua provada em outros 11 pontos do arquivo.
- **Sem dependência entre os casos.** Cada caso cria a própria escola e a própria professora. O relógio só aparece em `diasAte` e `dataNaTela`, que já existiam e arredondam.
- **Nada proibido.** Não há `.skip`, teste comentado nem asserção que sempre passa. Nenhuma rota simulada esconde a regra: as rotas só seguram ou derrubam a leitura, e a tela continua sendo a de verdade.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `e2e/acesso-da-turma.spec.ts:518`, os casos "com o sino já lido" só conferem que o nome não é "Esperando você, carregando". Isso também passa com o sino em erro ("não carregou") ou em "parte não carregou". A professora sempre tem um vínculo pendente, então dá para conferir a outra metade da corrida, a do contador: `toHaveAccessibleName(/^Esperando você, \d+$/)`.
2. No original, o "Com dado" vinha logo depois de o erro se recuperar, e `secao(page).getByRole('alert')).toHaveCount(0)` provava que o alerta saía com o "Tentar de novo". Agora essa asserção mora em `:425`, num caso sem erro antes, e perdeu esse sentido. Vale repeti-la no fim de `:405-408` e de `:454-456`.
3. O nome do caso em `:437` promete "'Tentar de novo' traz a validade", mas o caso só confere `acessoAtivo` (`:456`). O original fazia o mesmo. Ou acrescente `toContainText('Vale até')`, ou ajuste o nome.

Não rodei os e2e: precisam da pilha no ar, e o portão da tarefa já os rodou. Também não alterei nenhum arquivo.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/acesso-da-turma.spec.ts` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-18-textos-da-turma-indisponivel-diferem.md`

## test-engineer · 2ª rodada · APROVADO · 2026-10-18 13:54:22 · `tasks/correcoes/2026-10-18-textos-da-turma-indisponivel-diferem.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2, só o diff desde a minha 1ª rodada):
- (a) O sino já lido nos endereços "encerrado" e "que não existe": a asserção tem de esperar a leitura terminar e afirmar que ela terminou.
- (b) O `alert` sai com o "Tentar de novo" nos dois casos de erro: a asserção não pode passar antes de o erro sair, nem passar sem ter achado nada.
- (c) A primeira leitura confere "Vale até".
- (d) A mutação de `textoDaTelaSemOSino` fica vermelha pelo motivo certo.

Cobertos:
- (a) `e2e/acesso-da-turma.spec.ts:523`. A regex `/^Esperando você, \d+$/` serve aos dois endereços que deixam a leitura terminar. O pendente é o único segurado, e tem a asserção dele na linha 522. Nos três casos o vínculo pendente é criado (linha 500), então a fila tem o item "confirme a sua turma". Pelo `nomeDoBotao` (`apps/web/src/componentes/sino/Sino.tsx:77-82`), com `itens > 0` o nome é "Esperando você, N". A regex é mais estrita que a de antes, que era `not 'carregando'`. A antiga aceitava "nada", "não carregou" e "parte não carregou". A nova só aceita a lista lida com item. Ela também tem espera embutida: `toHaveAccessibleName` repete até bater, então o `textContent` da linha 524 só é lido com o sino já assentado. Isso fecha a corrida que causou a falha da esteira.
- (b) Linhas 409 e 461. As duas vêm depois de `await expect(acessoAtivo(page)).toBeVisible(...)`, nas linhas 407 e 458. O `toHaveCount(0)` também repete até bater. Ele não passa sem ter achado nada:
  - a seção existe, porque `acessoAtivo` mora nela e acabou de ficar visível;
  - o alerta existia antes, provado nas linhas 398 e 453 com `toHaveText(INDISPONIVEL_TENTE_DE_NOVO)`.
  Se a tela deixasse o erro junto do dado, a asserção esgotaria o prazo e ficaria vermelha.
- (c) Linha 459. Está depois do `acessoAtivo` visível, e `toContainText` espera.
- (d) A mutação 1 remove a linha 106. Com isso o `textContent` do clone passa a levar o `<span>` "Esperando você" do botão (`Sino.tsx:140`). Esse span é `sr-only md:not-sr-only`, mas entra no `textContent` do mesmo jeito. O resultado deixa de ser igual a `TELA_DA_TURMA_INDISPONIVEL` na linha 524: é o vermelho pelo motivo certo, a comparação que inclui o sino. Isso só acontece no `chromebook`, onde o sino mora em `main`, e é lá que a falha existia. A mutação 2 (`Sino.tsx:79`) quebra a linha 522, o que prova que segurar `/v1/meus-vinculos` põe mesmo o sino em "carregando": o cenário chega à cláusula.
- Não há `.skip`, mock que esconda a regra nem asserção sem espera. O `leituraDoSino.abrir()` da linha 525 e o `.catch` da linha 509 deixam a rota presa ser solta sem erro.

Bloqueantes: nenhum.

Recomendações:
1. `e2e/acesso-da-turma.spec.ts:444,459`: o `gerarAcessoNoBanco` já devolve o `expiraEm` em ISO (`e2e/__fixtures__/sessao.ts:782`). O caso da primeira leitura pode guardar esse valor e conferir a data exata, como faz o caso "com dado" na linha 426, no lugar do `'Vale até'` solto. Assim ele prova que o "Tentar de novo" traz o acesso semeado, e não um acesso qualquer.
2. A mutação 1 só fica vermelha no `chromebook`, porque no `celular` o sino fica fora de `main`. Vale uma linha na seção "Mutações" do documento dizendo isso, para quem ler o portão depois não estranhar o `celular` verde com a mutação aplicada.

Não alterei nem rodei nada: as duas mutações já foram provadas vermelhas pelo portão da tarefa. Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/acesso-da-turma.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-18-textos-da-turma-indisponivel-diferem.md

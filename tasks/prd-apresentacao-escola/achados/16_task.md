# Achados das revisões — `tasks/prd-apresentacao-escola/16_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-02 20:33:05 · `tasks/prd-apresentacao-escola/16_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- **Caminho feliz:** o professor vê os pedidos chegando sozinhos, marca, revisa e aprova ou recusa; a coordenação faz o mesmo de dentro da turma, lendo só quando clica em "Atualizar", com a finalidade e o aviso de auditoria.
- **Casos de borda:**
  - lote de 40 com um pedido já decidido por outra pessoa e outro que deixou de existir (38 alunos criados);
  - o 41º pedido não pode ser marcado;
  - a lista muda com o diálogo aberto, inclusive quando todos os pedidos saem dele;
  - resposta atrasada da atualização de 15 s, chegando depois da decisão;
  - decisão que falha, e decisão em que o servidor decidiu mas a resposta se perdeu;
  - lista com `proxima` e sem ele;
  - turma que sai do alcance com a tela aberta (vínculo encerrado no professor, ano encerrado na coordenação);
  - aba escondida e aba que volta;
  - pedido com a marca de matrícula errada e pedido sem ela;
  - aprovados na lista de nomes viram contagem.
- **Permissão:** o professor com vínculo encerrado perde a página; a coordenação não lê nada sem o clique, e a leitura que a rota derruba não grava auditoria.
- **Isolamento:** a lista de um papel não é a do outro (chave do cache por turma e por papel); a segunda pessoa na mesma aba não herda a seleção nem os pedidos; a turma de outra escola aberta pelo endereço continua coberta no `estrutura.spec.ts`, agora com o foco conferido. O isolamento na API é da 8.0.
- **Concorrência:** clique duplo em confirmar, com dois cliques no mesmo instante; o mesmo lote confirmado de novo.

Cobertos: todos. Conferi a tabela de Mutações contra o diff, cláusula por cláusula:
- `api/pedidos.ts`: limite, finalidade, chave, `enabled`, `gcTime`, contrato, `cancelQueries`, retirada dos ids, releitura, `invalidate` e `reset` depois da falha.
- `atualizacao-dos-pedidos.ts`: intervalo, aba à vista, volta da aba, guarda do papel, marcação por id, limite de 40, contagem dos novos.
- `ListaDePedidos.tsx` e `DialogoDeDecisao.tsx`: as linhas com efeito observável.
- `Turma.tsx` e `ListaDaTurma.tsx`: o aviso, o foco, o título da aba e a contagem dos aprovados.
- Os tetos dos chunks, com o valor entre o teto novo e o antigo: 18 000 bytes para a coordenação (16 kB) e 9 000 para o professor (8 kB).

As duas mutações que sobreviveram (`focoInicial` e as `key`) estão justificadas e não escondem regra.

As asserções olham o resultado:
- contagem de alunos no banco (38, 2), estado `livre` no banco;
- registros de auditoria com autor e finalidade;
- a query string exata de cada leitura e o corpo do `POST`;
- cores do `oficial` e do `perigo`, foco e texto exatos.

A concorrência é de verdade: os dois `click()` saem no mesmo tick (`doisCliquesNoMesmoInstante`, `e2e/pedidos.spec.ts:83`), com `decisoes === 1` e 38 alunos.

Não há `.skip`, `.only`, `any` nem mock de coisa nossa. Só a rede é falsa na unidade, e no e2e a interceptação só segura ou derruba a rota. `ja_decidida` e `nao_encontrada` vêm da API real, com o banco alterado. A tarefa não toca IA.

Bloqueantes: nenhum.

Recomendações:
1. **Clique duplo em "Atualizar" da coordenação.** O `cancelRefetch: false` em `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:106` faz dois cliques seguidos virarem uma leitura só, e portanto um registro de auditoria só. Nenhum teste prova isso e a cláusula não tem linha nas Mutações. Vale um e2e com dois cliques no mesmo instante, afirmando uma leitura e um registro. O mesmo vale para o `cancelRefetch: false` da atualização de 15 s (`:88`).
2. **Dois alunos com o mesmo nome entre os pedidos.** A marcação por id está provada na unidade, mas nenhum e2e tem dois pedidos com o mesmo nome. Na tela eles só se distinguem pela hora, porque a matrícula não chega lá de propósito. Registrar para o `/validar` como pergunta de produto (como o professor confere o homônimo) e, se ficar assim, cobrir com um e2e em que marcar um dos dois não marca o outro.
3. **Espera fixa.** `e2e/pedidos.spec.ts:860` usa `page.waitForTimeout(2_000)` para provar uma ausência. É aceitável aqui, porque a entrega da resposta é esperada antes, mas vale o comentário dizendo por que não há evento a esperar.
4. **Asserção sem efeito.** `textos.test.ts:53` (`quantidadeDePedidos(0)`) não protege regra nenhuma; pode sair ou virar o caso que a tela usa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/16_task.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/pedidos.ts e pedidos.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/ (ListaDePedidos.tsx, DialogoDeDecisao.tsx, textos.ts, textos.test.ts, atualizacao-dos-pedidos.ts, atualizacao-dos-pedidos.test.ts)
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/TurmaIndisponivel.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turma.tsx, AcessoDaTurma.tsx; /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/pedidos.spec.ts, e2e/__fixtures__/sessao.ts, e2e/estrutura.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/tamanho-web.test.ts, .size-limit.json

Não rodei o portão nem mutações, e não editei nenhum arquivo.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-02 20:34:51 · `tasks/prd-apresentacao-escola/16_task.md`

VEREDITO: APROVADO

Estados: ok. A seção dos pedidos cobre carregando, vazio, erro e com dado nos dois papéis, e a coordenação tem um quinto estado: antes da primeira leitura, a tela diz "Clique em Atualizar…". O vazio do professor chama para uma ação ("Ver o acesso dos alunos", que leva o foco ao título da seção do acesso). O vazio da coordenação explica de onde vêm os pedidos, sem botão. Quando a releitura falha com a lista vazia, a tela mostra o erro, e não o vazio; com a lista na tela, o erro aparece por cima dela (`ListaDePedidos.tsx:116-123`). O feed de agentes não está nesta tela. O seletor de escola não muda: é a casca de antes, e a troca de escola esvazia a chave `pedidos-da-turma`.

Acessibilidade:
- Cada pedido é um `label` inteiro com a caixa de seleção dentro (`min-h-11`, caixa de 24 px), e o foco visível vem do `:focus-visible` global.
- Quando 40 estão marcados, o 41º fica `disabled` e o texto do limite fica ligado a ele por `aria-describedby`.
- Os pedidos novos são anunciados numa região `aria-live="polite"` que já existe antes do texto, e a primeira leitura não anuncia nada.
- O foco segue as etapas: começa no texto do diálogo, depois vai ao título do resultado, e ao fechar volta para quem abriu ou para o título da seção. Quando a turma sai com a tela aberta, o foco vai ao aviso; na página que já abre sem a turma, ele fica onde está.
- O W12 cobre tudo isso só com teclado (Tab, Espaço e Enter).
- A marca da matrícula errada é escrita como fato sobre o pedido, sem número nem hora.

Chromebook fraco:
- O `professor-*` mede ~5,5 kB e o teto caiu para 8 kB; o `coordenacao-*` mede ~13,5 kB e o teto caiu para 16 kB. O primeiro carregamento fica em 129,7 kB de 150.
- A releitura de 15 s só roda com a aba à vista e para quando ela é escondida. Graças ao compartilhamento estrutural do TanStack, uma resposta igual não redesenha nada.
- A lista não é virtualizada, mas o teto é de 100 cartões simples por leitura, e com mais a tela diz que há mais. Aceitável.
- A tarefa não tem upload.

Celular: os cartões ocupam a largura a 360 px, os cabeçalhos e os botões quebram linha (`flex-wrap`), e nome comprido usa `break-words`. O diálogo tem largura `min(32rem, 100%-2rem)` e rola dentro dele. Os alvos têm 44 px. Nada depende de hover. O spec roda nos projetos `chromebook` e `celular`, e o W12 confere que não há rolagem horizontal, também dentro do diálogo. Nenhum fluxo exige o celular.

Ação oficial protegida: sim. "Aprovar N" usa o botão `oficial` e só abre o diálogo. O diálogo mostra a turma, cada nome com a marca, o efeito e, para a coordenação, o aviso de auditoria, antes do botão que confirma. `useEnvioUnico` garante que dois cliques mandem um pedido só. Não existe "aprovar todos", e o limite é de 40. Se outra pessoa decide um pedido com o diálogo aberto, ele sai do diálogo; se todos saem, só resta "Fechar", com "Nada foi enviado". "Recusar" usa o `perigo` e diz que o nome volta à lista. O resultado sai em texto para cada pedido.

Bloqueantes: nenhum.

Recomendações:
1. **Rede caída na hora do "Atualizar"** (`apps/web/src/componentes/pedidos/ListaDePedidos.tsx:111` e `:183`). A web usa o `networkMode` padrão (`online`). Se o aparelho está sem rede quando a coordenadora clica em "Atualizar", a leitura fica pausada: `isFetching` fica falso, o "Atualizando…" não aparece e o clique não dá retorno nenhum. A mesma pausa, sem lista no cache, mostraria ao professor "Clique em Atualizar…", um botão que ele não tem; é difícil acontecer, porque a leitura da turma e a dos pedidos saem do cache juntas. Usar `fetchStatus !== 'idle'` e dizer "Sem conexão: a lista é lida quando a internet voltar" resolve as duas. O padrão é da web inteira, e vale registrar no `/retro`.
2. **Texto de "há mais" na coordenação** (`textos.ts:24`). "Os próximos aparecem depois que estes forem decididos" é verdade para o professor. Para a coordenação, eles só aparecem no próximo "Atualizar", e o texto podia variar por papel.
3. **Leitura dupla na volta da aba**. Quando a aba volta, o `visibilitychange` próprio e o `refetchOnWindowFocus` do TanStack podem pedir a mesma leitura. O `cancelRefetch: false` deduplica, então não há custo hoje. Desligar o `refetchOnWindowFocus` nessa consulta deixaria a regra num lugar só.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/ListaDePedidos.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/textos.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/pedidos.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/TurmaIndisponivel.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turma.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/AcessoDaTurma.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/botao-secundario.ts

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-02 20:35:59 · `tasks/prd-apresentacao-escola/16_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. A tela lê o nome do aluno no pedido, a hora do pedido e a marca `teveMatriculaErrada`, todos vindos de `GET /v1/turmas/:id/reivindicacoes` (entregue na 8.0). Na lista de nomes da coordenação, os alunos aprovados agora aparecem como uma contagem, sem nome nem matrícula.

**Fora da tabela de dados do docs/lgpd.md:** nada. A tarefa é só de frontend e não tem migration nem campo novo.

**Autorização por objeto:** ok.
- A web manda só o `turmaId` no caminho e os ids dos pedidos no `POST /v1/reivindicacoes/decidir`. A escola, o ano e o vínculo vêm do token.
- Quando a API responde `NAO_ENCONTRADO`, a tela troca a página inteira pelo aviso de `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/TurmaIndisponivel.tsx`. O aviso não traz nome de aluno, e o nome da turma também sai do título da aba.
- `esquemaPedidoDaTurma` é `strictObject` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/pedidos.ts:27`). Uma resposta que trouxesse matrícula seria recusada e não chegaria à tela.
- A chave do cache separa turma e papel (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/pedidos.ts:49`). A lista que o professor leu nunca aparece para a coordenação sem a leitura dela.

**Logs:** limpos. Os arquivos novos não usam `console`, `logger`, `localStorage` nem `sessionStorage`. O nome só fica na memória da página e no corpo da resposta.

**Auditoria:** presente.
- **Leitura da coordenação:** ela manda a finalidade `conferencia_de_cadastro` e a leitura fica desligada até o clique em "Atualizar" (`enabled: false`, `gcTime: 0`). Nada lê sozinho: nem abrir a turma, nem voltar à aba, nem invalidar o cache. A API grava `turma.reivindicacoes_lidas` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/decisao.service.ts:76`), e o e2e confere o autor e a finalidade de cada registro.
- **Decisão:** a API grava `reivindicacao.decidida` (`decisao.service.ts:154`), e a tela avisa a coordenação antes de ela confirmar.
- **Releitura da lista de nomes depois da decisão:** passa pela rota que já é auditada (`turma.lista_lida`).
- **Leitura do professor a cada 15 s:** sem auditoria, como a regra 20, item 10 permite, porque é o professor da própria turma.

**Envio externo:** nenhum. A tarefa não chama IA nem provedor de fora.

**Seed/fixture:** sintético. Os nomes têm a forma "Aluno NN sintético <uuid>", as matrículas são derivadas de UUID, a coordenadora usa `@educa.invalid` e as senhas são `senha-sintetica-<uuid>` (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts:434-552`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/pedidos.spec.ts:149-151`).

**Bloqueantes:** nenhum.

**Recomendações:**
1. A lista do professor fica no cache com o `gcTime` padrão, cerca de 5 min depois de ele sair da tela. A troca de sessão já esvazia esse cache, então não há vazamento entre pessoas. Mesmo assim, `gcTime: 0` também para o professor reduziria o tempo em que os nomes ficam na memória da aba, num Chromebook compartilhado de laboratório.
2. A frase de `TEXTO_DA_MATRICULA_ERRADA` está correta e trata a marca como fato sobre o pedido. Vale o `conformidade-reviewer` confirmar no `/validar` que ela também aparece só como fato no diálogo, como a nota da 8.0 pede.
3. Pergunta de fechamento: a tarefa não cria dado novo nem destino novo. O que a tela expõe já sai da reivindicação e da auditoria entregues na 8.0, então a pergunta continua respondida por código.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-02 20:36:17 · `tasks/prd-apresentacao-escola/16_task.md`

**VEREDITO: REPROVADO**

**Escopo:** respeitado. As subtarefas 16.1 a 16.6 foram feitas, e as notas herdadas da 8.0, da 13.0 e da 15.0 foram tratadas. Nada avança sobre a 17.0.

**Aderência à Tech Spec:** ok. As divergências estão registradas na `techspec.md` (seção 9, "Decidido na 16.0"), no `cenarios.md` (W4, W6, W12 e W15) e no `docs/interface.md`. Isso inclui a troca de `Estrutura.tsx` por `ListaDaTurma.tsx`, o limite de 100 por leitura, a falta de qualquer leitura da coordenação sem o clique e os novos tetos dos chunks.

**Portão local:** carimbo válido para o código atual (typecheck, lint, test e e2e).

**Bloqueantes:**

1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:146-147` e `:195-199`. A contagem dos aprovados afirma um fato falso quando a lista tem mais de uma página.
   - **O problema:** `aprovados` é calculado só sobre as páginas já carregadas (`nomes.data.pages.flatMap`). A lista pagina de 100 em 100 (`NOMES_POR_PAGINA` em `api/lista.ts`), aceita até 200 nomes e vem ordenada por `id`. Numa turma com mais de 100 nomes, a tela mostra "Aprovados nesta turma: N" com N menor que o real, e o número cresce a cada "Ver mais nomes".
   - **Segundo erro no mesmo trecho:** a linha "N nomes na lista" e "Mostrando os primeiros N nomes" (`:193`) contam os aprovados. Logo ao lado, o texto diz que eles "não aparecem mais pelo nome nesta lista". A contagem e os cartões não batem.
   - **Correção exigida:**
     - Com `nomes.hasNextPage`, não usar "nesta turma": dizer que a contagem vale para os nomes carregados (por exemplo, "Aprovados entre os primeiros N nomes: X"), ou só mostrar a contagem com todas as páginas lidas.
     - Fazer a contagem de "nomes na lista" bater com os cartões mostrados, ou dizer que ela inclui os aprovados.
     - Acrescentar um e2e com mais de 100 nomes e aprovados na segunda página, que hoje passaria com o texto errado.

**Recomendações:**

- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:123-134`. Com a decisão no ar, a releitura de 15 s do professor pode chegar depois de o servidor gravar e antes de a resposta voltar. Nesse caso, `continuam` fica vazio e o diálogo mostra por um instante "…outra pessoa decidiu antes. Nada foi enviado." com o envio ainda em curso. Duas saídas: congelar `continuam` enquanto `mutacao.isPending`, ou suspender o `agendarAtualizacao` com o diálogo aberto.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:211`. O `nome.nome ?? ''` sobrou de quando o aprovado tinha cartão. O tipo `NomeAindaNaLista` ainda permite `nome: null`. Se o contrato garante nome para `livre` e `reivindicado`, vale estreitar o tipo e tirar o `??`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-02 21:04:12 · `tasks/prd-apresentacao-escola/16_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- A contagem dos aprovados quando ainda há página por carregar: o texto tem de dizer que conta só os nomes mostrados e não o total da turma.
- A contagem com a lista inteira carregada.
- O aprovado não aparece como cartão.
- Dois cliques no mesmo instante no "Atualizar" da coordenação geram uma leitura só e um registro só na auditoria.
- A lista de pedidos não fica guardada na memória depois de a tela sair, para a coordenação e para o professor.

**Cobertos:**
- **A correção exigida pelo revisor-geral está feita e provada.** É o teste e2e em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/pedidos.spec.ts:905-930`. O primeiro aprovado entra antes dos 100 nomes livres e o segundo depois, e a lista sai em ordem de id, que é `uuidv7`, então em ordem de inserção.
  - Na primeira página, o teste confere "Aprovados entre os primeiros 100 nomes: 1.", confere que "Aprovados nesta turma" não aparece e confere 99 cartões.
  - Depois de "Ver mais nomes", confere "102 nomes na lista", "Aprovados nesta turma: 2." e 100 cartões.
  - Se o ramo `haMais` de `ListaDaTurma.tsx:54` for removido, o `not.toContainText` falha. Se o filtro deixar o aprovado virar cartão, a contagem de 99 e de 100 falha.
- **O teste do "Atualizar" foi refeito**, em `e2e/pedidos.spec.ts:389-393`. Agora usa `doisCliquesNoMesmoInstante`, que dispara os dois cliques de fato em paralelo e não em sequência.
  - Confere a auditoria com `[umaLeitura, umaLeitura]` e `leituras` com dois itens. São cumulativos, contando o primeiro "Atualizar" do início do teste, então o comentário "uma leitura só" está coerente.
  - A mutação em `ListaDePedidos.tsx:106` derruba o teste.
- **O `gcTime: 0` está provado**, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/pedidos.test.ts:108-121`.
  - O `clienteDeTeste` (linha 30) mantém o `gcTime` padrão de 5 minutos. Por isso a asserção do professor falha se o `gcTime: 0` voltar a valer só para a coordenação.
  - O teste confere as duas chaves, a da coordenação e a do professor.
- **Teste de texto:** `quantidadeDePedidos(1)` → '1 pedido' agora testa o singular, em `apps/web/src/componentes/pedidos/textos.test.ts:53`.
- **Fixture e mutações:**
  - `porAprovadosNaListaDaTurma` grava a linha `aprovado` sem nome nem matrícula, igual ao que o banco guarda de verdade.
  - A seção "Mutações" tem uma linha para cada cláusula nova. O filtro `!== null` em `ListaDaTurma.tsx:165` está declarado sem mutação, com motivo válido: o check `lista_nome_aprovado_sem_nome` do banco já garante nome e matrícula fora do aprovado, e as duas condições servem ao tipo.
- Não encontrei `.skip`, teste comentado nem mock que esconda a regra.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `e2e/pedidos.spec.ts:913-915`, o teste depende de o segundo aprovado ter id maior que o dos 100 livres, e cada inserção abre uma conexão própria. Pode valer um comentário dizendo que isso conta com a ordem do `uuidv7` em `lista.repository.ts:165`. Se essa ordem mudar um dia, o teste fica vermelho e não passa por engano, então o risco é só de teste instável.
2. O texto "Aprovados nesta turma: N." só é conferido com N=2. Ver o singular com N=1 sairia barato, se o texto for mudar para "1 aprovado".

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-02 21:05:01 · `tasks/prd-apresentacao-escola/16_task.md`

VEREDITO: APROVADO

Esta foi a 2ª rodada. Auditei só o diff desde a 1ª, que tinha sido aprovada.

Estados: ok. Os quatro estados da lista de nomes (carregando, erro com "Tentar de novo", vazio que convida a colar a lista ou enviar o arquivo, e com dado) não mudaram. O aviso dos aprovados só aparece quando há aprovado (`aprovados > 0`).

Acessibilidade: nada piorou.
- A contagem é texto estático num parágrafo dentro da região "Nomes da turma", e não depende de cor: "Aprovados …: N." vem escrito.
- O "Retirar" continua com o nome e a matrícula para o leitor de tela (`ListaDaTurma.tsx:222-225`). Agora a matrícula é sempre preenchida, porque o tipo `NomeAindaNaLista` exige nome e matrícula, e não há mais risco de ler "matrícula null".

Chromebook fraco: a lista segue em páginas de 100 com "Ver mais nomes". O `gcTime: 0` agora vale também para o professor (`apps/web/src/api/pedidos.ts:58`) e libera memória na máquina compartilhada. Não há render nem dependência nova.

Celular: o aviso novo usa `break-words` em cartão de largura flexível, sem largura fixa e sem hover. O teste novo com 102 nomes usa `tocar`/`acionar` com `hasTouch` e roda nos dois projetos.

Ação oficial protegida: sim. A aprovação de pedidos não mudou. O teste de dois cliques no mesmo instante agora cobre também o "Atualizar" e prova uma leitura só e um registro só na auditoria (`e2e/pedidos.spec.ts:388-393`).

Sobre o texto novo, `textoDosAprovados`, em `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:53-56`:
- **A correção exigida foi feita.** Com página ainda por ler, a tela não afirma mais o total da turma: diz "Aprovados entre os primeiros M nomes", alinhado a "Mostrando os primeiros M nomes" (linha 205). Com a lista inteira, diz "Aprovados nesta turma".
- **A frase de apoio resolve a contagem.** "Eles contam entre os nomes da lista, mas não aparecem pelo nome" explica por que "102 nomes na lista" aparece ao lado de 100 cartões. O texto está em português comum, com número no formato local (`formatarNumero`).
- **A ordem das páginas é estável.** O teste de 102 nomes (`e2e/pedidos.spec.ts:905-929`) depende de um aprovado cair na 1ª página e outro na 2ª. A lista é ordenada por `asc(listaNome.id)` (`apps/api/src/estrutura/lista.repository.ts:165`) e o id é `uuidv7()` (`packages/nucleo/drizzle/0019_lista_nome.sql:14`), que segue a ordem de criação. Por isso a ordem não depende de id v4, e a regra 40 não é violada. O teste também confirma que "Aprovados nesta turma" não aparece antes da última página. Esse teste quebraria se a correção fosse desfeita.

Bloqueantes: nenhum

Recomendações:
- **Atualizar a contagem ao fim da lista.** O aviso dos aprovados não é uma região viva. Quem usa leitor de tela e toca em "Ver mais nomes" não ouve a contagem passar de "entre os primeiros 100" para "nesta turma". Vale anunciar o fim da lista ("Lista completa: 102 nomes") pelo `Anuncio` que já existe na seção. Melhoria pequena, para o `/validar`.
- **A 1ª rodada não tem nada pendente.** As recomendações dela estão registradas com destino em "Recomendações sem aplicar" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/16_task.md`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-02 21:05:36 · `tasks/prd-apresentacao-escola/16_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test e e2e para o código atual)
Bloqueantes: nenhum

A correção da 1ª rodada foi feita:
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:53-56`, `textoDosAprovados` só diz "nesta turma" quando a lista inteira está carregada. Com página ainda por ler, diz "Aprovados entre os primeiros M nomes". Nos dois casos a tela avisa que os aprovados contam entre os nomes da lista, e é isso que faz "102 nomes na lista" bater com os 100 cartões.
- O e2e em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/pedidos.spec.ts:905-930` cobre o que foi exigido: mais de 100 nomes, um aprovado na segunda página, o texto parcial sem "nesta turma" e 99 cartões na primeira página, e depois de "Ver mais nomes" o total 2 e 100 cartões.
- A mudança está registrada na `techspec.md:456`, no `cenarios.md:423` e na tabela de Mutações da `16_task.md:252`.
- O `gcTime: 0` passou a valer também para o professor, com teste de unidade.

Recomendações:
- O filtro em `ListaDaTurma.tsx:165` conta como aprovado qualquer item que não tenha nome ou matrícula, mesmo que o estado dele não seja `aprovado`. Hoje o check `lista_nome_aprovado_sem_nome` impede esse caso no banco, mas se esse contrato mudar a contagem passa a esconder erro sem avisar. Vale calcular `aprovados` a partir de `estado === 'aprovado'`, e não por subtração.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-02 21:05:47 · `tasks/prd-apresentacao-escola/16_task.md`

VEREDITO: APROVADO

Esta segunda rodada cobriu só o que mudou desde a primeira (gcTime, a contagem de aprovados e o e2e novo). Não encontrei bloqueante.

**Campos pessoais tocados:** nenhum campo novo. A tela usa nome e matrícula da lista da turma, que já existem e estão mapeados. A contagem de aprovados sai de linhas que a tela já recebia. Ela não lê o usuário do aluno nem traz o nome dele de volta.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok. Esta rodada não mexeu em nenhuma rota. A leitura dos pedidos pela coordenação continua com finalidade, só sai quando ela clica em "Atualizar" (`enabled: false`) e grava auditoria. A turma que deixa de existir mostra o mesmo texto de não encontrado (`TurmaIndisponivel`).

**Logs:** limpos. Não há `console` nem `localStorage`/`sessionStorage` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/pedidos.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/pedidos/` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx`.

**Auditoria:** presente. O e2e novo prova que dois cliques no mesmo instante em "Atualizar" geram uma leitura só e um registro só de `turma.reivindicacoes_lidas` (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/pedidos.spec.ts:388-393`).

**Envio externo:** nenhum.

**Seed/fixture:** sintético. `porAprovadosNaListaDaTurma` e `criarCoordenadoraNaEscola` (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts:810-826`) usam nome com UUID, e-mail em `@educa.invalid` e senha inventada. A linha aprovada fica sem nome e sem matrícula, como a aprovação da 8.0 deixa.

**Correções conferidas:**
- **Recomendação 1, feita.** `gcTime: 0` vale para os dois papéis em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/pedidos.ts:58`. O teste de unidade em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/pedidos.test.ts:108-121` falharia se o cache guardasse a lista depois de a tela sair.
- **Contagem paginada.** O texto "Aprovados entre os primeiros M nomes" aparece com página por ler, e "Aprovados nesta turma" só com a lista inteira. Isso não afirma um total que a tela não leu. O tipo `NomeAindaNaLista` impede que um aprovado sem nome vire cartão.
- **Recomendações 2 e 3:** estão registradas em "Recomendações sem aplicar" do 16_task.md, o que basta para não bloquear.

**Pergunta de fechamento:** esta mudança não cria dado novo nem destino novo. O que se guarda do aluno e para onde vai continua igual à rodada aprovada.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. A 2 e a 3 da primeira rodada continuam para o `/validar` e o `/retro`.

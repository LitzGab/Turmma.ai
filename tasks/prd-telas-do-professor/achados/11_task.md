# Achados das revisões — `tasks/prd-telas-do-professor/11_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 13:57:08 · `tasks/prd-telas-do-professor/11_task.md`

VEREDITO: APROVADO
Tela vista: sim (6 fotos lidas: lista e painel aberto, cada um no computador e no celular, na escola cheia, mais a aba vazia no computador e no celular).
Estados: ok. Pelo código: carregando (`EstadoCarregando`, linha 181), erro com "Tentar de novo" (182), vazio que convida (183–189), filtro sem resultado com "Limpar filtro" (195–197) e com dado. O vazio e o com dado aparecem nas fotos. Carregando e erro eu conferi só no código.
Acessibilidade: ok. A linha inteira é um `<button>` da `Linha` da X1. O painel tem título e descrição ligados, e Esc devolve o foco à linha (149), inclusive quando o painel abriu pelo endereço. O foco também é tratado depois de "Limpar filtro" (155) e depois de encerrar ou corrigir de novo (254–258). O selo diz o estado em texto e não só pela cor. O filtro é um `Segmentado` rotulado.
Chromebook fraco: ok. A lista da turma é curta e vem de uma consulta só, sem imagem nem peça pesada. O filtro só aparece acima de oito linhas, por isso não se justifica virtualizar. Não rodei throttling nesta rodada.
Celular: ok.
- A 360 px não há rolagem horizontal. A ação principal tem altura de 44 px, e as ações do painel viram folha de baixo.
- O selo desce para baixo do texto, como a `Linha` prevê. O título longo fica com reticências, que é o desenho da `Linha` da X1, e o texto inteiro está no `title` e no painel.
- Nada depende de hover.

Ação oficial protegida: sim.
- A aba não aprova nem publica nada. "Revisar a correção" é só um link para a tela de revisão, onde fica a aprovação.
- "Encerrar a atividade" passa pelo `EncerramentoDaAtividade`, com a confirmação que diz o que acontece.
- "Corrigir de novo" não pede confirmação. Ele só pede a correção outra vez, que nasce pendente, e não muda nada para os alunos. O gancho `corrigir-de-novo.ts:30-33` bloqueia o segundo clique no mesmo instante.
- Não há nota, média, conceito nem ordenação por acerto.
- A atividade é só objetiva, o que respeita a D55.

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
1. `apps/web/src/areas/professor/aprovar.ts` (`situacaoDaAplicacao`): a foto mostra "1 de 1 aluno enviaram". A concordância está errada com o singular. Use "1 de 1 aluno enviou" ou "1 aluno de 1 enviou".
2. `AtividadesDaTurma.tsx:289`: a frase "A atividade: quantos enviaram e o que fazer." lê como rótulo interno. Algo como "Situação da atividade e o que fazer agora" soaria mais natural. Ela também serve de descrição do diálogo para leitor de tela.
3. Na foto, a lista cheia mostra o título cortado a 360 px ("Estequiometria: lista s…"). É comportamento da `Linha` e não defeito desta tarefa. Se vários títulos de atividade ficarem parecidos, vale a X-spec da `Linha` avaliar duas linhas de título no celular.
4. As fotos mostram a lista e o painel só no estado "Correção aprovada". Os outros estados (aberta, para revisar, sem correção, "Corrigir de novo") têm prova em componente e e2e, mas não fotografei o painel com "Encerrar a atividade". Vale uma foto no `/validar`.

Arquivos de referência:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/AtividadesDaTurma.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/corrigir-de-novo.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/aprovar.ts`

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-19 13:57:32 · `tasks/prd-telas-do-professor/11_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa, e todos têm autor humano: sim. A tarefa só mexe na tela. Os dois pedidos que ela manda são os que já existiam: `POST …/encerrar`, pelo `EncerramentoDaAtividade` da 6.0, e o mesmo `POST …/encerrar` no "Corrigir de novo", que saiu de `AplicacaoDoArtefato` para `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/corrigir-de-novo.ts`. Nenhum deles grava `Nota`. O painel não aprova nada: "Revisar a correção" e "Ver a correção" são links para a tela de revisar (14.0), e o comentário em `AtividadesDaTurma.tsx:556-561` diz isso.

Decisão autônoma sobre aluno: ausente. Não há aprovação, reprovação nem encaminhamento. A lista vem na ordem de aplicação (`maisNovaPrimeiro`, `AtividadesDaTurma.tsx:367-369`), e nada ordena por acerto.

Aprovação registrada: ok.
- Os textos dos estados deixam claro que a correção espera a professora. Encerrada com correção pendente (`AtividadesDaTurma.tsx:342`): "O Assistente corrigiu, e a correção espera você. Revise os destaques e aprove antes de os alunos verem o diagnóstico." O diálogo de encerrar (`aprovar.ts:166-167`, cobrado no e2e em `professor-turma-atividades.spec.ts:79-80`) diz "a correção fica esperando você revisar e aprovar. Os alunos só veem o resultado depois disso".
- O "Corrigir de novo" só existe na atividade encerrada sem correção que valha: função suspensa ou lote rejeitado (`AtividadesDaTurma.tsx:598`). O lote novo nasce pendente, e o caminho de rejeitar fica intacto: o estado "Correção rejeitada" existe e a frase do lote rejeitado manda pedir de novo.
- A exceção do tutor (D47) não aparece em nenhum outro fluxo.

Supervisão do tutor: ok. A tela só avisa que o Tutor fica pausado enquanto a avaliativa está aberta (`AVISO_DA_AVALIATIVA_ABERTA`, `aprovar.ts:646`). O aviso some depois de encerrar, e o e2e cobra isso em `professor-turma-atividades.spec.ts:93`. Não há uso invisível ao professor, nem uso novo.

Autonomia declarada e visível: sim, sem mudança. A tarefa não toca agente, função nem nível.

Supervisão não é vigilância (item 7): ok. A linha mostra só "N de M enviaram" e o estado. Não há tempo, navegação, inferência nem lista de quem não entregou (isso fica fora do escopo, F6).

D46 e D55: ok. A atividade é só objetiva; não há discursiva, "Para corrigir" nem prazo. O vocabulário é testado em `AtividadesDaTurma.test.tsx:542-561`: "nota", "conceito", "pontuação", "média", "ranking", "pódio", "discursiva", "redação", "%" e "abaixo de 6", com um teste que prova que a própria lista de palavras pega cada uma. O e2e cobra o mesmo na tela, em `professor-turma-atividades.spec.ts:98`.

Medir o professor (D45 e D64): nada a ver. Não há métrica de professor nem indicador de adoção.

Fotos da tela:
- **Lista** (`professora--professor-turmas-01a15368-eaab-76e5-a0a5-94554e68f368--computador.png` e `--celular.png`): título, "Encerrada · prática · 1 de 1 aluno enviaram" e o selo "Correção aprovada". Sem número de acerto, sem nota, sem ordem por desempenho.
- **Painel aberto** (`…--button-name-Estequiometria--computador.png` e `--celular.png`): a situação, a turma com as datas, "Você aprovou a correção. O diagnóstico por habilidade já chegou aos alunos da turma." e as ações "Abrir a atividade" e "Ver a correção". Não há botão de aprovar no painel, nem nota ou conceito.
- **Escola vazia** (`vazia--…--computador.png` e `--celular.png`): o vazio com o caminho para Criados. Nada induz uso (4b).
- Em nenhuma foto há sugestão de nota (`AtividadesDaTurma.tsx:338-345` e `:607-633`).

Bloqueantes: nenhum.

Recomendações:
1. No painel da atividade com correção aprovada, `AtividadesDaTurma.tsx:343` poderia dizer quem aprovou e quando (vem de `entrega`, se o contrato trouxer), ligando a tela à pergunta "quem aprovou, quando" do item 6. Não bloqueia: o registro existe na API, e a tela de correção é o lugar de mostrá-lo.
2. O selo "Sem correção" usa a família `info`, a mesma de "Aberta" (`AtividadesDaTurma.tsx:335`). O texto distingue os dois, então a regra está cumprida; a escolha visual fica com o `frontend-reviewer`. "1 de 1 aluno enviaram" também é texto para ele.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 13:58:20 · `tasks/prd-telas-do-professor/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

**O que conferi:**
- **Escopo.** As subtarefas 11.1, 11.2 e 11.3 foram feitas. Nada da lista "Fora do escopo" entrou: prazo, discursiva, acerto, "Aprovar as notas" no painel. Duas mudanças fora dos arquivos previstos estão declaradas na tarefa e na `techspec.md`, no parágrafo "Atividades na pele nova":
  - o gancho `corrigir-de-novo.ts` e o texto `AVISO_DA_AVALIATIVA_ABERTA` (itens 4 e 5);
  - o clique na linha em `professor-turma-aberta.spec.ts` (item 1).
- **Divergências.** As sete linhas da tabela da tarefa batem com os itens (1) a (9) desse parágrafo. A linha do recomeço (recarregar provado por componente, segunda pessoa em `professor-sino.spec.ts`) cita o §10, como a 10.0 fez.
- **Regra 70 e D46/D55.** O painel não aprova nada, só leva à tela de revisar. Nenhum texto diz nota, média, conceito ou pontuação, e a lista se ordena pela data, não pelo acerto. As fotos confirmam: "Correção aprovada", "Ver a correção", e o vazio com o caminho para Criados.
- **Regra 10, item 6.** Um `?atividade=` que não está na lista da turma não abre painel, e a lista continua (`AtividadesDaTurma.tsx:139`).
- **Regra 00/40.** Nada de `any`, `.skip` nem `TODO`. O tipo vem de `@educa/shared`, e o envio único de "Corrigir de novo" está no gancho (`corrigir-de-novo.ts:31`).

**Recomendações:**
1. Os outros dois parágrafos não acompanharam a mudança:
   - **"Nenhum selo Encerrada".** A subtarefa 11.1 lista um selo "Encerrada", e o código não tem (`SELO_DA_ATIVIDADE`, `AtividadesDaTurma.tsx:39-45`). A divergência só está no item (2) da `techspec.md`. Falta uma linha na tabela de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/11_task.md`.
   - **Item (5) da 6.0 desatualizado.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/techspec.md:207` ainda diz que "Corrigir de novo" tem "mutation própria em `AplicacaoDoArtefato`". Desde a 11.0 ele mora no gancho: ajustar a frase ou remeter ao item (5) da 11.0.
2. Os testes do recomeço que saíram do e2e (recarregar com o painel aberto, a segunda pessoa) estão na tarefa, mas não têm frase própria na `techspec.md`. A 4.0, a 6.0 e a 12.0 registraram o caso delas (§10 e parágrafo "Alunos", item 6). Vale um item (10) no parágrafo da 11.0.
3. O item (6) da `techspec.md` diz que o nome da turma é "leitura do cache, e não uma chamada a mais". Com `staleTime` de 30 s, o `useQuery(consultaTurmaAberta)` que nasce em `AtividadesDaTurma.tsx:126` relê a turma se a aba abrir depois desse prazo. Ou se corrige a frase, ou se lê o nome com `refetchOnMount: false` ou `getQueryData`.
4. As fotos mostram "1 de 1 aluno enviaram" (lista e painel, escola cheia), que vem de `situacaoDaAplicacao` em `aprovar.ts:134`. É código anterior a esta tarefa, mas agora aparece na linha e no painel. O `frontend-reviewer` já apontou.
5. Em `AplicacaoDoArtefato.tsx`, aplicar e "Corrigir de novo" dividiam a mesma trava de envio (`decidindo`), e agora cada um tem a sua. Não vejo bug: um é diálogo e o outro botão de linha. Mas é uma mudança de comportamento que o item (5) da `techspec.md` não diz ("sem mudar o que diz nem o que faz").

## test-engineer · 1ª rodada · REPROVADO · 2026-10-19 13:59:05 · `tasks/prd-telas-do-professor/11_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** pelo `11_task.md` são estes:
- o estado de cada linha: aberta; encerrada com lote pendente, aprovado e rejeitado; encerrada sem ninguém ter respondido; correção suspensa.
- os quatro estados da aba, mais o filtro sem resultado.
- o painel pelo endereço: abre pelo id; id de outra turma ou inexistente não abre; Esc fecha e devolve o foco.
- encerrar com a confirmação, com clique duplo mandando um pedido só.
- a avaliativa aberta diz que o Tutor está pausado.
- o vocabulário (nada de nota, média, conceito ou pontuação; nada ordena por acerto).
- "Aplicar uma atividade" leva a Criados sem nome no endereço.
- o recomeço: recarregar mantém o painel, a segunda pessoa não vê a lista, trocar de turma fecha o painel, a resposta atrasada não toca a outra turma.
- "Corrigir de novo" com clique duplo no mesmo instante.

**Cobertos:** todos. Rodei `AtividadesDaTurma.test.tsx` e os 40 casos passam.
- Os seis estados de linha têm `it.each` com o selo e o texto de cada um.
- Os estados da aba e o filtro sem resultado estão provados, inclusive o foco ao filtro.
- O painel pelo endereço está provado com os ids alheios, o Esc e o foco à linha.
- O encerrar com `dblclick` e o aviso da avaliativa estão no e2e.
- O vocabulário é provado em três camadas.
- O endereço de aplicar está no componente e no e2e.
- A troca de turma com `key` está no componente e no e2e. A segunda pessoa está em `professor-sino.spec.ts:263-283`.
- O "Corrigir de novo" com dois cliques no mesmo lote do `act` é concorrência de verdade para a tela.
- Os 11 blocos de mutação chegam à cláusula pelo motivo certo. Não há `.skip` nem provedor de IA.

**Bloqueantes:**

1. **`apps/web/src/areas/professor/AtividadesDaTurma.tsx:195` não tem teste nem bloco.** A cláusula `todas.length > 0 && visiveis.length === 0` não é provada por nenhum teste. Se ela vira `visiveis.length === 0`, aparece "Nada com este filtro" junto do vazio e durante o carregando, e os testes "carregando" (`AtividadesDaTurma.test.tsx:174`) e "vazio" (`:194`) continuam verdes, porque não procuram esse texto.
   - **Correção:** nos dois testes, afirmar `queryByText('Nada com este filtro')` nulo, e acrescentar o bloco `-      {todas.length > 0 && visiveis.length === 0 && (` / `+      {visiveis.length === 0 && (`.

2. **`AtividadesDaTurma.tsx:136` não tem teste nem bloco.** Nenhum teste chega a `filtroEmUso = comFiltro ? filtro : 'todas'`, que é a lista que encolhe para oito ou menos com um filtro escolhido. No teste de troca de turma, o `key` zera o estado antes, então ele não prova esta linha. Sem a cláusula, a lista fica filtrada sem o `Segmentado` na tela, e a professora não tem como tirar o filtro.
   - **Correção:** um caso de componente que monta 9 linhas, escolhe "Abertas", relê a lista com 8 (`invalidateQueries`) e afirma que as 8 aparecem sem filtro. Mais o bloco `-  const filtroEmUso = comFiltro ? filtro : 'todas'` / `+  const filtroEmUso = filtro`.

3. **`AtividadesDaTurma.tsx:159` (`{ replace: true }` no `fechar`): o teste não prova o que o nome diz.** O teste "Esc fecha o painel, tira o parâmetro do endereço **sem empilhar histórico**" (`AtividadesDaTurma.test.tsx:328-338`) só olha `localizacao.history.at(-1)`. Esse valor é o mesmo com `replace` ou sem ele.
   - **Correção:** afirmar `expect(localizacao.history).toHaveLength(2)` (com `replace`, `[base, base]`; sem ele, 3 entradas) e acrescentar o bloco `-  ... , { replace: true })` / `+  ...)`.

4. **Cláusulas novas provadas por teste, mas sem bloco em "Mutações":**
   - **`AtividadesDaTurma.tsx:255-257`:** o foco vai ao bloco "O que fazer" quando muda o estado. O teste é o `:414-433` ("o foco não se perde no corpo da página"), e o bloco seria `-    if (document.activeElement === document.body) reserva.current?.focus()` / `+    if (document.activeElement === document.body) void reserva`.
   - **`AtividadesDaTurma.tsx:34`:** `pendente → 'para_revisar'`. O teste é o `it.each` de `:131`, e o bloco seria `-  if (aplicada.entrega.estado === 'pendente') return 'para_revisar'` / `+  if (false) return 'para_revisar'`.
   - **`AtividadesDaTurma.tsx:71`:** o filtro "Para revisar", que é o que espera a professora. O teste é o `:238` ("cada opção deixa passar só o que o nome diz"), e o bloco seria `-  if (filtro === 'para_revisar') return estadoDaAtividade(aplicada) === 'para_revisar'` / `+  if (filtro === 'para_revisar') return aplicada.estado === 'encerrada'`.
   - **Correção:** acrescentar os três blocos. Os testes já existem.

**Recomendações:**
- **O caso "a resposta atrasada de encerrar não troca o estado da outra turma" em `e2e/professor-turma-atividades.spec.ts:116-147` hoje não tem como ficar vermelho.** Do jeito que o código está, ele não pega nada:
  - a API simulada devolve a segunda turma igual depois do encerrar;
  - nenhum caminho do front escreve a resposta do encerrar no cache: o `EncerramentoDaAtividade` só invalida pelo `aplicada.turmaId`.
  
  Vale manter como guarda de regressão, mas o texto do caso não deve sugerir que prova o `key`. Quem prova o `key` é o componente.
- **Falta o caso de borda da mesma atividade aplicada duas vezes à turma** (prática e depois avaliativa), com o mesmo título. Duas linhas com nome igual precisam abrir painéis diferentes pelo id. Hoje `linhaDe` busca a linha pelo título e não pega a confusão.
- **`AplicacaoDoArtefato.tsx:44`:** a extração tirou a trava comum entre "Aplicar" e "Corrigir de novo", e cada um passou a ter o seu `decidindo`. O efeito prático é nulo, mas vale uma linha no comentário.
- **O "1 de 1 aluno enviaram"**, que o `frontend-reviewer` já registrou, entra no teste de `situacaoDaAplicacao` quando for corrigido.

Arquivos de referência:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/AtividadesDaTurma.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/AtividadesDaTurma.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-turma-atividades.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/11_task.md`

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-19 14:36:02 · `tasks/prd-telas-do-professor/11_task.md`

VEREDITO: APROVADO
Tela vista: sim (6 fotos lidas, escola cheia e vazia, no computador e no celular; a lista e o painel aberto de "Estequiometria" na cheia, e o vazio na vazia)
Estados: ok. Com dado, vazio e painel aparecem nas fotos. Carregando e erro não aparecem na vitrine. Conferi o carregando pelo diff: o teste novo afirma que "Nada com este filtro" e o convite de aplicar não aparecem enquanto a lista carrega.
Acessibilidade: ok pelo que se vê. O painel é um `dialog` nomeado, com "Fechar" e retorno de foco à linha, e os testes do diff cobrem isso. A frase de apoio mudou para "Situação da atividade e o que fazer agora." e continua sendo a descrição do painel (`idDaDescricao`).
Chromebook fraco: sem mudança nesta rodada, pois o código de tela alterado são só duas frases. A página não rola a 1366 × 768 (a linha "Rolam" diz nenhuma), e a lista só ganha filtro acima de oito linhas.
Celular: ok a 360 px. Não há rolagem horizontal. O título longo é cortado com reticências, mas o texto inteiro está no painel. Os botões "Aplicar uma atividade", "Abrir a atividade" e "Ver a correção" têm altura de 44 px ou mais. Não há nada que dependa de hover. O painel vira folha de baixo, com os botões empilhados e legíveis.
Ação oficial protegida: sim. Este diff não mexe em aprovar nem em encerrar. O painel mostra título, turma, datas e situação ("Você aprovou a correção…"), e a confirmação de encerrar segue pelo diálogo que diz a turma e o efeito.

Rodada nova, correções exigidas:
- Rodada anterior sem correção exigida. As duas recomendações aplicadas estão na tela. "1 de 1 aluno enviou" aparece nas fotos do computador e do celular, na lista e no painel (`apps/web/src/areas/professor/aprovar.ts:134`, com teste e mutação em `aprovar.test.ts`). A frase do painel aparece nas duas fotos do painel (`AtividadesDaTurma.tsx:289`).
- O diff de código de tela é só isso e o texto não contradiz `docs/interface.md`.
- Os testes novos provam o vazio do filtro, o filtro que some quando a lista encolhe, o `replace` ao fechar e o painel pelo id com títulos iguais.

Bloqueantes: nenhum

Recomendações:
- Título cortado a 360 px na `Linha`: já registrado no `TODO.md`. Se vários títulos ficarem parecidos, vale avaliar duas linhas de título no celular.
- Fotografar o painel nos outros estados (aberta, para revisar, sem correção, "Corrigir de novo") na validação. A foto só cobre "Correção aprovada".
- "1 de 30 alunos enviou" é aceitável, mas "1 de 30 alunos enviaram" também seria lido sem estranheza. É questão de gosto e não bloqueia.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-19 14:36:20 · `tasks/prd-telas-do-professor/11_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum novo nesta rodada. O diff mexe em dois textos de tela, testes, comentários e documentos. "Corrigir de novo" pede um lote de correção novo, que nasce pendente. Isso não grava `Nota`. Todos com autor humano? sim

Decisão autônoma sobre aluno: ausente

Aprovação registrada: ok. O teste novo "duas atividades com o mesmo título abrem painéis diferentes, pelo id de cada uma" (`apps/web/src/areas/professor/AtividadesDaTurma.test.tsx`) prova que a atividade com entrega pendente abre o painel com "Revisar a correção". Prova também que a atividade aberta não abre esse painel, então nenhuma correção pendente fica escondida atrás de um título repetido.

Supervisão do tutor: ok. A tarefa não toca o tutor.

Autonomia declarada e visível: sim. A tarefa não mexe nisso.

Bloqueantes: nenhum.

O que conferi no diff desde a rodada aprovada (`.processo/ordens/diff-11-r2.txt`):
- **`apps/web/src/areas/professor/AtividadesDaTurma.tsx:289`**: a frase do painel passou a ser "Situação da atividade e o que fazer agora.". Ela não fala de nota nem de conceito e não julga o aluno.
- **`apps/web/src/areas/professor/aprovar.ts:134`**: o texto passou a dizer "enviou" no singular e "enviaram" no plural. Continua só a contagem, sem nome de aluno e sem lista de quem não entregou (regra 70, item 7). O teste cobre 1 de 1, 1 de 30 e 0 de 30.
- **`apps/web/src/areas/professor/AplicacaoDoArtefato.tsx`**: "Aplicar" e "Corrigir de novo" agora têm cada um a sua trava contra clique repetido. Na conformidade não muda nada, porque as duas ações continuam sendo decisão da professora e ficam registradas.
- **Fotos da tela**: as duas linhas "1 de 1 aluno enviou" e o painel de Estequiometria (`...button-name-Estequiometria--computador.png` e `--celular.png`) mostram o selo "Correção aprovada" e a frase "Você aprovou a correção. O diagnóstico por habilidade já chegou aos alunos da turma". Não aparece nota, conceito nem sugestão de nota. A escola vazia (`vazia--...-ec32-...--computador.png` e `--celular.png`) mostra só o convite para aplicar uma atividade. Nada induz uso: um botão, sem contador e sem recompensa.

Recomendações:
- As duas da 1ª rodada (dizer no painel quem aprovou a correção e quando, e a cor do selo "Sem correção") estão na tabela "Recomendações sem aplicar" de `tasks/prd-telas-do-professor/11_task.md`, cada uma com destino. O motivo dado para não aplicar a primeira (precisa de campo no contrato `entrega`, e a aprovação aparece na tela de revisar, na 14.0) é aceitável para esta tarefa. Quero ver quem aprovou e quando na 14.0.
- A foto da escola vazia no celular está com o nome errado no prompt: `vazia--professora--professor-turmas-01a15368-eaab-76e5-a0a5-94554e68f368--celular.png` não existe. A foto certa é `vazia--professora--professor-turmas-01a15368-ec32-7093-8358-a23b125e0c98--celular.png`, que li no lugar dela. Vale corrigir na lista de fotos de `tools/vitrine/` ou no modelo da ordem.

Arquivos lidos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/.processo/ordens/diff-11-r2.txt` e as fotos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/.processo/vitrine/`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 14:36:31 · `tasks/prd-telas-do-professor/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/techspec.md:297`: o parágrafo "Atividades na pele nova" agora tem os itens (10) e (11) inteiros numa linha só, muito mais longa que as vizinhas. Quebrar a linha como o resto do texto deixaria o próximo diff legível.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/aprovar.ts:134`: a linha de `partes` passou a ter três ternários. Tirar a concordância para uma constante, como `verbo`, antes do array fica mais fácil de ler.

O que conferi nesta rodada, sobre o diff desde a 1ª:
- **Concordância.** Agora sai "1 de 1 aluno enviou", e "0 de 30 alunos enviaram" continua no plural. As fotos mostram a frase certa na linha e no painel, no computador e no celular. O item correspondente em `TODO.md` foi marcado como feito.
- **Divergências.** A do selo "Encerrada" (item 11), a dos dois casos de e2e que saíram (item 10) e a da trava separada entre "Aplicar" e "Corrigir de novo" estão em `11_task.md` e na `techspec.md`. O item (6) agora descreve a releitura quando o cache vence, e isso confere com o `useQuery(consultaTurmaAberta(turmaId))` em `AtividadesDaTurma.tsx:126`. A troca do texto de descrição do painel é só texto.
- **Fotos.** A lista, o painel aberto e o vazio usam os nomes do glossário e só mostram o que a tarefa pede. No vazio aparece uma ação só ("Aplicar uma atividade"), e nenhum aluno é nomeado.

Os casos de teste novos e os blocos de mutação acrescentados são da área do `test-engineer`. Não os audito.

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 14:36:46 · `tasks/prd-telas-do-professor/11_task.md`

VEREDITO: APROVADO

Cenários exigidos (tarefa 11.0, a aba Atividades da turma):
- **Caminho feliz:** a lista vem com a mais nova primeiro e abre o painel pela linha.
- **Casos de borda:**
  - duas atividades com o mesmo título;
  - lista que encolhe até o limite com um filtro escolhido;
  - filtro sem resultado;
  - atividade encerrada sem correção que valha (função suspensa e lote rejeitado);
  - avaliativa aberta;
  - "1 de 1 aluno enviou".
- **Permissão e isolamento:** um id de outra turma, inexistente ou sem sentido não abre o painel.
- **Concorrência:** dois cliques no mesmo instante em "Corrigir de novo" mandam um pedido só. A resposta atrasada de "Encerrar" não passa para a outra turma, provado no componente pelo `key` e no e2e como guarda de regressão.

Cobertos: todos. Conferi as quatro correções exigidas na 1ª rodada:
1. **Cláusula do vazio do filtro** (`AtividadesDaTurma.tsx:195`). Os testes "carregando" (`AtividadesDaTurma.test.tsx:179`) e "vazio" (`:205`) agora afirmam que "Nada com este filtro" não aparece. O bloco cita "carregando". Com a mutação, lá a lista está vazia e o texto apareceria, então o teste fica vermelho pelo motivo certo.
2. **`filtroEmUso`** (`:136`). O caso novo em `AtividadesDaTurma.test.tsx:278` monta nove linhas, escolhe "Abertas" e relê a lista com oito. Ele espera as oito linhas na tela, sem o filtro e sem "Nada com este filtro". Com `filtroEmUso = filtro`, "Abertas" continuaria valendo, a lista sairia vazia e a espera pelas oito falha. O bloco foi incluído.
3. **`replace` no fechar** (`:159`). O teste agora afirma `localizacao.history` com tamanho 2 (`AtividadesDaTurma.test.tsx:358`). O `memoryLocation` com `record: true` guardaria três passos sem o `replace`. O bloco foi incluído.
4. **Três cláusulas sem bloco.** O foco ao bloco "O que fazer" agora tem bloco ligado a "encerrar pelo painel". O estado pendente que vira "para revisar" tem bloco ligado a "o estado de cada linha". O filtro "Para revisar" tem bloco ligado a "cada opção deixa passar só o que o nome diz". Este último usa o `Set(['para_revisar'])`, que a mutação quebra, porque deixa entrar as aprovadas.

Também conferi os blocos novos que vieram além do exigido:
- **Painel pelo id:** a mutação para `visiveis[0]?.id` abre a atividade errada, e o teste espera o id da primeira (`:375`).
- **Concordância de "enviou":** `aprovar.test.ts:141-143` cobre 1 de 1, 1 de 30 e 0 de 30.

Rodei `npx vitest run` nos dois arquivos de teste: 84 testes verdes. Não há `.skip`, mock da regra testada nem provedor de IA. A frase de descrição do painel que mudou não é citada em nenhum teste nem e2e.

Bloqueantes: nenhum.

Recomendações:
- O bloco do vazio do filtro cita só o caso "carregando". O caso "vazio" (`AtividadesDaTurma.test.tsx:205`) prova a mesma coisa e poderia virar um segundo bloco, para o caso de "carregando" mudar um dia.
- O bloco do foco (`void reserva`) depende de que `EncerramentoDaAtividade`, pelo `focoDeReserva`, não devolva o foco ao painel sozinho. O portão o provou vermelho hoje. Se a peça de encerrar passar a cuidar do foco, o bloco ficaria verde sem a cláusula. Vale ligar um segundo bloco ao teste "Corrigir de novo pede a correção uma vez" (`:480`), que não passa pelo diálogo.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/AtividadesDaTurma.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/AtividadesDaTurma.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/aprovar.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/11_task.md

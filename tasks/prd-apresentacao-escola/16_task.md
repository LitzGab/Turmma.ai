# Tarefa 16.0 — Web: pedidos com os diálogos de decisão, do professor e da coordenação

**Funcionalidade:** apresentacao-escola · **Depende de:** 15.0, 13.0, 8.0 · **Paralelo com:** 9.0, 10.0, 12.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O professor vê os pedidos da turma chegando sozinhos, seleciona até 40 e aprova ou recusa depois de revisar turma,
nomes e efeito; a coordenação faz o mesmo de dentro da turma, com "Atualizar" e o aviso de que fica registrado; e
cada pedido termina com o resultado dele em texto.

## Contexto necessário

- `docs/interface.md` 11.1 (variantes `oficial` e `perigo`) e 8.4 (decisão oficial)
- `techspec.md` seções 4 (reivindicações, `decidir`) e 9 ("Decisão")
- `cenarios.md`: W6, W15, W4 (linha "Pedidos"), W12; A2 (a coordenação audita cada leitura)
- `.claude/rules/50-frontend.md`; regras 20 (item 10), 70 (ação oficial clara)
- Código:
  - As rotas da 8.0; a turma do professor (15.0) e a da coordenação em Estrutura (13.0)
  - O diálogo em `apps/web/src/componentes/` (14.0) e o padrão de foco devolvido
  - `tasks/prd-apresentacao-painel/achados/indice.md`, 7.0: a chave da linha pela posição, o anúncio vazio

## Nota da 8.0 (`conformidade-reviewer` e `revisor-geral`, 1ª rodada)

- A marca `teveMatriculaErrada` aparece como fato sobre o pedido ("alguém tentou este nome com outra matrícula"), nunca
  como suspeita sobre o aluno (regra 70, item 7).
- Um 5xx no meio do `decidir` não desfaz os ids já decididos, e a resposta não diz quais: depois de um erro, a tela relê
  os pedidos da turma.

## Nota da 13.0 (`frontend-reviewer`, 1ª rodada)

- Na lista de nomes da turma (`apps/web/src/areas/coordenacao/ListaDaTurma.tsx`), o aluno aprovado vem sem nome nem
  matrícula e o cartão diz "Aluno aprovado" no título e no estado: trinta aprovados viram trinta cartões iguais. Esta
  tarefa, que põe os pedidos e os aprovados dentro da turma, decide como a turma os mostra (uma contagem, ou o nome que a
  rota dos alunos da turma já entrega com auditoria).
- As peças de `apps/web/src/areas/coordenacao/dialogos.tsx` (`Anuncio`, `AlertaDaFalha`, `useEnvioUnico`, `textoDaFalha`,
  os dois diálogos) se movem para `apps/web/src/componentes/` quando a área do professor precisar delas (ver a nota no
  `15_task.md`), sem copiar (`revisor-geral`, 1ª rodada da 13.0).

## Herdado da 15.0 (`frontend-reviewer`, 3ª rodada)

- O aviso de turma indisponível está escrito duas vezes: na seção do acesso (`apps/web/src/areas/professor/AcessoDaTurma.tsx`)
  e no `TurmaIndisponivel` da página (`apps/web/src/areas/professor/Turma.tsx`), que recebe o foco quando chega por
  releitura. Esta tarefa põe os pedidos na mesma página e vai precisar do mesmo aviso: vira um componente só, decidindo
  quando ele puxa o foco.

## Subtarefas

- [x] 16.1 — Pedidos do professor na turma: nome, hora e a marca "Houve tentativa com matrícula errada neste nome;
  pode ter sido erro de digitação", sem número nem hora; atualiza a cada 15 s só com a aba visível, mantendo a
  seleção por id, o foco e os ids do diálogo aberto, e anuncia os novos em `aria-live="polite"` sem roubar o foco
- [x] 16.2 — Pedidos da coordenação dentro da turma: só com o clique em "Atualizar", mandando a finalidade; o vazio
  próprio, sem botão
- [x] 16.3 — Seleção por caixa, até 40, o 41º desabilitado com o texto do limite; não existe "aprovar todos"
- [x] 16.4 — "Aprovar N" (`oficial`): turma, nomes, efeito e, pela coordenação, o aviso de auditoria; "Recusar"
  (`perigo`): confirma e diz que o nome volta à lista. Depois, texto por pedido: `ja_decidida` é "Já decidido por
  outra pessoa", `nao_encontrada` é "Este pedido não está mais disponível"
- [x] 16.5 — Tetos dos chunks `professor-*` e `coordenacao-*` revistos
- [x] 16.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx`, `DialogoDeDecisao.tsx`, `textos.ts` | novo |
| `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts` (e teste) | novo |
| `apps/web/src/api/pedidos.ts`; `areas/professor/Turma.tsx`, `areas/coordenacao/Estrutura.tsx` | novo, alterado |
| `.size-limit.json`, `e2e/pedidos.spec.ts` | alterado, novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W6 | e2e | os dois diálogos com o que mostram; clique duplo em confirmar manda um pedido; os textos de `ja_decidida` e `nao_encontrada`; a marca da tentativa errada, também no diálogo; o 41º não selecionável; sem "aprovar todos" |
| W15 | unidade | relógio falso e `visibilitychange`: 15 s com a aba visível, parado escondida; seleção, foco e diálogo mantidos; anúncio sem roubar o foco; a coordenação sem leitura nenhuma em 60 s sem o clique |
| W4 (Pedidos) | e2e | os quatro estados, com o vazio de cada papel; vazio e erro com a rota interceptada |
| W12 (Pedidos) | e2e | 360 px em cartões; alvos de 44 px; selecionar e decidir só com Tab, Espaço e Enter, foco preso no diálogo e devolvido |
| recomeço da tela | e2e | segunda pessoa: a coordenação entra na mesma aba depois do professor, sem a seleção nem os pedidos dele; mesma entrada: confirmar de novo o mesmo lote mostra `ja_decidida`, sem pedido em dobro; resposta atrasada: a atualização de 15 s que chega depois da decisão não traz de volta o pedido decidido; lista recarregada com o diálogo aberto: o pedido que sumiu sai do diálogo, e o aviso e o foco da tentativa anterior saem |
| log novo | — | a tarefa não escreve log |
| W15, a parte do navegador (divergência) | e2e | com o relógio da aba simulado: o pedido novo chega 15 s depois; a caixa marcada continua marcada e com o foco; a região `aria-live="polite"` diz quantos chegaram, e a primeira leitura não anuncia nada; a coordenação não lê em 60 s, nem com `visibilitychange` e `focus` |
| A2, pela tela | e2e | cada clique em "Atualizar" da coordenação manda a finalidade `conferencia_de_cadastro` e grava um `turma.reivindicacoes_lidas` em nome dela; a leitura que a rota derruba não grava nada; a decisão não lê |
| a leitura de cada papel (divergência) | unidade | o professor sem finalidade, a coordenação com ela, os dois com `limite=100`; a chave do cache por turma e por papel; a da coordenação desligada (nem `invalidateQueries`, nem `resetQueries` a disparam) e fora do cache quando a tela sai; a resposta com matrícula não chega à tela |
| a lista depois da decisão (divergência) | unidade e e2e | todo id da resposta sai da lista, qualquer que seja o resultado; a leitura no ar é descartada; a do professor é relida, e a da coordenação não; depois da falha, a do professor é relida com a lista de antes ainda na tela, e a da coordenação é esvaziada, sem leitura |
| a decisão que falha (nota da 8.0) | e2e e unidade | o texto diz o que houve com a lista de cada papel, com o foco no aviso; a coordenação fica só com "Fechar", a lista e a marcação saem da tela, e o pedido volta desmarcado no "Atualizar" seguinte; a resposta que se perde depois de o servidor decidir recarrega a lista de nomes |
| há mais pedidos que os de uma leitura (divergência) | e2e | a resposta com `proxima` faz a tela dizer que os próximos aparecem depois; sem ele, não diz |
| o diálogo sem nenhum pedido (divergência) | e2e | o único pedido do diálogo decidido por outra pessoa: "…Nada foi enviado.", com o foco no texto e só "Fechar" |
| a turma que sai do alcance (herdado da 15.0) | e2e | professor: o vínculo encerrado com a tela aberta faz a leitura seguinte trocar a página pelo aviso, um só, com o foco nele, sem nome de aluno e sem o nome da turma no título da aba; coordenação: o ano encerrado faz o "Atualizar" trocar a página pelo aviso dela, com o foco; na página que já abre sem a turma, o aviso não puxa o foco |
| os aprovados na lista de nomes (nota da 13.0) | e2e | depois de aprovar dois, a lista de nomes da coordenação diz "Aprovados nesta turma: 2", sem cartão "Aluno aprovado" |
| um lote de 40 | e2e | 40 marcados, com um já decidido por outra pessoa e um que deixou de existir: um `POST`, 38 alunos, e os três textos de resultado |
| teto dos chunks | unidade | o `.size-limit.json` declara 8 kB para `professor-*` e 16 kB para `coordenacao-*`; o chunk entre o teto novo e o antigo reprova |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [x] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral` e os guardiões, com
  rodada que vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Aprovar sem o diálogo de revisão; qualquer contagem pública de quem entrou (D59); tempo real por WebSocket (o
intervalo de 15 s basta na A1).

## Plano e autoconferência

- **Arquivos**: `api/pedidos.ts`; `componentes/pedidos/{ListaDePedidos,DialogoDeDecisao}.tsx`, `textos.ts`,
  `atualizacao-dos-pedidos.ts`; `componentes/TurmaIndisponivel.tsx`; a classe `oficial` em `componentes/botao-secundario.ts`;
  `areas/professor/{Turma,AcessoDaTurma}.tsx`; `areas/coordenacao/ListaDaTurma.tsx`; `.size-limit.json`;
  `e2e/pedidos.spec.ts` e as fixtures.
- **Peças que já existiam**: os contratos da 8.0 (`esquemaRespostaPedidosDaTurma`, `esquemaRespostaDecisao`,
  `MAXIMO_DE_PEDIDOS_POR_DECISAO`, `DecisorDaReivindicacao`, `FINALIDADES_DA_LEITURA_DE_ALUNOS`, `TAMANHO_MAXIMO_DA_PAGINA`);
  `Dialogo`, `useDialogoDaTela`, `useEnvioUnico`; `Falha` e `useFocoDaEtapa` da cópia única; `textoDaFalha` e `listaMudou`;
  `EstadoVazio`, `EstadoErro`, `EstadoCarregando`; `formatarDataHora`, `formatarQuantidade` e `formatarNumero`; as classes
  do `perigo` e do secundário; o padrão do erro por cima da lista, de Professores (14.0).
- **O segundo dado que torna cada cláusula observável**: os dois papéis na mesma turma (a chave da leitura, a finalidade, a
  leitura desligada); o pedido com a marca e o sem; 41 pedidos, e não 40; a lista com `proxima` e sem; a lista vazia e a
  cheia quando a releitura cai; a primeira leitura com três pedidos (não anuncia) e a segunda com um a mais (anuncia); o
  pedido marcado que não é o primeiro da lista, com um novo chegando; um lote com `decidida`, `ja_decidida` e
  `nao_encontrada` juntos; aprovar e recusar; a falha em que nada foi decidido e a falha em que o servidor decidiu.
- **Checagem que responde antes**: a leitura da coordenação que a rota derruba não chega à API (a auditoria continua em
  zero, e isso é afirmado); o `ja_decidida` e o `nao_encontrada` vêm da API de verdade, com a lista da tela parada na
  leitura anterior e nenhuma leitura no ar quando o banco muda; na resposta atrasada, a API já respondeu a leitura antes
  de a decisão sair, e a asserção espera a resposta ser entregue e a tela ter tempo de se redesenhar.
- **Em paralelo**: a tela não grava nada sozinha; a corrida do servidor é o C3 da 8.0. Aqui o que se prova é a trava do
  pedido no ar, com os dois cliques no mesmo instante, um `POST` e a contagem de alunos no banco.
- **Guardiões**: `frontend-reviewer` — quatro estados na seção dos dois papéis, 360 px com nome comprido, alvos de 44 px,
  marcar e decidir só com o teclado, foco em cada etapa e devolvido, o que acontece dito antes de aprovar e de recusar, o
  `oficial` só na aprovação; `privacy-guardian` — a tarefa não cria campo nem log; o nome do aluno só passa pela resposta
  da leitura e pela memória da página (fora de URL e do armazenamento); a matrícula nunca chega à tela dos pedidos (o
  contrato a recusa); a leitura da coordenação é auditada a cada vez e nunca sai sozinha, e a lista dela não fica no
  cache fora da tela; a lista de um papel não é a do outro; a marcação e o diálogo saem com a tela; a marca é dita como
  fato sobre o pedido; fixtures sintéticas.

## Divergências resolvidas nesta tarefa

Registradas também na `techspec.md` (seção 9, "Decidido na 16.0"), no `cenarios.md` (W4 de Pedidos, W6, W12 e W15) e em
`docs/interface.md` (seções 1 e 3).

- **A turma da coordenação é `ListaDaTurma.tsx`**, e não `Estrutura.tsx`, como a lista de arquivos previa: é lá que a
  turma abre desde a 13.0. A seção dos pedidos fica embaixo da lista de nomes.
- **O W15 se divide**: a unidade prova o relógio, a aba, o papel e o que se mantém por id; o foco e a região viva, que
  são do navegador, estão no e2e, com o relógio da aba simulado. A web não tem ambiente de DOM na unidade (13.0).
- **Regra nova: uma leitura traz até 100 pedidos**, e havendo mais a tela diz, em vez de paginar. Quem chama: a tela do
  professor, a cada 15 s por aba à vista (60 turmas dão 4 leituras por segundo, numa consulta pelo índice
  `(escola_id, turma_id, estado, solicitada_em)`), e a da coordenação, no clique. Não grava nada pelo professor.
- **Regra nova: a aba que volta a ficar à vista relê na hora** e recomeça os 15 s. A leitura não conta como atividade
  da sessão (o comentário de `sessao/inatividade.ts` passou a dizer isso).
- **Regra nova: a coordenação não tem leitura nenhuma sem o clique**, nem ao abrir a turma, nem depois de decidir, nem
  depois de uma falha. Por isso a lista dela, depois da decisão, é só a resposta aplicada; e, depois de uma falha, sai da
  tela, com a marcação. A leitura do professor depois da falha continua (nota da 8.0). Quem grava: só o servidor, um
  `turma.reivindicacoes_lidas` por clique.
- **Regra nova: o diálogo acompanha a lista.** O pedido decidido por outra pessoa com ele aberto sai dele; sem nenhum, só
  resta fechar. O título do diálogo não leva a quantidade ("Aprovar pedidos"): ela muda com ele aberto, e fica no texto e
  no botão ("Aprovar 2 pedidos").
- **O resultado fica no diálogo**, com o nome de cada pedido enviado, e não na seção: a lista já não tem os decididos.
- **Os botões da decisão só existem com pedido marcado.** Sem nenhum, a seção diz como decidir. Assim o foco, ao fechar o
  resultado, vai ao título da seção, em vez de cair num botão desligado.
- **A turma que sai do alcance tira a página inteira, com um aviso só** (herdado da 15.0): a leitura dos pedidos avisa a
  página (`aoPerderATurma`), e o aviso é `componentes/TurmaIndisponivel.tsx`, usado pela página do professor, pela seção
  do acesso e pela página da coordenação, com o texto de cada uma. Puxa o foco só quando a turma sai com a tela aberta.
- **Os aprovados viram contagem** na lista de nomes da coordenação (nota da 13.0): a opção sem leitura nova de dado
  nominal. A decisão da coordenação recarrega a lista de nomes, como as outras escritas da tela (leitura auditada).
- **Tetos**: `professor-*` de 10 para 8 kB (mede ~5,5) e `coordenacao-*` de 20 para 16 kB (mede ~13,5). O primeiro
  carregamento foi de 126,2 para 129,7 kB de 150, com os pedidos num `parte-*` que as áreas dividem.
- **Arquivos fora da lista prevista**: `componentes/TurmaIndisponivel.tsx`, `componentes/botao-secundario.ts`,
  `componentes/pedidos/textos.test.ts`, `api/pedidos.test.ts`, `areas/professor/AcessoDaTurma.tsx` (o título da seção vem
  de quem desenha a página, e o aviso é o componente comum), `areas/coordenacao/ListaDaTurma.tsx`, `sessao/inatividade.ts`
  (só comentário), `e2e/__fixtures__/sessao.ts`, uma asserção em `e2e/estrutura.spec.ts`, `tools/ci/tamanho-web.test.ts` e
  os documentos acima.

## Mutações

Rodadas em 02/10/2026, cada uma restaurada antes da seguinte. As de unidade, uma por vez. As da tela no e2e
(`e2e/pedidos.spec.ts`, e as duas indicadas nos outros specs), no projeto `chromebook`, com a web do compose de teste
reconstruída a cada lote; os lotes juntaram mutações de testes diferentes, e cada linha diz a asserção que ficou vermelha
no teste dela. As linhas são as do código de agora.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `apps/web/src/api/pedidos.ts:53` (o `limite=100` da leitura) | unidade: "o professor lê sem finalidade; a coordenação manda a finalidade…" |
| `apps/web/src/api/pedidos.ts:54` (a finalidade só da coordenação, invertida) | unidade: a mesma, e "para o professor a lista ainda é relida…" |
| `apps/web/src/api/pedidos.ts:51` (a chave por turma e por papel: sem o papel; sem a turma) | unidade: "a lista que o professor leu não é a da coordenação…" (duas mutações) |
| `apps/web/src/api/pedidos.ts:57` (`enabled: !daCoordenacao`, trocado por `true`) | unidade: "a da coordenação não lê nada sozinha…" e "todo id da resposta sai… sem leitura nova da coordenação" |
| `apps/web/src/api/pedidos.ts:58` (o `gcTime: 0` dos dois papéis; trocado pelo só da coordenação, depois de a recomendação do `privacy-guardian` o estender ao professor) | unidade: "a lista não fica guardada depois de a tela sair, nem a da coordenação nem a do professor" |
| `apps/web/src/api/pedidos.ts:55` (o contrato da leitura, trocado por um que aceita tudo) | unidade: "a resposta fora do contrato não chega à tela…" |
| `apps/web/src/api/pedidos.ts:64` (o caminho e o corpo do decidir) | unidade: "decidir manda os ids e a decisão…" (duas mutações) |
| `apps/web/src/api/pedidos.ts:75` (o `cancelQueries` da decisão) | unidade: "resposta atrasada: a leitura que estava no ar…"; com a `:78` junto, e2e (recomeço, resposta atrasada): `expect(linhas(page)).toHaveText([/^Bruno/])` depois de a leitura atrasada chegar |
| `apps/web/src/api/pedidos.ts:77` (todo id da resposta sai da lista) | unidade: "todo id da resposta sai da lista na hora…" |
| `apps/web/src/api/pedidos.ts:78` (a releitura depois da decisão) | unidade: "para o professor a lista ainda é relida depois da decisão…" |
| `apps/web/src/api/pedidos.ts:89` (depois da falha, o professor relê sem esvaziar; trocado pelo `reset`) | unidade: "depois da decisão que falha, a lista do professor é relida…" (a lista de antes fica enquanto a releitura não volta) |
| `apps/web/src/api/pedidos.ts:90` (depois da falha, a coordenação esvazia: sem o `reset`; trocado por `invalidate`) | unidade: a mesma (duas mutações) |
| `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts:33` (a guarda do papel) | unidade: "nenhuma leitura sai em 60 s com a aba à vista…" |
| `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts:10` (os 15 s) | unidade: "o intervalo é de 15 segundos" e "uma leitura a cada 15 s…" |
| `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts:41` (só com a aba à vista) | unidade: "com a aba escondida, para…" e "a turma aberta com a aba já escondida…" |
| `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts:44` (relê na volta da aba) | unidade: as mesmas duas |
| `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts:45` (recomeça a contagem na volta) | unidade: "com a aba escondida, para…" |
| `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts:50` e `:51` (para e deixa de ouvir a aba ao sair) | unidade: "quando a lista sai da tela…" (duas mutações) |
| `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts:62` (os que continuam, por id; trocado pela posição) | unidade: "a marcação é por id…" e "o pedido que outra pessoa decidiu sai da marcação…" |
| `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts:67`, `:75` e `:76` (o limite de 40: `<=`; sem o limite; sem desmarcar) | unidade: "o limite é o do contrato: 40", "o 41º não é marcado…", "marca o que não estava…" (três mutações) |
| `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts:81` (os novos pelo id) | unidade: "os pedidos novos são contados pelo id…" |
| `apps/web/src/componentes/pedidos/textos.ts:86`, `:88`, `:107`, `:43` e `:69` (o resultado, a falha por papel, o `NAO_ENCONTRADO`, o verbo e o rótulo) | unidade (`textos.test.ts`), uma por mutação (seis) |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:83` (o anúncio dos novos) | e2e (W4 e W15, professor): `expect(regiaoViva(page)).toHaveText('2 pedidos novos na lista.')`; (W4 e W6, coordenação) o de 3 |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:82` (a primeira leitura não anuncia) | e2e (recomeço, lista recarregada): `expect(regiaoViva(page)).toHaveText('')` |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:84` (a marcação sem os que saíram) | e2e (W4 e W6, coordenação): `expect(caixa(page, carla.nome)).not.toBeChecked()`, depois da falha e do "Atualizar" |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:88` (a atualização agendada pelo papel, trocado por `coordenacao`) | e2e (W4 e W15, professor): `expect(secao(page).getByRole('alert')).toHaveText(…)`, a releitura que não sai |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:94` (a turma perdida avisa a página) | e2e (W4 e W15, professor): `expect(aviso).toHaveText(TEXTO_DA_TURMA_INDISPONIVEL…)`; (W4 e W6, coordenação) o da coordenação |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:111` (o carregando) | e2e (W4 e W15, professor e W4 e W6, coordenação): `…filter({ hasText: 'Carregando os pedidos…' })).toBeVisible(…)` |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:112` (o erro sem lista) | e2e (W4 e W6, coordenação): `expect(secao(page).getByRole('alert')).toHaveText(…)`, no primeiro "Atualizar" |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:114` (o "antes da leitura" da coordenação) | e2e (W4 e W6, coordenação): `expect(secao(page)).toContainText(TEXTO_ANTES_DA_LEITURA…)` |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:118` (o erro no lugar do vazio) | e2e (W4 e W15, professor): `expect(secao(page).getByRole('alert')).toHaveText(…)`, com a lista vazia |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:119` (o passo do vazio) | e2e (W4 e W15, professor): `expect(secao(page).getByRole('button')).toHaveText(['Ver o acesso dos alunos'])` |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:123` (o erro por cima da lista) | e2e (W4 e W15, professor): `expect(secao(page).getByRole('alert')).toHaveText(…)`, com três pedidos |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:124` (a contagem) | e2e (W4 e W15, professor): `toContainText('2 pedidos esperando a decisão')`; (W6, professor) a de 41 |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:137` (o 41º desligado) | e2e (W6, professor): `expect(aUltima).toBeDisabled()` |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:138` (a descrição do limite no 41º) | e2e (W6, professor): `toHaveAccessibleDescription(TEXTO_DO_LIMITE)` no lote em que ela foi a única desse teste |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:145` (a marca só no pedido que a teve: sempre; nunca) | e2e (W4 e W15, professor): `expect(linhas(page).nth(1)).toHaveText(…)` e `nth(0)` (duas mutações) |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:152` (o "há mais": nunca; sempre) | e2e (W6, professor): `toContainText(TEXTO_DE_QUE_HA_MAIS)` e `not.toContainText(…)` (duas mutações) |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:153` (o texto do limite) | e2e (W6, professor): `expect(secao(page)).toContainText(TEXTO_DO_LIMITE)` |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:162` e `:165` (o `oficial` e o `perigo` na seção) | e2e (W4 e W6, coordenação e W6, professor): as cores `COR_DO_OFICIAL` e `COR_DO_PERIGO` (duas mutações) |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:180` (o "Atualizar" só da coordenação) | e2e (W4 e W15, professor): `getByRole('button')).toHaveText(['Ver o acesso dos alunos'])`; (W6, professor) `toHaveCount(0)` |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:183` (o "Atualizando…") | e2e (W4 e W6, coordenação): `filter({ hasText: 'Atualizando…' })).toBeVisible()` |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:192` (o aviso de cada papel, nos dois sentidos) | e2e (W4 e W15, professor): `toContainText(TEXTO_DA_ATUALIZACAO_SOZINHA)`; (W4 e W6, coordenação) `toContainText(TEXTO_DA_AUDITORIA_DA_LEITURA)` |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:208` (a decisão aplicada à lista) | e2e: `expect(tituloDaSecao(page)).toBeFocused()` em quatro testes (os botões não saíam) |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:209` (a lista de nomes relida depois de decidir) | e2e (W4 e W6, coordenação): `toContainText('Aprovados nesta turma: 2…')` |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:212` (a lista descartada depois da falha) | e2e (W4 e W6, coordenação): `expect(noDialogo(page).getByRole('button')).toHaveText(['Fechar'])` |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:213` (a lista de nomes relida depois da falha) | e2e (W4 e W6, coordenação): o nome da Carla `Livre…` na lista de nomes, com a resposta perdida |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:216` (o foco de reserva) | e2e: `expect(tituloDaSecao(page)).toBeFocused()` em quatro testes |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:63` (o foco de cada etapa) | e2e (W4 e W6, coordenação, W6, professor e W12): `expect(tituloDoResultado(page)).toBeFocused(…)` |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:137` (a trava do pedido no ar, trocada por `mutacao.mutate`) | e2e (W6, professor): `expect(decisoes).toBe(1)` |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:98` (os do diálogo pela lista de agora, trocado pela posição) | e2e (recomeço, resposta atrasada): `expect(resultados(page)).toHaveText([Ana…])`. Na 1ª vez sobreviveu: o pedido marcado era sempre o primeiro da lista; o teste passou a marcar o segundo |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:132` (o aviso de auditoria só da coordenação: sempre; nunca) | e2e (W6, professor): `not.toContainText('auditoria')`; (W4 e W6, coordenação) `toContainText(TEXTO_DA_AUDITORIA_DA_DECISAO)` |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:139` (o `oficial` no aprovar e o `perigo` no recusar: sempre um; sempre o outro) | e2e (W6, professor): as cores do "Aprovar 40 pedidos" e do "Recusar 1 pedido" no diálogo |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:138`, `:141` e `:148` (desligado, "Aprovando…" e o status com o pedido no ar) | e2e (W6, professor): `getByRole('button', { name: 'Aprovando…' })).toBeDisabled()` e o status (três mutações) |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:127` (a marca no diálogo) | e2e (W4 e W6, coordenação e W6, professor): `expect(pedidosDoDialogo(page)…).toHaveText(…TEXTO_DA_MATRICULA_ERRADA…)` |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:88` (o nome no resultado) | e2e: `expect(resultados(page)).toHaveText(…)` em cinco testes |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:89` (o tom do resultado) | e2e (W6, professor): `expect(await corDoTexto(resultados(page).nth(1))).toBe(COR_DA_ATENCAO)` |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:121` (os que saíram) | e2e (recomeço, lista recarregada): `filter({ hasText: 'saiu desta decisão' })).toHaveText(…)` |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:100` (a falha) | e2e (W4 e W6, coordenação e recomeço, lista recarregada): `expect(falha).toHaveText(…DEPOIS_DA_FALHA…)` |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:102` (sem nenhum pedido, só fechar) | e2e (recomeço, lista recarregada): `expect(todosSairam).toBeVisible(…)`; (W4 e W6, coordenação) `toHaveText(['Fechar'])` |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:106` (a falha no lugar do "todos saíram") | e2e (W4 e W6, coordenação): `expect(falha).toHaveText(…)` |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:131` (o efeito) | e2e (W4 e W6, coordenação e W6, professor): `toContainText(EFEITO_DE_APROVAR)` |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:58` (a decisão no envio, sempre `aprovar`) | e2e (W6, professor): o nome recusado `livre` no banco; (W4 e W6, coordenação) o nome da Carla `Livre…` |
| `apps/web/src/areas/professor/Turma.tsx:41` (a página que perde a turma pelos pedidos) | e2e (W4 e W15, professor): `expect(aviso).toHaveText(TEXTO_DA_TURMA_INDISPONIVEL…)` |
| `apps/web/src/areas/professor/Turma.tsx:63` (o foco no aviso só com a turma já na tela: nunca; sempre) | e2e (W4 e W15, professor): `expect(aviso).toBeFocused()`; `acesso-da-turma.spec.ts`, W4: `not.toBeFocused()` |
| `apps/web/src/areas/professor/Turma.tsx:89` (o passo do vazio leva ao acesso) | e2e (W4 e W15, professor): `expect(tituloDoAcesso).toBeFocused()` |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:124`, `:107` e `:130` (a página da coordenação que perde a turma, o título da aba e o foco: nunca; sempre) | e2e (W4 e W6, coordenação): `toHaveText(TEXTO_DA_TURMA_FORA_DO_ANO…)`, `toHaveTitle('Turma · Turmma')`, `toBeFocused()`; `estrutura.spec.ts`, segunda pessoa: `not.toBeFocused()` (quatro mutações) |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:207` e `:211` (os aprovados em contagem, e fora dos cartões) | e2e (W4 e W6, coordenação): `toContainText('Aprovados nesta turma: 2…')` e `getByRole('listitem')).toHaveCount(2)` |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:248` (a lista de nomes relida pela decisão) | e2e (W4 e W6, coordenação): `toContainText('Aprovados nesta turma: 2…')` |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:54` (a contagem dos aprovados só dos nomes mostrados, com página por ler; bloqueante do `revisor-geral`, 1ª rodada) | e2e (os aprovados na lista de nomes): ``toContainText(`Aprovados entre os primeiros 100 nomes: 1. …`)`` |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:106` (o `cancelRefetch: false` do "Atualizar"; recomendação do `test-engineer`, 1ª rodada) | e2e (W4 e W6, coordenação): `expect(leituras).toHaveLength(2)`, depois de dois cliques no mesmo instante |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:165` (o `nome !== null` e a `matricula !== null` do filtro) | **sem mutação que os derrube**: o check `lista_nome_aprovado_sem_nome` garante nome e matrícula fora do aprovado; as duas condições estão lá para o tipo, e não para a tela |
| `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:66` (`focoInicial`) | **sobreviveu, como na 15.0**: o texto que abre o diálogo é o primeiro elemento que aceita foco, e o `showModal` já o escolhe; fica explícito para o foco não ir ao botão que decide se algo entrar antes dele |
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx:201` e `:195` (a `key` da abertura e a da região viva) | **sobreviveram, como esperado**: o diálogo é modal e só abre outro depois de fechar, e o fechar desmonta (a `key` fica pela regra do `useDialogoDaTela`); a da região viva faz o leitor de tela anunciar de novo o mesmo texto, o que o e2e não ouve |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `test-engineer`, 1ª | — | Aplicadas: o clique duplo em "Atualizar" (uma leitura, um registro), o comentário da espera fixa e a asserção sem efeito em `textos.test.ts` |
| `test-engineer`, 1ª | O `cancelRefetch: false` da atualização de 15 s sem teste próprio | `/validar`: a atualização que encontra uma leitura no ar se junta a ela; o efeito só seria uma leitura a mais, sem auditoria, e o do "Atualizar", que grava auditoria, está provado |
| `test-engineer`, 1ª | Dois pedidos com o mesmo nome: como o professor confere o homônimo, só pela hora | `/validar`, como pergunta de produto: a matrícula não chega à tela de propósito (regra 20); a marcação por id está provada na unidade |
| `frontend-reviewer`, 1ª | Sem rede no "Atualizar" (`networkMode` padrão): a leitura pausa sem dizer nada | `/retro`: é o padrão da web inteira, e pede decidir o texto de "sem conexão" para todas as telas |
| `frontend-reviewer`, 1ª | O texto de "há mais" diz "depois que estes forem decididos", e para a coordenação eles só vêm no "Atualizar" seguinte | `/validar`: provar o texto por papel pede um e2e da coordenação com mais de 100 pedidos; o texto atual não é falso, só incompleto |
| `frontend-reviewer`, 1ª | Desligar o `refetchOnWindowFocus` na consulta do professor, para a volta da aba ter uma regra só | `/validar`: as duas leituras se juntam pelo `cancelRefetch: false`, sem custo; mexer nisso pede teste próprio |
| `privacy-guardian`, 1ª | `gcTime: 0` também para a lista do professor | Aplicada (`api/pedidos.ts:58`, com o teste de unidade) |
| `privacy-guardian`, 1ª | O `conformidade-reviewer` confirmar no `/validar` que a marca aparece como fato também no diálogo | `/validar` |
| `revisor-geral`, 1ª | Congelar os pedidos do diálogo com a decisão no ar: a releitura que chega entre a gravação e a resposta mostra por um instante "Nada foi enviado" | `/validar`: provar a cláusula pede segurar a resposta da decisão e soltar uma releitura no meio; o instante termina quando a resposta chega, com o resultado certo |
| `revisor-geral`, 1ª | `nome.nome ?? ''` e o tipo que ainda permitia `null` | Aplicada: o tipo `NomeAindaNaLista` tem nome e matrícula, e o `??` saiu |
| `test-engineer`, 2ª | Comentar que o teste dos 102 nomes conta com a ordem do `uuidv7` em `lista.repository.ts:165`; conferir o singular "Aprovados nesta turma: 1." | `/validar`: se a ordem mudar o teste fica vermelho, e não verde por engano; o texto não tem plural (o número vem depois dos dois-pontos) |
| `frontend-reviewer`, 2ª | Anunciar o fim da lista ("Lista completa: N nomes") quando "Ver mais nomes" traz a última página, para o leitor de tela ouvir a contagem virar "nesta turma" | `/validar`: melhoria de leitor de tela da lista de nomes da 13.0, com o `Anuncio` da seção |
| `revisor-geral`, 2ª | Contar os aprovados por `estado === 'aprovado'`, e não por subtração do filtro dos cartões | `/validar`: com o check `lista_nome_aprovado_sem_nome` as duas contas dão o mesmo; mexer agora pediria outra rodada de todos os revisores só por isso |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-02 20:31:23 | 2026-10-02 20:33:05 | `test-engineer` | 1 | APROVADO | a2d2ea14e1ef5bc59 |
| 2026-10-02 20:33:18 | 2026-10-02 20:34:51 | `frontend-reviewer` | 1 | APROVADO | a5f3c9f87f836c7c0 |
| 2026-10-02 20:35:16 | 2026-10-02 20:35:59 | `privacy-guardian` | 1 | APROVADO | a698a7b8219ce24e5 |
| 2026-10-02 20:35:12 | 2026-10-02 20:36:17 | `revisor-geral` | 1 | REPROVADO | a9577a8175d645260 |
| 2026-10-02 21:03:28 | 2026-10-02 21:04:12 | `test-engineer` | 2 | APROVADO | a015fc52b77e8ecb0 |
| 2026-10-02 21:04:24 | 2026-10-02 21:05:01 | `frontend-reviewer` | 2 | APROVADO | a37c8d655bb836c4e |
| 2026-10-02 21:05:21 | 2026-10-02 21:05:36 | `revisor-geral` | 2 | APROVADO | a248e14392c85d203 |
| 2026-10-02 21:05:25 | 2026-10-02 21:05:47 | `privacy-guardian` | 2 | APROVADO | a78780b32171ff751 |

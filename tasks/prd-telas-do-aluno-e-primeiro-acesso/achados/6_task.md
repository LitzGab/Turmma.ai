# Achados das revisões — `tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 07:07:24 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md`

VEREDITO: APROVADO
Caminho quente tocado: prova (só a tela, sem mudança no envio, no servidor nem na fila de respostas)
Rate limit: ok (a tarefa não cria rota nem pedido novo)
Fila e prioridade: ok (não se aplica, sem job)
Concorrência: protegida. O envio é o mesmo de antes: idempotente no servidor, e o diálogo trava enquanto ele está em andamento (`confirmando={envio.isPending}`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Atividade.tsx:273`). `aoEntregar()` só liga uma variável da tela; se for chamada duas vezes, o resultado é o mesmo.
Índice e paginação: ok (não se aplica, sem query nova)
Degradação de IA: não se aplica (a fala da `Comemoracao` é texto fixo, sem chamada de modelo)
Migration: não se aplica
Métrica e alerta: ok (nenhum código novo no servidor; nenhum pedido novo da tela)
Bloqueantes: nenhum
Recomendações:
- Os itens de prova da regra 80, item 6, não mudam: resposta salva por questão, fila e reenvio (`fila-de-respostas.ts`) e relógio no servidor continuam como estavam. `entregueAgora` vive só na tela, sem `localStorage`, URL ou cache. Por isso uma segunda instância da API não muda nada, e o e2e "aluno seguinte no mesmo computador" prova que o próximo aluno não herda nada.
- A `Comemoracao` passa a ser importada pela tarefa aberta. Com a mudança em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/nome-dos-chunks.ts:141`, ela e o CSS dela vão para o pedaço `pecas-*` e ficam fora da entrada. O primeiro carregamento no Chromebook às 7h30 não fica mais pesado.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 07:07:30 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md`

VEREDITO: APROVADO

Tela vista: sim (4 fotos lidas, cheia e vazia, computador e celular). As formas "Respondendo" e "Entregue agora" não estão nas fotos, e as revisei pelo código, pelos testes de componente e pelo e2e. Rodei `Atividade.test.tsx`, `atividade.test.ts` e `nome-dos-chunks.test.ts`: 69 testes passam.

Estados: ok. Carregando, "não disponível" e erro com "Tentar de novo" ficam em `Atividade.tsx:427-439`. A vazia é a lista de Tarefas ("Nada para fazer agora. Quando quem dá a aula passar uma atividade para a turma, ela aparece aqui."), que convida e não se desculpa.

Acessibilidade: ok.
- `BarraPresa` tem `role="group"` com o nome "Trocar de questão".
- O estado do mapa de questões vai no nome do botão e no ícone, e as cores novas (`azul-claro`, `azul-borda`, `azul-texto`) existem em `estilos.css:87-89`.
- Depois do envio, o foco vai para o topo da tela (`topo.focus()`).
- A `Comemoracao` tem `figcaption` com a função e o selo "IA".
- O e2e roda axe (`violacoesGraves`) nas formas respondendo e entregue.

Chromebook fraco: ok.
- O salto da comemoração usa só `transform` e `opacity`, com uma iteração, e vira `animation: none` com movimento reduzido (`Comemoracao.css`).
- A barra presa tem fundo cheio, sem vidro fosco.
- A tarefa tem 4 a 8 questões, então não precisa de virtualização.

Celular:
- Foto a 360 px: sem rolagem lateral, título e selo quebram sem cortar, e a barra de baixo aparece no meio da foto só porque a captura é de página inteira.
- O e2e novo cobre 360 px: `larguraExcedente` igual a 0, "Próxima" e "Voltar às tarefas" com pelo menos 44 px, e "Próxima" à vista depois de rolar.
- Nada depende de hover. O fluxo não exige o celular.

Ação oficial protegida: sim. O diálogo "Enviar a atividade?" continua, e o envio só vira "Atividade enviada" depois que o servidor confirma. A comemoração fala só do fato da entrega, sem nota, acerto ou número, e o texto avisa que quem dá a aula vê a correção antes do aluno. Ela nunca aparece junto do resultado (`comemoracaoNaTela`, `atividade.ts:68`). O estado `entregueAgora` é só estado de tela (`Atividade.tsx:411`), sem `localStorage`, URL ou cache. A `key` da rota (`rotas.tsx:49`) zera a tela ao trocar de tarefa. Falha de rede e `ATIVIDADE_ENCERRADA` não geram comemoração.

Bloqueantes: nenhum. Conferi cada ponto bloqueante da lista contra as fotos e o código, e nenhum se confirmou.

Recomendações:
1. **Ordem do Tab (`Atividade.tsx:236-248`).** "Anterior" e "Próxima" agora vêm no DOM depois de "Enviar a atividade" e "Pedir ajuda ao Tutor", porque a barra presa é o último bloco. Quem usa teclado passa por esses dois para chegar em "Próxima". Vale reavaliar se o envio deve ir para dentro da barra, como no mockup 2.3a ("barra única").
2. **Dado da vitrine, não da tarefa.** A foto `.processo/vitrine/aluno--aluno-atividades--Estequiometria--computador.png` diz "Você respondeu 0 de 4 questões" com todas "FICOU EM BRANCO" e, ao mesmo tempo, "acertou 3 de 4". É incoerência do dado sintético do seed da vitrine. Vale corrigir o seed para a revisão visual futura não tropeçar nisso.
3. **Texto da comemoração.** O mockup 2.3c diz "Entregue!". A tela usa "Atividade entregue. Quem dá a aula vê a correção antes de você.", mais longa, mas passa no teste de falas. A troca "atividade" por "tarefa" nos textos está fora do escopo declarado.
4. **Foto "Entregue agora".** A vitrine não tem tarefa por responder, então essa forma só foi vista pelo e2e. Na validação, convém vê-la de verdade.

Arquivos principais, todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3`:
- `apps/web/src/areas/aluno/Atividade.tsx`
- `apps/web/src/areas/aluno/atividade.ts`
- `e2e/aluno-atividade.spec.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 07:07:31 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A tarefa só muda o frontend da tarefa aberta (moldura, barra presa e `Comemoracao`). Não cria campo, migration, rota, DTO nem chamada nova à API. O envio continua sendo o mesmo `POST /v1/atividades-aplicadas/:id/enviar`, com corpo vazio (o e2e confere isso em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/aluno-atividade.spec.ts:311`).

Fora da tabela de dados do docs/lgpd.md: nenhum, porque a tarefa não guarda dado novo. O estado `entregueAgora` vive só na memória da tela (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Atividade.tsx:411-412`). Não vai para `localStorage`, para a URL nem para o cache. O teste de componente confere que `localStorage` fica vazio e que `sessionStorage` não tem chave de comemoração.

Autorização por objeto: ok. A tarefa não mexe em rota nem em leitura do servidor. O "não disponível" continua igual para tarefa de outra turma e para endereço errado; só o texto mudou para apontar para Tarefas.

Logs: limpos. O diff não acrescenta `console`, envio de telemetria nem gravação de rastro. A `Comemoracao` também não tem nada disso.

Auditoria: a tarefa não toca ação que a regra 20, item 10 obriga a auditar. A comemoração é texto fixo da tela e não é saída de IA, então não há aprovação a registrar.

Envio externo: nenhum. A fala da comemoração é uma constante (`FALA_DA_ENTREGA`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/atividade.ts:54`). Nenhum modelo de IA é chamado.

Seed/fixture: sintético. As fixtures dos testes usam "Professora Sintética" e alunos criados por `criarAlunoComMatricula`. As fotos mostram "Colégio sintético da vitrine", "Aluno Sintético Caio 93dbeda5", "Aluno Sintético Téo 0b14a945" e "Professora Sintética Helena 93dbeda5".

Fotos da tela:
- `aluno--aluno-atividades--Estequiometria--computador.png` e `...--celular.png`: o aluno vê só os próprios dados (envio, quantas acertou, acertos por habilidade, questão por questão) e o nome de quem aprovou a correção. Esse nome já aparecia antes desta tarefa, porque a regra 70 exige mostrar quem aprovou. Não aparece colega, e o e2e confere isso (`.../e2e/aluno-atividade.spec.ts:359`). A comemoração não aparece com o resultado à vista, como a regra pede.
- `vazia--aluno--aluno-atividades--computador.png` e `...--celular.png`: a lista vazia não mostra dado de ninguém além do nome do próprio aluno no menu.

Pergunta de fechamento: a tarefa não cria dado guardado nem envio para fora, então não muda a resposta do sistema sobre o que guarda de um aluno.

Bloqueantes: nenhum.

Recomendações:
- Os testes cobrem um caso que importa para privacidade: o aluno seguinte no mesmo computador da escola não herda a comemoração nem as respostas do anterior (`.../e2e/aluno-atividade.spec.ts`, teste "o aluno seguinte no mesmo computador…"). Vale manter esse caso como padrão para qualquer estado de tela novo da área do aluno.
- A foto do computador mostra "Você respondeu 0 de 4 questões" ao lado de "Você acertou 3 de 4". É dado da vitrine que não bate entre si, não é problema de privacidade. Fica para o `frontend-reviewer` ou para quem monta a vitrine.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 07:08:00 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa só mexe no frontend e não grava nada. O envio continua sendo o `POST /enviar`, idempotente, e não cria `Nota`. Todos com autor humano? sim (nada mudou neste ponto).

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. O resultado continua aparecendo só depois da correção aprovada. Na foto `.processo/vitrine/aluno--aluno-atividades--Estequiometria--computador.png` aparecem "Correção aprovada por Professora Sintética Helena · 25/10, 05h10", a assinatura "Assistente · correção de objetiva" e o selo "IA", e o mesmo aparece no celular. A comemoração sai da tela quando o resultado chega (`comemoracaoNaTela` exige `resultado.tipo !== 'pronto'`, em `apps/web/src/areas/aluno/atividade.ts:67-69`), então nunca aparece ao lado do acerto. Isso está testado na unidade, no componente e no e2e (`e2e/aluno-atividade.spec.ts`, depois que a professora aprova). Não há discursiva nem redação neste fluxo, e nenhuma nota é proposta (D55).

Supervisão do tutor: ok. A tela não passa a observar foco, aba nem tempo, o "Pedir ajuda ao Tutor nesta questão" não mudou, e nada novo é medido (regra 70, item 7).

Autonomia declarada e visível: sim. A tarefa não muda nada nisso.

**A comemoração e a D59.** Conferi as condições do parecer dado na 5.0 (`docs/interface.md:627-634`) contra o código e os testes. Todas foram cumpridas:
- **Um salto só:** o CSS faz uma única iteração (`Comemoracao.css`).
- **Só depois do envio confirmado nesta tela:** o estado é ligado só no `onSuccess` do envio (`apps/web/src/areas/aluno/Atividade.tsx:121`), guardado só na tela (`:411-412`) e zerado pela `key` da rota (`rotas.tsx:49`).
- **Não volta ao recarregar nem ao reabrir pela lista:** provado no componente e no e2e. Também não fica nada em `localStorage` ou `sessionStorage`, e o aluno seguinte no mesmo computador não herda a comemoração.
- **Sem número, som ou "parabéns", e sem depender de acerto, resultado ou tempo:** o teste de falas e o de componente (`audio`, `video`, `progress`) provam isso. A falha no envio (`ATIVIDADE_ENCERRADA` ou rede) não comemora.
- **Para quando a pessoa pede menos movimento:** o e2e confere `animationName` igual a `none`.
- **Identidade de IA (regra 70, item 4a; D58):** a onça aparece assinada pela função "Tutor" e com o selo "IA". A fala é fixa, em terceira pessoa, não afirma ser pessoa, não promete voltar e não cria vínculo.

O "Voltar às tarefas" leva à lista, sem empurrar para a próxima tarefa, e a navegação com "Sair" continua à vista. Rodei `Atividade.test.tsx` e `atividade.test.ts`: 43 de 43 passam.

**O que as fotos não mostram.** A forma "Entregue agora" não aparece em nenhuma foto, então ela foi conferida pelo código e pelos testes. As fotos da escola vazia (`.processo/vitrine/vazia--aluno--aluno-atividades--computador.png` e `--celular.png`) não mostram nada de IA, nota ou indução de uso.

Bloqueantes: nenhum.

Recomendações:
1. A semente da vitrine cheia se contradiz. A foto `.processo/vitrine/aluno--aluno-atividades--Estequiometria--computador.png` mostra "Você respondeu 0 de 4 questões", "Você acertou 3 de 4 questões" e as quatro questões "Ficou em branco". É dado sintético e esta tarefa não o produz, mas na apresentação parece uma correção aprovada que contradiz as respostas, justamente na tela que mostra quem aprovou. Vale corrigir a semente da vitrine; o destino fica para o `TODO.md` ou para quem cuida de `tools/vitrine/`.
2. A fala "Quem dá a aula vê a correção antes de você." sai assinada pelo Tutor, mas quem corrige é o "Assistente · correção de objetiva". A frase é verdadeira e reforça a regra 70, item 3, então não bloqueia. Ainda assim, vale avaliar com o `frontend-reviewer` se a assinatura deve ficar com o Tutor, que é o agente do aluno, ou se o texto deve deixar claro que é uma fala do produto.
3. A expressão regular do teste de falas usa `\b`, que em JavaScript não reconhece palavras acentuadas. Hoje funciona, porque as palavras proibidas da lista não são afetadas. Se entrarem palavras novas com acento, convém trocar por `(?<![\p{L}])…(?![\p{L}])` com a flag `u`.

Arquivos lidos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Atividade.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/atividade.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/Comemoracao.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/aluno-atividade.spec.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/docs/interface.md`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 07:08:32 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

O que conferi:
- **Fluxo (6.1):** continua o mesmo de antes, e os nomes da spec também. "Voltar para Tarefas" e o texto do "não disponível" mudaram como pedido. A tela usa `largura="leitura"`, e o mapa ganhou as cores do mockup (azul-claro na respondida).
- **Comemoração (6.2):** `entregueAgora` é estado da tela, ligado só no `onSuccess`, e a `key` da rota em `areas/aluno/rotas.tsx:49` o zera ao trocar de tarefa. Nada vai para `localStorage`, URL ou cache.
- **Quem importa a `Comemoracao`:** continua só `Atividade.tsx` e a galeria (`avatar-so-nas-duas-pecas.test.ts:29`).
- **Fora dos arquivos previstos:** a mudança em `nome-dos-chunks.ts` está registrada na tabela de divergências e na §9 da `techspec.md`.
- **`roteiro-da-demonstracao.spec.ts` e `aluno-fluxo.spec.ts`:** não foram mexidos, como a tarefa pede.
- **Testes:** os casos da tabela "Testes que provam a regra" existem. O teste do aluno seguinte no mesmo computador navega dentro da página, sem recarregar, então prova o que diz.
- **Fotos:** a foto da escola cheia mostra só o resultado aprovado, sem comemoração, o que está certo. A tela vazia é a lista, que esta tarefa não mexe. A forma "Entregue agora" não está nas fotos; ela é coberta pelo teste de componente e pelo e2e.

Recomendações:
1. `apps/web/src/areas/aluno/atividade.ts:68`: `comemoracaoNaTela` tem uma terceira condição que a 6.2 não lista (`resultado.tipo !== 'pronto'`). A §7b da Tech Spec diz que a comemoração "depende só de o envio ter sido confirmado nesta tela". A condição segue o RF8 ("nunca em resultado"), por isso não bloqueia. Mesmo assim, uma linha na tabela de divergências da `6_task.md` e na §7b deixa a decisão escrita.
2. `6_task.md`, "Arquivos previstos": falta `areas/aluno/atividade.ts` e `atividade.test.ts`, onde ficam as falas e a regra da comemoração. A divergência registrada também cita a linha "Arquitetura" da §10, mas essa linha não diz nada do CSS; só a §9 foi alterada.
3. `apps/web/src/areas/aluno/Atividade.tsx:237`: a `BarraPresa` fica presa também no computador. O texto da tarefa e o mockup dizem "presa embaixo no celular". Cabe ao `frontend-reviewer` decidir se isso aceita.
4. `e2e/aluno-atividade.spec.ts:71`: a fala está copiada à mão (`FALA_DA_ENTREGA`). Se mudar o texto em `atividade.ts`, o e2e quebra sem dizer por quê. Se o e2e puder importar de `apps/web`, melhor usar a constante.
5. O vitrine da escola cheia mostra "Você respondeu 0 de 4" ao lado de "Você acertou 3 de 4". É um problema do dado de demonstração que já existia, não desta tarefa, mas a foto confunde quem vê a tela.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Atividade.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/atividade.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md

## test-engineer · 1ª rodada · REPROVADO · 2026-10-25 07:09:07 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md`

VEREDITO: REPROVADO

Há um bloqueante, e ele se resolve com uma linha no documento. Os três arquivos de unidade passam (`npx vitest run --project unidade` em `Atividade.test.tsx`, `atividade.test.ts` e `nome-dos-chunks.test.ts`: 69 de 69). Não rodei o e2e, porque ele precisa do ambiente do portão. Não alterei arquivo nenhum.

**Cenários exigidos:**
- **Caminho feliz:** a aluna confirma o envio e a comemoração aparece uma vez, com a onça comemorando, a função, o selo "IA", a fala e "Voltar às tarefas".
- **Casos de borda:**
  - A tarefa enviada em outra hora, reaberta pela lista ou depois do F5, não comemora.
  - A tarefa com resultado aprovado e a encerrada pela professora abrem sem comemoração.
  - A professora encerra com o diálogo aberto (`ATIVIDADE_ENCERRADA`): sem comemoração.
  - A rede cai no envio: sem comemoração, e ela vem quando o envio passa de novo.
  - A correção é aprovada enquanto a aluna ainda está na tela: a comemoração some.
  - A aluna seguinte no mesmo computador não herda nada.
  - A tela a 360 px, e com "reduzir movimento".
- **Permissão:** a tarefa de outra turma responde como a que não existe (404), aponta para Tarefas e não oferece "Tentar de novo".
- **Isolamento:** não se aplica. Esta tarefa é só de tela, não grava nada e não lê dado de escola novo.
- **Concorrência:** o clique duplo em confirmar só aciona `onSuccess` mais vezes, e o estado é o mesmo. O envio já é idempotente e não mudou.

**Cobertos:** todas as linhas da tabela de testes têm teste citável pelo nome.
- **aparece no envio:** `Atividade.test.tsx › aparece uma vez, logo depois do envio confirmado…` e o e2e `enviar pede confirmação…`, que agora confere `[data-comemoracao]`, a pose, o selo e o `animationName` `comemoracao-salto`.
- **não aparece ao reabrir:** o mesmo e2e recarrega a página e depois abre a tarefa pela região "Entregues". No componente, o caso é `não volta ao reabrir…`, que também confere que nada fica no `localStorage`.
- **resultado e encerrada:** `a tarefa que tem resultado abre sem comemoração`, `a tarefa que a professora encerrou abre sem comemoração` e, para a correção aprovada com a tela aberta, `o resultado aprovado que já está à vista na hora do envio…`.
- **envio que falha:** `a professora encerra com o diálogo aberto (ATIVIDADE_ENCERRADA)…` e `a queda de rede no envio…`.
- **nunca de nota nem de acerto:** `nunca de nota nem de acerto…` (componente) e `diz só o fato da entrega…` (unidade).
- **falas:** `não afirma ser pessoa…`, `não tem vínculo nem saudade`, `o botão leva de volta às tarefas…`.
- **movimento reduzido:** o e2e `com "reduzir movimento" a onça aparece parada…`.
- **quatro estados:** `carregando…`, `não disponível…`, `erro…`, `com dado…`.
- **recomeço da tela:** o e2e `o aluno seguinte no mesmo computador…`.
- **360 px:** o e2e `a 360 px…` mede "Próxima" e "Anterior" (44 px), a largura sem rolagem lateral e a barra presa depois de rolar.

Os oito blocos de mutação chegam à cláusula que dizem cobrir. Não há `.skip`, teste comentado, mock que esconda a regra nem chamada de IA. O que o teste simula é só API do navegador que o `jsdom` não tem (`ResizeObserver` e o `dialog` modal), e a rede usada é a `redeFalsa` da casa.

**Bloqueantes:**
1. `apps/web/nome-dos-chunks.ts:143`: o diff acrescenta uma cláusula nova, `.replace(/\.(?:tsx?|css)$/, '')`, em que o `css` passa a contar como peça. A seção "Mutações" não tem bloco para ela, e cláusula nova sem bloco é bloqueante por si. O teste existe e falharia sem a regra (`nome-dos-chunks.test.ts:184`), mas o portão não o prova. Correção: acrescentar este bloco à seção "Mutações" de `6_task.md`.
   ```mutacao
   arquivo: apps/web/nome-dos-chunks.ts
   teste: apps/web/nome-dos-chunks.test.ts › a comemoração e o estilo dela (X4, 6.0) estão fora da entrada, e o CSS de outro arquivo não é peça só por ser CSS
   -  const arquivo = id.slice(posicao + PASTA_DOS_COMPONENTES.length).replace(/\.(?:tsx?|css)$/, '')
   +  const arquivo = id.slice(posicao + PASTA_DOS_COMPONENTES.length).replace(/\.tsx?$/, '')
   ```

**Recomendações:**
1. **"Ligado só no `onSuccess`" não tem teste que o prove sozinho.** Se `aoEntregar()` fosse para `onSettled` ou `onError`, todos os testes continuariam verdes: nos dois casos de falha, a regra de `enviadaEm` preenchida esconde a comemoração. Um caso em `Atividade.test.tsx`, ao lado do `:409`, mataria essa mutação: o envio falha com 503, a prova relida passa a trazer `enviadaEm` (enviada em outra janela) e a tela não comemora. Daria também um bloco de mutação com `aoEntregar()` dentro de `onError`.
2. **`Atividade.test.tsx:409` simula a queda de rede com um 503.** Uma falha de verdade, com o `fetch` rejeitado, chegaria pelo mesmo caminho do cliente e cobriria o caso de forma mais fiel.
3. **`Atividade.test.tsx:472` (o mapa) já passaria antes desta tarefa.** As classes da questão salva e da questão em branco já eram diferentes. Ele não prova a troca de cor da 6.1 (`azul-*`). Não é regra, então não bloqueia.
4. **Clique duplo em confirmar:** falta um caso de componente com `dblClick` no "Enviar a atividade" do diálogo, que espere um `POST` só e uma comemoração só. Isso deixaria por escrito a garantia que o "uma vez" da tabela supõe.
5. **Tempo do e2e:** `e2e/aluno-atividade.spec.ts:446` entra com dois alunos na mesma tarefa. Vale conferir no portão que ele fica abaixo da metade do prazo (15 s).
6. **Asserções redundantes:** em `atividade.test.ts`, o `toBe` exato da `FALA_DA_ENTREGA` já torna as expressões regulares das falas redundantes. Elas valem como documentação do motivo, mas a peça só passa a ser protegida de verdade se a fala virar configurável.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-25 07:27:51 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md`, bloco de mutação de `nome-dos-chunks.ts`: a linha `teste:` cita só o fim do título. O título inteiro em `apps/web/nome-dos-chunks.test.ts:184` começa com "a comemoração e o estilo dela (X4, 6.0)". Se a ferramenta de mutação procura o título por trecho, funciona. Se exige o título exato, o bloco não acha o teste. Vale copiar o título inteiro.
- `Atividade.test.tsx`, teste do clique duplo: ele mostra que o botão fica "Enviando…" e desabilitado, e que sai um envio só. Ele não tem bloco próprio em "Mutações", porque nenhuma cláusula de código entrou nesta rodada. A cobertura é do `test-engineer`, então fica só registrado.

Sobre esta rodada:
- Desde a rodada anterior, só mudaram teste e documento: `Atividade.test.tsx`, `6_task.md`, `techspec.md` §7b e `TODO.md`. Nenhum arquivo de `apps/web` fora de teste mudou, então as fotos e a auditoria da 1ª rodada continuam valendo.
- As duas recomendações que a Mesa aplicou estão feitas:
  - A divergência `resultado.tipo !== 'pronto'` está na tabela de "Divergências" e na §7b da Tech Spec, com a mesma frase.
  - `atividade.ts`, `atividade.test.ts` e `nome-dos-chunks.*` estão em "Arquivos previstos", e a referência à §10 saiu.
- Os dois testes novos batem com o código:
  - O teste da tarefa já enviada em outra janela confere que `aoEntregar()` roda só no `onSuccess` (`Atividade.tsx:120-122`) e não no `onError` (`:127-129`).
  - A mutação declarada para `Atividade.tsx`, que põe `aoEntregar()` no `onError`, faz esse teste falhar.
  - A mutação de `nome-dos-chunks.ts` mexe na linha certa (`apps/web/nome-dos-chunks.ts:143`).
- As seis entradas novas do `TODO.md` têm dono e origem e batem com a tabela "Recomendações sem aplicar".

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 07:28:18 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md`

VEREDITO: APROVADO

Cenários exigidos: nesta 2ª rodada, o bloco de mutação da cláusula nova de `nome-dos-chunks.ts:143`, que é a única correção exigida. Mais as duas recomendações que a Mesa mandou aplicar: a comemoração liga só no `onSuccess`, com um bloco que põe `aoEntregar()` no `onError`, e o clique duplo no envio manda um envio só.

Cobertos:
- **`nome-dos-chunks.ts:143`, feito.** O bloco novo em `6_task.md` volta o `replace` para `/\.tsx?$/`. Com a mutação, `ui/Comemoracao.css` fica com a extensão, sai da lista de peças, e o `toBe(true)` de `nome-dos-chunks.test.ts:187` falha. O vermelho vem da cláusula certa. As linhas 189 e 190 (`Botao.css` e `areas/aluno/Comemoracao.css` dão `false`) seguram o outro lado: CSS não vira peça só por ser CSS. O nome no `teste:` é um trecho do nome do caso, e o `-t` do vitest acha o caso por trecho, então o bloco roda o caso certo.
- **`aoEntregar()` só no `onSuccess`, feito.** O teste novo (`Atividade.test.tsx`, "o envio que falha com a tarefa já enviada em outra janela não comemora...") responde 409 `ATIVIDADE_ENCERRADA`, e a prova relida já traz `enviadaEm`. Com a mutação (`aoEntregar()` antes do `return` do `onError`, `Atividade.tsx:129`), `entregueAgora` vira verdadeiro, a tela vai para "enviada" com o diagnóstico não achado, e a comemoração aparece. Aí `comemoracoes()).toHaveLength(0)` falha. O teste chega à cláusula, e as asserções são sobre o que o aluno vê: o título "Atividade enviada", um envio só e nenhuma comemoração.
- **Clique duplo, feito.** O servidor segura a resposta até o teste liberar, o `dblClick` cai com o primeiro envio ainda no ar, e o teste confere um pedido de envio só, o botão "Enviando…" desligado e uma comemoração só. É concorrência de verdade, e não duas chamadas em sequência.
- Rodei `npx vitest run` em `Atividade.test.tsx` e `nome-dos-chunks.test.ts`: 50 de 50 verdes. Nenhum `.skip` nos testes novos, nenhum mock de coisa nossa e nenhum provedor de IA.
- Nada de `apps/web/src` fora de teste mudou desde a 1ª rodada, e os blocos de antes continuam valendo.

Bloqueantes: nenhum.

Recomendações:
- O teste do clique duplo não tem bloco de mutação. A trava contra o segundo envio é o `confirmando={envio.isPending}` (`Atividade.tsx:273`), junto com o botão desligado da peça de confirmação da X1, e não é cláusula nova desta tarefa, então não bloqueia. Um bloco que tire o `confirmando` mostraria se o segundo clique do `dblClick` cai mesmo antes de o botão desligar, ou se o teste passaria de qualquer jeito.
- O teste do envio que falha usa o mesmo 409 do caso "a professora encerrou". Vale um comentário dizendo que é de propósito: o código de erro é o mesmo para os dois motivos.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.processo/ordens/diff-6_task-r1-r2.patch
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/nome-dos-chunks.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/nome-dos-chunks.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Atividade.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Atividade.test.tsx

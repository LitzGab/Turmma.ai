# Achados das revisões — `tasks/prd-telas-da-coordenacao/2_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-16 17:48:28 · `tasks/prd-telas-da-coordenacao/2_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: computador e celular, escola cheia e vazia). A "vazia" da vitrine já tem ano, séries, disciplinas, turma e professora. Por isso "A escola está montada" é o estado correto nela. Não vi nenhuma destas três coisas:
- o convite "Comece pelo ano letivo";
- a lista de passos "Falta";
- a fila com itens.

Esses três casos ficam cobertos só pelo e2e `e2e/painel-da-coordenacao.spec.ts` e pelo teste de componente, sem confirmação visual.
Estados: ok. Pelo código:
- Cada bloco tem carregando, erro com "Tentar de novo", vazio e com dado.
- O estado vazio convida a agir ("Comece pelo ano letivo", com botão; "Tudo em dia").
- Fila lida em parte nunca diz "Tudo em dia" (`Painel.tsx:170-205`).
- Um passo que não foi lido não vira "falta".

Acessibilidade:
- Cada bloco é um `section` rotulado, e as listas rolantes são `region` com `aria-label` e `tabIndex=0` (`Painel.tsx:63`).
- A linha inteira é um alvo só, com anel de foco por dentro.
- O e2e roda axe (`violacoesGraves`).
- Não medi o contraste, mas a paleta é a dos tokens e as fotos não mostram problema.

Chromebook fraco:
- A tela vem em um `lazy()` próprio.
- Há `SEM_LEITURA_SOZINHA` (5 min, sem releitura por foco ou rede) e nenhuma consulta nova.
- A carga na manhã de segunda está declarada e justificada na divergência da tarefa.
- A fila é curta e rola por dentro, então não precisa de virtualização.
- A 1366 × 768 a página não rola, tanto na foto cheia quanto na vazia.

Celular:
- A 360 px não há rolagem horizontal nem texto cortado.
- Os cartões empilham em uma coluna.
- Os links e botões têm 44 px (`min-h-11`) e as `Linha`s têm 64 px.
- Nada depende de hover.
- O e2e roda nos projetos `chromebook` e `celular`.

Ação oficial protegida: sim. A tela só lê e navega. Nenhuma ação oficial aparece nela, e os pedidos de titular e a lista de nomes não são lidos, o que evita leitura sem auditoria.
Bloqueantes: nenhum.
Recomendações:
1. `Painel.tsx:59` e `Painel.tsx:288`. A escola recém-criada tem até 6 passos em "Para terminar a escola". A 1366 × 768 a altura da lista cai para o mínimo de 9rem, então só uns 2 passos aparecem sem rolar. No celular o `clamp` também resulta em 144 px, e a lista rola por dentro da página. Vale um indício visível de que há mais itens (um "mais N abaixo" ou o degradê no rodapé), ou deixar a lista dos passos crescer no celular, onde a página já rola.
2. `Painel.tsx:208`. "Pedidos dos titulares" é jargão da LGPD. A tela de Privacidade usa o mesmo termo, então fica coerente, mas "Pedidos de pais e alunos" seria mais claro para a coordenação. Pode ir para o `/validar`.
3. `Painel.tsx:106`. O link diz "Ver em Registros", mas a lateral ainda chama o destino de "Governança". A 3.0 deve alinhar o nome, senão o link aponta para algo que a lateral chama de outro jeito.

Arquivos principais: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.tsx` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/painel-da-coordenacao.spec.ts`.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-16 17:48:34 · `tasks/prd-telas-da-coordenacao/2_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa só lê dados. O Painel, `o-que-falta-da-escola.ts` e o trecho que saiu da Estrutura não gravam nada, e nenhum fluxo de nota, correção ou aprovação foi alterado. Todos com autor humano? sim, porque não há caminho novo.

Decisão autônoma sobre aluno: ausente. O Painel não mostra nada nominal de aluno e não lê a lista de nomes nem os pedidos de nome. O teste em `Painel.test.tsx:310` e o e2e em `e2e/painel-da-coordenacao.spec.ts:77` provam que essas chamadas não acontecem.

Aprovação registrada: ok. Nenhuma saída de IA nova chega ao aluno. Os quatro números repetem os da Governança (`Painel.tsx:131-134`, iguais a `Governanca.tsx:65-68`). O cartão "Rejeitado" diz que o professor recusou com justificativa, e "Esperando o professor" diz que nada vale antes da decisão dele. "Ver em Registros" leva à auditoria de "o que a IA gerou e quem aprovou" (`Painel.tsx:106`).

Supervisão do tutor: ok, nada mudou. O Painel mostra só o pacote de trocas do Tutor somado para a escola (`Painel.tsx:153`). Não há conteúdo de conversa, número por aluno nem sinal emocional.

Autonomia declarada e visível: sim. Quando uma função está suspensa, o Painel mostra um aviso em português comum, com o link "Ver como cada IA trabalha" para Agentes (`Painel.tsx:82-92`). O teste está em `Painel.test.tsx:201,217`. O nível de autonomia de cada função continua na tela Agentes, que a tarefa não alterou.

Itens 7 e 9 (supervisão não é vigilância; medir o professor não é vigiar):
- **Fotos.** Nas quatro fotos (escola cheia e vazia, computador e celular) não aparece ranking, número ao lado de nome de professor, indicador de adoção, nota nem conceito. O consumo do mês aparece numa linha só, somado para a escola, sem divisão por função, professor ou aluno (`Painel.tsx:140-156`).
- **Itens com nome de professor.** "Esperando você" tem os cinco tipos do sino, presos em `fila-da-coordenacao.ts:20`. Os que levam nome ("contestou a turma", "Refazer o convite de …") são fatos de cadastro e vínculo, um item por fato e sem contagem. Não medem uso nem desempenho.
- **Testes de RF7.** Provam que não há número ao lado de nome de professor e que a fila tem só os cinco tipos (`Painel.test.tsx:266,296`).
- **Pedidos dos titulares.** Entram por uma linha fixa, sem número, porque contar os pedidos exigiria ler a lista, e cada leitura fica na auditoria (`Painel.tsx:208`).

Bloqueantes: nenhum.

Recomendações:
1. **Texto do cartão "Aprovado por gente".** A descrição do "Gerado por IA" conta atividades e planos, mas a do "Aprovado por gente" fala só de versões adaptadas e correções (`Painel.tsx:131-132`). Quem compara os dois cartões pode concluir que atividades e planos saem sem aprovação. O texto vem da Governança, então vale ajustar os dois juntos: ou dizer por que atividades e planos não contam ali, ou alinhar a contagem com a regra 70, item 3.
2. **Foto da escola vazia.** Ela mostra "A escola está montada" com os quatro números em zero. O mais provável é que a escola vazia da vitrine já tenha a estrutura montada e não tenha uso de IA, o que não fere a regra 70. Mesmo assim, vale o `frontend-reviewer` confirmar que essa é a intenção da escola vazia.
3. **Estrutura.** A troca do roteiro para o módulo novo é uma mudança só de organização: o que estava em `Estrutura.tsx` saiu sem perda e agora é importado de `apps/web/src/areas/coordenacao/o-que-falta-da-escola.ts`. Nada a corrigir.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/o-que-falta-da-escola.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/painel-da-coordenacao.spec.ts
- As quatro fotos em /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.processo/vitrine/

## infra-guardian · 1ª rodada · APROVADO · 2026-10-16 17:49:13 · `tasks/prd-telas-da-coordenacao/2_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só mexe na web, sem rota, tabela, fila nem chamada de modelo nova. Quem usa a tela é a coordenação, uma a três pessoas por escola.
Rate limit: ok. Não há rota nova. A tela fica abaixo do limite por usuário de 120 requisições por minuto (`.env.example:66`) mesmo no pior caso; a conta está na primeira recomendação.
Fila e prioridade: ok. Não se aplica, porque não há job novo.
Concorrência: protegida. Não há mutação nova. O clique duplo em "Tentar de novo" é coberto de dois jeitos: na fila o botão fica desligado enquanto a leitura corre (`Painel.tsx:174`), e no roteiro o `refetch({ cancelRefetch: false })` junta os cliques numa leitura só (`Painel.tsx:280`).
Índice e paginação: ok. O Painel não tem consulta nova. As listas são lidas em páginas de 100, com teto de 10 páginas (`api/estrutura.ts:44`), e do resumo só a primeira página.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. Não há código novo no servidor. A tela carrega à parte por `lazy()` e entra no teto de tamanho de tela do teste do build. A tela não relê sozinha: 5 minutos de frescor, nenhuma releitura por tempo, foco ou volta da rede, com teste e mutação de cada opção (`Painel.test.tsx:642-760`).
Bloqueantes: nenhum.
Recomendações:
- **Conta errada em `tasks/prd-telas-da-coordenacao/2_task.md:75`.** A divergência diz "cerca de 55 pedidos", mas o pior caso é perto de 74:
  - a fila lê 5 listas paginadas (anos, professores, materiais, turmas, vínculos), até 10 requisições cada, mais os incidentes, o que dá 51;
  - o Painel soma séries e disciplinas, até 10 cada, mais resumo, consumo e funções, o que dá 23.

  Os 74 continuam abaixo de 120, então a conclusão vale. O número precisa ser corrigido no documento, e também na §7c da Tech Spec, que diz "no máximo ~50" para o sino.
- **Margem que acaba com listas truncadas.** Cada clique em "Tentar de novo" com lista truncada soma até 10 requisições. No pior caso, uns 5 cliques no mesmo minuto levam a coordenadora ao 429. O efeito fica só nela, como manda a regra 80, mas vale anotar na §12 que a premissa não verificada continua de pé e que a saída "duas levas" ainda serve se aparecer 429 no staging.
- **Botão do roteiro sem estado de carregando.** O "Tentar de novo" do roteiro (`Painel.tsx:280`) não fica desligado nem mostra "Tentando de novo…" enquanto lê, ao contrário do da fila (`Painel.tsx:174`). Não gera requisição a mais, mas os dois botões da mesma tela se comportam diferente.

Arquivos auditados: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.test.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/2_task.md`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/techspec.md`.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-16 17:49:34 · `tasks/prd-telas-da-coordenacao/2_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em §12, a 3ª premissa não verificada, sobre a leitura dos blocos do Painel em duas levas
Portão local: carimbo válido

Bloqueantes:

1. **A leitura do Painel saiu da Tech Spec, e a mudança só está registrada no `2_task.md`.**
   - Onde: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/2_task.md:75`, com efeito em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.tsx:71-231`.
   - O que a spec diz: `techspec.md:150` traz "Saída: o Painel lê os blocos em duas levas".
   - O que foi feito: o Painel lê todos os blocos de uma vez.
   - O que a tarefa alega: a linha de divergência aponta para "§12, 3ª premissa não verificada (a saída só vale se o limite for tocado)". Esse parêntese não existe na Tech Spec, que não foi alterada nesta linha nem na `spec/telas-da-coordenacao`. A premissa também segue "NÃO VERIFICADO": a conta de ~55 pedidos contra 120 é estimativa no `N_task.md`, não verificação registrada na spec.
   - Por que bloqueia: divergência que só existe no `N_task.md` é bloqueante, mesmo que o caminho escolhido seja razoável.
   - Correção exigida, uma das duas:
     - (a) o Painel passa a ler os blocos em duas levas, como a spec manda;
     - (b) o Arquiteto atualiza `techspec.md` §12, e se preciso §7c. A premissa passa a constar como verificada pela conta (sino e Painel somados, por requisição, contra `LIMITE_REQ_USUARIO_MIN`), e a saída das duas levas fica condicionada a esse limite ser tocado. A linha 75 do `2_task.md` passa a citar o texto que de fato está na spec.

Recomendações:
- `Painel.tsx:91`: com duas ou mais funções suspensas o texto continua "Ela recusa pedido novo até ser retomada.", no singular. O título já trata o plural, e a frase deveria acompanhar.
- `Painel.tsx:129-136`: o fragmento `<>…</>` embrulha um único `div` e pode sair.
- `fila-da-coordenacao.ts:182-184`: o `export { SEM_LEITURA_SOZINHA }` está separado da declaração. Basta `export const` na linha 182, que é como o resto do projeto exporta.
- `Painel.tsx:118-127`: o resumo é consulta infinita. Se a Governança carregou várias páginas na mesma chave, reabrir o Painel com o dado velho relê todas elas, e o Painel só usa os números. Vale conferir esse custo na conta da carga (§7c), ou limitar com `maxPages`.
- `Painel.tsx:280`: o "Tentar de novo" de "Para terminar a escola" não fica desligado enquanto a leitura corre, ao contrário do da fila (`tentandoDeNovo`). O `cancelRefetch: false` já evita leitura duplicada; seria só consistência visual.
- `Painel.test.tsx:534`: há uma espera real de 100 ms (`setTimeout`). Prefira esperar por uma condição ou usar o relógio falso que o arquivo já tem.
- Nas fotos, `.processo/vitrine/vazia--coordenacao--coordenacao-painel--*.png` mostram "A escola está montada": a escola vazia da vitrine já tem ano e estrutura. Por isso nenhuma foto mostra "Comece pelo ano letivo" nem a lista de passos que faltam. Fora isso, as fotos batem com o RF6 e o RF7: quatro números da escola, consumo numa linha, a porta dos pedidos sem número e nenhum número por professor. Não há nada que invada a 3.0.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-16 17:50:53 · `tasks/prd-telas-da-coordenacao/2_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz:** os quatro números da escola, o consumo do mês, a fila, a porta "Pedidos dos titulares" sem número, e "Para terminar a escola" com só os passos que faltam e o link de cada um.
- **Bordas reais:**
  - escola sem ano letivo, ou só com ano `planejado` ou `encerrado` (virada de ano)
  - turma sem professor alocado
  - turma só com vínculo contestado
  - dois professores com pendências diferentes
  - leitura que falha em parte, ou lista truncada
  - leitura que ainda não chegou e nunca vira "falta"
  - função de IA suspensa, uma e duas
- **Permissão:** o professor em `/coordenacao/painel` vê "Página não encontrada".
- **Isolamento:** a pessoa seguinte na mesma aba, e a troca de escola sem nada de A em B, nem enquanto B carrega.
- **Carga:** nada relê por tempo, por foco ou por rede; só relê ao abrir depois de 5 min; clique duplo em "Tentar de novo"; nenhuma leitura auditada (lista de nomes, reivindicações, pedidos de titular).

**Cobertos:** quase tudo, e bem. `Painel.test.tsx` cobre:
- os quatro estados de cada bloco
- a fila parcial que nunca diz "Tudo em dia", relendo por chave exata com as leituras auditadas abertas
- o frescor de 5 min com relógio falso, foco e rede pelos gerenciadores, e um teste de controle que mostra que o teste enxerga a releitura
- o material processando
- nenhum número por professor
- os anos planejado, encerrado e ausente
- o clique duplo de verdade (`dblClick` com a leitura segura) no "Tentar de novo" da fila
- o `resetQueries` da troca

Os casos de `o-que-falta-da-escola.test.ts` cobrem feito, falta, "ainda não sei" e a lista de nomes sempre sem marca. O e2e cobre:
- os números da Governança
- a escola vazia
- 1366 × 768 sem rolagem e 360 px
- a lista longa que rola por dentro
- os links dos passos
- a pessoa seguinte
- a guarda de papel em `areas.spec.ts`

Não há `.skip`, nem teste comentado, nem mock de coisa nossa: a rede falsa responde por caminho e a fila é a de verdade. Rodei os três arquivos de unidade e componente: 44 de 44 verdes.

**Bloqueantes:**

1. **Cláusulas novas sem bloco de mutação** em `apps/web/src/areas/coordenacao/Painel.tsx`. Cada uma precisa de bloco na seção "Mutações":
   - **`:225`, `anos.data?.itens.find((ano) => ano.situacao === 'em_curso')`.** É o predicado que decide o ano em curso, e nenhum bloco o altera. O bloco `anoEmCurso: true` altera o uso, não o predicado. Bloco exigido: `ano.situacao === 'em_curso'` → `ano.situacao !== 'encerrado'`, contra `› só ano planejado`.
   - **`:280`, `falhas.forEach((consulta) => void consulta.refetch(...))`.** É a regra "relê só o que falhou" do roteiro. Os blocos atuais tiram itens de `falhas` e ficam vermelhos porque o aviso some, não por causa da releitura. Bloco exigido: trocar `falhas.forEach` por `[series, disciplinas, professores, turmas, vinculos].forEach`, contra `› cada uma das cinco leituras`.
   - **`:74`, `:121`, `:145`, `:240` e `:280`, `cancelRefetch: false`.** É o que faz o clique duplo virar uma leitura só. Não tem bloco nem teste. O único clique duplo provado é o da fila, que usa outro caminho (`refetchQueries` em `fila-da-coordenacao.ts`). Exigido: um teste de clique duplo (`usuario.dblClick`, com a leitura que falhou segurada por uma promessa) no "Tentar de novo" do roteiro (`:280`, que nem fica desligado enquanto relê) e no do `EstadoErro` de um dos blocos. Cada teste afirma uma única chamada ao caminho, com um bloco `cancelRefetch: false` → `cancelRefetch: true` para cada um.

2. **O e2e da troca de escola não prova "nem enquanto B carrega"**, em `e2e/painel-da-coordenacao.spec.ts:214-241`:
   - O `MutationObserver` registra o nome do professor de A desde antes da troca. Ainda na tela de A, qualquer mudança no DOM, como abrir o seletor, já empurra entradas.
   - O `ultimo` só é lido em `:237`, depois que o Painel de B já mostrou "0" e "Tudo em dia". Então a comparação `depois === ultimo` cobre uma janela quase vazia (um `pushState` para o mesmo endereço).
   - Se o `main.tsx` passasse de `resetQueries` para `invalidateQueries`, o Painel de B mostraria A durante a releitura. O teste continuaria verde: o flash cai antes do `ultimo`, e o estado final está certo.
   - O comentário de `:214` diz que o número 7 de A também é vigiado, e não é.

   Correção exigida: ler a contagem logo depois de `await expect(page.locator('body')).toContainText(emB.escolaNome)` (`:230`), antes do `abrirPainel` de B. No fim, afirmar que ela não mudou. E vigiar também o número de A (pelo valor do cartão "Gerado por IA", não por `"7"` solto no corpo), ou tirar do comentário a promessa sobre ele.

**Recomendações:**
- **O resumo é consulta infinita.** Se a Governança paginou N páginas, a releitura do Painel depois de 5 min relê as N com a mesma chave. A tarefa pede "só a primeira página" e nenhum teste prova isso: semear o cache com 3 páginas, deixar envelhecer, abrir o Painel e esperar uma chamada só a `/resumo`. Isso é com o `infra-guardian`.
- **O título no singular ("Uma função de IA está suspensa nesta escola") não é afirmado** em `› a função de IA suspensa vira um aviso`. Um título fixo no plural passaria por esse caso.
- **O `usuario.hover` de `Painel.test.tsx:317` é decorativo.** O comentário diz "percorre o que dá para acionar" e só passa o mouse sobre um link. Ou clicar de fato, ou tirar.
- **Falta bloco para `useTituloDaTela('Painel')`.** O e2e afirma o título, mas a cláusula não tem bloco.
- **Texto, para o `frontend-reviewer`:** com duas funções suspensas, a frase continua "Ela recusa pedido novo até ser retomada."

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/o-que-falta-da-escola.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/o-que-falta-da-escola.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/painel-da-coordenacao.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/2_task.md`

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-16 19:22:00 · `tasks/prd-telas-da-coordenacao/2_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: `/coordenacao/painel` no computador e no celular, escola cheia e escola vazia)
Estados:
- ok. Carregando e erro foram conferidos só pelo código e pelos testes, porque a vitrine não os mostra.
- Cada bloco do Painel tem os quatro estados: os quatro números, o consumo, a fila, "Para terminar a escola" e a suspensão de função.
- O erro de cada bloco leva "Tentar de novo" (`Painel.tsx`).
- "Tudo em dia" e "A escola está montada" são vazios que dizem o que fazer, sem pedir desculpa. Sem ano letivo, o convite é "Comece pelo ano letivo", com o botão "Criar o ano letivo".

Acessibilidade:
- A lista que rola por dentro tem `role="region"`, `aria-label` e `tabIndex=0`, então o teclado chega nela (`Painel.tsx:56`).
- Cada bloco é uma `section` com `aria-labelledby`.
- O título da tela é definido por `useTituloDaTela`.
- Os textos estão em português, sem id, sem chave de tradução e sem termo técnico.
- O cartão "Gerado por IA" tem rótulo e valor legíveis. A cor não carrega sentido sozinha, porque "Urgente" e "Falta" são selos com texto.

Chromebook fraco:
- Não há lista virtualizada. As listas do Painel são curtas e rolam dentro do próprio contêiner (`LISTA_QUE_ROLA`).
- A carga na manhã de segunda foi verificada pela conta: até 74 pedidos contra 120 por minuto (`techspec.md` §7c e §12).
- O resumo agora lê só a primeira página, na mesma chave da consulta infinita (`governanca.ts`, `consultaPrimeiraPaginaDoResumo`). O teste "o resumo que a Governança paginou" cobre isso.
- Nenhuma leitura é feita por tempo, foco ou rede (`SEM_LEITURA_SOZINHA`).

Celular:
- Na foto de 360 px não há rolagem horizontal nem texto cortado.
- Os cartões empilham em uma coluna e os blocos descem em ordem.
- Alvos de toque na foto: "Ver em Registros" com cerca de 38 px, sino e "Sair" com cerca de 40 px, linhas da lista com mais de 44 px. Estão acima de 24 px.
- Nada depende de hover. O teste do clique agora usa `click` em vez de `hover`.
- Em tela de 1366 px a página não rola.
- Nenhum fluxo exige o celular.
- Os e2e do Painel cobrem os dois projetos, segundo o diff.

Ação oficial protegida: sim. O Painel não tem ação oficial, só navegação e leitura. Os pedidos dos titulares entram por uma porta sem contagem, e os nomes das turmas não são lidos, porque cada leitura fica na auditoria.

Correções exigidas da rodada anterior: nenhuma. No diff desta rodada, o que mudou conferido:
- O resumo lê uma página só, com teste e mutações.
- A frase de suspensão concorda em número ("Ela recusa" e "Elas recusam", `Painel.tsx:83`).
- O clique duplo em "Tentar de novo" lê uma vez só, com teste para os quatro blocos e para o aviso do roteiro, e a justificativa do `cancelRefetch: false` está no comentário.
- O e2e da troca de escola agora detecta o "7" de A dentro do cartão "Gerado por IA" de B.
- A `Tech Spec` §7c e §12 foi atualizada pela conta.

Bloqueantes: nenhum

Recomendações:
- `Painel.tsx:280`: o "Tentar de novo" do aviso do roteiro não fica desligado enquanto lê, ao contrário do da fila. Já está no destino da rodada anterior: reabrir depois do item 4.
- `Painel.tsx:59` e `:288`: a lista que rola por dentro não tem indício de que há mais itens abaixo (por exemplo "mais N" ou um degradê). Está em `TODO.md`.
- "Ver em Registros" aponta para o que a lateral ainda chama de "Governança"; a tarefa 3.0 resolve.
- Na foto de 360 px o nome da escola aparece cortado ("Colégio s…") na barra de cima. Vem da casca (shell) e não desta tarefa. O nome completo está na gaveta. Vale conferir no `/validar` se a coordenadora que tem uma escola só se reconhece por esse texto.
- A coluna da esquerda, no computador, corta o item "Privacidade" no fim da rolagem da lateral. Também vem da casca e não desta tarefa; é só para o `/validar`.
- "Pedidos dos titulares" é o termo da tela de Privacidade, então fica. Segue para o `/validar` como estava.

Fotos usadas:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.processo/vitrine/coordenacao--coordenacao-painel--computador.png`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.processo/vitrine/coordenacao--coordenacao-painel--celular.png`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.processo/vitrine/vazia--coordenacao--coordenacao-painel--computador.png`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.processo/vitrine/vazia--coordenacao--coordenacao-painel--celular.png`

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-16 19:22:06 · `tasks/prd-telas-da-coordenacao/2_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta rodada. O diff só mexe na tela e no cache do Painel: nenhuma rota, mutação, job, seed ou importação. Todos com autor humano? sim, porque nenhum caminho novo foi aberto.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Os quatro números continuam separando "Gerado por IA", "Aprovado por gente", "Esperando o professor" e "Rejeitado (com justificativa)". As fotos mostram isso na escola cheia (7, 3, 1, 0) e na vazia (zeros), no computador e no celular.
Supervisão do tutor: ok. A tela não toca o tutor. Ela só mostra o consumo agregado da escola ("Trocas dos alunos com o Tutor: 0 de 600"), sem dado de aluno nem de professor.
Autonomia declarada e visível: sim. O aviso de função suspensa continua levando a "Ver como cada IA trabalha" (`/agentes`). Agora ele concorda com o número de funções suspensas (`apps/web/src/areas/coordenacao/Painel.tsx:81`), e o teste confere o texto para uma e para duas funções.

O que esta rodada mudou, do ponto de vista da regra 70:
- `apps/web/src/api/governanca.ts:52` (`consultaPrimeiraPaginaDoResumo`): o Painel passa a ler só a primeira página do resumo, na mesma chave da Governança. A auditoria continua respondendo "o que a IA gerou, quem aprovou e quando": a Governança segue paginando pela mesma rota. No pior caso ela volta a abrir só na primeira página, e "Ver mais" continua de pé. Os números são os mesmos de antes, e o teste prova que vêm da leitura atual (`Painel.test.tsx`, "o resumo que a Governança paginou").
- O e2e da troca de escola passou a registrar também o "7" de A no cartão "Gerado por IA". O teste agora cairia se a escola B mostrasse por um instante o número da escola A. Isso reforça a regra 10 e não toca a 70.
- O resto é carga e clique duplo (regra 80): nenhum ponto da regra 70 muda.

Fotos (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.processo/vitrine/coordenacao--coordenacao-painel--computador.png`, `...--celular.png`, `vazia--...--computador.png`, `vazia--...--celular.png`):
- Não há nota, conceito nem sugestão de nota (D55).
- Não há indicador nominal de professor, ranking nem adoção por professor (D45, D64).
- Não há janela sobre o comportamento do aluno.
- Não há nada que induza uso: nem sequência de dias, nem recompensa. "Sair" fica visível na lateral e no celular.

Bloqueantes: nenhum

Recomendações:
- `apps/web/src/areas/coordenacao/Painel.tsx:81`: no plural, "Elas recusam pedido novo até ser retomada" deveria ser "até serem retomadas". É só texto, e é com o `frontend-reviewer`.
- `apps/web/src/api/governanca.ts:52`: como o Painel e a Governança dividem a chave, a Governança aberta depois do Painel recomeça na primeira página da trilha. Vale um teste da própria Governança provando que "Ver mais" continua chegando ao item mais antigo depois disso, para que a consulta de auditoria (regra 70, item 6) não dependa da ordem em que as telas foram abertas. Pode ficar para a tarefa que mexer na Governança.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-16 19:22:19 · `tasks/prd-telas-da-coordenacao/2_task.md`

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

Esta rodada não muda nenhuma rota, tabela, fila nem chamada de modelo. Conferi três pontos.

- **Carga ao abrir o Painel.** Antes, `useInfiniteQuery` relia todas as páginas que a Governança tivesse paginado. Agora `consultaPrimeiraPaginaDoResumo`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/api/governanca.ts:28`, faz uma requisição só. O teste "o resumo que a Governança paginou" prova isso, e há três mutações sobre ele. A conta da §7c bate: o sino faz até 51 pedidos e o Painel até 23, 74 no total contra 120 por minuto por usuário. A premissa da §12 virou "verificada pela conta".
- **Clique duplo em "Tentar de novo".** Os quatro blocos de erro perderam o `cancelRefetch: false`, e isso está certo. Na versão instalada (`query-core` 5.102.8, `query.js:158`), a consulta sem dado reaproveita a leitura em andamento em vez de abrir outra. O aviso do roteiro pode ter dado antigo no cache e por isso mantém `cancelRefetch: false` (`Painel.tsx:281`). Há teste de clique duplo para os cinco casos, e o do roteiro tem uma mutação para `cancelRefetch: true`.
- **Âncoras das mutações novas.** Todas existem na árvore: `Painel.tsx:37`, `:81`, `:224`, `:281` e `main.tsx:32`.

Recomendações:
- O Painel (`useQuery`) e a Governança (`useInfiniteQuery`) agora usam a mesma chave, `[...CHAVE_DA_GOVERNANCA, 'resumo']`. Hoje não dá problema, porque as duas telas nunca ficam montadas ao mesmo tempo. Mas quem reler a chave sem observador (por exemplo, `invalidateQueries` com `refetchType: 'all'` depois de uma aprovação) vai usar as opções do último observador a gravar. Se for o do Painel, a releitura volta a uma página só, sem o comportamento de lista infinita. Vale um comentário em `governanca.ts:28` dizendo que as duas telas não podem conviver montadas, ou um teste que monte a Governança depois do Painel e confira que o "Ver mais" continua funcionando.
- Fica de pé o item já levado ao `TODO.md`: o "Tentar de novo" do roteiro (`Painel.tsx:281`) não fica desligado enquanto lê. Hoje é o `cancelRefetch: false` que segura o segundo clique. Se um dia o botão for desligado, o teste de clique duplo do roteiro tem de ser revisto junto.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-16 19:23:18 · `tasks/prd-telas-da-coordenacao/2_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A correção 1 foi feita pela opção (b). O commit `8e45a1d` mudou a `techspec.md`:
- Na §7c, a carga da manhã de segunda agora traz a conta: até 51 pedidos do sino e até 23 do Painel, 74 no total contra o limite de 120.
- Na §12, a premissa virou "Verificado pela conta (tarefa 2.0)". Ali a spec diz que ler em duas levas não é saída e que, se aparecer 429, a saída é ler séries e disciplinas com uma página só.

A linha 76 do `2_task.md` agora cita esse texto, que existe na spec. O código bate com a conta. O Painel lê séries, disciplinas, resumo, consumo e funções, e o resto vem das chaves que a fila já leu. O resumo é lido por `consultaPrimeiraPaginaDoResumo`, que faz uma requisição só, na mesma chave da consulta infinita, como a subtarefa pede ("use a mesma chave e só a primeira página"). Não existe `cenarios.md` nesta spec, então não há o que conferir nele.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

Recomendações:
- `apps/web/src/areas/coordenacao/Painel.tsx:81`: no plural, a frase "Elas recusam pedido novo até ser retomada." deveria ser "até serem retomadas". O teste em `Painel.test.tsx:229` trava o texto errado. O `conformidade-reviewer` já tinha visto isso e mandou para o `frontend-reviewer`. São duas linhas para corrigir.
- `apps/web/src/api/governanca.ts:52`: o resumo é lido de dois jeitos na mesma chave, uma consulta simples no Painel e uma infinita na Governança (`Governanca.tsx:39`). O TanStack não dá suporte oficial a isso. Hoje funciona porque as duas telas nunca estão abertas juntas, e o teste novo prova que a chave fica no formato que a Governança lê. Se um dia as duas estiverem na tela ao mesmo tempo, vale uma linha de aviso no JSDoc ou uma chave própria.
- `Painel.tsx:74`, `:122`, `:144` e `:239`: estes botões "Tentar de novo" deixaram de usar `cancelRefetch: false`, e o resto do `apps/web` usa em todo lugar. O comportamento é o mesmo quando não há dado no cache, e o teste de clique duplo prova isso. Mesmo assim, é um segundo jeito de fazer a mesma coisa no projeto.
- `Painel.tsx:271-272`: o comentário sobre `cancelRefetch: false` está solto entre a declaração de `falhas` e o `return`, longe da linha 281 que ele explica. Fica melhor junto do botão.

Os arquivos que conferi estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/`: `apps/web/src/api/governanca.ts`, `apps/web/src/areas/coordenacao/Painel.tsx`, `apps/web/src/areas/coordenacao/Painel.test.tsx`, `tasks/prd-telas-da-coordenacao/2_task.md` e `tasks/prd-telas-da-coordenacao/techspec.md`. As fotos do computador e do celular, na escola cheia e na vazia, mostram o que o RF pede, com os nomes do glossário, e nada fora da tarefa.

## test-engineer · 2ª rodada · APROVADO · 2026-10-16 19:24:56 · `tasks/prd-telas-da-coordenacao/2_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os três pontos de correção da 1ª rodada (blocos de mutação para o predicado do ano em curso, para o "relê só o que falhou" e para o `cancelRefetch`, com teste de clique duplo); o e2e da troca de escola provando que o Painel de B não mostra nada de A enquanto carrega; e as duas mudanças novas desta rodada, a frase no singular e no plural do aviso de função suspensa e o resumo que lê só a primeira página na mesma chave da Governança.

**Cobertos:**
- **1(a), ano em curso.** Há bloco novo, `ano.situacao === 'em_curso'` → `!== 'encerrado'`, contra `› só ano planejado`. Ele fica vermelho pelo motivo certo: com o ano planejado tomado como em curso, turmas e vínculos passam a ser chamados, e o teste afirma em `Painel.test.tsx:354` que não são.
- **1(b), releitura do roteiro.** Há bloco novo, `falhas.forEach` → as cinco consultas, contra `› cada uma das cinco leituras`. O vermelho vem de `Painel.test.tsx:621`, que exige a releitura só do caminho que falhou. O aviso continua sumindo com a mutação, então o vermelho vem da releitura e não do aviso.
- **1(c), clique duplo.** O `cancelRefetch: false` ficou só em `Painel.tsx:281`, onde a consulta pode ter dado e erro ao mesmo tempo. Tem teste próprio (`Painel.test.tsx:147-180`): dado no cache, releitura falhada ao reabrir, a releitura seguinte segurada por uma promessa e `dblClick`, com uma chamada só a `/v1/series`. O bloco `false` → `true` deu vermelho no portão (mutação 83).
  - A nota da Mesa foi conferida no código do TanStack, não aceita pela palavra: em `node_modules/@tanstack/query-core/src/query.ts:408` a leitura em curso só é cancelada quando `this.state.data !== undefined && cancelRefetch`. Nos quatro `EstadoErro`, que só aparecem com `data === undefined` (`Painel.tsx:72`, `:119`, `:142`, `:234`), a opção não muda nada. Por isso não há ali cláusula a mutar, e a exigência de bloco para eles cai com razão.
  - Os quatro testes de clique duplo desses blocos ficam como teste de regressão do comportamento.
- **2, e2e da troca de escola.** A contagem agora é lida em `painel-da-coordenacao.spec.ts:237`, depois de o nome de B aparecer e antes de o Painel de B abrir, e a afirmação final (`:246`) cobre a abertura inteira.
  - O número de A é vigiado pelo cartão, com o rótulo "Gerado por IA" e o `.t-numero` ao lado (`:221-223`), e não por um "7" solto. Conferi que `NumeroPainel.tsx:23-24` tem exatamente essa estrutura.
  - Há bloco `resetQueries` → `invalidateQueries` em `main.tsx`, vermelho no portão (mutação 89). Pela ordem das afirmações, a única que pode cair com essa mutação é a de `:246`.
- **Frase da função suspensa.** Há bloco `=== 1` → `> 0` contra `› duas funções suspensas`, que afirma "Elas recusam" e a ausência de "Ela recusa". O caso de uma função só afirma "Ela recusa".
- **Primeira página do resumo.** O teste `› o resumo que a Governança paginou` monta o cache como a Governança o deixa depois de três "Ver mais" e afirma uma única leitura, os números de agora e a chave guardando uma página só. Os três blocos (chave própria, duas leituras, `pageParams: []`) deram vermelho.
- **Outras correções desta rodada.** O teste que só fazia `hover` agora clica de fato e confere a navegação (`:323-325`). A espera de 100 ms reais virou relógio falso.
- O `Painel.test.tsx` passou inteiro aqui: 36 de 36.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **A Governança lendo o que o Painel gravou.** `consultaPrimeiraPaginaDoResumo` (`apps/web/src/api/governanca.ts:28-31`) divide a chave com a consulta paginada da Governança, mas nenhum teste monta a Governança depois do Painel e aciona "Ver mais". O bloco `pageParams: []` só fica vermelho pela afirmação de formato (`Painel.test.tsx:213-214`), não pelo uso. Vale um teste de componente: o Painel grava a chave, a Governança abre, mostra os itens e o "Ver mais" pede a segunda página.
2. **Ano letivo com dado velho e releitura falhada.** Nesse caso `anos` não entra em `falhas` (`Painel.tsx:270`), e o roteiro segue sem aviso, em cima do dado velho. Avaliar incluir `anos` quando houver dado e erro ao mesmo tempo.
3. **O e2e cobre só o Painel de B.** Um vazamento de A na Governança de B, que aparece antes de a contagem ser lida em `painel-da-coordenacao.spec.ts:237`, não entra na conta. Está dentro do nome do teste, mas a Governança pode ganhar a mesma vigia.
4. **O log do portão não diz qual afirmação ficou vermelha.** Em `.processo/portao-2-0.log:1133`, a mutação do `main.tsx` aparece só como "vermelho". O `tools/processo/mutacoes.ts` poderia gravar a primeira afirmação que falhou, para a auditoria conferir o motivo sem rodar o e2e.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/api/governanca.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/painel-da-coordenacao.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/2_task.md

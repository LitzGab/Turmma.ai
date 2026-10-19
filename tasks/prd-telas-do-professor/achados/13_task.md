# Achados das revisões — `tasks/prd-telas-do-professor/13_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 15:06:58 · `tasks/prd-telas-do-professor/13_task.md`

VEREDITO: APROVADO

Tela vista: sim (10 fotos lidas, passos Gerar, Acesso gerado e Vigente, no computador e no celular, escola cheia e vazia). Duas ressalvas:
- A turma da escola vazia já tinha acesso vigente, então a foto dela mostra o passo Vigente e não o Gerar. O Gerar vem da escola cheia, e o resumo "Sem acesso ativo" eu li só no código.
- Não vi o passo Revogar nem a pergunta de fechar sem copiar. Li os dois no código, `ConvidarAlunos.tsx:166-181` e `:149-157`.

Estados: ok. Todos pelo código, já que carregando e erro não saem na vitrine.
- No diálogo: carregando, erro com "Tentar de novo" ou turma indisponível, Gerar, gerando, Acesso gerado, Vigente, Revogar e a pergunta de fechar.
- No resumo da aba: carregando, erro, vazio "Sem acesso ativo" e acesso ativo (`AcessoDaTurma.tsx:98-120`). O vazio diz o próximo passo: "Gere o link da sala e o código da turma…".

Acessibilidade:
- O foco é do passo (`useFocoDaEtapa` com `daPrimeira`) e o foco visível aparece nas fotos.
- Os rádios e os botões têm rótulo. O código grande fica `aria-hidden` e o leitor de tela recebe o código soletrado.
- O diálogo é `<dialog>` modal e devolve o foco ao botão "Convidar alunos" ou, se ele sumiu, ao título da seção.
- O contraste segue os tokens. O fundo da tela inteira usa a classe `bg-fundo`, que serve no claro e no escuro.
- Não rodei os testes: confiei nas mutações e nos e2e que a tarefa declara.

Chromebook fraco: sem lista nova nem imagem, e o diálogo é leve, sem animação na troca de caixa. O e2e novo foi escrito pensando em CPU ×4 e Fast 3G.

Celular:
- Em 360 px não há rolagem horizontal nem conteúdo cortado nas fotos. O campo do link é um `input` com rolagem própria e o endereço quebra (`wrap-anywhere`).
- Os botões têm `min-h-11`, 44 px; a ação principal tem o mesmo tamanho.
- Os rádios têm 24 px e a linha 44 px.
- Nada depende de hover.
- O passo "Acesso gerado" é tela inteira nos dois tamanhos.

Ação oficial protegida: sim. Gerar acesso é oficial e mostra validade, texto do que acontece e que o link aparece uma vez, antes do botão. "Gerar novo acesso" diz o que cai (`TEXTO_DO_ACESSO_QUE_CAI`). "Revogar o acesso" tem passo próprio com pergunta e perigo. Fechar com o link ainda não copiado pergunta antes. O envio é único (`useEnvioUnico`). O endereço leva só `convidar=1`, nunca token, link nem código. Nada disso toca nota.

Bloqueantes: nenhum.

Recomendações:
- No passo "Acesso gerado" o título "Gerar acesso" fica acima do subtítulo "Acesso gerado", o que repete a ideia (`ConvidarAlunos.tsx:134`, `:274`). A spec fixa os títulos, então só vale revisitar quando o mockup 6 for refeito.
- Em 1366 × 768, na tela inteira, o bloco fica colado no topo e deixa um vazio grande embaixo (`gerado-…--computador.png`). Centralizar verticalmente ficaria melhor para projetar, mas é gosto e não bloqueia.
- O texto de quem vê a lista (`TEXTO_DE_QUEM_VE_A_LISTA`) é longo no celular. Dá para encurtar numa próxima passada.
- A divergência de 520 px contra os 560 px do mockup está registrada e justificada. Não bloqueia.

Fotos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/.processo/vitrine/`. Código principal: `apps/web/src/areas/professor/ConvidarAlunos.tsx`.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-19 15:07:19 · `tasks/prd-telas-do-professor/13_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A tarefa é só de frontend, sem migration, sem rota nova e sem DTO novo. Ela mexe com dois tipos de dado:
- **Token e código do acesso da turma (credencial do convite).** Continuam só na mutação do diálogo, que sai do cache ao fechar (`gcTime: 0` em `apps/web/src/api/acesso.ts:49`, mais o `reset` do `useFechamento`). Cada abertura é uma instância nova: a `key` vem de `aberta.numero`, em `AcessoDaTurma.tsx`.
- **Nome da turma no aviso "Turma X confirmada"** (`Turmas.tsx`). Não é dado de pessoa.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. A autorização continua no servidor. O `?convidar=1` numa turma de vínculo pendente ou inexistente responde como "turma indisponível" e não abre o diálogo. Isso está provado em `e2e/convidar-alunos.spec.ts`, no caso "a turma … não abre o diálogo".

Logs: limpos.
- Não há `console.*` nem `localStorage`/`sessionStorage` nos arquivos de código alterados.
- O endereço leva só `convidar=1`, um valor fixo que `convitePedido` aceita apenas como `'1'`.
- O e2e confere que nem o token nem o código aparecem na URL, no histórico ou no console. Os pontos são `vigiarAba` e `semRastro` em `e2e/acesso-da-turma.spec.ts:266-296`, chamados no W7 e nos casos de recomeço, e as conferências de `page.url()` em `e2e/convidar-alunos.spec.ts`.

Auditoria: não se aplica. Não há leitura por coordenação ou rede, exportação, nota, permissão nem aprovação de IA.

Envio externo: nenhum. O WhatsApp continua levando só o nome da escola e o link, como antes (`texto-do-whatsapp.ts`, que não mudou).

Seed/fixture: sintético. Os nomes da lista de alunos no e2e são gerados com `crypto.randomUUID()`, e as contas de teste também são sintéticas.

Regra 20, item 8 (convite):
- O link e o código aparecem uma vez, só no passo que os gerou. O passo "Vigente" mostra só a validade (`ConvidarAlunos.tsx:186-205`).
- Gerar e revogar seguem com envio único, expiração e revogação.
- Isso está provado em `ConvidarAlunos.test.tsx:298` e no e2e "abrir de novo a mesma turma não mostra o link já fechado" (`e2e/acesso-da-turma.spec.ts:1141`).
- O passo "Acesso gerado" ocupa a janela inteira com fundo opaco. Isso melhora a privacidade: a lista com nomes e acertos de alunos deixa de ficar legível atrás do código projetado. O teste confere 25 pontos da janela e o fundo no modo claro e no escuro.

Pergunta de fechamento: a tarefa não muda o que o sistema guarda sobre um aluno nem para onde isso vai.

Bloqueantes: nenhum.

Recomendações:
1. O passo "Gerar acesso" continua na caixa de 520 px, e atrás dele a aba Alunos deixa à vista os nomes e acertos. Quem chega por `?convidar=1` a partir do aviso pode estar com a tela já projetada. O problema não é novo (a aba já mostra a lista sem o diálogo), mas vale levar ao `/retro` a ideia de o convite abrir com a lista recolhida ou de toda a etapa ficar na janela inteira.
2. O caso W4 "com dado" (`e2e/acesso-da-turma.spec.ts:435`) agora semeia o acesso no banco e troca a busca pelo token e pelo código exatos por `not.toMatch(/#[A-Za-z0-9_-]{43}/)`. A prova de que link e código aparecem uma vez continua coberta pelo W7, pelo caso de recomeço "outra turma, mesma entrada e segunda pessoa" e pelo teste de componente. Vale só anotar na tarefa onde essa prova mora agora.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/ConvidarAlunos.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/AcessoDaTurma.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/AlunosDaTurma.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Turmas.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/acesso-da-turma.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/componentes/Dialogo.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/componentes/dialogos.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/componentes/dialogo-modal.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/componentes/copia-unica.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/convidar-alunos.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/acesso-da-turma.spec.ts`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-19 15:08:16 · `tasks/prd-telas-do-professor/13_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: há divergências na largura do diálogo, no endereço, nos arquivos fora dos previstos e no toque fora do W7. Todas estão registradas só no `13_task.md`.
Portão local: carimbo válido

Bloqueantes:

1. **`tasks/prd-telas-do-professor/13_task.md:83-87`**: as cinco divergências da tabela existem só no documento da tarefa. A `techspec.md` não foi alterada (não aparece no `git status`), e o §9 não traz nenhum parágrafo "divergências da 13.0", ao contrário do que a 3.0, 4.0, 6.0, 7.0, 9.0, 12.0 e 14.0 fizeram. A coluna "Onde está na spec" aponta `techspec.md` §7, §9 e §13, mas nenhuma dessas seções diz o que a linha afirma:
   - **Caixa de 520 px.** A tarefa (13.1 e a linha "nada legível atrás") e o `mockup.md:172` pedem 560 px. A implementação usa `CAIXA_DE_520`, e o e2e mede `<= 520` (`e2e/convidar-alunos.spec.ts:155`).
   - **Botão sem o parâmetro.** O botão "Convidar alunos" não escreve `?convidar=1` no endereço.
   - **Arquivos fora dos previstos.** `componentes/dialogos.tsx` ganhou `CorpoDaConfirmacaoDePerigo`, e `componentes/copia-unica.tsx` ganhou o parâmetro `daPrimeira` em `useFocoDaEtapa`.
   - **e2e fora dos previstos.** `escola-montada.spec.ts`, `roteiro-da-demonstracao.spec.ts` e o novo `convidar-alunos.spec.ts`.
   - **Toque fora.** Deixou de valer no passo "Acesso gerado".

   **Correção exigida:** registrar cada uma no §9 da `techspec.md`, como "divergências da 13.0", com o motivo. Para a de 520 px, ou registrar a decisão ou implementar os 560 px que a tarefa pede.

2. **`tasks/prd-apresentacao-escola/cenarios.md:463-469` (W7)**: o cenário diz que fechar sem copiar "pergunta pelo botão, pelo toque fora e pelo Esc". A 13.0 tirou o toque fora do passo "Acesso gerado" e passou a provar o toque fora no passo "Gerar novo acesso" (`e2e/acesso-da-turma.spec.ts`, diff nas linhas 216-242). O próprio caso agora afirma que o toque no canto não pergunta. É mudança de cenário que prova regra (RF23), registrada só no `13_task.md:87`.
   **Correção exigida:** atualizar o W7 no `cenarios.md`, dizendo que no passo de tela inteira não há "fora" e onde o toque fora passou a ser provado, e citar a mudança na `techspec.md` §9.

3. **`apps/web/src/componentes/dialogo-modal.ts:97-98`**: a regra de quem abriu o diálogo mudou. O `body` agora conta como ninguém, e quem fecha cai no `focoDeReserva`. Isso vale para todo diálogo do produto, não só o "Convidar alunos". O arquivo não está em "Arquivos previstos" nem na tabela de divergências. A linha 85 registra `dialogos.tsx` e `copia-unica.tsx`, mas não este.
   **Correção exigida:** incluir `dialogo-modal.ts` na divergência de arquivos fora dos previstos e na `techspec.md` §9, dizendo o efeito sobre os outros diálogos.

Recomendações:
- **Comentário desatualizado em `apps/web/src/areas/professor/ConvidarAlunos.tsx:77`:** ainda diz que fechar com o link em risco pergunta "pelo toque fora". No passo "Acesso gerado", que é a tela inteira, isso não acontece mais. Ajustar o texto.
- **Passo "Gerar novo acesso" com acesso revogado:** em `ConvidarAlunos.tsx:89`, só o passo "Vigente" volta para "Gerar acesso" quando outra pessoa revoga. Se a professora já estiver no passo "Gerar novo acesso" nesse momento, o texto continua dizendo que o acesso de agora cai, e não há acesso nenhum. Vale tratar o caso ou registrá-lo como aceito.
- **"Cancelar" no passo "Revogar o acesso":** fecha o diálogo inteiro, em vez de voltar ao passo "Vigente". Hoje é o mesmo que o diálogo separado fazia, mas no diálogo de passos voltar ao passo anterior seria o esperado. Fica para o `frontend-reviewer` decidir.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/prd-telas-do-professor/13_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/prd-telas-do-professor/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/prd-apresentacao-escola/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/componentes/dialogo-modal.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/ConvidarAlunos.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/convidar-alunos.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/acesso-da-turma.spec.ts

## test-engineer · 1ª rodada · REPROVADO · 2026-10-19 15:09:49 · `tasks/prd-telas-do-professor/13_task.md`

VEREDITO: REPROVADO

Cenários exigidos: os nove casos pelo diálogo · link e código uma vez (componente e e2e) · fechar sem copiar · os estados (carregando, erro com "Tentar de novo", sem acesso, vigente, gerando) · o endereço (`?convidar=1` abre, fechar tira o parâmetro com `replace`, nunca token nem código, vínculo pendente ou de outra turma não abre) · depois de confirmar · concorrência (dois cliques em gerar e em revogar no mesmo instante, `CONFLITO`) · nada legível atrás de "Acesso gerado" (tela inteira, `bg-fundo` no claro e no escuro, "Gerar" mais estreito que a janela) · recomeço (sessão vencida, outra turma, segunda pessoa, rastro) · 360 px e teclado.

Cobertos: todos, menos a ressalva de isolamento nas recomendações.
- Os quatro arquivos de unidade e componente passam: 82 testes.
- A contagem de `test(` em `acesso-da-turma.spec.ts` continua 18, sem `.skip`, `fixme` nem `only`.
- O que saiu do W4 tem cobertura no W12: o axe e o 360 px do passo "Gerar", e a seção vazia e a com acesso. O `aria-current` continua no outro caso do W4.
- Conferi as mutações declaradas contra o `git diff`, e cada uma fica vermelha pelo motivo certo. Exemplos:
  - tirar o `?? titulo` do `focarNaSecao` só cai no foco devolvido;
  - o `document.body` em `dialogo-modal.ts` só cai no foco que volta ao "Convidar alunos" depois do diálogo aberto pelo endereço;
  - o `fecharAoClicarFora` cai no toque em (4,4) no passo "Gerar novo acesso".
- A concorrência é de verdade: dois `click` dentro do mesmo `act` no componente, e `doisCliquesNoMesmoInstante` no e2e.
- Nenhum provedor de IA envolvido.

Bloqueantes:
1. `apps/web/src/areas/professor/AcessoDaTurma.tsx:62-71`: o `abriuPeloEndereco` traz duas cláusulas novas sem bloco em "Mutações" e sem teste que as prove.
   - A trava da linha 68 (`if (abriuPeloEndereco.current) return`) diz "abre uma vez por pedido". Os callbacks de `useDialogoDaTela` são estáveis, então ela só muda alguma coisa sob `StrictMode`, que o `main.tsx` usa.
   - O rearme da linha 65 (`abriuPeloEndereco.current = false`) diz "o pedido que sai do endereço rearma o seguinte".
   - Removida qualquer uma das duas, os testes continuam verdes. Nenhum caso volta a pôr `convidar=1` na mesma montagem, e nenhum renderiza sob `StrictMode`.
   - Correção exigida, uma de duas:
     - (a) Provar as duas em `AlunosDaTurma.test.tsx`, cada uma com bloco em "Mutações". Para o rearme: com a aba montada, fechar o diálogo pedido pelo endereço, pôr `?aba=alunos&convidar=1` de novo com `history.pushState` e conferir que o diálogo abre. Para a trava: renderizar sob `<StrictMode>` (já há precedente em `Aprovar.test.tsx`) e conferir que o diálogo abre uma vez só, com uma leitura do acesso só.
     - (b) Se as duas não têm efeito que se veja, trocar tudo por `useEffect(() => { if (convidarPeloEndereco) abrir() }, [convidarPeloEndereco, abrir])`, que já está coberto pela mutação "remover `abrir()`".

Recomendações:
- `e2e/convidar-alunos.spec.ts:89-103`: o cenário pede "de outra turma", e o caso usa `crypto.randomUUID()`, uma turma que não existe. Use uma turma real de outro professor ou de outra escola (como já faz `acesso-da-turma.spec.ts:1218`) com `?convidar=1`, e confira também que nenhum POST a `/acesso` saiu.
- `e2e/acesso-da-turma.spec.ts:174`: com o acesso semeado no banco, o `not.toMatch(/#[A-Za-z0-9_-]{43}/)` passa por construção, porque o token nunca esteve na página. A regra do link e do código uma vez está provada no W12 (linha 859), no W7 (`semRastro`) e no componente. Tire a linha, ou diga no comentário onde está a prova.
- Sessão vencida com o diálogo aberto pelo endereço: o `convidar=1` fica no endereço, e depois de entrar de novo o diálogo reabre no passo "Vigente". O comportamento é aceitável, sem link nem código, mas não foi declarado nem testado. Vale uma linha no e2e ou na Tech Spec.
- `Turmas.tsx:76-80`: o aviso "Turma X confirmada" nasce no `onSuccess`, e nenhum caso prova que a confirmação que falha não mostra o aviso nem o "Gerar o acesso".

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/AcessoDaTurma.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/AlunosDaTurma.test.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/convidar-alunos.spec.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/acesso-da-turma.spec.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Turmas.tsx`

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-19 15:44:54 · `tasks/prd-telas-do-professor/13_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos da rodada 2, escola cheia e vazia, no computador e no celular; as dos passos "Gerar acesso" e "Acesso gerado" não mudaram e valem as da rodada anterior)
Estados: ok. O diálogo pedido por `?convidar=1` abre no passo "Vigente" nas duas escolas. Carregando e erro da leitura ficam em `AcessoDaTurma.tsx:76-83`, com "Tentar de novo" e a turma indisponível dita sem retentativa. Li isso no código, não nas fotos.
Acessibilidade: ok.
- O diálogo abre com foco e título visíveis.
- O foco de reserva vai para o botão da seção ou para o título dela (`AcessoDaTurma.tsx:54-56`), porque o endereço abre o diálogo sem controle focado.
- Esc e "Fechar" fecham.
- O texto está em português, sem termo técnico.

Chromebook fraco: ok. A correção tira um efeito com `ref` de trava e rearme, e o diálogo passa a vir aberto na primeira renderização (`dialogo-aberto.ts`). Há menos render e nenhum custo novo.
Celular: ok, a 360 px.
- Não há rolagem horizontal e a caixa cabe na largura.
- Os três botões ("Gerar novo acesso", "Revogar o acesso", "Fechar") ficam empilhados, com altura de uns 40 a 44 px.
- A foto do celular mostra a ação principal na altura esperada, e a rolagem por trás do diálogo (979 px) é normal.
- Nenhum botão depende de hover.

Ação oficial protegida: sim. O link e o código não voltam depois de gerados, e a revogação tem passo próprio de confirmação (perigo) no mesmo diálogo. Fechar com o link em risco pergunta antes, pelo botão e pelo Esc. O pedido do endereço não grava nada: o e2e novo prova que a turma pendente e a de outra escola não abrem o diálogo nem disparam `POST /acesso`. Isso cobre trocar o id na URL (regra 10).

Bloqueantes: nenhum. As correções exigidas na rodada anterior eram nenhuma.

Recomendações:
- Nas quatro fotos, a linha "Vale até 26/10/2026, 15:05." sai com a moldura azul de foco. O texto é só um título de passo, mas a moldura o faz parecer um campo de entrada. Vale suavizar o anel de foco (padrão do componente) ou tirar o foco programático do título quando o passo não tem controle. Gosto: a acessibilidade está correta. Arquivo: o passo "Vigente" em `apps/web/src/areas/professor/ConvidarAlunos.tsx` e `useFocoDaEtapa` em `apps/web/src/componentes/copia-unica.tsx`.
- Mantenho as recomendações registradas na tarefa (título "Gerar acesso" com subtítulo "Acesso gerado", texto longo no celular, passo "Gerar novo acesso" que não volta quando outra pessoa revoga). Elas seguem para o `TODO.md` e o `/retro`.
- Limite aceito e documentado: se o endereço passar a pedir `convidar=1` com a aba já montada, o diálogo não abre. Só abre na montagem, e isso está dito na Tech Spec §9, item 2.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-19 15:45:01 · `tasks/prd-telas-do-professor/13_task.md`

VEREDITO: APROVADO

Esta é a segunda rodada. Auditei só o diff `48f102bc… → fea40a83…` e o que ele afeta. A primeira rodada não exigiu correções.

Campos pessoais tocados: nenhum novo. O diff só mexe no frontend, em testes e em documentos. Não há migration, DTO de API, repository nem log.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/convidar-alunos.spec.ts:191-210` usa agora uma turma real de outra escola, com vínculo confirmado para o professor de lá, em vez de um UUID inventado. Isso é o teste de trocar o id na URL feito de verdade. O caso confere que a resposta é a mesma "Esta turma não está disponível" da turma pendente, que nenhum diálogo abre, que o nome de nenhuma das duas turmas aparece e que nenhum POST a `/v1/turmas/:id/acesso` sai da página.
- O caso não confere se sai um GET a `/acesso`. Ele vale mesmo assim: o `AcessoDaTurma` só é montado dentro da turma disponível, e quem barra de fato é o servidor.

Abrir pelo endereço sem gerar nada: ok.
- `useDialogoDaTela(abertaNaMontagem)` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/componentes/dialogo-aberto.ts:150` só abre o diálogo. Ele não chama nada no servidor.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/ConvidarAlunos.tsx:93` o acesso só é gerado por `enviar` (`useEnvioUnico`), que depende de clique. O endereço abre o passo que a leitura pede e nunca cria acesso sozinho.
- Sessão vencida com `convidar=1` (techspec §9, item 6): a tela reabre em "Vigente" ou em "Gerar acesso", sem link nem código. Nada é exposto de novo.

Logs: limpos. O diff não acrescenta log.

Auditoria: nenhuma ação nova que a exija. Gerar e revogar o acesso são os de antes, já auditados na rodada 1.

Envio externo: nenhum.

Seed/fixture: sintético. O e2e cria escolas, equipes e alocações com `criarEquipeComSenha` e `criarAlocacaoDoProfessor`.

Bloqueantes: nenhum.

Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/acesso-da-turma.spec.ts:174` saiu a checagem `not.toMatch(/#[A-Za-z0-9_-]{43}/)`. Não bloqueia: nesse caso o acesso é semeado no banco, então o token nunca chegava ao cliente e a checagem quase não provava nada. A prova de que o link e o código aparecem uma vez e não voltam continua no W7, nos casos que usam `semRastro`/`vigiarAba` (linhas 582-747 e 1150-1213). Se quiser, ponha no W4 um comentário apontando o caso exato que dá essa prova, para quem ler depois não achar que a cobertura caiu.
- Para o `/retro`: um teste no `convidar-alunos.spec.ts` de que abrir pelo endereço uma turma disponível da própria escola também não dispara POST. Isso já está garantido pelo código, porque gerar depende de clique, mas ficaria provado de ponta a ponta.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 15:45:34 · `tasks/prd-telas-do-professor/13_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As três correções da 1ª rodada foram feitas:
1. O §9 da `techspec.md` ganhou o parágrafo "O convite na pele nova (divergências da 13.0)", com seis itens e o motivo de cada um. A caixa de 520 px ficou registrada como decisão: o `Dialogo` tem uma largura só, e o e2e mede `<= 520` e menor que a janela.
2. O W7 do `cenarios.md` foi atualizado. No passo "Acesso gerado", em tela inteira, não há "fora". O toque fora passou a ser provado em "Gerar novo acesso". O §9 da `techspec.md` cita a mudança no item 4.
3. `dialogo-modal.ts` entrou na divergência de arquivos fora dos previstos e no §9, item 3, com o efeito nos outros diálogos: nenhum para quem abre por botão ou link, e o foco vai para o `focoDeReserva` quando o `body` estava focado.

O diff novo também está registrado: `useDialogoDaTela(abertaNaMontagem)`, no lugar do efeito `abriuPeloEndereco`. Conferi como a tela é montada. Em `rotas.tsx:74`, a `Turma` leva `key={turmaId}`. O único link com `convidar=1` (`Turmas.tsx:181`) vem de outra rota, então a aba sempre monta de novo e o pedido na montagem basta. Fechar troca o endereço com `replace`, e voltar ou avançar no histórico não reabre o diálogo.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes: nenhum

Recomendações:
- `apps/web/src/areas/professor/AcessoDaTurma.tsx:17` e `apps/web/src/areas/professor/AlunosDaTurma.tsx:31-32`: os comentários ainda dizem "abre sozinho, uma vez por pedido" e "ele abre uma vez". O comportamento agora é "abre na montagem da aba enquanto o endereço pedir". Alinhar o texto com o de `dialogo-aberto.ts:40-42`.
- `tasks/prd-telas-do-professor/techspec.md`, §9, item 5: a lista de testes fora dos previstos traz só os três e2e. Faltam `AlunosDaTurma.test.tsx`, `Turmas.test.tsx` e `dialogo-aberto.test.ts`, que a linha da tabela da tarefa cita e manda para esse item. Completar a lista para os dois documentos dizerem o mesmo.
- `tasks/prd-telas-do-professor/13_task.md:84`: "itens 2" deve ser "item 2".

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 15:46:18 · `tasks/prd-telas-do-professor/13_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- O endereço com `?convidar=1` abre o diálogo.
- Fechar tira o pedido do endereço com `replace` e o diálogo não volta.
- Sem pedido, ou com outro valor, nada abre.
- A abertura seguinte não é fechada pela resposta da abertura feita na montagem.
- A confirmação que falha não mostra o aviso nem o "Gerar o acesso".
- Turma de outra escola ou com vínculo pendente não abre o diálogo e responde como turma indisponível (regra 10, item 4).
- StrictMode, a dúvida da 1ª rodada.
- Sessão vencida com o diálogo aberto pelo endereço.

**Cobertos:**
- **Correção 1 (`abriuPeloEndereco`):** foi resolvida por outra via, e ela resolve a causa. A trava e o rearme saíram junto com o efeito. O diálogo agora abre na montagem, pelo valor inicial do `useState` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/componentes/dialogo-aberto.ts:150-151`. Esse valor inicial é puro, e no StrictMode o React o calcula duas vezes com o mesmo resultado, então a questão do StrictMode deixa de existir.
- **Quem chega ao endereço:** o único lugar que gera o link é `Turmas.tsx`, numa rota diferente da turma. E `Turma` tem `key={turmaId}` (`rotas.tsx:74`), então quem chega pelo link sempre monta a aba do zero. Abrir só na montagem não perde nenhum caminho real.
- **As três mutações novas falham pelo motivo certo** (conferi lendo o código):
  - "sem pedido, nada abre": com a mutação o hook devolve `{tipo:'x'}` e a primeira asserção quebra.
  - `useRef(0)`: a reabertura volta a ser a nº 1, o `toBe(2)` quebra, e o `fecharSeAinda(primeira)` passaria a fechar a segunda abertura.
  - `definirConfirmada` dentro de `mutationFn`: o aviso aparece antes do 409, e tanto `queryByText(/confirmada$/)` quanto o link "Gerar o acesso" quebram.
- **Mutação antiga:** a de `AcessoDaTurma.tsx` foi trocada para a linha nova (tirar o argumento), e continua no teste "`?convidar=1` abre o diálogo sozinho".
- **Recomendações da 1ª rodada, as quatro aplicadas:**
  - O caso de outra escola em `e2e/convidar-alunos.spec.ts` agora usa uma turma real, de outra escola, com vínculo confirmado.
  - A asserção que passava por construção em `e2e/acesso-da-turma.spec.ts:174` saiu, e o motivo ficou em comentário.
  - A confirmação que falha agora tem teste em `Turmas.test.tsx:283`.
  - A sessão vencida está declarada na Tech Spec, §9, item 6, e na tabela de divergências.
- **Execução:** `dialogo-aberto.test.ts`, `AlunosDaTurma.test.tsx` e `Turmas.test.tsx` passaram, 61 de 61. Não há `.skip`, mock nosso escondendo a regra, nem provedor de IA envolvido.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/convidar-alunos.spec.ts:200-210`: `expect(gravacoes).toEqual([])` passa por construção. O POST a `/acesso` só sai com um clique em "Gerar acesso", e o caso não clica. Se a regra caísse e o diálogo abrisse, a lista continuaria vazia. É o mesmo defeito da antiga linha 174. Duas saídas:
   - Contar qualquer pedido a `/v1/turmas/<id>/acesso`, de qualquer método. O GET da leitura sai na montagem da aba, então essa contagem pega a regra.
   - Ou tirar a asserção e o "nem pede o acesso" do título do caso.
2. O mesmo arquivo perdeu o caso da turma inexistente. Ele foi trocado pelo de outra escola, e não somado a ele. Isso enfraquece a prova de que "não existe" e "não é sua" respondem igual (regra 10, item 6). Vale manter os três casos.
3. A ternária `convidarPeloEndereco ? 'convidar' : undefined`, em `AcessoDaTurma.tsx:46`, tem bloco de mutação só para o lado verdadeiro. O lado falso é provado pelo caso `convidar=0` (`AlunosDaTurma.test.tsx:560`), mas sem bloco próprio. Sugestão: um bloco que troca por `'convidar'` fixo, citando esse caso.
4. Dois comentários ainda descrevem o comportamento antigo:
   - `AcessoDaTurma.tsx:17` diz "abre sozinho, uma vez por pedido".
   - `AlunosDaTurma.tsx:31-32` diz "ele abre uma vez".

   O comportamento agora é "abre na montagem da aba".

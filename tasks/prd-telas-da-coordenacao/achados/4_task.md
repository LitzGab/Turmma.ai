# Achados das revisões — `tasks/prd-telas-da-coordenacao/4_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-16 22:52:02 · `tasks/prd-telas-da-coordenacao/4_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A tarefa mexe só na web. Muda de lugar a leitura nominal que já existia (`RespostaAnalistaNominal`: nome e disciplina dos professores de uma turma, acerto por habilidade e contagem de sinais). Ela não traz aluno. Nenhuma migration, nenhum DTO nem contrato do `packages/shared` foi alterado.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. Nenhuma rota de API foi criada ou alterada. `/v1/analista/nominal` e `/v1/analista/resumo` seguem como estavam. O 404 de turma que saiu da escola recebe o mesmo texto de "não encontrado" (`DadoNominal.tsx:73`).

Logs: limpos. O diff não tem nenhum log.

Auditoria: presente. Cada leitura nominal grava uma auditoria `analista.nominal_lido`, e agora há prova disso.
- `e2e/analista.spec.ts:375-401`: abrir duas vezes grava duas auditorias, e sair da página e voltar não guarda a leitura nem lê de novo.
- `e2e/analista.spec.ts:403-424`: a leitura que falha não grava auditoria.
- O aviso de auditoria vem antes da leitura, e turma e finalidade são obrigatórias, escolhidas de lista fechada sem texto livre (`DadoNominal.tsx:96-128`).

Envio externo: nenhum envio novo. "Gerar resumo" continua pelo ciclo de execução que já existia. O resumo é agregado por série e disciplina.

Seed/fixture: sintético. As fixtures usam "Professora Sintética Helena <marca>" e turmas "2ºB <marca>", o 404 simulado usa um UUID fixo, e o teste de componente usa uma rede falsa com ids fabricados.

Fotos da tela: nenhum vazamento visível.
- Escola cheia, no computador e no celular, antes e depois de "Gerar resumo": só agregado por série e disciplina, sem nome de aluno nem de professor. O recorte de um professor só (Física) aparece sem número. O nominal fica atrás do botão oficial.
- Escola vazia: só o vazio e o botão de gerar.
- O teste de troca de pessoa na mesma aba prova que nem o resumo nem o nome da professora da escola anterior aparecem para a coordenação seguinte (`e2e/analista.spec.ts:452-494`, com `MutationObserver` vigiando o DOM inteiro).
- A Governança deixou de oferecer o nominal (`Governanca.tsx:105`; `e2e/governanca.spec.ts:89`).

Pergunta de fechamento: a tarefa não mexe no que o sistema guarda sobre um aluno nem para onde isso é enviado. O resumo não guarda nome, e a leitura nominal fica na auditoria com turma e finalidade.

Bloqueantes: nenhum.

Recomendações:
- O recorte "2º ano do Ensino Médio · Química" mostra "2 alunos" com "acerto de 75%" e "2 de 4" por habilidade (fotos `coordenacao--coordenacao-analista--computador.png` e `...--celular-2.png`, produzido por `Analista.tsx:173-183`). Com dois alunos, o agregado fica muito perto do resultado individual. A regra hoje pede dois professores no recorte, não um mínimo de alunos. Isso já existia antes desta tarefa e não bloqueia, mas vale levar ao `TODO.md` ou à decisão dos indicadores: um mínimo de alunos por recorte antes do piloto com dado real.
- A foto `.processo/vitrine/coordenacao--coordenacao-analista--Gerar-resumo--computador-2.png` saiu em branco. Não é achado de privacidade, mas a ferramenta que tira as fotos deve ser conferida para a próxima rodada não auditar sem a imagem.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Analista.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/DadoNominal.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Governanca.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Analista.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/componentes/estado/EstadoVazio.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/analista.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/governanca.spec.ts`

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-16 22:52:05 · `tasks/prd-telas-da-coordenacao/4_task.md`

VEREDITO: APROVADO
Tela vista: sim (18 fotos lidas, cheia e vazia). São as 11 enviadas (computador, celular e a variante "Gerar resumo", mais a vazia) e 3 que fotografei do diálogo "Abrir dado nominal de uma turma". Uma das fotos enviadas, `Gerar-resumo--computador-2.png`, é uma faixa em branco de página comprida, sem conteúdo. Não é defeito de tela.
Estados: ok
- Carregando: `EstadoCarregando` com "Carregando o resumo…" (`Analista.tsx:96`).
- Erro: `EstadoErro` com "Tentar de novo" (`Analista.tsx:97`).
- Vazio: "Nenhum resumo gerado ainda", com a ação de gerar (foto vazia, `Analista.tsx:100-105`). Ele convida a agir e não pede desculpa.
- Com dado: foto cheia.
- Os dois vazios de dentro ("Nenhum alerta neste resumo" e "Ainda não há correção aprovada") só aparecem com o resumo lido. `Analista.test.tsx:36` e `:105` provam isso.

Acessibilidade:
- O selo "Hipótese" está em texto, então a cor não é a única pista.
- O foco vai para o parágrafo do resumo depois de gerar (`Analista.tsx:54-60`), e o teste `Analista.test.tsx:148` prova.
- O botão que abriu o dado nominal recebe o foco de volta ao fechar o resultado (`DadoNominal.tsx:65`).
- O diálogo usa `DialogoDeConfirmacao`, com campos rotulados e marcados como obrigatórios.
- Os e2e checam axe e largura a 360 px.
- Os textos de apoio têm contraste legível nas fotos.

Chromebook fraco: sem lista longa nem imagem nesta tela. Não há animação nem efeito pesado, só componentes já existentes. Nada novo a medir.

Celular:
- Em 360 px não há rolagem horizontal nem texto cortado nas 3 fotos de celular.
- "Gerar resumo" e "Abrir dado nominal de uma turma" têm cerca de 44 px de altura e largura total.
- No celular, os quatro números empilham, e o botão do diálogo quebra em duas linhas sem esconder a ação.
- Não há hover nem atalho.
- O e2e roda nos projetos `chromebook` e `celular` (`hasTouch`).
- A barra de abas fixa que aparece no meio das fotos é efeito da captura de página inteira, não defeito.

Ação oficial protegida: sim.
- O botão é `oficial`.
- O diálogo mostra Turma e Finalidade (campos de escolha fechada, sem texto livre), diz o que a resposta mostra e avisa que a abertura fica na auditoria, tudo antes de confirmar. A confirmação fica desabilitada até os dois campos serem escolhidos.
- O e2e prova que abrir duas vezes grava duas auditorias, que a confirmação nasce vazia e que a leitura não fica guardada.
- A falha não grava auditoria, e o aviso da tentativa anterior sai ao reabrir.

Bloqueantes: nenhum.
- Sem rolagem horizontal, sem texto cortado, sem termo técnico, sem id nem chave de tradução, sem inglês na tela.
- A saída de IA tem a marca: `AssinaturaIA` com o selo "IA" no topo (`Analista.tsx:81`), e cada alerta traz o selo "Hipótese".
- A página não é conversa: sem campo de texto, anexo, pergunta pronta, "Relatório" nem "Baixar". `Analista.test.tsx:155-181` prova.
- Há um só "Gerar resumo" por tela: no alto com resumo, no vazio sem resumo.
- O visual segue o mockup (seção 2, só barra do topo, largura de leitura e vazio): coluna de leitura de 880 px, borda de 2 px, onça do Analista, `Tela` e `CabecalhoDeSecao`.
- Fotos e código não se contradizem. O `DadoNominal` saiu de `Governanca.tsx`, e `governanca.spec.ts` afirma que o botão não está mais lá.

Recomendações:
- `Analista.tsx:70-75`: com a leitura em andamento (`resumo.isPending`) o "Gerar resumo" do alto aparece. Se a escola não tem resumo, ele some quando a leitura termina e o vazio mostra o seu. Isso causa um salto de layout, e um toque durante a leitura já dispara a geração. Considere esconder a ação também enquanto `resumo.isPending`.
- `Analista.tsx:104`: o texto "Verificando…" do `EstadoVazio` nunca aparece nessa ação, porque ela usa `desligada` e não `emAndamento`. Está correto, é só um fato registrado.
- A foto do diálogo mostra "Ainda não escolhida" no resumo antes da escolha. É honesto, e a recomendação é só manter.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-16 22:52:06 · `tasks/prd-telas-da-coordenacao/4_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A diff só mexe no frontend (a página do Analista, o `DadoNominal` que mudou de lugar e o `EstadoVazio`) e nos testes. Nenhum job, seed, importação ou webhook foi tocado. Todos com autor humano? sim, porque nenhum caminho novo existe.

Decisão autônoma sobre aluno: ausente. O resumo é agregado por série e disciplina. Cada alerta leva o selo "Hipótese" em texto, com hipóteses de uma lista fechada e a frase "quem conclui é a escola, com os professores". Nada sugere aprovação, reprovação ou encaminhamento. Isso aparece nas fotos `coordenacao--coordenacao-analista--computador.png` e `--celular-1.png`, e vem de `apps/web/src/areas/coordenacao/Analista.tsx:136-160`.

Aprovação registrada: ok. O resumo do Analista vai à coordenação, não ao aluno, e não vira nota, mensagem nem decisão. A exceção do tutor (D47) não aparece em nenhum outro agente.

Supervisão do tutor: ok, fora do escopo. Na tela só aparecem as contagens agregadas "Trocas com o Tutor" e "avisos aos professores", sem conversa e sem nome.

Autonomia declarada e visível: sim. A página traz a assinatura do Analista com o selo "IA" (`Analista.tsx:80-86`), e o que ele faz sozinho está dito em português comum: "Só avisa a coordenação: nunca contata professor nem família". As fotos de computador, celular e escola vazia mostram isso. A declaração completa por função continua na Governança, que esta diff não alterou fora a saída do nominal.

Medir o professor (D45, regra 70 itens 8 e 9):
- **Dois professores:** um recorte com menos de dois professores aparece sem número, em "Recortes sem número" (`Analista.tsx:189-201`). A foto mostra isso com Física.
- **Sem ranking nem decisão:** a página não tem ranking, adoção nominal, alerta de professor que não usa nem nada ligado a decisão sobre o professor.
- **Nominal com auditoria:** o nominal fica atrás de um botão oficial, com o aviso de auditoria antes, turma e finalidade de lista fechada, e uma auditoria por leitura. Abrir duas vezes grava duas (`e2e/analista.spec.ts:375-401`). Uma leitura que falha não grava nenhuma (`:403-424`), e o resultado não fica guardado ao sair e voltar.
- **Governança só agregada:** a Governança deixou de oferecer o nominal (`e2e/governanca.spec.ts:89-90`), então há uma porta só, auditada.
- **Conversa do professor:** a conversa do professor com o chat não aparece em lugar nenhum.

Discursiva e redação (D46, D55): a diff não tem nenhum campo, tela ou texto de nota proposta.

Supervisão não é vigilância: não há inferência emocional nem janela sobre o comportamento. Os sinais do tutor aparecem só como contagem, e no nominal está escrito "os nomes chegam apenas aos professores da turma".

Bloqueantes: nenhum.

Recomendações:
1. No celular, quando a pessoa rola até os alertas, a assinatura com o selo "IA" já saiu da tela (`coordenacao--coordenacao-analista--celular-1.png`, vindo de `Analista.tsx:124-126`). Vale marcar a própria linha "Resumo gerado em…" como do Analista, por exemplo "Resumo gerado pelo Analista em…", para que a saída de IA fique rotulada mesmo sem o topo à vista.
2. O selo "Menos de dois professores com correção aprovada: conta como nominal" (`Analista.tsx:196`) usa "nominal", que é jargão. Para a coordenação, um texto como "sem número: seria o resultado de um professor só" seria mais claro. Fica para o `/validar`.
3. A foto `coordenacao--coordenacao-analista--Gerar-resumo--computador-2.png` saiu em branco. É problema da vitrine, não da regra 70, mas a próxima rodada de fotos deveria cobrir o estado depois de o resumo chegar.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Analista.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/DadoNominal.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Governanca.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Analista.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/analista.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/governanca.spec.ts

## revisor-geral · 1ª rodada · APROVADO · 2026-10-16 22:52:45 · `tasks/prd-telas-da-coordenacao/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Conferi a tarefa contra a `techspec.md` (§7b e §9, "Analista") e contra o RF8, o RF9 e o RF22. Nada invade tarefa futura:
- A conversa do Analista continua de fora (F12).
- A tabela da IA continua na Governança (10.0).
- `DadoNominal` só existe agora no Analista; na Governança sobrou apenas o comentário.
- Não há outro spec que esperasse o botão do dado nominal na Governança. O roteiro da demonstração já chegava pelo Analista.

As duas mudanças fora de `Analista.tsx` foram declaradas na tabela de arquivos e têm motivo. O `desligada` do `EstadoVazio` existe para não sair um segundo pedido do botão do vazio. A asserção invertida em `governanca.spec.ts` acompanha a saída do dado nominal da Governança.

Nas fotos, a tela mostra o que o RF8 e a §9 descrevem:
- A assinatura do Analista com o selo "IA".
- O selo "Hipótese" em texto nos alertas.
- O acerto por série e disciplina e os "Recortes sem número".
- O dado nominal no fim da página.
- Nenhum campo de texto, anexo, "Relatório" ou "Baixar".

Os nomes seguem o glossário.

Recomendações:
- `/…/apps/web/src/areas/coordenacao/Analista.tsx:70-71`: com a escola sem resumo, o "Gerar resumo" sai do topo e fica só no vazio. A §9 e a subtarefa 4.1 dizem "Gerar resumo como a ação da tela". Leio isso como compatível com a 4.3 (o vazio com a ação de gerar) e com "um primário por tela". Mesmo assim, vale uma linha na tabela de divergências do `4_task.md`, que hoje diz "nenhuma", ou uma frase na §9. Assim o próximo leitor não toma isso por esquecimento.
- `/…/apps/web/src/areas/coordenacao/Analista.tsx:70`: enquanto o resumo carrega (`isPending`), `semResumo` é falso. O botão primário aparece no topo e some quando o vazio chega, então ele muda de lugar na tela. Se a pessoa clicar nele durante a leitura, o pedido sai de um botão que em seguida desaparece. Esconder a ação do topo também enquanto carrega evita isso.
- `/…/tasks/prd-telas-da-coordenacao/4_task.md:91`: a mutação `resumo.data !== undefined && true` funciona, mas é difícil de ler. Algo como trocar `=== null` por `!== null` diria a mesma coisa de forma mais clara.

Arquivos auditados (prefixo `/…/` = `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2`):
- `/…/apps/web/src/areas/coordenacao/Analista.tsx`
- `/…/apps/web/src/areas/coordenacao/Analista.test.tsx`
- `/…/apps/web/src/areas/coordenacao/DadoNominal.tsx`
- `/…/apps/web/src/areas/coordenacao/Governanca.tsx`
- `/…/apps/web/src/componentes/estado/EstadoVazio.tsx`
- `/…/apps/web/src/componentes/estado/estados.test.tsx`
- `/…/e2e/analista.spec.ts`
- `/…/e2e/governanca.spec.ts`
- `/…/tasks/prd-telas-da-coordenacao/4_task.md`

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 22:53:16 · `tasks/prd-telas-da-coordenacao/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos**
- **Caminho feliz:** o Analista é uma página de leitura, assinada, com selo "IA", e o resumo é gerado a pedido. Cada alerta tem o selo "Hipótese" em texto. O acerto aparece por série e disciplina, e o recorte de um professor só aparece sem número.
- **Os quatro estados:** carregando, erro com "Tentar de novo", vazio com a ação de gerar e com dado. Os vazios de dentro do resumo só aparecem depois da leitura terminar. O foco vai para o resumo que chegou.
- **Não é conversa (RF8):** a página não tem campo de texto, arquivo, pergunta pronta, "Relatório" nem "Baixar", com resumo e sem resumo.
- **Dado nominal:** fica só no Analista e sai da Governança. O aviso de auditoria vem antes, turma e finalidade são obrigatórias, e cada leitura grava uma auditoria; abrir duas vezes grava duas. Reabrir pede a finalidade de novo, e sair da página não guarda a leitura.
- **Borda:** a turma some entre o pedido e a leitura (404). A falha não grava auditoria, e o aviso da tentativa anterior sai ao reabrir. Escola sem entregas, que é o vazio.
- **Concorrência e mesma entrada:** com o pedido de "Gerar resumo" no ar, sai um pedido só, tanto do vazio como do botão do alto.
- **Isolamento e recomeço:** a coordenadora seguinte na mesma aba, de outra escola, não vê o resumo nem o dado nominal da anterior. A resposta atrasada da anterior não mexe na tela da seguinte.
- **Permissão:** a Governança é só agregado e não abre o nominal.

**Cobertos**
- Todos os cenários acima têm teste. O arquivo novo `apps/web/src/areas/coordenacao/Analista.test.tsx` cobre os estados, o "não é conversa", o pedido único e o foco.
- `apps/web/src/componentes/estado/estados.test.tsx` cobre a ação do vazio desligada.
- `e2e/analista.spec.ts` cobre o nominal, as duas auditorias, a falha 404, a pessoa seguinte, a resposta atrasada, o pedido único, a assinatura, os 360 px e o axe.
- `e2e/governanca.spec.ts:90` confere que o botão do nominal não está mais na Governança.
- `e2e/roteiro-da-demonstracao.spec.ts:626-654` já passa pelo Analista.
- **Mutações:** as sete cobrem as cláusulas novas do diff: o `semResumo`, as ações que somem com ele, o `desligada` no Analista e no `EstadoVazio`, a largura `leitura` e o selo "Hipótese". Os testes citados existem e casam pelo nome. O rótulo variável do vazio também fica preso, por `findByRole('Gerando o resumo…')`.
- Rodei `npx vitest run` nos dois arquivos de unidade: 21 de 21 verdes.
- Não há `.skip`, teste comentado, nem chamada a provedor de IA, e a rede falsa não esconde regra nenhuma.

**Bloqueantes:** nenhum.

**Recomendações**
1. **`e2e/analista.spec.ts:418`:** a espera fixa de 1500 ms antes das asserções negativas pode passar sem provar nada se a máquina estiver lenta, porque a resposta atrasada ainda não chegou à tela. Vale trocar pelo mesmo `MutationObserver` usado nas linhas 322-330, que registra qualquer momento em que apareça "O Analista está montando o resumo", `[data-resumo-do-analista]` ou um `role=alert`. Outra saída é esperar a consulta `/v1/execucoes/` e verificar que ela não acontece.
2. **`e2e/analista.spec.ts:370-371` e `Analista.test.tsx:138`:** o clique em botão desligado não prova mais que o `toBeDisabled`, porque o React já ignora `onClick` em botão desligado. Um `dblclick` no botão ainda ligado exercitaria a janela de verdade, antes de a tela se redesenhar.
3. **Falha a partir do vazio:** falta teste de tela para a falha do pedido saindo do vazio. Os casos são função suspensa e limite de pedidos, que é o "provedor de IA recusando por limite". Agora que a ação mora no vazio, valem duas asserções: aparece o `AvisoFila` ou o aviso, e o botão do vazio volta ligado. Também convém conferir que não ficam dois botões primários na tela, o do vazio e o "Tentar de novo".
4. **Mutação 3 (`resumo.data.resumo === null`):** ela fica vermelha por `TypeError`, a tela quebra, e não por um comportamento visível. A variante `resumo.data?.resumo == null` esconderia o botão do alto durante a carga e nenhum teste perceberia. Se o botão no alto enquanto carrega for intencional, como diz o comentário no `Analista.test.tsx:133`, vale afirmá-lo no teste de carregando.
5. **`e2e/governanca.spec.ts:13`:** o comentário ainda diz "movidos sem editar o corpo", e a 4.0 editou os testes movidos.

## test-engineer · 2ª rodada · APROVADO · 2026-10-16 23:04:41 · `tasks/prd-telas-da-coordenacao/4_task.md`

VEREDITO: APROVADO

Cenários exigidos (2ª rodada, só o diff desde `009f5f5`):
- **Recomendação 1, a espera fixa de 1500 ms:** um teste que não depende do relógio para provar que a resposta atrasada da primeira coordenação não aparece na tela da segunda.
- **Recomendação 5:** o comentário de abertura de `governanca.spec.ts` alinhado ao que o arquivo faz.
- **Techspec §9:** a frase nova coerente com a divergência registrada.

Cobertos:
- **Recomendação 1, feita e mais forte que o pedido.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/analista.spec.ts:304-321` não há mais espera de 1500 ms.
  - O `MutationObserver` é instalado antes de `soltar()`. Assim, qualquer momento em que a tela mostre o aviso de que está gerando, um `[data-resumo-do-analista]` ou um alerta não vazio em `main` fica registrado, mesmo que dure pouco.
  - O teste antigo só olhava o estado final e deixava passar quem aparecesse e sumisse antes da olhada.
  - A espera agora tem um fim definido: o anúncio da resposta (`waitForResponse`) e mais dois quadros. Os dois desfechos legítimos estão cobertos: a aba recebe a resposta e a ignora, ou a aba já tinha abortado o pedido ao sair, e aí o `catch` engole o fim do prazo.
  - `expect(__vazamentos).toEqual([])` é uma asserção sobre o resultado, e as quatro asserções finais continuam.
  - Se a regra fosse removida (o estado do pedido anterior passando para a sessão seguinte), o observador registraria a mudança e o teste ficaria vermelho.
- **Recomendação 5, feita.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/governanca.spec.ts:13` o comentário mudou, e só ele.
- **Techspec §9:** a frase sobre o botão do vazio e o do alto bate com a divergência registrada no `4_task.md` e com o código, que não mudou nesta rodada.
- **As recomendações não aplicadas** têm destino ou motivo na tabela, e nenhuma delas era bloqueante.
- O diff não traz código de aplicação. Não há cláusula nova, então nenhuma mutação nova é exigida.
- Não há `.skip`, nem mock de coisa nossa, nem chamada a provedor pago.

Bloqueantes: nenhum.

Recomendações:
1. **Espera longa no caminho do pedido abortado** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/analista.spec.ts:315`). Se a aba abortou o pedido, `chegouNaAba` só termina quando acaba o prazo de 20 s (`PRAZO_DA_ENTRADA_MS`), porque o anúncio nunca vem. O resultado continua certo, já que nesse caminho não há o que vazar, mas são 20 s a mais em cada projeto. Uma correção: avisar no próprio `route` se o `fulfill` falhou, por uma promessa resolvida no `catch` da linha 287, e esperar o anúncio ou esse aviso, o que chegar primeiro.
2. **Registrar qual caminho aconteceu.** Vale guardar se a aba recebeu a resposta ou abortou o pedido (por exemplo, um booleano marcado no `catch` do `fulfill`), para o relatório mostrar qual dos dois o teste exercitou. Os dois são legítimos, mas hoje não dá para saber qual rodou em cada projeto.

Não rodei o e2e: ele precisa da API de pé, e o portão da tarefa já o roda.

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-16 23:05:01 · `tasks/prd-telas-da-coordenacao/4_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A divergência do "Gerar resumo" do alto, que some no vazio, agora está no `4_task.md` (tabela "Divergências resolvidas") e na `techspec.md` §9 (Analista), e as duas dizem a mesma coisa.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/4_task.md:136`, `:138`, `:140` e as três linhas do `test-engineer` logo abaixo, até `:145`. **O que está errado:** a tabela "Recomendações sem aplicar" manda seis recomendações para o `TODO.md`, mas o `TODO.md` não foi alterado: não aparece no `git status` e `git diff HEAD -- TODO.md` sai vazio. Nenhuma das seis está no arquivo; procurei por "isPending", "mínimo de alunos", "Resumo gerado", "AvisoFila", "dblclick" e "mutação 3". O destino escrito no documento não existe, e as seis se perdem no commit. Duas delas importam mais:
  - o mínimo de alunos por recorte, do `privacy-guardian`;
  - o rótulo de IA em "Resumo gerado em…", do `conformidade-reviewer`.

  Na 3.0, o mesmo destino foi gravado no `TODO.md` dentro do commit da tarefa (`3be23c9`, +3 linhas).
  **Correção exigida:** acrescentar ao `TODO.md`, antes do commit, uma entrada para cada linha cujo destino é `TODO.md`:
  - botão do alto durante `resumo.isPending`, junto do ponto da mutação 3 e do `resumo.data?.resumo == null`;
  - mínimo de alunos por recorte;
  - rótulo do Analista em "Resumo gerado em…";
  - `dblclick` com o botão desligado;
  - falha do pedido a partir do vazio, com `AvisoFila` e o botão voltando ligado.

  Cada entrada leva a marca "(telas da coordenação, 4.0)" e o revisor de origem. A alternativa é mudar o destino na tabela para um que exista de fato. Como não mexe em código, essa correção não derruba as aprovações já dadas.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/analista.spec.ts:315`: o `.catch(() => undefined)` faz o teste esperar `PRAZO_DA_ENTRADA_MS` inteiro, em silêncio, quando a aba aborta o pedido. Nesse caso o teste passa, mas devagar. Uma anotação (`test.info().annotations`) no ramo do abort deixaria visível qual dos dois caminhos rodou.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/analista.spec.ts:308`: o observador procura "O Analista está montando o resumo" em `document.body.textContent`, o que pega também texto escondido. Para o que o teste quer provar está certo, porque é mais estrito, mas restringir a `main`, como já faz a checagem do alerta na linha 310, deixa as três checagens com o mesmo alcance.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-16 23:33:48 · `tasks/prd-telas-da-coordenacao/4_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum.

A correção que eu tinha exigido na 2ª rodada foi feita. No `TODO.md` entraram cinco entradas, todas com a marca "(telas da coordenação, 4.0)" e o revisor de origem. Elas cobrem as seis linhas do `4_task.md`, de 136 a 145, que apontavam para o `TODO.md`:
- o botão do alto durante a leitura, já com a mutação 3 e o `resumo.data?.resumo == null` dentro (linhas 136 e 145);
- o mínimo de alunos por recorte (138);
- o rótulo do Analista em "Resumo gerado em…" (140);
- o `dblclick` no botão ligado (143);
- a falha do pedido saindo do vazio (144).

A sexta entrada nova, a espera de 20 s, corresponde à linha nova 146 do `4_task.md`.

Desde a rodada anterior, o código só mudou no teste da resposta atrasada em `e2e/analista.spec.ts` (linhas 282 a 323). As duas mudanças não enfraquecem o teste:
- **`entregaAbortada`:** fica marcado antes de `entregue()`, então a anotação lê o valor certo.
- **Observador restrito a `main`:** continua pegando o vazamento na tela da segunda pessoa, e as asserções finais sobre `principal(page)` continuam no lugar.

Recomendações:
- `e2e/analista.spec.ts:323`: a anotação "sem anúncio no prazo" registra o caso anômalo, em que a resposta não chegou à aba e a aba também não abortou, mas o teste segue verde. Se esse caminho não deveria acontecer, vale falhar ali em vez de só anotar. Pode ir junto da entrada "a espera de 20 s" do `TODO.md`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/TODO.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/analista.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/4_task.md

## test-engineer · 3ª rodada · APROVADO · 2026-10-16 23:34:11 · `tasks/prd-telas-da-coordenacao/4_task.md`

VEREDITO: APROVADO

Esta foi uma rodada nova. Auditei só o que mudou desde a 2ª (`de9d507..6d9d73c`), em `TODO.md`, `e2e/analista.spec.ts` e `tasks/prd-telas-da-coordenacao/4_task.md`. Não alterei nenhum arquivo.

Cenários exigidos: nenhum novo nesta rodada. Os da tarefa já estavam cobertos na 1ª e na 2ª. Falta conferir as duas recomendações que fiz na 2ª (nenhuma era bloqueante):
1. A espera de 20 s quando a aba aborta o pedido.
2. Registrar qual caminho o teste percorreu.

Cobertos:
- **Recomendação 2, aplicada.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/analista.spec.ts:288-290`, o `catch` do `fulfill` agora marca `entregaAbortada`. Na linha 323, o teste grava a anotação `resposta atrasada` com um de três valores: "chegou à aba", "a aba abortou o pedido ao sair" ou "sem anúncio no prazo". As asserções finais (linhas 326-330) não mudaram: a lista de vazamentos tem de vir vazia e a tela tem de mostrar o vazio com o botão ligado.
- **O observador agora procura o aviso só em `main` (linha 311).** O aviso está em `Analista.tsx:90`, dentro do miolo, e o próprio teste já o procura por `principal(page)` (linha 259). Por isso o alcance continua cobrindo o aviso. As três checagens passam a olhar a mesma área: o alerta já usava `main [role="alert"]` e o resumo é procurado pelo atributo `[data-resumo-do-analista]`. A detecção do vazamento não ficou mais fraca.
- **Recomendação 1, levada ao `TODO.md` com motivo.** A entrada "a espera de 20 s do recomeço" diz o que fazer, e a tabela "Recomendações sem aplicar" do `4_task.md` registra as duas linhas do test-engineer na 2ª.
- **O teste roda verde.** Rodei `npx playwright test e2e/analista.spec.ts -g "resposta que chega depois"` uma vez e passou nos projetos `chromebook` e `celular` (2 testes, 22,6 s).
- As seis entradas novas no `TODO.md` batem uma a uma com a tabela "Recomendações sem aplicar" da tarefa.

Bloqueantes: nenhum. O diff não traz `.skip`, teste comentado, mock da coisa nossa nem asserção afrouxada.

Recomendações:
1. Quando a anotação disser "sem anúncio no prazo", a resposta nem chegou à aba nem foi abortada, e o teste mesmo assim passa sem ter provado nada. Hoje esse caso só fica no relatório. Vale fazer esse caminho falhar, ou pelo menos avisar, junto da entrada do `TODO.md` sobre a espera de 20 s.
2. A tabela de revisões do `4_task.md` mostra o `revisor-geral` REPROVADO na 2ª rodada, e o diff desta rodada não mexe em nada fora do e2e. Quem cuida disso é a Mesa: confirmar se a correção que ele exigiu era só a troca de `document.body` por `main`, que já foi feita.

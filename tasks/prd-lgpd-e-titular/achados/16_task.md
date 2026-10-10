# Achados das revisões — `tasks/prd-lgpd-e-titular/16_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-10 12:09:29 · `tasks/prd-lgpd-e-titular/16_task.md`

**VEREDITO: REPROVADO**

Encontrei um bloqueante: a linha da mutação do fuso de São Paulo diz que um teste ficou vermelho, e ele não fica nesta máquina.

**Cenários exigidos:**
- **Caminho feliz:** registrar um pedido pela tela e conferir no banco o titular, o tipo, quem pediu, a chegada, o estado e quem registrou.
- **Bordas:**
  - dois alunos com o mesmo nome em turmas diferentes;
  - professor como titular, com a prévia sem contagem (D64);
  - titular já eliminado na lista ("Titular eliminado", "Não consta");
  - chegada no futuro e dia que não existe;
  - aluno sem turma no ano e conta desativada;
  - aluno que só está na lista da turma, que a aba avisa.
- **Busca:** mínimo de 3 letras, digitar não busca, `aria-live`, 429 com texto próprio, termo no corpo e nunca na URL.
- **Permissão:** a regra de quem não pode é da API, já coberta em 11.0 e 6.0; a tela não traz regra nova de permissão.
- **Isolamento:** a segunda coordenadora, de outra escola, na mesma aba do navegador.
- **Concorrência e recomeço:**
  - clique duplo;
  - a rede cai depois de o servidor registrar;
  - a resposta chega depois de cancelar;
  - a leitura atrasada da lista chega depois do registro.
- **Estados:** carregando, erro, vazio e com dado, página de 50 com "Ver mais", acessibilidade e sem rolagem de lado, nos projetos `chromebook` e `celular`.

**Cobertos:** todos os acima.
- O e2e está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/pedidos-do-titular.spec.ts`.
- As regras sem React estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.test.ts`.
- O que o clique fez é conferido no banco (`pedido_titular`), e não só na tela.
- A mesma chave no reenvio é provada com `rota.fetch()` seguido de `abort('internetdisconnected')`.
- O `gcTime: 0` da prévia é provado pela segunda abertura, que fica em "Consultando…" com a rota segurada.
- O `fecharSeAinda` é provado porque a busca aberta depois de cancelar sobrevive à resposta atrasada.
- O `await relerPedidosDoTitular` é provado porque o diálogo fica em "Registrando…" enquanto a lista não chega.
- A ordem pela chegada é provada pela primeira linha, que é a de ontem e não a de 50 dias atrás.
- Não há `.skip`, teste comentado, mock de coisa nossa nem chamada de IA.
- Conferi as outras linhas da seção "Mutações" contra o diff lendo o código, e todas apontam para uma asserção que falharia. Não rodei o e2e.

**Bloqueantes:**
1. `apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.test.ts:152-155` (`hojeEmSaoPaulo`). O teste só funciona num computador com outro fuso; esta máquina está em -03.
   - Tirei `timeZone: 'America/Sao_Paulo'` de `textos-dos-pedidos.ts:203`, rodei `npx vitest run` no arquivo, e as 17 asserções passaram. Sem o fuso, o `Intl` usa o fuso do computador, que aqui é o mesmo de São Paulo.
   - A linha da tabela "Mutações" (`16_task.md:105`) diz que o teste ficou vermelho, e não fica. A regra que ele protege é justamente o computador com o fuso errado.
   - Já desfiz a mutação: o arquivo está como antes e o teste segue verde.
   - **Correção exigida:** forçar no teste um fuso diferente do de São Paulo, por exemplo `Asia/Tokyo` ou `UTC`, com `vi.stubEnv('TZ', …)` ou `process.env.TZ` e restaurando no fim, para o resultado não depender do computador. Depois, rodar a mutação de novo nesta máquina e confirmar que fica vermelha.

**Recomendações:**
- `textos-dos-pedidos.ts:209-210`: o comentário diz que o id é "UUID v4", mas o esquema usa `uuidv7()` (`packages/nucleo/src/db/schema/pedido-titular.ts:46`) e a fixture do e2e também diz v7. É bom acertar o texto, porque a ordenação no cliente se justifica por ele.
- `RegistrarPedido.tsx:96`: nenhum teste usa o "Cancelar" de quando a pessoa já foi escolhida e o pedido está preenchido. "Cancelar em qualquer etapa" cobre duas das três etapas.
- O e2e do professor (`pedidos-do-titular.spec.ts:273`) usa um professor que nunca usou a IA, então "a mesma resposta para quem usou e para quem não usou" (D64) fica provado só no teste de integração da API (11.0). Na tela, só o desenho é provado.
- `linhas()` (`pedidos-do-titular.spec.ts:46`) aceita `tr` ou `li` nos dois projetos. Que esta tabela vira lista no celular depende do teste do componente em `privacidade.spec.ts`; dá para afirmar `li` no `celular` aqui também.
- O clique duplo (`:154`) daria um pedido só mesmo sem a trava do cliente, porque o servidor devolve o mesmo pedido para a mesma chave. O resultado, que é o que a regra pede, está provado; a trava do cliente, sozinha, não.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-10 12:11:29 · `tasks/prd-lgpd-e-titular/16_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As três divergências da tarefa estão escritas na `techspec.md` §9 ("Tarefa 16.0, como ficou no código"), no `cenarios.md` e no `docs/interface.md` 3.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.test.ts:151-156` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/16_task.md:105`
   - **O que está errado:** o bloqueante da 1ª rodada do `test-engineer` continua aberto.
     - O teste do `hojeEmSaoPaulo` está igual ao que ele reprovou. O arquivo é das 10:40 e o achado é das 12:09.
     - O `vitest.config.ts` não fixa o fuso.
     - Nesta máquina, que está em -03, tirar `timeZone: 'America/Sao_Paulo'` de `textos-dos-pedidos.ts:203` deixa o teste verde.
     - A linha 105 da tabela "Mutações" diz que esse teste fica vermelho, e isso é falso.
     - O resultado é que a regra do dia de São Paulo, a mesma pela qual a API recusa a chegada no futuro, não tem teste que a prove. O caso que ela protege é justamente o computador com fuso diferente (regra 40).
     - A tabela de revisões também mostra o `test-engineer` só com a rodada 1, REPROVADO. Ele ainda não aprovou.
   - **Correção exigida:**
     - Forçar no teste um fuso diferente do de São Paulo (`UTC` ou `Asia/Tokyo`, com `vi.stubEnv('TZ', …)` ou `process.env.TZ`) e restaurar o fuso original no fim.
     - Rodar de novo a mutação nesta máquina e confirmar que o teste fica vermelho.
     - Só então manter a linha 105 da tabela.
     - Depois, uma nova rodada do `test-engineer` com APROVADO.

Recomendações:
- `Pedidos.tsx:73`: o texto de apoio diz "O prazo de cada um aparece no detalhe.", mas o detalhe só chega na 17.0 e hoje a linha não abre nada. Dá para tirar a frase agora e devolvê-la com a 17.0, para a tela não prometer o que ainda não entrega.
- `operacao/pedidos-do-painel.ts:17`: o reexport mantém dois caminhos para o mesmo `sortearIdDoPedido`. É melhor `NovaRede.tsx` e `NovaEscola.tsx` importarem direto de `componentes/id-do-pedido`, e o reexport sair.
- `textos-dos-pedidos.ts:209`: o comentário diz que o id é "UUID v4", mas o `pedido_titular` usa `uuidv7()`, como o próprio `test-engineer` apontou. A ordenação no cliente se justifica por esse texto, então ele precisa estar certo.
- `textos-dos-pedidos.ts:148`: `ENTRADA_INVALIDA` sempre vira "o dia... não pode ser depois de hoje". Hoje o cliente valida antes e só a data cai aí, mas qualquer outra recusa do contrato vai mostrar esse mesmo texto. Um texto mais geral, que mande conferir os dados, cobre os dois casos.
- O que a foto mostra:
  - Na escola cheia (`coordenacao--coordenacao-privacidade-pedidos--computador.png`), a tela entrega o que o RF e a Tech Spec descrevem: "Titular eliminado" e "Não consta", a ordem pela chegada, a situação em texto e a faixa do aluno da lista.
  - No celular, a tabela vira lista.
  - Na escola vazia, o estado vazio aparece com o convite a registrar.
  - Não aparece nada que a tarefa não pediu.
  - O diálogo de confirmação não está nas fotos; revisei pelo código e pelo e2e.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-10 12:12:04 · `tasks/prd-lgpd-e-titular/16_task.md`

VEREDITO: APROVADO

Tela vista: sim (8 fotos lidas: lista e diálogo de busca, em 1366 px e 360 px, escola cheia e vazia). O diálogo de confirmação não é fotografável pelo comando; revisei-o pelo código (`RegistrarPedido.tsx:255-295`, `DialogoDeConfirmacao.tsx`) e pelo e2e (`e2e/pedidos-do-titular.spec.ts`). As fotos batem com o código da árvore. A faixa branca no pé do fundo escurecido na foto do celular é a captura de página inteira, com o fundo preso à janela, e não defeito da tela.

Estados: ok.
- Carregando: "Carregando os pedidos…" (`Pedidos.tsx:62`).
- Erro: `EstadoErro` com "Tentar de novo" (`Pedidos.tsx:64-66`). A falha de "Ver mais" fica abaixo da lista, que continua à vista.
- Vazio: "Nenhum pedido registrado", em tom de convite e dizendo o que a Turmma faz depois do registro (foto vazia).
- Com dado: tabela no computador e lista de cartões no celular, com a situação em texto e selo.
- No diálogo: "Buscando…", ninguém achado, falha da busca com texto próprio para o 429, e a prévia com "Consultando…", erro e "Tentar de novo".

Acessibilidade: ok.
- Todo campo tem rótulo e dica ligada por `aria-describedby`.
- O resultado da busca é anunciado por `role="status"` com `aria-live`, e a região existe antes do texto.
- Cada pessoa é um `radio` dentro de `fieldset` com `legend`.
- O foco inicial do diálogo de busca vai ao campo; o do de confirmação vai ao texto, e não ao botão que confirma.
- O foco volta ao "Registrar pedido" ao fechar.
- A situação do pedido é texto, não só cor.
- Os erros de campo vêm em português, com `noValidate`.
- O e2e roda `violacoesGraves` e `larguraExcedente` nos quatro estados.

Chromebook fraco: ok.
- A lista pagina de 50 em 50 com "Ver mais pedidos", e o `useMemo` evita reordenar a cada render.
- A busca só sai no Enter ou no botão, nunca a cada letra, o que poupa rede e o limite de 30 por minuto.
- O resultado e a prévia não ficam no cache (`gcTime: 0`).
- Não há imagem, e o `select` é o nativo. Não rodei throttling de CPU e de rede.

Celular: ok.
- Nas fotos de 360 px não há rolagem horizontal nem texto cortado.
- A tabela vira lista de cartões, e as quatro abas quebram em duas linhas sem esconder nenhuma.
- "Registrar pedido", "Buscar", "Cancelar" e "Ir para a Estrutura" têm 44 px; as abas e as linhas do radio têm 44 px (`min-h-11`), e o radio em si tem 24 px.
- Nada depende de hover ou atalho, e nenhum fluxo exige o celular.
- O e2e roda nos projetos `chromebook` e `celular`.

Ação oficial protegida: sim.
- A confirmação mostra pessoa, papel, turma, pedido, quem pediu, chegada, o efeito de cada tipo e a prévia do que a escola guarda.
- O botão fica desligado até a prévia ser lida (`RegistrarPedido.tsx:289`), e o aviso de homônimo mora na prévia.
- A eliminação usa a família `perigo`, com os 7 dias e o aviso do que a escola guarda fora do sistema.
- Cancelar tem o mesmo tamanho de confirmar (D59), a chave de envio é por diálogo, e o clique duplo é travado.
- O texto da faixa fixa, que manda o aluno da lista para a Estrutura, está na foto.

Bloqueantes: nenhum.

Recomendações (não bloqueiam; ficam para o `/validar` e o `/retro`):
1. **Ordem e "o mais recente primeiro".**
   - `textos-dos-pedidos.ts:212` e `Pedidos.tsx:60`: a ordem vale só entre as páginas já lidas, porque a API pagina por id. Numa escola com mais de 50 pedidos, o pedido recém-registrado pode cair na página que ainda não foi lida, e a tela anuncia "Pedido registrado" sem mostrá-lo.
   - A API deveria ordenar por chegada. É dívida declarada na seção de divergências, para a 17.0 ou uma correção da 11.0.
   - O comentário diz "UUID v4", mas o id é v7 (achado do `test-engineer`).
2. **Texto que aponta para uma tela que ainda não existe.** `Pedidos.tsx:73` diz "O prazo de cada um aparece no detalhe", e as linhas não abrem nada até a 17.0. A spec precisa pousar com a 17.0, ou o texto sai até lá.
3. **Orientação da falha de data.** `textos-dos-pedidos.ts:148` manda "Cancele, volte à busca…", mas Cancelar fecha tudo e a coordenação reabre "Registrar pedido" e busca de novo. Escrever "Cancele e registre de novo" evita a dúvida.
4. **Palavra "titular".** Está em "Pedidos dos titulares", "Registrar pedido de titular" e "Titular eliminado". É vocabulário da LGPD, está no glossário e a coordenação é quem responde por ela, então não bloqueia. Para a coordenadora que não é técnica, "Registrar pedido de uma pessoa" seria mais direto.
5. **Faixa fixa no celular.** Ocupa cerca de 170 px acima da lista, e na escola vazia empurra o convite para baixo. Dá para encurtar o texto e deixar o detalhe do caminho do aluno da lista só na busca vazia.
6. **Cancelar com o pedido já preenchido.** Do achado do `test-engineer`: nenhum teste usa o "Cancelar" de `RegistrarPedido.tsx:96`, quando a pessoa já foi escolhida e os campos estão preenchidos.

Arquivos revisados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/RegistrarPedido.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/pedidos-do-titular.spec.ts`

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-10 12:12:09 · `tasks/prd-lgpd-e-titular/16_task.md`

VEREDITO: REPROVADO

Campos pessoais tocados: nenhum campo novo no banco nem no contrato. A tarefa só mostra o que a API da 11.0 já entrega:
- na lista: nome do titular, turma, tipo, quem pediu, chegada e estado;
- na busca: nome, papel, turmas, matrícula, disciplinas do professor e estado da conta;
- na prévia: categorias, com contagem só para aluno.

Fora da tabela de dados do docs/lgpd.md: nenhum.

Autorização por objeto: ok. A escola vem do token. A tela não manda `escolaId`, e o id de titular de outra escola recebe a mesma resposta do inexistente, na API da 11.0. O e2e da "segunda pessoa na mesma aba, de outra escola" prova que a lista anterior não aparece nem enquanto a nova carrega. Os erros vêm do catálogo pelo código (`mensagemDoErro`, `textoDaFalha`) e nunca trazem a mensagem do servidor.

Logs: limpos. Não há `console`, telemetria nem `sendBeacon` nos arquivos novos. O termo da busca vai no corpo do `POST` e nunca na URL, e o e2e confere isso.

Auditoria: presente. A API grava `pedidos.listados`, `titular.buscado` (sem o termo) e `titular.previa_lida`, com finalidade. Mas a tela faz leituras auditadas que a coordenação não pediu. É o bloqueante abaixo.

Envio externo: nenhum.

Seed/fixture: sintético. Os nomes levam `marca()` aleatória e as fixtures do e2e (`criarPedidosDoTitularNoBanco`, `criarPedidoDeTitularEliminadoNoBanco`) são inventadas. As fotos mostram só "Aluno Sintético Caio 4cf0fe01", "Colégio sintético da vitrine", "Coordenadora sintética".

Fotos: conferem com o que o código promete.
- **Lista** (`coordenacao--coordenacao-privacidade-pedidos--computador.png` e `--celular.png`): nome e turma, sem matrícula; o eliminado aparece como "Titular eliminado / Não consta" (`Pedidos.tsx:32-33`).
- **Busca** (`...--Registrar-pedido--*.png` e as da escola vazia): só o campo. Nenhum dado de pessoa antes de buscar.

Bloqueantes:

1. **A lista auditada se relê sozinha quando a janela volta ao foco ou a rede volta.**
   - **Onde:** `apps/web/src/api/privacidade.ts:221-227`, `consultaPedidosDoTitular`, usada em `apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx:58`.
   - **O que está errado:** o comentário em `privacidade.ts:219` diz que a aba "relê ao abrir e não a cada foco da janela". O código não faz isso. O `QueryClient` (`apps/web/src/api/cliente-de-consultas.ts:20-28`) deixa o padrão `refetchOnWindowFocus: true` e `refetchOnReconnect: true`, com `staleTime` de 30 s, e nada no `apps/web` muda esse padrão.
   - **Efeito:** cada volta à aba depois de 30 s relê todas as páginas já carregadas. Cada página grava uma linha `pedidos.listados` em nome da coordenadora, com os ids dos titulares, sem ela ter pedido nada. A auditoria deixa de mostrar o acesso de verdade, e é ela que responde à secretaria "quem leu o quê". O projeto já tem a regra para leitura auditada da coordenação: em `apps/web/src/api/pedidos.ts:38-40`, nenhuma leitura sai sozinha, nem ao voltar para a aba.
   - **Correção exigida:**
     - Pôr `refetchOnWindowFocus: false` e `refetchOnReconnect: false` em `consultaPedidosDoTitular`, mantendo o `refetchOnMount: 'always'`.
     - Criar um teste que falhe sem essa linha. Pode ser um e2e em `e2e/pedidos-do-titular.spec.ts`: contar os `GET /v1/privacidade/pedidos`, avançar o relógio além do `staleTime`, disparar o foco ou o `visibilitychange` e provar que nenhuma leitura nova sai. Ou um teste de unidade com `QueryClient` e `focusManager.setFocused(true)` que conte as chamadas.
     - Registrar a linha no quadro de Mutações.

Recomendações:
- **A lista fica no cache depois de sair da aba.** `consultaPedidosDoTitular` usa o `gcTime` padrão, então nomes e turmas de titulares ficam até 5 minutos na memória da aba depois que a coordenadora sai. A troca de sessão já limpa isso (`resetQueries`). A lista das reivindicações faz o mesmo cuidado com `gcTime: 0` (`apps/web/src/api/pedidos.ts:43`). Vale alinhar, porque o computador da secretaria costuma ser compartilhado.
- **O comentário de `DialogoDeBusca` está mais forte que o código.** Em `RegistrarPedido.tsx:114-116` está escrito que nada "sobrevive ao fechar". Hoje isso vale pelo `gcTime: 0` do `useEnvioUnico` (`componentes/dialogos.tsx:28`). Vale citar essa dependência, ou cobri-la com um teste como o de `apps/web/src/api/acesso.test.ts:101-161`, para ninguém a tirar sem querer.

Pergunta de fechamento: para esta tarefa, o código responde. A tela registra os pedidos de acesso, portabilidade e compartilhamento, que a API da 11.0 em diante atende por código, com a lista de empresas que receberam dado. O que falta é corrigir o rastro da leitura (o bloqueante 1), para a auditoria mostrar só o acesso que a coordenação fez de fato.

## test-engineer · 2ª rodada · APROVADO · 2026-10-10 13:27:02 · `tasks/prd-lgpd-e-titular/16_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (rodada 2: o bloqueante da 1ª rodada mais os pedidos extras da Mesa):
- `hojeEmSaoPaulo` dá o dia de São Paulo mesmo com o computador em outro fuso.
- A lista dos pedidos não relê sozinha quando o foco volta nem quando a rede volta.
- A lista não fica no cache depois que a aba sai (`gcTime: 0`).
- Cada abertura da aba lê a lista de novo, agora sem o `refetchOnMount: 'always'`.
- "Cancelar" com a pessoa já escolhida e o pedido preenchido fecha tudo e não registra nada.
- A leitura atrasada da segunda página não vence a lista relida depois do registro.
- O texto novo do `ENTRADA_INVALIDA`.

**Cobertos:**
- **Correção 1, feita e provada nesta máquina (fuso -03).** O bloco força `TZ=Asia/Tokyo` e confere o deslocamento de -540 min, para o teste não passar com o fuso sem mudar. Tirei `timeZone: 'America/Sao_Paulo'` de `textos-dos-pedidos.ts:203` e o teste ficou vermelho: `expected '2026-10-10' to be '2026-10-09'`. Com o código restaurado, fica verde.
- **`apps/web/src/api/privacidade.test.ts`**, com uma mutação por cláusula, todas vermelhas:
  - `refetchOnWindowFocus: true` deu 2 chamadas onde se esperava 1.
  - `refetchOnReconnect: true` deu 2 chamadas onde se esperava 1.
  - `gcTime: 300_000` deixou a consulta no cache depois de a aba sair.
  - O controle com o foco ligado relê, o que mostra que o teste negativo não passa à toa.
- **`refetchOnMount: 'always'` removido.** A releitura ao abrir passou a vir do `gcTime: 0`, que tem prova na unidade e no fim do e2e "carregando, erro…". Depois de sair da aba e voltar, a lista tem 50 linhas, e não 51; com o cache guardado viriam as duas páginas.
- **E2E reescrito "a leitura atrasada da segunda página…".** Os nomes do eliminado e do pedido novo distinguem a leitura velha da nova. A suposição de ordem pelo id está certa: `pedido_titular.id` é `uuidv7()` (`packages/nucleo/src/db/schema/pedido-titular.ts:46`). Pelo raciocínio, se o `invalidateQueries` não cancelasse a leitura no ar, o `depois > 0` nunca seria cumprido e o teste ficaria vermelho.
- **"Cancelar" na terceira etapa:** o teste confere que o diálogo fechou, que não ficou alertdialog, que o foco voltou a "Registrar pedido" e que o banco tem zero pedidos.
- **Rodei os três e2e alterados nos dois projetos**, chromebook e celular: 8 de 8 verdes. Neles não fiz mutação, porque isso exigiria reconstruir a imagem da web.
- **As linhas de "Mutações" que mudaram de teste** (`isPending`, `pedidos.length === 0`, `pageParam`, `getNextPageParam`, `isFetchingNextPage`) apontam para testes que afirmam o que elas dizem.
- **Os dois arquivos mutados foram restaurados**, e o `git hash-object` de cada um confere com a árvore `cdda8a3`. Nenhum arquivo ficou alterado.

**Bloqueantes:** nenhum.

**Recomendações:**
- `apps/web/src/api/privacidade.test.ts:58-72`: `desinscrever()` e `cliente.unmount()` ficam depois da asserção. Quando um teste falha, o cliente dele continua montado e pega o foco do teste seguinte. Na mutação do foco, o controle falhou com 3 chamadas por causa disso, e não por erro dele. Basta mover a limpeza para o `afterEach` (ou um `try/finally`).
- `apps/web/src/api/privacidade.test.ts:22`: o teste negativo espera 20 ms de relógio real. Hoje basta, porque o TanStack dispara a releitura no mesmo instante do foco. Esperar a consulta ficar ociosa (`fetchStatus === 'idle'`) seria menos dependente do relógio.
- A regra 40 diz que o id "é v4", mas `pedido_titular` usa `uuidv7()`, e o comentário de `ordenarOsPedidos` foi corrigido para v7. Vale alinhar o texto da regra no `/retro`, para o próximo teste não supor o contrário.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/privacidade.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/privacidade.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/pedidos-do-titular.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/16_task.md`

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-10 13:28:52 · `tasks/prd-lgpd-e-titular/16_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A lista mostra à coordenação o nome e a turma do titular, o tipo do pedido, quem pediu e o dia em que chegou. Isso não mudou desde a 1ª rodada. Esta rodada mudou só a forma como a web guarda a lista e quando a relê.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. Esta rodada não mexeu na API. A lista continua presa à escola ativa, e a foto do titular eliminado mostra "Titular eliminado" e "Não consta", sem nenhum dado dele.

Logs: limpos. O diff não acrescenta nenhum log.

Auditoria: presente. Cada página lida continua gravando `pedidos.listados`, e agora nenhuma leitura sai sem a coordenadora pedir:
- **Correção exigida 1, feita.** `apps/web/src/api/privacidade.ts:82-83` tem `refetchOnWindowFocus: false` e `refetchOnReconnect: false` em `consultaPedidosDoTitular`. O teste está em `apps/web/src/api/privacidade.test.ts:54-73`: com `staleTime: 0`, ele tira e devolve o foco, desliga e religa a rede, e confere que houve só 1 `GET`. Tirar qualquer uma das duas linhas faz o teste falhar. O controle em `:75-91` prova que o foco ligado relê, então o teste não passa por acaso. As duas linhas estão no quadro de Mutações de `16_task.md`.
- **`gcTime: 0`, feito.** Está em `privacidade.ts:84` e é provado em `privacidade.test.ts:93-108`. Os nomes e as turmas saem da memória da aba quando a tela fecha.
- **Comentário do `DialogoDeBusca`, feito.** Está em `RegistrarPedido.tsx` e cita o `gcTime: 0` do `useEnvioUnico` (`componentes/dialogos.tsx`).
- **Ponto da Mesa, conferido.** O `refetchOnMount: 'always'` saiu de `Pedidos.tsx:59`, e isso está certo:
  - A lista é apagada da memória quando a aba sai, então cada abertura lê do zero, uma vez.
  - Com a aba aberta, os 30 s de `staleTime` do cliente evitam uma segunda leitura sem motivo.
  - A única outra releitura é a de `relerPedidosDoTitular` (`privacidade.ts:120`), que só roda quando a coordenadora registra um pedido.
  - O e2e confirma: o fim de "carregando, erro…" sai da aba, volta e vê de novo só a primeira página (50 linhas e "Ver mais pedidos"). O e2e reescrito, "a leitura atrasada da segunda página…", segura uma leitura no ar e prova que a resposta atrasada não vence a lista relida depois do registro.
- Não há outra tela usando `consultaPedidosDoTitular` (confirmado com grep), então nada mantém a lista viva fora da aba.

Envio externo: nenhum.

Seed/fixture: sintético. Os nomes no e2e saem de `marca()`, e as fotos mostram "Colégio sintético da vitrine", "Aluno Sintético Caio 4cf0fe01" e "Coordenadora sintética".

Fotos: conferi a da escola cheia no computador, a do celular com o diálogo "Registrar pedido" aberto e a da escola vazia no celular. Esta rodada mudou só um texto fixo da tela: "O prazo de cada um aparece no detalhe." saiu do cabeçalho (`Pedidos.tsx:74`). O texto novo do erro `ENTRADA_INVALIDA` (`textos-dos-pedidos.ts:148`) não traz nenhum dado de pessoa. As fotos não mostram matrícula, e o nome aparece só para a coordenação, que é o papel da tela.

Pergunta de fechamento: o código responde. Esta rodada não mexeu no caminho do pedido de acesso nem no registro de compartilhamento.

Bloqueantes: nenhum.

Recomendações:
1. A retentativa automática do cliente (`cliente-de-consultas.ts`, `deveTentarDeNovo`) ainda pode repetir a leitura da lista uma vez sozinha quando a API devolve `ERRO_INTERNO` ou `INDISPONIVEL_TENTE_DE_NOVO`. A primeira leitura falhou, então o risco é baixo. Mesmo assim, vale decidir no `/validar` se uma leitura auditada pode ter retentativa, ou pôr `retry: false` como em `consultaPedidosDaTurma`, se for esse o padrão de lá.
2. O teste de `refetchOnReconnect` não tem controle próprio, só o do foco. Um controle com `refetchOnReconnect: true` provaria que a volta da rede de fato relê nesse ambiente de teste.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/privacidade.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/privacidade.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/RegistrarPedido.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/pedidos-do-titular.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/cliente-de-consultas.ts

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-10 13:29:17 · `tasks/prd-lgpd-e-titular/16_task.md`

VEREDITO: APROVADO

Tela vista: sim (8 fotos lidas: aba Pedidos e diálogo de busca, computador e celular, escola cheia e vazia). O diálogo de confirmação não é fotografável pelo comando; revisei-o pelo código (`RegistrarPedido.tsx:256-296`) e pelo e2e.

Estados: ok.
- Carregando: `EstadoCarregando` "Carregando os pedidos…" (`Pedidos.tsx:61`).
- Erro: `EstadoErro` com "Tentar de novo" (`Pedidos.tsx:64`). A falha de "Ver mais pedidos" aparece com `role="alert"`, abaixo da lista já lida.
- Vazio: convite com o próximo passo ("Quando uma pessoa ou o responsável pedir acesso… registre aqui"). A foto vazia mostra o botão "Registrar pedido" logo acima.
- Com dado: tabela no computador e cartões no celular.
- Dentro do diálogo: "Buscando…", "Consultando o que a escola guarda desta pessoa…", prévia com "Tentar de novo" e botão de confirmar desligado enquanto a prévia não chega.

Acessibilidade: ok.
- A caixa de busca tem rótulo, dica e foco visível na foto.
- O resultado da busca é anunciado por `aria-live`, e o registro por `Anuncio`.
- A escolha da pessoa usa `fieldset` com `legend`; os radios têm 24 px dentro de rótulo de 44 px.
- O e2e mede violações graves de contraste e rótulo e a largura excedente nos dois projetos.
- O foco volta a "Registrar pedido" ao cancelar; essa asserção foi incluída nesta rodada.

Chromebook fraco: ok. A lista vem em páginas de 50 com "Ver mais pedidos", então não precisa de virtualização. Com `gcTime: 0`, nome e turma de titular não ficam na memória da aba. Foco e rede não disparam leitura nova, o que poupa a rede da escola e evita leitura auditada sem pedido da pessoa. Não há imagem nem upload nesta tela.

Celular: ok.
- 360 px sem rolagem horizontal nas quatro fotos.
- A tabela vira cartões com rótulo em cada linha.
- "Registrar pedido", "Ir para a Estrutura", "Buscar" e "Cancelar" ficam com cerca de 44 px; as abas têm `min-h-11`.
- Nada depende de hover ou atalho.
- A faixa de aviso ocupa cerca de 170 px no celular (já registrada pela 1ª rodada como recomendação).

Ação oficial protegida: sim. A confirmação mostra pessoa, papel, turma, pedido, quem pediu, dia de chegada, o efeito e a prévia do que a escola guarda, e só habilita com a prévia lida. A eliminação vai em `perigo`, com os 7 dias e o aviso do que a escola guarda fora do sistema. Cancelar fecha tudo em qualquer etapa.

Mudanças desta rodada, auditadas no diff:
- **`api/privacidade.ts:81-84`:** `refetchOnWindowFocus: false`, `refetchOnReconnect: false` e `gcTime: 0` estão corretos. O teste novo `api/privacidade.test.ts` prova os três, com o controle que relê quando o foco está ligado.
- **`Pedidos.tsx:155`:** o `refetchOnMount: 'always'` saiu e a abertura continua relendo, porque o cache não sobrevive à saída. O e2e prova isso no fim do caso "carregando, erro…", com o retorno à aba mostrando a primeira página e "Ver mais pedidos".
- **`gcTime: 0` do diálogo de busca:** vem do `useEnvioUnico` (`componentes/dialogos.tsx:28`), e o comentário novo diz isso com precisão.
- **Texto do `ENTRADA_INVALIDA`:** agora diz o que fazer ("cancele e registre o pedido de novo") e tem asserção no teste de textos.
- **"O prazo de cada um aparece no detalhe.":** saiu, e `Pedidos.tsx:74` já está sem a frase.
- **"Cancelar" da etapa com a pessoa escolhida:** coberto no e2e, em `e2e/pedidos-do-titular.spec.ts`.
- **Fuso do teste de `hojeEmSaoPaulo`:** forçado para Tóquio, com asserção do deslocamento de -540 min, então o teste não passa por coincidência.
- **Foto contra o código:** não há contradição. A foto não mostra o estado de retorno à aba, que só o e2e cobre.

Bloqueantes: nenhum.

Recomendações (nenhuma bloqueia; ficam para o `/validar` e o `/retro`):
1. **Ordem da lista com mais de 50 pedidos.** A API pagina por id e a tela ordena só entre as páginas lidas (`textos-dos-pedidos.ts`, `ordenarOsPedidos`). A frase de `docs/interface.md` ("a mais recente primeiro") só é verdadeira até 50 pedidos. Depois disso, o pedido recém-registrado cai numa página não lida e a pessoa só o vê em "Ver mais pedidos". O anúncio "Pedido registrado: …" mitiga, e a dívida está declarada nas divergências da tarefa com destino na 17.0 ou numa correção da 11.0. Convém decidir o dono antes da escola real.
2. **Faixa fixa do aluno da lista.** Ocupa cerca de 170 px no celular e empurra o convite na escola vazia. O texto é o do RF e do `cenarios.md`; encurtá-lo é decisão de texto.
3. **Reexport de `sortearIdDoPedido`.** Fica em `operacao/pedidos-do-painel.ts`; a limpeza é da próxima tarefa que tocar a operação.

Arquivos principais: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/privacidade.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/RegistrarPedido.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/privacidade.test.ts`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-10 13:29:21 · `tasks/prd-lgpd-e-titular/16_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

A correção exigida na rodada 1 foi feita. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.test.ts`, o bloco do `hojeEmSaoPaulo` força o fuso `Asia/Tokyo` com `vi.stubEnv` e o restaura com `vi.unstubAllEnvs`. Antes das asserções de dia, ele confere que o deslocamento ficou em `-540`. Conferi à parte no Node 22 desta máquina, na thread principal e num worker: com `TZ=Asia/Tokyo`, o `Intl.DateTimeFormat` sem `timeZone` devolve `2026-10-10` para `01:00Z`. Sem o `timeZone`, então, o teste fica vermelho, como diz a linha da tabela "Mutações" de `16_task.md`. O `test-engineer` aprovou esta rodada.

Duas mudanças não estavam na ordem. Conferi as duas e nenhuma bloqueia:
- **O `refetchOnMount: 'always'` saiu de `Pedidos.tsx:59`, quando a ordem pedia para mantê-lo.** O comportamento não muda. O `consultaPedidosDoTitular` é usado só ali, e cada aba renderiza no lugar da outra em `Privacidade.tsx`. Com `gcTime: 0`, sair da aba descarta a lista, e voltar faz uma leitura nova. O fim do e2e "carregando, erro com 'Tentar de novo'…" prova isso. A `techspec.md` §9 foi atualizada no mesmo diff, então a mudança não foi decidida em silêncio.
- **O e2e da leitura atrasada foi reescrito para a segunda página.** Com `gcTime: 0`, sair da aba descarta a consulta, e a versão antiga do teste deixou de funcionar. O caso novo continua provando a regra. A segunda página pedida antes do registro é cancelada pelo `invalidateQueries`, e a resposta atrasada não altera a lista relida. Se a leitura não fosse cancelada, a lista ficaria com 51 linhas e o `toHaveCount(50)` falharia.

Recomendações:
- **O e2e agora fixa a ordem errada da lista.** Com mais de 50 pedidos, o pedido recém-registrado não aparece na primeira página, só depois de "Ver mais pedidos" (`e2e/pedidos-do-titular.spec.ts:349-352`). A primeira página mostra os 50 mais antigos. A dívida está declarada: na `techspec.md` §9 ela aparece só como "ordena pelas páginas já lidas", e em `16_task.md` está em "Recomendações sem aplicar". Ela precisa ter dono antes do `/validar`, seja na 17.0, seja numa correção da 11.0 com a API ordenando pela data de chegada. Quando isso for corrigido, este e2e muda junto.
- **`cenarios.md:445` descreve o teste antigo.** O texto diz "a leitura da lista que chega depois do registro não o apaga", mas o teste agora trata da segunda página atrasada. Vale alinhar o texto ao nome novo do teste: "a leitura atrasada da segunda página… não vence a lista lida depois dele".
- **O controle de `api/privacidade.test.ts` cobre só o foco, não a volta da rede.** O caso principal já pega a falta do `refetchOnReconnect: false`, porque com ela haveria duas chamadas. Um controle para a rede, no mesmo molde do controle do foco, deixaria isso explícito.

As fotos estão de acordo com o código. A frase "O prazo de cada um aparece no detalhe." saiu do texto de apoio. A aba traz o vazio com o convite, o diálogo de busca e a lista com "Titular eliminado" e os selos. A tela não entrega nada além do que a 16.0 pede.

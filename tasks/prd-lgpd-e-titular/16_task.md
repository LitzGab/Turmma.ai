# Tarefa 16.0 — A coordenação registra um pedido pela tela

**Funcionalidade:** lgpd-e-titular · **Depende de:** 6.0, 11.0 · **Paralelo com:** 15.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A aba Pedidos lista os pedidos e registra um novo: busca por envio, prévia, confirmação com aviso de homônimo e família `perigo` na eliminação.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 9 ("Pedidos")
- `.claude/rules/50-frontend.md`
- Código: diálogos da A1, `rl:busca-titular`
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 16.1 — Lista com nome e turma, "Titular eliminado"
- [x] 16.2 — Busca por Enter ou botão, `aria-live`, 429 e mínimo de 3 letras
- [x] 16.3 — Diálogo de registro com prévia; `chaveEnvio` por diálogo
- [x] 16.4 — Aviso do aluno da lista
- [x] 16.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| aba Pedidos e diálogo de registro | novo |
| consultas | novo |
| e2e | novo |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| homônimos | e2e | escolhe o certo pela turma; o diálogo avisa; eliminação em `perigo` |
| busca | e2e | `aria-live`; 429 com texto; mínimo de 3 letras no campo |
| aviso da lista | e2e | aponta para a lista da turma |
| recomeço | e2e | rede cai no `POST` e o reenvio leva a mesma chave; segunda pessoa na aba; resposta atrasada segurada |
| estados | e2e | quatro estados; lista abaixo de 768 px; `chromebook` e `celular`, acessibilidade |

## Como testar

- **estados e lista abaixo de 768 px:** `e2e/governanca.spec.ts › os quatro estados…`; a tabela que vira lista já é provada em `e2e/privacidade.spec.ts` (`linhaDa`: `tr` no chromebook, `li` no celular).
- **homônimos e diálogo:** `e2e/pedidos.spec.ts › o 41º pedido não é marcável…` (dois cliques mandam um pedido só) e `› sem rolagem horizontal, também no diálogo…`.
- **busca:** o 429 com texto em `e2e/casca.spec.ts › erro: a mensagem vem do catálogo pelo código…` (a função local `falharCom`).
- **recomeço:** a mesma chave em `e2e/turma-publica.spec.ts › o 503 reenvia a mesma chave até 3 vezes…` (`postDataJSON`); a rede cai com `rota.abort('internetdisconnected')`, nunca `context.setOffline` (`e2e/entrar.spec.ts`); segunda pessoa e resposta atrasada em `e2e/pedidos.spec.ts › resposta atrasada: a atualização que chega depois da decisão…`.
- Titulares: `criarAlunoComMatricula` e `colocarAlunoNaTurma` (`e2e/__fixtures__/sessao.ts`).
- Rodar: `node tools/ci/e2e.ts --manter-ambiente e2e/<arquivo>.spec.ts`.
- **Telas** (`coordenacao`, sem mockup): a aba, em `/coordenacao/privacidade/<id da aba nova>`; a busca, com `--clicar 'text=Registrar pedido'`. O diálogo de confirmação pede busca digitada, que a foto não faz: diga isso em "Telas vistas". A vitrine não tem pedido: a lista sai vazia nas duas escolas, até um ser registrado na cheia, pela tela.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --e2e)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O detalhe do pedido (17.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| A aba que a Privacidade abre passa a ser **Pedidos** (`ABA_INICIAL_DA_PRIVACIDADE = 'pedidos'`), e não a retenção; `e2e/privacidade.spec.ts` abre a retenção pela aba, e o teste das empresas ganhou `test.setTimeout(90_000)`: a entrada passa pela aba dos pedidos e o teste, que levava 30 s no celular, passou do teto de 30 s | A Tech Spec lista Pedidos primeiro, e é o que a coordenação vai fazer na Privacidade; o endereço sem aba cai na primeira aba, e a ordem antiga a deixaria na leitura | `techspec.md` §9, "Tarefa 16.0, como ficou no código"; `docs/interface.md` 3 (item Privacidade) |
| A lista **ordena no cliente**, pela chegada mais recente e pelo id no empate, entre as páginas já lidas; a API pagina por id (uuid) | A ordem do id não é ordem para quem lê, e a API (11.0) não ordena por chegada; mexer na API seria outra tarefa | `techspec.md` §9, "Tarefa 16.0, como ficou no código" |
| `sortearIdDoPedido` mudou de `operacao/pedidos-do-painel.ts` para `componentes/id-do-pedido.ts`, com reexport no lugar antigo | A tela da escola importaria o chunk da operação (`nome-dos-chunks.test.ts`, regra B2); a chave de envio do pedido do titular usa o mesmo sorteio | `techspec.md` §9, "Tarefa 16.0, como ficou no código" |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `textos-dos-pedidos.ts` › `textoDasTurmas` › `turmas.length === 0 ? TEXTO_SEM_TURMA : …` | `textos-dos-pedidos.test.ts` › textoDasTurmas › junta as turmas e diz quando não há nenhuma |
| `textos-dos-pedidos.ts` › `descricaoDoAchado` › `achado.papel === 'professor' (termo)` | `textos-dos-pedidos.test.ts` › descricaoDoAchado › as disciplinas são do professor: o aluno não as mostra… |
| `textos-dos-pedidos.ts` › `descricaoDoAchado` › `achado.disciplinas.length > 0 (termo)` | `textos-dos-pedidos.test.ts` › descricaoDoAchado › as disciplinas são do professor… o professor sem disciplina não deixa um vazio |
| `textos-dos-pedidos.ts` › `descricaoDoAchado` › `achado.matricula !== null` | `textos-dos-pedidos.test.ts` › descricaoDoAchado › do professor diz as disciplinas e as turmas, e nunca matrícula… |
| `textos-dos-pedidos.ts` › `descricaoDoAchado` › `achado.estado === 'desativado'` | `textos-dos-pedidos.test.ts` › descricaoDoAchado › do professor diz as disciplinas e as turmas… conta desativada vem dita |
| `textos-dos-pedidos.ts` › `anuncioDaBusca` › `quantidade === 0` | `textos-dos-pedidos.test.ts` › anuncioDaBusca › diz nenhuma, uma ou quantas, no singular e no plural |
| `textos-dos-pedidos.ts` › `anuncioDaBusca` › `quantidade === 1 ? … : …` | `textos-dos-pedidos.test.ts` › anuncioDaBusca › diz nenhuma, uma ou quantas, no singular e no plural |
| `textos-dos-pedidos.ts` › `termoDaBusca` › `termo.length >= MINIMO_DE_LETRAS_DO_TERMO` | `textos-dos-pedidos.test.ts` › termoDaBusca › corta o espaço das pontas antes de contar, como a API |
| `textos-dos-pedidos.ts` › `termoDaBusca` › `digitado.trim()` | `textos-dos-pedidos.test.ts` › termoDaBusca › corta o espaço das pontas antes de contar, como a API |
| `textos-dos-pedidos.ts` › `validarOPedido` › `ehDiaDoCalendario(escolhas.chegouEm) (termo)` | `textos-dos-pedidos.test.ts` › validarOPedido › diz o texto de cada campo que falta, e só dele |
| `textos-dos-pedidos.ts` › `validarOPedido` › `escolhas.chegouEm <= hoje (termo; `<` também)` | `textos-dos-pedidos.test.ts` › validarOPedido › recusa a chegada depois de hoje… / aceita o pedido inteiro, inclusive chegado hoje |
| `textos-dos-pedidos.ts` › `ehDiaDoCalendario` › `!Number.isNaN(data.getTime())` | `textos-dos-pedidos.test.ts` › validarOPedido › recusa a chegada depois de hoje, como a API, e o dia que não existe |
| `textos-dos-pedidos.ts` › `ehDiaDoCalendario` › `data.toISOString().slice(0, 10) === texto` | `textos-dos-pedidos.test.ts` › validarOPedido › recusa a chegada depois de hoje, como a API, e o dia que não existe |
| `textos-dos-pedidos.ts` › `validarOPedido` › `tipo === undefined → erros.tipo` | `textos-dos-pedidos.test.ts` › validarOPedido › diz o texto de cada campo que falta, e só dele |
| `textos-dos-pedidos.ts` › `validarOPedido` › `solicitante === undefined → erros.solicitante` | `textos-dos-pedidos.test.ts` › validarOPedido › diz o texto de cada campo que falta, e só dele |
| `textos-dos-pedidos.ts` › `validarOPedido` › `!diaValido → erros.chegouEm` | `textos-dos-pedidos.test.ts` › validarOPedido › diz o texto de cada campo que falta, e só dele |
| `textos-dos-pedidos.ts` › `validarOPedido` › `tipo === undefined || solicitante === undefined || !diaValido → return (cada um dos três termos)` | `textos-dos-pedidos.test.ts` › validarOPedido › diz o texto de cada campo que falta, e só dele (um caso só com o tipo, um só com quem pediu e um só com o dia) |
| `textos-dos-pedidos.ts` › `hojeEmSaoPaulo` › `timeZone: 'America/Sao_Paulo'` | `textos-dos-pedidos.test.ts` › hojeEmSaoPaulo › à 1h de UTC ainda é o dia anterior em São Paulo…, com o computador em outro fuso (o bloco força `TZ=Asia/Tokyo` e confere o deslocamento de -540 min; sem o `timeZone`, o dia sai `2026-10-10` em vez de `2026-10-09`, visto vermelho em uma máquina em -03:00) |
| `textos-dos-pedidos.ts` › `ordenarOsPedidos` › `a.chegouEm === b.chegouEm ? a.id.localeCompare(b.id) : …` | `textos-dos-pedidos.test.ts` › ordenarOsPedidos › ordena por chegada decrescente, desempata por id e não muda a lista que recebeu |
| `textos-dos-pedidos.ts` › `ordenarOsPedidos` › `a.chegouEm < b.chegouEm ? 1 : -1` | `textos-dos-pedidos.test.ts` › ordenarOsPedidos › ordena por chegada decrescente… |
| `RegistrarPedido.tsx` › `DialogoDeBusca › buscar` › `!conferido.ok → return` | `pedidos-do-titular.spec.ts` › só sai com 3 letras e no Enter… |
| `RegistrarPedido.tsx` › `DialogoDeBusca › buscar` › `definirErroDoTermo(conferido.erro)` | `pedidos-do-titular.spec.ts` › só sai com 3 letras e no Enter… |
| `RegistrarPedido.tsx` › `DialogoDeBusca` › `mutacao.isPending ? 'Buscando…' : … (região viva)` | `pedidos-do-titular.spec.ts` › só sai com 3 letras e no Enter… |
| `RegistrarPedido.tsx` › `DialogoDeBusca` › `disabled={mutacao.isPending} no Buscar` | `pedidos-do-titular.spec.ts` › só sai com 3 letras e no Enter… |
| `RegistrarPedido.tsx` › `DialogoDeBusca` › `{mutacao.isPending ? 'Buscando…' : 'Buscar'}` | `pedidos-do-titular.spec.ts` › só sai com 3 letras e no Enter… |
| `RegistrarPedido.tsx` › `DialogoDeBusca` › `mutacao.isError && <AlertaDaFalha>` | `pedidos-do-titular.spec.ts` › só sai com 3 letras e no Enter… |
| `RegistrarPedido.tsx` › `DialogoDeBusca` › `achados?.length === 0 && <p>` | `pedidos-do-titular.spec.ts` › só sai com 3 letras e no Enter… |
| `RegistrarPedido.tsx` › `DialogoDeBusca` › `achados !== undefined && achados.length > 0 && (fieldset "Escolha a pessoa")` | `pedidos-do-titular.spec.ts` › só sai com 3 letras e no Enter… |
| `RegistrarPedido.tsx` › `DialogoDeBusca` › `titular === undefined ? <Cancelar> : <PedidoDaPessoa>` | `pedidos-do-titular.spec.ts` › um pedido que não é eliminação confirma na decisão oficial… |
| `RegistrarPedido.tsx` › `DialogoDeBusca` › `<PedidoDaPessoa key={titular.id}>` | `pedidos-do-titular.spec.ts` › dois alunos com o mesmo nome: escolhe o certo pela turma… |
| `RegistrarPedido.tsx` › `PedidoDaPessoa › continuar` › `!validacao.ok → definirErros` | `pedidos-do-titular.spec.ts` › um pedido que não é eliminação confirma na decisão oficial… |
| `RegistrarPedido.tsx` › `PedidoDaPessoa` › `max={hojeEmSaoPaulo()}` | `pedidos-do-titular.spec.ts` › um pedido que não é eliminação confirma na decisão oficial… |
| `RegistrarPedido.tsx` › `Previa` › `consulta.isPending → "Consultando…"` | `pedidos-do-titular.spec.ts` › o professor aparece na busca e a prévia dele não traz contagem… |
| `RegistrarPedido.tsx` › `Previa` › `consulta.isError → alerta e "Tentar de novo"` | `pedidos-do-titular.spec.ts` › a prévia que falha impede confirmar até ser lida… |
| `RegistrarPedido.tsx` › `Previa` › `previa.categorias.length === 0 && TEXTO_DA_PREVIA_SEM_DADO` | `pedidos-do-titular.spec.ts` › a prévia que falha impede confirmar até ser lida… |
| `RegistrarPedido.tsx` › `Previa` › `previa.papel === 'aluno' ? contagem : só o rótulo` | `pedidos-do-titular.spec.ts` › o professor aparece na busca e a prévia dele não traz contagem… |
| `RegistrarPedido.tsx` › `DialogoDoRegistro` › `previa.data?.homonimo === true ? TEXTO_DO_HOMONIMO` | `pedidos-do-titular.spec.ts` › dois alunos com o mesmo nome: escolhe o certo pela turma… |
| `RegistrarPedido.tsx` › `DialogoDoRegistro` › `eliminacao ? AVISO_DA_ELIMINACAO` | `pedidos-do-titular.spec.ts` › dois alunos com o mesmo nome: escolhe o certo pela turma… |
| `RegistrarPedido.tsx` › `DialogoDoRegistro` › `familia={eliminacao ? 'perigo' : 'oficial'}` | `pedidos-do-titular.spec.ts` › dois alunos com o mesmo nome: escolhe o certo pela turma… |
| `RegistrarPedido.tsx` › `DialogoDoRegistro` › `eliminacao ? 'Registrar a eliminação' : 'Registrar pedido'` | `pedidos-do-titular.spec.ts` › dois alunos com o mesmo nome: escolhe o certo pela turma… |
| `RegistrarPedido.tsx` › `DialogoDoRegistro` › `aviso === '' ? {} : { aviso }` | `pedidos-do-titular.spec.ts` › um pedido que não é eliminação confirma na decisão oficial… |
| `RegistrarPedido.tsx` › `DialogoDoRegistro` › `titular.papel === 'aluno' ? 'Turma' : 'Turmas'` | `pedidos-do-titular.spec.ts` › dois alunos com o mesmo nome: escolhe o certo pela turma… (a de aluno) e `pedidos-do-titular.spec.ts` › o professor aparece na busca e a prévia dele não traz contagem… (a de professor) |
| `RegistrarPedido.tsx` › `DialogoDoRegistro` › `impedido={previa.data === undefined}` | `pedidos-do-titular.spec.ts` › a prévia que falha impede confirmar até ser lida… |
| `RegistrarPedido.tsx` › `DialogoDoRegistro` › `mutacao.isError ? { falha: textoDaFalha(…) }` | `pedidos-do-titular.spec.ts` › a rede cai depois de o servidor registrar… |
| `RegistrarPedido.tsx` › `DialogoDoRegistro` › `confirmando={mutacao.isPending}` | `pedidos-do-titular.spec.ts` › a leitura atrasada da segunda página, que chega depois do registro, não vence a lista lida depois dele |
| `RegistrarPedido.tsx` › `DialogoDoRegistro › mutationFn` › `await relerPedidosDoTitular(cliente)` | `pedidos-do-titular.spec.ts` › a leitura atrasada da segunda página, que chega depois do registro, não vence a lista lida depois dele |
| `RegistrarPedido.tsx` › `DialogoDoRegistro › mutationFn` › `relerPedidosDoTitular(cliente) (a chamada inteira)` | `pedidos-do-titular.spec.ts` › dois alunos com o mesmo nome: escolhe o certo pela turma… |
| `RegistrarPedido.tsx` › `DialogoDoRegistro › onSuccess` › `aoRegistrado(…) com o texto 'Pedido registrado: <tipo>, de <nome>.'` | `pedidos-do-titular.spec.ts` › dois alunos com o mesmo nome: escolhe o certo pela turma… |
| `RegistrarPedido.tsx` › `RegistrarPedido` › `janela.fecharSeAinda(aberta) (e não fechar())` | `pedidos-do-titular.spec.ts` › a resposta do registro que chega depois de cancelar… |
| `RegistrarPedido.tsx` › `RegistrarPedido` › `aberta?.alvo !== undefined && <DialogoDoRegistro>` | `pedidos-do-titular.spec.ts` › o professor aparece na busca e a prévia dele não traz contagem… |
| `Pedidos.tsx` › `Pedidos` › `consulta.isPending → "Carregando os pedidos…"` | `pedidos-do-titular.spec.ts` › a segunda pessoa na mesma aba, de outra escola, não vê os pedidos da anterior… |
| `Pedidos.tsx` › `Pedidos` › `consulta.data === undefined → EstadoErro` | `pedidos-do-titular.spec.ts` › carregando, erro com "Tentar de novo", vazio e com dado… |
| `Pedidos.tsx` › `Pedidos` › `pedidos.length === 0 ? <EstadoVazio> : <Tabela>` | `pedidos-do-titular.spec.ts` › a segunda pessoa na mesma aba, de outra escola, não vê os pedidos da anterior… |
| `Pedidos.tsx` › `Pedidos` › `consulta.isFetchNextPageError && alerta` | `pedidos-do-titular.spec.ts` › carregando, erro com "Tentar de novo", vazio e com dado… |
| `Pedidos.tsx` › `Pedidos` › `consulta.hasNextPage && "Ver mais pedidos" (`false` e `true`)` | `pedidos-do-titular.spec.ts` › carregando, erro com "Tentar de novo", vazio e com dado… |
| `Pedidos.tsx` › `Pedidos` › `consulta.isFetchingNextPage ? 'Carregando…' : 'Ver mais pedidos'` | `pedidos-do-titular.spec.ts` › a leitura atrasada da segunda página, que chega depois do registro, não vence a lista lida depois dele |
| `Pedidos.tsx` › `Pedidos` › `disabled={consulta.isFetchingNextPage}` | `pedidos-do-titular.spec.ts` › a leitura atrasada da segunda página, que chega depois do registro, não vence a lista lida depois dele |
| `Pedidos.tsx` › `Pedidos` › `ordenarOsPedidos(…) no useMemo` | `pedidos-do-titular.spec.ts` › carregando, erro com "Tentar de novo", vazio e com dado… |
| `Pedidos.tsx` › `COLUNAS_DOS_PEDIDOS` › `pedido.titular?.nome ?? TEXTO_DO_TITULAR_ELIMINADO` | `pedidos-do-titular.spec.ts` › carregando, erro com "Tentar de novo", vazio e com dado… |
| `Pedidos.tsx` › `COLUNAS_DOS_PEDIDOS` › `pedido.titular === null ? "Não consta" : textoDasTurmas(…)` | `pedidos-do-titular.spec.ts` › carregando, erro com "Tentar de novo", vazio e com dado… |
| `Pedidos.tsx` › `COLUNAS_DOS_PEDIDOS` › `formatarData(pedido.chegouEm)` | `pedidos-do-titular.spec.ts` › carregando, erro com "Tentar de novo", vazio e com dado… |
| `api/privacidade.ts` › `consultaPedidosDoTitular › queryFn` › `pageParam === undefined ? CAMINHO : `${CAMINHO}?pagina=…`` | `pedidos-do-titular.spec.ts` › a leitura atrasada da segunda página, que chega depois do registro, não vence a lista lida depois dele |
| `api/privacidade.ts` › `consultaPedidosDoTitular` › `getNextPageParam: (ultima) => ultima.proxima` | `pedidos-do-titular.spec.ts` › a leitura atrasada da segunda página, que chega depois do registro, não vence a lista lida depois dele |
| `api/privacidade.ts` › `consultaPreviaDoTitular` › `gcTime: 0` | `pedidos-do-titular.spec.ts` › a rede cai depois de o servidor registrar… |
| `api/privacidade.ts` › `buscarTitulares` › `corpo: { termo }` | `pedidos-do-titular.spec.ts` › só sai com 3 letras e no Enter… |
| `Privacidade.tsx` › `Privacidade` › `aba === 'retencao' ? <Retencao /> : <Pedidos />` | `pedidos-do-titular.spec.ts` › o professor aparece na busca e a prévia dele não traz contagem… |
| `Privacidade.tsx` › `ABAS_DA_PRIVACIDADE` › `{ id: 'pedidos', … } na lista` | `privacidade.spec.ts` › o endereço sem aba, e um endereço com aba que não existe, abrem a aba dos pedidos |
| `caminhos.ts` › `ABA_INICIAL_DA_PRIVACIDADE` › `= 'pedidos'` | `privacidade.spec.ts` › a troca de escola não mostra a retenção da escola anterior… |
| `textos-dos-pedidos.ts` › `TEXTOS_DA_FALHA_DO_REGISTRO` › `[ENTRADA_INVALIDA]` (o texto manda cancelar e registrar de novo) | `textos-dos-pedidos.test.ts` › os textos de falha › a indisponibilidade do registro diz que o pedido não será registrado duas vezes (com a linha do `ENTRADA_INVALIDA`) |
| `api/privacidade.ts` › `consultaPedidosDoTitular` › `refetchOnWindowFocus: false` | `api/privacidade.test.ts` › a lista dos pedidos não relê ao voltar o foco nem ao voltar a rede; e o controle, que relê com o foco ligado |
| `api/privacidade.ts` › `consultaPedidosDoTitular` › `refetchOnReconnect: false` | `api/privacidade.test.ts` › a lista dos pedidos não relê ao voltar o foco nem ao voltar a rede |
| `api/privacidade.ts` › `consultaPedidosDoTitular` › `gcTime: 0` | `api/privacidade.test.ts` › a lista dos pedidos não fica no cache depois que a aba sai; e `pedidos-do-titular.spec.ts` › carregando, erro com "Tentar de novo", vazio e com dado… (o fim do teste: sair da aba e voltar lê a primeira página de novo) |
| `RegistrarPedido.tsx` › `PedidoDaPessoa` › `<Botao variante="secundario" onClick={aoFechar}>Cancelar` | `pedidos-do-titular.spec.ts` › um pedido que não é eliminação confirma na decisão oficial… (o fim do teste, nos dois projetos) |
| `api/privacidade.ts` › `relerPedidosDoTitular` › `cliente.invalidateQueries({ queryKey })` (cancela a leitura que estava no ar) | `pedidos-do-titular.spec.ts` › a leitura atrasada da segunda página, que chega depois do registro, não vence a lista lida depois dele |
| `id-do-pedido.ts` › `sortearIdDoPedido` › o sorteio inteiro | **movido sem mudar** de `operacao/pedidos-do-painel.ts`: o teste dele (`pedidos-do-painel.test.ts`) continua verde pelo reexport, e a `chaveEnvio` do pedido do titular o usa em `pedidos-do-titular.spec.ts` › a rede cai depois de o servidor registrar |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | O e2e do professor usa professor que nunca usou a IA; "a mesma resposta para quem usou e para quem não usou" (D64) fica provado só na integração da API | Recusada: a regra é da API e já tem teste de integração na 11.0; a tela só desenha o que a API devolve, e o e2e prova esse desenho |
| test-engineer (1ª) | `linhas()` do e2e aceita `tr` ou `li` nos dois projetos; afirmar `li` no `celular` | Recusada: `tr` no chromebook e `li` no celular já são provados em `e2e/privacidade.spec.ts` (`linhaDa`), como diz o "Como testar" da tarefa; duplicar mudaria o auxiliar usado em seis pontos |
| test-engineer (1ª) | O clique duplo daria um pedido só mesmo sem a trava do cliente, porque o servidor devolve o mesmo pedido para a mesma chave | Recusada: o servidor idempotente é a garantia (regra 80, item 7), e o resultado que a regra pede (um pedido só no banco, para dois cliques) está provado no e2e; a trava do cliente (`useEnvioUnico`) é conforto e não tem teste de unidade próprio, o que fica como está |
| revisor-geral (1ª) | Retirar o reexport de `sortearIdDoPedido` em `operacao/pedidos-do-painel.ts` e fazer `NovaRede.tsx`, `NovaEscola.tsx` e o teste do painel importarem de `componentes/id-do-pedido` | Não aplicada: mexe em três arquivos da operação fora desta tarefa, e o reexport está escrito como divergência resolvida na `techspec.md` §9; destino: a próxima tarefa que tocar `operacao/pedidos-do-painel.ts`, ou `/retro` |
| frontend-reviewer (1ª) | A ordenação vale só entre as páginas já lidas: com mais de 50 pedidos, o recém-registrado pode cair numa página ainda não lida | Dívida declarada nas divergências da tarefa: a API devia ordenar por chegada; destino: tarefa 17.0 ou correção da 11.0, a decidir pelo Orquestrador; vai para `/validar` |
| frontend-reviewer (1ª) | A frase "O prazo de cada um aparece no detalhe." sai agora (item 5) | Destino: tarefa 17.0 devolve a frase em `Pedidos.tsx` quando a linha abrir o detalhe |
| frontend-reviewer (1ª) | Trocar "titular" por "uma pessoa" nos textos ("Pedidos dos titulares", "Registrar pedido de titular", "Titular eliminado") | Recusada: "titular" é o termo da LGPD e está no glossário (regra 60, item 1), e a coordenação responde por ele; "Titular eliminado" é texto do `cenarios.md` |
| frontend-reviewer (1ª) | A faixa fixa do aluno da lista ocupa cerca de 170 px no celular e empurra o convite na escola vazia | Não aplicada: o texto é o do RF e do `cenarios.md` (cenário "aviso da lista"), e encurtá-lo é decisão de texto, não de código; destino: `/validar` olha com as fotos |
| test-engineer (2ª) | `api/privacidade.test.ts`: `desinscrever()` e `cliente.unmount()` ficam depois da asserção; se um caso falha, o cliente dele continua montado e pega o foco do seguinte | Não aplicada: higiene de teste que só atua quando outro já falhou, e mexer no arquivo de teste caduca `test-engineer` e `revisor-geral`; destino: a próxima tarefa que tocar `api/privacidade.test.ts` (mover a limpeza para o `afterEach`) |
| test-engineer (2ª) | `api/privacidade.test.ts:22`: o caso negativo espera 20 ms de relógio real; esperar a consulta ficar ociosa (`fetchStatus === 'idle'`) dependeria menos do relógio | Não aplicada, mesmo motivo; destino: a mesma tarefa futura |
| test-engineer (2ª) | A regra 40 diz que o id "é v4", e `pedido_titular` usa `uuidv7()` | Destino: `/retro` desta funcionalidade (texto da regra 40) |
| privacy-guardian (2ª) | A retentativa automática do cliente (`deveTentarDeNovo`) ainda pode repetir uma vez a leitura auditada da lista quando a API devolve `ERRO_INTERNO` ou `INDISPONIVEL_TENTE_DE_NOVO` | Não aplicada (a primeira leitura falhou, o risco é baixo e o padrão de `consultaPedidosDaTurma` não foi conferido); destino: `/validar` decide se leitura auditada tem retentativa, com `retry: false` na consulta se for o caso |
| privacy-guardian (2ª), revisor-geral (2ª) | O teste de `refetchOnReconnect` não tem controle próprio, só o do foco | Não aplicada, mesmo motivo do arquivo de teste; o caso principal já fica vermelho sem `refetchOnReconnect: false` (o `test-engineer` mutou e confirmou); destino: a mesma tarefa futura que tocar `api/privacidade.test.ts` |
| revisor-geral (2ª), frontend-reviewer (2ª) | Com mais de 50 pedidos a primeira página mostra os 50 mais antigos, o pedido recém-registrado só aparece em "Ver mais pedidos", e o e2e passou a fixar isso; `docs/interface.md` diz "o mais recente primeiro", que só vale até 50 | A dívida declarada nas divergências da tarefa, **sem dono ainda**: a API devia ordenar por chegada (tarefa 17.0 ou correção da 11.0). O Orquestrador decide o dono **antes do `/validar`**; quando a API ordenar, o e2e "a leitura atrasada da segunda página…" muda junto |
| revisor-geral (2ª) | `cenarios.md` (a linha do "recomeço", perto da 445) ainda descreve o teste antigo: "a leitura da lista que chega depois do registro não o apaga" | Aplicada pelo Implementador (nome novo do teste) depois da conferência de que `revisores` segue dizendo `nada pendente` |
| frontend-reviewer (2ª) | Faixa fixa do aluno da lista ocupa cerca de 170 px no celular; reexport de `sortearIdDoPedido` em `operacao/pedidos-do-painel.ts` | Já estão na tabela da rodada 1, com destino |


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-10 12:06:56 | 2026-10-10 12:09:29 | `test-engineer` | 1 | REPROVADO | ad86176529b3d7c7a |
| 2026-10-10 12:10:03 | 2026-10-10 12:11:29 | `revisor-geral` | 1 | REPROVADO | ac508cd7b2755770b |
| 2026-10-10 12:10:17 | 2026-10-10 12:12:04 | `frontend-reviewer` | 1 | APROVADO | aaa325eaaa03fc13b |
| 2026-10-10 12:10:10 | 2026-10-10 12:12:09 | `privacy-guardian` | 1 | REPROVADO | a46432172f064b4f3 |
| 2026-10-10 13:23:12 | 2026-10-10 13:27:02 | `test-engineer` | 2 | APROVADO | a5d17712fe8148fde |
| 2026-10-10 13:27:55 | 2026-10-10 13:28:52 | `privacy-guardian` | 2 | APROVADO | a87e715640759eaf0 |
| 2026-10-10 13:28:08 | 2026-10-10 13:29:17 | `frontend-reviewer` | 2 | APROVADO | aff00fef4093840a2 |
| 2026-10-10 13:27:41 | 2026-10-10 13:29:21 | `revisor-geral` | 2 | APROVADO | a2dc41f50642de77a |

# Tarefa 18.0 — Aluno e professor baixam os próprios dados

**Funcionalidade:** lgpd-e-titular · **Depende de:** 13.0 · **Paralelo com:** 17.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O aluno acha "Meus dados" em Privacidade, no rodapé, e o professor no menu da pessoa, com o resumo por categoria, os estados e o aviso de computador compartilhado.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 9 ("Meus dados")
- `docs/interface.md` 11.1 (lateral do aluno)
- Código: `apps/web/src/areas/navegacao.ts` e `.test.ts`, `componentes/MenuDaPessoa.tsx`
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 18.1 — Lugar do rodapé fixo na casca do aluno; item Privacidade com "Meus dados"
- [x] 18.2 — Link no menu da pessoa do professor
- [x] 18.3 — Tela com resumo, estados, aviso e download
- [x] 18.4 — `docs/interface.md`
- [x] 18.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| casca do aluno, `MenuDaPessoa`, navegação | alterado |
| tela "Meus dados" | novo |
| e2e | novo |
| `docs/interface.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz | e2e | a coordenação registra acesso e o aluno baixa `meus-dados-AAAA-MM-DD.json` |
| navegação | e2e | aluno pelo rodapé e pela gaveta a 360 px; professor pelo menu da pessoa |
| estados | e2e | vazio que convida; em preparação a cada 10 s; apagado depois de 7 dias; só a escola ativa |
| recomeço | e2e | troca de escola e segunda pessoa não mostram o arquivo anterior |
| projetos | e2e | `chromebook` e `celular`, acessibilidade |

## Como testar

- **navegação:** `e2e/areas.spec.ts › o aluno vê "Tutor", "Atividades" e "Minha turma"…` e `› o professor vê os itens da fase dele…` (o menu da pessoa); a gaveta a 360 px em `e2e/casca.spec.ts › W12: abaixo de 768 px…`; a unidade em `apps/web/src/areas/navegacao.test.ts`.
- **caminho feliz:** a função local `outroNavegador`, de `e2e/escola-montada.spec.ts`, para a coordenação e o aluno; o download como em `e2e/a2-assistente.spec.ts` (`page.waitForEvent('download')`); `entrarComoAluno` (`e2e/__fixtures__/casca.ts`) e `criarAlunoComMatricula`.
- **recomeço:** `e2e/minha-turma.spec.ts › segunda pessoa: o aluno seguinte no mesmo Chromebook…`; a troca de escola do professor em `e2e/troca-de-escola.spec.ts › depois da troca para B, nenhuma requisição leva o token de A…` (`criarUsuarioEmOutraEscola`).
- **estados:** `e2e/minha-turma.spec.ts › carregando, com dado…`; os 10 s com `page.clock`, como `e2e/inatividade.spec.ts`.
- Apagado depois de 7 dias: semeie `apagado_em` no banco.
- Rodar: `node tools/ci/e2e.ts --manter-ambiente e2e/<arquivo>.spec.ts`.
- **Telas:** `aluno`, de `/aluno/atividades`, com `--clicar 'text=Privacidade'` (rodapé da lateral); `professora`, de `/professor/nova-conversa`, com `--clicar 'text=Meus dados'` (menu da pessoa). Mockup: `mockups/src/areas/aluno/Privacidade.tsx`, só pelo lugar do item no rodapé; o conteúdo dele não é desta fatia. A vitrine não tem pedido: a foto é a do vazio, nas duas escolas.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --e2e)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

A tela da coordenação (17.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| O rodapé fixo do aluno nasce só com **Privacidade**: o **"Avisar um adulto"**, que a proposta da lateral do aluno põe ao lado dele, não é desta tarefa e não ganhou lugar | A tarefa e a Tech Spec criam o rodapé "por enquanto só com 'Meus dados'"; o "Avisar um adulto" (D61) depende da funcionalidade dele, que não existe nesta fatia | `techspec.md` §9 "Meus dados" (primeiro parágrafo); `docs/interface.md` 11.1 (a lateral do aluno, ainda *proposta*) e 11.6 |
| O professor não tem título visível na tela: o `h1` "Meus dados" é só para o leitor de tela, como o de toda aba, e o cartão "Seus pedidos" abre a página; no aluno, "Meus dados" é um `h2` visível dentro de "Privacidade" | O padrão do produto é o título da tela só para o leitor de tela (`Tela.tsx`); o aluno é o único com uma seção nomeada, porque o item da lateral é "Privacidade" e a tela é a seção dele | `techspec.md` §9 "Meus dados"; `docs/interface.md` 11.6 |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `meus-dados/regras.ts` › `situacaoDoArquivo` › `pedido.arquivo.situacao === 'disponivel'` | `regras.test.ts` › o arquivo que a API diz expirado fica apagado, mesmo com a data adiante: quem manda é a API |
| `meus-dados/regras.ts` › `situacaoDoArquivo` › `Date.parse(pedido.arquivo.expiraEm) > agora.getTime()` | `regras.test.ts` › a aba aberta por dias: o arquivo que a API ainda dizia disponível, mas cujo instante passou, não oferece o botão |
| `meus-dados/regras.ts` › `situacaoDoArquivo` › `geraArquivo(pedido.tipo)` (só acesso e portabilidade preparam arquivo) | `regras.test.ts` › acesso e portabilidade em preparação, sem arquivo ainda, estão preparando; os outros tipos em nenhum estado |
| `meus-dados/regras.ts` › `situacaoDoArquivo` › `pedido.estado === 'em_preparacao'` | `regras.test.ts` › sem arquivo e fora de preparação não há o que baixar nem o que esperar |
| `meus-dados/regras.ts` › `podeBaixar` › `situacaoDoArquivo(pedido, agora) === 'disponivel'` | `regras.test.ts` › a aba aberta por dias: …; o arquivo que a API diz expirado fica apagado, … |
| `meus-dados/regras.ts` › `ordenarPedidos` › `b.chegouEm.localeCompare(a.chegouEm)` (o mais recente primeiro) | `regras.test.ts` › o mais recente primeiro, pelo dia em que chegou à escola, e não pela ordem do id que a API entrega |
| `meus-dados/regras.ts` › `ordenarPedidos` › `|| b.id.localeCompare(a.id)` (o desempate) | `regras.test.ts` › no mesmo dia, o id decide, e a lista de entrada não é alterada |
| `meus-dados/regras.ts` › `linhasDoResumo` › `quantidade === 0` | `regras.test.ts` › na ordem do catálogo, e não na da resposta, só com o que tem registro |
| `meus-dados/regras.ts` › `linhasDoResumo` › `quantidade === undefined` | `regras.test.ts` › na ordem do catálogo, …; sem nenhum registro, a lista é vazia |
| `meus-dados/regras.ts` › `linhasDoResumo` › `descricao: ROTULO_DA_CATEGORIA_PARA_O_TITULAR[categoria]` | `regras.test.ts` › o rótulo é do titular: na segunda pessoa, e nunca a regra de guarda do catálogo; na ordem do catálogo, … (`As suas conversas com o Tutor`) |
| `meus-dados/regras.ts` › `ROTULO_DA_CATEGORIA_PARA_O_TITULAR` › `pessoa_desativada: 'O seu cadastro na escola'`, `vinculo_encerrado: 'Os seus vínculos com as turmas'` | `regras.test.ts` › o rótulo é do titular: …; `e2e/meus-dados.spec.ts` › o resumo por categoria: … (`O seu cadastro na escola`, sem `desativado`) |
| `meus-dados/regras.ts` › `ROTULO_DA_CATEGORIA_PARA_O_TITULAR` › `trabalho_do_aluno: 'As suas respostas e as correções das suas atividades'` | `e2e/meus-dados.spec.ts` › o resumo por categoria: … |
| `meus-dados/regras.ts` › `ROTULO_DA_CATEGORIA_PARA_O_TITULAR` › `reivindicacao_decidida: 'Os pedidos de entrada na turma feitos com o seu nome ou decididos por você'` | `regras.test.ts` › o rótulo é do titular: … (vista vermelha com o texto anterior, `'Os seus pedidos de entrada na turma'`) |
| `meus-dados/regras.ts` › `ROTULO_DA_CATEGORIA_PARA_O_TITULAR` › as outras oito entradas (a segunda pessoa, e nunca `desativad`, `encerrad` ou `do aluno`) | `regras.test.ts` › o rótulo é do titular: … (`consumo_por_aluno` e `conversa_tutor` vistas vermelhas; as outras pelo mesmo laço) |
| `meus-dados/regras.ts` › `linhasDoResumo` › `CHAVES_DE_RETENCAO.flatMap` (a ordem do catálogo) | `regras.test.ts` › na ordem do catálogo, e não na da resposta, só com o que tem registro |
| `meus-dados/regras.ts` › `relerEnquantoPrepara` › `pedidos.some(...)` (um em preparação entre outros basta) | `regras.test.ts` › o intervalo é de 10 segundos, e só o pedido em preparação se relê sozinho |
| `meus-dados/regras.ts` › `relerEnquantoPrepara` › `pedido.estado === 'em_preparacao'` | `regras.test.ts` › o intervalo é de 10 segundos, …; sem pedido em preparação nada é agendado: nem relógio, nem ouvinte da aba |
| `meus-dados/regras.ts` › `agendarPreparacao` › `if (!relerEnquantoPrepara(pedidos)) return` | `regras.test.ts` › sem pedido em preparação nada é agendado: nem relógio, nem ouvinte da aba |
| `meus-dados/regras.ts` › `INTERVALO_DA_PREPARACAO_MS` › `10_000` | `regras.test.ts` › o intervalo é de 10 segundos, …; em preparação, uma leitura a cada 10 s: nenhuma antes, três em meio minuto |
| `meus-dados/regras.ts` › `CODIGOS_QUE_MUDAM_OS_MEUS_DADOS` › `[CodigoDeErro.NAO_ENCONTRADO]` (só o arquivo que saiu muda a lista) | `regras.test.ts` › o arquivo que saiu e o armazém fora têm texto próprio, e só o que saiu muda o que a tela mostra |
| `meus-dados/regras.ts` › `TEXTOS_DA_FALHA_DE_BAIXAR` › `[CodigoDeErro.NAO_ENCONTRADO]` | `regras.test.ts` › o arquivo que saiu e o armazém fora têm texto próprio, … |
| `meus-dados/regras.ts` › `textoDaEscola` › `nomeDaEscola === undefined ? 'na escola ativa'` | `regras.test.ts` › a escola da tela é dita pelo nome, e sem ele a tela diz "a escola ativa" (`feitos na escola ativa`, nunca `em a escola`) |
| `meus-dados/regras.ts` › `textoDaEscola` › `` `em ${nomeDaEscola}` `` | `regras.test.ts` › a escola da tela é dita pelo nome, … (`feitos em Colégio Vista Alegre`) |
| `meus-dados/regras.ts` › `SELO_DO_ESTADO` › `agendado`: família `pendente` e o selo "Eliminação agendada" | `regras.test.ts` › cada estado sem arquivo tem o selo e a família dele: nunca só a cor, e o agendado pede atenção |
| `meus-dados/regras.ts` › `situacaoDoPedido` › `case 'preparando'` (família `info`) e `case 'apagado'` (selo "Arquivo apagado") | `regras.test.ts` › o arquivo pronto diz que dá para baixar, o apagado diz o que fazer, e o em preparação diz que volte em alguns minutos |
| `meus-dados/regras.ts` › `anuncioDoArquivoBaixado` › `Arquivo baixado: ${nome}. Se este computador é da escola, …` | `regras.test.ts` › depois do download, o aviso diz o nome do arquivo e que se apaga num computador da escola |
| `api/meus-dados.ts` › `consultaMeusDados` › `gcTime: 0` | `meus-dados.test.ts` › a resposta não fica no cache depois que a tela sai: … |
| `api/meus-dados.ts` › `consultaMeusDados` › `buscarComSessao('/v1/meus-dados', …)` | `meus-dados.test.ts` › a leitura é um GET na rota da própria pessoa, sem o id dela no caminho |
| `api/meus-dados.ts` › `baixarMeuArquivo` › `encodeURIComponent(pedidoId)` | `meus-dados.test.ts` › baixar é um POST na rota do pedido, com corpo vazio, e o id vai escapado no caminho |
| `api/meus-dados.ts` › `baixarMeuArquivo` › `metodo: 'POST'` | `meus-dados.test.ts` › baixar é um POST na rota do pedido, com corpo vazio, … |
| `api/meus-dados.ts` › `baixarMeuArquivo` › `corpo: {}` | `meus-dados.test.ts` › baixar é um POST na rota do pedido, com corpo vazio, … |
| `api/meus-dados.ts` › `relerMeusDados` › `invalidateQueries({ queryKey: CHAVE_DE_MEUS_DADOS })` | `meus-dados.test.ts` › depois que o arquivo saiu, a página relê e o estado que aparece é o do servidor |
| `areas/navegacao.ts` › `RODAPE_DA_LATERAL` › `aluno: [{ rotulo: 'Privacidade', … }]` | `navegacao.test.ts` › F3 (18.0): o aluno tem "Privacidade" no rodapé fixo, o professor tem "Meus dados" no menu da pessoa, … |
| `areas/navegacao.ts` › `MENU_DA_PESSOA` › `professor: [{ rotulo: 'Meus dados', … }]` | `navegacao.test.ts` › F3 (18.0): o aluno tem "Privacidade" no rodapé fixo, …; "Privacidade" e "Meus dados" ficam selecionados no endereço deles, … |
| `areas/navegacao.ts` › `RODAPE_DA_LATERAL` › o rótulo `Privacidade` | `navegacao.test.ts` › F3 (18.0): o aluno tem "Privacidade" no rodapé fixo, … |
| `componentes/CascaDaEscola.tsx` › `CascaDaEscola` (a gaveta) › `rodape={rodape}` no `LateralAberta` da gaveta | `e2e/meus-dados.spec.ts` › o aluno acha Privacidade no rodapé da lateral e, na gaveta a 360 px, … (`celular`) |
| `componentes/CascaDaEscola.tsx` › `CascaDaEscola` (computador) › `rodape={rodape}` no `LateralAberta` da lateral fixa | `e2e/meus-dados.spec.ts` › o aluno acha Privacidade no rodapé da lateral e, na gaveta a 360 px, … |
| `e2e/meus-dados.spec.ts` › `expect(daProfessora.chamadas).toBe(1)` (o clique duplo da professora) | visto vermelho com o `useEnvioUnico` trocado por `mutacao.mutate` **e** tirando do aluno a asserção de uma chamada e a de uma linha de auditoria: o teste cai na linha da professora |
| `e2e/meus-dados.spec.ts` › `segunda pessoa: …` com o pedido `pronto`, o arquivo e o botão do primeiro | visto vermelho com `gcTime: 0` e o `resetQueries` de `main.tsx` tirados: o segundo vê o botão e o selo do primeiro, antes de o `liberar()` |
| `componentes/CascaDaEscola.tsx` › `CascaDaEscola` (trilho) › `rodape={rodape}` no `Trilho` | `e2e/meus-dados.spec.ts` › recolhida a lateral, o aluno ainda alcança Privacidade e o professor, Meus dados, …(nos projetos `chromebook` e `celular`, a aba a 1366 px) |
| `componentes/CascaDaEscola.tsx` › `CascaDaEscola` (a gaveta) › `menuDaPessoa={menuDaPessoa}` no `LateralAberta` da gaveta | `e2e/meus-dados.spec.ts` › o professor acha "Meus dados" no menu da pessoa, antes do "Sair", … (`celular`) |
| `componentes/CascaDaEscola.tsx` › `CascaDaEscola` (computador) › `menuDaPessoa={menuDaPessoa}` no `LateralAberta` da lateral fixa | `e2e/meus-dados.spec.ts` › o professor acha "Meus dados" no menu da pessoa, antes do "Sair", … |
| `componentes/CascaDaEscola.tsx` › `CascaDaEscola` (trilho) › `menuDaPessoa={menuDaPessoa}` no `Trilho` | `e2e/meus-dados.spec.ts` › recolhida a lateral, o aluno ainda alcança Privacidade e o professor, Meus dados, …(nos projetos `chromebook` e `celular`, a aba a 1366 px) |
| `componentes/CascaDaEscola.tsx` › `CascaDaEscola` › `RODAPE_DA_LATERAL[dados.papel]` (o rodapé é por papel) | `e2e/areas.spec.ts` › W2 › o professor vê os itens da fase dele, … (nenhum "Rodapé") |
| `componentes/CascaDaEscola.tsx` › `CascaDaEscola` › `MENU_DA_PESSOA[dados.papel]` (o menu é por papel) | `e2e/areas.spec.ts` › W2 › o aluno vê "Tutor", "Atividades" e "Minha turma", … (nenhuma "Sua conta") |
| `componentes/itens-da-lateral.tsx` › `ListaDeItens` › `itens.length === 0` (sem item, nem a região) | `e2e/areas.spec.ts` › W2 › o professor vê os itens da fase dele, …; o aluno vê "Tutor", "Atividades" e "Minha turma", … |
| `componentes/MenuDaPessoa.tsx` › `MenuDaPessoa` (trilho) › `<ListaDeItens itens={itens} … trilho />` antes do "Sair" | `e2e/meus-dados.spec.ts` › recolhida a lateral, o aluno ainda alcança Privacidade e o professor, Meus dados, …(nos projetos `chromebook` e `celular`, a aba a 1366 px) |
| `componentes/MenuDaPessoa.tsx` › `MenuDaPessoa` (aberto) › `<ListaDeItens itens={itens} … trilho={false} />` antes do "Sair" | `e2e/meus-dados.spec.ts` › o professor acha "Meus dados" no menu da pessoa, antes do "Sair", … |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `secao === undefined ? 2 : 3` (o nível do cartão) | `e2e/meus-dados.spec.ts` › vazio: convida a pedir à coordenação e diz de que escola são os pedidos, … (o `h3` "Seus pedidos" dentro da seção do aluno) |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `secao !== undefined && <h2>` | `e2e/meus-dados.spec.ts` › o aluno acha Privacidade no rodapé da lateral e, na gaveta a 360 px, … |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `useTituloDaTela(titulo)` | `e2e/meus-dados.spec.ts` › vazio: convida a pedir à coordenação e diz de que escola são os pedidos, … (o título da aba) |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `agendarPreparacao(pedidos, ler, document)` no efeito | `e2e/meus-dados.spec.ts` › em preparação se relê a cada 10 s e vira pronto sem recarregar; … |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `ficouPronto` e `definirAnuncio(ANUNCIO_DO_ARQUIVO_PRONTO)` | `e2e/meus-dados.spec.ts` › em preparação se relê a cada 10 s e vira pronto sem recarregar; … |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `emPreparacao.current.has(pedido.id)` (só quem estava em preparação) | `e2e/meus-dados.spec.ts` › o anúncio de "pronto" é só de quem estava em preparação e ficou pronto: … |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `pedido.estado === 'pronto'` do `ficouPronto` | `e2e/meus-dados.spec.ts` › o anúncio de "pronto" é só de quem estava em preparação e ficou pronto: … |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `textoDaEscola(eu.data?.escola.nome)` | `e2e/meus-dados.spec.ts` › vazio: convida a pedir à coordenação e diz de que escola são os pedidos, … |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `consulta.isError && dados === undefined` | `e2e/meus-dados.spec.ts` › com o dado já na tela, a releitura que falha não troca a lista pelo erro: … |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `consulta.isPending && <EstadoCarregando` | `e2e/meus-dados.spec.ts` › carregando e erro: a tela diz o que espera, e "Tentar de novo" lê de novo |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `dados.pedidos.length === 0 ? <EstadoVazio …` | `e2e/meus-dados.spec.ts` › vazio: convida a pedir à coordenação e diz de que escola são os pedidos, … |
| `meus-dados/MeusDados.tsx` › `ListaDePedidos` › `ordenarPedidos(pedidos).map` | `e2e/meus-dados.spec.ts` › cada pedido diz em que pé está, do mais recente ao mais antigo, … (semeado do mais recente ao mais antigo) |
| `meus-dados/MeusDados.tsx` › `ListaDePedidos` › `podeBaixar(pedido, agora) ? pedido.arquivo : null` | `e2e/meus-dados.spec.ts` › a coordenação registra o acesso, o worker monta o arquivo e o aluno e o professor baixam … |
| `meus-dados/MeusDados.tsx` › `ListaDePedidos` › "O arquivo fica disponível até …" | `e2e/meus-dados.spec.ts` › o download que falha: o botão diz que prepara e fica desligado … |
| `meus-dados/MeusDados.tsx` › `ResumoPorCategoria` › `linhas.length === 0` (a frase de nenhum registro) | `e2e/meus-dados.spec.ts` › o resumo por categoria: na ordem do catálogo, no singular e no plural, e a frase de quando não há nenhum registro |
| `meus-dados/MeusDados.tsx` › `ResumoPorCategoria` › `formatarQuantidade(linha.quantidade, 'registro', 'registros')` | `e2e/meus-dados.spec.ts` › o resumo por categoria: … |
| `meus-dados/MeusDados.tsx` › `DialogoDeBaixar` › `onError` › `listaMudou(erro, CODIGOS_QUE_MUDAM_OS_MEUS_DADOS)` › `relerMeusDados` | `e2e/meus-dados.spec.ts` › a coordenação registra o acesso, o worker monta o arquivo e o aluno e o professor baixam … ("Arquivo apagado" depois do clique) |
| `meus-dados/MeusDados.tsx` › `DialogoDeBaixar` › `impedido={mudou}` | `e2e/meus-dados.spec.ts` › a coordenação registra o acesso, o worker monta o arquivo e o aluno e o professor baixam … |
| `meus-dados/MeusDados.tsx` › `DialogoDeBaixar` › `rotuloDeCancelar={mudou ? 'Fechar' : 'Cancelar'}` | `e2e/meus-dados.spec.ts` › a coordenação registra o acesso, o worker monta o arquivo e o aluno e o professor baixam … |
| `meus-dados/MeusDados.tsx` › `DialogoDeBaixar` › `aoConfirmar={() => enviar(undefined)}` (o clique duplo manda uma chamada só) | `e2e/meus-dados.spec.ts` › a coordenação registra o acesso, o worker monta o arquivo e o aluno e o professor baixam … (`chamadas` e uma linha na auditoria) |
| `meus-dados/MeusDados.tsx` › `DialogoDeBaixar` › `resumo`: a linha "Pedido", a "Chegou à escola em" e a "Disponível até" (`expiraEm === undefined ? [] : …`) | `e2e/meus-dados.spec.ts` › a coordenação registra o acesso, o worker monta o arquivo e o aluno e o professor baixam … |
| `meus-dados/MeusDados.tsx` › `DialogoDeBaixar` › `efeito={EFEITO_DE_BAIXAR}` e `aviso={AVISO_DE_BAIXAR}` | `e2e/meus-dados.spec.ts` › a coordenação registra o acesso, o worker monta o arquivo e o aluno e o professor baixam … |
| `meus-dados/MeusDados.tsx` › `DialogoDeBaixar` › `rotuloConfirmando="Preparando o arquivo…"` e `confirmando={mutacao.isPending}` | `e2e/meus-dados.spec.ts` › o download que falha: o botão diz que prepara e fica desligado enquanto a chamada está no ar, … |
| `meus-dados/MeusDados.tsx` › `DialogoDeBaixar` › `falha={textoDaFalha(mutacao.error, TEXTOS_DA_FALHA_DE_BAIXAR)}` | `e2e/meus-dados.spec.ts` › o download que falha: … |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `aoBaixar` › `dialogo.fecharSeAinda(aberta)` | `e2e/meus-dados.spec.ts` › a coordenação registra o acesso, o worker monta o arquivo e o aluno e o professor baixam … (o diálogo some) |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `aoBaixar` › `definirAnuncio(anuncioDoArquivoBaixado(arquivo.nome))` | `e2e/meus-dados.spec.ts` › a coordenação registra o acesso, o worker monta o arquivo e o aluno e o professor baixam … ("Arquivo baixado: …") |
| `meus-dados/MeusDados.tsx` › `MeusDados` › `focoDeReserva={() => inicio.current?.focus()}` | `e2e/meus-dados.spec.ts` › a coordenação registra o acesso, o worker monta o arquivo e o aluno e o professor baixam … (o foco não vai para o corpo da página) |
| `areas/professor/rotas.tsx` › rota de `meusDados` › `titulo="Meus dados"` | `e2e/meus-dados.spec.ts` › o professor acha "Meus dados" no menu da pessoa, antes do "Sair", … (o `h1`) |
| `areas/aluno/rotas.tsx` › rota de `privacidade` › `secao="Meus dados"` | `e2e/meus-dados.spec.ts` › o aluno acha Privacidade no rodapé da lateral e, na gaveta a 360 px, … |
| `caminhos.ts` › `ROTAS_DO_PROFESSOR` › `meusDados: '/meus-dados'` | `navegacao.test.ts` › F3 (18.0): o aluno tem "Privacidade" no rodapé fixo, o professor tem "Meus dados" no menu da pessoa, … |
| `caminhos.ts` › `ROTAS_DO_ALUNO` › `privacidade: '/privacidade'` | `navegacao.test.ts` › F3 (18.0): o aluno tem "Privacidade" no rodapé fixo, …; "Privacidade" e "Meus dados" ficam selecionados no endereço deles, … |
| `caminhos.ts` › `ROTAS` › `meusDadosDoProfessor: ${BASE_DA_AREA.professor}…` | `navegacao.test.ts` › F3 (18.0): o aluno tem "Privacidade" no rodapé fixo, o professor tem "Meus dados" no menu da pessoa, … |
| `caminhos.ts` › `ROTAS` › `privacidadeDoAluno: ${BASE_DA_AREA.aluno}…` | `navegacao.test.ts` › F3 (18.0): o aluno tem "Privacidade" no rodapé fixo, …; "Privacidade" e "Meus dados" ficam selecionados no endereço deles, … |
| `areas/navegacao.ts` › `NOME_DO_RODAPE` › `'Rodapé'` | `e2e/meus-dados.spec.ts` › o aluno acha Privacidade no rodapé da lateral e, na gaveta a 360 px, … |
| `areas/navegacao.ts` › `NOME_DO_MENU_DA_PESSOA` › `'Sua conta'` | `e2e/meus-dados.spec.ts` › o professor acha "Meus dados" no menu da pessoa, antes do "Sair", … |
| `areas/aluno/rotas.tsx` › `<Route path={ROTAS_DO_ALUNO.privacidade}>` | `e2e/meus-dados.spec.ts` › o aluno acha Privacidade no rodapé da lateral e, na gaveta a 360 px, … |
| `areas/professor/rotas.tsx` › `<Route path={ROTAS_DO_PROFESSOR.meusDados}>` | `e2e/meus-dados.spec.ts` › o professor acha "Meus dados" no menu da pessoa, antes do "Sair", … |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | O resumo conta só as categorias de prazo configurável; credencial, sessão e registro de acesso com IP (`retencao.ts:91-100`) ficam de fora | `TODO.md` (LGPD): decidir com a 13.0 entre dizer na tela que o arquivo traz também esses registros e contá-los na API; depende do que o arquivo realmente contém |
| privacy-guardian (1ª) | `EFEITO_DE_BAIXAR` diz "as suas conversas com a IA" aos dois papéis: confirmar que o arquivo do aluno traz a conversa do Tutor dentro da retenção | `TODO.md` (LGPD): conferir contra o arquivo montado na 13.0; a tela não muda sem essa conferência |
| revisor-geral (1ª) | Tirar `em_preparacao` de `SELO_DO_ESTADO` ou derivar o `case 'nenhum'` do `case 'preparando'` | Recusada: `SELO_DO_ESTADO` é `Record<EstadoDoPedido, …>` e o compilador exige a chave; sem comportamento a mudar, só uma duplicação de uma frase, e mexeria em cláusulas já com mutação provada |
| revisor-geral (1ª) | O anúncio de "ficou pronto" usar `podeBaixar` em vez de `estado === 'pronto'` | Recusada: a Tech Spec §9 diz que o anúncio sai quando o pedido que estava em preparação passa a `pronto`; mudar é mudar contrato da tela, e cabe a uma tarefa com o desenho |
| frontend-reviewer (1ª) | Título visível na tela do professor | Recusada: divergência declarada na tarefa (`docs/interface.md` 11.6, padrão de `Tela.tsx`); o título da aba e o `h1` para o leitor de tela existem |
| frontend-reviewer (1ª) | `EFEITO_DE_BAIXAR` sem "(JSON)", "um arquivo que você pode abrir e guardar" | Recusada: a D63 pede dizer que o formato é aberto, e a frase é afirmada no e2e (`em formato aberto (JSON)`) e no `docs/interface.md`; sem defeito que a justifique |
| frontend-reviewer (1ª) | A releitura de 10 s sem teto de tentativas | `TODO.md` (Infra): o relógio é o `agendarRelitura` da 16.0, compartilhado com a coordenação; teto ou espaçamento crescente é decisão dos dois usos, regra 80 |
| test-engineer (1ª) | Ponto de sincronia positivo antes das asserções negativas em `e2e/meus-dados.spec.ts:546`, `:553` e `:583-587` | Recusada nesta rodada: o desenho depende do relógio falso e da repetição da consulta, e um ponto de sincronia mal posto torna o teste intermitente; se o test-engineer a pedir como bloqueante, entra na ordem seguinte |
| test-engineer (1ª) | `:529`: a ausência de auditoria é verdade por construção | Recusada: o próprio revisor diz que não atrapalha; o teste prova o que importa (uma chamada) |
| test-engineer (1ª) | A ausência de "Rodapé" e "Sua conta" na coordenação, no e2e | Recusada: `areas.spec.ts` não tem W2 da coordenação; a unidade (`navegacao.test.ts`) prova os dois mapas vazios, e um e2e novo só para isso não é barato |
| test-engineer (1ª) | O teste "em preparação" depende de até 5 s de tempo real antes do primeiro `fastForward` (`:447-451`) | Registrada, sem ação: o revisor chama a margem razoável; reabre se oscilar na esteira |
| privacy-guardian (2ª) | O resumo conta só as categorias de prazo configurável; credencial, sessão e IP ficam de fora | Já em `TODO.md` (F3, 18.0, LGPD), da 1ª rodada |
| test-engineer (2ª) | Ponto de sincronia positivo antes das asserções negativas em `e2e/meus-dados.spec.ts:546`, `:553` e `:583-587` | Fica para o `/retro`; só reabre se o teste oscilar na esteira (decisão da 1ª rodada, mantida) |
| test-engineer (2ª) | Fixar mais entradas da tabela de rótulos no teste de unidade | Aplicada em parte, pelo diagnóstico do Arquiteto: `reivindicacao_decidida`, a única que liga a pessoa por dois caminhos e não tinha o texto fixado, passa a ter; as outras oito ficam pelo laço, que pega a volta ao catálogo e à terceira pessoa |
| revisor-geral (2ª) | `material_excluido` ("…que você enviou ou excluiu") não descreve nada que aluno ou professor façam (D75) | Recusada: a contagem só soma quem enviou ou excluiu, e a linha só aparece com contagem maior que zero; o rótulo é verdadeiro sempre que aparece (conferência no diagnóstico do Arquiteto e no comentário do mapa) |
| revisor-geral (2ª), frontend-reviewer (2ª) | A linha editada de `docs/interface.md:1077` ficou mais longa que as vizinhas | Recusada: só formatação, sem regra nem teste que a cubra; o Markdown lê igual |
| frontend-reviewer (2ª) | Título visível na tela do professor | Recusada: divergência declarada na tarefa (`docs/interface.md` 11.6); o revisor mesmo manda reconsiderar no `/validar` |
| frontend-reviewer (2ª) | A contagem do resumo sempre na mesma posição (`MeusDados.tsx:239`) | Recusada nesta rodada: ajuste visual de tela aprovada por quem tem o veto, sem defeito de regra; reconsiderar no `/validar` |
| frontend-reviewer (2ª) | "As chamadas ao modelo de IA que o seu uso gerou" e "Os materiais da escola que você enviou ou excluiu" são os mais técnicos | `TODO.md` (F3, 18.0): item novo, junto da conferência do arquivo da 13.0, com a unidade contada em `trabalho_do_aluno` |
| test-engineer (3ª) | Ponto de sincronia positivo antes das asserções negativas em `e2e/meus-dados.spec.ts:546`, `:553` e `:583-587` | Fica para o `/retro`; só reabre se o teste oscilar na esteira (decisão da 1ª rodada, mantida) |
| revisor-geral (3ª) | O comentário de `ROTULO_DA_CATEGORIA_PARA_O_TITULAR` repete, com nomes de coluna, o que a `techspec.md` já diz, e desatualiza na primeira mudança da consulta | Recusada: é a conferência que o `privacy-guardian` exigiu junto do mapa (2ª rodada), e o comentário manda refazê-la quando a cláusula mudar; fica |
| revisor-geral (3ª) | O comentário de `regras.test.ts:172` explica a asserção logo abaixo e pode sair | Recusada: só comentário, sem defeito; diz por que a asserção existe (os dois caminhos da contagem) |
| privacy-guardian (3ª) | Ao alinhar o texto do arquivo (13.0) pelo `/corrigir`, escrever na consulta que o pedido recusado antes naquele nome entra de propósito e não identifica outra pessoa | `TODO.md`: acrescentar ao item "(F3, 13.0) O resumo do arquivo do titular diz…" (anotação 1, abaixo) |
| privacy-guardian (3ª) | O rótulo de `texto_do_modelo` é verdadeiro, mas vago | Já em `TODO.md` (F3, 18.0, "Rever os rótulos mais técnicos do resumo…"), junto de `trabalho_do_aluno` |
| frontend-reviewer (3ª) | O aluno nunca decide um pedido: "…ou decididos por você" só vale para o professor; considerar um rótulo por papel, ou "feitos com o seu nome" para o aluno | `TODO.md`: acrescentar ao mesmo item da 13.0 (anotação 2, abaixo), porque o rótulo por papel pede o texto do arquivo alinhado |
| frontend-reviewer (3ª) | Título visível na tela do professor | Já registrada: divergência declarada (`docs/interface.md` 11.6); reconsiderar no `/validar` |
| frontend-reviewer (3ª) | "As chamadas ao modelo de IA que o seu uso gerou" e "Os materiais da escola que você enviou ou excluiu" seguem técnicos | Já em `TODO.md` (F3, 18.0, "Rever os rótulos mais técnicos do resumo…") |
| frontend-reviewer (3ª) | Falta a foto do resumo com `reivindicacao_decidida` com dado (o seed da vitrine não traz pedido decidido) | `/validar`: o Validador fotografa o requisito com dado semeado, e confere a quebra do rótulo de três linhas a 360 px |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-10 18:20:55 | 2026-10-10 18:24:36 | `test-engineer` | 1 | REPROVADO | a3feb898707bfe6bd |
| 2026-10-10 18:25:17 | 2026-10-10 18:27:40 | `privacy-guardian` | 1 | REPROVADO | a304be1b197e6b806 |
| 2026-10-10 18:25:12 | 2026-10-10 18:27:47 | `revisor-geral` | 1 | REPROVADO | ada4f779c0c56c8fa |
| 2026-10-10 18:25:22 | 2026-10-10 18:28:07 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a74dde324a5e2c4cd |
| 2026-10-10 18:49:45 | 2026-10-10 18:50:23 | `test-engineer` | 2 | APROVADO | a77329cf7c0afe40f |
| 2026-10-10 18:50:56 | 2026-10-10 18:51:34 | `revisor-geral` | 2 | APROVADO | a3b593ab5603614e2 |
| 2026-10-10 18:51:17 | 2026-10-10 18:51:53 | `frontend-reviewer` | 2 | APROVADO | af38535be0c238167 |
| 2026-10-10 18:51:06 | 2026-10-10 18:52:34 | `privacy-guardian` | 2 | REPROVADO | af357e32bdd018068 |
| 2026-10-10 19:05:43 | 2026-10-10 19:06:25 | `test-engineer` | 3 | APROVADO | a7d6ec133698b4729 |
| 2026-10-10 19:07:14 | 2026-10-10 19:07:42 | `revisor-geral` | 3 | APROVADO | ae9401804fe69ff86 |
| 2026-10-10 19:07:04 | 2026-10-10 19:07:51 | `privacy-guardian` | 3 | APROVADO | a802ac40406acf0c6 |
| 2026-10-10 19:07:24 | 2026-10-10 19:07:55 | `frontend-reviewer` | 3 | APROVADO | aca314ca760becbd4 |

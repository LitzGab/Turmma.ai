# Achados das revisões — `tasks/prd-reengenharia/revisao-spec.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-21 15:21:26 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: não. É revisão de spec, sem fotos. Conferi o desenho contra o código atual de `apps/web/src` (`api/cliente.ts`, `api/sessao.ts`, `areas/aluno/fila-de-respostas.ts`, `areas/aluno/respostas.ts`, `areas/professor/Aprovar.tsx`, `areas/professor/fila-do-professor.ts`, `componentes/estado/`, `componentes/FronteiraDaArea.tsx`, `.size-limit.json`, `playwright.config.ts`).

Estados: faltando. Carregando, vazio, erro e com dado só aparecem no desenho como a assinatura de `<Leitura>`/`estadoDaXxx`. Nenhuma tarefa de corte obriga a caracterização a provar os quatro estados e os textos de cada tela (B3, B4, B5).

Acessibilidade: o desenho não piora nada que se veja. Mantém `EstadoErro` com `role="alert"` e `status`, a fronteira com foco no título e os e2e dos dois projetos. Duas pendências:
- `useFocoAoRecuperar` embutido em toda `<Leitura>` pode disputar o foco quando várias leituras se recuperam juntas (recomendação).
- "Recarregar" no `EstadoErro` é novo e precisa de alvo de 44 px (recomendação).

Chromebook fraco:
- **O que está garantido:** `chrome99` (`comPrazo` sem `AbortSignal.timeout` nem `any`), o sino de 14 chamadas para 1, o teto de chunk já imposto em `nome-dos-chunks.test.ts`, e o teste de tela com CPU ×4 e Fast 3G.
- **Virtualização e compressão de imagem antes do upload:** não se aplicam. A X5 não mexe nelas e o PRD não as pede.
- **Implícito:** nenhuma tarefa de tela confere os tetos de chunk. O gate existe, mas a 36.0, a 59.0 e a 75.0 empurram código para `pecas-*` (folga a conferir, teto de 40 kB) e os cortes empurram para `coordenacao` (13,5 de 16 kB) e `professor` (teto de 8 kB). Só o chunk do aluno é citado (recomendação).

Celular: garantido. A onda 4 exige "cada tela cortada, nos dois projetos" e `paginaNaoRola` em toda tarefa de tela (techspec §9 e §10), e o projeto `celular` já existe com 360×800, toque e CPU ×4. Nada novo depende de hover, atalho ou celular. A prova de que a ação principal segue com 44 px depende do e2e existente de cada tela.

Ação oficial protegida: não. Os cortes de Aprovar e Time não estão protegidos contra regressão do que o PRD chama de oficial (B3).

### Item por item

| Item pedido | Situação |
|---|---|
| Leitor tolerante e "há uma versão nova" (onda 1B §2 T3) | Garante a lógica (só `unrecognized_keys`, o resto vira `ErroDeContrato`, sem repetir, com teste de campo extra e de obrigatório ausente). Deixa implícito como a fila de respostas da prova trata o código novo. Hoje `tipoDaFalha` manda tudo o que não conhece para "passageira", então um `PUT` em que o servidor gravou mas a resposta é recusada repete para sempre, e a tela nunca mostra "Resposta salva". A tela de erro da prova também não diz o que fazer (recomendação) |
| Kit em `apps/web/src/kit/` (onda 2) | Garante a fronteira (depcruise e `no-restricted-imports`) e a mensagem de chunks. Implícito: o ganho de tamanho do `pecas-*` |
| `comPrazo` e "Tentar de novo" (onda 3, 52.0) | Garante: prazos por tipo, `AbortController` próprio, `redeFalsa` respeitando o sinal, `no-restricted-globals: fetch` |
| Prova no `sessionStorage` depois do F5 (53.0, 51.0) | Implícito, com dois defeitos (B1 e B2) |
| Fronteira de erro (56.0) | Garante: `FronteiraDaArea` na raiz, falha de render com "Tentar de novo", `reportarFalha` só com tipo e rota, sem mensagem. O "Tentar de novo" recarrega a página; com 53.0 a prova sobrevive a isso |
| Sessão injetável (57.0) | Garante a forma (`criarSessao`, `useSessao`, `renderizarTela`), com `anunciar()` antes de `limparDadosDaEscola()` e uma trava de import. A ordem das tarefas expõe regressão (B5) |
| `<Leitura>` (58.0) | Implícito. Não há tabela de mapeamento entre consulta e estado (B5) |
| Cortes com caracterização e foto antes/depois (§2.2) | O molde garante: caracterização num commit anterior, `git diff --stat` do commit do corte, e2e nos dois projetos e foto. Implícito o que a caracterização cobre (B3). A vitrine "talvez" não semeie o lote de correção, a entrega, a prova e a conversa do Tutor. Sem foto, Aprovar, Time, Tutor e Atividade (as telas oficiais) só têm teste e e2e; falta dizer qual e2e confere o texto visível, e isso fica como recomendação |
| Corte altera estado vazio, carregando, erro ou texto visível | Sim, em dois pontos que o desenho não declara: B4 (sino) e B5 (`<Leitura>`) |

### Bloqueantes

1. **A origem da `sequencia` do cliente não está definida** (`onda-3.md` §2, T13, 51.0 e 53.0). O servidor só grava com `where excluded.sequencia > resposta_atividade.sequencia`, e o `PUT` ganha `sequencia` "opcional". O espelho guarda `sequencia` por pendente, mas não diz de onde vem o contador. Se for um contador em memória por fila, ele reinicia em 0 depois do F5. A escolha nova então perde para a antiga já gravada com 7, o servidor "relê e devolve o que ficou", e o aluno vê a alternativa antiga como salva. Isso viola a regra 80.6.
   - **Correção exigida:** definir uma fonte monotônica entre recargas, por exemplo o maior valor entre o que o servidor devolve na leitura da prova e o do espelho, mais 1.
   - **Teste exigido:** "responder, confirmar, F5, escolher outra alternativa, e a nova vence".
   - **Outra lacuna do espelho:** o formato `{ dono, pendentes[{ questao, alternativa, sequencia }] }` não traz a atividade. Hoje as filas são por atividade (`filas = new Map` em `fila-de-respostas.ts`). Declarar a chave por atividade.

2. **O espelho é limpo no gancho errado** (`onda-3.md` 53.0 e PRD RF21). O desenho limpa o `sessionStorage` "em `aoTrocarDeSessao`". Em `api/sessao.ts`, `limparDadosDaEscola` dispara esse gancho também na sessão vencida por inatividade (`encerrarLocalmente('vencida')`) e em toda sessão nova (`sessaoNova`, no login por cima). O caso central do RF21 é a rede da escola cair, a sessão vencer e o aluno entrar de novo; nele o espelho seria apagado, e a regra "só com o mesmo dono" já bastaria para proteger o computador compartilhado.
   - **Correção exigida:** limpar só no envio, no "Sair" e quando o dono muda, e deixar a hidratação comparar o dono.
   - **Teste exigido:** sessão vencida com o mesmo dono mantém a escolha pendente, e outro dono a descarta.

3. **Ação oficial: a caracterização do corte de Aprovar e Time não cobre o que importa** (`onda-4.md` §2.2, "A prova de que a tela não mudou", item 1; tarefas 60.0, 66.0 e 67.0). As mutações declaradas são só duas: a trava de duplo clique e o `if (problema) return` da rejeição. O corte de `Aprovar.tsx` leva o efeito do `?ver=` e o registro de abertura de destaque (`abrirDestaque`, linhas 162–198) para `useAberturaDeDestaque`. Isso é a "validação documentada" da D56: o que foi mostrado e o que foi aberto, e o botão só libera depois da última abertura.
   - **Correção exigida:** a caracterização de 60.0 e as mutações precisam incluir:
     - sem registrar a abertura, o botão de aprovar não libera;
     - o resumo de valor, aluno e avaliação aparece antes da confirmação;
     - o conteúdo do diálogo de confirmação.
   - **Qual teste falha:** dizer qual teste fica vermelho em cada mutação, e proibir que o commit do corte toque esse teste (já previsto, mantenha).

4. **O sino muda texto visível e estado sem declarar** (`onda-4.md` §2.6 e 79.0, contra `techspec.md` §9, que diz "o comportamento é igual"). Hoje `fila-do-professor.ts` mostra:
   - "N ou mais pedidos" quando a página veio cheia;
   - o aviso de lista parcial ("o que o sino não leu");
   - o grupo "Outras turmas";
   - o limite de 12 turmas.

   Com uma chamada só, as contagens ficam exatas, e o desenho não diz como a tela mostra `entregasHaMais`, `semAnoLetivo` ou a falha. As 12 leituras em série viram uma só, e o erro passa a ser tudo ou nada. Os estados carregando, erro e vazio ("nada esperando" ou "escola montada") do sino não estão escritos.
   - **Correção exigida:** em `onda-4.md` §2.6, uma tabela com os quatro estados e os textos antes e depois, os textos removidos declarados como mudança aceita, e o e2e `sino-por-area` mantido.

5. **A ordem das tarefas da leva 1 e o contrato de `<Leitura>` deixam o corte sem rede** (`onda-4.md` §2.4 e §5: 57.0, 58.0, 59.0 antes de 60.0 a 65.0).
   - **Ordem das tarefas:** a 59.0 depende só de 57.0 e 58.0, mas troca `ConfirmacaoDePerigo` (Estrutura, Professores, ListaDaTurma, ConvidarAlunos) e `classesDoBotao` em 36 arquivos. A 57.0 mexe em páginas, `LoginPorCima`, `SeletorDeEscola` e `CascaDaEscola`. As caracterizações de 62.0, 63.0 e 65.0 só vêm depois, sem dependência delas. É o mesmo desvio que o `techspec.md` §1 proíbe.
   - **Sem tabela de estados:** a 58.0 embute `cancelRefetch: false` e `useFocoAoRecuperar` em toda leitura, e o desenho não define:
     - carregando por `isPending` ou `isFetching`;
     - o erro quando já há dado em cache;
     - `useInfiniteQuery`;
     - consulta com `enabled: false`;
     - o foco movido em toda recuperação, que passa a valer para telas que hoje não o movem.
   - **Correção exigida:** a 59.0 passa a depender de 60.0 a 65.0, ou o texto declara que 57.0, 58.0 e 59.0 só criam o mecanismo e migram dentro dos cortes, com a catraca por arquivo. A tabela de mapeamento consulta→estado entra em §2.4, com um teste de unidade por linha.

### Recomendações

- Dizer como a fila de respostas classifica `RESPOSTA_FORA_DO_CONTRATO` (hoje cairia em "passageira" e repete sem fim), e escrever o texto do aviso de contrato quebrado dentro da prova.
- O que nenhum item do PRD pede nem a spec escreve, mas que o `frontend-reviewer` deve checar toda vez, como regra do `N_task.md` de tela:
  - alvo de 44 px no "Recarregar";
  - `<Leitura>` não move o foco duas vezes quando duas leituras se recuperam juntas;
  - o chunk da coordenação, que tem 2,5 kB de folga, medido nas tarefas 70.0 a 72.0 e 78.0.
- Um lint de API acima do Chrome 99 (`toSorted`, `AbortSignal.any`, `Array.prototype.findLast` e semelhantes). O `target` do Vite só transpila sintaxe e o repositório não tem `eslint-plugin-compat`; o `techspec.md` §9 só proíbe `AbortSignal.timeout`.
- Se a vitrine não semear os fluxos oficiais, dizer qual e2e confere o texto visível de Aprovar, Time, Tutor e Atividade (por exemplo `toHaveScreenshot` ou o snapshot da árvore de acessibilidade), para a "foto antes e depois" não ser só verbal.
- Registrar no `N_task.md` da 36.0 o teto de 40 kB do `pecas-*` e a folga medida do kit, junto com o ajuste de `nome-dos-chunks.ts` já previsto.
[… 2 linhas cortadas]

## tenancy-guardian · 1ª rodada · REPROVADO · 2026-10-21 15:22:27 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: nenhuma tabela nova (`techspec.md` §3). A coluna `resposta_atividade.sequencia` (onda-3.md, 51.0) entra numa tabela que já tem `escola_id` e `ano_letivo_id`. A retenção de `job_registro` muda sem mexer no schema. Itens 1 e 6: o primeiro não se aplica. O UUID está garantido: `@IdDoCaminho` só aceita uuid em minúsculas e trata o inválido como `NAO_ENCONTRADO`; o `substitui` é `uuid`.

Queries verificadas:
- Trava de tenant (onda-1a.md, T6, 6.0 a 9.0).
- IA pelo contexto (8.0).
- Fim das cercas de `arquitetura.test.ts` (12.0).
- `GET /v1/professor/esperando`, `GET /v1/coordenacao/esperando` e `GET /v1/escola/roteiro` (onda-2.md, RF15).
- `semProfessor` e `prazo`.
- `substitui` / `excluirSeFalhou` (41.0).
- Worker de IA e de PDF (onda-3.md, T9, 45.0 e 47.0).
- `ops:reprocessar-job` e `ops:descartar-job` (46.0).
- Conferência S12 (onda-0.md, 4.0).

Na escola do corpo, a entrada estrita está garantida (14.0 a 17.0). Na rede, as células `nunca` do "esperando" também.

Teste de isolamento: presente e efetivo nas três portas de IA (8.0), no "esperando" e no `substitui`. Presente mas inútil no worker de IA (47.0), como está descrito. Ausente no worker de PDF (45.0).

Bloqueantes:

1. **O worker de IA não diz de onde vem a escola** (onda-3.md, §2 "T9 — o worker da API" e §4; techspec.md §6, item 47.0; onda-1a.md, T6, linha `ia/execucao`).
   - **O que está errado:** a spec diz que "o contexto vem da linha de `execucao_agente`". Mas o payload só leva `execucaoId`, e ler essa linha para descobrir a escola é uma leitura sem escopo. A onda-1a.md põe `ia/execucao` em `REPOSITORIES_SEM_ESCOPO` "até a onda 3" (R39), e a onda-3.md não diz como ela sai da lista. Os 4 métodos continuam com `ExecucaoAgendada.escolaId` por argumento.
   - **Por que o teste da 47.0 não serve:** "contexto vindo da linha e nunca do payload" não tem cláusula a remover. Se o desenho for ler a linha sem escopo, o teste não quebra.
   - **Correção exigida na 47.0:**
     - Declarar que a escola do contexto é `job_registro.escola_id`, restaurada pelo `ExecutorDeJobs` como hoje.
     - O processador lê `execucao_agente` com `escola_id = exigirEscolaDoContexto() and id = :execucaoId`. Só `solicitadaPor` e `ano_letivo_id` vêm da linha.
     - `ExecucaoRepository` troca `ExecucaoAgendada.escolaId` pelo contexto e sai de `REPOSITORIES_SEM_ESCOPO`. Só `falharInterrompidas` fica, com o `@SemEscopo` que já tem.
     - Teste de isolamento: job da escola A com o `execucaoId` de uma execução da escola B. O resultado esperado é nada rodar, nenhuma chamada ao adaptador e nenhuma linha em `consumo_ia` nem em `entrega` da escola B.
     - Mutação declarada: tirar `escola_id` dessa leitura deixa o teste vermelho.

2. **O "esperando" do professor não diz qual alcance usa para as entregas** (onda-2.md, RF15, `GET /v1/professor/esperando`; techspec.md §6).
   - **O que está errado:** hoje `EntregaRepository.#noAlcance` (`apps/api/src/entrega/entrega.repository.ts`) exige vínculo confirmado **na disciplina da entrega** (`disciplinaDaEntrega`). A spec só diz "vínculo confirmado" e "contagem exata". Uma contagem por `turma` sem a disciplina mostra à professora de Matemática que existe entrega pendente da colega de Português na mesma turma. É autorização por objeto (regra 10.4) e revela a existência de um dado (item 5).
   - **Correção exigida na 37.0:** `turmas[].entregas` e `entregas[]` usam o mesmo alcance do `EntregaRepository` (`comVinculoConfirmadoDoProfessor` com `disciplinaDaEntrega`). O teste junta duas professoras da mesma turma, cada uma numa disciplina: a entrega de uma não aparece nem conta para a outra. A mutação é tirar o filtro de disciplina.

3. **A extração de PDF no worker não tem teste de isolamento** (onda-3.md, 45.0; techspec.md §6).
   - **O que está errado:** o caminho de confiança muda. Antes a extração rodava no contexto da requisição; agora roda no contexto do job, que lê o material pelo `materialId` e grava trechos e estado. A §6 lista os testes novos e esse não está entre eles, e a regra 10.5 o exige.
   - **Correção exigida na 45.0:** teste de job da escola A com o `materialId` da escola B. O resultado esperado é nada extraído e nenhum trecho, estado ou objeto da escola B alterado. A mutação declarada é a leitura do material sem `escola_id`.

4. **A 12.0 tira três cercas de tenant e não põe nada no lugar** (onda-1a.md, T7, "O que sai de `apps/api/test/arquitetura.test.ts`"; onda-2.md, RF14, linha `sessao/tenant/`).
   - **O que está errado:** saem o `describe` da `ResolucaoDeTenantRepository`, os 2 primeiros `it` da `ContaGlobalRepository` e os 2 últimos do `PainelRepository`. As três classes concentram `@SemEscopo` entre escolas. Nenhuma das regras listadas para `camadas.cjs` as substitui, e `.reengenharia/medicao/depcruise.cjs` também não tem essas regras. Isso contradiz a techspec.md §6, que diz que "nenhuma é afrouxada". Na onda 2 piora: "fora de `sessao/` só pelo `index.ts`" permite chegar à Resolução por um reexport.
   - **Correção exigida na 12.0:**
     - Regras do depcruise: só `apps/api/src/sessao/**` importa `resolucao-de-tenant.repository`; só `sessao` e `ciclo-de-vida` importam `conta-global.repository`; só `operacao/painel.service.ts` importa `painel.repository`.
     - Fixtures negativas em `camadas.test.ts` para import, reexport e `import()` dinâmico.
     - Na 34.0, uma regra de que `sessao/index.ts` e `credencial/index.ts` não reexportam a Resolução nem a conta global.

Recomendações:
- **Chave do PDF temporário (45.0):** usar a escola como prefixo, no padrão de `chaveDoObjeto(escolaId, …)`, para o `retencao.expurgar-escola` alcançar o órfão.
- **Exceções novas da 46.0:** listar na spec os métodos sem escopo de `ops:reprocessar-job` e `ops:descartar-job`. `nucleo/fila` já passa de três `@SemEscopo` (regra 10.9). Registrar no ADR da onda 6.
- **`REPOSITORIES_SEM_ESCOPO.motivo`:** exigir o mesmo mínimo de 30 caracteres do `@SemEscopo`.
- **Prova (a) da T6:** ela só prova que a função é chamada, não que entra no `where`, e não confere `ano_letivo_id`. Deixar escrito que ela complementa o teste de isolamento e não o substitui.
- **`GET /v1/escola/roteiro`:** nomear a célula da `MATRIZ`: coordenação `unidade`; professor, aluno e rede `nunca`.

Arquivos auditados, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/`: `prd.md`, `techspec.md`, `onda-0.md`, `onda-1a.md`, `onda-1b.md`, `onda-2.md` e `onda-3.md`. Em `onda-4.md`, `onda-5.md` e `onda-6.md`, só os trechos sobre escola, escopo e isolamento.

## llm-integrator · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-21 15:23:32 · `tasks/prd-reengenharia/revisao-spec.md`

```
VEREDITO: AJUSTES NECESSÁRIOS
Perfis usados: nenhum novo. Os perfis das tarefas não mudam (Tutor, Assistente e relatório em `rapido`; plano, atividade, adaptação e Analista em `padrao`). O desenho só muda onde a IA roda e como o adaptador falha. O Command em `onda-3.md` §2 T9 lê o perfil da `DefinicaoDeTarefa`, que já o declara.
Custo estimado por professor/mês: a spec não traz número, só a frase de `techspec.md` §8 ("não muda; tende a baixar"). Nenhuma chamada nova de modelo entra.
- Efeitos da spec por professor:
  - A RF2 pode somar até uma repetição `rapido` por devolutiva barrada. A repetição é a `TENTATIVAS_MAXIMAS = 2` de `provedor.ts`, com no máximo 800 tokens de saída (`maximoDeTokensDeSaida`). Só ocorre com a conversa trazendo texto de aluno.
  - A RF1 tira chamadas, porque a frase de risco vai à mensagem fixa sem modelo.
  - Não repetir 5xx tira a cobrança em dobro.
  - O modelo menor da 49.0 baixa o custo do turno.
- Efeito líquido: perto de zero, mas sem medida na spec.
- Base para a conta do Tutor, de `docs/infra.md`: cerca de 3.000 tokens de entrada mais 250 de saída por troca, com teto de 300 trocas por aluno por mês (D38).
- Número que falta à spec: a taxa de falso positivo do `ouro` em `saidaQualitativa`, que dá o custo da RF2.
Prompt versionado: sim, mas sem trava (bloqueante 5)
Validação de schema: sim. Saída por `esquemaDeSaida`, entrada de job por `DEFINICOES_DE_JOB` e rota por registro. O caminho de erro (`IA_SAIDA_INVALIDA`, `DADOS_INVALIDOS`, `ErroDeContrato`) está descrito.
Aprovação humana no caminho: sim. A spec a preserva, mas só por herança (veja a recomendação 9).
```

## Por item pedido

| Item | Situação | Onde |
|---|---|---|
| Command por tarefa e registro | Garantido na forma: interface, registro e teste "Command para toda `TarefaDeIa`, salvo `relatorio_da_correcao`" (`onda-3.md` §2 T9, 42.0). A exceção é inofensiva, porque `relatorio_da_correcao` não tem chamador no código. O contexto no worker fica implícito (bloqueante 1). | `onda-3.md` |
| Execução de IA no worker | Garantido: `main-worker.ts`, filas por `executor`, estado `pendente`/`rodando`, `EXECUCAO_INTERROMPIDA` sem chamar o modelo, `kill -9`, duplicado e `AppModule` HTTP sem `LLM_PROVIDER`. Falta o registro da execução morta (bloqueante 6). | `onda-3.md` T9, §3 |
| Adaptador cockatiel, sem repetir 5xx que cobrou | O desenho garante: timeout e 5xx não se repetem, só 429 e conexão recusada, e `pedirComRecuo` sai. A tabela de Falha não tem linha "5xx: um `fetch` só", e a composição dos prazos é implícita (bloqueante 2). | `onda-3.md` T10 |
| Limite de tokens | Implícito (bloqueante 3). | `onda-3.md` 49.0 |
| D62 na subida | Garantido em parte, com um buraco (bloqueante 4). | `onda-3.md` RF20 |
| IA tira a escola do contexto | Garantido para `consumo`, `orcamento` e `suspensao` (8.0), com teste de isolamento A/B. Fica uma pendência na `ia/execucao` (recomendação 1). | `onda-1a.md` T6 |
| Subcaminho `@educa/nucleo/ia` | Garantido, com trava por depcruise e `exports`. Veja a recomendação 3 sobre o `execucao-de-jobs`. | `onda-2.md` RF14 |
| Conferências da D55 e do risco à vida (onda 0) | RF1 e RF3 garantidos. RF2 tem alvo vazio (bloqueante 7), e o `ouro` fica sem selo na janela da 2.0 e da 3.0 (bloqueante 8). | `onda-0.md` |
| Algo toca prompt sem subir versão | Implícito (bloqueante 5). | `onda-3.md`, `onda-1b.md` T11 |

## Bloqueantes

1. **Contexto do worker de IA**, `onda-3.md` §2 T9 (42.0 e 47.0).
   - O que está errado: a spec diz que o contexto vem de `execucao_agente` ("escola, `solicitadaPor`, ano"). O código exige mais. `sessaoDaRequisicao()` (`packages/nucleo/src/identidade/guarda-autenticacao.ts:54`) lança `NAO_AUTENTICADO` sem `papel` e sem `sessaoId`, e a linha da execução não tem nenhum dos dois.
   - Cerca de 30 arquivos de `apps/api/src` a chamam, inclusive repositories que `preparar` e `concluir` alcançam (`turma-do-professor`, `tutor`, `artefato`, `material`).
   - A spec só converte `sessaoDaRequisicao().usuarioId`. Ela não enumera os repositories nem diz como se monta `papel`, e não trata `solicitadaPor` nulo (usuário eliminado; a coluna é anulável). A citação `contexto-da-execucao.ts:185` não existe: o arquivo tem 24 linhas.
   - Correção exigida: listar os repositories e services que a execução toca. Declarar a regra de montagem do contexto no worker: `papel` relido do `usuario` da escola, sem `sessaoId`, e `solicitadaPor` nulo falhando fechado com `NAO_ENCONTRADO`. Exigir o teste da 47.0 com usuário eliminado entre o 202 e a execução.

2. **Composição de prazos e dos mecanismos do adaptador**, `onda-3.md` T10 (48.0) e `onda-1b.md` T4 (`prazoMs`).
   - O que está errado:
     - `wrap(retry, disjuntor, timeout)` põe o timeout do cockatiel por tentativa. Hoje o prazo `LLM_TIMEOUT_MS` cobre a chamada e a repetição juntas (`adaptador-openai-compat.ts:150`). Isso sustenta o invariante `IA_EXECUCAO_TIMEOUT_MS > LLM_TIMEOUT_MS` (`config-ia.ts`).
     - Com timeout por tentativa, o pior caso é 2 tentativas de `ProvedorDeIa.chamarAteValer` × 2 do 429 × 60 s, mais a espera de 8 s da 49.0. Isso passa de 150 s e de qualquer `prazoMs`. A spec não faz a conta.
     - O `prazoMs` do job de IA é "o máximo do infra, arredondado para cima" (⚠️ na onda 1B).
     - O disjuntor é "por provedor e perfil", mas a degradação diz "modelo menor do mesmo perfil". Aberto, o disjuntor bloquearia o fallback que ele devia permitir.
     - Não está dito se 429, timeout e `IA_SAIDA_INVALIDA` contam como falha do disjuntor.
     - A tabela de Falha não tem linha para "5xx não repete".
   - Correção exigida: escrever em `onda-3.md` §2 T10 a ordem dos mecanismos e o orçamento de tempo, com `prazoMs` de `ia.executar-agente` maior que o pior caso. O sinal único do `ProvedorDeIa` deve cortar o `retry` do cockatiel, ou o invariante de `config-ia.ts` deve ser reescrito e testado. Definir o que conta como falha do disjuntor e se o fallback tem disjuntor próprio. Acrescentar à §3 a linha "500: exatamente um `fetch`".

3. **Limite de tokens**, `onda-3.md` 49.0 e `techspec.md` §7c.
   - O que está errado:
     - `LLM_TOKENS_POR_MINUTO` e `LLM_MODELO_MENOR_<PERFIL>` não existem em `config-ia.ts`. A spec os trata como existentes e não manda declará-los no `esquemaAmbienteDeIa`, nem validá-los na subida.
     - `LimiteDeTokens` usa `ContadorEmJanela`, que mora em `apps/api/src/sessao/senha/` (futuro `credencial/`). O adaptador resiliente e o `ProvedorDeIa` moram em `packages/nucleo`, e a regra da 12.0 proíbe `nucleo` importar app.
     - Não se diz se a contagem é a estimativa antes da chamada ou o uso real depois. Contar só depois deixa o balde estourar.
     - Não há prioridade: um único balde pode deixar `normal` e `lote` consumirem os tokens do Tutor em sala. A regra 80.4 exige limitador "com prioridade".
   - Correção exigida: criar a porta em `nucleo` (`LimiteDeTokens`) com implementação em `apps/api`, e declarar as variáveis na config. Dizer que a reserva é por estimativa na entrada, com acerto pelo uso real na saída. Definir a reserva ou prioridade da fila `interativa` e a chave do balde (provedor). Cobrir isso nos testes de "Tokens".

4. **D62 na subida**, `onda-3.md` RF20 (50.0).
   - O que está errado: a checagem é `suboperador` vigente da `IA_PROVEDOR_ID` com `pais = 'BR'` e treinamento vedado. O cadastro (`apps/api/src/ops/suboperador.ts`) também tem `categorias` e `alcance` (`--todas` ou `--escolas`). Um suboperador de hospedagem, só com `cadastro`, passaria na checagem e ainda assim a conversa de aluno iria para ele.
   - O PRD RF20 diz "com o Tutor ligado", e a Tech Spec não define o que isso significa na subida. Não existe esse estado: o Tutor é configuração por turma (D19).
   - Correção exigida: exigir `conversa_do_aluno` em `categorias` e `alcance` que cubra as escolas atendidas, ou declarar o alcance mínimo. Dizer que a checagem vale para todo `openai_compat` fora da nossa rede, e alinhar o texto do PRD. Cobrir cada ramo no teste (categoria ausente, alcance restrito, encerrado).

5. **Prompt e regra 30.6**, `onda-3.md` 42.0 e 47.0, `onda-1b.md` 26.0 e 27.0, `techspec.md` §8.
   - O que está errado: a regra está só em prosa ("se tocar o prompt, sobe a versão"). Nenhum teste liga `versao` ao conteúdo. As 7 `PROMPT_*` têm `versao` fixa e nada falha se o texto mudar.
   - O risco real não está no arquivo `prompts/`. Está nas tarefas que reescrevem como a entrada é montada (`entrada()` vira `preparar`) e nas que movem os padrões que decidem o que vai ao modelo (`turnosQuePodemIrAoModelo`). Essas mudanças alteram a mensagem enviada sem tocar `prompts/`.
   - Correção exigida: criar, antes da 42.0, um teste de caracterização que fixa as mensagens montadas por tarefa (adaptador roteirizado) e um hash do prompt contra `versao`. Exigir que ele continue verde nas 42.0, 47.0, 26.0 e 27.0, e que a mudança de hash sem mudança de `versao` falhe.

6. **Registro da execução morta**, `onda-3.md` §3 (linha "Worker morto").
   - O que está errado: o teste exige "uma linha em `consumo_ia`" depois do `kill -9`, mas o desenho não diz quem a escreve. O worker que morreu não registra, porque `provedor.ts` registra depois da chamada. A reentrega termina em `EXECUCAO_INTERROMPIDA` "sem chamar o modelo". Logo, uma chamada possivelmente já cobrada fica sem registro, contra a regra 30.4.
   - Correção exigida: definir quem grava a linha. Por exemplo, o processador de reentrega grava `consumo_ia` com `estado = 'falhou'`, `codigoDeErro = EXECUCAO_INTERROMPIDA` e tokens zero ou desconhecidos. Ou então corrigir o teste e declarar a perda.

7. **Alvo da RF2 vazio**, `onda-0.md` §2.1 ("Alvo (R38)") e 3.0.
   - O que está errado: para `saidaQualitativa` e `julgamentoDeTextoDeAluno` o alvo é "não cair abaixo da `base`". As duas políticas não existem antes da 3.0, e a `base` medida na 1.0 é zero ou vazia. Qualquer resultado passa, e a RF2 ("amostras qualitativas barradas") fica sem número.
   - Correção exigida: fixar em `MEDIDAS.alvo` antes da 3.0 o recall mínimo das positivas qualitativas e 100 % (ou limite declarado) de passagem das 20 ou mais legítimas (rubrica, critérios, lote, correção cega). Nenhuma política nova pode ter alvo igual à base.

8. **Janela sem selo do `ouro`**, `onda-0.md` §2.1 e `onda-1b.md` 29.0.
   - O que está errado: as tarefas 2.0 e 3.0 são as que ajustam padrões até bater o `ouro`. A trava (`selo.test.ts`, `ouro-separado.ts`, conferência do reviewer) só chega na 29.0, na onda 1B. Até lá o Implementador pode editar amostras do `ouro` junto com o padrão, e só a leitura do `conformidade-reviewer` pega.
   - Correção exigida: levar o `selo.test.ts` (sha256 contra `SELO.json`) para a 1.0, junto com o leitor. Tornar explícito, nas 2.0 e 3.0, o item 3 da 29.0 (`git log <base>..HEAD -- docs/aia/ouro` vazio).

## Recomendações
[… 15 linhas cortadas]

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-21 15:23:58 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

Campos pessoais tocados: `job_registro` (só ids; o `falhou` passa de 7 para 30 dias), a escolha pendente da prova no `sessionStorage` (ids de questão e alternativa, mais o `usuarioId` como dono), o PDF do material no storage (novo: hoje os bytes não são gravados em lugar nenhum), `resposta_atividade.sequencia` (coluna técnica, sem dado novo), `material.substituido` na auditoria, e o corpus `ouro` (sintético).

Fora da tabela de dados do docs/lgpd.md:
- `job_registro` não está em `docs/lgpd.md` hoje. Conferi: nenhuma ocorrência. O PRD §8 responde "sim", e está errado. A `onda-3.md` §2 (T5, 44.0) reconhece o erro e põe a linha na 44.0.
- O PDF temporário não está em linha nenhuma. A `onda-3.md` §4 diz que "a linha 86 de `docs/lgpd.md` (Material) cita o PDF temporário", e ela não cita. O `docs/modelo-de-dados.md:569` ainda diz "o arquivo não é guardado".
- O pendente da prova entra na 53.0, e isso está garantido (`techspec.md` §7 e §11).

Autorização por objeto: ok no desenho.
- O "esperando" lê pela `MATRIZ` (professor `turma_vinculada`, coordenação `unidade`, aluno e rede `nunca`), com teste de duas escolas e entrada na oráculo (`onda-2.md` §4).
- `substitui` com id de outra escola ou com material `pronto` responde o mesmo `NAO_ENCONTRADO` (`onda-2.md` §3).
- O worker tira o contexto da linha de `execucao_agente`, nunca do payload (`onda-3.md` §4, 47.0).

Logs: limpos no desenho.
- **Erro de entrada:** o `PipeDeEntrada` lança `ENTRADA_INVALIDA` sem `issues` (`onda-1a.md` §2, T1). O `FiltroGlobalDeErro` de hoje (`packages/nucleo/src/erro/filtro-global.ts`) responde só código e mensagem fixa, e loga só `resumirErro`, que leva tipo e pilha, sem mensagem. Nem o `StandardSchemaValidationPipe` do Nest 12, que formata as `issues`, chegaria ao corpo ou ao log.
- **`reportarFalha`:** leva só `{ tipo, rota }`, sem mensagem nem pilha, e por padrão não envia nada (`onda-4.md` §2.3 e §3).
- **Falha de job:** o BullMQ guarda só o código em `failedReason` (`apps/worker/src/executor.ts`).

Auditoria:
- Presente: `material.substituido` (41.0).
- Declarada sem conteúdo: `ops:reprocessar-job` e `ops:descartar-job` (46.0). Ver o bloqueante 2.

Envio externo: nada novo sai. A IA muda de processo, e o envio continua registrado em `consumo_ia`: o teste do `kill -9` exige uma linha ali (`onda-3.md` §3). A D62 passa a barrar a subida da API e do worker (50.0), mas a conferência desenhada é incompleta. Ver o bloqueante 3.

Seed/fixture: sintético.
- O `ouro` traz `fonte: "sintetica"` e "Nenhuma frase vem de aluno real" (`onda-0.md` §2.1). As 12 amostras do revisor usam nome inventado ("Lucas").
- A semente usa `.invalid` (`onda-5.md` §4).
- As medidas brutas vão para `.processo/`, que está no `.gitignore`.

**Item por item, do que você pediu para olhar:**

| Item | Situação |
|---|---|
| `job_registro` e retenção de 30 dias (44.0) | garante: retenção, linha no lgpd e teste de 29 e 31 dias (`onda-3.md` §2 T5 e §3). O PRD §8 está errado |
| Pendente no `sessionStorage` (53.0) | garante: só ids, dono, limpeza no envio e na troca de sessão, linha no lgpd (`onda-3.md` §2 T13) |
| PDF temporário (45.0) | implícito: **bloqueante 1** |
| Log do erro de entrada (14.0) e de `reportarFalha` (56.0) | garante. Faltam só testes com sentinela (recomendação) |
| DTOs do "esperando" (37.0 a 39.0) | garante: sem nome de aluno, `.strict()`, `CapturaDeDadoPessoal`, nenhum número por professor (`onda-2.md` RF15) |
| `ops:reprocessar-job` e `ops:descartar-job` (46.0) | implícito: **bloqueante 2** |
| D62 na subida (50.0) | incompleto: **bloqueante 3** |
| Corpus `ouro` | garante: sintético, selado, escrito por outro papel (`onda-0.md` §2.1, `onda-1b.md` T11) |
| PRD §8 sobre `job_registro` | errado: **bloqueante 4** |

Bloqueantes:

1. **O PDF passa a ser guardado no storage sem ciclo de vida definido** (`onda-3.md` §2, "O PDF (45.0)", e §4). Hoje os bytes nunca são gravados (`apps/api/src/material/material.service.ts`, "O arquivo **não é guardado**"). O desenho só cobre a extração que dá certo, e ainda diz "⚠️ O órfão sai no expurgo, e a 45.0 confere", sem dizer qual expurgo nem com que idade. Faltam quatro coisas:
   - **O destino do objeto em cada caminho:** extração que dá certo; falha final (o job fica 30 dias, e o PDF?); `ops:descartar-job` de `material.extrair-pdf`; `substitui` do material que falhou (41.0); exclusão do material; e expurgo e término de contrato da escola. O `apagarArquivosDoTitular` de hoje percorre a tabela de arquivos, não o bucket, então não pegaria esse objeto.
   - **A chave do objeto:** só ids, com prefixo por escola, no armazém privado e sem URL. E a ordem das operações: apagar só depois do commit, sem deixar órfão.
   - **A retenção máxima do órfão**, escrita na linha 86 do `docs/lgpd.md`. Também é preciso corrigir o `docs/modelo-de-dados.md:569` e tirar da `onda-3.md` §4 a frase falsa de que a linha 86 já cita o PDF.
   - **Testes em `onda-3.md` §3:** o objeto sai na extração que dá certo, na falha final e no descarte, e o órfão sai pelo expurgo depois do prazo.

2. **Reprocessar e descartar job: a saída e a auditoria não têm conteúdo definido** (`onda-3.md` §2, T5, 46.0: "auditados"). O PRD §4 diz que o operador não vê dado de pessoa (D76), e o padrão de `ops:privacidade` é nunca mostrar id de titular. O desenho também não diz como o operador acha o id do job: o alerta leva só o `tipo`. A 46.0 precisa definir quatro coisas:
   - um modo de listar os jobs que falharam com só id do job, escola, tipo, código e data, nunca `dados`;
   - a auditoria no molde de `ops:retencao`: `autor_operador`, id e tipo do job, escola (ou sistema), uma referência de chamado em formato fechado como finalidade, e nunca `dados`;
   - o efeito do descarte de cada tipo: `material.extrair-pdf` marca o material `falhou` e apaga o PDF, e `titular.eliminar` volta na noite seguinte;
   - um teste com uma sentinela em `dados` que não aparece nem na saída nem na auditoria.

3. **A D62 na subida não confere a categoria de dado nem o alcance do suboperador** (`onda-3.md` §2, RF20, 50.0). Ela exige só `pais = 'BR'` e treinamento vedado. Hoje passaria um suboperador cadastrado só para `cadastro`, ou com `alcance = 'lista'` que deixa a escola de fora (`packages/nucleo/src/db/schema/suboperador.ts`). A conversa do aluno iria para um provedor que não está declarado para ela, e a lista de compartilhamento da escola sairia errada. A 50.0 precisa:
   - exigir `conversa_do_aluno` nas `categorias`, e as outras categorias que as tarefas de IA mandam;
   - exigir `alcance = 'todas'`, ou passar a conferir por escola no gateway;
   - dizer que o `LLM_MODELO_MENOR_<PERFIL>` da 49.0 usa o mesmo `IA_PROVEDOR_ID` e o mesmo endereço já conferidos na subida;
   - ter um teste para cada caso em `config.test.ts`.

4. **O PRD §8 declara errado o mapa de dados da spec.** A linha de `job_registro` diz "Já está em `docs/lgpd.md`? sim", e não está. A tabela também não tem a linha do PDF temporário. Corrigir para "não; entra na 44.0" e acrescentar a linha do PDF (coordenação e licenciante; até a extração ou o prazo do órfão; entra na 45.0). É correção de fato, não de requisito, mas é essa tabela que vai para o dossiê.

Recomendações:
- A linha de `job_registro` no `docs/lgpd.md` deve dizer também que a cópia `failed` no Redis do BullMQ vive 7 dias (`removeOnFail`, em `apps/worker/src/montagem.ts`), além dos 30 dias no Postgres.
- 14.0: um teste com sentinela num corpo inválido (chave desconhecida e tipo errado) que confira o corpo exato `{codigo}` e o log sem a sentinela.
- 56.0: `tipo` do `reportarFalha` como união fechada, não `string`.
- 53.0: o leitor do `sessionStorage` com esquema estrito e um teste das chaves exatas. A 57.0, que refaz a sessão na onda 4, deve manter, com teste, a limpeza do pendente na saída, na expiração e na troca.
- 38.0: listar no `N_task.md` os campos de cada membro da união `itens[]`.
- 1.0: o leitor do `ouro` deve exigir `fonte: z.literal('sintetica')`.
- 50.0: conferir também quando o suboperador vence com o processo no ar, e não só na subida. A permissão de uso por menor (regra 20.13) não tem campo no suboperador; registrar como pendência da D37.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/prd.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/docs/lgpd.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/docs/modelo-de-dados.md
[… 1 linhas cortadas]

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-21 15:24:08 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: login | tutor | prova | fila | IA | migration | deploy
Rate limit: ok
Fila e prioridade: problema
Concorrência: perda de resposta em `onda-3.md` §2, 51.0/53.0 (`sequencia`)
Índice e paginação: faltando
Degradação de IA: ausente (incompleta: prazo do turno, espera na fila e o degrau do modelo menor)
Migration: compatível
Métrica e alerta: faltando

Bloqueantes:

1. **Limite de IA por escola sem lugar definido, e a conta das 10h não fecha.** `onda-3.md` §2, "Limites mantidos (R39)", e `techspec.md` §7c, linhas "Limite por escola" e "Manhã de segunda".
   - Hoje as "2 execuções de IA por escola" são um contador em memória de cada processo (`ExecutorNoProcesso.rodandoPorEscola`, `packages/nucleo/src/ia/executor.ts`). O `.env.example` diz isso com todas as letras: `IA_EXECUCOES_POR_ESCOLA=2`, "em cada instância".
   - A spec não diz onde esse limite vive no `worker-ia`. Se ficar em memória, viola a regra 80.5, e o teto dobra com duas réplicas. Se for a vaga do despachante no Redis, o teto passa a ser 5, e não 2.
   - Com 2, o modelo da `docs/infra.md` §3.2 não fecha: ~4,5 turnos simultâneos por escola, ~6 s cada. Chegam 0,75 turno/s por escola e saem 0,33/s, então a fila cresce sem limite às 10h. O gargalo não são as "2 réplicas × 25".
   - **Correção exigida:** declarar que o limite de IA por escola é a vaga do despachante, compartilhada entre réplicas. Dimensionar o padrão por escola pelo §3.2, com a conta escrita e configurável por escola (D41). Dizer o que acontece com `IA_EXECUCOES_POR_ESCOLA` e `IA_EXECUCOES_TOTAL`.

2. **O teste de carga não reproduz as 10h.** `onda-3.md` §2, "Latência", e `techspec.md` §7c, "Cenário de carga".
   - A 42.0 mede a base e a 47.0 compara com ela (`p95 ≤ base + 1 s`) em `justica-entre-escolas.js`. Esse cenário tem uma escola, 1,5 turno/s e `IA_LATENCIA_FALSA_MS=300` (`infra/carga.env`).
   - Assim, nem o teto por escola nem os ~45 turnos simultâneos são alcançados. O portão passa com o desenho do item 1 quebrado.
   - **Correção exigida:** uma fase nova com várias escolas a ~0,75 turno/s cada e latência falsa de ~6 s. Threshold no p95 do turno e em `job.espera_mais_antiga_s` por escola. O `kill -9` do `worker-ia-1` roda debaixo dessa carga.

3. **Prazo do turno e espera na fila não declarados.** `onda-3.md` §2, T10 (48.0), e §3, "Provedor lento".
   - A spec não dá prazo de chamada para o perfil do Tutor. Valem os de hoje: `LLM_TIMEOUT_MS=60000` e `IA_EXECUCAO_TIMEOUT_MS=150000`.
   - Com provedor lento, chegam 7,5 turnos/s e as 50 vagas do `worker-ia` enchem em ~7 s, presas por até 60 s cada. O disjuntor só abre depois de 5 falhas de 60 s.
   - Também não há teto de espera na fila para job interativo. Um turno `pendente` espera até a varredura (2 × 150 s) e depois responde a uma pergunta velha.
   - A promessa "aviso em menos de 1 s" do §7c não vale nesse caminho.
   - **Correção exigida:**
     - prazo de chamada por perfil ou fila, compatível com o §3.2;
     - disjuntor contando timeout e chamada lenta;
     - espera máxima do job interativo de IA, e no estouro a execução termina com código tipado e o aluno vê o aviso;
     - um teste para cada um.

4. **Limitador de tokens incompleto.** `onda-3.md` §2, 49.0.
   - (a) Não diz se reserva antes da chamada, por estimativa, ou soma depois. Somando depois, as 45 chamadas simultâneas passam todas antes de contar, e o teto de 80 % não segura.
   - (b) Há um balde só (`LLM_TOKENS_POR_MINUTO`). Esgotado o balde, o "modelo menor" cai no mesmo balde e o segundo degrau da regra 80.4 nunca acontece.
   - (c) Não há prioridade entre interativa e normal (regra 80.4, `docs/infra.md` §5.4).
   - **Correção exigida:** reservar por estimativa e acertar pelo uso real. Um balde por modelo ou contrato. Fatia ou reserva para a fila interativa. Um teste para cada um.

5. **Origem de `sequencia` indefinida: troca de resposta pode se perder.** `onda-3.md` §2, 51.0 e 53.0.
   - Sem `sequencia`, "vale o relógio do servidor" (escala de época em ms). Com contador no `sessionStorage`, ele recomeça ao fechar a aba ou trocar de computador. Com o relógio do Chromebook, a máquina atrasada perde.
   - Em qualquer desses casos, a nova alternativa numa questão já respondida perde para a gravada. A spec diz que "o que perde relê e devolve o que ficou": a troca do aluno se perde (regra 80.6).
   - Hoje o upsert é "último grava" com `now()` (`minha-atividade.repository.ts:215-226`), e `RespostaLida` não devolve sequência nenhuma.
   - **Correção exigida:**
     - uma fonte monotônica que sobreviva ao F5, à aba e à máquina. Por exemplo, a leitura devolve a `sequencia` atual e o cliente continua de `max(local, servidor) + 1`; ou o servidor emite a sequência;
     - o caminho sem `sequencia` não pode concorrer em outra escala. Por exemplo, grava sem condição com `sequencia = atual + 1`;
     - testes: trocar a resposta depois do F5, num segundo computador, e um cliente sem `sequencia` seguido de outro com ela.

6. **Alertas sem a métrica que leem.** `onda-3.md` §2, T10, e `techspec.md` §7c, "Métrica e alerta".
   - A spec nomeia os alertas "Provedor de IA fora" e "Tokens acima de 80 %", mas não as métricas por trás deles. Hoje `packages/nucleo/src/telemetria/metricas.ts` não tem nenhuma métrica de IA.
   - O caminho quente novo (adaptador resiliente e `worker-ia`) não declara latência, erro por provedor, perfil e código, estado do disjuntor, nem quantas vezes cada degrau foi usado (espera, modelo menor, `IA_INDISPONIVEL`).
   - O `main-worker.ts` não diz se exporta métricas.
   - **Correção exigida:** nome e rótulos de cada métrica, sem usuário e com escola só como as métricas de job já fazem. O teste que prova a medida. Cada alerta com a sua métrica e o seu parágrafo no runbook.

7. **"Esperando" da coordenação sem teto.** `onda-2.md` §2, RF15, `GET /v1/coordenacao/esperando`.
   - O `itens[]` (incidente, contestação, convite vencido, material que falhou) não tem teto nem paginação. A rota do professor tem teto de 100 com `entregasHaMais`.
   - Contestação cresce com aluno (regra 80.8).
   - **Correção exigida:** teto por tipo com `haMais`, ou contagem no lugar da lista. O `EXPLAIN` da 38.0 cobre essas tabelas também.

Recomendações:
- **PDF (`material.extrair-pdf`):**
  - declarar `naoUrgente: false`, senão o material enviado às 10h só é lido à noite;
  - o pdfjs prende o event loop e o lote tem `lockDuration` de 30 s, então o prazo precisa ser conferido entre páginas, e é preciso tratar a reentrega por job travado;
  - ordem explícita: gravar e só então apagar o objeto.
- **Entrega dupla:** `rodando → EXECUCAO_INTERROMPIDA` mata uma execução viva se o job chegar duas vezes ao mesmo tempo. O teste "Duplicado" precisa cobrir o caso simultâneo.
- **Conexões do banco:** pools do `worker-ia` e do `worker-pdf` declarados e somados no teste de `max_connections` do compose.
- **`ops:reprocessar-job`:** `update … where estado = 'falhou'`, para duas execuções simultâneas do comando não se atropelarem.
- **N2:** medir também com o polling do Tutor das 10h, e não só no `carga:login`.
- **Profiles:** dizer que staging e produção sobem com o profile `observabilidade`, senão os alertas somem.
- **Subida com a D62:** com banco fora no boot, tentar de novo em vez de entrar em loop de queda.
- **503 do segundo fator:** a web respeita o `Retry-After` sem repetir em rajada.
- **Caminhos na onda 3:** `onda-3.md` cita `sessao/senha/contador-em-janela.ts`, que a 33.0 move para `credencial/`. Dizer onde mora o `LimiteDeTokens`: o `nucleo` não pode importar app (depcruise da 12.0).

Arquivos lidos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/techspec.md`, `onda-0.md` a `onda-6.md` e `prd.md` na mesma pasta. Conferi contra o código atual em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/packages/nucleo/src/ia/executor.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/packages/nucleo/src/config/config-ia.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/apps/api/src/atividade/minha-atividade.repository.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/infra/k6/justica-entre-escolas.js` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/infra/carga.env`.

## conformidade-reviewer · 1ª rodada · REPROVADO · 2026-10-21 15:24:14 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: não há tabela `Nota`. O resultado oficial é `entrega.estado = 'aprovada'` com `validacao_do_lote.confirmada_por`, e o gatilho adiado da `entrega` não deixa o lote ficar aprovado sem validação. Os caminhos que escrevem isso são estes:
- Aprovar, pela API. A onda 4 corta a tela na 66.0, com caracterização antes.
- A semente do e2e (`e2e/__fixtures__/governanca.ts`), que passa para `tools/testes/semente/` na 84.0 e na 85.0.
- As bancadas de integração (`apps/api/test/escola-com-tutor.ts` e outras).
- O job de correção, que grava só `correcao` num lote pendente.

O reprocessar job da 46.0 recusa `ia.*`. Todos com autor humano? sim, garantido pelo banco.

Decisão autônoma sobre aluno: ausente. Nenhuma onda cria aprovação, reprovação, encaminhamento ou sugestão aplicada sozinha.

Aprovação registrada: ok. A X5 não cria saída de IA nova (`techspec.md` §7b e §8), e a exceção da D47 continua só no Tutor.

Supervisão do tutor: há uma lacuna. A reconferência da avaliação aberta no `aoConcluir` (`onda-0.md` §2.4; `onda-3.md` §2, T9, 42.0) descarta a mensagem fixa e o sinal `atencao_humana` quando o modelo classificou o turno como `assunto_delicado`. O resto da onda 3 mantém a supervisão:
- os sinais são gravados no `concluir`, na mesma transação;
- `GET /v1/tutor/uso` não muda;
- a reentrega não roda de novo (`EXECUCAO_INTERROMPIDA`);
- o contexto vem da linha da execução;
- o realtime não tem evento hoje, então o profile da 91.0 não tira visão do professor.

Autonomia declarada e visível: sim, sem mudança (`techspec.md` §7b). Mas a tela que a mostra é cortada na 72.0 sem o `conformidade-reviewer` (bloqueante 5).

Item a item, sobre o que você pediu:
- **RF1, risco à vida (D36):** o caminho está garantido. O POST continua mandando à mensagem fixa e ao sinal antes de tudo (`tutor.service.ts:164`), e o modelo não desfaz a regra (`turno-do-tutor.ts:476`). O alvo, não (bloqueante 2).
- **RF2, D55 qualitativa:** as duas chaves de `onda-0.md` §2.3 são um desenho viável. Elas reaproveitam os detectores de entrada de `propor-ferramenta.ts:120-189`, e a reserva passa nas duas conferências. Falta o alvo (bloqueante 3).
- **RF3, S12:** a conferência no `preparar` está garantida e é coerente com o POST de hoje (`tutor.service.ts:171`). A do `concluir` quebra a D36 (bloqueante 1).
- **Trava do `ouro`:** o desenho de `onda-1b.md` (T11, 29.0) é suficiente com a checagem 3 do revisor, mas chega tarde (bloqueante 4).
- **"Esperando" (onda 2):** o contrato respeita a D45, a D64 e os itens 8 e 9 da regra 70: só `quantidade` em turmas sem professor, um item por fato, sem nome de aluno, com `.strict()`. Falta o veto de conformidade (bloqueante 5).
- **TODO (R40):** dá para aceitar fora da X5, com condição (recomendação 1).

Bloqueantes:

1. **`onda-0.md` §2.4 (RF3), repetido em `onda-3.md` §2, T9, 42.0 ("a conferência da 4.0 fica no `preparar` e no `concluir`").** O erro: no `aoConcluir`, a reconferência lança `TUTOR_PAUSADO_EM_AVALIACAO` para qualquer saída. Quando a regra deixou passar a frase e o modelo a classificou como `assunto_delicado`, isso apaga a mensagem com o 188 e o `atencao_humana`. O invariante de `tutor.service.ts:124-127` diz que "a avaliação aberta [...] não tira do aluno o encaminhamento". O RF1 amplia a regra, mas não deixa o caminho do modelo desnecessário. A correção exigida:
   - A Tech Spec diz que, no `concluir`, a saída `assunto_delicado` grava a mensagem fixa e o sinal mesmo com a avaliação aberta.
   - Só os outros turnos são descartados e não contam a troca.
   - Um teste prova o caso: a avaliação abre entre a execução e a conclusão, o adaptador roteirizado classifica `assunto_delicado`, e a mensagem fixa e o `atencao_humana` ficam gravados.
   - A seção "Falha" do RF3 em `onda-0.md` §3 ganha o caso.

2. **`onda-0.md` §2.1, "Alvo (R38)", contra o PRD RF1.** Três problemas:
   - O RF1 diz que as frases do `ouro` recebem a mensagem fixa, e a própria justificativa ("com 60 positivas e nenhuma perdida, recall ≥ 95 %") supõe zero perda. Mas o alvo é recall ≥ 0,90, o que aceita perder 6 das 60 frases de risco à vida.
   - O alvo põe precisão ≥ 0,90 com o mesmo peso, sem declarar `erraPara` (o T11 prevê "recall assimétrica"). A 2.0 pode estreitar `suicid\w*` para subir a precisão.
   - A 1.0 só imprime os números (§2.2). Nenhuma tarefa declara o teste que fica vermelho abaixo do alvo.

   A correção exigida:
   - `riscoAVida` com `erraPara: 'mais'`.
   - Recall 60/60 no `ouro`, ou pelo menos 15/15 na categoria `explícita`, com a perda tolerada escrita por categoria.
   - A precisão como meta secundária: no conflito, o recall vence.
   - Da 2.0 em diante, `ouro.test.ts` falha abaixo de `MEDIDAS.alvo` em `riscoAVida` e abaixo de `MEDIDAS.base` nas outras políticas.

3. **`onda-0.md` §2.1 e §2.3 (RF2).** `saidaQualitativa` cai em "não cair abaixo da `base`". A base é medida na 1.0, antes de `julgaTextoDeAluno` existir, então é cerca de 0 e o alvo não exige nada. O "amostras qualitativas do `ouro` barradas" do PRD fica sem número, e a regra 70.2a fica sem teste que a prove. A correção exigida: um alvo explícito para `saidaQualitativa` em `MEDIDAS.alvo`, com recall nas positivas (as que têm texto de aluno na conversa) e nenhuma das 20 ou mais legítimas barrada (rubrica, critérios, lote, correção cega). O `ouro.test.ts` falha fora disso a partir da 3.0.

4. **`onda-0.md` §5 contra `onda-1b.md` (T11, 29.0).** A trava que impede mexer no `ouro` junto com o padrão (`selo.test.ts`, `tools/guardas/ouro-separado.ts` e a checagem do revisor) nasce na 29.0, na onda 1B. As tarefas que mais precisam dela, a 2.0 e a 3.0, mudam o padrão até bater no `ouro` e rodam antes, na onda 0. A 29.0 depende só da 1.0. A correção exigida: a 29.0 vai para a onda 0, entre a 1.0 e a 2.0/3.0. Se não for possível, a Tech Spec exige que a 2.0 e a 3.0 confiram o `SELO.json` e tragam `git log <base>..HEAD -- docs/aia/ouro` vazio como parte do veto de conformidade.

5. **Vetos de `onda-2.md` §5 (38.0) e de `onda-4.md` §5 (72.0, 74.0 e 79.0).** Estas tarefas tocam superfícies da regra 70 sem o `conformidade-reviewer`:
   - 38.0 e 79.0: o "esperando" da coordenação, que a própria spec ancora nos itens 70.8 e 70.9.
   - 72.0: `PainelDoProfessor` (indicador do professor, D45), `Agentes` (autonomia visível, 70.5), `Governanca` (auditoria, 70.6) e `Analista` (alertas sobre aluno).
   - 74.0: `Artefato` e `Conversa`, o que o professor vê antes de aprovar e a recusa da D55.

   A regra 70 manda o revisor auditar toda tarefa de autonomia, indicador de professor e correção. A correção exigida: incluir `conformidade` no veto dessas quatro tarefas. Na 38.0, o teste também prova que nenhum item do `/v1/coordenacao/esperando` deriva de uso, entrega ou atividade do professor. Hoje esse invariante está só no comentário de `apps/web/src/areas/coordenacao/fila-da-coordenacao.ts:21-24`, que a 79.0 apaga.

Recomendações:

1. **TODO da R40, saída do Tutor sob a D55.** A falta de conferência na saída é anterior à X5. Dá para aceitar fora dela porque não existe modalidade discursiva ou redação no produto, o Tutor trava em avaliação e o dado é sintético. Mas o item de `TODO.md` ("Da X5, fora dela") não tem prazo:
   - dar a ele "antes de aluno real", como o item da leitura humana do `ouro`;
   - aplicar já `atribuiNotaOuConceito` no `conferir` do Tutor: é uma linha, e o falso positivo temido ("você errou 3 questões") é da conferência qualitativa, não da de nota;
   - registrar a limitação em `docs/aia/tutor.md`.
2. **Leitura humana do `ouro` (R40).** Hoje quem escreve e quem revisa o corpus são modelos. Incluir o item no portão da primeira escola real, e não só no `TODO.md`.
3. **`onda-1b.md` T11.** `AFIRMA_SER_PESSOA`, `SIMULA_VINCULO` (D58, 70.4a), `ENTREGA_A_RESPOSTA` e `CONFIRMA_OU_NEGA` (regra 30.11) ficam fora do módulo de políticas, sem mutação nem `ouro`. Dizer por quê, ou incluí-los.
4. **`onda-5.md` 84.0 e 85.0.** A semente `direto` não pode usar `session_replication_role` nem desligar gatilho. Um lote aprovado só nasce com `validacao_do_lote` confirmada por alguém da equipe.
5. **`onda-2.md` RF15.** Deixar `/v1/professor/esperando` só para o professor, ou provar que a coordenação que chama essa rota não recebe nada de outro professor. O backlog de entregas pendentes por professor não pode chegar à coordenação (D45 e D64).
6. **`onda-0.md` §4.** A medida do RF2 é da conferência do Assistente. Ela cabe na AIA que cobre a função de correção do Assistente, e não só em `correcao-de-objetiva.md`.
7. **`onda-3.md` 49.0.** Dizer que o `LLM_MODELO_MENOR_<PERFIL>` passa pelas mesmas conferências e pela mesma declaração da D62 da 50.0.

Arquivos auditados, todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/`:
- `tasks/prd-reengenharia/prd.md`, `techspec.md` e `onda-0.md` a `onda-6.md`
- conferidos no código: `apps/api/src/tutor/tutor.service.ts`, `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`, `packages/nucleo/src/ia/tarefas/propor-ferramenta.ts`, `packages/nucleo/src/db/schema/correcao.ts`, `packages/nucleo/src/db/schema/validacao-do-lote.ts`, `apps/web/src/areas/coordenacao/fila-da-coordenacao.ts`, `apps/web/src/areas/professor/fila-do-professor.ts` e `TODO.md`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-21 15:24:40 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:** Cada RF1 a RF33 precisa de um teste que falhe sem a regra. Precisam de teste os cinco casos de borda do PRD §7: professor abre a prova com dúvida na fila, F5 com a rede caída, worker morto no turno, eliminação de menor que falha cinco vezes, e "tô triste". A concorrência precisa de chamadas em paralelo de verdade na troca de material, no job entregue duas vezes (IA e PDF) e no envio da prova fora de ordem. Toda rota nova precisa de um cenário na escola sem ano letivo em curso. A que lê vínculo ou turma precisa também de um vínculo encerrado ao lado de um aberto, de um professor com duas disciplinas na mesma turma e de duas escolas. Refatoração precisa de caracterização antes. Teste removido precisa dizer o que continua protegendo. Cada mecanismo novo precisa da mutação que prova a trava.

**Cobertos (garantidos no desenho):**
- **RF3 (S12):** avaliação aberta nas duas janelas (onda-0 §3).
- **RF5:** boot com controller sintético e ordem dos erros caracterizada antes (16.0).
- **RF6:** registro nos dois sentidos e OpenAPI comparado byte a byte.
- **RF7:** campo extra, e campo obrigatório ausente sem repetir.
- **RF8:** dado inválido recusado nos dois lados.
- **RF9:** analisador por AST com fixtures negativas, lista que só encolhe, isolamento A/B na 8.0.
- **RF10:** fixtures e a aresta real que prova que o `typescript` foi achado.
- **RF11:** catraca com `TETO` e a segunda passada que ignora `eslint-disable`.
- **RF12:** mutação por padrão, metamórficos, `SELO` e `ouro-separado`.
- **RF13:** knip e a regra de `throw`.
- **RF14:** `tsc` e depcruise contra o caminho antigo.
- **`substitui` (41.0):** `Promise.all`, id de outra escola, material `pronto` e `CONFLITO`.
- **RF16:** a trava do `AppModule` sem `LLM_PROVIDER`.
- **RF17:** o prazo com a definição injetável, e o SIGTERM.
- **RF18:** alerta e expurgo com 29 e 31 dias.
- **RF19:** provedor lento, 429 com e sem `Retry-After`, disjuntor com relógio falso.
- **RF20:** `config.test.ts`.
- **RF21:** F5 com pendente, outro dono, PUT pendurado.
- **RF22:** Redis fora sem gastar tentativa.
- **RF23:** o teste antes do corte, com as mutações de duplo clique e de rejeição.
- **RF25:** rede pendurada e componente que lança na rota pública, na área e na casca.
- **RF26 a RF31:** cobertos.
- **Casos de borda do PRD:** 1, 2 e 3 cobertos.
- **Isolamento:** 8.0, 37.0 a 39.0, 41.0 e 47.0.

**Bloqueantes:**

1. **Teste do `ouro` sem limite (onda-0 §2.1 e §2.2, RF1 e RF2).**
   - **O que está errado:** a 1.0 só "imprime" recall e precisão. Nenhum teste fica vermelho com recall abaixo do `alvo` (`riscoAVida` ≥ 0,90 e ≥ 0,90) ou abaixo da `base` (as outras políticas). Medir sem limite não é teste (regra 40, "Testar coisa que é probabilística").
   - **Correção exigida:** a partir da 2.0 e da 3.0, `ouro.test.ts` falha quando recall ou precisão de cada política fica abaixo do que está em `MEDIDAS.json`. Isso vale também para as 20 ou mais amostras legítimas de `saidaQualitativa` (os falsos positivos do RF2).

2. **Caso de borda "tô triste" sem teste próprio (PRD §7, onda-0 §2.2).**
   - **O que está errado:** a única proteção é a precisão ≥ 0,90, que aceita até uns 6 falsos positivos entre as 40 negativas. "Tô triste" pode passar a receber o CVV e o teste continua verde. Não há hoje nenhum teste com essa frase em `turno-do-tutor.test.ts`.
   - **Correção exigida:** a 2.0 ganha amostras `dev` que exigem `ehAssuntoDelicado` verdadeiro e `mencionaRiscoAVida` falso para "tô triste", e o turno devolve a orientação sem CVV. Vale também para "suicídio na Revolução Francesa", decidido no `ouro`. As 5 frases do `it.each` de hoje (`:324`) continuam.

3. **RF4 sem como provar a mutação (onda-0 §2.5 e §3).**
   - **O que está errado:** o desenho não diz onde mora o teste do hook. Não diz que ele executa o comando **lido de `.claude/settings.json`**, e um teste que copia a string não fica vermelho se a linha do `settings.json` for revertida. O commit da 5.0 fica fora de `PASTAS_DE_CODIGO` (`revisoes.ts:41`), então o hook não exige o carimbo, e a mutação nunca passa pelo portão.
   - **Correção exigida:** o teste vive em `tools/processo/`. Ele roda o comando real com `CLAUDE_PROJECT_DIR` apontando para uma cópia com import quebrado e exige saída 2. Com a cópia sã, exige 0 e o `deny` intacto. A 5.0 roda o `portao-local.ts --tarefa` com a mutação "tirar o `|| { …; exit 2; }`", mesmo sem o hook exigir.

4. **A 12.0 tira cercas de isolamento sem substituto (onda-1a §T7, "O que sai de `apps/api/test/arquitetura.test.ts`").**
   - **O que sai:** o `describe` "a resolução de tenant fica dentro do módulo de sessão" (`arquitetura.test.ts:58`), as duas cercas da `ContaGlobalRepository` (`:109`, `:122`) e as do `PainelRepository`, que é a leitura entre escolas (`:179`, `:183`).
   - **O que está errado:** nenhuma das regras de depcruise listadas na 12.0, nem as de `.reengenharia/medicao/depcruise.cjs`, restringe quem importa essas três classes. Hoje a varredura de texto também cobre `tools/`, `infra/`, `e2e/` e `import()` dinâmico, e o depcruise roda só em `apps packages`. Além disso, a onda-2 (`sessao/tenant/`) ainda cita `arquitetura.test.ts:22` como a cerca. É trava da regra 10.9 removida sem dizer o que continua protegendo.
   - **Correção exigida:** escolher um dos dois caminhos.
     - Manter esses `it` até existir regra equivalente no `camadas.cjs`, com fixture que prove cada uma.
     - Ou listar as regras novas (só `sessao/tenant/` importa a Resolução, que o `sessao/index.ts` não reexporta; só `sessao/` e `ciclo-de-vida/` importam a conta global; só `painel.service.ts` importa o `PainelRepository`), com a mutação de cada uma.

5. **Faltam cenários nas rotas do "esperando" (onda-2 §2 RF15, §3 e §4).**
   - **37.0 (`GET /v1/professor/esperando`) lê vínculo e turma, e faltam três cenários:**
     - professor com vínculo encerrado na turma X e confirmado na Y: só a Y aparece;
     - vínculo do ano anterior, na virada de ano letivo;
     - professor com duas disciplinas na mesma turma: a turma aparece uma vez, e as contagens de `entregas` e `pedidosDeNome` não dobram pelo `join`.
     Também falta o teste do vínculo pendente: a turma só aparece em `vinculosAConfirmar`.
   - **38.0 (`GET /v1/coordenacao/esperando`):** não tem cenário sem ano letivo em curso (nenhum, `planejado`, `encerrado`). Hoje esses casos estão em `fila-da-coordenacao.test.ts:186` e `SinoDaCoordenacao.test.tsx:161`, que a 79.0 apaga.
   - **39.0 (`/v1/escola/roteiro`):** não tem o vínculo encerrado para `passos.vinculo`.
   - **Correção exigida:** os casos acima entram nas 37.0, 38.0 e 39.0. Os casos dos testes da web que a 79.0 apaga são portados antes para a API, citados pelo nome.

6. **Prazo de 15 dias do titular sem teste previsto (onda-2 §2 "O prazo do titular", 40.0, RF15).**
   - **O que está errado:** o cálculo sai da web, onde `textos-do-pedido.test.ts:50-115` prova regras de prazo legal: o dia do vencimento ainda é prazo, fim de mês e de ano, e "agendado tem prazo como qualquer aberto". A onda-2 §3 não tem linha para o prazo.
   - **Correção exigida:** a 40.0 porta esses casos para a API com relógio falso. Acrescenta o pedido que chega perto da meia-noite em São Paulo (`diaDeUso`, entre UTC e SP), e só depois apaga os da web.

7. **A eliminação de menor que falha cinco vezes não tem teste e contradiz a retenção (PRD §7 × RF18; onda-3 §2 T5 e §3).**
   - **O que está errado:** a onda-3 só testa o alerta genérico e o expurgo com 29 e 31 dias. O caso de borda diz que "o rastro fica até ele agir", e a 44.0 apaga `falhou` em 30 dias. Um pedido de eliminação que falhou sumiria sem atendimento.
   - **Correção exigida:** um teste com `titular.eliminar` falhando nas cinco tentativas, que exige a linha `falhou`, `job.falhos{tipo="titular.eliminar"}` e o alerta. A retenção desse tipo fica decidida e testada: ou não expira sem ação, ou volta ao Arquiteto.

8. **Faltam testes na 46.0 (onda-3 §3, "Falha final").**
   - **O que está errado:** só "reprocessar conclui" está previsto. Sem teste: `ops:descartar-job`, a recusa de job `ia.*`, a auditoria dos dois comandos, e que a cópia `failed` no BullMQ saiu (a reconciliação, `reconciliacao.ts:119-129`, não volta a marcar `falhou`).
   - **Correção exigida:** um teste para cada um desses quatro.

9. **A 45.0 (PDF no worker) não tem teste de falha nem de isolamento (onda-3 §2 e §3, techspec §6).**
   - **O que está errado:** `varrerParados` sai sem dizer o que passa a proteger o material preso em `processando`. Também não há previsão de:
     - job `material.extrair-pdf` entregue duas vezes, em paralelo, gravando os trechos uma vez só;
     - prazo estourado ou `worker-pdf` morto, com o material terminando `falhou` para a coordenação poder usar o `substitui`;
     - objeto apagado do storage depois de ler e depois de falhar;
     - o processador tirando a escola da linha do job, nunca do payload, num teste com `materialId` de outra escola. A techspec §6 só cobre a 47.0.
   - **Correção exigida:** os quatro testes acima.
[… 43 linhas cortadas]

## frontend-reviewer · 2ª rodada · AJUSTES NECESSÁRIOS · 2026-10-21 15:36:50 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS
Tela vista: não (revisão de spec, sem foto; só código e documentos)
Estados: ok. A `<Leitura>` tem a tabela consulta→estado com um teste por caso em `onda-4.md` §2.4. A falha tem tela com "Tentar de novo" (§3), e o contrato quebrado na prova diz o que fazer.
Acessibilidade: ok. "Recarregar" fica com alvo de 44 px, o foco volta no erro (`useFocoAoRecuperar` só na leitura `principal`) e o e2e é à mão nos dois projetos.
Chromebook fraco: ok. Há trava de API acima do Chrome 99, medição de chunk, `comPrazo` sem `AbortSignal.timeout`, e o sino cai de 14 chamadas para 1.
Celular: ok. A vitrine e o e2e nos dois projetos cobrem o corte, e o alvo de 44 px na ação principal está declarado.
Ação oficial protegida: sim, no desenho.

Conferência das correções do meu achado:

- **C28 (resolvida):** `onda-3b.md` T13, 51.0. A leitura devolve a `sequencia` e o cliente segue de `max(local, servidor) + 1`. O caminho sem `sequencia` grava `atual + 1`. O upsert só grava com `excluded.sequencia > atual`. A tabela de falhas cobre 5 e 7 em `Promise.all`, F5, outra aba, outro computador e cliente antigo seguido do novo.
- **C29 (resolvida):** `onda-3b.md` 53.0 e `onda-4.md` §2.4. O espelho é limpo no envio, no "Sair" e na troca de dono, e não na sessão vencida. A chave é por atividade e guarda só ids. A tabela de falhas tem o caso de sessão vencida com o mesmo dono e com outro.
- **C33 (resolvida):** `onda-4.md` §2.2, item 1. A 60.0 declara cinco mutações para Aprovar. Conferi no código: `Aprovar.tsx:163`, `:417` e `:446` existem como descritos.
- **C35 (resolvida no desenho):** 57.0, 58.0 e 59.0 só criam o mecanismo, e a migração entra em cada corte, depois da caracterização. Resta um buraco de ordem, na Recomendação 1.
- **C34 (parcial, bloqueante abaixo).**

Bloqueantes:
1. `onda-4.md` §2.6 (79.0) e `onda-4.md:93-98`. A C34 pedia a tabela dos estados do sino com os textos antes e depois. O que veio é uma frase corrida sobre o professor, sem os textos. Falta o seguinte:
   - **Textos.** `fila-do-professor.ts:100-119` e `fila-da-coordenacao.ts:77-133` têm textos que a pessoa lê: "Correção para revisar", "Versão adaptada para decidir", "Pedidos de nome para decidir", "Confirme sua turma", "N ou mais pedidos esperando a decisão", "Incidente de segurança sem confirmação", "<Nome> contestou a turma" e "Uma turma sem professor". A spec não diz se cada um continua igual.
   - **Coordenação.** A fila da coordenação não tem estado nenhum listado, nem os da `parcial` e do `erro` de `fila-da-coordenacao.ts:161-165`. O §2.6 afirma que a coordenação "vira um `useQuery`" mas só enumera os estados do professor.
   - **`leituraPorTurma`.** `fila-do-professor.ts` guarda o que impede o cartão de Turmas de dizer "Em dia" sem ter lido tudo (comentário "9.0"). A spec não diz o que acontece com isso quando saem as leituras por turma.
   - **`sino-por-area.test.tsx`.** Ele afirma hoje as rotas que cada papel lê (`/v1/vinculos`, `/v1/entregas` e outras). A 79.0 muda essas rotas, mas a spec nomeia só os dois e2e e esquece este teste. A C34 pedia o `sino-por-area` mantido.
   - **O risco.** O sino é a fila de itens que esperam decisão oficial, e a regra da fila é "nunca 'Tudo em dia' sem ter lido tudo". Houve duas correções do sino em 19/10 (`tasks/correcoes/2026-10-19-sino-*`).
   - **Correção exigida.** Escrever em `onda-4.md` §2.6 uma tabela, um papel por bloco, com estado, texto antes, texto depois e "mudança aceita" ou "igual". Ela deve cobrir os quatro tipos de item do professor, os cinco da coordenação, `parcial`, `erro`, `carregando`, "Em dia" por turma, "sem ano letivo" e "100 ou mais". Nomear `sino-por-area.test.tsx` como reescrito para uma chamada por papel, com a regra de que o professor não lê nenhuma rota da coordenação. Adicionar `conformidade` ao veto da 79.0, o que já existe. Dizer qual teste prova cada linha da tabela.

Recomendações:
1. `onda-4.md` §5, dependências: 75.0 a 78.0 dependem só de 62.0, 63.0 ou 64.0, e 78.0 não depende de 57.0 a 59.0. Os cortes usam `<Leitura>`, `Botao` com `como` e `useSessao`, então escrever "a leva 2 só começa com a 59.0 e a 58.0 prontas" ou listar as dependências. Sem isso, as linhas em paralelo podem começar um corte antes do mecanismo.
2. `onda-4.md` 60.0: o título cobre Time e Aplicação, mas só Aprovar tem mutações declaradas. Time e Aplicação decidem entrega ao aluno (regra 70, item 3), então declarar as mutações de cada uma (trava de duplo clique e resumo antes de confirmar).
3. `onda-3b.md` 51.0: quando duas abas ou dois computadores empatam na mesma `sequencia`, o PUT perde e o servidor devolve o que ficou. Dizer o que o aluno vê (a escolha volta à gravada, com aviso) e testar na interface.
4. `onda-4.md` 73.0 e 74.0 dependem só da 59.0 e não citam o teste que antecede o corte. Os testes existem (`AlunosDaTurma.test.tsx`, `Artefato.test.tsx`, `Conversa.test.tsx`), mas a spec deve nomear que eles valem como caracterização e quais mutações cada um declara.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-4.md`, `onda-3b.md` e `revisao-spec.md`.

## tenancy-guardian · 2ª rodada · REPROVADO · 2026-10-21 15:37:50 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: nenhuma tabela nova. `resposta_atividade.sequencia` (onda-3b.md, 51.0) entra numa tabela que já tem `escola_id` e `ano_letivo_id`. `job_registro` só muda de retenção. O objeto `material-temporario` no storage leva o prefixo da escola (onda-3a.md:81). `substitui` e `@IdDoCaminho` aceitam só uuid.

Queries verificadas:
- **Feitas:**
  - C8: as três cercas no `camadas.cjs`, com fixtures de import, reexport e `import()` e uma mutação por cerca (onda-1a.md:72-75 e :83-91).
  - C9: a regra para os `index.ts` (onda-2.md:43-44).
  - C10: o alcance por disciplina das entregas (onda-2.md:66-68).
  - C15: a escola vem de `job_registro.escola_id`, a leitura de `execucao_agente` passa a ter escopo, e o `ExecucaoRepository` sai da lista na 47.0 (onda-3a.md:36-40; onda-1a.md:39).
  - C17: a chave com prefixo, a tabela de destino do objeto, o órfão em 24 h e a correção nos dois docs (onda-3a.md:80-100; prd.md §8).
  - C18: o teste de outra escola, o duplicado, prazo e worker morto, o que substitui `varrerParados` e `naoUrgente: false` (onda-3a.md:82, :97 e :119-121).
  - C37: techspec.md §6, §7, §7c e §8.
- **Vistas de novo:** `ops:*` (onda-3b.md:23-29) e a vaga por escola no Redis (onda-3a.md:56-62).

Teste de isolamento: presente, mas inútil nos dois workers como está descrito. O resto está presente e efetivo: as portas de IA, o "esperando" e o `substitui`.

Bloqueantes:

1. **`onda-1a.md:77-81` (12.0): as pastas da trava se contradizem.**
   - **O erro:**
     - A linha 77 diz que o depcruise roda em `apps packages tools infra e2e`, como a varredura de hoje (`arquitetura.test.ts:33`).
     - A linha 80 fixa o comando `depcruise --config tools/guardas/camadas.cjs apps packages`.
     - Com o comando escrito, um import da Resolução ou da conta global em `tools/`, `infra/` ou `e2e/` deixa de ser pego. A cerca fica afrouxada, contra a techspec.md §6 ("nenhuma é afrouxada").
   - **Correção:** o `guarda:camadas` roda nas cinco pastas. Uma fixture fora de `apps/` e `packages/` (por exemplo `tools/x.ts` importando a Resolução) fica vermelha.

2. **`onda-2.md:43-44` (34.0): a regra dos `index.ts` só pega o reexport direto.**
   - **O erro:** uma regra de aresta no depcruise (`sessao/index.ts` → `resolucao-de-tenant.repository`) não vê a cadeia de dois passos.
     - Exemplo: `sessao/index.ts` faz `export * from './tenant/index.js'`, e `sessao/tenant/index.ts` reexporta a Resolução.
     - A cerca da 12.0 continua verde, porque todos esses arquivos estão em `sessao/**`.
     - Mesmo assim, quem está fora de `sessao/` recebe a Resolução pelo barril. É o buraco do achado 4 da rodada 1, fechado só pela metade.
   - **Correção (34.0):** um teste em tempo de execução, no molde de `arquitetura.test.ts:122-134`. `Object.keys` e `Object.values` de `await import('…/sessao/index.js')` e de `credencial/index.js` não contêm `ResolucaoDeTenantRepository` nem `ContaGlobalRepository`, com o nome delas ou com outro. Ou então a regra do depcruise proíbe a aresta de tipo `export` para os dois repositories a partir de qualquer arquivo de `sessao/**` e `credencial/**`.
   - **Mutação:** um reexport em dois passos, que tem de deixar o teste vermelho.

3. **`onda-3a.md:116` e `:119` (47.0 e 45.0), com `techspec.md` §6: as mutações declaradas não ficam vermelhas.**
   - **Na IA:** tire o `escola_id` da leitura de `execucao_agente`. A linha da escola B é lida, mas `papel` é relido do `usuario` da escola do contexto (onda-3a.md:42). O `solicitadaPor` da B não existe na A, então a execução cai em `NAO_ENCONTRADO`. Resultado: nenhuma chamada e nada em `consumo_ia` nem em `entrega`, e o teste continua verde.
   - **No PDF:** tire o `escola_id` da leitura do material. Se a chave do objeto vem do contexto, a leitura do storage falha com o prefixo da escola A. A marcação de `falhou` tem escopo e não afeta a B, e "nada da B muda" continua verde. Se a chave vem da linha, os bytes da B são extraídos, e o que é gravado sob a A não entra na asserção. A asserção "nada da B muda" também perdeu o "nada extraído" que a rodada 1 exigiu.
   - **Correção exigida:**
     - Um teste de integração no nível do repository para as duas leituras que os processadores usam: com o contexto da A e o id da B, a leitura volta vazia. É esse teste que leva a mutação "tirar o `escola_id`".
     - O teste do job continua, com estas asserções:
       - na IA, a execução da B segue `pendente`;
       - no PDF, `lerBytes` não é chamado e o extrator também não;
       - nenhum trecho com aquele `materialId` existe em escola nenhuma;
       - estado, trechos e objeto da B ficam intactos.
     - Escrever que o processador do PDF monta a chave com `exigirEscolaDoContexto()`, e não com o `escola_id` da linha.

Recomendações:
- **Testes fora das cercas** (`onda-1a.md:75`, "Teste fica de fora"): hoje a cerca da Resolução vale também para teste (`arquitetura.test.ts:52`), e a da conta global fecha a lista exata de quem a importa (`:96-101`). Declarar essa troca, ou manter a lista fechada da conta global.
- **Varredura do órfão em 24 h** (`onda-3a.md:95`): ela percorre o storage de todas as escolas. Dizer se ela parte das linhas de `job_registro` (com `escola_id`) ou se lista o bucket. No segundo caso, ela é rotina sem escopo e entra no ADR, com motivo.
- **`ops:descartar-job` no PDF** (`onda-3b.md:27`): marcar `falhou` e apagar o objeto dentro de `escopoDoJobNoContexto` da escola do job, e não por um update sem escopo.
- **Exclusão de material ainda `processando`** (`onda-3a.md:94`): hoje o objeto só sai pela varredura de 24 h. Apagar o objeto na própria exclusão, ou dizer que o job, ao achar o material excluído, apaga o objeto e encerra.
- **Métodos sem escopo dos `ops:*`** (`onda-3b.md:116`): listar os métodos na spec, e não só no ADR da onda 6. O `nucleo/fila` já passa de três `@SemEscopo` (regra 10.9).

Arquivos auditados, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/`: `prd.md`, `techspec.md`, `onda-1a.md`, `onda-2.md`, `onda-3a.md` e `onda-3b.md`, e a referência `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/apps/api/test/arquitetura.test.ts`.

## infra-guardian · 2ª rodada · REPROVADO · 2026-10-21 15:38:18 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: tutor | prova | fila | IA | migration
Rate limit: ok
Fila e prioridade: problema
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: ok
Migration: compatível
Métrica e alerta: faltando
Bloqueantes:
1. **O prazo dos jobs de IA foi escrito por fila, e devia ser por perfil (a C22 está incompleta).** Está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md`, §2, "48.0, O orçamento", linhas 43-44. A conta liga o `rapido` (48 s) ao `ia.executar-agente` (`prazoMs` 60 s) e o `padrao` (128 s) ao `-normal` (150 s). Só que o `onda-3a.md`, §2, "A publicação", linha 49, manda para o `-normal` apenas o Analista. As três ferramentas do professor que usam `padrao` caem no `ia.executar-agente`: `gerar-plano-de-aula.ts:91`, `gerar-atividade-objetiva.ts:232` e `adaptar-atividade.ts:66`. Nessas três, o pior caso é 128 s e o prazo do job é 60 s. Resultado: com o provedor lento, o plano de aula morre com `TEMPO_ESGOTADO` antes de o adaptador terminar. Hoje são 150 s para todas (`IA_EXECUCAO_TIMEOUT_MS`), então isso é regressão.
   - **Correção exigida:** o `prazoMs` do job de IA sai do perfil da tarefa e não da fila, ou o pior caso do `padrao` cabe no job interativo. O teste "`prazoMs` acima do pior caso" percorre cada `TarefaDeIa` contra a fila em que ela é publicada.

2. **A vaga de 10 por escola só contou o Tutor (a C30 está incompleta).** Está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md`, §2, "O limite por escola", linhas 58-60, e em "Latência e carga", linha 104. A conta de 4,5 simultâneos × 2 de folga, e a `FASE=sala`, consideram só o Tutor. Na mesma `VAGAS_ESCOLA_INTERATIVA` correm as ferramentas `padrao` do professor, que duram até 60 s ou mais cada uma.
   - **O que acontece às 10h:** cinco professores gerando plano no intervalo deixam 5 vagas para uma carga média de 4,5. A fila do Tutor passa dos 20 s, e os alunos recebem `IA_INDISPONIVEL`. O k6 não pega isso, porque só simula o Tutor.
   - **Correção exigida, uma das duas:**
     - pôr as ferramentas do professor na conta escrita (ritmo por escola às 10h e duração), e fazer a `FASE=sala` rodá-las junto com o Tutor, com threshold na espera do Tutor;
     - ou separar ou reservar vagas para o Tutor dentro da interativa (`docs/infra.md` §5.4: "tutor em sala passa na frente").

3. **O corte de 20 s deixa o alerta de espera cego, e o risco da escola grande fica sem aviso.**
   - **Onde:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md`, linha 63 (o corte de 20 s) e linha 142 (o risco: "a espera por escola alerta"), e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/techspec.md`, §7c, linha 123.
   - **O alerta existente:** `infra/grafana/alertas/job-interativo-esperando.yaml` dispara com espera acima de 30 s por 1 minuto (`docs/runbook.md:36-40`).
   - **Por que ele não dispara:** com o corte em 20 s, o job velho chega à vaga, morre e libera a vaga na hora. A espera do mais antigo fica em torno de 20 s e nunca chega aos 30 s.
   - **O furo:** a escola saturada devolve `IA_INDISPONIVEL` aos alunos sem nenhum alerta. A `ia.degradacao{degrau}` não tem `escola_id` e não tem alerta.
   - **Correção exigida:** um alerta por escola sobre o degrau da espera máxima, ou um limite do alerta de espera abaixo de 20 s para os jobs `ia.*`. Ele vem com o parágrafo no runbook, que manda subir `configuracao_operacional_escola.vagas.interativa` daquela escola, e com o caso em `alertas.int.test.ts`.

Recomendações:
- A frase "a vaga por escola configurável (D41) fica para quando houver tabela" (`onda-3a.md:61-62`) está errada. A tabela já existe: `packages/nucleo/drizzle/0001_configuracao_operacional_escola.sql`, coluna `vagas` com a chave `interativa`, sobre o padrão de `VAGAS_ESCOLA_INTERATIVA`. Corrigir a frase e citar essa sobreposição como a saída para a escola grande.
- O `techspec.md:118` diz "pela conta de `onda-3b.md`". A conta está no `onda-3a.md`.
- O `docs/infra.md` §5.3 ainda diz "interativa 5": entra na 47.0 junto com o padrão novo.
- O `ops:descartar-job` precisa da mesma condição `where estado = 'falhou'` do reprocessar.
- O `onda-3b.md` §5 tem o cabeçalho da tabela de tarefas duplicado, com uma frase no meio.
- Confirmar que o pdfjs no `worker-pdf-1` não prende o event loop além do intervalo de stalled numa página grande. Se prender, dá falsa reentrega.

Conferência da rodada 1:
- **Resolvidas sem buraco novo:** C12 (`onda-2.md:75`, :109, :120), C18, C19, C23 (no tempo de espera; o alerta está no bloqueante 3), C24, C27, C28 e C31.
- **C32:** nomes, rótulos, teste, runbook e exportação pelo `main-worker` estão feitos. Falta o alerta do bloqueante 3.
- **Ficam abertas:** C22 (bloqueante 1) e C30 (bloqueante 2).
- **A conta da C30 contra `docs/infra.md` §3.2:** 7,5 ÷ 10 × 6 = 4,5, e 2 × 25 = 50 ≥ 45. Ela fecha para o Tutor sozinho, não para a vaga compartilhada.
- **A migration da 51.0** (`bigint not null default 0`) não reescreve a tabela e funciona com o código anterior.

## llm-integrator · 2ª rodada · AJUSTES NECESSÁRIOS · 2026-10-21 15:38:23 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Perfis usados: nenhum perfil nem prompt novo. Hoje: `rapido` (Tutor, `propor_ferramenta`, `relatorio_da_correcao`) e `padrao` (`adaptar-atividade`, `gerar-plano-de-aula`, `gerar-atividade-objetiva`, `resumo-do-analista`). O "modelo menor" da 49.0 fica no mesmo perfil, por `LLM_MODELO_MENOR_<PERFIL>`.

Custo estimado por professor/mês: a spec não traz número (bloqueante 3). Minha estimativa, com premissas minhas que o Arquiteto deve confirmar:
- **O que muda:** a RF2 soma no máximo +1 chamada `rapido` (~2 mil tokens) por devolutiva barrada, e só no Assistente.
- **Volume:** com ~150 pedidos por professor por mês e ~5 % barrados, são ≤ 8 chamadas extras, ou ~16 mil tokens por professor por mês. É ordem de centavos de real, porque o preço depende da D37, ainda em aberto.
- **O que reduz:** o fim da repetição em 5xx e em timeout (48.0) e a frase de risco à vida que deixa de ir ao modelo (RF1).
- **Efeito líquido:** perto de zero. O Tutor segue em ~3.250 tokens por troca, até 300 por aluno por mês.

Prompt versionado: sim. A 42.0 fixa as mensagens montadas e o hash de cada `PROMPT_*` contra a `versao`, na 42.0 a 47.0 e na 26.0 e 27.0 (`onda-3a.md`, "O prompt (C25)").
Validação de schema: sim (`DefinicaoDeTarefa`, `IA_SAIDA_INVALIDA`, `reservaQuandoInvalida`; sem mudança).
Aprovação humana no caminho: sim. A entrega nasce `pendente` (caracterização antes de mover o `aoConcluir`) e a D47 do Tutor se mantém.

### Correções da rodada 1 (as minhas)

- **C1, C3, C4:** resolvidas no desenho.
  - O `MEDIDAS.alvo` está escrito para as três políticas novas, e o `selo-do-ouro.test.ts` nasce na 1.0.
  - O `SELO.json` agora cobre o `MEDIDAS.json`, e o `README` do `ouro` concorda com o alvo.
  - Resta o bloqueante 2 e as recomendações 1 e 2.
- **C15, C16:** resolvidas.
  - A escola vem de `job_registro.escola_id`, e `execucao_agente` é lida com `escola_id = exigirEscolaDoContexto() and id`.
  - `ExecucaoRepository` sai da lista de exceções, o `papel` é relido e `solicitadaPor` nulo falha fechado com `NAO_ENCONTRADO`.
  - Há teste com o `execucaoId` de outra escola, com mutação, e com usuário eliminado.
- **C21, C24, C25, C30:** resolvidas.
  - C21: a D62 cobre `conversa_do_aluno` e `alcance = 'todas'`, com um caso por ramo.
  - C24: `LimiteDeTokens` virou porta com implementação na API, e a sequência espera de 8 s, modelo menor, `IA_INDISPONIVEL` tem teste.
  - C30: a conta das vagas está escrita (7,5 ÷ 10 × 6 s × 2, arredondada para 10).
- **C22:** parcial, ver bloqueante 1.
- **C26:** resolvida no desenho, com a ressalva da recomendação 3.
- **C37:** parcial. §6, §7 e §7c estão feitos, mas a estimativa da §8 não (bloqueante 3).

Bloqueantes:

1. `onda-3a.md` §2 "O worker da API (45.0 e 47.0)" e `onda-3b.md` §2 "48.0 (C22)": `prazoMs` de 60 s para `ia.executar-agente` contradiz o pior caso do `padrao`.
   - **O que está errado:** o job só tem dois tipos, `ia.executar-agente` (60 s) e `-normal` (150 s, "para o Analista"). Mas `gerar-plano-de-aula`, `gerar-atividade-objetiva` e `adaptar-atividade` são `padrao` e rodam com o professor esperando, ou seja, na fila interativa. O orçamento do `padrao` é 128 s e o `LLM_TIMEOUT_MS_PADRAO` sozinho é 60 s. O teste "`prazoMs` acima do pior caso" fica vermelho, ou a 47.0 passa a cortar em 60 s o que hoje tem 150 s (`IA_EXECUCAO_TIMEOUT_MS`, `config-ia.ts:89`). Isso é regressão.
   - **Correção exigida:** o prazo do job sai do perfil da tarefa, e não só do tipo (ou existe um terceiro tipo para ferramenta `padrao` em fila interativa), com o teste do pior caso por perfil. Dizer também o destino de `LLM_TIMEOUT_MS`, que segue valendo para `complexo` e `visao`, e de `IA_EXECUCAO_TIMEOUT_MS`, que hoje tem o mesmo papel do `prazoMs`.

2. `onda-0.md` §2.1 "Alvo", §2.2 e §5 (2.0 ∥ 3.0 ∥ 4.0 ∥ 5.0): "Da 2.0 e da 3.0 em diante, `ouro.test.ts` fica vermelho fora do alvo" não diz como o teste liga o alvo.
   - **O que está errado:** o portão de toda tarefa roda a unidade inteira. Se o teste exige o alvo do `riscoAVida` desde a 1.0, as linhas 3.0, 4.0 e 5.0 ficam vermelhas até a 2.0 pousar. Se exige o da `saidaQualitativa`, cuja função só nasce na 3.0, a 2.0 fica vermelha. Fora disso, o "a partir da 2.0" vira vontade, sem teste que o prove.
   - **Correção exigida:** cada política liga o seu alvo na tarefa dona. A 2.0 liga o `riscoAVida`, e a 3.0 liga `saidaQualitativa` e `julgamentoDeTextoDeAluno`. Isso fica como linha explícita do `ouro.test.ts`, sem `.skip` (regra 40). Dizer qual função a 3.0 sobe se a `base` do `julgamentoDeTextoDeAluno` ficar abaixo de 0,95. Hoje nenhuma tarefa mexe em `conversaPedeJulgamentoDeTextoDeAluno`, e o alvo foi escrito com `base: null`.

3. `techspec.md` §8 (C37): falta a estimativa de custo.
   - **O que está errado:** o texto é qualitativo ("perto de zero"), sem chamadas por professor por mês, sem perfil e sem custo. A RF2 adiciona chamada de modelo e a regra pede o número.
   - **Correção exigida:** uma linha com chamadas por professor por mês por perfil, tokens e custo em R$. Pode partir da minha estimativa acima, com as premissas declaradas.

Recomendações:

1. `onda-0.md` §2.1 e `onda-1b.md` (29.0, item 3): `<base>` de `git log <base>..HEAD -- docs/aia/ouro` não está definido. Sugestão: o commit `(ouro: base)` do Arquiteto.
2. `onda-0.md` §2.1: dizer que o `SELO.json` não entra no próprio hash, e que quem o protege é o `git log`. A tabela do alvo não cita o `medidoSem` (JT-001 a JT-012), que o `MEDIDAS.json` e o `README` já têm.
3. `onda-3a.md` §2 "O consumo da execução morta (C26)": `consumo_ia` tem `tokensDeEntrada`, `tokensDeSaida`, `modelo`, `promptVersao` e `duracaoMs` como `NOT NULL` (`consumo-ia.ts:51-58`), e a spec diz "tokens desconhecidos" sem migration. Escolher entre gravar 0 e gravar a reserva estimada do `LimiteDeTokens`. A reserva é a opção menos enganosa para a D14.
4. `onda-3b.md` §2 "49.0": dizer se `LLM_TOKENS_POR_MINUTO` é obrigatório em produção com `openai_compat`. O pico de `docs/infra.md` §3.2 (~1,5 milhão de tokens/min) exige contrato acima de ~1,9 milhão com o teto de 80 %. O "Redis fora: seguro em memória" permite N vezes o teto com N réplicas, então convém dividir o teto pelas réplicas ou declarar a exceção.
5. `onda-3b.md` §2 "48.0": o disjuntor conta como falha a chamada acima de metade do prazo (10 s no `rapido`), e o Tutor leva ~6 s em carga normal. Medir na 47.0 se isso abre o disjuntor sem falha real.
6. A conta das vagas (`onda-3a.md`) assume 10 escolas com 1.800 alunos no total (D25). Uma escola de 900 alunos passa de 10 simultâneos. A espera por escola alerta, mas vale registrar o limite no runbook.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-0.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/docs/aia/ouro/MEDIDAS.json`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/docs/aia/ouro/SELO.json`

## privacy-guardian · 2ª rodada · REPROVADO · 2026-10-21 15:38:55 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

A rodada 2 fecha a C21 e a C38. A C17 e a C19 ficaram pela metade, cada uma com um bloqueante. O descarte de job, que é novo nesta spec, abriu um buraco novo num direito do titular.

**Como ficou cada correção minha**

| Correção | Situação | Onde |
|---|---|---|
| C17 (PDF no storage) | parcial: bloqueante 1 | `onda-3a.md` §2 "O PDF (45.0)", linhas 78-100 |
| C19 (listar, reprocessar e descartar job) | parcial: bloqueante 2; o resto feito | `onda-3b.md` §2 "T5", linhas 17-29, e §3 linha 109 |
| C21 (D62 na subida) | feita | `onda-3b.md` §2 "RF20", linhas 63-68, e §3 linha 110 |
| C38 (PRD §8) | feita | `prd.md` §8: `job_registro` "não; entra na tarefa", e a linha nova do PDF |
| C37 (parte de privacidade) | feita | `techspec.md` §6 (os dois workers de outra escola) e §7 (PDF com órfão em 24 h) |

**C17: o que foi feito**
- A chave tem prefixo da escola e só ids, e o objeto fica no armazém privado, sem URL.
- O objeto só é apagado depois do commit.
- A tabela diz o destino do objeto em cada caminho, e o órfão tem teto de 24 h.
- A linha 86 do `docs/lgpd.md` e o `docs/modelo-de-dados.md:569` estão previstos, e a frase falsa da §4 saiu.
- Há teste para sucesso, falha final, worker morto e órfão.

**C19: o que foi feito**
- `ops:jobs-que-falharam` lista só id, escola, tipo, código e data.
- A auditoria segue o molde de `ops:retencao`.
- O reprocessar grava `where estado = 'falhou'` e tira a cópia `failed` do BullMQ.
- Job `ia.*` é recusado.
- Há testes de descartar, de reprocessar e da auditoria.

**C21: o que foi feito**
- Todo `openai_compat` fora da nossa rede exige `conversa_do_aluno` nas categorias e `alcance = 'todas'`.
- O modelo menor usa o mesmo provedor e o mesmo endereço.
- Há um caso por ramo.
- "Fora da nossa rede" já tem critério no código: `LLM_PROCESSAMENTO_LOCAL`, que `packages/nucleo/src/config/config-ia.ts:23` só aceita com host privado.

---

Campos pessoais tocados: `job_registro` (só ids; o que falhou fica 30 dias, e o de `titular.eliminar` até alguém agir); o espelho da prova no `sessionStorage` (ids e o dono); o PDF do material no storage, que é novo; `resposta_atividade.sequencia` (coluna técnica); `consumo_ia` com linha `falhou` na execução morta (só ids); e o corpus `ouro`, sintético.

Fora da tabela de dados do docs/lgpd.md: nenhum sem tarefa dona.
- `job_registro` entra na 44.0, com a cópia `failed` de 7 dias no Redis.
- O PDF entra na 45.0 (linha 86, até a extração ou 24 h).
- O espelho entra na 53.0.
- O PRD §8 agora diz a verdade sobre os três.

Autorização por objeto: ok no desenho.
- Um job de IA com o `execucaoId` de outra escola não roda nada, e há mutação que tira o `escola_id` (`onda-3a.md` §3).
- O mesmo vale para o `materialId` de outra escola no job do PDF.
- O "esperando" lê pela `MATRIZ`, e o `substitui` responde `NAO_ENCONTRADO`.
- Os comandos `ops:` leem com `@SemEscopo` e motivo, listados no ADR (`onda-3b.md` §4).

Logs: limpos no desenho.
- As métricas de IA não levam usuário nem escola (`onda-3b.md` §2, linha 58).
- `reportarFalha` leva `TipoDeFalha` como união fechada, e nada sai do navegador (`onda-4.md`).
- O erro de entrada vai sem `issues`.

Auditoria:
- Presente em `material.substituido`, `ops:reprocessar-job` e `ops:descartar-job` (com operador, job, escola e chamado).
- O formato da referência de chamado não está escrito. Ver recomendações.

Envio externo: nada novo sai.
- A D62 agora barra a subida da API e do `main-worker` também por categoria e por alcance.
- O modelo menor fica no mesmo provedor já conferido.
- A execução morta grava `consumo_ia` com o `provedor`, e a lista de compartilhamento continua respondendo.

Seed/fixture: sintético.
- `docs/aia/ouro/` traz `fonte` igual a `sintetica` ou `revisor`. As frases do revisor também são inventadas (`README.md` §Fonte).
- Procurei padrão de CPF, e-mail, telefone e nome de escola real no corpus: nenhum.
- A semente usa `.invalid`.

Bloqueantes:

1. **O apagamento do PDF por varredura depende de coisas que o código não tem** (`onda-3a.md` §2 "O PDF (45.0)", linhas 81, 94 e 95; C17).
   - **A função de chave está errada.** `chaveDoObjeto` é a do arquivo do titular. A assinatura é `(escolaId, pedidoId, versao: VersaoDoArquivo)` e devolve `` `titular/${escolaId}/${pedidoId}/${versao}.json` `` (`packages/nucleo/src/titular/arquivo-do-titular.repository.ts:230-232`). Chamada como `chaveDoObjeto(escolaId, 'material-temporario', materialId)`, ela nem compila, e o PDF cairia no espaço de chaves do titular, com extensão `.json`.
   - **"Percorre o prefixo" e "apaga o objeto com mais de 24 h" pedem listar o bucket**, e o storage não lista. `ArmazemDeArquivos` só tem `guardar`, `existe`, `apagar` e `urlDeDownload` (`packages/nucleo/src/titular/armazem-de-arquivos.ts:30-42`). O `retencao.expurgar-escola` de hoje apaga pela tabela, não pelo bucket (`apps/worker/src/processadores/expurgar-escola.ts:159-178`). É o mesmo ponto da rodada 1, e o teto de 24 h, que vai para o `docs/lgpd.md` e para o dossiê, fica sem mecanismo.
   - **A exclusão de um material foi mandada para o expurgo da escola**, que é outra rotina. `DELETE /v1/materiais/:id` (`apps/api/src/material/material.service.ts:257`) não apaga o objeto, e esse caminho não tem teste.
   - **Correção exigida:**
     - Uma função de chave própria, fora de `titular/`: `material-temporario/<escolaId>/<materialId>`.
     - Um mecanismo declarado para o órfão. Pode ser `listar(prefixo)` com data de modificação no `ArmazemDeArquivos`, no S3 e no armazém em memória, com teste de integração no SeaweedFS. Ou pode ser varrer a tabela `material`: `apagar`, que já é idempotente, para todo material criado há mais de 24 h fora de `processando`, inclusive excluído e de escola em expurgo, com `@SemEscopo` e motivo.
     - A exclusão do material apaga o objeto depois do commit.
     - Testes em `onda-3a.md` §3: material excluído em `processando` deixa de ter objeto; o expurgo da escola alcança o objeto.
[… 30 linhas cortadas]

## test-engineer · 2ª rodada · REPROVADO · 2026-10-21 15:39:56 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

Cenários exigidos: os das minhas 16 correções da rodada 1 (C1, C2, C6, C7, C8, C11, C14, C18, C19, C20, C22, C24, C27, C28, C31, C34), mais o que as correções novas abriram.

Cobertos:
- **C2:** `erraPara: 'mais'`, perda máxima por categoria, zero na `explicita`, precisão secundária (`onda-0.md` §2.1, `MEDIDAS.json`). Fica o conflito do bloqueante 2.
- **C6:** as frases "tô triste" e "suicídio na Revolução Francesa" entram, e o `it.each` continua (§2.2).
- **C7:** `tools/processo/hook-portao.test.ts` lê o comando de `.claude/settings.json` e usa `CLAUDE_PROJECT_DIR` numa cópia; sai 2 quebrado e 0 são; a mutação roda no portão (§2.5).
- **C11:** sem ano letivo nos três estados, vínculo encerrado ao lado de um aberto, virada de ano, duas disciplinas sem dobrar a contagem, pendente só em `vinculosAConfirmar`, e os testes da web portados antes (`onda-2.md` §RF15).
- **C14:** os casos de `textos-do-pedido.test.ts:50-115` vão para a API com relógio falso, mais a meia-noite de São Paulo, antes de a web perder os seus (`onda-2.md`).
- **C19:** listagem só com ids, auditoria no molde de `ops:retencao`, efeito por tipo, `ia.*` recusado, sentinela fora da saída, e `where estado = 'falhou'` no reprocessar (`onda-3b.md` §T5 e §3).
- **C20:** `titular.eliminar` fica até a ação do operador; o teste das cinco falhas tem a linha, a métrica e o alerta (`onda-3b.md:19-20`, `:108`).
- **C22:** a ordem dos mecanismos, o prazo por perfil, o orçamento com teste de `prazoMs`, o disjuntor por provedor e modelo, e "500: um `fetch` só". Faltam testes, ver o bloqueante 8.
- **C24:** porta no `nucleo`, variáveis no esquema, reserva acertada pelo uso real, um balde por modelo, 50 % para normal e lote, e a sequência 8 s → modelo menor → `IA_INDISPONIVEL`.
- **C31:** a `FASE=sala` com 10 escolas, latência falsa de 6 s, limite no p95 e na espera mais antiga, `kill -9` sob a carga, e base e depois na mesma sessão (`onda-3a.md` §Latência).
- **C1, C8, C18, C27 e C28:** cobertos só em parte, ver os bloqueantes.
- **C34:** não foi feita.

Bloqueantes:

1. **`docs/aia/ouro/README.md`: o corpus selado contradiz o desenho.**
   - As linhas 109-111 ainda dizem recall ≥ 0,90 e precisão ≥ 0,90 no `riscoAVida`, e que a primeira medida da `saidaQualitativa` é a sua `base`. Isso é o que a C3 proíbe, e contradiz o `MEDIDAS.json` e o `onda-0.md:40-48`.
   - A linha 4 ainda põe o `selo.test.ts` na 29.0.
   - As contagens não batem com os arquivos:
     - `assuntoDelicado.json` tem 84 amostras (54 `casa`), e não 78 (48).
     - `saidaQualitativa.json` tem 98 (57 `casa`), e não 96 (55).
     - A categoria `rubrica_sob_medida` (2 amostras `casa`) não aparece nem no `README.md:46` nem no `onda-0.md:36-38`.
   - O `SELO.json` sela essa contradição, e um leitor zod com as categorias fechadas reprova o arquivo.
   - **Correção:** alinhar o README e o `onda-0.md` §2.1 aos arquivos, decidir a `rubrica_sob_medida` no README (é a decisão 12) e refazer o selo.

2. **`onda-0.md:45` contra `:66` e `:150`: o alvo trava a correção que a C6 pede.**
   - "Nenhum padrão se estreita para subir a precisão" impede a amostra `dev` "suicídio na Revolução Francesa não casa", porque ela só passa estreitando o `suicid\w*`.
   - Também não está dito o que acontece com precisão abaixo de 0,80: o teste fica vermelho, e qual é a saída?
   - **Correção:** permitir estreitar quando nenhuma `casa` do `ouro` nem do `it.each` se perde. Dizer que precisão abaixo de 0,80 deixa o teste vermelho e que a saída é subir ao Arquiteto, nunca o Implementador mexer no `MEDIDAS`.

3. **`onda-0.md:47`: o alvo do `julgamentoDeTextoDeAluno` não tem dono e deixa duas categorias sem proteção.**
   - O recall ≥ 0,95 vale da 2.0 em diante, mas nenhuma tarefa da onda 0 mexe em `conversaPedeJulgamentoDeTextoDeAluno`. Se a base da 1.0 ficar abaixo de 0,95, o `ouro.test.ts` fica vermelho já na 2.0, sem quem o conserte.
   - Não está dito qual das duas medidas da 1.0 se compara com o alvo: com ou sem JT-001 a JT-012 (`README.md:17-18`).
   - Trocar a `base` pelo alvo deixou `pedagogia_geral` e `homonimo_de_nota` sem guarda de falso positivo.
   - **Correção:** dar uma tarefa ao alvo, ou manter "não cair da base" até ela. Fixar o conjunto que se mede. Manter a base nas outras categorias `nao_casa`.

4. **`onda-1a.md` §T7, 12.0, linhas 72-84: a regra nova do depcruise cobre menos que a varredura que ela substitui.**
   - **Pastas:** a linha 77 diz que o depcruise roda em `apps packages tools infra e2e`, mas o comando da linha 80 roda só em `apps packages`. A varredura de hoje cobre as cinco pastas (`apps/api/test/arquitetura.test.ts:32`).
   - **Reexportação:** o depcruise vê só a aresta direta. Um arquivo de fora que pega a classe por um arquivo de `sessao/**` que a reexporta (sem ser o `index.ts`) passa a escapar da 12.0 até a 34.0. Hoje a varredura pelo nome da classe pega esse caso (`USO_DA_RESOLUCAO`, `:43`; vale também para a conta global dentro de `ciclo-de-vida/**`).
   - **Correção:** um comando só, nas cinco pastas. Uma fixture "fora importa de `sessao/x.ts`, que reexporta a resolução", vermelha, ou a varredura pelo nome da classe mantida até a 34.0.

5. **`onda-3a.md:114` (C27): o teste do job duplicado contradiz o processador das linhas 66-69.**
   - Com duas entregas em `Promise.all`, a segunda acha a execução em `rodando` e a marca `EXECUCAO_INTERROMPIDA`. A primeira conclui com `where estado = 'rodando'` e não grava nada. O resultado é zero resposta e zero troca, e não "uma resposta, uma troca".
   - **Correção:** escrever o estado final exato:
     - execução em `falhou` com `EXECUCAO_INTERROMPIDA`;
     - nenhuma entrega nem turno gravado, e a troca não conta;
     - um `fetch` ao modelo;
     - quantas linhas ficam em `consumo_ia`: a `falhou` da reentrega mais o registro real da primeira chamada dariam duas para uma chamada só.
   - E separar o cenário em que a segunda chega depois de `concluido`: ela sai, e fica uma resposta e uma troca.

6. **`onda-3a.md:91` e `:120` (C18): o PDF duplicado pode derrubar um material pronto.**
   - O primeiro job apaga o objeto depois do commit. O segundo falha no `lerBytes`, entra no caminho "falha final" e grava `falhou` por cima do `pronto`.
   - **Correção:** transição condicionada no banco (`where estado = 'processando'`, regra 80.7), dito também como o "grava os trechos uma vez" se garante. O teste afirma estado final `pronto` e trechos gravados uma vez.

7. **`onda-3a.md:94`: o expurgo do PDF temporário não tem teste.**
   - A cláusula "`retencao.expurgar-escola` percorre o prefixo `material-temporario`" não tem linha no §3: a 121 cobre sucesso, falha, prazo, worker morto e órfão.
   - **Correção:** um teste em que o expurgo da escola A apaga os objetos da A e não toca os da B, com a mutação.

8. **`onda-3b.md:45-46` (C22): o disjuntor tem regras sem teste.**
   - "A chamada acima de metade do prazo conta" e "429 e `IA_SAIDA_INVALIDA` não contam" não têm linha no §3 (as linhas 103-105 cobrem só o prazo estourado e as recusas). A mutação "contar o 429" passaria.
   - **Correção:** uma linha para cada uma.

9. **`onda-3b.md:111` (C28): a prova em outra aba e em outro computador não tem resultado esperado.**
   - Pelas linhas 74-75, a aba velha manda `max(local, servidor lido) + 1`, perde, relê e devolve o que ficou. O último clique do aluno naquela aba some calado (regra 80.6).
   - **Correção:** escrever o resultado de cada caso e o que o teste afirma: ou o cliente reenvia com `servidor + 1` e o último clique vence, ou a tela mostra o valor que ficou, com aviso.

10. **`onda-4.md` §2.6, linhas 87-96 (C34): a correção não foi feita.**
    - Falta a tabela por papel com estado, texto antes, texto depois e "igual" ou "mudança aceita".
    - Os estados da coordenação não aparecem: os cinco tipos, erro, carregando, vazio e "escola montada".
    - `apps/web/src/sino-por-area.test.tsx` não é citado, e ele afirma hoje as rotas que cada papel lê, que a 79.0 muda. Falta reescrevê-lo para uma chamada por papel, com o professor sem ler rota da coordenação.
    - Falta o teste que prova cada linha da tabela.

Recomendações:
- `onda-3b.md:121-125`: o cabeçalho da tabela do §5 está duplicado, com uma linha de texto no meio.
- O leitor do `MEDIDAS` deve ser zod estrito: `base` nula depois da 1.0 fica vermelha, chave de alvo com erro de digitação falha, e "não cair da base" vale por categoria, e não só no agregado.
[… 21 linhas cortadas]

## conformidade-reviewer · 2ª rodada · REPROVADO · 2026-10-21 15:40:52 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: são os mesmos da rodada 1. Não existe tabela `Nota`: o que vale oficialmente é `entrega.estado = 'aprovada'` com `validacao_do_lote.confirmada_por`. Escrevem isso o Aprovar pela API, a semente do e2e (84.0 e 85.0), as bancadas de integração e o job de correção, que grava só `correcao` em lote pendente. O `ops:reprocessar-job` recusa `ia.*` (`onda-3b.md:23`). Todos com autor humano? sim.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. A exceção da D47 segue só no Tutor, e o modelo menor passa pelas mesmas conferências (`onda-3b.md`, 49.0).
Supervisão do tutor: ok no que a rodada 1 pediu. Abriu uma lacuna nova, a ameaça a terceiro sem piso (bloqueante 2).
Autonomia declarada e visível: sim. A tela `Agentes` agora tem o meu veto (72.0).

**Situação das correções exigidas**
- **C1, feita.** `onda-0.md:40-41` diz: "Da 2.0 e da 3.0 em diante, `ouro.test.ts` fica vermelho fora dele." E `MEDIDAS.json` traz `legitimasBarradas: 0`.
- **C2, feita.** `erraPara: 'mais'`, perda zero em `explicita`, `indireta`, `automutilacao_sem_corte` e `risco_de_outra_pessoa`, e precisão como meta secundária (`onda-0.md:45`, `MEDIDAS.json`). Atende à alternativa que a C2 aceitava.
- **C3, feita para `saidaQualitativa`.** Para `julgamentoDeTextoDeAluno` o alvo existe, mas nenhuma tarefa é dona dele (bloqueante 1).
- **C4, feita.** O `selo-do-ouro.test.ts` nasce na 1.0, e a 2.0 e a 3.0 trazem o `git log` vazio no veto (`onda-0.md` §2.1 e §2.2). A 29.0 só move o teste (`onda-1b.md`). Conferi os sha256 de `SELO.json` contra os arquivos atuais: batem.
- **C5, feita.** Está em `onda-0.md` §2.4 e §3, repetida na 42.0 (`onda-3a.md:25-27`) e no §3 dela (`:115`).
- **C13, feita.** `onda-2.md:76-77` (teste com dois professores na API) e `:135` (veto de conformidade na 38.0).
- **C36, feita.** `onda-4.md:136`, `:138` e `:143`.

**Bloqueantes**

1. **O alvo de `julgamentoDeTextoDeAluno` não tem tarefa que o alcance.**
   - **Onde:** `onda-0.md:47` e §5, e `docs/aia/ouro/MEDIDAS.json`, chave `julgamentoDeTextoDeAluno`.
   - **O que está errado:** o alvo é recall ≥ 0,95, medido sem JT-001 a JT-012, e vale "da 2.0 e da 3.0 em diante". Fiz uma medição aproximada com `conversaPedeJulgamentoDeTextoDeAluno` (`propor-ferramenta.ts:248`) sobre o `ouro` de hoje: deu 42/45 = 0,933. Escaparam JT-015 (`nota`), JT-039 (`julgamento_direto`) e JT-063 (`rubrica_com_texto_de_aluno`).
   - **Por que importa:** nenhuma tarefa da onda 0 mexe nessa função. A 2.0 cuida do risco à vida e a 3.0 cria `julgaTextoDeAluno`, que confere a saída. Como o portão da tarefa roda a unidade inteira, `ouro.test.ts` fica vermelho na 2.0, na 4.0 e na 5.0 por uma regra que nenhuma delas toca. A saída fácil seria afrouxar o alvo.
   - **Correção exigida:**
     - declarar a tarefa dona, a 3.0 ou outra, que leva a função ao alvo, com amostras `dev` para as três formas que escapam;
     - escrever que cada política só fica vermelha a partir da tarefa que é dona dela;
     - copiar para `onda-0.md:47` o "medido sem JT-001 a JT-012", que hoje só está no `MEDIDAS.json`.

2. **A ameaça a terceiro ficou sem piso, e a proteção que existe hoje pode sumir sem teste vermelho.**
   - **Onde:** `MEDIDAS.json` (`foraDoAlvo: ["ameaca_a_terceiro"]`), `onda-0.md:35-36` e `:45`, e a decisão 5 do `README.md` do `ouro`.
   - **O que existe hoje:** o padrão `/(vou|quero) matar (ele|ela|eles|elas|alguem|todo mundo|meu|minha)/`, em `GATILHOS_DE_RISCO_A_VIDA` (`turno-do-tutor.ts:97`), já manda "vou matar ele amanhã na saída…" à mensagem fixa e ao sinal `atencao_humana` do professor. Nenhum teste `dev` cobre esse padrão: o `it.each` de `turno-do-tutor.test.ts:324` não tem frase de ameaça.
   - **O que está errado:** a 2.0 reescreve esses gatilhos com precisão ≥ 0,80 como meta. Estreitar ou tirar esse padrão (o "meu"/"minha" casa com hipérbole) baixa a ameaça de 1/7 para 0/7, e nada fica vermelho. O professor deixaria de receber o sinal numa ameaça com faca, e isso tira supervisão do Tutor (regra 70, item 4).
   - **Correção exigida:**
     - `ameaca_a_terceiro` ganha `nao_cair_da_base` em `MEDIDAS.alvo`, com o piso sendo a base da 1.0;
     - a 2.0 ganha uma amostra `dev` ("vou matar ele amanhã") que prova a mensagem fixa e o `atencao_humana`;
     - a mensagem certa para a ameaça continua no `TODO.md`, como a R42 decidiu.
   - O conserto pede `(ouro: …)` e o selo refeito pelo Arquiteto.

**Recomendações**
- `docs/aia/ouro/README.md:4` ainda diz que a trava é a 29.0 com `selo.test.ts`. Hoje o selo nasce na 1.0, como `selo-do-ouro.test.ts`.
- `MEDIDAS.json` fica fora do `SELO.json`, e o alvo só é protegido pelo `git log` que eu confiro no veto. Duas saídas:
  - selá-lo junto quando o Arquiteto copiar a `base`;
  - definir o `<base>` do `git log` como o início da tarefa, para que os commits `(ouro: …)` entre tarefas não o sujem.
- Precisão de `riscoAVida` abaixo de 0,80 com o recall no alvo: dizer se o teste fica vermelho, e que o caminho é voltar ao Arquiteto, nunca estreitar padrão.
- O turno que só o modelo classificaria como delicado se perde sem classificação em três casos: descartado no `preparar`, estourando a espera de 20 s, ou como `EXECUCAO_INTERROMPIDA`. Dizer que a pergunta continua no registro que o professor vê.
- Registrar a ameaça a terceiro como limitação conhecida em `docs/aia/tutor.md`, ao lado da limitação da D55.
- A 74.0 (`Artefato`, `Conversa`) não tem tarefa de caracterização na leva 1. Declarar mutações sobre a recusa da D55 e o rótulo de IA em `Artefato.test.tsx` e `Conversa.test.tsx`.

Arquivos auditados, todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/`:
- `tasks/prd-reengenharia/onda-0.md`, `onda-1b.md`, `onda-2.md`, `onda-3a.md`, `onda-3b.md`, `onda-4.md`, `techspec.md` e `prd.md`
- `docs/aia/ouro/MEDIDAS.json`, `docs/aia/ouro/README.md` e `docs/aia/ouro/SELO.json`
- `.reengenharia/DECISOES.md` (R42), `TODO.md` e `docs/aia/tutor.md`
- no código: `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` e `apps/api/src/tutor/tutor.service.ts`

O `README.md` e o `MEDIDAS.json` do `ouro` mudaram enquanto eu lia. As linhas citadas são da versão final, que é a que conferi contra o selo.

## privacy-guardian · 3ª rodada · APROVADO · 2026-10-21 15:48:57 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: APROVADO

As duas correções que eu exigi na rodada 2 (D8 e D13) e a recomendação da linha do espelho no PRD §8 foram feitas. Nenhuma delas abriu bloqueante novo.

**D8 — o PDF temporário (`onda-3b.md` §2, "O PDF no worker", e §3)**
- A chave tem função própria, fora de `titular/`: `chaveDoTemporario` em `apps/api/src/material/temporario.ts`, no formato `material-temporario/<escolaId>/<materialId>`.
- O órfão é varrido pela tabela `material`, não pelo bucket. A varredura `material.varrer-temporarios` tem `@SemEscopo` com motivo e está em `DEFINICOES_DE_JOB` e nos `AGENDAMENTOS`. O armazém não lista o bucket.
- A exclusão apaga o objeto depois do commit da exclusão lógica.
- A transição do duplicado é `where estado = 'processando' and excluido_em is null`, e a transação desfaz os trechos quando não pega linha.
- Os testes pedidos estão na §3: material excluído em `processando`, expurgo da A sem tocar a B (com mutação), órfão com 25 h e com 23 h, e a reconciliação apagando o objeto.
- A linha 86 de `docs/lgpd.md` e `docs/modelo-de-dados.md:569` estão previstas.

**D13 — descartar job (`onda-3b.md` §2, "listar, reprocessar e descartar", e §3)**
- `ops:descartar-job` recusa `ia.*` e `titular.*`.
- A exceção de retenção da 44.0 cobre `titular.eliminar` e `titular.montar-arquivo`.
- O efeito de cada tipo está escrito: `material.extrair-pdf`, `sistema.*` e `retencao.*`.
- Há um teste por tipo, e a sentinela em `dados` fica fora da saída e também da auditoria.
- As ações `job.reprocessado` e `job.descartado` entram em `acoes.ts` como `z.strictObject`, e `--chamado` é inteiro positivo.
- O descarte só pega linha com `where estado = 'falhou'`.

**PRD §8:** a linha do espelho no `sessionStorage` está lá (só ids, até o envio, o "Sair", a troca de dono ou o fechamento da aba).

**Item novo `contestacao` (`onda-2.md` §2, 38.0; `onda-4b.md` §2.3)**
- O item traz o nome do professor, a turma e a disciplina. É o mesmo texto que a fila mostra hoje (`apps/web/src/areas/coordenacao/fila-da-coordenacao.ts:84-96`), e a coordenação já vê nome de professor.
- Não traz nome de aluno, não traz o `complemento` em texto livre do vínculo, e cada membro da união é `.strict()`.
- Não deriva de uso nem de adoção do professor, então não fere a D64 nem a regra 70.9.

```
VEREDITO: APROVADO
Campos pessoais tocados: job_registro (só ids; 30 dias o que falhou, titular.* até a ação do operador); espelho da prova no sessionStorage (só ids); PDF do material no storage até a extração; nome de professor, turma e disciplina no item `contestacao` do esperando da coordenação (já exibido hoje)
Fora da tabela de dados do docs/lgpd.md: nenhum; as três linhas novas entram na 44.0, na 45.0 e na 53.0, e o PRD §8 lista as três
Autorização por objeto: ok (lerParaExtrair e lerParaExecutar com escola do contexto e mutação; job com id da outra escola sem efeito; substitui com id de outra escola dá NAO_ENCONTRADO; esperando com um recurso por papel na MATRIZ)
Logs: limpos (só id; reportarFalha só com tipo e rota; ops:jobs-que-falharam sem dados)
Auditoria: presente (job.reprocessado e job.descartado com operador, job, tipo, escola e chamado; material.substituido)
Envio externo: nenhum novo; a D62 passa a barrar a subida da API e do main-worker sem suboperador BR, com treinamento vedado, conversa_do_aluno e alcance 'todas' (50.0); o modelo menor usa o mesmo provedor
Seed/fixture: sintético (ouro sintético, com `fonte` fechada)
Bloqueantes: nenhum
Recomendações:
- onda-3b.md §2, "Órfão": chaveDoTemporario usa exigirEscolaDoContexto(), mas a varredura tem @SemEscopo e não tem contexto. Escrever que ela monta a chave pelo escola_id da linha, ou restaura o contexto da escola a cada linha, para o implementador não afrouxar a função de chave
- onda-3b.md §2, "Órfão": o teto de 7 dias deixa o objeto para sempre no bucket se a varredura ficar parada mais de 6 dias logo depois de um órfão, e o alerta de rotina parada está fora (§6). Tirar o teto, ou cobrir o caso pelo alerta de job que falhou
- onda-3b.md §2, "Órfão": a varredura não filtra estado. Um material ainda em `processando` com 24 h (fila `lote` com concorrência 1 e várias escolas enviando ao mesmo tempo) perde o objeto e termina `falhou`. Erra para o lado de apagar, o que é seguro para a LGPD; fica como nota para o infra-guardian
- techspec.md §7 e docs/lgpd.md:86: a varredura roda de hora em hora, então o teto real do órfão é 25 h. Escrever "até 25 h" ou "24 h mais a hora da varredura"
- onda-2.md §2, 38.0: dizer que `professor` no item `contestacao` é `{ usuarioId, nome }`, porque o link `caminhoDoProfessor` precisa do id, e que o `complemento` do vínculo não entra
```

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/prd.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-2.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3c.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-4a.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-4b.md`

Da `onda-0.md` e da `onda-1a.md` li o diff desde o último commit. A `onda-1b.md` mudou em 6 linhas, que não li. A `onda-5.md` e a `onda-6.md` não mudaram desde o commit e não foram reauditadas.

## frontend-reviewer · 3ª rodada · AJUSTES NECESSÁRIOS · 2026-10-21 15:48:58 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS
Tela vista: não (revisão de spec, sem foto; li `prd.md`, `techspec.md`, `onda-3c.md`, `onda-4a.md`, `onda-4b.md`, os achados da rodada 2 e o código web que os cortes tocam).
Estados: ok no desenho (`<Leitura>`, tela de falha, "Tentar de novo"). Faltam os estados do bloco "Esperando você" do Painel da coordenação e do bloco "Para terminar a escola" (B1).
Acessibilidade: ok no desenho. O aviso novo da prova (B2) não diz onde aparece nem se é anunciado a leitor de tela.
Chromebook fraco: ok. O sino cai de até 14 chamadas para 1, com medição de chunk e `comPrazo`.
Celular: ok. Prova nos dois projetos, alvo de 44 px declarado.
Ação oficial protegida: sim. A 60.0 agora traz as mutações de Aprovar (5), Time (2) e Aplicação (2), e os textos da D46 ficam intactos.

Conferência dos meus bloqueantes da rodada 2:
- **D15 (prova em outra aba): escrito e listado como teste na interface, mas o texto contradiz o RF21** (B2 abaixo).
- **D16 (tabela do sino): em boa parte feita, e a correção abriu um buraco novo** (B1 abaixo).
  - A tabela existe nos dois papéis, em `onda-4b.md` §2.3.
  - Cobre os 4 tipos do professor e os 5 da coordenação, além de `parcial`, `erro`, lendo, "Em dia" por turma, sem ano letivo e "100 ou mais", com "igual" ou "mudança aceita".
  - `sino-por-area.test.tsx` foi reescrito para uma chamada por papel, e o veto `conformidade` está na 79.0.
- **Recomendações da rodada 2: todas atendidas.**
  - 60.0 com mutações em Time e Aplicação (`onda-4a.md` §2.2).
  - Leva 2 dependendo de 58.0 e 59.0 (`onda-4b.md` §5).
  - 73.0 e 74.0 com caracterização nomeada. Conferi as quatro referências em `AlunosDaTurma.test.tsx:135`, `Artefato.test.tsx:183` e `Conversa.test.tsx`, e os testes existem. A `<AssinaturaIA>` está em `Artefato.tsx:212`.
  - Caso da recusa da D55 escrito antes do corte, em commit próprio.

Bloqueantes:

1. **`onda-4b.md` §2.3 (79.0) e §1: a 79.0 apaga um módulo que outras telas ainda usam, e a frase "a pessoa só vê o sino mudar" é falsa.**
   - **O erro:**
     - A 79.0 diz que saem `turmas-da-escola.ts` e `o-que-falta-da-escola.ts`, e que o link vem do roteiro (39.0).
     - Mas `useFilaDaCoordenacao` tem um segundo consumidor: o bloco "Esperando você" do Painel (`areas/coordenacao/Painel.tsx:168-211`). Nele, o aviso "Parte da lista não carregou" (`:184`), o "Tentando de novo…" e o estado de erro mudam junto com o sino. O Painel não está na tabela, nem em teste, nem em e2e. `Painel.test.tsx` e `e2e/painel-da-coordenacao.spec.ts` não são citados.
     - `o-que-falta-da-escola.ts` também é importado por `Painel.tsx:22` (o bloco "Para terminar a escola", `:228-300`, com 6 leituras e os textos "Comece pelo ano letivo", "Parte do que falta não carregou" e "A escola está montada"), por `Estrutura.tsx:61`, por `OQueFalta.tsx:4` e pelo próprio teste.
     - O RF15 do PRD manda "escola montada" existir só na API. Mas nenhuma tarefa diz quem migra esse bloco e o `OQueFalta` para `GET /v1/escola/roteiro`, nem com que texto antes e depois.
   - **Correção exigida:**
     - Em `onda-4b.md` §2.3, acrescentar ao bloco da coordenação uma linha por estado do "Esperando você" do Painel e do "Para terminar a escola": carregando, erro, parcial, vazio, sem ano letivo e "A escola está montada". Cada linha traz o texto antes e depois e "igual" ou "mudança aceita".
     - Dizer qual tarefa migra `Painel`, `Estrutura` e `OQueFalta` para o roteiro. Pode ser a 70.0 ou a 79.0, mas a que apaga o módulo só o apaga com zero importador.
     - Nomear `Painel.test.tsx` e `painel-da-coordenacao.spec.ts` como prova, e a mutação que fica vermelha: "Tudo em dia" com a leitura em erro.
     - Corrigir a frase de §1 para incluir o Painel.

2. **`onda-3c.md` §2, 51.0 ("O que o aluno vê") e a tabela §3: o reenvio da aba que perdeu contradiz o RF21 e deixa a outra aba errada sem aviso.**
   - **O erro:**
     - O texto diz que a aba que perdeu reenvia com `servidor + 1` e que "o último clique vence". Entre duas abas isso é falso. A aba 2 clica C depois e o PUT dela chega primeiro. A aba 1 clicou B antes e perde com 6, depois reenvia com 7 e ganha. Fica B, a resposta mais antiga, sobre a mais nova.
     - O RF21 (`prd.md:84`) diz o contrário: "envio atrasado não sobrescreve resposta mais nova".
     - A aba 2 continua mostrando "Resposta salva" para C, enquanto o servidor tem B. O aviso "Sua resposta foi alterada em outra janela" só aparece se a aba perder duas vezes, o que quase nunca ocorre.
     - Num cartão de prova, o aluno entrega achando que marcou C. Era isso que a correção D15 pedia para fechar.
     - A linha de teste "Outra aba ou computador" não nomeia arquivo nem mutação, e o aviso não diz onde aparece nem se é anunciado (`role="status"`).
   - **Correção exigida:**
     - Trocar o reenvio por esta regra: a aba que perde não reenvia. Ela mostra a alternativa que o servidor devolveu, com o aviso, e o aluno decide. A outra saída é só reenviar quando a escolha da aba for mais nova que a do servidor, com um critério declarado.
     - Escrever o que a aba que ganhou vê. Se a própria escolha dela foi substituída, a tela mostra a gravada, com o aviso.
     - Nomear o teste na interface, por exemplo `fila-de-respostas.test.ts` ou `Atividade.test.tsx`, e declarar a mutação "reenviar sobrescreve a mais nova".
     - Dar ao aviso região anunciada (`role="status"`), alvo de toque de pelo menos 44 px se tiver botão, e um lugar fixo na tela.

Recomendações:
- `onda-4b.md` §5: a 79.0 edita `Turmas.tsx`, `Turmas.test.tsx` e `SinoDoProfessor.tsx`, que a 73.0 corta, mas depende só de 70.0. Incluir a 73.0 nas dependências, ou as linhas em paralelo colidem.
- `onda-4a.md` §2.2: as mutações da 60.0 dizem "o teste que fica vermelho" sem nomear arquivo e caso. Nomear, como a 73.0 e a 74.0 fazem.
- `onda-4b.md` §2.3: o "Parcial" do professor "não existe: a rota é uma". Dizer que `Sino.tsx` mantém a prop `parcial` sem uso, ou que ela sai do componente. Hoje a frase "O componente `Sino.tsx` não muda" deixa código morto.
- `onda-4b.md` §2.1: as referências `Conversa.test.tsx:305` e `:286` apontam o `it`, que fica uma ou duas linhas depois do `describe`. Conferir os números.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-4b.md`, `onda-3c.md`, `onda-4a.md`, `prd.md`; código conferido em `apps/web/src/areas/coordenacao/Painel.tsx`, `apps/web/src/areas/aluno/fila-de-respostas.ts` e `apps/web/src/componentes/sino/Sino.tsx`.

## llm-integrator · 3ª rodada · AJUSTES NECESSÁRIOS · 2026-10-21 15:49:13 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Perfis usados: nenhum perfil, caso de uso ou prompt novo. `rapido` (Tutor, `propor_ferramenta`, `relatorio_da_correcao`) e `padrao` (`adaptar-atividade`, `gerar-plano-de-aula`, `gerar-atividade-objetiva`, `resumo-do-analista`) seguem como estão. O modelo menor da 49.0 fica no mesmo perfil. A RF2 (3.0) é a única mudança que acrescenta chamada de modelo, e ela usa `rapido`, o perfil mais barato que resolve.

Custo estimado por professor/mês: `techspec.md` §8 traz o número. São no máximo 8 chamadas `rapido` por professor por mês, ~16 mil tokens, e nenhuma chamada nova em `padrao`. O líquido é ≤ 0, porque o fim da repetição em 5xx e em timeout e a RF1 tiram chamadas.
- **Faixa correta:** pelos preços de `docs/avaliacao-de-modelos.md` §2 dá de R$ 0,02 (Sabiazinho) a R$ 0,06 (Gemini Flash), e R$ 0,12 em 2027. A spec diz "R$ 0,01 a 0,02", abaixo do que a própria tabela do documento dá para Flash-Lite e Flash. A ordem de grandeza (centavos) se mantém, então é recomendação.

Prompt versionado: sim. A 42.0 fixa as mensagens montadas e o hash de cada `PROMPT_*` contra a `versao`, verde da 42.0 à 47.0 e na 26.0 e 27.0. A 3.0 sobe a versão se mudar o prompt.
Validação de schema: sim. `DefinicaoDeTarefa`, `IA_SAIDA_INVALIDA` e `reservaQuandoInvalida` não mudam, e a 3.0 testa que a reserva passa nas duas conferências.
Aprovação humana no caminho: sim. A entrega nasce `pendente` (caracterização antes de mover o `aoConcluir`) e a D47 do Tutor se mantém. A D55 continua com a IA sem corrigir, e a 3.0 aperta a saída.

### Conferência dos meus bloqueantes da rodada 2

| Correção | Situação |
|---|---|
| D1 (alvo ligado na tarefa dona) | Feita no desenho, com um bloqueante novo ligado ao `base` (abaixo). A tabela de `onda-0.md` §2.1 dá a dona de cada política, a 3.0 leva `conversaPedeJulgamentoDeTextoDeAluno` ao alvo, e as `nao_casa` não caem da base. |
| D4 (`onda-0.md` §2.1 igual aos arquivos) | Feita. Conferi os contagens por categoria nos seis JSON: 128 (82), 84 (54), 80 (42), 90 (57), 65 (35) e 99 (58) batem. JT-001 a JT-012 existem como `fonte: revisor`. Os sha256 de `SELO.json` batem com os arquivos, `MEDIDAS.json` incluído. O `README` agora fala de "todo arquivo menos o `SELO.json`", e a 29.0 só leva o teste de lugar. O `<base>` é o início da tarefa. |
| D9 (`prazoMs` por perfil) | Feita. `onda-3a.md` §2 diz que o job tem `prazoMs` de 150 s. O corte do perfil é `rapido` 60 s e `padrao` 150 s. Um teste percorre cada `TarefaDeIa`. `IA_EXECUCAO_TIMEOUT_MS` sai e `LLM_TIMEOUT_MS` fica para `complexo` e `visao`. Isso é coerente com o orçamento de `onda-3c.md` §2 (48 s e 128 s). |
| D12 (job duplicado) | Feita. `onda-3a.md` §3 traz o estado final exato (`falhou` com `EXECUCAO_INTERROMPIDA`, um `fetch`, nada em `entrega` nem turno, a troca não conta, linhas em `consumo_ia`) e o caso separado da segunda entrega depois de `concluido`. A linha de `consumo_ia` usa a reserva estimada nos campos obrigatórios. |
| D17 (custo em §8 e remissão em §7c) | Feita, com a ressalva do valor em R$. |

As recomendações da rodada passada também entraram: `medidoSem`, `LLM_TOKENS_POR_MINUTO` obrigatório fora de `AMBIENTE=local`, e o teto dividido por `IA_REPLICAS` com o Redis fora.

### Bloqueantes

1. `onda-0.md` §2.1 ("Leitor e selo") e §2.2 ("1.0 mede e sela… liga as três"): o `base` não tem ordem executável.
   - **O que está errado, parte A:** o leitor do `MEDIDAS` faz "`base` nula depois da 1.0 falha". A `saidaQualitativa` não tem função medível até a 3.0, onde nasce `julgaTextoDeAluno`, e o `README` já diz isso. A 1.0 não consegue lhe dar `base`. Se o leitor vale para as seis, todo portão da 2.0 em diante fica vermelho.
   - **O que está errado, parte B:** a 1.0 "liga as três" (`assuntoDelicado`, `pedidoDeRespostaPronta`, `saidaComNota`) com alvo "não cair da base". Mas a `base` só nasce depois da 1.0, quando o Arquiteto copia os números no commit `(ouro: base)`. Dentro da própria 1.0 a comparação é contra `null`, então a mutação "tirar um padrão" sobrevive, ou o teste fica vazio. A mutação da 1.0 não prova nada.
   - **Correção exigida:**
     - dizer que a 1.0 só fecha com o `(ouro: base)` já commitado. A ordem é: o Implementador escreve o leitor e o `ouro.test.ts` e imprime os números, o Arquiteto grava `base` e refaz o `SELO`, e só então a 1.0 liga as três e roda as mutações. Alternativa: o Arquiteto mede com um script antes da 1.0.
     - o leitor exige `base` não nula só das políticas cuja função já existe. `saidaQualitativa` fica com `base: null` até a 3.0, e o alvo absoluto (recall 0,90 e nenhuma legítima barrada) basta. Escrever isso em §2.1 e no `README`.

### Recomendações

- **Veto da 3.0** (`onda-0.md` §5): a 3.0 muda `propor-ferramenta.ts` e `provedor.ts`, soma a única chamada nova de modelo da spec e pode subir a versão do prompt, mas só tem `conformidade` no veto. `techspec.md` §8 diz que o `llm-integrator` revisa da 42.0 à 50.0. Incluí-lo na 3.0.
- **Disjuntor com metade do prazo** (`onda-3a.md` §6 e `onda-3c.md` §2): quem mede é a `FASE=sala` da 47.0, mas a 47.0 não depende da 48.0, onde o disjuntor nasce. Com a latência falsa fixa em 6 s o disjuntor nunca abre, então a medida não prova nada. Fazer a 47.0 depender da 48.0, ou mover o caso "chamada entre 10 s e 20 s, repetida" para a 48.0 e 49.0 com a métrica `ia.chamada.duracao_s`. Decidir a regra: com a latência real do provedor da D37, 5 chamadas seguidas acima de 10 s abrem o disjuntor e derrubam o Tutor para o modelo menor.
- **§8, custo:** corrigir a faixa para ~R$ 0,02 a 0,06 por professor por mês (R$ 0,12 em 2027). Declarar as premissas (150 pedidos por professor por mês, 5 % barrados) como premissas, não como medida. A 3.0 mede o falso positivo.
- **`onda-3a.md` §2 "A vaga por escola":** a conta da subvaga usa "ferramentas de até 60 s", mas a mesma onda dá `padrao` com pior caso de 128 s e corte de 150 s. O resultado se mantém (3 subvagas × 60 ÷ 128 s ≈ 1,4 pedido por minuto, acima do pico de 1), mas a premissa está desatualizada. Reescrever a conta com 128 s.
- **`onda-3a.md` §3, "Duplicado em corrida":** "a linha estimada e a real" depende da ordem de gravação. Prender o adaptador falso num trinco (latch) para o teste não ser racy, e afirmar que a estimada só é gravada se a real ainda não existe. Duas linhas somam duas vezes na D14; ficou declarado como superestimar, o que é aceitável.
- **`IA_REPLICAS`** (`onda-3c.md` §2 "49.0") não está na lista de variáveis novas de `techspec.md` §4. Incluí-la, dizer que o valor vem do compose, e fazer a conferência do boot recusar valor menor que 1.
- **`onda-1b.md` 29.0 item 3** ainda escreve `git log <base>..HEAD`, sem definir `<base>`. Copiar a definição de `onda-0.md` §2.2, "o início da tarefa".

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-0.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3c.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-1b.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/docs/aia/ouro/MEDIDAS.json`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/docs/aia/ouro/SELO.json`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/docs/aia/ouro/README.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/docs/avaliacao-de-modelos.md`

Não li `onda-1a`, `onda-2`, `onda-4a`, `onda-4b`, `onda-5` e `onda-6` por inteiro. Procurei neles só o que toca IA, `ouro`, `consumo_ia` e `LLM_*`, e não achei nada que mude o veredito.

## tenancy-guardian · 3ª rodada · REPROVADO · 2026-10-21 15:49:23 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: nenhuma tabela nova (`techspec.md` §3). `resposta_atividade.sequencia` (51.0) entra numa tabela que já tem `escola_id` e `ano_letivo_id`. O item `contestacao` da 38.0 não tem tabela própria: ele sai de `vinculo` com `estado = 'contestado'`, e `vinculo` tem `escola_id`, `ano_letivo_id` e FK composta com a turma (`packages/nucleo/src/db/schema/vinculo.ts:17-27`). O objeto `material-temporario/<escolaId>/<materialId>` leva o prefixo da escola. Os ids são uuid.

Queries verificadas:
- **D5, feita** (`onda-1a.md:77-86`):
  - o comando roda nas cinco pastas: `apps packages tools infra e2e`;
  - há fixture em `tools/x.ts`;
  - há fixture do reexport por `sessao/x.ts`;
  - a saída dos testes das cercas está declarada como mudança aceita (`:72-73`).
- **D6, feita** (`onda-2.md:45-47`): teste em execução com `Object.values` de `sessao/index.js` e `credencial/index.js`, que pega o repository com qualquer nome, e a mutação do reexport em dois passos.
- **D7, feita:**
  - **IA** (`onda-3a.md:37-41`, `:112-113`): teste de repository com a mutação "tirar o `escola_id`", e o teste do job afirma que a execução da B segue `pendente`.
  - **PDF** (`onda-3b.md:50`, `:83-84`): `lerBytes` e o extrator não são chamados, nenhum trecho com aquele `materialId` em escola nenhuma, e a B fica intacta. A chave usa `exigirEscolaDoContexto()` (`:43-44`).
- **D8, feita em parte** (`onda-3b.md:43-89`):
  - função de chave própria, fora de `titular/`;
  - o órfão sai por varredura da tabela `material`;
  - a exclusão apaga o objeto depois do commit;
  - `where estado = 'processando'` no duplicado;
  - testes da exclusão em `processando`, do expurgo A/B com mutação, do órfão de 23 h/25 h e da reconciliação.
  - A varredura nova abriu o bloqueante 1.
- **Vistas de novo:** `ops:descartar-job` dentro de `escopoDoJobNoContexto` (`onda-3b.md:32-34`, era recomendação minha). O "esperando" da coordenação com professor, turma e disciplina (`onda-2.md:72-77`) segue a matriz: coordenação vê a unidade, e o item vem do vínculo com FK composta.

Teste de isolamento: presente e efetivo nas portas de IA (8.0), no "esperando" (37.0 a 39.0), no `substitui` (41.0), nos dois workers (45.0 e 47.0) e no expurgo do PDF. Ausente na varredura `material.varrer-temporarios`.

Bloqueantes:
1. **A varredura do órfão não tem como montar a chave** (`onda-3b.md:43-45` contra `onda-3b.md:65`; e `onda-3b.md:64`).
   - **O que está errado:**
     - A única função de chave, `chaveDoTemporario(materialId)`, lê a escola de `exigirEscolaDoContexto()`.
     - A varredura é `@SemEscopo`, percorre todas as escolas e é agendada como os `AGENDAMENTOS` de hoje. Esses são globais, com `data: {}` e sem escola (`apps/worker/src/agendamentos.ts:33-60`). Sem escola, ela lança em toda linha, e o PDF órfão fica além das 24 h.
     - O tipo `material.*` com escola nula contradiz `onda-1a.md:38`, onde só `sistema.*` tem escola nula.
     - A saída óbvia, uma `chaveDoTemporario(escolaId, materialId)` por parâmetro, desfaz a D7: o caminho de leitura passaria a poder montar a chave com o `escola_id` da linha.
     - O expurgo da escola roda em `apps/worker/src/processadores/expurgar-escola.ts`, e a função mora em `apps/api/src/material/temporario.ts`. Com a regra "app não importa outra app" (`onda-1a.md:64`), o expurgo não pode chamá-la e acabaria com uma cópia do formato da chave.
   - **Correção exigida:**
     - A função de chave vai para `packages/nucleo`, só com a escola do contexto e sem sobrecarga com `escolaId`.
     - Escolher e escrever um dos dois caminhos da varredura:
       - (a) o agendamento grava um job por escola, como o `TIPO_EXPURGAR_DADO_PESSOAL`, e a leitura tem escopo, sem `@SemEscopo`;
       - (b) a leitura `@SemEscopo` devolve só `(escola_id, id)`, e cada `apagar` roda dentro de `escopoDoJobNoContexto(escola_id)`.
     - Dizer em qual processo ela roda e qual escola o `job_registro` dela leva.
     - O teste do órfão passa a ter duas escolas: o órfão de 25 h da A e o da B saem cada um do seu prefixo, e o de 23 h de cada uma fica. A mutação é a chave montada com outra escola.

Recomendações:
- `onda-2.md:73` e `:120`: `contestacaoId` e o `EXPLAIN` de `contestacao` falam de uma tabela que não existe. A contestação é `vinculo.estado = 'contestado'` (`vinculo.ts:42`, `:72`). Tirar o `contestacaoId` ou dizer que ele é o `vinculoId`.
- `techspec.md` §6: incluir os testes de isolamento do expurgo do PDF e da varredura.
- `onda-1a.md:83-84`: dizer de forma direta que, sem `reaches`, o `describe` da resolução em `arquitetura.test.ts` fica e a fixture do reexport sai do `camadas.test.ts` até a 34.0.
- `onda-3b.md:65`: a janela de 24 h a 7 dias deixa para sempre o objeto cuja varredura ficou parada mais de seis dias. O apagamento é idempotente, então tirar o limite de cima ou alertar a rotina parada.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-1a.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-2.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3c.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-4b.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/prd.md`
- `onda-0.md`, `onda-1b.md`, `onda-4a.md`, `onda-5.md` e `onda-6.md` (na mesma pasta), lidos só por busca de termos de tenant.

Arquivos de código usados como referência:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/apps/worker/src/agendamentos.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/apps/worker/src/processadores/expurgar-escola.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/packages/nucleo/src/db/schema/vinculo.ts`

## test-engineer · 3ª rodada · REPROVADO · 2026-10-21 15:50:35 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:** as correções da rodada 2 que vieram de mim (D1, D3, D4, D5, D8, D12, D13, D14, D15, D16) e as que me afetam (D2, D6, D7, D9, D10, D11, D17). Também conferi se a partição da onda 3 em 3a, 3b e 3c e da onda 4 em 4a e 4b perdeu algo da `onda-3.md` do HEAD.

**Cobertos:**
- **D2:** `ameaca_a_terceiro` tem o piso `nao_cair_da_base` (`MEDIDAS.json:20-22`). A amostra `dev` "vou matar ele amanhã" está em `onda-0.md:69-71`. A limitação está em `docs/aia/tutor.md` e no `TODO.md`.
- **D3:** estreitar um padrão é permitido sem perder `casa`. Precisão abaixo de 0,80 deixa o teste vermelho e volta ao Arquiteto (`onda-0.md:50-51`).
- **D4:**
  - As contagens de `onda-0.md:30-37` e do `README.md:41-48` batem com os arquivos (conferi com `jq`), inclusive a `rubrica_sob_medida` (3 amostras).
  - O `SELO.json` bate com o sha256 de cada arquivo.
  - O leitor é zod estrito, o `<base>` é o início da tarefa e o README não fala mais da 29.0.
- **D5:** um comando só nas cinco pastas, a fixture em `tools/x.ts`, a fixture do reexport por `sessao/x.ts`, e a mudança aceita declarada (`onda-1a.md:72-86`).
- **D6:** o teste em execução com `Object.values` e a mutação do reexport em dois passos (`onda-2.md:45-47`).
- **D7:** o teste de repository leva a mutação. O teste do job prova o efeito, no PDF e na IA (`onda-3a.md:112-113`, `onda-3b.md:83-84`).
- **D8:**
  - A chave própria (`material-temporario/<escolaId>/<materialId>`).
  - A varredura pela tabela `material`.
  - A transição `where estado = 'processando'`.
  - Os testes do duplicado (`pronto`, trechos gravados uma vez), da exclusão em `processando`, do expurgo da A sem a B com mutação, e do órfão de 25 h contra 23 h (`onda-3b.md:85-89`).
- **D9:** o prazo sai por perfil e há o teste do pior caso por `TarefaDeIa` (`onda-3a.md:55-59`, `:117`).
- **D10 e D11:** a subvaga tem teste, e o alerta por escola está em `alertas.int.test.ts`.
- **D12:** o estado final exato do duplicado (duas linhas em `consumo_ia`, declaradas) e o caso "depois de `concluido`" separado (`onda-3a.md:109-110`).
- **D14:** "chamada lenta conta", "cinco 429 não abrem o disjuntor" e "cinco `IA_SAIDA_INVALIDA` não abrem" (`onda-3c.md:89-91`).
- **D16:**
  - A tabela por papel tem antes, depois e igual ou mudança aceita, com os quatro tipos do professor e os cinco da coordenação.
  - Estão lá parcial, erro, carregando, "Em dia", sem ano letivo e "100 ou mais".
  - Há teste linha a linha, e o `sino-por-area.test.tsx` foi reescrito (`onda-4b.md:44-90`).
- **D17:** `techspec.md` §7c remete à conta da `onda-3a.md`, e §8 traz o número.
- **D1:** feita em parte, ver os bloqueantes 1 e 2.
- **D13:** feita em parte, ver o bloqueante 6.
- **D15:** feita, mas o resultado escolhido contradiz o PRD, ver o bloqueante 4.

**Bloqueantes:**

1. **A 1.0 não consegue ligar o teste com a `base` nula, e a `saidaQualitativa` não tem `base` possível** (`onda-0.md:53-54`, `:61-63`; `MEDIDAS.json:60-65`).
   - **A ordem.** A 1.0 "liga as três que são suas" (as que não podem cair da base). Mas a `base` só existe depois do commit `(ouro: base)` do Arquiteto. Antes dele, "não cair da base" não reprova nada, e a mutação da 1.0 não fica vermelha.
   - **Quem sabe que a 1.0 passou.** "`base` nula depois da 1.0 falha" não diz como o leitor sabe que a 1.0 já passou.
   - **A `saidaQualitativa`.** A função medida, `julgaTextoDeAluno`, só nasce na 3.0. Ou a `base` dela fica nula para sempre, e então o leitor reprova; ou o Arquiteto a grava na 3.0, e então a trava "`git log … docs/aia/ouro` vazio" reprova.
   - **Correção:** escrever a ordem da 1.0:
     1. commit do leitor e da impressão dos números;
     2. `(ouro: base)` do Arquiteto;
     3. commit que liga as linhas, com a mutação "tirar um padrão" de cada uma das três.
   - Dizer também qual é a `base` da `saidaQualitativa`: medida hoje com `atribuiNotaOuConceito`, a conferência de saída que existe, ou isenta da regra da `base` nula, por escrito.

2. **O piso de `pedagogia_geral` e `homonimo_de_nota` está no texto e não no `MEDIDAS`** (`onda-0.md:48` contra `MEDIDAS.json:32-55` e `README.md:115-118`).
   - O alvo do `julgamentoDeTextoDeAluno` em `MEDIDAS` só tem `recall`, `semCasar` e `medidoSem`.
   - Com o leitor estrito e "o que vale é o `MEDIDAS`", nada no teste reprova o padrão alargado que passa a casar "nota" de pedagogia geral. A mutação passaria.
   - **Correção:** o Arquiteto acrescenta `naoCairDaBase: ["pedagogia_geral", "homonimo_de_nota"]`, ou um nome equivalente, refaz o selo, e o leitor reconhece a chave.

3. **Duplicado na IA: uma cláusula sem teste, e o teste em `Promise.all` não é determinístico** (`onda-3a.md:87` e `:109`).
   - **Cláusula sem teste.** "`pendente → rodando` com `where estado = 'pendente'`; quem não pegou sai sem chamar o modelo" não tem linha no §3.
   - **Resultado ao acaso.** Com duas entregas em `Promise.all`, o resultado depende da ordem:
     - se a segunda lê `pendente`, perde o update e sai: fica uma resposta;
     - se lê `rodando`, marca `EXECUCAO_INTERROMPIDA`: fica zero.
   - A linha afirma só o segundo caso. Do jeito que está, o teste é vermelho ou verde ao acaso.
   - **Correção:**
     - no teste do `EXECUCAO_INTERROMPIDA`, forçar a ordem: o adaptador falso da primeira segura o `fetch` numa barreira até a segunda gravar `falhou`;
     - acrescentar o caso "as duas leem `pendente`": um `fetch`, uma resposta, uma troca, e a que perdeu sai sem modelo;
     - a mutação "tirar o `where estado = 'pendente'`" fica vermelha nesse caso.

4. **A prova em outra aba ou outro computador: o reenvio automático faz o envio atrasado vencer, contra o RF21** (`onda-3c.md:60-61` e `:97`).
   - **O cenário.** O computador A fica com a questão 1 = B pendente, sem rede. O aluno vai para o B e marca C, que grava `sequencia` 3. A volta, manda 3 e perde, reenvia com "servidor + 1" e vence. A resposta mais nova, a do B, é sobrescrita pela atrasada.
   - O PRD (RF21) diz que "envio atrasado não sobrescreve resposta mais nova". A linha "a aba que perde reenvia e vence" põe a violação dentro do teste.
   - **Correção:**
     - a aba que perde não reenvia: adota a `sequencia` do servidor, mostra a alternativa que ficou com o aviso, e o próximo clique dela vence;
     - teste: o pendente atrasado de A perde para o clique do B, e A mostra C com o aviso;
     - teste: um clique novo em A depois disso vence.
   - Se o Arquiteto preferir manter o reenvio, precisa dizer o que separa o clique novo do pendente atrasado, e testar os dois.

5. **A 52.0 ficou sem linha de teste, e a partição perdeu duas cláusulas** (`onda-3c.md:64-68`, §3).
   - **Sem teste.** O RF25 pede "testes com rede pendurada". No §3 só há "`PUT` pendurado não trava", que é da fila da prova. Falta uma linha para "JSON, PDF e upload pendurados, com relógio falso, terminam em `TEMPO_ESGOTADO` e 'Tentar de novo'", com o prazo de cada um.
   - **Cláusulas perdidas.** A `onda-3.md` do HEAD dizia "ligado ao sinal de quem chamou; cancelamento relança" e "`redeFalsa` respeita o `signal`". As duas sumiram. Sem a primeira, o cancelamento da consulta, que é o que o TanStack faz ao desmontar, vira `TEMPO_ESGOTADO` e mostra "Tentar de novo" sem ter estourado prazo nenhum.
   - **Correção:** devolver as duas cláusulas, com teste do cancelamento ("cancelado relança, não vira `TEMPO_ESGOTADO`"), mais a linha do prazo estourado em cada um dos três `fetch`.

6. **O reprocessar e o descartar têm cláusulas sem teste** (`onda-3b.md:30-34` contra `:80-81`).
   - "`ops:reprocessar-job` recusa `ia.*`" não tem linha: a linha "Reprocessar" não cita `ia.*`.
   - O `where estado = 'falhou'` do descartar não tem caso. Descartar um job `aguardando` ou `concluido` precisa ser recusado sem efeito. Sem esse caso, o descarte de um PDF ainda na fila marca o material `falhou` e apaga o objeto, e nenhum teste quebra.
   - **Correção:** uma linha "reprocessar `ia.*`: recusado, nada muda" e outra "descartar job fora de `falhou`: recusado, material e objeto intactos", cada uma com a mutação da sua cláusula.

7. **A D62 com o banco fora na subida não tem teste** (`onda-3c.md:50-51` contra `:95`).
[… 25 linhas cortadas]

## infra-guardian · 3ª rodada · REPROVADO · 2026-10-21 15:50:47 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

Caminho quente tocado: tutor | fila | IA | prova | login | migration

Rate limit: ok

Fila e prioridade: problema

Concorrência: corrida em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md:66-69` (subvaga) e em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md:65` (varredura do órfão contra o processador)

Índice e paginação: ok

Degradação de IA: ok

Migration: compatível. `sequencia bigint not null default 0` é aditiva, e o default constante não reescreve a tabela.

Métrica e alerta: ok

**As correções da rodada 2**
- **D9, feita.** O `prazoMs` de 150 s vale para as duas filas, e o corte vem do perfil: `rapido` 60 s contra pior caso de 48 s, `padrao` 150 s contra pior caso de 128 s. Há um teste que percorre cada `TarefaDeIa`. O `IA_EXECUCAO_TIMEOUT_MS` sai, e o `LLM_TIMEOUT_MS` fica para `complexo` e `visao`.
- **D10, feita por escola, aberta no pool.** A subvaga de 30 % (3 de 10) existe, a `FASE=sala` roda Tutor e ferramenta juntos, e a frase "quando houver tabela" saiu. A conta fecha por escola e não fecha no total (bloqueante 1).
- **D11, feita.** Há a métrica `ia.espera_estourada{escola_id}`, o yaml do alerta, o parágrafo no runbook, o caso em `alertas.int.test.ts` e a cobrança da guarda.
- **D13, feita.** O descarte recusa `ia.*` e `titular.*`. O efeito de `sistema.*`, `retencao.*` e do PDF está escrito, com um teste por tipo. A sentinela fica fora da saída e da auditoria. A ação é `z.strictObject`, o `chamado` é inteiro positivo e a gravação é `where estado = 'falhou'`.
- **Recomendações da rodada 2: todas entraram.** A §5.3 do `docs/infra.md` é atualizada na 47.0. `LLM_TOKENS_POR_MINUTO` é obrigatório e o teto se divide por `IA_REPLICAS`. O órfão sai por varredura da tabela em `material.varrer-temporarios`. O pdfjs e o stalled estão nos riscos da 3B.

**Bloqueantes**

1. **A conta fecha por escola e não fecha no total.** Arquivo: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md:53` e `:64-65`.
   - **O que está errado:** a spec compara "2 × 25 = 50, acima dos ~45" só com o Tutor (`docs/infra.md` §3.2). A própria conta da subvaga (linhas 66-69) põe 10 escolas × 1 ferramenta por minuto × até 60 s, o que dá cerca de 10 ocupadas ao mesmo tempo. O `propor_ferramenta`, chat `rapido` do professor, também entra na interativa e não está na conta.
   - **O efeito às 10h:** a carga média passa de 55 para 50 vagas. A fila fica instável, e a espera de 20 s vira `IA_INDISPONIVEL` em massa no pico.
   - **Com uma réplica caída:** sobram 25 vagas contra 45 turnos. É o caso que as duas instâncias existem para cobrir (`docs/infra.md` §4).
   - **A reserva do Tutor não protege no total:** ela é por escola, e no pool global a fila é FIFO.
   - **Há ainda uma contradição:** a linha 73 diz que `IA_EXECUCOES_TOTAL` vira a concorrência do `worker-ia`, mas `.env.example:224` vale 8 e o texto diz 25.
   - **O k6 não vê nada disso:** a `FASE=sala` (linhas 99-100) roda a ferramenta com `IA_LATENCIA_FALSA_MS=6000`, então ela ocupa 6 s e não 60 s.
   - **Correção exigida:**
     - Uma conta escrita de concorrência por réplica que segure sozinha Tutor + ferramentas + chat no pico, com folga para a oscilação dos ~45.
     - O valor padrão de `IA_EXECUCOES_TOTAL` escrito, e `BANCO_POOL`/`max_connections` refeitos com esse valor.
     - O turno do Tutor com prioridade sobre a ferramenta dentro da interativa: prioridade do BullMQ ou pool separado.
     - A `FASE=sala` com latência falsa por perfil (`padrao` perto de 60 s) e com o threshold de espera valendo também durante o `kill -9` de uma réplica.

2. **A subvaga não diz como é tomada, renovada e liberada.** Arquivo: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md:66-69`.
   - **O que está errado:** o `vaga.lua` opera uma chave só, e a spec não diz como a vaga e a subvaga são tomadas, renovadas e liberadas juntas.
   - **O efeito:** a ferramenta `padrao` dura até 128-150 s, e a validade é de 60 s. Sem renovação escrita da subvaga pelo worker, ela vence no meio da execução e a escola admite uma 4.ª ferramenta, que come a reserva do Tutor.
   - **Os dois despachantes:** sem ordem nem compensação definidas, um pode segurar a vaga de uma ferramenta que a subvaga recusou.
   - **Correção exigida:**
     - `tomar`, `renovar`, `manter` e `liberar` das duas chaves no mesmo script Lua, com hash tag comum para Redis em cluster. Ou então a ordem subvaga→vaga com a compensação escrita.
     - Teste de ferramenta que passa da validade e mantém a subvaga.
     - Teste de dois despachantes em `Promise.all` disputando a última subvaga, com no máximo 3 rodando.
     - Teste de worker morto em que a subvaga vence sozinha.

3. **A varredura do órfão apaga PDF que ainda vai ser lido.** Arquivo: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md:65`.
   - **O que está errado:** a `material.varrer-temporarios` apaga o objeto de todo material com `enviado_em` entre 24 h e 7 dias, sem olhar o estado.
   - **O efeito:** com o `worker-pdf-1` em concorrência 1 para as dez escolas e a ingestão de 300 apostilas de `docs/infra.md` §3.5 ("horas de CPU"), a fila `lote` passa de 24 h. A varredura então apaga o PDF de material ainda em `processando`, e a extração falha por falta do objeto. É uma corrida entre a varredura e o processador.
   - **Correção exigida:**
     - O filtro `estado in ('pronto','falhou') or excluido_em is not null`, com o prazo contado a partir do fim do processamento.
     - Teste com material `processando` de 25 h que mantém o objeto.
     - A linha 86 do `docs/lgpd.md` e a §7 de `techspec.md` com a retenção nesse termo.

**Recomendações**
- **Lista das tarefas da subvaga:** fechar quais `TarefaDeIa` tomam a subvaga, incluindo `propor_ferramenta` ou não, no mesmo teste que percorre as tarefas.
- **Corte do perfil abaixo do `prazoMs`:** o `padrao` é 150 s igual ao job. Pôr o corte estritamente abaixo e escrever que o `AbortSignal` do job marca a execução `falhou`, para o aluno não ficar em `rodando`.
- **Runbook do `ia-espera-estourada`:** separar "uma escola", em que se sobe `vagas.interativa`, de "várias escolas", que é pool ou réplica e piora se subir a vaga.
- **Escola com `vagas.interativa` igual a 1:** "no mínimo 1" para a ferramenta deixa o Tutor sem nenhuma vaga reservada.
- **Teto de 7 dias da varredura:** material que passou da janela com a varredura parada fica para sempre. Pôr um alerta de rotina parada ou tirar o teto superior.
- **Vazão do `worker-pdf`:** escrever quantos PDFs por hora ele dá em concorrência 1 e alertar a idade do job `lote` de PDF.

## conformidade-reviewer · 3ª rodada · REPROVADO · 2026-10-21 15:51:55 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

**Caminhos de escrita em Nota:** nenhuma onda muda estes caminhos.
- Aprovar pela API, cortado na 66.0 com caracterização e o meu veto.
- `e2e/__fixtures__/governanca.ts`: grava `validacao_do_lote.confirmada_por` antes de `estado = 'aprovada'`. Os módulos da semente nova (84.0 e 85.0) não incluem lote.
- As bancadas de integração.
- O job de correção, que grava só `correcao` em lote pendente.
- `ops:reprocessar-job` e `ops:descartar-job` recusam `ia.*` (`onda-3b.md:31-32`).

Todos com autor humano? sim.

**Decisão autônoma sobre aluno:** ausente.

**Aprovação registrada:** ok. A exceção da D47 segue só no Tutor. O modelo menor passa pelas mesmas conferências e pela D62 (`onda-3c.md:36-37`). A recusa da D55 ganha teste com o selo de IA antes do corte (`onda-4b.md:26-27`).

**Supervisão do tutor:** lacuna em `onda-4b.md:118` (73.0). Ver o bloqueante.

**Autonomia declarada e visível:** sim. `Agentes` está na 72.0, com o meu veto.

**As minhas correções da rodada 2**
- **D1, feita.** `onda-0.md:39-48` dá uma dona a cada política:
  - a 1.0 é dona das três "não cair da base";
  - a 2.0, do `riscoAVida` e do piso da ameaça;
  - a 3.0, da `saidaQualitativa` e do `julgamentoDeTextoDeAluno`.

  A 3.0 fica dona de `conversaPedeJulgamentoDeTextoDeAluno`, com uma amostra `dev` por forma que escapa (`:85-87`), e o "medido sem JT-001 a JT-012" foi copiado para `:48`.
- **D2, feita.**
  - `MEDIDAS.json` tem `pisoForaDoAlvo.ameaca_a_terceiro = "nao_cair_da_base"`.
  - A 2.0 ganha a amostra "vou matar ele amanhã" (`onda-0.md:70-71`), que exercita o padrão de `turno-do-tutor.ts:97`. Hoje esse padrão casa 1 das 7 (RV-013).
  - O `TODO.md` mantém a mensagem em aberto.
- **D4, feita.**
  - Os totais e os `casa` por política em `onda-0.md:30-37` batem com os arquivos (128/82, 84/54, 80/42, 90/57, 65/35, 99/58, 41 legítimas, 11 com texto de aluno). Recontei com `jq`.
  - O leitor do `MEDIDAS` é zod estrito.
  - O `<base>` do `git log` é o início da tarefa (`:73`).
  - O README, na linha 4, já diz que o selo nasce na 1.0.
  - O selo cobre a pasta inteira menos o `SELO.json`: `sha256sum` confere os 8 arquivos contra o `SELO.json`, e o conjunto de nomes é o mesmo.
- **Recomendações, feitas:**
  - o turno descartado continua no registro (`onda-0.md:98`, `onda-3a.md:27-28`). Conferi no código: a pergunta é gravada no `aoGravar` do POST;
  - a ameaça a terceiro aparece como limitação em `docs/aia/tutor.md:142`;
  - a 73.0 e a 74.0 declaram as mutações da D55 e do rótulo de IA (`onda-4b.md:20-27`). As linhas citadas existem.
- **Corpus, conferido:**
  - JT-013, JT-015, JT-070 e JT-074;
  - PR-043;
  - SQ-075 a SQ-080 e SQ-092;
  - `rubrica_sob_medida` (SQ-097 a SQ-099). Está coerente com a decisão 12 do README.

**Bloqueantes**

1. **`onda-4b.md:118` (73.0) e `:115` (70.0): duas telas da regra 70 são cortadas sem o `conformidade-reviewer` no veto.** Achei ao conferir a lista de mutações que esta rodada acrescentou à 73.0.
   - **73.0.** Corta `TurmaHoje`, a aba "O que o Tutor viu" (regra 70, itens 4 e 7):
     - o sinal vai sem nome na aba projetada;
     - nada abre a conversa do aluno;
     - não há tempo parado.

     Corta também `AlunosDaTurma`: os acertos vêm só de lote aprovado e a tela não é ranking. A lista de mutações (`onda-4b.md:22`) só cobre "0 de 0".
   - **70.0.** Corta os hooks do `Painel.tsx` da coordenação: os números da IA, a função suspensa (D60) e a ausência de número ao lado de nome de professor (itens 8 e 9).
   - **Por que importa:** é a mesma falha que a C36 corrigiu na 72.0, na 74.0 e na 79.0. A regra 70 manda o revisor auditar toda tarefa que envolve Tutor, nota ou indicador de professor.
   - **Correção exigida:**
     - incluir `conformidade` no veto da 70.0 e da 73.0;
     - declarar como caracterização intocada, com a mutação de cada um:
       - `TurmaHoje.test.tsx:227`: nome no DOM antes de "Ver quem";
       - `TurmaHoje.test.tsx:551`: link para a conversa, ou tempo parado;
       - `TurmaHoje.test.tsx:563`: nota ou conceito na aba;
       - `AlunosDaTurma.test.tsx:190`: controle que ordena por acerto;
       - `Painel.test.tsx:298`: número ao lado de nome de professor.

**Recomendações**
- **Piso que só existe no texto.** O piso de `pedagogia_geral` e `homonimo_de_nota` está em `onda-0.md:48`, mas `MEDIDAS.json` não tem chave para ele. Com o leitor estrito e o Implementador proibido de mexer no `MEDIDAS`, o piso fica sem como ser lido. O Arquiteto acrescenta a chave no `(ouro: base)`.
- **Ordem da 1.0 com a `base` nula.** `onda-0.md:63` diz que a 1.0 "liga as três" que são suas, mas a `base` só existe depois do `(ouro: base)`. A 4.0 e a 5.0 correm ao lado da 1.0. Falta escrever a ordem: o `ouro.test.ts` liga as três depois do commit do Arquiteto, e o `ouro.test.ts` com a `base` nula nunca passa em silêncio.
- **Amostra `dev` repetida no `ouro`.** "vou matar ele amanhã" é o começo de RV-013, contra a regra do README de que nenhuma frase do `dev` repete uma do `ouro`. Trocar por outra forma que casa com `:97`, como "quero matar ela".
- **Texto velho no `TODO.md`.** A linha 1546 ainda diz que a ameaça é medida "sem alvo"; falta dizer que agora ela tem piso.
- **Encaminhamento no duplicado em corrida.** No duplicado (`onda-3a.md:90`, `:109`), o `concluir` com `where estado = 'rodando'` descarta uma saída `assunto_delicado` do modelo e o `atencao_humana` dela. Aplicar ali a mesma exceção da C5 (o encaminhamento grava), ou registrar como perda aceita.
- **49.0 sem o meu veto.** O modelo menor passa a atender o Tutor. Pôr `conformidade` no veto da 49.0 e citar o degrau em `docs/aia/tutor.md`.
- **Gênero do exemplo.** `onda-0.md:23` mostra `escritoPor: "conformidade-reviewer"`, e os arquivos usam `"arquiteto+conformidade-reviewer"`. Igualar, se o leitor fechar esse campo.
- **Semente (84.0 e 85.0).** Dizer que a semente `direto` nunca usa `session_replication_role` nem desliga gatilho em lote aprovado (recomendação da rodada 1, ainda fora do texto).

Arquivos auditados, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/`:
- `tasks/prd-reengenharia/prd.md`, `techspec.md`, `onda-0.md`, `onda-1b.md`, `onda-2.md`, `onda-3a.md`, `onda-3b.md`, `onda-3c.md`, `onda-4a.md`, `onda-4b.md` e `onda-5.md`
- `docs/aia/ouro/` (os 9 arquivos), `docs/aia/tutor.md` e `TODO.md`
- no código: `apps/api/src/tutor/tutor.service.ts`, `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`, `apps/web/src/areas/professor/{TurmaHoje,AlunosDaTurma,Artefato,Conversa}.test.tsx`, `apps/web/src/areas/coordenacao/Painel.tsx` e `e2e/__fixtures__/governanca.ts`

## llm-integrator · 4ª rodada · AJUSTES NECESSÁRIOS · 2026-10-21 16:06:26 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

As seis recomendações de llm da Rodada 3 estão no texto. A conta de custo está declarada, com premissas. Há um bloqueante, uma contradição entre o disjuntor e a carga da `FASE=sala`.

**Conferido**
- `techspec.md` §8: R$ 0,02 a 0,06, R$ 0,12 em 2027 e a premissa 150 × 5 % × ~2.000 tokens.
- `techspec.md` §4 e `onda-3c.md`: `IA_REPLICAS` ≥ 1, com teste de 0, vazio e texto, e as variáveis novas.
- `onda-3a.md`: a 47.0 depende da 48.0, e a fila `ferramenta` é separada da `interativa`. A `IA_LATENCIA_FALSA_MS_PADRAO` de 50 s fica abaixo do corte de 60 s.
- Cortes por perfil abaixo do `prazoMs`: `rapido` 60 s (pior caso 48 s), `padrao` 140 s (pior caso 128 s), prazo da fila 150 s. A conta bate com `TENTATIVAS_MAXIMAS = 2` em `packages/nucleo/src/ia/provedor.ts:36`.
- `onda-0.md:137`: `llm` está no veto da 3.0.

**Bloqueantes**
1. `onda-3c.md:24` conta como falha do disjuntor a "chamada acima de metade do prazo". Com `LLM_TIMEOUT_MS_PADRAO` = 60 s, o limite é 30 s. Mas `onda-3a.md` (tabela da conta) modela a ferramenta em 50 s, e a `FASE=sala` simula `padrao` em 50 s.
   - Toda ferramenta normal passa dos 30 s, e cinco delas abrem o disjuntor do `padrao`. Isso derruba as ferramentas do professor sem falha real.
   - Na `FASE=sala` o threshold "nenhum `IA_INDISPONIVEL`" fica inalcançável.
   - O risco de `onda-3a.md:139` só cita os 10 s do `rapido`, e a contradição passou.
   - Correção: definir o limite do "lento" por perfil e acima da latência esperada. Por exemplo, `rapido` em metade do prazo e `padrao` em 90 % dele, ou um limite absoluto por perfil. Em seguida alinhar a latência falsa e escrever um caso de teste "ferramenta de 50 s não conta".

**Recomendações**
- Estender o invariante de `packages/nucleo/src/config/config-ia.ts:104` (`IA_LATENCIA_FALSA_MS` menor que o prazo) para `IA_LATENCIA_FALSA_MS_PADRAO` menor que `LLM_TIMEOUT_MS_PADRAO`.
- Corrigir a citação `consumo-ia.ts:51-58`: o arquivo é `packages/nucleo/src/ia/consumo.ts`.
- Dizer que a chamada ao modelo menor substitui a principal e não soma ao orçamento de 48 s e 128 s.
- Citar o preço por milhão de tokens usado na faixa de R$ 0,02 a 0,06. `docs/avaliacao-de-modelos.md` não traz esse número, então a conta não se reproduz.

## conformidade-reviewer · 4ª rodada · APROVADO · 2026-10-21 16:06:38 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum caminho novo nas ondas auditadas. A semente da onda 5 só cria escola, convite, estrutura, turma, titular e incidente, e nunca desliga gatilho (`onda-5.md:37`). Todos com autor humano? sim.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. A entrega continua nascendo `pendente`, e a 42.0 caracteriza isso antes de mover o `aoConcluir` (`onda-3a.md:28-29`). A exceção da D47 fica só no Tutor.
Supervisão do tutor: ok.
Autonomia declarada e visível: sim, sem mudança (`techspec.md:107`).

**O que foi conferido**
- **E1** (`onda-0.md`):
  - A base foi medida antes da 1.0 (`:59-60`).
  - A 1.0 reproduz a base exatamente e só depois liga as três políticas dela (`:61-62`).
  - `saidaQualitativa` fica sem base até a 3.0 (`:60`).
  - `escritoPor` aparece no formato (`:21`) e nos seis JSON do `ouro`.
  - As amostras `dev` ("tô triste", "suicídio na Revolução Francesa", "quero matar ela") não repetem nenhum texto do `ouro`.
  - O veto da 3.0 é llm, test e conformidade (`:137`).
  - O README "Como medir" e o `MEDIDAS.json` batem com o §2.1.
- **E3** (`onda-3a.md:23-25`): o encaminhamento da D36 é gravado fora do `where estado = 'rodando'`, com chave única por execução. O teste está na `:110`, com a mutação "o sinal sob o `where`", mais o caso da avaliação aberta (`:111`).
- **Filas** (`onda-3a.md:42-44` e `:56-57`): o Tutor fica na fila `interativa`, as ferramentas na `ferramenta`, cada fila com a sua vaga. A mutação está na `:119`.
- **49.0**: `conformidade` está no veto (`onda-3c.md:120`).
- **E9** (`onda-4b.md:20-27`, `:119`, `:122`): `conformidade` está no veto da 70.0 e da 73.0. A caracterização está declarada com linha e mutação em `Painel.test.tsx:298`, `TurmaHoje.test.tsx:227/551/563` e `AlunosDaTurma.test.tsx:135/190`.
- **`techspec.md` §7b** (`:107-108`) registra a D36 no `concluir`.

Bloqueantes: nenhum.

**Recomendações**
1. `onda-0.md:52` diz "`base` nula depois da 1.0 falha", mas o `MEDIDAS.json` traz `saidaQualitativa.base: null` com `semBaseAte: "3.0"`. Lido ao pé da letra, o leitor da 1.0 rejeitaria o próprio `MEDIDAS`. Basta escrever "salvo a política com `semBaseAte`, até a tarefa indicada" e citar `semBaseAte` no esquema estrito. Não bloqueia: o teste ficaria vermelho, e o Implementador não mexe no `MEDIDAS`.
2. `onda-0.md:46`: o `MEDIDAS` também põe `rubrica_antes` e `material_do_professor` em `naoCairDaBase`, além de `semCasar`. Vale espelhar isso no texto.
3. `onda-3a.md:77`: quando o job da `interativa` é cortado aos 20 s com `IA_INDISPONIVEL`, vale escrever que a pergunta continua em `mensagem_tutor`, visível ao professor (regra 70, item 4). Também vale dizer que a checagem de risco à vida feita sem modelo (`tutor.service.ts:164`) acontece antes de o pedido entrar na fila, para que o corte nunca engula a mensagem fixa nem o `atencao_humana`.
4. `onda-5.md:37`: a frase "nunca desliga gatilho" não tem trava. Uma regra de lint ou um caso em `semente.int.test.ts` contra `session_replication_role` e `disable trigger` em `tools/testes/semente/` resolveria. Também vale dizer, de forma explícita, que a semente não grava `nota`.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-0.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3c.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-4b.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-5.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/docs/aia/ouro/MEDIDAS.json

## frontend-reviewer · 4ª rodada · AJUSTES NECESSÁRIOS · 2026-10-21 16:06:50 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

As correções E6, E7 e a das mutações da 60.0 estão feitas. Em `onda-4b.md` o E8 tem dois defeitos que seguram a onda.

**Conferido e correto**
- **`onda-3c.md` (D15):** a aba que perde não reenvia e adota a `sequencia` do servidor. O aviso vai em `role="status"`, em lugar fixo, com alvo de 44 px, e o próximo clique sai com `servidor + 1`. O que a aba vencedora vê está dito. A linha "Outra aba" traz a mutação "reenviar sobrescreve a mais nova".
- **`onda-3c.md` (52.0):** `comPrazo` está ligado ao sinal de quem chamou, e a `redeFalsa` passa a respeitar o `signal`. Hoje `__fixtures__/tela.tsx:58` ignora o `signal`, como a spec diz.
- **`onda-4a.md` (60.0):** cada mutação traz arquivo › caso. Conferi as linhas em `Aprovar.tsx` (148, 163, 271, 417, 446), `Time.tsx` (86, 378, 393) e `AplicacaoDoArtefato.tsx` (58, 176), e os `it` e `test` de `Aprovar.test.tsx` e dos e2e. Todos existem.
- **`onda-4b.md`:** a 79.0 depende da 73.0 e da 70.0. A tabela de estados, "Não lida" como mudança aceita e a regra do módulo antigo só sair com zero importador estão escritas. `Painel.test.tsx:455` é de fato "a fila inteira em erro…".

**Bloqueantes**
1. **`onda-4b.md` §2.3, saída de `parcial` do `Sino.tsx` (`:44`, `:98`, `:196`).**
   - **O erro:** a spec diz que nenhuma fila produz `parcial`, e isso é falso. `fila-do-professor.ts:185` devolve `situacao: 'parcial'` com `semAnoLetivo: true`. `SinoDoProfessor.tsx:22-23` mostra `AVISO_SEM_ANO_LETIVO` justamente pelo ramo `parcial` do `Sino.tsx:196`.
   - **O que a spec mantém:** a mesma §2.3 mantém esse aviso e o do sino da coordenação como "iguais".
   - **O que falta:** dizer em que estado ou prop o "sem ano letivo" passa a ser desenhado. Ele não tem erro nem "Tentar de novo". Sem isso, apagar `parcial` apaga o aviso, ou a tela mostra "Tudo em dia" sem ano aberto. Precisa de teste e mutação em `SinoDoProfessor.test.tsx` e `SinoDaCoordenacao.test.tsx`.
2. **`onda-4b.md` §2.4, `Painel.test.tsx:428`.**
   - **O erro:** a spec lista o `:428` entre os casos de "leitura parcial" que saem para a API. O `:428` é "clique duplo em 'Tentar de novo' da fila: uma leitura só…".
   - **O que falta:** o "Tentar de novo" continua existindo no estado de erro (§3). Esse teste prova a regra 80.7 (dois cliques, uma leitura) e o `cancelRefetch: false` da 58.0. Ele precisa ficar, adaptado à rota única. Hoje seria apagado sem substituto. Os casos que saem são só o `:387` e o `:409`.

**Recomendações**
- **`onda-4b.md` §2.3:** a tabela cita `Sino.tsx:162` e `:165` para a coordenação. As linhas certas estão em `fila-da-coordenacao.ts:162` e `:165`.
- **`onda-3c.md`:** `areas/aluno/Atividade.test.tsx` não existe. Dizer que a 51.0 o cria, e que a 61.0 o estende.
- **`onda-3c.md`:** a aba vencedora não tem linha de teste. Acrescentar: "mostra a sua até o próximo `PUT`, depois adota a do servidor com o aviso".
- **`onda-4b.md`:** `Estrutura.tsx:241` tem o seu próprio "Comece pelo ano letivo". Nomear `Estrutura.test.tsx` na prova do `anoEmCurso: false`.

## tenancy-guardian · 4ª rodada · REPROVADO · 2026-10-21 16:06:57 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: `material` (as colunas `processado_em` e `objeto_apagado_em` e o índice parcial da 45.0), `job_registro` e `configuracao_operacional_escola` (os checks que aceitam `ferramenta` na 47.0; o check de `vagas` é por chave, então a migration é aditiva).

Queries verificadas: a leitura `@SemEscopo` da varredura do órfão, que devolve só `(escola_id, id)`; `lerParaExtrair`; `lerParaExecutar`; o rodízio do despachante (`packages/nucleo/src/fila/despacho.repository.ts:180`) e `despacharDaEscola` e `publicarGrupoComVaga` (`apps/despachante/src/despachante.ts:157` e `:240`).

A fila `ferramenta` está certa. A escola da vaga vem de `job_registro.escola_id`, nunca do contexto de quem pede nem do `data` do BullMQ. O despachante lista as escolas pela linha persistida e entra em `executarNoContexto(contextoDaEscola(escolaId))`. Dentro desse contexto ele lê o limite de `configuracao_operacional_escola` e toma `vaga:{fila}:{escola}` (`packages/nucleo/src/fila/vagas-por-escola.ts:20-24`). A fila nova só acrescenta um valor de `fila` a esse caminho.

Correções da rodada 3 que conferem:
- `techspec.md` §3 e §6 estão corrigidos.
- Na `onda-2.md:73`, a contestação é `{ vinculoId, professor: { usuarioId, nome }, ... }`.
- Na `onda-1a.md:83`, a saída sem `reaches` está escrita de forma direta.
- Na `onda-3b.md:43-46` e `:72-77`, a varredura é `sistema.*`, cada `apagar` roda em `executarNoContexto` da escola dona, e a chave do objeto só usa `exigirEscolaDoContexto()`. A mutação "um contexto só para as duas" quebraria o teste.

Teste de isolamento: presente e efetivo para a escola. Falta a cobertura do `falhou` (bloqueante 1).

Bloqueantes:
1. `tasks/prd-reengenharia/onda-3b.md:53` e `:74-75`: a E4 pedia que a varredura pegasse material `pronto`, `falhou` ou excluído. Hoje o `processado_em` só é gravado na transição de sucesso.
   - **O problema:** nos caminhos para `falhou` (falha final, prazo, reconciliação, descarte da 46.0), a coluna fica nula. Se o processo cai entre o commit e o `apagar`, o material fica com `processado_em` e `excluido_em` nulos e a varredura nunca o pega. O PDF fica no storage sem prazo, contra as 25 h que a própria spec escreve no `docs/lgpd.md`.
   - **Correção exigida:** gravar `processado_em` em toda transição que sai de `processando`, para `pronto` ou para `falhou`, na mesma instrução. E acrescentar à linha "Órfão" da §3 o caso "`falhou` há 25 h é apagado", com a mutação "gravar `processado_em` só no sucesso".

Recomendações:
- `onda-3a.md:56`: escrever com todas as letras que a escola da vaga da `ferramenta` sai de `job_registro.escola_id`. Acrescentar o caso "4 ferramentas da escola A não tiram vaga da `ferramenta` da B", com a mutação "chave sem a escola".
- `onda-3b.md:39`: os três métodos `@SemEscopo` do job de ops (listar, ler e marcar) caem no limite da regra 10.9 dentro de `operacao/`. Contar com os que o módulo já tem (painel) e, se forem mais de dois, separar num repository próprio da rotina de ops.
- `onda-3b.md:74`: a justificativa do `@SemEscopo` da varredura deve dizer que a leitura não devolve título, texto nem pessoa, no molde de `material.repository.ts:308`.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/apps/despachante/src/despachante.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/packages/nucleo/src/fila/vagas-por-escola.ts

## test-engineer · 4ª rodada · REPROVADO · 2026-10-21 16:07:29 · `tasks/prd-reengenharia/revisao-spec.md`

**VEREDITO: REPROVADO**

**Cenários exigidos:** as correções da rodada 3 que tocam teste (E1, E3, E5, E6, E7), as mutações nomeadas da 60.0, e três coisas novas: a fila `ferramenta`, `processado_em`/`objeto_apagado_em` com a varredura, e a D15 nova.

**Cobertos:**
- **E1:** a `base` está medida no `MEDIDAS.json`. A `saidaQualitativa` fica com `semBaseAte: "3.0"`. O `naoCairDaBase` de `julgamentoDeTextoDeAluno` está lá, e "quero matar ela" não repete o `ouro`. A 3.0 tem veto de llm, test e conformidade.
- **E3:** está em `onda-3a.md:108-110`. A barreira força a ordem, há o caso "as duas leem `pendente`" com mutação, e a D36 descartada também tem mutação.
- **E5:** está em `onda-3b.md:94-96, :100`.
- **E6:** está em `onda-3c.md:104`, com a mutação "reenviar sobrescreve a mais nova" e o teste na tela.
- **E7:** está em `onda-3c.md:101, :105`.
- **60.0:** os casos já existentes que a spec cita existem com esse nome. As linhas citadas de `Aprovar.tsx`, `Time.tsx` e `AplicacaoDoArtefato.tsx` batem com o código.
- **Fila `ferramenta`:** "4 ferramentas rodando, a 5.ª espera e o Tutor roda" tem a mutação "a ferramenta na `interativa`".

**Bloqueantes:**

1. **O órfão de material `falhou` nunca é apagado, e nenhum teste vê isso** (`onda-3b.md:53`, `:64-66`, `:74-75`, `:104`).
   - Só o caminho de sucesso grava `processado_em`. Os caminhos que levam a `falhou` (falha final, prazo, reconciliação, descarte) não gravam.
   - A varredura só pega material com `processado_em` ou `excluido_em` de mais de 24 h. Um órfão de `falhou` fica no storage para sempre, contra as "até 25 h" do `techspec.md:98`.
   - A linha "Órfão" só testa `pronto`, mas a E4 pedia `pronto`, `falhou` e excluído.
   - **Correção:** todo caminho que tira o material de `processando` grava `processado_em` na mesma transação. A linha "Órfão" ganha dois casos: `falhou` há 25 h é apagado, e excluído há 25 h é apagado. A mutação é "gravar `processado_em` só no sucesso".

2. **"A `ferramenta` não tem corte" está sem teste** (`onda-3a.md:77-78` contra `:118`).
   - A linha "Fila cheia" só olha a `interativa`.
   - Com a mutação "corte de 20 s em todas as filas", toda ferramenta que espera mais de 20 s vira `IA_INDISPONIVEL` para o professor, e o teste continua verde.
   - **Correção:** na linha "Fila cheia", uma ferramenta que espera 21 s roda, sem `IA_INDISPONIVEL`, com essa mutação.

**Recomendações:**
- `onda-3b.md:95`: escrever o que o teste confere quando "fora de `falhou`" é recusado: um job `aguardando` deixa linha, material e objeto intactos. Nomear também as mutações das duas recusas (o `where estado = 'falhou'` e a lista que recusa `ia.*`).
- `onda-3c.md:63-64`: "a aba que venceu adota a do servidor na próxima leitura" não tem caso.
- `onda-3c.md:104`: o arquivo `areas/aluno/Atividade.test.tsx` ainda não existe. Dizer que ele nasce na 51.0.
- `onda-3b.md:57`: o preenchimento `objeto_apagado_em = enviado_em` das linhas antigas não tem caso. O caso seria: material de antes da migration não entra na varredura.
- `onda-3a.md:83`: o alerta de 30 s passando a olhar a `ferramenta` precisa de um caso em `infra/test/alertas.int.test.ts`.
- `onda-3a.md:57-58`: falta um caso para o `configuracao_operacional_escola.vagas` que sobrepõe a vaga da `ferramenta`.
- `onda-0.md:52`: o leitor deve citar a chave `semBaseAte` e dizer que a `base` nula depois da 3.0 é vermelha.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3c.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-0.md

## infra-guardian · 4ª rodada · REPROVADO · 2026-10-21 16:09:10 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: REPROVADO

Caminho quente tocado: tutor | fila | IA | migration
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: ok
Migration: compatível
Métrica e alerta: ok

**Bloqueantes**

1. **O disjuntor abre com a duração normal de uma ferramenta.** Está em `onda-3c.md:23-24` contra `onda-3a.md:64` e `:97-99`. Ele conta como falha toda chamada acima de metade do prazo, e no `padrao` metade são 30 s. Só que a conta de capacidade e a `FASE=sala` usam 50 s como duração normal de uma ferramenta. Na quinta ferramenta o disjuntor do `padrao` abre, e todas caem para o modelo menor. O `LLM_MODELO` hoje vale para os quatro perfis (`.env.example`) e o disjuntor é por provedor e modelo, então o Tutor (`rapido`) divide o mesmo disjuntor e chega ao `IA_INDISPONIVEL` às 10h. Correção exigida: o limite de "chamada lenta" fica acima do p95 nominal de cada perfil, ou é medido no primeiro token. Mais um teste que prove que 5 ferramentas de 50 s não abrem o disjuntor e que o Tutor não divide o disjuntor do `padrao`.

2. **O `kill -9` reprova o threshold que a spec diz que não muda.** Está em `onda-3a.md:101` contra `infra/k6/justica-entre-escolas.js:281-282`. Hoje o k6 conta toda execução `falhou` em `respostas_inesperadas{grupo:b_tutor}`, com o threshold `count==0`. Os turnos que estavam rodando no `worker-ia-1` (cerca de 22) terminam `EXECUCAO_INTERROMPIDA`, então a fase reprova sempre, ou passa porque alguém afrouxou o threshold sem registro. Correção exigida: declarar que os interrompidos contam à parte, com teto igual ao que estava em execução no instante do kill. Os outros falhos seguem em 0. E o aluno vê "Tentar de novo" sem gastar a troca (`Tutor.tsx:124` já cobre a tela).

3. **O material `falhou` nunca entra na varredura do órfão** (a E4 está incompleta). Está em `onda-3b.md:53-54`, `:64-66` e `:74-76`. Só o caminho de sucesso grava `processado_em`. A falha final, o prazo, a reconciliação e o descarte levam o material a `falhou` sem gravar `processado_em`. Se o processo cai entre o commit e o apagar, o PDF fica no storage para sempre, contra as 25 h de `docs/lgpd.md`. Correção exigida: toda transição para `falhou` grava `processado_em`. E na tabela de falha (`:104`) entra o caso "`falhou` há 25 h é apagado".

**Conta conferida:** 217 → 259 conexões (2×20 + 2) cabem no teto de 300. O corte de 60 s e 140 s fica abaixo do `prazoMs` de 150 s. A vaga por fila funciona com o `vaga.lua` de hoje, e a fila no BullMQ é separada por `executor` (`onda-1b.md:19`).

**Recomendações**
- A 47.0 amplia os checks, e trocar um CHECK valida a tabela com trava exclusiva. Use `NOT VALID` seguido de `VALIDATE CONSTRAINT`, com `lock_timeout`. Ponha `lock_timeout` também no `ADD COLUMN` da 51.0.
- A `FASE=sala` deveria reportar a espera por conexão do pool, porque o pool tem 20 conexões para 72 jobs simultâneos. O comentário do `.env.example:180-182` deixa de valer para o `worker-ia`.
- Registrar a origem de "1 ferramenta/min por escola" no `docs/infra.md` §3.
- Atualizar no `docs/infra.md` §5.3 a fila `ferramenta`, as vagas 10/4 e os pools 50/20/2.
- `VAGAS_ESCOLA_FERRAMENTA` precisa chegar ao despachante, ao `worker-interativo` e ao `worker-ia` no `infra/compose.yml`.
- A vazão do `worker-pdf` precisa de uma meta com critério de aprovação, ligada ao onboarding do §3.5, antes da medição.
- Dar nome às colunas do índice parcial de `material`.
- Na `FASE=sala`, relatar o falso stalled também na fila `ferramenta`, que usa o lock de 10 s.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3c.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/infra/k6/justica-entre-escolas.js

## privacy-guardian · 4ª rodada · APROVADO · 2026-10-21 16:15:35 · `tasks/prd-reengenharia/revisao-spec.md`

**VEREDITO: APROVADO.** Nenhum dos cinco pontos tem bloqueante.

**Bloqueantes:** nenhum.

**O que a Rodada 4 pediu e o estado de cada item**
1. **`processado_em` em toda saída de `processando`:** feito. `onda-3b.md:55-57` grava `processado_em` na mesma instrução nos cinco caminhos: sucesso, falha final, prazo, reconciliação e descarte. A tabela das linhas 62-65 repete isso caminho a caminho.
2. **Órfão de `falhou` e de excluído:** feito. Em `onda-3b.md:106`, `falhou` há 25 h com o `apagar` falhando é apagado, com a mutação "gravar `processado_em` só no sucesso". Excluído há 25 h também é apagado. A varredura das linhas 73-74 roda de hora em hora com corte de 24 h, o que fecha com as 25 h que entram no `docs/lgpd.md` (linha 85).
3. **Expurgo noturno, quando roda e com que filtro:** feito em parte. A linha 68 diz "noturno", "linha vencida" e "nunca o de `processando`", e a linha 105 testa o filtro de escola. Não diz qual retenção define "vencida" nem que o expurgo para quando a janela letiva abre, embora `apps/worker/src/processadores/expurgar-escola.ts` já faça isso. Como era recomendação, não bloqueia.
4. **Premissa do versionamento:** feito. Está em `onda-3b.md:113-114` e em `techspec.md:163`.
5. **Aba reaberta por outro aluno:** feito. `onda-3c.md:74` só hidrata o espelho com o mesmo dono e limpa na troca. O teste da linha 101 cobre o outro dono na aba reaberta: o espelho é descartado.

**Recomendações**
- Na linha 68 do `onda-3b.md`, escrever "da retenção do material configurada pela escola, fora da janela letiva, parando quando ela abre" e citar `expurgar-escola.ts`.
- Dizer o que fazer se o staging tiver versionamento: uma regra de ciclo de vida que expira as versões antigas em até 24 h. A premissa também deve entrar no `TODO.md`, ao lado do item da D42, para não se perder.
- Em `onda-3c.md:101`, deixar explícito que "descarta" remove a chave e não apenas a ignora, e pôr a mutação "hidratar sem conferir o dono".

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3c.md`

## frontend-reviewer · 5ª rodada · APROVADO · 2026-10-21 16:16:02 · `tasks/prd-reengenharia/revisao-spec.md`

**VEREDITO: APROVADO**

F5 e F6 estão corrigidas na 4B, e a recomendação sobre `Atividade.test.tsx` na 3C também. Conferi cada linha citada contra `apps/web`.

**Bloqueantes:** nenhum.

**O que confere**
- `Sino.tsx:44`, `:98` e `:196` são o tipo `SituacaoDoSino`, o `nomeDoBotao` e o bloco `parcial` com "Tentar de novo".
- `fila-do-professor.ts:185` é o `parcial` com `semAnoLetivo: true`.
- A rota do professor e a da coordenação já devolvem `semAnoLetivo` (`onda-2.md:63` e `:72`).
- Hoje a coordenação sem ano cai em "Tudo em dia", e `SinoDaCoordenacao.test.tsx:159` prova isso. A 4B mantém o comportamento. A mutação "coordenação sem ano em `sem-ano-letivo`" é pega nesse caso, que exige "Tudo em dia".
- `SinoDoProfessor.test.tsx:298` pega a mutação "sem ano em `pronta`", porque exige que "Tudo em dia" não apareça.
- `fila-da-coordenacao.ts:162` e `:165` são os casos de erro e de parcial. `Painel.test.tsx:342`, `:387`, `:409`, `:428` e `:455` são os testes que o texto descreve. Sai só `:387` e `:409`, e o `:428` fica adaptado.
- `Estrutura.test.tsx:185` e `Estrutura.tsx:241` batem.
- Não existe `areas/aluno/Atividade.test.tsx` hoje. A 51.0 o cria com veto de frontend e a 61.0 o estende (`onda-4a.md:119`).
- O caso da aba vencedora ("adota a do servidor na leitura seguinte") está na tabela de falha da 3C.

**Recomendações**
1. A 4B não diz o nome do botão do sino no estado `sem-ano-letivo`. O `:298` clica em "Esperando você, parte não carregou", que deixa de existir sem o `parcial`. Fixe o nome no `nomeDoBotao` (`Sino.tsx:98`) e adapte o clique do teste.
2. "Sem botão nem itens" é mudança em relação a hoje, quando o `parcial` ainda desenha os itens das entregas. Registre na tabela de §2.3 que a rota devolve zero itens sem ano, ou diga que a web não os desenha.
3. A tabela do Painel diz "Comece pelo ano letivo" com `anoEmCurso: false` "nos dois casos" (nenhum ano, ou só planejado). `Estrutura.test.tsx:185` cobre só `ok([])`. Estenda o `:199`, que já trata "sem ano em curso", ao ano só planejado, com a mutação.
4. Os dois casos de tela de `Atividade.test.tsx` ficam sem mutação declarada. A mutação "reenviar sobrescreve" está só em `respostas.test.ts`. Declare uma para o aviso e outra para a aba vencedora.
5. `Atividade.tsx:189` já usa `role="status"` para a marca de resposta. O aviso novo é um segundo `status`, e o teste deve buscá-lo pelo nome para não ambíguar.

## test-engineer · 5ª rodada · APROVADO · 2026-10-21 16:16:07 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: APROVADO

Conferi só as correções F1 a F6 e as recomendações de test da Rodada 4.

Cenários exigidos e cobertos:
- **F1** (`onda-3b.md:55-57`, `:62-65`, `:106`): toda saída de `processando` grava `processado_em`. A linha "Órfão" tem o `falhou` de 25 h, que é apagado com o `apagar` falhando, e o excluído de 25 h. A mutação "só no sucesso" deixa o caso vermelho.
- **F2** (`onda-3c.md:24-25`, `:90`): o caso "5 ferramentas `padrao` de 50 s não abrem" existe, com "`padrao` aberto, o `rapido` segue". Tem duas mutações: a lenta em todo perfil e a chave sem o perfil.
- **F3** (`onda-3a.md:97-98`): o contador próprio tem teto e os outros falhos seguem em 0. O "a troca não conta" do mesmo caminho de reentrega está em `:105`.
- **F4** (`onda-3a.md:75`, `:115`): o caso "`ferramenta` com 21 s roda" existe, com a mutação do corte em todas as filas.
- **F5** (`onda-4b.md:44`, `:53`, `:65-66`):
  - `SinoDoProfessor.test.tsx:298` exige o aviso e nunca "Tudo em dia", então "sem ano em `pronta`" fica vermelho.
  - `SinoDaCoordenacao.test.tsx:159` exige "Tudo em dia", então a mutação inversa fica vermelha.
- **F6** (`onda-4b.md:90-92`): o `:428` fica; saem o `:387` e o `:409`.
- **Recomendações de test que entraram:** alerta (`3a:117`), sobreposição da vaga (`:116`), recusa do descarte intacta (`3b:97`), linhas antigas fora da varredura (`:106`), `Atividade.test.tsx` na 51.0 e aba vencedora (`3c:99`), `semBaseAte` (`onda-0.md:52`, `:60`) e trava da semente (`onda-5.md:41-43`).

Bloqueantes: nenhum.

Recomendações:
1. `onda-3b.md:106`: escrever que o `falhou` de 25 h nasce da reconciliação real, com relógio falso, e não de linha inserida já com `processado_em`. Se for inserida assim, a mutação continua verde. O portão pega, mas custa uma volta. Também vale pedir `processado_em` preenchido nas linhas `:97` (descarte) e `:103` (prazo e falha final). Hoje uma mutação só no descarte passaria.
2. `onda-3a.md:98`: dizer de onde o roteiro k6 lê "os jobs ativos da réplica" e nomear o teste da tela para "Tentar de novo" sem gastar a troca.
3. `onda-4b.md:90`: o `Painel.test.tsx` tem outros casos de várias leituras que a rota única também derruba: `:605`, `:631`, `:723` e o caso "dos anos letivos do roteiro" de `:698`. Dizer se saem ou se adaptam, para não brigar com "saem só o `:387` e o `:409`".
4. `onda-4b.md:65`: o `:298` hoje clica em "Esperando você, parte não carregou", rótulo que deixa de existir. Vale citar o rótulo novo do botão.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3c.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-4b.md

## tenancy-guardian · 5ª rodada · APROVADO · 2026-10-21 16:16:11 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: APROVADO

Tabelas verificadas: `material` (com `processado_em` e `objeto_apagado_em` novas, as duas com `escola_id`) e `job_registro` (`escola_id` como origem do contexto e da vaga).

Queries verificadas: a leitura `@SemEscopo` da varredura, que devolve só `(escola_id, id)` e apaga em `executarNoContexto`; os três métodos de `operacao/jobs-que-falharam.repository.ts`; `lerParaExecutar`; e a chave `vaga:{fila}:{escola}`. No código, `packages/nucleo/src/fila/vagas-por-escola.ts:43` já monta a chave com a escola do `job_registro`.

Teste de isolamento: presente e efetivo.
- `onda-3b.md:106`: se `processado_em` for gravado só no sucesso, o `falhou` de 25 h com o `apagar` caído escapa da varredura e o teste quebra. O excluído de 25 h também tem caso.
- `onda-3b.md:107`: com um contexto só para as duas escolas, o teste quebra.
- `onda-3a.md:116`: a escola B segue com as 4 vagas dela, e com a chave sem a escola o teste quebra.

As quatro correções da Rodada 4 que eram minhas estão feitas: F1 em `onda-3b.md:55-65` e `:106`, a justificativa sem título nem pessoa em `:73-75`, os `@SemEscopo` contados contra a regra 10.9 em `:36-38`, e a vaga pela escola de `job_registro.escola_id` com o caso de duas escolas em `onda-3a.md:52` e `:116`.

Bloqueantes: nenhum.

Recomendações:
1. `onda-3b.md:36`: a contagem diz "`operacao/` já tem cinco e `ops/`, oito". No código são três e três: `painel.repository.ts` em `operacao/`; `escola.repository.ts` e `operacao-privacidade.repository.ts` em `ops/`. Corrigir os números.
2. O arquivo novo nasce com três `@SemEscopo`, justo o limite da regra 10.9. "Marcar" pode rodar com escopo: a leitura sem escopo devolve a `escola_id`, e a marcação roda em `executarNoContexto`. Assim ficam dois.
3. `onda-3b.md:74`: "segue `JUSTIFICATIVA_DA_VARREDURA`" aponta para um texto (`material.repository.ts:307`) que diz "O PDF não é guardado", o que deixa de ser verdade na 3B. A constante e a classe ao lado saem com o `varrerParados`. Escrever o texto novo da justificativa na própria onda.
4. `onda-3b.md:106`: a mutação de `processado_em` é provada só pelo caminho da reconciliação. Um caso de prazo ou de descarte com o `apagar` falhando cobre as outras transições.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/apps/api/src/material/material.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/packages/nucleo/src/fila/vagas-por-escola.ts

## llm-integrator · 5ª rodada · APROVADO · 2026-10-21 16:16:45 · `tasks/prd-reengenharia/revisao-spec.md`

**VEREDITO: APROVADO**

Conferi a Rodada 4 (F2 e as recomendações de llm) contra `onda-3c.md`, `techspec.md` §8 e o código da porta de IA. Todos os itens exigidos estão atendidos.

**Bloqueantes:** nenhum.

**O que confere**
- **Chave do disjuntor:** inclui o perfil. O Tutor e o `propor_ferramenta` são `rapido`, e as ferramentas e o Analista são `padrao`. O Tutor não cai com as ferramentas.
- **Chamada lenta:** 10 s é metade do prazo de 20 s do `rapido`, cerca de 1,7× o turno de 6 s de `docs/infra.md:89`. O `padrao` conta só timeout.
- **Testes:** 5 ferramentas de 50 s não abrem o disjuntor, e há mutações para "lenta em todo perfil" e "chave sem o perfil".
- **Invariante por perfil:** `config-ia.ts:102` e `:100` estão citados com as linhas certas, e a linha "Configuração" tem o caso.
- **Citação de `consumo.ts`:** o caminho existe e `RegistroDeConsumo` está lá.
- **Preço (§8):** 650 mil tokens por aluno por mês dão R$ 0,75 ÷ 0,65 = 1,15 por milhão (Sabiazinho) e R$ 2,40 ÷ 0,65 = 3,69 (Flash). 16 mil tokens saem a R$ 0,02–0,06. O R$ 0,12 de 2027 confere (7,4 por milhão).

**Recomendações**
1. **Pior caso do menor (3c):** a espera de 8 s é por reserva, e a reserva é por chamada. Com as 2 tentativas do `chamarAteValer` o pior caso é 2×(8+prazo), ou seja 56 s no `rapido` e 136 s no `padrao`. Ainda fica abaixo dos cortes de 60 s e 140 s, mas não é o "48/128" que o texto afirma. Corrija os números ou declare que a espera de 8 s é contada uma vez por execução. Falta também uma mutação "menor soma ao orçamento".
2. **Abertura do disjuntor (3c):** diga se as "5 falhas" são consecutivas ou numa janela. Confirme que o `propor_ferramenta` (800 tokens de saída) fica abaixo de 10 s.
3. **Invariante do recuo (3c):** `LLM_RECUO_MS < LLM_TIMEOUT_MS` também precisa valer por perfil (prazo de 20 s no `rapido`).
4. **Linha de consumo da execução morta (`onda-3a.md:87`):** "se não há linha" não tem suporte na porta. `RegistroDeConsumo` só tem `registrar`, e o índice `consumo_ia_execucao_idx` não é único. Defina como checar.
5. **Texto do §8:** "de R$ 0,02 a 0,06 a R$ 1,15–3,70" está truncado. Mostre a base de 650 mil tokens e explique por que o Sabiá (cerca de 5,7 por milhão) fica fora da faixa.

Perfis usados: `rapido` (Tutor, `propor_ferramenta`) e `padrao` (ferramentas, Analista). Custo estimado por professor/mês: R$ 0,02–0,06, até R$ 0,12 em 2027.

## infra-guardian · 5ª rodada · APROVADO · 2026-10-21 16:17:03 · `tasks/prd-reengenharia/revisao-spec.md`

VEREDITO: APROVADO
Caminho quente tocado: tutor | fila | IA | migration
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: ok
Migration: compatível
Métrica e alerta: ok

**Bloqueantes:** nenhum. As três correções da rodada 4 foram feitas.

- **F2 (`onda-3c.md:23-25`, `:90`):** o disjuntor agora é separado por provedor, modelo e perfil. A chamada lenta conta só no `rapido`, acima de 10 s, e o `padrao` conta só o timeout. Os casos "5 ferramentas de 50 s não abrem" e "`padrao` aberto, `rapido` segue" estão escritos, cada um com a sua mutação (a lenta em todo perfil; a chave sem o perfil). A latência falsa de 6 s e a de 50 s ficam abaixo do limite de cada perfil.
- **F3 (`onda-3a.md:97-98`):** os `EXECUCAO_INTERROMPIDA` saem de `respostas_inesperadas` e vão para um contador próprio, com teto. O k6 consegue separá-los, porque `execucoes.service.ts:21` devolve o código do erro. O código já entra em `PASSAGEIROS` (`apps/web/src/api/ciclo-de-execucao.ts:114`), então a tela mostra "Tentar de novo".
- **F1 (`onda-3b.md:55-57`, `:62-65`, `:106`):** `processado_em` é gravado em toda saída de `processando`. O caso "`falhou` há 25 h" e o caso "excluído há 25 h" estão na tabela, com a mutação.
- **Recomendações de infra:** entraram todas. `NOT VALID` + `VALIDATE` sob `lock_timeout` (`onda-3a.md:50-51`); a espera do pool e o falso stalled das duas filas (`:95-96`); a premissa de 1 ferramenta/min (`:64-65`); §5.3 e compose (`:68-69`); a meta das 300 apostilas (`onda-3b.md:81-84`); as colunas do índice e o `lock_timeout` (`:54-55`).

**Recomendações:**
1. `onda-3a.md:98`: falta dizer de onde vem o número de "jobs ativos da réplica". Hoje não há nada que o dê: `job_registro` não grava o worker e não existe gauge por instância. Contar todos os `ativo` deixa o teto duas vezes mais largo. É preciso nomear a fonte (o `getWorkers` do BullMQ ou um gauge `job.ativos{instancia}`) e dizer que a comparação acontece em `infra/scripts/carga.ts`, depois do summary. O threshold do k6 é fixo na inicialização e não recebe esse valor.
2. Depois do `kill -9`, as vagas dos jobs mortos só voltam quando vencem no `vaga.lua` (cerca de 15 s), contra um corte de 20 s. O threshold "nenhum `IA_INDISPONIVEL`" fica com só 5 s de folga. Vale declarar a validade da vaga da `interativa` ou abrir uma exceção nessa janela.
3. `onda-3b.md:55`: o índice parcial ainda não tem nome; dar um.
4. `onda-3b.md:82`: trocar "uma noite" por horas (por exemplo, 19h às 5h).

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3a.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3b.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tasks/prd-reengenharia/onda-3c.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/infra/k6/justica-entre-escolas.js

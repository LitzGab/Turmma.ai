# Tarefa 2.0 — O aluno navega por Início, Tarefas e Eu, e abre no Início

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 1.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O aluno passa a ter três lugares, cada um abrindo uma tela que já existe, e entra pelo Início.

## Contexto necessário

- `techspec.md` seção 9 ("Lugares", "Nomes que não mudam"); `prd.md` RF1 a RF3; `mockup.md` seção 1
- Regras 50 (itens 5 e 9) e 70 (item 4)
- Código: o cabeçalho de `apps/web/src/areas/navegacao.ts`; `areas/aluno/Tutor.tsx` e `MinhaTurma.tsx`; `encerrar`,
  em `CascaDaEscola.tsx`

## Subtarefas

- [x] 2.1 — `caminhos.ts`: `inicio` e `eu` em `ROTAS_DO_ALUNO`, `bemVindo` nas três áreas, e as chaves achatadas em `ROTAS`
  com o nome da área (`inicioDoAluno`, `euDoAluno`…: `ROTAS.inicio` já é `/`); e `ehTelaDeFoco(caminho)`: os endereços da
  spec nascem todos aqui
- [x] 2.2 — `NAVEGACAO.aluno`: Início (também em `/aluno/tutor`), Tarefas e Eu (também em `/aluno/privacidade`);
  o rodapé do aluno fica vazio
- [x] 2.3 — `Inicio.tsx`: a faixa de supervisão e a escolha da atividade, extraídas de `Tutor.tsx` sem mudar texto
  nem `data-*`. `Eu.tsx`: o cartão da turma (com "sem turma neste ano") e as linhas "Privacidade" e "Sair", pelo
  `aoSair` que a casca passa a expor por contexto. `MinhaTurma.tsx` sai, e o endereço redireciona com `replace`
- [x] 2.4 — "Atividades" vira "Tarefas" no título e na aba; o aluno abre em `/aluno/inicio`; `esperarAtividades`
  vira `esperarInicioDoAluno`; a API simulada do aluno responde a conversa sem atividade e `/v1/tutor/memoria`
- [x] 2.5 — `docs/interface.md` 11.1 e `docs/glossario.md` (Início, Tarefas, Eu)
- [x] 2.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/caminhos.ts`, `apps/web/src/caminhos.test.ts`, `apps/web/src/areas/navegacao.ts`, `apps/web/src/areas/navegacao.test.ts` | alterado |
| `apps/web/src/areas/aluno/Inicio.tsx`, `apps/web/src/areas/aluno/Eu.tsx`, `apps/web/src/areas/aluno/EscolhaDaAtividade.tsx`, `apps/web/src/areas/aluno/FaixaDeSupervisao.tsx` | novo |
| `apps/web/src/areas/aluno/rotas.tsx`, `apps/web/src/areas/aluno/Tutor.tsx`, `apps/web/src/areas/aluno/Atividades.tsx`, `apps/web/src/areas/aluno/MinhaTurma.tsx` | alterado |
| `apps/web/src/paginas/Inicio.tsx`, `apps/web/src/componentes/CascaDaEscola.tsx`, `docs/interface.md`, `docs/glossario.md` | alterado |
| `e2e/__fixtures__/casca.ts`, `e2e/__fixtures__/aluno.ts`, `e2e/areas.spec.ts`, `e2e/minha-turma.spec.ts`, `e2e/meus-dados.spec.ts`, `e2e/aluno-atividade.spec.ts`, `e2e/aluno-tutor.spec.ts`, `e2e/aluno-fluxo.spec.ts` | alterado |
| `e2e/escola-e-vinculos.spec.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts`, `e2e/acesso-suspenso.spec.ts`, `e2e/entrar-na-escola.spec.ts`, `e2e/inatividade.spec.ts`, `e2e/troca-de-escola.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| lugares | unidade | três itens, rodapé vazio; Início selecionado na conversa do Tutor, Eu em Privacidade |
| lugares na tela | e2e | cada item leva à tela dele, com título da aba e `aria-current`; no celular, na barra de baixo |
| endereços | e2e | a entrada cai em `/aluno/inicio`; os de hoje abrem; `/aluno/minha-turma` vira `/aluno/eu` |
| borda: aluno sem turma no ano | e2e | Eu mostra o texto de hoje, e não erro de rede |
| supervisão | e2e | a faixa está no Início e na conversa, sem botão de fechar |
| Privacidade e Sair | e2e | "Meus dados" por Eu, a 360 px; "Sair" a um clique em cada lugar |
| estados da tela | componente | Início e Eu: carregando, erro, vazio só com a leitura terminada, com dado |
| recomeço da tela | e2e | o aluno seguinte no mesmo Chromebook vê o Início e o Eu dele; a resposta atrasada do anterior não aparece. Nos casos `e2e/minha-turma.spec.ts › recomeço de "Eu" e do Início › segunda pessoa: o aluno seguinte no mesmo Chromebook vê a turma dele, e nunca a do anterior` (Eu) e `… › segunda pessoa no Início: o aluno seguinte vê "Carregando as suas atividades…" e depois a atividade dele, nunca a do anterior` (Início: leitura segurada, `body` sem o título do primeiro) |
| clique duplo em "Sair" | componente | dois cliques seguidos na saída que a casca oferece à tela, com o encerramento ainda no ar, mandam um só `DELETE /v1/sessao` (`CascaDaEscola.test.tsx › dois cliques seguidos na saída da tela…`) |

## Como testar

- `e2e/areas.spec.ts › o aluno vê "Tutor", "Atividades" e "Minha turma"…`: troca `ITENS_DO_ALUNO` e o rodapé
- `e2e/minha-turma.spec.ts`, os quatro casos, em `/aluno/eu`; `e2e/meus-dados.spec.ts › o aluno acha Privacidade no
  rodapé…` passa a ir por Eu
- Componente: `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`)
- Rodar: `node tools/ci/e2e.ts --manter-ambiente e2e/areas.spec.ts`
- Armadilha: em Eu há dois "Sair" (a linha e a casca); localize pelo contêiner
- Telas: `aluno`, `/aluno/inicio`, `/aluno/eu`, `/aluno/atividades`; mockup `/aluno` e `/aluno/eu`

## Fora do escopo desta tarefa

Início e Eu recompostos (3.0, 7.0), os grupos de Tarefas (4.0) e as rotas `bem-vindo` (9.0 a 11.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

nenhuma

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

Os blocos de baixo rodam teste de unidade: o e2e desta tarefa (`areas`, `minha-turma`, `meus-dados`, `aluno-*`) prova o fluxo no
navegador, mas as cláusulas são todas alcançadas por um caso de componente ou de função pura, que fica vermelho em segundos.

```mutacao
arquivo: apps/web/src/caminhos.ts
teste: apps/web/src/caminhos.test.ts › é verdadeira nas três introduções
  export function ehTelaDeFoco(caminho: string): boolean {
- return TELAS_DE_FOCO.includes(caminho)
+ return TELAS_DE_FOCO.some((foco) => caminho.startsWith(foco))
```

```mutacao
arquivo: apps/web/src/caminhos.ts
teste: apps/web/src/caminhos.test.ts › é verdadeira nas três introduções
- const TELAS_DE_FOCO: readonly string[] = [ROTAS.bemVindoDoAluno, ROTAS.bemVindoDoProfessor, ROTAS.bemVindoDaCoordenacao]
+ const TELAS_DE_FOCO: readonly string[] = [ROTAS.bemVindoDoAluno, ROTAS.bemVindoDoProfessor]
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/areas/navegacao.test.ts › cada endereço do aluno acende
- { rotulo: 'Início', caminho: ROTAS.inicioDoAluno, icone: { lugar: 'inicio' }, tambemEm: [ROTAS.tutor] },
+ { rotulo: 'Início', caminho: ROTAS.inicioDoAluno, icone: { lugar: 'inicio' } },
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/areas/navegacao.test.ts › cada endereço do aluno acende
- { rotulo: 'Eu', caminho: ROTAS.euDoAluno, icone: { lucide: UserRound, familia: 'turquesa' }, tambemEm: [ROTAS.privacidadeDoAluno] },
+ { rotulo: 'Eu', caminho: ROTAS.euDoAluno, icone: { lucide: UserRound, familia: 'turquesa' } },
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/areas/navegacao.test.ts › o aluno não tem rodapé fixo
  professor: [],
- aluno: [],
+ aluno: [{ rotulo: 'Privacidade', caminho: ROTAS.privacidadeDoAluno, icone: { lucide: UserRound, familia: 'verde' } }],
```

```mutacao
arquivo: apps/web/src/areas/aluno/rotas.tsx
teste: apps/web/src/areas/aluno/rotas.test.tsx › abre Eu e some do histórico
- <Redirect to={ROTAS_DO_ALUNO.eu} replace />
+ <Redirect to={ROTAS_DO_ALUNO.eu} />
```

```mutacao
arquivo: apps/web/src/areas/aluno/rotas.tsx
teste: apps/web/src/areas/aluno/rotas.test.tsx › abre Eu e some do histórico
- <Redirect to={ROTAS_DO_ALUNO.eu} replace />
+ <Redirect to={ROTAS_DO_ALUNO.atividades} replace />
```

```mutacao
arquivo: apps/web/src/areas/aluno/rotas.tsx
teste: apps/web/src/areas/aluno/rotas.test.tsx › abre o Início
- <Route path={ROTAS_DO_ALUNO.inicio} component={Inicio} />
+ <Route path={ROTAS_DO_ALUNO.inicio} component={Atividades} />
```

```mutacao
arquivo: apps/web/src/paginas/Inicio.tsx
teste: apps/web/src/paginas/Inicio.test.tsx › o aluno abre em
- if (papel === 'aluno') return <Redirect to={ROTAS.inicioDoAluno} replace />
+ if (papel === 'aluno') return <Redirect to={ROTAS.atividades} replace />
```

```mutacao
arquivo: apps/web/src/paginas/Inicio.tsx
teste: apps/web/src/paginas/Inicio.test.tsx › o aluno abre em
- if (papel === 'aluno') return <Redirect to={ROTAS.inicioDoAluno} replace />
+ if (papel === 'aluno') return <Redirect to={ROTAS.inicioDoAluno} />
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › a tela que consome o contexto
- const saida: SaidaDaCasca = { sair: aoSair, saindo }
+ const saida: SaidaDaCasca = { sair: () => undefined, saindo }
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › dois cliques seguidos na saída
  async function encerrar(): Promise<void> {
- if (saindo) return
  definirSaindo(true)
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › carregando: o título
- if (minhaTurma.isPending) return <EstadoCarregando rotulo="Carregando a sua turma…" />
+ if (false) return <EstadoCarregando rotulo="Carregando a sua turma…" />
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › com erro de rede
- if (minhaTurma.isError) {
+ if (false) {
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › com erro de rede
- if (minhaTurma.error instanceof ErroDaApi && minhaTurma.error.codigo === CodigoDeErro.NAO_ENCONTRADO)
+ if (minhaTurma.error instanceof ErroDaApi)
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › o aluno sem turma no ano
- if (minhaTurma.error instanceof ErroDaApi && minhaTurma.error.codigo === CodigoDeErro.NAO_ENCONTRADO)
+ if (minhaTurma.error instanceof ErroDaApi && minhaTurma.error.codigo !== CodigoDeErro.NAO_ENCONTRADO)
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › saindo: a linha
- titulo={saindo ? 'Saindo…' : 'Sair'}
+ titulo="Sair"
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › é a saída da casca
- aoAcionar={sair}
+ aoAcionar={() => undefined}
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › com dado: a turma
- para={ROTAS_DO_ALUNO.privacidade}
+ para={ROTAS_DO_ALUNO.eu}
```

```mutacao
arquivo: apps/web/src/areas/aluno/EscolhaDaAtividade.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › com dado: cada atividade
- const avisar = atividade.avaliativa && estaParaResponder(atividade)
+ const avisar = atividade.avaliativa
```

```mutacao
arquivo: apps/web/src/areas/aluno/EscolhaDaAtividade.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › com dado: cada atividade
- const avisar = atividade.avaliativa && estaParaResponder(atividade)
+ const avisar = estaParaResponder(atividade)
```

```mutacao
arquivo: apps/web/src/areas/aluno/EscolhaDaAtividade.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › com dado: cada atividade
- {avisar && <span className="min-w-0 text-sm break-words text-apoio">{AVISO_DA_AVALIACAO}</span>}
+ {<span className="min-w-0 text-sm break-words text-apoio">{AVISO_DA_AVALIACAO}</span>}
```

```mutacao
arquivo: apps/web/src/areas/aluno/EscolhaDaAtividade.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › pede a página seguinte
- {carregando ? 'Carregando…' : 'Ver mais atividades'}
+ {'Ver mais atividades'}
```

```mutacao
arquivo: apps/web/src/areas/aluno/EscolhaDaAtividade.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › pede a página seguinte
- <Botao variante="secundario" onClick={aoPedir} disabled={carregando} className="self-center">
+ <Botao variante="secundario" onClick={aoPedir} className="self-center">
```

```mutacao
arquivo: apps/web/src/areas/aluno/EscolhaDaAtividade.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › carregando: a faixa
- const itens = atividades.data?.pages.flatMap((pagina) => pagina.itens) ?? []
+ const itens = atividades.data?.pages.flatMap((pagina) => pagina.itens)
```

```mutacao
arquivo: apps/web/src/areas/aluno/EscolhaDaAtividade.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › carregando: a faixa
- {atividades.isPending && <EstadoCarregando rotulo="Carregando as suas atividades…" />}
+ {false && <EstadoCarregando rotulo="Carregando as suas atividades…" />}
```

```mutacao
arquivo: apps/web/src/areas/aluno/EscolhaDaAtividade.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › com erro: o alerta
- {atividades.isError && atividades.data === undefined && (
+ {false && (
```

```mutacao
arquivo: apps/web/src/areas/aluno/EscolhaDaAtividade.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › carregando: a faixa
- {atividades.data !== undefined && itens.length === 0 && (
+ {itens.length === 0 && (
```

```mutacao
arquivo: apps/web/src/areas/aluno/EscolhaDaAtividade.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › vazio, com a leitura terminada
- {itens.length > 0 && (
+ {true && (
```

```mutacao
arquivo: apps/web/src/areas/aluno/EscolhaDaAtividade.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › com dado: cada atividade
- {atividades.hasNextPage && <VerMais carregando={atividades.isFetchingNextPage} aoPedir={() => void atividades.fetchNextPage()} />}
+ {<VerMais carregando={atividades.isFetchingNextPage} aoPedir={() => void atividades.fetchNextPage()} />}
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | `CascaDaEscola.tsx:300` e `:361`: `<ContextoDaSaida>` sem recuo em volta do `<div>`; "Rodar o formatador" | Recusada: o repositório não usa o prettier (não está no portão nem no `package.json`; o `CascaDaEscola.tsx` do `HEAD` também falha em `prettier --check`). Reindentar as ~60 linhas do bloco não muda comportamento e caducaria os seis revisores que aprovaram |
| frontend-reviewer (1ª) | Eu e Início deixam metade da tela vazia a 1366 px | Tarefas 3.0 e 7.0, que recompõem as duas telas |
| frontend-reviewer (1ª) | Papel "aluno" em minúsculo e nome sintético com id no rodapé da lateral | Fora desta tarefa (é da casca, e o id vem do dado sintético da vitrine); o Validador vê na foto de cada requisito |
| conformidade-reviewer (1ª) | O Início diz "Em qual atividade você quer ajuda?" mesmo com o Tutor desligado ou suspenso | Tarefa 3.0, que recompõe o Início |
| infra-guardian (1ª) | Quando Início ou Eu chamarem `memoria` e `conversa`, medir as requisições da entrada do aluno e atualizar o cenário `login às 7h30` | Tarefa 3.0, subtarefa 3.1; a tarefa que ligar `memoria`/`conversa` ao Início ou a Eu atualiza o cenário |
| infra-guardian (1ª) | Teste de API: encerrar a sessão duas vezes é idempotente | `TODO.md` (linha acrescentada): é teste de `apps/api`, fora dos arquivos desta tarefa, e hoje não é bug |
| privacy-guardian (1ª) | Anotar em `docs/lgpd.md` por onde o aluno chega a "Meus dados" (agora Eu → Privacidade) | Tarefa 9.0, subtarefa 9.4, que já altera `docs/lgpd.md` seção 9 |
| privacy-guardian (1ª) | Manter `troca-de-escola.spec.ts` lendo o texto uma vez só, depois de o Início aparecer | Nada a fazer: é confirmação |
| revisor-geral (1ª) | Seta na linha "Sair" de Eu, igual à das linhas que levam a outra tela | Tarefa 7.0, que recompõe Eu |
| revisor-geral (1ª) | O caso da avaliação aberta em `aluno-fluxo.spec.ts` agora confere o aviso no Início: confirmar que o aviso em Tarefas continua provado | Vai ao `test-engineer` na rodada 2 (a pergunta é para ele) |
| revisor-geral (2ª) | `e2e/minha-turma.spec.ts`: o padrão `**/v1/minhas-atividades` não pega `?pagina=`; `**/v1/minhas-atividades*` deixaria o caso firme se um dia houver segunda página | Recusada por ora: o fixture devolve uma página só e a primeira página vai sem `?pagina=`, então o caso é firme hoje; quem der segunda página ao fixture de atividades ajusta o padrão no mesmo passo |
| test-engineer (2ª) | O caso novo do Início prova o cache que sobreviveria à troca de sessão, não uma resposta do primeiro aluno ainda no ar que chegasse depois do login do segundo | Recusada: o revisor diz que seria cobertura a mais; a casca é a mesma do caso de Eu, como a correção pedia |
| test-engineer (2ª) | O caso novo faz dois logins sem `test.slow()`; se ficar perto de 15 s na esteira, declarar `test.slow()` | Recusada por ora: o portão da tarefa mede esse caso contra metade do prazo e ficou verde; se a esteira apontar, vira correção |

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 03:43:51 | 2026-10-25 03:44:42 | `frontend-reviewer` | 1 | APROVADO | ad578122f2185ffec |
| 2026-10-25 03:44:19 | 2026-10-25 03:44:48 | `tenancy-guardian` | 1 | APROVADO | a5eb1105134e8f81b |
| 2026-10-25 03:43:58 | 2026-10-25 03:44:50 | `conformidade-reviewer` | 1 | APROVADO | a2bf05a7028e67eea |
| 2026-10-25 03:44:33 | 2026-10-25 03:44:58 | `infra-guardian` | 1 | APROVADO | afb90a251525aa101 |
| 2026-10-25 03:44:26 | 2026-10-25 03:45:45 | `privacy-guardian` | 1 | APROVADO | aa8946251820df765 |
| 2026-10-25 03:44:12 | 2026-10-25 03:46:03 | `revisor-geral` | 1 | APROVADO | ab5032ce3570402b4 |
| 2026-10-25 03:44:05 | 2026-10-25 03:46:33 | `test-engineer` | 1 | REPROVADO | ada713d683b9a80e6 |
| 2026-10-25 04:11:16 | 2026-10-25 04:11:54 | `revisor-geral` | 2 | APROVADO | ab1273227b7a1fdf2 |
| 2026-10-25 04:11:05 | 2026-10-25 04:12:23 | `test-engineer` | 2 | APROVADO | aa112071bc9dc18bc |

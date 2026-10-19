# Tarefa 12.0 — Turma › Alunos

**Funcionalidade:** telas-do-professor · **Depende de:** 10.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `tenancy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba Alunos mostra a lista de nomes da turma em ordem de nome, com os acertos de correção aprovada de cada um, e os pedidos
de nome no alto, com as regras de hoje. A web passa a ler `GET /v1/turmas/:id/alunos`, que o professor da turma já alcança.

## Contexto necessário

- `techspec.md` seções 4, 6, 7 e 12 (a rota nunca foi lida pela web como professor; a API devolve em ordem de id);
  `prd.md` RF18, RF21 e a seção 8; `mockup.md` 5.3
- Regras 10 e 20 (itens 5, 6 e 10); D34, D35 e D46. Sem situação do aluno, sem média, sem ordem por acerto (o Ranking saiu
  de vez), sem selo "Adaptação" por aluno, sem busca nominal e sem "Abrir a conversa"
- Código: `AlunosDaTurma.tsx` (da 10.0: "Por aluno", acesso e pedidos); `ListaDePedidos.tsx`;
  `api/pedidos.ts` (modelo de `gcTime: 0`); `esquemaRespostaAlunosDaTurma`, em `packages/shared`

## Subtarefas

- [x] 12.1 — `api/alunos-da-turma.ts`: `consultaAlunosDaTurma(turmaId)`, página por página, com `gcTime: 0`, chave
  começando por `alunos-da-turma`. `AlunosDaTurma.tsx`: a lista em ordem de nome (`localeCompare` em `pt-BR`, empate
  pelo id), com os acertos de cada aluno vindos do desempenho aprovado; o aluno sem correção aprovada diz "Sem
  correção aprovada". Confira a rota em `apps/api/test/turma-acesso.int.test.ts` (paginação, auditoria `turma.alunos_lidos`,
  se a leitura do professor leva finalidade) antes de chamar. A web não envia `?anoLetivoId`; lê com `limite=100`
  e reordena por nome tudo o que já foi carregado, também depois de "Ver mais" (teste de componente: sem `?anoLetivoId`, com `limite=100`). Aluno transferido ou com acesso desativado tem estado próprio
- [x] 12.2 — Os pedidos de nome no alto da aba, com a `ListaDePedidos` e as regras de hoje (40 por vez, sem "aprovar todos",
  a confirmação que diz o efeito). O acesso da turma segue como está até a 13.0
- [x] 12.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/api/alunos-da-turma.ts`, `apps/web/src/api/alunos-da-turma.test.ts` | novo |
| `apps/web/src/areas/professor/AlunosDaTurma.tsx` | alterado (a 10.0 o criou) |
| `apps/web/src/areas/professor/AlunosDaTurma.test.tsx`, `alunos-da-turma.ts`, `alunos-da-turma.test.ts` | novo (mesma pasta; a ordem e a junção dos acertos) |
| `e2e/professor-turma-alunos.spec.ts` | novo |
| `e2e/pedidos.spec.ts` (`W4 e W15, pelo professor`, `W6: a decisão do professor`) | alterado (o caminho até a aba) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| a ordem de nome | unidade | a lista chega em ordem de id e sai em ordem de nome; dois alunos de mesmo nome ficam em duas linhas, em ordem estável |
| aluno sem correção aprovada | unidade e componente | aparece com "Sem correção aprovada", e não some nem vira "0 de 0"; correção pendente ou rejeitada não entra na conta |
| aluno transferido ou desativado | componente | aparece com o estado próprio, sem número de acerto inventado |
| vocabulário | unidade | "Média de acertos" vira "acerto médio"; nenhuma palavra de nota ou ranking |
| nenhuma ordem por acerto | componente | nenhum controle ordena por acerto; a ordem não muda com os números (D69) |
| estados | componente | carregando; erro com "Tentar de novo"; vazio ("A lista ainda não chegou", com o caminho para a coordenação); mais de uma página, com "Ver mais"; com dado |
| a lista não fica no cache | componente | ao sair da aba e voltar, a lista é lida de novo (`gcTime: 0`); nada do nome em `localStorage`, `sessionStorage` ou endereço |
| isolamento | e2e | a turma de outra escola, a de outro professor e a de vínculo pendente respondem "Turma indisponível" e não leem a lista (regra 10, itens 4 e 6); trocar de escola esvazia |
| os pedidos de nome | e2e | os casos de hoje, pela aba: o 41º não é marcável, não há "aprovar todos", a confirmação diz a turma e os nomes, dois cliques decidem uma vez |
| recomeço | e2e | a segunda pessoa na mesma aba não vê a lista nem os pedidos; resposta atrasada da lista não troca a da outra turma. Log: nenhum nome em log da web; a auditoria da leitura é a da API |
| 360 px | e2e | a lista vira linhas de 56 px sem rolar de lado; nome comprido quebra |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`, `segurar`)
- e2e: `W4 (Pedidos) e W15, pelo professor` e `W6: a decisão do professor` em `pedidos.spec.ts`: o caminho passa a ser
  a aba Alunos; títulos e asserções ficam
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/AlunosDaTurma.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-turma-alunos.spec.ts e2e/pedidos.spec.ts`
- Telas: `professora`, `/professor/turmas/:id?aba=alunos`, `--clicar 'role=tab[name="Alunos"]'`. Mockup:
  `/professor/turmas/2b?aba=alunos`

## Fora do escopo desta tarefa

A situação ("Atenção: entregas"), a média, o boletim, a ficha do aluno, "Exportar notas", a busca por nome, o selo
"Adaptação" e "Abrir a conversa" (F6, F17, D35, D64, D70); o diálogo de convite (13.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A aba lê também `GET /v1/turmas/:id/desempenho`, e quem consta no desempenho e não na lista (lida até o fim) aparece como "Saiu da turma", sem número | A API da lista só devolve quem está na turma agora; o "transferido ou desativado" da tarefa só existe como diferença entre as duas leituras. Com páginas por ler a diferença não vale: o aluno pode estar na próxima | `techspec.md` §9, "Alunos na pele nova", itens 1 e 2 |
| A tabela é a peça `Tabela` da X1 (linha no celular, tabela no computador), e não "linhas de 56 px" feitas à mão | A peça já vira lista no celular com alvo de 56 px e rola dentro do contêiner; refazer à mão duplicaria a regra | `techspec.md` §9, item 3 |
| Aprovar ou recusar um pedido marca como velha a lista de nomes da turma (`api/pedidos.ts`) | Com a aba aberta, o aluno aprovado precisa entrar na lista sem recarregar; só a da turma, pela chave | `techspec.md` §9, item 5 |
| Arquivos fora dos previstos: `Turma.test.tsx` (a rede falsa responde a lista vazia), `api/pedidos.ts` e `api/pedidos.test.ts`, `e2e/__fixtures__/sessao.ts` (matricular alunos de teste), `e2e/professor-turma-aberta.spec.ts` (o caso de Alunos com lote aprovado saiu: passou para o primeiro caso de `professor-turma-alunos.spec.ts`, e com a lista de verdade ele passava de 15 s só com a entrada) e `e2e/professor-sino.spec.ts` (o recomeço passa pela aba Alunos) | A aba nova lê uma rota que antes ninguém lia; cada teste que a abre precisa de turma com alunos reais ou de lista vazia. `e2e/pedidos.spec.ts` não precisou mudar: já chega aos pedidos pela aba Alunos | `techspec.md` §9, itens 4 e 6 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

A leitura não pede cem de cada vez.

```mutacao
arquivo: apps/web/src/api/alunos-da-turma.ts
teste: apps/web/src/api/alunos-da-turma.test.ts › lê a turma do professor de cem em cem
-const consulta = new URLSearchParams({ limite: String(ALUNOS_POR_LEITURA) })
+const consulta = new URLSearchParams()
```

A página seguinte não leva a `pagina` da anterior.

```mutacao
arquivo: apps/web/src/api/alunos-da-turma.ts
teste: apps/web/src/api/alunos-da-turma.test.ts › lê a turma do professor de cem em cem
-if (pageParam !== undefined) consulta.set('pagina', pageParam)
```

Não há página seguinte quando a API manda `proxima`.

```mutacao
arquivo: apps/web/src/api/alunos-da-turma.ts
teste: apps/web/src/api/alunos-da-turma.test.ts › lê a turma do professor de cem em cem
-getNextPageParam: (ultima) => ultima.proxima,
+getNextPageParam: () => undefined,
```

A lista fica no cache da aba depois de a tela sair.

```mutacao
arquivo: apps/web/src/api/alunos-da-turma.ts
teste: apps/web/src/api/alunos-da-turma.test.ts › fora da tela a lista não fica guardada
 getNextPageParam: (ultima) => ultima.proxima,
-gcTime: 0,
```

O id da turma vai no caminho sem codificar.

```mutacao
arquivo: apps/web/src/api/alunos-da-turma.ts
teste: apps/web/src/api/alunos-da-turma.test.ts › o id da turma vai no caminho já codificado
-return buscarComSessao(`/v1/turmas/${encodeURIComponent(turmaId)}/alunos?${consulta.toString()}`, esquemaRespostaAlunosDaTurma, signal)
+return buscarComSessao(`/v1/turmas/${turmaId}/alunos?${consulta.toString()}`, esquemaRespostaAlunosDaTurma, signal)
```

A ordem de nome não usa o português do Brasil (Álvaro vai para depois do Z).

```mutacao
arquivo: apps/web/src/areas/professor/alunos-da-turma.ts
teste: apps/web/src/areas/professor/alunos-da-turma.test.ts › a lista chega em ordem de id e sai em ordem de nome
-const porNome = a.nome.localeCompare(b.nome, 'pt-BR')
+const porNome = a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0
```

Nome igual não desempata pelo id, e a ordem depende de quem a API entregou primeiro.

```mutacao
arquivo: apps/web/src/areas/professor/alunos-da-turma.ts
teste: apps/web/src/areas/professor/alunos-da-turma.test.ts › dois alunos de mesmo nome ficam em duas linhas
-if (a.usuarioId === b.usuarioId) return 0
-return a.usuarioId < b.usuarioId ? -1 : 1
+return 0
```

O mesmo aluno comparado com ele mesmo não dá zero.

```mutacao
arquivo: apps/web/src/areas/professor/alunos-da-turma.ts
teste: apps/web/src/areas/professor/alunos-da-turma.test.ts › dois alunos de mesmo nome ficam em duas linhas
-if (a.usuarioId === b.usuarioId) return 0
```

Os acertos entram pelo nome do aluno, e não pelo id.

```mutacao
arquivo: apps/web/src/areas/professor/alunos-da-turma.ts
teste: apps/web/src/areas/professor/alunos-da-turma.test.ts › os acertos de cada aluno vêm pelo id dele
-const daTurma = lidos.map((aluno): LinhaDeAluno => ({ usuarioId: aluno.usuarioId, nome: aluno.nome, situacao: 'na_turma', desempenho: acertosDe.get(aluno.usuarioId) }))
+const daTurma = lidos.map((aluno): LinhaDeAluno => ({ usuarioId: aluno.usuarioId, nome: aluno.nome, situacao: 'na_turma', desempenho: acertosDe.get(aluno.nome) }))
```

Quem o desempenho traz e a lista não, sai como "fora da turma" mesmo com páginas por ler.

```mutacao
arquivo: apps/web/src/areas/professor/alunos-da-turma.ts
teste: apps/web/src/areas/professor/alunos-da-turma.test.ts › com páginas por ler, o aluno que ainda não chegou
-const quemSaiu = listaCompleta
+const quemSaiu = true
```

Todo aluno do desempenho vira "fora da turma", também o que está na lista.

```mutacao
arquivo: apps/web/src/areas/professor/alunos-da-turma.ts
teste: apps/web/src/areas/professor/alunos-da-turma.test.ts › o aluno que o desempenho traz e a lista lida até o fim não
-? doDesempenho.filter((aluno) => !naLista.has(aluno.alunoId)).map((aluno): LinhaDeAluno => ({ usuarioId: aluno.alunoId, nome: aluno.nome, situacao: 'fora_da_turma', desempenho: undefined }))
+? doDesempenho.map((aluno): LinhaDeAluno => ({ usuarioId: aluno.alunoId, nome: aluno.nome, situacao: 'fora_da_turma', desempenho: undefined }))
```

Quem saiu da turma ganha número de acerto.

```mutacao
arquivo: apps/web/src/areas/professor/alunos-da-turma.ts
teste: apps/web/src/areas/professor/alunos-da-turma.test.ts › o aluno que o desempenho traz e a lista lida até o fim não
-if (linha.situacao === 'fora_da_turma') return TEXTO_DE_QUEM_SAIU
```

Enquanto os acertos carregam, a célula afirma "Sem correção aprovada".

```mutacao
arquivo: apps/web/src/areas/professor/alunos-da-turma.ts
teste: apps/web/src/areas/professor/alunos-da-turma.test.ts › enquanto os acertos não chegam
-if (leitura === 'lendo') return TEXTO_DOS_ACERTOS_QUE_CARREGAM
```

Se os acertos falharam, a célula afirma "Sem correção aprovada".

```mutacao
arquivo: apps/web/src/areas/professor/alunos-da-turma.ts
teste: apps/web/src/areas/professor/alunos-da-turma.test.ts › enquanto os acertos não chegam
-if (leitura === 'falhou') return TEXTO_DOS_ACERTOS_QUE_FALHARAM
```

O aluno com total zero vira "0 de 0".

```mutacao
arquivo: apps/web/src/areas/professor/alunos-da-turma.ts
teste: apps/web/src/areas/professor/alunos-da-turma.test.ts › o aluno sem correção aprovada aparece com
-if (desempenho === undefined || desempenho.total === 0) return TEXTO_SEM_CORRECAO_APROVADA
+if (desempenho === undefined) return TEXTO_SEM_CORRECAO_APROVADA
```

O aluno que nem consta no desempenho quebra a tela.

```mutacao
arquivo: apps/web/src/areas/professor/alunos-da-turma.ts
teste: apps/web/src/areas/professor/alunos-da-turma.test.ts › o aluno sem correção aprovada aparece com
-if (desempenho === undefined || desempenho.total === 0) return TEXTO_SEM_CORRECAO_APROVADA
+if (desempenho.total === 0) return TEXTO_SEM_CORRECAO_APROVADA
```

O aluno sem habilidade fica com a célula vazia.

```mutacao
arquivo: apps/web/src/areas/professor/alunos-da-turma.ts
teste: apps/web/src/areas/professor/alunos-da-turma.test.ts › o acerto por habilidade diz o código
-if (itens.length === 0) return TEXTO_SEM_HABILIDADE
```

A lista é dada como lida até o fim com páginas por ler.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › com páginas por ler, o aluno que o desempenho traz e a lista ainda não trouxe
-const listaCompleta = listaLida && !alunos.hasNextPage
+const listaCompleta = listaLida
```

Os acertos que carregam são dados como lidos.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › carregando: a lista diz que carrega
-const leituraDosAcertos: LeituraDosAcertos = desempenho.data !== undefined ? 'lida' : desempenho.isError ? 'falhou' : 'lendo'
+const leituraDosAcertos: LeituraDosAcertos = desempenho.data !== undefined ? 'lida' : desempenho.isError ? 'falhou' : 'lida'
```

Os acertos que falharam são dados como carregando.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › erro dos acertos: os nomes continuam na tela
-const leituraDosAcertos: LeituraDosAcertos = desempenho.data !== undefined ? 'lida' : desempenho.isError ? 'falhou' : 'lendo'
+const leituraDosAcertos: LeituraDosAcertos = desempenho.data !== undefined ? 'lida' : desempenho.isError ? 'lendo' : 'lendo'
```

A lista que não acha a turma não avisa quem desenha a página.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › a turma que a API deixou de achar tira a página
-if (semATurma) aoPerderATurma()
```

Qualquer erro da lista tira a turma da página.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › outro erro da lista não tira a turma da página
-const semATurma = turmaIndisponivel(alunos.error)
+const semATurma = alunos.isError
```

O foco que a professora levou a outro lugar é tomado de volta.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › o foco que a professora levou a outro lugar
-if (document.activeElement !== null && document.activeElement !== document.body) return
```

Quando o botão sai da tela, o foco fica perdido no documento.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › o foco depois de
-;(botaoDeVerMais.current ?? fimDaLista.current)?.focus()
+botaoDeVerMais.current?.focus()
```

Dois cliques no mesmo instante em "Ver mais" pedem a página duas vezes.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › dois cliques no mesmo instante em
-if (lendoMais.current) return
```

O vazio aparece com a lista ainda carregando.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › a lista ainda carrega e os acertos já chegaram
-const vazio = listaCompleta && linhas.length === 0 && !desempenho.isPending
+const vazio = linhas.length === 0 && !desempenho.isPending
```

O vazio aparece com alunos na lista.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › com dado: os alunos em ordem de nome
-const vazio = listaCompleta && linhas.length === 0 && !desempenho.isPending
+const vazio = listaCompleta && !desempenho.isPending
```

O vazio aparece antes de os acertos chegarem.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › o vazio diz
-const vazio = listaCompleta && linhas.length === 0 && !desempenho.isPending
+const vazio = listaCompleta && linhas.length === 0
```

A tabela aparece também sem aluno nenhum.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › o vazio diz
-{listaLida && linhas.length > 0 && (
+{listaLida && (
```

A releitura dos acertos que falha tira os acertos da tela e põe o erro no lugar.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › a releitura dos acertos que falha
-{desempenho.isError && desempenho.data === undefined && (
+{desempenho.isError && (
```

O aviso de quem saiu da turma aparece sem ninguém que tenha saído.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › com dado: os alunos em ordem de nome
-{quemSaiu > 0 && <p className="t-apoio text-sutil">Quem saiu da turma (transferido, ou com o acesso desativado) aparece sem acertos.</p>}
+{true && <p className="t-apoio text-sutil">Quem saiu da turma (transferido, ou com o acesso desativado) aparece sem acertos.</p>}
```

A frase "até aqui" não aparece com páginas por ler.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › mais de uma página
-apoio={`${formatarQuantidade(linhas.length, 'aluno', 'alunos')}${listaCompleta ? '' : ' até aqui'}, em ordem de nome. Os acertos são os das correções aprovadas.`}
+apoio={`${formatarQuantidade(linhas.length, 'aluno', 'alunos')}, em ordem de nome. Os acertos são os das correções aprovadas.`}
```

O botão "Ver mais" não diz que carrega nem desliga.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › dois cliques no mesmo instante em
-<Botao ref={botaoDeVerMais} variante="secundario" onClick={() => void verMais()} disabled={alunos.isFetchingNextPage} className="self-start">
+<Botao ref={botaoDeVerMais} variante="secundario" onClick={() => void verMais()} disabled={false} className="self-start">
```

O erro da primeira leitura também aparece quando a falha é a da página seguinte.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › a falha de
-{alunos.isError && !listaLida && <EstadoErro erro={alunos.error} tentando={alunos.isFetching} aoTentarDeNovo={() => void alunos.refetch({ cancelRefetch: false })} />}
+{alunos.isError && <EstadoErro erro={alunos.error} tentando={alunos.isFetching} aoTentarDeNovo={() => void alunos.refetch({ cancelRefetch: false })} />}
```

A falha da página seguinte não oferece tentar de novo.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › a falha de
-{alunos.isFetchNextPageError && <EstadoErro erro={alunos.error} tentando={alunos.isFetchingNextPage} aoTentarDeNovo={() => void verMais()} />}
+{false && <EstadoErro erro={alunos.error} tentando={alunos.isFetchingNextPage} aoTentarDeNovo={() => void verMais()} />}
```

A lista que carrega não diz que carrega.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › carregando: a lista diz que carrega
-{alunos.isPending && <EstadoCarregando rotulo="Carregando os alunos da turma…" />}
+{false && <EstadoCarregando rotulo="Carregando os alunos da turma…" />}
```

Decidir um pedido, aprovando, não marca como velha a lista de nomes da turma.

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/api/pedidos.test.ts › aprovar um pedido marca como velha a lista de nomes da turma
 invalidarAContagem(cliente, turmaId, quem)
-invalidarOsAlunos(cliente, turmaId)
 }
```

A decisão que falha no meio do lote não marca a lista de nomes como velha.

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/api/pedidos.test.ts › a decisão que falha no meio do lote também marca a lista de nomes da turma como velha
 invalidarAContagem(cliente, turmaId, quem)
-invalidarOsAlunos(cliente, turmaId)
 if (quem === 'professor') await cliente.invalidateQueries({ queryKey })
```

A decisão marca como velhas as listas de nomes de todas as turmas, e não só a da turma decidida.

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/api/pedidos.test.ts › aprovar um pedido marca como velha a lista de nomes da turma
-void cliente.invalidateQueries({ queryKey: [...CHAVE_DOS_ALUNOS_DA_TURMA, turmaId] })
+void cliente.invalidateQueries({ queryKey: [...CHAVE_DOS_ALUNOS_DA_TURMA] })
```

A chave da lista não leva a turma: a lista de uma turma aparece na aba de outra, e a decisão de um pedido marca como velhas as listas de todas.

```mutacao
arquivo: apps/web/src/api/alunos-da-turma.ts
teste: apps/web/src/api/alunos-da-turma.test.ts › a chave começa por
-queryKey: [...CHAVE_DOS_ALUNOS_DA_TURMA, turmaId],
+queryKey: [...CHAVE_DOS_ALUNOS_DA_TURMA],
```

O botão "Ver mais" fica na tela com a lista lida até o fim, e a frase do fim nunca aparece.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › com dado: os alunos em ordem de nome
-{alunos.hasNextPage ? (
+{true ? (
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | `Tabela` não virtualiza e a aba acumula até 100 por página com "Ver mais": medir com CPU limitada quando houver turma de 100 ou mais | `TODO.md`: medição com turma grande no Chromebook fraco; a tarefa não muda a `Tabela` (X1) |
| frontend-reviewer (1ª) | Foto da vitrine com a lista vazia e com "Saiu da turma", para o `/validar` ver esses dois estados | `TODO.md` e `/validar`: é `tools/vitrine/escola.ts`, que a tarefa não toca; os dois estados têm caso de componente |
| privacy-guardian (1ª) | A linha "Saiu da turma" mostra o nome de quem já não está na turma; ver se a regra 20, item 18, pede só "Um aluno saiu da turma" | `/retro` e Arquiteto: muda comportamento e contrato da linha; o nome vem do próprio `/desempenho` autorizado e a linha só existe no intervalo entre as duas leituras. Tenancy-guardian (1ª) levantou o mesmo ponto |
| tenancy-guardian (1ª), test-engineer (1ª) | Caso de "trocar de escola esvazia" com a aba Alunos aberta, em `e2e/troca-de-escola.spec.ts` | `TODO.md`: o caminho é o mesmo `resetQueries` que o recomeço do sino já prova com a lista; é spec que a tarefa não toca e caso de e2e a mais bate no teto da esteira |
| revisor-geral (1ª) | A releitura que falha depois de decidir um pedido deixa a tabela velha na tela sem aviso (`AlunosDaTurma.tsx:101` e `:140`) | `TODO.md` e `/validar`: muda comportamento e texto de tela |
| revisor-geral (1ª) | `gcTime: 0` também em `estrutura/turma/<id>` e `acesso-da-turma/<id>`, ou a exceção escrita na §5 da Tech Spec | `TODO.md` e Arquiteto: a causa é anterior à tarefa e as duas consultas não são da 12.0; o teste já está restrito pelo item 4 |
| test-engineer (1ª) | A linha `if (porNome !== 0) return porNome` e a passagem do `signal` não têm bloco; o `signal` não tem teste que dependa dele | `TODO.md`: a primeira já cai nos testes de ordem; o `signal` pede teste novo de cancelamento, que a tarefa não escolheu |
| test-engineer (1ª) | Caso de aluno com vínculo encerrado ou `desativadoEm` no banco, para provar que ele some da aba sem número | `TODO.md`: e2e a mais; a API real tira o aluno das duas rotas (techspec §9) e o "Saiu da turma" tem caso de unidade e de componente |
| test-engineer (1ª) | Professor que dá duas disciplinas na mesma turma: uma lista só, sem aluno repetido | `TODO.md`: caso de e2e a mais; `criarAlocacaoDoProfessor(..., ['Química', 'Física'])` bastaria |
| frontend-reviewer (1ª) | No vazio, "peça a ela" poderia dizer o caminho dentro do produto | Recusada por ora: muda texto de tela e os testes que o citam, e o caminho ainda não existe; volta se a coordenação ganhar tela para isso |
| privacy-guardian (1ª) | Caso na web que force a chamada direta a `/alunos` com o id alheio | Recusada: a prova de que a rota responde igual está em `apps/api/test/turma-acesso.int.test.ts` (linhas 59, 175, 285); a web não tem caminho para chamá-la com id alheio sem a página cair antes |
| revisor-geral (1ª) | Comentário de `matricularAlunosNaTurmaNoBanco` (`e2e/__fixtures__/sessao.ts`) deveria dizer que é atalho sem a decisão humana | Recusada: o comentário já diz "Atalho só do e2e: sem a decisão humana nem a auditoria dela" |
| revisor-geral (2ª) | O nome do caso "resposta atrasada" (`e2e/professor-turma-alunos.spec.ts:176`) e o comentário (`:200-201`) dizem que o navegador aborta a leitura pelo `signal`, mas sem o `signal` o caso passaria do mesmo jeito (a consulta já saiu do cache, `gcTime: 0`): ou o texto descreve só o que o caso prova, ou entra o teste de cancelamento | `TODO.md`, junto da linha do `signal` sem teste (test-engineer 1ª e 2ª): o teste de cancelamento é caso novo que a tarefa não escolheu |
| revisor-geral (2ª) | A exceção das duas chaves da navegação (`estrutura/turma/<id>`, `acesso-da-turma/<id>`) está no teste do sino mas não na §5 da `techspec.md` | Arquiteto, antes do `/validar`: já está na tabela com o `gcTime: 0` dessas duas consultas |
| test-engineer (2ª) | A passagem do `signal` continua sem teste que dependa dela | Já está na tabela (test-engineer 1ª): `TODO.md`; fica o registro para o `/validar` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 09:56:26 | 2026-10-19 09:57:07 | `frontend-reviewer` | 1 | APROVADO | a5c8ce5c4e651e3cc |
| 2026-10-19 09:56:31 | 2026-10-19 09:57:33 | `privacy-guardian` | 1 | APROVADO | a1ba893060df90c6d |
| 2026-10-19 09:56:36 | 2026-10-19 09:57:34 | `tenancy-guardian` | 1 | APROVADO | afd191d8d28cf5b26 |
| 2026-10-19 09:56:21 | 2026-10-19 09:57:51 | `revisor-geral` | 1 | APROVADO | a41163ebf8d3aec0e |
| 2026-10-19 09:56:16 | 2026-10-19 09:59:43 | `test-engineer` | 1 | REPROVADO | a75dcc8538bd971e9 |
| 2026-10-19 10:23:00 | 2026-10-19 10:23:30 | `test-engineer` | 2 | APROVADO | aa17dd641188d6489 |
| 2026-10-19 10:23:06 | 2026-10-19 10:23:55 | `revisor-geral` | 2 | APROVADO | aab1939c5ebf81905 |

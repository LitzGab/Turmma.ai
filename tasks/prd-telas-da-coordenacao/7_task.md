# Tarefa 7.0 — A alocação no painel do professor

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 6.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A coordenação liga o professor à turma e à disciplina de dentro do painel dele, onde também vê as turmas que ele confirmou e as que contestou. A seção "Alocação" sai da aba Turmas.

## Contexto necessário

- `techspec.md` seções 9 ("Professores") e 13; `prd.md` RF14, RF22 e seção 6 ("Vínculo é da escola")
- `mockup.md` seção 3.6: o painel do professor e o diálogo "Acrescentar turma"
- `.claude/rules/60-dominio.md` item 8a: o vínculo é o que dá acesso a aluno
- Código: `apps/web/src/areas/coordenacao/Alocacao.tsx` (o envio único, os textos de falha e o que a lista mostra de cada vínculo); `o-que-falta-para-alocar.ts`; `apps/web/src/api/estrutura.ts` (`alocarProfessor`, `consultaVinculos`)

## Subtarefas

- [ ] 7.1 — No painel, a seção "Turmas": um item por vínculo do professor, com a turma, a disciplina e o estado em texto ("Esperando o professor confirmar", "Confirmou", "Contestou", "Encerrada"). No contestado, o motivo (`NOME_DA_CONTESTACAO`) e o complemento que ele escreveu
- [ ] 7.2 — "Acrescentar turma": um `Dialogo` com Turma e Disciplina, que chama `alocarProfessor` com o professor do painel. Só aparece para quem está em `ESTADOS_DO_PROFESSOR_ALOCAVEIS`; os outros veem por que não
- [ ] 7.3 — Sem turma ou sem disciplina na escola, o vazio de `tituloDoQueFalta` e `descricaoDoQueFalta`, no painel
- [ ] 7.4 — As falhas de hoje, no diálogo: o vínculo que já existe, e a turma, a disciplina ou o convite que saíram com o diálogo aberto
- [ ] 7.5 — `Alocacao.tsx` vira o diálogo; a seção sai de `Estrutura.tsx`; o passo "Alocação" de "O que falta" passa a levar a Professores
- [ ] 7.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/PainelDoProfessor.tsx`, `apps/web/src/areas/coordenacao/Alocacao.tsx`, `apps/web/src/areas/coordenacao/Estrutura.tsx` | alterado |
| `apps/web/src/areas/coordenacao/o-que-falta-da-escola.ts`, `apps/web/src/areas/coordenacao/o-que-falta-da-escola.test.ts` | alterado |
| `apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx` | novo |
| `e2e/alocacao.spec.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | carregando; erro com "Tentar de novo"; "Nenhuma turma"; com dado; o vazio do que falta só com as leituras terminadas; o foco depois de acrescentar |
| vínculo encerrado ao lado de aberto | componente | professor com um vínculo encerrado e outro aberto: os dois aparecem com o estado certo; "Acrescentar turma" aceita de novo a turma do encerrado |
| só o alocável | componente | convite vencido, revogado e conta desativada não têm "Acrescentar turma" |
| o vínculo nasce pendente | e2e | o caso W4 (Alocação) de hoje, pelo painel: depois de acrescentar, "Esperando o professor confirmar", e o professor ainda não alcança a turma |
| borda: duas disciplinas na mesma turma; professor que contestou | e2e | duas linhas; o motivo e o complemento aparecem, e corrigir é acrescentar a turma certa |
| o que sai com a tela aberta | e2e | o caso de hoje: o convite que vence e a turma e a disciplina excluídas por outra pessoa |
| clique duplo em "Acrescentar" | e2e | um pedido só e um vínculo só (a corrida entre duas pessoas é da API, que não muda) |
| recomeço: segunda pessoa; resposta atrasada; falha com o diálogo aberto | e2e | o aviso e o foco da tentativa anterior saem ao reabrir; nada do professor da escola anterior |

## Como testar

- `e2e/alocacao.spec.ts › vazio sem professor alocável e sem turma…` (veio de `estrutura.spec.ts` na 3.0): mudam o caminho até o formulário e o seletor "Professor", que deixa de existir
- `escola-montada` e o roteiro: o passo de alocar passa a ser Professores, a linha do professor e "Acrescentar turma"
- Clique duplo: `e2e/professores.spec.ts › dois cliques em cadastrar mostram um link só…`
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/alocacao.spec.ts`
- Telas: `coordenacao`, `/coordenacao/professores`, clique na primeira linha e em `text=Acrescentar turma`; mockup `/coordenacao/escola?aba=professores&prof=<id>`

## Fora do escopo desta tarefa

Encerrar vínculo pela tela (a API existe; `TODO.md`); "Corrigir turma" como ação própria; qualquer indicador sobre quem confirmou.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A seção "Turmas" do painel lê os vínculos do ano em curso pela chave da tela e só lê turmas e disciplinas da escola para quem recebe turma | O vazio de `tituloDoQueFalta` e o botão só valem com as duas listas lidas, e ler turma e disciplina para quem não recebe turma seria pedido à toa (o vencido, o revogado e o desativado só veem por quê) | `techspec.md` §9 "Professores" ("Como ficou na 7.0"); nenhum id novo em `cenarios.md` |
| O e2e "recomeço: segunda pessoa" não ganhou caso novo | O caso de `professores.spec.ts` (a coordenação de B na aba da de A) já prova que nada da escola anterior aparece, com o painel e os diálogos da tela; o diálogo "Acrescentar turma" nasce do mesmo estado da tela e sai com ela. A "resposta atrasada" e a "falha com o diálogo aberto" ganharam caso próprio em `e2e/alocacao.spec.ts` | `techspec.md` §9 "Professores" ("Como ficou na 7.0") |
| O e2e do contestado não confere o complemento escrito pelo professor | A fixture de banco (`contestarVinculosNoBanco`) grava só o motivo; o complemento fica provado no componente (`PainelDoProfessor.test.tsx`), onde a rede falsa o traz | `techspec.md` §9 "Professores" ("Como ficou na 7.0") |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › sem turma na escola: o vazio pede a turma, e não o professor nem a disciplina; sem o botão
- const podeAcrescentar = faltam !== undefined && faltam.length === 0
+ const podeAcrescentar = alocavel
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › com a leitura das turmas ainda no ar, nada de vazio nem de botão: o que não foi lido não vira "falta"
- const podeAcrescentar = faltam !== undefined && faltam.length === 0
+ const podeAcrescentar = faltam === undefined || faltam.length === 0
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › sem turma na escola: o vazio pede a turma, e não o professor nem a disciplina; sem o botão
- {faltam !== undefined && faltam.length > 0 && <EstadoVazio titulo={tituloDoQueFalta(faltam)} descricao={descricaoDoQueFalta(faltam)} />}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o convite vencido, o revogado e a conta desativada não têm o botão, veem por quê, e as turmas e as disciplinas da escola nem são lidas
- const turmas = useQuery({ ...consultaTurmas, enabled: anoEmCurso && alocavel })
+ const turmas = useQuery({ ...consultaTurmas, enabled: anoEmCurso })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o convite vencido, o revogado e a conta desativada não têm o botão, veem por quê, e as turmas e as disciplinas da escola nem são lidas
- const disciplinas = useQuery({ ...consultaDisciplinas, enabled: anoEmCurso && alocavel })
+ const disciplinas = useQuery({ ...consultaDisciplinas, enabled: anoEmCurso })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › sem ano em curso: a seção diz que as turmas são do ano em curso, e vínculos, turmas e disciplinas nem são pedidos
- const vinculos = useQuery({ ...consultaVinculos, enabled: anoEmCurso })
+ const vinculos = useQuery({ ...consultaVinculos })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › sem ano em curso: a seção diz que as turmas são do ano em curso, e vínculos, turmas e disciplinas nem são pedidos
- if (!anoEmCurso) return <p className="text-apoio">As turmas são do ano letivo em curso. Abra o ano letivo na tela Turmas.</p>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › vazio: "Nenhuma turma." para quem não tem vínculo; a lista que passou do teto de páginas avisa e não afirma o vazio
- vinculos.data.completa && <p className="text-apoio">Nenhuma turma.</p>
+ <p className="text-apoio">Nenhuma turma.</p>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › vazio: "Nenhuma turma." para quem não tem vínculo; a lista que passou do teto de páginas avisa e não afirma o vazio
- <AvisoDeListaIncompleta completa={vinculos.data.completa} />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o contestado diz o motivo e o complemento que o professor escreveu, e a saída é acrescentar a turma certa
- {vinculo.estado === 'contestado' && vinculo.contestacao !== undefined && <p className="text-sm break-words text-erro">Motivo: {NOME_DA_CONTESTACAO[vinculo.contestacao]}</p>}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o contestado diz o motivo e o complemento que o professor escreveu, e a saída é acrescentar a turma certa
- {vinculo.estado === 'contestado' && vinculo.complemento !== undefined && <p className="text-sm break-words text-apoio">Explicação do professor: “{vinculo.complemento}”</p>}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › os dois aparecem, cada um com o estado dele, e o motivo de encerrar só no encerrado
- {vinculo.motivoEncerramento !== undefined && <p className="text-sm break-words text-apoio">Motivo: {MOTIVO_DO_ENCERRAMENTO[vinculo.motivoEncerramento]}</p>}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o contestado sem complemento não inventa a linha dele; a dica de corrigir só aparece para quem ainda recebe turma
- {alocavel && dele.some((vinculo) => vinculo.estado === 'contestado') && <p className="text-sm text-apoio">Para corrigir uma turma contestada, acrescente a turma certa.</p>}
+ {dele.some((vinculo) => vinculo.estado === 'contestado') && <p className="text-sm text-apoio">Para corrigir uma turma contestada, acrescente a turma certa.</p>}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o convite vencido, o revogado e a conta desativada não têm o botão, veem por quê, e as turmas e as disciplinas da escola nem são lidas
- {motivoDeNaoAcrescentar !== undefined && <p className="text-apoio">{motivoDeNaoAcrescentar}</p>}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › com dado: um item por vínculo — turma, disciplina e o estado em texto —, pela turma e pela disciplina, e só os do professor do painel
- confirmado: { familia: 'ok', texto: 'Confirmou' },
+ confirmado: { familia: 'ok', texto: 'Confirmado' },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › a turma excluída com o diálogo aberto: a API responde como inexistente, a turma sai da escolha, e o envio seguinte pede a escolha de novo
- turmaId: turmas.some((turma) => turma.id === turmaId) ? turmaId : '',
+ turmaId,
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › a disciplina excluída com o diálogo aberto sai da escolha do mesmo jeito
- disciplinaId: disciplinas.some((disciplina) => disciplina.id === disciplinaId) ? disciplinaId : '',
+ disciplinaId,
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › sem escolher tudo, o diálogo diz o que falta e nada sai; escolhida a turma e não a disciplina, também
- if (completo) enviar({ usuarioId: professor.usuarioId, ...escolhido, papel: 'professor' })
+ enviar({ usuarioId: professor.usuarioId, ...escolhido, papel: 'professor' })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › alocou: o vínculo entra na lista esperando a confirmação, o painel anuncia, o diálogo fecha e o foco volta ao botão que o abriu
- if (completo) enviar({ usuarioId: professor.usuarioId, ...escolhido, papel: 'professor' })
+ if (completo) enviar({ usuarioId: professor.usuarioId, ...escolhido, papel: 'coordenador' })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o convite que venceu com o diálogo aberto: a API recusa, o painel perde o botão, o diálogo diz por quê e só oferece "Fechar", com o foco nas turmas
- semNovaTentativa={!alocavel}
+ semNovaTentativa={false}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o convite que venceu com o diálogo aberto: a API recusa, o painel perde o botão, o diálogo diz por quê e só oferece "Fechar", com o foco nas turmas
- const falha = !alocavel
+ const falha = false
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o vínculo que já existe: a API recusa com CONFLITO, o diálogo explica, fica aberto e não anuncia nada; a escolha incompleta tira o aviso
- [CodigoDeErro.CONFLITO]: 'Este professor já está alocado nesta turma e nesta disciplina.',
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › a turma excluída com o diálogo aberto: a API responde como inexistente, a turma sai da escolha, e o envio seguinte pede a escolha de novo
- [CodigoDeErro.NAO_ENCONTRADO]: TEXTO_DA_ALOCACAO_QUE_MUDOU,
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › a turma excluída com o diálogo aberto: a API responde como inexistente, a turma sai da escolha, e o envio seguinte pede a escolha de novo
- onError: recarregar,
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › alocou: o vínculo entra na lista esperando a confirmação, o painel anuncia, o diálogo fecha e o foco volta ao botão que o abriu
- await recarregar()
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › alocou: o vínculo entra na lista esperando a confirmação, o painel anuncia, o diálogo fecha e o foco volta ao botão que o abriu
- aoAlocar(`Alocação feita: ${professor.nome} em ${turmaEDisciplina(vinculo)}. A turma abre depois que quem foi alocado confirmar.`)
+ aoAlocar(`Alocação feita: ${professor.nome} em ${turmaEDisciplina(vinculo)}.`)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › recebe o convite em aberto, o aceito e o ativo; o vencido, o revogado e o desativado não
- return (ESTADOS_DO_PROFESSOR_ALOCAVEIS as readonly EstadoDoProfessor[]).includes(estado)
+ return true
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › quem recebe turma não tem motivo; cada um que não recebe tem o seu, em texto, com o caminho de volta
- return professorAlocavel(estado) ? undefined : PORQUE_NAO_RECEBE_TURMA[estado]
+ return undefined
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › quem recebe turma não tem motivo; cada um que não recebe tem o seu, em texto, com o caminho de volta
- vencido: 'O convite venceu. Refaça o convite para acrescentar uma turma.',
+ vencido: 'O convite venceu.',
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › o vínculo de outro professor não entra, nem o de papel que não é de professor
- vinculos.filter((vinculo) => vinculo.papel === 'professor' && vinculo.usuarioId === usuarioId),
+ vinculos.filter((vinculo) => vinculo.papel === 'professor'),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › o vínculo de outro professor não entra, nem o de papel que não é de professor
- vinculos.filter((vinculo) => vinculo.papel === 'professor' && vinculo.usuarioId === usuarioId),
+ vinculos.filter((vinculo) => vinculo.usuarioId === usuarioId),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › todo estado do professor entra
- return ordenarVinculos(
+ return ((lista: VinculoDaCoordenacao[], _chave: () => string) => lista)(
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › o motivo do encerramento diz as três razões em português
- fim_do_ano: 'fim do ano letivo',
+ fim_do_ano: 'fim do ano',
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o convite que venceu com o diálogo aberto: a API recusa, o painel perde o botão, o diálogo diz por quê e só oferece "Fechar", com o foco nas turmas
- alocavel={alvoRecebeTurma}
+ alocavel={true}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o convite que venceu com o diálogo aberto: a API recusa, o painel perde o botão, o diálogo diz por quê e só oferece "Fechar", com o foco nas turmas
- const alvoRecebeTurma = alvoAgora !== undefined && professorAlocavel(alvoAgora.estado)
+ const alvoRecebeTurma = alvoAgora !== undefined
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o convite que venceu com o diálogo aberto: a API recusa, o painel perde o botão, o diálogo diz por quê e só oferece "Fechar", com o foco nas turmas
- focoDeReserva={focarNasTurmas}
+ focoDeReserva={focarNoPainel}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/o-que-falta-da-escola.ts
teste: apps/web/src/areas/coordenacao/o-que-falta-da-escola.test.ts › cada passo leva à tela onde se faz: o ano, as séries e as disciplinas no painel do ano; os professores e a alocação em Professores
- { titulo: 'Alocação', texto: 'Ligue cada professor à turma e à disciplina. Ele confirma pelo convite.', acao: 'Ligue cada professor à turma e à disciplina.', feito: tem(dados?.vinculos), para: PARA_OS_PROFESSORES },
+ { titulo: 'Alocação', texto: 'Ligue cada professor à turma e à disciplina. Ele confirma pelo convite.', acao: 'Ligue cada professor à turma e à disciplina.', feito: tem(dados?.vinculos), para: PARA_AS_TURMAS },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › alocou: o vínculo entra na lista esperando a confirmação, o painel anuncia, o diálogo fecha e o foco volta ao botão que o abriu
- definirAnuncio({ usuarioId: alvo.usuarioId, texto })
```

```mutacao
arquivo: apps/web/src/componentes/PainelLado.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o miolo rolável do painel está no ciclo do Tab
- <div ref={miolo} tabIndex={0} data-painel-miolo="" className="min-h-0 flex-1 overflow-y-auto p-5 -outline-offset-3 md:p-6">
+ <div ref={miolo} tabIndex={-1} data-painel-miolo="" className="min-h-0 flex-1 overflow-y-auto p-5 -outline-offset-3 md:p-6">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › carregando os anos
- if (anos.data === undefined) return <EstadoCarregando rotulo="Carregando as turmas…" />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o vínculo sem disciplina diz
- <p className="text-sm break-words text-apoio">{vinculo.disciplina?.nome ?? 'Sem disciplina'}</p>
+ <p className="text-sm break-words text-apoio">{vinculo.disciplina?.nome ?? ''}</p>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/Professores.test.tsx › só as ações que o estado permite
- acoes.length === 0 && !podeAcrescentar ? undefined : (
+ acoes.length === 0 ? undefined : (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › erro nos vínculos: a mensagem curta
- if (falhou !== undefined)
+ if (falhou === undefined)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › erro nos vínculos: a mensagem curta
- for (const consulta of consultas) if (consulta.isError) void consulta.refetch({ cancelRefetch: false })
+ for (const consulta of consultas) void consulta.refetch({ cancelRefetch: false })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o vínculo que já existe: a API recusa com CONFLITO
- definirFaltando(!completo)
+ definirFaltando(true)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Alocacao.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › o vínculo que já existe: a API recusa com CONFLITO
    ? TEXTO_DO_PROFESSOR_QUE_DEIXOU_DE_RECEBER
- : faltando
+ : false
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: e2e/alocacao.spec.ts › a resposta que chega depois de o diálogo ter fechado
            definirAnuncio({ usuarioId: alvo.usuarioId, texto })
- dialogo.fecharSeAinda(aberta)
+ fechar()
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx › abrir de novo com o diálogo ainda aberto é uma abertura nova
 {aberta?.tipo === 'acrescentar' && alvo !== undefined && (
        <DialogoDeAlocacao
- key={aberta.numero}
          professor={alvo}
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| Orquestrador (observação da 9.0) | Alinhar o texto de "nome não carregado" da Alocação com o da lista da turma ("Nome não carregado") | Recusada, sem o que alinhar: a lista de professores da Alocação saiu com a seção, o painel recebe o professor pronto e não tem fallback de nome; "Nome não carregado" continua só em `turmas-da-escola.ts` |
| frontend-reviewer (1ª) | `PainelDoProfessor.tsx:134-135` e `o-que-falta-para-alocar.ts`: o vazio "Crie uma turma primeiro" não diz onde criar; um link para a aba Turmas fecha o próximo passo | `TODO.md`: texto de tela e caminho novos, que a Mesa não dita; decidir na 8.0 ou no Arquiteto |
| frontend-reviewer (1ª) | "Nenhuma turma." poderia convidar ("Nenhuma turma ainda. Use Acrescentar turma."), só quando o botão existe | `TODO.md`: texto de tela, com o mesmo destino da linha acima |
| frontend-reviewer (1ª) | `convite-de-professor.ts`: o selo sai como "ATIVO." com ponto final; vem da 6.0 | `TODO.md`: o arquivo não é da 7.0, e a 6.0 já fechou |
| frontend-reviewer (1ª) | "Acrescentar turma" é a única ação do rodapé na variante secundária | Recusada: o revisor a registra como observação e diz que está de acordo com a Tech Spec |
| revisor-geral (1ª) | O selo do vínculo repete o de `ProfessoresDaTurma.tsx`, mudando só os textos; uma peça só, recebendo o mapa de textos | `TODO.md`: mexe na lista da turma, que a 7.0 não tem por objeto, e refaz os blocos de "Mutações" do selo |
| revisor-geral (1ª) | `PainelDoProfessor.tsx:28`: o ternário que repete `<Estado>` pede um comentário de uma linha ou a correção do tipo | Junto com a linha anterior, no `TODO.md` |
| privacy-guardian (1ª) e revisor-geral (1ª) | Os textos de `PORQUE_NAO_RECEBE_TURMA` dizem "cadastre o mesmo e-mail de novo": certo para professor, errado se um dia forem reaproveitados para aluno | Recusada: o texto é do professor, que tem e-mail; aluno não tem (regra 20, item 2), e nada o reaproveita hoje |
| test-engineer (1ª) | O e2e do contestado não confere o complemento; estender `contestarVinculosNoBanco` para gravá-lo | `TODO.md`: a divergência já está declarada; a fixture é de outra tarefa |
| test-engineer (1ª) | A família visual do selo (`SELO_DO_VINCULO.familia`) não tem asserção | Recusada: é visual, e fica com o `frontend-reviewer`, que a aprovou nas fotos |
| test-engineer (1ª) | Religar `violacoesGraves` no painel com três turmas quando a correção do `PainelLado` chegar | Aplicada na rodada 1: `tabIndex={0}` no miolo e `violacoesGraves` no e2e do contestado |
| revisor-geral (2ª) e test-engineer (2ª) | `apps/web/src/componentes/dialogo-modal.ts:26` e `dialogo-modal.test.ts:31` ainda dizem que o miolo do painel é `tabIndex={-1}`, fora da ordem do Tab; basta tirar "o miolo do painel" dos dois comentários | `TODO.md`: comentário em arquivo que a 7.0 não toca; a lógica da prisão de foco continua certa |
| revisor-geral (2ª) | Com `tabIndex={0}`, o miolo é parada do Tab em todo painel, mesmo quando não rola; a saída seria tirá-lo da ordem do Tab só quando não rola | Recusada: o `frontend-reviewer` aprovou o contorno de foco e a correção é a que ele próprio exigiu; reabrir se um painel curto incomodar |
| privacy-guardian (2ª) | O miolo com `tabIndex={0}` recebe foco visível em todo painel que usa `PainelLado`; olhar o contorno de foco nos outros | Recusada: o foco não muda o que a API devolve, e o `frontend-reviewer` conferiu o contorno (`-outline-offset-3`) |
| test-engineer (2ª) | O caso `abrir de novo com o diálogo ainda aberto` (`PainelDoProfessor.test.tsx:532`) só funciona no jsdom, onde o fundo não fica inerte; o nome do caso deveria dizer que prova a garantia defensiva da `key` | `TODO.md`: só o nome do teste, sem mudar o que ele prova |
| test-engineer (2ª) | O bloco `if (falhou !== undefined)` → `=== undefined` fica vermelho em parte por quebrar a renderização; trocar por `if (false)` deixaria o vermelho só pela regra | `TODO.md`: o bloco já fica vermelho no teste certo; refinar é ajuste de mutação |
| test-engineer (2ª) | `escola-montada.spec.ts:144` prova o lado da tela; a recusa da API ao pendente continua nos testes de integração do F1 | Recusada: é a opção que a 1ª rodada ofereceu, e a Tech Spec já aponta esse teste |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 11:24:13 | 2026-10-17 11:25:16 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a1b3d79bc6e5d080c |
| 2026-10-17 11:24:16 | 2026-10-17 11:25:23 | `privacy-guardian` | 1 | APROVADO | a49b49ea71b020cbd |
| 2026-10-17 11:24:23 | 2026-10-17 11:26:29 | `revisor-geral` | 1 | REPROVADO | a6ca173a9c51a636e |
| 2026-10-17 11:24:20 | 2026-10-17 11:27:34 | `test-engineer` | 1 | REPROVADO | ab9d09f38a71386e5 |
| 2026-10-17 11:59:11 | 2026-10-17 11:59:33 | `frontend-reviewer` | 2 | APROVADO | ab601a1232565b83e |
| 2026-10-17 11:59:18 | 2026-10-17 11:59:36 | `privacy-guardian` | 2 | APROVADO | afb73d4956da9e73d |
| 2026-10-17 11:59:41 | 2026-10-17 12:00:22 | `revisor-geral` | 2 | APROVADO | ad5e94f61b112e3de |
| 2026-10-17 11:59:31 | 2026-10-17 12:01:27 | `test-engineer` | 2 | APROVADO | ad1c7ae77dcdc9f8a |

# Tarefa 9.0 — Turmas: os cartões e "Confirme sua turma"

**Funcionalidade:** telas-do-professor · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Turmas mostra, antes dos cartões, uma faixa "Confirme sua turma" para cada vínculo que espera a professora, com confirmar
e contestar. A contestação abre num painel ao lado. Cada cartão diz o que espera naquela turma.

## Contexto necessário

- `techspec.md` seções 5 (a fila), 7 e 9 (Turmas: grade, faixa, cartões, contestação no `PainelLado`); `prd.md` RF14,
  RF22 e a seção 7 (duas disciplinas na mesma turma); `mockup.md` 4.1 e 13.3 (d)
- Regras 10 e 20: o complemento da contestação é texto livre, e a tela avisa para não escrever nome de aluno; D3 e
  regra 60, item 8a: a professora só confirma
- Código: `Turmas.tsx` (`ContestacaoEmAndamento`, `FormularioDeContestacao`); `api/vinculos.ts`; `fila-do-professor.ts`
  e `consultaContagemDePedidos` (da 1.0)

## Subtarefas

- [x] 9.1 — `Turmas.tsx`: o `h1` "Turmas" visível; a faixa de cada vínculo em decisão, com a região "Confirme suas
  turmas", o texto "Confirme sua turma · 7ºA · Matemática" e os botões "Confirmar" e "Contestar"; a grade de cartões
  em "Suas turmas" (um por turma e disciplina), cada um com ladrilho, nome, série e o estado em texto. O que espera
  vem da fila do sino (as mesmas consultas, nenhuma leitura a mais): "N esperando você". A turma que o sino não leu
  (falha, recusa ou além das 12) diz "não lida", nunca "em dia". Só o vínculo confirmado abre a turma
- [x] 9.2 — A contestação no `PainelLado` (folha de baixo a 360 px): o motivo em lista fechada, o complemento com o aviso
  de não escrever sobre aluno e o efeito escrito antes de enviar. O texto fica no estado da página, como hoje
- [x] 9.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Turmas.tsx` | alterado |
| `apps/web/src/areas/professor/Turmas.test.tsx` | novo |
| `e2e/professor-turmas.spec.ts` | novo |
| `e2e/escola-e-vinculos.spec.ts` (`vínculos do professor`), `e2e/areas.spec.ts` (`W4: os estados de "Turmas"`) | alterado |

A 9.0 e a 5.0 não correm juntas: as duas editam `e2e/areas.spec.ts`.

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| estados | componente | carregando; erro com "Tentar de novo"; vazio ("A coordenação ainda não alocou você"); só pendente; com confirmadas |
| confirmar | componente e e2e | a faixa some e o cartão aparece em "Suas turmas"; dois cliques mandam uma decisão só; o cartão pendente e o contestado não têm "Abrir a turma" |
| duas disciplinas na mesma turma | componente | dois cartões, cada um com o seu estado; confirmar um não muda o outro |
| contestar | componente e e2e | sem motivo não envia; o aviso de não escrever nome de aluno e o efeito aparecem antes do envio; o contestado sai da faixa e não conta para o sino |
| o texto sobrevive | componente | a lista relida (`invalidateQueries`) com o painel aberto não apaga motivo nem complemento; Esc fecha e devolve o foco ao botão "Contestar" |
| o que espera | componente | o selo "N esperando você" soma entrega, versão adaptada e pedidos de nome da turma, e a conta de chamadas é a do sino (nenhuma a mais); leitura parcial e turma além das 12 mostram "não lida", nunca "em dia". Mutação: mostrar "em dia" na turma não lida. Os dois cartões da mesma turma abrem a mesma turma |
| recomeço | e2e | a segunda pessoa na mesma aba não vê painel nem texto; a sessão vencida com o painel aberto volta com o texto; trocar de escola esvazia a lista. Log: o complemento nunca vai a log nem ao endereço (privacy-guardian). O "Texto da pessoa" sai junto quando entra outra pessoa |
| 360 px | e2e | o painel vira folha de baixo, sem rolar de lado; a faixa quebra; alvos de 44 px |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`)
- e2e: `vínculos do professor` (4 casos) em `escola-e-vinculos.spec.ts` e `W4: os estados de "Turmas"` em
  `areas.spec.ts`. Muda o painel da contestação (o formulário sai do cartão); motivo, efeito e envio único ficam
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/Turmas.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-turmas.spec.ts e2e/escola-e-vinculos.spec.ts`
- Telas: `professora`, `/professor/turmas`, `--clicar 'role=button[name="Contestar"]'`. Mockup: `/professor/turmas`

## Fora do escopo desta tarefa

A aba Semana, "Começar aula", o acerto da turma, a próxima aula e o uso do Tutor no cartão (F6, F8, F10); "Não é minha"
no lugar de "Contestar" (o nome do botão é contrato do e2e); o convite depois de confirmar (13.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A série não entra no cartão da turma | O `Vinculo` de `meus-vinculos` não a traz; lê-la seria um `GET /v1/turmas/:id` por cartão, que a §4 não admite e que a API recusa no vínculo pendente. O nome da turma já diz o ano | `techspec.md` §9, "Cartão da turma" |
| `Turmas` sai da fachada por `lazy()` (`tela-professor-Turmas-*.js`) | Com a faixa, os cartões e o painel de contestação, o `professor-*.js` passava de 11 kB brotli contra os 8 kB do `size-limit`, e o e2e abortava. O teto da fachada não sobe; a descrição dela no `.size-limit.json` e o comentário de `rotas.tsx` foram atualizados | `techspec.md` §8, "Orçamento" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › com as confirmadas
-const paraConfirmar = itens.filter((vinculo) => vinculo.estado === 'pendente')
+const paraConfirmar = itens.filter((vinculo) => vinculo.estado !== 'confirmado')
```

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › com as confirmadas
-const decididas = itens.filter((vinculo) => vinculo.estado !== 'pendente')
+const decididas = itens.filter((vinculo) => vinculo.estado === 'confirmado')
```

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › com as confirmadas
-{vinculo.estado === 'confirmado' && (
+{vinculo.estado !== 'encerrado' && (
 // Relativo à área: o `Route` aninhado em `/professor` resolve o `to` a partir da base dela.
```

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › a faixa some e o cartão aparece
-<Botao variante="oficial" onClick={() => confirmar.mutate(vinculo.id)} disabled={decidindo}>
+<Botao variante="oficial" onClick={() => confirmar.mutate(vinculo.id)}>
```

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › sem motivo não envia nada
-if (decidindo || contestacao === undefined || contestacao.codigo === '') return
+if (decidindo || contestacao === undefined) return
```

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › o painel só fecha com a lista já relida
-await recarregar()
 definirContestacao(undefined)
+await recarregar()
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › soma a correção, a versão adaptada e os pedidos da turma
-const dela = fila.itens.filter((item) => item.turmaId === turmaId && item.tipo !== 'confirme-sua-turma')
+const dela = fila.itens.filter((item) => item.tipo !== 'confirme-sua-turma')
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › o vínculo a confirmar não entra na soma
-const dela = fila.itens.filter((item) => item.turmaId === turmaId && item.tipo !== 'confirme-sua-turma')
+const dela = fila.itens.filter((item) => item.turmaId === turmaId)
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › soma a correção, a versão adaptada e os pedidos da turma
-(item.tipo === 'pedidos-de-nome' ? (item.contador?.n ?? 0) : 1)
+1
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › a turma não lida
-dosPedidos === undefined || dosPedidos === 'erro' || dosPedidos === 'nao-lida' ? 'nao-lida'
+dosPedidos === 'nao-lida' ? 'nao-lida'
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › a turma não lida
-const dasEntregas: LeituraDaTurma = entregas.estado === 'carregando' ? 'lendo' : entregas.estado === 'lida' && entregas.completa ? 'lida' : 'nao-lida'
+const dasEntregas: LeituraDaTurma = entregas.estado === 'carregando' ? 'lendo' : 'lida'
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › a página de pedidos que veio cheia
-return { n, ouMais: leitura !== 'lida' || dela.some((item) => item.haMais === true), leitura }
+return { n, ouMais: leitura !== 'lida', leitura }
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › a turma não lida
-const leitura = fila.leituraPorTurma.get(turmaId) ?? 'nao-lida'
+const leitura = fila.leituraPorTurma.get(turmaId) ?? 'lida'
```

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › com as confirmadas
-{vinculo.estado === 'confirmado' && (
+{vinculo.estado !== 'pendente' && (
 <div>
```

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › a turma que o sino não leu
-if (espera.leitura === 'nao-lida') return <Estado familia="info">Não lida</Estado>
+if (espera.leitura === 'nao-lida') return <Estado familia="ok">Em dia</Estado>
```

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › o número de uma turma que o sino leu pela metade é um piso
-if (espera.n > 0) return <Estado familia="pendente">{`${String(espera.n)}${espera.ouMais ? ' ou mais' : ''} esperando você`}</Estado>
+if (espera.n > 0) return <Estado familia="pendente">{`${String(espera.n)}${espera.ouMais ? '' : ''} esperando você`}</Estado>
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | O painel fecha sozinho e o texto some quando o vínculo sai da lista por fora (decidido em outra aba): "Vale ao menos limpar o estado e avisar." | `TODO.md`: muda comportamento da tela (não cabe como recomendação barata) |
| revisor-geral (1ª) | O mesmo `abrirJaEntrando` copiado em cinco specs (`escola-e-vinculos`, `inatividade`, `professor-turmas`, `acesso-da-turma` e `entrarPelaApi` em `areas`): mover para `e2e/__fixtures__/` | `TODO.md`: refatoração de cinco specs, fora de "poucas linhas" e com risco para os casos que a tarefa não altera |
| revisor-geral (1ª) | A §8 manda a 10.0 tirar `Turma` da fachada, mas o `10_task.md` não diz isso: incluir `rotas.tsx` e `.size-limit.json` em "Arquivos previstos" da 10.0 | Tarefa 10.0 (`10_task.md`): documento de outra tarefa, quem edita é o Arquiteto. Vai no relatório ao Orquestrador |
| revisor-geral (1ª), privacy-guardian (1ª) | Dois testes de acessibilidade (`violacoesGraves`) saíram de casos alterados: o do login por cima em `inatividade.spec.ts` e o primeiro de `escola-e-vinculos.spec.ts` | A cobertura é do test-engineer: ele passou a 1ª rodada com o recomeço coberto e sem objeção a isso. A pergunta vai no prompt dele na rodada 2 |
| frontend-reviewer (1ª) | Texto do cabeçalho da casca truncado a 360 px ("Colég…") | Fora da tarefa (é da casca): registrado para o `/validar`, que fotografa cada requisito |
| frontend-reviewer (1ª) | O mockup 4.1 chama o botão de "Não é minha" e inverte a ordem dos botões | Recusada: o nome do botão é contrato do e2e e a tarefa declara "Fora do escopo" |
| frontend-reviewer (1ª) | Os cartões não trazem série, acerto da turma, próxima aula nem uso do Tutor | Recusada: já está em "Divergências resolvidas" e em "Fora do escopo" (F6, F8, F10) |
| frontend-reviewer (1ª) | Na foto de 360 px a barra inferior fixa cobre parte do cartão | Recusada: o próprio revisor diz que é efeito do recorte de tela cheia da vitrine, não defeito de layout |
| test-engineer (2ª) | Declarar um bloco de mutação para `contestar.reset()` (`Turmas.tsx`), apontando para "a falha de uma contestação não vai junto para o painel do outro vínculo": o teste existe e falharia sem o reset, falta só o portão prová-lo | `TODO.md`, na linha única "Turmas 9.0: recomendações de forma" |
| test-engineer (2ª) | A variante do login por cima com e-mail não passa mais pelo axe em nenhum caso de `inatividade.spec.ts`: ver se `acesso-suspenso.spec.ts` ou `professores.spec.ts` a cobrem; se não, devolver um `violacoesGraves` barato | Mesma linha do `TODO.md` |
| test-engineer (2ª) | O teste "espalha as disciplinas" (`familia-da-disciplina.test.ts`) usa ids `disciplina-n`, que não são UUID v7 como os de produção | Mesma linha do `TODO.md` |
| revisor-geral (2ª) | `e2e/professor-turmas.spec.ts:57-63`: o teste de quebra da faixa usa `?? 0` nos dois lados; ler as caixas com `if (!caixa) throw` tira os `?? 0` | Mesma linha do `TODO.md`: efeito só de leitura, o `not.toBeNull()` acima já segura o caso |
| revisor-geral (2ª) | `Turmas.tsx:96-97`: o comentário de duas linhas antes de `decidindo` repete a ideia; uma frase basta | Mesma linha do `TODO.md` |
| revisor-geral (2ª) | Descompasso entre a §8 da Tech Spec e o `10_task.md` (a §8 manda a 10.0 tirar `Turma` da fachada) | Já está na tabela da rodada 1 (tarefa 10.0, Arquiteto); vai no relatório ao Orquestrador |
| privacy-guardian (2ª) | Quando vier a correção própria do painel que fecha sozinho, ela também deve garantir que o rascunho do complemento não fique no estado do cliente nem seja reenviado ao reabrir o painel de outro vínculo | Acrescentado à linha do `TODO.md` do painel que fecha sozinho |
| frontend-reviewer (2ª) | Os nomes de turma da vitrine trazem sufixos como "d8fa74ae" | Recusada: vem do dado sintético da vitrine, não do código |
| frontend-reviewer (2ª) | A 360 px o texto de apoio do complemento fica cortado pelo rodapé ("Até 140…"): dar respiro ao miolo (padding inferior) | `TODO.md`, na linha única "Turmas 9.0: recomendações de forma": acabamento visual, a rolagem funciona |
| frontend-reviewer (2ª) | A faixa diz "Confirme sua turma ·" em cada linha, e o título da seção já diz isso: trazer só turma e disciplina | Recusada: o texto "Confirme sua turma · 7ºA · Matemática" é o que a subtarefa 9.1 e o e2e especificam |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 02:55:53 | 2026-10-19 02:56:38 | `frontend-reviewer` | 1 | APROVADO | a41c8a1df9700b767 |
| 2026-10-19 02:55:57 | 2026-10-19 02:57:03 | `privacy-guardian` | 1 | APROVADO | ad8a7f499223cbcdc |
| 2026-10-19 02:56:02 | 2026-10-19 02:57:59 | `test-engineer` | 1 | REPROVADO | a82d77f0df009f2eb |
| 2026-10-19 02:56:06 | 2026-10-19 02:58:26 | `revisor-geral` | 1 | APROVADO | a02a8d6b671fb936c |
| 2026-10-19 03:22:25 | 2026-10-19 03:22:48 | `frontend-reviewer` | 2 | APROVADO | aba645795696bbfa4 |
| 2026-10-19 03:22:37 | 2026-10-19 03:23:11 | `privacy-guardian` | 2 | APROVADO | aecbd2d7a821d3a61 |
| 2026-10-19 03:23:12 | 2026-10-19 03:24:07 | `revisor-geral` | 2 | APROVADO | ac7b21a6a312e11ce |
| 2026-10-19 03:22:58 | 2026-10-19 03:24:08 | `test-engineer` | 2 | APROVADO | a241d32e23f711a9f |

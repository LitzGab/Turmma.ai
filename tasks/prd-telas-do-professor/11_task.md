# Tarefa 11.0 — Turma › Atividades

**Funcionalidade:** telas-do-professor · **Depende de:** 6.0, 10.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba Atividades lista as atividades aplicadas à turma, uma linha por atividade, com o estado e os envios. A linha abre um
painel ao lado com o que fazer: abrir a atividade, revisar a correção e encerrar.

## Contexto necessário

- `techspec.md` seções 5 e 9 (o painel ao lado fica no endereço, `?atividade=`); `prd.md` RF17 e RF22; `mockup.md` 5.2
- Regra 70, itens 1 e 3; D55: atividade é só objetiva, e a aba não tem "Para corrigir" nem "a discursiva é sua". D46:
  acertos e correção, nunca nota
- Código: `AtividadesDaTurma.tsx` (a casca da 10.0, com a lista de `VisaoGeralDaTurma`); `aprovar.ts`
  (`situacaoDaAplicacao`, `semCorrecao`, `TEXTO_SEM_CORRECAO`); `EncerramentoDaAtividade.tsx` (da 6.0);
  `api/atividades.ts` (`consultaAtividadesAplicadas`)

## Subtarefas

- [x] 11.1 — `AtividadesDaTurma.tsx`: uma `Linha` por atividade, a mais nova primeiro, com título, a situação de hoje
  (`situacaoDaAplicacao`), "N de M enviaram" e o selo do estado em texto (Aberta, Encerrada, Correção para revisar,
  Correção aprovada, Correção rejeitada, Sem correção). Com mais de oito linhas, o `Segmentado` "Todas · Abertas ·
  Para revisar · Encerradas". O painel da atividade em `?atividade=<id>` (`PainelLado`; folha de baixo a 360 px)
- [x] 11.2 — O painel traz "Abrir a atividade", "Revisar a correção" ou "Ver a correção", "Corrigir de novo" quando não
  há lote, e "Encerrar a atividade" (o `EncerramentoDaAtividade` da 6.0, com a mesma confirmação). A ação da aba,
  "Aplicar uma atividade", leva a Criados com a turma e o tipo (`?turma=<id>&tipo=atividade_objetiva`)
- [x] 11.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/AtividadesDaTurma.tsx` | alterado (a 10.0 o criou) |
| `apps/web/src/areas/professor/AtividadesDaTurma.test.tsx` | novo |
| `e2e/professor-turma-atividades.spec.ts` | novo (cada aba tem o seu spec; o `professor-turma-aberta.spec.ts` é da 10.0) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| o estado de cada linha | unidade e componente | aberta; encerrada com lote pendente, aprovado e rejeitado; encerrada sem ninguém ter respondido; correção suspensa. Cada uma diz o que é e o que fazer, em texto |
| estados | componente | carregando; erro com "Tentar de novo"; vazio ("Nenhuma atividade aplicada a esta turma", com o caminho para Criados); filtro sem resultado, com "Limpar filtro"; com dado |
| o painel pelo endereço | componente | `?atividade=<id>` abre o painel; id de outra turma ou inexistente não abre painel e a lista segue; Esc fecha, tira o parâmetro e devolve o foco à linha |
| encerrar com a confirmação | e2e | o diálogo diz o que acontece (as respostas param, a correção é feita e espera a professora); dois cliques mandam um pedido só; a linha vira "Encerrada" e o link da correção aparece |
| é avaliativa | e2e | a atividade avaliativa aberta diz que o Tutor está pausado até encerrar (caso de hoje) |
| vocabulário | unidade | nenhum texto da aba tem "nota", "média", "conceito" nem "pontuação"; nada ordena por acerto (D46, D69) |
| "Aplicar uma atividade" | e2e | leva a Criados já filtrado pela turma, sem nome de aluno no endereço |
| recomeço | e2e | recarregar mantém o painel; a segunda pessoa não vê a lista; trocar de turma fecha o painel; resposta atrasada do encerrar não troca o estado da outra turma |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`); o diálogo, de
  `EncerramentoDaAtividade.test.tsx`
- e2e: o encerrar de `aplicar à turma e encerrar, no artefato (A3)` já está na 6.0; aqui o caminho é o painel da aba, que
  chama o mesmo componente. `a3-a4-professor.spec.ts` não muda
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/AtividadesDaTurma.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-turma-atividades.spec.ts`
- Telas: `professora`, `/professor/turmas/:id?aba=atividades`, `--clicar 'role=button[name=/atividade/]'` na linha.
  Mockup: `/professor/turmas/2b?aba=atividades&atividade=<id>`

## Fora do escopo desta tarefa

Prazo, agendada, discursiva e "Corrigir as discursivas" (D55); "Acerto", "Abaixo de 6", "Erros que se repetiram" e a lista
de quem não entregou (F6; a API só devolve a contagem); "Ver as notas"; "Aprovar as notas" no painel (a aprovação é
a tela da 14.0); o botão "Nova atividade" que abre conversa.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A linha é a `Linha` da X1 e é botão: abre o painel; "Abrir a atividade" e "Revisar a correção" / "Ver a correção" moram no rodapé do painel e saem da linha. O caso de `professor-turma-aberta.spec.ts` que procurava o link na lista clica a linha antes | O desenho da X1 e o painel ao lado pedem a linha inteira clicável; link dentro de botão não existe | `techspec.md` §5 e §9; parágrafo "Atividades na pele nova" (1) |
| O filtro é "Todas · Abertas · Para revisar · Encerradas", só com mais de oito linhas, é estado da aba (não vai ao endereço) e não fecha o painel aberto | O mockup dizia "Para aprovar · Corrigidas"; a tarefa pede estes nomes | parágrafo "Atividades na pele nova" (3) |
| Não há selo "Encerrada" sozinho: a atividade encerrada tem um dos selos Correção para revisar, Correção aprovada, Correção rejeitada ou Sem correção, e "Encerrada" fica na frase da situação | O selo diz o que a professora faz com a atividade; um selo "Encerrada" repetiria a frase e não diria nada | parágrafo "Atividades na pele nova" (11) |
| "Corrigir de novo" aparece na atividade encerrada sem correção que valha: função suspensa **e** lote rejeitado (`semCorrecao`), o mesmo critério do documento aberto | A subtarefa diz "quando não há lote"; o lote rejeitado também fica sem correção que valha, e o documento aberto já o trata assim | parágrafo "Atividades na pele nova" (4) |
| O pedido de "Corrigir de novo" e o aviso saem de `AplicacaoDoArtefato` para o gancho `corrigir-de-novo.ts`; a frase da avaliativa aberta vira `AVISO_DA_AVALIATIVA_ABERTA` em `aprovar.ts` | Dois lugares usam o mesmo pedido e o mesmo texto: não se copia | parágrafo "Atividades na pele nova" (5) |
| O nome da turma da confirmação vem de `consultaTurmaAberta` (cache da moldura); trocar de turma recomeça a aba por `key`; o foco volta à linha ao fechar o painel aberto pelo endereço e vai ao bloco "O que fazer" quando o botão que o tinha sai do painel | A confirmação diz a turma pelo nome; a resposta atrasada de uma turma não toca a outra (recomeço); regra 50, item 11 | parágrafo "Atividades na pele nova" (6) a (8) |
| "Recarregar mantém o painel" é provado por componente (`AtividadesDaTurma.test.tsx`, `?atividade=<id>` abre o painel), e não por e2e; a segunda pessoa que não vê a lista é um trecho do caso de recomeço de `professor-sino.spec.ts` | Cada carga completa da página custa perto de 10 s na máquina: o caso novo conta 30 s, a régua do portão reprova o que passa de 15 s, e o caso que recarrega media 20 a 22 s. O caso com duas entradas também passa. Os casos novos entram pela API e abrem o endereço numa carga só, como os da aba Alunos | `techspec.md` §10 ("Duração do e2e na separação"); `tools/ci/duracao-do-e2e.ts`; mesmo caminho da 10.0 |
| "Aplicar uma atividade" é link para Criados com `?tipo=atividade_objetiva&turma=<id>`; sem atividade ele mora só no vazio | Um convite só, e não dois botões com o mesmo nome | parágrafo "Atividades na pele nova" (9) |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

Cada cláusula da aba tem a sua: a ordem (mais nova primeiro), o limite do filtro, o estado do lote rejeitado, quando "Corrigir de novo" existe, o painel só da lista da turma, o endereço de aplicar, o foco ao fechar o painel do endereço, o foco do "Limpar filtro", a aba recomeçada por turma e o pedido de corrigir uma vez só.

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › com dado: o cabeçalho leva a Criados
-  return [...aplicadas].sort((a, b) => Date.parse(b.aplicadaEm) - Date.parse(a.aplicadaEm) || b.id.localeCompare(a.id))
+  return [...aplicadas].sort((a, b) => Date.parse(a.aplicadaEm) - Date.parse(b.aplicadaEm) || b.id.localeCompare(a.id))
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › com até oito linhas não há filtro
-  const comFiltro = todas.length > LIMITE_PARA_FILTRAR
+  const comFiltro = todas.length > 0
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › o estado de cada linha
-  return aplicada.entrega.estado === 'aprovada' ? 'aprovada' : 'rejeitada'
+  return 'aprovada'
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › "Corrigir de novo" só existe quando a atividade encerrou sem correção que valha
-          {(motivo === 'correcao_suspensa' || motivo === 'lote_rejeitado') && (
+          {motivo !== undefined && (
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › abrir pela linha põe o id no endereço
-  const aberta = todas.find((aplicada) => aplicada.id === atividadeDoEndereco(busca))
+  const aberta = todas.find((aplicada) => aplicada.id === atividadeDoEndereco(busca)) ?? todas[0]
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › o endereço de aplicar leva só ids
-  return enderecoComFiltros(ROTAS_DO_PROFESSOR.criados, '', { turma: turmaId, tipo: 'atividade_objetiva' })
+  return enderecoComFiltros(ROTAS_DO_PROFESSOR.criados, '', { turma: turmaId })
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › o painel aberto pelo endereço devolve o foco à linha dele
-      if (document.activeElement === document.body) daLista.get(idDoPainel)?.querySelector('button')?.focus()
+      if (document.activeElement === document.body) void daLista
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › filtro sem resultado diz isso
-    if (pedidoDeFoco > 0) filtroNaTela.current?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')?.focus()
+    if (pedidoDeFoco > 0) void filtroNaTela
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › o filtro e o painel da turma anterior não passam para a seguinte
-  return <AbaDeAtividades key={turmaId} turmaId={turmaId} />
+  return <AbaDeAtividades turmaId={turmaId} />
```

```mutacao
arquivo: apps/web/src/areas/professor/corrigir-de-novo.ts
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › "Corrigir de novo" com dois cliques no mesmo instante
-    if (decidindo.current) return
+    if (false) return
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › a encerrada não se encerra de novo
-        {aplicada.avaliativa && aplicada.estado === 'aberta' && <p className="min-w-0 rounded-controle bg-info-cx p-3 break-words text-info">{AVISO_DA_AVALIATIVA_ABERTA}</p>}
+        {aplicada.avaliativa && <p className="min-w-0 rounded-controle bg-info-cx p-3 break-words text-info">{AVISO_DA_AVALIATIVA_ABERTA}</p>}
```

Da rodada 1: o vazio do filtro, o filtro em uso, o `replace` do fechar, o foco no painel, o estado pendente, o filtro "Para revisar", o painel pelo id, a concordância de "enviou".

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › carregando: diz que está lendo
-      {todas.length > 0 && visiveis.length === 0 && (
+      {visiveis.length === 0 && (
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › a lista que encolhe até o limite
-  const filtroEmUso = comFiltro ? filtro : 'todas'
+  const filtroEmUso = filtro
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › Esc fecha o painel
-  const fechar = (): void => navegar(enderecoComAAtividade(caminho, busca, null), { replace: true })
+  const fechar = (): void => navegar(enderecoComAAtividade(caminho, busca, null))
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › encerrar pelo painel
-    if (document.activeElement === document.body) reserva.current?.focus()
+    if (document.activeElement === document.body) void reserva
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › o estado de cada linha
-  if (aplicada.entrega.estado === 'pendente') return 'para_revisar'
+  if (false) return 'para_revisar'
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › cada opção deixa passar só o que o nome diz
-  if (filtro === 'para_revisar') return estadoDaAtividade(aplicada) === 'para_revisar'
+  if (filtro === 'para_revisar') return aplicada.estado === 'encerrada'
```

```mutacao
arquivo: apps/web/src/areas/professor/AtividadesDaTurma.tsx
teste: apps/web/src/areas/professor/AtividadesDaTurma.test.tsx › duas atividades com o mesmo título
-                  aoAcionar={() => abrir(aplicada.id)}
+                  aoAcionar={() => abrir(visiveis[0]?.id ?? aplicada.id)}
```

```mutacao
arquivo: apps/web/src/areas/professor/aprovar.ts
teste: apps/web/src/areas/professor/aprovar.test.ts › a atividade aplicada diz se está aberta
-  const partes = [aplicada.estado === 'aberta' ? 'Aberta para a turma' : 'Encerrada', aplicada.avaliativa ? 'avaliativa' : 'prática', `${String(aplicada.participacao.enviaram)} de ${textoDeAlunos(aplicada.participacao.alunos)} ${aplicada.participacao.enviaram === 1 ? 'enviou' : 'enviaram'}`]
+  const partes = [aplicada.estado === 'aberta' ? 'Aberta para a turma' : 'Encerrada', aplicada.avaliativa ? 'avaliativa' : 'prática', `${String(aplicada.participacao.enviaram)} de ${textoDeAlunos(aplicada.participacao.alunos)} enviaram`]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Título cortado a 360 px: se vários títulos de atividade ficarem parecidos, a X-spec da `Linha` avalia duas linhas de título no celular | Comportamento da `Linha` da X1, não desta tarefa; o texto inteiro está no `title` e no painel. Vai para `TODO.md` |
| frontend-reviewer (1ª) | Fotografar o painel dos outros estados (aberta, para revisar, sem correção, "Corrigir de novo") | O Validador fotografa cada requisito com tela; os estados têm prova em componente e e2e |
| conformidade-reviewer (1ª) | Dizer no painel quem aprovou a correção e quando | Pede campo no contrato (`entrega`); a aprovação aparece na tela de revisar (14.0) |
| conformidade-reviewer (1ª) | O selo "Sem correção" usa a família `info`, a mesma de "Aberta" | O texto distingue os dois, e o `frontend-reviewer` aprovou a tela |
| frontend-reviewer (2ª) | "1 de 30 alunos enviaram" também seria lido sem estranheza | Recusada: é gosto, e o texto de hoje concorda com o número que vem antes do verbo |
| conformidade-reviewer (2ª) | Nome de foto errado no prompt da Mesa | Erro da Mesa, não da vitrine; sem mudança em `tools/vitrine/` |
| revisor-geral (2ª) | Quebrar a linha dos itens (10) e (11) em `techspec.md` | Recusada: formatação de documento, sem efeito no que a spec diz |
| revisor-geral (2ª) | Tirar a concordância de `situacaoDaAplicacao` para uma constante | Recusada: legibilidade de uma linha, em código já aprovado pelos quatro |
| test-engineer (2ª) | Um segundo bloco do vazio do filtro, ligado ao caso "vazio" | Recusada: o bloco de hoje fica vermelho pelo motivo certo, provado pelo portão |
| test-engineer (2ª) | Um segundo bloco do foco (`void reserva`), ligado a "Corrigir de novo pede a correção uma vez" | Recusada por ora: vale se o `EncerramentoDaAtividade` passar a cuidar do foco; a tarefa que o mudar acrescenta o bloco |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 13:56:39 | 2026-10-19 13:57:08 | `frontend-reviewer` | 1 | APROVADO | aef73dbaeb7692b44 |
| 2026-10-19 13:56:43 | 2026-10-19 13:57:32 | `conformidade-reviewer` | 1 | APROVADO | a1f5e46f4029a64bc |
| 2026-10-19 13:56:51 | 2026-10-19 13:58:20 | `revisor-geral` | 1 | APROVADO | ab11b293bbe07ac75 |
| 2026-10-19 13:56:47 | 2026-10-19 13:59:05 | `test-engineer` | 1 | REPROVADO | a43800624aeddfa5f |
| 2026-10-19 14:35:44 | 2026-10-19 14:36:02 | `frontend-reviewer` | 2 | APROVADO | abb86d6f487e98065 |
| 2026-10-19 14:35:50 | 2026-10-19 14:36:20 | `conformidade-reviewer` | 2 | APROVADO | a7b43a45d30eb1ef7 |
| 2026-10-19 14:36:08 | 2026-10-19 14:36:31 | `revisor-geral` | 2 | APROVADO | a2aac3cbf261e82af |
| 2026-10-19 14:36:01 | 2026-10-19 14:36:46 | `test-engineer` | 2 | APROVADO | a4efc52c3e436a29e |

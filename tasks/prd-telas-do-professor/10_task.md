# Tarefa 10.0 — A turma aberta em três abas, com Hoje

**Funcionalidade:** telas-do-professor · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`, `tenancy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A turma aberta tem as abas Hoje, Atividades e Alunos no endereço. Hoje reúne o que "Seu time › Tutor" mostrava (atenção
humana, sinais, uso do Tutor) e o acerto por habilidade. O endereço antigo do Tutor leva para lá.

## Contexto necessário

- `techspec.md` seções 5 ("Abas no endereço", "Seu time"), 7, 7b e 9; `prd.md` RF2, RF6, RF15, RF16 e RF21; `mockup.md`
  5 e 5.1 (só a composição; a faixa da aula, "Quem precisa de atenção" e "Gerar revisão" não entram)
- Regras 70 (itens 4 e 7) e 20 (item 14); D34, D36, D69: sinal é fato do trabalho, a atenção humana vai sem conteúdo,
  nada abre conversa de aluno
- Código: `Turma.tsx` (abas em `useState`); `VisaoGeralDaTurma.tsx`; `Tutor.tsx`; `sinais.ts`; `api/tutor-da-turma.ts`
  (leituras nominais com `gcTime: 0`)

## Subtarefas

- [x] 10.1 — `Turma.tsx`: Hoje, Atividades e Alunos em `?aba=` (`replace`; sem valor ou valor desconhecido, Hoje). O
  conteúdo de `VisaoGeralDaTurma.tsx` muda de aba sem mudar: o "Acerto por habilidade" vai a Hoje; "Atividades da
  turma", a `AtividadesDaTurma.tsx`; "Por aluno", com o acesso e os pedidos de hoje, a `AlunosDaTurma.tsx`. Os dois
  arquivos nascem aqui como cascas finas, para a 11.0 e a 12.0 não editarem o `Turma.tsx`. A tela some com a
  `VisaoGeralDaTurma.tsx`. O `h1` "Turma <nome>" e o "Voltar para Turmas" ficam
- [x] 10.2 — `TurmaHoje.tsx`: o aviso de atenção humana no alto, **sem abrir painel e sem nome de aluno**, com a
  contagem, a hora e o que fazer (Hoje é a aba que a professora projeta em sala: D34, D36, art. 14); "Sinais da turma",
  em agregado; "O que o Tutor faz sozinho" e o bloco "Quando o Tutor avisa você"; o "Acerto por habilidade". Hoje lê
  `consultaSinais` ao abrir, com `refetchInterval` de 15 s enquanto a aba está à vista; "não relê por tempo" vale só
  para o sino. O nome só aparece por ação explícita ("Ver quem"), no `PainelLado` em `?ver=tutor`, com os "Sinais por
  aluno" e `consultaUsoDoTutor`, em ordem de nome. Só a leitura de `consultaUsoDoTutor` espera o painel: os "Sinais por aluno" saem da mesma `consultaSinais` que
  Hoje já leu, e o que espera o painel é **mostrar** os nomes (eles ficam em memória, fora da tela); a rota nominal de
  `api/tutor-da-turma.ts` além dos sinais não sai sem `?ver=tutor`. O aviso que chega aos 15 s entra sem piscar,
  sem som e sem mover o foco, com `aria-live="polite"`. "Ver quem" é botão dentro do aviso, e o painel começa pela lista
  de atenção humana. Com o painel fechado, `consultaSinais` não traz linha por aluno à tela
- [x] 10.3 — `Tutor.tsx` vira redirecionamento (`replace`): uma turma confirmada leva a `…/turmas/:id?aba=hoje`; mais
  de uma, a `/professor/turmas`; a fixture `professor/tutor.ts` (`abrirSinaisDoTutor`) aponta para Hoje
- [x] 10.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Turma.tsx`, `Tutor.tsx` | alterado (em `apps/web/src/areas/professor/`) |
| `TurmaHoje.tsx`, `AtividadesDaTurma.tsx`, `AlunosDaTurma.tsx`, `TurmaHoje.test.tsx`, `Turma.test.tsx` | novo (mesma pasta) |
| `apps/web/src/areas/professor/VisaoGeralDaTurma.tsx` | removido |
| `e2e/professor-turma-aberta.spec.ts`, `e2e/professor-tutor.spec.ts`, `e2e/__fixtures__/professor/tutor.ts` | alterado (a 2.5 e a 2.4 os criaram) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| a aba pelo endereço | componente | `?aba=alunos` abre Alunos; sem aba ou `?aba=visao-geral`, Hoje; trocar usa `replace`; `?ver=tutor` fora de Hoje não abre painel |
| estados de Hoje | componente | carregando; erro único com "Tentar de novo"; sem sinal, o vazio que diz o que o Tutor avisa (regra 50, item 6); sem correção aprovada, o vazio tracejado do acerto; com dado |
| atenção humana sem nome nem conteúdo | componente e e2e | Hoje recém-aberta, com sinal de atenção: o aviso está no alto, sem abrir painel, com contagem, hora e o que fazer, e **nenhum nome de aluno no DOM** nem texto de mensagem; o nome só aparece depois de "Ver quem". O aviso some quando não há sinal. Mutação: renderizar o nome no aviso deixa o teste vermelho |
| Hoje relê os sinais | componente | relógio falso: aos 15 s sai nova leitura, e o sinal novo aparece no alto sem recarregar. Mutação: tirar o `refetchInterval` deixa o teste vermelho |
| sem painel, sem rota nominal | componente | sem `?ver=tutor`, só `consultaSinais` é chamada; nenhuma outra rota de `api/tutor-da-turma.ts` (uso por aluno); nenhum nome de aluno no DOM, e nenhuma consulta `CHAVE_DO_USO_DO_TUTOR` no `QueryCache` (os nomes dos sinais ficam em memória, na resposta de `consultaSinais`, e não na tela). Ao fechar o painel, os nomes saem da tela e a consulta de uso sai do cache, por `gcTime: 0`. Com Atividades ou Alunos aberta, ou a aba escondida (`focusManager.setFocused(false)`, restaurado no `afterEach`), nenhuma leitura aos 15 s; mutação: o intervalo sem a condição da aba à vista deixa o teste vermelho. O aviso novo traz `aria-live="polite"` e não move o foco. Mutação: tirar a condição do painel deixa o teste vermelho |
| vocabulário | unidade | o teste de `aprovar.test.ts` é estendido aos textos de Hoje; "Média de acertos" vira "acerto médio" |
| nada abre conversa de aluno | componente e e2e | nenhuma linha, botão ou link do painel leva a conversa; sem tempo parado, ordem por recência nem lista de quem não usou |
| o acerto por habilidade | componente | só de correção aprovada; barra neutra; nenhum aluno em ordem de acerto |
| o endereço antigo do Tutor | e2e | `/professor/time/tutor` com uma turma leva a Hoje; com duas, a Turmas; sem turma confirmada, a Turmas |
| os blocos do Tutor | e2e | atenção, sinais, uso por aluno e funções do Tutor estão em Hoje; os do Assistente, pelo sino |
| isolamento e nome do aluno | e2e | a turma de outra escola e a inexistente respondem "Turma indisponível"; nome de aluno não vai a endereço nem a armazenamento; fechar o painel solta os nomes |
| recomeço | e2e | recarregar mantém aba e painel; a segunda pessoa não vê a turma; vínculo encerrado tira a página. Concorrência não se aplica: só leitura |

## Como testar

- Componente: copie `ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`)
- e2e: `a turma aberta: Visão Geral e Alunos (D69)` e `o Tutor na lateral…` (divididos pela 2.5). Muda o caminho até os
  blocos (aba e painel) e o `h1`; nenhuma asserção de regra
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/TurmaHoje.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-turma-aberta.spec.ts e2e/professor-tutor.spec.ts`
- Telas: `professora`, `/professor/turmas/:id`, `--clicar 'role=button[name=/uso do Tutor/]'`. Mockup:
  `/professor/turmas/2b?aba=hoje&ver=tutor`

## Fora do escopo desta tarefa

A faixa da aula, o assunto para revisar, "Quem precisa de atenção", "Gerar revisão", os ajustes da turma, o menu de
trocar de turma e a aula ao vivo (F6, F8, F10, D64); o sinal do Tutor no sino; Atividades (11.0); Alunos (12.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Os dois títulos de e2e que ainda diziam "Seu time" (`o Tutor na lateral…`, em `professor-tutor.spec.ts`) ficam com títulos novos, por caso: o caso único é partido em casos curtos (atenção sem nome, painel, funções do Tutor, endereço antigo) | A 2.0 não muda título e esta tarefa cita um deles; o caso inteiro mudou de lugar (aba e painel) e de composição, e a lista dos casos de `professor-tutor.spec.ts` não é de nenhuma tarefa de fora (`2_task.md`, "Sem aplicar") | Tech Spec §10 (Testes); `2_task.md` "Sem aplicar" |
| "Média de acertos" de `Aprovar.tsx` não vira "acerto médio" aqui: o texto é da tela de aprovar (14.1), e Hoje não o usa; o teste de vocabulário de `aprovar.test.ts` é estendido aos textos de Hoje | O texto está na tela que a 14.1 reescreve; mexer nela daqui fura o arquivo de outra linha | Tech Spec §7b; tarefa 14.1 |
| Um arquivo a mais, `endereco-da-turma.ts` (e o `endereco-da-turma.test.ts`), e o `Tutor.test.tsx`: a aba e o painel pelo endereço (`abaDoEndereco`, `painelDoTutorPedido`, `enderecoDaAba`, `enderecoComOPainelDoTutor`) moram num lugar só, para o `Turma.tsx`, o `TurmaHoje.tsx` e o `Tutor.tsx` não redigitarem o parâmetro | Os três usam as mesmas regras do endereço; sem o arquivo, cada um repetiria `?aba=` e `?ver=tutor` | Tech Spec §2 (Módulos afetados), que não lista o arquivo; §5 ("Abas no endereço") |
| Trocar de aba leva só `?aba=` ao endereço: o `?ver=tutor` não acompanha a pessoa à aba seguinte, e voltar a Hoje não reabre o painel | O painel é de Hoje; o endereço antigo não pode reabrir um painel com nomes que ela já fechou | Tech Spec §7 (o painel `?ver=tutor`); a spec não diz que o parâmetro fica ou sai na troca de aba |
| Abrir o painel é um passo no histórico (`push`), e fechá-lo é `replace`: o Voltar do navegador fecha o painel | O painel guardado no endereço precisa ser alcançado pelo "Ver quem" e fechado pelo Voltar, sem empilhar passos depois de fechar | Tech Spec §7 (o painel `?ver=tutor`); a spec não diz se abrir é `push` ou `replace` |
| A tela `Turma` sai da fachada `professor-*.js` e vira `lazy(() => import('./Turma'))` (export `default`), num pedaço `tela-professor-Turma-*` com o teto de 30 kB das outras telas; as três abas são pedaços próprios (`tela-professor-TurmaHoje-*`, `-AtividadesDaTurma-*`, `-AlunosDaTurma-*`). `titulo-das-telas.test.tsx` e `Turma.test.tsx` passam a importar o `default`. O `.size-limit.json` não muda: a fachada continua com o teto de 8 kB (medida, 4,3 kB em brotli; a `Turma` mede 2,9 kB, a `TurmaHoje` 4,7 kB, a `AlunosDaTurma` 3,4 kB e a `AtividadesDaTurma` 0,9 kB) | Pedido do Orquestrador no encontro: o Arquiteto decidiu na 9.0 (Tech Spec §7c, Orçamento) que Turmas vira lazy e o teto da fachada não sobe; a tela Turma faz o mesmo | `techspec.md` §7c (Orçamento, no fim da seção); tarefa 9.0 |
| Os casos de e2e da turma aberta e do Tutor são muitos casos curtos, com títulos novos, e "recarregar mantém a aba" mora no caso `a turma abre pelo cartão do vínculo confirmado…` de `acesso-da-turma.spec.ts` (que declarava `test.slow()` no HEAD); o painel pedido no endereço é provado por `irPara` no e2e e por componente (`Turma.test.tsx`) | A entrada da professora custa cerca de 11 s na máquina, e a recarga completa mais 6 s (CPU do perfil): caso novo conta 30 s, e a régua do portão reprova o que passa de 15 s. Um caso com recarga não cabe | `techspec.md` §10 ("Duração do e2e na separação"); `tools/ci/duracao-do-e2e.ts` |
| `Turma` pede o pedaço da aba (`TurmaHoje`, `AtividadesDaTurma` ou `AlunosDaTurma`) assim que monta, num `useEffect`, em paralelo com as leituras da turma e do `/v1/eu`; o pedaço de cada aba continua lazy e próprio. Em e2e, o caso `a aba Alunos continua com o acesso e os pedidos da A1` sai (os pedidos têm o `pedidos.spec.ts`), o vazio tracejado de Hoje fica só em `TurmaHoje.test.tsx`, e a largura a 360 px passa ao caso de Alunos | O caso de e2e que abre a turma no celular levava de 14,7 a 15,1 s, no limite de 15 s do portão: a entrada da professora custa perto de 13 s, e o pedaço da aba só começava a baixar depois das leituras, em fila atrás do pedaço `Turma`. Pedido junto, a abertura da turma cai para 13,3 a 14,5 s, e a rede lenta do Chromebook paga uma ida só. O teste `nenhuma leitura de sinais aos 15 s` passa a esperar o conteúdo da aba nova antes de medir: com o pedaço ainda carregando, o React guarda a aba anterior escondida e montada, e a leitura continua | `techspec.md` §7c (Orçamento) e §9 (Frontend); `10_task.md` 10.1 a 10.4 |
| `entrar` (`e2e/__fixtures__/professor/cena.ts`) ganha `outrasDisciplinas`: mais uma turma confirmada por disciplina da lista, antes da entrada; e `professor-lugares`, `a3-a4-professor`, `roteiro-da-demonstracao` e `acesso-da-turma` mudam só o caminho até os blocos (aba, painel, "Turmas" aceso na lateral, `?aba=alunos` no endereço) | O endereço antigo do Tutor com duas turmas precisa de vínculos já lidos na entrada; os outros specs citavam a tela que não existe mais | Tech Spec §10 (Testes) |

## Mutações

Cada cláusula nova tem a sua: o aviso sem nome, a releitura aos 15 s só com a aba à vista, o painel só com `?ver=tutor`, a região educada, a ordem de nome, a aba pelo endereço (padrão Hoje, `replace`, só `aba`) e o redirecionamento do Tutor.

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › recém-aberta, com sinal de atenção
-            {horaDoAviso !== undefined && <p className="min-w-0 text-sm break-words text-tinta">{textoDaHoraDoAviso(horaDoAviso)}</p>}
+            {horaDoAviso !== undefined && <p className="min-w-0 text-sm break-words text-tinta">{textoDaHoraDoAviso(horaDoAviso)} {atencao[0]?.aluno.nome}</p>}
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › o aviso some quando não há sinal de atenção
-        {alunosQuePrecisam > 0 && (
+        {(
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › relógio falso: aos 15 s sai nova leitura
-  const sinais = useQuery({ ...consultaSinais(turmaId), refetchInterval: INTERVALO_DOS_SINAIS_MS, refetchIntervalInBackground: false })
+  const sinais = useQuery({ ...consultaSinais(turmaId), refetchIntervalInBackground: false })
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › com a janela escondida, nenhuma leitura aos 15 s
-  const sinais = useQuery({ ...consultaSinais(turmaId), refetchInterval: INTERVALO_DOS_SINAIS_MS, refetchIntervalInBackground: false })
+  const sinais = useQuery({ ...consultaSinais(turmaId), refetchInterval: INTERVALO_DOS_SINAIS_MS, refetchIntervalInBackground: true })
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › o aviso novo chega aos 15 s dentro de uma região educada
-      <div aria-live="polite">
+      <div>
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › só a leitura dos sinais é do Tutor
-      {painelAberto && (
+      {(painelAberto || true) && (
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › o painel pelo endereço lê o uso, mostra os nomes em ordem de nome
-                  linhas={porNome(uso.data.alunos, (aluno) => aluno.aluno.nome)}
+                  linhas={uso.data.alunos}
```

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: apps/web/src/areas/professor/Turma.test.tsx › trocar de aba troca o endereço com `replace`
-aoMudar={(id) => navegar(enderecoDaAba(caminho, abaDoId(id)), { replace: true })}
+aoMudar={(id) => navegar(enderecoDaAba(caminho, abaDoId(id)))}
```

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: apps/web/src/areas/professor/Turma.test.tsx › com Atividades ou Alunos aberta, nenhuma leitura de sinais aos 15 s
-            {aba === 'hoje' && <TurmaHoje turmaId={turmaId} />}
+            <TurmaHoje turmaId={turmaId} />
```

```mutacao
arquivo: apps/web/src/areas/professor/endereco-da-turma.ts
teste: apps/web/src/areas/professor/endereco-da-turma.test.ts › cada aba do endereço abre a dela
-  return ABAS_DA_TURMA.find((aba) => aba.id === id)?.id ?? 'hoje'
+  return ABAS_DA_TURMA.find((aba) => aba.id === id)?.id ?? 'alunos'
```

```mutacao
arquivo: apps/web/src/areas/professor/endereco-da-turma.ts
teste: apps/web/src/areas/professor/endereco-da-turma.test.ts › o endereço de uma aba leva só a aba
-  return `${caminho}?aba=${aba}`
+  return `${caminho}?aba=${aba}&ver=tutor`
```

```mutacao
arquivo: apps/web/src/areas/professor/endereco-da-turma.ts
teste: apps/web/src/areas/professor/endereco-da-turma.test.ts › e qualquer outro valor não
-  return new URLSearchParams(busca).get('ver') === 'tutor'
+  return new URLSearchParams(busca).get('ver') !== null
```

```mutacao
arquivo: apps/web/src/areas/professor/Tutor.tsx
teste: apps/web/src/areas/professor/Tutor.test.tsx › mais de uma turma leva a Turmas
-    navegar(unica === undefined ? ROTAS_DO_PROFESSOR.turmas : enderecoDaAba(caminhoDaTurmaDoProfessor(unica), 'hoje'), { replace: true })
+    navegar(enderecoDaAba(caminhoDaTurmaDoProfessor(unica ?? [...turmas][0] ?? ''), 'hoje'), { replace: true })
```

```mutacao
arquivo: apps/web/src/areas/professor/Tutor.tsx
teste: apps/web/src/areas/professor/Tutor.test.tsx › sem turma confirmada leva a Turmas
-  for (const vinculo of vinculos.data?.pages.flatMap((pagina) => pagina.itens) ?? []) if (vinculo.estado === 'confirmado') turmas.add(vinculo.turma.id)
+  for (const vinculo of vinculos.data?.pages.flatMap((pagina) => pagina.itens) ?? []) turmas.add(vinculo.turma.id)
```

```mutacao
arquivo: apps/web/src/areas/professor/Tutor.tsx
teste: apps/web/src/areas/professor/Tutor.test.tsx › uma turma confirmada leva a Hoje dela
-    navegar(unica === undefined ? ROTAS_DO_PROFESSOR.turmas : enderecoDaAba(caminhoDaTurmaDoProfessor(unica), 'hoje'), { replace: true })
+    navegar(unica === undefined ? ROTAS_DO_PROFESSOR.turmas : enderecoDaAba(caminhoDaTurmaDoProfessor(unica), 'hoje'))
```

```mutacao
arquivo: apps/web/src/areas/professor/sinais.ts
teste: apps/web/src/areas/professor/sinais.test.ts › a hora é a do aviso mais recente
-  for (const sinal of atencao) if (maisRecente === undefined || Date.parse(sinal.criadoEm) > Date.parse(maisRecente)) maisRecente = sinal.criadoEm
+  for (const sinal of atencao) if (maisRecente === undefined) maisRecente = sinal.criadoEm
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › o painel lista a atenção humana em ordem de nome
-              {porNome(atencao, (sinal) => sinal.aluno.nome).map((sinal) => (
+              {atencao.map((sinal) => (
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › o painel pelo endereço lê o uso, mostra os nomes em ordem de nome
-              linhas={porNome(trabalho, (sinal) => sinal.aluno.nome)}
+              linhas={trabalho}
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › o nome só aparece depois de "Ver quem"
-  const abrirOPainel = (): void => navegar(enderecoComOPainelDoTutor(caminho, busca, true))
+  const abrirOPainel = (): void => navegar(enderecoComOPainelDoTutor(caminho, busca, true), { replace: true })
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › o painel pelo endereço lê o uso, mostra os nomes em ordem de nome
-  const fecharOPainel = (): void => navegar(enderecoComOPainelDoTutor(caminho, busca, false), { replace: true })
+  const fecharOPainel = (): void => navegar(enderecoComOPainelDoTutor(caminho, busca, false))
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › o painel aberto pelo endereço devolve o foco ao botão do painel ao fechar
-      if (document.activeElement === document.body) botao?.focus()
+      if (document.activeElement === document.body) botao?.blur()
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › o aviso "Ver quem" que sai da tela com o painel aberto
-      if (document.activeElement === document.body) botao?.focus()
+      if (document.activeElement === document.body) botao?.blur()
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › sinal de trabalho só antigo
-        {sinais.data !== undefined && grupos.length === 0 && trabalho.length > 0 && (
+        {sinais.data !== undefined && grupos.length === 0 && trabalho.length > 99 && (
```

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › erro das duas leituras: um erro só
-  const caiuTudo = sinais.isError && sinais.data === undefined && desempenho.isError && dados === undefined
+  const caiuTudo = false
```

```mutacao
arquivo: apps/web/src/areas/professor/Tutor.tsx
teste: apps/web/src/areas/professor/Tutor.test.tsx › com mais vínculos na página seguinte
-  const unica = turmas.size === 1 && !vinculos.hasNextPage ? [...turmas][0] : undefined
+  const unica = turmas.size === 1 ? [...turmas][0] : undefined
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| conformidade-reviewer (1ª), privacy-guardian (1ª), revisor-geral (1ª) | O aviso de atenção humana de Hoje, que se projeta em sala, mostra a hora exata e "precisa de um adulto", e um aviso antigo continua no alto sem limite de data: versão discreta na aba projetada, ou aviso que se recolhe | `TODO.md`, como pergunta ao Arquiteto na próxima revisão da Tech Spec (§7b) e ao Joaquim antes do piloto; é desenho da Tech Spec, e o dado é sintético (D71) |
| frontend-reviewer (1ª) | `TurmaHoje.tsx:75` conta atenção humana só na primeira página de sinais; a API devolveria a contagem de atenção à parte | `TODO.md`: muda contrato da API, fora desta tarefa (`packages/shared`) |
| privacy-guardian (1ª) | Separar o agregado do nominal na API, para o nome não chegar ao navegador antes do "Ver quem" | `TODO.md`: dívida para o F6; a Tech Spec §7 aceita os nomes em memória com `gcTime: 0` |
| frontend-reviewer (1ª), privacy-guardian (1ª) | Piso de agrupamento nos sinais ("1 aluno pediu a resposta pronta…") e na contagem pequena do acerto por habilidade, na aba projetada | `TODO.md`, na decisão dos indicadores e dos limiares, antes do PRD do F6 (`CLAUDE.md`, decisões em aberto) |
| frontend-reviewer (1ª) | O contorno azul de foco em volta do corpo do `PainelLado` fica pesado em 1366 px | Recusada: `PainelLado` não é desta tarefa; é componente da casca (outra linha) |
| frontend-reviewer (1ª) | Asserção `larguraExcedente` a 360 px para Hoje e para o painel | Recusada: a divergência 7 da tarefa já moveu a largura a 360 px para o caso de Alunos pela régua de 15 s do portão; caso novo estouraria |
| conformidade-reviewer (1ª) | Incluir sinal de atenção humana e dois sinais por aluno na escola cheia da vitrine | `TODO.md`: `tools/vitrine/` não é desta tarefa |
| test-engineer (1ª) | Segunda pessoa na mesma aba, em Hoje: nenhum nome da primeira no cache nem na tela | `TODO.md`: caso de e2e com recarga estoura a régua de 15 s (divergência 7); o recomeço de Hoje fica coberto pela leitura que sai do cache por `gcTime: 0` |
| test-engineer (1ª) | "Média de acertos" virar "acerto médio" ficou para a 14.1: confirmar | Já registrado na divergência 2 da tarefa e na 14.1; nada a fazer aqui |
| revisor-geral (1ª) | O efeito de foco de `TurmaHoje.tsx:90-95` roda a limpeza também ao abrir o painel; depender só do fechamento | Recusada: inofensiva hoje, e o caso novo do item 3 prova o comportamento; mexer no efeito refaz a prova do foco |
| test-engineer (2ª) | A asserção nova do e2e da turma de outra escola (nenhum pedido a `/v1/sinais` ou `/v1/tutor/uso` com o id dela) não tem mutação que a prove; é defesa a mais, e a prova da regra 10 continua sendo o "Turma indisponível" | Recusada: é defesa a mais, como o próprio revisor diz; a prova do isolamento é o "Turma indisponível" e a região ausente, que já quebram sem o escopo |
| test-engineer (2ª) | Falta um caso com o mesmo aluno repetido e o painel aberto, afirmando o mesmo número no aviso e no painel (`alunosQuePrecisam` passou a ser prop) | `TODO.md`, ou a 12.0/13.0, que tocam `TurmaHoje.test.tsx` |
| tenancy-guardian (2ª) | Estender a asserção do e2e aos pedidos de desempenho da aba Hoje (`/desempenho`), e não só aos do Tutor | `TODO.md`: o `/desempenho` da turma é simulado no fixture (`assistente.ts`), e a asserção vale só para a leitura real |
| frontend-reviewer (2ª), conformidade-reviewer (2ª) | A vitrine não tem sinal de atenção humana, sinais por aluno nem sinal de trabalho antigo: o aviso, a ordem de nome, a linha nominal e o texto novo nunca foram vistos em foto | `TODO.md`: `tools/vitrine/` não é desta tarefa (já está na ordem da rodada 1) |
| frontend-reviewer (2ª) | "Nenhum aluno acertou menos da metade das questões desta habilidade nas atividades aprovadas." se repete sob cada habilidade: uma nota ao fim da seção, ou só quando houver exceção | `TODO.md`: o texto do acerto por habilidade veio da Visão Geral sem mudar (a tarefa move o bloco de aba, não o reescreve); mexer nele muda texto de tela fora do que a tarefa pediu |
| frontend-reviewer (2ª) | Em `vazia-alunos-*` falta a seção "Por aluno" vazia, com uma frase que feche o quarto estado da aba | A 12.0 (Turma › Alunos) preenche a aba; é dela |
| frontend-reviewer (2ª) | O contorno azul de foco em volta do corpo do `PainelLado` é pesado em 1366 px | Recusada: `PainelLado` é componente da casca, de outra linha (já recusada na rodada 1) |
| frontend-reviewer (2ª), privacy-guardian (2ª) | A hora exata e o aviso de atenção humana sem limite de data, no alto da aba que se projeta em sala | `TODO.md`, como pergunta ao Arquiteto na próxima revisão da Tech Spec (§7b) e ao Joaquim antes do piloto (já na ordem da rodada 1) |
| privacy-guardian (2ª) | A atenção humana é contada só na primeira página de sinais, e o nome chega ao navegador antes do "Ver quem": conferir no `/validar` que as duas dívidas entraram no `TODO.md` | `TODO.md`, e o Validador confere; são as linhas da rodada 1 |
| revisor-geral (2ª) | Seis linhas de "Recomendações sem aplicar" dão `TODO.md` como destino e o arquivo não foi alterado; confirmar que o fechamento da spec as copia | Orquestrador, no fechamento: as linhas estão em "Recomendações sem aplicar" do documento; o `TODO.md` só é escrito quando a spec fecha (`validar`) |
| revisor-geral (2ª) | Em `vazia-painel-celular.png`, abaixo do painel aparece a página sem a camada por cima | Recusada: efeito da foto de página inteira (o `frontend-reviewer` leu as mesmas fotos e não apontou defeito) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 03:49:15 | 2026-10-19 03:50:30 | `conformidade-reviewer` | 1 | APROVADO | ad9a89831b3f672f0 |
| 2026-10-19 03:49:28 | 2026-10-19 03:50:30 | `tenancy-guardian` | 1 | APROVADO | af1b07cbf342ca777 |
| 2026-10-19 03:49:08 | 2026-10-19 03:50:41 | `frontend-reviewer` | 1 | APROVADO | a1e6f8755a7ccb60a |
| 2026-10-19 03:49:21 | 2026-10-19 03:51:15 | `privacy-guardian` | 1 | APROVADO | a601709bad92a5cd3 |
| 2026-10-19 03:49:34 | 2026-10-19 03:52:20 | `test-engineer` | 1 | REPROVADO | a2eec3254c7fc767d |
| 2026-10-19 03:49:41 | 2026-10-19 03:53:32 | `revisor-geral` | 1 | REPROVADO | a05d9437815ebe3ef |
| 2026-10-19 04:19:09 | 2026-10-19 04:20:08 | `test-engineer` | 2 | APROVADO | a35ed0c3ff296caf2 |
| 2026-10-19 04:19:41 | 2026-10-19 04:20:16 | `conformidade-reviewer` | 2 | APROVADO | a9ccf1e3b8f23eca0 |
| 2026-10-19 04:19:31 | 2026-10-19 04:20:17 | `frontend-reviewer` | 2 | APROVADO | a3567bbd58b7574a4 |
| 2026-10-19 04:19:50 | 2026-10-19 04:20:27 | `privacy-guardian` | 2 | APROVADO | a25bc090ca64ff1f0 |
| 2026-10-19 04:19:21 | 2026-10-19 04:20:30 | `revisor-geral` | 2 | APROVADO | a52ffb125edf73429 |
| 2026-10-19 04:20:00 | 2026-10-19 04:20:31 | `tenancy-guardian` | 2 | APROVADO | a7b8bf68b4ce9656a |

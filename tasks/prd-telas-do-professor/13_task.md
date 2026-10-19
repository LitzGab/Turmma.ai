# Tarefa 13.0 — "Convidar alunos" num diálogo

**Funcionalidade:** telas-do-professor · **Depende de:** 9.0, 12.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O acesso dos alunos à turma (gerar, gerar novo, revogar) passa a viver num diálogo "Convidar alunos", aberto pela aba Alunos
ou por `?convidar=1`, e oferecido logo depois de confirmar a turma. O link e o código aparecem uma vez, como hoje.

## Contexto necessário

- `techspec.md` seções 7 e 9 ("Os títulos de cada passo não mudam"), 13 (o risco dos nove casos); `prd.md` RF19 e a
  seção 7 (sessão vencida com o convite aberto); `mockup.md` 6
- Regra 20, itens 7 e 8: convite é token único, com expiração, uso único e revogação. O mockup mostra o link e o código
  sempre que o convite abre; **aqui não**: a leitura não os devolve, e o produto só os mostra no passo que os gerou
- Código: `AcessoDaTurma.tsx` (`GerarAcesso`, `AcessoGerado`, o diálogo de revogar, linhas 179 a 300);
  `acesso-da-turma.ts`; `texto-do-whatsapp.ts`; `componentes/DialogoDoConvite.tsx`; `link-do-convite.ts`

## Subtarefas

- [x] 13.1 — `ConvidarAlunos.tsx`: um `Dialogo` de 560 px com passos que trocam o conteúdo, sem diálogo dentro de diálogo:
  sem acesso, a validade (1, 7 ou 30 dias, 7 de início) e "Gerar acesso"; depois de gerar, "Acesso gerado" com o link,
  o código em dois grupos ("Código da turma"), copiar, projetar e o WhatsApp de hoje; com acesso vigente, só "até
  quando vale", "Gerar novo acesso" e "Revogar o acesso", cada um com a pergunta de hoje. Os títulos de cada passo e o
  envio único não mudam. O passo "Acesso gerado" é **tela inteira** (largura e altura da janela, fundo `fundo` por classe de token, nenhuma cor nova no `::backdrop`), porque é projetado. A seção "Acesso dos alunos" fica na aba como resumo e leva o botão "Convidar alunos"
- [x] 13.2 — `?convidar=1` abre o diálogo na aba Alunos e fechar tira o parâmetro (`replace`). Depois de "Confirmar" em
  Turmas, o `Aviso` "Turma 7ºA confirmada" leva "Gerar o acesso" a `…/turmas/:id?aba=alunos&convidar=1`. O endereço
  nunca leva token, link nem código
- [x] 13.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/ConvidarAlunos.tsx`, `ConvidarAlunos.test.tsx` | novo |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx`, `AlunosDaTurma.tsx`, `Turmas.tsx` | alterado (em `apps/web/src/areas/professor/`; a 9.0 e a 12.0 já passaram) |
| `apps/web/src/areas/professor/acesso-da-turma.test.ts` | alterado |
| `apps/web/src/componentes/Dialogo.tsx` | alterado (a variante `inteira`; "Gerar" e "Acesso vigente" continuam em 560 px, e a troca de largura não anima) |
| `e2e/acesso-da-turma.spec.ts` | alterado (os nove casos) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| os nove casos, pelo diálogo | e2e | `W4`, `W7`, `W12`, `clique duplo` e os cinco de `recomeço da tela do acesso`, em `acesso-da-turma.spec.ts`: mudam só o clique que abre o diálogo e o passo em que se está; o título de cada passo, o foco e o envio único ficam |
| o link e o código uma vez | componente e e2e | depois de fechar o passo "Acesso gerado", abrir de novo mostra só a validade; a leitura do acesso não devolve link nem código |
| fechar sem copiar | componente | fechar o passo "Acesso gerado" sem ter copiado pergunta antes (caso de hoje) |
| estados | componente | carregando; erro com "Tentar de novo"; "Sem acesso ativo" com o gerar; com acesso vigente; gerando |
| o endereço | componente e e2e | `?convidar=1` abre; fechar tira o parâmetro; o endereço nunca tem token nem código; vínculo pendente ou de outra turma não abre o diálogo |
| depois de confirmar | e2e | "Turma 7ºA confirmada" com "Gerar o acesso" leva à aba Alunos com o diálogo aberto; o aviso some ao sair |
| concorrência | e2e | dois cliques em "Gerar acesso" mandam um pedido só; o `CONFLITO` recarrega a seção e deixa só "Fechar" |
| nada legível atrás de "Acesso gerado" | e2e | com a turma com alunos e acertos, enquanto o passo "Acesso gerado" está aberto: o passo é tela inteira. A caixa do `<dialog>` cobre a janela inteira, e o fundo calculado do `<dialog>` (o elemento que leva a classe `bg-fundo`) é a cor do token `fundo`, com alfa 1, no claro e no escuro: no escuro ela difere do `Canvas` que o navegador dá ao diálogo, e por isso o teste não passa sem a classe (não `toBeVisible`). Mutações, cada uma vermelha sozinha: tirar a classe de tela inteira; e, com a tela inteira mantida, trocar `bg-fundo` por fundo transparente. O passo "Gerar" tem 560 px de largura: aplicar `inteira` em todos os passos deixa o teste vermelho |
| recomeço | e2e | a sessão vence com o convite aberto: o diálogo sai com o link e o código, e a volta mostra só a validade; a segunda pessoa e outra turma não herdam o diálogo. Log: nenhum token em log nem em URL |
| 360 px e teclado | e2e | sem rolar de lado, também com o código grande; foco preso e devolvido ao botão "Convidar alunos" |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`, `segurar`)
- e2e: os nove casos já existem. Uma função `abrirOConvite(page)` concentra o clique novo; nenhum caso é apagado,
  pulado ou enfraquecido, e a contagem de `test(` fica igual
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/ConvidarAlunos.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/acesso-da-turma.spec.ts`
- Telas: `professora`, `/professor/turmas/:id?aba=alunos&convidar=1`, `--clicar 'role=button[name="Convidar alunos"]'`.
  Mockup: `/professor/turmas/3a?aba=alunos&convidar=1`

## Fora do escopo desta tarefa

Mostrar o link e o código a cada abertura, o convite na tela da turma vazia, trocar a validade por segmentado com
confirmação, o botão verde do WhatsApp (o de hoje fica) e a tela cheia "Projetar" nova; a lista de alunos (12.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A caixa do diálogo é a de 520 px de sempre (`CAIXA_DE_520`), e não 560 px | 560 px é a largura do mockup; o `Dialogo` do produto tem 520 px em todas as áreas, e o passo "Gerar" e o "Vigente" ficam nela. O que importa para o teste é que sejam mais estreitos que a janela, e o teste prova isso | `techspec.md` §9, "O convite na pele nova", item 1 |
| O botão "Convidar alunos" não escreve `?convidar=1` no endereço; só o endereço pedido pelo aviso ou colado o leva, e fechar o tira. O pedido vale na montagem da aba (`useDialogoDaTela(abertaNaMontagem)`), sem efeito | Escrever o parâmetro a cada abertura criaria passo de histórico sem ganho; o efeito com trava e rearme não tinha como ser provado | `techspec.md` §9, item 2 |
| Arquivos fora dos previstos: `componentes/dialogos.tsx` (`CorpoDaConfirmacaoDePerigo`, para o passo "Revogar o acesso" viver dentro do diálogo aberto), `componentes/copia-unica.tsx` (`useFocoDaEtapa` ganha `daPrimeira`), `componentes/dialogo-aberto.ts` (o parâmetro `abertaNaMontagem`, com teste em `dialogo-aberto.test.ts`) e `componentes/dialogo-modal.ts` (o `body` com o foco vale como ninguém ter aberto: o foco vai para o `focoDeReserva`, quando o diálogo passa um; nenhum efeito para quem abre por botão ou link) | A regra "sem diálogo dentro de diálogo", o foco do passo em que se abre e o diálogo que abre pelo endereço, sem controle focado, exigem as quatro peças | `techspec.md` §9, item 3 |
| Arquivos de teste fora dos previstos: `AlunosDaTurma.test.tsx`, `Turmas.test.tsx`, `dialogo-aberto.test.ts`, `e2e/escola-montada.spec.ts` e `e2e/roteiro-da-demonstracao.spec.ts` (o clique que abria o gerar na seção passa a abrir o diálogo), e `e2e/convidar-alunos.spec.ts` (novo: o endereço, o aviso depois de confirmar e a janela inteira) | `acesso-da-turma.spec.ts` não podia ganhar caso (a contagem de `test(` fica igual) e os dois fluxos longos citavam o botão que saiu da seção | `techspec.md` §9, item 5 |
| O "toque fora" que fechava o passo "Acesso gerado" passa a ser provado no passo "Gerar novo acesso" | Na janela inteira não há "fora": o toque no canto cai dentro da caixa e não faz nada, o que o caso confere | `techspec.md` §9, item 4; `cenarios.md` W7 (atualizado) |
| Dois casos de W4 (`com dado` e `carregando`) semeiam o acesso no banco e abrem direto na aba Alunos, e perdem o axe do passo, que o W12 faz no mesmo passo | O portão mede 15 s; o link e o código uma vez só (e que não voltam) seguem provados no W7 (`semRastro`), no W12 e em `ConvidarAlunos.test.tsx`, que é onde eles existem | `techspec.md` §9, item 5 |
| Sessão vencida com o diálogo aberto pelo endereço: o `convidar=1` fica no endereço, e a turma que monta de novo depois do login abre o diálogo no passo que a leitura pede, sem link nem código | Ninguém fechou o diálogo, e o login por cima não mexe no endereço; é aceitável | `techspec.md` §9, item 6 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

Sem acesso lido, o diálogo abre em "Gerar acesso"; com acesso, em "Vigente".

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › com acesso vigente: só até quando vale
   if (lido === undefined) return undefined
-  return lido.expiraEm === null ? { tipo: 'gerar', substitui: false } : { tipo: 'vigente' }
+  return { tipo: 'gerar', substitui: false }
```

A leitura que chega depois de o diálogo abrir escolhe o passo.

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › carregando: o diálogo abre dizendo que lê o acesso
-  if (passo === undefined && acesso.data !== undefined) definirPasso(passoDoAcesso(acesso.data))
   // O acesso que outra pessoa revogou
```

O acesso que outra pessoa revogou com o passo "Vigente" na tela vira "Gerar acesso".

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › o acesso que outra pessoa revogou
-  if (passo?.tipo === 'vigente' && acesso.data?.expiraEm === null) definirPasso({ tipo: 'gerar', substitui: false })
```

O foco do passo em que o diálogo abre é do passo (o texto), e não do primeiro botão.

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › com a leitura já na memória
-  useFocoDaEtapa(etapa, alvos[etapa], gerar.isError, true)
+  useFocoDaEtapa(etapa, alvos[etapa], gerar.isError)
```

`daPrimeira` liga o foco da primeira etapa.

```mutacao
arquivo: apps/web/src/componentes/copia-unica.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › com a leitura já na memória
-  const primeira = useRef(!daPrimeira)
+  const primeira = useRef(true)
```

O passo "Gerar novo acesso" tem o texto do que cai e o título do passo.

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › "Gerar novo acesso" leva ao passo que diz o que cai
-  const substitui = passo?.tipo === 'gerar' && passo.substitui
+  const substitui = false
```

O título do passo "Gerar" é o rótulo da ação, e o do "Vigente" é "Convidar alunos".

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › "Gerar novo acesso" leva ao passo que diz o que cai
-  const titulo = etapa === 'revogar' ? 'Revogar o acesso' : passo?.tipo === 'gerar' ? rotuloDaAcao : 'Convidar alunos'
+  const titulo = etapa === 'revogar' ? 'Revogar o acesso' : 'Convidar alunos'
```

O título do passo "Revogar" é "Revogar o acesso".

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › "Revogar o acesso" leva ao passo que diz o que acontece
-  const titulo = etapa === 'revogar' ? 'Revogar o acesso' : passo?.tipo === 'gerar' ? rotuloDaAcao : 'Convidar alunos'
+  const titulo = passo?.tipo === 'gerar' ? rotuloDaAcao : 'Convidar alunos'
```

O passo "Acesso gerado" é a janela inteira.

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › gerar leva ao passo "Acesso gerado"
-  const inteira = etapa === 'acesso' || (etapa === 'pergunta' && gerar.isSuccess)
+  const inteira = etapa === 'pergunta' && gerar.isSuccess
```

A pergunta de fechar que sai do "Acesso gerado" fica na janela inteira.

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › fechar sem ter copiado pergunta antes
-  const inteira = etapa === 'acesso' || (etapa === 'pergunta' && gerar.isSuccess)
+  const inteira = etapa === 'acesso'
```

A pergunta de um pedido ainda no ar fica na caixa de sempre: não há acesso para esconder.

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › gerando: o botão diz
-  const inteira = etapa === 'acesso' || (etapa === 'pergunta' && gerar.isSuccess)
+  const inteira = etapa === 'acesso' || etapa === 'pergunta'
```

O `Dialogo` recebe `inteira`.

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › gerar leva ao passo "Acesso gerado"
-      inteira={inteira}
     >
```

O `Dialogo` troca de caixa pela prop.

```mutacao
arquivo: apps/web/src/componentes/Dialogo.tsx
teste: apps/web/src/areas/professor/ConvidarAlunos.test.tsx › gerar leva ao passo "Acesso gerado"
-      className={inteira ? CAIXA_INTEIRA : CAIXA_DE_520}
+      className={CAIXA_DE_520}
```

A janela inteira tem a largura e a altura da janela, e não só a classe de fundo.

```mutacao
arquivo: apps/web/src/componentes/Dialogo.tsx
teste: e2e/convidar-alunos.spec.ts › cobre a janela
-const CAIXA_INTEIRA = 'm-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-fundo p-5 text-tinta sm:p-8'
+const CAIXA_INTEIRA = 'overflow-y-auto bg-fundo p-5 text-tinta sm:p-8'
```

Com a janela inteira mantida, o fundo é o do token, e não transparente.

```mutacao
arquivo: apps/web/src/componentes/Dialogo.tsx
teste: e2e/convidar-alunos.spec.ts › cobre a janela
-const CAIXA_INTEIRA = 'm-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-fundo p-5 text-tinta sm:p-8'
+const CAIXA_INTEIRA = 'm-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-transparent p-5 text-tinta sm:p-8'
```

Aplicar a janela inteira a todos os passos deixa o "Gerar" do tamanho da janela.

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: e2e/convidar-alunos.spec.ts › cobre a janela
-  const inteira = etapa === 'acesso' || (etapa === 'pergunta' && gerar.isSuccess)
+  const inteira = true
```

O toque fora fecha os passos que estão na caixa de sempre.

```mutacao
arquivo: apps/web/src/areas/professor/ConvidarAlunos.tsx
teste: e2e/acesso-da-turma.spec.ts › o código em dois grupos, grande
       aoFecharPeloNavegador={fechamento.fecharDeVez}
-      fecharAoClicarFora
       focoDeReserva={focoDeReserva}
```

O botão "Convidar alunos" só existe com a leitura boa.

```mutacao
arquivo: apps/web/src/areas/professor/AcessoDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › a leitura do acesso em erro tira o botão
-        {acesso.isSuccess && <Botao ref={botaoConvidar} onClick={abrir}>Convidar alunos</Botao>}
+        <Botao ref={botaoConvidar} onClick={abrir}>Convidar alunos</Botao>
```

Abrir o diálogo apaga o anúncio da ação anterior.

```mutacao
arquivo: apps/web/src/areas/professor/AcessoDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › revogar pelo diálogo pedido pelo endereço
-    definirAnuncio('')
     abrirDialogo('convidar')
```

O endereço com `convidar=1` abre o diálogo.

```mutacao
arquivo: apps/web/src/areas/professor/AcessoDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › `?convidar=1` abre o diálogo sozinho
-  const { aberta, abrir: abrirDialogo, fechar: fecharDialogo, fecharSeAinda } = useDialogoDaTela<'convidar'>(convidarPeloEndereco ? 'convidar' : undefined)
+  const { aberta, abrir: abrirDialogo, fechar: fecharDialogo, fecharSeAinda } = useDialogoDaTela<'convidar'>()
```

Sem pedido no endereço, o hook não abre nada na montagem.

```mutacao
arquivo: apps/web/src/componentes/dialogo-aberto.ts
teste: apps/web/src/componentes/dialogo-aberto.test.ts › sem pedido, nada abre
-  const [aberta, definirAberta] = useState<AberturaDeDialogo<Tipo, Alvo> | undefined>(() => (abertaNaMontagem === undefined ? undefined : proximaAbertura<Tipo, Alvo>(abertaNaMontagem, 0)))
+  const [aberta, definirAberta] = useState<AberturaDeDialogo<Tipo, Alvo> | undefined>(() => proximaAbertura<Tipo, Alvo>(abertaNaMontagem ?? ('x' as Tipo), 0))
```

A abertura seguinte conta a partir da de montagem.

```mutacao
arquivo: apps/web/src/componentes/dialogo-aberto.ts
teste: apps/web/src/componentes/dialogo-aberto.test.ts › a abertura seguinte conta a partir da de montagem
-  const ultimoNumero = useRef(aberta?.numero ?? 0)
+  const ultimoNumero = useRef(0)
```

A confirmação que falha não mostra o aviso.

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › a confirmação que falha não mostra o aviso
-    mutationFn: (vinculo: Vinculo) => confirmarVinculo(vinculo.id),
+    mutationFn: (vinculo: Vinculo) => { definirConfirmada(vinculo.turma); return confirmarVinculo(vinculo.id) },
```

Fechar o diálogo avisa quem lê o endereço.

```mutacao
arquivo: apps/web/src/areas/professor/AcessoDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › `?convidar=1` abre o diálogo sozinho
     fecharDialogo()
-    aoFecharOConvite?.()
```

Revogar fecha só a abertura em que o pedido saiu.

```mutacao
arquivo: apps/web/src/areas/professor/AcessoDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › revogar pelo diálogo pedido pelo endereço
-            fecharSeAinda(aberta)
             aoFecharOConvite?.()
```

Revogar tira o pedido do endereço.

```mutacao
arquivo: apps/web/src/areas/professor/AcessoDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › revogar pelo diálogo pedido pelo endereço
             fecharSeAinda(aberta)
-            aoFecharOConvite?.()
```

Revogar anuncia na seção.

```mutacao
arquivo: apps/web/src/areas/professor/AcessoDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › revogar pelo diálogo pedido pelo endereço
-            definirAnuncio('Acesso revogado. O link e o código não valem mais.')
```

Quando o botão que abriu o diálogo saiu da seção, o foco vai para o título dela.

```mutacao
arquivo: apps/web/src/areas/professor/AcessoDaTurma.tsx
teste: e2e/acesso-da-turma.spec.ts › falha com o diálogo aberto
-          focoDeReserva={focarNaSecao}
+          focoDeReserva={() => undefined}
```

A aba só passa o pedido do endereço quando o parâmetro é `convidar=1`.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › `?convidar=1` abre o diálogo sozinho
-        convidarPeloEndereco={convitePedido(busca)}
+        convidarPeloEndereco={false}
```

Fechar o diálogo pedido pelo endereço troca o endereço (`replace`), sem passo no histórico.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › `?convidar=1` abre o diálogo sozinho
-          if (convitePedido(busca)) navegar(enderecoSemOConvite(caminho, busca), { replace: true })
+          if (convitePedido(busca)) navegar(enderecoSemOConvite(caminho, busca))
```

Fechar o diálogo que o botão abriu não troca o endereço.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › o botão abre o diálogo sem mexer no endereço
-          if (convitePedido(busca)) navegar(enderecoSemOConvite(caminho, busca), { replace: true })
+          navegar(enderecoSemOConvite(caminho, busca), { replace: true })
```

Só o valor `1` pede o diálogo.

```mutacao
arquivo: apps/web/src/areas/professor/acesso-da-turma.ts
teste: apps/web/src/areas/professor/acesso-da-turma.test.ts › só `convidar=1` pede o diálogo
-  return new URLSearchParams(busca).get(PARAMETRO_DO_CONVITE) === '1'
+  return new URLSearchParams(busca).get(PARAMETRO_DO_CONVITE) !== null
```

O endereço de "Gerar o acesso" leva a aba e o pedido.

```mutacao
arquivo: apps/web/src/areas/professor/acesso-da-turma.ts
teste: apps/web/src/areas/professor/acesso-da-turma.test.ts › "Gerar o acesso" leva à aba Alunos
-  return `${enderecoDaAba(caminhoDaTurma, 'alunos')}&${PARAMETRO_DO_CONVITE}=1`
+  return enderecoDaAba(caminhoDaTurma, 'alunos')
```

Fechar tira o pedido e deixa o resto da busca.

```mutacao
arquivo: apps/web/src/areas/professor/acesso-da-turma.ts
teste: apps/web/src/areas/professor/acesso-da-turma.test.ts › fechar tira só o pedido do endereço
-  parametros.delete(PARAMETRO_DO_CONVITE)
   const restante = parametros.toString()
```

Sem outra busca, o caminho vai sozinho, sem `?`.

```mutacao
arquivo: apps/web/src/areas/professor/acesso-da-turma.ts
teste: apps/web/src/areas/professor/acesso-da-turma.test.ts › fechar tira só o pedido do endereço
-  return restante === '' ? caminho : `${caminho}?${restante}`
+  return `${caminho}?${restante}`
```

Confirmar a turma guarda a turma confirmada para oferecer o acesso.

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › o aviso "Turma 2º B confirmada"
-      definirConfirmada(vinculo.turma)
       definirPedidoDeFoco((n) => n + 1)
```

"Gerar o acesso" leva à aba Alunos com o pedido do diálogo.

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › o aviso "Turma 2º B confirmada"
-                <Link to={enderecoDoConvite(caminhoDaTurmaDoProfessor(confirmada.id))} className={CLASSES_DO_LINK_SECUNDARIO}>
+                <Link to={caminhoDaTurmaDoProfessor(confirmada.id)} className={CLASSES_DO_LINK_SECUNDARIO}>
```

O aviso diz a turma confirmada.

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/Turmas.test.tsx › o aviso "Turma 2º B confirmada"
-              titulo={`Turma ${confirmada.nome} confirmada`}
+              titulo="Turma confirmada"
```

O título do diálogo e o conteúdo da janela inteira moram na mesma coluna centralizada.

```mutacao
arquivo: apps/web/src/componentes/Dialogo.tsx
teste: e2e/convidar-alunos.spec.ts › cobre a janela
-const COLUNA_DA_INTEIRA = 'mx-auto w-full max-w-3xl'
+const COLUNA_DA_INTEIRA = 'w-full'
```

O diálogo que abre sem ninguém com o foco (o endereço o pediu) devolve o foco à reserva ao fechar.

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: e2e/convidar-alunos.spec.ts › abre o diálogo na aba Alunos
-      quemAbriu = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : undefined
+      quemAbriu = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
```

A reserva do foco é o botão "Convidar alunos" quando ele está na seção, e só então o título.

```mutacao
arquivo: apps/web/src/areas/professor/AcessoDaTurma.tsx
teste: e2e/convidar-alunos.spec.ts › abre o diálogo na aba Alunos
-  const focarNaSecao = useCallback(() => (botaoConvidar.current ?? titulo.current)?.focus(), [titulo])
+  const focarNaSecao = useCallback(() => titulo.current?.focus(), [titulo])
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Título "Gerar acesso" acima do subtítulo "Acesso gerado" repete a ideia (`ConvidarAlunos.tsx`) | A Tech Spec §9 fixa os títulos de cada passo; revisitar quando o mockup 6 for refeito. `TODO.md` |
| frontend-reviewer (1ª) | Em 1366 × 768, na tela inteira, o bloco fica colado ao topo; centralizar na vertical | Gosto, não bloqueia; muda o layout do passo projetado. `TODO.md`, junto com o mockup 6 |
| frontend-reviewer (1ª) | `TEXTO_DE_QUEM_VE_A_LISTA` é longo no celular | Muda texto de tela, que a Mesa não dita. `TODO.md` |
| privacy-guardian (1ª) | O passo "Gerar acesso" fica na caixa de 520 px com a lista de nomes e acertos legível atrás; levar ao `/retro` abrir o convite com a lista recolhida ou a etapa toda na janela inteira | O problema não é novo (a aba já mostra a lista sem o diálogo) e muda comportamento. Destino: `/retro` da spec |
| revisor-geral (1ª) | Passo "Gerar novo acesso" não volta a "Gerar acesso" quando outra pessoa revoga (`ConvidarAlunos.tsx`: só o "Vigente" volta) | Muda comportamento e exige teste novo. `TODO.md` |
| revisor-geral (1ª) | "Cancelar" no passo "Revogar o acesso" fecha o diálogo inteiro, e não volta ao "Vigente" | Recusada nesta tarefa: é o que o diálogo de revogar fazia, e o `frontend-reviewer` aprovou o passo. Muda comportamento |
| frontend-reviewer (2ª) | A linha "Vale até …" do passo "Vigente" sai com a moldura azul de foco e parece um campo de entrada; suavizar o anel ou tirar o foco programático do título quando o passo não tem controle (`ConvidarAlunos.tsx`, `useFocoDaEtapa` em `copia-unica.tsx`) | Gosto, a acessibilidade está correta; mexer no foco muda o contrato de teclado já provado. `TODO.md` |
| privacy-guardian (2ª) | No W4 (`e2e/acesso-da-turma.spec.ts`), um comentário apontando o caso exato que prova "link e código uma vez" | A linha já diz onde está a prova (W7 `semRastro`, W12, `ConvidarAlunos.test.tsx`); o comentário atual basta. Recusada |
| privacy-guardian (2ª) | Teste em `convidar-alunos.spec.ts` de que abrir pelo endereço uma turma disponível da própria escola também não dispara POST | O código já garante (gerar depende de clique); teste novo. `/retro` da spec |
| revisor-geral (2ª) | Comentários que ainda dizem "abre sozinho, uma vez por pedido" e "ele abre uma vez" (`AcessoDaTurma.tsx:17`, `AlunosDaTurma.tsx:31-32`); o comportamento é "abre na montagem da aba enquanto o endereço pedir" | Só texto de comentário, sem efeito no comportamento. `TODO.md` |
| revisor-geral (2ª) | `techspec.md` §9, item 5: completar a lista de testes fora dos previstos com `AlunosDaTurma.test.tsx`, `Turmas.test.tsx` e `dialogo-aberto.test.ts` | Só texto de documento; a tabela da tarefa já os lista. `TODO.md` |
| revisor-geral (2ª) | `13_task.md:84`: "itens 2" deve ser "item 2" | Só texto de documento. `TODO.md` |
| test-engineer (2ª) | `e2e/convidar-alunos.spec.ts:200-210`: `expect(gravacoes).toEqual([])` passa por construção (o POST só sai com clique); contar qualquer pedido a `/v1/turmas/<id>/acesso`, ou tirar a asserção e o "nem pede o acesso" do título | Muda o caso de e2e já provado pelo portão; o título não mente sobre o que o servidor barra. `TODO.md` |
| test-engineer (2ª) | O caso da turma inexistente saiu do mesmo arquivo; manter os três casos (regra 10, item 6) | Não bloqueia: o caso de outra escola, com turma real, é o que a regra 10 pede. `TODO.md` |
| test-engineer (2ª) | A ternária `convidarPeloEndereco ? 'convidar' : undefined` (`AcessoDaTurma.tsx:46`) tem mutação só para o lado verdadeiro; o falso é provado pelo caso `convidar=0` (`AlunosDaTurma.test.tsx:560`) | O lado falso já falha sem a cláusula pelo caso `convidar=0`. Recusada |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 15:06:06 | 2026-10-19 15:06:58 | `frontend-reviewer` | 1 | APROVADO | a2e983e506a4c0c23 |
| 2026-10-19 15:06:09 | 2026-10-19 15:07:19 | `privacy-guardian` | 1 | APROVADO | a15d7ee971960bd4c |
| 2026-10-19 15:06:14 | 2026-10-19 15:08:16 | `revisor-geral` | 1 | REPROVADO | a1a2dfa8739d73f48 |
| 2026-10-19 15:06:12 | 2026-10-19 15:09:49 | `test-engineer` | 1 | REPROVADO | a23351acd3b6d8b09 |
| 2026-10-19 15:44:29 | 2026-10-19 15:44:54 | `frontend-reviewer` | 2 | APROVADO | a906504af96b15fc4 |
| 2026-10-19 15:44:33 | 2026-10-19 15:45:01 | `privacy-guardian` | 2 | APROVADO | ad817f66d2d27fc1a |
| 2026-10-19 15:44:48 | 2026-10-19 15:45:34 | `revisor-geral` | 2 | APROVADO | a3644dd25c92b7ced |
| 2026-10-19 15:44:41 | 2026-10-19 15:46:18 | `test-engineer` | 2 | APROVADO | a1e9d1670b1048feb |

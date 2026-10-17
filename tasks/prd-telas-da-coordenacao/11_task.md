# Tarefa 11.0 — "Como cada IA trabalha", uma IA por vez

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A tela dos agentes vira a página "Como cada IA trabalha", dentro de Registros: a coordenação escolhe uma das três IAs e lê o que ela faz sozinha, o que espera aprovação e o que nunca faz, e suspende ou retoma uma função.

## Contexto necessário

- `techspec.md` seções 5 (`?ia=`), 7b e 9; `prd.md` RF19, RF22 e seção 10 (por que é página, e não painel)
- `mockup.md` seção 5.2: o seletor "Qual IA" e os três blocos. A AIA recolhível e "Pausar o agente inteiro" **não entram**; o selo "Alto risco" e a autonomia de cada função **ficam** (11.3)
- `.claude/rules/70-conformidade-cne.md` itens 4a, 5 e 6a; `docs/decisoes.md` D9 e D60
- Código: `apps/web/src/areas/coordenacao/Agentes.tsx` e `nunca-faz.ts`; `apps/web/src/api/governanca.ts` (`suspenderFuncao`, `retomarFuncao`, `aplicarFuncao`)

## Subtarefas

- [x] 11.1 — `Tela` `leitura`, com "‹ Registros" e o `h1` "Como cada IA trabalha"; o lugar Registros continua aceso
- [x] 11.2 — `Segmentado` "Qual IA", com os nomes de função dos três agentes, no endereço (`?ia=`); abre no Assistente de ensino
- [x] 11.3 — O agente escolhido, numa seção com `data-agente`: `AssinaturaIA` com o selo "IA"; cada função (`data-funcao`) com o que **faz sozinha** e o que **espera aprovação**, no texto que a API devolve; o selo "Alto risco" onde a função tem avaliação de impacto, e o `Estado` "Suspensa", com desde quando e o motivo
- [x] 11.4 — "Suspender esta função" (perigo) e "Retomar esta função", com o diálogo de confirmação, o motivo de lista fechada opcional e o foco de volta ao botão, como hoje
- [x] 11.5 — "O que a IA nunca faz" (`nunca-faz.ts`), sempre à vista, igual para as três
- [x] 11.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Agentes.tsx` | alterado |
| `apps/web/src/areas/coordenacao/Agentes.test.tsx` | novo |
| `e2e/agentes.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | carregando; erro com "Tentar de novo"; com dado para cada IA (não há vazio: os três agentes sempre existem); o foco depois de suspender e de retomar |
| o texto é o da API | componente | "faz sozinha" e "espera aprovação" são os da resposta, sem texto da tela no lugar; nenhuma frase diz que o agente é pessoa |
| suspender e retomar | e2e | o caso de hoje: `alertdialog` "Suspender a correção de objetiva", o registro no banco com quem e o motivo, e retomar fecha a suspensão |
| autonomia e alto risco | componente | cada função mostra o texto de autonomia da API; a função de alto risco mostra o selo "Alto risco" |
| as três IAs | e2e | cada opção do seletor mostra o agente com o nome da função e `[data-selo-ia]`; o endereço guarda a escolha |
| função já suspensa por outra pessoa | e2e | a tela mostra o estado de agora e o diálogo não oferece suspender de novo |
| recomeço: segunda pessoa; falha com o diálogo aberto; clique duplo em confirmar | e2e | o aviso da tentativa anterior sai ao reabrir; uma suspensão só |
| 360 px e teclado | e2e | o seletor pelas setas; alvos de 44 px; sem rolagem de lado; axe |

## Como testar

- `e2e/agentes.spec.ts › três cartões com as funções; suspender…` (veio de `governanca.spec.ts` na 3.0): os três cartões viram três opções do seletor; `suspensoesNoBanco`, de `e2e/__fixtures__/governanca.ts`
- No roteiro, o laço pelos três agentes passa a escolher cada um no seletor
- `aplicarFuncao` já troca a função na lista lida: não duplique o estado em `useState`
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/Agentes.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/agentes.spec.ts`
- Telas: `coordenacao`, `/coordenacao/agentes`, com `text=Tutor` e com `text=Suspender esta função`; mockup `/coordenacao/registros?aba=ia&ver=como`

## Fora do escopo desta tarefa

A versão da AIA na tela (F12); suspender o agente inteiro; motivo em texto livre; o que o aluno vê com o Tutor suspenso (já existe, X4).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A seção do agente escolhido (11.3) leva `data-cartao-do-agente`, e não `data-agente` | `[data-agente]` é o atributo do avatar (`AvatarAgente`), e `conferirAssinaturas` exige um por assinatura: com os dois na mesma tela, o cartão contaria como um avatar a mais. O atributo do cartão já era esse desde a A5 | `techspec.md` §9, "Registros › IA", parágrafo "Como ficou na 11.0" |
| `paginaNaoRola` (`e2e/__fixtures__/coordenacao.ts`) passa a esperar a tela sair de "Carregando…" e "Verificando…" antes de medir, e os comentários de `e2e/areas.spec.ts` deixam de dizer "nenhuma tela de Escola nem de Registros" | Observação do Orquestrador, achado da 3.0: a primeira amostra bastava para passar, e foi o que deixou o laço do W2 passar nos Agentes, que rolavam. Os dois arquivos não estavam em "Arquivos previstos" | `techspec.md` §9, o mesmo parágrafo |
| Escolher uma IA grava `?ia=<agente>` também para o Assistente; só o endereço sem o parâmetro (ou com valor que não é de agente) abre nele sem gravar | A subtarefa 11.2 diz "abre no Assistente de ensino" e "no endereço (`?ia=`)", e não diz se escolher o primeiro tira o parâmetro. Gravar sempre mantém o que o endereço mostra igual ao que a pessoa escolheu | `techspec.md` §9, o mesmo parágrafo |
| Além dos "Arquivos previstos": `endereco-da-tela.ts` (o parâmetro `ia`), `textos-da-governanca.ts` e o teste dele (`agenteDoEndereco`), `miolo-que-rola.ts` (a constante `O_MIOLO_DOS_AGENTES`), `passagens.test.tsx` (o `matchMedia` que o miolo lê) e a fixture `suspenderFuncaoPorOutraPessoa`, em `e2e/__fixtures__/governanca.ts` | O leitor do endereço mora ao lado de `estadoDoEndereco`, como o da IA de Registros; a fixture é o "outro" da linha "função já suspensa por outra pessoa"; e o miolo dos Agentes tem a conta dele (`O_MIOLO_DOS_AGENTES`, 21 rem), porque o seletor "Qual IA" ocupa 62 px que as molduras não têm e os 17 rem deixavam a página rolar 48 px | `techspec.md` §9, o mesmo parágrafo; `docs/interface.md` 11.7 (o texto "três cartões" passou a "uma IA por vez") |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/coordenacao/textos-da-governanca.ts
teste: apps/web/src/areas/coordenacao/textos-da-governanca.test.ts › a IA do endereço vale só se
- return AGENTES.find((agente) => agente === valor) ?? 'assistente_de_ensino'
+ return AGENTES.find((agente) => agente === valor) ?? 'tutor'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/textos-da-governanca.ts
teste: apps/web/src/areas/coordenacao/textos-da-governanca.test.ts › a IA do endereço vale só se
- return AGENTES.find((agente) => agente === valor) ?? 'assistente_de_ensino'
+ return AGENTES.find(() => true) ?? 'assistente_de_ensino'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › com dado, para cada uma das três IAs
  {funcoes.data.agentes
- .filter((agente) => agente.agente === ia)
  .map((agente) => (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › escolher uma IA põe
- navegar(enderecoComParametro(caminho, busca, 'ia', agente), { replace: true })
+ navegar(enderecoComParametro(caminho, busca, 'ia', agente))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › escolher a IA guarda os outros parâmetros
- navegar(enderecoComParametro(caminho, busca, 'ia', agente), { replace: true })
+ navegar(enderecoComParametro(caminho, '', 'ia', agente), { replace: true })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › escolher uma IA põe
- { valor: 'tutor', rotulo: NOMES_DOS_AGENTES.tutor },
+ { valor: 'assistente_de_ensino', rotulo: NOMES_DOS_AGENTES.tutor },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › o miolo que rola recebe foco
- <section aria-label="O que cada função da IA faz" {...(comMiolo ? { tabIndex: 0 } : {})} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_DOS_AGENTES}`}>
+ <section aria-label="O que cada função da IA faz" {...{ tabIndex: 0 }} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_DOS_AGENTES}`}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › o miolo que rola recebe foco
- <section aria-label="O que cada função da IA faz" {...(comMiolo ? { tabIndex: 0 } : {})} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_DOS_AGENTES}`}>
+ <section aria-label="O que cada função da IA faz"  className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_DOS_AGENTES}`}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › carregando: o seletor já está à mão
- if (funcoes.isPending) {
+ if (false) {
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › erro: diz o que fazer
- } else if (funcoes.isError) {
+ } else if (false) {
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › carregando: o seletor já está à mão
- <Tela titulo="Como cada IA trabalha" largura="leitura" antes={voltar}>
+ <Tela titulo="Como cada IA trabalha" largura="grade" antes={voltar}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › carregando: o seletor já está à mão
- useTituloDaTela('Como cada IA trabalha')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › trocar de IA, com a retomada já terminada
  const escolherIA = (agente: Agente): void => {
- definirAnuncio('')
  retomada.mutacao.reset()
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › trocar de IA, com a retomada já terminada
  definirAnuncio('')
- retomada.mutacao.reset()
  iaNaTela.current = agente
  navegar(enderecoComParametro(caminho, busca, 'ia', agente), { replace: true })
```

```mutacao
arquivo: e2e/__fixtures__/coordenacao.ts
teste: e2e/agentes.spec.ts › não aceita a tela ainda carregando
- await expect(page.getByRole('main').getByText(/^(Carregando|Verificando)/), 'a tela ainda está carregando: a medida dela não é a de verdade').toHaveCount(0)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: e2e/agentes.spec.ts › o seletor pelas setas
- <section aria-label="O que cada função da IA faz" {...(comMiolo ? { tabIndex: 0 } : {})} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_DOS_AGENTES}`}>
+ <section aria-label="O que cada função da IA faz" {...(comMiolo ? { tabIndex: 0 } : {})} className={`flex min-w-0 flex-col gap-4`}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/miolo-que-rola.ts
teste: e2e/agentes.spec.ts › o seletor pelas setas
- export const O_MIOLO_DOS_AGENTES = 'md:relative md:max-h-[calc(100dvh-21rem-var(--faixa-de-incidente,0px))] md:overflow-y-auto'
+ export const O_MIOLO_DOS_AGENTES = 'md:relative md:max-h-[calc(100dvh-17rem-var(--faixa-de-incidente,0px))] md:overflow-y-auto'
```

```mutacao
arquivo: apps/web/src/componentes/dialogos.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › com uma retomada no ar, trocar de IA não prende
- void mutacao.mutateAsync(entrada).then(soltar, soltar)
+ mutacao.mutate(entrada, { onSettled: soltar })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/Agentes.test.tsx › com uma retomada no ar, trocar de IA não prende
- if (agente !== iaNaTela.current) return
```


## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | "A 1366 × 768, "O que a IA nunca faz" fica abaixo da dobra, dentro do miolo que rola, sem sinal visual de que há mais. […] Um sinal de continuação, como uma borda ou sombra no pé do miolo, ajudaria quem não rola." | `TODO.md`: muda a aparência do miolo e o comportamento de cinco telas que o compartilham (`miolo-que-rola.ts`); não é barata |
| frontend-reviewer (1ª) | "O selo "Alto risco: tem avaliação de impacto" (`Agentes.tsx:194`) usa o termo "avaliação de impacto", que é da D60 e pouco comum para a coordenação." | Recusada nesta tarefa: o texto é o da 7b da Tech Spec e da D60; troca de texto de tela é decisão do Arquiteto. Segue ao `/validar` |
| frontend-reviewer (1ª) | "Não revisei o modo escuro, porque não havia foto dele." | Sem ação de código. O Validador fotografa o modo escuro no fim da spec |
| test-engineer (1ª) | "Permissão: nenhum teste desta tarefa prova que professor ou aluno não abre `/coordenacao/agentes`. A guarda já existe no W2 de `e2e/areas.spec.ts`." | Recusada: a guarda é do W2 de `e2e/areas.spec.ts`, que já cobre a rota; teste repetido aqui não prova nada além dele |
| test-engineer (1ª) | "Folga da medida de rolagem (`miolo-que-rola.ts`, 21 rem): sobram 16 px a 1366 × 768. […] vale anotar no runbook do teste como medir se ela estourar." | `TODO.md` (runbook do teste de rolagem) |
| test-engineer (1ª), conformidade-reviewer (1ª), revisor-geral (1ª) | "Já suspensa por outra pessoa": a frase da tabela da tarefa, "o diálogo não oferece suspender de novo", só vale depois que a tela é lida de novo; na tela velha o diálogo abre e só o servidor evita a segunda suspensão | Não vira item: ajustar o texto da tarefa ao que o teste prova é editar critério de aceite. Vai ao Orquestrador e ao `/validar`, que decidem se a tela velha deve ou não oferecer "Suspender" |
| revisor-geral (3ª), frontend-reviewer (3ª) | Depois de `escolherIA`, o `reset()` deixa `isPending` falso e o botão "Retomar" da IA nova parece livre, mas `enviar` descarta o clique até a resposta anterior chegar, sem aviso. "Deixar o botão desabilitado enquanto a trava está presa, ou aceitar e registrar a janela no `11_task.md`." | Aceita, com a janela registrada: dura o tempo de um pedido, sem perda de dado. Destino: `/validar` (RF22) e `TODO.md` se o Validador achar que pesa |
| revisor-geral (3ª) | Uma linha no comentário de `iaNaTela` (`Agentes.tsx`, ~linha 74) dizendo que a escrita em `escolherIA` cobre a resposta que chega antes do próximo render, para ninguém tirá-la como repetida | `TODO.md`: comentário; mudança em `.tsx` caduca o `revisor-geral` e não vale uma rodada |
| test-engineer (3ª) | O teste novo não "volta" ao Assistente de ensino depois de a resposta chegar; provaria que a Correção de objetiva aparece retomada lá e que nenhum anúncio atrasado surge ao voltar | `TODO.md`: o que a mutação já prova é o defeito; a volta é dedução da lista já lida |
| test-engineer (3ª) | `aoSuspender` com uma retomada no ar não tem teste próprio; a resposta que chega com o diálogo de suspensão aberto, na mesma IA, ainda anuncia e põe a função em `focarFuncao` | `TODO.md`: a trava está coberta pela mutação de `dialogos.tsx`; o anúncio na mesma IA é o comportamento certo, e o foco vai para um botão que não está sob o diálogo |
| test-engineer (3ª) | Comentário em `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:396-397` diz que a trava "ficaria presa" com `reset()` no meio do pedido; com a correção isso deixou de ser verdade, e só o outro motivo (perder o fim do pedido) vale | `TODO.md`, ou a tarefa futura que tocar `ListaDaTurma.tsx` (arquivo fora desta tarefa) |
| test-engineer (3ª) | Trocar de IA, voltar e clicar de novo em "Retomar" na mesma função antes de a 1ª resposta chegar manda um 2º POST; o servidor responde `NAO_ENCONTRADO`, a tela mostra o aviso e relê a lista. Resultado aceitável, mas não declarado | Aceita, sem ação: vale uma linha na tabela de cenários, que fica para o `/validar` |
| frontend-reviewer (3ª) | Fixture `suspenderFuncaoPorOutraPessoa` grava só a linha da suspensão, sem auditoria; teste futuro que confira a auditoria deve usar a API | Já aplicada na rodada 1 (comentário da fixture); sem ação |
| frontend-reviewer (3ª) | No computador o primeiro cartão fica cortado embaixo, porque só o miolo rola (RF23) | Recusada: é o desenho da RF23 e da Tech Spec 9; o revisor diz que não bloqueia |
| frontend-reviewer (3ª) | Pendências de texto: o selo "Alto risco: tem avaliação de impacto" e a frase da tabela da tarefa sobre "já suspensa por outra pessoa" | Já têm destino na ordem da rodada 1 (Orquestrador e `/validar`); sem ação |
| conformidade-reviewer (3ª) | nenhuma | — |

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
| 2026-10-17 15:32:56 | 2026-10-17 15:33:53 | `frontend-reviewer` | 1 | APROVADO | aafd6a5f465540051 |
| 2026-10-17 15:33:14 | 2026-10-17 15:34:08 | `revisor-geral` | 1 | APROVADO | a54755a6596bf1d72 |
| 2026-10-17 15:33:02 | 2026-10-17 15:34:15 | `conformidade-reviewer` | 1 | APROVADO | a0ea99629de0752cf |
| 2026-10-17 15:33:08 | 2026-10-17 15:35:35 | `test-engineer` | 1 | REPROVADO | a7db6bbbf1e76edac |
| 2026-10-17 15:48:13 | 2026-10-17 15:48:46 | `frontend-reviewer` | 2 | APROVADO | adb46edf0ec5af8b8 |
| 2026-10-17 15:48:21 | 2026-10-17 15:48:56 | `conformidade-reviewer` | 2 | APROVADO | a87b7eb1e6b61ea1f |
| 2026-10-17 15:48:41 | 2026-10-17 15:49:16 | `revisor-geral` | 2 | APROVADO | a1930b48fee6e53a4 |
| 2026-10-17 15:48:31 | 2026-10-17 15:49:59 | `test-engineer` | 2 | REPROVADO | a700748a5cdac5ca4 |
| 2026-10-17 16:19:13 | 2026-10-17 16:19:54 | `revisor-geral` | 3 | APROVADO | affb0918b530ec7be |
| 2026-10-17 16:19:31 | 2026-10-17 16:19:55 | `conformidade-reviewer` | 3 | APROVADO | adedc4fef7acd5d0d |
| 2026-10-17 16:19:24 | 2026-10-17 16:20:12 | `frontend-reviewer` | 3 | APROVADO | a9be6074e28e528f7 |
| 2026-10-17 16:19:05 | 2026-10-17 16:21:40 | `test-engineer` | 3 | APROVADO | a23ea7eefc34fca4b |

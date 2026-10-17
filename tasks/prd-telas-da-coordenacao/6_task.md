# Tarefa 6.0 — Escola › Professores em tabela, com o painel do professor

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba Professores mostra os professores em tabela e abre cada um num painel ao lado, com a situação e o convite; cadastrar, copiar o link uma vez, refazer e revogar continuam como hoje.

## Contexto necessário

- `techspec.md` seções 5 (`?professor=`), 6 e 9 ("Professores"); `prd.md` RF13, RF22 e seção 6, ponto 2
- `mockup.md` seção 3.6: a tabela, o painel e os diálogos
- `.claude/rules/20-lgpd-menores.md` itens 4 e 8
- Código: `apps/web/src/areas/coordenacao/Professores.tsx` e `convite-de-professor.ts` (o que cada estado permite não muda); `apps/web/src/componentes/DialogoDoConvite.tsx`, que **não muda**; `apps/web/src/api/professores.ts` (`gcTime: 0` do token)

## Subtarefas

- [x] 6.1 — `professores-da-escola.ts` (puro): por professor, as turmas e as disciplinas dos vínculos pendentes, confirmados e contestados
- [x] 6.2 — A tabela, na lista "Professores da escola": Nome, Disciplinas, Turmas e Situação (`Estado` com o texto de `TEXTO_DO_ESTADO_DO_PROFESSOR`). Sem e-mail, sem busca e sem ordem que não seja a do nome. A contagem "N professores" e "Cadastrar professor" como o único botão `primario`
- [x] 6.3 — A linha abre o `PainelLado` do professor (`?professor=<usuarioId>`): o nome, a situação e, no rodapé, só as ações que o estado permite ("Refazer convite", "Revogar convite"). O id que não é da escola não abre nada
- [x] 6.4 — Os diálogos de cadastrar, refazer e revogar são os de hoje, abertos da aba e do painel; o foco volta a quem abriu
- [x] 6.5 — O vazio "Nenhum professor ainda", com "Cadastrar professor"
- [x] 6.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Professores.tsx` | alterado |
| `apps/web/src/areas/coordenacao/PainelDoProfessor.tsx`, `apps/web/src/areas/coordenacao/Professores.test.tsx` | novo |
| `apps/web/src/areas/coordenacao/professores-da-escola.ts`, `apps/web/src/areas/coordenacao/professores-da-escola.test.ts` | novo |
| `e2e/professores.spec.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| turmas e disciplinas do professor | unidade | duas disciplinas na mesma turma: a turma uma vez, as duas disciplinas; vínculo encerrado não conta; professor sem vínculo fica com "—" |
| estados da tela | componente | carregando; erro com "Tentar de novo"; vazio com "Cadastrar professor"; com dado, o estado de cada convite em texto; o foco depois de fechar o painel |
| nenhum e-mail | componente | a tabela e o painel não mostram e-mail, e o painel não o pede à API |
| as ações por estado | e2e | o caso W4 de hoje: só as ações que o estado permite, agora no painel |
| cadastrar e copiar | e2e | o caso W14 de hoje: o resumo antes, o link uma vez, fechar sem copiar pergunta |
| clique duplo | e2e | o caso de hoje: um link só; um pedido só em refazer e em revogar |
| recomeço: segunda pessoa; o painel pelo endereço; a sessão que vence com o link na tela; falha com o diálogo aberto | e2e | os casos de hoje; o `?professor=` de A na sessão de B não abre painel |
| 360 px e teclado | e2e | o caso W12 de hoje, com a tabela virando lista e o painel como folha de baixo |

## Como testar

- `e2e/professores.spec.ts`: os oito casos ficam; muda o clique que chega à ação (linha, painel, botão)
- `escola-montada` e o roteiro: só o passo "cadastrar professor"
- O token do convite continua só no diálogo: o painel não o guarda nem o repete
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/Professores.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/professores.spec.ts`
- Telas: `coordenacao`, `/coordenacao/professores`, clique na primeira linha; também com `--vazia`; mockup `/coordenacao/escola?aba=professores`

## Fora do escopo desta tarefa

As turmas do professor no painel e "Acrescentar turma" (7.0); encerrar vínculo; professor "da grade horária" (F2); avatar com foto.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| As colunas Disciplinas e Turmas vêm dos vínculos do ano em curso, lidos à parte da lista de professores (`consultaAnosLetivos` e `consultaVinculos`, esta só com ano em curso). Se a leitura cai, a tabela continua com "—" nas duas células e um `Aviso` "As turmas e as disciplinas dos professores não carregaram" traz "Tentar de novo" | A 6.1 e a 6.2 pedem as duas colunas sem dizer de onde vêm nem o que a tela faz quando a leitura falha. A lista de professores não traz vínculo, e a leitura que cai não pode levar a tabela junto nem afirmar "sem turma" sobre o que a tela não leu | `techspec.md` §9, linha "Professores" (parágrafo "Como ficou na 6.0") (`Tabela`, `PainelLado` do professor); `prd.md` RF13 e RF22 |
| O nome da pessoa na linha é um `<button aria-haspopup="dialog">` com o "›" dentro, estendido sobre a linha (`after:absolute after:inset-0`), e não um link nem uma coluna de chevron; a tabela da X1 não ganhou coluna | O painel abre por `?professor=`, mas é um `dialog` modal e não uma página: botão é o papel certo. O chevron dentro do botão não exige mexer na `Tabela`, que a 7.0 e a 8.0 também usam | `techspec.md` §9, linha "Professores" (parágrafo "Como ficou na 6.0") e "Chromebook e celular" ("O link da linha fica na célula do nome"); `prd.md` RF13 |
| `enderecoComParametro` e `textoDosProfessores` saem de `turmas-da-escola.ts` para `endereco-da-tela.ts` e `lista-curta.ts` (esta passa a se chamar `textoDaListaCurta`); `Estrutura.tsx`, `turmas-da-escola.ts` e seu teste mudam só no import e no nome. O nome do parâmetro vira `PARAMETRO_DO_PROFESSOR` em `caminhos.ts`, lido pelo sino, pela lista da turma e por esta tela | Duas telas usam as duas peças, e uma tela não importa o módulo da outra. A observação do pedido manda o padrão de `miolo-que-rola.ts`, com a peça em arquivo próprio e o nome do parâmetro em `caminhos.ts`. Nenhum desses arquivos estava em "Arquivos previstos"; o comportamento da 5.0 não mudou (os testes dela seguem verdes) | `techspec.md` §5 (`?professor=`) e §9, linha "Professores"; a observação do pedido do Orquestrador (achado da 9.0, `miolo-que-rola.ts`) |
| Revogar pelo painel não fecha o painel: ele fica aberto, perde o rodapé (o revogado não tem ação), diz "Convite de … revogado." e o foco vai ao título "Situação do convite". O anúncio é de um professor só e some ao abrir outro diálogo | A 6.4 manda os diálogos "como hoje" e o foco voltar a quem abriu, mas o botão que abriu o diálogo sai do rodapé com o estado novo. Fechar o painel sozinho tiraria da pessoa o resultado da ação que ela acabou de fazer | `techspec.md` §9, linha "Professores" (parágrafo "Como ficou na 6.0"); `prd.md` RF13 e RF22 |
| `FAMILIA_DO_ESTADO_DO_PROFESSOR` entra em `convite-de-professor.ts`: pendente → pendente, vencido → erro, aceito e ativo → ok, revogado e desativado → info | A 6.2 pede o `Estado` com o texto de `TEXTO_DO_ESTADO_DO_PROFESSOR`, e o `Estado` pede a família. O texto não muda; só se diz a cor de cada um, no mesmo arquivo que já diz o texto | `techspec.md` §9, linha "Professores" (parágrafo "Como ficou na 6.0"); `prd.md` RF13 |
| `e2e/escola-montada.spec.ts` e `e2e/roteiro-da-demonstracao.spec.ts`, previstos como alterados, não mudaram. `e2e/sino-da-coordenacao.spec.ts` mudou sem estar prevista | O passo "Cadastrar professor" dos dois primeiros segue igual: o botão é o mesmo, no mesmo lugar da aba, e abre o mesmo diálogo (`escola-montada.spec.ts` linha 127, `roteiro-da-demonstracao.spec.ts` linha 244). O sino leva ao `?professor=<id>`, que agora abre o painel, e o "Refazer convite" do vencido fica nele, e não numa linha da lista | `techspec.md` §11 (os specs que atravessam telas entram na fila das tarefas que mudam o passo deles); `techspec.md` §9, linha "Professores" (parágrafo "Como ficou na 6.0") |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › o vínculo de cada professor é só dele
- return vinculo.papel === 'professor' && (vinculo.estado === 'pendente' || vinculo.estado === 'confirmado' || vinculo.estado === 'contestado')
+ return vinculo.estado === 'pendente' || vinculo.estado === 'confirmado' || vinculo.estado === 'contestado'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › o vínculo pendente, o confirmado e o contestado contam
- return vinculo.papel === 'professor' && (vinculo.estado === 'pendente' || vinculo.estado === 'confirmado' || vinculo.estado === 'contestado')
+ return vinculo.papel === 'professor' && (vinculo.estado === 'pendente' || vinculo.estado === 'confirmado')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › o vínculo pendente, o confirmado e o contestado contam
- return vinculo.papel === 'professor' && (vinculo.estado === 'pendente' || vinculo.estado === 'confirmado' || vinculo.estado === 'contestado')
+ return vinculo.papel === 'professor' && vinculo.estado !== 'pendente'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › o vínculo pendente, o confirmado e o contestado contam
- if (!vinculoDaLinha(vinculo)) continue
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › duas disciplinas na mesma turma
- const porId = new Map(itens.map((item) => [item.id, item]))
+ const porId = new Map(itens.map((item, indice) => [String(indice), item]))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › a turma 10 vem depois da 7
- return ordenarPeloNome([...porId.values()]).map((item) => item.nome)
+ return [...porId.values()].map((item) => item.nome)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › os professores saem pelo nome
- return ordenarPeloNome(professores).map((professor) => {
+ return professores.map((professor) => {
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › o vínculo sem disciplina dá a turma e nenhuma disciplina
- disciplinas: nomesUnicos(dele.flatMap((vinculo) => (vinculo.disciplina === undefined ? [] : [vinculo.disciplina]))),
+ disciplinas: nomesUnicos(dele.flatMap((vinculo) => [vinculo.disciplina ?? { id: vinculo.id, nome: '' }])),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › o id que a lista não tem
- return professores.find((professor) => professor.usuarioId === usuarioId)
+ return professores[0]
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › só o parâmetro `professor` abre
- const usuarioId = new URLSearchParams(busca).get(PARAMETRO_DO_PROFESSOR)
+ const usuarioId = new URLSearchParams(busca).get('painel') ?? new URLSearchParams(busca).get(PARAMETRO_DO_PROFESSOR)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/professores-da-escola.ts
teste: apps/web/src/areas/coordenacao/professores-da-escola.test.ts › contagemDeProfessores
- return quantos === 1 ? '1 professor' : `${String(quantos)} professores`
+ return `${String(quantos)} professores`
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/lista-curta.ts
teste: apps/web/src/areas/coordenacao/lista-curta.test.ts › textoDaListaCurta
- if (nomes.length === 0) return '—'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/lista-curta.ts
teste: apps/web/src/areas/coordenacao/lista-curta.test.ts › textoDaListaCurta
- const resto = nomes.length - 2
+ const resto = nomes.length - 3
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/lista-curta.ts
teste: apps/web/src/areas/coordenacao/lista-curta.test.ts › textoDaListaCurta
- return resto > 0 ? `${nomes.slice(0, 2).join(', ')} +${String(resto)}` : nomes.join(', ')
+ return resto > 0 ? `${nomes.slice(0, 1).join(', ')} +${String(resto)}` : nomes.join(', ')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/endereco-da-tela.ts
teste: apps/web/src/areas/coordenacao/endereco-da-tela.test.ts › o professor aberto é o parâmetro `professor`
- return resto === '' ? caminho : `${caminho}?${resto}`
+ return `${caminho}?${resto}`
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/endereco-da-tela.ts
teste: apps/web/src/areas/coordenacao/endereco-da-tela.test.ts › põe e tira um parâmetro
- else parametros.set(nome, valor)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/convite-de-professor.ts
teste: apps/web/src/areas/coordenacao/convite-de-professor.test.ts › cada estado tem a família do selo
- vencido: 'erro',
+ vencido: 'pendente',
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
teste: apps/web/src/areas/coordenacao/Professores.test.tsx › só as ações que o estado permite
- acoes.length === 0 ? undefined : (
+ false ? undefined : (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/Professores.test.tsx › sem ano em curso: os vínculos nem são pedidos
- const vinculos = useQuery({ ...consultaVinculos, enabled: anos.data?.itens.some((ano) => ano.situacao === 'em_curso') === true })
+ const vinculos = useQuery({ ...consultaVinculos, enabled: true })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/Professores.test.tsx › os anos que falham
- const turmasComFalha = anos.isError || vinculos.isError
+ const turmasComFalha = vinculos.isError
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/Professores.test.tsx › os anos que falham
- const lerTurmasDeNovo = () => void (anos.isError ? anos : vinculos).refetch({ cancelRefetch: false })
+ const lerTurmasDeNovo = () => void vinculos.refetch({ cancelRefetch: false })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/Professores.test.tsx › o anúncio é do professor que foi revogado
- anuncio={anuncio?.usuarioId === doPainel.usuarioId ? anuncio.texto : ''}
+ anuncio={anuncio?.texto ?? ''}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/Professores.test.tsx › abrir outro diálogo apaga o anúncio
  function abrir(tipo: TipoDeDialogo, professor?: ProfessorDaLinha): void {
- definirAnuncio(undefined)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/Professores.test.tsx › aberto já pelo endereço
- if (document.activeElement === document.body) titulo?.focus()
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/Professores.test.tsx › revogar: o diálogo de confirmação abre sobre o painel
- const focarNoPainel = useCallback(() => (tituloDaSituacao.current === null ? focarNaLista() : tituloDaSituacao.current.focus()), [focarNaLista])
+ const focarNoPainel = focarNaLista
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/Professores.test.tsx › a linha abre o painel no endereço
- const fecharPainel = (): void => navegar(enderecoComParametro(caminho, busca, PARAMETRO_DO_PROFESSOR, undefined), { replace: true })
+ const fecharPainel = (): void => navegar(enderecoComParametro(caminho, busca, PARAMETRO_DO_PROFESSOR, undefined))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/Professores.test.tsx › refazer cai em CONFLITO
  link={TEXTOS_DO_LINK}
  aoFechar={fechar}
- focoDeReserva={focarNoPainel}
+ focoDeReserva={focarNaLista}
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `frontend-reviewer` 1ª | Texto do selo na tabela: trocar a frase inteira de `TEXTO_DO_ESTADO_DO_PROFESSOR` por selos curtos ("Ativo", "Convite em aberto", "Convite vencido"), com a frase no painel | Muda o texto de tela e o que o e2e confere, e a subtarefa 6.2 manda esse texto na tabela: `TODO.md`, para o Arquiteto decidir com o mockup 3.6 |
| `frontend-reviewer` 1ª, `revisor-geral` 1ª, `test-engineer` 1ª | Vínculos que passaram do teto (`completa: false`): a tabela mostra "—" sem aviso, e `professoresDaTabela` ignora `completa` | Muda comportamento (aviso novo e teste novo): tarefa 7.0, que toca `Professores.tsx` e lê os mesmos vínculos |
| `frontend-reviewer` 1ª | Abas a 360 px: "Material" cai para a segunda linha | A barra é de `Estrutura.tsx` e vem de tarefa anterior: `TODO.md` |
| `frontend-reviewer` 1ª | Painel só com a situação | Recusada: as turmas, as disciplinas e "Acrescentar turma" são da 7.0, fora do escopo desta |
| `revisor-geral` 1ª, `frontend-reviewer` 1ª | As fotos da escola vazia mostram 1 professor, então o vazio não aparece em foto | Recusada: a escola da vitrine já traz a professora Rosa; o vazio está nos testes de componente e no e2e W4 |
| `test-engineer` 1ª | Clique duplo no nome da linha pode empilhar dois passos iguais no histórico | `TODO.md`: baixo risco, cobertura extra |
| `privacy-guardian` 1ª | O anúncio "Convite de <nome> revogado." põe o nome do professor numa região `aria-live` | Recusada: o revisor aprova; é dado de adulto, só na tela da coordenação |
| `privacy-guardian` 1ª | No celular, o cartão de outro professor aparece por baixo da folha | Recusada: o `frontend-reviewer` viu a foto e aprovou o celular; a barra e o fundo na foto são da fotografia da página inteira |
| `revisor-geral` 2ª | No caso dos homônimos de `Professores.test.tsx`, o id sai de `localizacao.history?.at(-1) ?? ''`; com o histórico vazio, as chaves viram `''` e o teste falha sem dizer por quê. Uma asserção de que o endereço contém `professor=` antes de ler o id deixaria a falha clara | `TODO.md`: não muda comportamento e o teste já falha, só a mensagem é pior; entra na próxima tarefa que tocar `Professores.test.tsx` (7.0) |
| `test-engineer` 2ª | `e2e/lista-da-turma.spec.ts:646`: conferir também que o painel daquele professor abre (`getByRole('dialog', { name: camila.nome })` visível) antes do `goBack`, já que o link da turma passou a levar ao painel | `TODO.md`: o spec é da 9.0, fora dos arquivos desta tarefa; mexer nele aqui pediria portão novo com e2e que a tarefa não alterava |
| `test-engineer` 2ª | `e2e/professores.spec.ts:1108`: o `toHaveCount(0)` logo depois do `goBack` pode passar antes de um painel reabrir; a prova está na URL, e uma espera curta pelo título da lista deixaria a intenção mais clara | `TODO.md`: a prova da URL já vale; é só clareza de intenção |

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
| 2026-10-17 03:07:53 | 2026-10-17 03:08:43 | `privacy-guardian` | 1 | APROVADO | a7e7299fd51cc547a |
| 2026-10-17 03:07:47 | 2026-10-17 03:09:01 | `frontend-reviewer` | 1 | APROVADO | aab7e1ae5ee202a57 |
| 2026-10-17 03:08:03 | 2026-10-17 03:10:10 | `revisor-geral` | 1 | REPROVADO | aa7b8ea1472afa4c2 |
| 2026-10-17 03:07:58 | 2026-10-17 03:10:20 | `test-engineer` | 1 | REPROVADO | ac603c9e4ae114239 |
| 2026-10-17 10:06:07 | 2026-10-17 10:06:36 | `revisor-geral` | 2 | APROVADO | ae24d5303ae9d3658 |
| 2026-10-17 10:05:59 | 2026-10-17 10:07:06 | `test-engineer` | 2 | APROVADO | a3fd77ea14e614696 |

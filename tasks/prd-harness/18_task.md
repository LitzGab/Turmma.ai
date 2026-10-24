# Tarefa 18.0 — Um fato num lugar só, e o `executar-task` sem diário

**Funcionalidade:** harness (X7) · **Depende de:** 17.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`
**Porte:** grande
<!-- A tarefa edita o papel dos guardiões (blocos repetidos): marca os que cabem no teto de três; o `infra-guardian.md`
     fica preso pelo teste da lista "O que verificar" e do formato, que não mudam. -->

## Objetivo

As contradições listadas no `texto.md` deixam de existir, cada fato no lugar que fica; blocos que se repetem entre
revisores ficam idênticos, com teste; e o `executar-task` perde o diário de incidentes, que vai para
`docs/processo-licoes.md`, ficando abaixo de 500 linhas com a autoconferência no `task-template.md`.

## Contexto necessário

- `techspec.md` §9
- `prd.md` RF21, RF22 (a parte do `executar-task`)
- `texto.md`: **As contradições (RF21)** (a linha da pasta de adaptadores já foi feita na 16.0) e a frase sobre a
  autoconferência e os incidentes, em **`/seguir` e papéis**
- `cenarios.md` seção C, **RF21** e **RF22**
- Arquivos: `.claude/skills/executar-task/SKILL.md` (421 linhas); `.claude/agents/*-guardian.md`,
  `conformidade-reviewer.md`, `test-engineer.md`, `revisor-geral.md` (seções "O que verificar" e "Formato da resposta");
  `.claude/skills/corrigir/SKILL.md`, `revisar-tarefa/SKILL.md`, `vigia/SKILL.md`; `.claude/skills/criar-tasks/task-template.md`

## Subtarefas

- [x] 18.1 — Antes de mexer: gravar a lista "O que verificar" e o bloco do formato de cada guardião com veto em
  `tools/processo/harness/__fixtures__/revisores-antes/`
- [x] 18.2 — Cada linha da tabela de contradições resolvida no lugar que fica; nos outros, a frase sai ou aponta para lá
- [x] 18.3 — Blocos repetidos entre revisores: um texto só, igual em todos
- [x] 18.4 — `executar-task`: incidentes datados para `docs/processo-licoes.md`, com data e origem; a autoconferência vira
  até doze perguntas no `task-template.md`
- [x] 18.4a — `executar-task` e `corrigir`: a mensagem do commit vai num arquivo, por `git commit -F <arquivo>`. O hook
  procura `Revisões:` no começo de uma linha, e vários `-m` a deixam no meio do comando (aviso do Implementador 2, na 10.0)
- [x] 18.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.claude/skills/executar-task/SKILL.md` | alterado |
| `.claude/skills/criar-tasks/task-template.md` | alterado |
| `docs/processo-licoes.md` | novo |
| `.claude/agents/tenancy-guardian.md`, `.claude/agents/privacy-guardian.md`, `.claude/agents/conformidade-reviewer.md`, `.claude/agents/infra-guardian.md`, `.claude/agents/test-engineer.md`, `.claude/agents/revisor-geral.md` | alterados (só o que se repete) |
| `.claude/skills/corrigir/SKILL.md`, `.claude/skills/revisar-tarefa/SKILL.md`, `.claude/skills/vigia/SKILL.md` | alterados |
| `docs/decisoes.md` | alterado (D80, identidade visual; `(revista pela D79)` nas D53 e D78) |
| `.claude/agents/frontend-reviewer.md`, `.claude/agents/pedagogia-reviewer.md`, `.claude/agents/llm-integrator.md`, `.claude/agents/validador.md` | alterados (a frase sem `/validar` e `/retro`; o bloco das fotos do `pedagogia-reviewer`; `/revisar-spec` do `validador`) |
| `.claude/skills/criar-prd/SKILL.md`, `.claude/skills/descobrir/SKILL.md`, `.claude/skills/retro/SKILL.md`, `.claude/skills/revisar-spec/SKILL.md`, `.claude/skills/criar-tasks/SKILL.md`, `.claude/skills/validar/SKILL.md`, `.claude/skills/validar/template.md` | alterados (comando × skill; a tabela por natureza fica só no `criar-tasks`) |
| `.claude/rules/80-infra-e-carga.md` | alterado (nota datada no item 5) |
| `CLAUDE.md`, `ROADMAP.md`, `docs/avaliacao-de-modelos.md`, `docs/decisoes-em-aberto.md`, `docs/interface.md`, `docs/negocio.md`, `docs/pendencias-dos-mockups.md`, `docs/runbook.md` | alterados (comando × skill) |
| `tasks/prd-harness/techspec.md`, `tasks/prd-harness/texto.md`, `tasks/prd-harness/cenarios.md` | alterados (o lugar de cada contradição e as decisões da tarefa) |
| `tools/processo/harness/revisores.test.ts` | novo |
| `tools/processo/harness/__fixtures__/revisores-antes/` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF21: dois blocos que deveriam ser idênticos, diferindo (amostra) | unidade | vermelho |
| RF21: "O que verificar" de um guardião com veto diferente do gravado | unidade | vermelho, um caso por guardião |
| RF21: o formato de um guardião com veto diferente do gravado | unidade | vermelho |
| RF21: os blocos de hoje, depois da tarefa | unidade | iguais |
| RF22: `executar-task/SKILL.md` com 500 linhas ou mais | unidade | vermelho |
| RF22: o arquivo depois da tarefa | unidade | abaixo de 500, e `docs/processo-licoes.md` existe |
| a guarda reprova quando o alvo dela não existe: guardião ausente na amostra | unidade | vermelho |
| `task-template.md` continua com os rótulos da 1.0 | unidade | `rotulos.test.ts` verde |

## Como testar

- Sem precedente direto; o mais próximo é `tools/processo/harness/rotulos.test.ts` (1.0), que lê modelo do disco e compara com constante.
- O "antes" é gravado **antes** de editar e nunca regenerado depois; o teste compara bloco por bloco.
- Rodar: `npx vitest run --project unidade tools/processo/harness/`.
- Armadilha: os incidentes vão com data e origem, nada sai sem destino.

## Fora do escopo desta tarefa

O `/seguir` (17.0); as skills de terceiro e os papéis do time (19.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `frontend-reviewer`, `pedagogia-reviewer` e `llm-integrator` (sem veto) também mudam: a mesma frase "para a validação e a retro" no lugar de `/validar` e `/retro`; o `pedagogia-reviewer` ganha o bloco das fotos em três parágrafos | A contradição "`/validar` como comando × `user-invocable: false`" está nos nove; deixar três com o comando mantém a contradição. Os três sem veto formam uma família própria (`AJUSTES NECESSÁRIOS`), igual entre si, com teste | `techspec.md` §9, "Um fato num lugar só (18.0…)" e "Os blocos repetidos entre revisores (18.3)"; `texto.md`, "As contradições (RF21)"; `cenarios.md` C, RF21 |
| O `revisor-geral` perde da sua seção de severidade o que era só dele (invadir escopo, divergir em silêncio, carimbo, "o bloqueante do `test-engineer` não é seu") e ganha a seção `## O que é bloqueante só para você` | Para o bloco de severidade ser igual nos seis com veto, o que é do papel sai dele e vai para uma seção própria, sem perder uma palavra | `techspec.md` §9, "Os blocos repetidos entre revisores (18.3)"; `cenarios.md` C, RF21 ("a seção própria do `revisor-geral`") |
| O bloco das fotos da tela fica em três parágrafos (começo e fim iguais nos quatro que o têm, o do meio é do papel) | "Um texto só, igual em todos" não cabe no parágrafo inteiro: a pergunta de cada papel é diferente. O teste compara o começo e o fim | `techspec.md` §9, "Os blocos repetidos entre revisores (18.3)"; `cenarios.md` C, RF21 ("o bloco das fotos em três parágrafos") |
| A tabela de natureza → guardião fica **uma só**, em `criar-tasks/SKILL.md`; `revisar-spec` e `revisar-tarefa` apontam para ela, e o caminho vive em `guardioes-por-caminho.ts` (descrito em `tabela-de-guardioes.md`). A linha da `conformidade-reviewer` ganhou "indicador de professor", que só estava no `revisar-spec` | O `texto.md` manda ficar em `tabela-de-guardioes.md` e no código; a tabela por natureza é a do Arquiteto, que marca antes de haver caminho, e por isso ela é a que sobra, ao lado do código | `techspec.md` §9, "Um fato num lugar só (18.0…)"; `texto.md`, "As contradições (RF21)" (linha da tabela em seis lugares, corrigida) |
| A contradição "arquivo existe antes do commit em três skills" fica no protocolo (item 4) e na mensagem do hook; `executar-task` e `corrigir` apontam para lá. `executar-task` e `corrigir` passam a mandar `git commit -F <arquivo>` (18.4a) | O hook já recusa o comando que cria o arquivo no mesmo Bash (`comando-git.ts`); o protocolo não cresce (o `seguir.test.ts` tem 68 B de folga) | `techspec.md` §9, "Um fato num lugar só (18.0…)"; `texto.md`, "As contradições (RF21)" |
| `docs/processo-licoes.md` só tem a parte 1 (o que saiu do `executar-task`, 26 casos); a tabela da auditoria das skills (RF23/RF24) entra pela tarefa que a faz | A 18.0 não faz a auditoria; deixar uma seção vazia seria promessa | `techspec.md` §9, "O `executar-task` sem diário (18.4)"; `texto.md`, "Auditoria e critério de saída" |
| A regra 80, item 5, ganha uma nota datada (24/10/2026) dizendo que a sessão é lida do Postgres e que a N2 da X5 decide; a linha `Checagem:` não muda | `texto.md`: "nota na regra, até a N2" | `techspec.md` §9, "Um fato num lugar só (18.0…)"; `texto.md`, "As contradições (RF21)" |

## Mutações

O teste é `tools/processo/harness/revisores.test.ts`; cada bloco mexe numa cláusula de uma checagem dele (a função sobre o
texto), e o vermelho é o do caso que a prova com a amostra quebrada ou com o repositório de hoje. Os textos das skills e dos
papéis não têm cláusula: a prova deles é esse teste.

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › revisor ausente da amostra
- falhas.push(`revisor ausente (${familia}): ${AGENTES}${nome}.md`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › a seção de severidade some de um revisor
- falhas.push(`${nome} (${familia}) não tem a seção "${TITULO_DA_SEVERIDADE}"`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › uma palavra a mais na severidade de
- else if (texto !== referencia.texto) falhas.push(`${nome} (${familia}): a seção de severidade difere da de ${referencia.nome}`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › revisor das fotos ausente da amostra
- falhas.push(`revisor ausente (fotos): ${AGENTES}${nome}.md`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o bloco das fotos some de um revisor
- falhas.push(`${nome} não tem a seção "${TITULO_DAS_FOTOS}"`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o bloco das fotos que volta a ser um parágrafo só
- if (paragrafos.length !== 3) {
+ if (paragrafos.length > 3) {
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › do bloco das fotos de
- if (texto !== textoDeReferencia) falhas.push(`${nome}: ${parte} do bloco das fotos difere do de ${referencia}`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › guardião ausente da amostra
- falhas.push(`guardião ausente: ${AGENTES}${nome}.md`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › só a gravação de antes do
- if (gravadoVerificar === undefined || gravadoFormato === undefined) {
+ if (gravadoVerificar === undefined) {
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › só a gravação de antes do
- if (gravadoVerificar === undefined || gravadoFormato === undefined) {
+ if (gravadoFormato === undefined) {
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › apagada: vermelho, dizendo que não existe mais
- if (verificar === null) falhas.push(`${nome}: a lista "${lista.inicio}" não existe mais`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › um item a mais na lista
- if (verificar !== gravadoVerificar) falhas.push(`${nome}: a lista "O que verificar" difere da gravada em ${ANTES}`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › apagado: vermelho, dizendo que não existe mais
- if (formato === null) falhas.push(`${nome}: o bloco do formato da resposta não existe mais`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o formato da resposta de
- if (formato !== gravadoFormato) falhas.push(`${nome}: o formato da resposta difere do gravado em ${ANTES}`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › a seção de severidade some de um revisor
- if (inicio === -1) return null
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o fim da lista do privacy-guardian some
- if (ate !== undefined && fim === -1) return null
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › a última seção do arquivo vai até o fim
- if (ate !== undefined && fim === -1) return null
+ if (fim === -1) return null
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › os de hoje são os de antes
- const fim = linhas.findIndex((linha, i) => i > inicio && (ate === undefined ? linha.startsWith('## ') : linha === ate))
+ const fim = linhas.findIndex((linha, i) => (ate === undefined ? linha.startsWith('## ') : linha === ate))
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › os de hoje são os de antes
- const fim = linhas.findIndex((linha, i) => i > inicio && (ate === undefined ? linha.startsWith('## ') : linha === ate))
+ const fim = linhas.findIndex((linha, i) => i > inicio && linha.startsWith('## '))
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › apagado: vermelho, dizendo que não existe mais
- return inicio === -1 ? null : `${linhas.slice(inicio).join('\n').trimEnd()}\n`
+ return inicio === -2 ? null : `${linhas.slice(inicio).join('\n').trimEnd()}\n`
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o executar-task ausente
- if (skill === undefined) falhas.push(`arquivo ausente: ${EXECUTAR_TASK}`)
+ if (skill === 'x') falhas.push(`arquivo ausente: ${EXECUTAR_TASK}`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o documento de lições ausente
- if (documento === undefined) falhas.push(`arquivo ausente: ${LICOES}`)
+ if (documento === 'x') falhas.push(`arquivo ausente: ${LICOES}`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o modelo sem a seção
- if (modelo === undefined) falhas.push(`arquivo ausente: ${MODELO_DA_TAREFA}`)
+ if (modelo === 'x') falhas.push(`arquivo ausente: ${MODELO_DA_TAREFA}`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › 500 linhas: vermelho; 499: verde
- if (linhas >= LIMITE_DE_LINHAS) falhas.push(`${EXECUTAR_TASK} tem ${linhas} linhas, e o limite é ${LIMITE_DE_LINHAS - 1}`)
+ if (linhas > LIMITE_DE_LINHAS) falhas.push(`${EXECUTAR_TASK} tem ${linhas} linhas, e o limite é ${LIMITE_DE_LINHAS - 1}`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o executar-task que não aponta
- if (!skill.includes(LICOES)) falhas.push(`${EXECUTAR_TASK} não aponta para ${LICOES}, onde os casos foram`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o executar-task que não aponta
- if (!skill.includes(MODELO_DA_TAREFA)) falhas.push(`${EXECUTAR_TASK} não aponta para ${MODELO_DA_TAREFA}, onde está a autoconferência`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o documento de lições encurtado
- if (linhas.length < MINIMO_DE_LICOES) falhas.push(`${LICOES} tem ${linhas.length} lições, e a conferência espera ao menos ${MINIMO_DE_LICOES}`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › lição sem data
- if (!DATA_DA_LICAO.test(colunas[0] ?? '')) falhas.push(`${LICOES}, lição ${i + 1}: a data ${JSON.stringify(colunas[0] ?? '')} não é AAAA-MM-DD`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › lição sem data
- if ((colunas[1] ?? '') === '') falhas.push(`${LICOES}, lição ${i + 1}: sem origem`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › lição sem data
- if ((colunas[2] ?? '') === '') falhas.push(`${LICOES}, lição ${i + 1}: sem o que aconteceu`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › lição sem data
- if ((colunas[3] ?? '') === '') falhas.push(`${LICOES}, lição ${i + 1}: sem o lugar onde a regra ficou`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o modelo sem a seção
- if (corpo === null) return { falhas: [`${MODELO_DA_TAREFA} não tem a seção "${TITULO_DA_AUTOCONFERENCIA}"`], perguntas: 0 }
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › treze perguntas
- if (perguntas > MAXIMO_DE_PERGUNTAS) falhas.push(`${MODELO_DA_TAREFA}: a autoconferência tem ${perguntas} perguntas, e o limite é ${MAXIMO_DE_PERGUNTAS}`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › nove perguntas
- if (perguntas < MINIMO_DE_PERGUNTAS) falhas.push(`${MODELO_DA_TAREFA}: a autoconferência tem ${perguntas} perguntas, e a conferência espera ao menos ${MINIMO_DE_PERGUNTAS}`)
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o arquivo de hoje está abaixo de 500 linhas
- const DATA_DA_LICAO = /^(?:até )?\d{4}-\d{2}-\d{2}(?: e \d{4}-\d{2}-\d{2})?$/
+ const DATA_DA_LICAO = /^\d{4}-\d{2}-\d{2}(?: e \d{4}-\d{2}-\d{2})?$/
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o arquivo de hoje está abaixo de 500 linhas
- const DATA_DA_LICAO = /^(?:até )?\d{4}-\d{2}-\d{2}(?: e \d{4}-\d{2}-\d{2})?$/
+ const DATA_DA_LICAO = /^(?:até )?\d{4}-\d{2}-\d{2}$/
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o arquivo de hoje está abaixo de 500 linhas
- .filter((colunas) => colunas[0] !== 'Data' && !/^-+$/.test(colunas[0] ?? ''))
+ .filter((colunas) => !/^-+$/.test(colunas[0] ?? ''))
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o arquivo de hoje está abaixo de 500 linhas
- .filter((colunas) => colunas[0] !== 'Data' && !/^-+$/.test(colunas[0] ?? ''))
+ .filter((colunas) => colunas[0] !== 'Data')
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | Um teste que procure nas skills uma segunda tabela "Se a tarefa..." ou "Se a spec..." com a coluna de guardião | Retro desta funcionalidade (o próprio revisor a deixou para lá); é teste novo, fora da lista de testes da tarefa |
| conformidade-reviewer (1ª) | Uma pergunta da regra 70 na autoconferência (algum caminho grava `Nota` sem `lancadaPor`, ou alguma saída em discursiva ou redação sugere nota?) | Retro: o teto de doze perguntas é da tarefa, e a pergunta 12 já manda abrir a lista dos guardiões marcados |
| test-engineer (1ª) | 3: "as doze perguntas" escrito por extenso no `executar-task`, e o teste aceita de 10 a 12 | Retro: a faixa de 10 a 12 e o texto do `executar-task` vêm da spec; mudá-la é decisão de spec, não de correção |
| test-engineer (1ª) | 5: `docs/aia/ouro-retido/README.md:4` ainda manda commitar com `(ouro: <política>)` | `TODO.md`: o arquivo não é da tarefa (a 18.0 só resolveu a pasta vizinha, `docs/aia/ouro/`) |
| test-engineer (1ª) | 6: nenhum teste cobre as linhas da tabela de contradições nem o `git commit -F` | Retro: a tabela de testes da tarefa não os pede |
| revisor-geral (1ª) | `validador.md:131` alterado aqui, e a 19.0 também o tem nos arquivos previstos | 19.0: é uma linha só e não conflita; registro para quem a fizer |
| revisor-geral (2ª) | `.claude/rules/80-infra-e-carga.md:65`: a nota diz que as duas métricas saem de `observarPoolDoBanco` e da leitura de sessão em `apps/api/src/main.ts`; só `observarPoolDoBanco` está no `main.ts`, e `sessao.leitura.duracao` é medida em `packages/nucleo/src/identidade/guarda-sessao.ts`, com o nome em `packages/nucleo/src/telemetria/metricas.ts:120`. Corrigir o caminho na nota | `TODO.md`: a nota é transitória, até a N2 da X5 fechar, e a correção do caminho vai junto com o fechamento dela |
| revisor-geral (2ª) | `techspec.md`, parágrafo 18.3: a última frase diz que o `pedagogia-reviewer` mudou "só a frase 'para a validação e a retro'", e duas linhas antes o mesmo parágrafo o põe entre os quatro que ganharam o bloco das fotos em três parágrafos. Tirá-lo dessa frase, ou dizer que ele também ganhou o bloco | `TODO.md`: ajuste de texto da spec, sem efeito em teste nem em comportamento; entra com a próxima edição do §9 (19.0) |
| test-engineer (2ª) | O apontamento do `executar-task` ficou só no caminho do `task-template.md` (`revisores.test.ts:265`); se o `SKILL.md` citar o modelo por outro motivo e perder a frase que manda para a seção, o teste continua verde. Exigir os dois, ou o caminho junto com o título da seção | Retro desta funcionalidade: o limite de 500 linhas segura o essencial, e a mudança é de cláusula de teste, fora do que a tarefa pede |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 01:12:43 | 2026-10-24 01:13:07 | `tenancy-guardian` | 1 | APROVADO | a0d82b3f30a7062a9 |
| 2026-10-24 01:12:46 | 2026-10-24 01:13:28 | `privacy-guardian` | 1 | APROVADO | a18c02986850b0e8f |
| 2026-10-24 01:13:00 | 2026-10-24 01:13:31 | `infra-guardian` | 1 | APROVADO | a279cc0b1b8a20d16 |
| 2026-10-24 01:12:50 | 2026-10-24 01:13:41 | `conformidade-reviewer` | 1 | APROVADO | ab2c81b2eb2782671 |
| 2026-10-24 01:12:56 | 2026-10-24 01:15:06 | `revisor-geral` | 1 | REPROVADO | ae755c02d2c867a14 |
| 2026-10-24 01:12:53 | 2026-10-24 01:16:20 | `test-engineer` | 1 | APROVADO | a9cae5929d0a6fd19 |
| 2026-10-24 01:22:32 | 2026-10-24 01:23:10 | `revisor-geral` | 2 | APROVADO | a930e264c68ac6b0d |
| 2026-10-24 01:22:40 | 2026-10-24 01:23:21 | `test-engineer` | 2 | APROVADO | a9c6c913cbaf26cd5 |

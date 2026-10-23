# Tarefa 1.0 — Os rótulos que o hook lê ficam provados nos modelos, e o papel chega ao Bash

**Funcionalidade:** harness (X7) · **Depende de:** nenhuma
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Um rótulo que o hook ou o `estado.ts` leem, tirado de um modelo de documento, deixa a esteira vermelha dizendo qual; e
fica provado, numa sessão real, que `CLAUDE_CODE_AGENT` chega ao Bash do papel e do subagente, a premissa do hook
nativo (11.0).

## Contexto necessário

- `techspec.md` §1 (trilha 1), §10 e §12 (a primeira premissa)
- `prd.md` RF12
- `cenarios.md` seção B, **RF12**
- Código: `tools/processo/revisoes.ts` (`REVISORES_COM_VETO`, `REVISORES_SEM_VETO`, `PAPEIS_DO_TIME` e as expressões
  que leem `**Subagentes obrigatórios:**`, `Revisões:`, `## Mutações`); `tools/processo/estado.ts` (`lerPorte`,
  `lerDependencias`, `lerParalelismo`, `lerValidacao`): cada rótulo que eles procuram
- Modelos: `.claude/skills/criar-tasks/task-template.md`, `.claude/skills/criar-tasks/tasks-template.md`,
  `.claude/skills/validar/template.md` e o bloco do formato em `.claude/skills/revisar-spec/SKILL.md`

## Subtarefas

- [x] 1.1 — Exportar, de `revisoes.ts` e `estado.ts`, como constante, cada rótulo que hoje está só dentro de uma expressão
  regular, sem mudar o que a expressão casa
- [x] 1.2 — `tools/processo/harness/rotulos.test.ts`: cada rótulo exportado existe no modelo onde ele é escrito; cada
  nome de revisor citado em `task-template.md` está em `REVISORES_COM_VETO`, em `REVISORES_SEM_VETO` ou é o
  `revisor-geral`
- [x] 1.3 — Prova da premissa: numa sessão `claude --agent implementador`, rodar `printenv CLAUDE_CODE_AGENT` no Bash
  e, dentro dela, num subagente (`revisor-geral`). Copiar as duas saídas para a seção "Prova da premissa" abaixo. Se
  uma vier vazia, parar: é divergência da Tech Spec (§12), e a 11.0 depende dela
- [x] 1.4 — Testes

## Prova da premissa

Preenchida por quem implementa (1.3). Em 23/10/2026, no checkout `educaia--specharness--l1`.

**O papel.** Nesta sessão, iniciada pelo Orquestrador com `claude --agent implementador`, o Bash do Implementador:

```
$ printenv CLAUDE_CODE_AGENT
implementador
```

**O subagente.** O Implementador não pode chamar subagente (`disallowedTools: Agent`), e o `revisor-geral` só nasce
dentro de um papel que pode. A sonda foi `claude -p --agent mesa-de-revisao --allowedTools="Bash(printenv CLAUDE_CODE_AGENT)"`,
com o prompt pela entrada padrão: a Mesa chamou o `revisor-geral` (Bash, modelo Opus) e rodou o mesmo comando ela mesma.

```
subagente: mesa-de-revisao
mesa: mesa-de-revisao
```

Conclusão: a variável **chega ao Bash do papel e do subagente, nunca vazia**. O valor no subagente é o do **papel do
terminal que o chamou** (`mesa-de-revisao`), e não o nome do subagente (`revisor-geral`). Para o hook nativo (11.0) basta:
ele pergunta se o valor está em `PAPEIS_DO_TIME`. Só a Mesa foi sondada; que o subagente de outro papel (o Arquiteto)
herda o dele **não foi medido**. A 11.0 não deve supor `CLAUDE_CODE_AGENT=revisor-geral`. O
Orquestrador (sem `--agent`) não tem a variável, e por isso o hook não age nele. Duas tentativas anteriores da sonda foram
barradas pelo pedido de aprovação do `-p` (o `$?` e o `printenv` sem liberação), antes de o comando rodar; não são
resultado.

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/harness/rotulos.test.ts` | novo |
| `tools/processo/revisoes.ts` | alterado (só exporta constantes) |
| `tools/processo/estado.ts` | alterado (só exporta constantes) |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| um rótulo tirado de cada um dos quatro modelos, numa cópia em pasta temporária | unidade | vermelho, com o rótulo e o modelo |
| nome de revisor inventado num `task-template.md` de amostra | unidade | vermelho |
| os modelos de hoje | unidade | verde, com contagem mínima de rótulos achados (zero achados é vermelho) |
| quem contorna é acusado: o rótulo com outra caixa ou sem os asteriscos | unidade | vermelho |
| a guarda reprova quando o alvo dela não existe: modelo ausente | unidade | vermelho |

## Como testar

- Precedente: `tools/processo/estado.test.ts › lerTarefas e dependências › lê a coluna "Pode correr em paralelo com", que é a autorização do Arquiteto` — monta texto de `tasks.md` à mão; aqui o texto vem do modelo lido do disco, e a amostra quebrada é cópia em `mkdtempSync`.
- A lista de rótulos vem das constantes importadas, nunca redigitada no teste.
- Rodar: `npx vitest run --project unidade tools/processo/harness/rotulos.test.ts`.
- A 1.1 não muda comportamento: `revisoes.test.ts` e `estado.test.ts` passam sem alteração.

## Fora do escopo desta tarefa

Partir o `revisoes.ts` (2.0); o hook nativo (11.0); os outros testes do harness (15.0, 16.0, 19.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A sonda do subagente (1.3) foi por `claude -p --agent mesa-de-revisao`, e não dentro da sessão do Implementador | O Implementador não pode chamar subagente (`disallowedTools: Agent`); o valor medido no subagente é o papel do terminal que o chamou | `techspec.md` §12, primeira premissa (ainda "NÃO VERIFICADO"; a Tech Spec é do Arquiteto, e o Orquestrador a leva a ele antes da 11.0); medido em "Prova da premissa" acima |

## Mutações

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- export const ROTULO_DO_PORTE = '**Porte:**'
+ export const ROTULO_DO_PORTE = '**Porte**:'
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- export const TITULO_DA_TABELA_DE_DEPENDENCIAS = '## Dependências e paralelismo'
+ export const TITULO_DA_TABELA_DE_DEPENDENCIAS = '## Dependencias e paralelismo'
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- export const TITULO_DA_RODADA_DA_VALIDACAO = '## Rodada '
+ export const TITULO_DA_RODADA_DA_VALIDACAO = '## Rodada: '
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- export const ROTULO_DO_ESCOPO = '**Escopo:**'
+ export const ROTULO_DO_ESCOPO = '**Escopo**:'
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- export const ROTULO_DO_VEREDITO = '**Veredito: '
+ export const ROTULO_DO_VEREDITO = '**Parecer: '
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- export const VEREDITOS_DA_VALIDACAO: readonly VereditoDaValidacao[] = ['APROVADA COM RESSALVAS', 'APROVADA', 'REPROVADA']
+ export const VEREDITOS_DA_VALIDACAO: readonly VereditoDaValidacao[] = ['APROVADA COM RESSALVAS', 'APROVADA', 'RECUSADA']
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/harness/rotulos.test.ts › a coluna "Depende de" trocada
- dependeDe: { posicao: 2, titulo: 'Depende de' },
+ dependeDe: { posicao: 3, titulo: 'Depende de' },
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- paralelo: { posicao: 3, titulo: 'Pode correr em paralelo com' },
+ paralelo: { posicao: 4, titulo: 'Pode correr em paralelo com' },
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/estado.test.ts
- const escaparTexto = (texto: string): string => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
+ const escaparTexto = (texto: string): string => texto.replace(/[.*+?^${}()|[\]\\]/g, '$&')
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/estado.test.ts
- const ESCOPO_DE_TAREFA = new RegExp(`^${escaparTexto(ROTULO_DO_ESCOPO)}\\s*tarefa\\b`, 'im')
+ const ESCOPO_DE_TAREFA = new RegExp(`^${escaparTexto(ROTULO_DO_ESCOPO)}\\s*funcionalidade\\b`, 'im')
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/estado.test.ts
- const VEREDITO_DA_SPEC_APROVADA = new RegExp(`^${escaparTexto(ROTULO_DO_VEREDITO)}APROVADA\\*\\*`, 'm')
+ const VEREDITO_DA_SPEC_APROVADA = new RegExp(`^${escaparTexto(ROTULO_DO_VEREDITO)}REPROVADA\\*\\*`, 'm')
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/estado.test.ts
- const VEREDITO_DA_VALIDACAO = new RegExp(`^${escaparTexto(ROTULO_DO_VEREDITO)}(${VEREDITOS_DA_VALIDACAO.join('|')})\\*\\*(.*)$`, 'm')
+ const VEREDITO_DA_VALIDACAO = new RegExp(`^${escaparTexto(ROTULO_DO_VEREDITO)}(${VEREDITOS_DA_VALIDACAO.join(',')})\\*\\*(.*)$`, 'm')
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/estado.test.ts
- return lerColunaDeTarefas(conteudoTasks, COLUNAS_DE_DEPENDENCIAS.dependeDe.posicao)
+ return lerColunaDeTarefas(conteudoTasks, COLUNAS_DE_DEPENDENCIAS.paralelo.posicao)
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/estado.test.ts
- return lerColunaDeTarefas(conteudoTasks, COLUNAS_DE_DEPENDENCIAS.paralelo.posicao)
+ return lerColunaDeTarefas(conteudoTasks, COLUNAS_DE_DEPENDENCIAS.dependeDe.posicao)
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/estado.test.ts
- const rodadas = conteudo.split(new RegExp(`^(?=${escaparTexto(TITULO_DA_RODADA_DA_VALIDACAO)})`, 'm')).filter((rodada) => !ESCOPO_DE_TAREFA.test(rodada))
+ const rodadas = conteudo.split(new RegExp(`^(?=${escaparTexto(TITULO_DA_RODADA_DA_VALIDACAO)})`, '')).filter((rodada) => !ESCOPO_DE_TAREFA.test(rodada))
```

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- export const ROTULO_DOS_SUBAGENTES = '**Subagentes obrigatórios:**'
+ export const ROTULO_DOS_SUBAGENTES = '**Subagentes obrigatorios:**'
```

```mutacao
arquivo: tools/processo/revisoes.ts
teste: tools/processo/revisoes.test.ts
- const linha = conteudoTarefa.split(ROTULO_DOS_SUBAGENTES)[1]?.split('\n')[0] ?? ''
+ const linha = conteudoTarefa.split(ROTULO_DOS_SUBAGENTES)[1]?.split('\n')[1] ?? ''
```

```mutacao
arquivo: .claude/skills/criar-tasks/task-template.md
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- **Subagentes obrigatórios:** `...`
```

```mutacao
arquivo: .claude/skills/criar-tasks/task-template.md
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- **Porte:** pequeno | grande
```

```mutacao
arquivo: .claude/skills/criar-tasks/tasks-template.md
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- ## Dependências e paralelismo
```

```mutacao
arquivo: .claude/skills/validar/template.md
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- **Escopo:** funcionalidade completa | tarefa N.0
```

```mutacao
arquivo: .claude/skills/validar/template.md
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- **Veredito: APROVADA | APROVADA COM RESSALVAS | REPROVADA**
```

```mutacao
arquivo: .claude/skills/revisar-spec/SKILL.md
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- **Veredito: APROVADA | REPROVADA**
```

```mutacao
arquivo: tools/processo/harness/rotulos.test.ts
teste: tools/processo/harness/rotulos.test.ts › rótulo fora do começo da linha
- const achou = rotulo.noInicioDaLinha ? alvo.split('\n').some((linha) => linha.startsWith(rotulo.texto)) : alvo.includes(rotulo.texto)
+ const achou = alvo.includes(rotulo.texto)
```

```mutacao
arquivo: tools/processo/harness/rotulos.test.ts
teste: tools/processo/harness/rotulos.test.ts › modelo ausente: vermelho, dizendo qual
- if (alvo === undefined) continue
```

```mutacao
arquivo: tools/processo/harness/rotulos.test.ts
teste: tools/processo/harness/rotulos.test.ts › o bloco do formato do /revisar-spec some
- if (bloco === null) falhas.push(`bloco do formato não achado em ${MODELOS.spec} (seção "Consolidar")`)
```

```mutacao
arquivo: tools/processo/harness/rotulos.test.ts
teste: tools/processo/harness/rotulos.test.ts › nome de revisor inventado na linha
- for (const nome of nomes.filter((achado) => !REVISORES_CONHECIDOS.has(achado))) {
+ for (const nome of nomes.filter(() => false)) {
```

```mutacao
arquivo: tools/processo/harness/rotulos.test.ts
teste: tools/processo/harness/rotulos.test.ts › nome com cara de revisor citado fora
- const SUFIXO_DE_REVISOR = /\b[a-z]+(?:-[a-z]+)*-(?:guardian|reviewer|engineer|integrator|geral)\b/g
+ const SUFIXO_DE_REVISOR = /\b[a-z]+(?:-[a-z]+)*-(?:reviewer|engineer|integrator|geral)\b/g
```

```mutacao
arquivo: tools/processo/harness/rotulos.test.ts
teste: tools/processo/harness/rotulos.test.ts › os modelos de hoje passam
- const daLinha = [...linha.matchAll(/`([^`]+)`/g)].map((achado) => achado[1] ?? '').filter((nome) => !/^\.+$/.test(nome))
+ const daLinha = [...linha.matchAll(/`([^`]+)`/g)].map((achado) => achado[1] ?? '')
```

```mutacao
arquivo: tools/processo/harness/rotulos.test.ts
teste: tools/processo/harness/rotulos.test.ts › lista de tarefas sem o formato
- if (numeros.length < 2) falhas.push(`lerTarefas acha ${numeros.length} tarefas em ${MODELOS.lista}, e o modelo traz duas`)
```

```mutacao
arquivo: tools/processo/harness/rotulos.test.ts
teste: tools/processo/harness/rotulos.test.ts › tabela de dependências cujas linhas
- if (lerDependencias(lista).size < 2) falhas.push(`a tabela de dependências de ${MODELOS.lista} não tem as duas linhas de exemplo no formato N.0`)
```

```mutacao
arquivo: tools/processo/harness/rotulos.test.ts
teste: tools/processo/harness/rotulos.test.ts › veredito que o código lê tirado
- for (const lido of VEREDITOS_DA_VALIDACAO.filter((nome) => !veredito.includes(nome))) {
+ for (const lido of VEREDITOS_DA_VALIDACAO.filter((nome) => !veredito.includes(nome)).slice(1)) {
```

```mutacao
arquivo: tools/processo/harness/rotulos.test.ts
teste: tools/processo/harness/rotulos.test.ts › linha de veredito do bloco da spec sem APROVADA
- if (!bloco.split('\n').some((linha) => linha.startsWith(ROTULO_DO_VEREDITO) && linha.includes('APROVADA'))) {
+ if (!bloco.split('\n').some((linha) => linha.startsWith(ROTULO_DO_VEREDITO))) {
```

```mutacao
arquivo: tools/processo/harness/rotulos.test.ts
teste: tools/processo/harness/rotulos.test.ts › bloco `mutacao` sem a linha
- if (mutacoes.mutacoes.length === 0) {
+ if (mutacoes.mutacoes.length === 99) {
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | `revisoes.ts` lê o rótulo dos subagentes por `split` e o `estado.ts` por `escaparTexto` com `RegExp`: "Vale unificar na 2.0, que já vai partir este arquivo." | Tarefa 2.0 (parte o `revisoes.ts`) |
| revisor-geral (1ª) | `rotulos.test.ts`: `aposRotulo` copia à mão a leitura de `revisoresObrigatorios`; "Se a 2.0 exportar essa leitura, o teste pode usá-la" | Tarefa 2.0 |
| revisor-geral (1ª) e test-engineer (1ª) | `techspec.md` §12: a primeira premissa ainda diz "NÃO VERIFICADO"; falta registrar que no subagente o valor é o papel do terminal que o chamou, não o nome do subagente (a 11.0 não deve supor `CLAUDE_CODE_AGENT=revisor-geral`) | A Tech Spec é do Arquiteto e fora do escopo desta tarefa: o Orquestrador leva ao Arquiteto antes de abrir a 11.0. O fato já está em "Prova da premissa" |
| test-engineer (1ª) | A mutação do `escaparTexto` fica vermelha por expressão inválida no carregamento, e não por leitura errada; "Um rótulo com `.` ou `(` provaria isso, se algum dia entrar." | Recusada: nenhum rótulo de hoje tem metacaractere; vale quando entrar um |
| revisor-geral (2ª) e test-engineer (2ª) | "Quando a 11.0 for desenhada, vale sondar o subagente chamado pelo Arquiteto, que não foi medido." | Tarefa 11.0 (ou o Arquiteto, ao atualizar o §12): repetir a sonda com `claude -p --agent arquiteto` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 14:24:09 | 2026-10-23 14:25:07 | `revisor-geral` | 1 | APROVADO | aa85cea7b86d93700 |
| 2026-10-23 14:24:08 | 2026-10-23 14:26:07 | `test-engineer` | 1 | APROVADO | ab8bf62513bd7833f |
| 2026-10-23 14:32:13 | 2026-10-23 14:32:40 | `test-engineer` | 2 | APROVADO | ad408b4ea36016995 |
| 2026-10-23 14:32:24 | 2026-10-23 14:32:50 | `revisor-geral` | 2 | APROVADO | ae03d559abd0cdb82 |

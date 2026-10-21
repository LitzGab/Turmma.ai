# Tarefa 1.0 — O `ouro` é lido, selado e medido, sem mudar regra

**Funcionalidade:** reengenharia · **Depende de:** nenhuma (o `ouro` está no commit `400dc42`)
**Subagentes obrigatórios:** `conformidade-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

As seis políticas passam a ser medidas a cada portão contra o `ouro` selado, sem mudar regra: a `base` de 21/10 se
reproduz exatamente, e o piso das três políticas desta tarefa liga.

## Contexto necessário

- `onda-0.md` §2.1 e §2.2, "A base já existe"
- `techspec.md` §7b e §10; `prd.md` RF1 e RF2
- `docs/aia/ouro/README.md`, seção "Como medir" (a função e a entrada de cada política), e `MEDIDAS.json`
- `.claude/rules/70-conformidade-cne.md` (itens 2a e 6a) e `40-testes.md` ("Testar coisa que é probabilística")
- Código, só leitura (diff vazio): `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` (:197, :201, :215) e
  `propor-ferramenta.ts` (:248, :286)

## Subtarefas

- [x] 1.1 — Leitores zod estritos do corpus e do `MEDIDAS` em `__fixtures__/ouro.ts`, raiz por `import.meta.url`
- [x] 1.2 — `selo-do-ouro.test.ts`: sha256 de todo arquivo menos o `SELO.json`, e o mesmo conjunto de nomes
- [x] 1.3 — `ouro.test.ts`: o mapeamento do README, a `base` reproduzida por categoria, o piso de `assuntoDelicado`,
  `pedidoDeRespostaPronta` e `saidaComNota`; as outras três só medidas e impressas
- [x] 1.4 — Testes: leitor, reprodução, comparador e selo, como na tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ia/__fixtures__/ouro.ts` | novo |
| `packages/nucleo/src/ia/ouro.test.ts` | novo |
| `packages/nucleo/src/ia/selo-do-ouro.test.ts` | novo |

## Testes que provam a regra

Definidos com o `test-engineer`. Leitor: corpus e `MEDIDAS` em memória; selo: cópia temporária da pasta.

| Cenário | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Os seis arquivos lidos com as contagens de `onda-0.md` §2.1 | unidade | descartar amostra com `contexto` |
| Amostra com campo a mais é recusada | unidade | `z.object` no lugar de `z.strictObject` |
| `fonte` fora de `sintetica`/`revisor` é recusada | unidade | `fonte: z.string()` |
| `esperado` fora de `casa`/`nao_casa` é recusado | unidade | `esperado: z.string()` |
| `contexto` com chave fora das quatro do README é recusado | unidade | `contexto` não estrito |
| Chave de alvo desconhecida no `MEDIDAS` é recusada | unidade | alvo não estrito |
| Categoria do alvo inexistente no corpus é recusada | unidade | não cruzar a categoria com o corpus |
| Id de `medidoSem` que não existe é recusado | unidade | idem, para os ids |
| `base: null` sem `semBaseAte` é recusada | unidade | `nullable()` sem o refinamento |
| `base: null` depois da tarefa de `semBaseAte` fica vermelha | unidade | ignorar `semBaseAte` |
| Política nova com alvo `nao_cair_da_base` é recusada | unidade | aceitar a string em toda política |
| `riscoAVida` reproduz a base (16/75, 0,593), com `ameaca_a_terceiro` à parte (1/7) | unidade | contar a ameaça no recall |
| `assuntoDelicado` reproduz a base por categoria | unidade | tirar `(morreu\|faleceu)` de `turno-do-tutor.ts:112` |
| `pedidoDeRespostaPronta`: `comQuestao` vira `questao` definida | unidade | `questao: undefined` sempre |
| `pedidoDeRespostaPronta`: `turnoAnteriorDoAluno` vira o último turno do aluno | unidade | não passar `turnosAnteriores` |
| `julgamentoDeTextoDeAluno` reproduz sem JT-001 a JT-012 (45 positivas) | unidade | não filtrar `medidoSem` |
| `julgamentoDeTextoDeAluno`: `turnosDoProfessor` viram turnos do professor | unidade | `turnosAnteriores: []` |
| `saidaComNota` reproduz a base | unidade | tirar `SAIDA_COM_CONCEITO_EM_LETRA` |
| O comparador reprova diferença para cima (+1 fabricado) | unidade | comparar com `>=` |
| Queda numa categoria com o total igual reprova | unidade | comparar só o total |
| Falso positivo novo numa `nao_casa` é queda | unidade | `/\bmae\b/` em `GATILHOS_DE_ASSUNTO_DELICADO` |
| A pasta real confere com o `SELO.json` | unidade | incluir o `SELO.json` no cálculo |
| Byte trocado, arquivo a mais e a menos: cada um vermelho | unidade | comparar só os nomes; percorrer só as chaves do selo |
| A raiz resolvida de uma URL de módulo fabricada é `<raiz>/docs/aia/ouro` | unidade | `process.cwd()` |

Concorrência, isolamento e log não se aplicam: só leitura de arquivo.

## Como testar

- Molde da mensagem que diz quais amostras erraram, por id:
  `packages/nucleo/src/ia/tarefas/numeros.test.ts › a regra acerta a taxa declarada sobre as amostras fixas, nos dois
  sentidos, e o teste diz quais errou`
- Cópia temporária: `mkdtempSync(join(tmpdir(), …))`, como em `tools/processo/mutacoes.test.ts:188`
- Rodar: `npx vitest run --project unidade packages/nucleo/src/ia/ouro.test.ts packages/nucleo/src/ia/selo-do-ouro.test.ts`
- Armadilhas: nunca mexa em `docs/aia/ouro/`; medida que não reproduz a base é defeito do leitor ou do mapeamento;
  nenhum `.skip` nem `.todo` nas três medidas sem alvo

## Fora do escopo desta tarefa

Padrão novo (2.0, 3.0); levar o selo para `conformidade/` (29.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A mutação do falso positivo novo é `/\bmae\b/`, e não `/\bmateria\b/` | nenhuma amostra do `ouro` tem `matéria`: o padrão não tira acerto de categoria nenhuma. `mãe` está em AD-046 (`duvida_da_materia`), que hoje passa, e vira falso positivo | só na tabela de testes desta tarefa; a Tech Spec e o `cenarios.md` não citam a mutação |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a raiz resolvida de uma URL
- return fileURLToPath(new URL('../../../../../docs/aia/ouro', urlDoModulo))
+ return join(process.cwd(), 'docs/aia/ouro')
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › toda chave a mais é recusada
- const fechado = z.strictObject
+ const fechado = z.object
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › id fora do formato
- id: z.string().regex(/^[A-Z]{2}-\d{3}$/),
+ id: z.string(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › esperado fora de casa
- esperado: z.enum(['casa', 'nao_casa']),
+ esperado: z.string(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › fonte fora de sintetica
- fonte: z.enum(['sintetica', 'revisor']),
+ fonte: z.string(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o arquivo de outra política
- politica: z.literal(politica),
+ politica: z.string(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › id repetido
- if (vistos.has(amostra.id)) contexto.addIssue({ code: 'custom', message: `o id ${amostra.id} aparece duas vezes` })
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › categoria com mais certos que total
- }).refine((contagem) => contagem.certos <= contagem.total, { message: 'certos passa do total' })
+ }).refine(() => true, { message: 'certos passa do total' })
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › recall e precisão fora de zero a um
- const proporcao = z.number().min(0).max(1)
+ const proporcao = z.number()
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o piso fora do alvo só aceita
- pisoForaDoAlvo: z.record(z.string(), naoCairDaBase),
+ pisoForaDoAlvo: z.record(z.string(), z.string()),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › erraPara só aceita mais
- erraPara: z.literal('mais'),
+ erraPara: z.string(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › semBaseAte só aceita
- const tarefaDoDocumento = z.string().regex(/^\d+\.0$/)
+ const tarefaDoDocumento = z.string()
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › é nao_cair_da_base, e nenhum outro texto
- assuntoDelicado: fechado({ base: esquemaBase, alvo: naoCairDaBase }),
+ assuntoDelicado: fechado({ base: esquemaBase, alvo: z.string() }),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › é nao_cair_da_base, e nenhum outro texto
- pedidoDeRespostaPronta: fechado({ base: esquemaBase, alvo: naoCairDaBase }),
+ pedidoDeRespostaPronta: fechado({ base: esquemaBase, alvo: z.string() }),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › é nao_cair_da_base, e nenhum outro texto
- saidaComNota: fechado({ base: esquemaBase, alvo: naoCairDaBase }),
+ saidaComNota: fechado({ base: esquemaBase, alvo: z.string() }),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › base nula só vale em saidaQualitativa
- assuntoDelicado: fechado({ base: esquemaBase, alvo: naoCairDaBase }),
+ assuntoDelicado: fechado({ base: esquemaBase.nullable(), alvo: naoCairDaBase }),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › base nula só vale em saidaQualitativa
- saidaComNota: fechado({ base: esquemaBase, alvo: naoCairDaBase }),
+ saidaComNota: fechado({ base: esquemaBase.nullable(), alvo: naoCairDaBase }),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › política nova com alvo nao_cair_da_base
- alvo: fechado({ recall: proporcao, legitimasBarradas: z.number().int().min(0) }),
+ alvo: z.union([naoCairDaBase, fechado({ recall: proporcao, legitimasBarradas: z.number().int().min(0) })]),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › base nula sem semBaseAte
- }).refine((medida) => medida.base !== null || medida.semBaseAte !== undefined, { message: 'base nula só com semBaseAte' }),
+ }).refine(() => true, { message: 'base nula só com semBaseAte' }),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a tarefa concluída se lê da lista de tarefas
- return (tarefa) => new RegExp(String.raw`^- \[x\] \*\*${tarefa.replace('.', String.raw`\.`)} `, 'm').test(lista)
+ return (tarefa) => new RegExp(String.raw`^- \[x\] \*\*${tarefa.replace('.', String.raw`\.`)} `).test(lista)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a tarefa concluída se lê da lista de tarefas
- return (tarefa) => new RegExp(String.raw`^- \[x\] \*\*${tarefa.replace('.', String.raw`\.`)} `, 'm').test(lista)
+ return (tarefa) => new RegExp(String.raw`^- \[[x ]\] \*\*${tarefa.replace('.', String.raw`\.`)} `, 'm').test(lista)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a tarefa concluída se lê da lista de tarefas
- return (tarefa) => new RegExp(String.raw`^- \[x\] \*\*${tarefa.replace('.', String.raw`\.`)} `, 'm').test(lista)
+ return (tarefa) => new RegExp(String.raw`^- \[x\] \*\*\d*${tarefa.replace('.', String.raw`\.`)} `, 'm').test(lista)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a tarefa concluída se lê da lista de tarefas
- return (tarefa) => new RegExp(String.raw`^- \[x\] \*\*${tarefa.replace('.', String.raw`\.`)} `, 'm').test(lista)
+ return (tarefa) => new RegExp(String.raw`^- \[x\] \*\*${tarefa} `, 'm').test(lista)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › lerMedidas lê a lista de tarefas
- const raizDoRepositorio = (raiz: string): string => join(raiz, '../../..')
+ const raizDoRepositorio = (raiz: string): string => join(raiz, '../..')
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › categoria e id do MEDIDAS que não existem no corpus
- for (const categoria of categorias) if (!existentes.has(categoria)) falhas.push(`${politica}: ${onde} cita a categoria ${categoria}, que não existe no corpus`)
+ for (const categoria of categorias) void categoria
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › categoria e id do MEDIDAS que não existem no corpus
- if (base !== null) confere(politica, 'a base', Object.keys(base.porCategoria))
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › categoria e id do MEDIDAS que não existem no corpus
- confere('riscoAVida', 'perdaMaxima', Object.keys(medidas.riscoAVida.alvo.perdaMaxima))
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › categoria e id do MEDIDAS que não existem no corpus
- confere('riscoAVida', 'foraDoAlvo', medidas.riscoAVida.foraDoAlvo)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › categoria e id do MEDIDAS que não existem no corpus
- confere('riscoAVida', 'pisoForaDoAlvo', Object.keys(medidas.riscoAVida.pisoForaDoAlvo))
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › categoria e id do MEDIDAS que não existem no corpus
- confere('julgamentoDeTextoDeAluno', 'semCasar', julgamento.semCasar)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › categoria e id do MEDIDAS que não existem no corpus
- confere('julgamentoDeTextoDeAluno', 'naoCairDaBase', julgamento.naoCairDaBase)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › categoria e id do MEDIDAS que não existem no corpus
- for (const id of julgamento.medidoSem) if (!idsDoJulgamento.has(id)) falhas.push(`julgamentoDeTextoDeAluno: medidoSem cita o id ${id}, que não existe no corpus`)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › base nula depois da tarefa de semBaseAte
- if (qualitativa.base === null && qualitativa.semBaseAte !== undefined && tarefaConcluida(qualitativa.semBaseAte)) {
+ if (qualitativa.base === null && qualitativa.semBaseAte !== undefined && false) {
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › base nula depois da tarefa de semBaseAte
- if (qualitativa.base === null && qualitativa.semBaseAte !== undefined && tarefaConcluida(qualitativa.semBaseAte)) {
+ if (qualitativa.base === null && qualitativa.semBaseAte !== undefined && tarefaConcluida('0.0')) {
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › categoria e id do MEDIDAS que não existem no corpus
- if (falhas.length > 0) throw new OuroRecusado(falhas.join('\n'))
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › lerMedidas lê a lista de tarefas
- if (falhas.length > 0) throw new OuroRecusado(falhas.join('\n'))
+ if (falhas.length > 0) throw new Error(falhas.join('\n'))
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › conta o acerto de cada categoria
- if (barrada === (amostra.esperado === 'casa')) contagem.certos += 1
+ if (barrada) contagem.certos += 1
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a categoria fora do alvo conta por categoria
- if (foraDoAlvo.includes(amostra.categoria)) continue
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o recall é das casa, a precisão é do que foi barrado
- if (barrada) barradas += 1
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o recall é das casa, a precisão é do que foi barrado
- if (amostra.esperado === 'casa') {
+ if (true) {
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o recall é das casa, a precisão é do que foi barrado
- if (barrada) barradasDasPositivas += 1
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a função que não barra nada tem precisão zero
- precisao: arredondar(barradasDasPositivas / Math.max(barradas, 1)),
+ precisao: arredondar(barradasDasPositivas / barradas),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a função que não barra nada tem precisão zero
- recall: arredondar(barradasDasPositivas / Math.max(positivas, 1)),
+ recall: arredondar(barradasDasPositivas / positivas),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o recall é das casa, a precisão é do que foi barrado
- const arredondar = (valor: number): number => Math.round(valor * 1000) / 1000
+ const arredondar = (valor: number): number => valor
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a reprodução reprova diferença para cima
- if (esperada === undefined || atual === undefined || atual.certos !== esperada.certos || atual.total !== esperada.total) {
+ if (esperada === undefined || atual === undefined || atual.certos < esperada.certos || atual.total !== esperada.total) {
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a reprodução reprova diferença para cima
- if (esperada === undefined || atual === undefined || atual.certos !== esperada.certos || atual.total !== esperada.total) {
+ if (esperada === undefined || atual === undefined || atual.certos > esperada.certos || atual.total !== esperada.total) {
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a reprodução reprova o total diferente
- if (esperada === undefined || atual === undefined || atual.certos !== esperada.certos || atual.total !== esperada.total) {
+ if (esperada === undefined || atual === undefined || atual.certos !== esperada.certos) {
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a reprodução reprova categoria que falta
- for (const categoria of new Set([...Object.keys(base.porCategoria), ...Object.keys(medida.porCategoria)])) {
+ for (const categoria of new Set(Object.keys(medida.porCategoria))) {
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a reprodução reprova categoria que falta
- for (const categoria of new Set([...Object.keys(base.porCategoria), ...Object.keys(medida.porCategoria)])) {
+ for (const categoria of new Set(Object.keys(base.porCategoria))) {
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a reprodução reprova recall e precisão diferentes
- if (medida.recall !== base.recall) diferencas.push(`recall ${String(medida.recall)}, e a base diz ${String(base.recall)}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › a reprodução reprova recall e precisão diferentes
- if (medida.precisao !== base.precisao) diferencas.push(`precisão ${String(medida.precisao)}, e a base diz ${String(base.precisao)}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › queda numa categoria com o total igual reprova
- if (atual === undefined || atual.certos < esperada.certos) quedas.push(`${categoria}: ${dizContagem(atual)}, e a base diz ${dizContagem(esperada)}`)
+ if (atual === undefined || atual.certos !== esperada.certos) quedas.push(`${categoria}: ${dizContagem(atual)}, e a base diz ${dizContagem(esperada)}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › subir não é queda, e igual também não
- if (atual === undefined || atual.certos < esperada.certos) quedas.push(`${categoria}: ${dizContagem(atual)}, e a base diz ${dizContagem(esperada)}`)
+ if (atual === undefined || atual.certos <= esperada.certos) quedas.push(`${categoria}: ${dizContagem(atual)}, e a base diz ${dizContagem(esperada)}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › categoria da base que a medida não tem é queda
- if (atual === undefined || atual.certos < esperada.certos) quedas.push(`${categoria}: ${dizContagem(atual)}, e a base diz ${dizContagem(esperada)}`)
+ if (atual !== undefined && atual.certos < esperada.certos) quedas.push(`${categoria}: ${dizContagem(atual)}, e a base diz ${dizContagem(esperada)}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o medidoSem tira do julgamento as 12
- return amostras.filter((amostra) => !medidoSem.includes(amostra.id))
+ return amostras.filter(() => true)
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › turnoAnteriorDoAluno vira o último turno do aluno
- const turnosAnteriores: EntradaDoTutor['turnosAnteriores'] = anterior === undefined ? [] : [{ autor: 'aluno', texto: anterior }]
+ const turnosAnteriores: EntradaDoTutor['turnosAnteriores'] = []
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › turnoAnteriorDoAluno vira o último turno do aluno
- const turnosAnteriores: EntradaDoTutor['turnosAnteriores'] = anterior === undefined ? [] : [{ autor: 'aluno', texto: anterior }]
+ const turnosAnteriores: EntradaDoTutor['turnosAnteriores'] = [{ autor: 'aluno', texto: anterior ?? 'oi' }]
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › turnoAnteriorDoAluno vira o último turno do aluno
- const entrada = { duvida: amostra.texto, turnosAnteriores }
+ const entrada = { duvida: amostra.texto, turnosAnteriores: [] }
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › comQuestao verdadeiro vira questão definida
- return amostra.contexto?.comQuestao === true ? { ...entrada, questao: questaoEmAndamento } : entrada
+ return entrada
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › comQuestao verdadeiro vira questão definida
- return amostra.contexto?.comQuestao === true ? { ...entrada, questao: questaoEmAndamento } : entrada
+ return { ...entrada, questao: questaoEmAndamento }
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › comQuestao verdadeiro vira questão definida
- return amostra.contexto?.comQuestao === true ? { ...entrada, questao: questaoEmAndamento } : entrada
+ return amostra.contexto?.comQuestao !== false ? { ...entrada, questao: questaoEmAndamento } : entrada
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › turnosDoProfessor viram turnos do professor
- return (amostra.contexto?.turnosDoProfessor ?? []).map((texto) => ({ autor: 'professor', texto }))
+ return [].map((texto) => ({ autor: 'professor', texto }))
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › turnosDoProfessor viram turnos do professor
- return (amostra.contexto?.turnosDoProfessor ?? []).map((texto) => ({ autor: 'professor', texto }))
+ return (amostra.contexto?.turnosDoProfessor ?? []).map((texto) => ({ autor: 'assistente', texto }))
```

```mutacao
arquivo: packages/nucleo/src/ia/ouro.test.ts
teste: packages/nucleo/src/ia/ouro.test.ts › riscoAVida reproduz a base
- const foraDoAlvo = politica === 'riscoAVida' ? MEDIDAS.riscoAVida.foraDoAlvo : []
+ const foraDoAlvo: string[] = []
```

```mutacao
arquivo: packages/nucleo/src/ia/ouro.test.ts
teste: packages/nucleo/src/ia/ouro.test.ts › julgamentoDeTextoDeAluno reproduz a base
- const amostras = politica === 'julgamentoDeTextoDeAluno' ? semOsNaoMedidos(todas, MEDIDAS.julgamentoDeTextoDeAluno.alvo.medidoSem) : todas
+ const amostras = todas
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › assuntoDelicado reproduz a base por categoria
- /\b(meu|minha) (pai|mae|avo|irmao|irma|amigo|amiga|tio|tia|primo|prima) (morreu|faleceu)\b/,
+ /\b(meu|minha) (pai|mae|avo|irmao|irma|amigo|amiga|tio|tia|primo|prima) (morreu)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › assuntoDelicado não cai da base em nenhuma categoria
- /\b(to|tou|estou) (muito )?triste\b/,
+ /\b(to|tou|estou) (muito )?triste\b/,
+  /\bmae\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/ouro.test.ts › saidaComNota reproduz a base por categoria
- const SAIDA_COM_CONCEITO_EM_LETRA = /\b([Cc]onceito\b[:\s]+(final\s+)?|([Dd]aria|[Dd]ou|[Aa]tribuo|[Aa]tribuiria|[Mm]erece|[Mm]ereceria|[Tt]iraria|[Ff]icaria com)\s+(um|uma|o)?\s*)["“'‘]?[A-E][+-]?(?![\p{L}-])/u
+ const SAIDA_COM_CONCEITO_EM_LETRA = /\b(?!)/u
```

```mutacao
arquivo: packages/nucleo/src/ia/selo-do-ouro.test.ts
teste: packages/nucleo/src/ia/selo-do-ouro.test.ts › a pasta real confere com o SELO.json
- if (nome === ARQUIVO_DO_SELO) continue
```

```mutacao
arquivo: packages/nucleo/src/ia/selo-do-ouro.test.ts
teste: packages/nucleo/src/ia/selo-do-ouro.test.ts › arquivo a mais fica vermelho
- for (const nome of new Set([...Object.keys(jurado), ...Object.keys(atual)])) {
+ for (const nome of new Set(Object.keys(jurado))) {
```

```mutacao
arquivo: packages/nucleo/src/ia/selo-do-ouro.test.ts
teste: packages/nucleo/src/ia/selo-do-ouro.test.ts › arquivo a menos fica vermelho
- for (const nome of new Set([...Object.keys(jurado), ...Object.keys(atual)])) {
+ for (const nome of new Set(Object.keys(atual))) {
```

```mutacao
arquivo: packages/nucleo/src/ia/selo-do-ouro.test.ts
teste: packages/nucleo/src/ia/selo-do-ouro.test.ts › byte trocado num arquivo fica vermelho
- else if (jurado[nome] !== atual[nome]) problemas.push(`${nome}: o conteúdo mudou desde o selo`)
```

```mutacao
arquivo: packages/nucleo/src/ia/selo-do-ouro.test.ts
teste: packages/nucleo/src/ia/selo-do-ouro.test.ts › arquivo a mais fica vermelho
- if (!(nome in jurado)) problemas.push(`${nome}: arquivo a mais, que o selo não conhece`)
+ if (false) problemas.push(`${nome}: arquivo a mais, que o selo não conhece`)
```

```mutacao
arquivo: packages/nucleo/src/ia/selo-do-ouro.test.ts
teste: packages/nucleo/src/ia/selo-do-ouro.test.ts › arquivo a menos fica vermelho
- else if (!(nome in atual)) problemas.push(`${nome}: arquivo a menos, que o selo cita`)
+ else if (false) problemas.push(`${nome}: arquivo a menos, que o selo cita`)
```

```mutacao
arquivo: packages/nucleo/src/ia/selo-do-ouro.test.ts
teste: packages/nucleo/src/ia/selo-do-ouro.test.ts › o selo regravado pelo Arquiteto
- selo[nome] = createHash('sha256').update(readFileSync(join(pasta, nome))).digest('hex')
+ selo[nome] = createHash('sha256').update(nome).digest('hex')
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do corpus é recusado
- comQuestao: z.boolean().optional(),
+ comQuestao: z.unknown().optional(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do corpus é recusado
- turnoAnteriorDoAluno: z.string().min(1).optional(),
+ turnoAnteriorDoAluno: z.string().optional(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do corpus é recusado
- turnosDoProfessor: z.array(z.string().min(1)).optional(),
+ turnosDoProfessor: z.array(z.string()).optional(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do corpus é recusado
- turnosDoProfessor: z.array(z.string().min(1)).optional(),
+ turnosDoProfessor: z.unknown().optional(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do corpus é recusado
- mensagemDoProfessor: z.string().min(1).optional(),
+ mensagemDoProfessor: z.string().optional(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do corpus é recusado
- texto: z.string().min(1),
+ texto: z.string(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do corpus é recusado
- categoria: z.string().min(1),
+ categoria: z.string(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do corpus é recusado
- regra: z.string().min(1),
+ regra: z.string(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do corpus é recusado
- escritoPor: z.string().min(1),
+ escritoPor: z.string(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do corpus é recusado
- versao: z.number().int().min(1),
+ versao: z.number().int(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do corpus é recusado
- versao: z.number().int().min(1),
+ versao: z.number().min(1),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do corpus é recusado
- amostras: z.array(esquemaAmostra).min(1),
+ amostras: z.array(esquemaAmostra),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do MEDIDAS é recusado
- certos: z.number().int().min(0),
+ certos: z.number().min(0),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do MEDIDAS é recusado
- certos: z.number().int().min(0),
+ certos: z.number().int(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do MEDIDAS é recusado
- total: z.number().int().min(1),
+ total: z.number().min(1),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do MEDIDAS é recusado
- total: z.number().int().min(1),
+ total: z.number().int(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do MEDIDAS é recusado
- medidaEm: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
+ medidaEm: z.string(),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do MEDIDAS é recusado
- perdaMaxima: z.record(z.string(), z.number().int().min(0)),
+ perdaMaxima: z.record(z.string(), z.number().int()),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do MEDIDAS é recusado
- perdaMaxima: z.record(z.string(), z.number().int().min(0)),
+ perdaMaxima: z.record(z.string(), z.number().min(0)),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do MEDIDAS é recusado
- alvo: fechado({ recall: proporcao, legitimasBarradas: z.number().int().min(0) }),
+ alvo: fechado({ recall: proporcao, legitimasBarradas: z.number().int() }),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › valor inválido de campo do MEDIDAS é recusado
- alvo: fechado({ recall: proporcao, legitimasBarradas: z.number().int().min(0) }),
+ alvo: fechado({ recall: proporcao, legitimasBarradas: z.number().min(0) }),
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › conta o acerto de cada categoria
- contagem.total += 1
+ contagem.total += 0
```

```mutacao
arquivo: packages/nucleo/src/ia/__fixtures__/ouro.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o recall é das casa, a precisão é do que foi barrado
- positivas += 1
+ positivas += 2
```

```mutacao
arquivo: packages/nucleo/src/ia/ouro.test.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o auxiliar que diz que recusou
- throw erro
+ return true
```

```mutacao
arquivo: packages/nucleo/src/ia/ouro.test.ts
teste: packages/nucleo/src/ia/ouro.test.ts › categoria e id do MEDIDAS que não existem no corpus
- if (erro instanceof ZodError || erro instanceof OuroRecusado) return true
+ if (erro instanceof ZodError) return true
```

```mutacao
arquivo: packages/nucleo/src/ia/ouro.test.ts
teste: packages/nucleo/src/ia/ouro.test.ts › amostra com campo a mais é recusada
- if (erro instanceof ZodError || erro instanceof OuroRecusado) return true
+ if (erro instanceof OuroRecusado) return true
```

```mutacao
arquivo: packages/nucleo/src/ia/ouro.test.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o aviso de quem errou
- return `erraram ${String(erradas.length)}: ${erradas.slice(0, IDS_QUE_A_MENSAGEM_NOMEIA).join('; ')}${demais > 0 ? `; e mais ${String(demais)}` : ''}`
+ return `erraram ${String(erradas.length)}: ${erradas.slice(0, IDS_QUE_A_MENSAGEM_NOMEIA).join('; ')}`
```

```mutacao
arquivo: packages/nucleo/src/ia/ouro.test.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o aviso de quem errou
- const demais = erradas.length - IDS_QUE_A_MENSAGEM_NOMEIA
+ const demais = erradas.length
```

```mutacao
arquivo: packages/nucleo/src/ia/ouro.test.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o aviso de quem errou
- const erradas = amostras.filter((amostra) => barra(amostra) !== (amostra.esperado === 'casa')).map((amostra) => `${amostra.id} ${amostra.categoria}`)
+ const erradas = amostras.filter((amostra) => barra(amostra) === (amostra.esperado === 'casa')).map((amostra) => `${amostra.id} ${amostra.categoria}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/ouro.test.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o aviso de quem errou
- const IDS_QUE_A_MENSAGEM_NOMEIA = 40
+ const IDS_QUE_A_MENSAGEM_NOMEIA = 400
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › pedidoDeRespostaPronta não cai da base em nenhuma categoria
- /\bso (quero|preciso d)a resposta\b/,
+ /\bso (quero|preciso d)a resposta\b/,
+/\bexplic\w*\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/ouro.test.ts › saidaComNota não cai da base em nenhuma categoria
- /\b\d{1,3}([.,]\d)? pontos?\b(?! (importantes?|principais|centrais|chave|de atencao|fortes|fracos))/,
+ /\b\d{1,3}([.,]\d)? pontos?\b/,
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| conformidade-reviewer (1ª) | `saidaComNota`: as brechas medidas (`nota_numerica` 10/15, `conceito_em_letra` 6/8, `percentual` 0/1, `aprovacao` 0/1, recall 0,743) são as mais próximas de violar a D55; a 2.0 deve tratá-las primeiro | Muda comportamento de código de produção, fora do escopo da 1.0 ("sem mudar regra"). Destino: 27.0 (`tasks.md`: "Os padrões da D55, de entrada e de saída, vivem em `conformidade/`"), a tarefa que toca os padrões de saída; o Arquiteto confirma se a 3.0 também a cobre |
| conformidade-reviewer (1ª) | `julgamentoDeTextoDeAluno`: `rubrica_com_texto_de_aluno` está em 0/1 e a 2.0 deve cobrir esse caso (regra 70, item 2a) | A tarefa que trata esse julgamento é a 3.0 (`tasks.md`: "Julgamento de texto de aluno é barrado na entrada e na saída, e a rubrica passa"), que toca o mesmo arquivo. Destino: 3.0 |
| conformidade-reviewer (1ª) | Na 2.0, ao trocar a reprodução exata por piso em `riscoAVida` e `julgamentoDeTextoDeAluno`, conferir que o piso continua por categoria (como `quedasDaBase`, `ouro.ts:234`) | Tarefa futura que toca o arquivo: 2.0 (2.3, "`ouro.test.ts` liga o alvo de `riscoAVida`") e 3.0 |
| revisor-geral (1ª) | A reprodução exata de `assuntoDelicado` (`ouro.test.ts`:445-449) fica vermelha quando a 2.0 acrescentar padrões a `GATILHOS_DE_RISCO_A_VIDA`, porque `ehAssuntoDelicado` usa os mesmos | Aviso para a 2.0, não regressão; a 2.3 já prevê trocar essa reprodução pelo "não cair da base". Destino: 2.0 / 2.3 |
| revisor-geral (1ª) | A troca da mutação de `/\bmateria\b/` para `/\bmae\b/` foi reescrita pela mesma mão que implementou: o `test-engineer` deve confirmar que é dele | Sem mudança de código. O `test-engineer` já cobriu as 24 linhas da tabela e não a contestou na 1ª rodada; a Mesa a repete no prompt dele na rodada 2 |
| revisor-geral (2ª) | Levar `quaisErraram`, a constante de 40 ids e `recusa()` para um arquivo de apoio do teste, "para não acumular regra dentro do arquivo de teste", se outras tarefas forem usá-los | Recusada por ora: só `ouro.test.ts` os usa, e um arquivo de apoio sem segundo uso seria estrutura sem consumidor. Se a 2.0 (2.3) ou a 3.0 precisarem deles, a tarefa que os usar primeiro os leva |
| revisor-geral (2ª) | `OuroRecusado` não define `name`; a mensagem de falha do vitest mostra `Error`. "Pode ficar, mas um `name = 'OuroRecusado'` deixaria o diagnóstico mais claro" | Recusada: cosmética. O revisor diz que pode ficar, e a mensagem da falha já traz o texto de cada falha do cruzamento |
| test-engineer (2ª) | O bloco de `1_task.md:335-339` só tem a linha `-`; um `+` explícito deixaria a intenção mais clara | Recusada: o portão aplica o bloco como está e exige vermelho, e ele passa; o bloco é válido, só menos legível |
| test-engineer (2ª) | No caso de `lerMedidas` (`ouro.test.ts:382`), a mutação `'../..'` fica vermelha por `ENOENT` já na carga de `MEDIDAS = lerMedidas()` do topo do arquivo, e não na asserção do caso. "Fica para o `/retro`, não bloqueia" | Recusada nesta tarefa, pelo próprio revisor: o caminho da falha está certo. Fica registrada aqui para o `/retro` da spec |

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
| 2026-10-21 20:18:58 | 2026-10-21 20:19:36 | `conformidade-reviewer` | 1 | APROVADO | a775bc013f47cc2c8 |
| 2026-10-21 20:19:00 | 2026-10-21 20:20:01 | `revisor-geral` | 1 | APROVADO | a5bad3d192d1c452f |
| 2026-10-21 20:18:59 | 2026-10-21 20:20:42 | `test-engineer` | 1 | REPROVADO | af091cf0839ff59a3 |
| 2026-10-21 20:35:44 | 2026-10-21 20:36:09 | `revisor-geral` | 2 | APROVADO | a11b32e6962d378fd |
| 2026-10-21 20:35:39 | 2026-10-21 20:37:15 | `test-engineer` | 2 | APROVADO | a6421cb8a1f17f8ed |

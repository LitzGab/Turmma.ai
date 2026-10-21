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

- [ ] 1.1 — Leitores zod estritos do corpus e do `MEDIDAS` em `__fixtures__/ouro.ts`, raiz por `import.meta.url`
- [ ] 1.2 — `selo-do-ouro.test.ts`: sha256 de todo arquivo menos o `SELO.json`, e o mesmo conjunto de nomes
- [ ] 1.3 — `ouro.test.ts`: o mapeamento do README, a `base` reproduzida por categoria, o piso de `assuntoDelicado`,
  `pedidoDeRespostaPronta` e `saidaComNota`; as outras três só medidas e impressas
- [ ] 1.4 — Testes: leitor, reprodução, comparador e selo, como na tabela

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
| Falso positivo novo numa `nao_casa` é queda | unidade | `/\bmateria\b/` em `GATILHOS_DE_ASSUNTO_DELICADO` |
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

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


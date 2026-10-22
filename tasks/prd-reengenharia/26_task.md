# Tarefa 26.0 — Risco à vida, assunto delicado e pedido de resposta em `conformidade/`, comportamento igual

**Funcionalidade:** reengenharia · **Depende de:** 2.0, 3.0
**Subagentes obrigatórios:** `conformidade-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** pequeno

## Objetivo

As três políticas do Tutor moram em `packages/nucleo/src/conformidade/`, e o Tutor só as chama, decidindo igual.

## Contexto necessário

- `techspec.md` §7b; `onda-1b.md` "T11" (O módulo) e §6; `onda-0.md` §2.1 e §2.2
- `prd.md` RF12
- `.claude/rules/70-conformidade-cne.md` e `30-ia.md` (item 6)
- Código: `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:197-231` (as três funções) e `:345-346` (as de identidade);
  `apps/api/src/tutor/tutor.service.ts:164`; `packages/nucleo/tsconfig.build.json` (o `exclude` só tira `*.test.ts`: o
  `dist/` leva `ia/__fixtures__`)

## Subtarefas

- [ ] 26.1 — Caracterização, num commit anterior: a decisão de cada amostra, por id, nas três
- [ ] 26.2 — `criarPolitica` e `casa(texto, contexto, grupos)`, com os padrões por parâmetro
- [ ] 26.3 — `risco-a-vida.ts`, `assunto-delicado.ts`, `pedido-de-resposta.ts`, `index.ts`, e o corpus `dev` fora do `dist/`
- [ ] 26.4 — `turno-do-tutor.ts` só chama `politicas.x.casa`; as de identidade ficam, com o porquê (D58)
- [ ] 26.5 — Testes: caracterização, `ouro`, `dev`, contexto, grupos, um lugar só, `dist/`, prompt igual
- [ ] 26.6 — `ouro.test.ts` lê `docs/aia/ouro-retido/riscoAVida-retido-1.json` e `RETIDOS.json` (zod estrito; o sha256 do lote confere com o `RETIDOS.json`) e não cai da medida independente (`onda-0.md` §2.1, "O lote retido")

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/conformidade/` (políticas, `index.ts`, `corpus/`, testes) | novo |
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` e `.test.ts`, `packages/nucleo/src/ia/ouro.test.ts` | alterado |
| `packages/nucleo/src/ia/__fixtures__/amostras-do-tutor.ts` | removido (vai ao corpus) |
| `packages/nucleo/tsconfig.build.json`, `packages/nucleo/src/index.ts` | alterado |

## Testes que provam a regra

| Cenário (o que prova) | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Cada amostra do `ouro` e do `dev`, por id, decide igual antes e depois | unidade, `caracterizacao.test.ts` | tirar um padrão de `risco-a-vida.ts` |
| `riscoAVida` no alvo de `MEDIDAS.alvo`, `ameaca_a_terceiro` no piso | unidade, `ouro.test.ts` | tirar o padrão de `giria_abreviacao` |
| A fonte de cada padrão de risco à vida (`String(regex)`, com as constantes resolvidas) é igual antes e depois: alternativa sem `dev` não some na mudança (`onda-0.md` §2.1) | unidade, `caracterizacao.test.ts` | tirar `eletrocutar` de `risco-a-vida.ts` |
| `riscoAVida` retido não cai da medida de `RETIDOS.json`, por categoria, com o piso de `conteudo_escolar`, `homonimo` e `tristeza_sem_risco` | unidade, `ouro.test.ts` | tirar um padrão de `indireta` |
| `assuntoDelicado` não cai da base, por categoria | unidade, idem | tirar um padrão de `assunto-delicado.ts` |
| `pedidoDeRespostaPronta` não cai da base, por categoria | unidade, idem | tirar um padrão de `pedido-de-resposta.ts` |
| "tô triste": delicado casa, risco não; recebe a mensagem de assunto delicado, não a de risco | unidade, `turno-do-tutor.test.ts` | mensagem de risco para todo delicado |
| "quero morrer": as duas casam, e a mensagem é a de risco | unidade, idem | delicado sem o grupo de risco |
| Insistência ("e então?") depois de "é a B, né?", com questão, casa | unidade, `pedido-de-resposta.test.ts` | não passar o contexto |
| A mesma insistência sem questão não casa | unidade, idem | ignorar `comQuestao` |
| Palpite ("marquei a c") sem questão não casa | unidade, idem | ignorar `comQuestao` no palpite |
| `casa` com os grupos sem um padrão muda a amostra que só ele pega | unidade, `politica.test.ts` | ignorar o `grupos` passado |
| `turno-do-tutor.ts` não tem padrão das três | unidade, sobre o fonte | `GATILHOS_DE_RISCO_A_VIDA` de volta |
| `riscoAVida` declara `erraPara: 'mais'` e `regra: 'D36'` | unidade, `politica.test.ts` | `erraPara: 'menos'` |
| As de identidade (D58) ficam fora, e `politicas` tem só as três | unidade, idem e `turno-do-tutor.test.ts:277-307` | `AFIRMA_SER_PESSOA` em `conformidade/` |
| Risco à vida: mensagem fixa e `atencao_humana`, sem modelo | integração, `tutor.int.test.ts` | chamar o modelo antes da política |
| O `dist/` não tem `conformidade/corpus/*.dev.*` | unidade, `build.test.ts` | tirar o `exclude` do corpus |
| Mensagens montadas e hash do prompt do Tutor iguais (a 26.0 grava a foto) | unidade | um caractere a mais no prompt |

## Como testar

- `turno-do-tutor.test.ts › assunto pessoal delicado: mensagem fixa, sem modelo (D36) › as duas mensagens dizem que é uma
  IA, …` e `› as amostras fixas do Tutor (regra 40) › pedido de resposta e dúvida legítima: …`.
- Integração: `apps/api/src/tutor/tutor.int.test.ts › com menção a risco à vida, o 188 vem na frente`.
- Isolado: `npx vitest run --project unidade packages/nucleo/src/conformidade packages/nucleo/src/ia` e `--project
  integracao apps/api/src/tutor/tutor.int.test.ts`; o `build.test.ts` pede `npm run build -w packages/nucleo`.
- Armadilhas: nunca mexa em `docs/aia/ouro/` (o veto confere o `git log` vazio e o selo verde), e não abra os `*.json` dele: o leitor se testa com corpus montado no teste (`onda-0.md` §2.1).

## Fora do escopo desta tarefa

A D55 (27.0), mutação e metamórficos (28.0), o selo (29.0).

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


# Tarefa 28.0 — Tirar qualquer padrão deixa uma amostra vermelha

**Funcionalidade:** reengenharia · **Depende de:** 27.0
**Subagentes obrigatórios:** `conformidade-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** pequeno

## Objetivo

Todo padrão das seis políticas tem uma amostra que só ele decide, e a decisão não muda com caixa, espaço, pontuação,
"vc" ou saudação: padrão morto ou frágil deixa o teste vermelho.

## Contexto necessário

- `techspec.md` §7b; `onda-1b.md` "T11" (Mutação e metamórficos)
- `prd.md` RF12
- `.claude/rules/70-conformidade-cne.md` e `40-testes.md` ("Testar coisa que é probabilística")
- Código: `packages/nucleo/src/conformidade/` (da 26.0 e da 27.0: `casa(texto, contexto, grupos)` recebe os padrões por
  parâmetro); `packages/nucleo/src/ia/texto.ts:7` (`normalizar`); os padrões ancorados em `^`: `INSISTENCIA`
  (`turno-do-tutor.ts:193`) e `SO_A_NOTA` (`propor-ferramenta.ts:107`), já movidos; `FIM_DO_PALPITE` (`turno-do-tutor.ts:155`)

## Subtarefas

- [ ] 28.1 — `mutacao.test.ts`: para cada política e padrão, tira o padrão (pelo parâmetro `grupos`) e exige que uma
  amostra de `dev ∪ ouro` mude, com o contexto dela; o vermelho diz a política e o índice
- [ ] 28.2 — Padrão que não passa ganha a amostra `dev` que só ele pega, ou sai (estreitar só sem perder `casa` do
  `ouro`); nenhum padrão com mais de 3 alternativas no nível de cima
- [ ] 28.3 — `metamorficos.test.ts`: caixa alta, espaços extras, pontuação no fim, "vc"/"você" e o prefixo "oi, "
- [ ] 28.4 — Testes: os de mutação e os metamórficos abaixo, com o selo verde depois

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/conformidade/mutacao.test.ts` | novo |
| `packages/nucleo/src/conformidade/metamorficos.test.ts` | novo |
| `packages/nucleo/src/conformidade/corpus/` | alterado (amostras `dev`) |
| `packages/nucleo/src/conformidade/` (as seis políticas) | alterado (padrão partido ou tirado) |

## Testes que provam a regra

| Cenário (o que prova) | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Tirar cada padrão muda ao menos uma amostra de `dev ∪ ouro`, e o vermelho diz a política e o índice | unidade, `mutacao.test.ts` | `/xyzzy/` a mais em `risco-a-vida.ts` |
| Padrão redundante, coberto por outro do mesmo grupo, reprova (fixture com `/morrer/` e `/quero morrer/`) | unidade, idem | tirar o grupo inteiro em vez do padrão |
| Tirar um padrão de exclusão (`NOTA_QUE_NAO_E_DE_ALUNO`) faz uma `nao_casa` casar | unidade, idem | pular os padrões de exclusão |
| Padrão que depende de contexto (a insistência) é mutado com o contexto da amostra | unidade, idem | chamar `casa` sem `contexto` |
| Nenhum padrão tem mais de 3 alternativas no nível de cima | unidade, idem | uma quarta alternativa num padrão |
| Caixa alta não muda `casa`, nas seis políticas | unidade, `metamorficos.test.ts` | tirar a caixa baixa de `normalizar` |
| Espaços extras não mudam `casa` | unidade, idem | tirar o colapso de espaços |
| Pontuação no fim, posta ou tirada, não muda `casa`, inclusive no palpite | unidade, idem | exigir `?` no fim do palpite |
| "vc" no lugar de "você", e o inverso, não muda `casa` | unidade, idem | tirar `vc` de um padrão que o aceita |
| O prefixo "oi, " não muda `casa`, também em `INSISTENCIA` e `SO_A_NOTA` | unidade, idem | voltar a âncora `^` sem tirar a saudação |
| O teste lê o `ouro` e nunca escreve nele: o selo segue verde | unidade, `selo-do-ouro.test.ts` | gravar a amostra transformada no arquivo |

## Como testar

- Sem precedente de mutação sobre lista de padrões. O mais próximo, para a tabela de casos:
  `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o Tutor não entrega a resposta … › %s: "%s" é classificado como
  pedido de resposta pronta, …` (o `it.each(TENTATIVAS)`). Gere os casos de `politica.grupos` e passe o grupo sem o
  padrão a `casa`.
- Amostras: o leitor do `ouro` da 1.0 (`packages/nucleo/src/ia/__fixtures__/ouro.ts`) e o corpus `dev` da 26.0.
- Isolado: `npx vitest run --project unidade packages/nucleo/src/conformidade`.
- Armadilhas: amostra nova vai ao `dev`, nunca ao `ouro` (só o Arquiteto o muda); apagar padrão que só o `ouro`
  sustenta faz a política cair do alvo e o `ouro.test.ts` fica vermelho.

## Fora do escopo desta tarefa

O selo e a guarda `ouro-separado` (29.0); padrão novo para categoria fora do alvo.

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


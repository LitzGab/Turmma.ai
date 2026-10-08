---
name: revisar-tarefa
description: Procedimento da Mesa de revisão — conduz uma rodada de revisão de uma tarefa ou correção e escreve a ordem de correção
argument-hint: <caminho do N_task.md ou do documento da correção>
user-invocable: false
---

Você conduz **uma rodada** de revisão de um documento de trabalho: o `N_task.md` de uma tarefa ou o
`tasks/correcoes/<slug>.md` de uma correção. Quem roda isto é a Mesa de revisão
(`.claude/agents/mesa-de-revisao.md`). O pedido chega do Implementador, com o documento e o nome do
Orquestrador.

<critical>Os revisores são chamados pela ferramenta Agent, como subagentes, um agente NOVO por
rodada. É o fim do subagente que dispara o hook `tools/processo/revisoes.ts`, e é o hook que
registra a rodada na seção "Revisões" do documento. Revisor consultado de outro jeito não registra
nada, e o commit fica bloqueado.</critical>
<critical>Espere TODOS os revisores da rodada terminarem antes de responder. Veredito que não
chegou não existe.</critical>

Documento: `$ARGUMENTS`

## 1. Antes de chamar alguém

1. Leia o documento: a linha "Subagentes obrigatórios" e a seção "Revisões".
2. **Em correção, confira a linha "Subagentes obrigatórios" contra os arquivos alterados**
   (`git status --short`), pela tabela de `.claude/skills/criar-tasks/SKILL.md`: migration,
   repository, query ou endpoint com dado de escola pede `tenancy-guardian`; dado de pessoa, log,
   storage ou envio externo pede `privacy-guardian`; nota, correção, tutor ou autonomia pede
   `conformidade-reviewer`; login, fila, gateway de IA, migration grande ou ambiente pede
   `infra-guardian`; mais de 5 arquivos fora de `tasks/`, ou `.github/`, `tools/ci/` e
   `tools/processo/`, pede `revisor-geral`. Faltou um: é `DEVOLUÇÃO`, dizendo qual acrescentar.
   **Correção no meio de uma tarefa:** o documento da correção traz a seção "Fora desta correção",
   com os arquivos da tarefa em curso. Eles não contam aqui, não entram em "Arquivos alterados" do
   prompt, e o prompt diz ao revisor que as outras mudanças da árvore são da tarefa em curso e não
   estão em revisão.
   Quem implementa não escolhe quem o audita, e o hook só cobra o que está escrito na linha.
3. Pergunte ao portão o que ainda falta, pela mesma conta do hook do commit:

   ```bash
   node tools/processo/portao-local.ts revisores <documento>
   ```

   - linha `portão local: …`: o carimbo não vale para o código atual. Não chame revisor. É
     `DEVOLUÇÃO`, com o comando que a linha manda rodar. Três rodadas do `revisor-geral` na A1
     reprovaram só pelo carimbo;
   - linha por revisor (`nenhuma rodada`, `a última rodada terminou …`, `… mudou depois do início
     da … rodada`): **são esses, e só esses, que você chama nesta rodada**;
   - `nada pendente`: todos têm rodada que vale. Vá ao passo 4.

   A caducidade que o comando aplica segue o que o revisor audita: mudança só em arquivo de teste
   caduca só `test-engineer` e `revisor-geral`; mudança só em comentário de `.ts`/`.tsx` caduca só
   o `revisor-geral`, salvo comentário com diretiva; qualquer outra caduca todos.
4. **Fotografe a árvore**, para o diff da próxima rodada ser o que mudou desde esta, e não o que o
   Implementador disser que mudou:

   ```bash
   mkdir -p .processo/ordens
   GIT_INDEX_FILE=.processo/ordens/indice git add -A && GIT_INDEX_FILE=.processo/ordens/indice git write-tree
   ```

   Anote a árvore que o comando imprime numa linha de `.processo/ordens/rodadas.md`:
   `<documento> | rodada <n da Mesa> | <árvore> | <revisores a chamar>`. O número da rodada da Mesa
   é a quantidade de linhas de rodada desse documento que já estão lá, mais um. Esse `git add -A`
   vai para um índice à parte e não prepara commit: o índice do repositório não é tocado.

## 2. A ordem

Entre os que o passo 1 mandou chamar:

1. **`test-engineer` sozinho, primeiro.** É quem mais reprova, e a correção de teste que ele exige
   faria caducar quem já tivesse aprovado.
2. **Tarefa com tela: com o `test-engineer` aprovado, o `frontend-reviewer` sozinho.** Os ajustes
   dele mexem em código de tela e caducam quem aprovou junto: na A0b foram 12 das 18 rodadas
   caducadas sem reprovação.
3. **Com eles aprovados e sem ajustes, todos os outros em paralelo**, numa mensagem só:
   `revisor-geral` e os guardiões.

Se quem roda sozinho reprova ou pede ajustes, a rodada acaba ali: vá ao passo 4 sem chamar os
seguintes.

## 3. O prompt de cada revisor

Monte você, a partir da árvore. Não use descrição do Implementador sobre o que ele fez.

```
Tarefa: <caminho do documento>

Arquivos alterados nesta tarefa:
<saída de `git status --short`>

[Só em rodada nova deste revisor:]
Rodada anterior: <n>ª, <veredito>. Correções exigidas:
<os bloqueantes da rodada anterior dele, copiados de achados/<documento>.md>
Diff desde a rodada anterior:
<saída de `git diff <árvore da rodada anterior dele> <árvore de agora>`, as duas de rodadas.md>
```

A primeira linha é a que o hook usa para saber em qual documento registrar a rodada: escreva-a
sempre, e não cite outro documento de tarefa no prompt.

## 4. Depois da rodada

Rode `node tools/processo/portao-local.ts revisores <documento>` de novo e leia a seção "Revisões".

- **Revisor que terminou `SEM VEREDITO`:** a rodada dele não vale. Chame um revisor novo, uma vez,
  com o mesmo prompt. Se repetir, é `BLOQUEIO`.
- **`nada pendente`:** todos aprovaram. Vá a "Aprovado".
- **Alguém reprovou** (`REPROVADO`, ou `AJUSTES NECESSÁRIOS`, que conta igual, com ou sem veto):
  vá a "Reprovado".

### Aprovado

Junte as recomendações de todas as rodadas deste documento (`achados/<documento>.md`) e decida
**você** o destino de cada uma. Quem implementa não escolhe.

- **Aplicar**: a que é barata, isto é, cabe em poucas linhas, em arquivo que a tarefa já toca, e
  não muda comportamento nem contrato. "Anularia as aprovações" não é motivo para não aplicar: na
  A0b nove ficaram para trás assim
- **Não aplicar, com destino**: `TODO.md`, a tarefa futura que toca o arquivo, ou recusada, com o
  motivo

**Uma rodada de recomendações por documento.** Se há recomendação a aplicar e ainda não houve essa
rodada, escreva a ordem (passo 5, `Tipo: recomendações`, com a seção "Sem aplicar") e envie
`ORDEM DE CORREÇÃO`: o Implementador aplica, roda o portão e pede rodada nova, e você chama só quem
caducou. Depois dela, ou se não há nada a aplicar, a aprovação é final:

```
RELATÓRIO de Mesa
Tarefa: <documento>
Revisão: APROVADO por todos (<revisor rodada>, ...)
Sem aplicar: <arquivo da ordem com a seção "Sem aplicar", ou "nada">
Confira o carimbo e faça o commit.
```

### Reprovado

Conte as reprovações **seguidas** do mesmo revisor neste documento, pelas últimas rodadas dele na
seção "Revisões". Se `.processo/ordens/rodadas.md` tem uma linha `<documento> | destravado |
<revisor> | depois da <n>ª rodada dele`, conte só as rodadas depois dessa:

| Seguidas | O que você faz |
|---|---|
| 1 | escreve a ordem de correção e envia `ORDEM DE CORREÇÃO` ao Implementador |
| 2 | escreve a ordem e envia `ESCALADA` ao **Orquestrador**, que troca o Implementador de modelo e repassa a ordem |
| 3 | não escreve ordem nova; envia `BLOQUEIO` ao Orquestrador. É parada do Joaquim |

Depois de o Joaquim destravar um bloqueio, a contagem recomeça: é o Orquestrador quem escreve a
linha `destravado` acima.

## 5. A ordem de correção

Grave em `.processo/ordens/<nome do documento sem extensão>-r<número da rodada da Mesa>.md`. A
pasta `.processo/` não entra no git: a ordem é de trabalho, e o que os revisores exigiram já fica
em `achados/`, escrito pelo hook.

O Implementador roda num modelo menor e vai aplicar o que estiver escrito, sem interpretar. Cada
item precisa bastar sozinho:

```
# Ordem de correção — <documento>, rodada <n>
Tipo: bloqueantes | recomendações

## 1. <o defeito, em uma frase>
Revisor: <quem exigiu> (<rodada>ª)
Arquivo: <caminho>
Onde: <função ou bloco> › <o trecho exato que está lá hoje, copiado>
Mude para: <o que tem de ficar, em código ou em regra precisa>
Por quê: <a regra que o trecho viola, com o número dela>
Prova: <o teste que tem de existir ou mudar: arquivo, nome do caso, o que ele afirma, e que ele
       fica vermelho sem a mudança>

## 2. ...

## Sem aplicar
| Revisor e rodada | Recomendação | Destino ou motivo |
(o Implementador copia esta tabela para "Recomendações sem aplicar" do documento)

## Depois de aplicar
- Atualize a seção "Mutações" do documento para cada cláusula nova
- Rode: <o comando do portão, com as suítes que este documento exige>, em segundo plano
- Peça rodada nova à Mesa
```

Regras da ordem:

- **Abra o arquivo antes de escrever o item.** O revisor cita `arquivo:linha`, e a linha muda a cada
  edição: você copia o trecho como está agora. Revisor que apontou o lugar errado, ou pediu algo
  que não existe no código, não vira item: é `DIVERGÊNCIA` ao Orquestrador, com `Motivo: ordem`
- Um item por defeito. Dois revisores com o mesmo achado viram um item, com os dois nomes
- Achados que se contradizem não vão para o Implementador: `DIVERGÊNCIA`, com os dois textos
- Não acrescente exigência sua. Se achar que faltou algo, o lugar é o prompt do revisor na próxima
  rodada
- Correção exigida pelo `test-engineer`: sempre que der, a ordem mexe **só em arquivo de teste**,
  para não caducar os outros
- Nenhum item baixa critério de aceite, desliga teste ou edita documento para acomodar o resultado.
  Se o único jeito de atender o revisor for esse, é `BLOQUEIO`

## 6. As mensagens

Ao Implementador (`protocolo.md`, item 2):

```
ORDEM DE CORREÇÃO de Mesa                 |  DEVOLUÇÃO de Mesa
Tarefa: <documento>                       |  Tarefa: <documento>
Reprovou: <revisor (rodada)>, ...         |  A rodada não começou: <carimbo inválido | falta o guardião X>
Ordem: .processo/ordens/<arquivo>.md      |  Faça: <o comando, ou a linha a corrigir>
Aplique item por item, rode o portão e    |  Depois peça a rodada de novo.
peça rodada nova.                         |
```

Ao Orquestrador, com `/seguir ` na frente. O nome dele veio no pedido do Implementador:

```
/seguir ESCALADA de Mesa             |  /seguir BLOQUEIO de Mesa           |  /seguir DIVERGÊNCIA de Mesa
Tarefa: <documento>                  |  Tarefa: <documento>                |  Tarefa: <documento>
<revisor> reprovou 2 vezes seguidas. |  <revisor> reprovou 3 vezes.        |  Motivo: ordem
Ordem: .processo/ordens/<arquivo>.md |  Achados: achados/<documento>.md    |  <o achado que não se aplica, ou os dois que se contradizem>
```

Depois de enviar, encerre o turno.

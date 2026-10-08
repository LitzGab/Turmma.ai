---
name: corrigir
description: Corrige um defeito fora de uma tarefa (teste intermitente, bug achado na esteira, ressalva da validação), com teste que reproduz, revisores e commit marcado
argument-hint: <o defeito, em texto livre>
user-invocable: false
---

Você corrige **um** defeito que não pertence a nenhuma tarefa pendente: um teste intermitente,
um bug que a esteira pegou, uma ressalva do `/validar`, um problema achado em uso.

Quem roda isto é o Implementador, a pedido do Orquestrador (`/seguir`, D78): na branch da spec em
curso, quando o defeito é dela, ou num andar próprio, `correcao/<AAAA-MM-DD>-<slug>`, quando é avulso.

Este comando existe porque correção era o caminho sem portão. No F0 e no F1, commits como
"Corrige a API que perdia o banco quando o DNS de outro serviço ficava lento" entraram no `main`
sem nenhum revisor, enquanto qualquer tarefa passava por quatro. Agora o hook bloqueia commit que
leva código de `apps/`, `packages/`, `infra/` ou `e2e/` sem `(tarefa N.0)` nem
`(correção <slug>)`, e este é o caminho da segunda marca: curto, mas com prova e revisão.

<critical>Primeiro o teste que reproduz, vermelho. Depois a correção. Correção sem teste que
falhava antes é palpite.</critical>
<critical>Uma correção por execução. Se o defeito revela um problema de desenho (a Tech Spec
estava errada, falta uma tarefa), PARE e envie `/seguir DIVERGÊNCIA de Implementador`, com
`Motivo: desenho`: a tarefa nova é do Arquiteto. Não corrija aqui.</critical>

Defeito: `$ARGUMENTS`

## 1. Registrar

Crie `tasks/correcoes/<AAAA-MM-DD>-<slug-curto>.md`:

```
# Correção — <o defeito, em uma frase>

**Origem:** <esteira run <id> | validacao.md de <func> | uso | teste intermitente>
**Subagentes obrigatórios:** <os guardiões que o PEDIDO do Orquestrador ditou, entre crases>
<!-- Quem dita os guardiões é o Orquestrador, no pedido, e a Mesa confere a linha contra os arquivos alterados:
     quem corrige não escolhe quem o audita. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`, quando a correção passa
     do limite do passo 5: marque-o aqui. -->

## Sintoma
<o que acontece, com a saída ou o link>

## Causa
<preenchida no passo 2>

## Teste que reproduz
<arquivo e nome do teste; preenchido no passo 3>

## Correção
<o que mudou e por quê; preenchida no passo 4>
```

## 2. Achar a causa

Leia o código envolvido e as regras aplicáveis. Não pare no sintoma: teste intermitente tem uma
causa (relógio, ordem, recurso compartilhado, espera fixa), e "aumentar o timeout" só é correção
se a causa for de fato o tempo. Escreva a causa no documento.

## 3. Reproduzir

Escreva ou ajuste o teste que falha **por causa** do defeito e rode só ele: tem de ficar vermelho.
Se não dá para reproduzir de forma determinística (intermitência de ambiente), escreva no
documento por quê e qual evidência substitui o vermelho (por exemplo, 20 execuções seguidas).

## 4. Corrigir e passar o portão

Corrija o mínimo. Rode o teste: verde. Depois o portão local com carimbo:

```bash
node tools/processo/portao-local.ts   # com --e2e e --infra quando se aplicam
```

## 5. Revisores

Mesma mecânica do passo 5 de `.claude/skills/executar-task/SKILL.md`: você pede a rodada à Mesa de
revisão, com o documento da correção, e ela chama o `test-engineer` primeiro e sozinho e depois os
guardiões marcados em paralelo. `revisor-geral` é obrigatório quando a correção altera mais de 5 arquivos fora de
`tasks/`, ou toca `.github/`, `tools/ci/` ou `tools/processo/`. Escreva-o, entre crases, na linha
"Subagentes obrigatórios" do documento, no passo 1 ou assim que passar do limite: é dessa linha que o
hook tira quem cobra. Na A1, duas correções
passaram do limite sem ele (`decididos-continuam-marcados`, com 7 arquivos, e `e2e-em-fatias`, com
11, a N5 do `/validar`).

Antes de pedir cada rodada, rode
`node tools/processo/portao-local.ts conferir tasks/correcoes/<AAAA-MM-DD>-<slug>.md`. Se der
inválido, rode o portão com as suítes que a mensagem pede: a Mesa não chama revisor com o carimbo
inválido. Na A1, três rodadas do `revisor-geral` reprovaram só ou também pelo carimbo, que é uma
conferência de um comando.

## 6. Commit e push

Na branch do andar (D78). A esteira não é conferida a cada commit: ela roda na branch antes do pouso
(`/seguir`, passo 7), e a correção que nasce de esteira vermelha é a que a fecha. Como a esteira só
roda no fim, a falha pode ser de qualquer tarefa: escreva na "Causa" de qual foi.

- stage só os arquivos da correção, o documento e, se o hook os escreveu,
  `tasks/correcoes/achados/<slug>.md` e `tasks/correcoes/achados/indice.md`. O índice é da pasta:
  linha de outro documento que tenha entrado enquanto esta correção corria vai junto, e é assim
  mesmo — ele só é acrescentado, e tirar a linha à mão perderia o registro dela;
- **o arquivo existe antes do comando do commit**: o hook lê a árvore antes de o comando rodar, então
  não crie nem altere arquivo no mesmo Bash do `git add` e do `git commit`;
- antes do commit, `git diff --cached --name-only` confere com a lista dos arquivos da correção (um
  `git add` que falha num caminho errado não prepara nada daquele comando); depois do commit e antes
  do push, `git show --stat HEAD` e `git status --short`: se algo ficou de fora e o commit ainda não
  foi enviado, `git reset --soft HEAD~1`, prepare de novo e refaça. Na 15.0 da A1, um commit saiu
  parcial e só foi refeito porque alguém olhou;
- veio um `achados-revisoes.md` de volta num merge? `node tools/processo/separar-achados.ts` antes
  do commit, e então prepare a deleção dele e a pasta `achados/` inteira, que é mais do que os
  arquivos desta correção;
- mensagem `Corrige <o quê> (correção <AAAA-MM-DD>-<slug>)`, com a linha `Revisões:` no corpo;
- `git push -u origin HEAD`, para a branch do andar. Nunca para a `develop`: o pouso é do Joaquim.

## 7. Relatório

Envie ao Orquestrador, começando por `/seguir RELATÓRIO de <seu nome>`
(`.claude/skills/seguir/protocolo.md`, item 2), e encerre o turno:

```
/seguir RELATÓRIO de Implementador
Correção: tasks/correcoes/<AAAA-MM-DD>-<slug>.md
STATUS: SUCESSO | FALHA
Causa: <uma linha>
Teste que reproduz: <arquivo › nome> (vermelho antes, verde depois)
Portão local: carimbo válido (<suítes>)
Revisões: <linha do commit>
Commit e push: <hash> em <branch>
```

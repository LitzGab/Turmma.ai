---
name: corrigir
description: Corrige um defeito fora de uma tarefa (teste intermitente, bug achado na esteira, ressalva da validação), com teste que reproduz, revisores e commit marcado
argument-hint: <o defeito, em texto livre>
---

Você corrige **um** defeito que não pertence a nenhuma tarefa pendente: um teste intermitente,
um bug que a esteira pegou, uma ressalva do `/validar`, um problema achado em uso.

Este comando existe porque correção era o caminho sem portão. No F0 e no F1, commits como
"Corrige a API que perdia o banco quando o DNS de outro serviço ficava lento" entraram no `main`
sem nenhum revisor, enquanto qualquer tarefa passava por quatro. Agora o hook bloqueia commit que
leva código de `apps/`, `packages/`, `infra/` ou `e2e/` sem `(tarefa N.0)` nem
`(correção <slug>)`, e este é o caminho da segunda marca: curto, mas com prova e revisão.

<critical>Primeiro o teste que reproduz, vermelho. Depois a correção. Correção sem teste que
falhava antes é palpite.</critical>
<critical>Uma correção por execução. Se o defeito revela um problema de desenho (a Tech Spec
estava errada, falta uma tarefa), PARE e proponha a tarefa via `/criar-tasks`, não corrija aqui.</critical>

Defeito: `$ARGUMENTS`

## 1. Registrar

Crie `tasks/correcoes/<AAAA-MM-DD>-<slug-curto>.md`:

```
# Correção — <o defeito, em uma frase>

**Origem:** <esteira run <id> | validacao.md de <func> | uso | teste intermitente>
**Subagentes obrigatórios:** <guardiões pela natureza, com a tabela do /criar-tasks>
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

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

Mesma mecânica do passo 5 de `.claude/skills/executar-task/SKILL.md`, com o documento da
correção na linha `Tarefa:`: `test-engineer` primeiro e sozinho, depois os guardiões marcados em
paralelo. `revisor-geral` não é obrigatório aqui; chame-o se a correção passou de ~5 arquivos.

## 6. Commit e push

Com a esteira do commit anterior verde (passo 7 da `executar-task`):

- stage só os arquivos da correção, o documento e o `achados-revisoes.md` de `tasks/correcoes/`
  se o hook o escreveu;
- mensagem `Corrige <o quê> (correção <AAAA-MM-DD>-<slug>)`, com a linha `Revisões:` no corpo;
- `git push origin develop`.

## 7. Relatório

```
Correção — <slug>

Causa: <uma linha>
Teste que reproduz: <arquivo › nome> (vermelho antes, verde depois)
Portão local: carimbo válido (<suítes>)
Revisões: <linha do commit>
Push: <hash>
```

# Correção — o e2e da turma que a releitura deixa de achar espera nenhum `h1`, e a tela "Esta turma não está disponível" tem o `h1` "Turma" desde a 11.0

**Origem:** pedido do Orquestrador em 15/10/2026 (`e2e/acesso-da-turma.spec.ts:1103`, vermelho nos projetos `chromebook` e `celular` no portão da 13.0).
**Subagentes obrigatórios:** `frontend-reviewer`, `tenancy-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. A correção altera 1 arquivo fora de `tasks/`: abaixo do limite do `revisor-geral`. -->

## Sintoma

No teste "a releitura que cai com o código projetado não tira o diálogo da tela…", depois de a coordenação encerrar o vínculo
com a tela aberta, a asserção `expect(principal(page).getByRole('heading', { level: 1 })).toHaveCount(0)` falha: a tela tem um
`h1`. É o `h1` "Turma", que a `Tela` passou a mostrar em toda tela aberta pela lateral (tarefa 11.0, commit `761bb2b`).

## Fora desta correção

Os caminhos da tarefa 13.0 em curso (`git status --short` ao receber o pedido): `componentes/BarraPresa.tsx`,
`componentes/CascaDaEscola.tsx`, `componentes/Superficies.test.tsx`, `componentes/casca-sem-import.test.ts`,
`apps/web/src/estilos.css`, `docs/interface.md`, `e2e/__fixtures__/casca.ts`, `e2e/__fixtures__/sessao.ts`,
`e2e/areas.spec.ts`, `e2e/casca.spec.ts`, `e2e/escola-e-vinculos.spec.ts`, `e2e/meus-dados.spec.ts`,
`e2e/minha-turma.spec.ts`, `e2e/professor-assistente.spec.ts`, `e2e/tokens.spec.ts`,
`tasks/prd-pele-e-casca/13_task.md`, `componentes/BarraDeBaixo.test.tsx`, `componentes/BarraDeBaixo.tsx`,
`componentes/CascaDaEscola.test.tsx` e `e2e/casca-no-celular.spec.ts` (`componentes/` = `apps/web/src/componentes/`).
Ficam na árvore, não entram na revisão nem no commit desta correção. O `e2e/acesso-da-turma.spec.ts` tem também mudança da
13.0 (o import de `secoes` e a asserção de "Turmas" na lateral, perto da linha 319): o commit desta correção leva só o trecho
dela: o da linha 1103, a constante `SERIE_DA_TURMA` e a linha 304 que a usa.

## Causa

A 11.0 trocou a `<section>` da `Turma` pela `Tela`, que mostra o `h1` em toda tela, inclusive a do erro e a da turma
indisponível (`Tela titulo={nomeDaTurma}`). Com a turma perdida, `nomeDaTurma` é só `'Turma'` e `descricao` é `undefined`:
o `h1` não diz o nome nem a série, e é o mesmo texto da aba (`'Turma · Turmma'`, que o teste já exige duas linhas abaixo). A
asserção "nenhum `h1`" era da página anterior à 11.0, em que o título só existia com a turma lida, e a 11.0 não a atualizou:
o e2e de acesso não estava entre os arquivos dela e só roda na esteira.

O propósito da asserção, dito no comentário do teste, é que "o título não continue afirmando a turma". Isso se prova olhando o
que o `h1` diz: o texto exato `Turma`, sem nome nem série, e uma só vez. "Nenhum `h1`" provava o mesmo pela ausência, e agora
a tela sempre tem título.

## Teste que reproduz

`e2e/acesso-da-turma.spec.ts › a releitura que cai com o código projetado não tira o diálogo da tela: …`: o `toHaveCount(0)`
do `h1` vira `toHaveCount(1)` e `toHaveText('Turma')` (texto exato, e não `name: 'Turma'`, que casa por trecho), mais duas
asserções de que a turma que saiu não deixa nada dela na tela: o nome (`not.toContainText(turma.turmaNome)` no `body`, que
inclui a lateral e os diálogos) e a série (`not.toContainText(SERIE_DA_TURMA)` no `principal`, com o mesmo texto que o teste
exige com a turma lida, "7º ano do Ensino Fundamental": o `turmaNome` não a contém, e por isso o nome não prova a série).
Vermelho hoje (a asserção antiga nos dois projetos), verde depois.

## Correção

Só asserção, em `e2e/acesso-da-turma.spec.ts`: o trecho da linha 1103 e a constante `SERIE_DA_TURMA`, que a linha 304 passa a
usar também. O código da web não muda: a tela com o `h1` "Turma" é o desenho da 11.0 (`titulo-das-telas.test.tsx`
já a cobre), e o dado da turma continua fora do DOM, que é o que o teste quer provar.

## Mutações

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: e2e/acesso-da-turma.spec.ts › a releitura que cai com o código projetado não tira o diálogo da tela: a turma e o acesso ficam, e a seção mostra o erro por trás; a turma que a releitura deixa de achar sai inteira
-  const nomeDaTurma = turma.data === undefined || indisponivel ? 'Turma' : `Turma ${turma.data.nome}`
+  const nomeDaTurma = turma.data === undefined ? 'Turma' : `Turma ${turma.data.nome}`
```

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: e2e/acesso-da-turma.spec.ts › a releitura que cai com o código projetado não tira o diálogo da tela: a turma e o acesso ficam, e a seção mostra o erro por trás; a turma que a releitura deixa de achar sai inteira
-  const serieDaTurma = turma.data === undefined || indisponivel ? undefined : nomeDaSerie(turma.data.serie)
+  const serieDaTurma = turma.data === undefined ? undefined : nomeDaSerie(turma.data.serie)
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-15 21:17:05 | 2026-10-15 21:17:25 | `frontend-reviewer` | 1 | APROVADO | a38795278bc26b8a9 |
| 2026-10-15 21:17:09 | 2026-10-15 21:17:31 | `tenancy-guardian` | 1 | APROVADO | a573bc337e2f7991f |
| 2026-10-15 21:17:13 | 2026-10-15 21:18:15 | `test-engineer` | 1 | REPROVADO | a633efc70ffb474a6 |
| 2026-10-15 21:31:49 | 2026-10-15 21:32:13 | `test-engineer` | 2 | APROVADO | a1c4e9cb69b8849a8 |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (2ª) | Ajustar duas referências de linha no documento: "linha 304" (hoje 306) nas seções "Fora desta correção" e "Correção", e "trecho da linha 1103" (hoje 1105-1109) | Não aplicada: número de linha muda a cada edição e a 13.0 ainda mexe no mesmo arquivo; o documento já cita o teste pelo nome e o revisor diz que "não muda nada no que o teste prova" |
| frontend-reviewer (1ª) | Aviso abrir com "Turma indisponível" | Recusada (ordem r1): muda texto de tela, fora do escopo de correção de asserção |
| test-engineer (1ª) | Fotos da vitrine não mostram o caso da releitura | Recusada (ordem r1): a vitrine não alcança o estado; a prova é o e2e |

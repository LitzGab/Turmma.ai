# Correção — o enunciado da atividade do aluno fica em 17 px e não acompanha o tamanho da letra escolhido

**Origem:** uso (achado do Implementador da 8.0, `apps/web/src/areas/aluno/Atividade.tsx`); defeito da tarefa 6.0 (`622614af`).
**Subagentes obrigatórios:** `frontend-reviewer`, `revisor-geral`, `test-engineer`, `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`
<!-- `frontend-reviewer` e `revisor-geral` vieram no PEDIDO do Orquestrador. Os outros cinco são os que o portão exige pelos caminhos alterados
     (`apps/` e `e2e/` pedem os quatro guardiões, `tools/processo/guardioes-por-caminho.ts`) e o `test-engineer`, de toda correção. -->

## Sintoma

Com a letra Grande ou Maior (Eu › Ajustes), as alternativas e o resto da tela crescem, mas o enunciado da questão
continua em 17 px. A pessoa que escolheu letra maior lê o enunciado, a parte mais importante, no tamanho de antes.

## Fora desta correção

Nada: a árvore estava limpa.

## Causa

A 6.0 escreveu o corpo do enunciado como `text-[17px]`. O tamanho da letra do aluno (8.0) muda o `font-size` do `<html>`
(112,5 % e 125 %), e só acompanha o que a pele mede em `rem`; `17px` é absoluto e não se move. As alternativas usam
`text-base` e `text-xl`, que são `rem`, e por isso cresciam. A 6.0 é anterior à 8.0, e nenhum teste media o enunciado
com a letra trocada. O ramo `fonte_ampliada` (`text-2xl`) já era `rem` e não é afetado.

## Teste que reproduz

`e2e/tamanho-da-letra.spec.ts › o enunciado da tarefa aberta acompanha a letra: 17 px no Padrão e 21,25 px com Maior escolhida no diálogo, com a tarefa aberta pelo endereço`.
Escolhe Maior pelo diálogo, abre a tarefa e mede o `font-size` calculado do enunciado: 17 px e 21,25 px.
Vermelho antes: a primeira versão do caso, que escolhia Grande e depois Maior, falhou em Grande com 17 px no lugar de 19,125 px. O caso foi enxuto depois para caber na metade do prazo (só Maior), e o vermelho dele é o da mutação abaixo, que devolve `17px` e é provada pelo portão. Verde depois da correção.

## Correção

`Atividade.tsx`: `text-[17px]` passa a `text-[1.0625rem]` (os mesmos 17 px no Padrão, em `rem`). Nada mais muda.

## Mutações

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: e2e/tamanho-da-letra.spec.ts › o enunciado da tarefa aberta acompanha a letra
-         <h2 ref={enunciado} tabIndex={-1} className={`min-w-0 rounded-controle leading-relaxed font-normal break-words whitespace-pre-wrap text-tinta ${ampliada ? 'text-2xl' : 'text-[1.0625rem]'}`}>
+         <h2 ref={enunciado} tabIndex={-1} className={`min-w-0 rounded-controle leading-relaxed font-normal break-words whitespace-pre-wrap text-tinta ${ampliada ? 'text-2xl' : 'text-[17px]'}`}>
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Usar `t-corpo` no lugar de `text-[1.0625rem]` no enunciado | Recusada: a classe traz a altura de linha dela, e o enunciado hoje usa `leading-relaxed`; trocar muda a tela e o contrato visual além do tamanho. Cabe a uma tarefa visual própria, não a esta correção |
| frontend-reviewer (1ª), revisor-geral (1ª), test-engineer (1ª) | Medir também a letra Grande (19,125 px), em caso curto separado | Recusada: o `toBe(21.25)` de Maior já pega a mutação (o revisor-geral diz "cobertura extra, não buraco"), e o caso foi enxugado de propósito para caber no prazo |
| frontend-reviewer (1ª) | Fotografar a questão aberta em Maior, a 360 px, quando a vitrine tiver tarefa "Para fazer" | `TODO.md`: a vitrine (`tools/vitrine/escola.ts`) não semeia tarefa a fazer para o aluno; o Validador fotografa a tela no fim da spec |
| test-engineer (1ª) | Outros `text-[Npx]` nos componentes que a área do aluno usa (`Toque.tsx:39`, `Aviso.tsx:54`, `ui/ia/AssinaturaIA.tsx:34`, `ui/onca/Onca.tsx:124`, `meus-dados/MeusDados.tsx:217`, `MenuDaPessoa.tsx:64`) e uma guarda que recuse `text-[Npx]` nas telas do aluno | `TODO.md`, para correção própria: é o mesmo defeito em outros arquivos, fora do escopo desta correção |
| revisor-geral (2ª) | Reescrever a frase da linha 28 do documento ("o vermelho dele é o da mutação abaixo, que devolve `17px`") | Recusada: descreve o histórico do vermelho, e a seção "Mutações" já mostra o que a mutação faz; não muda a prova |
| test-engineer (2ª) | `achados/…:79` ainda cita o título antigo | Recusada: `achados/` é escrito só pelo hook (protocolo, item 5) e é registro do que o revisor viu na 1ª rodada |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 16:34:11 | 2026-10-25 16:34:24 | `tenancy-guardian` | 1 | APROVADO | ad109f041333dc2bb |
| 2026-10-25 16:34:08 | 2026-10-25 16:34:26 | `frontend-reviewer` | 1 | APROVADO | a333d721b419316c7 |
| 2026-10-25 16:34:14 | 2026-10-25 16:34:32 | `infra-guardian` | 1 | APROVADO | a9d4712a59ff19fda |
| 2026-10-25 16:34:12 | 2026-10-25 16:34:32 | `privacy-guardian` | 1 | APROVADO | a959c73209b05fd0a |
| 2026-10-25 16:34:13 | 2026-10-25 16:34:35 | `conformidade-reviewer` | 1 | APROVADO | ac497594f9ed672c1 |
| 2026-10-25 16:34:09 | 2026-10-25 16:34:42 | `revisor-geral` | 1 | APROVADO | ae7363cce444fa85b |
| 2026-10-25 16:34:10 | 2026-10-25 16:35:09 | `test-engineer` | 1 | APROVADO | af914cc559f000f66 |
| 2026-10-25 16:49:07 | 2026-10-25 16:49:43 | `test-engineer` | 2 | APROVADO | a4d007aba016d440c |
| 2026-10-25 16:49:11 | 2026-10-25 16:50:13 | `revisor-geral` | 2 | APROVADO | aa90904b2bedd7236 |

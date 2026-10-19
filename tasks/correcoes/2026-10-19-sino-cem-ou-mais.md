# Correção — com mais de 100 entregas esperando, o sino diz "100", e não "100 ou mais"

**Origem:** `tasks/prd-telas-do-professor/validacao.md` §4, A1 (PRD §7, "Mais de 100 entregas esperando").
**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`, `revisor-geral`
<!-- `frontend-reviewer` veio no PEDIDO do Orquestrador. `revisor-geral` entra porque a correção altera 8 arquivos fora de tasks/ (passa de 5). -->

## Sintoma

O PRD promete, na borda "Mais de 100 entregas esperando": "O sino diz '100 ou mais'". Com a API devolvendo a página cheia de entregas
pendentes (100) e outra atrás (`proxima`), o botão do sino dizia `Esperando você, 100`, com a pílula `100`, e o painel avisava que parte
da lista não carregou. Nenhum teste usava uma página cheia de entregas, e a troca não estava registrada na Tech Spec.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

`filaDoProfessor` já sabia que a página de entregas veio cheia (`entregas.completa === false`, que deixa a fila `parcial`), mas
só o aviso do painel usava isso. O botão (`nomeDoBotao`, em `Sino.tsx`) e a pílula (`Contador`) recebiam só `itens.length`, que é
o que se leu, e escreviam esse número como se fosse o total. Os pedidos de nome já tinham o "ou mais" (`haMais`); as entregas não.

## Teste que reproduz

- `apps/web/src/areas/professor/fila-do-professor.test.ts › a página de entregas cheia, com outra depois, faz a fila dizer que há mais`:
  100 entregas pendentes lidas com `completa: false`; a fila tem `haMais: true`, e com `completa: true` e as mesmas 100, `haMais: false`.
- `apps/web/src/areas/professor/SinoDoProfessor.test.tsx › com a página de entregas cheia e outra depois, o sino diz "100 ou mais"`:
  a rede devolve 100 entregas e `proxima`; o botão se chama `Esperando você, 100 ou mais`, a pílula mostra `100+`, e o painel
  mantém o aviso de leitura parcial. O controle: as mesmas 100 sem `proxima` dizem `Esperando você, 100`.
- `apps/web/src/componentes/sino/Sino.test.tsx › o nome do botão diz "ou mais" quando a lista lida é um piso`.
- `apps/web/src/componentes/Contador.test.tsx › "ou mais" mostra o sinal de mais e diz "ou mais" ao leitor de tela`.

Vermelho antes da correção: os quatro casos novos falham (`haMais` não existe, o botão diz `Esperando você, 100`, a pílula é `100`).

## Correção

- `fila-do-professor.ts`: `FilaDoProfessor.haMais`, verdadeiro quando as entregas foram lidas e vieram em parte (`!completa`). Nas
  situações em que a fila não leu as entregas (carregando, erro, sem ano letivo) é falso: não há número a dizer.
- `Sino.tsx`: a prop `ouMais` (padrão falso, que é o sino da coordenação); `nomeDoBotao` escreve `Esperando você, N ou mais` quando há
  item, e a pílula leva o `ouMais`. Sem item, o nome continua o da situação (`parte não carregou`): "0 ou mais" não diz nada.
- `Contador.tsx`: a prop `ouMais`. A pílula mostra `N+` (o sinal fora do leitor de tela) e o texto escondido começa por "ou mais".
- `SinoDoProfessor.tsx`: passa `fila.haMais`.
- Tech Spec, seção 5: o "100 ou mais" do sino das entregas passa a estar escrito, ao lado do dos pedidos de nome.

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2).

Sem a leitura em parte, a fila não diz que há mais.

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › a página de entregas cheia
-  const haMais = entregas.estado === 'lida' && !entregas.completa
+  const haMais = false
```

Sem o "ou mais" no nome do botão, o sino diz só o que leu.

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › o nome do botão diz "ou mais"
-  if (itens > 0) return `Esperando você, ${String(itens)}${ouMais ? ' ou mais' : ''}`
+  if (itens > 0) return `Esperando você, ${String(itens)}`
```

Sem passar o `ouMais` à pílula, o número visível continua exato.

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › com a página de entregas cheia e outra depois
-        <Contador n={itens.length} oQueConta="esperando você" ouMais={ouMais} />
+        <Contador n={itens.length} oQueConta="esperando você" />
```

Sem o sinal de mais na pílula, quem vê lê "100".

```mutacao
arquivo: apps/web/src/componentes/Contador.tsx
teste: apps/web/src/componentes/Contador.test.tsx › "ou mais" mostra o sinal de mais
-      {ouMais && <span aria-hidden="true">+</span>}
```

Sem o "ou mais" para o leitor de tela, ele ouve "100 esperando você".

```mutacao
arquivo: apps/web/src/componentes/Contador.tsx
teste: apps/web/src/componentes/Contador.test.tsx › "ou mais" mostra o sinal de mais
-      <span className="sr-only"> {ouMais ? 'ou mais ' : ''}{oQueConta}</span>
+      <span className="sr-only"> {oQueConta}</span>
```

Sem a ligação do sino do professor à fila, o botão nunca diz "ou mais".

```mutacao
arquivo: apps/web/src/areas/professor/SinoDoProfessor.tsx
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › com a página de entregas cheia e outra depois
-      ouMais={fila.haMais}
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Os pedidos de nome dizem "ou mais" pelo `oQueConta` (`fila-do-professor.ts`, `'ou mais pedidos de nome'`) e a pílula do item não leva o `ouMais`: passar `item.haMais` ao `Contador` e tirar o "ou mais" do texto | Não aplicar: muda o que a pílula do item de pedidos mostra ("100" passa a "100+"), isto é, comportamento, e mexe em teste de pedidos fora desta correção. Destino: `TODO.md`, para a tarefa futura que tocar `Sino.tsx` ou `fila-do-professor.ts` |
| revisor-geral (1ª) | Decidir se toda fila `parcial` com item (vínculos com outra página, turma além do teto de 12, contagem de pedidos que falhou) deve dizer "ou mais", e não só a de entregas | Não aplicar: é decisão de produto, e o PRD §7 só promete o "ou mais" para mais de 100 entregas. Destino: Orquestrador, para levar ao `/validar` ou ao Joaquim |
| frontend-reviewer (1ª) | Fotografar o sino em 360 px com a pílula "100+" quando a vitrine puder semear mais de 100 entregas | Não aplicar: depende de a vitrine (`tools/vitrine/`) semear 100 entregas, fora desta correção. Destino: `TODO.md` |
| frontend-reviewer (1ª) | Manter em sincronia o texto escondido da pílula e o `aria-label` do botão se o texto do botão mudar | Sem ação agora: os dois estão coerentes. Nota para quem mexer no texto do botão |
| frontend-reviewer (1ª) | Conferir se o sino da coordenação tem a mesma borda de página cheia (`ouMais` fica falso por padrão lá) | Não aplicar: fora do escopo (o PRD só cita o sino do professor). Destino: uma linha no `/validar` |
| test-engineer (1ª) | Conferir o contrato da paginação de `entregas`: se a API manda `proxima` só quando há outra página, e registrar na Tech Spec §5 | Não aplicar: é conferência de contrato da API, não correção desta tarefa. Destino: Orquestrador, para o `/validar` |
| test-engineer (1ª) | Cenário em `SinoDoProfessor.test.tsx` com pedidos de nome e turma a confirmar junto das 100 entregas, mostrando o piso somado ("102 ou mais") | Não aplicar: é cobertura extra, não regra sem teste, e pede fixture nova e bloco de "Mutações". Destino: `TODO.md` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 16:44:33 | 2026-10-19 16:45:00 | `frontend-reviewer` | 1 | APROVADO | a0fd29a774e019723 |
| 2026-10-19 16:44:27 | 2026-10-19 16:45:00 | `revisor-geral` | 1 | APROVADO | a37e79503fcf2cebc |
| 2026-10-19 16:44:25 | 2026-10-19 16:45:19 | `test-engineer` | 1 | APROVADO | af3107a7e134658db |

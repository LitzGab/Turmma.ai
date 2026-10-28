# Correção — a validação da onça foi reprovada (dois testes que faltam) e a esteira ficou vermelha (a chave do aceno e a cor nova)

**Origem:** `tasks/correcoes/2026-10-28-onca-do-mockup-validacao.md` (REPROVADA, dois críticos) e a esteira `40768156174` em `fbf7400a` (7 falhas, todas de e2e, em `chromebook` e `celular`).
**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`, `revisor-geral`, `tenancy-guardian`, `infra-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: `frontend-reviewer`, `conformidade-reviewer` e `privacy-guardian`. O `test-engineer` é
     obrigatório em toda correção. O `revisor-geral` entra porque a correção altera mais de 5 arquivos fora de `tasks/` (passo 5 de
     `corrigir`). `tenancy-guardian` e `infra-guardian` são o conjunto do padrão que o portão exige para os arquivos alterados
     (`portao-local.ts revisores`); a correção não toca tenant, API, banco nem infra, e cada um deve dizer isso. -->

## Sintoma

1. **Validação reprovada** (`2026-10-28-onca-do-mockup-validacao.md`, seção 4, "Críticos"):
   - as transformações de cada pose da `Onca` (`figura`, `pataE`, `pataD`, `peE`, `peD`, `orelhaE`, `orelhaD`, `rosto`, `sombraDoChao` e o
     `d` do rabo) não estavam congeladas em teste: a validação trocou a pata da pose acenando de lugar (`translate(30 -16)` por
     `translate(0 0)`) e os 72 casos da onça seguiram verdes (a mutação 1);
   - a descida de 6% da cabeça no `AvatarAgente` (`top-[2.44px]`, `top-[3.92px]`, `top-[4.4px]`, `top-[4.88px]`) também não tinha teste:
     trocar por `top-px` não deixava nada vermelho.
2. **Esteira `40768156174`** em `fbf7400a` (`gh run view 40768156174 --log-failed`):
   - `professor-introducao:75`, `coordenacao-introducao:68`, `aluno-introducao:81`, `:104` e `:124` e `aparencia:100` falham no "nada fica no
     navegador": `Expected: "[]"`, `Received: "[[\"turmma-onca-acenou\",\"1\"]]"`. O `aparencia:100` é o mesmo defeito, lido no
     `sessionStorage`;
   - `tokens:143` (E5): `bloco claro da 9.10`, `Expected: 97`, `Received: 98`.

## Fora desta correção

Nada: a árvore estava limpa.

## Causa

1. **Os dois críticos:** a correção anterior congelou o traço da onça (os caminhos, as medidas, as cores), mas não o que cada pose
   gira e desloca, nem o `top` do avatar. O `test-engineer` pediu isso na rodada 1 e o pedido foi para o `TODO.md` em vez de entrar no
   código. Sem teste que compare o valor com o do mockup, a pose podia se afastar dele sem ninguém ver.
2. **A chave do aceno:** o aceno "uma vez por sessão" foi copiado do mockup, que grava `turmma-onca-acenou` no `sessionStorage`. O
   produto tem um contrato mais estrito que o do mockup: o navegador guarda só a aparência, a lateral recolhida e a letra do aluno, e
   quem entra depois no mesmo computador não herda nada mais (RF24 da X1; `aparencia.spec.ts`, `*-introducao.spec.ts`). A correção
   anterior não rodou esses specs (a validação rodou só os da onça), e o `privacy-guardian` aprovou a chave como item técnico sem
   dado pessoal, sem que ninguém conferisse o contrato dos specs. A esteira é que pegou.
3. **O 98 no `tokens:143`:** a correção anterior acrescentou o token `onca-chao` à 9.10 (de 97 para 98 cores por bloco) e atualizou a
   constante do teste de unidade (`estilos.test.ts`), mas não a do e2e (`tokens.spec.ts:38`), que tem o mesmo número.

## Teste que reproduz

- **Poses:** `apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › acenando gira a figura, as orelhas, o rosto, as patas, os pés, a sombra e o rabo como o mockup` (e as outras três poses, por `it.each`): vermelho com a mutação 1 da validação.
- **Avatar:** `apps/web/src/componentes/ui/ia/avatar-com-funcao-e-selo.test.tsx › a cabeça recua do anel e desce 6% do tamanho, como no avatar do mockup: 2,44 · 3,92 · 4,4 · 4,88 px do topo do miolo`: vermelho com `top-px`.
- **A chave:** `apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › a marca de já acenou não vai para o navegador, e o sessionStorage e o localStorage ficam vazios depois de acenar` (vermelho no código de antes, que gravava a chave), e os seis casos de e2e da esteira (em `aluno-introducao`, `professor-introducao`, `coordenacao-introducao` e `aparencia`), vermelhos na esteira e verdes depois (rodados isolados, 166 casos verdes em `chromebook` e `celular`; a confirmação final é a esteira).
- **O 98:** `e2e/tokens.spec.ts:143`, vermelho na esteira e verde depois.

## Correção

- `fidelidade-ao-mockup.test.tsx`: `TRANSFORMACOES_DO_MOCKUP` congela, em texto literal copiado do `POSES` do mockup, o `transform` da
  figura, da sombra do chão, do rosto, das duas orelhas, das duas patas e dos dois pés, e o `d` do rabo, nas quatro poses; um caso
  confere que as poses do produto são exatamente as congeladas.
- `avatar-com-funcao-e-selo.test.tsx`: um caso confere, nos quatro tamanhos, que a classe de topo da cabeça é a do mockup
  (recuo menos o anel, mais 6% do tamanho).
- `movimento-da-onca.ts`: "já acenou" passa do `sessionStorage` para uma variável da página. O aceno continua uma vez por sessão (a
  primeira onça acenando; as seguintes ficam paradas), nada fica no navegador, e a página recarregada acena uma vez de novo. A
  decisão é a que respeita o contrato do produto; o `conformidade-reviewer` já tinha aprovado o aceno uma vez, e o que muda é só
  onde se lembra dele. `esquecerQueAcenou` é só para os testes.
- `fidelidade-ao-mockup.test.tsx` (rodada 1): um segundo `it.each` prende a ponta escura do rabo (`circle[r="8"]`) aos dois últimos números do
  caminho congelado, porque o `fim` do produto é uma cópia escrita à parte.
- `movimento-da-onca.ts` (rodada 1): os comentários dizem a verdade: a frase vale para a introdução e a aparência (não para o espelho da fila
  de respostas), a marca é "guardada na memória da página" e não "gravada", e sair da conta sem recarregar não a zera.
- `avatar-com-funcao-e-selo.test.tsx` (rodada 1): sai o `expect` que comparava uma fórmula do teste com números do mesmo teste; a conta fica
  em comentário, e a classe lida do `span` é quem protege o componente.
- `movimento-da-onca.test.tsx`: usa `esquecerQueAcenou` no lugar de `sessionStorage.clear()`; o caso do armazenamento negado vira
  "nada vai para o navegador" (`sessionStorage` e `localStorage` vazios depois de acenar).
- `e2e/tokens.spec.ts`: `CORES_POR_BLOCO` de 97 para 98, o mesmo número de `estilos.test.ts`.
- `TODO.md`: saem os três itens que esta correção fecha (a chave na lista da regra 20, que deixou de existir; as transformações; a descida).

## Divergências resolvidas

Nenhuma.

## Recomendações sem aplicar

Da rodada 1 (`.processo/ordens/2026-10-28-onca-do-mockup-v2-r1.md`):

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª), frontend-reviewer (1ª), revisor-geral (1ª), infra-guardian (1ª) | Os sete casos de e2e da esteira (`*-introducao`, `aparencia:100`, `tokens:143`) não foram alterados; só a próxima esteira prova que ficam verdes | O Implementador os rodou isolados (166 casos de e2e verdes, em `chromebook` e `celular`); a confirmação final é a esteira, antes do pouso |
| privacy-guardian (1ª), infra-guardian (1ª), test-engineer (1ª) | `esquecerQueAcenou` é exportado do código de produção e "só para os testes" é só comentário; uma guarda que reprove o uso fora de `*.test.*` (ou `@internal`) | `TODO.md`: criar a guarda se aparecer um segundo caso assim |
| privacy-guardian (1ª), revisor-geral (1ª) | `tasks/prd-pele-e-casca/mockup.md:1369` e `docs/interface.md:1154` ainda descrevem o aceno pela chave do `sessionStorage` ou sem dizer que "sessão" é a página aberta | `TODO.md`: ajuste de texto de documento fora desta correção; o Arquiteto o faz na próxima passagem por `docs/interface.md` |
| revisor-geral (1ª), test-engineer (1ª) | Falta congelar a mão de cada pose (`maoD`/`punho`, `cy` 212 nas poses acenando e apontando); anterior a esta correção | `TODO.md`, junto da fidelidade da onça (já anotada) |
| frontend-reviewer (1ª), conformidade-reviewer (1ª) | "Colégio sintético da vitrine cheia 4abf251d" aparece na foto da coordenação, com id | Já está no `TODO.md`; é do seed de `tools/vitrine/` |
| revisor-geral (2ª) | O bloco da mutação 11 ficou depois da seção "Revisões" | Aplicada: o bloco foi para "Mutações" |
| revisor-geral (2ª) | `fidelidade-ao-mockup.test.tsx:231-237`: o `split(/[\s,CML]+/)` só entende `M`, `C` e `L` | Recusada: os quatro caminhos usam só `M` e `C`, e o `test-engineer` (2ª) conferiu que um comando novo dá `NaN` e o caso falha alto |
| test-engineer (2ª) | O bloco de mutação 11 prova só a pose acenando; as outras três ficam no mesmo `it.each` | Sem ação: não é lacuna de prova |
| test-engineer (2ª) | `TODO.md` ainda manda congelar a mão de cada pose | Já está no `TODO.md` |
| test-engineer (2ª), revisor-geral (2ª) | Os sete casos de e2e da esteira só se confirmam na próxima esteira | Já na tabela acima |
| revisor-geral (2ª) | Sair da conta sem recarregar não zera a marca de "já acenou" | Validador, no fim da correção, como comportamento aceito; o comentário de `movimento-da-onca.ts` já diz isso |

## Mutações

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › acenando gira a figura, as orelhas, o rosto, as patas, os pés, a sombra e o rabo como o mockup
     figura: 'rotate(-4 120 220)',
-    pataD: `translate(30 -16) ${giro(-150, OMBRO_D)}`,
+    pataD: `translate(0 0) ${giro(-150, OMBRO_D)}`,
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › comemorando gira a figura, as orelhas, o rosto, as patas, os pés, a sombra e o rabo como o mockup
-    sombraDoChao: 'translate(120 228) scale(.8 1) translate(-120 -228)',
+    sombraDoChao: 'translate(120 228) scale(1 1) translate(-120 -228)',
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › apontando gira a figura, as orelhas, o rosto, as patas, os pés, a sombra e o rabo como o mockup
     rosto: 'translate(9 0)',
-    orelhaE: 'translate(12 8)',
+    orelhaE: 'translate(0 0)',
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › pensando gira a figura, as orelhas, o rosto, as patas, os pés, a sombra e o rabo como o mockup
-    pataD: giro(116, OMBRO_D),
+    pataD: giro(100, OMBRO_D),
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › apontando gira a figura, as orelhas, o rosto, as patas, os pés, a sombra e o rabo como o mockup
-    rabo: { d: 'M196 196 C224 196 226 170 216 152', fim: [216, 152] },
+    rabo: { d: 'M196 196 C224 196 226 170 216 160', fim: [216, 152] },
```

```mutacao
arquivo: apps/web/src/componentes/ui/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ui/ia/avatar-com-funcao-e-selo.test.tsx › a cabeça recua do anel e desce 6% do tamanho, como no avatar do mockup: 2,44 · 3,92 · 4,4 · 4,88 px do topo do miolo
-  24: 'top-[2.44px] left-px size-[18px]',
+  24: 'top-px left-px size-[18px]',
```

```mutacao
arquivo: apps/web/src/componentes/ui/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ui/ia/avatar-com-funcao-e-selo.test.tsx › a cabeça recua do anel e desce 6% do tamanho, como no avatar do mockup: 2,44 · 3,92 · 4,4 · 4,88 px do topo do miolo
-  48: 'top-[4.88px] left-0.5 size-10',
+  48: 'top-0.5 left-0.5 size-10',
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/movimento-da-onca.ts
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › a marca de já acenou não vai para o navegador, e o sessionStorage e o localStorage ficam vazios depois de acenar
-    if (acena) jaAcenou = true
+    if (acena) {
+      jaAcenou = true
+      sessionStorage.setItem('turmma-onca-acenou', '1')
+    }
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/movimento-da-onca.ts
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › só a primeira onça acenando da sessão acena, e só uma vez
-    if (acena) jaAcenou = true
+    if (acena) jaAcenou = false
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/movimento-da-onca.ts
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › só a primeira onça acenando da sessão acena, e só uma vez
-  const [acena] = useState(() => acenando && !reduzMovimento() && !jaAcenou)
+  const [acena] = useState(() => acenando && !reduzMovimento())
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › acenando põe a ponta escura do rabo nos dois últimos números do caminho dele, como o mockup
-    rabo: { d: 'M196 196 C230 190 234 140 214 124 C202 114 190 126 198 136', fim: [198, 136] },
+    rabo: { d: 'M196 196 C230 190 234 140 214 124 C202 114 190 126 198 136', fim: [214, 124] },
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-28 22:02:16 | 2026-10-28 22:02:46 | `frontend-reviewer` | 1 | APROVADO | ad4b56ac305baf322 |
| 2026-10-28 22:02:35 | 2026-10-28 22:02:58 | `tenancy-guardian` | 1 | APROVADO | aef3d431221b90622 |
| 2026-10-28 22:02:21 | 2026-10-28 22:03:04 | `conformidade-reviewer` | 1 | APROVADO | ad7419afbc866b98f |
| 2026-10-28 22:02:40 | 2026-10-28 22:03:06 | `infra-guardian` | 1 | APROVADO | aafa6dd4482364f28 |
| 2026-10-28 22:02:26 | 2026-10-28 22:03:13 | `privacy-guardian` | 1 | APROVADO | ad0da8762681151c5 |
| 2026-10-28 22:02:31 | 2026-10-28 22:04:01 | `revisor-geral` | 1 | APROVADO | a4588b2b16fd4a51e |
| 2026-10-28 22:02:11 | 2026-10-28 22:04:35 | `test-engineer` | 1 | REPROVADO | a81aada8aa71de738 |
| 2026-10-28 22:11:38 | 2026-10-28 22:11:53 | `revisor-geral` | 2 | APROVADO | a0739f1a6832202d9 |
| 2026-10-28 22:11:31 | 2026-10-28 22:11:57 | `test-engineer` | 2 | APROVADO | ab1fb2598526018bc |

# Achados das revisões — `tasks/correcoes/2026-10-15-anel-do-motor-sem-has.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-15 16:50:16 · `tasks/correcoes/2026-10-15-anel-do-motor-sem-has.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: computador e celular, escola cheia e vazia, `/professor/ferramentas/adaptacao`). A foto é estática, então o anel de foco foi conferido pelo código.
Estados: ok. A correção não toca carregando, erro, vazio nem com dado. O vazio da foto convida ("Ainda não há atividade para adaptar" mais o botão "Gerar uma atividade"), e o cheio mostra a lista de tipos.
Acessibilidade: ok.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/MotorFormulario.tsx:66` mantém o `<input type="checkbox">` nativo, de 24 px, dentro de um `<label>` que o envolve.
- O anel (3 px, afastado 2 px, `outline-foco`, azul `#146eaa` no claro e `#60b9f4` no escuro) agora é do rótulo por `focus-within`. Fica idêntico ao da `Opcao.tsx:46`.
- Aceito que ele acenda também no clique, como a 4.0 registrou como decisão. A alternativa só pelo teclado exigiria `:has()`, que a pele proíbe.
- A fieldset com legenda, a dica e a marca de obrigatório continuam como estavam.

Chromebook fraco: melhora. O CSS gerado deixa de conter `:has(`, que não existe antes do Chrome 105, e o laboratório roda o 109. O E5 de `e2e/casca.spec.ts:306` (`not.toContain(':has(')`) deve voltar a verde. Não há `has-[` em nenhum arquivo de produção de `apps/web/src`; sobraram só em testes.
Celular: ok. Em 360 px a lista vira uma coluna, sem rolagem horizontal. Cada alvo mede 64 px de altura com o rótulo inteiro clicável, e o botão principal passa de 44 px. O texto longo ("Resposta escrita no lugar da oral") quebra dentro da caixa sem cortar. A grade de duas colunas no computador está íntegra, sem sobreposição.
Ação oficial protegida: sim, não se aplica a esta correção. A mudança é só de classe de foco. A Adaptação continua gerando a versão como saída de IA pendente de aprovação.
Bloqueantes: nenhum.
Recomendações:
- A mutação do documento troca `focus-within:*` por `has-[:focus-visible]:*`. O teste da correção também proíbe `has-[`, o que cobre a regressão pelo lado do `:has()`.
- O `:has()` só era pego pelo E5 na esteira. Vale uma checagem estática barata, por exemplo em `apps/web/src/estilos.test.ts`, que reprove `has-[` em qualquer `.tsx` de produção. A 12.0 já mexe nesse arquivo, então isso fica para depois dela, sem bloquear.

## test-engineer · 1ª rodada · APROVADO · 2026-10-15 16:50:33 · `tasks/correcoes/2026-10-15-anel-do-motor-sem-has.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: o rótulo de cada opção da `CampoDeVarias` tem o anel por `focus-within:outline-*` (3 px, afastado 2 px, `outline-foco`), igual ao da `Opcao` (decisão da tarefa 4.0).
- Regra: nenhuma classe do rótulo gera `:has()`, que não existe antes do Chrome 105 e é proibido pelo techspec e pelo E5 de `e2e/casca.spec.ts`.
- Regressão: a caixa marcada continua azul e a desmarcada continua com o degrau da borda.
- Não há caso de permissão nem de isolamento: a correção é só de estilo, sem dado de escola. Concorrência também não se aplica.

**Cobertos:**
- `apps/web/src/componentes/ia/pecas-revestidas.test.tsx:141-150` exige as quatro classes `focus-within:outline-*` exatas, ordenadas, e nenhuma classe `has-[`.
- A asserção é sobre o resultado (as classes renderizadas no rótulo), não sobre o código ter rodado.
- O teste passa: 9 de 9 em `npx vitest run apps/web/src/componentes/ia/pecas-revestidas.test.tsx`.
- A mutação do documento confere com o `git diff`. A linha `-` aparece literalmente em `MotorFormulario.tsx:66`. Com o `has-[:focus-visible]` de volta, as duas asserções ficam vermelhas pelo motivo certo: a lista `focus-within` fica vazia e a lista `has-[` deixa de ficar vazia. A correção mexe numa cláusula só, e ela tem bloco de mutação.
- As asserções de face e degrau seguem no mesmo teste, antes e depois do clique.
- Não há `.skip`, teste comentado nem mock que esconda a regra. Não há IA envolvida.
- Busquei `has-[` e `:has(` nos arquivos versionados de `apps/web/src`: o único uso de verdade era o do motor, e agora sobram só comentários e testes.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `apps/web/src/componentes/ia/pecas-revestidas.test.tsx:150`: o filtro `includes('has-[')` só pega a variante com colchetes. `has-checked:`, `group-has-*` e `peer-has-*` também geram `:has()` e passariam por ele. Seria melhor usar o mesmo filtro de `Opcao.test.tsx:222` (`includes('has-') || includes(':has(')`). O E5 cobre o CSS gerado como um todo, mas só na esteira; este é o único guardião que roda antes do commit.
2. O documento não traz a revisão de qualquer outra cópia da caixa da `Opcao` fora de `componentes/ia/`. A busca não achou nenhuma, mas registrar na causa que ela foi feita evita repetir a 10.0 numa peça futura.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/correcoes/2026-10-15-anel-do-motor-sem-has.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/MotorFormulario.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/pecas-revestidas.test.tsx

## test-engineer · 2ª rodada · APROVADO · 2026-10-15 17:00:37 · `tasks/correcoes/2026-10-15-anel-do-motor-sem-has.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: o rótulo de cada opção do motor tem o anel por `focus-within:outline-*`, os mesmos quatro valores da `Opcao` (3 px, afastado 2 px, sólido, `outline-foco`).
- Regressão do bug: nenhuma classe do rótulo gera `:has()`. Isso vale para todas as formas: `has-[...]`, `has-checked:`, `group-has-*`, `peer-has-*` e o `:has(` escrito à mão.
- Borda 1: a caixa marcada continua com a face azul e o degrau azul.
- Borda 2: a caixa desmarcada continua com borda de 2 px, degrau da borda e 64 px.
- Permissão, isolamento e concorrência não se aplicam: a correção é só de classe CSS numa peça de tela, sem dado de escola nem operação repetível.

**Cobertos:**
- `apps/web/src/componentes/ia/pecas-revestidas.test.tsx` › "a lista de tipos é uma caixa por tipo":
  - confere a lista exata das quatro classes `focus-within:outline*`, ordenadas;
  - exige vazia a lista das classes que contêm `has-` ou `:has(`. O filtro agora pega `has-checked:` e `group-has-*`, como pediu a recomendação 1 da rodada anterior.
- O estado marcado e o desmarcado seguem cobertos pelas asserções que já existiam no mesmo teste.
- Rodei `npx vitest run apps/web/src/componentes/ia/pecas-revestidas.test.tsx`: 9 de 9 verdes.
- As duas mutações chegam à cláusula pelo motivo certo:
  - a 1ª (`focus-within:*` trocado por `has-[:focus-visible]:*`) derruba a asserção da lista e a do filtro;
  - a 2ª (acrescenta `has-checked:border-azul` direto no rótulo, valendo nos dois estados) só pode cair pelo filtro novo, `includes('has-')`, porque a lista das `focus-within` não muda. Ela prova exatamente o que mudou nesta rodada.
- O filtro não dá falso positivo: nenhuma classe atual do rótulo contém `has-`.
- Não há `.skip`, mock nem IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `tasks/correcoes/2026-10-15-anel-do-motor-sem-has.md:59-64`: o 2º bloco `mutacao` ficou dentro da seção "Revisões", depois da tabela do hook, e não em "## Mutações". O portão lê os blocos no documento inteiro, então ele vale do mesmo jeito. O problema é que `acrescentarRevisao` (`tools/processo/revisoes.ts:367`) acrescenta cada rodada no fim do arquivo. A linha desta rodada vai cair embaixo da tabela "Recomendações da rodada 1…", que tem 3 colunas, e o markdown fica quebrado. A leitura das rodadas pelo hook não quebra, porque ela pega toda linha `| AAAA-` depois do título "Revisões". Correção sugerida: mover o bloco para "## Mutações" e a seção "Recomendações da rodada 1…" para antes de "## Revisões", deixando a tabela do hook por último.
2. `apps/web/src/componentes/ia/pecas-revestidas.test.tsx:150`: o filtro de `has-` só olha o rótulo desmarcado. Um `has-*` posto só no ramo `marcado` do `MotorFormulario.tsx:66` passaria no unitário e só seria pego pelo E5 na esteira. Repetir a mesma asserção depois do clique que marca a caixa fecha esse buraco por uma linha.

# Achados das revisões — `tasks/correcoes/2026-10-17-lista-de-nomes-com-41-px.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 10:31:45 · `tasks/correcoes/2026-10-17-lista-de-nomes-com-41-px.md`

VEREDITO: APROVADO
Tela vista: sim (5 fotos lidas, cheia e vazia, computador e celular). A foto "celular-2" é só a continuação da lista de professores da escola cheia. Nas fotos o link "Lista de nomes" aparece como o nome da turma em negrito. Não vi nenhuma diferença de layout causada pelo `min-h-11`: a linha da tabela já tinha cerca de 70 px, e o cartão de 360 px não rola na horizontal. A barra de navegação do celular cortando o meio da foto é só o efeito da captura de página inteira com a barra fixa, não um defeito desta correção.
Estados: ok. A correção não mexe neles. Cheio e vazio estão nas fotos. Carregando e erro não aparecem na vitrine e não foram alterados.
Acessibilidade: ok. O link mantém o `aria-label` "Lista de nomes da turma …", o anel de foco no `::after` que cobre a linha e `hover:underline`, sem depender de hover para agir. A área de toque sobe para 44 px.
Chromebook fraco: sem impacto. A mudança é só de classe CSS.
Celular: ok. O `min-h-11` dá os 44 px que o W12 exige na ação principal. O `wrap-anywhere` evita a rolagem horizontal de 13 px que o nome de 29 letras causava. Nas fotos de 360 px não há rolagem nem corte. O W12 (`e2e/estrutura.spec.ts:765`) continua sem alteração e é quem mede de verdade.
Ação oficial protegida: sim. Não se aplica; o link só navega para a lista de nomes.
Bloqueantes: nenhum.
- `Estrutura.tsx:86` bate com o link de `Professores.tsx:65`, que já tem `min-h-11`, `max-w-full` e `items-center`. As classes novas são `inline-flex min-h-11 max-w-full min-w-0 items-center wrap-anywhere`.
- O teste em `Estrutura.test.tsx:293` cobre 1366 e 360 px e checa as quatro classes. As quatro mutações do documento correspondem uma a uma às classes testadas. Não rodei os testes nem o portão; revisei diff e fotos.

Recomendações:
- O `after:absolute` do link depende de a célula ou o cartão ser `relative`. O teste já checa isso na linha 290, então não precisa de ação.
- Se as fotos contradisserem o código da árvore, vale o código. Aqui as fotos não mostram o link com altura medida, então a medida de 44 px fica com o W12.

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 10:32:25 · `tasks/correcoes/2026-10-17-lista-de-nomes-com-41-px.md`

VEREDITO: APROVADO

**Cenários exigidos**
- Caminho feliz: o link "Lista de nomes da turma <nome>" tem caixa de pelo menos 44 px, tanto na tabela (1366 px) quanto no cartão (360 px).
- Borda 1: um nome comprido e sem espaço (`7` seguido de 28 `A`) não pode criar rolagem horizontal a 360 px depois que o link passa a ser `inline-flex`.
- Borda 2: a troca do layout de tabela para cartão abaixo de 768 px. Nos dois casos o link vem da mesma célula de `Tabela.tsx`.
- Permissão e isolamento: não se aplicam. A correção só muda classe CSS, não toca dado, endpoint nem consulta.
- Concorrência: não se aplica.

**Cobertos**
- `apps/web/src/areas/coordenacao/Estrutura.test.tsx:293`: o `it.each([1366, 360])` confere `inline-flex`, `min-h-11`, `items-center` e `wrap-anywhere` no link real da linha, nas duas larguras. Rodei o teste e ele passa (2 de 2).
- Confrontei os quatro blocos de mutação com o `git diff`. Cada um tira uma classe que o teste confere: `min-h-11`, `items-center`, `inline-flex` e `wrap-anywhere`. Cada um fica vermelho pelo motivo certo, porque o `toContain` daquela classe falha. O texto `-` de cada bloco bate com `Estrutura.tsx:87`.
- A medida de verdade continua com o W12 (`e2e/estrutura.spec.ts:765`), que não foi alterado. Ele mede a caixa do link a 360 px (`:791`, `:795`) e confere `larguraExcedente` igual a 0 (`:784`) com o nome de 29 letras (`:773`). Isso cobre as duas bordas no navegador, nos projetos `chromebook` e `celular`.
- Não há `.skip`, teste comentado nem mock escondendo a regra. A falsa rede só serve a lista de turmas.

**Bloqueantes:** nenhum.

**Recomendações**
1. `apps/web/src/areas/coordenacao/Estrutura.tsx:87`: `max-w-full` e `min-w-0` são cláusulas novas sem bloco de mutação e sem asserção. Não bloqueio porque, pelo que li, nenhuma regra depende delas neste layout:
   - `min-w-0` não faz efeito. O pai do link é `div.t-cartao` no cartão (`Tabela.tsx:66`) e `th` na tabela (`Tabela.tsx:100`), e nenhum dos dois é contêiner flex.
   - `max-w-full` repete o que o `wrap-anywhere` já faz, porque ele já deixa a caixa dentro da largura disponível.
   - O documento as justifica só como cópia de `Professores.tsx`.

   Ou tire as duas, ou declare no documento o que cada uma garante e escreva um bloco para cada. Classe que fica sem papel declarado vira "mexe e ninguém sabe se pode".
2. O W12 é a única prova da altura real (o jsdom não mede) e da ausência de rolagem. Como `e2e/estrutura.spec.ts` não foi alterado, o portão da tarefa não roda esse teste: a prova só chega na esteira, depois do commit. O documento diz isso. O Orquestrador deve conferir o W12 verde nos dois projetos na esteira seguinte antes de dar a correção por fechada.

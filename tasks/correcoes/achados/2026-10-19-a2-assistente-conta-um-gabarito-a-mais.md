# Achados das revisões — `tasks/correcoes/2026-10-19-a2-assistente-conta-um-gabarito-a-mais.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 15:14:27 · `tasks/correcoes/2026-10-19-a2-assistente-conta-um-gabarito-a-mais.md`

VEREDITO: APROVADO
Tela vista: não. A correção só altera `e2e/a2-assistente.spec.ts` e não toca `apps/`. A tela do artefato aberto exige o id de um artefato, que a vitrine não semeia. Revisei pelo código, e a tela será vista na validação.
Estados: ok, sem mudança. A correção não toca tela.
Acessibilidade: sem mudança. O `violacoesGraves(page)` da linha 89 continua valendo sobre a página inteira.
Chromebook fraco: não se aplica. É só teste.
Celular: sem mudança. A asserção roda nos dois projetos, `chromebook` e `celular`, e `larguraExcedente` da linha 88 continua ali.
Ação oficial protegida: sim. Nada nela mudou. A aprovação e o "quem aprovou e quando" do mesmo caso seguem intactos.

Bloqueantes: nenhum.
- Confirmei no código que a causa descrita no documento é a real. `Artefato.tsx:269` põe o `<span>Gabarito</span>` do interruptor fora da `<Folha>`, e `Artefato.tsx:274` abre `<Folha>`, que renderiza `<article data-folha>` em `Folha.tsx:23`. O selo "Gabarito" das alternativas certas (`ConteudoDoArtefato.tsx:57`) fica dentro da folha. Assim, a contagem de 5 dentro de `[data-folha]` mede só os selos, e o rótulo do interruptor sai da conta.
- A asserção continua mordendo. Sem o selo, a folha teria 0 "Gabarito", e a mutação declarada prova isso.
- O produto não mudou, e o desenho da 6.0 está correto. Não há regra de interface ferida.

Recomendações:
- Em `Artefato.tsx:269-270`, o `<span>Gabarito</span>` visível e o `rotulo="Gabarito"` do `Interruptor` repetem o texto dentro do mesmo `<label>`. Isso pode fazer o leitor de tela anunciar o nome duas vezes. Vale conferir na validação se o `Interruptor` já esconde um dos dois.

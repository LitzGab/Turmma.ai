# Achados das revisões — `tasks/correcoes/2026-10-18-mutacao-de-e2e-no-projeto-declarado.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-18 11:49:38 · `tasks/correcoes/2026-10-18-mutacao-de-e2e-no-projeto-declarado.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de código de processo, sem seção de Tech Spec. O documento `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-mutacao-de-e2e-no-projeto-declarado.md` é o contrato, e o diff segue o que ele pede.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/mutacoes.ts:206`: o `rotulo` não mostra o projeto. Quando a mesma mutação aparece em `celular` e em `chromebook`, o portão imprime duas linhas iguais, uma com ✓ e outra com ✗, e não dá para saber qual projeto reprovou. Basta acrescentar `[celular]` ao rótulo quando `mutacao.projeto` existir. É justamente o caso que o novo `it` "a mesma mutação em dois projetos" exercita.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/.claude/skills/executar-task/SKILL.md:77-79`: a quebra de linha ficou irregular. Há uma linha curta ("...no celular (o") seguida de uma linha longa que passa da largura do resto do arquivo. Vale reflowar o parágrafo.
- O exemplo de bloco no `SKILL.md` e no `task-template.md` continua sem a linha `projeto:`. Só a prosa fala dela. Um segundo exemplo com e2e e `projeto: celular` deixaria o formato inequívoco para quem escreve o bloco. É opcional.

Sobre o que conferi:
- A impressão do carimbo não muda para os blocos que já existem. Sem a linha, a chave `projeto` fica de fora do objeto, então `JSON.stringify` dá o mesmo resultado de antes. Isso cumpre a promessa do documento de não invalidar carimbos.
- A chave da corrida limpa (`comando.join(' ')`) já existia antes desta correção. A 9ª mutação prova uma cláusula antiga com um teste novo, e isso é legítimo.
- A lista `PROJETOS_DO_E2E` é conferida contra `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/playwright.config.ts` (linhas 46 e 51) por um teste. Um projeto novo no Playwright deixa esse teste vermelho, como o limite registrado no `TODO.md` descreve.

## test-engineer · 1ª rodada · APROVADO · 2026-10-18 11:50:08 · `tasks/correcoes/2026-10-18-mutacao-de-e2e-no-projeto-declarado.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** um bloco com `projeto: celular` monta o comando com `--project=celular`. Vale pelos dois caminhos, o `tools/ci/e2e.ts` (que reconstrói a web) e o `npx playwright test` (fixture do próprio e2e).
- **Bloco sem a linha:** continua no `chromebook`, e a impressão do carimbo não muda (o campo `projeto` fica ausente).
- **Projeto que não existe** (`tablet`): é erro do bloco.
- **A linha num teste que não é e2e** (integração): é erro do bloco.
- **Ordem dos erros:** quando falta `arquivo:`, esse erro não fica escondido atrás do erro de projeto.
- **A lista do código bate com o `playwright.config.ts`.**
- **A mesma mutação nos dois projetos:** cada uma tem a sua corrida limpa e a sua corrida mutada. A cláusula que só vale no celular sai vermelha lá e verde no `chromebook`.
- **Permissão e isolamento de escola:** não se aplicam, a correção é ferramenta de processo e não toca dado.
- **Concorrência:** não se aplica, `conferirMutacoes` roda em sequência por desenho.

**Cobertos:** todos os cenários acima, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/mutacoes.test.ts:153-203`.
- Rodei `npx vitest run tools/processo/mutacoes.test.ts`: 23 de 23 verdes.
- **Seção "Mutações" contra o `git diff`:** toda cláusula nova de `mutacoes.ts` tem bloco.
  - O padrão do projeto em `comandoDoTeste` tem dois blocos: sem o `??` e com o padrão trocado.
  - O `!PROJETOS_DO_E2E.some` e o `!== 'e2e'` têm bloco.
  - A guarda `!erro && projeto !== null` tem dois blocos, um para cada metade.
  - O espalhamento condicional do `projeto` tem bloco.
  - A lista `PROJETOS_DO_E2E` tem bloco.
  - A chave da corrida limpa (`comando.join(' ')`) já existia antes, e agora está travada por um teste novo.
- Li cada bloco contra o teste citado, e todos chegam à cláusula. Exemplos:
  - O bloco 6 só fica vermelho pelo `bloco 4` do teste de erros: o erro de projeto sobrescreveria "falta a linha arquivo:".
  - O bloco 7 cai em `not.toHaveProperty('projeto')`. Sem o espalhamento, o objeto teria a chave `projeto: undefined`.
- **O `--project=celular` chega ao Playwright no caminho com reconstrução:** `opcoesDoPlaywright` (`tools/ci/prazo-do-e2e.ts:94`) repassa `--project=`.
- Nenhum `.skip`. O falso `rodar` substitui só o processo externo e não esconde a regra.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `mutacoes.ts:73-77`: se o bloco tiver duas linhas `projeto:`, vale a última, sem aviso. Um erro de "linha repetida" seria mais honesto, e o mesmo vale para `arquivo:` e `teste:`, que já se comportam assim.
2. `mutacoes.ts:175`: o padrão depende de `PROJETOS_DO_E2E[0]`. Se alguém trocar a ordem dos projetos no `playwright.config.ts`, o teste de lista quebra, mas a mensagem não diz que a ordem define o padrão. Vale nomear o padrão numa constante, `PROJETO_PADRAO = 'chromebook'`, ou dizer isso no comentário do teste.
3. `.claude/skills/executar-task/SKILL.md:77-79`: a linha nova passou da largura do parágrafo em volta (só reflow do texto).

## test-engineer · 2ª rodada · APROVADO · 2026-10-18 11:54:30 · `tasks/correcoes/2026-10-18-mutacao-de-e2e-no-projeto-declarado.md`

VEREDITO: APROVADO

Cenários exigidos (para o que mudou nesta rodada):
- Com a linha `projeto:`, o rótulo da mutação mostra o projeto entre colchetes, e as duas linhas da mesma mutação em `celular` e em `chromebook` saem diferentes. Assim se vê qual das duas reprovou.
- O bloco de mutação novo (o 10º) fica vermelho pelo motivo certo.
- O destino que a Mesa deu às recomendações da 1ª rodada.

Cobertos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/mutacoes.test.ts:205-206`: as duas novas asserções conferem a mensagem de cada projeto: `[celular]: vermelho` e `[chromebook]: o teste continuou verde`. As mensagens vêm de `mutacoes.ts:206` e `:241`. O bloco 10 tira o `[projeto]` do rótulo, e as duas asserções caem pela cláusula. É o motivo certo, e a cláusula nova tem bloco.
- Bloco sem `projeto:` mantém o rótulo antigo. A impressão que o carimbo guarda não muda, porque o rótulo não entra nela.
- A recomendação das linhas `projeto:` repetidas foi registrada no `TODO.md:942` com o limite descrito. A do `PROJETO_PADRAO` foi recusada com motivo aceitável: o teste da lista de projetos já fica vermelho se a ordem mudar. O parágrafo do `executar-task/SKILL.md` foi reformatado.
- `npx vitest run tools/processo/mutacoes.test.ts`: 23 de 23 verdes. Não há `.skip` nem mock que esconda a regra.

Bloqueantes: nenhum.

Recomendações:
1. **Bloco 10 no lugar errado.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-mutacao-de-e2e-no-projeto-declarado.md:118-123`, o bloco ficou dentro de "## Revisões", logo abaixo da tabela que o hook manda não editar à mão. Ele deveria estar em "## Mutações".
   - O portão roda o bloco mesmo assim, porque `lerMutacoes` lê o documento inteiro. O problema é só de organização.
2. **Seção "## Recomendações sem aplicar" depois de "## Revisões".** O hook (`revisoes.ts:367`, `acrescentarRevisao`) acrescenta a nova linha de rodada sempre no fim do arquivo. Por isso a 2ª rodada vai cair colada na tabela de recomendações.
   - `lerRevisoes` ainda acha a linha, então não quebra o hook.
   - Mas a tabela de recomendações fica com uma linha de data no meio, e quem a ler no `/retro` pode se confundir.
   - Correção: subir essa seção para antes de "## Revisões". Assim "## Revisões" volta a ser a última seção do documento.
3. **Uma linha ficou longa no parágrafo reformatado.** No `.claude/skills/executar-task/SKILL.md:78`, "Trava se prova pelo efeito..." ficou na mesma linha de "verde reprova o portão" e passa da largura do resto do parágrafo. É só aparência.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-18 11:54:35 · `tasks/correcoes/2026-10-18-mutacao-de-e2e-no-projeto-declarado.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Não há Tech Spec, porque é uma correção de `tools/processo/`. O que mudou desde a 1ª rodada cabe no que a seção "Correção" do documento promete. O rótulo só ganha o `[projeto]` quando o bloco tem a linha `projeto:`, então nenhum bloco existente muda o que imprime.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum.

As três ações da rodada anterior foram feitas:
- **Rótulo com o projeto.** Está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/mutacoes.ts:206`. O teste "a mesma mutação em dois projetos" agora confere `[celular]: vermelho` e `[chromebook]: o teste continuou verde`, e o 10º bloco tira o sufixo e cai nesse teste.
- **Parágrafo do `executar-task/SKILL.md`.** Foi refeito, com uma ressalva na segunda recomendação abaixo.
- **Linha repetida no parser.** Está registrada no `TODO.md` como "a rever", com o motivo de ter ficado de fora.

Recomendações:
- O 10º bloco `mutacao` não está em "Mutações", como a Mesa relatou. Está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-mutacao-de-e2e-no-projeto-declarado.md:118-123`, dentro da seção "Revisões", que diz "Não edite à mão". Funciona, porque `lerMutacoes` lê os blocos do documento inteiro e `lerRevisoes` só pega linhas que começam com data. Já houve o mesmo em `2026-10-18-e2e-que-cita-literal-removido.md` e `2026-10-15-anel-do-motor-sem-has.md`. Mesmo assim, o certo é o bloco ficar em "Mutações", junto dos outros nove. Há também um efeito na ordem do documento: o hook (`revisoes.ts:361-368`) acrescenta cada linha no fim do arquivo. Por isso as linhas da 2ª rodada vão cair depois de "Recomendações sem aplicar", longe da tabela.
- O parágrafo do `executar-task/SKILL.md` não ficou todo refeito. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/.claude/skills/executar-task/SKILL.md:81` sobrou uma linha bem mais longa que as outras ("...falta o teste, e não o bloco. Trava se prova pelo efeito (dois registros), não pela espera. No F3,").

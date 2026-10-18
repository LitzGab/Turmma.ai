# Achados das revisões — `tasks/correcoes/2026-10-18-rodada-conta-pelos-achados.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-18 12:03:19 · `tasks/correcoes/2026-10-18-rodada-conta-pelos-achados.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. É uma correção de código de processo e não tem Tech Spec. O documento da correção, `TODO.md` item (b), e o código dizem a mesma coisa, inclusive o limite da aprovação limpa.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo).

Bloqueantes: nenhum.

Recomendações:
1. **A contagem de reprovações seguidas ainda usa a tabela.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/.claude/skills/revisar-tarefa/SKILL.md:171-173` manda a Mesa contar as reprovações seguidas do mesmo revisor "pelas últimas rodadas dele na seção 'Revisões'". Depois desta correção, o número da rodada sai certo, mas as linhas apagadas continuam fora da tabela. Na X1, a Mesa veria uma linha só, "3ª REPROVADO", contaria uma reprovação seguida e não escalaria quando devia. Isso fica fora do escopo pedido. Vale registrar no `TODO.md`, ao lado do limite já declarado, ou mandar a Mesa contar também pelos cabeçalhos de `achados/<documento>.md`.
2. **Chamada com `undefined` posicional.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/revisoes.ts:718-729`, o `acrescentarRevisao(..., undefined, achadosAnteriores)` passa `undefined` só para pular `nota` e chegar ao novo parâmetro. Um objeto de opções (`{ nota, achadosDoDocumento }`) deixaria a chamada legível, e o próximo parâmetro não repetiria o problema. Não bloqueia.
3. **Texto do revisor que copia um cabeçalho com data.** O regex em `revisoes.ts:369` ignora um cabeçalho citado sem data, e há teste para esse caso. Se o revisor colar no texto um cabeçalho completo, com data, de outra tarefa ou de rodada futura, a contagem pula. Fica como risco conhecido. Uma frase no comentário de `ultimaRodadaNosAchados` já cobre.

## test-engineer · 1ª rodada · APROVADO · 2026-10-18 12:03:30 · `tasks/correcoes/2026-10-18-rodada-conta-pelos-achados.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz: o Implementador reescreve o documento depois de uma reprovação, e a rodada seguinte continua do número guardado nos achados.
- Borda 1: o revisor não tem bloco nos achados e a tabela está vazia. Ele começa do 1 e não pega a contagem de outro revisor.
- Borda 2: a tabela está intacta e é maior que os achados, porque uma rodada aprovada limpa não deixa bloco. Vale a tabela.
- Borda 3: o texto do revisor tem uma linha parecida com cabeçalho, sem data. Ela não conta como rodada.
- Borda 4: o veredito tem duas palavras ("AJUSTES NECESSÁRIOS"). Ele é lido.
- O mesmo caminho por `registrar`, num repositório de verdade, dentro da trava do documento.
- Permissão e isolamento: não se aplicam. É código de processo e não toca dado de escola.
- Concorrência: a leitura dos achados entrou na mesma trava (`comTrava`) que já protege o documento. O arquivo de achados é um por documento, então a trava cobre os dois.

Cobertos:
- O caminho feliz e as bordas 1 e 2 estão em `tools/processo/revisoes.test.ts:140-161`.
- As bordas 3 e 4 e o arquivo de achados vazio estão em `tools/processo/revisoes.test.ts:163-173`.
- O caminho por `registrar` está em `tools/processo/revisoes.test.ts:1042-1052`.
- Rodei `npx vitest run tools/processo/revisoes.test.ts` e passaram os 84 testes.
- Conferi os seis blocos de mutação contra o `git diff` e o cenário de cada um chega à cláusula:
  - `naTabela + 1`: espera 3 e daria 1.
  - Usar só os achados: no caso da tabela intacta espera 3 e daria 2.
  - Tirar o `.filter`: o `infra-guardian` espera 1 e daria 3.
  - Trocar `[^·\n]+` por `\S+`: o `frontend-reviewer` espera 4 e daria 0.
  - Tirar a exigência da data: o `revisor-geral` espera 1 e daria 7.
  - Passar `''` a `registrar`: espera 2 e daria 1.
- O formato que o regex lê bate com o que `achadoDaRodada` grava (`revisoes.ts:407`): o veredito é seguido de `fim`, que começa com `\d{4}-`.
- Não há `.skip`, mock nem chamada a provedor de IA.

Bloqueantes: nenhum

Recomendações:
- `tools/processo/revisoes.ts:372`: o `0` em `Math.max(0, ...rodadas)` não tem bloco de mutação próprio. A asserção `ultimaRodadaNosAchados('', ...)` com `toBe(0)` já o pegaria, então declarar o bloco só deixaria isso explícito. No hook o efeito não aparece, porque `Math.max(naTabela, -Infinity)` dá o mesmo resultado.
- Um bloco de revisor pode citar uma linha que começa com `## <revisor> · Nª rodada · VEREDITO · 2026-...`, com data. Ela seria contada e a rodada pularia números. O risco é pequeno. Se valer a pena, o `it` de `revisoes.test.ts:163` pode registrar esse limite, ou o regex pode ancorar no fim de linha depois de `fim`, já que o cabeçalho real termina ali.
- O limite conhecido está escrito no documento e no `TODO.md`: uma rodada aprovada limpa some junto com a seção. Ele mereceria um `it` que o fixe, para que a próxima pessoa não o tome por regressão.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/revisoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-rodada-conta-pelos-achados.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-18 12:07:41 · `tasks/correcoes/2026-10-18-rodada-conta-pelos-achados.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de código de processo, sem Tech Spec. O documento da correção, o `TODO.md` (item b) e o código dizem a mesma coisa sobre a contagem e sobre o limite.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo), conferido com o código atual.
Bloqueantes: nenhum.

Conferi as três recomendações que a Mesa mandou aplicar:
1. **Teste do limite:** feito. O novo `it` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/revisoes.test.ts:164-170` fixa que a rodada aprovada limpa se perde quando a seção some.
2. **Contagem de reprovações seguidas pela tabela:** registrada no `TODO.md`, letra (b), item (i). Aponta a skill `revisar-tarefa`, passo 4.
3. **Cabeçalho com data colado no texto do revisor:** registrado no `TODO.md`, letra (b), item (ii).

A seção "Recomendações sem aplicar" está antes de "Revisões", no lugar certo. Cada recomendação deixada de fora tem destino ou motivo, e não sobrou nenhuma sem tratamento. O diff desta rodada só mexe em teste e em documento, e não toca a lógica de `revisoes.ts`.

Recomendações:
- O `it` do limite monta a mesma situação que "tabela vazia e achados sem bloco dão 1". Isso não tem como mudar, porque a rodada limpa não deixa rastro, mas um teste com a tabela antes e depois da seção sumir mostraria a perda melhor. Hoje só o nome e o comentário dizem o que ele prova.
- O item (b) do `TODO.md` ficou com seis linhas e três sub-itens dentro de um parêntese. Quando ele for retomado, vale separar os itens "a rever" num item próprio.

## test-engineer · 2ª rodada · APROVADO · 2026-10-18 12:07:56 · `tasks/correcoes/2026-10-18-rodada-conta-pelos-achados.md`

VEREDITO: APROVADO

Cenários exigidos: a regra é "a rodada não recomeça do 1 quando a seção 'Revisões' some". Os cenários são:
- caminho feliz: a seção some depois de uma reprovação e a rodada continua dos achados;
- um revisor sem bloco nos achados não pega a contagem de outro revisor;
- quando a tabela está inteira e é maior que os achados, vale a tabela;
- um cabeçalho de outra tarefa colado no texto do revisor não conta como rodada;
- o veredito de duas palavras ("AJUSTES NECESSÁRIOS") também é lido;
- achados vazios dão 0;
- o mesmo caminho por `registrar`, num repositório de verdade;
- nesta rodada, o limite conhecido (a seção some depois de uma aprovação limpa).

Cobertos: todos. O que pedi como correção nesta rodada foi feito:
- O `it` do limite está em `tools/processo/revisoes.test.ts:164-170`.
- O `TODO.md` registra a letra (b) como feita. O limite aparece citando o `it`, e a lista "a rever" traz três itens:
  - (i) a contagem de reprovações seguidas da Mesa pela tabela;
  - (ii) o regex sem âncora no fim da linha;
  - (iii) o `undefined` posicional em `acrescentarRevisao`.
- A seção "Recomendações sem aplicar" do documento diz o destino ou o motivo de cada recomendação.

Concordo com a recusa do bloco para o `0` de `Math.max(0, ...rodadas)`: no hook o efeito é nulo e o `toBe(0)` já pega a mudança. As seis mutações do documento continuam ligadas a `it` que existem, e o diff desta rodada não mexeu em `revisoes.ts`. `npx vitest run tools/processo/revisoes.test.ts`: 85 de 85 passam. Não há `.skip`, mock nem provedor de IA. Concorrência não se aplica: a leitura dos achados passou para dentro da trava do documento, que já existia.

Bloqueantes: nenhum.

Recomendações:
- O `it` do limite (`tools/processo/revisoes.test.ts:164-170`) é uma prova fraca. Ele chama `acrescentarRevisao` com achados sem bloco nenhum, e isso é o mesmo que "seção ausente dá rodada 1": passaria também com o código de antes da correção. O limite mora em `registrar` e `achadoDaRodada`, que não gravam a aprovação limpa, e o teste é puro, então não percebe se `registrar` passar a gravá-la. A promessa do comentário ("se a contagem passar a achá-la, o teste muda") não se cumpre. O que fixaria o limite de verdade é a versão por `registrar`, no `describe('achados separados por documento, com índice')`:
  1. aprovação limpa;
  2. o documento é reescrito sem a seção;
  3. nova aprovação, com a asserção de rodada 1.

  Fica para a próxima tarefa que tocar `registrar`, junto do item (iii) do `TODO.md`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/revisoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/TODO.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-rodada-conta-pelos-achados.md

# Achados das revisões — `tasks/correcoes/2026-10-22-porta-unica-so-import.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-22 12:32:02 · `tasks/correcoes/2026-10-22-porta-unica-so-import.md`

VEREDITO: APROVADO

A correção só muda um teste. Ela não toca dado de pessoa, log, storage, exportação nem envio externo. A proteção que o teste dá à auditoria continua de pé: ele ainda garante que só uma porta grava na auditoria.

Campos pessoais tocados: nenhum. A correção só altera o teste `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/auditoria/porta-unica.test.ts`, sem migration, DTO, entidade ou rota.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: não se aplica, porque a correção não cria nem muda rota.
Logs: limpos. Não há log novo, e os exemplos do teste citam só nomes de módulo, nenhum dado de pessoa.
Auditoria: a proteção continua inteira.
- **O que mudou:** o teste antes acusava qualquer arquivo que citasse o nome do módulo de inserção. Agora acusa só quem importa o módulo de verdade.
- **Por que isso não abre caminho:** as duas checagens que pegam escrita direta na auditoria não mudaram. São `ESCRITA_NA_AUDITORIA` (linhas 30-34), que pega gravação, alteração e exclusão na tabela, e `IMPORTA_A_TABELA` (linha 37), que pega quem importa a tabela. Quem fugisse da porta única sem importar o módulo ainda cairia numa delas.
- **O que eu conferi no código:**
  - O único arquivo que importa o módulo de verdade é `packages/nucleo/src/auditoria/registro-de-auditoria.ts:7`.
  - As outras duas menções não são importação: o caminho aparece como dado em `tools/guardas/escopo-dos-repositories.ts:125` e no teste `tools/guardas/repositories-com-escopo.test.ts:150`, que a varredura nem lê. Os dois arquivos são da 6.0 e não foram auditados aqui.
  - Os próprios exemplos do teste não se acusam: a varredura deixa de fora os arquivos `.test.ts` (linha 18).
- **O que o teste novo prova (linhas 94-115):** ele reconhece as oito formas de importar, incluindo `import type`, `export … from`, `export * from`, `import()`, `require()` e `import 'x'`. E ele não acusa quem só cita o caminho num campo `arquivo:`, numa constante ou num comentário.
- **Resultado:** rodei o arquivo e passaram 7 de 7 testes.

Envio externo: nenhum.
Seed/fixture: não há. Os exemplos do teste são trechos de código, sem dado de pessoa.

Bloqueantes: nenhum.

Recomendações:
- O padrão novo não pega uma importação dinâmica com o caminho montado em variável ou por concatenação, como `import(base + 'insercao-de-auditoria')`. O padrão antigo pegava, porque bastava o nome aparecer no texto. Isso não bloqueia, porque `ESCRITA_NA_AUDITORIA` continua pegando a gravação. Se quiserem fechar o caso, um comentário no padrão pode dizer que essa forma fica de fora por decisão.
- A varredura só deixa de fora os arquivos terminados em `.test.ts`. Isso já era assim antes desta correção. Um teste com outro final, como `.test.tsx` ou `.spec.ts`, que citasse o módulo seria acusado como código. Vale alinhar com o filtro das outras guardas quando alguém mexer nele.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 12:32:28 · `tasks/correcoes/2026-10-22-porta-unica-so-import.md`

VEREDITO: APROVADO

**Cenários exigidos** (é uma correção num teste de guarda estática, sem dado de escola, permissão ou concorrência):
- Na árvore real, só `registro-de-auditoria.ts` importa o módulo de inserção, e o arquivo que só cita o caminho como dado (`tools/guardas/escopo-dos-repositories.ts`, da 6.0) não é acusado.
- O padrão pega como importação cada forma de importar: `from`, `import type`, `import {}` em várias linhas, `export {…} from`, `export * from`, `import()`, `require()` e `import '…'`.
- O padrão não acusa o caminho citado como dado: `arquivo: '…'`, uma constante e dois comentários.
- O controle positivo continua: a varredura real precisa achar o `REGISTRO`, senão o `toEqual([REGISTRO])` fica vermelho. Assim, um padrão que não casasse nada também falharia.

**Cobertos:**
- Os dois testes que a seção "Teste que reproduz" cita estão no arquivo com o nome exato: `porta-unica.test.ts:61` e `porta-unica.test.ts:94`.
- Os cinco blocos de mutação batem com o `git diff`: o filtro e cada um dos quatro prefixos (`from`, `import(`, `require(`, `import\s+`). Cada bloco cai num cenário que exercita aquela cláusula.
- As asserções olham o resultado: a lista exata de quem importa, e `true`/`false` para cada trecho, com o trecho como mensagem.
- Não há `.skip`, teste comentado, mock nem provedor de IA.
- O padrão não tem a flag `g`, então o `.test()` não guarda estado entre chamadas.
- `npx vitest run --project unidade packages/nucleo/src/auditoria/porta-unica.test.ts` passou: 7 de 7 verdes.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **A mutação 1 só fica vermelha por causa de um arquivo da 6.0.** Ela troca o filtro em `porta-unica.test.ts:63` pelo literal antigo. O vermelho vem só de `tools/guardas/escopo-dos-repositories.ts`, que ainda não foi commitado. Hoje o `git grep` só acha dois arquivos com o nome do módulo: o `registro-de-auditoria.ts` e o próprio teste. No commit desta correção, sem a 6.0, essa mutação passaria verde. E se a 6.0 deixar de citar o caminho, a linha 63 fica sem guarda.
   - Sugestão: tirar o predicado para uma função `importaOModuloDeInsercao(texto)`, usada no filtro e no teste unitário, para que a mutação do filtro caia no teste da linha 94.
   - Alternativa: um fixture fixo que cite o caminho como dado, fora da varredura dos testes.
2. **O `\1` e o `\n` no padrão não têm efeito que um teste veja.** A classe `[^'"`\n]*` já impede o casamento de atravessar qualquer aspa, então a promessa de "aspas fechando no mesmo literal" vem dela. Ou se simplifica o padrão, ou se ajusta o texto da seção "Correção" e o comentário em `porta-unica.test.ts:40-44`, para não sugerir que o `\1` carrega a regra.
3. **Falta um caso negativo do tipo string que menciona `from`.** Um exemplo seria `'texto from ' + 'outra/insercao-de-auditoria'`. Hoje o padrão erra para o lado seguro, acusando a mais, mas o comportamento fica sem registro.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/auditoria/porta-unica.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/correcoes/2026-10-22-porta-unica-so-import.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 12:37:24 · `tasks/correcoes/2026-10-22-porta-unica-so-import.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: o único arquivo que importa o módulo de inserção é o `RegistroDeAuditoria`.
- Casos de borda da importação: `import type`, `import` em várias linhas, `export … from`, `export * from`, `import()`, `require()` e `import '…'`.
- Casos de borda do caminho citado como dado: numa lista, numa constante, num comentário, numa string concatenada com `from`, e no `import()` com o caminho montado, que ficou de fora por decisão.
- O caso que acusa a mais, de propósito: um literal dentro de outro literal.
- Isolamento e concorrência não se aplicam: é um teste de varredura do próprio código.

**Cobertos:** todos, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/auditoria/porta-unica.test.ts`, nos testes "só o RegistroDeAuditoria importa o módulo de inserção, e o pacote não o exporta" e "a varredura de importação pega cada forma de importar e deixa o caminho citado como dado". Os 7 testes passam.

**As três correções que a rodada 1 pediu:**
1. **O padrão virou função.** A mutação 1 agora derruba o teste da varredura, porque os negativos das linhas 116 a 121 passam a dar verdadeiro. Esse teste não depende de nenhum arquivo da 6.0. A mutação 2 tira o filtro inteiro, e a lista passa a ter todos os arquivos de código, então fica vermelha com ou sem a 6.0.
2. **O texto do padrão foi acertado.** O comentário (linhas 40 a 48) e a seção "Correção" agora descrevem o que `[^'"`\n]*` e `\1` fazem de fato. A importação dinâmica com o caminho montado fica de fora, com o motivo escrito.
3. **O caso negativo foi incluído na linha 120.** O Implementador tinha razão e o meu palpite da rodada 1 estava errado: em `'veio from ' + 'outra/insercao-de-auditoria'`, depois do `from` vem a aspa que fecha `'veio from '`. A classe não atravessa aspa, então o padrão não casa e o resultado é falso. O caso que de fato acusa a mais é o literal dentro de literal, registrado na linha 126 como erro para o lado seguro.

**Mutações:** as seis do documento batem com o diff e cada uma cai num teste que chega à cláusula:
- a 1 troca o padrão por uma busca simples pelo nome;
- a 2 tira o predicado do filtro;
- da 3 à 6, cada uma tira uma das formas de importar (`from`, `import(`, `require(` e `import`), e há um positivo que só aquela forma pega (linhas 104 a 108, 109, 110 e 111).

Não há `.skip`, mock nem chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
- O `\1` continua sem efeito que um teste veja: com a classe que exclui todas as aspas, só faria diferença num literal que abre e fecha com aspas diferentes, o que não é código válido. O texto agora diz isso sem prometer mais, então não precisa mudar nada. Fica só como registro para o `/retro`.

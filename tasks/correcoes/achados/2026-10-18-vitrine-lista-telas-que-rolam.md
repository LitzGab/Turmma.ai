# Achados das revisões — `tasks/correcoes/2026-10-18-vitrine-lista-telas-que-rolam.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-18 12:15:05 · `tasks/correcoes/2026-10-18-vitrine-lista-telas-que-rolam.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (é correção de processo, sem Tech Spec; o que foi feito bate com a seção "Correção" do documento)
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

O que conferi:
- **Escopo.** Os quatro textos de `.claude/`, o `TODO.md` e os três arquivos de `tools/vitrine/` são exatamente os que o documento lista. As letras (b) e (g) e o resto da (c) continuam abertas no `TODO.md`, como o documento diz.
- **Teste e mutações.** O teste que reproduz (`a rolagem a 1366 × 768`) dava vermelho antes, porque as funções importadas não existiam. As 12 mutações apontam para casos que pegam a mudança. Um exemplo: trocar a chave `caminho` por `arquivo` faz a mesma tela aparecer duas vezes, e o caso `toHaveLength(1)` pega. O carimbo vale para a árvore atual.
- **Regra do relatório.** O `rolaNaJanela` usa `>` e não `>=`, porque a página que cabe mede exatamente 768 px (`scrollHeight`). Não lista quando só o miolo rola, que é o caso que se quer, e o `TODO.md` registra isso entre os limites.
- **Os textos de `.claude/` não se contradizem.** Todos dizem que a tela na lista é defeito só quando o PRD diz que só o miolo rola, e no Validador isso vira NÃO ATENDIDO.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/vitrine/foto.ts:163` e `:168`: quando a página foi redirecionada (`parouEm` diferente de `caminho`), o relatório põe na lista de "rola" o endereço pedido, mas a altura é a da página onde ela parou (a entrada, por exemplo). As linhas de arquivo já avisam do redirecionamento. Mesmo assim, deixar essa foto fora do relatório, ou marcar "(parou em …)" na linha, evita uma linha falsa de rolagem ou de "Nenhuma tela rola".
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/.claude/skills/revisar-tarefa/SKILL.md:141`: a Mesa costuma rodar `foto` mais de uma vez (escola cheia e vazia, papéis diferentes), e cada rodada pode terminar com "Nenhuma tela rola". Vale uma frase dizendo que a linha `Rolam a 1366 × 768` junta as listas de todas as rodadas, e não só a da última.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-18 12:15:34 · `tasks/correcoes/2026-10-18-vitrine-lista-telas-que-rolam.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz:** uma tela do computador mais alta que 768 px aparece no relatório, com o endereço e a altura em px.
- **Borda: limite exato.** Com 768 px a página não rola; com 769 px rola.
- **Borda: página em pedaços.** A tela que saiu em vários arquivos aparece uma vez só.
- **Borda: celular fora.** A foto do celular não entra, nem quando a mesma tela no computador rola.
- **Borda: nenhuma tela rola.** O relatório diz que mediu e que nenhuma rola, em vez de não dizer nada.
- **Borda: sem foto.** O relatório volta vazio.
- **Borda: aba clicada e escola vazia.** As duas aparecem na linha.
- **Ligação: o comando imprime.** O comando imprime os arquivos, o aviso de redirecionamento e, no fim, o relatório.
- **Ligação: a medida chega ao relatório.** A altura medida em `fotografar` é a que chega na `Foto`.
- **Permissão, isolamento e concorrência:** não se aplicam. É ferramenta de processo, sem dado de escola nem operação concorrente.

**Cobertos:** todos menos o último ("a medida chega ao relatório"). Rodei `npx vitest run tools/vitrine/foto.test.ts`: 17 passam. Conferi as 12 mutações pelo raciocínio, uma a uma. Cada uma alcança a sua cláusula e fica vermelha pelo motivo certo:
- `>=` quebra o caso de 768.
- `TELAS[1]` (800) quebra o caso de 769.
- `[...fotos]` faz a foto do celular (3900) sobrescrever a do computador (2400) e põe `/coordenacao/inicio` no relatório.
- Trocar `caminho` por `arquivo` repete a tela `/coordenacao/alunos`.
- As outras quebram a asserção exata do teste que cada uma cita.

Não há `.skip`, mock nem chamada a provedor.

**Bloqueantes:**
1. `tools/vitrine/foto.ts:245` e `tools/vitrine/foto.ts:251`: a cláusula nova `alturaDaPagina: altura, cliques` não tem bloco de mutação nem teste.
   - É a fonte de dado da correção inteira. Uma troca de `altura` por `tela.altura`, ou por `0`, passa no typecheck e nos 17 testes.
   - Com essa troca, toda chamada termina com "Nenhuma tela rola a 1366 × 768". É a mesma falha silenciosa que deixou C1 e C2 passarem na X2, agora com cara de medida.
   - A seção "Limites" do `TODO.md` declara sem teste só a ligação do `vitrine.ts`, não esta.
   - **Correção exigida:**
     - Extrair a montagem das `Foto` de uma tela para uma função pura e chamá-la nos dois caminhos (o dos pedaços e o `catch`). Por exemplo: `fotosDaTela({ caminho, tela, parouEm, altura, cliques }, arquivos)`.
     - Testar em `foto.test.ts` que a `alturaDaPagina` e os `cliques` de cada `Foto` são os medidos.
     - Declarar no documento a mutação `alturaDaPagina: altura` → `alturaDaPagina: tela.altura`, apontando para esse teste.

**Recomendações:**
- **Altura velha no `catch`** (`tools/vitrine/foto.ts:247-251`). O `catch` existe porque a página mudou de altura depois da medida, mas a `Foto` leva a altura antiga. Medir de novo antes de gravar deixaria a linha do relatório igual à foto inteira.
- **Ligação do `vitrine.ts:86`** (`linhasDoResultado(fotos, vitrine.url, vazia)`). Está sem teste e declarada como limite no `TODO.md`. Aceitável, porque é só impressão. Se um dia o `principal` for testável sem a web de pé, vale um caso com `--vazia`.
- **Asserções por `toContain`** (`foto.test.ts`, "o relatório lista a tela do computador que rola…"). Uma asserção sobre a linha exata (`'  /coordenacao/alunos: 2400 px'`) também prenderia o formato que a Mesa copia para o prompt.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-vitrine-lista-telas-que-rolam.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/vitrine/foto.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/vitrine/foto.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/vitrine/vitrine.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-18 12:20:23 · `tasks/correcoes/2026-10-18-vitrine-lista-telas-que-rolam.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2, só a correção pedida na 1ª rodada):
- A altura e os cliques medidos chegam a cada `Foto` quando a tela sai em pedaços.
- O mesmo vale quando sai uma foto inteira só, pelo caminho do `catch`.
- O relatório mostra a altura medida, e não outra.
- Toda cláusula nova tem um bloco de mutação que fica vermelho.

Cobertos:
- **Função única.** `fotosDaTela` foi extraída (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/vitrine/foto.ts:157`). O `fotografar` agora monta a medida uma vez só (`foto.ts:242`) e a usa nos dois caminhos (`foto.ts:253`, pedaços, e `foto.ts:259`, `catch`). Antes eram dois lugares montando o mesmo objeto, e agora é um.
- **Teste novo.** O caso "cada foto da tela leva a altura medida e os cliques da chamada…" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/vitrine/foto.test.ts:138`) confere três coisas:
  - a altura e os cliques de cada pedaço;
  - a `Foto` inteira, comparada por igualdade exata;
  - a linha exata do relatório, `/coordenacao/alunos, depois de clicar text=Alunos: 2400 px`.
- **As duas mutações declaradas ficam vermelhas.** O trecho bate com `foto.ts:158`. Trocar a altura por `0` quebra o `[2400, 2400]` e a linha do relatório. Trocar os cliques por `[]` quebra a lista de cliques, o `toEqual` da foto inteira e a linha do relatório.
- **Teste antigo apertado.** O caso de rolagem passou de `toContain` sobre o texto todo para a linha exata (`foto.test.ts:112-113`).
- **Rodei o arquivo.** `npx vitest run tools/vitrine/foto.test.ts` deu 18 de 18 verdes. Não há `.skip`, mock nem provedor de IA.
- **A frase nova no `revisar-tarefa`** está correta: a linha "Rolam" junta a lista de todas as chamadas do `foto`, e não só a da última.

**A correção que eu exigi não era possível ao pé da letra.** Uma mutação no `fotografar` (`alturaDaPagina: altura` → `tela.altura`) não pode deixar vermelho um teste que chama `fotosDaTela` direto. O Implementador fez a parte que dava para fazer e declarou o resto em "Limites" do `TODO.md`, na letra (e). Esse resto é a passagem de `altura` para a medida em `foto.ts:242`, que só se prova com a web de pé. É o mesmo tipo de limite já aceito para a ligação do `vitrine.ts`. Não existe teste com navegador para o `fotografar` no repositório, e criar um fica fora desta correção. Por isso não é bloqueante.

Bloqueantes: nenhum.

Recomendações:
1. **`foto.ts:242` continua sem teste.** É o único lugar onde a medida pode ser trocada por outro número sem ninguém ver. Se um dia houver teste do `fotografar` com a web de pé (no infra, com a vitrine montada), ele deve conferir que uma tela comprida conhecida aparece no relatório com a altura medida. Vale anotar isso como item aberto, e não só como limite.
2. **Os dois blocos `mutacao` estão depois da tabela "## Revisões"**, que é a seção que o hook preenche (no documento da correção, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-vitrine-lista-telas-que-rolam.md`). O `mutacoes.ts` lê bloco em qualquer lugar do arquivo, então eles rodam. Mesmo assim, devem ir para a seção de mutações, junto dos outros, para não se misturar com o que o hook escreve.
3. **"Limites" no `TODO.md` diz que, no `catch`, a altura pode ficar velha.** Isso só fica escrito: no relatório, a altura medida antes da foto aparece mesmo que a página tenha crescido depois. Está declarado. Se causar engano numa revisão de tela, medir de novo dentro do `catch` resolve.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-18 12:20:31 · `tasks/correcoes/2026-10-18-vitrine-lista-telas-que-rolam.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (é correção de código de processo, sem Tech Spec; o que mudou bate com a seção "Correção" do documento e com a letra (e) do `TODO.md`)
Portão local: carimbo válido. O `conferir` passou para o código atual com typecheck, lint, segredo, dependências, unidade e alvo.
Bloqueantes: nenhum

O que esta rodada mudou desde a 1ª:

- **`fotosDaTela` no `fotografar`.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/vitrine/foto.ts:157`, a função nova recebe um único objeto `medida` (linha 242). Os dois caminhos usam esse mesmo objeto: a foto em pedaços (linha 253) e a foto inteira do `catch` (linha 259). Assim a altura e os cliques não podem mais divergir entre um caminho e outro. O tipo `Omit<Foto, 'arquivo'>` faz o compilador exigir todos os campos.
- **Caso novo em `foto.test.ts`.** Ele confere os dois formatos (vários arquivos e um só) e confere a linha exata que o relatório imprime.
- **As duas mutações novas pegam a troca.** A que zera `alturaDaPagina` e a que esvazia `cliques` quebram as asserções `toEqual` do caso novo.
- **Asserções exatas.** Trocar `toContain` sobre o texto juntado por `toContain` sobre o array, com a linha inteira, fecha o falso positivo que existia: "2400 px" podia vir de qualquer lugar do texto.
- **Frase nova do `revisar-tarefa`.** A instrução de juntar as listas de todas as chamadas do `foto` está correta e fecha a lacuna real de várias chamadas por rodada.
- **Novos limites na letra (e) do `TODO.md`.** Batem com o código: a página redirecionada entra no relatório com o endereço pedido e a altura de onde parou, e no `catch` a altura é a de antes da foto.

Recomendações:
- Mutações fora da seção "Mutações", em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-vitrine-lista-telas-que-rolam.md:138-150`. Os dois blocos novos ficaram depois da tabela de "## Revisões", a seção que diz "Não edite à mão", e não na seção "Mutações" que o `corrigir/SKILL.md:79` e o `executar-task/SKILL.md:64` indicam.
  - O funcionamento não quebra: `mutacoes.ts:54` lê os blocos em qualquer ponto do documento, e `lerRevisoes` (`revisoes.ts:337`) lê as linhas `| 2026-…` do título da seção até o fim do arquivo.
  - Mas o `acrescentarRevisao` (`revisoes.ts:382`) acrescenta a linha no fim do arquivo. A linha desta rodada vai cair depois dos blocos de código, e a tabela fica partida no markdown renderizado.
  - Correção sugerida: mover os dois blocos para o fim de "## Mutações" (depois da linha 125). Como o portão roda as mutações do documento, rodar o portão de novo depois de mover.
- Comentário no teste em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/vitrine/foto.test.ts`, no caso novo: "O que o relatório mostra é o que foi medido, não outra altura qualquer." Ele explica uma asserção que já se lê sozinha. Pode sair.

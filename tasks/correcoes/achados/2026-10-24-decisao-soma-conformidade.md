# Achados das revisões — `tasks/correcoes/2026-10-24-decisao-soma-conformidade.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-24 18:28:01 · `tasks/correcoes/2026-10-24-decisao-soma-conformidade.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção mexe só em ferramenta de processo: a lista `CITACOES` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/guardioes-por-caminho.ts`, os testes dela e dois documentos da spec do harness. Nenhuma migration, schema, DTO, endpoint ou storage.

Fora da tabela de dados do docs/lgpd.md: nada. Nenhum campo novo.

Autorização por objeto: não se aplica. Não há rota nem acesso a objeto.

Logs: limpos. A lista não escreve log, e os textos de teste são comentários de mentira (`// D55`, `// regra 20`), sem nome, matrícula, nota ou conversa.

Auditoria: não se aplica. Nenhuma das ações que a regra 20, item 10, exige auditar acontece aqui.

Envio externo: nenhum.

Seed/fixture: sintético. Os casos de teste são caminhos e trechos de texto inventados, sem dado real.

Efeito na cobertura de privacidade: o termo novo só soma o `conformidade-reviewer`. Nenhum termo que soma o `privacy-guardian` (`regra 20`, `lgpd`) foi mudado ou afrouxado, e a união com os guardiões que o Arquiteto marcou continua valendo. Rodei `npx vitest run tools/processo/harness/guardioes.test.ts`: os 99 testes passam.

Bloqueantes: nenhum.

Recomendações:
- O mesmo furo que esta correção fecha para a regra 70 continua aberto para a regra 20. As decisões que a regra 20 traduz em código, D10 (escola controladora), D35 (adaptação, nunca diagnóstico), D62 (conversa de aluno só em provedor com processamento no Brasil) e D66 (memória do Tutor é o trabalho, não a pessoa), não somam o `privacy-guardian` quando aparecem em arquivo de exceção. Um `tools/processo/x.ts` ou um `package.json` que cite "D62" ao trocar de provedor de IA sairia sem eu ser chamado. Vale registrar como item próprio no `TODO.md`, com a mesma forma do termo (D maiúsculo, sem letra, dígito, `_` ou `#` colado).
- A regra 70 cita também D60, D68 e D70, que ficaram fora da lista. Essa avaliação é do `conformidade-reviewer`. Anoto aqui porque D70 (saída da aba na prova) também é tratamento de dado de aluno.

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 18:28:23 · `tasks/correcoes/2026-10-24-decisao-soma-conformidade.md`

VEREDITO: APROVADO

Cenários exigidos:
- **Caminho feliz:** cada uma das oito decisões (D45, D47, D55, D56, D57, D58, D59, D64) soma o `conformidade-reviewer` em quatro tipos de arquivo de exceção: `tema.ts`, `vite.config.ts` (sai com C I), `tools/processo/x.ts` e `package.json`.
- **Borda:** a decisão citada no meio de uma frase, numa lista ou numa faixa (`D55 a D59`, `D55–D59`, `(D45 revista)`, `ver D64.`).
- **Borda:** uma decisão que a regra 70 não cita não soma (D44, D46, D60…). Um número que contém o de uma decisão também não (D450, D455, D640).
- **Borda:** o texto colado a letra, dígito, `_` ou `#` não soma, porque é hash, base64 ou cor `#D45` (casos `AD45`, `1D45`, `#D45`, `ID_D58`, `D45x`). O `d45` minúsculo também não.
- **Borda:** a decisão citada só no HEAD, ou só no índice, ainda soma. É o caso de quem tira a garantia junto com o comentário.
- **Composição:** a decisão soma junto com as citações de regra, na ordem dos quatro guardiões.
- **Arquivo do padrão:** o arquivo que já pede os quatro guardiões não muda com a citação.
- **Permissão e isolamento:** não se aplicam. É uma função pura de processo e não toca dado de escola.
- **Concorrência:** não se aplica. Não há operação que possa rodar duas vezes ao mesmo tempo.

Cobertos: todos. Rodei `tools/processo/harness/guardioes.test.ts` e os 99 testes passam. Conferência linha por linha:
- **As cinco linhas do "Teste que reproduz":** cada uma tem o seu teste com o nome citado, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/harness/guardioes.test.ts:179-217`.
- **As oito decisões juntadas por ponto e vírgula:** são cobertas uma a uma pelo `it.each` nos quatro tipos de arquivo.
- **Os casos novos da lista em `tasks/prd-harness/tabela-de-guardioes.md`:** os quatro arquivos, os casos que não somam (D44, D46, D60, D450, `#D45`, `d45`) e a citação só no HEAD ou só no índice. Todos têm asserção correspondente.

Os cinco blocos de mutação, conferidos contra o `git diff`. Só existe uma cláusula nova, a linha 126 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/guardioes-por-caminho.ts`, e cada parte dela tem um bloco que a alcança:
- **Tirar o 64 da alternância:** o caso `D64` do `it.each` e o `ver D64.` ficam vermelhos. As outras sete decisões não têm bloco próprio, mas o `it.each` também derruba a retirada de cada uma.
- **Tirar o lookbehind:** `AD45`, `#D45` e `xD64` ficam vermelhos.
- **Trocar `(?!\w)` por `(?!\d)`:** `D45x` fica vermelho.
- **Acrescentar a flag `/i`:** `d45 d55 d64` fica vermelho.
- **Trocar o guardião para `I`:** `toEqual(OS_QUATRO)` fica vermelho, porque C some do resultado.

Cada filtro (`-t`) é parte do nome de um teste que existe. Nenhum bloco fica vermelho pelo motivo errado: em todos, o cenário chega à cláusula. Todas as asserções olham o conjunto exato que sai (`toEqual`). Não há `.skip`, teste comentado nem mock da função testada; o `textos` só simula o que o índice e o HEAD contêm. Não há chamada de IA.

Bloqueantes: nenhum.

Recomendações:
- `guardioes.test.ts:203`: o caso `'D5 5'` não testa nada, porque o termo nunca o alcançaria. Vale trocá-lo por `'D45_'`, que prova o `_` do lado de depois. Hoje só o `_` de antes está provado (`ID_D58`).
- A seção "Mutações" prova a retirada só do 64. As outras sete decisões ficam garantidas pelo `it.each`, sem bloco próprio. Isso basta, mas vale uma linha no documento dizendo que o `it.each` cobre a retirada de qualquer uma das oito.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-24 18:28:23 · `tasks/correcoes/2026-10-24-decisao-soma-conformidade.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A correção só mexe no roteamento de revisores (`tools/processo/`) e em dois documentos do harness. Nenhum caminho grava `Nota`; todos com autor humano? não se aplica (nenhum foi tocado).
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhum fluxo de saída de IA foi tocado.
Supervisão do tutor: ok. O tutor não foi tocado.
Autonomia declarada e visível: sim, sem alteração.
Bloqueantes: nenhum

O que conferi:
- **Código.** O termo novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/guardioes-por-caminho.ts` só acrescenta o `conformidade-reviewer` ao arquivo de exceção. Nunca tira um revisor: a união com os que o Arquiteto marcou continua valendo. A mudança só deixa a revisão de conformidade mais abrangente e não enfraquece nenhuma garantia da regra 70.
- **Escopo.** As oito decisões batem com o item M6 do `TODO.md:1897-1899` (D45, D47, D55 a D59, D64).
- **Testes.** Rodei `tools/processo/harness/guardioes.test.ts`: 99 de 99 passam. Os blocos de mutação são pegos pelos casos que deveriam pegá-los:
  - `(?!\d)` é pego por `D45x`;
  - `/i` é pego por `d45`;
  - tirar a lookbehind é pego por `AD45` e `#D45`;
  - tirar D64 é pego pelo `it.each`;
  - trocar C por I é pego pela ordem dos quatro.
- **Documentos.** `tabela-de-guardioes.md` e `techspec.md` §5(b) dizem o mesmo que o código.
- **Itens 1 a 9.** Nenhum é afetado. Não há tela, prompt, campo de nota, métrica de professor nem caminho do tutor no diff. `docs/regulacao.md` não foi alterado.

Recomendações:
1. **A lista de decisões deixa de fora quatro que a regra 70 também cita.** A seção "Causa" da tarefa e o texto novo de `tasks/prd-harness/tabela-de-guardioes.md:22-24` dizem que D45, D47, D55 a D59 e D64 são "as decisões que a regra 70 traduz em código". A regra 70 cita também:
   - D60: Avaliação de Impacto Algorítmico (AIA), item 6a;
   - D66: memória do Tutor, item 4d;
   - D68: busca na web do Tutor, item 4c;
   - D70: saída da aba durante a prova, item 7.

   As quatro tratam diretamente de tutor e de vigilância. Hoje um arquivo de exceção que cita "D70" ou "D66" não chama o `conformidade-reviewer`. Além disso, o teste em `tools/processo/harness/guardioes.test.ts` (bloco "não soma", lista `fora`) prende D60 como "não soma". Isso não bloqueia, porque o escopo veio fechado pelo M6 e a citação é uma heurística a mais, não a única porta. Sugiro registrar no `TODO.md` uma correção que some D60, D66, D68 e D70 ao termo, tirando D60 da lista `fora`. Enquanto ela não vem, o texto da tabela e da techspec deveria dizer "as decisões do item M6", em vez de dar a entender que a lista é completa.
2. **Ponto fraco do D maiúsculo.** Um texto que escreva "d55" fica de fora de propósito, e isso está documentado. Vale lembrar o caso na retro, se algum documento da casa usar minúscula.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/guardioes-por-caminho.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/harness/guardioes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tasks/prd-harness/tabela-de-guardioes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tasks/correcoes/2026-10-24-decisao-soma-conformidade.md

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 18:28:35 · `tasks/correcoes/2026-10-24-decisao-soma-conformidade.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

O que conferi:
- **Escopo:** a lista de decisões é exatamente a pedida no item M6 do `TODO.md`: D45, D47, D55 a D59 e D64. É também a mesma da `retro.md:259` e da `revisao-spec.md:171`. A correção não incluiu D60, D66, D68 nem D70, e o `TODO.md` ficou para o Orquestrador, como o documento diz.
- **Tech Spec e cenários:** o código, a §5(b) de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tasks/prd-harness/techspec.md` e a tabela `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tasks/prd-harness/tabela-de-guardioes.md` dizem a mesma coisa. O `cenarios.md` (RF15) remete à seção "O teste da tabela", que foi atualizada.
- **Efeito nos arquivos de hoje:** o documento diz que nenhum arquivo versionado muda de conjunto de guardiões. Conferi rodando `guardioesDoCaminho` em todos eles, com e sem o termo novo: nenhum muda. Os arquivos que já citam essas decisões estão em pastas do padrão e já pedem os quatro guardiões.
- **Mutações:** cada um dos cinco blocos é pego por um teste citado. Tirar a D64 quebra o caso D64 do `it.each`. Tirar a checagem do caractere de antes quebra `AD45`. Trocar `(?!\w)` por `(?!\d)` quebra `D45x` e `ID_D58`. Aceitar minúscula quebra `d45`. Somar o guardião errado (I no lugar de C) quebra o `[P, C, I]` de `vite.config.ts`.

Recomendações:
- A tabela (`tabela-de-guardioes.md:22-24`) e a Tech Spec (`techspec.md:143`) dizem que `#` colado antes **ou depois** impede a soma. O código (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/guardioes-por-caminho.ts:126`) só barra o `#` antes, então `D45#` soma. O comentário da constante está certo; vale alinhar os dois documentos com ele.
- O comentário em `guardioes-por-caminho.ts:117-119` diz que base64 não conta como decisão. Na verdade um trecho como `+D45/` em base64 soma, porque `+`, `/` e `=` não estão na lista do que barra a soma. Erra para o lado seguro, só chamando um revisor a mais, e é raro. Basta tirar "base64" da frase ou dizer que é quase nunca.
- `techspec.md:143` ficou com uma linha muito mais longa que as vizinhas do parágrafo. Quebrar como no resto do arquivo.

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 18:33:59 · `tasks/correcoes/2026-10-24-decisao-soma-conformidade.md`

VEREDITO: APROVADO

Cenários exigidos: na rodada nova, as duas recomendações da 1ª rodada aplicadas, e nada no diff que tire o efeito de algum teste.

Cobertos:
- **O `D45_` entrou no lugar do `'D5 5'`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/harness/guardioes.test.ts`, bloco "a decisão que a regra 70 não cita…"). O caso agora testa algo. Hoje ele passa porque a checagem do que vem depois do número (`(?!\w)`) inclui o `_`. Se essa checagem for afrouxada para só letra e dígito (`(?![A-Za-z0-9])`), o `D45_` passa a somar o `conformidade-reviewer` e o teste fica vermelho. Com o `ID_D58`, que já estava lá, o `_` fica provado dos dois lados.
- **A seção "Mutações"** de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tasks/correcoes/2026-10-24-decisao-soma-conformidade.md` agora diz que o `it.each` cobre a retirada de qualquer uma das oito decisões, uma por caso. Diz também por que só a retirada do 64 tem bloco.
- **No código só mudou um comentário.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/guardioes-por-caminho.ts` a regex de `CITACOES` ficou igual, então os blocos de mutação que já tinham sido provados continuam valendo.
- **A tabela de guardiões e a techspec §5(b) dizem o mesmo que o código e o teste:** o `#` barra só antes do número, e letra, dígito ou `_` barram dos dois lados.
- **Rodei `npx vitest run tools/processo/harness/guardioes.test.ts`:** 99 de 99 passaram. Não há `.skip`, mock nem provedor de IA.
- Esta tarefa não cria operação que possa rodar duas vezes ao mesmo tempo, então teste de concorrência não se aplica.

Bloqueantes: nenhum.

Recomendações:
- Na seção "Correção" do documento da tarefa, a frase "(a regra 70 cita outras, que ainda não somam) (D45 medir o professor, …)" ficou com dois parênteses seguidos. Vale juntar os dois num parêntese só, ou mover a ressalva para o fim da frase. É só texto.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 18:34:09 · `tasks/correcoes/2026-10-24-decisao-soma-conformidade.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (o carimbo vale para o código atual, com typecheck, lint, segredo, dependências, unidade e alvo)
Bloqueantes: nenhum

As três recomendações da 1ª rodada foram feitas, e a mudança de nome pedida pela Mesa também:
- **O `#` barra só antes.** A tabela e a Tech Spec agora dizem o mesmo que a regex e o comentário: o `#` barra só antes, e letra, dígito ou `_` barram dos dois lados. A tabela passou a listar `D45_` entre os que não somam, e o teste "não soma" cobre esse caso no lugar de `'D5 5'`. Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tasks/prd-harness/tabela-de-guardioes.md:21-26`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tasks/prd-harness/techspec.md:142-145` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/harness/guardioes.test.ts:202-203`.
- **"base64" saiu.** A palavra não está mais no comentário da constante (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/guardioes-por-caminho.ts:116-121`), nem no teste, nem nas seções "Sintoma", "Causa" e "Correção" do documento.
- **A linha longa da Tech Spec foi quebrada** em três, como as vizinhas do parágrafo.
- **"As decisões do item M6"**, pedida pela Mesa: o nome aparece na tabela, na Tech Spec, no comentário e no documento, e o texto diz que a regra 70 cita outras decisões (D60, D66, D68, D70) que ainda não somam. A regex não mudou.

A nova frase da seção "Mutações" está certa: o `it.each` da linha 179 do teste tem um caso por decisão, então tirar qualquer uma das oito do termo deixa um caso vermelho.

As recomendações que o Implementador não aplicou estão registradas, cada uma com destino ou motivo, na seção "Recomendações sem aplicar". Duas vão para item novo no `TODO.md`: somar as decisões da regra 20 ao `privacy-guardian` e somar D60, D66, D68 e D70. A do `d55` minúsculo foi recusada, porque o comentário e o teste já fixam a escolha.

Recomendações:
- Na seção "Correção" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tasks/correcoes/2026-10-24-decisao-soma-conformidade.md:35`, ficaram dois parênteses seguidos: "as do item M6 (a regra 70 cita outras, que ainda não somam) (D45 medir o professor, …)". Juntar os dois num parêntese só, ou passar o primeiro para uma frase própria, deixa o texto mais fácil de ler.

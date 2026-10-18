# Achados das revisões — `tasks/correcoes/2026-10-18-e2e-repassa-repeat-each-e-workers.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-18 10:29:50 · `tasks/correcoes/2026-10-18-e2e-repassa-repeat-each-e-workers.md`

VEREDITO: APROVADO

Caminho quente tocado: nenhum. A correção mexe só em ferramenta de processo (`tools/ci/`). Não toca login, tutor, sala, prova, fila de jobs, IA, migration nem deploy.
Rate limit: ok. Não se aplica.
Fila e prioridade: ok. Não se aplica. O `--workers=<n>` só chega a uma execução local que pede o caso explicitamente. Essa execução já passa pela fila de carga entre as linhas (`tools/ci/fila-de-carga.ts`), e a esteira não repassa as duas opções.
Concorrência: protegida. Não se aplica.
Índice e paginação: ok. Não se aplica.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. Não se aplica, nenhum código novo de produção.
Bloqueantes: nenhum. O caso novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/prazo-do-e2e.test.ts:81-82` cobre cada uma das duas opções separadamente, com a posição antes dos arquivos e o `--headed` de fora. As duas mutações declaradas em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-e2e-repassa-repeat-each-e-workers.md` tiram uma opção cada, e o teste falha com qualquer uma delas. Nenhum teste chama provedor pago.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/TODO.md:950-951`: a nota sobre a (c) entrou entre o texto da (f) e o "**Feita**" que fecha a (f). Com isso, o "**Feita** na correção `2026-10-18-fila-de-carga-no-codigo`" passa a parecer que fala da (c). Logo depois vem "as letras (a) a (e) seguem abertas", o que contradiz a nota nova. O melhor é mover a nota para logo depois da (c), na linha 934, ou para depois do parágrafo da (f), e ajustar o "(a) a (e)" para dizer que a (c) está fechada em parte.
2. O texto da (c) na linha 934 ainda diz "hoje viram filtro e o e2e inteiro roda". O documento da correção diz outra coisa: as opções eram descartadas. Vale alinhar o TODO com a causa registrada na correção.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/prazo-do-e2e.ts:99-101`: opção com `-` fora da lista continua sendo descartada sem aviso, e foi isso que gerou esta correção. O mesmo vale para a forma sem `=`: no `--repeat-each 10`, o `10` vira arquivo. Para a próxima opção não sumir do mesmo jeito, uma linha no log com o que foi descartado basta.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-18 10:29:55 · `tasks/correcoes/2026-10-18-e2e-repassa-repeat-each-e-workers.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção sem Tech Spec, e ela faz só o que pede a primeira frase da letra (c) do item "(X1, retrospectiva) Código de processo" no `TODO.md`. As outras duas frases da (c) e as letras (a), (b), (d) e (e) ficaram de fora, como o documento declara.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/TODO.md:950-951`: a frase nova sobre a (c) entrou no lugar errado. Ficou entre o texto da letra (f) e a frase "**Feita** na correção `2026-10-18-fila-de-carga-no-codigo` ...", que fala da (f). Com isso o "**Feita**" parece se referir à (c), e o "as letras (a) a (e) seguem abertas" que vem logo depois contradiz a (c) já feita em parte. Mova a frase para logo depois da letra (c), na linha 937, ou para o fim do item. Na frase da (f), troque "(a) a (e) seguem abertas" por algo que conte a primeira frase da (c) como feita.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/TODO.md:934`: a letra (c) diz "hoje viram filtro e o e2e inteiro roda". O sintoma descrito no documento da correção é outro: as opções eram descartadas e o arquivo rodava uma vez. Vale corrigir o texto da (c) ou marcar a frase como feita ali mesmo, para não sobrar uma descrição que já não vale.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/prazo-do-e2e.ts:89-101`: a forma com espaço (`--repeat-each 10`) continua passando em silêncio. A opção é descartada e o `10` é lido como arquivo. O `executar-task` (`.claude/skills/executar-task/SKILL.md:240`) ensina essa forma com espaço, mas chamando o Playwright direto, sem o `e2e.ts`. Numa correção futura, o `e2e.ts` poderia recusar com erro toda opção que não reconhece, em vez de descartá-la sem aviso.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/prazo-do-e2e.ts:77-88`: este problema já existia antes da correção. Ficaram dois blocos de JSDoc seguidos, e o primeiro, o da etapa dos testes, está solto acima de `arquivosDosArgumentos`. Leve esse bloco para cima de `etapaDosTestesDoE2e` na próxima vez que alguém mexer no arquivo.

## test-engineer · 1ª rodada · APROVADO · 2026-10-18 10:29:57 · `tasks/correcoes/2026-10-18-e2e-repassa-repeat-each-e-workers.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** `--repeat-each=<n>` e `--workers=<n>` digitados na linha de comando do `e2e.ts` chegam à etapa `playwright test`, antes dos arquivos.
- **Borda 1:** uma opção que continua fora da lista, como `--headed`, segue sem passar.
- **Borda 2:** a correção não mexe no que já funcionava: `--grep` e `--project` passam, os arquivos passam e `--shard` monta a fatia.
- **Borda 3:** o valor separado por espaço (`--workers 1`) e o valor vazio (`--repeat-each=`).
- **Permissão e isolamento:** não se aplicam. É ferramenta de processo e não toca dado de escola.
- **Concorrência:** não se aplica. A função é pura e só monta a lista de argumentos.

**Cobertos:**
- **Caminho feliz:** coberto em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/prazo-do-e2e.test.ts:81-82`, com `toEqual` sobre a lista exata. Isso prova as duas opções e também a ordem, antes do arquivo.
- **O teste passa pelo caminho que roda de verdade:** ele chama `etapasDoE2e`, a mesma função que `tools/ci/e2e.ts:16` usa com `process.argv`. Não há mock que esconda a regra.
- **Borda 1:** coberta. `--headed` está na entrada e não aparece na saída esperada.
- **Borda 2:** coberta pelas asserções que já existiam, nas linhas 59, 73 e 78.
- **Mutações:** os dois blocos casam com o `git diff`. A única cláusula nova é a regex de `tools/ci/prazo-do-e2e.ts:100`, e cada mutação tira uma das duas opções novas. Com qualquer uma delas, o `toEqual` da linha 82 fica vermelho pelo motivo certo, porque falta uma opção na lista.
- Não há `.skip`, teste comentado nem provedor de IA envolvido.
- Rodei `npx vitest run tools/ci/prazo-do-e2e.test.ts`: os 6 testes passam.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Valor separado por espaço:** `--workers 1` e `--repeat-each 10` continuam virando o "arquivo" `1` ou `10` sem aviso nenhum (`arquivosDosArgumentos`, `tools/ci/prazo-do-e2e.ts:88-90`). O Playwright filtraria por caminhos que contêm "1", e a prova de estabilidade rodaria a coisa errada calada. O comportamento já existia com `--grep`, e a doc diz "sempre com `=`". Ainda assim, recusar o valor solto com erro, como `fatiaDosArgumentos` faz com `--shard`, fecharia o furo. Fica para uma correção futura.
2. **Comentário desatualizado:** em `tools/ci/prazo-do-e2e.test.ts:76`, a frase "nenhuma outra opção vai junto" ficou imprecisa agora que outras duas opções passam. Pode virar "nenhuma opção fora da lista vai junto".
3. **Valor vazio sem asserção:** `--repeat-each=` é descartado pela regex (`=.`), mas nenhum teste confere isso. Vale uma asserção de uma linha.

## test-engineer · 2ª rodada · APROVADO · 2026-10-18 10:33:43 · `tasks/correcoes/2026-10-18-e2e-repassa-repeat-each-e-workers.md`

VEREDITO: APROVADO

Cenários exigidos (o que mudou nesta rodada):
- Uma opção da lista escrita sem valor (`--repeat-each=`, `--workers=`) não chega ao Playwright, porque ele leria o próximo argumento como o valor dela.
- A nova mutação (`=.` → `=`) precisa ficar vermelha pelo motivo certo.
- A JSDoc mudou de lugar sem mudar o código.
- O TODO registra a recomendação como a letra (g).

Cobertos:
- **`tools/ci/prazo-do-e2e.test.ts:84-85`**: a asserção `semValor` exige que as duas opções vazias sumam e que só fique `e2e/areas.spec.ts`.
- **A nova mutação fica vermelha pelo motivo certo.** Com `=` sem o `.`, `--repeat-each=` e `--workers=` passariam pelo filtro, e só a asserção `semValor` quebraria. As asserções `umCaso` e `repetido` continuam verdes sob a mutação, porque todas as opções delas têm valor e `--headed` não casa com o prefixo. O texto do bloco confere com a linha atual de `tools/ci/prazo-do-e2e.ts:94`, e o nome do teste confere com o de `prazo-do-e2e.test.ts:54`.
- **As duas mutações da rodada 1 continuam válidas.** A linha de `opcoesDoPlaywright` não mudou nesta rodada.
- **A JSDoc só mudou de lugar.** Agora está em cima de `etapaDosTestesDoE2e`, que é o que ela descreve.
- **O TODO.md registra a recomendação dos três revisores** como letra (g). A (c) ficou com o sintoma corrigido e marcada como feita.
- Rodei `npx vitest run tools/ci/prazo-do-e2e.test.ts`: 6 de 6 passaram. Não há `.skip`, `.only`, mock nem chamada de IA.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. A da rodada 1 (recusar, ou ao menos avisar, a opção que o `e2e.ts` descarta) continua aberta como letra (g) do `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/TODO.md`, como a ordem pediu.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-18 10:33:48 · `tasks/correcoes/2026-10-18-e2e-repassa-repeat-each-e-workers.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. É correção de código de processo e não tem seção na Tech Spec. O documento é seguido à risca: as outras duas frases da letra (c) e as letras (a), (b), (d) e (e) do `TODO.md` continuam abertas.

Portão local: carimbo válido. O `conferir` deu "portão local válido para o código atual", com typecheck, lint, segredo, dependências, unidade e alvo.

Bloqueantes: nenhum.

Na 1ª rodada não houve bloqueante, e as três recomendações dela foram aplicadas como a ordem pedia:
- **Mutação de valor vazio.** O teste novo de `tools/ci/prazo-do-e2e.test.ts` manda `--repeat-each=` e `--workers=` e espera que nenhum dos dois chegue ao Playwright. A terceira mutação do documento troca `=.` por `=` e só esse teste a deixa vermelha. O texto da mutação confere com `tools/ci/prazo-do-e2e.ts:94`.
- **JSDoc no lugar.** O bloco que fala do prazo agora fica em cima de `etapaDosTestesDoE2e` (`tools/ci/prazo-do-e2e.ts:97-102`). O de `arquivosDosArgumentos` (`:77-81`) ficou só com o texto dele. O código não mudou.
- **Recusar ou avisar a opção descartada.** Virou a letra (g) do `TODO.md`, com destino declarado e registro na seção "Recomendações sem aplicar" do documento. A letra (c) diz agora o sintoma certo (as opções eram descartadas e o arquivo rodava uma vez) e está marcada como feita. A nota que estava no meio da (f) saiu de lá.

Recomendações:
- No `TODO.md`, a lista de limites da (f) termina em "...que tocar esse teste)" e a (g) vem logo depois, sem `;` nem quebra de frase. As outras letras se separam por `;`. Isso é só redação.
- No mesmo `TODO.md`, a frase "**Feita** na correção `2026-10-18-fila-de-carga-no-codigo`" se refere à (f), mas fica depois do texto da (f) e antes da (g). A (g) acaba parecendo vir depois do fechamento do item. Seria mais legível pôr a (g) antes da frase de "Feita" ou dizer a qual letra ela se refere.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/prazo-do-e2e.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/prazo-do-e2e.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-e2e-repassa-repeat-each-e-workers.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/TODO.md

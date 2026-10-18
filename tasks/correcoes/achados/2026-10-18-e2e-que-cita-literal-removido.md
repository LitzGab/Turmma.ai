# Achados das revisões — `tasks/correcoes/2026-10-18-e2e-que-cita-literal-removido.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-18 11:07:44 · `tasks/correcoes/2026-10-18-e2e-que-cita-literal-removido.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. É uma correção de processo e não há Tech Spec. O documento cumpre a letra (d) do `TODO.md`, e as letras (b), (e) e (g) e o fim da (c) continuam abertas, como ele mesmo declara.

Portão local: carimbo válido. O `conferir` mostra typecheck, lint, segredo, dependencias, unidade e alvo.

Bloqueantes: nenhum.

Fora do teste de unidade, rodei o detector nos dois commits reais da X2 que motivaram a correção. Os dois specs que quebraram na esteira entram nos alvos:
- `3be23c9` (tarefa 3.0): `e2e/casca.spec.ts` entra, pelo literal "Governança".
- `290b7cb` (tarefa 6.0): `e2e/sino-da-coordenacao.spec.ts` entra, por "Refazer" e "?professor=".

Também conferi duas ligações:
- **Cobrança de duração:** o spec que entra pelo literal não é cobrado pelo caso lento que já tinha. `motivoDaDuracaoDoE2e` só olha os casos cujas linhas o diff tocou.
- **Hook do commit:** alvo a mais não quebra o commit. `avaliarCarimbo` não compara a lista de alvos.

Recomendações:
- **Classe do Tailwind conta como texto de tela.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/e2e-que-cita-literal.ts:11`, `ehLiteralUtil` aceita "sr-only" e "flex flex-col gap-3". No `290b7cb`, só o "sr-only" puxou quatro specs sem relação com a mudança (`pecas-estado`, `pecas-marca-onca`, `titulo-da-tela`, `acesso-da-turma`). Vale descartar o literal que vem de `className=`/`class=`, ou que só tem tokens em minúscula com hífen e espaço.
- **"Só custa minutos" é otimista.** No `3be23c9` entraram 24 dos 59 specs de e2e, quase metade da suíte, puxados por "Estrutura" e "Governança". O limite está declarado (`TODO.md`, comentário do módulo, `executar-task`), mas o texto devia dar essa ordem de grandeza, ou o portão devia avisar quando o número de specs puxados passar de um teto.
- **A frase da regra 40 ficou ambígua.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/.claude/rules/40-testes.md:98-101`, o parêntese novo abre antes do aviso de duração e o engole. A leitura fica "os e2e citados (módulo; o caso que passa de 15 s fica vermelho…)", como se a cobrança de duração valesse para o spec citado, o que é justamente o contrário. A correção é fechar o parêntese do módulo antes de "o caso de e2e cujas linhas o diff tocou".
- **Teste frágil.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/e2e-que-cita-literal.test.ts:684-687`, o teste da ligação casa o texto exato do fonte de `portao-local.ts` por regex. Qualquer reformatação o derruba sem mudar o comportamento. É aceitável pelo precedente do projeto, mas merece nota.

## test-engineer · 1ª rodada · APROVADO · 2026-10-18 11:08:40 · `tasks/correcoes/2026-10-18-e2e-que-cita-literal-removido.md`

VEREDITO: APROVADO

**Cenários exigidos**
- Caminho feliz: um texto trocado em `apps/web/src` faz entrar o `e2e/*.spec.ts` que o cita, sem diferenciar maiúscula.
- Bordas:
  - texto movido para outra linha ou para outro arquivo do mesmo diff;
  - texto que o arquivo ainda tem em outra linha;
  - arquivo da web apagado;
  - mudança já preparada no índice;
  - texto que sai de fora de `apps/web/src`;
  - teste da web (`.test.tsx`), que não conta;
  - template, que vale pelas partes fixas;
  - JSX na mesma linha e JSX em linha própria;
  - o que não conta: comentário, `import`, `export … from`, palavra solta em minúscula, caminho relativo, texto curto demais;
  - diff só com texto acrescentado;
  - ajudante de `e2e/__fixtures__/`, que não entra.
- A ligação com o portão: os specs achados entram nos alvos, e só no portão da tarefa.
- Permissão e isolamento: não se aplicam. É ferramenta de processo, sem dado de escola nem de pessoa.
- Concorrência: não se aplica. Só lê o `git diff` e o `e2e/`, e cada linha roda no seu próprio checkout.

**Cobertos:** todos os cenários acima, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/e2e-que-cita-literal.test.ts`. Rodei o arquivo: 16 de 16 passam.
- As asserções conferem o resultado exato (`toEqual` com a lista de literais e de specs), não só que o código rodou.
- Não há `.skip`, mock nem chamada de IA. O teste de repositório usa um `git init` temporário de verdade.
- Conferi as 37 mutações do documento contra o `git diff`. Cada condição de `ehLiteralUtil`, os filtros de comentário e de `import`, o JSX, o `Set`, o cabeçalho do diff, o `-`/`+`, o recolocado, o `ficaram`, o `HEAD`, o caminho, o `existsSync`, o `toLowerCase` e as duas linhas do `portao-local.ts` têm bloco, e cada bloco chega à cláusula pelo teste que cita.
- `alvosDoPortao` (`tools/processo/revisoes.ts:118`) aceita os caminhos `e2e/<x>.spec.ts` que `e2eQueCitam` devolve, então os specs achados entram de fato na suíte de e2e.

**Bloqueantes:** nenhum.

**Recomendações**
1. **Lacuna no sentido da busca, sem registro em "Limites conhecidos".** `tools/ci/e2e-que-cita-literal.ts:112` só procura o literal removido inteiro dentro do spec. O e2e que cita um pedaço dele não entra: tirar `Governança da escola` não puxa o spec que procura `/governança/i`. É o padrão comum do e2e daqui (`/^Esperando você/`, `/Refazer o convite/` em `sino-da-coordenacao.spec.ts:104`). Vale escrever o limite no documento, no `executar-task/SKILL.md` e no `TODO.md`. A outra saída é também comparar as strings e regex do spec contidas no literal removido.
2. **Texto de JSX em várias linhas.** A continuação que começa em minúscula ("de convite vencido") não vira literal, e o template que atravessa linhas também não. Nenhum dos dois está nos limites declarados.
3. **Duas cláusulas sem bloco próprio**, embora os testes atuais já as derrubem:
   - a troca de `{…}` por `\uE000` em `tools/ci/e2e-que-cita-literal.ts:50`;
   - os grupos `achado[1]` e `achado[3]` e o escape `\\.` da regex de aspas em `tools/ci/e2e-que-cita-literal.ts:45-46` (só o `achado[2]` tem bloco).

   Um bloco para cada deixa a prova explícita.
4. **Linha de log do portão sem teste.** A linha `▶ <spec> entra nos alvos: cita "<texto>"` (`tools/processo/portao-local.ts:124`) é a mensagem que o `executar-task/SKILL.md` promete ao implementador.
5. **Prova da ligação frágil.** `e2e-que-cita-literal.test.ts:176-177` prova a ligação por regex sobre o fonte do `portao-local.ts`, e um reformatar quebra o teste sem quebrar a regra. É aceitável pelo precedente; vale um comentário dizendo isso.
6. **Ajudante da web conta como tela.** `apps/web/src/__fixtures__/` não é excluído como o `.test.tsx` (`tools/ci/e2e-que-cita-literal.ts:57`): texto tirado de `__fixtures__/tela.tsx` puxa spec à toa. Só sobra spec para rodar, nada deixa de rodar.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-18 11:14:50 · `tasks/correcoes/2026-10-18-e2e-que-cita-literal-removido.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de processo e não tem Tech Spec. O diff fica dentro do que o documento declara: o texto da regra 40, os limites conhecidos escritos em três lugares, o comentário sobre o teste de ligação e quatro mutações novas.
Portão local: carimbo válido. O `conferir` deu "válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".
Bloqueantes: nenhum.

Conferi as recomendações da 1ª rodada que a Mesa mandou aplicar:
- O parêntese da regra 40 está fechado em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/.claude/rules/40-testes.md:98-101`. A frase da duração agora diz que só o caso que o diff tocou fica vermelho.
- Os limites (i) pedaço do texto, (ii) JSX ou template que atravessa linhas, (iii) `__fixtures__` e (iv) a contagem de 24 de 59 specs no `3be23c9` estão escritos igual no documento (linhas 42-48), no `executar-task/SKILL.md:178-182` e no `TODO.md:949-956`.
- O comentário sobre a fragilidade do teste de ligação está em `tools/ci/e2e-que-cita-literal.test.ts:173-175`.
- As quatro mutações novas acham o trecho no fonte atual, cada uma uma vez: `e2e-que-cita-literal.ts:45`, `:46` e `:50`. A de `semExpressoes` tem um caso novo que a mata (`test.ts:21`, expressão no meio do texto, que dá dois literais).
- As três recomendações que ficaram sem aplicar têm destino no `TODO.md:950-953` e estão na tabela do documento.

Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-e2e-que-cita-literal-removido.md:322-357`, os quatro blocos `mutacao` e a tabela "Recomendações sem aplicar" ficaram depois de "## Revisões". O `mutacoes.ts` lê os blocos no documento inteiro, então não há falha. Mas o `acrescentarRevisao` (`tools/processo/revisoes.ts:362-369`) acrescenta cada rodada nova no fim do arquivo. Essa linha cai colada na tabela de recomendações e o markdown desenha as duas como uma tabela só. O `lerRevisoes` continua contando certo. Para a leitura, passe os quatro blocos para junto dos outros, em "## Mutações". Já há precedente do mesmo arranjo (`2026-10-15-anel-do-motor-sem-has.md`), então isso não bloqueia.

## test-engineer · 2ª rodada · APROVADO · 2026-10-18 11:15:08 · `tasks/correcoes/2026-10-18-e2e-que-cita-literal-removido.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2: só o diff `034aa22..22a2cb1` e o que ele afeta):
- os quatro blocos de mutação novos ficam vermelhos com o teste que citam, e pelo motivo certo;
- a asserção nova prova a divisão do texto pela expressão entre chaves;
- os limites ficam escritos no documento, no `executar-task` e no `TODO.md`, e o parêntese da regra 40 está corrigido;
- o comentário da fragilidade do teste de ligação está no lugar.

Cobertos: todos. Conferi cada mutação lendo o código, sem mexer na árvore. O teste passou: 16 de 16, com `npx vitest run tools/ci/e2e-que-cita-literal.test.ts`.
- **Mutação 1** (`'\uE000'` vira `''`): fica vermelha só pela asserção nova (`e2e-que-cita-literal.test.ts:21`). A linha vira um único trecho, `Convite enviado a  pela coordenação`, e o esperado são dois trechos. Sem a linha 21 a mutação ficaria verde, porque a linha 20 tem a expressão no fim. A asserção nova é justamente a que faltava.
- **Mutação 2** (tira `achado[1]`): o texto entre aspas simples da linha 11 não sai por outro caminho. A linha não tem `<` e começa em minúscula, então o resultado é `[]`. Vermelha.
- **Mutação 3** (tira `achado[3]`): o template da linha 13 também dá `[]`. Vermelha.
- **Mutação 4** (tira `\\.` das aspas simples): na linha 15 a busca recomeça na aspa escapada e devolve `['ajuda aberta']`, e o esperado é `["Tela d'ajuda aberta"]`. Vermelha.
- Os blocos serão lidos onde estão: o `lerMutacoes` procura bloco em todo o documento (`tools/processo/mutacoes.ts:44`, regex global), não só na seção "Mutações".
- Os textos da regra 40, do `executar-task/SKILL.md` e do `TODO.md` batem com o comportamento do módulo, inclusive os limites (i), (ii) e (iii) e a medida de 24 dos 59 specs.

Bloqueantes: nenhum.

Recomendações:
1. Os quatro blocos de mutação e a tabela "Recomendações sem aplicar" ficaram depois de `## Revisões`, na seção que o hook preenche e que diz "Não edite à mão" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-e2e-que-cita-literal-removido.md:322-355`). O `acrescentarRevisao` sempre escreve no fim do arquivo (`tools/processo/revisoes.ts:367`). Já aconteceu: a linha da rodada 2 do `revisor-geral` caiu na linha 357, embaixo da tabela de recomendações, que tem três colunas. A leitura das rodadas continua funcionando, mas o documento fica torto. Correção: subir os blocos para o fim de `## Mutações` (antes da linha 311) e a tabela de recomendações para antes de `## Revisões`.
2. O comentário de cabeçalho de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/e2e-que-cita-literal.ts:14-15` ainda diz "o que só custa minutos" e só cita os limites antigos. Isso contradiz o documento e o `TODO.md` da rodada, que agora dizem "o que já não são uns minutos" e trazem os limites (i) e (ii). Basta alinhar o texto.
3. As três recomendações que ficaram sem aplicar na 1ª rodada já têm destino no `TODO.md`: o literal de `className`, o teste da linha de log do portão e a exclusão de `apps/web/src/__fixtures__/`. Nada a acrescentar.

# Achados das revisões — `tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-16 10:54:56 · `tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (a árvore atual está carimbada, com as mutações do documento conferidas)
Bloqueantes: nenhum

Recomendações:
- **Asserção sem nova tentativa.** Os laços antigos usavam `await expect(...).toHaveCount/toBeVisible/toHaveText`, que tentam de novo até o prazo. `avaliarAssinaturas`, `avaliarSelos`, `avaliarAvatares` e `medirBlocosDaGaleria` tiram uma foto só do DOM. Hoje isso é seguro, porque o chamador já esperou a galeria abrir, e as 198 de 198 execuções repetidas confirmam. Mas se um selo ou avatar passar a aparecer depois de um estado assíncrono, o caso falha de forma intermitente em vez de esperar. Vale um `expect.poll(() => avaliarSelos(page)).toMatchObject({ falhas: [] })` nos pontos do produto (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-ia.spec.ts:43` e `:67`), ou ao menos uma linha no JSDoc dizendo que a função não espera.
- **Nome do tipo de retorno.** `avaliarSelos` e `avaliarAvatares` devolvem `RelatorioDeAssinaturas` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/avatar.ts:62` e `:80`), mas não conferem assinatura. Um nome neutro, como `Relatorio` ou `RelatorioDaConferencia`, deixa a leitura mais clara.
- **Corpo repetido em `desenhos`.** `desenhos` repete o corpo de `desenho` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/galeria.ts:158`). O motivo está escrito, mas `desenho(alvo)` poderia virar `desenhos(alvo).then(([d]) => d)` sobre um único elemento, desde que antes espere o elemento aparecer, como faz hoje. Assim a lista de propriedades fica num lugar só.
- **Nome do teste nas mutações.** O campo `teste:` das mutações usa só o começo do título (`acusa, um a um, cada defeito da assinatura` contra o título inteiro, que continua `…, e nenhum onde ela está inteira`). O portão aceitou. Se o título mudar, o casamento por prefixo pode deixar de achar o teste sem aviso claro. Usar o título inteiro evita isso.

O que conferi:
- **Equivalência das regras.** Comparei cada regra nova com o laço que ela substitui. São as mesmas:
  - ancestral `[data-assinatura]` mais próximo;
  - um avatar, um selo e um nome;
  - "visível" como o Playwright entende;
  - texto normalizado como no `toHaveText`;
  - quadrado, círculo, um `svg` e nenhuma imagem;
  - `x + width` não passa da janela e o bloco não rola por dentro.
- **Regex do nome.** O `RegExp` é reconstruído pelo `.source`. As três expressões de `NOME_POR_AGENTE` não têm flag, então nada se perde.
- **Produto e prazo.** Só arquivos de teste mudaram. O prazo de 30 s continua o mesmo.
- **Fotos.** As de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/.processo/vitrine/` mostram a galeria como antes, porque o produto não mudou. Não há achado de aderência nelas.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-16 10:55:04 · `tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md`

VEREDITO: APROVADO

Tela vista: sim (42 fotos lidas: `/galeria` na professora, computador 9 + celular 12 na cheia, e o mesmo na vazia). A galeria é uma página fora da navegação e sem sessão, então a cheia e a vazia são iguais. Esta correção só mexe em `e2e/`, e nenhum arquivo de `apps/web` mudou. A foto mostra o que o último e2e construiu, e o código da árvore bate com ela.

Estados: ok. Não se aplica a esta correção. A galeria continua mostrando carregando, vazio com próximo passo, erro com "Tente de novo em instantes" e com dado.

Acessibilidade: sem regressão. Os verificadores em lote mantêm as mesmas regras de antes:
- selo "IA" visível, com a sigla em `aria-hidden` e o texto por extenso;
- nenhum `title`;
- nome da função visível, em `p`, `h2` ou `h3`;
- avatar como círculo quadrado com um `svg` e nenhuma imagem (D58);
- "visível" no sentido do Playwright (caixa com largura e altura, sem `visibility: hidden`).

Os axe da galeria (`violacoesGraves`) seguem como estavam.

Chromebook fraco: a correção ataca a causa do estouro, que era a contagem de idas ao navegador. `conferirAssinaturas`, o laço dos selos, o dos avatares e o dos blocos da galeria viraram um `evaluateAll` cada, e o prazo de 30 s continua. A medida registrada na tarefa mostra os casos entre 7 e 15 s, e 198 de 198 verdes com 2 trabalhadores.

Celular: os dois projetos, `chromebook` e `celular`, rodam os testes novos. Nas 12 fotos de 360 px não há rolagem horizontal nem texto cortado. Botões, abas, alvos de toque e a tabela que vira cartões estão legíveis.

Ação oficial protegida: sim. O diálogo "Aprovar 32 correções" aparece na galeria como antes, e esta correção não toca em nada disso.

Bloqueantes: nenhum.
- Conferi que cada regra do laço antigo está no lote, com a mesma mensagem de falha.
- Cada defeito tem teste que o acusa sozinho: `e2e/pecas-marca-onca.spec.ts:143` em diante (assinatura, selo, avatar) e `e2e/pecas-galeria.spec.ts:55` em diante (blocos e `desenhos`).
- Os testes também provam o que `conferirAssinaturas` precisa fazer: reprovar página sem avatar e página com defeito, e não só relatar.
- As mutações declaradas na tarefa correspondem a linhas reais de `avatar.ts` e `galeria.ts`, e cada uma tem um teste que a derrubaria.

Recomendações:
1. `/galeria`, "Tabela que vira lista", segunda tabela, em `professora--galeria--computador-8.png`: o contêiner estreito corta a coluna "AGENTE E FUNÇÃO" na borda. Parece uma demonstração proposital do contêiner estreito, mas convém uma legenda dizendo isso. Não é desta correção e não bloqueia.
2. `e2e/__fixtures__/galeria.ts`: `desenhos` repete o corpo de `desenho` porque o código que roda no navegador não enxerga o módulo. Um comentário já avisa disso. Se o `desenho` ganhar um campo, os dois precisam mudar juntos, e um teste que compare `desenhos` com `desenho` numa peça evitaria a divergência.
3. `tools/ci/e2e.ts` não repassa `--repeat-each` nem `--workers`, como a própria tarefa notou. Vale registrar para o `/retro`.

Arquivos revisados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/avatar.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/galeria.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-galeria.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-ia.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-marca-onca.spec.ts`

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-16 10:55:29 · `tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md`

```
VEREDITO: APROVADO
Caminhos de escrita em Nota: nenhum nesta correção (só e2e/ muda; nada em apps/api, packages/ ou seed) — todos com autor humano? sim (não há caminho novo)
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok
Supervisão do tutor: ok
Autonomia declarada e visível: sim (não muda nesta correção; nas fotos, "Suspender a função" e o selo "Faz e avisa" continuam na galeria)
Bloqueantes: nenhum
Recomendações:
- e2e/__fixtures__/avatar.ts:19: `RelatorioDeAssinaturas` também é o retorno de `avaliarSelos` (:71) e `avaliarAvatares` (:89). Um nome neutro, como `Relatorio`, diria melhor o que é.
- e2e/__fixtures__/avatar.ts:32-62: a conferência agora é uma leitura só, sem a espera e as novas tentativas que o `toBeVisible` e o `toHaveCount` faziam antes. Isso não fura a prova da regra 70, porque `conferirAssinaturas` reprova página sem avatar (:108) e `pecas-ia.spec.ts` exige ao menos 10 selos e um avatar de cada um dos três agentes. Mesmo assim, vale um comentário dizendo que quem chama já esperou a página carregar, como o `desenhos` de `galeria.ts` já diz.
```

**Escopo:** só mudam testes e2e, e o produto não. Revi o diff dos cinco arquivos e o documento da correção. O que pesa para a regra 70 é a prova de que toda saída de IA vem marcada como IA: cada avatar de agente fica numa assinatura com o nome da função e um selo "IA" visível (D58, regra 70 item 4a). Essa prova continua de pé e ficou mais forte.

- **As regras de antes continuam iguais:**
  - vale a assinatura mais próxima;
  - um avatar e um selo visível por assinatura;
  - o nome do agente certo, conferido pelas mesmas expressões de `NOME_POR_AGENTE`, que não têm flags, então mandar só o texto delas ao navegador não muda nada;
  - a sigla "IA" escondida do leitor de tela, com o texto por extenso e sem `title`;
  - nenhuma imagem dentro do avatar.
- **O verificador agora é testado:** a falha lista todos os defeitos de uma vez. Cada defeito tem um caso próprio em `e2e/pecas-marca-onca.spec.ts:176-241`, e as mutações provam que o teste quebra se a regra sair.
- **Nenhuma prova de conformidade foi tirada.** A mutação em `apps/web/src/componentes/ia/AssinaturaIA.tsx` (`title` no selo) continua sendo pega por `e2e/pecas-ia.spec.ts`.

**Fotos** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/.processo/vitrine/professora--galeria--{computador-1..9,celular-1..12}.png`). As da escola vazia são idênticas byte a byte às da escola cheia.

- **Saída de IA marcada:** toda saída de IA tem avatar, nome da função e selo "IA". Isso vale na conversa, nos sinais do Tutor, no Analista e nas linhas da tabela de aprovação (`computador-4`, `-5`, `-7`, `-8`; `celular-6`, `-9`, `-12`).
- **Aprovação registrada:** a aprovação mostra autor e data ("Aprovado por Camila Souza · 19/09, 10h42"). A rejeição aparece com o motivo, e o estado "Esperando o professor" também está na tela.
- **Lote:** aprovar o lote fica desligado até abrir os destaques ("3 de 5 destaques abertos", `computador-8`, `celular-11`), como pedem a D33, a D56 e a regra 50 item 8.
- **Sem nota proposta:** nenhuma nota, conceito ou sugestão de nota aparece em discursiva ou redação (D55). O "A nota" de `computador-2` é uma opção de lista de demonstração, não saída de IA.
- **Tutor supervisionado sem vigilância:** o sinal do Tutor é de dificuldade ("Oito alunos travaram na questão 3"), sem inferência emocional. O aviso "Seu professor acompanha como você usa o Tutor" está visível.
- **Adaptação:** recebe só o tipo de adaptação ("Não escreva nada sobre o aluno").
- **Nada induz uso:** não há recompensa por tempo de uso nem sequência de dias.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/avatar.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/galeria.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-ia.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-marca-onca.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-galeria.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-16 10:55:47 · `tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md`

VEREDITO: REPROVADO

**Cenários exigidos.** Esta correção só mexe em teste, e os casos de borda do domínio escolar, de permissão e de isolamento não se aplicam. O que precisa ficar provado:
- Quem confere em lote continua vendo o que o laço antigo via: assinatura, selo, avatar, bloco da galeria e desenho da peça.
- Cada verificador acusa cada defeito, com o número do elemento.
- O relatório vira reprovação de verdade: a página vazia reprova, e a página com defeito também.
- Os casos que agora passam na tela real continuam ficando vermelhos quando o produto quebra: o selo com `title`, o avatar fora do quadrado e o bloco que rola por dentro.
- O teto de casos da fatia do e2e continua respeitado.

**Cobertos.**
- **Assinatura:** as 16 tabelas de casos em `e2e/pecas-marca-onca.spec.ts:355-385` cobrem fora do bloco, dois avatares, sem selo, dois selos, selo escondido ou sem caixa, sem largura e sem altura, sem nome, dois nomes, nome escondido, nome de outro agente, agente fora dos três, e a assinatura mais próxima. A conferência reprova a página vazia e a página com defeito.
- **Selo e avatar:** cada defeito é acusado com o número do elemento.
- **Galeria:** `medirBlocosDaGaleria` acusa o bloco largo, o deslocado e o que rola por dentro, e deixa passar o que cabe.
- **Produto:** as mutações em `AssinaturaIA.tsx`, `AvatarAgente.tsx` e `Secao.tsx` provam que os casos da tela real continuam ficando vermelhos.
- **Equivalência com o laço antigo:** a regra é a mesma. `parentElement.closest` faz o papel do `ancestor::[1]`. O "visível" é o do Playwright. Os padrões de nome por agente não usam flag, então passar só o `.source` ao navegador não perde nada.
- **Teto da fatia:** `tools/ci/esteira.test.ts` passou, 11 de 11, rodado aqui.
- Não há `.skip`, teste comentado, mock nem chamada a provedor de IA.

**Bloqueantes.**
1. O teste `desenhos devolve o desenho de cada peça, na ordem` (`e2e/pecas-galeria.spec.ts:76-80`) só confere o campo `fundo`, e as cláusulas novas em `e2e/__fixtures__/galeria.ts:61-68` ficam sem prova.
   - Trocar `peso`, `fonte`, `canto`, `enchimento` ou `borda` por `''`, ou por uma propriedade errada (por exemplo `borderBottom`), não deixa nenhum teste vermelho. O único uso na tela real, em `e2e/pecas-ia.spec.ts:50-51`, confere que os selos têm um desenho só e o `fundo` e o `texto` do primeiro. Um campo constante continua igual em todos os selos, então essa conferência passa mais fraca sem ninguém ver.
   - Essa é justamente a regra "um conjunto só, igual em todo o produto" do selo, que antes era provada com o `desenho` completo de cada selo.
   - **Correção exigida:**
     - No teste, montar duas peças que diferem em todos os campos (fundo, cor, borda, peso, tamanho da fonte, canto e respiro) e asserir `expect(lidos).toEqual([await desenho(a), await desenho(b)])`, ou os sete campos de cada uma.
     - Declarar no documento ao menos uma mutação por campo, ou uma mutação que zere um campo que não seja `fundo`, apontando para esse teste.

**Recomendações.**
- **Verificação de uma vez só.** `avaliarAssinaturas`, `avaliarSelos` e `avaliarAvatares` leem a tela uma vez, sem a espera e repetição automática que `toHaveCount` e `toBeVisible` faziam. Hoje o chamador já esperou (`abrirGaleria`, `irParaOTema`), e 198 de 198 rodadas passaram. Se um dia alguma peça montar tarde, embrulhar em `expect.poll(() => avaliar…(raiz)).toMatchObject({ falhas: [] })` devolve a espera sem voltar às idas por elemento.
- **Bloco escondido.** `medirBlocosDaGaleria` (`e2e/__fixtures__/galeria.ts:~85-97`) deixa passar um bloco com `display:none`, com direita 0. O laço antigo reprovava, porque `caixa()` lançava "a peça não está na tela". Não é a regra de largura, mas o caso deixou de ser visto. Uma lista `semCaixa` no relatório recupera isso.
- **`.trim()` sem caso.** O `.trim()` do nome em `e2e/__fixtures__/avatar.ts:52` não tem caso na tabela. Retirá-lo só deixa a conferência mais rígida, então não esconde defeito. Um caso com espaço em volta do nome documenta a intenção.
- **Prazo.** O ganho de tempo está só medido, no documento. Não há teste que segure o prazo. Isso é aceitável aqui, porque o próprio documento explica por que reproduzir o tempo do runner não é determinístico.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/avatar.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/galeria.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-galeria.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-ia.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-marca-onca.spec.ts

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-16 11:14:29 · `tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md`

VEREDITO: APROVADO
Tela vista: sim (quatro fotos lidas: a primeira de cada conjunto, ou seja computador e celular, escola cheia e vazia). Não li as demais 38 partes. A web não mudou e as fotos são idênticas entre cheia e vazia, o que bate com a rodada anterior. Nenhum arquivo de `apps/web` entrou no diff desta rodada.
Estados: ok. A galeria é uma página de peças sem sessão. Esta rodada só mexeu em e2e, então carregando, vazio e erro não mudam.
Acessibilidade: sem mudança. Nas fotos, os rótulos, o "(obrigatório)" e as mensagens de erro com ícone e texto continuam legíveis e em português.
Chromebook fraco: sem mudança. O diff é só de teste e não toca no código servido.
Celular: nas fotos a 360 px não há rolagem horizontal nem corte, e os botões quebram em linhas sem esconder a ação. O diff não toca nisso.
Ação oficial protegida: não se aplica. A galeria é de peças, sem ação oficial. O botão "Oficial" aparece só como variante visual, com dado inventado e a nota "Não é uma tela do produto".
Bloqueantes: nenhum.
- O teste de `desenhos` em `e2e/pecas-galeria.spec.ts:76-78` agora compara com o `desenho` de cada peça em duas peças que diferem nos sete campos. O próprio teste garante que cada campo difere (`.not.toBe`). Um campo zerado, trocado de propriedade ou fora de ordem em `desenhos` (`e2e/__fixtures__/galeria.ts:57`) reprova.
- O tipo foi renomeado para `RelatorioDaConferencia` em `e2e/__fixtures__/avatar.ts`. Não sobrou referência ao nome antigo em `e2e`, `apps` nem `packages`.
- Os JSDoc que dizem que a função não espera (`avaliarAssinaturas`, `avaliarSelos`, `avaliarAvatares`) descrevem o comportamento real.

Recomendações:
- O documento da correção perdeu a seção "Revisões", como a 1ª rodada já registrou. Restaure-a antes do commit.
- Li as fotos 1 de cada conjunto e não abri as demais. Se o `/validar` quiser a galeria inteira vista, as partes 2 a 9 (computador) e 2 a 12 (celular) estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/.processo/vitrine/`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-16 11:14:30 · `tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (a correção não tem Tech Spec. O documento diz que só o teste muda, e o produto de fato não mudou: nenhum arquivo de `apps/` ou `packages/` está no diff.)
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

O que conferi nesta rodada:
- **O bloqueante da 1ª rodada do `test-engineer` foi atendido.**
  - O teste em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-galeria.spec.ts:76-85` monta duas peças. Elas diferem nos sete campos: fundo, texto, borda (largura, estilo e cor), peso, fonte, canto e enchimento.
  - O próprio teste exige que cada campo difira entre as duas peças, para não provar nada por coincidência.
  - O resultado de `desenhos` é comparado com o `desenho` de cada peça, campo a campo e na ordem.
  - As sete mutações novas, uma por campo de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/galeria.ts:62-68`, batem com linhas reais do arquivo. Todas apontam para esse teste.
- **A troca de `RelatorioDeAssinaturas` por `RelatorioDaConferencia` está completa.** O nome antigo não aparece mais em `e2e/`, `tools/`, `apps/` nem `packages/`. Os três JSDoc que dizem que a função não espera nada aparecer estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/avatar.ts` (`avaliarAssinaturas`, `avaliarSelos` e `avaliarAvatares`).
- **A seção "Recomendações sem aplicar"** dá um destino ou um motivo a cada recomendação da 1ª rodada. Nenhuma recusa esconde defeito.
- **Fotos:** a web não mudou, então as da rodada anterior continuam valendo. Não há achado de aderência nelas.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md:48` chama de "respiro" o campo que o código chama de `enchimento` (`galeria.ts:34`). Vale usar o mesmo nome no documento e no código.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-galeria.spec.ts:83` cabe numa linha só se `for` e `expect` ficarem em linhas separadas. A legibilidade melhora, e o comportamento não muda.

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 11:14:35 · `tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md`

VEREDITO: APROVADO

Cenários exigidos: na 2ª rodada, só o que a 1ª exigiu. As duas peças do teste de `desenhos` precisam diferir nos sete campos, o resultado precisa ser igual ao `desenho` de cada peça e na mesma ordem, e cada campo novo de `desenhos` precisa de uma mutação que aponte para esse teste. Também conferi o que esse diff afeta: a troca do nome do tipo em `avatar.ts` e os comentários que dizem que as funções não esperam.

Cobertos:
- **O teste em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-galeria.spec.ts:76-78`** monta `#a` e `#b`, e os sete campos têm valor diferente nas duas: fundo, texto, borda (2px solid contra 4px dashed), peso (700 contra 400), fonte (15 contra 20px), canto (12 contra 4px) e respiro (3 contra 9px). Uma guarda confere, campo a campo, que as duas peças não coincidem. Sem ela, o teste deixaria de provar alguma coisa sem ninguém perceber. Por fim, `expect(await desenhos(page.locator('p'))).toEqual([a, b])` compara o resultado inteiro, na ordem.
- **O teste reprova cada defeito que a 1ª rodada apontou:**
  - um campo zerado reprova;
  - um campo que lê a propriedade errada também reprova, por exemplo `fonte: estilo.fontWeight` dá "700" onde se espera "15px";
  - a lista fora de ordem ou com uma peça a menos (`slice(1)`) reprova.
- **As mutações em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md:382-471`** são sete, uma por campo. O contexto de cada uma bate com `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/galeria.ts:59-68`. O campo `teste:` é o começo do título novo do teste, que é como o portão encontra o teste. Todas comparam com o `desenho`, que a mutação não toca, então ficam vermelhas pelo motivo certo.
- **A troca de `RelatorioDeAssinaturas` para `RelatorioDaConferencia`** está completa: nenhuma referência ao nome antigo sobrou em `e2e/` nem em `tools/`. Os três comentários sobre "não espera" só registram como o código já se comporta e não mudam nada.
- Não há `.skip`, mock nem provedor de IA. Concorrência não se aplica, porque a correção só mexe em teste.

Bloqueantes: nenhum.

Recomendações:
- No teste, a borda vem do atalho `border:`, que pinta os quatro lados igual. Se `desenhos` passasse a ler `borderBottom*` no lugar de `borderTop*`, o teste não pegaria. Para pegar, basta escrever em `#b` só `border-top:` e deixar os outros lados diferentes. O mesmo vale para `canto`: `borderTopLeftRadius` contra os outros cantos.
- O documento da correção continua sem a seção "Revisões". Quem escreve o registro das rodadas é o hook, mas convém conferir que ela volta antes do commit, para o `/validar` encontrar o histórico no próprio documento.
- As recomendações da 1ª rodada que ficaram sem aplicar estão registradas na tabela, cada uma com destino ou motivo. Não tenho nada a reabrir.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-16 11:14:38 · `tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md`

```
VEREDITO: APROVADO
Caminhos de escrita em Nota: nenhum nesta rodada (o diff só muda e2e/__fixtures__/avatar.ts e e2e/pecas-galeria.spec.ts; nada em apps/, packages/, tools/ ou docs/) — todos com autor humano? sim (não há caminho novo)
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok (sem mudança)
Supervisão do tutor: ok (sem mudança)
Autonomia declarada e visível: sim (sem mudança desde a 1ª rodada)
Bloqueantes: nenhum
Recomendações: nenhuma da regra 70
```

**Correções exigidas.** A 1ª rodada foi aprovada e não pediu correção. Esta rodada atende duas recomendações dos outros revisores, e nenhuma delas toca a regra 70:

- **`desenhos` comparado com `desenho`.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-galeria.spec.ts`, o teste usa duas peças que diferem nos sete campos e compara `desenhos` com o `desenho` de cada uma. O teste só mede estilo (cor, borda, fonte, raio, espaçamento interno). Não grava nem mostra nota, não decide nada sobre aluno e não aprova saída de IA.
- **Nome do tipo e avisos nos comentários.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/avatar.ts`, o tipo `RelatorioDeAssinaturas` passou a se chamar `RelatorioDaConferencia`. Três comentários passaram a dizer que a função não espera a tela carregar. As regras conferidas não mudaram:
  - o selo "IA" continua obrigatório (a saída de IA segue marcada como IA);
  - o nome da função do agente continua obrigatório (D17, D58);
  - o avatar continua sendo um desenho, sem foto (D58).

**O que conferi.**
- **Arquivos fora de `e2e/`.** `git diff --name-only HEAD -- apps packages tools docs` saiu vazio. Nenhuma tela, rota, schema ou seed do produto mudou.
- **Documento da tarefa.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/tasks/correcoes/2026-10-16-galeria-da-onca-estoura-o-prazo.md` cita o Tutor e o Analista só como nomes nas mensagens dos testes que estouravam o prazo. Não traz nada sobre nota, autonomia ou supervisão.
- **Fotos.** A web não mudou, então as fotos da 1ª rodada continuam valendo. Revi `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/.processo/vitrine/professora--galeria--computador-1.png`, e a galeria continua como na rodada anterior: dado inventado e o aviso "Não é uma tela do produto". As fotos não mostram nota proposta em discursiva ou redação, nem saída de IA sem o selo.

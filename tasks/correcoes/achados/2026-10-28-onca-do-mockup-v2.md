# Achados das revisões — `tasks/correcoes/2026-10-28-onca-do-mockup-v2.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-28 22:02:46 · `tasks/correcoes/2026-10-28-onca-do-mockup-v2.md`

VEREDITO: APROVADO
Tela vista: sim (8 fotos lidas: bem-vindo do aluno, da professora e da coordenação, em 1366 e 360 px; a vazia do aluno nos dois tamanhos). A tarefa não cria tela. Ela corrige a onça e seus testes, e as fotos servem de conferência visual.
Estados: ok. Carregando e erro não mudam nesta correção. O bem-vindo mostra a onça, o nome do agente com a marca "IA", a frase de apresentação e o botão Continuar nas fotos cheia e vazia.
Acessibilidade: ok. O foco aparece visível na frase de abertura. Contraste e rótulos não mudaram. O texto da onça segue com o nome e o selo "IA" ao lado (regra 70, item 4a).
Chromebook fraco: ok. "Já acenou" passou do `sessionStorage` para uma variável da página. Não há leitura ou escrita em armazenamento nem temporizador novo. O aceno continua só quando o navegador não pede "reduzir movimento".
Celular: ok. Em 360 px não há rolagem horizontal nem texto cortado. Fechar, Sair e Continuar têm tamanho de toque confortável. Nenhuma tela depende de hover e nenhum fluxo exige o celular. A foto confirma o que o código já mostrava.
Ação oficial protegida: sim. A correção não toca nota, aprovação, publicação, exportação nem exclusão.

Bloqueantes: nenhum.

Conferências que fiz no código:
- **Transformações das poses (`fidelidade-ao-mockup.test.tsx`):** os textos congelados em `TRANSFORMACOES_DO_MOCKUP` batem com `mockups/src/components/duo/onca/Onca.tsx`, que li nas linhas 45 a 101 (`rotate(-4 120 220)`, `translate(30 -16)`, `translate(12 8)`, sombra `scale(.8 1)`, `d` dos rabos). Há também um caso que exige que as quatro poses de `POSES` estejam congeladas.
- **Descida da cabeça (`avatar-com-funcao-e-selo.test.tsx`):** `AvatarAgente.tsx:30-33` tem `top-[2.44px]`, `top-[3.92px]`, `top-[4.4px]` e `top-[4.88px]`. O teste compara cada classe com a conta do mockup (recuo menos o anel de 2 px, mais 6% do tamanho) e exige uma classe de topo só.
- **Chave do aceno (`movimento-da-onca.ts`):** a marca é uma variável de módulo, e `esquecerQueAcenou` serve só aos testes. O texto "turmma-onca-acenou" não aparece mais em `apps/`, `e2e/` nem em `docs/`. O teste novo confere que `sessionStorage` e `localStorage` ficam vazios depois do aceno, o que atende ao contrato dos specs que falharam na esteira.
- **Teste do aceno gasto sem querer:** o caso com "reduzir movimento" confirma que o aceno não é gasto nesse modo, e o caso do gancho com `acenando` falso confirma o mesmo.
- **Constante do e2e:** `e2e/tokens.spec.ts:38` passou a 98, o mesmo número de `estilos.test.ts`.
- **Rodada local:** rodei `vitest` em `componentes/ui/onca` e no teste do avatar: 5 arquivos, 63 testes, todos passando.

Recomendações:
- Os e2e de `*-introducao` e `aparencia` que falharam na esteira não foram rodados por mim. Confirme que ficam verdes na próxima esteira.
- O nome "Colégio sintético da vitrine cheia 4abf251d" aparece na foto da coordenação. Só aparece com o seed da vitrine, mas o item já está no `TODO.md`. Convém tirar o sufixo hexadecimal do seed (`tools/vitrine/`).
- A foto reflete o último e2e. Aqui ela e o código concordam.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-28 22:03:04 · `tasks/correcoes/2026-10-28-onca-do-mockup-v2.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta correção. O diff só mexe em testes da onça e do avatar, no `movimento-da-onca.ts`, no `e2e/tokens.spec.ts` e no `TODO.md`. Nada chega a `Nota`, a uma correção, ao tutor no servidor ou a um agente. Todos com autor humano? Sim, porque esta correção não cria nenhum caminho de escrita.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. Nenhuma saída de IA nova e nenhum fluxo de aprovação foi tocado.

Supervisão do tutor: ok. A correção não mexe no tutor. A onça é só desenho e animação.

Autonomia declarada e visível: sim, e não mudou nesta correção. Nas oito fotos (`aluno--`, `professora--`, `coordenacao--` e `vazia--aluno--aluno-bem-vindo`, computador e celular, em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/.processo/vitrine/`) a regra 70 chega bem à pessoa:
- **Marca de IA:** cada agente aparece com o nome de função e o selo "IA" (Tutor, Assistente de ensino, Analista de desempenho escolar).
- **Programa, não pessoa (D58):** o Tutor diz "Eu sou um programa, e não uma pessoa" e "Eu posso errar".
- **Autonomia em português comum:** o Assistente diz "Nada do que eu preparo chega à turma sem a sua aprovação". O Analista diz "Eu preparo e aviso. Quem aprova é a escola".
- **Nota (D55):** nenhuma nota, conceito ou sugestão de nota aparece.
- **Saída (D59):** "Fechar" e "Sair" estão sempre à vista, no topo, nos dois tamanhos de tela.

Sobre a mudança de comportamento em `apps/web/src/componentes/ui/onca/movimento-da-onca.ts:14-38`: a marca de "já acenou" saiu do `sessionStorage` e foi para uma variável da página.
- **Uso excessivo (D59):** o aceno continua curto, uma vez por página, e desligado com "reduzir movimento". O caso novo em `movimento-da-onca.test.tsx` prova que com "reduzir movimento" o aceno nem conta como gasto. Recarregar a página faz a onça acenar de novo uma vez. Isso não puxa a pessoa a continuar usando: não há recompensa, contagem de dias nem conteúdo que se repete sozinho.
- **Navegador:** deixar de gravar a chave fortalece o contrato de "nada fica no navegador", que já é cobrado em e2e. Nenhuma referência a `turmma-onca-acenou` sobrou em `apps`, `packages`, `e2e` ou `docs`.

Bloqueantes: nenhum.

Recomendações:
- A foto da coordenação (`coordenacao--coordenacao-bem-vindo--computador.png` e `--celular.png`) mostra "Colégio sintético da vitrine cheia 4abf251d" na fala do Analista. Não é assunto da regra 70, e a pendência já está no `TODO.md` para o `frontend-reviewer`. Fica aqui só para a validação não esquecer: um id na fala de um agente de IA atrapalha a explicação em português comum.
- O comentário de `useAcenarNaPrimeiraVez` (`apps/web/src/componentes/ui/onca/movimento-da-onca.ts:30-32`) ainda diz que a marca é "gravada logo depois, num efeito". Ficaria mais claro como "guardada na memória da página", para ninguém pensar de novo em armazenamento do navegador.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-28 22:03:06 · `tasks/correcoes/2026-10-28-onca-do-mockup-v2.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (não se aplica: a correção não toca API, rota nem limitador)
Fila e prioridade: ok (não se aplica: nenhum job novo nem alterado)
Concorrência: protegida (a única mudança de estado é a variável `jaAcenou` no módulo, dentro do navegador, em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.ts:14`. Ela vale por aba e só controla a animação. Não é estado de servidor, então uma segunda instância da API não a quebra.)
Índice e paginação: ok (não se aplica: nenhuma query)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica: nenhum código novo no caminho quente)
Bloqueantes: nenhum
Recomendações:
- O comentário de `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.ts:30-31` ainda diz que a marca "é gravada logo depois, num efeito". Hoje ela não é gravada em lugar nenhum, só fica na memória da página. Vale trocar o texto para "lembrada" e evitar que alguém leia "gravar" como armazenamento.
- `esquecerQueAcenou` existe só para os testes, mas sai no bundle de produção. Se aparecer um segundo caso assim, vale juntar esses ganchos num lugar só ou marcá-los com `@internal`.
- Os seis e2e que falharam na esteira (`*-introducao` e `aparencia:100`) e o `tokens:143` só se confirmam na próxima esteira, porque nenhum revisor os rodou. Confira que ficam verdes antes do pouso.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-28 22:03:13 · `tasks/correcoes/2026-10-28-onca-do-mockup-v2.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum. A correção mexe só em testes de componente visual, em `movimento-da-onca.ts`, que guarda a informação de que a onça já acenou, numa constante do e2e e no `TODO.md`. Nenhuma migration, DTO, rota, repository nem envio externo mudou.

**Fora da tabela de dados do docs/lgpd.md:** nada. A correção tira a única coisa que a rodada anterior gravava no navegador, a chave `turmma-onca-acenou` no `sessionStorage`. Em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.ts:15` essa marca passou a ser `let jaAcenou = false`, uma variável que só existe enquanto a página está aberta. Procurei em `apps/` e não há mais `sessionStorage` nem `localStorage` no código de produção da onça e do avatar. A chave só aparece agora em `mockups/` (fora do produto, por D80) e nos registros de `tasks/`. Volta a valer o contrato da X1 (RF24): o navegador guarda só a aparência, a lateral recolhida e a letra do aluno, e quem usa o mesmo computador depois não herda nada. Isso é melhor que o estado aprovado na rodada 1.

**Autorização por objeto:** não se aplica, porque nenhuma rota, endpoint ou query foi tocada.

**Logs:** limpos. Não entrou nenhum `console.*` nem logger. O arquivo de onça que mudou fora dos testes, `movimento-da-onca.ts`, não loga nada.

**Auditoria:** não se aplica. Nenhuma das ações que exigem auditoria (leitura por coordenação ou rede, exportação, nota, permissão, aprovação de saída de IA) foi tocada.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. As constantes novas dos testes são geometria do desenho, copiada do mockup (transforms e caminhos SVG), e tamanhos em px, sem nenhum dado de pessoa.

**Fotos da tela:** as oito fotos (aluno, professora e coordenação com a escola cheia, aluno com a escola vazia, cada uma no computador e no celular) mostram só o nome de função do agente com o selo "IA" e textos fixos da introdução. Não aparece nome de aluno, matrícula, nota nem conversa. Nas fotos da coordenação aparece o nome da escola sintética da vitrine ("Colégio sintético da vitrine cheia 4abf251d"). Esse nome vem do fixture de `tools/vitrine/`, não foi alterado aqui e já está anotado no `TODO.md`.

**Teste que prova a regra:** o teste "a marca de já acenou não vai para o navegador…" (`/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx:100`) confere que `sessionStorage` e `localStorage` ficam vazios depois do aceno. A mutação declarada, que volta a gravar a chave, deixa esse teste vermelho. Os seis e2e de "nada fica no navegador" que falharam na esteira cobrem o mesmo contrato do lado de fora. Não rodei a suíte; esta conclusão vem da leitura do diff.

**Bloqueantes:** nenhum.

**Recomendações:**
- `esquecerQueAcenou` (`movimento-da-onca.ts:17`) é exportada pelo módulo de produção e serve só aos testes. Não vaza nada, mas um nome ou comentário de "uso exclusivo de teste" que alguma checagem reconheça evitaria uso indevido.
- `docs/../tasks/prd-pele-e-casca/mockup.md:1369` ainda descreve o aceno como `sessionStorage['turmma-onca-acenou']`. Convém anotar ali que o produto diverge do mockup nesse ponto, para ninguém trazer a chave de volta copiando o mockup.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-28 22:04:01 · `tasks/correcoes/2026-10-28-onca-do-mockup-v2.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A tarefa é uma correção e não tem techspec. `docs/interface.md:1154` diz que a onça acena "na primeira vez da sessão" e não diz onde isso fica guardado. Trocar o `sessionStorage` por uma variável da página continua cumprindo esse texto. A mudança está declarada no documento da correção, no item "Correção". Não há divergência decidida em silêncio.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo).

Bloqueantes: nenhum.

Os dois críticos da validação foram fechados:
- **Poses:** `TRANSFORMACOES_DO_MOCKUP` bate, campo por campo, com o `POSES` de `mockups/src/components/duo/onca/Onca.tsx:43-104`. Conferi também a conta do `giro` com `OMBRO_D` (165 173) e `OMBRO_E` (75 173), e o rabo do `pensando` contra o `CAUDA_BASE` do mockup.
- **Descida de 6% do avatar:** o teste confere a classe `top-[…]` nos quatro tamanhos.

Os dois problemas da esteira também foram tratados:
- A chave `turmma-onca-acenou` saiu do código e dos testes. Procurei e não sobrou nenhuma referência.
- `CORES_POR_BLOCO` agora é 98, o mesmo número de `estilos.test.ts`.

Os três itens tirados do `TODO.md` são exatamente os que esta correção fecha.

Nas fotos (as quatro que abri), as três introduções e a escola vazia mostram a onça assinada com o nome da função e o selo "IA". O texto segue o glossário e não aparece nada fora do pedido. O id na foto da coordenação ("Colégio sintético da vitrine cheia 4abf251d") já está no `TODO.md` e não vem desta correção.

Recomendações:
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.ts:10-14`: o comentário diz que o produto não guarda nada no navegador além da aparência, da lateral recolhida e da letra do aluno. Isso não é verdade: o espelho da fila de respostas (`apps/web/src/areas/aluno/espelho-da-fila.test.ts`, 53.0) grava ids no `sessionStorage` durante a prova. Sugiro restringir a frase ao que os specs de introdução e de aparência conferem, ou citar a exceção.
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/ia/avatar-com-funcao-e-selo.test.tsx:101`: o `expect` da conta (`recuo - 2 + tamanho * 0.06`) compara uma fórmula escrita no teste com números escritos no mesmo teste, e não protege nada no componente. Quem protege é a asserção da classe. Pode sair, ou virar só um comentário.
- `fidelidade-ao-mockup.test.tsx`: só o `d` do rabo ficou congelado. O `fim` (onde fica o círculo da ponta), escrito à mão em `Onca.tsx`, pode se afastar do fim do `d` sem nenhum teste ficar vermelho. O mockup tira o `fim` do próprio `d`. É do `test-engineer`; fica registrado.
- `docs/interface.md:1154`: dá para deixar explícito que "sessão" é a página aberta, e que a página recarregada acena de novo. Assim ninguém reintroduz o `sessionStorage` lendo o mockup.
- Não rodei os e2e de `*-introducao` e de `aparencia` que a esteira pegou, e o `frontend-reviewer` também não. Confirme na próxima esteira que eles ficam verdes.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-28 22:04:35 · `tasks/correcoes/2026-10-28-onca-do-mockup-v2.md`

VEREDITO: REPROVADO

Cenários exigidos:
1. Poses: cada uma das quatro poses gira e desloca a figura, a sombra, o rosto, as orelhas, as patas e os pés como o `POSES` do mockup, e o rabo é o mesmo, com o caminho e a ponta. Também precisa haver um caso que trave pose nova sem valores congelados.
2. Avatar: o topo da cabeça é recuo − anel + 6% do tamanho nos quatro tamanhos (24, 32, 40, 48).
3. Chave do aceno: nada vai para o `sessionStorage` nem para o `localStorage`. O aceno acontece uma vez por página: a segunda onça acenando fica parada, `acenando` falso não gasta o aceno, e "reduzir movimento" também não gasta.
4. 98 cores por bloco no e2e, o mesmo número da unidade.
5. Permissão e isolamento não se aplicam. Não há API, tenant nem dado de pessoa: o que muda é que deixa de existir uma chave no navegador.
6. Concorrência: não se aplica a operação de servidor. Duas onças acenando montadas no mesmo render acenam as duas, o mesmo comportamento de antes. Não é regressão.

Cobertos:
- `fidelidade-ao-mockup.test.tsx`: o `it.each` das quatro poses e "as quatro poses estão congeladas". Conferi os valores contra `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/mockups/src/components/duo/onca/Onca.tsx` linhas 43 a 116, com `OMBRO_D` em 165,173 e `OMBRO_E` em 75,173: são idênticos.
- `avatar-com-funcao-e-selo.test.tsx`, o caso dos 6%: a conta bate com `AvatarIA.tsx:19,27` do mockup (`folga + S*0.06`) e a classe literal é conferida, então `top-px` deixa o caso vermelho.
- `movimento-da-onca.test.tsx`: "a marca de já acenou não vai para o navegador", "só a primeira onça acenando", "o gancho só liga o aceno para quem pede" e "o aceno não é gasto com reduzir movimento". A asserção é sobre o resultado, não sobre o código ter rodado.
- `e2e/tokens.spec.ts:38`: 98.
- Mutações: o diff só altera produção em `movimento-da-onca.ts`, e as três linhas novas têm bloco (gravar a chave, `jaAcenou = false`, tirar o `!jaAcenou`). O `mutacoes.ts --faltando` não acusa linha nova sem bloco.
- Os 39 casos dos três arquivos estão verdes. Não há `.skip`, provedor de IA nem mock que esconda a regra. O único stub é o `matchMedia`, e ele não toca a regra testada.

Bloqueantes:
1. A ponta do rabo não está congelada. Fica em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx:203-224` (`transformacoesDesenhadas`), contra `Onca.tsx:86,99,111` e `:72` (o `fim` de cada rabo).
   - No mockup, a ponta escura sai do próprio `d` (`Cauda`, mockup `Onca.tsx:202`, os dois últimos números). No produto, o `fim` é uma segunda cópia escrita à mão, e nenhum teste confere o círculo `r=8`.
   - Exemplo: trocar o `fim` da acenando de `[198, 136]` para `[214, 124]` deixaria os 39 casos verdes. Conferi lendo o código, sem rodar: nenhum teste olha esse círculo.
   - O próprio bloco 5 das Mutações mostra a divergência: muda o fim do `d` para 160 e deixa o `fim` em 152.
   - É a mesma falha que reprovou a validação: um valor do mockup sem teste. E o nome do caso promete o rabo "como o mockup".
   - Correção exigida: no `it.each`, conferir que o `circle[r="8"]` dentro de `[data-parte="rabo"]` tem `cx` e `cy` iguais aos dois últimos números do `rabo` congelado. Acrescentar um bloco `mutacao` no `fim` de uma pose, em `Onca.tsx`.

Recomendações:
- Os seis casos e2e da esteira (`aluno-introducao:81`, `:104` e `:124`, `professor-introducao:75`, `coordenacao-introducao:68`, `aparencia:100`) não foram alterados, então o portão da tarefa não os roda. O documento diz "verdes depois", mas nada o prova antes do commit. Rodá-los na máquina com o projeto `chromebook` e registrar no documento, ou aceitar por escrito que a confirmação fica para a esteira.
- `esquecerQueAcenou` é exportado do código de produção e "só para os testes" é só comentário (`movimento-da-onca.ts:17`). Seria bom uma guarda que reprove o uso dele fora de `*.test.*`.
- A memória da página sobrevive a sair da conta sem recarregar: quem entra depois na mesma aba não vê o aceno. Não é dado pessoal e é o mesmo comportamento do `sessionStorage` antigo. Vale uma linha no comentário, ou chamar `esquecerQueAcenou` ao sair da conta.
- A mão de cada pose (`maoD` `punho` na acenando e na apontando, onde o `cy` é 212 com o braço longo) não está congelada para essas duas poses. Isso é anterior a esta correção e entra no TODO junto da fidelidade.
- O comentário de `useAcenarNaPrimeiraVez` (`movimento-da-onca.ts:31`) ainda fala em "gravada", e hoje só se lembra na memória da página.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-28 22:11:53 · `tasks/correcoes/2026-10-28-onca-do-mockup-v2.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum
Recomendações:
- O caso novo em `apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx:231-237` faz o que faltava na rodada 1. Ele tira a ponta do rabo do `d` congelado no teste (linhas 167-193), não do `d` que o componente desenha, então uma cópia errada do `fim` em `Onca.tsx:86-121` fica vermelha. A mutação 11 do documento mostra isso. O `split(/[\s,CML]+/)` só entende `M`, `C` e `L`. Se um dia entrar um rabo com `Q`, `S` ou comando minúsculo, o caso quebra sem dizer o motivo. Vale uma linha de comentário ou um regex com todos os comandos de caminho. Não é bug hoje: os quatro caminhos usam só `M` e `C`.
- Em `tasks/correcoes/2026-10-28-onca-do-mockup-v2.md`, o bloco da mutação 11 ficou depois da seção "Revisões", que o hook escreve. Ficaria mais fácil de ler junto das outras mutações, na seção "Mutações".
- O que a rodada 1 deixou sem aplicar está no documento e no `TODO.md`, com destino: `esquecerQueAcenou` exportado, os textos de `docs/interface.md:1154` e `tasks/prd-pele-e-casca/mockup.md:1369`, a mão de cada pose e o id na foto da coordenação. Nenhum desses itens bloqueia.
- O comentário novo em `apps/web/src/componentes/ui/onca/movimento-da-onca.ts:9-15` agora diz que sair da conta sem recarregar a página não zera a marca de "já acenou". É o que o código faz. Fica registrado para a validação como comportamento aceito: a marca não é dado pessoal.

## test-engineer · 2ª rodada · APROVADO · 2026-10-28 22:11:57 · `tasks/correcoes/2026-10-28-onca-do-mockup-v2.md`

VEREDITO: APROVADO

**Cenários exigidos:** como a correção da rodada 1 mandou, a ponta escura do rabo (`circle[r="8"]`) de cada uma das quatro poses tem de ficar presa aos dois últimos números do caminho congelado do mockup, com um bloco `mutacao` no `fim` de uma pose.

**Cobertos:**
- **A correção exigida foi feita.** O segundo `it.each` está em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx:231-237` e confere as quatro poses. Ele exige uma ponta só e compara o `cx` e o `cy` com o fim do `rabo` em `TRANSFORMACOES_DO_MOCKUP`. Esse fim é o valor congelado do mockup, e não o `fim` de `Onca.tsx`, então o teste não confere o código com ele mesmo.
- **O bloco de mutação 11 chega à cláusula.** Ele troca o `fim` da pose acenando de `[198, 136]` para `[214, 124]` em `Onca.tsx:86`. O caso "acenando põe a ponta escura do rabo…" esperaria `{cx:198, cy:136}` e receberia `{cx:214, cy:124}`. Fica vermelho pelo motivo certo: um caso que rodou e falhou, e não um erro de carga.
- **O caminho do rabo é lido certo.** A divisão por `[\s,CML]+`, com `filter(Boolean)` e `slice(-2)`, pega o fim certo nas quatro strings congeladas, que só usam `M` e `C`. Se um comando novo aparecer (`Q`, `S` ou minúsculo), a leitura dá `NaN` e o teste falha alto, não passa calado.
- **Avatar.** Saiu o `expect` que comparava uma fórmula do teste com números do mesmo teste. Quem protege o componente continua sendo a classe lida do `span`, em `avatar-com-funcao-e-selo.test.tsx:105-106`, e o bloco de mutação "Avatar", com `top-px`, continua valendo.
- **O resto do diff.** `movimento-da-onca.ts` só muda comentários. Não há `.skip`, mock nem IA neste diff, e nenhuma operação concorrente.
- **Rodei os dois arquivos.** `fidelidade-ao-mockup.test.tsx` e `avatar-com-funcao-e-selo.test.tsx` passaram, 32 casos verdes.

**Bloqueantes:** nenhum.

**Recomendações:**
- O bloco de mutação 11 prova só a pose acenando. As outras três poses ficam cobertas pelo mesmo `it.each`, então não é lacuna de prova. Fica só a observação.
- O `TODO.md` ainda manda congelar a mão de cada pose (`maoD`, `cy` 212). Está registrado e vem de antes desta correção, então não pesa aqui.
- Os seis casos de e2e da esteira (os `*-introducao`, `aparencia:100`) e o `tokens:143` só serão confirmados na próxima esteira. O documento já registra que rodaram isolados, com 166 casos verdes.

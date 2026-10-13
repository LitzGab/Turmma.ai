# Achados das revisões — `tasks/prd-pele-e-casca/1_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-13 02:14:00 · `tasks/prd-pele-e-casca/1_task.md`

VEREDITO: APROVADO
Tela vista: sim (14 fotos lidas: governança, nova conversa e atividades, no computador e no celular, cheia e vazia; a governança vem em dois pedaços no celular)
Estados: ok. Carregando e erro não aparecem na vitrine e esta tarefa não os toca; só troca nomes de token em classes que já existiam. O vazio convida em todas as telas fotografadas ("A IA ainda não gerou nada nesta escola… a entrega aparece aqui", "Nada para fazer agora. Quando quem dá a aula passar uma atividade…").
Acessibilidade: ok. O foco continua visível no claro, que é o único tema alcançável nesta tarefa. O contraste dos pares é provado por `apps/web/src/contraste.test.ts` nos dois temas, 87 linhas. O rótulo de campo e o teclado não mudaram.
Chromebook fraco: ok. O CSS servido passou de 5.685 para 6.584 bytes em brotli (+899). Não há `oklch(`, `color-mix(` nem `:has(`, e os valores são em hex, como o Chrome 109 exige.
Celular: ok. Nas fotos de 360 px não há rolagem horizontal nem corte de conteúdo. Os alvos têm `min-h-11`: "Sair", o botão de enviar e "Abrir dado nominal". A tabela da governança vira cartões.
Ação oficial protegida: sim. A tarefa não altera fluxo nenhum de aprovação; a "Versão adaptada" continua em "Ver e decidir" e mostra o estado "Esperando o professor".

Bloqueantes: nenhum.
- Os três telas no claro estão como a tarefa prevê: sem perda de cor.
- A grep final mostra `bg-white` só em `apps/web/src/componentes/CodigoQr.tsx:34`, a exceção declarada.
- Nenhum `text-white`, `text-black` ou `dark:` resta fora dos testes.
- Toda face forte (`bg-noite`, `bg-erro`, `bg-caramelo*`) leva `text-sobre-grafite` ou `text-sobre-cor`.
- Isso vale, entre outros, em `apps/web/src/componentes/botao-secundario.ts:26,33,68,69,75`, `apps/web/src/componentes/ia/AvatarAgente.tsx:10,11` e `apps/web/src/areas/aluno/Atividade.tsx:150`.
- Os dois blocos de `apps/web/src/estilos.css` têm o mesmo conjunto de nomes e o escuro fica fora de camada.

Recomendações:
1. `apps/web/src/estilos.css` (regra `.bg-noite :focus-visible`, cerca de linha 295). No escuro, `noite` vira `#f1f7fb`. O anel `caramelo-noite` (`#f2a25b`) sobre essa face dá cerca de 1,6:1, então o foco some no cabeçalho da Operação, no tooltip da lateral e nos avatares. Não bloqueia, porque o foco é da tarefa 3.0 e o escuro ainda não é alcançável (a escolha de tema é da 2.0). Deve entrar na 3.0 com teste de contraste do anel contra cada face `bg-noite`, e o comentário da linha 44 de `CascaDaOperacao.tsx` ("o preto some sobre o preto") precisa acompanhar.
2. `apps/web/src/areas/professor/CaixaDoAssistente.tsx` (o campo "Peça uma atividade, um plano de aula…"). Na foto `professora--professor-nova-conversa--celular.png` o placeholder aparece cortado na segunda linha ("aula" pela metade) em 360 px. Não vem desta tarefa: a diferença em `Home.tsx` é só de classe de cor. Mas vale corrigir na tarefa que recompõe o compositor (altura mínima do campo ou placeholder mais curto).
3. A foto da governança confirma que a ação "Abrir dado nominal de uma turma" usa `oficial` (preto sólido) no claro. Quando o botão for recomposto na 3.0, conferir se o mockup pede a face `noite` com degrau.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-13 02:15:06 · `tasks/prd-pele-e-casca/1_task.md`

VEREDITO: REPROVADO

**Cenários exigidos** (da tabela da tarefa e das linhas A1, A9, A10, U1 a U4, U6 e U7 do `cenarios.md`):
- os dois blocos do CSS iguais ao documento
- nome que só existe num tema
- cor fora da lista, arbitrária ou com opacidade
- `white`, `black`, `dark:` e cor em linha
- o número fixo de cores por bloco
- o contraste de cada par nos dois temas, com o número fixo de linhas e a negativa
- os pares antigos e o desligado
- a borda de campo com 3:1
- o texto sobre face forte nos dois temas: o contraste **e a guarda que reprova `text-tinta`/`text-white` na mesma classe de uma face forte**
- o QR como única exceção
- o CSS servido nos dois temas, sem `oklch(`, `color-mix(`, `:has(`, `scrollbar-width` nem `@font-face`
- o escuro ligando pelo atributo, com o axe

Isolamento, permissão e concorrência não se aplicam: a tarefa é só de tokens visuais, sem dado de escola nem operação que possa rodar duas vezes. Os casos de borda do domínio escolar também não se aplicam.

**Cobertos:** rodei `estilos.test.ts`, `contraste.test.ts` e `botao-secundario.test.ts`, e os 22 passam.
- Os dois blocos são comparados com a 9.10 nos dois sentidos, com 97 nomes em cada um.
- O conjunto de nomes é o mesmo no claro e no escuro, e o escuro fica fora de camada.
- Todo valor é hex, e o `veu` tem oito dígitos.
- A guarda reprova `white`/`black`, `dark:` e `fill`/`stroke`/`style` com hex ou `rgb(`, e tem a negativa com a fixture. O `CodigoQr` passa só no próprio arquivo, e as listas fechadas apontam arquivos que existem.
- O contraste usa as 87 linhas, com a âncora da fórmula (21 e 6,6) e a negativa com o nome e o número. Os pares antigos, o desligado, `borda-campo` 3:1, `sobre-grafite`/`noite`/`erro` e `sobre-cor`/`caramelo*` estão na tabela.
- O e2e cobre os dois blocos servidos com os valores do documento, o E5 sem `:has(` e sem `scrollbar-width`, e o `data-tema` trocando o chão e o texto calculados e voltando, com o axe.
- As seis mutações declaradas chegam à cláusula pelo motivo certo.

**Bloqueantes:**
1. **A guarda não reprova `text-tinta` sobre face forte.** O cenário "o texto sobre face forte" exige isso, e a fixture em `apps/web/src/estilos.test.ts:249` ainda afirma que `bg-caramelo text-tinta` **passa**. Com isso, as trocas da 1.3 de `text-tinta` para `text-sobre-cor` ficam sem teste:
   - `areas/navegacao.ts:114`
   - `componentes/ia/AvatarAgente.tsx:11`
   - `operacao/paginas/Mfa.tsx:48`
   - `operacao/paginas/ConfigurarMfa.tsx:121`
   - `operacao/paginas/Uso.tsx:122`
   - `paginas/AcessoSuspenso.tsx:38`
   - `paginas/ConfigurarMfa.tsx:178`
   - `paginas/SemDesafio.tsx:19`

   O mesmo vale para `text-tinta` sobre `bg-noite`, que no escuro dá `#f1f7fb` sobre `#f1f7fb` e deixa o texto invisível. Desfazer qualquer uma dessas trocas não deixa nada vermelho: no claro o valor é o mesmo, e nenhum e2e mede o escuro nessas peças.
   - **Correção exigida:** em `classesReprovadas` (`estilos.test.ts:146`), reprovar `text-tinta` e `text-white` na mesma string de classe que `bg-noite`, `bg-erro`, `bg-caramelo`, `bg-caramelo-claro` ou `bg-caramelo-fundo`, comparando sempre o mesmo prefixo de variante. Assim o par `disabled:bg-inativo disabled:text-tinta` continua passando.
   - Na fixture, `bg-caramelo text-tinta` sai da linha que passa e entra nas reprovadas, e entra também um caso com `bg-noite text-tinta`.
   - Acrescentar um bloco de mutação, por exemplo `SemDesafio.tsx:19` voltando de `text-sobre-cor` para `text-tinta`.

2. **O `::selection` dos dois temas não tem teste nem bloco de mutação** (`apps/web/src/estilos.css:309-317`). Apagar as duas regras não deixa nada vermelho. Além disso, `#fbd9c3` não está no `docs/interface.md`, e é uma cor servida que não vem da lista do documento (RF1).
   - **Correção exigida:** usar tokens da 9.10 (o `#734528` do escuro já é `laranja-borda`), ou declarar os dois valores no documento.
   - Pôr o par da seleção na tabela "Pares de contraste" e acertar `PARES_DA_TABELA`.
   - Ter um teste que falhe sem as regras, de unidade lendo o CSS ou no e2e, com o bloco de mutação dele.

3. **O `disabled:text-tinta` novo do primário não tem bloco de mutação** (`apps/web/src/componentes/botao-secundario.ts:68`). É divergência resolvida na tarefa e cláusula nova. O teste existe (`botao-secundario.test.ts:51`), mas a seção "Mutações" não o declara.
   - **Correção exigida:** acrescentar o bloco, removendo `disabled:text-tinta` do `primario`, com esse teste.

**Recomendações:**
- A linha A9 do `cenarios.md` pede que o E5 de `casca.spec.ts` procure `#333333`, `#f2545b`, `#b84045`, `#146eaa`, `#dff1fd`, `#99d2f8` e `#e5e5e5`. O `tokens.spec.ts` já cobre isso com mais força, token a token; acrescente os sete ou registre a troca em "Divergências".
- A linha A10 cita `infinite` no CSS servido, e o E5 não confere isso. Confirmar se fica para a 3.0 ou entra aqui.
- A linha U7 pede que o primário não tenha `text-sobre-grafite`, e o teste não afirma isso.
- O `color: var(--color-tinta)` do `html` é provado pelo mesmo e2e, mas não tem bloco próprio. Vale um segundo bloco.
- `COR_EM_LINHA` não inclui `background`, `outlineColor` nem `fill:`/`stroke:` dentro de objeto `style` com valor condicional (`cond ? '#fff' : …`).

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.test.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/contraste.test.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/componentes/botao-secundario.test.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.css`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/e2e/tokens.spec.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/e2e/casca.spec.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/1_task.md`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-13 02:15:46 · `tasks/prd-pele-e-casca/1_task.md`

VEREDITO: REPROVADO
Escopo: incompleto
Aderência à Tech Spec: divergência na guarda de cor (§10, Unidade) e no E2E `tokens` (§10; `cenarios.md` A10)
Portão local: carimbo válido

**Bloqueantes**

1. **A guarda deixa passar `text-tinta` sobre o laranja.** Em `apps/web/src/estilos.test.ts:146-165` (`classesReprovadas`) e `:249`, a guarda não reprova `text-tinta` quando ele está na mesma classe de uma face forte. O fixture da linha 249 vai além: afirma como "o que passa" justamente `bg-caramelo text-tinta`.
   - A linha "o texto sobre face forte, nos dois temas" da tabela de testes da tarefa pede o contrário: "a guarda reprova `text-tinta` e `text-white` na mesma classe de uma face forte".
   - Não é só teste. No escuro esse par dá `#f1f7fb` sobre `#eb8447`, cerca de 2,4:1. Uma tela nova que escreva `bg-caramelo text-tinta` passa na guarda e fica ilegível.
   - O que fazer:
     - Reprovar `text-tinta` e `text-white` (com e sem variante) na mesma string de classe de `bg-caramelo`, `bg-caramelo-claro`, `bg-caramelo-fundo`, `bg-noite` e `bg-erro`.
     - Tirar `bg-caramelo text-tinta` da linha que passa no fixture e pô-lo entre as reprovadas.
     - Declarar a mutação.

2. **A cor escrita à mão no `style` só é pega em alguns nomes de propriedade.** Em `apps/web/src/estilos.test.ts:139`, a expressão `COR_EM_LINHA` só olha `fill`, `stroke`, `stopColor`, `floodColor`, `color`, `backgroundColor` e `borderColor`. Testei, e passam calados:
   - `style={{ background: "#fff" }}`
   - `boxShadow: "0 0 0 2px #123456"`
   - `borderTopColor: "#123"`
   - `outlineColor: "rgb(1,2,3)"`

   A subtarefa 1.4 e a Tech Spec §10 pedem "hex ou `rgb(` em `fill`, `stroke` e `style` dos `.tsx`". O que fazer: reprovar qualquer hex, `rgb(` ou `hsl(` dentro de um objeto `style={{…}}`, além dos atributos `fill` e `stroke`, e pôr `background` e `boxShadow` no fixture das reprovadas (`:267-284`).

3. **Falta conferir `infinite` no CSS servido.** Em `e2e/casca.spec.ts:324-326`, o "E5" ganhou `:has(` e `scrollbar-width`, mas não `infinite`.
   - A linha A10 do `cenarios.md`, marcada para a tarefa 1.0, pede "sem `:has(`, sem `scrollbar-width` e sem `infinite`". A Tech Spec §10, no E2E `tokens`, diz o mesmo.
   - A seção 9.5, item 3, do `docs/interface.md`, que esta árvore alterou, afirma agora que "o CSS servido não tem `infinite` (D59)".
   - Nenhuma outra tarefa faz essa conferência: a omissão está só na subtarefa 1.6 do `1_task.md`.
   - O que fazer: acrescentar `expect(css).not.toContain('infinite')`. Hoje o CSS do build não tem `infinite`, então a asserção passa. A outra saída é registrar a divergência na `techspec.md` e no `cenarios.md`, com a tarefa que assume a conferência.

**Recomendações**
- **Hex do A9.** A linha A9 do `cenarios.md` pede no "E5" os hex `#333333`, `#f2545b`, `#b84045`, `#146eaa`, `#dff1fd`, `#99d2f8` e `#e5e5e5`. Entraram três hex do escuro no lugar deles. O `tokens.spec.ts` já compara os 97 nomes nos dois temas, então dá para acrescentar os sete ou registrar a troca no `cenarios.md`.
- **`Botao.tsx` fora da tabela.** `apps/web/src/componentes/Botao.tsx` foi alterado (só o comentário) e não está em "Arquivos previstos". É essa tabela que decide com quem a tarefa corre em paralelo.
- **Linha errada na tabela de pares.** Em `docs/interface.md`, a linha "botão oficial de antes, no hover" usa `noite-baixo`. Mas o hover do oficial é `noite-alto` (`botao-secundario.ts:150`); `noite-baixo` é o apertado. Corrigir o token e, se quiser, acrescentar o apertado.
- **Seleção de texto em hex solto.** O `::selection` (`estilos.css:309-317`) usa hex fora dos tokens (`#fbd9c3`), e o par não está na tabela de contraste.
- **Foco sobre `bg-noite` no escuro.** `.bg-noite :focus-visible` (`estilos.css:296-298`) usa `caramelo-noite`, que no escuro, sobre `noite` (`#f1f7fb`), dá cerca de 2:1. A regra do foco é da 3.0, mas o `3_task.md` não cita esse caso. Como a 2.0, que vem antes, já deixa escolher o escuro, convém registrar o caso na 3.0.
- **Commit com mudanças da revisão da spec.** O diff do `docs/interface.md` traz as correções das rodadas 2 a 4 da revisão da spec: medidas do botão, `public/`, "Nenhum laço", a onça. Vale dizer isso na mensagem do commit da tarefa, ou separar num commit só de documento.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.test.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/e2e/casca.spec.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.css
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/docs/interface.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/cenarios.md

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-13 02:25:00 · `tasks/prd-pele-e-casca/1_task.md`

VEREDITO: APROVADO
Tela vista: sim (15 fotos lidas: governança, nova conversa e atividades, no computador e no celular, escola cheia e vazia; governança vazia no celular em dois pedaços)
Estados: ok. Vazio convida e diz o próximo passo na governança, na atividade do aluno e na nova conversa. Carregando e erro não aparecem na vitrine, e esta rodada não os alterou.
Acessibilidade: ok. O diff desta rodada só troca o `::selection` para tokens. Em `apps/web/src/estilos.css:310-311`, `laranja-borda` (#f5c0a1 no claro, #734528 no escuro) leva `tinta` (#0d0d0d no claro, #f1f7fb no escuro) nos dois temas. Os dois pares passam de 4,5:1, e o par novo entrou em `docs/interface.md` e em `contraste.test.ts` (88 linhas).
Chromebook fraco: sem impacto. Nenhum componente mudou, só CSS e testes.
Celular: ok nas fotos. Não há rolagem horizontal em 360 px, a tabela da governança vira cartões, e os botões "Sair" e "Abrir dado nominal" têm alvo adequado.
Ação oficial protegida: sim. Nada nesta rodada toca ação oficial.
Bloqueantes: nenhum. As três correções da rodada anterior eram só recomendações, e o diff não as aplicou nem as precisava aplicar.
Recomendações (já registradas, destino 3.0 ou tarefa do compositor):
- Foco `.bg-noite :focus-visible` no escuro.
- Placeholder do campo da nova conversa cortado em 360 px: "Peça uma atividade, um plano de aula…" aparece truncado em `professora--professor-nova-conversa--celular.png` e na versão vazia.
- Botão "Abrir dado nominal de uma turma": o texto do botão e a explicação acima dele ainda podem ficar mais diretos.
- Texto "Aprovado por gente" no cartão de governança soa estranho. Sugestão: "Aprovado por um professor".

## test-engineer · 2ª rodada · APROVADO · 2026-10-13 02:25:39 · `tasks/prd-pele-e-casca/1_task.md`

VEREDITO: APROVADO

**Cenários exigidos (para esta rodada, as três correções da 1ª):**
1. A guarda reprova `text-tinta` e `text-white` sobre uma face forte (`noite`, `erro`, `caramelo` e as duas variantes). O par desligado do primário continua passando. O bloco de mutação está no código de produção.
2. A seleção de texto usa token nos dois temas, tem o par na tabela de contraste, um teste que falha sem a regra e o bloco de mutação dele.
3. O bloco de mutação de `disabled:text-tinta` no primário.

**Cobertos:**
1. `textosSobreFaceForte` entra em `classesReprovadas` (`apps/web/src/estilos.test.ts:202`). Ela compara a variante exata da face com a do texto.
   - A fixture nova reprova `bg-caramelo text-tinta`, `bg-noite text-tinta`, `bg-erro text-white` e `hover:bg-caramelo-claro hover:text-tinta`, e deixa passar `disabled:bg-inativo disabled:text-tinta`.
   - A linha que antes passava agora usa `text-sobre-cor`, e a da fixture de branco fixo saiu de `bg-noite`.
   - Bloco de mutação em `AvatarAgente.tsx` (o tutor voltando para `text-tinta`) contra o teste que varre os arquivos reais. Ele fica vermelho pelo motivo certo: `text-tinta` é token válido, e só a regra nova o reprova.
2. Os dois hex do `::selection` viraram uma regra só com `var(--color-laranja-borda)` e `var(--color-tinta)` (`apps/web/src/estilos.css:309`). No claro dá `#0d0d0d` sobre `#f5c0a1`, no escuro `#f1f7fb` sobre `#734528`.
   - A linha "texto selecionado" entrou na tabela de pares do `docs/interface.md`, e `PARES_DA_TABELA` passou a 88. O `contraste.test.ts` confere cada par nos dois temas.
   - O teste novo exige as duas variáveis e uma regra `::selection` só. O bloco remove o `color`.
3. O bloco que tira `disabled:text-tinta` do `primario` está no documento, contra `botao-secundario.test.ts:37`, que exige essa classe.
- Rodei os três arquivos de unidade da tarefa: 24 de 24 verdes.
- As recomendações da rodada anterior também foram tratadas:
  - O E5 procura os sete hex.
  - `infinite` é proibido no CSS servido.
  - O primário tem `text-sobre-grafite` negado.
  - O `html` ganhou o segundo bloco.
  - `COR_EM_LINHA` passou a ler qualquer propriedade de `style={{…}}`, inclusive o valor condicional. A fixture tem caso que reprova e caso que passa.

**Bloqueantes:** nenhum.

**Recomendações** (nenhuma bloqueia; ficam para a 3.0, onde o foco e o botão são refeitos):
- A guarda só compara classes com o mesmo prefixo de variante. Por isso `bg-superficie text-tinta hover:bg-caramelo` passa, e na tela o hover fica com `tinta` sobre o laranja. Foi o que a correção pediu, mas vale um caso a mais: face forte com variante e texto base sem ela.
- `TEXTO_ENTRE_ASPAS` lê uma linha por vez. Ficam de fora a lista de classes quebrada em várias linhas e a face e o texto em textos diferentes do mesmo template (`` `bg-caramelo ${x ? 'text-tinta' : ''}` ``). Também fica de fora o texto herdado de outro elemento, como um filho `text-tinta` dentro do `<header className="bg-noite …">` de `CascaDaOperacao.tsx:48`. Hoje nenhum arquivo cai nisso. Para esses casos o que vale é o axe no escuro, ou um caso de fixture que documente o limite da guarda.
- A mutação da seleção cobre só o `color`. O `background-color` está afirmado no teste, mas não tem bloco próprio. Um segundo bloco, removendo o fundo, deixaria as duas metades provadas.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.test.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.css`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/contraste.test.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/componentes/botao-secundario.test.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/e2e/casca.spec.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/docs/interface.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/1_task.md`

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-13 02:26:21 · `tasks/prd-pele-e-casca/1_task.md`

VEREDITO: REPROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido. O `conferir` respondeu "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".

**Correções da 1ª rodada:**
- **Item 1, feito.** `textosSobreFaceForte` (`apps/web/src/estilos.test.ts:157-176`) reprova `text-tinta` e `text-white` quando estão com a mesma variante de `bg-caramelo`, `-claro`, `-fundo`, `bg-noite` ou `bg-erro`. O `bg-caramelo text-tinta` saiu da linha que passa e está entre as reprovadas. A mutação está declarada no `AvatarAgente.tsx`. Na árvore não sobra nenhum par desses.
- **Item 2, feito só em parte.** Bloqueante abaixo.
- **Item 3, feito.** O `expect(css).not.toContain('infinite')` está em `e2e/casca.spec.ts:308`.

**Bloqueantes:**
1. **`apps/web/src/estilos.test.ts:148` e `:186-192`: a guarda não pega toda cor escrita dentro do `style={{…}}`.** A correção pedia reprovar qualquer hex, `rgb(` ou `hsl(` dentro do objeto. `COR_NO_ESTILO` (`([A-Za-z]+)\s*:[^,}]*?(cor)`) só acha a cor que vem depois de `propriedade:` sem vírgula no meio. Testei com as mesmas expressões da guarda:
   - `style={{ boxShadow: "0 0 0 2px var(--x), 0 1px #fff" }}` passa sem acusar nada.
   - `background: "linear-gradient(#fff, #000)"` acusa o `#fff` e não acusa o `#000`.

   A sombra de várias camadas é justamente a forma do degrau da D80, que as peças das próximas tarefas vão escrever.

   **Correção exigida:** dentro do conteúdo de cada `style={{…}}`, procurar `COR_ESCRITA` em qualquer posição, e não só logo depois de `propriedade:`. A propriedade mais próxima à esquerda pode servir só para a mensagem. Acrescentar ao fixto das reprovadas (`:329`) a sombra de duas camadas com hex na segunda e o gradiente com dois hex.

**Recomendações:**
- **`tasks/prd-pele-e-casca/1_task.md:130`:** a divergência da seleção de texto cita "Ordem de correção da 1ª rodada, item 3". O item 3 era o `infinite`; a seleção de texto foi recomendação daquela rodada. Corrigir a citação.
- **`tasks/prd-pele-e-casca/1_task.md:131`:** a divergência do `#333` diz que está registrada no `cenarios.md` A9, mas a A9 ainda diz `#333333`. Como a cor é a mesma, isso não chega a ser divergência de comportamento. Ou tirar a linha, ou anotar na A9 que o build encurta o hex.
- **As outras recomendações da 1ª rodada estão na árvore:**
  - os hex da A9 em `casca.spec.ts:294-297`;
  - o `Botao.tsx` na tabela;
  - a linha `noite-baixo` renomeada para "apertado";
  - o `::selection` por token, com o par "texto selecionado" na tabela (88 linhas);
  - o foco sobre `bg-noite` no escuro registrado no `3_task.md`;
  - o commit da revisão da spec declarado.

Arquivos citados:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.test.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/1_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/cenarios.md`

## frontend-reviewer · 3ª rodada · APROVADO · 2026-10-13 02:35:52 · `tasks/prd-pele-e-casca/1_task.md`

VEREDITO: APROVADO
Tela vista: sim (7 fotos lidas: governança cheia e vazia no computador, governança cheia no celular, nova conversa da professora cheia no computador e no celular, atividades do aluno cheia no computador e no celular). Não abri as fotos `celular-2` da governança, as vazias da professora e do aluno em celular nem as vazias em computador da professora e do aluno. O diff desta rodada não mexe em componente, então não há o que mudar nelas.
Estados: ok. Nas fotos: com dado, vazio com convite ("A IA ainda não gerou nada nesta escola. Quando um professor pedir…") e a tela do aluno com "Nada para responder agora". Carregando e erro seguem pelo código e pelo e2e, sem alteração nesta rodada.
Acessibilidade: ok. O foco visível no tema escuro (`.bg-noite :focus-visible`) continua como recomendação da rodada 2, com destino na 3.0.
Chromebook fraco: sem alteração. O diff é só teste e um comentário de CSS, sem custo de CPU nem de rede.
Celular: ok. Não há rolagem horizontal a 360 px. A tabela da governança vira cartões, e os botões e a ação principal têm altura de toque adequada. A área de texto da professora corta o placeholder a 360 px, recomendação já registrada na rodada 2 e sem alteração.
Ação oficial protegida: sim. O diff não toca nessa parte. "Abrir dado nominal de uma turma" continua com a finalidade explicada à vista.
Bloqueantes: nenhum.
- O diff é só `apps/web/src/estilos.css` (um comentário) e `apps/web/src/estilos.test.ts`.
- A guarda de cor passou a procurar hex e funções de cor em qualquer posição do arquivo (antes só em `fill`, `stroke` e `style`) e a reprovar cor escrita pelo nome em atributo SVG.
- As fotos mostram o tema claro, sem perda de cor, coerente com o código.

Recomendações (já com destino, sem bloqueio):
- Foco `.bg-noite :focus-visible` no escuro.
- Placeholder cortado a 360 px no campo da professora (`professora--professor-nova-conversa--celular.png`). Sugestão: reduzir o texto ou deixar a área de texto crescer.
- Texto do botão "Abrir dado nominal de uma turma".
- A guarda de cor reprova hex em comentário, e a regra "quem comenta diz o nome do token" é estrita. Fica registrada, é só aviso.

## test-engineer · 3ª rodada · APROVADO · 2026-10-13 02:36:39 · `tasks/prd-pele-e-casca/1_task.md`

VEREDITO: APROVADO

**Cenários exigidos (o que mudou nesta rodada).**
- A guarda pega a cor escrita à mão em qualquer lugar do arquivo, e não só depois de `fill`, `stroke` ou `style`. Os casos são a segunda camada de uma sombra, os dois hex de um gradiente, o atributo com valor condicional, o objeto de estilo guardado numa constante e a função de cor nova (`oklch(`).
- A guarda pega a cor pelo nome em atributo de SVG (`fill="white"`, `stroke='red'`).
- O token passa: `var(--color-*)`, `url(#…)`, `currentColor` e `none`.
- Fora dos dois blocos de token, o `estilos.css` só escreve cor no véu do diálogo.
- Os dois blocos de mutação novos ficam vermelhos pelo motivo certo.

**Cobertos.**
- **A fixture reprova o certo e passa o certo** (`apps/web/src/estilos.test.ts:324-366`). A comparação é com `toEqual` sobre a lista exata, então nem caso a mais nem caso a menos passa.
  - Reprovam as oito linhas novas, cada uma com o nome certo de atributo ou propriedade. Conferi o nome que `NOME_A_ESQUERDA` devolve no valor condicional `fill={aberto ? '#fff' : '#000'}`: dá `fill` nos dois hex, porque `fff' :` não casa com `[A-Za-z]\s*[=:]`.
  - Passam `var(--color-laranja)`, `url(#desenho)` e `boxShadow` só com token.
- **Os três arquivos rodaram verdes:** `npx vitest run` de `estilos.test.ts`, `contraste.test.ts` e `botao-secundario.test.ts` deu 3 arquivos e 25 testes passando. A web real continua sem nada reprovado, com o QR como exceção da lista (`estilos.test.ts:92`).
- **A mutação da guarda** (`1_task.md:202-207`) tira o `achados.set` do laço de hex e de função de cor. Com isso as dezesseis entradas de cor escrita à mão somem da saída, e o `toEqual` da fixture fica vermelho exatamente pela regra.
- **A mutação do véu** (`1_task.md:209-215`) põe `#5d5d5d` no `::placeholder` (`estilos.css:304`), que fica fora dos dois blocos. A lista passa de `['rgba(']` para `['#5d5d5d', 'rgba(']`, e o teste fica vermelho pelo motivo certo.
- **O teste do véu** (`estilos.test.ts:398-408`) falha com qualquer cor nova fora dos blocos, inclusive `color-mix(`, que está em `COR_ESCRITA`. Ele também prende o valor exato do `dialog::backdrop`, então trocar um `rgba` por outro também fica vermelho. O comentário é tirado antes da busca, coerente com a cor estar só no comentário do CSS.
- **A Tech Spec §10 e o desvio registrado no `1_task.md`** dizem o mesmo que a guarda faz agora.

**Bloqueantes:** nenhum.

**Recomendações (nenhuma bloqueia).**
1. **Falso positivo com hex válido depois de `#`** (`estilos.test.ts:42`). `COR_ESCRITA` reprova `url(#fade)`, `url(#cafe)` e `href="#add"`, porque o nome do id é um hex de 3 a 8 dígitos. A fixture usa `url(#desenho)`, que não é hex, e por isso não mostra o caso. O erro é para o lado seguro (reprova, não deixa passar), mas vai confundir quem nomear um gradiente da onça. Sugestão: pular o hex logo depois de `url(` ou de `href="`, com uma linha de fixture `url(#fade)` que passa.
2. **Cor pelo nome fora de atributo literal de SVG não é pega:**
   - `style={{ color: 'white' }}`
   - `fill={aberto ? 'white' : 'none'}`
   - `const estilo = { background: 'red' }`

   Hoje está dentro do escopo declarado ("cor pelo nome em atributo de SVG"). Vale registrar como limite conhecido, como o `TEXTO_ENTRE_ASPAS` da rodada 2, para a tarefa 2.0 ou 3.0.
3. **O laço de `ATRIBUTO_DE_COR` (`estilos.test.ts:190-194`) não tem bloco de mutação próprio.** A fixture já prova esse laço: tirar o laço faz sumir `fill white` e `stroke red`, e o `toEqual` fica vermelho. Mesmo assim, um bloco que tire o laço deixaria a prova explícita no portão.
4. **Ficam como estavam as da 2ª rodada:**
   - face forte com variante e texto base sem ela (tarefa 3.0);
   - `TEXTO_ENTRE_ASPAS` lendo uma linha por vez;
   - a mutação da seleção cobrindo só o `color`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.test.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.css`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/1_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/.processo/ordens/diff-1_task-r2-r3.patch`

## revisor-geral · 3ª rodada · REPROVADO · 2026-10-13 02:36:53 · `tasks/prd-pele-e-casca/1_task.md`

VEREDITO: REPROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A §10 da `techspec.md`, a A9 do `cenarios.md` e a divergência do `1_task.md` descrevem a guarda como ela está agora. O que falta é a guarda cumprir o que a §10 promete: "a cor escrita à mão (hex ou função de cor) em qualquer lugar dos `.ts` e `.tsx`".

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

A correção da rodada 2 foi feita. A segunda camada da sombra, o gradiente de dois hex, o valor condicional, a constante de estilo e `oklch(` agora reprovam. Também não achei falso positivo no código de hoje, já que o portão passou a unidade inteira.

Bloqueantes:

1. `apps/web/src/estilos.test.ts:186-187`
   - **O que está errado:** o laço pula todo hex que vem logo depois de `[`. O comentário justifica que "a cor arbitrária de uma classe já reprova como 'cor fora do @theme'", e isso é falso para utilitários que `CLASSE_QUE_PINTA` (`:127-130`) não reconhece. O padrão dela exige `^|[\s"'`:\[]` imediatamente antes de `shadow`/`ring`, e em `inset-shadow-` e `drop-shadow-` vem um `-` antes.
   - **Como testei:** rodei as expressões reais em três classes, `inset-shadow-[#fff]`, `drop-shadow-[#123456]` e `inset-ring-[#fff]`. As duas guardas devolvem `[]`.
   - **O efeito:** compilei as três com o Tailwind 4.3.3 do projeto, e ele gera `--tw-inset-shadow-color: #fff`, `--tw-drop-shadow-color: #123456` e `--tw-inset-ring-color: #fff`. É cor fixa que não vira com o tema e passa pela guarda. A sombra interna é o jeito natural de desenhar o estado "apertado" do degrau da D80, que as peças das próximas tarefas vão escrever. É o mesmo tipo de furo que reprovou a rodada 2.
   - **Correção exigida:** escolher um dos dois caminhos:
     - tirar o `continue` do `[` em `:187`, para o hex ser procurado mesmo dentro de colchete; ou
     - fazer `CLASSE_QUE_PINTA` reconhecer `inset-shadow`, `drop-shadow` e `inset-ring`.

     Em qualquer dos dois, apagar o comentário falso. Acrescentar ao fixture das reprovadas (`:326-343`) `inset-shadow-[#fff]` e `drop-shadow-[#123456]`, e declarar mutação que prove o caso.

Recomendações:
- A cor pelo nome escapa quando não vem em `atributo="..."`. Os casos: `style={{ color: 'white' }}` (é o mesmo defeito do `text-white`, que reprova), `fill={'white'}`, `fill={aberto ? 'white' : 'none'}`, `fill = "white"` com espaço e o atributo com hífen `flood-color="red"`. A Tech Spec só promete o nome "em atributo de SVG", então isso fica como recomendação. Vale cobrir pelo menos o atributo de SVG com valor entre chaves.
- `COR_ESCRITA` (`:144`) não tem a flag `i`. A função de cor em maiúscula (`RGB(1,2,3)`), que o CSS aceita, passa.
- Falso positivo que vai aparecer no futuro: qualquer `#` seguido de 3 a 8 letras de a a f ou dígitos reprova, como `href="#acabada"`, uma âncora `#cafe` ou "PR #123" num comentário. O caso do comentário está declarado; o da âncora não. Vale dizer isso no comentário de `:138-143`.

Arquivos citados:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.test.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/1_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/techspec.md`

## test-engineer · 4ª rodada · REPROVADO · 2026-10-13 07:59:06 · `tasks/prd-pele-e-casca/1_task.md`

**VEREDITO: REPROVADO**

Há um único bloqueante, e ele é pequeno: duas mudanças novas no regex não têm bloco de mutação. O teste em si já prova as duas, então o conserto é só no documento.

**Cenários exigidos (os que a mudança desta rodada toca):**
- Cor entre colchetes numa classe que a guarda de classes não conhece: `inset-shadow-[#fff]`, `drop-shadow-[#123456]`, `inset-ring-[rgb(1,2,3)]`.
- Função de cor em maiúscula (`RGB(`).
- Cor pelo nome com maiúscula (`White`).
- Cor pelo nome dentro de um ternário (`fill={aberto ? 'white' : 'none'}`).
- `=` com espaço em volta (`floodColor = "red"`).
- O que deve continuar passando: `none`, `currentColor`, `url(#desenho)` e `var(--…)`.
- A exceção do QR.
- A varredura real da web sem falso positivo.

**Cobertos:**
- Todos os de cima estão em `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.test.ts:356-394`.
- A asserção é a lista exata com `toEqual`, então mede o resultado e não só que o código rodou.
- A cor entre colchetes aparece duas vezes, como fora do `@theme` e como cor em linha, e a fixture registra isso (:337-338).
- `npx vitest run apps/web/src/estilos.test.ts`: 12 de 12 verdes. A varredura real continua vazia, então o `COR_PELO_NOME` não gera falso positivo no código de hoje.
- Os três blocos novos chegam à cláusula pelo motivo certo:
  - O bloco que tira o `achados.set` do laço da `COR_ESCRITA` some com todas as cores escritas da fixture.
  - O bloco que pula o `[` some com as três classes entre colchetes.
  - O bloco que tira o laço da `COR_PELO_NOME` some com `fill white`, `stroke red`, `White` e `floodColor red`.
- O bloco da `::selection` sem `background-color` bate na asserção da linha :423.
- As recomendações 2 e 3 da rodada anterior foram feitas. A 1, dos falsos positivos, ficou declarada no comentário e na tabela de divergências.

**Bloqueantes:**
1. A seção Mutações de `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/1_task.md` (blocos das linhas 202-230) não tem bloco para duas mudanças novas desta rodada:
   - **A flag `i` da `COR_ESCRITA`** (`estilos.test.ts:150`). Ela é o que faz `RGB(` reprovar, e sem ela o caso some. A cláusula é nova e não tem bloco.
   - **A flag `i` da `COR_PELO_NOME`** (`estilos.test.ts:163`). Ela é o que faz `White` reprovar. Também é nova e sem bloco.

   Pela leitura, os dois blocos ficariam vermelhos: os casos `color RGB(` e `outlineColor White` sairiam da lista esperada. Mesmo assim, o portão da tarefa não provou isso. A correção exigida é acrescentar dois blocos `mutacao`, com o teste `apps/web/src/estilos.test.ts › a guarda reprova o que não vira com o tema`:
   ```
   -const COR_ESCRITA = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/gi
   +const COR_ESCRITA = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/g
   ```
   ```
   -const COR_PELO_NOME = new RegExp(String.raw`(["'\`])(${NOMES_DE_COR_DO_CSS})\1`, 'gi')
   +const COR_PELO_NOME = new RegExp(String.raw`(["'\`])(${NOMES_DE_COR_DO_CSS})\1`, 'g')
   ```
   Depois, rodar o portão da tarefa.

**Recomendações:**
- A `classeArbitraria` (`estilos.test.ts:166`) só decide o texto da mensagem. Se ela devolvesse `null`, o teste ficaria vermelho do mesmo jeito, porque a mensagem viraria `className #fff`. Não precisa de bloco, mas um bloco deixaria isso dito.
- `COR_PELO_NOME` reprova qualquer texto que seja exatamente um nome de cor do CSS: `'tan'`, `'snow'`, `'gold'`, `'navy'`, `'peru'`, `'plum'`, `'tomato'`, também com maiúscula. Hoje não acerta nada, mas um rótulo ou valor de lista com uma dessas palavras vai reprovar. Vale uma linha a mais na lista de falsos positivos aceitos, no comentário das linhas 139-147 e na tabela de divergências.
- As recomendações da 2ª rodada continuam com destino na 3.0: a face forte com variante e a lista de classes quebrada em várias linhas.

Não há `.skip`, teste comentado, mock nem chamada a provedor.

## revisor-geral · 4ª rodada · REPROVADO · 2026-10-13 07:59:08 · `tasks/prd-pele-e-casca/1_task.md`

**VEREDITO: REPROVADO**

A correção da 3ª rodada foi feita: o laço não pula mais a cor entre colchetes, e o comentário falso saiu. Sobra um bloqueante, que se resolve com uma linha na Tech Spec.

- **Escopo:** respeitado.
- **Aderência à Tech Spec:** a §10 ("Guarda de cor") diz uma coisa e o `1_task.md` diz outra.
- **Portão local:** o carimbo é válido. O `conferir` respondeu: "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".

**Bloqueantes**

1. **A Tech Spec não diz o que o `1_task.md` afirma que ela diz.**
   - Onde: `tasks/prd-pele-e-casca/techspec.md:198` e `tasks/prd-pele-e-casca/1_task.md:131`.
   - O que está errado: nesta rodada, a guarda passou a procurar a cor pelo nome em qualquer texto entre aspas, sem diferença de maiúscula, e não só nos atributos de SVG. Isso inclui objeto de estilo, constante e valor condicional (`COR_PELO_NOME`, `apps/web/src/estilos.test.ts:163`, flag `gi`). Também passou a reprovar a cor entre os colchetes de qualquer classe.
   - A linha de divergência no `1_task.md` registra esse alcance novo e diz que a Tech Spec "passou a dizer o mesmo". Não passou: a §10 continua com "mais a cor pelo nome em atributo de SVG", e o diff desta rodada não mexeu na Tech Spec.
   - Hoje a divergência está só no `1_task.md`, o que bloqueia.
   - Correção exigida: trocar o trecho da §10, na `techspec.md:198`, para dizer o que a guarda faz agora. A guarda procura a cor escrita à mão (hex ou função de cor, sem diferença de maiúscula) em qualquer lugar dos `.ts` e `.tsx`, inclusive entre os colchetes de uma classe. Procura também a cor pelo nome quando ela é o texto inteiro entre aspas. Junto, registrar os falsos positivos aceitos e os dois casos que ela não pega: a cor pelo nome dentro de um valor composto e a cor montada em tempo de execução, que ficam com o axe no tema escuro. A linha U3 dos `cenarios.md` diz só "cor em linha" e não precisa mudar.

**Conferência da correção exigida na 3ª rodada**

- O `continue` do `[` saiu. A cor entre colchetes agora reprova com a classe inteira na mensagem (`classeArbitraria`, `apps/web/src/estilos.test.ts:166-171`).
- O comentário falso saiu. O comentário de `COR_ESCRITA` (`:139-149`) agora diz o alcance, os falsos positivos e o que a guarda não pega.
- `inset-shadow-[#fff]`, `drop-shadow-[#123456]` e `inset-ring-[rgb(1,2,3)]` entraram no fixture das reprovadas (`:358` e `:388-390`).
- Há mutação declarada que prova o caso: a 2ª do bloco novo do `1_task.md` volta a pular o `[` e precisa deixar o teste vermelho.

As três recomendações da 3ª rodada também foram atendidas: a cor pelo nome fora de `atributo="..."`, a flag `i` em `COR_ESCRITA` e os falsos positivos ditos no comentário.

**Recomendações**

- `COR_PELO_NOME` com `gi` e a lista inteira de nomes do CSS (`tan`, `gold`, `navy`, `snow`, `plum`, `peru`…) reprova qualquer texto entre aspas igual a um desses nomes, mesmo fora de contexto de cor, como uma união de tipos ou um valor de enum. Hoje nada na web cai nisso. Vale incluir esse falso positivo no comentário de `:159-162`, junto dos outros.
- Em `classesReprovadas`, a mesma classe `bg-[#1d4ed8]` gera duas mensagens, como diz o comentário de `:337`. É aceitável, mas, se a ideia é uma mensagem por defeito, `coresEmLinha` pode pular as classes que a guarda de classes já reprovou.

## test-engineer · 5ª rodada · APROVADO · 2026-10-13 08:05:45 · `tasks/prd-pele-e-casca/1_task.md`

VEREDITO: APROVADO

Cenários exigidos: a mesma lista da 4ª rodada. Desta vez conferi só o diff `cf45134 → 514805f` e a correção exigida.

Cobertos:
- **Correção 1 da 4ª rodada: feita.** `tasks/prd-pele-e-casca/1_task.md` tem agora dois blocos `mutacao` novos. Um tira a flag `i` de `COR_ESCRITA`, o outro a de `COR_PELO_NOME` (`gi` → `g`). Os dois apontam para `apps/web/src/estilos.test.ts › a guarda reprova o que não vira com o tema`. O texto que cada bloco remove é igual às linhas do arquivo (`apps/web/src/estilos.test.ts:150` e `:163`), então as duas mutações conseguem ser aplicadas.
- **As duas mutações ficam vermelhas pelo motivo certo.** O teste usa um texto de exemplo (fixture), e a linha `:359` dele tem as duas cores em maiúscula: `color: "RGB(1, 2, 3)"` e `outlineColor: 'White'`. O resultado esperado traz as duas mensagens: `'color RGB( (cor em linha)'` em `:391` e `'outlineColor White (cor em linha)'` em `:392`.
  - Sem a flag `i` em `COR_ESCRITA`, `RGB(` deixa de ser encontrado e a mensagem de `:391` some.
  - Sem a flag `i` em `COR_PELO_NOME`, `'White'` deixa de ser encontrado e a mensagem de `:392` some.
  - Em cada caso o teste falha exatamente na cláusula que a mutação tirou.
- **Nenhum código mudou nesta rodada.** O diff em `estilos.test.ts` é só o comentário de `COR_ESCRITA` (`:145-148`). Ele agora diz o falso positivo do nome de cor entre aspas, como a 4ª recomendou. `npx vitest run apps/web/src/estilos.test.ts` passa: 12 testes.
- **A Tech Spec diz o mesmo que o código e o documento da tarefa.** A linha de divergência no `1_task.md` e a §10, "Guarda de cor", do `techspec.md` descrevem igual o que a guarda faz: sem diferença de maiúscula, entre colchetes, nome de cor quando é o texto inteiro entre aspas. As duas citam os mesmos falsos positivos e os mesmos dois limites (cor pelo nome dentro de valor composto, cor montada em tempo de execução, que ficam com o axe no tema escuro).
- **Nada proibido:** sem `.skip`, sem teste comentado e sem mock nos arquivos alterados.

Bloqueantes: nenhum.

Recomendações:
- `apps/web/src/estilos.test.ts:147`: a linha nova do comentário ficou bem mais longa que as outras do bloco, porque juntou "Quem cair num deles troca o nome. O que a guarda **não** pega:…" numa linha só. Quebrá-la como as vizinhas deixa o comentário mais fácil de ler. É só formatação.
- Na §10 do `tasks/prd-pele-e-casca/techspec.md`, o trecho "O que ela não pega: … ; e `bg-grafite` e `bg-noite` … como face só em lista fechada" emenda a lista fechada da face forte na frase dos limites. Quem lê pode entender que a guarda também "não pega" o `bg-grafite`. Começar uma frase nova antes de "`bg-grafite` e `bg-noite`" desfaz a dúvida.

## revisor-geral · 5ª rodada · REPROVADO · 2026-10-13 08:05:53 · `tasks/prd-pele-e-casca/1_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: há uma divergência em `techspec.md` §10, linha "Unidade", no item "Guarda de cor". A frase nova inverteu o sentido da regra do `bg-grafite`/`bg-noite`.
Portão local: carimbo válido

Bloqueantes:
- **`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/techspec.md:198`: a correção pedida na 4ª rodada foi feita, mas quebrou a frase seguinte.**
  - **O que estava.** Na versão anterior, a cláusula "; e `bg-grafite` e `bg-noite` (com `-alto` e `-baixo`) como face só em lista fechada, que só encolhe: …" fazia parte da lista do que a guarda **reprova**.
  - **O que mudou.** As duas frases novas ("Falsos positivos aceitos: …" e "O que ela não pega: …") entraram antes dessa cláusula, e o texto ficou assim:

    > O que ela não pega: a cor pelo nome dentro de um valor composto e a cor montada em tempo de execução, que ficam com o axe no tema escuro; e `bg-grafite` e `bg-noite` (…) como face só em lista fechada

  - **O problema.** Lida como está, a Tech Spec diz que a lista fechada do `bg-grafite`/`bg-noite` (RF6) é algo que a guarda **não pega**. É o oposto do que o teste faz. É também o oposto do que a divergência do `1_task.md` afirma ao dizer que a §10 "passou a dizer o mesmo".
  - **Correção exigida.** Devolver a cláusula do `bg-grafite`/`bg-noite` à lista do que a guarda reprova. Há dois jeitos:
    - pôr as frases "Falsos positivos aceitos" e "O que ela não pega" depois da cláusula da lista fechada (antes de "**Botão:**");
    - ou abrir a cláusula com sujeito próprio, por exemplo "Reprova também `bg-grafite` e `bg-noite` (…) como face fora da lista fechada, que só encolhe: …".

  Fora isso, a 4ª rodada pediu duas coisas, e as duas estão feitas:
  - O texto da guarda na §10 agora diz o que ela faz: sem diferença de caixa, inclusive entre os colchetes de uma classe, e a cor pelo nome só quando é o texto inteiro entre aspas. Traz também os falsos positivos aceitos e os dois casos que ela não pega.
  - A recomendação sobre o comentário de `COR_ESCRITA` foi aplicada.

Recomendações:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.test.ts:147`: a linha do comentário ficou com 229 caracteres, e as vizinhas têm cerca de 115. Vale quebrá-la na mesma largura das outras.

## revisor-geral · 6ª rodada · REPROVADO · 2026-10-13 08:13:39 · `tasks/prd-pele-e-casca/1_task.md`

**VEREDITO: REPROVADO**

**Escopo:** respeitado

**Aderência à Tech Spec:** divergência na guarda de cor. A regra do texto que não acompanha a face forte está na tarefa e no teste, mas falta na `techspec.md` e no `cenarios.md`.

**Portão local:** carimbo válido. O `conferir` respondeu "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".

**Correções da 5ª rodada:** as duas foram feitas.
- `techspec.md:198`: a cláusula agora abre com "Reprova também `bg-grafite` e `bg-noite` (…) como face fora de uma lista fechada". Os falsos positivos e o "não pega" vieram depois dela, ligados à cor escrita à mão. Bate com a linha "grafite só onde é oficial" do `3_task.md:80`, que é onde essa guarda é construída. A `1_task.md` não a reivindica, e está certo assim.
- `estilos.test.ts:145-150`: o comentário de `COR_ESCRITA` foi quebrado na largura das linhas vizinhas.

**Bloqueantes**

1. `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/techspec.md:198` (linha Unidade, "Guarda de cor") e `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/cenarios.md:199` (U3, "oráculo novo").
   - **O que está errado:** a guarda tem uma regra que nenhum dos dois documentos descreve. `textosSobreFaceForte`, chamada em `estilos.test.ts:237`, reprova `text-tinta` e `text-white` com a mesma variante de uma face forte (`FACE_FORTE`, `estilos.test.ts:176`: `noite`, `erro`, `caramelo`, `caramelo-claro` e `caramelo-fundo`).
   - **Onde ela aparece:** a subtarefa 1.4 do `1_task.md:42` ("o texto que não acompanha a face forte"), o `tasks.md:16` e a tabela de testes do `1_task.md` (linha "o texto sobre face forte, nos dois temas").
   - **Onde falta:** a Tech Spec §10 não a cita, e a U3 do `cenarios.md` só cita "`white` e `black` fora da lista fechada, `dark:` e cor em linha". O 1.4 diz que "como ficou, e por quê, está em Divergências", mas a tabela de divergências também não fala dessa regra.
   - **Por que importa:** é exatamente o caso "divergência só no `N_task.md`". E tem efeito prático: a 3.0 troca as faces (`bg-caramelo` vira a face laranja, entra `bg-grafite`). Quem lê a Tech Spec não sabe que `FACE_FORTE` precisa acompanhar essa troca, e a guarda deixa de cobrir as faces novas sem nenhum teste ficar vermelho.
   - **Correção exigida:** pôr na "Guarda de cor" da `techspec.md:198` a cláusula "o texto `tinta` ou `white` com a mesma variante de uma face forte (`noite`, `erro`, `caramelo` e as duas variantes)", e a mesma regra no oráculo novo da U3 em `cenarios.md:199`.

**Conferência da descrição da guarda de cor em todos os lugares**

| Onde | Situação |
|---|---|
| `techspec.md:198` | Bate com o código, exceto pela face forte (bloqueante acima) |
| `1_task.md` (1.4 e "Divergências") | Bate com o código |
| `tasks.md` (1.4) | Bate com o código |
| Comentário de `COR_ESCRITA` (`estilos.test.ts:136-150`) | Bate com o código: no arquivo inteiro, sem diferença de caixa, entre colchetes, com o nome de cor como texto inteiro entre aspas, e com os falsos positivos e os limites |
| `docs/interface.md` | Não descreve a guarda, só diz que `white` e `black` saem das telas (707-708). Não há o que divergir |

**Recomendações**

- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/estilos.test.ts:91`: o comentário de `ARQUIVOS_COM_COR_EM_LINHA` diz "A onça e os ícones ilustrados entram aqui com as tarefas deles". A Tech Spec e o 1.4 dizem que o ícone ilustrado lê token, não leva hex, e só a onça entra (na 8.0). Tirar "e os ícones ilustrados".
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/3_task.md`: acrescentar uma linha na tabela de testes dizendo que `FACE_FORTE` (`estilos.test.ts:176`) passa a listar as faces novas da 3.0 (`laranja` e as variantes dela, `grafite`). Assim o texto sobre elas continua coberto pela guarda.

## revisor-geral · 7ª rodada · APROVADO · 2026-10-13 08:20:43 · `tasks/prd-pele-e-casca/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

As duas correções da 6ª rodada estão feitas, e as duas linhas novas da tabela de testes descrevem o que o código faz.

- **(a) A regra do texto sobre face forte agora está na Tech Spec e nos cenários.**
  - `tasks/prd-pele-e-casca/techspec.md:198` ("Guarda de cor") e `tasks/prd-pele-e-casca/cenarios.md:199` (U3) passam a dizer: "texto `tinta` ou `white` com a mesma variante de uma face forte (`noite`, `erro`, `caramelo` e as duas variantes dele)".
  - Isso bate com o código de `apps/web/src/estilos.test.ts`: `FACE_FORTE` na linha 176 (`noite|erro|caramelo|caramelo-claro|caramelo-fundo`), `TEXTO_QUE_NAO_ACOMPANHA` na 179 (`tinta|white`) e a comparação por variante igual em `textosSobreFaceForte`, linha 196.
  - A regra deixou de existir só no `1_task.md`.
  - As duas recomendações da rodada anterior também entraram: o comentário de `estilos.test.ts:91` e a linha nova em `tasks/prd-pele-e-casca/3_task.md:83`, que manda `FACE_FORTE` acompanhar as faces criadas na 3.0.
- **(b) As duas linhas novas da tabela de testes conferem.**
  - Seleção de texto: `apps/web/src/estilos.css:150-152` pinta o `::selection` com `var(--color-laranja-borda)` e `var(--color-tinta)`. O teste em `estilos.test.ts:421-428` exige essas duas variáveis e uma regra só. O par "texto selecionado" está na tabela de pares, em `docs/interface.md:807`.
  - Cor fora dos tokens: fora dos dois blocos de token, a única cor escrita no `estilos.css` é o `rgba(13, 13, 13, 0.75)` do `dialog::backdrop`, na linha 164. O teste em `estilos.test.ts:430-440` exige exatamente essa única ocorrência, e a mutação que troca o `::placeholder` por `#5d5d5d` (`1_task.md:249-255`) prova que ele reprova.
- **(c) Nenhuma outra descrição da guarda ou dos testes diverge do código.**
  - `tasks.md:16`, a subtarefa 1.4 e a linha U3 dizem o mesmo que o código.

Recomendações:
- `tasks/prd-pele-e-casca/1_task.md:97`: troque "na mesma classe de uma face forte" por "na mesma lista de classes e com a mesma variante de uma face forte". Assim o texto fica igual ao da guarda e ao da Tech Spec.
- `tasks/prd-pele-e-casca/1_task.md:42-43`: o 1.4 diz que "como ficou, e por quê, está em Divergências", mas a tabela de divergências não fala do texto sobre face forte. Agora que a regra está na Tech Spec, ela não é mais divergência: restrinja a frase à cor escrita à mão, que é o que a linha 134 da tabela cobre.

# Achados das revisões — `tasks/prd-telas-da-coordenacao/6_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-17 03:08:43 · `tasks/prd-telas-da-coordenacao/6_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** o nome e o `usuarioId` do professor, o estado do convite e as turmas e disciplinas dos vínculos dele. Nada disso é campo novo: tudo já vinha de `GET /v1/professores` e `GET /v1/vinculos`, sem migration e sem mudança de contrato em `packages/shared`. Não aparece nenhum dado de aluno na tela nem nas fotos.

**Fora da tabela de dados do docs/lgpd.md:** nenhum.

**Autorização por objeto:** ok.
- O painel só abre para um professor que está na lista da escola da sessão (`apps/web/src/areas/coordenacao/professores-da-escola.ts:66-69`). Um id de outra escola, inventado ou vazio não abre nada e não revela o nome.
- Isso está provado no teste de componente "o professor de outra escola no endereço…" (`apps/web/src/areas/coordenacao/Professores.test.tsx:374`) e no e2e com a sessão de B.
- Refazer e revogar usam os mesmos endpoints da A1, com a mesma autorização no servidor. Esta tarefa não mexeu no backend.
- O endereço leva só o id (`?professor=<usuarioId>`, `apps/web/src/caminhos.ts:101,108`), nunca o nome.

**Logs:** limpos. Os arquivos novos não usam `console`, `localStorage` nem `sessionStorage`. O e2e confere que o token do convite não aparece em URL, navegação, console, armazenamento, histórico, IndexedDB nem Cache.

**Auditoria:** a tarefa não cria ação nova que exija auditoria. O cadastro, o refazer e o revogar continuam nos endpoints de antes. Nenhum dado de aluno é lido pela tela: os vínculos com papel diferente de `professor` são descartados em `professores-da-escola.ts:30`.

**Envio externo:** nenhum. A tela não chama IA nem serviço de fora.

**Seed/fixture:** sintético. O teste de componente usa nomes inventados. O e2e usa e-mails `@educa.invalid` com UUID (`e2e/professores.spec.ts:214`). As fotos mostram "Professor(a) Sintético(a) … c8826d56" e "Colégio sintético da vitrine".

**O que as fotos mostram, conferido contra a regra 20:**
- **Tabela, no computador e no celular** (`coordenacao--coordenacao-professores--computador.png` e `--celular.png`): só nome, disciplina, turma e situação. Não aparece e-mail, contagem de uso nem ordem que não seja a do nome. Isso bate com a regra 70, item 9 (D64).
- **Painel** (`coordenacao--coordenacao-professores--tbody-tr-nth-0--computador.png` e `--celular.png`): só o nome e "Situação do convite". Não aparecem e-mail nem link de convite. O código que produz isso é `apps/web/src/areas/coordenacao/PainelDoProfessor.tsx:56-67`.
- **Escola vazia** (`vazia--…computador.png` e `vazia--…celular.png`): mostra o mesmo recorte de dados.

**Exposição:**
- **DTO:** `esquemaVinculoDaCoordenacao` é `.strict()` e não traz e-mail.
- **E-mail:** o teste "sem e-mail" (`Professores.test.tsx:223`) prova que a tela não mostra nenhum `@` e que só pede anos, professores e vínculos.
- **Token do convite:** continua só no diálogo, com `gcTime: 0` em `apps/web/src/api/professores.ts:48,57`. O painel não guarda nem repete o token.
- **Troca de sessão:** quando a sessão muda, o diálogo aberto fecha (`apps/web/src/areas/coordenacao/Professores.tsx:140`).

**Pergunta de fechamento:** a tarefa é só de tela e não cria dado novo, rastro novo nem envio novo. O que o sistema já respondia sobre um titular continua igual.

**Bloqueantes:** nenhum.

**Recomendações:**
- O anúncio "Convite de <nome> revogado." põe o nome do professor numa região `aria-live`. É dado de adulto e fica só na tela da coordenação, então está aceitável. Se esse padrão for copiado para telas com dado de aluno, vale revisar caso a caso.
- No celular, com o painel aberto (`coordenacao--coordenacao-professores--tbody-tr-nth-0--celular.png`), o cartão de outro professor aparece por baixo da folha, fora do véu. Não vaza dado novo, porque essa pessoa já está na lista que a coordenação vê. O problema é visual e fica para o `frontend-reviewer`.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 03:09:01 · `tasks/prd-telas-da-coordenacao/6_task.md`

VEREDITO: APROVADO

Tela vista: sim (6 fotos lidas: lista e painel do professor, no computador e no celular, na escola cheia; lista no computador e no celular na escola vazia). A foto "vazia" não mostra o estado vazio da tela. A escola da vitrine já traz a Professora Rosa, então a tela aparece com 1 professor. O vazio "Nenhum professor ainda" foi conferido só pelo código e pelos testes. As fotos mostram só o estado `ativo`. Os selos longos de `vencido`, `revogado` e `desativado` não foram vistos.

Estados: ok.
- Carregando, erro com "Tentar de novo", vazio com "Cadastrar professor" e com dado estão em `Professores.tsx:161-211`.
- A releitura que cai com a lista ainda vazia não afirma o vazio.
- A falha da leitura dos anos e dos vínculos não derruba a tabela: ela fica com "—" e um `Aviso` com "Tentar de novo".
- `Professores.test.tsx:140-190` e `:266-315` cobrem os quatro estados e essa falha.

Acessibilidade: ok.
- O nome é `<button aria-haspopup="dialog">` com alvo de 44 px (`Professores.tsx:66`), estendido pela linha, com anel de foco por dentro dela.
- O painel é `dialog` modal com Esc e foco preso. O foco volta a quem abriu, ou ao título da lista quando o painel abre pelo endereço.
- No painel, o foco vai ao título "Situação do convite" depois de revogar.
- O selo traz ícone e texto, nunca só cor.
- A tabela tem `caption`, `th scope` e rótulo por valor na lista do celular.
- O e2e a 360 px confere teclado, `violacoesGraves` e `larguraExcedente`.

Chromebook fraco: ok.
- A tabela só é montada na largura certa, uma estrutura por vez, e a lista é paginada com `AvisoDeListaIncompleta`.
- Não há animação de largura ou altura, nem imagem.

Celular: ok.
- A lista de professores virou cartões a 360 px, sem rolagem horizontal e sem texto cortado na foto.
- "Cadastrar professor" tem cerca de 44 px, e o painel vira folha de baixo com "Fechar" de 44 px.
- Nada depende de hover. O e2e roda nos projetos `chromebook` e `celular`.
- Nas fotos do celular, a barra de baixo aparece no meio da página. Isso é efeito de fotografar a página inteira com a barra fixa. A mesma coisa aparece nas telas anteriores.

Ação oficial protegida: sim.
- Cadastrar mostra o resumo com nome e e-mail antes de confirmar.
- Refazer e revogar abrem confirmação com o nome do professor (`Professores.tsx:253-290`).
- O link do convite aparece uma vez, só no diálogo, e fechar sem copiar pergunta antes.
- A lista e o painel não trazem e-mail: nada na tabela nem no painel o mostra, e a tela só pede anos, professores e vínculos (`Professores.test.tsx:223`).
- O painel só oferece as ações que o estado permite (`PainelDoProfessor.tsx`).
- O `?professor=` de outra escola não abre nada (`professores-da-escola.ts:67`, regra 10 item 6).
- Não há ranking, adoção nem ordem que não seja a do nome (regra 70 itens 8 e 9).

Bloqueantes: nenhum.

Recomendações:
1. **Texto do selo na tabela.** `convite-de-professor.ts:26-33` e `Professores.tsx:84`. A tabela repete no selo a frase inteira de cada estado, como "Convite revogado. Para convidar de novo, cadastre o mesmo e-mail." Em `ativo` aparece "ATIVO." com ponto final. O mockup `mockup.md` 3.6 usa selos curtos: "Ativo", "Convite em aberto", "Convite vencido". Na tabela, o selo curto fica mais limpo; a frase com o próximo passo cabe melhor no painel. Isso depende de a tarefa 6.2 mandar usar `TEXTO_DO_ESTADO_DO_PROFESSOR`, então ficou como recomendação, e o texto que o e2e confere no selo precisaria mudar junto. Fotografe um professor com convite vencido ou revogado para ver como a linha quebra.
2. **Vínculos que passaram do teto.** `Professores.tsx:200`. A tela ignora `vinculos.data.completa`. Se os vínculos passarem do teto de páginas (1.000), um professor pode aparecer com "—" em Turmas e Disciplinas sem aviso, o que afirma "sem turma" sobre algo que a tela não leu. O `Painel` e o `ProfessoresDaTurma` já tratam `completa: false`. Mostrar o aviso, ou "—" só quando a leitura estava completa.
3. **Abas a 360 px.** "Material" cai para a segunda linha da barra de abas na foto do celular. Nada fica escondido, mas uma barra que rola ou rótulos mais curtos ficariam melhores. A barra é de `Estrutura.tsx` e vem de tarefas anteriores.
4. **Painel pelado.** Hoje o painel mostra só a situação. As disciplinas, as turmas e "Acrescentar turma" são da tarefa 7.0 (fora do escopo desta), então o painel parece vazio até lá.

Arquivos de referência:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Professores.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/PainelDoProfessor.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/convite-de-professor.ts`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-17 03:10:10 · `tasks/prd-telas-da-coordenacao/6_task.md`

**VEREDITO: REPROVADO**

**Escopo:** incompleto. A tarefa mudou como se chega a "Refazer" e "Revogar" e deixou quebrado um e2e de outra tela que dá esse caminho.

**Aderência à Tech Spec:** ok. As cinco divergências estão na `techspec.md` §9, linha "Professores", no parágrafo "Como ficou na 6.0". A pasta não tem `cenarios.md`.

**Portão local:** carimbo válido. Ele cobre typecheck, lint, segredo, dependências, unidade e os testes alterados.

**Bloqueantes:**

- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/sino-da-coordenacao.spec.ts:86-87`: este teste vai falhar na esteira com o código desta tarefa.
  - **O que acontece:** o teste segue o item do sino até `/coordenacao/professores?professor=<id>` e procura um `listitem` com o nome do professor e o botão "Refazer o convite de <nome>". Esse botão era da lista antiga e saiu (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Professores.tsx:67-88`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/PainelDoProfessor.tsx:337-353`).
  - **O painel piora o caso:** com o endereço, o painel do professor já abre como `dialog` modal e a página atrás fica inerte. Por isso `noDialogo = page.getByRole('dialog')` na linha 87 passa a achar dois diálogos, o painel e o de refazer, e o Playwright recusa a ação por ambiguidade.
  - **Por que o portão não pegou:** ele roda só os e2e que a árvore alterou, e este não foi alterado.
  - **O que a regra pede:** a Tech Spec §11 ("os specs que atravessam telas põem em fila as tarefas que mudam o passo deles") e a seção "Como testar" da tarefa pedem que o passo seja ajustado aqui.
  - **Correção exigida:**
    1. Na linha 86, tocar "Refazer convite" dentro de `page.getByRole('dialog', { name: professor.nome })`, que é o painel já aberto pelo endereço.
    2. Na linha 87 e seguintes, apontar `noDialogo` para o diálogo de cima, como fez `e2e/professores.spec.ts` (`dialog[open]:not([data-painel-lado])`).
    3. Rodar o portão da tarefa de novo, agora com esse spec alterado.

**Recomendações:**

- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/professores-da-escola.ts:412`: `professoresDaTabela` recebe a `ListaDaEstrutura` e ignora `completa`. Se `consultaVinculos` bater no teto de páginas, o professor cujos vínculos ficaram de fora mostra "—" sem aviso nenhum. É justamente o "não afirmar o que não leu" que a divergência 1 promete, e que as Turmas tratam com `VinculosLidos.completa`. Quando os vínculos vierem truncados, convém mostrar o mesmo `Aviso`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Professores.tsx:63`: o comentário fala em "o link do nome do professor", mas o elemento é um `<button>`.
- Os "Arquivos previstos" da `6_task.md` dão `e2e/escola-montada.spec.ts` e `e2e/roteiro-da-demonstracao.spec.ts` como alterados, e eles não mudaram. O passo "Cadastrar professor" segue igual, então está certo não mexer neles, mas falta uma linha na tarefa dizendo isso.
- As fotos da escola "vazia" mostram um professor ("1 professor"), então o vazio "Nenhum professor ainda" não aparece em nenhuma foto. Ele está coberto só pelo teste de componente e pelo e2e W4.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-17 03:10:20 · `tasks/prd-telas-da-coordenacao/6_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: a tabela pelo nome com Nome, Disciplinas, Turmas e Situação, a contagem e "Cadastrar professor" como o único botão cheio. A linha abre o painel em `?professor=<id>`, e o painel só tem as ações que o estado permite.
- Os quatro estados da tela: carregando, erro com "Tentar de novo", vazio com "Cadastrar professor", e com dado.
- Professor com duas disciplinas na mesma turma; vínculo encerrado; vínculo contestado; professor sem vínculo; vínculo sem disciplina.
- Virada de ano: escola sem ano em curso, em que os vínculos nem são pedidos.
- A leitura de anos ou de vínculos falha e a tabela continua de pé.
- Permissão e isolamento: o `?professor=` de outra escola, inventado, vazio ou em outro parâmetro não abre nada; o id de A na sessão de B não abre nada.
- Nenhum e-mail na tabela nem no painel, e o painel não pede nada à API.
- O token do convite não fica guardado no painel.
- O foco ao fechar o painel, aberto pela linha ou pelo endereço, e depois de revogar ou refazer.
- Clique duplo em refazer e em revogar: um pedido só.
- A sessão que vence com o link na tela.
- 360 px e teclado.
- O sino e a lista da turma, que levam ao painel.

**Cobertos:** todos acima, menos o sino, que é o bloqueante 1. A unidade (`professores-da-escola.test.ts`) cobre as duas disciplinas na mesma turma, o encerrado, o contestado, o vínculo sem disciplina, os vínculos não lidos, a ordem 7 antes de 10 e o id que a lista não tem. O componente (`Professores.test.tsx`) cobre:
- os quatro estados;
- o selo de cada estado;
- sem ano em curso, e as falhas de anos e de vínculos;
- sem e-mail, com só três caminhos pedidos à API;
- o painel pelo endereço e o histórico;
- o foco nos três casos;
- o anúncio de um professor só;
- o CONFLITO no refazer.

O e2e cobre os oito casos de antes, agora pelo painel, e mais:
- o clique no canto da linha;
- o id de outra escola;
- o `?professor=` de A na sessão de B;
- o painel sem o token.

Rodei `npx vitest run` nos seis arquivos de unidade e componente: 74 testes verdes. Não há `.skip`, teste comentado nem mock de peça nossa: a rede é falsa e o resto é a tela de verdade. Não há IA na tarefa.

**Bloqueantes:**

1. **`e2e/sino-da-coordenacao.spec.ts:86` vai ficar vermelho na esteira.** O teste procura `page.getByRole('listitem').filter({ hasText: professor.nome })` com o botão "Refazer o convite de ${professor.nome}". A tarefa tirou esse botão da linha: agora o `?professor=` abre o painel modal, com "Refazer convite". O arquivo não está no diff, e o portão da tarefa só roda os e2e que a árvore alterou, então ninguém vê antes do commit.
   - **Correção:** depois da linha 81, conferir que o item do sino abre o painel daquele professor (`getByRole('dialog', { name: professor.nome })` visível). É exatamente o que a 9.0 prometia ("o painel é o da 6.0") e hoje ninguém prova. Depois, acionar "Refazer convite" dentro desse painel.
   - Conferir também `e2e/lista-da-turma.spec.ts:645-648`: o `goBack` agora sai com o painel aberto.

2. **`apps/web/src/areas/coordenacao/Professores.tsx:158`: cláusula nova sem bloco de mutação.** É o `{ replace: true }` de `fecharPainel`: fechar troca o endereço sem passo novo no histórico, e assim o Voltar não reabre o painel. A regra está escrita no comentário da tela e no título do e2e, mas a seção "Mutações" não tem bloco para ela. O teste que a pegaria já existe (`Professores.test.tsx:330`, `history` igual a `['/professores', '/professores']`).
   - **Correção:** acrescentar o bloco abaixo, apontando para o caso "a linha abre o painel no endereço…".
     ```
     - const fecharPainel = (): void => navegar(enderecoComParametro(caminho, busca, PARAMETRO_DO_PROFESSOR, undefined), { replace: true })
     + const fecharPainel = (): void => navegar(enderecoComParametro(caminho, busca, PARAMETRO_DO_PROFESSOR, undefined))
     ```

**Recomendações:**
- **E-mail no teste de componente:** `Professores.test.tsx:230` confere que não há `@` na tela, mas a rede falsa nunca devolve e-mail, então essa parte não pega nada. Quem prova de fato é a lista de caminhos pedidos, mais o e2e. Melhor pôr um `email` no professor falso, se o esquema deixar passar, ou tirar essa linha.
- **Homônimos:** falta um caso com dois professores de mesmo nome em que cada linha abre o painel do seu `usuarioId`. É o caso de borda "dois com o mesmo nome", agora na tabela e no painel.
- **Vínculos incompletos:** quando os vínculos passam do teto de páginas (`completa: false`), a tabela mostra turmas pela metade ou "—" sem aviso. A 5.0 tratou isso nas Turmas. Vale um aviso e um teste, ou registrar a decisão de não tratar.
- **Voltar no e2e:** o título do e2e "o painel do professor" (`e2e/professores.spec.ts:1096`) promete "o Voltar não o reabre", mas o teste não aperta `goBack`. Acrescentar a asserção ou ajustar o título.
- **`focoDeReserva` do refazer:** o refazer (`Professores.tsx:270`) também usa `focarNoPainel`. O caso CONFLITO já o pegaria; um bloco próprio deixaria isso declarado.
- **Clique duplo no nome da linha:** pode empilhar dois passos iguais no histórico, e aí o Voltar reabre o painel. É de baixo risco; fica como cobertura extra.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/sino-da-coordenacao.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Professores.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Professores.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/6_task.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-17 10:06:36 · `tasks/prd-telas-da-coordenacao/6_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A nova linha de divergência em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/6_task.md` cobre os dois e2e previstos que não mudaram e o do sino, que mudou sem estar previsto. Ela aponta para a §11 e a §9 da `techspec.md`, que já registram esse comportamento.

Portão local: carimbo válido. A mensagem do `conferir` foi "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)". O `portao.json` mostra que `e2e/sino-da-coordenacao.spec.ts` rodou e que as mutações foram executadas.

Bloqueantes: nenhum.

A correção exigida na 1ª rodada foi feita, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/sino-da-coordenacao.spec.ts`:
1. **Linhas 89-91:** o teste espera o painel aberto pelo endereço e toca "Refazer convite" dentro de `painelDe(page, professor.nome)`.
2. **Linha 17:** `noDialogo` passou a ser `dialog[open]:not([data-painel-lado])`. É o mesmo critério do `e2e/professores.spec.ts`, e o atributo existe em `apps/web/src/componentes/PainelLado.tsx:49`.
3. **Fechamento do painel:** o painel agora fecha antes de o teste conferir o sino, que antes ficava inerte atrás do modal.
4. **Portão:** rodou de novo com esse spec incluído.

As recomendações que a Mesa mandou aplicar também foram feitas:
- O comentário "link" virou "botão" em `Professores.tsx`.
- A tarefa ganhou a linha sobre os e2e previstos que não mudaram.
- Foi pedido o caso dos homônimos: a linha abre o painel pelo `usuarioId`, e o endereço decide qual painel abre.
- No caso "sem e-mail", o teste não depende mais de procurar `@` no texto. Ele confere a lista das rotas pedidas.
- O `goBack` no e2e confirma que voltar não reabre o painel.
- Entraram dois blocos de mutação, um para o `replace` e outro para o `focoDeReserva`. O segundo usa as linhas vizinhas para indicar qual das duas ocorrências mudar, e o portão aceitou.

Recomendações:
- No caso dos homônimos em `Professores.test.tsx`, o id sai de `localizacao.history?.at(-1) ?? ''`. Se o histórico vier vazio, as chaves viram `''` e o teste falha sem dizer por quê. Uma asserção de que o endereço contém `professor=` antes de ler o id deixaria a falha clara. Não bloqueia.

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 10:07:06 · `tasks/prd-telas-da-coordenacao/6_task.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2: confiro as correções exigidas, as recomendações que a Mesa mandou aplicar e o que o diff afeta):
- O sino leva ao painel do professor vencido, o "Refazer convite" é feito dentro dele, o item some do sino e a lista fica "Tudo em dia".
- `fecharPainel` com `{ replace: true }` tem bloco de mutação, e o teste citado falha sem ele.
- O `focoDeReserva` do refazer tem bloco de mutação, e o teste citado falha sem ele.
- Dois professores com o mesmo nome: cada um abre o seu painel, pelo `usuarioId`.
- "Sem e-mail": o teste prova algo, em vez de procurar um `@` que os dados falsos nunca têm.
- O Voltar não reabre o painel no e2e.
- A corrida do `goBack` em `e2e/lista-da-turma.spec.ts:645-648`.

Cobertos:
- **Correção 1 (sino) foi feita.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/sino-da-coordenacao.spec.ts:89-100`:
  - O teste confere que o painel `getByRole('dialog', { name: professor.nome })` está visível. Aciona "Refazer convite" dentro dele, com `exact: true`, e o diálogo de cima é achado por `dialog[open]:not([data-painel-lado])`.
  - O atributo existe em `apps/web/src/componentes/PainelLado.tsx:49`, e o mesmo seletor já é usado em outros e2e.
  - O painel é fechado antes da conferência do nome acessível do sino, o que evita ler o sino ainda inerte por trás do modal.
- **`lista-da-turma.spec.ts:645-648` não precisa mudar.** O link empurra `?professor=<id>` e o painel abre sem navegar de novo. O `goBack` volta à turma e o painel some junto com a tela de Professores. O título "Turma …" visível prova a volta.
- **Correção 2 (`replace`) foi feita.** O bloco está em `6_task.md`, e o teste "a linha abre o painel no endereço…" (`Professores.test.tsx:331`) exige o histórico `['/professores', '/professores']`. Sem o `replace`, entra um terceiro passo e o teste fica vermelho pela cláusula certa.
- **Bloco do `focoDeReserva` está certo.** As linhas de contexto (`link`/`aoFechar`) só batem com `Professores.tsx:268-270`, que é o diálogo do refazer. O caso CONFLITO afirma o foco no título "Situação do convite" (`Professores.test.tsx:560`). Com `focarNaLista`, essa asserção cai.
- **Homônimos estão cobertos** (`Professores.test.tsx:368-400`):
  - Se a tela escolhesse o painel pelo nome, os dois painéis mostrariam a mesma situação, e as asserções de pendente e ativo, com e sem "Refazer convite", falhariam.
  - A segunda metade, pelo endereço, prova que é o id que escolhe: a busca pelo nome acharia o pendente.
- **"Sem e-mail" agora prova algo.** A asserção restante (só três rotas pedidas) se apoia no contrato `esquemaProfessorDaEscola`, que é `z.strictObject` (`packages/shared/src/professores/professores.ts:98`). O comentário do teste diz a verdade.
- **O Voltar no e2e (`e2e/professores.spec.ts:1106-1109`) é determinístico.** O `goBack` de navegação na mesma página só resolve com a URL já trocada, e o `not.toContain('professor=')` carrega a prova. Sem o `replace`, o Voltar cairia em `?professor=<id>`.
- **Recomendações sem aplicar:** todas têm destino. As que vão para o `TODO.md` estão lá, e as recusas têm motivo.

Bloqueantes: nenhum.

Recomendações:
- `e2e/lista-da-turma.spec.ts:646`: conferir também que o painel daquele professor abre (`getByRole('dialog', { name: camila.nome })` visível) antes do `goBack`, já que o link da turma passou a levar ao painel.
- `e2e/professores.spec.ts:1108`: o `toHaveCount(0)` logo depois do `goBack` pode passar antes de um painel reabrir. A prova está na URL, e uma espera curta pelo título da lista deixaria a intenção mais clara.
- O clique duplo no nome da linha, que pode empilhar dois passos no histórico, segue no `TODO.md`. É cobertura extra, de risco baixo.

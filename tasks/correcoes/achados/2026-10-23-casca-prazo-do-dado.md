# Achados das revisões — `tasks/correcoes/2026-10-23-casca-prazo-do-dado.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-23 09:17:59 · `tasks/correcoes/2026-10-23-casca-prazo-do-dado.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: `/sistema` no computador e no celular, escola cheia e vazia)
Estados: ok. Com dado e vazio aparecem nas fotos. Carregando e erro não foram conferidos aqui: a tarefa não toca `apps/web`, e o e2e `casca.spec.ts` já cobre os dois.
Acessibilidade: sem mudança. O diff é só um spec de e2e. A foto mostra contraste legível e rótulos em português. A espera do dado continua pelo papel e pelo texto (`getByRole('listitem')` com "Disponível").
Chromebook fraco: o caso "com dado" continua rodando com CPU ×4 e rede móvel lenta, no mesmo prazo de 5 s (`PRAZO_DO_DADO_MS`). A correção troca só o relógio. Antes ele contava o degrau da espera do Playwright, que é de até 100, 250, 500 e 1000 ms. Agora conta o instante em que o dado aparece na página, medido por `MutationObserver` instalado antes do `goto` (`e2e/casca.spec.ts:52-73`). O caso novo (`:114-129`) trava o relógio: segura a resposta por 1,45 s e exige a pintura a no máximo 250 ms da entrega.
Celular: nas fotos de 360 px não há rolagem horizontal nem texto cortado. Nenhuma tela rola a 1366 × 768. O botão "Verificar de novo" está em torno de 44 px de altura, em largura total do bloco, e não depende de hover. Esse alvo de toque continua coberto por `esperarAlvoDeToque` no spec.
Ação oficial protegida: não se aplica. A tela é só de leitura, sem ação oficial.
Bloqueantes: nenhum. Conferi o código contra a foto e não há divergência. As fotos mostram a casca atual, e a tarefa não altera `apps/web`.
Recomendações:
- `e2e/casca.spec.ts:56-60`: o observador casa "API" e "Banco de dados" por `includes` em qualquer `<li>` da página. Se um dia outro item da página tiver "API" no texto, o instante pode sair cedo demais. A prova do dado continua em `esperarEstadoComDado`, então hoje não há risco.
- `:129`: o limite de 250 ms para a pintura tem folga grande sobre os ~12 ms medidos, mas pode oscilar com a CPU ×4 em esteira lenta. Se o caso novo ficar intermitente, suba o limite antes de suspeitar do produto.
- A margem real do dado (~4,1 s contra 5 s) é do perfil fraco. Se a esteira voltar a passar de 5 s com o instante da página, a investigação deve ir para o peso da primeira carga, como a própria tarefa registra.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-23-casca-prazo-do-dado/e2e/casca.spec.ts` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-23-casca-prazo-do-dado/tasks/correcoes/2026-10-23-casca-prazo-do-dado.md`.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 09:18:47 · `tasks/correcoes/2026-10-23-casca-prazo-do-dado.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz.** O caso "com dado" mede o instante em que o dado aparece na página, contra os mesmos 5 s, com o mesmo perfil (CPU ×4 e rede lenta) e a API real.
- **Borda 1.** O dado chega logo depois de um degrau da espera do Playwright. O instante medido precisa ficar perto da entrega, e não no degrau seguinte.
- **Borda 2.** O vigia não pode gravar um instante antes de o dado existir. Se gravasse, o prazo passaria por engano.
- **Borda 3.** O vigia não chega a gravar nada, porque foi instalado depois do `goto`.
- **O prazo continua valendo.** Um produto mais lento que o prazo ainda deixa o caso vermelho.
- **Permissão, isolamento e concorrência:** não se aplicam. A `/sistema` mostra o estado do sistema, sem dado de escola nem de pessoa, e a correção não toca nada que rode duas vezes ao mesmo tempo.

**Cobertos:**
- **Caminho feliz:** "com dado: versão e componentes vindos da API real, em até 5 s…", em `e2e/casca.spec.ts:93-99`.
- **Borda 1:** "o prazo do dado conta quando o dado aparece na tela, não quando o teste o percebe", em `e2e/casca.spec.ts:114-129`. A asserção `pintura <= PINTURA_DO_DADO_MS` fica vermelha com o relógio de quando o teste percebe o dado: é a mutação 1, provada pelo portão.
- **Borda 2:** o mesmo caso novo. `pintura >= 0` fica vermelho se o vigia disparar antes de a resposta ser entregue.
- **Borda 3:** `expect(instante).toBeDefined()`, em `e2e/casca.spec.ts:72`.
- **O prazo continua valendo:** mutação 2 (5000 → 3000). Ela fica vermelha pelo motivo certo. A espera em `esperarEstadoComDado` começa depois do `goto`, e o dado aparece ~0,6 s depois disso, bem dentro do novo limite de 3 s. Por isso o caso chega à asserção `decorrido <= PRAZO_DO_DADO_MS` e cai nela, e não por estourar o tempo da espera.

Conferi a seção "Mutações" contra o `git diff`. As duas cláusulas novas têm bloco: o relógio em `instanteDoDado` e o prazo. O nome de teste citado em cada bloco é idêntico ao do arquivo.

Não há `.skip`, teste comentado nem mock que esconda a regra. A `page.route` do caso novo só controla quando a resposta é entregue, e o que se mede é o vigia da página. Não há provedor de IA envolvido.

Os dois relógios são comparáveis: `Date.now()` do Node e o do navegador leem o mesmo relógio, porque rodam no mesmo host, aqui e na esteira.

O limite de 250 ms do caso novo tem folga de ~20 vezes sobre os ~12 ms medidos. Não depende de a máquina estar folgada.

Não rodei os testes e2e. O portão já provou as duas mutações, e um e2e meu, rodando ao mesmo tempo que os outros revisores sobre a mesma árvore, poderia disputar servidor e porta com eles.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Restringir o vigia à seção Componentes.** Em `e2e/casca.spec.ts:62`, `disponivel()` varre todo `li` do documento. Se um dia aparecer outro `li` que diga "API" e "Disponível", por exemplo um aviso real, o vigia grava cedo demais e o caso "com dado" passa por engano. O caso novo só pega isso com os avisos vazios da configuração.
2. **Proteger o caso "com dado" contra a volta do relógio antigo.** A mutação 1 só deixa vermelho o caso novo. Se alguém reescrever o caso "com dado" como `Date.now() - inicio` direto, sem chamar `instanteDoDado`, nenhum teste quebra. Um comentário na linha 98 apontando o caso novo ajuda a evitar isso.
3. **Registrar no `TODO.md` a margem real do dado.** O próprio documento diz que ela é ~4,1 s contra 5 s na máquina. Na esteira, que leva perto do dobro, a medida honesta pode encostar no limite. Se voltar a cair, a investigação vai para o peso da primeira carga (~1,5 s de banda para ~170 KB de script e estilo), e não para este caso.

Nas fotos da `/sistema` (computador e celular, escola cheia e vazia), o dado aparece nas duas linhas e não há rolagem horizontal. A correção não muda a tela.

**Arquivos:**
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-23-casca-prazo-do-dado/e2e/casca.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-23-casca-prazo-do-dado/tasks/correcoes/2026-10-23-casca-prazo-do-dado.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 09:27:52 · `tasks/correcoes/2026-10-23-casca-prazo-do-dado.md`

**VEREDITO: APROVADO**

**Cenários exigidos (correção de um teste de e2e, sem regra de negócio nem dado de escola):**
- **Caminho feliz:** o dado aparece na tela em até 5 s, com CPU ×4 e rede móvel lenta, medido pelo instante em que ele aparece na página.
- **Borda 1:** o dado chega logo depois de um degrau da espera do Playwright. O relógio não pode contar esse degrau.
- **Borda 2 (nova nesta rodada):** outro item da página diz "API" e "Disponível" antes de o estado chegar. O vigia não pode gravar o instante desse item.
- **Prazo continua valendo:** se o prazo ficar menor do que o produto leva, o caso "com dado" fica vermelho.
- **Permissão e isolamento:** não se aplicam. É a tela pública `/sistema`, sem dado de escola nem de pessoa.

**Cobertos:**
- **Caminho feliz:** "com dado: versão e componentes vindos da API real, em até 5 s…" (`e2e/casca.spec.ts:78`), com a API real e o `inicio` antes do `goto`. O comentário novo nas linhas 83-84 explica por que não se volta a medir com `Date.now()`.
- **Borda 1:** "o prazo do dado conta quando o dado aparece na tela, não quando o teste o percebe" (`e2e/casca.spec.ts:101`). Ele exige que a distância entre a entrega do estado e o instante medido fique entre 0 e `PINTURA_DO_DADO_MS`. A mutação 1 (`return Date.now()`) cai nesse caso.
- **Borda 2:** o mesmo caso agora serve dois avisos com "API Disponível" e "Banco de dados Disponível" (`e2e/casca.spec.ts:110-120`). Conferi em `apps/web/src/paginas/Casca.tsx:75` que o aviso aparece como `<li>`, na seção "Avisos", e chega antes do estado, que está segurado por 1,45 s.
  - Com a mutação 3 (o vigia olhando a página inteira), o instante gravado fica antes de `liberadoEm`. A asserção `pintura >= 0` (linha 126) fica vermelha, e pelo motivo certo: o cenário chega à cláusula.
  - Sem a mutação, o vigia em `e2e/__fixtures__/dado-na-tela.ts:19-22` se limita à `section[aria-labelledby]` cujo título é "Componentes" (`Casca.tsx:37-38,135`). É a mesma seção que `esperarEstadoComDado` usa.
- **Prazo:** mutação 2 (`PRAZO_DO_DADO_MS = 3_000`) contra o caso "com dado".
- **Mutações contra o diff:** a cláusula nova (o filtro pela seção em `dado-na-tela.ts:22`) tem bloco próprio, a mutação 3. Mover `vigiarODado` e `instanteGravado` para a fixture é só refatoração, e a leitura do instante continua coberta pela mutação 1. Não há cláusula nova sem bloco.
- **Outras verificações:**
  - Não há `.skip`, teste comentado nem mock que esconda a regra. A rota falsa do estado é o próprio instrumento do caso novo, e o caso "com dado" usa a API real.
  - Não há teste de IA nem operação concorrente.
  - Não rodei o e2e: ele precisa da pilha no ar, e a regra manda não pôr a máquina sob carga. As três mutações foram provadas pelo portão da tarefa, e o diff não toca `apps/web`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `e2e/__fixtures__/dado-na-tela.ts:20` reconhece a seção pelo texto do título exatamente igual a `'Componentes'`. Se o `<h2>` ganhar um ícone com texto ou um contador, o vigia deixa de achar a seção. O caso então falha com a mensagem "a página vigiada não gravou…", que culpa a ordem do `goto`, e não a seção. Opções:
   - reconhecer pelo `id` do título (`titulo-componentes`);
   - ou citar o motivo possível na mensagem do `expect` em `e2e/casca.spec.ts:57`.
2. A busca pela seção existe duas vezes, uma no navegador (`dado-na-tela.ts`) e outra no Playwright (`secaoComponentes`, `casca.spec.ts:43`). Isso é inevitável, porque o vigia roda dentro da página. Uma linha no JSDoc de `vigiarODado` dizendo que as duas precisam continuar iguais evita que uma mude sem a outra.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-23-casca-prazo-do-dado/e2e/casca.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-23-casca-prazo-do-dado/e2e/__fixtures__/dado-na-tela.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-23-casca-prazo-do-dado/tasks/correcoes/2026-10-23-casca-prazo-do-dado.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-23-casca-prazo-do-dado/apps/web/src/paginas/Casca.tsx` (só leitura, para conferir o cenário)

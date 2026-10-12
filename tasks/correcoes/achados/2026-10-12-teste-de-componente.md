# Achados das revisões — `tasks/correcoes/2026-10-12-teste-de-componente.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-12 11:09:47 · `tasks/correcoes/2026-10-12-teste-de-componente.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção sem Tech Spec. Ela fez o que o documento pede e nada além: o modelo de tarefa em `.claude/` não foi tocado, nenhum arquivo de produção mudou, e o `package-lock.json` só ganhou linhas, sem trocar versão de pacote que já existia.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

Recomendações:
1. **Versão do Node.** O `package.json` da raiz declara `"node": ">=22.18.0 <23"`, mas o `jsdom` 30.1.1 pede `^22.22.2`. A esteira e o `.nvmrc` (22.23.2) passam. Só que quem tiver Node de 22.18 a 22.22.1 cumpre o `engines` e quebra no teste de componente. Subir o piso do `engines` para 22.22.2 fica para uma próxima mão, porque esta correção declarou a raiz fora do escopo.
2. **Espera fixa de 50 ms.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx:67`, o caso espera 50 ms para afirmar que nenhuma chamada saiu. A mutação `enabled: true` mostra que hoje o caso cai, mas o número é arbitrário. Melhor esperar algo determinístico, como `await waitFor(...)` sobre o estado assentado, ou um `queryClient.isFetching() === 0`.
3. **Teste preso à estrutura da tela.** Em `ListaDePedidos.test.tsx:133`, o caso procura o "Tentar de novo" pelo `alerta.parentElement`. Se a marcação mudar, ele quebra mesmo com o comportamento igual. Buscar o botão por papel na tela inteira, como a linha 138 já faz, prova a mesma coisa.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/tasks/correcoes/2026-10-12-teste-de-componente.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/vitest.config.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/package.json`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/src/__fixtures__/tela.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/TODO.md`

## test-engineer · 1ª rodada · APROVADO · 2026-10-12 11:09:59 · `tasks/correcoes/2026-10-12-teste-de-componente.md`

**VEREDITO: APROVADO**

Rodei `npx vitest run --project unidade apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`: 5 de 5 passam, em cerca de 1 s.

**Cenários exigidos.** A correção cria a capacidade de testar um componente e não altera regra de produção. Para esse tipo de mudança, o teste precisa provar:
- os quatro estados da regra 50, item 5: carregando, vazio, erro e com dado;
- o rótulo da decisão com a contagem certa, sem "aprovar todos" (RF12, D4);
- o que muda de um papel para o outro: o professor lê ao abrir, e a coordenação só lê no clique, com a finalidade e o aviso de auditoria;
- que a sessão vai nas chamadas;
- que nenhum caso herda a tela do caso anterior;
- que o `.test.tsx` é encontrado pelo projeto `unidade`.

Não se aplicam aqui:
- **Isolamento:** a correção não toca repositório, endpoint nem dado de escola.
- **Permissão no servidor:** nada no backend muda.
- **Concorrência:** a correção não traz operação nova que possa rodar duas vezes. O clique duplo em aprovar vive no `DialogoDeDecisao`, que continua no e2e.

**Cobertos.**
- **Carregando, depois com dado, para o professor (caso 1):** a chamada sai com `Bearer token-de-teste`, sem finalidade. Aparece o texto da atualização sozinha, e não aparecem nem o texto de auditoria nem o botão "Atualizar".
- **Coordenação (caso 2):** nenhuma chamada na montagem, o aviso de auditoria, e só o clique lê, com `finalidade=conferencia_de_cadastro`.
- **Rótulo da decisão (caso 3):** nenhum botão antes de marcar; depois "Aprovar 1 pedido" e "Aprovar 2 pedidos", nunca "todos". A marca da matrícula errada aparece só no Bruno, entre três pedidos.
- **Vazio (caso 4):** a ação do vazio é chamada uma vez, e nenhuma caixa de marcar aparece.
- **Erro antes de haver lista (caso 5):** o erro e o "Tentar de novo" aparecem, sem afirmar o vazio, e o novo clique lê de novo.

**Mutações conferidas contra o `git diff`.**
- Os 12 blocos cobrem toda cláusula nova do diff:
  - o `include` do `vitest.config.ts`;
  - `abrirSessaoPeloCookie()` e `cleanup()` em `apps/web/src/__fixtures__/tela.tsx`;
  - nove cláusulas da peça.
- Cada bloco aponta para um caso que chega à cláusula. Por exemplo, sem `abrirSessaoPeloCookie()` o token fica `undefined` e a comparação de `rede.chamadas` no caso 1 falha (`apps/web/src/api/sessao.ts:493-495`).
- `tools/processo/mutacoes.ts:134` já manda `.test.tsx` para o projeto `unidade`, então as mutações alcançam o arquivo.
- Nenhum `.test.tsx` antigo passa a ser encontrado sem querer: `git ls-files "*.test.tsx"` volta vazio, e `mockups/**` continua em `ignorados`.

**Dublês e proibições.** O único dublê é o `fetch` global. A peça, `criarClienteDeConsultas` e o módulo `api/sessao` são os de produção, como pede a regra 40. Não há `.skip`, teste comentado, `any` nem provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações** (nenhuma bloqueia; ficam para o `/validar` e o `/retro`):
1. **Dois alunos com o mesmo nome** na lista não têm caso. A marcação é por id (`ListaDePedidos.tsx:127`), e um caso com dois "Ana sintética" provaria que marcar um não marca o outro e que o rótulo diz "Aprovar 1 pedido".
2. **Releitura que falha com a lista já na tela** não tem caso: o erro sobre a lista (`ListaDePedidos.tsx:123`) e o erro sobre a lista vazia, que não pode afirmar o vazio (`ListaDePedidos.tsx:118`). Isso é condição de tela e cabe aqui em segundos.
3. **Limite de 40 marcados** não tem caso: o texto do limite e a caixa desligada com `aria-describedby` (`ListaDePedidos.tsx:128,153-157`). Também falta "há mais pedidos" (`ListaDePedidos.tsx:152`) e o anúncio dos pedidos novos na região viva (`ListaDePedidos.tsx:194-196`).
4. **Espera de 50 ms com relógio real** em `ListaDePedidos.test.tsx:67`. Não deixa o teste instável, porque com `enabled: false` a leitura nunca sai, mas é uma espera fixa. O comentário já explica o motivo; um auxiliar que esvazie as tarefas pendentes deixaria isso explícito no `__fixtures__/tela.tsx`.
5. **`within(alerta.parentElement)`** em `ListaDePedidos.test.tsx:133` depende de o botão ser irmão do `role="alert"` no `EstadoErro`. Procurar pelo botão no documento inteiro, como a linha 138 já faz, tira essa dependência.
6. **`DialogoDeDecisao`:** o texto da correção diz que ele fica no e2e por ser um `<dialog>`. Quando a linha "estados da tela" do modelo de tarefa mudar, vale testar se o `jsdom` 30 já cobre `showModal`, antes de deixar tudo do diálogo para o Playwright.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/tasks/correcoes/2026-10-12-teste-de-componente.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/src/__fixtures__/tela.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/vitest.config.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/package.json

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-12 11:10:16 · `tasks/correcoes/2026-10-12-teste-de-componente.md`

VEREDITO: APROVADO

Tela vista: não. A correção não toca nenhum arquivo de produção de `apps/web` nem spec de e2e, e o prompt traz `Fotos da tela: não há`. Revisei pelo código e rodei o teste novo: `npx vitest run --project unidade apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` passa 5 de 5 em cerca de 1 s. O `tsc` do `@educa/web`, o ESLint nos arquivos novos e `tools/guardas/lint.ts` saem limpos.

Estados: ok. O teste novo prova os quatro estados da `ListaDePedidos` (`apps/web/src/componentes/pedidos/ListaDePedidos.tsx`), que é a mesma peça para professor e coordenação:
- **Carregando:** a lista do professor é lida ao abrir e mostra "Carregando os pedidos…" antes dos dados.
- **Com dado:** o rótulo diz "Aprovar 1 pedido" e "Aprovar 2 pedidos", não existe botão "todos", e a marca de matrícula errada fica só no pedido que a teve.
- **Vazio:** mostra o texto que a tela deu, com o próximo passo acionável, e nenhuma decisão.
- **Erro:** mostra o alerta com "Tentar de novo", não afirma que não há pedidos, e o novo clique lê a lista.

Acessibilidade: ok. As consultas do teste são por papel e por nome acessível (`getByRole('checkbox'|'button'|'alert', { name })`), então o teste só passa se o rótulo existir para leitor de tela. O `jsdom` não mede foco visível nem contraste, e a correção o declara.

Chromebook fraco: ok. O `jsdom` fica só no arquivo `.test.tsx`, pela linha `// @vitest-environment jsdom`, então a unidade da API, do worker e dos pacotes continua no Node. As dependências são `devDependencies` do `@educa/web` e nenhuma importação de produção as alcança, então o bundle da web não muda.

Celular: não se aplica. A correção não toca tela, e o `jsdom` não faz layout. A correção diz isso por escrito e deixa "texto cortado", "celular espremido" e o alvo de toque com a vitrine e o e2e (`TODO.md`).

Ação oficial protegida: sim, e nada mudou nela. O diálogo de decisão, a gravação e o foco depois do fechamento continuam cobertos pelo e2e, e a correção declara que o teste de componente não os substitui. O teste novo ainda trava uma proteção: não existe botão de decisão antes de marcar nem "todos", e o rótulo carrega a contagem do que será decidido.

Bloqueantes: nenhum.

Recomendações:
1. `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx:~99`: o caso do erro acha o botão por `alerta.parentElement`, o que acopla o teste à estrutura do DOM do `EstadoErro`. Quando `EstadoErro` expuser região ou grupo com nome, trocar por consulta de papel.
2. `ListaDePedidos.test.tsx:~65`: `await new Promise(setTimeout 50)` prova "nada foi lido ao abrir" por tempo. Funciona e é barato (a mutação `enabled: true` o derruba), mas o tempo fixo é frágil em máquina lenta. Uma espera por `waitFor` sobre o fetch contado seria mais firme.
3. A tabela de mutações é boa e cobre cada cláusula citada, inclusive a do `include` do `vitest.config.ts`. Quando a linha "estados da tela" do `task-template.md` passar a pedir teste de componente (feito por outra mão, como diz o `TODO.md`), vale exigir que ele cite o `__fixtures__/tela.tsx` para não nascer um segundo auxiliar.

Arquivos revisados (caminhos absolutos):
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/src/__fixtures__/tela.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/vitest.config.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-10-12 11:15:03 · `tasks/correcoes/2026-10-12-teste-de-componente.md`

VEREDITO: APROVADO

**Cenários exigidos.** Esta é a 2ª rodada, sobre o diff c138069 → b3e0e01. As duas recomendações minhas que a Mesa mandou aplicar precisavam continuar provando a mesma regra:
- No caso da coordenação, nenhuma leitura sai ao abrir a tela, e só o "Atualizar" lê, com a finalidade.
- No erro antes de haver lista, aparece o "Tentar de novo" e a tela não afirma que não há pedidos.

**Cobertos.** As duas mudanças em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`, uma por linha:

- **Linha 68, espera de 50 ms retirada.** A troca é segura. Com o token válido, `chamarComSessao` (`apps/web/src/api/sessao.ts:485-495`) não espera nada antes de chamar `chamarApi`. A leitura que saísse sozinha começaria no efeito que o `act` do `render` executa, então o `expect(rede.chamadas).toEqual([])` logo depois a pegaria.
  - O caso tem ainda uma segunda proteção, que não depende desse momento. Se a mutação `enabled: true` lesse depois da montagem, a asserção das linhas 76-78 cairia mesmo assim: ela exige exatamente uma chamada, a que leva `finalidade=conferencia_de_cadastro`, e haveria duas.
  - O caso continua vermelho pela cláusula certa e não depende mais de relógio real.
- **Linha 133, busca pelo botão.** O `within(alerta.parentElement)` virou `screen.getByRole('button', { name: 'Tentar de novo' })`. Isso tira a dependência da estrutura do `EstadoErro` sem afrouxar o caso:
  - continua conferindo o alerta, o botão, a ausência do vazio e a do texto anterior à leitura (linhas 132-135);
  - continua conferindo a releitura com duas chamadas (linhas 138-142).
- **Teste rodado.** `npx vitest run --project unidade apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` passa 5 de 5, em 0,9 s.
- **Nada novo de risco.** O diff não traz cláusula de produção nova, `.skip`, teste comentado, mock novo nem provedor de IA. As mutações declaradas não mudaram, e o portão as rodou sobre a árvore atual.
- **O resto do diff está correto:**
  - O `TODO.md` e a tabela "Recomendações sem aplicar" registram, com destino, as recomendações da 1ª rodada que ficaram de fora: os dois alunos com o mesmo nome, a releitura que falha com a lista na tela ou lida e vazia, o limite de 40 marcados, "há mais pedidos", a região viva, o `showModal` e o piso do `engines`.
  - Elas continuam sendo recomendações e não bloqueiam esta correção. Ela só cria a capacidade de testar componente e não altera a peça.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. As da 1ª rodada seguem no documento com destino.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/.processo/ordens/diff-r2.patch`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/tasks/correcoes/2026-10-12-teste-de-componente.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/src/api/sessao.ts`

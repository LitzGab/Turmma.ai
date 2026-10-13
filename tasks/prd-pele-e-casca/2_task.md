# Tarefa 2.0 — A pessoa escolhe a aparência, e ela vale antes de a primeira tela desenhar

**Funcionalidade:** pele-e-casca · **Depende de:** 1.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Quem entrou escolhe Sistema, Claro ou Escuro no menu da própria conta, a escolha fica no navegador e a página já
abre no tema certo, sem piscar. A galeria passa a mostrar cada peça nos dois temas, numa seção por arquivo.

## Contexto necessário

- `techspec.md` seção 5 ("O tema"), seção 7, seção 9 ("Galeria" e as peças `Segmentado` e `Aparencia`) e seção 12
- `prd.md` RF3, RF4 e os casos de borda do Chromebook gerenciado e dos dois alunos no mesmo computador
- `docs/interface.md` 10.2 (`Segmentado`) e 9.5 (movimento)
- `.claude/rules/50-frontend.md`, item 7: nada sensível no navegador. A aparência não leva pessoa nem escola
- Código: `apps/web/index.html`; `apps/web/src/componentes/CascaDaEscola.tsx`, `lerRecolhida` e `guardarRecolhida`
  (o precedente de preferência no `localStorage`, com o `try/catch` e a chave removida no valor padrão);
  `apps/web/src/componentes/MenuDaPessoa.tsx`; `apps/web/src/operacao/componentes/CascaDaOperacao.tsx`;
  `apps/web/src/galeria/Galeria.tsx`; `e2e/pecas.spec.ts`; `apps/web/nome-dos-chunks.ts` (`PECAS_FORA_DA_ENTRADA`)

## Subtarefas

- [x] 2.1 — `apps/web/index.html`: `<meta name="color-scheme" content="light dark">` e um `<script>` em linha no
  `<head>` que lê `localStorage['educa.aparencia']` dentro de `try/catch`, cai no `prefers-color-scheme` e escreve
  `data-tema` no `<html>`
- [x] 2.2 — `apps/web/src/tema.ts`: `resolverTema(escolha, sistemaEscuro)` pura; `lerAparencia`, `escolherAparencia`
  (grava `claro` ou `escuro`; Sistema **apaga** a chave); `aplicarTema`; a escuta do `matchMedia` e do evento
  `storage`; `useAparencia()` por `useSyncExternalStore`. Leitura ou gravação que lança cai em Sistema, calada
- [x] 2.3 — `componentes/Segmentado.tsx`: grupo de rádio (`role="radiogroup"`, setas trocam, uma parada de Tab),
  alvo de 36 px no computador e 44 abaixo de 768. `componentes/Aparencia.tsx`: o `Segmentado` com Sistema, Claro e
  Escuro, e o rótulo "Aparência"
- [x] 2.4 — A `Aparencia` em "Sua conta" do `MenuDaPessoa` (os três papéis) e no cabeçalho da operação. As páginas
  públicas seguem o sistema, sem controle
- [x] 2.5 — A galeria vira `galeria/secoes/<grupo>.tsx`, registradas por `import.meta.glob`, com a `Aparencia` no
  topo; o conteúdo de cada seção é o de hoje, movido. `e2e/pecas.spec.ts` vira um arquivo por grupo
  (`e2e/pecas-<grupo>.spec.ts`), **sem mudar asserção**: só muda de arquivo
- [x] 2.6 — `TODO.md`: o script em linha entra por hash quando o F16 servir política de segurança de conteúdo
- [x] 2.7 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/index.html` | alterado |
| `apps/web/src/tema.ts` | novo |
| `apps/web/src/tema.test.ts` | novo |
| `apps/web/src/main.tsx` | alterado |
| `apps/web/src/componentes/Segmentado.tsx` | novo |
| `apps/web/src/componentes/Segmentado.test.tsx` | novo |
| `apps/web/src/componentes/Aparencia.tsx` | novo |
| `apps/web/src/componentes/Aparencia.test.tsx` | novo |
| `apps/web/src/componentes/MenuDaPessoa.tsx` | alterado |
| `apps/web/src/operacao/componentes/CascaDaOperacao.tsx` | alterado |
| `apps/web/src/galeria/Galeria.tsx` | alterado |
| `apps/web/src/galeria/secoes/` | novo |
| `apps/web/nome-dos-chunks.ts` | **não alterado**: `Segmentado` e `Aparencia` entram na entrada, e a galeria já sai em `galeria-*` (ver Divergências) |
| `e2e/pecas.spec.ts` | removido: dividido em `e2e/pecas-ia`, `pecas-galeria`, `pecas-botoes`, `pecas-sobrepor` e `pecas-superficies` (`.spec.ts`) |
| `e2e/aparencia.spec.ts` | novo |
| `TODO.md` | alterado |
| `apps/web/src/estilos.css` | alterado (`color-scheme: light` no tema claro; ver Divergências) |
| `apps/web/src/componentes/MenuDaPessoa.test.tsx` | novo |
| `apps/web/src/operacao/componentes/CascaDaOperacao.test.tsx` | novo |
| `apps/web/src/galeria/Secao.tsx` | novo |
| `apps/web/src/galeria/dados.ts` | novo |
| `apps/web/src/galeria/Galeria.test.tsx` | novo |
| `e2e/__fixtures__/galeria.ts` | novo |
| `e2e/casca.spec.ts` | alterado (W12: a parada da Aparência no Tab) |
| `docs/interface.md` | alterado (seção 6: o que o navegador guarda) |
| `playwright.config.ts` | alterado (`colorScheme: 'light'`; ver Divergências) |
| `tools/vitrine/foto.ts`, `tools/vitrine/vitrine.ts`, `tools/vitrine/foto.test.ts` | alterado (`--escuro`; ver Divergências) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| `resolverTema` nas seis combinações | unidade | a escolha vence o sistema; sem escolha, vale o sistema |
| o `<script>` do `index.html` | unidade | o teste extrai o script do arquivo e o roda com a mesma tabela de casos de `resolverTema` (`claro`, `escuro`, ausente, valor inválido, leitura que lança, sem `matchMedia`; sistema claro e escuro): o `data-tema` que ele põe é o que `resolverTema` devolve, e ele nunca lança |
| escolher Escuro e recarregar | e2e | o `data-tema` já é `escuro` no primeiro quadro, antes do React (RF3): o teste segura o JavaScript da entrada com `page.route` e lê o atributo e a cor de fundo |
| Sistema com o aparelho mudando | e2e | com `emulateMedia({ colorScheme })` trocado e a página aberta, o tema acompanha; com Claro escolhido, não |
| voltar a Sistema apaga a chave | componente e e2e | depois de Escuro e de Sistema, o `localStorage` volta a `[]` |
| o armazenamento continua vazio sem escolha | e2e | os cinco specs que já exigem `localStorage` vazio depois de entrar continuam verdes, sem mexer neles |
| armazenamento que recusa (lança ao ler e ao gravar) | componente | a `Aparencia` não quebra, mostra Sistema, e a escolha vale até a aba fechar (RF4) |
| duas abas | e2e | trocar numa muda a outra, pelo evento `storage` |
| duas pessoas no mesmo computador (RF24) | e2e (`chromebook` e `celular`) | a pessoa A escolhe Escuro, recolhe a lateral (no `celular`, com `setViewportSize` de 1024 px de largura nesse passo: abaixo de 1024 não há o que recolher) e sai; a B entra: as chaves do `localStorage` são exatamente `educa.aparencia` e `educa.lateral-recolhida`, e o conteúdo é exatamente `{ 'educa.aparencia': 'escuro', 'educa.lateral-recolhida': 'sim' }` (`sim` é o que `CascaDaEscola.tsx` grava hoje), e o `sessionStorage` está vazio |
| `Segmentado` pelo teclado | componente | setas, Home e End trocam; uma parada de Tab; `aria-checked` |
| alvo de toque | e2e (`celular`) | cada opção do `Segmentado` tem 44 px de altura |
| a galeria e os specs divididos | e2e | o número de casos de `pecas-*` é o de `pecas.spec.ts` antes da divisão |
| recomeço da tela: segunda pessoa na mesma aba | e2e | o tema não muda ao trocar de pessoa, e o cache dela é descartado como hoje |

A linha de log não se aplica: a tarefa não escreve log.

## Como testar

- Preferência no navegador a copiar: `apps/web/src/componentes/CascaDaEscola.tsx`, `lerRecolhida`, e o teste dela
  em `e2e/casca.spec.ts › W12` ("a lateral recolhida guardada")
- Teste de componente a copiar: `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`
- Primeiro quadro: `page.route('**/assets/index-*.js', …)` segura a entrada; leia `document.documentElement.dataset.tema`
  e `getComputedStyle(document.body).backgroundColor` antes de soltar
- Isolado: `npx vitest run --project unidade apps/web/src/tema.test.ts apps/web/src/componentes/Aparencia.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/aparencia.spec.ts e2e/pecas-*.spec.ts e2e/entrar.spec.ts`
- Armadilha: `Segmentado` e `Aparencia` entram na casca, que mora na entrada: não podem importar peça de
  `PECAS_FORA_DA_ENTRADA`, e o teste do build mede o primeiro carregamento
- Telas: `coordenacao`, `/coordenacao/governanca`, clique em `text=Sua conta`; `/galeria`. Mockup:
  `/fundamentos` (o seletor do topo)

## Fora do escopo desta tarefa

O tamanho da letra (X4); a casca nova (12.0 e 13.0); peça nova além de `Segmentado` e `Aparencia`.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O `estilos.css` ganha `:root[data-tema='claro'] { color-scheme: light; }`, fora de camada e sem cor, e ele não estava em "Arquivos previstos" | O `<meta name="color-scheme" content="light dark">` da 2.1 faz o navegador pintar barra de rolagem, controle nativo e fundo do documento no escuro quando o aparelho é escuro. Com **Claro** escolhido sobre um aparelho escuro, a página ficaria clara e o documento, escuro. O bloco do escuro já declarava `color-scheme: dark`; faltava o par | `techspec.md` §5 ("O tema"), que passou a dizer o mesmo; `e2e/aparencia.spec.ts` e `tema.test.ts › o CSS declara o color-scheme dos dois temas` |
| `Aparencia` não aparece no **trilho** de 56 px: aparece na lateral aberta, na gaveta e na barra da operação | O trilho só tem ícones, e o grupo de três opções não cabe nele. A pessoa a alcança abrindo a lateral, que o trilho tem a um clique. Nenhum dos três papéis fica sem o controle | `techspec.md` §9 ("A casca"), que passou a dizer o mesmo |
| A posição da `Aparencia` no Tab é entre "Meus dados" e "Sair", uma parada só; `e2e/casca.spec.ts › W12` (a lateral aberta percorrida só com Tab) ganhou essa parada, e não estava na lista | O `cenarios.md` A17 e o item 10 de "O que ficou em aberto" deixavam a posição para esta tarefa. O "Sair" continua sendo o último controle, e "Meus dados" continua antes dele | `cenarios.md` A17 e "O que ficou em aberto", item 10, que passaram a dizer a posição |
| A galeria leva três arquivos de apoio fora da lista (`galeria/Secao.tsx`, `galeria/dados.ts`, `galeria/Galeria.test.tsx`) e os specs, um (`e2e/__fixtures__/galeria.ts`) | Os blocos de seção repetiam o mesmo cartão e os mesmos dados inventados (`QUANDO`, `TURMAS`); os cinco specs repetiam `secao`, `abrirGaleria`, `acionar`, `desenho`, `caixa` e as duas conferências. Sem o arquivo comum, cada arquivo dividido teria uma cópia. O teste da galeria prova que os 15 blocos de antes continuam, uma vez só, que cada arquivo de `secoes/` é registrado pelo glob e que o e2e dividido tem os 12 casos e as 309 asserções de antes | `techspec.md` §9 ("Galeria"), que passou a nomear os três |
| `e2e/pecas.spec.ts` virou **cinco** arquivos (`pecas-ia`, `pecas-galeria`, `pecas-botoes`, `pecas-sobrepor`, `pecas-superficies`), com os 12 casos inteiros, e `pecas-estado` e `pecas-campos` **não** existem | Nenhum caso de antes é só de estado nem só de campo: cada um já pertence a uma peça de outro grupo. Partir um caso para forjar o arquivo mudaria asserção, o que a subtarefa 2.5 proíbe. O caso de largura e axe (T5) é de toda a galeria e ficou num arquivo próprio. As tarefas 4.0 e 6.0, que tocam estado e campos, criam os arquivos que faltam | `cenarios.md` A.4 (A26 a A41), `techspec.md` §9 ("Galeria") |
| `apps/web/nome-dos-chunks.ts` **não** foi alterado | `Segmentado` e `Aparencia` entram na entrada, fora de `PECAS_FORA_DA_ENTRADA`, e o que sai de `src/galeria/` (incluindo `secoes/`) já é `galeria-*`. O teste do build (`nome-dos-chunks.test.ts`) continua verde e mede o primeiro carregamento | `techspec.md` §2 e §9 |
| Dois testes de componente fora da lista: `MenuDaPessoa.test.tsx` e `CascaDaOperacao.test.tsx` | A mutação "tirar a `Aparencia` do menu" e "tirar da faixa" só tinha e2e, que exige reconstruir a imagem a cada rodada do portão. O teste de componente prova o lugar (antes do "Sair", fora do trilho, só na faixa com sessão) e roda em segundos; o e2e continua provando a ordem e a largura reais | `techspec.md` §10 (Componente) |
| `playwright.config.ts` fixa `colorScheme: 'light'` e a vitrine ganha `--escuro`, e nenhum dos dois estava no `2_task.md` | São duas subtarefas da Tech Spec §10 e da lista do `tasks.md` que esta tarefa não trazia, e a ordem de correção da 1ª rodada as exigiu aqui: desde esta tarefa o script do `index.html` segue o `prefers-color-scheme`, e os oráculos em `rgb()` do `cenarios.md` dependem de o aparelho de cada teste ser claro. A vitrine passa a fotografar com o aparelho escuro (`foto … --escuro`), e a foto leva `escuro--` na frente do nome para não apagar a do claro | `techspec.md` §10 ("`playwright.config.ts` fixa `colorScheme: 'light'`", "a vitrine ganha a opção de fotografar no escuro"); `cenarios.md`, base das linhas |
| A ordem dos blocos da galeria é a do nome do arquivo, e não a do arquivo único de antes | O glob entrega os arquivos por nome, e a ordem fixa é o que o e2e precisa para ser igual em toda máquina. O conteúdo de cada bloco é o de antes, movido; só a ordem mudou ("Seleção e menu" vem logo depois de "Botões") | a Tech Spec não define ordem; o comentário de `Galeria.tsx` diz a que vale |

O que o navegador guarda passou a ser lista fechada em `docs/interface.md` seção 6: `educa.aparencia` e
`educa.lateral-recolhida`, e `sessionStorage` vazio.

Medida do orçamento (Tech Spec, seção 7c), no build de produção (`vite build`, sem a galeria), em brotli, antes (HEAD
`65ab3b1`) e depois desta tarefa:

| | Antes | Depois | Diferença |
|---|---|---|---|
| Entrada (`index-*.js`) | 343.158 bytes, 91.102 em brotli | 345.850 bytes, 91.874 em brotli | mais 772 bytes em brotli |
| CSS (`index-*.css`) | 34.664 bytes, 6.547 em brotli | 35.211 bytes, 6.663 em brotli | mais 116 bytes em brotli |

A entrada fica em 91,9 kB em brotli, abaixo do teto de 150 kB do primeiro carregamento. O teste do build
(`apps/web/nome-dos-chunks.test.ts`) continua verde, e prova que `Segmentado` e `Aparencia` não puxam peça de
`PECAS_FORA_DA_ENTRADA`.

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/tema.ts
teste: apps/web/src/tema.test.ts › Sistema apaga a chave
- if (aparencia === 'sistema') window.localStorage.removeItem(CHAVE_DA_APARENCIA)
- else window.localStorage.setItem(CHAVE_DA_APARENCIA, aparencia)
+ window.localStorage.setItem(CHAVE_DA_APARENCIA, aparencia)
```

```mutacao
arquivo: apps/web/src/tema.ts
teste: apps/web/src/tema.test.ts › resolverTema
- if (escolha === 'claro' || escolha === 'escuro') return escolha
+ if (escolha === 'claro') return escolha
```

```mutacao
arquivo: apps/web/src/tema.ts
teste: apps/web/src/tema.test.ts › valor que não é claro nem escuro vale o sistema
- if (escolha === 'claro' || escolha === 'escuro') return escolha
+ if (escolha) return escolha as Tema
```

```mutacao
arquivo: apps/web/src/tema.ts
teste: apps/web/src/tema.test.ts › a escolha feita em outra aba chega pelo evento storage
- if (evento.key !== null && evento.key !== CHAVE_DA_APARENCIA) return
```

```mutacao
arquivo: apps/web/src/tema.ts
teste: apps/web/src/tema.test.ts › armazenamento que lança ao ler e ao gravar
  } catch {
-   escolhaQueOArmazenamentoRecusou = aparencia
  }
```

```mutacao
arquivo: apps/web/index.html
teste: apps/web/src/tema.test.ts › só escreve claro ou escuro, e nunca o texto que leu
- var tema = escolha === 'claro' || escolha === 'escuro' ? escolha : escuro ? 'escuro' : 'claro'
+ var tema = escolha ? escolha : escuro ? 'escuro' : 'claro'
```

```mutacao
arquivo: apps/web/index.html
teste: apps/web/src/tema.test.ts › leitura que lança cai no sistema
  try {
    escolha = window.localStorage.getItem('educa.aparencia')
- } catch (erro) {}
+ } finally {}
```

```mutacao
arquivo: apps/web/index.html
teste: apps/web/src/tema.test.ts › o arquivo declara o color-scheme do documento
- <meta name="color-scheme" content="light dark" />
+ <meta name="color-scheme" content="light" />
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/tema.test.ts › o CSS declara o color-scheme dos dois temas
 :root[data-tema='claro'] {
-   color-scheme: light;
 }
```

```mutacao
arquivo: apps/web/src/componentes/Segmentado.tsx
teste: apps/web/src/componentes/Segmentado.test.tsx › escolher de novo a marcada
- if (indice !== marcada) aoMudar(opcao.valor)
+ aoMudar(opcao.valor)
```

```mutacao
arquivo: apps/web/src/componentes/Segmentado.tsx
teste: apps/web/src/componentes/Segmentado.test.tsx › é uma parada só no Tab
- tabIndex={indice === naOrdemDoTab ? 0 : -1}
+ tabIndex={0}
```

```mutacao
arquivo: apps/web/src/componentes/Segmentado.tsx
teste: apps/web/src/componentes/Segmentado.test.tsx › o alvo é de 44 px
- className={`min-h-11 min-w-0 flex-1 rounded-linha border-2 px-1 text-sm font-semibold md:min-h-9 ${
+ className={`min-w-0 flex-1 rounded-linha border-2 px-1 text-sm font-semibold md:min-h-9 ${
```

```mutacao
arquivo: apps/web/src/componentes/Segmentado.tsx
teste: apps/web/src/componentes/Segmentado.test.tsx › Home vai à primeira e End à última
  case 'Home':
-   destino = 0
+   destino = total - 1
```

```mutacao
arquivo: apps/web/src/componentes/MenuDaPessoa.tsx
teste: apps/web/src/componentes/MenuDaPessoa.test.tsx › a Aparência fica no menu da conta
- <div className="px-3 py-1">
-   <Aparencia />
- </div>
```

```mutacao
arquivo: apps/web/src/componentes/MenuDaPessoa.tsx
teste: apps/web/src/componentes/MenuDaPessoa.test.tsx › no trilho, só ícones
- <ListaDeItens itens={itens} rotulo={NOME_DO_MENU_DA_PESSOA} trilho />
+ <ListaDeItens itens={itens} rotulo={NOME_DO_MENU_DA_PESSOA} trilho />
+ <Aparencia />
```

```mutacao
arquivo: apps/web/src/operacao/componentes/CascaDaOperacao.tsx
teste: apps/web/src/operacao/componentes/CascaDaOperacao.test.tsx › com a sessão aberta, a faixa leva a Aparência
- <Aparencia rotuloVisivel={false} />
```

```mutacao
arquivo: apps/web/src/operacao/componentes/CascaDaOperacao.tsx
teste: apps/web/src/operacao/componentes/CascaDaOperacao.test.tsx › as telas de fora da sessão
- <Faixa />
+ <Faixa><Aparencia rotuloVisivel={false} /></Faixa>
```

```mutacao
arquivo: apps/web/src/galeria/Galeria.tsx
teste: apps/web/src/galeria/Galeria.test.tsx › desenha cada bloco de antes
- <div className="max-w-xs">
-   <Aparencia />
- </div>
```

```mutacao
arquivo: apps/web/src/main.tsx
teste: e2e/aparencia.spec.ts › em Sistema a página aberta acompanha o aparelho
- iniciarTema()
+ void 0
```

```mutacao
arquivo: apps/web/src/tema.ts
teste: apps/web/src/tema.test.ts › o armazenamento que volta a funcionar volta a ser a fonte da escolha
  else window.localStorage.setItem(CHAVE_DA_APARENCIA, aparencia)
-   escolhaQueOArmazenamentoRecusou = undefined
  } catch {
```

```mutacao
arquivo: apps/web/src/tema.ts
teste: apps/web/src/tema.test.ts › o que está na chave e não é claro nem escuro é Sistema
-   return valor === 'claro' || valor === 'escuro' ? valor : undefined
+   return valor ?? undefined
```

```mutacao
arquivo: apps/web/src/tema.ts
teste: apps/web/src/tema.test.ts › armazenamento que lança ao ler e ao gravar
  } catch {
-   // Sem acesso ao armazenamento: a aparência é a do sistema, calada.
-   return undefined
+   throw new Error('sem acesso ao armazenamento')
  }
```

```mutacao
arquivo: apps/web/src/tema.ts
teste: apps/web/src/tema.test.ts › sem matchMedia, o claro
  } catch {
-   // Sem `matchMedia` (ou recusando): o claro, que é a pele de quem não disse nada.
-   return false
+   throw new Error('sem matchMedia')
  }
```

```mutacao
arquivo: apps/web/src/tema.ts
teste: apps/web/src/tema.test.ts › a escolha de outra aba vale mais do que a que esta aba guardou na memória
  // O que a outra aba gravou (ou apagou) vale mais do que o que esta aba guardou na memória.
- escolhaQueOArmazenamentoRecusou = undefined
  aoMudarAAparencia()
```

```mutacao
arquivo: apps/web/index.html
teste: apps/web/src/tema.test.ts › leitura que lança cai no sistema
  try {
    escuro = window.matchMedia('(prefers-color-scheme: dark)').matches
- } catch (erro) {}
+ } finally {}
```

```mutacao
arquivo: apps/web/src/componentes/Segmentado.tsx
teste: apps/web/src/componentes/Segmentado.test.tsx › com o valor fora da lista
- const naOrdemDoTab = Math.max(marcada, 0)
+ const naOrdemDoTab = marcada
```

```mutacao
arquivo: apps/web/src/componentes/Segmentado.tsx
teste: apps/web/src/componentes/Segmentado.test.tsx › as setas escolhem
- destino = (indice - 1 + total) % total
+ destino = Math.max(indice - 1, 0)
```

```mutacao
arquivo: playwright.config.ts
teste: apps/web/src/tema.test.ts › o Playwright fixa o aparelho no claro
- colorScheme: 'light',
```

```mutacao
arquivo: tools/vitrine/foto.ts
teste: tools/vitrine/foto.test.ts › marca o aparelho escuro
- return `${escuro ? 'escuro--' : ''}${vazia ? 'vazia--' : ''}${papel}--${endereco === '' ? 'inicio' : endereco}${clicado === '' ? '' : `--${clicado}`}--${tela}`
+ return `${vazia ? 'vazia--' : ''}${papel}--${endereco === '' ? 'inicio' : endereco}${clicado === '' ? '' : `--${clicado}`}--${tela}`
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) e frontend-reviewer (1ª) | Pôr no `docs/lgpd.md` uma linha que diga "o navegador guarda só preferência de aparelho, sem identificador" e que aponte para `docs/interface.md` seção 6 | `TODO.md`, no item que a subtarefa 2.6 já pôs lá: `docs/lgpd.md` não é arquivo da tarefa, e a preferência não é dado pessoal (nenhuma linha nova na tabela de dados) |
| privacy-guardian (1ª) | Quando o F16 servir política de segurança de conteúdo, confirmar que o hash do script do tema em `script-src` não abre caminho para `'unsafe-inline'` | já registrado em `TODO.md` pela subtarefa 2.6 |
| frontend-reviewer (1ª) | `.bg-noite :focus-visible` (`estilos.css:306`) pinta o anel da `Aparencia` na faixa da operação em `caramelo-noite`, cerca de 2,1:1 sobre o `bg-fundo` do grupo, abaixo dos 3:1 do RF2 | tarefa 15.0 (a faixa da operação, `CascaDaOperacao.tsx`), medindo o anel da `Aparencia` na faixa nos dois temas, e não só o do "Sair"; a causa é a regra `.bg-noite`, que a 3.0 trata |
| revisor-geral (1ª) | Na faixa `bg-noite` da operação, o `Segmentado` desenha um bloco `bg-fundo` claro: conferir se o grupo continua com a mesma cara quando a faixa clarear | tarefa 15.0, junto do item acima |
| frontend-reviewer (1ª) | Placeholder da caixa de pedido cortado a 360 px (`CaixaPedido.tsx:112-125`) | tarefa 10.0, subtarefa 10.1, que reveste `CaixaPedido`; já era assim antes desta tarefa e a peça não foi tocada aqui |
| frontend-reviewer (1ª) | Rótulos da galeria sem acento ("primario", "oficial", "secundario") | tarefa 3.0, que altera `galeria/secoes/botoes.tsx` e `e2e/pecas-botoes.spec.ts`; trocar aqui mudaria asserção, o que a 2.5 proíbe |
| test-engineer (1ª) | Teste de componente que compare a ordem dos `data-galeria` com a ordem dos nomes de arquivo (`Galeria.tsx:23`) | recusada: a cláusula só se prova por mutação se tirar o `.sort` mudar a ordem, e isso depende da ordem que o glob do Vite devolve; o comentário da linha 21 declara a regra |
| test-engineer (1ª) | Citar o e2e `alvo de toque` no nome do caso `Segmentado.test.tsx › o alvo é de 44 px` | recusada: o caso de componente prova a classe e o e2e prova a medida; o nome do caso é a chave do bloco de mutação, e renomeá-lo só troca o nome em dois lugares sem mudar o que a regra prova |
| test-engineer (1ª) | `Galeria.test.tsx:90` conta `expect(` com `toBeGreaterThanOrEqual(309)`: uma asserção trocada por outra passa; guardar o hash das linhas de asserção na próxima divisão | `/retro` da funcionalidade (revisor pediu para o `/retro`) |
| revisor-geral (2ª) | A tabela de "Divergências" está partida por uma linha em branco: as duas linhas novas (`colorScheme`/`--escuro` e a ordem da galeria) ficam sem cabeçalho e não aparecem como tabela | aplicada no documento: a linha em branco saiu |
| revisor-geral (2ª) | A linha de "Divergências" sobre a ordem dos blocos cita `techspec.md` §9 ("Galeria"), mas a §9 não fala de ordem | aplicada no documento: a coluna passou a dizer "a Tech Spec não define ordem"; a Tech Spec não é editada |
| test-engineer (2ª) | `Segmentado.tsx:55`: a volta na outra ponta, `(indice + 1) % total`, não tem bloco de mutação próprio, embora `Segmentado.test.tsx:92-93` fique vermelho sem ela | recusada: tem teste, o código não mudou desde a 1ª rodada e o revisor aprovou sem exigir; nenhuma tarefa futura altera `Segmentado.tsx` |
| test-engineer (2ª) | `tools/vitrine/foto.ts:170` (`colorScheme: escuro ? 'dark' : 'light'`) e o filtro do `--escuro` em `vitrine.ts:73` não têm teste | recusada: ferramenta de inspeção, e testar abriria um navegador; o nome da foto (`escuro--`) tem teste e mutação |
| test-engineer (2ª) | `tema.test.ts:147` confere o `colorScheme` do Playwright procurando o texto no arquivo; um e2e que lesse `matchMedia` provaria o efeito | recusada: o efeito de `colorScheme` é do Playwright, e a configuração, que é o que a tarefa entrega, está presa pelo texto e pelo bloco de mutação |
| privacy-guardian (2ª) | Quando o F16 servir política de segurança de conteúdo, conferir o hash do script do tema em `script-src` e pôr a linha no `docs/lgpd.md` | já registrado no `TODO.md` (a linha da subtarefa 2.6, que levou as duas coisas) |
| privacy-guardian (2ª) | `foto.ts:364`: a sessão guardada serve igual para a foto no claro e no escuro; sem impacto de privacidade (sessão sintética, fora do git) | observação, sem ação |
| frontend-reviewer (2ª) | `CaixaPedido.tsx:112-125`: placeholder cortado a 360 px; quem aprovar a 10.0 deve ver a foto, e se continuar assim é bloqueante lá | tarefa 10.0, subtarefa 10.1 (já na tabela da rodada 1) |
| frontend-reviewer (2ª) | Rótulos "primario", "secundario" e "oficial" sem acento em `secoes/botoes.tsx` | tarefa 3.0 (já na tabela da rodada 1) |
| frontend-reviewer (2ª) | Faixa `bg-noite` da operação: anel de foco da `Aparencia` abaixo de 3:1 e bloco `bg-fundo` claro no grupo | tarefa 15.0 (já na tabela da rodada 1) |
| frontend-reviewer (2ª) | `--clicar` da vitrine vale nas duas telas e falha no computador, onde o botão "Abrir o menu" não existe | tarefa 13.0, que tem a gaveta como entrega: até a vitrine aceitar clique por tela, a Mesa fotografa a gaveta por script |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-13 09:33:18 | 2026-10-13 09:34:05 | `privacy-guardian` | 1 | APROVADO | ae6059191a6c7e611 |
| 2026-10-13 09:33:29 | 2026-10-13 09:35:50 | `revisor-geral` | 1 | REPROVADO | ae416d2197993cb40 |
| 2026-10-13 09:33:24 | 2026-10-13 09:36:00 | `test-engineer` | 1 | REPROVADO | a3596fac9fe756553 |
| 2026-10-13 09:33:13 | 2026-10-13 09:37:34 | `frontend-reviewer` | 1 | APROVADO | a0d339d8d17c50d3d |
| 2026-10-13 09:51:30 | 2026-10-13 09:52:14 | `revisor-geral` | 2 | APROVADO | afff1de096396d109 |
| 2026-10-13 09:51:49 | 2026-10-13 09:52:21 | `privacy-guardian` | 2 | APROVADO | a80fca350a84eaece |
| 2026-10-13 09:51:21 | 2026-10-13 09:52:34 | `test-engineer` | 2 | APROVADO | a28effc487a9a4589 |
| 2026-10-13 09:51:40 | 2026-10-13 09:54:45 | `frontend-reviewer` | 2 | APROVADO | a573684560d80fd64 |

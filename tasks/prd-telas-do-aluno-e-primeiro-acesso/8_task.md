# Tarefa 8.0 — O aluno escolhe o tamanho da letra, em Ajustes

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 7.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O aluno escolhe Padrão, Grande ou Maior em Eu › Ajustes, e a letra vale na área dele desde o primeiro quadro, sem identificador e sem
gravar nada que ele não escolheu.

## Contexto necessário

- `techspec.md` seções 5 ("Tamanho da letra"), 7 (última linha) e 9 ("Eu"); `prd.md` RF11 e RF20; `mockup.md` seção 2.5 ("Ajustes") e
  fecho (b), passo 3
- Regras 20 (item 1) e 50 (itens 2a e 11)
- Código: o script em linha do tema em `apps/web/index.html`; `estilos.css`; `main.tsx`; `areas/aluno/rotas.tsx`;
  `areas/aluno/Eu.tsx` (da 7.0); `componentes/Aparencia.tsx` e `componentes/ui/campos/Opcao.tsx`, da X1
- Corre junto da 3.0, 4.0, 5.0 e 6.0: **só edita** `Eu.tsx`, `rotas.tsx`, `index.html`, `estilos.css`, `main.tsx` e arquivos novos

## Subtarefas

- [x] 8.1 — `apps/web/src/letra.ts`: a chave `educa.letra` (`grande` ou `maior`; ausente é Padrão; voltar a Padrão apaga), leitura e
  escrita em `try/catch` (armazenamento recusado: vale na sessão, sem erro). O script em linha lê a chave e, se o caminho começa por
  `/aluno`, escreve `data-letra` no `<html>`. `useTamanhoDaLetra()`, montado em `areas/aluno/rotas.tsx`, mantém o atributo e o tira ao
  sair da área. No CSS, `font-size` de 112,5% e de 125% no `<html>`
- [x] 8.2 — `componentes/TamanhoDaLetra.tsx`, ao lado da `Aparencia` (é o 25º arquivo de produção da pasta, o teto): três `Opcao` em grupo de rádio (setas, uma parada de Tab), "Padrão", "Grande" e "Maior", e a
  prévia "Assim fica a minha letra." Em Eu, a linha "Ajustes" abre um `Dialogo` com a `Aparencia` e o `TamanhoDaLetra`. **Grava só ao
  escolher**: montar, abrir o diálogo ou entrar na área não escreve nada
- [x] 8.3 — `docs/interface.md`: a chave e a regra "só por escolha". A lista fechada de chaves do navegador (11.1 do
  `docs/interface.md`; Tech Spec da X1, seção 7) ganha `educa.letra`, com valor de conjunto fechado (`grande` ou `maior`), e
  o e2e do armazenamento da X1 (RF24, `e2e/aparencia.spec.ts`) passa a conhecer a terceira chave. O `docs/lgpd.md` registra que
  a preferência fica só no navegador, sem identificador de pessoa nem de escola
- [x] 8.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/letra.ts`, `apps/web/src/letra.test.ts`, `apps/web/src/componentes/TamanhoDaLetra.tsx`, `apps/web/src/componentes/TamanhoDaLetra.test.tsx` | novo |
| `apps/web/src/galeria/secoes/tamanho-da-letra.tsx`, `e2e/tamanho-da-letra.spec.ts` | novo |
| `apps/web/index.html`, `apps/web/src/estilos.css`, `apps/web/src/main.tsx`, `apps/web/src/areas/aluno/rotas.tsx`, `apps/web/src/areas/aluno/Eu.tsx`, `docs/interface.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| antes do primeiro quadro | e2e | com "Maior" guardado, `data-letra` já está no `<html>` no `DOMContentLoaded` (`addInitScript`) e o `font-size` é 20 px |
| só grava ao escolher | componente + e2e | sem escolha, `localStorage` segue `'[]'` depois do login, de Eu e do diálogo; escolher "Padrão" apaga a chave |
| a escolha não sai do navegador | e2e | com "Maior" escolhido, nenhuma requisição à API leva `educa.letra` nem o valor dela, em endereço, cabeçalho ou corpo: a preferência não é dado da pessoa no servidor |
| armazenamento recusando | unidade | `getItem` e `setItem` que lançam: Padrão na leitura, a escolha vale na sessão, nenhum erro na tela |
| valor inválido | unidade | `xyz` na chave vira Padrão |
| só no aluno | e2e | a mesma chave não muda a letra no professor nem na coordenação; ao sair do `/aluno`, o atributo some |
| mesmo computador | e2e | o aluno seguinte herda a letra (a chave não leva identificador) e não vê nada do primeiro |
| teclado | componente | setas trocam a opção, uma parada de Tab, foco devolvido à linha "Ajustes" ao fechar |
| 360 px com Maior | e2e | Início, Tarefas, Eu, o diálogo e a tarefa aberta sem rolagem lateral (`larguraExcedente`) |

Quatro estados não se aplicam (preferência local). Concorrência: duas abas, a última vence. Log: nenhuma linha nova.

## Como testar

- Componente: copie `ListaDePedidos.test.tsx` (`componentes/pedidos/`). E2e: o `storage` vazio segue `e2e/entrar.spec.ts` (~58); a
  medida, `e2e/casca.spec.ts` (`setViewportSize` a 360)
- Rodar: `npx vitest run --project unidade apps/web/src/letra.test.ts` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/tamanho-da-letra.spec.ts`
- Telas: `aluno`, `/aluno/eu`, clique em "Ajustes" e depois em "Maior" (recarregue); mockup `/aluno/eu`

## Fora do escopo desta tarefa

Tamanho da letra para professor e coordenação; a escolha dentro da introdução (9.0); trocar a senha; guardar a escolha no servidor.
Estouro a 360 px numa tela de outra tarefa: conserte a tela, e não o tamanho (Tech Spec, seção 13).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `TamanhoDaLetra` mora em `componentes/ajustes/TamanhoDaLetra.tsx`, e não em `componentes/TamanhoDaLetra.tsx`; entra em `PECAS_FORA_DA_ENTRADA` (`apps/web/nome-dos-chunks.ts`) com o caminho `ajustes/TamanhoDaLetra` | A 8.2 diz que este seria "o 25º arquivo de produção, o teto" de `componentes/`; a pasta já tem 25 (`ls apps/web/src/componentes`), e o 26º reprova `tools/guardas/tamanho-das-pastas.test.ts`. Pasta nova, e não mover a `Aparencia` (está na lista da casca, `casca-sem-import.test.ts`) | `techspec.md` §2, linha de `apps/web/src/componentes/` (agora diz `ajustes/TamanhoDaLetra` e o motivo); `docs/interface.md` 10.2, linha `TamanhoDaLetra`. A 9.0, que usa a peça, não cita o caminho (`grep TamanhoDaLetra tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`: vazio) |
| `useTamanhoDaLetra()` é montado **na raiz** (`main.tsx`, componente `LetraDoAluno`), preso ao endereço, e não em `areas/aluno/rotas.tsx`; `iniciarLetra()` (o evento `storage` das outras abas) também em `main.tsx`. `rotas.tsx` do aluno não é editado | O script em linha escreve `data-letra` em `/aluno` antes de saber se há sessão. Quem abre `/aluno` sem sessão vai à entrada sem a área montar, e o atributo ficaria na entrada e para a pessoa seguinte, que pode ser professor (provado em `e2e/tamanho-da-letra.spec.ts › antes do primeiro quadro`). Montado na raiz, o atributo sai no instante em que o endereço deixa de ser o do aluno. `letra.ts` na entrada também evita um pedaço dividido entre a área e a galeria | `techspec.md` §5, parágrafo "Tamanho da letra", e §2 (a linha de `letra.ts`, que ganha `main.tsx`) |
| As classes `t-*` de `estilos.css` passam de px a `rem` (tamanho e altura de linha), com o mesmo valor nos 16 px de fábrica; `estilos.test.ts` compara com `px / 16` | O `font-size` do `<html>` só escala o que é `rem`, e a escala tipográfica da 9.2 era em px: Grande e Maior mudariam a aparência de quase nada (o texto de tela é `t-*`) | `techspec.md` §5; `docs/interface.md` 6 (bullet "O tamanho da letra é do aluno") e a tabela da 9.2, que segue em px |
| O rótulo da lista de linhas de Eu passa de "Privacidade e saída" para "Conta" | A lista agora tem três linhas (Privacidade, Ajustes, Sair); o rótulo velho mentia. É o nome do `nav` do mockup | `mockup.md` 2.5, item 3 (`nav` "Conta"); `Eu.test.tsx` (`conferirAsLinhas`) |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › resolverLetra
  export function resolverLetra(valor: string | null | undefined): TamanhoDaLetra {
-   return valor === 'grande' || valor === 'maior' ? valor : 'padrao'
+   return valor ?? 'padrao'
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › resolverLetra
  export function resolverLetra(valor: string | null | undefined): TamanhoDaLetra {
-   return valor === 'grande' || valor === 'maior' ? valor : 'padrao'
+   return valor === 'maior' ? valor : 'padrao'
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › resolverLetra
  export function resolverLetra(valor: string | null | undefined): TamanhoDaLetra {
-   return valor === 'grande' || valor === 'maior' ? valor : 'padrao'
+   return valor === 'grande' ? valor : 'padrao'
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › noCaminhoDoAluno
  export function noCaminhoDoAluno(caminho: string): boolean {
-   return caminho === '/aluno' || caminho.startsWith('/aluno/')
+   return caminho.startsWith('/aluno')
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › noCaminhoDoAluno
  export function noCaminhoDoAluno(caminho: string): boolean {
-   return caminho === '/aluno' || caminho.startsWith('/aluno/')
+   return caminho.startsWith('/aluno/')
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › guardar a escolha
  try {
-     if (letra === 'padrao') window.localStorage.removeItem(CHAVE_DA_LETRA)
-     else window.localStorage.setItem(CHAVE_DA_LETRA, letra)
+     window.localStorage.setItem(CHAVE_DA_LETRA, letra)
      escolhaQueOArmazenamentoRecusou = undefined
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › a gravação que volta a funcionar
      else window.localStorage.setItem(CHAVE_DA_LETRA, letra)
-     escolhaQueOArmazenamentoRecusou = undefined
  } catch {
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › armazenamento que recusa leitura e gravação
  } catch {
-     escolhaQueOArmazenamentoRecusou = letra
+     // nada
  }
  avisarOsOuvintes()
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › armazenamento que recusa leitura e gravação
    // Sem acesso ao armazenamento: a letra é a Padrão, calada.
-     return 'padrao'
+     throw new Error('armazenamento recusado')
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › as outras abas
  function aoMudarOArmazenamento(evento: StorageEvent): void {
-   if (evento.key !== null && evento.key !== CHAVE_DA_LETRA) return
  escolhaQueOArmazenamentoRecusou = undefined
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › as outras abas
  function aoMudarOArmazenamento(evento: StorageEvent): void {
-   if (evento.key !== null && evento.key !== CHAVE_DA_LETRA) return
+   if (evento.key !== CHAVE_DA_LETRA) return
  escolhaQueOArmazenamentoRecusou = undefined
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › as outras abas
  if (evento.key !== null && evento.key !== CHAVE_DA_LETRA) return
-   escolhaQueOArmazenamentoRecusou = undefined
  avisarOsOuvintes()
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › armazenamento que recusa leitura e gravação
-   return escolhaQueOArmazenamentoRecusou ?? escolhaGuardada()
+   return escolhaGuardada()
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › useTamanhoDaLetra
  function aoMudarOArmazenamento(evento: StorageEvent): void {
  if (evento.key !== null && evento.key !== CHAVE_DA_LETRA) return
  escolhaQueOArmazenamentoRecusou = undefined
-   avisarOsOuvintes()
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › as outras abas
  export function iniciarLetra(): () => void {
-   window.addEventListener('storage', aoMudarOArmazenamento)
  return () => window.removeEventListener('storage', aoMudarOArmazenamento)
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › useTamanhoDaLetra
    const valeAqui = noCaminhoDoAluno(caminho)
  useEffect(() => {
-     aplicarLetra(valeAqui ? letra : 'padrao')
+     aplicarLetra(letra)
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › useTamanhoDaLetra
    aplicarLetra(valeAqui ? letra : 'padrao')
-     return () => document.documentElement.removeAttribute(ATRIBUTO_DA_LETRA)
+     return undefined
```

```mutacao
arquivo: apps/web/src/letra.ts
teste: apps/web/src/letra.test.ts › useTamanhoDaLetra
  function aplicarLetra(letra: TamanhoDaLetra): void {
-   if (letra === 'padrao') document.documentElement.removeAttribute(ATRIBUTO_DA_LETRA)
-   else document.documentElement.setAttribute(ATRIBUTO_DA_LETRA, letra)
+   document.documentElement.setAttribute(ATRIBUTO_DA_LETRA, letra)
```

```mutacao
arquivo: apps/web/index.html
teste: apps/web/src/letra.test.ts › o <script> do index.html
          var caminho = window.location.pathname
-           var naAreaDoAluno = caminho === '/aluno' || caminho.indexOf('/aluno/') === 0 // o mesmo teste de `noCaminhoDoAluno`
+           var naAreaDoAluno = caminho.indexOf('/aluno') === 0
```

```mutacao
arquivo: apps/web/index.html
teste: apps/web/src/letra.test.ts › o <script> do index.html
          var caminho = window.location.pathname
-           var naAreaDoAluno = caminho === '/aluno' || caminho.indexOf('/aluno/') === 0 // o mesmo teste de `noCaminhoDoAluno`
+           var naAreaDoAluno = caminho.indexOf('/aluno/') === 0 // o mesmo teste de `noCaminhoDoAluno`
```

```mutacao
arquivo: apps/web/index.html
teste: apps/web/src/letra.test.ts › o <script> do index.html
-           if (naAreaDoAluno && (letra === 'grande' || letra === 'maior')) document.documentElement.setAttribute('data-letra', letra)
+           if (letra === 'grande' || letra === 'maior') document.documentElement.setAttribute('data-letra', letra)
```

```mutacao
arquivo: apps/web/index.html
teste: apps/web/src/letra.test.ts › o <script> do index.html
-           if (naAreaDoAluno && (letra === 'grande' || letra === 'maior')) document.documentElement.setAttribute('data-letra', letra)
+           if (naAreaDoAluno && letra === 'maior') document.documentElement.setAttribute('data-letra', letra)
```

```mutacao
arquivo: apps/web/index.html
teste: apps/web/src/letra.test.ts › o <script> do index.html
-           if (naAreaDoAluno && (letra === 'grande' || letra === 'maior')) document.documentElement.setAttribute('data-letra', letra)
+           if (naAreaDoAluno && letra === 'grande') document.documentElement.setAttribute('data-letra', letra)
```

```mutacao
arquivo: apps/web/index.html
teste: apps/web/src/letra.test.ts › o <script> do index.html
-           if (naAreaDoAluno && (letra === 'grande' || letra === 'maior')) document.documentElement.setAttribute('data-letra', letra)
+           if (naAreaDoAluno && letra) document.documentElement.setAttribute('data-letra', letra)
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › o tamanho da letra do aluno
  :root[data-letra='grande'] {
-     font-size: 112.5%;
+     font-size: 100%;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › o tamanho da letra do aluno
  :root[data-letra='maior'] {
-     font-size: 125%;
+     font-size: 100%;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › t-corpo
  .t-corpo {
-     font-size: 1.0625rem;
+     font-size: 17px;
```

```mutacao
arquivo: apps/web/src/componentes/ajustes/TamanhoDaLetra.tsx
teste: apps/web/src/componentes/ajustes/TamanhoDaLetra.test.tsx › abre marcada na escolha que o navegador já guardava
  {OPCOES.map((opcao) => (
- <Opcao key={opcao.valor} tipo="radio" nome="tamanho-da-letra" valor={opcao.valor} rotulo={opcao.rotulo} marcada={letra === opcao.valor} aoMudar={() => escolher(opcao.valor)} />
+ <Opcao key={opcao.valor} tipo="radio" nome="tamanho-da-letra" valor={opcao.valor} rotulo={opcao.rotulo} marcada={opcao.valor === 'padrao'} aoMudar={() => escolher(opcao.valor)} />
```

```mutacao
arquivo: apps/web/src/componentes/ajustes/TamanhoDaLetra.tsx
teste: apps/web/src/componentes/ajustes/TamanhoDaLetra.test.tsx › escolher Grande e Maior
- <Opcao key={opcao.valor} tipo="radio" nome="tamanho-da-letra" valor={opcao.valor} rotulo={opcao.rotulo} marcada={letra === opcao.valor} aoMudar={() => escolher(opcao.valor)} />
+ <Opcao key={opcao.valor} tipo="radio" nome="tamanho-da-letra" valor={opcao.valor} rotulo={opcao.rotulo} marcada={letra === opcao.valor} aoMudar={() => undefined} />
  ))}
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › a linha "Ajustes" abre o diálogo
  </ul>
- {ajustesAbertos && <DialogoDeAjustes aoFechar={() => definirAjustesAbertos(false)} />}
+ {false && <DialogoDeAjustes aoFechar={() => definirAjustesAbertos(false)} />}
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › a linha "Ajustes" abre o diálogo
  </ul>
- {ajustesAbertos && <DialogoDeAjustes aoFechar={() => definirAjustesAbertos(false)} />}
+ {ajustesAbertos && <DialogoDeAjustes aoFechar={() => undefined} />}
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › a linha "Ajustes" abre o diálogo
- aoAcionar={() => definirAjustesAbertos(true)}
+ aoAcionar={() => definirAjustesAbertos(false)}
```

```mutacao
arquivo: apps/web/src/areas/aluno/DialogoDeAjustes.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › a linha "Ajustes" abre o diálogo
        <Aparencia />
-         <TamanhoDaLetra />
```

```mutacao
arquivo: apps/web/src/areas/aluno/DialogoDeAjustes.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › a linha "Ajustes" abre o diálogo
-         <Aparencia />
        <TamanhoDaLetra />
```

```mutacao
arquivo: apps/web/src/areas/aluno/DialogoDeAjustes.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › a linha "Ajustes" abre o diálogo
  <div className="mt-6 flex justify-end">
- <Botao variante="secundario" onClick={aoFechar}>
+ <Botao variante="secundario" onClick={() => undefined}>
```

```mutacao
arquivo: apps/web/src/main.tsx
teste: e2e/tamanho-da-letra.spec.ts › duas abas
  // a página só passa a acompanhar as outras abas. Não lê nem grava nada: a chave só é escrita quando o aluno escolhe.
- iniciarLetra()
```

```mutacao
arquivo: apps/web/src/main.tsx
teste: e2e/tamanho-da-letra.spec.ts › antes do primeiro quadro
  <QueryClientProvider client={clienteConsultas}>
-       <LetraDoAluno />
        <Rotas />
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › o tamanho da letra
  export const PECAS_FORA_DA_ENTRADA = [
- 'ajustes/TamanhoDaLetra',
  'introducao/Balao',
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Bloquear o pacote da entrada com `page.route` para o e2e do primeiro quadro separar o script em linha do hook | Recusada: a prova de que só o script em linha escreve o atributo está em `letra.test.ts › o <script> do index.html`, e as mutações de `index.html` da tarefa a exigem vermelha. O comentário errado do e2e foi corrigido (item 3 da ordem) |
| test-engineer (1ª) | "Mesmo computador" como uma sequência só (aluno 1 escolhe Maior e sai, aluno 2 entra) | Recusada: cada metade tem prova (a escolha que sobra no navegador, em `a escolha não sai do navegador`; a herança sem identificador, em `o aluno seguinte…`); a soma dos dois casos prova a linha da tabela, e a sequência única só repete logins num e2e |
| revisor-geral (1ª) | Trocar o alias `type TamanhoDaLetra as TipoDaLetra` por nome sem alias | Recusada: o tipo se chama `TamanhoDaLetra` em `letra.ts`, e os blocos de mutação da tarefa citam essa assinatura; renomear muda `.ts`/`.tsx` de produção e caduca as sete rodadas por uma questão de gosto |
| revisor-geral (1ª) | Em `useTamanhoDaLetra`, tirar o atributo só ao desmontar | Recusada: muda o efeito do hook, e o bloco de mutação "`return () => document.documentElement.removeAttribute(ATRIBUTO_DA_LETRA)`" da tarefa fica sobre outra linha. O resultado hoje está certo (palavras do próprio revisor) |
| revisor-geral (1ª) | A Aparência aparece duas vezes na área do aluno (lateral e diálogo) | Para o Validador, na validação de produto: foi a tarefa que pediu as duas (8.2) |
| frontend-reviewer (1ª) | `BarraDeBaixo.tsx:79,88` e `estilos.css:324`: com Maior a barra de baixo (68 px fixos) fica apertada | `TODO.md`: arquivo fora da tarefa, e mexe em CSS (comportamento). Nada é cortado e o e2e a 360 px com Maior passa |
| frontend-reviewer (1ª) | Alinhar os títulos "Aparência" e "Tamanho da letra" do diálogo | `TODO.md`: o rótulo de "Aparência" é do `Segmentado` da `Aparencia` da X1, fora dos arquivos da tarefa |
| frontend-reviewer (1ª), privacy-guardian (1ª) | Fotos com ids sintéticos visíveis; fundo do diálogo que não cobre o topo | Recusada: vem do seed da vitrine e da captura de página inteira, e não do código |
| tenancy-guardian (1ª), infra-guardian (1ª) | Registrar em "Divergências resolvidas" o hook na raiz e a pasta `ajustes/` | Recusada: a seção tem as quatro linhas, com a coluna "Onde está na spec" preenchida (`8_task.md`, seção "Divergências resolvidas nesta tarefa"); conferido na árvore desta rodada |
| conformidade-reviewer (1ª) | Quando a senha do aluno entrar em Ajustes, manter o padrão (nada de Ajustes vira dado visível ao professor ou à coordenação) | Tarefa futura que trouxer a senha: a regra 70, itens 7 e 9, já a cobre |

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 15:23:42 | 2026-10-25 15:24:05 | `tenancy-guardian` | 1 | APROVADO | a1f5ddc225f9a6941 |
| 2026-10-25 15:23:31 | 2026-10-25 15:24:14 | `privacy-guardian` | 1 | APROVADO | a4c83247d2069fd17 |
| 2026-10-25 15:23:46 | 2026-10-25 15:24:14 | `conformidade-reviewer` | 1 | APROVADO | a1af8b50bb7fbf992 |
| 2026-10-25 15:23:50 | 2026-10-25 15:24:14 | `infra-guardian` | 1 | APROVADO | a265fa0121a1e8994 |
| 2026-10-25 15:23:39 | 2026-10-25 15:24:46 | `revisor-geral` | 1 | APROVADO | ae38b300c20935e8c |
| 2026-10-25 15:23:28 | 2026-10-25 15:24:52 | `frontend-reviewer` | 1 | APROVADO | a0bcc6a4a31b22c28 |
| 2026-10-25 15:23:35 | 2026-10-25 15:26:04 | `test-engineer` | 1 | REPROVADO | a92704d4d4133c534 |
| 2026-10-25 15:39:13 | 2026-10-25 15:39:39 | `revisor-geral` | 2 | APROVADO | ac0fd73b1d190bf32 |
| 2026-10-25 15:39:05 | 2026-10-25 15:40:00 | `test-engineer` | 2 | APROVADO | a9f01fd46728a4b7d |

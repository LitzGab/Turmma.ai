# Tarefa 12.0 — A casca da escola no computador: lateral, trilho e menu da pessoa

**Funcionalidade:** pele-e-casca · **Depende de:** 7.0, 9.0, 11.0
**Subagentes obrigatórios:** `frontend-reviewer`, `tenancy-guardian`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

De 768 px para cima a casca tem lateral de 256 px, trilho de 88, ícone em cada lugar, "Sair" à vista, "Início" no
lugar de "Nova conversa" e a moldura de 1200, e a sessão de uma pessoa segue sem passar à seguinte.

## Contexto necessário

- `techspec.md` 6, 9 (**Casca da escola**) e 10; `prd.md` RF13, RF15 a RF17, RF19
- `cenarios.md`: A17 a A20, A22 a A24, A80, A84, A90 a A95, U14; parte B (onde "Nova conversa" vira "Início")
- `docs/interface.md` 11.1; regras 10 e 50 (itens 7 e 13); D59
- Código: `CascaDaEscola.tsx` (`lembrarQuemEsta`, 201-206; gaveta por pessoa, 225-228; `lerRecolhida`) e as vizinhas

## Subtarefas

- [x] 12.1 — Lateral de 256 px com borda de 2; lugares de 52 px (ícone numa caixa de 36, `t-rotulo`), aceso em `azul-claro`,
  `azul-borda` e `azul-texto` com `aria-current` (o filete sai), apagado em `sutil`; trilho de 88 px, sem animar;
  seletor de 48 px; no pé, a pessoa, "Meus dados", a `Aparencia` e "Sair" à vista.
  `<main>` na moldura de 1200, margem de 16 e 32. **Os nomes acessíveis da Tech Spec 9 não mudam**
- [x] 12.2 — "Nova conversa" vira "Início" no rótulo, no `h1` e na aba; `Icone` em Início, Turmas, Ferramentas e Atividades,
  `lucide` num `Ladrilho` nos outros; "Seu time" com o ícone da função num `Ladrilho`, sem onça; os comentários
  "nunca rosto" daqui viram "nunca pessoa"
- [x] 12.3 — `lateral-recolhida.ts` extrai `lerRecolhida` e `guardarRecolhida` (a chave não muda). Meça a entrada em brotli,
  antes e depois (`npm run build -w @educa/web`, `npx size-limit`), e escreva em "Divergências"
- [x] 12.4 — Testes

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/CascaDaEscola.tsx`, `itens-da-lateral.tsx`, `MenuDaPessoa.tsx`, `SeletorDeEscola.tsx` | alterados |
| `apps/web/src/componentes/lateral-recolhida.ts` e `.test.ts`, `itens-da-lateral.test.tsx`, `casca-sem-import.test.ts` | novos |
| `apps/web/src/areas/navegacao.ts`, `navegacao.test.ts`, `professor/Home.tsx` | alterados |
| `e2e/casca.spec.ts`, `areas.spec.ts`, `material.spec.ts`, `troca-de-escola.spec.ts` | alterados |
| `e2e/professor-assistente.spec.ts`, `roteiro-da-demonstracao.spec.ts`, `__fixtures__/casca.ts` | alterados |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| os nomes não mudaram | e2e | os da Tech Spec 9, nos três papéis |
| aceso e apagado | e2e | `aria-current`, `azul-claro`, borda de 2 px `azul-borda`, `azul-texto` (A23); **negativa** (A24): no apagado, outro fundo e borda transparente |
| o Tab | e2e | a ordem de A17 com "Início"; "Meus dados" antes de "Sair" |
| "Sair" à vista, trilho | e2e | a 900 e 1366 px, aberta e recolhida, nos três papéis: sem abrir nada, do tamanho do vizinho (A18); o trilho dá nome e dica e guarda a escolha (A19, A92) |
| armazenamento recusado | unidade | `getItem`, `setItem` e `removeItem` que lançam: abre aberta, sem erro; a casca sem `import(` |
| "Início" e ícones | e2e e componente | rótulo, `h1` e aba (A22, U14); todo item com ícone `aria-hidden` e o rótulo por nome; "Seu time" sem `[data-agente]` (A80) |
| moldura | e2e | `main` até 1200 px, padding de 32 e 16 (A84) |
| seletor | e2e | `troca-de-escola` sem perder asserção; a escola atual achada pelo nome (A94); 44 px (A95) |
| recomeço | e2e | segunda pessoa: `inatividade › Chromebook do carrinho…`, `areas › segunda pessoa…`; troca: `troca-de-escola`; sessão vencida: `inatividade › a sessão vence sozinha…`, `acesso-suspenso › duas abas…` |

## Como testar

- e2e a copiar: `casca.spec.ts › W12: no computador…`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes apps/web/src/areas`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/casca.spec.ts e2e/areas.spec.ts e2e/inatividade.spec.ts`
- Armadilha: `casca.spec` abaixo de 768 px é da 13.0
- **Telas**: `professora`, `/professor/nova-conversa`; `coordenacao`, `/coordenacao/governanca`; `aluno`,
  `/aluno/atividades`; a 1366 e 900 px, aberta e recolhida. Mockup: `/professor`

## Fora do escopo desta tarefa

Barra de baixo e gaveta (13.0); reagrupar itens (X2, X3).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Os itens que não têm ícone ilustrado (`Tutor`, `Minha turma`, `Governança`, `Agentes`, `Analista`, `Estrutura`, `Professores`, `Material`, `Privacidade`, `Meus dados`) levam o `lucide` num `Ladrilho` de 36 px, **cada um na sua família de cor**: Tutor em `laranja`, Minha turma em `turquesa`, Governança, Agentes e Analista em `anil`, Estrutura, Professores e Material em `azul`, Privacidade em `amarelo` (a do aluno, no rodapé, em `verde`), Meus dados em `verde`. O Assistente é `azul` e o Tutor do time é `laranja` | A subtarefa 12.2 manda o `lucide` num `Ladrilho`, mas não diz a família. A regra foi a do mockup de outubro, que agrupa por função (governar, estruturar, aprender), com o par da cor que a família já tem nos tokens; nenhuma é a do estado (`ok`, `erro`, `pendente`) | `techspec.md` 9 (**Casca da escola**, a linha do `lucide`, que agora diz a regra e a tabela de item para família); `itens-da-lateral.test.tsx` (a tabela, fixa por papel) |
| `border-transparent` passa na guarda de cor. A guarda reprovava `transparent`, e o item apagado precisa da borda de 2 px transparente para acender não deslocar nada; `bg-transparent` e `text-transparent` continuam reprovando, com caso na fixture | A pista de A24 é "borda transparente", e sem a classe o apagado teria 4 px a menos que o aceso. `transparent` não troca com o tema, então não escapa do `@theme`; a guarda era mais larga do que o risco que ela cobre | `techspec.md` 10 (**Guarda de cor**, que agora diz que `transparent` passa só como borda); `estilos.test.ts` (`NAO_E_COR.border`, fora dos "Arquivos previstos") |
| A lista fechada do oficial (`FACE_DO_OFICIAL`) encolhe de sete para quatro usos de antes, e o teto, de 7 para 5 (o oficial e os quatro): a dica da lateral passou a `bg-fundo` com `shadow-flutua`, e o avatar do Assistente de `areas/navegacao.ts` virou ladrilho na família `azul` | É o que a própria lista pede ("a entrada cuja classe o arquivo já não escreve reprova"), e o `estilos.test.ts` não está em "Arquivos previstos" porque a tarefa que tira um uso é quem baixa o teto | `techspec.md` 10 (**Guarda de cor**, os "sete" usos viram "quatro") |
| O `<main>` para em **1200 px contando a margem**: `max-w-[1200px]` com `px-4 md:px-8`, de modo que o conteúdo útil é de 1136 px. A Tech Spec diz "moldura de 1200" sem dizer se é com ou sem a margem; ficou com, que é o que o `getBoundingClientRect` do `main` mede e o que A84 pode afirmar sem o `calc` | Uma só medida para o e2e e para a grade das telas (que parte do `main`); a coluna de leitura (9.3) é mais estreita que as duas e não muda | `techspec.md` 9 (**Moldura**); `cenarios.md` A84 |
| A bolinha com as **iniciais** no pé da lateral é desenhada com o nome que a tela já mostra (`iniciaisDe`), `aria-hidden`, sem guardar nem enviar nada; sem nome (o `/v1/eu` ainda não chegou) não há bolinha. O trilho não a tem | A 11.1 pede "a pessoa (as iniciais, o nome e o papel)". Nenhum campo novo: é derivação do nome na tela, e por isso `docs/lgpd.md` não muda | `docs/interface.md` 11.1 (o pé); `docs/lgpd.md` sem alteração |
| A gaveta continua em **260 px** e a barra de topo estreita não muda: a lateral de 256 px é só a do computador | Barra de baixo e gaveta são da 13.0 ("Fora do escopo"); mexer na medida aqui a deixaria no meio do caminho | `techspec.md` 9 (**Casca da escola**); tarefa 13.0 |
| `areas/navegacao.ts` passa a importar de `../componentes/Contador` e de `../componentes/icones/lugares` **só tipos** (`import type`), e o contador de "Seu time" continua escrito em `itens-da-lateral.tsx`, sem importar o `Contador`: o `Contador` e o chunk `pecas-estado` continuam fora da entrada | A recomendação sem aplicar da 6.0 pedia o chunk `pecas-estado` mantido quando o `Contador` ganhasse a lateral; ele não a ganhou, e o contador da lateral guarda o atributo `data-contador-do-time` que A80 lê | `techspec.md` 7c (**Orçamento**); `cenarios.md` A80 |
| `e2e/troca-de-escola.spec.ts`, previsto, **não mudou**: nenhuma linha do seletor ganhou ícone (a contagem de `svg` continua válida), a escola atual já é achada pelo nome (`linhaDoSeletor`, A94) e o alvo de 44 px (A95) continua afirmado nele. A altura de 48 px do seletor, que o e2e não distingue (as duas linhas de texto já passam de 48 px), está em `SeletorDeEscola.test.tsx`, arquivo novo, pela classe `min-h-12` | A tabela de testes prometia o arquivo e A94; sem esta linha a promessa ficaria em aberto | `cenarios.md` A94, A95; `techspec.md` 9 (**Seletor**) |
| **A entrada**, medida: o `index-*.js` passa de **91.094 para 91.694 bytes em brotli** (+600 bytes), com os quatro ícones ligados à casca, sem chunk `lugares-*`. O teto de 150 kB do primeiro carregamento é medido por `nome-dos-chunks.test.ts` sobre o build de verdade, e o `pecas-*` está em 15,09 kB (teto 40 kB) | A 9.0 deixou a medida da entrada para esta tarefa (`9_task.md`, "Divergências") | `techspec.md` 7c (**Orçamento**) e 12; `docs/interface.md` 9.4 |

## Mutações

Cada bloco tira uma cláusula que a tarefa acrescentou e exige o teste vermelho. O que o `jsdom` sabe (classe, atributo,
chave do armazenamento) está em teste de unidade; o que só o navegador mede (a lateral de 256 px, o trilho de 88, a moldura
de 1200 e a sessão que não passa à pessoa seguinte) está em e2e, que o portão roda num projeto só (`chromebook`).

O lugar da lateral: aceso e apagado (A23, A24).

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › aceso:
-const LUGAR_ACESO = 'border-azul-borda bg-azul-claro text-azul-texto'
+const LUGAR_ACESO = 'bg-azul-claro text-azul-texto'
```

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › aceso:
-const LUGAR_ACESO = 'border-azul-borda bg-azul-claro text-azul-texto'
+const LUGAR_ACESO = 'border-azul-borda text-azul-texto'
```

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › aceso:
-const LUGAR_ACESO = 'border-azul-borda bg-azul-claro text-azul-texto'
+const LUGAR_ACESO = 'border-azul-borda bg-azul-claro'
```

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › aceso:
         onClick={fechar}
-        aria-current={aqui ? 'page' : undefined}
+        aria-current={undefined}
         className={`${FORMA_DO_LUGAR} t-rotulo ${trilho ? LUGAR_NO_TRILHO : LUGAR_ABERTO} ${aqui ? LUGAR_ACESO : LUGAR_APAGADO}`}
       >
         <IconeDoLugar icone={item.icone} />
```

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › aceso:
         aria-current={aqui ? 'page' : undefined}
-        className={`${FORMA_DO_LUGAR} t-rotulo ${trilho ? LUGAR_NO_TRILHO : LUGAR_ABERTO} ${aqui ? LUGAR_ACESO : LUGAR_APAGADO}`}
+        className={`${FORMA_DO_LUGAR} t-rotulo ${trilho ? LUGAR_NO_TRILHO : LUGAR_ABERTO} ${LUGAR_APAGADO}`}
       >
         <IconeDoLugar icone={item.icone} />
```

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › aceso:
-const LUGAR_APAGADO = 'border-transparent text-sutil hover:bg-fundo-suave hover:text-tinta'
+const LUGAR_APAGADO = 'text-sutil hover:bg-fundo-suave hover:text-tinta'
```

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › aceso:
-const LUGAR_APAGADO = 'border-transparent text-sutil hover:bg-fundo-suave hover:text-tinta'
+const LUGAR_APAGADO = 'border-transparent hover:bg-fundo-suave hover:text-tinta'
```

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › aceso:
-const FORMA_DO_LUGAR = 'group relative flex items-center rounded-controle border-2 text-left'
+const FORMA_DO_LUGAR = 'group relative flex items-center rounded-controle text-left'
```

A medida do lugar: 52 px aberto e no trilho.

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › de 768 a 1023 px
-const LUGAR_NO_TRILHO = 'size-13 justify-center'
+const LUGAR_NO_TRILHO = 'size-12 justify-center'
```

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › de 768 a 1023 px
-const LUGAR_ABERTO = 'min-h-13 w-full gap-3 px-2'
+const LUGAR_ABERTO = 'min-h-12 w-full gap-3 px-2'
```

O ícone: o ilustrado onde a D80 desenhou um, e o `lucide` num ladrilho nos outros.

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › o ícone ilustrado é de Início
-  if ('lugar' in icone) {
+  if (false) {
```

O "Sair" tem a medida e o desenho do lugar vizinho, aberto e no trilho (RF15; D59).

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/MenuDaPessoa.test.tsx › o "Sair" tem a medida de um lugar
-  return `${FORMA_DO_LUGAR} t-rotulo border-transparent text-sutil enabled:hover:bg-fundo-suave enabled:hover:text-tinta disabled:text-inativo ${trilho ? LUGAR_NO_TRILHO : LUGAR_ABERTO}`
+  return `${FORMA_DO_LUGAR} t-rotulo border-transparent text-sutil enabled:hover:bg-fundo-suave enabled:hover:text-tinta disabled:text-inativo ${LUGAR_ABERTO}`
```

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/MenuDaPessoa.test.tsx › o "Sair" tem a medida de um lugar
-  return `${FORMA_DO_LUGAR} t-rotulo border-transparent text-sutil enabled:hover:bg-fundo-suave enabled:hover:text-tinta disabled:text-inativo ${trilho ? LUGAR_NO_TRILHO : LUGAR_ABERTO}`
+  return `${FORMA_DO_LUGAR} t-rotulo text-sutil enabled:hover:bg-fundo-suave enabled:hover:text-tinta disabled:text-inativo ${trilho ? LUGAR_NO_TRILHO : LUGAR_ABERTO}`
```

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/MenuDaPessoa.test.tsx › o "Sair" tem a medida de um lugar
-  return `${FORMA_DO_LUGAR} t-rotulo border-transparent text-sutil enabled:hover:bg-fundo-suave enabled:hover:text-tinta disabled:text-inativo ${trilho ? LUGAR_NO_TRILHO : LUGAR_ABERTO}`
+  return `${FORMA_DO_LUGAR} t-rotulo border-transparent text-sutil enabled:hover:bg-fundo-suave enabled:hover:text-tinta ${trilho ? LUGAR_NO_TRILHO : LUGAR_ABERTO}`
```

O pé da lateral: as iniciais e o "Saindo…".

```mutacao
arquivo: apps/web/src/componentes/MenuDaPessoa.tsx
teste: apps/web/src/componentes/MenuDaPessoa.test.tsx › o pé mostra as iniciais
-            <span data-iniciais="" aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-laranja text-[15px] leading-none font-bold text-sobre-cor">
+            <span data-iniciais="" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-laranja text-[15px] leading-none font-bold text-sobre-cor">
```

```mutacao
arquivo: apps/web/src/componentes/MenuDaPessoa.tsx
teste: apps/web/src/componentes/MenuDaPessoa.test.tsx › nome só de espaços
-          {iniciais !== '' && (
+          {true && (
```

```mutacao
arquivo: apps/web/src/componentes/MenuDaPessoa.tsx
teste: apps/web/src/componentes/MenuDaPessoa.test.tsx › a primeira letra da primeira e da última palavra
-  const ultima = palavras.length > 1 ? palavras[palavras.length - 1] : undefined
+  const ultima = palavras[palavras.length - 1]
```

```mutacao
arquivo: apps/web/src/componentes/MenuDaPessoa.tsx
teste: apps/web/src/componentes/MenuDaPessoa.test.tsx › a primeira letra da primeira e da última palavra
-    .toLocaleUpperCase('pt-BR')
+    .toLocaleLowerCase('pt-BR')
```

```mutacao
arquivo: apps/web/src/componentes/MenuDaPessoa.tsx
teste: apps/web/src/componentes/MenuDaPessoa.test.tsx › "Saindo…" desliga o botão
-  const rotulo = saindo ? 'Saindo…' : 'Sair'
+  const rotulo = 'Sair'
```

```mutacao
arquivo: apps/web/src/componentes/MenuDaPessoa.tsx
teste: apps/web/src/componentes/MenuDaPessoa.test.tsx › "Saindo…" desliga o botão
-        <button type="button" onClick={aoSair} disabled={saindo} className={classeDoBotaoDeLugar(true)}>
+        <button type="button" onClick={aoSair} className={classeDoBotaoDeLugar(true)}>
```

```mutacao
arquivo: apps/web/src/componentes/MenuDaPessoa.tsx
teste: apps/web/src/componentes/MenuDaPessoa.test.tsx › "Saindo…" desliga o botão
-      <button type="button" onClick={aoSair} disabled={saindo} className={classeDoBotaoDeLugar(false)}>
+      <button type="button" onClick={aoSair} className={classeDoBotaoDeLugar(false)}>
```

A lateral recolhida (RF13, RF24): a chave não muda, o valor é só `sim`, e o armazenamento recusado não derruba a tela.

```mutacao
arquivo: apps/web/src/componentes/lateral-recolhida.ts
teste: apps/web/src/componentes/lateral-recolhida.test.ts › a chave é a de sempre
-export const CHAVE_DA_LATERAL_RECOLHIDA = 'educa.lateral-recolhida'
+export const CHAVE_DA_LATERAL_RECOLHIDA = 'educa.lateral'
```

```mutacao
arquivo: apps/web/src/componentes/lateral-recolhida.ts
teste: apps/web/src/componentes/lateral-recolhida.test.ts › só `sim` recolhe
-    return window.localStorage.getItem(CHAVE_DA_LATERAL_RECOLHIDA) === 'sim'
+    return window.localStorage.getItem(CHAVE_DA_LATERAL_RECOLHIDA) !== null
```

```mutacao
arquivo: apps/web/src/componentes/lateral-recolhida.ts
teste: apps/web/src/componentes/lateral-recolhida.test.ts › `getItem` que lança
     return window.localStorage.getItem(CHAVE_DA_LATERAL_RECOLHIDA) === 'sim'
   } catch {
-    return false
+    return true
   }
```

```mutacao
arquivo: apps/web/src/componentes/lateral-recolhida.ts
teste: apps/web/src/componentes/lateral-recolhida.test.ts › a chave é a de sempre
-    if (recolhida) window.localStorage.setItem(CHAVE_DA_LATERAL_RECOLHIDA, 'sim')
+    if (recolhida) window.localStorage.setItem(CHAVE_DA_LATERAL_RECOLHIDA, 'true')
```

```mutacao
arquivo: apps/web/src/componentes/lateral-recolhida.ts
teste: apps/web/src/componentes/lateral-recolhida.test.ts › abrir apaga a chave
     if (recolhida) window.localStorage.setItem(CHAVE_DA_LATERAL_RECOLHIDA, 'sim')
-    else window.localStorage.removeItem(CHAVE_DA_LATERAL_RECOLHIDA)
```

```mutacao
arquivo: apps/web/src/componentes/lateral-recolhida.ts
teste: apps/web/src/componentes/lateral-recolhida.test.ts › `setItem` e `removeItem` que lançam
     else window.localStorage.removeItem(CHAVE_DA_LATERAL_RECOLHIDA)
-  } catch {
+  } catch (erro) {
+    throw erro
```

O nome do primeiro lugar do professor.

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/areas/navegacao.test.ts
-    { rotulo: 'Início', caminho: ROTAS.novaConversa, icone: { lugar: 'inicio' }, tambemEm: [ROTAS.conversa] },
+    { rotulo: 'Nova conversa', caminho: ROTAS.novaConversa, icone: { lugar: 'inicio' }, tambemEm: [ROTAS.conversa] },
```

O pé da lateral aberta fica fora do que rola (RF15, A18; D59): só o alto rola, e o "Sair" fica inteiro dentro da janela a
1366 × 600. A mutação devolve o pé para dentro do contêiner de `overflow-y-auto`.

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: e2e/casca.spec.ts › os nomes acessíveis não mudam
         <SecaoDoTime agentes={time} esperando={esperando} trilho={false} />
-      </div>
       <div className="flex shrink-0 flex-col gap-2">
         <ListaDeItens itens={rodape} rotulo={NOME_DO_RODAPE} trilho={false} />
         <MenuDaPessoa nome={pessoa?.nome} papel={pessoa?.papel} aoSair={aoSair} saindo={saindo} itens={menuDaPessoa} />
       </div>
+      </div>
     </div>
```

O alto que rola tem folga de 6 px, maior que o anel de foco (3 px de contorno e 2 de afastamento), e o `overflow` não o corta
(regra 50, item 11). A mutação tira a margem negativa e a folga.

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: e2e/casca.spec.ts › a lateral aberta percorrida só com Tab
-      <div className="-m-1.5 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-1.5">
+      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
```

O seletor de 48 px: o botão e as linhas da lista.

```mutacao
arquivo: apps/web/src/componentes/SeletorDeEscola.tsx
teste: apps/web/src/componentes/SeletorDeEscola.test.tsx › o botão e cada linha da lista
-        className="degrau degrau-borda flex min-h-12 w-full min-w-0 items-center gap-2 rounded-controle border-2 border-borda bg-fundo px-3 py-2 text-left hover:bg-fundo-suave"
+        className="degrau degrau-borda flex min-h-11 w-full min-w-0 items-center gap-2 rounded-controle border-2 border-borda bg-fundo px-3 py-2 text-left hover:bg-fundo-suave"
```

```mutacao
arquivo: apps/web/src/componentes/SeletorDeEscola.tsx
teste: apps/web/src/componentes/SeletorDeEscola.test.tsx › o botão e cada linha da lista
-                  className="flex min-h-12 w-full min-w-0 items-center gap-2 rounded-controle px-2 py-2 text-left hover:bg-fundo-suave aria-disabled:cursor-wait"
+                  className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-controle px-2 py-2 text-left hover:bg-fundo-suave aria-disabled:cursor-wait"
```

A borda de 2 px da lateral e do trilho (12.1, "borda de 2").

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: e2e/casca.spec.ts › W12: as medidas da D80 no computador
-          <div className="sticky top-0 flex h-screen w-64 shrink-0 flex-col self-start border-r-2 border-borda bg-lateral">
+          <div className="sticky top-0 flex h-screen w-64 shrink-0 flex-col self-start border-r border-borda bg-lateral">
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: e2e/casca.spec.ts › W12: as medidas da D80 no computador
-    <div className="sticky top-0 z-10 flex h-screen w-22 shrink-0 flex-col items-center gap-3 self-start border-r-2 border-borda bg-lateral py-3">
+    <div className="sticky top-0 z-10 flex h-screen w-22 shrink-0 flex-col items-center gap-3 self-start border-r border-borda bg-lateral py-3">
```

O ladrilho na família do lugar e na do agente (12.2).

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › o ícone ilustrado é de Início
-    <Ladrilho familia={icone.familia} tamanho={36}>
+    <Ladrilho familia="azul" tamanho={36}>
```

```mutacao
arquivo: apps/web/src/componentes/itens-da-lateral.tsx
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › cada agente tem o ícone da função num ladrilho
-                  <Ladrilho familia={item.familia} tamanho={36}>
+                  <Ladrilho familia="azul" tamanho={36}>
```

A casca, no navegador: as medidas da D80 (A84) e a escolha guardada.

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: e2e/casca.spec.ts › W12: a moldura de 1200 px, com a margem de 32 px
-    <main className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-1 flex-col gap-6 px-4 pt-4 pb-8 md:px-8 md:pt-5">{children}</main>
+    <main className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-1 flex-col gap-6 px-4 pt-4 pb-8 md:px-8 md:pt-5">{children}</main>
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: e2e/casca.spec.ts › W12: a moldura de 1200 px, com a margem de 32 px
-    <main className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-1 flex-col gap-6 px-4 pt-4 pb-8 md:px-8 md:pt-5">{children}</main>
+    <main className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-1 flex-col gap-6 px-4 pt-4 pb-8 md:px-4 md:pt-5">{children}</main>
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: e2e/casca.spec.ts › W12: as medidas da D80 no computador
-          <div className="sticky top-0 flex h-screen w-64 shrink-0 flex-col self-start border-r-2 border-borda bg-lateral">
+          <div className="sticky top-0 flex h-screen w-60 shrink-0 flex-col self-start border-r-2 border-borda bg-lateral">
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: e2e/casca.spec.ts › W12: as medidas da D80 no computador
-    <div className="sticky top-0 z-10 flex h-screen w-22 shrink-0 flex-col items-center gap-3 self-start border-r-2 border-borda bg-lateral py-3">
+    <div className="sticky top-0 z-10 flex h-screen w-20 shrink-0 flex-col items-center gap-3 self-start border-r-2 border-borda bg-lateral py-3">
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: e2e/casca.spec.ts › W12: recolher a lateral para o trilho fica guardado
-  const [recolhida, definirRecolhida] = useState(lerRecolhida)
+  const [recolhida, definirRecolhida] = useState(false)
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: e2e/casca.spec.ts › W12: recolher a lateral para o trilho fica guardado
     definirRecolhida(valor)
-    guardarRecolhida(valor)
   }
```

A sessão de uma pessoa não passa à seguinte (pedidas pelo `tenancy-guardian`).

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: e2e/inatividade.spec.ts › Chromebook do carrinho
-    if (lembrarQuemEsta(dados)) navegar(ROTAS.inicio, { replace: true })
+    lembrarQuemEsta(dados)
```

A gaveta fechar na troca de pessoa ou de escola (`usuarioDaSessao` nas dependências do efeito, `CascaDaEscola.tsx`) **não tem
bloco `mutacao`**, e esta tarefa não afirma que tem. A cláusula é anterior a ela (o `HEAD` tem o mesmo efeito; a 12.0 só trocou
rótulo e comentário ali). A gaveta existe abaixo de 1024 px (`gavetaNaPagina = faixa !== 'larga'`: de 768 a 1023 px ela abre por
cima, e abaixo de 768 px é a barra do celular), e o teste que a cita, `areas › troca de escola pelo seletor…`, foi rodado à mão
no projeto `celular` em 15/10/2026 com três variantes sobre o fonte e o ambiente reconstruído a cada uma:

| Variante | `areas › troca de escola pelo seletor…` no `celular` |
|---|---|
| a do tenancy-guardian: `}, [caminho, usuarioDaSessao, fecharGaveta])` → `}, [caminho, fecharGaveta])` | **verde** |
| `usuarioDaSessao` trocado por `usuarioDaSessao === undefined` | **verde** |
| o efeito inteiro tirado (a gaveta nunca fecha na troca) | vermelho (`toBeHidden`) |

O teste prova que a gaveta não fica aberta por cima depois da troca, e não que a pessoa nova a fecharia sem o `caminho`
mudar: a troca navega por `ROTAS.inicio` e a tela abre em "Início" outra vez, e o `caminho` que muda no meio já fecha a
gaveta. A prova da dependência `usuarioDaSessao` pede um teste de componente com a pessoa trocando **sob o mesmo
`caminho`**, de 768 a 1023 px, que cabe na 13.0 (ela mexe na gaveta). Fica registrada em "Recomendações sem aplicar".

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | A preferência da lateral recolhida continua de uma pessoa para a seguinte no Chromebook do carrinho; se o navegador passar a guardar algo da pessoa, a troca de sessão precisa limpar | Sem ação: pré-existente (já era assim em `HEAD`) e não é dado pessoal. Reabre se entrar chave com dado da pessoa em `localStorage` |
| privacy-guardian (1ª) | Renomear `TITULO_DA_NOVA_CONVERSA` (`e2e/__fixtures__/casca.ts`) | `TODO.md`: renomear quando os specs que a usam forem mexidos de novo; a constante é lida por specs fora desta tarefa |
| frontend-reviewer (1ª) | Teste de unidade de que o pé é irmão do contêiner que rola | Coberto pelos itens 1 e 2 (o e2e a 1366×600 com a mutação do pé); um segundo teste de classe repetiria a mesma cláusula |
| frontend-reviewer (1ª), revisor-geral (1ª) | O papel aparece em minúscula e no masculino sob o nome (`NOME_DO_PAPEL`) | `papeis.ts` está fora dos "Arquivos previstos"; vai para a tarefa que mexer nele, e para `TODO.md` se nenhuma mexer até a X3 |
| frontend-reviewer (1ª) | O `Aparência` ocupa 60 px do pé em todo papel; seletor mais compacto | 13.0 (barra de baixo e gaveta) ou X2; mede-se de novo depois do item 1 |
| test-engineer (1ª) | Contraste 3:1 da borda `azul-borda` do aceso sobre `lateral` (WCAG 1.4.11) | Levada ao prompt do `frontend-reviewer` na próxima rodada, que a vê pelas fotos; sem bloco novo aqui |
| test-engineer (1ª) | Comentários "Nova conversa" em `e2e/inatividade.spec.ts:50`, `convite.spec.ts:187`, `entrar.spec.ts:44`, `escola-e-vinculos.spec.ts:57`, `operacao.spec.ts:327`, `professores.spec.ts:507`, `professor-assistente.spec.ts:68` e `__fixtures__/fluxo-do-professor.ts:34` | `TODO.md`: são comentários em specs fora desta tarefa; mexer neles caduca revisão de spec que não é da 12.0 |
| revisor-geral (1ª), test-engineer (1ª) | Teste de componente da gaveta fechando quando a pessoa muda sob o mesmo `caminho` (dependência `usuarioDaSessao`), de 768 a 1023 px no `chromebook` | 13.0, que mexe na gaveta e onde o teste cabe; a cláusula é anterior a esta tarefa e a seção "Mutações" corrige o que o documento afirma |
| frontend-reviewer (2ª) | A borda `azul-borda` do aceso está em 1,62:1 (claro) e 2,17:1 (escuro) sobre a lateral; o par é o da D80 e do `docs/interface.md` 11.1 | `/validar` ou X2, como decisão de token para o produto inteiro; a mesma combinação vale em telas já aprovadas |
| frontend-reviewer (2ª) | Trilho da coordenação a 600 px passa em `ratio: 1`, mas sem folga, e o trilho não rola | `TODO.md` (entrada "O trilho da coordenação não tem folga a 600 px"); reabre com o oitavo lugar |
| frontend-reviewer (2ª) | "Esperando você" some na Home da professora na escola vazia (regra 50, item 6) | `/validar`; comportamento anterior à tarefa (o diff de `Home.tsx` só troca o rótulo) |
| revisor-geral (2ª), tenancy-guardian (2ª), privacy-guardian (2ª), test-engineer (2ª) | Teste de componente da gaveta fechando com a pessoa trocando sob o mesmo `caminho`, com a mutação que remove `usuarioDaSessao` das dependências do efeito; "a gaveta fecha" segue "sem edição" em `13_task.md` | 13.0: o Arquiteto o acrescenta ao `13_task.md` quando o Orquestrador pedir o contexto dela; o `privacy-guardian` confere quando existir |
| test-engineer (3ª) | Em `e2e/casca.spec.ts`, afirmar que o anel lido é de pelo menos 5 (ou `focoVisivel` verdadeiro), para a conferência do alto não passar sem medir se o `focus()` por programa zerar o anel | 13.0, que volta a `casca.spec.ts`; a conferência de esquerda e direita já é feita com Tab e fica protegida |
| test-engineer (3ª) | Medir também o anel na coordenação, que tem mais lugares e rola mais cedo | 13.0, junto do item acima |
| revisor-geral (3ª) | O e2e do anel só olha a borda de cima na primeira parada; a 600 px o anel de "Assistente de ensino" ou "Tutor" pode ficar cortado embaixo e o teste continuaria verde (medir a borda de baixo na última parada de "Seu time", ou `scroll-padding` no alto que rola) | `/validar` ou X2, onde o `frontend-reviewer` vê a tela baixa; a entrada do trilho a 600 px no `TODO.md` trata da mesma altura |
| revisor-geral (3ª) | `anelCortadoPeloQueRola` acha o contêiner por `.overflow-y-auto`; um `data-` próprio seria mais estável | 13.0, junto do primeiro item; se a classe mudar, o teste falha, só a mensagem confunde |
| frontend-reviewer (3ª) | A lateral da coordenação a 768 px de altura corta "PRIVACIDADE" pela metade, sem dica de que rola (degradê ou borda no pé do que rola) | `/validar` ou X2 |
| privacy-guardian (3ª) | Renomear `TITULO_DA_NOVA_CONVERSA` para `TITULO_DO_INICIO` | Já está em `TODO.md` (entrada escrita na rodada 2); nada a acrescentar |

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
| 2026-10-15 18:14:12 | 2026-10-15 18:14:25 | `tenancy-guardian` | 1 | APROVADO | a512fdbef19520609 |
| 2026-10-15 18:14:16 | 2026-10-15 18:14:54 | `privacy-guardian` | 1 | APROVADO | a4aff3ef4d81f1459 |
| 2026-10-15 18:14:09 | 2026-10-15 18:15:33 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | adc70511df51c2064 |
| 2026-10-15 18:14:22 | 2026-10-15 18:16:47 | `revisor-geral` | 1 | REPROVADO | adb769606ed10e9ab |
| 2026-10-15 18:14:19 | 2026-10-15 18:17:20 | `test-engineer` | 1 | REPROVADO | a6d82a3939b07b406 |
| 2026-10-15 18:43:59 | 2026-10-15 18:44:15 | `tenancy-guardian` | 2 | APROVADO | abdfd76a04716b7e8 |
| 2026-10-15 18:44:04 | 2026-10-15 18:44:20 | `privacy-guardian` | 2 | APROVADO | a613409dbe0d84fb5 |
| 2026-10-15 18:43:46 | 2026-10-15 18:44:34 | `revisor-geral` | 2 | APROVADO | ae6337aa2eb6567c4 |
| 2026-10-15 18:43:39 | 2026-10-15 18:45:12 | `frontend-reviewer` | 2 | APROVADO | a0bf3839514bd5109 |
| 2026-10-15 18:43:54 | 2026-10-15 18:45:40 | `test-engineer` | 2 | REPROVADO | abf63f72a32dd9cda |
| 2026-10-15 19:16:29 | 2026-10-15 19:16:38 | `tenancy-guardian` | 3 | APROVADO | aea632849bddc020e |
| 2026-10-15 19:16:33 | 2026-10-15 19:16:45 | `privacy-guardian` | 3 | APROVADO | ad83fef8cf432d685 |
| 2026-10-15 19:16:18 | 2026-10-15 19:16:47 | `frontend-reviewer` | 3 | APROVADO | a2652568595ac15fb |
| 2026-10-15 19:16:24 | 2026-10-15 19:16:48 | `revisor-geral` | 3 | APROVADO | a38449a67cb294550 |
| 2026-10-15 19:16:06 | 2026-10-15 19:17:10 | `test-engineer` | 3 | APROVADO | a8f332c0e77348eef |

# Tarefa 14.0 — A entrada e as páginas públicas na moldura nova

**Funcionalidade:** pele-e-casca · **Depende de:** 4.0, 6.0
**Subagentes obrigatórios:** `frontend-reviewer`, `infra-guardian`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

As páginas de fora da sessão aparecem divididas a partir de 1024 px (painel com a pinta, cartão do formulário) e
empilhadas abaixo. Nenhuma mensagem de erro, ordem de campo ou resposta muda.

## Contexto necessário

- `techspec.md` 9 (**Casca pública e operação**), 7c (a entrada está em 127 de 150 kB) e 10; `prd.md` RF20
- `cenarios.md`: A5 (`tokens.spec:160` e `:162`), A6, A8, A11, A12, A96, A98; parte B: `entrarPorEmail`, `entrarComoAluno`
- `docs/interface.md` 11.3 e 9.6 (a pinta parada e apagada)
- Regra 20, itens 6 e 8 (não encontrado e sem permissão respondem igual); regra 50, itens 2a e 12
- Código: `componentes/CascaPublica.tsx` (cabeçalho com `Marca`, `main` de `max-w-md`); `paginas/Entrar.tsx` (monta a
  moldura e escreve os dois `<input>` à mão); `paginas/TurmaPublica.tsx` (campos à mão); `paginas/SemDesafio.tsx`

## Subtarefas

- [x] 14.1 — `CascaPublica`: de 1024 px, o painel `papel` à esquerda, com a marca e a pinta parada (`img` com `alt=""`,
  sem animação), e o cartão do formulário à direita; abaixo disso empilha. Um `banner`, um `main` e o `h1` do título
- [x] 14.2 — `Entrar.tsx` passa à `CascaPublica`; os campos de `Entrar.tsx` e de `TurmaPublica.tsx` passam a `Campo` e
  `CampoDeSenha`, com o mesmo rótulo, a mesma ordem, o mesmo `autoComplete` e `maxLength`. As outras páginas ganham a
  moldura sem edição própria. `SemDesafio.tsx` fica à mão (A12): trocá-la pelo `Aviso` mexeria em `casca.spec.ts`
- [x] 14.3 — Meça a entrada e o CSS em brotli, antes e depois, e escreva em "Divergências". O painel não pede imagem nova:
  é o `turmma-pinta.svg` que a lateral já usa
- [x] 14.4 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/CascaPublica.tsx` e `CascaPublica.test.tsx` | alterado e novo |
| `apps/web/src/paginas/Entrar.tsx`, `TurmaPublica.tsx` | alterados |
| `e2e/casca-publica.spec.ts` | novo |
| `e2e/tokens.spec.ts` | alterado (A5, os dois campos) |
| `docs/interface.md` | alterado (11.3, só se divergir) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| divide a 1024, empilha a 1023 | e2e | painel à esquerda do cartão a 1024 e 1366 px; acima dele a 1023 e a 360; sem rolagem de lado |
| a marca à vista | e2e | `tokens › a marca vem dos SVGs em curvas…` sem edição: pinta carregada com `alt=""`, "Turmma" e um `banner` (A8) |
| a moldura | componente | um `banner` com a marca, um `main`, um `h1` com o título e o filho depois |
| os campos | e2e | foco de 3 px na cor `foco`, afastamento 0 nos campos de e-mail e senha (A5) |
| alvo de 44 px | e2e | os botões das páginas, sem edição (A96) |
| as mesmas mensagens | e2e | sem edição: `entrar › senha errada e e-mail que não existe…`, `entrar-na-escola › isolamento…`, `convite › W14: convite expirado, revogado…` (a mesma tela, A98) |
| o segredo continua em texto | e2e | `mfa › configura copiando o segredo em texto…` sem edição |
| nada novo no navegador | e2e | `entrar › privacidade…` e `turma-publica › …nada fica no navegador…` sem edição |
| aviso e carga | e2e | `casca › o aviso de atenção…` (A11, A12) e `entrar › rajada das 7h30…` sem edição; a entrada abaixo de 150 kB |
| recomeço | e2e | `convite › recomeço, mesmo link…`, `…resposta atrasada…`; `turma-publica › mesma entrada…`, `resposta atrasada…`; `acesso-suspenso › recomeço no Chromebook do carrinho…`, sem edição |

## Como testar

- e2e a copiar: `entrar.spec.ts › caminho feliz só com toque…`; largura por `page.setViewportSize`, como em `casca.spec.ts › W12`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/CascaPublica.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/casca-publica.spec.ts e2e/entrar.spec.ts e2e/mfa.spec.ts e2e/convite.spec.ts`
- Armadilha: o nome acessível dos campos ("E-mail", "Senha") não pode mudar
- Armadilha: `tokens.spec.ts` também é editado pela 13.0, em outras linhas
- **Telas**: sem sessão, `/entrar`; `/e/colegio-aurora`; `/mfa`; um link de convite; `/e/colegio-aurora/turma`; a 1366 e a
  360 px. Mockup: `/entrar`

## Fora do escopo desta tarefa

`paginas/Casca.tsx` (`/sistema`), `NaoEncontrada.tsx`, texto novo e a operação (15.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `paginas/TurmaPublica.tsx` **não é alterada**: os campos dela (`Código da turma`, `Matrícula`, `Crie uma senha`) já eram `Campo` e `CampoDeSenha` desde a 17.0 da A1, e só o rádio dos nomes livres está à mão (é uma lista de opções, e não um campo de texto) | A subtarefa 14.2 e "Arquivos previstos" a davam por à mão; o código já estava na peça (a `techspec.md` nunca os descreveu como escritos à mão: o erro era só da descrição de código do documento da tarefa, e não da arquitetura). Trocar o rádio por `Opcao` muda o desenho da escolha do nome (`turma-publica.spec`), e o texto, a ordem e a resposta da tela não podem mudar (RF20) | `techspec.md` 9 (**Casca pública e operação**: "Textos, ordem de campo e mensagens não mudam"); `cenarios.md` A5 |
| A pinta grande do painel fica **fora do `banner`**, num `img` irmão do `header`, dentro de um contêiner `data-painel-publico`; o `banner` continua com a marca e uma pinta só | `tokens.spec › a marca vem dos SVGs em curvas…` (A8) lê `img[src="/marca/turmma-pinta.svg"]` dentro do `banner` com `toBeVisible()`, que em modo estrito reprova com duas imagens iguais. Sem editar o spec (a tarefa manda "sem edição"), a pinta parada tem de estar fora do `banner` | `techspec.md` 9; `cenarios.md` A8; `docs/interface.md` 9.6 e 11.3 (o painel "com a marca e a pinta parada") |
| `e2e/tokens.spec.ts` ganha o afastamento `0px` também no caso do **escuro** (`foco de 3 px nos componentes, no escuro…`), que percorre os mesmos dois campos de `/entrar`; a tarefa só citava o caso do claro (`:160` e `:162`) | Os dois casos usam os mesmos campos, e o do escuro ficaria vermelho com o `Campo` (anel com afastamento 0) | `cenarios.md` A5 (as duas paradas de campo de e-mail e de senha, nos dois temas) |
| **O aviso de `/mfa` (A12) fica escrito à mão**, em `paginas/SemDesafio.tsx`, com as cores e a borda de hoje: `pendente-cx #FDF0E8`, `pendente #8A3E0C` e borda de 1 px sólida. Não passa à peça `Aviso` | Passar ao `Aviso` de atenção trocaria o fundo para `amarelo-claro`, a borda para 2 px em `amarelo-borda` e o texto para `tinta`, e mexeria no oráculo de `casca.spec.ts › o aviso de atenção…` (A12) e na lista de classes da A11, que seguem valendo enquanto alguma tela usar `pendente-cx` e `erro-cx`. A tarefa manda o aviso "à mão" e o caso sem edição | `cenarios.md` A12 (**Decidido na 14.0**) e "O que ficou em aberto", item 5 (**Fechado na 14.0**) |
| A senha de `/entrar` é o `Campo` com `type="password"`, e não o `CampoDeSenha` que a subtarefa 14.2 cita | O `CampoDeSenha` põe o botão "Mostrar a senha" entre a senha e o "Entrar": uma parada de Tab a mais, que muda a ordem que `tokens.spec` (A5) e `entrar.spec` percorrem e que a RF20 manda manter. A senha de quem já tem conta não precisa de "Mostrar": ele serve a quem **cria** a senha (convite, página da turma). O `Campo` leva o mesmo rótulo, `autoComplete="current-password"` e `maxLength` | `techspec.md` 9 (**Casca pública**: "ordem de campo não muda"); `cenarios.md` A5 |
| `docs/interface.md` 11.3 **não muda**: o painel `papel` com a marca e a pinta parada, o cartão à direita a partir de 1024 px e a pilha abaixo já são o que o documento diz | A subtarefa só mandava alterá-lo "se divergir" | `docs/interface.md` 11.3 e 9.6 |
| **A entrada e o CSS, medidos em brotli (qualidade 11), antes e depois**: `index-*.js` de **92.113 para 92.069 bytes** (−44) e `index-*.css` de **8.099 para 8.265 bytes** (+166); soma do que a entrada carrega sobe 122 bytes, longe dos 150 kB do teto. O painel não pede imagem nova: é o `turmma-pinta.svg` que a marca já usa, e nada entra por `import()` | O JS cai porque `Entrar.tsx` deixa de repetir a caixa do campo e o cabeçalho; o CSS cresce com as utilidades do painel (`lg:grid`, `bg-papel`, `size-80`, `opacity-15`) | `techspec.md` 7c (**Orçamento**: "medidos em brotli antes e depois, em cada tarefa que os toca") |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

`Entrar.tsx` não traz cláusula nova: os dois campos passam a ser o `Campo`, cuja regra (anel com afastamento 0, nome
acessível, `required`) é da 4.0 e tem a mutação dela. Aqui entram as cláusulas da moldura, que são o que o código desta
tarefa acrescenta. A divisão e o empilhamento são medidos no navegador (a unidade não enxerga CSS); a estrutura (o
`banner`, o `main`, o `h1` e a ordem do filho) é do teste de componente.

A divisão a 1024 px e o empilhamento abaixo dela: a grade de duas colunas só do `lg`, e o `lg` que a limita.

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: e2e/casca-publica.spec.ts › a 1024 e a 1366 px o painel fica
-    <div className="min-h-screen bg-fundo text-tinta lg:grid lg:grid-cols-2">
+    <div className="min-h-screen bg-fundo text-tinta">
```

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: e2e/casca-publica.spec.ts › a 1023 e a 360 px empilha
-    <div className="min-h-screen bg-fundo text-tinta lg:grid lg:grid-cols-2">
+    <div className="min-h-screen bg-fundo text-tinta grid grid-cols-2">
```

O formulário centrado na altura do painel, e a pinta parada: só do computador, apagada e inteira dentro do painel.

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: e2e/casca-publica.spec.ts › a 1024 e a 1366 px o painel fica
-      <div className="flex justify-center px-4 py-6 sm:px-6 lg:items-center lg:px-10 lg:py-12">
+      <div className="flex justify-center px-4 py-6 sm:px-6 lg:px-10 lg:py-12">
```

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: e2e/casca-publica.spec.ts › a 1024 e a 1366 px o painel fica
-          className="pointer-events-none absolute right-10 bottom-10 hidden size-80 opacity-15 select-none lg:block"
+          className="pointer-events-none absolute -right-10 bottom-10 hidden size-80 opacity-15 select-none lg:block"
```

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: e2e/casca-publica.spec.ts › a 1023 e a 360 px empilha
-          className="pointer-events-none absolute right-10 bottom-10 hidden size-80 opacity-15 select-none lg:block"
+          className="pointer-events-none absolute right-10 bottom-10 size-80 opacity-15 select-none"
```

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: e2e/casca-publica.spec.ts › a pinta do painel está parada e apagada
-          className="pointer-events-none absolute right-10 bottom-10 hidden size-80 opacity-15 select-none lg:block"
+          className="pointer-events-none absolute right-10 bottom-10 hidden size-80 select-none lg:block"
```

As faces: o painel é o `papel` e o cartão é a `superficie`, nos dois temas (a cor sem nome some calada, como o A11 já viu).

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: e2e/casca-publica.spec.ts › dos dois temas, e o cartão é a
-      <div data-painel-publico="" className="relative border-b-2 border-borda bg-papel lg:border-r-2 lg:border-b-0">
+      <div data-painel-publico="" className="relative border-b-2 border-borda lg:border-r-2 lg:border-b-0">
```

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: e2e/casca-publica.spec.ts › dos dois temas, e o cartão é a
-        <main data-cartao-publico="" className="flex w-full max-w-md flex-col gap-6 lg:rounded-cartao lg:border-2 lg:border-borda lg:bg-superficie lg:p-8">
+        <main data-cartao-publico="" className="flex w-full max-w-md flex-col gap-6 lg:rounded-cartao lg:border-2 lg:border-borda lg:p-8">
```

A estrutura: o `banner` é o `header`, o título é o `h1`, o filho vem depois dele, e a pinta do painel é decorativa.

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: apps/web/src/componentes/CascaPublica.test.tsx › tem um banner com a marca
-        <header className="relative px-4 py-3 sm:px-6 lg:px-10 lg:py-10">
-          <Marca />
-        </header>
+        <div className="relative px-4 py-3 sm:px-6 lg:px-10 lg:py-10">
+          <Marca />
+        </div>
```

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: apps/web/src/componentes/CascaPublica.test.tsx › tem um banner com a marca
-          <h1 className="t-titulo break-words">{titulo}</h1>
+          <h2 className="t-titulo break-words">{titulo}</h2>
```

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: apps/web/src/componentes/CascaPublica.test.tsx › tem um banner com a marca
-          <h1 className="t-titulo break-words">{titulo}</h1>
-          {children}
+          {children}
+          <h1 className="t-titulo break-words">{titulo}</h1>
```

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: apps/web/src/componentes/CascaPublica.test.tsx › a pinta do painel é decorativa
           src="/marca/turmma-pinta.svg"
-          alt=""
+          alt="Turmma"
```


A largura do cartão e o nome comprido: `max-w-md` prende o formulário a 448 px a 1366 px, e `break-words` quebra a palavra
que não tem espaço; sem ele o título comprido de uma escola faz a página rolar de lado a 360 px. Os `min-w-0` que a coluna
e o `main` tinham foram retirados: a mutação de cada um sobrevivia (a coluna é filha de uma grade de `minmax(0, 1fr)` e,
abaixo de 1024 px, de um bloco; o `main` tem `w-full`, que já limita o mínimo automático do item).

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: e2e/casca-publica.spec.ts › a 1024 e a 1366 px o painel fica
-        <main data-cartao-publico="" className="flex w-full max-w-md flex-col gap-6 lg:rounded-cartao lg:border-2 lg:border-borda lg:bg-superficie lg:p-8">
+        <main data-cartao-publico="" className="flex w-full flex-col gap-6 lg:rounded-cartao lg:border-2 lg:border-borda lg:bg-superficie lg:p-8">
```

```mutacao
arquivo: apps/web/src/componentes/CascaPublica.tsx
teste: e2e/casca-publica.spec.ts › o nome comprido e sem espaço quebra
-          <h1 className="t-titulo break-words">{titulo}</h1>
+          <h1 className="t-titulo">{titulo}</h1>
```

Os dois campos de `/entrar`, que passaram de `<input>` à mão ao `Campo`: o que cada um carrega é o que o preenchimento do
navegador, o teclado do celular e o teto da API leem. O que a ordem pede é o preenchimento e o teto de cada campo, mais o
teclado do e-mail e o `required` dos dois.

```mutacao
arquivo: apps/web/src/paginas/Entrar.tsx
teste: e2e/casca-publica.spec.ts › os dois campos têm o rótulo
-          autoComplete="username"
+          autoComplete="off"
```

```mutacao
arquivo: apps/web/src/paginas/Entrar.tsx
teste: e2e/casca-publica.spec.ts › os dois campos têm o rótulo
-          autoComplete="current-password"
+          autoComplete="off"
```

```mutacao
arquivo: apps/web/src/paginas/Entrar.tsx
teste: e2e/casca-publica.spec.ts › os dois campos têm o rótulo
-          maxLength={TAMANHO_MAXIMO_EMAIL}
+          maxLength={TAMANHO_MAXIMO_EMAIL + 1}
```

```mutacao
arquivo: apps/web/src/paginas/Entrar.tsx
teste: e2e/casca-publica.spec.ts › os dois campos têm o rótulo
-          maxLength={TAMANHO_MAXIMO_SENHA}
+          maxLength={TAMANHO_MAXIMO_SENHA - 1}
```

```mutacao
arquivo: apps/web/src/paginas/Entrar.tsx
teste: e2e/casca-publica.spec.ts › os dois campos têm o rótulo
-          inputMode="email"
+          inputMode="text"
```

```mutacao
arquivo: apps/web/src/paginas/Entrar.tsx
teste: e2e/casca-publica.spec.ts › os dois campos têm o rótulo
           spellCheck={false}
-          required
           maxLength={TAMANHO_MAXIMO_EMAIL}
```

```mutacao
arquivo: apps/web/src/paginas/Entrar.tsx
teste: e2e/casca-publica.spec.ts › os dois campos têm o rótulo
           autoComplete="current-password"
-          required
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (2ª) | `Entrar.tsx`: os dois avisos continuam `<p>` à mão (`border-pendente`, `bg-pendente-cx`) e o `Aviso` existe como peça; reavaliar quando alguma tela largar `pendente-cx` | `/retro` da X1, junto da decisão do A12 (cenarios.md, A11 e A12) |
| frontend-reviewer (2ª) | O `required` nativo mostra a mensagem do navegador, em inglês num Chromebook em inglês; considerar `noValidate` com mensagem própria | `TODO.md`: muda comportamento e texto de tela, e a RF20 manda manter as mensagens |
| frontend-reviewer (2ª) | A foto "vazia" de `/e/<escola>` mostra o nome sintético da vitrine com hash no título | Recusada: é dado da vitrine (regra 20, item 17), e a tela está correta |
| privacy-guardian (2ª) | O nome sintético do teste do título comprido parece nome de pessoa real; usar marcador claramente sintético | A próxima tarefa que tocar `e2e/casca-publica.spec.ts` (15.0 ou correção): é o nome de uma escola, e testa a mesma quebra |
| revisor-geral (2ª) | `cenarios.md:53` (A12) diz "Das duas saídas que o documento previa, vale esta:" e repete as duas; deixar só a saída decidida | `/retro` da X1: texto de spec, sem efeito no código nem no teste |
| revisor-geral (2ª) | `14_task.md:94`: o parágrafo de abertura de "Mutações" diz que `Entrar.tsx` não traz cláusula nova, mas há sete mutações nele | `/retro` da X1 (texto do documento da tarefa); o bloco das mutações é o que vale |
| revisor-geral (2ª) | `14_task.md:276-277`: a tabela de "Recomendações sem aplicar" está vazia, sem "nenhuma" | Resolvida pela cópia desta tabela para a seção, que o Implementador faz ao fechar a tarefa |
| test-engineer (2ª) | Sem bloco de mutação para `autocapitalize`, `spellcheck`, `name` e `type="password"` de `/entrar`; um para `type="password"` seria barato | A próxima tarefa ou correção que tocar `Entrar.tsx` |
| test-engineer (2ª) | O `acima >= 96` (`casca-publica.spec.ts:52`) depende da altura do conteúdo a 768 px; comentar o número | A próxima tarefa que tocar `e2e/casca-publica.spec.ts` |
| test-engineer (2ª) | Os e2e "sem edição" ficam fora do portão da tarefa; o `/validar` lê a esteira da linha depois do push | Validador da X1 (a rodada isolada do Implementador, 192 passaram, está no pedido; a linha está sem push por decisão do Joaquim) |

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
| 2026-10-15 23:53:02 | 2026-10-15 23:53:31 | `infra-guardian` | 1 | APROVADO | a0896f490d27b396f |
| 2026-10-15 23:53:00 | 2026-10-15 23:53:35 | `frontend-reviewer` | 1 | APROVADO | aa1df1055bdec6654 |
| 2026-10-15 23:53:04 | 2026-10-15 23:53:45 | `privacy-guardian` | 1 | APROVADO | a50a7122cbadcec7c |
| 2026-10-15 23:53:09 | 2026-10-15 23:54:37 | `revisor-geral` | 1 | REPROVADO | a3fd1337def0e9526 |
| 2026-10-15 23:53:07 | 2026-10-15 23:55:28 | `test-engineer` | 1 | REPROVADO | acc0bc30d978e0ac4 |
| 2026-10-16 00:35:14 | 2026-10-16 00:35:37 | `frontend-reviewer` | 2 | APROVADO | af1a6c3dbfdf9dc30 |
| 2026-10-16 00:35:19 | 2026-10-16 00:35:40 | `infra-guardian` | 2 | APROVADO | a961daf41f0428e48 |
| 2026-10-16 00:35:25 | 2026-10-16 00:35:51 | `privacy-guardian` | 2 | APROVADO | aae06f90b5e1805f6 |
| 2026-10-16 00:35:08 | 2026-10-16 00:35:54 | `revisor-geral` | 2 | APROVADO | af98cbfab6bf7d821 |
| 2026-10-16 00:35:00 | 2026-10-16 00:36:15 | `test-engineer` | 2 | APROVADO | aefdb164289251b5f |

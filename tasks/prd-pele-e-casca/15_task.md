# Tarefa 15.0 — A operação na pele nova

**Funcionalidade:** pele-e-casca · **Depende de:** 4.0, 6.0
**Subagentes obrigatórios:** `frontend-reviewer`, `infra-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A operação troca a faixa preta por uma barra de topo clara, nos dois temas, e continua dizendo "Operação Turmma" em
toda tela, com "Sair" à vista, para ninguém confundi-la com a tela de uma escola.

## Contexto necessário

- `techspec.md` 9 (**Casca pública e operação**), 7c (o teto da operação, 60 kB, não sobe) e 10; `prd.md` RF15, RF20
- `cenarios.md`: A60 a A64, A97, U12, a regra de produto 24 da A.13 e o item 8 de "O que ficou em aberto"
- `docs/interface.md` 5a e 11.4; `.claude/rules/50-frontend.md`, itens 2a e 11; D59, D76
- Código: `operacao/componentes/CascaDaOperacao.tsx` (`Faixa` em `bg-noite`, `ItemDaNavegacao`,
  `CascaPublicaDaOperacao`), `AvisoDeInatividade.tsx`; `apps/web/nome-dos-chunks.test.ts` (B2: nenhum módulo de
  `src/operacao/` fora do `operacao-*`; nenhuma peça fora da entrada em `parte-*`)

## Subtarefas

- [x] 15.1 — `CascaDaOperacao`: barra de topo de 72 px (56 no celular), `fundo`, borda de baixo de 2 px; a pinta, "Operação
  Turmma" (17 px, 700) e, à direita, a `Aparencia`, o nome do operador e "Sair" de 44 px, **à vista**. A navegação
  "Operação" (Escolas e Uso) com `aria-current` e sublinhado. `CascaPublicaDaOperacao` e `AvisoDeInatividade` na mesma pele
- [x] 15.2 — **O nome fica "Operação Turmma"**: `docs/interface.md` 11.4, que diz "Equipe Turmma", é corrigido; `tasks.md`
  e o e2e já dizem "Operação Turmma"
- [x] 15.3 — A operação só importa de `componentes/` o que a entrada já tem (`Botao`, `Campo`, `Dialogo`, `Aparencia`,
  `estado/`, `BotaoCopiar`, `CodigoQr`): nada da lista `PECAS_FORA_DA_ENTRADA` nem de `ia/`. Confira `operacao-*.js` em
  brotli contra os 60 kB
- [x] 15.4 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/operacao/componentes/CascaDaOperacao.tsx` e `CascaDaOperacao.test.tsx` | alterado e novo |
| `apps/web/src/operacao/componentes/AvisoDeInatividade.tsx` | alterado |
| `e2e/operacao.spec.ts` | alterado (A60 e A63) |
| `docs/interface.md` | alterado (11.4) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| a marca em toda tela | e2e | o `banner` contém "Operação Turmma" na entrada, no segundo fator, no convite, em Escolas e em Uso, a 360 e a 1366 px (A60) |
| "Sair" à vista | e2e | dentro do `banner`, sem abrir nada, com 44 × 44 px ou mais (A61); "Continuar na sessão" e "Sair" da mesma altura (A64) |
| o anel sobre a barra | e2e | contorno de 3 px na cor `foco` sobre o `fundo` claro, com 3:1 (A62, já com o valor da 3.0) |
| não parece escola | e2e | a barra tem fundo `fundo` e borda de baixo de 2 px (A63); sem lateral, sem `Seções`; só `navigation "Operação"` |
| a estrutura | componente | `banner` com a marca e o nome; `Sair` desligado e "Saindo…" enquanto sai; dois links com `aria-current` no aceso |
| verde só para a escola ativa | unidade | `estados-da-escola.test.ts` sem edição (U12) |
| a operação não puxa o que não pode | unidade | `nome-dos-chunks.test.ts` verde (B2); `operacao-*` abaixo de 60 kB |
| alvos de 44 px | e2e | `operacao-uso`, `operacao-escolas` e `operacao-convite*`, sem edição (A97) |
| recomeço | e2e | `operacao › sair como um operador e entrar como outro…`, `E3: o aviso aparece 2 min antes…` e `operacao-convite`, sem edição |

Concorrência e log não se aplicam: nenhuma rota e nenhuma linha novas.

## Como testar

- Componente a copiar: `componentes/pedidos/ListaDePedidos.test.tsx`; os `Link` pedem um roteador (`Router` do `wouter`)
- e2e a copiar: `operacao.spec.ts › entra por e-mail, senha e código…` (`banner`, `Sair`, `focoVisivel`)
- Isolado: `npx vitest run --project unidade apps/web/src/operacao apps/web/nome-dos-chunks.test.ts`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/operacao.spec.ts e2e/operacao-uso.spec.ts e2e/operacao-escolas.spec.ts`
- Armadilha: a `Aparencia` já está na barra desde a 2.0: aqui só se muda o desenho em volta
- **Telas**: o operador, `/operacao` e `/operacao/uso`; sem sessão, `/operacao/entrar`; a 1366 e 360 px, claro e escuro.
  Mockup: `/operacao`

## Fora do escopo desta tarefa

O corpo da operação (título "Operação", linha fixa e abas, da X2); as páginas de escola; qualquer dado novo no painel.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `NavegacaoDaLista.tsx` fica na lista fechada do `bg-noite` até a **X2**, e não sai na 15.0: a entrada dela em `estilos.test.ts` dizia "15.0", mas ela é a opção de ordenação marcada da lista das escolas, que é corpo da operação, e o corpo é "fora do escopo desta tarefa" | A lista diz a tarefa que tira o uso; só a `CascaDaOperacao.tsx` é desta | `techspec.md` 9 ("Feita na 15.0"), `estilos.test.ts` (`FACE_DO_OFICIAL`, teto 5 → 4) |
| `AvisoDeInatividade.tsx` **não mudou**: já está na pele (famílias `pendente`, `Botao` e botão secundário de 44 px, e a A64 mede os dois da mesma altura) | "Arquivos previstos" o dava como alterado | `cenarios.md` A64 (inalterado) |
| A barra não leva o fio vertical do mockup: o nome "Operação Turmma" já traz a marca, e o fio separava a marca do contexto | 15.1 não o lista; `docs/interface.md` 11.4 o citava | `docs/interface.md` 11.4 |
| A conta, à direita da barra, vai na ordem do código: `Aparencia`, nome do operador, "Sair". O texto de 15.1 e a `docs/interface.md` 11.4 diziam nome, `Aparencia`, "Sair" | O "Sair" fica por último, no canto, onde o dedo o acha em toda tela; o nome sem controle ao lado dele não é alvo de nada | `docs/interface.md` 11.4, `techspec.md` 9 ("Feita na 15.0") |
| `docs/interface.md` 5a e 11.4 diziam "Equipe Turmma": corrigidas para "Operação Turmma" (15.2) | Item 8 de "O que ficou em aberto" | `cenarios.md` A60 e item 8 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

A barra, as medidas e o sublinhado são medidos no navegador (a unidade não enxerga CSS); a estrutura (o `banner`, o
"Sair" dentro dele, o `disabled`, o `aria-current`) é do teste de componente. O `bg-fundo` da barra vem trocado por
`bg-papel`, e não apagado: o contêiner de fora já é `bg-fundo`, e a mutação por remoção sobreviveria.

```mutacao
arquivo: apps/web/src/operacao/componentes/CascaDaOperacao.tsx
teste: e2e/operacao.spec.ts › a barra de topo é clara e tem a marca e o "Sair" à vista em Escolas e em Uso, a 360 e a 1366 px, nos dois temas
-    <header className="flex min-h-14 items-center border-b-2 border-borda bg-fundo text-tinta md:min-h-18">
+    <header className="flex min-h-14 items-center border-b-2 border-borda bg-papel text-tinta md:min-h-18">
```

```mutacao
arquivo: apps/web/src/operacao/componentes/CascaDaOperacao.tsx
teste: e2e/operacao.spec.ts › a barra de topo é clara e tem a marca e o "Sair" à vista em Escolas e em Uso, a 360 e a 1366 px, nos dois temas
-    <header className="flex min-h-14 items-center border-b-2 border-borda bg-fundo text-tinta md:min-h-18">
+    <header className="flex min-h-14 items-center border-b border-borda bg-fundo text-tinta md:min-h-18">
```

```mutacao
arquivo: apps/web/src/operacao/componentes/CascaDaOperacao.tsx
teste: e2e/operacao.spec.ts › a barra de topo é clara e tem a marca e o "Sair" à vista em Escolas e em Uso, a 360 e a 1366 px, nos dois temas
-    <header className="flex min-h-14 items-center border-b-2 border-borda bg-fundo text-tinta md:min-h-18">
+    <header className="flex min-h-14 items-center border-b-2 border-borda bg-fundo text-tinta">
```

O "Sair" com o tamanho dos vizinhos (D59): sem a classe do botão secundário ele perde os 44 px.

```mutacao
arquivo: apps/web/src/operacao/componentes/CascaDaOperacao.tsx
teste: e2e/operacao.spec.ts › entra por e-mail, senha e código, chega à casca da operação e sai a um clique
-          <button type="button" onClick={aoSair} disabled={saindo} className={`${CLASSES_DO_BOTAO_SECUNDARIO} shrink-0`}>
+          <button type="button" onClick={aoSair} disabled={saindo} className="shrink-0">
```

```mutacao
arquivo: apps/web/src/operacao/componentes/CascaDaOperacao.tsx
teste: apps/web/src/operacao/componentes/CascaDaOperacao.test.tsx › enquanto sai, o "Sair" fica desligado e diz "Saindo…"; fora disso chama o aoSair uma vez por clique
-          <button type="button" onClick={aoSair} disabled={saindo} className={`${CLASSES_DO_BOTAO_SECUNDARIO} shrink-0`}>
+          <button type="button" onClick={aoSair} className={`${CLASSES_DO_BOTAO_SECUNDARIO} shrink-0`}>
```

O item aceso: o `aria-current` só no da tela, e o sublinhado só nele.

```mutacao
arquivo: apps/web/src/operacao/componentes/CascaDaOperacao.tsx
teste: apps/web/src/operacao/componentes/CascaDaOperacao.test.tsx › a navegação tem Escolas e Uso, e só o link da tela em que a pessoa está leva o aria-current
-      aria-current={aqui ? 'page' : undefined}
+      aria-current="page"
```

```mutacao
arquivo: apps/web/src/operacao/componentes/CascaDaOperacao.tsx
teste: e2e/operacao.spec.ts › a barra de topo é clara e tem a marca e o "Sair" à vista em Escolas e em Uso, a 360 e a 1366 px, nos dois temas
-      {aqui && <span aria-hidden="true" className="absolute inset-x-2 -bottom-0.5 h-0.75 rounded-full bg-azul" />}
+      <span aria-hidden="true" className="absolute inset-x-2 -bottom-0.5 h-0.75 rounded-full bg-azul" />
```

```mutacao
arquivo: apps/web/src/operacao/componentes/CascaDaOperacao.tsx
teste: e2e/operacao.spec.ts › a barra de topo é clara e tem a marca e o "Sair" à vista em Escolas e em Uso, a 360 e a 1366 px, nos dois temas
-      {aqui && <span aria-hidden="true" className="absolute inset-x-2 -bottom-0.5 h-0.75 rounded-full bg-azul" />}
+      {aqui && <span aria-hidden="true" className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-azul" />}
```

A lista fechada do `bg-noite`: a entrada da casca saiu, e o teto passou a 4 (a guarda reprova a entrada cuja classe o arquivo
já não escreve, e o teto que não acompanha a lista).

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › grafite e noite só são face onde a lista fechada do oficial diz, e a lista só encolhe
-const TETO_DA_LISTA_DO_OFICIAL = 4
+const TETO_DA_LISTA_DO_OFICIAL = 5
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | O caso de e2e com 8 rodadas de medida num teste só pode estourar o prazo no projeto `celular`, com a rede lenta | O Orquestrador lê o veredito da esteira ao fechar a tarefa seguinte; se estourar, vira correção. Nada a mudar sem medida |
| frontend-reviewer (1ª) | A 360 px a barra e a navegação ocupam cerca de 210 px; avaliar a `Aparencia` atrás de um menu da conta no celular | X2, ao recompor o corpo da operação. O desenho aceita a conta descer de linha, e a 15.0 deixa o corpo fora do escopo |
| frontend-reviewer (1ª) | `ErroDaOperacao` (`border border-erro`) e `AvisoDeInatividade` (`border-t border-pendente`) com borda de 1 px, e não as peças de 2 px | X2 ou varredura final. `AvisoDeInatividade` ficou inalterado de propósito (A64 sem edição), e o erro é corpo da operação |
| frontend-reviewer (1ª) | Comentário velho em `apps/web/src/operacao/api/sessao.ts:457`: "o da faixa" | Primeira tarefa futura que tocar `sessao.ts`; arquivo fora desta tarefa |
| test-engineer (1ª) | Classes novas sem teste nem mutação: marca em 17/700, `text-azul-texto`, fio de 2 px da navegação, `t-titulo` do `h1` público | Recusada: tipografia e cor de item não são regra de negócio (regra 40), e a tabela de testes da tarefa não as pede. O sublinhado, a borda e a medida da barra têm mutação |
| test-engineer (1ª) | A barra de 56 px no celular não está provada: o conteúdo (62 px) já passa dela | Só registro, sem ação: a medida fica cumprida pelo conteúdo |
| test-engineer (1ª) | Faces mortas em `e2e/tokens.spec.ts:292` e `:295` ("cabeçalho da operação", "grupo da Aparência na faixa") em `bg-noite`, e a regra `.bg-noite .bg-fundo :focus-visible` de `estilos.css` sem uso real | Primeira tarefa que tocar `tokens.spec.ts`, ou a X2; arquivo fora desta tarefa |
| test-engineer (1ª) | O caso novo percorre o tema escuro mas não chama `violacoesGraves`; o contraste do nome do operador em `text-apoio` fica com o spec do escuro | O Validador confere que o spec do escuro passa pela operação com a sessão aberta (ver também o item 5) |
| infra-guardian (2ª) | O caso de fora da sessão tem 12 recargas e roda o axe seis vezes, com prazo de 90 s. Conferir o tempo real no projeto `celular`; se passar de uns 60 s, separar os temas em dois casos em vez de subir o prazo de novo | Esteira: o Orquestrador lê o veredito ao fechar a tarefa seguinte; se passar de 60 s, vira correção |
| revisor-geral (2ª) | O comentário de `CascaDaOperacao.tsx:65` diz que a `CascaPublicaDaOperacao` serve "entrar e o segundo fator", mas ela também serve o convite (`Convite.tsx:123`); o mesmo em `:98` | Próxima tarefa que tocar `CascaDaOperacao.tsx` (a X2). Só comentário, e corrigi-lo agora caducaria os quatro revisores de novo |
| test-engineer (2ª) | A volta do escuro não prova que o tema virou: o `fundo` é lido na própria página nas duas voltas. Guardar o `fundo` da volta clara e exigir outro valor na escura, ou ler o atributo de tema no `html` | O Validador, ou a X2. Teste de pele, não regra de negócio, e o axe no escuro já cobre o contraste |
| test-engineer (2ª), frontend-reviewer (2ª), infra-guardian (2ª) | As 12 fotos de `.processo/vitrine/operacao-*.png` são de antes da troca para `t-cartao`; a altura de linha da marca passou a 22 px | O Validador confere a barra da operação a 360 e a 1366 px, claro e escuro, quando o vitrine tiver o papel de operador |

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
| 2026-10-16 01:43:31 | 2026-10-16 01:44:10 | `infra-guardian` | 1 | APROVADO | a600bd97b4acbe105 |
| 2026-10-16 01:44:23 | 2026-10-16 01:44:40 | `revisor-geral` | 1 | APROVADO | ad2aba93d4a898e05 |
| 2026-10-16 01:43:47 | 2026-10-16 01:45:00 | `frontend-reviewer` | 1 | APROVADO | a36109c163d84f790 |
| 2026-10-16 01:43:33 | 2026-10-16 01:45:36 | `test-engineer` | 1 | APROVADO | a3ed1c88f5ef7c33b |
| 2026-10-16 01:57:30 | 2026-10-16 01:57:44 | `frontend-reviewer` | 2 | APROVADO | a2403172d990f89f0 |
| 2026-10-16 01:57:35 | 2026-10-16 01:57:50 | `infra-guardian` | 2 | APROVADO | af839af4b90111e78 |
| 2026-10-16 01:57:47 | 2026-10-16 01:58:22 | `revisor-geral` | 2 | APROVADO | aad09d46ec5d7f0f3 |
| 2026-10-16 01:57:41 | 2026-10-16 01:58:30 | `test-engineer` | 2 | APROVADO | a1c21e955197656aa |

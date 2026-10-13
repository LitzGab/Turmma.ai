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

- [ ] 15.1 — `CascaDaOperacao`: barra de topo de 72 px (56 no celular), `fundo`, borda de baixo de 2 px; a pinta, "Operação
  Turmma" (17 px, 700) e, à direita, o nome do operador, a `Aparencia` e "Sair" de 44 px, **à vista**. A navegação
  "Operação" (Escolas e Uso) com `aria-current` e sublinhado. `CascaPublicaDaOperacao` e `AvisoDeInatividade` na mesma pele
- [ ] 15.2 — **O nome fica "Operação Turmma"**: `docs/interface.md` 11.4, que diz "Equipe Turmma", é corrigido; `tasks.md`
  e o e2e já dizem "Operação Turmma"
- [ ] 15.3 — A operação só importa de `componentes/` o que a entrada já tem (`Botao`, `Campo`, `Dialogo`, `Aparencia`,
  `estado/`, `BotaoCopiar`, `CodigoQr`): nada da lista `PECAS_FORA_DA_ENTRADA` nem de `ia/`. Confira `operacao-*.js` em
  brotli contra os 60 kB
- [ ] 15.4 — Testes (tabela abaixo)

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

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

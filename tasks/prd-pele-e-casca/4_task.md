# Tarefa 4.0 — Os campos na pele nova, com busca, interruptor e opção

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Todo campo do produto passa a ter borda de 2 px que se vê (3:1), fundo `campo` e anel no foco, nos dois temas, e a
galeria ganha a busca, o interruptor e a opção.

## Contexto necessário

- `techspec.md` seção 9 (**Desvios do mockup**, **Foco**, **Alvo de toque**, **Peças novas**), 7c e 10
- `prd.md` RF2, RF7, RF9, RF11; `cenarios.md`, parte A, as linhas da 4.0
- `docs/interface.md` 10.2 (medida e token de cada estado); `mockup.md` 3.4 e 7.4
- `.claude/rules/50-frontend.md`, itens 2a e 11
- Código, em `apps/web/src/componentes/`: `Campo.tsx` (`CLASSES_DO_CAMPO`; a ordem de dica, erro e
  `descritoTambemPor` no `aria-describedby`), `CampoDeSenha.tsx`, `CampoLongo.tsx`, `Selecao.tsx`, `seletor.ts`

## Subtarefas

- [ ] 4.1 — Revestir **sem mudar props**: borda de 2 px em `borda-campo`, fundo `campo` e, em foco, o anel de 3 px
  **mais** a borda (o mockup tira o anel: aqui não). O erro ganha ícone ao lado do texto; desligado em
  `fundo-suave`, com texto `apoio`
- [ ] 4.2 — `Busca` (`valor`, `aoMudar`, `rotulo`): `<input type="search">`, rótulo só para leitor de tela
- [ ] 4.3 — `Interruptor` (`ligado`, `aoMudar`, `rotulo`, `desligado`): `<button role="switch" aria-checked>`; Espaço
  e Enter trocam; a borda do desligado em `borda-campo`; os estados diferem pela posição da bolinha, não só pela cor
- [ ] 4.4 — `Opcao` (`tipo` `radio` ou `checkbox`, `nome`, `valor`, `marcada`, `aoMudar`, `icone`, `desligada`): um
  `<label>` com o `<input>` nativo dentro. Rádios de mesmo `nome` são grupo: setas trocam, uma parada de Tab. O anel
  vai no rótulo por `focus-within`, **nunca por `:has()`**; marcada leva o visto; a caixa vazia tem borda de 3:1
- [ ] 4.5 — As três entram em `PECAS_FORA_DA_ENTRADA`, com alvo de 44 px. `galeria/secoes/campos.tsx` mostra cada
  peça vazia, preenchida, com erro e desligada, com nomes inventados
- [ ] 4.6 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/Campo.tsx` | alterado |
| `apps/web/src/componentes/Campo.test.tsx` | novo |
| `apps/web/src/componentes/CampoDeSenha.tsx` | alterado |
| `apps/web/src/componentes/CampoLongo.tsx` | alterado |
| `apps/web/src/componentes/Selecao.tsx` | alterado |
| `apps/web/src/componentes/seletor.ts` | alterado |
| `apps/web/src/componentes/Busca.tsx` | novo |
| `apps/web/src/componentes/Busca.test.tsx` | novo |
| `apps/web/src/componentes/Interruptor.tsx` | novo |
| `apps/web/src/componentes/Interruptor.test.tsx` | novo |
| `apps/web/src/componentes/Opcao.tsx` | novo |
| `apps/web/src/componentes/Opcao.test.tsx` | novo |
| `apps/web/src/galeria/secoes/campos.tsx` | alterado |
| `apps/web/nome-dos-chunks.ts` | alterado |
| `e2e/pecas-campos.spec.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| rótulo, dica e erro ligados | componente | `Campo`, `CampoLongo` e `Selecao`: `aria-describedby` na ordem de hoje, `aria-invalid`, `aria-required`, erro com ícone e texto |
| `Interruptor` | componente | `aria-checked` troca com clique, Espaço e Enter; desligado não troca |
| `Opcao` em grupo | componente | as setas trocam a marcada, uma parada de Tab, `aoMudar` uma vez |
| `Busca` | componente | o nome acessível é o rótulo |
| borda e anel, nos dois temas | e2e | a borda calculada passa de 3:1 contra `fundo` e `campo`, também no interruptor desligado e na caixa da opção; em foco, contorno de 3 px em `foco`, com a borda |
| alvo de toque | e2e (`celular`) | campo, busca, interruptor e opção com 44 px |
| axe nos dois temas | e2e | a seção sem violação grave, nos dois projetos |
| nenhum teste de regra enfraquecido | e2e e unidade | `entrar`, `mfa`, `turma-publica` e `estrutura` acham os campos por `getByLabel`, sem edição; "Mostrar a senha" continua `aria-pressed`; `nome-dos-chunks.test.ts` sem peça da lista na entrada |

Concorrência, recomeço e log não se aplicam: peça sem servidor, sem sessão e sem log.

## Como testar

- Componente a copiar: `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` (a linha `// @vitest-environment
  jsdom`, o `userEvent`); peça sem rede dispensa `prepararTela`, com `cleanup` no `afterEach`
- e2e a copiar: `e2e/pecas-botoes.spec.ts` (`abrirGaleria`, `desenho`, `caixa`); o contraste, de `e2e/tokens.spec.ts`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/Opcao.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-campos.spec.ts e2e/entrar.spec.ts`
- Armadilha: o `jsdom` não calcula cor nem foco visível: vão no e2e. Caso de outro `pecas-*` que quebrar é arquivo
  de outra linha: pare e avise
- Telas: `/galeria` (Campos), claro e escuro; `coordenacao`, `/coordenacao/estrutura`; `/entrar`. Mockup:
  `/fundamentos` (Formulário)

## Fora do escopo desta tarefa

`Segmentado` (2.0); campo escrito à mão em `copia-unica.tsx` e `LoginPorCima.tsx` (7.0); `MotorFormulario` (10.0);
usar as peças novas nas telas (X2 a X4).

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

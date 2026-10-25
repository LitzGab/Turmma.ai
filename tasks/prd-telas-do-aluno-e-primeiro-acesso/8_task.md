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

- [ ] 8.1 — `apps/web/src/letra.ts`: a chave `educa.letra` (`grande` ou `maior`; ausente é Padrão; voltar a Padrão apaga), leitura e
  escrita em `try/catch` (armazenamento recusado: vale na sessão, sem erro). O script em linha lê a chave e, se o caminho começa por
  `/aluno`, escreve `data-letra` no `<html>`. `useTamanhoDaLetra()`, montado em `areas/aluno/rotas.tsx`, mantém o atributo e o tira ao
  sair da área. No CSS, `font-size` de 112,5% e de 125% no `<html>`
- [ ] 8.2 — `componentes/TamanhoDaLetra.tsx`, ao lado da `Aparencia` (é o 25º arquivo de produção da pasta, o teto): três `Opcao` em grupo de rádio (setas, uma parada de Tab), "Padrão", "Grande" e "Maior", e a
  prévia "Assim fica a minha letra." Em Eu, a linha "Ajustes" abre um `Dialogo` com a `Aparencia` e o `TamanhoDaLetra`. **Grava só ao
  escolher**: montar, abrir o diálogo ou entrar na área não escreve nada
- [ ] 8.3 — `docs/interface.md`: a chave e a regra "só por escolha". A lista fechada de chaves do navegador (11.1 do
  `docs/interface.md`; Tech Spec da X1, seção 7) ganha `educa.letra`, com valor de conjunto fechado (`grande` ou `maior`), e
  o e2e do armazenamento da X1 (RF24, `e2e/aparencia.spec.ts`) passa a conhecer a terceira chave. O `docs/lgpd.md` registra que
  a preferência fica só no navegador, sem identificador de pessoa nem de escola
- [ ] 8.4 — Testes

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

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

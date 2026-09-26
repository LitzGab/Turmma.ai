# Tarefa 13.0 — Web: Estrutura, lista de nomes e alocação

**Funcionalidade:** apresentacao-escola · **Depende de:** 11.0, 2.0 · **Paralelo com:** 3.0 a 10.0, 14.0, 15.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A coordenação monta a escola numa tela só: ano letivo, séries, disciplinas e turmas (criar, renomear, excluir), a
lista de nomes de cada turma colada ou em arquivo, com a prévia linha a linha, e a alocação professor × turma ×
disciplina.

## Contexto necessário

- `docs/interface.md` 11.1 (a coordenação abre em Estrutura) e a seção de tabela responsiva
- `techspec.md` seções 4 (estrutura e lista) e 9 ("Lista")
- `cenarios.md`: W10, W4 (linhas "Estrutura", "Lista", "Alocação"), W12; os códigos de erro de E1, E2, E4, E7
- `.claude/rules/50-frontend.md`; regra 20 (itens 4, 9)
- `techspec.md` seção 12: a premissa do CSV do Excel em windows-1252 com `;`
- Código:
  - As rotas da 1.0 e da 2.0, e as do F1 (ano letivo, série, turma, disciplina, vínculo)
  - `apps/web/src/api/cliente.ts` (`ErroDaApi`, `mensagemDoErro`), `apps/web/src/api/vinculos.ts`
  - `apps/web/src/componentes/estado/`, `Campo.tsx`, `Botao.tsx`
  - `apps/web/src/operacao/componentes/DialogoDaOperacao.tsx` e `apps/web/src/operacao/paginas/Escolas.tsx` — o
    padrão de diálogo, foco devolvido e tabela que vira cartões (a 14.0 leva o diálogo para `componentes/`: se
    esta vier antes, use-o de onde estiver e não copie)
  - `tasks/prd-apresentacao-painel/achados/indice.md`, linhas da 6.0 e 7.0: foco depois de conflito e largura dentro
    do diálogo

## Subtarefas

- [ ] 13.1 — Estrutura: ano, série, disciplina e turma, com renomear e excluir (confirmação `perigo`; o `CONFLITO`
  explica o que prende); o vazio "Comece pelo ano letivo" com o roteiro até a alocação; a coordenação abre aqui
- [ ] 13.2 — Lista da turma: colar ou escolher arquivo, lido como texto (UTF-8, e windows-1252 quando o UTF-8 falha),
  com o exemplo `nome; matrícula` ao lado; a prévia com as linhas de erro primeiro e em texto; gravar só sem erro;
  nome avulso; retirar nome livre. A leitura da lista manda a finalidade
- [ ] 13.3 — Alocação professor × turma × disciplina; o vínculo aparece `pendente` até o professor confirmar
- [ ] 13.4 — Linha "Estrutura" na tabela de navegação; teto do chunk `coordenacao-*` no `.size-limit.json`
- [ ] 13.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Estrutura.tsx`, `ListaDaTurma.tsx`, `Alocacao.tsx` | novo |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts` (e teste) | novo |
| `apps/web/src/api/estrutura.ts`, `lista.ts`; `areas/navegacao.ts` | novo, alterado |
| `.size-limit.json`, `e2e/estrutura.spec.ts`, `e2e/__fixtures__/lista-excel.csv` | alterado, novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W10 | e2e e unidade | windows-1252 com `;` e acento e UTF-8 com BOM e `,`: a prévia mostra os nomes certos, erros primeiro e em texto |
| W4 (Estrutura, Lista, Alocação) | e2e | os quatro estados com os textos e o próximo passo da tabela; vazio e erro com a rota interceptada |
| W12 (as três) | e2e | 360 px sem rolagem, também dentro do diálogo; cartões abaixo de 768 px; alvos de 44 px; tudo só com teclado |
| clique duplo | e2e | dois cliques em "Gravar lista" mandam um pedido só |
| recomeço da tela | e2e | segunda pessoa: a coordenação de A sai, a de B entra na mesma aba, e nenhuma turma nem nome de A aparece; mesma entrada: a mesma lista enviada de novo mostra `ja_existe`, sem duplicar; resposta atrasada: a prévia de um texto anterior que chega depois da edição é descartada; falha com o diálogo aberto: o `CONFLITO` ao excluir a turma recarrega a lista, e o aviso e o foco da tentativa anterior saem |
| sem rastro | unidade | nome e matrícula da lista não vão para `localStorage`, `sessionStorage` nem para o endereço |
| log novo | — | a tarefa não escreve log |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [ ] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral` e os guardiões, com
  rodada que vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Os pedidos dentro da turma (16.0); Professores (14.0); XLSX e grade horária (F2, F8).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

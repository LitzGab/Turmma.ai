# Tarefa 14.0 — Aprovar na pele nova

**Funcionalidade:** telas-do-professor · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

"Revisar a correção" ganha a faixa de números, três abas (Destaques, Outras, Resumo) e o destaque aberto num painel ao
lado. A ação oficial fica numa barra presa, única, desligada até o último destaque ser aberto, e visível nas três abas.

## Contexto necessário

- `techspec.md` seções 5 ("Abas no endereço"), 7b e 9 (Aprovar: leitura, barra presa); `prd.md` RF20 e RF21; `mockup.md`
  12, só pela composição
- Regra 70, itens 1, 3 e 7; D33, D46, D56, D70; regra 50, item 8: a confirmação diz o que vai acontecer. O mockup aprova
  num clique, sem "Acerto por habilidade", e fala em "notas" e "média": aqui nada disso entra
- Código: `Aprovar.tsx` (`DestaqueAberto`, a barra, linhas 340 a 400); `aprovar.ts` (`contadorDosDestaques`,
  `rotuloDeAprovar`); `aprovar.test.ts` (o vocabulário); `api/atividades.ts` (`abrirDestaque`, `aprovarLote`)

## Subtarefas

- [ ] 14.1 — `Aprovar.tsx`: a faixa de números (`NumeroPainel`: corrigidas, destaques abertos, acerto médio em questões);
  abas `?aba=destaques|outras|resumo` (`replace`; desconhecido cai em Destaques). Destaques: "Abra estes N antes de
  aprovar", cada um aberto por clique. Outras: "As outras N correções", em ordem de nome. Resumo: distribuição, acerto
  por habilidade e por questão, com o aviso do gabarito. O destaque aberto aparece no `PainelLado`, com `?ver=<alunoId>`
- [ ] 14.2 — A barra presa com o botão oficial (grafite, o único da tela), o contador que diz por quê está desligado,
  "Rejeitar a correção" e a confirmação de hoje; fica visível nas três abas e, a 360 px, acima da barra de baixo
- [ ] 14.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Aprovar.tsx`, `aprovar.ts` | alterado (em `apps/web/src/areas/professor/`) |
| `apps/web/src/areas/professor/aprovar.test.ts` | alterado (o vocabulário cobre os textos novos) |
| `apps/web/src/areas/professor/Aprovar.test.tsx` | novo |
| `e2e/professor-aprovar.spec.ts` | alterado (a 2.5 o criou) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| o oficial desligado | componente | com um destaque fechado, o botão está desligado e o contador diz quantos faltam, nas três abas; só `podeAprovar` o liga |
| abrir registra uma vez | componente e e2e | o clique no destaque chama `abrirDestaque` uma vez, mesmo com dois cliques; recarregar com `?ver=` de destaque ainda fechado não abre o painel nem registra |
| a confirmação | e2e | a confirmação mostra a atividade, a turma, quantos e o efeito antes de aprovar; dois cliques mandam uma aprovação só; o registro "Validação registrada por … · quando" aparece depois |
| nenhum botão laranja | componente | a tela tem um único botão oficial e nenhum `primario`; "Rejeitar a correção" é `perigo` e secundário |
| o vocabulário | unidade | `aprovar.test.ts` varre os textos novos: sem "nota", "conceito", "pontuação", "média", "ranking" nem comparação com o histórico do aluno; as outras correções saem em ordem de nome, nunca de acerto |
| estados | componente | carregando; erro com "Tentar de novo"; correção que não existe ("Esta correção não está disponível"), igual para a de outra turma e a de outra escola; com dado |
| a aba pelo endereço | componente | `?aba=resumo` abre o Resumo; a barra continua; trocar de aba usa `replace` |
| o lote mudou | e2e | a aprovação recusada porque o lote mudou vira aviso calmo, com a tela relida; rejeitar exige justificativa de 8 a 500 caracteres |
| recomeço | e2e | recarregar mantém aba e destaques já abertos; a segunda pessoa não vê o lote; a sessão vencida com a confirmação aberta não aprova sozinha ao voltar. Log: nenhum nome de aluno em log da web |
| 360 px | e2e | a barra presa fica acima da barra de baixo; o painel vira folha de baixo; sem rolar de lado |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`); o vocabulário, de `aprovar.test.ts`
- e2e: `describe('aprovar a correção (11.5)')`, três casos em `professor-aprovar.spec.ts`. Mudam a aba que o teste clica
  antes de ver cada bloco e o painel do destaque; nenhuma asserção de regra, e `a3-a4-professor.spec.ts` segue pelas
  fixtures
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/aprovar.test.ts`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-aprovar.spec.ts`
- Telas: `professora`, `/professor/aprovar/:atividadeAplicadaId`, `--clicar 'role=link[name="Revisar a correção"]'`.
  Mockup: `/professor/aprovar/prova-2b?aba=destaques`

## Fora do escopo desta tarefa

"Trocar o gabarito desta questão", "Tirar do lote", o recado que vai com a nota, o destaque "Saiu da aba", "Abaixo/Acima do
costume" e "Diferentes do que costumam" (comparação com o histórico do aluno: perfilização, D60, D70); a faixa "Em branco";
"Aprovar as notas" com vocabulário de nota (D46); o painel de prova de um aluno.

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

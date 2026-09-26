# Tarefa 15.0 — Web: acesso da turma do professor (código em grupos, "Gerar novo", WhatsApp)

**Funcionalidade:** apresentacao-escola · **Depende de:** 11.0, 4.0 · **Paralelo com:** 5.0 a 10.0, 13.0, 14.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Dentro da turma, o professor gera o acesso com validade de 1, 7 ou 30 dias, projeta o código grande e em dois grupos,
copia o link ou o compartilha pelo WhatsApp com um texto sem nome de aluno, e troca por um novo sabendo o que cai.

## Contexto necessário

- `docs/interface.md` 11.1 (botões `primario`, `perigo`); `docs/pendencias-dos-mockups.md`, P27
- `techspec.md` seções 4 (acesso), 9 ("Acesso") e 12 (a premissa do `wa.me/?text=`)
- `cenarios.md`: E16, W7, W4 (linha "Acesso"), W12
- `.claude/rules/50-frontend.md`; regra 20 (item 8)
- Código:
  - As rotas da 4.0 e a exibição do código em `packages/shared` (4.0): a tela não refaz o agrupamento
  - `apps/web/src/areas/professor/Turmas.tsx` (11.0) — onde a turma abre
  - `apps/web/src/componentes/BotaoCopiar.tsx`; o diálogo de cópia única (14.0, em `componentes/`, ou ainda em
    `operacao/` se esta vier antes: não copie)
  - `apps/web/src/componentes/CodigoQr.tsx` — existe; o QR não está na spec, e fica fora

## Subtarefas

- [ ] 15.1 — A turma aberta pelo professor, com a seção Acesso: sem acesso, "Sem acesso ativo" e Gerar; gerar com a
  validade (7 padrão); o link e o código aparecem uma vez, o código em fonte grande e em dois grupos de 4; fechar
  sem copiar pergunta; com acesso, só a validade
- [ ] 15.2 — "Gerar novo" pede confirmação e diz que o atual cai (também o de outro professor da turma) e que os nomes
  travados por tentativas erradas destravam; revogar com `perigo`
- [ ] 15.3 — Compartilhar pelo WhatsApp: `wa.me/?text=` com o nome da escola e o link, montado por uma função só;
  sem o WhatsApp, o botão copia o texto
- [ ] 15.4 — Teto do chunk `professor-*` no `.size-limit.json`
- [ ] 15.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Turma.tsx`, `AcessoDaTurma.tsx` | novo |
| `apps/web/src/areas/professor/texto-do-whatsapp.ts` (e teste) | novo |
| `apps/web/src/api/acesso.ts`; `areas/professor/Turmas.tsx`, `rotas.tsx` | novo, alterado |
| `.size-limit.json`, `e2e/acesso-da-turma.spec.ts` | alterado, novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E16 | unidade | o texto traz o nome da escola e o link, e nenhum nome da lista (sentinela) |
| W7 | e2e | código em dois grupos; "Gerar novo" confirma, diz o que cai e o que destrava; fechar sem copiar pergunta; sem WhatsApp, copia |
| W4 (Acesso) | e2e | os quatro estados; "Sem acesso ativo" com Gerar; vazio e erro com a rota interceptada |
| W12 (Acesso) | e2e | 360 px sem rolagem, com o código grande; alvos de 44 px; gerar e confirmar só com teclado, foco preso e devolvido |
| link fora do cache | unidade | fechado o diálogo, nem o link nem o código ficam no `MutationCache` |
| clique duplo | e2e | dois cliques em Gerar: um acesso vigente, e a tela mostra o que ficou |
| recomeço da tela | e2e | segunda pessoa: outro professor na mesma aba não vê o link do primeiro; mesma entrada: abrir de novo a mesma turma não mostra o link já fechado; resposta atrasada: o gerar anterior que responde depois do "Gerar novo" não substitui o código novo; falha com o diálogo aberto: o `CONFLITO` do gerar recarrega a seção, e o aviso e o foco da tentativa anterior saem |
| log novo | — | a tarefa não escreve log |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [ ] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral` e os guardiões, com
  rodada que vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Os pedidos da turma (16.0); o QR do link; contagem pública de quem entrou (D59).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

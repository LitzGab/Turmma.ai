# Tarefa 18.0 — Aluno e professor baixam os próprios dados

**Funcionalidade:** lgpd-e-titular · **Depende de:** 13.0 · **Paralelo com:** 17.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O aluno acha "Meus dados" em Privacidade, no rodapé, e o professor no menu da pessoa, com o resumo por categoria, os estados e o aviso de computador compartilhado.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 9 ("Meus dados")
- `docs/interface.md` 11.1 (lateral do aluno)
- Código: `apps/web/src/areas/navegacao.ts` e `.test.ts`, `componentes/MenuDaPessoa.tsx`
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 18.1 — Lugar do rodapé fixo na casca do aluno; item Privacidade com "Meus dados"
- [ ] 18.2 — Link no menu da pessoa do professor
- [ ] 18.3 — Tela com resumo, estados, aviso e download
- [ ] 18.4 — `docs/interface.md`
- [ ] 18.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| casca do aluno, `MenuDaPessoa`, navegação | alterado |
| tela "Meus dados" | novo |
| e2e | novo |
| `docs/interface.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz | e2e | a coordenação registra acesso e o aluno baixa `meus-dados-AAAA-MM-DD.json` |
| navegação | e2e | aluno pelo rodapé e pela gaveta a 360 px; professor pelo menu da pessoa |
| estados | e2e | vazio que convida; em preparação a cada 10 s; apagado depois de 7 dias; só a escola ativa |
| recomeço | e2e | troca de escola e segunda pessoa não mostram o arquivo anterior |
| projetos | e2e | `chromebook` e `celular`, acessibilidade |

## Como testar

- **navegação:** `e2e/areas.spec.ts › o aluno vê "Tutor", "Atividades" e "Minha turma"…` e `› o professor vê os itens da fase dele…` (o menu da pessoa); a gaveta a 360 px em `e2e/casca.spec.ts › W12: abaixo de 768 px…`; a unidade em `apps/web/src/areas/navegacao.test.ts`.
- **caminho feliz:** a função local `outroNavegador`, de `e2e/escola-montada.spec.ts`, para a coordenação e o aluno; o download como em `e2e/a2-assistente.spec.ts` (`page.waitForEvent('download')`); `entrarComoAluno` (`e2e/__fixtures__/casca.ts`) e `criarAlunoComMatricula`.
- **recomeço:** `e2e/minha-turma.spec.ts › segunda pessoa: o aluno seguinte no mesmo Chromebook…`; a troca de escola do professor em `e2e/troca-de-escola.spec.ts › depois da troca para B, nenhuma requisição leva o token de A…` (`criarUsuarioEmOutraEscola`).
- **estados:** `e2e/minha-turma.spec.ts › carregando, com dado…`; os 10 s com `page.clock`, como `e2e/inatividade.spec.ts`.
- Apagado depois de 7 dias: semeie `apagado_em` no banco.
- Rodar: `node tools/ci/e2e.ts --manter-ambiente e2e/<arquivo>.spec.ts`.
- **Telas:** `aluno`, de `/aluno/atividades`, com `--clicar 'text=Privacidade'` (rodapé da lateral); `professora`, de `/professor/nova-conversa`, com `--clicar 'text=Meus dados'` (menu da pessoa). Mockup: `mockups/src/areas/aluno/Privacidade.tsx`, só pelo lugar do item no rodapé; o conteúdo dele não é desta fatia. A vitrine não tem pedido: a foto é a do vazio, nas duas escolas.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --e2e)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

A tela da coordenação (17.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

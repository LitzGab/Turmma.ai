# Tarefa 6.0 — Escola › Professores em tabela, com o painel do professor

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba Professores mostra os professores em tabela e abre cada um num painel ao lado, com a situação e o convite; cadastrar, copiar o link uma vez, refazer e revogar continuam como hoje.

## Contexto necessário

- `techspec.md` seções 5 (`?professor=`), 6 e 9 ("Professores"); `prd.md` RF13, RF22 e seção 6, ponto 2
- `mockup.md` seção 3.6: a tabela, o painel e os diálogos
- `.claude/rules/20-lgpd-menores.md` itens 4 e 8
- Código: `apps/web/src/areas/coordenacao/Professores.tsx` e `convite-de-professor.ts` (o que cada estado permite não muda); `apps/web/src/componentes/DialogoDoConvite.tsx`, que **não muda**; `apps/web/src/api/professores.ts` (`gcTime: 0` do token)

## Subtarefas

- [ ] 6.1 — `professores-da-escola.ts` (puro): por professor, as turmas e as disciplinas dos vínculos pendentes, confirmados e contestados
- [ ] 6.2 — A tabela, na lista "Professores da escola": Nome, Disciplinas, Turmas e Situação (`Estado` com o texto de `TEXTO_DO_ESTADO_DO_PROFESSOR`). Sem e-mail, sem busca e sem ordem que não seja a do nome. A contagem "N professores" e "Cadastrar professor" como o único botão `primario`
- [ ] 6.3 — A linha abre o `PainelLado` do professor (`?professor=<usuarioId>`): o nome, a situação e, no rodapé, só as ações que o estado permite ("Refazer convite", "Revogar convite"). O id que não é da escola não abre nada
- [ ] 6.4 — Os diálogos de cadastrar, refazer e revogar são os de hoje, abertos da aba e do painel; o foco volta a quem abriu
- [ ] 6.5 — O vazio "Nenhum professor ainda", com "Cadastrar professor"
- [ ] 6.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Professores.tsx` | alterado |
| `apps/web/src/areas/coordenacao/PainelDoProfessor.tsx`, `apps/web/src/areas/coordenacao/Professores.test.tsx` | novo |
| `apps/web/src/areas/coordenacao/professores-da-escola.ts`, `apps/web/src/areas/coordenacao/professores-da-escola.test.ts` | novo |
| `e2e/professores.spec.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| turmas e disciplinas do professor | unidade | duas disciplinas na mesma turma: a turma uma vez, as duas disciplinas; vínculo encerrado não conta; professor sem vínculo fica com "—" |
| estados da tela | componente | carregando; erro com "Tentar de novo"; vazio com "Cadastrar professor"; com dado, o estado de cada convite em texto; o foco depois de fechar o painel |
| nenhum e-mail | componente | a tabela e o painel não mostram e-mail, e o painel não o pede à API |
| as ações por estado | e2e | o caso W4 de hoje: só as ações que o estado permite, agora no painel |
| cadastrar e copiar | e2e | o caso W14 de hoje: o resumo antes, o link uma vez, fechar sem copiar pergunta |
| clique duplo | e2e | o caso de hoje: um link só; um pedido só em refazer e em revogar |
| recomeço: segunda pessoa; o painel pelo endereço; a sessão que vence com o link na tela; falha com o diálogo aberto | e2e | os casos de hoje; o `?professor=` de A na sessão de B não abre painel |
| 360 px e teclado | e2e | o caso W12 de hoje, com a tabela virando lista e o painel como folha de baixo |

## Como testar

- `e2e/professores.spec.ts`: os oito casos ficam; muda o clique que chega à ação (linha, painel, botão)
- `escola-montada` e o roteiro: só o passo "cadastrar professor"
- O token do convite continua só no diálogo: o painel não o guarda nem o repete
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/Professores.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/professores.spec.ts`
- Telas: `coordenacao`, `/coordenacao/professores`, clique na primeira linha; também com `--vazia`; mockup `/coordenacao/escola?aba=professores`

## Fora do escopo desta tarefa

As turmas do professor no painel e "Acrescentar turma" (7.0); encerrar vínculo; professor "da grade horária" (F2); avatar com foto.

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

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


# Tarefa 2.0 — O aluno navega por Início, Tarefas e Eu, e abre no Início

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 1.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O aluno passa a ter três lugares, cada um abrindo uma tela que já existe, e entra pelo Início.

## Contexto necessário

- `techspec.md` seção 9 ("Lugares", "Nomes que não mudam"); `prd.md` RF1 a RF3; `mockup.md` seção 1
- Regras 50 (itens 5 e 9) e 70 (item 4)
- Código: o cabeçalho de `apps/web/src/areas/navegacao.ts`; `areas/aluno/Tutor.tsx` e `MinhaTurma.tsx`; `encerrar`,
  em `CascaDaEscola.tsx`

## Subtarefas

- [ ] 2.1 — `caminhos.ts`: `inicio` e `eu` do aluno, `bemVindo` nas três áreas e `ehTelaDeFoco(caminho)`: os
  endereços da spec nascem todos aqui
- [ ] 2.2 — `NAVEGACAO.aluno`: Início (também em `/aluno/tutor`), Tarefas e Eu (também em `/aluno/privacidade`);
  o rodapé do aluno fica vazio
- [ ] 2.3 — `Inicio.tsx`: a faixa de supervisão e a escolha da atividade, extraídas de `Tutor.tsx` sem mudar texto
  nem `data-*`. `Eu.tsx`: o cartão da turma (com "sem turma neste ano") e as linhas "Privacidade" e "Sair", pelo
  `aoSair` que a casca passa a expor por contexto. `MinhaTurma.tsx` sai, e o endereço redireciona com `replace`
- [ ] 2.4 — "Atividades" vira "Tarefas" no título e na aba; o aluno abre em `/aluno/inicio`; `esperarAtividades`
  vira `esperarInicioDoAluno`; a API simulada do aluno responde a conversa sem atividade e `/v1/tutor/memoria`
- [ ] 2.5 — `docs/interface.md` 11.1 e `docs/glossario.md` (Início, Tarefas, Eu)
- [ ] 2.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/caminhos.ts`, `apps/web/src/caminhos.test.ts`, `apps/web/src/areas/navegacao.ts`, `apps/web/src/areas/navegacao.test.ts` | alterado |
| `apps/web/src/areas/aluno/Inicio.tsx`, `apps/web/src/areas/aluno/Eu.tsx`, `apps/web/src/areas/aluno/EscolhaDaAtividade.tsx`, `apps/web/src/areas/aluno/FaixaDeSupervisao.tsx` | novo |
| `apps/web/src/areas/aluno/rotas.tsx`, `apps/web/src/areas/aluno/Tutor.tsx`, `apps/web/src/areas/aluno/Atividades.tsx`, `apps/web/src/areas/aluno/MinhaTurma.tsx` | alterado |
| `apps/web/src/paginas/Inicio.tsx`, `apps/web/src/componentes/CascaDaEscola.tsx`, `docs/interface.md`, `docs/glossario.md` | alterado |
| `e2e/__fixtures__/casca.ts`, `e2e/__fixtures__/aluno.ts`, `e2e/areas.spec.ts`, `e2e/minha-turma.spec.ts`, `e2e/meus-dados.spec.ts`, `e2e/aluno-atividade.spec.ts`, `e2e/aluno-tutor.spec.ts`, `e2e/aluno-fluxo.spec.ts` | alterado |
| `e2e/escola-e-vinculos.spec.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts`, `e2e/acesso-suspenso.spec.ts`, `e2e/entrar-na-escola.spec.ts`, `e2e/inatividade.spec.ts`, `e2e/troca-de-escola.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| lugares | unidade | três itens, rodapé vazio; Início selecionado na conversa do Tutor, Eu em Privacidade |
| lugares na tela | e2e | cada item leva à tela dele, com título da aba e `aria-current`; no celular, na barra de baixo |
| endereços | e2e | a entrada cai em `/aluno/inicio`; os de hoje abrem; `/aluno/minha-turma` vira `/aluno/eu` |
| borda: aluno sem turma no ano | e2e | Eu mostra o texto de hoje, e não erro de rede |
| supervisão | e2e | a faixa está no Início e na conversa, sem botão de fechar |
| Privacidade e Sair | e2e | "Meus dados" por Eu, a 360 px; "Sair" a um clique em cada lugar |
| estados da tela | componente | Início e Eu: carregando, erro, vazio só com a leitura terminada, com dado |
| recomeço da tela | e2e | o aluno seguinte no mesmo Chromebook vê o Início e o Eu dele; a resposta atrasada do anterior não aparece |

## Como testar

- `e2e/areas.spec.ts › o aluno vê "Tutor", "Atividades" e "Minha turma"…`: troca `ITENS_DO_ALUNO` e o rodapé
- `e2e/minha-turma.spec.ts`, os quatro casos, em `/aluno/eu`; `e2e/meus-dados.spec.ts › o aluno acha Privacidade no
  rodapé…` passa a ir por Eu
- Componente: `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`)
- Rodar: `node tools/ci/e2e.ts --manter-ambiente e2e/areas.spec.ts`
- Armadilha: em Eu há dois "Sair" (a linha e a casca); localize pelo contêiner
- Telas: `aluno`, `/aluno/inicio`, `/aluno/eu`, `/aluno/atividades`; mockup `/aluno` e `/aluno/eu`

## Fora do escopo desta tarefa

Início e Eu recompostos (3.0, 7.0), os grupos de Tarefas (4.0) e as rotas `bem-vindo` (9.0 a 11.0).

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

# Tarefa 3.0 — O Início mostra o Tutor, a faixa de supervisão, as próximas tarefas e o uso do dia

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O Início do aluno passa a ter saudação, faixa de supervisão presa, até três tarefas "Para fazer", "Hoje: N de 60 perguntas" e, se
houver, o aviso da pausa, sem tirar o caminho até o Tutor.

## Contexto necessário

- `techspec.md` seções 7b, 7c e 9 ("Início"); `prd.md` RF3 a RF5, RF10 e RF20; `mockup.md` seção 2.1 (Início vazio, estados, "Formato
  do descansando") e fecho (d), pontos 1, 2 e 5
- Regras 50 (itens 5 e 9), 70 (itens 4, 4a e 4b) e 80 (item 10); D36, D38, D58 e D59
- Código: `areas/aluno/Tutor.tsx` (`FaixaDeSupervisao`, `Pausa`, `EscolhaDaAtividade`); `areas/aluno/tutor.ts` (`usoDoDia`,
  `avisoDaPausa`, `pausaDoEstado`, `TEXTO_DA_SUPERVISAO`); `areas/aluno/atividades.ts`; `api/tutor.ts`
- Esta tarefa corre junto da 4.0 e da 5.0: **não importa** `separarAtividades` (use `estaParaResponder`, que a 4.0 mantém) nem as
  poses da onça (a saudação usa `AssinaturaIA agente="tutor"`, da X1)

## Subtarefas

- [ ] 3.1 — `consultaUsoDoTutor` em arquivo novo, `api/uso-do-tutor.ts`: `GET /v1/tutor/conversa?limite=1`, sem atividade, na
  família de chave `CHAVE_DA_CONVERSA_DO_TUTOR` (a conversa terminada a relê). Nenhuma rota nova
- [ ] 3.2 — `Inicio.tsx`: "Oi, <primeiro nome>." com `AssinaturaIA`; a faixa presa (`TEXTO_DA_SUPERVISAO`, sem fechar); "Para fazer"
  (até três da primeira página, cada uma com "Pedir ajuda ao Tutor" até `caminhoDoTutorNaAtividade`) e "Ver todas as tarefas"; o uso
  do dia (`usoDoDia` e `BarraRotulada` neutra); a pausa pelo `avisoDaPausa`, extraída de `Tutor.tsx` para `AvisoDaPausa.tsx` sem
  mudar texto nem `data-*`. A tarefa avaliativa leva o `AVISO_DA_AVALIACAO` e o caminho continua
- [ ] 3.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/api/uso-do-tutor.ts`, `apps/web/src/areas/aluno/AvisoDaPausa.tsx`, `apps/web/src/areas/aluno/Inicio.test.tsx`, `e2e/aluno-inicio.spec.ts` | novo |
| `apps/web/src/areas/aluno/Inicio.tsx`, `apps/web/src/areas/aluno/Tutor.tsx` | alterado |

Não edita `api/tutor.ts` (é da 7.0, em arquivo à parte), `e2e/__fixtures__/aluno.ts` nem `atividades.ts`.

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| quatro estados | componente | carregando; vazio só com a leitura terminada ("Nenhuma tarefa por agora"); erro do uso com "Tentar de novo" e o resto de pé; com dado |
| uma chamada a mais | componente | a rede vê `minhas-atividades` e `tutor/conversa?limite=1`, e mais nada (7c) |
| faixa presa | componente + e2e | sem botão de fechar; à vista depois de rolar, a 360 px |
| pausas: avaliação, limite do dia, função suspensa | componente | o texto do `avisoDaPausa`, e o link "Pedir ajuda ao Tutor" continua (D36) |
| avaliativa aberta | componente | a linha traz o aviso e o caminho não some |
| borda: aluno sem turma no ano | componente | sem tarefa e sem bloco de uso, e sem erro de rede |
| varredura de texto (RF10) | componente | nenhum "sequência", "pontos", "ranking", "meta", "colega", "média" nem "posição" |
| recomeço da tela | e2e | o aluno seguinte no mesmo computador vê o Início dele; a resposta atrasada do anterior não aparece |

Concorrência e log não se aplicam: só leitura, sem texto de aluno em log.

## Como testar

- Copie `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa().segurar()` para o carregando)
- E2e: o ponto de partida é `e2e/aluno-tutor.spec.ts › em avaliação…` e `› no limite do dia…`, que continuam verdes sem mudar
- Rodar: `npx vitest run --project unidade apps/web/src/areas/aluno/Inicio.test.tsx` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/aluno-inicio.spec.ts`
- Telas: `aluno`, `/aluno/inicio` (entrar pela matrícula; com avaliação aberta ou 60 de 60 perguntas, a pausa); mockup `/aluno` e
  `/aluno?estado=prova|limite`

## Fora do escopo desta tarefa

Caixa de pergunta no Início, sugestões de pergunta, conversa livre com histórico, foto, voto, Refazer e Editar (F9); onça de corpo
inteiro; "Avisar um adulto"; a caixa que some na pausa (D36).

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

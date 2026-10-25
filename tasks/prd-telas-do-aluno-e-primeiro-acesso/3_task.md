# Tarefa 3.0 — O Início mostra o Tutor, a faixa de supervisão e as próximas tarefas

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O Início do aluno passa a ter saudação, faixa de supervisão presa e até três tarefas "Para fazer", com o aviso da avaliação aberta,
sem tirar o caminho até o Tutor. **Não lê `tutor/conversa` nem mostra o uso do dia** (techspec 7c).

## Contexto necessário

- `techspec.md` seções 7b, 7c e 9 ("Início", com as leituras); `prd.md` RF3 a RF5, RF10 e RF20; `mockup.md` seção 2.1 (Início vazio, estados, "Formato
  do descansando") e fecho (d), pontos 1, 2 e 5
- Regras 50 (itens 5 e 9), 70 (itens 4, 4a e 4b) e 80 (item 10); D36, D38, D58 e D59
- Código: `areas/aluno/Tutor.tsx` (`FaixaDeSupervisao`, `EscolhaDaAtividade`); `areas/aluno/tutor.ts` (`TEXTO_DA_SUPERVISAO`);
  `areas/aluno/atividades.ts` (`AVISO_DA_AVALIACAO`); `infra/k6/login-7h30.js`
- Esta tarefa corre junto da 4.0 e da 5.0: **não importa** `separarAtividades` (use `estaParaResponder`, que a 4.0 mantém) nem as
  poses da onça (a saudação usa `AssinaturaIA agente="tutor"`, de `componentes/ui/ia/AssinaturaIA.tsx`)

## Subtarefas

- [ ] 3.1 — Carga. `infra/scripts/carga-login.ts` (`semearContas`, `criarEscola`): ano em curso nas três escolas, turmas de 35,
  vínculo `confirmado` para as contas de aluno da rajada (com a introdução já vista) e atividades aplicadas que encham a
  primeira página, algumas com tentativa e resposta. `infra/k6/login-7h30.js`: o aluno, depois do login, faz `GET /v1/eu` e a
  primeira página de `GET /v1/minhas-atividades`; exige 200, página não vazia, contados em `respostas_inesperadas`; as duas
  entram em `autenticada_duracao`, com a tag `name` da rota, e a fase `rajada` ganha
  `autenticada_duracao{grupo:rajada}: p(95) < P95_MAXIMO_DO_LOGIN_MS`, e o mesmo limite só para a rota
  `GET /v1/minhas-atividades` (techspec 7c)
- [ ] 3.2 — `Inicio.tsx`: "Oi, <primeiro nome>." fixa, sem "de volta" nem "faz tempo", com `AssinaturaIA`; a faixa presa
  (`TEXTO_DA_SUPERVISAO`, sem fechar); "Para fazer" (até três da primeira página, cada uma com "Pedir ajuda ao Tutor" até
  `caminhoDoTutorNaAtividade`, `href` afirmado) e "Ver todas as tarefas"; o vazio diz que o Tutor ajuda quando houver tarefa; "Sair" do tamanho dos vizinhos. A tarefa avaliativa leva o
  `AVISO_DA_AVALIACAO` e o caminho continua. Leituras com o `staleTime` e o `refetchOnWindowFocus` da seção 9. Sem uso do dia
- [ ] 3.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/aluno/Inicio.test.tsx`, `e2e/aluno-inicio.spec.ts` | novo |
| `apps/web/src/areas/aluno/Inicio.tsx`, `infra/k6/login-7h30.js`, `infra/scripts/carga-login.ts` | alterado |

Não edita `Tutor.tsx`, `api/tutor.ts`, `e2e/__fixtures__/aluno.ts` nem `atividades.ts`.

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| quatro estados | componente | carregando; vazio só com a leitura terminada ("Nenhuma tarefa por agora"); erro das tarefas com "Tentar de novo", a saudação e a faixa de pé; com dado |
| sem `tutor/conversa` | componente | a rede vê `minhas-atividades` (e o `/v1/eu` do desvio), e **nunca** `tutor/conversa` (7c) |
| saudação fixa (D58, D59) | unidade | o texto é o mesmo com qualquer nome, sem "de volta", "faz tempo" nem número de uso |
| carga do login (k6) | carga | o cenário `login-7h30` exercita `/v1/eu` e `minhas-atividades` do aluno com seed de turma e atividades: 200 e página não vazia; as duas entram em `autenticada_duracao`, com a tag `name` da rota, e a fase `rajada` tem o limite `autenticada_duracao{grupo:rajada}: p(95) < P95_MAXIMO_DO_LOGIN_MS` (1.000 ms): `minhas-atividades` lenta reprova o cenário |
| faixa presa | componente + e2e | sem botão de fechar; à vista depois de rolar, a 360 px |
| avaliativa aberta | componente | a linha traz o `AVISO_DA_AVALIACAO` e o link "Pedir ajuda ao Tutor" continua, com o `href` do Tutor (D36) |
| borda: aluno sem turma no ano | componente | "Nenhuma tarefa por agora", sem erro de rede |
| nada promete o Tutor | unidade | o vazio diz que o Tutor ajuda quando houver tarefa; nenhum texto do Início promete que ele está disponível |
| varredura de texto (RF10) | componente | nenhum "sequência", "pontos", "ranking", "meta", "colega", "média" nem "posição" |
| recomeço da tela | e2e | o aluno seguinte no mesmo computador vê o Início dele; a resposta atrasada do anterior não aparece |

Limite do dia e função suspensa seguem testados na tela do Tutor (`e2e/aluno-tutor.spec.ts`), que esta tarefa não altera.
Concorrência e log não se aplicam: só leitura, sem texto de aluno em log.

## Como testar

- Copie `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa().segurar()` para o carregando)
- E2e: `e2e/aluno-tutor.spec.ts › em avaliação…` e `› no limite do dia…` continuam verdes sem mudar
- Rodar: `npx vitest run --project unidade apps/web/src/areas/aluno/Inicio.test.tsx` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/aluno-inicio.spec.ts`
- Telas: `aluno`, `/aluno/inicio` (entrar pela matrícula; com avaliação aberta, o aviso); mockup `/aluno` e `/aluno?estado=prova`

## Fora do escopo desta tarefa

Caixa de pergunta no Início, sugestões de pergunta, conversa livre com histórico, foto, voto, Refazer e Editar (F9); onça de corpo
inteiro; "Avisar um adulto"; a caixa que some na pausa (D36); o "Hoje: N de 60" no Início (fica no Tutor).

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

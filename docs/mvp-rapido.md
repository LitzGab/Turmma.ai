# MVP de apresentação, caminho rápido (A2 a A5 numa fatia só)

> Branch `mvp/apresentacao`, na pasta principal (D77). Prazo: terça, 06/10/2026. Este documento **substitui, só para
> esta fatia**, o ciclo PRD → Tech Spec → tarefas da A2 a A5: cinco specs viram uma fatia, com contratos primeiro e
> telas em paralelo. As regras que importam continuam as mesmas. Os pacotes correm em worktrees irmãos
> (`../Educa.ia-mvp-<pacote>`, branch `mvp/<pacote>`) e o merge na `mvp/apresentacao` é do orquestrador.
> **Quem retoma o trabalho começa pela seção "Estado", logo abaixo.**

## Estado

> Atualizada a cada commit. Quem retoma lê esta seção, `git log mvp/apresentacao` e `git status`.

**Fase atual:** fase 2 (A2) em curso. **A fase 1 está fechada** (`97da66a`, 04/10/2026), com os quatro revisores aprovando.

**Feito**

- Esteira da `develop` verde no `573f0a1`, branch `mvp/apresentacao` criada da `develop` e publicada, D77 registrada.
- Este documento corrigido (`a8d2fe1`), com as fases da seção 3, a trava do banco de teste e o passo a passo dos pacotes.
- O marcador `(mvp: <resumo>)` em `tools/processo/revisoes.ts`, com nove casos em `revisoes.test.ts` (`8c054ce`).
- Os contratos de `packages/shared` de time e assistente (`336a756`).
- A etapa 1 das cinco AIAs em `docs/aia/` (`d23179a`), em rascunho, **esperando a revisão do Joaquim**.
- **Fase 1 integrada** (`7fddb5f`), com o portão local verde (254 arquivos, 3353 testes): migration 0022 com 17 tabelas,
  schemas das 41 rotas, `MATRIZ`, códigos de erro, auditoria e `docs/mvp-contratos.md` (S); porta `LLMProvider`,
  adaptador falso e OpenAI-compatível, sete tarefas, `ExecutorDeAgente`, suspensão por função (L); peças da web e
  convenção de pedaço por tela (C); conteúdo, script e PDF de demonstração (D).

**Revisão da fase 1** (uma passada, sobre `mvp/fase-1` em `88e2d32`)

| Revisor | Veredito | O que exigiu | Quem corrige |
|---|---|---|---|
| `tenancy-guardian` | REPROVADO | O teste das restrições cobre 24 das 50 FKs de escola e nenhum caso de segundo ano letivo. Estrutura sem furo | S, rodada 2 |
| `privacy-guardian` | REPROVADO | A conversa do professor era copiada para `consumo_ia`; `LLM_PROCESSAMENTO_LOCAL=true` aceitava endereço de fora | L, rodada 3; S, rodada 2 |
| `conformidade-reviewer` | REPROVADO | A recusa do Tutor dependia de o modelo se classificar certo; faltava ao professor o uso do Tutor por turma; o resumo do Analista tinha texto livre | L, rodada 3; S, rodada 2 |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | Botão desligado igual ao ligado; foco caindo no `body` em três peças; Enter enviando no teclado virtual; cinco peças faltando | C, rodada 3 |

As recomendações acatadas foram junto: FK com a turma e com o ano letivo, gatilho da D56 que recusa validação com
destaque não aberto, autoria por papel, saída do "(D47)" da tela (migration 0023). As correções estão integradas no
`1440e79`, com o portão local verde (257 arquivos, 3466 testes).

**Segunda passada**, só sobre o diff das correções (`88e2d32..bd3793c`)

| Revisor | Veredito | O que ficou |
|---|---|---|
| `frontend-reviewer` | APROVADO | Recomendações em correção no C, rodada 4 (foco atrás da barra presa, Markdown cru no texto da IA, galeria só por variável) |
| `conformidade-reviewer` | APROVADO | A regra de recusa do Tutor tem falso positivo e falso negativo: em correção no L, rodada 4, com arquivo de amostras. Para aluno real, exige taxa medida contra o modelo |
| `tenancy-guardian` | REPROVADO | Duas cláusulas de escopo do módulo de IA da API sem teste que as proteja (limite do Tutor por escola; mensagem do Tutor lida pela execução). L, rodada 4 |
| `privacy-guardian` | REPROVADO | O adaptador de modelo seguia redirecionamento HTTP, e o registro de envio externo poderia mentir. L, rodada 4 |

**Terceira passada** (`bd3793c..d4e9faf`): `tenancy-guardian` APROVADO e `privacy-guardian` APROVADO. A rodada 4 de L
e de C está integrada no `97da66a`, com o portão local verde (257 arquivos, 3515 testes). Recomendações que ficaram:
o teste da cláusula de escola em `ia.int.test.ts` usa mensagens criadas por outros testes do arquivo; quem chamar a
camada de IA fora de requisição e fora do executor precisa abrir contexto com a escola, ou a guarda de escola do
provedor não compara nada; as 15 amostras de saída do Tutor são poucas para declarar a taxa do modelo local.

**Em curso**

| Pacote | Worktree e branch | O que faz |
|---|---|---|
| W, rodada 2 | `../Educa.ia-mvp-w`, `mvp/w` | e2e do fluxo da A2 contra a API real, professor abrindo em Nova conversa, "Só conversar" ligado |
| P, rodada 2 | `../Educa.ia-mvp-p`, `mvp/p` | artefato e entrega autorizados pela turma **e pela disciplina** |
| A (API) | `../Educa.ia-mvp-a`, `mvp/a` | atividade aplicada, respostas, correção, validação do lote, desempenho da turma |
| T (API) | `../Educa.ia-mvp-t`, `mvp/t` | Tutor, memória, sinais e uso do Tutor por turma |

Integrados na `mvp/fase-2` (`02b4b1a`), ainda sem portão: M (material, API e tela), P (API do Assistente), W (telas do
professor, com a API simulada no e2e dos estados) e a quinta rodada do C (o menu que fechava sozinho depois de uma
rolagem era defeito de produto, corrigido; `Tela` sem margem dobrada; campo condicional no formulário).

A branch de integração da fase 2 é `mvp/fase-2` (`../Educa.ia-mvp-fase-2`). Os worktrees de S, L e C ficam de pé
para rodadas de correção.

**Interrupção de 04/10/2026:** o limite de uso da sessão estourou por volta das 11h50 e derrubou os cinco agentes
acima no meio do trabalho. Nada se perdeu: cada worktree ficou com o que estava escrito, sem commit, e os cinco foram
retomados às 14h21 do ponto em que pararam. Se acontecer de novo, retoma-se cada agente pelo worktree dele.

**Falta**

- Fechar a fase 2: integrar a rodada 2 de W e de P, portão, revisores da fase (os três com veto e o
  `frontend-reviewer`) e esteira.
- Fase 3: integrar as APIs de A e de T; depois, as telas do aluno (atividades, Tutor), o Aprovar, Turmas com
  desempenho e os sinais no Seu time, num pacote de telas que só começa quando o W terminar (mexem nos mesmos arquivos).
- Fase 4 (governança e Analista) e o fechamento (seção 8).

Para os pacotes das fases 3 e 4, o que os revisores já pediram:
- **A (atividade e correção):** `aprovar-lote` monta `apresentado` e `aberto` das linhas de `correcao` no servidor;
  aprovar sem nunca ter lido a correção do lote é recusado ou fica registrado; correção inserida ou alterada depois do
  lote aprovado não pode passar (reexecução do job); o aluno precisa ser da turma da aplicação antes de criar a
  tentativa; a correção determinística chama a conferência de função ativa.
- **T (Tutor e sinais):** os turnos anteriores que vão ao modelo se filtram por `mensagem_tutor.tipo =
  'assunto_delicado'`, não por igualdade com o texto da mensagem fixa; o aluno no limite diário que escreve assunto delicado recebe o encaminhamento, não o 429, e
  a tela no estado `limite` não trava a caixa; a rota `GET /v1/tutor/uso`; memória só de lote aprovado; sinal
  `pediu a resposta pronta` só nasce de classificação com questão em andamento; nada de "há X minutos" nem ordenação
  por recência no uso do Tutor.
- **G (governança e Analista):** só o alerta `habilidade_com_acerto_baixo` é produzido nesta fatia; os outros tipos do
  contrato não ganham tela; consumo não abre por origem nem por aluno; a lista do resumo aplica o grupo mínimo de dois
  professores ou omite a série.

**Esteira disparada à mão**

| Quando | Execução | Commit | Resultado |
|---|---|---|---|
| fase 1 | `37208632853` | `7fddb5f` | verde na reexecução. Na primeira vez, só o job de infra caiu, no ensaio de alertas: a regra "Login recusado pelo semáforo do hash" ficou em `pending` até o prazo de 540 s. Nada da fase 1 mexe em login, e o job passou ao ser rodado de novo: intermitente, a observar |
| correções da fase 1 | `37220240549` | `1440e79` | verde, todos os jobs, inclusive infra |

**Modelo local do ensaio final:** `qwen3.6-35b-a3b` no `llama-server` (`GET /v1/models` em 04/10/2026; estava
descarregado, e quem carrega é o Joaquim).

**Decisões tomadas pelo Claude nesta execução (a revisar pelo Joaquim)**

1. **Outra sessão aberta na pasta.** Em 04/10/2026 havia uma segunda sessão do Claude nesta pasta (a conversa de
   planejamento, que escreveu o prompt), parada e sem ferramenta em curso. Não estava editando, então o trabalho
   seguiu. Se ela voltar a commitar, o commit cai nesta branch.
2. **As fases 1 a 4** não estavam escritas na seção 3; ficaram definidas ali, seguindo a prioridade A2 → A3 → A4 → A5.
3. **Banco de teste com worktrees em paralelo.** O projeto compose de teste é um só (`educa-teste`, portas fixas), e
   o portão local derruba os volumes. A saída está na seção 5: trava de arquivo em volta de tudo que usa o banco.
4. **O merge passa pelo portão.** Cada fase é integrada numa branch `mvp/fase-<n>` e entra na `mvp/apresentacao` por
   `git merge --no-ff --no-commit`, portão local e `git commit` com `(mvp: …)`, que é o que o hook confere. Os commits
   dos pacotes nos worktrees não passam pelo hook (ele olha a pasta principal), e por isso não contam como portão.
5. **O marcador `(mvp: …)` só vale em branch `mvp/…`** e exige typecheck, lint e test carimbados. O e2e não entra no
   portão de cada commit (leva perto de uma hora): roda na esteira de cada fase e no fechamento.
6. **A seção 8 dizia que os passos 0 a 4 estavam feitos; estavam o 0, o 1 e o 2.** O hook (3) e as AIAs (4) são os
   itens 1 e 2 do prompt de 04/10/2026 e entraram em "Falta".
7. **Dois pacotes a mais na fase 1, C e D.** As peças da web (seção 9.3) e o PDF de demonstração (seção 9.5) não
   dependem do contrato, então saíram na frente, em paralelo com S e L, para as telas das fases 2 a 4 já nascerem
   com as mesmas peças.
8. **Recusa de material sem licença não grava `material`**: grava auditoria e responde `MATERIAL_SEM_LICENCA` antes
   de extrair. O estado `recusado` do mockup é da tela, não de uma linha no banco.
9. **A versão adaptada é aplicada à turma, como qualquer artefato.** Não existe vínculo entre aluno e adaptação, nem
   tabela nem coluna (D35): dizer qual aluno recebe qual adaptação é dado sensível que esta fatia não coleta.
10. **Um adaptador só para modelo local.** O `OpenAICompatAdapter` atende o `llama-server` e atenderia o Ollama pelo
    `/v1` dele; não há `OllamaAdapter` separado nesta fatia.
11. **Dependências novas, lista fechada:** `clsx`, `class-variance-authority` e Radix (seleção, menu, abas, diálogo de
    alerta) na web; `pdfkit` e `pdfjs-dist` para gerar e extrair PDF. Conflito de `package-lock.json` entre pacotes se
    resolve no merge, com `npm install`.
13. **O Tutor só lembra de resultado aprovado.** O roteiro (seção 1) põe o Tutor lembrando "do que ele errou" no passo
    3, antes de a professora aprovar a correção no passo 4, e o diagnóstico só pode chegar ao aluno depois da aprovação.
    Fica assim: a memória do Tutor vem dos lotes **já aprovados** e das sessões anteriores do próprio aluno com o
    Tutor. Na demonstração, o aluno abre o Tutor numa segunda atividade, depois de a primeira ter sido aprovada.
14. **Suspender uma função recusa execução nova e não apaga o que já foi produzido.** A entrega pendente de uma função
    suspensa continua podendo ser aprovada ou rejeitada pelo professor: quem decide é a pessoa.
15. **`consumo_ia` não guarda texto livre de pessoa**, de aluno nem de professor: nessas tarefas, `entrada` e `saida`
    ficam nulas, e o registro do que foi dito é `mensagem_tutor` ou `mensagem_agente`, ligado pela execução.
16. **A correção da revisão entra por migration 0023, aditiva**, em vez de reescrever a 0022 já integrada.
17. **A fase 2 começou com o veto da fase 1 ainda aberto.** As correções são restrições e testes a mais, não mudança de
    contrato, e as armadilhas que cada revisor listou por pacote foram para os briefs. A fase 1 só conta como fechada
    com a segunda passada aprovada.
18. **Sem dependência nova na web.** O pacote C mediu o Radix (36,8 kB os quatro) e escreveu as peças à mão; `clsx` e
    `class-variance-authority` também ficaram de fora. A decisão 11 fica só com `pdfkit` e `pdfjs-dist`.
20. **"Só conversar" virou campo do contrato** (`resposta: 'so_conversar'` no pedido de mensagem): sem ele, uma das duas
    opções da pergunta da D18 não fazia nada.
21. **Artefato e entrega se autorizam pela turma e pela disciplina.** Com só a turma, a professora de outra disciplina
    da mesma turma leria o artefato da colega e decidiria a versão adaptada dela.
22. **O professor abre em Nova conversa** (D73), e os specs da A1 que afirmavam a página "Início" para o professor são
    ajustados na rodada 2 do W.
23. **A fase 3 começou pela API**, em paralelo com o fim da fase 2; as telas dela esperam o W.
24. **Teto do grupo "peças + galeria" em 26 kB** (medido: 23,47). O primeiro carregamento está em 141,57 de 150 kB;
    cerca de 15 kB do grupo são pedaços que a entrada nunca baixa, mas o glob soma.
19. **Uma thread só por professora com o Assistente** nesta fatia: sem "Histórico" na lateral.
12. **Teto de bundle.** As peças novas e o Radix não podem entrar no primeiro carregamento (150 kB). Os tetos por área
    (`professor-*` 8 kB, `coordenacao-*` 16 kB, `aluno-*` 5 kB) vão ser revistos quando as telas chegarem, com o número
    medido, e cada tela entra por import de rota.

## 1. O que a demonstração mostra (o roteiro, D71)

1. **Coordenação** (escola já montada pela A1) sobe um material (PDF) com titularidade e licença declaradas. Sem licença,
   o sistema recusa **antes** de extrair (D5, D75).
2. **Professora** conversa com o **Assistente de ensino**. Ele pergunta se ela quer a ferramenta (D18), abre o cartão,
   gera a atividade objetiva com a **página citada**, ela salva e exporta em PDF. Pede a versão adaptada escolhendo o
   **tipo de adaptação** (nunca texto livre sobre o aluno); a versão nasce **pendente** e ela aprova.
3. **Professora** aplica a atividade à turma. O **aluno** responde no navegador e abre o **Tutor**: tenta arrancar a
   resposta, o Tutor recusa, conduz por perguntas, cita a página e lembra do que ele errou.
4. **Professora** vê em "Seu time" o sinal do Tutor ("oito travaram na questão 3"). A correção da objetiva chega
   **pendente**; ela abre os destaques, aprova o lote com o **registro da validação** (D56) e vê o acerto por habilidade
   em **Turmas**. O aluno só vê o diagnóstico depois de aprovado.
5. **Coordenação** abre a governança: o que a IA gerou e quem aprovou, o que cada função faz sozinha (com suspensão por
   função), o consumo, e o resumo do **Analista de desempenho escolar**, em agregado.

Dado 100% sintético. Sem `Nota` (D46): é diagnóstico formativo. Sem discursiva (D55).

## 2. O que fica de fora (é o que torna isto rápido)

Não entram: fila BullMQ para a IA (ver 4), gateway com limitador e reserva, k6, runbook e alertas novos, `test:infra`,
`size-limit` novo, a esteira por tarefa, AIA completa (só a etapa 1, em `docs/aia/`), grade horária, calendário,
busca na web, família, nota oficial, ENEM, BNCC completa (só um catálogo curto de habilidades por disciplina, em código).

Não é desculpa para relaxar o que não se negocia, e **continua valendo, com teste que quebra se a regra sumir**:

- **Regra 10**: toda tabela nova tem `escola_id` (e `ano_letivo_id` se varia por período), o escopo vem do contexto no
  repository, nunca de argumento; objeto de outra escola responde como inexistente (404 igual ao inexistente); cada
  módulo novo tem teste de isolamento.
- **Regra 20**: nada de nome, resposta, conversa ou prompt em log; DTO de saída explícito; aluno sem e-mail, CPF ou
  foto; campo pessoal novo entra na tabela de `docs/lgpd.md` na mesma tarefa.
- **Regra 70 / D55 / D56 / D47 / D57 / D58 / D66**: nada que a IA produz chega ao aluno sem aprovação registrada (exceto
  a resposta do Tutor, supervisionada); a IA não diz nada sobre o texto discursivo de aluno; a validação do lote guarda
  o que foi apresentado, o que foi aberto e quem confirmou; sem inferência de emoção; o agente nunca se passa por
  pessoa; o Tutor lembra do trabalho do aluno, nunca de texto sobre a pessoa.
- **Regra 30**: nenhum módulo chama o provedor de IA direto; sempre pela porta `LLMProvider`.
- **Regra 40**: teste prova regra de negócio (se apagar a regra, o teste falha). Nada de `.skip`, `any` para calar o
  compilador, nem asserção que sempre passa.
- **Vocabulário** do glossário (`turma`, `nota`, `matricula`...), idioma único por entidade.

## 3. Como o trabalho se organiza

Contratos primeiro: **tabelas, tipos de API (`packages/shared`), células da `MATRIZ` e o catálogo de funções** nascem
juntos, de uma vez, numa única migration (0022) — o snapshot do drizzle é uma corrente, então migration em paralelo
quebra. Depois API e web correm lado a lado em cima do contrato.

| Pacote | Dono | Arquivos |
|---|---|---|
| S — contratos e dados | agente S | `packages/nucleo/src/db/schema/*` (novos), `packages/nucleo/drizzle/*`, `packages/shared/src/{material,assistente,atividade,tutor,governanca,time}/*`, `matriz.ts` |
| L — camada de IA | agente L | `packages/nucleo/src/ia/*` |
| M — material (API + web) | agente M | `apps/api/src/material/*`, `apps/web/src/areas/coordenacao/Material*` |
| P — Assistente (API) | agente P | `apps/api/src/assistente/*`, `apps/api/src/artefato/*`, `apps/api/src/entrega/*` |
| W — web do professor | agente W | `apps/web/src/areas/professor/*` (Home, Ferramentas, Seu time, artefato, Turmas com desempenho) |
| A — atividade e correção | agente A | `apps/api/src/atividade/*`, `apps/web/src/areas/aluno/*` (atividades) |
| T — Tutor e sinais | agente T | `apps/api/src/tutor/*`, web do aluno (Tutor) |
| G — governança e Analista | agente G | `apps/api/src/governanca/*`, `apps/web/src/areas/coordenacao/Governanca*` |
| C — peças da web | agente C | `apps/web/src/componentes/*` e `componentes/ia/*` (as peças da seção 9.3), a galeria e o spec dela |
| D — material de demonstração | agente D | `tools/demonstracao/*` (o conteúdo, o script e o PDF da seção 9.5) |

Cada agente mexe só no que é dele. Arquivo compartilhado (`app.module.ts`, `navegacao.ts`, `caminhos.ts`, `index.ts` do
shared) leva só uma linha por módulo, e o conflito se resolve no merge.

### As quatro fases

| Fase | Entrega | Pacotes | Revisão no fim da fase |
|---|---|---|---|
| 1 | Contratos, dados e camada de IA: a migration 0022, os schemas de `packages/shared`, as células da `MATRIZ`, a porta `LLMProvider` com o adaptador falso e o OpenAI-compatível, o `ExecutorDeAgente` e o registro de consumo; as peças da web e o PDF de demonstração, que não dependem do contrato | S, L, C, D | `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, mais `frontend-reviewer` nas peças |
| 2 | **A2**: material com licença, Assistente de ensino (conversa, ferramentas, artefato, adaptação pendente, PDF), Home, Ferramentas e Seu time, e o PDF de demonstração | M, P, W | os três, mais `frontend-reviewer` |
| 3 | **A3 e A4**: atividade aplicada, respostas do aluno, correção de objetiva com o registro da validação, diagnóstico por habilidade em Turmas; Tutor e sinais | A, T | os três, mais `test-engineer` (correção e Tutor) e `frontend-reviewer` |
| 4 | **A5**: governança, suspensão por função, consumo e o resumo do Analista | G | os três, mais `frontend-reviewer` |

No fim de cada fase: merge pelo portão local, `gh workflow run esteira --ref mvp/apresentacao` em segundo plano, e a
fase seguinte começa sem esperar por ela. O fechamento (seção 8) só acontece com a esteira verde.

### Decisões de processo desta fatia

- **O `frontend-reviewer` roda numa passada por fase, nas telas.** A D77 cita só os revisores com veto
  (`tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, e o `test-engineer` nas fases de nota, correção e
  Tutor). O `frontend-reviewer` não tem veto, e por isso não estava na lista, mas continua entrando em toda fase que
  cria ou altera tela.
- **As regras 00, 50, 60 e 80 continuam valendo.** A D77 lista 10, 20, 30, 40 e 70 como "não muda"; as outras quatro
  também não mudam. A **única exceção declarada** é o item 4 da regra 00 junto com a D49: a execução de IA roda no
  processo da API, atrás do `ExecutorDeAgente`, marcada `TODO(fila)` (seção 4, item 1). Tudo o mais da regra 80
  (limite por usuário e por escola, concorrência resolvida no banco, índice começando pelo escopo, listagem paginada,
  timeout em chamada de modelo) vale como está.

## 4. Decisões de atalho (para o MVP, anotadas para voltar depois)

1. **A execução de IA roda no processo da API, em segundo plano**, atrás de uma interface `ExecutorDeAgente`
   (`packages/nucleo/src/ia`). O `POST` grava a `execucao_agente` como `pendente` e responde na hora; a execução roda
   depois, grava `concluida` ou `falhou`, e a tela consulta `GET /v1/execucoes/:id` a cada segundo. Idempotente por
   chave. Trocar por job do worker depois é mudar a implementação da interface (D49, regra 00 item 4: **dívida
   declarada**, `TODO(fila)`).
2. **Busca de trechos por texto completo do Postgres** (`tsvector` com `portuguese`), sem embedding.
3. **Extração de PDF** com biblioteca de Node, só do texto, por página; o arquivo não vai ao storage (só texto e metadados).
4. **O adaptador falso gera conteúdo determinístico a partir dos trechos** (atividade, plano, adaptação, turno do Tutor,
   resumo do Analista), de modo que a demonstração e os testes não dependem de modelo. O modelo local entra por
   `OpenAICompatAdapter`, só no ensaio final: é o Qwen que o Joaquim carrega no `llama-server` da máquina
   (`http://127.0.0.1:8080/v1`, modo roteador; ninguém carrega nem descarrega modelo por código). A URL e o id do
   modelo vêm de variável de ambiente; o id se descobre no `GET /v1/models`. Ele raciocina por padrão, então nas
   tarefas de saída estruturada o adaptador pede `chat_template_kwargs: { enable_thinking: false }`, descarta
   qualquer bloco de raciocínio antes de validar o JSON, valida com o schema, repete uma vez se falhar e tem timeout.
5. **Correção de objetiva é determinística** (compara com o gabarito). A IA entra no texto do relatório, não na conta.
6. **Sem WebSocket**: polling no `GET /v1/execucoes/:id` e no Seu time.

## 5. Ambiente de teste: um banco só, com trava

O portão é o normal: `node tools/processo/portao-local.ts`, na pasta principal, antes de cada commit de código na
`mvp/apresentacao`. Não existe projeto de teste extra nem variável para trocar o projeto.

O projeto compose de teste é um só (`educa-teste`, portas fixas em `infra/teste.env`), e o `test` do portão começa
derrubando os volumes (`EDUCA_BANCO_NOVO=1`). Com vários worktrees na mesma máquina, dois usos ao mesmo tempo se
atropelam. Por isso **tudo que usa o banco de teste roda atrás da mesma trava de arquivo**:

```
TRAVA=/home/joaquimdp/Documentos/git/Educa.ia/.processo/banco-de-teste.lock

# num worktree de pacote: só os arquivos do pacote
flock -w 540 "$TRAVA" npx vitest run --project integracao <arquivos do pacote>

# na pasta principal, o orquestrador
flock "$TRAVA" node tools/processo/portao-local.ts
```

Num worktree de pacote **não se roda** o portão local, `npm run test` inteiro, `npm run ci:*`, `EDUCA_BANCO_NOVO=1`
nem `docker compose down`. Roda-se `npm run typecheck`, `npm run lint`, os testes de unidade e, atrás da trava, os
arquivos de integração do próprio pacote. Se a trava não vier em nove minutos, é o portão da pasta principal rodando:
espera-se e tenta-se de novo. Migration nova só existe num pacote por vez (o snapshot do drizzle é uma corrente).

O hook de commit olha a pasta principal, não o worktree: commit feito num worktree não é conferido por ele. O que vale
como portão é o do merge (seção "Estado", decisão 4).

### Como cada pacote trabalha e entrega

1. Trabalha e commita **só no próprio worktree** (`../Educa.ia-mvp-<pacote>`, branch `mvp/<pacote>`), começando por
   `npm ci`. A pasta principal é do orquestrador.
2. Lê `docs/mvp-contratos.md` antes de tudo: tabela, schema de API, célula da `MATRIZ`, código de erro e ação de
   auditoria já existem. **Pacote de fase 2 em diante não cria tabela, migration nem schema de `packages/shared`.** Se
   o contrato não atende, para e avisa o orquestrador, em vez de contornar.
3. Mexe só nos arquivos do pacote. Arquivo compartilhado (`app.module.ts`, `rotas.tsx`, `navegacao.ts`, `caminhos.ts`)
   leva o mínimo, uma linha por módulo ou por tela.
4. Tela nova entra por import de rota (um pedaço por tela), monta-se com as peças de `apps/web/src/componentes/` e
   `componentes/ia/`, tem os quatro estados e funciona a 360 px. Estado de servidor é do TanStack Query.
5. Todo módulo novo da API entrega o **teste de isolamento** (escola A não alcança objeto da escola B, e a resposta é
   igual à do inexistente) e os testes das regras do módulo. Se apagar a regra, o teste falha.
6. Verifica com `npm run typecheck`, `npm run lint`, a unidade do que tocou e, atrás da trava, a integração e o e2e
   dos próprios arquivos. Nunca o portão local.
7. Commita por caminho explícito (nunca `git add -A`), com `(mvp: <resumo>)` na mensagem. Se o hook bloquear falando
   de portão local, é o portão do orquestrador na pasta principal: espera cinco minutos e tenta de novo.
8. Antes de entregar: `git merge mvp/apresentacao` no worktree e a verificação de novo. Sem push.
9. Devolve um relato curto: hash, números dos testes, o que os outros pacotes precisam saber, o que ficou de fora.

## 6. Pronto quando

O roteiro da seção 1 roda de ponta a ponta, do `/` à governança, com o adaptador falso **e** com o modelo local; o
teste de isolamento de cada módulo novo passa; o teste que mostra que a `Nota`, o diagnóstico e a versão adaptada não
chegam ao aluno sem aprovação passa; `npm run typecheck`, `npm run lint` e `npm run test` ficam verdes; existe
`docs/roteiro-da-demonstracao.md` com os passos e os dados sintéticos.

---

## 7. Contrato de API (o que o pacote S transforma em schemas `.strict()` de `packages/shared`)

Tudo sob `/v1`, escopo do contexto, uma célula da `MATRIZ` por rota, DTO de saída explícito, id UUID, 404 igual ao
inexistente. `POST` que dispara IA responde `202 { execucaoId }`; a tela consulta `GET /v1/execucoes/:id`.

| Área | Rota | Quem | O que faz |
|---|---|---|---|
| Material | `POST /materiais` (multipart: `arquivo` PDF até 20 MB, `titulo`, `disciplinaId`, `titularidade`, `licenca`, `declaracao`) | coordenação | Sem licença válida ou sem `declaracao=true`: `MATERIAL_SEM_LICENCA`, **antes** de extrair. Com licença: extrai texto por página e grava `trecho`. Licenças: `dominio_publico`, `autoria_da_escola`, `licenca_aberta`, `licenca_comercial_autorizada` |
| | `GET /materiais`, `GET /materiais/:id`, `DELETE /materiais/:id` | coordenação lê e exclui; professor lê os da disciplina dele | |
| | `GET /materiais/busca?q=&disciplinaId=` | professor, coordenação | Trechos com `materialId`, `titulo`, `pagina` |
| Time | `GET /time` | professor, coordenação | Os agentes, as funções (de `FUNCOES`), a autonomia, e se a função está suspensa na escola |
| Assistente | `GET /assistente/conversa` | professor | A thread dele (só ele lê, regra 70 item 8) |
| | `POST /assistente/mensagens` `{ texto, turmaId, disciplinaId }` | professor | Responde `202`. O Assistente devolve texto, ou uma **proposta de ferramenta** (`{ ferramenta, parametros }`): é a pergunta "quer abrir a ferramenta?" (D18) |
| | `GET /execucoes/:id` | quem pediu | `estado` (`pendente\|rodando\|concluida\|falhou`), `resultado` (mensagem ou `artefatoId`), `erro` (código) |
| Ferramentas | `POST /ferramentas/:ferramenta/gerar` `{ turmaId, disciplinaId, tema, quantidade? }` | professor | O mesmo caso de uso do chat (D18). `atividade_objetiva` ou `plano_de_aula` |
| Artefatos | `GET /artefatos?turmaId=`, `GET /artefatos/:id`, `PATCH /artefatos/:id` (só `titulo`), `GET /artefatos/:id/pdf` | professor da turma | `pdf` é binário, `Content-Disposition: attachment` |
| | `POST /artefatos/:id/adaptar` `{ tipos: TipoDeAdaptacao[], tempoExtraPercentual? }` | professor | `202`. Cria o artefato adaptado e uma `entrega` **pendente** |
| Entregas | `GET /entregas?estado=pendente`, `POST /entregas/:id/decidir` `{ decisao: aprovar\|rejeitar, justificativa? }` | professor da turma | Rejeitar exige justificativa. Aprovar grava `decidida_por` e `decidida_em` |
| Atividade | `POST /atividades-aplicadas` `{ artefatoId, turmaId, avaliativa }`, `GET /atividades-aplicadas?turmaId=`, `POST /atividades-aplicadas/:id/encerrar` | professor | Aplicar uma versão adaptada exige a `entrega` aprovada. Encerrar corrige e cria a `entrega` do lote |
| | `GET /minhas-atividades`, `GET /atividades-aplicadas/:id/prova` (sem gabarito), `PUT /atividades-aplicadas/:id/respostas/:questao` `{ alternativa }`, `POST /atividades-aplicadas/:id/enviar`, `GET /atividades-aplicadas/:id/meu-diagnostico` | aluno | O diagnóstico só existe para o aluno depois de a `entrega` do lote ser aprovada |
| Correção | `GET /atividades-aplicadas/:id/correcao` | professor | Lote com média, distribuição, por habilidade, por questão e os **destaques** (em branco, muito fora do histórico, padrão de erro) |
| | `POST /atividades-aplicadas/:id/correcao/destaques/:alunoId/abrir` | professor | Registra o que foi aberto |
| | `POST /entregas/:id/aprovar-lote` | professor | Só libera com todos os destaques abertos. Grava a **validação**: o que foi apresentado, o que foi aberto, quem confirmou, quando (D56). Sem `Nota` (D46) |
| Turmas | `GET /turmas/:id/desempenho` | professor da turma; coordenação em agregado | Acerto por habilidade, só de lotes aprovados |
| Tutor | `POST /tutor/mensagens` `{ atividadeAplicadaId?, materialId?, texto }`, `GET /tutor/conversa?atividadeAplicadaId=`, `GET /tutor/memoria` | aluno | `202`. O Tutor recusa a resposta pronta, é socrático, cita a página, diz que é uma IA, usa a mensagem fixa de assunto delicado (D36) e fica **travado em atividade avaliativa aberta** |
| Sinais | `GET /sinais?turmaId=` | professor da turma | `travou`, `resposta_pronta`, `duvida_repetida`, `atencao_humana` (esta **sem o conteúdo**) |
| Governança | `GET /governanca/resumo`, `GET /governanca/funcoes`, `POST /governanca/funcoes/:chave/suspender`, `POST /governanca/funcoes/:chave/retomar`, `GET /governanca/consumo` | coordenação | A suspensão vale no servidor: função suspensa recusa executar |
| Analista | `GET /analista/resumo`, `POST /analista/gerar`, `GET /analista/nominal?turmaId=` | coordenação | Agregado com grupo mínimo (2 ou mais professores no recorte, D45). O nominal abre com auditoria |

### Tabelas (migration 0022, todas com `escola_id`; as que variam por período, com `ano_letivo_id`)

`material`, `trecho` (`tsvector` em português, GIN, índice começando pela escola), `consumo_ia`, `thread_agente`,
`mensagem_agente`, `execucao_agente` (chave de idempotência), `entrega` (nasce `pendente`; check
`aprovada ⇒ decidida_por`), `artefato` (`conteudo` jsonb validado por `esquemaConteudoDoArtefato`), `atividade_aplicada`,
`tentativa_atividade`, `resposta_atividade` (único por aplicação, aluno e questão), `correcao`, `validacao_do_lote`,
`mensagem_tutor`, `sinal_tutor`, `suspensao_de_funcao`, `resumo_do_analista`. Nenhum campo guarda texto sobre a pessoa
(D66, D57). Campo pessoal novo entra em `docs/lgpd.md`.

## 8. O que falta executar

Já feito: a esteira da `develop` ficou verde no `573f0a1`, a `mvp/apresentacao` nasceu dela e está publicada, e a D77
registra a mudança de processo. O que está em curso e o que vem depois fica na seção "Estado".

1. **O marcador no hook.** `tools/processo/revisoes.ts` aceita `(mvp: <resumo>)` com o portão local carimbado e sem
   documento de tarefa, só em branch `mvp/…`. Commit de código sem marcador continua bloqueado.
2. **AIA, etapa 1** (D71: basta a etapa 1 enquanto o dado for sintético), cinco rascunhos em `docs/aia/`:
   `adaptacao.md`, `correcao-de-objetiva.md`, `diagnostico-por-habilidade.md`, `tutor.md`, `sinais-e-alertas.md`. O
   escopo negativo sai de `docs/agentes.md` (nível 4) e de `docs/regulacao.md`. **O Joaquim revisa; o Gabriel revê
   depois.** Esta é a única porta que só uma pessoa abre, e a implementação não espera por ela.
3. **Fases 1 a 4** como na seção 3, cada pacote no seu worktree (`git worktree add ../Educa.ia-mvp-<pacote> -b
   mvp/<pacote>`), e o orquestrador faz o merge. As telas seguem a seção 9. No fim de cada fase, a esteira é
   disparada à mão (`gh workflow run esteira --ref mvp/apresentacao`) e a fase seguinte não espera por ela. O e2e
   "W4: os estados de Turmas" é intermitente: se for o único vermelho, roda-se de novo o job antes de investigar.
4. **Fechamento:** `docs/roteiro-da-demonstracao.md`, o PDF de demonstração (seção 9.5), o e2e do roteiro inteiro, o
   ensaio com o modelo local, `typecheck`, `lint`, `test` e `test:e2e` verdes, e a esteira da branch verde. **Sem merge
   na `develop`**: quem faz é o Joaquim, depois de avisado.

Prioridade se o prazo apertar (cada uma é demonstrável sozinha): **A2 inteira → A3 → A4 → A5**. Dentro da A5, Governança
e Agentes antes do Analista. O que cortar primeiro: Biblioteca em grade, Memória do aluno, abas além de Visão Geral e
Alunos na turma aberta.

## 9. Análise do mockup: o que reproduzir, e como

### 9.1 O visual já está no `apps/web`

`apps/web/src/estilos.css` já carrega os tokens do mockup (paleta, raios 10/12/16/28, sombras `caixa` e `flutua`, tempos,
foco). Tailwind 4, Vite, React 19 e lucide estão nas mesmas versões. A casca da escola (lateral de 260 px, trilho de 56,
gaveta no celular), o `Botao` em pílula, o `Dialogo`, o `Campo` e os estados vazio, carregando e erro já existem. **O que
falta são as composições das telas e as peças de IA.** Não se copia arquivo de `mockups/` (README do mockup, P21): a tela
do produto é escrita de novo a partir do desenho e dos textos.

Regras que o `apps/web` impõe e o mockup viola de propósito:
- **Sem `oklch()` nem `color-mix()`:** nada de opacidade em cor (`bg-black/80`, `bg-tinta/40`); `estilos.test.ts` e o e2e
  reprovam. Peça shadcn trazida precisa perder o `/NN` e o `dark:`.
- **Sem Inter, Quicksand ou Fustat** (D72): fonte do sistema; o logotipo já vem em curvas de `public/marca/`.
- **`borda-campo` é `#8F8F8F` no produto** (no mockup, `#D9D9D9`): fica a do produto, por contraste.
- **Conversa e estado de servidor no TanStack Query**, nunca em `localStorage` (regra 50); **wouter**, não react-router.
- **Quatro estados em toda tela** (vazio, carregando, erro, preenchido), que o mockup deixou sem em várias.
- **Selo de IA, chip de página e linha "Aprovado por … · quando"** são um conjunto só, igual em todo o produto (11.3).

Dependências: `clsx` e `class-variance-authority` para as variantes de botão e selo. Para select, menu, tabs, tooltip e
popover acessíveis, **Radix** só nas peças que precisam (select e menu da caixa de pedido, tabs da turma, diálogo de
suspensão), e conferir o teto do `size-limit` do chunk de cada área (regra 50). `tw-animate-css` e `react-dropzone` só
se usados. Os avatares dos agentes são **círculo com ícone, nunca rosto** (`AvatarAgente` do mockup), então a pendência
do Gabriel com os SVGs não trava nada.

### 9.2 Telas do roteiro, onde estão desenhadas e o que reproduzir

| Spec | Tela | Desenho em `mockups/src/areas/` | Pontos que o produto precisa respeitar |
|---|---|---|---|
| A2 | Material da coordenação | `coordenacao/Material.tsx` | Dropzone; licença obrigatória; sem licença o botão vira "Envio recusado"; estados `pronto`, `processando`, `falhou` (tentar de novo), `recusado` (borda tracejada) |
| A2 | Home | `professor/Home.tsx` | Saudação pela hora e primeiro nome; caixa de pedido; "Esperando você" só com pendência; sem atalhos em pílula |
| A2 | Conversa | `professor/Conversa.tsx` | Etapas `pensando`, `pergunta` (D18, duas opções do mesmo peso), `cartão`, `gerando`, `resposta` com chip de página e Fontes; `AvisoFila` |
| A2 | Ferramentas | `professor/Ferramentas.tsx`, `Catalogo.tsx` | Mostrar **só as ferramentas que existem** (atividade objetiva, plano de aula, Adaptação), nas categorias da D74; as 14 outras do mockup não aparecem |
| A2 | Formulário da ferramenta | `professor/FerramentaForm.tsx` | `MotorFormulario`: a ferramenta é dado, um motor só (P23); estados formulário, gerando, pronto; Adaptação sem campo de texto livre |
| A2 | Artefato | `professor/Artefato.tsx` | Página de origem, exportar PDF, "Atribuída à turma", versão adaptada `pendente` e `aprovada` |
| A2, A4 | Seu time | `professor/Time.tsx` | Conversa em balão, faixa "Esperando você" presa, filtro por função, Aprovar, Rejeitar com motivo; sinais do Tutor sem conversa de aluno |
| A3 | Atividades e atividade do aluno | `aluno/Atividades.tsx`, `Atividade.tsx` | Uma questão por vez, "Resposta salva", resultado só depois da aprovação, "Avaliação: o Tutor fica pausado" |
| A3 | Aprovar | `professor/Aprovar.tsx` | Destaques um a um; botão `oficial` preso embaixo e inativo até abrir todos, com o contador dizendo por quê; registro da validação; **diagnóstico, não nota** (D46) |
| A3 | Turmas e turma aberta | `professor/Turmas.tsx`, `Turma.tsx`, `abas-turma/VisaoGeral.tsx`, `Alunos.tsx` | Acerto por habilidade só de lote aprovado; turma sem correção mostra estado vazio tracejado; só Visão Geral e Alunos |
| A4 | Tutor do aluno | `aluno/Tutor.tsx` | Faixa de supervisão que não fecha; caixa só de texto; "Hoje: N de 60"; quatro estados (`ligado`, `avaliacao`, `fora`, `limite`); mensagem fixa de assunto delicado com 188 e "Avisar um adulto" |
| A4 | O que o Tutor sabe de mim | `aluno/Memoria.tsx` | O aluno vê e contesta (D66). Apoio: corta primeiro se apertar |
| A5 | Governança | `coordenacao/Governanca.tsx` | Quatro números; tabela "o que a IA gerou e quem aprovou"; **nenhuma coluna, filtro ou ordenação por professor**; nominal só por botão `oficial` com aviso de auditoria |
| A5 | Agentes | `coordenacao/Agentes.tsx` | Três cartões; funções com autonomia em português comum; selo de alto risco; suspender só aquela função (AlertDialog) |
| A5 | Analista | `coordenacao/Analista.tsx` | Alerta é hipótese com contexto; agregado com grupo mínimo; pedido de dado nominal registra auditoria |

**Fora do roteiro (não fazer):** Calendário, Sala, Prova online, Projetos, Ranking, Mural, Recursos, Frequência, Desempenho do
aluno, Avisar, Privacidade, Adaptações da coordenação, Conformidade, Denúncias, Auditoria, Exportar, Configurações, Rede,
Família, as 14 ferramentas que não existem, PPTX e XLSX.

### 9.3 Peças que o produto escreve de novo (nomes do mockup, para se achar o desenho)

`CaixaPedido`, `MensagemIA` e `MensagemPessoa`, `Escolha` (a pergunta da D18), `ChipFonte`, `Fontes`, `AvisoFila`,
`AssinaturaIA` e `SeloIA`, `Estado` (selo pendente, ok, erro), `LinhaAprovacao`, `MotorFormulario`, `PaginaMini`,
`NumeroPainel`, `BarraRotulada`, `Cartao` e `Tela` com o padrão de espaço (16 px no celular, 24 a partir de 768; larguras
1480, 1040 e 760). Em `apps/web` entram em `componentes/` e `componentes/ia/`, com teste de regra e os quatro estados.

### 9.4 Textos e estados que o mockup já escreveu (orientam o tom, não se copiam)

`mockups/src/dados/agentes.ts` (funções e autonomia em português comum), `mensagens-time.ts` (tom curto, primeira pessoa do
agente, nunca conclui sobre pessoa; sinais `travou`, `repetiu`, `pronta`, `atenção`), `ferramentas.ts` (campos de cada
cartão e os seis tipos de adaptação) e os vazios ("Nenhuma devolutiva ainda. Ela chega depois que o professor aprova.").

### 9.5 Material de demonstração, sem esperar o Gabriel

A D75 pede um documento nosso ou de domínio público com licença declarada. Gerar um PDF **original**, de umas 6 páginas,
"Química 2, cap. 7 — Estequiometria" (casa com os dados do mockup), com titularidade "autoria da escola" e a licença
declarada na tela. Um script em `tools/demonstracao/` o produz; nenhum material de terceiro entra.

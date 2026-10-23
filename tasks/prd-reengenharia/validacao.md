# Validação — reengenharia (X5)

## Rodada 1 — 23/10/2026

**Escopo:** funcionalidade completa, pelo recorte de 22/10/2026 (`prd.md` §11, D81, R43 a R63)
**Commit validado:** `65f7e3c` (último com código: `2b68e74`)
**Veredito: REPROVADA**

Um teste vermelho reprova: `tools/guardas/catraca.test.ts` falha porque `npm run lint` está vermelho no HEAD. A
supressão de complexidade de `tools/ci/compose.ts` em `eslint-suppressions.json` ficou sem uso. Isso aconteceu quando a
90.0 (linha 2, `a3505d9`) simplificou o arquivo, que a 13.0 (linha 1, `6f10b86`) tinha suprimido. As duas se juntaram no
merge `2b68e74`. Fora isso, todo RF da coluna "Na X5" tem código e teste efetivo.

Antes de rodar qualquer teste, o `node_modules` era anterior ao `package-lock.json` (faltava o `cockatiel`), e precisei
rodar `npm ci`. A árvore terminou limpa, como começou.

### 1. RF a RF

Valido pela coluna "Na X5" do `prd.md` §11. O que foi para a X6 não é falta da X5.

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:179-253` (`GATILHOS_DE_RISCO_A_VIDA`); o `risco_a_vida` do modelo trocado por `assunto_delicado` com a mensagem de risco (94.0) | `turno-do-tutor.test.ts` › "risco à vida: um padrão por jeito de dizer…" (`:915`) e "o modelo diz %s: nenhuma saída da tarefa leva `risco_a_vida`" (`:497`); `ouro.test.ts` e `selo-do-ouro.test.ts` | O `ouro` está em 75/75, com precisão 1. O lote retido 2 dá 51/75 com a regra ou o modelo, abaixo do alvo. A lacuna está declarada pela R59 em `onda-0.md` §2.2a, `docs/aia/tutor.md:227-241`, `RETIDOS.json` e `TODO.md`, e a onda 0 fecha assim pela R51. Vale o Joaquim olhar antes do piloto |
| RF2 | ATENDIDO | `propor-ferramenta.ts:534` (`julgaTextoDeAluno`) e `:656`, na conferência da saída | `numeros.test.ts` › "propor_ferramenta na tarefa 3.0…" (`:327`) e "a conferência e a reserva" (`:601`), 84 verdes; no `ouro`, `saidaQualitativa` dá 54/58, com 0 de 41 legítimas barradas | O lote retido 1 fica abaixo do alvo (saída 22/58, entrada 33/57), declarado pela R60 em `onda-0.md` §2.3 e no `TODO.md` |
| RF3 | ATENDIDO | `apps/api/src/tutor/tutor.service.ts:175`, `:210` e `:230` (`avaliativaAberta` na entrada e na conclusão; o `assunto_delicado` passa) | `tutor.int.test.ts` › "a avaliação abre depois do 202 (S12…)": 4 verdes, com o `GatilhoDeParada` | |
| RF4 | ATENDIDO | `.claude/settings.json`, comando `portao` com `exit 2` | `tools/processo/hook-portao.test.ts`: verde | |
| RF5 | ATENDIDO | `packages/nucleo/src/entrada/zod-validation.pipe.ts` e `id.pipe.ts`; `eslint.config.mjs:87` (`files` em todo `*.controller.ts`) e `:97` (o `@Req()` só em `sessao/` e `operacao/`) | `entrada.test.ts` (6); `guardas.test.ts` › "a entrada do controller passa pelo pipe…" (22, com fixture vermelha); `borda-de-entrada*.int.test.ts` (3 arquivos, 200 verdes) | O ESLint do repositório inteiro passa a regra, sem `@Body()` nem `@Query()` cru |
| RF6, RF7 | X6 | — | — | 20.0 a 23.0 |
| RF8 | ATENDIDO | `packages/shared/src/sistema/definicoes-de-job.ts`; o executor recusa com `DADOS_INVALIDOS` | `definicoes-de-job.test.ts` (shared e guardas), `executor.test.ts`, `montagem.test.ts`: 96 verdes; `apps/worker/test/execucao.int.test.ts`: 32 verdes; `npm run typecheck` sem erro | |
| RF9 | ATENDIDO | `tools/guardas/escopo-dos-repositories.ts` (10 exceções, cada uma com motivo); `tools/guardas/regras-tenant.mjs` (tabela só no repository); as três portas da IA com `exigirEscolaDoContexto()` | `repositories-com-escopo.test.ts`: verde; `guardas.test.ts -t tabela`: 19 verdes; `convite.repository.int.test.ts`: 12 verdes | Prova de mutação abaixo |
| RF10 | ATENDIDO | `tools/guardas/camadas.cjs` (`sem-ciclo` e as regras de direção e de camada) | `camadas.test.ts`: verde; `npm run guarda:camadas`: "no dependency violations found (1710 modules)" | |
| RF11 | ATENDIDO | `eslint.config.mjs` (`complexity` 10, `max-lines-per-function` 80, `max-depth` 4) e `eslint-suppressions.json` | `catraca.test.ts`: 17 de 18 verdes | A catraca funciona: foi ela que acusou a supressão órfã. O vermelho entra no RF32 e no crítico 1 |
| RF12 | ATENDIDO | os padrões da onda 0 em `turno-do-tutor.ts` e `propor-ferramenta.ts`; `docs/aia/ouro/` selado | `ouro.test.ts` e `selo-do-ouro.test.ts`: verdes | `conformidade/`, a mutação por padrão e a trava do `ouro` foram para a X6 (26.0 a 29.0) |
| RF13 | ATENDIDO | `knip.json`; `tools/guardas/regras-erro.mjs` | `knip --include dependencies,unlisted,binaries,unresolved`: limpo; `node tools/guardas/lint.ts`: sem violação; nenhum `throw new Error(` de produção em `apps/*/src` e `packages/nucleo/src` | |
| RF14 | ATENDIDO | `sessao/` por fluxo, `credencial/`, `ops/`, `componentes/ui/`, `areas/professor/` e `areas/coordenacao/` por assunto, a API por recurso (33.0 a 36.0, 96.0, 97.0) | `tools/guardas/tamanho-das-pastas.test.ts`: verde; `npm run typecheck`: 0 erros; os 691 caminhos citados no guia, na arquitetura, no README, no runbook, na LGPD e nas AIAs existem (os dois que não existem estão num item fechado do `TODO.md`) | O ajuste do `frontend-reviewer` na 97.0 (`docs/aia/adaptacao.md:239`) está feito: os dois caminhos existem |
| RF15, RF16 | X6 | — | — | 37.0 a 42.0, 45.0, 47.0 |
| RF17 | ATENDIDO | executor com prazo pelo tipo; `EXECUCAO_INTERROMPIDA` só na última tentativa (R55) | `executor.test.ts:254` ("aos 5 000 ms a tentativa falha com TEMPO_ESGOTADO…"); `execucao.int.test.ts:603` e `:627` (SIGTERM com e sem tentativa sobrando) | |
| RF18 | ATENDIDO (parte da X5) | `retencao/expurgo-de-jobs.repository.ts`; `infra/grafana/alertas/job-falhou-de-vez.yaml`; `docs/runbook.md:79`; `docs/lgpd.md:101` | `apps/worker/test/expurgo.int.test.ts` (8), `infra/test/alertas.test.ts`, `alerta-tem-runbook.test.ts` e `prazo-declarado-de-jobs.test.ts` (24) | Reprocessar e descartar por comando foram para a X6 (46.0) |
| RF19 | ATENDIDO (parte da X5) | `packages/nucleo/src/ia/adaptador-resiliente.ts` (`cockatiel`) | `adaptador-resiliente.test.ts`: prazo (`:126`), repetição só no 429 e na conexão recusada (`:197`) e disjuntor por perfil e por modelo (`:287`) | Tokens por minuto e a degradação 80.4 foram para a X6 (49.0) |
| RF20, RF22 | X6 | — | — | 50.0, 54.0 |
| RF21 | ATENDIDO (parte da X5) | `minha-atividade.repository.ts:224-237` (`setWhere excluded.sequencia > sequencia`); `apps/web/src/areas/aluno/fila-de-respostas.ts`, `respostas.ts` e o espelho no `sessionStorage` | `atividade.int.test.ts` (5 casos de sequência); `espelho-da-fila.test.ts:175` (F5 com duas pendentes), `:235` e `:263` (sessão vencida, mesmo aluno ou outro); `apps/web/src/areas/aluno/` (118 verdes); `e2e/aluno-atividade.spec.ts`: 10 de 10, no chromebook e no celular | Fotos lidas: `.processo/vitrine/aluno--aluno-atividades-01a166cc-…--Alternativa-B--{computador,celular}.png` (a questão aberta, com "Resposta salva"), `aluno--aluno-atividades--{computador,celular}.png`, `vazia--aluno--aluno-atividades--computador.png` e a atividade com resultado. O aviso "Sua resposta foi alterada em outra janela" precisa de duas janelas e não sai na vitrine; quem o prova é `Atividade.test.tsx`. "Envio pendurado não trava os outros" foi para a X6 (52.0) |
| RF23 a RF28 | X6 | — | — | ondas 4 e 5 |
| RF29 | ATENDIDO (parte da X5) | `infra/docker/servico.Dockerfile` (um `target` por serviço); `infra/compose.yml:122-503` | `tools/ci/dockerfile.test.ts`: 9 verdes; `medidas-da-onda-5.md` (80 s → 78 s, imagens do mesmo tamanho) | |
| RF30 | sai (D81) | — | — | No lugar dele, a 95.0 |
| RF31 | ATENDIDO no guia; o apagar fica para o fechamento | `docs/guia-do-desenvolvedor.md`, com "Se você vem do Spring Boot" (§2), "Onde fica cada coisa" (§4), as receitas (§5) e "As travas" (§7); `docs/arquitetura.md:64` e `:123`; `README.md:8` | os caminhos do guia conferidos contra a árvore (RF14) | `.reengenharia/` ainda existe. Pela `techspec.md` §5, ele sai depois do Validador. São 54 citações em `tasks/prd-reengenharia/`, 3 no `ROADMAP.md` e 3 em `docs/` |
| RF32 | **NÃO ATENDIDO** neste commit | — | `catraca.test.ts` › "npm run lint está verde com a linha de base…": vermelho (`catraca.test.ts:205`) | `npm run lint` sai com "There are suppressions left that do not occur anymore". Os e2e obrigatórios e as invariantes das regras 10 e 70 que rodei estão verdes, e nenhum teste foi apagado nem desligado no diff `develop..65f7e3c` |
| RF33 | fica para o fechamento | — | — | O relatório final contra `LINHA-DE-BASE.md` §5 ainda não existe. Pela `techspec.md` §5 e pela Etapa 12 da missão, ele vem depois do Validador |

Provas de mutação (cada arquivo voltou com `git checkout --`, e a árvore terminou limpa):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF1 | `turno-do-tutor.ts:253`, o padrão "me jogar no rio, represa, trilho" | `turno-do-tutor.test.ts` › "cada jeito de dizer recebe a mensagem fixa de risco, sem modelo: me jogar no rio" (2 vermelhos) |
| RF9 | `convite.repository.ts:157`, o `eq(convite.escolaId, exigirEscolaDoContexto())` do `revogarParaRefazer` | `convite.repository.int.test.ts` › "revogarParaRefazer (A0b, 3.0): … no contexto de B, o de A fica como está" |
| RF21 | `minha-atividade.repository.ts:234`, o `setWhere: excluded.sequencia > sequencia` | `atividade.int.test.ts`: 5 vermelhos, entre eles "a 5 que chega depois da 7 responde 200 com a 7 gravada…" |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: mudança funcional só com defeito ou RF; dependência nova só as da N9 | cumprida | `dependency-cruiser`, `cockatiel` e `knip`, registrados na R33 e na R40 (`techspec.md` §11) |
| Regra: a trava de tenant soma ao escopo no repository | cumprida | a mutação do RF9 fica vermelha no teste do repository, e não só na guarda |
| Regra: a conferência de conformidade é determinística | cumprida, com a soma da 94.0 | o padrão decide sozinho. O `risco_a_vida` do modelo só soma, e o RF1 "regra e modelo somados" foi decidido pelo Joaquim (`onda-0.md` §2.2a) |
| Regra: teste removido diz o que continua protegendo | cumprida | nenhum teste apagado no diff `develop..65f7e3c`. O que saiu do `arquitetura.test.ts` na 12.0 está registrado no `12_task.md` |
| Borda: o professor abre a prova com a dúvida na fila | coberta | `tutor.int.test.ts` › "abre entre o 202 e a execução…" |
| Borda: a rede cai na prova e o aluno aperta F5 | coberta | `espelho-da-fila.test.ts:175`; `aluno-atividade.spec.ts:219` |
| Borda: o worker morre com o turno do Tutor rodando | coberta pela R55 | `execucao.int.test.ts:627` (a última tentativa termina `EXECUCAO_INTERROMPIDA`). A IA no worker é da X6 (47.0) |
| Borda: a eliminação de um menor falha cinco vezes | coberta | `docs/lgpd.md:101` (o `titular.*` fica até a ação do operador); `expurgo.int.test.ts` |
| Borda: "tô triste" | coberta | `turno-do-tutor.test.ts`, com as `dev` de borda da 2.0; `ouro` `tristeza_sem_risco` 10/10 |
| Pronto: tipagem, lint, guardas, unidade, integração, e2e e infra verdes | **faltando** | `npm run lint` vermelho (crítico 1); `typecheck` verde; a esteira é conferida no fechamento |
| Pronto: onda 0 fechada, com o `ouro` no alvo | cumprido, com a lacuna declarada | R59, R60 |
| Pronto: regra 10 travada (6.0 a 9.0) | cumprido | RF9 |
| Pronto: prova (51.0, 53.0) | cumprido | RF21 |
| Pronto: entrada pelo `ZodValidationPipe` e jobs tipados | cumprido | RF5, RF8 |
| Pronto: 43.0, 44.0 e 48.0, com o teste que simula a falha | cumprido | RF17 a RF19 |
| Pronto: pastas numa convenção só, travada por teste, com `git mv` | cumprido | RF14 |
| Pronto: camadas, catraca, dependências, erro tipado e Dockerfile travados | cumprido no mecanismo; a catraca está vermelha | RF10, RF11, RF13, RF29 |
| Pronto: guia, `arquitetura.md`, `README.md` | cumprido | RF31 |
| Pronto: e2e da regra 40 e invariantes das regras 10 e 70 | cumprido no que rodei | `aluno-atividade.spec.ts` 10/10; as integrações acima |
| Pronto: `.reengenharia/` apagado, com o que importa migrado | faltando, e fica para o fechamento | 60 citações a migrar ou reescrever |
| Pronto: relatório final | faltando, e fica para o fechamento | RF33 |
| Pronto: esteira verde no último commit com código | é conferida pelo Orquestrador no fechamento | as execuções de `2b68e74` a `65f7e3c` estavam na fila às 00h20 |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ (0 erros) |
| `npm run lint` | ❌ (`eslint .`: supressão sem uso em `tools/ci/compose.ts`); `eslint --pass-on-unpruned-suppressions`, `tools/guardas/lint.ts` e `guarda:camadas` verdes |
| `npm run test` | não rodou inteiro. Rodaram só os testes de evidência, todos verdes menos `catraca.test.ts` |
| `npm run test:e2e` | só `e2e/aluno-atividade.spec.ts`: 10 de 10 |
| `npm run test:infra` | não rodou (`infra/test/alertas.test.ts` é unidade e está verde) |
| Esteira do GitHub | conferida no fechamento (D78): não entra no veredito |
| Revisões com veto registradas e aprovadas | ✅ nas 35 tarefas com hook. A 95.0 tem as 4 rodadas do `revisor-geral` fora do andar (maior 1) |

### 4. Achados

**Críticos**
- `eslint-suppressions.json:1066-1070`: a supressão `tools/ci/compose.ts` › `complexity` não tem mais uso. A 90.0
  (`a3505d9`, linha 2) tirou 28 linhas de `compose.ts`, e a 13.0 (`6f10b86`, linha 1) já tinha gravado a supressão. O
  merge `2b68e74` juntou as duas, e o `npm run lint` e o `tools/guardas/catraca.test.ts:205` ficaram vermelhos no HEAD.
  **Correção:** fazer uma `/corrigir` que roda `npx eslint . --prune-suppressions`. O diff deve tirar só essas cinco
  linhas; qualquer outra mudança no arquivo é sinal de outro problema. Depois, rodar `catraca.test.ts` e `npm run lint`.

**Maiores**
- `tasks/prd-reengenharia/95_task.md`: a seção "Revisões" não existe. As quatro rodadas do `revisor-geral` (a 4ª
  APROVADO) estão só em `/home/joaquimdp/Documentos/git/Educa.ia/.processo/reengenharia/guia/REVISAO.md`, no térreo e
  fora do git. O fecho `c88231a` mudou o guia e a arquitetura depois da aprovação, sem rodada nova. Conferi os caminhos e
  as seções desse texto (RF14, RF31) e não achei erro, mas o registro do processo não está no repositório. **Correção:**
  no fechamento, copiar o `REVISAO.md` para `tasks/prd-reengenharia/achados/95_task.md` e rodar o `revisor-geral` sobre
  o diff de `c88231a`.

**Menores**
- `tasks.md`: há subtarefas sem marca embaixo de tarefas marcadas (4.1 a 4.3, 13.1 a 13.4, 14.1 a 14.5, 16.1 a 16.4,
  34.1, 36.1, 43.1, 44.1, 48.1, 90.1, 93.1 a 93.3, 96.1 a 96.3, 97.1 a 97.3). É só texto.
- `techspec.md:2` diz "Status: rascunho" numa spec aprovada na 5ª rodada. O §2 cita `kit/`, que a nota do topo já revê
  para `componentes/ui/`.
- `tools/processo/` mudou no meio da corrida (`1744468`, R61), e o PRD §3 o deixa de fora até a Etapa 9. Está registrado
  na R61. Só anoto para a retro.
- O encontro das linhas não pegou a supressão órfã, que nasceu de duas tarefas verdes cada uma no seu portão. Para a X6
  (Etapa 9): o encontro rodar o `eslint .` depois do merge.
- `apps/web/src/areas/aluno/Atividade.tsx`: a tela da atividade rola a página inteira a 1366 × 768 (845 px aberta,
  1218 px com resultado), e a lateral termina em 768 px. Isso já existia antes da X5: o diff só troca import e liga a
  fila. O `e2e/aluno-atividade.spec.ts` não usa `paginaNaoRola`. Fica para a X4, que refaz as telas do aluno.
- Na vitrine cheia, a "Cinemática: lista sintética" (Física) mostra habilidades de Estequiometria e diz "acertou 1 de 4"
  com "respondeu 0 de 4". Parece dado montado pela vitrine e não o produto; fica a conferir no `TODO.md`, junto da falta
  de atividade "para responder" que a 53.0 já anotou.
- `.reengenharia/` é citado 54 vezes em `tasks/prd-reengenharia/`, 3 no `ROADMAP.md` (a X6 aponta para `DIAGNOSTICO.md`
  §5) e 3 em `docs/`. O apagar precisa migrar `DIAGNOSTICO.md`, `RISCOS.md` e `DECISOES.md`, ou reescrever as citações.

**Positivos**
- Cada cláusula nova tem a sua mutação declarada no documento da tarefa. As três mutações que fiz por fora ficaram
  vermelhas no teste certo.
- A lacuna medida da onda 0 está escrita em quatro lugares (`onda-0.md`, AIA, `RETIDOS.json`, `TODO.md`), com o número.
- O guia cita 691 caminhos, e todos existem.

### 5. Conclusão

REPROVADA por um teste vermelho: o `npm run lint` e a `catraca.test.ts` falham no HEAD por causa de uma supressão órfã
que o encontro das linhas deixou passar. O resto da X5, pelo recorte, tem código e teste efetivo RF a RF. Mexer no
isolamento, no risco à vida e na sequência da prova deixa vermelhos os testes certos.

O caminho até a aprovação:
1. Uma `/corrigir` que poda a supressão, com a catraca e o lint verdes.
2. O maior 1 resolvido, ou registrado como decisão do Arquiteto.
3. De preferência, o relatório final (RF33) e o apagar de `.reengenharia/` (RF31) feitos antes da revalidação. Assim o
   Validador também confere esses dois, e eles não fecham sem leitura independente.

A revalidação confere o crítico e os itens do fechamento, e não refaz o resto.

### 6. Pendências herdadas

- As lacunas do lote retido do `riscoAVida` (51/75) e da D55 (22/58, 33/57) vão para a X6, `conformidade/` 26.0 a 29.0
  (R59, R60). O Joaquim olha a AIA do Tutor antes do piloto (`estado.md`).
- A rolagem da página na atividade do aluno vai para a X4.
- O dado incoerente da vitrine vai para o `TODO.md`.
- O encontro das linhas rodar o lint vai para a X6 (Etapa 9).
- O registro da revisão da 95.0 entra no fechamento da X5.

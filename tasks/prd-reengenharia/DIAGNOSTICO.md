# Diagnóstico por lentes — Etapa 5

Consolidado pelo Arquiteto em 21/10/2026, a partir de 13 diagnósticos por unidade (subagentes Sonnet, roteiro comum em
`diagnostico/00-roteiro.md`, relatórios brutos em `diagnostico/U01.md` a `U12.md`, com U08 partida em `U08a`
coordenação e operação e `U08b` professor e aluno). Medição de partida: `LINHA-DE-BASE.md` §5 (commit `08dc125`).

Marcas: **[código]** conferido · **[medida]** da linha de base · **[doc]** · **[hipótese]**. Cada achado citado leva o id
da unidade (`U03-4`); o texto completo, com evidência `arquivo:linha`, proposta, custo, risco e trava, está no relatório
da unidade. Este arquivo decide o que cruza unidades (RESPOSTAS, "Como a missão roda aqui") e separa o que é do Joaquim.

## 1. Resumo

**202 achados**, cerca de 40 de impacto alto. Por lente: manutenção 47, resiliência 35, contratos 34, estrutura 31,
legibilidade 29, escala 25. Por onda proposta: 1 (contratos e travas) 39 · 2 (fronteiras) 23 · 3 (execução e
resiliência) 38 · 4 (web) 27 · 5 (testes e infra) 34 · 6 (harness e docs) 26 · fora da X5 7 · sem classificação 8.
Pedem decisão: 24 citam uma das P1–P10 e 27 trazem pergunta nova, que a §5 reduz a **11**.

O retrato pelas lentes:

- **5.1 Legibilidade.** O código de produção é bem nomeado e comentado, às vezes demais (comentário que conta a história
  da spec: U07-17, U08a-16). A dívida é de **tamanho**: telas de 100 a 300 linhas com leitura, estado e diálogos num
  corpo só (U08a-1, U08a-2, U08b-5, U07-13), e `revisoes.ts` com 1.214 linhas (U11-12). O mesmo trecho de "leitura e
  erro" aparece 63 vezes, com quatro variantes divergentes (U07-3).
- **5.2 Contratos.** A saída da API é forte (zod `.strict()` validado nos dois lados). Fracos: a **entrada**, validada à
  mão em cada handler (U01-1, U04-1); as **rotas**, que não são contrato (U01-2); o **job**, com payload
  `Record<string, unknown>` (U01-5, U02-3, U06-2); e o **harness**, com rótulos de markdown lidos por regex (U11-4).
  As regras de domínio que só existem no cliente são três: o prazo do titular, "turma sem professor" e "escola montada"
  (U08a-5, U08b-7).
- **5.3 Escala.** O tenant é bem modelado (FKs compostas, escopo do token), mas a garantia é **por disciplina**: 25 de 71
  repositories não chamam `exigirEscolaDoContexto` [código, conferido], quase todos com motivo, e nada distingue o
  motivo do esquecimento (U02-1, U10-4). Três repositories da IA recebem `escolaId` por argumento (U02-2). Os gargalos
  reais são a IA e o PDF no processo da API (U03-1, U05-1), o sino em N+1 (U08b-4, U08a-6) e as rotinas que percorrem
  as escolas em série (U06-7, U06-12).
- **5.4 Resiliência.** É a lente com mais achados de impacto alto. O worker é sólido em idempotência, mas falta tudo o que
  acontece depois da falha. Job preso não tem prazo (U06-3). A falha final some em 7 dias sem alerta (U02-4, U06-1). A
  IA não degrada (U03-3). O cliente não tem timeout (U07-5) e uma prova pode perder a escolha no F5 (U08b-1). O hook do
  processo **falha aberto** (U11-2).
- **5.5 Manutenção.** 87 % da duplicação é de teste [medida]. No e2e são cinco jeitos de criar escola (U09-4), helpers
  copiados em 39 arquivos (U09-3) e semente por SQL cru fora do schema (U09-1). Fora do teste, há mais do mesmo: 4
  Dockerfiles iguais (U10-5), runners de `ops/` clonados (U05-7), listas TS × SQL sem paridade em metade dos `check`
  (U01-4) e documentos escritos à mão que já divergiram do código (U12-5, U12-6).
- **5.6 Estrutura.** A direção `shared ← nucleo ← apps` está certa e tem 0 violação [medida]. Mas nada a trava (U04-8,
  U10-3). `sessao/` virou biblioteca de toda a API (U04-2), `nucleo` mistura quatro assuntos atrás de 522 nomes
  (U02-8), `shared` mistura contrato, catálogo e texto de tela (U01-7), e os helpers de teste moram numa app e servem a
  outras (U09-8).

## 2. O que a Etapa 5 corrigiu nas Etapas 2 a 4

| Antes | Agora | Fonte |
|---|---|---|
| `TAREFAS_DE_IA` × nucleo "sem teste que compare as duas listas" [hipótese, CONTRATOS §1] | **Tem** teste de igualdade com o nucleo e com o SQL | U01 |
| Um repository recebe `escolaId` por argumento | Três: `ia/suspensao`, `ia/orcamento`, `ia/consumo` [código, conferido: `suspensao.repository.ts:16`] | U02-2 |
| S12 (janela da trava de avaliação no Tutor) [hipótese] | **Confirmado.** A avaliação aberta é conferida só no `POST` (`tutor.service.ts:171`), e a execução não confere de novo [código, conferido] | U03-7 |
| S10 (D62 sem leitor) | **Confirmado**: `levaTextoDeAluno` não tem leitor em produção, e um adaptador único serve a todas as tarefas | U03-5 |
| Meta R19 (ramos ≥ 85 % na web) | Faltam **827 ramos** (4.853 de 6.682) [medida, conferida]. Com a base a 100 %, a web chega a 83,9 %. As telas do aluno estão em 47,8 % e a operação em 38,7 % | U07-2, U08a-3, U08b-5 |
| Hook do processo "barra ou libera" | **Falha aberto** na carga. Um import quebrado em `hook-revisoes.ts` sai com código 1, e o Claude Code só bloqueia com 2 [código: `hook-revisoes.ts:4-6`, `settings.json:26-32`; doc: hooks do Claude Code] | U11-2 |
| Docs lidos por teste: só `runbook.md` registrado | Também `interface.md` (`estilos.test.ts`, `contraste.test.ts`, `e2e/tokens.spec.ts`) e `modelo-de-dados.md` (`arquitetura.test.ts`) | U12-2 |
| `docs/arquitetura.md` "descreve 6 módulos e 6 filas" | 20 módulos descritos × 14 montados; as filas reais são `interativa`, `normal` e `lote` | U12-1 |
| Lacunas de teste da U09 (Tutor "de três formas", modos de avaliação, importação de grade) | O Tutor está coberto em 11 tentativas. Os modos de avaliação e a importação de grade **não existem** no código, então não há o que testar | U09-12 |
| Galeria da web como suspeito de código morto | Usada por 15 specs de e2e | U07 |
| `painel.test.ts` lê o compose como texto | Lê com `yaml`. A regex frágil é `imagensDosServicos` (`tools/ci/compose.ts:259`) | U10 |
| S19 em `alerta-tem-runbook.ts:21` | Linha 16; e são 13 regras de alerta com o caminho antigo | U10-18, U12-10 |
| `domain-researcher` sem uso | Usado por `criar-prd`, `criar-techspec` e `descobrir`. O que não funciona é marcá-lo como obrigatório na tarefa: o hook o ignora | U11-10 |

## 3. Os temas que cruzam unidades (decisões do Arquiteto, com o mecanismo)

Cada tema junta achados de várias unidades num mecanismo só. A onda é a de `LINHA-DE-BASE.md` §6 (aprovada, R17).
Quando o tema depende de uma P ou de uma pergunta nova, a execução espera a resposta da Etapa 6.

| # | Tema | Achados | Mecanismo escolhido | Rejeitado | Trava | Onda | Espera |
|---|---|---|---|---|---|---|---|
| T1 | Borda de entrada HTTP | U01-1, U04-1, U04-12 | Pipe **por parâmetro** com esquema zod (`@Corpo`, `@Consulta`, `@IdDoCaminho`) mais uma `ConferenciaDasEntradas` no boot, no molde da `ConferenciaDasPermissoes` | pipe global (esconde o contrato); DTO de classe (dois sistemas de esquema) | o boot falha se um handler com `@Body`/`@Query` não tiver esquema | 1 | P2 |
| T2 | Rotas como contrato | U01-2, U08b-11, U12-5 | **Registro de rotas** em `shared` (método, caminho, esquema de entrada e de saída), lido pela API e pelo cliente. O OpenAPI sai derivado por `z.toJSONSchema`, como documento gerado | `ts-rest`, `nestjs-zod`, `zod-openapi` (troca de idioma do controller) | teste que compara o registro com os decorators montados | 1, depois de T1 | P3 |
| T3 | Compatibilidade da resposta | U01-3, U07-7 | **Leitor tolerante na web** (descarta campo desconhecido ao ler), com a API estrita. Erro de contrato vira código próprio, com tela de "versão nova", sem repetir | versionar por cabeçalho (caro) | teste do cliente com campo extra | 1 | P6 |
| T4 | Registro tipado de jobs | U01-5, U02-3, U05-12, U06-2, U06-4, U03-2 | `DEFINICOES_DE_JOB` em `shared`: `tipo` → fila, esquema, política de retentativa, `prazoMs`, escopo. Validado no enfileirar e no worker, com um esquema só | segunda fila de dead-letter no BullMQ | teste que liga tipo, fila e processador | 1 | — (P1 só acrescenta o tipo de IA) |
| T5 | Falha final visível | U02-4, U06-1, U06-14 | O estado `falhou` do outbox **é** a fila morta. Entram contador e alerta com runbook, e um comando de reprocessar | DLQ separada (duplica a linha) | alerta com runbook (guarda existente) | 3 | N1 (retenção) |
| T6 | Trava genérica de tenant | U02-1, U02-2, U10-4 | Teste que enumera **todo** `*.repository.ts` e exige uma de três coisas: `exigirEscolaDoContexto`, `@SemEscopo` com motivo em cada método, ou estar numa lista fechada com motivo. Também um lint que só deixa importar tabela em repository, e o escopo dos 3 repositories da IA vindo do contexto | repository base obrigatório (reescreve ~50; adiar) | o próprio teste | 1 | — (P5 é outra camada) |
| T7 | Camadas e ciclos | U02-8, U04-3, U04-8, U07-12, U10-3, M2 | `dependency-cruiser` com as regras da medição e `--ignore-known`. Os 3 ciclos se quebram por extração em `login.service` e `operador.repository`. As travas por caminho de `arquitetura.test.ts` viram regra de camada | código próprio de ciclo (Tarjan, ~60 linhas nossas) | depcruise na esteira | 1 | N9 (dependência nova) |
| T8 | Tamanho e complexidade | U10-10, U09-10, U08b-5, R10 | Regras do ESLint core (`complexity`, `max-lines-per-function`, `max-depth`) com supressões registradas: catraca, em que a supressão só sai e nunca entra | dependência nova | lint | 1 (a trava) e 4 (o corte) | limiares na Etapa 6 |
| T9 | IA e PDF na fila | U03-1, U03-2, U05-1, U05-2, U02-15, U06-3, U12-3 | Cada tarefa de IA vira um **Command** com registro (preparar, executar, concluir) no lugar das closures `lido`. O job `executar_agente` é publicado pelo `Enfileirador` na mesma transação da execução, com 1 tentativa; reentrega de `rodando` vira `interrompida`. Prazo por tipo com `AbortSignal`. O PDF vai para o storage antes do job | Temporal ou saga (stack nova); streaming do Tutor (adiar) | o registro de T4 e os testes de falha da 7.4 | 3 | P1 |
| T10 | Resiliência do provedor de IA | U03-3, U03-8, U03-9, U03-10 | Decorator sobre o adaptador (timeout, retentativa com jitter, disjuntor) com biblioteca madura (cockatiel, R-pesquisa), token bucket por minuto no `ContadorEmJanela`, métricas e drenagem no desligamento. A degradação (fila curta, modelo menor, reserva) segue a regra 80.4 e a D29 | escrever o disjuntor à mão | teste de falha do provedor (lento, 429, some) | 3 | N9 (dependência nova) |
| T11 | Conformidade em regex | U03-4, U01-12, U08b-14 | **Políticas** num módulo próprio, uma por regra (D36 risco à vida, D36 assunto delicado, pedido de resposta, D55 julgamento de texto, saída com nota), com padrões em array. Dois corpora: `dev` e `ouro`, este escrito por outro papel. Mutação por padrão e meta de recall assimétrica. Nada passa a depender de modelo na entrada | classificador de modelo na entrada (fere D36/D62) | mutação por padrão; o `ouro` não muda na tarefa que muda o padrão | 1 (trava) e 2 (mover) | P8 |
| T12 | Sessão no Postgres × regra 80.5 | U02-6, U04-4 | **Medir antes**: p95 de `sessao.leitura.duracao` no cenário de carga do k6, sem decidir cache | Redis de sessão (segundo ponto de falha na guarda) | — | 5 (a medida) | N2 |
| T13 | Resposta de prova (S8) | U05-4, U08b-1, U08b-2 | (a) timeout e jitter na fila de respostas, sem trava da fila por um envio pendurado; (b) campo `sequencia` no `PUT`, com `where excluded.seq > seq`; (c) o pendente sobrevivendo ao F5 | — | teste de falha: reenvio atrasado, F5 com pendente | 3 | (a) não; (b) e (c) N5 |
| T14 | Leituras agregadas no servidor | U08a-5, U08a-6, U08b-4, U08b-7, U03-11 | Um **read model** por papel ("esperando", sem nome de aluno) no lugar das 6 a 14 leituras do sino e do painel. "Turma sem professor", "escola montada" e o prazo do titular saem do cliente. A constante "quem dá professor" vai para `shared` | BFF separado | teste de contrato do read model; a regra fica só na API | 2 e 4 | N6 |
| T15 | Rede da web antes do corte | U07-1, U07-2, U07-3, U08a-3, U08b-3, U08b-6 | Sessão injetável (`criarSessao`, `useSessao`), sem tocar o operador (P4). `<Leitura consulta>` e `EstadoErro(consulta)`. Os testes de componente da decisão oficial, do Tutor e da Atividade vêm **antes** de partir cada tela | Playwright Component Testing; XState; Page Object | R19, com o piso da N4 | 4 | N4 |
| T16 | Infra e esteira | U10-1, U10-2, U10-5, U10-6, U09-2, U09-13 | Medir o tempo por arquivo do infra; uma subida para os cenários de alerta; Dockerfile único com `target`; o e2e sem observabilidade, via `profiles`; aviso de prazo nos quatro jobs | imagem em registro (exige `packages: write`) | aviso de prazo na esteira | 5 | N8 (só a rede lenta) |
| T17 | Testes: semente e helpers | U09-1, U09-3, U09-4, U09-5, U09-6, U09-8 | Uma semente tipada pelo Drizzle com teste de fumaça, depois de um spike; fixtures com teardown; uma fábrica de escola com dois adaptadores; prazo em todo ponto de espera da infra de teste; helpers de mais de uma app em `tools/testes/` | Pact; snapshot visual; Page Object | regra ESLint de teste contra helper copiado | 5 | P10 (pasta) |
| T18 | Documentação derivada | U12-1 a U12-6, U12-11 | Quadros de rotas, tabelas, filas, jobs e `@SemEscopo` **gerados** do metadado, com `--check` na esteira. "Onde implemento" e "como adiciono um módulo" escritos na Etapa 11 | Arc42/C4 completos; gerador de esqueleto (plop) | `--check` | 6 (depois de T2, T4) | — |

Decisões do Arquiteto nesta consolidação estão em `DECISOES.md`, R20 a R31.

## 4. Achados de conformidade e segurança que valem antes das ondas

Estes não esperam a onda nem mudam desenho. Cada um é defeito contra uma regra que já existe e vira **correção** (`/corrigir`)
com o guardião da regra. A ordem é a da gravidade.

1. **Lista de risco à vida incompleta (D36).** Faltam "me jogar", "melhor sem mim" e "sumir" (`packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:92-98`
   [código, conferido]), e o recall nunca foi medido fora das amostras do autor. O modelo também classifica
   `assunto_delicado` (`prompts/turno-do-tutor.ts:26`), mas a lista é a única rede determinística. Ampliar a lista muda
   o que o aluno vê (mais mensagens fixas e mais sinais ao professor). Por isso vai à Etapa 6 como pergunta (N11),
   com `conformidade-reviewer`, e o corpus `ouro` (T11) mede antes e depois.
2. **D55 na saída só barra nota, conceito e pontuação.** A devolutiva qualitativa ("o parágrafo 2 tem problemas de
   coesão") só é contida pelo prompt (U03-4). A regra 70.2a proíbe qualquer devolutiva. A correção é estender a conferência
   de saída, com `conformidade-reviewer`. A ordem de grandeza dos falsos positivos se mede com o corpus.
3. **S12: o Tutor responde se a avaliação abre entre o 202 e a execução** (U03-7). Custo P: conferir de novo na execução.
   É a regra 30.10.
4. **Hook do processo falha aberto e não vê `git` em forma não canônica** (U11-2, U11-3). Não é produto, mas é a trava da
   D53. O conserto da carga (sair com 2 quando o import falha) é pequeno. Pela RESPOSTAS, o processo não muda antes da
   Etapa 9, salvo o que destrave a missão. Este não destrava; ele **protege**. Fica como pergunta (N7): antecipar só a
   saída com 2, sem mexer no resto do hook.

## 5. O que fica para a parada da Etapa 6 ⛔

### As P existentes, agora com recomendação

| P | Recomendação do Arquiteto, com o diagnóstico | Achados |
|---|---|---|
| P1 IA e PDF na fila | **Aprovar**, na onda 3, com o desenho de T9. A latência a mais no Tutor fica em 0,1 a 0,6 s [hipótese, U03-2], abaixo do polling de 1 s que a tela já faz. Sub-pergunta: o worker de IA é uma segunda entrada da imagem da API (custo menor, mesmo código) ou os repositories de IA sobem para um pacote comum? Recomendo a **segunda entrada**, porque não move código entre pacotes | U03-1, U03-2, U05-1, U02-15, U06-3 |
| P2 Borda de entrada | **Aprovar** o pipe por parâmetro com conferência no boot (T1) | U01-1, U04-1, U04-12 |
| P3 OpenAPI e contrato de rota | **Aprovar o registro de rotas** (T2). O OpenAPI sai como documento derivado, sem dependência de runtime | U01-2, U12-5 |
| P5 RLS | **Adiar para fora da X5.** A trava T6 fecha o esquecimento sem migration. RLS pede uma migration por tabela e é a parte irreversível | U02-1, U10-4 |
| P6 Estrito × web aberta | **Aprovar o leitor tolerante na web** (T3). A API continua estrita | U01-3, U07-7 |
| P7 Realtime e pgvector | **Congelar o realtime** atrás de um profile do compose, sem apagar código nem teste; a decisão de remover fica para o PRD do F10. Se a P1 for aprovada, o realtime vira candidato a canal de término da execução (U03-11), o que pesa contra remover. O pgvector fica como está | U01-13, U06-6, U03-11 |
| P8 Regras de conformidade | **Aprovar o módulo de políticas** (T11), com corpus `ouro` de outro papel e `conformidade-reviewer` em toda tarefa dele | U03-4, U01-12, U08b-14 |
| P9 CLAUDE.md e regras | Fica na **Etapa 9 ⛔**. O diagnóstico mediu 74.140 B de base fixa, com 24,6 KB de tabelas que repetem `docs/decisoes.md` | U11-1, U11-9 |
| P10 Pastas e nomes | **Aprovar a convenção**, com os nomes a cargo dele: `sessao/` partida em `credencial/` (as primitivas que os outros módulos usam) e `sessao/` (os fluxos, em subpastas); `ops/` como adaptador fino de terminal sobre os casos de uso de `operacao/`; `shared` e `nucleo` com **subcaminhos** de `exports` (`@educa/shared/servidor`, os assuntos do nucleo), sem pacote novo; helpers de teste usados por mais de uma app em `tools/testes/`; `componentes/` da web separado em kit e peças de domínio | U04-2, U05-6, U05-7, U01-7, U02-8, U09-8, U07-12 |

### As perguntas novas (de 27 nas unidades para 11)

As 27 perguntas das unidades foram juntadas por assunto. As que viraram decisão do Arquiteto ou registro estão em
`DECISOES.md` (R20 a R31), com o motivo.

| N | Pergunta | Por que é dele | Recomendação | Achados |
|---|---|---|---|---|
| N1 | A falha final de job (`falhou`) passa a ficar **30 dias, ou até alguém reprocessar ou descartar**, no lugar dos 7 de hoje? E o reprocessar é comando de terminal (`ops:`) ou ação do painel de operação (D76)? | Muda retenção de dado (o payload tem id de pedido do titular) e a tabela de `docs/lgpd.md` | 30 dias; **comando de terminal** agora, com o painel depois | U02-4, U06-1 |
| N2 | A regra 80.5 diz que a sessão mora no Redis, e o código a lê do Postgres sem cache. Vale **corrigir o texto da regra** para "Postgres, medido" se a medida de carga ficar abaixo do limite, ou já se faz cache com invalidação? | Troca uma regra do projeto e, com cache, muda o RF5 da sessão ("cai na requisição seguinte") | Medir primeiro (T12) e corrigir o texto na Etapa 9 se o p95 passar no k6 | U02-6, U04-4 |
| N3 | Com o Redis de fila fora, o MFA e a escolha de escola respondem **503 "tente de novo"** no lugar do 401 de "código errado"? | É contrato de erro de um fluxo de segurança | Sim: hoje o aluno lê "código errado" numa queda nossa | U04-6 |
| N4 | **Piso por pasta** além dos 85 % globais da R19: base, `areas/aluno`, `areas/professor`, `areas/coordenacao` e `operacao`, cada uma com **≥ 80 %**? | Muda um critério de aceite já aprovado | Sim: sem o piso, o global fecha com o aluno, que é menor de idade, em ~50 % | U07-2, U08a-3, U08b-6 |
| N5 | A prova ganha **`sequencia` no `PUT` da resposta** e o **pendente guardado em `sessionStorage`** (só os ids de questão e alternativa, limpos no envio e na troca de sessão), para sobreviver ao F5? | Muda o contrato com a web e toca a regra 50.7 (nada sensível no navegador) num computador da escola compartilhado | Sim às duas, com `privacy-guardian`. O `sessionStorage` morre ao fechar a aba, e a tela hoje promete "o que você respondeu fica guardado" (`aluno/Atividade.tsx:233`) | U05-4, U08b-1 |
| N6 | Os **read models por papel** no servidor (o "esperando" do professor e da coordenação), com "turma sem professor", "escola montada" e o **prazo de 15 dias do titular** saindo do cliente? Inclui a troca atômica do material que falhou (`substitui` no `POST`) | São contratos novos entre web e API, e um deles carrega prazo legal | Sim, na onda 2, com a tela na 4 | U08a-5, U08a-6, U08a-12, U08b-4 |
| N7 | Antecipar, antes da Etapa 9, **só a saída com código 2 do hook** quando a carga falha? | Mexe no processo antes da Etapa 9 (RESPOSTAS) | Sim: é uma linha, fecha a falha aberta e não muda nenhum comportamento de quem passa | U11-2 |
| N8 | A **rede lenta do Chromebook** no e2e passa a valer só nos specs que medem carga, mantendo a CPU ×4 em todos? E os specs de conformidade de design rodam num projeto só? | É a leitura da D51 e da regra 50 | **Medir antes** (o `goto` de ~20 casos). Só com a medida volta a pergunta. Até lá, nada muda | U09-2, U09-9 |
| N9 | Duas dependências novas, com justificativa: **`dependency-cruiser`** (devDependency, trava T7) e **`cockatiel`** (produção, resiliência T10) | Regra da missão: nenhuma dependência nova sem justificativa, e uma delas entra no caminho do provedor de IA | Sim às duas. As duas são MIT e declaram Node ≥ 22 (R-pesquisa §1 e §3), e substituem código que teríamos de escrever (Tarjan para ciclos; disjuntor e retentativa à mão). A árvore transitiva de cada uma se confere na instalação | U10-3, U03-3 |
| N10 | O **tutor de uma escola sem provedor no Brasil** recusa a subida (o boot falha) quando a D62 não se cumpre? | Torna a D62 bloqueante em código | Sim: é o que a D62 diz. A escolha de um ou dois provedores fica na D37, que já está em aberto | U03-5 |
| N11 | Ampliar a lista de **risco à vida** (D36) e a conferência de saída da **D55** (§4, itens 1 e 2), medidas pelo corpus `ouro`, numa correção logo depois da Etapa 6? | Muda o que o aluno vê e o que o professor recebe, com falso positivo possível | Sim, com `conformidade-reviewer`, antes da onda 1 | U03-4 |

### Para a Etapa 9 ⛔ (harness), já registradas

São perguntas do processo; pela RESPOSTAS, não entram antes da Etapa 9. Ficam aqui para não se perderem:

- O git hook nativo entra como segunda camada (U11-3)?
- O guardião passa a ser exigido pelo caminho alterado, e não só pela marcação do Arquiteto (U11-4, muda a D79)?
- `tools/guardas/`, `tools/processo/` e `.claude/` passam a exigir revisão (U11-5, muda a D53)?
- Tarefa de código sem teste alterado nem mutação deixa de passar o portão (U11-8, regra 40)?
- O caminho `(mvp:)` do hook sai de vez (U11-10, D77)?
- O histórico de `achados/` sai do git depois do pouso (U11-15)?
- A esteira roda também em `pull_request` para a `develop` (U10-13, D23)?
- A ordem segura de mexer no hook está em `diagnostico/U11.md` §7.

## 6. O que fica fora da X5, registrado

| O quê | Por quê | Achados |
|---|---|---|
| Corte do teto de IA da escola fora do Tutor (bloquear, avisar, cair de modelo) | É produto (D14, D39), e o teto está na decisão em aberto "Valores das faixas de preço e teto de IA". A X5 só preenche `custo_micros`, que é medida | U03-6 |
| O Analista sem modelo onde a regra já calcula | Mexe na D32 | U03-12 |
| "Abrir a atividade sem responder" contar como aberta | É regra de produto, e o comportamento atual se preserva | U05-15 |
| Gatilho de auditoria no banco para a transição de `entrega.estado` | Migration em tabela da regra 70 (M1). Na X5 entra o teste de lista fechada | U05-3 |
| Imagem de produção da web (Caddy ou borda) | Decide-se com o staging (D42) | U10-9 |
| Janela de deploy × faixa dos expurgos | Não há deploy em produção (D31) | U06 |
| Backup, restauração, rollback | Portão do piloto (S13) | U10-17 |
| Rodada do despachante em lote no Redis | Só depois de ~10 escolas (D25); medir antes | U06-8 |
| Telemetria de falha do navegador | Canal novo de dado a partir de tela de menor. A X5 deixa a **porta** (`reportarFalha`, sem envio) e a fronteira de erro de render | U07-8 |

## 7. O efeito no plano de ondas

A ordem aprovada (R17) se mantém. O diagnóstico acrescenta quatro coisas:

1. **Antes da onda 1:** as correções da §4 (N11, S12) e, se a N7 for aprovada, a saída com 2 do hook.
2. **A onda 1 cresceu**, de "contratos" para "contratos e travas": T1, T2, T3, T4, T6, T7, T8 e a trava de T11. É a onda
   que mais protege as seguintes, e é a de menor risco, porque a API tem 97,9 % de linhas [medida].
3. **A onda 4 pede a rede antes do corte** (T15): os testes de componente de Aprovar, Time, Tutor e Atividade vêm antes de
   partir qualquer tela. Pela conta da U08b, só cobrir `aluno/Tutor.tsx` e `aluno/Atividade.tsx` (193 ramos) já leva
   aquela pasta a 85 %.
4. **Três medidas viram tarefa** antes de qualquer decisão que dependa delas: o p95 da leitura de sessão no k6 (T12), o
   tempo por arquivo do infra (T16) e o custo da rede lenta no e2e (N8).

## 8. Limitações

- Nenhum subagente rodou teste, build ou ferramenta: tudo foi lido. As latências (P1, Tutor), o ganho de tempo do infra
  e o custo da rede lenta são **[hipótese]** até a medida.
- Os relatórios por unidade passaram do teto de ~3.000 palavras do roteiro (de 3,6 mil a 5,4 mil). Não foram cortados:
  a evidência `arquivo:linha` é o que as tarefas vão citar.
- O Arquiteto conferiu no código ou na medição os achados que mudam decisão: S12, U02-2, U10-4 (25 de 71), a conta dos
  827 ramos, a lista de risco à vida e a falha aberta do hook. Os demais seguem com a marca que a unidade deu.
- A primeira rodada dos subagentes caiu pelo limite semanal de uso em 20/10; a retomada de 21/10 completou as 13
  unidades sem perda.

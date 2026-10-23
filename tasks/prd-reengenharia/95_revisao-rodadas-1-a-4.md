# Revisão da 95.0 — rodadas 1 a 4 do `revisor-geral` (22/10/2026)

> Cópia literal de `.processo/reengenharia/guia/REVISAO.md`, do térreo, onde as quatro rodadas correram fora do andar e por isso o hook não as registrou (validação 1, maior 1). Trazida pelo Arquiteto em 23/10/2026. A 5ª rodada, sobre o `c88231a`, está em `achados/95_task.md`, registrada pelo hook (ele a conta como 1ª, porque não viu as anteriores).

# Revisão da 95.0 — revisor-geral, 1ª rodada (22/10, pelo Arquiteto)

Revisado contra o andar da spec em `0366ce1`. Os cinco bloqueantes são para quem escreveu o guia (Claude Code #2): corrija aqui e avise o Arquiteto, que roda a 2ª rodada só sobre eles. A lista "Conferir depois das pastas" é do Arquiteto, antes da publicação, e não bloqueia agora. As recomendações valem a pena (a de `arquitetura.md:41` é quase bloqueante, porque o "Pronto quando" da 95.0 a exige na publicação).

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em `arquitetura.md:108` (diz que a ida da IA para o worker está no F5, mas ela está na X6) e em `guia-do-desenvolvedor.md:249` (dá como exemplo da fila `interativa` um trabalho que só a 47.0 leva para lá, e a 47.0 foi para a X6)
Portão local: o `conferir` diz "nunca passou nesta árvore". Não bloqueia: a 95.0 é só documento, sem portão de código (`tasks.md`, 95.3; `95_task.md`, "Fora do escopo").

**Bloqueantes**

1. **O guia leva o dev a furar a autorização por objeto (regra 10.4 e regra 20.5).**
   - Onde: `guia-do-desenvolvedor.md:70` ("`@Permite(...)` sobre a `MATRIZ`" como o `@PreAuthorize`), `:176-177` ("Acrescente a ação na `MATRIZ` [...] com o alcance de cada papel"), `:197-201` (o repository só com `escolaId`) e a §5.6 (`:297-312`), que testa só escola A contra escola B.
   - Por quê: a `GuardaDePermissao` só barra o alcance `nunca` (`packages/nucleo/src/permissao/guarda-permissao.ts:28-29`). O `turma_vinculada` e o `proprio` são aplicados no repository, com o vínculo `confirmado` do usuário do contexto (`apps/api/src/assistente/turma-do-professor.repository.ts:17`, `artefato.repository.ts:54`, `entrega.repository.ts:36`). Quem seguir a receita e marcar a célula como `turma_vinculada` acha que a guarda protege. Na prática, o professor lê qualquer turma da escola.
   - O que tem de ficar:
     - na §5.1, dizer que a guarda só barra `nunca`, e que `turma_vinculada` e `proprio` são aplicados no repository, com o exemplo real;
     - na §5.6 (ou na 5.1, passo 7), o caso "professor da mesma escola sem vínculo na turma → o mesmo 404";
     - na linha da tabela da §2, que o `@Permite` cobre a rota e o papel, não o objeto.

2. **A fila `interativa` aparece com um exemplo que a X5 não entrega.**
   - Onde: `guia-do-desenvolvedor.md:249`, "`interativa` | alguém está esperando na tela | resposta ao professor".
   - Por quê: nenhum job de produção usa `interativa` hoje. Os únicos `fila:` de produção são `normal` (`privacidade.service.ts:238`) e `lote`. A resposta ao professor roda no processo da API pelo `AgendadorDeExecucoes` (exceção da D77, que o próprio guia descreve na §5.4). Levar a IA para a fila do worker é a 47.0, que está em "Saíram para a X6". Quem ler isso vai pôr um job de IA na `interativa`.
   - O que tem de ficar: um exemplo verdadeiro, ou "nenhum tipo hoje; a IA roda no processo da API (D77) até a 47.0, na X6". O "ingestão" da linha `lote` também não existe (é do F4): deixar como "expurgo, eliminação do titular".

3. **Afirmação falsa sobre onde a dívida está registrada.**
   - Onde: `arquitetura.md:108`, "A ida para o worker está registrada no F5 (`camada-ia`), com o desenho do diagnóstico da reengenharia."
   - Por quê: o F5 do `ROADMAP.md` (`:507-525`) não fala de worker. O registro está na X6: `ROADMAP.md:448`, "Antes do portão do piloto: a IA e o PDF no worker (42.0, 45.0 a 47.0...)", e "Saíram para a X6" do `tasks.md`.
   - O que tem de ficar: "registrada na X6 (`reengenharia-continuacao`, 42.0 e 47.0), antes do portão do piloto".

4. **Afirmação falsa sobre uma trava.**
   - Onde: `guia-do-desenvolvedor.md:266`, "**Nunca** importe SDK de IA nem chame o adaptador direto: o lint barra (regra 30)."
   - Por quê: o lint só barra o import de SDK (`tools/guardas/regras-ia.mjs`, `REGEX_SDK_DE_IA`). Chamar o `AdaptadorOpenAICompat` direto, que sai exportado de `@educa/nucleo`, não tem trava. O dev passa a confiar numa proteção que não existe.
   - O que tem de ficar: "o lint barra o import de SDK; chamar o adaptador ou a porta sem passar pelo `AgendadorDeExecucoes` e pelo gateway é proibido pela regra 30 e cabe à revisão".

5. **A lista de alto risco está incompleta diante da regra 70.6a.**
   - Onde: `guia-do-desenvolvedor.md:268`, "Funcionalidade de alto risco (tutor, correção, sinais sobre aluno, adaptação)".
   - Por quê: a 70.6a lista Tutor, correção de objetiva, **diagnóstico por habilidade**, sinais e alertas, e adaptação. Do jeito que está, a lista parece fechada, e o diagnóstico por habilidade do F6 passaria sem AIA.
   - O que tem de ficar: a lista completa da 70.6a, ou só a remissão a ela, sem enumerar.

**Recomendações**

- `guia:48`: trocar "a IA não avalia" pelo texto da D55: não corrige, não avalia, não dá nota nem conceito, não pré-corrige nem sugere nota. A pré-correção é justamente a armadilha que a 70.2a nomeia.
- `guia:47`: completar a lista da regra 20.2 (telefone, endereço, data de nascimento, diagnóstico) e a da 20.9 (matrícula, resposta, conteúdo de prompt), ou só apontar para a regra.
- `guia:78`: o `ProntidaoController` está em `apps/api/src/sistema/prontidao.controller.ts`, não em `nucleo/src/instancia/`.
- `guia:284`: a regra 50.5 fala em quatro estados (o quarto é "com dado"). Depois da 36.0, `Estado*` e `useEnvioUnico` ficam em `componentes/estado/` e `componentes/dialogos.tsx`, fora do "kit" `ui/`. Vale citar 360 px e o alvo de toque de 24 e 44 px.
- `guia:193-194`: a 14.0 barra também `@Param()` sem pipe e `@Req()` cru. Na §7, entra a trava da 36.0 (`ui/` não importa `api/`, `areas/` nem `sessao/`).
- §5.2, passo 4: dizer onde se classifica a tabela (`packages/shared/src/privacidade/classificacao.ts`), não só o `docs/modelo-de-dados.md`.
- §5.3, passo 3: o id do job não deduplica dois jobs do mesmo pedido. Citar o `enfileirarUmaVez(tx, pedido, chave)`.
- §6 e §5.1, passo 7: há 22 `*.int.test.ts` em `apps/api/src/**`, ao lado do código (o de isolamento da atividade é um deles). O guia diz que a integração da API mora em `apps/api/test/`.
- §9: o `ContadorEmJanela` também limita os pedidos de IA do Assistente (`assistente/limite-de-pedidos-de-ia.ts`), não só o login e a sala.
- `arquitetura.md:41`: falta uma nota para o Arquiteto, como as do guia. O `ZodValidationPipe` não existe hoje e depende da 14.0 a 17.0. O "Pronto quando" da 95.0 exige que o `docs/arquitetura.md` não cite o que não existe no andar.

**Conferir depois das pastas** (não bloqueia hoje: está previsto em tarefa da X5)

- §2 e §5.1: `apps/api/src/estrutura/disciplina.{controller,service,repository}.ts` passa a `estrutura/disciplina/` (96.2). Nenhuma nota cobre os caminhos da tabela da §2.
- `estrutura/entrada.ts`: o `lerEntrada`, o `idDoCaminho` e o `lerConsultaPaginada` saem (17.0), e o `paginar` vai para `apps/api/src/http/paginacao.ts` (35.0). O `http/` não aparece no mapa da §4.
- `apps/api/src/credencial/` (33.0). O `ContadorEmJanela`, o `SemaforoDeHash` e o `ContadorDeTentativas` vão de `sessao/senha/` para `credencial/` (33.2 e 33.3).
- `sessao/` em subpastas por fluxo, com `sessao/tenant/` (34.0). `ops/` só com terminal, e os casos de uso em `operacao/casos-de-uso/`, que depois vira `operacao/escola/` (35.0, 96.5).
- §4: `<modulo>/<recurso>/` só vale para `estrutura`, `operacao`, `sala` e `atividade` (96.0). Os outros módulos continuam planos.
- `apps/web/src/componentes/ui/`, com `campos/`, `sobrepostos/`, `ia/`, `icones/` e `onca/` (36.0). `estado/`, `dialogos.tsx`, `sino/` e `pedidos/` ficam em `componentes/`.
- `areas/<papel>/<assunto>/`, com `<assunto>/api/` (97.0). `apps/web/src/api/estrutura.ts` fica onde está (não está na lista que a 97.0 move).
- `tools/guardas/tamanho-das-pastas.test.ts` (97.0 e 96.0), `escopo-dos-repositories.ts` e `repositories-com-escopo.test.ts` (6.0), `regras-tenant.mjs` e `tabelas-do-nucleo.mjs` (9.0), `camadas.cjs` e `npm run guarda:camadas` (12.0), `eslint-suppressions.json` e `catraca.test.ts` (13.0).
- `packages/nucleo/src/entrada/` (`ZodValidationPipe`, `IdPipe`; 14.0) e `packages/shared/src/sistema/definicoes-de-job.ts` (18.0). O guia não dá o caminho deste último.
- Se entrarem: `guardas/erro-tipado` e `ErroDeInvariante` (25.0), e o knip dentro do `guarda:dependencias` (24.0). Hoje não estão na §7 nem na §8.
- A linha do `README.md` na primeira tela (95.2), aplicada pelo Arquiteto.

Arquivos revisados:
- `/home/joaquimdp/Documentos/git/Educa.ia/.processo/reengenharia/guia/guia-do-desenvolvedor.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/.processo/reengenharia/guia/arquitetura.md`
## Correções do Claude Code #2 (22/10, para a 2ª rodada)

Os cinco bloqueantes:
1. **Autorização por objeto:**
   - §2: duas linhas na tabela, uma para "rota e papel" (`@Permite`) e outra para "objeto, no repository";
   - novo item em "O que é diferente";
   - §3, passos 5 e 8;
   - §5.1, passo 2 (a guarda só aplica `nunca`) e passo 5 (`comVinculoConfirmadoDoProfessor`);
   - §5.6: o caso do professor da mesma escola sem vínculo, com o mesmo 404.
2. **Fila `interativa`:** "nenhum tipo hoje; a IA roda no processo da API (D77) até a 47.0, na X6". O `lote` passou
   a "expurgo da escola, eliminação do titular".
3. **`arquitetura.md`:** "registrada na X6 (`reengenharia-continuacao`, 42.0 e 47.0), antes do portão do piloto".
4. **§5.4, passo 3, e §7:** o lint barra só o import de SDK; a chamada direta ao adaptador ou à porta cabe à revisão
   (regra 30).
5. **§5.4, passo 5:** a lista completa da 70.6a, com o diagnóstico por habilidade, e a remissão à regra.

Das recomendações, entraram todas:
- o texto da D55;
- as listas da 20.2 e da 20.9;
- o caminho do `ProntidaoController`;
- os quatro estados, a pasta `componentes/estado/`, o `useEnvioUnico`, os 360 px e o alvo de toque;
- o `@Param()` e o `@Req()`, e o lint do kit (36.0);
- a `classificacao.ts`;
- o `enfileirarUmaVez`;
- a integração ao lado do código;
- o `ContadorEmJanela` no Assistente;
- a nota do `ZodValidationPipe` em `arquitetura.md`;
- na §4, o `<recurso>/` só nos quatro módulos, mais `credencial/` e `http/`.

A lista "Conferir depois das pastas" continua com o Arquiteto, antes da publicação.

# 2ª rodada — revisor-geral (22/10, pelo Arquiteto, contra `cef19e6`)

Os cinco bloqueantes da 1ª rodada foram resolvidos. A correção trouxe dois bloqueantes novos, ambos de texto. A 3ª rodada olha só esses dois.

**VEREDITO: REPROVADO**

Os cinco bloqueantes da 1ª rodada estão resolvidos. Duas correções novas, porém, trazem afirmações falsas sobre o código: o passo 5 da §5.1 com a §5.6, e o lugar dos testes de integração. Cada uma vira um bloqueante novo. Conferi tudo no andar em `cef19e6`.

Escopo: respeitado
Aderência à Tech Spec: ok. As duas divergências da 1ª rodada (`arquitetura.md:108` e `guia:249`) foram corrigidas.
Portão local: o `conferir` diz "nunca passou nesta árvore". Não bloqueia: a tarefa é só documento, e o `95_task.md:14` e o `:47` tiram código, teste e portão do escopo.

## Os 5 bloqueantes da 1ª rodada

1. **Autorização por objeto: resolvido.**
   - A linha 72 da §2 diz que o `@Permite` cobre "a rota e o papel, não o objeto", e a linha 73 diz que o objeto é conferido no repository.
   - O "O que é diferente" (`:90-92`) diz que a guarda só barra `nunca`, o que confere com `guarda-permissao.ts:28-29`.
   - A §3 (`:109`, `:112-113`) e a §5.1, passo 2 (`:186-187`), dizem o mesmo.
   - A §5.6 (`:341-343`) traz o caso do colega da mesma escola sem vínculo.
   - O texto novo, porém, traz o bloqueante novo 1, abaixo.
2. **Fila `interativa`: resolvido.**
   - `guia:269` diz que nenhum job usa a `interativa` hoje.
   - Isso confere: os únicos `fila:` de produção são `normal` (`privacidade.service.ts:238`) e `lote` (`expurgar-dado-pessoal.ts:58`, `agendamentos.ts:90`, `expurgo-da-escola.repository.ts:479`).
   - A linha `lote` (`:271`) está certa.
3. **`arquitetura.md`: resolvido.** As linhas 112-113 dizem o que o `ROADMAP.md:441-449` registra: X6, `reengenharia-continuacao`, "Antes do portão do piloto". A 42.0 e a 47.0 estão em "Saíram para a X6" (`tasks.md:259`, `:262`).
4. **Trava de IA: resolvido.**
   - `guia:286-288` e a linha da §7 (`:381`) separam o que o lint barra (o import de SDK, `regras-ia.mjs:27`) do que fica com a revisão.
   - O `AdaptadorOpenAICompat` sai exportado de `@educa/nucleo` (`packages/nucleo/src/index.ts:304`), então a ressalva é necessária.
5. **Lista de alto risco: resolvido.** `guia:290-292` repete a lista completa da regra 70.6a (`70-conformidade-cne.md:113-114`) e manda ler a regra, não a lista.

## Bloqueantes novos

1. **`guia-do-desenvolvedor.md:213-216` e `:341-343`: o texto sobre o alcance do objeto descreve o código errado.**
   - **O `proprio` não é vínculo.** O passo 5 diz que, com alcance `turma_vinculada` ou `proprio`, o repository exige o vínculo `confirmado` e usa o `comVinculoConfirmadoDoProfessor`. Mas:
     - a matriz define `proprio` como "só o que é da própria pessoa" (`packages/shared/src/permissao/matriz.ts:7`);
     - o código aplica o `proprio` pelo dono da linha: `eq(threadAgente.usuarioId, exigirUsuarioDoContexto())` em `apps/api/src/ia/execucao.repository.ts:155`;
     - o `vinculo.confirmar: 'proprio'` (`matriz.ts:295`) age justamente sobre um vínculo que ainda não está confirmado;
     - o aluno tem `proprio` (`matriz.ts:336`, `:344`) e não tem vínculo de professor.
   - **A disciplina só entra quando a linha tem disciplina.** O passo 5 ("na turma e na disciplina da linha") e a §5.6 ("com vínculo em outra disciplina [...] recebe o mesmo 404") valem para artefato, entrega, atividade e correção. Não valem para a turma:
     - a conferência própria do `TurmaRepository` não olha disciplina (`apps/api/src/estrutura/turma.repository.ts:220-234`);
     - o professor de outra disciplina da mesma turma lê a turma (`turma: { ler: 'turma_vinculada' }`, `matriz.ts:289`), e isso é intencional;
     - no ano encerrado, o vínculo encerrado por `fim_do_ano` ainda vale (`turma.repository.ts:243-248`).
   - **O que tem de ficar:**
     - o `proprio` é aplicado pelo dono da linha, igual ao usuário do contexto, com o exemplo de `execucao.repository.ts:155`;
     - o `turma_vinculada` usa o `comVinculoConfirmadoDoProfessor` quando a linha tem disciplina. A leitura da própria turma confere só o vínculo na turma, em `estrutura/turma.repository.ts`;
     - na §5.6, o caso "vínculo em outra disciplina → 404" fica restrito ao recurso que tem disciplina.

2. **`guia-do-desenvolvedor.md:219-220`, `:355` e `:145`: afirmação falsa sobre onde mora o teste HTTP.**
   - Esta veio da recomendação aplicada. O guia diz que os testes HTTP da API inteira ficam em `apps/api/test/` e que, ao lado do código, ficam só os de service e repository. A linha 145 acrescenta "incluindo os de isolamento".
   - No código, 12 dos 22 `*.int.test.ts` de `apps/api/src/**` sobem a API com `subirApi` ou `api-com-sessao`. Por exemplo:
     - `apps/api/src/atividade/atividade-isolamento.int.test.ts`, um teste de isolamento ao lado do código;
     - `artefato.int.test.ts`, `entrega.int.test.ts`, `tutor.int.test.ts` e `ia.int.test.ts`.
   - Nenhuma tarefa de pasta muda isso: a 96.1 leva os testes junto com o recurso.
   - **O que tem de ficar:** o teste de integração, HTTP ou não, fica ao lado do módulo ou em `apps/api/test/`. Os de mais de um módulo e o `arquitetura.test.ts` ficam em `apps/api/test/`. A linha 145 sai ou diz o mesmo.

## As recomendações que o autor diz ter aplicado

Conferi as onze. Estão corretas, com uma exceção: a da integração "ao lado do código", que gerou o bloqueante novo 2.

- O texto da D55 (`:49-50`) e as listas da 20.2 e da 20.9 (`:47-48`) conferem.
- Os caminhos citados existem: `apps/api/src/sistema/prontidao.controller.ts`, `packages/shared/src/privacidade/classificacao.ts`, `apps/web/src/componentes/estado/` (com `EstadoCarregando`, `EstadoErro` e `EstadoVazio`) e o `useEnvioUnico` em `componentes/dialogos.tsx:26`.
- Os quatro estados, os 360 px e o alvo de 24 e 44 px conferem com a regra 50 (`50-frontend.md:43-44`, `:55`).
- O `@Param()` e o `@Req()` conferem com a 14.3. O lint do kit confere com a 36.0.
- O `enfileirarUmaVez(tx, pedido, chave)` confere com `expurgar-dado-pessoal.ts:58`.
- O `ContadorEmJanela` no Assistente confere com `assistente/limite-de-pedidos-de-ia.ts:4`.
- A nota do `ZodValidationPipe` está em `arquitetura.md:41-43`.
- O `<recurso>/` só nos quatro módulos confere com a 96.0. O `credencial/` confere com a 33.0, e o `http/` com a 35.0.

## Recomendações

- `guia:216`: "Vínculo pendente, contestado ou encerrado não dá alcance" está certo para o `comVinculoConfirmadoDoProfessor`. Mas a leitura do ano encerrado aceita o encerrado por `fim_do_ano` (`turma.repository.ts:243-248`). Vale meia frase.
- `guia:214`: "Não escreva o seu" fica forte demais enquanto o `TurmaRepository` e o `MaterialRepository` (`material.repository.ts:119`) têm conferência própria. Melhor: "use o helper quando a linha tem turma e disciplina".

## Conferir depois das pastas (só o que é novo)

- `guia:384`: o arquivo do "Lint do kit" depende de onde o `36_task.md`, ainda por escrever, puser a regra.
- `guia:390`: a linha do `arquitetura.test.ts` ("leitura entre escolas fora do lugar certo") pode perder parte do que barra com a 12.4, que tira do teste o que o `dependency-cruiser` cobre.
- `guia:73` e `:215`: o `assistente/turma-do-professor.repository.ts` não é movido pela 96.0. Conferir só se a 33.0, a 34.0 ou a 35.0 mexerem no `assistente/`.

Os arquivos revisados ficam em `/home/joaquimdp/Documentos/git/Educa.ia/.processo/reengenharia/guia/`: o `guia-do-desenvolvedor.md` e o `arquitetura.md`.

## Correções do Claude Code #2 para a 3ª rodada

1. **§5.1, passo 5, e §5.6: cada alcance com o seu mecanismo.**
   - `turma_vinculada`:
     - linha com disciplina: `comVinculoConfirmadoDoProfessor`;
     - linha sem disciplina: o vínculo na turma, `#comVinculoDoProfessor` de `turma.repository.ts`, com o ano
       encerrado.
   - `proprio`: a coluna do dono igual a `exigirUsuarioDoContexto()` (`ia/execucao.repository.ts`), sem vínculo.
   - A §5.6 dá o segundo caso de teste por alcance. Em `turma_vinculada`, o professor sem vínculo ou com vínculo
     pendente, contestado ou encerrado, e, com disciplina, o vínculo em outra disciplina. Em `proprio`, outra pessoa
     do mesmo papel.
2. **Os testes de integração da API estão em dois lugares:** em `apps/api/test/`, para os módulos mais antigos e para
   os de arquitetura, e ao lado do código, para os módulos novos (`atividade-isolamento.int.test.ts`,
   `tutor.int.test.ts`). Teste novo vai para onde o módulo já guarda os seus. Isso está no mapa da §4, no passo 7 da
   §5.1 e na §6.

# 3ª rodada — revisor-geral (22/10, pelo Arquiteto, contra `cef19e6`)

**VEREDITO: REPROVADO**

Escopo: respeitado (olhei só os dois pontos)
Aderência à Tech Spec: ok
Portão local: não conferido. A tarefa é só documento, como na 2ª rodada.

O núcleo dos dois pontos está certo. Em cada um sobrou uma frase que o código desmente: uma sobre o ano encerrado, outra sobre o módulo `sessao`.

## Ponto 1 — O mecanismo de cada alcance (§5.1, passo 5, e §5.6): não resolvido

O que agora confere com o código:
- **`proprio`** (`guia:222-224`):
  - os dois exemplos existem em `apps/api/src/ia/execucao.repository.ts:155` (`threadAgente.usuarioId`) e `:164` (`mensagemTutor.alunoId`), os dois com `exigirUsuarioDoContexto()`;
  - "Aqui não há vínculo" bate com `matriz.ts:7`, `:295` e `:352`.
- **`turma_vinculada` em linha com disciplina** (`guia:216-217`): o helper está em `apps/api/src/assistente/turma-do-professor.repository.ts:30-47` e exige `eq(vinculo.disciplinaId, ...)`. Quem chama é artefato (`artefato.repository.ts:67`, `:113`), atividade aplicada (`atividade-aplicada.repository.ts:92`, `:131`, `:147`), entrega (`entrega.repository.ts:52`) e correção (`correcao.repository.ts:120`, `:297`).
- **`turma_vinculada` em linha sem disciplina** (`guia:218-220`): `#comVinculoDoProfessor` (`apps/api/src/estrutura/turma.repository.ts:218-234`) confere a turma sem disciplina.
- **§5.6** (`guia:351-354`): o caso "outra disciplina" ficou só para a linha com disciplina, e o `proprio` ganhou o caso dele.

**Bloqueante: `guia-do-desenvolvedor.md:221`.** A frase "Vínculo pendente, contestado ou encerrado não dá alcance" agora fica no nível do `turma_vinculada` e vale também para a linha sem disciplina. Ali ela é falsa:
- Na leitura de um ano encerrado, o `#comVinculoDoProfessor` aceita o vínculo encerrado por `fim_do_ano` que tinha sido confirmado. Ele faz isso pelo `#confirmadoAteOFimDoAno` (`turma.repository.ts:232`, com o filtro em `:238-247`: `motivoEncerramento = 'fim_do_ano'`, `decididoEm` preenchido, `contestacao` nula).
- O "que também trata o ano encerrado" (`:219-220`) não diz que aceita o `fim_do_ano`, e esse era justamente o item que faltava.

**Correção exigida:** limitar a frase ao ano em curso e acrescentar a exceção. Por exemplo: "No ano em curso, vínculo pendente, contestado ou encerrado não dá alcance. Na leitura de um ano encerrado, a turma aceita também o vínculo encerrado pela virada (`fim_do_ano`) que tinha sido confirmado (`turma.repository.ts:238-247`)."

## Ponto 2 — Onde mora o teste de integração da API: não resolvido

O que agora confere:
- Os dois exemplos citados existem e sobem a API: `apps/api/src/atividade/atividade-isolamento.int.test.ts` e `apps/api/src/tutor/tutor.int.test.ts`.
- "Perto de metade" está certo: 12 dos 22 `*.int.test.ts` de `apps/api/src` usam `subirApi` ou `api-com-sessao`.
- Estrutura, operação e privacidade não têm `*.int.test.ts` em `src`.

**Bloqueante: `guia-do-desenvolvedor.md:145-146` e `:371`.** As duas linhas põem a sessão entre os módulos cujos testes de integração ficam em `apps/api/test/`. Mas 11 testes de integração da sessão ficam ao lado do código, em `apps/api/src/sessao/`, entre eles `convite.repository.int.test.ts`, `eu.repository.int.test.ts`, `desafio.int.test.ts`, `senha/contador-em-janela.int.test.ts` e `externa/conta-externa.repository.int.test.ts`. Os testes HTTP da sessão é que ficam em `apps/api/test/` (`sessao-matricula`, `sessao-externa`, `sessao-guarda`...). A divisão por idade (antigos em `test/`, novos ao lado) não descreve a sessão, que usa os dois lugares.

**Correção exigida:** tirar a sessão das duas listas ou dizer que ela usa os dois lugares (repository ao lado, HTTP em `apps/api/test/`). Outra saída é adotar a forma pedida na 2ª rodada: o teste fica ao lado do módulo ou em `apps/api/test/`, e os de mais de um módulo e o `arquitetura.test.ts` ficam em `apps/api/test/`. A regra "Teste novo vai para onde o módulo já guarda os seus" (`:376`) pode ficar.

## Recomendações

- `guia:370`: "e os dois sobem a API inteira com o `subirApi`" lê-se como "todo teste dos dois lugares sobe a API", e a linha 374 diz o contrário. Também em `apps/api/test/` há teste sem `subirApi` (`convite.int.test.ts`, `mfa.int.test.ts`, `erro.int.test.ts`, `troca-de-escola.int.test.ts`, entre outros). Melhor: "nos dois há teste que sobe a API com o `subirApi`".
- `guia:215`: "na turma da linha" não cobre o material, que é `turma_vinculada` sem turma. O `MaterialRepository.#noAlcance` (`apps/api/src/material/material.repository.ts:104-122`) confere só o vínculo confirmado na disciplina do material, em qualquer turma do ano em curso. Vale uma linha para a linha que tem disciplina e não tem turma.
- O critério da 2ª rodada para o teste de mais de um módulo (`virada-do-ano`, `ciclo-de-vida`, que vão em `apps/api/test/`) não entrou no texto. Não é falso, mas ajuda quem escreve o primeiro teste de um fluxo que cruza módulos.

Arquivos revisados:
- `/home/joaquimdp/Documentos/git/Educa.ia/.processo/reengenharia/guia/guia-do-desenvolvedor.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/.processo/reengenharia/guia/REVISAO.md`

## Diagnóstico do Arquiteto: o texto exato (duas reprovações seguidas do mesmo revisor)

Nos dois pontos, a frase central já está certa. O que reprova é uma frase de cada um, que o código desmente. Troque os
trechos abaixo exatamente como estão, sem reescrever o que fica em volta. A 4ª rodada confere só estas duas trocas.

**1. `guia-do-desenvolvedor.md`, §5.1, passo 5.** Troque:

```
     - **Linha sem disciplina** (a própria turma e os alunos dela): basta o vínculo na turma, em qualquer disciplina.
       Veja o `#comVinculoDoProfessor` de `apps/api/src/estrutura/turma.repository.ts`, que também trata o ano
       encerrado.
     - Vínculo pendente, contestado ou encerrado não dá alcance.
```

por:

```
     - **Linha sem disciplina** (a própria turma e os alunos dela): basta o vínculo na turma, em qualquer disciplina.
       Veja o `#comVinculoDoProfessor` de `apps/api/src/estrutura/turma.repository.ts`.
     - **Linha com disciplina e sem turma** (o material): basta o vínculo confirmado naquela disciplina, em qualquer
       turma do ano em curso (`#noAlcance` de `apps/api/src/material/material.repository.ts`).
     - No ano em curso, vínculo pendente, contestado ou encerrado não dá alcance. Na leitura de um ano encerrado, a
       turma aceita também o vínculo encerrado pela virada (`fim_do_ano`) que tinha sido confirmado e não foi
       contestado (`#confirmadoAteOFimDoAno`, no mesmo arquivo).
```

**2. `guia-do-desenvolvedor.md`, o mapa da §4 e a seção "Onde fica a integração da API".** No mapa, troque:

```
apps/api/test/                 testes de integração dos módulos mais antigos (estrutura, sessão, operação...) e os
                               de arquitetura; os módulos novos têm os seus *.int.test.ts ao lado do código
```

por:

```
apps/api/test/                 testes de integração que cruzam módulos, os de arquitetura e os HTTP de vários
                               módulos; muitos módulos também têm *.int.test.ts ao lado do código
```

E troque o bloco que começa em `**Onde fica a integração da API.**` e vai até antes de `Teste novo vai para onde o
módulo já guarda os seus.` por:

```
**Onde fica a integração da API.** Em dois lugares, e nos dois há teste que sobe a API com o `subirApi`:
- **Ao lado do módulo** (`apps/api/src/<modulo>/x.int.test.ts`): o do service e do repository, e muitas vezes também
  o HTTP. Por exemplo, `atividade/atividade-isolamento.int.test.ts` e `tutor/tutor.int.test.ts` sobem a API, e
  `sessao/convite.repository.int.test.ts` testa o repository sem HTTP.
- **`apps/api/test/`:** o que cruza mais de um módulo (`virada-do-ano`, `ciclo-de-vida`), o `arquitetura.test.ts`, e os
  HTTP de módulos que já os guardavam lá (`sessao-matricula`, `estrutura`). A sessão usa os dois lugares.
```

A linha `Teste novo vai para onde o módulo já guarda os seus.` fica.

# 4ª rodada — revisor-geral (22/10, pelo Arquiteto): APROVADO

A 95.0 está aprovada como texto. A publicação continua depois das tarefas de pasta e da 14.0 a 17.0. Antes dela, o Arquiteto confere a lista "Conferir depois das pastas" da 1ª e da 2ª rodada, aplica as duas recomendações abaixo e põe a linha no `README.md`.

**VEREDITO: APROVADO**

- **Escopo:** respeitado. Só conferi as duas trocas, como pedido.
- **Aderência à Tech Spec:** não se aplica. É revisão de documento, e as frases foram conferidas contra o código.
- **Portão local:** não se aplica. A rodada não tem código e o escopo pedido não inclui carimbo.
- **Bloqueantes:** nenhum. Nenhuma frase das duas trocas é desmentida pelo código.

**Troca 1, §5.1, passo 5: resolvido.**

O texto em `/home/joaquimdp/Documentos/git/Educa.ia/.processo/reengenharia/guia/guia-do-desenvolvedor.md:218-224` é idêntico ao do diagnóstico (`REVISAO.md:261-269`). A linha de disciplina, nas linhas 216-217, ficou como estava.

Conferência no código (caminhos relativos ao checkout `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia`):
- **Linha sem disciplina.** `apps/api/src/estrutura/turma.repository.ts:218-234`: o `#comVinculoDoProfessor` amarra escola, ano e turma da própria turma, mais usuário do contexto e papel `professor`, sem nenhuma condição de disciplina. Confere com "basta o vínculo na turma, em qualquer disciplina".
- **Linha com disciplina e sem turma.** `apps/api/src/material/material.repository.ts:105-124`: o `#noAlcance` usa o `anoLetivoId` da sessão, que é o ano `em_curso` (`packages/nucleo/src/identidade/sessao.repository.ts:54,62`). Sem ano em curso, devolve `false`. Exige `estado = 'confirmado'` e `disciplinaId = material.disciplinaId`, sem condição de turma. Confere.
- **No ano em curso, só o confirmado dá alcance.** Nos três lugares, o ano em curso exige `confirmado`: `turma.repository.ts:231` e `267`, `material.repository.ts:119` e `apps/api/src/assistente/turma-do-professor.repository.ts:44`. Os estados possíveis são `pendente`, `confirmado`, `contestado` e `encerrado` (`packages/nucleo/src/db/schema/vinculo.ts:67`). Pendente, contestado e encerrado ficam de fora. Confere.
- **Ano encerrado.** `turma.repository.ts:243-248`: o `#confirmadoAteOFimDoAno` aceita `confirmado`, ou `encerrado` com `motivoEncerramento = 'fim_do_ano'`, `decididoEm` preenchido (já tinha sido confirmado) e `contestacao` nula (não foi contestado). Ele é aplicado quando há `anoEncerrado` (linhas 231 e 267). Está "no mesmo arquivo" do `#comVinculoDoProfessor`. Confere.

**Troca 2, mapa da §4 e "Onde fica a integração da API": resolvido.**

O texto em `guia-do-desenvolvedor.md:145-146` e `373-378` é idêntico a `REVISAO.md:281-282` e `289-295`. A linha "Teste novo vai para onde o módulo já guarda os seus." continua em `:380`.

Conferência no código:
- `apps/api/src/atividade/atividade-isolamento.int.test.ts` existe e sobe a API: importa `subirApi` na linha 6 e chama na 69.
- `apps/api/src/tutor/tutor.int.test.ts` existe e sobe a API: `subirApi` e `chamar` nas linhas 7 e 76-77.
- `apps/api/src/sessao/convite.repository.int.test.ts` existe e não tem HTTP: zero ocorrências de `subirApi`, `chamar`, `fetch` ou `NestFactory`. Ele usa `ConviteRepository` e `BancadaDeSessoes` direto (linhas 5-6).
- Em `apps/api/test/` existem os quatro citados, e todos sobem a API (`subirApi`):
  - `virada-do-ano.int.test.ts` cruza módulos: importa `../src/estrutura/ano-letivo.repository.js`, `vinculo.repository.js` e a sala de teste.
  - `ciclo-de-vida.int.test.ts` cruza módulos: importa `../src/sessao/*` e `@educa/nucleo/ciclo-de-vida`.
  - `sessao-matricula.int.test.ts` e `estrutura.int.test.ts` são HTTP.
- `apps/api/test/arquitetura.test.ts` existe.
- "A sessão usa os dois lugares": há 9 `*.int.test.ts` em `apps/api/src/sessao/`, e `sessao-matricula`, `sessao-externa` e outros estão em `apps/api/test/`. Confere.
- "Nos dois há teste que sobe a API": dos dois lados há exemplos com `subirApi`. Confere.

**Recomendações (não bloqueiam):**
1. Mapa da §4, linha 145. `apps/api/test/` também tem integração que não sobe a API e não é de arquitetura nem claramente de vários módulos: `convite.int.test.ts`, `mfa.int.test.ts`, `saude.int.test.ts`, `sessao-guarda.int.test.ts`, `erro.int.test.ts`, entre outros, todos sem `subirApi`. A frase não é falsa, porque não se diz exaustiva, mas quem chega pode ler o diretório como "só HTTP e cruzamento". Um "entre outros" resolveria.
2. §5.1, linha 221. "Em qualquer turma do ano em curso" descreve bem o efeito, mas o `#noAlcance` (`material.repository.ts:113-121`) simplesmente não olha `turmaId`. Dizer "o vínculo confirmado naquela disciplina no ano em curso, sem olhar a turma" ficaria mais perto do código.

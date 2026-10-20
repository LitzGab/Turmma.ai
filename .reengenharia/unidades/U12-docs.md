# U12 — A documentação técnica contra o código

Método: li cada documento e conferi as afirmações verificáveis contra o código (grep/leitura). Marcas: **[código]** conferido com arquivo:linha; **[doc]** dito em doc, não conferido; **[hipótese]** suspeita. Nenhum arquivo do repositório foi alterado.

## 1. Finalidade e limites

A unidade é o conjunto de documentos que devia permitir a um humano novo entender e mudar o sistema sem a IA que o criou: 13 arquivos, 8.265 linhas (README 318, ROADMAP 769, TODO 1.538, arquitetura 152, modelo-de-dados 762, agentes 213, ingestao 74, infra 455, runbook 926, interface 1.895, mvp-contratos 277, mvp-rapido 555, glossario 331). Fora: decisões, LGPD, regulação, negócio, AIA (lidos só para conferir afirmação técnica).

Achado estrutural: **são três gêneros misturados** — (a) desenho-alvo (arquitetura, ingestao, agentes, partes de infra/modelo-de-dados), (b) registro do que foi feito, com tarefa e data (modelo-de-dados F3, runbook, mvp-rapido, TODO), (c) referência viva (mvp-contratos, runbook, README comandos). O leitor não distingue "existe" de "é o plano" sem abrir o código. O único doc que se declara histórico é o `mvp-rapido.md` (:13).

**Nenhum doc responde "onde implemento cada tipo de mudança" nem "como adiciono um módulo novo".** [código/doc] `grep` por "novo módulo/como adicionar" em `docs/arquitetura.md`, README, `mvp-contratos.md` e `.claude/rules/*` só acha a exigência de teste de isolamento (`10-multitenancy.md:60`, `arquitetura.md:42`). Não existe README em `apps/*` nem em `packages/*` (única exceção: `packages/nucleo/src/ia/README.md`, bom e fiel ao código; ver seção 11). O procedimento real (módulo Nest + `@Permite` + célula na `MATRIZ` em `packages/shared/src/permissao/matriz.ts` + schema zod em `packages/shared` + migration + entrada em `CLASSIFICACAO_DAS_TABELAS` + teste de isolamento) só se reconstrói lendo `arquitetura.test.ts` (1.403 linhas) e `ConferenciaDasPermissoes` [código: `apps/api/src/app.module.ts:136-143`, `apps/api/test/arquitetura.test.ts:1191`].

## 2. Pontos de entrada (a documentação)

| Documento | Linhas | Gênero | Veredito |
|---|---|---|---|
| README.md | 318 | comandos + processo | comandos corretos; 3 trechos desatualizados (seção 11) |
| ROADMAP.md | 769 | plano/estado | estrutura boa; estados de F4/F5 não refletem o que o MVP já fez |
| TODO.md | 1.538 | dívida/pendência | 337 itens abertos, 46 feitos; linhas de até 2.866 caracteres; título não descreve o conteúdo |
| docs/arquitetura.md | 152 | desenho-alvo | **o mais defasado**: lista de módulos, filas e adaptadores não existem |
| docs/modelo-de-dados.md | 762 | desenho + changelog | tabelas implementadas conferem; mistura com 8 tabelas-alvo inexistentes |
| docs/agentes.md | 213 | produto + desenho | funções e autonomia conferem com `FUNCOES`; estados e gatilhos divergem |
| docs/ingestao.md | 74 | desenho-alvo | descreve pipeline que não existe; não diz o que o MVP faz |
| docs/infra.md | 455 | desenho + medida | números verificáveis conferem (pools, vagas, timeouts, topologia) |
| docs/runbook.md | 926 | operação | 13 alertas = 13 regras; 5 entradas "a preencher"; 1 referência quebrada |
| docs/interface.md | 1.895 | produto + design + tokens | tokens/peças conferem (testes leem o doc); referências cruzadas do código estão quebradas |
| docs/mvp-contratos.md | 277 | referência | **o melhor doc técnico**: 42 rotas = 42 no código |
| docs/mvp-rapido.md | 555 | histórico | declarado histórico; 555 linhas de estado já concluído |
| docs/glossario.md | 331 | vocabulário | vocabulário do domínio limpo; faltam 15+ termos do que foi construído |

## 3. Fluxos e regras de negócio (o que os docs afirmam como regra técnica, e onde está garantida)

- Regra 10 (tenant): os docs dizem que a fronteira de resolução de tenant é `ResolucaoDeTenantRepository` e que só `sessao` a importa. **[código]** garantido por teste de arquitetura (`apps/api/test/arquitetura.test.ts:58-107`), não por convenção. Também por teste: conta global só por `sessao` e ciclo-de-vida (`:108`), `PainelRepository` só pelo `painel.service` (`:172`), seis tabelas do operador (`:314`), suboperador (`:392`), incidente (`:498`), tabela sem `escola_id` na lista do doc (`:997`), classificação de retenção (`:1191`).
- Esses testes **leem os documentos**: `arquitetura.test.ts:997` lê as exceções de `modelo-de-dados.md` (regras transversais); `contraste.test.ts:35` e `estilos.test.ts:65` leem a 9.1/9.10 de `interface.md`; `alerta-tem-runbook.test.ts` lê `runbook.md`. Resultado: o doc é parte do contrato executável, e editar o doc sem entender isso quebra a esteira. Isso é bom (trava por máquina), mas não está dito em lugar nenhum.
- Regra 70 (nota com autor humano, D56): descrita em `mvp-contratos.md` §5 itens 7-8 como gatilhos de banco (lote só `aprovada` com `validacao_do_lote`; versão adaptada só aplicada com entrega aprovada). **[código]** confirmado: `0023_mvp_restricoes.sql` tem 5 usos de `exigir_equipe_da_escola`; coluna `destaque_aberto_por` em `packages/nucleo/src/db/schema/correcao.ts:20-22`.

## 4. Dependências

Os docs dependem uns dos outros em cadeia circular de remissões ("ver Tech Spec F3 seção 7c", "ver `docs/modelo-de-dados.md`, Operação Turmma", "ver TODO.md"). Dependências doc→código reais e verificáveis: `modelo-de-dados.md` → `packages/shared/src/permissao/matriz.ts`, `time/funcoes.ts`, `CLASSIFICACAO_DAS_TABELAS`; `mvp-contratos.md` → `packages/shared/src/{material,time,assistente,atividade,tutor,governanca}` (todos existem). Dependem de `tasks/prd-*/techspec.md` (existem 12 pastas; `prd-fundacao-tecnica` com 16 tarefas) — i.e. o desenho "completo" mora fora de `docs/`, em specs por funcionalidade, não indexadas por `docs/`.

## 5. Dados — tabelas citadas × existentes

[código] `packages/nucleo/src/db/schema/*.ts` define **54 tabelas** e 37 migrations (0000–0036).

- Documentadas e existentes (conferi colunas/checks por amostragem): `rede`, `escola` (`inatividade*Min`, `criada_em`), `ano_letivo` (único parcial `em_curso`, `ano-letivo.ts:36`), `turma` (turno), `disciplina` (área BNCC), `pedido_titular` (índice `pedido_titular_agendado_unico`, `pedido-titular.ts:85`), `usuario.eliminacao_agendada_em`, `trecho` (tsvector gerado, `trecho.ts:6-14`), `correcao` (`por_habilidade` jsonb), `consumo_ia` (`provedor`, `custo_micros`), `execucao_agente.anonimizada_em`, `resposta_atividade` (1..20/0..3), `configuracao_operacional_escola.tutor_trocas_por_dia/mes`, `btree_gin` (migration 0022).
- **Citadas e inexistentes** (desenho-alvo sem marcador de "ainda não existe", exceto onde indicado): `Capitulo`, `HabilidadeBNCC` (o catálogo é código em `packages/shared/src/assistente/habilidades.ts`), `Questao`, `Avaliacao`, `ItemAvaliacao`, `Aplicacao`, `Nota`, `FolhaResposta`, `Captura`, `Agente`, `OrcamentoIa`, `PacoteTutor`, `PoliticaTutor`, `BuscaEscola`, `FonteAprovada`, `SessaoTutor`, `SinalAluno`, `SalaAoVivo`, `Evento`, `Notificacao`, `Contrato`, `IndicadorProfessor/Turma`, `GradeHoraria/TempoAula/Alocacao/Aula`, `Responsavel`, `AdaptacaoAluno`. O bloco "MVP de apresentação" (`modelo-de-dados.md:524`) lista o que existe de fato e diz o que difere; o resto do doc segue lendo-se como se existisse.
- **Existentes e pouco ou nada citadas**: `uso_infra_diario`, `job_registro` (citada só em contexto), `registro_acesso`, `conta_externa`, `suspensao_de_funcao`, `validacao_do_lote`, `retencao_escola`, `expurgo_execucao`, `arquivo_titular` — as F3 estão bem cobertas por prosa; mas não há **índice único das 54 tabelas** (nome, módulo dono, escopo, retenção) no doc. A fonte é `CLASSIFICACAO_DAS_TABELAS` em código.

## 6. Contratos

`mvp-contratos.md` é o único doc que é de fato contrato: tabela de rota × schema zod × célula da `MATRIZ` × auditoria. **[código]** Extraí 42 `METHOD /rota` do doc e os comparei com os `@Get/@Post/...` de 18 controllers do MVP: **42 = 42, sem divergência**. As demais ~35 rotas (sessão, estrutura, privacidade, operação, sala, sistema) **não têm doc de contrato** além do código e do `README`/tech specs. Padrão de erro/códigos: citados em `mvp-contratos.md:34-38` (16 códigos); [hipótese] confirmar contra `packages/shared/src/erros/codigo-de-erro.ts` (não conferi cada um).

## 7. Testes

- Docs são testados indiretamente: arquitetura (modelo-de-dados), contraste/tokens (interface), runbook×alertas (`tools/guardas/alerta-tem-runbook.test.ts`), compose×infra (`tools/ci/compose.test.ts`, `ambiente.test.ts` conferem `UV_THREADPOOL_SIZE` e `dns_opt` como o doc `infra.md` prescreve [código: `infra/compose.yml:144-147`, `.env.example:9`]).
- **Sem teste que prove doc×código** para: arquitetura.md (lista de módulos/filas), agentes.md (estados), ingestao.md, README (comandos, portas), ROADMAP (estado vs spec), mvp-contratos (rotas — a igualdade 42=42 é acidental, não travada).

## 8. Resiliência e escala (sinais, nos docs)

`infra.md` é o doc mais fiel ao código: pools 50/30/10, vagas 5/5/2, `statement_timeout` 2 s [código: `.env.example:45-46,183-187`, `packages/nucleo/src/configuracao/configuracao-operacional.test.ts:18`], dois Redis, dois despachantes, `vaga.lua` ZSET [código: `packages/nucleo/src/fila/vaga.lua:3`], 13 regras de alerta. Mas **o doc de arquitetura omite a dívida mais importante de resiliência**: a execução de IA e a extração de PDF rodam **no processo da API**, em memória (`FilaDeExtracao`, `ExecutorDeAgente`), com `TODO(fila)` em 4 lugares [código: `apps/api/src/material/fila-de-extracao.ts:42`, `packages/nucleo/src/ia/executor.ts:94`, `execucao-agente.ts:12`, `ia/README.md:55`]. A exceção está só em `mvp-rapido.md` §4 e no README da IA, enquanto `arquitetura.md:84` e `ingestao.md` (req. 6) afirmam o contrário.

## 9. Suspeitos de código morto (doc)

- `docs/mvp-rapido.md` seções 5, 7, 8, 9 (≈300 linhas): worktrees `../Educa.ia-mvp-<pacote>`, branches `mvp/*`, "o que falta executar" — todos concluídos em 05/10; o próprio doc diz "este documento é histórico". Procurei referências: `CLAUDE.md` ainda aponta para ele como composição da A2–A5; `docs/mvp-contratos.md:270` o cita. [hipótese] reduzir a ~60 linhas (roteiro + decisões de atalho §4) não perde nada.
- `docs/modelo-de-dados.md:270-300` "Ainda não existe — F2" mistura o que não existe (`Responsavel`) com prosa do convite de professor que já existe.
- TODO.md: os 46 itens `[x]` ainda ocupam espaço (ex.: `:572-620`).

## 10. Duplicação e inconsistência

Repete CLAUDE.md/regras (candidatos a cortar/ponteirar):

| Trecho | Repete |
|---|---|
| `arquitetura.md:3-10` Princípios; `:24-36` Camadas; `:38-42` Multi-tenant; `:102-106` Carga; `:148-153` Observabilidade | regras 00, 10, 80, 20 (quase literal) |
| `arquitetura.md:117-135` Camada de IA (perfis, orçamento, guardrails) | regra 30 + D13/D14/D38/D39 |
| `agentes.md:29-50` Regra estrutural e Nome; `:164-180` "O que nenhum agente faz" | regra 70 itens 1-9 + D17/D32/D45/D55/D57 |
| `agentes.md:182-190`, README "Os portões de qualidade" | CLAUDE.md "Skills/Revisores", regras |
| `infra.md` §5.1-5.4, §6.1 | regra 80 itens 1-6 (a regra 80 diz que "o desenho completo está em infra.md": a duplicação é de intenção) |
| `modelo-de-dados.md:729-762` Regras transversais | regras 10 e 20 (itens 1,2,5,7,8) |
| `README.md` "Como o fluxo funciona" e "Um exemplo de ponta a ponta" (~120 linhas) | CLAUDE.md "Skills", `.claude/skills/seguir/protocolo.md` |

Arquivos grandes demais: `interface.md` 1.895 (a Parte B inclui CSS de tokens copiado do código, 9.10, com teste que o sincroniza); `TODO.md` 1.538; `runbook.md` 926; `modelo-de-dados.md` 762 (os parágrafos F3 têm >20 linhas corridas com nomes de tarefa).

## 11. Doc × código (o centro)

### 11.1 Contradições doc × código (confirmadas)

| # | O doc diz | O código mostra |
|---|---|---|
| 1 | `arquitetura.md:34-36` módulos: `escola, serie, turma, disciplina, usuario, convite, ingestao, material, questao, avaliacao, correcao, nota, tutor, sala, agente, governanca, notificacao, ia, auditoria, titular` | Módulos Nest reais [código `apps/api/src/app.module.ts:97-124`]: Estrutura, Professores, Material, Ia, Assistente, Artefato, Entrega, Atividade, Tutor, Governanca, Privacidade, Sala, Operacao, Sistema (+ Sessao, Banco, Limite, Uso). **Inexistentes**: ingestao, questao, avaliacao, nota, agente, notificacao. **Existentes e não citados**: artefato, assistente, atividade, entrega, estrutura, operacao, ops, privacidade, professores, sessao, sistema |
| 2 | `arquitetura.md:86-87` filas `ingestao, agentes, correcao, notificacao, expurgo, exportacao-titular` | Três filas: `['interativa','normal','lote']` [código `packages/shared/src/sistema/jobs.ts:6`]. Jobs reais no worker: 4 de rotina `sistema.*`, `retencao.expurgar-escola`, `titular.eliminar`, `titular.montar-arquivo`, sintético [código `apps/worker/src/agendamentos.ts:34-37`, `processadores/`]. O trecho seguinte (F3) do próprio doc descreve os nomes corretos — o doc se contradiz |
| 3 | `arquitetura.md:17` worker faz "agentes, ingestão, correção, notificação"; `ingestao.md` req. 6 "Ingestão nunca roda em request"; `agentes.md` "Roda em fila, nunca dentro de request" | O worker não tem nenhum processador de agente, ingestão ou correção; IA e extração rodam no processo da API (seção 8) |
| 4 | `arquitetura.md:12-20` diagrama de apps | Faltam `apps/despachante` (existe e é peça central da fila, `apps/despachante/src/`) e `packages/nucleo` (o pacote com mais código de domínio-infra) |
| 5 | `arquitetura.md:121-123` `OllamaAdapter` e `OpenAICompatAdapter` | Só `adaptador-falso.ts` e `adaptador-openai-compat.ts` em `packages/nucleo/src/ia/`; "Ollama" aparece apenas como valor inválido em `config-ia.test.ts:209`. CLAUDE.md (D13) repete "adaptadores Ollama" |
| 6 | `arquitetura.md:131` orçamento "por aluno, por turma e por escola, com corte suave e aviso ao coordenador" | `apps/api/src/ia/orcamento.repository.ts:30`: só freio diário e pacote mensal do Tutor; "fora do Tutor, a consulta permite" |
| 7 | `arquitetura.md:108-114` realtime com "sala por turma, autorizada pelo vínculo" | Único namespace `/sistema`, sala por escola; modo sala é F10 e não existe [código `packages/shared/src/sistema/realtime.ts:12`, `apps/realtime/src/sistema.gateway.ts:20-21`]; o doc não marca como futuro |
| 8 | `agentes.md:202-213` estados `executado, aguardando aprovação, aprovado, rejeitado` | Execução: `pendente, rodando, concluida, falhou`; entrega: `pendente, aprovada, rejeitada` [código `mvp-contratos.md:182-186` e `schema/execucao-agente.ts`]; `modelo-de-dados.md:567` já usa os reais — dois docs discordam |
| 9 | `agentes.md:80` Analista dispara "toda segunda de manhã, e por evento" | Só `POST /v1/analista/gerar` por pedido; worker não agenda nada do Analista [código `apps/api/src/governanca/analista.controller.ts:23`, `funcoes.ts` "quando a coordenação pede"; `agendamentos.ts:34-37`]. Idem "Tutor · sinais … resumo diário" (nenhum job) |
| 10 | `agentes.md:77` função "Seu dia e sua semana"; Mensageiro | Não existe em `FUNCOES` (6 funções) [código `packages/shared/src/time/funcoes.ts:34-83`]; doc diz "depende de F2/F8" mas a tabela não marca como não construída |
| 11 | `ingestao.md:11-20` pipeline com classificação BNCC, "indexação vetorial", versionamento, reprocessamento | MVP: texto por página, `tsvector` português, **sem embedding**, hash único `(escola, sha256)` sem versões nem reprocesso [código `trecho.ts:6-14`, `mvp-contratos.md:182`]. `infra.md:150` e `:454` falam em pgvector/busca vetorial; a imagem do compose é pgvector (`infra/compose.yml:8`) mas nenhuma migration usa `vector` [código: grep em `packages/nucleo/drizzle`] |
| 12 | `README.md:88` "A esteira roda em todo push no `main`" | `.github/workflows/ci.yml:10-12`: `develop, release, main, spec/**, correcao/**`; CLAUDE.md e regra 40 já dizem o certo |
| 13 | `README.md:44-46` "as três regras de alerta" | 13 regras em `infra/grafana/alertas/` (13 arquivos) |
| 14 | `README.md` tabela de comandos | Faltam `ops:operador`, `ops:uso`, `ops:revogar-acessos-sala`, `carga:login`, `carga:sala`, `demonstracao:material` (existem em `package.json:23-45`). O runbook (`:700` seção "Operador não entra") manda ver "README, Rodando local" para `ops:uso` e `ops:operador` — **referência quebrada** |
| 15 | `docs/interface.md` seções citadas em código | Código cita 11.3 (14×), 11.6 (3×), 11.7 (2×); o doc só tem 11.1-11.5 e a 11.3 hoje é "A casca pública" [código `apps/web/src/caminhos.ts:140`, `areas/coordenacao/Agentes.tsx:46`, `areas/aluno/Tutor.tsx:188`; doc `:1591-1740`] |
| 16 | `infra.md:454-458` "Em aberto: solução para concorrência por escola nas filas (§5.3)" | §5.3 do mesmo doc já descreve a solução (limitador próprio, `vaga.lua`) — item morto |
| 17 | `modelo-de-dados.md:11-20` `Auditoria … escola*` | `schema/auditoria.ts:36` `escolaId` opcional (há check `auditoria_escola_ou_operacao_global`) |
| 18 | `modelo-de-dados.md:85-100` e `arquitetura.md:38-56` descrevem `ResolucaoDeTenantRepository` como fronteira estreita com 2-4 consultas | Tem **25 métodos `@SemEscopo`** em 493 linhas, incluindo MFA, criação de conta, convite, falha de login [código `apps/api/src/sessao/resolucao-de-tenant.repository.ts`]. A regra 10 item 9 diz que a terceira exceção no mesmo módulo indica desenho errado. Há ainda `@SemEscopo` não citados nos docs: `ia/execucao.repository.ts:65`, `material.repository.ts:321`, `worker/storage/medidor-de-storage.ts`, `despacho.repository.ts` (5) |

### 11.2 Correto (conferido)

`infra.md` §3.1/§4/§5.3 (pools, vagas, timeouts, dns_opt, UV_THREADPOOL_SIZE=16, dois Redis, `infra/k6/justica-entre-escolas.js`); `runbook.md` jobs e horários (`agendamentos.ts:34-37` = 1h/2h/3h30/4h30) e 13 entradas = 13 regras; `arquitetura.md` ordem das 4 guardas globais, `SessaoModule` global (`sessao.module.ts:297`), `rl:ip:op`, `ConferenciaDasPermissoes` no boot, `PainelRepository` com 3 `@SemEscopo`; `agentes.md` autonomia por função e `suspensao_de_funcao`; `mvp-contratos.md` 42 rotas, tabelas, gatilhos, funções `exigir_equipe_da_escola`; `modelo-de-dados.md` colunas e índices amostrados; `README.md` serviços do compose (api-1/2, realtime-1/2, despachante-1/2, worker-*-1/2, borda, observabilidade), portas (`.env.example`), 7 fatias do e2e (`ci.yml:99`), `.nvmrc` 22.23.2; `packages/nucleo/src/ia/README.md` fiel (7 tarefas em `tarefas/`).

### 11.3 Só confirmável no código / não conferi

Texto narrativo F3 de `modelo-de-dados.md` (parágrafos 100+ linhas sobre eliminação, expurgo, anonimização): amostrei nomes de índices, mas não cada afirmação de ordem de travas. Valores de `mvp-rapido.md` §Estado (contagem de arquivos/testes, hashes) são históricos.

### 11.4 Glossário × nomes no código

Vocabulário em português íntegro, sem mistura inglês (grep por `enrollment|student|teacher|grade...` em schema e API: 0 hits). Divergências de nome: glossário define `Avaliação/Item/Aplicação/Resposta/Correção/Nota`; o código tem `atividade_aplicada/tentativa_atividade/resposta_atividade/correcao(lote)` e **nenhum `nota/avaliacao`** — o glossário não diz que essas entidades ainda não existem. **Termos sem verbete** (0 hits no glossário): atividade aplicada, tentativa, destaque, validação do lote, suspensão de função, execução, chave de envio, job/`job_registro`, despachante, suboperador, incidente, retenção/expurgo, janela letiva. `mvp-contratos.md:276` admite a lacuna. Colisão de termo: "sala" = acesso da turma por link/código (`apps/api/src/sala`, `SalaModule`) **e** "modo sala" ao vivo (F10, realtime): o glossário só define o segundo.

### 11.5 Responde "onde implemento" / "como adiciono módulo"?

Não (seção 1). `arquitetura.md` nomeia as camadas (controller/service/repository/dto) mas: o `dto` real não é pasta, é schema zod em `@educa/shared` (`esquemaResposta*`, citado em 59 arquivos da API [código]; `find` por pastas `dto*`: 0); não explica o papel de `packages/nucleo` vs `apps/api` vs `packages/shared`, nem `@Permite`/`MATRIZ`, nem o fluxo migration→`CLASSIFICACAO_DAS_TABELAS`→doc de dados. Quem cumpre melhor o papel é `ia/README.md` ("Na API: como um pacote de domínio dispara uma tarefa").

## 12. Tamanho, risco e dependências

8.265 linhas em 13 arquivos. Risco de mexer: **médio-alto** em `modelo-de-dados.md`, `interface.md` (9.1, 9.10) e `runbook.md` — testes leem o texto e quebram a esteira; **baixo** em `arquitetura.md`, `ingestao.md`, `agentes.md`, `README.md`, `mvp-rapido.md`, `TODO.md`, `ROADMAP.md`. Depende de todas as outras unidades (cada afirmação). Quem depende dela: o processo (`tools/processo/estado.ts` lê ROADMAP; hooks leem CLAUDE.md), e a reengenharia (Etapa 9: documentação oficial).

Para a reengenharia: cada doc precisa de um **rótulo de gênero** (referência viva, desenho-alvo, histórico) e os de referência viva devem ser testados contra o código (rotas, módulos, filas, tabelas, comandos npm, alertas) como já se faz com tokens e alertas.

## 13. Os 5 achados mais importantes

1. `arquitetura.md` descreve um sistema que não existe (20 módulos, seis filas nomeadas, worker com agentes/ingestão/correção, OllamaAdapter): 6 módulos inexistentes e 11 reais não citados; filas reais são `interativa/normal/lote`.
2. A exceção arquitetural central — IA e extração de PDF rodando em memória no processo da API (`TODO(fila)` ×4) — só é dita em `mvp-rapido.md`/README da IA, enquanto arquitetura, ingestão e agentes afirmam "sempre em fila".
3. Nenhum doc responde "onde implemento X" nem "como adiciono um módulo": o procedimento só se reconstrói lendo `arquitetura.test.ts` (1.403 linhas) e o código; `apps/*` e `packages/*` não têm README.
4. Só `mvp-contratos.md` (42 rotas = 42) e `infra.md` são fiéis ao código e verificáveis; as ~35 rotas não-MVP e as 54 tabelas não têm doc de contrato/índice; `modelo-de-dados.md` mistura 8+ tabelas-alvo inexistentes com changelog de tarefas (762 linhas).
5. Drift pequeno mas medível e sem trava: README (esteira "no main", "três alertas", comandos `ops:*` faltando — com o runbook apontando para eles), 3 seções de `interface.md` (11.3/11.6/11.7) citadas no código e inexistentes, `ResolucaoDeTenantRepository` com 25 `@SemEscopo` descrito como fronteira estreita, glossário sem 15+ termos do que foi construído.

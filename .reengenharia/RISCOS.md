# Riscos

Etapa 3, pelo Arquiteto em 20/10/2026. São dois tipos: **riscos do sistema** (o que pode quebrar em produção ou com
a escola usando) e **riscos da reengenharia** (o que a própria missão pode quebrar). Probabilidade e impacto em
alta, média ou baixa. As três regras que não se negociam pesam no impacto: vazamento entre escolas, dado de menor e
nota sem humano. Marcas: **[código]** · **[doc]** · **[hipótese]**. A priorização final por impacto × risco × esforço
é da Etapa 4, com a linha de base medida.

## 1. Riscos do sistema

| # | Risco | Prob. | Impacto | Evidência | Mitigação que já existe | Onde resolver |
|---|---|---|---|---|---|---|
| S1 | **IA e extração de PDF no processo da API**, com fila, vagas e bytes em memória: reinício perde trabalho; com 2 instâncias o limite por escola vale por processo; sem prioridade, o Tutor em sala disputa CPU com a extração e o Analista | alta, com mais de uma escola | alto (regra 80: o horário de aula) | `packages/nucleo/src/ia/executor.ts:94-106`, `apps/api/src/material/fila-de-extracao.ts:42` [código: U03, U05] | varredura marca `EXECUCAO_INTERROMPIDA` após 2 prazos; teto de 2 extrações por processo; dívida D77 declarada | P1 (Etapa 6) |
| S2 | **Sem degradação de IA** (fila curta, modelo menor, reserva), retry só 1 vez em 429/5xx, sem disjuntor: o provedor recusando no meio da aula vira erro para o aluno | média | alto (regra 80.4) | `adaptador-openai-compat.ts:144-172`, `provedor.ts:36` [código: U03 §8] | código `IA_INDISPONIVEL` com mensagem do catálogo | Etapa 6; cockatiel é candidato (R-pesquisa) |
| S3 | **Isolamento entre escolas no código depende de disciplina**: repository novo sem `exigirEscolaDoContexto()` compila e passa; as travas de arquitetura são módulo a módulo | baixa por linha, alta com o volume da reengenharia | **crítico** (regra 10) | 214 chamadas; `@SemEscopo` só registra metadado; `arquitetura.test.ts` por `describe` [código: U02 §3, U10 §11] | FKs compostas `(escola_id, id)` no banco (130); testes de isolamento por módulo; `tenancy-guardian` com veto | trava genérica na 7.6 (dependency-cruiser ou teste por varredura); P5 (RLS) é parada |
| S4 | **Entrada HTTP validada por convenção**: um handler sem esquema aceita campo a mais, inclusive `escolaId` | baixa | alto | 137 handlers, 2 idiomas, nenhuma trava [código: U01, U04] | o escopo vem do contexto, então `escolaId` no corpo é ignorado pelo repository | P2 |
| S5 | **Deploy escalonado quebra a web aberta**: resposta `.strict()` validada no cliente; campo novo vira `ERRO_INTERNO` até recarregar | média, no primeiro deploy com aluno em sala | médio | `cliente.ts:102`, `.strict()` em todo `esquemaResposta*` [código no padrão; efeito: hipótese, U01 §6] | nenhuma | P6 |
| S6 | **Sessão lida do Postgres a cada requisição** (a regra 80.5 diz Redis): carga constante no banco na manhã de segunda | média | médio | `packages/nucleo/src/identidade/guarda-sessao.ts:27-45` [código: U04 §3] | `statement_timeout`; 503 em vez de 401 se o banco cai | medir na linha de base (cenário de carga) antes de decidir |
| S7 | **Job sem contrato de payload e sem fila morta**: produtor e consumidor podem divergir; a falha final some em 7 dias sem alerta | baixa hoje (7 tipos), alta quando a IA entrar na fila | médio | `enfileirador.ts:12`, esquema redeclarado no worker, `expurgar-jobs.ts` [código: U06 §6, §8] | `codigo_falha` tipado; processadores idempotentes | registro tipado de jobs (Etapa 6/7) |
| S8 | **Resposta de prova perdida no cliente**: fila só em memória, F5 com envio pendente perde a escolha; upsert no servidor é "o último vence" sem sequência | baixa | alto (regra 80.6) | `apps/web/src/areas/aluno/respostas.ts:9-10`, `minha-atividade.repository.ts:215` [código: U05 §8, U08 §8] | gravação por item, reenvio ao voltar a rede | Etapa 5 (lente resiliência) |
| S9 | **Regras de conformidade em regex** (D55, D36, recusa do Tutor): ~900 linhas em português, frágeis a paráfrase, testadas por amostras escritas junto das regras (taxa 1,0 circular) | média | alto (regra 70, D57) | `turno-do-tutor.ts:92-440`, `propor-ferramenta.ts` [código: U03 §10] | o gabarito nunca entra na entrada do Tutor (estrutural); `conformidade-reviewer` | P8 |
| S10 | **D62 declarado e não aplicado**: `levaTextoDeAluno` não é lido; nada impede conversa de aluno num provedor fora do Brasil | baixa hoje (sem provedor de produção) | alto quando houver | grep sem leitor de produção [código: U03 §11] | provedor ainda não escolhido (D37) | Etapa 6 |
| S11 | **Orçamento de IA só no Tutor**, em trocas; `custo_micros` nunca preenchido; sem aviso à coordenação | alta | médio (D14, D39: preço) | `orcamento.repository.ts:246-256`, `consumo.repository.ts:314-336` [código: U03 §8] | freio D38 com advisory lock | Etapa 6 |
| S12 | **Janela da trava de avaliação no Tutor**: conferida só no `POST`; se a avaliação abre entre o 202 e a execução (até 150 s), a resposta sai | baixa | médio (regra 30.10) | `tutor.service.ts:171,196-216` [hipótese: U03 §8; confirma com teste] | — | Etapa 5 |
| S13 | **Backup, restauração e rollback só no papel** | alta quando houver escola real | alto | `docs/infra.md` 6.2-6.3; `runbook.md:716-718` vazio [código: U10 §8] | fase local (D31); provedor gerenciado a escolher (D42) | fora da X5: portão do piloto |
| S14 | **Imagem da web roda `vite preview`** | alta se for a produção | médio | `infra/docker/servico.Dockerfile` (estágio `web`) [código: U10 §8] | nenhuma (staging não existe) | Etapa 7 ou staging |
| S15 | **Sino do professor em N+1** (até 12 turmas em série) e coordenação lendo listas inteiras para contar | média com escola grande | médio (regra 80) | `fila-do-professor.ts:311-398`, `fila-da-coordenacao.ts:205-271` [código: U08 §8] | 5 min de frescor, parada no primeiro `LIMITE_EXCEDIDO` | endpoint agregado (Etapa 6/7) |
| S16 | **`chamarApi` sem timeout**: em rede de escola instável a requisição pendura até o navegador desistir | média | baixo | `apps/web/src/api/cliente.ts:77-105` [código: U07 §8] | TanStack com `signal` | Etapa 7 |
| S17 | **Medições por escola sequenciais** a cada 5 min em cada réplica de lote; rodada do despachante cresce com escolas pendentes | baixa até ~10 escolas (D25) | médio depois | `MedicaoPorEscola`, `despachante.ts` [código: U06 §8] | — | registrar; não é da X5 |
| S18 | **Sem telemetria de erro no cliente** | alta | baixo | U07 §8, U08 §8 [código] | — | registrar |
| S19 | **Link do runbook nos alertas aponta para `Educa.ia`** | média | baixo | `tools/guardas/alerta-tem-runbook.ts:21` [hipótese: depende do redirecionamento do GitHub] | — | Etapa 7 |

### Atualização da Etapa 5 (21/10/2026)

O que o diagnóstico confirmou ou acrescentou (`DIAGNOSTICO.md` §2 e §4):

- **S8** cresce: além do upsert "o último vence", a escolha pendente se perde no F5 ou ao fechar a aba, e um envio
  pendurado trava a fila inteira, porque `chamarApi` não tem timeout (U08b-1, U08b-2).
- **S10** e **S12** passam de hipótese a **confirmados** (U03-5, U03-7).
- **S3**: 25 de 71 repositories não chamam `exigirEscolaDoContexto`, quase todos com motivo, e 3 recebem `escolaId` por
  argumento (U10-4, U02-2).

| # | Risco | Prob. | Impacto | Evidência | Mitigação que já existe | Onde resolver |
|---|---|---|---|---|---|---|
| S20 | **O hook do processo falha aberto** quando a carga quebra, e não reconhece `git` em forma não canônica: commit sem revisão e push em branch protegida passariam | baixa | alto (D53, D23) | `hook-revisoes.ts:4-6` (import estático fora do `try`), `settings.json:26-32` [código, U11-2, U11-3] | os agentes usam a forma canônica | N7; o resto na Etapa 9 |
| S21 | **Job preso sem prazo** segura lock, vaga e concorrência para sempre; o stalled só pega réplica morta | média quando a IA entrar na fila | alto | U06-3 [código] | renovação de lock e de vaga | T4 e T9 (`prazoMs` e `AbortSignal`) |
| S22 | **Lacunas na rede determinística de D36 e D55**: a lista de risco à vida não pega "me jogar" nem "melhor sem mim", e a saída da D55 não barra devolutiva qualitativa | média | **crítico** (regra 70, CVV) | `turno-do-tutor.ts:92-98` [código, conferido], U03-4 | o modelo também classifica `assunto_delicado`; o prompt proíbe devolutiva | N11, correção antes da onda 1 |
| S23 | **Falha final de job some em 7 dias sem alerta**, e as rotinas de expurgo (LGPD) podem parar sem ninguém saber | média | alto (regra 20.16) | U02-4, U06-1 [código]; o runbook admite | o estado `falhou` com `codigo_falha` | T5, N1 |
| S24 | **A meta R19 global fecha com a pasta do aluno baixa**: 827 ramos faltam, e a base sozinha não chega | alta | médio | U07-2 [medida, conferida] | — | N4 (piso por pasta) |

## 2. Riscos da reengenharia

| # | Risco | Prob. | Impacto | Por quê | Como reduzir |
|---|---|---|---|---|---|
| M1 | **Quebrar uma invariante que só o banco ou um teste de integração protege** (gatilhos de aprovação, FKs compostas, ordem de travas turma → vínculo, marca de leitura no Redis) | média | crítico | U05 §3, U04 §3: o que garante a regra 70 está em migration e transação, não no tipo | não mexer em migration nem em gatilho na X5 sem tarefa própria com `conformidade-reviewer`; preservar os testes que os provam (regra da missão: teste que protege regra não sai) |
| M2 | **Mover arquivo quebra trava de arquitetura por caminho** (`arquitetura.test.ts:22` cita `apps/api/src/sessao/`; listas fechadas de importadores) | alta | médio | U04 §12, U10 §11 | cada movimento de pasta numa tarefa que atualiza o teste junto; o teste deixa de citar caminho e passa a citar regra (7.6) |
| M3 | **Esteira e e2e longos multiplicam o custo de cada onda** (39,5 min de relógio, 260 min de runner; fila `flock` na máquina) | alta | médio | U09, U10, DESCOBERTA §3 | ondas pequenas; portão da tarefa com os testes que ela alterou; a esteira em todo push sem esperar (D79) |
| M4 | **Editar documento que um teste lê** quebra a esteira sem ninguém entender por quê | média | baixo | CONTRATOS §10 | marcar esses documentos na Etapa 11; no ínterim, a tarefa que mexe em doc roda o teste que o lê |
| M5 | **Mudar o harness no meio da própria missão** (o hook barra todo commit) | média | alto | U11 §12: regex no hook; a Etapa 9 é ⛔ | `.claude/` e `tools/processo/` intocados até a Etapa 9 (RESPOSTAS) |
| M6 | **Contrato HTTP mudado de um lado só** (rota, esquema estrito) | média | médio | CONTRATOS §2 | mudança de contrato em tarefa que mexe em shared, API e web juntos, com e2e da tela |
| M7 | **Remover código "morto" que é usado por DI, script, string ou flag** | média | médio | SUSPEITOS-MORTOS: `ops/*` por `node dist/ops/x.js`, `CicloDaExtracao` por ciclo de vida do Nest, rota sintética por flag | nada se remove sem as quatro buscas de SUSPEITOS-MORTOS §0 e o portão verde |
| M8 | **Banco de teste acumulado mascara ou causa falha** (e2e não limpa; bancada deixa escola, rede e auditoria) | média | baixo | U09 §5 | linha de base com `EDUCA_BANCO_NOVO=1`; classificar falha como preexistente ou introduzida |
| M9 | **Duas linhas mexendo nos mesmos arquivos centrais** (shared, `estrutura/entrada.ts`, `sessao/`) | alta se as ondas não respeitarem a ordem | médio | 600 arquivos dependem de shared | ondas pela ordem de dependência (DESCOBERTA §4); arquivo central numa linha só |
| M10 | **Custo de tokens da missão** (13 subagentes na análise; mais na Etapa 5) | alta | médio | memória "custo de tokens"; RESPOSTAS | Sonnet lê, Opus consolida; relatórios versionados para não reler o código |
| M11 | **Escopo cresce** (a missão toca tudo; a X4 está congelada esperando) | alta | médio | MISSAO: 12 etapas | as perguntas P1–P10 decidem o que entra; o resto vira registro, não tarefa |

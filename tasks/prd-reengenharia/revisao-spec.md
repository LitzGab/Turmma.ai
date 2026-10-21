# Revisão de spec — reengenharia

**Subagentes obrigatórios:** `test-engineer`, `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`, `llm-integrator`, `frontend-reviewer`

A Tech Spec desta funcionalidade é dividida (R34): `techspec.md`, comum, e `onda-0.md`, `onda-1a.md`, `onda-1b.md`,
`onda-2.md`, `onda-3a.md`, `onda-3b.md`, `onda-3c.md`, `onda-4a.md`, `onda-4b.md` (a 3 e a 4 partidas na revisão,
R42), `onda-5.md` e `onda-6.md`. A revisão lê todos.

## Rodada 1 — 21/10/2026

**Veredito: REPROVADA**

Tamanho: PRD 2.268 palavras (aceite no topo) · Tech Spec comum 1.999 · ondas de 1.293 a 1.500 cada (R34).

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 12 |
| `tenancy-guardian` | REPROVADO | 4 |
| `privacy-guardian` | REPROVADO | 4 |
| `conformidade-reviewer` | REPROVADO | 5 |
| `infra-guardian` | REPROVADO | 7 |
| `llm-integrator` | AJUSTES NECESSÁRIOS | 8 |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 5 |

Nenhuma correção muda critério de aceite do PRD: todas fecham o que a Tech Spec deixou implícito ou apertam o alvo
(o RF1 pede "sem cair", e a correção pede 60/60). A C30 revê a R39 (teto de IA por escola), que é decisão de desenho
do Arquiteto, e vira a R42.

### Correções exigidas na Tech Spec

**Onda 0 (`onda-0.md`)**
- C1. `ouro.test.ts` falha abaixo de `MEDIDAS.alvo` (riscoAVida) e de `MEDIDAS.base` (as outras) a partir da 2.0 e da 3.0, inclusive nas legítimas de `saidaQualitativa` (test, conformidade, llm)
- C2. `riscoAVida`: `erraPara: 'mais'`, recall 60/60 no `ouro` (perda tolerada escrita por categoria, zero na `explicita`), precisão secundária: no conflito, vence o recall (conformidade)
- C3. `saidaQualitativa` e `julgamentoDeTextoDeAluno` com alvo explícito em `MEDIDAS.alvo` antes da 3.0: recall mínimo nas positivas e nenhuma legítima barrada. Política nova não tem alvo igual à base (conformidade, llm)
- C4. O `selo.test.ts` (sha256 contra `SELO.json`) e o leitor nascem na 1.0; a 2.0 e a 3.0 trazem `git log <base>..HEAD -- docs/aia/ouro` vazio no veto de conformidade. A 29.0 fica com `ouro-separado` e as mutações (conformidade, llm)
- C5. No `concluir`, a saída `assunto_delicado` grava a mensagem fixa e o `atencao_humana` mesmo com a avaliação aberta; só os outros turnos são descartados sem contar a troca. Teste com a avaliação abrindo entre a execução e a conclusão (conformidade). Vale também para a 42.0
- C6. A 2.0 ganha amostras `dev` para "tô triste" (`ehAssuntoDelicado` verdadeiro, `mencionaRiscoAVida` falso, sem CVV) e "suicídio na Revolução Francesa"; o `it.each` de hoje continua (test)
- C7. RF4: o teste vive em `tools/processo/`, roda o comando lido de `.claude/settings.json` com `CLAUDE_PROJECT_DIR` numa cópia com import quebrado (saída 2) e sã (0, `deny` intacto); a 5.0 roda o portão com a mutação "tirar o `|| { …; exit 2; }`" (test)

**Onda 1A (`onda-1a.md`)**
- C8. A 12.0 não tira as cercas da `ResolucaoDeTenantRepository`, da `ContaGlobalRepository` e do `PainelRepository` sem substituto: regras no `camadas.cjs` (só `sessao/**` importa a resolução; só `sessao` e `ciclo-de-vida` importam a conta global; só `operacao/painel.service.ts` importa o painel), com fixtures de import, reexport e `import()` dinâmico, e a mutação de cada uma (tenancy, test)

**Onda 2 (`onda-2.md`)**
- C9. 34.0: `sessao/index.ts` e `credencial/index.ts` não reexportam a resolução nem a conta global (tenancy)
- C10. 37.0: `entregas` usa o alcance do `EntregaRepository` (`comVinculoConfirmadoDoProfessor` com `disciplinaDaEntrega`); teste com duas professoras da mesma turma em disciplinas diferentes, mutação tirando o filtro de disciplina (tenancy)
- C11. 37.0 a 39.0: escola sem ano letivo em curso (nenhum, `planejado`, `encerrado`), vínculo encerrado ao lado de aberto, virada de ano, professor com duas disciplinas na mesma turma (contagem não dobra), vínculo pendente só em `vinculosAConfirmar`; os casos dos testes da web que a 79.0 apaga são portados antes, pelo nome (test)
- C12. 38.0: teto por tipo com `haMais` em `itens[]`, e o `EXPLAIN` cobre essas tabelas (infra)
- C13. 38.0 com veto de `conformidade`, e teste de que nenhum item deriva de uso, entrega ou atividade de professor (conformidade)
- C14. 40.0: os casos de `textos-do-pedido.test.ts:50-115` portados para a API com relógio falso, mais o pedido perto da meia-noite de São Paulo; só depois a web perde os seus (test)

**Onda 3 (`onda-3.md`)**
- C15. 47.0: a escola do contexto é `job_registro.escola_id` restaurada pelo executor; `execucao_agente` lida com `escola_id = exigirEscolaDoContexto() and id`; `ExecucaoRepository` sai de `REPOSITORIES_SEM_ESCOPO` (só `falharInterrompidas` com `@SemEscopo`); teste com o `execucaoId` de outra escola e mutação (tenancy, llm)
- C16. 47.0: lista dos repositories e services que a execução toca, e a montagem do contexto no worker: `papel` relido do usuário, sem `sessaoId`, `solicitadaPor` nulo falha fechado com `NAO_ENCONTRADO`; teste com usuário eliminado entre o 202 e a execução (llm)
- C17. 45.0: o PDF no storage tem ciclo de vida: chave só com ids e prefixo da escola, apagar depois do commit, destino em cada caminho (sucesso, falha final, descarte, `substitui`, exclusão, expurgo da escola), retenção máxima do órfão, linha 86 do `docs/lgpd.md` e `docs/modelo-de-dados.md:569`; sai a frase falsa da §4 (privacy, tenancy)
- C18. 45.0: testes de isolamento (`materialId` de outra escola), job duplicado em paralelo, prazo estourado ou worker morto terminando `falhou`, e objeto apagado depois de ler e de falhar; dizer o que substitui `varrerParados`; `naoUrgente: false` (tenancy, test, infra)
- C19. 46.0: listagem só com id, escola, tipo, código e data; auditoria no molde de `ops:retencao` (operador, job, escola, referência de chamado), nunca `dados`; efeito do descarte por tipo; sentinela em `dados` fora da saída e da auditoria; testes de descartar, de recusar `ia.*`, da auditoria e da cópia `failed` do BullMQ; `update … where estado = 'falhou'` (privacy, test, infra)
- C20. 44.0: `titular.eliminar` que falhou não expira sem ação; teste das cinco falhas com a linha, a métrica e o alerta (test)
- C21. 50.0: a D62 exige `conversa_do_aluno` nas categorias, alcance que cubra as escolas (`todas`), vale para todo `openai_compat` fora da nossa rede, e o modelo menor usa o mesmo provedor; um caso por ramo (privacy, llm)
- C22. 48.0: ordem dos mecanismos e orçamento de tempo, com `prazoMs` de `ia.*` maior que o pior caso, prazo de chamada por perfil compatível com `docs/infra.md` §3.2, o que conta como falha do disjuntor (timeout e lentidão contam), se o modelo menor tem disjuntor próprio, e a linha "500: um `fetch` só" (llm, infra, test)
- C23. 47.0 ou 48.0: espera máxima do job interativo de IA; no estouro, código tipado e o aviso ao aluno, com teste (infra)
- C24. 49.0: `LimiteDeTokens` é porta no `nucleo` com implementação na API; variáveis no `esquemaAmbienteDeIa`; reserva por estimativa e acerto pelo uso real; um balde por modelo; fatia da fila interativa; teste da sequência espera de 8 s, modelo menor, `IA_INDISPONIVEL` (llm, infra, test)
- C25. 42.0: caracterização das mensagens montadas por tarefa e hash do prompt contra `versao`, verde da 42.0 à 47.0 e na 26.0 e na 27.0 (llm)
- C26. §3 "Worker morto": quem grava a linha de `consumo_ia` da execução morta (llm)
- C27. Job duplicado com corrida de verdade: duas entregas em `Promise.all`, a primeira concluindo depois de a segunda marcar `EXECUCAO_INTERROMPIDA`, transições condicionadas no banco (test, infra)
- C28. 51.0 e 53.0: a origem monotônica da `sequencia` (a leitura devolve a atual e o cliente segue de `max(local, servidor) + 1`); o caminho sem `sequencia` grava `atual + 1`; espelho com chave por atividade; testes de F5, de segundo computador, de duas abas, do cliente antigo seguido do novo, e de 5 e 7 em `Promise.all` (frontend, infra, test)
- C29. 53.0: o espelho é limpo no envio, no "Sair" e na troca de dono, e não na sessão vencida; teste de sessão vencida com o mesmo dono e com outro (frontend)
- C30. O limite de IA por escola é a vaga do despachante, compartilhada entre réplicas, com o padrão dimensionado pela conta de `docs/infra.md` §3.2, escrita; dizer o que fica de `IA_EXECUCOES_POR_ESCOLA` e `IA_EXECUCOES_TOTAL` (infra, llm). Revê a R39 (R42)
- C31. k6 da 47.0: fase com várias escolas a ~0,75 turno/s cada e latência falsa de ~6 s, threshold no p95 e em `job.espera_mais_antiga_s`, `kill -9` sob essa carga, e base e depois medidos na mesma sessão (infra, test)
- C32. Métricas do adaptador e do `worker-ia` com nome e rótulos, o teste que as prova, e cada alerta com a sua métrica e o runbook; o `main-worker.ts` exporta (infra)

**Onda 4 (`onda-4.md`)**
- C33. 60.0: caracterização e mutações de Aprovar com o registro de abertura (o botão não libera sem abrir), o resumo antes da confirmação e o diálogo (frontend)
- C34. §2.6 e 79.0: tabela dos estados do sino com os textos antes e depois, as mudanças aceitas declaradas e o `sino-por-area` mantido; teste de uma chamada por papel (frontend, test)
- C35. 59.0 depende das caracterizações (60.0 a 65.0), ou 57.0 a 59.0 só criam o mecanismo e a migração entra nos cortes; tabela consulta→estado da `<Leitura>` em §2.4 com teste por linha (frontend)
- C36. Veto de `conformidade` na 72.0, na 74.0 e na 79.0 (conformidade)

**Comum, PRD e ouro**
- C37. `techspec.md` §6, §7, §7c e §8: os testes de isolamento novos (45.0), o PDF, os números da C30 e a estimativa de custo (llm, tenancy, privacy)
- C38. PRD §8: `job_registro` "não; entra na 44.0", e a linha do PDF temporário (correção de fato, privacy)

### Recomendações
Entram como subtarefa ou cenário no `criar-tasks`: `@SemEntrada` com lista fechada e um decorator para parâmetro de
caminho que não é uuid (test); a fixture "chama e não usa" na 6.0 (test, tenancy); a catraca por arquivo (test); o
`@ts-expect-error` do RF8 (test); o lint de API acima do Chrome 99 (frontend); a fila de respostas classificando
`RESPOSTA_FORA_DO_CONTRATO` (frontend); o chunk da coordenação medido (frontend); a sentinela no erro de entrada e o
`tipo` fechado do `reportarFalha` (privacy); `fonte` fechada no leitor do `ouro` (privacy); as políticas de identidade
fora do módulo, com o porquê (conformidade); a semente sem desligar gatilho (conformidade); o prazo "antes de aluno
real" no item do Tutor sob a D55 em `TODO.md` (conformidade); o disjuntor por réplica aceito na 80.5 (llm); os pools
do `worker-ia` e do `worker-pdf` somados (infra); o profile `observabilidade` em staging e produção (infra).

## Rodada 2 — 21/10/2026

**Veredito: REPROVADA**

Tamanho: Tech Spec comum 2.000 palavras · ondas até 1.500 cada (a 3 partida em 3a e 3b, R42).

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 10 |
| `tenancy-guardian` | REPROVADO | 3 |
| `privacy-guardian` | REPROVADO | 2 |
| `conformidade-reviewer` | REPROVADO | 2 |
| `infra-guardian` | REPROVADO | 3 |
| `llm-integrator` | AJUSTES NECESSÁRIOS | 3 |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 1 |

Das 38 correções da rodada 1, ficaram incompletas a C17, C19, C22, C27, C28, C30 e C34. Nenhuma correção nova muda
critério de aceite do PRD.

### Correções exigidas na Tech Spec

**Onda 0 e `ouro`**
- D1. Cada política fica vermelha a partir da tarefa dona: as três "não cair da base" desde a 1.0; `riscoAVida` e o piso de `ameaca_a_terceiro` na 2.0; `saidaQualitativa` e `julgamentoDeTextoDeAluno` na 3.0, que passa a ser dona de levar `conversaPedeJulgamentoDeTextoDeAluno` ao alvo (medido sem JT-001 a JT-012), com amostras `dev` das formas que escapam; as `nao_casa` dessa política (`pedagogia_geral`, `homonimo_de_nota`) não caem da base (llm, conformidade, test)
- D2. `ameaca_a_terceiro` ganha `nao_cair_da_base` como piso, e a 2.0 uma amostra `dev` ("vou matar ele amanhã") com a mensagem fixa e o `atencao_humana` (conformidade)
- D3. Estreitar padrão é permitido quando nenhuma `casa` do `ouro` nem do `it.each` se perde; precisão abaixo de 0,80 deixa o teste vermelho e sobe ao Arquiteto, nunca ao `MEDIDAS` (test)
- D4. Tamanhos e categorias de `onda-0.md` §2.1 iguais aos arquivos; o selo cobre todo arquivo da pasta menos o `SELO.json`, com o mesmo conjunto de nomes; o leitor do `MEDIDAS` é zod estrito; o `<base>` do `git log` é o início da tarefa; README do `ouro` sem a menção velha à 29.0 (test, conformidade, llm)

**Onda 1A e 2**
- D5. 12.0: um comando só, nas cinco pastas (`apps packages tools infra e2e`), fixture fora de `apps/` e `packages/`, e fixture do reexport por um arquivo de `sessao/**`; os testes que saem das cercas declarados como mudança aceita (tenancy, test)
- D6. 34.0: teste em execução com `Object.keys`/`Object.values` de `sessao/index.js` e `credencial/index.js`, e a mutação do reexport em dois passos (tenancy)

**Onda 3A e 3B**
- D7. Workers: o teste de repository (contexto A, id B, leitura vazia) leva a mutação "tirar o `escola_id`"; o teste do job afirma a execução da B ainda `pendente`, `lerBytes` e o extrator não chamados, nenhum trecho com aquele `materialId` e a B intacta; a chave do PDF se monta com `exigirEscolaDoContexto()` (tenancy)
- D8. PDF: função de chave própria `material-temporario/<escolaId>/<materialId>`, fora de `titular/`; o órfão sai por varredura da tabela `material` (não do bucket), com `@SemEscopo` e motivo; a exclusão do material apaga o objeto depois do commit; transição `where estado = 'processando'` no duplicado; testes de material excluído em `processando`, do expurgo da A sem tocar a B, do órfão de 23 h, e se a reconciliação apaga o objeto (privacy, test, tenancy)
- D9. O `prazoMs` do job de IA sai do perfil da tarefa, não da fila: as ferramentas `padrao` do professor correm na interativa; teste do pior caso por `TarefaDeIa`; destino de `LLM_TIMEOUT_MS` e `IA_EXECUCAO_TIMEOUT_MS` (infra, llm)
- D10. A vaga interativa conta também as ferramentas do professor, ou o Tutor tem vagas reservadas (`docs/infra.md` §5.4); a `FASE=sala` roda as duas; a frase "fica para quando houver tabela" sai, porque `configuracao_operacional_escola.vagas` já existe (infra)
- D11. Um alerta por escola no degrau da espera máxima de IA, com runbook e caso em `alertas.int.test.ts` (infra)
- D12. Job duplicado: o estado final exato (execução `falhou`, nada gravado, um `fetch`, as linhas de `consumo_ia`, que guarda a reserva estimada nos campos obrigatórios) e o caso separado da segunda entrega depois de `concluido` (test, llm)
- D13. Descartar: recusa `titular.*` (ou estado visível ao titular e à escola), a exceção da 44.0 vale para `titular.montar-arquivo`, o efeito de `sistema.*` e `retencao.*` escrito, um teste por tipo, a sentinela também na auditoria, a ação em `auditoria/acoes.ts` estrita, `--chamado` inteiro positivo, `where estado = 'falhou'` (privacy, test, infra)
- D14. Disjuntor: uma linha de teste para "acima de metade do prazo conta" e para "429 e `IA_SAIDA_INVALIDA` não contam" (test)
- D15. Prova em outra aba e outro computador: o resultado escrito e testado na interface (o último clique vence ou a tela mostra o que ficou, com aviso) (test, frontend)

**Onda 4**
- D16. §2.6: tabela por papel com estado, texto antes e depois e "igual" ou "mudança aceita", cobrindo os quatro tipos do professor, os cinco da coordenação, `parcial`, `erro`, `carregando`, "Em dia" por turma, sem ano letivo e "100 ou mais", com o teste de cada linha; `sino-por-area.test.tsx` reescrito para uma chamada por papel, sem o professor ler rota da coordenação (frontend, test)

**Comum e PRD**
- D17. `techspec.md` §7c remete à conta de `onda-3a.md`, e §8 traz o número: chamadas por professor por mês por perfil, tokens e custo, com as premissas (infra, llm)

### Recomendações
Entram nas ondas nesta rodada: a 60.0 com mutações também em Time e Aplicação; a leva 2 da onda 4 depende da 58.0 e da
59.0; a 73.0 e a 74.0 nomeiam os testes que valem como caracterização (D55 e rótulo de IA em `Artefato` e `Conversa`); o
turno descartado continua no registro que o professor vê; `LLM_PROCESSAMENTO_LOCAL` como critério da D62 e o caso de
outra categoria; `LLM_TOKENS_POR_MINUTO` obrigatório em produção, com o teto dividido pelas réplicas quando o Redis
cai; o `docs/infra.md` §5.3 atualizado na 47.0; o cabeçalho duplicado de `onda-3b.md` §5; a premissa do storage com
versionamento; a linha do espelho no PRD §8; a ameaça a terceiro como limitação em `docs/aia/tutor.md`.

## Rodada 3 — 21/10/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 7 |
| `tenancy-guardian` | REPROVADO | 1 |
| `privacy-guardian` | APROVADO | 0 |
| `conformidade-reviewer` | REPROVADO | 1 |
| `infra-guardian` | REPROVADO | 3 |
| `llm-integrator` | AJUSTES NECESSÁRIOS | 1 |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 2 |

A D15 da rodada 2 (a aba que perde reenvia) contradizia o RF21 e foi trocada. A subvaga da D10 foi trocada por filas
separadas (R42). Nenhuma correção muda critério de aceite do PRD.

### Correções exigidas na Tech Spec

- E1. `ouro` e 1.0: a `base` foi medida pelo Arquiteto antes da 1.0 (`MEDIDAS.json`, com o mapeamento no README); a
  1.0 reproduz a base exatamente e só então liga as suas; `saidaQualitativa` sem base até a 3.0; `naoCairDaBase` de
  `julgamentoDeTextoDeAluno` no `MEDIDAS`; a amostra `dev` da ameaça não repete o `ouro`; `llm` no veto da 3.0 (llm,
  test, conformidade)
- E2. Onda 3A: o Tutor e as ferramentas do professor em filas separadas, cada uma com a sua vaga por escola (uma chave,
  o `vaga.lua` de hoje) e a sua concorrência por réplica; a conta escrita segura o pico com uma réplica só; pool do
  banco refeito; a `FASE=sala` com latência por perfil e o `kill -9` sob o threshold (infra)
- E3. Onda 3A: o duplicado em corrida com ordem forçada por barreira, o caso "as duas leem `pendente`" com a mutação, e
  o encaminhamento da D36 gravado também quando o `concluir` descarta a saída (test, conformidade)
- E4. Onda 3B: a varredura do órfão é `sistema.*`, a leitura sem escopo devolve só `(escola_id, id)` de material
  `pronto`, `falhou` ou excluído há mais de 24 h desde o fim do processamento, sem teto superior, e cada `apagar` roda em
  `executarNoContexto` da escola; a função de chave vai para o `nucleo`, só com a escola do contexto; teste com duas
  escolas e com `processando` de 25 h (tenancy, infra, privacy)
- E5. Onda 3B: testes de reprocessar `ia.*` recusado, de descartar fora de `falhou` recusado, de `--chamado` inválido e
  da reconciliação; o segundo job do PDF duplicado termina `concluido` (test)
- E6. Onda 3C: a aba que perde não reenvia: adota a `sequencia` do servidor, mostra a alternativa que ficou com o aviso
  (`role="status"`, lugar fixo), e o próximo clique vence; teste na interface com a mutação "reenviar sobrescreve a mais
  nova" (frontend, test)
- E7. Onda 3C: as cláusulas do `comPrazo` que a partição perdeu ("ligado ao sinal de quem chamou; cancelamento relança",
  "`redeFalsa` respeita o `signal`"), com testes, mais o prazo estourado em JSON, PDF e upload; a D62 com o banco fora
  na subida, com teste (test)
- E8. Onda 4B: quem migra `Painel`, `Estrutura` e `OQueFalta` para o roteiro, os estados desses blocos na tabela, o
  módulo apagado só com zero importador, `Painel.test.tsx` e `painel-da-coordenacao.spec.ts` como prova (frontend)
- E9. Onda 4B: `conformidade` no veto da 70.0 e da 73.0, com a caracterização de `TurmaHoje.test.tsx`,
  `AlunosDaTurma.test.tsx` e `Painel.test.tsx` declarada (conformidade)

### Recomendações
Entram nesta rodada: `contestacaoId` sai (é o `vinculoId`) e `professor` é `{ usuarioId, nome }` (tenancy, privacy); a
saída sem `reaches` escrita de forma direta na 12.0 (tenancy); o teto real do órfão em 25 h (privacy); o corte do
`padrao` abaixo do `prazoMs` (infra); a vazão do `worker-pdf` e o alerta de idade do lote (infra); o runbook separando
uma escola de várias (infra); a 47.0 depois da 48.0, ou o caso do disjuntor lento na 48.0 (llm); `IA_REPLICAS` na §4 e
maior que 0 (llm); a faixa de custo de R$ 0,02 a 0,06 (llm); o Redis fora com o `POST` do Tutor 202 de volta (test); o
espelho com duas atividades (test); as mutações da 60.0 com arquivo e caso (frontend); a 79.0 depois da 73.0 e a prop
`parcial` do `Sino` (frontend); "Não lida" como mudança aceita (test); `conformidade` no veto da 49.0 (conformidade); a
semente sem desligar gatilho (conformidade).

## Rodada 4 — 21/10/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 2 |
| `tenancy-guardian` | REPROVADO | 1 |
| `privacy-guardian` | REPROVADO | 1 |
| `conformidade-reviewer` | APROVADO | 0 |
| `infra-guardian` | REPROVADO | 3 |
| `llm-integrator` | AJUSTES NECESSÁRIOS | 1 |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 2 |

O `privacy-guardian` voltou porque a 3B mexeu em retenção. Nenhuma correção muda critério de aceite do PRD.

### Correções exigidas na Tech Spec

- F1. Onda 3B: toda transição que tira o material de `processando`, para `pronto` ou `falhou` (falha final, prazo,
  reconciliação, descarte), grava `processado_em` na mesma instrução; a linha "Órfão" ganha "`falhou` há 25 h é apagado" e
  "excluído há 25 h é apagado", com a mutação "gravar `processado_em` só no sucesso" (test, tenancy, privacy, infra)
- F2. Onda 3C: o limite de "chamada lenta" do disjuntor é por perfil e acima da duração normal dele, e o Tutor não divide o
  disjuntor do `padrao`; teste "5 ferramentas de 50 s não abrem o disjuntor" (llm, infra)
- F3. Onda 3A: no `kill -9`, os interrompidos contam à parte, com teto igual ao que rodava no instante; os outros falhos
  seguem em 0, e o aluno vê "Tentar de novo" sem gastar a troca (infra)
- F4. Onda 3A: "a `ferramenta` não tem corte" ganha caso (21 s de espera roda), com a mutação "corte de 20 s em todas as
  filas" (test)
- F5. Onda 4B: o "sem ano letivo" do sino, que hoje sai pelo `parcial`, ganha estado próprio, com teste e mutação em
  `SinoDoProfessor.test.tsx` e `SinoDaCoordenacao.test.tsx` (frontend)
- F6. Onda 4B: `Painel.test.tsx:428` (dois cliques, uma leitura) fica, adaptado à rota única; saem só o `:387` e o `:409`
  (frontend)

### Recomendações
Entram nesta rodada: a escola da vaga da `ferramenta` sai de `job_registro.escola_id`, com o caso de duas escolas
(tenancy); os `@SemEscopo` de ops contados contra a regra 10.9, e a justificativa da varredura sem título nem pessoa
(tenancy); o expurgo da escola diz quando roda e com que filtro (privacy); a aba reaberta por outro aluno descarta o
espelho (privacy); a latência falsa abaixo do timeout do perfil no `config-ia.ts`, a citação de `consumo.ts`, o modelo menor
substituindo a chamada e o preço por milhão de tokens da conta (llm); `NOT VALID` e `lock_timeout` nas migrations, a espera
do pool na `FASE=sala`, a origem de "1 ferramenta/min", o `docs/infra.md` §5.3, `VAGAS_ESCOLA_FERRAMENTA` no compose, a meta
de vazão do `worker-pdf` e as colunas do índice parcial (infra); o que a recusa do descarte deixa intacto, a aba vencedora
na próxima leitura, `Atividade.test.tsx` nascendo na 51.0, as linhas antigas fora da varredura, o alerta da `ferramenta` e a
sobreposição da vaga (test, frontend); `semBaseAte` no leitor da 1.0 e o `naoCairDaBase` espelhado (conformidade, test); a
trava contra desligar gatilho na semente, que não grava `nota` (conformidade); as linhas do `fila-da-coordenacao.ts` e o
`Estrutura.test.tsx` (frontend); a pergunta cortada fica em `mensagem_tutor`, e a checagem sem modelo vem antes da fila
(conformidade).

## Rodada 5 — 21/10/2026

**Veredito: APROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | APROVADO | 0 |
| `tenancy-guardian` | APROVADO | 0 |
| `privacy-guardian` | APROVADO | 0 |
| `conformidade-reviewer` | APROVADO na rodada 4 | 0 |
| `infra-guardian` | APROVADO | 0 |
| `llm-integrator` | APROVADO | 0 |
| `frontend-reviewer` | APROVADO | 0 |

Depois da aprovação, corrigidos só os fatos que os revisores apontaram como errados, sem mudar cláusula: o pior caso do
orçamento é 2 × (prazo + 8 s), 56 s e 136 s, e a `ferramenta` chega a 27 no pior caso (llm); `operacao/` e `ops/` têm
três `@SemEscopo` cada, e "marcar" roda com escopo, ficando dois sem escopo no repository novo; a justificativa da
varredura é texto novo; o índice parcial tem nome; a meta do `worker-pdf` é das 19h às 5h (tenancy, infra); a premissa do
versionamento está no `TODO.md` (privacy); e a §8 mostra a base de 650 mil tokens (llm).

### Recomendações para o `N_task.md` de cada onda (R41)
O Arquiteto as escreve quando a onda nascer, contra o código daquele momento:
- **3A (47.0):** a fonte dos "jobs ativos da réplica" no `kill -9` (`getWorkers` do BullMQ ou um gauge por instância),
  comparada em `infra/scripts/carga.ts` depois do summary; a validade da vaga da `interativa` contra o corte de 20 s logo
  depois do kill; o teste da tela de "Tentar de novo" sem gastar a troca (infra, test); como saber se a execução morta já
  tem linha de consumo, porque `RegistroDeConsumo` só registra (llm).
- **3B (45.0, 46.0):** o `falhou` de 25 h nasce da reconciliação real, com relógio falso, e o descarte e o prazo também
  conferem `processado_em` (test, tenancy); o expurgo noturno cita a retenção da escola e para quando a janela letiva
  abre (`expurgar-escola.ts`) (privacy).
- **3C (48.0, 49.0, 51.0, 53.0):** a mutação "o menor soma ao orçamento"; as 5 falhas do disjuntor são consecutivas ou
  numa janela; o `propor_ferramenta` abaixo de 10 s; `LLM_RECUO_MS` menor que o prazo de cada perfil (llm); "descarta"
  remove a chave, com a mutação "hidratar sem conferir o dono" (privacy); as mutações do aviso e da aba vencedora em
  `Atividade.test.tsx`, e o aviso buscado pelo nome, porque `Atividade.tsx:189` já tem um `status` (frontend).
- **4B (73.0, 79.0):** o nome do botão do sino em `sem-ano-letivo`, com o clique de `SinoDoProfessor.test.tsx:298`
  adaptado; os itens de entrega sem ano como mudança aceita; o `Estrutura.test.tsx:199` estendido ao ano só planejado; o
  destino de `Painel.test.tsx:605`, `:631`, `:698` e `:723` (frontend, test).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-21 15:18:35 | 2026-10-21 15:21:26 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a7ee2873a42d1cb3a |
| 2026-10-21 15:18:12 | 2026-10-21 15:22:27 | `tenancy-guardian` | 1 | REPROVADO | a54c9fdafc1517e38 |
| 2026-10-21 15:18:30 | 2026-10-21 15:23:32 | `llm-integrator` | 1 | AJUSTES NECESSÁRIOS | a68edf0074be8ee24 |
| 2026-10-21 15:18:16 | 2026-10-21 15:23:58 | `privacy-guardian` | 1 | REPROVADO | a935252fd87c44bac |
| 2026-10-21 15:18:26 | 2026-10-21 15:24:08 | `infra-guardian` | 1 | REPROVADO | a1d0903243a6e845c |
| 2026-10-21 15:18:21 | 2026-10-21 15:24:14 | `conformidade-reviewer` | 1 | REPROVADO | af28b960902b96c1e |
| 2026-10-21 15:18:08 | 2026-10-21 15:24:40 | `test-engineer` | 1 | REPROVADO | ae785a7798ecb0e6e |
| 2026-10-21 15:35:19 | 2026-10-21 15:36:50 | `frontend-reviewer` | 2 | AJUSTES NECESSÁRIOS | a4fc7248bd4ff708c |
| 2026-10-21 15:35:03 | 2026-10-21 15:37:50 | `tenancy-guardian` | 2 | REPROVADO | ab3f19e1dcccce1fa |
| 2026-10-21 15:35:13 | 2026-10-21 15:38:18 | `infra-guardian` | 2 | REPROVADO | aaf6cdf142626243b |
| 2026-10-21 15:35:16 | 2026-10-21 15:38:23 | `llm-integrator` | 2 | AJUSTES NECESSÁRIOS | a74d9bb392c9a1f87 |
| 2026-10-21 15:35:06 | 2026-10-21 15:38:55 | `privacy-guardian` | 2 | REPROVADO | ae3471d8dbd8e2a99 |
| 2026-10-21 15:35:01 | 2026-10-21 15:39:56 | `test-engineer` | 2 | REPROVADO | a55541dd2760f39ae |
| 2026-10-21 15:35:10 | 2026-10-21 15:40:52 | `conformidade-reviewer` | 2 | REPROVADO | a4b7ba79f54dcfdd4 |
| 2026-10-21 15:46:55 | 2026-10-21 15:48:57 | `privacy-guardian` | 3 | APROVADO | ad1425fcd96803305 |
| 2026-10-21 15:47:09 | 2026-10-21 15:48:58 | `frontend-reviewer` | 3 | AJUSTES NECESSÁRIOS | adbdc0253880640ac |
| 2026-10-21 15:47:06 | 2026-10-21 15:49:13 | `llm-integrator` | 3 | AJUSTES NECESSÁRIOS | abd4821c331e5df8a |
| 2026-10-21 15:46:52 | 2026-10-21 15:49:23 | `tenancy-guardian` | 3 | REPROVADO | a37af0e0e0011c912 |
| 2026-10-21 15:46:48 | 2026-10-21 15:50:35 | `test-engineer` | 3 | REPROVADO | a122bb0df59904fdf |
| 2026-10-21 15:47:03 | 2026-10-21 15:50:47 | `infra-guardian` | 3 | REPROVADO | a9871be02ccbcea86 |
| 2026-10-21 15:46:59 | 2026-10-21 15:51:55 | `conformidade-reviewer` | 3 | REPROVADO | aa64875a24efa8822 |
| 2026-10-21 16:05:34 | 2026-10-21 16:06:26 | `llm-integrator` | 4 | AJUSTES NECESSÁRIOS | a72a4b7ad8ab4f31d |
| 2026-10-21 16:05:24 | 2026-10-21 16:06:38 | `conformidade-reviewer` | 4 | APROVADO | afdc403515e5e4c0a |
| 2026-10-21 16:05:39 | 2026-10-21 16:06:50 | `frontend-reviewer` | 4 | AJUSTES NECESSÁRIOS | a4ffa357941d113e8 |
| 2026-10-21 16:05:15 | 2026-10-21 16:06:57 | `tenancy-guardian` | 4 | REPROVADO | a7c514c3ef53fbcd5 |
| 2026-10-21 16:05:10 | 2026-10-21 16:07:29 | `test-engineer` | 4 | REPROVADO | ac4771509668a1b9d |
| 2026-10-21 16:05:29 | 2026-10-21 16:09:10 | `infra-guardian` | 4 | REPROVADO | a87ae032bbf874cc9 |
| 2026-10-21 16:15:03 | 2026-10-21 16:15:35 | `privacy-guardian` | 4 | APROVADO | a800214c142588f46 |
| 2026-10-21 16:15:15 | 2026-10-21 16:16:02 | `frontend-reviewer` | 5 | APROVADO | ac85b82220b1f5bb0 |
| 2026-10-21 16:14:56 | 2026-10-21 16:16:07 | `test-engineer` | 5 | APROVADO | a27ac83931434955f |
| 2026-10-21 16:15:00 | 2026-10-21 16:16:11 | `tenancy-guardian` | 5 | APROVADO | a6cdd33c179ade2a2 |
| 2026-10-21 16:15:11 | 2026-10-21 16:16:45 | `llm-integrator` | 5 | APROVADO | ab5e2bc41ea2d26ad |
| 2026-10-21 16:15:08 | 2026-10-21 16:17:03 | `infra-guardian` | 5 | APROVADO | ac4f44aae42e7b2f8 |

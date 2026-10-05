# Tarefa 1.0 — O ciclo de vida mora no nucleo, sem mudar comportamento

**Funcionalidade:** lgpd-e-titular · **Depende de:** nenhuma · **Paralelo com:** 7.0, 8.0, 9.0
**Subagentes obrigatórios:** `privacy-guardian`, `tenancy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O worker passa a alcançar o `CicloDeVidaService`: ele e os repositórios dele saem de `apps/api/src/sessao` para `packages/nucleo/src/ciclo-de-vida`, o `eliminar` aceita a transação de quem chama, e os dois `@SemEscopo` da conta global vão para a `ContaGlobalRepository`, que só o `sessao` e o ciclo de vida importam.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 2, 6 (tabela de consultas sem escopo) e 13
- `.claude/rules/10-multitenancy.md` item 9
- Código: `apps/api/src/sessao/ciclo-de-vida.service.ts` e `.repository.ts`, `resolucao-de-tenant.repository.ts` (`travarConta`, `limparContaSemUso`), `apps/api/test/arquitetura.test.ts` (exceção da `Conta`)
- `docs/modelo-de-dados.md`, regras transversais, item 1 (exceção da `Conta`)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 1.1 — Mover serviço e repositórios; a API importa do `@educa/nucleo` (subcaminho), sem export no barrel da `ContaGlobalRepository`
- [x] 1.2 — `eliminar`/`desativar` aceitam `tx` opcional de quem chama; sem ela, abrem a própria transação como hoje
- [x] 1.3 — Teste de arquitetura: a exceção da `Conta` aceita só `sessao` e `nucleo/ciclo-de-vida`, e lista quem importa a `ContaGlobalRepository`; `docs/modelo-de-dados.md` atualizado
- [x] 1.4 — Testes: os de ciclo de vida e de fim de vínculo mudam só de lugar, sem mudar asserção

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ciclo-de-vida/*` (serviço, repositórios, conta global) | novo (movido) |
| `apps/api/src/sessao/*` (importações) | alterado |
| `apps/api/test/arquitetura.test.ts` | alterado |
| `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| terceiro caminho importa a `ContaGlobalRepository` | unidade | o teste de arquitetura falha |
| barrel do `@educa/nucleo` | unidade | não exporta a `ContaGlobalRepository` |
| `eliminar` na transação de quem chama, que depois lança | integração | o usuário continua lá |
| testes do F1 e da A1 de ciclo de vida | integração | verdes sem mudar asserção |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Qualquer mudança de comportamento do ciclo de vida; rota de eliminação (14.0, 15.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| O serviço chamava três métodos de repositórios da API (`TurmaRepository.travarContraOGerarDoProfessor`, `EscritaDeSessaoRepository.encerrarDoUsuario` e `AcessoDaTurmaRepository.revogarDeQuemSaiu`). Os três vieram para o `CicloDeVidaRepository` do `nucleo` sem mudar a instrução (o segundo como `encerrarSessoesDoUsuario`) e saíram da API. O `VinculoService.encerrar` usa a revogação daqui | o `nucleo` não importa `apps/api`, e copiar a instrução deixaria duas cópias da mesma regra | `techspec.md` §2, linha `packages/nucleo/src/ciclo-de-vida` |
| A `ContaGlobalRepository` tem três métodos, e não dois: `encerrarSessoesDaConta` veio junto com `travarConta` e `limparContaSemUso`. A redefinição do MFA (`sessao`) passa a chamá-lo por ela | o `limparContaSemUso` o chama, e a redefinição do MFA também. Mover só dois obrigaria a copiar a instrução. Com o terceiro, "só o `sessao` e o ciclo de vida importam" (§6) é o que o código faz | `techspec.md` §6, tabela de consultas sem escopo e parágrafo da `ContaGlobalRepository`; `docs/modelo-de-dados.md` |
| Dois subcaminhos: `@educa/nucleo/ciclo-de-vida` (serviço e repositório) e `@educa/nucleo/conta-global` (a `ContaGlobalRepository`). Nenhum dos dois entra no barrel | quem importa o ciclo de vida (o `VinculoService` da estrutura) não recebe a conta global junto | `techspec.md` §2 e §6 |
| `desativar` e `eliminar` recebem a transação de quem chama como terceiro argumento, sem ponto de salvamento: o erro sobe, e quem chama desfaz tudo | um ponto de salvamento por usuário, num lote de 5.000 da noite, transbordaria o cache de subtransações do Postgres | `techspec.md` §2 |
| Os testes de integração do ciclo de vida e do fim do vínculo continuam em `apps/api/test`, com só a importação mudada. As asserções de unidade sobre os `@SemEscopo` da conta global e do `CicloDeVidaRepository` foram para `packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.test.ts` | os de integração provam o efeito pela API (login recusado, `/v1/eu` com 401, a sala que não abre), e o `nucleo` não sobe a API | `techspec.md` §2 |
| Testes novos cobrem cláusulas movidas que nenhum teste fazia ficar vermelho: a sessão já encerrada, a sessão que escapou na limpeza da conta, a trava só das turmas de professor (e não da outra turma do ano), o filtro de turma da revogação, o colega e o vínculo de aluno que não seguram o acesso, e a conta já limpa. Nenhuma asserção existente mudou | a mutação das cláusulas movidas ficava verde (seção "Mutações") | `cenarios.md`, Arquitetura (as linhas da tarefa 1.0) |
| `docs/modelo-de-dados.md` diz que a `Conta` também é alcançada pela limpeza noturna do expurgo de acesso | o `ExpurgoDeAcessoRepository.limparLoteDeContasSemUso` já a limpava desde o F1, e o documento omitia | `docs/modelo-de-dados.md`, regras transversais, item 1 |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.service.ts` › `#naTransacao` › `transacao === undefined ? this.banco.transaction(rodar) : rodar(transacao)` (trocado por `this.banco.transaction(rodar)`) | `apps/api/test/ciclo-de-vida.int.test.ts` › "na transação de quem chama (F3, tarefa 1.0)…" |
| `ciclo-de-vida.service.ts` › `desativar` › repassa `transacao` ao `#naTransacao` (trocado por `undefined`) | `apps/api/test/ciclo-de-vida.int.test.ts` › "na transação de quem chama…" |
| `ciclo-de-vida.service.ts` › `eliminar` › repassa `transacao` ao `#naTransacao` (trocado por `undefined`) | `apps/api/test/ciclo-de-vida.int.test.ts` › "na transação de quem chama…" |
| `ciclo-de-vida.service.ts` › `desativar` › `repositorio.encerrarSessoesDoUsuario(usuarioId, 'desativacao')` | `apps/api/test/ciclo-de-vida.int.test.ts` › "caminho feliz (RF5…)", "isolamento: a professora desativada em A…", "auditoria (RF19)…" |
| `ciclo-de-vida.service.ts` › `eliminar` › `repositorio.travarContraOGerarDoProfessor(usuarioId)` | `apps/api/test/acesso-fim-do-vinculo.int.test.ts` › "a eliminação trava também a turma do vínculo ainda pendente…" e as duas corridas com o gerar |
| `packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.ts` › `encerrarSessoesDoUsuario` › `isNull(sessao.encerradaEm)` | `apps/api/test/ciclo-de-vida.int.test.ts` › "borda (F3, tarefa 1.0): a desativação encerra só as sessões ainda abertas…" (teste novo: antes desta tarefa, a mutação ficava verde) |
| `ciclo-de-vida.repository.ts` › `encerrarSessoesDoUsuario` › `eq(sessao.escolaId, exigirEscolaDoContexto())` | nenhum: **não observável**. A FK composta `sessao_usuario_da_escola_fk` (`escola_id`, `usuario_id`) prende a sessão à escola do usuário, e o `travarUsuario` já recusou o usuário de outra escola antes. Fica como defesa em profundidade (regra 10, item 3), como estava na API |
| `ciclo-de-vida.repository.ts` › `travarContraOGerarDoProfessor` › `eq(vinculo.papel, 'professor')` | `apps/api/test/ciclo-de-vida.int.test.ts` › "borda (F3, tarefa 1.0): a eliminação trava só as turmas em que o usuário é professor…" (teste novo) |
| `ciclo-de-vida.repository.ts` › `travarContraOGerarDoProfessor` › `eq(turma.escolaId, exigirEscolaDoContexto())` | nenhum: **não observável**. O `exists` correlaciona `vinculo.escola_id = turma.escola_id` e `vinculo.usuario_id`, e a FK composta do vínculo prende o usuário à escola dele; o `travarUsuario` já recusou o de outra escola. Defesa em profundidade, como estava na API |
| `ciclo-de-vida.repository.ts` › `revogarDeQuemSaiu` › `eq(vinculo.usuarioId, usuarioId)` no `vinculoQueSegura` | `apps/api/test/acesso-fim-do-vinculo.int.test.ts` › "o colega confirmado em outra disciplina da mesma turma não segura o acesso de quem o gerou…" (teste novo, 2ª rodada do `test-engineer`) |
| `ciclo-de-vida.repository.ts` › `revogarDeQuemSaiu` › `eq(vinculo.papel, 'professor')` no `vinculoQueSegura` | `apps/api/test/acesso-fim-do-vinculo.int.test.ts` › "um vínculo de aluno do mesmo usuário na turma não segura o acesso que ele gerou como professor…" (teste novo) |
| `ciclo-de-vida.repository.ts` › `revogarDeQuemSaiu` › `eq(vinculo.anoLetivoId, acessoTurma.anoLetivoId)` no `vinculoQueSegura` | nenhum: **não observável**. O `eq(vinculo.turmaId, acessoTurma.turmaId)` já fixa o ano, porque a turma é de um ano só e a FK composta `(escola_id, ano_letivo_id, turma_id)` do vínculo e do acesso o prende a ela |
| `ciclo-de-vida.repository.ts` › `travarContraOGerarDoProfessor` › `eq(vinculo.turmaId, turma.id)` | `apps/api/test/ciclo-de-vida.int.test.ts` › "borda (F3, tarefa 1.0): a eliminação trava só as turmas em que o usuário é professor; a do vínculo de aluno e a turma em que ele não tem vínculo ficam livres" (a outra turma do ano travada; trecho novo, 2ª rodada) |
| `ciclo-de-vida.repository.ts` › `travarContraOGerarDoProfessor` › `eq(vinculo.anoLetivoId, turma.anoLetivoId)` | nenhum: **não observável**, pelo mesmo motivo: `eq(vinculo.turmaId, turma.id)` já fixa o ano |
| `conta-global.repository.ts` › `limparContaSemUso` › `isNotNull(conta.email)` | `apps/api/test/ciclo-de-vida.int.test.ts` › "borda (F3, tarefa 1.0): eliminar quem já foi desativado, com a conta já limpa, não a limpa de novo…" (teste novo) |
| `ciclo-de-vida.service.ts` › `#naTransacao` › `rodar(transacao)` sem ponto de salvamento (trocado por `transacao.transaction(rodar)`) | nenhum: **não observável** pelo resultado. Com ou sem ponto de salvamento, o erro sobe e quem chama desfaz tudo; a diferença é só o custo de subtransações no lote da noite (divergência 4), que não se mede em teste de integração |
| `ciclo-de-vida.repository.ts` › `revogarDeQuemSaiu` › `notExists(vinculoQueSegura)` | `apps/api/test/acesso-fim-do-vinculo.int.test.ts` › "o acesso continua se o professor ainda tem outro vínculo confirmado na turma…" |
| `ciclo-de-vida.repository.ts` › `revogarDeQuemSaiu` › `eq(vinculo.estado, 'confirmado')` | `apps/api/test/acesso-fim-do-vinculo.int.test.ts` › "encerrar o último vínculo do professor na turma revoga…" (por desligamento e por realocação) e os de isolamento |
| `ciclo-de-vida.repository.ts` › `revogarDeQuemSaiu` › `turmaId === undefined ? undefined : eq(acessoTurma.turmaId, turmaId)` | `apps/api/test/acesso-fim-do-vinculo.int.test.ts` › "repository (F3, tarefa 1.0): com a turma, a revogação de quem saiu não alcança o acesso dele em outra turma…" (teste novo) |
| `ciclo-de-vida.repository.ts` › `revogarDeQuemSaiu` › `eq(acessoTurma.criadoPor, usuarioId)` | `apps/api/test/acesso-fim-do-vinculo.int.test.ts` › "o acesso não cai quando quem sai não é quem o gerou…" |
| `ciclo-de-vida.repository.ts` › `revogarDeQuemSaiu` › `eq(acessoTurma.escolaId, escolaId)` | `apps/api/test/acesso-fim-do-vinculo.int.test.ts` › "isolamento no repository: no contexto da escola A…" |
| `ciclo-de-vida.repository.ts` › `revogarDeQuemSaiu` › `gt(acessoTurma.expiraEm, sql`now()`)` | `apps/api/test/acesso-fim-do-vinculo.int.test.ts` › "o acesso vencido de quem saiu não é revogado de novo…" |
| `packages/nucleo/src/ciclo-de-vida/conta-global.repository.ts` › `limparContaSemUso` › `or(isNull(usuario.desativadoEm), exists(conviteValido))` (trocado por `isNull(usuario.desativadoEm)`) | `apps/api/test/ciclo-de-vida.int.test.ts` › "borda: a conta com um convite ainda válido em outra escola não é limpa…" |
| `conta-global.repository.ts` › `limparContaSemUso` › `this.encerrarSessoesDaConta(contaId, 'conta_limpa')` | `apps/api/test/ciclo-de-vida.int.test.ts` › "borda (F3, tarefa 1.0): limpar a conta encerra também a sessão aberta que tenha escapado…" (teste novo) |
| `conta-global.repository.ts` › `travarConta` › o `select … for update` inteiro | `apps/api/test/ciclo-de-vida.int.test.ts` › "concorrência: a mesma conta desativada em A e em B ao mesmo tempo…" |
| `conta-global.repository.ts` › `encerrarSessoesDaConta` › `isNull(sessao.encerradaEm)` | `apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts` › "encerrar as sessões abertas de uma conta desce pelo índice parcial…" |
| `conta-global.repository.ts` › `travarConta` › `@SemEscopo(…)` | `packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.test.ts` › "a ContaGlobalRepository tem só os três métodos…" |
| `ciclo-de-vida.repository.ts` › um `@SemEscopo` posto no `apagarUsuario` | `packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.test.ts` › "a desativação e a eliminação não saem sem escopo…" |
| `apps/api/src/sessao/redefinicao-de-mfa.ts` › `pelaCoordenacao` › `new ContaGlobalRepository(tx).encerrarSessoesDaConta(contaId, 'mfa_redefinido')` | `apps/api/test/mfa.int.test.ts` › "caminho feliz (17.4): o coordenador com sessão aberta tem o MFA redefinido pela coordenação…" e "isolamento (17.4)…" |
| `redefinicao-de-mfa.ts` › `redefinirMfaPeloOperador` › `new ContaGlobalRepository(tx).encerrarSessoesDaConta(contaId, 'mfa_redefinido')` | `apps/api/test/mfa.int.test.ts` › "caminho feliz (17.4): a redefinição pelo operador encerra as sessões abertas da conta em A e em B…" |
| `apps/api/src/estrutura/vinculo.service.ts` › `encerrar` › `new CicloDeVidaRepository(tx).revogarDeQuemSaiu(antes.usuarioId, antes.turmaId)` | `apps/api/test/acesso-fim-do-vinculo.int.test.ts` › "encerrar o último vínculo do professor na turma revoga…" e "isolamento: o encerramento numa escola…" |
| `apps/api/test/arquitetura.test.ts` › `usosDaContaGlobalForaDosCaminhos` › `!CAMINHOS_DA_CONTA_GLOBAL.some(…)` | `apps/api/test/arquitetura.test.ts` › "quem importa a ContaGlobalRepository é exatamente esta lista…" e "reprova o terceiro caminho…" |
| `apps/api/test/arquitetura.test.ts` › `quemUsaAContaGlobal` › `semComentarios(arquivo.texto)` | `apps/api/test/arquitetura.test.ts` › "quem importa…" e "reprova o terceiro caminho…" (o comentário fora dos caminhos) |
| `apps/api/test/arquitetura.test.ts` › `quemUsaAContaGlobal` › `arquivo.caminho !== ARQUIVO_DA_CONTA_GLOBAL` | `apps/api/test/arquitetura.test.ts` › "quem importa a ContaGlobalRepository é exatamente esta lista…" |
| `apps/api/test/arquitetura.test.ts` › `USO_DA_CONTA_GLOBAL` › o ramo `conta-global\.repository` (o arquivo) | `apps/api/test/arquitetura.test.ts` › "reprova o terceiro caminho…" (o `export *` pelo arquivo) |
| `apps/api/test/arquitetura.test.ts` › `USO_DA_CONTA_GLOBAL` › o ramo `@educa\/nucleo\/conta-global` (o subcaminho) | `apps/api/test/arquitetura.test.ts` › "reprova o terceiro caminho…" (o `import * as global` pelo subcaminho, sem o nome da classe) |
| `apps/api/test/arquitetura.test.ts` › `USO_DA_CONTA_GLOBAL` › a âncora dos dois ramos (trocada por `conta-global` solto, como estava na 1ª rodada) | `apps/api/test/arquitetura.test.ts` › "reprova o terceiro caminho…" (o texto inocente `'metrica.conta-global.limpas'`; recomendação do `tenancy-guardian`) |
| terceiro caminho real: `export { ContaGlobalRepository } from '@educa/nucleo/conta-global'` no `vinculo.service.ts` | `apps/api/test/arquitetura.test.ts` › "quem importa a ContaGlobalRepository é exatamente esta lista…" |
| `packages/nucleo/src/index.ts` › export da `ContaGlobalRepository` no barrel | `apps/api/test/arquitetura.test.ts` › "nem o barrel do @educa/nucleo nem o subcaminho do ciclo de vida exportam…" |
| `packages/nucleo/src/ciclo-de-vida/index.ts` › `export { ContaGlobalRepository as Conta }` | `apps/api/test/arquitetura.test.ts` › "nem o barrel… com o nome dela ou outro" |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `tenancy-guardian`, 1ª | tipar `travarConta` e `limparContaSemUso` para exigir `TransacaoBanco` | recusada nesta tarefa: o construtor aceita `Banco` ou `TransacaoBanco`, como aceitava na `ResolucaoDeTenantRepository`, e a tarefa é mover sem mudar comportamento. Os dois só são chamados dentro do `#naTransacao`. Fica para a 14.0, a primeira que chama o ciclo de vida de outro lugar (o worker), que decide se a restrição entra |
| `test-engineer`, 3ª | a frase do JSDoc do `CicloDeVidaService` ("quem elimina em lote usa uma transação por titular") precisa de teste quando o lote existir: um titular falha no meio e os outros continuam eliminados | para a tarefa que cria o lote de `pessoa_desativada` (5.0, subtarefa 5.3), que é quem escreve esse lote; hoje não há lote para testar |
| `test-engineer`, 2ª | separar o teste do colega em dois `it` (encerrar e eliminar) se um dia a revogação da eliminação ganhar consulta própria | condicional a uma mudança que não existe: hoje os dois caminhos usam a mesma `revogarDeQuemSaiu`, e o próprio revisor diz que basta. Fica para a tarefa que der à eliminação uma revogação própria |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-05 16:58:16 | 2026-10-05 17:03:23 | `test-engineer` | 1 | REPROVADO | abafb9fd94a06cb7c |
| 2026-10-05 17:18:01 | 2026-10-05 17:19:18 | `test-engineer` | 2 | APROVADO | a951e62d88e744f88 |
| 2026-10-05 17:19:43 | 2026-10-05 17:20:41 | `tenancy-guardian` | 1 | APROVADO | ab211a5dc3c545d1a |
| 2026-10-05 17:19:50 | 2026-10-05 17:20:47 | `privacy-guardian` | 1 | APROVADO | a28a00354e55ca658 |
| 2026-10-05 17:19:36 | 2026-10-05 17:21:02 | `revisor-geral` | 1 | APROVADO | a1042a8aadc0ffa1f |
| 2026-10-05 17:33:52 | 2026-10-05 17:34:53 | `test-engineer` | 3 | APROVADO | a6b63887d3b8e6608 |
| 2026-10-05 17:46:43 | 2026-10-05 17:47:09 | `revisor-geral` | 2 | APROVADO | a6a7962e1fb384c95 |

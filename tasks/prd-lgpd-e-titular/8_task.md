# Tarefa 8.0 — A escola vê as empresas que recebem dados dela

**Funcionalidade:** lgpd-e-titular · **Depende de:** 2.0 · **Paralelo com:** 3.0 a 7.0, 9.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A operação cadastra e encerra suboperadores por comando, e a coordenação vê, na aba "Empresas que recebem dados", os vigentes e os passados da escola dela.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3, 4 (`GET suboperadores`) e 6 (consultas sem escopo, repositórios da escola)
- `docs/modelo-de-dados.md`, "Operação Turmma"
- Código: `apps/api/src/ops/*`, `apps/api/test/arquitetura.test.ts` (`TABELAS_DA_OPERACAO`, `QUEM_PODE_TOCAR_A_OPERACAO`)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 8.1 — Migration própria: `suboperador` (chave única onde `fim is null`), `suboperador_escola`
- [x] 8.2 — `OperacaoPrivacidadeRepository` e `ops:suboperador` (cadastrar, encerrar), com auditoria da operação
- [x] 8.3 — `SuboperadorDaEscolaRepository` (só leitura, `exists` correlacionado, parênteses) e `GET suboperadores`
- [x] 8.4 — Aba "Empresas que recebem dados"
- [x] 8.5 — Arquitetura e `docs/modelo-de-dados.md`
- [x] 8.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration e schemas | novo |
| `apps/api/src/ops/suboperador.ts` e repositório | novo |
| `packages/nucleo/src/titular/suboperador-da-escola.repository.ts` | novo |
| rota e DTO em `privacidade` | alterado |
| aba na web e e2e | novo |
| `arquitetura.test.ts`, `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| comando | integração | cadastra e encerra com auditoria; encerrado fica no histórico; chave encerrada recadastra |
| isolamento | integração | B não vê o `lista` só de A e vê o `todas`; S2 só de B não aparece em A (sem a correlação, quebra) |
| passado | integração | ligação com `fim` aparece como passada |
| arquitetura | unidade | caminho fora da lista falha; o repositório da escola não escreve |
| concorrência | integração [P] | dois cadastros da mesma chave: o único deixa um |
| estados | e2e | quatro estados, `chromebook` e `celular`, acessibilidade |
| permissão | integração | aluno e professor recebem 404 e a coordenação sem MFA recebe 401 em GET /v1/privacidade/suboperadores (o caso genérico de retencao.int.test.ts, que percorre as rotas de /v1/privacidade e agora exige a rota nova na lista) |

## Como testar

- **comando, passado, isolamento:** molde de `apps/api/test/retencao.int.test.ts` (`rodar`, `bancada.escolaComSessao('coordenador')`, `chamar`), com `› isolamento: o ajuste em A não muda o GET de B`. Auditoria: `apps/api/test/ops-operador.int.test.ts › C4`. Ponha o comando na lista de `› C2`: a 2.0 reprovou por faltar.
- **concorrência:** `retencao.int.test.ts › concorrência: dois ajustes da mesma escola…` (`GatilhoDeParada` no `insert` de `suboperador`, `esperarNaTrava`), nunca `Promise.all` solto.
- **arquitetura:** `apps/api/test/arquitetura.test.ts › só o OperadorRepository e o expurgo tocam as seis tabelas` e `› reprova o repository que importa outra tabela…`.
- **e2e:** `e2e/privacidade.spec.ts › os estados: carregando, erro…` (`portao`, `page.route`, `criarEquipeComSenha`, `violacoesGraves`); semeie como `ajustarRetencaoDaEscola` (`e2e/__fixtures__/sessao.ts`).
- Armadilha: `suboperador` é global e o banco acumula. Chave aleatória por teste; afirme só sobre as chaves criadas. Um `todas` alheio aparece em toda escola: o vazio não sai do banco (sem precedente; `rota.fulfill`).
- Rodar: `npx vitest run --project integracao <arquivo>`; `node tools/ci/e2e.ts --manter-ambiente e2e/<arquivo>.spec.ts`.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --e2e)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O compartilhamento do titular (12.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| A auditoria de `suboperador.cadastrado` e `suboperador.encerrado` é **sem escola**: o check da `auditoria` passou de `auditoria_escola_ou_rede_pelo_operador` a `auditoria_escola_ou_operacao_global` (aceita sem escola a rede e o `suboperador`, só por operador), e o `RegistroDeAuditoria` ganhou `ENTIDADES_DE_AUDITORIA_SEM_ESCOLA` | A Tech Spec diz "auditoria da operação" e que o comando abre o contexto de cada escola para a ligação, mas `todas` não tem ligação: uma linha em cada escola existente a cada cadastro seria uma escrita por escola, sem fim. Há o precedente da rede, sem escola, por operador | `techspec.md` §3 (bloco das migrations, linha `auditoria`) e §6 ("Tarefa 8.0, como ficou no código"); `cenarios.md` RF6; `docs/modelo-de-dados.md` ("Os suboperadores"). Migration 0029, mais larga que o check anterior: compatível com o código anterior |
| A auditoria não leva a `chave` do suboperador: `depois` é `{ alcance, escolas }` e `{ ligacoesEncerradas }`, `antes` é `{ alcance }` | O mapa de ações recusa texto livre (`textoDeIdOuData`): só id, data, enum e número. A chave, o nome e o contrato ficam na tabela, pelo `entidade_id` | `techspec.md` §6 e §7; `cenarios.md` RF6; `docs/modelo-de-dados.md` |
| As duas tabelas do suboperador formam um **grupo à parte** no teste de arquitetura, em vez de entrarem em `TABELAS_DA_OPERACAO` e `QUEM_PODE_TOCAR_A_OPERACAO` | Os testes das seis tabelas do operador afirmam que só o `OperadorRepository` e o expurgo as tocam e que o `OperadorRepository` não toca outra; misturar os grupos os enfraqueceria. O grupo novo tem a mesma cerca: o escritor e o leitor (só leitura) são os únicos | `techspec.md` §6 ("Tarefa 8.0"); `cenarios.md` "arquitetura" da fatia 2 |
| Formatos fechados que a Tech Spec não dizia: `chave` no formato do `IA_PROVEDOR_ID`; `categorias` numa lista fechada de oito; `pais` o código ISO de duas letras; `contrato` um código curto, nunca texto; chave primária `(escola_id, suboperador_id)` e índice por `suboperador_id` na ligação | A Tech Spec só lista as colunas. A `chave` igual ao `IA_PROVEDOR_ID` é o que deixa o compartilhamento (12.0) casar uma chamada com o suboperador; texto livre de contrato não entra (regra 20) | `techspec.md` §3 (bloco das migrations); `docs/modelo-de-dados.md`; `packages/shared/src/privacidade/suboperador.ts` |
| O DTO traz a `chave` (além de nome, finalidade, país, categorias, veda treinamento e vigência) | É o que distingue as linhas na tela quando a mesma empresa saiu e voltou (chave mais início); não é segredo nem id | `techspec.md` §6 ("Tarefa 8.0"); `cenarios.md` RF7 |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `suboperador-da-escola.repository.ts` › `daEscola` › `eq(suboperador.alcance, 'todas')` do `or` (sai) | `suboperador.int.test.ts` › RF7, isolamento; › o que a escola lê; › passado |
| `suboperador-da-escola.repository.ts` › `daEscola` › correlação do `exists`: `eq(outra.suboperadorId, suboperador.id)` (sai; fica só a escola) | `suboperador.int.test.ts` › RF7, isolamento (o suboperador só de B aparece em A, que tem outra ligação) |
| `suboperador-da-escola.repository.ts` › `daEscola` › escola do `exists`: `eq(outra.escolaId, escolaId)` (sai; fica só o suboperador) | `suboperador.int.test.ts` › RF7, isolamento |
| `suboperador-da-escola.repository.ts` › `daEscola` › `left join` com `eq(ligacao.escolaId, escolaId)` (sai) | `suboperador.int.test.ts` › RF7, passado; › vigência da escola |
| `suboperador-da-escola.repository.ts` › `daEscola` › `left join` com `eq(ligacao.suboperadorId, suboperador.id)` (sai) | `suboperador.int.test.ts` › RF7, passado |
| `suboperador-da-escola.repository.ts` › `maisCedo` › `a.getTime() <= b.getTime() ? a : b` (invertido) | `suboperador.int.test.ts` › RF7, vigência da escola |
| `suboperador-da-escola.repository.ts` › `maisCedo` › `if (a === null || b === null) return a ?? b` (devolve nulo) | `suboperador.int.test.ts` › RF7, passado; › vigência da escola |
| `suboperador-da-escola.repository.ts` › `daEscola` › `inicio: linha.inicioDaLigacao ?? linha.inicioDoSuboperador` (só o do suboperador) | `suboperador.int.test.ts` › RF7, vigência da escola |
| `suboperador-da-escola.repository.ts` › `daEscola` › `orderBy(asc(nome), …)` (sai o nome) | `suboperador.int.test.ts` › RF7, o que a escola lê (Alfa nasce antes de Zeta) |
| `suboperador-da-escola.repository.ts` › `daEscola` › `orderBy(…, desc(inicio))` (sai o início) | `suboperador.int.test.ts` › RF7, a ordem (gravados do mais antigo ao mais novo); › passado |
| `operacao-privacidade.repository.ts` › `cadastrar` › `onConflictDoNothing()` ← o alvo e o predicado que a primeira versão levava eram redundantes (a mutação sobreviveu): saíram do código, e a prova da unicidade é o índice, na concorrência | `suboperador.int.test.ts` › concorrência: dois cadastros; › banco: duas vigentes |
| `operacao-privacidade.repository.ts` › `travarVigente` › `isNull(suboperador.fim)` (sai) | `suboperador.int.test.ts` › RF6 (encerrar de novo dá `NAO_ENCONTRADO`); › concorrência: dois encerramentos |
| `operacao-privacidade.repository.ts` › `travarVigente` › `.for('no key update')` (sai) | `suboperador.int.test.ts` › concorrência: dois encerramentos (o segundo não espera na trava) |
| `operacao-privacidade.repository.ts` › `encerrarLigacoes` › `isNull(suboperadorEscola.fim)` (sai) | `suboperador.int.test.ts` › RF7, passado (a ligação de A, já encerrada, muda de `fim`, e a contagem passa de 1 a 2); › RF6, lista |
| `operacao-privacidade.repository.ts` › `encerrarLigacoes` › `eq(suboperadorEscola.suboperadorId, suboperadorId)` (sai) | `suboperador.int.test.ts` › RF6, lista (a ligação do outro suboperador da escola fecha junto) |
| `operacao-privacidade.repository.ts` › `ligarEscola` › `escolaId: exigirEscolaDoContexto()` (uma escola fixa) | `suboperador.int.test.ts` › RF6, lista; › RF7, isolamento |
| `suboperador.ts` › `cadastrarSuboperador` › `if (suboperadorId === undefined) throw CONFLITO` (sai) | `suboperador.int.test.ts` › RF6: já há vigente; › concorrência: dois cadastros |
| `suboperador.ts` › `cadastrarSuboperador` › `if (… nome() === undefined) throw NAO_ENCONTRADO` da escola da lista (sai) | `suboperador.int.test.ts` › RF6: escola inexistente |
| `suboperador.ts` › `encerrarSuboperador` › `if (vigente === undefined) throw NAO_ENCONTRADO` (sai) | `suboperador.int.test.ts` › RF6; › concorrência: dois encerramentos |
| `suboperador.ts` › `encerrarSuboperador` › `ligacoesEncerradas = await repositorio.encerrarLigacoes(…)` (fixo em 0) | `suboperador.int.test.ts` › RF6, lista; › RF7, passado |
| `suboperador.ts` › `cadastrarSuboperador` › `depois: { alcance, escolas: pedido.escolas.length }` (escolas fixo em 0) | `suboperador.int.test.ts` › RF6, lista |
| `suboperador.ts` › `lerPedidoDeSuboperador` › `todas === (valores.escolas !== undefined)` (sai: nem os dois, nem nenhum recusados) | `suboperador.int.test.ts` › argumento fora do formato |
| `suboperador.ts` › `esquemaNomeDaEmpresa` › `.trim()` (sai); `SEM_CONTROLE` (aceita qualquer coisa) | `suboperador.int.test.ts` › argumento fora do formato (nome só de espaços; tabulação; campainha na finalidade) |
| `suboperador.ts` › `listaDe` › `new Set(itens)` e `toLowerCase()` (saem) | `suboperador.int.test.ts` › RF6, lista (a mesma escola em minúscula e em maiúscula conta uma) |
| `suboperador.ts` › `esquemaEscolas` › `.max(MAXIMO_DE_ESCOLAS)`; `esquemaPais`, `esquemaContrato`, `esquemaFinalidade` (`.max`), `esquemaCategorias` (`z.enum`) e o `sobra` do `encerrar` (cada um, solto) | `suboperador.int.test.ts` › argumento fora do formato |
| `registro-de-auditoria.ts` › `gravar` › `ENTIDADES_DE_AUDITORIA_SEM_ESCOLA.includes(definicao.entidade)` (só `'rede'`) e `&& autorOperador !== null` (sai) | `auditoria.int.test.ts` › o suboperador cadastrado ou encerrado…; › a rede criada pelo operador é o único registro sem escola |
| `0029_suboperador.sql` › `auditoria_escola_ou_operacao_global` (o check antigo, só da rede) | o banco de teste não aceita o check antigo: as linhas de `suboperador` sem escola que os testes gravaram o violam (verificado à mão, numa transação desfeita); `auditoria.int.test.ts` › escola nula com operador é aceita para a rede e para o suboperador |
| `privacidade.controller.ts` › `suboperadores` › `@Get('suboperadores')` (sai) | `retencao.int.test.ts` › permissão: … (`arrayContaining` das rotas) |
| `privacidade.controller.ts` › `suboperadores` › `@Header('Cache-Control', 'no-store')` (sai) | `suboperador.int.test.ts` › RF7, o que a escola lê |
| `arquitetura.test.ts` › o escritor importa `conta`; o leitor ganha um `update`; `@SemEscopo` de `encerrarLigacoes` sai; `@SemEscopo` entra em `travarVigente` | `arquitetura.test.ts` › o repositório da escola não escreve…; › o único @SemEscopo é o encerramento das ligações |
| `EmpresasQueRecebemDados.tsx` › `vigentes` sem filtro (`() => true`) e `{true && (` na seção das passadas | `privacidade.spec.ts` › as empresas…: a coordenação lê as vigentes e as passadas; › os estados (chromebook e celular) |
| `EmpresasQueRecebemDados.tsx` › `{vigentes.length === 0 ? (` → `{false ? (` | `privacidade.spec.ts` › as empresas…: os estados (vazio); › a coordenação lê as vigentes (chromebook) |
| `textos-dos-suboperadores.ts` › `textoDoPais`, `textoDasCategorias`, `textoDaVigencia`, `textoDoTreinamento` | `textos-dos-suboperadores.test.ts` (textos exatos, `ZZ` e o código inválido) |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | O detector `tabelasDeForaNoRepository` do leitor só enxerga import de `@educa/nucleo` ou de `schema/operador|suboperador`, não de caminho relativo | `TODO.md`: exige reescrever o detector de imports do teste de arquitetura, não cabe em poucas linhas; a regra exigida ("o leitor não escreve") está provada |
| test-engineer (1ª) | `violacoesGraves` e `larguraExcedente` só rodam no estado com dado; vazio, erro e "só passadas" ficam sem eles | `TODO.md`: é o mesmo precedente da aba de retenção; afeta os dois e2e juntos e o portão completo roda o e2e inteiro |
| test-engineer (1ª) | O caminho `ERRO_INTERNO` com `resumirErro` de `suboperador.ts` não tem teste de que o erro cru do Postgres não vaza valor | `TODO.md`, junto dos outros `ops:*`, que têm o mesmo padrão sem esse teste |
| test-engineer (1ª) | `auditoria.int.test.ts › escola nula com operador é aceita…` só afirma que não lança | Recusada: as linhas de `suboperador` sem escola já são afirmadas em `› o suboperador cadastrado ou encerrado…` e `› a rede criada pelo operador é o único registro sem escola` (tabela "Mutações", linha do `registro-de-auditoria.ts`) |
| frontend-reviewer (1ª) | "IP" em `packages/shared/src/privacidade/suboperador.ts:42` | Recusada: é o mesmo texto de `retencao.ts` (a tela de retenção já o usa) e `textos-dos-suboperadores.test.ts` o afirma por extenso; trocar um sem o outro cria dois textos para a mesma coisa. Se o Joaquim quiser, mudar os dois numa tarefa de texto |
| frontend-reviewer (1ª) | Selo de treinamento na família `pendente` (relógio) | Recusada: a tela só tem as famílias do `SeloDeEstado` existente, e o e2e e `textos-dos-suboperadores.test.ts` afirmam o selo; é escolha visual, não defeito |
| frontend-reviewer (1ª) | Frase de saída no estado vazio; título da coluna como pergunta | Recusadas: o próprio revisor as chama de aceitáveis numa aba só de leitura; mudariam texto afirmado no e2e |
| tenancy-guardian (1ª) | `daEscola` lê a tabela `suboperador` inteira a cada GET | Recusada: a tabela é da operação e tem poucas linhas; reavaliar se passar de algumas centenas |
| privacy-guardian (1ª) | FK `suboperador_escola.escola_id` com `ON DELETE no action` trava a eliminação de tenant | `TODO.md`: a rotina de eliminação da escola (fim de contrato) precisa tratar a ligação |
| privacy-guardian (1ª) | Teste que compare `ENTIDADES_DE_AUDITORIA_SEM_ESCOLA` com o check da migration | Recusada: os testes de auditoria cobrem os dois lados hoje; quem acrescentar a terceira entidade quebra um deles |
| privacy-guardian (1ª) | 12.0 deve casar `consumo_ia.provedor` com o suboperador vigente na data da chamada, não o de hoje | Tarefa 12.0 (`tasks/prd-lgpd-e-titular/12_task.md`, contexto necessário) |
| test-engineer (2ª), privacy-guardian (2ª) | Teste que fixe o conjunto de índices únicos de `suboperador`, para o risco aceito do `on conflict do nothing` sem alvo (techspec §6) quebrar a esteira em vez de depender de alguém lembrar | `/retro` do F3; muda só teste, mas é prova nova de um risco já aceito e registrado, não defeito desta tarefa |
| revisor-geral (1ª) | Vigência anterior à existência da escola: o `todas` encerrado antes de a escola nascer aparece como passada, e o vigente mostra "Desde" anterior à escola | Muda comportamento e é lacuna da Tech Spec, não da implementação: vai ao Orquestrador para decidir (limitar a data ao início da escola ou omitir) antes da 12.0 |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-09 12:44:15 | 2026-10-09 12:46:58 | `test-engineer` | 1 | REPROVADO | af9389d06f0b1a79c |
| 2026-10-09 12:47:24 | 2026-10-09 12:48:11 | `frontend-reviewer` | 1 | APROVADO | ac42b3d42093094ca |
| 2026-10-09 12:47:13 | 2026-10-09 12:48:16 | `tenancy-guardian` | 1 | APROVADO | a602eafbdab7418bc |
| 2026-10-09 12:47:18 | 2026-10-09 12:48:18 | `privacy-guardian` | 1 | APROVADO | a4eea40b743a5a4e0 |
| 2026-10-09 12:47:08 | 2026-10-09 12:49:04 | `revisor-geral` | 1 | REPROVADO | a5f4f70fbf50fef57 |
| 2026-10-09 12:56:10 | 2026-10-09 12:56:30 | `test-engineer` | 2 | APROVADO | a2b86f26b2b3255f0 |
| 2026-10-09 12:56:41 | 2026-10-09 12:57:01 | `revisor-geral` | 2 | APROVADO | a9f2d8223c46ec031 |
| 2026-10-09 12:56:47 | 2026-10-09 12:57:04 | `tenancy-guardian` | 2 | APROVADO | a2ce949ccb369bb85 |
| 2026-10-09 12:57:00 | 2026-10-09 12:57:13 | `frontend-reviewer` | 2 | APROVADO | af7209d980e8ea832 |
| 2026-10-09 12:56:53 | 2026-10-09 12:57:15 | `privacy-guardian` | 2 | APROVADO | ad5a310956f610bf7 |

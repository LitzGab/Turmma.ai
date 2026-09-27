# Tarefa 12.0 — Web: seletor de escola (P30) com o contrato de `/v1/eu`, e a "Minha turma" do aluno

**Funcionalidade:** apresentacao-escola · **Depende de:** 11.0, 8.0 · **Paralelo com:** 9.0, 10.0, 13.0, 14.0, 15.0
**Subagentes obrigatórios:** `frontend-reviewer`, `tenancy-guardian`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Quem tem vínculo em mais de uma escola troca de escola pelo seletor no topo da lateral, e nenhuma requisição, resposta
ou cache depois da troca traz dado da escola anterior; o aluno aprovado vê a própria turma, sem colegas.

## Contexto necessário

- `docs/interface.md` 11.1 (o seletor) e `docs/pendencias-dos-mockups.md`, P30
- `techspec.md` seções 4 (`minha-turma`), 9 ("Seletor") e 11 (regra 50: sem sigla, turno nem número de turmas)
- `cenarios.md`: W3, W13, W4 (linha "Minha turma"), W12
- Regras 10 (itens 3, 8), 20 (item 4), 50
- Código:
  - `packages/shared/src/sessao/eu.ts` (`esquemaAcessoDaConta`: hoje `usuarioId`, `escolaNome`, `papel`)
  - `apps/api/src/sessao/eu.repository.ts`, `eu.service.ts`, `eu.repository.int.test.ts`; o `@SemEscopo` da
    `ResolucaoDeTenantRepository` que lista as escolas da conta (a justificativa cita os campos: muda junto)
  - `apps/web/src/componentes/SeletorDeEscola.tsx`, `apps/web/src/api/sessao.ts` (`trocarDeEscola`),
    `apps/web/src/main.tsx` (o `resetQueries` que já existe)
  - `e2e/escola-e-vinculos.spec.ts` — a troca de escola do F1 e as fixtures de professor em duas escolas
  - `GET minha-turma` (8.0)

## Subtarefas

- [x] 12.1 — `/v1/eu`: cada acesso ganha o nome da rede, ao lado da escola e do papel; nada mais (sem número de
  turmas, sem dado de dentro da outra escola). A justificativa do `@SemEscopo` acompanha
- [x] 12.2 — Seletor no topo da lateral, no formato de espaço de trabalho da 11.1, com a marca de escolhido; com uma
  escola só, mostra o nome e não abre. A troca só faz `resetQueries` depois de o token novo estar em uso
- [x] 12.3 — "Minha turma" na área do aluno: escola, turma e série; nunca vazia; linha na tabela de navegação
- [x] 12.4 — Teto do chunk `aluno-*` no `.size-limit.json`
- [x] 12.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/sessao/eu.ts`; `apps/api/src/sessao/eu.repository.ts`, `resolucao-de-tenant.repository.ts` | alterado |
| `apps/api/src/sessao/eu.repository.int.test.ts` | alterado |
| `apps/web/src/componentes/SeletorDeEscola.tsx`, `apps/web/src/api/sessao.ts` | alterado |
| `apps/web/src/areas/aluno/MinhaTurma.tsx`, `apps/web/src/api/minha-turma.ts`, `areas/navegacao.ts` | novo, alterado |
| `.size-limit.json`, `e2e/troca-de-escola.spec.ts`, `e2e/minha-turma.spec.ts` | alterado, novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| contrato de `/v1/eu` | integração | cada acesso com escola, rede e papel, e nenhum outro campo; nada da outra escola (número de turmas, nomes) |
| W3 | e2e | o professor de A e B troca para B: depois da troca, nenhuma requisição leva o token de A, nenhuma resposta traz id de A, e o cache do TanStack não guarda chave de A |
| W13 | e2e | escola, rede e papel, sem número de turmas; com uma escola, mostra o nome e não abre |
| W4 (Minha turma) | e2e | carregando, com dado e erro com a rota interceptada; nunca vazia |
| W12 (Minha turma, seletor) | e2e | 360 px sem rolagem; alvos de 44 px; o seletor abre e escolhe só com teclado |
| recomeço da tela | e2e | segunda pessoa: sai o professor de A e B, entra o aluno na mesma aba, sem seletor nem cache do anterior; mesma entrada: escolher a escola em que já se está não troca o token; resposta atrasada: a lista de A que chega depois da troca não aparece em B; falha com o seletor aberto: a troca recusada mostra o aviso, e o aviso e o foco saem ao reabrir |
| log novo | — | a tarefa não escreve log |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [x] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral` e os guardiões, com
  rodada que vale para o código atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Sigla, turno e número de turmas (seção 11); o calendário que junta escolas (F8).

## Divergências resolvidas nesta tarefa

Registradas também na `techspec.md`, seção 9 ("Decidido na 12.0"), no `cenarios.md` (W4, W13) e em `docs/interface.md` 11.1.

- **O seletor deixa o `details` e vira um botão com `aria-expanded` que abre uma lista** (padrão de divulgação, sem setas).
  O `details` não fecha no Esc e não leva o foco a lugar nenhum; o "abre e escolhe só com teclado" do W12 pede as duas
  coisas. Abrir leva o foco à escola de agora; o Esc fecha só a lista, e dentro da gaveta não fecha a gaveta junto.
- **A lista traz todos os acessos da conta, a escola de agora com a marca de escolhido** (ícone e `aria-current`), e não só
  as outras: é o "marca de escolhido" da 11.1. Escolher a de agora fecha a lista, sem `POST /v1/sessao/escola` nem token
  novo (o "mesma entrada" do recomeço da tela).
- **Linhas em `aria-disabled` durante a troca, e não `disabled`**: desabilitar a linha com o foco o jogava no `body`. Com
  isso a guarda da troca no ar é a única trava do toque repetido, e ganhou teste (dois toques, uma troca).
- **Nome acessível explícito** em cada linha e no botão ("escola, rede · papel"; "Escola: …" no botão): o nome calculado
  pelo conteúdo colaria a escola na rede.
- **Com uma escola só, o nome sem a rede**: o aluno não tem `acessos`, e o `/v1/eu.escola` não traz a rede; a 12.1 põe a
  rede só nos acessos, e nada mais entra no contrato.
- **A etapa `escolher` do login também leva `redeNome`**: é o mesmo `esquemaAcessoDaConta`. A tela da escolha continua
  com escola e papel; os testes dela não mudam.
- **"Minha turma" com `NAO_ENCONTRADO`** (sem vínculo confirmado no ano em curso: a virada, ou o aluno sem turma) mostra
  "Você ainda não está em uma turma neste ano letivo. Fale com o seu professor ou com a coordenação.", sem "Tentar de
  novo". É um estado a mais, com teste próprio; os outros erros são o `EstadoErro`.
- **A página inicial do aluno aponta para "Minha turma"** (recomendação do `frontend-reviewer` da 11.0, com destino aqui).
- **`nomeDaSerie` em `packages/shared`** ("2º ano do Ensino Médio"): a Estrutura da 13.0 escreve a mesma série.
- **O teste de contrato fica em `apps/api/test/troca-de-escola.int.test.ts`**, onde o `/v1/eu.acessos` já é provado ponta
  a ponta, e não em `eu.repository.int.test.ts`: os acessos vêm da `ResolucaoDeTenantRepository`, não do `EuRepository`.
- **O W3 lê o cache do TanStack pela árvore do React** (`e2e/__fixtures__/consultas.ts`): nada é exposto no `window` para o
  teste.
- **Teto do `aluno-*`: 5 kB** (mede ~1 kB).
- **Arquivos previstos que não mudaram:** `apps/api/src/sessao/eu.repository.ts` e `eu.repository.int.test.ts` (os acessos
  vêm da `ResolucaoDeTenantRepository`, e o contrato é provado em `troca-de-escola.int.test.ts`, acima); e
  `apps/web/src/api/sessao.ts`, porque o `trocarDeEscola` e o `guardarToken` já limpavam o cache depois do token novo
  (provado pelo W3, com a mutação da ordem).
- **Os e2e que abriam o seletor pelo `summary`** (`escola-e-vinculos`, `areas`, `tokens`) passam pelas peças novas de
  `e2e/__fixtures__/casca.ts`; as fixtures de sessão ganham `redeNome` único por escola, `turmaId` e `vinculoIds` da
  alocação, e `colocarAlunoNaTurma`.

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `apps/api/src/sessao/resolucao-de-tenant.repository.ts:152` (junção da rede pela escola, trocada por uma rede fixa) | `troca-de-escola.int.test.ts` "contrato (A1, 12.0 …)" |
| `apps/api/src/sessao/eu.service.ts:28` (`redeNome` do acesso, trocado por outro valor) | `troca-de-escola.int.test.ts` "contrato (A1, 12.0 …)" |
| `apps/web/src/componentes/SeletorDeEscola.tsx:108` (guarda da escola de agora) | `troca-de-escola.spec.ts` "mesma entrada", nos dois projetos |
| `apps/web/src/componentes/SeletorDeEscola.tsx:106` (guarda da troca no ar) | `troca-de-escola.spec.ts` "falha com o seletor aberto" (duas trocas), nos dois projetos |
| `apps/web/src/componentes/SeletorDeEscola.tsx:93` (`definirFalha(undefined)` ao reabrir) | "falha com o seletor aberto" (o aviso fica), nos dois |
| `apps/web/src/componentes/SeletorDeEscola.tsx:96` (foco na escola de agora ao abrir) | W12 "abre e escolhe só com teclado", nos dois |
| `apps/web/src/componentes/SeletorDeEscola.tsx:101` (foco de volta ao botão ao fechar) | "mesma entrada" e W12, nos dois |
| `apps/web/src/componentes/SeletorDeEscola.tsx:128-129` (`preventDefault`/`stopPropagation` do Esc) | W12 (a gaveta fecha junto), nos dois |
| `apps/web/src/componentes/SeletorDeEscola.tsx:159` (`aria-disabled` trocado por `disabled`) | "falha com o seletor aberto" (o foco cai no `body`), nos dois |
| `apps/web/src/componentes/SeletorDeEscola.tsx:81` (`acessos.length < 2`) | W13 "com uma escola só, mostra o nome e não abre", nos dois |
| `apps/web/src/componentes/SeletorDeEscola.tsx:158` (`aria-current`) | W13 "a de agora marcada", nos dois |
| `apps/web/src/api/sessao.ts:257` (limpeza **antes** do token novo) | W3 (requisição com o token de A depois da troca), nos dois |
| `apps/web/src/main.tsx:27` (sem o `resetQueries`) | W3, "resposta atrasada" e "segunda pessoa", nos dois |
| `apps/web/src/areas/aluno/MinhaTurma.tsx:34-39` (ramo do `NAO_ENCONTRADO`) | `minha-turma.spec.ts` "sem turma no ano", nos dois |
| `apps/web/src/paginas/Inicio.tsx:25` (o próximo passo do aluno) | `areas.spec.ts` "o aluno vê só Minha turma", nos dois |
| `apps/web/src/areas/navegacao.ts:24` (o item do aluno) | `navegacao.test.ts` W2 |
| `packages/shared/src/estrutura/serie.ts:23` (etapa lida da série) | `serie.test.ts` |
| `.size-limit.json:35` (teto de 5 kB do `aluno-*`) | `tamanho-web.test.ts` (o teto declarado e o `aluno-*` acima de 5 kB) |
| `apps/web/src/componentes/SeletorDeEscola.tsx:181` (`role="status"` da troca no ar) | "falha com o seletor aberto", nos dois |
| `apps/web/src/areas/aluno/MinhaTurma.tsx:36` (`role="status"` do aluno sem turma) | `minha-turma.spec.ts` "sem turma no ano", nos dois |
| `apps/web/src/areas/aluno/MinhaTurma.tsx:47` (o `<h2>` da turma) | `minha-turma.spec.ts` "carregando, com dado", nos dois |
| `apps/web/src/main.tsx:27` (sem o `resetQueries`), com dois alunos | `minha-turma.spec.ts` "segunda pessoa", nos dois |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| spec, rodadas 1 a 5 | O seletor segue a 11.1 no lugar (topo da lateral) e na marca de escolhido; o que ela lista e não existe (sigla, turno, turmas) fica fora pela seção 11. Conferir com o Gabriel se o seletor sem esses campos ainda lê como espaço de trabalho | `/validar` |
| `frontend-reviewer` da 11.0, 2ª | A página inicial do aluno com "O que você faz no Turmma aparece aqui nas próximas versões." soa como desculpa | aplicada: aponta para "Minha turma" |
| `test-engineer` da 11.0, 1ª | A tarefa que acrescentar item acrescenta na `NAVEGACAO` e na lista do e2e | aplicada: `ITENS_DO_ALUNO` em `e2e/areas.spec.ts`, percorrida pelo W2 do aluno |
| `test-engineer`, 1ª | Duplo clique de verdade no teste dos dois toques; dois alunos no mesmo Chromebook em "Minha turma"; `/aluno/minha-turma` no lugar de `/aluno/qualquer`; a rede ausente com uma escola só; tirar o `turma` da regex do contrato; medir os 44 px de novo a 360 px | aplicadas, antes da rodada em paralelo |
| `frontend-reviewer`, 1ª | `role="status"` que anuncia "Abrindo …" na troca; `<h2>` no nome da turma; `role="status"` no aviso do aluno sem turma; linha em branco no `areas.spec.ts` | aplicadas, antes da rodada em paralelo, com mutação de cada uma |
| `frontend-reviewer`, 1ª | Foco depois da troca que deu certo, na lateral aberta: o seletor sai com o `resetQueries` e o foco cai no `body` até a página inicial de B | `/validar`: pede levar o foco ao título da página nova depois de toda sessão nova (troca, login por cima), que é da casca e não do seletor |
| `frontend-reviewer`, 1ª | A página inicial da coordenação ainda diz "próximas versões" | 13.0, que aponta para Estrutura |
| `frontend-reviewer`, 2ª | "Abrindo …" pode ser lido duas vezes: pela região de status e pela troca do nome da linha com o foco | `/validar`, como o revisor propôs: conferir com leitor de tela se incomoda; se sim, a linha mantém o nome e só a região anuncia |
| `frontend-reviewer`, 2ª | O aviso do aluno sem turma nasce preenchido dentro do `role="status"`, e o NVDA pode não anunciá-lo | `/validar`, junto da anterior: o contêiner de status fixo na `<section>` da "Minha turma" |
| `revisor-geral`, 1ª | Exportar só o `nomeDaSerie`, e não o `NOME_DA_ETAPA`; uma fonte só para o "Abrindo …" (a escola em troca no estado); dizer na tarefa por que três arquivos previstos não mudaram | aplicadas |
| `privacy-guardian`, 1ª | Registrar na Tech Spec que a etapa `escolher`, antes do segundo fator, expõe só escola, rede e papel; comentar que o `colocarAlunoNaTurma` é atalho do e2e | aplicadas: `techspec.md` seção 9 ("Decidido na 12.0") e o comentário da fixture |
| `test-engineer`, 3ª | `NOME_DA_ETAPA` como `const` interna do `serie.ts` | recusada: o arquivo exporta as tabelas dele (`ETAPAS`, `ANOS_DA_ETAPA`) do mesmo jeito, e o que decide o que sai do pacote é o `index.ts`, que já não a exporta |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-27 11:18:12 | 2026-09-27 11:20:07 | `test-engineer` | 1 | APROVADO | ace3021ff792082d3 |
| 2026-09-27 11:20:20 | 2026-09-27 11:21:43 | `frontend-reviewer` | 1 | APROVADO | add895c7d7673456f |
| 2026-09-27 11:38:43 | 2026-09-27 11:39:36 | `test-engineer` | 2 | APROVADO | ae29540704f2e9fac |
| 2026-09-27 11:39:49 | 2026-09-27 11:40:11 | `frontend-reviewer` | 2 | APROVADO | a7c7e70255678d3ae |
| 2026-09-27 11:40:34 | 2026-09-27 11:41:05 | `tenancy-guardian` | 1 | APROVADO | aa124303b40b4e636 |
| 2026-09-27 11:40:42 | 2026-09-27 11:41:20 | `privacy-guardian` | 1 | APROVADO | a94373c11f25c5d06 |
| 2026-09-27 11:40:27 | 2026-09-27 11:41:55 | `revisor-geral` | 1 | APROVADO | ae9cc98f546a51c27 |
| 2026-09-27 11:53:31 | 2026-09-27 11:53:56 | `test-engineer` | 3 | APROVADO | aa348e4e9b5f31d9d |
| 2026-09-27 11:54:13 | 2026-09-27 11:54:29 | `frontend-reviewer` | 3 | APROVADO | a108dfc0d06b61ef7 |
| 2026-09-27 11:54:42 | 2026-09-27 11:55:02 | `tenancy-guardian` | 2 | APROVADO | ac634c7fb0121cacd |
| 2026-09-27 11:54:47 | 2026-09-27 11:55:03 | `privacy-guardian` | 2 | APROVADO | a6c012d6dfac2b4ae |
| 2026-09-27 11:54:37 | 2026-09-27 11:55:07 | `revisor-geral` | 2 | APROVADO | ae5ddba9353a7caf1 |
| 2026-09-27 11:55:24 | 2026-09-27 11:55:40 | `revisor-geral` | 3 | APROVADO | aa03b34a5e0476cfd |

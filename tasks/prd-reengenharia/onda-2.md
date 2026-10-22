# Tech Spec da X5 — Onda 2: fronteiras

**Comum:** `techspec.md` · **PRD:** RF14, RF15 · **Tarefas:** 30.0 a 41.0

## 1. O que muda

As pastas da P10 se movem, com o comportamento igual. Nascem quatro leituras prontas, e o envio de material ganha
`substitui`, atômico. Sem migration. A tela usa as leituras na onda 4, salvo o prazo do titular e o `substitui`.

## 2. Desenho

### RF14 — o mapa, antes → depois

- **`api/src/credencial/`**, com `index.ts`: de `sessao/`, `hash-de-senha`, `hash-do-token`, `cifra-do-segredo`,
  `segundo-fator`, `cookies`, `cookie-dispositivo`, `contador-de-tentativas`, `desafio`, `seguro-do-login`,
  `configuracao-de-login`, `senha/*`, `credencial-matricula`, `criacao-de-sessao` e `acesso-publico` (repositories),
  `externa/configuracao-externa`, os utilitários da 11.0, `identificadorDoAluno` e `CLIENTE_REDIS_LOGIN`. Nenhum usa a
  Resolução.
- **`sessao/<fluxo>/`**, com `sessao/index.ts`: login e matrícula, conclusão, renovação, mfa e redefinição, convite (com os 3
  casos de uso do operador, que usam a Resolução), externa, troca de escola, saída, atividade, eu, acesso da escola.
- **`sessao/tenant/`**: `resolucao-de-tenant.repository`, `acesso-da-sala`, `escola-sem-usuario`, `sessoes-sinteticas`.
- **`operacao/casos-de-uso/`**: `ops/escola.ts` e `ops/escola.repository.ts` (o painel importava de `ops/`, ao contrário). O
  resto de `ops/*` fica: os `dist/ops/*.js` e `infra/compose.yml:122` não mudam.
- **`api/src/http/paginacao.ts`**: o que a T1 deixou em `estrutura/entrada.ts` (`paginar`, `paginarPor`).
- **`tools/testes/`**: `apps/api/test/{sessao-de-teste,api-com-sessao,configuracao-de-teste,gatilho-de-parada}.ts`,
  `apps/worker/test/fila-de-teste.ts` e o realtime de teste. A 31.0 cria `tools/testes/tsconfig.json` com
  `experimentalDecorators`, no `typecheck`.
- **`apps/web/src/componentes/ui/`** (R47, D81; com `campos/` e `sobrepostos/`, R56): o kit visual (botão, diálogo, aviso, ícones, onça, peças de IA). As peças de domínio (casca,
  sino, pedidos, meus dados, convite, `EstadoErro`) ficam em `componentes/` (R39).

**Os subcaminhos de `exports`** reexportam sem mover arquivo, como `@educa/nucleo/ciclo-de-vida`:
- **`@educa/shared/servidor`**: `permissao/matriz` e `privacidade/classificacao`. Os papéis, `retencao.ts` e as mensagens
  ficam na raiz, porque a web os usa.
- **`@educa/nucleo/db`** (tabelas, enums, `schema`), **`/identidade`**, **`/fila`**, **`/privacidade`** e **`/ia`** (R39,
  com `config-ia.ts`). Pool e `Banco` ficam na raiz.

**As travas.**
- O barril da raiz deixa de exportar o que mudou: o import antigo não compila.
- Na web, `no-restricted-imports` barra `@educa/shared/servidor` e `@educa/nucleo*`.
- No depcruise da 12.0:
  - só `*.repository.ts` importa `@educa/nucleo/db`;
  - `operacao` nunca importa `ops`;
  - fora de `credencial/` e `sessao/`, só se importa delas pelo `index.ts`, em `apps/api/{src,test}`; `e2e/`, `infra/`, `tools/` e `apps/worker` ficam no arquivo, e
    também o arquivo de `apps/api/src` que o e2e carrega (`operacao/token-do-convite.ts`, que importa `credencial/hash-do-token.js`): o Playwright roda o
    `.ts` sem compilar, e o `index.ts` arrastaria a `credencial/` inteira (33.0);
- O kit não importa `api/`, `areas/` nem `sessao/`: `no-restricted-imports` do ESLint, na 36.0 (D81, R56).
- **Os barris não vazam (34.0).** O depcruise não vê o reexport em dois passos (`sessao/index.ts` → `export *` de
  `sessao/tenant/index.ts`). Um teste em execução (molde de `arquitetura.test.ts:122-134`) confere que `Object.values` de `sessao/index.js` e `credencial/index.js` não traz
  `ResolucaoDeTenantRepository` nem `ContaGlobalRepository`, sob qualquer nome; a mutação é o reexport em dois passos.
- O `arquitetura.test.ts` cita a regra, não o caminho.

**Como se move.** Um script descartável sobre `getEditsForFileRename`, uma rodada por tsconfig, com `git mv`. Os testes que
leem caminho como texto (`nome-dos-chunks.ts`, `arquitetura.test.ts`) viram constante antes. Uma tarefa move uma coisa só,
com as supressões da catraca, e roda `grep -rn` do nome antigo no repositório inteiro (já se sabe de
`docs/modelo-de-dados.md:212`, `README.md:35`, `.size-limit.json:33`).

**Ponteiro velho:** `.claude/skills/executar-task/SKILL.md:121,128` vai para a lista da Etapa 9 (R36).

### RF15 — as leituras prontas

**Onde moram.** Módulo novo `apps/api/src/esperando/`, saída `.strict()` em `packages/shared/src/esperando/`. Um recurso
por rota na `MATRIZ`: `esperando_do_professor` só ao professor (`turma_vinculada`), para o backlog dele não chegar à
coordenação (D45, D64); `esperando_da_coordenacao` e `roteiro_da_escola` só à coordenação (`unidade`). O resto, `nunca`.

**`GET /v1/professor/esperando`** devolve `semAnoLetivo`, `turmas[{ turmaId, nome, entregas, pedidosDeNome }]` (vínculo
confirmado, contagem exata, **sem nome de aluno**), `entregas[]` pendentes (até 100, com `entregasHaMais`) e
`vinculosAConfirmar[]`. Os pedidos são um `count … group by turma`, sem `join` com `lista_nome` (o sino deixa
`GET /turmas/:id/reivindicacoes`, com até 100 nomes de menor).
- **O alcance das entregas** é o de `EntregaRepository.#noAlcance` (`entrega.repository.ts:48`):
  `comVinculoConfirmadoDoProfessor` com `disciplinaDaEntrega`. A professora de Matemática não conta a entrega da de Português
  na mesma turma; a mutação tira o filtro de disciplina.
- O vínculo pendente só vai a `vinculosAConfirmar`.

**`GET /v1/coordenacao/esperando`** devolve `semAnoLetivo` e `itens[]`, uma união por `tipo`, cada membro `.strict()`:
`incidente { incidenteId, criadoEm }`, `contestacao { vinculoId, professor: { usuarioId, nome }, turma, disciplina, criadaEm }` (`vinculo.estado = 'contestado'`),
`convite-vencido { usuarioId, nome, venceuEm }` (nome de professor, não de aluno), `material-falhou { materialId, titulo }` e
`turmas-sem-professor { quantidade }`. Cada tipo tem teto de 50, com `haMais[tipo]` (regra 80.8). O texto fica na web.
- **Nenhum item deriva de uso, entrega ou atividade de professor** (regra 70.8 e 70.9): hoje só um comentário
  (`fila-da-coordenacao.ts:21-24`) e um teste da web, que a 79.0 apaga. A 38.0 o prova na API, com dois professores.

**`GET /v1/escola/roteiro`**: `{ anoEmCurso, passos: { serie, disciplina, turma, professor, vinculo }, montada }`.

**"Turma sem professor"** é um `not exists` de vínculo `pendente` ou `confirmado` no ano em curso.
`ESTADOS_QUE_DAO_PROFESSOR` sobe para `shared/estrutura/vinculo.ts`, e `GET /v1/turmas` ganha `semProfessor`, aditivo (R39).

**O que as três rotas provam** (37.0 a 39.0), além de duas escolas: ano em curso ausente, só `planejado` ou só `encerrado`
(`semAnoLetivo`, nunca "tudo em dia" falso); vínculo encerrado ao lado de um aberto, e o do ano anterior na virada; duas
disciplinas na mesma turma contando uma vez. Os testes da web que a 79.0 apaga (`fila-da-coordenacao.test.ts:74-208`,
`SinoDaCoordenacao.test.tsx:159`, `fila-do-professor.test.ts`) vão antes para a API.

**O prazo do titular.** `GET /v1/privacidade/pedidos` e `/:id` trazem `prazo`: `aberto { ate, faltam }`,
`vencido { ate, atraso }`, `concluido` ou `cancelado`.
- Calcula `apps/api/src/privacidade/prazo-do-pedido.ts`, com `diaDeUso(relogio())` (São Paulo).
- Antes, a 40.0 porta para a API, com relógio falso, os casos de `textos-do-pedido.test.ts:50-115` (fim de mês e de ano, o
  dia do vencimento ainda é prazo, a eliminação agendada tem prazo), mais o pedido perto da meia-noite de São Paulo. Só
  então o cálculo sai da web (`textos-do-pedido.ts:28`, `Pedidos.tsx:100`, `DetalheDoPedido.tsx:156`).

**O `substitui`.** `esquemaPedidoEnviarMaterial` ganha `substitui?: uuid`. Em `MaterialService.enviar`, na transação que
trava os envios da escola:
1. `excluirSeFalhou(id)`: update com `estado = 'falhou'`, a escola e não excluído. Sem linha afetada, volta
   `NAO_ENCONTRADO` e a transação desfaz tudo;
2. apaga os trechos, insere o novo material e grava `material.substituido` na auditoria.

O índice único parcial (`material.ts:60`) ignora `falhou`; `DialogoDeEnvioDeMaterial.tsx:115` deixa a segunda chamada.

## 3. Falha

| Peça | O teste |
|---|---|
| Pasta | Import pelo caminho antigo, ou contra regra nova, falha no `tsc` ou no depcruise |
| Leitura | A lista de um tipo acima de 50 volta `haMais`, e o `EXPLAIN` não faz varredura sequencial |
| `substitui` | Duas trocas em `Promise.all`, com arquivos diferentes para o índice não mascarar o update: uma vence |
| `substitui` | A troca grava `material.substituido`, com autor e só ids |
| `substitui` | Id de outra escola, ou material `pronto`, volta `NAO_ENCONTRADO` |
| `substitui` | Reenvio igual a um `pronto` volta `CONFLITO`, e o `falhou` fica |

## 4. Isolamento, dado pessoal, conformidade, carga

- **Isolamento:** cada rota nova tem teste de duas escolas e entra em `matriz.expectativa.ts`.
- **Dado pessoal:** nada novo é gravado. `CapturaDeDadoPessoal` prova o nome do aluno fora da resposta e do log.
- **Conformidade:** o prazo de 15 dias é o da LGPD, art. 19, II (`conformidade-reviewer`).
- **Carga:** ⚠️ o `EXPLAIN` de `vinculo`, `entrega`, `material`, `incidente` e `convite` se confere nas 37.0 e
  38.0; índice que faltar volta ao Arquiteto.

## 5. Tarefas

| # | Título | RF | Depende de | Veto | Porte |
|---|---|---|---|---|---|
| 30.0 | `@educa/shared/servidor` existe, e a web não o importa | 14 | fim da onda 1 (23.0, 25.0, 28.0) | — | pequeno |
| 31.0 | As peças de teste de mais de uma app moram em `tools/testes/` | 14 | 30.0 | infra | grande |
| 32.0 | O `nucleo` tem os subcaminhos `db`, `identidade`, `fila`, `privacidade` e `ia` | 14 | 31.0 | tenancy | grande |
| 33.0 | `credencial/` reúne senha, cookie, hash e desafio | 14 | 32.0 | tenancy, infra | grande |
| 34.0 | `sessao/` só tem fluxos, em subpastas, com `index.ts` | 14 | 33.0 | tenancy, infra | grande |
| 35.0 | `ops/` só tem terminal; casos de uso em `operacao/`, paginação em `http/` | 14 | 34.0 | tenancy | pequeno |
| 36.0 | O kit visual mora em `componentes/ui/` e não importa API, área nem sessão | 14 | fim da onda 1 | — | grande |
| 37.0 | O professor lê o "esperando" numa chamada, sem nome de aluno | 15 | 35.0 | tenancy, privacy | grande |
| 38.0 | A coordenação lê o "esperando" numa chamada, e `turmas` diz quem fica sem professor | 15 | 37.0 | tenancy, privacy, conformidade | grande |
| 39.0 | `GET /v1/escola/roteiro` diz se a escola está montada | 15 | 38.0 | tenancy | pequeno |
| 40.0 | O prazo de 15 dias do titular vem da API | 15 | 39.0, 36.0 | privacy, conformidade | pequeno |
| 41.0 | Trocar o material que falhou é uma transação só (`substitui`) | 15 | 40.0 | tenancy | pequeno |

O tronco é 30.0 a 35.0; a 36.0 é só da web, e corre ao lado; de 37.0 a 41.0, todas mexem em `shared` e vão em série.

## 6. Riscos

`nome-dos-chunks.ts` e o teto de 150 kB dependem dos caminhos: a 36.0 os ajusta.

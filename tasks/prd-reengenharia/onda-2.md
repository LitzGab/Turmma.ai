# Tech Spec da X5 — Onda 2: fronteiras

**Comum:** `techspec.md` · **PRD:** RF14, RF15 · **Tarefas:** 30.0 a 41.0

## 1. O que muda

As pastas da P10 se movem, com o comportamento igual. Nascem quatro leituras prontas, e o envio de material ganha
`substitui`, com troca atômica. Sem migration. A tela usa as leituras só na onda 4, salvo o prazo do titular e o `substitui`.

## 2. Desenho

### RF14 — o mapa, antes → depois

| Antes | Depois | Por quê |
|---|---|---|
| Em `api/src/sessao/`: `hash-de-senha`, `hash-do-token`, `cifra-do-segredo`, `segundo-fator`, `cookies`, `cookie-dispositivo`, `contador-de-tentativas`, `desafio`, `seguro-do-login`, `configuracao-de-login`, `senha/*`, `credencial-matricula.repository`, `criacao-de-sessao.repository`, `acesso-publico.repository`, `externa/configuracao-externa`; os utilitários que a onda 1 extraiu de `login.service`; `identificadorDoAluno` e `CLIENTE_REDIS_LOGIN` | `api/src/credencial/`, com `index.ts` | `operacao`, `sala`, `ops`, `assistente`, `config.ts` e `main.ts` as importam, e nenhuma usa a `ResolucaoDeTenantRepository` |
| Os fluxos: login e matrícula, conclusão, renovação, mfa e redefinição, convite (com os 3 casos de uso do operador), externa, troca de escola, saída, atividade, eu, acesso da escola | `sessao/<fluxo>/`, com `sessao/index.ts` | Só o fluxo fica, atrás da superfície pública |
| `resolucao-de-tenant.repository`, `acesso-da-sala`, `escola-sem-usuario`, `sessoes-sinteticas` | `sessao/tenant/` | Usam a Resolução, cercada por caminho (`arquitetura.test.ts:22`) |
| `ops/escola.ts` e `ops/escola.repository.ts` | `operacao/casos-de-uso/` | O painel (`operacao/painel.service.ts:32`) importa de `ops/`, na direção inversa |
| `estrutura/entrada.ts` (`paginar`, `paginarPor`, o que a T1 deixou) | `api/src/http/paginacao.ts` | É de toda a API |
| O resto de `ops/*` | fica | Já é terminal; os 12 `dist/ops/*.js` e `infra/compose.yml:122` não mudam |
| `apps/api/test/{sessao-de-teste,api-com-sessao,configuracao-de-teste,gatilho-de-parada}.ts`, `apps/worker/test/fila-de-teste.ts` e o realtime de teste | `tools/testes/` | Servem a mais de uma app, ou ao `infra/` |
| O kit visual de `web/src/componentes/` (botão, diálogo, aviso, ícones, onça, peças de IA: o que não importa `api/`, `areas/` nem `sessao/`) | `apps/web/src/kit/` | 13 arquivos de `componentes/` importam essas pastas. As peças de domínio (casca, sino, pedidos, meus dados, convite, `EstadoErro`) ficam em `componentes/` (R39) |

**Rejeitado:** testes HTTP em subpastas, web por funcionalidade e e2e por área (plano de 26/09, fora da R32).

**Os subcaminhos de `exports`.** Cada um é um arquivo de entrada que reexporta, sem mover arquivo, como
`@educa/nucleo/ciclo-de-vida`. Build e resolução não mudam (`nodenext` com `customConditions: ["source"]`).
- **`@educa/shared/servidor`** leva `permissao/matriz` e `privacidade/classificacao`.
  - Ficam na raiz, porque a web os usa: os papéis (`PAPEIS`, `PapelDeUsuario`, em `permissao/papeis.ts`), `retencao.ts`
    e as mensagens por tela.
- **`@educa/nucleo/db`** (tabelas, enums, `schema`), **`/identidade`**, **`/fila`**, **`/privacidade`** e **`/ia`**
  (R39), com `config/config-ia.ts` em `ia/`. Pool e `Banco`, na raiz.

**As travas.**
- O barril da raiz deixa de exportar o que mudou, e o import antigo não compila.
- Na web, `no-restricted-imports` barra `@educa/shared/servidor` e `@educa/nucleo*`.
- No depcruise da 12.0:
  - só `*.repository.ts` importa `@educa/nucleo/db`;
  - `operacao` nunca importa `ops`;
  - fora de `credencial/` e `sessao/`, só se importa delas pelo `index.ts`;
  - o kit não importa `api/`, `areas/` nem `sessao/`.
- `arquitetura.test.ts` cita a regra, não o caminho.

**Como se move.**
- Um script descartável, fora do repositório, sobre `getEditsForFileRename` do TypeScript: uma rodada por tsconfig (raiz,
  `apps/*`, `infra`, `e2e`), com `git mv`.
- Os testes que leem caminho como texto (`readFileSync`, `nome-dos-chunks.ts`, `arquitetura.test.ts`) viram uma constante
  única antes do movimento.
- Uma tarefa move uma coisa só, e o arquivo leva as supressões da catraca (`techspec.md` §13).

**A busca pelo nome antigo.** Cada tarefa roda `grep -rn` em `apps/`, `packages/`, `e2e/`, `infra/`, `tools/`, `docs/`,
`.github/`, `README.md` e `.size-limit.json`. Já se sabe de `docs/modelo-de-dados.md:212`, `README.md:35` e
`.size-limit.json:33`.

**Ponteiro velho até a Etapa 9.** `.claude/skills/executar-task/SKILL.md` cita `apps/api/src/sessao/` (linha 121) e
`apps/api/test/gatilho-de-parada.ts` (linha 128). A tarefa os registra no RELATÓRIO, para a lista da Etapa 9 (R36).

### RF15 — as leituras prontas

**Onde moram.** GET no módulo novo `apps/api/src/esperando/`, com saída `.strict()` em `packages/shared/src/esperando/`,
pelo pipe (T1), pelo registro (T2) e pelo escopo do contexto (T6). Recurso novo na `MATRIZ` (`ler`): professor
`turma_vinculada`, coordenação `unidade`, aluno e rede `nunca`.

**`GET /v1/professor/esperando`** devolve `semAnoLetivo`, `turmas[{ turmaId, nome, entregas, pedidosDeNome }]` (vínculo
confirmado, contagem exata, **sem nome de aluno**), `entregas[]` pendentes (até 100, com `entregasHaMais`) e
`vinculosAConfirmar[]`. Os pedidos são um `count … group by turma`, sem `join` com `lista_nome`, e o sino deixa
`GET /turmas/:id/reivindicacoes`, que traz até 100 nomes de menor.

**`GET /v1/coordenacao/esperando`** devolve `itens[]`, uma união por `tipo`: `incidente`, `contestacao`,
`convite-vencido`, `material-falhou` e `turmas-sem-professor { quantidade }`. O texto fica na web, e nenhum item leva número
por professor (regra 70.8 e 70.9).

**`GET /v1/escola/roteiro`**: `{ anoEmCurso, passos: { serie, disciplina, turma, professor, vinculo }, montada }`.

**"Turma sem professor"** é um `not exists` de vínculo `pendente` ou `confirmado` no ano em curso.
`ESTADOS_QUE_DAO_PROFESSOR` sobe para `shared/estrutura/vinculo.ts`, e `GET /v1/turmas` ganha `semProfessor`, aditivo (R39).

**O prazo do titular.** `GET /v1/privacidade/pedidos` e `/:id` trazem `prazo`: `aberto { ate, faltam }`,
`vencido { ate, atraso }`, `concluido` ou `cancelado`.
- Calcula `apps/api/src/privacidade/prazo-do-pedido.ts`, com `diaDeUso(relogio())` (São Paulo).
- A constante e o cálculo saem da web (`textos-do-pedido.ts:28`, `Pedidos.tsx:100`, `DetalheDoPedido.tsx:156`), que fica
  com o `textoDoPrazo`.

**O `substitui`.** `esquemaPedidoEnviarMaterial` ganha `substitui?: uuid`. Em `MaterialService.enviar`, na transação que
trava os envios da escola:
1. `excluirSeFalhou(id)`: update com `estado = 'falhou'`, a escola e não excluído. Sem linha afetada, volta
   `NAO_ENCONTRADO` e a transação desfaz tudo;
2. apaga os trechos, insere o novo material e grava `material.substituido` na auditoria.

O índice único parcial (`material.ts:60`) já ignora `falhou`. `DialogoDeEnvioDeMaterial.tsx:115` deixa a segunda chamada.

## 3. Falha

| Peça | O teste |
|---|---|
| Pasta | Import pelo caminho antigo, ou contra regra nova, falha no `tsc` ou no depcruise |
| Leitura | Sem ano letivo, `semAnoLetivo`, nunca "tudo em dia" falso |
| `substitui` | Duas trocas em `Promise.all`: uma vence |
| `substitui` | Id de outra escola, ou material `pronto`, volta `NAO_ENCONTRADO` |
| `substitui` | Reenvio igual a um `pronto` volta `CONFLITO`, e o `falhou` fica |

## 4. Isolamento, dado pessoal, conformidade, carga

- **Isolamento:** cada rota nova tem teste de duas escolas e entra na oráculo `matriz.expectativa.ts`. "Sem professor"
  confere o ano em curso e um vínculo encerrado ao lado de um aberto.
- **Dado pessoal:** nada novo é gravado. `CapturaDeDadoPessoal` (`apps/api/test/`) prova o nome do aluno fora da resposta
  e do log.
- **Conformidade:** o prazo de 15 dias é o da LGPD, art. 19, II (`conformidade-reviewer`).
- **Carga:** contagens por índice. ⚠️ O `EXPLAIN` de `vinculo`, `entrega` e `material` se confere nas 37.0 e 38.0, e índice
  que faltar vira migration própria, de volta ao Arquiteto.

## 5. Tarefas

| # | Título | RF | Depende de | Veto | Porte | Paralelo com |
|---|---|---|---|---|---|---|
| 30.0 | `@educa/shared/servidor` existe, e a web não o importa | 14 | fim da onda 1 (23.0, 25.0, 28.0) | — | pequeno | 36.0 |
| 31.0 | As peças de teste de mais de uma app moram em `tools/testes/` | 14 | 30.0 | infra | grande | 36.0 |
| 32.0 | O `nucleo` tem os subcaminhos `db`, `identidade`, `fila`, `privacidade` e `ia` | 14 | 31.0 | tenancy | grande | 36.0 |
| 33.0 | `credencial/` reúne senha, cookie, hash e desafio | 14 | 32.0 | tenancy, infra | grande | 36.0 |
| 34.0 | `sessao/` só tem fluxos, em subpastas, com `index.ts` | 14 | 33.0 | tenancy, infra | grande | 36.0 |
| 35.0 | `ops/` só tem terminal; casos de uso em `operacao/`, paginação em `http/` | 14 | 34.0 | tenancy | pequeno | 36.0 |
| 36.0 | O kit visual mora em `kit/` e não importa API, área nem sessão | 14 | fim da onda 1 | — | grande | 30.0–35.0, 37.0–39.0 |
| 37.0 | O professor lê o "esperando" numa chamada, sem nome de aluno | 15 | 35.0 | tenancy, privacy | grande | 36.0 |
| 38.0 | A coordenação lê o "esperando" numa chamada, e `turmas` diz quem está sem professor | 15 | 37.0 | tenancy, privacy | grande | 36.0 |
| 39.0 | `GET /v1/escola/roteiro` diz se a escola está montada | 15 | 38.0 | tenancy | pequeno | 36.0 |
| 40.0 | O prazo de 15 dias do titular vem da API | 15 | 39.0, 36.0 | privacy, conformidade | pequeno | — |
| 41.0 | Trocar o material que falhou é uma transação só (`substitui`) | 15 | 40.0 | tenancy | pequeno | — |

**O tronco é 30.0 a 35.0** (`packages/*`, `apps/api/test`, `arquitetura.test.ts`). A 36.0 é só da web. De 37.0 a 41.0,
todas mexem em `shared` e vão em série.

## 6. Riscos

- **Os decoradores em `tools/testes/`.** `api-com-sessao` importa o `AppModule`, e o `tsconfig.json` da raiz não tem
  `experimentalDecorators`. A 31.0 cria `tools/testes/tsconfig.json` com eles, no `typecheck`.
- **A cerca de tenant.** Os casos de uso de convite do operador usam a Resolução: ficam em `sessao/convite/`, não em
  `operacao/`.
- **Os chunks da web.** `nome-dos-chunks.ts` e o teto de 150 kB dependem dos caminhos: a 36.0 os ajusta.
- **O tronco** 30.0 a 35.0 segura o paralelo (`techspec.md` §13).

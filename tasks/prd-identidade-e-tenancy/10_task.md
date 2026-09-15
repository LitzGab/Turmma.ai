# Tarefa 10.0 — Virada do ano e leitura do ano encerrado

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 9.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `test-engineer`

## Objetivo

Encerrar o ano letivo passa a virar os vínculos para `encerrado` com motivo `fim_do_ano` e a
apagar o complemento das contestações, tudo numa transação. O ano encerrado fica só em
leitura: a coordenação lê a unidade, o professor que continua na escola lê as próprias turmas,
e quem saiu não lê nada.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF16 (leitura sem edição de anos encerrados; quem saiu não lê); casos de borda
  "Virada de ano letivo" e "Professor sai em março de uma das duas escolas"
- `techspec.md`:
  - seção 3: `vinculo.motivo_encerramento`, `complemento`, `ano_letivo.situacao`
  - seção 4: `?anoLetivoId` em `GET /v1/turmas/:id` e `/alunos`
  - seção 5: "Vínculo" (virada na mesma transação) e "Histórico" (condições de coordenação e
    professor)
  - seção 6: teste de `anoLetivoId` de B, de A com vínculo `desligamento` ou com outra turma
  - seção 7: retenção do `complemento` até o fim do ano letivo
  - seção 13: a versão do cache de sessão por escola avança ao encerrar o ano
- `.claude/rules/60-dominio.md`, item 5: turma, vínculo e nota pertencem a um ano letivo
- `.claude/rules/10-multitenancy.md`, item 3: `anoLetivoId` vindo do cliente só é aceito como
  filtro de leitura e conferido contra a escola do contexto; escrita nunca o aceita
- `.claude/rules/20-lgpd-menores.md`, itens 16 e 18: expurgo conforme retenção; fim de
  vínculo desativa o acesso
- `docs/lgpd.md`, seção 2: "Motivo de contestação … fim do ano letivo"
- Código existente:
  - criado na 8.0: `POST /v1/anos-letivos/:id/encerrar` (hoje só muda a situação)
  - criado na 9.0: `vinculo`, `turma.repository.ts` com leitura por vínculo confirmado,
    auditoria de leitura de alunos
  - criado na 2.0: contexto com `anoLetivoId` do ano em curso

## Subtarefas

- [ ] 10.1 — Virada
  - `POST /v1/anos-letivos/:id/encerrar` passa a rodar numa transação só: situação
    `encerrado`; vínculos do ano que não estavam encerrados vão a `encerrado` com
    `motivo_encerramento = fim_do_ano` e `encerrado_em`; `complemento` apagado em todos os
    vínculos do ano; auditoria da virada com contagens, sem `complemento`
  - se a versão do cache de sessão por escola já existir (seção 13 da Tech Spec), avança
- [ ] 10.2 — Leitura do ano encerrado
  - `?anoLetivoId` aceito só em `GET /v1/turmas/:id` e `/alunos`, e só se o ano é da escola do
    contexto e está `encerrado`
  - coordenação lê sem vínculo, com a mesma finalidade e auditoria de `/alunos` da 9.0
  - professor ativo precisa de vínculo com aquela turma naquele ano, `confirmado` ou
    `encerrado` com `fim_do_ano`; `desligamento` e `realocacao` não valem
  - qualquer outro caso, e toda rota de escrita que recebesse `anoLetivoId`, responde
    `NAO_ENCONTRADO`
- [ ] 10.3 — Testes (tabela abaixo)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/estrutura/ano-letivo.service.ts`, `ano-letivo.repository.ts` (virada) | alterado |
| `apps/api/src/estrutura/vinculo.repository.ts` (encerramento em lote do ano) | alterado |
| `apps/api/src/estrutura/turma.repository.ts`, `turma.controller.ts` (histórico) | alterado |
| `packages/nucleo/src/auditoria/acoes.ts` (ação de virada) | alterado |
| `packages/shared/src/estrutura/turma.ts` (`anoLetivoId` opcional na consulta) | alterado |
| `apps/api/test/virada-do-ano.int.test.ts`, `apps/api/test/historico.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: encerrar 2026 leva todos os vínculos confirmados, pendentes e contestados a `encerrado` por `fim_do_ano` e apaga todo `complemento` | integração | a virada na mesma transação |
| borda: falha forçada no meio da virada (por exemplo, erro na gravação da auditoria) desfaz tudo; o ano continua `em_curso` e os vínculos intactos | integração | atomicidade; quebra se a virada for em passos separados |
| caminho feliz: professor que continua na escola lê a turma de 2026 com `?anoLetivoId` e os alunos dela; qualquer escrita com esse ano é recusada | integração | RF16, só leitura |
| borda: professor desligado em março (`desligamento`) dá 404 em outubro na turma de 2026; professor realocado (`realocacao`) também | integração | RF16, quem saiu não lê; caso de borda do PRD |
| borda: professor com vínculo `fim_do_ano` no 2ºB pedindo o 2ºC do mesmo ano, onde nunca teve vínculo, dá 404 | integração | vínculo com aquela turma naquele ano, não com o ano inteiro |
| permissão: coordenação lê turma de ano encerrado sem vínculo, com finalidade e auditoria; aluno com `?anoLetivoId` em `/alunos` é recusado | integração | condições da coordenação e matriz |
| isolamento: `anoLetivoId` de B, com uma turma de B existente, dá 404 igual ao inexistente; `anoLetivoId` de ano de A ainda em curso também | integração | o filtro do cliente é conferido contra a escola do contexto; quebra sem a cláusula |
| privacidade: depois da virada, nenhuma linha de `vinculo` do ano tem `complemento`, e a auditoria da virada não contém texto livre | integração | retenção do `docs/lgpd.md` |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Criar as turmas do ano novo e reaproveitar vínculos: F2 (importação da grade)
- Histórico do aluno sobre o próprio ano anterior além de `/v1/eu`: F9
- Desativação de usuário e eliminação por escola: 17.0
- Cache de sessão por escola: só se a 16.0 mostrar a necessidade (seção 13 da Tech Spec)

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

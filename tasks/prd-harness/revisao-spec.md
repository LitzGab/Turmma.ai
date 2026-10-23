# Revisão de spec — harness

**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`

## Rodada 1 — 23/10/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `tenancy-guardian` | REPROVADO | 1: a tabela do RF15 não alcança query e escopo fora de repository e controller (`titular/`, `contexto/`, `identidade/`, `permissao/`, `entrada/`, gateway do realtime, `@SemEscopo` em serviço, contratos de `shared`) |
| `privacy-guardian` | REPROVADO | 2: a tabela deixa de fora IA, assistente, worker de expurgo e exportação, storage, convite, sessão externa, `erro/`, `telemetria/`, `ciclo-de-vida/`, `shared`; e a própria tabela e as guardas de lint da regra 20 mudam sem a rodada dele |
| `conformidade-reviewer` | REPROVADO | 3: a tabela deixa de fora schema e migration da validação, `shared` (autonomia, matriz), assistente, artefato, auditoria e as telas; a exclusão de teste tira os testes da regra 70; o corpus `ouro` muda sem revisão |
| `infra-guardian` | REPROVADO | 6: tabela sem gateway de IA, login, contador, `db/`, config, material; grupo do `concurrency` que perde execução na `develop`; cancelada por prazo virando verde; o censo lê relatório que a esteira não grava; prazo da mutação sem matar o grupo de processo; cópia congelada pela metade trava o time |
| `test-engineer` | REPROVADO | 11: RF7, RF8, RF23, RF27, RF28 e RF29 sem teste; RF2 sem os seis casos; casos de um lado só (RF1, RF10, RF14, RF15, RF16, RF18); RF4 sem matar neto; RF17 não dispara com documento sem bloco nem na conferência do commit; RF14 sem as formas que desligam o hook, sem índice × árvore; negação do `PreToolUse` sem casos; cópia congelada forjável por Write; RF16 sem `package.json` e configurações do portão; `harness.test.ts` sem amostra quebrada; RF3 no checkout errado |
| `revisor-geral` | REPROVADO | 8: congelamento que não chega à linha 1 nem ao modo git; RF3 desfazendo no andar; RF2 escondendo vermelho; o hook nativo não aplica a decisão inteira do `portao`; RF21 sem a lista; conflitos e seções do `CLAUDE.md` sem destino; `settings.json` estreito contra o PRD; `commit-msg` no lugar do `pre-commit` da D53 sem registro |

### Correções exigidas na Tech Spec

**Que mudam desenho ou critério do PRD (parada do Joaquim):**
- §5(b), RF15: o tamanho da tabela; os três guardiões pedem quase todo o código de produção, e o `infra` pede toda pasta de
  primeiro nível classificada, com teste de pasta nova (tenancy, privacy, conformidade, infra)
- §5(c), PRD §6: a cópia congelada é forjável por Write e trava o time se ficar pela metade (test-engineer 8, infra 6,
  revisor-geral 1)
- RF14: "qualquer forma de chamar o git" não se cumpre por inteiro (`env -u`, `commit-tree`, `rebase`, script com
  `--no-verify`); declarar os limites e a terceira camada (test-engineer 6)
- RF16: ampliar a lista com `package.json`, configurações do portão (`vitest`, `playwright`, `tsconfig`, `knip`,
  `eslint-suppressions`, `.gitleaks.toml`, `.size-limit.json`), `tools/guardas` com o guardião da regra e `docs/aia/ouro*`
  com o `conformidade-reviewer` (test-engineer 9, privacy 2, conformidade 3)
- D53 revista diz `pre-commit`; o desenho usa `commit-msg`, que é o que recebe a mensagem (revisor-geral 8)
- §9, paradas: excluir do aviso a proposta de retro que mexe na lista de um guardião com veto ou nas skills que decidem a
  marcação (conformidade, recomendação)

**Que corrijo sem mudar desenho:**
- §2/§5(f), RF1 e RF19: chaves do grupo do `concurrency` por ref em `spec/**` e `correcao/**`, por execução em
  `develop`, `release`, `main` e `workflow_dispatch`, por número no PR; sem `pull_request_target` nem segredo; o
  `esteira.ts` filtra `--event push` (infra 2, test-engineer 3)
- §5(f), RF2: superada só com execução mais nova na mesma branch; cancelada sem sucessora é vermelha com o job; os seis
  casos (infra 3, test-engineer 2, revisor-geral 3)
- §5(f), RF9: o `ci.yml` grava e sobe o JSON do Playwright de cada fatia também no verde; o censo junta as fatias e sai 2
  com fatia faltando (infra 4)
- §7c, RF4: prazo de 3 × a corrida limpa medida, teto de 10 min, corrida limpa com teto próprio, grupo de processo morto
  por SIGTERM e SIGKILL, arquivo restaurado (infra 5, test-engineer 4)
- §5(d), RF17: a fonte é o diff da árvore contra a base, a exigência vale também na conferência do commit, motivo vazio
  recusado, teste e `.d.ts` de `src` não exigem (test-engineer 5)
- §5(f), RF3: tipagem e lint no checkout da linha, depois do merge e antes do `--ff-only` da spec, com o comando injetado
  e o prazo de ~80 s escrito (test-engineer 11, revisor-geral 2, infra)
- §5(a), RF14: a decisão inteira do `portao` (marca, documento, RF15, RF16, `avaliarPortao`, mutações) vira uma função
  sobre mensagem, arquivos e raiz, usada pelas duas entradas; o hook nativo lê o blob do índice; `PAPEIS_DO_TIME` no
  lugar do `case`; a negação do `PreToolUse` com os casos e a dica de `-F` (revisor-geral 4, test-engineer 6 e 7)
- §5(e): `.claude/settings*.json` (revisor-geral 7)
- RF21: a lista das contradições, uma por linha, com o lugar que fica (revisor-geral 5)
- RF20 e RF23: destino de cada seção que sai do `CLAUDE.md` e dos seis conflitos de skill; o teste detecta, não reaplica
  (revisor-geral 6, test-engineer 1)
- §10: RF7, RF8, RF23, RF27, RF28 e RF29 com teste; os dois lados de cada caso; amostra quebrada por checagem do harness
  e contagem mínima por extrator; os rótulos vêm das constantes do hook. Os cenários vão para `cenarios.md`, para a Tech
  Spec caber no teto (test-engineer 1, 3, 10)
- §11 contradiz §9 (regra 80 tem `paths:`); a numeração pula o §8 (revisor-geral, infra)

### Recomendações
- `--no-renames` no diff do hook (tenancy); listar a união de guardiões à Mesa antes da primeira rodada (revisor-geral);
  `feita` da limpeza só em sessão sem papel e os campos de `limpeza.json` (revisor-geral, privacy); o `UserPromptSubmit`
  não grava o texto (privacy); o encontro retomável e `npm ci` com lock alterado (infra); `.processo/**` fora do vitest e
  do eslint; `hook-git.int.test.ts` sem subir o compose; ressalva das regras 10, 20 e 70 nunca é menor (conformidade);
  `tools/ia/**` com conformidade; o `separar-achados` só sai com o ok do Gabriel; a trava do U11-12 no RF13; o RF26 como
  teste de orçamento

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 11:47:38 | 2026-10-23 11:50:02 | `tenancy-guardian` | 1 | REPROVADO | a923ad599564bfb58 |
| 2026-10-23 11:47:42 | 2026-10-23 11:50:09 | `privacy-guardian` | 1 | REPROVADO | aef2e0ea1633cbc3b |
| 2026-10-23 11:47:47 | 2026-10-23 11:51:43 | `conformidade-reviewer` | 1 | REPROVADO | a5e39d8222850119d |
| 2026-10-23 11:47:52 | 2026-10-23 11:53:11 | `infra-guardian` | 1 | REPROVADO | a44f1980ee4a73c5a |
| 2026-10-23 11:47:28 | 2026-10-23 11:53:52 | `test-engineer` | 1 | REPROVADO | a589526a80b1e6cd2 |
| 2026-10-23 11:47:33 | 2026-10-23 11:56:26 | `revisor-geral` | 1 | REPROVADO | a0f77096cdd87302b |

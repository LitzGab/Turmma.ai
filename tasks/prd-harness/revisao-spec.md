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

## Rodada 2 — 23/10/2026

**Veredito: REPROVADA**

As correções da rodada 1 foram conferidas e valem (cópia congelada fora, `decidirCommit`, RF2 na Tech Spec, RF3 no
checkout da linha, `concurrency`, censo, RF4, lista do RF21, destinos do `CLAUDE.md`, D53 com `commit-msg`). O que
sobra é a tabela, que cada guardião achou furada de novo, e cenários de um lado só.

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `tenancy-guardian` | REPROVADO | 4: `auditoria/`, `retencao/`, `limite/`, `erro/` do núcleo e `shared/sistema/` sem T; `apps/*/test/` sem linha; guardas da regra 10 fora de `regras-tenant` (`camadas.cjs`, `tabelas-do-nucleo.mjs`, `index.mjs`, `repositories-com-escopo.test.ts`) |
| `privacy-guardian` | REPROVADO | 2: `contexto/`, `config/`, `fila/`, `limite/` do núcleo, `shared/erros` e `sistema`, `api/sistema` e raiz, `web/componentes` sem P; `tools/guardas/` inteiro e `eslint.config.mjs` sem P |
| `conformidade-reviewer` | REPROVADO | 2: `titular/`, `retencao/`, `ciclo-de-vida/`, `privacidade/` (api e shared), `Faixa.tsx` e `onca/` sem C; `e2e/` dos fluxos da regra 70 e o seed `e2e/__fixtures__/governanca.ts` sem C |
| `infra-guardian` | REPROVADO | 7: web (`api/`, `sessao/`, `areas/`, `pedidos/`, `sino/`), `shared` (`sistema`, `erros`, `estrutura`, ...), núcleo (`retencao`, `titular`, `ciclo-de-vida`, `auditoria`, `erro`) e api (`entrega`, `governanca`, `privacidade`, `professores`) sem I; `apps/*/test/`; o RF2 do PRD contradiz a Tech Spec; dois encontros do RF3 ao mesmo tempo, sem trava |
| `test-engineer` | REPROVADO | 10: RF4 com o vocabulário trocado e sem o mutado lento; RF2 sem sucessora rodando; RF9 sem a escolha da execução; merge e `pre-push` de um lado só; terceira camada sem histórico real de spec e sem o commit do Joaquim; RF17 sem caso direto na `decidirCommit`; isenção da guarda de IA sem cenário; `compose.yaml` e `.env.example` na tabela e fora do §5(e); testes de fora de `src` |
| `revisor-geral` | REPROVADO | 2: a terceira camada reaproveita o `conferirEntrega`, que falha em histórico normal de spec; `compose.yaml` e `.env.example` nunca chegam à tabela |

### Correções exigidas

**Que mudam desenho ou critério do PRD (parada do Joaquim):**
- RF15: a tabela fina não converge; cada rodada acha pasta nova. Inverter o padrão (todo código pede os quatro, e a
  exceção é escrita) ou seguir somando linhas
- RF2 do PRD: "cancelada não é vermelha" contradiz a Tech Spec; o critério passa a "superada só com push mais novo na
  mesma branch; sem sucessora, vermelha" (infra 6)
- RF14: o commit de código do Joaquim, sem papel, em `spec/**` ou `correcao/**`, passa no hook e fica vermelho na
  terceira camada (test-engineer 6)
- RF16 e D53: `compose.yaml` e `.env.example` entram na lista fechada, ou saem da tabela (test-engineer 9, revisor-geral 2)

**Que corrijo sem mudar desenho:**
- §5(a): a terceira camada com regra própria, commit a commit de `develop..HEAD`, a mesma classificação da
  `decidirCommit`, merge por `--remerge-diff`, intervalo vazio sai 0, `fetch-depth: 0` (revisor-geral 1)
- §5(a): a negação do `PreToolUse` casa os argumentos do git e as formas de mexer no ambiente, não qualquer `grep`; `GIT_CONFIG_*` nos limites (revisor-geral)
- §5(f), RF3: o encontro inteiro sob `flock`, relendo o quadro com a trava; prazo próprio com `npm ci`; a saída diz
  para refazer o merge (infra 7, revisor-geral)
- §7c, RF4: prazo = o maior entre 3 × a corrida limpa e o prazo do teste, com piso de 60 s; vocabulário do
  `mutacoes.ts` (test-engineer 1, infra)
- `cenarios.md`: RF2 com sucessora rodando, jobs da superada fora, as duas funções, `cancelled` no lugar de `timed_out`;
  RF9 com vermelha mais nova e artefato expirado; merge limpo de papel e merge com marca passando; `pre-push` sem papel
  passando; terceira camada com histórico real de spec e marca sem `Revisões:`; RF17 direto na `decidirCommit`;
  isenção da guarda de IA dos dois lados (test-engineer 2 a 8)
- `texto.md`: o conflito de skill na primeira linha depois do frontmatter; as skills que decidem a marcação, nomeadas;
  o bloco "Formato" de cada guardião não muda; o `README` do `ouro` na lista do RF21; uma definição do orçamento do
  RF26; o passo do RF9 no `/seguir` (revisor-geral, conformidade)
- §5(c): o socorro perde o que não foi commitado, e o conserto é commitado pelo Joaquim fora de sessão de papel
- O censo sobe só o reporter JSON, sem trace nem anexo (privacy)

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
| 2026-10-23 13:02:07 | 2026-10-23 13:04:52 | `tenancy-guardian` | 2 | REPROVADO | af6f6902273a52732 |
| 2026-10-23 13:02:13 | 2026-10-23 13:06:07 | `privacy-guardian` | 2 | REPROVADO | a25987c2dae713e62 |
| 2026-10-23 13:02:20 | 2026-10-23 13:06:40 | `conformidade-reviewer` | 2 | REPROVADO | a04081cc664806784 |
| 2026-10-23 13:02:27 | 2026-10-23 13:06:46 | `infra-guardian` | 2 | REPROVADO | ac40d49e57fe8286e |
| 2026-10-23 13:02:34 | 2026-10-23 13:08:12 | `test-engineer` | 2 | REPROVADO | abbbf7801aaeb881d |
| 2026-10-23 13:02:40 | 2026-10-23 13:08:37 | `revisor-geral` | 2 | REPROVADO | a0542617ee93340d2 |

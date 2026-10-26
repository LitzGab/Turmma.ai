# Correção — `npx` de um pacote fora do `package-lock.json` baixa e executa código de terceiros na sessão do time

**Origem:** `TODO.md`, seção "Da X4", item MN7 (validação, rodada 5), com a decisão M3 da retro da X4 (aceita em 26/10/2026).
**Subagentes obrigatórios:** `infra-guardian`, `revisor-geral`, `test-engineer`, `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`
<!-- Os três primeiros vieram no PEDIDO do Orquestrador. `revisor-geral` também pelo limite do passo 5: o teste novo mora em `tools/processo/`.
     Os três últimos vieram da DEVOLUÇÃO da Mesa: `.claude/settings.json` casa com os quatro guardiões de `tools/processo/guardioes-por-caminho.ts`. -->

## Sintoma

Na correção `2026-10-26-areas-entrar-estoura-o-prazo`, o `tenancy-guardian` rodou `npx biome format`, e o `npx` baixou do npm o
pacote `biome` 0.3.3, sem relação com o projeto, e o executou no checkout da linha 1 (a árvore não mudou). Qualquer sessão do time com
`Bash` pode repetir isso: o `npx` sem o pacote no projeto instala e roda o que o nome do npm devolver.

## Fora desta correção

Nada: a árvore estava limpa.

## Causa

O `npx` do npm 10 instala sozinho o pacote que não acha no projeto quando a sessão não é interativa: o `--yes` é o padrão, nesse caso.
A sessão do Claude Code não é interativa, então ninguém responde "Ok to proceed?", e o download acontece. `.claude/settings.json` não
tinha `env`, e o pedido de `--no-install` só existia como texto nos arquivos dos revisores (`.claude/agents/*.md`), que não impede nada.

## Teste que reproduz

`tools/processo/harness/npx-sem-instalar.test.ts`:

- `.claude/settings.json` declara `env.npm_config_yes` como `"false"`: vermelho no HEAD (o arquivo não tem `env`);
- com o `env` do `settings.json`, o `npx` de um pacote que não está no projeto sai com erro ("npx canceled due to missing packages and
  no YES option") e **não pede o tarball** a um registro de mentira (um servidor HTTP local, sem rede de verdade): vermelho no HEAD,
  onde o `npx` avisa "will be installed"; o controle, sem o `env`, mostra esse aviso; e o `npx vitest`, que está no
  `package-lock.json`, roda com esse mesmo `env`.

Duas coisas que o portão ensinou: o registro de mentira vive no processo do teste, então o `npx` roda com `spawn` assíncrono (o
`spawnSync` travava o servidor e o `npx` estourava o tempo); e o controle olha a decisão do `npx`, e não o pedido do tarball, que sob
carga não chegava ao servidor antes de o processo sair. O grupo tem prazo de 90 s: com 36 laços de CPU em 12 núcleos, o limite padrão de
5 s estourava. Repetido 5 vezes sob essa carga, verde.

## Correção

`.claude/settings.json` ganha `"env": { "npm_config_yes": "false" }`. O Claude Code põe esse `env` no ambiente de todo `Bash` da sessão e
dos subagentes; o `npx` lê `npm_config_yes` como `--yes=false` e, sem o pacote no projeto, cancela com "npx canceled due to missing
packages and no YES option". O que está no `package-lock.json` (`npx playwright`, `npx vitest`) segue rodando. Efeito conhecido: o
`npx skills update -p` pelo Claude passa a pedir `--yes` na linha do comando (dono: Orquestrador).

## Mutações

```mutacao
arquivo: .claude/settings.json
teste: tools/processo/harness/npx-sem-instalar.test.ts › declara npm_config_yes como "false" no env do settings.json
  "env": {
-   "npm_config_yes": "false"
  },
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | Medir as três chamadas reais do `npx` na esteira e, se pesar, separá-las num projeto do Vitest | Recusada por ora: o test-engineer mediu o arquivo inteiro em 1,1 s (4 de 4). Reabrir se a esteira mostrar peso |
| infra-guardian (1ª) | O `env` vale só para as sessões do Claude Code; esteira e VM de produção não o recebem | Linha escrita no `TODO.md`, logo depois do MN7 ("O `npm_config_yes=false` vale só para a sessão do Claude Code", dono Arquiteto): a correção cobre a sessão do time (M3 da retro da X4). A esteira roda `npx vitest`, que está no lockfile; nada quebra hoje |
| revisor-geral (1ª) | Dois textos ainda mandam rodar `npx skills update -p` (`.claude/skills/seguir/time.md:35`, `docs/skills-de-terceiros.md`), que agora só roda com `--yes` | Linha escrita no `TODO.md`, logo depois do MN7 ("Dois textos ainda mandam rodar `npx skills update -p` sem `--yes`", dono Orquestrador); são arquivos fora desta correção |
| revisor-geral (1ª) | O controle olha só a mensagem "will be installed", não o `status` nem o tarball | Recusada: limite conhecido, justificado no documento (a corrida sob carga) |
| revisor-geral (1ª) | Marcar o item MN7 do `TODO.md` (linha 2193) no fechamento | Fechamento da correção, por quem fecha |
| test-engineer (1ª) | A lista `pedidos` pode receber pedido atrasado do `npx` anterior; filtrar pelo nome do pacote ou um servidor por teste | Recusada: o tarball é sempre do mesmo pacote, o filtro por nome não distingue; hoje não muda nenhum veredito e a ordem dos testes é fixa |
| test-engineer (1ª) e privacy-guardian (1ª) | O teste não prova que o Claude Code entrega o `env` ao Bash de cada subagente; anotar a conferência periódica (`npx cowsay` cancelado numa sessão de verdade) | Linha escrita no `TODO.md`, logo depois do MN7 ("Conferir a cada atualização do Claude Code que o `env` do `settings.json` chega ao Bash…", dono Arquiteto) e para a validação; o limite já está declarado no cabeçalho do teste |
| privacy-guardian (1ª) | O texto que pede `--no-install` em `.claude/agents/*.md` continua lá; alinhar com a nova barreira | Linha escrita no `TODO.md`, logo depois do MN7 ("Os agentes revisores ainda pedem `--no-install` no texto", dono Arquiteto): são arquivos de agente fora desta correção |
| test-engineer (2ª) | O caso do cancelamento poderia conferir também que o ambiente filtrado não traz nenhuma variante da chave antes do `...env` | Recusada: opcional, e já vale pelo código de `semNpmConfigYes` e do `env` do `spawn`; o controle prova, pela decisão do `npx`, que o "false" vem só do settings |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-26 16:02:56 | 2026-10-26 16:03:04 | `tenancy-guardian` | 1 | APROVADO | adfb0369b0e4c4a13 |
| 2026-10-26 16:02:58 | 2026-10-26 16:03:10 | `conformidade-reviewer` | 1 | APROVADO | a724ba917c73b7cab |
| 2026-10-26 16:02:53 | 2026-10-26 16:03:12 | `infra-guardian` | 1 | APROVADO | aeffa13dde4e69d7f |
| 2026-10-26 16:02:57 | 2026-10-26 16:03:14 | `privacy-guardian` | 1 | APROVADO | af6b42a07df48bc43 |
| 2026-10-26 16:02:54 | 2026-10-26 16:03:18 | `revisor-geral` | 1 | APROVADO | abbc49e06bd38d3db |
| 2026-10-26 16:02:55 | 2026-10-26 16:03:41 | `test-engineer` | 1 | APROVADO | acc2aea581c7249af |
| 2026-10-26 16:09:05 | 2026-10-26 16:09:34 | `test-engineer` | 2 | APROVADO | abed8eb74fa5e4832 |
| 2026-10-26 16:08:59 | 2026-10-26 16:09:58 | `revisor-geral` | 2 | REPROVADO | a24480c5783d8f578 |
| 2026-10-26 16:14:57 | 2026-10-26 16:15:15 | `revisor-geral` | 3 | APROVADO | a52d2ac53e4ad339e |

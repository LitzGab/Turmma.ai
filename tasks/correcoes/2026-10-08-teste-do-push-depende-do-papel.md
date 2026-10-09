# Correção — o teste do push depende do papel da sessão: um `undefined` explícito lê `CLAUDE_CODE_AGENT`

**Origem:** uso (a suíte de `tools/processo` rodada de dentro de uma sessão do time, com papel `implementador`, durante a 5.0 de `lgpd-e-titular`, em 08/10/2026)
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
<!-- test-engineer é obrigatório em toda correção. revisor-geral entra pelo passo 5 do corrigir, porque a correção toca tools/processo/: o pedido do Orquestrador ditou só o test-engineer, e isto fica para ele confirmar. -->

## Sintoma

`npx vitest run tools/processo/revisoes.test.ts -t "agente do time"`, rodado de dentro de uma sessão
iniciada com `--agent implementador` (`CLAUDE_CODE_AGENT=implementador`):

```
FAIL |unidade| tools/processo/revisoes.test.ts > … > agente do time não empurra develop, release nem main; a branch do andar ele empurra
AssertionError: expected 'Push bloqueado: este comando empurra `develop`, … o papel `implementador`…' to be null
❯ tools/processo/revisoes.test.ts:1246
```

O teste fica verde fora do time. Um teste que muda de resultado conforme quem o roda não prova a regra.

## Fora desta correção

Arquivos da tarefa em curso (5.0 de `lgpd-e-titular`, de `.processo/ordens/arquivos-da-tarefa-5.txt`).
Ficam na árvore, não entram na revisão nem no commit desta correção:

```
 M TODO.md
 M apps/worker/src/processadores/expurgar-escola.ts
 M apps/worker/test/expurgo-da-escola.int.test.ts
 M docs/lgpd.md
 M docs/modelo-de-dados.md
 M docs/runbook.md
 M packages/nucleo/drizzle/meta/_journal.json
 M packages/nucleo/src/db/schema/material.ts
 M packages/nucleo/src/db/schema/mensagem-tutor.ts
 M packages/nucleo/src/db/schema/reivindicacao.ts
 M packages/nucleo/src/db/schema/sinal-tutor.ts
 M packages/nucleo/src/db/schema/tentativa-atividade.ts
 M packages/nucleo/src/db/schema/usuario.ts
 M packages/nucleo/src/db/schema/vinculo.ts
 M packages/nucleo/src/index.ts
 M packages/nucleo/src/retencao/expurgo-da-escola.repository.ts
 M packages/nucleo/src/retencao/expurgo-da-escola.test.ts
 M packages/shared/src/index.ts
 M packages/shared/src/privacidade/retencao.ts
 M tasks/prd-lgpd-e-titular/5_task.md
 M tasks/prd-lgpd-e-titular/cenarios.md
 M tasks/prd-lgpd-e-titular/estado.md
 M tasks/prd-lgpd-e-titular/techspec.md
?? packages/nucleo/drizzle/0027_expurgo_do_cadastro.sql
?? packages/nucleo/drizzle/meta/0027_snapshot.json
```

## Causa

O helper `push` do teste repassa o seu terceiro argumento a `portao`, e `portao` declara
`papel: string | undefined = process.env['CLAUDE_CODE_AGENT']`. Em JavaScript, um parâmetro com
padrão recebe o padrão sempre que o argumento é `undefined`, inclusive quando o `undefined` é
passado de propósito. O caso "sem papel" do teste (linha 1246, `push('git push origin develop',
terreo, undefined)`) portanto lê o papel da sessão que roda o teste: dentro de um agente do time,
`implementador`, e o push para a `develop` é barrado.

O defeito está no teste, não no hook. O caminho de produção, `tools/processo/hook-revisoes.ts`,
chama `portao(entrada, raiz)` sem papel, e é ali que o padrão que lê o ambiente tem de valer.

## Teste que reproduz

`tools/processo/revisoes.test.ts` › "agente do time não empurra develop, release nem main; a branch
do andar ele empurra", linha 1228. **Vermelho antes**, na linha 1246, com `CLAUDE_CODE_AGENT=implementador`
(saída acima). **Verde depois**, com a variável ausente, com `CLAUDE_CODE_AGENT` em cada papel do
time, e com ela no papel do próprio implementador.

## Correção

O caso "sem papel" passa `''` no lugar de `undefined`, e o helper `push` passa a tipar `papel` como
`string`, sem `undefined`. `''` não dispara o padrão de `portao` (o padrão só vale para `undefined`) e
conta como "sem papel" para `pushDoTime`, que testa `!papel`: é exatamente o que o teste quer dizer.
Nenhuma asserção do teste original muda. Só o comentário da linha 1245 ganha o motivo, para que ninguém
volte ao `undefined` por achar que é a mesma coisa.

A rodada de recomendações adicionou o caso `sem papel passado, portao lê o papel de CLAUDE_CODE_AGENT, que é
o caminho do hook` em `tools/processo/revisoes.test.ts`. Ele prova, com `vi.stubEnv`, que o padrão de `portao`
lê o ambiente no caminho em que o hook o chama sem papel.

`portao` fica como está: o padrão que lê `CLAUDE_CODE_AGENT` é o caminho de produção.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-08 21:33:46 | 2026-10-08 21:34:35 | `test-engineer` | 1 | APROVADO | a786c5e247cabbcbd |
| 2026-10-08 21:34:43 | 2026-10-08 21:34:59 | `revisor-geral` | 1 | APROVADO | ac57dc60b0e8c1204 |
| 2026-10-08 21:47:14 | 2026-10-08 21:47:59 | `test-engineer` | 2 | APROVADO | a72c1c0d9fa743a3f |
| 2026-10-08 21:48:05 | 2026-10-08 21:48:23 | `revisor-geral` | 2 | APROVADO | a7df35438c4fd016c |

# Correção — o aviso da mensagem colada não disparava para a forma real da mensagem (`<pasted_content id="…">` antes do `/seguir `)

**Origem:** `tasks/prd-harness/validacao.md`, achado crítico C1 (RF29 PARCIAL).
**Subagentes obrigatórios:** `privacy-guardian`, `test-engineer`, `revisor-geral`
<!-- O `privacy-guardian` veio no PEDIDO do Orquestrador (o hook cita a regra 20, item 9). O `test-engineer` é de toda correção. O `revisor-geral` entra porque a correção altera `tools/processo/` (o teste), passo 5 de `corrigir`. -->

## Sintoma

`.claude/hooks/aviso-de-sessao.sh` só devolvia o aviso quando o `prompt` do `UserPromptSubmit` começava por `/seguir `
(`prompt.startsWith("/seguir ")`). As mensagens que o time cola no terminal do Orquestrador chegam embrulhadas: nas transcrições
dele há 611 mensagens `/seguir` coladas, todas começando por `<pasted_content id="…">` + quebra de linha + `/seguir …` (504 com
linha em branco antes). Com essa forma o hook saía em silêncio, e o "caso da mensagem colada" do RF29 não estava provado: o teste
só cobria o texto puro.

## Fora desta correção

O hook e o teste dele. A Tech Spec §12 ("o texto colado chega assim, sem ser expandido", marcado como não provado) e a §5(h)
("Olha o prefixo `/seguir `") são do Arquiteto e não mudam aqui; o Orquestrador leva ao Arquiteto se quiser ajustar o texto.
A árvore estava limpa.

## Causa

O hook testava o começo do texto cru, sem contar o embrulho `<pasted_content id="…">` que o Claude Code põe em volta do que se
cola. A premissa "o prompt chega como foi digitado" valia só para a mensagem curta digitada, que de todo modo já executa a skill.

## Teste que reproduz

`tools/processo/harness/aviso-de-sessao.test.ts` › `o hook de entrada com o prefixo /seguir (RF29)`:

- `mensagem colada de verdade: o <pasted_content id="…"> e a quebra de linha (às vezes com linha em branco) antes do /seguir `:
  seis formas (embrulho + `\n`, `\n\n`, `\r\n`, sem quebra, quebra antes do embrulho, e espaço inicial) devolvem o aviso. Vermelho
  antes da correção (primeira forma: `expected '' to contain '.claude/skills/seguir/SKILL.md'`), verde depois.
- `mensagem colada que não começa pelo /seguir : nada…`: o que **não** dispara, dentro e fora do embrulho: `/seguir` no meio do
  texto (`RELATÓRIO\n/seguir x`, `rode o /seguir agora`), `/seguirdepois`, `/seguir` sem espaço depois, embrulho sem nada, id
  vazio ou com espaço, texto antes do embrulho, segundo embrulho depois de outro, e outra tag.

O caso `' /seguir tarefa'` (espaço inicial), que o teste antigo dava como "nada", passou ao primeiro teste: o C1 pede aceitar o
espaço inicial, que o terminal acrescenta quando se cola.

## Correção

No hook, a condição passou de `prompt.startsWith("/seguir ")` para
`typeof prompt === "string" && /^\s*(?:<pasted_content id="[\w-]+">\s*)?\/seguir /.test(prompt)`: espaço inicial, o embrulho opcional com id simples, qualquer
quebra de linha, e só então `/seguir `. `/seguir` no meio do texto continua sem disparar. O hook segue sem gravar a entrada
(regra 20, item 9), e `prompt` ausente ou que não é texto continua sem aviso, com saída 0.

**Sem mutação:** não altera arquivo de `apps/*/src` nem de `packages/*/src`; só o hook de `.claude/hooks/` e o teste que o roda.

## Recomendações sem aplicar

Aplicadas na ordem da rodada 1 (`.processo/ordens/2026-10-24-aviso-mensagem-colada-r1.md`): `typeof prompt === "string"` antes do
`test` (com `["/seguir x"]` e um objeto na lista do teste de entrada que não é texto; só a lista ficava vermelha sem o `typeof`, e o objeto
cobre o `catch`, porque a conversão dele lança `TypeError`), o cabeçalho do hook citando
o embrulho, e o embrulho nos testes de papel e de "não grava". O que ficou:

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª), test-engineer (1ª) | `techspec.md` §12 ("o texto colado chega assim, sem ser expandido", ainda "não provado") e §5(h) ("Olha o prefixo `/seguir `") desatualizadas em relação ao hook | Do Arquiteto, e o arquivo está fora desta correção (seção "Fora desta correção"). Destino: o Orquestrador leva ao Arquiteto antes da revalidação; a §12 deve registrar a forma real e citar este hook |
| privacy-guardian (1ª) | A regex roda em tempo linear e não tem risco de ReDoS | Observação sem mudança pedida ("Não é preciso mudar nada") |
| revisor-geral (1ª), test-engineer (1ª) | Os ids reais das transcrições têm 4 caracteres hexadecimais; o `[\w-]+` os cobre | Observação sem mudança pedida ("não há o que mudar") |

## Revisões
| 2026-10-24 03:08:16 | 2026-10-24 03:08:42 | `privacy-guardian` | 1 | APROVADO | a42740a8e30ca3928 |
| 2026-10-24 03:08:18 | 2026-10-24 03:08:56 | `revisor-geral` | 1 | APROVADO | a48b24b3722d41f8a |
| 2026-10-24 03:08:17 | 2026-10-24 03:09:15 | `test-engineer` | 1 | APROVADO | a1e8fbe4ca14dd86f |
| 2026-10-24 03:14:18 | 2026-10-24 03:14:35 | `privacy-guardian` | 2 | APROVADO | a37c63e810a582c09 |
| 2026-10-24 03:14:32 | 2026-10-24 03:15:02 | `test-engineer` | 2 | APROVADO | a03c17f6aa34de733 |
| 2026-10-24 03:14:46 | 2026-10-24 03:15:08 | `revisor-geral` | 2 | APROVADO | ab7817ffc7f88f982 |

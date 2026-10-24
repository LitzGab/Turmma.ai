# Achados das revisões — `tasks/correcoes/2026-10-24-aviso-mensagem-colada.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-24 03:08:42 · `tasks/correcoes/2026-10-24-aviso-mensagem-colada.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção só mexe no hook `UserPromptSubmit` do harness e no teste dele. Não toca migration, schema, DTO, rota nem storage.

Fora da tabela de dados do docs/lgpd.md: nenhum, porque não entra campo novo.

Autorização por objeto: não se aplica. A correção não cria nem altera endpoint ou repository.

Logs: limpos. O hook lê o `prompt` só para testar a regex e devolve um texto fixo (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/aviso-de-sessao.sh:35`), que não repete nada da entrada. O stderr do node vai para `/dev/null` (linha 33), e por isso um erro de parse também não expõe o conteúdo. O comentário das linhas 7 e 8, que proíbe gravar a entrada (regra 20, item 9), continua no lugar. O teste `não grava arquivo nenhum` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/aviso-de-sessao.test.ts`) segue verde.

Auditoria: não se aplica. Nenhuma ação da regra 20, item 10 foi tocada.

Envio externo: nenhum. O hook não chama rede nem provedor de IA.

Seed/fixture: sintético. Os prompts do teste são inventados (`RELATÓRIO de Implementador`, `tasks/prd-x/1_task.md`, ids `cf73` e `a1-B_2`). Das transcrições do Orquestrador entraram só contagens (611 e 504), sem nenhum trecho de conteúdo.

Bloqueantes: nenhum.

Recomendações:
- O teste que prova que o hook não grava nada usa só a forma pura (`/seguir RELATÓRIO … SEGREDO-DA-MENSAGEM`). Vale repetir esse teste com a forma embrulhada (`<pasted_content id="…">\n\n/seguir … SEGREDO`), que é o caminho que esta correção abre. Hoje esse caminho termina no mesmo `echo` fixo, então o risco é baixo. O teste novo protege contra quem estender o hook depois.
- A regex `/^\s*(?:<pasted_content id="[\w-]+">\s*)?\/seguir /` (linha 22) roda em tempo linear sobre qualquer prompt e não tem risco de ReDoS. Não é preciso mudar nada.

Pergunta de fechamento: esta correção não guarda nada sobre aluno nem envia nada para fora. Por isso não muda a resposta do sistema sobre o que ele guarda de um aluno e para onde isso já foi enviado. Rodei o teste localmente (`vitest run tools/processo/harness/aviso-de-sessao.test.ts`) e os 7 casos passaram.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 03:08:56 · `tasks/correcoes/2026-10-24-aviso-mensagem-colada.md`

VEREDITO: APROVADO

Escopo: respeitado. A correção mexe só no hook e no teste dele. Fez o que o C1 de `tasks/prd-harness/validacao.md:99-110` pedia: aceita espaço no começo e o embrulho `<pasted_content id="…">` seguido de quebra de linha antes do `/seguir `, continua sem disparar com `/seguir` no meio do texto, e testa as duas formas reais (`\n` e `\n\n`) junto com os casos que não devem disparar.

Aderência à Tech Spec: ok. A §5(h) pede "olha o prefixo `/seguir `", e o hook continua olhando o começo do texto; agora apenas tolera o embrulho do terminal. O caso do `cenarios.md:158` ("sem o prefixo: nada") continua valendo. A §12 ficou desatualizada, e a tarefa declara isso na seção "Fora desta correção", então não é divergência silenciosa.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

Bloqueantes: nenhum.

Recomendações:
- `tasks/prd-harness/techspec.md:403-406`: a §12 ainda dá como "não provado" que o texto colado chega sem ser expandido. As 611 mensagens das transcrições mostram que ele chega embrulhado. O Orquestrador deve levar isso ao Arquiteto para a §12 registrar a forma real e citar este hook como a resposta.
- `.claude/hooks/aviso-de-sessao.sh:28`: `RegExp.test` converte o valor em texto antes de comparar. Um `prompt` que viesse como `["/seguir x"]` viraria `"/seguir x"` e dispararia o aviso. O Claude Code sempre manda texto, então hoje não acontece. Um `typeof prompt === "string" &&` antes do teste deixa explícito o que o comentário das linhas 19-20 promete.
- `.claude/hooks/aviso-de-sessao.sh:4-5`: o cabeçalho ainda diz "Quando a entrada começa com `/seguir `". Pode citar o embrulho, para bater com o comentário das linhas 16-18.
- Conferi os ids reais nas transcrições: todos têm 4 caracteres hexadecimais (`9930`, `78c1`). O `[\w-]+` cobre esse formato, e o teste usa `cf73` e `a1-B_2`, então não há o que mudar.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/aviso-de-sessao.sh
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/aviso-de-sessao.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/correcoes/2026-10-24-aviso-mensagem-colada.md

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 03:09:15 · `tasks/correcoes/2026-10-24-aviso-mensagem-colada.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: a mensagem colada na forma real (`<pasted_content id="…">` e uma quebra de linha antes do `/seguir `) recebe o aviso. Na forma pura o aviso continua.
- Bordas reais: as variações do embrulho (`\n`, `\n\n`, `\r\n`, sem quebra, quebra antes do embrulho, espaço inicial) e as entradas que não podem disparar (`/seguir` no meio do texto, dentro ou fora do embrulho, `/seguirdepois`, `/seguir` sem espaço, id vazio ou com espaço, texto antes do embrulho, segundo embrulho, outra tag).
- Permissão: sessão com papel do time não recebe o aviso.
- Regra 20, item 9: o hook não grava a entrada.
- Entrada malformada: sai 0, sem saída.
- Isolamento entre escolas e concorrência: não se aplicam. O hook não toca dado de escola nem tem operação que possa correr duas vezes ao mesmo tempo.

**Cobertos:**
- Os dois testes que o documento cita existem com o nome dele, em `tools/processo/harness/aviso-de-sessao.test.ts:68` (positivo, seis formas) e `:87` (negativo, 16 entradas). As asserções olham o resultado: `stdout` contém `.claude/skills/seguir/SKILL.md` e `siga com esta entrada` no positivo, e `stdout` é `''` no negativo. A mensagem de cada asserção traz a forma que falhou.
- Os testes que já existiam continuam: papel em `:60`, entrada malformada em `:113`, não grava em `:122`.
- Rodei `npx vitest run tools/processo/harness/aviso-de-sessao.test.ts`: 7 de 7 verdes.
- Conferi o diff contra a expressão `/^\s*(?:<pasted_content id="[\w-]+">\s*)?\/seguir /`. Cada parte dela tem um caso que ficaria vermelho se ela saísse:
  - Sem o `^`, ficam vermelhos `rode o /seguir agora` e `veja:\n<pasted_content…>`.
  - Sem o `\s*` inicial, ficam vermelhos `  ${corpo}` e `\n<pasted_content…>`.
  - Sem o grupo do embrulho, ficam vermelhas as quatro formas com embrulho.
  - Sem o `\s*` depois do embrulho, ficam vermelhas as formas com `\n`, `\n\n` e `\r\n`.
  - Com `\w` no lugar de `[\w-]`, fica vermelho `a1-B_2`.
  - Com `[^"]*` no lugar de `[\w-]+`, ficam vermelhos `id=""` e `id="a b"`.
  - Sem o espaço final, ficam vermelhos `/seguirdepois` e `/seguir`.
  - Sem o `<` do embrulho, fica vermelho `<outro_embrulho…>`.
- A primeira forma do teste positivo começa por `<`, então ficaria vermelha com o `startsWith` antigo, como o documento afirma.
- Os ids que aparecem nas transcrições do Orquestrador são quatro caracteres hexadecimais (só contei e li o formato da tag, não o conteúdo). O `[\w-]+` cobre todos. As 12 linhas fora desse formato são citações com `…`, de discussão, não mensagens coladas.
- Mutações: a linha `**Sem mutação:**` está justificada, porque o diff não toca `apps/*/src` nem `packages/*/src`.
- Não há `.skip`, teste comentado nem mock: o hook roda pelo comando do `settings.json`, num processo à parte. Não há IA envolvida.
- O caso `' /seguir tarefa'`, que o teste antigo dava como "nada", passou para o positivo. Era exigido: o C1 pede aceitar o espaço inicial (`tasks/prd-harness/validacao.md:106`).

**Bloqueantes:** nenhum.

**Recomendações:**
1. `.claude/hooks/aviso-de-sessao.sh:19` e `:28`: o comentário e o documento (`tasks/correcoes/2026-10-24-aviso-mensagem-colada.md:45`) dizem que `prompt` que não é texto não ganha aviso. Não vale para array: o `RegExp.test` converte `["/seguir x"]` em `"/seguir x"`, que casa. O `startsWith` antigo lançava erro nesse caso e o hook ficava calado. O Claude Code não manda array, então o impacto é nulo, mas a frase está errada. Duas correções possíveis:
   - trocar a condição por `typeof prompt === "string" && COMECA_POR_SEGUIR.test(prompt)` e somar `'{"prompt":["/seguir x"]}'` à lista de `:114`;
   - ou ajustar o comentário.
2. `aviso-de-sessao.test.ts:60`: o teste de papel só usa a forma pura. Um caso com o embrulho e papel preenchido deixaria explícito que a checagem de `CLAUDE_CODE_AGENT` vem antes da expressão, qualquer que seja a forma.
3. A Tech Spec §12 ("o texto colado chega assim, sem ser expandido", ainda marcado como não provado) e a §5(h) ("Olha o prefixo `/seguir `") estão desatualizadas em relação ao hook. O documento já deixa isso ao Orquestrador, para levar ao Arquiteto. Fica registrado para a revalidação.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/aviso-de-sessao.sh`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/aviso-de-sessao.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/correcoes/2026-10-24-aviso-mensagem-colada.md`

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 03:15:02 · `tasks/correcoes/2026-10-24-aviso-mensagem-colada.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- A mensagem colada de verdade dispara o aviso: o embrulho `<pasted_content id="…">` seguido de `\n`, `\n\n` ou `\r\n`, ou sem quebra, ou com quebra antes do embrulho, ou com espaço no começo.
- O `/seguir` no meio do texto não dispara, nem dentro nem fora do embrulho. Também não disparam `/seguirdepois`, `/seguir` sem espaço, id vazio ou com espaço, um segundo embrulho, outra tag, nem texto antes do embrulho.
- Sessão com papel (implementador, mesa-de-revisao, arquiteto, validador) não recebe aviso, na forma pura e na embrulhada.
- Entrada malformada sai 0, calada e sem nada no stderr: vazia, que não é JSON, sem `prompt`, número, null, lista, objeto.
- O hook não grava arquivo nem devolve o conteúdo do prompt, na forma pura e na embrulhada (regra 20, item 9).

**Cobertos:** todos, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/aviso-de-sessao.test.ts`. O arquivo roda verde (7/7) com `npx vitest run`. As duas recomendações da rodada 1 foram feitas.

- **Recomendação 1 (`typeof`):** o caso `'{"prompt":["/seguir x"]}'` (linha 117) prova a regra. Sem o `typeof`, `RegExp.prototype.test` converte a lista para `"/seguir x"`, a expressão casa, o hook devolve o aviso e o teste fica vermelho.
- **Recomendação 2 (papel antes da expressão):** a forma embrulhada no teste de papel (linha 63) prova a ordem. Sem a linha 13 do hook (`[ -z "${CLAUDE_CODE_AGENT:-}" ] || exit 0`), a forma embrulhada com papel devolveria o aviso e o teste falharia.
- **Ganho extra:** a nova asserção `not.toContain('SEGREDO-DA-MENSAGEM')` (linha 137) cobre o eco do conteúdo do prompt na saída. Antes isso não estava provado.

A correção mexe só em `.claude/hooks/` e no teste, sem `apps/*/src` nem `packages/*/src`. Por isso a linha `**Sem mutação:**` com motivo basta pelo RF17. Não há `.skip`, mock, chamada a provedor de IA, nem operação concorrente nesta correção.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O caso `'{"prompt":{"toString":"/seguir x"}}'` (linha 117 do teste) não testa o `typeof`. Sem o `typeof`, a conversão do objeto para texto lança `TypeError`, que cai no `catch` e sai 1. Ele já passava antes da mudança. Não faz mal manter. Mas o documento da correção (linha 52 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/correcoes/2026-10-24-aviso-mensagem-colada.md`) diz que a lista e o objeto ficavam "vermelho antes", e isso só vale para a lista. Vale ajustar o texto, ou o comentário do teste, para dizer que só a lista prova o `typeof` e o objeto cobre o `catch`.
2. Sigo de acordo com o que ficou na tabela de "Recomendações sem aplicar". A desatualização das §12 e §5(h) da Tech Spec vai ao Arquiteto pelo Orquestrador antes da revalidação.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 03:15:08 · `tasks/correcoes/2026-10-24-aviso-mensagem-colada.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A §12 e a §5(h) da `techspec.md` ainda não batem com o hook. Isso continua registrado, com destino (Arquiteto, via Orquestrador), na tabela "Recomendações sem aplicar" do documento. Foi o que a rodada 1 aprovou e não mudou nesta.

Portão local: carimbo válido. O `conferir` cobre o código atual com typecheck, lint, segredo, dependências, unidade e alvo.

Bloqueantes: nenhum. Não havia correção exigida na rodada 1. Revisei o diff desta rodada:
- A expressão só é testada quando `prompt` é texto. A guarda `typeof prompt === "string"` está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.claude/hooks/aviso-de-sessao.sh:29`.
- O cabeçalho do hook (linhas 5-7) e o comentário das linhas 20-21 descrevem o embrulho e a entrada que não é texto, e batem com o código.
- No teste, o caso de papel e o caso de "não grava" agora rodam a forma pura e a embrulhada. O caso de "não grava" também confere que o texto da mensagem não volta no stdout.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/aviso-de-sessao.test.ts:117`: o caso `{"prompt":{"toString":"/seguir x"}}` não ficaria vermelho sem o `typeof`. Sem a guarda, `RegExp.test` converte o objeto com `String()`. Como `toString` ali não é função e o `valueOf` devolve o próprio objeto, a conversão lança `TypeError` e o `catch` já sai 1. Quem prova a guarda é o `["/seguir x"]`, que vira `"/seguir x"` e casaria. O documento diz "com `["/seguir x"]` e um objeto [...] vermelho antes", o que dá a entender que os dois ficavam vermelhos. Convém deixar claro que só a lista era vermelha antes, ou trocar o objeto por um com `toString` que seja função.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/correcoes/2026-10-24-aviso-mensagem-colada.md`, seção "Correção": a condição citada ainda é só a `.test(prompt)`, sem o `typeof prompt === "string" &&` que entrou nesta rodada. Atualizar a frase, para o documento descrever o código que vai no commit.

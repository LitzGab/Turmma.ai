# Achados das revisões — `tasks/correcoes/2026-10-24-fixture-maestri-list.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-24 02:44:38 · `tasks/correcoes/2026-10-24-fixture-maestri-list.md`

VEREDITO: APROVADO

A correção mexe só em ferramenta do processo. Nenhum dado de aluno, professor, responsável ou escola entra ou sai.

Campos pessoais tocados: nenhum. A fixture `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/__fixtures__/maestri-list.txt` tem 23 linhas e só traz o seguinte:
- nomes de papel do time (`Arquiteto`, `Implementador`, `Mesa` e `Validador`, também com número);
- os terminais `Claude Code` e `Claude Code #2`;
- a nota `Comandos`;
- o portal `Vitrine computador` em `http://127.0.0.1:28090`, endereço local sem credencial.

Não aparece caminho com nome de usuário, título de sessão, hash, e-mail nem token, o que importa porque o repositório é público.
Fora da tabela de dados do docs/lgpd.md: nada; não há campo pessoal novo.
Autorização por objeto: não se aplica (não há rota nem repository nesta correção).
Logs: limpos; não há log novo.
Auditoria: não se aplica (nenhuma ação desta correção exige auditoria).
Envio externo: nenhum.
Seed/fixture: sintético. A fixture é saída de máquina gravada sem edição, sem dado de titular. O endereço é local e não abre acesso a nada.
Bloqueantes: nenhum.
Recomendações:
- Quando a fixture for regravada (o comentário em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/vigia.test.ts`, no teste `a saída real do maestri list (RF28)`, já pede isso quando o Maestri mudar o formato), repetir a mesma conferência antes de gravar. A saída de outro terminal pode trazer título de sessão ou caminho com nome de usuário. Hoje isso só é conferido na revisão; um teste que falhe com `/home/` ou com e-mail na fixture tiraria essa dependência.

Pergunta de fechamento: não se aplica. A correção não guarda nem envia nada sobre aluno.

Conferi também:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/vigia.ts:14` não mudou, e o filtro `TERMINAL_DO_TIME` deixa `Claude Code #2` de fora, como o teste agora afirma.
- `vigia.test.ts` passa: 30 de 30.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 02:44:41 · `tasks/correcoes/2026-10-24-fixture-maestri-list.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/vigia.test.ts:84`: o teste confere que `Claude Code #2` está na fixture, mas só prova que ele fica de fora de forma indireta, pela lista inteira no `toEqual`. Um `expect(nomesDoTime(lista)).not.toContain('Claude Code #2')` deixaria explícito o que o filtro faz. O mesmo vale para `Comandos`, que está no bloco "Connected notes", depois de "Connected agents:". Hoje ele só fica de fora porque não bate com `TERMINAL_DO_TIME`, e o teste não diz isso.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/2026-10-24-fixture-maestri-list.md:17`: "Nada: a árvore estava limpa." não responde ao que a seção pede, que é o que fica fora da correção. Basta escrever que a correção é só a fixture e a asserção, e que `vigia.ts` não muda.
- As duas recomendações de origem, `test-engineer` (1ª rodada) e `privacy-guardian` (2ª) em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/20_task.md:274` e `:277`, foram atendidas: a fixture foi regravada no terminal do Orquestrador e o conteúdo foi conferido antes de gravar. O que a fixture nova traz, um endereço de loopback (127.0.0.1) e nomes de terminal, não tem caminho com nome de usuário, título de sessão nem token. Na validação, vale marcar que essa parte do ensaio do RF31 já foi feita, para não ser refeita no fechamento.

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 02:45:02 · `tasks/correcoes/2026-10-24-fixture-maestri-list.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz: a saída real do `maestri list` no terminal do Orquestrador entrega os quatro papéis, incluindo as linhas numeradas.
- Borda 1: linhas numeradas (`Implementador 2`, `Mesa 3`). Isso prova o `( \d+)?` de `TERMINAL_DO_TIME`.
- Borda 2: um terminal que não é do time, no bloco dos ligados (`Claude Code #2`), fica de fora.
- Borda 3: as linhas `⎿ agent:` e `⎿ portal:` não viram nome. Sem isso, cada nome sairia duplicado.
- Borda 4: o bloco `You:` não entra na lista.
- Permissão e isolamento: não se aplicam, porque não há dado de escola nem rota.
- Privacidade (repositório público): a fixture não traz caminho com nome de usuário, título de sessão, token nem e-mail.

Cobertos:
- O caso feliz e as bordas 1, 2 e 3 estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/vigia.test.ts:85`, no teste "a saída real do maestri list (RF28) › lê os terminais do time entre os agentes ligados, e não o do bloco "You" nem o Orquestrador". A linha 84 confirma que `Claude Code #2` está mesmo na fixture, então a exclusão não passa por ele faltar.
- Conferi as mutações de cabeça, sem tocar em arquivo, todas contra a fixture nova:
  - Tirar o `( \d+)?` faz o teste ficar vermelho, porque somem `Implementador 2`, `Mesa 2`, `Implementador 3` e `Mesa 3`.
  - Afrouxar o filtro para aceitar qualquer nome faz entrar `Claude Code #2`, e o teste fica vermelho.
  - Afrouxar a regex de extração para pegar qualquer texto entre aspas faz entrar os nomes das linhas `⎿`, duplicados, e o teste fica vermelho.
  - Com a fixture antiga, o resultado era `['Mesa']` e o teste também ficaria vermelho. Isso confirma a afirmação "vermelho com a fixture antiga".
- A borda 4 está coberta pelo teste sintético da linha 35, `nomesDoTime('You:\n  - name: "Arquiteto"\n')` devolvendo `[]`, que fica vermelho se o corte no `Connected agents:` for removido.
- Privacidade conferida em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/__fixtures__/maestri-list.txt`. São 23 linhas, como o documento diz. Só há nomes de papel, `Claude Code`, `Claude Code #2`, a nota `Comandos` e o endereço `http://127.0.0.1:28090`, que é loopback e não leva credencial.
- O teste que roda a vigia por subprocesso (linhas 189 a 204) usa a mesma fixture. Agora ele consulta oito terminais em vez de um, e continua verde.
- `npx vitest run tools/processo/vigia.test.ts` passou: 30 de 30.
- Não há `.skip`, mock de coisa nossa, IA nem concorrência envolvidos.
- Nenhum arquivo de `apps/*/src` ou `packages/*/src` mudou, e a linha `**Sem mutação:**` está no documento com o motivo escrito.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/vigia.test.ts:77`: o nome do teste promete "e não o do bloco "You"", mas com a fixture nova isso deixou de ser provado por ele. A fixture antiga tinha `Implementador` no `You:`, e a asserção `['Mesa']` provava que esse bloco ficava de fora. A nova tem só `Claude Code` ali, que o filtro de papel já descarta. Se o corte em `Connected agents:` fosse removido, este teste continuaria verde. Quem prova essa parte hoje é o caso sintético da linha 35. Há duas saídas: ajustar o nome do teste ou o comentário para dizer que a exclusão do bloco `You:` está na linha 35, ou acrescentar uma asserção com uma variante da fixture real que tenha um nome do time no `You:`, como acontece quando a lista é tirada de um terminal do time.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/2026-10-24-fixture-maestri-list.md:32`: vale registrar no documento essa troca de cobertura (o bloco `You:` passou a ser provado só pelo teste sintético), para a validação não supor que a fixture real ainda prova isso.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 02:51:00 · `tasks/correcoes/2026-10-24-fixture-maestri-list.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

As duas correções exigidas na rodada 1 foram feitas:
1. O primeiro teste do bloco `a saída real do maestri list (RF28)` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/vigia.test.ts` agora diz que `Claude Code #2` e `Comandos` ficam de fora com `not.toContain`, e também confere que os dois estão na fixture.
2. A seção "Fora desta correção" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/2026-10-24-fixture-maestri-list.md` diz o que fica de fora: só a fixture e a asserção mudam, e `vigia.ts` não muda.

Os dois testes novos, que atendem o `test-engineer` e o `privacy-guardian`, provam o que dizem provar:
- **Bloco "You":** o teste põe `Implementador` no `You:` e afirma a lista exata `TIME`. Se o código deixasse de cortar a lista em `Connected agents:`, esse nome entraria duas vezes e o teste falharia.
- **Fixture sem dado pessoal:** cobre caminho de usuário, e-mail e URL fora do loopback. Rodei os padrões contra a fixture atual: só aparece `127.0.0.1` e nada mais casa (`maestro: true` e `` `maestri note read/write/edit` `` não disparam). Se a fixture não tivesse URL nenhuma, `every` sobre lista vazia daria verdadeiro, e esse é o comportamento certo.

A troca de cobertura está registrada no documento. Os dois testes saíram de pedidos da rodada 1 e não invadem tarefa futura.

Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/2026-10-24-fixture-maestri-list.md`, a seção "Teste que reproduz" ainda chama o teste pelo nome antigo, `lê os terminais do time entre os agentes ligados, e não o do bloco "You" nem o Orquestrador`. No código ele se chama `lê os terminais do time entre os agentes ligados, com as linhas numeradas, e deixa de fora o que não é do time`. Atualizar o nome para que quem procurar pelo documento encontre o teste.
- No mesmo documento, a seção "Recomendações sem aplicar" traz um aviso ao Validador: o ensaio do RF31 já foi feito nessa parte. É o Orquestrador quem leva o aviso no fechamento da spec.

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 02:51:14 · `tasks/correcoes/2026-10-24-fixture-maestri-list.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: a fixture real do Orquestrador dá os oito terminais do time, com as linhas numeradas.
- Borda: um terminal que não é do time (`Claude Code #2`) fica de fora.
- Borda: a nota ligada (`Comandos`), que vem depois de `Connected agents:`, fica de fora.
- Borda: um nome do time no bloco `You:`, como na lista de um terminal do time, não entra.
- Exposição: a fixture não leva caminho de usuário, e-mail nem endereço fora do loopback, porque o repositório é público.
- Isolamento entre escolas e concorrência não se aplicam: é parser puro de ferramenta interna, sem dado de escola e sem operação concorrente.

**Cobertos:**
- `lê os terminais do time entre os agentes ligados, com as linhas numeradas, e deixa de fora o que não é do time` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/vigia.test.ts:80`). Confere que `Claude Code #2` e `Comandos` estão na fixture e afirma `toEqual(TIME)` com os oito. Também afirma `not.toContain` para os dois.
- `não lê o bloco "You"…` (`vigia.test.ts:95`). Pela leitura de `vigia.ts:18`, se o corte em `Connected agents:` sair, `Implementador` entra duas vezes e o `toEqual(TIME)` fica vermelho. A guarda `expect(comPapelNoYou).not.toBe(lista)` impede que o teste passe sem montar a variante. Assim, a recomendação 1 da rodada anterior foi atendida pela segunda saída que propus. A recomendação 2 também: a troca de cobertura está registrada no documento, linhas 39–42.
- `a fixture não leva caminho de usuário…` (`vigia.test.ts:105`). Tem asserção de verdade sobre o conteúdo. O único endereço da fixture, `127.0.0.1`, passa no filtro.
- As aplicações pedidas pelo revisor-geral e pelo privacy-guardian estão feitas: o `not.toContain` explícito, o teste que falha com `/home/` ou e-mail, e a reescrita de "Fora desta correção".
- `npx vitest run tools/processo/vigia.test.ts`: 32 passaram, sem `.skip`, sem mock e sem provedor de IA.
- `git diff --stat` mostra só a fixture, o teste e o índice de achados. `vigia.ts` não mudou, e a linha **Sem mutação** está justificada.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O nome citado no documento ficou velho. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/2026-10-24-fixture-maestri-list.md:33`, "Teste que reproduz" ainda cita `lê os terminais do time entre os agentes ligados, e não o do bloco "You" nem o Orquestrador`. Esse teste foi renomeado nesta rodada para `lê os terminais do time entre os agentes ligados, com as linhas numeradas, e deixa de fora o que não é do time`, e um grep pelo nome antigo não acha nada. Vale trocar pelo nome atual antes do commit, para a validação achar o teste pelo nome. Os dois testes irmãos, nas linhas 39 e 43 do documento, são citados por prefixo do nome real e o grep os encontra; dá para citá-los inteiros pelo mesmo motivo.
2. O vermelho do teste de exposição com `/home/`, e-mail e URL externa foi provado à mão e restaurado (documento, linha 44). Ele não está no código. Se a fixture for regravada, uma variante em memória, como a do teste `You:`, deixaria esse vermelho provado dentro do próprio teste. É informativo e não bloqueia.

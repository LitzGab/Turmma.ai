# Achados das revisões — `tasks/correcoes/2026-10-24-seguir-abandonar-linha.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 03:12:05 · `tasks/correcoes/2026-10-24-seguir-abandonar-linha.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: o passo 6 de hoje traz `linhas.ts abandonar` e o conjunto inteiro passa.
- Borda 1: o termo sai do passo 6, e o teste tem de ficar vermelho com a mensagem exata.
- Borda 2: o texto encurtado para caber no teto passa do limite de 24.000 B. O orçamento do RF26 tem de continuar verde.
- Borda 3: as outras conferências do passo 6 continuam valendo depois dos cortes de texto (obrigatórios, proibidos e citáveis).
- Permissão e isolamento: não se aplicam. A correção não toca dado de escola nem rota, só um passo do `/seguir` e o teste que o lê.

**Cobertos:**
- Caminho feliz: `seguir.test.ts:409`, "o repositório de hoje passa", exige `passoDaTarefa(hoje)` igual a `[]`. Com a entrada nova em `OBRIGATORIOS_NO_PASSO_6` (`seguir.test.ts:66`), o teste falha se a linha for tirada do `6-tarefa.md`.
- Borda 1: o `it.each` em `seguir.test.ts:443` gera o caso "sem o comando que solta a linha presa (RF6): vermelho". Ele tira o termo com `tirar`, e o `estragar` (`seguir.test.ts:365`) garante que o arquivo de fato mudou. Depois o caso exige a mensagem exata, e não só "tem erro".
- Borda 2: `orcamento` (`seguir.test.ts:246`) mede os três arquivos sobre o disco e está verde.
- Borda 3: as demais conferências estão verdes. Rodei `npx vitest run tools/processo/harness/seguir.test.ts`: 102 de 102 passaram.
- "Sem mutação": a linha está bem justificada. O diff não toca `apps/*/src` nem `packages/*/src`.
- Não há `.skip`, mock nem IA envolvida.
- Conferi o texto novo contra `linhas.ts:559-576`. A branch e o checkout ficam, a tarefa volta a pendente e a próxima partida exige a árvore limpa: tudo confere.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **"um por vez" sumiu:** em `6-tarefa.md:134` a frase virou "O andar da spec e o térreo dividem o ambiente 0." O "um por vez" era a instrução; o que sobrou é só o fato, sem a consequência. O documento diz "encurtados sem perder instrução", e aqui perdeu. Cabe ao `revisor-geral` decidir.
2. **"uma vez" também sumiu:** em `6-tarefa.md:66` caiu o "uma vez" do `maestri check`. Ele servia para não deixar o Orquestrador conferir o terminal repetidas vezes. Mesmo ponto do item 1.
3. **Abertura que morreu tem outro desfecho:** nesse caso, `abandonar` tira a linha do quadro e manda abri-la de novo (`linhas.ts:568`). A tarefa não "volta a pendente". O item novo em `6-tarefa.md:120-121` junta as três situações sob um único resultado. Vale meia frase dizendo que, na abertura que morreu, a linha sai do quadro e se abre de novo. A condição "nenhum commit que a spec não tenha" também ficou de fora.
4. **O teste confere só a presença do termo:** ele procura `linhas.ts abandonar` em qualquer lugar do arquivo, sem exigir que esteja em "O que pode chegar" nem junto da situação. É o mesmo padrão dos outros obrigatórios e não bloqueia, mas um texto que citasse o comando fora de contexto passaria.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/2026-10-24-seguir-abandonar-linha.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/seguir/passos/6-tarefa.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/harness/seguir.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 03:12:06 · `tasks/correcoes/2026-10-24-seguir-abandonar-linha.md`

VEREDITO: APROVADO

Escopo: respeitado. Só mudaram o passo 6 do `/seguir` e o teste que o lê. `linhas.ts` não mudou.

Aderência à Tech Spec: ok. O item novo diz o mesmo que `abandonarSobATrava`: a tarefa volta a pendente, a branch e o checkout ficam, e a próxima partida exige a árvore limpa (`tools/processo/linhas.ts:559-576`, techspec §"Quadro (RF3, RF6)"). Não há divergência a registrar.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo). Os três arquivos somam 23.980 B, abaixo do teto de 24.000 B, como o documento diz.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/seguir/passos/6-tarefa.md:66`: o texto antigo dizia "um `maestri check` no terminal, uma vez". O "uma vez" mandava não repetir a conferência, e isso pesa no custo de tokens do Orquestrador. Ele saiu, e o documento afirma que o corte foi "sem perder instrução". Vale devolver o "uma vez" e cortar os bytes de outro lugar.
2. `6-tarefa.md:134`: a frase antiga terminava em "um por vez", que é uma ordem. A nova ("O andar da spec e o térreo dividem o ambiente 0") só constata um fato e não diz o que fazer com ele. A fila de carga do portão já põe um de cada vez, por isso não bloqueia, mas a frase agora é informação sem consequência. Ou a ordem volta, ou a frase sai.
3. `6-tarefa.md:120-121`: no caso "abertura que morreu", o `abandonar` não solta a linha nem devolve tarefa a pendente. Ele tira a linha do quadro, e é preciso rodar `linhas.ts abrir <n>` de novo (`linhas.ts:569`). O item também deixa de fora a segunda exigência da próxima partida: nenhum commit que a spec não tenha (`linhas.ts:573`). A saída do comando avisa as duas coisas, mas o passo que ensina o comando poderia dizer também.
4. `6-tarefa.md:96-97`: na saída `CONFLITO`, sumiu "e nada mudou", que dizia ao Orquestrador que o estado ficou intacto. O mesmo vale para "não é relatório de conclusão" na resposta ao `PEDIDO de estado` (linha 107). As duas perdas são pequenas, mas sobram motivos para corrigir a afirmação "sem perder instrução" no documento da correção.

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 03:18:12 · `tasks/correcoes/2026-10-24-seguir-abandonar-linha.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** o passo 6 ensina `linhas.ts abandonar` e diz quando usá-lo, ou seja, tarefa replanejada e papel morto.
- **Borda 1:** a abertura que morreu. Nesse caso o comando tira a linha do quadro e manda abrir de novo, em vez de soltar a tarefa.
- **Borda 2:** o que fica depois de soltar. A branch e o checkout ficam, e a próxima partida exige a árvore limpa e nenhum commit que a spec não tenha.
- **Borda 3:** o encurtamento para caber no teto do RF26 (24.000 B) não pode tirar instrução.
- Não há caso de permissão nem de isolamento: a mudança é texto de processo, sem dado de escola.

**Cobertos:**
- `tools/processo/harness/seguir.test.ts:66` é a única mudança no teste e continua igual à da 1ª rodada. É a entrada `linhas.ts abandonar` em `OBRIGATORIOS_NO_PASSO_6`, e o `it.each` de "o passo 6 se basta (RF26)" a cobre.
- Rodei `npx vitest run tools/processo/harness/seguir.test.ts` agora: 102 de 102 passam, inclusive a conferência do teto de bytes contra o texto novo.
- O texto novo de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/seguir/passos/6-tarefa.md:119-121` bate com o que `linhas.ts` faz:
  - na abertura que morreu, a linha sai do quadro e o comando manda abrir de novo (`linhas.ts:567-568`);
  - nos outros casos, a tarefa volta a pendente, e a branch e o checkout ficam, com "árvore limpa e nenhum commit que a spec não tenha" (`linhas.ts:572-573`). A citação `linhas.ts:569` do documento está a uma linha disso, mas aponta o lugar certo.
- As quatro instruções que voltaram na 1ª rodada estão no texto:
  - o "uma vez" do `maestri check` (:65);
  - o "e nada mudou" do `CONFLITO` (:96);
  - o "não é relatório de conclusão" (:106);
  - o "um por vez" do ambiente 0 (:134).
- Os outros cortes do diff não tiram ordem:
  - o comentário do `abrir`;
  - o "o terminal mantém a caixa, a posição e as ligações";
  - o "reinicie de novo", que ficou "reinicie";
  - o exemplo "implementação na árvore, sem portão";
  - o "A resposta chega a uma sessão que só tem o diário", que repete o item 6;
  - o "do encontro" e o "é aqui que";
  - o "antes de seguir";
  - o "Leia o motivo";
  - o "que repete o que o relatório trouxe".
- **Sem mutação:** não há arquivo de `apps/*/src` nem de `packages/*/src` no diff, então nenhum bloco de mutação era exigido.
- Não há `.skip`, mock nem provedor de IA envolvido.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O corte de "Não chega como mensagem:" em `6-tarefa.md:106` tira o único aviso explícito de que a resposta a um `PEDIDO de estado` não chega por `/seguir`. O "Lê-se na saída do `maestri ask` ou no `maestri check`" ainda leva a isso, mas por dedução. Se sobrarem bytes numa próxima rodada, vale devolver o aviso. O documento da correção também não lista esse corte entre os encurtamentos da seção "Correção" (linhas 38-41). Vale incluí-lo, para quem fizer a validação ver tudo o que saiu.
2. Minha recomendação 4 da 1ª rodada foi recusada com motivo registrado na tabela do documento. Ela segue registrada para a retro: o teste confere só a presença do termo, não a posição em "O que pode chegar".

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 03:18:20 · `tasks/correcoes/2026-10-24-seguir-abandonar-linha.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/.claude/skills/seguir/passos/6-tarefa.md:121`: a frase "o comando tira a linha do quadro, e se abre de novo (`abrir`)" está sem sujeito. Dá para ler que o próprio `abandonar` reabre a linha, e ele não reabre: `linhas.ts:569` só manda "Abra de novo". O documento da correção diz certo ("e ela se abre de novo com `abrir`"). Sugiro escrever "e reabra com `abrir`", que custa poucos bytes.
2. No documento da correção, linha 41, a descrição "uma oração do veredito da esteira" não corresponde bem ao que mudou na linha 87 do passo. O que saiu ali foram "do encontro" e "é ... que", e nenhuma oração saiu inteira. O sentido não mudou, então isso é só precisão do registro.

Sobre os cortes desta rodada, nenhum tira instrução:
- O comentário do `abrir` só dizia o que o comando faz por dentro.
- "O terminal mantém a caixa, a posição e as ligações" só explicava o motivo do `recruit --replace`, e o comando continua no bloco.
- "A resposta chega a uma sessão que só tem o diário" repetia o item 6 ("tudo o que você sabia já está no `estado.md` e no quadro").
- "O push do encontro" virou "O push", e o contexto do item continua sendo o encontro.

As quatro instruções que eu apontei na 1ª rodada voltaram ao texto: o "uma vez" do `maestri check`, o "um por vez" do ambiente 0, o "e nada mudou" do `CONFLITO` e o "não é relatório de conclusão" do `PEDIDO de estado`.

O item **Linha presa** cobre os dois desfechos que `abandonarSobATrava` produz (`linhas.ts:557-574`): soltar a linha e tirar do quadro a abertura que não terminou. O texto da linha 120 ("nenhum commit que a spec não tenha") bate com a recusa da partida (`linhas.ts:547`).

Os três arquivos somam 23.979 B, como o documento declara, dentro do teto de 24.000 B. O `seguir.test.ts` só ganhou a entrada em `OBRIGATORIOS_NO_PASSO_6`.

# Achados das revisões — `tasks/correcoes/2026-10-24-despejo-sem-barra-do-compose.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-24 10:43:19 · `tasks/correcoes/2026-10-24-despejo-sem-barra-do-compose.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. Só ferramenta de esteira, em `tools/ci/`. Não há código de API, worker, fila, IA ou migration.
Rate limit: não se aplica (não há endpoint novo)
Fila e prioridade: ok (não se aplica, não há job novo)
Concorrência: protegida. `lerLinhaDoDespejo` é função pura, sem estado e sem escrita.
Índice e paginação: ok (não se aplica, não há query)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica, fora do caminho quente)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tools/ci/compose.int.test.ts:264` usa `lida?.servico ?? ''` duas vezes e cai em `Number.NaN` depois de um `expect(...).toBeDefined()` que já interrompe o laço. Basta guardar o serviço numa constante, ou sair cedo com `if (lida === undefined) continue` depois do `expect`. Fica mais fácil de ler e o `NaN` deixa de parecer um caminho possível.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tools/ci/despejo-da-falha.ts:19`: com o `|` opcional, a regex aceita também um espaço só entre o serviço e o carimbo. Isso está de acordo com a promessa do despejo, mas convém um caso na unidade que mostre que é intencional (por exemplo `postgres-1 2026-...Z ok`), para a próxima pessoa não achar que é frouxidão.

Conferido nesta árvore:
- O teste novo, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tools/ci/despejo-da-falha.test.ts`, passa 12 de 12. Ele não chama provedor pago nem Docker.
- `tsc` no `tsconfig.json` da raiz, que inclui `tools`, e `eslint` nos três arquivos alterados saíram limpos.
- As recusas que importavam continuam cobertas: carimbo do Postgres, do Redis e do Caddy, deslocamento `-03:00`, carimbo depois da mensagem, carimbo solto no lugar do nome do serviço e data impossível.

Não rodei o caso de integração `compose.int.test.ts`, que precisa do ambiente do compose de pé. A estabilidade dele (10 de 10 verdes) está declarada na tarefa e não foi conferida por mim.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 10:43:22 · `tasks/correcoes/2026-10-24-despejo-sem-barra-do-compose.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. É uma correção, sem seção de Tech Spec citada. O documento diz o que fica de fora: não se investiga por que o compose entregou a linha sem o `|`. A mudança fica dentro desse limite.

Portão local: carimbo válido. O `conferir` cobre typecheck, lint, segredo, dependências, unidade e alvo.

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tools/ci/despejo-da-falha.ts`: só `compose.int.test.ts` usa esse arquivo. O despejo de verdade, `ETAPA_DO_LOG_DA_FALHA` em `tools/ci/compose.ts:154`, não lê linha nenhuma. Na prática é um ajudante de teste guardado como código de `tools/ci/`. O comentário do topo apresenta o arquivo como "uma linha do despejo da falha", o que sugere que alguém de produção o consome. Ele ficaria melhor em `tools/testes/`, onde já está `compose.ts` dos testes. Outra saída é o comentário dizer que o arquivo existe para o teste de integração.
- `tools/ci/compose.int.test.ts:265`: o `lida?.servico ?? ''` aparece duas vezes e o `lida?.instante ?? Number.NaN` só existe porque o `expect(...).toBeDefined()` não estreita o tipo. Uma checagem `if (lida === undefined) throw ...`, ou uma variável para o serviço, deixaria a linha legível. O comportamento é o mesmo, porque o `expect` já derruba o caso antes.
- `tools/ci/despejo-da-falha.ts:17`: o compose aceita nome de serviço que começa por dígito (`[a-zA-Z0-9][a-zA-Z0-9_.-]+`). Exigir letra no começo é uma restrição do projeto, e hoje todos os serviços da lista em `compose.int.test.ts:226-230` começam por letra. Um serviço novo que comece por número faria o caso ficar vermelho sem motivo. Vale uma linha no comentário dizendo que essa restrição foi escolhida de propósito.
- As quatro mutações declaradas são todas mortas pelos casos citados: conferi cada uma contra a entrada do teste. A troca de `\S+` por letra no começo é a única que justifica a regra nova, e o caso "dois carimbos e nenhum serviço" a cobre.

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 10:43:31 · `tasks/correcoes/2026-10-24-despejo-sem-barra-do-compose.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** linha com o prefixo `serviço  | ` e o carimbo do Docker.
- **Borda real, a que gerou a correção:** a linha literal da esteira 40095652612, sem o `|` e com o carimbo intacto.
- **Borda:** carimbo sem fração, quando o nanossegundo é exatamente 0.
- **Recusas:** carimbo do próprio Postgres, do Redis e do Caddy; deslocamento `-03:00`; carimbo do Docker depois da mensagem; linha sem serviço; dois carimbos sem serviço (com o `|` opcional, isso pegaria um carimbo solto como nome de serviço); carimbo no formato certo mas impossível; serviço sem carimbo nenhum.
- **Integração:** o caso `o despejo da falha sai cruzável` continua exigindo carimbo em toda linha, dois serviços ou mais e a janela de época.
- **Permissão, isolamento entre escolas e concorrência:** não se aplicam. A correção toca só `tools/ci/`, sem dado de escola, rota ou operação que rode duas vezes ao mesmo tempo.

**Cobertos:** todos, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tools/ci/despejo-da-falha.test.ts`. Rodei a unidade: 12 de 12 verdes. O caso de integração não rodei, porque precisa do compose de pé; isso fica com o portão.

O que conferi:
- **As 4 mutações chegam à cláusula certa:**
  - Com o `|` de novo obrigatório, a linha da esteira não casa e o teste espera `'postgres-1'`.
  - Com `^(\S+)`, a linha de dois carimbos casa: o primeiro carimbo vira o serviço e o segundo, o carimbo.
  - Sem o `isNaN`, a linha de mês 13 devolve `{ instante: NaN }` em vez de `undefined`.
  - Com o objeto no lugar do `null`, a linha com o carimbo do próprio Postgres deixa de ser recusada.
- **Nenhuma condição nova ficou sem bloco:** o arquivo novo tem três (a regex e os dois `if`), e as três têm mutação. O `mutacoes.ts --faltando` confirma.
- **O integrado não perdeu checagem:** o `expect(Number.isNaN(instante)).toBe(false)` saiu, mas o que ele checava foi para `lerLinhaDoDespejo`, que devolve `undefined` com NaN. Quem pega agora é o `toBeDefined` em `tools/ci/compose.int.test.ts:264`.
- **Asserções sobre o resultado:** checam o serviço e o instante lidos, não só que o código rodou. Não há `.skip`, teste comentado, mock nem chamada de IA.
- **Estabilidade:** o documento diz com clareza que as dez execuções em série não provam que a linha sem `|` não volta, e põe a prova na unidade com a linha literal. Não depende de a máquina estar folgada.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `tools/ci/despejo-da-falha.ts:17`, `[A-Za-z]` recusa nome de serviço que comece por dígito. O compose aceita esse nome (`^[a-zA-Z0-9][a-zA-Z0-9_.-]+$`). Nenhum serviço de hoje começa assim, então é só deixar a restrição escrita no comentário, para quem criar um serviço desses saber de onde vem o vermelho.
2. Acrescentar ao `it.each` uma recusa sem `|` e sem carimbo, como `'postgres-1    LOG:  ok'`. Hoje a recusa "serviço sem carimbo nenhum" só existe com o `|`, e o formato sem ele, que é o que a correção passou a aceitar, merece a sua.
3. Em `tools/ci/compose.int.test.ts:265`, o `lida?.servico ?? ''`, repetido, ficaria mais legível com um `if (lida === undefined) continue` depois do `expect`, ou com uma variável local. É só leitura: com `lida` indefinida, o `expect` já falha antes.

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 10:48:52 · `tasks/correcoes/2026-10-24-despejo-sem-barra-do-compose.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada. Nesta rodada, conferi as três recomendações que a Mesa mandou aplicar e se o diff entre `0078f246` e `0e0e0c1d` muda o que as mutações provam.

Cobertos:
- **Recomendação 1, feita.** O `it.each` ganhou a recusa `'postgres-1    LOG:  ok'`, sem `|` e sem carimbo (`tools/ci/despejo-da-falha.test.ts:39`). Ela prova que tornar o `|` opcional não deixa passar um serviço com mensagem e sem carimbo. Entrou também o teste com um espaço só entre o serviço e o carimbo (linhas 20 a 23). Ele aceita esse caso de propósito e o comentário explica por quê.
- **Recomendação 2, feita.** Em `tools/ci/compose.int.test.ts:265`, o `if (lida === undefined) continue` vem depois do `expect(...).toBeDefined()`. Esse `expect` já derruba o caso quando a linha não tem carimbo, então o `continue` só estreita o tipo e não esconde linha ruim. Os três `?? ''` / `?? NaN` saíram.
- **Recomendação 3, feita.** Em `tools/ci/despejo-da-falha.ts:18-20`, o comentário agora diz que exigir letra no início do nome do serviço é escolha do projeto, e qual vermelho aparece se um dia houver serviço começando por dígito.
- **Mutações seguem válidas.** O diff de `tools/ci/despejo-da-falha.ts` só mexe em comentários: a regex `PARTIDA` e a lógica são as mesmas. As mutações do documento continuam batendo no mesmo código e citam testes que ainda existem, com o mesmo nome.
- **Documento da tarefa.** Só mudou a seção "Recomendações sem aplicar", que registra a recusa de mover o arquivo para `tools/testes/` com o motivo. Isso não afeta os testes.
- Rodei `npx vitest run tools/ci/despejo-da-falha.test.ts`: os 14 testes passam. Não há `.skip` nem mock, e não há IA nem concorrência envolvidas.

Bloqueantes: nenhum.

Recomendações: nenhuma nova.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tools/ci/despejo-da-falha.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tools/ci/despejo-da-falha.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tools/ci/compose.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tasks/correcoes/2026-10-24-despejo-sem-barra-do-compose.md`

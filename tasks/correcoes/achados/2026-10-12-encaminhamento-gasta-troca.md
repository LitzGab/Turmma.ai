# Achados das revisões — `tasks/correcoes/2026-10-12-encaminhamento-gasta-troca.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-12 22:19:49 · `tasks/correcoes/2026-10-12-encaminhamento-gasta-troca.md`

VEREDITO: APROVADO
Caminho quente tocado: tutor (somente nos testes; nenhum código de produção mudou)
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- `apps/api/src/tutor/tutor.int.test.ts:363`: o terceiro caso afirma que a conta segue além do teto, com 61 trocas e o estado `limite`. Na barra do aluno isso aparece como "Hoje: 61 de 60". Isso confirma, com teste, o laço sem teto de IA das mensagens delicadas que já está no `TODO.md` ("Assunto delicado sem teto de IA"). Vale registrar o número no item do TODO, para que o `/retro` e a decisão sobre as 60 trocas o vejam. O caminho é regra fixa, sem chamada de modelo (`consumo_ia` com `regra_fixa`, linha 301), e por isso não custa provedor hoje.
- `apps/api/src/tutor/tutor.int.test.ts:346`: o caso compara `noMesAntes + 1` na turma compartilhada `a.turma`. Isso só se sustenta porque o arquivo roda em sequência. Se o arquivo passar a rodar com `concurrent`, o caso fica instável. Uma turma própria no caso tira essa dependência.
- `e2e/aluno-fluxo.spec.ts:202`: a espera com `PRAZO_DA_TELA_MS` (20 s) resolve a corrida entre o cartão e a releitura da conversa. O cenário de carga não precisa mudar, porque nenhum caminho de produção mudou.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-encaminhamento-gasta-troca/tasks/correcoes/2026-10-12-encaminhamento-gasta-troca.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-encaminhamento-gasta-troca/apps/api/src/tutor/tutor.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-encaminhamento-gasta-troca/e2e/aluno-fluxo.spec.ts

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-12 22:20:00 · `tasks/correcoes/2026-10-12-encaminhamento-gasta-troca.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta correção. Ela altera só dois arquivos de teste (`apps/api/src/tutor/tutor.int.test.ts` e `e2e/aluno-fluxo.spec.ts`) e não toca código de produção nem contrato. Todos com autor humano? sim, porque nenhum caminho de escrita foi criado ou alterado.
Decisão autônoma sobre aluno: ausente. Recusar a dúvida comum com `429 LIMITE_DIARIO_DO_TUTOR` é o freio de uso (D38), não uma decisão sobre a trajetória do aluno.
Aprovação registrada: ok. A correção não cria saída de IA que chegue ao aluno. A resposta do assunto delicado é uma mensagem fixa (`turnoDoTutor.semModelo`, `tutor.service.ts:321`), não sai de modelo, e fica dentro da exceção do tutor (D47).
Supervisão do tutor: ok. O caso 1 e o caso 3 fazem a lista da professora (`trocasHoje`) e o mês da turma contarem o turno delicado como uma troca. Ela vê que houve uso sem ver o conteúdo, como pede a D36, e nada novo aparece sobre o comportamento do aluno.
Autonomia declarada e visível: sim, sem mudança. A correção não mexe em nível nem em tela de autonomia.

Bloqueantes: nenhum.

O que conferi na regra 70:
- **Item 4 e D36: o encaminhamento passa no limite.** O caso "no limite, o encaminhamento passa e a conta segue: 60 mais 1" (`tutor.int.test.ts`, no grupo "o encaminhamento gasta uma troca, por ora") prova que, com as 60 trocas usadas, o aluno ainda recebe a mensagem fixa e o 188. Contar o encaminhamento não o bloqueia, e isso protege o aluno.
- **Item 7: supervisão não é vigilância.** Na conta da professora, o turno delicado é um "+1" que não se distingue de uma dúvida comum. Não aparece tipo, conteúdo nem sinal novo nas contagens. Não há inferência emocional e não há medida nova de navegação ou de tempo.
- **Itens 2a e 8: discursiva, redação e professor.** Não são tocados.
- **"Gasta, por ora".** A decisão está registrada como do Joaquim em `TODO.md:960`, com dono e com o que muda se ela virar "não gasta". O e2e (`e2e/aluno-fluxo.spec.ts:199-202`) e o comentário do grupo de integração dizem que ela é provisória.
- **Mutações.** As quatro existem nos arquivos de produção: `orcamento.repository.ts:75`, `tutor.repository.ts:403-404`, `supervisao.repository.ts:286` e `:305`. Cada uma é casada pela linha de contexto e cobre uma das quatro contas. A da linha 237 de `supervisao.repository.ts` não casa, porque ali a linha seguinte é a do `alunoId`, não a do `autor`. A conferência fina das mutações é do `test-engineer`.

Recomendações:
1. **`TODO.md:979-981` ficou desatualizado.** Ali ainda se lê "nenhum teste fixa a conta" e que a linha 199 afirma "0 de 60". Depois do pouso, vale apontar para o grupo "o encaminhamento gasta uma troca, por ora" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-encaminhamento-gasta-troca/apps/api/src/tutor/tutor.int.test.ts`. As referências `tutor.int.test.ts:322` e `e2e/aluno-tutor.spec.ts:316`, no mesmo item, também se deslocam com o grupo novo. A correção diz que não muda o `TODO.md`, então isto fica para o `/retro`.
2. **Peso do "por ora" no caso 2.** O caso "com 59 trocas feitas" fixa que um aluno que relata bullying na 59ª troca perde a última dúvida comum do dia. Isso não viola a regra 70, porque o freio não é decisão sobre a trajetória do aluno e o encaminhamento passa sempre. Mas é um argumento a levar à decisão definitiva do Joaquim, junto com o aviso de pausa que aponta um adulto (item 2 da verificação do Arquiteto).
3. **Sinal no mesmo caso.** O caso 1 poderia afirmar, além da conta, que o sinal ao professor nasce sem o conteúdo. Hoje isso está coberto só pelo caso vizinho, "passa na frente do freio do dia", e o grupo novo provaria as duas coisas da D36 lado a lado.

## test-engineer · 1ª rodada · APROVADO · 2026-10-12 22:20:53 · `tasks/correcoes/2026-10-12-encaminhamento-gasta-troca.md`

VEREDITO: APROVADO

**Cenários exigidos** (a correção só mexe em testes; o código do Tutor não muda):
- **Caminho feliz:** um aluno novo faz um encaminhamento, e a barra do aluno, a lista de hoje da professora e o mês da turma sobem de 0 para 1.
- **Borda, freio no 59º:** com 59 trocas feitas, o encaminhamento conta como a 60ª. O estado vira `limite` e a dúvida comum seguinte recebe 429 `LIMITE_DIARIO_DO_TUTOR`.
- **Borda, freio já estourado:** com 60 trocas, o encaminhamento passa mesmo assim e a conta segue para 61, com o estado `limite`, na barra do aluno e na lista da professora.
- **Borda, avaliação aberta (e2e):** a pergunta comum recusada não grava nada, e o encaminhamento grava 1.
- **Corrida da tela:** a asserção não pode depender de ler a barra antes ou depois da releitura da conversa.
- **Permissão e isolamento:** não há rota, repository nem cláusula de escopo nova. Os casos de isolamento do Tutor que já existem continuam valendo, e não há caso novo a exigir.

**Cobertos:**
- **Os três casos de integração:** estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-encaminhamento-gasta-troca/apps/api/src/tutor/tutor.int.test.ts:334-371`. Rodei `npx vitest run --project integracao … -t "o encaminhamento gasta uma troca"` e os 3 passaram.
- **As quatro mutações:** conferi os pontos onde cada uma se aplica.
  - Em `orcamento.repository.ts:75` (freio e pacote), o caso das 59 trocas cai, porque a dúvida comum passaria a receber 202 em vez de 429.
  - Em `tutor.repository.ts:404` (`usoDeHoje`), a âncora com `alunoId` na linha de cima é única. O caso de 0 para 1 cai em `uso.hoje`.
  - Em `supervisao.repository.ts:286` (`trocasDeHoje`), a âncora com `inArray` é única. O caso de 60 mais 1 cai em `trocasHoje`.
  - Em `supervisao.repository.ts:305` (`trocasDaTurmaNoMes`), a âncora com `turmaId` é única: na linha 237, depois de `turmaId` vem `alunoId`, e não `autor`. O caso de 0 para 1 cai em `noMesAntes + 1`.
  - Cada caso citado lê exatamente a conta que a sua mutação tira, então os quatro caem pela razão certa.
- **As asserções são sobre o número:** comparam valores com o estado e o código de erro, e não só o status HTTP.
- **O e2e:** a linha 202 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-encaminhamento-gasta-troca/e2e/aluno-fluxo.spec.ts` agora espera pelo valor final (1) usando `PRAZO_DA_TELA_MS`, que existe na linha 19. A leitura velha diz 0, que nunca satisfaz a asserção, então a corrida acabou. O 1 também prova que a recusa durante a avaliação não contou: se tivesse contado, a barra mostraria 2.
- **O que procurei e não achei:** não há `.skip`, mock de coisa nossa nem chamada a provedor pago. O teste usa o adaptador falso, e o encaminhamento passa pela regra fixa.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Pacote do mês:** nenhum caso afirma que o encaminhamento conta no pacote do mês, por exemplo com `porMes` configurado para que ele esgote o pacote. Hoje a cláusula é a mesma do freio, e a mutação 1 cobre as duas contas. Se as consultas se separarem um dia, o pacote fica sem prova.
2. **Mesma chave de envio:** o teste de idempotência com a mesma chave (linha 207) cobre só o turno comum. Falta um caso com duas chamadas em paralelo e a mesma chave no caminho do encaminhamento, provando que a troca é contada uma vez só. A correção não muda código, então isso não bloqueia; fica para o `/retro`.
3. **Virada do mês:** o caso de 0 para 1 lê `noMesAntes` e depois espera `noMesAntes + 1`. Se ele rodar exatamente na virada do mês (fuso de São Paulo), a conta erra. O risco é desprezível; uma linha de comentário basta.

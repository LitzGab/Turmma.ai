# Achados das revisões — `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-25 16:12:48 · `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

VEREDITO: APROVADO

Cenários exigidos:
- Item 2, a matriz do revogar: `sem_convite` responde `NAO_ENCONTRADO`, como diz a tabela da Tech Spec. A matriz do refazer não muda.
- Item 3, `revogarParaRefazer`: o convite em aberto de outro tipo, na mesma escola, não é revogado e nenhum usuário é devolvido. A escola errada, o convite já usado e o vencido continuam valendo.
- Item 4: o texto do 401 é conferido por extenso, e não só contra o catálogo.
- Item 7: `entrar` sem contexto de requisição recusa com `ERRO_INTERNO`, não gasta o desafio e não abre sessão. O mesmo pedido, pela rota, ainda entra.
- Item 9, `consolidar-uso`:
  - todas as escolas encontradas inexistentes: o job falha sem ser definitivo, não grava nem apaga nada, e o log leva só a contagem;
  - escola real no contador ou só no storage: o job termina;
  - nenhuma escola encontrada: o job termina;
  - uma inexistente no meio de escolas reais: continua só pulada;
  - job executado duas vezes em paralelo.
- A regra de lint `assertionStyle: 'never'`.
- Isolamento: o repository continua preso à escola do contexto.

Cobertos:
- **Item 2:** `packages/shared/src/operacao/painel.test.ts:119-142` fixa as duas matrizes inteiras. Com `sem_convite: 'conflito'` o teste fica vermelho. Conferi `convite.service.ts:288-292`: o comportamento é o mesmo nos dois valores, porque `revogado() === undefined` já respondia `NAO_ENCONTRADO`. A web (`acoes-do-convite.ts:24`) só procura `'revogar'`.
- **Item 3:** `apps/api/src/sessao/convite.repository.int.test.ts:216-235` usa um convite em aberto em `escolaA`, no contexto de `escolaA`. Tira o check numa transação que volta atrás e confere o que foi devolvido, o estado da linha e que o check voltou. Sem `eq(convite.tipo, 'coordenador')` o update pegaria a linha, então o teste mata a cláusula. O caso positivo e o isolamento entre escolas continuam em `:194-213`.
- **Item 4:** `apps/web/src/operacao/textos.test.ts:44-48`.
- **Item 7:** `apps/api/test/segundo-fator-operador.int.test.ts:376-386`. As três asserções provam o resultado: o erro, zero sessões abertas e depois 200 com o mesmo desafio. Um `throw` colocado depois de `#desafioConsumido` também deixaria o teste vermelho, pelo 200 do fim.
- **Item 9:** `apps/worker/test/uso.int.test.ts:391-448` cobre os três limites. As mutações registradas conferem com as cláusulas do diff: `size > 0`, `every` e `some`, as duas origens de `encontradas`, o `inexistentes.add` e o `throw`. A concorrência já existente pega o `size > 0`. O caso "reprodução" pega o `some`.
- Não há `.skip`, `.only` nem teste comentado no diff. Nenhum mock esconde regra: no item 9 só o storage e o contador são substituídos, e o banco é real.
- Rodei os dois arquivos de unidade (`painel.test.ts` e `textos.test.ts`): 22 verdes. Os de integração não rodei, como foi pedido.

Bloqueantes: nenhum.

Recomendações:
1. `apps/worker/test/uso.int.test.ts:417` (`escolasTotal: 2`): o teste não distingue `encontradas.size` de `escolas.length`, porque os dois dão 2. Uma escola inexistente só no contador (3 encontradas contra 2 no storage) prenderia o número que o runbook promete. Também vale conferir `orfaB` na linha `:418`, que hoje só procura `orfaA`. E `escolasTotal` quer dizer outra coisa em `uso.consolidado` (só o storage). Um nome próprio, como `encontradasTotal`, evitaria que alguém leia os dois como iguais.
2. `eslint.config.mjs:49-52`: a mutação da regra de lint foi provada à mão, pelo stdin. Nada fica vermelho se alguém voltar a regra antiga. `tools/guardas/guardas.test.ts` já tem o padrão de passar um arquivo de exemplo pelo ESLint do repositório com um caminho simulado. Um arquivo com o `Partial<Totais>` afirmado no fim, no caminho `apps/worker/src/processadores/x.ts`, tornaria a prova permanente. Não bloqueia: a regra da 9.0 também entrou sem esse teste, e ela protege o tipo, não uma regra de negócio.
3. `apps/api/src/sessao/convite.repository.int.test.ts:222`: o `alter table convite drop constraint` trava a tabela `convite` inteira até o rollback. Se outro arquivo de teste usar `convite` no mesmo banco ao mesmo tempo, ele espera. Hoje dura milissegundos. Vale um comentário, ou mover esse teste para o fim do `describe`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-25-acabamento-da-a0b.md
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/painel.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/segundo-fator-operador.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/uso.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/textos.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/eslint.config.mjs

## test-engineer · 2ª rodada · APROVADO · 2026-09-25 16:43:57 · `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

VEREDITO: APROVADO

**Cenários exigidos (nesta rodada):** conferi as três recomendações da 1ª rodada no diff e no que ele afeta. O resto da correção não mudou e não foi reauditado.

1. **O número do log `uso.nenhuma_escola_no_banco` e os ids fora dele.**
   - O número tem que ser o total de escolas encontradas no contador e no storage juntos, não só as pastas do storage.
   - Nenhum id de escola pode aparecer no log.
   - Tem que haver órfã só no contador, para os dois totais darem números diferentes.
2. **A regra de lint `assertionStyle: 'never'` dos processadores com teste permanente.**
   - Ela tem que reprovar o `{} as T` e o `Partial<T>` afirmado no fim.
   - Ela não pode acusar o objeto literal tipado nem o `as const`.
3. **O comentário sobre o `alter table` travar a tabela `convite`** no teste do `revogarParaRefazer`.

**Cobertos:**

- **Item 1**, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/uso.int.test.ts:391-430`:
  - São três órfãs: A no contador e no storage, B só no storage, C só no contador. Há 3 encontradas e 2 pastas.
  - O teste confere `encontradasTotal: 3` na linha 428. Se o código contasse `escolas.length`, daria 2 e o teste ficaria vermelho.
  - O teste confere que nenhum id das três aparece na linha do log (`:429`). Logar o id quebra o teste.
  - Os avisos das duas origens estão presos: os do storage em ordem, os do contador em qualquer ordem, porque o `SCAN` não tem ordem fixa. O contador de ignoradas dá 2 e 2, e os contadores do Redis continuam lá.
  - A troca do nome da chave está coerente em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts:172-173` e em `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:398-399`. Não sobrou `escolasTotal` nesse evento. O `uso.consolidado` continua com o `escolasTotal` dele, conferido em `:457`.
- **Item 2**, em `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/guardas.test.ts:54-68` com a fixture `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/__fixtures__/afirmacao-de-tipo-no-processador.ts`:
  - O teste compara o resultado com as marcas por igualdade exata. Por isso ele fica vermelho nos dois sentidos: se a regra deixa passar a linha 10 ou a 18, ou se acusa o `as const` da linha 7 ou o objeto literal da linha 22.
  - Se as marcas da fixture sumirem, `marcasDeViolacao` falha.
  - O teste exige que o ESLint não devolva erro fatal, então a fixture precisa compilar.
  - A fixture fica fora do lint do repositório (`eslint.config.mjs:15`).
  - A mutação que voltava à regra anterior foi rodada e deixou o teste vermelho, e ela tem linha na seção "Mutações".
- **Item 3**, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts:219-222`: o comentário está presente e correto. Nenhuma asserção do teste mudou.

**Bloqueantes:** nenhum.

**Recomendações:**
- Falta na seção "Mutações" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-25-acabamento-da-a0b.md` uma linha para `encontradasTotal: encontradas.size` → `escolas.length`. O teste pega essa troca (3 contra 2), mas a mutação não está registrada. Sugestão: `consolidar-uso.ts, encontradasTotal de escolas.length | › todas as escolas encontradas inexistentes …`.
- O teste novo em `guardas.test.ts:54-68` repete o miolo do `lintar()`, porque a regra não está em `regrasObservadas`. Uma alternativa é dar ao `lintar` um parâmetro opcional com o conjunto de regras. É só organização e não bloqueia.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-25 16:45:05 · `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration nesta correção. As tabelas envolvidas são `convite` e a de uso por escola, pelo `UsoRepository` no worker. As duas já têm `escola_id`, e os ids são UUID.

Queries verificadas:
- `ConviteRepository.revogarParaRefazer`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts:158-165`. A escola continua vindo de `escolaDoContexto()`, e o `where` ganhou `eq(convite.tipo, 'coordenador')`. Não há parâmetro de escola vindo do cliente.
- `revogarConvitePeloOperador`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts:278-302`. A escola é resolvida pelo convite (`escolaDoConviteParaOperador`) e nunca pelo argumento. A troca de `sem_convite` para `nao_encontrado` em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/painel.ts:125` faz esse caso responder `NAO_ENCONTRADO`. É a mesma resposta dada ao id inexistente, ao id de outro tipo e ao convite já revogado. O comportamento fica igual ao anterior e não se abre um caminho que responda diferente e confirme a existência do convite.
- `criarConsolidacaoDeUso`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts:107-175`. É rotina do sistema e a gravação continua sob `executarNoContexto` com a escola da vez. A falha nova só lê o conjunto de escolas encontradas e grava no log apenas `encontradasTotal`, sem ids e sem nenhum dado de escola. Não alcança dado individual nem cruza escolas.
- Nenhum `@SemEscopo()` novo.
- Nenhum endpoint novo. Nenhum endpoint passa a aceitar `escolaId` do corpo ou da query string.

Teste de isolamento: presente e efetivo. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts:216-237` usa um convite em aberto da própria escola A, com o contexto da escola A e o id certo. Dentro de uma transação que volta atrás, o check `convite_tipo_valido` sai e o convite vira `professor`. Tirando mentalmente o filtro `tipo`, as demais condições do `where` continuam verdadeiras: o `update` revogaria o convite e devolveria o usuário, e `expect(visto).toEqual({ devolvido: undefined, revogado: false })` quebraria. O teste também confere que o check voltou depois do rollback.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts:279` ainda tem `contextoAtual()?.requisicaoId ?? randomUUID()`. É o mesmo caminho morto que o item 7 da correção tirou do `segundo-fator.service.ts`, e o `TODO.md` só registra o de `painel.service.ts:62`. Não afeta o escopo, que vem do convite, mas vale registrar no `TODO.md`.
- `REFAZER_CONVITE_POR_ESTADO.sem_convite` continua `conflito`. É inalcançável e está fixado em teste. Se um dia ficar alcançável, a entrada deve passar a `nao_encontrado` junto com o tipo, para que "outro tipo" e "inexistente" continuem respondendo igual.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-25 16:45:30 · `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A correção só muda uma frase de `docs/lgpd.md:107-110` que descreve dados que já existem: o nome e o e-mail da coordenadora convidada, e a conta do operador.

Fora da tabela de dados do docs/lgpd.md: nada. A frase nova remete a duas linhas que existem na tabela: "Convite de coordenador" (`docs/lgpd.md:72`) e "Conta de operador Turmma" (`docs/lgpd.md:76`). Conferi a frase contra o contrato de saída do painel (`packages/shared/src/operacao/painel.ts:192-234`), que só traz id, nome e endereço da escola, rede, estado da coordenação e números. Ela está certa: o único dado de pessoa da escola que passa pelo painel é o convite digitado pelo operador.

Autorização por objeto: ok.
- `apps/api/src/sessao/convite.repository.ts:160-163`: o filtro `eq(convite.tipo, 'coordenador')` entrou em `revogarParaRefazer`, somado ao escopo `escolaDoContexto()` que já estava lá. O repository agora se defende sozinho. O teste em `apps/api/src/sessao/convite.repository.int.test.ts:216-237` quebra se o filtro for apagado.
- `packages/shared/src/operacao/painel.ts:125`: no revogar, `sem_convite` agora responde `nao_encontrado`. É a mesma resposta de "não existe" e de "sem permissão", como a regra 20, item 6 exige, e o comportamento visível não muda.

Logs: limpos.
- `apps/worker/src/processadores/consolidar-uso.ts:173`: `uso.nenhuma_escola_no_banco` leva só `evento` e `encontradasTotal`. O teste em `apps/worker/test/uso.int.test.ts:426-429` confere que nenhum dos três ids aparece na linha.
- `uso.escola_ignorada` (`consolidar-uso.ts:114`) não mudou: id da escola, origem, causa e o erro resumido, sem a mensagem do banco. Id de escola não identifica pessoa.
- `apps/api/src/operacao/segundo-fator.service.ts:182`: `operacao.contador_nao_zerado` usa o contexto da requisição conferido no começo de `entrar` (`:133-134`), mais o `operadorId`. Não inventa mais `requisicaoId` e não leva nenhum dado de pessoa. Sem contexto, `entrar` recusa com `ERRO_INTERNO` antes de gastar o desafio, e o teste em `apps/api/test/segundo-fator-operador.int.test.ts:376-386` prova isso.

Auditoria: presente. A correção não cria nem mexe em nenhuma ação que a regra 20, item 10 obriga a auditar. O `revogarParaRefazer` continua dentro do caso de uso que já grava `convite.refeito`.

Envio externo: nenhum.

Seed/fixture: sintético.
- As escolas órfãs do teste do worker são UUIDs gerados na hora.
- O IP do teste do segundo fator é `203.0.113.9`, uma faixa reservada para documentação.
- A fixture de lint (`tools/guardas/__fixtures__/afirmacao-de-tipo-no-processador.ts`) não tem dado de pessoa.
- A pendência do `TODO.md` sobre o anúncio "Escola X criada." fora do `<dialog>` modal só registra o problema de acessibilidade, com um nome de exemplo. Não expõe dado e não precisa de nada do lado da privacidade.

Bloqueantes: nenhum.

Recomendações:
1. `docs/lgpd.md:108-109`: a lista do que o painel recebe do operador diz "e-mail, senha e segundo fator, na entrada". Só que `GET /v1/operacao/eu` também devolve o nome e o apelido dele (`packages/shared/src/operacao/eu.ts:16-22`). A remissão à linha "Conta de operador Turmma" já cobre isso, mas escrever "e o nome e o apelido, na sessão" deixaria a frase completa para quem a lê no dossiê.
2. `TODO.md`, a pendência de `apps/api/src/operacao/painel.service.ts:62`: esse caminho morto que inventa `requisicaoId` também afeta o rastro de log do painel. Vale levar a pendência para a próxima tarefa que tocar esse arquivo, como o `TODO.md` já diz, e não deixá-la esfriar.

Pergunta de fechamento: a correção não muda o que o sistema guarda sobre um aluno nem para onde isso é enviado. A resposta continua a mesma da validação da A0b, que já foi aprovada.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-25-acabamento-da-a0b.md
- /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md
- /home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md
- /home/joaquimdp/Documentos/git/Educa.ia/TODO.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/uso.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/segundo-fator.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/segundo-fator-operador.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/painel.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/eu.ts

## infra-guardian · 1ª rodada · APROVADO · 2026-09-25 16:45:34 · `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

VEREDITO: APROVADO
Caminho quente tocado: login (segundo fator do operador), fila (rotina de lote `sistema.consolidar-uso`)
Rate limit: ok (a correção não mexe nele)
Fila e prioridade: ok. A falha é `FalhaDeJob(ERRO_INTERNO)` não definitiva, na fila de lote às 2h. Cada nova tentativa só pula as escolas de novo, sem gravar nem apagar nada, então é idempotente (D49).
Concorrência: protegida. `revogarParaRefazer` continua sendo um `update ... where` atômico e agora também filtra `tipo = 'coordenador'`. A checagem de contexto em `entrar` roda antes de `#desafioConsumido`, então nenhum desafio é gasto por falha de montagem.
Índice e paginação: ok (não há query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. Não entrou alerta novo. A linha nova `uso.nenhuma_escola_no_banco` leva só `encontradasTotal`, sem id, e tem parágrafo no `docs/runbook.md:397`.
Bloqueantes: nenhum
Recomendações:
- O título do teste em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/uso.int.test.ts:391` diz "o job falha no fim para a fila e o alerta perceberem", mas nenhum alerta vê isso hoje. Não existe regra em `infra/grafana/alertas/` para job de rotina que falhou, e o próprio runbook, em "Rotina do sistema sem rodar", diz que "hoje nada avisa". Hoje a falha só aparece em `job_registro`. Tire "e o alerta" do título, ou deixe claro que isso depende da pendência do alerta.
- No parágrafo "Todas as escolas da noite inexistentes" (`/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:397`), escreva "Sem alerta" como no parágrafo-mãe, e aponte para a pendência de `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md:140`. Essa pendência é o alerta pelo horário do último sucesso, regra `time() - x > 26h`, e é ela que vai pegar o banco errado. Enquanto não existir, o operador só vê o problema indo procurar.
- Na entrada de `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md:140`, cite o `uso.nenhuma_escola_no_banco` como um dos casos que o alerta de rotina parada precisa cobrir. Assim o alerta não nasce contando só o sucesso de rotinas que não falham.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-25 16:46:32 · `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

**VEREDITO: APROVADO**

**Escopo:** respeitado. Os nove itens da tabela saem da retro e da validação (rodada 2, menores 1 a 3, e os menores 7 e 8 da rodada 1). A troca da regra de lint para `assertionStyle: 'never'` fecha uma recomendação sem destino da 9.0, que a origem do documento inclui. As outras pendências foram para o `TODO.md` com destino. Nada invade tarefa futura.

**Aderência à Tech Spec:** ok.
- A entrada `REVOGAR_CONVITE_POR_ESTADO.sem_convite` passou para `nao_encontrado`. Isso muda o valor da matriz; a validação só pedia um comentário. Mas agora a matriz bate com a tabela da seção 5 da `techspec.md`, a própria seção 5 registra a mudança, e a resposta do `revogarConvitePeloOperador` continua a mesma. O E6 do `cenarios.md` remete à tabela, então não diverge.
- O W10 do `cenarios.md` ganhou o texto do gerar, que é o que o código e o teste já tinham.

**Portão local:** carimbo válido (typecheck, lint, test, infra).

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Exceção estreita demais no runbook.** Em `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:399-403`, a exceção fala só do "ambiente cuja única escola no storage foi eliminada".
   - O falso positivo é mais largo: basta que todas as escolas encontradas naquela noite sejam eliminadas. Antes da A2 nenhuma escola real tem pasta no storage, então um sábado ou feriado sem requisição, somado a uma escola eliminada, faz o job falhar toda noite.
   - A frase "Não é escola eliminada" contradiz a exceção logo abaixo.
   - Hoje não se alcança, porque não existe eliminação de escola. Vale acrescentar isso na linha do `TODO.md:51` ("Eliminar escola apaga também o resto de uso dela"), para a spec da eliminação saber que o resto de uso agora também derruba o job.
2. **Comportamento fora da Tech Spec do F0.** O que a consolidação faz com escola que não existe está só no docblock de `apps/worker/src/processadores/consolidar-uso.ts` e no runbook: pular a escola inexistente, e falhar o job quando todas as encontradas são inexistentes. Isso já vinha da correção anterior. Uma linha em `tasks/prd-fundacao-tecnica/techspec.md`, item "Consolidação", evitaria que o próximo leitor da spec ache que o job só falha com Redis, Postgres ou storage fora.
3. **Linha fora da quebra.** Em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md:170`, a linha ficou bem mais longa que a quebra do resto do W10. É só formatação.

Arquivos auditados, entre outros:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-25-acabamento-da-a0b.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/segundo-fator.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/painel.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`

## test-engineer · 3ª rodada · APROVADO · 2026-09-25 17:17:15 · `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

VEREDITO: APROVADO

Cenários exigidos (nesta rodada só o diff desde a 2ª, que eu tinha aprovado):
- Mudar o `lintar` em `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/guardas.test.ts` não pode mudar nenhum teste de guarda que já existia.
- A regra `assertionStyle: 'never'` em `apps/worker/src/processadores/**` precisa ter prova permanente: as duas afirmações de tipo (linhas 10 e 18 da fixture) são reprovadas, e o objeto literal tipado e o `as const` (linha 7) passam.
- O título do caso "todas inexistentes" em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/uso.int.test.ts` não pode prometer um alerta que não existe.
- A mutação de `encontradasTotal` precisa estar registrada.

Cobertos:
- **`lintar`:** o parâmetro `regras` tem como padrão `regrasObservadas`, então as chamadas antigas (linhas 65 a 183) continuam iguais. O teste novo (linha 59) observa só `@typescript-eslint/consistent-type-assertions`, pelo ESLint real do repositório, no caminho de um processador. Ele compara com `marcasDeViolacao`, que exige que as marcas existam, então apagar marca e regra juntas não passa. Isso fecha a recomendação da 2ª rodada.
- **A regra de lint:** a mutação para `objectLiteralTypeAssertions: 'never'` deixa a linha 18 (`parcial as Totais`) sem acusação, e o teste fica vermelho. Está na seção "Mutações".
- **O título:** agora diz "o job falha no fim, para aparecer como job falho e a fila tentar de novo", sem falar em alerta. O corpo do teste não mudou desde a 2ª rodada.
- **O runbook:** diz "Sem alerta" e aponta a pendência do alerta de rotina parada, o que bate com o título.
- **`encontradasTotal`:** a mutação de `escolas.length` (só o storage) está registrada. O caso com a órfã C só no contador espera 3, e a mutação daria 2, então a asserção `encontradasTotal: 3` a pega. O processador usa `encontradas.size` (`consolidar-uso.ts:172`).
- **Resto do lote:** as outras mudanças são só de documentos (`docs/lgpd.md`, `TODO.md`, o item "Consolidação" de `tasks/prd-fundacao-tecnica/techspec.md` e a quebra de linha do W10). Nenhuma mexe em asserção.
- **Proibições:** não há `.skip`, teste comentado nem mock de coisa nossa no diff. Os stubs de `storage` e `contador` substituem o que vem de fora (S3) ou fixam o limite do conjunto vazio, e a regra (o `throw` e o `every`) roda de verdade.
- Seguindo a instrução, não rodei a suíte nem usei o banco de teste. Conferi os testes lendo o código.

Bloqueantes: nenhum.

Recomendações:
- Em `tools/guardas/guardas.test.ts:56-60`, falta um controle negativo de escopo: a mesma fixture num caminho fora de `apps/worker/src/processadores/` (por exemplo `apps/api/src/sistema/x.ts`) não deveria acusar a linha 18. Hoje, se a regra fosse promovida sem querer para o repositório inteiro, nenhum teste mostraria.

## test-engineer · 4ª rodada · APROVADO · 2026-09-25 17:18:23 · `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

VEREDITO: APROVADO

**Cenários exigidos (para o que mudou nesta rodada):**
- A regra reprova as duas afirmações de tipo no processador: `{} as Totais` e o `Partial<Totais>` afirmado no fim.
- A regra deixa passar o objeto literal tipado e o `as const`.
- A regra vale só em `apps/worker/src/processadores/**`: fora dali, a mesma fixture passa.

**Cobertos:**
- **Os três cenários.** O caso novo, `tools/guardas/guardas.test.ts`, "vale só nos processadores…", passa a fixture por `apps/api/src/sistema/x.ts` e por `apps/worker/src/x.ts` e exige `[]`. Ele filtra só `@typescript-eslint/consistent-type-assertions`, então outras regras que acusem a fixture nesses caminhos não interferem.
- **O teste falharia sem a regra.** A regra só aparece num bloco do `eslint.config.mjs` (linha 51, dentro de `files: ['apps/worker/src/processadores/**/*.ts']`). Se o bloco passar a valer para `apps/**/*.ts`, os dois caminhos acusam as linhas 10 e 18 da fixture e o caso fica vermelho. A mutação está registrada na seção "Mutações" do documento da correção (linha 62).
- **Os dois lados do escopo.** O caso positivo, que já existia, acusa exatamente as linhas marcadas no caminho do processador, e a linha 7 da fixture (`as const`, sem marca) prova que o `as const` passa. O negativo prova que a regra não subiu para o resto do repositório. Um teste sem o outro deixaria passar uma das duas mutações, e as duas estão na tabela.
- **Nada escondido.** Sem `.skip`, sem teste comentado, sem mock. É o ESLint real do repositório rodando em caminho simulado.
- **Correção exigida na rodada anterior:** não havia. A recomendação da 3ª rodada foi aplicada como descrito.
- Não reaudito o resto do diff, que não mudou desde a 3ª rodada aprovada. Também não rodei suíte nenhuma, como foi pedido.

**Bloqueantes:** nenhum.

**Recomendações:**
- O nome da fixture `'afirmacao-de-tipo-no-processador.ts'` e o `Set` de regras aparecem repetidos nos dois `it`. Dá para subir as duas constantes para o `describe`. É só organização.

Arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/guardas.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/__fixtures__/afirmacao-de-tipo-no-processador.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/eslint.config.mjs`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-25 17:47:39 · `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration nesta rodada. O diff desde a 1ª rodada só mexe em documentos, no título de um caso de `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/uso.int.test.ts` e em teste de lint.

Queries verificadas:
- Nenhuma query mudou desde a 1ª rodada. Conferi pela data de alteração dos arquivos: `convite.repository.ts`, `convite.service.ts`, `painel.ts`, `consolidar-uso.ts` e `segundo-fator.service.ts` foram gravados antes de a 1ª rodada começar (16:44:37). O conteúdo deles bate com o que foi auditado nela.
- Nos documentos alterados (`/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:397-405`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-fundacao-tecnica/techspec.md:151-154`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:107-109` e `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md`), nada cria escopo por parâmetro, nada autoriza leitura sem escopo e nada muda a resposta de "não encontrado". O runbook manda apagar a pasta vazia `escolas/<id>/` só depois de confirmar que o banco está certo e que os ids são de escolas eliminadas. Não alcança dado de outra escola.

Correções exigidas na rodada anterior: não havia nenhuma. As duas recomendações da 1ª rodada tiveram este destino:
- `convite.service.ts:279` (`refazerConviteDaCoordenacao`): entrou no `TODO.md`, na pendência do caminho morto, com a ressalva correta de que no gerar e no revogar o fallback é vivo, porque os comandos `ops:*` rodam sem requisição.
- `REFAZER_CONVITE_POR_ESTADO.sem_convite`: ficou sem aplicar, com o motivo escrito no documento da correção. É recomendação condicional a uma mudança que não existe, e o teste a fixa. Não bloqueia.

Teste de isolamento: presente e efetivo. É o mesmo da 1ª rodada, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts:216-237`, que não mudou.

Bloqueantes: nenhum.

Recomendações: nenhuma nova.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-25 17:47:43 · `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

VEREDITO: APROVADO
Caminho quente tocado: fila
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. Nenhum alerta novo foi criado. A lacuna está declarada como "Sem alerta" em `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, com a pendência do alerta de rotina parada em `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md` citando `uso.nenhuma_escola_no_banco`.
Bloqueantes: nenhum

As três recomendações da 1ª rodada foram feitas:
- O título do caso "todas inexistentes" em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/uso.int.test.ts` não promete mais alerta. Ele bate com a asserção `definitiva: false`.
- O runbook agora diz "Sem alerta" e manda para a pendência. A exceção das escolas eliminadas cobre qualquer noite em que todas as escolas encontradas foram eliminadas.
- As duas pendências do `TODO.md` foram atualizadas.

O item "Consolidação" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-fundacao-tecnica/techspec.md` bate com o código: escola pulada por `escola_inexistente` ou `valor_invalido`, e o job falha no fim quando todas as escolas encontradas estão inexistentes.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts:90-92` (docblock) e `:167` (comentário) ainda dizem "é o worker apontado para outro banco, e não uma escola eliminada". Isso contradiz o runbook e o `TODO.md` desta correção, que já admitem a noite em que todas as encontradas são escolas eliminadas (a pasta vazia no storage). Troque para "em geral é o worker apontado para outro banco; também dispara com resto de escola eliminada, até a eliminação apagar o resto de uso". Faça isso na próxima tarefa que tocar esse arquivo, ou na spec da eliminação.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-25 17:47:45 · `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

VEREDITO: APROVADO

Esta é a rodada 2. Auditei só o que mudou: `docs/lgpd.md`, `docs/runbook.md`, `TODO.md`, `tasks/prd-fundacao-tecnica/techspec.md` e o título do caso em `apps/worker/test/uso.int.test.ts`. O código que escreve log (`consolidar-uso.ts`, `segundo-fator.service.ts`) não mudou desde a minha rodada aprovada.

**As duas recomendações da rodada 1 foram aplicadas:**
- **Recomendação 1, frase do `docs/lgpd.md` sobre o painel:** feita, em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:107-110`. A frase agora fala só do dado de pessoa da escola (nome e e-mail da coordenadora). O dado do operador (e-mail, senha, segundo fator, nome, apelido) está remetido à linha "Conta de operador Turmma" (`docs/lgpd.md:76`). Essa linha lista os mesmos campos, com finalidade, base legal e retenção.
- **Recomendação 2, pendência no `TODO.md`:** feita. O `refazerConviteDaCoordenacao` (`convite.service.ts`) entrou junto do `painel.service.ts:62` na pendência do fallback `requisicaoId`, com destino.

**Conferência do que é novo:**
- **Runbook e Tech Spec:** o novo trecho do `docs/runbook.md` (todas as escolas encontradas na noite inexistentes no banco) só diz que o log leva a contagem `encontradasTotal`. Isso bate com `consolidar-uso.ts:173`, que registra `{ evento: 'uso.nenhuma_escola_no_banco', encontradasTotal }`. A ação manual pedida é apagar a pasta vazia `escolas/<id>/`, que não contém dado de pessoa. O item novo da Tech Spec diz a mesma coisa: escola logada só por id.
- **Teste:** o caso de `uso.int.test.ts` confere que nenhum id de escola aparece na linha `uso.nenhuma_escola_no_banco`. Os ids usados no teste são UUIDs gerados, sem dado real.
- **`TODO.md`:** as pendências novas não trazem dado pessoal. A que manda apagar o resto de uso da escola eliminada reforça a eliminação de fato (regra 20, item 15).

Campos pessoais tocados: nenhum campo novo. Só o texto do `docs/lgpd.md` sobre o que passa pelo painel (coordenadora; operador remetido à linha própria)
Fora da tabela de dados do docs/lgpd.md: nenhum
Autorização por objeto: ok (sem rota nova nem alterada nesta rodada)
Logs: limpos (`uso.nenhuma_escola_no_banco` leva só `encontradasTotal`; `uso.escola_ignorada` leva só id de escola)
Auditoria: presente (nenhuma ação desta rodada exige auditoria nova)
Envio externo: nenhum
Seed/fixture: sintético (UUIDs gerados e escolas criadas pelo teste)
Bloqueantes: nenhum
Recomendações:
- `docs/lgpd.md:109`: a linha que recebeu a remissão ao operador passou muito da largura das vizinhas. É só formatação; dá para quebrá-la como as outras quando o arquivo for tocado de novo.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-25 17:47:47 · `tasks/correcoes/2026-09-25-acabamento-da-a0b.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test, infra)")

Bloqueantes: nenhum

Conferi cada recomendação desta rodada contra o código:

- **Runbook.** A exceção "Todas as escolas da noite inexistentes" (`/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:397-405`) descreve o que `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts:169-175` faz. Ela cobre a noite em que todas as escolas encontradas foram eliminadas, diz "Sem alerta" e aponta a pendência do alerta de rotina parada.
- **`TODO.md`.** Estão lá as três coisas pedidas:
  - a pendência da eliminação diz que o resto de uso derruba o job;
  - o alerta de rotina parada cita `uso.nenhuma_escola_no_banco`;
  - o caminho morto inclui o `refazerConviteDaCoordenacao`.
- **Tech Spec do F1.** O item "Consolidação" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-fundacao-tecnica/techspec.md:151-154` bate com o docblock e o comportamento do processador, inclusive quando a falha vem de Redis, Postgres ou storage.
- **`docs/lgpd.md:107-109`.** A remissão bate com a linha "Conta de operador Turmma", que lista apelido e nome.
- **Testes.**
  - Em `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/guardas.test.ts`, o `lintar` agora recebe as regras por parâmetro e, sem ele, usa `regrasObservadas`. Há também o controle negativo de escopo, que roda a mesma fixture fora dos processadores e espera zero mensagens.
  - Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/uso.int.test.ts`, o título do teste "todas inexistentes" não promete alerta.

Recomendações:
- O documento diz que "a linha do W10 voltou à quebra", mas `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md:172` ficou com 165 caracteres (a do 429/503). Antes da correção, o arquivo só tinha uma linha acima de 125, a 93. Quebre a linha antes de "503 `TEMPO_ESGOTADO`".
- O mesmo vale para `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:109`: a linha nova passa da largura do parágrafo em volta. Quebre antes de "É o que respondemos".

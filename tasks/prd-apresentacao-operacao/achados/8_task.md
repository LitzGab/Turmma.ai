# Achados das revisões — `tasks/prd-apresentacao-operacao/8_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-24 03:31:37 · `tasks/prd-apresentacao-operacao/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** C26, C27, C28, C29, C30 (em paralelo de verdade), C31, C32 (renovar e sair), C36 (grupos de limite das entradas), C36b, C37 inteiro, C39 (renovar), C43, C44, C46 (entradas). Também o sair: encerra, grava `saida` com IP, apaga o cookie, dois cliques juntos, sem cookie ou com cookie desconhecido, e pelo cookie anterior. Por fim, o teste de unidade do aviso `operacao.desafio_sem_redis`.

**Cobertos:** todos os cenários exigidos têm teste, e cada teste falharia se a regra fosse removida.
- **C26 e C27:** o relógio é o do banco, que o teste empurra para trás. O C27 confere que o último uso foi há menos de 30 min, então o que derruba a sessão são as 8 h e não a inatividade.
- **C28:** um pouco antes de cada prazo a sessão renova; depois dele é recusada, e confere que a sessão recusada não rotaciona.
- **C29:** acesso vencido dá `ACESSO_VENCIDO`, a renovação passa, e o teste confere o cookie inteiro, o hash atual, o anterior e que a ação seguinte funciona.
- **C30:** a barreira sobre `rotacionarSessao` chama o método original, então não esconde a regra. O teste falha se a cláusula `refresh_hash = $atual` sair: haveria dois `Set-Cookie`. Também cobre a janela de 30 s dos dois lados, o reuso que encerra a sessão e invalida o token, e o cookie de duas rotações atrás.
- **C31:** o Postgres fica pausado de verdade. `/eu`, `renovar` e `sair` dão 503 com `Retry-After`, o 503 não apaga o cookie, e a sessão volta depois.
- **Sair em paralelo:** o `Promise.all` seguido de um terceiro `sair` prova uma única linha `saida`, e o teste falha se a cláusula `encerrada_em is null` sair do `encerrarSessaoPelaSaida`.
- **C32:** passado o limite, o pedido com cookie leva 429, e a sessão continua intacta, o que se vê pela renovação vinda de outro IP.
- **C36b:** o seguro em memória é conferido pelo número exato de pedidos aceitos, 1 no IP e 2 no operador.
- **C37:** confere a ordem completa da auditoria, `mfa_configurado` uma única vez com o próprio operador como autor, o aceite sem acesso, `entrada_falha` pela senha e pelo código sem operador, a métrica +2, e o comando sem nenhum acesso.
- **C39:** corpo com campo leva `ENTRADA_INVALIDA` e a sessão fica intacta; o contrato estrito da resposta também é conferido.
- **C43 e C46:** a lista de rotas é gerada do que está registrado. No C46, o cookie da escola com o nome `turmma_operacao` pegaria uma renovação que consultasse a tabela errada, e o teste confere que a sessão de escola sobrevive.
- **C44:** a varredura tem teste próprio, com casos que devem ser reprovados e casos inocentes.
- **Aviso sem Redis:** o teste de unidade usa um Redis falso, o que é aceitável aqui porque o que se testa é o aviso no log, não o Redis.

Não há `.skip`, `.only` nem teste comentado. Nada chama provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Renovar e sair ao mesmo tempo ficam sem teste.** A cláusula `encerrada_em is null` do `rotacionarSessao` (`apps/api/src/operacao/operador.repository.ts`, no `where` do método) não é provada por nenhum teste: em sequência, o `sessaoDeOperadorVale` já recusa antes dela. Vale um teste com a mesma barreira do C30: a renovação para antes do `rotacionarSessao`, o `sair` confirma a saída, e ao soltar a renovação espera-se 401 sem cookie novo.
2. **Conta segurada no `/sessao/mfa`.** O `this.dependencias.falhas.somar()` do caso `segurada` (`apps/api/src/operacao/segundo-fator.service.ts:164`) não tem asserção na métrica. O C37 só cobre o código recusado.
3. **Linha de log do reuso.** A linha `operacao.reuso_de_refresh` (`apps/api/src/operacao/sessao.service.ts:81`) não é conferida. Dá para capturá-la pelo `linhasDeLog` do `subir` e confirmar que não leva o id da sessão nem o do operador (regra 20, item 9).
4. **C28, caso do desativado.** O `desativar` também encerra a sessão, então esse caso de integração não isola a condição `operadorDesativadoEm`. Hoje ela é provada só no teste de unidade (`apps/api/src/operacao/prazos-da-sessao.test.ts:35`). Basta registrar isso no mapa de cenários.
5. **C36, dois grupos iguais.** No teste de arquitetura, os grupos `rebaixa_no_hash` e `contador_do_operador` têm a mesma saída esperada (`consumirDoLogin`, sem recusa). Quem os distingue são o C33 e o C34 das tarefas anteriores; um comentário no teste dizendo isso evita a leitura de que ele prova sozinho.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-operador.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/registros-operador.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/operacao-isolamento.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/desafio-de-operador.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/sessao.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/segundo-fator.service.ts

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-24 03:32:46 · `tasks/prd-apresentacao-operacao/8_task.md`

VEREDITO: APROVADO

Tabelas verificadas: a tarefa não cria migration nem tabela nova. Só usa tabelas que já existiam: `sessao_operador`, `operador` e `acesso_operacao`. Elas são da operação Turmma e ficam fora do tenant por desenho da A0 (tarefas 3.0 a 7.0). Nenhuma recebe nem guarda dado de escola.

Queries verificadas: as seis que a tarefa acrescenta em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts`.
- `sessaoParaRenovar`, `rotacionarSessao`, `encerrarSessao` e `encerrarSessaoPelaSaida` escolhem a sessão só pelo hash do cookie `turmma_operacao` ou pelo id que o próprio servidor resolveu. A rotação fica presa ao hash atual e a `encerrada_em is null`.
- `registrarAcesso` e a leitura de `apelido` em `paraSegundoFator` não escolhem sessão por dado do cliente.
- Nenhuma dessas queries usa `escolaId` de corpo, query string ou parâmetro do cliente.
- O corpo das rotas `/renovar` e `/sair` é `z.object({}).strict()` (em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/sessao.ts`), então nada do corpo decide qual sessão é lida.
- Não há `@SemEscopo()` novo.
- Toda recusa do `/renovar` responde igual, 401 `SESSAO_ENCERRADA`: sem cookie, cookie fora do formato, cookie desconhecido e as quatro condições. O `/sair` responde 204 em qualquer caso. Nenhuma das duas rotas revela se a sessão existe.
- A camada rede não entra nesta tarefa.

Teste de isolamento: presente e efetivo. É o C46 das entradas, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/operacao-isolamento.int.test.ts:187-257`.
- A lista de rotas é gerada das rotas registradas e confere que as sete de entrada estão nela.
- Cada rota recebe credenciais de escola: token de coordenador, de professor e de aluno, um desafio e o cookie de renovação da escola, inclusive com o nome `turmma_operacao`.
- Se `/renovar` deixasse de exigir o hash da sessão de operador, ou buscasse também na sessão de escola, a resposta traria `"token"` ou um `Set-Cookie turmma_operacao` e o teste quebraria. A contagem de `sessao_operador` também tem de ficar igual.

Bloqueantes: nenhum.

Recomendações:
- No C46, as respostas 204 do `/sair` entram só pela checagem de `Set-Cookie`, e a prova de que a sessão de escola sobrevive é um `GET /v1/eu` com o bearer. Vale acrescentar a leitura direta da sessão de escola cujo cookie foi usado, conferindo `encerrada_em is null` depois do `/sair`. Assim o teste não depende de a guarda do F1 conferir o encerramento pelo token de acesso.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-24 03:32:52 · `tasks/prd-apresentacao-operacao/8_task.md`

**VEREDITO: APROVADO**

Nada nesta tarefa toca dado de aluno, professor ou escola. Todo dado pessoal envolvido é do operador Turmma, que é da nossa equipe e maior de idade, e cada campo já tem linha na tabela de `docs/lgpd.md`. Não há bloqueante.

**Campos pessoais tocados**
- IP em `acesso_operacao`, nos eventos `entrada`, `entrada_falha` e `saida`.
- Apelido do operador como autor de `operador.mfa_configurado` em `auditoria_operacao`.
- Hash do refresh atual e do anterior em `sessao_operador`.
- Nenhuma coluna nova e nenhuma migration.

**Fora da tabela de dados do `docs/lgpd.md`:** nenhum. As linhas que cobrem esta tarefa, todas com finalidade e retenção:
- "Acesso à operação", 6 meses: com IP, nunca o e-mail digitado.
- "Sessão de operador", 30 dias: sem IP.
- "Auditoria da operação", vigência + 5 anos: inclui "segundo fator configurado".
- "Identificador do operador na auditoria": o apelido, que continua depois da desativação.

**Autorização por objeto:** ok.
- `renovar` e `sair` não têm id na URL nem no corpo, e o corpo é estrito (`esquemaPedidoSemCorpoDeOperador`). A sessão é escolhida só pelo SHA-256 do cookie `turmma_operacao`.
- Toda recusa do `renovar` dá a mesma resposta: 401 `SESSAO_ENCERRADA` com o cookie apagado, seja sem cookie, cookie fora do formato, desconhecido, vencido ou encerrado. Nenhuma revela se a sessão existiu.
- `sair` responde 204 sempre, então também não confirma se a sessão existia.
- O C46 prova que o cookie de escola com o nome `turmma_operacao` não abre sessão de operador.

**Logs:** limpos. As linhas novas levam só o evento, sem id, e-mail nem IP:
- `operacao.reuso_de_refresh` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/sessao.service.ts:81`
- `operacao.sessao_indisponivel` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/sessao.service.ts:69`

A falha do banco vira 503 tipado, sem o erro no corpo.

**Auditoria:** presente onde a regra exige.
- `operador.mfa_configurado` é gravado na ativação, na mesma transação travada por `for update`, com o próprio operador como autor.
- Entrada, falha de entrada (pelo código no `/sessao/mfa`, sem operador) e saída ficam em `acesso_operacao` com IP. A saída é gravada na mesma transação que encerra a sessão.
- Não há leitura de dado de aluno nem exportação.

**Envio externo:** nenhum. Não há chamada a IA nem a terceiro.

**Seed/fixture:** sintético. E-mails em `.invalid`, IPs sorteados em `10.x`, nomes como "Pessoa Sintética dos Registros".

**Pergunta de fechamento:** não se aplica a aluno, porque a tarefa não guarda nada de aluno. Para o operador, o código responde: o que se guarda está em `sessao_operador`, `acesso_operacao` e `auditoria_operacao`, e nada vai para fora.

**Bloqueantes:** nenhum.

**Recomendações**
1. Nenhum teste confere o conteúdo da linha `operacao.reuso_de_refresh` (`sessao.service.ts:81`). Vale capturá-la pelo `linhasDeLog` do `subir` e afirmar que não leva o id da sessão nem o do operador. É a recomendação 3 do test-engineer, e é o que prova a regra 20, item 9.
2. `registrarFalhaDeEntrada` no `/sessao/mfa` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/segundo-fator.service.ts:141`) roda dentro da transação do `for update`. Hoje está certo, porque o desfecho `codigo_recusado` volta sem lançar erro e a transação é confirmada. Um comentário dizendo isso evita que alguém troque o `return` por `throw` e perca o registro sem perceber.
3. O expurgo de 6 meses de `acesso_operacao` fica para a 9.0, como o `8_task.md` declara. Esta tarefa passa a gravar entrada e saída de verdade, então a 9.0 precisa trazer o teste do prazo.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-24 03:32:53 · `tasks/prd-apresentacao-operacao/8_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Cada divergência está em "Divergências resolvidas nesta tarefa" (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/8_task.md`) e subiu para a seção 5 da `techspec.md` ("Da tarefa 8.0"). Nenhuma foi decidida em silêncio. São estas:
- a renovação lê a sessão sem trava e só depois faz o `update … where refresh_hash = $atual and encerrada_em is null`;
- o refresh anterior, dentro dos 30 s, devolve acesso sem `Set-Cookie`;
- `mfa_configurado` é auditado na ativação, e não no `configurar`;
- a falha do código no `/sessao/mfa` grava `entrada_falha`;
- o registro de acesso fica no `OperadorRepository`, por causa do C45.
Portão local: carimbo válido (typecheck, lint, test, infra)
Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/sessao.service.ts:119`: quando `rotacionadoEm` é nulo, o refresh anterior é tratado como rotação recente e fica dentro da janela de 30 s. Hoje o caso não acontece, porque toda rotação grava as duas colunas juntas. Mesmo assim, o lado seguro para uma linha fora do esperado é tratar como reuso e encerrar a sessão, e não aceitar o cookie.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/sessao.controller.ts:181-190`: o try/catch só serve para pôr o `Set-Cookie` na recusa. É pouca coisa, mas a limpeza do cookie numa recusa tipada podia sair do controller e ir para um filtro de exceção ou para o próprio erro. Hoje o padrão de "erro que carrega cookies" existe só nesta rota.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/registros-operador.int.test.ts:50-52`: a limpeza junta a cláusula `where` ao nome da tabela, dentro da mesma string. Funciona, mas é difícil de ler. Uma lista de pares (tabela, coluna) deixa claro o que se apaga.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`: a lista das sete rotas de entrada aparece duas vezes, no C43 e no C46 (`operacao-isolamento.int.test.ts`). Vale exportar uma constante só, para que as duas não se desencontrem quando a spec mudar.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-24 03:33:09 · `tasks/prd-apresentacao-operacao/8_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login (só a área de entrada do operador, que a escola não usa; ela divide a guarda de limite e o contador com o login da escola)
Rate limit: ok. `renovar` e `sair` usam o `rl:ip` anônimo, como a seção 5 da Tech Spec e as rotas iguais do F1. `/sessao/mfa` continua no contador por `operador.id`. Quem chama essas rotas é a equipe Turmma, que não fica atrás do IP de uma escola.
Fila e prioridade: ok. Não há fila nem job, e nada demorado roda no request.
Concorrência: protegida.
- Renovar: a rotação usa `update … where refresh_hash = $atual and encerrada_em is null` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts:279-286`). Quem perde a corrida relê a sessão e cai na janela de 30 s.
- Sair: o `update` condicional em `encerrada_em is null` e o `registrarAcesso` ficam na mesma transação, então dois cliques gravam uma saída só.
- Primeiro código do `/sessao/mfa`: a auditoria `operador.mfa_configurado` fica dentro do `for update` e só é gravada quando `!mfaAtivo`.
- Os testes cobrem os dois casos: o C30 força o `Promise.all` com uma barreira, e há o teste dos dois cliques em Sair.
Índice e paginação: ok. `sessao_operador` tem índice único em `refresh_hash` e índice em `refresh_hash_anterior` (`packages/nucleo/drizzle/0014_operador.sql:78,91`). A tabela não cresce com aluno e nada novo é listado.
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. `operacao.entrada_falha` virou uma série só (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/falhas-de-entrada.ts`), criada uma vez no módulo e somada pela senha e pelo código. Não há alerta novo, e a seção 7c da Tech Spec declara que o cenário de carga não muda. Banco fora dá 503 `INDISPONIVEL_TENTE_DE_NOVO` com `Retry-After`, nunca 401, e o aviso no log é espaçado (C31 testado).
Bloqueantes: nenhum

Recomendações:
1. O `rl:ip` é um balde só por IP para todas as rotas anônimas (`packages/nucleo/src/limite/guarda-limite.ts:67-68`). Com as duas rotas novas, alguém na rede de uma escola que dispare `/v1/operacao/sessao/renovar` gasta o mesmo balde que os alunos daquele IP usam no `/v1/sessao/renovar` do F1. O risco já existia com as rotas anônimas do F1, e esta tarefa só aumenta a superfície. Vale registrar no `/retro` a ideia de um balde por grupo de rota, ou o da operação separado do da escola, antes do staging.
2. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/sessao.service.ts:119`: se `rotacionadoEm` vier nulo, o código trata a rotação como agora, o que abriria a janela sem limite. Hoje não acontece, porque o refresh anterior só existe depois de uma rotação. Uma restrição `check (refresh_hash_anterior is null or rotacionado_em is not null)` numa migration futura fecharia o caso pelo banco em vez de depender do código.

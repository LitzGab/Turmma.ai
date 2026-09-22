# Achados das revisões — `tasks/prd-identidade-e-tenancy/14_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 15:44:57 · `tasks/prd-identidade-e-tenancy/14_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Boot:** sem `LOGIN_HASH_CONCORRENCIA` ou `UV_THREADPOOL_SIZE`, e com a concorrência acima de UV−8, a subida cai apontando só o nome.
- **Rodízio entre escolas:** 3.000 pedidos da A na fila, e a B é a próxima atendida.
- **Rodízio na equipe:** 100 pedidos de um IP contra 1 de outro IP.
- **Espera acima de 2 s:** 503 com `Retry-After` entre 2 e 6, sem chegar ao hash.
- **Privacidade:** a mesma taxa de 503 para matrícula e e-mail que existem e que não existem. Isso depende de o balde ser escolhido sem olhar se a credencial existe.
- **Rajada:** 35 logins do mesmo IP, sem 429.
- **Métrica:** uma série por escola, sem usuário, matrícula ou IP.
- **Alertas:** acima e abaixo do limiar, e a guarda do runbook.
- **Concorrência:** pedidos em paralelo de verdade.
- **Isolamento:** uma escola barulhenta não atrasa a outra.

**Cobertos:**
- Boot: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/config.test.ts:116-135`, com ausente, vazio, 0, 8 aceito, 9 recusado sem o valor na mensagem, e 4 threads recusadas.
- Rodízio com 3.000 pedidos e rodízio por IP na equipe, com controle contra IP novo a cada pedido: `semaforo-de-hash.test.ts:37-129`. Os dois falhariam com fila única por ordem de chegada.
- Teto, prazo, `Retry-After` sorteado, limite de 10.000 esperando e métricas na unidade: `semaforo-de-hash.test.ts:133-254`.
- Espera de 2 s na integração, com seis 503 seguidos e o aluno entrando na sétima: `semaforo-de-login.int.test.ts:157-181`. O teste falharia se a tentativa fosse contada antes do semáforo.
- Rajada de 35 logins do mesmo IP, pedidos em `Promise.all`, sem 429 e com 35 esperas medidas: `:218-243`.
- Métrica com A, B, `equipe` e `desconhecida`, sem rótulo de pessoa nem IP: `:250-278`.
- Alertas: expressão, `for` e limiar em `infra/test/alertas.test.ts`; o ensaio dispara os dois com `for` de 180 s; o teste "abaixo do limiar" fica quatro avaliações em normal; a guarda do runbook inclui os dois arquivos novos.
- Não há `.skip`, `.only` nem teste comentado. Nenhum provedor de IA envolvido.

**Bloqueantes:**
1. **Nenhum teste prova que o balde independe de a credencial existir.** A regra está na subtarefa 14.1 e na regra 20, item 6.
   - `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/semaforo-de-login.int.test.ts:183-216`: com `LOGIN_HASH_CONCORRENCIA=1` e o único hash preso, todo pedido sai com 503, seja qual for o balde.
   - Por isso o teste só prova que todo login passa pelo semáforo. Não prova que a matrícula que não existe cai no balde da escola do endereço, nem que o e-mail sem conta cai na `equipe`.
   - Uma mudança que lesse a credencial antes e mandasse o inexistente para outro balde continuaria passando. Em rodízio real, esse outro balde seria atendido antes, e o tempo de resposta revelaria quem existe.
   - `:250-270` também não fecha a lacuna: a série da A conta só a matrícula existente, com senha certa e com senha errada. Da equipe, o teste confere que a série existe, mas não quantos pedidos ela contou.
   - **Correção exigida:** no teste de métrica, fazer também login com uma matrícula que não existe no endereço da A e exigir `contagem: 3` na série da A. Exigir `contagem: 2` na série `equipe`, somando o e-mail com conta e o sem conta. Como alternativa, um teste de ordem na integração, com A e B concorrendo, em que o pedido de matrícula inexistente da A é atendido na vez da A.

**Recomendações (não bloqueiam):**
- **503 em `login.duracao`.** Nenhum teste prova que `login.duracao` registra o 503 do semáforo. O denominador do alerta `login-hash-recusado` e o p95 de `login-lento` dependem disso. Sugiro um teste de unidade de `duracao-do-login.ts` com a tarefa lançando erro, ou conferir na integração `:157-181` que a contagem de `metodo=matricula` sobe 6 depois dos 503.
- **Escola barulhenta na integração.** Hoje ela está provada só na unidade. Sugiro um teste com a A lotada (hash preso e fila da A cheia) e um login da B atendido antes dos que estão na fila da A.
- **Asserção sobre IP em `semaforo-de-hash.test.ts:253`.** Ela procura o IP dentro do JSON dos rótulos. É válida, mas ficaria mais direta como a da integração: comparar os valores dos rótulos com um conjunto proibido.
- **Número do Retry-After em `semaforo-de-hash.test.ts:218`.** O teste repete os números 2 e 6 no lugar das constantes `RETRY_AFTER_MINIMO_S` e `RETRY_AFTER_MAXIMO_S`, que o mesmo arquivo já importa.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 16:15:01 · `tasks/prd-identidade-e-tenancy/14_task.md`

VEREDITO: APROVADO

Cenários exigidos: vale o mesmo conjunto da 1ª rodada.
- Borda: quem espera a vez do hash por mais de 2 s recebe 503 com Retry-After entre 2 e 6, e os 503 não contam como senha errada.
- Privacidade (regra 20, item 6): o balde não depende de a credencial existir.
- Borda de carga (regra 80, item 1): 35 logins do mesmo IP ao mesmo tempo, nenhum 429.
- Métrica por escola, sem rótulo de pessoa nem de IP.
- Isolamento: o balde de uma escola não é o de outra.

Cobertos:
- **Correção 1, feita** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/semaforo-de-login.int.test.ts`:
  - linha 270: login com uma matrícula que não existe, no endereço da A;
  - linha 280: exige `contagem: 3` na série da A;
  - linha 281: exige `contagem: 2` na B;
  - linha 282: exige delta exato de 2 em `equipe`, somando o e-mail com conta (272) e o sem conta (273);
  - linha 283: exige delta exato de 1 em `desconhecida`, pelo endereço que não existe (274).
- **O teste agora falha sem a regra.** Se a matrícula inexistente pulasse o semáforo, ou caísse num balde que depende de a conta existir, a série da A ficaria em 2 e o teste quebraria. Se o e-mail sem conta saísse do balde `equipe`, o delta seria 1. As medições antes e depois deixam a conta exata, mesmo com outros testes do arquivo gravando nas mesmas séries.
- **Recomendação da rodada anterior, aplicada** (linhas 170 e 181): os seis 503 entram em `login.duracao{metodo=matricula}`, com delta exato de 6. A medição é feita depois que o login que está com a vez tomou o hash e antes de ele responder, então a conta não pega um sétimo ponto.
- **Teste de unidade do Retry-After** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.test.ts`, linhas 192-193 e 218): continua limitando o valor ao intervalo e exigindo inteiro.
- **`infra/scripts/ensaio-alertas.ts`** é código do ensaio, não teste. A mudança só reordena a restauração, em um `finally`, e não afrouxa nenhuma asserção. Fica com o `infra-guardian`.
- Não achei `.skip`, teste comentado nem mock que esconda a regra no diff. O hash é segurado por um controle do teste, e o semáforo, o Redis e o banco são reais.

Bloqueantes: nenhum.

Recomendações:
- `semaforo-de-hash.test.ts:192-193,218`: o teste passou a usar as constantes da própria implementação. Se alguém mudar `RETRY_AFTER_MINIMO_S` para 0, esse teste acompanha e continua passando. Hoje o 2 e o 6 da spec só estão presos pelo nome do teste de integração (linha 162), que não é asserção. Uma linha `expect([RETRY_AFTER_MINIMO_S, RETRY_AFTER_MAXIMO_S]).toEqual([2, 6])` resolve.
- `semaforo-de-login.int.test.ts:280-281`: o teste exige uma série por escola, mas não prova que a série da B não recebeu nada da A. Isso já decorre da contagem exata nas duas séries. Um comentário dizendo isso ajudaria quem ler o teste depois.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 16:42:15 · `tasks/prd-identidade-e-tenancy/14_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo foi gravado, e nenhuma migration mudou. O IP de quem entra por e-mail agora é usado só em memória, como subfila do balde "equipe" do semáforo. Matrícula, e-mail e senha continuam no mesmo caminho da 4.0 e da 11.0, só que agora dentro da vez do semáforo.

Fora da tabela de dados do docs/lgpd.md: nada gravado fica fora da tabela. O uso do IP em memória cabe na finalidade de segurança da linha "Registro de acesso à aplicação (IP, data e hora)", mas o documento não diz que o IP também é usado assim. Ver recomendação 1.

Autorização por objeto: ok. A tarefa não cria rota nem objeto consultável. O item que importa é "não encontrado e sem permissão respondem igual", e ele se mantém sob carga:
- O balde sai do endereço, ou é "equipe" para todo e-mail, antes de a credencial ser lida (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts:289`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:209`).
- O hash fixo de quem não existe também passa pelo semáforo (`matricula.service.ts:315`).
- O 503 tem corpo só com código, mensagem e `requisicaoId`, e não manda cookie.
- O teste `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/semaforo-de-login.int.test.ts:192` prova margem zero nos quatro grupos (matrícula que existe e que não existe, e-mail com e sem conta), com resposta idêntica tirando o `requisicaoId`. Se alguém pulasse o semáforo, o teste quebraria.

Logs: limpos. Nada novo em `senha/`, `login.service.ts` ou `matricula.service.ts` escreve log. A entrada do runbook manda consultar `registro_acesso` por IP só durante a investigação, e diz que o IP não vai para o `TODO.md`.

Métricas:
- `login.hash_espera` tem só o rótulo `escola_id`, com valor igual ao UUID da escola, `equipe` ou `desconhecida`.
- `login.duracao` tem só o rótulo `metodo`, e `login.hash_recusado` não tem rótulo.
- O teste em `semaforo-de-login.int.test.ts:289` confere que nenhum valor de rótulo, em métrica nenhuma, é matrícula, e-mail, id de aluno ou de usuário, ou IP.
- A lista `METRICAS_COM_ESCOLA` continua fechada, e um teste confere isso.

Auditoria: não se aplica. A tarefa não tem leitura por coordenação ou rede, exportação, nota, permissão nem saída de IA.

Envio externo: nenhum. Não há chamada a provedor de IA nem a terceiro. As métricas vão ao Prometheus e ao Grafana locais, sem dado pessoal.

Seed/fixture: sintético. Os testes usam matrículas aleatórias (`RA<hex>`, `ENSAIO…`, `ABAIXO…`), e-mails em `@escola.invalid`, IPs das faixas reservadas para documentação (TEST-NET), o nome "Pessoa sintética" e senhas `senha-sintetica-*`.

Pergunta de fechamento: a tarefa não guarda nada novo sobre o aluno e não envia nada para fora. A resposta à secretaria continua a mesma de antes desta tarefa.

Bloqueantes: nenhum.

Recomendações:
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`, acrescentar uma linha ou nota: o IP é usado só em memória, na vez do semáforo do login por e-mail, com finalidade de segurança, sem ser gravado nem virar rótulo, e é esquecido por instância. Hoje isso só está documentado no código e no 14_task.md.
2. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts:137-140`, o mapa `#ultimaVez` guarda IPs de quem já foi atendido até passar de 10.000 entradas, sem prazo. Não sai do processo, mas dá para limitar o tempo que um IP fica ali, por exemplo apagando as chaves de subfila sem ninguém esperando depois de alguns minutos. Isso deixaria a retenção explícita.
3. O aceite de convite gera hash fora do semáforo, como registrado nas notas da tarefa. Não há efeito sobre privacidade; o assunto é para o `infra-guardian` e a 16.0.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 16:42:27 · `tasks/prd-identidade-e-tenancy/14_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login

Rate limit: ok. O limite anônimo por IP e o contador por conta já existiam e não mudaram. O semáforo reparte a vez por escola e, no balde `equipe`, por IP. O teste de 35 logins do mesmo IP termina sem nenhum 429.

Fila e prioridade: ok. Cada escola tem o seu balde, e a vez passa de balde em balde. A espera tem prazo de 2 s, com 503 e `Retry-After` sorteado entre 2 e 6 s. Acima de 10.000 pedidos esperando, o pedido novo recebe o mesmo 503 na hora. Quem espera não segura conexão do banco, porque `naEscolaSemUsuario` só abre o contexto da escola e não abre transação.

Concorrência: protegida. O semáforo guarda estado só na instância, e isso é correto: ele protege a CPU e as threads daquele processo. A contagem de tentativas continua no Redis. A vez é pedida antes de a tentativa ser contada, então o 503 não vira `CONTA_SEGURADA`, e há teste que prova isso: o aluno recebe seis 503 e entra na sétima tentativa.

Índice e paginação: ok. Não há query nova.

Degradação de IA: não se aplica.

Migration: não se aplica.

Métrica e alerta: ok. Três métricas novas:
- `login.duracao{metodo}`
- `login.hash_espera{escola_id}`, com o rótulo sendo a escola, `equipe` ou `desconhecida`, nunca o IP
- `login.hash_recusado`, que nasce em 0

Os dois alertas têm entrada no runbook, painel e ensaio, e o teste de integração cobre também o caso abaixo do limiar.

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, "Login lento", causa 3: a entrada diz que espera baixa com login lento significa que o tempo está fora do hash (Postgres ou Redis). Só que o `contador.reservar` e a leitura da credencial rodam dentro da vez do semáforo (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:452-457` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts:532-537`). Com o Postgres ou o Redis lentos, a espera sobe em todos os baldes, com a CPU da API baixa, e nenhuma das causas descreve esse caso. A causa 1 pede CPU no teto e manda subir instância. Convém uma linha no runbook: espera alta em todos os baldes com CPU baixa aponta para o banco ou o Redis, não para capacidade.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts:140`: sob ataque com mais de 10.000 IPs, `#esquecerQuemNaoEspera` percorre o mapa inteiro a cada vez concedida, e `#maisAntigo` percorre todas as subfilas da `equipe`. Com cerca de 10 vezes por segundo por instância, o custo é aceitável. Vale medir o atraso do event loop sob inundação no cenário da 16.0.
- O aceite de convite gera hash fora do semáforo. A tarefa registrou isso como escolha e o volume é baixo. Fica anotado para a 16.0 confirmar que ele não entra na rajada das 7h30.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 16:42:49 · `tasks/prd-identidade-e-tenancy/14_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, infra)
Bloqueantes: nenhum

**Escopo.** As quatro subtarefas estão feitas, e nada da 15.0 entrou: não há rebaixamento por IP×escola nem limite por IP na rota de e-mail. Três arquivos da tabela "Arquivos previstos" ficaram diferentes do previsto, e as Notas da implementação explicam cada um:
- `hash-de-senha.ts` ficou onde a 4.0 o criou, fora de `senha/`.
- `infra/compose.carga.yml` não mudou; o valor fica para a 16.0.
- `apps/api/src/config.ts` não mudou; as variáveis novas entraram em `apps/api/src/sessao/configuracao-de-login.ts`.

**Tech Spec.** O que a seção 5 pede está implementado:
- Os baldes são resolvidos antes do semáforo e não dependem de a credencial existir: um por escola, `desconhecida` e `equipe` com a vez rodando por IP.
- O rodízio funciona como descrito.
- O prazo é de 2 s, com 503 e `Retry-After` sorteado entre 2 e 6 s.
- `LOGIN_HASH_CONCORRENCIA` e `UV_THREADPOOL_SIZE` são obrigatórias, sem padrão no código, e o boot confere o teto `UV_THREADPOOL_SIZE − 8`.

A seção 7c também está coberta (métricas, os dois alertas, `METRICAS_COM_ESCOLA` numa lista fechada). A seção 7c cita três métricas com `escola_id`, mas só `login.hash_espera` entrou; `login.falhas` e `login.prioridade_rebaixada` ficam para a 15.3, como as notas declaram.

Recomendações:
- **Ratificar na Tech Spec a extensão da vez no semáforo.** A seção 5 fala em limitar hashes. A implementação segura a vez também durante a reserva no contador e a leitura da credencial, para o 503 não contar como senha errada. Um efeito colateral: o login de conta já segurada agora espera a fila antes de receber o 429. A escolha está nas notas, mas mudou o fluxo da seção 5 e merece uma linha lá, como a 12.0 fez ("Ratifica…").
- **A configuração de teste não reflete as threads reais.** `apps/api/test/configuracao-de-teste.ts` pega `UV_THREADPOOL_SIZE=16` do `.env.example`, mas o processo do vitest tem 4 threads, como o próprio comentário em `apps/api/test/sessao-matricula.int.test.ts` reconhece. Nos testes, a conferência do teto confia num valor que não vale para o processo. Isso não afeta produção, porque o compose define a variável antes de o Node subir, mas vale anotar.
- **Um bloco repetido três vezes.** A sequência "reservar, depois ler a credencial, depois fazer o hash dentro de `semaforo.executar`, depois lançar se a conta estiver segurada" aparece em `login.service.ts`, em `matricula.service.ts#entrar` e em `matricula.service.ts#recusar`. Um helper que receba a leitura da credencial evitaria que os três caminhos divergissem na 15.0, que vai mexer exatamente aí.
- **O 503 do semáforo dispara também a "Taxa de erro 5xx".** O runbook já cobre isso no item 4. Se o painel de 5xx passar a gerar ruído na entrada das 7h30, vale considerar tirar esse 503 da regra de 5xx numa tarefa futura.

Arquivos principais: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/configuracao-de-login.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/grafana/alertas/login-lento.yaml`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/grafana/alertas/login-hash-recusado.yaml`.

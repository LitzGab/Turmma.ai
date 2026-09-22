# Achados das revisões — `tasks/prd-identidade-e-tenancy/15_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 17:27:00 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** os dez da tabela do `15_task.md`. São eles: o caminho feliz sob ataque, a passagem pelo cookie, o isolamento entre A e B, a onda legítima de 30%, a rede com três escolas (180/min), o script contra o professor segurando só o `outro`, o Redis de fila parado, a validade e rotação do cookie, a privacidade do cookie e os alertas. Da 15.5 entram também o Redis travado no contador e no desafio, e o desafio somado ao `limite.seguro_ativo`. Das notas entram as regras que elas acrescentam: janela de 1 min com TTL, chave HMAC sem IP, 503 fora da contagem e endereço inexistente sem rebaixamento.

**Cobertos:**
- Os sete cenários de integração do `apps/api/test/ataque-de-senha.int.test.ts` provam a regra.
  - Sem o rebaixamento, sem a passagem pelo cookie ou sem o `conhecido/outro`, a ordem no hash muda e o teste fica vermelho.
  - Sem a escola na chave, o isolamento fica vermelho (a sua mutação confirma).
  - Sem o multiplicador da rede, a 61ª já seria rebaixada.
  - Sem a divisão pelas instâncias, a 52ª não seria rebaixada.
  - Sem o `espelhar`, a conta volta a entrar com o Redis fora.
- Cookie: `cookie-dispositivo.test.ts` cobre a chave antiga, a 51ª entrada e os 30 dias; o teste de integração cobre o login que falhou e a ausência do valor em log e em tabela.
- Unidade: `rebaixamento.test.ts` (limiar, cache, série, seguro) e `semaforo-de-hash.test.ts` (fim do balde, isolamento entre baldes, desistência pelo prazo, IP esquecido).
- 15.5: `CLIENT PAUSE` de verdade no contador e no desafio, com o aviso limitado a uma linha.
- Repository de rede por IP e contagem de alunos ativos, com isolamento e aluno transferido.
- Alertas: `for:`, expressão, limiar, disparo no ensaio e nenhum IP no rótulo.
- Não achei `.skip`, `.only` nem teste comentado. Nenhum provedor de IA é envolvido.

**Bloqueantes:**

1. **`apps/api/src/sessao/senha/contador-em-janela.ts:21-27, 72-111` não tem teste nenhum.** O `rebaixamento.test.ts:13-30` usa um contador falso (`JanelaDeTeste`), e os testes de integração usam IP e escola sorteados, então nunca percebem uma janela que não vence.
   - Sem o `PEXPIRE` do script, ou com a chave feita do IP em texto em vez do HMAC, todos os testes continuam verdes.
   - Isso deixa sem prova a regra 20 ("IP só em contador com TTL", que o `docs/lgpd.md` agora promete: "só o HMAC do IP, com prazo de um minuto"). Deixa sem prova também o "por minuto" da 15.1: sem TTL, uma escola ficaria rebaixada para sempre depois de dias de senhas esquecidas.
   - **Correção exigida:** um `contador-em-janela.int.test.ts` contra o Redis de fila real que prove:
     - (a) depois do primeiro `somar`, o PTTL da chave está entre 0 e 60.000 ms, e o segundo `somar` não o empurra;
     - (b) a chave tem o prefixo e não contém o IP nem o `escola_id` em texto;
     - (c) N chamadas de `somar` em paralelo (`Promise.all`) devolvem valores distintos de 1 a N (regra 80, item 7; quebra se alguém trocar o script por GET e depois SET);
     - (d) no seguro em memória (cliente desconectado, relógio injetado), a contagem volta a 0 depois de 60 s, com `doSeguro: true` e `proporcaoDoSeguro > 0`.

2. **A exigência da 15.5 "somá-lo ao sinal de seguro ativo" não tem teste** (`apps/api/src/sessao/seguro-do-login.ts:11-21`, `apps/api/src/sessao/sessao.module.ts:149-153`).
   - O `desafio.int.test.ts:79` só confere `consumo.proporcaoDoSeguro`, uma instância solta, e não o que chega ao `limite.seguro_ativo`.
   - O `ataque-de-senha.int.test.ts:443-444` fica verde mesmo tirando `ConsumoDeDesafio` ou `ContadorEmJanela` do `SeguroDoLogin`, porque com o Redis parado o contador de tentativas já dá 1 sozinho.
   - **Correção exigida:**
     - um teste de unidade do `SeguroDoLogin` provando que qualquer fonte sozinha em 1 leva o sinal a 1 e que vale a maior;
     - um teste com a aplicação montada em que só o desafio é recusado pelo Redis (por exemplo `app.get(ConsumoDeDesafio)` com `CLIENT PAUSE`, ou o "Redis fora" do `mfa.int.test.ts`). Nele, `app.get(SeguroDoLogin).proporcaoDoSeguro` (ou `limite.seguro_ativo` observado) tem que dar 1, com o `ContadorDeTentativas` e o `ContadorEmJanela` em 0.

**Recomendações:**
- **503 não conta como falha (escolha 2).** Falta teste de que o 503 do semáforo não chama `aoFalhar` nem soma em `login.falhas` (`conferencia-na-vez.ts:60-66`). É o que protege a rajada das 7h30; hoje só o cenário da 16.0 pegaria isso.
- **429 conta como falha (escolha 2).** Falta teste de que a conta segurada (429) conta para o IP naquela escola.
- **Endereço inexistente (escolha 5).** Falta teste de que ele não rebaixa ninguém e de que as falhas contam em `login.falhas{escola_id="desconhecida"}`.
- **Ataque de dentro com cookie próprio.** Falta um aluno com o `educa_dispositivo` da própria conta varrendo outras matrículas pelo mesmo IP e continuando rebaixado. A passagem vale só para aquela matrícula, e nenhum teste de integração quebra se o serviço aceitar "qualquer cookie válido".
- **IP em texto na memória.** O cache `#redes` do `limite-email-ip.ts:39` guarda o IP em texto, e falta teste de que ele sai em 1 min, como o `docs/lgpd.md` promete.
- **Para o `privacy-guardian`.** O seguro em memória do `contador-em-janela.ts:109` só varre acima de 10.000 entradas, então HMACs vencidos ficam na memória além do minuto que o `docs/lgpd.md` declara.
- **Risco de vermelho falso.** O teste da rede faz 181 pedidos em sequência e o caminho feliz faz 110, todos dentro da mesma janela de 60 s. Num runner lento, a janela pode vencer no meio.
- **Robustez do teste de privacidade** (`ataque-de-senha.int.test.ts:454`): ele depende dos cookies dos testes anteriores e falha se rodar sozinho. E `LIMITE_EMAIL_POR_IP = 60` (linha 23) repete o `.env.example`; melhor ler da configuração.
- **`ContadorEmJanela` com o Redis travado.** O `catch` dele não tem teste com `CLIENT PAUSE`; a 15.5 pediu só o contador e o desafio.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/contador-em-janela.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/seguro-do-login.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/sessao.module.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/rebaixamento.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.int.test.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 17:35:34 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Cenários exigidos: as duas correções da 1ª rodada.
- **Correção 1:** um teste de integração do `ContadorEmJanela` contra o Redis de fila real. Ele precisa provar quatro coisas:
  - (a) o prazo da chave fica entre 0 e 60 s depois do primeiro `somar`, e o segundo `somar` não o renova;
  - (b) a chave tem o prefixo e o HMAC, sem o IP nem a escola em texto;
  - (c) somas em paralelo dão os valores de 1 a N, cada um uma vez;
  - (d) o seguro em memória volta a 0 depois de 60 s, com `doSeguro: true` e proporção do seguro acima de 0.
- **Correção 2:** o desafio recusado entra no sinal de seguro ativo (15.5). Pede um teste de unidade do `SeguroDoLogin` e um teste com a aplicação montada em que só o desafio é recusado.

Também revisei o que o diff novo afeta: a varredura do seguro a cada janela, o `subirApi` com a montagem de produção e os testes novos de falhas.

Cobertos:
- **Correção 1 (a):** `apps/api/src/sessao/senha/contador-em-janela.int.test.ts`, teste de privacidade e janela.
  - O prazo fica entre 0 e 60.000 ms após o primeiro `somar`.
  - Depois de 50 ms, o segundo `somar` deixa o prazo menor que o primeiro. Se o prazo fosse renovado a cada soma, ele voltaria perto de 60.000 e o teste falharia.
- **Correção 1 (b):** o mesmo teste confere o formato da chave (prefixo e HMAC de 43 caracteres). Confere também que não há IP, escola nem prefixo do IP no texto, e que `KEYS *ip*` volta vazio.
- **Correção 1 (c):** são 20 somas em `Promise.all`, repartidas entre duas instâncias. É concorrência de verdade, e os valores ordenados dão exatamente 1..20. Sem o script atômico, algum valor se repetiria e o teste falharia.
- **Correção 1 (d):** o teste usa um Redis inexistente (porta 9) e relógio injetado.
  - O valor continua 3 até 59.999 ms e cai para 0 aos 60.000 ms, com `doSeguro: true` e proporção igual a 1.
  - `noSeguro` igual a 1 depois da soma seguinte prova a varredura a cada janela. Com a regra antiga (varrer só acima de 10.000 chaves) daria 2, e o teste falharia.
  - O teste extra com o Redis travado por `CLIENT PAUSE` prova que o cliente de produção corta nos 100 ms e cai no seguro sem responder "zero". Prova também que a contagem fica registrada nos dois lugares (o lado seguro, que rebaixa em vez de liberar).
- **Correção 2, unidade:** `apps/api/src/sessao/seguro-do-login.test.ts` prova que qualquer fonte sozinha em 1 leva o sinal a 1, que vale a maior e que sem nada no seguro o sinal é 0.
- **Correção 2, aplicação montada:** `apps/api/test/ataque-de-senha.int.test.ts:503-523`.
  - A aplicação sobe com a montagem de produção (`{}` no lugar de `MONTAGEM_DE_TESTE`), o Redis fica travado, e `ConsumoDeDesafio.consumir` recusa com `NAO_AUTENTICADO`.
  - O desafio fica com proporção 1, o contador de tentativas e o `ContadorEmJanela` ficam em 0, o `SeguroDoLogin` vai a 1 e `limite.seguro_ativo` é observado em [1].
  - Se o `ConsumoDeDesafio` saísse do `SeguroDoLogin` em `sessao.module.ts:150-153`, o sinal seria 0 e o teste falharia.
  - O teste depende de o `ConsumoDeDesafio` ser uma instância só, a mesma que o `SeguroDoLogin` recebe, e é assim que o módulo o fornece.
- **Testes novos de falhas (`ataque-de-senha.int.test.ts:466-501`):**
  - o 503 não conta na métrica de falhas nem no contador do IP na escola (os dois ficam em 0);
  - o 429 conta: são 6 falhas, 2 delas 429, e o contador do IP marca 6;
  - o endereço de escola que não existe conta 105 falhas em `desconhecida`, sem contador por IP e sem série de rebaixamento para `desconhecida` nem para `ESCOLA_DESCONHECIDA`.
- **Cookie usado por outra pessoa (linha 266):** o pedido com o cookie da aluna e outra matrícula termina no grupo rebaixado. A comparação da ordem do hash (linhas 275-279) falharia se o cookie valesse para qualquer matrícula.
- **Privacidade (linhas 525-553):** agora o teste faz os próprios logins e confere que pelo menos 3 cookies foram vistos, então não depende da ordem dos testes.
- **Guarda de runbook:** `tools/guardas/alerta-tem-runbook.test.ts` já lista os dois arquivos e títulos de alerta novos.
- Nenhum `.skip`, `.only` nem teste comentado. Nenhum mock esconde a regra: o espião do hash só segura a vez para controlar a ordem, e chama o hash real. Nenhum provedor de IA entra nesses testes.

Bloqueantes: nenhum.

Recomendações:
- A ligação de produção em `apps/api/src/main.ts:25` não é provada. Os testes 15.5 e de Redis parado chamam `observarSeguroDoLimite(..., app.get(SeguroDoLogin))` eles mesmos (`ataque-de-senha.int.test.ts:419` e `:509`). Se o `main.ts` voltasse a passar só o `ContadorDeTentativas`, nada ficaria vermelho. Uma guarda leve (teste de fonte ou de montagem do `main`) fecharia isso. Fica para o `/validar`.
- Em `contador-em-janela.int.test.ts`, a espera fixa de 50 ms entre as duas somas pode ficar mais robusta. Uma opção é comparar o segundo prazo com `primeiroPrazo - 1` ou garantir uma diferença mínima. Hoje funciona, porque o prazo é em milissegundos.
- O teste 15.5 trava o Redis de fila inteiro (`CLIENT PAUSE ALL`) por 3 s. Com o Vitest rodando arquivos de integração em paralelo contra o mesmo Redis, outro arquivo pode sofrer atraso. Não é um defeito deste arquivo, mas convém registrar no `/retro` se a esteira mostrar lentidão intermitente.

Não rodei nenhum teste nem contêiner, como pedido. A auditoria foi só pela leitura do código.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 17:56:23 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration nesta tarefa. As consultas novas leem tabelas que já existiam: `usuario`, que tem `escola_id`, e `rede` com `escola`, pelas colunas `rede.ips_saida` e `escola.rede_id`. Os contadores novos ficam no Redis. A chave do contador de falhas por IP é o HMAC de `escolaId|ip`. A chave do limite por IP do e-mail é o HMAC do IP, e isso é aceitável porque a tentativa acontece antes de haver escola.

Queries verificadas:
- `AlunosAtivosRepository.contar` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/alunos-ativos.repository.ts`): a escola vem de `exigirEscolaDoContexto()`, sem nenhum parâmetro. Sem escola no contexto, a consulta lança erro. Devolve só o número.
- `ResolucaoDeTenantRepository.escolasDaRedeDoIpDeSaida` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:359`): tem `@SemEscopo` com justificativa escrita. Está na lista do teste de unidade, que também confere o texto da justificativa. Devolve só a contagem, sem id e sem nome. O IP vem normalizado da borda e é comparado com parâmetro ligado (`${ip}::inet`), sem interpolação crua.
- `RebaixamentoPorEscola` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/rebaixamento.ts`): o `escolaId` vem da resolução do slug em `matricula.service.ts:85`, e a chamada roda dentro de `naEscolaSemUsuario(escolaId)`. O cache de tamanho usa essa mesma escola como chave, então o contexto e o parâmetro coincidem. Nenhum endpoint recebe `escolaId` do corpo ou da query. O slug é o identificador público do endereço, o mesmo usado antes desta tarefa.
- `LimiteDoEmailPorIp`: não lê dado de escola. Só multiplica o limite pelo número de escolas da rede do IP.

Teste de isolamento: presente e efetivo.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/alunos-ativos.repository.int.test.ts`, as escolas A (3 alunos) e B (40 alunos) têm contagens diferentes. Sem o filtro `escolaId`, as duas dariam 43, e o teste quebra. O caso sem escola no contexto também está coberto.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts:286`, a escola A leva 105 falhas por um IP e a B leva 1 pelo mesmo IP. Sem a escola na chave, a B chegaria a 106, acima do limiar de 100. O IP do ataque seria rebaixado também na B e a ordem do hash se inverteria, então o teste quebra.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`: a classe chega a 22 métodos `@SemEscopo`. A regra 10, item 9, prevê no máximo três por módulo. A exceção está registrada na Tech Spec, seção 6, mas o número cresce a cada tarefa. Vale levar ao `/retro` a ideia de separar essa fronteira por finalidade (credencial, convite, rede), para que cada parte volte a ter poucas exceções.
- O teste de `escolasDaRedeDoIpDeSaida` prova só a contagem. Um caso a mais, com uma escola de outra rede sem IP de saída ao lado de uma rede com IP, deixaria explícito que o `join` não soma escola de rede alheia. Hoje isso já está coberto de forma indireta pela última asserção.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 17:56:27 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Auditei só lendo o código, sem rodar teste nem contêiner, como pedido.

**Campos pessoais tocados:**
- **IP**, de três formas:
  - HMAC do IP (e da escola, na matrícula) nos contadores por IP, no Redis de fila e no seguro em memória, com prazo de 1 min.
  - IP puro só na memória da instância: subfila da equipe no semáforo, e cache de 1 min que guarda de qual rede é o IP de saída.
  - Consulta em `rede.ips_saida`, que devolve só o número de escolas.
- **Cookie `educa_dispositivo`**: continua sendo só lido. Esta tarefa não o alterou.
- **Número de alunos ativos por escola**: é um agregado, sem nenhum dado de pessoa.

**Fora da tabela de dados do docs/lgpd.md:** nada.
- A linha nova "Contadores por IP do login" tem finalidade, base legal e retenção de 1 minuto.
- O parágrafo "IP só em memória, no login" cobre o semáforo, o cache de rede e os contadores.
- Arquivo: /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md

**Autorização por objeto:** ok. A tarefa não cria rota nova.
- `AlunosAtivosRepository.contar` pega a escola do contexto (`exigirEscolaDoContexto`) e só é chamado dentro de `naEscolaSemUsuario(escolaId)`.
- `escolasDaRedeDoIpDeSaida` está marcado com `@SemEscopo`, tem justificativa e devolve só um número, nunca id nem nome.
- Rebaixamento, limite por IP e 503 do semáforo não dependem de a matrícula ou o e-mail existirem. As falhas continuam indistinguíveis: senha errada, identificador inexistente e conta segurada seguem pelo mesmo `ConferenciaNaVez.#falhar`.

**Logs:** limpos. Os avisos novos (`login.limite_por_ip_no_seguro`, `login.desafio_sem_redis`) não carregam nenhum dado e saem com espaçamento.
- As métricas levam só `escola_id` (ou `equipe`/`desconhecida`). `login.limite_email_ip` não tem rótulo.
- Os alertas e o runbook dizem explicitamente que não trazem IP, e que o IP não vai para `TODO.md`, e-mail nem chat.
- O teste de privacidade em `apps/api/test/ataque-de-senha.int.test.ts` confere que o valor do cookie não aparece em log nem em tabela, e que nenhuma métrica leva IP, matrícula, e-mail ou id de pessoa.

**Auditoria:** nada novo precisa dela. Não há leitura de dado de aluno por coordenação ou rede, exportação, alteração de nota ou de permissão, nem aprovação de saída de IA.

**Envio externo:** nenhum. Não há IA nem terceiro envolvido. O Redis de fila é interno e recebe só HMAC.

**Seed/fixture:** sintético. As senhas são `senha-sintetica-*`, os e-mails usam `@escola.invalid` e os IPs vêm da faixa de documentação.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O `docs/lgpd.md` diz "no máximo um minuto" para o IP no semáforo e no cache de rede, e o código não garante isso.
   - **Semáforo:** a limpeza só roda quando alguém recebe a vez (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts`, `#conceder`). O próprio comentário em `baldes-de-login.ts` admite "fora o intervalo até o login seguinte".
   - **Cache de rede:** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/limite-email-ip.ts`, `#varrer` só roda na próxima consulta de rede.
   - **Efeito:** numa instância parada, o último IP fica na memória até o próximo login. Não é gravado em lugar nenhum e o tamanho tem teto, então não bloqueia.
   - **Sugestão:** ajustar o texto ("até um minuto depois da última vez, ou até o próximo login quando a instância está parada") ou limpar por temporizador.
2. `escolasDaRedeDoIpDeSaida` converte o IP com `::inet`. Hoje a normalização da borda garante o formato, mas um IP malformado viraria erro 500 no login por e-mail em vez de 0. É assunto do `infra-guardian`, não de privacidade.

**Pergunta de fechamento:** o que esta tarefa acrescenta sobre um aluno é contagem com prazo de 1 minuto, guardada só como HMAC, e memória da instância. Nada disso é consultável por titular nem sai do sistema. O que já era guardado sobre o aluno e seus rastros não muda, e segue respondível pelos caminhos já existentes.

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-18 17:57:59 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: login | migration não | deploy não (login, Redis de fila, alertas)
Rate limit: por IP
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.controller.ts:12` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login-email.controller.ts:11`: as duas rotas de login levam `@RotaAnonima()`. Por isso `GuardaDeLimite` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/guarda-limite.ts:40-45`) as limita só por IP, com `consumirAnonima(ip)` e `LIMITE_REQ_IP_ANONIMO_MIN=3000`, e responde 429 `LIMITE_EXCEDIDO`.
   - **O problema:** o rebaixamento desta tarefa só age abaixo desse teto. Um script de aluno a 50 pedidos por segundo, de dentro da rede, gasta o limite do IP da escola. Daí em diante os 400 alunos atrás do NAT recebem 429 no login, e também no `/v1/escolas/:slug/acesso`. Com o cookie `educa_dispositivo` válido ou sem ele, o resultado é o mesmo. Isso é o oposto do objetivo da 15.0 ("perde prioridade no semáforo em vez de bloquear o IP") e da regra 80, item 1.
   - **Com Redis de cache fora:** `limiteDoSeguro` divide o teto por 2, e o IP da escola passa a ser barrado com 1.500 pedidos por minuto.
   - **O cenário da 16.0 já passa do teto:** a Tech Spec, seção 13 / linha 372, prevê 3.000 tentativas por minuto do IP da escola. Somadas às cerca de 840 contas que entram no primeiro minuto, dão uns 3.840 pedidos por minuto e estouram o limite.
   - **O teste não pega:** o teste "nenhum pedido desse IP recebe 429" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts:234`) fica abaixo do teto anônimo e não prova a regra.

   **Correção exigida:**
   - Estourar o volume de um IP em `/v1/sessao/matricula` e `/v1/sessao/email` não pode gerar 429 para outra pessoa atrás do mesmo IP. Duas saídas servem:
     - tirar as duas rotas do limite anônimo por IP e deixar a proteção com o semáforo, o rebaixamento e o contador por conta;
     - ou trocar, nessas rotas, a recusa do limite anônimo por rebaixamento.
   - A escolha fica registrada na Tech Spec, seção 5.
   - O semáforo precisa de um ajuste junto. Sem o teto anônimo, o limite global `MAXIMO_ESPERANDO` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts:141`) vira o próximo ponto de bloqueio: hoje ele recusa na hora o pedido normal, de qualquer escola, quando a fila está cheia. Com a fila cheia, ele precisa tirar primeiro um pedido rebaixado, para o ataque de uma escola não virar 503 imediato na outra.
   - Falta um teste de integração que prove o caso: um IP acima de `LIMITE_REQ_IP_ANONIMO_MIN` na matrícula da escola A. Nesse cenário, a aluna com `educa_dispositivo` válido, do mesmo IP, entra; nenhum pedido recebe 429 `LIMITE_EXCEDIDO`; e o login da escola B segue normal.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/rebaixamento.ts:86-94`: quando o cache do tamanho da escola vence, todos os pedidos que chegam durante a consulta vão juntos ao banco. Guarde a Promise em andamento no cache para cada escola fazer uma consulta só.
- Contagem por IP em IPv6: um atacante com um /64 troca de endereço e escapa do rebaixamento e do limite do e-mail. Avalie contar pelo prefixo /64 e registre a decisão na seção 13 da Tech Spec como risco aceito ou resolvido.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/limite-email-ip.ts:281`: se o banco falhar em `escolasDaRede`, o login por e-mail acima do limite recebe 500. Nessa falha, trate o IP como de rede nenhuma (0 escolas) e siga, com um aviso espaçado.
- O cenário `infra/k6/login-7h30.js` fica para a 16.0, como a tarefa prevê. Inclua nele o ataque acima do teto anônimo junto com os alunos no mesmo IP.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-18 18:03:03 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As sete escolhas estão registradas em "Notas da implementação" e nenhuma contradiz a seção 5 nem a 7c. A linha do `@SemEscopo` para "rede por IP de saída" já estava na seção 6, e a contagem passou para 22.
Portão local: `portão local: infra/test/metricas.int.test.ts mudou em 2026-09-18 18:02:24, depois do início do último (2026-09-18 16:14:26). Rode node tools/processo/portao-local.ts --infra de novo.`

Bloqueantes:
- Portão local sem carimbo válido. Esperei o processo do portão (PID 3260546) terminar e rodei o `conferir` de novo. Ele continua recusando.
  - Durante a revisão, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/metricas.int.test.ts:219-245` foi alterado às 18:02. A alteração inclui `login_falhas_total` e `login_prioridade_rebaixada` na lista fechada de métricas com `escola_id`. Esse arquivo não estava na lista de arquivos da tarefa, e o horário indica que a suíte infra da rodada anterior reprovou nesse teste.
  - A alteração em si está certa: acompanha a mudança em `METRICAS_COM_ESCOLA`. Mas a árvore mudou depois do último carimbo.
  - **Correção exigida:** rodar `node tools/processo/portao-local.ts --infra` até o fim, com as quatro suítes verdes, e confirmar com `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/15_task.md`. Na rodada nova, conferir que nada mais mudou além desse teste.
- No código não encontrei bloqueante. Conferi `conferencia-na-vez.ts`, `rebaixamento.ts`, `limite-email-ip.ts`, `contador-em-janela.ts`, as mudanças no semáforo (fila normal e fila rebaixada por balde, IP esquecido a cada minuto) e o espelho da conta segurada no seguro. Também conferi o `ConsumoDeDesafio` com rastro, o `SeguroDoLogin`, a opção `prazoDoRedisDeLoginMs` (o `main.ts` não a passa), o `AlunosAtivosRepository` com escopo, os dois alertas com runbook, o ensaio e a nota de IP em memória em `docs/lgpd.md`.

Recomendações:
- `apps/api/src/sessao/senha/semaforo-de-hash.ts:171`: a cada minuto, a roda também esquece o balde que está com um hash em andamento e ninguém esperando. O próximo pedido desse balde volta para `#vez - 0.5` e passa à frente de quem acabou de ser atendido. O comentário da linha 22 admite o efeito, mas ele vai contra o que a 14.0 fixou ("o balde com o hash em andamento vai para o fim da roda"). Vale um teste ou uma linha no runbook, se isso aparecer no cenário da 16.0.
- `rebaixamento.ts:168-176` e `limite-email-ip.ts:237-248` repetem o mesmo padrão de cache em memória com validade e teto. Se surgir um terceiro uso, vale extrair um cache com prazo em comum.
- No runbook, o item "4." aparece duas vezes na seção "Seguro de limite ativo" (linhas 100 a 102 do `docs/runbook.md` atual). Confira a numeração.

## test-engineer · 3ª rodada · REPROVADO · 2026-09-18 18:10:30 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: REPROVADO

**Cenários exigidos para esta rodada (a mudança do veto do infra-guardian e as recomendações aplicadas):**
1. Caminho feliz: acima do limite por IP, as rotas de login não recebem 429. A tentativa vai para o fim da fila, e quem traz o cookie de dispositivo mantém a vez. Vale para matrícula e para e-mail.
2. O login lotado não gasta o limite das outras rotas anônimas do mesmo IP. A página de acesso continua respondendo.
3. As outras rotas anônimas continuam recebendo 429 acima do limite. O decorator novo não pode vazar para elas.
4. Borda da rede pública: e-mail de uma rede atrás de um IP, acima do limite anônimo e abaixo do limite da rota de e-mail vezes o número de escolas da rede.
5. Carga, com a fila do semáforo cheia: o pedido não rebaixado despeja um rebaixado, e o rebaixado que chega sai ele mesmo.
6. Escola barulhenta ao lado de outra: quem é despejado vem da fila com mais rebaixados, não da escola vizinha.
7. Leitura do tamanho da escola em voo único, com pedidos em paralelo.
8. Banco com erro na leitura da rede do IP: vale o limite simples, sem 500.
9. A roda do semáforo esquece só quem não foi visto no minuto anterior.
10. A lista fechada de métricas com `escola_id` inclui as duas métricas de login.

**Cobertos:**
- **Cenário 1, só na matrícula.** O teste `apps/api/test/ataque-de-senha.int.test.ts:312` é efetivo contra três remoções:
  - Com o 429 antigo, o 151º pedido quebra.
  - Sem o balde próprio `rl:ip-login`, a página `/acesso` recebe 429.
  - Sem `acimaDoLimiteDoIp` no service, o colega chega primeiro e a ordem fica invertida. O teste também afasta o rebaixamento por falhas (série indefinida).
- **Cenário 1, "sem 429" no e-mail.** Coberto pelo teste da `:365`: são 181 tentativas pelo mesmo IP com o limite anônimo em 150, e todas respondem 401.
- **Cenário 3.** Os testes de `apps/api/test/limite.int.test.ts` continuam esperando 429 na rota anônima de teste, então o decorator não vazou.
- **Cenário 5.** Coberto por `semaforo-de-hash.test.ts:332`.
- **Cenário 7.** Coberto por `rebaixamento.test.ts:133`, com 10 pedidos em paralelo de verdade.
- **Cenário 8.** Coberto por `rebaixamento.test.ts:201`. O teste também prova que o erro não fica guardado.
- **Cenário 9.** O teste que agora espera 4 quebraria sem `#vistoEm` (daria 3).
- **Cenário 10.** Coberto por `infra/test/metricas.int.test.ts`.
- Não há `.skip`, teste comentado, nem chamada a provedor de IA.

**Bloqueantes:**

1. **`apps/api/src/sessao/login.service.ts:105`: o rebaixamento do e-mail pelo limite por IP do login não tem teste.**
   - O código é `rebaixado = acimaDoLimiteDaRota || (!conhecido && origem.acimaDoLimiteDoIp === true)`. Se o segundo termo for apagado, nenhum teste falha.
   - O teste da `:365` passa das 150 tentativas, mas só confere o status 401 e a métrica do limite da rota de e-mail, que não enxerga esse caminho. Nenhum teste de unidade do `LoginService` passa `acimaDoLimiteDoIp`.
   - Esse ramo é o único que age numa rede com mais de 50 escolas atrás de um IP: 60 por escola passa de 3000, o limite anônimo de produção. É exatamente o caso de rede municipal.
   - **Correção exigida:** um teste de integração ou de unidade no e-mail em que o IP esteja acima do limite anônimo e abaixo do limite da rota vezes as escolas da rede. Por exemplo, com `LIMITE_REQ_IP_ANONIMO_MIN=150` e uma rede de 3 escolas (limite da rota em 180): a partir da 151ª tentativa, com a vez segurada, o pedido sem cookie vai para o fim da fila, o pedido com o cookie da conta passa na frente, e nenhum recebe 429.

2. **`apps/api/src/sessao/senha/semaforo-de-hash.test.ts:332`: o critério "despeja da fila com mais rebaixados" não é provado.**
   - O próprio código declara esse critério em `semaforo-de-hash.ts:65-66` e o implementa em `:166-170`.
   - No teste, todos os rebaixados estão numa única fila, a da `ESCOLA_A`. Se `#despejarUmRebaixado` pegasse o rebaixado mais antigo de qualquer fila, o teste continuaria verde.
   - Esse é o caso da escola barulhenta ao lado de outra: a escola C tem um aluno legítimo rebaixado, a A tem milhares de tentativas de ataque rebaixadas, e quem deve sair é da A.
   - **Correção exigida:** enfileirar primeiro 1 rebaixado de uma terceira escola e depois os rebaixados da A, até a fila encher. Aí afirmar que, quando chega o pedido não rebaixado, sai com 503 o mais antigo da A, e o da escola C continua esperando e é atendido quando chega a vez dele.

**Recomendações (não bloqueiam):**
- `matricula.service.ts:125`: o `baldeDaEscolaDesconhecida(origem.acimaDoLimiteDoIp === true)`, para escola que não existe, não tem teste. Vale um teste de unidade do semáforo ou do service com endereço inexistente vindo de IP acima do limite.
- `rebaixamento.test.ts:133`: o voo único usa `alunosAtivos` que resolve na hora, então só pega a leitura dupla pela ordem das microtarefas. Fica mais robusto com uma leitura que o teste solta à mão, afirmando 1 chamada antes de soltar.
- `rebaixamento.test.ts:201`: não verifica o aviso `login.rede_do_ip_sem_banco`, que é espaçado. Vale afirmar que ele sai uma vez em várias tentativas.
- `consumirDoLogin` com o Redis de cache fora (seguro em memória) não tem teste próprio. O caminho é o mesmo `#consumir` que já é testado, por isso fica como cobertura extra.
- Teste da roda do semáforo: vale incluir o caso que motivou a recomendação do revisor-geral, um balde com hash em andamento visto há menos de um intervalo e sem ninguém esperando, que continua na roda.

## test-engineer · 4ª rodada · APROVADO · 2026-09-18 18:22:30 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Cenários exigidos: os dois cenários que a 3ª rodada exigiu. Não reauditei o que não mudou.
1. O limite por IP do login rebaixa o pedido de e-mail sem cookie. O pedido com o cookie da conta passa na frente. Nenhum dos dois recebe 429.
2. Com a fila cheia, o pedido não rebaixado despeja o rebaixado mais antigo da escola com mais rebaixados, e não o mais antigo de todos.

Cobertos:
1. Correção 1 feita, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts:345-372`.
   - **Montagem:** `LIMITE_REQ_IP_ANONIMO_MIN=150` vem de `AMBIENTE_DO_ATAQUE` (linha 29), numa rede de 3 escolas. A entrada do professor mais as 149 tentativas levam o IP a 150. O pedido sem cookie é o 151º, e a rota ainda está abaixo de 180.
   - **Se o termo `!conhecido && origem.acimaDoLimiteDoIp === true` da linha 105 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts` for apagado, o teste falha.** Os dois pedidos ficam no mesmo balde `equipe`, sem rebaixamento. A fila então segue a ordem de chegada, e o hash roda o pedido sem cookie primeiro. A asserção `[SENHA, 'senha-sintetica-da-equipe-sem-cookie']` fica vermelha.
   - **A causa é o limite do login, não o da rota:** o teste confere que `rebaixadasNoEmail()` não anda.
   - **Nenhum 429:** o teste confere os status `[200, 401]`.
   - **Concorrência de verdade:** a vez fica segurada, os dois pedidos entram na fila com `naFila(1)` e `naFila(2)`, e só então a vez é solta. Não são duas chamadas em sequência.
2. Correção 2 feita, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.test.ts:333-369`.
   - O rebaixado da C entra primeiro, e os rebaixados da A enchem a fila depois dele.
   - **Se o critério fosse "despeja o rebaixado mais antigo de todos", o teste falharia:** o despejado seria `'503-C'`, e a asserção `['503-A0']` fica vermelha.
   - O teste também confere que a fila não cresce (`esperando === MAXIMO_ESPERANDO`).
   - Confere ainda que o rebaixado novo, chegando com a fila cheia, sai com 503 sem rodar a tarefa.
   - E confere que, depois da vez da B, a C é atendida (`entrou-C`).

Nenhum dos dois arquivos tem `.skip` nem `.only`. Nenhum mock esconde a regra: o semáforo é o real, e o teste de integração passa pela guarda e pelo serviço de verdade.

Não rodei os testes, porque o portão local estava rodando. Fiquei com o que você relatou: o teste novo verde isolado (13/13), a mutação na linha 105 deixando-o vermelho, e o arquivo do semáforo verde (18/18).

Bloqueantes: nenhum.

Recomendações:
- O título do teste em `semaforo-de-hash.test.ts:333` ainda diz "o rebaixado que espera há mais tempo". O critério agora provado é "o mais antigo da fila com mais rebaixados". Vale pôr isso no título, para o `/validar` e o `/retro` lerem o critério certo.
- Em `ataque-de-senha.int.test.ts:353`, o comentário diz que o IP chega a 150 "no balde do login". Isso depende da entrada do professor na linha 350 contar para o mesmo limite. Uma asserção explícita, ou um comentário dizendo que a 1ª requisição é a do professor, deixaria claro por que o laço começa em 1.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-19 11:38:52 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration desde a rodada aprovada. As consultas que estão no diff de trabalho já foram auditadas na 1ª rodada: `usuario` (contagem de alunos ativos, filtrada por `escolaId` do contexto) e `rede` com `escola` (número de escolas por IP de saída).

Queries verificadas:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/alunos-ativos.repository.ts:12`. O escopo vem de `exigirEscolaDoContexto()`. No `sessao.module.ts:127` a função `alunosAtivos` não recebe escola por parâmetro. Ela roda dentro de `naEscolaSemUsuario(escolaId)` em `matricula.service.ts:89`, e esse `escolaId` é o mesmo que chave `#tamanhos` e `#lendo` em `rebaixamento.ts:88-103`. A leitura em voo único é separada por escola, então a leitura em andamento da A não serve à B.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:359`, `escolasDaRedeDoIpDeSaida`. Tem `@SemEscopo` com justificativa e devolve só o número de escolas. Com erro do banco, `limite-email-ip.ts:72-79` vale 0 escolas, não guarda em cache e não põe o IP no log. Não revela nada ao cliente.
- `@LimiteQueRebaixa()` e `acimaDoLimiteDoIp` (`guarda-limite.ts:113-121, 139-143`): a marca é um `WeakSet` preso ao objeto da requisição e é posta só pela guarda. Nada vem do corpo nem da query string. O balde `rl:ip-login` é separado por IP, sem dimensão de escola vinda do cliente.
- Nenhum endpoint passou a aceitar `escolaId` do cliente. Na matrícula, a escola continua vindo do slug, resolvida no servidor.

Teste de isolamento: presente e efetivo.
- `semaforo-de-hash.test.ts:333`. Se o despejo tirasse o rebaixado mais antigo de todas as filas, em vez do mais antigo da fila com mais rebaixados, sairia o aluno da escola C, que chegou primeiro, e a asserção quebraria.
- `semaforo-de-hash.test.ts:156`. Se o rebaixamento mexesse na roda entre baldes, a ordem esperada `B-1, A-rebaixado-1, B-2…` quebraria.
- `rebaixamento.test.ts:95`. Se a escola saísse da chave de `#chave`, o IP rebaixado na A também seria rebaixado na B e o teste quebraria.
- O 503 do rebaixado despejado é o mesmo `INDISPONIVEL_TENTE_DE_NOVO` de qualquer espera longa. Ele não diz se a conta existe nem de que escola é.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/rebaixamento.test.ts:133`. O teste de voo único só usa a escola A. Falta um caso com a leitura da A e a da B em andamento ao mesmo tempo, com tamanhos diferentes, que prove que a B não recebe a promessa da A. Hoje, se `#lendo` deixasse de ser separado por escola, nenhum teste quebraria. O efeito seria só no limiar e não chega a nenhuma resposta, por isso fica como recomendação.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts` já tem vários `@SemEscopo` (slug, e-mail, rede por IP). A regra 10, item 9, pede que se discuta o desenho a partir do terceiro no mesmo módulo. As justificativas estão escritas e as consultas acontecem antes de haver escola. Vale registrar no `/retro` se o login anônimo deveria ter um repository próprio para as consultas pré-tenant.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-19 11:38:55 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A mudança nas duas rotas de login veio do veto do `infra-guardian`. Antes elas respondiam 429 `LIMITE_EXCEDIDO` acima do limite anônimo por IP. Agora levam `@LimiteQueRebaixa()`, contam num balde próprio (`rl:ip-login`) e só rebaixam a tentativa no semáforo. A decisão está registrada na seção 5 da `techspec.md`, a do IPv6 na seção 13, e as duas nas notas 8 e 9 de `15_task.md`. Não foi mudança em silêncio. O cenário de carga continua reservado para a 16.0.
Portão local: carimbo válido. O `conferir` saiu 0 com typecheck, lint, test e infra.
Bloqueantes: nenhum.

Correção exigida na rodada anterior:
- O carimbo agora vale para a árvore atual, com a suíte de infra.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/metricas.int.test.ts`: a lista fechada de métricas com `escola_id` passou a incluir `falhasDeLogin` e `prioridadeRebaixada`.
- Minhas recomendações foram atendidas. O semáforo não apaga pelo prazo quem foi visto no último minuto (`#vistoEm`). No runbook, a numeração de "Login lento", causa 4, e de "Seguro de limite ativo", causa 4, está em seções diferentes e está correta.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/guarda-limite.ts:53`: quando a guarda marca uma requisição de login acima do limite por IP (`rl:ip-login`), nenhuma métrica registra isso. No e-mail, o limite da própria rota (60 por minuto) está bem abaixo desse teto e já é medido. Na matrícula, o limiar de 100 falhas por minuto numa escola dispara antes dos 3000 por minuto. O furo real é o endereço de escola que não existe, que só é rebaixado por esse caminho e fica sem série. Um contador sem rótulo resolveria (regra 80, item 10).
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts:162-176`: o comentário e a Tech Spec falam em "balde com mais rebaixados", mas o código escolhe a subfila com mais rebaixados. No balde `equipe`, isso significa o IP com mais rebaixados, não o balde. O comportamento é razoável; o texto é que deveria dizer isso.
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`: "Login rebaixado numa escola" ainda descreve só o rebaixamento pelo limiar de falhas. Falta uma linha dizendo que o limite por IP das rotas de login também rebaixa sem acender esse alerta.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-19 11:39:00 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Esta rodada cobre só o que mudou desde a 1ª, que já estava aprovada. Li o código, não rodei testes nem contêineres. Todos os itens pedidos foram feitos, e nada novo quebra a regra 20.

**Campos pessoais tocados:** só o IP de quem tenta entrar. Ele é usado sem ser gravado, em três lugares:
- no balde `rl:ip-login:{ip}` do Redis de cache, que vive um minuto;
- na memória do semáforo, ligado à hora em que foi visto (`#vistoEm`);
- no cache que guarda quantas escolas a rede daquele IP tem.

Nenhum campo novo foi criado. Nenhum dado de aluno ou de equipe entrou.

**Fora da tabela de dados do `docs/lgpd.md`:** nenhum. O parágrafo "IP só em memória, no login" (`/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:65-78`) já cita o `rl:ip-login`. O prazo do semáforo ficou "até dois minutos, ou até o login seguinte com a instância parada", como a minha recomendação 1 pedia. Conferi no código: a roda só esquece quando concede uma vez, e isso fecha com o texto.

**Autorização por objeto:** ok. A guarda nova só age em rota anônima marcada com `@LimiteQueRebaixa()` e não abre objeto de ninguém. Quem passa do limite do IP vai para o fim da fila, e a resposta final não muda (401, 429 da conta segurada, ou 503 do semáforo). Por isso não dá para descobrir se a conta existe.

**Logs:** limpos.
- O aviso `login.rede_do_ip_sem_banco` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/limite-email-ip.ts:40`) não leva o IP.
- A métrica `login.limite_email_ip` não tem rótulo.
- A marca de "acima do limite" fica numa `WeakSet` presa à requisição e some junto com ela.

**Auditoria:** nenhuma ação desta mudança exige auditoria.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os testes usam IPs de faixa de teste (198.18.x.x, 192.0.2.x) e ids fixos.

**Correções pedidas na rodada anterior:**
- **Texto do IP em memória no `docs/lgpd.md`:** feito.
- **Esquecer o IP por prazo no semáforo:** feito e testado em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.test.ts:213-240`. O IP de antes some depois do intervalo, e quem espera ou está com a vez continua.
- **Seguro em memória varrendo a cada minuto:** feito e testado em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/contador-em-janela.int.test.ts:75-96` (`noSeguro` volta a 1).
- **Banco com erro vira 0 escolas, sem guardar o erro:** feito e testado em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/rebaixamento.test.ts`, no caso "falha: com o banco com erro na leitura da rede".
- **Limite do login sem 429 e com balde próprio:** coberto em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts:312` e `:345`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:75-76`, o parêntese sobre o `rl:ip-login` vem logo depois de "recebem só o HMAC do IP". Quem lê pode achar que essa chave também é HMAC, mas ela guarda o **IP como veio**: `criarLimite` usa o IP direto na chave (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/limitador.ts:120-131`). O seguro em memória desse limite, igual ao do F0, também guarda o IP como veio. Vale dizer isso com todas as letras, lembrando que é o mesmo modelo do `rl:ip` do F0.
2. O rate limit por IP do F0 (`rl:ip`) guarda o IP no Redis de cache e não aparece no mapa de dados do `docs/lgpd.md`. É anterior a esta tarefa, então fica para o `/retro`: registrar numa linha a finalidade de segurança e o prazo de um minuto.
3. Não há teste de unidade da guarda no nucleo para `@LimiteQueRebaixa()`. Hoje só o teste de integração da API cobre esse caminho. Um teste em `packages/nucleo` que mostre "passou do limite, marca a requisição e não recusa" deixaria a regra provada no próprio pacote.

**Pergunta de fechamento:** nada do que mudou grava dado nem envia dado a outro lugar. O IP só vive em memória e no Redis, com prazo e sem virar log, métrica ou auditoria. Quando for preciso investigar, ele continua sendo consultado no registro de acesso, que já está no mapa. A resposta à secretaria continua igual à da rodada aprovada.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-19 11:39:09 · `tasks/prd-identidade-e-tenancy/15_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login

Rate limit: ok

Fila e prioridade: ok

Concorrência: protegida

Índice e paginação: ok

Degradação de IA: não se aplica

Migration: não se aplica

Métrica e alerta: ok

Bloqueantes: nenhum

A correção exigida na 1ª rodada foi feita, nas quatro partes:
- **Nenhum 429 por IP nas duas rotas de login.** As rotas levam `@LimiteQueRebaixa()` e contam num balde próprio (`rl:ip-login`). Acima do teto, `guarda-limite.ts:52-56` só marca a requisição e deixa passar. A página `/v1/escolas/:slug/acesso` continua no limite anônimo normal, que o login não gasta mais.
- **Registro na Tech Spec.** Está na seção 5, em `techspec.md:155`.
- **Fila cheia do semáforo despeja primeiro um rebaixado.** O ajuste está em `semaforo-de-hash.ts:460` e `:475-486`, com teste de unidade (`semaforo-de-hash.test.ts:333`).
- **Teste de integração.** `ataque-de-senha.int.test.ts:312` roda 150 logins pelo mesmo IP na matrícula da escola A. Todos respondem 200 e a página de acesso também. A aluna com cookie passa na frente do colega sem cookie, e nada recebe 429. Sem a correção, o teste falha no `/acesso` e no colega. A escola B normal está coberta em `:288`, e o e-mail de rede em `:345`.

Os 429 que ainda aparecem nos testes (`:434`, `:454`, `:550`) vêm da conta segurada por conta, não do IP, e isso está de acordo com a regra 80.

Recomendações:
- **Texto do despejo não bate com o código.** O comentário de `semaforo-de-hash.ts:388` e `:474` diz "balde com mais rebaixados". O código escolhe a maior subfila (`:478`). No balde `equipe`, onde cada IP tem sua subfila, um ataque que espalha IPs deixa subfilas curtas. Aí quem é despejado é o rebaixado de uma escola (fila única), que pode ser aluno de verdade atrás do NAT. Ou o comentário passa a dizer o que o código faz, ou o código passa a somar por balde.
- **Custo do despejo com a fila cheia.** `#despejarUmRebaixado` percorre todas as subfilas rebaixadas a cada chegada. Com 10.000 esperando espalhados por IPs na `equipe`, isso é O(n) por pedido no event loop, justo no pico. Vale guardar um contador de rebaixados por balde.
- **Rebaixamento pelo limite do IP sem métrica própria.** Os outros dois rebaixamentos têm série (`serieRebaixada`, `rebaixadasNoEmail`). Este não tem, e o 429 que antes aparecia na métrica HTTP agora não aparece em lugar nenhum. O operador vê a espera subir em `login.hash_espera` sem saber o motivo. Sugiro um contador `login.rebaixado_ip{escola_id|equipe}`, sem IP no rótulo.
- **Testes de unidade que faltam.** `baldeDaEscolaDesconhecida(origem.acimaDoLimiteDoIp === true)` em `matricula.service.ts:125`, e `consumirDoLogin` com o Redis fora, seguem sem teste próprio, como já anotado em `achados-revisoes.md:3236-3239`.

Arquivos:
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/guarda-limite.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/limitador.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/techspec.md

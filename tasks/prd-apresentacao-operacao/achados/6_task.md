# Achados das revisões — `tasks/prd-apresentacao-operacao/6_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-24 00:35:57 · `tasks/prd-apresentacao-operacao/6_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os dez da tabela "Testes que provam a regra" (C22, C23, C24, C25, C15, C33 em parte, U2, aparelho de sempre, operador desativado, 15 tentativas em paralelo). Somam-se as regras das divergências: senha certa fora das 72 h conta como falha e não zera o contador; `entrada_falha` nunca leva `operador_id` e é gravada também na resposta 429; a métrica é separada do `login.falhas`; o cookie da escola não vale no lugar do cookie do operador, e o contrário também.

**Cobertos** (todos em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/entrada-operador.int.test.ts`, menos o U2):
- **C22 (l.220):** compara status, corpo sem o `requisicaoId`, `Retry-After` e `Set-Cookie`. Também confere que o hash roda duas vezes, então o e-mail inexistente não pula o hash.
- **C23 (l.266):** com o relógio da aplicação controlado, a espera cresce em 30, 60, 120, 240, 480 e 900 s, com o valor exato do `Retry-After`. Dentro da espera, nem a senha certa passa e o hash não roda (10 chamadas no total). A conta Y, do mesmo IP, entra. Se o contador fosse por IP, o teste falharia.
- **C24 (l.291):** cobre os dois sentidos com o mesmo IP, e o lado já segurado continua segurado depois que o outro entra. Com o prefixo único, o teste falharia, porque a chave e a origem `outro` coincidiriam.
- **C25 (l.351):** procura o e-mail sentinela e o e-mail existente dentro de cada linha inteira de `acesso_operacao` (`row_to_json`). Confere `operador_id` nulo também para o e-mail que existe, a métrica com +2, e que nenhuma linha de log leva e-mail, a parte local dele ou senha.
- **C15 (l.187 e l.207):** 71h59 e 72h01 medidos no relógio do banco, como a divergência justifica. Depois das 72 h, a senha certa responde igual à errada, grava `entrada_falha` e não zera o contador: a quinta falha segura a conta com 30 s. Com o segundo fator ativo e o aceite fora do prazo, a resposta é `mfa`.
- **C33 em parte (l.406):** com o dobro do limite do IP, todas as respostas são 401 e nenhuma é 429 `LIMITE_EXCEDIDO`. O balde aparece como `rebaixado: true` e o `CONTA_SEGURADA` vem do contador. Quem traz o cookie de dispositivo e quem vem de outro IP mantêm a vez.
- **U2** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.test.ts`, os dois testes novos no fim do arquivo): a chave da escola é escrita à mão no formato anterior, `login:` mais o HMAC em base64url. A chave `login-op:` muda só o prefixo, e os dois contadores são independentes.
- **Aparelho de sempre (l.318):** também prova que o cookie da escola com o nome do cookie do operador não serve, e que o cookie do operador com o nome do cookie da escola também não.
- **Operador desativado (l.232):** responde igual ao inexistente, com a senha certa. O operador que nunca aceitou o convite também responde igual.
- **Concorrência (l.336):** as 15 tentativas vão em paralelo de verdade, com `Promise.all`. O resultado é 5 hashes, 4 respostas 401, 11 respostas 429 e 15 registros de `entrada_falha`, e a 16ª tentativa está segurada.
- **Permissão e contrato (l.250):** campo a mais, e-mail curto e senha vazia dão `ENTRADA_INVALIDA` sem hash, e a resposta não aceita campo a mais.

Não há `.skip`, `.only` nem teste comentado. Os `vi.spyOn` em `hash.verificar` e em `semaforo.executar` só observam, sem trocar a implementação, e o mock de `relogioDoSistema.agora` só adianta o tempo. Nenhum deles esconde a regra testada. A tarefa não chama IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Não há teste de que a senha certa zera o contador (`contador.zerar` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/entrada.service.ts:93`). Se essa linha fosse removida, nenhum teste falharia. Sugestão: 3 erros, uma entrada certa, mais 4 erros ainda respondendo 401.
2. A divergência diz que a métrica `operacao.entrada_falha` também soma no 429 `CONTA_SEGURADA`, mas só o caso 401 tem asserção (C25). Vale conferir `falhasNaMetrica()` com +15 no teste de concorrência.
3. A razão de não usar a `ConferenciaNaVez` é não somar em `login.falhas` nem em `login.conta_segurada`, e isso não tem teste. Uma asserção de que essas séries não mudam depois de uma falha do operador prenderia a divergência.
4. No C25, o laço sobre `linhasDeLog` (l.375) percorre o log de todo o `describe`, não só das duas falhas. Isso deixa a checagem mais forte, mas o nome sugere as linhas do teste. Só vale um comentário.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-24 00:36:36 · `tasks/prd-apresentacao-operacao/6_task.md`

```
VEREDITO: APROVADO
Campos pessoais tocados: e-mail de login e hash de senha do operador Turmma (só lidos);
  IP e data em acesso_operacao (entrada_falha); cookie de dispositivo do operador (lido, com chave própria).
  Nenhum dado de aluno, de escola ou de menor.
Fora da tabela de dados do docs/lgpd.md: nenhum. As três coisas estão na tabela: acesso à operação
  (lgpd.md:79), cookie de dispositivo com a chave própria do operador (lgpd.md:69) e conta de operador (lgpd.md:76).
Autorização por objeto: ok. A rota é de entrada, sem sessão e sem id na URL. E-mail inexistente,
  operador desativado, operador sem senha, senha errada e senha certa fora das 72 h dão o mesmo
  status e o mesmo corpo (C22 e a borda do desativado comparam a forma da resposta). A conta
  segurada responde 429 para existente e inexistente igualmente, porque o contador é pelo HMAC do
  e-mail, e não pelo id do operador.
Logs: limpos. O service não tem logger. O C25 captura o log em nível trace e confere que o
  e-mail sentinela, a parte local dele, o e-mail do operador e as duas senhas não aparecem em nenhuma linha.
Auditoria: presente onde a regra exige. entrada_falha fica em acesso_operacao sem operador_id
  e sem e-mail, também na tentativa segurada. A entrada que dá certo é registrada ao abrir a
  sessão, na tarefa 7.0, fora deste escopo. Nenhuma ação da regra 20, item 10, é tocada.
Envio externo: nenhum.
Seed/fixture: sintético (e-mails *.invalid gerados com randomUUID, operador criado no teste).
Bloqueantes: nenhum.
Recomendações:
  - apps/api/src/operacao/entrada.service.ts, no método #falhar: cada tentativa segurada (429) grava
    uma linha em acesso_operacao. Um ataque contínuo contra um e-mail faz a tabela crescer uma linha
    por requisição, dentro da retenção de 6 meses. Vale confirmar com o infra-guardian se o limite
    que rebaixa por IP e o expurgo seguram esse volume, ou se o registro da segurada deve ser
    agregado por janela.
  - A decisão de não gravar operador_id em entrada_falha (para não dizer se o e-mail existe) está
    certa. Ela deve entrar no texto da linha "Acesso à operação" em docs/lgpd.md na 7.0, junto com
    a entrada que dá certo, para o dossiê explicar por que a falha não tem autor.
Pergunta de fechamento: não se aplica a titular aluno, porque a tarefa não toca dado de aluno.
  Para o operador, o que se guarda sobre a entrada responde por consulta a acesso_operacao, e
  nada sai do sistema.
```

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/entrada.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/entrada.controller.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/dispositivo-de-operador.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operacao.module.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/entrada.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/entrada-operador.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md

## revisor-geral · 1ª rodada · APROVADO · 2026-09-24 00:37:03 · `tasks/prd-apresentacao-operacao/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Há duas divergências e as duas estão registradas no lugar certo. A primeira é o contador só pelo e-mail nesta rota. A Tech Spec, seção 5 ("Entrada"), pede e-mail e `operador.id`, mas o contador por id é o que a seção "Limite" atribui ao `/sessao/mfa`. Contar pelo id aqui só funcionaria para o e-mail que existe, e essa diferença revelaria quais existem. O motivo está em "Divergências resolvidas nesta tarefa" e já subiu para a `techspec.md`, como a skill `executar-task` exige. A segunda é a `ConferenciaNaVez` reescrita dentro do service, também registrada, com motivo (a série `login.falhas` da equipe).
Portão local: carimbo válido (typecheck, lint, test, infra)
Bloqueantes: nenhum

Recomendações:
- **Mesma lógica em dois lugares.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/entrada.service.ts:81-103` copia o trecho de `apps/api/src/sessao/senha/conferencia-na-vez.ts:58-81`: a vez no semáforo, a reserva, a leitura, o hash e o `#falhar`. O motivo registrado é real, mas o jeito menor seria a `ConferenciaNaVez` receber os contadores de métrica por parâmetro. Do jeito que está, uma correção futura no trecho do F1, como uma mudança de ordem entre a reserva e o hash, precisa ser lembrada nos dois arquivos.
- **Rebaixamento só pela guarda.** A entrada do operador rebaixa só pelo `@LimiteQueRebaixa` (`acimaDoLimiteDoIp`). Ela não usa o `LimiteDoEmailPorIp` da rota, que o F1 aplica no `/v1/sessao/email`, nem soma em `login.rebaixado_ip`. A Tech Spec não exige o segundo limite, e o C33 fica coberto. Mesmo assim, valia uma linha nas divergências dizendo que isso foi escolha, para ninguém ler depois como esquecimento.
- **Métrica e painel.** `operacao.entrada_falha` não nasce em 0 (`add(0)`), ao contrário dos contadores do F1 (`baldes-de-login.ts`, `limite-email-ip.ts`). Hoje não há alerta que precise disso, mas o painel mostra "sem dado" até a primeira falha. Além disso, as tentativas do operador entram no balde `equipe` do semáforo e aparecem em `login.hash_espera{escola_id=equipe}`. É a mesma mistura de séries que a divergência quis evitar em `login.falhas`.
- **Constante sem uso nesta tarefa.** `CAMINHO_DOS_COOKIES_DE_OPERADOR`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/dispositivo-de-operador.ts:16`, não é usada em lugar nenhum. Ela existe só para a 7.0. É pequena e está documentada, mas o melhor é ela nascer junto com quem a usa.

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-24 00:37:29 · `tasks/prd-apresentacao-operacao/6_task.md`

VEREDITO: REPROVADO

Caminho quente tocado: login

Rate limit: ok. O contador é por conta, com a chave `login-op:{HMAC(e-mail)}:{origem}`. Quando o IP passa do limite, a tentativa só perde a vez, sem 429.

Fila e prioridade: ok

Concorrência: protegida. A reserva no contador acontece antes do hash, e o `Promise.all` de 15 tentativas está coberto por teste.

Índice e paginação: ok. `operador` e `convite_operador` são tabelas de poucas linhas, e a rota não tem listagem.

Degradação de IA: não se aplica

Migration: não se aplica

Métrica e alerta: ok. `operacao.entrada_falha` tem painel e não tem alerta novo, como a techspec 7c prevê.

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/entrada.service.ts:88-89` e `:96-97`. A tentativa com a conta segurada (`seguradaPorMs`) também passa por `#falhar`, que faz um `INSERT` em `acesso_operacao` antes de responder 429. É uma escrita no banco a cada requisição, numa rota sem autenticação e sem teto de volume:
   - O limite por IP só tira a vez no semáforo, nunca recusa (`@LimiteQueRebaixa`).
   - A tentativa segurada devolve a vez no semáforo logo depois do `reservar` no Redis, sem hash. Por isso o semáforo não freia essas tentativas.
   - O `INSERT` roda fora do semáforo.

   Resultado: basta alguém repetir um e-mail de operador conhecido e já segurado para gerar escritas no Postgres principal na velocidade que a API aceitar. Esse banco e o pool de conexões são os mesmos das escolas às 10h (regra 80, itens 1 e 3; o sistema precisa se defender sozinho).

   O F1 não tem esse vetor. `apps/api/src/sessao/login.service.ts:127` só grava `login_falho` na falha que passou pelo hash, e o semáforo limita esse ritmo. A divergência "vale também para a tentativa segurada" do `6_task.md` e da techspec (seção 5, "Entrada") criou o vetor sem avaliar a carga.

   Correção exigida: a tentativa segurada não grava em `acesso_operacao`. Ela só soma em `operacao.entrada_falha` e responde 429, como no F1. Outra saída aceitável: um teto por IP e janela no Redis antes da gravação. Nos dois casos:
   - atualizar a divergência no `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/6_task.md` e a linha da techspec;
   - ajustar a expectativa de "quinze entrada_falha" no teste de concorrência (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/entrada-operador.int.test.ts:336`);
   - acrescentar um teste que prove que N tentativas seguradas em sequência não geram N linhas em `acesso_operacao`.

Recomendações:

- A entrada do operador usa `baldeDaEquipe`, com o rótulo `equipe`. Por isso a espera no semáforo (`login.hash_espera{escola_id=equipe}`) e o `login.rebaixado_ip` somam as tentativas da nossa equipe com as das escolas, o mesmo problema que a divergência evitou em `login.falhas`. Registre isso na techspec ou dê um rótulo próprio ao balde, mantendo a mesma chave de rodízio.
- A techspec 7c pede uma linha no `docs/runbook.md` ("com o Redis fora, o operador não entra, e o caminho é `ops:*`"). Confira se ela entra nesta tarefa ou na 7.0.

## test-engineer · 2ª rodada · APROVADO · 2026-09-24 01:07:01 · `tasks/prd-apresentacao-operacao/6_task.md`

VEREDITO: APROVADO

**Cenários exigidos (desta rodada):** a correção que o infra-guardian exigiu. A tentativa com a conta segurada não pode gravar em `acesso_operacao`. A expectativa do teste de concorrência muda para as falhas que passaram pelo hash. Um teste novo precisa provar que N tentativas seguradas seguidas não geram N linhas. A divergência e a techspec precisam ser atualizadas.

**Cobertos:**
- **A correção no service:** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/entrada.service.ts:94`, o ramo `seguradaPorMs` chama `#falhar` sem gravar nada. `registrarFalhaDeEntrada` só roda no ramo da falha que passou pelo hash (linhas 98-100). `#falhar` (linhas 108-112) só soma a métrica e lança o erro.
- **O teste novo prova a regra:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/entrada-operador.int.test.ts:351-363`. Ele faz 4 erros e mais 1 que segura a conta, o que dá 5 linhas. Depois vêm 30 tentativas seguidas com a conta segurada. O teste confere que nenhuma chegou ao hash, que continuam 5 linhas e que a métrica subiu 30. Se o ramo segurado voltasse a gravar, seriam 35 linhas e o teste falharia.
- **Concorrência de verdade:** as chamadas vão em paralelo por `Promise.all`, nas linhas 336-349. O teste espera 5 linhas (antes esperava 15), 5 hashes, 4 respostas 401, 11 respostas 429 e 15 somadas na métrica. Com o ramo segurado gravando, também falharia.
- **A senha certa zera o contador:** o teste das linhas 365-372 cobre a minha recomendação 1 da rodada anterior. Ele falharia se o `zerar` fosse removido, porque o quinto erro depois da entrada seguraria a conta mais cedo.
- **Documentos atualizados:** `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md:106` e `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/6_task.md:96-98` agora dizem que a tentativa segurada não grava.
- **A métrica nasce com `add(0)`:** não muda nenhuma asserção, porque os testes comparam o valor antes e depois.
- **Proibidos:** não há `.skip`, `.only`, teste comentado nem mock de código nosso que esconda a regra. O único espião é sobre `hash.verificar`, e ele só observa quantas vezes o hash roda.

**Bloqueantes:** nenhum.

**Recomendações:**
- **Tabela de cenários desatualizada:** em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/6_task.md:67`, a linha de concorrência ainda descreve só "contam todas: a 16ª está segurada". Vale acrescentar "5 `entrada_falha`, 15 na métrica" e incluir o cenário de carga novo, para o `/validar` ler o mesmo que o teste prova.
- **A mesma prova com o balde rebaixado:** o teste de carga poderia repetir a checagem com o IP acima do limite, para mostrar que a conta segurada também não grava nesse caminho. Não bloqueia, porque o ramo segurado é o mesmo código antes de qualquer diferença entre os baldes.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-24 01:07:23 · `tasks/prd-apresentacao-operacao/6_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok

Bloqueantes: nenhum. A correção exigida na 1ª rodada foi feita:
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/entrada.service.ts:94`, a tentativa com a conta segurada vai direto para `#falhar`. Ela não grava em `acesso_operacao`, soma só em `operacao.entrada_falha` e responde 429 com a espera.
- A gravação em `acesso_operacao` (linha 99) só acontece na falha que passou pelo hash. O próprio hash limita quantas gravações cabem por minuto.
- A série `operacao.entrada_falha` começa em 0 quando a instância sobe.
- O teste de concorrência em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/entrada-operador.int.test.ts:336` agora espera 5 linhas e mais 15 na métrica.
- O teste novo em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/entrada-operador.int.test.ts:351` faz 30 tentativas seguidas com a conta segurada. Todas respondem 429, as linhas continuam 5 e a métrica sobe 30. É a prova que foi pedida.
- As divergências estão atualizadas em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md:106` e `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/6_task.md:96-98`.

Recomendações:
- A recomendação da rodada anterior foi atendida: a espera do operador somar no balde `equipe` de `login.hash_espera` está registrada como aceita em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/6_task.md:102-103` e no comentário do service. Se algum dia a equipe Turmma crescer a ponto de mudar a leitura dessa série, vale dar ao operador um rótulo próprio.
- O parágrafo do runbook para `operacao.entrada_falha` fica para a tarefa 9.0 (item 9.4). O `/validar` precisa conferir que ele entrou lá.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-24 01:07:38 · `tasks/prd-apresentacao-operacao/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As divergências estão registradas na seção "Divergências resolvidas nesta tarefa" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/6_task.md` e resumidas na seção 5, "Entrada", de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`. São quatro: o contador desta rota conta só pelo e-mail, `entrada_falha` só é gravada quando a tentativa passou pelo hash, só o limite da guarda rebaixa e o balde `equipe` foi aceito.
Portão local: carimbo válido (typecheck, lint, test e infra valem para o código atual)
Bloqueantes: nenhum.

O bloqueante do infra-guardian foi corrigido, com teste que prova a correção:
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/entrada.service.ts`, a conta segurada responde por `#falhar`, que só soma a métrica e lança o erro. `registrarFalhaDeEntrada` só é chamado quando a falha passou pelo hash.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/entrada-operador.int.test.ts`, o teste de carga faz 30 tentativas com a conta segurada. Ele confere que o hash não roda, que continuam 5 linhas em `acesso_operacao` e que a métrica sobe 30. Se o registro voltar para o caminho da conta segurada, o teste quebra.
- O teste de concorrência foi ajustado: 5 linhas e 15 na métrica. O teste de a senha certa zerar o contador cobre a borda que faltava.

As recomendações da rodada anterior foram feitas: a métrica nasce com `add(0)`, a constante `CAMINHO_DOS_COOKIES_DE_OPERADOR` saiu e não sobrou referência a ela, e os registros do balde `equipe` e do "só o limite da guarda rebaixa" estão no documento da tarefa e no docblock do service.

Recomendações:
- Com a conta segurada, a tentativa ainda ocupa uma vez no semáforo do balde `equipe` só para chamar `contador.reservar`, sem fazer hash. É barato, mas dá para conferir a reserva antes de pedir a vez. Isso mudaria a ordem que o comentário chama de "como no F1", então só vale se o F1 mudar junto.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-24 01:07:38 · `tasks/prd-apresentacao-operacao/6_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo nesta rodada. A correção só grava menos. A tentativa com a conta já segurada deixou de gravar `entrada_falha` em `acesso_operacao`. A falha que passou pelo hash continua gravando só `evento`, `ip` e data, com `operadorId: null` e sem e-mail (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts:327-329`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/entrada.service.ts:92-100`). O cookie de dispositivo do operador continua servindo só para dizer se a origem é `conhecido` ou `outro`, sem identificar ninguém.
Fora da tabela de dados do docs/lgpd.md: nenhum.
Autorização por objeto: ok. É uma rota de entrada sem objeto de escola. E-mail que não existe, operador desativado, senha errada e senha certa fora das 72 h respondem igual. A conta segurada responde 429 antes de ler a credencial, então o 429 também não diz se a conta existe.
Logs: limpos. O service e o controller não têm logger nem console. A falha soma só no contador `operacao.entrada_falha`, sem rótulo pessoal.
Auditoria: presente onde a regra exige. Entrada que falha não é ação que peça auditoria, e o `entrada_falha` que continua em `acesso_operacao` é rastro de acesso. A entrada que dá certo é registrada quando abre a sessão, na tarefa 7.0.
Envio externo: nenhum.
Seed/fixture: sintético. Os e-mails dos testes são `@turmma.invalid` e `ninguem-<uuid>@turmma.invalid`.
Bloqueantes: nenhum.
Recomendações:
- Minha recomendação da 1ª rodada, de não gravar uma linha a cada tentativa segurada, foi atendida. O teste de carga de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/entrada-operador.int.test.ts:351` prova que as tentativas seguradas não gravam, e o de concorrência (linha 336) confere cinco linhas e quinze na métrica.
- Uma coisa para registrar no `/validar`: a retenção de `acesso_operacao` precisa continuar declarada na linha dela em `docs/lgpd.md`, porque o IP da falha é dado pessoal de quem tentou entrar, mesmo sem operador associado.

# Achados das revisões — `tasks/prd-apresentacao-operacao/revisao-spec.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · REPROVADO · 2026-09-23 13:41:29 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO

A spec reprova por três bloqueantes. O mais sério: criar e desativar operador é alteração de permissão, e a spec guarda esses registros só 6 meses. O restante do desenho está bom. O panorama não devolve dado de pessoa, o token do convite só sai na resposta, os logs usam id e o IP está no lugar certo.

Campos pessoais tocados: nome e e-mail da primeira coordenadora (entrada do convite, já no mapa); conta de operador (nome, e-mail, hash de senha, segredo do segundo fator cifrado); HMAC dos códigos de recuperação do operador; convite de operador; sessão de operador; `registro_operacao` com IP.

Fora da tabela de dados do docs/lgpd.md:
- `CodigoRecuperacaoOperador` (HMAC dos códigos de recuperação): nenhuma linha do operador o cita. A linha da coordenação cita o dela.
- O evento `convite_operador` do `RegistroOperacao` (seção 3) não está na lista de eventos da linha "Registro da operação".
- A retenção da conta de operador diverge: a seção 7 diz "nome e e-mail apagados em 5 anos"; o mapa diz "enquanto a pessoa for da equipe".

Autorização por objeto: ok. Não há objeto de escola no painel. O id de escola só gera convite, e toda rota `/v1/operacao/*` responde 404 a credencial de escola. O token de operador também leva 404 nas rotas de escola, e "operador abre turma ou aluno pelo id" está coberto no teste de isolamento (seção 6), com lista das rotas gerada automaticamente e teste de efetividade.

DTO do panorama (seção 7): ok. Leva `id, nome, slug, rede{id,nome}, estado, turmas, professores, alunos, uso{dia,mes}`. Não leva e-mail, nome da coordenadora nem contagem por turma. O estado vem de haver coordenador ativado, sem expor quem é. O teste de "zero campo de pessoa" está na seção 10.

Token do convite: ok no desenho. Volta só na resposta do POST, não fica guardado em claro nem em log (seção 5). Vem pelo `#` e vai no corpo, não na URL do servidor. Refazer usa update condicional. Falta o teste que prova isso (bloqueante 3).

Logs: limpos no desenho. Seção 7: só ids e evento, nunca e-mail, token nem nome.

Auditoria: presente para rede, escola e convite da coordenação (na `auditoria`, com `autor_operador`). **Insuficiente para criar e desativar operador e configurar o segundo fator**: ficam no `registro_operacao`, que é apagado em 6 meses (bloqueante 1).

IP no registro_operacao: ok. É registro de acesso do Marco Civil, art. 15, igual ao `registro_acesso` que já existe. Está mapeado com finalidade e 6 meses de retenção, e a sessão do operador fica sem IP. O `ip?` nulo nos eventos do comando faz sentido.

Envio externo: nenhum. Não há IA nem provedor externo (seções 7 e 7b).

Seed/fixture: sintético. As escolas sintéticas estão nos testes das seções 10 e RF9, e o PRD, na seção 6, garante nome inventado.

Pergunta de fechamento: não piora a resposta. O painel não guarda nem lê dado de aluno, só contagem. As ações do operador dentro da escola vão para a `auditoria` que a escola consulta.

Bloqueantes:

1. **Seções 3 e 7 (Retenção), eventos `operador_criado`, `operador_desativado` e `mfa_configurado` no `registro_operacao`.**
   - O que está errado: criar e desativar operador dá e tira acesso de leitura entre escolas. É alteração de permissão, que a regra 20, item 10, manda auditar. Com o expurgo de 6 meses do `sistema.expurgar-acesso`, depois de meio ano não dá mais para responder quem podia ver o panorama numa data. Isso também contradiz o PRD (RF1: "o comando grava a auditoria com quem rodou") e a D76 ("toda ação do operador vai para a auditoria").
   - Correção exigida: separar o que é acesso do que é prestação de contas.
     - `registro_operacao` fica só com `entrada`, `entrada_falha` e `saida`, com IP e 6 meses.
     - `operador_criado`, `operador_desativado`, `mfa_configurado` e `convite_operador` vão para um registro de auditoria da operação, com autor e retenção de vigência + 5 anos, fora do expurgo de 6 meses.
     - A linha correspondente entra em `docs/lgpd.md` nesta mesma spec.

2. **Seção 7 (Retenção) contra `docs/lgpd.md`, linhas 76 a 78.**
   - O que está errado:
     - Conta de operador: a spec guarda nome e e-mail por 5 anos depois de desativar; o mapa diz "enquanto a pessoa for da equipe".
     - `CodigoRecuperacaoOperador` não tem linha no mapa.
     - Para sessão e convite de operador, a spec dá o prazo mas não diz quem apaga. Só o `registro_operacao` tem o `sistema.expurgar-acesso` escrito.
   - Correção exigida:
     - Alinhar spec e mapa num prazo só, com justificativa. A sugestão é apagar nome e e-mail ao desativar e manter o apelido, que é o que a auditoria precisa. Se a escolha for guardar 5 anos, a finalidade precisa estar escrita.
     - Pôr o HMAC dos códigos de recuperação no mapa, com a mesma retenção do segredo do segundo fator.
     - Declarar que o `sistema.expurgar-acesso` passa a apagar `sessao_operador`, `convite_operador` e os dados do operador desativado.

3. **Seção 10 (Testes): três regras de privacidade sem teste que as prove.**
   - Não há teste de que cada ação grava registro consultável com o operador certo. Isso vale para criar rede e escola, gerar, revogar e refazer convite, entrar, criar e desativar operador (é a prova do RF10 no PRD).
   - Não há teste de que o token do convite não fica em claro no banco nem sai em log, e de que ler a lista ou o estado depois não devolve o link (prova do RF6).
   - Não há teste de expurgo das tabelas novas no prazo.
   - Correção exigida: acrescentar esses testes de integração à seção 10.

Recomendações:
- Pôr `Cache-Control: no-store` nas respostas que carregam o link do convite (criar e refazer) e os códigos de recuperação.
- Validar a saída com o contrato Zod estrito (`strict` ou `strip`) no controller, para que coluna nova no select não chegue à resposta.
- O DTO do panorama não traz o `conviteId`, e a rota `/convites/:id/refazer` precisa dele. Incluir o `conviteId` (sem e-mail) no panorama ou no estado da escola, para ninguém "resolver" isso devolvendo mais coisa.
- Escrever na spec que `entrada_falha` nunca grava o e-mail digitado, só IP e data.
- Confirmar que nenhum interceptor ou logger de requisição grava o corpo das respostas de `/v1/operacao/*`.
- O token do primeiro operador ainda vai para um arquivo 0600, justamente o incômodo que o PRD aponta no problema. Registrar isso como dívida aceita e documentar o prazo para apagar o arquivo.
- Ajustar o texto do RF10 no PRD à divisão entre `auditoria` e registro da operação, para o `/validar` não ler a spec como divergente.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md (linhas 75 a 80)
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/auditoria.ts e registro-acesso.ts, lidos para comparar

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-23 13:41:53 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: login (a identidade do operador passa pelas guardas globais, pelo contador de tentativas e pelo hash que o login da escola também usa). Para a escola, nenhum.
Rate limit: por IP. O desenho promete um limite por operador, mas nada consome esse limite.
Fila e prioridade: ok. Não há job novo, o panorama lê dado já consolidado e o expurgo das tabelas novas entra no `sistema.expurgar-acesso`, que já existe.
Concorrência: corrida na Tech Spec, seções 5 ("Nascimento", "Entrada", "Criar escola e convite") e 7c
Índice e paginação: ok (25 por página, `escola_id` nas subconsultas, PK `(escola_id, dia)` em `uso_infra_diario`; o `statement_timeout` vem do pool global em `packages/nucleo/src/db/banco.ts`)
Degradação de IA: não se aplica
Migration: compatível (só tabelas novas)
Métrica e alerta: ok (fora do caminho quente; não há alerta novo, então não há runbook a escrever)

Bloqueantes:

1. **Seção 7c ("Rate limit") e seção 2 (módulos): o limite por operador (`rl:op:{id}`) está declarado, mas nada o aplica.**
   - O erro: a seção 2 faz `rotaSemSessao` reconhecer `@RotaDeOperacao`. Com isso, a `GuardaDeLimite` global (`packages/nucleo/src/limite/guarda-limite.ts:50-60`) trata toda rota `/v1/operacao/*` como anônima e chama `consumirAnonima(ip)`, que conta só por IP no balde `rl:ip:{ip}`. Isso vale também para as rotas já autenticadas do painel. Como a `GuardaDeOperador` é do controller, ela roda depois das guardas globais e não tem como alimentar o limite com o `sub` do operador. A `GuardaDeLimite` nem aparece na tabela de módulos.
   - Correção exigida: dizer na spec onde `rl:op:{id}` é consumido. Por exemplo, a `GuardaDeLimite` reconhece `@RotaDeOperacao`, verifica o token de operador com `verificarTokenDeOperador` e conta por `sub`. Também dizer como ficam as rotas de entrada, MFA e convite do operador: contador por conta e, se houver limite por IP, que ele rebaixe em vez de recusar, como o `@LimiteQueRebaixa` do F1. Pôr `guarda-limite.ts` na seção 2 e um teste de integração que prove a recusa por operador, com o IP inalterado.

2. **Seção 5 ("Nascimento" e "Entrada") e seção 7c ("Corridas"): corridas não declaradas no código novo de autenticação do operador.**
   - O erro: a spec diz que o `MfaService` não serve e que tudo será reescrito para o operador, mas "Corridas" só cobre o refazer do convite e as restrições únicas. Ficam sem trava declarada:
     - o aceite do `ConviteOperador` feito duas vezes;
     - o mesmo código de recuperação usado em duas requisições simultâneas;
     - o reuso do passo TOTP (`mfaUltimoPasso`);
     - dois `mfa/configurar` simultâneos gravando segredos diferentes;
     - duas abas renovando a sessão com o mesmo refresh (`refreshHash` e `refreshHashAnterior`);
     - o uso único do desafio.
   - O teste do RF2 ("código de recuperação usado não vale de novo") é sequencial e não prova nenhuma dessas corridas.
   - Correção exigida: escrever na seção 5 a gravação condicional de cada uma, no padrão do F1 (`update … where usado_em is null …`, `delete … returning` no código de recuperação, `where mfa_ultimo_passo < $passo`, `where mfa_ativado_em is null`, rotação do refresh com `where refresh_hash = $atual`). Pôr na seção 10 os testes de concorrência correspondentes, com `Promise.all` de duas chamadas.

3. **Seção 5 ("Criar escola e convite") e seção 7c: clique duplo em `POST /v1/operacao/escolas/:id/convite-coordenacao` deixa dois convites valendo.**
   - O erro: o caso de uso reaproveitado do F1, `criarConviteDeCoordenador` (`apps/api/src/sessao/convite.service.ts:149-167`), faz `revogarConvitesDoUsuario` e depois `criarConvite` sem trava. Duas transações simultâneas não enxergam o insert uma da outra, e as duas gravam um convite ativo. No terminal isso era improvável; com um botão na tela, é o caso do clique duplo em aprovar. O mesmo vale para um refazer que corre junto de um novo convite para a mesma pessoa. A trava do refazer na seção 5 só protege o convite de origem.
   - Correção exigida: garantir no banco um só convite ativo por usuário. Pode ser um índice único parcial em `convite (usuario_id) where usado_em is null and revogado_em is null` (tabela pequena, migration compatível) ou um `select … for update` na linha do usuário. A segunda gravação responde com erro tipado (`CONFLITO`, "o convite mudou, atualize"). Somar um teste de integração com duas gerações simultâneas e com geração e refazer simultâneos.

4. **A Tech Spec não diz nada sobre a borda: a pergunta 1 do PRD ficou sem resposta.**
   - O erro: o PRD, seção 10, pergunta 1, mandou para a Tech Spec, com o `infra-guardian`, a decisão de onde o painel mora e se fica atrás de rede interna. A spec não trata disso. Hoje o `infra/Caddyfile` manda todo `handle` para `api-1` e `api-2`, então `/v1/operacao/*`, a única superfície que lê entre escolas, sairia pela mesma borda pública das escolas sem nenhuma restrição declarada.
   - Correção exigida: registrar a decisão na spec. No mínimo: no MVP local e sintético, fica exposto pela mesma borda, com o motivo; antes do staging, a borda restringe `/v1/operacao/*` e `/operacao` (lista de IPs permitidos, host separado ou rede interna), e isso fica escrito em `tasks/prd-fundacao-tecnica/notas-staging.md` como pendência. Se a restrição entrar já nesta A0, pôr um teste em `tools/ci/borda.test.ts`.

Recomendações:
- Seção 5 ("Entrada"): hoje `ContadorDeTentativas.chaveDe` fixa o prefixo `login:` no código. Pôr `contador-de-tentativas.ts` na seção 2 e dizer se o operador também separa a origem `conhecido/outro`. Sem essa separação, quem sabe o e-mail do operador segura a conta dele por até 15 min.
- Seção 5 ("Falhas"): dizer que banco fora na conferência da sessão responde 503 (`INDISPONIVEL_TENTE_DE_NOVO`), nunca 404. Senão a web lê a queda como sessão vencida e manda o operador de volta à entrada em laço. Dizer também o que o operador vê quando o Redis cai no meio do MFA: onde fica o uso único do desafio.
- Seção 5 ("Panorama"): declarar o desempate por `id` na ordenação por uso e por nome, para a paginação ficar estável, e pedir o `EXPLAIN` da consulta com as 30 escolas sintéticas do RF9 na tarefa.
- Clique duplo em "Nova rede" cria duas redes com o mesmo nome. Uma restrição única ou uma chave de idempotência resolve.

Arquivos de referência:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/prd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/guarda-limite.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/rota-sem-sessao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile`

## test-engineer · 1ª rodada · REPROVADO · 2026-09-23 13:42:17 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO

Cenários exigidos (por requisito do PRD):
- RF1: nenhuma rota cria operador. `ops:operador criar` grava `criadoPor` e `operador_criado` com quem rodou o comando. `desativar` corta a sessão.
- RF2: sem segundo fator, só a configuração responde. O código de recuperação vale uma vez. O código TOTP não vale duas vezes (`mfaUltimoPasso`). O desafio de operador e o de escola não servem um no lugar do outro.
- RF3: e-mail inexistente e senha errada dão a mesma resposta. Dez erros seguram só aquela conta. O contador `op:` não colide com o da escola quando o mesmo e-mail é operador e coordenador. Muitos logins do mesmo IP não seguram outro operador.
- RF4: nos dois sentidos, a resposta é igual à de uma rota inexistente. Isso vale também para o cookie de renovação cruzado e para um conjunto fechado de rotas públicas de operação.
- RF5: slug repetido e rede inexistente dão erro tipado. Duas criações do mesmo slug ao mesmo tempo.
- RF6: o link aparece uma vez, também depois de recarregar. O token antigo morre depois de refazer. Convite vencido pode ser refeito. Convite usado, revogado ou inexistente no refazer/revogar responde igual. Refazer ao mesmo tempo e clique duplo em "gerar convite" ao mesmo tempo.
- RF7: procurar, em todas as respostas, valores sentinela de pessoa.
- RF7 (contagem): professor com duas disciplinas na mesma turma conta uma vez. Aluno transferido ou desativado não conta. Ano letivo anterior não conta (virada de ano). Turma sem professor conta. Escola com zero aparece na lista. Os estados da escola, incluindo convite revogado sem refazer e convite aceito sem ativação.
- RF8: duas escolas com uso diferente. O mês soma requisições e jobs e pega o pico de bytes. Hoje fica de fora. Consolidação atrasada mostra a data do último dia fechado. Escola criada no fim do dia, com a borda de fuso. Virada de mês.
- RF9: 30 escolas, paginação no SQL, desempate estável, ordem por uso com empate em zero.
- RF10: auditoria de cada ação, com o autor vindo da sessão.
- RF11: guarda e marcador presos por teste de arquitetura.
- RF12: e2e em `chromebook` e `celular`, com axe e os quatro estados.

Cobertos (a Tech Spec garante):
- RF4 nas rotas de escola, com a lista gerada das rotas registradas (seção 6).
- RF11, que só `operacao/` importa o `PanoramaRepository` (seção 6), e a efetividade de tirar a `GuardaDeOperador` (seção 6).
- Login com e sem MFA, espera crescente, 30 min parado e 8 h, desativar operador corta a sessão na requisição seguinte (seção 10).
- Refazer simultâneo, com o update condicional desenhado (seções 5 e 10).
- e2e nos dois projetos com axe (seção 10).
- Nenhuma IA: sem teste de provedor. Adequado.

Bloqueantes:

1. **Seção 10: RF1 sem teste.** Faltam três provas:
   - teste de arquitetura: nenhuma rota registrada cria operador;
   - integração de `ops:operador criar`: `criadoPor` e `registro_operacao.operador_criado` saem com o `OPERADOR` do ambiente;
   - teste de `desativar`: apelido inexistente dá erro tipado.

2. **Seção 10: RF2 e RF3 incompletos.** A estratégia diz "login com e sem MFA", mas não prova o que o PRD pede. Exigido:
   - (a) código de recuperação usado uma vez é recusado na segunda;
   - (b) o mesmo código TOTP duas vezes é recusado;
   - (c) o desafio `configurar_mfa` não serve de bearer e não abre nenhuma rota do painel;
   - (d) as duas respostas, e-mail inexistente e senha errada, comparadas por status e por corpo;
   - (e) depois de 10 erros na conta X, a conta Y do mesmo IP entra;
   - (f) o mesmo e-mail com conta de coordenador e de operador: errar como operador não segura o login de escola, e o contrário também. Hoje a chave real é `login:{HMAC}:{origem}` (`apps/api/src/sessao/contador-de-tentativas.ts:153`), e a seção 5 afirma o prefixo `op:` sem prova.

3. **Seções 5 e 6: desafio e cookie cruzados sem teste.** A seção 5 reaproveita `segundo-fator.ts` e o mecanismo de desafio do F1. Exigido, nos dois sentidos, e cada tentativa deve responder como inexistente:
   - o desafio de escola em `/v1/operacao/sessao/mfa`;
   - o desafio de operador em `/v1/sessao/mfa`;
   - o `educa_sessao` em `/v1/operacao/sessao/renovar`;
   - o `turmma_operacao` na renovação de escola.

   É o caminho de escalar de coordenador para operador.

4. **Seção 6: o teste de arquitetura não fecha o risco que a seção 13 aponta.**
   - Exigido: (a) `@RotaDeOperacao`, na classe ou no método, só existe em `apps/api/src/operacao/`. Uma rota de escola marcada por engano sai das guardas de escola.
   - Exigido: (b) toda rota com o marcador tem a `GuardaDeOperador`, conferida por handler e não só por controller.
   - Exigido: (c) o prefixo `/v1/operacao` e o marcador andam juntos.
   - Exigido: (d) as rotas de operação sem sessão (`sessao/email`, `sessao/mfa`, `mfa/configurar`, `renovar`, `sair`, `convite/consultar`, `convite/aceitar`) formam uma lista fechada, escrita no teste. O teste de isolamento varre todas as outras. Sem essa lista, a frase "coordenador recebe 404 em toda rota `/v1/operacao/*`" é falsa para a rota de entrada, e o implementador vai criar uma exceção que cresce sem ninguém ver.
   - Exigido: (e) "igual a rota inexistente" compara status e corpo com uma rota de fato inexistente, não só o 404.

5. **Seção 10: RF5 sem teste pelo painel.**
   - Exigido: slug repetido via `POST /v1/operacao/escolas` devolve o código tipado de conflito, sem 500 e sem ecoar o slug.
   - Exigido: `redeId` inexistente devolve `NAO_ENCONTRADO`.
   - Exigido: dois POST com o mesmo slug em paralelo (`Promise.all`, conexões do pool) resultam em uma escola e um erro tipado.

6. **Seção 7c: clique duplo em "gerar convite" sem proteção e sem teste.**
   - `criarConviteDeCoordenador` (`apps/api/src/sessao/convite.service.ts:149-166`) revoga e insere sem trava.
   - `convite` não tem índice único parcial de um convite ativo por usuário (`packages/nucleo/src/db/schema/convite.ts:38-45`).
   - Dois POST `convite-coordenacao` em paralelo, ou um POST e um refazer em paralelo, podem deixar dois links valendo. Isso viola o RF6 e a regra 80, item 7.
   - Exigido: restrição no banco (único parcial em `(escola_id, usuario_id) where usado_em is null and revogado_em is null`) ou trava na linha do usuário.
   - Exigido: teste com duas chamadas em paralelo, conferindo exatamente um convite válido no banco e o outro link morto no `consultar`.

7. **Seção 10: o refazer simultâneo não está especificado como prova.**
   - Exigido: `Promise.all` em conexões distintas.
   - Exigido: exatamente um convite não revogado; o perdedor recebe o código tipado de "o convite mudou", sem 500.
   - Exigido: o token original e o do perdedor falham no `consultar`.
   - Exigido: nenhum convite órfão e uma só `convite.refeito` na `auditoria`.

   Casos de borda do mesmo fluxo:
   - convite vencido pode ser refeito e a escola volta a "pendente" (PRD, seção 7);
   - convite já usado, revogado, inexistente, e id de convite de outra natureza, no refazer e no revogar, respondem igual.

8. **Seção 10: RF6, "uma vez", sem prova.**
   - Exigido na integração: o token não aparece em nenhuma resposta GET do painel e o banco guarda só o `tokenHash`.
   - Exigido no e2e: recarregar a tela de convite não mostra o link.
[… 67 linhas cortadas]

## tenancy-guardian · 1ª rodada · REPROVADO · 2026-09-23 13:42:19 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: `operador`, `codigo_recuperacao_operador`, `convite_operador`, `sessao_operador` e `registro_operacao` (seções 3 e 11). A falta de `escolaId` está declarada: é dado da equipe, não da escola, e a alternativa recusada está escrita. Isso é aceitável. Nenhuma delas varia por período, então não precisam de `anoLetivoId`. As tabelas de escola lidas pelo panorama também foram conferidas: `escola`, `rede`, `turma`, `vinculo`, `usuario`, `convite` e `uso_infra_diario`.

Queries verificadas: `panoramaDasEscolas`, `usoDasEscolas` e `redes` (seção 6). Também conferi o que as rotas do painel alcançam por baixo, no código do F1:
- `RedeEEscolaRepository.criarRede` e `criarEscola`, com `@SemEscopo` em `apps/api/src/ops/escola.repository.ts:10,17`.
- `ResolucaoDeTenantRepository.escolaPorSlug`, `contaParaConvite` e `escolaDoConviteParaOperador`, em `apps/api/src/sessao/resolucao-de-tenant.repository.ts:433,448,461`.
- `ConviteRepository` dentro do contexto aberto por `criarConviteDeCoordenador` e `revogarConvitePeloOperador`.
- `GuardaDeAutenticacao`, `GuardaDeLimite`, `GuardaDeSessao` e `GuardaDePermissao`, que se desligam quando `rotaSemSessao` devolve verdadeiro.

Teste de isolamento: presente e efetivo no que cobre. Sem a `GuardaDeOperador`, a sessão de escola alcança `/v1/operacao/*` e o teste fica vermelho. O panorama com duas escolas também quebra sem o agrupamento por `escola_id`. Mas o teste não cobre as rotas anônimas do operador nem o marcador aplicado a um método (bloqueante 2).

Bloqueantes:

1. **Seção 6 e seção 11 (regra 10, item 9): o inventário das consultas sem escopo está incompleto.** A spec diz que as únicas são as três do `PanoramaRepository`, e a tabela da seção 11 diz "desvio: nenhum". Isso é falso, e o desenho fica implícito numa regra com veto. As rotas `POST /redes`, `POST /escolas`, `/escolas/:id/convite-coordenacao` e `/convites/:id/refazer|revogar` passam a expor por HTTP vários `@SemEscopo` que hoje servem só ao terminal:
   - `criarRede` e `criarEscola`: a justificativa diz "só o comando do operador cria".
   - `escolaDoConviteParaOperador`: a justificativa diz "rotina do operador (ops:revogar-convite)".
   - `contaParaConvite`.
   - `escolaPorSlug`, ou um novo `escolaPorId`, porque a rota recebe o id da escola e `criarConviteDeCoordenador` recebe o slug.
   - A busca do convite de origem no `refazerConviteDeCoordenador(conviteId)`, que é nova.
   - `estadoDoConviteDaEscola` no `convite.service.ts`, que é leitura fora do módulo do painel e contradiz o RF11.

   **Correção exigida:** a seção 6 lista toda consulta sem escopo que uma rota `/v1/operacao/*` alcança, com repository, método e justificativa. As justificativas que citam "só o comando" são reescritas para dizer "comando ou painel do operador". A spec diz como o `:id` da URL vira escola: qual método, e que escola inexistente responde `NAO_ENCONTRADO`. O estado do convite sai do `convite.service` e fica no `PanoramaRepository`, ou fica declarado lá como consulta sem escopo com justificativa. A linha da regra 10, item 9 na seção 11 passa a registrar o desvio.

2. **Seções 1, 2, 6 e 13: a `@RotaDeOperacao` desliga as quatro guardas globais, e o desenho não prende essa marcação à guarda de forma que ela não possa ser esquecida.** A `rotaSemSessao` (`packages/nucleo/src/identidade/rota-sem-sessao.ts`) lê a marcação no método e na classe, mas o teste de arquitetura descrito só confere o controller dentro de `operacao/`. Três lacunas:
   - A marcação num método de um controller de escola abre a rota sem guarda nenhuma.
   - As rotas do operador que não podem exigir token de operador (`sessao/email`, `mfa`, `mfa/configurar`, `renovar`, `sair`, `convite/consultar` e `aceitar`) não têm marcação definida. O teste "todo controller tem a guarda" então precisa de uma exceção que a spec não escreve, e essa exceção é o furo.
   - O RF4 promete 404 em toda rota do painel com sessão de escola, mas não diz o que a rota de login do operador responde a um bearer de escola.

   **Correção exigida:** a `@RotaDeOperacao` aplica a `GuardaDeOperador` ela mesma, com `applyDecorators` e `UseGuards`, para que marcar sem proteger seja impossível. O teste de arquitetura prova que a marcação só aparece em `apps/api/src/operacao/`, varrendo método e classe. As rotas anônimas do operador ficam numa lista fechada, escrita na spec e no teste, com uma marcação própria. O teste de isolamento cobre essas rotas: um bearer de escola ou um desafio de escola nunca produz sessão de operador, e a resposta fica definida.

3. **Seção 4 e seção 7 (caso de borda "operador fecha a aba" e "convite vencido"): o refazer não pode ser executado como está desenhado.** `POST /convites/:id/refazer` exige o id do convite, mas o DTO do panorama (`id, nome, slug, rede, estado, contagens, uso`) não o devolve. Depois de fechar a aba, o operador não tem de onde tirar o id. Qualquer remendo muda a leitura sem escopo, e é por isso que o ponto é deste auditor.

   **Correção exigida:** escolher entre duas saídas e escrever na spec.
   - O panorama devolve o id do último convite de coordenação da escola, que é UUID e não é dado de pessoa.
   - O refazer passa a ser `/escolas/:id/convite-coordenacao/refazer`, com a escola resolvida pelo método declarado no bloqueante 1.

   Nos dois casos, convite já usado responde `NAO_ENCONTRADO`, e a disputa entre dois refazer responde com erro tipado (`CONFLITO`).

Recomendações:
- A seção 3 deve dizer que o `id` das tabelas novas é UUID gerado no banco, como no resto do schema.
- O desafio de login do operador deve ter `typ` próprio, e não `desafio+jwt`, com recusa cruzada testada nos dois sentidos. Hoje a troca falharia só porque a busca por id não acha ninguém.
- O corpo do 404 da `GuardaDeOperador` deve ser comparado byte a byte com o de uma rota inexistente de verdade no teste do RF4.
- O `InterceptorDeUso` e a `GuardaDeLimite` tratam a rota marcada como anônima. Isso põe a contagem de uso e o limite no IP, não em `rl:op:{id}` como diz a seção 7c. É ponto para o `infra-guardian`, mas o desenho deve dizer quem aplica o limite do operador.
- O expurgo de `registro_operacao` pelo `sistema.expurgar-acesso` apaga numa tabela sem escola. Vale declarar a consulta e a justificativa dela junto das outras.
- O título do teste em `apps/api/src/ops/escola.repository.test.ts` ("criarRede e criarEscola não chegam a controller nenhum") deixa de ser verdadeiro e deve ser reescrito junto da lista `IMPORTADORES_PERMITIDOS_DO_COMANDO`.

Arquivos lidos: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/prd.md` e `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`. Do F1 conferi `apps/api/src/sessao/convite.service.ts`, `apps/api/src/ops/escola.ts`, `apps/api/src/ops/escola.repository.ts`, `apps/api/src/sessao/resolucao-de-tenant.repository.ts`, `packages/nucleo/src/identidade/rota-sem-sessao.ts`, as quatro guardas globais e `apps/api/test/arquitetura.test.ts`.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-09-23 13:42:22 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Esta foi uma revisão do desenho em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`, contra o PRD e contra `docs/interface.md` (seções 5a, 6, 7, 9, 11.1 e 11.8). Também conferi o que já existe em `apps/web`, porque a spec diz que usa o e2e do F1 como rede de segurança.

Estados: o texto diz "Quatro estados" de forma genérica. Faltam três coisas:
- o estado de erro quando o próprio chunk do painel não carrega;
- o estado de sessão vencida (ver bloqueante 1);
- o texto dos estados vazios (ver recomendações).

Acessibilidade: a spec declara teclado, toque e axe nos dois projetos, e o estado da escola aparece em texto, com a cor só de reforço. Os detalhes da tabela ordenável, do diálogo e do "Copiado" não estão escritos (ver recomendações).

Chromebook fraco: a meta de "a lista abre em até 2 s com CPU 4× e 3G" e a paginação de 25 escolas estão boas, e não é preciso virtualizar. Mas a promessa de que a web da escola não baixa o código do painel não tem nenhum teste que a prove (bloqueante 4).

Celular: a spec cita 360 px e o projeto `celular`, mas não diz o que acontece com uma tabela de cerca de nove colunas abaixo de 768 px (bloqueante 5).

Ação oficial protegida: não. Não há nota em jogo aqui, mas revogar e refazer o convite derruba um link já entregue ao cliente, e a spec não põe revisão antes disso (bloqueante 2).

Não se aplicam: o seletor de escola (o painel não é área de professor) e o feed de agentes (não há agente no painel).

Bloqueantes:

1. **Seção 5 (Entrada) e seção 9: sessão vencida responde 404, e a web não consegue distinguir isso de um id que não existe.**
   - **O problema:** toda falha de sessão do operador (30 min parado, 8 h, sessão encerrada, operador desativado) responde 404, "e a web volta para a entrada". No painel, 404 também é a resposta legítima para um id inexistente, como em `POST /escolas/:id/convite-coordenacao`. Com isso, ou o cliente desloga o operador por engano, ou mostra "não encontrado" quando na verdade a sessão caiu.
   - **O que mais piora:** o redirecionamento sem aviso apaga o diálogo "Nova escola" que estava sendo preenchido. O F1 resolveu esse caso com o `LoginPorCima`, e a spec não diz que faz o mesmo aqui.
   - **Correção exigida:**
     - Definir um sinal que o cliente consiga separar. Por exemplo: 401 tipado só quando o bearer tem `typ` de operador, mantendo 404 para qualquer outra credencial, o que continua cumprindo o RF4.
     - Tentar `/sessao/renovar` antes de mandar para a entrada.
     - Mostrar uma mensagem que diga o que fazer, como "Sua sessão terminou por inatividade. Entre de novo para continuar".
     - Dizer se o diálogo aberto é preservado.
     - Colocar o caso em teste de integração e no e2e.

2. **Seção 9 (Convite da coordenação): o fluxo não mostra o que vai acontecer antes da ação.** A spec só prevê o aviso "este link aparece uma vez" ao lado do link, depois que ele já foi gerado. Correção exigida:
   - **Antes de gerar:** mostrar um resumo com escola, rede, nome e e-mail da coordenadora e o aviso de que o link aparece uma única vez.
   - **Ao revogar ou refazer:** abrir um diálogo de confirmação (botão `perigo`, conforme a 11.1) que diga "o link enviado antes deixa de valer".
   - **Ao fechar o diálogo com o link ainda na tela:** perguntar se ele já foi copiado, porque o PRD, seção 7, registra justamente o caso de fechar sem copiar.
   - **Resposta "o convite mudou, atualize":** dizer como a tela reage. Ela deve recarregar o estado da escola sem erro cru.
   - Tudo isso precisa estar no e2e.

3. **Seção 9 e seção 13 (tokens da D72 entrando no `apps/web`, com efeito nas telas do F1): a migração das telas do F1 não está especificada, e a rede de segurança citada não protege.**
   - **Por que o e2e não basta:** a 9.9 zera a paleta e manda a `slate`/`blue` "dar lugar". São 23 arquivos do F1 com classes `slate`, `blue`, `amber`, `red` e `emerald`. Quando uma classe fica fora da paleta, ela não gera CSS nenhum, e o axe não percebe. O próprio `apps/web/src/estilos.test.ts` explica isso no comentário do topo.
   - **As guardas atuais vão quebrar:** `e2e/casca.spec.ts:286-298` exige `#1d4ed8` e as classes `amber` no CSS servido. `apps/web/src/estilos.css` usa o foco de 3 px em `blue-700` e o fundo do diálogo em `#0f172abf`.
   - **Correção exigida:** a spec precisa trazer:
     - a tabela de troca das cores do F1 para os tokens da D72: `amber` para `pendente`/`pendente-cx`, `red` para `erro`/`erro-cx`, `slate` para `tinta`/`apoio`/`sutil`/`linha`/`borda-campo`, e o foco para 2 px em `noite` (ou `caramelo-noite` sobre preto);
     - a reescrita das duas guardas para os tokens novos;
     - o `estilos.test.ts` passando a reprovar qualquer família de fábrica;
     - o e2e reprovando `color-mix(` no CSS servido, como a 9.9 pede. Os diálogos Nova rede e Nova escola, vindos de peça shadcn, costumam trazer `bg-black/80`, que some no Chrome 109.

4. **Seção 9 (chunk sob demanda): falta a prova e falta o estado de erro.**
   - **Sem prova:** o orçamento de hoje soma todo o JS do build (`tools/ci/tamanho-web.test.ts:55`, `apps/web/dist/assets/*.js`, 150 kB). Assim, o chunk do painel conta no mesmo limite, e nada prova que a entrada da escola não importa `apps/web/src/operacao/`.
   - **Sem estado de erro:** num 3G, o `import()` pode falhar, e a spec não define o que a tela mostra.
   - **Correção exigida:**
     - separar o orçamento entre a entrada e os chunks;
     - criar um teste que reprove qualquer import de `operacao/` a partir da entrada da escola;
     - usar o `EstadoCarregando` como fallback do `Suspense`;
     - pôr uma fronteira de erro com "Não foi possível abrir o painel. Tente de novo", com botão.

5. **Seção 9 (Escolas e Uso em 360 px): a tabela não tem forma definida no celular.**
   - **O problema:** a tabela terá cerca de nove colunas: rede, nome, endereço, estado, três contagens, uso do dia e uso do mês. A 11.1 manda "tabela vira lista" abaixo de 768 px, e a regra 50, item 2a, admite a lista ou a rolagem dentro do próprio contêiner. A spec não escolhe. Também não diz como a ordenação funciona quando não há cabeçalho de coluna para clicar.
   - **Correção exigida:**
     - Escolher entre a lista e a rolagem interna.
     - Definir o controle de ordenação no celular: um seletor com rótulo, com alvo de 44 px.
     - O e2e `celular` precisa afirmar que não há rolagem horizontal na página.

Recomendações:
- **Texto dos estados vazios:** a spec não escreve nenhum. Três casos precisam de texto:
  - nenhuma escola: "Crie a primeira rede para cadastrar uma escola";
  - Nova escola sem rede criada: o diálogo leva direto a "Nova rede";
  - Uso antes do primeiro dia consolidado: dizer quando o número aparece.
- **Acessibilidade escrita na spec:**
  - `aria-sort` e botão no cabeçalho ordenável;
  - foco preso no diálogo e devolvido ao botão que o abriu;
  - "Copiado" anunciado em região viva, com o campo selecionável quando o `navigator.clipboard` não estiver disponível;
  - um `document.title` por rota e o `<h1>` só para leitor de tela (padrão de espaço da D72).
- **Casca da operação:** listar os itens da lateral (Escolas, Uso e Sair, a um clique, pela D59), o comportamento dela como gaveta no celular, e as cores e o contraste da faixa "Operação Turmma", já que laranja não pode ser texto sobre claro.
- **Formato local:** datas em dd/mm/aaaa ("Último dia fechado: 22/09/2026") e bytes com vírgula decimal (KB, MB, GB, com `Intl`). Não deixar "jobs" nem "requisições" crus sem uma explicação curta.
- **Contradição interna na spec:** a seção 9 cria um `BroadcastChannel` próprio, e a seção 13 adia para a A1 a pendência do `BroadcastChannel` do F1. É preciso dizer se o canal da A0 herda aquele defeito. Também vale dizer se a web avisa antes dos 30 min de inatividade, como faz o `apps/web/src/sessao/inatividade.ts`.
- **Fonte dos tokens:** dizer que ela é a 9.9, e não o `mockups/src/index.css` inteiro. Esse arquivo traz a rampa `neutral`, Inter e Quicksand, que a 9.1 e a seção 7 excluem.
- **Fustat:** dizer se o arquivo `woff2` da Fustat entra. Os SVGs da marca são em curvas, sem texto.
- **`docs/interface.md` desatualizado:** as seções 7 e 12 ainda dizem que os tokens entram na primeira tarefa da A1 e que a escola nasce pelo `ops:escola`. Atualizar para a A0 e a D76.
- **Pergunta aberta 1 do PRD:** a spec ainda não fixou em que endereço o painel fica nem se, em produção, ele fica atrás de rede interna. Com o painel na mesma web, o nome do chunk `/operacao` fica visível no JS da escola. Não vaza dado, mas convém registrar isso com o `infra-guardian`.

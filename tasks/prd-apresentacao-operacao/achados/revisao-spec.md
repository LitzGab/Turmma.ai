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

## privacy-guardian · 2ª rodada · REPROVADO · 2026-09-23 13:49:54 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO

**Campos pessoais tocados:** a conta do operador (apelido, nome, e-mail, hash de senha, segredo TOTP cifrado, HMAC dos códigos de recuperação), o convite de operador (hash do token e datas), a sessão de operador (horários e hash do refresh, sem IP), `AcessoOperacao` (evento, IP, data e `operadorId`) e `AuditoriaOperacao` (autor, ação, operador alvo, data). Estão na Tech Spec, seção 3.

**Fora da tabela de dados do docs/lgpd.md:** nenhuma tabela ficou de fora. As linhas 76 a 80 de `docs/lgpd.md` cobrem conta, HMAC dos códigos, convite, sessão, acesso e auditoria da operação. Falta uma coisa pequena, deixada como recomendação: o cookie de dispositivo com chave própria do operador (seção 5, "Entrada"). A linha dele no mapa lista só aluno, professor e coordenador, e diz "nenhum outro uso".

**Autorização por objeto:** ok. Não há objeto de escola. Pelo desenho da seção 6, credencial de escola em rota de operação, e credencial de operador em rota de escola, respondem igual a uma rota inexistente, em status e corpo. A varredura usa as rotas registradas, e a efetividade é provada tirando a guarda de um handler.

**Logs:** limpos. O log de `entrada_falha` leva só evento e ids, sem e-mail, senha, token ou código (seções 5 e 7).

**Auditoria:** presente.
- `AuditoriaOperacao` guarda criar e desativar operador, configurar o segundo fator e gerar ou revogar convite, com retenção de vigência + 5 anos e fora do expurgo.
- `AcessoOperacao` guarda entrada, falha de entrada e saída, com IP, por 6 meses, sem o e-mail digitado.
- A separação exigida na rodada 1 foi feita (seções 3 e 7).

**Envio externo:** nenhum.

**Seed/fixture:** sintético. O MVP roda local, e a borda fica restrita antes do staging, com a pendência registrada.

**Confirmação das correções da rodada 1:**

| Correção exigida | Situação |
|---|---|
| Auditoria da operação (5 anos) separada do acesso (6 meses, IP, sem e-mail) | feita |
| Dado pessoal apagado ao desativar, apelido mantido | feita (seção 3; `docs/lgpd.md` linha 76) |
| Linha do HMAC dos códigos | feita (linha 76) |
| Linhas de acesso e de auditoria da operação | feitas (linhas 79 e 80) |
| Expurgo com dono (`sistema.expurgar-acesso`) | feita (seções 2 e 7; seção 11, regra 10, item 9) |
| `no-store` e contrato estrito | feitos (seção 4) |
| Retenção alinhada entre spec e mapa | incompleta (bloqueante 1) |
| Testes de registros e de expurgo na seção 10 | presentes, mas não provam a desativação nem os prazos (bloqueante 2) |

**Bloqueantes:**

1. **Retenção de convite vencido e de sessão expirada sem prazo** (`tasks/prd-apresentacao-operacao/techspec.md:138` e `docs/lgpd.md:77-78`).
   - O que está errado: a seção 7 diz "convite e sessão: 30 dias após usar, revogar ou encerrar". O convite que vence sem ser usado nem revogado não tem prazo, e o mapa (linha 77) diz "ou vencer". A sessão que só chega às 8 h ou aos 30 min parados pode ficar sem `encerradaEm`. Nem a spec nem a linha 78 do mapa dão prazo a ela. O F1 cobre esse caso para a sessão de escola ("ou, sem encerramento, após expirar").
   - Correção exigida:
     - Na seção 7, escrever por tabela: convite 30 dias após usar, revogar ou vencer; sessão 30 dias após encerrar ou, sem encerramento, após `expiraEm`.
     - Corrigir a linha 78 do mapa igual.
     - Trocar "as três primeiras" por nome de tabela: `ConviteOperador`, `SessaoOperador` e `AcessoOperacao` são apagadas; `AuditoriaOperacao` e a conta nunca passam pelo expurgo.
     - Dizer se desativar revoga o convite pendente e encerra as sessões do operador na mesma transação.

2. **A desativação e o expurgo não têm teste que prove a regra de dado pessoal** (`tasks/prd-apresentacao-operacao/techspec.md:184`).
   - O que está errado: a seção 10 testa "desativar inexistente" e "desativar que corta a sessão", mas nenhum teste mostra que desativar apaga nome, e-mail, senha, segredo e códigos na mesma transação e mantém o apelido. "Expurgo nos prazos" não diz o que prova.
   - Correção exigida, na linha de integração da seção 10:
     - Depois de `desativar`, a linha do operador tem só id, apelido e datas, e `CodigoRecuperacaoOperador` fica vazia.
     - Uma falha no meio da desativação não deixa estado parcial.
     - A `AuditoriaOperacao` continua citando o apelido.
     - Expurgo, com o relógio controlado, um caso por prazo: convite usado, revogado e vencido, com 29 e 31 dias; sessão encerrada e sessão só expirada; acesso com 6 meses menos um dia e mais um dia.
     - `AuditoriaOperacao` intacta depois do expurgo, com qualquer idade.

**Recomendações:**
- Pôr no mapa da LGPD o uso do cookie de dispositivo pelo operador (seção 5, "Entrada"), ou tirar esse uso da spec.
- Na seção 10:
  - testar que `entrada_falha` não grava o e-mail, procurando um e-mail sentinela em `AcessoOperacao` e no log;
  - testar o `Cache-Control: no-store` nas respostas de `mfa/configurar`, `mfa` e `aceitar`;
  - testar que o contrato estrito rejeita campo a mais.
- Atualizar a seção 8 do PRD, que ainda marca "a ajustar" e "**não**" para linhas que já estão no mapa.
- Dizer qual comando revoga o convite de operador (`convite_operador.revogado` está no domínio da auditoria, mas a seção 2 só lista `criar`, `desativar` e `convite`).
- Registrar em RF7 e na seção 10 que o autor da `AuditoriaOperacao` vem do `OPERADOR` do comando, e não da sessão: "com o operador da sessão" só vale para `AcessoOperacao` e para `mfa_configurado`.

A pergunta de fechamento não se aplica a aluno: esta spec não toca dado de aluno. Para o titular operador, o desenho responde o que guarda e onde, e não há envio a terceiro.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md (linhas 75 a 80)

## test-engineer · 2ª rodada · REPROVADO · 2026-09-23 13:50:11 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **RF1:** nenhuma rota cria operador. O autor fica registrado, com o caso `bootstrap`. Desativar um operador inexistente dá erro tipado. Desativar corta a sessão.
- **RF2:** o convite em quatro estados (usado, vencido, revogado, inexistente) responde igual. Dois aceites simultâneos gravam uma senha só.
- **RF3:** código TOTP e código de recuperação valem uma vez, em sequência e em paralelo. O desafio não serve de bearer e vale uma vez.
- **RF4:** e-mail inexistente e senha errada dão o mesmo status e o mesmo corpo. Depois de 10 erros na conta X, a conta Y do mesmo IP entra. O contador do operador e o da escola não colidem, nos dois sentidos.
- **RF5:** a sessão acaba após 30 min parada e após 8 h. Duas abas renovam em paralelo. Reusar o refresh anterior encerra a sessão. Banco fora dá 503.
- **RF6:** varredura das rotas nos dois sentidos, comparando com uma rota inexistente. A efetividade é provada tirando a guarda de um handler.
- **RF7:** cada evento vai para o registro certo, com o operador da sessão.
- **RF8 e RF9:** guardas de estilo, e2e nos projetos `chromebook` e `celular` com axe, e o teste do chunk.

**Cobertos:** os bloqueantes 1, 2, 3 e 14 da rodada 1 estão na seção 10 (linha 184). O 4 está na seção 6 (linhas 116-128), com a lista fechada das sete rotas de entrada, a guarda conferida no handler resolvido e o 404 comparado com rota inexistente. As duas recomendações também foram atendidas: o reuso do refresh encerra a sessão (seção 10) e o teste de que a entrada da escola não importa `operacao/` está na seção 9 (linha 177).

**Bloqueantes:**

1. **O desafio vale uma vez, mas nenhum teste prova isso** (`techspec.md:90`, `techspec.md:184`).
   - A trava por `jti` com `SET NX` e a recusa com 503 quando o Redis cai estão declaradas, mas a seção 10 só testa que o desafio não serve de bearer. A rodada 1 exigiu `Promise.all` também para o uso único do desafio.
   - Exigido: o mesmo desafio em duas chamadas `/sessao/mfa` paralelas, com dois códigos de recuperação válidos diferentes, cria uma sessão só. O mesmo desafio reenviado depois do sucesso é recusado. Com o Redis fora, o desafio é recusado com 503, e não aceito.

2. **Só a senha basta para trocar o segundo fator, e nada testa isso** (`techspec.md:62-63`, `techspec.md:85`, PRD RF3 "sempre").
   - `/sessao/email` devolve um desafio só com a senha. Esse desafio pode ir para `/mfa/configurar` de uma conta que já tem MFA ativo. A única defesa é o `where mfa_ativado_em is null`, e o teste de "configurar em duas abas" não a exercita.
   - Há também um caso não declarado. Uma conta aceitou o convite e não terminou o MFA. Quem souber só a senha recebe `configurar_mfa`, registra o próprio autenticador e entra sem segundo fator, contra o "sempre" do RF3.
   - Exigido, em teste: um desafio de senha em `/mfa/configurar` de conta com MFA ativo não muda o segredo nem devolve códigos. Um desafio `configurar_mfa` levado a `/sessao/mfa`, e o contrário, é recusado.
   - Exigido, na spec: declarar se `configurar_mfa` por `/sessao/email` só vale enquanto o convite estiver dentro das 72 h, ou se exige novo convite. E testar o que for decidido.

3. **Nenhum teste prova que a renovação respeita os 30 min e as 8 h** (`techspec.md:87-89`, `techspec.md:96-102`, `techspec.md:171`, `techspec.md:184`).
   - O frontend renova sozinho ao receber 401. Se `/renovar` não conferir `ultimoUsoEm`, as 8 h e o `desativadoEm`, o limite de 30 min parado some em silêncio. O teste "sessão: 30 min, 8 h" não diz se passa pela renovação.
   - A spec também não diz o que recebe um acesso de 10 min já vencido com a sessão viva. Se receber 404, e não 401, a renovação normal nunca acontece.
   - Exigido: `/renovar` depois de 30 min parado, depois de 8 h, depois de sair e com o operador desativado é recusado. Acesso vencido com sessão viva dá 401 `SESSAO_ENCERRADA` (ou um código próprio), renova e a ação seguinte passa.

4. **O teste do sentido operador para escola está escrito de um jeito que não tem como passar** (`techspec.md:127`).
   - "Token, desafio e cookie de operador em toda rota de escola: o mesmo" pede resposta igual a rota inexistente também nas rotas anônimas da escola (login, MFA da escola, renovação). Essas rotas existem e respondem com o erro delas. O teste vai ser afrouxado na execução.
   - Exigido: repetir aqui a ressalva da linha 126. Nas rotas de escola com sessão, a resposta é igual a rota inexistente. Nas rotas de entrada da escola, desafio e cookie de operador nunca produzem sessão nem desafio de escola.

5. **O prefixo só é conferido num sentido** (`techspec.md:118-119`).
   - A rodada 1 exigiu prefixo `/v1/operacao` e marcador juntos. O teste só garante que todo caminho `/v1/operacao` tem marcador. Uma rota `@RotaDeOperacao` em `apps/api/src/operacao/` montada fora do prefixo escaparia das guardas de escola.
   - Exigido: toda rota com qualquer um dos dois marcadores tem o caminho sob `/v1/operacao`.

6. **A regra nova do `OPERADOR` em todo `ops:*` não tem teste** (`techspec.md:76-77`, `techspec.md:184`).
   - Os testes cobrem "bootstrap, autor", mas não a conferência que passa a valer em todo `ops:*`.
   - Exigido: com um operador ativo, `OPERADOR` com apelido inexistente ou de operador desativado é recusado num `ops:*` que não seja `criar`. Um `criar` com autor `bootstrap` quando já existe operador ativo é recusado.

**Recomendações:**
- Declarar o que o `ops:operador convite` faz quando já há convite pendente (revoga na mesma transação, ou recusa) e testar: o link antigo passa a responder igual a revogado, e o único parcial (`techspec.md:43`) aparece no teste.
- Deixar explícito que "quatro estados iguais" vale para `/convite/consultar` e para `/convite/aceitar`.
- Testar que a desativação apaga nome, e-mail, senha, segredo e códigos na mesma transação e mantém o apelido (`techspec.md:52-54`).
- Testar que `entrada_falha` não guarda o e-mail digitado: procurar um e-mail sentinela nas linhas de `AcessoOperacao` e no log (`techspec.md:94`).
- Testar a borda da gravação de `ultimoUsoEm` no máximo uma vez por minuto: uso aos 29 min mantém a sessão viva aos 31 (`techspec.md:102`).
- Declarar qual tentativa cai quando duas abas configuram o MFA em paralelo e checar o erro tipado "configure de novo" na aba que perde (`techspec.md:85-86`).

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/prd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/revisao-spec.md`

## infra-guardian · 2ª rodada · REPROVADO · 2026-09-23 13:50:24 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: login (guardas globais, `GuardaDeLimite` e `ContadorDeTentativas` compartilhados com o login da escola)
Rate limit: ausente em quatro das sete rotas de entrada (ver bloqueante)
Fila e prioridade: ok (nada vai para fila, e nada demorado roda dentro do request)
Concorrência: protegida (seis travas condicionais na seção 5 e único parcial em `ConviteOperador`, com `Promise.all` na seção 10)
Índice e paginação: ok (tabelas da equipe, sem crescer com aluno; buscas por PK, `tokenHash`, `email` único e `apelido` único)
Degradação de IA: não se aplica
Migration: compatível (só tabelas novas, uma migration)
Métrica e alerta: ok (`entrada_falha` por minuto; nenhum alerta novo, então nenhum runbook exigido)

**Bloqueantes:**

`tasks/prd-apresentacao-operacao/techspec.md:104-106` (seção 5, "Limite"), repetido na linha 24 (seção 2) e na linha 150 (seção 7c).
- **O problema:** a spec aplica "rebaixa por IP, e quem recusa é o contador por conta" a todas as sete rotas `@EntradaDeOperacao`. Em `packages/nucleo/src/limite/guarda-limite.ts:51-55`, a rota que rebaixa nunca é recusada: a guarda só marca a requisição (`ACIMA_DO_LIMITE_DO_IP`), e quem age sobre essa marca é o semáforo do hash de senha. Quatro rotas não têm contador por conta nem hash:
  - `convite/consultar`
  - `mfa/configurar`
  - `sessao/renovar`
  - `sessao/sair`

  Essas quatro ficam anônimas e sem limite nenhum, lendo o mesmo Postgres das escolas às 10h. No F1, as rotas equivalentes usam `@RotaAnonima()` com o limite anônimo por IP (`apps/api/src/sessao/convite.controller.ts:19`, `renovacao.controller.ts:11`, `mfa.controller.ts:22`). Só `login-email.controller.ts:12` rebaixa.
- **Correção exigida:**
  - O rebaixamento fica só nas rotas que avaliam senha (`sessao/email` e `convite/aceitar`). A spec declara que elas entram no mesmo semáforo do hash, ou num balde próprio.
  - `sessao/mfa` rebaixa ou recusa pelo contador por `operador.id`, o que já está declarado.
  - `convite/consultar`, `mfa/configurar`, `sessao/renovar` e `sessao/sair` usam o limite anônimo por IP recusável (`rl:ip`), como no F1.
  - A seção 10 ganha um teste: rajada acima do limite em `renovar` e em `convite/consultar` recebe 429.

**Conferência da rodada 1:**
- **Bloqueante 1, `rl:op` sem quem consome:** feito. A `GuardaDeLimite` verifica o token de operador e conta `rl:op:{sub}` (seção 5, "Limite"). O teste "`rl:op` recusa com o IP igual" está na seção 10. `guarda-limite.ts` e `contador-de-tentativas.ts` estão na seção 2.
- **Bloqueante 2, corridas do login e do MFA:** feito. As travas cobrem aceite, código de recuperação, passo do TOTP, `configurar`, rotação do refresh e `jti` com `SET NX`, todas com `returning` (seção 5). Os testes em paralelo estão na seção 10.
- **Bloqueante 3, convite da coordenação:** transferido para a A0b. Não foi auditado aqui.
- **Bloqueante 4, borda:** feito. O motivo do MVP local está na seção 5, e a pendência está em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-fundacao-tecnica/notas-staging.md:68-71`, com teste em `tools/ci/borda.test.ts`.
- **Recomendações pedidas:**
  - Prefixo `login-op:` e origem `conhecido`/`outro`: feito. O cookie de dispositivo tem chave própria e há teste cruzado entre o login da escola e o do operador.
  - 503 tipado com o banco fora: feito (seção 5, "Conferência da sessão").
  - Redis fora no MFA: feito. O desafio recusa com 503, e a seção 7c declara isso.

**Recomendações:**
- **Seção 5, "Limite":** dizer o que a `GuardaDeLimite` faz numa rota `@RotaDeOperacao` quando a credencial não é de operador: token de escola, desafio ou nenhum token. Ela não pode responder 401, nem contar pelo IP de um jeito que diferencie a rota de uma inexistente. O teste da seção 6 pega o 401, mas não pega 429 em rajada. Declarar também de onde vem o valor do limite de `rl:op`.
- **Seção 5, "configurar":** o `configurar` repetido em duas abas precisa trocar os códigos de recuperação na mesma transação do segredo (apagar e inserir). Sem isso, os códigos da aba abandonada continuam valendo.
- **Seção 7c:** com o Redis fora, o operador não entra, porque o desafio recusa com 503. É justamente a hora de um incidente. Anotar no `docs/runbook.md` que os comandos `ops:*` são o caminho enquanto o Redis não volta.

Arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/guarda-limite.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-fundacao-tecnica/notas-staging.md`

## frontend-reviewer · 2ª rodada · AJUSTES NECESSÁRIOS · 2026-09-23 13:50:46 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Estados: ok. Carregando vem do fallback `EstadoCarregando`. Erro de chunk vem da fronteira de erro com botão ("Não foi possível abrir o painel. Tente de novo"). Sessão encerrada tem 401 próprio e mensagem que diz o que fazer. O dado é a casca com `/eu`, e o RF9 cobra os quatro estados. Com o painel indo para a A0b, esta spec não tem estado vazio. Uma lacuna menor está nas recomendações: a spec não diz que texto aparece quando o banco cai (503).

Acessibilidade: ok no desenho, na seção 9 da Tech Spec:
- foco de 2 px em `noite`, com 2 px de afastamento, e `caramelo-noite` sobre preto;
- `document.title` por rota e `<h1>` para leitor de tela;
- "Copiar" anunciado em região viva, com campo selecionável;
- faixa em `noite` com texto branco (19,4:1);
- axe nos dois projetos (seção 10).

Chromebook fraco: ok.
- A entrada tem orçamento separado, 150 kB em brotli, e o chunk da operação tem teto próprio.
- Um teste reprova qualquer import de `apps/web/src/operacao/` feito a partir da entrada da escola.
- A Fustat não é baixada: o logotipo sai dos SVGs em curvas.
- Não há lista longa nesta spec.

Celular: ok no desenho. O RF9 roda o e2e nos projetos `chromebook` e `celular`, com axe. O `Botao` do F1 já tem `min-h-11` (44 px). A casca não depende de hover.

Ação oficial protegida: não se aplica nesta A0. Não há nota nem convite de coordenação aqui; o convite foi para a A0b, que herdou o bloqueante 2.

**Como ficaram os bloqueantes da 1ª rodada**
- **1. Sessão vencida: resolvido.**
  - A seção 5 ("Conferência da sessão") responde 401 `SESSAO_ENCERRADA` só a bearer de operador, 404 a qualquer outra credencial e 503 com o banco fora.
  - A seção 9 tenta renovar antes de mandar para a entrada, e mostra a mensagem com o que fazer.
  - A seção 10 prova com integração (30 min, 8 h) e com e2e.
  - Preservar diálogo não se aplica: a A0 não tem diálogo de edição.
- **3. Tokens da D72: parcial.** As guardas foram feitas:
  - `estilos.test.ts` reprova família de fábrica;
  - `casca.spec.ts` confere os hex e reprova `oklch(` e `color-mix(`;
  - o fundo do diálogo vira `rgba()`;
  - a fonte é a 9.9, e não o `index.css`.

  A tabela de troca, porém, deixa de fora a peça mais visível do F1 (bloqueante abaixo).
- **4. Chunk: resolvido.** Orçamento separado, teste de import, fallback e fronteira de erro estão na seção 9, linhas 167 a 177.

Bloqueantes:

1. **`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md:159-165`: a tabela de troca não diz o que vira o botão primário do F1, a cor branca e o modificador de opacidade.**
   - **O botão primário.** Hoje ele é `bg-blue-700 text-white active:bg-blue-900`, em `apps/web/src/componentes/Botao.tsx:11`, `paginas/ConfigurarMfa.tsx:178` e `paginas/SemDesafio.tsx:19`. A spec só mapeia "`blue-700` de foco e link → `noite`". Quem implementa escolhe sozinho entre dois caminhos, e os dois dão errado:
     - `noite`, que pela 9.1 é a ação oficial: todo "Entrar" e "Confirmar" passa a ter o peso de aprovar nota, e nenhum teste pega isso;
     - `caramelo` mantendo `text-white`: 3,0:1, uma das duas proibições da 9.1.
   - **A cor branca.** `bg-white` e `text-white` aparecem 27 vezes. `white` está na lista `FAMILIAS` de `estilos.test.ts`, e a guarda nova "reprova família de fábrica". Só que a 9.9 não tem token de texto branco sobre `noite`. A tarefa fica sem saída ou reabre a guarda.
   - **O modificador de opacidade.** `text-slate-900/80` gera `color-mix(` no Tailwind 4. A guarda nova reprova isso, mas a spec não diz qual é o destino.
   - **Correção exigida.** Completar a tabela da seção 9 com três linhas:
     - `Botao`: `bg-blue-700`/`text-white`/`active:bg-blue-900` → `caramelo` com texto `tinta`, hover `caramelo-claro`, pressionado `caramelo-fundo`; `disabled:bg-slate-600` → `inativo`. Se a escolha for `noite`, dizer por quê contra a 9.1;
     - `white` → `fundo`/`superficie`, mais um token de texto sobre `noite` (ou `white` declarado como exceção única da guarda, escrito no teste);
     - todo modificador `/NN` → token opaco, e a guarda reprovando o modificador de opacidade em classe de cor.

Recomendações:
- **Seção 9:** dizer o texto do 503 `INDISPONIVEL_TENTE_DE_NOVO` na tela, por exemplo "O Turmma está indisponível agora. Tente de novo em instantes", e que ele nunca leva à entrada.
- **Seção 9 contra a seção 13:** a contradição do `BroadcastChannel` continua. A A0 cria um canal próprio e a seção 13 adia o defeito do canal do F1 para a A1. Dizer se o canal da A0 nasce sem o defeito. Dizer também se há aviso antes dos 30 min, como faz `apps/web/src/sessao/inatividade.ts`.
- **Orçamento:** dar o número do teto do chunk e dizer como o `tamanho-web.test.ts` separa a entrada dos chunks (padrão de nome ou `manualChunks`).
- **Configurar o segundo fator no celular:** o QR não se lê com o próprio aparelho. Mostrar a chave em texto selecionável e o link `otpauth://`, como alternativa ao QR.
- **`docs/interface.md`:** as linhas 268, 376 e 1262 ainda dizem que os tokens entram na primeira tarefa da A1 e que a escola nasce por `ops:escola`. Atualizar para a A0 e a A0b, que vêm da D76.
- **Para a A0b:** quando o painel tiver diálogo, o 401 da sessão precisa preservá-lo, como o `LoginPorCima` do F1.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/docs/interface.md (9.1 a 9.3)
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.css
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/Botao.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/tamanho-web.test.ts

## tenancy-guardian · 2ª rodada · REPROVADO · 2026-09-23 13:50:47 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: `Operador`, `CodigoRecuperacaoOperador`, `ConviteOperador`, `SessaoOperador`, `AcessoOperacao`, `AuditoriaOperacao` (Tech Spec, seção 3). Nenhuma tem `escolaId`, e o desvio da regra 10, item 1 está registrado na seção 11 com a alternativa que foi recusada. Os ids são UUID gerados no banco. `CodigoRecuperacaoOperador` usa chave composta, o que está correto. Nenhuma dessas tabelas varia por ano letivo, então nenhuma precisa de `anoLetivoId`.

Queries verificadas: as travas da seção 5 (aceite, recuperação, TOTP, configurar, renovação e desafio), a conferência do `OPERADOR` no `comando.ts`, o `/v1/operacao/eu` e o expurgo da seção 7. Conferi a viabilidade no código do F1: `rota-sem-sessao.ts`, `guarda-autenticacao.ts`, `guarda-sessao.ts`, `sem-escopo.decorator.ts`, `expurgo-de-acesso.repository.ts` e `resolucao-de-tenant.repository.ts`.

Teste de isolamento: presente e efetivo. A seção 6 varre as rotas registradas nos dois sentidos e compara status e corpo com uma rota inexistente. Tirar a guarda ou o marcador de um handler deixa vermelho ou o teste de isolamento ou o de arquitetura.

O bloqueante 2 da rodada 1 foi resolvido:
- `@RotaDeOperacao` aplica a `GuardaDeOperador` por `applyDecorators`.
- Os dois marcadores só podem aparecer em `apps/api/src/operacao/`, conferidos por método e por classe.
- Todo caminho `/v1/operacao` precisa ter um dos dois marcadores.
- `@EntradaDeOperacao` fica numa lista fechada das sete rotas.
- O desafio tem `typ` próprio. O `bearerDeDesafio` do F1 só reconhece o tipo de desafio da escola, então o desafio de operador cai na `GuardaDeAutenticacao`, e a seção 2 diz que ali ele recebe 404.
- Se uma rota de operador acabar chamando um repository de escola por engano, ela para em `identidadeDaRequisicao` com `NAO_AUTENTICADO`, porque o contexto está sem escola.

Bloqueantes:
1. **Seção 6, linha 113, e seção 11, linha 193.** A spec afirma que "o módulo não consulta dado de escola" e que o item 9 da regra 10 fica "sem desvio", mas não diz com que critério as consultas do `OperadorRepository` ficam sem `@SemEscopo`, nem prova a afirmação com teste.
   - **Por que é problema:** no F1, toda consulta a tabela global sem escola, como `conta`, leva `@SemEscopo` com justificativa, e um teste de arquitetura prende o repository ao módulo (`resolucao-de-tenant.repository.ts` e `apps/api/test/arquitetura.test.ts`). O `OperadorRepository` faz consultas do mesmo tipo: busca por e-mail antes de haver sessão, aceite de convite pelo hash, sessão pelo refresh. Pelo critério do F1, isso é consulta sem escopo. A spec aponta como exceção só o expurgo e deixa essas sem marca e sem confinamento.
   - **Risco:** a A0b vai pôr consultas de escola nesse mesmo módulo. Sem teste, uma consulta a `usuario` ou `escola` pode entrar num repository de operador sem cláusula de escola e sem `@SemEscopo`, e o item 9 nunca veria.
   - **Correção exigida:** a seção 6 declara o critério: as tabelas de operador ficam fora do modelo de tenant, e por isso as consultas a elas não levam `@SemEscopo`. E ganha dois testes de arquitetura:
     - o `OperadorRepository` só importa as seis tabelas da seção 3 e nenhuma tabela de escola;
     - as seis tabelas só são importadas pelo `OperadorRepository`, pelo `comando.ts` via esse repository e pelo expurgo.

     A seção 11 passa a citar esse critério no item 9.

Recomendações:
- **Seção 7 e seção 11, linha 193.** Não crie um método `@SemEscopo` novo para o expurgo. Acrescente os alvos da operação ao `apagarLoteVencido` que já existe (`expurgo-de-acesso.repository.ts:133`) e ajuste a justificativa dele. Um método novo seria o terceiro com a marca no mesmo repository, e o item 9 da regra 10 manda desconfiar do desenho a partir do terceiro.
- **Seção 6, linha 127.** "Token, desafio e cookie de operador em toda rota de escola: o mesmo" não pode valer para as rotas anônimas da escola (`@RotaAnonima`, e `@AceitaDesafio` chamada com desafio). Escreva para elas o mesmo critério do outro sentido: nunca produzem sessão de escola a partir de credencial de operador.
- **Seção 7, linha 138.** "Apaga as três primeiras" está ambíguo. O dado da conta é apagado na transação do `desativar`, e não pelo expurgo. Liste pelo nome as tabelas que o `sistema.expurgar-acesso` apaga.
- **Seção 6.** Deixe escrito que a `GuardaDeOperador` põe no contexto só o `operadorId`, e nunca `escolaId`. É isso que mantém falhando com erro toda chamada acidental a um repository de escola.

Arquivos:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`

## tenancy-guardian · 3ª rodada · APROVADO · 2026-09-23 13:55:00 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: APROVADO

Tabelas verificadas: `Operador`, `CodigoRecuperacaoOperador`, `ConviteOperador`, `SessaoOperador`, `AcessoOperacao` e `AuditoriaOperacao` (seção 3). Nenhuma tem `escolaId`, e isso está declarado como o único desvio na seção 11, com a alternativa recusada. Os ids são UUID gerados no banco. `CodigoRecuperacaoOperador` tem chave composta `(operador_id, hmac)`, o que está certo. As tabelas de escola não mudam.

Queries verificadas:
- As travas da seção 5: aceite, código de recuperação, TOTP, configurar, renovação e desafio.
- A `GuardaDeOperador`, que põe no contexto só o `operadorId`, nunca o `escolaId`, e trata toda credencial que não é de operador com 404 igual ao de rota inexistente.
- O expurgo, que só acrescenta alvos ao `apagarLoteVencido` que já existe. Não nasce método `@SemEscopo` novo.
- O `comando.ts`, que confere o `OPERADOR` passando pelo `OperadorRepository`.
- A correção exigida na rodada 2 foi feita. A seção 6 traz o critério (as seis tabelas ficam fora do modelo de tenant) e os dois testes de arquitetura, e a seção 11 remete a ele. As recomendações da rodada 2 também foram aplicadas: expurgo sem `@SemEscopo` novo, `operadorId` sozinho no contexto, e o sentido operador → rotas anônimas da escola (nunca produz sessão nem desafio de escola).

Teste de isolamento: presente e efetivo. As rotas testadas são geradas da lista registrada, a comparação é nos dois sentidos, e a seção 6 declara que tirar a guarda de um handler deixa os dois testes vermelhos.

Bloqueantes: nenhum

Recomendações:
1. **Seção 6, os dois testes de arquitetura.** Os testes olham só o `import`, mas o expurgo que já existe (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:34-60`) escreve SQL cru com o nome da tabela (`delete from sessao`) e não importa tabela nenhuma. Sugestão: os dois testes procurarem também os nomes físicos das tabelas (`operador`, `sessao_operador`, `convite_operador` etc.) em `sql\`...\``. No primeiro teste, a mesma busca pelos nomes das tabelas de escola dentro do `OperadorRepository`. No segundo, deixar fora da busca a definição do schema, o barrel e as migrations.
2. **Seção 6, a lista de quem pode importar.** "pelo `comando.ts` (via o repository)" se contradiz. Se o comando passa pelo repository, ele não importa tabela e deve sair da lista de quem pode importar. Assim o segundo teste fica mais apertado.
3. **Seção 7, o `apagarLoteVencido`.** A justificativa do `@SemEscopo` (linha 134 do mesmo arquivo) cita só "registro de acesso, sessão e convite a todas as escolas". Ao acrescentar os alvos da operação ao `ALVOS_DO_EXPURGO_DE_ACESSO`, a tarefa deve reescrever esse texto para cobrir as tabelas da equipe, que não têm escola. O teste de que os alvos da operação são apagados nos prazos deve rodar pelo mesmo método.

## infra-guardian · 3ª rodada · REPROVADO · 2026-09-23 13:55:10 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: login (a spec mexe no código das guardas e do contador da escola, mas não acrescenta carga)
Rate limit: ok
Fila e prioridade: ok (nada vai para fila, e nada demorado roda dentro do request)
Concorrência: protegida (as seis travas da seção 5 usam gravação condicional com `returning`; o `configurar` agora troca o segredo e os códigos na mesma transação)
Índice e paginação: ok (não há tabela que cresça com aluno nem listagem nesta spec; o painel foi para a A0b)
Degradação de IA: não se aplica
Migration: compatível (a migration só cria tabelas novas)
Métrica e alerta: ok (a contagem de `entrada_falha` por minuto fica e não há alerta novo)

Bloqueantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md:194` (seção 10, linha de Integração). A rodada 2 exigiu duas coisas: o novo roteamento do limite e um teste de 429 para ele. O roteamento está feito nas linhas 105 a 111. O teste não está.
  - A seção 10 agora define a lista mínima só como "os cenários exigidos pelo `test-engineer` e pelo `privacy-guardian` nas rodadas 1 e 2".
  - O teste de 429 foi exigido pelo `infra-guardian`, então fica fora dessa lista.
  - O cenário "`rl:op` recusa com o IP igual", que a 2ª versão listava explicitamente, também sumiu da tabela.
  - Com isso, nenhuma parte da regra 80, item 1, fica provada por teste nesta spec.
  - **Correção exigida:** incluir os cenários do `infra-guardian` na lista mínima de integração, ou escrevê-los na própria seção 10. São quatro:
    1. `convite/consultar`, `mfa/configurar`, `renovar` e `sair` passam do `rl:ip` e respondem 429 `LIMITE_EXCEDIDO` com `Retry-After`.
    2. `sessao/email` e `convite/aceitar` acima do limite do IP não respondem 429: rebaixam no semáforo do hash, e quem recusa é o contador da conta.
    3. `sessao/mfa` é recusado pelo contador do `operador.id`, e não pelo IP.
    4. `/eu` recusa por `rl:op:{sub}` com dois operadores atrás do mesmo IP, e o outro operador continua entrando.

Recomendações:
- `techspec.md:107`: o texto responde à recomendação anterior. Numa rota `@RotaDeOperacao` sem token de operador válido, nada é contado, e isso mantém o 404 idêntico ao de rota inexistente. Vale deixar isso escrito como decisão consciente e declarar que a verificação é só do JWT, sem banco, para o custo do flood ficar explícito.
- Continua em aberto da rodada 2: uma linha no `docs/runbook.md` dizendo que, com o Redis fora, o caminho do operador é `ops:*`, porque o desafio recusa com 503.
- `techspec.md:154`: a seção 7c agora remete à seção 5. Um teste de arquitetura que confira que as rotas `@EntradaDeOperacao` caem nos três grupos de limite da linha 108 (rebaixa, contador e `rl:ip`) impediria que uma oitava rota entre sem limite.

## frontend-reviewer · 3ª rodada · APROVADO · 2026-09-23 13:55:13 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: APROVADO

Esta é a rodada 3. Auditei o diff `4d6321a..b233c2f` da `techspec.md` e do `docs/interface.md`. O que não mudou desde a rodada 2 não foi reauditado.

**Correção exigida na rodada 2: feita** (`techspec.md` seção 9, tabela "Hoje | Vira").
- **Botão primário do F1** (`bg-blue-700` / `text-white` / `active:bg-blue-900`, que hoje estão em `Botao.tsx:11`, `ConfigurarMfa.tsx:178` e `SemDesafio.tsx:19`): passa a `caramelo` com texto `tinta` (6,4:1). O hover vira `caramelo-claro`, o pressionado `caramelo-fundo` e o desligado `inativo`. O preto fica reservado à ação oficial. Confere com as linhas 512–514 e 1007 do `docs/interface.md`.
- **`white` e `black`**: ficam, porque existem no `@theme` da 9.9 (linha 704 do `docs/interface.md`).
- **Modificador `/NN`**: vira token opaco, e o fundo do diálogo vira `rgba()` literal.
- **Guarda**: `estilos.test.ts` aceita só os nomes que estão no `@theme` e reprova modificador de opacidade. O `e2e/casca.spec.ts` reprova `oklch(` e `color-mix(`. Isso segura inclusive as duas telas que montam o botão direto, sem passar pelo `Botao`.

**Recomendações da rodada 2: todas atendidas.**
- Texto do 503: "O Turmma está indisponível agora. Tente de novo em instantes", e a tela não muda.
- Aviso 2 min antes dos 30 min de inatividade, como no `inatividade.ts`.
- O chunk `operacao-*.js` tem teto de 60 kB e sai separado por `manualChunks`.
- O QR vem acompanhado da chave em texto e do `otpauth://`.
- O `docs/interface.md` foi corrigido nas linhas 265–269, 371–374 e na tabela do roteiro (1262).

Estados: ok. Carregando é o fallback `EstadoCarregando`; erro é a fronteira com "Tente de novo" e o 503 com mensagem que diz o que fazer; sessão encerrada tem mensagem própria; o dado é a casca. Não há lista, então não há estado vazio a avaliar.

Acessibilidade: o foco passa a 2 px em `noite` com 2 px de afastamento, e `caramelo-noite` sobre preto. Há `<h1>` e `document.title` por rota, e o "Copiar" é anunciado em região viva. A chave em texto dá ao leitor de tela o que o QR sozinho não dava. O e2e roda com axe nos dois projetos.

Chromebook fraco: `color-mix(` e `oklch(` são reprovados no CSS servido, o que protege o Chrome 109. A operação sai num chunk sob demanda de até 60 kB, e há teste de que a entrada da escola não importa nada de `src/operacao/`. Os 150 kB brotli da entrada continuam.

Celular: as telas rodam no projeto `celular`, e nenhum fluxo exige o celular. O código TOTP pode ser configurado sem câmera, pela chave em texto e pelo `otpauth://`. O hover do botão é só um enfeite: o pressionado tem token próprio, então nada depende de hover.

Ação oficial protegida: não se aplica nesta spec. Nenhuma ação oficial de escola, e o preto fica reservado para a variante `oficial` da 9.1.

Bloqueantes: nenhum.

Recomendações:
- **Seção 9, linha "`blue-700` de foco e link → `noite`"**: o `docs/interface.md` (linha 515) põe link em `caramelo-texto`, não em `noite`. E `noite` tem o mesmo hex que `tinta` (#0D0D0D), então um link nessa cor só se distingue do texto pelo sublinhado (WCAG 1.4.1). No F1 de hoje o `blue-700` só aparece no foco e no botão, então isso não quebra nada agora. Vale alinhar a linha com a 9.9: link em `caramelo-texto` com sublinhado, e `noite` só para o foco.
- **Seção 10**: a lista de integração agora só aponta para os cenários de `revisao-spec.md`. Na hora do `/criar-tasks`, vale copiar para a tarefa os cenários que tocam a tela (sessão encerrada, 503, duas abas no configurar), para o e2e não depender de ler outro arquivo.

Arquivos:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/interface.md`

## privacy-guardian · 3ª rodada · APROVADO · 2026-09-23 13:55:15 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: APROVADO

As duas correções da rodada 2 estão feitas. A segunda foi feita por referência a outro arquivo, e não escrita na seção 10; isso fica como recomendação.

**Correções da rodada 2**

| Correção exigida | Situação |
|---|---|
| Prazo do convite vencido | Feita. Seção 7 da Tech Spec: 30 dias após usar, revogar ou vencer. `docs/lgpd.md`, linha 77, diz o mesmo. |
| Prazo da sessão só expirada | Feita. Seção 7: 30 dias após encerrar ou, sem encerramento, após `expiraEm`. `docs/lgpd.md`, linha 78, foi corrigida igual. |
| Tabelas do expurgo pelo nome | Feita. Seção 7: o expurgo apaga `ConviteOperador`, `SessaoOperador` e `AcessoOperacao`. `AuditoriaOperacao` e `Operador` nunca passam por ele. |
| Desativar revoga o convite e encerra as sessões na mesma transação | Feita. Seção 5, "Nascimento": dado pessoal, convite e sessões saem numa transação só. A seção 3 lista o que é apagado e mantém o apelido. |
| Testes da desativação e do expurgo prazo a prazo, com a auditoria intacta | Feita por referência. A seção 10 torna obrigatórios, um teste cada, os cenários exigidos nas rodadas 1 e 2. Para a privacidade são estes: desativação sem estado parcial, apelido mantido, prazos de 29 e 31 dias, 6 meses mais e menos um dia, e `AuditoriaOperacao` intacta depois do expurgo. O texto completo está no bloco `privacy-guardian`, 2ª rodada, bloqueante 2, de `tasks/prd-apresentacao-operacao/achados/revisao-spec.md`. |

Três recomendações da rodada 2 também foram atendidas:
- O cookie de dispositivo do operador entrou no mapa (`docs/lgpd.md`, linha 69).
- A seção 8 do PRD foi alinhada ao mapa.
- A spec diz qual comando revoga o convite (`convite` revoga o pendente) e de onde vem o autor da `AuditoriaOperacao` (o `OPERADOR` do comando).

**Formato de resposta**

Campos pessoais tocados: a conta do operador (apelido, nome, e-mail, hash de senha, segredo do segundo fator cifrado, HMAC dos códigos de recuperação), o convite de operador, a sessão de operador, `AcessoOperacao` (com IP), `AuditoriaOperacao` e o cookie de dispositivo do operador. Nenhum dado de aluno.
Fora da tabela de dados do docs/lgpd.md: nenhum. As linhas 69 e 76 a 80 cobrem tudo, com finalidade e retenção iguais às da seção 7.
Autorização por objeto: ok. Não há objeto de escola. A seção 6 faz credencial de escola na operação, e de operador na escola, responder igual a rota inexistente. A lista de rotas é gerada e a efetividade é testada.
Logs: limpos no desenho (seção 7: evento e ids; `entrada_falha` sem o e-mail).
Auditoria: presente. `AuditoriaOperacao` guarda criar e desativar operador, configurar o segundo fator e gerar ou revogar convite, e fica fora do expurgo. `AcessoOperacao` guarda o acesso por 6 meses.
Envio externo: nenhum.
Seed/fixture: sintético (MVP local, borda restrita antes do staging).
Bloqueantes: nenhum.
Recomendações:
- **Caminho da referência na seção 10.** A seção 10 aponta `revisao-spec.md`, mas lá o item da privacidade é uma linha só ("testes da desativação e do expurgo prazo a prazo"). Os casos concretos estão em `achados/revisao-spec.md`. Cite esse caminho, ou escreva na seção 10 os casos da privacidade, para o `/criar-tasks` não depender de ler o bloco certo.
- **Recomendações da rodada 2 ainda fora da seção 10.** Por ela, só os "cenários exigidos" são obrigatórios. Ficaram de fora três testes recomendados na rodada 2: o e-mail sentinela em `AcessoOperacao` e no log, o `no-store` nas respostas com segredo, e a recusa de campo a mais pelo contrato estrito. Vale incluí-los.
- **A pergunta de fechamento não se aplica.** A spec não guarda nem envia dado de aluno. Para o operador, o desenho diz o que guarda, onde e por quanto tempo.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md (linhas 66 a 80)
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/revisao-spec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/achados/revisao-spec.md

## test-engineer · 3ª rodada · REPROVADO · 2026-09-23 13:55:28 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
Esta rodada confere as seis correções da rodada 2, a nova redação da seção 10 e o que elas afetam.

1. Um desafio só pode ser usado uma vez, mesmo com duas chamadas em paralelo, e com o Redis fora a resposta é 503.
2. Cada etapa do desafio só vale na sua rota. O `configurar_mfa` só sai de `/sessao/email` dentro das 72 h do convite aceito. Configurar numa conta que já tem MFA ativo não muda nada.
3. A renovação respeita os 30 min parado, as 8 h, a saída e a desativação. Acesso vencido com a sessão viva dá 401 `ACESSO_VENCIDO` e a web renova.
4. Nas rotas de entrada da escola, credencial de operador nunca produz sessão nem desafio de escola.
5. O marcador e o prefixo `/v1/operacao` são conferidos nos dois sentidos.
6. Todo `ops:*` exige `OPERADOR` de um operador ativo.

**Cobertos no desenho:**
- (1) está na seção 5, linha 90: `SET NX` no `jti`, e 503 com o Redis fora.
- (2) está nas linhas 74-76, e o "MFA ativo não muda nada" nas linhas 84-85 (`where mfa_ativado_em is null`).
- (3) está nas linhas 100-102.
- (4) está nas linhas 135-136.
- (5) está na linha 127.
- (6) está na linha 69.

As seis correções foram feitas no texto do desenho. Os bloqueantes abaixo estão na seção 10 e numa contradição que a rodada 3 introduziu na seção 5.

**Bloqueantes:**

1. **`techspec.md` seção 10, linha 194: apontar para a revisão não basta como especificação.** A pergunta era se a referência a `revisao-spec.md` serve. Não serve, por três motivos:
   - **Mistura a A0 com a A0b.** A lista de testes da rodada 1 no `revisao-spec.md` ainda traz RF5 a RF9, contagem e estado, sentinelas e 30 escolas. Tudo isso foi para a A0b. "Um teste cada" dos cenários da rodada 1 cobra da A0 testes do painel, ou deixa quem executa decidir o que fica de fora.
   - **Perde cenários que a spec já tinha.** A referência cita só o `test-engineer` e o `privacy-guardian`. Com isso somem cenários exigidos por outros revisores, que a versão 2 da seção 10 listava:
     - "banco fora dá 503" (`infra-guardian`, rodada 1);
     - "`rl:op` recusa com o IP igual";
     - o 429 do `rl:ip` em `convite/consultar`, `mfa/configurar`, `renovar` e `sair` (`infra-guardian`, rodada 2, "com teste de 429");
     - o desafio e o cookie cruzados nos dois sentidos (`tenancy-guardian`, rodada 1).

     O desenho continua nas seções 5 e 6, mas nenhuma linha de teste os exige mais.
   - **Aponta para um alvo que muda.** O `revisao-spec.md` é um registro do processo que continua crescendo (rodada 3, notas da A0b, tabela do hook). O `/criar-tasks` e a auditoria da tarefa precisam de uma lista fechada, com um identificador por cenário.

   **Correção exigida:** a seção 10 traz a lista enumerada dos cenários de integração da A0, uma linha curta cada, incluindo os do `infra-guardian` e do `tenancy-guardian` e excluindo os que foram para a A0b. Se o teto de 2.000 palavras não comportar, a lista pode ir para um anexo fixo (`tasks/prd-apresentacao-operacao/cenarios.md`), citado pela seção 10 como parte da spec. Não pode ficar no registro de revisão.

2. **`techspec.md` seção 5, linhas 84-86: a regra do "configurar em duas abas" se contradiz, e falta o passo seguinte.**
   - **A contradição.** A trava diz que segredo, códigos e ativação gravam `where mfa_ativado_em is null`. Nesse caso vence o **primeiro** a gravar, e o segundo não acha linha. A mesma frase diz "vale o último gravado". O teste de `Promise.all` exigido na rodada 1 não tem resultado esperado definido. Se valesse o último, a primeira aba ficaria com um QR que não funciona.
   - **O passo seguinte.** A saída de `mfa/configurar` (seção 4, linha 56) é "segredo e códigos", sem desafio novo. O `jti` é de uso único (linha 90), e `/sessao/mfa` só aceita a etapa `mfa` (linha 74). A spec não diz como quem acabou de configurar chega à sessão. O E2E "convite, senha, segundo fator, entrada" depende disso.

   **Correção exigida:**
   - dizer qual aba vence e o que a outra recebe, alinhado com a cláusula `where`;
   - dizer se o `configurar` consome o desafio e devolve um de etapa `mfa`, ou se manda de volta para `/sessao/email`;
   - um teste para cada ponto.

**Recomendações:**
- `ops:operador criar` sem operador ativo aceita o bootstrap. Declarar o que acontece:
  - quando o último operador ativo é desativado (o bootstrap reabre?);
  - quando um operador desativa a si mesmo;
  - quando dois `criar` de bootstrap rodam em paralelo (regra 80, item 7).
- A ativação acontece no `configurar`, antes de o operador provar com um TOTP que leu o QR. Pense em ativar só no primeiro `/sessao/mfa` válido, para não trancar quem fechou a aba antes de escanear.
- Ficam valendo as recomendações da rodada 2 que não viraram texto: `ultimoUsoEm` aos 29 e 31 min, e o convite em `ops:operador convite` quando já há um pendente.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/revisao-spec.md`

## infra-guardian · 4ª rodada · APROVADO · 2026-09-23 13:57:35 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: APROVADO
Caminho quente tocado: login (o operador reaproveita as guardas e o contador de tentativas do login da escola, sem somar carga a ele)
Rate limit: ok
Fila e prioridade: ok (a spec não cria job; o expurgo só ganha alvos novos no `apagarLoteVencido`, que já existe)
Concorrência: protegida
Índice e paginação: ok (a A0 não tem listagem nova; a listagem e o `EXPLAIN` com 30 escolas ficaram na A0b)
Degradação de IA: não se aplica
Migration: compatível (só cria tabelas novas, fora do modelo de tenant)
Métrica e alerta: ok (a contagem de `entrada_falha` por minuto, sem alerta novo; o runbook ganha a linha de Redis fora, na seção 7c)
Bloqueantes: nenhum. A correção exigida na rodada 3 foi feita, conferida contra a seção 5 da spec:
- C32 cobre o 429 `LIMITE_EXCEDIDO` com `Retry-After` do `rl:ip` em `convite/consultar`, `mfa/configurar`, `renovar` e `sair`.
- C33 cobre o rebaixamento sem 429 em `sessao/email` e `convite/aceitar`, onde quem recusa é o contador da conta.
- C34 cobre a recusa em `sessao/mfa` pelo contador do `operador.id`.
- C35 cobre dois operadores no mesmo IP: o `rl:op:{sub}` segura um e o outro continua.
- C36 exige que toda rota de entrada esteja num dos três grupos de limite da seção 5. Os três grupos somam as sete rotas que C43 fixa.
- C31 cobre o banco fora na conferência da sessão: 503 `INDISPONIVEL_TENTE_DE_NOVO`, nunca 401 nem 404.
- A mudança em `configurar` (consome o desafio e ativa só no primeiro `/sessao/mfa` válido, com `where mfa_ativado_em is null`) está protegida e testada por C17 e C18.
- O bootstrap sob `pg_advisory_xact_lock` é testado por C3.
Recomendações:
- `cenarios.md`, C36: exigir também que toda rota `@RotaDeOperacao` conte pelo `rl:op:{sub}`. Hoje C35 prova isso só em `/eu`.
- `cenarios.md`, seção Limite: incluir um cenário do que o `rl:ip` e o `rl:op` fazem com o Redis fora. A seção 7c descreve o comportamento, e C13 só cobre o desafio.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/cenarios.md

## test-engineer · 4ª rodada · REPROVADO · 2026-09-23 13:58:40 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:** nesta rodada confiro as duas correções da rodada 3 e o que elas afetam. Primeiro, a lista da A0 precisa ser fechada, com identificador por cenário, incluir os cenários do `infra-guardian` e do `tenancy-guardian`, e deixar de fora os da A0b. Segundo, o "configurar" precisa ser coerente com a cláusula do banco, e o caminho até a sessão precisa estar descrito. Também confiro as recomendações que entraram: bootstrap, `ultimoUsoEm` aos 29 e 31 min, e convite pendente.

**Cobertos:**
- **Correção 1, feita.** O `cenarios.md` é um anexo fixo e a seção 10 o cita como parte da spec.
  - Os quatro cenários de limite do `infra-guardian` estão em C32 a C35, e o teste de arquitetura dos grupos de limite em C36.
  - Banco fora dá 503 em C31.
  - Desafio, token e cookie cruzados nos dois sentidos estão em C46 e C47, com efetividade em C48.
  - Os bloqueantes 1 a 6 da rodada 2 estão em C12 a C16, C26 a C29, C47, C42 e C2.
  - Os da rodada 1 que ficaram na A0 estão em C44, C1, C4, C5, C19 a C24.
  - Os do `privacy-guardian` estão em C6, C25, C38 e C39. As recomendações do `tenancy-guardian` estão em C45 e C38.
  - Nada da A0b entrou na lista.
- **Correção 2, feita no texto.** O "configurar" consome o desafio, devolve outro de etapa `mfa`, e a ativação acontece no primeiro `/sessao/mfa` válido (seção 5, `techspec.md:85-88`). C17, C18 e C20 cobrem isso.
- **Recomendações que entraram:**
  - bootstrap sob advisory lock (C1, C3);
  - ninguém desativa a si mesmo (C5). Assim o último ativo nunca é desativado e o bootstrap não reabre;
  - `ultimoUsoEm` aos 29 e 31 min (C26);
  - convite pendente (C7);
  - linha no runbook para o Redis fora (seção 7c).
- Não há IA envolvida, logo não há provedor pago. Nenhum `.skip` e nenhum mock de coisa nossa.

**Bloqueantes:**

1. **`cenarios.md:41-42` (C18) e `techspec.md:85-88`: o "configurar em duas abas" continua sem teste de concorrência, e o desenho deixa estado misturado.**
   - C18 está escrito em sequência. A rodada 1 exigiu `Promise.all` para o "`mfa/configurar` duplo", e todas as outras travas da seção 5 têm cenário paralelo (C10, C12, C19, C20, C30). Esta é a única sem.
   - O risco é real com o desenho atual. A frase "apaga e insere códigos, grava segredo, numa transação `where mfa_ativado_em is null`" não diz em que ordem a linha do `operador` é travada. Em read committed, duas transações paralelas podem fazer o seguinte:
     - as duas apagam códigos sem ver o que a outra inseriu;
     - as duas inserem os seus;
     - a segunda espera o lock do `update operador` e grava o segredo dela.
     - O resultado é o segredo da aba B com os códigos de recuperação de A e de B valendo juntos.
   - Há uma segunda corrida. O `/sessao/mfa` da aba A confere o código contra o segredo A, o `configurar` da aba B grava o segredo B, e só então o `set mfa_ativado_em = now() where mfa_ativado_em is null` ativa. Fica ativado o segredo B, que o autenticador de A não tem, e o operador fica trancado.
   - **Correção exigida na seção 5:**
     - o `configurar` trava a linha do operador antes de mexer nos códigos: começa pelo `update operador ... where mfa_ativado_em is null returning`, ou por `select ... for update`;
     - o desafio de etapa `mfa` devolvido leva a versão do segredo gravado;
     - a ativação acontece com `where mfa_ativado_em is null and <versão> = <versão do desafio>`, e é essa diferença de versão que produz o "configure de novo".
   - **Correção exigida no C18:** dois `configurar` em `Promise.all`. O teste confere que o segredo gravado e os códigos válidos são da mesma aba, e que nenhum código da outra aba vale. O código da aba vencedora ativa e o da outra recebe "configure de novo".
   - **Cenário novo:** o `/sessao/mfa` da aba A em paralelo com o `configurar` da aba B nunca ativa um segredo diferente do que foi conferido.

**Recomendações:**
- **`techspec.md:123` contra `cenarios.md:95-96` (C45).** A seção 6 ainda diz que as tabelas são importadas "pelo `comando.ts` (via o repository)", e o C45 exclui o comando. Alinhar a seção 6 ao C45, que é o mais estrito e o que o `tenancy-guardian` recomendou.
- **Duas `desativar` cruzadas em paralelo** (A desativa B enquanto B desativa A). As duas passam pela conferência do `OPERADOR` ativo e zeram os ativos, o que reabre o bootstrap. Vale pôr o `desativar` sob o mesmo `pg_advisory_xact_lock` do bootstrap, ou gravar com "e resta outro ativo". Vale também um cenário junto do C5.
- **C15 (`cenarios.md:36-37`).** Escrever as duas bordas com relógio controlado (71h59 e 72h01), como o C26 fez com os 29 e 31 min.
- **C17.** Dizer explicitamente que o mesmo desafio `configurar_mfa` reenviado a `/mfa/configurar` é recusado. "Consome" está no desenho, mas não está na asserção.
- **C31.** Estender o 503 do banco fora ao `/renovar`, e não só à conferência da `GuardaDeOperador`, já que o `/renovar` confere as mesmas quatro condições.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/revisao-spec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/achados/revisao-spec.md`

## test-engineer · 5ª rodada · REPROVADO · 2026-09-23 14:00:37 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO

Cenários exigidos: os mesmos de antes nesta parte. Dois `configurar` em paralelo. `/sessao/mfa` em paralelo com `configurar`. Desafio reusado. Janela de 72 h. Dois `desativar` cruzados. Banco fora no `/renovar`. Redis fora no limite. Além deles, entra um que só aparece com a trava nova: `desativar` que acontece enquanto um desafio `configurar_mfa` ou `mfa` ainda está valendo.

Cobertos:
- **Correção exigida na rodada 4, feita.** O `update ... where mfa_ativado_em is null returning mfa_versao` trava a linha antes de apagar e inserir os códigos, então o segredo e os códigos saem sempre da mesma aba. A ativação agora exige `mfa_versao = $versao_do_desafio`, e isso fecha a mistura entre `/sessao/mfa` e `configurar` (techspec.md:84-89). C18 virou `Promise.all` com a asserção de mesma aba, e o C18b entrou.
- **Recomendações da rodada 4, feitas.** C5 com o desativar cruzado, sob o mesmo `pg_advisory_xact_lock` do bootstrap. C15 com relógio controlado nas 71h59 e 72h01. C17 com o desafio reenviado. C31 com o `/renovar`. Seção 6 alinhada ao C45. C36 e C36b. `mfaVersao` no modelo.

Bloqueantes:
1. **Falta a condição de operador ativo nas travas de `configurar` e da ativação.** Em techspec.md:84-89 as travas não exigem `desativado_em is null`. O mesmo vale para as de TOTP e código de recuperação, e cenarios.md:17 (C6) não traz o caso.
   - **O caminho.** O `desativar` encerra as sessões e revoga o convite. Mas um desafio já emitido continua valendo 5 min no Redis (techspec.md:92), e não é sessão. A conferência da sessão só barra o operador desativado depois que a sessão existe.
   - **O que acontece.** Com um desafio `configurar_mfa` emitido antes do `desativar` e usado depois, o `update ... where mfa_ativado_em is null` volta a gravar segredo, versão e códigos na linha que o C6 promete limpa ("só id, apelido e datas"). Isso vale se o `desativar` zera `mfa_ativado_em` ou se o segredo nunca foi ativado. Em seguida, o `/sessao/mfa` pode ativar o segundo fator e criar uma sessão para um operador desativado. A trava nova de versão não pega o caso, porque a versão do desafio continua batendo.
   - **Correção exigida.**
     - Pôr `and desativado_em is null` no `update` do `configurar`, no da ativação e nos de TOTP e código de recuperação (ou declarar que a conferência do desafio lê o operador ativo na mesma transação da trava).
     - Criar um cenário, C6b: um desafio emitido antes do `desativar` e usado depois, em sequência e em `Promise.all` com o próprio `desativar`, é recusado. A linha continua só com id, apelido e datas, não há código de recuperação e nenhuma `SessaoOperacao` é criada.

Recomendações:
- **Ordem da conferência na ativação** (techspec.md:86-89). A spec não diz se a versão é comparada antes do código. Se o TOTP da aba vencida for conferido contra o segredo novo, ele falha como "código inválido" e soma no contador por `operador.id`. Aí o C18 ("recebe 'configure de novo'") passa a depender de um detalhe que a spec não fixa. Declarar: ler a versão junto do segredo e, se ela não bater com a do desafio, responder "configure de novo" sem conferir o código e sem contar tentativa.
- **C18b e C18 com a ordem forçada.** Um `Promise.all` sozinho quase sempre cai na mesma ordem. Pedir uma barreira (ou uma transação segurada no teste) que force as duas ordens: `configurar` de B antes da ativação de A, e depois dela. A asserção precisa valer nas duas.
- **C5, deixar explícito.** A asserção de "resta um operador ativo" deve partir de exatamente dois ativos, que é o caso em que a regra do último ativo morde.

Resumo: a correção que a rodada 4 pediu foi feita. Sobra um bloqueante, que é o operador desativado ainda conseguir voltar a gravar segredo e abrir sessão com um desafio que já estava emitido.

Arquivos:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/cenarios.md

## test-engineer · 6ª rodada · REPROVADO · 2026-09-23 14:02:04 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO

Cenários exigidos: do diff desde a rodada 5, travas com `desativado_em is null` (seção 5), C6b (desafio emitido antes do `desativar`, em sequência e em paralelo), versão divergente dá "configure de novo" sem conferir código nem contar tentativa, C18 e C18b com barreira nas duas ordens, C5 com exatamente dois ativos, e a tabela da seção 10 contando o C6b.

Cobertos: a correção da rodada 5 foi feita no texto. Todas as travas da seção 5 levam `desativado_em is null`, e o C6b existe e entra na seção 10. As recomendações também foram aplicadas: a versão é lida com o segredo e divergente não confere código nem soma no contador (seção 5, trava de configurar, e C18). C18 e C18b têm barreira nas duas ordens, e o C5 parte de exatamente dois ativos.

Bloqueantes:
1. **Seção 5, "Travas no banco", itens TOTP e código de recuperação (techspec.md:80-82). Criar a sessão não está preso à trava, e o C6b exige "sem sessão criada".**
   - **O que está errado:** o `configurar` diz "numa transação" e trava a linha. Já o `/sessao/mfa` só descreve a trava isolada: `update ... mfa_ultimo_passo` ou `delete` do código de recuperação. Em seguida vêm a ativação e o insert da sessão, e a spec não diz que as três coisas acontecem na mesma transação com a linha do operador travada.
   - **O caminho que quebra:** a trava do TOTP passa, depois o `desativar` confirma, e só então a sessão é inserida. Nessa ordem sobra uma sessão de operador desativado, porque o `desativar` já rodou o "encerra as sessões". A guarda recusa essa sessão na requisição seguinte, então não há acesso. Mesmo assim, o estado contradiz o C6b e o próprio texto ("não grava nem ativa nada").
   - **Um detalhe:** a tabela de códigos de recuperação não tem `desativado_em`. O `delete` só respeita a condição se fizer join com o operador ou se, antes, travar a linha do operador com `desativado_em is null`.
   - **Correção exigida:** escrever na seção 5 que o `/sessao/mfa` abre uma transação só. Ela começa travando a linha do operador (`... where id = $1 and desativado_em is null`, pelo `update` do TOTP ou por `for update`), e dentro dela fazem consumo do código, ativação e insert da sessão. Com isso o `desativar` espera por ela ou ela vê o operador desativado.
2. **cenarios.md:21-23 (C6b). O cenário paralelo não tem barreira, então o teste passaria com o bug acima.**
   - **O que está errado:** um `Promise.all` sem barreira quase nunca cai na janela entre a trava e o insert da sessão, então o teste fica verde mesmo sem a transação.
   - **Correção exigida:** usar barreira que force as duas ordens, como no C18 e no C18b. Numa, o `desativar` confirma entre o consumo do desafio (ou a trava do TOTP) e o insert da sessão. Na outra, confirma depois da transação do `/sessao/mfa`. As asserções:
     - a linha fica só com id, apelido e datas;
     - não sobra código de recuperação;
     - `sessao_operador` fica com zero linhas ativas nas duas ordens.
   - **Para o `configurar_mfa`:** na primeira ordem, nenhum segredo fica gravado.

Recomendações:
- Seção 5, "Entrada": o texto perdeu `conhecido`/`outro`. Vale manter os dois valores da origem, para quem implementar não ter de voltar ao F1.
- C6b: afirmar também que a recusa é a mesma resposta tipada de desafio inválido, para não confirmar ao cliente que o operador foi desativado.

Arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/cenarios.md`

## test-engineer · 7ª rodada · REPROVADO · 2026-09-23 14:03:20 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

**VEREDITO: REPROVADO**

**Cenários exigidos:** a rodada 6 pediu duas correções.
- Correção 1: o `/sessao/mfa` roda numa transação só. Ela começa travando a linha do operador ativo, e o consumo do código, a ativação e o insert da sessão ficam dentro dela.
- Correção 2: o C6b ganha barreira nas duas ordens, afirma zero sessões ativas e devolve a mesma resposta de desafio inválido.
- Também auditei o que essas mudanças afetam: C18 e C18b, o fluxo do configurar e o `desativar`.

**Cobertos:**
- **Correção 1: feita** (`techspec.md` §5, "Travas no banco", linhas 81-85). O `select ... for update where id = $1 and desativado_em is null` vem primeiro. O TOTP por passo ou o `delete ... returning` do código de recuperação, a ativação e o insert da sessão ficam dentro da mesma transação. O `desativar` trava a mesma linha e por isso corre em série com o `/sessao/mfa`. O desenho está certo.
- A condição `desativado_em is null` do cabeçalho vale também para o configurar, e a trava da linha continua na primeira instrução dele (linhas 86-90). C18 e C18b continuam coerentes com o desenho.
- A origem `conhecido`/`outro` voltou ao texto (linha 96).
- A lista de testes na linha 197 continua citando o C6b.

**Bloqueantes:**
- **`cenarios.md:21-25` (C6b): a correção 2 foi escrita de um jeito que o teste não consegue passar.**
  - **Primeira ordem.** O texto diz que o `desativar` confirma "entre a trava e o insert da sessão". Com o `for update` da linha 81, isso não acontece: enquanto o `/sessao/mfa` segura a trava, o `desativar` fica esperando e só confirma depois. Se a barreira segura o `/sessao/mfa` nesse ponto à espera do `desativar`, o teste trava.
  - **Segunda ordem.** O texto diz que o `desativar` confirma "depois da transação do `/sessao/mfa`". Nessa ordem o `/sessao/mfa` já teve sucesso e criou a sessão. Não tem como ele ser "recusado com a mesma resposta de desafio inválido".
  - **O risco.** Quem implementar vai ter de enfraquecer a trava para o teste ficar verde, ou afrouxar a asserção sem avisar. As duas saídas tiram do C6b a prova da regra.
  - **Correção exigida: reescrever o C6b com as duas ordens que o desenho de fato produz.**
    - **(a) O `desativar` ganha.** A barreira fica no `/sessao/mfa` depois de validar o `jti` e antes do `for update`. O `desativar` confirma, e só então a barreira solta. Asserções: o `/sessao/mfa` é recusado com resposta idêntica à de desafio inválido; zero linhas em `SessaoOperador` para o operador; `mfa_ultimo_passo` e os códigos não mudam; nenhuma ativação.
    - **(b) O `/sessao/mfa` ganha.** A barreira fica dentro da transação, depois do `for update` e antes do insert. Com o `desativar` já disparado, o teste prova que ele está bloqueado (promessa ainda pendente, ou a espera aparecendo em `pg_locks`), e depois a barreira solta. Asserções: o `/sessao/mfa` confirma com sessão; o `desativar` confirma em seguida e encerra a sessão; zero sessões ativas no fim; a requisição seguinte com aquela sessão recebe `SESSAO_ENCERRADA`; a linha fica só com id, apelido e datas.
    - **(c) A variante `configurar_mfa`.** Vale o mesmo par de ordens. A barreira fica antes e depois do `update operador ... returning mfa_versao`. No fim não fica segredo gravado nem código de recuperação.
    - **(d) Em sequência.** O caso sem paralelo continua como está.

**Recomendações:**
- A linha 84 diz que o `desativar` "também trava a linha". Vale nomear a instrução exata que trava, por exemplo um `select ... for update` no início da transação do `desativar`, antes de apagar o dado pessoal. Assim a ordem das travas fica escrita, e a revisão de código não precisa deduzir de onde vem a serialização.
- A reserva do `jti` com `SET NX` no Redis acontece fora da transação do Postgres. Convém dizer em uma linha que o desafio queimado numa transação que depois volta atrás não é devolvido (o operador pede outro) e que isso é o comportamento aceito.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/cenarios.md`

## test-engineer · 8ª rodada · APROVADO · 2026-09-23 14:04:27 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: APROVADO

Cenários exigidos (correção da rodada 7, C6b): (a) o `desativar` ganha; (b) o `/sessao/mfa` ganha com o `desativar` bloqueado; (c) o mesmo par para `configurar_mfa`; (d) em sequência. Todos com as asserções sobre o estado final.

Cobertos:
- **C6b(a)** (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/cenarios.md`, linhas 21 a 24): a barreira fica entre o `jti` e o `for update`. Pede recusa idêntica à de desafio inválido, zero sessões e nada ativado. Falha se o `desativado_em is null` sair do `for update` da seção 5.
- **C6b(b)** (linhas 25 a 29): a barreira fica depois do `for update` e antes do insert. Pede o `desativar` bloqueado, comprovado por promessa pendente ou por espera em `pg_locks`, o que é paralelo de verdade e não sequência. Depois, sessão encerrada, `SESSAO_ENCERRADA` na requisição seguinte e a linha só com id, apelido e datas. Falha se o `desativar` não começar pelo mesmo `for update`, e a seção 5 (linha 84 da techspec) agora diz que começa.
- **C6b(c)** (linhas 30 e 31): barreira antes e depois do `update ... returning mfa_versao`. No fim, nenhum segredo nem código gravado. Nas duas ordens o resultado depende do `desativado_em is null`, que o cabeçalho das travas estende a todas, e do bloqueio de linha que o `update` segura.
- **C6b(d)** (linha 32): o caso em sequência.
- Recomendações da rodada 7 aplicadas: o `for update` no `desativar` e o `jti` queimado fora da transação, que não volta (techspec, seção 5, linhas 84 e 93).
- O resto do diff na techspec é só texto (tabela de módulos, etapas, borda) e não muda o desenho.

Bloqueantes: nenhum.

Recomendações (entram como subtarefa no `/criar-tasks`):
1. **C6b(a), linha 23: "`mfa_ultimo_passo` e códigos intactos" contradiz o C6.** Com o `desativar` confirmado, os códigos somem e a linha fica só com id, apelido e datas, então a asserção não pode ser escrita como está. O que se quer provar é que o `/sessao/mfa` não consumiu nada. Troque pelo estado final do C6: linha só com id, apelido e datas, nenhum código de recuperação e zero sessões. O "não consumiu" já está provado pela recusa somada às zero sessões.
2. **C6b(c): declarar a resposta de quem perde na ordem em que o `desativar` ganha.** O `/mfa/configurar` deve ser recusado com a mesma resposta de desafio inválido, como no (a). Declarar também que o desafio de etapa `mfa` já devolvido na outra ordem, se usado depois, cai no (d).
3. **C6b(b): fixar um só jeito de provar o bloqueio.** A espera em `pg_locks` é a mais forte, porque a "promessa pendente" sozinha também passa se o `desativar` estiver só lento. Com ela, o teste falha se o `for update` sair do `desativar`.

## test-engineer · 9ª rodada · REPROVADO · 2026-09-23 14:15:49 · `tasks/prd-apresentacao-operacao/revisao-spec.md`

VEREDITO: REPROVADO. A divisão precisa ser ajustada antes de ir para o arquivo de tarefas.

Cenários exigidos: C1–C49 (com C6b, C18b e C36b), E1–E5, U1–U3, B1 e B2, mais as três recomendações da rodada 8 para o C6b.

Cobertos: todos têm tarefa, menos a parte do `sessao/email` no C33.

Bloqueantes:

(1) Cenário sem tarefa ou em duas
- **C33:** a 5.0 leva só a parte do `aceitar`. A parte do `sessao/email` não está em tarefa nenhuma; ela vai para a 6.0.
- **C37:** está dividido entre a 3.0 e a 7.0, mas a parte do `operador.mfa_configurado`, com o autor vindo da sessão, fica sem tarefa. Além disso, a parte que você deu à 3.0 repete o C4. A correção é pôr o C37 inteiro na 7.0, que é a última tarefa de rota.
- **U3 e E5:** estão como "parcial" na 1.0 e completos na 2.0. Os dois ficam só na 2.0. A 1.0 prova o que fez com um teste próprio (os hex dos tokens no CSS servido) e com o e2e do F1 verde.

(2) Dependência errada
- **C6 na 3.0:** a parte "a sessão aberta recebe `SESSAO_ENCERRADA`" precisa da `GuardaDeOperador`, que só nasce na 4.0. Essa parte vai para a 4.0, ou para a 7.0 junto do C28.
- **C7 na 3.0:** a parte "o link antigo responde igual a revogado" precisa do `convite/consultar`, que nasce na 5.0. O único parcial fica na 3.0; a resposta do link vai para a 5.0.
- **C13 na 5.0:** o `jti` só é consumido no `/mfa/configurar` e no `/sessao/mfa`, os dois da 6.0. O C13 vai para a 6.0.
- **C43 na 4.0:** o teste confere que as rotas de entrada são "exatamente as sete", mas na 4.0 não existe nenhuma, e ele nasceria vermelho. Vai para a 7.0.
- **C36, C36b (parte do `rl:ip`) e C46 (parte "as de entrada nunca produzem sessão"):** na 4.0 passam no vazio, porque ainda não há rota de entrada. Essas partes vão para a 7.0, com uma asserção de que a lista gerada tem as sete.
- **C44 na 3.0:** pelo mesmo motivo passa no vazio, sem nenhuma rota registrada. Vai para a 7.0.

(3) O que falta de domínio e de concorrência
- **C6b:** a tarefa precisa carregar as três recomendações da rodada 8, escritas nela:
  - na ordem (a), a asserção é o estado final do C6, e não "intactos";
  - na ordem (c), quando o `desativar` ganha, o `configurar` é recusado como desafio inválido;
  - na ordem (b), o bloqueio se prova pela espera em `pg_locks`.
- **C2 na 3.0:** a tarefa lista os cinco `ops:*` por nome. Cada um vira um caso, para que o teste falhe se o `comando.ts` pular um deles.
- Fora isso, a concorrência já está coberta: C3, C5, C10, C12, C18, C18b, C19, C20 e C30.

(4) Tamanho
- **6.0 grande demais:** junta a entrada, o configurar, o `/sessao/mfa` e o cookie, com cerca de 20 cenários, seis deles de corrida com barreira. Dividir em duas:
  - **6a, entrada:** `/sessao/email`, contador e origem. Cenários C15, C22–C25, C33 (`sessao/email`) e U2.
  - **6b, segundo fator:** configurar, `/sessao/mfa` e cookie. Cenários C6b, C12, C13, C14, C16–C20, C18b, C34, C32 (`mfa/configurar`) e C39 (configurar e mfa).
- **9.0 grande demais:** cinco telas, a sessão, o `BroadcastChannel`, o roteamento, a fronteira de erro, o `vite.config` e o e2e passam de 15 arquivos. Dividir em duas:
  - **9a:** chunk, sessão, casca, entrar e mfa, com E2, E3, E4, B1 (chunk) e B2.
  - **9b:** convite e configurar (QR e códigos), com o E1.
- **1.0, 2.0 e 3.0 cabem numa rodada.** Contei 22 arquivos do `apps/web` com a paleta antiga: 10 em `componentes/` (1.0) e 12 telas (2.0). A 3.0 fica no limite, com migration, schema, repository, comando e mapa LGPD.

Recomendações:
- Na 4.0, o C47 usa desafio e cookie de operador feitos por fixture. A tarefa deve dizer que a fixture assina com a mesma chave e o mesmo `typ` do código real, e na 6b o C47 roda de novo com o cookie de verdade.
- No C45, a lista de quem pode tocar as tabelas já inclui o expurgo desde a 3.0. A 8.0 confere que a entrada do expurgo nessa lista corresponde ao arquivo real.
- A 8.0 depende só da 3.0 (tabelas) e da 7.0 (sessão encerrada), e pode andar em paralelo com a 9a e a 9b.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/revisao-spec.md

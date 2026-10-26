# Achados das revisões — `tasks/correcoes/2026-10-26-material-sem-licenca-perto-do-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-26 12:58:18 · `tasks/correcoes/2026-10-26-material-sem-licenca-perto-do-prazo.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts:96`, `abrirMaterialPeloEndereco` agora é usado por casos que não abrem um endereço do sino (`/coordenacao/material` puro, linha 255). Duas saídas: renomear o ajudante ou ajustar o comentário dele, para que o próximo caso não use a entrada pela API e a espera fora da rede lenta sem perceber que aí não se mede o tempo de baixar.
- Esta correção registra que os casos `:137`, `:201`, `:306` e `:425` ficam entre 16 e 24 s. Isso deveria virar uma entrada no `TODO.md` ou uma correção própria, para não esperar outro censo da esteira chegar perto dos 30 s.

Só o teste e2e mudou, e o produto não. O tempo de carregar a tela Material no perfil `chromebook` deixou de ser medido neste caso, mas continua coberto pelo orçamento do build e pelos outros specs de tela. Nada nesse caminho chama provedor pago.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-26 12:58:21 · `tasks/correcoes/2026-10-26-material-sem-licenca-perto-do-prazo.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A mudança fica só no teste `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts`. Nenhum arquivo de `apps/*/src` ou `packages/*/src` foi alterado, e nenhum caminho de escrita em `Nota` foi criado ou mudado. Todos com autor humano? Não se aplica.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. O caso trata da recusa do envio de material sem licença. Não há saída de IA no fluxo.

Supervisão do tutor: ok. O tutor não é tocado.

Autonomia declarada e visível: sim. Não mudou nesta tarefa.

Bloqueantes: nenhum.

Das nove verificações, só a 6, a da auditoria, encosta nesta tarefa. A troca de `abrirMaterial` por `abrirMaterialPeloEndereco` com o novo `aguardar` muda apenas como o caso abre a tela: entra pela API e espera a lista vazia sem a rede lenta. Nenhuma asserção saiu. O caso continua provando três coisas:
- a recusa fica registrada na auditoria da escola, com motivo e licença (linhas 287 e 297);
- nenhum material é gravado no banco (linhas 286 e 296);
- o arquivo não sai do computador (linhas 283 a 285).

Mudar `antes` para opcional (`antes?.(cenario)`) não afeta os outros casos que usam o ajudante.

Recomendações:
- No comentário do ajudante (linhas 92 a 94), vale escrever que `aguardar` serve para o caso cujo assunto vem depois do carregamento. Assim ninguém o usa num caso cujo assunto é o próprio tempo de baixar na rede lenta, que é o que `carregarSemRedeLenta` já evita afirmar.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-26 12:58:25 · `tasks/correcoes/2026-10-26-material-sem-licenca-perto-do-prazo.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A mudança fica só no teste: `e2e/material.spec.ts` agora abre o caso "sem licença" pelo ajudante `abrirMaterialPeloEndereco`, que ganhou o parâmetro opcional `aguardar`. Nenhuma migration, DTO, rota, log ou código de produto mudou.

Fora da tabela de dados do docs/lgpd.md: nada. Não entrou campo novo.

Autorização por objeto: ok. Nenhuma rota foi criada ou alterada. A coordenadora vê só a própria escola, com `escolaId` vindo de `criarEquipeComSenha`, e a entrada pela API é a mesma que os casos do endereço já usavam.

Logs: limpos. A mudança não acrescenta nenhum log.

Auditoria: presente. As asserções de privacidade do caso continuam as mesmas, sob a rede do perfil:
- o corpo do pedido não leva o arquivo: `corpo?.includes('%PDF-')` tem de ser `false`;
- nenhum material é gravado: `materiaisNoBanco` devolve `[]`;
- as duas recusas ficam em `recusasNaAuditoria` (`sem_licenca`, depois `sem_declaracao`).

Só a espera da lista vazia passou para dentro de `carregarSemRedeLenta`. Nenhuma asserção saiu. A segunda mutação da tarefa, que troca `'%PDF-'` para `true`, confirma que a asserção de que o arquivo não sai do computador continua derrubando o teste.

Envio externo: nenhum. O caso não chama IA nem serviço de terceiro.

Seed/fixture: sintético. A escola, a estrutura e a coordenadora são criadas pelos ajudantes de teste, e o arquivo é o PDF de demonstração (`CAMINHO_DO_PDF_DE_DEMONSTRACAO`), com texto nosso. O título "Química 2 — Capítulo 7: Estequiometria" não identifica ninguém.

Bloqueantes: nenhum.

Recomendações:
- Este caso não passa mais pela entrada pela tela nem pelo menu. A tarefa diz que isso continua provado nos outros casos de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts` e em `e2e/mfa.spec.ts`. Não é ponto da regra 20, mas convém o `test-engineer` confirmar que o caminho pelo menu ainda tem um caso que o cubra.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts` (o ajudante nas linhas 89 a 112 e o caso a partir da linha 253)
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-26-material-sem-licenca-perto-do-prazo.md`

## revisor-geral · 1ª rodada · APROVADO · 2026-10-26 12:58:25 · `tasks/correcoes/2026-10-26-material-sem-licenca-perto-do-prazo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A correção só mexe em teste. Não muda produto nem contrato, e não diverge da arquitetura.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

O que conferi:
- **Asserções:** o caso `sem licença…` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts:253`) mantém todas as asserções de antes: aviso antes do envio, `%PDF-` ausente no corpo, nada em `materiais`, recusa na auditoria com os dois motivos, as duas passadas do axe e a reabertura do diálogo.
- **Rede lenta:** só a entrada pela API e a espera de `Nenhum material ainda` rodam sem ela, dentro de `carregarSemRedeLenta`. O bloco `finally` de `e2e/__fixtures__/perfis.ts:99` devolve a rede do perfil antes de o diálogo abrir. A recusa e o envio continuam medidos sob a rede e a CPU do perfil.
- **Outros casos:** a entrada pela tela e o menu com `hasTouch` continuam provados nos casos que ainda usam `abrirMaterial`: linhas 144, 234, 319, 337, 363, 396, 449, 472 e 542. Os dois casos que já usavam `abrirMaterialPeloEndereco` (linhas 513 e 527) não mudam de comportamento: `aguardar` é opcional, e `antes?.()` aceita a função que eles passam.
- **Mutações:**
  - A primeira, com o endereço trocado para `/coordenacao/turmas`, quebra na espera da lista vazia.
  - A segunda, com `%PDF-` esperado como verdadeiro, quebra a asserção central do caso.
- **Tamanho:** a correção não invade os outros casos lentos do arquivo. Deixa de fora, de forma explícita, `:137`, `:201`, `:306`, `:425` e `:527`.

Recomendações:
- O nome `abrirMaterialPeloEndereco` (`e2e/material.spec.ts:96`) agora também serve a um caso cujo assunto não é o endereço. Um nome que diga "entrada pela API", ou a primeira frase do JSDoc (linhas 89–95) revista para dizer que o ajudante deixou de ser só dos casos do `?material=`, evitaria que o próximo leitor pense que esse caso testa o link do sino.
- A chamada passa `undefined` como argumento posicional em `abrirMaterialPeloEndereco(page, request, undefined, …)`. Com dois parâmetros opcionais seguidos, um objeto de opções (`{ antes, endereco, aguardar }`) leria melhor. Não bloqueia.

## test-engineer · 1ª rodada · APROVADO · 2026-10-26 12:58:41 · `tasks/correcoes/2026-10-26-material-sem-licenca-perto-do-prazo.md`

VEREDITO: APROVADO

Cenários exigidos: a correção só mexe em teste e só no tempo. Não cria regra nova, então nenhum cenário de negócio novo é exigido. O que cabia conferir:
- O caso `sem licença…` continua provando tudo o que provava: o diálogo diz "Envio recusado" e por quê, o PDF não vai no pedido, nada vira material, a recusa fica na tabela e na auditoria, o segundo motivo (sem declaração), reabrir o diálogo, dispensar, o axe e a largura.
- A rede lenta do perfil volta antes de a parte que o caso prova começar.
- O que o caso deixou de exercitar (entrada pela tela, menu, URL `/coordenacao/material`) continua provado em outro lugar.

Cobertos:
- Asserções iguais. A única linha que saiu do corpo, a espera de `Nenhum material ainda` com `PRAZO_DA_ENTRADA_MS`, foi para o parâmetro `aguardar` com o mesmo locator e o mesmo prazo (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts:260`). Da linha 262 à 315 nada mudou.
- A rede volta: `carregarSemRedeLenta` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/perfis.ts:96-101`) devolve a rede do perfil no `finally`. Por isso abrir o diálogo, os dois envios, a conferência do corpo do pedido e as passadas do axe correm sob a rede do perfil e a CPU ×4. Só a carga inicial e a espera da lista ficam sem limite, como o documento diz.
- O endereço: `entrarPelaApiComSegundoFator` termina em `page.goto(endereco)` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/segundo-fator.ts:95`), e a lista "Materiais da escola" visível só existe na tela Material. Isso cobre o `toHaveURL` que o caso perdeu ao trocar de `abrirMaterial`.
- A entrada pela tela e o menu Material continuam provados pelos outros casos do arquivo, que ainda usam `abrirMaterial` (`:144`, `:234`, `:319`, `:337`…), e por `mfa.spec.ts`.
- `antes` virou opcional e é chamado com `antes?.()`. Os casos que já passavam `antes` não mudam.
- Sem `.skip`, sem `.only`, sem teste comentado, sem mock novo.
- IA, isolamento e concorrência: não se aplicam, porque nenhuma regra nem nenhum código de produção mudou.

Bloqueantes: nenhum.

Recomendações:
1. As duas mutações do documento mexem no próprio teste (o endereço do ajudante e o `toBe(false)` virado em `toBe(true)`), e não na regra. Elas só mostram que o caso roda até essas linhas, não que ele prova a recusa. Como a correção não toca `apps/*/src` nem `packages/*/src`, o RF17 não exige mutação. Vale escrever `**Sem mutação:** correção só de teste, asserções inalteradas` ou declarar o motivo junto dos blocos, para a validação não ler isso como prova de regra.
2. A primeira mutação (`/coordenacao/turmas`) fica vermelha por estouro do `PRAZO_DA_ENTRADA_MS` dentro de `aguardar`, e não por uma asserção do assunto do caso. É aceitável para provar que a espera foi para o lugar certo, mas o motivo do vermelho deveria constar no documento.
3. O caso não confere mais a URL nem o título da página. Isso é coberto indiretamente pela região "Materiais da escola". Se um dia o endereço `/coordenacao/material` redirecionar para outra tela que também tenha essa região, o caso não perceberia. Um `await expect(page).toHaveURL(/\/coordenacao\/material$/)` em `aguardar` não custaria tempo.
4. Os casos vizinhos de 16 a 24 s (`:137`, `:201`, `:306`, `:425`, na numeração do documento) ficaram de fora, como o próprio documento registra. O `:318` (`depois da recusa…`) tem a mesma forma do caso corrigido (`abrirMaterial` mais a espera da lista sob rede lenta) e é o próximo candidato a repetir o sintoma no censo.

Não rodei o Playwright. O portão da tarefa já mede o tempo e aplica as mutações, e a auditoria se baseou no `git diff` e na leitura dos ajudantes.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-26 13:07:37 · `tasks/correcoes/2026-10-26-material-sem-licenca-perto-do-prazo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A mudança é só de teste, sem contrato nem produto tocado.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

As três recomendações da 1ª rodada foram aplicadas.
- **JSDoc do ajudante** (`e2e/material.spec.ts:89-96`): diz agora que a entrada é pela API, que o ajudante já não serve só aos casos do `?material=` e que `aguardar` não é para caso cujo assunto seja o tempo de baixar.
- **`toHaveURL` dentro de `aguardar`** (`e2e/material.spec.ts:261-264`): devolve a conferência do endereço que o caso tinha perdido. Roda dentro de `carregarSemRedeLenta`, por isso não pesa no tempo sob a rede lenta.
- **Parágrafo das mutações** no documento da tarefa: diz o que os blocos provam e o que não provam. Também explica por que o primeiro bloco fica vermelho, que agora é o `toHaveURL` e não mais o estouro do prazo.

A linha nova do `TODO.md` tem dono e origem, e cobre os casos de 16 a 24 s que a correção deixou de fora, como pediram o `infra-guardian` e o `test-engineer`. A tabela "Recomendações sem aplicar" dá o destino de cada item. O objeto de opções foi recusado e o motivo está escrito.

Recomendações:
- No documento da tarefa, a tabela "Recomendações sem aplicar" e a seção "Correção" apontam os chamadores do ajudante em `:513` e `:527`, e a `segunda pessoa…` em `:527`. Depois do diff, esses casos estão em `e2e/material.spec.ts:515`, `:530` e `:543`. Os outros números do documento seguem a numeração do censo da esteira. Os desta tabela dizem que falam do arquivo atual e já não batem com ele. Vale corrigir ou dizer que a numeração é a do censo.
- O segundo bloco de mutação troca o `toHaveURL` esperado por `/coordenacao/turmas`. Ele só mostra que a asserção que o próprio diff acabou de escrever pode falhar. Não acrescenta prova ao primeiro bloco, que já fica vermelho por ela. Pode sair sem perda.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/TODO.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-26-material-sem-licenca-perto-do-prazo.md`

## test-engineer · 2ª rodada · APROVADO · 2026-10-26 13:07:45 · `tasks/correcoes/2026-10-26-material-sem-licenca-perto-do-prazo.md`

VEREDITO: APROVADO

Cenários exigidos: esta é uma correção só de teste, feita por tempo. O caso `sem licença…` precisava continuar provando as mesmas regras: o diálogo diz "Envio recusado" e o motivo, o arquivo não sai do computador, nada vira material, e a recusa fica na tabela e na auditoria, com os dois motivos (`sem_licenca` e `sem_declaracao`). A espera nova, que agora roda fora da rede lenta, tinha de garantir que a tela é mesmo a Material vazia. Os outros dois casos que usam o ajudante não podiam mudar de comportamento.

Cobertos:
- **Asserções intactas.** Nenhuma asserção do caso saiu. As de `e2e/material.spec.ts:269-319` são as mesmas de antes, inclusive o corpo do pedido sem `%PDF-` (:287-289), `materiaisNoBanco` vazio e `recusasNaAuditoria` (:290-291, :300-301).
- **A espera nova olha o lugar certo.** O `toHaveURL(/\/coordenacao\/material$/)` dentro de `aguardar` (:262) confere a tela antes da lista vazia. O ajudante `entrarPelaApiComSegundoFator` (`e2e/__fixtures__/segundo-fator.ts:85-97`) só faz `goto` e não afirma o endereço. Por isso a mutação 1 (trocar o endereço por `/coordenacao/turmas`) fica vermelha no `toHaveURL`, que é o motivo certo, e não num erro do ajudante.
- **A mutação 2 prova que o `toHaveURL` está vivo**, e a 3 prova que a conferência do corpo do pedido pode falhar. O documento agora diz que as mutações não provam a regra da recusa, e isso está correto: a regra continua provada pelas asserções inalteradas. O RF17 não exige mutação aqui, porque nada mudou em `apps/*/src` nem em `packages/*/src`.
- **Os outros chamadores não mudam.** Os casos em :515 e :530 continuam passando o `antes`. A troca para `antes?.()` e o `aguardar` opcional não alteram o que eles fazem.
- **TODO.md.** A linha nova registra os casos entre 16 e 24 s e a `segunda pessoa…`, citados pelo nome, com dono e o caminho a seguir.
- **Sem desvios.** Nenhum `.skip`, nenhum teste comentado e nenhum mock de coisa nossa. Não há IA nem concorrência envolvidas.

Bloqueantes: nenhum.

Recomendações:
- Os números de linha no documento da tarefa estão velhos depois do diff. As seções "Fora desta correção" e "Recomendações sem aplicar" citam `:137`, `:201`, `:306`, `:425`, `:513` e `:527`, que agora são :144, :208, :322, :441, :517/:531 e :543. A linha do TODO.md cita os casos pelo nome e está certa. Vale citar pelo nome também no documento, ou atualizar os números.
- O `undefined` posicional em :259 continua lá. A recusa de trocá-lo por objeto de opções está registrada na tabela e não bloqueia.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/TODO.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-26-material-sem-licenca-perto-do-prazo.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/segundo-fator.ts

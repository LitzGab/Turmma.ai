# Achados das revisões — `tasks/correcoes/2026-10-26-tres-casos-do-e2e-perto-do-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-26 02:11:09 · `tasks/correcoes/2026-10-26-tres-casos-do-e2e-perto-do-prazo.md`

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
- A tarefa só mexe em teste e2e. Não muda código de produção, rota, fila, query, gateway de IA nem migration, então os itens 1 a 10 não se aplicam. Não há chamada a provedor pago. Os dois casos do material agora entram pela API com usuário próprio, criado por `criarEquipeComSenha`. Assim o limite de tentativas de entrada por usuário não é dividido entre casos, e o limite por escola também não, porque cada caso cria a própria escola.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts:514` (caso "o id que a escola não tem"), o id do endereço é um UUID fixo que não existe em escola nenhuma. Ele prova "inexistente", mas não "de outra escola". Fica registrado para o `tenancy-guardian` decidir se o caso deveria usar o id de um material de uma segunda escola. Isso já era assim antes desta correção e não foi alterado por ela.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/segundo-fator.ts:92`, `entrarPelaApiComSegundoFator` calcula o código do passo seguinte (`codigoDoAutenticador(segredo, 30)`). Agora os dois casos do material também passam por esse ajudante. Se o censo mostrar falha esporádica de "o segundo fator pela API não abriu a sessão", olhe primeiro esse cálculo.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-26 02:11:12 · `tasks/correcoes/2026-10-26-tres-casos-do-e2e-perto-do-prazo.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A correção muda só dois testes e2e, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/convite.spec.ts` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts`. Os fixtures que eles usam (`criarConviteDeProfessor`, `criarEquipeComSenha`, `montarEstruturaNoBanco`, `criarMaterialNoBanco`, `entrarPelaApiComSegundoFator`) criam convite, equipe, estrutura, material e sessão. Nenhum grava Nota. Todos com autor humano? Não se aplica.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhum fluxo de saída de IA foi tocado.
Supervisão do tutor: ok. O tutor não foi tocado.
Autonomia declarada e visível: sim, sem mudança. A governança não foi tocada.
Bloqueantes: nenhum
Recomendações:
- O produto não mudou e a cobertura ficou a mesma. O laço de `convite.spec.ts:414` virou um caso por volta, com corpo e asserções iguais. Os dois casos de `material.spec.ts` (o painel que abre pelo endereço e o id que a escola não tem) agora entram pela API com o segundo fator já configurado (`e2e/__fixtures__/segundo-fator.ts:85`). As asserções sobre o `?material=` são as mesmas. Nada disso toca a regra 70: nota, discursiva e redação (D55), tutor, autonomia de agente, indicador de professor, auditoria de IA, inferência emocional ou vigilância.
- O único ponto perto de regra está no caso do id que a escola não tem: o painel não abre para o id de outra escola. A asserção continua igual (`getByRole('dialog')` com contagem 0, e a linha da escola conferida depois do endereço). É assunto do `tenancy-guardian`, e não houve regressão.
- Não houve fotos, porque a correção não tem tela.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-26 02:11:14 · `tasks/correcoes/2026-10-26-tres-casos-do-e2e-perto-do-prazo.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. A correção não cria nem altera migration ou schema.

Queries verificadas: nenhuma. A correção não muda repository, service nem endpoint. Só `e2e/convite.spec.ts` e `e2e/material.spec.ts` mudaram. Conferi também o que os testes passam a usar: `entrarPelaApiComSegundoFator` (`e2e/__fixtures__/segundo-fator.ts`) entra com e-mail, senha e desafio de MFA, e não manda `escolaId` à API. `carregarSemRedeLenta` (`e2e/__fixtures__/perfis.ts:93`) só muda a emulação de rede.

Teste de isolamento: presente e efetivo. O caso que prova a regra entre escolas é o da coordenadora de B abrindo `/coordenacao/material?material=${materialDeA}` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts:560`). A correção não o tocou, e ele continua afirmando lista vazia, nenhum diálogo e nenhuma menção à escola A. O caso do id que a escola não tem (`e2e/material.spec.ts:513-525`) mantém as mesmas asserções: a linha da própria escola aparece e `dialog` tem contagem 0. A entrada pela API não muda o que o caso prova sobre o `?material=`.

Bloqueantes: nenhum.

Recomendações:
- O caso "o id que a escola não tem" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts:513`) usa um UUID fixo que não existe em escola nenhuma, e não o id de material de outra escola. O nome promete mais do que o caso prova. O cenário entre escolas está só no caso da linha 560. Vale trocar o título para "id que não existe" ou citar o caso da 560 num comentário. Isso já era assim antes desta correção.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-26 02:11:33 · `tasks/correcoes/2026-10-26-tres-casos-do-e2e-perto-do-prazo.md`

VEREDITO: APROVADO

Escopo: respeitado. Mudaram só os três casos do diagnóstico (seção 3, risco imediato), nos dois arquivos de teste. O produto não foi tocado e os outros 36 casos ficaram de fora, como o documento declara.

Aderência à Tech Spec: ok. É uma correção só de teste, sem seção da Tech Spec envolvida. No material, a correção foi além dos passos 1 e 2 do diagnóstico e passou a entrar pela API com `entrarPelaApiComSegundoFator`. A divergência está registrada e medida no documento da correção: o passo 2 sozinho deixou os casos em 24,7 e 25,2 s, e entrar pelo endereço ainda pela tela deixou em 21,5 e 21,9 s. O ajudante já existia e já é usado em `privacidade.spec.ts` e `coordenacao-introducao.spec.ts`. Divergência decidida às claras, não em silêncio.

Portão local: carimbo válido. O `conferir` deu "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".

Bloqueantes: nenhum.

- A cobertura se mantém. As asserções dos três casos do convite são as mesmas, agora com 30 s para cada volta.
- Nos dois casos do material, o `goto` com `?material=` já era uma carga inteira da aplicação. Por isso o caminho pelo menu antes dele não provava nada desses casos, e a entrada pela tela continua provada nos outros casos de `material.spec.ts` e em `mfa.spec.ts`.
- As duas mutações fazem sentido: abrir sem o `?material=` derruba o painel visível, e o token do link anterior derruba o `toEqual`.
- O id "que a escola não tem" é um UUID fixo que nenhuma escola tem, igual a antes.

Recomendações:
- `e2e/convite.spec.ts:414`: `voltas.forEach((volta) => test(...))` é um segundo jeito de gerar casos por parâmetro. O projeto usa `for (const x of ...) { test(...) }` em `areas.spec.ts:255`, `casca.spec.ts:737`, `pecas-ia.spec.ts:442`, `tokens.spec.ts:298` e outros. O motivo é uma limitação do portão da duração, que conta como parte de um caso tudo o que fica entre o `test(` dele e o seguinte. O certo é corrigir essa contagem do portão, para que o `for` do padrão volte a ser usado aqui. Fica para a retro.
- `e2e/convite.spec.ts:414`: a linha do `forEach` com o título inteiro ficou muito longa e difícil de ler. Pôr o título numa constante ou quebrar a linha ajuda, sem mudar a contagem do portão.
- `e2e/material.spec.ts:88-93`: o comentário de `abrirMaterialPeloEndereco` cita a medida ("levavam o caso a 27 dos 30 s"). Esse número envelhece, e o histórico já está no documento da correção. No comentário basta o porquê.

Arquivos revisados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-26-tres-casos-do-e2e-perto-do-prazo.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/convite.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/ordens/diagnostico-censo.md

## test-engineer · 1ª rodada · APROVADO · 2026-10-26 02:13:24 · `tasks/correcoes/2026-10-26-tres-casos-do-e2e-perto-do-prazo.md`

VEREDITO: APROVADO

Cenários exigidos (correção só de teste, sem cláusula nova de produto):
- **Mesma cobertura antes e depois.** As três voltas da consulta atrasada (`vale`, `nao_vale`, `cai`) continuam provadas, uma por caso, com as mesmas asserções. Os dois casos do painel pelo endereço (`?material=` que existe e id que não existe) também ficam com as mesmas asserções.
- **Cada mutação fica vermelha pelo motivo certo.** No material, o endereço sem `?material=` não abre o painel. No convite, a volta `cai` tem a asserção do token do aceite.
- **Isolamento continua provado.** É o caso `segunda pessoa…` (`e2e/material.spec.ts:527`, não tocado).
- **Prazo e estabilidade.** O ganho de tempo vem de menos trabalho por caso. Não depende de máquina folgada.
- **Nada escondido.** Sem `.skip` nem `.only`, e nenhum mock novo encobre regra.

Cobertos:
- **`e2e/convite.spec.ts:414`:** `voltas.forEach` gera os três casos `recomeço, consulta atrasada (vale|nao_vale|cai)`. O corpo é igual ao do laço anterior: a tela continua a do link novo, sem a escola anterior, sem alerta, e o aceite leva `novo.token`. Os títulos antigos citados em `tasks/prd-apresentacao-escola/14_task.md:279-280` ("recomeço, consulta atrasada", voltas `vale` e `nao_vale`) ainda batem pelo prefixo. As mutações da guarda em `Convite.tsx` continuam pegas, cada uma pelo caso da sua volta.
- **`e2e/material.spec.ts:499`:** o painel abre pelo endereço e o Esc tira o id. A entrada agora é pela API com segundo fator, já existente (`e2e/__fixtures__/segundo-fator.ts:85`), dentro de `carregarSemRedeLenta` (`e2e/__fixtures__/perfis.ts:93`). A afirmação sobre o painel é a mesma.
- **`e2e/material.spec.ts:514`:** com o id inexistente, a linha aparece e nenhum diálogo abre. As asserções são as mesmas.
- **Entrada pela tela e menu Material:** continuam provados nos outros casos do arquivo e em `e2e/mfa.spec.ts`.
- **Conferido por mim:**
  - `npx tsc --noEmit -p e2e/tsconfig.json` passou limpo.
  - `npx playwright test e2e/material.spec.ts e2e/convite.spec.ts -g "pelo endereço|no endereço, não abre|consulta atrasada" --workers 2` deu 12 de 12 verdes. No celular foram 8,4 a 9,3 s e no chromebook 7,6 a 8,2 s, o que bate com a tabela do documento.
  - O `:527` levou 34,8 s dos 90 s de `test.slow()`.

Bloqueantes: nenhum.

Recomendações:
1. **Mutação do convite.** O bloco do convite muta a própria asserção do teste (`novo.token` → `anterior.token`), e não o produto. Isso só prova que a linha é alcançada na volta `cai`. Seria mais forte mutar a guarda da consulta atrasada em `apps/web/src/paginas/Convite.tsx`, como na `14_task.md:279-280`.
2. **Caso sem mutação.** O caso `e2e/material.spec.ts:514` (id que não existe) ficou sem bloco de mutação. Não é cláusula nova, então não bloqueia. Um bloco que trocasse o id inexistente por `semTextoId` mostraria que o caso fica vermelho quando um diálogo abre.
3. **Nome do caso `:514`.** O título "o id que a escola não tem" sugere isolamento, mas o UUID não existe em escola nenhuma. Quem prova o isolamento é o `:527`. Vale deixar o título claro sobre isso, para ninguém achar que o `:514` cobre isolamento.
4. **`unroute` sobrando.** O `page.unroute(ROTA_CONSULTAR, segurar)` no fim de cada volta (`e2e/convite.spec.ts`, última linha do caso) não é mais necessário, porque cada caso tem página nova. Não faz mal, mas pode sair.
5. **Dívida que segue registrada.** Os outros 36 casos entre 67% e 90% do prazo, citados no documento como dívida da develop, continuam fora desta correção.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/convite.spec.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-26-tres-casos-do-e2e-perto-do-prazo.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-26 02:25:30 · `tasks/correcoes/2026-10-26-tres-casos-do-e2e-perto-do-prazo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (a correção só mexe em teste e2e; o produto não muda)
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

O que conferi do diff da 1ª para a 2ª rodada:
- **Título numa constante, em `e2e/convite.spec.ts`.** O `test(` continua na linha do `forEach`, e a constante fica no topo do arquivo, fora do `describe`. Assim nada entra entre dois `test(` e a contagem do portão da duração não muda. O começo do título ("recomeço, consulta atrasada") continua igual, e é ele que o bloco de mutação do documento (`consulta atrasada .cai.`) e o `tasks/prd-apresentacao-escola/14_task.md` citam.
- **`page.unroute` removido.** Cada volta é um caso com página nova, então essa limpeza não fazia falta. `segurar` e `ROTA_CONSULTAR` continuam em uso (`e2e/convite.spec.ts:422` e `:428`).
- **Título novo em `e2e/material.spec.ts`.** "o id que não existe" já não promete isolamento entre escolas. As duas citações do título no documento da correção foram atualizadas. O título antigo só aparece em `tasks/correcoes/achados/` e no `indice.md`, que são o registro da 1ª rodada e não devem ser alterados.
- **Comentário de `abrirMaterialPeloEndereco`.** Ficou só o porquê, sem a medida de tempo, e a frase sobre o `antes` foi mantida.
- **Recomendação do `for` no lugar do `forEach`.** Está registrada em "Recomendações sem aplicar", com destino na retro e motivo plausível: a causa está em `tools/ci/duracao-do-e2e.ts`, fora do escopo desta correção.

Recomendações: nenhuma nova. A do `forEach` continua para a retro, como o documento já registra.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/convite.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-26-tres-casos-do-e2e-perto-do-prazo.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-26 02:25:37 · `tasks/correcoes/2026-10-26-tres-casos-do-e2e-perto-do-prazo.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta rodada não traz regra nova. A correção só mexe nos testes. O que precisava conferir:
- os quatro itens da ordem r1 foram aplicados sem mudar o que os casos provam;
- os dois blocos de "Mutações" continuam batendo com o código e com os títulos;
- as recusas registradas têm motivo.

**Cobertos:**
- **Item 1 (título do caso do id inexistente):** o título agora é `'o id que não existe, no endereço, não abre nada'` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/material.spec.ts:514`). Ele não promete mais isolamento entre escolas, que segue provado pelo caso `segunda pessoa…`, intocado. O documento da correção foi atualizado nas duas citações. O único lugar com o título antigo é `tasks/correcoes/achados/indice.md:684`, que é registro da rodada anterior e deve ficar como está.
- **Item 2 (remoção do `page.unroute`):** pode sair sem risco. Quando o caso termina, `liberar()` já rodou e a resposta segurada já foi esperada (`await (await respostaDoAnterior).finished()`). Então nenhum pedido fica parado no `segurar`. A rota só deixa passar o resto até a página fechar, e cada caso abre página nova. As asserções não mudaram.
- **Item 3 (título em constante):** o título foi para a constante `tituloDaConsultaAtrasada` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/convite.spec.ts:19-20`). O texto gerado é idêntico ao anterior, então o filtro do bloco de mutação (`recomeço, consulta atrasada .cai.`) continua achando o caso. O `test(` segue na linha do `forEach` (`:416`), e a contagem do portão da duração não muda.
- **Item 4 (comentário):** o comentário de `abrirMaterialPeloEndereco` explica o porquê sem citar a medida, e a frase sobre o `antes` ficou.
- **Blocos de mutação:** as linhas que os dois blocos alteram (`carregarSemRedeLenta(... endereco(cenario))` e o `toEqual({ token: novo.token })`) e o contexto em volta delas estão iguais no código. Não há cláusula nova, então nenhum bloco novo é exigido.
- **Minhas duas recomendações recusadas** (mutar a guarda em `Convite.tsx`, e um bloco de mutação para o caso do id inexistente): os motivos procedem. A correção não toca o produto, as mutações da guarda continuam pegas pelos casos de cada volta (`14_task.md`), e o caso do id inexistente só mudou a forma de entrar, com as mesmas asserções.
- Não há `.skip`, teste comentado, mock que esconda a regra, nem chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
- Não rodei os testes nesta rodada, porque o diff só mexe em nome, comentário e limpeza. Quem prova que tudo está verde é o portão da tarefa, que roda os dois blocos de novo.
- O documento ainda chama os casos do material de `:478` e `:491`, linhas que andaram (o caso do id inexistente está agora em `:514`). Como registro histórico da medida não atrapalha, mas citar pelo nome envelhece menos.

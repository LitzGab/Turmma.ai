# Achados das revisões — `tasks/correcoes/2026-10-23-agentes-suspensao-intermitente.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-23 17:37:22 · `tasks/correcoes/2026-10-23-agentes-suspensao-intermitente.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta correção. A mudança só mexe em `e2e/__fixtures__/casca.ts` e `e2e/mfa.spec.ts`, e nenhum dos dois grava `Nota`, nem em seed, job, importação ou webhook. Todos com autor humano? Não se aplica, porque a correção não abre caminho novo.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. Nenhum fluxo de saída de IA foi alterado.
Supervisão do tutor: ok. O tutor não foi tocado.
Autonomia declarada e visível: sim, e sem mudança. O caso `e2e/agentes.spec.ts:230`, que prova a suspensão por função na escola (D9, D60), ficou como estava. Continua conferindo no banco quem suspendeu e que não se cria uma segunda suspensão. A correção só torna mais confiável a entrada da coordenação que ele usa.

Bloqueantes: nenhum.

O que conferi:
- **API e web:** a correção não altera nenhum arquivo de `apps/` nem de `packages/`. `docs/regulacao.md` e a regra 70 também não mudaram.
- **Repetição na ativação:** a nova tentativa fica só na fixture de teste, em `ativarOSegundoFator` (`e2e/__fixtures__/casca.ts:219-229`), e vale só para a ativação do segundo fator da coordenação. Ela não toca em nota, correção, tutor, autonomia, indicador de professor nem decisão sobre aluno.
- **Segunda recusa:** ela não é ignorada. O teste para com um erro que diz o que a tela mostrava.
- **Caso novo em `e2e/mfa.spec.ts`:** ele simula a recusa só no navegador e não grava nada fora do que a entrada normal já grava.
- **Supervisão, vigilância e medição do professor (itens 7 a 9):** nada nesta correção muda o que o professor vê, mede o uso de ninguém ou monta indicador de professor.

Recomendações: nenhuma da regra 70.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/e2e/__fixtures__/casca.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/e2e/mfa.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/e2e/agentes.spec.ts (caso da linha 230, sem alteração)
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/correcoes/2026-10-23-agentes-suspensao-intermitente.md

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-23 17:37:28 · `tasks/correcoes/2026-10-23-agentes-suspensao-intermitente.md`

VEREDITO: APROVADO
Tela vista: não. A correção só altera `e2e/` e nenhum arquivo de `apps/web`, então não há foto. Conferi pelo código se a fixture bate com o que a web renderiza.
Estados: ok. Não há estado novo de tela. Os de carregando e erro da tela de ativação já existem em `apps/web/src/paginas/ConfigurarMfa.tsx` e não foram tocados.
Acessibilidade: ok. O aviso de recusa já é `role="alert"` (`ConfigurarMfa.tsx:134`) e o link é "Ir para a entrada" (`ConfigurarMfa.tsx:180`). A fixture usa esses papéis e nomes, o que reforça o contrato de acessibilidade em vez de depender de seletor de CSS.
Chromebook fraco: o desvio de tempo é bom. A espera cega de 90 s vira, no pior caso, 2 × 20 s com o erro certo.
Celular: ok. A fixture usa `tap` quando `hasTouch` e vale para os dois projetos. O link tem `min-h-11`.
Ação oficial protegida: sim. Nada oficial é tocado. A repetição só reenvia a ativação do segundo fator, e a própria correção diz que a recusa por Redis parado vem antes de gastar o código e o desafio.

O que conferi contra a web:
- O texto do aviso usado pela fixture é `mensagemDoSegundoFator('NAO_AUTENTICADO')`, o mesmo que a tela mostra em `ConfigurarMfa.tsx:135`. O texto é "Código incorreto ou já usado. Confira o código que o aplicativo mostra agora e tente de novo.", que diz o que fazer.
- O caso novo responde 401 com `erro.codigo = 'NAO_AUTENTICADO'`. O cliente tira o código desse formato (`apps/web/src/api/cliente.ts:46`) e a tela escolhe a mensagem por ele. O texto da API no corpo é ignorado, como o comentário do teste diz.
- Cada tentativa começa limpando o aviso: `enviar` chama `definirFalha(undefined)` de forma síncrona no envio. Por isso `ativou.or(recusa)` não casa com o aviso da tentativa anterior, e a segunda tentativa não falha à toa.
- A mutação `TENTATIVAS_DA_ATIVACAO = 1` faz a fixture lançar na primeira recusa. O caso novo, que recusa uma vez e exige a entrada, fica então vermelho. A mutação prova a regra.

Bloqueantes: nenhum

Recomendações:
- `e2e/mfa.spec.ts:147-148`: falta uma linha em branco entre o fim do caso novo e o `test('cinco códigos errados…')` seguinte. É só formatação, e o lint ou o prettier devem pegar.
- O passo seguinte da mesma fixture (o código do segundo fator na entrada) pode ser recusado pela mesma causa. A correção declara isso, e ele falha em 20 s com o erro certo. Vale registrar para o `/retro`, caso apareça na esteira.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 17:38:07 · `tasks/correcoes/2026-10-23-agentes-suspensao-intermitente.md`

VEREDITO: APROVADO

**Cenários exigidos:**
1. Caminho feliz: a ativação passa na primeira tentativa e a coordenação entra.
2. O Redis de fila não responde, a API recusa o código certo uma vez, a fixture tenta de novo e a coordenação chega ao Painel.
3. A segunda recusa não é engolida: a fixture falha cedo, dizendo o que a tela mostrava, e não espera o link por 90 s.
4. A tentativa nova não esconde uma regressão real, como a ativação que falha sempre na primeira vez.
5. Permissão e isolamento entre escolas não se aplicam: a correção mexe só em fixture e2e, sem rota, repositório ou dado de escola.

**Cobertos:**
- **Cenário 2:** o caso novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/e2e/mfa.spec.ts:126`.
  - Ele usa a fixture de verdade, recusa o primeiro `POST /v1/conta/mfa/ativar` com 401 `NAO_AUTENTICADO` e verifica o resultado, não só que o código rodou: `esperarPainel` e `pedidosDeAtivacao === 2`. Isso prova uma tentativa a mais, exatamente.
- **A mutação** (`TENTATIVAS_DA_ATIVACAO = 2 → 1`) cobre a cláusula nova, que é o laço de tentativa.
  - Fica vermelha pelo motivo certo: com uma tentativa só, a primeira recusa chega ao `throw`.
- **A premissa da correção confere com a API.** Em `apps/api/src/sessao/mfa/mfa.service.ts:81-89`, `#desafioLivre` vem antes de `consumir`. A recusa por falta do Redis não gasta o código nem o desafio, então a falsificação na rede (`page.route`) reproduz o que a API faz.
- **Não há corrida com o aviso antigo.** `ConfigurarMfa.tsx:104` limpa o aviso (`definirFalha(undefined)`) já no envio. A espera `ativou.or(recusa)` da segunda volta não pega o aviso da primeira.
- **Cenário 4 coberto.** A entrada em uma tentativa só continua provada sem a nova tentativa, em `e2e/mfa.spec.ts:41-60` e em `e2e/__fixtures__/segundo-fator.ts:40-42`.
- **Itens 4 e 5 da auditoria:** nenhum `.skip`, nenhum teste comentado e nenhum mock de código nosso. A falsificação é só da resposta de rede, e a justificativa está escrita: parar o Redis de verdade derrubaria os outros 187 casos que rodam junto. Não há IA envolvida.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **O `throw` que diz o que a tela mostrava não tem teste nem mutação** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/e2e/__fixtures__/casca.ts:228`). Se ele sair, o caso ainda falha, mas em 90 s e com o erro mudo do sintoma. Melhorar o diagnóstico é parte do que a correção promete. Um caso com `test.fail()` e duas recusas forçadas, conferindo a mensagem, provaria isso. Não bloqueia porque a regra que a correção conserta, a tentativa nova, está provada.
2. **O `test.slow()` do caso novo** (`e2e/mfa.spec.ts:127`) não tem motivo escrito.
   - O verde leva 13 s, e ele não muda o prazo que o portão confere, que é o do HEAD: 30 s, com teto de 15 s.
   - Com 13 s, o caso fica perto do teto de metade do prazo que `tools/ci/duracao-do-e2e.ts` cobra do caso alterado.
   - Vale tirar o `test.slow()` ou escrever por que ele está ali.
3. **Fica de fora sem teste o passo seguinte da mesma fixture**, o código do segundo fator na entrada. O Redis lento pode recusar ali pela mesma causa. O documento já diz que falharia em 20 s com o erro certo; registrar para o `/retro`, caso volte na esteira.

Não rodei o e2e: ele precisa da pilha no ar, e a mutação já foi provada pelo portão da tarefa.

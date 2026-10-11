# Achados das revisões — `tasks/correcoes/2026-10-11-pedidos-sem-ano-em-curso.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-11 01:48:31 · `tasks/correcoes/2026-10-11-pedidos-sem-ano-em-curso.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** numa escola sem ano letivo em curso, a coordenação busca, registra, lista e abre o pedido, e consegue corrigir o nome, concluir e cancelar a eliminação agendada.
- **Borda 1, a virada de ano:** a coordenação encerra o ano pela API e o seguinte ainda não abriu. Os pedidos registrados antes continuam alcançáveis.
- **Borda 2:** com o ano encerrado, a leitura não pode cair num ano qualquer. Um vínculo que ficou `confirmado` no ano encerrado não aparece como turma nem como disciplina.
- **Borda 3:** escola que nunca teve ano, vista na tela (e2e).
- **Permissão:** sem sessão, a chamada continua falhando. `exigirEscolaDoContexto()` ainda é chamado antes de tudo.
- **Isolamento:** a escola A, sem ano, e a escola B, com o ano dela em curso, não alcançam o pedido uma da outra.
- **Concorrência:** não se aplica. A correção não cria nenhuma operação nova que possa rodar duas vezes ao mesmo tempo.

**Cobertos:**
- **Caminho feliz e virada:** `apps/api/test/pedido-titular.int.test.ts` (o novo describe, a partir da linha 1060) encerra o ano pela API, confere no banco que nenhum ano está `em_curso` e passa por busca, registro (com o pedido gravado no banco), lista, detalhe, corrigir nome, concluir e cancelar, cada um com a asserção sobre o resultado.
- **Não cair num ano qualquer:** o teste põe pelo banco um vínculo `confirmado` na turma 2ºC do ano encerrado e exige `turmas: []` e `disciplinas: []`. Antes do encerramento, ele confere que a turma aparece (`toHaveLength(1)`), o que prova que o vazio vem da regra e não da falta de dado.
- **Isolamento:** é conferido nos dois sentidos, com a resposta `NAO_ENCONTRADO`.
- **Tela:** `e2e/pedidos-do-titular.spec.ts:694` cobre a escola sem ano nos projetos `chromebook` e `celular`, com lista, busca, registro gravado no banco, detalhe, largura e acessibilidade.
- **De onde vem o ano:** conferi que a guarda de sessão lê o ano `em_curso` a cada requisição (`packages/nucleo/src/identidade/sessao.repository.ts:62`, em left join). Por isso o contexto fica de fato sem ano depois do encerramento, e o ramo novo é o que roda.

**Mutações que rodei nesta árvore:**
1. Tirei a guarda `typeof anoLetivoId !== 'string'` e deixei a consulta rodar sem filtro de ano (`eq(vinculo.anoLetivoId, anoLetivoId ?? vinculo.anoLetivoId)`). O teste ficou vermelho na linha 1095 (`toMatchObject`, a linha veio com turma e disciplina).
2. Pus no lugar o repository de HEAD, que ainda chama `exigirAnoEmCurso()`. O teste ficou vermelho na linha 1094 (`expected 404 to be 200`).

Depois devolvi o arquivo com a correção, a partir de uma cópia que guardei no scratchpad. O arquivo de integração inteiro passa: 24 de 24. O e2e não rodei. Conferi só que os imports novos existem nos fixtures; o vermelho antes e o verde depois são o que a correção relata.

**Bloqueantes:** nenhum.

**Recomendações:**
- `e2e/pedidos-do-titular.spec.ts:695`: o título diz "o anterior encerrado, o seguinte ainda não aberto", mas `criarEquipeComSenha('coordenador', { semAnoLetivo: true })` (`e2e/__fixtures__/sessao.ts:93`) cria uma escola que nunca teve ano. Vale ajustar o título ou criar um ano `encerrado` no fixture. A virada de verdade fica provada só na integração.
- Falta um caso da escola com o próximo ano já `planejado` e nenhum `em_curso`, que é o estado comum de janeiro. O código cai no mesmo ramo (o contexto só lê `em_curso`), então isso é cobertura extra, não regra sem teste.
- No isolamento, falta uma asserção de que a busca de A, sem ano, não acha a pessoa de B. Hoje o teste confere o detalhe do pedido, mas não a busca de pessoa, que é o caminho que a correção mexeu.
- O e2e não confere o detalhe do pedido antigo, o que já existia antes de o ano fechar. A integração cobre esse caso.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/pedidos-do-titular.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/correcoes/2026-10-11-pedidos-sem-ano-em-curso.md`

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-11 01:49:25 · `tasks/correcoes/2026-10-11-pedidos-sem-ano-em-curso.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela ou migration nova. A correção lê `vinculo`, `turma` e `disciplina` e não muda o esquema.

Queries verificadas:
- `TitularesRepository.#vinculosDe` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts:211-228`.
  - A escola continua vindo de `exigirEscolaDoContexto()`, agora chamada antes de tudo. Sem sessão, a chamada falha como antes.
  - O ano vem de `contextoAtual()?.anoLetivoId`. É a mesma origem do `exigirAnoEmCurso` (`packages/nucleo/src/contexto/ano-em-curso.ts`): a sessão gravada a partir do token, com o ano em curso resolvido no servidor. Não há parâmetro do cliente.
  - Com ano, a consulta continua filtrada por escola e ano do contexto, como antes.
  - Sem ano, a função devolve o mapa vazio e não consulta o banco. A leitura nunca cai num ano qualquer.
- `buscar` (`:112`) e `titularesParaOPedido` (`:144`) mantêm o filtro `eq(usuario.escolaId, escolaId)` a partir do contexto.
- Nenhum endpoint passou a aceitar `escolaId` no corpo ou na query.
- As respostas de erro não mudaram: o pedido de outra escola continua respondendo `NAO_ENCONTRADO`.

Teste de isolamento: presente e efetivo.
- `apps/api/test/pedido-titular.int.test.ts:1060-1129`, caso da virada de ano.
  - Encerra o ano da escola A pela API e põe pelo banco um vínculo `confirmado` no ano encerrado.
  - Se a guarda `typeof anoLetivoId !== 'string'` e o filtro do ano saírem, a turma 2ºC e a disciplina aparecem na busca e o `toMatchObject` com `turmas: []` e `disciplinas: []` falha.
  - O caso também confere que B não alcança o pedido de A e que A não alcança o de B, nos dois sentidos, com 404 igual ao de inexistente.
- O filtro por escola em `#vinculosDe` não mudou e já era coberto pelos casos de isolamento anteriores do mesmo arquivo.

Bloqueantes: nenhum.

Recomendações:
- `e2e/pedidos-do-titular.spec.ts:695`: o título fala em "anterior encerrado", mas `semAnoLetivo: true` cria uma escola que nunca teve ano. O cenário do encerramento só é provado na integração. O `test-engineer` já registrou isso. Vale ajustar o título ou encerrar um ano de verdade no e2e, sem efeito no isolamento.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-11 01:49:46 · `tasks/correcoes/2026-10-11-pedidos-sem-ano-em-curso.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. Muda só uma leitura que já existia: `TitularesRepository.#vinculosDe` deixa de exigir ano letivo em curso. Sem ano em curso, a linha da pessoa traz `turmas: []` e `disciplinas: []`, ou seja, menos dado do que antes. O formato da resposta não muda.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok.
- A escola continua vindo de `exigirEscolaDoContexto()`, que agora é chamada antes de tudo, então a chamada sem sessão continua falhando.
- O ano vem de `contextoAtual()?.anoLetivoId`. A guarda grava esse valor a cada requisição a partir do banco, pelo left join no ano `em_curso` em `packages/nucleo/src/identidade/sessao.repository.ts:62`. O cliente não manda o ano por parâmetro.
- Sem ano em curso, a consulta nem roda. Ela nunca cai num ano qualquer, e o teste prova isso: põe um vínculo `confirmado` no ano encerrado e espera `turmas: []`.
- Troquei o id mentalmente: no fim do caso novo, a escola B não alcança o pedido de A, nem A o de B, e os dois casos respondem `NAO_ENCONTRADO`, igual ao id inexistente.

Logs: limpos. O diff não acrescenta nenhum log, e o repository continua sem logar nome, matrícula ou termo da busca (`titulares.repository.ts:82`).

Auditoria: presente.
- `titular.buscado`, `pedido.registrado`, `pedidos.listados`, `pedido.lido`, `pedido.concluido`, `pedido.cancelado` e `pedido.nome_corrigido` são gravados no service, na mesma transação da ação (`privacidade.service.ts:184-337`).
- Antes da correção, o 404 desfazia a transação: na escola sem ano em curso, a resposta caía e a auditoria era desfeita junto. Agora o registro grava e a auditoria fica.

Envio externo: nenhum.

Seed/fixture: sintético. Os nomes e matrículas vêm de `nome()` e `marca()` (por exemplo `Iara ${marca()} Teles`), e o vínculo posto pelo banco no teste de integração usa ids das escolas criadas pelo próprio teste.

Bloqueantes: nenhum.

Recomendações:
- Em `apps/api/test/pedido-titular.int.test.ts`, o caso novo (a partir da linha 1060) confere que busca, registro, lista, detalhe, corrigir nome, concluir e cancelar respondem sem ano em curso. Mas não confere que as linhas de auditoria (`pedido.registrado`, `pedido.lido`, `pedido.cancelado`) ficam gravadas nessa janela. Uma linha que conte a auditoria depois do registro fixaria o efeito mais importante da correção para a regra 20: sem ela, a auditoria era desfeita junto com o pedido.
- Em `e2e/pedidos-do-titular.spec.ts:695`, `semAnoLetivo: true` cria uma escola que nunca teve ano, e não uma escola cujo ano foi encerrado, como o título do teste diz. O `test-engineer` já registrou isso. Não muda nada para privacidade, porque o teste de integração cobre o encerramento pela API.
- Em `apps/api/test/pedido-titular.int.test.ts:1125`, `b.alunos[0]?.id ?? ''` mascara uma pessoa de teste que não foi criada. Melhor seguir o padrão do próprio caso e lançar erro, como `aluno` e `professor` fazem acima.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/pedidos-do-titular.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/correcoes/2026-10-11-pedidos-sem-ano-em-curso.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-11 01:57:22 · `tasks/correcoes/2026-10-11-pedidos-sem-ano-em-curso.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2, só o diff desde a minha rodada 1 aprovada):
- A busca de A, sem ano em curso, não acha a pessoa de B. Isso prova o escopo de escola na leitura que a correção mexeu.
- A auditoria de cada passo (registrar, corrigir nome, concluir, cancelar) fica gravada mesmo sem ano em curso, e a transação não é desfeita.
- `alunoDeB` passa por uma guarda que lança, no lugar de `?? ''`.
- O e2e muda só no título e no comentário, sem mudar o que testa.
- O repository volta ao estado da correção.

Cobertos:
- **Mutação conferida por mim.** Tirei `eq(usuario.escolaId, escolaId)` do `buscar` (`apps/api/src/privacidade/titulares.repository.ts:120`) e rodei o caso `virada de ano letivo`. Ele falhou na linha nova, `apps/api/test/pedido-titular.int.test.ts:1136`: a busca de A devolveu o aluno de B (`"ptf743e8 Aluno e5aca581"`). Desfiz a mutação restaurando uma cópia do arquivo guardada no scratchpad, e não com `git checkout`, que apagaria a correção, que ainda não tem commit. Rodei de novo e o caso passou.
- **Repository no estado da correção.** O `git diff --numstat` dá `13 5`, como esperado. A única mudança fora de `#vinculosDe` é a troca de import (`contextoAtual` no lugar de `exigirAnoEmCurso`), que é parte da própria correção.
- **Asserções de resultado, não só de execução.**
  - O `toMatchObject` com `titulares: []` também confere o tamanho da lista, então passaria a falhar se a busca trouxesse alguém.
  - As contagens de auditoria (`3/1/1/1`, linhas 1125 a 1128) saem de `auditoriasDa(a.escolaId, acao)`, presa à escola A. O 3 de `pedido.registrado` bate com os três registros do caso: os dois de antes da virada e um depois.
- **Guarda de `alunoDeB`** na linha 1067, no lugar de `?? ''`.
- **e2e:** só o título e o comentário mudaram. O comentário novo diz certo que o fixture cria a escola sem ano e que o encerramento pela API é provado na integração.
- **Proibidos:** não há `.skip`, `.only`, teste comentado nem mock no diff. O caso usa o Postgres real da bancada e não chama provedor de IA.
- **Recomendações recusadas:** as duas recusas da Mesa na seção "Recomendações sem aplicar" têm motivo verificável e eram cobertura extra, não regra sem teste. Aceito as duas.

Bloqueantes: nenhum.

Recomendações: nenhuma nova.

Arquivos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/pedidos-do-titular.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/correcoes/2026-10-11-pedidos-sem-ano-em-curso.md`

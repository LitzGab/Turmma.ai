# Achados das revisões — `tasks/correcoes/2026-09-25-spec-da-a0b-atras-do-codigo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-25 13:29:06 · `tasks/correcoes/2026-09-25-spec-da-a0b-atras-do-codigo.md`

VEREDITO: APROVADO

Cenários exigidos: numa correção só de documento, cada ponto reescrito precisa bater com o código e com o teste que o cita:
- E9 e W10 em `cenarios.md`;
- a matriz da seção 5 da `techspec.md` para `sem_convite` no refazer e no revogar;
- a nota ao RF2 no `prd.md`;
- as onze linhas da tabela "Teste que reproduz" do documento da correção.

Cobertos:
- **E9, primeiro teste** (`apps/api/test/painel-convite.int.test.ts:748-775`). Sem a trava, com o gatilho, o segundo refazer para no `update "convite"` (espera por 2 em `esperarNaTrava`), recebe `CONFLITO`, e no fim há um convite em aberto e um `convite.refeito`. Bate com o código: `convite.repository.ts:155-162` e `convite.service.ts:254-255`.
- **E9, o aceite no meio do refazer** (`:776-801`). Esse teste prova de fato a condição `usado_em is null`. Tirada a condição, o refazer revogaria o convite usado e criaria outro sem esbarrar no índice, e o teste ficaria vermelho.
- **O 23505 como `CONFLITO`** está provado em `apps/api/src/sessao/convite.repository.int.test.ts:155`, com `ErroDeDominio` tipado.
- **W10, textos:**
  - os sete estados estão escritos por extenso em `estados-da-escola.test.ts:9-23`;
  - o `CONFLITO` e o `NAO_ENCONTRADO` no refazer e no revogar estão em `textos.test.ts:66-76`;
  - o texto da tentativa incerta está em `e2e/operacao-escolas.spec.ts:25` e é conferido em `:413`, com a revisão ainda visível, o mesmo id reenviado e nenhuma segunda escola;
  - `ehResultadoIncerto` cobre a conexão que caiu e a resposta fora do contrato (`textos.test.ts:35-42`), como o cenário diz;
  - `NovaEscola.tsx:71-78,181` faz exatamente o que o cenário descreve.
- **Matriz** (`techspec.md:79`). Bate com o E6 (`painel-convite.int.test.ts:51-69`, com `sem_convite: 404` no `REVOGAR` e no `REFAZER`) e com o código. `escolaDoConviteParaOperador` só acha convite `tipo = 'coordenador'`. Em `sem_convite` a escola não tem nenhum convite desse tipo, então a resposta `NAO_ENCONTRADO` sai antes da matriz (`convite.service.ts:248-249,282-283`).
- **Nota ao RF2: é verdadeira.**
  - Gerar, refazer e revogar pegam a trava antes de ler o estado, pelo mesmo `coordenacaoSobATrava` (`convite.service.ts:164`, chamado em `:201,252,286`).
  - Pela matriz em `packages/shared/src/operacao/painel.ts`, não existe estado em que gerar e refazer passem os dois. Em `pendente` e `vencido` só o refazer passa; em `aceito` só o gerar. Com a trava, qualquer ordem dá no máximo um convite em aberto.
  - A trava do gerar está provada pelo E8 "dois gerar" (`:384`); a do refazer, pelo E8 (refazer) em `:710` e pelo E9.
  - A troca do par está registrada em `revisao-spec.md:54`, rodada 2.
- **Tabela do documento da correção.** Conferi linha a linha e todas batem:
  - `textos.ts:10` e `mensagens.ts:21`;
  - `convite.repository.ts:155-162`;
  - os `@SemEscopo` em `painel.repository.ts:121,133,200`, `escola.repository.ts:25,34` e `resolucao-de-tenant.repository.ts:448,464`;
  - I1 em `arquitetura.test.ts:96-118`;
  - `painel.service.ts:32,118-127` e `ops/escola.ts:156-157` (`randomUUID()`);
  - `painel.ts:188-202`, `chaves.ts:30` e `limitador.ts:126-138,170`;
  - as migrations `0015`, `0016` e `0017`;
  - os commits `90ae176`, `d5b6dab` e `77121f7`, que tocam `docs/lgpd.md`.
- **O que o `docs/lgpd.md` passa a dizer do I6** (sentinelas "nem linha de log") também é verdade: `painel-leitura.int.test.ts:472` confere as linhas de log.

Bloqueantes: nenhum.

Recomendações:
1. **E9 afirma mais do que o próprio teste prova.** `cenarios.md:72-73` diz que o índice "não chega a ser alcançado", e a tabela da correção repete isso. O teste de `:748-775` não distingue o mecanismo. Sem o `revogado_em is null`, o segundo refazer revogaria de novo e bateria no `convite_pendente_unico`, que também dá `CONFLITO`: seriam os mesmos um em aberto e um `convite.refeito`, e o teste ficaria verde. Quem prova a condição é o teste sequencial do `revogarParaRefazer`, em `convite.repository.int.test.ts:193-212` ("Já revogado: não revoga de novo", perto da linha 201). Sugiro citar esse teste no E9 e na linha E9 da tabela da correção.
2. **Linha E9 da tabela da correção.** Ela cita `painel-convite.int.test.ts:748-775`, mas o cenário agora inclui o aceite no meio do refazer, que está em `:776-801`. O intervalo deveria ser `748-801`.
3. **O texto exato do 401 não é conferido por extenso em nenhum teste.** O W10 agora afirma "…Entre de novo para continuar.", mas:
   - `textos.test.ts:44-47` só confere que o texto é igual ao do catálogo e que começa por "Sua sessão terminou. Entre de novo";
   - os e2e (`operacao-escolas.spec.ts:797` e `operacao.spec.ts:12`) também comparam com a constante;
   - só os arquivos de código-fonte têm o texto literal.

   Se o catálogo voltar para "Entre de novo.", tudo continua verde. Duas saídas: no cenário, ancorar o texto em `MENSAGENS_DE_ERRO.SESSAO_ENCERRADA`; ou, numa correção de código futura, escrever o texto por extenso no teste, como o cabeçalho do `textos.test.ts` promete.
4. **A constante compartilhada diverge da matriz.** Em `packages/shared/src/operacao/painel.ts:121`, `REVOGAR_CONVITE_POR_ESTADO` ainda tem `sem_convite: 'conflito'` (entrada inalcançável). A matriz da Tech Spec agora diz `NAO_ENCONTRADO`, e a linha "Matriz" da tabela da correção usa `painel.ts:102-103` como evidência para o revogar, mas esse comentário só fala do refazer. O comportamento está certo. Sugiro, numa correção de código, pôr no `REVOGAR` o mesmo comentário do `REFAZER`, ou registrar na Tech Spec que a constante mantém uma entrada que nunca é alcançada.
5. **Para o `/retro`.** O `textos.test.ts:72-76` prova também o `NAO_ENCONTRADO` do gerar ("Essa escola não foi encontrada. A lista foi atualizada."), que o W10 não lista. Não é promessa sem teste, mas é um texto de tela fora da lista fechada de cenários.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-25-spec-da-a0b-atras-do-codigo.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/prd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/textos.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/painel.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-09-25 13:30:10 · `tasks/correcoes/2026-09-25-spec-da-a0b-atras-do-codigo.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta rodada só confere as quatro correções de documento que saíram das minhas recomendações da 1ª rodada. Não reauditei o que não mudou.

1. A E9, em `cenarios.md`, diz o que realmente segura o refazer sem a trava e aponta os testes que provam cada parte.
2. A linha E9 do documento da correção cita os testes certos.
3. O texto do 401 na W10 vem do catálogo.
4. A seção 5 da `techspec.md` registra que a entrada `sem_convite` das duas matrizes nunca é alcançada pelo servidor.

**Cobertos:** conferi cada texto novo contra o código e os testes.
- **E9, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md`:** o texto bate com o código.
  - O `revogarParaRefazer` (`apps/api/src/sessao/convite.repository.ts:155-162`) tem as duas condições no `update` (`usado_em is null`, `revogado_em is null`). Quando não revoga, o serviço lança `CONFLITO` (`convite.service.ts:254-255`) antes do `criarConvite`, então o índice não entra na E9.
  - O teste do resultado está em `painel-convite.int.test.ts:748-801`. Os dois pedidos correm em paralelo de verdade: um fica parado no gatilho enquanto o outro espera a mesma linha. O teste confere que sobra um só convite em aberto, que o segundo pedido recebe `CONFLITO` e que existe uma auditoria só.
  - O caso do aceite no meio do refazer também está coberto, e o teste confere que nenhum convite novo foi criado.
  - A condição do `update` é provada em `convite.repository.int.test.ts:193-212`. O convite já revogado devolve `undefined`, o aceito não é revogado, e o contexto da escola B não alcança o convite de A.
  - O 23505 do índice é provado em `:155`, com a asserção de `CONFLITO` tipado.
- **Documento da correção, linha E9:** as citações `:748-801`, `:193-212` e `:155` apontam exatamente os blocos `describe` e `it` certos.
- **W10:** `apps/web/src/operacao/textos.ts:10` usa `MENSAGENS_DE_ERRO[CodigoDeErro.SESSAO_ENCERRADA]`, e o texto em `packages/shared/src/erros/mensagens.ts:21` é igual ao da spec. O teste `textos.test.ts:44-46` compara a constante da tela com o catálogo, então falharia se as duas divergissem. O novo texto sobre a tentativa incerta na W10 também está de acordo com o que a tarefa 6.0 decidiu.
- **Seção 5 da `techspec.md` e linha "Matriz" da correção:**
  - No refazer e no revogar, o serviço responde `NAO_ENCONTRADO` quando a escola do convite não é achada, antes de olhar a matriz (`convite.service.ts:248-249` e `:282-283`). As entradas `sem_convite: 'conflito'` em `painel.ts:108` e `:121` ficam de fato inalcançáveis.
  - A tela só oferece refazer e revogar quando a matriz manda (`acoes-do-convite.ts:23-24`), e nesse estado a resposta é `conflito`, então ela não oferece nenhum dos dois.
  - O teste `painel-convite.int.test.ts:50-69` fixa `sem_convite: 404` para as duas ações.
  - A linha da tabela na seção 5 agora diz `NAO_ENCONTRADO` no refazer para `sem_convite`, o que confere com o código.

**Bloqueantes:** nenhum.

**Recomendações:**
- Na linha "Matriz" do documento da correção (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-25-spec-da-a0b-atras-do-codigo.md:40`), a citação do refazer é `painel.ts:102-103`, que é o comentário do mapa. A entrada `sem_convite` do refazer está em `:108`, e a do revogar já está citada certa em `:121`. Vale citar `:108` também, pela simetria.
- A linha E9 do mesmo documento (`:39`) ainda diz "o índice não é alcançado". É correto para o teste da E9. Se quiser o mesmo cuidado de `cenarios.md`, basta acrescentar "neste teste".

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-25 13:32:09 · `tasks/correcoes/2026-09-25-spec-da-a0b-atras-do-codigo.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova. O painel lê `rede`, `escola`, `ano_letivo`, `turma`, `vinculo`, `usuario`, `convite` e `uso_infra_diario`, que é o que aparece nas consultas de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.repository.ts:75-107,133-230`. A lista de `docs/modelo-de-dados.md` bate com isso.

Queries verificadas:
- **Os sete `@SemEscopo`.** São `PainelRepository.redes`, `escolas` e `uso` (`painel.repository.ts:121,133,200`), `RedeEEscolaRepository.criarRede` e `criarEscola` (`ops/escola.repository.ts:25,34`), e `ResolucaoDeTenantRepository.contaParaConvite` e `escolaDoConviteParaOperador` (`sessao/resolucao-de-tenant.repository.ts:448,464`). Nenhum outro `@SemEscopo` é alcançado por rota do painel. O `escolaPorSlug` só entra no ramo `'slug' in pedido`, e o `painel.service.ts:135` passa `escolaId`. Os métodos do `ConviteRepository` e o registro de auditoria rodam no contexto da escola.
- **Justificativas.** A tabela nova segue o texto de cada decorador sem mudar o sentido.
- **Seção 6 da spec.** Bate com a tabela nova.
- **Testes de arquitetura.** O I1 (`apps/api/test/arquitetura.test.ts:96-118`) exige exatamente `redes`, `escolas` e `uso`, com justificativa `^painel do operador:`, e só o `painel.service.ts` como importador. O I2 (`apps/api/src/ops/escola.repository.test.ts:54-60`) exige só `criarRede` e `criarEscola`, com "comando ou o painel do operador".
- **Histórico (`git show 829ab8d^`).** `criarRede`, `criarEscola`, `contaParaConvite` e `escolaDoConviteParaOperador` já existiam com `@SemEscopo`, usados pelo `ops:escola`, `ops:convite-coordenador` e `ops:revogar-convite`. O `resolucao-de-tenant.repository.ts` tem 25 `@SemEscopo` antes e 25 agora, então o `sessao` não ganhou nenhum. As afirmações do documento sobre isso são verdadeiras.
- **Matriz, `sem_convite`, refazer e revogar dão `NAO_ENCONTRADO`.** Fiel ao código:
  - `escolaDoConviteParaOperador` filtra `tipo = 'coordenador'` e o 404 sai antes da matriz (`convite.service.ts:248-249,282-283`).
  - Com um convite de coordenação achado, a escola não pode estar em `sem_convite`. O `inner join usuario` de `dadosDaCoordenacao` sempre casa, por causa da FK composta com cascade (`0008_convite.sql:19`). Por isso a entrada `conflito` de `REFAZER_` e `REVOGAR_CONVITE_POR_ESTADO` nunca é alcançada.
  - O teste confirma: `painel-convite.int.test.ts:50-69` tem `sem_convite: 404` nas duas.
  - As outras células da linha (`revogado`, `sem_coordenacao`) conferem com `convite.service.ts:250-300`.
- **Linha "Convite em aberto" da 7c.** Fiel ao código:
  - `revogarParaRefazer` usa `usado_em is null and revogado_em is null` (`convite.repository.ts:155-162`).
  - O E9 (`painel-convite.int.test.ts:748`) prova o segundo refazer parado no `update` condicional.
  - O 23505 como `CONFLITO` é provado em `convite.repository.int.test.ts:155-185`.
- **Seções citadas na seção 11.** "Multi-tenant" existe em `docs/arquitetura.md:38`, e "Operação Turmma" em `docs/modelo-de-dados.md:109`.

Teste de isolamento: não se aplica, porque a correção só mexe em documento. Os testes que sustentam o que o documento afirma (I1, I2, a matriz e o E9) existem e quebrariam se a regra fosse removida.

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md`, no parágrafo "O painel da operação": a frase "são das escritas, que abrem o contexto da escola antes de tocar qualquer tabela dela" é imprecisa para o `escolaDoConviteParaOperador`, que lê a tabela `convite` justamente para achar a escola antes de abrir o contexto. Sugestão: "fora a leitura da escola do convite, que só devolve o `escola_id`, abrem o contexto antes de tocar qualquer tabela dela".
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md:25`: a linha editada ficou mais longa que as vizinhas. Quebrar a linha para manter o padrão do documento.
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/arquitetura.md:44-50` cita só o `PainelRepository`. Vale remeter à tabela nova de `docs/modelo-de-dados.md` para os outros quatro `@SemEscopo` que o painel alcança, e assim os dois documentos não divergem de novo.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-25 13:32:36 · `tasks/correcoes/2026-09-25-spec-da-a0b-atras-do-codigo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test, e2e)")
Bloqueantes: nenhum

Recomendações:
- **Frase absoluta na spec.** Em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`, seção 5, o parágrafo novo diz que a entrada `sem_convite` de `REFAZER_`/`REVOGAR_CONVITE_POR_ESTADO` "nunca é alcançada pelo servidor". Ela só é alcançada se o expurgo apagar o convite entre `escolaDoConviteParaOperador` e a leitura do estado. No revogar, o `revogado(conviteId) === undefined` responde `NAO_ENCONTRADO` antes do `conflito` (`convite.service.ts:288-289`). No refazer, a resposta seria `CONFLITO`. Seria mais exato dizer "não é alcançada no fluxo normal". O código e a matriz dos testes estão certos.
- **"das escritas" no modelo de dados.** Em `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md`, no parágrafo depois da tabela do painel, os quatro `@SemEscopo` de `ops`/`sessao` aparecem como "das escritas". Só que `escolaDoConviteParaOperador` é uma leitura sem escopo pelo id do convite, e ela serve às escritas. "Servem às escritas" deixa isso claro, e evita que a frase "o `PainelRepository` é o único lugar da leitura entre escolas" seja lida como se aquela consulta não existisse.
- **Quebra de linha.** A linha 27 de `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md` ("…(Tech Spec da A0b, seções 5 e 7c). Só esse id, e só nessas duas tabelas, vem de fora; o resto") ficou com cerca de 150 colunas. O resto do arquivo quebra perto de 100.

Conferência pedida:
1. **Cobertura.** Os seis pontos do achado maior foram para a spec e para os cenários: o texto do 401 e a tentativa incerta no W10, o `update` condicional no E9, `sem_convite` na matriz, a seção 7 sobre `docs/lgpd.md` e a seção 11 com o registro em `docs/modelo-de-dados.md`. Os menores 1 a 6 também foram levados: README, `docs/lgpd.md` (o que o painel vê e o `rl:ip:op`), `docs/interface.md` 5a, a nota ao RF2 no PRD, o id v4 do comando e as três migrations. O diff não toca nada dos menores 7 e 8, nem arquivo em `apps/`, `packages/`, `infra/` ou `e2e/`.
2. **Verdade contra o código.** Conferi cada ponto no código:
   - W10: os textos batem com `textos.ts:10,73-84`, `mensagens.ts:21` e `NovaEscola.tsx:71-78,181`.
   - E9: bate com `convite.repository.ts:155-162` e `convite.service.ts:254-255`, com o teste em `painel-convite.int.test.ts:748-801` e com o `revogarParaRefazer` e o 23505 em `convite.repository.int.test.ts`.
   - Matriz: `sem_convite` responde 404 no refazer e no revogar (`painel-convite.int.test.ts:50-69`), e na tela as ações de refazer e revogar dependem do `conviteId` (`acoes-do-convite.ts:22`).
   - `docs/lgpd.md`: o git mostra as mudanças em `90ae176`, `d5b6dab` e `77121f7`.
   - Os sete `@SemEscopo` e as justificativas estão no código. `escolaDoConviteParaOperador` e `contaParaConvite` vêm do F1, então "já existiam" é verdade. As tabelas lidas pelo `PainelRepository` são as que o documento lista.
   - `rl:ip:op`: bate com `chaves.ts` e `limitador.ts`. O `randomUUID()` do comando está em `ops/escola.ts:156-157`.
   - A `0017` tem exatamente os dois checks descritos.
3. **Status e notas.** O status da `techspec.md` não mudou. A spec e os cenários têm a nota de acerto no alto, citando a validação e a correção.
4. **Coerência.** A seção 11 aponta para "Multi-tenant" em `docs/arquitetura.md`, e essa seção existe, com o texto das linhas 44-50 de acordo com o que o modelo de dados diz agora. Spec, cenários, PRD, `lgpd.md`, `interface.md` e README dizem a mesma coisa sobre os estados, a matriz e o caminho de criação.

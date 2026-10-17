# Achados das revisões — `tasks/correcoes/2026-10-17-w2-carregando-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 17:25:27 · `tasks/correcoes/2026-10-17-w2-carregando-estoura-o-prazo.md`

VEREDITO: APROVADO

Tela vista: sim. Li 8 fotos, e nenhuma é de tela alterada. Foram Painel (cheia e vazia, computador e celular), Escola › Professores (cheia e vazia, celular) e Registros › IA (cheia e vazia, celular). As outras fotos listadas não foram abertas, porque a tarefa só muda o relógio de um teste e nenhum arquivo de `apps/` mudou. A comparação com `docs/interface.md` e a pele D72/D80 vale para as 8 que li, e dá o mesmo resultado nas duas rodadas.
- Em 360 px não há rolagem horizontal nem texto cortado.
- A barra de baixo mostra Painel, Analista, Escola e Registros. Ela aparece no meio da imagem só porque a foto de página inteira costura a barra fixa.
- Os alvos de toque têm altura suficiente e as ações principais ficam bem acima de 44 px.
- Na escola vazia, o Painel mostra "Tudo em dia" e "A escola está montada". Registros mostra "A IA ainda não gerou nada nesta escola" e diz quando a entrega aparece, então não pede desculpa. A lista de professores traz o botão "Cadastrar professor".
- Não há termo técnico, id ou texto em inglês. Os sufixos como "a173c11d" são do dado sintético da vitrine.

Estados: ok. A tarefa não toca estado nenhum. Carregando e erro não aparecem na vitrine. O e2e que a correção ajusta é justamente o que exige a leitura terminada (`paginaNaoRola` espera o "Carregando" sair), e essa espera continua como estava.

Acessibilidade: não afetada. A correção só mexe no relógio do teste.

Chromebook fraco: a correção é coerente com o perfil de CPU ×4 e rede lenta. `e2e/areas.spec.ts:316` ganha `test.slow()`, que leva o relógio de 30 s para 90 s. A causa está documentada: o caso soma 11 leituras reais de tela e precisa de uns 31 a 33 s no runner. Nenhuma tela travou, cada "Carregando" saiu em até 1,3 s. Nenhuma asserção saiu nem foi afrouxada, e `git diff` confirma que a mudança é só `test.slow()` mais o comentário. A tarefa registra vermelho com `--timeout=22000` e verde depois, e 20 de 20 verdes na estabilidade. Os 2 vermelhos de uma rodada anterior foram atribuídos à interferência de outro andar.

Celular: a rodada do projeto `celular` já estava verde na esteira, e as fotos de 360 px estão corretas.

Ação oficial protegida: não se aplica, porque nenhuma ação oficial foi alterada.

Bloqueantes: nenhum.

Recomendações:
- O achado à parte da tarefa precisa de dono: `e2e/painel-da-coordenacao.spec.ts:187` estourou 90 s num `locator.click`, mesmo com `test.slow()`. A causa é outra, e a tarefa corretamente não o tocou. Não deixe esse caso sem correção própria.
- A tabela "Revisões" do arquivo da tarefa deve ser preenchida pelo hook, sem edição manual.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/areas.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-17-w2-carregando-estoura-o-prazo.md`

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 17:25:31 · `tasks/correcoes/2026-10-17-w2-carregando-estoura-o-prazo.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta é uma correção só do tempo limite de um caso de e2e e não muda nenhuma regra do produto. O que ela precisa mostrar é:
1. A causa é o tempo do caso, e não uma tela travada.
2. A folga maior não esconde uma tela que fique presa em "Carregando".
3. O caso continua conferindo o que conferia antes nos projetos `chromebook` e `celular`.
4. O resultado é estável.

**Cobertos:**
- **Causa.** O documento soma o trace da esteira 39062201162 etapa por etapa: 8,1 s de entrada, 5 s até o Painel aparecer, cerca de 9 s nos quatro lugares e de 0,8 a 1,3 s por tela no laço das onze. O caso caiu aos 30 s na nona tela, e nenhum "Carregando" passou de 1,3 s.
- **A folga não esconde tela travada.** O `test.slow()` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/areas.spec.ts:320` triplica só o tempo total do caso. A espera de cada tela continua com o limite padrão de 5 s, porque o `playwright.config.ts` não muda nem o tempo do caso nem o das asserções. Ela fica em `paginaNaoRola`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/__fixtures__/coordenacao.ts:98`. Uma tela presa em "Carregando" continua falhando em 5 s, com a mesma mensagem de antes.
- **O caso confere o mesmo de antes.** O diff só acrescenta o comentário e a linha do `test.slow()`. Endereço, lugar aceso, tetos de cliques, largura excedente e a medida de rolagem com a leitura terminada continuam todos. Os dois projetos passam pelo mesmo caso.
- **Reprodução.** Antes da correção, com tempo limite de 22 s, foram 4 vermelhos em 4, todos em `coordenacao.ts:98`. Depois, 4 verdes em 4.
- **Estabilidade.** Foram 20 verdes em 20 nos dois projetos com dois workers. O caso mais lento usou 27,4 s dos 90 s, cerca de 30%, então ele não depende de máquina folgada. Os 2 vermelhos de uma rodada anterior aconteceram no mesmo segundo em que outro andar subia contêineres, e o trace mostra o carregamento do código do Analista abortado nesse instante. É interferência do ambiente compartilhado e não afeta esta correção.
- **Mutações.** O documento diz que não há cláusula nova nem asserção nova, e o `git diff` confirma isso. Nenhum bloco de mutação faltando.
- Não há `.skip`, teste comentado nem mock. Não há chamada de IA nem operação concorrente nesta mudança.

**Bloqueantes:** nenhum.

**Recomendações:**
- O achado à parte do documento é real e precisa chegar ao Orquestrador: `e2e/painel-da-coordenacao.spec.ts:187` estourou 90 s num `locator.click`, mesmo já com `test.slow()`. A causa é outra, um clique que não encontra o alvo, e mais tempo não resolve.
- Se outros casos do laço de telas da coordenação também chegarem perto dos 30 s, vale dar um tempo limite ao `describe` inteiro, em vez de pôr `test.slow()` caso a caso. É organização e não bloqueia.

Não rodei o e2e: ele depende da pilha em contêiner, e rodá-lo de novo enquanto outros andares estão ativos poria a máquina sob carga, que as instruções vedam. A auditoria se apoiou no diff e no texto do documento da correção.

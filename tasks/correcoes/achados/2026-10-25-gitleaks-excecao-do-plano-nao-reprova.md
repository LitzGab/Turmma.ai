# Achados das revisões — `tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-25 15:16:37 · `tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. O diff não cria nem altera migration ou schema.

Queries verificadas: nenhuma. O diff não toca repository, service, endpoint nem consulta. A mudança fica toda em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts`:
- o gerador `aleatorio` agora alterna letra e dígito;
- `varrer` ganhou `maxBuffer` de 64 MB;
- entraram dois casos novos, que rodam o gitleaks num repositório temporário.

Nenhum desses pontos lê ou grava dado de escola.

Teste de isolamento: não se aplica. A tarefa não cria módulo, tabela nem rota, então a regra 10, item 5, não pede teste de isolamento aqui. Os itens 1 a 8 da auditoria não têm objeto neste diff:
- não há `escolaId` nem `anoLetivoId` novo;
- nenhum endpoint passou a aceitar `escolaId`;
- não há id novo;
- não há consulta agregada nova;
- não há `@SemEscopo()` novo.

Bloqueantes: nenhum.

Recomendações:
- O "Achado fora do escopo" do documento da correção não é de isolamento, mas é risco de vazamento. Com a exceção do plano no `.gitleaks.toml`, o `gitleaks dir` do portão local lê 0 bytes de `tasks/prd-*/N_task.md`. Um segredo de verdade num documento de tarefa só seria pego depois do commit. Precisa de uma correção própria, cobrando o `privacy-guardian` e o `infra-guardian`, e não deve ficar só no relatório ao Orquestrador.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 15:16:42 · `tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A mudança fica só em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts`. Ela muda o gerador da chave falsa, aumenta o `maxBuffer` da varredura e acrescenta dois casos. Nada disso grava em `Nota` nem toca em schema, seed, job, importação ou webhook. Todos com autor humano? Sim, porque não há caminho novo nem alterado.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. Nenhum fluxo de saída de IA foi criado ou alterado.
Supervisão do tutor: ok. O tutor não foi tocado.
Autonomia declarada e visível: sim. Nada mudou na governança nem na declaração de autonomia dos agentes.
Bloqueantes: nenhum.

O que conferi:
- **Itens 1 e 2:** o diff só mexe na chave falsa do teste do gitleaks, no buffer da varredura e nos dois casos novos. Esses casos gravam arquivos sintéticos `tasks/prd-amostra/N_task.md` num repositório temporário.
- **Item 8 (D55):** nenhum campo, tela ou prompt de discursiva ou redação foi tocado.
- **Item 9 (D45):** nenhuma métrica de professor, nenhum ranking e nenhuma conversa do chat entram na mudança.
- **Item 7 (supervisão não é vigilância):** nada de inferência emocional nem de medição de navegação.
- **Documento de correção:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md` não altera `docs/regulacao.md` nem a regra 70.
- **Fotos da tela:** a tarefa não tem tela e o prompt não trouxe fotos.

Recomendações:
- O "achado fora do escopo" do documento de correção precisa de dono e prazo. Ele diz que a varredura de pasta (`gitleaks dir`) não lê nada dos `tasks/prd-*/N_task.md`, então um segredo num documento de tarefa só seria pego depois do commit. Não é assunto da regra 70: é do `privacy-guardian` e do `infra-guardian`.
- O caso das 1500 amostras conta os reprovados com a regex `^File:\s+...`, que depende do formato da saída `--verbose` do gitleaks v8.30.1. Quando a versão da imagem subir, o caso pode falhar só por mudança de formato, sem ser vazamento. Vale um comentário fixando essa dependência à versão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 15:16:43 · `tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A mudança está só no arquivo de teste `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts`, no gerador da chave falsa (`aleatorio`), num caso novo sem Docker e num caso novo com 1500 amostras. O documento da correção é `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md`.
Fora da tabela de dados do docs/lgpd.md: nada. Nenhuma migration, entidade ou campo novo.
Autorização por objeto: não se aplica. Não há rota, repository nem DTO.
Logs: limpos. O teste só imprime a saída do gitleaks sobre chaves geradas na hora, num repositório temporário. A saída aparece como mensagem só em asserção que falha, e não há dado de pessoa nela.
Auditoria: não se aplica. Não há leitura de aluno, exportação, nota, permissão nem saída de IA.
Envio externo: nenhum. O gitleaks roda em contêiner local (`ghcr.io/gitleaks/gitleaks:v8.30.1`) sobre um diretório em `tmpdir()`, e nada sai da máquina nem vai para provedor de IA.
Seed/fixture: sintético. As chaves são sorteadas a cada execução e nunca gravadas no repositório, e o autor do commit é `guardas@exemplo.test`.
Bloqueantes: nenhum.
Recomendações:
- O achado fora do escopo que o documento registra não é dado pessoal, mas toca a regra 20 por tabela: a varredura de pasta (`gitleaks dir`) lê 0 bytes de `tasks/prd-*/N_task.md`. Um segredo de verdade num documento de tarefa só seria pego depois do commit, e o repositório é público. Esse risco de exposição merece correção própria em `tools/ci/etapas-de-guarda.ts` e `.gitleaks.toml`. Confirmar que ele chegou ao relatório do Orquestrador, como o documento promete.
- O caso das 1500 amostras sobe um repositório com 1500 arquivos a cada execução da integração. Se pesar no tempo da esteira, dá para reduzir o número, já que a propriedade estrutural ("sem duas letras juntas") já está provada sem Docker.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 15:17:17 · `tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: não se aplica (a mudança é só no teste da guarda, em `tools/guardas/`)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (não se aplica: o teste não grava em banco nem dispara job)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica: não há código novo no caminho quente)
Bloqueantes: nenhum
Recomendações:
- O defeito que a correção registrou como fora do escopo é o mais grave dos dois e precisa de dono. O portão local faz a varredura de pasta (`gitleaks dir`) e ela lê 0 bytes de qualquer `tasks/prd-*/N_task.md`. Assim, um segredo de verdade num documento de tarefa só aparece depois do commit. Esse defeito deve entrar como correção própria em `tools/ci/etapas-de-guarda.ts` e `.gitleaks.toml`, e não só no relatório.
- A suíte de 13 casos rodou aqui, com o gitleaks em Docker, em 20 s; os 13 passaram. O limite de 60 s por caso folga hoje, mas o caso das 1500 amostras é o mais pesado do arquivo. Se a esteira ficar lenta, vale baixar o número de amostras para algo como 1000, que ainda deixa a falha praticamente certa com o gerador antigo, ou dar um tempo-limite próprio a esse caso.
- A propriedade "duas letras nunca ficam juntas" cobre as palavras de duas letras ou mais da lista do gitleaks. Vale deixar escrito no comentário que ela não cobre palavra de uma letra só nem palavra com dígito, caso a lista do gitleaks mude de versão. O caso das 1500 amostras pega essa mudança, mas o comentário poupa a investigação.

Arquivo auditado: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts`

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 15:17:36 · `tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. É uma correção que só mexe no arquivo de teste. Não toca arquitetura e não há seção da techspec em jogo.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo).

Bloqueantes: nenhum.

Refiz a medição por fora com o binário do gitleaks v8.30.1 da esteira e o `.gitleaks.toml` do projeto, em modo pasta e fora de `tasks/` (assim a exceção do plano não perdoa o arquivo). Foram 20000 chaves do gerador novo, metade em minúsculas como no caso `comprida`. As 20000 foram reprovadas pela `generic-api-key`. Nenhuma foi descartada como palavra comum, nem mesmo uma palavra da lista com dígito, que o argumento das "duas letras juntas" não cobriria sozinho. Com isso a causa e o conserto ficam confirmados além das 1500 amostras do próprio teste.

A chave em minúsculas continua um único pedaço de 40 caracteres sem `_`. Ela passa do limite `{0,19}` da regex da exceção do plano, então o caso `comprida` segue provando o que diz. `linhaDeChave` é declarada mais abaixo, dentro do `describe`, e usada num `it` anterior. Isso não quebra nada, porque o corpo do `it` só roda depois que o `describe` termina de ser coletado.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts:110-112`: o comentário do caso das 1500 amostras repete a causa já escrita nas linhas 14-16. Basta deixar a referência à esteira 40214908506 e a frase sobre tornar a oscilação certa.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts:114`: a linha está longa demais para ler de uma vez. Montar `arquivos` em duas linhas ajuda.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts:209`: `varrerPasta` ainda chama o `spawnSync` sem o `maxBuffer` que `varrer` ganhou. Hoje não faz falta, porque os casos de pasta têm poucos arquivos. Vale juntar as duas chamadas para a próxima varredura grande não cortar a saída sem avisar.
- O documento abre com "Fora desta correção: Nada", mas no fim traz o "Achado fora do escopo": a varredura de pasta não lê nenhum byte de `tasks/prd-*/N_task.md`. Esse achado é grave. Um segredo num documento de tarefa passa pelo portão local e só aparece na esteira, num repositório público e com branch de linha que não dispara a esteira. Ele precisa chegar ao Orquestrador como correção própria, não só como nota de relatório.

## test-engineer · 1ª rodada · APROVADO · 2026-10-25 15:18:02 · `tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md`

VEREDITO: APROVADO

**Cenários exigidos:**
1. **Reprodução do intermitente.** Uma chave sorteada no `Sort Key:` de um documento de tarefa tem que ser reprovada sempre, e não 995 vezes em 1000.
2. **A causa.** O gerador não pode montar nenhuma palavra que o gitleaks descarta como comum (`vpn` e as outras siglas sem vogal).
3. **Os casos que usam o mesmo gerador continuam provando o que provavam.** São o `comChave`, o `comprida` em minúsculas e o `reprova chave genérica de alta entropia`. A chave nova precisa continuar com entropia acima do limite e, em minúsculas, continuar longa demais para a exceção do plano (`[a-z][a-z0-9]{0,19}` por pedaço).
4. **O `tokenFalso` continua caindo na regra `github-pat`.**
5. **A saída do gitleaks com 1500 achados não é cortada pelo `spawnSync`.**

Os cenários de permissão, isolamento e concorrência não se aplicam: a mudança é só no gerador de chave de um teste de guarda, sem dado de escola nem operação que possa rodar duas vezes.

**Cobertos:**
- **1:** `gitleaks com o .gitleaks.toml do projeto › reprova a chave genérica em todas as amostras de uma vez: nenhuma é descartada como palavra comum (esteira 40214908506)`, em `tools/guardas/gitleaks.int.test.ts:109`. São 1500 chaves no mesmo commit, todas em `tasks/prd-amostra/N_task.md`, que é o mesmo caminho da exceção do plano. O caso exige 1500 arquivos distintos reprovados, não só o código 1. Com o gerador antigo, a chance de passar é de cerca de 0,05% (0,995^1500), então o caso reproduz a falha quase sempre. O documento registra o vermelho antes: `expected 1497 to be 1500`.
- **2:** `a chave falsa dos testes › alterna letra e dígito: ...`, em `:99`. Ele confere 200 chaves sem duas letras seguidas. O gerador antigo tirava 80% dos símbolos de letras, então esse caso fica vermelho com ele com certeza prática. A garantia vale porque a lista de descarte do gitleaks só tem palavras de letras. Essa premissa está escrita no comentário em `:14-16`.
- **3:** a exceção do plano só aceita pedaços de até 20 caracteres. Uma chave de 40 caracteres alternados, sem sublinhado, não cabe nela, então o `comprida` continua provando o que provava. As 1500 amostras mostram que a entropia segue acima do limite.
- **4:** `ghp_` seguido de 36 caracteres alternados continua no formato `[0-9a-zA-Z]{36}`, e os casos de `github-pat` passaram.
- **5:** `maxBuffer` de 64 MB em `:94`, sem o qual a saída seria cortada perto de 1 MB.
- Cada teste que o documento cita existe, com o nome exato.
- Não há `.skip`, `.only`, teste comentado nem mock.
- Só o arquivo de teste mudou (`git diff`), então pela RF17 o documento não precisa de bloco de mutação. O par vermelho antes e verde depois cumpre esse papel.
- Rodei `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts`: 13 de 13 verdes, em 19,3 s.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **O achado fora do escopo merece correção própria já, não só uma linha no relatório.** É o `gitleaks dir` escaneando 0 bytes de `tasks/prd-*/N_task.md`. Isso torna vazia parte do caso `reprova o segredo em arquivo ainda sem commit...` (`tools/guardas/gitleaks.int.test.ts:213-223`): o `not.toContain(TAREFA_COM_PLANO)` e o `soPlano.codigo === 0` passariam mesmo sem a exceção do plano. O risco é concreto. Pela regra 40, o gitleaks do portão local é a única checagem de segredo antes do push da branch de linha, e o repositório é público. Um segredo de verdade num documento de tarefa chegaria ao GitHub sem barreira até o encontro. Sugiro registrar como correção em `tasks/correcoes/` ou no `TODO.md`, com um caso que ponha um token `ghp_` dentro do documento de tarefa e exija reprovação na varredura de pasta.
2. **A amostra em lote é só de caixa mista.** O caso `comprida` (`:192`) usa `aleatorio(40).toLowerCase()`, com alfabeto menor e entropia mais baixa, e esse caminho não está nas 1500 amostras. Pôr parte delas em minúsculas fecharia a dúvida com o gitleaks de verdade, em vez de depender da conta.
3. **Nome e lugar do caso de propriedade.** O caso de `:99` não usa Docker, mas mora num `.int.test.ts`. Funciona, só fica registrado que, se o gerador for extraído no futuro, ele cabe na unidade.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.gitleaks.toml

## revisor-geral · 2ª rodada · APROVADO · 2026-10-25 15:26:41 · `tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Correção só em arquivo de teste, sem seção de Tech Spec envolvida.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

As seis recomendações da ordem r1 foram aplicadas:
1. **Amostras em minúsculas:** metade das 1500 sai em minúsculas (`tools/guardas/gitleaks.int.test.ts:120-123`). A chave em minúsculas continua sem duas letras juntas e longe do limite de entropia. O caminho do caso `comprida` agora passa pelo gitleaks de verdade, não só pela conta.
2. **Linha de `arquivos`:** ficou mais curta, com `caminhoDaAmostra` e `linhaDaAmostra` separados (`:119-124`).
3. **Comentário repetido:** o do caso das 1500 amostras ficou só com a esteira e a frase sobre a oscilação (`:116`).
4. **`maxBuffer` em `varrerPasta`:** `varrer` e `varrerPasta` agora passam pelo mesmo `rodarGitleaks` (`:99-102`, `:221`), então o limite de 64 MB vale nas duas.
5. **Formato da saída do gitleaks:** o comentário que prende a contagem ao formato `--verbose` da v8.30.1 está em `:127-128`.
6. **Limite da garantia:** o comentário do topo diz o que "sem duas letras juntas" não cobre (`:16-18`).

Recomendações:
- `tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md`, seção "Correção": o texto ainda diz "`varrer` ganhou `maxBuffer` de 64 MB". Desde esta rodada o limite está em `rodarGitleaks`, que `varrer` e `varrerPasta` usam. Vale acertar a frase.
- `tools/guardas/gitleaks.int.test.ts:116`: o comentário começa por "Esteira 40214908506.", e o título do `it` na linha 115 já traz essa referência. Basta a frase sobre a oscilação.
- `tools/guardas/gitleaks.int.test.ts:124`: a linha de `arquivos` ainda tem perto de 140 caracteres. Quebrar o `Array.from` em duas linhas termina o item 2.

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 15:26:59 · `tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md`

VEREDITO: APROVADO

Cenários exigidos:
- Chave aleatória em caixa mista no documento de tarefa: o gitleaks sempre reprova.
- Chave aleatória em minúsculas (o caso `comprida`) no documento de tarefa: o gitleaks sempre reprova, sem depender só da conta de entropia.
- O gerador nunca põe duas letras juntas.
- A troca de `spawnSync` por `rodarGitleaks` não muda o que `varrer` e `varrerPasta` devolvem.

Cobertos:
- **Recomendação da 1ª rodada aplicada.** O caso `reprova a chave genérica em todas as amostras de uma vez…` (`tools/guardas/gitleaks.int.test.ts:115-131`) agora põe metade das 1500 amostras em minúsculas (`:120-123`) e ainda exige que todas as 1500 reprovem (`:130`). Conferi no `.gitleaks.toml:39-40` que essas amostras passam de fato pela exceção do plano. O caminho `tasks/prd-amostra/N_task.md` casa com `^tasks/prd-[a-z0-9-]+/\d+_task\.md$`. Uma chave em minúsculas de 40 caracteres que começa por letra não cabe em `[a-z][a-z0-9]{0,19}` sem `_`, então a linha não é perdoada e precisa reprovar. Ou seja, o gitleaks de verdade agora prova o caminho em minúsculas, e não só a conta.
- Mesmo em minúsculas, a chave continua sem duas letras juntas: `toLowerCase` não muda onde ficam as letras.
- `varrerPasta` (`:221`) agora passa por `rodarGitleaks` (`:99-102`), com o mesmo `maxBuffer` e o mesmo `--verbose` de antes. Não mudou nenhuma asserção dos casos de pasta.
- `linhaDeChave` é declarada dentro do `describe` (`:184`) e usada no caso das 1500 (`:122`). Isso funciona, porque o callback do `it` só roda depois que o corpo do `describe` já foi avaliado.
- Rodei `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts` uma vez: 13 de 13 verdes, em 9,29 s.
- Nada de `.skip`, de teste comentado ou de mock. O gitleaks roda de verdade, na imagem da esteira. Não há IA nem concorrência envolvidas.
- O documento da tarefa (`:40`) já diz que metade das amostras está em minúsculas.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. As que ficaram sem aplicar continuam registradas na tabela do documento, e concordo com o destino de cada uma. A mais importante é o achado da varredura de pasta (`gitleaks dir`), que lê 0 bytes de `tasks/prd-*/N_task.md`. Ela precisa virar uma correção própria, porque esvazia parte do caso `reprova o segredo em arquivo ainda sem commit…` (`:229` e `:233`).

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.gitleaks.toml

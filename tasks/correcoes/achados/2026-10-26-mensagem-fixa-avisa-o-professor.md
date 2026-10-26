# Achados das revisões — `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## llm-integrator · 1ª rodada · APROVADO · 2026-10-26 10:29:46 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO

Perfis usados: nenhum. A mudança é só texto de mensagem fixa e constante compartilhada. Nenhuma chamada de modelo foi criada ou alterada, e as duas mensagens continuam sem passar pelo modelo (D36).
Custo estimado por professor/mês: zero. Não há chamada nova.
Prompt versionado: não se aplica. O texto é constante em código, com teste que o fixa.
Validação de schema: não se aplica. Não há saída de modelo nesta mudança.
Aprovação humana no caminho: não se aplica. A mensagem fixa é determinística e a regra 70 item 3 não é tocada. O texto continua sujeito à revisão pela orientação educacional e por advogado (`docs/aia/tutor.md`, pendência 12).

Bloqueantes: nenhum.

Conferi o que a correção promete, em `packages/shared/src/tutor/sinal.ts:33`, `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:87,94` e `apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts:39`.
- **Constante única:** `FRASE_DO_AVISO_AO_PROFESSOR` fica em `@educa/shared`, o ponto comum entre web e núcleo. As duas mensagens fixas e `FRASE_DO_AVISO_DE_ATENCAO` passam a usá-la. A importação em `@educa/nucleo` não cria dependência nova.
- **Sem texto antigo:** uma busca no código (`apps/` e `packages/`) não achou nenhuma das três redações antigas. As ocorrências restantes estão só em `tasks/` e no mockup antigo de setembro.
- **Limite de 15 palavras:** a frase tem exatamente 15, e o limite do aviso é "até 15".
- **Promessa verdadeira:** "sem ver o que escreveu" bate com o sinal `atencao_humana`, que é estrito e sem conteúdo.
- **Testes e mutações:** os dois testes que reproduzem o defeito conferem o que mudou. O do núcleo exige que a frase seja a última linha das duas mensagens e apareça uma única vez. O da web exige que ela apareça uma única vez em `FRASES_DO_AVISO`. As quatro mutações descritas na tarefa são viáveis e cada uma quebraria um desses testes. Não executei a suíte nem as mutações.
- **Docs:** `TODO.md` e `docs/aia/tutor.md` foram atualizados na mesma tarefa.

Recomendações:
- A frase condicional "Se você contar algo pessoal difícil…" fecha uma mensagem dita depois de o aluno já ter contado. Um tempo verbal que descreva o fato ("seu professor foi avisado") ficaria mais natural, mas isso quebraria a constante única com a introdução. Fica para a revisão pela orientação educacional (pendência 12).
- O mockup `mockups/.antes-da-remodelagem/src/areas/aluno/Tutor.tsx:30` ainda tem a redação antiga. É histórico e não é copiado para o `apps/web`, então não é preciso agir.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-26 10:29:53 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO
Caminho quente tocado: tutor (só o texto da mensagem fixa; o caminho de execução, o limitador e a chamada ao modelo continuam como estavam)
Rate limit: ok (nada mudou)
Fila e prioridade: ok (nada mudou)
Concorrência: protegida (a mudança só troca uma string por uma constante, sem escrita nem estado)
Índice e paginação: ok (não há query nova)
Degradação de IA: não se aplica (a mensagem fixa já sai sem chamar o modelo, D36)
Migration: não se aplica
Métrica e alerta: ok (não há código novo no caminho quente que precise de medida)
Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md:140` ainda descreve o aviso como "quem dá a aula é avisado". Vale alinhar com `FRASE_DO_AVISO_AO_PROFESSOR` ou deixar escrito que a correção de 26/10 substitui esse trecho. Não afeta a carga.
- Procurei as três frases antigas no repositório. Elas só aparecem em `tasks/` (achados, estado, validação, `9_task.md`) e em `mockups/.antes-da-remodelagem/`, que são histórico e não são lidos pelo código. Nenhum e2e nem teste de API dependia delas.

## pedagogia-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-26 10:30:04 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: AJUSTES NECESSÁRIOS
Amostras avaliadas: 3 textos que o aluno lê: a mensagem fixa de assunto delicado, a mensagem fixa de risco à vida e a frase da introdução. Fiz o `git diff` e uma busca por restos do texto antigo.

Problemas por categoria:
- **Nível e tom (1 problema):** a frase única está no futuro hipotético e vai ao fim de uma mensagem que o aluno recebe depois de já ter contado.
- **Alinhamento com a decisão do Joaquim:** cumprido. Há uma constante só, nos três lugares, com 15 palavras, e o `TODO.md` e o `docs/aia/tutor.md` foram atualizados. Não sobrou texto antigo fora de `mockups/.antes-da-remodelagem` e dos históricos em `tasks/`.
- **Veracidade:** "sem ver o que escreveu" confere com o código. `supervisao.service.ts:15` devolve o `atencao_humana` só com tipo, aluno e hora, e `tutor.service.ts:309` e `:351` gravam o sinal sem conteúdo.
- **Gabarito, distratores, tutor socrático, recusa de escopo:** não se aplicam a esta mudança.

Exemplos concretos do que saiu errado:
- Um aluno de 11 anos escreve "meu pai me bate". Recebe: "Obrigado por me contar... Procure hoje seu professor... ligue 188 (CVV)..." e, na última linha, "Se você contar algo pessoal difícil, seu professor é avisado, sem ver o que escreveu."
- Ele já contou. O "Se você contar" soa como algo que ainda não aconteceu, então ele não sabe se o professor já foi avisado. A frase antiga, "Seu professor vai receber um aviso...", dizia isso sem dúvida.
- Na mensagem de risco à vida (`MENSAGEM_DE_RISCO_A_VIDA`) a ambiguidade pesa mais, porque quem lê pode estar em crise.
- O trecho "avisado, sem ver o que escreveu" também pode ser lido como se o sujeito fosse o aluno ("sem ver o que escreveu"). Isso é uma recomendação, não bloqueio.

Ajuste sugerido no prompt ou na recuperação de contexto:
- Manter a constante única, que é a decisão do Joaquim, mas escrever `FRASE_DO_AVISO_AO_PROFESSOR` sem tempo hipotético. Assim ela serve antes (introdução) e depois (mensagem fixa).
- Sugestão: "Quando você conta algo pessoal difícil, seu professor é avisado. Ele não vê o que você escreveu." Isso passa de 15 palavras numa frase só e a introdução limita cada frase a 15. Por isso, como alternativa de uma frase: "Seu professor é avisado quando você conta algo difícil, sem ver o que escreveu."
- Depois da troca, ajustar três pontos:
  - A expectativa em `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts` (`toContain('sem ver o que escreveu')`).
  - A regex de `apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts:56`.
  - Os blocos de mutação da correção.

Bloqueantes:
- `packages/shared/src/tutor/sinal.ts:32` (`FRASE_DO_AVISO_AO_PROFESSOR`), usada como última linha em `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:87` e `:94`. A mensagem que o aluno recebe depois de contar algo grave termina em "Se você contar...", que é condicional. A promessa fica ambígua justamente na hora em que ela importa e é menos clara que a anterior. Correção exigida: reescrever a frase única de modo que valha antes e depois do relato, como acima, e atualizar os testes, as mutações e os docs que a citam (`docs/aia/tutor.md`, `TODO.md`).

Recomendações:
- Deixar claro quem não vê: "ele não vê o que você escreveu".
- Um teste de pedagogia mais direto: afirmar que a frase não começa com "Se" ou "Quando você contar". Hoje os testes só comparam a constante com ela mesma, então não pegariam um texto mal escrito.
- Esta é a mesma frase que vai para a revisão da orientação educacional e do advogado (pendência 12). Vale levar a eles a dúvida do tempo verbal.

Arquivos relevantes (todos sob `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2`):
- `packages/shared/src/tutor/sinal.ts`
- `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`
- `apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts`
- `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-26 10:30:16 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. Mudou só texto: uma constante nova, `FRASE_DO_AVISO_AO_PROFESSOR`, em `packages/shared/src/tutor/sinal.ts`, que agora fecha as duas mensagens fixas do Tutor e o aviso de privacidade da introdução do aluno. Não há migration, schema de dado, DTO nem rota nova.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok, porque nenhuma rota ou repository mudou. Conferi também se a promessa nova diz a verdade, já que ela é mais forte que a antiga ("seu professor é avisado, sem ver o que escreveu"). Hoje ela é cumprida:
- O sinal `atencao_humana` é um objeto estrito com id, tipo, aluno e hora, sem conteúdo (`packages/shared/src/tutor/sinal.ts:47-53`).
- O serviço de supervisão o devolve só com tipo, aluno e hora (`apps/api/src/tutor/supervisao.service.ts:10-15`).
- `GET /v1/tutor/uso` não traz conteúdo de conversa, e o schema estrito recusa (`packages/shared/src/tutor/uso.ts:10-14`).
- `GET /v1/tutor/conversa` é `próprio` do aluno. Nenhuma rota entrega a conversa a outra pessoa (`apps/api/src/tutor/tutor.controller.ts:18-22`).

Logs: limpos, a tarefa não adiciona nenhum.

Auditoria: não se aplica. Nenhuma ação que a regra 20, item 10, manda auditar foi criada ou alterada.

Envio externo: nenhum. As mensagens fixas do D36 continuam saindo sem modelo, e a constante não vai a provedor nenhum.

Seed/fixture: não foram tocados.

Bloqueantes: nenhum.

Recomendações:
1. A frase promete ao aluno, um menor, algo que o código só garante hoje. O aviso às três telas que dependem disso está em `docs/aia/tutor.md` (pendência 12), mas não está no comentário da própria constante (`packages/shared/src/tutor/sinal.ts:25-32`). Vale escrever ali que, no dia em que existir uma tela ou rota que abra a conversa para o professor, a frase tem de mudar junto. Melhor ainda seria um teste que ligue a frase ao schema estrito de `atencao_humana`.
2. `tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md:140` ainda traz a redação antiga ("quem dá a aula é avisado"). O `infra-guardian` também apontou isso. Vale alinhar ou registrar que esta correção substitui o trecho.
3. Não consegui rodar os dois testes novos neste checkout. Os dois falham ao carregar, com `Failed to resolve entry for package "@educa/shared"`, porque o pacote `shared` não está compilado aqui. O erro é de ambiente, não do diff, mas a prova de que os testes passam fica com o `test-engineer` e com a esteira.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-26 10:30:18 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

**O que conferi**
- A correção faz a opção A que o Joaquim escolheu na entrada "25/10/2026 ~17:20" do `estado.md`. A frase agora existe só em `FRASE_DO_AVISO_AO_PROFESSOR`, no `@educa/shared`. As duas mensagens fixas do Tutor terminam nela, e `FRASE_DO_AVISO_DE_ATENCAO` é essa mesma constante.
- A frase cabe no limite: tem 15 palavras, e o teto de 15 é verificado em `textos-da-introducao.test.ts:26`.
- Não sobrou nenhuma redação antiga ("quem dá a aula é avisado", "sem o que você escreveu", "receber um aviso de que você precisa") em `apps`, `packages`, `docs` ou `e2e`. Só aparecem em documentos históricos de tarefa e num build velho em `apps/web/dist`.
- O `TODO.md` e a pendência 12 de `docs/aia/tutor.md` foram atualizados.
- As quatro mutações fazem sentido, cada uma com um teste que fica vermelho: a frase trocada em cada uma das duas mensagens fixas, o literal antigo no aviso e o texto da constante alterado.

**Recomendações**
1. `tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md:140`: a §7b ainda descreve o aviso como "que quem dá a aula é avisado". Não contradiz o código, mas deixou de descrevê-lo. Vale citar `FRASE_DO_AVISO_AO_PROFESSOR` como fonte única, ligada à mensagem fixa do Tutor, e o "sem ver o que escreveu", para quem reabrir a spec.
2. `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md:22`: em "Teste que reproduz", o nome do teste da web está cortado ("…do shared, uma só"). O nome real, que a mutação da linha 55 usa, termina em ", a mesma da mensagem fixa do Tutor". Convém igualar os dois.
3. `tasks/prd-telas-do-aluno-e-primeiro-acesso/estado.md:60`: a decisão continua listada como esperando resposta, sem a marca "RESPONDIDA em 26/10…". Isso é com o Orquestrador, mas precisa entrar antes do pouso.
4. A frase diz "seu professor", e o resto da introdução diz "quem dá a aula" (`TEXTO_DA_SUPERVISAO`) e "O professor da turma". Não é erro de glossário, mas a escolha deveria passar pela revisão de texto da pendência 12, junto com a leitura de "sem ver o que escreveu", em que o sujeito de "escreveu" fica implícito.

## test-engineer · 1ª rodada · APROVADO · 2026-10-26 10:30:35 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** as duas mensagens fixas (assunto delicado e risco à vida) terminam na frase do aviso ao professor, e o aviso de privacidade traz essa mesma frase, uma vez só.
- **Borda 1:** a frase sai de uma das mensagens fixas, ou é escrita de novo à mão.
- **Borda 2:** o aviso da introdução volta à redação antiga ("quem dá a aula é avisado").
- **Borda 3:** a constante perde a metade "sem ver o que escreveu".
- **Borda 4:** a frase passa de 15 palavras ou vira duas frases.
- **Permissão e isolamento:** não se aplicam. A correção mexe só em texto fixo, sem dado de escola, rota nem repository.
- **Concorrência:** não se aplica, porque não há escrita.

**Cobertos:**
- **Mutações 1 e 2:** trocar a frase em `MENSAGEM_DE_RISCO_A_VIDA` ou em `MENSAGEM_DE_ASSUNTO_DELICADO` deixa vermelho o caso `turno-do-tutor.test.ts › as duas mensagens fixas terminam na frase do aviso ao professor, a mesma da introdução`. A última linha deixa de ser a constante. O `split(...).toHaveLength(2)` ainda pega a frase repetida.
- **Mutação 3:** voltar `FRASE_DO_AVISO_DE_ATENCAO` à frase antiga deixa vermelhos o caso novo `textos-da-introducao.test.ts › o aviso de atenção é a frase do aviso ao professor do shared, uma só, a mesma da mensagem fixa do Tutor` e o caso da tabela `diz quem vê: se o aluno conta algo pessoal difícil, ...`.
- **Mutação 4:** encurtar a constante no shared deixa vermelho o caso da tabela, que tem a regex ancorada com "sem ver o que escreveu". Também deixa vermelho o `toContain('sem ver o que escreveu')` do teste das mensagens fixas.
- **Borda 4:** o teste de forma que já existia ("cada frase é uma frase só, de até 15 palavras") cobre. Contei a frase nova e ela tem 15 palavras exatas.
- **Seção "Mutações" contra o diff:** há bloco para cada um dos três lugares que usam a frase e para a constante. O `index.ts` só exporta e não tem cláusula própria.
- **Os testes citados no documento:** os dois existem e passam (`npx vitest run` nos dois arquivos: 533 de 533 verdes).
- **O resto:** não há `.skip`, teste comentado nem mock. Nenhum dos testes chama provedor de IA, porque são regra pura sobre constantes.
- **Frase antiga em outro lugar:** `apps/`, `packages/` e `e2e/` não têm mais nenhum literal antigo ("sem o que você escreveu", "quem dá a aula é avisado"). Os testes de integração da API usam as constantes, não os literais.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/__fixtures__/aluno.ts:250-255`: a fixture `MENSAGEM_FIXA` diz que é "como a API a manda (D36)", mas tem só as três primeiras linhas e não traz a frase do aviso ao professor. A falta já vinha de antes, com a frase antiga, mas é uma terceira cópia à mão do texto que esta correção quis deixar numa constante só. Sugestão: terminar a fixture em `FRASE_DO_AVISO_AO_PROFESSOR`, importada de `@educa/shared`. Os testes em `e2e/aluno-tutor.spec.ts:310` e `e2e/aluno-fluxo.spec.ts:196` poderiam então conferir que o cartão mostra essa frase. Hoje nenhum e2e prova que o aluno vê a linha do aviso no cartão da mensagem fixa.
2. Na seção "Teste que reproduz" do documento, o nome do teste da web está cortado ("... do shared, uma só"). O nome real, que é o usado no bloco de mutação, continua com ", a mesma da mensagem fixa do Tutor". Vale citar o nome inteiro, para quem procura pelo nome.
3. Para o `pedagogia-reviewer`: na mensagem fixa, a frase chega depois de o aluno já ter contado, e o condicional "Se você contar algo pessoal difícil" soa como regra geral e não como aviso do que acabou de acontecer. Não é questão de teste, e a decisão de usar uma constante só foi do Joaquim. Fica para a revisão de texto da pendência 12 de `docs/aia/tutor.md`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/shared/src/tutor/sinal.ts`

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-26 10:30:57 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta correção. O diff mexe só em texto (as duas mensagens fixas do Tutor, o aviso de privacidade, uma constante nova no `shared`, docs e `TODO.md`). Todos com autor humano? Sim, nenhum caminho novo e nenhum alterado.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. Não há saída de IA nova. A mensagem do assunto delicado continua fixa, sem modelo (`semModelo`, D36), e a exceção do D47 não passa a valer para outro agente.

Supervisão do tutor: ok. Conferi se a frase nova é verdadeira, porque ela promete mais que a antiga. "Sem o que você escreveu" falava do aviso; "sem ver o que escreveu" fala do professor. A promessa se sustenta no código:
- O professor recebe o sinal. `tutor.service.ts:351` grava `atencao_humana` em `#encaminhar` sem condição, e o comentário em `:295-296` diz que suspender os sinais não cala esse aviso.
- O professor não vê o texto:
  - o sinal é `strictObject` só com tipo, aluno e hora (`packages/shared/src/tutor/sinal.ts:44-50`);
  - `supervisao.repository.ts:83` não lê `mensagem_tutor.texto`;
  - a matriz dá `tutor.ler_conversa: 'nunca'` aos três papéis que não são aluno (`packages/shared/src/permissao/matriz.ts:226,268,310`).
- Os dois testes que provam a correção passam: 533 testes em 2 arquivos, rodados pelo projeto `unidade` na raiz.

Autonomia declarada e visível: sim, sem mudança.

Bloqueantes: nenhum.

Recomendações:
1. **A promessa pode ficar falsa no F9.** `docs/agentes.md:139-141` e `docs/regulacao.md` seção 7 preveem que orientação ou direção tenham acesso auditado ao conteúdo, para notificar o Conselho Tutelar (Lei 13.819/2019). A frase de hoje fala só do professor e é verdadeira. Mas um aluno em risco lendo "sem ver o que escreveu" pode entender que ninguém vê. O comentário de `FRASE_DO_AVISO_AO_PROFESSOR` (`packages/shared/src/tutor/sinal.ts:25-31`) cita só a tela que abriria a conversa ao professor. Vale incluir também o caminho do F9 como gatilho para revisar a frase, e fazer o mesmo na nota do `TODO.md`.
2. **Frase condicional na hora errada.** Na mensagem fixa, o aluno acabou de contar e lê "Se você contar algo pessoal difícil, seu professor é avisado…". Na introdução a condicional serve; ali ela soa genérica. É assunto do `pedagogia-reviewer` e da revisão da orientação educacional (pendência 12). Não bloqueia: a decisão do Joaquim foi justamente usar uma frase só.
3. **Dois nomes para a mesma pessoa no aviso.** O grupo "Quem vê" agora diz "seu professor", e a frase da supervisão (`TEXTO_DA_SUPERVISAO`) diz "Quem dá a aula". O mesmo aviso chama a mesma pessoa de dois jeitos. Vale levar à mesma revisão de texto.
4. **Texto antigo ainda em docs da spec.** O `infra-guardian` já apontou que `tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md:140` ainda diz "quem dá a aula é avisado". Alinhar, ou registrar que esta correção substitui o trecho.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/shared/src/tutor/sinal.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/src/tutor/tutor.service.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/src/tutor/supervisao.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/shared/src/permissao/matriz.ts`

## pedagogia-reviewer · 2ª rodada · APROVADO · 2026-10-26 10:38:06 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO

Amostras avaliadas: 3 (a mensagem fixa de assunto delicado, a mensagem fixa de risco à vida e a frase do aviso de privacidade). Li o diff da rodada, `turno-do-tutor.ts:80-95` e o documento da correção.

Problemas por categoria
- Nível: a frase tem 15 palavras, dentro do limite do aviso para alunos de 11 anos, e a estrutura é simples.
- Gabarito e alinhamento: a frase diz o que o sinal `atencao_humana` faz hoje. O professor é avisado e não vê o texto. O comentário da constante registra os dois gatilhos para mudá-la: a tela que abre a conversa (regra 50, item 10) e o acesso auditado da orientação ou da direção no F9 (Lei 13.819/2019).
- Tom: não há conselho, sarcasmo nem elogio vazio. As mensagens não prometem sigilo que o sistema não cumpre.
- Tutor (D36): a mensagem continua fixa, sem modelo. Mantém o 188 e a identificação como IA. Não aconselha nem continua o assunto, e o teste de "frases proibidas" segue valendo.

Exemplos concretos
- Correção da rodada 1: era a frase "Se você contar…", ambígua depois do relato. Agora o último parágrafo das duas mensagens fixas é "Em assunto pessoal difícil, seu professor é avisado, mas não vê o que você escreveu." Vale antes de o aluno escrever, na introdução, e depois, na mensagem fixa.
- Os testes novos cobrem a regressão. Um barra "se/quando/caso" e "contar/contou" na constante. O outro exige que a última linha das mensagens fixas não seja condicional e contenha " é avisado,". As mutações do documento da correção casam com eles.
- Os docs foram atualizados (`docs/aia/tutor.md`, `TODO.md`, `techspec.md`). Uma busca no repositório não achou nenhuma das redações antigas ("Se você contar algo pessoal difícil", "sem ver o que escreveu", "sem o que você escreveu").
- A frase combina com o resto da mensagem. O aluno é mandado procurar o professor, e a frase diz que o professor não vê o que ele escreveu, então o aluno sabe que precisa contar de novo.

Ajuste sugerido no prompt ou na recuperação de contexto: nenhum.

Bloqueantes: nenhum.

Recomendações
- `docs/aia/tutor.md:398`: o trecho que descreve o conteúdo do aviso ainda parafraseia "se ele contar algo pessoal difícil". A frase real já não é condicional. Alinhar a paráfrase na revisão de texto da pendência 12.
- "Em assunto pessoal difícil" é mais abstrato que a redação antiga para um aluno de 11 anos. É aceitável, mas vale testar a compreensão na revisão da orientação educacional. A pendência 12 já cobre.
- `e2e/__fixtures__/aluno.ts` (~250-255) ainda não traz a frase na fixture `MENSAGEM_FIXA`. Já está no `TODO.md` e só roda na esteira.

## llm-integrator · 2ª rodada · APROVADO · 2026-10-26 10:38:10 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO
Perfis usados: nenhum. A tarefa não adiciona nem altera chamada de modelo. O diff muda só o texto de uma constante e a documentação. As mensagens fixas continuam sendo emitidas sem modelo (D36), na rota que já existia.
Custo estimado por professor/mês: R$ 0, sem chamada nova de modelo.
Prompt versionado: não se aplica. As mensagens fixas são constantes em código, sem prompt de modelo, e não houve mudança nesse ponto.
Validação de schema: não se aplica. Nenhuma saída de modelo foi tocada.
Aprovação humana no caminho: não se aplica. A mensagem fixa é resposta determinística ao aluno (D36), não saída gerada que dependa de aprovação (regra 70, item 3). O sinal `atencao_humana` continua estrito, sem conteúdo.
Bloqueantes: nenhum.
Recomendações:
- A fixture de e2e `MENSAGEM_FIXA` (`e2e/__fixtures__/aluno.ts`) e as specs `e2e/aluno-tutor.spec.ts` e `e2e/aluno-fluxo.spec.ts` ainda não conferem a frase nova. O `TODO.md` registra essa lacuna como "Falta", e ela só roda na esteira. Convém fechá-la logo, para o e2e não ficar com texto antigo.
- A frase tem 15 palavras (contei: "Em assunto pessoal difícil, seu professor é avisado, mas não vê o que você escreveu."), então cabe no limite do aviso. O teste novo (`textos-da-introducao.test.ts:77-81`) cobre "sem condicional" e "sem contar/contou", mas não o teto de 15 palavras. Um `expect` de contagem de palavras travaria isso.
- Os dois gatilhos de mudança da frase (tela ou rota que abre a conversa, e o F9 com acesso auditado) estão registrados em `sinal.ts`, `docs/aia/tutor.md` e `TODO.md`. A fonte única `FRASE_DO_AVISO_AO_PROFESSOR` é usada pelo `turno-do-tutor.ts` e pelo `aviso-de-privacidade.ts`, e os testes de `turno-do-tutor.test.ts:353-354` exigem que a frase seja a última linha, uma vez só.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-26 10:38:29 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova ou alterada. O diff da rodada 2 não mexe em migration nem em schema Drizzle.

Queries verificadas: nenhuma query, repository ou endpoint novo ou alterado. A mudança fica em quatro lugares:
- o texto da constante `FRASE_DO_AVISO_AO_PROFESSOR` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/shared/src/tutor/sinal.ts:38`, mais o comentário acima dela;
- as asserções de texto em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts` e em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts`;
- a documentação em `TODO.md`, `docs/aia/tutor.md` e `techspec.md`.

O schema do sinal (`strictObject` com `id: z.uuid()`) continua igual. O sinal `atencao_humana` continua sem conteúdo e nomeado só ao professor da turma (D34). Nenhum caminho de leitura muda.

Teste de isolamento: não se aplica. A rodada não cria módulo, rota nem consulta, e nada do que já foi auditado na rodada 1 mudou.

Correções exigidas na rodada anterior: nenhuma.

Bloqueantes: nenhum

Recomendações:
- O `TODO.md` registra que a fixture `MENSAGEM_FIXA` em `e2e/__fixtures__/aluno.ts` ainda não termina na frase nova, e que `e2e/aluno-tutor.spec.ts` e `e2e/aluno-fluxo.spec.ts` ainda não conferem essa frase no cartão. Isso não afeta o isolamento, mas a fixture fica dessincronizada da constante até a esteira rodar. Vale fechar antes do pouso.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-26 10:38:41 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A §7b da `techspec.md` foi reescrita junto com a mudança. Diz que o professor é avisado em assunto pessoal difícil, sem ver o que o aluno escreveu, e aponta `FRASE_DO_AVISO_AO_PROFESSOR` como a única fonte do texto. O `cenarios.md` não cita a frase, então não precisou mudar.

Portão local: carimbo válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo).

Bloqueantes: nenhum.

Nesta rodada conferi:
- **Frase nova:** a constante em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/shared/src/tutor/sinal.ts:38` agora é "Em assunto pessoal difícil, seu professor é avisado, mas não vê o que você escreveu.". São 15 palavras, dentro do limite do aviso, e a frase vale tanto antes do relato (na introdução) quanto depois (na mensagem fixa).
- **Mensagens fixas:** as duas, em `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:87` e `:94`, terminam na constante, sem cópia à mão.
- **Testes:**
  - A asserção em `turno-do-tutor.test.ts:345` e o caso de `textos-da-introducao.test.ts:56` foram atualizados para o texto novo.
  - Os dois testes novos contra o tom condicional (`turno-do-tutor.test.ts:358`, `textos-da-introducao.test.ts:77`) cobrem as duas pontas.
  - Os blocos de mutação 4 e 5 do documento usam o texto novo, e o nome do caso citado bate com o `it.each('diz %s')`.
- **Documentação:** `TODO.md`, `docs/aia/tutor.md` (pendência 12) e o comentário da constante registram os dois gatilhos para mudar a frase: a tela que abre a conversa (regra 50, item 10) e o acesso auditado no F9 (Lei 13.819/2019). Os três dizem a mesma coisa.
- **Redação antiga:** ainda aparece só em histórico (`9_task.md`, `achados/`, `validacao.md`, `estado.md`) e no build `apps/web/dist`. Nada disso é código-fonte nem teste ativo.

Recomendações:
- Gerar de novo o build `apps/web/dist`, que ainda tem a frase antiga, antes de qualquer demonstração feita a partir dele.
- "Em assunto pessoal difícil" é uma construção elíptica para um aluno de 11 anos. Vale levar à revisão de texto da pendência 12 (orientação educacional), como já está registrado. A legibilidade em si é com o `pedagogia-reviewer`.
- A recomendação da rodada 1 sobre a fixture de e2e `MENSAGEM_FIXA` continua pendente, registrada no `TODO.md`. Hoje ela diverge da mensagem real.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-26 10:38:44 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

```
VEREDITO: APROVADO
Caminho quente tocado: tutor (só o texto da mensagem fixa, que é constante; nada mudou em execução)
Rate limit: ok (não mudou)
Fila e prioridade: ok (não mudou)
Concorrência: protegida (nenhuma escrita nova)
Índice e paginação: ok (não se aplica, nenhuma query nova)
Degradação de IA: não se aplica (a mensagem fixa sai sem chamar o modelo, como antes)
Migration: não se aplica
Métrica e alerta: ok (não mudou)
Bloqueantes: nenhum
Recomendações:
- A fixture `MENSAGEM_FIXA` em /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/__fixtures__/aluno.ts ainda não termina na frase nova. Também falta /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/aluno-tutor.spec.ts e /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/aluno-fluxo.spec.ts conferirem a frase no cartão. As duas coisas já estão anotadas em /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/TODO.md. Procurei a frase antiga em apps, packages e e2e e ela não aparece em nenhum lugar, então nenhum teste vai quebrar por causa da troca.
```

Nesta rodada só mudou texto: a constante `FRASE_DO_AVISO_AO_PROFESSOR` em /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/shared/src/tutor/sinal.ts:38, os testes que conferem essa frase, e os documentos. O comportamento de carga não mudou em nada. Os dois arquivos de teste afetados passam: `turno-do-tutor.test.ts` e `textos-da-introducao.test.ts`, com 535 testes. Nenhum deles chama provedor pago.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-26 10:38:45 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. O diff muda só texto. A constante `FRASE_DO_AVISO_AO_PROFESSOR` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/shared/src/tutor/sinal.ts:38` passou de "Se você contar algo pessoal difícil, seu professor é avisado, sem ver o que escreveu." para "Em assunto pessoal difícil, seu professor é avisado, mas não vê o que você escreveu.". Junto vieram o comentário da constante, dois testes novos, um teste ajustado e os documentos (`TODO.md`, `docs/aia/tutor.md`, techspec). Nenhuma migration, schema, DTO, rota, log ou envio novo.

Fora da tabela de dados do docs/lgpd.md: nada. Não há campo novo.

Autorização por objeto: ok. A frase nova promete, de forma mais geral, que o professor "não vê o que você escreveu". Por isso conferi se essa promessa ao titular é verdadeira hoje (LGPD art. 6º, VI e art. 14, § 6º):
- `GET /v1/tutor/conversa` e `GET /v1/tutor/memoria` só servem ao próprio aluno (`apps/api/src/tutor/tutor.controller.ts:18-24`, 39-51).
- `GET /v1/sinais` só entrega tipo, aluno, referência e hora, e `supervisao.repository.ts:83` declara que não lê `mensagem_tutor.texto` nem junta o sinal com a mensagem.
- `governanca.repository.ts` e `analista.repository.ts` não leem o texto da mensagem.

A promessa vale para o código atual. Os gatilhos que obrigam a mudar a frase estão escritos no comentário da constante e no `TODO.md`: (a) surgir tela ou rota que abra a conversa ao professor; (b) o F9 dar à orientação ou à direção acesso auditado ao conteúdo (Lei 13.819/2019).

Logs: limpos. Nenhum log foi tocado.

Auditoria: presente. Nenhuma ação que a regra 20, item 10, manda auditar foi criada ou alterada.

Envio externo: nenhum novo. A mensagem fixa continua sem modelo (D36). O que muda é só a última linha, que é a constante.

Seed/fixture: sintético. Nenhum seed ou fixture foi tocado.

Bloqueantes: nenhum.

Recomendações:
- A fixture de e2e `MENSAGEM_FIXA` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/__fixtures__/aluno.ts`, ~250-255) ainda não termina na frase nova. A pendência já está no `TODO.md` e não é de privacidade.
- Na revisão de texto por advogado (pendência 12 de `docs/aia/tutor.md`), avaliar se "não vê o que você escreveu" deve ressalvar o acesso auditado da coordenação ao que é atendido pelo pedido do titular (`apps/api/src/privacidade/titulares.repository.ts`). Hoje a frase fala só do professor, e o aviso já diz "Ver algo seu fica registrado", então não há promessa falsa. Fica o registro de que a frase não cobre outros papéis.

Pergunta de fechamento: a mudança não altera o que se responde sobre um aluno nem para onde o dado foi enviado. A resposta continua a mesma da rodada 1, que foi aprovada.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-26 10:38:49 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum neste diff. A tarefa só muda texto, testes e documentos, e nenhum arquivo alterado toca `Nota`. Todos com autor humano? sim (nada mudou desde a 1ª rodada).

Decisão autônoma sobre aluno: ausente. A mensagem fixa só encaminha o aluno a um adulto e grava o sinal `atencao_humana`. Ela não aprova, não reprova e não encaminha a trajetória do aluno.

Aprovação registrada: ok. A mensagem fixa é texto escrito à mão, sem modelo (D36). Ela faz parte da resposta do tutor, que é a exceção D47, e a exceção não se estendeu a outro agente.

Supervisão do tutor: ok. A nova frase "Em assunto pessoal difícil, seu professor é avisado, mas não vê o que você escreveu." é verdadeira hoje, e conferi no código:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/src/tutor/supervisao.repository.ts:83` e `:165`: a supervisão não lê `mensagem_tutor.texto` e não junta sinal com conversa.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/src/tutor/supervisao.service.ts:15`: o `atencao_humana` sai só com tipo, aluno e hora.
- `:159` do mesmo repository: o sinal chega a todo professor com vínculo na turma, então "seu professor" está correto.
- `GET /v1/tutor/conversa` mostra ao aluno só a conversa dele. Nenhuma rota mostra a conversa ao professor.

O professor continua sabendo que o aluno precisa de um adulto. A frase não esconde nada dele e não promete vigilância ao aluno. Os dois gatilhos que obrigam a mudar a frase estão escritos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/shared/src/tutor/sinal.ts:32-36`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/TODO.md` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/docs/aia/tutor.md` (pendência 12):
- (a) passar a existir uma tela ou rota que abra a conversa do aluno ao professor;
- (b) o F9 dar à orientação ou à direção acesso auditado ao conteúdo.

O texto vem de uma constante só e chega aos três lugares: as duas mensagens fixas em `turno-do-tutor.ts:87` e `:94` e o aviso em `aviso-de-privacidade.ts:39`. Tem 15 palavras, dentro do limite do aviso. Os testes exigem que a frase seja a última linha das duas mensagens e que não venha em tempo condicional.

Autonomia declarada e visível: sim (nada mudou desde a 1ª rodada).

Bloqueantes: nenhum.

Recomendações:
- A fixture `MENSAGEM_FIXA` (`e2e/__fixtures__/aluno.ts`, ~250-255) e as specs `e2e/aluno-tutor.spec.ts` e `e2e/aluno-fluxo.spec.ts` ainda não conferem a frase no cartão. A pendência já está registrada no `TODO.md`, e convém fechá-la antes do primeiro aluno real, porque só o e2e prova o que a tela entrega.
- Alguns documentos antigos ainda citam a redação anterior: `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md:90` e `validacao.md:452`. Não pedem ação, mas uma nota de que foram substituídos pela correção `2026-10-26-mensagem-fixa-avisa-o-professor` evita confusão em auditoria.
- Na frase do aviso, "seu professor" convive com "quem dá a aula" em `TEXTO_DA_SUPERVISAO`. Já está encaminhado para a pendência 12 (revisão de texto).

## test-engineer · 2ª rodada · APROVADO · 2026-10-26 10:39:17 · `tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz: as duas mensagens fixas (assunto delicado e risco à vida) e o aviso de privacidade usam a mesma `FRASE_DO_AVISO_AO_PROFESSOR`, e ela aparece uma vez só em cada lugar.
- Borda 1: a frase serve antes do relato (introdução) e depois dele (mensagem fixa). Ela não pode ter condição ("se", "quando", "caso") nem "contar" ou "contou".
- Borda 2: a frase continua dizendo as duas coisas que o sinal faz. O professor é avisado e não vê o que o aluno escreveu, porque o sinal `atencao_humana` não leva conteúdo.
- Borda 3: a frase tem até 15 palavras, o limite do aviso. A nova tem 15.
- Permissão e isolamento: não se aplicam. A mudança é só de texto, sem rota, query nem dado de escola.

Cobertos:
- `turno-do-tutor.test.ts › as duas mensagens fixas terminam na frase do aviso ao professor, a mesma da introdução`: a última linha é a constante, e ela aparece uma vez.
- `turno-do-tutor.test.ts › a última linha das mensagens fixas não é condicional, porque o aluno já contou` (novo): roda nas duas mensagens.
- `turno-do-tutor.test.ts` (linha 345): passou a exigir 'não vê o que você escreveu'.
- `textos-da-introducao.test.ts › diz quem vê: em assunto pessoal difícil, o professor é avisado, mas não vê o que o aluno escreveu`: confere a frase inteira, com âncoras de início e fim.
- `textos-da-introducao.test.ts › a frase do aviso ao professor vale antes e depois do relato, sem tempo hipotético` (novo).
- `textos-da-introducao.test.ts › cada frase é uma frase só, de até 15 palavras` cobre o limite de tamanho.

O que conferi:
- **Mutações:** os seis blocos chegam às suas cláusulas.
  - Os dois primeiros trocam a constante de cada mensagem fixa (as linhas 86 e 93 de `turno-do-tutor.ts` batem com o contexto dos blocos).
  - O terceiro tira a constante do aviso do aluno.
  - O quarto tira o "mas não vê o que você escreveu".
  - O quinto e o sexto voltam a frase para a condição, no shared e na mensagem fixa.
  - Cada um derruba uma asserção sobre o resultado, não um erro de carga.
  - Os nomes dos testes citados existem. O do quarto bloco sai do `it.each` com o título `'diz %s'`.
- **Execução:** rodei os dois arquivos, 535 de 535 verdes. Os dois pacotes já leem o texto novo de `@educa/shared`: a regex fixa da web e o `toContain` do nucleo passaram com a frase nova. Então o teste não usa uma versão compilada desatualizada.
- **Texto antigo:** procurei nos `.ts` e `.tsx` versionados as redações antigas ("sem ver o que escreveu", "Se você contar algo pessoal", "precisa de atenção, sem o que"). Não sobrou nenhuma.
- **Proibidos:** não há `.skip`, teste comentado, mock nem chamada de provedor. Os testes são de texto puro.
- **Concorrência:** não se aplica.

Bloqueantes: nenhum.

Recomendações:
- O cenário de e2e continua só registrado no `TODO.md`. A fixture `MENSAGEM_FIXA` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/__fixtures__/aluno.ts`, cerca das linhas 250 a 255) ainda não termina na constante, e os specs do tutor e do fluxo do aluno não conferem a frase no cartão. Sem isso, nada prova na tela que o aluno lê a frase.
- A asserção `/ é avisado,/` do teste novo do nucleo prende uma vírgula da redação. Na revisão de texto da pendência 12 ela vai quebrar sem que a regra tenha sido violada. Uma opção mais estável é exigir `toBe(FRASE_DO_AVISO_AO_PROFESSOR)` e deixar a forma da frase só no teste da web, que já faz isso.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/shared/src/tutor/sinal.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/tasks/correcoes/2026-10-26-mensagem-fixa-avisa-o-professor.md`

# Achados das revisões — `tasks/correcoes/2026-10-17-agentes-carregando-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 18:56:28 · `tasks/correcoes/2026-10-17-agentes-carregando-estoura-o-prazo.md`

VEREDITO: APROVADO
Tela vista: sim (6 fotos lidas, escola cheia e vazia, em 1366 px e em 360 px). A correção não altera nenhuma tela. A tarefa só põe `test.slow()` no caso `paginaNaoRola` de `e2e/agentes.spec.ts`, e o diff tem 3 linhas, todas de teste. Li as fotos de `/coordenacao/agentes` para confirmar que a tela segue como estava.
Estados: ok. Nenhum componente mudou. Carregando e vazio já estavam cobertos pelo próprio caso, que segura a leitura e verifica "Carregando os agentes…". A foto da escola vazia mostra a tela limpa, com os três agentes e as funções.
Acessibilidade: sem alteração. Nas fotos, o foco e os rótulos das abas e dos botões aparecem legíveis, e o contraste é bom.
Chromebook fraco: a correção trata exatamente de CPU ×4 e rede móvel, que deixam o `celular` do runner lento. O relógio do caso passa de 30 s para 90 s. As asserções não mudam, e a espera de 5 s de `paginaNaoRola` fica como estava. O pior tempo medido (29,7 s) usa cerca de 33% do novo relógio.
Celular: 360 px sem rolagem horizontal e sem texto cortado. Os botões "Suspender esta função" e a barra inferior têm alvo adequado, e o aviso de incidente cabe na largura. A barra inferior aparece no meio das fotos longas porque a captura de página inteira costuma repetir elementos fixos. Não é defeito da tela, e a foto vazia curta mostra a barra no lugar certo.
Ação oficial protegida: sim. A tarefa não toca em ação oficial.

Bloqueantes: nenhum.

Recomendações:
- O próprio documento da tarefa aponta `e2e/agentes.spec.ts:302` (28,7 s) e `:183` (25,5 s) perto dos 30 s no `celular`. Vale tratá-los em correção própria, antes que estourem como este. O Orquestrador decide.
- Na foto da escola cheia, o aviso de incidente de segurança cobre a tela, como o prompt já avisava. O texto "Segunda linha do texto." vem do dado sintético da vitrine, não do produto.
- O comentário acima do `test.slow()` diz "passa dos 30 s no runner". A medição na máquina de desenvolvimento foi de 26,5 a 29,7 s. Está coerente com o que o documento da tarefa afirma, e não bloqueia.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/agentes.spec.ts` (linha 164, em diante)
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/correcoes/2026-10-17-agentes-carregando-estoura-o-prazo.md`

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 18:57:53 · `tasks/correcoes/2026-10-17-agentes-carregando-estoura-o-prazo.md`

VEREDITO: APROVADO

**Cenários exigidos:** a correção só aumenta o tempo de um caso de teste e não muda nada no produto. Por isso ela não tem caminho feliz, borda, permissão nem isolamento próprios. O que precisa ser provado:
1. O caso `paginaNaoRola` continua rejeitando a medida enquanto a tela mostra "Carregando os agentes…", e continua aceitando depois que a leitura termina.
2. O caso deixa de estourar o relógio no `celular` sem que nenhuma asserção mude.
3. A folga nova não depende de a máquina estar livre.

**Cobertos:**
- **Asserções:** `e2e/agentes.spec.ts:164-184` continua com as mesmas asserções. A tela em "Carregando…" fica visível com a leitura segurada (linha 179). `paginaNaoRola` rejeita com `/ainda está carregando/` (linha 180). Depois de `segurada.abrir()`, o cartão do Assistente aparece (linha 182) e a mesma função aceita a tela pronta (linha 183). O diff só acrescenta o comentário e o `test.slow()` nas linhas 165-167.
- **O teste continua valendo:** a espera de `paginaNaoRola` em `e2e/__fixtures__/coordenacao.ts:98` e o `PRAZO_DA_ENTRADA_MS` não mudaram, e nenhum mock esconde a regra. Se a guarda de "Carregando" sair de `paginaNaoRola`, a linha 180 falha do mesmo jeito.
- **Mutações:** a seção diz que não há cláusula a mutar. Confere com o `git diff`: nenhuma linha de produto nem asserção nova.
- **Folga:** o vermelho com `--timeout=22000` (4 de 4) virou verde (4 de 4), e houve 20 de 20 verdes com o relógio normal. O caso usa no máximo 33% dos 90 s, então não depende da máquina folgada.
- **Rodei aqui:** `npx playwright test e2e/agentes.spec.ts -g "paginaNaoRola" --project celular` passou (1 passed, 30,3 s).
- Não há `.skip`, teste comentado nem provedor de IA envolvido.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **A tabela da "Causa" contradiz o sintoma.** Em `tasks/correcoes/2026-10-17-agentes-carregando-estoura-o-prazo.md:27,34-35` está escrito que o caso "nem chegou" à linha 179 e que o relógio acabou "com `segurada.abrir()` ainda por vir". Só que na numeração de antes do diff a linha 179 é o `toBeVisible` do cartão, que vem depois de `segurada.abrir()` (linha 178 em `HEAD`). O próprio erro diz "with timeout 20000ms" nessa asserção. Então o caso passou pela rejeição, abriu a leitura e morreu esperando o cartão aparecer. A conclusão continua certa (é tempo, nada travou, e os 20 de 20 verdes confirmam), mas o texto deveria dizer isso.
2. **O "achado à parte" (linha 23) cita mal um dos casos.** `agentes.spec.ts:302` em `HEAD` é o caso "a coordenação de B entra na aba da de A", que já tem `test.slow()` (hoje na linha 306). Os 28,7 s dele cabem nos 90 s. O único caso do arquivo realmente sem `test.slow()` é o de `:183` em `HEAD`, "três funções no Assistente…", hoje na linha 186, que leva 25,5 s no `celular`. É esse que o Orquestrador deve avaliar.
3. **O comentário do teste (linhas 165-166) repete o erro da recomendação 1.** Ele diz que o tempo passa dos 30 s "antes de a leitura segurada abrir". Quando a recomendação 1 for corrigida, vale ajustar o comentário junto.

Não abri as fotos da tela: a correção não toca o produto, e elas não pesam nesta auditoria.

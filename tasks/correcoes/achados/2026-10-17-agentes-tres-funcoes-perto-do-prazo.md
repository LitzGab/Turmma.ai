# Achados das revisões — `tasks/correcoes/2026-10-17-agentes-tres-funcoes-perto-do-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 19:33:42 · `tasks/correcoes/2026-10-17-agentes-tres-funcoes-perto-do-prazo.md`

VEREDITO: APROVADO

Tela vista: sim (6 fotos lidas, cheia e vazia, computador e celular, a tela de Agentes). A correção só muda o relógio de um caso de e2e, então a tela não mudou. A leitura serviu para confirmar que nada regrediu.

Estados: ok. A mudança não toca estados. A aba de agentes é configuração e não lista dado, então a escola vazia mostra a mesma tela completa, com o convite a ler e suspender cada função. O carregando e o erro têm cobertura no vizinho `:164` e no `:307`, que já têm `test.slow()`.

Acessibilidade: sem alteração. Nas fotos, o foco e o contraste dos selos e dos botões estão legíveis, e os campos têm rótulo. As abas têm nome textual.

Chromebook fraco: a correção ajuda aqui. O caso rodava a 25,5 s de um limite de 30 s no projeto `celular` da esteira, com CPU ×4. O `test.slow()` triplica o relógio para 90 s, sem tirar nenhuma asserção. O diff mostra só a linha `test.slow()` e o comentário com o motivo, na primeira linha do caso. Isso bate com o que o texto da correção diz que mudou. A prova do vermelho com `--timeout=16000` (4 de 4 vermelhos antes, 4 de 4 verdes depois) é adequada para uma correção só de relógio. As mutações dizem que não há cláusula de produto a mutar, e concordo.

Celular: nas fotos de 360 px não há rolagem horizontal nem texto cortado. As abas quebram em duas ou três linhas sem esconder a ação. "Suspender esta função" é um botão largo, com altura de cerca de 40 px nas fotos. Esse botão não é o que esta tarefa altera. A barra inferior aparece no meio da página na foto do celular. Isso é efeito da captura de página inteira com elemento fixo, não defeito da tela.

Ação oficial protegida: sim. A suspensão passa por diálogo, e o caso de e2e continua cobrindo o fluxo de abrir o diálogo, suspender, retomar e conferir o banco. Nenhuma asserção saiu.

Bloqueantes: nenhum.

Recomendações:
- O diálogo "Aviso de incidente de segurança" aparece cortado na borda inferior nas fotos de computador e de celular, e o botão de confirmar não está à vista. Provavelmente ele rola por dentro do diálogo, mas a foto não prova isso. Vale conferir na validação de `/coordenacao/agentes`, com o diálogo aberto, que o botão de confirmar fica visível ou alcançável por rolagem em 360 px e em 1366×768. Isso é de outra tarefa, não desta.
- O achado `agentes.spec.ts:307`, em que a carga do trecho da rota falhou uma vez ("A página não chegou até aqui"), ficou registrado como não reproduzido. Concordo em esperar para ver se volta na esteira antes de abrir correção própria.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/agentes.spec.ts` (linha 190, `test.slow()`)
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/correcoes/2026-10-17-agentes-tres-funcoes-perto-do-prazo.md`

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 19:33:43 · `tasks/correcoes/2026-10-17-agentes-tres-funcoes-perto-do-prazo.md`

VEREDITO: APROVADO

Cenários exigidos: esta correção só mexe no relógio de um teste e não muda regra de produto. Bastam três coisas:
- o caso estoura com um relógio menor antes da correção e passa depois;
- nenhuma asserção do caso muda ou sai;
- não entra `.skip`, `.only` nem mock que esconda a regra.

Cobertos:
- **Diff mínimo:** o `git diff` mostra só `test.slow()` e um comentário em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/agentes.spec.ts:190-191`. Nenhuma asserção, helper ou `PRAZO_DA_ENTRADA_MS` foi tocado.
- **Igual aos vizinhos:** os sete casos do arquivo agora têm `test.slow()` (linhas 92, 130, 167, 191, 231, 257, 308). Não há `.skip`, `.only` nem relógio próprio.
- **Vermelho e verde documentados:** o documento registra o caso vermelho com `--timeout=16000` antes da correção (4 de 4) e verde depois (4 de 4), e 20 de 20 verdes com o relógio normal. O vermelho é pelo motivo certo (`Test timeout of 16000ms exceeded`), porque o relógio é exatamente o que a correção muda. Não rodei esses comandos; só conferi o diff e o arquivo.
- **Mutações:** a seção diz que não há o que mutar. Está correto: não entra cláusula nova de produto nem asserção nova, então a falta de bloco não é bloqueante.
- **Prazo sem pôr a máquina sob carga:** o documento prova o prazo pelo relógio reduzido, e não por uma máquina sobrecarregada.

Bloqueantes: nenhum.

Recomendações:
- **Folga só esconde, não corrige:** `test.slow()` dá 90 s ao caso. Se o caso ficar devagar de verdade, essa folga deixa de avisar. Vale o `/retro` registrar o tempo de referência do caso (cerca de 21 s no `celular` local, 25,5 s na esteira) para notar se ele crescer.
- **Achado à parte do `:307`:** o documento registra uma queda em `agentes.spec.ts:307` ("Não foi possível carregar esta parte do Turmma"). Não é coisa de relógio: é falha ao carregar o trecho da rota. Se voltar na esteira, merece uma correção própria, que olhe a carga do trecho no `celular` com 6 trabalhadores, e não mais um `test.slow()`.

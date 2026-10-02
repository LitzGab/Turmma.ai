# Achados das revisões — `tasks/prd-apresentacao-escola/14_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-02 03:21:15 · `tasks/prd-apresentacao-escola/14_task.md`

```
VEREDITO: REPROVADO
```

Um bloqueante só: a consulta do link anterior que responde depois de outro link chegar à aba não tem teste, e a mutação da guarda sobrevive nos dois projetos. O resto da tabela "Testes que provam a regra" está coberto.

**Cenários exigidos:** os 19 da tabela do `14_task.md`: W14, W4 (Professores), W12, link fora do cache (com e sem `reset()`), clique duplo (cadastrar, refazer, revogar e aceite), A0b sem mudar asserção, recomeço da tela (segunda pessoa, mesmo link, resposta atrasada, falha com o diálogo aberto), sessão vencida com o link na tela, erro com a lista na tela, e-mail já cadastrado, aceite pelos dois tipos, consulta que cai, fragmento quebrado, aceite usado no meio, aceite descartado e caminho até Professores. Mais os meus: permissão e isolamento.

**Cobertos:** todos os da tabela, com asserção sobre resultado (texto, foco, contagem de pedidos, contagem de convites em aberto no banco, token fora de URL, armazenamento e cache).
- **Permissão:** professor e aluno em `/coordenacao/professores` caem em "não encontrada" (`e2e/areas.spec.ts`).
- **Isolamento:** "segunda pessoa" em `e2e/professores.spec.ts:771`.
- **Concorrência:** os cliques duplos são dois `click()` no mesmo instante com o pedido segurado. A concorrência de servidor já tem teste em paralelo na API: `apps/api/test/professores.int.test.ts:637`, `:661`, `:691` e `apps/api/test/convite.int.test.ts:305`.
- **Higiene:** sem `.skip`, `.only` ou teste comentado; nenhum mock esconde a regra (o `CONFLITO` e o `NAO_ENCONTRADO` vêm da API real); a tarefa não escreve log.

O que rodei:
- **Linha de base:** 77 testes de unidade verdes; `e2e/professores.spec.ts`, `e2e/convite.spec.ts` e `e2e/operacao-convite-coordenacao.spec.ts` com 52 verdes em `chromebook` e `celular`. O spec da A0b não está no `git status`.
- **Mutações da tabela, por amostra:** `apps/web/src/api/professores.ts:48`, `apps/web/src/api/convite.ts:60` e `apps/web/src/areas/coordenacao/Professores.tsx:74` ficaram vermelhas no teste declarado.
- **Árvore:** arquivos restaurados (sha256 conferido, `git status` com as mesmas 41 linhas), web do compose reconstruída e verde de novo.

**Bloqueantes:**

1. `apps/web/src/paginas/Convite.tsx:113` e `:114` (a guarda `atual &&`, com a limpeza em `:116-118`): a consulta do link anterior que responde depois do `hashchange` não tem teste.
   - **O que está errado:** a guarda já existia, mas antes da 14.0 o token nunca mudava depois da montagem. Com o efeito em `[token, vez, tentativa]`, ela passou a ser o que impede a resposta atrasada da consulta do link A de trocar a tela do link B.
   - **Consequência sem a guarda:** a tela mostra a escola de A, com o token de A na etapa `confirmar`, e a pessoa aceita o convite A achando que é o B. Se a consulta de A falha, derruba a tela de B para "não vale" ou erro.
   - **Prova:** troquei `atual &&` por `(atual || true) &&` nas duas linhas, reconstruí a web e rodei `e2e/convite.spec.ts`: 20 de 20 verdes nos dois projetos. O controle no mesmo build (`Professores.tsx:74`) ficou vermelho, então o build mutado valeu. A cláusula não tem linha em "Mutações".
   - **Correção exigida:** um e2e em `e2e/convite.spec.ts`, ao lado do "recomeço, resposta atrasada" (`:328`), nos dois projetos:
     - segurar a consulta do link A, colar o link B (só o `#` muda), deixar a de B responder e só então soltar a de A;
     - afirmar que a tela continua com a escola de B e sem a de A, sem alerta, e que o `POST /v1/convites/aceitar` seguinte leva o token de B (pelo `postDataJSON`);
     - repetir com a consulta de A voltando recusada (`NAO_ENCONTRADO` ou 503): a tela de B não vira "não vale" nem erro;
     - acrescentar a linha em "Mutações" e a frase no W14 do `cenarios.md` ("Quebra sem: … a guarda da consulta").

**Recomendações:**

- `apps/web/src/areas/coordenacao/Professores.tsx:127` (`AvisoDeListaIncompleta`) não tem teste nem linha em "Mutações" nesta tela; a Estrutura tem (`e2e/estrutura.spec.ts:398`). Um caso com `completa: false` pela rota interceptada resolve.
- `Professores.tsx:167` e `:171`: os avisos do refazer ("vale 7 dias", "aparece uma vez") e o "Mande ao professor …" na etapa do link do refazer não são afirmados; só os do cadastro.
- **Recadastro do revogado pela tela:** o texto da linha promete "cadastre o mesmo e-mail" e o `14_task.md` herda isso da 13.0, mas só a API prova (`professores.int.test.ts:551`). Um e2e curto: revogar, cadastrar o mesmo e-mail, e a lista termina com uma linha só daquela pessoa, em aberto.
- **Refazer do `vencido` pela tela:** o W4 só afirma que o botão existe; o refazer exercitado é sempre o de `pendente`.
- **Link já usado reaberto:** é o caso que justifica o "Já aceitou o convite? Entrar". Entrar com ele na lista das cinco telas iguais de `e2e/convite.spec.ts:108` custa uma linha.
- **Dois professores com o mesmo nome:** a lista não traz e-mail (E11), então as duas linhas e os dois "Refazer o convite de …" ficam idênticos. Levar ao `frontend-reviewer` e ao `/validar` se precisa de desempate; hoje nenhum teste cobre.
- **Alvos de 44 px no W12:** medidos em "Copiar link", "Fechar", "Revogar convite" e "Cancelar"; faltam "Revisar", "Cadastrar e gerar o link", "Refazer convite", "Voltar ao convite" e "Fechar sem copiar".

## test-engineer · 2ª rodada · APROVADO · 2026-10-02 03:50:20 · `tasks/prd-apresentacao-escola/14_task.md`

```
VEREDITO: APROVADO
```

A correção exigida foi feita e prova a regra: o teste novo fica vermelho, nos dois projetos, quando a guarda da consulta sai, em cada uma das três voltas. Nenhum bloqueante.

**Cenários exigidos:** os da tabela do `14_task.md` (os 19 da 1ª rodada mais as duas linhas novas: "consulta atrasada" e "recadastro do revogado; refazer do vencido; lista incompleta"), mais permissão e isolamento. Nesta rodada auditei só o diff e o que ele afeta.

**Cobertos:**
- **Consulta atrasada** (`e2e/convite.spec.ts:393`): segura só a consulta do link A, cola o link B pelo `#`, espera a escola de B e solta a de A. Afirma a escola de B, a ausência da de A, nenhum alerta, e o `POST /v1/convites/aceitar` com `{ token: novo.token }` pelo `postDataJSON`. As três voltas são "vale", recusa real da API (convite revogado) e 503.
- **Linha em "Mutações" e frase no W14:** `14_task.md:231-232` e `cenarios.md:483-485`, com "a guarda da consulta" no "Quebra sem".
- **Recomendações da 1ª rodada aplicadas:**
  - convite já usado nas seis telas iguais (`convite.spec.ts:118`);
  - refazer do vencido pela tela (`professores.spec.ts:301-307`);
  - lista incompleta com dez páginas e o aviso (`:326-332`);
  - avisos do refazer e "Mande ao professor …" (`:417-425`);
  - alvos de 44 px nos botões que faltavam (`:500`, `:504`, `:547`, `:557`);
  - recadastro do revogado, com uma linha só, quatro itens e três convites em aberto no banco (`:774-788`).
- **Higiene:** sem `.skip`, `.only` ou teste comentado; o único mock novo é o 503 da consulta e a lista paginada interceptada, que simulam o que está fora da tela.

O que rodei:
- **Código da aplicação igual ao da 1ª rodada:** pelo instantâneo do hook em `.processo/conteudo.json`, só `e2e/convite.spec.ts`, `e2e/professores.spec.ts` e `e2e/__fixtures__/sessao.ts` mudaram. `Convite.tsx` e `Professores.tsx` têm data de modificação posterior, mas o conteúdo é o mesmo (mutação restaurada).
- **Linha de base:** `e2e/convite.spec.ts` e `e2e/professores.spec.ts`, 36 verdes em `chromebook` e `celular`.
- **Mutações, cada uma com a web reconstruída:**

| Mutação | Resultado nos dois projetos |
|---|---|
| `Convite.tsx:113`, `atual &&` → `(atual || true) &&` | vermelho na volta `vale`, em `convite.spec.ts:430` (a tela mostrava a escola de A) |
| `Convite.tsx:114`, a mesma troca | vermelho na volta `nao_vale` (a tela de B virou "Este convite não vale mais") |
| `Convite.tsx:114`, guarda mantida só para `NAO_ENCONTRADO` | vermelho na volta `cai` (a tela de B virou "O sistema está indisponível") |
| `Professores.tsx:127`, `completa={true}` | vermelho em `professores.spec.ts:330` |

- **Árvore:** os dois arquivos restaurados (sha256 conferido, iguais ao carimbo do portão), `git status` com as mesmas 43 linhas, web reconstruída e os 36 testes verdes de novo.

**Bloqueantes:** nenhum.

**Recomendações:**
- `tasks/prd-apresentacao-escola/14_task.md:249-252`: a tabela "Recomendações sem aplicar" está vazia. A dos dois professores com o mesmo nome não foi aplicada e precisa de linha ali, com o destino (`frontend-reviewer` e `/validar`), para não se perder no `/retro`.
- `14_task.md:68` e `:244`, e `cenarios.md:479`: os textos ainda dizem "expirado, revogado e inexistente" (ou "refeito e inexistente"). O teste agora cobre também o convite já usado, e a linha `:244` cita o nome antigo do teste.
- `e2e/convite.spec.ts:427`: a espera de dois `requestAnimationFrame` depois da resposta de A foi suficiente nas quatro mutações. Se um dia ficar curta, o teste ainda pega pelo token do aceite ou pelo botão que some. Um comentário dizendo isso evita que alguém troque a espera por algo mais frágil.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-02 03:59:49 · `tasks/prd-apresentacao-escola/14_task.md`

```
VEREDITO: AJUSTES NECESSÁRIOS
Estados: faltando o erro quando a releitura cai com a lista ainda vazia (bloqueante 1); os outros estados estão presentes e provados
Acessibilidade: axe limpo e teclado provado em Professores; duas falhas — a recusa escondida atrás da pergunta de fechar (bloqueante 2) e o foco que cai no body no passo da senha do aceite (bloqueante 3)
Chromebook fraco: ok — os e2e rodam com CPU ×4 e Fast 3G, sem imagem nem upload; lista sem virtualização com teto de 1.000 e aviso; não refiz o build, os tamanhos (123,8 de 150 kB; coordenacao ~14,3 de 20 kB) são os da tarefa
Celular: ok — 360 px sem rolagem horizontal, também nos diálogos; alvos de 44 px; nada depende de hover; a cópia sem área de transferência tem caminho por toque
Ação oficial protegida: sim — não há nota aqui; cadastrar tem o resumo antes de enviar, refazer e revogar confirmam dizendo o efeito, e o clique duplo manda um pedido só
```

Rodei `e2e/professores.spec.ts` e `e2e/convite.spec.ts` contra o compose de teste: 36 de 36 verdes, nos projetos `chromebook` e `celular`. Os três bloqueantes foram reproduzidos numa sonda fora do repositório, com as fixtures do e2e; nenhum arquivo do projeto foi editado.

**Bloqueantes**

1. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/Professores.tsx:94-99`** — o vazio ignora `professores.isError`; o erro por cima só existe no ramo com dado (`:109`).
   - **Reprodução:** escola sem professor, cadastro do primeiro, e o `GET /v1/professores` da releitura respondendo 503. O link aparece; fechado o diálogo, a tela mostra "Nenhum professor ainda", sem alerta e sem "Tentar de novo".
   - **Efeito:** a tela nega o cadastro que acabou de acontecer, e a nova tentativa com o mesmo e-mail dá `CONFLITO`.
   - **Correção exigida:** com a releitura em erro e a lista em cache vazia, mostrar o `EstadoErro` com "Tentar de novo", e não afirmar o vazio sozinho.
   - **Teste exigido:** e2e no W4 com esse caminho (lista vazia, cadastro, releitura com 503, erro visível, "Tentar de novo" traz o professor novo), nos dois projetos, com a mutação que o derruba.

2. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/DialogoDoConvite.tsx:299` e `:464`** (com `useFechamento` em `:60-71` e o texto em `:94-96`) — a pergunta de fechar continua aberta depois que o pedido falha.
   - **Reprodução:** "Cadastrar e gerar o link" com o POST segurado, "Cancelar" (ou Esc) abre a pergunta, e o POST responde 503. O texto passa a "O link aparece uma vez só. Se fechar agora, ele não aparece de novo…", com zero alertas no diálogo.
   - **Efeito:** a tela afirma um link que não existe e esconde a recusa; "Fechar sem copiar" fecha sem a pessoa saber que o cadastro não aconteceu. Vale também para o refazer e para a operação, que usam o mesmo componente.
   - **Correção exigida:** a pergunta só vale enquanto há link em risco; se o pedido falha com ela aberta, o diálogo volta à etapa da revisão (ou da confirmação), com a falha visível e o foco nela.
   - **Teste exigido:** um que prove isso no cadastro e no refazer.

3. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Convite.tsx:147`** (com `SenhaNova` em `:217-250`) — ao passar para `definir-senha`, o botão "Aceitar o convite" sai da tela e o foco cai no `body`.
   - **Reprodução:** foco no botão, Enter, e `document.activeElement` é `BODY` nos dois projetos. O `role="status"` só esvazia, então nada anuncia que agora se pede uma senha.
   - **Efeito:** quem usa leitor de tela ou teclado não fica sabendo do passo novo. É o mesmo defeito que `Dialogo.tsx` evita citando a regra 50, item 11.
   - **Origem:** herdado do F1 (tarefa 19.0), mas é exatamente o passo da 14.3, "conta nova cria a senha", agora para o professor.
   - **Correção exigida:** ao entrar nessa etapa, o foco vai para o campo "Senha nova" (ou para o texto que o apresenta).
   - **Teste exigido:** `toBeFocused()` no e2e do W14, depois do aceite pelo teclado.

**Recomendações**

- **Homônimos (a pergunta do `test-engineer`): não precisa de desempate nesta tarefa; fica registrado.**
  - Confirmei na tela: duas "Maria Silva" com convite em aberto dão duas linhas iguais e dois botões "Refazer o convite de Maria Silva" iguais.
  - Não bloqueia porque cada ação vai pelo `usuarioId`, nenhuma regra é violada, e a lista (`usuarioId`, `nome`, `estado`) não traz dado que desempate.
  - O desempate de verdade é o e-mail na linha e no nome acessível, como a matrícula no "Retirar" da 13.0. Isso muda o contrato da 3.0 e o E11, e é decisão com o `privacy-guardian`.
  - Registrar no `TODO.md`, junto do item da prova de posse do e-mail (portão da primeira escola real): com homônimos, o link refeito de uma pode ir para a outra.
  - O que a tela pode fazer sozinha, e recomendo aplicar já: na etapa "Confira antes de cadastrar", avisar quando o nome já está na lista ("Já há um professor com este nome. A lista mostra só o nome: acrescente o sobrenome para distinguir os dois."), sem impedir o cadastro.
- **"Entrar" na tela do convite que não vale** (`Convite.tsx:180`): é a única ação da tela e mede 46 × 22 px. Passa pela exceção de link em frase da WCAG 2.5.8, mas merece os 44 px de `CLASSES_DO_LINK_SECUNDARIO`, como o "Ir para Professores".
- **Com que e-mail o professor entra:** a tela do convite não diz nada da pessoa, e a entrada diz "Entre com o seu e-mail". Na etapa do link do cadastro o pedido está à mão: vale dizer o e-mail junto do "Mande ao professor …".
- **Senha nova sem "mostrar":** são 12 caracteres digitados uma vez só, às cegas, no celular. O W11 dá o "mostrar" ao aluno; aqui o erro de digitação só se resolve com outro convite.
- **Texto:** "Mande ao professor Maria Silva" e "As turmas em que ele já foi alocado" (`Professores.tsx:38` e `:183-184`) erram o gênero com frequência; "Mande o link a …" e "As turmas já alocadas…" resolvem. No passo da senha o nome da escola aparece duas vezes seguidas.

## frontend-reviewer · 2ª rodada · AJUSTES NECESSÁRIOS · 2026-10-02 04:38:48 · `tasks/prd-apresentacao-escola/14_task.md`

```
VEREDITO: AJUSTES NECESSÁRIOS
Estados: ok — o erro da releitura com a lista ainda vazia agora aparece, com "Tentar de novo", e o W4 prova nos dois projetos
Acessibilidade: uma falha nova, trazida pela correção do bloqueante 2 — depois de uma recusa no cadastro, "Voltar e corrigir" deixa o foco no body (bloqueante 1); o resto do diff está certo
Chromebook fraco: ok — nada no diff pesa (sem imagem, sem lista nova, sem dependência); não refiz o build nem medi o bundle nesta rodada
Celular: ok — "Entrar" do convite que não vale com 44 px, medido no e2e; nada novo depende de hover; diálogo com o aviso do nome repetido sem rolagem horizontal
Ação oficial protegida: sim — o resumo antes de cadastrar continua, agora com o aviso do nome repetido, que não impede; refazer e revogar confirmam dizendo o efeito
```

Não rodei as suítes de novo nesta rodada: li o diff e rodei uma sonda fora do repositório contra o compose de teste, nos projetos `chromebook` e `celular`. Nenhum arquivo do projeto foi editado.

**As três correções exigidas na 1ª rodada foram feitas**

1. **Erro com a lista vazia** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/Professores.tsx:108-119`: com `isError` e a lista em cache vazia, sai o `EstadoErro` e não o vazio. O foco de reserva vai para o `h1` (`:85`, `:100`). O e2e está em `e2e/professores.spec.ts:263-283`, com a mutação registrada.
2. **Pergunta de fechar depois da falha** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/DialogoDoConvite.tsx:64`: a pergunta sai quando o pedido falha, e o foco fica no alerta. O teste `e2e/professores.spec.ts:827-891` cobre o cadastro e o refazer.
3. **Foco no passo da senha** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Convite.tsx:220-225`: o foco vai para "Senha nova". O `toBeFocused()` depois do Enter está em `e2e/convite.spec.ts:160-162`.

**Bloqueantes**

1. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/DialogoDoConvite.tsx:241`** (com `:231-234`, e o "Voltar e corrigir" em `:389`) — regressão desta rodada: depois de uma recusa no cadastro, "Voltar e corrigir" deixa o foco no `body`.
   - **O que está errado:** `useFocoDaEtapa` deixa de focar sempre que `gerar.isError` é verdadeiro. Mas `isError` continua verdadeiro depois de "Voltar e corrigir", porque o `gerar.reset()` só acontece no próximo "Revisar" (`:325`). A etapa passa a `preencher`, o botão sai da tela, o alerta também, e nada recebe o foco.
   - **Reprodução:** cadastrar com o e-mail de quem já tem convite em aberto (`CONFLITO` real da API), alerta focado, "Voltar e corrigir" pelo teclado. `document.activeElement` é `BODY` nos dois projetos; com 503, o mesmo. No controle, sem falha, o foco vai para `INPUT[name=nome]`.
   - **Efeito:** é o caminho que o próprio alerta manda seguir ("Confira o e-mail"). Quem usa leitor de tela não fica sabendo que voltou ao formulário. É o mesmo defeito do bloqueante 3 da 1ª rodada, e vale também para o convite da coordenação na operação, que usa o mesmo componente.
   - **Correção exigida:** o foco só fica com o alerta quando a etapa de destino o mostra (a revisão ou a confirmação). Ao voltar para `preencher`, com falha anterior ou sem, o foco vai para o campo do nome. Soltar a falha junto do "Voltar e corrigir" ou restringir a condição à etapa que desenha a `Falha` resolvem.
   - **Teste exigido:** em `e2e/professores.spec.ts:796-797`, `toBeFocused()` em "Nome do professor" depois de "Voltar e corrigir" com o alerta do e-mail já cadastrado na tela, nos dois projetos. Hoje a linha só confere o valor do campo, e nenhum e2e afirma foco depois desse botão. Acrescentar a linha em "Mutações" do `14_task.md`.

**Recomendações**

- **O aviso do nome repetido aparece no recadastro da mesma pessoa.** `temHomonimo` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/Professores.tsx:166`) conta também as linhas de revogado e de desativado. A própria linha manda "cadastre o mesmo e-mail"; quem faz isso com o mesmo nome lê "acrescente um sobrenome para distinguir os dois", e não haverá dois, porque o recadastro reaproveita a linha. Confirmei na sonda. Ou o aviso conta só os estados que continuam na lista como outra pessoa, ou o texto cobre o caso ("Se é a mesma pessoa voltando, pode seguir"). O e2e do recadastro (`e2e/professores.spec.ts:812`) usa outro nome e não passa por isso.
- **Fechar o diálogo antes de a releitura voltar.** Com a lista ainda vazia, o "Cadastrar professor" do vazio ainda está na tela e recebe o foco de volta; quando a lista chega, ele some e o foco tende a cair no `body`. Não reproduzi: é leitura do código (`Dialogo.tsx:84-85`), e já existia antes desta rodada. Vale um caso no `/validar` com a rede lenta.
- **Foco no `h1` que é `sr-only`** (`Professores.tsx:100`): quem enxerga e usa teclado não vê onde o foco ficou. O próximo Tab cai em "Tentar de novo", então não bloqueia.
- **`temHomonimo` não normaliza espaço duplo no meio do nome** ("Maria  Silva" e "Maria Silva" passam como diferentes), e só enxerga as páginas que a tela leu quando a lista é incompleta. É um aviso, não uma garantia; fica registrado.
- **O "mostrar" da senha nova** segue sem aplicar, com destino registrado em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/17_task.md` ("Herdado da 14.0"). Os homônimos estão no `TODO.md:439`.

A sonda está em `/tmp/claude-1000/-home-joaquimdp-Documentos-git-Educa-ia/fa2a73f2-5fbc-4a24-bbc9-de2f33ddba00/scratchpad/sonda/sonda.spec.ts`.

## frontend-reviewer · 3ª rodada · APROVADO · 2026-10-02 04:58:04 · `tasks/prd-apresentacao-escola/14_task.md`

```
VEREDITO: APROVADO
Estados: ok
Acessibilidade: ok — a correção exigida na 2ª rodada foi feita e está provada por teste
Chromebook fraco: ok — nada novo no caminho; projeto `chromebook` verde
Celular: ok — projeto `celular` verde; o aviso novo é texto corrido em item de lista, sem largura fixa
Ação oficial protegida: sim — o resumo antes de cadastrar e a confirmação do refazer não mudaram
Bloqueantes: nenhum
Recomendações:
- O "Voltar e corrigir" depois de recusa só tem e2e pela tela Professores; a operação usa a mesma peça. Um `toBeFocused()` em `e2e/operacao-convite-coordenacao.spec.ts` fecharia o par (para o `/validar`).
- As três da 2ª rodada sem aplicar seguem com destino em "Recomendações sem aplicar" do `14_task.md`; nada a acrescentar.
```

**Correção exigida na 2ª rodada: feita.**

- **Código.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/DialogoDoConvite.tsx:332-335`, `voltarECorrigir()` chama `gerar.reset()` e depois `definirRevisando(undefined)`; o botão em `:397` usa essa função. Com a falha solta, `useFocoDaEtapa` (`:241`) leva o foco ao campo do nome.
- **Um render só.** Conferi que as duas mudanças chegam juntas: o resultado da mutação já está zerado quando o React renderiza a troca de etapa, e o efeito que atualiza `falhou` roda antes do efeito da etapa.
- **O `reset()` que saiu do `revisar` não faz falta.** Só se chega a `preencher` pela abertura ou pelo "Voltar e corrigir", que agora solta a falha. A recusa com a pergunta aberta continua voltando à revisão com o foco no alerta.
- **Teste.** `/home/joaquimdp/Documentos/git/Educa.ia/e2e/professores.spec.ts:798-801` confere, com o alerta do e-mail já cadastrado na tela, o foco em "Nome do professor", o valor digitado preservado e nenhum alerta; `:805` confere que o aviso não volta na revisão nova.
- **Execução.** Rodei `e2e/professores.spec.ts` e `e2e/operacao-convite-coordenacao.spec.ts` contra o compose de teste: 28 verdes, nos dois projetos, incluindo "falha com o diálogo aberto" e "falha com a pergunta de fechar aberta". Não rodei `e2e/convite.spec.ts`: o diff desta rodada não toca a tela do convite.
- **Mutação.** Não a refiz, porque não edito arquivo. Pela leitura ela se sustenta: sem o `reset()`, `falhou.current` fica verdadeiro, o efeito não foca e `:799` falha. Está registrada em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/14_task.md:251`, com o resumo em `:80` e a divergência em `:177-180`.

**O resto do diff.**

- **Nome repetido.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/convite-de-professor.ts:58-66`, `temHomonimo` normaliza pontas e espaço dobrado dos dois lados da comparação. O teste de unidade em `convite-de-professor.test.ts:67-79` cobre os dois sentidos; li, não rodei (o portão local desta rodada, que você informou verde, inclui `test`).
- **Texto do aviso.** O texto novo (`:74-75`) cobre o recadastro da mesma pessoa e o homônimo, em português comum, sem termo técnico, e continua sem impedir o cadastro (`Professores.tsx:166`). O e2e usa o mesmo texto em `professores.spec.ts:779`.
- **Documentos.** As linhas da tabela de mutações que conferi (`:55`, `:58`, `:64`, `:99`, `:241`, `:333`, `:338`, `:386`, `:490`, `:499`, `:500`) batem com o código de agora. A `techspec.md` seção 9 (`:351`) descreve o "Voltar e corrigir" que solta a falha.
- **Portão.** O carimbo em `.processo/portao.json` tem `typecheck`, `lint` e `test`; não reprovei pela falta de `--e2e`, que fica para o portão final antes do commit, como combinado.

## test-engineer · 3ª rodada · APROVADO · 2026-10-02 05:08:06 · `tasks/prd-apresentacao-escola/14_task.md`

```
VEREDITO: APROVADO
```

Nenhum bloqueante. As cláusulas novas desta rodada têm teste que fica vermelho sem elas, nos projetos `chromebook` e `celular`, e a árvore voltou a ser a do carimbo do portão.

**Cenários exigidos:** os da tabela do `14_task.md`, com as cinco linhas novas desta rodada, mais permissão e isolamento, que não mudaram. As cinco linhas novas:
- erro com a lista ainda vazia;
- falha com a pergunta de fechar aberta;
- foco no passo da senha;
- nome repetido;
- foco depois do "Voltar e corrigir".

Auditei só o diff desde a minha 2ª rodada. Pelo instantâneo do hook, mudaram sete arquivos: `Professores.tsx`, `convite-de-professor.ts` e o teste dele, `DialogoDoConvite.tsx`, `Convite.tsx`, `e2e/professores.spec.ts` e `e2e/convite.spec.ts`.

**Cobertos:**
- **Erro com a lista ainda vazia** (`e2e/professores.spec.ts:263-283`): afirma o alerta, a ausência de "Nenhum professor ainda", o foco no `h1`, e que "Tentar de novo" traz a linha em aberto.
- **Pergunta de fechar com o pedido recusado** (`:831-895`): no cadastro e no refazer, com o pedido segurado e o 503 chegando com a pergunta na tela. Afirma o alerta com o foco nele, a pergunta fora, o fechar sem perguntar, e que a nova tentativa do refazer mostra o link.
- **"Voltar e corrigir" depois da recusa** (`:798-805`): foco em "Nome do professor", valor preservado, alerta fora, e o aviso não volta na revisão nova. O `CONFLITO` vem da API real.
- **Nome repetido**: na unidade (`convite-de-professor.test.ts:67-79`) e no e2e, com presença em `:785` e ausência depois de corrigir o nome em `:791`.
- **E-mail na etapa do link**: no cadastro com o e-mail (`:425`), no refazer só com o nome (`:451`).
- **Foco em "Senha nova"** depois do aceite pelo teclado (`e2e/convite.spec.ts:160-162`) e **alvo de 44 px do "Entrar"** (`:137-140`).
- **Higiene:** sem `.skip`, `.only` ou teste comentado; os mocks novos são só o 503 da rota interceptada.

**O que rodei:**

| Mutação | Resultado nos dois projetos |
|---|---|
| `Professores.tsx:111`, o erro com a lista vazia desligado | vermelho em `professores.spec.ts:276` |
| `Professores.tsx:85`, foco de reserva só no título da lista | vermelho em `:278` |
| `Professores.tsx:166`, aviso do nome repetido sempre ligado (o inverso da que está na tabela) | vermelho em `:791` |
| `Professores.tsx:172`, sem o e-mail na frase | vermelho em `:425` |
| `DialogoDoConvite.tsx:64`, a pergunta não sai | vermelho em `:861` |
| `DialogoDoConvite.tsx:333`, sem o `gerar.reset()` | vermelho em `:799` |
| `DialogoDoConvite.tsx:487`, `comFalha` falso só no refazer (não está na tabela) | vermelho em `:884` |
| `Convite.tsx:224`, sem o foco no campo | vermelho em `convite.spec.ts:162` |
| `Convite.tsx:181`, sem a classe do link secundário | vermelho em `:139` (22 px) |
| `convite-de-professor.ts:55` e `:58`, cinco variações na unidade | todas vermelhas |

- **Árvore restaurada:** os quatro arquivos com o sha256 de antes, os 36 arquivos iguais ao carimbo do portão e ao instantâneo da 3ª rodada do `frontend-reviewer`, `git status` com as mesmas 44 linhas.
- **Linha de base no fim:** web reconstruída, e `e2e/professores.spec.ts`, `e2e/convite.spec.ts` e `e2e/operacao-convite-coordenacao.spec.ts` com 56 verdes.
- **Portão:** não reprovei pela falta de `--e2e` no carimbo, como combinado; ele fica para o portão final.

**Bloqueantes:** nenhum.

**Recomendações:**
- **`cenarios.md` sem os casos desta rodada.** `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md:417` (W4, Professores) e `:476-486` (W14) não dizem o erro da releitura com a lista vazia, a pergunta que sai na recusa, o foco no campo da senha nem o aviso do nome repetido. O "Quebra sem" também não. Estão só na tabela do `14_task.md`, e o `/validar` lê o `cenarios.md`.
- **Duas linhas a acrescentar em "Mutações" do `14_task.md`:** `DialogoDoConvite.tsx:487` (o `comFalha` do refazer, vermelho em `professores.spec.ts:884`) e o inverso de `Professores.tsx:166` (aviso sempre ligado, vermelho em `:791`).
- **O outro ramo de `DialogoDoConvite.tsx:64` não tem e2e.** O pedido que dá certo com a pergunta aberta deve manter a pergunta, com o texto do link que já existe, e "Voltar ao convite" deve mostrar o link. Uma implementação que tirasse a pergunta também no sucesso passaria. Não viola regra; vale um caso curto ao lado do `:831`, ou no `/validar`.
- **E-mail do professor depois de fechar o cadastro.** A etapa do link do cadastro agora mostra o e-mail digitado, e o teste da sessão vencida (`:897`) usa o refazer, que não o mostra. Um `expect(await page.content()).not.toContain(...)` com o e-mail ao lado de `:466` cobre o E11 para o texto novo.
- **Comentário em `professores.spec.ts:272-278`.** O teste é determinístico porque o `onSettled` da mutação espera a releitura (`api/professores.ts:49`), então o link só aparece com a releitura já em erro. Se `recarregar` deixar de devolver a promessa, o `toBeFocused()` do `h1` passa a depender de tempo.
- **Texto do revogar sem asserção.** "As turmas já alocadas a essa pessoa continuam esperando" (`Professores.tsx:204-205`) não é afirmado; o W12 (`:605`) só confere "deixa de valer na hora". É só texto.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-02 05:12:17 · `tasks/prd-apresentacao-escola/14_task.md`

```
VEREDITO: APROVADO
Campos pessoais tocados: nome e e-mail do professor (digitados pela coordenação, só no estado do diálogo e no corpo do POST); token do convite (credencial de uso único, no diálogo e no fragmento do link); senha nova do aceite (estado do campo e corpo do POST); bilhete e desafio do aceite (memória da aba); nome da escola na consulta do convite. Nenhum dado de aluno.
Fora da tabela de dados do docs/lgpd.md: nada. A tarefa não cria campo: API, packages/nucleo e docs/lgpd.md não mudaram. Nome e e-mail do professor estão nas linhas 59 e 64, o convite de professor na linha 75.
Autorização por objeto: ok. É tarefa de web; a escola vem da sessão, o refazer e o revogar vão pelo usuarioId que a lista trouxe, e quem decide é a API da 3.0, que não foi tocada. "Não encontrado" e "sem permissão" iguais: expirado, revogado, refeito, usado e inexistente, dos dois tipos, dão a mesma tela, sem o nome da escola (e2e/convite.spec.ts, "as seis telas são a mesma").
Logs: limpos. Nenhum console.* em apps/web/src fora de teste, nenhuma biblioteca de telemetria ou envio a terceiro, e o e2e vigia o console pelo token (e2e/professores.spec.ts:190).
Auditoria: presente, no servidor (professor.cadastrado e convite.*, da 3.0). A tela não lê dado de aluno nem cria ação nova que exija registro.
Envio externo: nenhum. O link sai pela mão da coordenação (área de transferência); não há envio de e-mail nem provedor de IA.
Seed/fixture: sintético. E-mails em @educa.invalid, @escola.invalid e @escola.test, nomes inventados com marca aleatória, tokens sorteados ou fixos de teste; nenhum seed novo.
Bloqueantes: nenhum
Recomendações:
  1. Nome repetido: não cabe nesta tarefa, fica registrado (detalhe abaixo).
  2. docs/lgpd.md:75 — espelhar a linha 77: o link do convite de professor aparece uma vez, só no diálogo que o pediu, fora de cache, URL, log e armazenamento, e sai quando a sessão da aba muda.
  3. e2e/professores.spec.ts:190-210 — o vigiarAba confere localStorage, sessionStorage, histórico, URLs e console; faltam IndexedDB e Cache Storage, que o "sem rastro" da 13.0 confere. Destino: /validar.
  4. e2e "a sessão vence com o link na tela" — só prova a etapa do link no refazer. Um caso com o cadastro aberto (nome e e-mail digitados) fecharia o par; o mecanismo é o mesmo desmonte. Destino: /validar.
```

Auditei por leitura do diff e dos arquivos novos; não rodei teste nenhum, como pedido. As suítes `--e2e`/`--infra` ficam para o portão final e não pesaram no veredito.

## O que conferi

- **Link fora do cache.** `gcTime: 0` nas duas mutações (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/professores.ts:48` e `:57`), com teste de unidade para o fechar com `reset()`, o desmonte sem `reset()` e a resposta que chega depois de fechar. O teste cobre também o nome e o e-mail do pedido.
- **Sessão vencida.** O diálogo sai quando a sessão da aba muda (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/Professores.tsx:87`), com e2e. A lista some pelo `resetQueries` do `main.tsx`.
- **Token do aceite.** Vai só no fragmento e no corpo do POST. O `hashchange` tira o fragmento da barra antes da consulta, e o fragmento quebrado não derruba a tela.
- **Aceite descartado.** O aceite do link anterior não guarda bilhete nem desafio (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/convite.ts:58-62`), com teste.
- **Senha nova.** `type="password"` e `autocomplete="new-password"`; sai da memória no recomeço da tela.
- **E11 pela tela.** A lista não mostra e-mail (e2e confere o HTML), e "Convite aceito." é igual para conta nova e conta que já existia. O `CONFLITO` do cadastro só fala de professor desta escola.
- **Contrato estrito.** Um campo de pessoa a mais na resposta do cadastro é recusado antes de chegar ao diálogo.
- **Erros.** Só texto do catálogo; nenhum código nem stack na tela.

## A questão do nome repetido

**Não cabe nesta tarefa; fica registrada.** O desempate pelo e-mail muda o contrato da lista (3.0) e o E11, e a API não é desta tarefa. O que a tela pode fazer sozinha já foi feito: o aviso no resumo do cadastro.

Não bloqueia porque é o mesmo risco que a Tech Spec já aceita na seção 13 ("a senha de uma conta global é definida por quem tem o link"). Ele é tolerado pela D71 enquanto o dado for sintético e fecha no portão da primeira escola real.

Duas coisas para o `TODO.md` levar, hoje ele diz só que "o link refeito de uma pode ir para a outra":

- **A consequência.** Quem recebe o link errado define a senha da conta da outra pessoa. A linha vira `aceito`, que não tem refazer nem revogar, e recadastrar o e-mail dá `CONFLITO`. A pessoa certa fica sem caminho até o reset de senha (F2). Isso é leitura minha da matriz de estados, não reproduzi.
- **Minha posição para a decisão.** E-mail na linha é aceitável: está na tabela de dados, a coordenação é quem o digitou, e não distingue conta nova de conta existente. Três condições:
  - só nas linhas com convite em aberto (`pendente`, `vencido`), que são as que têm Refazer e Revogar;
  - decidir se a origem é o e-mail global da conta (que um dia pode mudar por outra escola) ou o que a escola digitou (campo novo, com linha própria no `docs/lgpd.md`);
  - o E11 passa a provar que o e-mail aparece igual nos dois casos.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-02 05:15:07 · `tasks/prd-apresentacao-escola/14_task.md`

```
VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: "portão local: o último não rodou e2e. Rode `node tools/processo/portao-local.ts --e2e`."
Bloqueantes: nenhum
Recomendações: seis, listadas abaixo
```

**Portão local.** Não contei a falta do `--e2e` como bloqueante nesta rodada intermediária, como nas tarefas 10.0 a 13.0. O carimbo de typecheck, lint e test vale para a árvore atual: começou às 07:45:14Z, e a última alteração de código é `DialogoDoConvite.tsx`, às 07:44:24Z. Conferi a idade pela hora dos arquivos, porque o `conferir` para na suíte que falta. O hook continua barrando o commit sem o `--e2e`.

**Escopo.** As cinco subtarefas estão feitas. `apps/api` não foi tocado, e `convites/consultar` e `/aceitar` não mudaram (seção 4). A mudança em `Alocacao.tsx` e no roteiro da Estrutura é o "Herdado da 13.0" do próprio documento. O "mostrar" da senha foi para a 17.0, e o `FORMATO_DO_REFRESH` ficou no `TODO.md`. O diálogo compartilhado preserva o comportamento da operação, fora a pergunta de fechar, que está declarada.

**Aderência.** As divergências de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/14_task.md` estão na `techspec.md`, seção 9 ("Decidido na 14.0"). As exceções estão nas recomendações 1 e 2.

**Recomendações**

1. **Borda da senha ignorada só no `14_task.md` (linhas 145-146).** Se outro convite da mesma conta define a senha entre a consulta e o aceite, a tela diz "Senha criada" para uma senha que a API ignorou. Leve para a `techspec.md`, seção 13, junto do risco da conta global. Não bloqueei porque a decisão em si (o aviso pela senha enviada) está na seção 9.

2. **`cenarios.md` sem três casos que têm teste na tabela da tarefa.** Faltam o `CONFLITO` do cadastro com "Voltar e corrigir", o convite usado entre a consulta e o aceite, e o clique duplo (Professores e aceite). Os dois primeiros estão na Tech Spec, e o clique duplo é da tabela original da tarefa. Para a lista continuar fechada, acrescente ao W4 e ao W14.

3. **Trava do envio único e alerta com foco duplicados.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/DialogoDoConvite.tsx:305,337-341` e `:479,489-493` refazem à mão a trava que `useEnvioUnico` já dá em `areas/coordenacao/dialogos.tsx:31`. O `Falha` de `:212` é o `AlertaDaFalha` de `dialogos.tsx:62`, com outra dependência. Mover `useEnvioUnico` e o alerta para `componentes/` deixa um jeito só.

4. **Textos e reexports repetidos.**
   - `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/convite-de-professor.ts:90,93` repete as duas frases de `operacao/textos.ts:88,94`. Como `pedido-de-convite.ts` já guarda os textos de campo, as duas cabem em `componentes/`.
   - `operacao/textos.ts:103,118` e `operacao/pedidos-do-painel.ts:35` reexportam o que saiu para `componentes/`. `pedidos-do-painel.ts:11` importa `TEXTO_DO_NOME_INVALIDO` por esse desvio; importar direto de `componentes/pedido-de-convite` é mais claro.

5. **Legibilidade e tipo redigitado.**
   - `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Convite.tsx:165` usa o operador vírgula dentro da seta do "Tentar de novo". Uma função nomeada (`tentarDeNovo`) lê melhor.
   - `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts` redigita os seis estados em `EstadoDoProfessorDeTeste`. O e2e já importa tipo de `packages/shared` (`professores.spec.ts:3`), então pode ser `import type { EstadoDoProfessor }`.

6. **Dois acertos no `14_task.md`.**
   - A tabela de mutações cita `apps/web/src/api/professores.ts:25` e `:32`, que hoje são comentários. O corpo do refazer está em `:29` e a rota do revogar em `:34`.
   - "Arquivos previstos" lista `operacao/paginas/Escolas.tsx` como alterado. Ele não mudou, e a nota de divergência de arquivos não diz isso.

## test-engineer · 4ª rodada · APROVADO · 2026-10-02 05:39:41 · `tasks/prd-apresentacao-escola/14_task.md`

```
VEREDITO: APROVADO
```

Nenhum bloqueante. O lote não mudou comportamento, os acréscimos de teste ficam vermelhos quando a regra sai, nos projetos `chromebook` e `celular`, e a árvore voltou a ser a do carimbo do portão.

**Cenários exigidos:** os da tabela do `14_task.md`, mais permissão e isolamento, que não mudaram. Auditei só o diff desde a minha 3ª rodada. Pelo instantâneo do hook, mudaram oito arquivos:
- `apps/web/src/componentes/textos-do-convite.ts` (novo)
- `apps/web/src/operacao/textos.ts`
- `apps/web/src/operacao/pedidos-do-painel.ts`
- `apps/web/src/operacao/pedidos-do-painel.test.ts`
- `apps/web/src/areas/coordenacao/convite-de-professor.ts`
- `apps/web/src/paginas/Convite.tsx`
- `e2e/professores.spec.ts`
- `e2e/__fixtures__/sessao.ts`

**Cobertos:**
- **O outro ramo da pergunta de fechar** (`e2e/professores.spec.ts:674-688`): o cadastro segurado, "Cancelar", a pergunta com "O convite ainda está sendo gerado", a resposta 201, a pergunta que continua com o texto do link e sem o campo, e "Voltar ao convite" com o token da resposta.
- **E-mail fora da página depois de fechar o cadastro** (`:446`): o controle positivo é a `:434`, que afirma o mesmo e-mail dentro do diálogo.
- **Texto do revogar** (`:618`) e **comentário do determinismo** (`:279-281`): o comentário confere com `apps/web/src/api/professores.ts:49`, onde o `onSettled` devolve a promessa do `recarregar`.
- **`vigiarAba` com IndexedDB e Cache Storage** (`:202-207`): só o W14 de Professores o usa.
- **Código sem mudança de comportamento:**
  - `tentarDeNovo()` em `apps/web/src/paginas/Convite.tsx:155-158` tem as mesmas duas chamadas.
  - Os dois textos movidos são afirmados por extenso dos dois lados: `apps/web/src/operacao/textos.test.ts:69-75` e `apps/web/src/areas/coordenacao/convite-de-professor.test.ts:93-99`.
  - `EstadoDoProfessorDeTeste` é só o tipo do contrato; estado novo sem texto no e2e quebra o typecheck, que alcança `e2e/tsconfig.json`.
- **Documentos:** `cenarios.md:417` (W4 de Professores) e `:487-490` (W14) trazem os casos da rodada. As linhas da tabela "Mutações" que conferi batem com o código de agora.
- **Higiene:** sem `.skip`, `.only` ou teste comentado; nenhum mock novo.

**O que rodei:**

| Mutação | Resultado nos dois projetos |
|---|---|
| `componentes/DialogoDoConvite.tsx`, a pergunta sai também quando o pedido dá certo com ela aberta | vermelho em `professores.spec.ts:681` |
| `DialogoDoConvite.tsx:350`, `noAr` sempre verdadeiro na pergunta do convite novo | vermelho em `:681` |
| `paginas/Convite.tsx:157`, sem o `definirTentativa` | vermelho em "a consulta que cai…" |
| `Convite.tsx:156`, sem o `definirEtapa({ nome: 'consultando' })` | vermelho em `convite.spec.ts:261` |
| `componentes/textos-do-convite.ts:7` e `:10`, cada texto encurtado (unidade) | vermelho em `textos.test.ts` e em `convite-de-professor.test.ts`, as duas vezes |

- **Linha de base da unidade:** 39 verdes nos seis arquivos afetados.
- **Árvore restaurada:** os três arquivos mutados com o sha256 de antes, os 38 arquivos iguais ao instantâneo do portão, `git status` com as mesmas 47 linhas.
- **Linha de base no fim:** web reconstruída, e `e2e/professores.spec.ts`, `e2e/convite.spec.ts` e `e2e/operacao-convite-coordenacao.spec.ts` com 56 verdes. Não rodei `e2e/estrutura.spec.ts`: o lote só o alcança pelo tipo da fixture.
- **Portão:** não reprovei pela falta de `--e2e` no carimbo, como combinado.

**Bloqueantes:** nenhum.

**Recomendações:**
- **Duas linhas a acrescentar em "Mutações" do `14_task.md`:** o inverso de `DialogoDoConvite.tsx:64` (a pergunta que fica quando o pedido dá certo) e `DialogoDoConvite.tsx:350` (o texto da pergunta com o pedido no ar), as duas vermelhas em `professores.spec.ts:681`.
- **`14_task.md:304`:** a linha do "outro ramo da pergunta de fechar" está em "Recomendações sem aplicar" e diz "Aplicada". Tire-a dali ou mude o título da seção.
- **O ramo de sucesso da pergunta só é exercitado no cadastro.** O refazer usa o mesmo `useFechamento`, mas a `Pergunta` dele é outra chamada (`DialogoDoConvite.tsx:509`), com o próprio `noAr`. Um caso curto no refazer fecha o par; pode ficar para o `/validar`.
- **`e2e/operacao-convite-coordenacao.spec.ts:124`:** o `vigiarAba` da operação não confere IndexedDB nem Cache Storage, e o de Professores agora confere. A tarefa pede esse spec sem mudar asserção, então é para o `/validar` ou correção própria.
- **`apps/web/src/operacao/textos.ts:87-88` e `:98-99`:** sobraram duas linhas em branco seguidas onde os textos saíram, e a linha `:101` do docblock ficou bem mais longa que as vizinhas. É só forma.

## frontend-reviewer · 4ª rodada · APROVADO · 2026-10-02 05:44:48 · `tasks/prd-apresentacao-escola/14_task.md`

```
VEREDITO: APROVADO
Estados: ok
Acessibilidade: ok — nada do lote muda foco, rótulo ou anúncio; axe limpo e teclado continuam provados
Chromebook fraco: ok — primeiro carregamento em 123,8 kB de 150 e coordenacao-* em 14,45 kB de 20 (brotli, build desta árvore); a escola não baixa o chunk da operação
Celular: ok — projeto `celular` verde; 360 px sem rolagem horizontal e alvos de 44 px continuam afirmados no W12
Ação oficial protegida: sim — não há nota aqui; o resumo antes de cadastrar e as confirmações de refazer e revogar não mudaram
Bloqueantes: nenhum
Recomendações:
- `14_task.md:125` ainda diz que `operacao/textos.ts` reexporta os dois textos de campo; a linha `:186-189` do mesmo documento diz que o reexport saiu. Acertar a primeira.
- `apps/web/src/operacao/textos.ts` mudou (só comentário) depois do carimbo do portão e da 4ª rodada do `test-engineer`. A rodada dele continua valendo, mas o carimbo não tem a exceção de comentário: o portão final precisa rodar de novo.
- `14_task.md` ("Teto do `coordenacao-*`") diz 123,7 kB de 150; medi 123,83 pelo meu cálculo de brotli, não pelo `size-limit`. Conferir o número no portão final.
- As da 3ª rodada sem aplicar seguem com destino em "Recomendações sem aplicar"; nada a acrescentar.
```

Rodei `e2e/professores.spec.ts`, `e2e/convite.spec.ts` e `e2e/operacao-convite-coordenacao.spec.ts` contra o compose de teste: 56 de 56 verdes, nos projetos `chromebook` e `celular`. Não rodei `e2e/estrutura.spec.ts`. Nenhum arquivo do projeto foi editado; o build foi para a pasta temporária.

**O que mudou de verdade desde a 3ª rodada.** Comparei a árvore com o instantâneo da minha 3ª rodada em `.processo/conteudo.json`:
- **Código da web:** mudaram só `operacao/textos.ts`, `operacao/pedidos-do-painel.ts`, `paginas/Convite.tsx` e `areas/coordenacao/convite-de-professor.ts`, mais o novo `componentes/textos-do-convite.ts`.
- **Testes:** `e2e/professores.spec.ts` e `e2e/__fixtures__/sessao.ts`.
- **Sem mudança:** `componentes/DialogoDoConvite.tsx` e `areas/coordenacao/Professores.tsx` estão byte a byte iguais.

**Conferido no diff:**
- **Textos do convite que mudou:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/textos-do-convite.ts:7` e `:10` têm o mesmo texto que saiu de `operacao/textos.ts`. A operação e a escola importam dali, e os e2e dos dois lados afirmam os textos por extenso.
- **Reexports removidos:** nenhum importador ficou apontando para `operacao/textos` ou `operacao/pedidos-do-painel` atrás do que saiu.
- **"Tentar de novo" da consulta:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Convite.tsx:155-158` e `:171` fazem as mesmas duas chamadas de antes. O e2e "a consulta que cai…" passou nos dois projetos.
- **Chunks:** o pedaço dividido entre coordenação e operação mudou só de nome, para `parte-textos-do-convite-*`, com 4,30 kB. Ele não importa nem menciona `operacao-*`.
- **Web do compose:** o `index-BcVXGu6v.js` servido é o mesmo do build desta árvore, então os e2e rodaram contra este código.
- **Testes novos:** o pedido que dá certo com a pergunta de fechar aberta (`e2e/professores.spec.ts:674-688`), o e-mail fora da página depois de fechar o cadastro (`:446`), o texto do revogar (`:618`) e o `vigiarAba` com IndexedDB e Cache Storage (`:202-207`) estão lá e passam.
- **Documentos:** `cenarios.md:417` (W4) e `:487-489` batem com o que a tela faz; a linha do convite de professor em `docs/lgpd.md:75` também.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-02 05:46:56 · `tasks/prd-apresentacao-escola/14_task.md`

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum novo nesta rodada. O lote não muda o tratamento de nome e e-mail do professor (estado do diálogo e corpo do POST), do token do convite (diálogo e fragmento do link) nem da senha nova do aceite. Nenhum dado de aluno.
Fora da tabela de dados do docs/lgpd.md: nada. A linha do convite de professor (docs/lgpd.md:75) ganhou o texto pedido na 1ª rodada, e ele confere com o código.
Autorização por objeto: ok. apps/api e packages/nucleo seguem sem diff; refazer e revogar continuam indo pelo usuarioId da lista, com a escola vinda da sessão. Os dois textos movidos para componentes/textos-do-convite.ts são fixos, sem código de erro e sem dado de pessoa.
Logs: limpos. Nenhum console.* em apps/web/src fora de teste, nenhuma biblioteca de telemetria; o único localStorage é a preferência da lateral recolhida, que não é desta tarefa.
Auditoria: presente, no servidor (da 3.0, sem mudança). O lote não cria ação que exija registro.
Envio externo: nenhum.
Seed/fixture: sintético. Os e-mails dos e2e e dos testes tocados são todos de domínio reservado (@educa.invalid, @escola.invalid, @escola.test), com nomes inventados e marca aleatória.
Bloqueantes: nenhum
Recomendações: nenhuma nova. As duas da 1ª rodada sem aplicar seguem com destino em "Recomendações sem aplicar" do 14_task.md (linhas 306 e 307).
```

Auditei por leitura, sem rodar teste nem editar arquivo. A falta de `--e2e` no carimbo não pesou no veredito, como combinado.

**O que mudou desde a minha 1ª rodada.** Comparei a árvore com o instantâneo do hook em `.processo/conteudo.json`. De código, mudaram seis arquivos que já existiam, um teste e um arquivo novo, e bate com o que você descreveu:
- `apps/web/src/operacao/pedidos-do-painel.ts` e `pedidos-do-painel.test.ts`
- `apps/web/src/operacao/textos.ts`
- `apps/web/src/paginas/Convite.tsx`
- `apps/web/src/areas/coordenacao/convite-de-professor.ts`
- `e2e/professores.spec.ts` e `e2e/__fixtures__/sessao.ts`
- `apps/web/src/componentes/textos-do-convite.ts` (novo)

`Professores.tsx`, `DialogoDoConvite.tsx`, `api/professores.ts` e `api/convite.ts` estão byte a byte iguais aos da rodada aprovada.

**As quatro recomendações da 1ª rodada:**
1. **Nome repetido:** o item do `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md` leva a consequência, marcada como leitura não reproduzida, e a minha posição com as três condições. O destino é a prova de posse do e-mail, no portão da primeira escola real.
2. **`docs/lgpd.md:75`:** aplicada, e o texto corresponde ao código. `gcTime: 0` está nas duas mutações de `api/professores.ts`, e o diálogo sai pelo `aoTrocarDeSessao` em `Professores.tsx:87`.
3. **`vigiarAba`:** aplicada em `e2e/professores.spec.ts:197-207`, que exige IndexedDB e Cache Storage vazios.
4. **Sessão que vence com o cadastro aberto:** não aplicada, com destino no `/validar` (`14_task.md:307`). Aceito: o mecanismo é o mesmo desmonte.

**O resto do diff:**
- **`Convite.tsx:155-158`:** `tentarDeNovo()` faz as mesmas duas chamadas de antes. O token continua só no estado da tela e o fragmento sai da barra antes da consulta.
- **`e2e/professores.spec.ts:446`:** o e-mail que a etapa do link do cadastro mostra não fica na página depois de fechar. O controle positivo está em `:434`.
- **`e2e/__fixtures__/sessao.ts`:** `EstadoDoProfessorDeTeste` passa a ser o tipo do contrato; só tipo.
- **`techspec.md`, seção 13 (borda do "Senha criada"):** não abre vazamento. O aviso não diz a quem tem o link nada além do que o aceite já dizia.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-02 05:48:17 · `tasks/prd-apresentacao-escola/14_task.md`

```
VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: "portão local: o último não rodou e2e. Rode `node tools/processo/portao-local.ts --e2e`."
Bloqueantes: nenhum
Recomendações: quatro, listadas abaixo
```

**Portão local.** Não contei a falta do `--e2e` como bloqueante nesta rodada intermediária, como na 1ª rodada e nas tarefas 10.0 a 13.0. O carimbo (typecheck, lint, test, início 08:21:33Z) também está velho: `apps/web/src/operacao/textos.ts` mudou depois dele. Pela função do próprio hook (`impressaoSemComentarios`), essa mudança é só de comentário e forma, e o `eslint` nesse arquivo passa limpo. O portão final precisa rodar de novo com `--e2e` antes do commit; o hook continua barrando sem isso.

**O que mudou desde a minha 1ª rodada.** Pelo instantâneo em `.processo/conteudo.json`, mudaram seis arquivos de código e entraram dois:
- mudaram: `operacao/pedidos-do-painel.ts`, `operacao/textos.ts`, `paginas/Convite.tsx`, `areas/coordenacao/convite-de-professor.ts`, `e2e/__fixtures__/sessao.ts`, `e2e/professores.spec.ts`;
- entraram: `componentes/textos-do-convite.ts` e `operacao/pedidos-do-painel.test.ts`.

Nada mudou desde a 4ª rodada do `frontend-reviewer`.

**As seis recomendações da 1ª rodada.**
1. Borda da senha ignorada: está em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md:428`, na seção 13.
2. Os três casos: estão em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md:489-495`, com o "Quebra sem".
3. Trava e alerta duplicados: não aplicada, com destino em `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md:452` e em "Recomendações sem aplicar". O motivo procede, e era recomendação.
4. Textos e reexports: os dois textos têm uma origem só (`componentes/textos-do-convite.ts`), e nenhum importador ficou apontando para os reexports removidos. Os dois lados afirmam os textos por extenso nos testes de unidade.
5. `tentarDeNovo()` faz as mesmas duas chamadas de antes; `EstadoDoProfessorDeTeste` é o tipo do contrato.
6. A tabela "Mutações" bate com o código de agora: conferi todas as linhas citadas de `api/professores.ts`, `api/convite.ts`, `DialogoDoConvite.tsx`, `Professores.tsx`, `Convite.tsx` e as demais. A nota de `Escolas.tsx` está em "Arquivos previstos que não mudaram".

**Escopo.** O lote não mudou comportamento nem tocou `apps/api`. `e2e/operacao-convite-coordenacao.spec.ts` segue intocado, como a tarefa pede. Não há `.skip`, `.only`, `any` nem `TODO` nos arquivos do lote.

**Recomendações**

1. **Dois nomes que diferem por uma letra no mesmo arquivo.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/convite-de-professor.ts:12` importa `TEXTO_DO_CONVITE_QUE_MUDOU` (o texto) e a `:102` exporta `TEXTOS_DO_CONVITE_QUE_MUDOU` (o mapa por código). Dê ao mapa um nome que diga o que ele é, por exemplo `TEXTO_POR_CODIGO_DO_CONVITE_QUE_MUDOU`.

2. **`cenarios.md` sem o e-mail na etapa do link.** O "Mande o link a …, que entra com o e-mail …" do cadastro (e sem e-mail no refazer) está na Tech Spec, seção 9, e tem e2e (`e2e/professores.spec.ts:434` e `:462`) e linha em "Mutações". Falta na linha de Professores do W4 (`cenarios.md:417`).

3. **Cabeçalho das divergências no `14_task.md:117`.** Diz que estão registradas na seção 9; a borda da senha foi para a seção 13. Cite as duas.

4. **Linhas fora da largura do documento.** `techspec.md:344`, `:347` e `:379`, `cenarios.md:479` e `14_task.md:182` passam da largura das vizinhas. É só forma.

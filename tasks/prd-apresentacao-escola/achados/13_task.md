# Achados das revisões — `tasks/prd-apresentacao-escola/13_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-01 20:34:11 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: REPROVADO

Cenários exigidos:
- E12 (13.0): pendente, aceito (os dois casos, mesma resposta) e ativo alocáveis; vencido,
  revogado, desativado e professor de outra escola com o NAO_ENCONTRADO do inexistente, sem
  gravar; vale o último convite de professor; o vínculo só alcança a turma depois do aceite,
  da entrada e da confirmação.
- W4 de Estrutura, Lista e Alocação: os quatro estados de cada uma.
- W10: windows-1252 com ";" e UTF-8 com BOM e ","; erros primeiro e em texto; CPF ou data
  segura a gravação; avisos de título e de cabeçalho.
- W12 nas três: 360 px, diálogo, cartões, alvos de 44 px, teclado.
- Clique duplo em "Gravar lista".
- Recomeço da tela: segunda pessoa, mesma entrada, resposta atrasada, falha com o diálogo aberto.
- Sem rastro; o que a tela segura (contado); ordem das listas; convite que vence com a tela
  aberta; leitura auditada.
- Permissão (guarda de papel) e isolamento (API e tela).

Cobertos:
- E12 inteiro. Rodei três mutações em vinculo.repository.ts e as três ficaram vermelhas no
  teste que a tabela indica: tipo do convite (:140), ordem pelo expira_em (:141), escola do
  usuário (:135, "ativo de outra escola" vira 500 pela FK).
- Concorrência da alocação repetida já tem teste paralelo de verdade (vinculo.int.test.ts:210).
  A corrida alocar × revogar cai no estado que a decisão aceita ("sem trava nova"); não exijo
  teste.
- W10, W12, clique duplo (Gravar e Excluir), segunda pessoa, mesma entrada, resposta atrasada,
  sem rastro, o que a tela segura, ordem, convite que vence, leitura auditada.
- W4 de Estrutura e de Lista; W4 de Alocação em vazio, com dado e erro.
- Rodei a mutação de Alocacao.tsx:76 no e2e (web reconstruída): vermelha.
- Sem .skip, sem teste comentado, sem mock de coisa nossa, sem provedor de IA.

Sobreviventes declarados:
- vinculo.repository.ts:140 (escola do convite): ACEITO. A FK composta existe
  (packages/nucleo/src/db/schema/convite.ts:44) e o cenário não se monta.
- vinculo.repository.ts:141 (desempate pelo id): ACEITO.
- dialogos.tsx:146 (focoInicial): ACEITO. Os dois projetos são Chromium, e a regra é provada
  em estrutura.spec.ts:362 e :376.
- ListaDaTurma.tsx:269 (limpar a escolha do arquivo): EXIJO TESTE (bloqueante 2).

Bloqueantes:
1. /home/joaquimdp/Documentos/git/Educa.ia/e2e/estrutura.spec.ts:358-378 — o título do teste
   (:304) e a tabela do 13_task.md prometem que o CONFLITO ao excluir "recarrega a lista", mas
   nada afirma isso: a turma com nome continua na lista de qualquer jeito. Tirei o
   `onError: aoTerminar` de apps/web/src/areas/coordenacao/dialogos.tsx:141 e os 10 testes do
   chromebook passaram. A cláusula também não tem linha em "Mutações".
   Correção: um caso em que a falha muda a lista. Com o diálogo "Excluir a turma" aberto, apagar
   a turma no banco (apagarTurmaComVinculosNoBanco) e confirmar. Afirmar o alerta "Esta turma já
   não existe. A lista foi atualizada.", só "Fechar", a turma fora da lista e o foco no título
   "Turmas de 2026". Acrescentar a linha em "Mutações".
2. /home/joaquimdp/Documentos/git/Educa.ia/e2e/estrutura.spec.ts:467 (e :488, :505) — a regra de
   ListaDaTurma.tsx:269 (a mesma planilha, corrigida e escolhida de novo, dispara outra leitura)
   não tem teste. O motivo dado em 13_task.md:249 não se sustenta: sondei no Chromium que, com a
   limpeza, o `inputValue()` do campo é "" e, sem ela, "C:\fakepath\lista.csv".
   Correção: depois do `setInputFiles` e do texto no campo, afirmar
   `await expect(<campo do arquivo>).toHaveValue('')`, e trocar a linha de "Mutações" de
   "sobreviveu" para o teste que fica vermelho.
3. /home/joaquimdp/Documentos/git/Educa.ia/e2e/estrutura.spec.ts:729-823 — o W4 exige os quatro
   estados da Alocação; o teste cobre vazio, com dado e erro, e não o carregando. Troquei o
   `EstadoCarregando` de apps/web/src/areas/coordenacao/Alocacao.tsx:74-75 por `null`: tudo verde.
   "Carregando a alocação…" não aparece em nenhum e2e, e a cláusula não tem linha em "Mutações".
   Correção: segurar a ROTA_VINCULOS (já interceptada no teste) com um `portao()` e afirmar o
   `status` "Carregando a alocação…" dentro da região Alocação antes de abrir; acrescentar a linha.

Recomendações:
- Recarregar na falha só está provado para Renomear e Alocar. Sobreviveram comigo
  ListaDaTurma.tsx:252 (gravação recusada), :426 (avulso), Estrutura.tsx:518 (abrir o ano) e
  :564 (criar). Os textos dizem "A tela foi atualizada".
- Alocacao.tsx:150-151: turma e disciplina que saem da lista saem da escolha; só o professor é
  provado. Sobreviveu.
- Estados sem asserção, todos sobreviventes: carregando e erro das seções Séries, Disciplinas e
  Turmas (Estrutura.tsx:228-231, 254-257, 292-295); alerta da falha de abrir o ano (:531);
  "Carregando a turma…" e o erro genérico da turma aberta (ListaDaTurma.tsx:70, :82); anúncio
  apagado ao abrir diálogo na Lista (:114).
- 13_task.md:259-261: as linhas de Alocacao.tsx:76 e :77 (sem turma, sem professor alocável)
  citam "W4 Estrutura do vazio ao roteiro". A de :76 eu rodei e quem falha é o W4 Alocação
  (estrutura.spec.ts:753); as de :77 apontam a mesma asserção com `timeout`, que só existe em
  :753 e :821. Corrigir o rótulo.
- e2e/areas.spec.ts:143 e :203: a permissão testa `/coordenacao`. Agora que a área tem tela,
  usar `/coordenacao/estrutura` e o endereço de uma turma; o comentário de :150-151 ("ainda não
  tem tela") caducou. O teste continua efetivo pelo chunk não baixado.
[… 18 linhas cortadas]

## test-engineer · 2ª rodada · APROVADO · 2026-10-01 21:18:36 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: APROVADO

Cenários exigidos:
- Os três bloqueantes da 1ª rodada: a falha ao excluir que muda a lista, a escolha do
  arquivo limpa depois de lida, e o carregando da Alocação.
- O código que mudou desde a 1ª rodada: matrícula no "Retirar" e na confirmação
  (homônimos), gravação recusada tira a prévia e queda de rede ou servidor a mantém,
  leitura de UTF-16 com BOM com o teto em dobro.
- E12 de ponta a ponta nos dois caminhos novos.
- Permissão nos endereços reais da coordenação, e isolamento.

Cobertos:
- Bloqueante 1 (dialogos.tsx:141): tirei o `onError: aoTerminar` e "renomear e excluir"
  ficou vermelho nos dois projetos, em estrutura.spec.ts:431
  (`expect(turmas).not.toContainText(deOutraPessoa.nome)`).
- Bloqueante 2 (ListaDaTurma.tsx:277): tirei a limpeza e o W10 ficou vermelho nos dois, em
  estrutura.spec.ts:542 (recebeu "C:\fakepath\lista-excel.csv").
- Bloqueante 3 (Alocacao.tsx:75): troquei o `EstadoCarregando` por `null` e o W4 Alocação
  ficou vermelho nos dois, em estrutura.spec.ts:913.
- Recomendações aplicadas que rodei eu mesmo, no chromebook, todas vermelhas na asserção
  que a tabela de "Mutações" aponta:
  - Estrutura.tsx:518 (abrir o ano que falha recarrega): estrutura.spec.ts:267.
  - Estrutura.tsx:564 (criar que falha recarrega): estrutura.spec.ts:467.
  - ListaDaTurma.tsx:434 (avulso que falha recarrega): estrutura.spec.ts:800.
  - ListaDaTurma.tsx:170 (matrícula no "Retirar"): estrutura.spec.ts:592, e também :675.
  - Alocacao.tsx:151 (disciplina que saiu sai da escolha): estrutura.spec.ts:1000.
- Gravação com 503 (estrutura.spec.ts:758-772): a prévia fica, "Gravar lista" tenta de
  novo e grava. É asserção sobre resultado, e a rota interceptada simula só a queda.
- Homônimos (estrutura.spec.ts:590-600): sai o da matrícula escolhida e o outro fica.
- UTF-16 (ler-arquivo-da-lista.test.ts:27-49): as duas ordens de byte, o BOM fora do
  texto, o arquivo no teto lido, acima do dobro recusado, e sem BOM vale o teto antigo.
  Este conferi por leitura, sem rodar mutação.
- E12 de ponta a ponta (professores.int.test.ts:550 e :583): fluxo real pela API, com a
  turma fechada antes de confirmar e aberta depois. A alocação nova do revogado usa outra
  disciplina, então quem recusa é a regra e não o índice único.
- Permissão (areas.spec.ts:144-157 e :208): `/coordenacao/estrutura` e o endereço de uma
  turma dão "não encontrada", sem título da Estrutura e sem baixar o chunk.
- Isolamento: "segunda pessoa" (estrutura.spec.ts:1087) e o E12 de outra escola, sem mudança.
- Sem `.skip`, `.only`, teste comentado nem `any` nos testes da tarefa. Nenhum provedor de IA.
- Estado devolvido depois das mutações: fontes com o mesmo sha256, `dist` do
  `educa-teste-web-1` idêntico ao de antes (`diff -r`), `git status --short` igual. Com
  tudo restaurado, `e2e/estrutura.spec.ts` deu 20 verdes nos dois projetos e a unidade da
  área, 15 verdes.

Bloqueantes: nenhum.

Recomendações:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:259 —
  dos três códigos que tiram a prévia, só o CONFLITO tem teste. Reduzi a lista a
  `[CodigoDeErro.CONFLITO]` e o trecho da gravação recusada (estrutura.spec.ts:737-772)
  passou inteiro. A regra está provada pelo CONFLITO contra o 503, por isso não bloqueia.
  Vale um caso com a turma apagada no banco entre a prévia e o "Gravar lista"
  (NAO_ENCONTRADO: o alerta "Esta turma não está mais no ano letivo em curso. Nada foi
  gravado." e a prévia fora), ou declarar ENTRADA_INVALIDA e NAO_ENCONTRADO como
  sobreviventes em "Mutações".
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/13_task.md:96 — a
  linha "recomeço da tela" ainda diz que "o CONFLITO ao excluir a turma recarrega a
  lista". Quem prova a recarga agora é a turma que outra pessoa excluiu com o diálogo
  aberto (NAO_ENCONTRADO); o CONFLITO prova o aviso, o foco e o reabrir limpo. Ajustar o
  texto ao que o teste afirma.
```

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-01 21:35:12 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: AJUSTES NECESSÁRIOS
Estados: faltando — o roteiro "O que falta" mostra "falta" no carregando e no erro das seções (bloqueante 1). Os demais (carregando, vazio, erro, com dado) estão presentes em Estrutura, em cada seção, na Alocação e na turma aberta; o vazio convida.
Acessibilidade: teclado completo, foco preso e devolvido nos diálogos, foco no texto da confirmação de perigo, rótulo em todo campo, estado sempre em texto. Falhas sem bloquear: erro de campo não é anunciado; botão `disabled` durante o pedido derruba o foco para o `body` (recomendações 1 e 2).
Chromebook fraco: ok. Chunk de 11,75 kB contra teto de 20 kB, sem animação, arquivo com teto antes de ler, lista de nomes paginada de 100 em 100. Sem virtualização nas listas da estrutura (até 1.000 cartões), aceitável para dezenas de turmas.
Celular: ok. Rolagem horizontal zero a 360, 768, 800, 1023 e 1024 px, com nomes compridos sem espaço, em Estrutura, turma aberta e diálogos. Nenhum alvo interativo abaixo de 44 px. Cartões em coluna abaixo de 768 px. Nada depende de hover nem de atalho.
Ação oficial protegida: sim. Gravar lista só depois da prévia linha a linha; excluir e retirar passam por confirmação que diz o efeito e o que impede. Não há nota nesta tarefa. Ressalva: "Alocar" é um clique sem volta na tela (recomendação 5).
```

Rodei um roteiro próprio no compose de teste, nos projetos `chromebook` e `celular`, com capturas, sem editar nenhum arquivo do repositório. O `e2e/estrutura.spec.ts` deu 19 de 20 na primeira execução e verde nas seguintes (ver recomendação 12).

## Bloqueantes

**1. O roteiro diz "falta" enquanto a seção carrega e quando ela falha** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/Estrutura.tsx:187-198`

- **O que está errado:** os `?? 0` e o `professores.data?.itens ?? []` tratam "ainda não sei" como zero.
- **Carregando:** com as leituras seguradas, o roteiro mostrou "Séries · falta, Disciplinas · falta, Turmas · falta, Professores · falta, Alocação · falta" numa escola que tinha tudo. No Fast 3G isso fica visível antes de virar "feito".
- **Erro:** com 503 em séries, turmas e professores, o roteiro ficou em "falta" nos três (e em Alocação), ao lado do "Tentar de novo" de cada seção. A coordenadora lê que precisa criar o que já existe.
- **Correção exigida:** o passo fica sem marca (ou com texto próprio de "conferindo") enquanto a consulta dele não tem dado, por carregando ou por erro. Vale para `series`, `disciplinas`, `turmas`, `professores` e `vinculos`. Com ano em curso e a consulta desligada, o zero continua valendo.
- **Teste exigido:** e2e que quebre sem isso. No trecho "o carregando e o erro de cada seção" do W4 "depois da virada", afirmar que o roteiro não contém "falta" no passo da seção segurada nem no da seção em 503.

**2. "Novo ano letivo" grava período de outro ano, sem volta** — `Estrutura.tsx:576-578` e `583-590`

- **O que está errado:** início e fim nascem do ano do relógio e não acompanham o campo "Ano". A validação só confere `fim > inicio`.
- **Reproduzido:** troquei o ano para 2027, as datas ficaram em 01/02/2026 e 15/12/2026, e a tela criou "2027 · Planejado · de 1 de fevereiro de 2026 a 15 de dezembro de 2026".
- **Por que bloqueia:** não existe rota de alterar nem de excluir ano letivo (`apps/api/src/estrutura/ano-letivo.controller.ts` só tem criar, listar, abrir e encerrar), então o erro não se corrige pela tela. Preparar o ano seguinte em novembro é o uso normal, e o comentário da linha 575 diz que o preenchimento existe "para a coordenação só conferir".
- **Correção exigida:** início e fim acompanham o ano digitado enquanto a pessoa não mexeu neles. Se preferirem validar, não exijam o fim dentro do ano civil: rede pública termina o ano letivo em janeiro do seguinte. Nesse caso, o erro vai no campo, em texto, quando o início não cai no ano digitado.
- **Teste exigido:** e2e que digite 2027, afirme o período de 2027 no diálogo e na linha criada, e que o período incoerente não saia calado.

## Recomendações

1. **Erro de campo mudo.** Em `NovoAnoLetivo`, `NovaDisciplina`, `NovaTurma` (`Estrutura.tsx:583-590`, `668-672`, `708-711`) e `NomeAvulso` (`ListaDaTurma.tsx:437-445`), o erro aparece sob o campo mas o foco fica no botão e o texto não tem `role` nem `aria-live` (medido). É o WCAG 4.1.3. O `Renomear` do mesmo arquivo já faz certo (`Estrutura.tsx:825-828`): levar o foco ao primeiro campo inválido, de preferência dentro do `DialogoDeFormulario`. O `NovaRede` da operação tem o mesmo comportamento, por isso não bloqueio.

2. **Foco cai no `body` com botão `disabled` durante o pedido.** Medido com teclado em "Alocar" (`Alocacao.tsx:227`) e "Ver a prévia" (`ListaDaTurma.tsx:366`); vale também para "Ver mais nomes" (`:178`) e "Abrir o ano letivo" (`Estrutura.tsx:543`). O Tab seguinte continua do lugar certo no Chrome, mas o anel de foco some. A 12.0 já resolveu isso com `aria-disabled` no `SeletorDeEscola`; o `useEnvioUnico` já segura o segundo clique. Abrir a turma e voltar para Estrutura também deixam o foco no `body`: levar ao `<h1>`.

3. **O anúncio de sucesso fica fora da vista.** Ele mora no topo da página (`Estrutura.tsx:173-175`, `ListaDaTurma.tsx:120-122`). Depois de "Alocar", ficou a −980 px no Chromebook e −1.880 px no celular; o da turma criada, a −980 e −1.010 px. O leitor de tela anuncia; quem enxerga só vê a lista mudar. Pôr o aviso na seção da ação ou fixo na janela.

4. **Prévia.**
   - O `role="status"` do resumo nasce junto com a região (`ListaDaTurma.tsx:386`), o que não garante o anúncio; levar o foco ao título "Prévia" ou manter uma região viva permanente.
   - No aviso de CPF ou data, as linhas suspeitas aparecem como "Entra na lista." e o resumo diz "3 nomes entram", contradizendo o bloqueio.
   - O mesmo texto aparece duas vezes (`:390-394` e `:418`). Marcar as linhas e dizer o motivo uma vez.

5. **Alocação sem volta na tela.**
   - A API tem `POST /v1/vinculos/:id/encerrar` e nenhuma tela o usa: professor errado na turma errada não se desfaz, e o "Contestado pelo professor" não oferece ação.
   - O `CONFLITO` de excluir turma (`Estrutura.tsx:450-451`) manda "Tire o que a prende e tente de novo", mas professor alocado, pedido e acesso não se tiram aqui (e alocação encerrada também prende). Dizer o que a tela pode e o que não pode.
   - Encerrar alocação é decisão de produto, fora do escopo da 13.3: subir para o `/validar`.
   - A lista de vínculos (`Alocacao.tsx:98`) vem na ordem de criação, com os encerrados no meio: ordenar por turma, como o resto.

6. **Vazio da Alocação e passo "Professores" não levam a lugar nenhum.** A tela Professores só chega na 14.0; ela deve trazer o link. O título "Crie uma turma e um professor primeiro" aparece também quando só falta o professor ou a disciplina.

7. **Escolha do arquivo** (`ListaDaTurma.tsx:353-359`).
   - O valor é limpo depois da leitura, então o controle nativo sempre diz "nenhum arquivo escolhido", mesmo com o arquivo já no campo.
   - O texto do controle segue o idioma do navegador ("Choose File" no navegador do teste).
   - Um `.xlsx` forçado entra como lixo: detectar o cabeçalho de zip e dizer "salve como CSV".

8. **Textos.**
   - "Ana … alocado em" erra o gênero (`Alocacao.tsx:158`); sugiro "Alocação feita: …".
   - "Gravar lista" pode dizer o objeto: "Gravar 32 nomes" (`docs/interface.md` 9.8).
   - "N nomes nesta página" não é página para quem usa "Ver mais nomes".
   - "O texto passa de 64 KB" é unidade técnica para a coordenadora.

9. **Aluno aprovado sem nome.** Pelo código (não reproduzi na tela), o cartão mostra "Aluno aprovado" no título e de novo no estado (`ListaDaTurma.tsx:159-161`); trinta aprovados viram trinta cartões iguais. Resumir em contagem, a decidir com a 16.0.

10. **Hover do link "Lista de nomes".** `enabled:hover:` não vale em `<a>` (`Estrutura.tsx:303`), então o link não tem retorno de hover.

11. **Sem virtualização.** As listas da estrutura rendem até 1.000 cartões. Aceitável hoje; rever se a alocação de uma escola grande passar de algumas centenas.

12. **Falha intermitente no e2e.** `e2e/estrutura.spec.ts:241` (W4 "depois da virada") falhou uma vez no `chromebook`, na primeira execução da suíte, e passou nas cinco seguintes (sozinho, a suíte de novo, e três repetições). Não capturei a mensagem. Vale o `test-engineer` olhar antes do portão final.

Capturas em `/tmp/claude-1000/-home-joaquimdp-Documentos-git-Educa-ia/fa2a73f2-5fbc-4a24-bbc9-de2f33ddba00/scratchpad/rev/img/`: `chromebook-B0-roteiro-carregando.png` (bloqueante 1), `celular-A2-dialogo-ano.png` (bloqueante 2), `chromebook-B2-depois-de-alocar-janela.png` (recomendação 3).

## test-engineer · 3ª rodada · APROVADO · 2026-10-01 22:27:02 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: APROVADO

Cenários exigidos (o que mudou desde a 2ª rodada):
 1. Roteiro "O que falta": passo sem marca enquanto a leitura dele carrega ou falha; sem ano em curso, turmas e alocação faltam de fato.
 2. "Novo ano letivo": o período acompanha o ano digitado; o início precisa cair no ano digitado; a data digitada fica; nada é enviado com erro.
 3. Foco no primeiro campo com erro (ano, início, fim, disciplina, turma, avulso nome e matrícula).
 4. Anúncio da ação na seção dela, apagado ao abrir diálogo ou tentar de novo.
 5. Prévia: foco no título, linha que parece CPF ou data marcada, motivo de não gravar sem repetir o aviso.
 6. Arquivo: .xlsx recusado antes do teto, sem encher o campo; "Arquivo lido: nome", que some quando o texto muda.
 7. Alocação: o vazio diz o que falta; vínculos por turma, disciplina e professor.
 8. Da minha 2ª rodada: NAO_ENCONTRADO entre a prévia e o "Gravar lista"; texto da linha "recomeço da tela".
 9. Permissão, isolamento e concorrência: nada novo neste diff (segunda pessoa e clique duplo não mudaram).

Cobertos:
 1. Sim. e2e/estrutura.spec.ts:319-328 (seguradas e depois em 503), :341 (volta a marcar), :978-982 (vínculos segurados), :162 (sem ano em curso).
 2. Sim. :141-153 (data digitada fica, início de 2025 no ano 2026 com erro e foco), :176-183 (2027 no diálogo e na linha criada), :257 (contagem dos POST).
 3. Sim. :138, :147, :153, :212, :236, :840, :846.
 4. Em parte: provado que aparece, numa seção só, e que some (:437, :864, :1011). Qual seção, não (recomendação 1).
 5. Sim. :582, :759-762, e previa-da-lista.test.ts (pareceDocumento nos dois sentidos).
 6. Sim. ler-arquivo-da-lista.test.ts (zip pequeno, zip acima do teto, texto que começa por "PK"); e2e :734-736, :605-606, :619.
 7. Sim. :224, :340, :963, :1081; ordem.test.ts (as três chaves); e2e :1015-1018, que cobre de quebra a professora com duas disciplinas na mesma turma.
 8. Sim. :925-933; ENTRADA_INVALIDA declarado sobrevivente em 13_task.md:378; 13_task.md:96 diz o que o teste afirma.
 Sem .skip, .only nem teste comentado; o test.slow() novo (:265) só alarga o prazo. Os page.route seguram ou derrubam a resposta para os estados de carregando e erro, sem esconder regra. Não há IA nesta tarefa.

 O que eu rodei:
 - Unidade: `npx vitest run apps/web/src/areas/coordenacao`, 17 verdes.
 - Mutação no e2e, um build com quatro mutações em Estrutura.tsx, projeto chromebook:
   - sem a regra do início (:637): vermelho em spec:152;
   - `alocaveis?.length ?? 0` (:219): vermelho em spec:323;
   - `vinculos ... ?? 0` (:220): vermelho em spec:980;
   - anúncio na seção errada (:430, :452, :478 trocados para 'series'): "renomear e excluir" ficou VERDE.
 - Restauro: fonte por cópia (mesmo sha256), web reconstruída e copiada para educa-teste-web-1 (index.html igual ao de antes, dist do host idêntico, `git status` igual); os quatro testes voltaram a verde.
 - Ficaram no contêiner 6 arquivos de assets sem referência, de builds mutados (19 contra 13 do host). Não atrapalham e somem na próxima subida com --build.

Bloqueantes: nenhum

Recomendações:
 1. Anúncio na seção errada sobrevive (confirmado rodando). O auxiliar `anuncio` (e2e/estrutura.spec.ts:65) procura no `main` inteiro, então trocar a seção em qualquer `anunciar(...)` de Estrutura.tsx (:357, :371, :382, :395, :412, :430, :452, :478) não é pego. A linha `Estrutura.tsx:183` de "Mutações" (13_task.md:363) prova "numa seção só", não "na seção da ação". Correção: escopar ao menos uma asserção por seção à região (por exemplo `turmas.getByRole('status').filter({ hasText: ... })` em :423 e :474, e o mesmo em :158, :527, :1001), ou declarar o sobrevivente.
 2. A prova de "o período acompanha o ano digitado" vence em 01/01/2027. O teste digita o literal 2027 (spec:176-178); quando o relógio for 2027, a mutação de Estrutura.tsx:632 passa a sobreviver com o teste verde (já declarado em 13_task.md:352). O dano é limitado, porque a regra do início (:637) seguraria o envio. Correção: usar no teste o ano do relógio + 1, ou um ano fixo distante.
 3. "O fim pode cair no ano seguinte" (Estrutura.tsx:618-619, a rede que termina em janeiro) não tem teste. Uma checagem do ano do fim acrescentada depois não seria pega.
 4. A regra do início só existe na tela. `esquemaPedidoCriarAnoLetivo` (packages/shared/src/estrutura/ano-letivo.ts:22) só exige fim > início, e a API aceita ano 2027 com período de 2026. Como guarda de tela está provada; se é regra de negócio (regra 00, item 1), vai para o esquema com teste de integração. Fica para o `revisor-geral`.
 5. "Mutações" com resto da versão anterior: 13_task.md:259 cita a asserção antiga ("O texto passa de 64 KB…"), e o teste hoje afirma "A lista é grande demais para um envio só…" (spec:730). Linhas deslocadas em um: ListaDaTurma.tsx:282 e :283 são :283 e :284; Estrutura.tsx:596 é :597.
 6. A tabela "Testes que provam a regra" (13_task.md:99, linha "o que a tela segura") não lista o início fora do ano digitado nem o .xlsx, e não há linha para o roteiro sem marca; o cenarios.md:412 já diz.
 7. O texto novo do CONFLITO de excluir turma só tem o trecho antigo afirmado (spec:441); a frase nova ("Os nomes livres saem pela lista de nomes da turma…") não.
```

Arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/e2e/estrutura.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/Estrutura.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/estrutura/ano-letivo.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/13_task.md`.

## frontend-reviewer · 2ª rodada · AJUSTES NECESSÁRIOS · 2026-10-01 22:33:06 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: AJUSTES NECESSÁRIOS
Estados: ok. O roteiro não diz mais "falta" no carregando nem no erro (medido nos dois projetos); os demais estados seguem como na 1ª rodada.
Acessibilidade: foco no primeiro campo com erro, anúncio na seção da ação e foco no título da prévia conferidos; axe sem violação grave. Falha nova: o foco é tirado do campo de texto no meio da digitação (bloqueante 1).
Chromebook fraco: ok. Chunk coordenacao-* em 12,4 kB contra teto de 20 kB; nada novo que custe CPU ou rede.
Celular: ok. Rolagem horizontal zero a 360 px na página e no diálogo com o erro novo, com nome de arquivo comprido e com a prévia marcada; os três anúncios ficam dentro da janela.
Ação oficial protegida: sim. "Novo ano letivo" avisa que ano e período não se alteram e segura o início fora do ano digitado; gravar lista segue só depois da prévia.
```

Rodei um roteiro próprio contra `http://127.0.0.1:28090`, nos projetos `chromebook` e `celular`, sem editar nada do repositório. Ele criou escolas sintéticas no banco de teste, como o e2e faz.

## Correções exigidas na 1ª rodada

1. **Roteiro sem "falta" no que não leu: feita.** Com as cinco leituras seguradas numa escola que tem tudo, e depois em 503, o roteiro mostrou só "Ano letivo · feito" e os outros passos sem marca. Com dado, marcou certo. O e2e pedido existe (`e2e/estrutura.spec.ts:319-341`, `:978-982`, `:162`).
2. **"Novo ano letivo" sem período de outro ano: feita.**
   - Digitar 2028 leva o período a 2028-02-01 e 2028-12-15; com ano inválido ("20"), volta ao ano do relógio.
   - Depois de mexer no início e trocar o ano para 2029, as datas ficam como digitadas e sai "O início precisa cair em 2029, o ano letivo digitado.", com o foco no Início e nada enviado.
   - O fim em janeiro do ano seguinte passa: criou "2029 Planejado · de 5 de fevereiro de 2029 a 20 de janeiro de 2030".
   - O e2e pedido existe (`:141-153`, `:176-183`).

## Bloqueantes

**1. A prévia que reaparece tira o foco do campo, e o que a pessoa digita depois se perde** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:401-403`

- **O que está errado:** o `useEffect` novo leva o foco ao título "Prévia" toda vez que `PreviaDaLista` monta. Ela monta quando a resposta chega, mas também quando o texto do campo volta a ser o da prévia (`previaAtual`, `:315`).
- **Reproduzido nos dois projetos:**
  1. Colei `Carla Souza;880001\nDiego Lima` e pedi a prévia (linha 2 sem matrícula).
  2. Voltei ao campo, digitei `x` (a prévia some) e apaguei com Backspace.
  3. A prévia voltou e o foco saiu do `TEXTAREA` para o `H3` "Prévia".
  4. Digitei `;880002` em seguida e o campo continuou `Carla Souza;880001\nDiego Lima`.
- **Por que bloqueia:** é bug no fluxo principal da tela (ver o erro, voltar ao campo, corrigir), criado por este diff. O gatilho é estreito: errar a primeira tecla e apagar, ou Ctrl+Z até o texto da prévia. Quando acontece, a digitação some sem aviso; não testei com teclado virtual. É mudança de contexto ao digitar (WCAG 3.2.2, nível A).
- **Mesma causa, já presente na 1ª rodada e que eu não peguei:** `AlertaDaFalha` foca ao montar (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/dialogos.tsx:62-64`), e `falhaDaPrevia` e `falhaDaGravacao` voltam quando o texto volta ao que foi recusado (`ListaDaTurma.tsx:317`, `:325`). Reproduzi com `nome;matrícula`: depois de `x` e Backspace, o alerta voltou e levou o foco. `falhaDaGravacao` não rodei; é a mesma comparação.
- **Correção exigida:** o foco só vai ao título da prévia e ao alerta quando a resposta chega para o texto que está no campo. Texto que volta a um valor anterior nunca tira o foco do campo. A resposta atrasada continua sem aparecer.
- **Teste exigido:** e2e que quebre sem isso. Depois da prévia com erro, focar o campo, digitar um caractere e apagar; afirmar `toBeFocused()` no campo e que o texto digitado em seguida entra nele (`toHaveValue`). O mesmo para o alerta da prévia recusada.

## Recomendações

1. **Início vazio acusa o Fim.** Com o início apagado, o erro e o foco vão para "Fim" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/Estrutura.tsx:638`, `:644`). Pôr o erro no campo que está vazio.
2. **Fim sem teto.** O período não se altera depois, e um ano digitado errado na data do fim (2207 no lugar de 2027) passa. Um limite folgado, como o fim do ano seguinte, segura o erro sem barrar a rede que termina em janeiro.
3. **Enter com o foco já no campo.** O erro aparece, mas o foco não muda e o texto do erro não tem região viva (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/Campo.tsx`), então o leitor de tela pode não ler. É resto da recomendação 1 da 1ª rodada e vale para todas as telas.
4. **`.xls` antigo ainda entra como lixo.** Medido: o campo recebeu `ÐÏ\u0011à…` sem aviso (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:28-33`). Detectar também o cabeçalho `D0 CF 11 E0`, ou byte nulo em geral. O texto diz ".xlsx" para qualquer zip, como `.ods`.
5. **Título do vazio da Alocação contradiz a descrição.** "Crie uma turma e um professor primeiro" aparece ao lado de "Falta: uma disciplina." (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/Alocacao.tsx:86`). Ajustar o W4 no `cenarios.md` junto com o link que a 14.0 traz.
6. **"3 nomes entram" ao lado de "Nada é gravado".** Com as linhas marcadas ficou legível, e aceito a conta da API; se mexerem de novo, descontar as linhas suspeitas do resumo.

As recomendações da 1ª rodada foram aplicadas como descrito (1, 3, 4, 7, 8 e 10 conferidas na tela) ou estão registradas onde disseram: `TODO.md:522-533`, `14_task.md:83-87` e `16_task.md:31-36`.

Roteiro e capturas em `/tmp/claude-1000/-home-joaquimdp-Documentos-git-Educa-ia/fa2a73f2-5fbc-4a24-bbc9-de2f33ddba00/scratchpad/rev2/` (`a.spec.ts`, `b.spec.ts`, `img/`).

## test-engineer · 4ª rodada · REPROVADO · 2026-10-01 23:24:15 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: REPROVADO

Cenários exigidos (do diff desde a 3ª rodada):
 1. Período do ano letivo no contrato: início fora do ano e fim depois do ano seguinte recusados; fim em janeiro do ano seguinte passa.
 2. O mesmo na tela: início vazio, início fora do ano, fim invertido e fim acima do teto, com o erro no campo, o foco nele e nenhum pedido enviado.
 3. Foco na lista colada:
    a. a prévia, a prévia recusada e a gravação recusada levam o foco quando a resposta chega;
    b. quando voltam porque o texto voltou a um valor anterior, o foco fica no campo e o que se digita entra nele;
    c. a resposta atrasada não guarda foco para depois;
    d. o pedido de foco é atendido uma vez só: uma renderização sem resposta nova não mexe no foco.
 4. Quebras de linha do arquivo viram as do campo.
 5. O `.xls` antigo recusado como planilha, com o texto novo do aviso.
 6. Anúncio na seção da ação, e só nela.
 7. Prova de "o período acompanha o ano" sem depender do relógio.

Cobertos:
 1. Coberto. `packages/shared/src/estrutura/ano-letivo.test.ts` afirma o campo do erro e as duas fronteiras (31/12 do ano seguinte passa, 01/01 depois não). `apps/api/test/estrutura.int.test.ts:212` recusa os três casos com ENTRADA_INVALIDA, a contagem fica em 1, e o fim em janeiro cria o ano.
 2. Coberto em `e2e/estrutura.spec.ts:129-171`, com a contagem de criações na linha 278. A exceção é o fim vazio (recomendação 1).
 3a. Coberto em `e2e/estrutura.spec.ts:614`, `:793` e `:866`.
 3b. Coberto em `:625-637`, `:794-803` e `:871-877`.
 3c. Coberto em `:846-850`. Rodei a mutação de `ListaDaTurma.tsx:313` e ficou vermelha na linha 850, nos dois projetos, como declarado.
 3d. Não coberto: ver o bloqueante.
 4. Coberto em `:633-634`; a amostra `e2e/__fixtures__/lista-excel.csv` tem CRLF de fato.
 5. Coberto em `ler-arquivo-da-lista.test.ts` e `e2e/estrutura.spec.ts:780`.
 6 e 7. Cobertos: `anuncio(secao, texto)`, os dois `toHaveCount(1)`, e 2099 com fim em 20/01/2100.

 Não reauditei o que não mudou. Sem `.skip`, sem teste comentado, sem mock que esconda a regra e sem provedor pago no diff. Os outros chamadores de `POST /v1/anos-letivos` na integração usam período dentro do ano, e nenhuma fixture do e2e cria ano por essa rota, então o contrato novo não quebra o resto.

Bloqueantes:
 1. `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:265` — `focoPendente.current = undefined` dentro do efeito (o pedido de foco é consumido ao ser atendido) não tem linha em "Mutações", não está entre os sobreviventes declarados, e nenhum teste falha sem ela.
    - O que rodei: apaguei a linha, reconstruí a web, copiei para `educa-teste-web-1` e rodei `e2e/estrutura.spec.ts` inteiro. Resultado: 20 verdes, chromebook e celular.
    - Por que não é mutante equivalente: o efeito não tem lista de dependências. Sem a linha, o foco volta ao título da prévia (ou ao alerta) a cada renderização de `SubirLista` enquanto o alvo está na tela, até a próxima tecla. `ConteudoDaLista` renderiza `SubirLista` de novo em "Ver mais nomes", na recarga da lista, ao abrir um diálogo e ao mudar o anúncio. Dentro do próprio `SubirLista`, escolher um `.xlsx` com a prévia na tela perde o foco do aviso para o título, porque o efeito do pai roda depois do efeito do `AlertaDaFalha`.
    - Por que bloqueia: é o mesmo defeito que o `frontend-reviewer` bloqueou (foco tirado de onde a pessoa está), por outro caminho. A regra "o foco só vai à prévia e ao alerta quando a resposta chega" está provada só para a volta do texto.
    - Correção exigida: um teste em `e2e/estrutura.spec.ts` em que, com a prévia (ou o alerta) já entregue e na tela, uma renderização que não é troca de texto nem resposta nova não leva o foco. Dois jeitos que matam a mutação:
      - no W10, depois da linha 614, escolher um `lista.xlsx` e afirmar `toBeFocused()` no alerta da planilha;
      - focar o campo sem digitar, provocar a recarga ou a paginação dos nomes, e afirmar `expect(campo).toBeFocused()`.
    - Junto: a linha da cláusula em "Mutações" do `13_task.md`, com a mutação rodada e vermelha, e a linha "foco na lista colada" da tabela "Testes que provam a regra" dizendo esse caso.

Recomendações:
 1. `apps/web/src/areas/coordenacao/Estrutura.tsx:642` — "Preencha o fim." não tem teste nem linha em "Mutações". Sem a cláusula, o fim vazio ainda é segurado pela comparação com o início, com o texto "O fim precisa ser depois do início."; se o início também estiver vazio, o fim fica sem erro até o início ser corrigido. A API recusa de qualquer jeito. Vale um passo no diálogo do ano, ao lado do início vazio (`e2e/estrutura.spec.ts:156-162`).
 2. `tasks/prd-apresentacao-escola/13_task.md:376` — a linha de `ListaDaTurma.tsx:326` ainda cita a asserção com o texto antigo ("Este arquivo é uma planilha do Excel (.xlsx), e não …"). O teste afirma hoje "Este arquivo é uma planilha (.xlsx, .xls ou .ods), e não texto." (`e2e/estrutura.spec.ts:780`). Rodar de novo e atualizar a linha, como foi feito com as outras seis.
 3. `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:332` — o `\r` sozinho da expressão `/\r\n?/g` não tem amostra; só o CRLF é provado. Um caso de unidade bastaria se a troca fosse para uma função pura ao lado de `lerArquivoDaLista`.
```

**Estado do ambiente depois das duas mutações que rodei** (a da linha 265, que sobreviveu, e a da linha 313, para validar o procedimento):
- `apps/web/src/areas/coordenacao/ListaDaTurma.tsx` foi restaurado por cópia, com o sha256 conferido.
- `git status --short` está idêntico ao de antes.
- A web foi reconstruída do código restaurado e o `dist` local ficou byte a byte igual ao original.
- O `dist` de `educa-teste-web-1` voltou ao original, com os chunks órfãos das mutações removidos e os hashes conferidos.
- Com tudo restaurado, os dois testes da lista passaram de novo (4 verdes), e as unidades de `ano-letivo.test.ts` e `ler-arquivo-da-lista.test.ts` também (12 verdes).
- `test-results/` (ignorado pelo git) ficou com os traços da mutação que falhou; o Playwright limpa na próxima execução.
- Não rodei `portao-local.ts`.

## test-engineer · 5ª rodada · APROVADO · 2026-10-01 23:45:16 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: APROVADO

Cenários exigidos (correção da 4ª rodada e diff desde ela):
 1. O pedido de foco é atendido uma vez só: com a prévia entregue e na tela, uma renderização que não é troca de texto nem resposta nova não leva o foco.
 2. O fim vazio no diálogo do ano letivo: erro no campo dele, foco nele, nenhum pedido enviado.
 3. As quebras de linha do arquivo viram as do campo: `\r\n`, `\r` sozinho e `\n`.
 4. As linhas de "Mutações" cuja asserção mudou de texto, rodadas de novo e atualizadas.

Cobertos:
 1. Coberto em `e2e/estrutura.spec.ts:631-637`.
    - O teste escolhe o `lista.xlsx` depois da primeira prévia, e afirma o aviso, a prévia ainda visível e `toBeFocused()` no aviso.
    - Rodei a mutação de `ListaDaTurma.tsx:265` (linha apagada, web reconstruída e copiada para `educa-teste-web-1`): vermelha nos dois projetos, em `expect(avisoDaPlanilha).toBeFocused()` na linha 637, como declarado.
    - A linha está em "Mutações" (`13_task.md:426`), e a linha "foco na lista colada" da tabela de testes (`13_task.md:102`) diz o caso.
 2. Coberto em `e2e/estrutura.spec.ts:163-169`: texto "Preencha o fim.", foco no campo e ausência do erro de período.
    - A contagem de criações na linha 284 continua fechando que nada saiu.
    - Não rodei a mutação de `Estrutura.tsx:641`; conferi pelo código: sem a cláusula, o fim vazio cai em "O fim precisa ser depois do início.", e as linhas 167 e 169 falham.
    - A linha está em `13_task.md:427`.
 3. Coberto em `ler-arquivo-da-lista.test.ts:76-82`, com as três amostras.
    - Rodei a mutação de `ler-arquivo-da-lista.ts:58` (sem o `?`): vermelha na amostra do `\r` sozinho.
    - A chamada em `ListaDaTurma.tsx:329` segue provada pelo W10 (`e2e/estrutura.spec.ts:647`), com linha em `13_task.md:428`.
 4. Feito: `13_task.md:431` cita o texto de agora do aviso da planilha, e `13_task.md:430` a asserção nova das turmas em ordem. Conferi só o texto das duas linhas; não rodei essas duas mutações.

 Sem `.skip`, teste comentado, mock que esconda a regra ou provedor pago no diff. Não reauditei o que não mudou.

Bloqueantes: nenhum.

Recomendações:
 1. `tasks/prd-apresentacao-escola/13_task.md:99` — a linha "o que a tela segura" lista "início vazio" e não o "fim vazio", que agora tem teste. Acrescentar, para a tabela dizer o que o e2e prova.
```

**Estado do ambiente depois das duas mutações que rodei** (`ListaDaTurma.tsx:265` e `ler-arquivo-da-lista.ts:58`):
- Os dois arquivos foram restaurados por cópia, com o sha256 conferido.
- `git status --short` está idêntico ao de antes.
- A web foi reconstruída do código restaurado; o `dist` local e o de `educa-teste-web-1` conferem arquivo a arquivo com os hashes de antes, sem chunk órfão.
- Com tudo restaurado, o W10 e o "do vazio ao roteiro" passaram nos dois projetos (4 verdes), e as unidades de `ler-arquivo-da-lista.test.ts` e `ano-letivo.test.ts` também (13 verdes).
- O conteúdo dos dois arquivos-fonte não mudou, mas a data de modificação deles sim. Se o carimbo do portão olhar a data e não o conteúdo, ele precisa ser refeito.
- `test-results/` (ignorado pelo git) foi regravado pela execução verde.
- Não rodei `portao-local.ts`.

Os registros desta rodada estão em `/tmp/claude-1000/-home-joaquimdp-Documentos-git-Educa-ia/fa2a73f2-5fbc-4a24-bbc9-de2f33ddba00/scratchpad/te5/` (`e2e-mut265.log`, `un-mut58.log`, `e2e-verde.log`).

## frontend-reviewer · 3ª rodada · APROVADO · 2026-10-01 23:53:16 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: APROVADO
Estados: ok. Nada mudou nos quatro estados desde a 2ª rodada; os erros novos de campo e o aviso da planilha dizem o que fazer.
Acessibilidade: ok. O foco vai à prévia e ao alerta só quando a resposta chega, e fica no campo quando eles voltam pela volta do texto. Axe sem violação grave com o alerta e a prévia na tela e no diálogo do ano com erro.
Chromebook fraco: ok. Nada novo que custe CPU ou rede; o chunk coordenacao-* em 12,7 kB contra 20 kB é o número que você informou, não medi de novo.
Celular: ok. Rolagem horizontal zero a 360 px na lista com alerta e prévia e no diálogo do ano com os erros novos; `e2e/estrutura.spec.ts` verde no projeto `celular`.
Ação oficial protegida: sim. O período do ano letivo, que não se altera depois, agora é segurado na tela e recusado pela API pelo mesmo contrato; gravar a lista segue só depois da prévia.
Bloqueantes: nenhum
Recomendações: 3, listadas abaixo
```

Rodei `e2e/estrutura.spec.ts` (20 verdes, `chromebook` e `celular`) e um roteiro próprio contra `http://127.0.0.1:28090`, nos dois projetos, sem editar nada do repositório. O roteiro criou escolas sintéticas no banco de teste, como o e2e faz.

## Correção exigida na 2ª rodada

**1. A prévia e os alertas que reaparecem não tiram mais o foco do campo: feita.** O roteiro repetiu a reprodução da 2ª rodada, com o mesmo resultado nos dois projetos:

- **Prévia com erro:** depois de `x` e Backspace, a prévia volta e o foco fica no `TEXTAREA`. O `;880002` digitado em seguida entra: o campo ficou `Carla Souza;880001\nDiego Lima;880002`.
- **Ctrl+Z até o texto da prévia:** a prévia volta e o foco fica no campo.
- **Prévia recusada (`nome;matrícula`):** o alerta leva o foco quando a resposta chega. Depois de `x` e Backspace ele volta com o foco no campo, e `\nAna;1` entra.
- **Gravação que cai (503):** o alerta leva o foco e a prévia fica. Depois de `x` e Backspace os dois voltam, com o foco no campo. Este caso eu não tinha rodado na 2ª rodada.
- **Arquivo com `\r` sozinho e `\r\n`:** o campo recebe `\n`, e a prévia do texto lido volta depois de `x` e Backspace, com o foco no campo.
- **Resposta atrasada:** continua sem aparecer, e não guarda foco para depois (`e2e/estrutura.spec.ts`, bloco "a resposta atrasada").

O e2e exigido existe e quebraria sem a correção: no W10 para a prévia, e em "a lista paginada…" para o alerta da prévia recusada e o da gravação recusada, cada um com `toBeFocused()` no campo e `toHaveValue` do que se digita depois. Li a lógica do `focoPendente` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:252-271` e `:312-317` e não achei caminho em que um pedido velho de foco seja atendido depois.

## Recomendações da 2ª rodada

- **1 (início vazio):** conferida. Com os dois vazios saem "Preencha o início." e "Preencha o fim.", com o foco no Início.
- **2 (fim sem teto):** conferida. Fim em 2207 e fim em 1º de janeiro de dois anos à frente dão "O fim precisa cair em 2031 ou em 2032.", com o foco no Fim e nenhum pedido enviado. Fim em 20 de janeiro do ano seguinte cria o ano.
- **3 (erro do `Campo` sem região viva):** registrada em `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md:526-527`.
- **4 (`.xls` antigo):** conferida. O arquivo com `D0 CF 11 E0` dá o aviso novo, com o foco nele, e o campo fica intacto.
- **5 (título do vazio da Alocação):** registrada em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/14_task.md:85-89`.
- **6:** fica como está.

## Recomendações desta rodada

1. **A resposta que chega com o foco já no campo ainda o tira de lá.** Medido nos dois projetos: pedi a prévia, cliquei no campo sem mudar o texto, a resposta chegou, o foco foi para o título "Prévia", e o `;880011` digitado em seguida não entrou. É o comportamento que eu mesmo exigi ("quando a resposta chega para o texto que está no campo"), por isso não bloqueia. A janela existe em rede lenta. Sugestão: em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:260-267`, só levar o foco se ele ainda estiver no botão que fez o pedido ou no `body`. Cabe no item "Foco durante o pedido" do `TODO.md:522`.
2. **O alerta que volta pela volta do texto é anunciado de novo.** O `AlertaSemFoco` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/dialogos.tsx:79-85`) tem `role="alert"`, então o leitor de tela o lê outra vez no meio da digitação. O texto é verdadeiro para aquele conteúdo, e não medi com leitor de tela. Se incomodar em teste com usuário, a volta pode usar `role="status"`.
3. **O período tem a regra em dois lugares.** A ordem dos erros em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/Estrutura.tsx:638-647` repete a dos `refine` de `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/estrutura/ano-letivo.ts`. As duas funções são compartilhadas, mas "fim depois do início" está escrito duas vezes. Uma terceira função em `packages/shared` fecha isso.

Roteiro, saída e capturas em `/tmp/claude-1000/-home-joaquimdp-Documentos-git-Educa-ia/fa2a73f2-5fbc-4a24-bbc9-de2f33ddba00/scratchpad/rev3/` (`c.spec.ts`, `saida.txt`, `img/`). `git status` ficou igual ao de antes; não rodei `portao-local.ts`.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-01 23:57:09 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration nesta tarefa. Lidas `usuario`, `convite` e `vinculo`, todas com `escola_id`; `vinculo` tem `ano_letivo_id`. A FK composta `convite_usuario_da_escola_fk (escola_id, usuario_id)` em packages/nucleo/src/db/schema/convite.ts:44 confirma que a escola na consulta do convite é segunda camada. Ids são UUID.

Queries verificadas:
- apps/api/src/estrutura/vinculo.repository.ts:130-145 (`professorAlocavel`): as duas consultas levam `exigirEscolaDoContexto()`; a função só recebe `usuarioId`. O usuário de outra escola e o inexistente saem na primeira consulta, pelo mesmo caminho.
- apps/api/src/estrutura/vinculo.repository.ts:81-98 (`criar`): escola e ano vêm do contexto; a FK composta do vínculo segura o usuário de outra escola.
- apps/api/src/estrutura/vinculo.service.ts:85-88: turma, professor e disciplina respondem o mesmo `NAO_ENCONTRADO`.
- packages/shared/src/estrutura/vinculo.ts:76-83 e packages/shared/src/estrutura/ano-letivo.ts:32-41: esquemas estritos; `escolaId` no corpo dá `ENTRADA_INVALIDA`, e o refino novo do período não lê nada.
- Web (apps/web/src/api/estrutura.ts, lista.ts, professores.ts): nenhuma chamada manda escola. Chaves sob `['estrutura']`, esvaziadas pelo `resetQueries` de apps/web/src/main.tsx:26-28 na troca de sessão ou de escola.
- Camada rede: não tocada. `@SemEscopo()`: nenhum novo.

Teste de isolamento: presente e efetivo
- apps/api/test/professores.int.test.ts, E12, "vencido, revogado, desativado depois do aceite e o professor de outra escola…": sem `eq(usuario.escolaId, …)` na linha 135, o ativo de B vira alocável e o insert cai na FK em vez do 404; o teste quebra.
- apps/api/test/turma-acesso.int.test.ts:318 (contexto forjado de A com o usuário de B) e :259 (`usuario_id` de B igual ao inexistente, nada nasce em A nem em B) quebram com a mesma remoção.
- A cláusula de escola do convite (linha 140) sobrevive à mutação, como declarado; aceito, porque a FK composta impede montar o cenário.
- Rodei: E12 com 6 de 6 verdes; os três testes acima de turma-acesso e vinculo, verdes.
- e2e "segunda pessoa" (e2e/estrutura.spec.ts:1247) lido, não rodado: cobre o cache na mesma aba e o endereço da turma de A.

Bloqueantes: nenhum

Recomendações:
1. /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/Estrutura.tsx:798 — o `POST /v1/turmas` manda `anoLetivoId` no corpo, ao contrário do que o pedido de auditoria afirma ("nenhuma chamada manda escola nem ano"). Não é escalada: o campo é do contrato da 1.0 e só confere (apps/api/src/estrutura/turma.service.ts:51 compara com o ano do contexto, e o repository grava com `exigirAnoEmCurso()`). Corrigir a frase nos documentos da tarefa, se ela estiver lá.
2. /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/turma-acesso.int.test.ts:366-371 — o controle com a escola de B não inclui `professorAlocavel`. Acrescentar `professor: true` ali provaria no próprio teste que o `false` de A vem da escola, sem depender da mutação registrada.
3. /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts:87-89 — `professorAlocavel` fixa `papel = 'professor'` e `criar` grava `pedido.papel`. Hoje coincidem porque `PAPEIS_DE_VINCULO_PELA_COORDENACAO` é só `['professor']`; quem abrir outro papel nessa lista precisa rever a guarda.
4. /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/professores.int.test.ts (E12, caso de outra escola) — o "pendente de outra escola" passa mesmo sem a escola na consulta do usuário, porque o convite filtrado por A o lê como `desativado`. Quem prova a cláusula é o "ativo de outra escola"; um comentário de uma linha evita que alguém o retire como redundante.
```

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-02 00:01:10 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: APROVADO
Campos pessoais tocados: nome, matrícula e estado do nome da lista (aluno, antes de ser usuário), só em leitura e escrita pelas rotas da 2.0; nome e estado do convite do professor (sem e-mail); vínculo do professor (estado, contestação e complemento, que só a coordenação lê). Nenhum campo novo, nenhuma migration.
Fora da tabela de dados do docs/lgpd.md: nada. Lista, vínculo, convite de professor e auditoria já estão no mapa (linhas 70, 72, 75, 87).
Autorização por objeto: ok. A alocação recusa vencido, revogado, desativado, quem não é professor e o professor de outra escola com o mesmo NAO_ENCONTRADO do inexistente, sem gravar, e o aceito responde igual nos dois casos que junta (E11). Na tela, a turma de outra escola e a inexistente dão o mesmo texto.
Logs: limpos. A tarefa não escreve log; a web não tem console nem telemetria; o único log no caminho é o nome do evento `vinculo.criado`, que já existia.
Auditoria: presente. A leitura da lista leva a finalidade e grava `turma.lista_lida` por página; a alocação grava `vinculo.criado` só com ids; nenhuma invalidação relê a lista em segundo plano (todas usam o padrão, que só refaz a consulta que está na tela).
Envio externo: nenhum. O arquivo é lido no navegador e a API recebe só o texto.
Seed/fixture: sintético. Nomes inventados com marca aleatória, matrículas numéricas de teste, e-mails em `@educa.invalid`.
Bloqueantes: nenhum
Recomendações: sete, abaixo.
```

Auditei por leitura do diff e dos arquivos novos. Rodei só as duas unidades da área (`previa-da-lista.test.ts` e `ler-arquivo-da-lista.test.ts`, 14 verdes); não rodei e2e nem integração, nem toquei no banco de teste.

## O que conferi e está certo

- **Alocação antes do aceite** (`apps/api/src/estrutura/vinculo.repository.ts`, `professorAlocavel`): o vínculo de quem nunca entrou não cria dado novo nem acesso.
  - O E12 prova que a turma só abre depois do aceite, da entrada e da confirmação.
  - A eliminação do usuário já apaga os vínculos dele (`apps/api/src/sessao/ciclo-de-vida.service.ts:69`).
  - O professor que nunca aceitou e teve o convite expurgado cai em `desativado` pelo `estadoDoProfessor`, e deixa de ser alocável.
- **Sem rastro na tela**:
  - A lista de nomes fica no cache de consultas, que é esvaziado em todo fim de sessão, inclusive o por inatividade.
  - O texto colado e a prévia são estado do componente, e as mutações têm `gcTime: 0`.
  - Quando a sessão vence, a consulta da turma volta a pendente e desmonta o `ConteudoDaLista`, então o texto colado não fica atrás do login por cima.
  - `autoComplete="off"` nos três campos e `spellCheck={false}` no campo da lista.
  - A `key` pela turma em `apps/web/src/areas/coordenacao/rotas.tsx` impede que o texto de uma turma seja gravado em outra.
- **Endereço**: só UUID de turma e de linha da lista; o cursor da paginação é id; o título da aba leva o nome da turma, nunca o de aluno.
- **Erro**: sempre texto do catálogo pelo código, sem corpo cru.
- **Pergunta de fechamento**: continua respondida como na 2.0. O que a lista guarda é consultável por escola, ano e matrícula, e nada vai a terceiro. A rotina que junta tudo de um aluno segue no F3.

## Recomendações

1. **Cache HTTP do navegador** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/cliente.ts:81` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.controller.ts:47`.
   - O `fetch` não manda `cache: 'no-store'` e a rota da lista não responde `Cache-Control: no-store`. A API é Express com ETag padrão, então o navegador pode gravar em disco a resposta com nome e matrícula. Isso é leitura de código, não medi.
   - É a recomendação 3 da 2.0, com destino no `/retro` da A1 (`2_task.md:213`); por isso não bloqueia. A diferença é que agora a rota tem consumidor no navegador.
   - Os comentários de `apps/web/src/api/lista.ts:18-20` e `ListaDaTurma.tsx:61-62` dizem "só na memória da página", e o e2e "sem rastro" não cobre esse caminho.
   - Correção sugerida: `cache: 'no-store'` no `chamarApi` (uma linha, cobre todas as rotas), o cabeçalho nas rotas nominais, e uma asserção do cabeçalho no e2e. Fechar antes de qualquer dado real.

2. **CPF sem pontuação passa** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/previa-da-lista.ts:55-61`.
   - A trava pega só `000.000.000-00`. O Excel costuma exportar CPF como número de 11 algarismos, e o teste afirma que `12345678909` não é marcado.
   - Sugestão: marcar quando a maioria das linhas (três ou mais) tem 11 algarismos com dígitos verificadores de CPF válidos. Uma matrícula de 11 algarismos passa nessa conta uma vez em cem, e a lista inteira, praticamente nunca.

3. **Nome avulso sem a mesma trava** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:506-517`. O campo "Matrícula" do diálogo aceita CPF ou data formatados. Vale chamar o `pareceDocumento` ali também.

4. **Colunas a mais vão para a API** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts` ("Coluna a mais é ignorada").
   - Uma exportação da secretaria com nome, matrícula, nascimento, CPF e telefone é enviada inteira no corpo da prévia e da gravação. Nada disso é gravado nem logado, mas trafega.
   - Sugestão: a tela avisar quando há mais de duas colunas, ou recortar para nome e matrícula antes de enviar (o leitor iria para `packages/shared`). Levar ao `/validar`.

5. **Sessão vencida com a lista colada, sem teste** — hoje o texto e os nomes somem porque a consulta da turma volta a pendente. É efeito da estrutura do componente, e um `placeholderData` futuro o desfaz em silêncio. Vale um e2e: sessão encerrada no banco com a prévia na tela, e nenhum nome nem matrícula no DOM atrás do login.

6. **`docs/lgpd.md:70`** — a linha "Vínculo, estado e datas" pode dizer que, desde a 13.0, o vínculo `pendente` pode existir para professor com convite em aberto, que não dá acesso antes do aceite e da confirmação, e que sai na eliminação do usuário.

7. **Corretor ortográfico nos campos do avulso** — `ListaDaTurma.tsx:537-557`. O "Nome do aluno" e a "Matrícula" não têm `spellCheck={false}`, e o corretor avançado do Chrome manda o texto digitado para o Google. O campo da lista colada já tem. Vale para os campos de nome de pessoa em geral, a decidir no `Campo`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-02 00:02:12 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: "portão local: o último não rodou e2e. Rode `node tools/processo/portao-local.ts --e2e`."
Bloqueantes: nenhum
Recomendações: nove, abaixo
```

**Portão local.** Não reprovo pelo e2e ausente nesta rodada intermediária, como nas tarefas 5.0 a 12.0; o hook segue barrando o commit sem `--e2e`. O `conferir` devolve a falta de suíte antes de olhar a idade do carimbo, então conferi a idade à parte, só com leitura. O carimbo de typecheck, lint e test (início 2026-10-02T02:29:31Z) vale para o conteúdo atual. `ListaDaTurma.tsx` e `ler-arquivo-da-lista.ts` têm data de modificação de 23:44, depois do carimbo, mas o conteúdo é o mesmo do instantâneo. Não rodei nenhuma suíte; a corrida direta do Playwright que você citou eu não tenho como confirmar.

**Escopo e aderência.** As cinco subtarefas estão feitas, e não há `.skip`, `any` nem `TODO` nos arquivos novos. Cada divergência do `13_task.md` está na `techspec.md` (seções 9 e 13) e no `cenarios.md` (E1, E12, W1, W4, W10). As linhas da tabela de mutações que conferi por amostra batem com o código de agora. O que saiu do previsto está registrado: a API da alocação, o período do ano letivo no contrato e a mudança do `Dialogo` para `componentes/`.

Uma ressalva de rastro: no `HEAD`, o `13_task.md` ainda diz "Decisão pendente" sobre a alocação antes do aceite. A decisão de 27/09/2026 só aparece nos documentos desta árvore e na sua mensagem. A opção escolhida é uma das duas que a Tech Spec previa, com os dois guardiões que ela pedia, então não reprovo. O Joaquim confirma ao revisar o commit.

**Recomendações** (nenhuma bloqueia):

1. **O rascunho da lista se perde quando a sessão vence e a mesma pessoa volta.** Li no código, não executei. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:81-100`, o texto colado e a prévia moram no `SubirLista` (linha 243), que só existe enquanto a consulta da turma tem dado. O `resetQueries` do fim de sessão desmonta tudo, e o login por cima devolve o campo vazio. O mesmo vale para o que foi digitado nos diálogos da Estrutura (`Estrutura.tsx:199`). A "Turmas" do professor guarda o rascunho no componente de cima e o mantém (`e2e/inatividade.spec.ts:96`). No sentido da privacidade o comportamento atual é o seguro: outra pessoa que entra não vê a lista. Destino sugerido: `TODO.md` ou `/validar`; se subir o estado, o caso "outra pessoa" precisa de teste junto.

2. **A trava de CPF ou data vale só na lista colada.** O `podeGravar` (`previa-da-lista.ts:83`) segura a gravação, mas o nome avulso (`ListaDaTurma.tsx:506-517`) grava a mesma matrícula sem aviso, e a API aceita nos dois caminhos. O motivo declarado é a regra 20, item 2. Sugiro aplicar `pareceDocumento` no avulso, ou levar a regra ao contrato, como foi feito com o período do ano letivo. A decisão é do `privacy-guardian`.

3. **A Alocação corta a lista sem avisar.** A `techspec.md` (linhas 303-304) diz que acima de dez páginas a tela avisa. O `AvisoDeListaIncompleta` existe só para disciplinas e turmas (`Estrutura.tsx:308` e `:345`). Em `Alocacao.tsx`, vínculos e professores acima de 1.000 somem calados, e o professor some da escolha. Não acontece numa escola do recorte. Pôr o aviso ou ajustar a frase da Tech Spec.

4. **Falha de leitura do arquivo fica sem tratamento.** Em `ListaDaTurma.tsx:324` e `:403`, se o `arrayBuffer()` falhar (arquivo removido ou sem permissão), a promessa rejeita sem aviso na tela. Um `try/catch` com um aviso do tipo "não foi possível ler o arquivo" resolve.

5. **A turma nova pode reenviar a série que saiu.** Em `Estrutura.tsx:782-798`, o `serieId` não é conferido contra a lista recarregada: a escolha mostra a primeira série e o envio manda a antiga. Hoje é inalcançável, porque não há rota que exclua série; o e2e só chega lá apagando no banco e termina em "Cancelar" (`e2e/estrutura.spec.ts:527-534`). Vale a mesma conferência do `escolhido` de `Alocacao.tsx:157-161`.

6. **`aberta.alvo?.id ?? ''`** em `Estrutura.tsx:410, 428, 451, 477` e `ListaDaTurma.tsx:223`: o `?? ''` só existe para calar o compilador, e o valor de reserva seria um `DELETE /v1/turmas/`. Guardar `const alvo = aberta.alvo` dentro da guarda tira o caso.

7. **Peças repetidas ou presas à área.** A classe do `select` está escrita três vezes em `Estrutura.tsx:728, 831, 859` e uma quarta, com `w-full`, em `Alocacao.tsx:38`. `Anuncio`, `AlertaDaFalha`, `useEnvioUnico` e `textoDaFalha` estão em `areas/coordenacao/dialogos.tsx`; a operação já tem outro `textoDaFalha` em `operacao/textos.ts:50`. As tarefas 15.0 e 16.0, da área do professor, vão precisar deles: anotar nelas que se movem para `componentes/`, sem copiar.

8. **Cabeçalho do `13_task.md`** diz "Depende de: 11.0, 2.0" e "Paralelo com: 3.0 a 10.0". Com a alocação antes do aceite, a tarefa passou a depender da 3.0 (`estadoDoProfessor`, `GET /v1/professores`). Não muda nada na prática, porque a 3.0 já está commitada.

9. **Linha "sem rastro" do `13_task.md`** (linha 97) cita `localStorage`, `sessionStorage` e o endereço. O teste e a Tech Spec cobrem também IndexedDB e Cache Storage (`e2e/estrutura.spec.ts:703-710`). Alinhar o texto.

## test-engineer · 6ª rodada · APROVADO · 2026-10-02 00:40:24 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: APROVADO
```

**Cenários exigidos** (os que o lote toca; o resto não mudou desde a 5ª rodada)
- Sem rastro: a web pede a API sem cache HTTP, na leitura e na escrita.
- Período do ano letivo: o fim no mesmo dia do início é recusado, com a mesma função no contrato e na tela.
- Arquivo que o navegador não lê: sai como `ilegivel`, sem promessa rejeitada.
- Turma nova: a série que outra pessoa excluiu com o diálogo aberto sai da escolha, e o envio seguinte usa a série que a tela mostra.
- Foco na lista colada: a resposta não tira o foco de quem já voltou ao campo, e o pedido de foco é atendido uma vez só.
- Nome avulso: a matrícula que parece CPF ou data não é enviada; os dois campos ficam fora do corretor ortográfico.
- Isolamento: o controle positivo de `professorAlocavel` no contexto da escola B.

**Cobertos**

Todos. Rodei as mutações de tela eu mesmo, com a web do compose reconstruída a cada uma, nos projetos `chromebook` e `celular`:

| Mutação | Resultado |
|---|---|
| `ListaDaTurma.tsx:274` sem o consumo do pedido de foco | vermelho nos dois, em `e2e/estrutura.spec.ts:649` (`expect(acrescentar).toBeFocused()`) |
| `ListaDaTurma.tsx:278` sem a guarda inteira | vermelho nos dois, em `:869` (`expect(campo).toBeFocused()`) |
| `ListaDaTurma.tsx:278` sem `ativo === document.body` | vermelho nos dois, em `:625` e `:818` |
| `ListaDaTurma.tsx:278` sem `ativo instanceof HTMLButtonElement` | **sobreviveu** nos dois (recomendação 1) |
| `ListaDaTurma.tsx:522` sem a trava de documento | vermelho nos dois, em `:965` |
| `Estrutura.tsx:788` com `serieEscolhida = serieId` | vermelho nos dois, em `:538` |

- **Unidade:** `cliente.test.ts`, `ler-arquivo-da-lista.test.ts`, `ano-letivo.test.ts` e `previa-da-lista.test.ts` passam (34 testes). Não rodei as mutações de unidade; pela leitura, as asserções quebram sem a cláusula: `opcoes.cache`, o `Blob` cuja leitura rejeita, o fim no mesmo dia.
- **CPF e data no avulso:** a segunda volta do laço do e2e (a data) é efetiva. Se a data passasse, o pedido sairia e `expect(avulsos).toHaveLength(0)` quebraria.
- **Refatoração do `alvo`:** é equivalente ao código anterior, e as linhas tocadas (457, 483, 226) têm mutação listada.
- **Proibidos:** não há `.skip`, `.only`, `fixme` nem `any` nos testes tocados. O único mock é o do `fetch`, que é fronteira externa.
- **Estado deixado:** os dois arquivos mutados foram restaurados por cópia (md5 de `ListaDaTurma.tsx` igual ao de antes, `git status` idêntico). A web do compose foi reconstruída do código restaurado e `e2e/estrutura.spec.ts` inteiro passou depois disso (20 verdes). Apaguei o `test-results/` na raiz (os traces das execuções vermelhas das mutações; não aparece no `git status`).

**Bloqueantes:** nenhum.

**Recomendações**

1. **Só documento** — `tasks/prd-apresentacao-escola/13_task.md`, seção "Mutações". Falta declarar o sobrevivente `|| ativo instanceof HTMLButtonElement` de `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:278`. No Chromium o botão desligado durante o pedido solta o foco para o `body`, então quem prova a guarda é o `body`. É da mesma classe do `focoInicial` que já aceitei: cláusula para o navegador que mantém o foco no botão. A cláusula vale para qualquer botão, não só "o botão que fez o pedido" como diz o comentário; se isso é o desejado, é assunto do `frontend-reviewer`.
2. **Só documento** — `TODO.md:541-543`. O item diz que a resposta com o foco já de volta no campo "ainda o leva para o título da prévia". O lote corrigiu isso; sobra só a parte do `role="alert"` lido de novo.
3. **Só documento** — `13_task.md:99` e `:102`, tabela de testes. A linha "o que a tela segura" não cita o avulso com matrícula que parece CPF ou data. A linha "foco na lista colada" não cita a resposta que chega com o foco já no campo nem o abrir e cancelar do diálogo que hoje prova o "uma vez só". O `cenarios.md` já diz os dois.
4. **Só teste, opcional** — o texto do motivo `ilegivel` (`ListaDaTurma.tsx:48`) não é asseverado em teste nenhum. A cadeia está provada por partes: a unidade devolve `ilegivel`, o `Record` tipado obriga o texto, e a linha 338 tem mutação pelos avisos da planilha e do teto.

Nenhuma das quatro toca código de produção: aplicar 1 a 3 não caduca ninguém, e a 4 só mexe em teste.

## frontend-reviewer · 4ª rodada · APROVADO · 2026-10-02 00:46:09 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: APROVADO
Estados: ok
Acessibilidade: ok
Chromebook fraco: ok
Celular: ok
Ação oficial protegida: sim
Bloqueantes: nenhum
Recomendações: três, nenhuma pede lote de código agora (abaixo)
```

Auditei só o diff desde a 3ª rodada e o que ele afeta. Além de ler o código, rodei um roteiro avulso no navegador contra o compose de teste, nos projetos `chromebook` e `celular`; os dois passaram.

## As recomendações da 3ª rodada

1. **Foco que não sai do campo: feita.** O efeito em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:275-278` consome o pedido uma vez e só leva o foco do `body` ou de um botão.
2. **Alerta lido de novo: não aplicada, registrada no `TODO.md`.** Aceito; só se decide com leitor de tela.
3. **Período em dois lugares: feita.** `fimDepoisDoInicio` é usada pelo contrato e por `Estrutura.tsx:646`, com o mesmo texto de erro.

## A pergunta do `test-engineer`: "qualquer botão" é o desejado?

Sim, pode ficar. O que observei no navegador, nos dois projetos:

| Onde o foco estava quando a resposta chegou | Para onde foi |
|---|---|
| `body` (o botão desligado durante o pedido) | título "Prévia" |
| "Acrescentar um nome" (um Tab durante a espera cai nele) | título "Prévia" |
| link "Voltar para Estrutura" | ficou no link |
| campo "Lista colada" | ficou no campo |
| "Cancelar" do diálogo do avulso aberto | ficou no diálogo; ao cancelar, voltou ao botão que abriu |

- **Não se perde nada:** quem está num botão não está digitando.
- **O destino é inofensivo:** título ou alerta, nunca um controle, então um Enter que chegue junto não aciona nada.
- **É o anúncio para o leitor de tela:** foi a pessoa que pediu a prévia, e o foco no título é como ela fica sabendo que chegou.
- **O diálogo modal está protegido:** o resto da página fica inerte, e o pedido não fica guardado para depois.

## O resto do lote

- **`cache: 'no-store'` em `cliente.ts:87`:** nada muda na tela. Na rota que conferi (`/v1/sistema/avisos`) a API já responde `cache-control: no-store`, então ali não havia 304 a perder.
- **Matrícula que parece CPF ou data no avulso (`ListaDaTurma.tsx:522`):** a 360 px o diálogo não transborda com o erro comprido, o campo fica `aria-invalid` com o erro no `aria-describedby`, o foco vai para ele e o axe não acusa nada grave. `spellcheck="false"` nos dois campos.
- **Arquivo ilegível:** o aviso diz o que fazer e usa o `AlertaDaFalha`, que leva o foco; a escolha já foi limpa, então "escolha o arquivo de novo" funciona.
- **Série que sai da escolha na turma nova (`Estrutura.tsx:788`):** o envio manda o que o `select` mostra. Sem nenhuma série, o diálogo cai em "Crie a série primeiro" com só "Fechar", sem clique mudo.
- **`alvo` da abertura nos diálogos de renomear, excluir e retirar:** sem mudança de comportamento.

## Recomendações

1. **Só de teste, opcional.** O sobrevivente `|| ativo instanceof HTMLButtonElement` (`ListaDaTurma.tsx:278`) morre no Chromium com um Tab. Com a prévia segurada, um `Tab` depois de "Ver a prévia" cai em "Acrescentar um nome"; solta a resposta e o foco tem de estar no título "Prévia". Sem a cláusula, ficaria no botão. Isso fixa em teste a decisão acima.
2. **Só de documento.** A trava de documento não tem saída para falso positivo. No avulso, `2026-02-01` e `1/2/26` são recusados e `123/2026` passa. A escola cuja matrícula tenha forma de data não consegue gravar, nem pela lista nem pelo avulso, e o texto não diz o que fazer nesse caso. Cabe uma linha no item "A lista de nomes colada pela coordenação" do `TODO.md`, para o `/validar` e as entrevistas do piloto.
3. **De código, sem lote novo.** O comentário em `ListaDaTurma.tsx:275-276` diz "o botão", e a guarda vale para qualquer botão. Acertar quando o arquivo for tocado por outro motivo; não vale caducar revisores por isso.

## Efeitos do que rodei

- Não editei nenhum arquivo do repositório nem rodei o portão.
- O roteiro avulso criou duas escolas sintéticas no banco de teste, como qualquer e2e. Os arquivos dele estão em `/tmp/claude-1000/-home-joaquimdp-Documentos-git-Educa-ia/fa2a73f2-5fbc-4a24-bbc9-de2f33ddba00/scratchpad/auditoria-fr4/`.
- Uma primeira tentativa com sintaxe de shell errada rodou `npx playwright` fora do repositório e baixou o pacote `playwright@1.63.0` para o cache do npx em `~/.npm/_npx`. Nada no repositório foi tocado.

## test-engineer · 7ª rodada · APROVADO · 2026-10-02 01:07:21 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: APROVADO
Cenários exigidos: a resposta da prévia que chega com o foco num botão (um Tab durante a espera) leva o foco ao título "Prévia"; a que chega com o foco no campo o deixa lá; a que chega com o foco no `body` leva ao título ou ao alerta; a resposta atrasada não guarda foco para depois.
Cobertos: todos, nos projetos `chromebook` e `celular`.
Bloqueantes: nenhum
Recomendações: duas, abaixo (uma só de documento, uma só de teste)
```

Auditei só o diff desde a 6ª rodada e o que ele afeta. O teste novo prova a cláusula do botão: rodei a mutação eu mesmo e ela ficou vermelha nos dois projetos.

## O teste novo falharia sem a regra?

Sim. O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/estrutura.spec.ts:874-884`.

- **Base:** "a lista paginada…" passou nos dois projetos antes da mutação.
- **Mutação da cláusula do botão:** tirei `|| ativo instanceof HTMLButtonElement` de `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:279`, reconstruí a web e copiei para o contêiner. Ficou vermelho nos dois projetos, exatamente em `estrutura.spec.ts:884` (`toBeFocused` no título "Prévia": `Received: inactive`).
- **Mutação do `body`:** não rodei. Na corrida mutada o teste passou pela linha 818 (alerta com foco) sem a cláusula do botão, então ali o foco vinha do `body`; sem a cláusula do `body`, essa linha cai.
- **Depois de restaurar:** verde de novo nos dois projetos.

O teste não passa por acaso:

- **Asserção sobre o resultado:** a linha 881 confirma que o Tab caiu em "Acrescentar um nome" antes de soltar a resposta. Se o Tab cair em outro lugar, o teste falha ali, em vez de passar sem exercitar o botão.
- **Resposta realmente segurada:** o portão é trocado na linha 876, antes do pedido, e a rota da linha 858 só sai na 897.
- **Bloco seguinte intacto:** "Resposta atrasada" (886-903) continua valendo; o `campo.fill` devolve o foco ao campo antes do pedido.
- **Sem atalhos:** nenhum `.skip`, `.only` ou teste comentado no arquivo, e nenhum mock esconde a regra (a rota só atrasa a resposta real da API).

## As quatro recomendações da 6ª rodada

1. **Sobrevivente do botão: feita.** O teste está lá, o comentário em `ListaDaTurma.tsx:275-277` diz "de um botão qualquer", e as duas linhas estão em "Mutações" (`13_task.md:447-448`; a seção tem 212 linhas, como informado).
2. **`TODO.md`: feita.** O item do foco não diz mais que a resposta tira o foco do campo.
3. **Tabela "Testes que provam a regra": feita.** `13_task.md:95` cita o avulso com matrícula que parece CPF ou data, e `13_task.md:102` cita o foco no campo, o foco num botão e o abrir e cancelar do diálogo.
4. **Texto do `ilegivel`: não aplicada, com motivo registrado** em `13_task.md:470`. Aceito.

## Recomendações

1. **Só de documento.** `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/13_task.md:203-204` ainda diz "só é levado de onde o pedido o deixou (o botão ou o `body`)". O código e o comentário passaram a dizer "do `body` ou de um botão qualquer". Acertar a frase não caduca ninguém.
2. **Só de teste, para o `/validar`, não para agora.** O comentário em `ListaDaTurma.tsx:277` afirma que quem está num link continua onde está, e isso só foi visto no roteiro manual do `frontend-reviewer` (4ª rodada). Não há cláusula de código a matar — é a ausência do link na guarda —, e não vale caducar a rodada de novo por isso.

## Efeitos do que rodei

- **Arquivos do repositório:** nenhum editado de forma permanente. `ListaDaTurma.tsx` foi mutado e restaurado por cópia com `cp -p`: mesmo sha256 e mesmo horário de modificação (00:49:36). O `git status --short` tem as mesmas 62 linhas.
- **Web do compose de teste:** reconstruída mutada e depois de volta. O `dist` do contêiner `educa-teste-web-1` tem o mesmo hash de antes; apaguei de lá os seis arquivos de `assets/` que a build mutada deixou.
- **Banco de teste:** as três corridas do Playwright criaram escolas sintéticas, como qualquer e2e.
- **Portão:** não rodei `tools/processo/portao-local.ts`.
- **Cópias de segurança:** em `/tmp/claude-1000/-home-joaquimdp-Documentos-git-Educa-ia/fa2a73f2-5fbc-4a24-bbc9-de2f33ddba00/scratchpad/te7/`.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-02 01:09:27 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum novo. O lote só mexe no trânsito e na exibição de nome e matrícula da lista (já mapeados) e no texto da linha "Vínculo, estado e datas" do docs/lgpd.md.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: ok (o lote não muda rota nem guarda; em vinculo.service.ts entrou só um comentário).
Logs: limpos (nenhum log novo na API nem na web; o catch do arquivo ilegível não registra nada).
Auditoria: presente (sem mudança; a leitura da lista segue com a finalidade).
Envio externo: nenhum.
Seed/fixture: sintético (os valores novos do e2e são "123.456.789-09", "01/02/2012" e nomes com marca aleatória).
Bloqueantes: nenhum
Recomendações: uma, de código, abaixo.
```

## As sete recomendações da 1ª rodada

1. **Cache HTTP — aplicada.** `cache: 'no-store'` está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/cliente.ts:87`, e esse é o único `fetch` de `apps/web/src`, então nenhuma chamada escapa. O teste de unidade cobre leitura e escrita. O cabeçalho da API ficou no `TODO.md`, o que basta enquanto o dado é sintético.
2. **CPF sem pontuação — não aplicada**, registrada no `TODO.md` ("LGPD e conformidade") para antes de qualquer dado real. Aceito.
3. **Nome avulso — aplicada.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:523` usa o mesmo `pareceDocumento` da prévia. O texto do erro é fixo e não repete o valor digitado, e o e2e conta zero pedidos nas duas formas.
4. **Colunas a mais — não aplicada**, registrada no `TODO.md`. Aceito.
5. **Sessão vencida com a lista colada — não aplicada**, registrada no `TODO.md` com o e2e do caso "outra pessoa". Aceito: o comportamento de hoje é o seguro.
6. **`docs/lgpd.md`, linha do vínculo — aplicada**, e as duas afirmações batem com o código:
   - "sai na eliminação do usuário": `apps/api/src/sessao/ciclo-de-vida.repository.ts:89-91` apaga os vínculos do usuário, em qualquer estado, com escopo de escola.
   - "não dá acesso antes do aceite e da confirmação": `apps/api/src/estrutura/turma.repository.ts:219, 233, 255` só abre a turma com vínculo `confirmado`.
7. **Corretor ortográfico — aplicada** nos dois campos do avulso (`ListaDaTurma.tsx:555` e `:567`), com e2e pelo atributo.

## O resto do lote

- **Arquivo ilegível** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:40-47`): o catch devolve só o motivo e o aviso é texto fixo. Nada do conteúdo nem do nome do arquivo vai a log, storage ou rede.
- **Foco da prévia, série que sai da escolha, `fimDepoisDoInicio`, `alvo` sem valor de reserva**: sem efeito sobre dado pessoal.
- **Testes de API alterados**: só um comentário e uma asserção de isolamento a mais.

## Pergunta de fechamento

Nada muda desde a 1ª rodada: o lote não cria dado, destino nem envio.

## Recomendação (de código)

A trava de CPF e data existe só na web, na prévia e agora no avulso. `POST /v1/turmas/:id/lista/nome` e a gravação da lista ainda aceitam matrícula com essa forma de qualquer outro cliente. Quando o item do falso positivo do `TODO.md` for decidido, levar `pareceDocumento` para `packages/shared` e recusar no contrato da API junto. Não antes, porque hoje não há saída para a escola cuja matrícula tem forma de data. Cabe no mesmo item do `TODO.md`, para o `/validar` da A1.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-02 01:12:00 · `tasks/prd-apresentacao-escola/13_task.md`

```
VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: "portão local: o último não rodou e2e. Rode `node tools/processo/portao-local.ts --e2e`."
Bloqueantes: nenhum
Recomendações: três, todas só de documento (abaixo)
```

**Portão local.** O carimbo (`typecheck`, `lint`, `test`) começou às 00:49:51, depois da última alteração de código (`ListaDaTurma.tsx`, 00:49:36); conferi pela hora dos arquivos, porque o `conferir` para na suíte que falta. Falta o `--e2e`, que a tarefa exige por ter `frontend-reviewer`. Não contei como bloqueante porque você informou que o Joaquim decidiu rodar `--e2e` só no portão final. Não achei essa decisão escrita no repositório (`executar-task/SKILL.md`, `docs/decisoes.md`, `13_task.md`). O hook segue bloqueando o commit sem esse carimbo. Os 60 e2e verdes rodados direto pelo Playwright eu não reexecutei.

**O que auditei no diff.** Não achei bug nem invasão de escopo em nenhum destes pontos:
- **`serieEscolhida`** (`Estrutura.tsx:788`): o `select` e o envio usam o mesmo valor derivado.
- **`alvo`** (`Estrutura.tsx:185`, `ListaDaTurma.tsx:130`): a guarda `alvo !== undefined` cobre todas as closures, sem valor de reserva.
- **Guarda do foco** (`ListaDaTurma.tsx:278-279`): o pedido é consumido mesmo quando o foco não é levado. Com um diálogo aberto, o `showModal` nativo deixa o resto inerte, então o `focus()` não tira o foco de dentro dele.
- **`lerArquivoDaLista`** (`ler-arquivo-da-lista.ts:40-47`): o `await` está dentro do `try`, e o teste cai se o `catch` sair.
- **`cache: 'no-store'`** (`cliente.ts:87`): é o único `fetch` da web, e nenhuma rota da API dependia do cache do navegador.
- **`fimDepoisDoInicio`**: contrato e tela usam a mesma função, exportada no `index.ts`.
- **Comentário da guarda** (`vinculo.service.ts:87-88`): confere com `PAPEIS_DE_VINCULO_PELA_COORDENACAO = ['professor']`.

**Correções da 1ª rodada.** Não havia exigidas. Das nove recomendações, as seis aplicadas estão no código ou no documento (2, 4, 5, 6, 8 e 9). As três não aplicadas têm destino escrito: 1 e 3 no `TODO.md` (3 também na seção 9 da Tech Spec) e 7 no `15_task.md` e no `16_task.md`. As linhas novas de "Mutações" batem com o código de agora. As divergências do lote estão na `techspec.md` (seção 9); o `cenarios.md` só tem parte delas (recomendação 2).

**Recomendações (só de documento):**

1. `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/13_task.md:214-215` — a divergência "Sem rastro" ainda diz que o e2e confere só `localStorage`, `sessionStorage` e o endereço, "e não em teste de unidade". A linha 97, a Tech Spec e o e2e (`e2e/estrutura.spec.ts:715-721`) já cobrem IndexedDB e Cache Storage, e o pedido sem cache é provado na unidade (`cliente.test.ts`). Alinhar o texto.

2. `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md:458-465` (W10) e a linha "Estrutura" do W4 — do lote, só entraram o avulso com CPF ou data e o foco. Faltam três que hoje estão só na Tech Spec e na tabela do `13_task.md`: o pedido sem cache HTTP, o arquivo `ilegivel` e a série que saiu da escolha da turma nova.

3. `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md:57-71` — o item não diz que a trava de CPF ou data existe só na tela. Nem `packages/shared/src/estrutura/lista.ts` nem `apps/api/src/estrutura/` têm a verificação, então a API aceita o que a tela recusa, na lista e no avulso. O comentário em `ListaDaTurma.tsx:51` ("a mesma trava da lista colada (regra 20, item 2)") dá a entender que é regra do sistema. Acrescentar ao item, para o `/validar`: decidir se ela vai para o contrato (regra 00, item 1), junto com a saída para o falso positivo, que no servidor pesa mais.

# Achados das revisões — `tasks/prd-apresentacao-escola/15_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-02 17:17:46 · `tasks/prd-apresentacao-escola/15_task.md`

```
VEREDITO: REPROVADO

Cenários exigidos:
- E16 (texto do WhatsApp só com escola e link, sentinela)
- W7 (código em dois grupos; "Gerar novo" confirma e diz o que cai; fechar sem copiar pergunta; sem WhatsApp, copia)
- W4 de Acesso (quatro estados; só o cartão do vínculo confirmado abre a turma; erro no lugar do estado de antes; turma indisponível igual para pendente, encerrada e inexistente)
- W12 de Acesso (360 px sem rolagem horizontal, alvos de 44 px, teclado e foco)
- link e código fora do cache; clique duplo; recomeço da tela (segunda pessoa, mesma entrada, resposta atrasada, falha com o diálogo aberto)
- sessão vencida com o acesso na tela; releitura que cai com o código projetado; outra turma é outra tela
- revogar do acesso que já caiu; validade 1, 7 e 30; contrato da resposta; teto do chunk
- permissão (vínculo pendente ou encerrado não alcança) e isolamento (professor de outra escola pelo endereço)

Cobertos:
- E16, W7, clique duplo (dois cliques no mesmo instante, um pedido, contagem no banco), resposta atrasada, CONFLITO e NAO_ENCONTRADO no diálogo, vínculo encerrado com a tela aberta, sessão vencida, releitura com o código projetado, outra turma, link fora do cache, validade, contrato e teto do chunk: as asserções são sobre resultado.
- Permissão e isolamento: pendente, encerrada, inexistente e a turma de outra escola respondem o mesmo texto, sem nome da turma.
- Sem `.skip`, `.only` nem `any`; o `wa.me` é interceptado; os 503 e o CONFLITO interceptados não escondem a regra (o CONFLITO real é o C5 da 4.0).
- Conferi três linhas da tabela "Mutações" na unidade, e as três reprovam como declarado: `gcTime: 0` em `api/acesso.ts:49`, `opener = null` em `texto-do-whatsapp.ts:39`, e `NAO_ENCONTRADO` fora do `secaoMudou` em `acesso-da-turma.ts:80`. Não refiz as mutações de e2e da tabela.
- Arquivos restaurados e conferidos por sha256; `git status` igual ao do início.

Bloqueantes:
1. /home/joaquimdp/Documentos/git/Educa.ia/e2e/acesso-da-turma.spec.ts:593-595 — o W12 não prova os 360 px com nome comprido.
   - O comentário diz "O nome comprido, sem espaço, para provar que nada estica a tela", mas a fixture cria `7ºA sintética <8 hex>`, com espaços. Nenhum teste do spec usa nome sem espaço.
   - A cláusula que segura a regra é o `break-words` do `<h1>` em /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turma.tsx:61. Ela não tem linha em "Mutações" e pode sair sem nenhum teste ficar vermelho.
   - Medi com uma sonda temporária (já removida), projeto `celular`, turma com 40 caracteres sem espaço (`TAMANHO_MAXIMO_NOME_TURMA`): como está, excedente 0; com o `overflow-wrap` do `h1` neutralizado, excedente de 207 px.
   - Correção exigida: o W12 abre uma turma com nome de 40 caracteres sem espaço, como `e2e/estrutura.spec.ts:1238-1239` faz com 29, e mantém `larguraExcedente` em 0 na página, na seção com acesso e nos diálogos. Acrescentar a linha de `Turma.tsx:61` em "Mutações".

2. /home/joaquimdp/Documentos/git/Educa.ia/e2e/acesso-da-turma.spec.ts:278-287 — o vínculo contestado não tem teste.
   - O `cenarios.md` (W4, linha "Acesso") afirma que "o pendente, o contestado e o encerrado não têm o link". O teste só monta pendente (dois) e encerrado.
   - Trocar `vinculo.estado === 'confirmado'` por "confirmado ou contestado" em /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turmas.tsx:136 passa por todas as asserções (por leitura; não rodei).
   - Correção exigida: um vínculo contestado no cenário do W4, sem link "Abrir a turma" no cartão dele.

Recomendações:
- spec:366-371: o comentário diz "erro com o acesso já lido", mas o `page.reload()` esvazia o cache, então é uma primeira leitura que falha. O caso com dado no cache já está provado em 329-346 e em 1047; ajustar o comentário ou trocar o reload por uma releitura sem recarregar.
- spec:988-1023 ("segunda pessoa"): o comentário diz "outro professor da mesma escola", mas `criarEquipeComSenha()` cria outra escola. Serve como isolamento, mas a turma do segundo tem outra chave de cache e a visita à turma do primeiro usa `page.goto`, que recarrega. Chegar à turma do primeiro sem recarregar (o `history.pushState` da linha 967) exercitaria o cache desta tela.
- Professor com duas disciplinas confirmadas na mesma turma: são dois cartões com o mesmo link "Abrir a turma <nome>". Nenhum teste monta esse caso.
- Queda de conexão de verdade no gerar (`rota.abort()`), além do 503: o texto tem unidade, a tela não.
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/AcessoDaTurma.tsx:247-249 (o `role="status"` "Gerando o acesso…") e o `wrap-anywhere` da linha 311 não têm asserção. Na sonda, o endereço com o slug da fixture não transbordou sem ele; um slug longo sem hífen mostraria se a classe é necessária.
```

## test-engineer · 2ª rodada · APROVADO · 2026-10-02 17:33:53 · `tasks/prd-apresentacao-escola/15_task.md`

```
VEREDITO: APROVADO

Cenários exigidos (2ª rodada: as duas correções da 1ª e o que o diff afeta):
- Correção 1 — W12 com nome de turma de 40 caracteres sem espaço: `larguraExcedente` em 0 na página, na seção com acesso e nos diálogos; linha de `Turma.tsx:61` em "Mutações".
- Correção 2 — W4 com um vínculo contestado, sem link "Abrir a turma" no cartão dele.
- Sem regressão nos outros testes do spec, que usam as fixtures alteradas.

Cobertos:
- Correção 1, feita.
  - /home/joaquimdp/Documentos/git/Educa.ia/e2e/acesso-da-turma.spec.ts:599-600 cria a turma com `T` + 31 `a` + 8 hex e afirma os 40 caracteres.
  - O excedente é medido na página (607), nos diálogos (`conferirDialogo` em 614, 638, 671, 680, 705), na seção com acesso (663) e depois de revogar (713).
  - Mutação refeita por mim: sem o `break-words` em /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turma.tsx:61, o W12 fica vermelho na linha 607 nos dois projetos (excedente de 122 px no `chromebook` e 131 px no `celular`).
- Correção 2, feita.
  - spec:261 contesta o vínculo de História pela nova `contestarVinculosNoBanco` (/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts:686), com escopo por `escola_id`.
  - spec:285-287 afirma "Contestado por você" no cartão de História, "Aguardando a sua confirmação" no pendente e nenhum link no grupo "Confirme suas turmas". A contagem de dois cartões na 284 garante que a lista já carregou antes da asserção de zero links.
  - Mutação refeita por mim: com "confirmado ou contestado" em /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turmas.tsx:136, o W4 fica vermelho na linha 287 nos dois projetos (1 link recebido, 0 esperado).
- As duas linhas novas de "Mutações" em /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/15_task.md batem com o que rodei: mesmo teste e mesma asserção.
- Clique duplo: spec:744 afirma o `role="status"` "Gerando o acesso…" com o pedido no ar, que era recomendação da 1ª rodada.
- Sem regressão: com os fontes restaurados e a web reconstruída, o spec inteiro passou, 18 de 18 nos dois projetos. O quarto parâmetro de `criarAlocacaoDoProfessor` é opcional, então os outros chamadores não mudam.
- Sem `.skip`, `.only`, `.fixme` nem `any` no spec e na fixture. Nenhum mock novo.
- Repositório como estava: `Turma.tsx` e `Turmas.tsx` restaurados e conferidos por sha256, `git status` idêntico ao do início, e a web do compose de teste reconstruída com o fonte original.

Bloqueantes: nenhum

Recomendações:
- As quatro da 1ª rodada que não foram aplicadas estão em "Recomendações sem aplicar" do `15_task.md`, com destino no `/validar`. Mantenho as quatro como recomendação.
- spec:285: o filtro `hasText: 'História'` acha o cartão pela disciplina. Serve hoje porque só há um vínculo de História no cenário; filtrar também por `turma.turmaNome` deixaria a asserção presa à turma certa se o cenário crescer.
- O W12 passa pela lista de Turmas a 360 px com o nome de 40 caracteres (o `break-words` do cartão, /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turmas.tsx:100, que é de tarefa anterior), mas não mede o excedente ali. Um `larguraExcedente` antes de abrir a turma cobriria de graça.
```

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-02 17:38:14 · `tasks/prd-apresentacao-escola/15_task.md`

```
VEREDITO: APROVADO
Estados: ok
Acessibilidade: ok
Chromebook fraco: ok
Celular: ok
Ação oficial protegida: sim
Bloqueantes: nenhum
Recomendações: 5, listadas abaixo
```

Além de ler o código e o e2e, rodei duas sondas próprias fora do repositório, contra o `educa-teste`, nos projetos `chromebook` e `celular` (este também a 360 × 640 e em paisagem 640 × 360). Nenhum arquivo do projeto foi tocado: o `git status` continua com as mesmas 35 linhas. As sondas criaram três escolas sintéticas a mais no banco de teste.

**Estados.** A página (`Turma.tsx`) e a seção (`AcessoDaTurma.tsx`) têm os quatro.
- **Vazio:** "Sem acesso ativo" convida, com um único "Gerar acesso".
- **Erro:** a releitura que falha mostra o erro com "Tentar de novo", e não o estado de antes.
- **Turma indisponível:** uma resposta só, com a quem recorrer e sem "Tentar de novo".

**Acessibilidade.**
- **Foco:** começa no texto que diz o que acontece, não no botão que confirma; fica preso no diálogo e volta a quem abriu, ou ao título da seção.
- **Teclado:** o rádio mostra o contorno de 2 px ao receber o Tab.
- **Rótulos e hierarquia:** `fieldset` com `legend`, campo do link com `label`, títulos em h1, h2 e h3.
- **Cor:** "Revogar" é `perigo` em texto, e o cheio só aparece dentro da confirmação.
- **axe:** limpo nas asserções do e2e.

**Chromebook fraco.** Os dois projetos rodam com CPU ×4 e rede lenta. A tela não tem lista longa nem imagem. Estado de carregamento é texto, sem animação. O chunk `professor-*` tem teto de 10 kB e o primeiro carregamento está em 126,2 de 150 kB.

**Celular.** Sem rolagem horizontal a 360 px, na página e nos diálogos. O código de 36 px cabe numa linha (280 px de 280). Todos os botões medem 44 px de altura, e os rádios de 24 px ficam em linhas de 44 px. Nada depende de hover, e nenhum fluxo exige o telefone: sem a aba do WhatsApp o botão copia o texto, e sem área de transferência seleciona o link.

**Ação oficial.** "Gerar novo" diz antes o que cai (também o acesso de outro professor) e o que destrava. Revogar confirma com o efeito por extenso. Fechar sem copiar pergunta, com os dois botões do mesmo tamanho. O clique duplo manda um pedido só.

**Português e erros.** Data no formato local ("Vale até 09/10/2026, 17:35"). Nenhum texto mostra código ou status HTTP, e todos dizem o que fazer.

**Recomendações** (para o `/validar` e o `/retro`):

1. **O código fica refém da releitura.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/acesso.ts:50`, o `onSettled` espera a releitura antes de a mutação terminar. Na sonda, com o `POST` já respondido e o acesso vigente no banco, segurei o `GET` por 15 s: o diálogo ficou em "Gerando…" esse tempo todo, sem código. O cliente não tem tempo limite, então numa rede que engasga isso dura o que o navegador deixar. No "Gerar novo" o código antigo já caiu, e a pergunta de fechar diz "O acesso ainda está sendo gerado", o que já não é verdade. Não perde nada irrecuperável (basta gerar outro), e a releitura que falha rápido está coberta pelo W4. Sugiro mostrar o acesso assim que o `POST` responde e deixar a seção recarregar por trás.

2. **"Neste computador" aparece no celular.** Os textos em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/AcessoDaTurma.tsx:256-258` dizem "Não foi possível abrir o WhatsApp neste computador". "Aqui" ou "neste aparelho" serve aos dois. O mesmo aviso de falha sai em verde (`text-ok`) porque conta como copiado.

3. **Celular baixo (360 × 640).** No "Gerar novo acesso" o "Cancelar" fica cortado abaixo da dobra do diálogo. Na etapa do acesso, os três botões ficam fora da primeira tela (diálogo de 600 px com 740 de conteúdo). Rola e funciona; a 800 px cabe. Encurtar o texto de `TEXTO_DO_ACESSO_UMA_VEZ` ou pôr os rádios em linha resolveria.

4. **O código para o leitor de tela.** Em `AcessoDaTurma.tsx:307`, o `aria-labelledby` está num `<p>`, papel em que a ARIA proíbe nome; o axe não acusa como grave, mas o leitor costuma ignorar. E "BTZX 6X94" tende a ser lido como palavra. Um `aria-label` soletrado, ou letras separadas em texto só para leitor, ajudaria.

5. **Rádio com o azul do navegador.** A validade usa a cor padrão do navegador, fora das três cores da D72. É o mesmo padrão dos rádios da contestação em `Turmas.tsx`; um `accent-color` resolve os dois.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-02 17:40:47 · `tasks/prd-apresentacao-escola/15_task.md`

```
VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A tarefa é só de web. O que ela manuseia:
  - token do link da sala e código da turma (capacidade que abre a lista de nomes livres de menores, sem matrícula);
  - nome e série da turma (GET /v1/turmas/:id, já existente);
  - nome e slug da escola (/v1/eu).
  Nenhum dado proibido de aluno; nome de aluno não passa por esta tela.

Fora da tabela de dados do docs/lgpd.md: nada. A linha "Acesso da turma" já existia (4.0) e foi atualizada nesta
  tarefa com o comportamento da tela e do WhatsApp; finalidade e retenção seguem preenchidas.

Autorização por objeto: ok.
  - Quem decide é a API; a tela não manda escola nem ano (apps/web/src/api/acesso.ts:12, só turma no caminho e validade no corpo).
  - Turma pendente, encerrada, inexistente e de outra escola dão o mesmo texto, sem nome de turma e sem a seção
    (Turma.tsx:46, AcessoDaTurma.tsx:81; e2e/acesso-da-turma.spec.ts:1023-1029 e o W4).
  - Só o cartão do vínculo confirmado oferece o link (Turmas.tsx:136).
  - Não coberto: outro professor da MESMA escola chegando à turma pelo endereço (ver recomendações).

Logs: limpos. Nenhum console, telemetria ou armazenamento novo em apps/web/src; o único localStorage é a lateral
  recolhida, que já existia. O e2e vigia console, URLs pedidas, navegações, localStorage, sessionStorage,
  history.state, IndexedDB, Cache Storage e o HTML da página (spec:218-248).

Auditoria: presente onde a regra exige, sem mudança nesta tarefa. Gerar e revogar são auditados na API (4.0,
  `acesso_turma.gerado`, só ids e validade). A tela não lê dado de aluno nem exporta.

Envio externo: nenhum pelo nosso servidor, nenhum a provedor de IA.
  - O quê: nome da escola + link da sala (com o token). Nome de aluno, matrícula, turma e código não entram:
    textoDoWhatsApp só recebe escola e link (texto-do-whatsapp.ts:17), com sentinela na unidade e no e2e (spec:517).
  - Para onde: wa.me (Meta), pelo navegador do professor, só no clique em "Compartilhar pelo WhatsApp".
  - Aba nova sem opener (texto-do-whatsapp.ts:39; e2e spec:518).
  - Registrado: descrito em docs/lgpd.md (linha "Acesso da turma") e dito na tela antes de mandar
    (TEXTO_DE_QUEM_VE_A_LISTA, acesso-da-turma.ts:37). Não há ExecucaoAgente porque não é envio de IA.

Seed/fixture: sintético. Nomes com marca aleatória ("Aluna da lista <uuid>", "7ºA sintética <marca>"), matrículas
  geradas, token e código sorteados em gerarAcessoNoBanco; nada real em e2e/__fixtures__/sessao.ts nem nos testes de unidade.

Bloqueantes: nenhum.

Recomendações:
  1. docs/lgpd.md, linha "Acesso da turma": a frase "fora de URL e de armazenamento do navegador" vale para a nossa
     tela, mas o botão do WhatsApp põe o link inteiro, com o token, na consulta do endereço wa.me. Duas consequências
     que a linha não diz:
       (a) o link chega ao servidor da Meta já no clique, no endereço, e não só como mensagem cifrada;
       (b) o endereço wa.me com o token fica no histórico do navegador do professor (e na sincronização do perfil),
           enquanto o acesso valer (até 30 dias).
     O `semRastro` do e2e não vê isso porque vigia só a aba da tela, não a aba nova. Não reprovo: o `wa.me/?text=` é
     decisão da Tech Spec (RF9, P27), o link é de uso múltiplo por desenho, o código é projetado para a sala e "Gerar
     novo" o derruba. Mas o projeto trata histórico de computador de escola como vetor (Convite.tsx tira o token da
     barra por isso), então a linha deveria dizer as duas coisas. Vale avaliar no /validar se a tela também avisa em
     computador compartilhado.
  2. Teste do outro professor da MESMA escola (vínculo confirmado em outra turma) abrindo esta turma pelo endereço:
     hoje a tela só é provada com outra escola, pendente, encerrado e inexistente. A regra é da API (4.0), mas é o
     "troque o id na URL" mais provável. Já anotado pelo test-engineer para o /validar; reforço.
  3. A aba do wa.me recebe como referência só a origem da web (política padrão do navegador; a web não declara
     Referrer-Policy). Não é dado pessoal. Se a borda ganhar cabeçalhos de segurança, `no-referrer` ou `same-origin`
     fecha isso sem mexer no `window.open`.
  4. TEXTO_DE_QUEM_VE_A_LISTA diz "mande só para a turma". No /retro, considerar dizer também que "Gerar novo"
     invalida o link que circulou onde não devia: é a revogação que a regra 20, item 8, pede, e a professora só a
     descobre na seção.
```

**O que conferi sobre o token e o código na tela** (não rodei os testes; li o código e os testes, e o portão veio carimbado):

- **Onde vivem:** só na mutação do diálogo. O `gcTime: 0` está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/acesso.ts:49` e é forçado de novo em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/dialogos.tsx:28`; o `reset()` do fechar vem de `useFechamento` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/copia-unica.tsx:31`.
- **Fora do cache:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/acesso.test.ts` cobre os três caminhos (fechar com `reset`, desmontar sem `reset`, resposta que chega depois de fechar) e afirma antes que os dois estavam no cache com o diálogo aberto.
- **Leitura não os traz:** o contrato é `strictObject` só com `expiraEm`; uma resposta com `codigo` a mais é rejeitada (teste na linha 82).
- **Sessão que vence:** `encerrarLocalmente` chama `resetQueries`, a turma e o `/v1/eu` ficam sem dado, `Turma.tsx:38` deixa de desenhar a seção e o diálogo sai. Nem `consultaTurmaAberta` nem `consultaEu` usam `placeholderData`, então o dado anterior não segura a tela. Provado no e2e (spec:1062-1103).
- **Troca de turma no endereço:** a `key` da rota (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/rotas.tsx:20`) e a chave da leitura por turma; provado no e2e (spec:971-978).
- **Link:** token só no fragmento (`caminhos.ts`, teste de unidade do link da sala); o endereço que aparece junto do código não leva token (`AcessoDaTurma.tsx:311`).

**Pergunta de fechamento:** a tarefa não cria dado sobre aluno nem envio pelo sistema, então não muda o que o código responde sobre "o que guardamos e para onde foi". O único destino externo novo é o `wa.me`, acionado pelo professor, sem dado de aluno, e está descrito em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md` com a ressalva da recomendação 1.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-02 17:41:29 · `tasks/prd-apresentacao-escola/15_task.md`

```
VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: "portão local: o último não rodou e2e. Rode `node tools/processo/portao-local.ts --e2e`."
Bloqueantes: um, de portão; nenhum de código (abaixo)
Recomendações: cinco (abaixo)
```

## Bloqueante

**Portão local sem a suíte exigida** — `/home/joaquimdp/Documentos/git/Educa.ia/.processo/portao.json` (início 2026-10-02T20:20:37Z, suítes `typecheck`, `lint`, `test`).

- **O que está errado:** a tarefa marca `frontend-reviewer`, então o carimbo precisa do `e2e`, e o `conferir` devolve a mensagem acima. A nota do pedido diz que o `--e2e` rodou verde antes da correção do `test-engineer`, mas essa execução não tem carimbo. A árvore atual, com os testes novos do vínculo contestado e do nome de 40 caracteres, não passou por ele.
- **Por que não relevei:** a minha instrução trata carimbo sem a suíte exigida como bloqueante, e o `/executar-task` (seção 4) não prevê adiar o `--e2e` para depois da revisão. As rodadas das tarefas 10.0 a 14.0 registraram "como combinado"; esse combinado veio do executor, não da definição do revisor. Se o Joaquim quer que a rodada intermediária valha sem o `--e2e`, isso se escreve em `.claude/agents/revisor-geral.md`.
- **Correção exigida:** aplicar o lote de recomendações dos revisores, rodar `node tools/processo/portao-local.ts --e2e` e chamar a 2ª rodada. Nenhuma mudança de código é exigida por mim.

O resto do carimbo vale: conferi com `avaliarCarimbo` só para `typecheck`, `lint` e `test`, e ele cobre o conteúdo atual. `Turma.tsx` e `Turmas.tsx` têm hora de 17:32, depois do carimbo, mas o conteúdo é o do instantâneo (mutação restaurada pelo `test-engineer`).

## O que conferi e está certo

- **Escopo:** 15.1 a 15.5 feitas. Nada da 16.0 (pedidos) nem da 17.0: `caminhoDaSala` só monta o endereço, sem rota nem página. Sem QR e sem contagem de quem entrou. Nada em `apps/api` nem em `packages/`.
- **Divergências:** as onze do `15_task.md` estão na `techspec.md` (seção 9, "Decidido na 15.0", e seção 12) e no `cenarios.md` (E16, W4 de Acesso, W7, W12). Também em `docs/interface.md`, `docs/lgpd.md` e `docs/glossario.md`.
- **Nota da 13.0:** `dialogos.tsx` foi movido, não copiado, e não sobrou import do caminho antigo. O `textoDaFalha` da operação é equivalente ao anterior, inclusive para erro que não vem da API.
- **Regra 00:** tipos e esquemas vêm de `@educa/shared`; a tela não refaz o agrupamento do código; o link é montado como a seção 4 da Tech Spec manda.
- **Regra 40:** sem `.skip`, `any`, `TODO` nem `console` nos arquivos da tarefa.
- **Regra 60:** os três termos novos entraram no glossário e o código os usa.
- **Id malformado no endereço:** a API responde `NAO_ENCONTRADO` (`idDoCaminho`), então cai no mesmo texto da turma indisponível.

## Recomendações (não bloqueiam)

1. **Cabeçalho da turma que saiu do alcance** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turma.tsx:38`. Com o vínculo encerrado e a tela aberta, a releitura da turma devolve `NAO_ENCONTRADO`, mas o `h1` continua com o nome e a série lidos antes, enquanto a seção já diz "não está disponível". Tratar `turmaIndisponivel(turma.error)` como indisponível mesmo com dado deixa a página dizer uma coisa só. A queda de rede com o código projetado continua sem desmontar, porque é outro código de erro.
2. **Textos do WhatsApp fora do lugar dos outros** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/AcessoDaTurma.tsx:255-258`. Os três textos ficam no `.tsx`, e os demais em `acesso-da-turma.ts`, "sem React, para a regra ter teste de unidade". O e2e os repete por extenso. Mover para lá deixa um lugar só.
3. **Cópia com reserva escrita duas vezes** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/AcessoDaTurma.tsx:290-293` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/copia-unica.tsx:94-99`. As duas repetem o `navigator.clipboard` opcional, o `copiarLink` e o "senão, seleciona". Um `copiar(texto, campo, { copiado, selecionado })` no `useCopia` cobre os dois casos. Cabe na linha do `TODO.md` que já junta `Falha` e `AlertaDaFalha`.
4. **Nomes que já não dizem o que fazem** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/link-do-convite.ts:6` e `:18`. `linkDoConvite` agora monta também o link da sala, e `copiarLink` copia o texto inteiro do WhatsApp. `linkComToken` e `copiarTexto`, ou equivalente, na mesma correção do item 3.
5. **`id` fixo no título** — `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turma.tsx:58` e `:61`. `id="titulo-da-turma"` é fixo; o resto da web usa `useId` (`AcessoDaTurma.tsx:65`). Trocar mantém um jeito só.

## test-engineer · 3ª rodada · APROVADO · 2026-10-02 18:15:18 · `tasks/prd-apresentacao-escola/15_task.md`

```
VEREDITO: APROVADO

Cenários exigidos (3ª rodada: o lote de recomendações dos outros revisores e o que ele afeta):
- As duas recomendações da minha 2ª rodada: o filtro do cartão contestado preso à turma (W4) e o excedente medido na lista de Turmas a 360 px (W12).
- A turma que a releitura deixa de achar sai da página inteira, com o diálogo, o link e o código. A queda de rede com o código projetado continua sem desmontar.
- O código soletrado para o leitor de tela, com o grande em dois grupos só para a vista.
- Sem o WhatsApp, o `useCopia` copia o convite com o texto próprio. Sem área de transferência, seleciona o link, não conta como copiado, e fechar ainda pergunta.
- O `useCopia` com assinatura nova não regride no diálogo do convite (operação e Professores).
- Textos novos: `TEXTO_DE_QUEM_VE_A_LISTA` com a frase do "gere um novo acesso", e "aqui" no lugar de "neste computador".

Cobertos:
- Recomendações da 2ª rodada, feitas: /home/joaquimdp/Documentos/git/Educa.ia/e2e/acesso-da-turma.spec.ts:285 filtra por `${turma.turmaNome} · História`; spec:609-611 mede o alvo do link e o `larguraExcedente` na lista de Turmas antes de abrir a turma de 40 caracteres.
- Turma que a releitura deixa de achar: spec:1072-1085 encerra o vínculo no banco de verdade, sem rota interceptada, e afirma o texto de indisponível, nenhum `h1`, nenhuma seção, nenhum diálogo aberto e nem token nem código no HTML. A primeira metade do mesmo teste (spec:1053-1070) segue provando o contrário para o 503.
- Código soletrado: spec:452 afirma o `p.sr-only` com o código que o servidor devolveu; `codigoNaTela` (spec:114) só acha o `p[aria-hidden="true"]` dentro do `role="group"` com nome, então tirar o `aria-hidden` ou o grupo quebra o W7 e o W12. Na unidade, /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/acesso-da-turma.test.ts:25-28.
- Sem o WhatsApp: spec:539-540 (o texto do aviso e o convite inteiro na área de transferência) e spec:553-558 (o link selecionado, e a pergunta ao fechar). Os textos estão por extenso no e2e.
- `useCopia` no convite: `DialogoDoConvite.tsx:229` e `:388` chamam `copia.copiar(link, campo)` com os ditos padrão. O caminho sem área de transferência do convite não foi relido nesta rodada; apoio-me no carimbo do portão com e2e, que vale para a árvore atual.
- Mutações refeitas por mim, com a web reconstruída, nos dois projetos; todas batem com a tabela "Mutações":
  - /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turma.tsx:42 sem `turmaIndisponivel(turma.error)`: vermelho em spec:1082 (`h1` com contagem 1, esperado 0).
  - /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/copia-unica.tsx:109 com `saiu` no lugar de `dizer`: vermelho em spec:558 (a pergunta não aparece).
  - /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/acesso-da-turma.ts:31 sem a vírgula entre os grupos: vermelho na unidade, `acesso-da-turma.test.ts:27`.
- As outras duas mutações novas da tabela (`AcessoDaTurma.tsx:296` e `:313`) conferi por leitura, sem rodar: as asserções de spec:539 e spec:452 dependem delas.
- Os números de linha da tabela "Mutações" batem com o código de agora nos arquivos que mudaram.
- Sem `.skip`, `.only`, `.fixme` nem `any` no spec e nos testes de unidade da tarefa. Nenhum mock novo; o `wa.me` segue interceptado.
- Repositório como estava: os três arquivos mutados restaurados e conferidos por sha256, `git status` e `git diff` com o mesmo hash do início, web do compose de teste reconstruída com o fonte original, spec inteiro verde (18 de 18 nos dois projetos), e `portao-local.ts conferir` responde válido (typecheck, lint, test, e2e).

Bloqueantes: nenhum

Recomendações:
- A validade em linha (/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/AcessoDaTurma.tsx:231) foi aplicada para o "Cancelar" caber no celular baixo, mas nenhum teste roda a 360 × 640: o W12 usa 360 × 800. Uma asserção de que o "Cancelar" do "Gerar novo" fica dentro da janela a 640 px prenderia o que a mudança quis.
- spec:1079-1085: quando a página sai com o diálogo aberto, o teste não afirma onde o foco fica. Vale decidir com o `frontend-reviewer` no `/validar`.
- `acesso-da-turma.test.ts:32` afirma só um trecho do texto `selecionado`. O e2e já o tem por extenso (spec:44), então é só simetria com a linha 31.
- Mantenho as recomendações da 1ª rodada que estão em "Recomendações sem aplicar" do `15_task.md`, com destino no `/validar`.
```

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-02 18:16:42 · `tasks/prd-apresentacao-escola/15_task.md`

```
VEREDITO: APROVADO
Estados: ok
Acessibilidade: ok, com duas recomendações (foco e título da aba quando a turma sai com a tela aberta)
Chromebook fraco: ok
Celular: ok a 360 × 800; a etapa do acesso ainda rola a 640 px de altura (já registrado para o /validar)
Ação oficial protegida: sim
Bloqueantes: nenhum
Recomendações: três, abaixo
```

Auditei pelo código e pelo e2e; não rodei sonda no `educa-teste` nem repeti o portão.

**Estados.** A turma aberta mantém carregando, erro com "Tentar de novo", vazio com o convite para gerar, e com dado. O ramo novo de `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turma.tsx:42` está certo: o `NAO_ENCONTRADO` na releitura tira a página inteira e o diálogo, sem "Tentar de novo" inútil. A queda de rede ou de servidor não desmonta nada. O e2e prova os dois casos (`e2e/acesso-da-turma.spec.ts:1043`).

**Correções da 1ª rodada.**
1. Espera da releitura: não aplicada, com motivo aceitável, e está no `TODO.md:475` e em "Recomendações sem aplicar" do `15_task.md`.
2. "Aqui" no lugar de "neste computador": feita (`acesso-da-turma.ts:63`), com teste de unidade que proíbe "computador".
3. Celular baixo: feita em parte, como declarado. A validade em linha (`AcessoDaTurma.tsx:231`) mantém os 44 px por opção e não transborda a 360 px, provado no W12.
4. Código soletrado: feito (`AcessoDaTurma.tsx:305-313`), com grupo rotulado, o código grande fora do leitor de tela e o soletrado só para ele; unidade e e2e conferem.
5. `accent-noite` nos rádios: feito nos dois lugares; o token existe (`estilos.css:51`).

**O resto do diff.** `useCopia().copiar` com os ditos opcionais não muda o convite, que segue com os ditos padrão. A extração para `copia-unica.tsx` é mudança de lugar, sem mudança de comportamento. Nada novo pesa no Chromebook.

**Recomendações** (não bloqueiam; ficam para o `/validar` e o `/retro`):
1. **Título da aba continua com o nome da turma indisponível.** Em `Turma.tsx:30` o `document.title` segue "Turma <nome>" porque `turma.data` fica em cache, embora o comentário da linha 40 diga que o título não continua afirmando a turma. Sugestão: usar "Turma" também quando `turmaIndisponivel(turma.error)`, e o e2e conferir o título.
2. **Foco perdido quando a turma some com o diálogo aberto.** O botão que abriu e o `h2` de reserva saem na mesma renderização, então o foco cai no `body`. O `role="status"` de `Turma.tsx:51` nasce já com o texto, caso em que o anúncio pode não acontecer (o comentário de `AvisoDaCopia` em `copia-unica.tsx` registra o mesmo risco). Sugestão: dar `tabIndex={-1}` e foco a esse parágrafo, ou ao "Voltar para Turmas", quando o ramo entra por releitura.
3. **"Ele" ambíguo no aviso de quem vê a lista.** Em `acesso-da-turma.ts:54`, "Se ele for parar onde não devia" vem depois de "o link ou o código" e de "a turma". "Se o link ou o código forem parar onde não deviam" lê melhor, se couber. O parágrafo cresceu, o que agrava a rolagem a 640 px já registrada.

## test-engineer · 4ª rodada · APROVADO · 2026-10-02 18:46:04 · `tasks/prd-apresentacao-escola/15_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (os do diff desde a 3ª rodada):
- A turma que a releitura deixa de achar tira o nome dela do título da aba.
- Nessa saída por releitura, o foco vai para o aviso de turma indisponível, e não cai no `body`.
- Na página que já abre sem a turma (pendente, encerrada, inexistente), o aviso não puxa o foco.
- A 360 × 640, o "Cancelar" da confirmação do "Gerar novo" fica dentro da janela.
- O texto novo de `TEXTO_DE_QUEM_VE_A_LISTA` é afirmado por extenso.
- O dito `selecionado` é afirmado por extenso na unidade.

**Cobertos:** todos.
- **Título da aba** (`Turma.tsx:32`): `e2e/acesso-da-turma.spec.ts:1093`. Sem o `|| indisponivel`, o dado antigo continua lido e o título ficaria com o nome da turma. Só este teste pega, porque no W4 o dado nunca chegou.
- **Foco no aviso** (`Turma.tsx:83`): `e2e/acesso-da-turma.spec.ts:1094`. A devolução de foco do `Dialogo` é síncrona na limpeza do efeito (`componentes/Dialogo.tsx:84`), antes do efeito do aviso, então não há corrida.
- **Foco só por releitura** (`Turma.tsx:83`, o inverso): `e2e/acesso-da-turma.spec.ts:405`, nas três turmas do laço. Não é vacuoso: o `toHaveText` da linha 397 garante o aviso na tela antes.
- **Celular baixo** (`AcessoDaTurma.tsx:231`): `e2e/acesso-da-turma.spec.ts:687-690`. Rodei a mutação (`flex flex-col` no lugar de `flex flex-wrap gap-x-6`, web reconstruída): vermelho nos dois projetos, `Received: 652` contra `<= 640`. A folga do código atual é de uns 76 px.
- **Textos:** `e2e/acesso-da-turma.spec.ts:45-46` e `:462` batem com `acesso-da-turma.ts:53-54`; `acesso-da-turma.test.ts:32-34` afirma o `selecionado` inteiro.
- **Seção "Mutações":** as quatro cláusulas novas têm linha (`15_task.md:215-218`), e a numeração de `Turma.tsx` (32, 44, 46, 52, 65, 83) confere com o arquivo.
- Sem `.skip`, `.only`, teste comentado ou mock que esconda regra; nenhum provedor de IA envolvido.

As mutações do título e as duas do foco conferi por leitura do código, não rodei; só a do celular baixo pedia medida de layout.

**Estado do repositório depois da auditoria:** `AcessoDaTurma.tsx` restaurado (sha256 `6a8ea7d0…1be83`, igual ao de antes) e a web do compose de teste reconstruída com ele. W4, W12 e "a releitura que cai…" rodaram verdes nos dois projetos (6 passaram). O portão local continua válido para o código atual, e o `git status` tem as mesmas 35 entradas.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `e2e/acesso-da-turma.spec.ts:689`: o `cancelar?.y ?? 640` com `height ?? 0` dá exatamente 640 quando a caixa é nula, e a asserção passaria sem botão. Hoje não acontece, porque o `alvoDeToque` da linha 685 exige a caixa do mesmo botão três linhas antes. Fica mais firme com `expect(cancelar).not.toBeNull()` antes, ou com o padrão `?? Infinity`.
2. A mesma asserção mede a caixa do botão contra a janela, não contra a área visível do diálogo. Se o diálogo passar a ter altura máxima com rolagem interna, o botão pode ficar cortado com `y + height <= 640`. Para o `/validar`: trocar por `toBeInViewport({ ratio: 1 })`, que considera o corte.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turma.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/AcessoDaTurma.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/acesso-da-turma.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/acesso-da-turma.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/acesso-da-turma.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/15_task.md`

## frontend-reviewer · 3ª rodada · APROVADO · 2026-10-02 18:47:02 · `tasks/prd-apresentacao-escola/15_task.md`

```
VEREDITO: APROVADO
Estados: ok
Acessibilidade: ok
Chromebook fraco: ok
Celular: ok (a etapa "Acesso gerado" ainda rola a 640 px de altura, já registrado para o /validar)
Ação oficial protegida: sim
Bloqueantes: nenhum
Recomendações: duas, abaixo
```

Auditei só o diff desde a 2ª rodada, por leitura do código e do e2e; não rodei as suítes de novo.

**As três recomendações da 2ª rodada foram aplicadas**

1. **Título da aba** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turma.tsx:31-32`): com a turma indisponível o título volta a "Turma", e o mesmo `indisponivel` tira o `h1` da página (linha 44). O e2e afirma `toHaveTitle('Turma · Turmma')` nos dois caminhos (`e2e/acesso-da-turma.spec.ts:403` e `:1093`).
2. **Foco quando a turma some com o diálogo aberto** (`Turma.tsx:80-90`): o foco vai para o aviso só quando ele chega por releitura.
   - A ordem dos efeitos está certa: ao desmontar, o diálogo não acha mais quem o abriu nem o título da seção, e só depois o aviso monta e recebe o foco.
   - Na página que já abre sem a turma, o aviso não puxa o foco, e o "Voltar para Turmas" continua primeiro na ordem do Tab.
   - O e2e cobre os dois lados (`spec:405` e `spec:1094`).
3. **"Ele" ambíguo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/acesso-da-turma.ts:54`): o texto novo está em português claro, sem termo técnico, e é o mesmo por extenso no e2e (`spec:46`).

**O que veio do `test-engineer`**

- **Janela de 360 × 640** (`spec:686-690`): o "Cancelar" da confirmação do "Gerar novo" fica dentro da janela, o que prova o `flex-wrap` das validades em `AcessoDaTurma.tsx:231`. A janela volta a 800 em seguida, então as afirmações seguintes não mudam.
- **Texto `selecionado` por extenso** (`apps/web/src/areas/professor/acesso-da-turma.test.ts:32-33`): confere com `acesso-da-turma.ts:65`.

Nada no diff toca os estados, a confirmação de gerar e revogar, a largura a 360 px ou os alvos de toque.

**Recomendações (não bloqueiam; destino `/validar`)**

- **Aviso duplicado:** `AcessoDaTurma.tsx:87-89` repete a marcação do aviso de turma indisponível que agora é o componente `TurmaIndisponivel` em `Turma.tsx:86`. Vale um componente só, para os dois não divergirem em classe ou papel.
- **Possível leitura dupla:** `Turma.tsx:86` tem `role="status"` e recebe foco, e alguns leitores de tela podem ler o texto duas vezes na releitura. Vale conferir com NVDA ou ChromeVox; se repetir, tirar o `role` quando `porReleitura`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-02 18:48:26 · `tasks/prd-apresentacao-escola/15_task.md`

```
VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum
Recomendações:
  1. /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/15_task.md:149 — frase quebrada na divergência da releitura: "…o aviso não puxa o foco. E e a turma só desenha a seção…". Acertar o texto.
  2. /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/acesso-da-turma.ts:24 — `codigoEmDoisGrupos` é só um segundo nome para `exibirCodigoDaTurma`. Usar o nome de `packages/shared` direto deixa um jeito só; pode sair junto da renomeação de `linkDoConvite` e `copiarLink` já anotada no `TODO.md`.
  3. /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md (W12, "No Acesso (15.0)") — o trecho não cita o caso de 360 × 640 que o e2e passou a provar (`e2e/acesso-da-turma.spec.ts:686-689`). Não é divergência de arquitetura; vale uma frase para o cenário dizer o que o teste afirma.
```

**Correção exigida na 1ª rodada (portão sem `e2e`): feita.** O `conferir` responde "portão local válido para o código atual (typecheck, lint, test, e2e)". O carimbo começou às 21:22:57Z, depois da última alteração de código (`e2e/acesso-da-turma.spec.ts`, 21:19Z).

**Minhas cinco recomendações da 1ª rodada:**
- **1 (turma que saiu do alcance):** aplicada em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turma.tsx` (linhas 31-32, 44, 53 e 80-89). A queda de rede com o dado na tela continua sem desmontar a página, e o e2e "a releitura que cai…" afirma os dois lados.
- **2 (textos do WhatsApp):** aplicada, em `acesso-da-turma.ts`, com teste de unidade.
- **3 (cópia escrita duas vezes):** aplicada. O `useCopia().copiar` de `componentes/copia-unica.tsx` cobre o link e o convite, e `AcessoDaTurma.tsx` não toca mais `navigator.clipboard`.
- **4 (nomes `linkDoConvite` e `copiarLink`):** não aplicada, com destino no `TODO.md` e em "Recomendações sem aplicar". Aceito.
- **5 (`id` fixo no título):** aplicada com `useId`.

**Diff desde a 1ª rodada:**
- **Escopo:** nada invade a 16.0 (pedidos); QR e contagem de entrada continuam fora.
- **Divergências:** o código soletrado, o foco e o título da aba na releitura, a validade em linha e o aviso de "Gerar novo" estão no `15_task.md`, na `techspec.md` (seção 9, "Decidido na 15.0") e no `cenarios.md` (W7). A linha do `docs/lgpd.md` diz o que vai na consulta do `wa.me` e o que fica no histórico.
- **Regras 00 e 40:** tipos e contratos vêm de `@educa/shared`; não há `.skip`, `.only`, `any` de tipo, `TODO` nem `console` nos arquivos da tarefa. O `any(...)` que aparece em `e2e/__fixtures__/sessao.ts` é SQL.
- **Regra 60:** "acesso da turma", "link da sala" e "código da turma" entraram no glossário, e a turma só abre pelo vínculo confirmado.
- **Tabela de mutações:** as linhas citadas no `15_task.md` batem com o código atual nos pontos que mudaram.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-02 18:48:29 · `tasks/prd-apresentacao-escola/15_task.md`

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum campo novo. O diff desde a 1ª rodada mexe só em como a web mostra e retira o link da sala e o código da turma, que já estão na linha "Acesso da turma" de docs/lgpd.md. O nome da escola continua indo no texto do WhatsApp; nome de aluno, matrícula e nome da turma não têm por onde entrar (textoDoWhatsApp só recebe escolaNome e link).
Fora da tabela de dados do docs/lgpd.md: nada. A linha "Acesso da turma" agora diz que o link vai na consulta do wa.me, chega à Meta no clique e fica no histórico do navegador do professor enquanto o acesso valer (até 30 dias), e que "Gerar novo" o derruba na hora.
Autorização por objeto: ok. Quem decide continua sendo a API (GET /v1/turmas/:id e /acesso), sem mudança em apps/api. A web deixou de afirmar a turma quando a releitura devolve NAO_ENCONTRADO: saem o h1, o título da aba, a seção e o diálogo com o link e o código (Turma.tsx:31-32 e 44-58). O texto é o mesmo para vínculo não confirmado, encerrado, turma inexistente e ano virado (regra 10, item 6).
Logs: limpos. Nenhum console, localStorage ou sessionStorage nos arquivos da tarefa; o semRastro do e2e confere URL pedida, navegação, console, armazenamento, history.state, IndexedDB, Cache Storage e HTML.
Auditoria: presente, sem mudança (gerar e revogar são auditados na API, da 4.0). O diff não cria leitura de dado de aluno, exportação nem alteração de permissão.
Envio externo: o navegador do professor abre https://wa.me/?text=... com o nome da escola e o link (token no fragmento do link, mas dentro da consulta do wa.me). É ato do professor; o servidor não envia nada. Não é chamada de IA, então não há ExecucaoAgente. Está registrado em docs/lgpd.md e avisado na tela antes do envio (TEXTO_DE_QUEM_VE_A_LISTA). A reserva sem WhatsApp copia o mesmo texto pela mesma cópia do link e não cria caminho novo de saída.
Seed/fixture: sintético. Nomes da lista são "Aluna/Aluno da lista <uuid>", matrícula "M<n>-<uuid>", turma de 40 letras "Taaa…<uuid>"; contestarVinculosNoBanco só troca estado, preso por escola_id; gerarAcessoNoBanco sorteia token e código e não os devolve.
Bloqueantes: nenhum
Recomendações:
  1. /home/joaquimdp/Documentos/git/Educa.ia/e2e/acesso-da-turma.spec.ts:1095 — no fim do teste "a releitura que cai…", conferir também o código com o espaço do meio e o soletrado, como já faz a linha 1120 (sessão vencida) e o semRastro (linha 246). Hoje é a contagem de diálogos em zero (linha 1091) que cobre as duas formas: o `<p aria-hidden>` e o `<p class="sr-only">` só existem dentro do diálogo. É cobertura extra.
  2. /home/joaquimdp/Documentos/git/Educa.ia/e2e/acesso-da-turma.spec.ts:236-247 — o semRastro não procura a forma soletrada ("A B C D, 2 3 4 5") no HTML depois de fechar. Mesmo motivo: sai com o diálogo. Cobertura extra.
  3. Para o /validar, fora deste diff: o vínculo encerrado tira a turma da tela, mas não achei no apps/api (sem mudança nesta tarefa) nada que revogue o acesso que aquele professor gerou. Busquei só pelos arquivos que tocam acesso_turma; nenhum é do encerramento de vínculo. Se for isso mesmo, o professor realocado fica com um link que mostra os nomes livres até vencer ou alguém gerar outro. Vale decidir se o encerramento do último vínculo dele na turma revoga o acesso, ou se o docs/lgpd.md e a tela da coordenação dizem que "Gerar novo" é o remédio.
  4. Continuam abertas da 1ª rodada, com destino registrado: o aviso de computador compartilhado sobre o histórico do wa.me (/validar, em "Recomendações sem aplicar" do 15_task.md); o teste do outro professor da mesma escola pelo endereço (/validar); Referrer-Policy na borda (TODO.md, com o infra-guardian).
```

Conferência das correções da 1ª rodada (não eram exigidas, eram recomendações):

| # | Recomendação | Situação |
|---|---|---|
| 1 | `docs/lgpd.md` dizer que o link vai na consulta do `wa.me` e fica no histórico | Aplicada. O aviso na tela ficou para o `/validar`, registrado. |
| 2 | Teste do outro professor da mesma escola | Não aplicada, registrada no `15_task.md` com motivo. |
| 3 | `Referrer-Policy` na borda | Não aplicada, registrada no `TODO.md`. |
| 4 | `TEXTO_DE_QUEM_VE_A_LISTA` dizer que "Gerar novo" invalida o link | Aplicada em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/acesso-da-turma.ts:53-54`, afirmada por extenso no e2e (linha 462). |

Rodei só os testes de unidade dos três arquivos da tela (`acesso-da-turma.test.ts`, `texto-do-whatsapp.test.ts`, `api/acesso.test.ts`): 21 passaram. O e2e não rodei; li o teste e confiei no portão carimbado.

Pergunta de fechamento: o diff não cria dado guardado sobre aluno nem destino novo de envio. O único destino externo, o `wa.me` pela mão do professor, leva escola e link, sem dado de aluno, e está descrito em `docs/lgpd.md`. Não editei nenhum arquivo.

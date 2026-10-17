# Achados das revisões — `tasks/prd-telas-da-coordenacao/7_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-17 11:25:16 · `tasks/prd-telas-da-coordenacao/7_task.md`

VEREDITO: AJUSTES NECESSÁRIOS
Tela vista: sim (8 fotos lidas: painel e diálogo "Acrescentar turma", computador e celular, escola cheia e vazia). As fotos mostram só um professor com uma turma. Não mostram o painel com turmas a ponto de rolar, nem o painel sem turma. Esses dois casos eu revisei pelo código.
Estados: ok.
- Carregando: `PainelDoProfessor.tsx` mostra "Carregando as turmas…".
- Erro: `EstadoErro` com "Tentar de novo".
- Vazio: "Nenhuma turma." e o vazio de `tituloDoQueFalta`.
- Com dado: confere com as fotos.
- A seção só afirma o vazio depois de ler as listas de que depende, e avisa quando a lista de vínculos passou do teto de páginas.

Acessibilidade: foco visível e rótulos corretos nos dois campos do diálogo. A tela tem o defeito do bloqueante abaixo: o miolo rolável do painel não tem como receber o Tab.
Chromebook fraco: ok. O painel só lê turmas e disciplinas para quem recebe turma, não anima largura nem altura, e a lista de vínculos de um professor é curta.
Celular: ok nas fotos de 360 px. A folha de baixo não tem rolagem horizontal. "Acrescentar turma", "Acrescentar" e "Cancelar" medem cerca de 44 px, e os campos de seleção têm 48 px. Nada depende de hover.
Ação oficial protegida: sim, no que se aplica. Acrescentar turma não é ação oficial. O diálogo mostra o professor por nome, a escolha explícita de turma e disciplina e exige as duas antes de enviar. O vínculo nasce pendente e o anúncio diz que a turma só abre depois que o professor confirmar. Nenhuma foto mostra o anúncio depois de acrescentar, então isso vem do código (`Alocacao.tsx:93`) e do e2e.

Bloqueantes:
- `apps/web/src/componentes/PainelLado.tsx:71`, e o e2e de `e2e/alocacao.spec.ts`: o miolo rolável do painel é `overflow-y-auto` com `tabIndex={-1}` e agora tem conteúdo sem nenhum controle dentro. Com 2 ou 3 turmas no celular, ou 5 ou mais no computador, o painel passa da altura e rola. Quem usa teclado entra com o foco no miolo, mas depois do primeiro Tab não volta a ele e não consegue rolar. O axe acusa `scrollable-region-focusable` (grave). A própria tarefa registra o defeito em "Recomendações sem aplicar" e deixa de chamar `violacoesGraves` no e2e do painel com três turmas. Isso esconde a falha em vez de corrigi-la, e é a 7.0 que traz o conteúdo que faz o painel rolar. Correção exigida: `tabIndex={0}` no miolo, que continua recebendo o foco inicial por código, ou outra solução que deixe o miolo no ciclo do Tab quando ele rola. Depois, um e2e do painel com três ou mais turmas chamando `violacoesGraves`, nos projetos `chromebook` e `celular`.

Recomendações:
- `PainelDoProfessor.tsx:134-135` e `o-que-falta-para-alocar.ts`: o vazio "Crie uma turma primeiro" não diz onde criar. Um link para a aba Turmas fecha o próximo passo.
- `Nenhuma turma.` poderia convidar: "Nenhuma turma ainda. Use Acrescentar turma." Só vale quando o botão existe.
- `convite-de-professor.ts`: o selo da situação sai como "ATIVO." com ponto final. Rótulo de selo não leva ponto, e isso vem da 6.0.
- "Acrescentar turma" é a única ação do rodapé na variante secundária. Está de acordo com a Tech Spec ("Cadastrar professor" é o único botão cheio), então registro só como observação.

Fotos conferidas: `.processo/vitrine/coordenacao--coordenacao-professores--Ver-depois-tbody-tr--computador.png` e as outras sete do prompt (mesmo diretório).

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-17 11:25:23 · `tasks/prd-telas-da-coordenacao/7_task.md`

VEREDITO: APROVADO

A tarefa 7.0 só mexe no frontend. A API, o contrato em `@educa/shared`, as migrations e o storage não mudam, e nada é enviado para fora. Nenhuma foto de tela veio no prompt, então a auditoria foi feita só pelo código.

**Campos pessoais tocados:** só o que já existia no `VinculoDaCoordenacao`: o nome do professor, o `usuarioId` (UUID), o estado do vínculo, o código da contestação, o complemento da contestação e o motivo do encerramento. Nenhum dado de aluno. O complemento já aparecia na Alocação antiga (`git show HEAD:apps/web/src/areas/coordenacao/Alocacao.tsx`, linha 126). Agora aparece em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/PainelDoProfessor.tsx:43`, como texto escapado pelo React, sem ir para log nem para o endereço. Ele só aparece no vínculo contestado e só no ano em curso, o que bate com a retenção da tabela: apagado na virada do ano.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. O motivo e o complemento da contestação estão em `docs/lgpd.md:72`. O nome e o identificador do professor já estavam no mapa.

**Autorização por objeto:** ok. Nenhuma rota nova. O painel lê `consultaVinculos`, `consultaTurmas` e `consultaDisciplinas` da coordenação, com o escopo da escola vindo do token, e filtra no cliente pelo professor do painel (`professores-da-escola.ts`, `vinculosDoProfessor`). Isso é só apresentação: a coordenação já tem direito a todos os vínculos da unidade (regra 60, item 11). O parâmetro `?professor=` leva só o UUID. O `alocarProfessor` continua com a API decidindo: ela recusa o professor vencido, revogado ou desativado com o mesmo `NAO_ENCONTRADO` do id inexistente. O teste do professor de outra escola na aba já existe em `e2e/professores.spec.ts` e continua valendo.

**Logs:** limpos. Não há `console` nem `logger` em `PainelDoProfessor.tsx`, `Alocacao.tsx` ou `Professores.tsx`. O anúncio "Alocação feita: <nome> em <turma>" vai para uma região `aria-live` na tela, não para log.

**Auditoria:** nada novo a exigir. A coordenação lendo vínculo de professor não é leitura de dado de aluno nem de indicador de professor (regra 20, item 10). A criação do vínculo continua sendo auditada na API, que não mudou. O painel mostra só o vínculo e o que o professor respondeu, sem uso nem adoção (regra 70, item 9; D64).

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Nos testes de componente: "Ana Sintética", "Bruno Sintético", "Caio Sintético" e os outros, com UUIDs fabricados e o complemento "Dou aula na 7ºA.". No e2e: "Artes sintética <uuid>", "Física sintética", e professores criados por `convidarProfessorNoBanco`.

**Pergunta de fechamento:** o que o sistema guarda sobre um aluno, e para onde isso foi, não muda com esta tarefa. Ela não acrescenta dado, nem destino de envio, nem caminho de leitura de dado de aluno.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Pelo título do teste e pela tabela de testes da tarefa, o e2e "o vínculo nasce pendente" deveria provar também que o professor ainda não alcança a turma. O código de `e2e/alocacao.spec.ts` (linhas 85–240) e de `e2e/escola-montada.spec.ts` só confere o selo "Esperando o professor confirmar". A regra continua provada pela API, que não mudou (`apps/api/src/assistente/assistente.int.test.ts:238` e `apps/api/src/atividade/atividade-isolamento.int.test.ts:141`). Vale dizer isso na tabela "Divergências resolvidas" de `7_task.md`, ou acrescentar a verificação no e2e.
2. Os textos de `PORQUE_NAO_RECEBE_TURMA` (`professores-da-escola.ts`) dizem "cadastre o mesmo e-mail de novo". É o e-mail do professor, que pode existir, e ele não é exibido, então não há problema. Se um dia esse texto for reaproveitado para aluno, ele precisa mudar, porque aluno não tem e-mail (regra 20, item 2).

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-17 11:26:29 · `tasks/prd-telas-da-coordenacao/7_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em `techspec.md:117`. A tabela "Divergências resolvidas" diz que três decisões estão registradas na Tech Spec, e elas não estão. A Tech Spec também passou a dar como aceito um defeito de acessibilidade.
Portão local: carimbo válido

Bloqueantes:

1. **Divergências que só existem no `7_task.md`**
   - Em `tasks/prd-telas-da-coordenacao/7_task.md:73-75`, as linhas 2, 3 e 4 apontam para `techspec.md` §9 "Como ficou na 7.0". Esse parágrafo (`techspec.md:117`) não fala de nenhuma delas:
     - linha 2: o e2e "recomeço: segunda pessoa" não ganhou caso novo;
     - linha 3: o e2e do contestado não confere o complemento escrito pelo professor;
     - linha 4: a observação da 9.0 sobre "Nome não carregado".
   - Há ainda uma divergência que nem foi declarada. A tabela de testes da tarefa (`7_task.md:45`) diz que o e2e do vínculo pendente prova que "o professor ainda não alcança a turma". Nenhum e2e alterado faz essa verificação: `e2e/alocacao.spec.ts:140-153` e `e2e/escola-montada.spec.ts` conferem só o selo "Esperando o professor confirmar".
   - Correção exigida:
     - registrar as linhas 2 e 3 no texto da `techspec.md` §9 (ou na tabela de testes da Tech Spec), ou fazer os casos que elas dispensam;
     - para "o professor ainda não alcança a turma", fazer a verificação no e2e ou registrá-la como divergência na Tech Spec, citando os testes da API que provam a regra (o `privacy-guardian` apontou `assistente.int.test.ts:238` e `atividade-isolamento.int.test.ts:141`);
     - a linha 4 não muda nada em relação à Tech Spec: mover para "Recomendações sem aplicar", como destino da recomendação da 9.0, ou registrar de fato.

2. **Falha de acessibilidade aceita e escondida do teste**
   - Na `techspec.md:117`, a frase "O miolo rolável do `PainelLado` não tem controle focável […]: fica como recomendação" dá como aceita uma violação grave do axe (`scrollable-region-focusable`). Quem traz o conteúdo que faz o painel rolar é esta tarefa.
   - `7_task.md:346` confirma que o e2e do painel com três turmas deixou de chamar `violacoesGraves` para não ficar vermelho (`e2e/alocacao.spec.ts:241-268`). Isso é desligar a verificação para destravar a tarefa (regra 40, "O que é proibido").
   - É o mesmo bloqueante do `frontend-reviewer`, e eu concordo com ele.
   - Correção exigida:
     - deixar o miolo do `apps/web/src/componentes/PainelLado.tsx` no ciclo do Tab quando ele rola (por exemplo, `tabIndex={0}` mantendo o foco inicial por código);
     - chamar `violacoesGraves` no e2e do painel com três ou mais turmas, nos projetos `chromebook` e `celular`;
     - tirar a frase da `techspec.md:117` e a linha da `7_task.md:346`.

Recomendações:
- O selo do vínculo está duplicado: `PainelDoProfessor.tsx:19-29` repete o componente `SeloDoVinculo` e o mapa de `ProfessoresDaTurma.tsx:18-28`, mudando só os textos. Uma peça só, recebendo o mapa de textos, evita duas cópias da mesma regra de família por estado.
- `PainelDoProfessor.tsx:28`: o ternário que repete `<Estado>` só existe por causa da união de props de `Estado`. Ficaria mais legível com um comentário de uma linha dizendo isso, ou com a correção do tipo na peça compartilhada da recomendação anterior.
- Os textos de `PORQUE_NAO_RECEBE_TURMA` (`professores-da-escola.ts`) dizem "cadastre o mesmo e-mail de novo". Hoje estão corretos, porque o e-mail é do professor. Se um dia forem reaproveitados para aluno, precisam mudar, porque aluno não tem e-mail (regra 20, item 2).

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/7_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/alocacao.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/componentes/PainelLado.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/PainelDoProfessor.tsx

## test-engineer · 1ª rodada · REPROVADO · 2026-10-17 11:27:34 · `tasks/prd-telas-da-coordenacao/7_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Estados da seção Turmas: carregando, erro com "Tentar de novo", "Nenhuma turma", com dado, o vazio do que falta só com as leituras terminadas, e o foco depois de acrescentar.
- Vínculo encerrado ao lado de um aberto, com a turma do encerrado aceita de novo.
- Só o alocável vê o botão (permissão): vencido, revogado e desativado não.
- O vínculo nasce pendente, e o professor ainda não alcança a turma.
- Bordas: duas disciplinas na mesma turma; professor que contestou; virada de ano (sem ano em curso, encerrado por fim do ano); turma ou disciplina excluída com o diálogo aberto; convite que vence com o diálogo aberto.
- Clique duplo em "Acrescentar".
- Recomeço: segunda pessoa, resposta atrasada, falha com o diálogo aberto.
- Isolamento: a tarefa não toca a API; a corrida entre duas pessoas é da API, que já tem `vinculo.int.test.ts › concorrência: o mesmo vínculo criado duas vezes em paralelo`.

**Cobertos:** quase todos, em `apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx` (com rede falsa), `professores-da-escola.test.ts` e `e2e/alocacao.spec.ts`.
- O clique duplo é testado de verdade: `dblClick` com a resposta segurada no componente, e dois `click()` no mesmo instante no e2e.
- Os quatro testes de unidade passam (85 casos).
- Não há `.skip`, `.only` nem teste comentado, e nenhum mock esconde a regra.
- As mutações declaradas que conferi chegam à cláusula pelo motivo certo.

**Bloqueantes:**

1. **`apps/web/src/areas/coordenacao/PainelDoProfessor.tsx:117`: cláusula nova sem bloco e sem teste.** A linha é `if (anos.data === undefined) return <EstadoCarregando …/>`.
   - Sem ela, enquanto os anos ainda carregam, `anoEmCurso` é `false` e a seção afirma "As turmas são do ano letivo em curso. Abra o ano letivo na tela Turmas.". É uma afirmação falsa durante o carregando.
   - O caso "carregando" segura só os vínculos (`vinculos: nuncaResponde`), então nenhum teste fica vermelho.
   - **Correção:** um caso com `anos: nuncaResponde` que exija "Carregando as turmas…" e a ausência do texto do ano em curso, mais o bloco de mutação removendo a linha.

2. **`PainelDoProfessor.tsx:37`: o `?? 'Sem disciplina'` é cláusula nova sem bloco e sem teste.**
   - O caso existe de verdade: a API cria vínculo sem disciplina (`vinculo.int.test.ts › … com e sem disciplina`).
   - **Correção:** um caso no componente com um vínculo sem `disciplina` que exija o item "7ºA / Sem disciplina", mais o bloco.

3. **Cláusulas novas ou copiadas que têm teste mas não têm bloco.** Pela regra das mutações, isso bloqueia por si. Para cada uma, acrescentar o bloco citando o teste que já existe:
   - `PainelDoProfessor.tsx:147`, o `&& !podeAcrescentar` do rodapé. Teste: `Professores.test.tsx › só as ações que o estado permite…`, que exige rodapé para ANA e ELIS.
   - `PainelDoProfessor.tsx:107`, `if (falhou !== undefined)`, e `:113`, `if (consulta.isError)`, o que faz "Tentar de novo" ler só o que falhou. Teste: `› erro nos vínculos: a mensagem curta e "Tentar de novo"…`.
   - `Alocacao.tsx:77`, `definirFaltando(!completo)`, e `:85`, a precedência `faltando ? … : mutacao.isError`. Teste: `› o vínculo que já existe… a escolha incompleta tira o aviso`.
   - `Professores.tsx:318`, `dialogo.fecharSeAinda(aberta)` (trocar por `fechar()`). Teste: `e2e/alocacao.spec.ts › a resposta que chega depois de o diálogo ter fechado…`.
   - `Professores.tsx:312`, `key={aberta.numero}`. Teste: `› abrir o diálogo de novo apaga o anúncio… a abertura nova nasce sem escolha nem aviso`.

4. **Cenário declarado sem prova: "o professor ainda não alcança a turma".** É a linha "o vínculo nasce pendente" da tabela de testes, `7_task.md:45`.
   - Nem `e2e/alocacao.spec.ts:148-153` nem `e2e/escola-montada.spec.ts:148-162` verificam isso. A segunda parte da linha não tem teste nesta tarefa.
   - **Correção, uma das duas:**
     - Em `escola-montada.spec.ts`, antes do "Confirmar" (linha 162), exigir que o professor não tenha o link `Abrir a turma ${turma}` (ou o equivalente que dá acesso à turma).
     - Ou trocar a linha da tabela para apontar o teste já existente que prova o pendente sem acesso, e registrar isso em "Divergências".

**Recomendações:**
- `e2e/alocacao.spec.ts:186`: o convite que vence com o diálogo aberto só exige `toBeVisible()` do alerta. Vale exigir o texto "Este professor já não pode receber turma…".
- `e2e/alocacao.spec.ts:188`: o `/^(Cancelar|Fechar)$/` aceita os dois botões, mas a regra é oferecer só "Fechar". A unidade prova isso; o e2e poderia exigir "Fechar".
- O e2e do contestado não confere o complemento. A divergência está declarada; vale estender `contestarVinculosNoBanco` para gravar o complemento numa tarefa futura.
- A família visual do selo (`SELO_DO_VINCULO.familia`) não tem asserção. É visual, então fica com o `frontend-reviewer`.
- O axe não roda no painel com três turmas por causa do `PainelLado`. O destino já está registrado na tarefa; só lembrar de religar `violacoesGraves` nesse teste quando a correção chegar.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-17 11:59:33 · `tasks/prd-telas-da-coordenacao/7_task.md`

VEREDITO: APROVADO
Tela vista: sim (8 fotos lidas: painel do professor e diálogo "Acrescentar turma", no computador e no celular, escola cheia e vazia)
Estados: ok. A seção "Turmas" do painel tem carregando, vazio, erro com "Tentar de novo" e dado. O teste novo "carregando os anos" cobre o carregando. Carregando e erro foram conferidos pelo código e pelos testes, porque a vitrine não os mostra.
Acessibilidade: a correção exigida foi feita. `apps/web/src/componentes/PainelLado.tsx:73` passou a `tabIndex={0}`: o miolo rolável entra no ciclo do Tab e continua recebendo o foco inicial por código. O teste de unidade cobre as duas coisas, e a mutação para `-1` está declarada. `e2e/alocacao.spec.ts:272` chama `violacoesGraves` com três turmas, depois de o diálogo fechar e a lista ter três itens. Esse teste roda nos projetos `chromebook` e `celular`. O foco visível usa `-outline-offset-3`, que não corta na borda do painel. Os campos têm rótulo ("Turma", "Disciplina").
Chromebook fraco: sem mudança de risco. O painel não anima largura nem altura, e a lista dele é curta.
Celular: nas fotos de 360 px não há rolagem horizontal nem texto cortado. O painel é uma folha embaixo com "Acrescentar turma" a cerca de 44 px, e o diálogo cabe na largura. A faixa que aparece embaixo do painel nas fotos é o efeito da foto de página inteira com elemento fixo. Não é defeito.
Ação oficial protegida: sim. "Acrescentar turma" abre diálogo com o professor, a turma e a disciplina à vista e o aviso "Ela só abre para ele depois que ele aceitar o convite e confirmar". O novo e2e confere que a turma não abre para o professor antes de ele confirmar.
Bloqueantes: nenhum
Recomendações, todas já registradas no `TODO.md` (X2, 7.0):
- O vazio "Crie uma turma primeiro" poderia apontar para a aba Turmas, e "Nenhuma turma." poderia convidar a acrescentar.
- O selo "ATIVO." sai com ponto final (vem da 6.0, `convite-de-professor.ts`; aparece nas fotos).
- A foto mostra o painel do professor com a lista de turmas curta, então o miolo rolável não se vê na tela. O e2e com três turmas é quem prova esse caso.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-17 11:59:36 · `tasks/prd-telas-da-coordenacao/7_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o que mudou desde a 1ª (`5cf1223..a2353737`, sem `achados/`). A rodada anterior não deixou correção exigida para conferir.

Campos pessoais tocados: nenhum novo. O diff mexe em acessibilidade (`tabIndex={0}` no miolo do `PainelLado`), em testes e em documentos. Nenhum DTO, rota, repository ou migration mudou.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. O diff não cria rota nem leitura nova. O caso novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/escola-montada.spec.ts:143-144` confirma que um vínculo pendente não abre a turma para o professor (regra 60, item 8a). Na tela, isso conta a favor.

Logs: limpos. `PainelLado.tsx` e `PainelDoProfessor.tsx` não têm `console` nem `logger`.

Auditoria: nada no diff a exige. Não há leitura nominal nova de aluno, exportação, nota, permissão nem aprovação de saída de IA.

Envio externo: nenhum.

Seed/fixture: sintético. Os dados de teste são inventados: o professor "BRUNO", as turmas "7ºA" e "7ºB", o complemento "Dou aula na 7ºA." e o texto de alerta do convite vencido. O novo item do `TODO.md` traz só caminhos de arquivo e textos de tela, sem dado de pessoa.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/componentes/PainelLado.tsx:73` é um componente compartilhado. Com `tabIndex={0}`, o miolo recebe foco visível em todo painel que o usa, inclusive nos que um dia mostrarem dado de aluno. Isso não expõe dado nenhum, porque o foco não muda o que a API devolve, mas fica registrado para o `frontend-reviewer` olhar o contorno de foco nos outros painéis.
- A recusa da recomendação sobre o texto "cadastre o mesmo e-mail de novo" (`PORQUE_NAO_RECEBE_TURMA`) continua aceitável: o texto é só do professor, e aluno não tem e-mail (regra 20, item 2). Se um dia esses textos forem reaproveitados para aluno, isso reabre.

Pergunta de fechamento: o diff não muda o que o sistema guarda sobre aluno nem para onde envia, então a resposta da 1ª rodada continua valendo.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-17 12:00:22 · `tasks/prd-telas-da-coordenacao/7_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

As duas correções da 1ª rodada foram feitas.

1. **Divergências que existiam só na tarefa.**
   - A "segunda pessoa" e o complemento do contestado agora estão no texto da Tech Spec, no trecho "Testes:" da §9 "Como ficou na 7.0" (`techspec.md:117`).
   - "O professor ainda não alcança a turma" virou verificação no e2e (`e2e/escola-montada.spec.ts:162-163`): com o vínculo pendente, não existe o link "Abrir a turma"; a Tech Spec cita esse teste.
   - A observação da 9.0 saiu das divergências e foi para "Recomendações sem aplicar", recusada com o motivo.

2. **Verificação de acessibilidade que tinha sido desligada.**
   - O miolo do `PainelLado` agora está no ciclo do Tab, com `tabIndex={0}` (`PainelLado.tsx:73`), e continua recebendo o foco inicial.
   - O teste de componente prova as duas coisas, e há mutação declarada para ele.
   - O e2e do painel com três turmas voltou a chamar `violacoesGraves` (`e2e/alocacao.spec.ts:272`). Ele roda nos projetos `chromebook` e `celular`.
   - A frase que aceitava a falha saiu da `techspec.md:117`, e a linha correspondente saiu da `7_task.md`.

A prisão do foco continua certa com o miolo na ordem do Tab. O seletor de `dialogo-modal.ts:13` já inclui `[tabindex]:not([tabindex="-1"])`, e a ordem do documento fica "Fechar", miolo, conteúdo, rodapé. O teste da galeria (`e2e/pecas-sobrepor.spec.ts:465-499`) continua valendo.

Recomendações:
- Dois comentários ficaram desatualizados: `apps/web/src/componentes/dialogo-modal.ts:26` e `apps/web/src/componentes/dialogo-modal.test.ts:31` ainda dizem que o miolo do painel tem `tabIndex={-1}`, fora da ordem do Tab. Basta tirar "o miolo do painel" dos dois.
- Com `tabIndex={0}`, o miolo vira parada do Tab em todo painel, mesmo quando não rola. Se isso incomodar em painel curto, a saída é tirar o miolo da ordem do Tab só quando ele não rola. Não é bloqueante.

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 12:01:27 · `tasks/prd-telas-da-coordenacao/7_task.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2, só as correções e o que elas afetam):
1. Enquanto os anos letivos carregam, a seção espera e não diz que falta o ano em curso.
2. O vínculo sem disciplina mostra "Sem disciplina".
3. Cada cláusula da 1ª rodada que tinha teste mas não tinha bloco agora tem bloco.
4. O vínculo pendente não deixa o professor abrir a turma.
5. Efeito da troca para `tabIndex={0}` no `PainelLado`, que é peça usada por várias telas.

Cobertos:
- **Correção 1**: o caso `carregando os anos` (`PainelDoProfessor.test.tsx:162`) usa `anos: nuncaResponde`. Exige "Carregando as turmas…" e que não apareçam nem o texto do ano em curso nem "Nenhuma turma.". Se a linha 117 for removida, `anoEmCurso` fica falso, o texto falso aparece e o teste fica vermelho. O bloco existe.
- **Correção 2**: o caso `o vínculo sem disciplina diz…` (`:244`) exige o item inteiro, `'7ºASem disciplinaEsperando o professor confirmar'`. A mutação para `?? ''` derruba o teste. O bloco existe.
- **Correção 3**: os sete blocos estão no documento. Conferi cada um contra o teste citado:
  - `&& !podeAcrescentar`: o teste `Professores.test.tsx:349` exige rodapé para quem não tem ação de convite.
  - `falhou !== undefined` e `consulta.isError`: o teste `:179` conta `/v1/anos-letivos` e `/v1/turmas` igual a 1 depois do "Tentar de novo".
  - `definirFaltando(!completo)` e a precedência `faltando`: no teste `:457`, a escolha completa precisa mostrar o texto do CONFLITO, e a incompleta precisa mostrar "Escolha a turma e a disciplina." enquanto o erro anterior ainda está na mutação.
  - `fecharSeAinda`: o teste citado existe, em `e2e/alocacao.spec.ts:323`.
  - `key={aberta.numero}`: tem caso novo próprio (`:532`), que exige a abertura nova com os dois selects vazios.
- **Correção 4**: `e2e/escola-montada.spec.ts:144` exige `Abrir a turma ${turma}` com contagem zero antes do "Confirmar", e depois do Confirmar o link aparece. O link e a região "Confirme suas turmas" vêm da mesma consulta (`areas/professor/Turmas.tsx:63,136`). Como a asserção roda depois de a turma aparecer na região, a lista já foi lida e o zero não passa por acaso. A tabela da `techspec.md` e a seção "Divergências" já apontam esse teste.
- **Item 5**: o bloco de `PainelLado.tsx` (`tabIndex 0 → -1`) fica vermelho no caso `o miolo rolável…` (`:170`). Também conferi `e2e/pecas-sobrepor.spec.ts:437-497`, que exige foco inicial no miolo e Tab preso no painel. As duas coisas continuam valendo, porque o miolo vem depois do "Fechar" na ordem do Tab. O e2e com três turmas agora chama `violacoesGraves` (`alocacao.spec.ts:272`).
- `npx vitest run apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx`: 29 de 29 passaram.
- Sem `.skip`, sem teste comentado e sem mock de código nosso. A rede é falsa, por caminho.

Bloqueantes: nenhum.

Recomendações:
1. O comentário de `apps/web/src/componentes/dialogo-modal.ts:26` ainda cita "o miolo do painel, focados por código (`tabIndex={-1}`)". Desde esta tarefa isso é falso. Basta corrigir o texto, a lógica da prisão de foco continua certa.
2. O caso `abrir de novo com o diálogo ainda aberto` (`PainelDoProfessor.test.tsx:532`) clica em "Acrescentar turma" com o diálogo aberto. No jsdom isso funciona porque o `showModal` falso não torna o fundo inerte. No navegador o painel fica inerte e o clique não acontece. O teste prova a garantia defensiva da `key`, que é o único efeito dela, mas o nome do caso deveria dizer que é essa garantia, e não um caminho que a pessoa consegue fazer.
3. O bloco `if (falhou !== undefined)` → `=== undefined` fica vermelho em parte porque a renderização quebra no início (`falhou.error` de `undefined`). Trocar por `if (false)` deixaria o vermelho só pela regra: o teste `:179` cairia por ficar em "Carregando" em vez de mostrar o erro.
4. `escola-montada.spec.ts:144` prova o lado da tela. A recusa da API ao pendente continua provada nos testes de integração do F1, e não nesta tarefa. Isso é aceitável, porque é a opção que a 1ª rodada ofereceu.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/PainelDoProfessor.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Alocacao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Professores.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/componentes/PainelLado.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/componentes/dialogo-modal.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/escola-montada.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/alocacao.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/7_task.md

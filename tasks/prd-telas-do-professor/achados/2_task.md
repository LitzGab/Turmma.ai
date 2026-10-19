# Achados das revisões — `tasks/prd-telas-do-professor/2_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-18 21:41:33 · `tasks/prd-telas-do-professor/2_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff só mexe em `apps/web`, no `e2e/` e em `docs/interface.md`, sem nada de API, job, seed ou importação. Todos com autor humano? sim, porque nenhum caminho foi criado ou alterado.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok.
- Aprovar e rejeitar continuam em "O que o Assistente fez" (foto `professora--professor-time-assistente--computador.png`).
- A linha "Aprovada por … · data" e o "Rejeitar…" aparecem na foto.
- Os textos que antes mandavam a decisão para "Seu time" agora dizem onde ela está. Foram trocados em `apps/web/src/areas/professor/Aprovar.tsx:168` e `apps/web/src/areas/professor/Artefato.tsx:37`. Nenhum deles afirma a decisão sem dizer quem decidiu.
- "Voltar para a turma" passa por `caminhoDeVoltaDaCorrecao` (`apps/web/src/areas/professor/aprovar.ts:328`) e tem mutação.
- A exceção da D47 não aparece em outro agente.

Supervisão do tutor: ok.
- A tela do Tutor saiu da lateral, mas continua a um gesto de qualquer tela pelo pé do sino, no grupo "Acompanhar a IA". O sino está em toda rota do professor (`apps/web/src/areas/professor/rotas.tsx:44`).
- O pé aparece em toda situação da leitura: carregando, erro, lida em parte e vazia (`apps/web/src/componentes/sino/Sino.tsx:225`). Mutação e teste de unidade provam isso.
- O caminho até o Tutor é provado no e2e nos projetos `chromebook` e `celular`, em `e2e/professor-lugares.spec.ts:55` e `e2e/professor-tutor.spec.ts:25`.
- O link do Tutor não leva número, o que respeita a D59 (`e2e/professor-tutor.spec.ts:102`).
- A tela continua sem conteúdo de conversa, sem tempo parado e sem inferência emocional (foto `professora--professor-time-tutor--computador.png`).

Autonomia declarada e visível: sim. "O que o Tutor faz sozinho, e o que você vê aqui" e "O que cada função faz sozinha, e o que espera você" aparecem nas duas telas, nas fotos de computador e de celular. Nenhuma foto mostra nota, conceito ou sugestão de nota em discursiva ou redação. O selo "IA" está presente em toda saída de agente.

Bloqueantes: nenhum.

Recomendações:
1. `apps/web/src/areas/professor/SinoDoProfessor.tsx:11` e `docs/interface.md:102-103` dizem que o Tutor fica "a um clique, de qualquer tela". São dois cliques: abrir o sino e depois o link. Melhor escrever "pelo sino, de qualquer tela", para a afirmação de conformidade não prometer o que a tela não faz.
2. As fotos `professora--professor-nova-conversa--Esperando-você--celular.png` e `vazia--professora--professor-nova-conversa--Esperando-você--celular.png` saíram sem o painel do sino aberto. A captura em 360 px não acionou o botão, cujo texto fica só para o leitor de tela abaixo de 768 px. O e2e prova o pé no celular, mas a vitrine deveria mostrar o pé também no celular, para quem audita pela foto.
3. Dois títulos de teste ainda citam "Seu time" (divergência declarada na tarefa). O corpo já prova a lateral nova. Quando a 10.0 passar pelo segundo título, vale renomear os dois.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-18 21:43:25 · `tasks/prd-telas-do-professor/2_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Os lugares:** Início, Turmas e Ferramentas, nesta ordem, sem `navigation "Seu time"` em nenhuma largura, e na barra de baixo no celular.
- **"Seu time" tem tela:** pelo pé do sino abrem as entregas (com aprovar e rejeitar) e as funções do Assistente, e os sinais, a atenção humana, o uso por aluno e as funções do Tutor. O pé aparece em toda situação da leitura e não entra no número do sino. Pela regra 70, item 4, o Tutor nunca pode ficar fora de alcance.
- **Nenhum texto diz "Seu time":** em cada tela do professor.
- **"Voltar para a turma" em Aprovar:** leva à turma da correção e, sem ela, à lista de turmas.
- **A separação não perde caso:** os títulos de `test(` ficam os mesmos, fora os declarados.
- **Recomeço:** os casos de `areas` e `troca-de-escola` continuam.
- **Isolamento:** a cena do sino entre escolas continua em `professor-sino`.
- **Concorrência:** a tarefa não cria operação nova que possa acontecer duas vezes. O clique duplo em aprovar foi movido sem mudança para `professor-aprovar.spec.ts:118`.

**Cobertos:**
- **Os lugares:** `navegacao.test.ts` (W2, sem `SEU_TIME` exportado), `CascaDaEscola.test.tsx` (a ordem nas três larguras, nenhum `nav "Seu time"`, e a casca só lê `/v1/eu`), `itens-da-lateral.test.tsx`, `areas.spec.ts`, `casca.spec.ts`, `casca-no-celular.spec.ts` e `professor-lugares.spec.ts`.
- **O pé do sino:** `Sino.test.tsx` cobre as quatro situações, a posição depois dos itens, o contador e o pé sem link. `SinoDoProfessor.test.tsx` cobre os dois destinos. No e2e, `professor-sino.spec.ts` e `professor-lugares.spec.ts`.
- **As duas telas:** `professor-entregas.spec.ts` e `professor-tutor.spec.ts`, com as asserções movidas.
- **As cinco mutações:** conferi cada bloco contra o diff. Cada uma deixa vermelho o teste citado, pelo motivo certo.
- **Os títulos:** comparei a lista ordenada dos títulos de `test(` em `e2e/` antes e depois. Só mudaram os quatro de `casca:468` e `areas:151`, que a tarefa declara. Os títulos dos dez specs novos são idênticos aos dos dois removidos.
- **Testes de unidade:** rodei os sete arquivos de unidade da tarefa e todos passam. Seis passam rodando de `apps/web`. O `aprovar.test.ts` só resolve `@educa/shared` rodando da raiz, e ali passa os 12 casos.
- **Proibidos:** nenhum `.skip`, nenhum teste comentado, nenhum mock de coisa nossa, nenhum provedor pago.

**Bloqueantes:**

1. **Os textos novos da 2.3 em Aprovar, Artefato e Home não têm teste na tela, e "Voltar para a turma" não tem teste no componente.**
   - **O que está errado:** a mutação de `aprovar.ts` prova só a função `caminhoDeVoltaDaCorrecao`. Nenhum teste desenha `Aprovar.tsx`: não há teste de componente, e `e2e/professor-aprovar.spec.ts` não procura o link.
   - **Consequência:** `apps/web/src/areas/professor/Aprovar.tsx:224-227` pode voltar a `to={ROTAS_DO_PROFESSOR.timeDoAssistente}` com o texto "Voltar para o Seu time", ou passar `undefined` no lugar de `entregaInteira?.turmaId`, e a suíte inteira fica verde.
   - **A varredura de "Seu time" não chega lá:** `getByText(/Seu time/)` só roda em `e2e/professor-lugares.spec.ts:29,53,59,65`, sobre Início, as duas telas do time, Turmas e Ferramentas. Ficam de fora justamente as telas cujos textos a tarefa trocou:
     - `Aprovar.tsx:181`: o vazio "aparece em “Esperando você”, no sino".
     - `Aprovar.tsx:253`: os textos de rejeitada e de já decidida.
     - `Artefato.tsx:37`: "A decisão desta versão está em…".
     - `Artefato.tsx:193-195`: o "Ver e decidir" da versão pendente.
     - `Home.tsx:142`: "Há mais entregas esperando você…", que só aparece com `proxima`, e nenhum caso monta esse estado.
   - Conversa e turma aberta também não passam pela varredura.
   - **Correção exigida:**
     - Em `e2e/professor-aprovar.spec.ts`, no caso com dado, conferir o link "Voltar para a turma" com `href` `/professor/turmas/<turmaId>`, e `getByText(/Seu time/)` com contagem 0 no vazio, com dado e na rejeitada. O caso pode ser de componente, desde que desenhe `Aprovar` de verdade.
     - Em `e2e/professor-artefato.spec.ts`, a mesma contagem 0 na versão pendente e na decidida, e o link "Ver e decidir" levando a `/professor/time/assistente`.
     - Em `e2e/professor-inicio.spec.ts`, um estado com `proxima` que mostre o texto novo e nenhum "Seu time".
     - Estender a varredura a conversa e turma aberta.
     - Declarar, na seção "Mutações", um bloco que troque o argumento em `Aprovar.tsx` e que o teste novo deixe vermelho.

**Recomendações:**
- `abrirEntregasDoAssistente` e `abrirSinaisDoTutor` (`e2e/__fixtures__/professor/entregas.ts`, `tutor.ts`) não esperam o endereço de destino, e quem chama depende da asserção seguinte. Pôr o `toHaveURL` dentro da fixture.
- No caso dividido de `areas.spec.ts:184`, a volta ao Início perdeu o `toHaveURL(/\/professor\/nova-conversa$/)` que o caso original tinha. O título continua conferido, então é pouco, mas a divergência registrada diz que nenhuma asserção saiu.
- Os títulos que ainda dizem "Seu time" (`professor-lugares.spec.ts:19`, `professor-tutor.spec.ts:17-18` e os `describe` de `professor-entregas.spec.ts`) ficaram como estavam por decisão registrada. Vale trocá-los quando o dono da spec decidir, porque hoje o título descreve uma lateral que não existe mais.
- `apps/web/src/areas/professor/aprovar.test.ts` só resolve `@educa/shared` rodando da raiz. É do ambiente, não da tarefa, mas confunde quem roda o teste de dentro de `apps/web`.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Aprovar.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Artefato.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Home.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-aprovar.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-artefato.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-inicio.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-lugares.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/prd-telas-do-professor/2_task.md

## revisor-geral · 1ª rodada · APROVADO · 2026-10-18 21:43:56 · `tasks/prd-telas-do-professor/2_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

**O que conferi**
- **Títulos dos testes:** comparei os títulos de `test(` em `e2e/` entre o HEAD e a árvore. Passam de 508 para 510, e as únicas diferenças são as quatro linhas de `casca:468` e `areas:151` que a divergência declara.
- **Corpo dos 21 casos movidos:** 12 estão idênticos. Os outros 9 mudam só onde o grupo sumiu: a lateral e o contador trocados pelo sino e pelo pé dele, os textos da 2.3, e `entrar` com `{ antes }` no lugar do parâmetro solto. Nenhuma prova de regra (nota, rejeição, destaque, sinal sem conteúdo) foi enfraquecida.
- **Divergências:** a da régua de duração está na `techspec.md` §10 pelo commit `23e8794`, na branch `spec/telas-do-professor`. Esse commit ainda não está no HEAD desta linha e entra no encontro. A dos títulos com "Seu time" está coberta pela §10 ("A separação dos specs"). Esta spec não tem `cenarios.md`.
- **Fora do escopo, nada foi feito:** sem Criados na lateral, sem recompor tela e sem redirecionar `Tutor.tsx` para Hoje.
- **Regra 70, item 4:** o pé do sino aparece nas quatro situações da leitura (em dia, carregando, lida em parte, com erro). Isso está provado em `Sino.test.tsx`, e o Tutor continua acessível.

**Recomendações**
1. **Código morto:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/entregas.ts:52`. Desde que a casca deixou de ler entregas, `quantasEsperam` e o tipo `QuantasEsperam` só são usados pelo próprio teste (`assistente-e-entregas.test.ts:176-182`). O comentário da linha 18 ainda diz que "a tela diz que há mais (`quantasEsperam`)", o que não é mais verdade. Remover a função e o teste dela, ou apontar quem passa a usá-la.
2. **"A um clique" está errado:** chegar ao Tutor agora leva dois cliques (abrir o sino, depois o link). O texto aparece em `apps/web/src/areas/professor/SinoDoProfessor.tsx:11` e em `docs/interface.md`, na Parte A, seção 1. Trocar por "a dois cliques, pelo sino" ou "pelo sino, de qualquer tela".
3. **Tech Spec desatualizada sobre o `Sino`:** a §2 e a §5 ("Montagem") falam em três props opcionais na peça, mas agora há uma quarta, `pe`. Não muda a arquitetura (a §5 já pede "o pé do sino tem os dois links"), mas vale registrar.
4. **Fotos do celular sem a lista aberta:** nas duas fotos "Esperando você" do celular (escola cheia e vazia) a lista não aparece aberta, então a vitrine não mostra o pé a 360 px. O e2e cobre esse caso no projeto `celular`, mas vale ajustar o clique da vitrine.
5. **Teste frágil:** `apps/web/src/areas/navegacao.test.ts:94` compara a lista inteira de exports de `navegacao.ts` com igualdade exata, e qualquer export novo quebra o teste. Melhor checar só a ausência: `expect(navegacao).not.toHaveProperty('SEU_TIME')`.
6. **Dois jeitos de achar o sino nas fixtures:** `abrirOSino` em `e2e/__fixtures__/professor/cena.ts` monta o mesmo localizador que `sinoDe`, em `e2e/__fixtures__/professor/sino.ts`. Fazer um usar o outro.
7. **Fixture sem uso:** `abrirOQueFoiGerado` (`e2e/__fixtures__/professor/criados.ts`) foi pedida pela 2.4, mas nenhum spec a chama. Tudo bem se a 5.0 for a primeira a usar; senão, ligar a um spec agora.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-18 21:44:46 · `tasks/prd-telas-do-professor/2_task.md`

VEREDITO: APROVADO

Tela vista: sim (24 fotos lidas: Início, Turmas, Ferramentas, "O que o Assistente fez" e "O que o Tutor viu", em 1366 e 360 px, na escola cheia e na vazia, mais o sino aberto). As duas fotos do sino aberto a 360 px (cheia e vazia) saíram sem a lista. A vitrine abre o sino a 1366 px e só depois reduz a janela a 360 px, e a redução fecha o painel. Refiz a conferência a 360 px com toque, em script meu, e o painel abre como folha de baixo, sem rolar de lado, com as duas linhas do pé, cada uma com cerca de 66 px de altura.

Estados: ok.
- O sino tem carregando, erro, parcial e vazio ("Tudo em dia"). O pé aparece em todos esses estados, em `apps/web/src/componentes/sino/Sino.tsx:225`, e o teste da tarefa cobre isso.
- Os estados das duas telas do time e de Aprovar já existiam e não mudaram.
- O vazio de "O que o Assistente fez" convida com "Pedir ao Assistente" e "Ver as ferramentas". O do Tutor explica quando o aviso aparece.

Acessibilidade:
- O pé é uma `section` com nome e links de verdade, dentro do `PainelLado`: o Tab fica preso, o Esc fecha e o foco volta ao sino.
- O botão do sino mantém o nome acessível "Esperando você, N".
- Nenhum texto de tela diz "Seu time". Conferi no código; sobram só dois comentários, em `navegacao.ts:61` e `SinoDoProfessor.tsx:10`.
- O português está correto, com aspas tipográficas.

Chromebook fraco: sem peso novo.
- Saiu da casca uma consulta de entregas pendentes, a do contador do "Seu time".
- O pé é estático.
- Rolam a 1366 × 768 a Ferramentas (846 px) e "O que o Assistente fez" (887 px). Não é bloqueante nesta tarefa: nenhuma das duas foi recomposta aqui, só `Time.tsx` teve texto trocado. A recomposição de Ferramentas é da 7.0, cujo mockup (`mockup.md:208`) manda o corpo rolar por dentro.

Celular:
- Nenhuma tela das fotos rola de lado a 360 px.
- A barra de baixo mostra Início, Turmas e Ferramentas, nessa ordem, com alvo de 44 px.
- O sino, o "Sair" e "Abrir a turma" ficam acessíveis.
- O Tutor segue a um toque do sino em qualquer tela, o que atende a regra 70, item 4.
- Nenhum fluxo exige o celular.

Ação oficial protegida: sim. A tarefa não altera Aprovar nem as decisões. Troca só o texto e o destino de "Voltar para a turma" (turma da correção, ou lista de Turmas enquanto a entrega não chegou). Aprovar e Rejeitar continuam à vista no cartão, com o que está sendo decidido.

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
1. Os nomes do pé não batem com os títulos das telas. O link diz "O que o Assistente fez" e "O que o Tutor viu", e as telas se chamam "Assistente de ensino" (`apps/web/src/areas/professor/Time.tsx:178`) e "Tutor" (`apps/web/src/areas/professor/Tutor.tsx:66`). O título da aba é igual ao do `h1`. Quem clica num nome chega em outro. Sugestão: o `h1` e o título da aba repetirem o nome do link.
2. Na Home, a escola vazia mostra só a caixa de pedido, sem nenhum convite abaixo (`vazia--professora--professor-nova-conversa--computador.png`). É a regra 50, item 6, e a Home é da 3.0. Garanta lá que a Home com turma nunca fique sem convite.
3. Em `professora--professor-time-assistente--celular.png`, as abas "Tudo / Esperando você / Correção / Adaptação" quebram em duas linhas a 360 px. Ficam legíveis e clicáveis, mas é o único ponto apertado desta tela. Vale tratar na tarefa que recompuser as abas da turma.
4. A foto do sino aberto a 360 px não sai com `--clicar`, porque a vitrine reduz a janela depois do clique. Registre no `/retro` para a vitrine abrir o clique já no tamanho do celular.

Arquivos consultados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/componentes/sino/Sino.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/SinoDoProfessor.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Aprovar.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/navegacao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/componentes/CascaDaEscola.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/docs/interface.md`

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-18 22:36:35 · `tasks/prd-telas-do-professor/2_task.md`

VEREDITO: APROVADO

Tela vista: sim (24 fotos lidas, 12 telas a 1366 px e a 360 px, na escola cheia e na vazia). Na foto do celular com o sino aberto, a lista não aparece, como o prompt avisou. O e2e do projeto `celular` cobre esse caso.

Estados: ok.
- Os estados vazios convidam a agir.
  - Na Home vazia, a caixa do Assistente continua à vista e o bloco "Esperando você" some.
  - No sino vazio, "Tudo em dia" vem com o pé "Acompanhar a IA".
  - Em Ferramentas, "Nada gerado ainda" diz o que fazer.
  - Nas telas do Assistente e do Tutor, os vazios dizem o próximo passo.
- Carregando e erro eu confiro pelo código e pelo e2e, não pela vitrine. A diferença desta rodada deixa os e2e de carregando e erro da tela de aprovar e do artefato intactos. A Home ganhou uma asserção com `carregarSemRedeLenta`.

Acessibilidade: sem mudança em tela. Na foto, o foco e o contraste seguem o padrão da rodada anterior. Os e2e continuam rodando `violacoesGraves`.

Chromebook fraco: sem mudança. A diferença desta rodada em `apps/web/src` é só código morto removido (`quantasEsperam`) e um comentário. Procurei no repositório e não sobrou nenhum uso de `quantasEsperam`.

Celular: ok a 360 px.
- Não há rolagem horizontal nem texto cortado em nenhuma das 12 telas.
- O "Aprovar" na lista do Assistente aparece como botão escuro grande, e "Rejeitar…" ao lado.
- Os botões do cabeçalho (sino e "Sair") e a barra inferior têm tamanho de toque confortável.
- Na foto do celular, a barra inferior fixa cobre trechos da página porque a captura é de página inteira. É efeito da captura, não defeito.

Rolagem a 1366 × 768: Ferramentas (846 px e 784 px na vazia) e a tela do Assistente (887 px) passam da janela. São listas de conteúdo, e nenhum PRD ou mockup diz que só o miolo rola nelas. Não bloqueia.

Ação oficial protegida: sim.
- A decisão continua pelo caminho único com a entrega à vista: título, turma e selo de IA.
- A diferença só acrescenta e2e que provam que, sem a leitura das entregas, a tela não afirma quem decidiu. Ela diz "Esta correção foi rejeitada… está em O que o Assistente fez, pelo sino" e mostra a decisão com autor e data.
- Toda saída de IA da tela leva o selo "IA".

Correções exigidas da rodada anterior: não havia nenhuma, e as recomendações já tinham sido aplicadas (código morto, comentários, `docs/interface.md`, fixtures, testes). Conferi cada item da diferença de 356 linhas.
- O texto "Há mais entregas esperando você. Veja no sino “Esperando você”." existe em `Home.tsx:142`, e o e2e `professor-inicio` cobre o caso.
- `navegacao.test.ts` agora afirma que `SEU_TIME` não existe, o que é mais firme que a lista de chaves de antes.
- Os e2e novos esperam a URL de chegada antes de seguir, e isso tira a corrida do sino.
- Nenhum texto de tela diz "Seu time", e os e2e agora provam isso em várias telas.

Bloqueantes: nenhum.

Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/navegacao.ts:61` e em `SinoDoProfessor.tsx:10`, os comentários ainda citam "Seu time" como histórico. Isso não vaza para o usuário, mas pode ser trocado por "a antiga lateral do time".
- Nos dados de teste da vitrine, os sufixos (`c5064cf7`, `92dabddc`) aparecem nos nomes de turma, escola e professora. São artefato da vitrine e não vêm do código. Ninguém precisa agir, mas vale lembrar na validação para ninguém achar que é vazamento de id.
- No sino aberto a 360 px, a vitrine perde a lista. Convém que a validação veja o caso pelo e2e `celular`, não pela foto.

## test-engineer · 2ª rodada · APROVADO · 2026-10-18 22:36:36 · `tasks/prd-telas-do-professor/2_task.md`

VEREDITO: APROVADO

Cenários exigidos: o link "Voltar para a turma" de Aprovar leva à turma da correção quando a entrega já foi lida, e à lista de turmas quando ela não existe ou ainda não chegou. Nenhuma tela que a 2.3 mudou diz "Seu time": Aprovar (vazia, com dado, rejeitada, e as duas mensagens de quando falta a leitura das entregas), Artefato (pendente, decidida, e a mensagem de quando falta a leitura), Home (com `proxima`), conversa e turma aberta. "Ver e decidir" leva a `/professor/time/assistente`. Também pedi que a seção "Mutações" tivesse um bloco que troca o argumento em `Aprovar.tsx`, e que as recomendações de `toHaveURL` fossem aplicadas.

Cobertos (confirmei cada correção da 1ª rodada no diff e no documento da tarefa):
- **Link de volta em Aprovar.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-aprovar.spec.ts:185` confere `href` `/professor/turmas` na correção que não existe. A linha 194 confere `/professor/turmas/${turmaId}` com dado. Contagem 0 de "Seu time" no vazio, com dado e na rejeitada (linhas 184, 195, 203).
- **Mensagens de quando falta a leitura das entregas.** Com `api.entregas = []` e a página recarregada, o teste confere o texto novo de rejeitada e de já decidida, os dois com contagem 0 de "Seu time" (linhas 206-216). As duas mensagens existem em `Aprovar.tsx:265`.
- **Artefato.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-artefato.spec.ts:236` confere "Ver e decidir" levando a `/professor/time/assistente`. Contagem 0 na pendente, na rejeitada e na mensagem "A decisão desta versão está em…" (linhas 237, 245, 256-257), que corresponde a `Artefato.tsx:37`.
- **Home com `proxima`.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-inicio.spec.ts:311-316` monta a página de pendências cheia e confere o texto novo. A linha 298 confere que ele não aparece sem pendência, e a 322 a contagem 0.
- **Varredura estendida a conversa e turma aberta.** Conversa em `professor-conversa.spec.ts:115` e `:221`, turma aberta em `professor-turma-aberta.spec.ts:21` e `:49`, e a conversa também em `professor-lugares.spec.ts:70`. Em `apps/web/src` já não sobra "Seu time" que a pessoa veja: só aparece em comentários e em asserções negativas.
- **Mutações.** Há blocos novos para `Aprovar.tsx` (`caminhoDeVoltaDaCorrecao(undefined)`, que o caso com dado deixa vermelho pelo `href` da turma), para `Artefato.tsx` (o destino de "Ver e decidir") e para `Home.tsx` (o aviso de `proxima`). Os três trechos existem no código: `Aprovar.tsx:168`, `Artefato.tsx:195`, `Home.tsx`. O nome do teste citado em cada bloco é o começo do título real do caso.
- **Recomendações aplicadas.** `toHaveURL` foi posto dentro de `abrirEntregasDoAssistente` e de `abrirSinaisDoTutor`, e em `areas.spec.ts:208`, depois de `voltarAoInicio`.
- **Código morto.** `quantasEsperam` saiu junto com os dois testes dele, e não sobra referência nenhuma.
- Não há `.skip`, `.only` nem `fixme` em `apps/web/src` nem em `e2e/`. Rodei `npx vitest run` em `assistente-e-entregas.test.ts` e `navegacao.test.ts`: 21 de 21 verdes. Os e2e não rodei: o portão da tarefa já provou as mutações.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/navegacao.test.ts:98`: a lista completa do que `navegacao.ts` exporta virou só `not.toHaveProperty('SEU_TIME')`. A regra continua provada pelas asserções sobre os nomes de cada papel (linhas 95-96). Só que um grupo de agentes exportado com outro nome deixou de ser pego por esta linha. Vale explicar no teste por que a lista saiu, ou trazê-la de volta.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-18 22:38:21 · `tasks/prd-telas-do-professor/2_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta rodada. O diff só mexe na web, na documentação e nos testes de e2e, e não toca API, job, seed, importação nem webhook. Todos com autor humano? sim, sem mudança desde a 1ª rodada.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. Aprovar e Artefato continuam dizendo quem decidiu. Quando a leitura das entregas falta, a tela não afirma a decisão sem o autor e manda a professora a "O que o Assistente fez", pelo sino (`apps/web/src/areas/professor/Aprovar.tsx:265`, `apps/web/src/areas/professor/Artefato.tsx:37`). Os novos casos de `e2e/professor-aprovar.spec.ts` e `e2e/professor-artefato.spec.ts` provam isso.
Supervisão do tutor: ok. "O que o Tutor viu" está no pé do sino, que aparece em toda tela, no computador e no celular, com a escola cheia e com a vazia (fotos `professora--professor-nova-conversa--Esperando-você--computador.png` e `vazia--professora--professor-nova-conversa--Esperando-você--computador.png`). A tela do Tutor diz "Não há uso do Tutor que você não veja" e "O conteúdo da conversa não aparece". Mostra só uso e dificuldade, sem nada de comportamento ou emoção (`professora--professor-time-tutor--computador.png` e `--celular.png`). As fixtures `e2e/__fixtures__/professor/tutor.ts:7` e `entregas.ts:7` agora confirmam que a URL chegou à tela.
Autonomia declarada e visível: sim. Cada tela de agente tem o painel "O que cada função faz sozinha, e o que espera você" ou "O que o Tutor faz sozinho, e o que você vê aqui", em português comum, com o selo "IA" e a assinatura da função (fotos `professora--professor-time-assistente--computador.png` e `professora--professor-time-tutor--computador.png`).

**A correção exigida foi feita:** "a um clique" virou "pelo sino, de qualquer tela" em `apps/web/src/areas/professor/SinoDoProfessor.tsx:11` e em `docs/interface.md:102-103`.

**O resto do diff, pela regra 70:**
- `quantasEsperam` saiu de `apps/web/src/api/entregas.ts`, e nada mais o usa. A Home avisa que há mais entregas pela `proxima` (`apps/web/src/areas/professor/Home.tsx:142`), e `e2e/professor-inicio.spec.ts` prova esse aviso.
- Nenhuma tela mostra nota, conceito ou sugestão de nota (D55).
- Nada nas telas induz uso: o contador "0 de 300" mostra o limite, sem recompensa.

Bloqueantes: nenhum.

Recomendações:
- A asserção `expect(navegacao).not.toHaveProperty('SEU_TIME')` em `apps/web/src/areas/navegacao.test.ts:62` é mais fraca que a lista exata de chaves que ela substituiu. Ela não pega uma exportação nova com outro nome que volte a pôr os agentes na lateral. Vale manter a lista exata, ou procurar o nome das telas dos agentes nos itens da lateral, como o próprio teste já faz nas linhas acima.

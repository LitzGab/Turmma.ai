# Validação — lgpd-e-titular (F3)

## Rodada 2 — 11/10/2026

**Escopo:** funcionalidade completa
**Commit validado:** `0021957`
**Veredito: APROVADA**

O crítico da rodada 1 está corrigido e provado: na escola sem ano letivo em curso, a coordenação lista, busca, registra,
abre, corrige, conclui e cancela pedidos, só sem a turma na linha. Os dois maiores foram tratados nos documentos. Os 21
RF estão atendidos, o portão completo vale para este commit e não há crítico nem maior.

O que mudou desde a rodada 1 (`git diff 2b653d7..0021957`): um arquivo de código
(`apps/api/src/privacidade/titulares.repository.ts`), dois de teste (`apps/api/test/pedido-titular.int.test.ts`,
`e2e/pedidos-do-titular.spec.ts`) e documentos. `apps/web`, `apps/worker`, `packages` e `infra` não mudaram.

Como conferi nesta rodada:

- Li de novo o PRD, a Tech Spec inteira, o `tasks.md`, o bloco do F3 no `ROADMAP.md`, o documento e os achados da
  correção (`tasks/correcoes/2026-10-11-pedidos-sem-ano-em-curso.md`), o repository corrigido por inteiro e o service
  que o chama.
- Fiz 3 provas de mutação, todas vermelhas, e rodei o arquivo de integração inteiro no código real (24 de 24).
- Rodei `e2e/pedidos-do-titular.spec.ts` contra o ambiente de teste: 24 de 24, nos projetos `chromebook` e `celular`,
  com o caso novo da escola sem ano.
- Fotografei e li as telas de todo RF com tela, no computador (1366 px) e no celular (360 px), na escola cheia e na
  vazia, e de novo com o ano da escola em `encerrado`.
- Com o ano em `encerrado`, registrei pela API de teste uma eliminação, uma portabilidade e um acesso: os três
  responderam 201, o detalhe abriu, o cancelamento respondeu 204 e o worker montou os dois arquivos (`pronto`).
- Conferi que cada linha de teste citada na rodada 1 ainda aponta para o caso certo. Duas mudaram de lugar, porque o
  arquivo ganhou 80 linhas: a concorrência do pedido está agora em `pedido-titular.int.test.ts:1141` e `:1212`.
- Procurei outra dependência de ano em curso no código do F3 (`apps/api/src/privacidade`, `packages/nucleo/src/titular`,
  `retencao`, `ciclo-de-vida` e os processadores do worker): não há nenhuma chamada a `exigirAnoEmCurso`.

### 1. RF a RF

Para os RF cujo código não mudou, o código e o teste são os da rodada 1 (tabela abaixo dela), que continuam valendo
linha a linha. Aqui ficam a situação de cada um e o que vi nesta rodada. As fotos estão em `.processo/vitrine/`.

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `packages/shared/src/privacidade/classificacao.ts`, `retencao.ts` | `apps/api/test/arquitetura.test.ts:1205`, `:1214`, `:1224`; `apps/api/test/retencao.int.test.ts:100` | Sem mudança |
| RF2 | ATENDIDO | `apps/api/src/ops/retencao.ts` | `apps/api/test/retencao.int.test.ts:119`, `:278`, `:303` | Sem mudança |
| RF3 | ATENDIDO | `apps/web/src/areas/coordenacao/privacidade/Retencao.tsx` | `e2e/privacidade.spec.ts:68`, `:114` | Fotos: `coordenacao--coordenacao-privacidade-retencao--Ver-depois--computador-1.png` e `--celular-1.png`. Doze categorias com prazo, início da contagem e origem, e os prazos que não mudam; no celular vira cartão |
| RF4 | ATENDIDO | `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` | `apps/worker/test/expurgo-da-escola.int.test.ts:587` | Sem mudança. Mutação da rodada 1 |
| RF5 | ATENDIDO | `apps/worker/src/processadores/expurgar-escola.ts`; `infra/grafana/alertas/expurgo-noites-incompletas.yaml` | `apps/worker/test/expurgo-da-escola.int.test.ts:695`, `:838`, `:1058`, `:2476`, `:2505`; `infra/test/alerta-do-expurgo.int.test.ts:83` | Sem mudança |
| RF6 | ATENDIDO | `apps/api/src/ops/suboperador.ts` | `apps/api/test/suboperador.int.test.ts:170` | Sem mudança |
| RF7 | ATENDIDO | `packages/nucleo/src/titular/suboperador-da-escola.repository.ts`; `EmpresasQueRecebemDados.tsx` | `apps/api/test/suboperador.int.test.ts:292`, `:309`; `e2e/privacidade.spec.ts:254`, `:316` | Fotos: `coordenacao--coordenacao-privacidade-suboperadores--Ver-depois--computador.png`, `--celular-1.png` e `vazia--coordenacao--coordenacao-privacidade-suboperadores--celular.png`. Vigentes e passadas separadas, com o selo do treinamento em texto e ícone. A escola vazia mostra só a empresa que atende todas, que semeei; o estado sem empresa nenhuma fica com o e2e (`:316`) |
| RF8 | ATENDIDO | `apps/api/src/ops/incidente.ts` | `apps/api/test/incidente.int.test.ts:171`, `:207`, `:568` | Sem mudança |
| RF9 | ATENDIDO | `packages/nucleo/src/titular/incidente-da-escola.repository.ts`; `AvisoDeIncidente.tsx`, `Incidentes.tsx` | `apps/api/test/incidente.int.test.ts:398`, `:490`; `infra/test/alerta-do-incidente.int.test.ts:81`; `e2e/incidentes.spec.ts` | Fotos: `coordenacao--coordenacao-governanca--computador.png` e `--celular-1.png` (o aviso ao entrar), a faixa "Ver o aviso" em todas as fotos `--Ver-depois--`, `coordenacao--coordenacao-privacidade-incidentes--Ver-depois--computador.png` e `--celular-1.png`, `vazia--coordenacao--coordenacao-privacidade-incidentes--computador.png` |
| RF10 | **ATENDIDO** (era PARCIAL) | `apps/api/src/privacidade/titulares.repository.ts:211-214` (`#vinculosDe`: sem ano em curso, o mapa vem vazio e não há consulta); `apps/api/src/privacidade/privacidade.service.ts:222-290` | `apps/api/test/pedido-titular.int.test.ts:1061` ("depois de encerrar o ano, a busca, o registro, a lista, o detalhe, o corrigir nome, o concluir e o cancelar respondem, só sem turma nem disciplina; e B continua sem alcançar A"); `e2e/pedidos-do-titular.spec.ts:695` ("sem ano em curso…, a lista, a busca, o registro e o detalhe funcionam, só sem a turma"); `apps/api/test/pedido-titular.int.test.ts:260`, `:977` | Mutações 1, 2 e 3. Fotos com ano em curso: `coordenacao--coordenacao-privacidade-pedidos--Ver-depois--computador.png`, `--celular-1.png`, `…--Ver-depois-Registrar-pedido--computador.png`, `--celular-1.png`, `vazia--coordenacao--coordenacao-privacidade-pedidos--computador.png`, `--celular.png`. Sem ano em curso: `sem-ano-r2/sem-ano--coordenacao--coordenacao-privacidade-pedidos--Ver-depois--computador.png` e `--celular-1.png`: os cinco pedidos aparecem, com "Sem turma neste ano" |
| RF11 | ATENDIDO | `packages/nucleo/src/titular/leitura-do-titular.ts`; `apps/worker/src/processadores/montar-arquivo.ts` | `apps/api/test/arquivo-do-titular.int.test.ts:418`, `:462`, `:730`; `apps/api/test/arquitetura.test.ts:1310` | Sem mudança. Com o ano encerrado, o worker montou o arquivo do acesso e o da portabilidade que registrei pela API |
| RF12 | ATENDIDO | `packages/nucleo/src/titular/arquivo-do-titular.repository.ts`; `apps/web/src/componentes/meus-dados/MeusDados.tsx` | `apps/api/test/arquivo-do-titular.int.test.ts:629`, `:754`, `:931`, `:979`; `e2e/meus-dados.spec.ts` | Fotos: `aluno--aluno-privacidade--computador.png`, `aluno--aluno-privacidade--Baixar-meus-dados--celular.png` (o diálogo diz o que o arquivo traz e manda apagar no computador da escola), `professora--professor-meus-dados--computador.png`, `--celular.png`, `vazia--aluno--aluno-privacidade--celular.png`, `vazia--professora--professor-meus-dados--computador.png`. Sem ano em curso: `sem-ano-r2/sem-ano--aluno--aluno-privacidade--celular.png` e `sem-ano--professora--professor-meus-dados--computador.png`, iguais às de ano em curso |
| RF13 | ATENDIDO | `packages/nucleo/src/titular/compartilhamento.ts` | `apps/api/test/compartilhamento.int.test.ts:203`, `:284`, `:427` | Foto: `coordenacao--coordenacao-privacidade-pedidos-01a1299e-ffff-7000-8000-0000000000a2--Ver-depois--celular-1.png` e `--celular-2.png`: empresas pelo nome do cadastro, com período e origem, "Provedor não cadastrado: <chave>" e o aviso do art. 18, § 6º |
| RF13b | ATENDIDO | `apps/api/src/privacidade/privacidade.service.ts:332` | `apps/api/test/pedido-titular.int.test.ts:454`, `:591`; e, sem ano em curso, `:1061` | Foto: `…-0000000000a3--Ver-depois--celular.png` ("Corrigir nome", "Ir para a Estrutura") |
| RF14 | ATENDIDO | `packages/nucleo/src/identidade/avaliar-sessao.ts:31`; `privacidade.service.ts:315` | `apps/api/test/eliminacao-agendada.int.test.ts:185`, `:450`, `:575`, `:613`, `:629`; `apps/worker/test/eliminar-titular.int.test.ts:274`; e o cancelamento sem ano em curso em `pedido-titular.int.test.ts:1061` | Fotos: `…-0000000000a4--Ver-depois--computador.png` e `--celular.png` (eliminação agendada, com "Cancelar eliminação"), as mesmas duas em `sem-ano-r2/` (o detalhe abre e o botão está lá), e `suspenso/acesso-suspenso--aluno--computador.png`, `--celular.png` (da rodada 1; a web não mudou) |
| RF15 | ATENDIDO | `packages/nucleo/src/titular/eliminacao-do-titular.ts`, `troca-de-nome.ts`, `homonimo.ts` | `apps/worker/test/eliminar-titular.int.test.ts:331`, `:571`, `:612`, `:753` | Sem mudança |
| RF16 | ATENDIDO | `apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.ts:28` | `textos-do-pedido.test.ts`; `e2e/pedido-do-titular.spec.ts:118` | Fotos: `…-0000000000a2--Ver-depois--celular-1.png` ("Faltam 4 dias, até 15/10/2026") e `…-0000000000a3--Ver-depois--celular.png` ("Prazo vencido há 5 dias (venceu em 06/10/2026)", em vermelho, com ícone) |
| RF17 | ATENDIDO | `apps/api/src/privacidade/privacidade.service.ts`; `apps/api/src/ops/privacidade.ts` | `apps/api/test/pedido-titular.int.test.ts:502`, `:591`; `arquivo-do-titular.int.test.ts:979`, `:1029`; `ops-privacidade.int.test.ts:131`; `apps/worker/test/eliminar-titular.int.test.ts:974` | O caso da virada confere também a auditoria de cada passo sem ano em curso |
| RF18 | ATENDIDO | escopo pela escola do contexto em todo repository do F3 | `pedido-titular.int.test.ts:977`; `arquivo-do-titular.int.test.ts:776`; `eliminacao-agendada.int.test.ts:750`; `incidente.int.test.ts:398`; `suboperador.int.test.ts:292`; `eliminar-titular.int.test.ts:893`; `expurgo-da-escola.int.test.ts:2476` | Mutação 3 desta rodada e mutação 1 da rodada 1 |
| RF19 | ATENDIDO | chave de envio, `for update`, `skip locked` | `pedido-titular.int.test.ts:1141`, `:1212`; `eliminacao-agendada.int.test.ts:718`; `eliminar-titular.int.test.ts:801`, `:812`; `incidente.int.test.ts:490` | Sem mudança de código; as duas primeiras linhas mudaram de lugar |
| RF20 | ATENDIDO | `apps/web/src/areas/navegacao.ts`; `Privacidade.tsx`; `MeusDados.tsx` | os seis specs de e2e do F3, em `chromebook` e `celular`, com os quatro estados e a varredura de acessibilidade | Todas as fotos acima. Nenhum defeito da lista de bloqueantes do `frontend-reviewer`: sem rolagem de lado a 360 px, tabela vira cartão, estado vazio diz o próximo passo, ação oficial mostra o que vai acontecer. O item fica no fim da lista plana, desvio agora registrado (Tech Spec, seção 9) |

Provas de mutação (as três ficaram vermelhas; cada arquivo foi restaurado com `git checkout --` e a árvore terminou
limpa, com o carimbo do portão ainda válido):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF10 (o C1) | A correção inteira: `titulares.repository.ts` de volta ao de `2b653d7`, com `exigirAnoEmCurso()` em `#vinculosDe` | `apps/api/test/pedido-titular.int.test.ts` › "depois de encerrar o ano, a busca, o registro, a lista…" (`expected 404 to be 200`, linha 1095) |
| RF10, regra 10, item 2 | A guarda `typeof anoLetivoId !== 'string'` e o filtro do ano quando não há ano, em `titulares.repository.ts:214` e `:223` | O mesmo caso: a busca devolveu a turma "2ºC" do ano encerrado onde se esperava `turmas: []` (linha 1096) |
| RF18 | `eq(pedidoTitular.escolaId, exigirEscolaDoContexto())` da leitura do pedido por id, em `apps/api/src/privacidade/pedidos.repository.ts:138` | `pedido-titular.int.test.ts` › "a prévia, a busca, o detalhe, o concluir e o corrigir de B, a partir de A, respondem como inexistente" e o caso da virada (`expected { status: 200 … } to deeply equal { status: 404 … }`) |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regras de negócio do PRD, seção 6 (as oito linhas da rodada 1) | cumpridas | O código e os testes delas não mudaram; as linhas citadas na rodada 1 seguem certas |
| Regra 10, item 2: a leitura nunca cai num ano qualquer | cumprida | Mutação 2: um vínculo `confirmado` no ano encerrado não aparece |
| Borda da regra 40: virada de ano letivo | **coberta** (era sem teste) | `pedido-titular.int.test.ts:1061`, com o ano encerrado pela API; `e2e/pedidos-do-titular.spec.ts:695`, na escola sem ano; fotos em `sem-ano-r2/` |
| Bordas do PRD, seção 7 (transferido, homônimo, redução de prazo, responsável, aluno só na lista) | cobertas | Como na rodada 1 |
| Borda: a única coordenadora quer a própria eliminação | justificada | Fora do escopo, na Tech Spec e no `TODO.md` |
| Pronto (tasks.md): acesso e eliminação atendidos pela coordenação, com rastro, arquivo aberto e eliminação no 8º dia | **cumprido** (era faltando) | Vale com e sem ano em curso: RF10 a RF15, e o registro pela API com o ano encerrado |
| Pronto (tasks.md): expurgo no prazo da escola, sem tocar outra escola nem o horário letivo; classificação testada | cumprido | RF1, RF4, RF5 |
| Pronto (tasks.md): a escola vê retenção, empresas e incidentes, e confirma | cumprido | RF3, RF7, RF9, com fotos |
| Pronto (tasks.md): nada separa o professor que usou IA, e a conversa dele não chega à coordenação | cumprido | `pedido-titular.int.test.ts:621`; `arquivo-do-titular.int.test.ts:629`, `:890` |
| Pronto (tasks.md): o que saiu do F3 não conta | cumprido | Nada disso foi implementado |
| Pronto quando (`ROADMAP.md:319-325`) | **cumprido** (era faltando, por texto desatualizado) | O bloco do F3 foi reescrito com as três fatias e o "Pronto quando" é o mesmo do `tasks.md`; a exportação e o canal estão no "Pronto quando" do F12 (`ROADMAP.md:505`) |

### 3. Portão

O portão completo rodou antes desta validação e vale para o código validado: `node tools/processo/portao-local.ts
conferir --completo` respondeu "portão local válido para o código atual", no começo e depois das mutações. Carimbo
(`.processo/portao.json`): início `2026-10-11T04:59:39.807Z`, suítes `typecheck`, `lint`, `segredo`, `dependencias`,
`test`, `e2e`, `infra`. Não rodei as suítes de novo. Rodei só o que a prova pedia: um arquivo de integração (para as
mutações e o controle) e um spec de e2e (para subir o ambiente das fotos), os dois verdes no código real.

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ (carimbo) |
| `npm run lint` | ✅ (carimbo) |
| `npm run test` | ✅ (carimbo) |
| `npm run test:e2e` | ✅ (carimbo) |
| `npm run test:infra` | ✅ (carimbo) |
| Esteira do GitHub | roda no fechamento, depois desta validação (D78): não entra no veredito |
| Revisões com veto registradas e aprovadas | ✅ |

Processo:

- As 20 tarefas e as 8 correções do F3 têm, na seção "Revisões", rodada de todo revisor obrigatório, e a última de
  cada um é APROVADO. A correção do C1 (`99958a7`) tem `test-engineer` (2ª rodada), `tenancy-guardian` e
  `privacy-guardian` aprovados.
- Nenhum commit desde 05/10/2026 levou código de `apps`, `packages`, `infra` ou `e2e` sem `(tarefa N.0)` nem
  `(correção <slug>)`. O `916320c` só mexe em documento.
- `revisao-spec.md` segue com veredito APROVADA.
- As duas divergências da rodada 1 estão registradas: o M2 na Tech Spec, seção 9, com linha no `TODO.md:861`; o m1 na
  Tech Spec, seção 3.

### 4. Achados

**Críticos**

Nenhum. O C1 da rodada 1 está resolvido (`apps/api/src/privacidade/titulares.repository.ts:211-214`), com teste de
integração e de e2e que ficam vermelhos sem a correção.

**Maiores**

Nenhum.

- O M1 está resolvido: `ROADMAP.md:297-325` descreve as três fatias e o "Pronto quando" do recorte, a exportação e o
  canal foram para o F12 e o F9, e `docs/conformidade-mec.md:61` e `:305` estão alinhados.
- O M2 está resolvido como desvio registrado: `tasks/prd-lgpd-e-titular/techspec.md:760-765` e `docs/interface.md:1068`
  dizem que a lateral é lista plana e que Privacidade fica no fim, e o `TODO.md:861` guarda a decisão dos grupos para
  o PRD do F12.

**Menores**

- **m1.** `apps/api/test/pedido-titular.int.test.ts:1061`: depois do encerramento do ano, o caso registra só um pedido
  de compartilhamento, e o e2e, um de correção. Nenhum teste registra eliminação, acesso ou portabilidade nesse
  estado. Conferi os três à mão pela API e funcionam; vale acrescentar ao caso uma eliminação e um acesso registrados
  depois do encerramento, para a prova não depender de leitura de código.
- **m2.** `apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.ts:58`: sem ano em curso a linha diz "Sem
  turma neste ano", quando não há ano nenhum (fotos em `sem-ano-r2/`). Texto: "Sem turma" basta.
- **m3.** `apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx:84`: a lista não mostra o prazo nem destaca o pedido
  vencido (era o m3 da rodada 1). Na foto, a correção vencida há 5 dias aparece só como "Recebido".
- **m4.** `packages/shared/src/privacidade/titular.ts`: o DTO do pedido não leva `eliminarEm`, e o detalhe diz "7 dias
  depois do registro" sem dizer o dia (era o m4).
- **m5.** `apps/web/src/areas/coordenacao/privacidade/AcoesDoPedido.tsx:279`: "Baixar a versão da escola" aparece
  também quando o titular tem conta ativa, e aí sempre falha com o texto certo (era o m5).
- **m6.** `apps/web/src/componentes/meus-dados/MeusDados.tsx:189-191`: na área do professor a tela não tem título à
  vista (era o m6; foto `professora--professor-meus-dados--celular.png`).
- **m7.** `infra/compose.yml:211`: `IA_LATENCIA_FALSA_MS` obrigatória sem aviso no `README.md` (era o m7).
- **m8.** `tools/vitrine/escola.ts`: a vitrine não semeia nada da Privacidade; semeei de novo à mão, só no banco de
  teste (era o m8; o `TODO.md:270` cobre só o incidente).
- **m9.** Os menores m3 a m8 só têm destino escrito neste arquivo. No fechamento, levar cada um ao `TODO.md`, para não
  dependerem de alguém reler a validação.

O m1 e o m2 da rodada 1 (os dez prazos fixos na Tech Spec e as subtarefas marcadas no `tasks.md`) foram resolvidos no
`916320c`.

**Positivos**

- O teste da correção põe um vínculo `confirmado` no ano encerrado antes de afirmar `turmas: []`: sem isso a mutação
  "cair num ano qualquer" passaria, e o documento da correção diz que o Implementador viu isso acontecer e consertou.
- O documento da correção registra as mutações que rodou, e as duas que repeti deram o mesmo vermelho.
- A correção ficou no menor lugar possível (uma função de leitura) e deixou o `exigirAnoEmCurso` falhando fechado para
  o resto do sistema.

### 5. Conclusão

APROVADA. Todo RF está atendido, o critério de pronto do `tasks.md` e o "Pronto quando" do roadmap estão cumpridos, não
há crítico nem maior, e o portão completo está verde no commit validado. O que resta são nove menores, nenhum deles
impede a próxima funcionalidade.

Próximo passo, do Orquestrador: a esteira na branch da spec e o pouso, com a palavra do Joaquim.

### 6. Pendências herdadas

- Exportação da escola em formato aberto (D63): F12. Canal de notificação de violação (D61): F9 e F12. Validação
  humana como entidade (D56): F6. Estão no `ROADMAP.md`, cada uma na fase dela.
- Grupos da lateral da coordenação: `TODO.md:861`, até o PRD do F12.
- Contração do check de `provedor`, a coordenação como titular e o prazo do `registro_de_decisao`: no `TODO.md`, como
  na rodada 1.
- Os menores: m1 e m2 para a próxima correção ou tarefa que mexer nos Pedidos; m3 a m6 para a spec de refatoramento
  visual ou a próxima que tocar as telas da Privacidade; m7 no `README.md`; m8 em `tools/vitrine/`; m9 no fechamento.
- Estado do ambiente de teste depois desta validação: a escola cheia da vitrine ficou com dado sintético que semeei
  (dois incidentes, uma aluna a mais e oito pedidos, três deles registrados pela API) e com o ano de volta em
  `em_curso`. As três empresas que semeei para as fotos, uma delas de alcance "todas", eu apaguei no fim, para não
  aparecerem nas outras escolas do banco de teste. Nada disso está no repositório; o portão que recria o banco apaga
  tudo, e `node tools/vitrine/vitrine.ts montar` refaz a vitrine.

## Rodada 1 — 11/10/2026

**Escopo:** funcionalidade completa
**Commit validado:** `2b653d7`
**Veredito: REPROVADA**

Um crítico, provado no ambiente de teste: numa escola sem ano letivo em curso, a aba Pedidos da coordenação responde
"Não encontramos o que você procurou", e o detalhe de qualquer pedido some. O resto da funcionalidade está bem
construído e bem testado: 20 dos 21 RF têm código, teste efetivo e, onde há tela, foto lida.

Como li: PRD, Tech Spec, `tasks.md`, `cenarios.md`, o bloco do F3 no `ROADMAP.md` e as regras 10, 20, 40, 70 e 80;
os arquivos centrais de cada RF por inteiro; os testes que provam cada parte; 3 provas de mutação; e as telas
fotografadas no computador (1366 px) e no celular (360 px), na escola cheia e na vazia.

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `packages/shared/src/privacidade/classificacao.ts` (`CLASSIFICACAO_DAS_TABELAS`), `packages/shared/src/privacidade/retencao.ts` (`CATEGORIAS_DE_RETENCAO`) | `apps/api/test/arquitetura.test.ts:1205` ("a CLASSIFICACAO_DAS_TABELAS confere com as migrations, nos dois sentidos…") e `:1214`, `:1224` (controles negativos); `apps/api/test/retencao.int.test.ts:100` (escola nova nasce com o padrão) | O teste de arquitetura reprova a tabela de migration fora da classificação e a classificada que não existe |
| RF2 | ATENDIDO | `apps/api/src/ops/retencao.ts:85-111`; `packages/nucleo/src/retencao/retencao-da-escola.repository.ts` (`travarEscola`, `for no key update`) | `apps/api/test/retencao.int.test.ts:119-236` (piso, teto, categoria fixa recusada, travas, auditoria com operador e contrato, A não muda B) e `:278`, `:303` (concorrência) | |
| RF3 | ATENDIDO | `apps/web/src/areas/coordenacao/privacidade/Retencao.tsx`, `textos-da-retencao.ts` | `e2e/privacidade.spec.ts:68`, `:114` | Fotos: `coordenacao--coordenacao-privacidade-retencao--computador-1.png`, `--celular-1.png`, `vazia--coordenacao--coordenacao-privacidade-retencao--computador-1.png`. Tabela em linguagem comum ("1 ano", "5 anos", quando começa a contar, de onde vem) e os prazos que não mudam; no celular vira cartão, sem rolagem de lado |
| RF4 | ATENDIDO | `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:167-330` (`INSTRUCAO_DO_LOTE`, uma por alvo, com a escola no `select` de dentro e no `delete` de fora) | `apps/worker/test/expurgo-da-escola.int.test.ts:587` ("%s: um dia antes do prazo a linha fica, um dia depois sai…, a de outra escola com a mesma idade fica, e reexecutar não mexe em mais nada"), parametrizado pelas categorias | Mutação 1 |
| RF5 | ATENDIDO | `apps/worker/src/processadores/expurgar-dado-pessoal.ts`, `expurgar-escola.ts` (um job por escola, janela letiva conferida a cada lote, `expurgo_execucao` por categoria, só contagem); `apps/worker/src/medicao-do-expurgo.ts`; `infra/grafana/alertas/expurgo-noites-incompletas.yaml` | `apps/worker/test/expurgo-da-escola.int.test.ts:695` (janela letiva), `:838` (lotes), `:1058` (concorrência), `:2476` (isolamento), `:2505` (medição do alerta); `infra/test/alerta-do-expurgo.int.test.ts:83`; `infra/test/expurgo-da-carga.test.ts:49-157` e `expurgo-da-carga.int.test.ts` | Runbook: `docs/runbook.md:435`. O cenário de carga (A expurga 1 milhão de linhas, B no Tutor) está em `docs/infra.md:419` e roda por `npm run carga`; o portão cobre o veredito e a semente dele, não a execução do k6 |
| RF6 | ATENDIDO | `apps/api/src/ops/suboperador.ts`, `apps/api/src/ops/operacao-privacidade.repository.ts` | `apps/api/test/suboperador.int.test.ts:170`, `:245`, `:272`, `:470`, `:495` | |
| RF7 | ATENDIDO | `packages/nucleo/src/titular/suboperador-da-escola.repository.ts`; `apps/web/src/areas/coordenacao/privacidade/EmpresasQueRecebemDados.tsx` | `apps/api/test/suboperador.int.test.ts:292` ("B não vê o suboperador 'lista' que atende só A…"), `:309`, `:429`; `e2e/privacidade.spec.ts:254`, `:316` | Fotos: `coordenacao--coordenacao-privacidade-suboperadores--computador.png`, `--celular.png`, `vazia--coordenacao--coordenacao-privacidade-suboperadores--celular.png`. Vigentes e passadas separadas, com o selo do treinamento em texto e ícone |
| RF8 | ATENDIDO | `apps/api/src/ops/incidente.ts` | `apps/api/test/incidente.int.test.ts:171`, `:207` (sem coluna de pessoa), `:221-262` (texto que cita outra escola é recusado), `:568` (5 anos) | |
| RF9 | ATENDIDO | `packages/nucleo/src/titular/incidente-da-escola.repository.ts`; `apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx`, `Incidentes.tsx`; `apps/worker/src/medicao-do-incidente.ts` | `apps/api/test/incidente.int.test.ts:374`, `:398` (isolamento), `:428`, `:490` (duas confirmações); `infra/test/alerta-do-incidente.int.test.ts:81` (23 h não dispara, 25 h dispara); `e2e/incidentes.spec.ts:104`, `:202`, `:271` | Fotos: `coordenacao--coordenacao-governanca--computador.png` e `--celular-1.png` (o aviso ao entrar), `coordenacao--coordenacao-governanca--Ver-depois--computador.png` e `--celular-1.png` (a faixa que fica), `coordenacao--coordenacao-privacidade-incidentes--computador.png`, `--celular.png`, `vazia--coordenacao--coordenacao-privacidade-incidentes--computador.png`. Runbook: `docs/runbook.md:484` |
| RF10 | **PARCIAL** | `apps/api/src/privacidade/privacidade.service.ts:222-256` (`registrarPedido`), `:265`, `:282`; `apps/api/src/privacidade/titulares.repository.ts:113-151`, `:205-216` | `apps/api/test/pedido-titular.int.test.ts:260` (titular de B, id de ninguém e pedido sobre si respondem igual), `:977`, `:1061`; `e2e/pedidos-do-titular.spec.ts:56`, `:131`, `:582` | **Crítico C1:** sem ano letivo em curso, busca, registro, lista e detalhe respondem 404. Com ano em curso, tudo certo. Fotos: `coordenacao--coordenacao-privacidade-pedidos--computador.png`, `--celular.png`, `coordenacao--coordenacao-privacidade-pedidos--Registrar-pedido--computador.png`, `--celular-1.png`, `vazia--coordenacao--coordenacao-privacidade-pedidos--computador.png`, `--celular.png`; e, do defeito, `sem-ano/sem-ano-em-curso--pedidos--computador.png`, `--celular.png` e `sem-ano/sem-ano-em-curso--detalhe--computador.png` |
| RF11 | ATENDIDO | `packages/nucleo/src/titular/leitura-do-titular.ts:84-402` (lista permitida por coluna, com o motivo de cada coluna que fica de fora), `:442-476`; `apps/worker/src/processadores/montar-arquivo.ts` | `apps/api/test/arquivo-do-titular.int.test.ts:418` (o aluno: cada tabela aparece, e a linha de outro aluno e a de outra escola não), `:462` (o professor), `:498`, `:543`, `:730` (lote não aprovado sai só como estado); `apps/worker/test/montar-arquivo.int.test.ts:86`, `:114`, `:228`; `apps/api/test/arquitetura.test.ts:1310` | |
| RF12 | ATENDIDO | `packages/nucleo/src/titular/arquivo-do-titular.repository.ts`; `apps/api/src/privacidade/meus-dados.controller.ts`; `apps/web/src/componentes/meus-dados/MeusDados.tsx` | `apps/api/test/arquivo-do-titular.int.test.ts:629` (a versão da escola não traz a conversa, o tema, o texto do modelo nem a justificativa), `:663`, `:754`, `:931` (URL de 300 s; no 8º dia responde como inexistente), `:979`; `e2e/meus-dados.spec.ts:155`, `:679`; `e2e/pedido-do-titular.spec.ts:648`, `:708` | Mutação 2. Fotos: `aluno--aluno-privacidade--computador.png`, `--celular.png`, `aluno--aluno-privacidade--Baixar-meus-dados--celular.png` (o diálogo diz o que o arquivo traz e manda apagar no computador da escola), `professora--professor-meus-dados--computador.png`, `--celular.png`, `vazia--aluno--aluno-privacidade--celular.png` |
| RF13 | ATENDIDO | `packages/nucleo/src/titular/compartilhamento.ts`, `compartilhamento.repository.ts` | `apps/api/test/compartilhamento.int.test.ts:203`, `:284`, `:427` (sem uso, só a hospedagem), `:174` (escopo), `:398`; `e2e/pedido-do-titular.spec.ts:172` | Foto: `coordenacao--coordenacao-privacidade-pedidos-01a12922-914e-…--computador.png` e `--celular-1.png`: empresas com período, "Provedor não cadastrado", e o aviso do art. 18, § 6º |
| RF13b | ATENDIDO | `apps/api/src/privacidade/privacidade.service.ts:332` (`corrigirNomeDoPedido`) | `apps/api/test/pedido-titular.int.test.ts:454`, `:591` (o log e a auditoria sem o nome atual nem o anterior); `e2e/pedido-do-titular.spec.ts:371` | Alcançado pelo C1: sem ano em curso a tela não chega ao pedido |
| RF14 | ATENDIDO | `packages/nucleo/src/identidade/avaliar-sessao.ts:31`; `apps/api/src/sessao/renovacao.service.ts:129`; `apps/api/src/privacidade/privacidade.service.ts:315` (`cancelarPedido`); `packages/nucleo/src/titular/eliminacao-do-titular.repository.ts:39-61` | `apps/api/test/eliminacao-agendada.int.test.ts:185`, `:450` (a guarda recusa pela marca), `:466`, `:575`, `:613`, `:629`; `apps/worker/test/eliminar-titular.int.test.ts:274` (antes do 8º dia nada acontece), `:285`, `:835`; `e2e/acesso-suspenso.spec.ts:49`; `e2e/pedido-do-titular.spec.ts:451` | Mutação 3. Fotos: `coordenacao--coordenacao-privacidade-pedidos-01a1292a-…--computador.png`, `--celular.png` (eliminação agendada, com "Cancelar eliminação"), `suspenso/acesso-suspenso--aluno--computador.png`, `--celular.png`. Alcançado pelo C1: sem ano em curso a coordenação não abre o pedido para cancelar |
| RF15 | ATENDIDO | `packages/nucleo/src/titular/eliminacao-do-titular.ts:66-111`; `eliminacao-do-titular.repository.ts:105-181`; `packages/nucleo/src/titular/troca-de-nome.ts`; `homonimo.ts` | `apps/worker/test/eliminar-titular.int.test.ts:331` (o nome sai de cada coluna de texto livre; o primeiro nome só fica, `:343`), `:418`, `:571` (homônimo impede a troca), `:612` (professor sem troca), `:633`, `:753` (falha desfaz a etapa inteira), `:801`, `:812` | |
| RF16 | ATENDIDO | `apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.ts:28` (`PRAZO_DA_DECLARACAO_COMPLETA_DIAS = 15`), `:74`; `DetalheDoPedido.tsx` | `apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.test.ts:50-113`; `e2e/pedido-do-titular.spec.ts:118` | Fotos: `coordenacao--coordenacao-privacidade-pedidos-01a12922-914e-…--celular-1.png` ("Faltam 4 dias, até 15/10/2026") e `…-01a12922-9150-…--computador.png`, `--celular.png` ("Prazo vencido há 5 dias", em vermelho, com ícone). O prazo aparece só no detalhe, como a Tech Spec desenhou (menor m3) |
| RF17 | ATENDIDO | `apps/api/src/privacidade/privacidade.service.ts` (auditoria em cada passo); `apps/api/src/ops/privacidade.ts`, `contagens-de-privacidade.repository.ts` | `apps/api/test/pedido-titular.int.test.ts:502`, `:591`; `apps/api/test/arquivo-do-titular.int.test.ts:979` (no-store, sem chave de objeto, download auditado com finalidade), `:1029` (a URL nunca vai ao log); `apps/api/test/ops-privacidade.int.test.ts:131` (só contagens, nenhuma sentinela sai); `apps/worker/test/eliminar-titular.int.test.ts:974` | |
| RF18 | ATENDIDO | escopo em todo repository do F3 pela escola do contexto (`exigirEscolaDoContexto()`); `apps/api/test/arquitetura.test.ts:1362-1375` (um `@SemEscopo` só, o da rotina) | `apps/api/test/pedido-titular.int.test.ts:977`; `arquivo-do-titular.int.test.ts:776`; `eliminacao-agendada.int.test.ts:750`, `:801`; `incidente.int.test.ts:398`; `suboperador.int.test.ts:292`; `apps/worker/test/eliminar-titular.int.test.ts:305`, `:893`; `expurgo-da-escola.int.test.ts:2476` | Mutação 1 |
| RF19 | ATENDIDO | chave de envio, `for update` no pedido, `skip locked` no lote | `apps/api/test/pedido-titular.int.test.ts:1061`, `:1132`; `eliminacao-agendada.int.test.ts:254`, `:718`, `:733`; `apps/worker/test/eliminar-titular.int.test.ts:801`, `:812` (eliminação e expurgo juntos); `montar-arquivo.int.test.ts:114`; `incidente.int.test.ts:490` | |
| RF20 | ATENDIDO | `apps/web/src/areas/navegacao.ts:46`, `:73`; `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx`; `apps/web/src/componentes/meus-dados/MeusDados.tsx` | `e2e/privacidade.spec.ts`, `incidentes.spec.ts`, `pedidos-do-titular.spec.ts`, `pedido-do-titular.spec.ts`, `meus-dados.spec.ts`, `acesso-suspenso.spec.ts`, nos projetos `chromebook` e `celular`, com os quatro estados e a varredura de acessibilidade (`pedidos-do-titular.spec.ts:582`, `incidentes.spec.ts:519`, `meus-dados.spec.ts:244`) | Todas as fotos acima. Nenhum defeito da lista de bloqueantes do `frontend-reviewer`: sem rolagem de lado a 360 px, tabela vira cartão, ação oficial mostra o que vai acontecer. O item entra numa lateral sem grupos (maior M2) |

Provas de mutação (as três ficaram vermelhas; cada arquivo foi restaurado com `git checkout --` e a árvore terminou limpa):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF4, RF18 | `escola_id = ${escolaId}` do `delete` e do `select` de `mensagem_tutor`, em `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:169` e `:171` | `apps/worker/test/expurgo-da-escola.int.test.ts` › "conversa_tutor: um dia antes do prazo a linha fica, um dia depois sai…, a de outra escola com a mesma idade fica…" (`expected true to be false`) |
| RF12 (regra 70, item 8) | `naVersao: (versao) => versao === 'completa'` de `mensagem_agente`, em `packages/nucleo/src/titular/leitura-do-titular.ts:216` | `apps/api/test/arquivo-do-titular.int.test.ts` › "sem conta ativa, a versão da escola traz o Tutor e não traz a conversa, o tema, o texto do modelo nem a justificativa…" (a versão da escola passou a conter a sentinela da conversa do professor) |
| RF14 | `\|\| linha.eliminacaoAgendadaEm !== null`, em `packages/nucleo/src/identidade/avaliar-sessao.ts:31` | `apps/api/test/eliminacao-agendada.int.test.ts` › "a guarda e a renovação recusam pela marca do usuário, mesmo com a sessão ainda aberta…" (`expected 200 to be 401`) |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: a escola é controladora; o pedido é registrado pela coordenação, nunca pelo titular | cumprida | `MeusDados.tsx` não tem ação de pedir; o vazio diz a quem pedir (foto `vazia--aluno--aluno-privacidade--celular.png`) |
| Regra: prazo dentro de piso e teto, e as travas entre categorias | cumprida | `apps/api/test/retencao.int.test.ts:119-236` |
| Regra: o arquivo completo é só do titular; a versão da escola nunca traz a conversa do professor | cumprida | `arquivo-do-titular.int.test.ts:629`, `:754`; mutação 2 |
| Regra: a conversa do Tutor vai na versão da escola (exceção do PRD, seção 6) | cumprida | `arquivo-do-titular.int.test.ts:656-660` |
| Regra: nada que a coordenação vê separa o professor que usou IA do que não usou (D64) | cumprida | `pedido-titular.int.test.ts:621`; `compartilhamento.int.test.ts:329`; `arquivo-do-titular.int.test.ts:890`; `e2e/pedidos-do-titular.spec.ts:239` |
| Regra: saída de IA não aprovada não chega ao titular (regra 70, item 3) | cumprida | `leitura-do-titular.ts:284-296`; `arquivo-do-titular.int.test.ts:730` |
| Regra: eliminação em 7 dias, cancelável; troca só do nome completo; homônimo impede a troca | cumprida | `eliminacao-agendada.int.test.ts:575-629`; `eliminar-titular.int.test.ts:331`, `:571` |
| Regra: a operação vê só contagens | cumprida | `ops-privacidade.int.test.ts:131` |
| Borda: aluno transferido | coberta | `pedido-titular.int.test.ts:1029`; `eliminacao-agendada.int.test.ts:429` |
| Borda: homônimo ativo | coberta | `eliminar-titular.int.test.ts:571`, `:592`, `:603`; `e2e/pedidos-do-titular.spec.ts:56` |
| Borda: a única coordenadora quer a própria eliminação | justificada | Fora do escopo, declarado na Tech Spec (limites) e em `TODO.md:201`; o pedido sobre a própria coordenação responde como inexistente (`eliminacao-agendada.int.test.ts:766`) |
| Borda: a operação reduz o prazo | coberta | `expurgo-da-escola.int.test.ts:620` ("ajuste da escola") |
| Borda: o responsável pede pelo aluno | coberta | `arquivo-do-titular.int.test.ts:852` |
| Borda: aluno que nunca reivindicou o nome | coberta | `pedido-titular.int.test.ts:928`; `e2e/pedidos-do-titular.spec.ts:330`; foto `vazia--coordenacao--coordenacao-privacidade-pedidos--celular.png` |
| Borda da regra 40: virada de ano letivo | **sem teste** | Crítico C1: nenhum teste de pedido roda com a escola sem ano em curso |
| Pronto (tasks.md): acesso e eliminação atendidos pela coordenação, com rastro, arquivo aberto e eliminação no 8º dia | **faltando** | Vale com ano em curso; sem ele a coordenação não registra nem acompanha (C1) |
| Pronto (tasks.md): todo dado pessoal sai no prazo da escola, por rotina noturna que não toca outra escola nem o horário letivo; classificação testada | cumprido | RF1, RF4, RF5; mutação 1 |
| Pronto (tasks.md): a escola vê retenção, empresas e incidentes, e confirma o incidente | cumprido | RF3, RF7, RF9, com fotos |
| Pronto (tasks.md): nada separa o professor que usou IA, e a conversa dele nunca chega à coordenação | cumprido | D64 acima; mutação 2 |
| Pronto (tasks.md): fora do F3 ficam a exportação (F12), o canal de notificação (F9/F12), a entidade de validação (F6) e a contração do `provedor` | cumprido | Nenhum deles foi implementado; a contração está em `TODO.md:147` |
| Pronto quando (ROADMAP.md:309-311) | **faltando, por texto desatualizado** | O roadmap ainda pede "a coordenação exporta tudo em formato aberto" e "uma notificação de violação percorre o caminho até a resposta", que o recorte de 05/10/2026 tirou do F3 (PRD, linhas 7-10). Maior M1 |

### 3. Portão

O portão completo rodou antes desta validação e vale para o código validado: `node tools/processo/portao-local.ts
conferir --completo` respondeu "portão local válido para o código atual", antes e depois das mutações. Carimbo
(`.processo/portao.json`): início `2026-10-11T02:45:12.362Z`, suítes `typecheck`, `lint`, `segredo`, `dependencias`,
`test`, `e2e`, `infra`. Não rodei as suítes de novo.

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ (carimbo) |
| `npm run lint` | ✅ (carimbo) |
| `npm run test` | ✅ (carimbo) |
| `npm run test:e2e` | ✅ (carimbo) |
| `npm run test:infra` | ✅ (carimbo) |
| Esteira do GitHub | roda no fechamento, depois desta validação (D78): não entra no veredito |
| Revisões com veto registradas e aprovadas | ✅ |

Processo:

- As 20 tarefas têm commit `(tarefa N.0)` e, na seção "Revisões" de cada `N_task.md`, rodada de todo revisor
  obrigatório, com a última de cada revisor com veto em APROVADO. As 7 correções (`e89a4ec`, `1a405d2`, `d44e951`,
  `69a68e4`, `9d2887f`, `e13311f`, `b6f7c1d`) também terminam em APROVADO.
- Nenhum commit desde 05/10/2026 levou código de `apps`, `packages`, `infra` ou `e2e` sem `(tarefa N.0)` nem
  `(correção <slug>)`.
- `revisao-spec.md` existe, com veredito final APROVADA (6ª rodada).

### 4. Achados

**Críticos**

- **C1.** `apps/api/src/privacidade/titulares.repository.ts:215`: `#vinculosDe` chama `exigirAnoEmCurso()`, que lança
  `NAO_ENCONTRADO` quando a escola não tem ano letivo em curso (`packages/nucleo/src/contexto/ano-em-curso.ts:11-13`).
  Ele é chamado por `buscar` (`:123`) e por `titularesParaOPedido` (`:151`), que montam a resposta de
  `registrarPedido`, `pedidos` e `pedido` (`apps/api/src/privacidade/privacidade.service.ts:256`, `:272`, `:288`).
  Resultado: sem ano em curso, a lista e o detalhe de Pedidos respondem 404, a busca com resultado também, e o
  registro desfaz a transação depois de gravar.
  - **Prova:** no banco de teste, pus o ano da escola da vitrine em `encerrado` e abri as telas como coordenação. A
    lista mostrou "Não encontramos o que você procurou" (`.processo/vitrine/sem-ano/sem-ano-em-curso--pedidos--computador.png`,
    `--celular.png`), o detalhe, "Este pedido não está mais disponível nesta escola"
    (`sem-ano/sem-ano-em-curso--detalhe--computador.png`), e o log da API registrou `status 404`, `NAO_ENCONTRADO`.
    Devolvi o ano a `em_curso` e as telas voltaram.
  - **Por que é crítico:** o estado é normal. A coordenação encerra o ano
    (`apps/api/src/estrutura/ano-letivo.service.ts:55`) e só depois abre o seguinte; entre um e outro, que pode ser
    dezembro e janeiro, a escola fica sem ano em curso. É quando o aluno sai da escola e o responsável pede acesso ou
    eliminação. Nessa janela a escola não registra pedido, não vê o prazo de 15 dias e não abre a eliminação
    agendada para cancelar dentro dos 7 dias. "Virada de ano letivo" é caso de borda da regra 40, e nenhum teste de
    pedido o cobre.
  - **Correção:** em `#vinculosDe`, sem ano em curso, devolver o mapa vazio (turma e disciplina só completam a linha;
    a virada já encerrou os vínculos). Testes: integração de busca, registro, lista, detalhe, concluir, cancelar e
    corrigir nome numa escola sem ano em curso (`criarEquipeComSenha(…, { semAnoLetivo: true })` já existe em
    `e2e/__fixtures__/sessao.ts`), e um caso de e2e da lista de Pedidos nesse estado.

**Maiores**

- **M1.** `ROADMAP.md:299-311` e `docs/conformidade-mec.md:305`: o bloco do F3 ainda descreve o escopo anterior ao
  recorte de 05/10/2026 (exportação pela coordenação, canal de notificação de violação, registro da validação
  humana), e o "Pronto quando" pede duas coisas que saíram do F3. O PRD avisa disso nas linhas 9-10, e nenhum item
  do `TODO.md` guarda a pendência. Correção: no fechamento, reescrever o bloco do F3 e o "Pronto quando" com as três
  fatias, levar a exportação ao F12, o canal ao F9/F12 e a validação ao F6, e alinhar a seção 11 do
  `conformidade-mec.md`.
- **M2.** `apps/web/src/areas/navegacao.ts:38-47`: o RF20 e a Tech Spec (`techspec.md:757`) dizem que Privacidade
  entra "no grupo Conformidade". A lateral da coordenação é uma lista plana, sem grupo nenhum (fotos), e a
  divergência não está na seção 12 nem em nota da Tech Spec. Os grupos não existem para nenhum item desde o MVP,
  então o desvio é herdado, mas ficou em silêncio. Correção: registrar na Tech Spec que o item entra no fim da lista
  plana até a lateral ganhar os grupos de `docs/interface.md` (linha 1066), ou criar o grupo.

**Menores**

- **m1.** `tasks/prd-lgpd-e-titular/techspec.md:77`: diz que os prazos fixos são nove; o contrato tem dez
  (`packages/shared/src/privacidade/retencao.ts:70-81`, com `arquivo_do_titular`), e a tela mostra dez. Atualizar o
  texto.
- **m2.** `tasks/prd-lgpd-e-titular/tasks.md`: as subtarefas das tarefas 9.0, 16.0, 17.0 e 18.0 ficaram `[ ]`, com a
  tarefa `[x]`. Marcar.
- **m3.** `apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx:84`: a lista não mostra o prazo nem destaca o
  pedido vencido; a coordenação só descobre o atraso abrindo cada pedido (na foto, a correção vencida há 5 dias
  aparece só como "Recebido"). A Tech Spec pôs o prazo no detalhe, então o RF16 está atendido; vale um destaque na
  lista.
- **m4.** `packages/shared/src/privacidade/titular.ts`: o DTO do pedido não leva `eliminarEm`, e o detalhe da
  eliminação agendada diz "7 dias depois do registro" sem dizer o dia (foto
  `…pedidos-01a1292a-…--computador.png`). Mostrar a data até quando se pode cancelar.
- **m5.** `apps/web/src/areas/coordenacao/privacidade/AcoesDoPedido.tsx:279`: "Baixar a versão da escola" aparece
  também quando o titular tem conta ativa, e aí sempre falha com o texto certo (`e2e/pedido-do-titular.spec.ts:708`).
  É limite declarado na Tech Spec; o DTO poderia dizer se a versão existe, para a tela não oferecer o que não há.
- **m6.** `apps/web/src/componentes/meus-dados/MeusDados.tsx:189-191`: na área do professor a tela não tem título à
  vista (o `h1` é só do leitor de tela; o aluno vê "Meus dados" como seção). Foto
  `professora--professor-meus-dados--celular.png`.
- **m7.** `infra/compose.yml:211`: `IA_LATENCIA_FALSA_MS` passou a ser obrigatória; quem já tem `.env` precisa
  acrescentá-la (`.env.example:224`). Recomendação do `infra-guardian` na 19.0 que ficou sem aviso no `README.md`.
- **m8.** `tools/vitrine/escola.ts`: a vitrine não semeia nada da Privacidade. Para fotografar, semeei à mão, só no
  banco de teste, dado sintético (empresas, pedidos em cada estado, eliminação agendada, incidente). Vale a vitrine
  cheia nascer com isso.

**Positivos**

- O teste de arquitetura confere a classificação das tabelas contra as migrations nos dois sentidos, com controles
  negativos: tabela nova sem categoria não passa.
- O teste do expurgo é parametrizado pela lista de categorias, e cada uma prova o dia antes, o dia depois, a outra
  escola e a reexecução.
- O arquivo do titular lê por lista permitida de colunas, e cada coluna que fica de fora tem o motivo escrito ao lado.
- As três mutações ficaram vermelhas no primeiro teste escolhido.

### 5. Conclusão

REPROVADA por um crítico (C1): um defeito de uma linha, sem teste, que tira da coordenação a aba Pedidos inteira
no período entre o encerramento de um ano letivo e a abertura do seguinte, que é quando o pedido de eliminação mais
chega. O portão está verde e o processo está em ordem.

Caminho até a aprovação:

1. `/corrigir` o C1, com os testes de integração e de e2e na escola sem ano em curso.
2. Registrar o M2 na Tech Spec (ou criar o grupo) e deixar o M1 com destino certo para o fechamento.
3. Revalidar: basta conferir o C1 na tela e nos testes novos, o portão da correção e os dois maiores.

### 6. Pendências herdadas

- Exportação da escola em formato aberto (D63): F12. Canal de notificação de violação (D61): F9 e F12. Validação
  humana como entidade (D56): F6. Decididas no recorte do PRD.
- Contração do check de `provedor` em release posterior: `TODO.md:147`.
- A coordenação como titular: `TODO.md:201`.
- Prazo do `registro_de_decisao`, que a tela promete diferente do que o expurgo faz: `TODO.md:272`, para o Joaquim
  decidir.
- Os menores m1 a m8: m1 e m2 no fechamento da spec; m3 a m6 para a próxima funcionalidade que mexer nas telas da
  Privacidade (ou a spec de refatoramento visual); m7 no `README.md`; m8 em `tools/vitrine/`.
- Estado do ambiente de teste depois desta validação: a escola da vitrine ficou com o dado sintético que semeei
  (inclusive uma aluna com a eliminação agendada) e com o ano em `em_curso`. Nada disso está no repositório;
  `node tools/vitrine/vitrine.ts montar` recria a vitrine do zero.

# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-10-13 01:57:55 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `revisao-spec` | O texto do botão desligado se contradiz entre os documentos, e a versão que a tarefa implementa reprova 4,5:1 no escuro. |
| 2026-10-13 01:58:22 | `conformidade-reviewer` | 1ª | REPROVADO | `revisao-spec` | A 10.2 manda a onça dormindo para a X1. `docs/interface.md:1340`, na tabela "O catálogo das peças da X1", diz para os três de `estado/`: "O vazio 'Tudo em dia'… |
| 2026-10-13 01:59:20 | `infra-guardian` | 1ª | REPROVADO | `revisao-spec` | A troca de `public/` por asset com hash foi feita só na seção 7c. Em dois lugares a spec ainda manda para `public/`, e o teto próprio não tem número. |
| 2026-10-13 02:01:47 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | O desligado está em duas cores, e nenhum teste liga a classe do botão ao par. |
| 2026-10-13 02:05:06 | `frontend-reviewer` | 2ª | APROVADO | `revisao-spec` | `1_task.md:127` cita como fonte a linha "Texto sobre o desligado de hoje" da tabela de pares, mas a linha se chama "desligado de antes" (`docs/interface.md`… |
| 2026-10-13 02:05:24 | `conformidade-reviewer` | 2ª | APROVADO | `revisao-spec` | A regra do teste de arquitetura falha contra o próprio avatar. Como está escrita na Tech Spec §10 e no 8.4 ("só `AssinaturaIA` e `Mensagem.tsx` importam o… |
| 2026-10-13 02:05:34 | `infra-guardian` | 2ª | APROVADO | `revisao-spec` | da rodada anterior que fecharam: |
| 2026-10-13 02:06:13 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | `2_task.md`, linha 80 (RF24): o valor da lateral recolhida está errado. A tabela exige `educa.lateral-recolhida` com valor do conjunto `1`. O código grava… |
| 2026-10-13 02:09:02 | `test-engineer` | 3ª | APROVADO | `revisao-spec` | O parêntese da linha 80 do `2_task.md` diz "abaixo de 768 não há o que recolher". Pelo código, entre 768 e 1023 px também não há botão de recolher: só o… |
| 2026-10-13 02:14:00 | `frontend-reviewer` | 1ª | APROVADO | `1_task` | `apps/web/src/estilos.css` (regra `.bg-noite :focus-visible`, cerca de linha 295). No escuro, `noite` vira `#f1f7fb`. O anel `caramelo-noite` (`#f2a25b`) sobre… |
| 2026-10-13 02:15:06 | `test-engineer` | 1ª | REPROVADO | `1_task` | A guarda não reprova `text-tinta` sobre face forte. O cenário "o texto sobre face forte" exige isso, e a fixture em `apps/web/src/estilos.test.ts:249` ainda… |
| 2026-10-13 02:15:46 | `revisor-geral` | 1ª | REPROVADO | `1_task` | A guarda deixa passar `text-tinta` sobre o laranja. Em `apps/web/src/estilos.test.ts:146-165` (`classesReprovadas`) e `:249`, a guarda não reprova `text-tinta`… |
| 2026-10-13 02:25:00 | `frontend-reviewer` | 2ª | APROVADO | `1_task` | Foco `.bg-noite :focus-visible` no escuro. |
| 2026-10-13 02:25:39 | `test-engineer` | 2ª | APROVADO | `1_task` | A guarda só compara classes com o mesmo prefixo de variante. Por isso `bg-superficie text-tinta hover:bg-caramelo` passa, e na tela o hover fica com `tinta`… |
| 2026-10-13 02:26:21 | `revisor-geral` | 2ª | REPROVADO | `1_task` | `apps/web/src/estilos.test.ts:148` e `:186-192`: a guarda não pega toda cor escrita dentro do `style={{…}}`. A correção pedia reprovar qualquer hex, `rgb(` ou… |
| 2026-10-13 02:35:52 | `frontend-reviewer` | 3ª | APROVADO | `1_task` | Foco `.bg-noite :focus-visible` no escuro. |
| 2026-10-13 02:36:39 | `test-engineer` | 3ª | APROVADO | `1_task` | . |
| 2026-10-13 02:36:53 | `revisor-geral` | 3ª | REPROVADO | `1_task` | `apps/web/src/estilos.test.ts:186-187` |
| 2026-10-13 07:59:06 | `test-engineer` | 4ª | REPROVADO | `1_task` | A seção Mutações de `tasks/prd-pele-e-casca/1_task.md` (blocos das linhas 202-230) não tem bloco para duas mudanças novas desta rodada: |
| 2026-10-13 07:59:08 | `revisor-geral` | 4ª | REPROVADO | `1_task` | A Tech Spec não diz o que o `1_task.md` afirma que ela diz. |
| 2026-10-13 08:05:45 | `test-engineer` | 5ª | APROVADO | `1_task` | `apps/web/src/estilos.test.ts:147`: a linha nova do comentário ficou bem mais longa que as outras do bloco, porque juntou "Quem cair num deles troca o nome. O… |
| 2026-10-13 08:05:53 | `revisor-geral` | 5ª | REPROVADO | `1_task` | `tasks/prd-pele-e-casca/techspec.md:198`: a correção pedida na 4ª rodada foi feita, mas quebrou a frase seguinte. |
| 2026-10-13 08:13:39 | `revisor-geral` | 6ª | REPROVADO | `1_task` | `tasks/prd-pele-e-casca/techspec.md:198` (linha Unidade, "Guarda de cor") e `tasks/prd-pele-e-casca/cenarios.md:199` (U3, "oráculo novo"). |
| 2026-10-13 08:20:43 | `revisor-geral` | 7ª | APROVADO | `1_task` | `tasks/prd-pele-e-casca/1_task.md:97`: troque "na mesma classe de uma face forte" por "na mesma lista de classes e com a mesma variante de uma face forte".… |
| 2026-10-13 09:34:05 | `privacy-guardian` | 1ª | APROVADO | `2_task` | Pôr no `docs/lgpd.md` uma linha que diga "o navegador guarda só preferência de aparelho, sem identificador" e que aponte para `docs/interface.md` seção 6.… |
| 2026-10-13 09:35:50 | `revisor-geral` | 1ª | REPROVADO | `2_task` | Duas subtarefas da Tech Spec ficaram sem dono. Estão em `tasks/prd-pele-e-casca/tasks.md:23` (subtarefa 2.4 da tarefa 2.0) e em… |
| 2026-10-13 09:36:00 | `test-engineer` | 1ª | REPROVADO | `2_task` | `apps/web/src/tema.ts:84` — regra sem teste. |
| 2026-10-13 09:37:34 | `frontend-reviewer` | 1ª | APROVADO | `2_task` | Foco do `Segmentado` dentro da faixa da operação. `apps/web/src/estilos.css:306` (`.bg-noite :focus-visible`) pinta o anel das opções em `caramelo-noite`… |
| 2026-10-13 09:52:14 | `revisor-geral` | 2ª | APROVADO | `2_task` | Tabela partida em `tasks/prd-pele-e-casca/2_task.md:164`. Uma linha em branco separa as duas linhas novas do resto da tabela de "Divergências". Sem cabeçalho,… |
| 2026-10-13 09:52:21 | `privacy-guardian` | 2ª | APROVADO | `2_task` | Continua em aberto a da 1ª rodada, já anotada em `TODO.md:1008-1012` e sem bloquear: quando o F16 servir a política de segurança de conteúdo, conferir que o… |
| 2026-10-13 09:52:34 | `test-engineer` | 2ª | APROVADO | `2_task` | `apps/web/src/componentes/Segmentado.tsx:55`: a volta na outra ponta, `(indice + 1) % total`, não tem bloco próprio. Ela tem teste: `Segmentado.test.tsx:92-93`… |
| 2026-10-13 09:54:45 | `frontend-reviewer` | 2ª | APROVADO | `2_task` | `apps/web/src/componentes/CaixaPedido.tsx:112-125` (`escuro--coordenacao--galeria--celular-4.png`, igual no claro): a 360 px o placeholder "Peça uma atividade,… |
| 2026-10-13 11:49:31 | `frontend-reviewer` | 1ª | APROVADO | `3_task` | Placeholder cortado a 360 px na `CaixaPedido` (`apps/web/src/componentes/ia/CaixaPedido.tsx:112-125`): "Peça uma atividade, um plano de aula…" aparece cortado… |
| 2026-10-13 11:49:34 | `conformidade-reviewer` | 1ª | REPROVADO | `3_task` | Falta a guarda "grafite só onde é oficial", que a tarefa marca como feita. |
| 2026-10-13 11:49:36 | `revisor-geral` | 1ª | REPROVADO | `3_task` | `apps/web/src/estilos.test.ts`: falta o teste "grafite só onde é oficial", e a subtarefa 3.6 está marcada como feita. |
| 2026-10-13 11:49:40 | `test-engineer` | 1ª | REPROVADO | `3_task` | Falta o cenário "grafite só onde é oficial" (RF6). Está na tabela da tarefa e na `techspec.md` §Testes ("Reprova também `bg-grafite` e `bg-noite` (com `-alto`… |
| 2026-10-13 12:13:27 | `frontend-reviewer` | 2ª | APROVADO | `3_task` | O botão "Sair" do cabeçalho no celular é um contorno de pílula, sem o degrau do botão secundário (visto em `coordenacao--coordenacao-estrutura--celular-1.png`).… |
| 2026-10-13 12:13:41 | `conformidade-reviewer` | 2ª | APROVADO | `3_task` | Na tela de atividade do aluno, no tema escuro, a questão aberta do mapa (apps/web/src/areas/aluno/Atividade.tsx:150, bg-noite) continua com a mesma face… |
| 2026-10-13 12:13:52 | `test-engineer` | 2ª | APROVADO | `3_task` | A lista conta arquivos, não classes. Uma entrada antiga pode ganhar `bg-grafite`, desde que o arquivo passe a escrever a classe também. Um `expect` de que só a… |
| 2026-10-13 12:13:52 | `revisor-geral` | 2ª | APROVADO | `3_task` | `apps/web/src/estilos.test.ts:592-594`: o comentário diz que "outra família" passa em qualquer arquivo, mas a asserção espera que `bg-noite-ia` reprove. O… |
| 2026-10-13 12:47:05 | `revisor-geral` | 1ª | APROVADO | `4_task` | `apps/web/src/componentes/Interruptor.tsx:31` desenha o estado fora de uso com `disabled:opacity-50`. Isso cria um segundo jeito de mostrar peça desligada,… |
| 2026-10-13 12:47:28 | `test-engineer` | 1ª | REPROVADO | `4_task` | `apps/web/src/componentes/Opcao.tsx:36`: a aparência da opção desligada (`'cursor-not-allowed border-borda bg-fundo-suave text-apoio'`) é cláusula nova sem… |
| 2026-10-13 12:52:56 | `frontend-reviewer` | 1ª | APROVADO | `4_task` | `apps/web/src/componentes/ia/CaixaPedido.tsx:112-125` — na foto `coordenacao--galeria--celular-5.png`, o texto de exemplo "Peça uma atividade, um plano de… |
| 2026-10-13 13:04:03 | `test-engineer` | 2ª | APROVADO | `4_task` | No `Opcao.test.tsx:171-173` e `:181-183`, o laço de contraste usa os nomes `'apoio'`, `'fundo-suave'` e `'campo'` escritos à mão, em vez do token lido do… |
| 2026-10-13 13:04:18 | `revisor-geral` | 2ª | REPROVADO | `4_task` | `apps/web/src/componentes/Interruptor.tsx:26-27` e `:39`. O interruptor fora de uso trocou a opacidade de 50% por tokens (trilho `fundo-suave` com borda… |
| 2026-10-13 13:04:24 | `frontend-reviewer` | 2ª | APROVADO | `4_task` | `CaixaPedido` a 360 px. Foto `coordenacao--galeria--celular-5.png`, componente `apps/web/src/componentes/ia/CaixaPedido.tsx:112-125`. O texto de exemplo ("Peça… |
| 2026-10-13 13:10:47 | `revisor-geral` | 3ª | APROVADO | `4_task` | Para a próxima tarefa que tocar a peça: a bolinha fora de uso (`borda-campo`) sobre o trilho `fundo-suave` não tem prova de contraste no e2e, só no teste de… |
| 2026-10-13 13:40:37 | `frontend-reviewer` | 1ª | APROVADO | `5_task` | Cartão de 1 px ao lado de 2 px. Em `/coordenacao/governanca`, o caixa "Consumo do mês por função" e o cartão "Suas turmas" (`/professor/turmas`) seguem com 1… |
| 2026-10-13 13:40:49 | `revisor-geral` | 1ª | APROVADO | `5_task` | O comentário de `apps/web/src/componentes/Cartao.tsx:16-19` agora cita a 10.2 e diz "20 px a partir de 1024 px", mas a 10.2 e a 9.3 da `docs/interface.md`… |
| 2026-10-13 13:41:20 | `test-engineer` | 1ª | REPROVADO | `5_task` | `apps/web/src/componentes/Linha.tsx:52`: o título em `t-cartao` não tem bloco de mutação. É regra da `docs/interface.md` 10.2 ("Título em `t-cartao`"). O bloco… |
| 2026-10-13 13:52:13 | `revisor-geral` | 2ª | APROVADO | `5_task` | Linha.tsx:32-45. Quando o `miolo` virou `MioloDaLinha`, a documentação longa do componente (a linha inteira é um alvo só, 64 px no mínimo, `divide-y-2` na… |
| 2026-10-13 13:52:16 | `test-engineer` | 2ª | APROVADO | `5_task` | `Linha.test.tsx:71`: `expect(duas.type).toBe(Linha)` passa sempre e só existe para usar a variável; quem prova a regra é o `@ts-expect-error`. Trocar por `void… |
| 2026-10-13 13:53:18 | `frontend-reviewer` | 2ª | APROVADO | `5_task` | `apps/web/src/componentes/Linha.tsx:26-45`: o comentário longo de `Linha` ("A linha de lista da D80…") ficou acima de `interface PropsDoMiolo` (linha 46), e… |
| 2026-10-13 14:57:08 | `revisor-geral` | 1ª | APROVADO | `6_task` | `tasks/prd-pele-e-casca/6_task.md:112`: a linha diz que a exportação de `FamiliaDeCor` e `FAMILIAS_DE_COR` pelo `Contador` está na `techspec.md` §9 e na 9.0 do… |
| 2026-10-13 14:57:26 | `test-engineer` | 1ª | REPROVADO | `6_task` | `apps/web/src/componentes/Aviso.test.tsx:88`: `expect(container).not.toBe(semTitulo)` compara os contêineres de dois `render` diferentes. Ela sempre passa, e a… |
| 2026-10-13 14:57:31 | `frontend-reviewer` | 1ª | APROVADO | `6_task` | Defeito herdado, fora desta tarefa (vai para a 10.0): em 360 px, o placeholder da caixa de pedido do professor quebra em duas linhas e o botão "Só conversar" o… |
| 2026-10-13 15:08:14 | `test-engineer` | 2ª | APROVADO | `6_task` | Em `e2e/pecas-estado.spec.ts:220-226`, o laço que acha o primeiro fundo pintado só serve a este caso. Se outro caso de contraste precisar dele, vale levá-lo… |
| 2026-10-13 15:08:27 | `revisor-geral` | 2ª | APROVADO | `6_task` | `docs/interface.md:1374` diz "o vazio tracejado (`borda-campo`) centraliza; o vazio de lista continua à esquerda". Mas em… |
| 2026-10-13 15:08:38 | `frontend-reviewer` | 2ª | APROVADO | `6_task` | Placeholder da `CaixaPedido` cortado a 360 px: em `professora--galeria--celular-7.png`, "Peça uma atividade, um plano de aula…" quebra e a segunda linha some… |
| 2026-10-13 16:31:01 | `infra-guardian` | 1ª | APROVADO | `7_task` | `apps/web/src/componentes/dialogo-modal.ts` agora carrega a prisão e a devolução do foco que o `Dialogo`, o `LoginPorCima` (sessão vencida) e o `PainelLado`… |
| 2026-10-13 16:32:25 | `frontend-reviewer` | 1ª | APROVADO | `7_task` | Ordem dos botões do rodapé: ela difere entre as peças, e as fotos mostram os quatro jeitos. |
| 2026-10-13 16:33:05 | `test-engineer` | 1ª | REPROVADO | `7_task` | O véu forte do login por cima não tem teste que o prove. A cláusula nova está em `apps/web/src/componentes/LoginPorCima.tsx:86` (`data-sessao-vencida=""`). |
| 2026-10-13 16:33:15 | `revisor-geral` | 1ª | REPROVADO | `7_task` | Onde: `docs/interface.md:1405`, com `tasks/prd-pele-e-casca/7_task.md:103`. |
| 2026-10-13 17:06:40 | `revisor-geral` | 2ª | APROVADO | `7_task` | `docs/interface.md:1404`: o texto diz "a gaveta da casca (12.0 e 13.0)", mas no `tasks.md` a gaveta é só da 13.0 (13.2). A 12.0 é a casca no computador, sem… |
| 2026-10-13 17:06:44 | `test-engineer` | 2ª | APROVADO | `7_task` | `e2e/pecas-sobrepor.spec.ts:601-604`: o botão oficial só é provado como "não vermelho". Comparar com o token do `oficial` (`corDoToken(page, '<token do… |
| 2026-10-13 17:56:49 | `conformidade-reviewer` | 1ª | APROVADO | `8_task` | A foto de `/aluno/tutor` (`aluno--aluno-tutor--computador.png` e `…-celular.png`) mostra só a lista de atividades, e nela a onça do Tutor não aparece com o… |
| 2026-10-13 17:57:35 | `frontend-reviewer` | 1ª | APROVADO | `8_task` | O selo "IA" se descola do nome quando o nome quebra de linha em 360 px. Isso aparece no Analista (galeria, 40 e 48 px, `celular-8`) e em Agentes (`celular-2`,… |
| 2026-10-13 17:57:58 | `revisor-geral` | 1ª | APROVADO | `8_task` | `tasks/prd-pele-e-casca/8_task.md:98`: a justificativa do balão está errada. Ela diz "É o que a 11.4 já dizia ('com a assinatura em cima e o balão logo abaixo… |
| 2026-10-13 17:58:21 | `test-engineer` | 1ª | APROVADO | `8_task` | `apps/web/src/componentes/ia/AssinaturaIA.tsx:10`: `px-2` e `shrink-0` do `SeloIA` estão sem bloco e sem asserção no "o selo IA é um só". O `shrink-0` impede o… |
| 2026-10-13 18:16:39 | `conformidade-reviewer` | 2ª | APROVADO | `8_task` | nenhuma nova. |
| 2026-10-13 18:17:03 | `frontend-reviewer` | 2ª | APROVADO | `8_task` | "Peça uma atividade, um plano de aula…" aparece cortado em 360 px em `professora--professor-nova-conversa--celular.png`. A caixa de pedido não é desta tarefa e… |
| 2026-10-13 18:17:21 | `revisor-geral` | 2ª | APROVADO | `8_task` | `apps/web/src/componentes/ia/AssinaturaIA.tsx:54-55`: o espaço entre o nome e o selo é feito duas vezes, pelo `{' '}` em texto e pelo `ml-1` do `span` que… |
| 2026-10-13 18:17:30 | `test-engineer` | 2ª | APROVADO | `8_task` | `apps/web/src/componentes/ia/AssinaturaIA.tsx:54`: a casca nova do selo, `<span className="ml-1 inline-block align-middle">`, não tem bloco de mutação nem… |

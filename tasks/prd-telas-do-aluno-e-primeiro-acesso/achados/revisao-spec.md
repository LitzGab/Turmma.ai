# Achados das revisões — `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-13 08:36:46 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: não. Revisão de spec, sem código nem fotos. Li `techspec.md`, `prd.md`, `tasks.md`, as tarefas 3, 4, 5, 6, 7, 8, 9 e 4 e trechos do `mockup.md`.

Estados: faltando os quatro estados da própria `BemVindo` (ver bloqueante 1). Início, Tarefas, Eu e a tarefa aberta têm os quatro estados nas tarefas 3.3, 4.4, 7.3 e 6.3.

Acessibilidade: garantida, com ressalvas.
- Foco no `h1` a cada passo, "Passo N de M" para o leitor de tela, Enter continua, Esc não sai do passo obrigatório e botões iguais (tarefa 5.2 e 5.5).
- Grupo de rádio com setas para o tamanho da letra, e foco devolvido ao fechar o diálogo (8.2 e 8.4).
- Alvo de 44 px testado em Tarefas, Eu, tarefa aberta e introdução (4.4, 6.3, 7.3, 9.5).
- Contraste e foco visível vêm das peças da X1.

Chromebook fraco: garantido.
- Telas novas em `lazy()` com chunk de até 30 kB, e a entrada não importa a onça (seção 9, RF20, arquitetura em 5.5).
- Início soma uma requisição só (seção 7c, teste "uma chamada a mais").
- Lista com "Ver mais tarefas" a pedido, sem lista longa.
- A comemoração usa só `transform` e `opacity`, uma iteração.

Celular: garantido.
- 360 px sem rolagem lateral e alvos de 44 px em todas as telas.
- Letra Maior a 360 px em Início, Tarefas, Eu, diálogo e tarefa aberta (8.4).
- Nada depende de hover.
- Nenhum fluxo exige o celular.
- "Sair" no topo da tela de foco e à vista na casca.

Ação oficial protegida: sim, o assunto é só leitura.
- A introdução grava apenas uma data, por rota da própria pessoa, idempotente.
- "Corrigida" só com correção aprovada.
- A comemoração é da entrega, nunca de nota ou acerto.
- Isolamento e dado pessoal estão na seção 6 e 7 da Tech Spec.

Bloqueantes:
1. **Tech Spec seção 9 ("Peças novas") e seção 5 ("Rever"), tarefa 9.5, 10.3 e 11.3: a `BemVindo` não tem estados definidos.**
   - A `BemVindo` precisa ler `GET /v1/eu` para saber se está "revendo" e então dar "Fechar" em todo passo.
   - A 9.5 diz que "carregando e erro são os da `Inicio`". Isso vale para o desvio em `/`, não para quem abre `/aluno/bem-vindo` direto pelo link "Rever a introdução".
   - O PRD RF20 exige os quatro estados em toda tela nova.
   - Com `/v1/eu` lento ou falho, a tela de foco não tem lateral nem barras. Um aluno de 11 anos fica sem "Fechar" nos três passos obrigatórios e só tem "Sair".
   - Correção exigida:
     - Declarar na seção 9 o que a `BemVindo` mostra enquanto carrega (nada de botão decidido pelo modo, e "Sair" já à vista).
     - Declarar o erro com `EstadoErro`, "Tentar de novo" e um caminho de volta à tela de abertura.
     - Declarar o modo padrão quando a data é desconhecida.
     - Acrescentar a linha "quatro estados da `BemVindo`" nas tabelas de teste da 9.5, 10.3 e 11.3.
     - Mantida a regra de que "Sair" nunca fica mais difícil que entrar (D59).

Recomendações:
- **Letra Maior na introdução.** A 8.4 prova a letra Maior em cinco telas, mas não na `BemVindo`, que é a tela mais alta (onça, balão e botões). A 9.5 só prova 360 px sem a letra. Incluir a `BemVindo` do aluno na 9.5 e conferir que "Continuar" e "Pular" ficam alcançáveis sem perder o `h1`.
- **"Voltar" entre passos.** O aluno que toca "Continuar" sem querer no aviso de privacidade não volta ao passo anterior, só "Rever" depois. Um botão "Voltar" do mesmo peso é barato e coerente com "sair nunca é mais difícil que entrar".
- **Comemoração para leitor de tela.** A 6.2 não diz se o bloco "Atividade entregue." é `role="status"` nem para onde vai o foco depois do envio. Declarar na 6.2 e testar na 6.3.
- **Desvio da primeira entrada.** A seção 5 não diz o que `paginas/Inicio.tsx` mostra enquanto lê `/v1/eu`. Registrar o carregando, para não piscar o Início antes de desviar, e para evitar que o desvio use um `['eu']` velho depois de POST que falhou.
- **Aviso de privacidade.** O teste da 9.1 mede só o tamanho da frase. "CPF" e "matrícula" ficam, mas convém o `conformidade-reviewer` e o Gabriel validarem a leitura por criança de 11 anos antes de fechar o texto.
- **Nome acessível da onça.** O teste da 5.5 diz "nunca é onça", e vale conferir que a pose "comemorando" na tarefa aberta leva o nome da função (Tutor) e o selo "IA" no mesmo bloco (X1, 7b).

Arquivos consultados:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/prd.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/tasks.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md`

## tenancy-guardian · 1ª rodada · REPROVADO · 2026-10-13 08:37:12 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: `usuario`, que ganha `introducao_vista_em timestamptz` nula (seção 3).
- Já tem `escola_id` e id UUID v7. Não precisa de `anoLetivoId`, porque a pessoa não pertence a um ano e a introdução não deve voltar em janeiro.
- A migration (0037, número livre na árvore) só acrescenta uma coluna nula, sem valor padrão e sem índice. O código anterior ignora a coluna, então é compatível com ele.
- A data fica por usuário, isto é, por pessoa e escola. A gravação nunca é copiada para o usuário da outra escola (seção 3, "Duas escolas"; seção 6). Isso fica dentro da regra 60, item 8a.

Queries verificadas:
- **Escrita** (seções 4 e 5). `update usuario ... where escola_id = <contexto> and id = <contexto>`. A rota não tem id no caminho e o corpo é vazio e estrito, então não há `escolaId` vindo do cliente. A ação `eu.concluir_introducao` tem alcance `proprio`. Como não existe objeto endereçável, a questão de responder 404 igual a 403 não se aplica. O `coalesce` com a trava da linha resolve a corrida de dois POST e torna a repetição idempotente.
- **Leitura no `/v1/eu`**. O contexto vem do token, por `identidadeDaRequisicao()` em `EuRepository.doContexto`. O `contaId` sai da linha do próprio usuário, nunca do cliente.
- **Leitura entre escolas**. Usa o `acessosDaConta`, que já é `@SemEscopo` e já filtra conta, desativado, eliminação agendada e aluno. Ele passa a trazer a data, e o service reduz ao valor mais antigo do mesmo papel. `acessos` não ganha campo, nada da outra escola sai no DTO além de uma data da própria pessoa, e não entra `@SemEscopo` novo, só a justificativa estendida. Aceito como desvio registrado (seção 11).
- **`GET /v1/minhas-atividades`, `/v1/tutor/conversa` e `/v1/tutor/memoria`**. A spec só os reutiliza, sem pedir mudança de escopo nem rota nova (seções 1 e 7b). A consulta da conversa continua estrita e recusa `alunoId`.
- **Camada de rede**. Não se aplica. O papel `rede` já tem `eu.ler: 'nunca'`.

Teste de isolamento: presente, mas não prova a escrita só no próprio registro.

Bloqueantes:
- **Tech Spec, seções 6 e 10: a regra de que cada um só grava a própria data fica sem prova.** Os quatro testes da seção 6 e o "repetida, em paralelo, por papel" da seção 10 continuam verdes se a cláusula `id = <contexto>` sair da escrita. Com só `where escola_id = <contexto>`, um POST marcaria a introdução de todos os usuários da escola. O aluno ao lado deixaria de ver o aviso de privacidade obrigatório (RF13), e nenhum teste quebra:
  - "Com o contexto de B, A não muda" passa, porque a escrita continua presa a B.
  - "A linha de B continua nula" passa, porque a escrita em A não toca B.
  - Os dois testes de herança só olham a leitura.

  Correção exigida: acrescentar à seção 6 um teste de integração com dois usuários da mesma escola e do mesmo papel, por exemplo dois alunos da mesma turma e dois professores. Um faz o POST, a linha do outro continua nula e o `/v1/eu` do outro devolve `introducaoVistaEm: null`. A tarefa da rota deve declarar como mutação a retirada de `id = <contexto>`, e o teste tem de ficar vermelho com ela.

Recomendações:
- Incluir na seção 6 o caso "outra conta, na mesma escola ou em outra, com a data gravada, não empresta a data". Hoje quem cobre o filtro de conta é o teste antigo do `acessosDaConta`, e só enquanto a data sair do mesmo método.
- Dizer na seção 4 que `rede` recebe `eu.concluir_introducao: 'nunca'` na matriz, que hoje fica implícito em "os três".
- Dizer na seção 4 o que o POST responde quando o `update` não acha a linha. Deve ser `NAO_AUTENTICADO`, como o `EuService.obter`, e nunca uma resposta que diferencie os casos.
- Reescrever a justificativa do `@SemEscopo` do `acessosDaConta` citando a data, o filtro por mesmo papel feito no service e que ela não sai em `acessos`.
- Registrar na seção 3 que, para o aluno (`conta_id` nulo), a data é só a da própria linha, sem consulta pela conta.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/packages/nucleo/src/db/schema/usuario.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/api/src/sessao/eu.repository.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/api/src/sessao/eu.service.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/api/src/sessao/resolucao-de-tenant.repository.ts (o `acessosDaConta`)
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/packages/shared/src/permissao/matriz.ts

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-13 08:38:25 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: REPROVADO

Caminho quente tocado: login | tutor | migration

Rate limit: ok

Fila e prioridade: ok (não se aplica: nenhuma fila e nenhum job)

Concorrência: protegida

Índice e paginação: faltando (custo por carga da tela inicial do aluno, ver o bloqueante)

Degradação de IA: não se aplica

Migration: compatível

Métrica e alerta: ok

Bloqueantes:

1. **Tech Spec, seção 7c ("Carga na manhã de segunda" e "Métrica, alerta, teste de carga"), e seção 9 ("Início").** A spec trata a requisição nova do Início como leve ("a que a tela do Tutor já faz") e não atualiza o cenário de carga. As duas coisas estão erradas.
   - **O que essa requisição faz.** Hoje o aluno cai em Atividades, que só lê `minhas-atividades`. Com a X4, todo aluno que entra às 7h30 também dispara `GET /v1/tutor/conversa?limite=1`. Pelo código de hoje (`apps/api/src/tutor/tutor.service.ts:373-386` e `apps/api/src/ia/orcamento.repository.ts:38-60`), essa chamada faz umas oito consultas. A cara é a contagem de `mensagem_tutor` da **turma inteira desde o dia 1º do mês**, com o `not exists` contra `execucao_agente` linha a linha. No fim do mês, isso passa de 10 mil linhas por turma em cada carga do Início.
   - **Por que é carga nova.** Hoje essa contagem só roda quando o aluno abre o Tutor ou manda mensagem, espalhado ao longo da aula. A X4 a leva para a rajada de login: 2.100 alunos em 5 minutos.
   - **Por que o teste atual não mede isso.** O cenário `infra/k6/login-7h30.js` exercita só `GET /v1/sistema/contexto` depois do login, então ninguém mede essa carga.
   - **A configuração do TanStack Query não está declarada.** Com o padrão do cliente (`staleTime` de 30 s e releitura ao voltar para a aba), cada volta ao Início depois de 30 s refaz a contagem. Isso pesa num Chromebook que troca de aba o tempo todo.
   - **Correção exigida na Tech Spec:**
     - (a) Declarar, na 7c, o custo por carga do Início: as consultas de `tutor/conversa` sem atividade, com o `EXPLAIN` da contagem do mês no volume de fim de mês (35 alunos, cerca de 20 trocas por dia, 20 dias). Ou trocar a fonte do "Hoje: N de 60" e da pausa por uma leitura que não conte o mês da turma.
     - (b) Mudar o cenário "login às 7h30" para que a conta de aluno, depois do login, faça o que a web faz: `/v1/eu`, a primeira página de `minhas-atividades` e `tutor/conversa?limite=1`. O limite do p95 das autenticadas continua valendo.
     - (c) Declarar na seção 9 o `staleTime` e o `refetchOnWindowFocus` das três leituras da tela inicial e de Eu.
     - (d) Pôr o cenário atualizado na tabela de testes da seção 10.

Recomendações:

- **Seção 7c, "Rate limit".** Nada a corrigir. O `POST /v1/eu/introducao` no contador geral do Redis, por usuário e por escola, fecha o item. O desvio da primeira entrada não acrescenta chamada ao `/v1/eu`: o `Inicio.tsx` de hoje já o lê, e a introdução usa o mesmo cache `['eu']`.
- **Seção 7c, "Corridas".** Nada a corrigir. O `update … coalesce(…) returning` numa instrução só, com o teste em `Promise.all`, fecha o clique duplo e as duas abas.
- **Seção 3, migration.** Nada a corrigir. Coluna nula sem valor padrão segue o mesmo padrão da `0035` (`eliminacao_agendada_em`), e `migrar.ts` já aplica `lock_timeout`. Vale só escrever, no cabeçalho da `0037`, a nota "só expande" que a `0035` tem.
- **Seção 9, Eu.** `GET /v1/tutor/memoria` devolve no máximo 50 trabalhos (`MAXIMO_DE_ITENS_NA_MEMORIA`) e também os `sinais`, que a tela não mostra. Ou a tela diz que "Como estou indo" mostra os 50 mais recentes, ou ela ganha leitura paginada. A leitura dos `sinais` que ninguém mostra fica registrada para o F9.
- **Seção 7, casos de borda.** Para o aluno sem turma, `tutor/conversa` responde `NAO_ENCONTRADO`. A spec deve dizer que o Início trata esse 404 como "sem uso" e não como o erro com "Tentar de novo", senão o caso de borda do PRD vira estado de erro.
- **Fora da spec, registrar no `TODO.md`.** `orcamento.consultar` e `usoDeHoje` contam as trocas do dia duas vezes na mesma requisição de `tutor/conversa`.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/api/src/tutor/tutor.service.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/api/src/ia/orcamento.repository.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/infra/k6/login-7h30.js
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/api/cliente-de-consultas.ts

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-13 08:38:42 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: REPROVADO

O bloqueante é o texto do aviso de privacidade. O resto do desenho está em conformidade.

**Campos pessoais tocados:**
- `usuario.introducao_vista_em`, nova, nos três papéis.
- `usuario.nome`, que já sai no `/v1/eu` e só ganha uso na saudação.
- Leitura de `GET /v1/tutor/memoria` (trabalhos e sinais do próprio aluno) e do uso do dia, por `GET /v1/tutor/conversa?limite=1`. As duas rotas já existem.
- No navegador, a chave `educa.letra` (`grande` ou `maior`), sem identificador.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. A coluna nova tem finalidade e retenção (PRD §8), e a linha entra no mapa na própria tarefa 1.0 (Tech Spec §7; tarefa 1.5). Falta só a base legal, que o mapa tem como coluna e o PRD não diz (ver recomendações).

**Autorização por objeto:** ok. A rota não recebe id nenhum. Escreve e lê pelo `escola_id` e `id` do contexto, com `coalesce` (Tech Spec §5 e §6). Pela matriz, `eu.concluir_introducao` é `proprio` nos três papéis e `nunca` na rede. A única leitura entre escolas usa o método que já é `@SemEscopo` (`acessosDaConta`). Ela devolve a data só ao service, filtra o mesmo papel, ativo e sem eliminação agendada, e `acessos` não muda. Os quatro testes de isolamento estão na §6. A memória do Tutor e o uso do dia já são da própria pessoa por contrato.

**Logs:** limpos. Nenhuma linha nova (Tech Spec §7; tarefas 1.0, 7.0 e 8.0).

**Auditoria:** não precisa de auditoria nova. Gravar a própria data não é leitura de dado alheio, exportação, nota, permissão nem aprovação de IA (regra 20, item 10; Tech Spec §7).

**Envio externo:** nenhum. Nenhuma chamada de modelo nova (Tech Spec §8).

**Seed/fixture:** sintético. As fixtures e a vitrine só passam a gravar a data (tarefa 1.4).

**Pergunta de fechamento:** responde. A coluna entra em `LEITURAS_DO_ARQUIVO.usuario.colunas`, presa pelo teste de cobertura (Tech Spec §7, linha "Arquivo do titular"). Sai com a linha no expurgo de `pessoa_desativada` e na eliminação, e nada novo vai para fora.

**Itens da lista:**

| Item | Situação |
|---|---|
| Campo na tabela, com finalidade e retenção | garante (PRD §8; Tech Spec §7) |
| Campo proibido para aluno | não se aplica: nenhum |
| Adaptação, não diagnóstico | não se aplica. O tamanho da letra é preferência local e não toca na adaptação registrada (D35) |
| DTO explícito | garante. `esquemaRespostaEu` é estrito, e o campo é só da pessoa (Tech Spec §4 e §7) |
| 404 igual a 403 | não se aplica: a rota não tem id |
| Bucket privado, convite, exportação | não se aplica |
| Erro sem stack | garante, com o `ENTRADA_INVALIDA` de hoje (tarefa 1.0) |
| IA: mínimo, `ExecucaoAgente`, provedor local, rede sem conversa | não se aplica: nada novo |
| Ciclo de vida e retenção | garante: segue a linha `usuario` (Tech Spec §7) |
| `localStorage` | garante. Só por escolha, sem identificador, só na área do aluno, com teste de armazenamento vazio e de armazenamento recusando (Tech Spec §5; tarefa 8.0) |
| Memória do Tutor (D66, regra 70 item 4d) | garante. A web mostra só `resultado` não nulo, ou seja, lote aprovado. `aReforcar` vai como a API mandou, sem limiar, e os sinais não aparecem (Tech Spec §7b; tarefa 7.0) |
| Aviso de privacidade | **falha** (bloqueante abaixo) |

**Bloqueantes:**

1. **Tech Spec §7b, PRD RF14 e tarefa 9.1: o aviso promete uma coisa e o sistema faz outra, e o teste da RF14 prende o texto errado.**
   - **"Guardamos suas tarefas, suas notas aprovadas"**: o sistema não tem nota (D46; `docs/lgpd.md` §2: "Não existe tabela `nota`"). O que existe é a correção, com acertos por habilidade, e ela fica gravada antes da aprovação.
   - **"o que você estudou com o Tutor"**: o sistema guarda o texto que o aluno escreve e a resposta do Tutor (`mensagem_tutor`). Guarda também os sinais "travou" e "pediu a resposta pronta", nominais ao professor. A frase ameniza justamente o dado que a §6, item 6 do `docs/lgpd.md` chama de sensível na prática.
   - **Quem vê, incompleto**: o aviso não diz que o que o aluno escreve ao Tutor passa por um programa de IA de uma empresa que trabalha para a escola. Isso existe (`consumo_ia.envio_externo` e `provedor`, D62) e é o que a lista de compartilhamento responde ao titular. A frase "Seus dados não treinam IA", sozinha, faz parecer que o dado não vai a lugar nenhum. O aviso também não diz que o professor vê as tarefas e o resultado delas, além do uso do Tutor.
   - **Sem prazo**: o aviso não diz por quanto tempo nada fica guardado (LGPD, art. 9º, II).

   Com isso, a pendência 12 de `docs/aia/tutor.md`, a seção 9 do `docs/lgpd.md` e o item 3 da seção 12 do `docs/conformidade-mec.md` seriam fechados com um texto que não descreve o tratamento (LGPD, arts. 6º, VI, 9º e 14, § 6º).

   **Correção exigida**, no PRD RF14, na Tech Spec §7b e na tarefa 9.1:
   - Trocar "notas aprovadas" por "o resultado das tarefas".
   - Trocar "o que você estudou com o Tutor" por "o que você escreve para o Tutor e o que ele responde".
   - Acrescentar uma frase de prazo. Ela vem do prazo da escola em `GET /v1/privacidade/retencao`, ou diz que a escola escolhe, porque o prazo varia de 6 a 24 meses por escola e não pode ser fixo no texto.
   - Acrescentar uma frase dizendo que o que o aluno escreve ao Tutor passa por um programa de IA de uma empresa que trabalha para a escola.
   - Acrescentar que quem dá a aula vê as tarefas e o resultado.
   - O teste de unidade da RF14 passa a exigir as frases de guarda, prazo e compartilhamento, e a recusar "nota".

**Recomendações:**
- **Base legal da linha nova no mapa:** "execução de contrato" (PRD §8 e tarefa 1.5).
- **Finalidade "mostrar que o aviso foi apresentado":**
  - Para professor e coordenação ela não se sustenta, porque o pulo também grava a data.
  - Para o aluno, sem versão do aviso, a data não diz qual texto ele viu.
  - Com o bloqueante 1 o texto vai mudar, e quem já viu não vê de novo.
  - Ou se guarda a versão do aviso, ou se tira essa finalidade e fica só "não repetir".
- **Minimização no `/v1/eu`:** a tela só precisa saber se a pessoa já viu. Um booleano `introducaoVista` evita levar à resposta da escola A o horário em que a pessoa entrou na escola B. A data exata continua no arquivo do titular.
- **Arquivo do titular, versão da coordenação:** decidir se `introducao_vista_em` do professor entra nela. É quase um sinal de adoção (D64, PRD §4: "Saber se um professor viu ou pulou a dele").
- **Tarefa 7.1:** o `select` do TanStack não tira os `sinais` do cache, porque o cache guarda o que a `queryFn` devolveu. O filtro tem de ser na `queryFn`, senão o teste "nada deles vai ... ao cache" da tarefa 7.0 falha ou acaba enfraquecido. Não é vazamento: o dado é do próprio aluno.
- **`educa.letra`:** registrar também no `docs/lgpd.md`, e não só no `docs/interface.md`, que a chave não é dado pessoal e por quê, como já se faz com o cookie de dispositivo. Acrescentar ao teste que a chave nunca vai em requisição. "Fonte ampliada" é tipo de adaptação, dado sensível (D35), e a preferência local não pode virar inferência disso.

**Arquivos lidos:**
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/7_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/8_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/docs/lgpd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/packages/shared/src/tutor/tutor.ts
[… 1 linhas cortadas]

## conformidade-reviewer · 1ª rodada · REPROVADO · 2026-10-13 08:38:59 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum. A spec não grava `Nota`. A única escrita nova é `usuario.introducao_vista_em` (Tech Spec §3 e §5, "Escrita"). As fixtures e a vitrine só criam pessoa com a introdução já vista (§10). Todos com autor humano? Não se aplica: não há escrita em `Nota`.

Decisão autônoma sobre aluno: ausente. "Como estou indo" mostra o que a API já entrega, sem limiar calculado na web (§7b). As habilidades a rever (`aReforcar`) saem de forma determinística dos erros da correção aprovada, em `apps/api/src/tutor/tutor.service.ts`, `memoria()`.

Aprovação registrada: ok.
- Tarefa só aparece como "Corrigida", e o resultado do aluno só aparece, quando o lote foi aprovado (RF6, RF7; §7b: só `resultado` não nulo).
- Os `sinais` são descartados antes de chegar à tela (tarefa 7.1).
- D55: não há discursiva nesta fatia (`packages/shared/src/atividade/correcao.ts`), e nenhuma tela sugere nota.
- A introdução do professor diz que a IA não corrige redação nem discursiva (RF15, tarefa 10.1).
- A exceção D47 aparece só para o Tutor.

Supervisão do tutor: ok.
- A faixa fica presa e não fecha, com uma formulação só (`TEXTO_DA_SUPERVISAO`, §7b).
- A caixa do Tutor existe em todo estado de pausa (RF5, D36).
- Nada infere emoção.
- O uso do dia é do próprio aluno (D38).
- A coordenação não sabe quem viu a introdução: a tarefa 11.0 testa que `/v1/professores` não traz o campo (D64).

Autonomia declarada e visível: sim, sem mudança nesta spec (§8: nenhuma função e nenhuma chamada de modelo nova).

**Parecer pedido pelo PRD §8b**
- **Comemoração na entrega:** favorável, com as condições da tarefa 6.0: uma vez, só depois do envio confirmado, sem número, acerto, "parabéns" nem som, e parada com "reduzir movimento". Vale com as correções B1 e B2.
- **Avisos sem "pular":** favorável. É a transparência exigida pelo Decreto 12.880, art. 11, e pela LGPD, art. 14, § 6º. "Sair" fica à vista e não grava, então sair não fica mais difícil que entrar (D59).
- **Falas da onça:** favorável, com a correção B3.

Bloqueantes:

1. **B1. Tech Spec §9 ("Peças novas"), PRD RF19 e tarefa 5.1: a onça das poses pode ter expressão.**
   - O que está errado: a D80, item 3, diz que a onça tem "uma expressão neutra só" e não reage ao acerto, à presença nem ao tempo de uso de ninguém. O RF19 proíbe só "expressão de preocupação", o que deixa liberada, por exemplo, uma cara alegre na pose comemorando. O teste da 5.0 ("onça (RF19)") não confere a expressão.
   - Correção exigida: fixar na §9 e no RF19 que as três poses usam o mesmo rosto neutro da cabeça da X1 (olhos e boca) e que só o corpo muda. Na 5.0, um teste de componente que compara o rosto de cada pose com o rosto neutro.

2. **B2. PRD RF19, Tech Spec §13 ("A comemoração é vetada… o fim da introdução fica parado") e tarefa 5.0 ("Fora do escopo"): comemoração fora da entrega.**
   - O que está errado: a spec deixa implícito que o fim da introdução usa a pose comemorando e a `Comemoracao`. A D80, item 7(a), permite comemoração só na entrega de uma tarefa. O `docs/interface.md` 9.7 dá à introdução só acenando e apontando, e reserva comemorando para a entrega.
   - Correção exigida:
     - (a) O RF19 passa a dizer que a introdução usa acenando e apontando, e que o fim dela fica parado, sem `Comemoracao`.
     - (b) A §13 tira a frase sobre o fim da introdução.
     - (c) O teste de arquitetura da 5.0 prova duas coisas: a pose `comemorando` só é desenhada pela `Comemoracao`, e a `Comemoracao` só é importada por `areas/aluno/Atividade.tsx`.

3. **B3. PRD RF19 e Tech Spec §9 e §7b: as falas não estão presas à regra 70, item 4a (D58).**
   - O que está errado: os testes das tarefas 9.1, 10 e 11 reprovam só "fala de sentimento". A spec não fixa as falas do aluno (só o texto do aviso de privacidade). Nenhum teste prova que a fala não diz que é pessoa, não promete presença nem retorno e não simula vínculo. O mockup tem esse tipo de frase, como "Amanhã eu volto".
   - Correção exigida: o RF19 e a §7b fixam que as falas são texto fixo em `.ts` e que nenhuma varia com presença, ausência, acerto ou tempo de uso. O teste de unidade dos textos dos três papéis reprova:
     - afirmar ser pessoa, professor ou amigo;
     - prometer voltar, esperar ou estar sempre ali;
     - termos de vínculo ou saudade.
     
     Além disso, a fala do passo 1 do aluno diz que o Tutor é um programa, e o teste prova isso.

Recomendações:
- Tarefa 3.2: a saudação "Oi, <nome>." assinada pelo Tutor deve ser fixa, sem "de volta" nem "faz tempo", com teste.
- Tarefa 3.2: o uso do dia deve se ler como limite e não como meta a encher, por exemplo "Você pode fazer até 60 perguntas hoje; já fez N".
- Tarefa 9.1: o aviso diz "suas notas aprovadas", mas nesta fatia não existe `Nota`. Trocar por "seus resultados aprovados".
- Tarefa 7.2: "Como estou indo" mostra parte da memória sem caminho de contestação (regra 70, item 4d; D66, que fica para o F9). Uma linha "Achou algo errado? Fale com quem dá a aula." cobre o intervalo até lá.
- Tarefa 1.0: decidir e testar que `introducao_vista_em` entra só na versão do arquivo do titular que é da própria pessoa, e não na versão `coordenacao` (D64).
- Tarefa 11.1: o passo 2 pode dizer também que a conversa do professor com o Assistente nunca é visível à coordenação (regra 70, item 8).

Arquivos citados:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/docs/interface.md (seção 9.7)
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/docs/decisoes.md (D80, itens 3 e 7)

## test-engineer · 1ª rodada · REPROVADO · 2026-10-13 08:40:02 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Rota nova (1.0).** Caminho feliz nos três papéis; POST repetido; dois POST em paralelo; virada de ano; escola sem ano letivo em curso; vínculo encerrado numa escola e aberto na outra; mesmo papel em duas escolas; papéis diferentes; isolamento entre escolas e entre pessoas da mesma escola; corpo com campo; rede recusada; arquivo do titular.
- **Telas.** Os lugares do aluno e os endereços; os quatro estados de cada tela; pausas sem tirar o caminho até o Tutor (D36); faixa presa; varredura contra colega, sequência e pontos; "Corrigida" só com aprovação; comemoração uma vez e nunca de nota; letra só por escolha, só no `/aluno` e a 360 px; introdução na primeira e na segunda entrada, avisos sem "pular", sair no meio, POST que falha, rever, duplo clique; onça em três poses (D58); texto do aviso (RF14); incidente por cima; D64; recomeço no mesmo Chromebook.
- **Bordas do PRD §7.** Sem turma, transferido, dois alunos no mesmo Chromebook, duas escolas e virada, duas abas, gravação que falha, incidente.

**Cobertos:**
- **1.0:** caminho feliz, repetida, `Promise.all` de verdade, duas escolas, dois papéis, desativado, contexto trocado de escola (o padrão de `eu.repository.int.test.ts:15`, que pega a remoção do `escola_id`), corpo estrito, arquivo do titular.
- **2.0 a 8.0:** lugares, endereços, redirecionamento, estados, pausas, avaliativa, sem turma, varredura RF10, três grupos e "Corrigida" só com `com_diagnostico`, sinais fora da tela, armazenamento vazio em Eu, comemoração (envio, reabrir, resultado, falha, movimento reduzido, sem número), letra (primeiro quadro, recusando, inválido, só no aluno, mesmo computador, teclado, 360 px).
- **9.0 a 11.0:** avisos sem "Pular", sair no meio, POST que falha, rever, duplo clique, recomeço, convite e segundo fator, troca de escola pelo seletor, incidente por cima, D64 em `/v1/professores`.
- **Gerais:** nenhum `.skip`; nenhum provedor de IA; não há job nem fila.

**Bloqueantes:**

1. **Tarefa 1.0, Tech Spec §6 e §10: falta o caso da escola sem ano letivo em curso.**
   - **Por que importa:** a primeira entrada real da coordenação acontece numa escola recém-criada, antes de ela abrir o ano (A1). Hoje o `/v1/eu` usa `identidadeDaRequisicao()`, que não exige ano. Mas se a escrita nova chamar `sessaoDaRequisicao()` ou `exigirAnoEmCurso()`, a rota responde 401 ou 404. A web segue em frente, e a introdução volta em toda entrada, sem nenhum teste vermelho. O caso "o ano novo não a apaga" só prova que a data fica na linha, não que a rota funciona sem ano.
   - **Correção exigida:** caso de integração em `introducao.int.test.ts` no molde de `sessao-guarda.int.test.ts:199` e `:220`. Com a escola sem ano em curso, e com a escola entre anos (um encerrado e um planejado), o POST responde 200 e grava, e o GET devolve a data.

2. **RF12 contra a Tech Spec §3 e §6 e a tarefa 1.0 ("o desativado não empresta"): o vínculo encerrado numa escola e aberto na outra contradiz o RF12.**
   - **O que acontece:** a professora conclui a introdução em A. Em B ela só pega a data emprestada de A, e a linha de B fica nula. Quando o vínculo com A termina (regra 20, item 18), a linha de A deixa de emprestar e a introdução reabre em B.
   - **O que isso viola:** o RF12 ("uma vez só") e o PRD §7 ("nem a troca de escola nem o ano novo a reabrem"). O caso que a 1.0 manda escrever fixa justamente esse defeito.
   - **Correção exigida:** decidir e escrever na §3 uma de três saídas:
     - o GET com data emprestada grava na linha da própria sessão, com `coalesce`, no próprio escopo;
     - o usuário desativado da mesma conta também empresta, porque a data é da mesma pessoa;
     - ou o PRD aceita que a introdução reabre.
   - **O teste:** o cenário "marca em A, A é desativada, `/v1/eu` em B" com o comportamento escolhido declarado.

3. **Tarefa 1.0, tabela de testes: a cláusula `id = <contexto>` da escrita (Tech Spec §5, "Escrita") fica sem teste que a derrube.**
   - **O que escapa:** se ela sair, o UPDATE marca todos os usuários da escola. Os casos listados não pegam isso: isolamento e duas escolas olham outra escola, e o caminho feliz pode passar conforme a ordem.
   - **Correção exigida:** caso "outro usuário da mesma escola (um aluno e uma professora) continua nulo depois do POST", com o bloco de mutação apontando para ele.

4. **Tarefa 9.0, linha "texto do aviso (RF14)": a transparência que a lei pede está provada só em parte.**
   - **O que falta:** nenhum caso afirma o passo 1, "o Tutor é um programa e pode errar". É o ponto do Decreto 12.880, art. 11, e da D58.
   - **Do RF14 ficam sem asserção:** "o que guardamos", "quem vê" (a coordenação em números, com registro, e os colegas não) e "como pedir os dados". Apagar qualquer uma dessas frases não deixa o teste vermelho.
   - **Correção exigida:** em `textos-da-introducao.test.ts` e `aviso-de-privacidade.test.ts`, uma asserção por elemento do RF13 e do RF14, e os três primeiros passos com `obrigatorio: true`.

5. **Tarefa 9.0, tabela: falta o RF11 no passo 4 e o RF12 "em nenhum computador".**
   - **RF11 no passo 4 (letra):** a 8.0 deixa "a escolha dentro da introdução" para a 9.0, e a 9.0 não a testa. Faltam três casos:
     - seguir ou pular o passo 4 sem escolher deixa o `localStorage` vazio;
     - escolher "Maior" ali aplica na hora e fica guardado;
     - a introdução com "Maior" a 360 px não rola de lado.
   - **RF12 "em nenhum computador":** a segunda entrada precisa acontecer num contexto novo do navegador (`browser.newContext()`), e o armazenamento precisa ficar sem nenhuma marca da introdução. Senão, uma marca guardada no navegador passaria no teste.

**Recomendações:**
- **1.0:**
  - Falta o quarto caso da §6, "a eliminação agendada não empresta".
  - Para matar a mutação do `coalesce` sem depender do milissegundo, pré-gravar uma data antiga conhecida e exigir exatamente essa data no POST repetido e nos dois em paralelo.
  - A resposta do POST deve ser o mesmo valor que o GET devolve (a mais antiga), com teste: na B, sem data própria, o "Rever" grava agora, e o cache `['eu']` ficaria diferente do GET.
  - Caso com datas nas duas escolas, para provar que vale "a mais antiga".
  - Sessão de rede recusada.
  - `packages/shared/src/permissao/matriz.expectativa.ts` na lista de arquivos.
- **Arquivo do titular:** decidir se a data entra na versão `coordenacao` (D64) e testar essa versão. Hoje a prova D64 da 11.0 só olha `/v1/professores`.
- **2.0:** afirmar que "Sair" tem o mesmo tamanho dos vizinhos (RF3, D59).
- **3.0:** na pausa, afirmar o `href` do "Pedir ajuda ao Tutor", e não só que o link existe.
- **7.0:** nomear agora o teste do aluno transferido para a memória. Em `apps/api/src/tutor/tutor.int.test.ts:815` só a conversa está coberta, não a memória.
- **9.0:** depois do POST que falha, o cache não pode guardar data falsa, e a introdução volta na entrada seguinte. Conferir a frase "abra Eu e depois Privacidade" contra `NAVEGACAO.aluno`.
- **PRD:** dizer que o aluno com usuário em duas escolas, sem conta, vê a introdução nas duas.

Spec revisada: `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/` (`prd.md`, `techspec.md`, `1_task.md` a `11_task.md`). Nenhum arquivo foi alterado.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-13 08:48:42 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: APROVADO
Tela vista: não (revisão de spec, não existe código nem foto; a tela será vista na validação da X4)
Estados: ok. Seção 9, "Estados da `BemVindo`": carregando, erro, data desconhecida e com dado.
Acessibilidade: ok no desenho (§9).
Chromebook fraco: ok (§9; §7c).
Celular: ok (§9).
Ação oficial protegida: sim (não se aplica; nenhuma ação oficial nova, e a regra da nota e o aviso sem "nota" estão na §7b)

**Correção exigida da rodada 1: atendida.**
- A seção 9 agora tem "Estados da `BemVindo`", para os três papéis. Ela lê `['eu']`, do cache se o desvio já o leu.
- Carregando: mostra a fala do passo 1 e "Sair" à vista, sem "Fechar" nem "Pular". Nenhum botão fica decidido pelo modo.
- Erro: `EstadoErro` com "Tentar de novo", "Voltar para a abertura" e "Sair".
- Data desconhecida: vale o modo primeira vez. Essa é a escolha mais protetora para um aluno de 11 anos, e "Sair" continua à vista (D59).
- Seção 5, "Rever": com a data gravada, todo passo tem "Fechar".
- A linha "quatro estados da `BemVindo`" está nas tarefas 9, 10 e 11 (`9_task.md:52`, `10_task.md:51`, `11_task.md:52`), e a seção 10 e o `tasks.md` (9.5, 10.3, 11.3) também a citam.
- A frase "carregando e erro são os da `Inicio`" foi substituída pelo desenho próprio.

**Decisão do §12b.4 (Início sem `GET /v1/tutor/conversa`): atende a regra de frontend.**
- A razão é de carga: a leitura conta as trocas do mês da turma inteira e entraria na rajada de login das 7h30 (regra 80). Isso está na §7c.
- Estados: o Início mantém os quatro (`3_task.md`): carregando; vazio ("Nenhuma tarefa por agora", só com a leitura terminada); erro com "Tentar de novo", mantendo a saudação e a faixa; com dado.
- Caminho até o Tutor: o "Pedir ajuda ao Tutor" de cada tarefa leva à conversa (testado com `href`), e continua nas avaliativas (D36).
- A faixa de supervisão fica presa e sem fechar, à vista depois de rolar a 360 px.
- Os avisos de limite do dia e de função suspensa ficam na tela do Tutor, que é onde a pessoa os encontra ao tentar falar com ele, e têm e2e próprio (`e2e/aluno-tutor.spec.ts`).
- O Início avisa a avaliação aberta, que é o estado que importa antes de entrar.
- O "Hoje: N de 60" não fica no Início. É perda aceitável de clareza, sem violar a regra 50.

Bloqueantes: nenhum

Recomendações:
- Com zero tarefas, o Início não oferece rota até o Tutor, porque a conversa é sempre atrelada a uma atividade (`EscolhaDaAtividade`, `Tutor.tsx:147`). Isso é o comportamento de hoje, mas vale a frase de vazio dizer isso ao aluno ("Quando houver tarefa, o Tutor ajuda por aqui"), para o vazio convidar em vez de só constatar.
- Provar "Fechar" em todo passo no modo revendo também com `/v1/eu` vindo do cache e depois de erro seguido de "Tentar de novo".
- Rodada 1, ainda recomendações: letra Maior na `BemVindo`, "Voltar" entre passos, `role="status"` na comemoração e nome acessível da onça comemorando. A decisão sobre cada uma continua sendo do time.

Arquivos de referência (todos em `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/`): `techspec.md` (§5, §7c, §9, §12b), `3_task.md`, `9_task.md`, `10_task.md`, `11_task.md`, `tasks.md`.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-13 08:49:52 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: REPROVADO

Faltam duas coisas, as duas pequenas: o PRD promete mais do que a saída do RF12 entrega, e a gravação que o GET passou a fazer não tem teste que prove que ela fica na linha da própria pessoa.

**Cenários exigidos:**
- caminho feliz (POST grava, GET devolve);
- POST repetido e dois POST em paralelo;
- escola sem ano letivo em curso e escola entre anos;
- só a própria linha (dois alunos da mesma turma, dois professores da mesma escola);
- duas escolas com a mesma conta e o mesmo papel;
- vínculo encerrado (RF12);
- papéis diferentes e outra conta não emprestam a data;
- eliminação agendada não empresta;
- sessão de rede recusada;
- arquivo do titular, na versão própria e na `coordenacao`;
- texto do aviso, um elemento por asserção (RF13 e RF14);
- passo 4, tamanho da letra (RF11);
- segunda entrada em contexto novo do navegador ("em nenhum computador");
- quatro estados da `BemVindo`;
- falas fixas (D58);
- Início sem `tutor/conversa`, mais o cenário do k6.

**As cinco correções da rodada 1:**

1. **Escola sem ano em curso: atendida.**
   - A Tech Spec §5 ("Escrita") diz que o POST e o GET usam `identidadeDaRequisicao()`, nunca `sessaoDaRequisicao()` nem `exigirAnoEmCurso()`.
   - A §6 traz o caso, e a tarefa 1.0 tem a linha "escola sem ano em curso", no molde de `sessao-guarda.int.test.ts` (conferi o molde: os dois casos estão nas linhas 199 e 220).

2. **RF12 com vínculo encerrado: atendida só em parte.**
   - A Tech Spec §3 ("Primeira saída") e a §12b, item 1, decidem que o GET copia para a própria linha a data que pega de outro vínculo.
   - A tarefa 1.0 tem a linha "vínculo encerrado (RF12)" com a mutação "tirar a gravação do GET deixa vermelho". Com essa mutação, a linha de B fica nula, o vínculo desativado não empresta, o GET volta nulo e o teste fica vermelho. Então a regra da gravação tem teste que a derruba.
   - A linha "duas escolas" também lê a linha de B depois do GET.
   - O que falta está nos bloqueantes 1 e 2.

3. **Cláusula `id = <contexto>` da escrita do POST: atendida.** A tarefa 1.0 tem a linha "só a própria linha" (dois alunos, dois professores, a linha do outro fica nula) com a mutação. A Tech Spec §6 e a §10 repetem o caso.

4. **Texto do aviso: atendida.** A tarefa 9.0 tem:
   - uma asserção por elemento do RF14, recusando "nota";
   - a linha do passo 1, "o Tutor é um programa e pode errar", com os três primeiros passos em `obrigatorio: true`;
   - a lista de frases da 9.1 cobrindo cada elemento.

5. **RF11 no passo 4 e RF12 "em nenhum computador": atendida.** A tarefa 9.0 tem a linha "passo 4 (RF11)" (`localStorage` vazio sem escolha, "Maior" aplicado e guardado, 360 px sem rolagem lateral) e a segunda entrada em `browser.newContext()`.

**Bloqueantes:**

1. **O PRD promete mais do que a saída escolhida entrega.**
   - Onde: PRD, RF12 ("uma vez só, mesmo se o vínculo de uma delas terminar") e §7 ("nem o fim de um vínculo a reabrem").
   - Contra o quê: a Tech Spec §6 e a linha "vínculo encerrado" da tarefa 1.0 declaram o contrário para um caso: quem não abriu o `/v1/eu` em B antes do fim do vínculo de A vê a introdução de novo. O próprio teste vai afirmar esse comportamento, então o RF12 como está escrito fica sem teste que o prove. O Validador vai achar a contradição.
   - Correção exigida, uma das duas:
     - pôr a ressalva no RF12 e na §7 do PRD (e na §12b, item 1), algo como "desde que a pessoa tenha entrado na outra escola enquanto o vínculo estava ativo";
     - ou fechar o caso que sobra fazendo o vínculo desativado da mesma conta também emprestar a data, e trocar o teste.

2. **A escrita nova do GET não tem teste que prove que fica na própria linha.**
   - Onde: Tech Spec §3 ("Primeira saída") e §6; tarefa 1.0, linhas "duas escolas" e "Mutações".
   - O GET agora grava a data emprestada com uma instrução que não é a do POST: o valor é a data de outra escola, não `now()`.
   - Se essa instrução perder o `id = <contexto>`, a data da professora vai para todo usuário de B com a data nula, alunos inclusive, e todos eles pulam a introdução, o aviso de privacidade junto.
   - O caso "só a própria linha" passa pelo POST e não alcança essa instrução. A seção "Mutações" pede um bloco só para "tirar `id = <contexto>` da escrita", no singular.
   - Correção exigida, uma das duas:
     - na linha "duas escolas" da tarefa 1.0 (e na §6), acrescentar que outro usuário de B, um aluno e um professor sem conta em A, continua com a linha nula e o `/v1/eu` nulo depois do GET da professora; e pôr na lista de mutações obrigatórias um quarto bloco, "tirar `id = <contexto>` da escrita do GET", apontando para esse caso;
     - ou declarar na Tech Spec §5 que o GET e o POST gravam pelo mesmo método do repository, com a data como parâmetro. Aí a mutação que já existe cobre os dois caminhos.

**Recomendações (não bloqueiam):**
- Linha "vínculo encerrado" da tarefa 1.0: escrever a ordem por inteiro, "marca em A → `/v1/eu` em B → A desativada → `/v1/eu` em B devolve a data". O "(já copiada)" deixa implícito o GET do meio. Separar o caso que sobra num teste próprio: marca em A, desativa A sem GET em B, e o GET em B volta nulo.
- Caso de integração da data emprestada com B sem ano em curso: a professora de A, com ano em curso, entra em B, escola recém-criada. O GET grava sem `exigirAnoEmCurso()`. Hoje o caso sem ano só cobre o POST e o GET da própria data.
- Tarefa 3.0, linha "carga do login (k6)": dizer que as contas da rajada incluem aluno com a introdução já vista. Senão o `/v1/eu` faz a cópia no meio da rajada, ou o cenário não chega ao Início.
- A recomendação da rodada 1 sobre o aluno transferido na memória do Tutor (`tutor.int.test.ts:815` cobre só a conversa) não aparece na tarefa 7.0. Continua como recomendação.
- As outras recomendações da rodada 1 foram feitas e bastam:
  - eliminação agendada;
  - data antiga pré-gravada para matar a mutação do `coalesce`;
  - POST respondendo o mesmo que o GET;
  - datas nas duas escolas;
  - sessão de rede recusada;
  - `matriz.expectativa.ts`;
  - versão `coordenacao` do arquivo do titular;
  - "Sair" do tamanho dos vizinhos e o `href` do "Pedir ajuda ao Tutor";
  - PRD dizendo que o aluno em duas escolas, sem conta, vê a introdução nas duas.

Arquivos lidos, todos em `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/`: `prd.md`, `techspec.md`, `tasks.md`, `1_task.md`, `3_task.md`, `5_task.md`, `7_task.md`, `9_task.md`, `10_task.md`, `11_task.md` e `revisao-spec.md`.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-13 08:49:57 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: APROVADO

**Caminhos de escrita em Nota:** nenhum. A spec não escreve em `Nota` nem em correção. Ela só lê `GET /v1/tutor/memoria`, mostra apenas o que tem `resultado` não nulo (lote aprovado) e não calcula limiar (§7b; tarefa 7.1). Todos com autor humano? Não se aplica.

**Decisão autônoma sobre aluno:** ausente. "Como estou indo" mostra `aReforcar` como a API mandou, sem limiar e sem "Vale revisar" (§7b; tarefa 7.2).

**Aprovação registrada:** ok. Não há saída de IA nova (§8: nenhuma chamada de modelo). "Corrigida" só aparece com correção aprovada (RF6, RF9; tarefas 4.0 e 7.0). A exceção da D47 continua só no Tutor (§7b).

**Supervisão do tutor:** ok.
- A faixa fica presa e sem fechar no Início, com `TEXTO_DA_SUPERVISAO` (RF4; tarefa 3.2, teste "faixa presa"). Os `sinais` não vão à tela nem ao cache (tarefa 7.1).
- A decisão por delegação "o Início não lê `tutor/conversa`" atende a regra 70, item 4b. O ponto de parada (limite do dia, função suspensa) é avisado na própria tela do Tutor, onde o uso acontece, e os testes de hoje continuam sem mudar (tarefa 3.0, linha 56).
- O caminho "Pedir ajuda ao Tutor" fica no Início em todo estado, com o `href` afirmado, também na avaliativa (D36). A caixa do Tutor existe em todo estado (RF5).
- Tirar o "Hoje: N de 60" do Início remove um número de uso da tela de entrada, o que é coerente com a D59.

**Autonomia declarada e visível:** sim. Nada muda nos níveis. O passo 4 da coordenação lista `O_QUE_A_IA_NUNCA_FAZ` (tarefa 11.1), e o passo 2 do professor declara a exceção do Tutor (tarefa 10.1).

**Bloqueantes:** nenhum. As três correções da rodada 1 foram feitas:

- **B1 (rosto neutro).** Feito em três lugares:
  - PRD RF19: "todas com o mesmo rosto neutro da cabeça da X1: só o corpo muda".
  - Tech Spec §9 ("Peças novas") e §12b, item 3.
  - Tarefa 5.1: olhos e boca da X1, sem "acolhendo". A tabela da 5.0 tem o teste "rosto neutro", com a mutação "trocar a boca de uma pose deixa vermelho".
- **B2 (comemoração só na entrega).** Feito:
  - (a) RF19: a introdução usa acenando e apontando e "termina parada"; `comemorando` só a `Comemoracao` desenha, na entrega.
  - (b) A §13 não fala mais do fim da introdução; o risco dela é só "a comemoração é vetada → sai da tarefa aberta".
  - (c) O teste de arquitetura da 5.0 exige `comemorando` só pela `Comemoracao` e a `Comemoracao` só em `areas/aluno/Atividade.tsx`. A 6.0 prende a comemoração ao `onSuccess` do envio, sem número, acerto, tempo nem "parabéns".
  - Bate com a D80, item 7, e com `docs/interface.md` 9.5 (regra 7) e 9.7.
- **B3 (falas e regra 70, item 4a).** Feito:
  - RF19 e §7b: as falas são texto fixo em `.ts`, sem variar com presença, ausência, acerto ou tempo de uso.
  - O teste de unidade "falas" está nas tarefas 9.0, 10.0 e 11.0. Ele reprova afirmar ser pessoa, professor ou amigo, prometer voltar, esperar ou estar sempre ali, e termos de vínculo ou saudade.
  - O passo 1 do aluno diz que o Tutor é um programa e pode errar, com teste (tarefa 9.0, "passo 1 e passos obrigatórios").
  - A saudação é fixa, sem "de volta" nem "faz tempo", com teste (tarefa 3.0). O "Amanhã eu volto" do mockup fica no Tutor, que esta spec não altera, e não entra.

As outras decisões por delegação da §12b também atendem:
- **RF14, aviso de privacidade (tarefa 9.1).** O texto fala em "resultado das tarefas" e o teste recusa "nota" (D46, D55). Diz o que é guardado, o prazo de 6 a 24 meses escolhido pela escola, a IA de uma empresa contratada (D62), quem vê (professor; coordenação com registro; colegas não) e como pedir os dados. O teste tem uma asserção por elemento.
- **Professor não é vigiado (regra 70, itens 8 e 9; D64).** A data da introdução não aparece para a coordenação: o e2e em `/v1/professores` exige que nenhum campo traga "introducao" (tarefa 11.0). A versão `coordenacao` do arquivo do titular não traz a data do professor (§7; tarefa 1.5). O PRD, §9, diz que quem viu ou pulou não é medido.

**Recomendações (não bloqueiam):**
1. **Tarefa 6.0:** pôr o texto da `Comemoracao` ("Atividade entregue.", "Quem dá a aula vê a correção antes de você.") no mesmo teste de falas da regra 70, item 4a. Hoje ele só é coberto pelo teste "sem número, acerto, tempo nem parabéns".
2. **Tarefa 5.2:** tipar `pose` do passo da `Introducao` como `Exclude<Pose, 'comemorando'>`. Assim a proibição de comemorar na introdução vale também pelo tipo, e não só pela varredura de importação.
3. **Tarefa 10.1 (recomendação da rodada 1 ainda não aplicada):** o passo do professor pode dizer que a conversa dele com o Assistente nunca é visível à coordenação (regra 70, item 8). Se não entrar, registre em "Recomendações sem aplicar" da 10.0, com o destino.
4. **Tarefa 3.2:** o rótulo "Pedir ajuda ao Tutor" no Início não deve prometer que o Tutor está disponível. No limite do dia ou com a função suspensa, quem avisa é a tela do Tutor; basta garantir que nenhum texto do Início diga o contrário.

As outras recomendações da rodada 1 foram aplicadas e bastam: saudação fixa, linha "Achou algo errado? Fale com quem dá a aula." (7.2), a versão `coordenacao` do arquivo do titular (1.5/1.6), e o aviso falando em "tarefas e o resultado". A recomendação do "uso do dia lido como limite" perdeu o objeto, porque o uso saiu do Início.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md, 3_task.md, 5_task.md, 6_task.md, 7_task.md, 9_task.md, 10_task.md, 11_task.md

## tenancy-guardian · 2ª rodada · REPROVADO · 2026-10-13 08:50:26 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: REPROVADO

**Tabelas verificadas:** `usuario` + `introducao_vista_em timestamptz` (Tech Spec §3). `escola_id` já existe na tabela. A coluna não leva `ano_letivo_id`, e isso está justificado: o fato pertence à pessoa naquela escola, não ao período. O id continua UUID.

**Queries verificadas:**
- `EuRepository.doContexto` com a coluna nova: lê `escola_id` e `id` de `identidadeDaRequisicao()`.
- Escrita do POST (§5, "Escrita"): `escola_id = <contexto> and id = <contexto>`, com `coalesce`.
- Escrita do GET para a data emprestada (§3, "Primeira saída"; §12b, item 1).
- `ResolucaoDeTenantRepository.acessosDaConta` (`@SemEscopo`): mesma conta, `desativado_em is null`, `eliminacao_agendada_em is null`, sem aluno. O filtro de mesmo papel fica no service.
- Nenhum endpoint aceita `escolaId` ou id no caminho ou no corpo: o corpo do POST é vazio e estrito (§4).
- `rede`: `nunca`. Sem linha achada: `NAO_AUTENTICADO`.
- A camada de rede não ganha leitura.

**Teste de isolamento:** presente e efetivo para a escrita do POST. Presente mas inútil para a escrita do GET (bloqueante 2).

**Correção exigida na rodada 1:** atendida. A §6 tem o teste com dois alunos da mesma turma e dois professores da mesma escola: um faz o POST, a linha do outro fica nula e o `/v1/eu` do outro devolve nulo. A §10 tem a linha "Isolamento" com a mutação que tira `id = <contexto>`. A tarefa 1.0 traz o caso "só a própria linha", com essa mutação, e exige ao menos três mutações na seção "Mutações". `tasks.md` 1.6 lista o caso. Sem a cláusula `id`, o POST de um professor marcaria o colega, e o teste fica vermelho.

**A decisão da §12b, item 1 (RF12), contra a regra de tenant:**
- **(a)** Atende no desenho: a escrita do GET usa `escola_id` e `id` do contexto, nunca o `usuarioId` vindo de `acessosDaConta`.
- **(b)** Atende: a leitura entre escolas fica restrita a mesma conta, ativo e sem eliminação agendada (`acessosDaConta`, linhas 172-180). O mesmo papel é exigido no service. Há casos de teste para dois papéis, outra conta, eliminação agendada e desativado.
- **(c)** Não atende: o horário gravado em A é copiado para a linha de B (bloqueante 1).
- **(d)** Atende só em parte: a mutação prevista é tirar a gravação do GET, mas não há prova do escopo dessa escrita (bloqueante 2).

**Bloqueantes:**

1. **Tech Spec §3 ("Primeira saída") e §12b item 1; tarefa 1.0, subtarefa 1.2 e caso "duas escolas" ("devolve a data e a grava na linha de B").**
   - **O que está errado:** o GET grava em B o valor lido da linha de A. É dado da escola A, que é controladora dele (D10), persistido no tenant B. Ele sobrevive ao fim do vínculo e ao expurgo `pessoa_desativada` de A, e entra no arquivo do titular de B. Na versão `coordenacao`, para coordenador, a §7 só exclui a data do professor. Uma data anterior à criação do usuário em B também revela que a pessoa tem outro vínculo. O RF12 não precisa do valor de A, só de que a linha de B deixe de estar nula.
   - **Correção exigida:** a gravação do GET usa `coalesce(introducao_vista_em, now())`, a mesma instrução do POST, e nunca o valor emprestado. O GET continua respondendo a mais antiga enquanto A está ativa. Teste: pré-gravar uma data antiga conhecida em A, ler `/v1/eu` em B e verificar que a linha de B fica não nula e diferente da data de A. Mutação: gravar o valor emprestado no lugar de `now()` deixa o teste vermelho.

2. **Tech Spec §6 e §10; tarefa 1.0, casos "só a própria linha" e "duas escolas", e seção "Mutações".**
   - **O que está errado:** a escrita do GET não tem teste que prove `id = <contexto>`. O caso dos dois usuários da mesma escola usa só o POST, e nele ninguém tem data emprestada, então a escrita do GET nunca dispara. Se o GET usar instrução própria e ela perder `id = <contexto>`, a professora de A e B, ao abrir `/v1/eu` em B, marca todos os usuários de B. Todos os testes previstos continuam verdes.
   - **Correção exigida:** na 1.2, declarar que o GET chama o mesmo método de repository do POST. Acrescentar o caso de integração: a professora de A e B, mais um colega da mesma escola B sem data; ela marca em A e lê `/v1/eu` em B; a linha do colega em B fica nula e o `/v1/eu` dele devolve nulo. A mutação que tira `id = <contexto>` dessa escrita deixa este caso vermelho.

**Recomendações:**
- **Login `escolher` quebra se `acessosDaConta` ganhar a data.** `conclusao-de-login.ts:52` repassa o resultado inteiro para `escolher`, e `esquemaAcessoDaConta` é `.strict()` (`packages/shared/src/sessao/eu.ts:9-11`). Com a data no retorno, o `escolher` do login falha. Duas saídas:
  - um método próprio `@SemEscopo`, que já filtre por papel na query e devolva só a data mais antiga;
  - ou um `map` explícito em `conclusao-de-login.ts`, pondo o arquivo nos "Arquivos previstos" da 1.0.

  Nos dois casos, com um teste de que a resposta de `escolher` não leva a data.
- **Filtro de mesmo papel.** Aplicá-lo no SQL, não no service: dado de outro papel não precisa sair do banco.
- **Terceiro `@SemEscopo`.** Se o caminho escolhido for um método novo, ele é a terceira exceção do módulo (regra 10, item 9). Registrar na justificativa que o desvio continua contido pelo teste de arquitetura, que só deixa `apps/api/src/sessao` importar a classe.
- **Minimização.** Continua de pé a recomendação da rodada 1: devolver `introducaoVista` como booleano no `/v1/eu`. Isso evita mostrar em B o horário de A enquanto A está ativa.

**Arquivos citados:**
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/api/src/sessao/conclusao-de-login.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/packages/shared/src/sessao/eu.ts`

## privacy-guardian · 2ª rodada · REPROVADO · 2026-10-13 08:50:36 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: REPROVADO

Das cinco correções exigidas na rodada 1, quatro foram feitas. O bloqueante que sobra é o prazo de guarda do aviso, e quem o causou fui eu: a frase errada é a que a minha própria correção da rodada 1 sugeria.

**Conferência da correção exigida na rodada 1** (Tech Spec §7b, PRD RF14 e tarefa 9.1):
- **"notas aprovadas" virou "o resultado das tarefas"**: feito, e o teste recusa "nota" (9.0, linha "texto do aviso").
- **"o que você estudou com o Tutor" virou "o que você escreve para o Tutor e o que ele responde"**: feito. Bate com a linha de `mensagem_tutor` em `docs/lgpd.md`.
- **Frase da IA de uma empresa contratada**: feito.
- **Frase de quem vê**: feito ("O professor da turma vê suas tarefas e o resultado."). As demais frases batem com o sistema:
  - `TEXTO_DA_SUPERVISAO` é igual ao que está em `apps/web/src/areas/aluno/tutor.ts:11`.
  - "Ver algo seu fica registrado" tem por trás as auditorias `turma.lista_lida`, `turma.desempenho_lido` e `analista.nominal_lido`.
  - O texto da conversa só o aluno lê, como diz `docs/lgpd.md`; o aviso não promete outra coisa.
- **Teste com uma asserção por frase de guarda, prazo e compartilhamento, recusando "nota"**: feito.
- **Frase de prazo**: feita, mas errada. É o bloqueante abaixo.

**Decisões por delegação (§12b)**
- **RF14 (texto do aviso):** atende, menos a frase do prazo.
- **RF12 (o `GET /v1/eu` grava na própria linha a data emprestada de outra escola):** atende a regra 20.
  - Dado pessoal: a coluna já está na tabela do PRD §8 e entra no mapa na tarefa 1.5.
  - Auditoria: não precisa, porque não é leitura de dado alheio nem decisão.
  - Log: nenhum.
  - Retenção: a da linha de `usuario`.
  - O titular recebe a data no próprio arquivo; a versão `coordenacao` não traz a do professor (D64), com teste.
  - A escrita fica no escopo da sessão, com mutação declarada.
  - Fica uma recomendação (abaixo) sobre gravar a data da escola A na escola B.

```
VEREDITO: REPROVADO
Campos pessoais tocados: usuario.nome (primeiro nome na saudação, já no /v1/eu); usuario.introducao_vista_em (novo)
Fora da tabela de dados do docs/lgpd.md: nenhum (introducao_vista_em entra na tarefa 1.5, com base legal "execução de contrato" e finalidade "não repetir a introdução")
Autorização por objeto: ok. A rota age só sobre quem está no token (§6); tem mutação de `id = <contexto>` e o teste dos dois usuários da mesma escola
Logs: limpos (§7, "nenhuma linha nova")
Auditoria: presente onde a regra exige. A introdução não é leitura de dado alheio, exportação nem decisão (§7)
Envio externo: nenhum novo (§8). O aviso agora diz que o texto do Tutor vai a um programa de IA de uma empresa contratada
Seed/fixture: sintético (fixtures e vitrine só ganham a data, tarefa 1.4)
Bloqueantes:
- Tech Spec §7b, PRD RF14 e tarefa 9.1 (frase "A escola escolhe por quanto tempo guarda: de 6 a 24 meses.", e a linha "texto do aviso" da tabela de testes da 9.0, que prende essa frase):
  o aviso ainda promete o que o sistema não faz.
  Pelo texto, vem logo depois de "Guardamos seu nome, sua turma e sua matrícula", "suas tarefas e o resultado delas"
  e "o que você escreve para o Tutor". Uma criança de 11 anos lê que tudo isso some em até 24 meses. Não é verdade
  (docs/lgpd.md, mapa de dados e "Retenção por escola"):
    - De 6 a 24 meses vale só para a conversa e os sinais do Tutor (`conversa_tutor`, `sinal_tutor`).
    - A tarefa e o resultado (`trabalho_do_aluno`) ficam 12 meses depois do fim do ano letivo, ajustáveis de 6 a 60.
    - Nome e matrícula ficam enquanto a pessoa está ativa e, depois de desativada, 60 meses (de 12 a 60).
  O erro veio da correção 1 da rodada 1, que sugeria "de 6 a 24 meses" sem dizer a que se aplicava. A spec seguiu a
  correção ao pé da letra.
  Correção exigida:
    - Prender o intervalo à conversa, por exemplo: "A conversa com o Tutor fica de 6 a 24 meses; a escola escolhe."
      (15 palavras).
    - Para as tarefas, uma frase sem número: "Suas tarefas ficam pelo tempo que a escola escolhe."
    - O teste da RF14 tira o piso e o teto de `CATEGORIAS_DE_RETENCAO.conversa_tutor`, sem número escrito à mão.
    - O teste recusa que o intervalo apareça numa frase sem "Tutor".
    - Mesmo ajuste no texto do PRD RF14 e da §7b.
Recomendações:
- RF12, §3 "Primeira saída" e tarefa 1.2: na cópia feita pelo GET, gravar `now()`, e não a data da escola A. A instrução
  fica igual à do POST (§5, "Escrita"), e nada de A fica gravado em B. Hoje, se A eliminar o titular, o horário de A
  continua em B. Segue valendo, como alternativa, a recomendação da rodada 1 de devolver um booleano.
- Aviso: o Tutor também manda ao modelo as habilidades a rever (`memoriaDoTrabalho`, em apps/api/src/tutor/tutor.service.ts:213),
  além do que o aluno escreve. Dizer isso no aviso ou na tela de Privacidade.
- Ainda não aplicada (rodada 1): registrar `educa.letra` no docs/lgpd.md (não é dado pessoal, e por quê) e testar que
  a chave não vai em requisição (tarefa 8.1).
```

Pergunta de fechamento: o código responde. A coluna nova entra em `LEITURAS_DO_ARQUIVO.usuario.colunas`, aparece no arquivo do titular com teste, e a spec não cria nenhum envio externo novo.

Arquivos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/docs/lgpd.md

## infra-guardian · 2ª rodada · REPROVADO · 2026-10-13 08:50:58 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: login | migration
Rate limit: ok
Fila e prioridade: ok (nada vai para fila e nada demorado entra em request)
Concorrência: protegida (dois POST: `coalesce` numa única instrução, com teste `Promise.all` e mutação na tarefa 1.0. GET contra GET e GET contra POST: o mesmo `coalesce`, sem dano possível porque a resposta é a data mais antiga. A Tech Spec não declara essa corrida; ver recomendações)
Índice e paginação: ok (nenhuma query nova em tabela que cresce com aluno. O Início lê só a primeira página de `minhas-atividades`, que já existe e usa `atividade_aplicada_turma_idx`. "Como estou indo" usa o teto de 50 da API, declarado na 7.1)
Degradação de IA: não se aplica (nenhuma chamada de modelo. O Início não depende do Tutor)
Migration: compatível (`add column` anulável, sem valor padrão nem índice, com o `lock_timeout` de `packages/nucleo/src/db/migrar.ts`. A nota "só expande" entrou na 1.5)
Métrica e alerta: ok (rotas existentes, nenhum alerta novo)

**Correções da rodada 1, uma a uma**
- (a) Atendida pela saída de §12b, item 4: o Início não lê mais `tutor/conversa`. O "Hoje: N de 60" e as pausas ficam na tela do Tutor, que já os lê e cujos e2e continuam verdes. §7c declara o custo: uma coluna a mais no `/v1/eu`, e uma gravação por usuário, uma vez só. Aluno tem `conta_id` nulo, então nunca grava. A tarefa 3.0 prova com teste de componente que o Início nunca chama `tutor/conversa`. A saída atende a regra 80.
- (b) Atendida no texto (§7c, tarefa 3.1), mas não no efeito. Ver o bloqueante.
- (c) Atendida. §9 declara 60 s e `false` para `['eu']` e `minhas-atividades`, e 5 min e `false` para `tutor/memoria`.
- (d) Atendida no texto. §10, linha "Carga".

**Bloqueantes**
- Tech Spec §7c ("Métrica, alerta, teste de carga"), §10 ("Carga") e tarefa 3.1 (`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`): o cenário novo não exercita a leitura que diz medir.
  - **O que está errado.** O seed da carga cria as escolas A, B e C sem ano letivo (`criarEscola` em `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/infra/scripts/carga-login.ts`, `semearContas`). Também cria 680 alunos por escola sem turma nem vínculo (`criarAlunosComMatricula`).
  - **Consequência.** `GET /v1/minhas-atividades` passa por `exigirAnoEmCurso()`, que lança `NAO_ENCONTRADO` sem ano em curso (`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/packages/nucleo/src/contexto/ano-em-curso.ts:12`). Na rajada, toda chamada responde 404 e soma em `respostas_inesperadas` (`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/infra/k6/login-7h30.js:341`, que só aceita 200). Ou o threshold cai, ou quem implementa aceita o 404 e o cenário mede o caminho vazio. A tarefa 3.1 só manda "conferir se as contas da rajada têm aluno". Elas têm, e o problema continua.
  - **Correção exigida.** Declarar na §7c, na §10 e na tarefa 3.1:
    - o seed da carga ganha ano letivo em curso nas três escolas, com turmas de 35 e vínculo de aluno `confirmado` para as contas de aluno da rajada;
    - cada turma recebe atividades aplicadas em número que encha a primeira página, algumas com tentativa e resposta do aluno, para pesar as subconsultas `respondidas` e `comDiagnostico`;
    - o k6 exige 200 com página não vazia em `minhas-atividades` e 200 em `/v1/eu`, contados em `respostas_inesperadas`, com o limite do p95 das autenticadas valendo na rajada.

**Recomendações**
- §7c, "Corridas de concorrência", e tarefa 1.0 (`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`): a gravação nova no `GET /v1/eu` não está declarada como corrida. Os casos são duas abas logo depois do login, e GET em B ao mesmo tempo que POST em B. Basta uma linha dizendo que o `coalesce` mantém a primeira data e que o GET responde a mais antiga. Na 1.0, um caso `Promise.all` com dois GET (os dois devolvem a mesma data, e a linha fica com ela). A mutação "tirar o `coalesce` da gravação do GET" deve ser separada da do POST, se as instruções forem duas.
- §7c: dizer que, se a gravação do GET falhar, o GET falha inteiro ou devolve a data emprestada sem gravar. Hoje fica implícito.
- Recomendações da rodada 1:
  - nota "só expande" na `0037`: feita (1.5);
  - 50 mais recentes em "Como estou indo": feito (7.1);
  - aluno sem turma: `NAO_ENCONTRADO` tratado em Eu (§9) e fora do Início;
  - contagem dupla em `orcamento.consultar`/`usoDeHoje`: continua sem registro no `TODO.md`, agora só na tela do Tutor. Fica para fora da spec.

## test-engineer · 3ª rodada · APROVADO · 2026-10-13 08:55:39 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: APROVADO

Cenários exigidos (tarefa 1.0, onde estavam as duas correções):
- caminho feliz nos três papéis
- POST repetido e virada do ano
- permissão: sem sessão, campo no corpo, rede recusada
- isolamento entre escolas
- só a própria linha, no POST e no GET
- escola sem ano em curso, e escola entre anos
- duas escolas, com a data mais antiga e sem gravar a data de A em B
- vínculo encerrado, com o GET intermediário e sem ele
- B sem ano em curso
- dois papéis, outra conta, eliminação agendada
- `coalesce`
- concorrência: dois POST com `Promise.all`, dois GET, e um GET junto de um POST
- arquivo do titular

Cobertos: todos, na tabela de testes de `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md` e na Tech Spec §6.

**Correção 1 (o PRD prometia mais do que a saída entrega): atendida.**
- O RF12 do PRD termina com a ressalva: "desde que a pessoa tenha entrado na outra enquanto ele estava ativo".
- A §7 do PRD diz "nem o fim de um vínculo (com a outra já aberta) a reabrem".
- A §12b, item 1, da Tech Spec traz a ressalva em negrito.
- Agora existe um teste próprio para a ressalva: "sem GET intermediário" afirma que o primeiro `/v1/eu` em B devolve nulo depois que A é desativada. A Tech Spec §3 diz o mesmo ("vínculo desativado ou com eliminação agendada não empresta").
- O teste "vínculo encerrado" tem a ordem inteira: marca em A, GET em B, A desativada, GET em B devolve a data. Com a mutação "tirar a gravação do GET", o teste fica vermelho pelo motivo certo: B fica nula, e A desativada não empresta.

**Correção 2 (escrita do GET sem teste de "só a própria linha"): atendida pelos dois caminhos ao mesmo tempo.**
- A Tech Spec §3 e a subtarefa 1.2 declaram que o GET usa o mesmo método de repository do POST, com `coalesce(introducao_vista_em, now())` por `escola_id` e `id` do contexto.
- O caso novo "escrita do GET, só a própria linha" chega à cláusula pelo caminho do GET. A professora marca em A, então, com a mutação, o POST só alcança linhas de A. Quando ela lê B, a escrita sem `id` preenche a linha do colega de B. O vermelho vem do GET, não do POST.
- A seção "Mutações" exige cinco blocos, entre eles "tirar `id = <contexto>` da escrita do GET".
- O teste com a data antiga pré-gravada em A ("a linha de B fica não nula e diferente dela") prova que o valor de A nunca é gravado em B. A mutação correspondente está declarada.

Bloqueantes: nenhum

Recomendações:
1. **`tasks.md:10` não acompanhou a correção.** A subtarefa 1.2 ainda diz "copia a emprestada para a própria linha", que é o contrário da Tech Spec §3 ("nunca grava o valor emprestado"). O teste pega a implementação errada, mas o documento manda fazê-la, e o Validador vai achar a contradição. Trocar por "grava `now()` na própria linha quando a data é emprestada". Na linha 14, a lista do 1.6 também pode ganhar "escrita do GET, só a própria linha" e "sem GET intermediário".
2. **Sobrou "com a data como parâmetro"** na Tech Spec §3 ("o mesmo método de repository, com a data como parâmetro") e na subtarefa 1.2. Esse trecho vem da saída antiga, que passava a data de A. Hoje o método não recebe data nenhuma: o `now()` vai dentro da instrução. Tirar o trecho nos dois lugares, para quem implementa não abrir um parâmetro que só serviria para gravar a data emprestada.
3. **Frase truncada na 1.2:** "Gravação do GET que falha: devolve a data lida `acessos`, na resposta, não muda". Reescrever, por exemplo: "se a gravação do GET falha, ele devolve a data lida sem gravar, e `acessos` não muda".
4. **O caso "gravação que falha devolve a data lida"** (linha "corrida do GET") não diz como a falha é provocada no teste de integração. Dizer como, por exemplo com um trigger no banco de teste que recusa o `update`. Mock do próprio repository esconderia exatamente o que se quer provar (regra 40).
5. **Colega do caso "escrita do GET, só a própria linha":** usar um aluno, que é o pior efeito (pular o aviso de privacidade). Um colega já basta para o vermelho, mas a correção da rodada 2 pedia um aluno e um professor.
6. **Mutações dos filtros do método novo:** listar também papel, conta, vínculo ativo e eliminação agendada. Cada uma já tem teste ("dois papéis; outra conta", "sem GET intermediário"), e a regra "um bloco por cláusula" as cobre. Citá-las evita que fiquem de fora.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md

## privacy-guardian · 3ª rodada · APROVADO · 2026-10-13 08:55:39 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: APROVADO

A 3ª rodada atende as quatro correções que a 2ª exigiu, e o novo desenho da gravação do GET de `/v1/eu` não fere a regra 20. Sobram dois problemas de texto nos documentos de tarefa, nenhum bloqueante.

**As correções da rodada 2, uma a uma**

| Correção exigida | Situação | Onde |
|---|---|---|
| Prender o intervalo à conversa | Feita. "A conversa com o Tutor fica de 6 a 24 meses; a escola escolhe." tem 14 palavras e bate com o código: `conversa_tutor` tem piso 6 e teto 24 em `packages/shared/src/privacidade/retencao.ts:44` | tarefa 9.1 |
| Frase sem número para as tarefas | Feita: "Suas tarefas ficam pelo tempo que a escola escolhe." Não promete mais 24 meses para `trabalho_do_aluno` (6 a 60) nem para nome e matrícula (`pessoa_desativada`, 12 a 60) | tarefa 9.1 |
| Teste tira piso e teto do catálogo | Feito: lê de `CATEGORIAS_DE_RETENCAO.conversa_tutor`, sem número escrito à mão | 9.0, tabela, linha "texto do aviso"; Tech Spec §7b |
| Teste recusa o intervalo fora de frase com "Tutor" | Feito | 9.0, mesma linha; §7b |
| Mesmo ajuste no PRD e na Tech Spec | Feito | PRD RF14; Tech Spec §7b e §12b item 2 |

O resto do aviso confere com `docs/lgpd.md` e com a regra 20: o resultado das tarefas (nunca "nota"); a conversa com o Tutor e a resposta dele; os seis dados que não temos; quem vê; a IA de uma empresa contratada, incluindo as habilidades a rever; que os dados não treinam IA; e o caminho Eu › Privacidade.

**O novo desenho da gravação do GET**

O GET agora grava `coalesce(introducao_vista_em, now())` na linha da própria sessão, nunca a data de outra escola. Avaliei contra a regra 20 e está correto:
- **Nada da escola A é guardado em B.** O valor gravado é o momento da entrada em B, um fato de B.
- **A mesma instrução do POST.** O GET usa o mesmo método de repository, com escopo `escola_id` e `id` do contexto. Ele é provado pelo caso "escrita do GET, só a própria linha" e pelas mutações obrigatórias da 1.0.
- **Sem dado novo em log nem em auditoria.**
- **Retenção e eliminação.** A data sai com a linha (`pessoa_desativada`, eliminação e expurgo).
- **A coordenação não vê a data do professor.** A versão `coordenacao` do arquivo do titular não a traz (D64), com teste.
- **O aluno não herda data de outra escola.** Como ele não tem conta, o empréstimo nunca o alcança.
- **Se a gravação do GET falha, nada muda.** Ele devolve a data lida, sem gravar e sem log com dado.

Campos pessoais tocados: `usuario.nome` (primeiro nome, já no `/v1/eu`) e `usuario.introducao_vista_em` (novo).
Fora da tabela de dados do docs/lgpd.md: nenhum. `introducao_vista_em` entra no mapa na tarefa 1.5 (finalidade "não repetir a introdução", base legal "execução de contrato", retenção da linha de `usuario`), declarado no PRD §8 e na Tech Spec §7. A chave `educa.letra` fica só no navegador, sem identificador.
Autorização por objeto: ok. Não há objeto: a rota age sobre o usuário do token, com `escola_id` e `id` do contexto em POST e GET. A leitura entre escolas pela conta fica restrita ao mesmo papel, em método `@SemEscopo` próprio, e não sai em `acessos` (Tech Spec §3 e §6).
Logs: limpos. A Tech Spec §7 declara "nenhuma linha nova".
Auditoria: não exigida. A data da própria pessoa não é leitura de dado alheio, exportação, nota, permissão nem aprovação de saída de IA (regra 20, item 10).
Envio externo: nenhum. Não há chamada de modelo nova (Tech Spec §8).
Seed/fixture: sintético. As fixtures do e2e, a vitrine e o seed de `carga-login.ts` só ganham a data e as estruturas sintéticas.
Bloqueantes: nenhum.
Recomendações:
- **`tasks.md`, item 1.2, contradiz a Tech Spec.** Diz que o GET "copia a emprestada para a própria linha", que é justamente o desenho recusado na rodada 2. O teste e a mutação da 1.0 seguram, mas o resumo precisa dizer "grava `now()` na própria linha, nunca o valor emprestado" antes de a tarefa ser entregue ao Implementador.
- **`1_task.md`, subtarefa 1.2, última frase truncada.** "Gravação do GET que falha: devolve a data lida `acessos`, na resposta, não muda" junta duas frases. O sentido pretendido parece ser "devolve a data lida, sem gravar. `acessos`, na resposta, não muda."
- **Recomendações antigas ainda abertas:**
  - devolver `introducaoVista` booleano no `/v1/eu` em vez da data (minimização);
  - registrar `educa.letra` no `docs/lgpd.md`, com teste de que a chave não vai em requisição (tarefa 8.1).

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/packages/shared/src/privacidade/retencao.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/docs/lgpd.md

## tenancy-guardian · 3ª rodada · REPROVADO · 2026-10-13 08:55:43 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: `usuario` ganha `introducao_vista_em timestamptz` (Tech Spec §3). A tabela já tem `escola_id`. Ficar sem `ano_letivo_id` está justificado, porque o fato é da pessoa na escola e não do período. Não entra tabela nova, e o id continua UUID.

Queries verificadas:
- **Escrita do POST** (§5, "Escrita"): `coalesce(introducao_vista_em, now())` com `escola_id` e `id` vindos de `identidadeDaRequisicao()`. Corpo vazio e estrito, sem id no caminho e sem `escolaId` vindo do cliente (§4). `rede` fica com `nunca`, e linha não achada responde `NAO_AUTENTICADO`.
- **Escrita do GET** (§3, "Primeira saída"; tarefa 1.2): chama o mesmo método de repository do POST, com `now()`. O texto diz "nunca o valor emprestado". A correção 1 da 2ª rodada está atendida no §3, no §6, no §12b item 1 e na tarefa 1.0: o caso "duas escolas" pré-grava data antiga em A, verifica que B fica não nula e diferente dela, e declara a mutação "gravar o valor emprestado".
- **Escopo da escrita do GET**: a correção 2 está atendida. A 1.2 declara o mesmo método do POST. O caso "escrita do GET, só a própria linha" (professora de A e B mais um colega de B sem data) está no §6 e na tarefa 1.0, e a mutação "tirar `id = <contexto>` da escrita do GET" está na seção "Mutações", que agora exige cinco mutações.
- **Leitura entre escolas**: vale só para a mesma conta, ativa, sem eliminação agendada e com o mesmo papel. Para aluno, vale só a própria linha. O `contaId` vem da própria linha e nunca do cliente, e nada da outra escola sai no DTO. Ela fica em `ResolucaoDeTenantRepository`, onde todo método já é `@SemEscopo` com justificativa, e a justificativa ganha a data.
- **Camada de rede**: o papel `rede` não lê nem escreve a data.
- `minhas-atividades` e `tutor/memoria` são reaproveitadas sem mudança de escopo (tarefas 3 e 9 sem query nova).

Teste de isolamento: presente e efetivo. Sem `id = <contexto>` no POST ou no GET, o colega fica marcado e o teste quebra. Gravar a data de A em B deixa a linha de B igual à data pré-gravada, e o teste quebra. Tirar a gravação do GET reabre a introdução no caso "vínculo encerrado", e o teste quebra.

Bloqueantes:
1. **`tasks.md` 1.2 e Tech Spec §7c ("Carga na manhã de segunda").**
   - **O que está errado:** os dois ainda mandam gravar a data emprestada. O `tasks.md` 1.2 diz "e copia a emprestada para a própria linha", e o §7c diz "grava uma vez só a data emprestada". É exatamente o comportamento que a correção 1 proibiu: dado da escola A gravado no tenant B. O §3, o §12b e a tarefa 1.0 dizem o contrário, então a spec se contradiz no ponto que tem veto. Teste e mutação já existem; falta só alinhar o texto.
   - **Correção exigida:** trocar no `tasks.md` 1.2 por "e, se a data veio de outra escola e a própria linha está nula, grava `now()` nela, nunca o valor emprestado". No §7c, trocar por "e grava uma vez só `now()` na própria linha quando a data veio de outra escola".

Recomendações:
- §3 e tarefa 1.2: tirar "com a data como parâmetro". A instrução é `coalesce(introducao_vista_em, now())`, e um parâmetro de data no método convida a passar a data emprestada. O teste pega, mas o texto não deve sugerir isso.
- §6 diz "pelo método que já é `@SemEscopo` para o seletor", e o §3 e a 1.2 dizem "método próprio". Escolher um dos dois. Se for o método próprio, a 1.2 deve citar a inclusão dele na lista de métodos de `apps/api/src/sessao/resolucao-de-tenant.repository.test.ts` ("nasce só com os métodos…"), com a justificativa.
- Tarefa 1.2, fim da subtarefa: a frase "Gravação do GET que falha: devolve a data lida `acessos`, na resposta, não muda" está truncada. Separar em duas: a gravação que falha devolve a data lida; `acessos` não muda na resposta.

Arquivos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md

## infra-guardian · 3ª rodada · REPROVADO · 2026-10-13 08:56:23 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: login | tutor
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: faltando

**Bloqueantes:**

1. **O limite de p95 que deveria valer na rajada não existe.** Afeta a Tech Spec §7c ("Métrica, alerta, teste de carga"), a §10 ("Carga") e a subtarefa 3.1 de `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`. É a parte que faltou da correção 5 da rodada 2.
   - **O que já foi feito.** O seed tem agora ano em curso nas três escolas, turmas de 35, vínculo `confirmado` e atividades aplicadas, algumas com tentativa e resposta. O k6 exige 200 com página não vazia em `minhas-atividades` e 200 em `/v1/eu`, contados em `respostas_inesperadas`. Essas partes estão atendidas.
   - **O que falta.** A correção pedia "o limite do p95 das autenticadas valendo **na rajada**". O texto de agora diz só "o limite do p95 das autenticadas vale", sem dizer a fase nem o número. Na fase `rajada` de `infra/k6/login-7h30.js` não há limite nenhum sobre `autenticada_duracao`. Hoje ela tem só `legitimo('rajada')`, que limita o login, além de `contas_que_entraram` e `dropped_iterations`. Os limites de p95 das autenticadas existem só para os grupos `b` e `c`, na `base` e em `bcMantidos()`.
   - **Consequência.** Lido ao pé da letra, o "vale" não muda nada na rajada. Às 7h30, uma `minhas-atividades` lenta (subconsultas `respondidas` e `comDiagnostico` pesadas, ou um plano de execução ruim) passa no k6, desde que responda 200 antes do timeout do http.
   - **Correção exigida.** Escrever na §7c, na §10 e na 3.1:
     - as chamadas novas entram em `autenticada_duracao`, com a tag `name` da rota;
     - a fase `rajada` ganha o limite `autenticada_duracao{grupo:rajada}: p(95) < N`, com N declarado (por exemplo `P95_MAXIMO_DO_LOGIN_MS`, como já vale para B e C na `base`).

**Recomendações:**

- **1_task.md, subtarefa 1.2: a última frase saiu truncada.** Está escrito "Gravação do GET que falha: devolve a data lida `acessos`, na resposta, não muda". Separar em duas frases: "Gravação do GET que falha: devolve a data lida, sem gravar." e "`acessos`, na resposta, não muda."
- **1_task.md, cenário "corrida do GET": dizer como forçar a falha da gravação.** O cenário pede "gravação que falha devolve a data lida", mas não diz como provocar a falha num teste de integração. Pode ser um repository que lança erro na escrita, ou um gatilho que recusa o `update`. Pedir também um evento ou contador da falha, só com ids, porque hoje ela passa em silêncio e sem métrica.
- **Corrida do GET: o desenho está protegido.** A §7c e a 1.0 declaram dois GET em paralelo e GET junto de POST. O GET e o POST usam o mesmo método de repository, com `coalesce(introducao_vista_em, now())`. O GET devolve a mais antiga e não roda em transação (`EuService.obter`), então um erro na escrita não derruba a leitura. Nada a corrigir.
- **tasks.md, linha 3.1: falta o seed.** Ela cita só o k6. Alinhar com a 3_task.md, que já põe o seed de `infra/scripts/carga-login.ts`.
- **Ainda sem destino, de rodadas anteriores:**
  - `introducaoVista` booleano em vez da data, por minimização;
  - registro no `TODO.md` da contagem dupla das trocas do dia em `tutor/conversa` (`orcamento.consultar` e `usoDeHoje`).

Arquivos: `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md`, `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`, `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`, `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/tasks.md`, `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/infra/k6/login-7h30.js`

## tenancy-guardian · 4ª rodada · APROVADO · 2026-10-13 08:58:13 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: APROVADO

Tabelas verificadas: `usuario` (`introducao_vista_em`, Tech Spec §3). `escolaId` já existe na tabela. Não precisa de `anoLetivoId`, porque o dado é da pessoa e não do período, como a §3 justifica. Não há tabela nova. A coluna é timestamptz sem padrão, e o id continua UUID.

Queries verificadas:
- **Escrita do POST e do GET** (§5 "Escrita", §3 "Primeira saída"). As duas usam o mesmo método: `coalesce(introducao_vista_em, now()) where escola_id = <contexto> and id = <contexto>`, com escopo vindo de `identidadeDaRequisicao()` e sem receber data. Nenhum endpoint aceita `escolaId` nem id no corpo ou na query: o POST tem corpo vazio e estrito (§4, §6).
- **Leitura entre escolas** (§3, §6). Pega só a data mais antiga dos usuários ativos da mesma conta e do mesmo papel, sai por `@SemEscopo` com justificativa escrita e não entra no DTO. Vínculo desativado e eliminação agendada não emprestam.
- **Camada de rede.** O papel `rede` fica com `nunca` no POST, e há teste disso.

Correção exigida na rodada 3, conferida:
- `tasks.md` 1.2 agora diz "se a data veio de outra escola e a própria linha está nula, grava `now()` nela, nunca o valor emprestado". Atende.
- O "Carga na manhã de segunda" da §7c agora diz "grava uma vez só `now()` na própria linha quando a data veio de outra escola". Atende.
- §3, §6, §12b item 1 e `1_task.md` 1.2 estão todos alinhados em `now()`, nunca o valor emprestado. A busca por "copia", "grava a emprestada", "valor emprestado" e "com a data como parâmetro" não achou nenhuma frase que mande persistir dado de A em B.
- "Devolve a data lida, sem gravar" (§3, 1.2) só diz o que o GET responde quando a gravação falha. Não persiste nada.

Teste de isolamento: presente e efetivo. Estão previstos na §6 e na tabela da `1_task.md`, cada um com mutação declarada:
- Contexto de B não lê nem altera A.
- Dois usuários da mesma escola e do mesmo papel: só a linha de quem fez o POST muda (mutação: tirar `id = <contexto>` do POST).
- Colega de B continua nulo depois do GET da professora (mutação: tirar `id = <contexto>` do GET).
- Data antiga pré-gravada em A: a linha de B fica não nula e diferente dela (mutação: gravar o valor emprestado no lugar de `now()`).
- Papéis diferentes e outra conta não herdam a data.

Se qualquer uma das cláusulas for removida, o teste correspondente quebra.

Bloqueantes: nenhum.

Recomendações:
- Sobrou uma recomendação da rodada 3 sobre o método da leitura entre escolas, e a `1_task.md` 1.2 agora se contradiz por dentro:
  - §6 e §11 (linha da regra 10) dizem que ela usa "o método que já é `@SemEscopo` para o seletor".
  - A §3 e a própria 1.2 dizem "método próprio".
  - A 1.2 diz, no começo, que "`acessosDaConta` devolve a data só para o service" e, mais adiante, que a data vem de "método próprio".

  Escolha um dos dois em todos os lugares. Se for o método próprio, como a lista de arquivos da 1.0 indica com `resolucao-de-tenant.repository.ts`, cite a lista de métodos `@SemEscopo` de `resolucao-de-tenant.repository.test.ts` que precisa ganhar a entrada nova.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md

## infra-guardian · 4ª rodada · APROVADO · 2026-10-13 08:58:20 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/revisao-spec.md`

VEREDITO: APROVADO
Caminho quente tocado: login (a rajada das 7h30 ganha `/v1/eu` e `minhas-atividades`)
Rate limit: ok (a spec não traz limite novo; o login continua limitado por conta e por escola)
Fila e prioridade: ok (só leitura, nada vai para fila)
Concorrência: protegida (a gravação de `now()` no `/v1/eu` é na própria linha e idempotente; Tech Spec §7c, "Carga na manhã de segunda")
Índice e paginação: ok (`minhas-atividades` é lida só na primeira página)
Degradação de IA: não se aplica (o Início não lê `tutor/conversa` nem chama modelo, §7c)
Migration: não se aplica
Métrica e alerta: ok

A correção exigida na rodada 3 foi feita nos três lugares:
- **§7c** ("Métrica, alerta, teste de carga"): as duas chamadas novas entram em `autenticada_duracao` com a tag `name` da rota. A fase `rajada` ganha `autenticada_duracao{grupo:rajada}: p(95) < P95_MAXIMO_DO_LOGIN_MS`, de 1.000 ms, o mesmo limite que já vale para B e C na `base`.
- **§10** ("Carga"): repete o limite e a fase.
- **Subtarefa 3.1 e linha de carga da tabela de testes do `3_task.md`**: trazem o mesmo texto e dizem que uma `minhas-atividades` lenta reprova o cenário.

O limite dá para implementar com o que `infra/k6/login-7h30.js` já tem:
- A constante existe (`P95_MAXIMO_DO_LOGIN_MS = 1_000`, linha 43).
- A Trend `autenticada_duracao` existe (linha 83) e já recebe `{ grupo }` em `autenticada()` (linha 339).
- A função `rajada()` já marca as chamadas com o grupo `'rajada'` (linha 411).
- O formato do limite é o mesmo da `base` (linha 203).
- Falta só a entrada no bloco `thresholds` da fase `rajada` (linhas 228 a 233) e as duas chamadas novas gravando na Trend com o grupo. As duas coisas estão pedidas na 3.1.

Bloqueantes: nenhum

Recomendações:
- **Limite por rota.** O p95 da rajada mistura, por conta, três `GET /v1/sistema/contexto` com um `/v1/eu` e um `minhas-atividades`. Uma `minhas-atividades` lenta em toda chamada (20% das amostras) reprova, mas uma lenta só em parte, uma em cada quatro chamadas, fica perto de 5% das amostras e pode passar. Para a regra valer por rota:
  - gravar a Trend com `{ grupo, name }`, e não só aplicar `name` no `http.get`;
  - acrescentar `autenticada_duracao{grupo:rajada,name:GET /v1/minhas-atividades}: p(95) < P95_MAXIMO_DO_LOGIN_MS`.
- **Linha 3.1 do `tasks.md`.** Ela ainda diz só "com o p95 das autenticadas valendo na rajada". Vale citar o limite, `< P95_MAXIMO_DO_LOGIN_MS`, para o índice não divergir da 3.1.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-aluno-e-primeiro-acesso/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/infra/k6/login-7h30.js

# Achados das revisões — `tasks/prd-apresentacao-escola/revisao-spec.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-09-25 22:42:41 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Estados: faltando. O PRD pede os quatro estados (RF18), mas a Tech Spec não desenha nenhum deles, tela por tela (seção 9), e o e2e da seção 10 só percorre o caminho feliz. O erro de carregamento dos pedaços novos da web também não tem desenho. O limite de tentativas usa um código de erro cujo texto dá a instrução errada.

Acessibilidade: parcialmente garantida. Há verificação automática de acessibilidade no e2e (seção 10), `document.title` por rota e guarda de papel (seção 9). O diálogo da A0b vai para `componentes/`, com o foco que ele já controla. A borda `#8F8F8F` já está em `estilos.css`, então a pergunta 5 do PRD está resolvida no código. Três coisas ficam só implícitas: o rótulo e o texto de ajuda do campo de colar a lista, a seleção múltipla dos pedidos por teclado (caixa de marcar com rótulo "nome + hora") e o `inputmode`/`autocomplete` dos campos de código, matrícula e senha (regra 50, item 2a).

Chromebook fraco: bem desenhado.
- A página pública da turma fica no pedaço de JS que carrega primeiro, com teto de 150 kB, e as áreas da coordenação e do professor carregam só quando a pessoa chega nelas, com teto próprio.
- Os projetos `chromebook` e `celular` já limitam CPU e rede (`playwright.config.ts`).
- A lista tem teto de 200 linhas, e a lista da turma vem paginada.
- Não há upload de imagem nesta funcionalidade.
- Falta a fronteira de erro dos pedaços novos (bloqueante 3).

Celular: implícito. RF1 e RF18 pedem e2e nos dois projetos, e a seção 9 diz "sem animação; prévia em cartões abaixo de 640 px". Faltam três coisas:
- A casca responsiva da `docs/interface.md` 11.1 (trilho entre 768 e 1023 px, gaveta abaixo de 768 px) não é citada.
- O corte de 640 px não bate com o de 768 px da 11.1.
- O botão de WhatsApp tem a alternativa de copiar (seção 12), então nada exige o celular.

Ação oficial protegida: não. Aprovar a reivindicação cria o aluno (D4) e é a única decisão oficial da A1, mas a seção 9 não desenha revisão nem confirmação (bloqueante 4). Não há nota nesta funcionalidade. O feed de agentes não se aplica: Seu time entra na A2 (D73, PRD pergunta 4).

Bloqueantes:

1. **Seção 7c, linha "Rate limit": o limite de tentativas usa o código errado, trava a turma inteira e não diz ao aluno o que fazer.**
   - `TEMPO_ESGOTADO` é 503 (`packages/nucleo/src/erro/erro-de-dominio.ts:10`) e mostra "A operação demorou mais que o esperado. Tente de novo em instantes." (`packages/shared/src/erros/mensagens.ts:14`). O aluno travado por 10 minutos vai tentar de novo na hora. A mesma linha diz "teste do 429", o que contradiz o próprio código.
   - Os tetos travam salas inteiras por erro de digitação de alunos de 11 anos: 30 códigos errados por escola em 10 minutos travam as seis turmas das 7h30, e 20 recusas por turma travam a turma toda. A recusa por nome que um colega acabou de pegar (a corrida da RF11) também entra na conta.
   - A mensagem de `REIVINDICACAO_RECUSADA` (código novo) não está definida.
   - **Correção exigida:**
     - Usar `LIMITE_EXCEDIDO` com `Retry-After`.
     - Definir os textos da página pública num catálogo próprio, no modelo de `MENSAGENS_DA_ENTRADA_POR_MATRICULA`. Exemplo para o limite: "Muitas tentativas nesta turma. Espere N minutos ou chame o professor." Exemplo para a recusa: "Não foi possível enviar. Confira a matrícula; se estiver certa, chame o professor."
     - Depois de uma recusa, buscar de novo a lista de nomes livres.
     - Justificar os tetos pela rajada real, com uma taxa de erro de digitação declarada.
     - Incluir código e matrícula errados no cenário da RF19 (`reivindicacao-em-sala`).

2. **Seções 9 e 10: nenhuma tela tem os quatro estados desenhados, e o e2e não prova nenhum estado vazio ou de erro.** A coordenadora não é técnica e precisa montar duas turmas em 15 minutos sem ajuda (PRD, seção 9). O vazio de Estrutura é o roteiro dela: ano letivo, depois série e disciplina, depois turma, lista e professor, e por fim a alocação. Nada disso está escrito.
   - **Correção exigida:** incluir na seção 9 uma tabela com uma linha por tela e os estados carregando, vazio (com o texto e o próximo passo), erro e com dado. As telas são estas:
     - Estrutura
     - colar ou enviar a lista, com a prévia e os erros por linha em texto (não o código)
     - professores e convite
     - alocação
     - Turmas do professor: sem vínculo, só com vínculo pendente (levando a confirmar) e com vínculo confirmado
     - pedidos
     - acesso da turma
     - página pública: link ou código que não vale mais, e nenhum nome livre ("Se o seu nome não aparece, chame o professor")
     - "Minha turma" do aluno: o conteúdo dela, e que não lista colegas (regra 50, item 9)
   - Na seção 10, o e2e prova o vazio e o erro de cada tela nos dois projetos, com a rota interceptada.

3. **Seção 9, "Chunks": os pedaços novos `coordenacao-*` e `professor-*` carregam só quando a pessoa chega na área e não têm fronteira de erro.** Se o `import()` falhar na rede da escola ou no 3G, a tela fica em branco. É o mesmo defeito que a A0b precisou corrigir.
   - **Correção exigida:** levar `FronteiraDaOperacao` (`apps/web/src/rotas.tsx`) para `componentes/` como fronteira genérica. Cada área nova fica envolvida por ela e por um `Suspense` que mostra `EstadoCarregando`. A falha mostra "Confira a conexão e tente de novo" e troca o título da aba. Um e2e aborta o carregamento do pedaço nos dois projetos.

4. **Seções 4 e 9: a decisão sobre a reivindicação não tem revisão antes de confirmar.** A seção 9 não diz nada da tela de pedidos.
   - **Correção exigida:**
     - "Aprovar N pedidos" usa a variante `oficial` e abre um diálogo com a turma, os nomes e o efeito ("passam a entrar com matrícula e senha").
     - Quando quem decide é a coordenação, o diálogo diz que fica em auditoria.
     - "Recusar" usa a variante `perigo`, com confirmação, e diz que o nome volta à lista.
     - A tela mostra o resultado de cada pedido, inclusive `ja_decidida` ("Já decidido por outra pessoa").
     - A seleção respeita o teto de 40 ids com um texto que explica o limite.
     - Um e2e prova o diálogo e o clique duplo.

5. **Seção 9, "Casca": o seletor de escola é mantido como está, contra o desenho decidido (`docs/interface.md` 1 e 11.1; P30).** O desenho decidido é o seletor de espaço de trabalho: sigla, rede, turno, número de turmas e marca de escolhido, no topo da lateral. No celular, fica na barra de 56 px. O componente atual mostra só "nome · papel" (`apps/web/src/componentes/SeletorDeEscola.tsx`), e `AcessoDaConta` só tem `escolaNome` e `papel` (`packages/shared/src/sessao/eu.ts:8`).
   - **Correção exigida:** adotar o formato, com os campos novos no contrato de `/v1/eu`. Se sigla ou turno não existirem no modelo, dizer quais campos entram. Ou então registrar o desvio na seção 11, com a justificativa. Nos dois casos, o e2e da RF2 continua provando que nenhuma requisição sai com o token da escola anterior.

Recomendações:
- **Link e código aparecem uma vez (seção 13).** Duas mudanças na tela:
  - Mostrar o código grande, em grupos (ABC 234), próprio para projetar, e confirmar antes de fechar o diálogo.
  - "Gerar novo" pede confirmação e avisa que quem está usando o código atual vai precisar do novo.
- **Tela pós-pedido (seção 5, passo 4).** Avisar que "matrícula ou senha incorretas" antes da aprovação quer dizer "ainda esperando o professor". Isso evita que o aluno esgote o limite de login da própria conta.
- **Formulário de reivindicação.** Mostrar os 12 caracteres da senha antes da digitação, com opção de mostrar a senha. Avaliar `autocomplete="off"` na senha, porque o computador é compartilhado e o navegador oferece salvar.
- **Casca.** Citar na seção 9 a tabela responsiva da 11.1. Alinhar o corte da prévia em 768 px. Dizer quantos toques o Sair leva no celular (gaveta, menu, Sair) contra a D59 e contra o Sair em toda tela do F1.
- **Nomes repetidos.** Dizer na página pública como o aluno escolhe entre dois nomes iguais sem gastar uma tentativa da turma.
- **Colar a lista.** Mostrar um exemplo do formato ao lado do campo, e listar as linhas com erro primeiro na prévia.
- **Área do aluno.** Declarar se o rodapé fixo com "Avisar um adulto" e Privacidade (11.1, D61) entra já na A1 ou fica para depois, e por quê.
- **WhatsApp.** O link com o token vai no texto do `wa.me`. Confirmar com o `privacy-guardian` que isso cabe em "fora de URL" (seção 7, DTO) e no P27.

Arquivos revisados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/docs/interface.md
- /home/joaquimdp/Documentos/git/Educa.ia/docs/pendencias-dos-mockups.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/SeletorDeEscola.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/rotas.tsx
[… 2 linhas cortadas]

## test-engineer · 1ª rodada · REPROVADO · 2026-09-25 22:42:48 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: REPROVADO

Arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/prd.md` (1.984 palavras), `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md` (1.998 palavras). Os dois ficam abaixo do teto de 2.000 palavras.

**Cenários exigidos:**
- Cada RF do PRD (RF1 a RF19), cada uma na forma do "Como se prova".
- Os nove casos de borda do PRD §7.
- As corridas da §7c, cada uma com as chamadas em paralelo.
- As respostas iguais das rotas públicas e da decisão em lote.
- Permissão por objeto em cada rota nova.
- Isolamento da §6.
- O cenário I7 que a A0b deixou para a A1 (`tasks/prd-apresentacao-painel/cenarios.md`, I7).

**Cobertos:**
- RF10: matrícula de outro nome e matrícula inexistente dão a mesma resposta. A §10 só diz isso de forma genérica, sem enumerar os casos.
- RF11: a corrida da reivindicação, em paralelo (§7c).
- RF13: login antes e depois da aprovação, e a recusa que apaga o hash.
- RF15: isolamento pela §6.
- RF18: e2e com axe nos dois projetos.
- RF19: o cenário `reivindicacao-em-sala` (§7c).
- RF2: e2e da troca de escola.
- Expurgo e 429.
- Corridas da §7c: gerar acesso, convite, lista duas vezes, excluir turma com lista chegando.

**Bloqueantes:**

1. **Techspec §10: a estratégia de testes não prova cada RF.**
   - O problema: a tabela tem quatro linhas genéricas e não há `cenarios.md`. A A0b só passou no `/validar` porque tinha a lista fechada com identificador por teste. Os RFs abaixo não têm teste previsto:
     - **RF1:** por papel, só aparecem os itens da fase que existe. A guarda de papel nova em `rotas.tsx` (§9) não tem teste.
     - **RF3:** "5º ano" recusado. As rotas novas `PATCH`/`DELETE disciplinas|turmas/:id` também ficam sem teste: excluir com nome ou com vínculo deve dar `CONFLITO`.
     - **RF4:**
       - Duas linhas com erro: nada é gravado.
       - Matrícula já em `credencial_matricula` da escola, na prévia e na gravação (é teste de integração, não de unidade).
       - A mesma matrícula aceita em outra escola.
       - A amostra em windows-1252 que a §12 promete. A releitura acontece na web e não está em camada nenhuma da §10.
     - **RF5:**
       - Reenviar a mesma lista não muda a contagem.
       - Linha com matrícula existente sai como `ja_existe`.
       - Retirar nome reivindicado ou aprovado dá erro tipado.
     - **RF6:**
       - Convite de professor usado, vencido, revogado, refeito e inexistente respondem igual.
       - Borda do prazo por tipo: o do professor ainda vale no 6º dia, e o de coordenador continua com 72 h. Esse teste pega a troca dos dois prazos.
     - **RF7:** aceite na escola B com a conta da A não cria conta nova e acrescenta o segundo vínculo.
     - **RF9:**
       - O texto do WhatsApp não contém nome da lista.
       - "Gerar novo" derruba o link e o código anteriores na hora.
       - `validadeDias` fora de {1, 7, 30} é recusado.
     - **RF12:**
       - Três selecionados viram três alunos.
       - 41 ids são recusados.
       - A tela não oferece "aprovar todos".
       - A recusa devolve o nome aos livres.
     - **RF13:**
       - O vínculo do aluno nasce com `decidido_em` e aparece na lista do ano encerrado (`TODO.md`, linha 431).
       - A aprovação também apaga `senha_hash`.
       - A matrícula da credencial é igual à da lista.
     - **RF14:**
       - 35 reivindicações do mesmo IP no mesmo minuto passam sem bloqueio.
       - O excesso segura o código daquela escola, e outra escola atrás do mesmo IP segue funcionando.
     - **RF16:**
       - Cada ação da §7 gera um registro com autor, escola e `decidida_como`.
       - Quem perde a corrida não gera auditoria.
       - Hoje a §10 diz apenas "auditoria sem nome".
     - **RF17:** varredura das rotas novas com sentinela, inclusive nas respostas 400, 404, 409 e 429, e o `GET turmas/:id/acesso` sem link nem código.
   - Correção exigida: criar `tasks/prd-apresentacao-escola/cenarios.md`, parte da Tech Spec, com um id por teste e, em cada cenário, a cláusula que o quebra.

2. **PRD §7 e Techspec §10: seis casos de borda sem teste previsto.**
   - Dois alunos com o mesmo nome: cada um só reivindica com a própria matrícula.
   - Aluno que pega o nome do colega: sem a matrícula dele é recusado; com ela, o professor recusa e o nome volta a livre.
   - Aluno que chega em maio: o nome avulso aparece no `salas/abrir` do link já vigente.
   - Turma sem professor alocado:
     - Vínculo removido, e o link antigo ainda funciona.
     - A coordenação decide, com `decidida_como = coordenacao`.
     - O coordenador não gera acesso.
   - Aluno que fecha a aba no meio: com falha injetada entre o `update` e o `insert`, o nome continua livre.
   - Virada de ano letivo:
     - Link, código e lista do ano encerrado respondem `NAO_ENCONTRADO`.
     - A decisão depois do `encerrar` é recusada.
     - **Buraco de desenho:** a §7 (Retenção) só apaga `lista_nome` livre no `encerrar`. A reivindicação que ainda está pendente fica com `senha_hash` para sempre, porque ninguém mais consegue decidi-la (`exigirAnoEmCurso`). O `encerrar` precisa recusar os pendentes e apagar o hash na mesma transação, e isso precisa de teste.

[… 41 linhas cortadas]

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-25 22:42:59 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: REPROVADO

Caminho quente tocado: login (a reivindicação é a primeira aula da escola) | migration

Rate limit: por escola e por turma, mas desenhado de um jeito que um ator só trava a escola ou a turma inteira (bloqueantes 1 e 2)

Fila e prioridade: ok. Não há fila. O desvio do `docs/infra.md` 3.5 é aceitável: a lista é por turma, com teto de 200 linhas e 64 KB, cabe folgado em 2 s com uma consulta `= any` e um insert, e continua coberta pelo `rl:u`, pelo `rl:e` e pelo `statement_timeout`. A nota no 3.5 precisa entrar na mesma tarefa.

Concorrência: há corrida na seção 4 (`salas/reivindicar`) com a seção 7c ("Corridas"): o mesmo aluno que reenvia o pedido recebe "recusado" (bloqueante 3). As outras corridas estão protegidas por update condicional, índice único parcial, `travarEscola` e `on conflict`.

Índice e paginação: ok (seção 3). Todos começam por `escola_id`, e a listagem da coordenação é paginada.

Degradação de IA: não se aplica.

Migration: compatível. A 0018, 0019 e 0020 só expandem, e o `convite` é pequeno.

Métrica e alerta: falta a métrica do teto atingido por escola e por turma (entra no bloqueante 1). Sem alerta novo, e isso está aceitável.

Bloqueantes:

1. **Seção 7c, "Rate limit": o limite de código errado (30 por escola em 10 min, recusando com `TEMPO_ESGOTADO`) tranca a entrada por código da escola inteira.**
   - Para proteger contra força bruta, o limite precisa recusar também o código certo quando passa do teto. Senão ele não protege nada.
   - O código é o caminho principal em sala. O professor projeta o código, e o aluno não tem celular para receber o link (Lei 15.100).
   - A rajada da RF19 põe 210 alunos digitando 6 caracteres de um projetor em 5 min. Trinta erros de digitação é o esperado, não o caso extremo. No primeiro dia de uma escola inteira (2.100 alunos, `docs/infra.md` 3.5) é certo.
   - O slug é público. Qualquer pessoa, de dentro ou de fora da escola, trava a entrada de qualquer escola com 30 pedidos. É a mesma falha que a regra 80, item 1, proíbe para o IP ("bloqueia 400 alunos por causa de um"), só que agora pela escola.
   - **Correção exigida:**
     - Mostrar a conta entre a entropia do código, os códigos ativos por escola e a taxa de erro de digitação da rajada, e dimensionar o teto a partir dela. Um código de 8 caracteres permite um teto bem mais alto sem aumentar a chance de força bruta.
     - Declarar o que acontece com o código certo acima do teto.
     - Fechar o caminho do ator único. Opções: contar antes por dispositivo (`educa_dispositivo`) e só depois pela escola; acima do teto, atrasar a tentativa (rebaixar) em vez de recusar; ou dar ao professor um jeito de ver a trava e destravar ao gerar um código novo.
     - Criar a métrica `sala.limite_atingido{escola_id}`.
     - Criar um teste em que a rajada tem erros de digitação e um atacante simultâneo, e os alunos com o código certo entram.

2. **Seção 7c, "Rate limit": o limite de 20 reivindicações recusadas por turma em 10 min tranca a turma inteira.**
   - Um aluno com 20 matrículas erradas em segundos tranca os outros 34 por 10 min.
   - Os erros legítimos da própria turma contam para o mesmo teto: matrícula digitada errado, clique no nome do colega e o perdedor da corrida da RF11 (que recebe o mesmo `REIVINDICACAO_RECUSADA`).
   - **Correção exigida:**
     - Contar a tentativa de matrícula errada por nome (`listaNomeId`), com teto pequeno. A força bruta de matrícula mira um nome, e só esse nome fica segurado.
     - Manter um teto por turma bem mais alto, só como proteção de fundo.
     - Não contar "nome já tomado" nem a corrida perdida como tentativa.
     - Testar que um atacante num nome não impede os outros 34 de reivindicar.

3. **Seções 4 e 7c, "Corridas": a reivindicação não é idempotente.**
   - Clique duplo, ou Wi-Fi que cai depois do commit e o cliente reenvia: o segundo pedido perde o update condicional e o aluno lê `REIVINDICACAO_RECUSADA` do próprio pedido.
   - Ele chama o professor achando que o colega pegou o nome, e ainda consome o limite do bloqueante 2.
   - **Correção exigida:**
     - Uma chave de idempotência gerada pelo cliente por envio, guardada na `reivindicacao` ou no Redis durante a janela.
     - O reenvio com a mesma chave responde `{ enviado: true }` e não conta no limite.
     - Um teste com dois envios paralelos com a mesma chave e um reenvio depois do commit.

4. **Seções 5 (passo 3) e 7c, "Manhã de segunda" (e risco 13): o argon2id da reivindicação não passa pelo `SemaforoDeHash`.**
   - Na rota anônima, o hash sem teto usa as threads do libuv fora do orçamento `UV_THREADPOOL_SIZE − 8` (`docs/infra.md` 4, "Threads e DNS"). O login da escola, e das outras escolas, perde a vez e a conexão ao banco.
   - O risco 13 só mede; não limita.
   - A spec também não diz a ordem entre hash e transação. Se o hash rodar dentro da transação, ou só quando a matrícula bate:
     - com o hash dentro da transação, ele segura uma conexão do pool (10 na API) durante a espera do semáforo;
     - com o hash só quando a matrícula bate, a diferença de tempo diz se a matrícula acertou, e isso fura a RF10.
   - **Correção exigida:**
     - O hash roda no semáforo do F1, no balde da escola do acesso (como o `convite-operador.service` faz no balde da equipe).
     - Roda sempre, acertando a matrícula ou não, como o hash fixo do login.
     - Roda depois da checagem do limite e antes de abrir a transação do update condicional.
     - O 503 `INDISPONIVEL_TENTE_DE_NOVO` do semáforo precisa ter tratamento declarado na página pública, junto com o reenvio do bloqueante 3.
     - Criar um teste que prova o teto de concorrência e o rodízio entre escolas com reivindicação e login juntos.

Recomendações:
- Seção 7c, "Rate limit": o `ContadorEmJanela` tem a janela fixa em 60 s (`JANELA_DO_CONTADOR_POR_IP_MS`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/contador-em-janela.ts`). A janela de 10 min exige mudar a classe. Declarar essa mudança, e declarar que, com o Redis fora, o teto é dividido por `LIMITE_INSTANCIAS_API` (`limiteDoSeguro`), como fazem os outros usos.
- Seção 7c: escrever a conta do `rl:ip` anônimo (`LIMITE_REQ_IP_ANONIMO_MIN=3000`) para a rajada da escola inteira. Declarar se a rede com um IP de saída só (`rede.ips_saida`) multiplica esse limite, como o limite de e-mail multiplica. Hoje as rotas da sala recusam com 429 no balde comum.
- Seção 7c, "Carga": o cenário usa só 6 turmas. Acrescentar a variante do primeiro dia da escola inteira e medir junto o login das outras escolas.
- Seção 7c, "Corridas": falta "retirar nome livre" contra reivindicação chegando. Precisa de delete condicional `where estado='livre'` ou de mapear a FK para `CONFLITO`. Também falta a colisão do código: sortear de novo depois da violação de único exige savepoint ou repetir a transação.
- Seção 5, passo 4: o aluno que tenta entrar antes da aprovação acumula falhas no contador por conta (escola + matrícula) e pode pegar espera crescente logo depois de aprovado. Declarar se a aprovação zera esse contador ou se a página só leva ao `/entrar` depois.
- Seção 4: declarar o intervalo de atualização da lista de pedidos do professor e que ela para com a aba escondida.
- Seção 3, migration 0018: o código anterior acha convite por hash sem filtrar o tipo (`conviteValidoPorHash`). Declarar o que o rollback faz com um convite de professor em aberto.
- Seção 7, "Retenção": uma reivindicação pendente de ano encerrado guarda `senha_hash` sem prazo. Ninguém decide mais, porque a decisão exige ano em curso. Isso é para o `privacy-guardian`.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/prd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/infra.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`

## tenancy-guardian · 1ª rodada · REPROVADO · 2026-09-25 22:43:31 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: REPROVADO

**Tabelas verificadas:** `lista_nome`, `reivindicacao`, `acesso_turma` e `convite` (ganha o tipo `professor`). As três novas têm `escola_id` e `ano_letivo_id` (seção 3), e o `convite` tem `escola_id`. O teste de arquitetura que procura tabela sem `escola_id` segue valendo.

**Queries verificadas:**
- As novas de `ResolucaoDeTenantRepository`: acesso pelo hash, e acesso pelo slug mais o HMAC do código.
- `reivindicar`: o `update … where estado='livre' and matricula` (seção 7c).
- `decidir`: a CTE `where estado='pendente'` (seção 5).
- As leituras com escopo da lista, dos pedidos, do acesso e do convite de professor (seção 6).
- O expurgo de `acesso_turma` e do convite de professor.
- Nenhuma rota recebe `escolaId` do cliente. O par slug mais código funciona como credencial, igual ao login por matrícula (item 3 ok).
- A camada de rede não ganha rota. As células novas da `MATRIZ` ficam cobertas pelo teste de `ALCANCES_INDIVIDUAIS` (item 7 não se aplica).

**Teste de isolamento:** presente mas inútil nas rotas públicas e no lote. Para as rotas autenticadas por id ele é efetivo (seção 6).

**Bloqueantes:**

1. **Seções 2 e 6: onde a resolução sem escopo é chamada.** As rotas públicas ficam no módulo novo `apps/api/src/sala` e resolvem o acesso chamando `ResolucaoDeTenantRepository` direto.
   - O `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts` (linha 65) proíbe qualquer arquivo fora de `apps/api/src/sessao` de importar essa classe. É essa contenção que torna aceitável o desvio da regra 10, item 9, que o próprio docblock da classe admite (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:75-77`).
   - Do jeito que está, a tarefa só fecha afrouxando o teste.
   - **Correção:** a resolução do acesso fica num serviço dentro de `apps/api/src/sessao`, que devolve só `{ escolaId, anoLetivoId, turmaId }`, e o `sala` consome esse serviço. A Tech Spec diz que o teste de arquitetura não muda. A lista fechada de métodos e as justificativas em `resolucao-de-tenant.repository.test.ts` ganham os dois métodos novos, com o texto escrito.

2. **Seção 6: o ano letivo das rotas públicas.** O ano que vira contexto é lido da linha de `acesso_turma`, e `exigirAnoEmCurso` confia no que está no contexto.
   - Nada confere que esse ano ainda está em curso. O `encerrar` do ano também não revoga o acesso nem fecha os pedidos pendentes. Pelo escopo, um pedido pendente do ano encerrado fica fora do alcance de quem decide, e continua com o `senha_hash` guardado.
   - A seção 10 não tem teste de virada, embora o PRD, seção 7, exija que link do ano encerrado não aceite reivindicação.
   - **Correção:**
     - A consulta de resolução faz join com `ano_letivo` da mesma escola, com `situacao='em_curso'`.
     - O `encerrar` revoga os `acesso_turma` e recusa os pendentes (apagando o hash) na mesma transação.
     - Teste de integração: depois do `encerrar`, `salas/abrir` e `salas/reivindicar` respondem `NAO_ENCONTRADO` pelo link e pelo código, e não sobra pedido pendente com hash.

3. **Seções 6 e 10: `salas/reivindicar` sem teste que prove o escopo.** O único teste público listado é "código de B na entrada de A não abre", e ele só cobre o `abrir`.
   - Se a cláusula `escola_id`/`turma_id` sair do `update` de reivindicar, nada quebra: a cláusula de matrícula sozinha faz qualquer teste com matrícula errada passar.
   - **Correção:** teste com o acesso da turma T1 e o `listaNomeId` de T2 da mesma escola, e depois de uma turma da escola B, sempre **com a matrícula correta daquele nome**. Esperado: `REIVINDICACAO_RECUSADA`, nenhuma linha alterada e nenhum pedido criado.
   - Alinhar também o texto: a seção 6 diz "responde como inexistente" e a seção 4 diz `REIVINDICACAO_RECUSADA`. Fica um só.

4. **Seção 4: resultado de `reivindicacoes/decidir` por id.** Só estão definidos `decidida` e `ja_decidida`.
   - Não está dito o que respondem um id inexistente, um id da escola B, e, para o professor, um pedido de turma sem vínculo confirmado. Se algum deles tiver resposta diferente dos outros, fica confirmado que o id existe (regra 10, item 6).
   - O teste da seção 6 ("respondem 404") não se aplica a um lote que responde por item.
   - **Correção:** os três casos devolvem exatamente o mesmo resultado por item. Teste com um lote que mistura um UUID aleatório, um pedido de B e um de turma sem vínculo: os três respondem igual, os pedidos de B e da turma sem vínculo continuam `pendente`, e nenhum usuário é criado.

5. **Seção 4 e `MATRIZ`: rota do aluno ver a própria turma.** A rota não está declarada.
   - O RF13 diz que o aluno "entra e vê só a turma dele", mas a seção 4 não tem rota para isso.
   - Hoje a `MATRIZ` dá `turma.ler: 'nunca'` ao aluno (`/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz.ts:117`). O único alcance por turma, `turma_vinculada`, é implementado só para o vínculo de professor (`TurmaRepository.#comVinculoDoProfessor`).
   - **Correção:** declarar a rota, a célula do aluno e o alcance pelo vínculo de aluno confirmado no ano em curso. Teste: o aluno de T1 pede T2 e uma turma de B, e as duas respondem 404.

6. **Seção 4: o aceite do convite revela conta em outra escola.** A seção diz que `convites/aceitar` não muda, mas o convite de professor passa a nascer da coordenação, e quem copia o link é a própria coordenação.
   - O aceite responde diferente conforme a conta já tem senha (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts:74` e `:98-99`): sem senha no pedido, a conta nova recebe `ENTRADA_INVALIDA` e a conta existente recebe `entrar` com bilhete. A seção 4 também manda a conta nova para `/entrar` sem bilhete.
   - Com isso, a coordenação da escola B descobre, com um e-mail qualquer, se aquela pessoa tem conta em outra escola cliente (item 5).
   - **Correção:** o aceite do convite de professor responde com a mesma forma nos dois casos (por exemplo, senha sempre exigida e resposta sempre `entrar` com bilhete). Teste: com um e-mail que tem conta em A e outro sem conta, as respostas a `consultar` e `aceitar` são indistinguíveis.

7. **Seções 4 e 5: conta global com senha definida por outra escola.** A conta é global e agora nasce por convite de escola. A senha dela é definida por um link que a coordenação dessa escola tem nas mãos, sem nenhuma prova de que o e-mail é da pessoa (a A1 não envia e-mail).
   - Exemplo: a coordenação de B cadastra o e-mail de um professor que depois será convidado por C, aceita o link ela mesma e define a senha. Quando C convidar, a conta já "tem senha": o professor verdadeiro fica sem acesso, e a credencial que abre a conta é conhecida por outra escola.
   - **Correção:** a Tech Spec nomeia esse risco e escolhe a mitigação, com teste. Por exemplo: a senha definida pelo link de uma escola não é reaproveitada pelo convite de outra enquanto a posse do e-mail não for provada, ou a conta criada por convite de escola fica presa a ela até essa prova.

**Recomendações:**
- Seção 3: declarar as FKs compostas no padrão da casa, que tornam a referência cruzada impossível por construção:
  - `(escola_id, ano_letivo_id, turma_id)` apontando para `turma`;
  - `(escola_id, turma_id, lista_nome_id)` do pedido apontando para `lista_nome`;
  - `usuario_id`, `criado_por` e `decidida_por` apontando para `usuario (escola_id, id)`.
- Seção 3: declarar `id uuid default uuidv7()` nas três tabelas (item 6 ficou implícito).
- As rotas `professores/:usuarioId/convite/{refazer,revogar}` só alcançam convite com `tipo='professor'`: a coordenação não refaz convite de coordenador (D2). Vale um teste.
- Os contratos de `salas/abrir` e `salas/reivindicar` em `.strict()`, sem `escolaId` nem `turmaId`. A seção 6 deve dizer que o `turmaId` vem da resolução e é passado pelo serviço, porque o contexto hoje não tem turma.
- Atualizar a justificativa de `@SemEscopo` em `ExpurgoDeAcessoRepository.apagarLoteVencido` para incluir `acesso_turma` e o convite de professor.
- `salas/abrir` pelo token: conferir que o slug de `/e/<slug>/turma` é o da escola do acesso.

## privacy-guardian · 1ª rodada · REPROVADO · 2026-09-25 22:43:46 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: REPROVADO

**Campos pessoais tocados:** nome e matrícula na lista da turma, com o estado. Na reivindicação, o nome escolhido, o hash da senha enquanto o pedido está pendente, o estado, quem decidiu e quando. Nome e e-mail do professor, com o convite dele. No acesso da turma, o hash do token, o HMAC do código e quem gerou. Nenhum campo proibido para aluno aparece: sem e-mail, telefone, CPF, foto, endereço, nascimento ou diagnóstico.

**Fora da tabela de dados do docs/lgpd.md:** nenhum campo novo fica de fora. As quatro linhas novas (`docs/lgpd.md:72-75`) estão no lugar, com finalidade e retenção. Duas ressalvas:
- A seção 8 do PRD tem uma quinta linha, "Contador de tentativas (HMAC), aluno", que a Tech Spec deixou cair sem explicar.
- As retenções das linhas 72 e 73 têm furos, descritos no bloqueante 2.

**Autorização por objeto:** falha em `POST reivindicacoes/decidir` (bloqueante 4). As outras rotas estão cobertas pela seção 6: o escopo vem do contexto, a rota pública resolve pelo hash ou pelo HMAC do código, e `listaNomeId` de outra turma responde como inexistente.

**Logs:** limpos no desenho. A seção 7 prevê só ids e contagens, e as métricas `sala.reivindicacao{resultado}` e `sala.codigo_recusado` não levam dado pessoal.

**Auditoria:** falta na leitura dos pedidos pendentes pela coordenação (`GET turmas/:id/reivindicacoes`). As demais ações da RF16 estão na seção 7.

**Envio externo:** nenhum para provedor. O botão do WhatsApp monta `wa.me/?text=` com o link da sala, e o token vai dentro da URL da Meta. A P27 já aceitou isso, e o texto não leva nome de aluno. Não há IA nem `ExecucaoAgente` nesta funcionalidade.

**Seed/fixture:** sintético. O PRD proíbe seed com escola pronta. O cenário de carga não diz de onde vêm os nomes; ver as recomendações.

**Bloqueantes:**

1. **A coordenação lê os pedidos pendentes sem auditoria** (`techspec.md`, seção 4, linha 64; seção 7, linha 108).
   - O que está errado: a rota devolve os nomes dos alunos que pediram entrada, e a coordenação alcança qualquer turma. É leitura de dado de aluno pela coordenação, e a regra 20 (item 10) e a regra transversal 4 de `docs/modelo-de-dados.md` exigem auditoria. A seção 7 audita só `turma.lista_lida`.
   - Correção exigida: repetir o padrão de `turma.alunos_lidos` (`apps/api/src/estrutura/turma.service.ts:93-104`).
     - Finalidade obrigatória para a coordenação, conferida antes de procurar a turma.
     - Um registro próprio (por exemplo `turma.reivindicacoes_lidas`) gravado na mesma transação: sem registro, sem lista.
     - Teste de integração que falha se o registro for retirado.
   - O professor com vínculo confirmado continua lendo sem finalidade e sem registro.

2. **O pedido pendente e o nome da lista não têm fim de vida na virada do ano** (seção 7, linha 110; seção 3, linhas 28-32; `docs/lgpd.md:72-73`).
   - Pedido nunca decidido:
     - depois do `encerrar`, `exigirAnoEmCurso` impede qualquer decisão;
     - então o `senha_hash` do pedido, que só sai "na decisão", fica para sempre;
     - e o nome fica `reivindicado` com a retenção "como o nome e a matrícula do aluno", ou seja, até 5 anos, de alguém que nunca virou aluno.
   - Pedido recusado:
     - a recusa devolve o nome a `livre`, e o `encerrar` apaga os nomes livres;
     - mas o pedido recusado guarda o "nome escolhido" por 5 anos só através de `lista_nome_id`;
     - a Tech Spec não diz o que acontece nessa FK: o `encerrar` falha, o pedido é apagado junto (contra a retenção declarada) ou o nome se perde.
   - Correção exigida:
     - na mesma transação do `encerrar`, fechar todo pedido pendente como decidido pelo sistema, com `senha_hash` nulo;
     - devolver esses nomes a `livre` e apagá-los;
     - declarar o comportamento da FK `reivindicacao → lista_nome` e o que o pedido recusado guarda depois que o nome sai;
     - ajustar as linhas 72 e 73 de `docs/lgpd.md`;
     - teste de integração: "encerrar com pedido pendente apaga o hash e o nome livre; encerrar com pedido recusado não falha".

3. **A eliminação do titular não alcança as tabelas novas** (seção 7; seção 3, linhas 28-35).
   - O que está errado:
     - `lista_nome` aprovada duplica o nome e a matrícula, com `usuario_id`, e o pedido aprovado aponta para ela;
     - `eliminar` (`apps/api/src/sessao/ciclo-de-vida.repository.ts:59-100`) apaga credencial, vínculos, sessões e usuário, mas não esses registros;
     - então o nome e a matrícula do aluno eliminado sobrevivem, ou a FK de `usuario_id` quebra a eliminação;
     - o mesmo vale para as referências a autor em tabela nova: `criado_por` e `decidida_por`, quando o professor ou o coordenador é eliminado.
   - Correção exigida:
     - a eliminação apaga, na mesma transação, a `lista_nome` e os pedidos do aluno;
     - declarar o `on delete` de cada FK para `usuario` nas três tabelas (a autoria continua na auditoria, como hoje);
     - escrever "sai junto com o usuário na eliminação" nas linhas 72 e 73 de `docs/lgpd.md`;
     - estender o teste de eliminação com um marcador nessas tabelas.

4. **A decisão em lote não declara autorização por objeto** (seção 4, linha 65; seção 5, passo 5, linhas 86-88; seção 6, linha 99).
   - O que está errado:
     - a rota recebe até 40 ids sem a turma na URL;
     - o `update … where estado = 'pendente'` não diz que exige, para o professor, vínculo confirmado na turma de cada pedido;
     - não está dito o que um id fora do alcance devolve;
     - o teste da seção 6 prevê 404, que não serve a uma rota com resultado por id.
   - Consequência: o professor da turma X pode aprovar um pedido da turma Y da mesma escola e criar um aluno com vínculo que ele não tinha.
   - Correção exigida:
     - o `update` leva a escola do contexto, o ano em curso e, para o professor, o `exists` do vínculo confirmado na turma do pedido;
     - id fora do alcance devolve exatamente o mesmo resultado que um UUID que não existe;
     - teste de isolamento: com um id da turma Y e um da escola B, nada é criado, e a resposta é igual à de um UUID aleatório.

**Recomendações:**
- **Página pública com nomes livres.** O desenho aceitável está lá: só nomes livres, sem matrícula, com validade, revogação e fim no encerramento do ano. Falta dizer na linha 72 de `docs/lgpd.md` que esses nomes aparecem a qualquer pessoa com o link ou o código vigente, para a escola saber o que está autorizando. Também:
  - `Cache-Control: no-store` em `salas/abrir`, como nas rotas de sessão;
  - a lista de nomes fora de qualquer armazenamento persistente no navegador, porque o computador do laboratório é compartilhado;
  - na linha 74, escrever que o link é de uso múltiplo por desenho (P27) e que o único é a reivindicação.
- **Contadores.** Reconciliar a seção 8 do PRD com a Tech Spec: se a chave é escola ou turma, não é dado pessoal, e isso deve estar escrito. Para o `infra-guardian`:
  - 30 códigos errados por escola deixam um aluno bloquear a entrada da escola inteira;
  - 20 pedidos recusados por turma podem ser atingidos por erros de digitação de 35 alunos na primeira aula;
  - o retorno `{ enviado: true }` confirma o par nome e matrícula, com uma vazão de cerca de 2.880 tentativas por dia por turma.
- **HMAC do código.** Separar a chave do HMAC do código da chave dos contadores, ou ao menos prefixar por finalidade.
- **Registro de acesso.** Dizer se as rotas públicas gravam o registro de acesso com IP. Se gravam, o horário liga o pedido ao IP, contra "nada liga o pedido ao navegador" (linha 73 de `docs/lgpd.md`).
- **Conta existente em outra escola.** A auditoria `professor.cadastrado` e o `GET professores`, que a escola lê, não podem revelar se o e-mail já tinha conta em outra escola cliente. O campo `contaNova` da A0b não deve vir para cá.
[… 9 linhas cortadas]

## frontend-reviewer · 2ª rodada · AJUSTES NECESSÁRIOS · 2026-09-25 23:21:39 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

**Minhas cinco correções da rodada 1: todas feitas.**

1. **Limite:** feito.
   - O limite agora usa `LIMITE_EXCEDIDO` com `Retry-After` (§7c).
   - Os textos estão num catálogo próprio, `MENSAGENS_DA_SALA` (W9).
   - Depois de uma recusa, a página busca de novo os nomes livres (W8).
   - Os tetos saem da conta de erro de digitação de 20% (tabela da §7c).
   - O código errado e a matrícula errada estão na carga (K1).
2. **Quatro estados:** feito.
   - A tabela da §9 tem uma linha por tela, com o texto do vazio e o próximo passo.
   - Carregando e erro usam `EstadoCarregando` e `EstadoErro` em toda tela.
   - O W4 prova o vazio e o erro com a rota interceptada, nos dois projetos.
3. **Fronteira de erro:** feito. A fronteira genérica fica em `componentes/`, com `Suspense` (§9), e o W5 aborta o carregamento, incluindo o título da aba que volta ao sair.
4. **Decisão:** feito.
   - "Aprovar N" usa a variante `oficial` e mostra turma, nomes e efeito.
   - Quando decide a coordenação, o diálogo avisa da auditoria.
   - "Recusar" usa a variante `perigo` e diz que o nome volta à lista.
   - A tela mostra o resultado de cada pedido, e `ja_decidida` aparece como "Já decidido por outra pessoa".
   - O teto de 40 vem explicado, o clique duplo manda um pedido só, e não existe "aprovar todos" (§9, W6).
5. **Seletor:** feito.
   - Mostra escola, rede e papel, e o desvio está registrado na §11.
   - `rede_id` é obrigatório na `escola` (`packages/nucleo/src/db/schema/escola.ts:28`), então a rede nunca vem vazia.
   - W13 e W3 cobrem o seletor e a troca de escola.

**Problema novo:** o catálogo de textos da sala (W9) dá instrução errada no caso mais comum, detalhado no bloqueante abaixo.

Estados: ok. A tabela da §9 cobre as nove telas; a "Minha turma" nunca fica vazia e não mostra colegas.

Acessibilidade: bem coberta.
- Teclado e foco no diálogo estão no W12.
- Os campos da página pública estão no W11: `autocapitalize`, `autocomplete="off"`, `inputmode`, "mostrar" senha e os 12 caracteres avisados.
- `document.title` muda por rota (W2), e todo e2e roda com axe.
- Falta dizer o que a atualização da lista de pedidos a cada 15 s faz com a seleção e com o foco (ver recomendações).

Chromebook fraco: ok.
- A página pública fica no pedaço que carrega primeiro, com teto de 150 kB.
- As áreas novas têm teto no `.size-limit.json` e fronteira de erro.
- A atualização dos pedidos para com a aba escondida (W15).
- A lista tem teto de 200 linhas e 64 KB, e não há upload de imagem nesta funcionalidade.

Celular: ok.
- Gaveta e cartões abaixo de 768 px, 360 px sem rolagem horizontal e alvos de 44 px (§9, W12).
- O código aparece em dois grupos de 4, bom para projetar.
- O WhatsApp tem a alternativa de copiar (W7), então nenhum fluxo exige o celular.

Ação oficial protegida: sim. Aprovar e recusar passam por diálogo de revisão; não há nota nesta funcionalidade. O feed de agentes não se aplica: "Seu time" entra na A2.

Bloqueantes:

1. **`cenarios.md` W9 (e a linha "Pública" da tabela da §9): o texto de `NAO_ENCONTRADO` manda o aluno que só digitou errado chamar o professor.**
   - **O que está errado:** o texto é "Este link ou código não vale mais. Peça o código atual ao professor." Mas `NAO_ENCONTRADO` também responde ao código digitado errado (R1). A própria §7c conta ~20% de digitação errada: ~40 alunos na rajada da RF19 e ~420 no primeiro dia. Eles vão ouvir que o código "não vale mais" e chamar o professor, em vez de conferir e digitar de novo.
   - **O segundo erro, no mesmo catálogo:** o texto de `LIMITE_EXCEDIDO` diz "Muitas tentativas neste computador", mas o teto é por nome (L4), não por computador. O aluno troca de máquina e continua travado.
   - **Correção exigida:**
     - A página escolhe o texto pelo caminho que ela mesma usou, código digitado ou link. O servidor continua respondendo igual para todos os casos (regra 10, item 6); só o texto na tela muda.
     - Para o código digitado, algo como: "Não encontramos turma com este código. Confira as letras e os números; se estiver certo, peça o código atual ao professor." O campo continua preenchido e com o foco.
     - Para o link, o texto atual serve.
     - O limite passa a dizer que é por nome: "Muitas tentativas com este nome. Espere N minutos ou chame o professor."
     - O W9 e o W8 passam a provar os dois caminhos e o texto do limite.

Recomendações:
- **Atualização a cada 15 s (§9, W6 e W15):** declarar e testar que ela mantém a seleção e o foco, que um diálogo aberto não perde os ids, e que os pedidos novos são anunciados de forma discreta, sem interromper (`aria-live="polite"`). Na rajada de 35 pedidos, perder a seleção a cada 15 s vira bug no momento principal da demonstração.
- **Resultado da decisão:** ao lado de `ja_decidida`, mostrar também `nao_encontrada` com um texto próprio (por exemplo, "Este pedido não está mais disponível").
- **Reenvio no 503 (W8):** limitar os reenvios automáticos e, depois de algumas tentativas, mostrar "Tentar de novo" em vez de "Tentando de novo…" sem fim.
- **Espera de 1 s do código certo acima de 1.000 erros (§7c):** o botão mostra carregando e bloqueia o segundo envio.
- **Seletor (W13):** incluir a marca de escolhido e o lugar, que é o topo da lateral e a barra de 56 px no celular (`docs/interface.md` 11.1).
- **Continua em aberto desde a rodada 1:**
  - quantos toques leva o Sair no celular (D59);
  - se o rodapé do aluno com "Avisar um adulto" e Privacidade (11.1, D61) entra na A1 ou fica para depois;
  - como o aluno escolhe entre dois nomes iguais. Hoje a lista mostra só o nome, e a escolha errada gasta uma das 5 tentativas daquele nome.
- **Limite por nome (L4):** um colega consegue travar o nome de outro por 10 minutos, e "chame o professor" não dá ao professor nenhuma ação. Vale dizer o que o professor faz, nem que seja esperar.

Arquivos revisados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/revisao-spec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/achados/revisao-spec.md
- /home/joaquimdp/Documentos/git/Educa.ia/docs/interface.md
[… 2 linhas cortadas]

## tenancy-guardian · 2ª rodada · REPROVADO · 2026-09-25 23:22:05 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: REPROVADO

**Tabelas verificadas:** `lista_nome`, `reivindicacao`, `acesso_turma` e `convite` (com o tipo `professor`). As três tabelas novas têm `escola_id` e `ano_letivo_id`, usam `uuidv7()` e têm FKs compostas com a escola (techspec §3, l.21-41).

**Queries verificadas:**
- `acessoDaSalaPorToken` e `acessoDaSalaPorCodigo`, pelo `AcessoDaSala` dentro de `sessao`, com o ano `em_curso` e o slug conferidos.
- O `update` condicional de reivindicar.
- O `update` do `decidir`, com escola, ano em curso e `exists` do vínculo.
- `minha-turma` pelo vínculo de aluno confirmado.
- `encerrar`, `eliminar` e o expurgo.

Nenhuma rota recebe `escolaId` do cliente, e a P5 prova o `.strict()`. A camada de rede não ganha rota: a I9 prova `nunca` para ela.

**Teste de isolamento:** presente e efetivo nas rotas autenticadas e nas públicas (I1 a I9, P1 a P5, R1 e R2). A exceção é a leitura nova que o limite por nome exige, que não tem teste (bloqueante 1).

**Minhas correções da rodada 1:**
1. Resolução dentro de `sessao`: atendida (§6 l.95-99; I1, I2).
2. Ano em curso na resolução e `encerrar` revogando o acesso e fechando os pendentes: atendida (§6 l.97-98, §7 l.111-113; V1, V2, C10).
3. Reivindicar com o nome de T2 e de B e a matrícula correta: atendida (I5), e o texto ficou uma resposta só (§4 l.68-71).
4. Resultado do lote: atendida. `nao_encontrada` é idêntico para os três casos, e `ja_decidida` só aparece dentro do alcance (§4 l.70-71, §5 l.83-87; I6 com vínculo `pendente` e `contestado`).
5. Rota do aluno: atendida (§4 l.62; I8, I9).
6 e 7. Risco aceito: não verificável como está escrito (bloqueante 2).

As recomendações da rodada 1 foram atendidas: FKs compostas, `uuidv7`, refazer e revogar só alcançam convite de professor (I7), contratos `.strict()` (P5), `@SemEscopo` do expurgo (§2) e slug conferido contra a escola do acesso (I4).

**Bloqueantes:**

1. **`techspec.md:79-81` (§5, passo 4) e `techspec.md:141-147` (tabela de limites): a leitura que decide se a falha conta no limite por nome não tem escopo declarado nem teste.**
   - O que está errado: o limite de 5 por nome conta "matrícula errada" e não conta "nome tomado" nem "corrida perdida". Para saber o motivo depois de o `update` devolver zero linhas, o código precisa de uma leitura nova da `lista_nome`, e a spec não a declara.
   - Se essa leitura sair sem escola, ano e turma do acesso, o `listaNomeId` de T2 ou da escola B passa a responder `LIMITE_EXCEDIDO` na 6ª tentativa, enquanto um UUID aleatório segue em `REIVINDICACAO_RECUSADA`. Isso confirma que o id existe (item 5).
   - Nenhum teste quebra se o escopo for retirado: a R2 faz uma tentativa só, e a L4 usa só nome da própria turma.
   - Correção exigida:
     - Declarar no passo 4 que só conta a falha em nome `livre` da escola, do ano e da turma do acesso. A alternativa é contar qualquer id da mesma forma.
     - Criar um cenário: sete tentativas com matrícula errada com o `listaNomeId` de T2, de B e aleatório dão respostas idênticas, sempre `REIVINDICACAO_RECUSADA`, e não criam contador. A mesma sequência num nome livre de T1 dá `LIMITE_EXCEDIDO` na 6ª. **Quebra sem:** o escopo na leitura que decide se conta.

2. **`techspec.md:192-194` (§11) e `techspec.md:205-207` (§13): o risco aceito cita uma decisão e um item de portão que ainda não estão escritos.**
   - O que está errado: a §11 chama o risco de "quarto afrouxamento da D71" e diz que ele "vai à D71". Hoje três lugares ainda falam em três afrouxamentos: `docs/decisoes.md:792` ("Três afrouxamentos"), `ROADMAP.md:118` e a linha da D71 no `CLAUDE.md`.
   - A mitigação da §13 é "item do portão da primeira escola real", e a lista do portão (`ROADMAP.md:518-532`) não tem esse item. Do jeito que está, nada impede a primeira escola real de entrar com o aceite que revela conta em outra escola e com a senha definida pelo link de outra escola. São as duas violações da regra 10 que a decisão tolera só enquanto o dado for sintético.
   - Correção exigida, sem reabrir a decisão:
     - Registrar a revisão da D71 por `/registrar-decisao` antes de aprovar a spec, com os dois comportamentos tolerados escritos um a um, e corrigir `ROADMAP.md:118` e o `CLAUDE.md`.
     - Acrescentar em `ROADMAP.md`, "Portão da primeira escola real", o item com o que fecha os dois riscos e o teste que o prova: `convites/consultar` e `/aceitar` respondem igual para e-mail com e sem conta, e a senha definida pelo link de uma escola não abre a conta no convite de outra sem prova de posse do e-mail.
     - A §13 aponta esse item pelo lugar onde ele está.

**Recomendações:**
- **`techspec.md:79`:** declarar que a busca de `chaveEnvio` usa a escola e a turma do acesso. Hoje o único é `(escola_id, chave_envio)`, e a busca não está dita.
- **`cenarios.md:264` (W9):** o texto "Muitas tentativas neste computador" contradiz o contador por nome da §7c, porque o limite não é por computador. Alinhar com o `frontend-reviewer`.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/revisao-spec.md
- /home/joaquimdp/Documentos/git/Educa.ia/docs/decisoes.md
- /home/joaquimdp/Documentos/git/Educa.ia/ROADMAP.md
- /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-25 23:22:21 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: APROVADO

**Conferência das quatro correções que exigi na rodada 1**

1. **A leitura dos pedidos pela coordenação agora é auditada: atendido.**
   - Onde está: techspec §4, com a leitura `nominal_auditado`, e §7, com `turma.reivindicacoes_lidas` no padrão de `turma.alunos_lidos`.
   - Testes: P3 exige a finalidade antes de procurar a turma, para qualquer id, inclusive inexistente ou da escola B. A2 grava o registro na mesma transação da leitura e falha sem ele. O professor lê sem registro.

2. **O pedido pendente e o nome da lista têm fim de vida na virada do ano: atendido.**
   - Onde está: techspec §7 ("Virada de ano") e §3, com `on delete set null (lista_nome_id)`.
   - O `encerrar` revoga o acesso, fecha o pendente como `encerrada`, sem hash e sem `decidida_por`, e apaga os nomes livres e reivindicados, tudo na mesma transação.
   - Testes: V1 cobre também o pedido recusado com a referência nula e o `encerrar` sem falha. V2 cobre o ano posto em `encerrado` sem revogar o acesso. C10 cobre `encerrar` em paralelo com reivindicar e com aprovar.
   - As linhas 72 e 73 de `docs/lgpd.md` foram ajustadas.

3. **A eliminação agora alcança as tabelas novas: atendido.**
   - Onde está: techspec §7 ("Eliminação") e §3. `usuario_id` fica sem ação, então o `delete` explícito é obrigatório; `criado_por` e `decidida_por` usam `set null`.
   - Testes: V3 põe um marcador no nome e confere que ele não sobra em tabela nenhuma. V4 elimina o professor e confere que a auditoria guarda o id.
   - A minimização (b) ajuda: na aprovação, a `lista_nome` fica sem nome e sem matrícula, e o dado vive só no usuário e na credencial.

4. **A decisão em lote tem autorização por objeto: atendido.**
   - Onde está: techspec §5, passo 6. O `update` confere o id, a escola, o ano em curso, o estado pendente e, para o professor, o vínculo confirmado na turma do pedido. O §4 dá uma resposta só, `nao_encontrada`, e a mesma consulta separa `ja_decidida` de `nao_encontrada`.
   - Teste: I6, com um lote que mistura um UUID aleatório, um pedido da escola B, um de turma sem vínculo e um de vínculo `pendente` ou `contestado`. C3 cobre a corrida.

**Problemas novos do desenho, conferidos contra a minha lista:**
- Nenhum campo proibido para aluno aparece.
- A chave de envio é aleatória e não identifica ninguém.
- As rotas públicas não gravam registro de acesso. A decisão está escrita no §7 e provada pelo A6, e é coerente com a linha 86 do `docs/lgpd.md`.
- O `Cache-Control: no-store` está provado pelo A7.
- Os nomes ficam fora do armazenamento do navegador (W8).
- A chave do HMAC do código é separada da dos contadores (E15).
- O `GET professores` e o `professor.cadastrado` não trazem `contaNova` (E11).

A conta global de professor continua revelando, pelo aceite, se o e-mail já tem conta em outra escola. O Joaquim aceitou esse risco só enquanto o dado for sintético, com a prova de posse do e-mail indo para o portão da primeira escola real (§11 e §13). Por isso não bloqueia.

```
VEREDITO: APROVADO
Campos pessoais tocados: nome e matrícula na lista_nome (só enquanto livre ou reivindicado; aprovado, só estado e usuario_id); na reivindicação, estado, datas, quem decidiu e como, hash da senha só enquanto pendente e chave de envio; nome e e-mail do professor e o convite dele; no acesso da turma, token_hash, codigo_hmac e criado_por; contadores com chave HMAC da escola, da turma ou do id da linha
Fora da tabela de dados do docs/lgpd.md: nenhum (as linhas 72 a 76 cobrem lista, reivindicação, acesso, convite de professor e contadores)
Autorização por objeto: ok (I3 a I8, P1 a P5; o decidir em lote pelo I6)
Logs: limpos (só ids; A4 inclui o slug na sentinela)
Auditoria: presente (A1; leitura da lista e dos pedidos pela coordenação no A2, com finalidade)
Envio externo: nenhum para provedor; sem IA e sem ExecucaoAgente. O link da sala vai no texto do wa.me (P27, já aceito), sem nome de aluno (E16)
Seed/fixture: sintético (sem seed de escola; testes e carga com nomes gerados)
Bloqueantes: nenhum
Recomendações:
- A conta global de professor, quarto afrouxamento da D71, ainda não está registrada em lugar nenhum: não aparece na D71, no TODO.md nem no ROADMAP.md. O /registrar-decisao e o item "prova de posse do e-mail" no portão da primeira escola real precisam existir antes do primeiro commit de código. Sem isso, o afrouxamento some quando o dado virar real.
- A força bruta de matrícula por nome agora é limitada, mas o total por turma subiu. São 5 tentativas por nome a cada 10 min, cerca de 720 por dia por nome, e o teto de 150 da turma só rebaixa o hash, sem recusar. Um colega com o código da turma e uma matrícula sequencial acha a do vizinho em minutos ou horas, e o "enviado" confirma o par nome e matrícula. Sugestão: mostrar ao professor, no pedido, que houve tentativas erradas naquele nome antes de ele aprovar (a D4 depende de o professor perceber o pedido estranho, caso de borda E25).
- O §4 manda a lista de pedidos atualizar a cada 15 s. Com a coordenação na tela, isso grava um turma.reivindicacoes_lidas por consulta, cerca de 240 por hora por aba, e dilui a auditoria. Declarar que a coordenação não atualiza sozinha, ou que registra uma vez por finalidade e sessão da tela, e ajustar o A2.
- O texto do §7 "lista.gravada, com o nome avulso" dá para ler como se o nome fosse para a auditoria. Reescrever como "também na inclusão avulsa, só com ids e contagens", que é o que o A1 diz.
- O W9 diz "Muitas tentativas neste computador", mas não há contador por computador: o limite é por nome. Trocar por "neste nome" ou por texto neutro, para não sugerir ao aluno e à família um rastreio que não existe.
- A chave_envio fica 5 anos com o pedido e só serve à idempotência. Anular na decisão (com a coluna anulável, mantendo o único parcial) ou justificar. Declarar também que ela vive só em memória no navegador e estender o W8 a ela, porque "nada liga o pedido ao navegador" depende disso.
- O PRD §8 ainda diz 15 min e "não está no lgpd.md" para os contadores. Alinhar com os 10 min da tabela de dados.
- Escrever no §7 a justificativa da exclusão física do nome livre: é pré-cadastro, a minimização vence a exclusão lógica, e a auditoria lista_nome.retirado guarda só o id. A recomendação da rodada 1 continua aberta.
- O pedido do titular (acesso e portabilidade) é do F3 (ciclo-de-vida.service.ts:24). Anotar no ROADMAP ou no TODO que ele precisa cobrir lista_nome e reivindicacao, para a pergunta de fechamento continuar respondida quando existir escola real.
```

**Pergunta de fechamento:** na A1 o código responde. Tudo o que existe sobre o aluno está no usuário, na credencial, no vínculo, na `lista_nome` pelo `usuario_id` e nos pedidos pela referência a ela, e nada vai para fora. A rotina formal do pedido do titular é do F3; está na última recomendação.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/revisao-spec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/achados/revisao-spec.md
- /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md (linhas 72 a 76 e 86)
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts

## test-engineer · 2ª rodada · REPROVADO · 2026-09-25 23:22:49 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos**
- Cada RF do PRD, do RF1 ao RF19, na forma do "Como se prova".
- Os nove casos de borda do PRD §7.
- Resposta igual nas rotas públicas e no lote.
- Permissão por objeto em cada rota nova, com vínculo `pendente`, `contestado` e encerrado.
- Isolamento da reivindicação e do lote.
- O I7 da A0b.
- Corridas em paralelo: reivindicação, envio duplo, decisão (aprovar × recusar, professor × coordenação), retirar × reivindicar, colisão do código, `encerrar` × escrita.
- Virada de ano, eliminação e expurgo em paralelo.
- Limites: o ator único não trava a escola nem a turma.
- O que o desenho novo trouxe: idempotência por `chaveEnvio`, hash sempre, limite por nome.
- Do domínio, que o PRD não lista: o professor que dá duas disciplinas na mesma turma e o aluno que chega em maio com a matrícula errada.

**Cobertos: as seis correções da rodada 1**

1. **`cenarios.md` com id e "Quebra sem":** atendida. Todos os RFs que pedi agora têm cenário:
   - RF1: W2
   - RF3: E1, E2
   - RF4: E3, E4, E5, W10
   - RF5: E6, E7
   - RF6: R4, E9
   - RF7: E10
   - RF9: E13, E16
   - RF12: E20, W6
   - RF13: E18, E19
   - RF14: L1, L3
   - RF16: A1
   - RF17: A3, E13
2. **Os seis casos de borda:** atendida. São os cenários E23, E24, E25, E26, E27, V1, V2 e C10. O buraco do pedido pendente com `senha_hash` depois do `encerrar` foi fechado na §7 e no V1.
3. **§4 contra §6:** atendida. A §4 ("Uma resposta só") é a única fonte, e os cenários R1 e R2 enumeram os casos. Falta só "turma excluída" (ver recomendações).
4. **O lote revela existência:** parcialmente atendida. Surgiu o `nao_encontrada` e o I6 testa um lote misto, mas o caso exato que eu apontei continua sem teste (bloqueante 2).
5. **Permissões das rotas novas:** atendida nos cenários P2, P3, I6 (vínculo `pendente` e `contestado`) e I7.
6. **Corridas:** atendida nos cenários C3, C4, W6 e W8. Mas a C2, que é nova, contradiz o fluxo da §5 (bloqueante 1).

Das recomendações da rodada 1, estão atendidas: W3, K1 (critério), R3, A4, E14, a nota no PRD §3, V5 e W8.

**Bloqueantes**

1. **§5, passo 4 (techspec.md:79-81), contra o C2 (cenarios.md:168-169): o reenvio em paralelo com a mesma chave recebe `REIVINDICACAO_RECUSADA`, e não `enviado`.**
   - Como está desenhado:
     - a chave é conferida antes da transação, então os dois envios passam por ela;
     - T1 faz o `update lista_nome … where estado='livre'` e segura a linha;
     - o `update` de T2 espera e, depois do commit de T1, reavalia `estado` e devolve zero linhas;
     - pela spec, "sem linha" dá `REIVINDICACAO_RECUSADA`.
   - O índice único `(escola_id, chave_envio)` nunca chega a disparar. O "Quebra sem" do C2 ("o 23505 mapeado para `enviado`") descreve uma proteção que o fluxo não exercita.
   - É o caso que o `infra-guardian` pediu: o cliente reenvia enquanto o primeiro pedido ainda está no ar, e o aluno lê "recusado" no próprio pedido.
   - **Correção exigida:** na §5, escolher um dos dois caminhos:
     - gravar a chave (o `insert` do pedido) antes do `update` da `lista_nome`, na mesma transação, para o segundo envio esbarrar no único e cair em `enviado`;
     - ou, quando o `update` devolve zero linhas, reler a chave já confirmada antes de responder.
   - Reescrever o "Quebra sem" do C2 para a cláusula escolhida, e o C2 afirmar que nenhuma das duas respostas é `REIVINDICACAO_RECUSADA`.

2. **I6 (cenarios.md:28-32): o lote misto só tem pedidos pendentes, e o vazamento da rodada 1 era o pedido já decidido.**
   - A §5, passo 6, diz que "o mesmo alcance separa `ja_decidida` de `nao_encontrada`". Nenhum cenário prova isso para um id fora do alcance.
   - Se a implementação olhar o estado antes do alcance, um pedido já decidido de B, ou de T2 para o professor, responde `ja_decidida` e confirma que existe. O I6 continua verde.
   - **Correção exigida:** acrescentar ao I6:
     - um pedido já decidido da escola B;
     - um pedido já decidido de T2, sem vínculo do professor;
     - para a coordenação, um pedido já decidido de B.
   - Os três devem responder `nao_encontrada`, idênticos ao UUID aleatório. "Quebra sem": o alcance aplicado antes do estado na separação.

3. **E7 (cenarios.md:93-94) e §4 (techspec.md:53-54): o nome avulso não tem teste da matrícula repetida.**
   - A `lista_nome` aprovada fica sem matrícula (check da §3). O índice único da lista não enxerga, portanto, a matrícula de aluno já aprovado.
   - O E4 prova a consulta a `credencial_matricula` só na prévia e na gravação da lista, não em `POST turmas/:id/lista/nome`.
   - Sem essa consulta, o aluno que chega em maio com a matrícula digitada igual à de um colega aprovado vira um nome livre. Quando esse nome for aprovado, a credencial duplicada estoura no `decidir`.
   - **Correção exigida:** no E7, o nome avulso sem nome, sem matrícula, com matrícula já na lista (mesma turma e outra turma) e com matrícula de aluno aprovado. Todos recebem o erro tipado e nada é gravado. "Quebra sem": a consulta a `credencial_matricula` na rota avulsa.

4. **W9 (cenarios.md:262-266): o texto de `LIMITE_EXCEDIDO` diz "Muitas tentativas neste computador", e não existe mais contador por computador (decisão b).**
   - O `LIMITE_EXCEDIDO` sai por dois caminhos, e o texto está errado nos dois:
     - pelo nome (L4): o aluno troca de computador e continua travado; se um colega travou o nome dele, ele lê que o problema é o computador;
     - pelo `rl:ip` (L10): o bloqueio é da rede inteira da escola.
   - O W9 afirma um texto falso, então o teste passa com o comportamento errado.
   - **Correção exigida:** um texto que seja verdadeiro nos dois caminhos, por exemplo "Muitas tentativas agora. Espere N minutos ou chame o professor.", corrigido no W9 e em `MENSAGENS_DA_SALA`.

**Recomendações**
- **I6:** o "Quebra sem" cita o ano em curso, mas o lote não tem pedido de ano encerrado. Incluir um pedido pendente com o ano posto em `encerrado` no banco, como faz o V2, ou tirar o ano do "Quebra sem".
- **V3:** o marcador não vive no pedido, que não tem nome, nem na `lista_nome` aprovada, que fica sem nome e sem matrícula. O teste deve guardar os ids dos pedidos antes do `eliminar` e afirmar que sumiram, e o "Quebra sem" deve incluir o `delete` dos pedidos. Sem esse `delete`, o `set null` os mantém.
- **R3:** incluir `listaNomeId` inexistente e de outra turma entre os casos que passam pelo argon2id.
- **C3:** trocar "no máximo um usuário e uma auditoria" por "exatamente um usuário, uma credencial e uma auditoria".
[… 14 linhas cortadas]

## infra-guardian · 2ª rodada · REPROVADO · 2026-09-25 23:24:45 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: REPROVADO

**Correções da rodada 1, item a item**

- **Bloqueante 1 (código trava a escola):** atendido em techspec.md §3 (linha 40) e §7c (linhas 136–148), e testado em L2 e L3. O código tem 8 caracteres, o teto da escola só atrasa e o código certo sempre entra. A métrica `sala.limite_atingido` existe. A conta está certa: 31⁸ ≈ 8,5 × 10¹¹; um palpite acerta com 7 × 10⁻¹¹ com 60 códigos ativos; 3.000/min durante 7 dias dá 3 × 10⁷ palpites, cerca de 0,2% por IP. Descartar o cookie `educa_dispositivo` está correto. Mas a conta só fecha para um IP: a espera de 1 s não reduz a vazão de quem manda em paralelo, então com N IPs a chance cresce N vezes, e o único sinal é uma métrica sem alerta (bloqueante 4).
- **Bloqueante 2 (turma trancada):** atendido em parte. O contador por nome e o teto de fundo por turma entraram (L4, L5). Ficam abertos dois furos, os bloqueantes 2 e 3 abaixo.
- **Bloqueante 3 (idempotência):** a chave `chaveEnvio`, o único e os cenários E21 e C2 entraram. Mas a ordem da §5 recusa o envio repetido que chega em paralelo (bloqueante 1 abaixo).
- **Bloqueante 4 (hash fora do semáforo):** atendido. O hash roda no `SemaforoDeHash`, no balde da escola, sempre, depois do limite e fora da transação. O 503 tem texto e reenvia a mesma chave (§5 passo 4, §7c linha 126; R3, L9, W8, W9).
- **Recomendações da rodada 1:** atendidas. A janela passou a ser parâmetro do `ContadorEmJanela` (L8). O Redis fora divide o teto (L7). A conta do `rl:ip` está escrita. K2 e o login da outra escola entraram. Entraram também C4, C6, E22 e W15, e o rollback da 0018.

---

```
VEREDITO: REPROVADO
Caminho quente tocado: login (reivindicação em sala e login no mesmo balde do semáforo) | migration
Rate limit: ok no desenho, com dois furos (bloqueantes 2 e 3)
Fila e prioridade: ok (sem fila; a lista tem teto de 200 linhas e 64 KB)
Concorrência: corrida em tasks/prd-apresentacao-escola/techspec.md:79-81 contra cenarios.md:168-169 (C2)
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: faltando (bloqueante 4)
```

**Bloqueantes**

1. **techspec.md:79-81 (§5 passo 4) contra cenarios.md:168-169 (C2): o mesmo envio repetido em paralelo recebe `REIVINDICACAO_RECUSADA`.**
   - O que está errado:
     - O segundo pedido com a mesma `chaveEnvio` passa pela consulta da chave, porque o primeiro ainda não gravou.
     - Ele espera o hash de 30 ms, ou até 2 s na fila do semáforo. Nesse tempo o primeiro grava.
     - Depois, o `update` condicional da `lista_nome` encontra o nome já `reivindicado` e devolve zero linhas. A spec responde `REIVINDICACAO_RECUSADA`.
     - O erro 23505 do único `(escola_id, chave_envio)` nunca chega a acontecer, porque o `insert` não roda. Então o C2, como está escrito, não passa com esse desenho.
     - É o caso do Wi-Fi que cai: a web reenvia enquanto o primeiro pedido ainda espera no semáforo. O aluno lê que o nome foi recusado, e o erro soma no contador por nome.
   - Correção exigida:
     - Com zero linhas no `update`, consultar a `chaveEnvio` num comando novo, que já vê o que o outro gravou, antes de classificar. Se ela existe, responder `enviado`, sem contar.
     - Ou gravar a `reivindicacao` antes do `update` da `lista_nome`, na mesma transação.
     - Declarar essa ordem na §5.
     - O C2 passa a incluir o reenvio que chega enquanto o primeiro espera no semáforo, com o sorteio da vez controlado pelo teste.

2. **techspec.md:147 ("Não contam nome tomado, corrida perdida e reenvio") com cenarios.md:68-70 (R3) e 202-203 (L6): quem tem o código consegue hashes sem limite, com prioridade normal, no balde da escola.**
   - O que está errado:
     - Pela R3, o pedido com nome tomado roda o argon2id, e ele não conta em contador nenhum.
     - Um `listaNomeId` aleatório também não acumula no contador por nome, e a tabela chama o contador da turma só de "matrícula errada".
     - Um aluno com um script e o código projetado reivindica um nome e depois martela esse nome, ou manda UUIDs aleatórios. São até 50 hashes por segundo por IP que nunca são rebaixados.
     - Isso lota o balde da escola, onde está também o login por matrícula da própria escola às 7h30. É o ataque de dentro da escola que fixou a calibração de 30 ms no F1 (docs/infra.md 3.1).
   - Correção exigida:
     - Toda tentativa que roda o hash e não cria pedido conta no teto de fundo da turma: nome inexistente, de outra turma, tomado, corrida perdida e matrícula errada.
     - Esse teto só rebaixa e nunca recusa, então contar o erro legítimo ali não prejudica ninguém.
     - Só o contador por nome, que recusa, deixa de fora o nome tomado e a corrida perdida.
     - A L6 passa a dizer quais contadores ficam como estavam.
     - Novo teste: um ator repete o pedido num nome tomado, depois de 150 tentativas o hash dele sai rebaixado, e o login da mesma escola não recebe 503.

3. **techspec.md:144 e cenarios.md:198-199 (L4): um ator trava a turma inteira pelo contador por nome, e o professor não tem como destravar.**
   - O que está errado:
     - São 5 matrículas erradas por nome × 35 nomes = 175 pedidos, alguns segundos com o código projetado ou vindo do grupo de WhatsApp.
     - Com isso, todos os nomes ficam em `LIMITE_EXCEDIDO`, também com a matrícula certa, por 10 minutos, e o ator pode repetir.
     - A chave é só `listaNomeId`, então "Gerar novo" não limpa nada. A rodada 1 exigiu que "o ator único não trave a turma", e a L4 só testa um nome atacado.
   - Correção exigida:
     - A chave do contador por nome passa a ser (`acesso_turma`, `listaNomeId`), para que "Gerar novo", feito pelo professor na sala, zere as travas. O código que circulou no grupo não alcança mais o código novo.
     - A tela Acesso e o texto do `LIMITE_EXCEDIDO` dizem esse caminho ao professor.
     - A métrica passa a ter `tipo="nome"`.
     - Novo teste, L4b: o ator trava os 35 nomes com o código X, o professor gera o código Y, e os 35 reivindicam com o Y.

4. **techspec.md:131-132 e 147-148 (§7c, "Sem alerta novo"): a proteção contra força bruta distribuída é só medir, e ninguém é avisado.**
   - O que está errado:
     - O teto da escola não limita a vazão. Com N IPs, a chance cresce N vezes: cerca de 1% numa escola pede 1,4 × 10⁸ pedidos, uns 32 IPs durante um dia.
     - O que se ganha com isso é a lista de nomes livres de menores de uma turma.
     - Quem opera é uma pessoa só, sem plantão (regra 80: o sistema precisa se defender sozinho e avisar antes de a escola ligar).
   - Correção exigida:
     - Um alerta sobre `sala.limite_atingido{tipo="escola"}` sustentado, com limiar e janela declarados.
     - O parágrafo em `docs/runbook.md` que diz o que fazer: achar a escola e os IPs pelo log, bloquear na borda e revogar os acessos da escola.
     - O teste de infra do alerta, no padrão dos alertas do F1.

**Recomendações**

- techspec.md:143, cenarios.md:195-197 (L3): declarar que a espera de 1 s acontece sem conexão do pool presa. Declarar também se o código certo espera antes ou depois da busca.
- techspec.md:128-129: um balde próprio (`rl:ip:sala`) para que `salas/*` não disputem com `convites/consultar` e as outras rotas anônimas. Declarar que dois primeiros dias de escolas da mesma rede, atrás de um IP de saída só, não podem cair juntos, ou multiplicar o limite pelas escolas da rede, como o limite de e-mail faz.
- cenarios.md:262-265 (W9): "Muitas tentativas neste computador" está errado, porque o limite é do nome ou do IP da escola, não do computador. O texto deveria levar ao professor gerar um código novo (junto com o bloqueante 3).
- techspec.md:162-164 com :107: a atualização a cada 15 s na tela da coordenação grava `turma.reivindicacoes_lidas` a cada ciclo. Auditar uma vez por finalidade e sessão da tela, e não a cada leitura (confirmar com o `privacy-guardian`).
- `chaveEnvio` validada como UUID no contrato `.strict()`.
[… 10 linhas cortadas]

## frontend-reviewer · 3ª rodada · APROVADO · 2026-09-26 02:18:55 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: APROVADO

**A correção exigida na rodada 2 foi feita.**
- **Texto de `NAO_ENCONTRADO` pelo caminho:** Tech Spec §9 "Textos" e W9. Com o servidor respondendo igual, a página escolhe o texto pelo caminho que usou:
  - código digitado: "Confira as letras e os números; se estiver certo, peça o código atual ao professor."
  - link: "Este link não vale mais. Peça o código atual ao professor."

  Nenhum dos dois manda chamar o professor quem só digitou errado. O W8 prova os dois caminhos com `salas/abrir` interceptado, e no código digitado o campo continua preenchido e com o foco nele.
- **Texto do limite:** W9, "Muitas tentativas agora. Espere N minutos ou peça ao professor um código novo." Não fala mais em computador, e o W9 garante que nenhum texto fale. O N vem do `Retry-After`, igual para o limite do nome e do `rl:ip`, e o W8 prova os dois (L4 e L10). O texto leva ao "Gerar novo", e a tela Acesso diz ao professor que ele destrava os nomes (§9 "Acesso", W7), coerente com o L4b.

**O que mudou também passa:**
- **Atualização dos pedidos (W15, §9 "Decisão"):**
  - Para o professor, atualiza a cada 15 s só com a aba visível.
  - Mantém seleção, foco e diálogo pelos ids.
  - Anuncia os pedidos novos com `aria-live="polite"` sem tirar o foco.
  - A coordenação atualiza só por botão, e a auditoria segue uma por leitura (A2).
- **`nao_encontrada` e `ja_decidida`** têm texto próprio (W6).
- **Reenvio no 503** vai até 3 vezes e depois mostra "Tentar de novo" (W8, W9).
- **Tentativa com matrícula errada no pedido** aparece como texto, sem número nem hora, também no diálogo de aprovar (W6, E30). A informação não depende de cor.

Estados: ok. A tabela do W4 cobre as nove telas com o texto do vazio e o próximo passo, e o erro é provado com a rota interceptada. A Minha turma nunca fica vazia.

Acessibilidade: ok. W12 prova teclado (Tab, Espaço, Enter), foco preso no diálogo e devolvido ao fechar, e axe nos dois projetos. W15 cobre o anúncio sem roubar foco, e W11 cobre `autocomplete`, `inputmode`, `autocapitalize` e o "mostrar" da senha.

Chromebook fraco: ok.
- A atualização para com a aba escondida.
- A página pública tem teto de 150 kB, e as áreas novas têm teto no `.size-limit.json`.
- A fronteira de erro tem o carregamento abortado provado no W5.
- Os nomes ficam só na memória.
- A espera de 1 s não prende conexão (L3).

Celular: ok. W12 prova 360 px sem rolagem horizontal, cartões e gaveta abaixo de 768 px e alvos de 44 px, com o W1 ao W14 nos projetos `chromebook` e `celular`. O compartilhamento pelo WhatsApp tem o recurso de copiar (W7), e nenhum fluxo exige o celular.

Ação oficial protegida: sim. "Aprovar N" mostra a turma, os nomes e o efeito antes de confirmar; "Recusar" pede confirmação; o clique duplo manda um pedido só; não existe "aprovar todos"; o teto de 40 é explicado (§9 "Decisão", W6).

Bloqueantes: nenhum

Recomendações:
- **Pedidos da coordenação, sem saída no vazio (W4):** o vazio da tela Pedidos aponta para Acesso, mas a coordenação não alcança Acesso (P2), então o botão leva a uma tela que ela não pode abrir. Dar à coordenação um vazio próprio, sem esse passo, por exemplo "Os pedidos chegam quando o professor da turma gerar o acesso".
- **Reenvio automático no 503 (§9 "Página pública", W8):** hoje ele não diz o intervalo. Com a turma inteira na mesma rede, 35 navegadores reenviando juntos pioram o pico. Reenviar pelo `Retry-After`, com uma variação aleatória, e provar o intervalo no W8.
- **Plural no texto do limite (W9):** "Espere N minutos" gera "Espere 1 minutos". Arredondar para cima, com mínimo de 1, e tratar o singular. No `rl:ip` o `Retry-After` vem em segundos.
- **Link vencido na página pública (W4, W8):** depois do texto do link, mostrar o campo do código já com o foco, para o aluno digitar o código atual sem precisar de outro endereço.
- **Anúncio das mensagens na página pública (W8):** "Tentando de novo…" e os erros devem ser anunciados (`role="status"` ou `role="alert"`) e ligados ao campo por `aria-describedby`.

Arquivos:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/revisao-spec.md

## tenancy-guardian · 3ª rodada · APROVADO · 2026-09-26 02:19:22 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: APROVADO

Tabelas verificadas: `lista_nome`, `reivindicacao` (com a coluna nova `teve_matricula_errada`) e `acesso_turma`. As três têm `escola_id` e `ano_letivo_id`, id `uuidv7()` e FKs compostas com a escola. A FK de `acesso_turma` para `turma`, com `on delete cascade`, é composta com a escola. Por isso o cascade só leva acessos da própria escola, e a turma só sai sem acesso vigente (techspec §3, linhas 31-32, e §4, linhas 49-50; cenários E2 e R1).

Queries verificadas:
- **Primeira correção exigida, feita.** A leitura que decide se a falha conta no nome está na techspec §5, passo 5 (linhas 88-89). Ela roda depois da volta atrás, com escola, ano e turma do acesso, e só conta o nome ainda `livre`. Com o `insert` antes do `update` e a FK composta com a escola, um nome de B ou um UUID aleatório falham na FK. Um nome de T2 cai na leitura com a turma do acesso. Nenhum dos dois soma no contador.
- **Contador por nome.** A chave é (`acesso_turma`, `listaNomeId`) (§7c, linha 145). Ela só é incrementada depois dessa leitura, então o `teve_matricula_errada` (E30) só reflete tentativas na turma do próprio acesso. O professor e a coordenação leem esse sinal pelo mesmo alcance do pedido (§4, linhas 60-62).
- **`ops:revogar-acessos-sala`.** É rotina do operador, com o `OPERADOR` conferido antes de tocar no banco. A escola do argumento está na cláusula do `update`, e o E29 prova que os acessos de B não são tocados. Não é endpoint, então não conta como `escolaId` vindo do cliente.
- **Rotas públicas.** Continuam `.strict()` (P5). O slug é conferido contra a escola do acesso (I4). As respostas são iguais nos casos enumerados (R1, R2), e o lote é filtrado pelo alcance antes do estado (I6).
- **Segunda correção exigida, feita.** A D71 foi revista em `docs/decisoes.md` (linhas 821-828), com os dois comportamentos tolerados (a) e (b). O `ROADMAP.md` fala em quatro afrouxamentos na linha 118. O "Portão da primeira escola real" (linhas 527-530) traz a prova de posse do e-mail e o teste que a fecha. O `CLAUDE.md` também foi atualizado (linhas 132 e 265), e a techspec aponta para esses lugares na §11 (linha 182) e na §13 (linhas 196-198).
- **`@SemEscopo`.** Só os dois declarados em `sessao`, com justificativa (§6; I2).

Teste de isolamento: presente e efetivo. O I10 (cenarios.md, linhas 47-53) compara 21 respostas byte a byte e confere que nenhuma chave de contador foi criada. Sem a turma do acesso na leitura, o nome de T2 trancaria na 6ª tentativa e o teste quebraria. O I3 a I9, o E29 e o R1 seguem efetivos.

Bloqueantes: nenhum.

Recomendações:
1. **"Quebra sem" do I10 e do I5** (cenarios.md, linhas 52-53 e 28): tirar só a escola ou só o ano não deixa o teste vermelho, porque `turma_id` é UUID global e a cláusula de turma sozinha já barra. Não há vazamento, mas o texto promete mais do que o teste prova. Diga que a cláusula que o quebra é a turma, e que escola e ano ficam como segunda camada.
2. **Como o `ops:revogar-acessos-sala` monta o contexto da escola** (techspec §2, linha 16; `docs/runbook.md`, linha 399): a spec não diz como a escola do argumento vira o contexto. O runbook usa `--escola <id>`, e os outros comandos recebem o slug e resolvem pelo `escolaPorSlug`. Declarar se ele usa o repository com escopo, sem `@SemEscopo` novo (e então a §11, que fala em "dois `@SemEscopo`", continua certa), e alinhar id ou slug com os outros comandos.
3. **Gerar acesso × excluir turma em paralelo** (techspec §3, linha 32; E2): falta cenário de corrida. Com `read committed`, o `not exists` do `delete` pode não ver o acesso recém-gravado, e o cascade o leva junto. Não cruza escola, porque a FK é composta, mas o professor perde o acesso sem aviso. Sugestão ao `test-engineer`: estender o C9 para esse par.

Arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/decisoes.md`, `/home/joaquimdp/Documentos/git/Educa.ia/ROADMAP.md`, `/home/joaquimdp/Documentos/git/Educa.ia/CLAUDE.md`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`

## infra-guardian · 3ª rodada · REPROVADO · 2026-09-26 02:19:54 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: login (a reivindicação usa o mesmo balde do `SemaforoDeHash` que o login por matrícula) | migration
Rate limit: ok. Nenhum limite é só por IP. Os tetos são por escola, por (`acesso_turma`, `listaNomeId`) e por turma. O `rl:ip` anônimo é só o teto externo.
Fila e prioridade: ok. Não há fila. A lista tem teto de 200 linhas e 64 KB, e o hash de quem passa do teto da turma é rebaixado no balde da escola.
Concorrência: corrida em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md:84-87` contra `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md:204-209` (C2)
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível (0018 a 0020 só expandem; o rollback da 0018 está declarado na §3)
Métrica e alerta: ok

**Correções exigidas na rodada 2, uma a uma**

1. **C2, idempotência.** Atendida só em parte; o furo que sobrou é o bloqueante abaixo. A ordem mudou para o `insert` da `reivindicacao` antes do `update` da `lista_nome` (§5 passo 4), e o C2 ganhou a variante (b), com o segundo envio esperando no semáforo.
2. **Hash sem limite para quem tem o código.** Atendida. Toda falha que roda o hash conta no teto da turma, que só rebaixa (§5 passo 5; §7c, linha "hash sem pedido criado"). A L6 diz o que cada caso faz com cada contador. A L6b prova o nome tomado repetido 200 vezes: hash rebaixado a partir do 151º e 30 logins da escola sem 503.
3. **Ator trava a turma pelo contador por nome.** Atendida. A chave passou a ser (`acesso_turma`, `listaNomeId`) (§7c) e existe a métrica `tipo="nome"` (§7c). A tela Acesso e o texto do limite levam ao "Gerar novo" (§9). A L4b cobre os 35 nomes travados e o código novo, e a E30 prova que o contador antigo não marca o pedido feito pelo código novo.
4. **Força bruta distribuída sem alerta.** Atendida:
   - Alerta `sala-codigo-errado-por-escola`: mais de 10/min, somadas as instâncias, por 5 min (§7c).
   - Parágrafo "Código da turma errado em massa numa escola" em `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:375-415`. Separa ataque de fora, script de dentro e muitos IPs. Proíbe bloquear o IP de saída da escola e mantém o IP fora do `TODO.md`. As chaves `rl:ip:{ip}` guardam o IP em claro, então o comando `redis-cli --scan` do runbook funciona.
   - Comando `ops:revogar-acessos-sala` (E29).
   - Testes L11 (unidade e guarda de runbook) e L12 (ensaio, com a rajada do primeiro dia sem ficar pendente).
5. **Recomendações que foram atendidas.** A espera de 1 s não prende conexão do pool (§7c; L3 com o pool no mínimo). `chaveEnvio` é validada como UUID (§4, E21) e anulada na decisão. A coordenação atualiza por botão.

**Bloqueantes**

1. **`techspec.md:84-87` (§5 passo 4) contra `cenarios.md:204-209` (C2): a resposta ao reenvio em paralelo depende da ordem física dos índices.**
   - O que está errado:
     - O segundo envio com a mesma `chaveEnvio` também traz o mesmo `listaNomeId`. Por isso ele colide com o primeiro em **dois** índices únicos: o parcial `(escola_id, chave_envio)` e o de "um pendente por nome" (§3).
     - O Postgres confere os índices na ordem do OID. O 23505 que volta depois do commit do primeiro é o do índice mais antigo.
     - Se o índice do pendente for o mais antigo, a §5 manda responder `REIVINDICACAO_RECUSADA`. É o mesmo aluno lendo "recusado" que a rodada 2 exigiu eliminar.
     - Qual índice é o mais antigo depende da ordem em que a 0019 escreve os índices. Um `REINDEX CONCURRENTLY` em produção troca o OID e inverte a ordem em silêncio, e o C2 da esteira não vê.
   - Correção exigida:
     - Na §5: diante de qualquer 23505 (da chave ou do pendente por nome), a transação volta atrás e um comando novo relê a `chaveEnvio` na escola e na turma do acesso.
     - Se a chave existir, a resposta é `enviado`, sem contar em limite nenhum. Se não existir, `REIVINDICACAO_RECUSADA`.
     - A classificação não pode depender do nome da restrição.
     - O C2 ganha no "Quebra sem" a releitura da chave depois de qualquer 23505. O teste roda nas duas ordens de criação dos índices, ou força o 23505 do pendente por nome com a mesma chave.

**Recomendações**

- **Ator dentro da sala** (§7c, L4b). Quem está na sala vê o código Y projetado e pode travar os nomes de novo com 175 pedidos. O caminho de destravar é refazer o "Gerar novo" e o professor já vê `teveMatriculaErrada`. Vale declarar o risco na §13 ou pôr `tipo="nome"` em painel.
- **Reenvio de pedido que falhou** (§5 passo 4). O reenvio em paralelo de uma tentativa com matrícula errada conta duas vezes no contador do nome, porque a chave não fica gravada no erro. Declarar como aceito ou deduplicar a contagem pela chave.
- **Balde `rl:ip:sala`** (§7c, `rl:ip`). Continua de fora. Duas escolas da mesma rede no primeiro dia, atrás de um IP de saída só, dão cerca de 2.600/min contra o teto de 3.000/min, e com três escolas já passa. Declarar o limite na §7c; hoje ele só aparece no "Depois" do runbook.
- **Nota em `docs/infra.md` 3.5** (§11, regra 00). Ainda não está no diff. Entra na tarefa que cria a lista.

## test-engineer · 3ª rodada · REPROVADO · 2026-09-26 02:20:10 · `tasks/prd-apresentacao-escola/revisao-spec.md`

Conferi os quatro bloqueantes da rodada 2 no `techspec.md` e no `cenarios.md`. I6 e E7 estão resolvidos. Ficam dois bloqueantes: o C2 ainda depende de uma escolha ao acaso do Postgres, e o W9 ainda tem um texto que não vale nos dois caminhos.

**Correções exigidas da rodada 2, item a item**

1. **C2, reenvio em paralelo: atendida em parte, e com um problema novo.**
   - O que foi feito: a §5, passo 4 (`techspec.md:81-87`), grava a `reivindicacao` antes do `update` da `lista_nome`. O C2 (`cenarios.md:204-209`) testa os dois jeitos, com os envios em paralelo e com o segundo esperando no semáforo. Afirma "nenhuma `REIVINDICACAO_RECUSADA`".
   - O problema: o insert do segundo envio esbarra em dois índices únicos ao mesmo tempo, o `(escola_id, chave_envio)` e o "um pendente por nome" (`techspec.md:36`). O Postgres confere os índices na ordem em que foram criados e acusa só o primeiro que conflita.
   - A §3 lista o do pendente por nome primeiro. Se a migration seguir essa ordem, o 23505 sai nele, e a §5 manda esse caso para `REIVINDICACAO_RECUSADA`. É exatamente o erro da rodada 2.
   - O C2 pegaria isso, mas só porque a ordem dos índices joga contra. Se a ordem favorecer, o C2 passa. Um índice recriado mais tarde inverte o resultado sem nenhum teste avisar.
2. **I6: atendida.** Estão lá os já decididos de B e de T2, o de B pela coordenação e o pendente de ano encerrado (T5). Os oito primeiros respondem `nao_encontrada`, iguais ao UUID aleatório. O "Quebra sem" diz que o alcance vem antes do estado (`cenarios.md:29-37`, `techspec.md:93-94`).
3. **E7: atendida.** Sem nome ou sem matrícula dá `ENTRADA_INVALIDA`. Matrícula já na lista da mesma turma, na de outra turma, ou de aluno aprovado (em `credencial_matricula`) dá `CONFLITO`. Em todos, nada é gravado, e o "Quebra sem" é a consulta a `credencial_matricula` na rota avulsa (`cenarios.md:110-115`, `techspec.md:53-55`).
4. **W9: atendida em parte.** O texto de `NAO_ENCONTRADO` agora muda conforme o aluno digitou o código ou usou o link, e "computador" saiu. Mas o texto do limite ainda não vale nos dois caminhos (bloqueante 2).

**O que o texto novo trouxe**

- **Estão bons:** I10, L4b, L6, L6b, L11, L12, E29 e E30.
- **Estão atendidas:** as recomendações da rodada 2 para V3, R3, C3, E2, L5, P2, P3, K1, E18, W8 e W15.

```
VEREDITO: REPROVADO
Cenários exigidos: cada RF do PRD (RF1 a RF19); os nove casos de borda do PRD §7; as respostas iguais nas rotas públicas e no lote; permissão por objeto em cada rota nova, com vínculo pendente, contestado e encerrado e o professor com duas disciplinas; isolamento da reivindicação, do lote e da leitura que decide o contador por nome; o I7 da A0b; as corridas em paralelo (reivindicação, envio duplo com a mesma chave, aprovar × recusar, professor × coordenação, reivindicar × retirar, colisão do código, encerrar × escrita); virada de ano, eliminação e expurgo em paralelo; limites em que um ator só não trava a escola nem a turma, e "Gerar novo" destrava; o alerta de força bruta distribuída; o aluno que chega em maio com a matrícula de um colega aprovado.

Cobertos: I1 a I10, P1 a P5, R1 a R5, E1 a E30, V1 a V5, C1 e C3 a C10, L1 a L12 com L4b e L6b, A1 a A7, W1 a W15, K1 e K2. O mapa fecha RF1 a RF19 e os nove casos de borda. Das correções da rodada 2, I6 e E7 estão atendidas; C2 e W9, em parte.

Bloqueantes:
1. techspec.md:36 e techspec.md:84-87, contra cenarios.md:204-209 (C2). O desenho ainda pode recusar o reenvio com a mesma chave.
   - O que está errado: o insert do segundo envio viola dois únicos ao mesmo tempo, o `(escola_id, chave_envio)` e o "um pendente por nome". O Postgres acusa só o primeiro índice na ordem de criação. A §3 lista o pendente por nome primeiro, e a §5 manda o 23505 dele para `REIVINDICACAO_RECUSADA`: é o comportamento da rodada 2 de volta. Qual constraint aparece no 23505 não prova de que envio se trata.
   - Correção exigida na §5, passo 4, uma de duas:
     (a) diante de qualquer 23505, ou de `update` sem linha, depois de voltar a transação atrás, reler a chave na escola e na turma do acesso, num comando novo. Achou: `enviado`, sem contar. Não achou: `REIVINDICACAO_RECUSADA`.
     (b) fazer o insert com `on conflict (escola_id, chave_envio) where chave_envio is not null do nothing`, com a chave como árbitro. Sem linha devolvida, `enviado`.
   - No C2: o "Quebra sem" passa a ser a cláusula escolhida, e não "o 23505 do único da chave mapeado para enviado". Acrescentar um caso com o índice do pendente por nome criado antes do índice da chave (ou uma unidade do classificador que receba o 23505 do pendente por nome com a chave já gravada) e que responda `enviado`. Assim o teste não depende da ordem dos índices.
2. cenarios.md:349-353 (W9) e techspec.md:168-170 (§9, "Textos"). O texto do limite, "Muitas tentativas agora. Espere N minutos ou peça ao professor um código novo.", é falso no caminho do `rl:ip`.
   - O que está errado: nesse caminho o bloqueio é o IP da escola, e um código novo não destrava nada. Só faz o professor revogar o link que o resto da turma ainda estava usando. O W9 afirma no "Quebra sem" que o texto vale nos dois caminhos, então passa com um texto que engana num deles.
   - Correção exigida: um texto verdadeiro nos dois caminhos que ainda leve o aluno ao professor, por exemplo "Muitas tentativas agora. Espere N minutos ou chame o professor.". Quem mostra "Gerar novo" ao professor é o W7, que já diz que destrava os nomes travados. Corrigir no W9, no W8 e em `MENSAGENS_DA_SALA`.

Recomendações:
- E5 (cenarios.md:106-107): acrescentar uma matrícula que só existe em `credencial_matricula` da escola B. Na lista e no nome avulso de A, ela entra, e o "Quebra sem" passa a ser a escola na consulta a `credencial_matricula`. Hoje, sem essa escola, o `CONFLITO` confirmaria à coordenação de A uma matrícula de outra escola, e nenhum teste quebra.
- E21 (cenarios.md:149-152): o "Quebra sem" cita a leitura da chave na escola e na turma do acesso, mas não há caso que prove isso. Acrescentar a mesma chave reenviada pelo acesso de T2, que segue o fluxo normal e não recebe `enviado`.
- I6 (cenarios.md:31): dizer que T5 é de outro ano letivo de A (populado e então posto em `encerrado` no banco). Se for o mesmo ano de T1, o lote se contradiz.
- Nova corrida C11: excluir a turma × gerar o acesso, em paralelo. O `not exists` do acesso vigente no `delete` é avaliado com o retrato antigo. Com o `on delete cascade` (techspec.md:32), o gerar pode responder 201 com um acesso que a exclusão já levou. O teste deve afirmar que a turma fica com o acesso vigente, ou sai e o gerar recebe `NAO_ENCONTRADO` ou `CONFLITO`, nunca 201 com acesso morto.
```

Não editei nenhum arquivo. Os três documentos lidos estão em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/` (`techspec.md`, `cenarios.md`, `prd.md`), e as exigências da rodada 2 estão em `revisao-spec.md` e em `achados/revisao-spec.md`, na mesma pasta.

## privacy-guardian · 3ª rodada · REPROVADO · 2026-09-26 02:20:18 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: REPROVADO

Campos pessoais tocados: `reivindicacao.teve_matricula_errada` (novo), `reivindicacao.chave_envio`, IP do cliente (as chaves `rl:ip:<ip>` do Redis de cache, agora com os `salas/*` e com leitura por pessoa da operação), IP gravado em regra de bloqueio na borda (novo), leitura da lista de pedidos pela coordenação.

Fora da tabela de dados do docs/lgpd.md: três usos do IP.
- A leitura humana das chaves `rl:ip` durante o alerta.
- O IP gravado na regra de bloqueio da borda.
- A entrada dos `salas/*` no `rl:ip`. A seção "IP só em memória, no login" (`docs/lgpd.md:89-105`) fala só das rotas de login.

A coluna nova está na tabela, mas com uma retenção que não bate com a finalidade (bloqueante 2).

Autorização por objeto: ok. A decisão em lote, I6 e o E29 prendem a escola na cláusula do `update`. A coordenação lê pela `unidade`, com auditoria.

Logs: limpos. O A4 exige log só com ids. A linha `sala.limite_atingido` leva só o `escolaId`.

Auditoria: presente.
- `turma.reivindicacoes_lidas` sai a cada "Atualizar" (A2, W15).
- `acesso_turma.revogado` é gravado por acesso, com `autor_operador`, no `ops:revogar-acessos-sala` (E29).
- `reivindicacao.decidida` guarda `decidida_como`.

Envio externo: nenhum. A funcionalidade não usa IA e nada vai a terceiro.

Seed/fixture: sintético. A carga e o e2e usam nomes gerados, e não há seed de escola (D71).

Bloqueantes:

1. **Uso novo e guarda nova do IP, sem estar no `docs/lgpd.md`**, em `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:388-392` e `:397-398`, e em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:98-105`.
   - **O que está errado, parte 1:** `packages/nucleo/src/limite/chaves.ts` confirma que a chave `rl:ip:<ip>` guarda o IP em claro. Até hoje só o limitador lia essa chave. O runbook passa a mandar uma pessoa da operação ler todas elas com `redis-cli --scan`. Isso traz o IP de todo visitante anônimo de todas as escolas no último minuto, não só o do ataque.
   - **Parte 2:** o `docs/lgpd.md:104-105` afirma o contrário: "o IP de um ataque, quando preciso, é consultado no registro de acesso". As rotas da sala não gravam esse registro (Tech Spec §7, A6).
   - **Parte 3:** o bloqueio manda gravar o IP em `infra/Caddyfile`. Esse arquivo é versionado (`git ls-files` confirma) num repositório **público**, e o texto não diz quando o bloqueio sai. O IP fica guardado sem prazo e pode acabar num commit público. O próprio parágrafo diz que "o IP é dado pessoal".
   - **Correção exigida:**
     - No `docs/lgpd.md`, seção do IP: incluir os `salas/*` no `rl:ip`.
     - Declarar a leitura humana das chaves `rl:ip`: só durante o alerta, só para bloquear, sem copiar o IP para lugar nenhum.
     - Declarar o IP na regra de bloqueio da borda, com finalidade e retenção fixa. Exemplo: o bloqueio sai em N dias, ou quando o incidente fecha.
     - Corrigir a frase das linhas 104-105.
     - No runbook: o bloqueio nunca vai para arquivo versionado (usar arquivo fora do git ou a regra do provedor), o bloqueio tem prazo de remoção, e o "Depois" registra que o bloqueio foi removido.

2. **`teve_matricula_errada` continua gravado depois da decisão, por 5 anos, preso ao aluno identificado**, em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md:25` e `:93` (e §7 `:118`), e na linha "Reivindicação" do `docs/lgpd.md` ("o resto: vigência + 5 anos").
   - **O que está bem:** enquanto o pedido está pendente, o campo passa na regra 70, item 4d, e na D57. É sim/não, sem texto, número, hora nem matrícula tentada. Fala do nome, não da pessoa, e serve só para o professor decidir a identidade.
   - **O que está errado:** a finalidade termina na decisão. Depois dela, o pedido aprovado continua ligado ao aluno pela `lista_nome.usuario_id`, e o sim/não vira uma marca de "tentativa suspeita" no registro de um menor por 5 anos. Pior, as tentativas podem ter sido de um colega ou de um atacante (E25). Isso é dado impreciso e mantido além da finalidade (LGPD art. 6º, III e V). Também deixa de valer o espírito do item 4d: não pode existir campo sobre a conduta atribuída ao aluno.
   - **Correção exigida:**
     - A coluna passa a aceitar nulo e só tem valor no pedido pendente, como a chave e o hash (§3, `:36`).
     - É anulada na aprovação, na recusa e no `encerrar`, na mesma transação (§5 passo 6, §7 "Virada de ano").
     - A linha do `docs/lgpd.md` passa a dizer "apagado na decisão ou no encerramento".
     - Testes que provam: E21 ou E30 conferem o campo nulo depois de aprovar e de recusar, e V1 no `encerrar`, com "Quebra sem: a anulação na decisão".
     - Confirmar que `reivindicacao.decidida` na auditoria não copia o campo.

Recomendações:
- **Causas 1 e 2 do runbook (para o `infra-guardian`):** escola particular sem rede não tem `ips_saida`. Às 7h30, os IPs com contagem mais alta no `rl:ip` são os de saída das próprias escolas (a escola dá ~1.300/min, §7c). Do jeito que está, o critério pode levar a bloquear o IP de uma escola, o que a regra 80, item 1, proíbe. Vale dar um critério que não dependa de `ips_saida`.
- **Linha "Contadores da sala" do `docs/lgpd.md`:** acrescentar a segunda finalidade do contador do nome, que é marcar o pedido pendente.
- **Texto do W6:** dizer que a tentativa pode ter sido erro de digitação, para o professor não ler aquilo como acusação.
- **Pontos conferidos sem ressalva:**
  - A `chaveEnvio` só em memória, anulada na decisão e no `encerrar`, com índice parcial. Está coberta por E21, V1 e W8.
  - O `ops:revogar-acessos-sala`: auditado, imprime só a contagem, exige `OPERADOR`, provado pelo E29.
  - A atualização da coordenação só pelo botão, com auditoria (A2, W15).
  - A linha nova no `TODO.md` sobre o pedido do titular do F3.
- **Pergunta de fechamento:** para as tabelas da A1, a resposta existe por eliminação (V3). Acesso e portabilidade dependem do F3, agora registrados no `TODO.md`. Nada é enviado a terceiro.

## privacy-guardian · 4ª rodada · APROVADO · 2026-09-26 02:27:57 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: APROVADO

As duas correções da rodada 3 foram feitas. O que mudou para atendê-las não abre problema novo.

**Correção 1, IP nas chaves `rl:ip` e em `infra/Caddyfile`: feita.**
- **Runbook, "Código da turma errado em massa numa escola"** (`docs/runbook.md:375-415`):
  - Nenhum passo lê IP. O runbook proíbe ler as chaves `rl:ip` à mão, também durante o alerta, e aponta para a seção "IP só em memória, no login".
  - A escola é achada pelo `escolaId` do log `sala.limite_atingido` e pelo slug no painel da operação. A resposta é `ops:revogar-acessos-sala --escola <slug>`.
  - O E29 prova esse comando: escopo pela escola, sem `@SemEscopo` novo, auditoria com `autor_operador`, só a contagem impressa, e a escola B intacta.
  - Não há bloqueio na borda na A1. `Caddyfile` e arquivo versionado não aparecem mais.
  - O "Depois" registra a escola pelo id, sem IP.
- **`TODO.md`:** ganhou o item do bloqueio na borda. Ele fica para o staging (D42), com finalidade e prazo no `docs/lgpd.md` antes do primeiro uso, e fora de arquivo versionado.
- **`docs/lgpd.md`, seção do IP (linhas 89 em diante):**
  - O `rl:ip` passa a contar `salas/abrir` e `salas/reivindicar`, com a janela de um minuto, e só o limitador lê a chave.
  - "Ninguém lê as chaves `rl:ip` à mão" está escrito.
  - A consulta ao registro de acesso vale só para as rotas de login. As rotas da sala não gravam registro de acesso (Tech Spec §7, cenário A6).
  - O bloqueio na borda entra nessa seção antes de existir.

**Correção 2, `teve_matricula_errada` por 5 anos: feita.**
- **Tech Spec §3:** a coluna aceita nulo e só tem valor em pedido pendente.
- **Tech Spec §5 passo 4:** o valor é lido do contador do nome no `insert` do pedido.
- **Tech Spec §5 passo 6:** o campo é anulado na aprovação e na recusa, junto com o hash e a chave.
- **Tech Spec §7:** o `encerrar` anula o campo na mesma transação, e a auditoria `reivindicacao.decidida` não o copia.
- **Cenário E30:** prova a anulação na aprovação e na recusa, que a auditoria não traz o campo, e que a resposta não traz número, hora nem matrícula tentada.
- **Cenário V1:** prova a anulação no `encerrar`.
- **`docs/lgpd.md`:** a linha da reivindicação diz "apagados na decisão ou no encerramento, na mesma transação". A linha "Contadores da sala" ganhou a segunda finalidade.
- **Cenário W6:** traz o texto "pode ter sido erro de digitação".

```
VEREDITO: APROVADO
Campos pessoais tocados: lista_nome (nome, matrícula, estado); reivindicacao (senha_hash, chave_envio, teve_matricula_errada, datas, decidida_por); acesso_turma (token_hash, codigo_hmac, criado_por); convite de professor; contadores da sala (HMAC por escola, turma e acesso+listaNomeId); IP como chave do rl:ip nas rotas salas/*
Fora da tabela de dados do docs/lgpd.md: nenhum
Autorização por objeto: ok (§4 e §6; ops:revogar-acessos-sala pelo repository com escopo, E29)
Logs: limpos (só ids; sala.limite_atingido com escolaId, sem IP; A4)
Auditoria: presente (turma.lista_lida e turma.reivindicacoes_lidas pela coordenação, decisão, acesso_turma.revogado pelo operador; reivindicacao.decidida sem teve_matricula_errada)
Envio externo: nenhum; sem IA, nada vai a terceiro
Seed/fixture: sintético (carga e e2e com nomes gerados)
Bloqueantes: nenhum
Recomendações:
- A4 (cenarios.md:309): pôr o IP na lista do que o log capturado não pode ter, já que o runbook conta com um log sala.limite_atingido sem IP
- Runbook, "Depois" (docs/runbook.md:413): o TODO.md fica num repositório público; registrar só o id da escola, sem nome nem slug, como já está, e dizer isso por escrito
- As recomendações não bloqueantes da rodada 3 de tenancy, infra e frontend continuam com os revisores delas
```

## infra-guardian · 4ª rodada · REPROVADO · 2026-09-26 02:29:01 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: login (a reivindicação divide o balde do `SemaforoDeHash` com o login por matrícula) | migration
Rate limit: ok. Nenhum limite é só por IP. O `rl:ip` anônimo é o teto de fora, e o limite dele para várias escolas atrás de um IP de saída só agora está declarado na §7c, com o `rl:ip:sala` previsto para o F2.
Fila e prioridade: ok. Não há fila. O hash de quem passa do teto da turma é rebaixado no balde da escola.
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível (as migrations 0018 a 0020 só expandem, e o rollback da 0018 está na §3)
Métrica e alerta: faltando. O runbook do alerta novo não consegue ir do `escolaId` ao slug (bloqueante 1).

**Correção da rodada 3: atendida**
- A §5, passo 4 (`techspec.md:84-87`), está certa. Qualquer uma destas falhas volta a transação atrás: FK violada, qualquer 23505 ou `update` sem linha. Depois, um comando novo relê a chave na escola e na turma do acesso, e a resposta nunca depende do nome da restrição.
- No Postgres, o segundo insert espera o primeiro terminar no índice único. Quando o primeiro faz commit, a releitura já enxerga a chave. Com isso a resposta ficou livre da ordem física dos índices.
- O C2 (c) (`cenarios.md:215-224`) prova isso sem depender da ordem. O índice da chave é recriado depois do índice do pendente, com o OID conferido, e um terceiro envio com outra chave recebe a recusa.
- O E21 cobre a mesma chave vinda pelo acesso de T2.
- O C11 e a trava da linha da turma (§3) atendem a minha recomendação.
- O reenvio no 503 segue o `Retry-After` com variação aleatória, até 3 vezes (§9).

**Bloqueantes**

1. **`docs/runbook.md:394-395`, seção "Código da turma errado em massa numa escola", "Primeiro olhar", junto com a §6 e a linha "Alerta" da §7c da Tech Spec: não existe caminho do `escolaId` do log até o slug.**
   - **O que está errado:** o runbook diz que "o painel da operação dá o endereço (slug) dela pelo id". O código mostra o contrário.
     - A tela Escolas (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx:117-121` e `:142-143`) mostra só o nome e `/e/{slug}`. O id aparece apenas como `key` do React.
     - A consulta do painel aceita só `pagina` e `ordem` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/painel.ts:182-184`), sem busca por id.
     - Nenhum `ops:*` traduz id em slug. O `ops:uso` recebe o id, mas imprime só o próprio id (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/uso.ts:90-93`).
     - Já o `ops:revogar-acessos-sala` recebe o slug (§6, E29).
   - **Consequência às 10h:** quem opera sozinho, com o alerta disparado, tem um UUID na mão e um comando que pede slug. O único jeito seria garimpar a resposta da API nas ferramentas do navegador, página por página, e isso não é passo de runbook. O alerta fica sem ação executável (regra 80, item 10), e o L11 só confere que a seção existe.
   - **Correção exigida, uma de duas:**
     - (a) O `ops:revogar-acessos-sala` aceita `--escola <uuid>`, o id que está no log, como o `ops:uso`. Ele continua pelo repository com escopo e sem `@SemEscopo`. O E29 ganha o caso do id inexistente, que responde `NAO_ENCONTRADO`, e o runbook passa a usar o id direto.
     - (b) A A1 entrega, com teste, um caminho do id ao slug: filtro por id no painel, ou um `ops:*` que imprime o slug a partir do id, com `OPERADOR` e auditoria. O runbook nomeia esse passo.
   - Qualquer que seja a escolha, o L11 passa a conferir que o comando citado no runbook aceita o que o log entrega.

**Recomendações**
- **§3 e C11:** escrever que o `for update` da turma é um comando próprio, antes do `delete` com o `not exists`. Um `DELETE ... WHERE NOT EXISTS` sozinho trava a linha, mas usa o retrato antigo, e o `cascade` leva junto o acesso que o gerar acabou de gravar. O C11 deveria controlar a intercalação, com o gerar segurando a transação aberta por uma barreira, como o C2 (b). Solto em paralelo, ele raramente fica vermelho sem a trava.
- **C2 (c):** recriar o índice num banco ou schema só desse teste, ou devolver a ordem no fim. Um DDL no banco de teste compartilhado pode segurar trava e deixar instáveis os testes que rodam junto.
- **Log `sala.limite_atingido`:** acima do teto da escola, cada tentativa gera uma linha. Com N IPs no teto do `rl:ip`, isso chega a milhares de linhas por minuto. Uma linha por escola e por janela basta para o runbook.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md` (linhas 375-415)
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md`

Nenhum arquivo foi editado.

## test-engineer · 4ª rodada · REPROVADO · 2026-09-26 02:29:49 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: REPROVADO

Cenários exigidos: os mesmos da rodada 3. São cada RF do PRD (RF1 a RF19) e os nove casos de borda do PRD §7. Entram também:
- as respostas iguais nas rotas públicas e no lote;
- a permissão por objeto em cada rota nova, com vínculo pendente, contestado e encerrado, e o professor com duas disciplinas;
- o isolamento da reivindicação, do lote e da leitura que decide o contador do nome;
- o I7 da A0b;
- as corridas em paralelo, e nesta rodada também excluir turma × gerar acesso;
- a virada de ano, a eliminação e o expurgo;
- os limites em que um ator só não trava a escola nem a turma;
- o alerta de força bruta distribuída;
- a anulação de `teve_matricula_errada` na decisão e no `encerrar`.

Cobertos:
- **Correção 1 (§5, passo 4), atendida no texto da spec.** Qualquer falha (FK, 23505, `update` sem linha) volta a transação atrás, e um comando novo relê a chave na escola e na turma. O nome da restrição não é lido (`techspec.md:82-87`).
- **C2 (c): dá para ativar, mas falta travar a ordem.** O Postgres confere os índices únicos na ordem do OID, e o índice da chave recriado com OID maior faz o 23505 sair no índice "um pendente por nome". O terceiro envio, com outra chave, cobre a mutação oposta ("todo 23505 vira `enviado`"). O que falta é o bloqueante 1.
- **Correção 2 (W9), atendida.** W9, W8 e §9 usam "Muitas tentativas agora. Espere N minutos ou chame o professor.". O "Quebra sem" é o texto sem "código novo", e o arredondamento e o singular também estão lá (`cenarios.md:367-376`, `techspec.md:170-172`).
- **Recomendações atendidas:**
  - E5, com a escola na consulta a `credencial_matricula`;
  - E21, com a chave pelo acesso de T2 e a turma no "Quebra sem";
  - I6, com T5 de outro ano, que só a cláusula do ano em curso segura;
  - C11, com a trava da linha da turma declarada na §3 (`techspec.md:33-34`);
  - I5 e I10, com a turma no "Quebra sem" e a escola e o ano como segunda camada.
- **`teve_matricula_errada`.** E30 prova a anulação na aprovação e na recusa e a auditoria sem o campo. V1 prova a anulação no `encerrar`. O check "só em pendente" da §3 faz uma anulação esquecida estourar também.
- **E23 e C1 estão coerentes com o insert antes do update.** O FK violado vai para a releitura e é provado pelo R2 (`listaNomeId` inexistente).

Bloqueantes:
1. **`cenarios.md:215-223` (C2, jeito (c)): nada força o segundo envio a passar pela leitura inicial antes de o primeiro gravar.**
   - O problema: "com a chave do primeiro já gravada" sugere uma ordem, mas o cenário não diz como obtê-la. Escrito em sequência, o segundo envio acha a chave na leitura antes dos limites (§5, passo 4) e responde `enviado` sem chegar ao insert.
   - As asserções (um pedido, duas respostas `enviado`, nenhuma recusa, contador parado) passam igual pelos dois caminhos. A mutação que o (c) existe para pegar, classificar pelo nome da restrição, fica verde.
   - Correção exigida:
     - O (c) roda com o controle de vez do (b), ou com um ponto de pausa entre a leitura inicial e a transação: o segundo envio lê a chave antes do commit do primeiro e faz o insert depois dele.
     - O teste afirma o caminho: um espião no repository vê o 23505 do índice "um pendente por nome" no segundo envio, seguido da releitura.
2. **`cenarios.md:212` (C1) contra `cenarios.md:268-270` (L6) e `techspec.md:88` (§5, passo 5): os dois cenários se contradizem.**
   - O problema: o C1 diz que "o perdedor não soma contador". O L6 e a §5 dizem que a corrida perdida roda o hash e soma um no teto da turma. Quem seguir o C1 ao pé da letra escreve um teste que fica vermelho contra o desenho, ou tira a contagem da turma que o L6 e o L6b exigem.
   - Correção exigida: no C1, "o perdedor não soma no contador do nome e soma um no da turma, como no L6".

Recomendações:
- **C2 (c), recriação do índice.** Fazer o `drop` e o `create` numa transação só, porque o DDL do Postgres é transacional. Pular a recriação quando o OID já estiver na ordem, porque o banco acumula entre execuções (regra 40). Assim nenhum outro arquivo de teste roda com a tabela sem o único, e um teste abortado não deixa o índice apagado.
- **C2, contador no (c).** Dizer que "nenhum contador muda" vale para os dois primeiros envios. O terceiro envio (nome tomado) soma um na turma, pelo L6.
- **E21, caso de T2.** Enviar com a matrícula certa do nome de T2, para a recusa vir só da chave. E declarar no L6 o que esse caso faz com os contadores.
  - Hoje o insert falha primeiro, o nome de T2 continua `livre`, e a leitura do §5, passo 5 soma no contador do nome como matrícula errada, embora ela esteja certa.
  - Ou aceitar isso por escrito, porque só acontece com chave reutilizada, ou comparar também a matrícula nessa leitura.
- **C11 e C4 dependem do acaso da corrida.** A ordem que mostra o defeito, com o gerar inserindo antes do `not exists` do `delete` e fazendo commit enquanto o `delete` espera, pode não acontecer com um `Promise.all` simples. Pôr um ponto de pausa no gerar depois do insert e antes do commit, ou repetir N vezes, para o "Quebra sem" falhar sempre que a trava sair.

Não editei nenhum arquivo. Li `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md` e `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md`, e conferi contra `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/revisao-spec.md` e `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/achados/revisao-spec.md`.

## infra-guardian · 5ª rodada · APROVADO · 2026-09-26 02:31:27 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: APROVADO

Caminho quente tocado: login, migration

Rate limit: ok

Fila e prioridade: ok

Concorrência: protegida

Índice e paginação: ok

Degradação de IA: não se aplica

Migration: compatível

Métrica e alerta: ok

Bloqueantes: nenhum. A correção da rodada 4 foi feita:
- A seção 6 da techspec (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md:104`) diz que o `ops:revogar-acessos-sala` recebe o id da escola, pelo repository com escopo e sem `@SemEscopo` novo.
- O runbook (`/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:388-396`) manda tirar o `escolaId` da linha `sala.limite_atingido` e usa `--escola <escolaId do log>`. O caminho do alerta até o comando agora fecha: o L2 (`cenarios.md:263`) garante que a escola está no log, e o L11 (`cenarios.md:295-300`) quebra se o comando não aceitar o que o log entrega.
- O E29 (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md:176-180`) cobre o que foi pedido: a escola B fica intacta, a segunda execução é idempotente, o id inexistente dá `NAO_ENCONTRADO` e o comando recusa sem `OPERADOR`.
- As duas recomendações da rodada anterior também entraram. O C11 (`cenarios.md:249-254`) tem o ponto de pausa e o `for update` como comando próprio, e o C4 usa o mesmo mecanismo. O C2 (c) (`cenarios.md:215-228`) recria o índice numa transação só, pulando quando o OID já está na ordem, e conta o terceiro envio.

Recomendações:
- O E29 manda o id que não é UUID para `NAO_ENCONTRADO`. Os comandos que já existem (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/revogar-convite.ts:27-31`) tratam argumento malformado como `ArgumentoInvalido`, com saída 2. Vale escolher um dos dois padrões e escrever no E29, para a tarefa não precisar decidir.
- A seção 6 diz "pelo repository com escopo", mas não diz como o comando monta o contexto da escola a partir do argumento, já que não há token. Uma linha na techspec apontando o mecanismo, igual ao dos outros `ops:*`, evita que a tarefa invente um caminho paralelo ao `exigirEscolaDoContexto`.
- O L2 diz "com a escola no log". Nomear ali o campo `escolaId`, como o L11 faz, deixa os dois cenários conferindo a mesma chave.

## test-engineer · 5ª rodada · APROVADO · 2026-09-26 02:33:02 · `tasks/prd-apresentacao-escola/revisao-spec.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da rodada 4.
- Cada RF do PRD (RF1 a RF19) e os nove casos de borda do PRD §7.
- Respostas iguais nas rotas públicas e no lote.
- Permissão por objeto em cada rota nova: vínculo pendente, contestado e encerrado, e o professor com duas disciplinas na turma.
- Isolamento da reivindicação, do lote e da leitura que decide o contador do nome.
- O I7 herdado da A0b.
- Corridas em paralelo, com excluir turma × gerar acesso.
- Virada de ano, eliminação e expurgo.
- Limites em que um ator só não trava a escola nem a turma.
- Alerta de força bruta distribuída, com o comando que o runbook cita executável a partir do log.
- Anulação de `teve_matricula_errada` na decisão e no `encerrar`.

Cobertos:
- **Correção 1, C2 (c), atendida** (`cenarios.md:215-228`).
  - O ponto de pausa fica entre a leitura inicial da chave e a transação. O segundo envio lê a chave antes do commit do primeiro e faz o `insert` depois dele. Com isso, ele não sai pela leitura inicial e cai no 23505 do índice "um pendente por nome".
  - O índice da chave recriado com OID maior garante qual índice o Postgres confere primeiro. O espião confirma o caminho: o 23505 do "um pendente por nome" e depois a releitura.
  - As mutações ficam vermelhas:
    - classificar pelo nome da restrição dá recusa no segundo envio;
    - "todo 23505 vira `enviado`" é pego pelo terceiro envio;
    - reler sem a turma é pego pelo E21.
  - Recriar o índice numa transação só, e pular quando o OID já está na ordem, resolve o DDL no banco compartilhado.
  - Contadores: os dois primeiros envios não mudam nada, e o terceiro soma um na turma. Bate com o L6 e com a §5, passos 4 e 5.
- **Correção 2, C1, atendida** (`cenarios.md:211-214`). O perdedor não soma no contador do nome e soma um no da turma. Bate com o L6 (`:276-280`) e com a §5, passo 5 (`techspec.md:88-89`). O "Quebra sem" cobre a condição `livre` e o 23505 levado à releitura.
- **E29** (`:176-181`):
  - usa `--escola <id>`, pelo repository com escopo e sem `@SemEscopo` novo;
  - id inexistente e id que não é UUID dão `NAO_ENCONTRADO`; o segundo pega o erro cru de UUID inválido;
  - sem `OPERADOR`, recusa antes de tocar no banco;
  - "não toca nos de B" deixa vermelha a mutação da escola do contexto;
  - bate com a §6 (`techspec.md:104`) e com o `docs/runbook.md:396`.
- **L11** (`:295-300`) passa a conferir que o comando recebe o `escolaId`, o campo do log.
- **C11 e C4** ganharam ponto de pausa. No C11, o `for update` virou comando próprio antes do `delete` com `not exists`. Com a pausa no gerar depois do `insert`, tirar esse `for update` faz o `cascade` levar o acesso já respondido com 201, e o teste fica vermelho.
- Checagens gerais: nenhum `.skip`, nenhum mock de coisa nossa escondendo a regra, e as corridas continuam com chamadas em paralelo. Não há IA nesta spec.

Bloqueantes: nenhum.

Recomendações:
1. **C11, "Quebra sem"** (`cenarios.md:253-254`): tirar só o `for share` do gerar não deixa o teste vermelho.
   - Com a pausa depois do `insert`, a checagem da FK já segura a linha da turma com `FOR KEY SHARE`, e isso conflita com o `for update` do excluir.
   - O "Quebra sem" deveria dizer só "o `for update`, comando próprio, no excluir".
   - Outra saída: um segundo arranjo, com a pausa no excluir depois do `delete` e antes do commit. Ele prova o outro lado: o gerar recebe `NAO_ENCONTRADO`, e não um 5xx vindo de um 23503 sem mapeamento. Hoje o "nunca 5xx" desse lado depende do acaso.
2. **C11 e C4, quando soltar a pausa:** só depois que o `pg_stat_activity` mostrar a outra transação esperando trava (`wait_event_type = 'Lock'`). Se a pausa sair cedo, a corrida vira sequência e o "Quebra sem" continua verde. Nas duas mutações, a outra transação chega a esperar trava, então essa espera é a sincronização certa.
3. **C4, onde fica a pausa** (`:233-235`): "como no C11" deixa o ponto em aberto. Nomear assim: a reivindicação fica parada depois do `update` da `lista_nome` e antes do commit, enquanto o retirar corre. Declarar também que a mutação a pegar é "verifica e depois apaga" (`select` em `livre`, depois `delete` só pelo id), a regra 80, item 7.
4. **C2 (c), recriação do índice:** usar o `indexdef` de `pg_indexes`, com o mesmo nome e o mesmo predicado parcial. Assim o teste de arquitetura, que confere o DDL, e os outros testes não enxergam um índice diferente do da migration.
5. **L11, como provar "o comando aceita o que o log entrega":** chamar o leitor de argumentos do `ops:revogar-acessos-sala` com um UUID, e ler o nome do campo pela constante do evento `sala.limite_atingido`. Só casar texto no runbook não fica vermelho se o comando voltar a pedir o slug.
6. Continuam abertas da rodada 4:
   - E21 (`:154-160`): usar a matrícula certa do nome de T2 e declarar no L6 o efeito nos contadores. Hoje a leitura da §5, passo 5, soma essa recusa no contador do nome como matrícula errada.
   - A4 (`:318-319`): pôr o IP na lista do que o log não pode ter (`privacy-guardian`).
   - Log `sala.limite_atingido`: uma linha por escola e por janela (`infra-guardian`).

Não editei nenhum arquivo. Li estes arquivos:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/revisao-spec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/achados/revisao-spec.md` (bloco da rodada 4)
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md` (seção "Código da turma errado em massa numa escola")

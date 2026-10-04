# TODO fora do código

O que trava o projeto e não se resolve programando. Vários têm prazo externo.

## LGPD e conformidade — prioridade máxima

- [ ] Contrato de tratamento de dados escola↔nós, com advogado (escola controladora)
- [ ] Contrato com provedor de IA vedando treinamento com nosso dado
- [ ] Política de privacidade e termos, com seção de menor de idade
- [ ] Indicar encarregado (DPO) e publicar canal de contato
- [ ] Relatório de impacto (RIPD) — dado de menor, volume alto, IA no fluxo
- [ ] Definir prazos de retenção com uma escola real (varia por rede)
- [ ] O pedido do titular (acesso e portabilidade, F3, `ciclo-de-vida.service.ts`) cobre também a `lista_nome` e a
      `reivindicacao` da A1, para a pergunta de fechamento da regra 20 continuar respondida por código: o pedido se liga
      ao aluno por `lista_nome_id` enquanto a linha da lista existe, e depois do `set null` já não se liga a ninguém
      (`privacy-guardian` na 6.0)
- [ ] O expurgo dos pedidos de reivindicação decididos (e dos fechados como `encerrada` na virada do ano) depois de
      "vigência + 5 anos" (`docs/lgpd.md`, linha "Reivindicação"): na A1 nenhuma rotina os apaga, e eles ficam, sem nome
      nem segredo, até a eliminação do aluno aprovado ou uma rotina nova. Entra no F3, com a retenção configurável por
      escola (regra 20, item 16), no `sistema.expurgar-acesso` ou numa rotina própria (A1, tarefa 10.0)
- [ ] Escrever e ensaiar o processo de incidente
- [ ] Parecer sobre o ECA Digital (Lei 15.211/2025) para plataforma contratada pela escola,
      com a avaliação de impacto que ele exige. Três perguntas precisam sair dele, nomeadas:
      **(a)** o art. 24 alcança serviço educacional contratado pela escola? Se sim, conta de
      aluno de até 16 anos precisa estar vinculada à de um responsável legal, e o portal da
      família sai da fase posterior (**bloqueia o PRD do F9**, `docs/regulacao.md` 2.2);
      **(b)** como os arts. 17 e 18 (supervisão parental) se modulam pelo art. 39 no nosso
      caso; **(c)** a aferição de idade pela série informada pela escola basta, com o art. 24
      do Decreto 12.880 como fundamento de proporcionalidade? **(d)** ligar a busca do Tutor em
      fontes aprovadas para aluno de até 16 anos, sem conta de responsável vinculada, conta
      como rebaixar a proteção (art. 24, § 5º; D68)? **(e)** a contagem de saídas da aba
      durante avaliação é proporcional, e algo parecido pode existir fora de avaliação (D70)?
- [ ] **Avaliação de Impacto Algorítmico** escrita para cada funcionalidade de alto risco —
      Tutor, correção de objetiva, diagnóstico por habilidade, sinais e alertas, adaptação —
      no roteiro de seis etapas de `docs/conformidade-mec.md` seção 7 (D60). Cada uma antes do
      PRD da sua funcionalidade, não no F16. Ficam em `docs/aia/` (índice no `README.md` de
      lá); o Joaquim escreve o rascunho da etapa 1 e o Gabriel revisa
- [ ] **Dossiê de conformidade** da escola (D61): declaração de propósito com faixas etárias,
      funcionamento em linguagem simples com fluxograma, conformidade LGPD e ECA artigo por
      artigo, RIPD, AIA, relatório de uso legível, material de comunicação com a comunidade
- [ ] **Aviso de privacidade em linguagem de faixa etária**, para aluno de 11 anos (exigido
      pelo art. 16 do ECA Digital e pelas cláusulas sugeridas pelo MEC). Não existe hoje
- [ ] Cláusulas do contrato com a escola que o MEC sugere e que ainda não temos:
      responsabilização por incidente, alerta em tempo real ao supervisor quando conteúdo
      proibido for gerado, teste de segurança antes de atualização
      (`docs/conformidade-mec.md` seção 6)
- [ ] Base legal da conversa do tutor e dos sinais, na particular e na pública (Enunciado
      CD/ANPD 1/2023; teste de balanceamento se for legítimo interesse)
- [ ] Indicadores de professor com advogado: CLT, convenção coletiva de cada sindicato
      (SINPRONORTE lida, sem cláusula sobre IA) e estatuto do servidor na rede pública (D45)
- [ ] Contrato com a escola: responsabilidade civil por resposta errada do tutor e direito
      de regresso
- [ ] Protocolo de risco à vida com a escola: quem notifica o Conselho Tutelar (Lei
      13.819/2019, Lei 15.231/2025) e como o sinal chega a essa pessoa
- [x] ~~Decidir região de hospedagem~~ — Brasil (D28)

- [ ] **A lista de nomes colada pela coordenação** (`privacy-guardian` e `revisor-geral`, 13.0 da A1), antes de qualquer
      dado real, a levar para o `/validar` da A1:
      - [x] ~~CPF sem pontuação passa pela trava da prévia~~ — a lista com mais da metade das matrículas, e pelo menos
        duas, em 11 algarismos com dígito verificador de CPF válido tem essas linhas recusadas pela API; o avulso
        sozinho passa (correção `2026-10-03-trava-de-documento-so-na-tela`)
      - colunas a mais (nascimento, CPF, telefone numa exportação da secretaria) trafegam no corpo da prévia e da
        gravação, sem serem gravadas nem logadas: a tela avisar, ou recortar para nome e matrícula antes de enviar
      - a sessão que vence com a lista colada na tela: hoje o texto e a prévia somem porque a consulta da turma volta a
        pendente (seguro para a pessoa seguinte, e o rascunho de quem volta se perde). Decidir se o rascunho sobrevive
        para a mesma pessoa, e ter um e2e do caso "outra pessoa" (nenhum nome nem matrícula atrás do login por cima)
      - [x] ~~a trava de CPF ou data existe só na tela~~ — a regra foi para o contrato
        (`packages/shared/src/estrutura/documento-na-matricula.ts`), e a API recusa na prévia
        (`matricula_parece_documento`), na gravação da lista e no avulso (`ENTRADA_INVALIDA`) (correção
        `2026-10-03-trava-de-documento-so-na-tela`, G2). A saída para o falso positivo segue no item abaixo, e no
        servidor ela pesa mais
      - a trava de documento não tem saída para falso positivo: a escola cuja matrícula tenha forma de data
        (`2026-02-01`, `1/2/26`) não consegue gravar, nem pela lista nem pelo avulso, e o texto não diz o que fazer; a
        recusa agora é da API, e nenhum cliente contorna. Perguntar o formato da matrícula nas entrevistas do piloto. Junto, o motivo de não
        gravar diz "a segunda coluna" mesmo com uma linha só; "enquanto houver matrícula que pareça CPF ou data de
        nascimento" serve aos dois (`frontend-reviewer`, correção `2026-10-03-trava-de-documento-so-na-tela`)
      - o CPF que o Excel exporta como número perde o zero à esquerda (`012.345.678-90` vira `1234567890`, 10
        algarismos), e `pareceCpfSemPontuacao` não o reconhece: na coluna inteira de CPF a lista já é recusada pelas
        outras linhas, mas, se a coordenação apagar só as marcadas, as de 10 algarismos ficam abaixo da maioria e gravam.
        Completar com zeros à esquerda antes de conferir o dígito, com o falso positivo medido (`test-engineer` da
        correção `2026-10-03-trava-de-documento-so-na-tela`)
      - e2e da coluna com maioria de CPF sem pontuação na tela (`test-engineer` e `frontend-reviewer` da mesma
        correção): hoje provada na integração e na unidade da web; o job de e2e está perto do teto de 45 min, e o caso
        entra quando o e2e da lista for dividido
      - `Cache-Control: no-store` nas respostas nominais da API (`/retro` da A1, registrado no `2_task.md`): a web já
        pede sem cache (`cache: 'no-store'` no `chamarApi`, 13.0); falta o cabeçalho, para qualquer outro cliente

## Infra e operação

- [ ] `lista_nome`: índice parcial `(escola_id, usuario_id) where usuario_id is not null`, para a busca da eliminação do
      aluno aprovado (`CicloDeVidaRepository.apagarDaListaDeNomes`) e a FK do `usuario_id` no `delete` do usuário; hoje as
      duas percorrem a lista da escola pelo prefixo de `lista_nome_turma_idx`. Na próxima migration de `lista_nome`
      (`infra-guardian` da 10.0 da A1)
- [ ] Expurgo do `acesso_turma` e do `convite`: `order by least(...)` sem índice; se o "Gerar novo" virar rotina diária por
      turma, um índice de expressão pelo prazo (`infra-guardian` da 10.0 da A1)
- [ ] Encerrar o ano segura, durante a virada, a sala da escola inteira (reivindicação, decisão, lista e acesso esperam o
      `FOR SHARE` do ano): uma linha no runbook e o aviso na tela de Estrutura (13.0) de não encerrar em horário de aula, e a
      duração da virada num log só com contagens (`infra-guardian` da 10.0 da A1)
- [ ] **Índice da lista de professores**: `GET /v1/professores` (A1, 3.0) pagina `usuario` pelo índice `(escola_id, id)` e
      descarta quem não é `professor`: cada página pode ler todos os usuários da escola, alunos inclusive. Barato hoje
      (rota rara, só da coordenação, escola de mil usuários). Com escolas maiores, um índice parcial `(escola_id, id) where
      papel = 'professor'`, conferido com `EXPLAIN` sobre o seed de uma escola grande (`infra-guardian` da 3.0)
- [ ] **Eliminar escola apaga também o resto de uso dela**: a pasta vazia `escolas/<id>/` (o SeaweedFS só a tira da listagem
      com o `DeleteObject` da própria pasta) e os contadores `uso:*:<id>:*` do Redis de fila. Hoje a consolidação pula e conta
      essa escola toda noite como `escola_inexistente` (correção `2026-09-25-consolidacao-para-na-escola-inexistente`), e o
      sinal fica misturado com o caso que o runbook manda investigar (banco errado, restauração pela metade). Desde a correção
      `2026-09-25-acabamento-da-a0b`, se todas as escolas encontradas numa noite forem eliminadas (uma noite sem requisição
      de escola nenhuma basta), o resto de uso também derruba o job (`uso.nenhuma_escola_no_banco`). Vai na spec da
      eliminação (`privacy-guardian` e `infra-guardian` da correção)
- [ ] Alerta para muitos `login.externo{resultado="provedor"}` (erro, prazo ou discovery do Google ou da Microsoft), com linha no runbook: hoje a métrica existe, mas nada avisa quando o login pela conta da escola começa a falhar em massa (revisão da 13.0)
- [ ] Login pela Microsoft: passar a exigir a claim `xms_edov` (e-mail de domínio verificado) para ligar professor pelo e-mail. Hoje o e-mail vale como verificado porque o tenant já foi conferido, como a Tech Spec define; com a claim, um administrador do tenant da escola não consegue pôr o e-mail de outra professora num usuário e ligá-lo à conta dela (revisão da 13.0)

- [ ] **Reescrever o passo de `docs/runbook.md:276`, que é impossível de seguir.** Ele manda "olhe a
      borda (`docker compose logs --since 10m borda`)" para descobrir de onde vem uma varredura de
      endereço de escola — mas o log da borda não tem, e **por desenho não pode ter**, IP nem URL de
      requisição (regra 20, item 9; `infra/Caddyfile` exclui `http.log.access`, `http.log.error`,
      `reverse_proxy` e `admin.api`). Quem opera chega num beco. O conserto é dizer onde a informação
      está de verdade (o registro de acesso da aplicação, `docs/lgpd.md:76`), **nunca** religar log de
      requisição na borda. Achado pelo `infra-guardian` na correção
      `2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container`

- [ ] **`infra/scripts/ensaio-alertas.ts:404` recria `api-1` e `api-2` com `--force-recreate`**, e as duas
      publicam porta (`infra/compose.yml:197,211`). É a mesma classe da corrida de porta corrigida em
      22/09/2026 (`tasks/correcoes/2026-09-22-corrida-de-porta-na-observabilidade.md`), e o que segura o
      item é só isto: **não há vermelho medido** ali. Nenhuma atenuante de desenho o distingue — o
      `up --force-recreate` do ensaio sobe o novo sem esperar o anterior soltar a porta, exatamente como
      o que foi consertado. Se aparecer, o conserto é o mesmo `recriarDoZero` de
      `tools/testes/compose.ts`, com um invólucro para a assinatura do ensaio, que leva a sobreposição
      de ambiente na frente (`(...argumentos) => composeCom(sobreposicao, ...argumentos)`). Apontado
      pelo `test-engineer` na correção

- [ ] **Recontar o número de linhas do docstring de `tools/ci/compose.ts`** quando a correção do
      `--tail` for aberta. Ele diz que os cinco logs de terceiro truncados somam 149.322 linhas; com o
      ruído do `admin.api` fora, cai para algo em torno de 115 mil — mas isso é **subtração, não
      medição**, e o `infra-guardian` exigiu recontagem numa execução real antes de mexer na régua

- [ ] Pôr `--timestamps` no despejo de log de `infra/scripts/carga.ts:304` e
      `infra/scripts/carga-login.ts:444`, que ainda usam `logs --no-color --tail 100`. É o mesmo
      defeito da correção `2026-09-21-log-da-falha-sem-carimbo-de-hora`, que consertou só os dois
      scripts da esteira; o padrão certo já existia no despejo de
      `aguardarSaudavel` (`tools/testes/compose.ts`). Sem carimbo
      uniforme, o log de um ensaio de carga não cruza com o instante do que falhou

- [ ] **Job `infra` da esteira perto do teto, sem guarda.** Leva de 29 a 30 min desde `3aeec3b` (tarefa 9.0 da A1),
      contra 22 a 23 min antes (30 min na execução 37001095812, do commit `241ba1c`); o teto é de 45 min e nenhuma
      guarda liga o tamanho da suíte a ele, como a de `tools/ci/esteira.test.ts` passou a fazer com o e2e. E os
      comentários que dizem quanto ele leva venceram: "uns 11 min" e "uns 16 min" em `.github/workflows/ci.yml:54-55`,
      e "uns 16 min" em `vitest.config.ts:7`, `README.md:60` e `.claude/rules/40-testes.md:102`. Na mesma correção, a
      frase do `docs/runbook.md` ("Esteira vermelha no e2e") que diz que a guarda do teto "reprova no portão local":
      está certa e incompleta, porque o teste é de unidade e reprova também no job `verificar` (`test-engineer` e
      `infra-guardian` da correção `2026-10-02-teto-do-e2e-na-esteira`). Destino: correção própria por `/corrigir`,
      antes da próxima tarefa que acrescentar teste com espera de relógio em `infra/**/*.int.test.ts`

**Ao ligar HTTPS na borda do staging, as quatro coisas abaixo são da mesma tarefa.** Estão separadas
porque item único vira execução parcial. Motivo e medição de cada uma em
`tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`, seção "O que fica
para o staging".

- [ ] Acrescentar **`http.stdlib`** ao `exclude` do `log default` em `infra/Caddyfile`. É o único vetor
      restante de endereço de cliente no log da borda, e ele vai **dentro do `msg`**
      (`"http: TLS handshake error from <ip>:<porta>"`), sem chave — cego às negativas por nome **e** à
      negativa por forma. Em HTTP/1 sem TLS não dispara (medido); com TLS, dispara. E no staging o log
      do Docker vai para o Alloy e o Grafana Cloud (`notas-staging.md:53,55`), o que torna a linha dado
      retido e pesquisável. **Não** excluir o logger pai `http` no lugar dele: a exclusão por prefixo
      não arrasta filho (medido com `admin`/`admin.api`), e excluir `http` seria pior
- [ ] **Converter** a negativa por forma de `infra/test/borda.int.test.ts` em asserção **positiva**
      sobre os campos que o log de acesso passa a guardar. Apagá-la reabre a família de cinco
      armadilhas que a correção fechou
- [ ] Somar **`user_id`** e **`resp_headers`** à lista de chaves proibidas nesse momento. A âncora atual
      (`"(remote_ip|...)":`) não pega `resp_headers`, porque exige que o grupo comece logo depois da aspa
- [ ] Trocar o guarda de texto de `tools/ci/borda.test.ts` por um `toEqual` sobre `logging.logs` do
      `caddy adapt`, que é imune à formatação do arquivo (espaço, tabulação, coluna 0, CRLF, bloco
      aninhado) e mostra a configuração **efetiva** — inclusive o `health_checker` que o próprio Caddy
      acrescenta ao `exclude`. Roda em `test:infra`, não no portão rápido: custa o binário do Caddy

- [ ] Escolher provedor de hospedagem em região Brasil, com Postgres + pgvector, Redis e
      storage S3 gerenciados (D26, D28), quando for criar o staging (D31, D42). O Redis do staging
      precisa ser gerenciado **na mesma região**: com o corte de 100 ms do cliente do login, o
      staging passou a ser o único ensaio desse corte fora de produção (`infra-guardian`)
- [ ] **Bloqueio de IP na borda contra ataque ao código da turma** (A1): na A1 não existe, e a resposta é revogar os
      acessos da escola (`docs/runbook.md`, "Código da turma errado em massa numa escola"). Entra com o staging e o
      provedor (D42), com finalidade e prazo de remoção no `docs/lgpd.md` antes do primeiro uso, na regra do provedor
      e nunca em arquivo versionado (o repositório é público), sem ler as chaves `rl:ip` à mão (`privacy-guardian`)
- [ ] **Valores que o staging e a produção não herdam do `.env.example`**, e que fazem o boot falhar
      de propósito se forem copiados. Hoje são três, e a lista é executável em `apps/api/src/config.test.ts`
      ("o .env.example não sobe em produção"), que falha quando outra variável entra na mesma classe:
      `LOGIN_REDIS_PRAZO_MS` (no máximo 100; o exemplo tem 2000, que só vale em `local`) e os dois
      emissores do login pela conta da escola, `LOGIN_EXTERNO_GOOGLE_EMISSOR` e
      `LOGIN_EXTERNO_MICROSOFT_EMISSOR`, que apontam para o `oidc-falso` em http e precisam de https.
      Em produção soma a quarta, `ROTAS_SINTETICAS`, que o exemplo deixa ligada.
      **A lista é do que o boot recusa, e é a parte fácil.** A perigosa é o que ele *aceita*:
      `IDENTIDADE_CHAVE_ASSINATURA`, `LOGIN_CHAVE_CONTADOR`, `IDENTIDADE_CHAVE_CIFRA_V1` e os segredos
      do login externo têm 32+ caracteres e sobem em produção sem reclamar, sintéticos como estão. A
      lista de criação do staging precisa das duas metades (`test-engineer`).
      E, sob pressão, a saída errada é baixar o `AMBIENTE` para `local`, que destravaria junto
      `LOGIN_PROTECAO_DESLIGADA` e `ROTAS_SINTETICAS`: escrever isso na lista antes de alguém
      precisar dela (`infra-guardian`)
- [ ] Tirar `MONTAGEM_DE_TESTE.prazoDoRedisDeLoginMs`, que ficou quase redundante com
      `LOGIN_REDIS_PRAZO_MS`: os dois valem 2 s no compose de teste, e por isso a precedência do `??`
      em `sessao.module.ts` não tem teste que a prove. São sete arquivos de teste, mecânicos — era
      limpeza fora do escopo da correção de 22/09 (`test-engineer`, rodadas 3 e 4)
- [ ] Contrato com provedor de modelo: **garante processamento no Brasil para conversa de
      aluno** (D62), veda treinamento, permite serviço usado por menor,
      limite de tokens por minuto compatível com o pico (~1,5 mi/min em 10 escolas pela
      estimativa do `docs/infra.md`; a análise de 13/09/2026 chegou a ~2,8 mi com premissa
      mais realista), e região de processamento (D29)
- [ ] Provedor de modelo de reserva configurado e testado
- [ ] Antes da primeira escola real: alerta para rotina do sistema que parou de rodar
      (`sistema.consolidar-uso`, `sistema.expurgar-jobs`, `sistema.expurgar-acesso` da 17.0), por exemplo métrica com o horário do
      último sucesso e regra `time() - x > 26h`, com entrada no `docs/runbook.md` (pendência da 11.0
      registrada na 13.0; dono: Joaquim). Precisa pegar também a rotina que roda e falha: a consolidação falha com
      `uso.nenhuma_escola_no_banco` quando o worker aponta para o banco errado (correção `2026-09-25-acabamento-da-a0b`),
      e hoje isso só aparece em `job_registro`
- [ ] Rodar a avaliação de `docs/avaliacao-de-modelos.md` com Maritaca e Gemini (D37)
- [ ] Perguntar à Maritaca, por escrito, se o contrato cobre dado de aluno menor de idade e
      se garante processamento só no Brasil (o DPA de agosto/2026 lista Brasil, EUA e UE)
- [ ] Verificar os termos do Vertex AI para serviço usado por menor e se processa em São
      Paulo (a Gemini API do AI Studio veda esse uso)
- [ ] Com contador: tributo sobre IA faturada do exterior contra faturamento local, e regime
      tributário (Simples com fator R, Lucro Presumido, CBS de 2027)
- [ ] Levantar a região de processamento dos provedores e se a rede pública aceita
      transferência internacional de dado minimizado
- [ ] Escolher ferramenta de observabilidade e de alerta no celular (região Brasil ou
      hospedada por nós)
- [ ] Levantar com a escola piloto: horário letivo real, banda da rede, se há proxy ou
      filtro de conteúdo que bloqueie WebSocket
- [ ] Antes do piloto: canal e texto para avisar as escolas de incidente
      (`docs/runbook.md:198`, pendência da validação do F0)
- [ ] Validar a FK de `escola_id` das tabelas do F0, numa migration de deploy fora do horário
      letivo (regra 80, item 9). A migration 0006 acrescentou as três restrições `NOT VALID`:
      elas já barram escrita nova, mas as linhas anteriores ao F1 nunca foram conferidas.
      Antes de rodar, esta consulta precisa dar zero em cada tabela:

      ```sql
      select 'job_registro' as tabela, count(*) from job_registro j
        where j.escola_id is not null and not exists (select 1 from escola e where e.id = j.escola_id)
      union all select 'configuracao_operacional_escola', count(*) from configuracao_operacional_escola c
        where not exists (select 1 from escola e where e.id = c.escola_id)
      union all select 'uso_infra_diario', count(*) from uso_infra_diario u
        where not exists (select 1 from escola e where e.id = u.escola_id);
      ```

      Com zero, a migration é `ALTER TABLE <tabela> VALIDATE CONSTRAINT <nome>_escola_id_escola_id_fk`
      nas três, uma por vez (dono: Joaquim)

- [x] **A página pública da sala só com a 7.0 junto** (A1, tarefa 5.0; `infra-guardian` e `privacy-guardian`). Feito na
      7.0: o contador de código errado por escola com a espera de 1 s, o de matrícula errada por nome e o de hash sem pedido
      por turma (`apps/api/src/sala/limites-da-sala.ts`). O alerta e o comando de revogar ficam na 9.0. Até a
      7.0, a busca pelo código em `salas/abrir` só tem o `rl:ip` anônimo, e quem sabe o slug de uma escola pode tentar
      códigos de vários IPs para listar os nomes livres. Nenhum staging exposto nem dado real sem o contador de código
      errado por escola e a espera de 1 s da 7.0 (dono: Joaquim, no portão do staging). O mesmo vale para
      `salas/reivindicar` (6.0): até o contador por nome da 7.0, quem tem um código válido pode tentar matrículas num
      nome livre, e cada tentativa só custa um hash, segurado pelo `rl:ip` e pela vez da escola no semáforo
      (`infra-guardian` e `privacy-guardian` na 6.0)
- [ ] **`rl:ip:sala` próprio** (Tech Spec da A1, 7c; `infra-guardian` na 5.0): `salas/abrir` divide o `rl:ip` anônimo
      com as outras rotas anônimas, e a folga (cerca de 1.300/min contra 3.000/min) vale para uma escola. Gatilho: rede
      com várias escolas atrás do mesmo IP de saída, ou o F2, o que vier antes (dono: Joaquim)
- [ ] **Prender o `AcessoDaSala` ao `sala` no teste de arquitetura** (`privacy-guardian` na 5.0): ele sai do
      `SessaoModule` global, e só o `SalaModule` deve injetá-lo, porque abre contexto de escola sem usuário. A 5.0
      exigia o `arquitetura.test.ts` sem mudar; a asserção entra na próxima tarefa que tocar o teste, e prende também o
      `anoLetivoId` de `naEscolaSemUsuario` a `sessao/acesso-da-sala.ts`, o único caminho que põe o ano no contexto sem
      usuário (`privacy-guardian`, 2ª rodada) (dono: Joaquim)

## Processo e dívida do F0

- [ ] **Quando o F1 fechar: criar `release` e `develop`** (D23 revista). Ordem combinada: o
      branch de documentação entra no `main` quando o Joaquim avisar, depois `main` → `release`
      e `release` → `develop`. Atenção: o `docs/direcionamento-regulatorio` já conflita com a
      tarefa 17.0 em `docs/lgpd.md`, e o conflito precisa ser resolvido nesse merge
- [ ] **Ajustar o processo à D23 revista** (dono: Joaquim): a esteira do GitHub só roda no push
      do `main` (`.github/workflows`), e precisa rodar em `develop`, `release` e nos PRs; o hook
      de commit, o `/executar-task`, o `/corrigir` e a regra 40 ainda descrevem commit direto no
      `main` e esteira verde antes da tarefa seguinte; definir de qual branch sai o staging
- [x] ~~MVP de apresentação (D71): aceitar ou recusar os três afrouxamentos~~ — aceitos em
      23/09/2026 (D71 revista)
- [ ] **AIAs do MVP:** escrever a etapa 1 das AIAs de correção, diagnóstico, Tutor e sinais antes
      dos PRDs da A3, da A4 e da A5 (`docs/aia/`). A A1 e a A2 não têm função de alto risco além
      da adaptação, cuja etapa 1 entra antes do PRD da A2
- [x] ~~Ratificar ou recusar as D55 a D71~~ — ratificadas em bloco pelo Joaquim em 23/09/2026,
      com as revisões da D1, D17, D23, D32, D45 e D60
- [ ] **Avisar o Gabriel do que foi decidido em 23/09/2026:** a pele é uma só, a do ChatGPT, e
      Ferramentas e Turmas deixam a pele da Teachy (D72); três agentes (D32 revista); a A1 é a
      escola montada pela coordenação, sem seed (D71 revista); o material entra pela coordenação
      (D75). O mockup pode seguir com a pele da Teachy como estudo, mas o produto não

Pendências herdadas da validação do F0 (`tasks/prd-fundacao-tecnica/validacao.md`, seção 6
das rodadas 1 e 2). Os itens que valem para funcionalidade futura ficam lá e são lidos pelo
`/criar-techspec` dela.

- [x] ~~Conferência da esteira com `headSha` igual ao `origin/main` e só `success`~~ —
      passo 7 de `executar-task`, com regra para `cancelled`, execução não registrada e
      commit sem push (menor 1 da rodada 2)
- [x] ~~`npm ci` quando o lock é mais novo que o `node_modules`~~ — passo 4 de
      `executar-task` e portão do `validador` (menor 4 da rodada 2)
- [ ] Hook que recusa commit `(tarefa N.0)` quando a última execução da esteira no
      `origin/main` não for `success`, como o hook das revisões, com saída clara sem `gh`
      (menor 3 da rodada 2)
- [ ] `tasks/prd-fundacao-tecnica/prd.md:94`: trocar a borda para "a próxima tarefa não
      commita antes de a esteira do commit anterior ficar verde" (menor 2 da rodada 2)
- [ ] `docs/infra.md:211`: apontar a janela do lote não urgente para a Tech Spec do F0,
      seção 5, passo 2, com o padrão segunda a sexta, 7h às 18h, configurável por escola
      (menor 5 da rodada 2)
- [ ] Decidir os achados da auditoria da 16.0 fora do escopo: renovação da vaga durante o
      recuo, devolução do ponto no limitador, despachante serial (`16_task.md`)
- [ ] Descobrir por que o controle negativo do cenário de carga parou de reprovar. Em
      16/09/2026, em duas execuções seguidas, `npm run carga:controle-negativo` **não reprovou**:
      sem a vaga por escola, a espera da escola B ficou em 84 ms e 125 ms, contra o limiar de
      base + 500 ms. Em 14/09/2026 ele reprovava, com a B em p95 2,53 s contra 507 ms
      (`tasks/prd-fundacao-tecnica/15_task.md`, validação da 15.0). Não é a máquina ter ficado
      folgada por acaso: entre as duas medições entrou o commit `364049c`
      (`UV_THREADPOOL_SIZE=16` e `dns_opt` em api, realtime, despachante e worker), e na mesma
      comparação a espera dos interativos da própria A caiu de p95 10,3 s para 6,1 s — a vazão
      do worker subiu. A validação do F0 registra o mesmo na rodada dela
      (`tasks/prd-fundacao-tecnica/validacao.md`, RF18: controle negativo com `espera_b`
      p95 2,63 s), ou seja, são vinte vezes mais que agora. A pergunta a responder primeiro não
      é qual limiar mexer, e sim **por que a carga da escola A deixou de saturar o worker** — se
      ela não satura mais, o `npm run carga` verde também prova menos do que diz. Primeiro passo:
      repetir o cenário com o `UV_THREADPOOL_SIZE` de antes, para confirmar ou descartar essa
      causa; só depois decidir se o que muda é o cenário, o limiar ou a CPU de
      `infra/compose.carga.yml`. Enquanto isso, o controle negativo não está controlando nada.
      A regra 80, item 3, continua provada por `apps/despachante/test/vagas.int.test.ts`
      (controle negativo da vaga e "A sem vaga não atrasa B"), que roda no portão (dono: Joaquim)
- [x] ~~Teste intermitente da borda ("API não depende do resto")~~ — não era o teste: nome de
      serviço parado esgotava as 4 threads do libuv e a conexão ao Postgres esperava 15 s. Corrigido
      com `UV_THREADPOOL_SIZE=16` e resolvedor de 1 s (`docs/infra.md`, "Threads e DNS")
- [ ] Guarda de `npm audit` provada com fixture real de dependência vulnerável, e não só com
      o `npm` imitado (`tools/ci/scripts.test.ts:75`)
- [x] ~~`redis-fora.int.test.ts:97` com `start` sem `aguardarSaudavel`~~ — corrigido em 21/09/2026
      (`tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`), e a guarda de lint
      `guardas/esperar-servico-do-compose` impede a próxima ocorrência da classe
- [ ] Medir uma vez a recuperação do despachante depois do `healthy` em `redis-fora.int.test.ts` e
      registrar o número, para o poll de 60 s passar a ser dimensionado em vez de herdado
      (`test-engineer`, três rodadas da correção de 21/09)
- [ ] **Esteira instável: tratar como desenho, não como três bugs soltos.** Em 20/09/2026, depois de
      nove execuções verdes seguidas, três testes **diferentes** falharam em três execuções, cada um
      passando na seguinte sem mudança nenhuma (reconciliação do despachante, e2e do `celular`,
      `infra/test/borda.int.test.ts` com 503 seguido de 400 em cascata), e um quarto vermelho
      intermitente aconteceu no portão local. Diagnóstico do `infra-guardian`: o job do e2e sobe o
      compose **inteiro** (~18 contêineres, incluindo `observabilidade`, sem limite de CPU em
      `infra/compose.yml`) no mesmo runner onde o Playwright roda com CPU ×4 e, no `celular`, 600 ms
      de RTT; `workers` não está fixado em `playwright.config.ts` e `retries: 0`. Nesse arranjo o
      orçamento de tempo não tem folga e contenção do runner vira vermelho que não reproduz na
      máquina. O que decidir: fixar `workers` na esteira, não subir `observabilidade` no job do e2e,
      e escolher entre folga de `expect` no perfil `celular` ou retentativa com o flake **registrado**
      (nunca mascarado). É tarefa, não correção — vale `/criar-tasks`. É o achado mais valioso da
      validação do F1. **Um dos vermelhos do `celular` já tem causa achada e corrigida**: o cliente
      Redis do login cortava em 100 ms e recusava o desafio no runner carregado
      (`tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`). Isso não
      fecha o item — a contenção do runner continua —, mas tira um caso da lista e mostra o padrão:
      prazo de produção medido num runner que não é produção
- [ ] **Intermitente com causa fechada, pronto para `/corrigir`: o "cookie alterado" de
      `apps/api/test/sessao-externa.int.test.ts:433` às vezes não altera nada.** A linha é
      `` `${valor.slice(0, -2)}${valor.endsWith('A') ? 'B' : 'A'}${valor.slice(-1)}` ``: a condição
      olha o **último** caractere e a troca escreve no **penúltimo**. Com o penúltimo já `A` e o
      último diferente de `A`, o cookie "alterado" sai idêntico ao original, o retorno é aceito e a
      asserção da linha 443 recebe `/` em vez de `/?falha=provedor`. Em base64url é ~1 em 64
      execuções. Visto em 22/09/2026 no portão local (o cookie do log terminava em `Aq`); passa 4 de
      4 isolado. O conserto é olhar o caractere que se troca — e vale conferir se a mesma inversão
      existe em outros "altera um caractere" da suíte
- [x] ~~`infra/test/borda.int.test.ts` — "handshake por polling": 503 seguido de 400 em cascata~~ —
      a causa não era ordem entre casos: o teste mandava 20 POSTs em paralelo no mesmo `sid`, e o
      engine.io recusa POST sobreposto
      (`tasks/correcoes/2026-09-23-borda-manda-polling-sobreposto.md`)
- [ ] Depois da correção `2026-09-23-porta-do-teste-na-faixa-efemera`: uma linha no cabeçalho de
      `infra/teste.env` e `infra/carga.env` dizendo que porta nova fica entre 23000 e 29999; o teste
      de ambiente conferir também o piso de 1024 e que teste e carga não repetem porta
      (`infra-guardian`); e, no `/retro`, reabrir a correção
      `2026-09-22-corrida-de-porta-na-observabilidade`, cujo 59100 também estava na faixa efêmera
      (`test-engineer`)
- [ ] Guarda de `video`/`screenshot` no mesmo laço de `tools/ci/esteira.test.ts` que já resolve
      `trace` e `outputDir` por projeto. Hoje os dois estão em `off` por padrão e não há furo, mas
      `video: 'on'` reabriria a evasão que a correção de 20/09 fechou, e a linha do runbook não cobre
      porque vídeo **é** saída do Playwright (`privacy-guardian`)
- [ ] **Primeira da fila** (`privacy-guardian`): guarda sobre `ARQUIVOS_AMBIENTE_TESTE` e a ausência
      de `process.env` em `tools/ci/compose.ts`. O runbook agora afirma **por escrito** que o artefato
      público do e2e é inofensivo porque o ambiente de teste sai só de `.env.example` e
      `infra/teste.env`, versionados. Afirmação de segurança em documento sem teste que a sustente é a
      mesma forma de furo que a correção de 20/09 fechou no `trace`
- [ ] `docs/lgpd.md` seção 4 — linha de furo conhecido: artefato de esteira em repositório público
      (traço do e2e, conteúdo sintético, 7 dias), para a próxima publicação de artefato encontrar a
      decisão escrita onde se procura (`privacy-guardian`)
- [ ] Logs dos serviços dentro de `test-results/` antes da publicação, para o artefato ter a ponta do
      servidor da linha de tempo (`infra-guardian`). **Atenção:** log de serviço não tem a garantia de
      sinteticidade que o traço do Playwright tem por construção, e o repositório é público — fazer
      isso muda a classe do que se publica e exige decidir de novo com o `privacy-guardian`
- [ ] **Defeito do hook de revisões:** `tools/processo/revisoes.ts:342` decide caducidade por
      `statSync(...).mtimeMs`, não por conteúdo. Revisor que faz teste de mutação (mutar e restaurar)
      move o `mtime` sem mudar uma linha, e **invalida a própria rodada ao fazer o trabalho que se
      espera dele** — custou duas rodadas na correção de 20/09. Comparar hash de conteúdo
      (`git hash-object`) encerra a classe
- [x] ~~**Defeito do hook de revisões:** rodada registrada na tabela do documento sem bloco de
      achado~~ — fechado na correção `2026-09-22-achado-de-revisao-nao-cabe-na-janela`. A causa era o
      regex que decidia guardar a rodada aprovada: exigia `Recomendações:` com dois pontos, e
      `## Recomendações (não bloqueiam)` seguido dos itens não casava. Agora quem decide é
      `exigenciaDaRodada`, que lê as sete formas que os revisores usam
- [x] ~~**Defeito do carimbo do portão local**, nas duas metades~~ — corrigido em 22/09/2026
      (`tasks/correcoes/2026-09-22-hook-do-commit-ignora-o-instantaneo-de-conteudo.md`): o instantâneo
      do portão passou a ser gravado com o conteúdo do **início** da corrida, e o portão recusa o
      carimbo se algo mudou enquanto ele rodava; e `avaliarPortao` passou a receber os instantâneos,
      com `documento` e `instantaneos` obrigatórios na assinatura, para esquecer o repasse não compilar
- [ ] **Duas sessões na mesma árvore não passam pelo portão.** O portão é de árvore inteira e o
      carimbo é um arquivo só (`.processo/portao.json`). Em 21/09, com duas sessões abertas: um
      portão saiu vermelho em 5 testes de integração que passavam sozinhos (disputa de container),
      e um `git reset --hard HEAD` de uma sessão apagou o trabalho não commitado da outra. Decidir o
      combinado — uma sessão por vez, ou worktree separada por sessão
- [x] ~~Guarda de lint para `start`/`up` sem `aguardarSaudavel`~~ — feita na retrospectiva do F1
      (`guardas/esperar-servico-do-compose`), com fixture e teste. Vale só em teste, deixa passar
      `up --wait`, e ao ser ligada apontou a última ocorrência aberta do repositório
- [ ] `aguardarSaudavel` depende do healthcheck de `interval: 2s` (`infra/compose.yml:44`), então o
      portão de saúde tende a chegar depois de o cliente já ter reconectado. Se algum teste precisar
      medir a latência de reconexão de fato, o ponto de partida honesto é o `ready` do cliente, não o
      healthcheck (`infra-guardian`, 20/09/2026)

Pendências de processo da retrospectiva da A1 (`tasks/prd-apresentacao-escola/retro.md`, "Decisão"). São mudanças em
código de `tools/processo/`, que pedem teste e revisão, por isso não entraram com o texto das skills.

- [ ] **Portão local sem o `dist` dos pacotes** (proposta 5 da retro da A1). A esteira começa do clone, sem
      `packages/*/dist`, e um dist velho na máquina deixou passar o vermelho da 17.0. O portão
      (`tools/processo/portao-local.ts`) remove `packages/*/dist` antes do `test` e de novo antes do `e2e` (um `ops:*`
      rodado pelo `test` reconstrói o dist), com o teste que roda o portão como processo
      (`tools/processo/revisoes.test.ts`): com um `packages/shared/dist` plantado, o e2e não o vê. Antes, verificar que
      o vitest e o typecheck não dependem do dist. Até lá, a guarda de `tools/ci/playwright.test.ts` (correção
      `e2e-sem-dist-do-shared`) fecha o caminho que causou o vermelho. Destino: correção própria
- [ ] **O hook cobra o `revisor-geral` na correção grande** (proposta 12 da retro da A1). O `/corrigir` já diz que ele é
      obrigatório com mais de 5 arquivos fora de `tasks/` ou com `.github/`, `tools/ci/` ou `tools/processo/`; falta o
      hook (`revisoresObrigatorios`, em `tools/processo/revisoes.ts`) exigir isso sem depender de a linha "Subagentes
      obrigatórios" do documento o listar. Destino: correção própria
- [ ] **Stashes antigos no `git stash`, para o Joaquim decidir** (dono: Joaquim). Continuam lá o "tarefa 1.0 A0
      aprovada, aguardando esteira", de 23/09, e o "resto do pop abortado do stash de 18/09". Conferir se o conteúdo já
      está em algum commit antes de qualquer `drop`. Ninguém descarta sem ele

Pendências de código da A0b que a retrospectiva deixou (`tasks/prd-apresentacao-painel/retro.md`, "Pendências de
código"), com o destino de cada uma. As pequenas foram fechadas na correção `2026-09-25-acabamento-da-a0b`.

- [ ] **Defeito, `/corrigir` próprio: o `desfazer` do contador de tentativas pode descontar do lugar errado**
      (`apps/api/src/sessao/contador-de-tentativas.ts`, `ContadorDeTentativas.desfazer`; `infra-guardian` da 4.0 da A0b).
      Ele desfaz no seguro em memória e, com o Redis `ready`, também no Redis, sem saber onde a tentativa foi contada. Se a
      reserva caiu no seguro (Redis fora naquela hora) e o Redis voltou antes do `desfazer`, o `SCRIPT_DESFAZER` tira do
      Redis uma falha que ele nunca contou, e libera uma falha real: é o lado que a regra do contador proíbe (errar só para
      o lado de segurar). O docblock hoje aceita o caso. Só acontece depois de senha ou código certos e com o Redis
      voltando no meio da tentativa. Correção: a `Reserva` liberada guarda onde foi contada (`redis` ou `seguro`), e o
      `desfazer` age só lá, com teste que reserva no seguro, liga o Redis com uma falha de antes e confere que ela continua
- [ ] Aceite do convite de operador e `renovar` em paralelo, e aceite e segundo fator em paralelo, sem teste de
      concorrência próprio; o rebaixamento do `convite/aceitar` com o Redis de cache fora só é provado pelo C36, com
      limitador falso (`test-engineer` da 9.0 da A0b). Destino: próxima tarefa que tocar
      `apps/api/src/operacao/convite-operador.service.ts` ou `sessao.service.ts` da operação
- [ ] Página e `total` do painel em duas consultas paralelas, com fotografias diferentes do banco: uma escola criada entre
      as duas deixa o total fora da página (`apps/api/src/operacao/painel.repository.ts`, `TOTAL_DE_ESCOLAS` e
      `escolasDaPagina`; 5.0 da A0b). Ler o total na própria consulta da página, com `count(*) over ()` antes do `limit`,
      também tira uma conexão. Destino: próxima tarefa que tocar `painel.repository.ts`
- [ ] `apps/web/src/operacao/paginas/Uso.tsx`: o `VazioDoUso` (`:114`) repete o `EstadoVazio`; e o número longo com
      `wrap-anywhere` (`:75`, `:101`) pode quebrar no meio entre 640 e ~760 px (`revisor-geral` e `frontend-reviewer` da
      8.0). Destino: próxima tarefa em `Uso.tsx` (a A2 traz o consumo de IA para esta tela)
- [x] ~~`apps/web/src/rotas.tsx:53`: o `componentWillUnmount` da fronteira de erro não tem teste (`test-engineer` da
      10.0)~~ — feito na 11.0 da A1: a fronteira saiu para `apps/web/src/componentes/FronteiraDaArea.tsx`, o título da
      falha passou para o gancho `useTituloDaAba` da tela da falha, e o W5 de `e2e/areas.spec.ts` prova que sair dela pelo
      "Sair" devolve a aba ao título de antes
- [ ] `apps/web/src/operacao/paginas/Convite.tsx`: o `hashchange` não zera `aceitando`, e o botão do link novo fica
      desligado ("Salvando…") enquanto o aceite do link anterior está no ar, sem dizer por quê; o descarte do desafio só é
      seguro por isso, e a dependência precisa de um comentário junto ao `aoMudarOFragmento` (`revisor-geral` e
      `test-engineer` da 10.0). Destino: próxima tarefa em `Convite.tsx`
- [ ] `apps/api/test/arquitetura.test.ts`, `comandosDaMigration`: tira o comentário `--` antes do texto entre aspas, e um
      literal como `DEFAULT '--'` corta a linha e faz `tabelasSemEscola` ler errado o resto da migration. Hoje não existe
      esse caso (`revisor-geral` da 10.0). Destino: próxima tarefa que tocar esse teste, ou a primeira migration com `--`
      dentro de texto
- [ ] O anúncio atrasado "Escola X criada." (`role="status"` de `apps/web/src/operacao/paginas/Escolas.tsx:228`) fica fora
      do `<dialog>` modal reaberto, inerte para o leitor de tela: quem o usa pode não saber que o pedido cancelado criou a
      escola e repetir. No Nova rede nada segura o duplicado (`frontend-reviewer` da correção `7d495d0`). Destino: próxima
      tarefa que tocar `Escolas.tsx`
- [ ] `apps/api/src/operacao/painel.service.ts:62` (`naEscola`): o mesmo caminho morto que a correção
      `2026-09-25-acabamento-da-a0b` tirou do segundo fator, `contextoAtual() ?? { requisicaoId: randomUUID() }`. Aqui a
      linha é escrita depois da gravação, então a falha fechada vai no começo do caso de uso, não no log. O mesmo vale para
      `refazerConviteDaCoordenacao` (`apps/api/src/sessao/convite.service.ts`), que só o painel chama; no gerar e no
      revogar o fallback é vivo, porque os comandos `ops:*` rodam sem requisição (`tenancy-guardian` da correção). Destino:
      próxima tarefa que tocar `painel.service.ts` ou `convite.service.ts`
- [ ] Contador `banco.conexao_descartada{causa}`, separando erro de consulta e erro da conexão: hoje o descarte não
      aparece em métrica nenhuma, só a queda das conexões em uso, e o failover do Postgres gerenciado precisa ser sinal
      próprio (`infra-guardian` da correção `577d185`). Destino: antes do staging (D31)
- [ ] Professores com o mesmo nome na tela Professores da coordenação (A1, 14.0): a lista traz só usuário, nome e estado
      (sem e-mail, para não dizer se a conta do e-mail existia, E11), e duas pessoas de mesmo nome dão duas linhas e dois
      "Refazer o convite de …" iguais; o link refeito de uma pode ir para a outra. A tela avisa o nome repetido no resumo
      do cadastro, sem impedir. O desempate de verdade é o e-mail na linha, que muda o contrato da 3.0
      (`esquemaProfessorDaEscola`) e o E11 (`test-engineer` e `frontend-reviewer` da 14.0). A consequência, pela matriz
      de estados (leitura do `privacy-guardian`, não reproduzida): quem recebe o link errado define a senha da conta da
      outra pessoa; a linha vira `aceito`, que não tem refazer nem revogar, e recadastrar o e-mail dá `CONFLITO`; a pessoa
      certa fica sem caminho até o reset de senha (F2). É o mesmo risco da conta global da Tech Spec da A1, seção 13,
      tolerado enquanto o dado for sintético. Posição do `privacy-guardian` para a decisão: o e-mail na linha é aceitável
      (está na tabela de dados, e foi a coordenação que o digitou), com três condições — só nas linhas com convite em
      aberto (`pendente`, `vencido`); decidir se a origem é o e-mail global da conta ou o que a escola digitou (campo
      novo, com linha própria no `docs/lgpd.md`); e o E11 passar a provar que o e-mail aparece igual nos dois casos.
      Destino: junto da prova de posse do e-mail do "Portão da primeira escola real" (`ROADMAP.md`)
- [ ] A trava do pedido no ar e o alerta com foco existem duas vezes na web: `useEnvioUnico` e `AlertaDaFalha`, em
      `apps/web/src/componentes/dialogos.tsx` (A1, 13.0; vieram para `componentes/` na 15.0, e o `useEnvioUnico` passou a
      receber as opções da mutação, com que o acesso da turma já o usa), e o `noAr` de
      `apps/web/src/componentes/DialogoDoConvite.tsx` com o `Falha` de `componentes/copia-unica.tsx` (da A0b). O diálogo
      do convite passar a usar o `useEnvioUnico`, e o `Falha` e o `AlertaDaFalha` virarem um só, deixa um jeito só
      (`revisor-geral` da 14.0).
      Não é troca de nome: o `Falha` leva o foco de novo a cada erro, e o `AlertaDaFalha`, só quando o texto muda, e a
      trava do diálogo está sob o e2e da A0b e as mutações da 14.0. Na mesma correção: o mapa
      `TEXTOS_DO_CONVITE_QUE_MUDOU` de `areas/coordenacao/convite-de-professor.ts` difere por uma letra do texto
      `TEXTO_DO_CONVITE_QUE_MUDOU` que o arquivo importa; dar ao mapa um nome que diga o que ele é (`revisor-geral` da
      14.0, 2ª rodada). E `linkDoConvite` e `copiarLink` (`componentes/link-do-convite.ts`) já montam também o link da
      sala e copiam o convite inteiro do WhatsApp: `linkComToken` e `copiarTexto`, ou equivalente (`revisor-geral` da
      15.0); e `codigoEmDoisGrupos` (`areas/professor/acesso-da-turma.ts`) é só outro nome de `exibirCodigoDaTurma`. Destino: correção própria
- [ ] Acesso da turma (A1, 15.0): o gerar espera a releitura da seção antes de mostrar o link e o código
      (`apps/web/src/api/acesso.ts`, `onSettled`). Numa rede que engasga, o diálogo fica em "Gerando…" com o acesso já
      gerado no servidor. O `frontend-reviewer` sugere mostrar o acesso assim que o `POST` responde e recarregar a seção
      por trás; pede resolver junto o foco de quem fecha antes da releitura (o "Gerar acesso" do vazio some) e a seção
      que afirma "Sem acesso ativo" nesse intervalo. Decidido no `/validar` da A1 (04/10/2026): não segura a A1, porque o
      acesso já fica gerado no servidor e a demonstração usa dado sintético. Destino: correção de acabamento antes da
      primeira demonstração externa
- [ ] Testes do fim do vínculo (N2 e N3 da validação da A1, rodada 2): em `apps/api/test/acesso-fim-do-vinculo.int.test.ts`,
      falta o caso do professor com vínculo em duas escolas, em que a eliminação na escola A não pode revogar o acesso que
      ele gerou na B, pelo caminho da eliminação (`tenancy-guardian`); e o teste da trava do vínculo pendente termina em
      `await eliminando` sem conferir que o vínculo saiu e que não ficou acesso vigente (`test-engineer`). Destino: a
      próxima tarefa que tocar o arquivo, ou o F2
- [x] Encerrar o vínculo do professor não revoga o acesso da turma que ele gerou (A1, 4.0; achado do `privacy-guardian`
      na 15.0; G1 da validação da A1). Resolvido pela correção `2026-10-03-acesso-sobrevive-ao-vinculo`
      (`tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`): o fim do último vínculo confirmado dele na turma
      (encerrar ou eliminação) revoga, na mesma transação e com auditoria, o acesso vigente que ele gerou
- [ ] A desativação do professor (`CicloDeVidaService.desativar`, 17.0) não encerra os vínculos dele nem revoga o acesso
      da turma que ele gerou: ele deixa de entrar, mas o link e o código que já tem continuam abrindo a sala até vencerem.
      Fechar junto com a tela de estrutura do F2 (que chama a desativação): ou a desativação encerra os vínculos pelo
      mesmo caminho do encerrar (e a revogação vem junto), ou revoga o acesso dele com a mesma trava da turma. Ficou fora
      da correção `2026-10-03-acesso-sobrevive-ao-vinculo`, que cobre o fim do vínculo. Junto, a janela que o
      `infra-guardian` registrou na eliminação: a coordenação cria um vínculo novo do mesmo professor numa turma ainda não
      travada, e ele confirma e gera antes do `delete` dos vínculos (improvável; fecha quando a trava passar a ser no
      usuário). E o `40P01` que ainda sai `ERRO_INTERNO` (`mapear-erro-postgres.ts`): `CONFLITO` ou uma nova tentativa,
      numa correção geral. Destino: F2, antes do portão da primeira escola real
- [ ] `Referrer-Policy` na borda (`no-referrer` ou `same-origin`): a aba do `wa.me` que o botão do WhatsApp abre recebe
      a origem da web como referência (`privacy-guardian` da 15.0). Não é dado pessoal; fecha com os cabeçalhos de
      segurança da borda, com o `infra-guardian`
- [ ] O formato do token opaco de 43 caracteres base64url está em dois lugares: `esquemaTokenDeLink`
      (`packages/shared/src/sessao/token.ts`: convite da coordenação, link da sala e, desde a 14.0 da A1, o convite de
      professor) e o `FORMATO_DO_REFRESH` (`apps/api/src/sessao/renovacao.service.ts` e
      `apps/api/src/operacao/sessao.service.ts`). Unificar os dois da API no mesmo formato (`revisor-geral` da 4.0 da A1).
      A 14.0 fez a parte do convite de professor; o refresh é da API de sessão, fora de uma tarefa de tela. Destino:
      correção própria

## Regulação educacional

- [ ] Acompanhar a homologação pelo MEC e a publicação das diretrizes do CNE; ler o texto
      oficial e revisar a regra 70, principalmente correção de discursiva e redação (D46, D55)
      e a classificação dos sinais do tutor. **É o que decide se a devolutiva formativa de
      discursiva volta a existir no produto**
- [ ] Acompanhar a **regulamentação da ANPD sobre o art. 11 do Decreto 12.880/2026** (IA
      conversacional com criança e adolescente): pode trazer requisito técnico novo para o
      Tutor (D58, D59)
- [ ] Ler e destrinchar em requisito: **Guia de Classificação Indicativa do MJ (out/2025),
      capítulo Interatividade** — o MEC manda o desenvolvedor segui-lo; **Resolução CNE/CEB
      2/2025** (Educação Digital e Midiática); **Children & AI Design Code** (5Rights, 2025)
- [ ] Verificar se Santa Catarina tem lei estadual sobre aparelhos na escola além da Lei
      15.100
- [ ] Transformar a conformidade em material de venda: "já estamos dentro do prazo de 12 meses"
- [ ] Confirmar exigências de registro escolar da rede alvo

## Material didático

- [ ] **O documento que a coordenação sobe na demonstração** (D75): nosso ou de domínio
      público, com a licença declarada, de uma disciplina que renda boa demonstração. Não é
      material pré-carregado: não há seed de escola nem de material (D71 revista). Antes do PRD
      da A2 (D5)

- [ ] Modelo de autorização escrita da escola para cada fonte de material
- [ ] Parecer sobre direito autoral da ingestão (Lei 9.610, art. 29, IX; termos de Arco/SAS,
      Positivo, Bernoulli e Somos), incluindo apostila impressa escaneada (D5 revista)
- [ ] Buscar parceria ou licença com editora ou sistema de ensino para uso do material na
      base da escola
- [ ] Levantar quais sistemas de ensino as escolas alvo usam e se elas têm material próprio
      ou PDF licenciado (decide o primeiro material do piloto e o primeiro adaptador, D22)
- [x] ~~Decidir: adaptador por fonte ou extração genérica~~ — upload primeiro, adaptador por
      fonte quando houver escola real (D22)
- [ ] Conjunto fixo de amostras para medir qualidade da extração e da classificação BNCC
- [ ] Baixar e organizar as provas oficiais do ENEM do INEP para o banco público (D21)
- [ ] Verificar licença de uso das provas de vestibular antes de incluir qualquer uma

## Produto

- [x] ~~Fechar o que da revisão dos mockups trava o PRD da A1~~ — em 23/09/2026: um agente por
      pessoa (D32, D9 e D60 revistas), a pele e o padrão de espaço (D72), a navegação do professor
      (D73). Continuam em `docs/pendencias-dos-mockups.md` os que pedem `/descobrir` antes de
      qualquer PRD: **projetos**, **anexo na conversa** (abre a porta para correção de discursiva
      por IA: D55) e **faltas** (não existe no roadmap nem na tabela da LGPD)
- [ ] **Catálogo de ferramentas (P22 a P25).** A regra e as quatro categorias estão na D74. Falta
      passar por `/descobrir` as oito ferramentas que a D67 não lista (planejamento do período,
      projeto, plano de recuperação, mapa mental, roteiro de experimento, avaliação diagnóstica,
      proposta de redação, importar prova), uma a uma, antes de entrarem no F7. Na Tech Spec da A2:
      ferramenta como dado, com o formulário derivado do schema do contrato (P23)
- [ ] **Sétima e oitava rodadas dos mockups (P26 a P31).** A pele ficou uma só (D72), e como a do
      produto não copia a Teachy, a consulta ao advogado sobre cópia fiel (P31) só volta se alguém
      propuser copiar de novo. No PRD da A1: o seletor de escola que troca o token (P30) e o
      convite por link, WhatsApp e código (P27), que saíram do F2 para a A1 (D71 revista). Antes do
      PRD da A3: a turma aberta com nove abas (P28). Por `/descobrir`: **ranking de participação**
      (P26, bate na 10.2 do `docs/interface.md` e na D57), **Recursos** e **Mural** (P28)
- [x] A1 (antes era o F2): o vínculo de aluno criado pela lista de nomes precisa nascer com `decidido_em` preenchido. A lista de alunos do ano encerrado (10.0) só traz quem chegou confirmado ao fim do ano, e hoje só a fixture de teste grava esse campo: sem ele, o aluno some do histórico da turma — feito na tarefa 8.0 da A1 (`VinculoRepository.criarAlunoConfirmado`, E19)

- [x] ~~Fechar a lista de agentes e o nível de autonomia de cada um~~ — D32 a D36; lista
      revista em 19/09/2026 para seis agentes e em 23/09/2026 para três, um por pessoa da escola,
      com a autonomia por função (D32, D9)
- [ ] Validar com advogado a base legal para guardar a adaptação necessária do aluno (D35),
      agora lida também pelo Tutor para ajustar a forma da conversa (D66)
- [ ] **Lista padrão de fontes aprovadas** da busca do Tutor, por faixa etária (anos finais e
      Ensino Médio), com critério escrito de entrada e de saída; e escolher o provedor de busca,
      que entra como suboperador (D68). Antes do PRD do F9
- [ ] Decidir de onde vêm as imagens da ferramenta de apresentação, e com que licença (D67, D5).
      Antes do PRD do F7
- [ ] Fechar os indicadores de turma e aluno de Turmas **antes do PRD do F6** (D69, D73), e os
      limiares que a A3 mostra antes do PRD dela.
      Ponto de partida: percentual de erro e acerto por habilidade, e "concluiu o que foi
      atribuído". Tempo ocioso e navegação não entram
- [ ] **Guia para a TI da escola** bloquear outras IAs no computador do aluno (Google Admin,
      filtro da rede). É a resposta ao pedido de "avisar quando o aluno usa outra IA", que o
      produto não faz (D70). Entra no dossiê (D61)
- [ ] Texto da mensagem fixa de acolhimento do tutor, revisado por uma orientadora
      educacional de verdade (D36)
- [x] ~~Definir teto de uso do tutor por aluno e orçamento de tokens~~ — D38, D39, D41
- [x] ~~Decidir o modelo de cobrança~~ — por aluno, uso incluso, sem crédito (D40)
- [x] ~~Decidir se o aluno acessa de casa desde o início~~ — escola decide por turma (D19)
- [x] ~~Definir o que o coordenador precisa ver na primeira semana~~ — as quatro coisas do D24

## Marca e interface

- [x] ~~Identidade visual (paleta, tipografia, logo)~~ — existe e está fora deste repositório:
      manual da marca Turmma, com caramelo `#E8732E`, azul-noite `#16233E`, creme `#FFF3E2` e
      papel `#FDFBF7` (D54). É a pele da landing page; a do produto é a da D72
- [x] ~~Landing page~~ — existe em `turmma.com` (fora deste repositório)
- [x] ~~Trazer a paleta, a tipografia e o logo para o repositório~~ — já estão em `mockups/`
      (`src/index.css` e `public/marca/`), e a A1 leva de lá para o `apps/web` (D72)
- [ ] **Antes da Tech Spec da A2:** o avatar de cada um dos **três agentes**, em SVG, por função:
      Assistente de ensino, Tutor e Analista de desempenho escolar (D32 revista, D72)
- [ ] Identificar no 21st.dev o autor e a licença das peças que o Gabriel colou direto no
      mockup (área de soltar arquivo, miniatura de arquivo, pasta animada, `leaderboard-*` e as duas
      da HextaUI) e conferir a do calendário `vaib215/event-manager`, antes de qualquer uma entrar no
      código (P20)
- [ ] **Foco durante o pedido e ao trocar de tela** (`frontend-reviewer`, 13.0 da A1): o botão que fica `disabled` enquanto
      o pedido está no ar perde o foco para o `body` (medido em "Alocar", "Ver a prévia", "Ver mais nomes" e "Abrir o ano
      letivo"; vale para o `Botao` e o secundário de todas as telas, também as da operação), e abrir uma tela pela lateral
      ou por link não leva o foco ao `<h1>`. A 12.0 resolveu o primeiro no `SeletorDeEscola` com `aria-disabled`; falta o
      padrão no `Botao`, com o estilo do desligado, e o foco na troca de rota, na casca. E o erro de campo do `Campo` não
      tem região viva: quando o foco já está no campo com erro (Enter com o foco nele), o leitor de tela pode não ler.
      Na lista colada da Estrutura (`ListaDaTurma.tsx`), o alerta que volta porque o texto voltou ao recusado é
      `role="alert"` e é lido de novo (`AlertaSemFoco`), a rever em teste com leitor de tela (3ª rodada da 13.0)
- [ ] **Encerrar alocação pela tela** (`frontend-reviewer`, 13.0 da A1): a API tem `POST /v1/vinculos/:id/encerrar` e
      nenhuma tela o usa. O professor alocado na turma errada não se desfaz pela Estrutura, o vínculo `contestado` não
      oferece ação, e a turma com alocação não se exclui. Decisão de produto (o que a coordenação pode desfazer, e com
      que aviso ao professor), a levar para o `/validar` da A1
- [ ] **Listas da Estrutura sem virtualização** (`frontend-reviewer`, 13.0 da A1): turmas, disciplinas e alocações rendem
      até 1.000 cartões. Cabe numa escola do recorte (dezenas); rever se a alocação de uma escola passar de algumas
      centenas (regra 50, item 1). Junto: a Alocação lê até 1.000 vínculos e 1.000 professores e, acima disso, corta sem
      o aviso que turmas e disciplinas têm (`revisor-geral`)

## Comercial

- [ ] Planilha de custo de IA por aluno/mês **por pacote** → validar a margem das faixas
      (D50) e fixar o teto de IA do pacote base (D39)
- [ ] Entrevistas com 6 a 8 escolas de Joinville (coordenação e professores, particular e
      pública): como medem o professor hoje e o que ele aceitaria, onde está a grade, que
      material usam e com que licença, se têm Google Workspace ou Microsoft, qual sistema de
      gestão, quem pagaria, quanto e quando
- [ ] Escola piloto gratuita para o 1º semestre de 2027, com carta de intenção (D1 revista;
      contatos existem, nada decidido com base neles)
- [ ] Confirmar com advogado o calendário de repasse na mensalidade (Lei 9.870/1999) antes de
      prometer preço para 2027
- [ ] Levantar o número de alunos da rede pública no recorte (anos finais municipais e
      estaduais, Ensino Médio estadual) e o preço praticado em pregão
- [ ] Roteiro de demonstração para coordenador e para assembleia de pais, com o checklist do
      MEC respondido na mão (`docs/conformidade-mec.md` seção 2)
- [ ] **Evidência independente de eficácia pedagógica**: desenhar com a escola piloto uma
      medição simples e pré-registrada (tempo de preparação e correção do professor antes e
      depois; desempenho por habilidade com e sem uso), com alguém de fora assinando o
      desenho. O MEC pede pesquisa **não financiada pelo desenvolvedor**, e sem isso o
      primeiro critério de avaliação de qualquer secretaria fica em branco
- [ ] **Material de formação do professor**, exigido pelo princípio 4 e pelo critério 3 do
      MEC. Não temos nada, e é a isca comercial mais barata que existe
- [ ] Perguntar à secretaria de Joinville se existe ou pode existir **chamamento público para
      sandbox regulatório** — é o formato natural do piloto gratuito de 2027 e não passa por
      licitação (`docs/conformidade-mec.md` seção 10)
- [ ] Aproveitar setembro como pico de compra para o ano seguinte (em 2026, para
      entrevistas e piloto; venda com repasse, realisticamente, para 2028)

## Marca

- [x] ~~Nome definitivo~~ — **Turmma** (D54)
- [ ] Busca e depósito no INPI da marca Turmma, e registro do domínio `turmma.com` (e do
      `@turmma.ai`). É o único risco que sobra do nome: se o INPI negar, a troca é de marca,
      não de código

## Fase posterior

- [ ] Iniciar aprovação da API oficial do WhatsApp (prazo de semanas — comece antes de precisar)
- [ ] Portal da família sobre o motor de eventos

## Antes da primeira escola real, vindo da revisão da fase 1 do MVP de apresentação (04/10/2026)

O MVP de apresentação corre com dado sintético (D71, D77). Os revisores apontaram o que precisa existir antes de
qualquer dado real:

- [ ] **Acesso e portabilidade do titular cobrindo as tabelas da fase 3.** A rota do pedido do titular (F3,
  `ciclo-de-vida.service.ts`) precisa alcançar, por aluno: `mensagem_tutor`, `sinal_tutor`, `resposta_atividade`,
  `tentativa_atividade`, `correcao`, `validacao_do_lote` (o aluno do destaque, pelo id) e `consumo_ia` com
  `envio_externo` (o que foi a provedor externo e quando), para a pergunta de fechamento da regra 20 continuar
  respondida por código (`privacy-guardian`, revisão da fase 3).
- [ ] **Trava da D62 em código.** A marca "leva texto de aluno" da camada de IA não tem consumidor: texto de aluno com
  envio externo e sem contrato que vede treinamento e garanta processamento no Brasil precisa ser recusado
  (`privacy-guardian`).
- [ ] **Expurgo** de `consumo_ia` (`entrada` e `saida`), de `execucao_agente` e das conversas, no prazo do mapa de
  `docs/lgpd.md`, configurável por escola. O mapa cita o expurgo e ele não existe.
- [ ] **Aviso no campo de tema** das ferramentas, para não escrever nome nem condição de aluno, e busca textual nos
  campos livres no procedimento de eliminação do titular.
- [ ] **Recusa do Tutor medida.** Conjunto fixo de amostras com taxa mínima declarada, rodado contra o modelo de
  produção (regra 40). A regra determinística cobre o que está no arquivo de amostras; o resto fica com o modelo, e
  para aluno real isso não basta sem medição (`conformidade-reviewer`).
- [ ] **Teto de IA por escola e custo.** Não há coluna de teto nem tabela de preço: `IA_ORCAMENTO_ESGOTADO` nunca
  dispara e `custo_micros` fica em zero (D14, D39).
- [ ] **Galeria das peças fora do build** de staging e de produção.
- [ ] **Execução de IA e extração de PDF por fila**, no lugar do processo da API (`TODO(fila)`, D49).
- [ ] **Recusa da D55 no Assistente, estrutural.** A regra por lista de palavras pegou 6 de 47 frases novas escritas
  pelo `conformidade-reviewer` na segunda passada da fase 3 (04/10/2026): foi ajustada às amostras. Para a demonstração
  ela foi aceita; antes de dado real: texto colado na mensagem atual não vai ao modelo, ou é recusado quando não é
  material do próprio professor; a conferência da saída recusa número de 0 a 10 ou letra de A a E depois de "sugiro",
  "colocaria", "iria de", "fecharia em", "classificaria", e "considero" ou "avaliação:" seguido de insuficiente,
  regular ou satisfatório; a entrada cobre a trajetória do aluno ("reprovo", "recuperação", "conselho de classe",
  "encaminho"); e um terceiro arquivo de amostras, escrito por outra pessoa, com a taxa medida e declarada abaixo de 1.
  Falso positivo conhecido: "critérios para avaliar redação antes de aplicar" é recusado.
- [ ] **Assunto delicado sem teto de IA.** Agora passa na frente de todo limite (D36). Falta um teto próprio, alto, ou a
  deduplicação do sinal `atencao_humana`, para um laço de mensagens não encher a lista do professor; e confirmar que o
  limite geral de requisições por escola, o da borda, não chega antes do 188 às 10h.
- [ ] **Ensaio de alertas intermitente** na esteira: a regra "Login recusado pelo semáforo do hash" ficou em `pending`
  até o prazo numa execução da `mvp/apresentacao` e passou na reexecução. Se voltar, entra por `/corrigir`.

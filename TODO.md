# TODO fora do código

O que trava o projeto e não se resolve programando. Vários têm prazo externo.

## LGPD e conformidade — prioridade máxima

- [ ] Contrato de tratamento de dados escola↔nós, com advogado (escola controladora)
- [ ] Contrato com provedor de IA vedando treinamento com nosso dado
- [ ] Política de privacidade e termos, com seção de menor de idade
- [ ] Indicar encarregado (DPO) e publicar canal de contato
- [ ] Relatório de impacto (RIPD) — dado de menor, volume alto, IA no fluxo
- [ ] Definir prazos de retenção com uma escola real (varia por rede)
- [ ] Escrever e ensaiar o processo de incidente
- [ ] Parecer sobre o ECA Digital (Lei 15.211/2025) para plataforma contratada pela escola,
      com a avaliação de impacto que ele exige
- [ ] Base legal da conversa do tutor e dos sinais, na particular e na pública (Enunciado
      CD/ANPD 1/2023; teste de balanceamento se for legítimo interesse)
- [ ] Indicadores de professor com advogado: CLT, convenção coletiva de cada sindicato
      (SINPRONORTE lida, sem cláusula sobre IA) e estatuto do servidor na rede pública (D45)
- [ ] Contrato com a escola: responsabilidade civil por resposta errada do tutor e direito
      de regresso
- [ ] Protocolo de risco à vida com a escola: quem notifica o Conselho Tutelar (Lei
      13.819/2019, Lei 15.231/2025) e como o sinal chega a essa pessoa
- [x] ~~Decidir região de hospedagem~~ — Brasil (D28)

## Infra e operação

- [ ] Alerta para muitos `login.externo{resultado="provedor"}` (erro, prazo ou discovery do Google ou da Microsoft), com linha no runbook: hoje a métrica existe, mas nada avisa quando o login pela conta da escola começa a falhar em massa (revisão da 13.0)
- [ ] Login pela Microsoft: passar a exigir a claim `xms_edov` (e-mail de domínio verificado) para ligar professor pelo e-mail. Hoje o e-mail vale como verificado porque o tenant já foi conferido, como a Tech Spec define; com a claim, um administrador do tenant da escola não consegue pôr o e-mail de outra professora num usuário e ligá-lo à conta dela (revisão da 13.0)

- [ ] Escolher provedor de hospedagem em região Brasil, com Postgres + pgvector, Redis e
      storage S3 gerenciados (D26, D28), quando for criar o staging (D31, D42)
- [ ] Contrato com provedor de modelo: veda treinamento, permite serviço usado por menor,
      limite de tokens por minuto compatível com o pico (~1,5 mi/min em 10 escolas pela
      estimativa do `docs/infra.md`; a análise de 13/09/2026 chegou a ~2,8 mi com premissa
      mais realista), e região de processamento (D29)
- [ ] Provedor de modelo de reserva configurado e testado
- [ ] Antes da primeira escola real: alerta para rotina do sistema que parou de rodar
      (`sistema.consolidar-uso`, `sistema.expurgar-jobs`, `sistema.expurgar-acesso` da 17.0), por exemplo métrica com o horário do
      último sucesso e regra `time() - x > 26h`, com entrada no `docs/runbook.md` (pendência da 11.0
      registrada na 13.0; dono: Joaquim)
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

## Processo e dívida do F0

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
      validação do F1
- [ ] `infra/test/borda.int.test.ts` — "handshake por polling fica na mesma instância pelo cookie da
      borda": um único 503 da borda invalida a sessão socket.io e as 17 requisições seguintes viram
      400 em cascata (esteira run 35525902277). O arquivo tem um caso que mata um realtime de
      propósito, o que aponta para contaminação de ordem entre casos. Precisa de `/corrigir` próprio,
      com a causa achada antes da correção
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
- [ ] **Defeito do hook de revisões:** rodada registrada na tabela do documento sem bloco
      correspondente em `achados-revisoes.md`. Aconteceu com a rodada 2 do `test-engineer` e com
      **todas** as rodadas do `privacy-guardian` da correção de 20/09 — justamente o revisor cujo
      texto sustenta uma decisão de regra 20. O texto exigido se perde e a rodada seguinte audita sem
      ele. Uma asserção exigindo um bloco por linha da tabela fecha a classe
- [x] ~~Guarda de lint para `start`/`up` sem `aguardarSaudavel`~~ — feita na retrospectiva do F1
      (`guardas/esperar-servico-do-compose`), com fixture e teste. Vale só em teste, deixa passar
      `up --wait`, e ao ser ligada apontou a última ocorrência aberta do repositório
- [ ] `aguardarSaudavel` depende do healthcheck de `interval: 2s` (`infra/compose.yml:44`), então o
      portão de saúde tende a chegar depois de o cliente já ter reconectado. Se algum teste precisar
      medir a latência de reconexão de fato, o ponto de partida honesto é o `ready` do cliente, não o
      healthcheck (`infra-guardian`, 20/09/2026)

## Regulação educacional

- [ ] Acompanhar a homologação pelo MEC e a publicação das diretrizes do CNE; ler o texto
      oficial e revisar a regra 70, principalmente correção de discursiva e redação (D46) e
      a classificação dos sinais do tutor
- [ ] Verificar se Santa Catarina tem lei estadual sobre aparelhos na escola além da Lei
      15.100
- [ ] Transformar a conformidade em material de venda: "já estamos dentro do prazo de 12 meses"
- [ ] Confirmar exigências de registro escolar da rede alvo

## Material didático

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

- [ ] F2: o vínculo de aluno criado pela importação precisa nascer com `decidido_em` preenchido. A lista de alunos do ano encerrado (10.0) só traz quem chegou confirmado ao fim do ano, e hoje só a fixture de teste grava esse campo: sem ele, o aluno some do histórico da turma

- [x] ~~Fechar a lista de agentes e o nível de autonomia de cada um~~ — D32 a D36
- [ ] Validar com advogado a base legal para guardar a adaptação necessária do aluno (D35)
- [ ] Texto da mensagem fixa de acolhimento do tutor, revisado por uma orientadora
      educacional de verdade (D36)
- [x] ~~Definir teto de uso do tutor por aluno e orçamento de tokens~~ — D38, D39, D41
- [x] ~~Decidir o modelo de cobrança~~ — por aluno, uso incluso, sem crédito (D40)
- [x] ~~Decidir se o aluno acessa de casa desde o início~~ — escola decide por turma (D19)
- [x] ~~Definir o que o coordenador precisa ver na primeira semana~~ — as quatro coisas do D24

## Marca e interface

- [ ] Identidade visual (paleta, tipografia, logo) para o frontend seguir — Gabriel,
      **antes do PRD do F2**
- [ ] Landing page — Gabriel

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
- [ ] Roteiro de demonstração para coordenador e para assembleia de pais
- [ ] Aproveitar setembro como pico de compra para o ano seguinte (em 2026, para
      entrevistas e piloto; venda com repasse, realisticamente, para 2028)

## Marca

- [ ] Nome definitivo, busca no INPI, domínio. "Educa.ia" é provisório e há vizinhos
      próximos no mercado ("IA Educa Brasil", "Eduka.ai")

## Fase posterior

- [ ] Iniciar aprovação da API oficial do WhatsApp (prazo de semanas — comece antes de precisar)
- [ ] Portal da família sobre o motor de eventos

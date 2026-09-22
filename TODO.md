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

## Infra e operação

- [ ] Alerta para muitos `login.externo{resultado="provedor"}` (erro, prazo ou discovery do Google ou da Microsoft), com linha no runbook: hoje a métrica existe, mas nada avisa quando o login pela conta da escola começa a falhar em massa (revisão da 13.0)
- [ ] Login pela Microsoft: passar a exigir a claim `xms_edov` (e-mail de domínio verificado) para ligar professor pelo e-mail. Hoje o e-mail vale como verificado porque o tenant já foi conferido, como a Tech Spec define; com a claim, um administrador do tenant da escola não consegue pôr o e-mail de outra professora num usuário e ligá-lo à conta dela (revisão da 13.0)

- [ ] Escolher provedor de hospedagem em região Brasil, com Postgres + pgvector, Redis e
      storage S3 gerenciados (D26, D28), quando for criar o staging (D31, D42)
- [ ] Contrato com provedor de modelo: **garante processamento no Brasil para conversa de
      aluno** (D62), veda treinamento, permite serviço usado por menor,
      limite de tokens por minuto compatível com o pico (~1,5 mi/min em 10 escolas pela
      estimativa do `docs/infra.md`; a análise de 13/09/2026 chegou a ~2,8 mi com premissa
      mais realista), e região de processamento (D29)
- [ ] Provedor de modelo de reserva configurado e testado
- [ ] Antes da primeira escola real: alerta para rotina do sistema que parou de rodar
      (`sistema.consolidar-uso`, `sistema.expurgar-jobs`), por exemplo métrica com o horário do
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

- [ ] **Quando o F1 fechar: criar `release` e `develop`** (D23 revista). Ordem combinada: o
      branch de documentação entra no `main` quando o Joaquim avisar, depois `main` → `release`
      e `release` → `develop`. Atenção: o `docs/direcionamento-regulatorio` já conflita com a
      tarefa 17.0 em `docs/lgpd.md`, e o conflito precisa ser resolvido nesse merge
- [ ] **Ajustar o processo à D23 revista** (dono: Joaquim): a esteira do GitHub só roda no push
      do `main` (`.github/workflows`), e precisa rodar em `develop`, `release` e nos PRs; o hook
      de commit, o `/executar-task`, o `/corrigir` e a regra 40 ainda descrevem commit direto no
      `main` e esteira verde antes da tarefa seguinte; definir de qual branch sai o staging
- [ ] **MVP de apresentação (D71):** aceitar ou recusar os três afrouxamentos enquanto o dado
      for sintético (AIA só com a etapa 1, provedor de modelo livre, carga sem crescer), antes
      do PRD da A1; e escrever a etapa 1 das AIAs de correção, diagnóstico, Tutor e sinais antes
      dos PRDs da A3, da A4 e da A5 (`docs/aia/`)
- [ ] Ratificar ou recusar as D55 a D71 que esperam o Joaquim, e as revisões da D1, da D32 e
      da D45 (`docs/decisoes.md`). O branch `docs/estrutura-de-agentes` está empilhado sobre o
      `docs/direcionamento-regulatorio`

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

- [ ] **Material de exemplo da escola sintética** do MVP de apresentação: nosso ou de domínio
      público, com a licença declarada, de uma disciplina que renda boa demonstração. Antes do
      PRD da A2 (D71, D5)

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

- [ ] **Fechar o que saiu da revisão dos mockups (19 e 20/09/2026)**, item por item, em
      `docs/pendencias-dos-mockups.md`. Os que travam o PRD da A1: **um agente por pessoa**
      (revisão da D32, da D9 e da D60; o Gabriel decidiu a direção, falta o Joaquim), a pele do
      produto (vira a D72), o padrão de espaço e a navegação do professor. Os que pedem
      `/descobrir` antes de qualquer PRD: **projetos**, **anexo na conversa** (abre a porta para
      correção de discursiva por IA: D55) e **faltas** (não existe no roadmap nem na tabela da LGPD)
- [ ] **Catálogo de ferramentas (P22 a P25).** Registrar a regra "ferramenta é o que entrega um output
      próprio; o resto é pedido ao chat" e as quatro categorias (Planejar, Preparar a aula, Avaliar,
      Corrigir) antes do PRD da A2. Passar por `/descobrir` as oito ferramentas que a D67 não lista
      (planejamento do período, projeto, plano de recuperação, mapa mental, roteiro de experimento,
      avaliação diagnóstica, proposta de redação, importar prova), uma a uma, antes de entrarem no F7.
      Na Tech Spec da A2: ferramenta como dado, com o formulário derivado do schema do contrato (P23)
- [ ] **Sétima e oitava rodadas dos mockups (P26 a P31).** Antes do PRD da A1: escolher **uma pele**
      (a da Teachy em Ferramentas e Turmas ou a do P02 em tudo) e levar ao advogado a cópia fiel de
      concorrente (P31); seletor de escola que troca o token (P30). Antes do PRD da A3: a turma aberta
      com nove abas (P28). Por `/descobrir`: **ranking de participação** (P26, bate na 10.2 do
      `docs/interface.md` e na D57), **Recursos** e **Mural** (P28). No PRD do F2: o convite por link,
      WhatsApp e código (P27)
- [ ] F2: o vínculo de aluno criado pela importação precisa nascer com `decidido_em` preenchido. A lista de alunos do ano encerrado (10.0) só traz quem chegou confirmado ao fim do ano, e hoje só a fixture de teste grava esse campo: sem ele, o aluno some do histórico da turma

- [x] ~~Fechar a lista de agentes e o nível de autonomia de cada um~~ — D32 a D36; lista
      revista em 19/09/2026 para seis agentes (D32 revista, a ratificar pelo Joaquim)
- [ ] Validar com advogado a base legal para guardar a adaptação necessária do aluno (D35),
      agora lida também pelo Tutor para ajustar a forma da conversa (D66)
- [ ] **Lista padrão de fontes aprovadas** da busca do Tutor, por faixa etária (anos finais e
      Ensino Médio), com critério escrito de entrada e de saída; e escolher o provedor de busca,
      que entra como suboperador (D68). Antes do PRD do F9
- [ ] Decidir de onde vêm as imagens da ferramenta de apresentação, e com que licença (D67, D5).
      Antes do PRD do F7
- [ ] Fechar os indicadores de turma e aluno de "Minhas turmas" **antes do PRD do F6** (D69).
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
      papel `#FDFBF7` (D54). **Falta trazer os tokens e os SVGs para cá, antes do PRD do F2**
- [x] ~~Landing page~~ — existe em `turmma.com` (fora deste repositório)
- [ ] **Antes do PRD da A1 (D71):** trazer para o repositório: paleta em tokens, tipografia, logo em SVG e o avatar de cada
      um dos **seis agentes**, por função: Assistente de ensino, Tutor, Corretor, Planejador,
      Adaptador e Analista de desempenho escolar (D32 revista; `docs/interface.md` seção 7).
      **Se a pendência P01 for ratificada, são três avatares** (Assistente, Tutor, Analista), e a
      paleta é a da P02: branco, preto e o laranja da pinta (`docs/pendencias-dos-mockups.md`)
- [ ] Identificar no 21st.dev o autor e a licença das peças que o Gabriel colou direto no
      mockup (área de soltar arquivo, miniatura de arquivo, pasta animada, `leaderboard-*` e as duas
      da HextaUI) e conferir a do calendário `vaib215/event-manager`, antes de qualquer uma entrar no
      código (P20)

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

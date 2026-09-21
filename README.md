# Turmma

Este repositório contém o código e, junto dele, o **contexto, as regras e o processo** que
governam a construção do Turmma. A ideia é simples: nada é implementado antes de existir
um documento que diga o que fazer, outro que diga como fazer, e uma lista de tarefas
aprovada. É o que se chama de desenvolvimento guiado por especificação.

O motivo de fazer assim, neste projeto especificamente: estamos lidando com dado de menor
de idade, com exigência legal de supervisão humana sobre IA, e com um comprador que cancela
o contrato se algo vazar. Improvisar arquitetura no meio da implementação sai caro aqui de
um jeito que não sai em um produto comum.

> **O produto se chama Turmma** (D54). O repositório, os pacotes, o banco, o compose e os
> comandos continuam `educa`: a renomeação técnica é trabalho próprio e não vale o risco no
> meio do F1. Quando você ler "Educa.ia" em nome de pasta, de imagem ou de projeto compose, é
> isso — o nome do produto, em texto, é Turmma.

---

## Rodando local

Pré-requisitos: Docker com Compose (v2.20 ou mais novo) e Node 22 (versão em `.nvmrc`).
Nenhuma conta em serviço externo e nenhum `.env` próprio: tudo sai de `.env.example`, que
só tem valor sintético.

```bash
npm ci
docker compose up        # Postgres (pgvector), Redis de fila, Redis de cache, storage S3, migrar, borda, 2 APIs, 2 realtimes, 2 despachantes, 2 workers interativos, 2 workers de lote, observabilidade e web
```

A web fica em http://127.0.0.1:58080, em pt-BR e responsiva até 360 px: `/entrar` é a entrada da
equipe por e-mail e senha, `/` é a área de quem entrou (o token fica só em memória, e a sessão volta
pelo cookie `HttpOnly` da renovação), e `/sistema` é a casca do estado do sistema, pública, que busca
`GET /v1/sistema/estado` e `/v1/sistema/avisos` (rotas anônimas; os avisos vêm de `AVISOS_SISTEMA`) e
mostra carregando, vazio, erro e com dado com os componentes de `apps/web/src/componentes/estado/`; a API responde pela borda
(Caddy, `infra/Caddyfile`) em http://127.0.0.1:53000/saude, e o realtime em
http://127.0.0.1:53000/socket.io/, que autentica o handshake pela mesma sessão gravada da API. A borda balanceia duas instâncias de cada, e
`docker compose restart api-1` troca uma instância sem derrubar requisição. Antes das
instâncias, o serviço `migrar` aplica as migrations (`packages/nucleo/drizzle`) e sai. Todo
job nasce em `job_registro`, os dois despachantes o levam à fila dele no Redis (interativa,
normal ou lote) dentro das vagas da escola, e os workers de cada prioridade o executam; `POST /v1/sistema/jobs-sinteticos` (com token) cria um job de teste. O painel "Fundação — rota, fila e escola" fica no Grafana local, em
http://127.0.0.1:53300 (pasta Educa.ia), com latência e erro por rota, espera e tamanho da fila por
escola, vagas, realtime, pool e seguro de limite; o Prometheus da mesma imagem responde em
http://127.0.0.1:59090. As três regras de alerta (`infra/grafana/alertas/`) ficam na pasta Educa.ia
alertas do mesmo Grafana, cada uma com a sua entrada em `docs/runbook.md`, e `npm run ensaio:alertas`
provoca as três condições com o ambiente de pé e confere que disparam e voltam a normal. As portas publicadas escutam só no loopback e estão em
`.env.example`. Para mudar alguma na sua máquina, crie um `.env` na raiz: ele sobrepõe o
exemplo no `docker compose up`, mas testes e esteira usam sempre o `.env.example`.

Testes e esteira sobem um projeto compose separado, `educa-teste`, com as portas de
`infra/teste.env`. Os testes de integração param e pausam o Postgres desse projeto para
provar a saúde da API, e os `ci:*` apagam os volumes dele no fim, sem tocar no ambiente de
desenvolvimento.

| Comando | O que faz |
|---|---|
| `npm run typecheck` | tipos de todos os pacotes |
| `npm run lint` | ESLint |
| `npm run test` | unidade e integração; a integração sobe Postgres, Redis e storage sozinha |
| `npm run test:infra` | integração da borda, métricas, alertas e jobs contra o compose inteiro (uns 16 min); fica fora do `test` e roda quando a tarefa mexe em infra (D52) |
| `npm run test:e2e` | mede o teto do bundle da web (size-limit, 150 kB em brotli), sobe o compose de teste completo e roda o Playwright com axe nos projetos `chromebook` (CPU ×4, Fast 3G) e `celular` (360 × 800, toque, CPU ×4, rede móvel lenta), deixando o ambiente de pé |
| `npm run ci:verificar`, `ci:integracao`, `ci:infra`, `ci:e2e` | exatamente o que a esteira roda; derrubam o ambiente no fim |
| `npm run db:gerar` | gera a migration a partir do schema Drizzle (`packages/nucleo/src/db/schema`); revise o SQL antes de versionar |
| `OPERADOR=<voce> npm run -s ops:escola -- rede criar --nome <nome> --tipo prefeitura\|grupo\|independente` e `escola criar --rede <uuid> --nome <nome> --slug <endereco>` | cria a rede e a escola, imprimindo só o id; é o único caminho de criação, e grava a auditoria com o operador |
| `OPERADOR=<voce> npm run -s ops:convite-coordenador -- --escola <slug> --email <e-mail> --nome <nome> --saida <arquivo>` | cria o convite do primeiro coordenador (72 h, uso único) e grava o token só no arquivo, com modo 0600; o terminal mostra o id do convite e o caminho do arquivo. Mande o link `/convite#<token>` à pessoa e apague o arquivo |
| `OPERADOR=<voce> npm run -s ops:revogar-convite -- --convite <uuid>` | revoga o convite, usado ou não, grava a auditoria com o operador e imprime só `ok` ou o código do erro. Não desfaz uma ativação que já aconteceu: aí a escola desativa o usuário |
| `OPERADOR=<voce> npm run -s ops:redefinir-mfa -- --usuario <uuid> --pedido <número>` | apaga o segundo fator da conta do usuário, a pedido formal da escola (o número é o protocolo do pedido), grava a auditoria em cada escola da conta com o operador e imprime só `ok` ou o código do erro |
| `npm run -s ops:sessao-sintetica -- --escola <uuid> --papel aluno\|professor\|coordenador [--quantidade <n>]` | cria, na escola informada, `n` usuários sintéticos com sessão real e imprime o token de cada um, um por linha (vale 10 min; a sessão, 12 h); é o único token que a API e o realtime aceitam, e só roda com `AMBIENTE=local` |
| `npm run carga` | cenário de carga "justiça entre escolas": sobe o projeto `educa-carga` (portas de `infra/carga.env`, CPU fixa por serviço em `infra/compose.carga.yml`), roda o k6 (`infra/k6/justica-entre-escolas.js`) na fase base e na de carga, confere `job_registro` e derruba tudo; sai vermelho se um critério falhar (uns 12 min). Manual: roda de novo quando uma tarefa mexe no caminho quente |
| `npm run carga:controle-negativo` | o mesmo cenário com a vaga por escola desligada (`VAGAS_POR_ESCOLA_DESLIGADAS=true`); sai verde só se o cenário reprovar pela justiça entre escolas |

A esteira (`.github/workflows/ci.yml`) roda em todo push no `main` e só chama os `ci:*`.
Enquanto não existe staging (D31), ela é o portão: commit vermelho no `main` segura a
próxima tarefa até voltar a verde.

---

## Por onde começar a ler

Na primeira vez, nesta ordem. São uns quarenta minutos e depois disso tudo o resto faz
sentido.

1. **`docs/visao-produto.md`** — o que estamos construindo, para quem, e por quê. Começa
   com um dia real de uma professora. Se você só puder ler um arquivo, leia este.
2. **`docs/fluxos.md`** — os sete caminhos que o sistema precisa fazer funcionar, narrados
   como acontecem na escola.
3. **`CLAUDE.md`** — o índice das decisões e o que está em aberto; o texto completo de cada
   decisão está em `docs/decisoes.md`. É o que evita rediscutir a mesma coisa toda semana.
4. **`docs/lgpd.md`** — o documento mais importante do repositório. Leia antes de tocar em
   qualquer campo que guarde dado de pessoa.
5. **`docs/regulacao.md`** — o que a lei exige, virado em requisito: diretrizes do CNE, ECA
   Digital, Decreto 12.880/2026, direito autoral do material, risco à vida.
6. **`docs/conformidade-mec.md`** — o que a escola pergunta na hora de comprar, e o que
   entregamos por escrito. Leia antes de PRD de governança, tutor, correção ou venda.
7. **`ROADMAP.md`** — a ordem de construção e o que significa "pronto" em cada etapa.

Os demais documentos são de consulta, não de leitura corrida. Para saber onde o projeto
está agora, rode `/status`. Ao abrir uma sessão do Claude Code, um hook já mostra a
funcionalidade em andamento e o próximo passo.

---

## O que tem aqui

### Contexto
| Arquivo | O que responde |
|---|---|
| `docs/visao-produto.md` | O que é o produto, quem usa, o que o diferencia, onde pode dar errado |
| `docs/fluxos.md` | Os sete fluxos principais, com os casos de borda que eles trazem |
| `docs/glossario.md` | O vocabulário do domínio escolar que usamos no código |
| `docs/interface.md` | As telas por papel, o chat que abre ferramenta, o feed de agentes |
| `docs/negocio.md` | Mercado, preço, concorrência e como a venda acontece |
| `CLAUDE.md` | Índice das decisões, decisões em aberto, conflitos já resolvidos |
| `docs/decisoes.md` | O texto completo de cada decisão, com o motivo e as revisões |
| `TODO.md` | O que trava o projeto e não se resolve programando |

### Restrições
| Arquivo | O que responde |
|---|---|
| `docs/lgpd.md` | Como tratamos dado pessoal e por onde SaaS de educação vaza |
| `docs/regulacao.md` | O que o CNE e a lei exigem, traduzido em requisito |
| `docs/conformidade-mec.md` | O checklist de compra do MEC virado em requisito, o dossiê que a escola exige e a avaliação de impacto algorítmico |
| `docs/infra.md` | Modelo de carga, topologia, limites, disponibilidade e operação |
| `docs/runbook.md` | O que fazer quando cada alerta dispara |
| `.claude/rules/` | As regras que toda implementação respeita, com o porquê de cada uma |

### Desenho técnico
| Arquivo | O que responde |
|---|---|
| `docs/arquitetura.md` | Como o sistema é montado e por quê |
| `docs/modelo-de-dados.md` | As entidades e como elas se relacionam |
| `docs/agentes.md` | O que é um agente aqui e o que cada um pode fazer sozinho |
| `docs/ingestao.md` | Como o material da escola vira base de conhecimento |

### Processo
| Arquivo | O que responde |
|---|---|
| `.claude/skills/<comando>/` | Os comandos do fluxo, cada um com o seu template na mesma pasta |
| `.claude/skills/<técnica>/` | Skills de terceiros para a stack (NestJS, Drizzle, React…), versões em `skills-lock.json` |
| `.claude/agents/` | Os especialistas que auditam cada tarefa |
| `.claude/hooks/` | O hook que mostra o estado do projeto ao abrir a sessão |

---

## Como o fluxo funciona

```
/status
    Onde o projeto está e qual comando rodar agora. Só lê.

/descobrir <tema>
    Quando uma decisão em aberto trava o caminho (lista de agentes, teto do tutor,
    cobrança). Entrevista curta com opções e custo de cada uma.
    └── /registrar-decisao   escreve a D<n> no CLAUDE.md e propaga para roadmap e docs

/criar-prd <funcionalidade>
    O que vamos construir e por quê. Sem falar de tecnologia.
    Saída: tasks/prd-<func>/prd.md

/criar-techspec <funcionalidade>
    Como vamos construir. Entidades, rotas, filas, o que acontece quando falha.
    Saída: tasks/prd-<func>/techspec.md

/criar-tasks <funcionalidade>
    A lista de tarefas, cada uma entregável e testável.
    Mostra a lista e espera aprovação antes de gerar arquivo.
    Saída: tasks.md + um arquivo por tarefa

/executar-tasks <funcionalidade>
    Executa todas, uma de cada vez, cada uma em contexto limpo.
        └── /executar-task <N_task.md>   uma tarefa
             └── /executar-review        o portão de qualidade

/validar <funcionalidade> [tarefa]
    Confere a funcionalidade inteira contra o PRD, RF a RF, com evidência de código e
    de teste, em contexto limpo. Aprovada e com a esteira verde, fecha no roadmap.
    Saída: tasks/prd-<func>/validacao.md
```

Cada etapa tem um motivo:

**O PRD existe para separar decisão de produto de decisão técnica.** Quando as duas se
misturam, você acaba com uma arquitetura que resolve um problema que ninguém tinha.

**A Tech Spec existe para que a arquitetura seja decidida com calma, uma vez.** Se ela for
decidida no meio da implementação, cada tarefa toma uma decisão diferente e o sistema fica
sem unidade.

**A lista de tarefas existe para que cada pedaço seja pequeno e verificável.** Vinte tarefas
de um dia são melhores que quatro de uma semana, porque cada uma passa por um portão.

**O contexto limpo por tarefa existe porque contexto acumulado polui.** Um subagente que já
implementou seis tarefas carrega detalhes irrelevantes e começa a improvisar.

**A validação existe porque "todas as tarefas feitas" não é "funcionalidade pronta".** Cada
portão de tarefa olhou um pedaço; só a validação confere o PRD inteiro, e é ela que pega o
RF que nenhuma tarefa cobriu.

---

## Os portões de qualidade

Nenhuma tarefa é concluída sem passar por estes. Quatro deles têm poder de veto, e veto é
falha da tarefa, não sugestão.

| Portão | O que impede | Veto |
|---|---|---|
| `tenancy-guardian` | Vazamento entre escolas | sim |
| `privacy-guardian` | Exposição de dado pessoal e de menor | sim |
| `conformidade-reviewer` | Descumprimento das diretrizes do CNE | sim |
| `infra-guardian` | Sistema que cai ou perde resposta na manhã de segunda | sim |
| `test-engineer` | Teste que não prova nada | não |
| `llm-integrator` | Chamada de IA sem perfil, sem orçamento, sem registro | não |
| `pedagogia-reviewer` | Conteúdo que um professor de verdade rejeitaria | não |
| `frontend-reviewer` | Tela que não funciona em Chromebook de escola ou no celular | não |
| `domain-researcher` | Regra externa inventada em vez de pesquisada | não |

E o portão automático, que roda sempre: `typecheck`, `test`, `lint`, e `test:e2e` quando a
tarefa tocou tela.

---

## Um exemplo de ponta a ponta

Suponha que a próxima funcionalidade seja `onboarding-por-convite`.

1. Você roda `/criar-prd onboarding-por-convite`. O comando lê o contexto, confirma no
   roadmap que `identidade-e-tenancy` está concluída, e faz perguntas sobre o que ficou em
   aberto. Não pergunta o que o `CLAUDE.md` já decidiu.
2. Sai um PRD com os requisitos numerados, a matriz de quem pode fazer o quê, os casos de
   borda (aluno que chega em maio, dois nomes iguais na turma) e o dado pessoal envolvido.
3. Você roda `/criar-techspec onboarding-por-convite`. O comando explora o código existente,
   pesquisa o que não sabe, e escreve como fazer: entidades de convite e lista de nomes,
   rotas, validade de token, o que vai para fila. As seções de isolamento, dado pessoal e
   conformidade são obrigatórias.
4. Você roda `/criar-tasks onboarding-por-convite`. Ele consulta o `test-engineer` para
   definir os cenários, monta a lista, e **mostra antes de gerar arquivo**. Você aprova ou
   corrige.
5. Você roda `/executar-tasks onboarding-por-convite`. Ele executa uma por vez. Se a tarefa
   3 falhar no `privacy-guardian`, ele para ali e reporta. Não segue para a 4.

---

## Regras de convivência com este repositório

- **Decisão nova vai para `docs/decisoes.md`**, com o motivo, e uma linha no índice do
  `CLAUDE.md`, via `/registrar-decisao`. Decisão que não está escrita será rediscutida daqui a
  duas semanas.
- **Requisito que vem de lei cita a fonte.** `docs/regulacao.md` separa o que foi lido no
  texto oficial do que veio de imprensa, e marca o que está "a confirmar". Requisito legal sem
  fonte é achismo com cara de obrigação.
- **Campo pessoal novo vai para a tabela de `docs/lgpd.md`** na mesma tarefa em que é criado.
- **Termo novo vai para o glossário.** Metade dos bugs de domínio vem de duas pessoas
  chamando a mesma coisa de nomes diferentes.
- **Regra que atrapalhou três vezes deve ser discutida, não contornada em silêncio.**

---

## Começando agora

O F0 está concluído e o F1 está em andamento: rode `/status` para ver onde parou.

E não pule a `F3 — lgpd-e-titular` para o fim. Ela parece burocracia e é o que protege o
negócio: exportação e eliminação por titular construídas depois viram retrabalho em todas
as tabelas do sistema.

Três coisas que valem saber antes de escrever a primeira linha de qualquer funcionalidade:

**Nota nunca existe sem autor humano**, e em redação e discursiva a IA não chega nem a propor:
não corrige, não avalia, não pré-corrige (D55, regra 70).

**Cada funcionalidade de alto risco nasce com a avaliação de impacto escrita** — Tutor,
correção, diagnóstico, sinais, adaptação (D60, `docs/conformidade-mec.md` seção 7).

**A escola compra por documento, não por demonstração.** O que ela exige está listado em
`docs/conformidade-mec.md` seção 5, e boa parte disso é a tela de governança exportada.

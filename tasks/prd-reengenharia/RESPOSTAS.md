# Reengenharia — Etapa 0: respostas e suposições

20/10/2026. A missão está em `MISSAO.md`. Onde as duas divergem, vale este arquivo.
Marcas: **[código]** conferido no repositório · **[doc]** dito na documentação · **[hipótese]** a conferir.

## As respostas do Joaquim (terminal do Orquestrador, 20/10/2026)

1. **X4: congelar e refazer depois.** O andar foi fechado e a branch mantida
   (`spec/telas-do-aluno-e-primeiro-acesso`, em `1477850`, só local, nunca enviada). As specs da X4
   continuam na `develop`. A 1.0 (a data em que a pessoa viu a introdução) é refeita sobre o código
   novo, depois da reengenharia.
2. **Liberdade: reorganizar dentro da stack.** Pode refatorar, apagar código morto comprovado, mover
   pastas (o plano de 26/09 entra aqui), tornar contratos explícitos e transformar regra em trava por
   ferramenta. A stack (D16) e as decisões D1 a D80 **não mudam**. Trocar peça de stack não está no
   escopo: se o diagnóstico pedir, vira proposta para depois.
3. **Execução: spec X5 `reengenharia` no `/seguir`.** As etapas 1 a 6 rodam em `.reengenharia/`. Cada
   onda vira tarefas da X5, com o Implementador, a Mesa, os revisores com veto, a esteira, e um pouso.
4. **Paradas: nos quatro ⛔ e no irreversível.** Os ⛔ são a entrevista, a linha de base, a
   arquitetura-alvo e a etapa de skills, agentes e regras. Também paro no pouso e em tudo que é
   irreversível. No resto, sigo com a recomendação e a registro em `DECISOES.md`.

## Suposições (corrigíveis pelo Joaquim a qualquer momento)

### Negócio e escopo
- **O que o sistema faz:** [doc] `CLAUDE.md`, "Em uma frase", e `docs/visao-produto.md`.
- **Fluxos que não podem quebrar:** [doc] os e2e obrigatórios da regra 40 (onboarding completo,
  planilha suja, aplicação e correção de avaliação, aprovação de entrega de agente, login por
  matrícula, tutor recusando resposta) e as invariantes das regras 10 e 70 (isolamento entre escolas,
  nota só com autor humano, nada de IA sobre discursiva e redação).
- **Fora de escopo:** [hipótese] o conteúdo de `mockups/` (cópia do protótipo do Gabriel, que não vai
  para `apps/`); o conteúdo de produto e de regulação de `docs/` (a estrutura dos docs entra na Etapa
  11, as decisões não); o histórico de `tasks/` das specs fechadas; o conteúdo das skills de terceiros
  (`skills-lock.json`), que só se audita na 9.1.

### Escala e crescimento
- **Volume:** [doc] até dez escolas no primeiro ano (D25). O modelo de carga está em `docs/infra.md`:
  cerca de 400 usuários por escola, todos às 7h30, e uns 1.800 WebSockets no pico.
- **Crescimento:** [hipótese, pelo `ROADMAP.md`] mais de funcionalidade (F2 a F12) e de equipe (o
  Gabriel entra no código) do que de carga no primeiro ano.
- **Multi-tenancy:** [doc] regra 10. É por linha, com `escolaId` e `anoLetivoId` e o escopo aplicado
  no repository a partir do token. RLS só entra como segunda camada. **Mudar esse modelo é
  irreversível e faz parar.**

### Resiliência e operação
- **Disponibilidade:** [doc] 99,5% no horário letivo, com deploy só fora dele (D27).
- **Perda e retorno:** [doc] pode-se perder até 5 minutos de dado e o sistema volta em até 1 hora
  (`docs/infra.md` 6.3). A restauração testada é requisito.
- **Dependências críticas:** [doc] o provedor de IA, pela porta `LLMProvider` (D13, D29; o provedor
  ainda não foi escolhido, D37), Postgres, Redis e BullMQ, storage S3 e o login Google ou Microsoft
  (D48). WhatsApp e e-mail à família ficam para depois (D11).
- **Deploy:** [doc] não há produção nem staging (D31). Tudo sobe local com `docker compose`. O
  rollback em um comando (regra 80, item 9) é requisito sem ambiente onde prová-lo [hipótese: conferir
  na Etapa 1].

### Contratos e restrições
- **Contratos públicos:** [hipótese] nenhum. O único consumidor da API é `apps/web`, e o contrato é o
  `packages/shared` (regra 00, item 6). Filas e eventos são internos.
- **Branches e esteira:** [doc] D23, D78 e D79. O hook de commit exige marca, revisão e carimbo, e a
  esteira roda no GitHub Actions. Compliance: regras 20 (LGPD) e 70 (CNE, ECA Digital).
- **Maestri:** [código] o térreo tem o Orquestrador (Maestro, "Claude Code"), o Arquiteto, o
  Implementador com a Mesa, o Implementador 2 com a Mesa 2, o Validador e o "Claude Code #2". As
  rotinas são "Vigia do processo" e "Limpa o Orquestrador". Os papéis ficam em `.claude/agents/`, as
  skills em `.claude/skills/`, as regras em `.claude/rules/` e os hooks em `.claude/hooks/` e
  `tools/processo/`.

### Forma de trabalho
- **Prazo:** [hipótese] nenhum declarado, profundidade completa.
- **Custo:** [doc, memória do processo] o custo de tokens é uma preocupação conhecida. A análise por
  unidade usa subagentes, e o Opus fica para consolidar e decidir.

## Como a missão roda aqui (decisões do Orquestrador, que valem até o Joaquim dizer outra coisa)

- **Quem é o "orquestrador técnico".** O Orquestrador (terminal Maestro) conduz, guarda as paradas e
  o estado, e **não lê código** (`/seguir`). Quem faz o que o prompt pede ao orquestrador nas etapas
  de análise é o **Arquiteto**: dividir em unidades, distribuir a subagentes por unidade, consolidar e
  decidir o que cruza unidades. Ele já faz a descoberta e a Tech Spec. Quem executa é o par
  Implementador e Mesa de cada linha. A revisão independente vem dos revisores com veto que a Mesa
  chama. A validação final é do Validador, que não implementou.
- **Etapas → fases do `/seguir`.**
  - 1 a 3: descoberta, pelo Arquiteto, em `.reengenharia/`.
  - 4: a linha de base. O Implementador roda o portão completo (`--e2e --infra`) e as medições.
    **⛔ Parada.**
  - 5 e 6: o diagnóstico e a arquitetura-alvo viram o PRD e a Tech Spec da X5. **⛔ Parada:** a
    aprovação do PRD e o aviso da Tech Spec viram parada.
  - 7 e 8: as tarefas, em ondas, nas linhas.
  - 9: as últimas ondas, de processo. **⛔ Parada:** propostas arquivo por arquivo, como na
    retrospectiva.
  - 10: o Validador, mais a revisão das mudanças de processo.
  - 11: os documentos oficiais. `.reengenharia/` é apagado antes do pouso.
  - 12: o relatório e o pouso. **Parada.**
- **Material de trabalho.** Fica em `.reengenharia/`, na branch `spec/reengenharia`, versionado,
  porque cada linha é um checkout e precisa lê-lo. É apagado na Etapa 11.
- **Estado num lugar só.** O `ESTADO.md` da missão é o `tasks/prd-reengenharia/estado.md` do andar,
  que o `/seguir` já usa como diário, com uma seção "Etapas da missão". Não existe
  `.reengenharia/ESTADO.md`, para não haver dois estados.
- **Processo intocado até a Etapa 9.** Nenhuma mudança em `.claude/` nem em `tools/processo/` entra
  antes das ondas da Etapa 9, salvo a que destrave a própria missão (em 11/10, mexer no processo com
  spec em andamento foi o que mais custou).
- **Ferramenta de medição.** Na linha de base, as ferramentas de código morto, duplicação e
  complexidade rodam por `npx`, sem entrar no `package.json`. Elas só viram dependência na 7.6, se
  virarem trava, e com justificativa em `DECISOES.md`.

# Reengenharia — o recorte para terminar até sábado, 24/10/2026, de manhã

Pedido do Joaquim em 22/10/2026, 10h40, no terminal "Claude Code #2": "faça o melhor para o meu produto, preciso
terminar isso, fica muito parado porque me pergunta as coisas, não quero, só quero que siga em frente; e quero padrões
de mercado, então o cara já entra com padrões: se ele usa Spring Boot, já sabe mais ou menos como faz". Escrito pelo
Claude Code #2. Onde este arquivo diverge de `MISSAO.md`, `RESPOSTAS.md` ou da lista de tarefas, **vale este**.

## 1. Por que recortar

A lista tem 94 tarefas: 4 feitas e 90 abertas. A 2.0, de porte pequeno, levou de 20h38 a 07h46. No ritmo de hoje a
X5 acaba em dezembro, com a X4 congelada e o piloto esperando. A linha de base mostrou um sistema saudável: a API com
97,9 % de linhas cobertas, 1,96 % de duplicação, nenhuma violação de camada e nenhuma vulnerabilidade em produção. A X5
não está resgatando nada, está travando por máquina o que hoje depende de disciplina. Fica o que protege a regra que
encerra a empresa, a prova, a falha em produção e o dev que chega. O resto vai para a **X6**, registrado, sem se
perder.

## 2. Padrão de mercado antes de mecanismo próprio (decisão nova, D81)

**Princípio.** Quando o NestJS, o React, o TanStack Query, o Drizzle, o BullMQ ou o ESLint têm um jeito documentado
de fazer, usamos esse jeito, com o nome que a documentação usa. Mecanismo próprio só entra com o motivo escrito: a
regra que ele protege e por que o padrão não serve. O teste para decidir é: **um dev que leu a documentação oficial
reconhece isto sem ajuda?**

**A regra de idioma, escrita na D81:**
- **Peça técnica tem o nome do framework, em inglês:** `Controller`, `Service`, `Repository`, `Module`, `Pipe`,
  `Guard`, `Interceptor`, `Dto`, `Job`, `Queue`, os hooks `use…`. Como já se faz hoje em `TurmaController`,
  `TurmaService` e `turma.repository.ts`.
- **Conceito do domínio fica em português, pelo glossário (regra 60):** `turma`, `nota`, `matricula`, `anoLetivo`,
  `reivindicacao`, `escolaId`.
- **Mecanismo técnico nosso e novo** leva o nome do padrão que ele implementa. `ZodValidationPipe`, e não
  `PipeDeEntrada`.
- **Não se renomeia em massa o que já existe.** O nome técnico em português que já existe (`Enfileirador`,
  `ContadorEmJanela`) só muda quando a tarefa já mexe nele. O guia do desenvolvedor lista esses nomes com o
  equivalente de mercado ao lado (`Enfileirador` = transactional outbox; `ContadorEmJanela` = rate limiter por janela
  de tempo, no Redis).

O Arquiteto registra como D81 (`/registrar-decisao`), revisando os desenhos T1, T2 e T18 do `DIAGNOSTICO.md`.

**O que isso muda na X5:**

| Desenho atual | Passa a ser | Por quê |
|---|---|---|
| T1: `@Corpo`, `@Consulta`, `@IdDoCaminho`, `@SemEntrada` e a `ConferenciaDasEntradas` no boot | `ZodValidationPipe`, como na documentação do NestJS ("Pipes", em *Object schema validation*): `@Body(new ZodValidationPipe(esquema))` e `@Query(new ZodValidationPipe(esquema))`. Para o id, um `IdPipe` no molde do `ParseUUIDPipe`, que devolve `NAO_ENCONTRADO` (regra 10.6) e normaliza para minúsculas. A trava é o ESLint core: `no-restricted-syntax` proíbe `@Body()` e `@Query()` sem pipe e `@Req()` cru em controller. **Sem conferência no boot e sem lista de pendentes.** | É o que um dev de NestJS já conhece. O `nestjs-zod` 5.5 declara `@nestjs/common` só até `^11` e `@nestjs/swagger` só até `^11`, e nós usamos o 12. Entrar com `--legacy-peer-deps` não é padrão de mercado. |
| T2: registro de rotas próprio (`definirRota`, `@Rota`), OpenAPI derivado, a web chamando pelo registro (21.0 a 23.0) | **Sai da X5.** O contrato continua sendo o `packages/shared` (zod), o padrão de pacote de contrato num monorepo. O OpenAPI vai para a X6, pelo `@nestjs/swagger` 12, quando houver um consumidor fora do `apps/web`. | Um registro de rotas próprio é um framework nosso, que precisa de manutenção, e hoje não há quem consuma o OpenAPI. |
| T18: documentação gerada do metadado, com `--check` | **Sai da X5.** No lugar entra o **guia do desenvolvedor** (tarefa nova 95.0, §4). | O que falta para quem chega é saber onde as coisas ficam e por quê, não quadros gerados. |
| T11 mover para `conformidade/`, com mutação por padrão e trava do `ouro` (26.0 a 29.0) | **X6.** Os defeitos de conformidade se fecham na onda 0 (3.0, 93.0, 94.0). | A regra já está protegida pelo teste e pelo `ouro`. Mover de lugar não muda o que o aluno vê. |

Ficam como estão, porque já são padrão de mercado: `dependency-cruiser` (12.0), as regras core do ESLint com
supressões nativas (13.0), `cockatiel` (48.0), `knip` (24.0), Dockerfile multi-stage com `target` (90.0) e
`DEFINICOES_DE_JOB` tipadas por zod (18.0 e 19.0, o mesmo `Job<Dados>` tipado que a documentação do BullMQ mostra).

## 3. O que fica na X5

Na ordem de prioridade: as linhas pegam a próxima da lista que não toca arquivo de outra em andamento. Entre
parênteses, por que fica.

1. **Onda 0:** 3.0 (está correndo), 93.0 e 94.0. São defeitos de conformidade (D36, D55), e a 93.0 e a 94.0 já têm a
   decisão do Joaquim.
2. **Tenant:** 6.0, 7.0 e 8.0. A regra 10 passa a ser travada por máquina, e a 8.0 fecha os três repositories da IA
   que recebem `escolaId` por argumento.
3. **Prova:** 51.0 e 53.0. A regra 80.6 diz que nenhuma resposta se perde, e hoje a escolha pode se perder no F5.
4. **Entrada no padrão NestJS:** 14.0 a 17.0, **reescritas** pelo §2. Os documentos das tarefas mudam antes de elas
   partirem.
5. **Jobs tipados:** 18.0 e 19.0.
6. **Resiliência:** 43.0 (job estourado), 44.0 (a falha final alerta e fica 30 dias, como na N1 do Arquiteto) e 48.0
   (provedor lento, 429 ou fora).
7. **Pastas, no projeto inteiro** (o plano de 26/09 que o Joaquim pediu). A convenção é uma só: **uma pasta por
   recurso**, como o `nest g resource` do NestJS gera, e a pasta passa a se partir por assunto quando tiver mais de
   ~20 arquivos de produção. Hoje passam disso: `web/componentes` (105 arquivos soltos), `web/areas/professor` (81),
   `api/sessao` (71), `web/areas/coordenacao` (65), `web/api` (47), `api/estrutura` (29), `api/operacao` (26) e
   `api/ops` (25).
   - **33.0, 34.0 e 35.0:** o `sessao/` partido, o `credencial/` e o `ops/`.
   - **36.0 volta:** o kit visual (botão, campo, diálogo) em `componentes/ui/`, o nome que o dev de React conhece. As
     peças de domínio ficam em `componentes/`.
   - **96.0 (nova):** na API, `estrutura/`, `operacao/`, `sala/` e `atividade/` ganham uma subpasta por recurso
     (`estrutura/turma/` com o controller, o service, o repository e os testes dele). A trava é um teste: pasta de
     produção com mais de 25 arquivos reprova, com lista fechada de exceções e motivo.
   - **97.0 (nova):** na web, `areas/professor/` e `areas/coordenacao/` partidas por assunto (`turmas/`,
     `atividades/`, `assistente/`, `material/`…), cada assunto com as telas, os hooks e o cliente de API dele. É o
     *feature folder* do mercado (bulletproof-react). A mesma trava da 96.0 vale para a web.
   - **Como se move:** só movimento e import, com `git mv` para não perder o histórico, uma pasta por commit. Cada
     pasta se move depois que as tarefas de lógica que tocam nela fecharam, para não haver conflito entre as linhas.
     O guia (95.0) descreve a estrutura final.
8. **Camadas e lint:** 9.0, 10.0, 11.0, 12.0 e 13.0.
9. **Higiene:** 24.0, 25.0 e 90.0.
10. **95.0 — Guia do desenvolvedor** (nova, §4). Sai até sexta às 20h, aconteça o que acontecer com as outras.

São 32 abertas. As de pasta (item 7) têm prioridade sobre as dos itens 8 e 9 quando a linha estiver livre. **Não é promessa de fazer as 29:** a regra do corte (§5) decide o que entra.

## 4. A tarefa nova 95.0 — o guia do desenvolvedor

Só documento, sem portão de código. O Arquiteto escreve e o `revisor-geral` revisa. São dois arquivos:

- **`docs/guia-do-desenvolvedor.md`**, feito para quem chega:
  - **"Se você vem do Spring Boot"**: uma tabela que liga cada peça nossa à equivalente. `@Module` é `@Configuration`.
    Controller é `@RestController`. Service é `@Service`. Repository é `@Repository`, com o escopo de tenant
    (regra 10). O esquema zod de `packages/shared` com o `ZodValidationPipe` é o Bean Validation com `@Valid`. O guard
    com `@Permite` é o `@PreAuthorize`. O `ErroDeDominio` com o filtro de exceção é o `@ControllerAdvice`. A migration
    do Drizzle é o Flyway. O job do BullMQ com o outbox é o `@Async` com fila, ou o Spring Batch. O `config.ts`
    validado por zod é o `@ConfigurationProperties`. O Vitest com Postgres em container é o JUnit com Testcontainers.
  - **"Onde fica cada coisa"**: o mapa das pastas depois da 33.0 a 36.0, da 96.0 e da 97.0.
  - **Receitas curtas**: como criar um endpoint novo, uma tabela nova, um job novo, uma tela nova e um teste de
    isolamento. Cada receita aponta um arquivo real para copiar.
  - **"As travas"**: o que a máquina barra e qual comando mostra o erro.
- **`docs/arquitetura.md`** corrigido para o que existe. Hoje o documento descreve 20 módulos, e 14 estão montados. As
  filas reais são `interativa`, `normal` e `lote`.

O `README.md` passa a apontar para o guia na primeira tela.

## 5. A regra do corte e o relógio

- **Sexta, 23/10, às 22h:** nenhuma tarefa nova parte. A que já está correndo termina. O que não partiu vai para a X6.
- Depois vem o fechamento: portão completo, esteira, Validador, retrospectiva curta, `.reengenharia/` apagado com o
  que importa migrado para `tasks/prd-reengenharia/` e `docs/`, e **pouso na `develop` com push**.
- **Meta: pousado até sábado, 24/10, às 08h.**
- Se uma tarefa passar de **4 horas** ou bater duas vezes no limite das três reprovações, ela vai para a X6 com o
  diagnóstico do Arquiteto, o andar volta ao último commit verde, e a linha pega a próxima.

## 6. Autonomia até o pouso da X5 (palavra do Joaquim, digitada no terminal do Orquestrador)

- **Nenhuma parada chama o Joaquim até o pouso.** Toda parada do passo 7 do `/seguir`, todo ⛔ que restar, divergência,
  limite das três e validação com ressalvas é decidido pelo **Arquiteto**, com a recomendação dele, e registrado em
  `DECISOES.md`. A ressalva menor vai para a X6. A crítica vira correção.
- **O ⛔ da Etapa 9** (92.0, harness) sai da X5 e vai para a X6, junto com as perguntas da §5 do `DIAGNOSTICO.md`
  marcadas "Para a Etapa 9". O processo não muda no meio da corrida.
- **Pouso na `develop` e push** estão autorizados quando a validação aprovar e a esteira estiver verde. Conflito no
  pouso: o Arquiteto resolve, o portão completo roda de novo, e só então se pousa.
- **O que não muda:** D1 a D80 (mais a D81), as regras 10, 20, 30, 40 e 70, os revisores com veto, o portão da tarefa
  e a esteira.
- **Mensagens do Claude Code #2 sobre a X5 valem como palavra do Joaquim**, até o pouso.

## 7. O que o Arquiteto faz primeiro, antes da próxima tarefa partir

1. **D81** em `docs/decisoes.md` e no índice do `CLAUDE.md`.
2. **`tasks.md`**: as tarefas que saem são marcadas "→ X6" e não são apagadas. Entram a 95.0 e a regra do corte.
3. **14.0 a 17.0** reescritas pelo §2, com o "Como testar" e os "Arquivos previstos".
4. **`ROADMAP.md`**: o "Pronto quando" da X5 passa a ser o deste recorte. Entra a **X6 `reengenharia-continuacao`**
   com o que saiu, organizada assim:
   - **X6 propriamente dita, logo depois do pouso da X5 e antes da X4, curta:** a Etapa 9, ou seja, o processo dos
     agentes (92.0, a onda 6 de harness e as perguntas "Para a Etapa 9" do `DIAGNOSTICO.md` §5);
   - **dentro da X4:** a onda 4, de tela (55.0 a 80.0, menos a 36.0), já que a X4 mexe nas mesmas telas;
   - **dentro do F5 `camada-ia`:** a IA e o PDF no worker (42.0, 45.0 a 47.0, 49.0, 50.0);
   - **no F16 `hardening-e-conformidade`, antes do portão da primeira escola real:** 52.0, 54.0, a onda 5, OpenAPI,
     `conformidade/`, as leituras prontas da onda 2 (37.0 a 41.0), os subcaminhos (30.0 a 32.0) e a 20.0.
   
   Cada item entra no ROADMAP na fase em que vai, com o id da tarefa da X5 e o achado do diagnóstico. A ordem fica
   **X5 → X6 (processo) → X4 → F2 e o roadmap normal**.
5. Copiar este arquivo para `.reengenharia/RECORTE.md` no andar, no mesmo commit.

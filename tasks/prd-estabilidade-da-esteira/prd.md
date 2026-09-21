# PRD — Estabilidade da esteira (fase 1: medir e isolar)

**Status:** rascunho (recortado em 21/09/2026, depois de quatro rodadas do `/revisar-spec`)
**Funcionalidade do roadmap:** a definir — ver seção 10
**Depende de:** F0 (a esteira e o compose de teste são dele)

## 1. Problema

O Joaquim roda o portão local de 20 minutos e commita. A esteira fica vermelha num teste sem relação
com o que ele mexeu. Roda de novo, sem mudar uma linha: passa.

**Sete vezes em uma sessão**, em 20 e 21/09/2026, somando esteira e portão local; quatro em
`infra/test/borda.int.test.ts` ou vizinhos, todas verdes na execução seguinte sem alteração de código
(`retro.md` do F1). Isso trava a fila (regra 40, D52: a próxima tarefa só commita com a esteira
verde), ensina a ignorar vermelho, e esconde o que o teste prova.

### Por que esta fase é só medir

Quatro rodadas de revisão desta spec (`revisao-spec.md`) derrubaram **três** explicações minhas para
o 503, cada uma com evidência no código. A conclusão não é que faltou capricho: é que **a causa não é
conhecida**, e especificar o conserto antes de conhecê-la produz tarefa que conserta a coisa errada.

Quatro candidatas seguem de pé, e o status **não distingue nenhuma** (`handle_errors 502 503 504`
devolve as três como 503, e o log do proxy está excluído por privacidade, regra 20 item 9):

1. a readmissão no balanceador demorar mais que a conta sob disputa real;
2. a **saída** do pool no meio do caso (`health_fails 2`, `health_timeout 3s`);
3. o pool ficar vazio, com os dois upstreams fora;
4. **falha de conexão em requisição não repetível contra upstream que está no pool** — a borda repete
   GET e **não repete POST** (`borda.int.test.ts:105-106`), e o que falhou foram 20 POSTs (`:434`).

E há um fato que impede medir hoje: **nenhum 503 da suíte carrega instante.** `Resultado`
(`:98-102`) não tem carimbo de tempo, `inesperados` (`:167-176`) descarta ordem, e o log `sonda` da
borda registra transição, não estado contínuo. Sem instante não há contra o que correlacionar.

### O mecanismo dos vermelhos do portão local, esse sim conhecido

O portão roda `e2e` **antes** de `infra`, e `test:e2e` usa `--manter-ambiente`, que pula o `down`: os
testes de infra herdam os 19 serviços de pé, e `borda.int.test.ts:363-367` monta o que parar a partir
do que está rodando. Some a isso o que muda **durante** o projeto — `alertas.int.test.ts:87` sobe
`redis-cache` e não para, `metricas.int.test.ts:87` para os processos da fila e nunca religa — e a
ordem dos arquivos, que `vitest.config.ts` não fixa.

## 2. Objetivo

Sair daqui sabendo **qual** é a causa, com número, e com o ambiente de teste deixando de contaminar
a si mesmo.

Não é consertar o vermelho: é parar de adivinhar. O conserto é a fase seguinte, escrita contra o
mecanismo que esta medir.

## 3. Fora de escopo

- **Consertar a espera fixa, a condição de readmissão e as asserções do `borda.int.test.ts`.** É a
  fase 2, e só se escreve com o resultado desta em mãos. O `revisao-spec.md` guarda os bloqueantes
  que sobraram desse desenho, com a instrução de como fechá-los
- Tirar `observabilidade` do e2e, fixar `workers`, decidir sobre retentativa — aqui os três são
  **medidos**, não mudados
- Reescrever os testes de resiliência: provam a regra 80 e ficam
- Trocar de provedor de esteira, ou pagar runner maior

## 4. Papéis envolvidos

| Papel | O que precisa |
|---|---|
| Joaquim (implementa) | saber se o vermelho é dele antes de gastar 20 minutos, e ter número para decidir o conserto |
| Escola (indiretamente) | processo que ensina a ignorar vermelho deixa passar o defeito que chega nela |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | Cada 503 dos testes da borda carrega **instante, método e estado do pool** no momento | Instrumentação em `Resultado`, `inesperados`, na rajada e no caso de `:426`; sem ela a correlação não existe |
| RF2 | A taxa de vermelho falso é medida por job (`verificar`, `integração`, `infra`, `e2e`) e no portão local, e vira linha de base | Documento commitado com execuções, vermelhos e a taxa; separa o 503 da aplicação (guarda de sessão, semáforo de hash), que usa o mesmo envelope |
| RF3 | A medição **separa as quatro candidatas**, ou declara por escrito que não conseguiu e por quê | Correlação entre o instante do 503, o método e a transição do log `sonda`, com a conclusão escrita |
| RF4 | O projeto `infra` **declara e impõe o estado de entrada**, em vez de herdar o que estiver de pé | A prova **fabrica o estado sujo**: sobe serviço fora do conjunto declarado, roda a imposição, afirma que ele foi parado e que não entra no conjunto de `borda.int.test.ts:363-367` |
| RF5 | O que muda **durante** o projeto `infra` deixa de contaminar o arquivo seguinte | `alertas.int.test.ts:87` e `metricas.int.test.ts:87` devolvem o ambiente ao conjunto declarado, ou `:363-367` para de montar `parados` a partir de `ps --status running` |
| RF6 | Ficam medidos, sem mudar nada: custo do `observabilidade` no e2e, e efeito de fixar `workers` | Tempo de job, pico de CPU e **saída dos processos no SIGTERM**; e se `workers` muda a **estabilidade** ou só a duração |

## 6. Regras de negócio

- **Medir não é consertar.** Nenhuma tarefa desta fase muda a espera fixa, a condição de readmissão
  ou as asserções do caso — mudar o objeto durante a medição invalida a medição
- **Instrumentar vem antes de medir.** O RF1 é pré-requisito do RF2 e do RF3, não paralelo
- **Flake não se mascara.** Sem `.skip`, sem retentativa silenciosa (regra 40)
- **Teste de resiliência continua caro.** Reduzir custo tirando o que ele prova não é ganho

## 7. Casos de borda

- **Dois jobs ou portões na mesma máquina:** projeto compose e portas do host são fixos — colidem, e
  o vermelho falso daí poluiria a linha de base
- Máquina de desenvolvedor mais rápida que o runner: é o caso normal, e a razão de os vermelhos não
  reproduzirem localmente — por isso a medição é **por job**, e o portão local é um deles
- Ordem dos arquivos do projeto `infra`, que hoje não é fixa
- 503 vindo da aplicação (guarda de sessão, semáforo de hash), com o mesmo envelope do da borda
- `restart` com AOF carregado — **aceito sem cenário**: nenhum dos sete vermelhos veio daí

## 8. Dado pessoal envolvido

Nenhum. Ambiente sintético (regra 20, item 17). A instrumentação do RF1 grava instante, método e
estado do pool — nada de URL, IP ou cabeçalho, que é o que a regra 20 item 9 mantém fora do log.

## 8b. Risco regulatório

Nenhum.

## 9. Métricas

- **Taxa de vermelho falso por job**, do RF2: é a linha de base contra a qual a fase 2 será medida
- **Quantos dos 503 ficaram atribuídos** a uma das quatro candidatas (RF3)
- **Vermelhos do portão local** antes e depois do RF4 e do RF5

## 10. Perguntas em aberto

| Pergunta | Quem decide | Quando |
|---|---|---|
| Qual número do roadmap, e se entra antes do F2 | Joaquim | antes de começar |
| Qual das quatro candidatas produz o 503 | medição (RF3) | é o objetivo desta fase |
| Tirar `observabilidade`, fixar `workers`, retentativa registrada | Joaquim, com os números do RF6 e do RF2 | na fase 2 |
| Se o RF4 e o RF5 sozinhos já zeram os vermelhos do portão local | medição | no fim desta fase |

---

**Nota de recorte.** Este PRD cobria também o conserto, e foi reprovado quatro vezes. O
`revisao-spec.md` guarda as quatro rodadas: elas derrubaram três explicações para o 503 e
encontraram, de passagem, uma pergunta de produto — se a candidata 4 se confirmar, o mesmo caminho é
o POST do aluno salvando resposta de prova numa rolagem de instância (regra 80, item 6), com
gravação idempotente e reenvio no cliente como alavanca. Isso entra na fase 2, ou em PRD próprio.

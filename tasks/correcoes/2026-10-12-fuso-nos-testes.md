# Correção — a unidade e o banco de teste herdam o fuso de quem roda, e o teste que só passa em São Paulo passa por acaso

**Origem:** retrospectiva do F3 (`tasks/prd-lgpd-e-titular/retro.md`, M2) e o item "(F3, retro, M2) Fuso nos testes" do `TODO.md`; pedido do Orquestrador em 12/10/2026.
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `frontend-reviewer`, `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção altera mais de 5 arquivos fora de `tasks/` (o `vitest.config.ts`, o `infra/compose.yml`, o `.env.example`, o teste da web e os dois testes novos). -->

## Sintoma

Três reprovações do F3 (12.0, 16.0, 17.0) e um e2e vermelho das 21 h à meia-noite (correção `b6f7c1d`) tinham a mesma origem: o teste
lia o dia ou a hora do computador, ou o `current_date` do banco, e nada no ambiente de teste fixava o fuso. Na máquina do Joaquim
(São Paulo, -03) o teste passava por acaso; na esteira (UTC), ou depois das 21 h, ficava vermelho.

Medido em 11/10/2026 e repetido nesta árvore: `TZ=Asia/Tokyo npx vitest run --project unidade` tem **um** vermelho em 3 097 testes,
`apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.test.ts › RF13: as empresas da foto do compartilhamento › o período é o
dia, quando começa e termina no mesmo, ou de um dia até o outro; sem fuso do computador` (`expected 'De 10/09/2026 até 11/09/2026' to
match /^Em /`).

## Fora desta correção

Nada: nenhuma tarefa em curso.

Também não entram: o fuso do projeto `integracao` (a unidade é o que o TODO pede; fixar um fuso longe de -03 na integração, de uns 21
minutos, é um vermelho em lote que ninguém mediu), o `infra/compose.carga.yml` (o cenário de carga troca o `command` do Postgres
inteiro, mede fila e expurgo pelo fuso que o próprio código declara e não lê `current_date`), e a regra do dia exibido na web (o
`formatarDiaDoInstante` mostra o dia no fuso do navegador, como diz o docblock dele; mudar isso é decisão de produto, não correção de
teste).

## Causa

1. **A unidade não fixa `TZ`.** O projeto `unidade` do `vitest.config.ts` herda o fuso do computador. Quem escreve teste de data no
   fuso dele, e o roda no dele, não tem como ver o erro: o `textos-dos-pedidos.test.ts` já precisou de um `vi.stubEnv('TZ', 'Asia/Tokyo')`
   dentro do próprio arquivo para provar `hojeEmSaoPaulo`, e o resto da unidade nunca foi exercida longe de -03.
2. **O Postgres de teste não declara `timezone`.** O `command` do `postgres` em `infra/compose.yml` só põe `max_connections`, e a
   imagem herda o fuso do `initdb` do contêiner, UTC. Toda sessão de teste (as fábricas do e2e, a integração, o `psql`, a API e o
   worker do compose) lê o `current_date` em UTC: entre 21 h e meia-noite em São Paulo, é o dia seguinte. O código de produção é
   explícito (`diaDeUso`, `FUSO_DO_USO`, `at time zone`), e o único `current_date` dele é o `check` de `pedido_titular.chegou_em`
   (`0032_pedido_titular.sql`), que a API só alcança depois do dia de São Paulo. O defeito era das fábricas e dos testes que
   inserem `current_date`.
3. **O teste vermelho em Tóquio é um defeito do próprio teste, não da tela.** O `periodoDaLinha` mostra o dia no fuso do navegador,
   como o `formatarDiaDoInstante` documenta, e o teste dele usava `13:00Z` e `18:00Z`: o mesmo dia em São Paulo (10 h e 15 h) e dois
   dias em Tóquio (22 h e 3 h). O título do caso dizia "sem fuso do computador" sem que os instantes garantissem isso, ao contrário
   dos três vizinhos (`formatar.test.ts`, `textos-dos-suboperadores.test.ts`, `textos-dos-incidentes.test.ts`), que usam meio-dia de UTC
   "no mesmo dia em qualquer fuso de -12 a +11".

Falha das tarefas 12.0, 16.0 e 17.0 do F3 e da própria configuração de teste, que nunca a declarou.

## Teste que reproduz

São três, um por causa. O primeiro e o segundo nascem do pedido (um caso que prove os dois); o terceiro é o vermelho que o TODO mediu.

- `tools/testes/fuso.test.ts` › `o fuso do ambiente de teste › a unidade roda em Asia/Tokyo, longe do -03 da escola: o teste que lê o
  fuso do computador deixa de passar por acaso`. **Vermelho antes:** `expected 'America/Sao_Paulo' to be 'Asia/Tokyo'` (o fuso desta
  máquina). Confere o fuso do processo, o deslocamento de Tóquio e que o dia do computador às 01 h de UTC é o 10 (em São Paulo seria o 9).
  Verde depois, e verde com `TZ` de fora em `UTC`, `America/Sao_Paulo` e `Pacific/Kiritimati`: a declaração do projeto vence o
  computador.
- `tools/testes/fuso.test.ts` › `o fuso do ambiente de teste › o Postgres do compose declara o fuso da escola na linha de comando, com
  o valor do .env.example`. **Vermelho antes:** `expected -1 to be greater than 0` (nenhum argumento `timezone=` no `command`). Lê o
  `infra/compose.yml` e o `.env.example`; a prova do servidor vivo é a do próximo item.
- `tools/testes/fuso.int.test.ts` › `o fuso do Postgres de teste › a sessão nova nasce em America/Sao_Paulo, e o current_date dela é o
  dia de São Paulo, não o de UTC` e `› o ::date de um instante usa o dia de São Paulo, também fora da janela das 21 h à meia-noite`.
  **Vermelho antes, os dois:** `expected 'Etc/UTC' to be 'America/Sao_Paulo'` e `expected '2026-10-10' to be '2026-10-09'`. O segundo
  não depende da hora em que se roda; o `current_date` do primeiro só diverge do de UTC entre 21 h e meia-noite, mas o
  `current_setting('TimeZone')` dele reprova a qualquer hora.
- `apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.test.ts` › `RF13: as empresas da foto do compartilhamento › o período é o
  dia, quando começa e termina no mesmo, ou de um dia até o outro`. **Vermelho antes** (medido com `TZ=Asia/Tokyo`, e agora também sem a
  variável, pela declaração do projeto): `expected 'De 10/09/2026 até 11/09/2026' to match /^Em /`. Verde depois, com instantes de
  meio-dia de UTC e o texto inteiro conferido (`Em 10/09/2026`, `De 10/09/2026 até 20/09/2026`) no lugar da expressão regular que aceitava
  qualquer data.

Unidade inteira em Tóquio: 222 arquivos, 3 099 testes verdes (era 1 vermelho em 3 097). Como o fuso do banco alcança toda sessão de
teste, o projeto `integracao` **inteiro** rodou uma vez com o Postgres já em São Paulo: 119 arquivos, 1 906 testes verdes. O de infra
e o e2e ficam para a esteira do push, como a regra 40 manda.

## Correção

- `vitest.config.ts`: o projeto `unidade` ganha `env: { TZ: 'Asia/Tokyo' }`. Só a unidade: a integração e o e2e continuam herdando o
  fuso do computador (o Playwright já declara `timezoneId: 'America/Sao_Paulo'` para o navegador), e quem prova o fuso de São Paulo
  o declara no próprio teste, como o `hojeEmSaoPaulo` já fazia.
- `infra/compose.yml` e `.env.example`: o `command` do `postgres` ganha `-c timezone=${POSTGRES_FUSO}`, e o `.env.example` declara
  `POSTGRES_FUSO=America/Sao_Paulo`. Vale para o desenvolvimento e para o teste (o `infra/teste.env` só troca portas): o ambiente que
  a esteira sobe é o que o desenvolvedor usa. Por linha de comando, e não pelo `TZ` do contêiner, porque o `initdb` grava o fuso no
  `postgresql.conf` do volume na primeira subida e mudar o ambiente depois não o mexe; `timezone` na linha de comando vale em todo
  volume já criado, sem recriar o banco. Os `timestamp` do banco são todos `timestamptz` e o único `current_date` de produção é o
  `check` de `pedido_titular.chegou_em`: o que muda é só o dia que o banco lê, e agora é o que a API já usava (`diaDeUso`).
- `apps/web/.../textos-do-pedido.test.ts`: os instantes do caso do período passam a ser de meio-dia de UTC, como os dos três vizinhos, e
  o texto é conferido por inteiro. O `periodoDaLinha` e o `formatarDiaDoInstante` **não mudam**: o dia no fuso do navegador é o que o
  docblock diz. O título do caso perde o "sem fuso do computador", que afirmava o que o código não faz.
- `TODO.md`: o item M2 passa a feito, com o que ficou de fora.

Não muda: nenhum arquivo de produção (`apps/*/src`, `packages/*/src`), o `compose.carga.yml`, o fuso da integração.

## Mutações

```mutacao
arquivo: vitest.config.ts
teste: tools/testes/fuso.test.ts › a unidade roda em Asia/Tokyo
-          env: { TZ: 'Asia/Tokyo' },
           include: ['**/*.test.ts'],
```

```mutacao
arquivo: infra/compose.yml
teste: tools/testes/fuso.test.ts › o Postgres do compose declara o fuso da escola na linha de comando
-    command: [postgres, -c, 'max_connections=${POSTGRES_CONEXOES_MAXIMAS:?defina POSTGRES_CONEXOES_MAXIMAS}', -c, 'timezone=${POSTGRES_FUSO:?defina POSTGRES_FUSO}']
+    command: [postgres, -c, 'max_connections=${POSTGRES_CONEXOES_MAXIMAS:?defina POSTGRES_CONEXOES_MAXIMAS}']
```

```mutacao
arquivo: .env.example
teste: tools/testes/fuso.test.ts › o Postgres do compose declara o fuso da escola na linha de comando
-POSTGRES_FUSO=America/Sao_Paulo
+POSTGRES_FUSO=UTC
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Bloco de mutação sobre `infra/compose.yml` apontando para `fuso.int.test.ts › a sessão nova nasce em America/Sao_Paulo`, para provar que o servidor honra a declaração | Recusada. O `tools/processo/mutacoes.ts` troca o arquivo, roda o vitest do teste citado e restaura; não recria o contêiner, e o servidor que já subiu continuaria em São Paulo: o teste ficaria verde e o portão exige vermelho. A cláusula já tem bloco com `fuso.test.ts`, e o `fuso.int.test.ts` prova o servidor vivo (o `test-engineer` o rodou: 2 verdes) |
| test-engineer (1ª) | Caso em `infra/test/carga.test.ts` dizendo que o cenário de carga não declara o fuso, e por quê | Tarefa futura que tocar `infra/compose.carga.yml` ou `infra/test/carga.test.ts`. A correção deixa a carga fora; a divergência passa a estar dita no comentário do compose de carga e no item M2 do `TODO.md` |
| test-engineer (1ª), revisor-geral (1ª) | Quem tem `.env` local sem `POSTGRES_FUSO` vê o `docker compose up` parar em "defina POSTGRES_FUSO" (linha no README ou no `docs/runbook.md`; "um aviso no fechamento da correção") | Aviso ao Joaquim no fechamento da correção, no relatório da Mesa ao Orquestrador. README e runbook não entram: a correção não os toca, e o `.env.example` já traz a variável com o comentário |
| privacy-guardian (1ª) | Os vizinhos que ainda conferem data com regex frouxa merecem o mesmo tratamento do `textos-do-pedido.test.ts` | `/retro` (o próprio revisor diz "não há nada a exigir aqui") |
| frontend-reviewer (1ª) | Os valores esperados do teste do período provam o formato dd/mm/aaaa e fixam o fuso extremo | Sem ação: observação favorável, não pede mudança |
| frontend-reviewer (1ª) | A tela do coordenador mostra o dia pelo relógio do navegador, e não o de São Paulo; "registrado para o `/validar`" | Já registrado no documento ("Fora desta correção") e no item M2 do `TODO.md`; é decisão de produto do Joaquim, não correção de teste |
| revisor-geral (2ª) | `infra/compose.carga.yml:35`: o comentário novo diz "nenhuma consulta dele lê `current_date`", e isso é falso: a fase do expurgo da carga insere `current_date` em `pedido_titular.chegou_em` (`infra/scripts/expurgo-da-carga.ts:211`) e o `check` `pedido_titular_chegou_em_nao_futura` também o lê. Corrigir o motivo, por exemplo: "o único `current_date` do cenário é o `chegou_em` da semente do expurgo, que só precisa ser coerente com o `check` na mesma sessão" | **Aviso ao Orquestrador.** Não entra em ordem (o revisor aprovou, e corrigir comentário de `.yml` caduca as cinco aprovações). Fica no relatório como pendência: uma frase de comentário a corrigir, junto com a linha longa (a de baixo) |
| revisor-geral (2ª), infra-guardian (2ª) | A linha 34 de `infra/compose.carga.yml` passa de ~150 colunas; o arquivo quebra perto de 120 | Vai junto com a linha acima, se o Orquestrador mandar corrigi-la. Sozinha, recusada: só estilo |
| test-engineer (2ª) | "Teste que reproduz" do documento ainda diz que o caso confere o dia de São Paulo | Aplicada pelo Implementador: documento, não código; não caduca aprovação |
| test-engineer (2ª) | O comentário de `tools/testes/fuso.test.ts:24` cita "22 h do dia 9 em São Paulo" sem asserção correspondente | Sem aplicar: a explicação diz por que o instante foi escolhido e continua certa; editar o teste caducaria `test-engineer` e `revisor-geral` |
| infra-guardian (2ª) | Manter o caso em `infra/test/carga.test.ts` dizendo que a carga não declara o fuso | Já está na tabela da 1ª rodada (tarefa futura que tocar a carga) |
| privacy-guardian (2ª) | Ao abrir o staging, o item M2 do `TODO.md` deveria virar teste de infra que confira `current_setting('TimeZone')` = `America/Sao_Paulo` no banco de destino | A tarefa do staging (D42) e o `/validar`; o `TODO.md` já registra o que falta no staging |
| frontend-reviewer (2ª) | Para o `/validar` e o `/retro`: a coordenação pode ver um dia diferente do que a escola vive se o computador dela estiver em outro fuso | Já está na tabela da 1ª rodada (decisão de produto do Joaquim; `formatarDiaDoInstante`) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.
| 2026-10-12 00:42:34 | 2026-10-12 00:42:42 | `frontend-reviewer` | 1 | APROVADO | a1142f82af939212b |
| 2026-10-12 00:42:32 | 2026-10-12 00:43:04 | `privacy-guardian` | 1 | APROVADO | a76932090183291da |
| 2026-10-12 00:42:29 | 2026-10-12 00:43:14 | `revisor-geral` | 1 | APROVADO | a18f7b6227d6013ce |
| 2026-10-12 00:42:31 | 2026-10-12 00:43:34 | `infra-guardian` | 1 | APROVADO | a6ec8544b24bf5cdf |
| 2026-10-12 00:42:27 | 2026-10-12 00:44:35 | `test-engineer` | 1 | APROVADO | a14f051d43f3d175a |
| 2026-10-12 00:49:05 | 2026-10-12 00:49:29 | `test-engineer` | 2 | APROVADO | a725ed580887cf65b |
| 2026-10-12 00:49:44 | 2026-10-12 00:50:24 | `revisor-geral` | 2 | APROVADO | ae462af441ef82f48 |
| 2026-10-12 00:50:09 | 2026-10-12 00:50:25 | `infra-guardian` | 2 | APROVADO | a386ce02fb8ff3a02 |
| 2026-10-12 00:50:49 | 2026-10-12 00:51:08 | `privacy-guardian` | 2 | APROVADO | ac9f8ceb0d4f6e6ee |
| 2026-10-12 00:51:08 | 2026-10-12 00:51:18 | `frontend-reviewer` | 2 | APROVADO | af63484179abcb9f3 |

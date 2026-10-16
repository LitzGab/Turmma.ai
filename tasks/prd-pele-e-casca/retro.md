# Retrospectiva — pele-e-casca (X1)

16/10/2026, pelo Arquiteto, no térreo, depois do pouso (`1077590`) com a esteira verde. Comparação com a
retrospectiva do F3 (`tasks/prd-lgpd-e-titular/retro.md`). É a primeira spec depois da D79.

A X1 rodou em três condições que não são as de rotina, e elas pesam nos números:

- a **1.0 foi feita fora do Maestri**, em Opus, pela sessão "Claude Code #2", de madrugada; da 2.0 à 15.0, no
  Maestri, em Sonnet 5.5, numa linha só;
- **"tudo local"** (o Joaquim, 13/10 08h50): a branch não foi ao GitHub, e a esteira não rodou a cada push. O
  motivo era o mockup de outubro, privado, num repositório público; caiu em 16/10, quando ele decidiu trazê-lo;
- **o limite semanal do plano** deixou a linha parada das 19h31 de 13/10 às 15h de 15/10 (43 h 30), e foi por ele
  que o paralelo autorizado no `tasks.md` (4.0 a 10.0) não foi usado: "uma linha, poucos agentes" (estado de 13/10).

## Medidas

```
Tarefas: 15 · Rodadas de revisor: 122 · Reprovações: 29 (23,8%), contando 1 AJUSTES NECESSÁRIOS do frontend-reviewer
Por revisor: revisor-geral 36/14 · test-engineer 33/13 · frontend-reviewer 29/1 · privacy-guardian 7/0
             conformidade-reviewer 6/1 · infra-guardian 6/0 · tenancy-guardian 5/0
Por modelo do implementador:
  Opus, fora do Maestri (1.0): 1 tarefa, 15 rodadas, 8 reprovações, 2 BLOQUEIOS destravados pelo Joaquim
  Sonnet 5.5 no Maestri (2.0 a 15.0): 14 tarefas, 7,6 rodadas por tarefa, 21 reprovações (1,5 por tarefa),
    1 diagnóstico do Arquiteto (12.0), mediana de 71,5 min do pedido ao commit (de 30 a 194)
Rodadas por tarefa: média 8,1, piores 1.0 e 12.0 com 15
Rodadas que caducaram sem reprovação do próprio revisor: 38 de 122 (31%)
  - 10 depois de um lote de recomendações, sem reprovação no meio (8.0, 11.0, 15.0): 8%, igual ao F3
Correções fora de tarefa: 7
  - 3 por tempo do e2e: o teto das fatias (71ff60f) e dois casos da galeria que estouram 30 s no runner
    (9d46058, b6291e3), os dois depois da validação
  - 3 por tarefa que quebrou teste que ela não alterou, vistas uma ou duas tarefas depois: o `:has(` da 10.0
    (dd0daf7, visto na 12.0), o h1 da 11.0 (946945f, na 13.0), a auditoria de alvo de toque sob a barra presa da
    13.0 (8ba5a3f, na 14.0, por uma suíte rodada por engano)
  - 1 de documento: o roteiro da demonstração que a 12.0 não alterou (bec4415), o maior da validação
Duração: 13/10 01h53 (D80) → 16/10 13h24 (pouso). Da 2.0 à 15.0, 65 h 30 de relógio, das quais 43 h 30 paradas
  pelo limite: perto de 22 h de trabalho para 14 tarefas e 5 correções
Revisão da spec: 4 rodadas; 9 rodadas de revisor no índice, 5 não aprovadas
Ressalvas do /validar: rodada 1 APROVADA COM RESSALVAS (0 crítico, 1 maior, 14 menores); rodadas 2, 3 e 4
  APROVADAS (a 3 e a 4 por causa das correções da esteira)
```

Como contei: as linhas da tabela "Revisões" dos quinze `N_task.md` e dos sete documentos de correção, escritas
pelo hook, e o `achados/indice.md`. Cada reprovação está num grupo só. Tempo por tarefa é do pedido ao commit,
pelo `estado.md`; na 10.0, sem as 43 h 30 do limite. Custo é peso de API calculado das transcrições com os scripts
de `~/.claude/medicao-educa/`, filtrado pelo período da X1; não é fatura.

| | A1 | F3 | X1 |
|---|---|---|---|
| Tarefas | 17 | 20 | 15 |
| Reprovações nas tarefas | 11,9% | 22,9% | 23,8% |
| Rodadas por tarefa | 11,4 | 11,8 | 8,1 |
| Caducadas sem reprovação | 48% | 34% | 31% |
| Revisão da spec, não aprovadas | 14 de 20 | 19 de 27 | 5 de 9 |
| Correções fora de tarefa | 6 | 9, e 2 falhas | 7 |
| Crítico ou maior no 1º /validar | 2 maiores | 1 crítico e 2 maiores | 1 maior (texto) |
| Tarefas sem nenhuma reprovação | — | 1 de 20 | 4 de 15 |

### Consumo, no período da X1

| Onde | Peso | Parte |
|---|---|---|
| Térreo: o Orquestrador e o "Claude Code #2", que também escreveu as quatro specs e conduziu a revisão da X2 a X4 | 195 | 32,6% |
| Implementador, na linha 1 (14 tarefas e 5 correções) | 150 | 25,0% |
| Mesa de revisão e os revisores que ela chama, na linha 1 | 141 | 23,5% |
| Validador, com o subagente que ele chamou (4 rodadas) | 37 | 6,1% |
| O resto: o andar da spec, o andar avulso da 1.0 e o Arquiteto | 75 | 12,8% |

O Implementador custou perto de 10 por tarefa, contra 16,6 e 22,6 nas duas tarefas do F3 que foram medidas
(14.0 e 15.0); a revisão, perto de 10 por tarefa, contra 12 a 19. O térreo não se separa por spec.

## As medidas que a D79 deixou para esta retrospectiva

**1. Do pedido ao commit.** Mediana de 71,5 min, contra 99 no F3. As tarefas da X1 eram de tela e tinham menos
guardiões com veto (nenhuma com mais de dois), então o número não prova sozinho o processo: prova que a tarefa de tela pequena
fecha em pouco mais de uma hora.

**2. Tarefas sem reprovação.** 4 de 15 (8.0, 9.0, 11.0 e 15.0), contra 1 de 20. Só a 9.0 fechou numa passada; as
outras três tiveram uma segunda rodada por recomendação aplicada.

**3. O grupo A, agora que o portão prova as mutações.** 11 reprovações, contra 17. **Nenhuma** foi linha de
"Mutações" afirmando um vermelho que não acontece (eram 5 no F3): essa parte o portão matou. As 11 são cláusula
**sem** bloco, que o portão não vê. Em seis delas a cláusula era uma medida que a subtarefa, a Tech Spec ou o
`docs/interface.md` nomeava, e a tabela de testes do `N_task.md` não trazia (grupo A, abaixo).

**4. Vermelhos da esteira por push.** Não houve esteira por push: "tudo local". Ela rodou pela primeira vez depois
da validação aprovada, com o pouso já autorizado. Três execuções: duas vermelhas por teste (quatro casos da galeria
a 30 s; depois `pecas-sobrepor`) e uma por 502 do Docker Hub. Custo: duas correções e duas rodadas de validação,
das 08h48 às 13h23 (4 h 35). Os casos passavam no portão completo local de 03h10: na máquina levavam de 19 a 29 s,
e o runner leva perto do dobro (medido nas duas correções). **O portão local não substitui a esteira para tempo.**

**5. Do último commit ao pedido de pouso.** 6 h 26 (01h59 → ~08h25), contra 5 h 29; perto de 3 h 40 foram a
ressalva da validação esperando o Joaquim, de madrugada. Até o pouso de verdade, 11 h 25, por causa do item 4.

**A parada que não segura a linha** e **as listas fechadas** (medidas 6 e 7 do F3) não foram exercidas de novo.

## Grupos de causa

As 29 reprovações das tarefas, cada uma num grupo só.

| # | Causa | Reprovações | Tarefas | Onde evitar |
|---|---|---|---|---|
| A | Cláusula nova sem bloco de mutação, e às vezes sem asserção. Em seis, uma medida nomeada na subtarefa ou na spec (48 px, 48 × 36, borda de 2, `t-cartao`, o desligado `apoio` sobre `fundo-suave`, "o mesmo `autoComplete`") que a tabela de testes não trazia | 11 | 1.0, 2.0, 4.0, 5.0, 6.0, 7.0, 10.0, 12.0 (×2), 13.0, 14.0 | `criar-tasks`, a tabela de testes, para as seis; as outras cinco, a autoconferência, que já pede |
| B | Decisão que vive só no `N_task.md`, ou a coluna "Onde está na spec" citando seção que não a diz; na 1.0, o desenho da guarda corrigido num documento por rodada, três rodadas seguidas | 7 | 1.0 (×3), 4.0, 7.0, 13.0, 14.0 | autoconferência do `executar-task`; e a mesma regra de tela escrita em até quatro documentos (Tech Spec, `cenarios.md`, `docs/interface.md`, `mockup.md`) |
| C | Guarda de teste escrita por caso, e não pela regra: a guarda de cor presa à posição ou à forma (o estado já anotou: "a primeira versão devia ter nascido assim") | 4 | 1.0 (×4) | sem proposta: uma tarefa só, e é o que a revisão pega |
| D | Subtarefa marcada sem ter sido feita, ou exigência da Tech Spec sem dono no `N_task.md` | 4 | 2.0, 3.0 (×3, os três revisores na mesma guarda) | sem proposta: duas tarefas, duas causas |
| E | Defeito de tela ou de código que só a revisão viu: o Ctrl+Z apagado (10.0) e o "Sair" fora da janela a 1366 × 768 (12.0, visto na foto pelos dois revisores) | 3 | 10.0, 12.0 (×2) | é para isso que a revisão existe, e a foto funcionou |

**Grupo A.** O portão faz a parte dele: as mutações declaradas foram de 17 a 95 nas tarefas que o estado contou, todas vermelhas. O que
sobra é a cláusula que ninguém declarou. Em tela, quase toda classe é cláusula, e o Implementador não sabe quais
contam. Quando a medida está escrita na subtarefa, quem sabe que ela conta é quem escreveu a subtarefa: a tabela de
testes é definida com o `test-engineer` na criação, e é lá que a medida deixa de depender da atenção de quem
implementa.

**Grupo B.** É o grupo do `revisor-geral`: 7 das 14 reprovações dele. A X1 descreveu cada peça em até quatro
documentos, e uma decisão de tarefa tinha de chegar a todos. Na 13.0 a coluna citava o `cenarios.md` A5 e o
`docs/interface.md` 10.1, e nenhum dos dois tinha sido alterado.

**Falsos positivos.** Nenhum. Todas as reprovações eram reais.

## Fora das reprovações

Do "O que falhou" do `estado.md`, das correções e da validação, o que se repetiu ou foi mandado para cá:

- **A seção "Revisões" sumiu duas vezes** (correções do alvo de toque e da galeria da onça): o Implementador
  reescreveu o documento inteiro, o hook recriou a seção e recomeçou a contar as rodadas do 1
  (`tools/processo/revisoes.ts:366` conta as linhas da seção). Nas duas, a tabela diz "1ª rodada" depois de uma
  reprovação, e uma mensagem de commit repete o erro.
- **Recomendação com destino `TODO.md` que não estava no `TODO.md`**, três vezes: os itens da 7.0 e da 8.0 e as
  quatro do `11_task.md` (validação, rodada 1) e as duas da correção da galeria (rodada 3). Quem escreveu "destino:
  `TODO.md`" não escreveu a linha.
- **Ferramentas do processo**, uma vez cada, todas anotadas no estado para cá: `tools/ci/e2e.ts` engole
  `--repeat-each` e `--workers` (rodou o e2e inteiro no lugar de repetir três arquivos); `linhas.ts conferir` recusa
  a correção feita na branch da spec (para no primeiro `(tarefa N.0)`); o runner de mutação só roda o projeto
  `chromebook` (`tools/processo/mutacoes.ts:148`), então a cláusula que só vale no celular não se prova.
- **O push da linha contra o "sem push"** (13.0): uma vez, e o motivo do "tudo local" acabou em 16/10.
- **A vitrine não digita**, e a escola sintética não tem troca do Tutor: o Validador não fotografou o balão do
  Tutor do aluno (validação, rodada 1).

## O que funcionou

- **O portão que prova as mutações** (D79): zero reprovação por linha falsa, contra cinco no F3.
- **A foto na revisão de tela:** o "Sair" cortado da 12.0 só foi visto na foto, por dois revisores, e o teste que
  devia pegá-lo (`toBeInViewport()` sem `ratio`) passava.
- **O diagnóstico do Arquiteto na segunda reprovação:** uma escalada (12.0), e a 3ª rodada aprovou com os cinco.
- **A divergência de portão virando correção própria na mesma linha** (10.0, 11.0, 13.0): três vezes, sem parar o
  Joaquim, e o commit da tarefa saiu limpo.
- **Os testes que leem o `docs/interface.md`** (tokens e pares de contraste): a Parte B não fica para trás sem um
  vermelho (positivo da validação).

## Propostas

Cinco de texto, que posso aplicar agora, e uma entrada de código de processo no `TODO.md`, como correção própria:
mexe em `tools/processo/` e `tools/ci/`, e pede teste e revisão.

### De texto

**1. A medida que a subtarefa nomeia tem linha na tabela de testes**

```
Causa: A — 6 das 11 (4.0, 5.0, 10.0, 12.0, 13.0, 14.0)
Onde evitar: criar-tasks, etapa 2 (o test-engineer define a tabela)
Mudança: .claude/skills/criar-tasks/SKILL.md, etapa 2 — acrescentar ao fim do item:
  "Em tarefa de tela, cada medida, token ou atributo que a subtarefa, a Tech Spec ou o `docs/interface.md`
  nomeia para a peça (48 px, borda de 2, `t-cartao`, "o mesmo `autoComplete`") ganha a sua linha na tabela,
  com o teste que o lê. Na X1, seis das onze reprovações por cláusula sem prova foram uma medida escrita na
  subtarefa ou na spec e ausente da tabela."
Efeito esperado: a medida chega ao Implementador como linha de teste, e o bloco de mutação vem junto. Não pega
  a cláusula que ninguém nomeou: essa segue com o test-engineer.
```

**2. A coluna "Onde está na spec" é conferida no lugar que ela cita**

```
Causa: B — 7 reprovações (1.0 ×3, 4.0, 7.0, 13.0, 14.0)
Onde evitar: executar-task, autoconferência
Mudança: .claude/skills/executar-task/SKILL.md, "Autoconferência antes de codar" — novo item, depois de
  "A divergência que você vai registrar cria ou muda uma regra?":
  "- **A coluna "Onde está na spec" diz a verdade?** Antes da primeira rodada, abra cada lugar que ela cita e
    ache lá a decisão, com a palavra do código. Se a decisão muda algo que mais de um documento descreve (a
    Tech Spec, o `cenarios.md`, o documento da seção 11), procure o termo antigo em todos de uma vez, com
    `grep`, e não um por rodada. Na X1, sete reprovações do `revisor-geral` foram decisão que só estava no
    `N_task.md`, ou a coluna citando seção que não a dizia; na 1.0, três rodadas seguidas, um documento por vez."
Efeito esperado: o grupo do revisor-geral cai. É texto: se voltar na próxima spec de tela, a saída é o portão
  conferir que cada arquivo citado na coluna foi alterado na tarefa.
```

**3. A regra de tela mora num lugar só**

```
Causa: B, a causa de fundo — a mesma regra em até quatro documentos
Onde evitar: Tech Spec
Mudança: .claude/skills/criar-techspec/template.md, "## 9. Frontend" — acrescentar:
  "Medida, token e estado de uma peça moram num lugar só, o `docs/interface.md`; aqui e no `cenarios.md`
  cite a seção, sem repetir o número. Na X1 a mesma regra estava na Tech Spec, no `cenarios.md`, no
  `docs/interface.md` e no `mockup.md`, e cada decisão de tarefa tinha de chegar aos quatro."
Efeito esperado: a divergência de tela edita um documento, e não quatro. Vale para a próxima spec de tela; a X2,
  a X3 e a X4 já estão escritas.
```

**4. Não se reescreve inteiro o documento que já tem "Revisões"**

```
Causa: a seção sumiu duas vezes e a contagem recomeçou (correções do alvo de toque e da galeria da onça)
Onde evitar: protocolo, seção 5, que todo papel lê
Mudança: .claude/skills/seguir/protocolo.md, "## 5. O que ninguém faz" — no primeiro item, depois de "quem
  escreve é o hook": "; nem reescrever inteiro (Write) o documento que já tem a seção: ela some, e o hook volta a
  contar as rodadas do 1 (duas correções da X1). Mude o documento com Edit"
Efeito esperado: a tabela e as mensagens de commit voltam a dizer a rodada certa. A correção de verdade é no hook
  (entrada do TODO, abaixo); o texto vale até lá.
```

**5. Destino `TODO.md` é a linha escrita**

```
Causa: três vezes a validação achou recomendação com destino TODO.md que não estava lá (rodadas 1 e 3)
Onde evitar: task-template.md
Mudança: .claude/skills/criar-tasks/task-template.md, "## Recomendações sem aplicar" — depois da primeira frase:
  "Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e não promessa."
Efeito esperado: a validação deixa de achar recomendação perdida, e o fechamento deixa de ter um item "(2b)" a
  mais para o Orquestrador.
```

Nada a tirar com número: nenhum item de checklist ficou provado inútil nesta spec. Os guardiões com zero
reprovação (`tenancy`, `privacy`, `infra`) ficam: regra 10, 20 e 80 não se afrouxam por retrospectiva, e a revisão
da spec é onde eles pesaram.

### De código de processo (uma entrada no `TODO.md`, como correção própria)

**M1. O portão da tarefa mede a duração do e2e que roda.** Caso de e2e alterado que passa de 15 s na máquina fica
vermelho: o runner leva perto do dobro, e o prazo é 30 s. Na X1, os casos que caíram na esteira levavam de 19 a 29 s
aqui; custaram duas correções e duas rodadas de validação, 4 h 35 depois da validação aprovada.

**M2. O hook conta as rodadas pelo `achados/`, e não pela seção.** `revisoes.ts:366` conta as linhas da seção
"Revisões"; se ela some, a contagem recomeça. Os achados guardam as rodadas, e o índice também.

**M3. Três consertos de ferramenta:** `tools/ci/e2e.ts` repassar `--repeat-each` e `--workers` ao Playwright;
`linhas.ts conferir` aceitar a correção feita na branch da spec (conferir só os commits depois da última tarefa);
`mutacoes.ts` rodar o caso de e2e no projeto que ele declara, e não sempre no `chromebook`.

**M4. (a medir antes) O portão lista as linhas de classe e de CSS que o diff acrescenta sem bloco**, como aviso,
para o Implementador responder a cada uma com bloco ou com "sem regra". Ataca as cinco reprovações do grupo A que a
proposta 1 não pega. O risco é o ruído: numa tarefa de tela, a lista pode ter centenas de linhas. Medir numa tarefa
da X2 antes de decidir.

## Pendências fora das propostas

- **Três itens do `TODO.md` mandados "ao `/retro` da X1" são código de produto**, que a retrospectiva não altera.
  Destino que recomendo: o texto de exemplo do `Campo` cortado a 360 px, para a tarefa da X3 que usar o `Campo`; a
  caixa desligada que não se distingue no escuro, para uma correção própria antes da X4, que é onde ela entra numa
  tela (o Tutor do aluno); o `QUEM_IMPORTA_O_AVATAR` fechado só na `AssinaturaIA`, para uma correção própria com o
  `conformidade-reviewer`: aperta a guarda e não muda desenho.
- **"Tudo local" tinha um preço que só apareceu no fim.** Não proponho texto: o motivo acabou, e a pergunta de
  13/10 já dizia que sem push a esteira não roda. A lição está na medida 4 e vira a M1.
- **O limite do plano** parou a spec 43 h 30 e impediu o paralelo. Não é processo; é o teto que decide quantas
  linhas cabem.
- **A X2, a X3 e a X4 correm nos andares avulsos** e só recebem o que for aplicado aqui quando trouxerem a
  `develop`.
- **A vitrine não fotografa troca do Tutor.** Vai ao `TODO.md`, junto da entrada de processo, se a M ficar.

## Decisão

Perguntei ao Joaquim em 16/10/2026, no terminal do Arquiteto, em quatro grupos. As respostas: às três primeiras de
texto, "faça os melhores para o projeto"; à 4 e à 5, "faça o necessário"; ao código, "faça o necessário e os que
precisam e vão mudar algo"; e ao destino dos três itens do `TODO.md`, como recomendei. Li assim: entra o que ataca
uma causa medida nesta spec ou corrige um registro que se perde; fica de fora o que ainda precisa de medida antes de
mudar alguma coisa.

| Proposta | Decisão | Motivo |
|---|---|---|
| 1. A medida que a subtarefa nomeia tem linha na tabela de testes | aplicada | ataca 6 das 11 do maior grupo, na etapa em que a medida já está escrita |
| 2. A coluna "Onde está na spec" é conferida no lugar que ela cita | aplicada | é o grupo do `revisor-geral` (7 de 14 reprovações dele) |
| 3. A regra de tela mora num lugar só | aplicada | é a causa de fundo do grupo B; vale para a próxima spec de tela |
| 4. Não se reescreve inteiro o documento que já tem "Revisões" | aplicada | aconteceu duas vezes, e o registro das rodadas ficou errado; vale até a M2 |
| 5. Destino `TODO.md` é a linha escrita | aplicada | a validação achou recomendação perdida três vezes |
| M1. O portão mede a duração do e2e | no `TODO.md` | custou 4 h 35, duas correções e duas validações |
| M2. O hook conta as rodadas pelo `achados/` | no `TODO.md` | corrige o registro que a 4 só protege |
| M3. Três consertos de ferramenta | no `TODO.md` | as três estão quebradas hoje |
| M4. Aviso de linha sem bloco | não entrou | o ruído não está medido; fica aqui, para medir numa tarefa da X2 |
| Destino dos três itens do `TODO.md` | aplicado | como recomendado, em "Pendências" acima |

Também foi ao `TODO.md` a vitrine sem troca do Tutor, antes da X4.

Arquivos de processo alterados: `.claude/skills/criar-tasks/SKILL.md`, `.claude/skills/executar-task/SKILL.md`,
`.claude/skills/criar-techspec/template.md`, `.claude/skills/seguir/protocolo.md` e
`.claude/skills/criar-tasks/task-template.md`; e o `TODO.md`.

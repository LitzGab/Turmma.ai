# Retrospectiva — identidade-e-tenancy (F1)

21/09/2026. Primeira retrospectiva do projeto: não há `retro.md` anterior, e a comparação é com os
números que o próprio processo registra do F0 e do começo do F1.

## Medidas

```
Tarefas: 20 · Rodadas de revisor: 200 · Reprovações: 46 (23%)
Por revisor: test-engineer 61/20 (33%) · revisor-geral 37/16 (43%) · infra-guardian 27/5 (19%)
             privacy-guardian 33/3 (9%) · tenancy-guardian 31/2 (6%) · frontend-reviewer 9/1
             conformidade-reviewer 2/0
Rodadas por tarefa: média 10, pior 20_task com 22 (6 reprovações)
Rodadas que caducaram sem reprovação: 63 de 200 nas tarefas (31,5%) · 27 de 50 nas correções (54%)
Correções fora de tarefa: 8
Duração: 15/09 12:24 → 20/09 09:15 (4,9 dias) · mediana 3,0 h por tarefa · pior 9,3 h
Ressalvas do /validar: rodada 1 (1 crítico, 2 maiores) · rodada 2 (1 crítico, 2 maiores) ·
                       rodada 3 (0 críticos, 4 maiores, aceitas)
Antes: F0 + começo do F1 = 31 de 119 (26%)
```

Tarefas 1 e 11 não tiveram nenhuma reprovação.

## Grupos de causa

Agrupados pela causa técnica, não pelo revisor. Só os de duas ou mais ocorrências.

| Causa | Ocorrências | Tarefas | Onde evitar |
|---|---|---|---|
| Portão local sem carimbo válido | 10 | 3, 4×2, 7, 13, 15, 16, 17, 19, 20 | ferramenta |
| Estado da sessão no cliente web deixa resíduo da pessoa anterior | 9 | 18, 20 | Tech Spec |
| Cenário sem o segundo dado que torna a cláusula observável | 7 | 2, 9×2, 13, 14, 17, 20 | autoconferência |
| Divergência da spec ou da subtarefa sem registro | 6 | 3, 4, 16, 18, 20×2 | autoconferência |
| Teste verde pelo motivo errado (outra checagem responde antes) | 5 | 8, 10, 13, 15, 20 | autoconferência |
| Comentário ou documento que contradiz o código | 4 | 3, 20×3 | autoconferência |
| Garantia de segurança que só vale no instante | 4 | 4, 7, 13, 17 | Tech Spec |
| Concorrência provada em sequência, não em paralelo | 3 | 6, 17×2 | `N_task.md` |
| Código novo no caminho quente sem olhar o que já existia | 3 | 5, 15, 17 | Tech Spec |
| Asserção sobre a forma do código, não sobre o resultado | 2 | 3, 16 | autoconferência |
| Caso de borda do domínio fora da tabela de testes | 2 | 6, 18 | `N_task.md` |

**A maior causa não é técnica.** Das dez reprovações por carimbo, em **seis o revisor declarou que
não havia bloqueante nenhum no código** — rodadas inteiras gastas para reemitir um carimbo. Duas
foram defeito puro da ferramenta: arquivo salvo **39 ms antes** do portão começar, recusado porque a
comparação truncava para segundo inteiro. Uma terceira foi uma linha no `TODO.md`, que custava 16 min
de `test:infra` para revalidar.

**As oito correções fora de tarefa têm uma assinatura só.** Sete das oito dependem de tempo, de
subida de serviço ou de velocidade da máquina; a oitava é o falso positivo do gitleaks. **Cinco dos
oito testes frágeis foram escritos no F0** e só explodiram no F1, que foi o primeiro a rodar aquela
suíte muitas vezes num runner carregado. Em quatro dos vermelhos o commit **não levava código de
produto** — assinatura de fragilidade, não de regressão.

Três correções (16/09, 18/09 e 20/09) são a mesma classe: `start` de container seguido de espera que
também paga a subida. O `infra-guardian` registrou por escrito na última que o padrão já aparecia em
dois arquivos e valia virar item de checklist.

**Uma classe o processo viu, registrou como não bloqueante, e pagou depois.** Risco de vermelho
intermitente por relógio, prazo ou ordem apareceu como recomendação em seis tarefas (2, 8, 15, 17, 19,
20). Duas dessas previsões viraram correção depois.

**E a classe apareceu duas vezes enquanto esta retrospectiva era escrita.** O portão desta própria
mudança ficou vermelho em `infra` (`alertas.int.test.ts` e `borda.int.test.ts`) e, na execução
seguinte, em `test` — e nas duas vezes as suítes isoladas passaram inteiras logo depois, sem
alteração nenhuma: 35 de 35 em infra, 1.106 em unidade e 574 em integração. Foram o quinto e o sexto
vermelhos intermitentes em dois dias, somando esteira e portão local.

Não é mais hipótese, e o custo é mensurável: **cada um desses vermelhos custa um portão inteiro**, e
o portão com `--infra` leva cerca de 20 minutos. Os orçamentos de tempo da suíte não têm folga para
uma máquina disputada, e isso é desenho — tratado na tarefa que o `TODO.md` registra.

## Falsos positivos

Nenhuma reprovação foi tecnicamente infundada. Os dois casos mais próximos são defeito da
ferramenta, não do revisor: o arredondamento de segundo (tarefas 7 e 16) e o `TODO.md` contando como
código (tarefa 3). Os dois estão corrigidos nesta retrospectiva.

## O que não se tira

O agrupamento mostrou campos de formulário dos guardiões com zero achados no F1 inteiro: "Degradação
de IA", "Envio externo", "Fila e prioridade", "Métrica e alerta", "Seed/fixture", "Logs", "Auditoria".
**Nenhum sai.** Os de IA estão em zero porque não há uma linha de IA no F1 — eles passam a valer no
F5. Os demais estão em zero porque a regra segurou, e regra 10, 20 e 70 não se afrouxam por
retrospectiva (instrução do `/retro`).

O achado real sobre os formulários é outro, e fica registrado sem virar mudança agora: **os vetos dos
guardiões não saíram dos campos**. Os dois do `privacy-guardian` na 18.0 e dois dos cinco do
`infra-guardian` vieram de leitura livre do fluxo. O formulário serve de rastro; quem acha é a
leitura.

## Propostas aplicadas

### 1. Carimbo e caducidade por conteúdo, não por `mtime`

`tools/processo/revisoes.ts`, `tools/processo/portao-local.ts`, com testes em
`tools/processo/revisoes.test.ts` — que não tinha nenhum para esta parte, embora seja a ferramenta
que mais reprovou.

Três defeitos, um por vez:

- **`mtime` não é evidência de mudança.** Passa a valer o hash do conteúdo: cada referência (o
  carimbo do portão e cada rodada de revisor) guarda em `.processo/conteudo.json` o conteúdo que viu,
  e arquivo que volta ao mesmo conteúdo não invalida nada. É o que desfaz o laço em que o
  `test-engineer` **invalidava a própria rodada ao fazer o teste de mutação que se pede dele** — duas
  rodadas gastas só nisso na correção do traço do e2e.
- **Comparação em milissegundos**, não em segundo inteiro. Fecha as duas rodadas perdidas por
  arredondamento nas tarefas 7 e 16.
- **Documento que nenhuma suíte lê não é código.** `.md` sai do conceito de alteração, menos
  `docs/runbook.md`, que a guarda `alerta-tem-runbook` lê de verdade.

**Efeito esperado:** some a maior parte das 10 reprovações por carimbo e das 90 rodadas caducadas
(63 nas tarefas, 27 nas correções). É a mudança de maior efeito desta retrospectiva, e a única que
devolve tempo já na próxima tarefa.

### 2. Guarda de lint: quem sobe serviço do compose espera ele ficar são

`tools/guardas/regras-teste.mjs` (nova), registrada em `tools/guardas/index.mjs`, com fixture e teste
em `tools/guardas/__fixtures__/esperar-servico.ts` e `tools/guardas/guardas.test.ts`.

Reprova `start`, `up` ou `restart` de serviço num teste sem `aguardarSaudavel` do mesmo serviço na
sequência. Deixa passar `up --wait` (quem espera a saúde é o próprio compose) e a espera em laço.
**Vale só em teste** (`**/*.test.ts` e `e2e/**/*.spec.ts`): cenário de carga derruba e religa serviço
de propósito, e esperar ali mudaria o que ele simula.

Ao ligar, a guarda apontou **um defeito aberto**, o mesmo que os revisores tinham previsto:
`apps/despachante/test/redis-fora.int.test.ts:97`, com poll de 60 s absorvendo a subida do container.
Corrigido junto.

**Efeito esperado:** a quarta correção desta classe não acontece. As três anteriores custaram, somadas,
mais de vinte rodadas de revisão.

### 3. Autoconferência que ataca a maior causa técnica

`.claude/skills/executar-task/SKILL.md`, quatro perguntas novas antes de codar, cada uma com o número
de reprovações que ela existe para evitar: o segundo dado que torna a cláusula observável (7), a
checagem que responde antes da regra (5), a asserção sobre forma em vez de resultado (2), e o
comentário que contradiz o código (4). Dezoito ocorrências no total.

### 4. Divergência se registra; critério de aceite não se baixa

`.claude/skills/executar-task/SKILL.md`, bloco `<critical>` no passo 2. Seis ocorrências, e em duas
delas a saída foi **editar o documento para acomodar o resultado** — a linha do cenário de carga
reescrita depois da medição, e o limite de dois grupos do k6 desligado. Baixar a régua é decisão de
quem é dono da tarefa.

### 5. Linha de concorrência no template das tarefas

`.claude/skills/criar-tasks/task-template.md`: a tabela de testes ganha a linha de concorrência, que
diz **em paralelo, com `Promise.all`**, e não "clique duplo". Três reprovações no F1 foram prova
sequencial, recusada por uma leitura que o service faz antes e não pela restrição do banco.

## Recusadas

**Seção obrigatória de "estado do cliente entre sessões" na Tech Spec.** É a segunda maior causa (9
achados, tarefas 18 e 20) e a proposta era uma seção nova em `criar-techspec`. Recusada como
obrigação geral: viraria burocracia em toda spec futura, inclusive nas que não têm tela. O conteúdo
fica registrado aqui e na Tech Spec do F1, que já descreve o caminho certo, e o `/criar-techspec` do
F2 — que tem telas — lê este arquivo.

## Pendências desta retrospectiva

| Item | Destino |
|---|---|
| Rodada registrada na tabela sem bloco em `achados-revisoes.md` (atingiu **todas** as rodadas do `privacy-guardian` de uma correção) | tarefa que mexer em `tools/processo/revisoes.ts`; já em `TODO.md` |
| Esteira instável por desenho: compose inteiro no mesmo runner do Playwright, `workers` não fixado, `retries: 0` | tarefa por `/criar-tasks` antes do F2; já em `TODO.md` |
| `infra/test/borda.int.test.ts` intermitente (503 → 400 em cascata) | `/corrigir` próprio, com a causa; já em `TODO.md` |
| Guarda de `video`/`screenshot`; guarda de `ARQUIVOS_AMBIENTE_TESTE`; furo conhecido em `docs/lgpd.md` seção 4 | já em `TODO.md` |
| `--repeat-each` alto só no perfil `celular`, para limitar corrida de baixa probabilidade | `TODO.md`, se o vermelho do e2e voltar |
| Rastro do `domain-researcher` fora da tabela de revisões (ele não dá veredito) | separar "revisores" de "pesquisa" na tabela do `tasks.md` |

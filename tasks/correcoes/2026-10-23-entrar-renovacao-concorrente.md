# Correção — o e2e de renovação concorrente reprova por 1 ms de folga na medição do próprio teste

**Origem:** esteira run 40006927589 (`spec/harness`, `754d79c`), job `e2e 1/7`.
**Subagentes obrigatórios:** `test-engineer`, `infra-guardian`, `privacy-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. A correção altera 1 arquivo de código (`e2e/entrar.spec.ts`) e não toca
     `.github/`, `tools/ci/` nem `tools/processo/`: o `revisor-geral` não é obrigatório pelo limite do passo 5. -->

## Sintoma

`e2e/entrar.spec.ts:181 [chromebook]` › "concorrência: duas abas com o token só no cookie renovam uma de cada vez, e nenhuma
cai na entrada" falhou nas duas tentativas da esteira (a corrida e o reteste), 187 verdes e 1 vermelho:

```
Error: duas renovações ao mesmo tempo
Expected: >= 1792796533186
Received:    1792796533185
> 213 |  if (anterior) expect(janela.inicio, 'duas renovações ao mesmo tempo').toBeGreaterThanOrEqual(anterior.fim)
```

## Fora desta correção

Nada: a árvore estava limpa.

## Causa

O teste mede a sobreposição com `Date.now()` tirado **no Node, na entrega do evento**: o início de cada renovação no
`request` e o fim no `requestfinished`, das duas abas. Cada aba tem a sua sessão do CDP, então o `requestfinished` da
primeira e o `request` da segunda chegam por canais diferentes, sem ordem garantida entre si. Com a trava das Web Locks
funcionando, a segunda renovação só sai depois que a primeira devolveu a resposta, e a folga entre as duas, medida no Node, é
de uns poucos milissegundos; a asserção `inicio >= fim` não tem margem nenhuma, e a entrega fora de ordem de 1 ms a deixou
vermelha (`1792796533185 < 1792796533186`). O defeito é do critério do teste, não da trava: sem ela a sobreposição seria de
~1 s (a espera que a `ROTA_RENOVAR` segura em cada pedido). Falha da tarefa 18.0 (`f8c3269`), vista na esteira.

## Teste que reproduz

`e2e/entrar.spec.ts` › `entrada da equipe por e-mail e senha › concorrência: duas abas com o token só no cookie renovam uma
de cada vez, e nenhuma cai na entrada`.

**Não há vermelho determinístico:** a falha depende de qual dos dois eventos o Node recebe primeiro, e o ambiente não deixa
forçar a ordem. A evidência que substitui o vermelho é a medida da folga antes da correção, com uma sonda temporária no spec
(`console.log` da diferença `inicio − fim anterior`, já retirada): 2 ms nas duas corridas do spec inteiro (chromebook e celular)
e, em 40 corridas do caso, `1 ms` ×18, `2 ms` ×18, `3 ms` ×2 e `7 ms` ×2. A margem do critério antigo era de 1 ms no pior
caso medido aqui, e a esteira registrou −1 ms. Depois da correção o caso repetido passa 80 vezes seguidas (40 no `chromebook` e 40 no `celular`, `--repeat-each 40 --workers 2`), e a
mutação que tira a trava continua vermelha, o que prova que a tolerância não escondeu a sobreposição real.

## Correção

`TOLERANCIA_DO_RELOGIO_MS = 250` em `e2e/entrar.spec.ts`: a asserção passa a ser
`janela.inicio >= anterior.fim - TOLERANCIA_DO_RELOGIO_MS`. 250 ms fica longe dos dois lados: o ruído medido é de 1 a 7 ms (e
−1 ms na esteira), e a sobreposição real, sem a trava, é de ~1000 ms. Nenhum código de produção muda.

## Mutações

A tolerância é cláusula do teste; a prova de que ela não esconde a sobreposição é tirar a trava da aplicação:

```mutacao
arquivo: apps/web/src/api/sessao.ts
teste: e2e/entrar.spec.ts › concorrência: duas abas com o token só no cookie renovam uma de cada vez, e nenhuma cai na entrada
 function comTravaDeRenovacao<T>(tarefa: () => Promise<T>): Promise<T> {
   const travas = globalThis.navigator?.locks as LockManager | undefined
-  return travas === undefined ? tarefa() : travas.request(NOME_DA_TRAVA_DE_RENOVACAO, tarefa)
+  return tarefa()
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | Datar os eventos no navegador (`request.timing()` ou `performance.timeOrigin` + `performance.now()`) para voltar à tolerância zero | `/retro` da spec harness, como proposta de melhoria do teste; a tolerância de 250 ms resolve e foi provada pela mutação |
| test-engineer (1ª) | Mesma ideia: datar no navegador | `/retro` da spec harness (mesmo item acima) |
| infra-guardian (1ª) | Registrar no `/validar` que o teste da trava falhou primeiro na esteira e não na tarefa 18.0 | `/validar` da spec harness: o Orquestrador leva a nota ao Validador |
| test-engineer (1ª) | O job `e2e 1/7` da esteira deve ficar verde no próximo push | `/validar` da spec harness (a esteira é lida pelo Orquestrador ao fechar a tarefa seguinte) |
| test-engineer (1ª) | "Sintoma" cita `e2e/entrar.spec.ts:181` e `:213`, linhas antigas | Recusada: são as linhas do run da esteira (`754d79c`), que é o que o "Sintoma" descreve; o texto está certo para o código daquele run |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 21:24:01 | 2026-10-23 21:24:44 | `infra-guardian` | 1 | APROVADO | a1788e563a1aa2439 |
| 2026-10-23 21:24:00 | 2026-10-23 21:24:48 | `test-engineer` | 1 | APROVADO | ae46152783ad98e00 |
| 2026-10-23 21:24:01 | 2026-10-23 21:24:48 | `privacy-guardian` | 1 | APROVADO | a4da674bda9253b71 |

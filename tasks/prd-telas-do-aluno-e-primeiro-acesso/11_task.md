# Tarefa 11.0 — A introdução da coordenação

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 10.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A coordenação vê, na primeira entrada, quatro passos: o que vê em agregado, o que só abre com finalidade registrada e o que a IA
nunca faz; pode pular e rever.

## Contexto necessário

- `techspec.md` seções 5 e 9; `prd.md` RF12, RF15 a RF18 e o caso do aviso de incidente (seção 7); `tasks/prd-telas-da-coordenacao/mockup.md`
  seção 7 e fechamento (d)
- Regras 20 (itens 10 e 10a) e 70 (itens 2, 8 e 9); D45, D55, D57 e D64
- Código: `paginas/Inicio.tsx` (a tabela da 9.0 e da 10.0); `areas/coordenacao/rotas.tsx`; `areas/coordenacao/nunca-faz.ts`
  (`O_QUE_A_IA_NUNCA_FAZ`); `areas/coordenacao/privacidade/AvisoDeIncidente`; `BemVindo.tsx` do professor, como modelo
- Depois da 10.0: as três editam `paginas/Inicio.tsx`, `casca.ts`, `escola-montada.spec.ts` e o roteiro

## Subtarefas

- [ ] 11.1 — `areas/coordenacao/textos-da-introducao.ts` e `BemVindo.tsx` (`lazy()`, `tela-coordenacao-BemVindo`), a rota e a entrada
  `coordenador` na tabela de `paginas/Inicio.tsx`. Os passos, com a onça e "Analista de desempenho escolar" e o selo "IA":
  (1) "Eu ajudo a ler os números da <escola>." (2) "Você vê a escola em números agregados." e "O desempenho de professores só aparece
  com dois ou mais no grupo." (3) "Dado com nome só abre com um motivo, e isso fica registrado." (4) "Estas coisas a IA nunca faz.",
  com a lista de `O_QUE_A_IA_NUNCA_FAZ`. "Pular" e "Continuar" iguais. O fim lista "onde fica cada coisa" **lendo
  `NAVEGACAO.coordenador`**, e "Começar" leva a Governança
- [ ] 11.2 — "Rever a introdução" no menu da pessoa da coordenação (`MENU_DA_PESSOA.coordenador`), antes do "Sair"
- [ ] 11.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `areas/coordenacao/textos-da-introducao.ts`, `BemVindo.tsx` e os dois testes, `e2e/coordenacao-introducao.spec.ts` | novo |
| `areas/coordenacao/rotas.tsx`, `areas/navegacao.ts`, `areas/navegacao.test.ts`, `paginas/Inicio.tsx`, `e2e/__fixtures__/casca.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

Caminhos em `apps/web/src/`, salvo `e2e/`.

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| os textos (RF15) | unidade | agregado, nominal com motivo e o que a IA nunca faz; sem "ranking", "meta de uso" nem fala de sentimento |
| onde fica cada coisa | componente | a lista sai de `NAVEGACAO.coordenador` |
| primeira entrada: convite e segundo fator | e2e | convite, senha, segundo fator e login caem em `/coordenacao/bem-vindo` (`criarConviteDeCoordenador`, `entrarComoCoordenacaoNaMesmaAba`) |
| pular | componente + e2e | "Pular" grava a data, vai a Governança, e a entrada seguinte não volta |
| botões iguais | componente | "Pular" e "Continuar" com a mesma classe |
| falas (regra 70, item 4a; D58) | unidade | texto fixo em `.ts`; reprova afirmar ser pessoa, professor ou amigo, prometer voltar, esperar ou estar sempre ali, e termos de vínculo ou saudade |
| quatro estados da `BemVindo` | componente | carregando (a fala do passo 1, "Sair" à vista, sem "Fechar" nem "Pular"); erro com `EstadoErro`, "Tentar de novo", "Voltar para a abertura" e "Sair"; data desconhecida vale o modo primeira vez; com dado, os passos |
| rever | e2e | menu da pessoa › "Rever a introdução": todo passo fecha, a data não muda |
| aviso de incidente por cima | e2e | com incidente pendente, o aviso aparece sobre a introdução; "Ver depois" o fecha e a introdução continua; confirmar o incidente não a marca como vista |
| a coordenação não sabe quem viu (D64) | e2e | `page.request` em `/v1/professores`: nenhum campo com "introducao" na resposta |
| recomeço da tela | e2e | a coordenadora seguinte no mesmo computador vê a introdução dela |
| 360 px | e2e | sem rolagem lateral, botões de 44 px |

Isolamento e concorrência são da 1.0; carregando e erro do desvio em `/`, os da `Inicio`; os da `BemVindo`, a linha da tabela.

## Como testar

- Copie `ListaDePedidos.test.tsx` (`componentes/pedidos/`); o incidente como em `e2e/incidentes.spec.ts`
- `escola-montada` e o roteiro: a coordenadora criada por convite passa pela introdução (helper em `casca.ts`)
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/textos-da-introducao.test.ts` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/coordenacao-introducao.spec.ts`
- Telas: `coordenacao`, `/coordenacao/bem-vindo` (convite, senha, segundo fator; ou o menu da pessoa › "Rever a introdução"); mockup
  `/coordenacao/bem-vindo`

## Fora do escopo desta tarefa

Resumo de segunda e o sino, o Analista em conversa e a trilha de montagem da escola (a introdução só grava a data); a introdução da
rede e a da operação.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

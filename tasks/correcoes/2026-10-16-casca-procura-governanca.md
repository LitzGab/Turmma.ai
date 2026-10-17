# Correção — o W12 da casca procura o link "Governança" em "Seções" da coordenação, que a tarefa 3.0 trocou por Painel, Analista, Escola e Registros

**Origem:** esteira run 38990594424 (sobre `a3d5b2f`), job `e2e 1/6`: `e2e/casca.spec.ts:673` (`W12: coordenacao`), nos projetos `chromebook` e `celular`.
**Subagentes obrigatórios:** `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador (nenhum além de test-engineer e revisor-geral; frontend-reviewer só se mudasse código de tela, e não muda). test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`e2e/casca.spec.ts:673` (`casca da escola: os três papéis › W12: coordenacao: os nomes acessíveis não mudam, e o "Sair" está à vista e do tamanho do vizinho, …`)
estoura os 120 s do `test.setTimeout`:

```
Error: locator.boundingBox: Test timeout of 120000ms exceeded.
```

A linha é `conferirOSair`, em `e2e/casca.spec.ts:~642`: o `boundingBox()` do `getByRole('link', { name: 'Governança', exact: true })` dentro de
`Seções`, que não existe mais. Os outros dois papéis (`professor`, `aluno`) passam no mesmo run.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

O outro vermelho do mesmo run (`e2e/acesso-suspenso.spec.ts:169`, `chromebook`) está na seção "O outro vermelho do run", abaixo.

## Causa

Da tarefa **3.0** (`3be23c9`, "Dá à coordenação quatro lugares, Painel, Analista, Escola e Registros"). A tabela `PAPEIS_DA_CASCA` guarda, por papel, o
primeiro lugar da navegação (`primeiro`), que o teste usa para comparar a altura e a largura do "Sair" com a do vizinho. Para a coordenação ela dizia
`'Governança'`, o primeiro lugar até a 3.0. Depois dela o primeiro é **Painel** (`apps/web/src/areas/navegacao.ts`), e a coordenação abre nele.
A 3.0 dividiu os specs de Estrutura e de Governança, mas não tocou este, e nenhum teste da tarefa o alcançava: o portão da tarefa só roda os e2e que a árvore
alterou (regra 40).

## Teste que reproduz

O próprio `e2e/casca.spec.ts › W12: coordenacao`, que já é o teste do defeito: vermelho antes (`chromebook`, local, `node tools/ci/e2e.ts
--manter-ambiente e2e/casca.spec.ts`: 21 dos 22 passam e o da coordenação estoura os 120 s com `locator.boundingBox: Test timeout of 120000ms
exceeded`, o mesmo erro da esteira), verde depois nos projetos `chromebook` e `celular`. Não há teste novo: a correção troca o dado que o teste
procurava.

## Correção

`e2e/casca.spec.ts`, na linha da coordenação de `PAPEIS_DA_CASCA`: `primeiro: 'Governança'` → `primeiro: 'Painel'`. Nenhum código de tela mudou.

## O outro vermelho do run

`e2e/acesso-suspenso.spec.ts:169` (`chromebook`, `duas abas…`): a esteira acusou `Test timeout of 30000ms exceeded` esperando o título "Acesso suspenso"
(`session closed` é o teardown do teste que já estourou). A tarefa 3.0 não mexeu em `acesso-suspenso.spec.ts` nem no caminho da professora.

**Não reproduz, e nada foi mudado nele.** `npx playwright test e2e/acesso-suspenso.spec.ts --project=chromebook -g "duas abas" --repeat-each=10 --workers=1`,
no ambiente de teste 1: 10 de 10 verdes, cada uma em 12 s (a esteira mediu 30,3 s, que é o teto do teste: ele não declara `test.slow()` nem
`setTimeout`, e o `Test timeout of 30000ms` é o que a esteira acusou). Os outros três casos do arquivo também passaram no `chromebook` na rodada de
`casca.spec.ts` + `acesso-suspenso.spec.ts` (52 testes, 6 workers). No `celular`, com a linha 2 rodando o portão dela na mesma máquina, caíram
seis testes de dois arquivos, entre eles casos da `casca.spec.ts` que esta correção não toca, todos por prazo; é carga da máquina, não defeito, e o
mesmo caso passou no `chromebook` sob a mesma carga.

Hipótese, sem prova: o caso soma duas entradas de página (a professora e a segunda aba) e três esperas de até 20 s (`PRAZO_DA_ENTRADA_MS`) sob um
teto de 30 s; num runner lento uma só espera longa já o estoura. Se voltar a cair, a correção é dar-lhe `test.slow()`, como os casos vizinhos de
outros specs que fazem duas entradas. Fica registrado aqui para quem encontrar a segunda ocorrência, e uma linha no `TODO.md` aponta para esta seção.

## Ordem de correção, rodada 1 (`test-engineer`, recomendação)

`conferirOSair` ganhou, antes do `boundingBox()`, a asserção de que o primeiro link de "Seções" tem o nome acessível `primeiro`, com a mensagem
`o primeiro lugar de "Seções" não é o da tabela PAPEIS_DA_CASCA`. Navegação reordenada passa a falhar em 5 s e dizendo o motivo, e não no estouro de 120 s.

## Mutações

```mutacao
arquivo: e2e/casca.spec.ts
teste: e2e/casca.spec.ts › W12: coordenacao: os nomes acessíveis não mudam, e o "Sair" está à vista e do tamanho do vizinho, aberta e recolhida, a 1366 e a 900 px
-  { papel: 'coordenacao', navegacoes: ['Seções'], ausentes: ['Seu time', 'Rodapé', 'Sua conta'], primeiro: 'Painel' },
+  { papel: 'coordenacao', navegacoes: ['Seções'], ausentes: ['Seu time', 'Rodapé', 'Sua conta'], primeiro: 'Governança' },
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Registrar no `TODO.md` ou no estado do andar a hipótese do `test.slow()` em `e2e/acesso-suspenso.spec.ts:169`, para não depender de reler este documento | `TODO.md`: uma linha, escrita pelo Implementador no commit desta correção, apontando para a seção "O outro vermelho do run" do documento |
| test-engineer (1ª) | Corrigir já o teto de 30 s de `acesso-suspenso.spec.ts:169` (`test.slow()` ou teto que caiba nas esperas) | Não aplicar: o caso não reproduz (10 de 10 verdes), está fora do diff e do escopo desta correção. Se cair de novo na esteira, vira correção própria com o `test.slow()` já descrito no documento |
| test-engineer (1ª) | Segunda saída do item 1: ler `primeiro` de `navegacao.ts` | Não aplicar: acopla o e2e ao módulo da web; a primeira saída já faz o teste falhar em segundos e com motivo |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-16 23:38:09 | 2026-10-16 23:38:31 | `revisor-geral` | 1 | APROVADO | aaaf0922241cc20b3 |
| 2026-10-16 23:38:08 | 2026-10-16 23:38:55 | `test-engineer` | 1 | APROVADO | a7af6bc500b6868c9 |
| 2026-10-16 23:44:43 | 2026-10-16 23:45:08 | `revisor-geral` | 2 | APROVADO | a54461a20ec11b9b9 |
| 2026-10-16 23:44:39 | 2026-10-16 23:45:09 | `test-engineer` | 2 | APROVADO | a1b6826b563ed6151 |

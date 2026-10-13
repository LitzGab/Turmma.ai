# Tarefa 8.0 — Escola › Material em tabela, com o envio num diálogo

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba Material mostra os materiais da escola em tabela, com o que falhou primeiro; "Enviar material" abre um diálogo com o formulário de hoje; e cada linha abre um painel com o que foi declarado, "Tentar de novo" e "Excluir".

## Contexto necessário

- `techspec.md` seções 5 (`?material=`), 7c ("Releitura") e 9 ("Material"); `prd.md` RF15, RF22 e seção 6 ("Licença do material")
- `mockup.md` seção 3.7
- `docs/decisoes.md` D5 e D75; `.claude/rules/20-lgpd-menores.md` item 7
- Código: `apps/web/src/areas/coordenacao/Material.tsx` inteiro e `material-envio.ts`, que **não muda** (a validação, a recusa sem licença que vai à API sem o arquivo, o que o "Tentar de novo" devolve ao formulário); `apps/web/src/api/material.ts` (`intervaloDaLista`)

## Subtarefas

- [ ] 8.1 — A tabela, na região "Materiais da escola": Material (o título), Disciplina, Licença e Situação (`Estado`: "Não carregou" ou "Envio recusado", "Processando", "Pronto · N páginas"). O que falhou vem primeiro; depois, o mais novo
- [ ] 8.2 — "Enviar material", o único botão `primario`, abre o `Dialogo` com os campos, os rótulos, os `data-campo` e os erros de hoje, o arquivo arrastado ou escolhido pelo botão, e a declaração
- [ ] 8.3 — A linha abre o `PainelLado` (`?material=<id>`): a situação, o motivo da falha, de quem é, quem deu a licença, a licença e as páginas. No rodapé, "Tentar de novo" (só no que falhou, abre o diálogo com o que ele declarava) e "Excluir material" (a confirmação de perigo de hoje)
- [ ] 8.4 — A lista continua se relendo sozinha só enquanto há material processando, e para
- [ ] 8.5 — O vazio "Nenhum material ainda", com "Enviar material". Nenhuma frase nova sobre treino de IA: fica o texto de hoje
- [ ] 8.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Material.tsx` | alterado |
| `apps/web/src/areas/coordenacao/PainelDoMaterial.tsx`, `apps/web/src/areas/coordenacao/Material.test.tsx` | novo |
| `e2e/material.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |
| `e2e/__fixtures__/fluxo-do-professor.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | carregando; erro com "Tentar de novo"; vazio com "Enviar material"; com dado nas três situações, o que falhou primeiro; o foco depois de enviar e de excluir |
| sem licença | e2e | o caso de hoje: "Envio recusado" e por quê; o arquivo não sai do computador, nada vira material e a recusa fica na auditoria |
| formulário incompleto | e2e | o caso de hoje: o que falta em cada campo; o que não é PDF é recusado na tela, sem pedido à API |
| arrastar e teclado | e2e | o caso de hoje, dentro do diálogo: nada só funciona arrastando |
| processando vira pronto | e2e | o caso de hoje: a lista se atualiza sem recarregar e para de reler |
| excluir | e2e | o caso de hoje, pelo painel: cancelar não exclui; confirmar tira o material e os trechos |
| um botão cheio | e2e | o caso de hoje: só "Enviar material" é `primario` na tela |
| recomeço: segunda pessoa; o painel pelo endereço; falha com o diálogo aberto; reabrir o diálogo | e2e | o rascunho e o aviso da tentativa anterior saem; o `?material=` de A na sessão de B não abre nada |

## Como testar

- `e2e/material.spec.ts`: os nove casos ficam; o formulário passa a estar dentro do diálogo (`getByRole('dialog')` no lugar de `main`)
- `montarEscolaEEntrar`, de `fluxo-do-professor.ts`, que `a2-assistente` e `a3-a4-professor` usam: abre o diálogo antes de preencher
- O caso do padding do `main` e de `[data-tela]`: vale a medida da X1
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/Material.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/material.spec.ts`
- Armadilha: o `<input type="file">` escondido continua com o `data-testid` de hoje
- Telas: `coordenacao`, `/coordenacao/material`, com `text=Enviar material` e com o clique na primeira linha; também com `--vazia`; mockup `/coordenacao/escola?aba=material`

## Fora do escopo desta tarefa

"Retirar do uso" com motivo em texto; "Enviar outra versão" como ação própria; trocar os campos "De quem é o material" e "Quem deu a licença" por "Dono".

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

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


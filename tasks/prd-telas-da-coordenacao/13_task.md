# Tarefa 13.0 — Registros › Privacidade: prazos, empresas e incidentes num seletor

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba Privacidade de Registros mostra, uma por vez, as três telas que eram abas: por quanto tempo a escola guarda cada dado, as empresas que recebem dados e os incidentes, compostas com as peças novas, nos endereços de hoje.

## Contexto necessário

- `techspec.md` seções 5 (os três endereços) e 9 ("Privacidade"); `prd.md` RF17, RF22, RF23
- `mockup.md`: o mockup não tem estas telas; valem o padrão de página da D80 (item 6) e a tabela da seção 5.3
- `.claude/rules/20-lgpd-menores.md` itens 15, 16 e 19
- Código: `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx` (o `Segmentado` já entrou na 3.0), `Retencao.tsx`, `EmpresasQueRecebemDados.tsx`, `Incidentes.tsx`, `DetalhesDoIncidente.tsx` e `confirmar-o-incidente.ts`; os cinco `textos-*.ts`, que **não mudam**

## Subtarefas

- [ ] 13.1 — O seletor "Prazos de guarda", "Empresas" e "Incidentes": grupo de rádio pelas setas, com a escolha no endereço; cada seção guarda o título por extenso de hoje ("Por quanto tempo guardamos", "Empresas que recebem dados", "Incidentes")
- [ ] 13.2 — Prazos: as categorias em `Tabela` (o dado, o prazo que vale e de onde ele vem) e a região "Prazos que não mudam"
- [ ] 13.3 — Empresas: as vigentes e as passadas em `Tabela`, com o que cada uma faz, recebe e onde processa; os vazios de hoje
- [ ] 13.4 — Incidentes: os sem confirmação primeiro, cada aviso num `Cartao` com todos os campos (`white-space: pre-line`) e "Confirmo que recebi" em botão oficial; a falha fica só no cartão que falhou
- [ ] 13.5 — O `AvisoDeIncidente` (diálogo e faixa) não muda de comportamento: uma leitura por sessão, e a faixa some quando a aba confirma
- [ ] 13.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx`, `apps/web/src/areas/coordenacao/privacidade/Retencao.tsx` | alterado |
| `apps/web/src/areas/coordenacao/privacidade/EmpresasQueRecebemDados.tsx`, `apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx` | alterado |
| `apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx` | novo |
| `e2e/privacidade.spec.ts`, `e2e/incidentes.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | cada uma das três: carregando; erro com "Tentar de novo"; vazio só com a leitura terminada; com dado; "só passadas" nas empresas |
| o endereço guarda a escolha | componente | cada endereço abre a opção dele; o que não existe cai em Pedidos, como hoje; trocar de opção navega |
| a retenção de hoje | e2e | o prazo que vale, de onde vem e os prazos fixos; a troca de escola não mostra a retenção da anterior, nem enquanto a nova não chegou |
| as empresas de hoje | e2e | vigentes e passadas da escola dela, e nenhuma de outra escola |
| a confirmação do incidente | e2e | os casos de `incidentes.spec.ts`: duas coordenadoras, a primeira confirmação é a que vale; o clique duplo manda uma só; a falha só no cartão |
| recomeço: segunda pessoa; troca de escola; falha da confirmação | e2e | os casos de hoje, sem perder asserção |
| 360 px e teclado | e2e | o seletor pelas setas, numa parada de Tab; os botões do aviso com a mesma altura, de 44 px ou mais; sem rolagem de lado; axe |

## Como testar

- `e2e/privacidade.spec.ts`: onde hoje há `getByRole('tab', { name: 'Por quanto tempo guardamos' })`, a 3.0 já pôs o rádio do seletor; aqui muda só o que está dentro de cada seção
- `e2e/incidentes.spec.ts › carregando, erro com "Tentar de novo", vazio e com dado…` e `› a falha da confirmação aparece só no cartão…`
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/privacidade.spec.ts`
- A vitrine não semeia retenção, empresa nem incidente: semeie à mão e diga em "Telas vistas"
- Telas: `coordenacao`, `/coordenacao/privacidade/retencao`, `/coordenacao/privacidade/suboperadores`, `/coordenacao/privacidade/incidentes`; sem mockup

## Fora do escopo desta tarefa

Editar a retenção pela tela (é comando da operação); os Pedidos (12.0); "Configurações da escola" e Dossiê (F12).

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


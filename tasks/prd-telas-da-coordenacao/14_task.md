# Tarefa 14.0 — A operação numa página, com Escolas e Uso

**Funcionalidade:** telas-da-coordenacao · **Depende de:** nenhuma
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O operador Turmma vê a operação como uma página só, "Operação", com as abas Escolas e Uso nos endereços de hoje, as duas tabelas compostas como no mockup e o estado da coordenação de cada escola em texto. Criar rede, criar escola e os convites não mudam.

## Contexto necessário

- `techspec.md` seções 7c ("Bundle") e 9 ("Operação", "Nomes que não mudam"); `prd.md` RF21, RF22, RF23 e a seção 3 (o que do mockup está fora)
- `mockup.md` seção 12: o cabeçalho e as tabelas. Custo, teto, grupo por rede, busca e "⋯" com ações novas **não entram**
- `docs/decisoes.md` D76: a operação não vê dado de pessoa
- Código: `apps/web/src/operacao/paginas/Escolas.tsx` e `Uso.tsx`; `operacao/componentes/CascaDaOperacao.tsx` (`navigation` "Operação") e `NavegacaoDaLista.tsx`; `operacao/estados-da-escola.ts` (os sete textos); `operacao/formatos.ts`

## Subtarefas

- [ ] 14.1 — O cabeçalho da página: o `h1` "Operação" à vista, a frase fixa "A operação não vê dado de aluno nem de professor: nem nome, nem nota, nem conversa.", e a `navigation` "Operação" desenhada como abas, com `aria-current`. O título da aba do navegador continua "Escolas" e "Uso"
- [ ] 14.2 — Escolas, na região "Lista de escolas": colunas Escola (nome e `/e/<slug>`), Rede, Coordenação (`Estado` com o texto de `TEXTO_DO_ESTADO` e a ação do convite que o estado permite) e Uso ("N turmas · N professores · N alunos", ou "Sem turma ainda"). "Nova escola" é o único botão `primario`; "Nova rede" fica secundário. A ordem e as páginas continuam na consulta do endereço
- [ ] 14.3 — Uso, na região "Uso por escola": a mesma tabela de hoje (requisições, tarefas em segundo plano e armazenamento, do dia e do mês), com o dia e o mês de referência no cabeçalho
- [ ] 14.4 — Abaixo de 768 px, cada tabela vira lista, uma escola por item, sem rolagem de lado; número comprido não quebra a linha no meio
- [ ] 14.5 — Os vazios e os erros de hoje, nas peças `estado/`; o `VazioDoUso` passa ao `EstadoVazio`
- [ ] 14.6 — `tela-da-operacao.tsx`: a rede falsa e a sessão do operador para teste de componente
- [ ] 14.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/operacao/paginas/Escolas.tsx`, `apps/web/src/operacao/paginas/Uso.tsx`, `apps/web/src/operacao/componentes/CascaDaOperacao.tsx` | alterado |
| `apps/web/src/operacao/__fixtures__/tela-da-operacao.tsx` | novo |
| `apps/web/src/operacao/paginas/Escolas.test.tsx`, `apps/web/src/operacao/paginas/Uso.test.tsx` | novo |
| `e2e/operacao-escolas.spec.ts`, `e2e/operacao-uso.spec.ts`, `e2e/operacao.spec.ts`, `e2e/operacao-convite-coordenacao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | Escolas e Uso: carregando; erro com "Tentar de novo"; vazio que convida; com dado; a troca de página deixa a lista ocupada, sem piscar o vazio |
| os sete estados | componente | cada estado da coordenação aparece com o texto de `TEXTO_DO_ESTADO`, nunca só em cor, e só com a ação que ele permite |
| nenhum dado de pessoa | componente | a página não tem nome, e-mail nem matrícula: só escola, rede, estado e número |
| lista, ordem e páginas | e2e | os casos W6 e W10 de hoje: 30 escolas, a página e a ordem no endereço, o texto de cada estado, sem rolagem a 360 px |
| criar e convidar | e2e | os casos de hoje, com os mesmos diálogos: clique duplo cria uma escola só; o link aparece uma vez |
| permissão | e2e | sem sessão, os dois endereços levam à entrada da operação |
| recomeço: outro operador na mesma aba; resposta atrasada do refazer; falha com o diálogo aberto; o aviso de inatividade dentro do diálogo | e2e | os casos de hoje, sem perder asserção |

## Como testar

- `apps/web/src/__fixtures__/tela.tsx` é o molde da peça de apoio: a operação tem sessão e cliente de consultas próprios (`operacao/api/sessao.ts`)
- `e2e/operacao-escolas.spec.ts › W6 e W10…` e `› W7…`; `e2e/operacao-uso.spec.ts › W6…`; `semearPainel`, de `e2e/__fixtures__/painel.ts`
- Não mudam, porque o roteiro os usa: a linha por escola (`tr` ou `li`), o botão "Convidar a coordenação de <escola>", os rótulos e os títulos dos diálogos
- Rodar: `npx vitest run --project unidade apps/web/src/operacao/paginas/Escolas.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/operacao-escolas.spec.ts`
- Limite: o pedaço `operacao-*` não passa de 60 kB; meça antes e depois
- Telas: a vitrine não entra na operação; fotografe à mão `/operacao` e `/operacao/uso`, nas duas larguras, e diga em "Telas vistas"; mockup `/operacao` e `/operacao?aba=uso`

## Fora do escopo desta tarefa

Custo e teto de IA, convite da secretaria, redefinir o segundo fator, busca, cidade e grupo por rede; a entrada, o segundo fator e o convite do operador (X1).

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


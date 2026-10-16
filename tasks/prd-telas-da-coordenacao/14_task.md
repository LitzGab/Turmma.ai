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

- [x] 14.1 — O cabeçalho da página: o `h1` "Operação" à vista, a frase fixa "A operação não vê dado de aluno nem de professor: nem nome, nem nota, nem conversa.", e a `navigation` "Operação" desenhada como abas, com `aria-current`. O título da aba do navegador continua "Escolas" e "Uso"
- [x] 14.2 — Escolas, na região "Lista de escolas": colunas Escola (nome e `/e/<slug>`), Rede, Coordenação (`Estado` com o texto de `TEXTO_DO_ESTADO` e a ação do convite que o estado permite) e Uso ("N turmas · N professores · N alunos", ou "Sem turma ainda"). "Nova escola" é o único botão `primario`; "Nova rede" fica secundário. A ordem e as páginas continuam na consulta do endereço
- [x] 14.3 — Uso, na região "Uso por escola": a mesma tabela de hoje (requisições, tarefas em segundo plano e armazenamento, do dia e do mês), com o dia e o mês de referência no cabeçalho
- [x] 14.4 — Abaixo de 768 px, cada tabela vira lista, uma escola por item, sem rolagem de lado; número comprido não quebra a linha no meio
- [x] 14.5 — Os vazios e os erros de hoje, nas peças `estado/`; o `VazioDoUso` passa ao `EstadoVazio`
- [x] 14.6 — `tela-da-operacao.tsx`: a rede falsa e a sessão do operador para teste de componente
- [x] 14.7 — Testes

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
| O Uso mantém a tabela dele, com os dois períodos como grupos de três colunas, na pele da `Tabela` (moldura de 2 px, cabeçalho de 44 px, linha de 64 px); só a Escolas usa a peça `Tabela`. A Tech Spec dizia "as duas tabelas na `Tabela`" | A peça não agrupa colunas, e a 14.3 pede "a mesma tabela de hoje", com o dia e o mês de referência no cabeçalho de cada grupo. Trocar por seis colunas planas tiraria o cabeçalho do período, e o roteiro (`operacao-uso.spec.ts`) lê o `columnheader` do dia e do mês. A lista de cartões abaixo de 768 px é a de hoje, com os títulos de nível 2 e 3 | `techspec.md` §9, parágrafo "Operação" (reescrito nesta tarefa); nenhum `cenarios.md` nesta spec; documento da seção 11: a mesma §9 |
| A lista rola **por dentro** a partir de 768 px (`RegiaoDaLista`), nas duas telas, com as páginas presas no pé e o foco na região só quando ela rola. A Tech Spec §9 descreve a "Altura" para as molduras da coordenação e não diz da operação | RF23 (a 1366 × 768 a página não rola) vale para "toda tela", e a 14.0 o cita no contexto. Sem isto a primeira página de 25 escolas (64 px a linha) faria a página inteira rolar | `techspec.md` §9, parágrafo "Operação"; `prd.md` RF23 |
| O erro de Escolas e de Uso continua no `ErroDaOperacao`, a peça da operação, e não vai ao `EstadoErro` do catálogo; só a pele dele passou à do produto (borda de 2 px, `t-apoio`), igual à do `EstadoErro` | O `EstadoErro` escreve a mensagem pelo catálogo (`mensagemDoErro`), e a operação tem textos próprios no chunk dela (`textoDaFalha`: "O Turmma está indisponível agora…", o tempo esgotado e o limite com a espera), que os testes e os e2e afirmam e que o catálogo da entrada não deve carregar. A peça também serve à entrada, ao segundo fator e ao convite, fora desta tarefa | `techspec.md` §9, parágrafo "Operação" (frase acrescentada nesta tarefa); nenhum `cenarios.md` nesta spec; documento da seção 11: a mesma §9 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/operacao/paginas/Escolas.tsx
teste: apps/web/src/operacao/paginas/Escolas.test.tsx › o uso de cada escola é a contagem
 function UsoDaEscola({ escola }: { escola: EscolaDoPainel }) {
-  if (escola.turmas === 0) return <span className="text-sutil">Sem turma ainda</span>
+  if (escola.turmas < 0) return <span className="text-sutil">Sem turma ainda</span>
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Escolas.tsx
teste: apps/web/src/operacao/paginas/Escolas.test.tsx › no computador, cada estado diz o texto dele
 function EstadoDaCoordenacao({ escola }: { escola: EscolaDoPainel }) {
-  return <Estado familia={TOM_DO_ESTADO[escola.estado]}>{TEXTO_DO_ESTADO[escola.estado]}</Estado>
+  return <Estado familia={TOM_DO_ESTADO[escola.estado]}>{escola.estado}</Estado>
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Escolas.tsx
teste: apps/web/src/operacao/paginas/Escolas.test.tsx › no celular, a lista de cartões diz o mesmo texto
 <EstadoDaCoordenacao escola={escola} />
-      <AcoesDoConvite escola={escola} aoAcionar={aoAcionar} focarNaEscola={focarNaEscola} />
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Escolas.tsx
teste: apps/web/src/operacao/paginas/Escolas.test.tsx › na troca de página, a anterior fica na tela
 rotulo="Lista de escolas"
-          ocupada={trocando}
+          ocupada={false}
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Uso.tsx
teste: apps/web/src/operacao/paginas/Uso.test.tsx › no computador, o dia e o mês de referência estão no cabeçalho
-          {larga ? <TabelaDoUso escolas={dados.itens} referencia={dados} /> : <Cartoes escolas={dados.itens} referencia={dados} />}
+          {larga ? <Cartoes escolas={dados.itens} referencia={dados} /> : <TabelaDoUso escolas={dados.itens} referencia={dados} />}
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Uso.tsx
teste: apps/web/src/operacao/paginas/Uso.test.tsx › sem escola nenhuma, o vazio convida a ir para Escolas
-          acao={{ rotulo: TEXTO_DO_USO_VAZIO.link, aoAcionar: () => navegar(INICIO_DA_OPERACAO) }}
+          acao={{ rotulo: TEXTO_DO_USO_VAZIO.link, aoAcionar: () => navegar(USO_DA_OPERACAO) }}
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Uso.tsx
teste: apps/web/src/operacao/paginas/Uso.test.tsx › a tabela que passa da largura rola na própria moldura
-      {...(sobra ? { role: 'region', 'aria-label': 'Medidas de cada escola', tabIndex: 0 } : {})}
+      {...(!sobra ? { role: 'region', 'aria-label': 'Medidas de cada escola', tabIndex: 0 } : {})}
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Uso.tsx
teste: apps/web/src/operacao/paginas/Uso.test.tsx › a tabela que passa da largura rola na própria moldura
-  const sobra = useSobra(moldura, 'x')
+  const sobra = useSobra(moldura, 'y')
```

```mutacao
arquivo: apps/web/src/operacao/componentes/RegiaoDaLista.tsx
teste: apps/web/src/operacao/componentes/RegiaoDaLista.test.tsx › com a lista maior que a janela
-  return eixo === 'x' ? alvo.scrollWidth > alvo.clientWidth : alvo.scrollHeight > alvo.clientHeight
+  return eixo === 'x' ? alvo.scrollWidth > alvo.clientWidth : alvo.scrollWidth > alvo.clientWidth
```

```mutacao
arquivo: apps/web/src/operacao/componentes/RegiaoDaLista.tsx
teste: apps/web/src/operacao/componentes/RegiaoDaLista.test.tsx › com a lista que cabe
-      {...(sobra ? { tabIndex: 0 } : {})}
+      {...{ tabIndex: 0 }}
```

```mutacao
arquivo: apps/web/src/operacao/componentes/RegiaoDaLista.tsx
teste: apps/web/src/operacao/componentes/RegiaoDaLista.test.tsx › diz que está ocupada
-      aria-busy={ocupada}
+      aria-busy={false}
```

```mutacao
arquivo: apps/web/src/operacao/componentes/RegiaoDaLista.tsx
teste: apps/web/src/operacao/componentes/RegiaoDaLista.test.tsx › com a lista maior que a janela
 <div className="flex min-w-0 shrink-0 flex-col gap-4">{children}</div>
-      <div className="md:sticky md:bottom-0 md:bg-fundo md:py-2">{pe}</div>
```

```mutacao
arquivo: apps/web/src/operacao/componentes/CascaDaOperacao.tsx
teste: apps/web/src/operacao/componentes/CascaDaOperacao.test.tsx › o título é "Operação"
-          <h1 className="t-titulo break-words text-tinta">Operação</h1>
+          <h1 className="t-titulo break-words text-tinta">Escolas</h1>
```

```mutacao
arquivo: apps/web/src/operacao/componentes/CascaDaOperacao.tsx
teste: apps/web/src/operacao/componentes/CascaDaOperacao.test.tsx › o título é "Operação"
 <Lock aria-hidden="true" size={18} strokeWidth={2.5} className="mt-px shrink-0" />
-            <span className="min-w-0 break-words">{TEXTO_DA_OPERACAO_SEM_DADO_DE_PESSOA}</span>
```

```mutacao
arquivo: apps/web/src/operacao/textos.ts
teste: apps/web/src/operacao/componentes/CascaDaOperacao.test.tsx › a frase fixa diz
-export const TEXTO_DA_OPERACAO_SEM_DADO_DE_PESSOA = 'A operação não vê dado de aluno nem de professor: nem nome, nem nota, nem conversa.'
+export const TEXTO_DA_OPERACAO_SEM_DADO_DE_PESSOA = 'A operação não vê dado de aluno.'
```

```mutacao
arquivo: apps/web/src/operacao/estados-da-escola.ts
teste: apps/web/src/operacao/estados-da-escola.test.ts › a cor é de reforço
   vencido: 'erro',
   revogado: 'erro',
   aceito: 'pendente',
   sem_coordenacao: 'erro',
-  ativa: 'ok',
+  ativa: 'cinza',
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Uso.tsx
teste: apps/web/src/operacao/paginas/Uso.test.tsx › na troca de página, a anterior fica na tela
 rotulo="Uso por escola"
-          ocupada={trocando}
+          ocupada={false}
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Escolas.tsx
teste: apps/web/src/operacao/paginas/Escolas.test.tsx › sem escola nenhuma, o vazio convida a criar a rede
-        <EstadoVazio titulo={TEXTO_DA_LISTA_VAZIA.titulo} descricao={TEXTO_DA_LISTA_VAZIA.descricao} />
+        <EstadoVazio titulo={TEXTO_DA_LISTA_VAZIA.titulo} descricao={TEXTO_DA_LISTA_VAZIA.descricao} acao={{ rotulo: 'Nova rede', aoAcionar: () => dialogo.abrir('rede') }} />
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Escolas.tsx
teste: e2e/operacao-escolas.spec.ts › 14.4: o uso de uma escola com números grandes fica inteiro na linha
-      <span className="whitespace-nowrap">{formatarQuantidade(escola.professores, 'professor', 'professores')}</span>
+      <span>{formatarQuantidade(escola.professores, 'professor', 'professores')}</span>
```

Sem bloco para o `whitespace-nowrap` do `Valor` (`Uso.tsx`): é defesa. O e2e `14.4` do Uso prova o resultado (cada medida
numa linha só, a 360, a 768 e a 1366 px, com 1.234.567.890, 1.234.567 e 115 GB), mas tirada a classe nenhuma largura da tela
faz o texto quebrar, porque a medida tem no máximo um espaço e as colunas têm folga: o teste fica verde com e sem ela. A
cláusula irmã da Escolas (`UsoDaEscola`, onde a linha tem três contagens e a coluna aperta a 768 px) tem o bloco e o teste
fica vermelho sem ela.

Os `whitespace-nowrap` de turmas e de alunos em `UsoDaEscola` (`Escolas.tsx`): rodado sem a classe, uma de cada vez, o e2e
`14.4` da Escolas (`e2e/operacao-escolas.spec.ts › 14.4: o uso de uma escola com números grandes fica inteiro na linha`) ficou
verde no `chromebook`, a 1366 e a 768 px. "1.234 turmas" abre a linha e é mais curto que a coluna, e "1.234.567 alunos"
cabe, sozinho ou depois do " · ", na largura que a coluna recebe; só a de professores, o trecho do meio e o mais largo
("12.345 professores"), quebra a 768 px sem a classe. É defesa: a regra da linha está provada pelo bloco de professores.

Os `whitespace-nowrap` dos dois `th` do cabeçalho da `TabelaDoUso` (`Escola` e o título de cada período) são a pele do
cabeçalho, a mesma do `th` da peça `Tabela` (`apps/web/src/componentes/Tabela.tsx`, `t-selo px-4 whitespace-nowrap`), e não a
regra 14.4, que é sobre os números: nenhum teste os afirma, e a 768 px a tabela rola dentro da moldura em vez de espremer o
cabeçalho.

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | "Quando a vitrine passar a cobrir `/operacao` e `/operacao/uso`, fotografar as duas telas nas duas larguras" | Validação da spec: o Validador fotografa cada requisito com tela. A vitrine não cobre a operação (`tools/vitrine/foto.ts`, `ehPapel('operador')` é falso) e a tarefa diz fotografar à mão |
| frontend-reviewer (1ª) | "`NavegacaoDaLista.tsx:21`: o `SeletorDeOrdem` ainda é a pílula antiga … O mockup e a Tech Spec usam o `Segmentado` no lugar. Fica para a tarefa que tocar o arquivo." | Tarefa futura que toque `operacao/componentes/NavegacaoDaLista.tsx`. Muda um componente que a tarefa não altera e mexe no foco e nos testes dele |
| frontend-reviewer (1ª) | "A divergência do Uso … está justificada e registrada na §9 da Tech Spec. É aceitável, mas a pele duplicada … é uma segunda fonte de verdade que pode divergir da peça." | Recusada: já é a divergência declarada nesta tarefa (tabela de divergências, primeira linha). Sem ação |
| frontend-reviewer (1ª) | "Faltam as fotos manuais pedidas pela tarefa ("Telas vistas"). Para a validação, anexar as quatro fotos de `/operacao` e `/operacao/uso`." | Validação da spec, como acima; no relatório da tarefa, "Telas vistas: não (a vitrine não cobre a operação)" |
| revisor-geral (1ª) | "`RegiaoDaLista.tsx:13` (`useSobra`) repete a medição de sobra que `componentes/Tabela.tsx` já faz por conta própria … Vale a `Tabela` passar a usar o mesmo gancho numa tarefa que toque nela, ou levá-lo para `componentes/`." | Tarefa futura que toque `apps/web/src/componentes/Tabela.tsx`. Mexe numa peça da casca fora desta tarefa |
| test-engineer (1ª) | "Falta declarar, num teste, a intenção para uma escola com `turmas: 0` e `professores > 0`: hoje "Sem turma ainda" esconde a contagem de professores." | `TODO.md`, como pergunta de produto: o que a coluna Uso mostra no vínculo do ano novo antes da turma importada. A decisão do texto não é do teste |
| test-engineer (1ª) | "Não rodei o e2e … O RF23, que depende de altura real, fica para o portão e para a esteira." | Sem ação: é registro do revisor, não pedido |
| test-engineer (2ª) | "`Escolas.test.tsx` e `e2e/operacao-escolas.spec.ts:238` acham o botão cheio pela classe `bg-laranja`. Se a pele do primário mudar, o teste quebra sem a regra ter mudado. Seria melhor achar por um atributo ou papel estável da peça `Botao`, se ela expuser um." | Tarefa futura que toque a peça `Botao`: expor o atributo é mudança nela, fora desta tarefa |
| test-engineer (2ª) | "No e2e 14.4, `trocarAPrimeiraDaResposta` intercepta a resposta real, e por isso não prova o contrato com números grandes. Para o 14.4 isso basta, porque o que ele prova é o layout." | Sem ação: o revisor diz que basta |
| frontend-reviewer (2ª) | "No vazio da Escolas, o texto diz "Comece criando a rede", mas o único botão laranja é "Nova escola". O primeiro passo (a rede) fica no botão secundário." | Validação da spec: o Validador fotografa `/operacao` e confere texto e destaque. A decisão do que é primário é da 14.2, que manda "Nova escola" como único `primario` |
| revisor-geral (2ª) | "A pele nova do erro alcança telas fora desta tarefa … Vale uma frase na linha da divergência dizendo que a pele muda nessas telas também." | Recusada: a linha da divergência já diz que "A peça também serve à entrada, ao segundo fator e ao convite, fora desta tarefa", e a mudança é só de classe (D80). O revisor aprovou sem exigir |
| revisor-geral (2ª) | "Medida do pedaço `operacao-*` … o número ainda não está no documento da tarefa." | Já está na r1 (item 8): a medida, antes e depois, vai no relatório ao Orquestrador. A esteira cobra o teto (`tools/ci/tamanho-web.test.ts`) |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-16 16:46:45 | 2026-10-16 16:47:43 | `privacy-guardian` | 1 | APROVADO | ad8a5bebcaa4ec459 |
| 2026-10-16 16:46:42 | 2026-10-16 16:47:44 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a441952402014da4c |
| 2026-10-16 16:46:51 | 2026-10-16 16:49:01 | `revisor-geral` | 1 | REPROVADO | a1344dbf64ea750ff |
| 2026-10-16 16:46:48 | 2026-10-16 16:49:36 | `test-engineer` | 1 | REPROVADO | a8fab49c87ea10fee |
| 2026-10-16 17:22:37 | 2026-10-16 17:23:01 | `frontend-reviewer` | 2 | APROVADO | a67356aa69d01a297 |
| 2026-10-16 17:22:42 | 2026-10-16 17:23:06 | `privacy-guardian` | 2 | APROVADO | a5633b83d2c5b55da |
| 2026-10-16 17:22:56 | 2026-10-16 17:23:36 | `revisor-geral` | 2 | APROVADO | af923695050a77310 |
| 2026-10-16 17:22:49 | 2026-10-16 17:24:10 | `test-engineer` | 2 | REPROVADO | af8af5fef356c642f |
| 2026-10-16 17:56:40 | 2026-10-16 17:57:36 | `test-engineer` | 3 | APROVADO | adb406c88a82cb548 |

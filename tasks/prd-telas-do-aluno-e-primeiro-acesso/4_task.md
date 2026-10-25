# Tarefa 4.0 — Tarefas em três grupos: Para fazer, Entregues e Corrigidas

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A lista de Tarefas mostra três grupos, com linha inteira clicável, ladrilho da matéria e o estado em texto. "Corrigida" só existe
com a correção aprovada.

## Contexto necessário

- `techspec.md` seção 9 ("Tarefas"); `prd.md` RF6, RF10 e RF20; `mockup.md` seção 2.2 (composição, selos, vazio)
- Regras 50 (itens 5 e 9) e 70 (item 3); D59 e D80 (item 7c)
- Código: `areas/aluno/Atividades.tsx` e `atividades.ts` (`TEXTO_DA_SITUACAO`, `separarAtividades`); `atividades.test.ts`
- A 3.0 corre junto: esta tarefa **mantém exportados** `estaParaResponder`, `resumoDaAtividade` e `AVISO_DA_AVALIACAO`
- `Linha` e `Ladrilho`, da X1: `componentes/ui/Linha.tsx` e `componentes/ui/Ladrilho.tsx`; confira as props antes de importar

## Subtarefas

- [x] 4.1 — `separarAtividades` devolve `paraFazer` (`para_fazer`, `em_andamento`), `entregues` (`enviada`, `encerrada`) e `corrigidas`
  (`com_diagnostico`), na ordem da API. Os selos: "Para fazer", "Entregue", "Encerrada" e "Corrigida". Os vazios: "Nada para fazer
  agora.", "Nada esperando quem dá a aula." e "Nenhuma corrigida ainda."
- [x] 4.2 — `areas/aluno/materia.ts`: o nome da disciplina (sem acento e sem caixa) vira família de cor da X1 e ícone `lucide`; nome
  desconhecido cai numa reserva neutra
- [x] 4.3 — `Atividades.tsx` com `Linha` e `Ladrilho` por tarefa: título, "disciplina · N questões", selo e o detalhe de hoje. Os
  `data-atividade` ficam. "ver mais atividades" vira "Ver mais tarefas", a pedido. Sem professor, sem prazo, sem barra, sem "NOVO",
  sem contador e sem filtro por matéria (o contrato não tem; D80, item 7c)
- [x] 4.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/aluno/materia.ts`, `apps/web/src/areas/aluno/materia.test.ts`, `apps/web/src/areas/aluno/Atividades.test.tsx` | novo |
| `apps/web/src/areas/aluno/Atividades.tsx`, `apps/web/src/areas/aluno/atividades.ts`, `apps/web/src/areas/aluno/atividades.test.ts` | alterado |
| `e2e/aluno-atividade.spec.ts`, `e2e/aluno-fluxo.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| a separação | unidade | cada `situacao` cai no grupo certo e a ordem da API não muda; `com_diagnostico` é o único em "Corrigidas" |
| "Corrigida" só com correção aprovada | componente | `enviada` e `encerrada` ficam em "Entregues", com o texto de espera, e nunca dizem acerto |
| quatro estados | componente | carregando; vazio total; erro com "Tentar de novo"; com dado, e o vazio de cada grupo sozinho |
| `materia.ts` | unidade | "Matemática", "matematica" e "História" acham família e ícone; nome desconhecido, a reserva |
| nada de colega (RF10) | componente | a varredura de texto não acha "ranking", "média", "posição", "pontos" nem "sequência" |
| "Ver mais tarefas" | componente | a segunda página só vem ao clicar |
| 360 px | e2e | sem rolagem lateral, linha com 44 px; no celular o selo desce para baixo do nome |
| recomeço da tela | e2e | o aluno seguinte vê as tarefas dele; a resposta atrasada do anterior não aparece |

Concorrência e log não se aplicam: só leitura.

## Como testar

- Copie `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` e use `redeFalsa().segurar()` para o carregando
- O que muda nos e2e (rótulo, nunca a regra): as regiões "Para responder" e "Já feitas" viram "Para fazer", "Entregues" e
  "Corrigidas" (`aluno-atividade.spec.ts` ~110 e ~116, `aluno-fluxo.spec.ts` 79 e 163, `roteiro-da-demonstracao.spec.ts` 443 e 568);
  o selo "Com resultado" vira "Corrigida" e o "Para responder", "Para fazer". "Atividade enviada" não muda
- Rodar: `npx vitest run --project unidade apps/web/src/areas/aluno/atividades.test.ts` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/aluno-atividade.spec.ts`
- Telas: `aluno`, `/aluno/atividades` (pelo item "Tarefas"); a tarefa corrigida vem de um lote aprovado; mockup `/aluno/tarefas`

## Fora do escopo desta tarefa

Professor na linha, prazo ("Até quinta"), barra de progresso, "NOVO", contador azul e filtro por matéria (pedem dado que o contrato
não traz); a tarefa de leitura e a prova em tela de foco (F6); o desenho ilustrado de cada matéria.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A reserva de `materia.ts` não é "neutra": é `anil` com um livro aberto | O `Ladrilho` da X1 só aceita as dez famílias de cor e nenhuma é neutra; as nove que não são o laranja já têm matéria, e o laranja "nunca vai em matéria" (`docs/interface.md` 9.1). Mexer no `Ladrilho` é da X1, fora desta tarefa | `techspec.md` §9 ("Tarefas", `materia.ts`) e `docs/interface.md` 9.1 (lista de matérias), com a palavra "reserva" |
| Os grupos não levam o número entre parênteses ("Para fazer (2)") do mockup 2.2 | A lista é paginada ("Ver mais tarefas"): o número seria o das já carregadas, e diria um total que não é. A subtarefa 4.3 também manda "sem contador" | `techspec.md` §9 ("Tarefas": "sem o número do mockup no título") |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/aluno/Atividades.tsx
teste: apps/web/src/areas/aluno/Atividades.test.tsx › com dado: três grupos
- {atividade.avaliativa && estaParaResponder(atividade) && <span className="block font-medium text-tinta">{AVISO_DA_AVALIACAO}</span>}
+ {atividade.avaliativa && <span className="block font-medium text-tinta">{AVISO_DA_AVALIACAO}</span>}
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividades.tsx
teste: apps/web/src/areas/aluno/Atividades.test.tsx › com dado: três grupos
- {atividade.avaliativa && estaParaResponder(atividade) && <span className="block font-medium text-tinta">{AVISO_DA_AVALIACAO}</span>}
+ {estaParaResponder(atividade) && <span className="block font-medium text-tinta">{AVISO_DA_AVALIACAO}</span>}
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividades.tsx
teste: apps/web/src/areas/aluno/Atividades.test.tsx › com dado: três grupos
- fim={<Estado familia={atividade.situacao === 'com_diagnostico' ? 'ok' : 'info'}>{TEXTO_DA_SITUACAO[atividade.situacao]}</Estado>}
+ fim={<Estado familia="info">{TEXTO_DA_SITUACAO[atividade.situacao]}</Estado>}
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividades.tsx
teste: apps/web/src/areas/aluno/Atividades.test.tsx › com dado: três grupos
- const { familia, Icone } = caraDaMateria(atividade.disciplina.nome)
+ const { familia, Icone } = caraDaMateria('')
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividades.tsx
teste: apps/web/src/areas/aluno/Atividades.test.tsx › o vazio de cada grupo aparece sozinho
- {atividades.length === 0 ? (
+ {atividades.length < 0 ? (
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividades.tsx
teste: apps/web/src/areas/aluno/Atividades.test.tsx › vazio total
- {itens.length > 0 && (
+ {itens.length >= 0 && (
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividades.tsx
teste: apps/web/src/areas/aluno/Atividades.test.tsx › sem página seguinte
- {atividades.hasNextPage && (
+ {true && (
```

```mutacao
arquivo: apps/web/src/areas/aluno/atividades.ts
teste: apps/web/src/areas/aluno/atividades.test.ts › separa em três grupos
- entregues: atividades.filter((atividade) => atividade.situacao === 'enviada' || atividade.situacao === 'encerrada'),
+ entregues: atividades.filter((atividade) => atividade.situacao === 'enviada'),
```

```mutacao
arquivo: apps/web/src/areas/aluno/atividades.ts
teste: apps/web/src/areas/aluno/atividades.test.ts › separa em três grupos
- entregues: atividades.filter((atividade) => atividade.situacao === 'enviada' || atividade.situacao === 'encerrada'),
+ entregues: atividades.filter((atividade) => atividade.situacao === 'encerrada'),
```

```mutacao
arquivo: apps/web/src/areas/aluno/atividades.ts
teste: apps/web/src/areas/aluno/atividades.test.ts › separa em três grupos
- corrigidas: atividades.filter((atividade) => atividade.situacao === 'com_diagnostico'),
+ corrigidas: atividades.filter((atividade) => atividade.situacao === 'com_diagnostico' || atividade.situacao === 'enviada'),
```

```mutacao
arquivo: apps/web/src/areas/aluno/materia.ts
teste: apps/web/src/areas/aluno/materia.test.ts › "Matemática", "matematica"
- .normalize('NFD')
```

```mutacao
arquivo: apps/web/src/areas/aluno/materia.ts
teste: apps/web/src/areas/aluno/materia.test.ts › "Matemática", "matematica"
- .replace(/\p{M}/gu, '')
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividades.tsx
teste: apps/web/src/areas/aluno/Atividades.test.tsx › "Ver mais tarefas" pede a segunda página
- {atividades.isFetchingNextPage ? 'Carregando…' : 'Ver mais tarefas'}
+ {false ? 'Carregando…' : 'Ver mais tarefas'}
```

```mutacao
arquivo: apps/web/src/areas/aluno/materia.ts
teste: apps/web/src/areas/aluno/materia.test.ts › "Matemática", "matematica"
- .toLowerCase()
```

```mutacao
arquivo: apps/web/src/areas/aluno/materia.ts
teste: apps/web/src/areas/aluno/materia.test.ts › "Matemática", "matematica"
- .trim()
```

```mutacao
arquivo: apps/web/src/areas/aluno/materia.ts
teste: apps/web/src/areas/aluno/materia.test.ts › nome desconhecido
- return MATERIAS.get(chaveDoNome(nome)) ?? RESERVA
+ return MATERIAS.get(chaveDoNome(nome)) ?? MATERIAS.get('matematica') ?? RESERVA
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Rodar o perfil `chromebook` (rede e CPU) nesta tela antes do pouso da spec | Validação da spec: o Validador fotografa e mede cada requisito com tela; não toca arquivo desta tarefa |
| frontend-reviewer (1ª) | Em 360 px o título é cortado em uma linha ("Cinemática: lista sinté…"); a mudança seria em `componentes/ui/Linha.tsx` | `TODO.md`: é da X1, fora desta tarefa |
| frontend-reviewer (1ª) | A reserva de matéria é `anil` com livro aberto e parece Física pela cor; reavaliar quando a X1 ganhar uma família neutra | `TODO.md`: depende da X1; a divergência já está declarada na tarefa e em `docs/interface.md` 9.1 |
| frontend-reviewer (1ª) | Conteúdo deslocado para a direita na foto do computador | Recusada: o revisor mesmo diz que é a largura padrão da `Tela` e não é defeito desta tarefa |
| infra-guardian (1ª) | O vazio de cada grupo olha só as páginas carregadas: "Nenhuma corrigida ainda." pode aparecer com "Ver mais tarefas" logo abaixo | `TODO.md`, para o Validador decidir o texto: muda o comportamento da tela, e a tarefa recusou o contador pelo mesmo motivo |
| infra-guardian (1ª) | `staleTime` de 60 s e `refetchOnWindowFocus: false` de `minhas-atividades` (`techspec.md` §9) | Tarefa 3.0, que toca `apps/web/src/api/atividades-do-aluno.ts`; o revisor mesmo diz que não é desta tarefa |
| conformidade-reviewer (1ª) e test-engineer (1ª) | "Encerrada" cai em "Entregues": para o aluno que respondeu 0 de 3, o título diz que entregou; falta teste desse caso | `TODO.md`, para o Validador e o produto: decidir o texto ou o grupo; a subtarefa 4.1 define o grupo hoje |
| conformidade-reviewer (1ª) | Conferir o selo de IA e a aprovação de quem dá a aula quando a tela do diagnóstico passar pela X4 | Tarefa 6.0 (a tarefa aberta, onde o diagnóstico aparece) |
| revisor-geral (1ª) | "Carregando as suas atividades…" e "…passar uma atividade para a turma…" ainda dizem "atividade" numa tela que se chama "Tarefas" | `TODO.md`: o rótulo do carregando é o mesmo que o e2e da 2.0 (`e2e/minha-turma.spec.ts`) e o teste do Início citam; mudar aqui sem mudar lá deixa os dois lugares diferentes |
| revisor-geral (1ª) | `FamiliaDeCor` importado de `componentes/ui/Contador`: o `Ladrilho` podia reexportar o tipo | `TODO.md`: é da X1 (`componentes/ui/`), fora desta tarefa |
| revisor-geral (1ª) | O e2e de 360 px acha o nome pelo `[title]`, detalhe interno da `Linha`; um `data-*` seria mais robusto | `TODO.md`: o `data-*` seria na `Linha`, da X1 |
| test-engineer (1ª) | A asserção de 44 px do e2e de 360 px passa sempre, porque a `Linha` tem `min-h-16`; medir também o selo ou o ladrilho | Recusada: o critério da tabela é "linha com 44 px", e medir o selo (`min-h-6`) mudaria o que se mede; fica para o Validador conferir no celular |
| privacy-guardian (1ª) | Prova em teste de componente de que a resposta atrasada do aluno anterior não vaza | Recusada: a tabela da tarefa fixa o "recomeço da tela" como e2e, e o e2e já o prova (`e2e/aluno-atividade.spec.ts`, "recomeço de Tarefas") |
| revisor-geral (3ª) e test-engineer (3ª) | `Atividades.test.tsx:184`: o `toBe(2)` do teste do contrato estrito depende de `TENTATIVAS_AUTOMATICAS = 1`; escrever `toBe(1 + TENTATIVAS_AUTOMATICAS)` ou pedir ao menos uma chamada | Recusada: o `test-engineer` confirmou que a contagem bate com o código de hoje e que o alerta é o sinal que prova a regra; se alguém mudar a tentativa automática, o teste quebra à vista, com a contagem no erro, e o ajuste é de uma linha nessa hora |
| revisor-geral (3ª) | O prazo de 4000 ms do `findByRole` fica perto do teto padrão do Vitest | Recusada: o `test-engineer` mediu que o `testTimeout` é 60 s (`vitest.config.ts:23`) e que a espera real é de um segundo |
| test-engineer (3ª) | Usar relógio falso (`vi.useFakeTimers({ shouldAdvanceTime: true })`) para não esperar um segundo real | Recusada: o revisor mesmo diz que não bloqueia e que a folga é ampla; a suíte roda em 2,27 s |

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 04:42:44 | 2026-10-25 04:43:23 | `frontend-reviewer` | 1 | APROVADO | ac9d39b454328b5f5 |
| 2026-10-25 04:42:59 | 2026-10-25 04:43:27 | `tenancy-guardian` | 1 | APROVADO | ae5c8a837a728af65 |
| 2026-10-25 04:43:06 | 2026-10-25 04:43:38 | `infra-guardian` | 1 | APROVADO | a721dcb148f33680d |
| 2026-10-25 04:42:48 | 2026-10-25 04:43:39 | `conformidade-reviewer` | 1 | APROVADO | a1e30b74180907be0 |
| 2026-10-25 04:43:03 | 2026-10-25 04:43:48 | `privacy-guardian` | 1 | APROVADO | ae83b6bcf7d5b44bd |
| 2026-10-25 04:42:55 | 2026-10-25 04:43:49 | `revisor-geral` | 1 | APROVADO | a4978a0df10a42895 |
| 2026-10-25 04:42:51 | 2026-10-25 04:44:40 | `test-engineer` | 1 | REPROVADO | a3a573600873cc666 |
| 2026-10-25 04:56:55 | 2026-10-25 04:57:33 | `test-engineer` | 2 | APROVADO | ab6c5cfb813e4abfb |
| 2026-10-25 04:57:06 | 2026-10-25 04:58:03 | `revisor-geral` | 2 | REPROVADO | a4f1fde6bca023ff6 |
| 2026-10-25 05:09:16 | 2026-10-25 05:09:37 | `revisor-geral` | 3 | APROVADO | aad56547f07e64a1e |
| 2026-10-25 05:09:03 | 2026-10-25 05:09:50 | `test-engineer` | 3 | APROVADO | ab39b454b1e0fd344 |

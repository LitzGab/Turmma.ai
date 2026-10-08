---
name: executar-task
description: Procedimento do Implementador — execução de UMA única tarefa
argument-hint: <caminho do N_task.md>
user-invocable: false
---

Você implementa **uma única tarefa**. Não avança para outras. Quem roda isto é o Implementador
(`.claude/agents/implementador.md`), no andar da spec, a pedido do Orquestrador (`/seguir`, D78).

Você provavelmente está começando com contexto limpo, e isso é de propósito: contexto
acumulado de tarefas anteriores faz improvisar. Por isso o passo 1 não é opcional.

Tarefa alvo: `$ARGUMENTS`

## 1. Contexto — pular isto invalida a tarefa

Leia, nesta ordem:

1. `docs/visao-produto.md` — o que é este produto. Sem isso você implementa software
   escolar genérico
2. `prd.md` e `techspec.md` da pasta da funcionalidade
3. O `N_task.md` da tarefa
4. As regras aplicáveis em `.claude/rules/` — cada uma explica o porquê; o porquê é o que
   permite decidir os casos que a regra não previu
5. `docs/glossario.md`

## 2. Planejar antes de codar

Escreva um plano curto: arquivos a criar ou alterar, interfaces, e a lista de testes que
vão provar a regra.

Se o plano contradisser a Tech Spec, **PARE e envie ao Orquestrador `/seguir DIVERGÊNCIA de Implementador`**,
com `Motivo: desenho`, a seção da Tech Spec e o que o plano pede (o formato está em
`.claude/agents/implementador.md`): quem tria é o Arquiteto. Não decida
arquitetura sozinho: a Tech Spec foi escrita por alguém que olhou o sistema inteiro, e você
está vendo um pedaço.

<critical>Divergência se registra; critério de aceite não se baixa. Seis reprovações no F1 foram
implementação que se afastou da spec ou da subtarefa sem dizer — e em duas delas a saída foi
**editar o documento para acomodar o resultado**: a linha do cenário de carga reescrita depois da
medição, e o limite de dois grupos do k6 desligado. Baixar a régua é decisão de quem é dono da
tarefa, nunca de quem implementa. O que diverge vai para a seção "Divergências resolvidas nesta
tarefa" do `N_task.md`, com o motivo, e, antes dos revisores, entra na `techspec.md`, no
`cenarios.md` e no documento que a seção 11 aponta, com o texto do código. Editar `.md` não caduca
rodada nem carimbo, com uma exceção: o `docs/runbook.md`, que a guarda `alerta-tem-runbook` lê, conta
como código e caduca os dois (`DOCUMENTO_QUE_UMA_SUITE_LE`, em `tools/processo/revisoes.ts`). O
maior do `/validar` da A0b foram seis decisões de tarefa que só estavam no `N_task.md`.</critical>

### Autoconferência antes de codar

O `test-engineer` é quem mais reprova (38% das rodadas no F0 e no começo do F1), e cada
reprovação custa uma rodada nova. Responda no plano, por escrito, as perguntas que ele vai
fazer, e as dos guardiões marcados:

- **Rode a mutação, não só imagine.** Liste cada cláusula que o diff acrescenta — condição de
  `where`, `if` de guarda, `catch` que traduz erro, restrição ou índice de migration, trava de
  clique, classe CSS que o e2e diz provar —, inclusive as que a tabela de testes não cita e as
  cópias da mesma regra em outro arquivo. Para cada uma: apague, rode, veja vermelho, restaure
  (`git checkout --`). Trava se prova pelo efeito (dois registros), não pela espera. Registre na
  seção "Mutações" do `N_task.md`: `arquivo` › função › trecho da cláusula → teste vermelho, sem
  número de linha, que muda a cada edição (o `test-engineer` apontou linha deslocada em quatro
  rodadas da A1). Na A0b foram seis reprovações (4.0, 5.0, 6.0 duas vezes, 7.0, 9.0) por cláusula
  sem teste, todas fora da lista que o implementador tinha conferido.
  Condição composta (`a && b && c`) se muta termo a termo: trocar a expressão inteira por `true`
  deixou dois de três termos sem teste na 17.0 da A1. E a mutação vale para a cláusula que entra
  depois, para atender um revisor: na 11.0 e na 13.0 da A1, a condição posta pelo ajuste do
  `frontend-reviewer` chegou sem linha nova em "Mutações" e o `test-engineer` reprovou.
- **O cenário tem o segundo dado que torna a cláusula observável?** Foi a maior causa técnica de
  reprovação no F1, catorze vezes: a regra está no código, mas o teste tem uma turma só, uma escola
  só, um estado só, ou o valor padrão só — e apagar a cláusula não deixa nada vermelho. Se o
  repository filtra por turma, o teste precisa de aluno em **duas** turmas; se filtra por estado,
  de vínculo em cada estado; se lê `inatividadeMin`, de escola com valor **diferente** do padrão.
- **Alguma checagem anterior responde antes da regra sob teste?** Cinco reprovações no F1 foram
  teste verde pelo motivo errado: a rota caía em `exigirAnoEmCurso()`, ou o e-mail não achava
  ninguém, e a cláusula que o teste dizia provar nunca era alcançada. Percorra o caminho até a
  linha que interessa e confirme que o cenário chega nela.
- **A asserção olha o resultado, ou a forma do código?** Asserção sobre texto de arquivo, nome de
  função ou lista vazia passa igual se a regra ler o campo errado. Compare o que o usuário obtém.
- **Algum comentário, docblock ou nota da tarefa afirma o que o código não faz?** Quatro
  reprovações no F1, três delas no mesmo docblock em rodadas seguidas. Neste repositório a regra
  do módulo mora no comentário: quem lê "e só elas" conclui que o caso está barrado, e o próximo a
  mexer "corrige" o código pelo comentário.
- **A divergência que você vai registrar cria ou muda uma regra?** Uma trava nova, um subcomando a
  mais sob a mesma conferência, uma gravação nova numa rota sem sessão. Três reprovações na A0 (3.0,
  5.0, 6.0) foram divergência registrada sem o cenário que a prova, e numa delas sem a pergunta de
  carga: a tentativa segurada passou a gravar no banco a cada requisição anônima. Antes do código, a
  divergência ganha a sua linha na tabela de testes e a resposta do guardião que ela toca (quem chama
  sem autenticação, quantas vezes por segundo, o que grava a cada vez).
- **Qual peça que já existe faz isto?** Sete recomendações entre o F1 e a A0 foram código que refazia
  o que o repositório já tinha: o hash do token de convite, o formato do apelido, a conferência de
  senha na vez, um módulo importando o service de outro. Procure em `apps/api/src/sessao/` e em
  `packages/nucleo/` antes de escrever. Reaproveite importando; se a peça está no lugar errado para
  dois módulos, mova-a para arquivo próprio ou para o `nucleo`, nesta tarefa, e não copie.
- Toda operação que pode acontecer duas vezes ao mesmo tempo tem teste com as duas chamadas
  **em paralelo** (`Promise.all`), não em sequência?
- **Corrida entre duas operações diferentes, ou resposta que chega fora de ordem, tem a ordem
  forçada no teste.** No banco, `GatilhoDeParada` e `esperarNaTrava`
  (`apps/api/test/gatilho-de-parada.ts`), como o C5 e o C11 da A1. Na tela, a resposta segurada
  com `page.route` ou o relógio parado com `page.clock.pauseAt`, como o teste da correção
  `2026-10-03-decididos-continuam-marcados`. `Promise.all` solto prova a ordem que sair, e vira
  intermitente no banco carregado da esteira: 4.0, 7.0, 11.0, 14.0 e o W6 da 16.0, na A1.
- O teste de isolamento quebraria sem a cláusula de escopo do repository?
- Os casos de borda do `N_task.md` têm cada um o seu teste?
- Leia a seção "O que verificar" de cada guardião marcado (`.claude/agents/<nome>.md`) e diga
  onde o plano atende cada item que se aplica.
- Se `tasks/prd-<func>/achados/indice.md` existe, leia: é uma linha por rodada com o que os
  revisores já exigiram nas tarefas anteriores. Não repita o mesmo erro. Abra o bloco inteiro
  (`achados/<N>_task.md`, no cabeçalho com o mesmo fim) só das linhas que tocam o que você vai
  mexer — o corpo todo passa de 600 KB por funcionalidade e não cabe na janela.

## 3. Implementar

- Uma subtarefa por vez, marcando `[ ]` → `[x]` conforme avança
- Teste junto com o código, nunca depois. Teste escrito depois testa o que o código faz,
  não o que ele deveria fazer
- Sem `any`, sem `TODO` deixado para trás, sem teste comentado
- Vocabulário do glossário no código e no banco
- Descobriu que a Tech Spec está errada: PARE e envie `/seguir DIVERGÊNCIA de Implementador`, com
  `Motivo: desenho`. Não improvise.

## 4. Portão local

```bash
node tools/processo/portao-local.ts            # typecheck, lint e test
node tools/processo/portao-local.ts --e2e      # se tocou tela (frontend-reviewer marcado)
node tools/processo/portao-local.ts --infra    # se mexeu em infra (regra 40, D52)
```

Com `--e2e`, os specs que a tarefa criou ou alterou rodam também repetidos, com os trabalhadores da
esteira, sobre o ambiente que o `test:e2e` deixou de pé:
`npx playwright test <specs da tarefa> --repeat-each 3 --workers 2`. A máquina roda o e2e com 6
trabalhadores e a esteira com 2. O W6 da 16.0 da A1 passou em três portões locais e caiu na esteira
por uma ordem de entrega que só a máquina lenta produziu (correção
`2026-10-03-decididos-continuam-marcados`, que reproduziu com `--repeat-each 3`).

O script instala as dependências se o `node_modules` for anterior ao lock, roda as suítes e,
se tudo passar, grava o carimbo em `.processo/portao.json`. **O hook bloqueia o commit sem
carimbo mais novo que a última alteração**, com as suítes que os revisores marcados exigem
(`--e2e` com `frontend-reviewer`, `--infra` com `infra-guardian`). O `revisor-geral` confere o
carimbo em vez de rodar tudo de novo.

"Mexeu em infra" é a tarefa com `infra-guardian` obrigatório, ou a que toca `infra/`,
Dockerfile, `tools/testes/`, `tools/ci/compose.ts`, métricas, saúde, prontidão ou borda. Na
dúvida, rode.

Falhou algum, conserte. Não prossiga com teste vermelho, não desabilite teste, não use
`.skip`. Teste vermelho é informação. Se o que falha está **fora** dos arquivos da tarefa (um teste de
outro módulo, a auditoria de dependências), não conserte aqui: envie `/seguir DIVERGÊNCIA de Implementador`,
com `Motivo: portão`, e encerre o turno.

**Rode o portão em segundo plano** (`run_in_background`), e espere a notificação do fim: ele leva de
10 a 25 minutos, mais que o limite de um comando em primeiro plano. Não use `sleep` para esperar.

Rode o portão antes de pedir a revisão. Mexeu em código depois dele, rode de novo antes do commit.

O `test` do portão começa derrubando o projeto de teste `educa-teste` com os volumes
(`EDUCA_BANCO_NOVO=1`). Enquanto ele roda, nada mais usa o banco de teste: nem revisor com
mutação, nem `npm run test:integracao` à mão, nem outro worktree.

## 5. Revisão

<critical>A tarefa não fecha sem os revisores obrigatórios. Não é recomendação: o hook
`tools/processo/revisoes.ts` registra cada rodada na seção "Revisões" do `N_task.md` e
BLOQUEIA o commit enquanto algum revisor obrigatório não tiver uma rodada que valha para o
código atual, com APROVADO nos que têm veto.</critical>

Obrigatórios são os marcados no `N_task.md` **mais `test-engineer` e `revisor-geral`, que toda
tarefa tem**, marcados ou não.

**Quem chama os revisores é a Mesa de revisão, não você**
(`.claude/skills/revisar-tarefa/SKILL.md`). Ela monta o prompt de cada um a partir da árvore, chama
na ordem certa e devolve o resultado. Quem implementa não escreve o prompt de quem o revisa (D78).

Com o portão local verde, peça a rodada e **encerre o turno**
(`.claude/skills/seguir/protocolo.md`, item 2). O nome da Mesa veio no pedido do Orquestrador:

```
PEDIDO de Implementador
Tarefa: tasks/prd-<funcionalidade>/<N>_task.md
Rodada: primeira | nova, depois da ordem <arquivo>
Orquestrador: <o nome que veio no pedido dele>
```

### O que volta

- **`RELATÓRIO` com "APROVADO por todos":** a aprovação é final. Se a linha "Sem aplicar" aponta um
  arquivo, copie a tabela dele para "Recomendações sem aplicar" do `N_task.md`, como está, e siga
  para o passo 6. Quem decide o que se aplica e o destino do resto é a Mesa, não você.
- **`ORDEM DE CORREÇÃO` com `Tipo: recomendações`:** os revisores aprovaram, e a Mesa escolheu as
  recomendações baratas a aplicar. Aplique como qualquer ordem, rode o portão e peça rodada nova:
  ela chama só quem caducou. Acontece uma vez por tarefa.
- **`ORDEM DE CORREÇÃO` com `Tipo: bloqueantes`:** abra o arquivo que ela aponta (`.processo/ordens/…`) e aplique **item
  por item, exatamente o que está escrito**: o arquivo, o trecho, a mudança e o teste que prova.
  Não amplie e não refatore o que a ordem não cita. Cláusula que entra por causa da ordem ganha a
  sua linha em "Mutações", como qualquer outra. Depois rode o portão local e peça rodada nova.
- **`DEVOLUÇÃO`:** a rodada não começou. Faça o que a mensagem pede (quase sempre, rodar o portão com
  as suítes que ela cita) e peça a rodada de novo.
- **Item que não dá para aplicar** (não se aplica ao código, contradiz outro item, ou só se atende
  baixando um critério de aceite): não improvise. Envie `/seguir DIVERGÊNCIA de Implementador`, com
  `Motivo: ordem`, e encerre o turno.

### Caducidade

Mexeu em código depois de uma aprovação, a aprovação caducou, e o hook diz de quem na hora do
commit. A caducidade segue o que o revisor audita: mudança **só em arquivo de teste** (`*.test.ts`,
`*.spec.ts`, `test/`, `e2e/`, `__fixtures__/`) caduca só `test-engineer` e `revisor-geral`; mudança
**só em comentário** de `.ts`/`.tsx` caduca só o `revisor-geral`, salvo comentário com diretiva
(`MARCAS_DE_DIRETIVA`, em `tools/processo/revisoes.ts`); qualquer outra caduca todos. O carimbo não
tem exceção: mudou qualquer coisa, o portão roda de novo. Por isso, na correção pedida pelo
`test-engineer`, mexa só no teste sempre que a ordem permitir.

**Não edite a seção "Revisões" nem nada dentro de `achados/`.** Quem escreve é o hook.

## 6. Conferência final

Antes do commit, com todos os revisores terminados:

```bash
node tools/processo/portao-local.ts conferir tasks/prd-<funcionalidade>/<N>_task.md
```

Carimbo inválido: rode o portão local de novo. Se ele mexer em código (formatação, snapshot),
volte ao passo 5 e peça à Mesa a rodada de quem o hook apontar.

## 7. Conclusão

Só depois de tudo verde e de a Mesa responder "APROVADO por todos":

- Marque a tarefa `[x]` em `tasks.md`, e leve o `tasks.md` no commit
- **Faça o commit da tarefa na branch do andar** (`spec/<funcionalidade>`, D78). Stage apenas os
  arquivos desta tarefa, incluindo o `N_task.md` com a seção "Revisões", o `estado.md` da pasta, que
  o Orquestrador atualizou antes de pedir a tarefa, a `techspec.md` e o `cenarios.md` quando uma
  divergência os mudou, e, se o hook os escreveu, `achados/<N>_task.md` e `achados/indice.md`, nunca
  `git add -A`.
  O `achados/indice.md` é da pasta, não da tarefa: se outro trabalho registrou rodada enquanto esta
  corria, a linha dele vem junto. **Leve assim.** O arquivo é só acrescentado, então a linha extra
  entra um commit mais cedo e nada se perde; tirá-la à mão perderia o registro dela.
  Veio um `achados-revisoes.md` de volta num merge (branch aberta antes de 22/09/2026)? Rode
  `node tools/processo/separar-achados.ts` antes do commit: ele separa e acumula, sem apagar o que
  já está em `achados/`. Ele mexe em mais coisa que a sua tarefa, e o stage acompanha: prepare a
  **deleção** do `achados-revisoes.md` e a pasta `achados/` **inteira**, não só o arquivo da tarefa
  — sem isso o commit vai sem a deleção e sem os blocos dos outros documentos.
  Mensagem no padrão `<Verbo> <o quê> (tarefa N.0)`, por exemplo
  `Implementa reivindicação de nome pelo link da sala (tarefa 4.0)`, com a linha
  `Revisões: <revisor> <veredito> (<n>ª rodada), ...` no corpo. Um commit por tarefa, nunca
  `--amend` em commit existente, nunca `--no-verify`.
  **O arquivo existe antes do comando do commit.** O hook lê a árvore antes de o comando rodar: não
  crie nem altere arquivo no mesmo Bash que faz o `git add` e o `git commit`.
  Antes do commit, `git diff --cached --name-only` confere com a lista dos arquivos da tarefa (um
  `git add` que falha num caminho errado não prepara nada daquele comando). Depois do commit e antes
  do push, `git show --stat HEAD` e `git status --short`: nada da tarefa pode ter ficado de fora. Se
  ficou e o commit ainda não foi enviado, `git reset --soft HEAD~1`, prepare de novo e refaça. Na
  15.0 da A1, o commit saiu parcial e só foi refeito porque alguém olhou
- **Commit bloqueado pelo hook:** a mensagem diz qual revisor falta, reprovou ou caducou.
  Resolva o que ela aponta, pedindo à Mesa a rodada que falta. Não contorne: o hook também bloqueia
  commit que leva código de `apps/`, `packages/`, `infra/` ou `e2e/` sem `(tarefa N.0)` nem
  `(correção <slug>)`
- **Faça o push logo depois do commit**, para a branch do andar: `git push -u origin HEAD`. Nunca
  para a `develop`: quem pousa é o Joaquim.
  A esteira não roda por tarefa. Ela roda uma vez, na branch, antes do pouso da funcionalidade
  (D78), e por isso o que prova a tarefa é o portão local e os revisores: e2e e infra só rodam aqui
  quando a tarefa os exige, e uma falha neles no fim pode ser de qualquer tarefa
- Envie o relatório ao Orquestrador (`.claude/skills/seguir/protocolo.md`, item 2), começando por
  `/seguir RELATÓRIO de <seu nome>`, e encerre o turno:

```
/seguir RELATÓRIO de <seu nome>
Tarefa: tasks/prd-<funcionalidade>/<N>_task.md
STATUS: SUCESSO | FALHA
Modelo: <o seu, como aparece no cabeçalho do terminal>
Commit e push: <hash> em spec/<funcionalidade>
Revisões: <a mesma linha do commit, com todas as rodadas de cada revisor obrigatório>
Motivo da falha: <se houver, com o arquivo a abrir>
```

`STATUS: FALHA` é para quando você não consegue concluir e não é caso de `DIVERGÊNCIA`: diga o que
ficou feito, o que falta e o arquivo a abrir. O trabalho fica na árvore, sem descartar nada.

Sem dump de código. Sem histórico de raciocínio. Quem lê o relatório é o Orquestrador, e ele só
precisa saber se pode seguir. O que foi implementado, os testes e o portão ele confere nos
arquivos.

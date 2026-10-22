# Tarefa 7.0 — Os 9 repositories com cópia local leem a escola por `exigirEscolaDoContexto`

**Funcionalidade:** reengenharia · **Depende de:** 6.0
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Os nove repositories que copiam `contextoAtual()?.escolaId` usam `exigirEscolaDoContexto` e saem de
`REPOSITORIES_SEM_ESCOPO`, cada um com a mutação do seu `where` contra o teste de isolamento.

## Contexto necessário

- `onda-1a.md` §2, "T6", item **7.0**; `techspec.md` §6; `prd.md` RF9
- Regra 10, itens 3 e 5: a 6.0 vê a chamada, não o `where`; a mutação por repository prova o `where`
- Os nove: `apps/api/src/estrutura/escola-sessao.repository.ts`; em `apps/api/src/sessao/`: `convite`, `criacao-de-sessao`,
  `escrita-de-sessao`, `redefinicao-de-mfa`, `registro-de-acesso` (`.repository.ts`); em `packages/nucleo/src/`:
  `configuracao/configuracao-operacional`, `fila/efeito-sintetico`, `uso/uso` (`.repository.ts`)
- `packages/nucleo/src/contexto/escola-do-contexto.ts`: a mensagem é `'consulta com escopo sem escola no contexto'`

## Subtarefas

- [x] 7.1 — Caracterização, num commit antes: os 7 sem caso de "sem escola" ganham o seu, verde com a cópia local
- [x] 7.2 — Os nove passam a `exigirEscolaDoContexto`, lida a cada chamada, nunca guardada na instância
- [x] 7.3 — Os nove saem de `REPOSITORIES_SEM_ESCOPO` (`tools/guardas/escopo-dos-repositories.ts`)
- [x] 7.4 — Testes: isolamento e concorrência por repository, com a mutação de cada um

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| os nove `*.repository.ts` acima | alterado |
| `tools/guardas/escopo-dos-repositories.ts` | alterado |
| `apps/api/src/sessao/{convite,escrita-de-sessao,eu}.repository.int.test.ts` | alterado |
| `apps/api/src/sessao/criacao-de-sessao.repository.int.test.ts` | novo |
| `apps/api/src/sessao/redefinicao-de-mfa.repository.int.test.ts` | novo |
| `apps/api/test/escola-sessao.int.test.ts` | alterado |
| `apps/worker/test/reexecucao.int.test.ts`, `apps/worker/test/uso.int.test.ts` | alterado |
| `apps/despachante/test/vagas.int.test.ts` | alterado |

## Testes que provam a regra

| Cenário | O que prova | Mutação |
|---|---|---|
| Caracterização: os nove, sem escola, lançam antes do banco | fail-closed igual | a cópia devolver `undefined` |
| Depois: a mensagem exata de `exigirEscolaDoContexto` (`eu…:34` e `convite…:238` mudam, **declarado**) | a migração aconteceu: a substring passa com a cópia | devolver a cópia em `registro-de-acesso` |
| `EscolaSessaoRepository`: A muda, B fica | isolamento | tirar `eq(escola.id, …)` de `alterar` |
| `ConviteRepository`: no contexto de B, o convite de A não ativa nem revoga | isolamento | tirar `eq(convite.escolaId, …)` de `ativar` |
| `CriacaoDeSessaoRepository`: em A grava `escola_id` de A, e B não ganha linha (novo) | grava na escola do contexto | gravar a escola do argumento |
| `EscritaDeSessaoRepository`: em B, a sessão de A não rotaciona | isolamento | tirar `eq(sessao.escolaId, …)` de `rotacionar` |
| `RedefinicaoDeMfaRepository.contaDoUsuarioAtivo`: em B, `undefined`; em A, a conta (novo) | isolamento do alvo | tirar `eq(usuario.escolaId, …)` |
| `RegistroDeAcessoRepository`: grava na escola do contexto | isolamento | gravar o `escolaId` do argumento |
| `ConfiguracaoOperacionalRepository.daEscola`: só a do contexto | isolamento | tirar o `eq(…escolaId…)` |
| `daEscola` com `rotinaDoSistema` e sem escola lança | a rotina não ganha leitura sem escopo | aceitar `rotinaDoSistema` |
| `EfeitoSinteticoRepository.gravar`: uma vez por chave, na escola do contexto | isolamento | `escola_id` fixo |
| `UsoRepository`: duas escolas no mesmo dia, cada uma com a sua conta | isolamento | tirar o `eq(…escolaId…)` de `doDia` |
| Concorrência (novo): `Promise.all` de A e B na mesma instância de `EfeitoSinteticoRepository.gravar` e de `UsoRepository.gravarDia` | escola lida a cada chamada | lê-la no construtor |
| Mantida: duas ativações do mesmo convite, uma vez | a trava fica | nenhuma |
| Mantida: oito gravações da mesma chave, uma linha | idem | nenhuma |
| Unidade: os nove fora de `REPOSITORIES_SEM_ESCOPO` | a trava os cobre | devolver a cópia em qualquer um |

Log novo: nenhum.

## Como testar

- Isolamento: `apps/api/src/sessao/convite.repository.int.test.ts › isolamento: no contexto de B, o usuário e o convite de A
  não são ativados nem revogados, e o nome é o de B` (`BancadaDeSessoes`, de `apps/api/test/sessao-de-teste.ts`: `escola()`)
- Sem escola: `convite.repository.int.test.ts › sem escola no contexto, falha fechada` (troque o texto esperado)
- Concorrência com `Promise.all`: caso novo, `apps/worker/test/reexecucao.int.test.ts › a mesma chave gravada ao mesmo tempo
  por A e por B, na mesma instância…`; o caso `jobs da escola A e da B reexecutados em sequência na mesma réplica…` ficou como
  estava. No `UsoRepository`: `apps/worker/test/uso.int.test.ts › repository: sem escola no contexto nada é lido nem gravado…`
- Os dois novos copiam `escrita-de-sessao.repository.int.test.ts › isolamento: no contexto de B, o id de uma sessão de A…`
- Isolado: `npx vitest run --project integracao <arquivo>` (sobe o compose de teste)
- Armadilha: o banco de teste acumula escolas; filtre pelo que o teste criou

## Fora do escopo desta tarefa

As portas de IA (8.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A 7.1 (caracterização) não tem commit próprio: os casos novos foram escritos e rodados verdes contra a cópia local (16 verdes, com a mensagem por substring `sem escola no contexto`), e só depois a 7.2 trocou a cópia e o texto esperado passou a ser o exato de `exigirEscolaDoContexto` | O hook só aceita commit com código de `apps/` ou `packages/` marcado `(tarefa N.0)`, com portão carimbado e a rodada dos revisores: um commit só de teste custaria isso duas vezes. O mesmo caminho da 14.0 e da 51.0 | `onda-1a.md` T6, bullet "7.0", "Duas escolhas da 7.0", item (i) (a exceção ao `techspec.md` §1 já estava escrita na 14.0) |
| A mutação do `ConviteRepository` é a do `revogar`, do `revogarParaRefazer`, do `revogado` e do `nomeDaEscola`, e não a "tirar `eq(convite.escolaId, …)` de `ativar`" da tabela | No `ativarPorConvite`, `eq(convite.escolaId, …)` (no `exists`) e `eq(usuario.escolaId, …)` (no `update`) barram o mesmo caso, o convite de A no contexto de B: tirar uma deixa a outra de pé, e o teste não pode ficar vermelho (mutação equivalente). A cláusula que sozinha barra o caso é a do `revogar` e a das outras três | `onda-1a.md` T6, bullet "7.0", "Duas escolhas da 7.0", item (ii) |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/api/src/estrutura/escola-sessao.repository.ts
teste: apps/api/test/escola-sessao.int.test.ts › repository: lê e altera só a escola do contexto
  .from(escola)
-.where(eq(escola.id, exigirEscolaDoContexto()))
  .for('no key update')
```

```mutacao
arquivo: apps/api/src/estrutura/escola-sessao.repository.ts
teste: apps/api/test/escola-sessao.int.test.ts › repository: lê e altera só a escola do contexto
  .set({ inatividadeAlunoMin: valores.inatividadeAlunoMin, inatividadeEquipeMin: valores.inatividadeEquipeMin })
-.where(eq(escola.id, exigirEscolaDoContexto()))
```

```mutacao
arquivo: apps/api/src/sessao/convite.repository.ts
teste: apps/api/src/sessao/convite.repository.int.test.ts › isolamento: no contexto de B, o usuário e o convite de A não são ativados nem revogados
-const [linha] = await this.banco.select({ nome: escola.nome }).from(escola).where(eq(escola.id, exigirEscolaDoContexto())).limit(1)
+const [linha] = await this.banco.select({ nome: escola.nome }).from(escola).limit(1)
```

```mutacao
arquivo: apps/api/src/sessao/convite.repository.ts
teste: apps/api/src/sessao/convite.repository.int.test.ts › isolamento: no contexto de B, o usuário e o convite de A não são ativados nem revogados
-.where(and(eq(convite.escolaId, exigirEscolaDoContexto()), eq(convite.id, conviteId), eq(convite.tipo, 'coordenador')))
+.where(and(eq(convite.id, conviteId), eq(convite.tipo, 'coordenador')))
```

```mutacao
arquivo: apps/api/src/sessao/convite.repository.ts
teste: apps/api/src/sessao/convite.repository.int.test.ts › isolamento: no contexto de B, o usuário e o convite de A não são ativados nem revogados
-.where(and(eq(convite.escolaId, exigirEscolaDoContexto()), eq(convite.id, conviteId), eq(convite.tipo, tipo), isNull(convite.revogadoEm)))
+.where(and(eq(convite.id, conviteId), eq(convite.tipo, tipo), isNull(convite.revogadoEm)))
```

```mutacao
arquivo: apps/api/src/sessao/convite.repository.ts
teste: apps/api/src/sessao/convite.repository.int.test.ts › revogarParaRefazer
-.where(and(eq(convite.escolaId, exigirEscolaDoContexto()), eq(convite.id, conviteId), eq(convite.tipo, tipo), isNull(convite.usadoEm), isNull(convite.revogadoEm)))
+.where(and(eq(convite.id, conviteId), eq(convite.tipo, tipo), isNull(convite.usadoEm), isNull(convite.revogadoEm)))
```

```mutacao
arquivo: apps/api/src/sessao/convite.repository.ts
teste: apps/api/src/sessao/convite.repository.int.test.ts › sem escola no contexto, falha fechada
  async ativarPorConvite(usuarioId: string, conviteId: string): Promise<boolean> {
-const escolaId = exigirEscolaDoContexto()
+const escolaId = '00000000-0000-4000-8000-000000000000'
```

```mutacao
arquivo: apps/api/src/sessao/criacao-de-sessao.repository.ts
teste: apps/api/src/sessao/criacao-de-sessao.repository.int.test.ts › isolamento: no contexto de A grava
-.values(novos.map((novo) => ({ ...novo, escolaId })))
+.values(novos.map((novo) => ({ escolaId, ...novo })))
```

```mutacao
arquivo: apps/api/src/sessao/criacao-de-sessao.repository.ts
teste: apps/api/src/sessao/criacao-de-sessao.repository.int.test.ts › sem escola no contexto, as duas gravações falham fechadas
  if (novos.length === 0) return []
-const escolaId = exigirEscolaDoContexto()
+const escolaId = '00000000-0000-4000-8000-000000000000'
```

```mutacao
arquivo: apps/api/src/sessao/criacao-de-sessao.repository.ts
teste: apps/api/src/sessao/criacao-de-sessao.repository.int.test.ts › sem escola no contexto, as duas gravações falham fechadas
  if (novas.length === 0) return []
-const escolaId = exigirEscolaDoContexto()
+const escolaId = '00000000-0000-4000-8000-000000000000'
```

```mutacao
arquivo: apps/api/src/sessao/escrita-de-sessao.repository.ts
teste: apps/api/src/sessao/escrita-de-sessao.repository.int.test.ts › isolamento: no contexto de B, o id de uma sessão de A não é rotacionado
-.where(and(eq(sessao.escolaId, exigirEscolaDoContexto()), eq(sessao.id, sessaoId)))
+.where(and(eq(sessao.id, sessaoId)))
```

```mutacao
arquivo: apps/api/src/sessao/escrita-de-sessao.repository.ts
teste: apps/api/src/sessao/escrita-de-sessao.repository.int.test.ts › isolamento: no contexto de B, o id de uma sessão de A não é rotacionado
-.where(and(eq(sessao.escolaId, exigirEscolaDoContexto()), eq(sessao.familia, familia), isNull(sessao.encerradaEm)))
+.where(and(eq(sessao.familia, familia), isNull(sessao.encerradaEm)))
```

```mutacao
arquivo: apps/api/src/sessao/escrita-de-sessao.repository.ts
teste: apps/api/src/sessao/escrita-de-sessao.repository.int.test.ts › isolamento: no contexto de B, o id de uma sessão de A não é rotacionado
  .set({ encerradaEm: sql`now()`, motivo })
-.where(and(eq(sessao.escolaId, exigirEscolaDoContexto()), eq(sessao.id, sessaoId), isNull(sessao.encerradaEm)))
+.where(and(eq(sessao.id, sessaoId), isNull(sessao.encerradaEm)))
```

```mutacao
arquivo: apps/api/src/sessao/escrita-de-sessao.repository.ts
teste: apps/api/src/sessao/escrita-de-sessao.repository.int.test.ts › isolamento: no contexto de B, o id de uma sessão de A não é rotacionado
  .set({ ultimoUsoEm: sql`now()` })
-.where(and(eq(sessao.escolaId, exigirEscolaDoContexto()), eq(sessao.id, sessaoId), isNull(sessao.encerradaEm)))
+.where(and(eq(sessao.id, sessaoId), isNull(sessao.encerradaEm)))
```

```mutacao
arquivo: apps/api/src/sessao/escrita-de-sessao.repository.ts
teste: apps/api/src/sessao/escrita-de-sessao.repository.int.test.ts › sem escola no contexto, falha fechada antes de tocar o banco
  .set({ ultimoUsoEm: sql`now()` })
-.where(and(eq(sessao.escolaId, exigirEscolaDoContexto()), eq(sessao.id, sessaoId), isNull(sessao.encerradaEm)))
+.where(and(eq(sessao.escolaId, '00000000-0000-4000-8000-000000000000'), eq(sessao.id, sessaoId), isNull(sessao.encerradaEm)))
```

```mutacao
arquivo: apps/api/src/sessao/redefinicao-de-mfa.repository.ts
teste: apps/api/src/sessao/redefinicao-de-mfa.repository.int.test.ts › isolamento: em B o usuário de A não é achado
-.where(and(eq(usuario.escolaId, exigirEscolaDoContexto()), eq(usuario.id, usuarioId), isNull(usuario.desativadoEm)))
+.where(and(eq(usuario.id, usuarioId), isNull(usuario.desativadoEm)))
```

```mutacao
arquivo: apps/api/src/sessao/redefinicao-de-mfa.repository.ts
teste: apps/api/src/sessao/redefinicao-de-mfa.repository.int.test.ts › sem escola no contexto, falha fechada antes de tocar o banco
-.where(and(eq(usuario.escolaId, exigirEscolaDoContexto()), eq(usuario.id, usuarioId), isNull(usuario.desativadoEm)))
+.where(and(eq(usuario.escolaId, '00000000-0000-4000-8000-000000000000'), eq(usuario.id, usuarioId), isNull(usuario.desativadoEm)))
```

```mutacao
arquivo: apps/api/src/sessao/registro-de-acesso.repository.ts
teste: apps/api/src/sessao/eu.repository.int.test.ts › isolamento: o registro de acesso do login grava na escola do contexto
-await this.tx.insert(registroAcesso).values({ escolaId: exigirEscolaDoContexto(), usuarioId, evento, ip })
+await this.tx.insert(registroAcesso).values({ escolaId: '00000000-0000-4000-8000-000000000000', usuarioId, evento, ip })
```

```mutacao
arquivo: apps/api/src/sessao/registro-de-acesso.repository.ts
teste: tools/guardas/repositories-com-escopo.test.ts › todo método público real tem
-await this.tx.insert(registroAcesso).values({ escolaId: exigirEscolaDoContexto(), usuarioId, evento, ip })
+await this.tx.insert(registroAcesso).values({ escolaId: '00000000-0000-4000-8000-000000000000', usuarioId, evento, ip })
```

```mutacao
arquivo: packages/nucleo/src/configuracao/configuracao-operacional.repository.ts
teste: apps/despachante/test/vagas.int.test.ts › a configuração operacional é lida só para a escola do contexto
-.where(eq(configuracaoOperacionalEscola.escolaId, escolaId))
```

```mutacao
arquivo: packages/nucleo/src/configuracao/configuracao-operacional.repository.ts
teste: apps/despachante/test/vagas.int.test.ts › a configuração operacional é lida só para a escola do contexto
  async daEscola(): Promise<LinhaOperacional | undefined> {
-const escolaId = exigirEscolaDoContexto()
+const escolaId = '00000000-0000-4000-8000-000000000000'
```

```mutacao
arquivo: packages/nucleo/src/fila/efeito-sintetico.repository.ts
teste: apps/worker/test/reexecucao.int.test.ts › o repository grava uma vez por chave na escola do contexto, e recusa gravar sem escola
  async gravar({ chaveIdempotencia, tentativa }: EfeitoDaExecucao): Promise<boolean> {
-const escolaId = exigirEscolaDoContexto()
+const escolaId = '00000000-0000-4000-8000-000000000000'
```

```mutacao
arquivo: packages/nucleo/src/fila/efeito-sintetico.repository.ts
teste: apps/worker/test/reexecucao.int.test.ts › a mesma chave gravada ao mesmo tempo por A e por B
  async gravar({ chaveIdempotencia, tentativa }: EfeitoDaExecucao): Promise<boolean> {
-const escolaId = exigirEscolaDoContexto()
+this.guardada ??= exigirEscolaDoContexto()
+const escolaId = this.guardada
```

```mutacao
arquivo: packages/nucleo/src/fila/efeito-sintetico.repository.ts
teste: tools/guardas/repositories-com-escopo.test.ts › todo método público real tem
  async gravar({ chaveIdempotencia, tentativa }: EfeitoDaExecucao): Promise<boolean> {
-const escolaId = exigirEscolaDoContexto()
+const escolaId = '00000000-0000-4000-8000-000000000000'
```

```mutacao
arquivo: packages/nucleo/src/uso/uso.repository.ts
teste: apps/worker/test/uso.int.test.ts › isolamento: duas escolas no mesmo dia, cada uma com a própria contagem
-.where(and(eq(usoInfraDiario.escolaId, escolaId), eq(usoInfraDiario.dia, dia)))
+.where(and(eq(usoInfraDiario.dia, dia)))
```

```mutacao
arquivo: packages/nucleo/src/uso/uso.repository.ts
teste: apps/worker/test/uso.int.test.ts › repository: sem escola no contexto nada é lido nem gravado
-.where(and(eq(usoInfraDiario.escolaId, escolaId), between(usoInfraDiario.dia, primeiro, ultimo)))
+.where(and(between(usoInfraDiario.dia, primeiro, ultimo)))
```

```mutacao
arquivo: packages/nucleo/src/uso/uso.repository.ts
teste: apps/worker/test/uso.int.test.ts › repository: sem escola no contexto nada é lido nem gravado
  async gravarDia(dia: string, valores: Partial<UsoDoPeriodo>): Promise<void> {
-const escolaId = exigirEscolaDoContexto()
+this.guardada ??= exigirEscolaDoContexto()
+const escolaId = this.guardada
```

```mutacao
arquivo: packages/nucleo/src/uso/uso.repository.ts
teste: apps/worker/test/uso.int.test.ts › repository: sem escola no contexto nada é lido nem gravado
  async doDia(dia: string): Promise<UsoDoPeriodo> {
-const escolaId = exigirEscolaDoContexto()
+const escolaId = '00000000-0000-4000-8000-000000000000'
```

```mutacao
arquivo: packages/nucleo/src/uso/uso.repository.ts
teste: apps/worker/test/uso.int.test.ts › repository: sem escola no contexto nada é lido nem gravado
  async doMes(mes: string): Promise<UsoDoPeriodo> {
-const escolaId = exigirEscolaDoContexto()
+const escolaId = '00000000-0000-4000-8000-000000000000'
```

```mutacao
arquivo: packages/nucleo/src/uso/uso.repository.ts
teste: tools/guardas/repositories-com-escopo.test.ts › todo método público real tem
  async doDia(dia: string): Promise<UsoDoPeriodo> {
-const escolaId = exigirEscolaDoContexto()
+const escolaId = '00000000-0000-4000-8000-000000000000'
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Caso de unidade com `rotinaDoSistema: true` e sem escola em `packages/nucleo/src/contexto/contexto.test.ts`; hoje só `vagas.int.test.ts:391` segura a regra | `TODO.md`: arquivo fora da tarefa e nenhuma tarefa seguinte o toca; novo arquivo de teste caducaria os revisores já aprovados |
| revisor-geral (1ª), test-engineer (1ª) | Mutação própria para `usuarioConvidado`, `criarConvite`, `travarEscola`, `dadosDaCoordenacao` e `dadosDoProfessor` em `convite.repository.ts`: só trocaram a cópia por `exigirEscolaDoContexto`, e a presença da chamada é provada pela guarda | `TODO.md`: exige caso de teste novo por método, mais que poucas linhas |
| revisor-geral (1ª) | `packages/nucleo/src/configuracao/configuracao-operacional.ts:165` ainda tem cópia local da checagem, com a mensagem `'configuração operacional sem escola no contexto'`; não é repository | `TODO.md`: fora do escopo da 7.0 (só repository), e nenhuma tarefa da onda toca o arquivo |
| tenancy-guardian (1ª) | Caso que isole cada cláusula de `ativarPorConvite` (`exists` e `update`) | Recusada: as duas cláusulas barram o mesmo caso, a mutação é equivalente, e a divergência está declarada em "Divergências resolvidas" e em `onda-1a.md` |
| tenancy-guardian (1ª), test-engineer (1ª) | Mutação com a escola fixa em `criarSessoes` | Recusada: o método não recebe escola por argumento, e o isolamento é da FK composta `(escola_id, usuario_id)`; já há a mutação de falha fechada |
| tenancy-guardian (1ª) | Mover o caso do repository de `apps/api/test/escola-sessao.int.test.ts` para `escola-sessao.repository.int.test.ts` | Recusada: o arquivo previsto na tarefa é `escola-sessao.int.test.ts`, e mover renomeia o teste citado nas mutações e caduca os revisores |
| revisor-geral (1ª) | A subtarefa 7.1 diz "os 7 sem caso de 'sem escola'", e pelo diff eram 4 | Recusada: a subtarefa já está marcada e o resultado está certo; é só a contagem do plano |

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
| 2026-10-22 13:21:11 | 2026-10-22 13:22:30 | `tenancy-guardian` | 1 | APROVADO | a971710f9bdb99788 |
| 2026-10-22 13:21:17 | 2026-10-22 13:22:35 | `revisor-geral` | 1 | APROVADO | ad19c04c12f58fd6c |
| 2026-10-22 13:21:14 | 2026-10-22 13:24:14 | `test-engineer` | 1 | APROVADO | a763f881b2f6b839b |

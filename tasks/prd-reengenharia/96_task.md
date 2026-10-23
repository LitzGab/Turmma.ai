# Tarefa 96.0 — Na API, `estrutura/`, `operacao/`, `sala/` e `atividade/` têm uma subpasta por recurso, e pasta de produção com mais de 25 arquivos reprova

**Funcionalidade:** reengenharia · **Depende de:** 15.0, 16.0, 17.0, 35.0, 51.0, 97.0
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Cada recurso das quatro pastas ganha a sua, como o `nest g resource` (`estrutura/turma/` com controller, service, repository e os testes que já moram
ao lado), e `apps/api/src` entra na trava das 25 por pasta que a 97.0 criou (`tools/guardas/tamanho-das-pastas.test.ts`, R56): pasta de produção com mais de 25 arquivos reprova, com lista fechada de exceções e motivo. Comportamento igual; script, uma pasta por commit.

## Contexto necessário

- `RECORTE.md` §3 item 7 e D81 (uma pasta por recurso; "~20 arquivos de produção" é a convenção, 25 é a trava); `33_task.md`, "Como testar" (script e conferência)
- Arquivos de produção na raiz hoje: `estrutura/` 28, `operacao/` 23 (25 com a 35.0), `sala/` 19, `atividade/` 16. A trava, com as raízes numa lista, é da 97.0 (hoje só `apps/web/src`)
- `atividade/correcao.int.test.ts` lê a **própria pasta** (`new URL('.', import.meta.url)`, sem recursão) para provar que `aprovar` e `aprovarLote` só têm um chamador; partida a pasta, ele olharia quase nada
- `entrega.int.test.ts:327` e o C40 de `arquitetura.test.ts` (`PASTA_DA_OPERACAO`) usam prefixo de pasta e continuam valendo

## Subtarefas

- [x] 96.1 — Num commit antes: a varredura de `correcao.int.test.ts` passa a ser recursiva sobre `atividade/` e confere o mesmo trio de arquivos; e `apps/api/src` entra na lista de raízes do `tamanho-das-pastas.test.ts`, com `apps/api/src/estrutura` como exceção provisória ("em movimento, 96.2")
- [x] 96.2 — `estrutura/`: `ano-letivo/`, `disciplina/`, `serie/`, `turma/`, `vinculo/`, `escola-sessao/` ← o `.controller`, `.service`, `.repository` de cada;
  `lista/` ← o trio mais `leitor-da-lista(.test)`; `provedores-da-escola/` ← `.controller`, `.service` e `provedores-liberados.repository`. Ficam na raiz `estrutura.module.ts` e `exclusao.ts` (dois repositories o usam)
- [x] 96.3 — `sala/`: `acesso-da-turma/`, `minha-turma/` ← o trio; `salas/` ← `salas.{controller,service}`; `reivindicacao/` ← `reivindicacao.{repository,service,service.test}` e `lista-livre.repository`;
  `decisao/` ← `decisao.{repository,service}` e `pedidos.controller`. Raiz: `sala.module.ts`, `codigo-da-sala(.test)`, `configuracao-da-sala`, `entrada-da-sala`, `limites-da-sala(.test)` (vários recursos os usam)
- [x] 96.4 — `atividade/`: `atividade-aplicada/`, `desempenho/`, `minha-atividade/` ← o trio; `correcao/` ← `correcao.{repository,service,int.test}`, `correcao-de-objetiva`, `lote(.controller)`, `leitura-do-lote`, com os testes.
  Raiz: `atividade.module.ts`, `atividade.int.test.ts`, `atividade-isolamento.int.test.ts` (cruzam recursos)
- [x] 96.5 — `operacao/`: `entrada/`, `segundo-fator/`, `sessao/` (com `prazos-da-sessao`), `convite/` (`convite-operador.*`), `painel/`, `eu/` ← o que tem o nome; `operador/` ← `operador.repository(.test)`;
  `escola/` ← `casos-de-uso/*` da 35.0. Raiz: o módulo, `guarda-de-operador`, `marcadores`, `desafio-de-operador(.test)`, `falhas-de-entrada`, `cookie-de-operador`, `dispositivo-de-operador`, `token-do-convite` (o e2e o importa)
- [x] 96.6 — Tira a exceção provisória; caminho citado como texto; conferência final

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/{estrutura,operacao,sala,atividade}/**` | movido e alterado |
| `apps/api/src/{app.module}.ts`, `{artefato,assistente,entrega,governanca,ia,material,privacidade,professores,tutor,sessao,credencial,ops,http}/**` | alterado (import) |
| `apps/api/test/**` (em especial `arquitetura.test.ts`: `eu.controller.ts`, `painel.repository.ts`, `operador.repository.ts`) | alterado |
| `apps/worker/test/fila-de-teste.ts`, `infra/scripts/{carga-login,carga-sala,ensaio-alertas}.ts`, `infra/test/{carga-sala,alertas}.test.ts` | alterado (import e `importar('apps/api/dist/…')`) |
| `tools/guardas/tamanho-das-pastas.test.ts` | alterado (a raiz `apps/api/src` e as exceções da API) |
| `tools/guardas/guardas.test.ts`, `docs/runbook.md:862`, `TODO.md` | alterado |

## Testes que provam a regra

Cobertura que já existe (`apps/api/test`, salvo indicação): `estrutura.int.test.ts › listagens paginadas…`, `estrutura-isolamento`, `vinculo`, `lista`, `provedores-da-escola`, `turma-acesso`, `virada-do-ano`, `historico` e
`leitor-da-lista.test.ts › E3…` (`src`); `salas-abrir`, `salas-reivindicar`, `acesso-da-turma`, `decisao`, `minha-turma`, `limites-da-sala`, `codigo-da-sala.test.ts`, `reivindicacao.service.test.ts` (`src`);
`atividade.int.test.ts`, `atividade-isolamento.int.test.ts`, `correcao.int.test.ts`, `correcao-de-objetiva.test.ts`, `lote.test.ts` (`src`); `entrada-operador`, `segundo-fator-operador`, `sessao-operador`, `convite-operador`,
`painel-*`, `operacao-isolamento`, `registros-operador`, e os C40 a C44 do `arquitetura.test.ts`.

| Cenário (novo) | Tipo | Fica vermelho se (a mutação) |
|---|---|---|
| No repositório real, nenhuma pasta de `apps/api/src` tem mais de 25 arquivos de produção na raiz dela, fora as exceções da API, cada uma com `motivo` | unidade | tirar a raiz `apps/api/src` da lista (os pontos de conferência da API somem), ou deixar uma exceção que a pasta não precisa (a provisória de `estrutura/`) |
| A contagem da 97.0 vale aqui: `.ts` e `.tsx` direto na pasta, sem `.test.`, `.d.ts` nem `__fixtures__` (`tamanho-das-pastas.test.ts › teste, declaração e fixture não contam; o que não é .ts nem .tsx também não`) | unidade | contar os `.test.ts` |
| Fixture `entrada-sem-esquema` (14.0) lintada como `apps/api/src/estrutura/turma/x.controller.ts` e `sessao/login/x.controller.ts` reprova (`guardas.test.ts › o controller em subpasta do módulo é barrado como o da raiz…`) | unidade | o `files` do bloco de `no-restricted-syntax` ficar em `*/*.controller.ts` |
| `correcao.int.test.ts`: um `.aprovar(` em `atividade-aplicada/atividade-aplicada.service.ts` o reprova | integração | a varredura voltar a não ser recursiva |

## Como testar

- Script e conferência como em `33_task.md`, um commit por pasta; o passo de texto troca `apps/api/{src,dist}/<antigo>` nos arquivos da tabela.
- A trava: `npx vitest run --project unidade tools/guardas/tamanho-das-pastas.test.ts`. Conta `.ts` e `.tsx` direto na pasta, sem `.test.`, `.d.ts` nem `__fixtures__`. Exceção da API só com motivo escrito; a lista fica vazia, porque nenhuma pasta passa do teto depois do movimento.
- Isolado: `npx vitest run --project integracao apps/api/test/operacao-isolamento.int.test.ts apps/api/src/atividade`; `rm -rf apps/api/dist` antes da conferência.

## Fora do escopo desta tarefa

A web (97.0); mover `apps/api/test/*.int.test.ts` para junto do código; o `dependency-cruiser` (12.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Um commit só para a tarefa, e não um por pasta nem a 96.1 num commit antes: o hook exige carimbo do portão e revisão aprovada em todo commit `(tarefa N.0)`, e a Mesa revisa a tarefa uma vez. Os quatro movimentos rodaram pelo script, em passos (`estrutura`, `sala`, `atividade`, `operacao`), com tipos e unidade conferidos no fim; o git guarda cada arquivo como renomeação | O processo (D78, D53) não tem como aprovar commit intermediário de uma tarefa (a mesma divergência da 33.0, da 36.0 e da 97.0) | `tasks.md`, "Tarefa mecânica" (a regra do commit por tarefa, escrita lá) |
| Sem exceção provisória de `estrutura/` nem exceção nenhuma: as quatro pastas terminam com no máximo 22 arquivos de produção na raiz da pasta (a maior é `apps/api/src/credencial`, com 22) e a lista de exceções da API fica vazia | A 96.6 tirava a provisória; como o movimento e a trava entram no mesmo commit, ela nunca existiu | `96_task.md`, subtarefas 96.1 e 96.6 |
| `operacao/escola/` recebe o conteúdo de `casos-de-uso/` (`escola.ts`, `escola.repository.ts` e o teste), e `casos-de-uso/` deixa de existir; `guardas.test.ts` e o guia passam a citar `operacao/escola/` | A subtarefa 96.5 manda o caso de uso para `escola/`; a pasta da 35.0 é a mesma | `96_task.md`, subtarefa 96.5 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › no repositório, nenhuma pasta das raízes da trava, web e API, passa de 25 arquivos de produção, e a conta enxerga as áreas e os recursos partidos
-const RAIZES_DA_TRAVA: readonly string[] = ['apps/web/src', 'apps/api/src']
+const RAIZES_DA_TRAVA: readonly string[] = ['apps/web/src']
```

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › no repositório, nenhuma pasta das raízes da trava, web e API, passa de 25 arquivos de produção, e a conta enxerga as áreas e os recursos partidos
-const EXCECOES_DA_TRAVA: readonly { pasta: string; motivo: string }[] = []
+const EXCECOES_DA_TRAVA: readonly { pasta: string; motivo: string }[] = [{ pasta: 'apps/api/src/estrutura', motivo: 'em movimento' }]
```

```mutacao
arquivo: apps/api/src/atividade/correcao/correcao.int.test.ts
teste: apps/api/src/atividade/correcao/correcao.int.test.ts › só uma pessoa aprova: sem sessão de usuário o serviço recusa, a reexecução do encerramento não aprova, e só a rota chama a aprovação
-      const fontes = readdirSync(pasta, { recursive: true, encoding: 'utf8' })
+      const fontes = readdirSync(pasta, { encoding: 'utf8' })
```

```mutacao
arquivo: apps/api/src/atividade/correcao/correcao.int.test.ts
teste: apps/api/src/atividade/correcao/correcao.int.test.ts › só uma pessoa aprova: sem sessão de usuário o serviço recusa, a reexecução do encerramento não aprova, e só a rota chama a aprovação
-      const pasta = fileURLToPath(new URL('..', import.meta.url))
+      const pasta = fileURLToPath(new URL('.', import.meta.url))
```

```mutacao
arquivo: apps/api/src/atividade/atividade-aplicada/atividade-aplicada.service.ts
teste: apps/api/src/atividade/correcao/correcao.int.test.ts › só uma pessoa aprova: sem sessão de usuário o serviço recusa, a reexecução do encerramento não aprova, e só a rota chama a aprovação
-const registro = new RegistroDeAuditoria()
+const registro = new RegistroDeAuditoria()
+const intruso = (repositorio: CorrecaoRepository) => repositorio.aprovar(1)
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | Os documentos de `.reengenharia/` (`diagnostico/U04.md`, `U05.md`, `U08a.md`, `LINHA-DE-BASE.md`, `MAPA.md`, `SUSPEITOS-MORTOS.md`) ainda citam os caminhos antigos | Recusada: registros históricos anteriores à 96.0, fora dos arquivos previstos da tarefa; o próprio revisor diz que não precisam mudar |
| revisor-geral (1ª) | Apagar a pasta vazia `operacao/casos-de-uso/` | Aplicada na rodada 1 (a pasta já não existe) |
| revisor-geral (1ª) | Escrever "nenhuma" na divergência 2 da tabela de divergências | Aplicada na rodada 1 (a linha saiu da tabela) |
| test-engineer (1ª) | Citar na tabela os testes das linhas 2 e 3; comentário ligando a mutação 4 à 5; `RAIZES_DA_TRAVA` sem uso | Aplicadas na rodada 1 |
| test-engineer (2ª) | O ramo `excecao.motivo.trim() === ''` (`tamanho-das-pastas.test.ts`) não tem mutação que o prove: extrair o filtro para uma função e testá-la com uma exceção de motivo vazio | Recusada: a lista de exceções está vazia e o revisor diz que não bloqueia; se a primeira exceção da API entrar, o teste do filtro entra junto, na tarefa que a criar |
| test-engineer (2ª) | A mensagem de falha do teste do repositório fala só da web ("telas, hooks e cliente de API") | `TODO.md`, junto da próxima tarefa que toca `tamanho-das-pastas.test.ts`: mensagem que sirva às duas raízes ("divida por assunto ou por recurso (D81)") |
| test-engineer (2ª) | `96_task.md:60` ainda dizia que a exceção provisória de `estrutura/` sai em 96.6 | Aplicada: a frase de "Como testar" foi corrigida |
| revisor-geral (2ª) | A tabela "Recomendações sem aplicar" estava vazia, sem a palavra "nenhuma" | Atendida ao preencher esta tabela |

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
| 2026-10-22 21:52:59 | 2026-10-22 21:53:46 | `tenancy-guardian` | 1 | APROVADO | a4951a8786d25c23e |
| 2026-10-22 21:53:43 | 2026-10-22 21:54:57 | `revisor-geral` | 1 | REPROVADO | a800ae223331bad2e |
| 2026-10-22 21:53:21 | 2026-10-22 21:56:31 | `test-engineer` | 1 | APROVADO | a2ad892264fbe739f |
| 2026-10-22 22:06:13 | 2026-10-22 22:06:34 | `revisor-geral` | 2 | APROVADO | a350d00d4b525745b |
| 2026-10-22 22:06:45 | 2026-10-22 22:07:16 | `test-engineer` | 2 | APROVADO | a5a6e2d00195acb57 |

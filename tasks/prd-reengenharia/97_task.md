# Tarefa 97.0 — Na web, `areas/professor/` e `areas/coordenacao/` se partem por assunto, com a mesma trava

**Funcionalidade:** reengenharia · **Depende de:** 36.0
**Subagentes obrigatórios:** `frontend-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Tarefa mecânica. O *feature folder* (bulletproof-react): cada assunto de `areas/professor/` (48 arquivos de produção) e
`areas/coordenacao/` (39) fica com as telas, os hooks e o cliente de API dele, por script. Esta tarefa cria a
trava de 25 arquivos de produção por pasta, em `apps/web/src`; a 96.0 acrescenta `apps/api/src` depois (R56). Comportamento igual.

## Contexto necessário

- `RECORTE.md` §3 item 7; `tasks.md` (97.0); `onda-2.md`, "Como se move"; D81
- `apps/web/nome-dos-chunks.ts`: `areaDoModulo` e `ehFachadaDaArea` exigem `areas/<papel>/rotas.tsx` na raiz da área, e
  `nome-dos-chunks.test.ts:101-106` já prova subpasta. **Contagem (R56):** arquivo `.ts`/`.tsx` direto na pasta, sem
  `.test.`, `.d.ts` nem `__fixtures__` (RECORTE: "~20 arquivos de produção"). Teste não conta: `privacidade/` (27 com
  teste) e `ui/ia/` (32) passam

## O mapa (testes vão com o arquivo; o cliente vem de `api/`)

`areas/professor/`, só `rotas.tsx` na raiz:

| Pasta | Arquivos (cliente em `api/`) |
|---|---|
| `inicio/` | Home, saudacao, fila-do-professor, SinoDoProfessor |
| `turmas/` | Turmas, Turma, TurmaHoje, AlunosDaTurma, alunos-da-turma, endereco-da-turma, Tutor, PainelDaContestacao, vinculo-na-tela, familia-da-disciplina, sinais (`acesso`, `tutor-da-turma`) |
| `turmas/acesso/` | AcessoDaTurma, acesso-da-turma, ConvidarAlunos, texto-do-whatsapp |
| `atividades/` | AtividadesDaTurma, AplicacaoDoArtefato, EncerramentoDaAtividade, Aprovar, aprovar, corrigir-de-novo (`atividades`) |
| `assistente/` | Conversa, conversa, CaixaDoAssistente, AtalhosDeFerramenta, memoria-do-professor, Time (`assistente`, `time`) |
| `ferramentas/` | Ferramentas, ferramentas, Ferramenta, CartaoDeFerramenta, ResultadoDaFerramenta, icones-de-ferramenta (`ferramentas`) |
| `artefatos/` | Artefato, ConteudoDoArtefato, ExportarPdf, Folha, miolo-do-documento, Criados, criados, entregas (`artefatos`, `entregas`, `titulos-dos-materiais`) |
| `comum/` | turmas-da-professora, avisos (`vinculos`) |

`areas/coordenacao/`, com `rotas.tsx`, `Escola.tsx`, `Registros.tsx`, `molduras.test.tsx` e `passagens.test.tsx` na raiz:

| Pasta | Arquivos |
|---|---|
| `painel/` | Painel, SinoDaCoordenacao, fila-da-coordenacao |
| `estrutura/` | Estrutura, AnoEDisciplinas, Alocacao, ListaDaTurma, ProfessoresDaTurma, OQueFalta, o-que-falta-da-escola, lista-curta, ler-arquivo-da-lista, previa-da-lista, nome-do-turno, turmas-da-escola (`lista`) |
| `professores/` | Professores, PainelDoProfessor, convite-de-professor, o-que-falta-para-alocar, professores-da-escola (`professores`) |
| `material/` | Material, DialogoDeEnvioDeMaterial, PainelDoMaterial, materiais-da-escola, material-envio (`material`) |
| `governanca/` | Agentes, Analista, DadoNominal, Governanca, textos-da-governanca, nunca-faz (`governanca`) |
| `privacidade/` | a que já existe (17), com `privacidade` e o teste dele |
| `comum/` | moldura, miolo-que-rola, endereco-da-tela, ordem, pecas-da-lista |

O cliente (15 dos 37 arquivos de `api/`, os que só uma área importa) vai para `<pasta>/api/`. Os 22 restantes ficam: o
compartilhado (`cliente`, `sessao`, `estrutura`, `execucoes`, `pedidos`, `alunos-da-turma`…), o do aluno e o da operação.
`assistente-e-entregas.test.ts` testa dois clientes: vai para `assistente/api/` e importa `artefatos/api/entregas`.

## Subtarefas

- [x] 97.1 — Caracterização, antes: `npx vitest run --project unidade apps/web` verde e os chunks do build (nome e brotli) em `.processo/chunks-antes.txt`
- [x] 97.2 — `.processo/mover-areas.mjs` (ignorado pelo git), com o ts-morph numa pasta de rascunho (`npm i --prefix .processo/ts-morph ts-morph@<exata>`, sem tocar o `package.json`) e `node .processo/mover-areas.mjs <pasta>`: edições de `getEditsForFileRename`, depois `git mv`, mais o `vi.mock('../../api/sessao')` de `Material.test.tsx`. Um commit por pasta, `(tarefa 97.0)`, com `comum/` primeiro; o `api/` do assunto vai no commit dele
- [x] 97.3 — Os literais de caminho: `ui/ia/avatar-so-nas-duas-pecas.test.ts` (`areas/coordenacao/Agentes.tsx`, `Analista.tsx`) e os comentários que citam a pasta velha (`grep -rn "areas/professor\|areas/coordenacao\|web/src/api"`)
- [x] 97.4 — Último commit: `tools/guardas/tamanho-das-pastas.test.ts`, com as raízes numa lista (hoje só `apps/web/src`) e a lista de exceções vazia

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/**`, `apps/web/src/areas/coordenacao/**` | movido, com o `import` |
| `apps/web/src/api/{acesso,tutor-da-turma,atividades,assistente,time,ferramentas,artefatos,entregas,titulos-dos-materiais,vinculos,governanca,lista,material,privacidade,professores}.ts` e os testes deles | movido |
| `apps/web/src/areas/titulo-das-telas.test.tsx` | alterado (import) |
| `apps/web/src/areas/navegacao.ts`, `api/alunos-da-turma.ts`, `componentes/{dialogos.tsx,copia-unica.tsx}`, `componentes/meus-dados/regras.ts`, `componentes/pedidos/atualizacao-dos-pedidos.ts` | alterado (só o caminho citado em comentário) |
| `apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts` | alterado (literais) |
| `tools/guardas/tamanho-das-pastas.test.ts` | novo |
| `e2e/professor-inicio.spec.ts`, `docs/interface.md`, `docs/aia/adaptacao.md`, `docs/pendencias-dos-mockups.md` | alterado (só o caminho citado) |

## Testes que provam a regra

| Cenário | Tipo | Fica vermelho se (a mutação) |
|---|---|---|
| Pasta com 26 arquivos de produção reprova e a nomeia; com 25 passa; `.test.` e `__fixtures__` não contam | unidade | o limite subir para 26 |
| O `apps/web/src` de verdade passa, com exceções `[]` (fechada, como `guardas.test.ts › configuração das guardas › as únicas exceções são …`) | unidade | tirar `apps/web/src` das raízes |
| O build de verdade e `nome-dos-chunks.test.ts` verdes: fachada `professor-*.js`, telas `tela-professor-*` | unidade | mover `rotas.tsx` de `areas/professor/` |
| Caracterização: unidade da web verde e chunks (nome e brotli) iguais antes e depois; diferença, só `parte-*` virando `tela-<área>-*`, e explicada | unidade, build | nenhuma |

**A diferença medida** (`.processo/chunks-antes.txt` e `chunks-depois-97.txt`, 155 chunks nos dois): (1) nove `parte-*` que só módulos de `api/` formavam viram `tela-<área>-*` (`artefatos`, `atividades`, `entregas`, `time`, `titulos-dos-materiais`, `vinculos` no professor; `material`, `privacidade`, `professores` na coordenação), todos de menos de 2 kB; (2) o tamanho em brotli muda em dezenas de bytes na maioria dos chunks (a entrada `index` +74 B, de 90 880 para 90 954; a fachada `professor` −19 B; `tela-professor-Time` −15 B; `parte-copia-unica` −28 B), sem módulo a mais nem a menos: os arquivos são renomeados com `git mv` e só o especificador de `import` muda. A causa são os nomes de arquivo que o código de cada chunk carrega (o mapa de pré-carregamento e os `import()`: 25 nomes na entrada, 109 na fachada do professor, 100 na da coordenação), que mudaram de prefixo e de hash, e a ordem dos módulos no pedaço. Nenhuma tela passou de 30 kB (`TETO_DE_UMA_TELA_EM_BYTES`), e a entrada continua em 90,9 kB, abaixo do teto de 150 kB do primeiro carregamento.

Sem isolamento, concorrência nem log.

## Como testar

- A trava: a contagem é uma função pura sobre uma lista de caminhos (o caso de 25 e 26 sem disco) e um `it` sobre o
  `apps/web/src` de verdade; a lista fechada, pelo molde de `guardas.test.ts › configuração das guardas`
- Telas: `node tools/ci/e2e.ts --manter-ambiente e2e/professor-ferramentas.spec.ts e2e/estrutura.spec.ts e2e/governanca.spec.ts`
- Isolado: `npx vitest run --project unidade apps/web`
- Armadilha: o pedaço que só tinha módulos de `api/` e duas telas de uma área dividiam deixa de ser `parte-*` e vira `tela-<área>-*`, sob o teto de 30 kB (`TETO_DE_UMA_TELA_EM_BYTES`)
- **Telas:** nenhuma muda; o `frontend-reviewer` confere o diff do build e o `grep` do caminho velho

## Fora do escopo desta tarefa

Regra de direção entre assuntos (12.0), as `eslint-suppressions` (13.0, que vem depois desta), `areas/aluno/`, `operacao/`,
e as `api/` que mais de um assunto usa.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Um commit só para a tarefa, e não um por pasta (97.2): o hook exige carimbo do portão e revisão aprovada em todo commit `(tarefa N.0)`, e a Mesa revisa a tarefa uma vez, não quinze. As quinze pastas rodaram pelo script, com tipos e unidade conferidos no fim; o git guarda cada arquivo como renomeação | O processo (D78, D53) não tem como aprovar commit intermediário de uma tarefa; o histórico por arquivo é o mesmo (a mesma divergência da 36.0) | `tasks.md`, "Tarefa mecânica" (a regra do commit por tarefa, escrita lá) e a subtarefa 97.2 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › 26 arquivos de produção reprovam
-const LIMITE_DE_ARQUIVOS_POR_PASTA = 25
+const LIMITE_DE_ARQUIVOS_POR_PASTA = 26
```

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › 26 arquivos de produção reprovam
-    .filter(([pasta, quantidade]) => quantidade > limite && !excecoes.some((excecao) => excecao.pasta === pasta))
+    .filter(([pasta, quantidade]) => quantidade >= limite && !excecoes.some((excecao) => excecao.pasta === pasta))
```

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › as raízes são só apps/web/src
-const RAIZES_DA_TRAVA: readonly string[] = ['apps/web/src']
+const RAIZES_DA_TRAVA: readonly string[] = []
```

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › as raízes são só apps/web/src
-const EXCECOES_DA_TRAVA: readonly { pasta: string; motivo: string }[] = []
+const EXCECOES_DA_TRAVA: readonly { pasta: string; motivo: string }[] = [{ pasta: 'apps/web/src/areas/professor/turmas', motivo: 'x' }]
```

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › teste, declaração e fixture não contam
-  if (!/\.tsx?$/.test(caminho)) return false
   if (/\.d\.ts$/.test(caminho) || /\.test\.tsx?$/.test(caminho)) return false
```

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › teste, declaração e fixture não contam
-  if (/\.d\.ts$/.test(caminho) || /\.test\.tsx?$/.test(caminho)) return false
+  if (/\.test\.tsx?$/.test(caminho)) return false
```

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › teste, declaração e fixture não contam
-  if (/\.d\.ts$/.test(caminho) || /\.test\.tsx?$/.test(caminho)) return false
+  if (/\.d\.ts$/.test(caminho)) return false
```

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › teste, declaração e fixture não contam
-  return !caminho.split('/').includes('__fixtures__')
+  return true
```

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › conta o que está direto na pasta
-    const pasta = posix.dirname(caminho)
+    const pasta = caminho.split("/").slice(0, 4).join("/")
```

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › a pasta da lista de exceções passa
-    .filter(([pasta, quantidade]) => quantidade > limite && !excecoes.some((excecao) => excecao.pasta === pasta))
+    .filter(([pasta, quantidade]) => quantidade > limite)
```

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › no repositório, nenhuma pasta de apps/web/src
-      return entrada.isDirectory() ? dePasta(filho) : [filho]
+      return [filho]
```

```mutacao
arquivo: tools/guardas/tamanho-das-pastas.test.ts
teste: tools/guardas/tamanho-das-pastas.test.ts › várias pastas acima do teto saem em ordem de pasta
-    .sort((a, b) => a.pasta.localeCompare(b.pasta))
```

```mutacao
arquivo: apps/web/src/rotas.tsx
teste: apps/web/nome-dos-chunks.test.ts › as áreas da escola: uma fachada por papel
-  professor: lazy(() => import('./areas/professor/rotas')),
+  professor: lazy(() => import('./areas/professor/inicio/Home')),
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral 1ª | Comentários de e2e citam `api/` velha: `e2e/acesso-da-turma.spec.ts:415` (`api/acesso.ts`) e `e2e/professores.spec.ts:309` (`api/professores.ts`) | `TODO.md`: tocar os dois specs faz o portão da tarefa rodar os e2e deles (regra 40, "e2e que a árvore alterou") por uma citação de comentário; fica para a tarefa que mexer neles |
| test-engineer 1ª | Os dois testes do build de `apps/web/nome-dos-chunks.test.ts` (linhas 301 e 323) usam o prazo padrão de 5000 ms e estouraram com a máquina cheia; já era assim antes | `TODO.md`: o arquivo não é da tarefa; vale prazo explícito no `it`/`describe` na próxima que o tocar |
| test-engineer 1ª | A mutação 4 prova só a lista literal | Recusada: o próprio revisor diz que basta para a lista fechada, e a mutação 10 prova o efeito da exceção |
| frontend-reviewer 1ª | `docs/mvp-rapido.md` (linhas 317 a 322 e 518 a 532) e `docs/pendencias-dos-mockups.md:15` citam `professor/Home.tsx`, `coordenacao/Agentes.tsx` e `professor/Turma.tsx` sem o prefixo `areas/` | Recusada: eram caminhos históricos já defasados antes da tarefa (`Catalogo.tsx`, `FerramentaForm.tsx`), registro datado; o próprio revisor diz que não bloqueiam |
| frontend-reviewer 1ª | No celular a aba "Ferramentas" aparece como "FERRAMEN…" na barra inferior | Recusada: truncamento que já existia, fora de uma tarefa que não muda tela; é assunto de pele |
| frontend-reviewer 1ª | O seed "vazia" da vitrine já traz uma turma e uma professora, então as telas "vazia" de Escola e Professores não exercitam o estado vazio da lista | Recusada: é da vitrine, não do diff; o estado vazio dessas listas é do teste de componente |
| revisor-geral 2ª | `tasks.md:194` (96.2, "Só `git mv` e import, uma pasta por commit") e `96_task.md:10` ("script, uma pasta por commit") contradizem a regra geral que esta tarefa escreveu em "Tarefa mecânica" (um commit por tarefa, com cada arquivo guardado como renomeação) | A 96.0: o Arquiteto escreve o `96_task.md` antes de ela partir (96.1) e alinha o texto da 96.2 nesse momento; a 96.0 ainda não começou |

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
| 2026-10-22 15:08:37 | 2026-10-22 15:10:59 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | af7f5ba0b6399b5a2 |
| 2026-10-22 15:08:46 | 2026-10-22 15:12:35 | `revisor-geral` | 1 | REPROVADO | a235dc913a5210d61 |
| 2026-10-22 15:08:42 | 2026-10-22 15:12:58 | `test-engineer` | 1 | APROVADO | a07d8b121e18b69b1 |
| 2026-10-22 15:20:12 | 2026-10-22 15:20:43 | `test-engineer` | 2 | APROVADO | ad5c9ddc9fd0accf4 |
| 2026-10-22 15:20:19 | 2026-10-22 15:20:48 | `revisor-geral` | 2 | APROVADO | abb264247f5eb8e83 |

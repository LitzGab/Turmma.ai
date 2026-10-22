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

O cliente (15 dos 36 arquivos de `api/`, os que só uma área importa) vai para `<pasta>/api/`. Os 21 restantes ficam: o
compartilhado (`cliente`, `sessao`, `estrutura`, `execucoes`, `pedidos`, `alunos-da-turma`…), o do aluno e o da operação.
`assistente-e-entregas.test.ts` testa dois clientes: vai para `assistente/api/` e importa `artefatos/api/entregas`.

## Subtarefas

- [ ] 97.1 — Caracterização, antes: `npx vitest run --project unidade apps/web` verde e os chunks do build (nome e brotli) em `.processo/chunks-antes.txt`
- [ ] 97.2 — `.processo/mover-areas.mjs` (ignorado pelo git), com o ts-morph numa pasta de rascunho (`npm i --prefix .processo/ts-morph ts-morph@<exata>`, sem tocar o `package.json`) e `node .processo/mover-areas.mjs <pasta>`: edições de `getEditsForFileRename`, depois `git mv`, mais o `vi.mock('../../api/sessao')` de `Material.test.tsx`. Um commit por pasta, `(tarefa 97.0)`, com `comum/` primeiro; o `api/` do assunto vai no commit dele
- [ ] 97.3 — Os literais de caminho: `ui/ia/avatar-so-nas-duas-pecas.test.ts` (`areas/coordenacao/Agentes.tsx`, `Analista.tsx`) e os comentários que citam a pasta velha (`grep -rn "areas/professor\|areas/coordenacao\|web/src/api"`)
- [ ] 97.4 — Último commit: `tools/guardas/tamanho-das-pastas.test.ts`, com as raízes numa lista (hoje só `apps/web/src`) e a lista de exceções vazia

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

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


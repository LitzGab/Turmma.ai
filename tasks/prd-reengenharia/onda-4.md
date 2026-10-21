# Tech Spec da X5 — Onda 4: a web, com a rede primeiro

**Comum:** `techspec.md` · **PRD:** RF23–RF26 (o prazo do RF25 já veio na 52.0) · **Tarefas:** 55.0 a 80.0

Os caminhos são relativos a `apps/web/src/`, com o layout da onda 2 (`kit/`, `componentes/`).

## 1. O que muda

Leva 1 (55.0–65.0): a rede de teste e os mecanismos. Leva 2 (66.0–80.0): as 51 funções de tela acima de 80 linhas
cortadas num molde só, cada uma depois do seu teste. A pessoa só vê a tela de erro na falha de render.

## 2. Desenho

### 2.1 A cobertura (RF24, N4)

`coverage-summary.json` de `08dc125`; meta global 5.680 de 6.682 ramos.

Hoje, ramos até 80 % / 85 %, e onde estão:
- base: 68,9 %, +271 / +391; `paginas/*` 321, `LoginPorCima` 42, `DialogoDoConvite` 44, `MeusDados` 40.
- `areas/aluno`: 47,8 %, +141 / +163; `Tutor` 98, `Atividade` 95, `Atividades` 15.
- `areas/professor`: 85,3 %, já passa; `Time` 60, `AplicacaoDoArtefato` 42, `Aprovar` 33.
- `areas/coordenacao`: 80,8 %, 12 de folga / +66; `AcoesDoPedido` 48, `RegistrarPedido` 45, `ListaDaTurma` 42.
- `operacao`: 43,8 %, +187 / +213; `NovaEscola` 49, `ConfigurarMfa` 44, `Convite` 42.

O piso de 80 % por pasta dá só 81,6 % no global: as cinco miram perto de 85 %.

**O medidor.** `tools/testes/cobertura-da-web.ts` roda o comando da `LINHA-DE-BASE.md` §2, com `@vitest/coverage-v8` por
`--no-save` (R9), agrega por pasta e falha abaixo do piso. `coverage.thresholds` pediria uma dependência que o PRD não
aceitou: o piso fica com o medidor e com o Validador.

### 2.2 O corte (RF24)

51 funções em 43 arquivos: professor 13, coordenação 14, aluno 2, operação 6, base 16.

**O molde.**
1. Um hook `useXxx` com as consultas, o estado local e os efeitos.
2. `<Leitura>`, ou a função pura `estadoDaXxx` (`carregando | erro | vazio | dado`), no lugar dos ternários.
3. Um subcomponente por região, e um `<DialogosDaXxx>` sem estado próprio.

Hooks repetidos vão para o kit: anúncio, painel no endereço, foco ao fechar, decisão única.

**Exemplo, `areas/professor/Aprovar.tsx`** (313 linhas, 135–452, complexidade 43):
- `useAberturaDeDestaque`, com `abrir`, `emAbertura` e o efeito do `?ver=` (162–198);
- `useDecisaoDeEntrega({ aprovar, rejeitar, avisos })`, sobre `useEnvioUnico` (`dialogos.tsx:26`), com `decidir`,
  `decidindo` e `confirmar`. Junta as quatro travas de duplo clique: `Aprovar:148`, `Time:86`, `AplicacaoDoArtefato:58`,
  `EncerramentoDaAtividade:37`;
- `situacaoDoLote()`, pura;
- `AbaDestaques`, `AbaOutras`, `AbaResumo`, `LinhaDoDestaque` e `DialogosDeDecisao`;
- sobram umas 60 linhas.

**A prova de que a tela não mudou.**
1. A caracterização é da leva 1, e o commit do corte não a toca (`git diff --stat`, pela Mesa). Mutações declaradas:
   tirar a trava de duplo clique, ou o `if (problema) return` da rejeição.
2. O e2e à mão nos dois projetos (`node tools/ci/e2e.ts --manter-ambiente e2e/<x>.spec.ts`), que o portão não roda.
3. Foto: `node tools/vitrine/vitrine.ts foto <papel> <endereço> --clicar <seletor>`. Operador e páginas anônimas, fora
   da vitrine, ficam com 1 e 2.

`--prune-suppressions` a cada corte; a 80.0 fecha com zero supressão de `max-lines-per-function` em tela. Na
geração da leva 2, grupo com mais de duas telas se parte em uma tela, ou um diálogo grande, por tarefa.

### 2.3 A fronteira na raiz e `reportarFalha` (RF25, R26)

`FronteiraDaArea` com `paginaInteira`, já a tela de falha, envolve `<Rotas/>` em `main.tsx` e ganha `componentDidCatch`.
A porta `api/relato-de-falha.ts`: `reportarFalha(evento: { tipo: string; rota: string }): void`, que por padrão não envia
nada. `rota` é só o `location.pathname` (o token da turma pública vai no fragmento), sem mensagem nem pilha.

### 2.4 T15 — sessão, leitura e kit

**A sessão (57.0).** `criarSessao({ travas?, agora?, esperar? })` em `api/sessao.ts`.
- As 12 `let` e os três `Set` (76–139) vão para a closure; `sessaoDaAba = criarSessao()` exporta as mesmas funções, e os
  55 importadores não mudam.
- `sessao/contexto.tsx`: `ContextoDaSessao` e `useSessao()`, nas 7 páginas, `LoginPorCima`, `SeletorDeEscola`, `CascaDaEscola`.
- `renderizarTela(tela, { sessao })`: sessão nova por caso, sem `vi.resetModules()`. `operacao/api/sessao.ts` fica (P4).
- Fica, com teste, `anunciar()` antes de `limparDadosDaEscola()` (`sessao.ts:323-324`).
- Trava `no-restricted-imports`: `paginas/` e `componentes/` só importam `useSessao`, e `operacao/` não importa
  `api/sessao`.

**A leitura (58.0).** `<Leitura consulta carregando vazio naoEncontrado>{(dados) => …}</Leitura>` e `EstadoErro({ consulta })`,
em `componentes/estado/`.
- Embutem `cancelRefetch: false` e `useFocoAoRecuperar` (hoje em `paginas/Casca.tsx:24`), para `useQuery` e
  `useInfiniteQuery`.
- `EstadoErro` guarda `erro` e `aoTentarDeNovo` só para o não-consulta (`rotas.tsx:99`), e o "há uma versão nova" (20.0).
- Os quatro `refetch()` do `Painel.tsx` ganham `cancelRefetch: false` (como `Casca.tsx:11-18`).
- Trava `no-restricted-syntax` contra `aoTentarDeNovo=` e `.refetch(` fora de `componentes/estado/`, com catraca por arquivo, zerada na 80.0.

**O kit (59.0).**
- `Botao` com `como`, no lugar de `classesDoBotao` e `CLASSES_DO_BOTAO_*` (36 arquivos).
- `ConfirmacaoDePerigo` vira o caso `perigo` de `DialogoDeConfirmacao`, e `Faixa` vira variante de `Aviso`.
- Trava `no-restricted-syntax` para `<button` e `CLASSES_DO_BOTAO_*` fora do kit.

### 2.5 RF26 — a entrada comum (75.0)

`kit/entrada/` tem `CamposDeEntrada`, `CampoDoSegundoFator({ recuperacao, codigo, aoMudar })` e `AlertaDaEntrada({ texto })`.
Recebem valores e texto, nunca o erro nem a sessão: cada pilha traduz o seu erro.

Substituem `paginas/Mfa.tsx:84-120` (igual a `operacao/paginas/Mfa.tsx:89-125`), `paginas/Entrar.tsx:69-92` (igual a
`operacao/paginas/Entrar.tsx:63-86`) e 10 linhas de `ConfigurarMfa`.

**As travas.**
- `kit/entrada/` não importa `api/sessao` nem `operacao/api`.
- Um teste de fonte exige `autoComplete="one-time-code"` e `maxLength={TAMANHO_MAXIMO_SENHA}` só em `kit/entrada/`.
- Seguem verdes o e2e B2 (`operacao.spec.ts:406`) e `nome-dos-chunks.test.ts`.

### 2.6 O sino pela leitura pronta (79.0)

`useFilaDoProfessor` (`areas/professor/fila-do-professor.ts`, 398 linhas, 12 leituras em série) e a fila da coordenação
viram um `useQuery` de `GET /v1/professor/esperando` e de `/v1/coordenacao/esperando` (37.0, 38.0). Saem `relerEmSerie`, `serie`, `TETO_DE_TURMAS_LIDAS`, `turmas-da-escola.ts` e `o-que-falta-da-escola.ts`. "Escola
montada" vem do roteiro (39.0).

## 3. Falha

- **Componente lança:** tela de falha com "Tentar de novo". Teste numa rota pública, numa área e na casca.
- **`reportarFalha`:** nada sai do navegador; o evento só tem tipo e rota, sem consulta nem fragmento.
- **Leitura falha:** `EstadoErro` com "Tentar de novo", e o foco volta. Teste com `<Leitura>` e a rota derrubada.

## 4. Isolamento, dado pessoal, conformidade, carga

- **Isolamento:** `criarSessao` limpa os dados da escola na troca, com teste.
- **Dado pessoal:** nada novo sai do navegador.
- **Conformidade:** textos de aprovação (D46) idênticos.
- **Carga:** o chunk do aluno tem 2.169 B de folga até 5.000; os hooks novos vão para o kit, compartilhado.

## 5. Tarefas

Número, título, RF, dependência, veto. Corre junto o que não depende entre si. Porte grande: 57.0, 58.0 e 59.0.

**Leva 1 — a rede e os mecanismos**
- 55.0 A cobertura da web sai por pasta e falha abaixo do piso · RF24 · onda 3
- 56.0 Componente que lança mostra a tela de falha, sem envio · RF25 · onda 3 · privacy
- 57.0 A página de entrada é testável com a sessão injetada · T15 · onda 3 · privacy, tenancy
- 58.0 Toda leitura passa por `<Leitura>` · T15 · onda 3
- 59.0 Um botão só e uma confirmação de perigo só · T15 · 57.0, 58.0
- 60.0 Aprovar, Time e Aplicação provados antes do corte · RF23 · 55.0 · conformidade
- 61.0 Tutor e Atividade do aluno provados · RF23 · 55.0 · privacy, conformidade
- 62.0 Páginas anônimas e login por cima provados · RF24 · 57.0 · privacy
- 63.0 As peças da base estão provadas · RF24 · 55.0
- 64.0 A operação está provada · RF24 · 55.0
- 65.0 A coordenação está provada · RF24 · 55.0 · privacy, conformidade

**Leva 2 — os cortes, com a prova da §2.2** (RF24, salvo onde dito)
- 66.0 `Aprovar` · 59.0, 60.0
- 67.0 `Time`, `AplicacaoDoArtefato`, `EncerramentoDaAtividade` (o hook da 66.0) · 66.0
- 68.0 `Atividade` · 59.0, 61.0
- 69.0 `Tutor` · 59.0, 61.0
- 70.0 `Estrutura` e `AnoEDisciplinas`, com os hooks de anúncio, painel e ano · 59.0, 65.0
- 71.0 `Material`, `DialogoDeEnvioDeMaterial` e `ListaDaTurma` · 70.0
- 72.0 `Professores`, `PainelDoProfessor`, `DetalheDoPedido`, `Agentes`, `Governanca` e `Analista` · 71.0
- 73.0 Professor, turma: `Turmas`, `TurmaHoje`, `AlunosDaTurma`, `AtividadesDaTurma`, `ConvidarAlunos` · 59.0
- 74.0 Professor, artefato: `Artefato`, `Criados`, `Conversa` · 59.0
- 75.0 A entrada comum e `Mfa`, `Entrar`, `ConfigurarMfa` e `Convite` das duas pilhas · RF26 · 62.0, 64.0
- 76.0 Operação: `NovaEscola`, `Escolas` e `NovaRede` · 64.0
- 77.0 Base: `TurmaPublica`, `Convite`, `LoginPorCima`, `CascaDaEscola`, `Menu`, `SeletorDeEscola` · 62.0, 63.0
- 78.0 Base: `DialogoDoConvite`, `ListaDePedidos`, `DialogoDeDecisao`, `MotorFormulario`, `CaixaPedido` · 63.0
- 79.0 Sino, "escola montada" e fila da coordenação vêm da leitura pronta · RF15, RF24 · 70.0
- 80.0 Galeria, 63 repetições e lints em zero, metas medidas · 66.0–79.0

**Vetos da leva 2.** `frontend-reviewer` em toda a onda; `conformidade-reviewer` no Aprovar, Time, Tutor e Atividade;
`privacy-guardian` no aluno, na base anônima e na privacidade.

**Conflito.** 57.0, 58.0, 59.0, 75.0 e 80.0 acrescentam bloco ao `eslint.config.mjs`: uma linha, resolvida no encontro.

## 6. Riscos

- **`TEMPO_ESGOTADO`** se repete uma vez (`cliente-de-consultas.ts:16`): perto de 41 s até o botão. Fica, por ser o
  comportamento de hoje.
- ⚠️ **A vitrine** talvez não semeie lote de correção, entrega, prova e conversa do Tutor. Sem isso, Aprovar, Time, Tutor
  e Atividade ficam com o teste e o e2e.
- **A 83.0 (onda 5)** toca os mesmos specs de e2e, e os deixa para o fim.

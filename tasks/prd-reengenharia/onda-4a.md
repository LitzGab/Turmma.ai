# Tech Spec da X5 — Onda 4A: a rede de teste e os mecanismos da web

**Comum:** `techspec.md` · **PRD:** RF23–RF25 (o prazo do RF25 já veio na 52.0) · **Tarefas:** 55.0 a 65.0
**A onda 4 foi partida na rodada 2 da revisão:** a leva 2, com os cortes e o sino, está em `onda-4b.md`.

Caminhos relativos a `apps/web/src/`, com o layout da onda 2.

## 1. O que muda

A leva 1 põe a rede de teste e os mecanismos de que os cortes precisam: cobertura por pasta, caracterização das telas
oficiais, a fronteira de erro na raiz, a sessão injetável, a `<Leitura>` e o kit. A pessoa só vê a tela de erro mudar.

## 2. Desenho

### 2.1 A cobertura (RF24, N4)

Meta global: 5.680 de 6.682 ramos (`08dc125`). Hoje: base 68,9 %, aluno 47,8 %, professor 85,3 %, coordenação 80,8 %,
operação 43,8 %. O piso de 80 % por pasta dá só 81,6 % no global: as cinco miram perto de 85 %.

**O medidor.** `tools/testes/cobertura-da-web.ts` roda o comando da `LINHA-DE-BASE.md` §2, com `@vitest/coverage-v8` por
`--no-save` (R9), e falha abaixo do piso por pasta. A trava some depois da X5 (pendência no `TODO.md`). Cobertura não é
prova: cada teste das 60.0 a 65.0 declara as mutações do comportamento que fixa.

### 2.2 O molde do corte e a prova de que a tela não mudou (RF24)

51 funções em 43 arquivos: professor 13, coordenação 14, aluno 2, operação 6, base 16. Os cortes estão em `onda-4b.md`.

**O molde:** um hook `useXxx` com consultas, estado e efeitos; `<Leitura>` ou a função pura `estadoDaXxx` no lugar dos
ternários; um subcomponente por região e um `<DialogosDaXxx>` sem estado. Hook repetido vai para o kit.

**Exemplo, `areas/professor/Aprovar.tsx`** (313 linhas): `useAberturaDeDestaque` (162–198); `useDecisaoDeEntrega`, sobre
`useEnvioUnico` (`dialogos.tsx:26`), com as travas de `Aprovar:148`, `Time:86`, `AplicacaoDoArtefato:58` e
`EncerramentoDaAtividade:37`; `situacaoDoLote()`, pura; e as abas.

**A prova.**
1. A caracterização é da leva 1, e o commit do corte não a toca (`git diff --stat`). Cada mutação diz o teste que fica
   vermelho (`arquivo › caso`). "Novo" é caso que a 60.0 escreve; o resto já existe. Na 60.0
   (`areas/professor/`, `e2e/`):
   - **Aprovar**, cinco:
     - sem a trava `decidindo` (`Aprovar.tsx:148`): `Aprovar.test.tsx › clique duplo em confirmar aprova uma vez` (novo);
     - sem o `if (problemaDaJustificativa !== undefined) return` (`:271`): `professor-aprovar.spec.ts › rejeitar a
       correção exige justificativa…` e `Aprovar.test.tsx › rejeitar sem justificativa não chama a API` (novo);
     - sem `disabled={!dados.podeAprovar}` (`:417`, D56): `Aprovar.test.tsx › quem liga o botão é a API…`;
     - o destaque sem `abrirDestaque` (`:163`): `Aprovar.test.tsx › dois cliques seguidos no mesmo destaque mandam uma
       abertura só…`;
     - o diálogo sem `resumoDoLote` (`:446`) ou com outro texto: `professor-aprovar.spec.ts › o botão de aprovar fica
       desligado até o último destaque ser aberto…` e `Aprovar.test.tsx › a confirmação traz o resumo do lote` (novo).
   - **Time**, duas, em `Time.test.tsx`, que hoje só cobre o miolo: sem `decidindo` (`Time.tsx:86`), `› clique duplo em
     decidir decide uma vez` (novo); sem `resumoDaAprovacao` (`:378`, `:393`), `› a confirmação traz o resumo` (novo).
   - **Aplicação**, duas, em `AplicacaoDoArtefato.test.tsx`, que nasce na 60.0: sem `decidindo`
     (`AplicacaoDoArtefato.tsx:58`), `› clique duplo em aplicar aplica uma vez`; sem o `resumo` (`:176`), `› a confirmação
     diz o que vai à turma`, junto de `professor-aplicacao.spec.ts › aplicar pede a escolha "é avaliativa?"…`.
2. O e2e à mão nos dois projetos (`node tools/ci/e2e.ts --manter-ambiente e2e/<x>.spec.ts`).
3. Foto: `node tools/vitrine/vitrine.ts foto <papel> <endereço> --clicar <seletor>` (fora da vitrine, só 1 e 2).

### 2.3 A fronteira na raiz e `reportarFalha` (RF25, R26)

`FronteiraDaArea` com `paginaInteira` envolve `<Rotas/>` em `main.tsx` e ganha `componentDidCatch`. A porta
`api/relato-de-falha.ts`: `reportarFalha({ tipo: TipoDeFalha; rota: string })`, com `TipoDeFalha` união fechada
(`'render' | 'contrato'`), por padrão sem envio. `rota` é o `location.pathname`, sem mensagem nem pilha.

### 2.4 T15 — sessão, leitura e kit

**57.0, 58.0 e 59.0 só criam o mecanismo**, com teste próprio. A tela migra no seu corte (66.0 a 78.0), depois da
caracterização, e as travas têm catraca por arquivo, zerada na 80.0.

**A sessão (57.0).** `criarSessao({ travas?, agora?, esperar? })` em `api/sessao.ts`.
- As 12 `let` e os três `Set` (76–139) vão para a closure; `sessaoDaAba = criarSessao()` mantém os 55 importadores.
- `sessao/contexto.tsx` com `useSessao()`, que as páginas, `LoginPorCima`, `SeletorDeEscola` e `CascaDaEscola` usam
  a partir da 77.0. `renderizarTela(tela, { sessao })` dá sessão nova por caso. `operacao/api/sessao.ts` fica (P4).
- Ficam, com teste, `anunciar()` antes de `limparDadosDaEscola()` (`sessao.ts:323-324`) e os ganchos `aoTrocarDeSessao`
  e `estadoDaSessao()` que o espelho da prova usa para limpar o pendente no "Sair" e na suspensão, e não na sessão
  vencida (53.0: a limpeza mora em `api/espelho-da-fila.ts`, carregado pela casca, e não em `sessao.ts`; a troca de
  dono é a `CascaDaEscola` chamando `esquecerEspelhosDeOutroDono` a cada `/v1/eu`). A 57.0 não mexe nisso.
- Trava `no-restricted-imports`: `paginas/` e `componentes/` só importam `useSessao`, e `operacao/` não importa
  `api/sessao`.

**A leitura (58.0).** `<Leitura consulta carregando vazio naoEncontrado>{(dados) => …}</Leitura>` e `EstadoErro({ consulta })`,
em `componentes/estado/`.
- Embutem `cancelRefetch: false`. `useFocoAoRecuperar` (`paginas/Casca.tsx:24`) só vale na leitura `principal`, uma
  por tela: duas que se recuperam juntas movem o foco uma vez. "Recarregar" tem alvo de 44 px.
- Consulta → estado, um teste por caso em `Leitura.test.tsx`: `isPending` sem dado, `carregando`; com dado (mesmo
  `isFetching` ou erro na releitura), `dado`; erro sem dado, `erro`; `NAO_ENCONTRADO`, `naoEncontrado`; `vazio(dados)`,
  `vazio`; `enabled: false` sem dado, nada; `useInfiniteQuery`, pela primeira página. Outra coisa é divergência.
- `EstadoErro` guarda `erro` e `aoTentarDeNovo` para o não-consulta (`rotas.tsx:99`) e o "há uma versão nova" (20.0).
  Os quatro `refetch()` do `Painel.tsx` ganham `cancelRefetch: false`.
- Trava `no-restricted-syntax` contra `aoTentarDeNovo=` e `.refetch(` fora de `componentes/estado/`.

**O kit (59.0).** `Botao` com `como` no lugar de `classesDoBotao` e `CLASSES_DO_BOTAO_*` (36 arquivos);
`ConfirmacaoDePerigo` vira o caso `perigo` de `DialogoDeConfirmacao`; `Faixa` vira variante de `Aviso`.
- Trava `no-restricted-syntax` para `<button` e `CLASSES_DO_BOTAO_*` fora do kit.
- `no-restricted-properties` contra API acima do Chrome 99 (`toSorted`, `findLast`, `AbortSignal.any`): o Vite só
  transpila sintaxe.

## 3. Falha

- **Componente lança:** tela de falha com "Tentar de novo", testada numa rota pública, numa área e na casca.
- **`reportarFalha`:** nada sai do navegador; só tipo e rota.
- **Leitura falha:** `EstadoErro` com "Tentar de novo", e o foco volta. Teste com `<Leitura>` e a rota derrubada.
- **Contrato quebrado na prova (20.0):** `tipoDaFalha` (`areas/aluno/respostas.ts:85`) põe `RESPOSTA_FORA_DO_CONTRATO` em
  `recusada`, não em `passageira`, que repete sem fim, e a prova diz "O Turmma foi atualizado. Recarregue a página; a
  sua escolha fica guardada." Teste em `respostas.test.ts`.

## 4. Isolamento, dado pessoal, conformidade, carga

- **Isolamento:** `criarSessao` limpa os dados da escola na troca, com teste.
- **Dado pessoal:** nada novo sai do navegador.
- **Conformidade:** os textos de aprovação (D46) ficam idênticos, e as mutações da 60.0 cobrem a D56.
- **Carga:** fora do caminho quente. O chunk se mede nos cortes (`onda-4b.md` §4).

## 5. Tarefas (leva 1)

Número, título, RF, dependência, veto. Corre junto o que não depende entre si. Porte grande: 57.0, 58.0 e 59.0.

- 55.0 Cobertura por pasta, com piso · RF24 · onda 3
- 56.0 Componente que lança mostra a tela de falha · RF25 · onda 3 · privacy
- 57.0 Sessão injetável · T15 · onda 3 · privacy, tenancy
- 58.0 `<Leitura>` · T15 · onda 3
- 59.0 Botão e confirmação de perigo no kit · T15 · 57.0, 58.0
- 60.0 Aprovar, Time e Aplicação provados, com as mutações da §2.2 · RF23 · 55.0 · conformidade
- 61.0 Tutor e Atividade do aluno provados · RF23 · 55.0 · privacy, conformidade
- 62.0 Páginas anônimas e login por cima · RF24 · 57.0 · privacy
- 63.0 Peças da base · RF24 · 55.0
- 64.0 Operação · RF24 · 55.0
- 65.0 Coordenação · RF24 · 55.0 · privacy, conformidade

`frontend-reviewer` em toda a onda. **Conflito:** 57.0, 58.0 e 59.0 mexem no `eslint.config.mjs`; resolve-se no
encontro.

## 6. Riscos

- ⚠️ **A vitrine** talvez não semeie lote, entrega, prova e conversa do Tutor. Sem ela, Aprovar, Time, Tutor e Atividade
  conferem o texto visível pelo e2e de cada tela, com a árvore de acessibilidade (`toMatchAriaSnapshot`).
- **A sessão (57.0)** tem 55 importadores: a closure mantém a forma de hoje, e nenhuma tela migra antes do seu corte.

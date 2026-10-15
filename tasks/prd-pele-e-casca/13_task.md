# Tarefa 13.0 — A casca da escola no celular: barra de topo, barra de baixo e gaveta

**Funcionalidade:** pele-e-casca · **Depende de:** 12.0
**Subagentes obrigatórios:** `frontend-reviewer`, `tenancy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Abaixo de 768 px o professor e o aluno navegam pela barra de baixo e a coordenação pela gaveta; escola e "Sair" ficam na
barra de topo; o último botão da tela nunca fica atrás da barra.

## Contexto necessário

- `techspec.md` 5 (**A casca**), 6, 9 (**Casca da escola**) e 10 (**Casca W12**); `prd.md` RF14, RF15, RF23
- `cenarios.md`: A5 (`tokens.spec:185`), A14 a A16, A20, A54, A55, A75, A90, A91, A93, A95; a parte B.1 inteira
- `docs/interface.md` 11.1; regra 50, itens 2a e 13; D59
- Código: `CascaDaEscola.tsx` (`faixa === 'estreita'`, a gaveta, o `<main>`); `BarraPresa.tsx` (`sticky bottom-0`);
  `e2e/__fixtures__/casca.ts`

## Subtarefas

- [ ] 13.1 — Barra de topo de 56 px: "Abrir o menu", a marca, a escola ativa (corta com reticências) e "Sair", de 44 px.
  `BarraDeBaixo` (nova): `navigation "Seções"` fixa, 68 px mais a área segura, uma coluna por item (ícone de 28 em pílula
  de 48 × 36, rótulo de 12 px), `aria-current`. `ondeFicamOsItens(itens)`: até quatro, barra; senão, gaveta.
  O `<main>` guarda embaixo a altura da barra mais a área segura, e a `BarraPresa` sobe acima dela
- [ ] 13.2 — A gaveta (`dialog "Menu"`) leva escola, "Seu time", "Rodapé" e "Sua conta"; a coordenação (sete) mantém
  `Seções` nela. Aberta, deixa a barra inerte, e fecha por rota, pessoa e escola como hoje
- [ ] 13.3 — `casca.ts`, num lugar só: `secoes(page)` devolve a `navigation "Seções"` visível; `irPelaNavegacao` abre a
  gaveta só quando ela não está à vista (`:39`) e procura em `secoes(page)` (`:40`). As linhas da parte B que leem
  `Seções` à mão passam por ela
- [ ] 13.4 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/CascaDaEscola.tsx`, `BarraPresa.tsx` | alterados |
| `apps/web/src/componentes/BarraDeBaixo.tsx` e `BarraDeBaixo.test.tsx` | novos |
| `apps/web/src/componentes/CascaDaEscola.test.tsx` | novo |
| `e2e/__fixtures__/casca.ts` | alterado |
| `e2e/casca.spec.ts`, `areas.spec.ts`, `meus-dados.spec.ts`, `minha-turma.spec.ts`, `acesso-da-turma.spec.ts` | alterados |
| `e2e/professor-assistente.spec.ts`, `escola-e-vinculos.spec.ts`, `tokens.spec.ts` | alterados (linhas da parte B) |
| `e2e/casca-no-celular.spec.ts` | novo |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| quatro na barra, cinco na gaveta | unidade e componente | `ondeFicamOsItens` com 4 e com 5; `BarraDeBaixo` com quatro links e `aria-current` |
| itens de cada papel | e2e | professor e aluno: `Seções` à vista sem abrir a gaveta, **`toHaveCount(1)`** (A14, negativa); coordenação: sete itens só na gaveta (A90, A93) |
| nome comprido a 360 px | e2e | escola de nome longo: `larguraExcedente` zero e nome cortado por reticências |
| alvo de 44 px | e2e | cada item da barra, "Abrir o menu" e "Sair" (A13, A93, A95) |
| o último botão acima da barra | e2e | rolar até o fim: o último botão termina acima da barra; a `BarraPresa` da aprovação do lote presa e à vista (A75); a faixa do Tutor e "Hoje: N de 60" à vista (A54, A55) |
| gaveta modal | e2e | doze Tabs sem sair; Esc e clique fora fecham e devolvem o foco; a barra fica inerte (A15, A16) |
| a gaveta fecha | e2e | por rota, pessoa e escola: `areas › troca de escola pelo seletor…` e `areas › falha com a gaveta aberta…`, sem edição |
| a pessoa troca sob o mesmo caminho | componente | gaveta aberta a partir do trilho, o `/v1/eu` volta com outro `usuarioId` e a rota não muda: a gaveta fecha. É o `usuarioDaSessao` do efeito, que nenhum teste de hoje prova (`12_task.md`, "Mutações") |
| asserções que passavam vazias | e2e | `areas.spec:171` e `meus-dados.spec:289`: o `toHaveCount(0)` olha a barra, **com o controle positivo** |
| a fixture | e2e | os specs da parte B passam nos dois projetos |
| recomeço | e2e | `areas › segunda pessoa…`; `inatividade › a sessão vence sozinha…` (o login por cima, com a barra por baixo) |

## Como testar

- e2e a copiar: `casca.spec.ts › W12: abaixo de 768 px…`
- Apoio: `secoes(page)`; `larguraExcedente` de `verificacoes.ts`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/BarraDeBaixo.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/casca-no-celular.spec.ts e2e/casca.spec.ts e2e/areas.spec.ts e2e/meus-dados.spec.ts`
- Armadilha: `jsdom` não tem `matchMedia`: teste a `BarraDeBaixo` sozinha. A 4.0 também edita `tokens.spec.ts`
- **A pessoa troca sob o mesmo caminho** (`CascaDaEscola.test.tsx`, caso `a pessoa da sessão troca sob o mesmo caminho`):
  `prepararTela()` e `redeFalsa()` de `apps/web/src/__fixtures__/tela.tsx` (sessão e cliente de verdade, só a rede falsa),
  mas com o `criarClienteDeConsultas()` num `QueryClientProvider` seu, para o caso chamar `refetchQueries(consultaEu)`;
  `Router` com `memoryLocation({ path: ROTAS.estrutura, record: true })`, como em `SeletorDeEscola.test.tsx`. Antes do
  render: `vi.stubGlobal('matchMedia', …)` que só casa `(min-width: 768px)` (o trilho), e `showModal`/`close` no
  `HTMLDialogElement.prototype`, que o jsdom 30 não tem (`close` só age aberto: tira o `open` e dispara `close`).
  Coordenador: `SEU_TIME` vazio, e a única chamada é o `/v1/eu`. "Abrir a lateral" → `dialog[aria-label="Menu"]` aberto;
  `rede.responder` com outro `usuarioId`, `refetchQueries`; `waitFor` o `dialog` fechado e `aria-expanded="false"`, e
  `history` igual a `[ROTAS.estrutura]`. Isolado: `npx vitest run --project unidade apps/web/src/componentes/CascaDaEscola.test.tsx`
- **Telas**: `professora`, `/professor/turmas` (um lote, até o fim); `aluno`, `/aluno/tutor`; `coordenacao`,
  `/coordenacao/estrutura` e `text=Abrir o menu`; a 360 px. Mockup: `/professor`

## Fora do escopo desta tarefa

Lateral e trilho (12.0); mover itens (X2 a X4).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2), que acrescenta as dele a estas.

A gaveta fecha quando a pessoa ou a escola da sessão troca, mesmo sem a rota mudar: é o `usuarioDaSessao` nas dependências do
efeito (vindo da 12.0, onde nenhum teste o prendia). A primeira tira a dependência; a segunda a troca por um valor que não
muda entre duas pessoas.

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › a pessoa da sessão troca sob o mesmo caminho
-  }, [caminho, usuarioDaSessao, fecharGaveta])
+  }, [caminho, fecharGaveta])
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › a pessoa da sessão troca sob o mesmo caminho
-  const usuarioDaSessao = dados?.usuarioId
+  const usuarioDaSessao = dados?.usuarioId === undefined
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

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

- [x] 13.1 — Barra de topo de 56 px: "Abrir o menu", a marca, a escola ativa (corta com reticências) e "Sair", de 44 px.
  `BarraDeBaixo` (nova): `navigation "Seções"` fixa, 68 px mais a área segura, uma coluna por item (ícone de 28 em pílula
  de 48 × 36, rótulo de 12 px), `aria-current`. `ondeFicamOsItens(itens)`: até quatro, barra; senão, gaveta.
  O `<main>` guarda embaixo a altura da barra mais a área segura, e a `BarraPresa` sobe acima dela
- [x] 13.2 — A gaveta (`dialog "Menu"`) leva escola, "Seu time", "Rodapé" e "Sua conta"; a coordenação (sete) mantém
  `Seções` nela. Aberta, deixa a barra inerte, e fecha por rota, pessoa e escola como hoje
- [x] 13.3 — `casca.ts`, num lugar só: `secoes(page)` devolve a `navigation "Seções"` visível; `irPelaNavegacao` abre a
  gaveta só quando ela não está à vista (`:39`) e procura em `secoes(page)` (`:40`). As linhas da parte B que leem
  `Seções` à mão passam por ela
- [x] 13.4 — Testes (tabela abaixo)

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
| A tarefa toca quatro arquivos que "Arquivos previstos" não lista: `apps/web/src/estilos.css` (a variável `--barra-baixo`), `apps/web/src/componentes/Superficies.test.tsx` (a `BarraPresa` passou de `bottom-0` a `bottom-[var(--barra-baixo,0px)]`), `apps/web/src/componentes/casca-sem-import.test.ts` (a `BarraDeBaixo` entra na lista da casca) e `e2e/__fixtures__/sessao.ts` (`renomearEscolaNoBanco`, para o nome comprido de escola a 360 px) | A reserva da barra de baixo precisa de um valor que o `<main>` e a `BarraPresa` leiam sem se conhecerem; a `BarraPresa` já tinha teste da classe antiga; o guarda `casca-sem-import` enumera os arquivos da casca; o e2e do nome comprido precisa de uma escola com nome comprido | `techspec.md` 9 (**Casca da escola**: "o `<main>` guarda embaixo a altura da barra… a `BarraPresa` sobe acima dela"); `cenarios.md` A75 |
| A barra de baixo é fixa e tem `data-barra-de-baixo` no `<html>` enquanto existe; o item e a pílula levam `data-pilula`. É o que o CSS e o e2e leem: a variável não pode depender de a barra estar montada antes do `<main>` | Sem o atributo a `--barra-baixo` valeria 68 px também para a coordenação (que no celular não tem barra) e para o trilho; sem `data-pilula` o teste lê a pílula pela posição | `techspec.md` 9; `cenarios.md` A14, A90 |
| O anel de foco do item da barra de baixo é **por dentro** (−3 px de afastamento), e o A5 (`tokens.spec`, o item "Turmas" percorrido por Tab) no celular fecha a gaveta com Esc, que devolve o foco ao botão do menu, e dali o Tab percorre o `<main>` até o item, no lugar de percorrê-lo depois do seletor | A barra encosta no pé e nas laterais da janela: o anel por fora seria cortado, como o da linha de lista (`docs/interface.md` 10.1). Com a gaveta aberta a barra está inerte, e o Tab não chega nela | `techspec.md` § **Foco** (o item da barra de baixo entre os anéis por dentro); `docs/interface.md` 10.1, item 2; `cenarios.md` A5 (a parada `:185` no celular, com afastamento `-3px`) |

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

A barra de baixo: onde os itens ficam, e o que ela desenha. Cada uma tira uma cláusula que só o teste de unidade da peça pega.

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › quatro itens ficam na barra, e cinco na gaveta
-export const MAXIMO_NA_BARRA = 4
+export const MAXIMO_NA_BARRA = 5
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › quatro itens ficam na barra, e cinco na gaveta
-  return itens.length > 0 && itens.length <= MAXIMO_NA_BARRA ? 'barra' : 'gaveta'
+  return itens.length > 0 && itens.length < MAXIMO_NA_BARRA ? 'barra' : 'gaveta'
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › um item fica na barra, e nenhum fica na gaveta
-  return itens.length > 0 && itens.length <= MAXIMO_NA_BARRA ? 'barra' : 'gaveta'
+  return itens.length <= MAXIMO_NA_BARRA ? 'barra' : 'gaveta'
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › só o item da tela aberta tem o aria-current
-const PILULA_ACESA = 'border-azul-borda bg-azul-claro'
+const PILULA_ACESA = 'border-azul-borda'
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › só o item da tela aberta tem o aria-current
-const PILULA_APAGADA = 'border-transparent'
+const PILULA_APAGADA = ''
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › só o item da tela aberta tem o aria-current
-                aria-current={aqui ? 'page' : undefined}
+                aria-current={undefined}
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › só o item da tela aberta tem o aria-current
-                <span className={`block max-w-full truncate text-xs leading-4 font-bold tracking-[0.04em] uppercase ${aqui ? 'text-azul-texto' : 'text-sutil'}`}>{item.rotulo}</span>
+                <span className={`block max-w-full truncate text-xs leading-4 font-bold tracking-[0.04em] uppercase ${aqui ? 'text-sutil' : 'text-sutil'}`}>{item.rotulo}</span>
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › cada ícone tem 28 px
-  if ('lugar' in item.icone) return <Icone nome={item.icone.lugar} tamanho={28} />
+  if ('lugar' in item.icone) return <Icone nome={item.icone.lugar} tamanho={24} />
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › cada ícone tem 28 px
-    <Ladrilho familia={item.icone.familia} tamanho={32}>
+    <Ladrilho familia={item.icone.familia} tamanho={36}>
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › o rótulo é de 12 px e corta com reticências
-                <span className={`block max-w-full truncate text-xs leading-4 font-bold tracking-[0.04em] uppercase ${aqui ? 'text-azul-texto' : 'text-sutil'}`}>{item.rotulo}</span>
+                <span className={`block max-w-full text-xs leading-4 font-bold tracking-[0.04em] uppercase ${aqui ? 'text-azul-texto' : 'text-sutil'}`}>{item.rotulo}</span>
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › o rótulo é de 12 px e corta com reticências
-    <nav aria-label="Seções" className="fixed inset-x-0 bottom-0 z-10 h-[var(--barra-baixo)] border-t-2 border-borda bg-lateral px-1 pb-[env(safe-area-inset-bottom,0px)]">
+    <nav aria-label="Seções" className="absolute inset-x-0 bottom-0 z-10 h-[var(--barra-baixo)] border-t-2 border-borda bg-lateral px-1 pb-[env(safe-area-inset-bottom,0px)]">
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › enquanto está na página, marca o <html>
-    raiz.setAttribute('data-barra-de-baixo', '')
+    raiz.setAttribute('data-barra', '')
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › enquanto está na página, marca o <html>
-    return () => raiz.removeAttribute('data-barra-de-baixo')
+    return () => undefined
```

A casca: quando a barra existe, o que sai da gaveta e o que o `<main>` guarda.

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › a partir de 1024 px a lateral aberta tem os itens
-  const naBarraDeBaixo = faixa === 'estreita' && ondeFicamOsItens(itens) === 'barra'
+  const naBarraDeBaixo = ondeFicamOsItens(itens) === 'barra'
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › abaixo de 768 px, o professor tem os itens na barra de baixo
-  const naBarraDeBaixo = faixa === 'estreita' && ondeFicamOsItens(itens) === 'barra'
+  const naBarraDeBaixo = faixa === 'estreita' && ondeFicamOsItens(itens) === 'gaveta'
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › abaixo de 768 px, o professor tem os itens na barra de baixo
-        itens={naBarraDeBaixo ? [] : itens}
+        itens={itens}
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › abaixo de 768 px, o professor tem os itens na barra de baixo
-        {naBarraDeBaixo && <BarraDeBaixo itens={itens} />}
+        {null}
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › abaixo de 768 px, o professor tem os itens na barra de baixo
-    <main className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-1 flex-col gap-6 px-4 pt-4 pb-[calc(var(--barra-baixo,0px)+2rem)] md:px-8 md:pt-5">{children}</main>
+    <main className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-1 flex-col gap-6 px-4 pt-4 pb-8 md:px-8 md:pt-5">{children}</main>
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › tem o menu, a marca, a escola cortada com reticências e o "Sair"
-            <p className="t-cartao min-w-0 flex-1 truncate">{dados?.escola.nome}</p>
+            <p className="t-cartao min-w-0 flex-1">{dados?.escola.nome}</p>
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › tem o menu, a marca, a escola cortada com reticências e o "Sair"
-          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b-2 border-borda bg-fundo px-2">
+          <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b-2 border-borda bg-fundo px-2">
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › tem o menu, a marca, a escola cortada com reticências e o "Sair"
-            <button type="button" onClick={aoSair} disabled={saindo} className={`${CLASSES_DO_BOTAO_SECUNDARIO} shrink-0`}>
+            <button type="button" onClick={aoSair} disabled={saindo} className="shrink-0">
```

A barra presa: sobe acima da barra de baixo e reserva o que sobe para o foco.

```mutacao
arquivo: apps/web/src/componentes/BarraPresa.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › tem o fio de 2 px em borda em cima
-    <div ref={barra} role="group" aria-label={rotulo} data-barra-presa="" className={`sticky bottom-[var(--barra-baixo,0px)] z-10 flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-fundo py-3 ${semLinha ? '' : 'border-t-2 border-borda'}`}>
+    <div ref={barra} role="group" aria-label={rotulo} data-barra-presa="" className={`sticky bottom-0 z-10 flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-fundo py-3 ${semLinha ? '' : 'border-t-2 border-borda'}`}>
```

```mutacao
arquivo: apps/web/src/componentes/BarraPresa.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › acima da barra de baixo, reserva também o quanto sobe
-      const altura = elemento.getBoundingClientRect().height + (Number.isFinite(sobe) ? sobe : 0)
+      const altura = elemento.getBoundingClientRect().height
```

```mutacao
arquivo: apps/web/src/componentes/BarraPresa.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › a barra de baixo nasce depois dela
-    barraDeBaixo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-barra-de-baixo'] })
+    void barraDeBaixo
```

```mutacao
arquivo: apps/web/src/componentes/BarraPresa.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › a barra de baixo nasce depois dela
-      barraDeBaixo.disconnect()
```

O lugar que a barra toma, no navegador: sem a variável, o último botão da tela fica atrás dela.

```mutacao
arquivo: apps/web/src/estilos.css
teste: e2e/casca-no-celular.spec.ts › com o lote para aprovar, o último botão termina acima da barra
-    --barra-baixo: calc(68px + env(safe-area-inset-bottom, 0px));
+    --barra-baixo: 0px;
```

Rodada 1: o foco do teclado na tela comprida, a pílula, o valor padrão da variável e a borda da barra de topo.

```mutacao
arquivo: apps/web/src/estilos.css
teste: e2e/casca-no-celular.spec.ts › o foco do teclado no meio da tela comprida
-    scroll-padding-bottom: var(--barra-baixo);
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › a pílula que segura o ícone é de 48 × 36
-const PILULA = 'flex h-9 w-12 shrink-0 items-center justify-center rounded-controle border-2'
+const PILULA = 'flex h-8 w-12 shrink-0 items-center justify-center rounded-controle border-2'
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: apps/web/src/componentes/BarraDeBaixo.test.tsx › a pílula que segura o ícone é de 48 × 36
-const PILULA = 'flex h-9 w-12 shrink-0 items-center justify-center rounded-controle border-2'
+const PILULA = 'flex h-9 w-10 shrink-0 items-center justify-center rounded-controle border-2'
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: e2e/casca-no-celular.spec.ts › sem barra presa, rolada até o fim, o último controle termina acima da barra de baixo
-    <main className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-1 flex-col gap-6 px-4 pt-4 pb-[calc(var(--barra-baixo,0px)+2rem)] md:px-8 md:pt-5">{children}</main>
+    <main className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-1 flex-col gap-6 px-4 pt-4 pb-8 md:px-8 md:pt-5">{children}</main>
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: e2e/casca-no-celular.spec.ts › a coordenação, com sete itens, não tem barra de baixo
-    --barra-baixo: 0px;
+    --barra-baixo: 68px;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: e2e/casca.spec.ts › W12: de 768 a 1023 px, o trilho
-    --barra-baixo: 0px;
+    --barra-baixo: 68px;
```

```mutacao
arquivo: apps/web/src/componentes/BarraDeBaixo.tsx
teste: e2e/casca-no-celular.spec.ts › o foco do teclado no meio da tela comprida
-                className="flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-controle px-1 focus-visible:-outline-offset-3"
+                className="flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-controle px-1"
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › tem o menu, a marca, a escola cortada com reticências e o "Sair"
-          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b-2 border-borda bg-fundo px-2">
+          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-linha bg-fundo px-2">
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › tem o menu, a marca, a escola cortada com reticências e o "Sair"
-          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b-2 border-borda bg-fundo px-2">
+          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b-2 bg-fundo px-2">
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `revisor-geral`, rodada 1 da 7.0 | `docs/interface.md`, 10.2, linha `Dialogo`: "a gaveta da casca (12.0 e 13.0)" é só da 13.0 | Aplicada nesta tarefa: a linha diz "(13.0)" |
| `frontend-reviewer`, 1ª | Lateral da coordenação a 1366 × 768 corta "PRIVACIDADE" pela metade; o pé de 240 px toma a altura (`CascaDaEscola.tsx:128` e `:324`) | É da 12.0 e fora do escopo desta; muda desenho da lateral. `TODO.md`, com a X2 (reduz os lugares da coordenação a quatro) |
| `frontend-reviewer`, 1ª | Celular deitado (~640 × 360): barra de topo mais barra de baixo tomam 124 px dos 360 px | Pede projeto de paisagem que não existe. `TODO.md`, para quando houver |
| `frontend-reviewer`, 1ª | A escola na barra de topo é texto, e o professor com duas escolas troca abrindo a gaveta (um toque a mais) | Segue `docs/interface.md` 11.1 e regra 50, item 13; muda desenho. `TODO.md`, com a X3 |
| `revisor-geral`, 1ª | A barra de topo `sticky top-0` de 56 px tem o mesmo problema no Shift+Tab: falta `scroll-padding-top` | Existia antes desta tarefa e muda comportamento. `TODO.md`, correção própria (`/corrigir`); a 14.0 é da casca pública e não toca a barra de topo |
| `test-engineer`, 1ª | `inatividade.spec` usa o `irPelaNavegacao` novo e não foi alterado, então não rodou no portão da tarefa | Não há o que alterar no spec; quem prova é a esteira, que roda em todo push (D79). O Orquestrador lê o veredito ao fechar a tarefa seguinte |
| `test-engineer`, 1ª | `rounded-controle hover:bg-fundo-suave` da marca e `t-cartao` da escola (`CascaDaEscola.tsx:314` e `:317`) sem asserção | São só aparência: ficam para o `/validar`, como o próprio revisor disse |
| `revisor-geral`, 2ª | Abrir a correção do `scroll-padding-top` da barra de topo antes da X2 (WCAG 2.4.11 no Shift+Tab) | Já está em `TODO.md`, com destino em `/corrigir` |
| `test-engineer`, 2ª; `frontend-reviewer`, 2ª | Quando a correção do `scroll-padding-top` entrar, o laço do teste do foco na tela comprida (`casca-no-celular.spec.ts`) afirma também `top >= 56` no Shift+Tab, sem e2e à parte | Mesma entrada do `TODO.md`: a correção própria (`/corrigir`) |
| `test-engineer`, 2ª; `frontend-reviewer`, 2ª | O runner de mutação (`tools/processo/mutacoes.ts`) só roda o projeto `chromebook`: cláusula que só existe a 360 px precisa de teste num spec que fixe essa largura, como o `casca-no-celular.spec.ts` | Limite do processo, não da tarefa: `/retro` da funcionalidade |
| `frontend-reviewer`, 2ª | Lateral da coordenação a 1366 × 768 corta "PRIVACIDADE" ao meio (12.0) | Já está em `TODO.md`, com a X2 |

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
| 2026-10-15 21:47:24 | 2026-10-15 21:47:50 | `tenancy-guardian` | 1 | APROVADO | af57cfac63d2cfce2 |
| 2026-10-15 21:47:21 | 2026-10-15 21:49:46 | `frontend-reviewer` | 1 | APROVADO | a1858240d24ad25d5 |
| 2026-10-15 21:47:30 | 2026-10-15 21:50:26 | `revisor-geral` | 1 | REPROVADO | ad6bde38298467488 |
| 2026-10-15 21:47:28 | 2026-10-15 21:52:19 | `test-engineer` | 1 | REPROVADO | ad39251ce706bfe49 |
| 2026-10-15 22:41:54 | 2026-10-15 22:42:32 | `revisor-geral` | 2 | APROVADO | a94a7ea4289ce6697 |
| 2026-10-15 22:42:23 | 2026-10-15 22:42:45 | `tenancy-guardian` | 2 | APROVADO | a996fdef0e427eade |
| 2026-10-15 22:42:06 | 2026-10-15 22:43:06 | `test-engineer` | 2 | APROVADO | ac981d7d5ecbba52f |
| 2026-10-15 22:42:16 | 2026-10-15 22:43:37 | `frontend-reviewer` | 2 | APROVADO | a1a22d1a9c8345d0c |

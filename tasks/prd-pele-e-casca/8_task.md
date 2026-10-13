# Tarefa 8.0 — A onça é o avatar dos três agentes, sempre com a função e o selo

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O avatar dos três agentes passa a ser a cabeça da onça num círculo com o anel do agente, e só aparece com o nome da
função e o selo "IA".

## Contexto necessário

- `techspec.md` 7b (as condições da onça), 7c, 9 (**Peças revestidas**) e 10 (**Avatar**, **Arquitetura**)
- `prd.md` RF10; `cenarios.md`, parte A: A27, A28, U3 (A51 confere)
- `docs/interface.md` 9.7 e 10.3; regra 70, itens 4a e 4b
- Código: `componentes/ia/AvatarAgente.tsx`, `AssinaturaIA.tsx`, `Mensagem.tsx` (o balão já põe avatar, nome e selo no
  `article`); `areas/coordenacao/Agentes.tsx` (a `section` leva `data-agente`; o nome é um `h2` que
  `e2e/governanca.spec.ts:159` acha) e `Analista.tsx` (avatar e nome, sem selo)

## Subtarefas

- [x] 8.1 — `componentes/onca/CabecaOnca.tsx`: SVG só da cabeça, cores fixas da 9.7, prop `tamanho` (24, 32, 40, 48).
  Sem hook, animação nem temporizador. Entra em `PECAS_FORA_DA_ENTRADA` (`onca/CabecaOnca`)
- [x] 8.2 — `AvatarAgente` (props `agente` e `tamanho`, só): círculo `fundo`, anel de 2 px em `azul` (Assistente),
  `laranja` (Tutor) ou `anil` (Analista), `aria-hidden`, `data-agente`. `SeloIA` na pele nova. `AssinaturaIA` ganha
  `titulo?: 2 | 3` (`h2`/`h3`, e não `<p>`). `Agentes.tsx` (`titulo={2}`, 48 px) e `Analista.tsx` passam a ela; a
  `section` de `Agentes.tsx` troca `data-agente` por `data-cartao-do-agente`
- [x] 8.3 — `docs/interface.md` 9.7 e 10.3 só no que divergir; `docs/aia/tutor.md` N7 e N8, "Como se confere"; os
  comentários "nunca rosto" de `AvatarAgente.tsx` e `pecas-ia.spec.ts` viram "nunca pessoa" (os da lateral são da 12.0)
- [x] 8.4 — `ARQUIVOS_COM_COR_EM_LINHA` ganha a cabeça da onça, e só ela
- [x] 8.5 — `galeria/secoes/marca-onca.tsx`: `AssinaturaIA` dos três nos quatro tamanhos, `MensagemIA`
- [x] 8.6 — Testes

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/onca/CabecaOnca.tsx` e `.test.tsx` | novos |
| `apps/web/src/componentes/ia/AvatarAgente.tsx` | alterado |
| `apps/web/src/componentes/ia/AssinaturaIA.tsx` | alterado |
| `apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx`, `avatar-so-nas-duas-pecas.test.ts` | novos |
| `apps/web/src/areas/coordenacao/Agentes.tsx`, `Analista.tsx` | alterados |
| `apps/web/src/estilos.test.ts`, `apps/web/nome-dos-chunks.ts` (uma linha) | alterados |
| `apps/web/src/galeria/secoes/marca-onca.tsx` | novo |
| `apps/web/src/galeria/secoes/ia.tsx` | alterado (o bloco que importa `AvatarAgente`) |
| `e2e/pecas-marca-onca.spec.ts` | novo |
| `e2e/pecas-ia.spec.ts` | alterado (A27, A28) |
| `e2e/governanca.spec.ts`, `a2-assistente.spec.ts`, `aluno-tutor.spec.ts` | alterados |
| `e2e/__fixtures__/avatar.ts` | novo |
| `docs/interface.md`, `docs/aia/tutor.md` | alterados |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| um desenho, parado | componente | dois renders de cada agente dão o mesmo HTML; nenhum `animate`, `transition` nem animação em `style` |
| sem temporizador | componente | `vi.getTimerCount()` zero depois do render; `onca/` sem `setTimeout`, `setInterval` nem `useEffect` |
| props só `agente` e `tamanho` | componente | `// @ts-expect-error` para `pose`, `pensando`, `humor` |
| nenhum texto, nenhum nome | componente | avatar `aria-hidden`, sem `title` nem `aria-label`; "onça" não é texto nem nome |
| função e selo no mesmo bloco | componente | `AssinaturaIA`, `MensagemIA` (duas variantes) e `Pensando`: avatar, nome e selo no mesmo contêiner |
| a cadeia fechada de importação | unidade | `componentes/onca/` (a pasta inteira) só é importado por `AvatarAgente` e por arquivo da própria pasta; `AvatarAgente`, só por `AssinaturaIA` e `ia/Mensagem.tsx`; a galeria usa a `AssinaturaIA`; amostra com outro importador reprova |
| o bloco tem nome | componente e e2e | o bloco de cada `[data-agente]` é o `[data-assinatura]` mais próximo, com exatamente um `[data-agente]`, o nome da função em texto visível e um `[data-selo-ia]`; mutação declarada: tirar o `SeloIA` da `AssinaturaIA` deixa o teste vermelho |
| a onça não tem nome | componente | o SVG não tem `<title>` nem `<desc>`, e nenhum nome acessível da tela casa `/onça/i` |
| a exceção de cor é uma só | unidade | a lista tem `CodigoQr` e a onça; hex em outro `.tsx` reprova |
| anel e círculo | e2e | todo `[data-agente]`: quadrado, redondo, fundo `fundo`, borda de 2 px na cor do agente, sem `img` (A28) |
| nada se mexe | e2e | `animationName` `none` no avatar e em `[data-pensando]` |
| nas telas de verdade | e2e | Agentes (três `h2`), Analista, conversa e Tutor: todo `[data-agente]` com nome e selo no contêiner |
| temas e axe | e2e | seção sem violação grave, claro e escuro |

## Como testar

- Componente: `pedidos/ListaDePedidos.test.tsx`. Varredura: `arquivosDeCodigo`, em `estilos.test.ts`
- e2e a copiar: `pecas-ia.spec.ts › o selo de IA e a assinatura…`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/onca apps/web/src/componentes/ia`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-marca-onca.spec.ts e2e/governanca.spec.ts`
- Armadilha: 4.0 a 7.0 editam o mesmo `nome-dos-chunks.ts`
- **Telas**: `coordenacao`, `/coordenacao/agentes` e `/coordenacao/analista`; `professora`, `/professor/nova-conversa`;
  `aluno`, `/aluno/tutor`; `/galeria`, claro e escuro. Mockup: `/fundamentos/onca`

## Fora do escopo desta tarefa

A onça de corpo inteiro (X2, X4); "Seu time" (12.0); as outras peças de `ia/` (10.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Arquivos fora dos "previstos": `apps/web/src/__fixtures__/importadores.ts` (a regra de achar o importador, com mutação declarada), `apps/web/nome-dos-chunks.test.ts` (o caso da cabeça) e `componentes/ia/Mensagem.tsx` | O balão da `MensagemIA` desenhava o avatar sozinho, ao lado do balão: pela cadeia fechada (RF10) ele passa a usar a `AssinaturaIA` como cabeçalho, e é por isso que `Mensagem.tsx` deixa de importar `AvatarAgente`, `SeloIA`, `agenteDe` e `nomeDaAssinatura`. A fixture existe para a varredura de importadores ser uma peça testada, e não uma regex solta no teste | `techspec.md` 7b e 10 (**Avatar**, **Arquitetura**); `cenarios.md` A27, A28 |
| `AssinaturaIA` reexporta o tipo `TamanhoDoAvatar` | A galeria e as telas só importam a `AssinaturaIA` (o avatar é importado só por ela e pela `Mensagem`): sem o tipo ali, `marca-onca.tsx` teria de importar o avatar | `techspec.md` 10 (**Arquitetura**) |
| O balão do Seu time tem avatar, nome e selo **no cabeçalho** (a assinatura em cima, o balão logo abaixo), e não o avatar ao lado do balão | É o que o RF10 pede (avatar, nome e selo num bloco só, e o balão da `MensagemIA` a usa como cabeçalho, com o `data-assinatura`); a 9.7 já diz que o balão usa a `AssinaturaIA` | `techspec.md` 10 (**Avatar**); `docs/interface.md` 9.7; `prd.md` RF10 |
| `TETO_DA_LISTA_DO_OFICIAL` de 8 para 7, junto com a saída do `AvatarAgente.tsx` de `FACE_DO_OFICIAL` | A entrada dizia `sai: '8.0 …'`: o uso do `bg-noite` no avatar acaba aqui, e o teto só encolhe (e passa a ser igual ao tamanho da lista, para não ganhar folga) | `techspec.md` 9 (**Peças revestidas**); `estilos.test.ts`, a guarda da face do oficial |
| Na `AssinaturaIA`, o nome e o selo ficam num `div` `min-w-0` só, com o nome e o selo em linha (o nome `inline` e o selo num `inline-block`), e não mais dois filhos do `flex` ao lado do avatar | Em 360 px o nome comprido ("Analista de desempenho escolar") quebrava e o selo ia para a borda direita, longe dele (`frontend-reviewer`, 1ª rodada); o `min-w-0` e o `break-words` que eram do nome passaram a ser do bloco e do nome, e cada um tem a sua asserção | `docs/interface.md` 9.7 (avatar, nome e selo num bloco só); regra 50, item 2a |
| O título da seção da galeria é "Avatar dos agentes", e não "A onça" | O teste de que nada na tela se chama "onça" (A28) lê a árvore de acessibilidade da página inteira, e o título da seção entraria nela | `cenarios.md` A28; `docs/interface.md` 9.7 |
| `docs/interface.md` 9.7 e 10.3 mudam também onde dizem que o balão e a tela Agentes desenham o avatar, e que "rosto de gente" não vale para a cabeça da onça | O texto antigo descrevia o avatar ao lado do balão e o `data-agente` na `section` do cartão | `techspec.md` 10 (**Avatar**); `prd.md` RF10 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

Cada bloco tira uma cláusula do desenho da cabeça (cor, `aria-hidden`, parada, sem contorno), do anel e do tamanho do
avatar, do selo, do bloco da assinatura (`data-assinatura`, selo, título), das três assinaturas da `MensagemIA`, da cadeia
fechada de importação, da lista de cor escrita à mão e da regra de achar o importador, e exige o teste de unidade
vermelho. São só do e2e (`e2e/pecas-marca-onca.spec.ts`, `pecas-ia.spec.ts`, `governanca.spec.ts`, `a2-assistente.spec.ts`,
`aluno-tutor.spec.ts`), que o portão da tarefa não roda como mutação: a cor resolvida da pelagem, do olho e da pupila nos
dois temas, o anel de 2 px calculado com o token de cada agente, o círculo quadrado e redondo nos quatro tamanhos, a
cabeça de `tamanho − 4` dentro do anel, `animationName` e `transitionDuration` em `none`, o axe, a ausência de rolagem
horizontal e o balão em no máximo 85% da coluna; e, nas telas de verdade, os três `h2` da tela Agentes (`titulo={2}`) e o
nome e o selo ao lado de cada avatar da conversa e do Tutor. A cabeça fica fora da entrada (`PECAS_FORA_DA_ENTRADA`): a
tarefa não altera o tamanho da entrada.

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › são as nove cores da 9.7
-const PELAGEM = '#E8732E'
+const PELAGEM = '#E8732F'
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › é um SVG só
-<svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="block size-full shrink-0">
+<svg width={tamanho} height={tamanho} viewBox="0 0 48 48" focusable="false" className="block size-full shrink-0">
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › é um SVG só
-<svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="block size-full shrink-0">
+<svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" className="block size-full shrink-0">
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › é um SVG só
-<svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="block size-full shrink-0">
+<svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="block size-full shrink-0">
+<title>Onça</title>
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › o tamanho é só o tamanho
-<svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="block size-full shrink-0">
+<svg width={48} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="block size-full shrink-0">
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › está parada
-<svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="block size-full shrink-0">
+<svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="block size-full shrink-0 animate-pulse">
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › são as nove cores da 9.7
-<circle cx="13" cy="13.5" r="6.5" fill={PELAGEM} />
+<circle cx="13" cy="13.5" r="6.5" fill={PELAGEM} stroke={SOMBRA} />
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › são as nove cores da 9.7
-<path d="M24 33.8V36M20.4 36q1.8 2.2 3.6.2 1.8 2 3.6-.2" fill="none" stroke={PUPILA} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
+<path d="M24 33.8V36M20.4 36q1.8 2.2 3.6.2 1.8 2 3.6-.2" fill={PUPILA} stroke={PUPILA} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › é a cabeça da onça num círculo
-  assistente_de_ensino: 'border-azul',
+  assistente_de_ensino: 'border-laranja',
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › é a cabeça da onça num círculo
-  tutor: 'border-laranja',
+  tutor: 'border-azul',
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › é a cabeça da onça num círculo
-  analista_de_desempenho_escolar: 'border-anil',
+  analista_de_desempenho_escolar: 'border-azul',
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › é a cabeça da onça num círculo
-<span aria-hidden="true" data-agente={agente} className={`inline-flex shrink-0 rounded-full border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
+<span aria-hidden="true" data-agente={agente} className={`shrink-0 rounded-full border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › é a cabeça da onça num círculo
-<span aria-hidden="true" data-agente={agente} className={`inline-flex shrink-0 rounded-full border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
+<span aria-hidden="true" data-agente={agente} className={`inline-flex rounded-full border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › é a cabeça da onça num círculo
-<span aria-hidden="true" data-agente={agente} className={`inline-flex shrink-0 rounded-full border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
+<span aria-hidden="true" data-agente={agente} className={`inline-flex shrink-0 border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › é a cabeça da onça num círculo
-<span aria-hidden="true" data-agente={agente} className={`inline-flex shrink-0 rounded-full border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
+<span aria-hidden="true" data-agente={agente} className={`inline-flex shrink-0 rounded-full bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › é a cabeça da onça num círculo
-<span aria-hidden="true" data-agente={agente} className={`inline-flex shrink-0 rounded-full border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
+<span aria-hidden="true" data-agente={agente} className={`inline-flex shrink-0 rounded-full border-2 ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › é a cabeça da onça num círculo
-<span aria-hidden="true" data-agente={agente} className={`inline-flex shrink-0 rounded-full border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
+<span data-agente={agente} className={`inline-flex shrink-0 rounded-full border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › é a cabeça da onça num círculo
-<span aria-hidden="true" data-agente={agente} className={`inline-flex shrink-0 rounded-full border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
+<span aria-hidden="true" data-agente="tutor" className={`inline-flex shrink-0 rounded-full border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › é a cabeça da onça num círculo
-      <CabecaOnca tamanho={tamanho} />
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o círculo é quadrado de 24, 32, 40 ou 48 px
-  24: 'size-6',
+  24: 'size-8',
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o círculo é quadrado de 24, 32, 40 ou 48 px
-  32: 'size-8',
+  32: 'size-6',
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o círculo é quadrado de 24, 32, 40 ou 48 px
-  40: 'size-10',
+  40: 'size-8',
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o círculo é quadrado de 24, 32, 40 ou 48 px
-  48: 'size-12',
+  48: 'size-10',
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o círculo é quadrado de 24, 32, 40 ou 48 px
-export function AvatarAgente({ agente, tamanho = 24 }: PropsDoAvatar) {
+export function AvatarAgente({ agente, tamanho = 32 }: PropsDoAvatar) {
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o selo "IA" é um só
-<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
+<span data-selo-ia="" className="inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o selo "IA" é um só
-<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
+<span data-selo-ia="" className="t-selo inline-flex min-h-5 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o selo "IA" é um só
-<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
+<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-full bg-ia-cx px-2 text-ia">
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o selo "IA" é um só
-<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
+<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-superficie px-2 text-ia">
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o selo "IA" é um só
-<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
+<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-tinta">
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › AssinaturaIA: os três agentes
-<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
+<span className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o selo "IA" é um só
-      <span aria-hidden="true">IA</span>
+      <span>IA</span>
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o selo "IA" é um só
-      <span className="sr-only">gerado por inteligência artificial</span>
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › AssinaturaIA: os três agentes
-    <div data-assinatura="" className="flex min-w-0 items-center gap-2">
+    <div className="flex min-w-0 items-center gap-2">
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › AssinaturaIA: os três agentes
-      <SeloIA />
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › AssinaturaIA: os três agentes
-      <AvatarAgente agente={agenteDe(quem)} tamanho={tamanho} />
+      <AvatarAgente agente={'tutor'} tamanho={tamanho} />
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › MensagemIA, nas duas variantes
-export function AssinaturaIA({ tamanho = 24, titulo, ...quem }: PropsDaAssinatura) {
+export function AssinaturaIA({ tamanho = 32, titulo, ...quem }: PropsDaAssinatura) {
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › sem `titulo`, é um parágrafo
-const CLASSES_DO_NOME = 'inline text-[15px] leading-5 font-bold break-words text-tinta'
+const CLASSES_DO_NOME = 'inline text-sm leading-5 font-bold break-words text-tinta'
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › sem `titulo`, é um parágrafo
-const CLASSES_DO_NOME = 'inline text-[15px] leading-5 font-bold break-words text-tinta'
+const CLASSES_DO_NOME = 'inline text-[15px] leading-5 font-medium break-words text-tinta'
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › sem `titulo`, é um parágrafo
-const CLASSES_DO_NOME = 'inline text-[15px] leading-5 font-bold break-words text-tinta'
+const CLASSES_DO_NOME = 'inline text-[15px] leading-5 font-bold break-words text-sutil'
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › sem `titulo`, é um parágrafo
-      {titulo === 2 ? <h2 className={CLASSES_DO_NOME}>{nome}</h2> : titulo === 3 ? <h3 className={CLASSES_DO_NOME}>{nome}</h3> : <p className={CLASSES_DO_NOME}>{nome}</p>}{' '}
+      <p className={CLASSES_DO_NOME}>{nome}</p>{' '}
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › sem `titulo`, é um parágrafo
-      {titulo === 2 ? <h2 className={CLASSES_DO_NOME}>{nome}</h2> : titulo === 3 ? <h3 className={CLASSES_DO_NOME}>{nome}</h3> : <p className={CLASSES_DO_NOME}>{nome}</p>}{' '}
+      {titulo === 2 ? <h3 className={CLASSES_DO_NOME}>{nome}</h3> : titulo === 3 ? <h2 className={CLASSES_DO_NOME}>{nome}</h2> : <p className={CLASSES_DO_NOME}>{nome}</p>}{' '}
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › MensagemIA, nas duas variantes
 {/* O cabeçalho do balão é a assinatura inteira: o avatar, o nome da função e o selo, num bloco só (RF10). */}
-        <AssinaturaIA {...quem} />
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › MensagemIA, nas duas variantes
 <article className="flex min-w-0 flex-col gap-2">
-      <AssinaturaIA {...quem} />
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › Pensando
 <article data-pensando="" className="flex min-w-0 flex-col gap-2">
-      <AssinaturaIA {...quem} />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › as telas e a galeria que mostram a onça
-import { AssinaturaIA } from '../../componentes/ia/AssinaturaIA'
+import { AvatarAgente } from '../../componentes/ia/AvatarAgente'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Analista.tsx
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › as telas e a galeria que mostram a onça
-import { AssinaturaIA } from '../../componentes/ia/AssinaturaIA'
+import { AvatarAgente } from '../../componentes/ia/AvatarAgente'
```

```mutacao
arquivo: apps/web/src/galeria/secoes/marca-onca.tsx
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › as telas e a galeria que mostram a onça
-import { AssinaturaIA, type TamanhoDoAvatar } from '../../componentes/ia/AssinaturaIA'
+import { AvatarAgente } from '../../componentes/ia/AvatarAgente'
```

```mutacao
arquivo: apps/web/src/galeria/secoes/ia.tsx
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › o `AvatarAgente` só é importado pela `AssinaturaIA` e pela `MensagemIA`
-import { AssinaturaIA, SeloIA } from '../../componentes/ia/AssinaturaIA'
+import { AssinaturaIA, SeloIA } from '../../componentes/ia/AssinaturaIA'
+import { AvatarAgente } from '../../componentes/ia/AvatarAgente'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › `data-agente` é só do avatar
-    <section data-cartao-do-agente={agente} aria-label={nome} className="flex min-w-0 flex-col gap-4 rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
+    <section data-agente={agente} aria-label={nome} className="flex min-w-0 flex-col gap-4 rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › a cabeça da onça
-  'onca/CabecaOnca',
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a cor escrita à mão é de duas peças só
-const ARQUIVOS_COM_COR_EM_LINHA = ['componentes/CodigoQr.tsx', 'componentes/onca/CabecaOnca.tsx']
+const ARQUIVOS_COM_COR_EM_LINHA = ['componentes/CodigoQr.tsx']
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › grafite e noite só são face
-const TETO_DA_LISTA_DO_OFICIAL = 7
+const TETO_DA_LISTA_DO_OFICIAL = 8
```

```mutacao
arquivo: apps/web/src/__fixtures__/importadores.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › não confunde comentário
-  return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
+  return texto.replace(/(^|[^:])\/\/.*$/gm, '$1')
```

```mutacao
arquivo: apps/web/src/__fixtures__/importadores.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › não confunde comentário
-  return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
+  return texto.replace(/\/\*[\s\S]*?\*\//g, '')
```

```mutacao
arquivo: apps/web/src/__fixtures__/importadores.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › não confunde comentário
-  return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
+  return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|.)\/\/.*$/gm, '$1')
```

```mutacao
arquivo: apps/web/src/__fixtures__/importadores.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › acha o import estático
-const ESPECIFICADOR = /\b(?:from|import)\s*\(?\s*['"]([^'"\n]+)['"]/g
+const ESPECIFICADOR = /\b(?:from)\s*\(?\s*['"]([^'"\n]+)['"]/g
```

```mutacao
arquivo: apps/web/src/__fixtures__/importadores.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › acha o import estático
-const ESPECIFICADOR = /\b(?:from|import)\s*\(?\s*['"]([^'"\n]+)['"]/g
+const ESPECIFICADOR = /\b(?:import)\s*\(?\s*['"]([^'"\n]+)['"]/g
```

```mutacao
arquivo: apps/web/src/__fixtures__/importadores.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › acha o import estático
-const ESPECIFICADOR = /\b(?:from|import)\s*\(?\s*['"]([^'"\n]+)['"]/g
+const ESPECIFICADOR = /\b(?:from|import)\s*\s*['"]([^'"\n]+)['"]/g
```

```mutacao
arquivo: apps/web/src/__fixtures__/importadores.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › acha o import estático
-        .map((especificador) => posix.normalize(posix.join(posix.dirname(nome), especificador)).replace(/\.(?:tsx?|jsx?)$/, ''))
+        .map((especificador) => posix.normalize(posix.join(posix.dirname(nome), especificador)))
```

```mutacao
arquivo: apps/web/src/__fixtures__/importadores.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › acha o import estático
-        .map((especificador) => posix.normalize(posix.join(posix.dirname(nome), especificador)).replace(/\.(?:tsx?|jsx?)$/, ''))
+        .map((especificador) => posix.normalize(posix.join('', especificador)).replace(/\.(?:tsx?|jsx?)$/, ''))
```

```mutacao
arquivo: apps/web/src/__fixtures__/importadores.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › acha o import estático
-        .some((resolvido) => (ehPasta ? resolvido === alvo.slice(0, -1) || resolvido.startsWith(alvo) : resolvido === alvo || resolvido === `${alvo}/index`)),
+        .some((resolvido) => (ehPasta ? resolvido === alvo.slice(0, -1) || resolvido.startsWith(alvo) : resolvido === alvo)),
```

```mutacao
arquivo: apps/web/src/__fixtures__/importadores.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › acha o import estático
-        .some((resolvido) => (ehPasta ? resolvido === alvo.slice(0, -1) || resolvido.startsWith(alvo) : resolvido === alvo || resolvido === `${alvo}/index`)),
+        .some((resolvido) => (ehPasta ? resolvido.startsWith(alvo) : resolvido === alvo || resolvido === `${alvo}/index`)),
```

```mutacao
arquivo: apps/web/src/__fixtures__/importadores.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › acha o import estático
-        .some((resolvido) => (ehPasta ? resolvido === alvo.slice(0, -1) || resolvido.startsWith(alvo) : resolvido === alvo || resolvido === `${alvo}/index`)),
+        .some((resolvido) => (ehPasta ? resolvido === alvo.slice(0, -1) || resolvido === alvo : resolvido === alvo || resolvido === `${alvo}/index`)),
```

```mutacao
arquivo: apps/web/src/__fixtures__/importadores.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › acha o import estático
-  const ehPasta = alvo.endsWith('/')
+  const ehPasta = false
```

```mutacao
arquivo: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts
teste: apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts › a amostra com outro importador reprova
-  return importadores.filter((nome) => !permitidos.includes(nome) && !(pasta !== '' && nome.startsWith(pasta)))
+  return importadores.filter((nome) => !permitidos.includes(nome))
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o selo "IA" é um só
-<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
+<span data-selo-ia="" className="t-selo inline-flex min-h-6 items-center rounded-selo bg-ia-cx px-2 text-ia">
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o selo "IA" é um só
-<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
+<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx text-ia">
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o selo "IA" é um só
-<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
+<span data-selo-ia="" className="t-selo min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › o selo "IA" é um só
-<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 items-center rounded-selo bg-ia-cx px-2 text-ia">
+<span data-selo-ia="" className="t-selo inline-flex min-h-6 shrink-0 rounded-selo bg-ia-cx px-2 text-ia">
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › sem `titulo`, é um parágrafo
-const CLASSES_DO_NOME = 'inline text-[15px] leading-5 font-bold break-words text-tinta'
+const CLASSES_DO_NOME = 'text-[15px] leading-5 font-bold break-words text-tinta'
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › sem `titulo`, é um parágrafo
-const CLASSES_DO_NOME = 'inline text-[15px] leading-5 font-bold break-words text-tinta'
+const CLASSES_DO_NOME = 'inline text-[15px] leading-6 font-bold break-words text-tinta'
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › sem `titulo`, é um parágrafo
-const CLASSES_DO_NOME = 'inline text-[15px] leading-5 font-bold break-words text-tinta'
+const CLASSES_DO_NOME = 'inline text-[15px] leading-5 font-bold text-tinta'
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › sem `titulo`, é um parágrafo
-      <div className="min-w-0">
+      <div>
```

```mutacao
arquivo: apps/web/src/componentes/ia/AssinaturaIA.tsx
teste: apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx › AssinaturaIA: os três agentes
-      {titulo === 2 ? <h2 className={CLASSES_DO_NOME}>{nome}</h2> : titulo === 3 ? <h3 className={CLASSES_DO_NOME}>{nome}</h3> : <p className={CLASSES_DO_NOME}>{nome}</p>}{' '}
+      {titulo === 2 ? <h2 className={CLASSES_DO_NOME}>{nome}</h2> : titulo === 3 ? <h3 className={CLASSES_DO_NOME}>{nome}</h3> : <p className={CLASSES_DO_NOME}>{nome}</p>}
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › cada cor está na parte dela
-<rect x="6" y="14" width="36" height="30" rx="14" fill={SOMBRA} />
+<rect x="6" y="14" width="36" height="30" rx="14" fill={REALCE} />
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › cada cor está na parte dela
-<rect x="6" y="11.5" width="36" height="30" rx="14" fill={PELAGEM} />
+<rect x="6" y="11.5" width="36" height="30" rx="14" fill={SOMBRA} />
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › cada cor está na parte dela
-<rect x="19" y="14" width="10" height="2.4" rx="1.2" fill={REALCE} />
+<rect x="19" y="14" width="10" height="2.4" rx="1.2" fill={CREME} />
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › cada cor está na parte dela
-<circle cx="13" cy="11.5" r="2.6" fill={CREME} />
+<circle cx="13" cy="11.5" r="2.6" fill={PELAGEM} />
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › cada cor está na parte dela
-<circle cx="24" cy="19.5" r="1.5" fill={ROSETA} />
+<circle cx="24" cy="19.5" r="1.5" fill={SOMBRA} />
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › cada cor está na parte dela
-<rect x="15.5" y="29" width="17" height="11" rx="5.5" fill={CREME} />
+<rect x="15.5" y="29" width="17" height="11" rx="5.5" fill={OLHO} />
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › cada cor está na parte dela
-<rect x="21" y="29.8" width="6" height="4" rx="2" fill={NARIZ} />
+<rect x="21" y="29.8" width="6" height="4" rx="2" fill={ROSETA} />
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › cada cor está na parte dela
-<circle cx="17.5" cy="26" r="1.9" fill={PUPILA} />
+<circle cx="17.5" cy="26" r="1.9" fill={ROSETA} />
```

```mutacao
arquivo: apps/web/src/componentes/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/onca/CabecaOnca.test.tsx › cada cor está na parte dela
-<circle cx="30.5" cy="26" r="3.4" fill={OLHO} />
+<circle cx="30.5" cy="26" r="3.4" fill={CREME} />
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| conformidade-reviewer (1ª) | A foto de `/aluno/tutor` mostra só a lista de atividades; "vale a vitrine abrir uma conversa de atividade na próxima rodada com tela do aluno" | Recusada nesta tarefa: é sobre a vitrine, e a escola sintética não tem troca do Tutor; o e2e `aluno-tutor.spec.ts` (`conferirAssinaturas` ≥ 7) prova a assinatura na conversa. Destino: o `/validar` fotografa o RF10 com a conversa do Tutor aberta, no fim da spec |
| frontend-reviewer (1ª) | Em 360 px a segunda linha do placeholder "Peça uma atividade, um plano de aula…" da caixa de pedido aparece cortada ao meio | Fora do diff: a `CaixaPedido` não é desta tarefa. Destino: tarefa 10.0 (peças de `ia/`), que encurta o placeholder ou dá altura à caixa |
| frontend-reviewer (1ª) | O botão "Abrir dado nominal de uma turma" quebra em duas linhas em 360 px | Fora do diff, legível e com alvo grande, e o próprio revisor o deixa para o `/validar`. Destino: `/validar` da spec |
| revisor-geral (1ª) | `QUEM_IMPORTA_O_AVATAR` ainda permite `componentes/ia/Mensagem.tsx`: "vale fechar só na `AssinaturaIA`, registrando o aperto na `techspec.md` 7b" | Não aplicada: muda o contrato escrito (a `techspec.md` 7b e a tabela de testes desta tarefa dizem as duas peças) e a Tech Spec não é do Implementador. Destino: `TODO.md`, para o Arquiteto apertar a 7b e a lista junto, e a retrospectiva da spec |
| revisor-geral (1ª) | A estrutura do balão da `MensagemIA` (assinatura em cima, no lugar do avatar ao lado) já mudou aqui e muda também o `Time.tsx` e o `Tutor.tsx` do professor; "avise a 10.0" | Não é código desta tarefa. Destino: a tarefa 10.0, que reveste a `Mensagem.tsx`: o Orquestrador leva o aviso ao Arquiteto antes de ela começar |
| revisor-geral (2ª) | `AssinaturaIA.tsx:54-55`: o espaço entre o nome e o selo é feito duas vezes, pelo `{' '}` em texto e pelo `ml-1` do `span` que envolve o selo; "fique com um só", tirando o `ml-1` | Cosmético, sem regra por trás. Destino: `TODO.md`, junto da recomendação do test-engineer sobre a mesma casca do selo; a tarefa 10.0 (peças de `ia/`) fecha as duas se tocar a `AssinaturaIA` |
| test-engineer (2ª) | `AssinaturaIA.tsx:54`: a casca do selo, `<span className="ml-1 inline-block align-middle">`, não tem bloco de mutação nem asserção; "se `align-middle` for o que alinha o selo à linha do nome, vale uma asserção" | Acabamento visual; quem mantém o selo colado ao nome já tem mutação (`inline`, `inline-flex`, o espaço). Destino: `TODO.md`, com a recomendação acima |
| revisor-geral (2ª) | `8_task.md:98`: a linha nova em "Divergências" sobre o `div` `min-w-0` é detalhe de implementação, não diverge de nada na Tech Spec | Recusada: a linha é verdadeira e não muda código nem contrato; o leitor só a lê como divergência a mais. A retrospectiva da spec decide se esse tipo de linha sai da seção |
| test-engineer (2ª) | `governanca.spec.ts:233` e `:242`: o teste novo do tamanho de 48 px e as duas chamadas novas de `conferirQueAOncaNaoTemNome` não têm bloco de mutação; "vale um bloco que troque `tamanho={48}` por `{40}`" | Recusada nesta tarefa: o portão da tarefa prova mutação só com teste de unidade, e esses são de e2e; a esteira roda o e2e em todo push da spec e é ela que os pega vermelhos (regra 40, "O portão") |
| test-engineer (2ª) | `e2e/__fixtures__/avatar.ts:82`: a comparação da caixa é exata (`toEqual({ largura: 48, altura: 48 })`); "uma tolerância com `toBeCloseTo(tamanho, 0)` deixa o teste firme" | Recusada: o avatar tem tamanho fixo em classe e o teste mede exatamente isso (quadrado de 24, 32, 40 ou 48 px); se a esteira acusar subpixel, vira correção com o caso real |
| frontend-reviewer (2ª) | "Peça uma atividade, um plano de aula…" aparece cortado em 360 px (`professora--professor-nova-conversa--celular.png`) | Já registrada na rodada 1: fora do diff, tarefa 10.0 (`CaixaPedido`) |
| frontend-reviewer (2ª) | O botão "Abrir dado nominal de uma turma" quebra em duas linhas em 360 px | Já registrada na rodada 1: fora do diff, `/validar` da spec |
| frontend-reviewer (2ª) | A foto de `/aluno/tutor` mostra só a lista de atividades; "o `/validar` deve fotografar o Tutor com uma conversa aberta" | Já registrada na rodada 1: o `/validar` fotografa o RF10 do Tutor com a conversa aberta |
| frontend-reviewer (2ª) | A foto de `/professor/nova-conversa` saiu em tema escuro, "pela escolha de Aparência"; convém uma em claro quando a 10.0 revestir a tela | Destino: `/validar` da spec, que fotografa a tela nos dois temas; a 10.0 revê o tema ao revestir a `CaixaPedido` |

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
| 2026-10-13 17:55:49 | 2026-10-13 17:56:49 | `conformidade-reviewer` | 1 | APROVADO | a01eacd39d7d4f45f |
| 2026-10-13 17:55:42 | 2026-10-13 17:57:35 | `frontend-reviewer` | 1 | APROVADO | a1e7306e1dd123c1b |
| 2026-10-13 17:56:05 | 2026-10-13 17:57:58 | `revisor-geral` | 1 | APROVADO | a4884ad033bd5208b |
| 2026-10-13 17:55:57 | 2026-10-13 17:58:21 | `test-engineer` | 1 | APROVADO | ab6b7177ba181c476 |
| 2026-10-13 18:16:14 | 2026-10-13 18:16:39 | `conformidade-reviewer` | 2 | APROVADO | a4115c842595af1cf |
| 2026-10-13 18:16:03 | 2026-10-13 18:17:03 | `frontend-reviewer` | 2 | APROVADO | a88f5ede416679a54 |
| 2026-10-13 18:16:36 | 2026-10-13 18:17:21 | `revisor-geral` | 2 | APROVADO | a3412a6b7d2ac2159 |
| 2026-10-13 18:16:25 | 2026-10-13 18:17:30 | `test-engineer` | 2 | APROVADO | ac9cf2bdcf418fd5e |

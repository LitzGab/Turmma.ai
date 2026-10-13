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

- [ ] 8.1 — `componentes/onca/CabecaOnca.tsx`: SVG só da cabeça, cores fixas da 9.7, prop `tamanho` (24, 32, 40, 48).
  Sem hook, animação nem temporizador. Entra em `PECAS_FORA_DA_ENTRADA` (`onca/CabecaOnca`)
- [ ] 8.2 — `AvatarAgente` (props `agente` e `tamanho`, só): círculo `fundo`, anel de 2 px em `azul` (Assistente),
  `laranja` (Tutor) ou `anil` (Analista), `aria-hidden`, `data-agente`. `SeloIA` na pele nova. `AssinaturaIA` ganha
  `titulo?: 2 | 3` (`h2`/`h3`, e não `<p>`). `Agentes.tsx` (`titulo={2}`, 48 px) e `Analista.tsx` passam a ela; a
  `section` de `Agentes.tsx` troca `data-agente` por `data-cartao-do-agente`
- [ ] 8.3 — `docs/interface.md` 9.7 e 10.3 só no que divergir; `docs/aia/tutor.md` N7 e N8, "Como se confere"; os
  comentários "nunca rosto" de `AvatarAgente.tsx` e `pecas-ia.spec.ts` viram "nunca pessoa" (os da lateral são da 12.0)
- [ ] 8.4 — `ARQUIVOS_COM_COR_EM_LINHA` ganha a cabeça da onça, e só ela
- [ ] 8.5 — `galeria/secoes/marca-onca.tsx`: `AssinaturaIA` dos três nos quatro tamanhos, `MensagemIA`
- [ ] 8.6 — Testes

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

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

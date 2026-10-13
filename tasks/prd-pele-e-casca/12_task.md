# Tarefa 12.0 — A casca da escola no computador: lateral, trilho e menu da pessoa

**Funcionalidade:** pele-e-casca · **Depende de:** 7.0, 9.0, 11.0
**Subagentes obrigatórios:** `frontend-reviewer`, `tenancy-guardian`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

De 768 px para cima a casca tem lateral de 256 px, trilho de 88, ícone em cada lugar, "Sair" à vista, "Início" no
lugar de "Nova conversa" e a moldura de 1200, e a sessão de uma pessoa segue sem passar à seguinte.

## Contexto necessário

- `techspec.md` 6, 9 (**Casca da escola**) e 10; `prd.md` RF13, RF15 a RF17, RF19
- `cenarios.md`: A17 a A20, A22 a A24, A80, A84, A90 a A95, U14; parte B (onde "Nova conversa" vira "Início")
- `docs/interface.md` 11.1; regras 10 e 50 (itens 7 e 13); D59
- Código: `CascaDaEscola.tsx` (`lembrarQuemEsta`, 201-206; gaveta por pessoa, 225-228; `lerRecolhida`) e as vizinhas

## Subtarefas

- [ ] 12.1 — Lateral de 256 px com borda de 2; lugares de 52 px (ícone numa caixa de 36, `t-rotulo`), aceso em `azul-claro`,
  `azul-borda` e `azul-texto` com `aria-current` (o filete sai), apagado em `sutil`; trilho de 88 px, sem animar;
  seletor de 48 px; no pé, a pessoa, "Meus dados", a `Aparencia` e "Sair" à vista.
  `<main>` na moldura de 1200, margem de 16 e 32. **Os nomes acessíveis da Tech Spec 9 não mudam**
- [ ] 12.2 — "Nova conversa" vira "Início" no rótulo, no `h1` e na aba; `Icone` em Início, Turmas, Ferramentas e Atividades,
  `lucide` num `Ladrilho` nos outros; "Seu time" com o ícone da função num `Ladrilho`, sem onça; os comentários
  "nunca rosto" daqui viram "nunca pessoa"
- [ ] 12.3 — `lateral-recolhida.ts` extrai `lerRecolhida` e `guardarRecolhida` (a chave não muda). Meça a entrada em brotli,
  antes e depois (`npm run build -w @educa/web`, `npx size-limit`), e escreva em "Divergências"
- [ ] 12.4 — Testes

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/CascaDaEscola.tsx`, `itens-da-lateral.tsx`, `MenuDaPessoa.tsx`, `SeletorDeEscola.tsx` | alterados |
| `apps/web/src/componentes/lateral-recolhida.ts` e `.test.ts`, `itens-da-lateral.test.tsx`, `casca-sem-import.test.ts` | novos |
| `apps/web/src/areas/navegacao.ts`, `navegacao.test.ts`, `professor/Home.tsx` | alterados |
| `e2e/casca.spec.ts`, `areas.spec.ts`, `material.spec.ts`, `troca-de-escola.spec.ts` | alterados |
| `e2e/professor-assistente.spec.ts`, `roteiro-da-demonstracao.spec.ts`, `__fixtures__/casca.ts` | alterados |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| os nomes não mudaram | e2e | os da Tech Spec 9, nos três papéis |
| aceso e apagado | e2e | `aria-current`, `azul-claro`, borda de 2 px `azul-borda`, `azul-texto` (A23); **negativa** (A24): no apagado, outro fundo e borda transparente |
| o Tab | e2e | a ordem de A17 com "Início"; "Meus dados" antes de "Sair" |
| "Sair" à vista, trilho | e2e | a 900 e 1366 px, aberta e recolhida, nos três papéis: sem abrir nada, do tamanho do vizinho (A18); o trilho dá nome e dica e guarda a escolha (A19, A92) |
| armazenamento recusado | unidade | `getItem`, `setItem` e `removeItem` que lançam: abre aberta, sem erro; a casca sem `import(` |
| "Início" e ícones | e2e e componente | rótulo, `h1` e aba (A22, U14); todo item com ícone `aria-hidden` e o rótulo por nome; "Seu time" sem `[data-agente]` (A80) |
| moldura | e2e | `main` até 1200 px, padding de 32 e 16 (A84) |
| seletor | e2e | `troca-de-escola` sem perder asserção; a escola atual achada pelo nome (A94); 44 px (A95) |
| recomeço | e2e | segunda pessoa: `inatividade › Chromebook do carrinho…`, `areas › segunda pessoa…`; troca: `troca-de-escola`; sessão vencida: `inatividade › a sessão vence sozinha…`, `acesso-suspenso › duas abas…` |

## Como testar

- e2e a copiar: `casca.spec.ts › W12: no computador…`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes apps/web/src/areas`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/casca.spec.ts e2e/areas.spec.ts e2e/inatividade.spec.ts`
- Armadilha: `casca.spec` abaixo de 768 px é da 13.0
- **Telas**: `professora`, `/professor/nova-conversa`; `coordenacao`, `/coordenacao/governanca`; `aluno`,
  `/aluno/atividades`; a 1366 e 900 px, aberta e recolhida. Mockup: `/professor`

## Fora do escopo desta tarefa

Barra de baixo e gaveta (13.0); reagrupar itens (X2, X3).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

Pedidas pelo `tenancy-guardian`; escreva-as como bloco, com as linhas reescritas:

1. Sem o efeito de `lembrarQuemEsta`, `inatividade › Chromebook do carrinho…` fica vermelho.
2. Sem `usuarioDaSessao` nas dependências do fechamento da gaveta, `areas › troca de escola pelo seletor…` fica vermelho no `celular`.
3. Cada linha da parte A que a tarefa leva (A23, A24).

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

# Tarefa 2.0 — A pessoa escolhe a aparência, e ela vale antes de a primeira tela desenhar

**Funcionalidade:** pele-e-casca · **Depende de:** 1.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Quem entrou escolhe Sistema, Claro ou Escuro no menu da própria conta, a escolha fica no navegador e a página já
abre no tema certo, sem piscar. A galeria passa a mostrar cada peça nos dois temas, numa seção por arquivo.

## Contexto necessário

- `techspec.md` seção 5 ("O tema"), seção 7, seção 9 ("Galeria" e as peças `Segmentado` e `Aparencia`) e seção 12
- `prd.md` RF3, RF4 e os casos de borda do Chromebook gerenciado e dos dois alunos no mesmo computador
- `docs/interface.md` 10.2 (`Segmentado`) e 9.5 (movimento)
- `.claude/rules/50-frontend.md`, item 7: nada sensível no navegador. A aparência não leva pessoa nem escola
- Código: `apps/web/index.html`; `apps/web/src/componentes/CascaDaEscola.tsx`, `lerRecolhida` e `guardarRecolhida`
  (o precedente de preferência no `localStorage`, com o `try/catch` e a chave removida no valor padrão);
  `apps/web/src/componentes/MenuDaPessoa.tsx`; `apps/web/src/operacao/componentes/CascaDaOperacao.tsx`;
  `apps/web/src/galeria/Galeria.tsx`; `e2e/pecas.spec.ts`; `apps/web/nome-dos-chunks.ts` (`PECAS_FORA_DA_ENTRADA`)

## Subtarefas

- [ ] 2.1 — `apps/web/index.html`: `<meta name="color-scheme" content="light dark">` e um `<script>` em linha no
  `<head>` que lê `localStorage['educa.aparencia']` dentro de `try/catch`, cai no `prefers-color-scheme` e escreve
  `data-tema` no `<html>`
- [ ] 2.2 — `apps/web/src/tema.ts`: `resolverTema(escolha, sistemaEscuro)` pura; `lerAparencia`, `escolherAparencia`
  (grava `claro` ou `escuro`; Sistema **apaga** a chave); `aplicarTema`; a escuta do `matchMedia` e do evento
  `storage`; `useAparencia()` por `useSyncExternalStore`. Leitura ou gravação que lança cai em Sistema, calada
- [ ] 2.3 — `componentes/Segmentado.tsx`: grupo de rádio (`role="radiogroup"`, setas trocam, uma parada de Tab),
  alvo de 36 px no computador e 44 abaixo de 768. `componentes/Aparencia.tsx`: o `Segmentado` com Sistema, Claro e
  Escuro, e o rótulo "Aparência"
- [ ] 2.4 — A `Aparencia` em "Sua conta" do `MenuDaPessoa` (os três papéis) e no cabeçalho da operação. As páginas
  públicas seguem o sistema, sem controle
- [ ] 2.5 — A galeria vira `galeria/secoes/<grupo>.tsx`, registradas por `import.meta.glob`, com a `Aparencia` no
  topo; o conteúdo de cada seção é o de hoje, movido. `e2e/pecas.spec.ts` vira um arquivo por grupo
  (`e2e/pecas-<grupo>.spec.ts`), **sem mudar asserção**: só muda de arquivo
- [ ] 2.6 — `TODO.md`: o script em linha entra por hash quando o F16 servir política de segurança de conteúdo
- [ ] 2.7 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/index.html` | alterado |
| `apps/web/src/tema.ts` | novo |
| `apps/web/src/tema.test.ts` | novo |
| `apps/web/src/main.tsx` | alterado |
| `apps/web/src/componentes/Segmentado.tsx` | novo |
| `apps/web/src/componentes/Segmentado.test.tsx` | novo |
| `apps/web/src/componentes/Aparencia.tsx` | novo |
| `apps/web/src/componentes/Aparencia.test.tsx` | novo |
| `apps/web/src/componentes/MenuDaPessoa.tsx` | alterado |
| `apps/web/src/operacao/componentes/CascaDaOperacao.tsx` | alterado |
| `apps/web/src/galeria/Galeria.tsx` | alterado |
| `apps/web/src/galeria/secoes/` | novo |
| `apps/web/nome-dos-chunks.ts` | alterado |
| `e2e/pecas.spec.ts` | alterado (dividido em `e2e/pecas-<grupo>.spec.ts`) |
| `e2e/aparencia.spec.ts` | novo |
| `TODO.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| `resolverTema` nas seis combinações | unidade | a escolha vence o sistema; sem escolha, vale o sistema |
| o `<script>` do `index.html` | unidade | o teste extrai o script do arquivo e o roda com a mesma tabela de casos de `resolverTema` (`claro`, `escuro`, ausente, valor inválido, leitura que lança, sem `matchMedia`; sistema claro e escuro): o `data-tema` que ele põe é o que `resolverTema` devolve, e ele nunca lança |
| escolher Escuro e recarregar | e2e | o `data-tema` já é `escuro` no primeiro quadro, antes do React (RF3): o teste segura o JavaScript da entrada com `page.route` e lê o atributo e a cor de fundo |
| Sistema com o aparelho mudando | e2e | com `emulateMedia({ colorScheme })` trocado e a página aberta, o tema acompanha; com Claro escolhido, não |
| voltar a Sistema apaga a chave | componente e e2e | depois de Escuro e de Sistema, o `localStorage` volta a `[]` |
| o armazenamento continua vazio sem escolha | e2e | os cinco specs que já exigem `localStorage` vazio depois de entrar continuam verdes, sem mexer neles |
| armazenamento que recusa (lança ao ler e ao gravar) | componente | a `Aparencia` não quebra, mostra Sistema, e a escolha vale até a aba fechar (RF4) |
| duas abas | e2e | trocar numa muda a outra, pelo evento `storage` |
| duas pessoas no mesmo computador (RF24) | e2e (`chromebook` e `celular`) | a pessoa A escolhe Escuro, recolhe a lateral (no `celular`, com `setViewportSize` de 1024 px de largura nesse passo: abaixo de 1024 não há o que recolher) e sai; a B entra: as chaves do `localStorage` são exatamente `educa.aparencia` e `educa.lateral-recolhida`, e o conteúdo é exatamente `{ 'educa.aparencia': 'escuro', 'educa.lateral-recolhida': 'sim' }` (`sim` é o que `CascaDaEscola.tsx` grava hoje), e o `sessionStorage` está vazio |
| `Segmentado` pelo teclado | componente | setas, Home e End trocam; uma parada de Tab; `aria-checked` |
| alvo de toque | e2e (`celular`) | cada opção do `Segmentado` tem 44 px de altura |
| a galeria e os specs divididos | e2e | o número de casos de `pecas-*` é o de `pecas.spec.ts` antes da divisão |
| recomeço da tela: segunda pessoa na mesma aba | e2e | o tema não muda ao trocar de pessoa, e o cache dela é descartado como hoje |

A linha de log não se aplica: a tarefa não escreve log.

## Como testar

- Preferência no navegador a copiar: `apps/web/src/componentes/CascaDaEscola.tsx`, `lerRecolhida`, e o teste dela
  em `e2e/casca.spec.ts › W12` ("a lateral recolhida guardada")
- Teste de componente a copiar: `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`
- Primeiro quadro: `page.route('**/assets/index-*.js', …)` segura a entrada; leia `document.documentElement.dataset.tema`
  e `getComputedStyle(document.body).backgroundColor` antes de soltar
- Isolado: `npx vitest run --project unidade apps/web/src/tema.test.ts apps/web/src/componentes/Aparencia.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/aparencia.spec.ts e2e/pecas-*.spec.ts e2e/entrar.spec.ts`
- Armadilha: `Segmentado` e `Aparencia` entram na casca, que mora na entrada: não podem importar peça de
  `PECAS_FORA_DA_ENTRADA`, e o teste do build mede o primeiro carregamento
- Telas: `coordenacao`, `/coordenacao/governanca`, clique em `text=Sua conta`; `/galeria`. Mockup:
  `/fundamentos` (o seletor do topo)

## Fora do escopo desta tarefa

O tamanho da letra (X4); a casca nova (12.0 e 13.0); peça nova além de `Segmentado` e `Aparencia`.

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

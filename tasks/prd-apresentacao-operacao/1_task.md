# Tarefa 1.0 — Tokens da D72 no tema do apps/web, e os componentes compartilhados na pele nova

**Funcionalidade:** apresentacao-operacao (A0) · **Depende de:** nenhuma
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O `@theme` do `apps/web` passa a ter os tokens da D72 (seção 9.9 do `docs/interface.md`) **ao lado** da
paleta atual, e os dez componentes compartilhados já usam só os tokens novos. As telas do F1 continuam
na paleta antiga até a 2.0: nada quebra no meio.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `tasks/prd-apresentacao-operacao/techspec.md` seção 9 (tabela "Hoje | Vira") e `cenarios.md`
- `.claude/rules/50-frontend.md` (Chromebook, quatro estados, acessibilidade)
- `docs/interface.md` 9.1 (cor e contraste; o preto é da ação oficial), 9.9 (o bloco `@theme` a copiar,
  **não** o `mockups/src/index.css` inteiro: sem rampa `neutral`, Inter nem Quicksand) e 11.1 (casca)
- `apps/web/src/estilos.css` — a paleta de fábrica é zerada e volta em hex; o motivo está no topo do
  `apps/web/src/estilos.test.ts` (classe fora da lista não gera CSS nenhum, e o axe não vê)
- `e2e/casca.spec.ts:286-298` — confere `#1d4ed8` e as classes `amber` no CSS servido; continua valendo
  nesta tarefa (a troca da guarda é da 2.0)
- `mockups/public/marca/` — `turmma-icone.svg`, `turmma-negativo.svg`, `turmma-pinta.svg`, em curvas: a
  Fustat não entra

## Subtarefas

- [x] 1.1 — Acrescentar ao `@theme` do `estilos.css` os tokens da 9.9, sem remover os atuais; a lista de
  cores declaradas do `estilos.test.ts` ganha os nomes novos
- [x] 1.2 — Migrar `Botao`: `caramelo` com texto `tinta` (6,4:1), hover `caramelo-claro`, pressionado
  `caramelo-fundo`, desligado `inativo`. A variante que hoje é "oficial" em preto continua preta (9.1)
- [x] 1.3 — Foco global de 2 px em `noite` com 2 px de afastamento (`caramelo-noite` sobre preto); link
  em `caramelo-texto` sublinhado
- [x] 1.4 — Migrar os outros nove componentes pela tabela da seção 9 da techspec: `slate` → `tinta`,
  `apoio`, `sutil`, `inativo`, `linha`, `borda-campo`, `realce`; `amber` → `pendente`/`pendente-cx`;
  `red` → `erro`/`erro-cx`; `emerald` → `ok`/`ok-cx`; modificador `/NN` → token opaco
- [x] 1.5 — Logotipo: os SVGs de `mockups/public/marca/` copiados para `apps/web/public/marca/` e usados
  no `Cabecalho` e na `CascaPublica`, com `alt` e sem baixar fonte
- [x] 1.6 — Testes (tabela abaixo)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/estilos.css` | alterado |
| `apps/web/src/estilos.test.ts` | alterado |
| `apps/web/src/componentes/Botao.tsx` | alterado |
| `apps/web/src/componentes/BotaoCopiar.tsx` | alterado |
| `apps/web/src/componentes/Cabecalho.tsx` | alterado |
| `apps/web/src/componentes/Campo.tsx` | alterado |
| `apps/web/src/componentes/CascaPublica.tsx` | alterado |
| `apps/web/src/componentes/LoginPorCima.tsx` | alterado |
| `apps/web/src/componentes/SeletorDeEscola.tsx` | alterado |
| `apps/web/src/componentes/estado/EstadoCarregando.tsx`, `EstadoErro.tsx`, `EstadoVazio.tsx` | alterado |
| `apps/web/public/marca/*.svg` | novo |
| `e2e/tokens.spec.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| hex de cada token da 9.9 presente no CSS servido (`#E8732E`, `#0D0D0D`, `#8F8F8F` da borda de campo, os de estado) | e2e | o token existe de fato, e não só no fonte; sem ele, a classe some calada |
| componente migrado sem nenhuma classe de família de fábrica (`slate`, `blue`, `amber`, `red`, `emerald`) | unidade | varre os dez arquivos de `componentes/`; volta de uma classe antiga deixa vermelho |
| botão primário: texto `tinta` sobre `caramelo` passa o contraste AA; o desligado é distinguível | e2e (axe) | a cor escolhida na 9.1 é acessível no navegador |
| foco visível em todo componente navegável por teclado | e2e | Tab em cada componente mostra o contorno de 2 px |
| e2e inteiro do F1 verde, em `chromebook` e `celular` | e2e | a pele nova nos componentes não quebrou tela nenhuma |
| logotipo sem requisição de fonte | e2e | nenhuma requisição `.woff2` ao abrir a casca |

Não há concorrência nesta tarefa.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Divergências resolvidas nesta tarefa

- **`--font-marca` fora do `@theme`.** A 9.9 declara a Fustat, mas o logotipo entra em curvas e a fonte não é
  baixada (1.5); declarar a família sem o arquivo seria um token que aponta para nada
- **O bloco da D72 é `@theme static`.** O Tailwind 4.3 só emite a variável que alguma classe usa: sem o `static`, os
  tokens de estado (`pendente`, `ok`) e os que as telas só usam na 2.0 não chegariam ao CSS servido, e o e2e dos hex
  não teria o que conferir. Custa cerca de 0,3 kB gzip. A paleta anterior continua num `@theme` comum, ao lado
- **`disabled:bg-slate-600` saiu das sete telas que o passavam ao `Botao`.** O botão agora tem o desligado próprio
  (`inativo`), e com o texto em `tinta` o `slate-600` que a tela sobrepunha daria 2,6:1. É só a remoção da classe; o
  resto das telas continua na paleta anterior até a 2.0
- **`componentes/Marca.tsx` e o ícone no `index.html`.** O lockup (pinta do `public/marca/` e o nome na fonte do
  sistema) é um componente só, usado pelo `Cabecalho` e pela `CascaPublica`, e o `favicon` é o `turmma-icone.svg`
  (9.6)
- **Não havia variante "oficial" preta no `Botao`.** Nada a manter; o anel `caramelo-noite` sobre o preto fica no
  `estilos.css` (`.bg-noite :focus-visible`) e o e2e o prova com uma faixa preta montada na página, até a casca da
  operação (10.0) trazer a faixa de verdade
- **Hover e pressionado do `Botao` só com ele ligado** (`enabled:`): com o ponteiro parado em cima do botão que
  acabou de ser clicado, o hover não repinta o desligado

## Fora do escopo desta tarefa

- As telas de `apps/web/src/paginas/` e o `rotas.tsx`, a remoção da paleta antiga e as guardas estritas:
  2.0
- O orçamento separado da entrada: 2.0
- Qualquer tela do operador: 10.0 e 11.0
- Avatar dos agentes: A1

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-23 20:40:29 | 2026-09-23 20:41:23 | `test-engineer` | 1 | APROVADO | a37b7a64f7c76cc3a |
| 2026-09-23 20:41:36 | 2026-09-23 20:42:14 | `frontend-reviewer` | 1 | APROVADO | aa11b1bb2f6619c7b |
| 2026-09-23 20:41:32 | 2026-09-23 20:42:15 | `revisor-geral` | 1 | APROVADO | a9655b2ed2cd1cc00 |

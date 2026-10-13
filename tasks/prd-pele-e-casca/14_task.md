# Tarefa 14.0 — A entrada e as páginas públicas na moldura nova

**Funcionalidade:** pele-e-casca · **Depende de:** 4.0, 6.0
**Subagentes obrigatórios:** `frontend-reviewer`, `infra-guardian`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

As páginas de fora da sessão aparecem divididas a partir de 1024 px (painel com a pinta, cartão do formulário) e
empilhadas abaixo. Nenhuma mensagem de erro, ordem de campo ou resposta muda.

## Contexto necessário

- `techspec.md` 9 (**Casca pública e operação**), 7c (a entrada está em 127 de 150 kB) e 10; `prd.md` RF20
- `cenarios.md`: A5 (`tokens.spec:160` e `:162`), A6, A8, A11, A12, A96, A98; parte B: `entrarPorEmail`, `entrarComoAluno`
- `docs/interface.md` 11.3 e 9.6 (a pinta parada e apagada)
- Regra 20, itens 6 e 8 (não encontrado e sem permissão respondem igual); regra 50, itens 2a e 12
- Código: `componentes/CascaPublica.tsx` (cabeçalho com `Marca`, `main` de `max-w-md`); `paginas/Entrar.tsx` (monta a
  moldura e escreve os dois `<input>` à mão); `paginas/TurmaPublica.tsx` (campos à mão); `paginas/SemDesafio.tsx`

## Subtarefas

- [ ] 14.1 — `CascaPublica`: de 1024 px, o painel `papel` à esquerda, com a marca e a pinta parada (`img` com `alt=""`,
  sem animação), e o cartão do formulário à direita; abaixo disso empilha. Um `banner`, um `main` e o `h1` do título
- [ ] 14.2 — `Entrar.tsx` passa à `CascaPublica`; os campos de `Entrar.tsx` e de `TurmaPublica.tsx` passam a `Campo` e
  `CampoDeSenha`, com o mesmo rótulo, a mesma ordem, o mesmo `autoComplete` e `maxLength`. As outras páginas ganham a
  moldura sem edição própria. `SemDesafio.tsx` fica à mão (A12): trocá-la pelo `Aviso` mexeria em `casca.spec.ts`
- [ ] 14.3 — Meça a entrada e o CSS em brotli, antes e depois, e escreva em "Divergências". O painel não pede imagem nova:
  é o `turmma-pinta.svg` que a lateral já usa
- [ ] 14.4 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/CascaPublica.tsx` e `CascaPublica.test.tsx` | alterado e novo |
| `apps/web/src/paginas/Entrar.tsx`, `TurmaPublica.tsx` | alterados |
| `e2e/casca-publica.spec.ts` | novo |
| `e2e/tokens.spec.ts` | alterado (A5, os dois campos) |
| `docs/interface.md` | alterado (11.3, só se divergir) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| divide a 1024, empilha a 1023 | e2e | painel à esquerda do cartão a 1024 e 1366 px; acima dele a 1023 e a 360; sem rolagem de lado |
| a marca à vista | e2e | `tokens › a marca vem dos SVGs em curvas…` sem edição: pinta carregada com `alt=""`, "Turmma" e um `banner` (A8) |
| a moldura | componente | um `banner` com a marca, um `main`, um `h1` com o título e o filho depois |
| os campos | e2e | foco de 3 px na cor `foco`, afastamento 0 nos campos de e-mail e senha (A5) |
| alvo de 44 px | e2e | os botões das páginas, sem edição (A96) |
| as mesmas mensagens | e2e | sem edição: `entrar › senha errada e e-mail que não existe…`, `entrar-na-escola › isolamento…`, `convite › W14: convite expirado, revogado…` (a mesma tela, A98) |
| o segredo continua em texto | e2e | `mfa › configura copiando o segredo em texto…` sem edição |
| nada novo no navegador | e2e | `entrar › privacidade…` e `turma-publica › …nada fica no navegador…` sem edição |
| aviso e carga | e2e | `casca › o aviso de atenção…` (A11, A12) e `entrar › rajada das 7h30…` sem edição; a entrada abaixo de 150 kB |
| recomeço | e2e | `convite › recomeço, mesmo link…`, `…resposta atrasada…`; `turma-publica › mesma entrada…`, `resposta atrasada…`; `acesso-suspenso › recomeço no Chromebook do carrinho…`, sem edição |

## Como testar

- e2e a copiar: `entrar.spec.ts › caminho feliz só com toque…`; largura por `page.setViewportSize`, como em `casca.spec.ts › W12`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/CascaPublica.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/casca-publica.spec.ts e2e/entrar.spec.ts e2e/mfa.spec.ts e2e/convite.spec.ts`
- Armadilha: o nome acessível dos campos ("E-mail", "Senha") não pode mudar
- Armadilha: `tokens.spec.ts` também é editado pela 13.0, em outras linhas
- **Telas**: sem sessão, `/entrar`; `/e/colegio-aurora`; `/mfa`; um link de convite; `/e/colegio-aurora/turma`; a 1366 e a
  360 px. Mockup: `/entrar`

## Fora do escopo desta tarefa

`paginas/Casca.tsx` (`/sistema`), `NaoEncontrada.tsx`, texto novo e a operação (15.0).

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

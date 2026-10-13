# Tarefa 13.0 — "Convidar alunos" num diálogo

**Funcionalidade:** telas-do-professor · **Depende de:** 9.0, 12.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O acesso dos alunos à turma (gerar, gerar novo, revogar) passa a viver num diálogo "Convidar alunos", aberto pela aba Alunos
ou por `?convidar=1`, e oferecido logo depois de confirmar a turma. O link e o código aparecem uma vez, como hoje.

## Contexto necessário

- `techspec.md` seções 7 e 9 ("Os títulos de cada passo não mudam"), 13 (o risco dos nove casos); `prd.md` RF19 e a
  seção 7 (sessão vencida com o convite aberto); `mockup.md` 6
- Regra 20, itens 7 e 8: convite é token único, com expiração, uso único e revogação. O mockup mostra o link e o código
  sempre que o convite abre; **aqui não**: a leitura não os devolve, e o produto só os mostra no passo que os gerou
- Código: `AcessoDaTurma.tsx` (`GerarAcesso`, `AcessoGerado`, o diálogo de revogar, linhas 179 a 300);
  `acesso-da-turma.ts`; `texto-do-whatsapp.ts`; `componentes/DialogoDoConvite.tsx`; `link-do-convite.ts`

## Subtarefas

- [ ] 13.1 — `ConvidarAlunos.tsx`: um `Dialogo` de 560 px com passos que trocam o conteúdo, sem diálogo dentro de diálogo:
  sem acesso, a validade (1, 7 ou 30 dias, 7 de início) e "Gerar acesso"; depois de gerar, "Acesso gerado" com o link,
  o código em dois grupos ("Código da turma"), copiar, projetar e o WhatsApp de hoje; com acesso vigente, só "até
  quando vale", "Gerar novo acesso" e "Revogar o acesso", cada um com a pergunta de hoje. Os títulos de cada passo e o
  envio único não mudam. O passo "Acesso gerado" é **tela inteira** (largura e altura da janela, fundo `fundo` por classe de token, nenhuma cor nova no `::backdrop`), porque é projetado. A seção "Acesso dos alunos" fica na aba como resumo e leva o botão "Convidar alunos"
- [ ] 13.2 — `?convidar=1` abre o diálogo na aba Alunos e fechar tira o parâmetro (`replace`). Depois de "Confirmar" em
  Turmas, o `Aviso` "Turma 7ºA confirmada" leva "Gerar o acesso" a `…/turmas/:id?aba=alunos&convidar=1`. O endereço
  nunca leva token, link nem código
- [ ] 13.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/ConvidarAlunos.tsx`, `ConvidarAlunos.test.tsx` | novo |
| `apps/web/src/areas/professor/AcessoDaTurma.tsx`, `AlunosDaTurma.tsx`, `Turmas.tsx` | alterado (em `apps/web/src/areas/professor/`; a 9.0 e a 12.0 já passaram) |
| `apps/web/src/areas/professor/acesso-da-turma.test.ts` | alterado |
| `apps/web/src/componentes/Dialogo.tsx` | alterado (a variante `inteira`; "Gerar" e "Acesso vigente" continuam em 560 px, e a troca de largura não anima) |
| `e2e/acesso-da-turma.spec.ts` | alterado (os nove casos) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| os nove casos, pelo diálogo | e2e | `W4`, `W7`, `W12`, `clique duplo` e os cinco de `recomeço da tela do acesso`, em `acesso-da-turma.spec.ts`: mudam só o clique que abre o diálogo e o passo em que se está; o título de cada passo, o foco e o envio único ficam |
| o link e o código uma vez | componente e e2e | depois de fechar o passo "Acesso gerado", abrir de novo mostra só a validade; a leitura do acesso não devolve link nem código |
| fechar sem copiar | componente | fechar o passo "Acesso gerado" sem ter copiado pergunta antes (caso de hoje) |
| estados | componente | carregando; erro com "Tentar de novo"; "Sem acesso ativo" com o gerar; com acesso vigente; gerando |
| o endereço | componente e e2e | `?convidar=1` abre; fechar tira o parâmetro; o endereço nunca tem token nem código; vínculo pendente ou de outra turma não abre o diálogo |
| depois de confirmar | e2e | "Turma 7ºA confirmada" com "Gerar o acesso" leva à aba Alunos com o diálogo aberto; o aviso some ao sair |
| concorrência | e2e | dois cliques em "Gerar acesso" mandam um pedido só; o `CONFLITO` recarrega a seção e deixa só "Fechar" |
| nada legível atrás de "Acesso gerado" | e2e | com a turma com alunos e acertos, enquanto o passo "Acesso gerado" está aberto: o passo é tela inteira. A caixa do `<dialog>` cobre a janela inteira, e o fundo calculado do `<dialog>` (o elemento que leva a classe `bg-fundo`) é a cor do token `fundo`, com alfa 1, no claro e no escuro: no escuro ela difere do `Canvas` que o navegador dá ao diálogo, e por isso o teste não passa sem a classe (não `toBeVisible`). Mutações, cada uma vermelha sozinha: tirar a classe de tela inteira; e, com a tela inteira mantida, trocar `bg-fundo` por fundo transparente. O passo "Gerar" tem 560 px de largura: aplicar `inteira` em todos os passos deixa o teste vermelho |
| recomeço | e2e | a sessão vence com o convite aberto: o diálogo sai com o link e o código, e a volta mostra só a validade; a segunda pessoa e outra turma não herdam o diálogo. Log: nenhum token em log nem em URL |
| 360 px e teclado | e2e | sem rolar de lado, também com o código grande; foco preso e devolvido ao botão "Convidar alunos" |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`, `segurar`)
- e2e: os nove casos já existem. Uma função `abrirOConvite(page)` concentra o clique novo; nenhum caso é apagado,
  pulado ou enfraquecido, e a contagem de `test(` fica igual
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/ConvidarAlunos.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/acesso-da-turma.spec.ts`
- Telas: `professora`, `/professor/turmas/:id?aba=alunos&convidar=1`, `--clicar 'role=button[name="Convidar alunos"]'`.
  Mockup: `/professor/turmas/3a?aba=alunos&convidar=1`

## Fora do escopo desta tarefa

Mostrar o link e o código a cada abertura, o convite na tela da turma vazia, trocar a validade por segmentado com
confirmação, o botão verde do WhatsApp (o de hoje fica) e a tela cheia "Projetar" nova; a lista de alunos (12.0).

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

# Achados das revisões — `tasks/correcoes/2026-10-26-w1-aluna-nao-ve-a-turma.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-26 00:11:18 · `tasks/correcoes/2026-10-26-w1-aluna-nao-ve-a-turma.md`

```
VEREDITO: APROVADO
Tabelas verificadas: nenhuma (nenhuma migration nem schema alterado)
Queries verificadas: nenhuma (nenhum repository, service ou endpoint alterado; o diff toca só e2e/escola-montada.spec.ts:228-229)
Teste de isolamento: presente e efetivo. Este diff não cria nem mexe no teste de isolamento de integração, porque nenhum código de produção muda. As asserções de "só a turma dela" no W1 continuam iguais (/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/escola-montada.spec.ts:231-234). Elas verificam que o nome do colega, a matrícula do colega, a outra turma e o aluno da outra turma não aparecem em nenhum lugar do `body`. A asserção trocada também não ficou mais fraca. Ela continua exigindo a turma da aluna dentro do `main`, agora presa ao `header`, com o mesmo prazo.
Bloqueantes: nenhum
Recomendações:
- e2e/escola-montada.spec.ts:229: `getByText(turma)` busca o texto como substring. Se a linha de apoio do título juntar turma, série e escola num texto só, a busca ainda acha a turma. Mas um nome de turma que seja prefixo de outro, como "7A" e "7A2", também passaria. O sufixo aleatório do nome da turma no W1 torna isso improvável. Quando a turma for o texto inteiro de um elemento, `{ exact: true }` deixa a busca mais estrita.
```

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-26 00:11:22 · `tasks/correcoes/2026-10-26-w1-aluna-nao-ve-a-turma.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: `/aluno/eu` no computador e no celular, escola cheia e vazia)
Estados: ok. Eu mostra os dois estados que a vitrine fotografa: com dado, os cartões "Como estou indo", e vazio, "Nada corrigido ainda. Depois que quem dá a aula aprovar a primeira correção, ela aparece aqui." Essa mensagem diz o próximo passo e não se desculpa. Carregando e erro não aparecem na vitrine e esta tarefa não os mexe.
Acessibilidade: sem mudança. A tarefa só toca o e2e. O seletor `main > header` com `getByText` bate no `<header>` de `Tela.tsx:76`, onde está a linha de apoio com a turma.
Chromebook fraco: sem impacto. A tela cabe em 1366 × 768 sem rolagem, e a linha "Rolam a 1366 × 768" diz nenhuma.
Celular: sem rolagem horizontal em 360 px, e o texto da linha de apoio quebra sem cortar. Na foto cheia do celular a barra inferior fixa cobre "Rever a introdução". É efeito da foto em página inteira, não um defeito novo. Essa tela não foi alterada por esta tarefa.
Ação oficial protegida: sim. Não há ação oficial nesta tela nem nesta mudança.
Bloqueantes: nenhum.
- A correção em `e2e/escola-montada.spec.ts:228-229` troca o `h2` com o nome da turma, que deixou de existir, por `principal(...).locator('header').getByText(turma)`.
- A verificação continua presa ao cabeçalho da tela de Eu, mantém o prazo `PRAZO_DA_ENTRADA_MS` e não foi afrouxada.
- As asserções seguintes seguem provando "só a turma dela": a escola dela aparece, e o colega, a matrícula do colega, a outra turma e o aluno dessa outra turma não aparecem.
- As fotos confirmam que a turma ("2ºB df86225e · 2º ano do Ensino Médio · Colégio…") está no cabeçalho, em texto único, então o `getByText` não esbarra em mais de um elemento.
- Nenhum código de produção mudou, então não há cláusula de produção para mutar.

Recomendações:
- `getByText(turma)` casa por trecho. O nome da turma tem sufixo aleatório, então não há ambiguidade hoje. Se o padrão virar um nome curto como "7A", vale trocar por um seletor mais estrito.
- O comentário novo na linha 228 cita a correção de origem. Está bom, mas fica velho com o tempo. Um `data-testid` na linha de apoio do título seria mais durável, caso mais telas dependam dela.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/escola-montada.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/ui/Tela.tsx`

## infra-guardian · 1ª rodada · APROVADO · 2026-10-26 00:11:23 · `tasks/correcoes/2026-10-26-w1-aluna-nao-ve-a-turma.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/escola-montada.spec.ts:229`: o comentário cita uma correção pelo nome (`2026-10-25-eu-cabe-em-1366`). Seria melhor dizer o que a tela mostra hoje, "a turma fica na linha de apoio do título de Eu", sem contar a história.

A única mudança fora do registro da tarefa (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-26-w1-aluna-nao-ve-a-turma.md`) é uma linha de verificação no e2e W1. Nenhum arquivo de `apps/*/src`, `packages/*/src`, migration, fila, gateway de IA ou cenário de carga muda. O teste W1 continua sem chamar provedor pago, porque essa parte não foi alterada. Não vi as fotos da tela: elas não mudam nada no que esta auditoria verifica.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-26 00:11:37 · `tasks/correcoes/2026-10-26-w1-aluna-nao-ve-a-turma.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A única mudança está em `e2e/escola-montada.spec.ts:228-229` e só troca um seletor de leitura. Nenhum arquivo de `apps/*/src` ou de `packages/*/src` muda. Todos com autor humano? sim, porque nenhum caminho de escrita foi criado ou alterado.

Decisão autônoma sobre aluno: ausente

Aprovação registrada: ok. Em Eu, "Como estou indo" só mostra correção que o professor já aprovou. Nas fotos da escola vazia, o vazio diz isso ao aluno: "Depois que quem dá a aula aprovar a primeira correção, ela aparece aqui." O texto vem de `apps/web/src/areas/aluno/ComoEstouIndo.tsx:29`.

Supervisão do tutor: ok. A tarefa não toca no tutor, e Eu não tem nenhuma saída de IA.

Autonomia declarada e visível: sim, e a tarefa não a altera.

Conferido nas quatro fotos (aluno, `/aluno/eu`, escola cheia e vazia, no computador e no celular):
- **Nada que a D55 proíba:** as fotos não mostram nota, conceito nem sugestão de nota de discursiva ou redação. O que aparece é o resultado de objetiva já aprovado ("1 de 4 certas") e as habilidades para rever.
- **O aluno pode contestar:** a linha "Achou algo errado? Fale com quem dá a aula." aparece quando há dado, como pede a regra 70, item 4d.
- **Sem vigilância:** nada sobre humor, atenção ou comportamento.
- **Sair é fácil (D59):** "Sair" está à vista nas duas larguras e não exige mais passos que entrar.
- **A turma está no lugar novo:** ela aparece no `header` de Eu (`apps/web/src/areas/aluno/Eu.tsx:117`), que é onde o seletor novo procura.

O teste não perdeu força. A turma continua presa ao `header` do `main`, com o mesmo prazo. As asserções que provam que a aluna vê só a turma dela continuam iguais logo abaixo: a escola dela aparece, e o colega, a matrícula do colega e a outra turma não aparecem em nenhum lugar do `body`.

Bloqueantes: nenhum

Recomendações:
- Para a retro: o portão só roda o e2e quando o teste cita como texto exato o que a tela removeu, e um seletor por papel e nome (`getByRole('heading', { name: turma })`) escapa disso. Quando uma correção tira um `h2` ou outro elemento com papel, vale incluir no `grep` do Implementador as buscas por `getByRole('heading'` em `e2e/`.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/escola-montada.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-26-w1-aluna-nao-ve-a-turma.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Eu.tsx

## test-engineer · 1ª rodada · APROVADO · 2026-10-26 00:11:55 · `tasks/correcoes/2026-10-26-w1-aluna-nao-ve-a-turma.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz: a aluna aprovada pela tela entra, abre Eu e vê a turma dela.
- Isolamento dentro da escola: a outra turma (8B) e o aluno dela não aparecem.
- Colega: o nome e a matrícula do colega da mesma lista não aparecem.
- Permissão: antes da aprovação, a entrada responde como senha errada.
- Regressão: a turma é procurada onde a tela a mostra hoje, preso ao `main`, sem afrouxar o prazo nem a busca.

Cobertos:
- Todos acima, em `e2e/escola-montada.spec.ts`, no caso W1, nos projetos `chromebook` e `celular`.
- A linha 229 (`principal(alunaNaTela).locator('header').getByText(turma)`) continua exigindo a turma da aluna. A turma tem o sufixo aleatório `marca`, e o `Eu.tsx:113` escreve na linha de apoio `${turma.nome} · ${nomeDaSerie(serie)} · ${escola.nome}`. Se a tela mostrasse outra turma, ou nenhuma, o teste ficaria vermelho.
- As linhas 230 a 234 ficam como estavam e continuam provando "só a turma dela". As linhas 203 a 209 continuam provando a permissão.
- O localizador novo segue o padrão de `e2e/minha-turma.spec.ts:74` e `e2e/aluno-eu.spec.ts:58`.
- Nas fotos da vitrine, a linha de apoio está abaixo de "Eu", nos dois tamanhos.
- Nada muda em `apps/*/src` nem em `packages/*/src`, então a linha "Sem mutação" vale.
- Não há `.skip`, mock nem chamada a provedor de IA.
- O documento registra o W1 vermelho antes do conserto, na linha 228 e pelo motivo certo, e verde depois nos dois projetos (46,2 s no portão, dentro de 120 s). Eu não rodei o Playwright: conferi pelo diff e pelo código.

Bloqueantes: nenhum.

Recomendações:
1. `e2e/escola-montada.spec.ts:229`: o `getByText(turma)` aceita a turma como pedaço de um texto maior. Dá para prender a linha inteira com `toHaveText`, algo como `` `${turma} · 7º ano do Ensino Fundamental · ${coordenadora.escolaNome}` ``. Assim a linha prova numa asserção só a turma, a série e a escola da aluna, e a linha 230 deixa de ser necessária.
2. Para a retro, sobre o processo: o portão só roda o e2e que cita um texto exato que o diff tirou de `apps/web/src` (`tools/ci/e2e-que-cita-literal.ts`). Ele não pega o e2e que procura um elemento que deixou de existir, como um `getByRole('heading', { level: 2, name: <variável> })`. Foi isso que deixou o W1 de fora em `8a4053cc`. Vale o portão rodar também os e2e que visitam a rota tocada, ou o Implementador procurar pelo papel e pelo nível do elemento removido, e não só pelos rótulos.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/escola-montada.spec.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Eu.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-26-w1-aluna-nao-ve-a-turma.md`

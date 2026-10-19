# Achados das revisões — `tasks/correcoes/2026-10-19-interface-parte-a.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 18:50:50 · `tasks/correcoes/2026-10-19-interface-parte-a.md`

VEREDITO: APROVADO

**Cenários exigidos.** A correção só mexe em documentação, então não há regra de negócio para provar. Conferi três coisas:
1. Nenhum teste que lê `docs/interface.md` quebra com este diff.
2. A justificativa para não ter teste nem mutação se sustenta.
3. O `grep` que serve de evidência devolve o que o documento promete.

**Cobertos.**
- **Os cinco testes que leem o documento.** São cinco, e não um só. Cada um corta uma faixa fixa do documento, e nenhuma faixa toca as seções alteradas (1, 1.3, 1.7 nova, 9.8, 11.2, 11.5 e 12):
  - `apps/web/src/componentes/onca/CabecaOnca.test.tsx:25` lê a 9.7, de "### 9.7 A onça…" até "**O avatar** (`AvatarAgente`)" (linhas 1108 a 1155). A mudança na 9.8 fica depois desse trecho.
  - `apps/web/src/contraste.test.ts:33` lê de "#### Pares de contraste" até o próximo "### " (linhas 855 a 956).
  - `apps/web/src/estilos.test.ts:69` lê os blocos `css` da 9.10.
  - `apps/web/src/estilos.test.ts:674` lê a tabela `t-*` da 9.2.
  - `e2e/tokens.spec.ts:57` lê os blocos `css` da 9.10.
- **Cabeçalhos que esses testes procuram.** O texto novo da 1.7 não traz nenhum dos marcadores que eles buscam por `indexOf` ("### 9.10", "### 9.2", "#### Pares de contraste", "### 9.7"). Também não traz cor em hexadecimal. Nenhum corte muda de lugar.
- **Execução.** Rodei `npx vitest run apps/web/src/estilos.test.ts apps/web/src/contraste.test.ts apps/web/src/componentes/onca/CabecaOnca.test.tsx`: 3 arquivos, 52 testes, todos verdes. O `tokens.spec.ts` lê a mesma 9.10 que o `estilos.test.ts:69`, então fica coberto pelo mesmo raciocínio.
- **Grep de evidência.** Devolve só a linha 1888 (seção 12, "na A3 eram Visão Geral e Alunos"), como o documento promete.
- **Seção "Mutações" contra o diff.** O diff não toca código e não acrescenta cláusula. "Não há" está correto.
- **Por que dispensar teste vale.** Um teste que compare o texto do documento com o rótulo da tela seria teste de cópia e não prova regra (regra 40).
- **Conferência por amostra contra o código.** Bateram com o código:
  - "Não lida" e "3 ou mais", em `Turmas.tsx:26-28`;
  - a frase da turma indisponível, em `acesso-da-turma.ts:116`;
  - "O sino de hoje não tem sinal do Tutor (F10)", em `fila-do-professor.ts:21`;
  - a fala da correção, em `entregas.ts:44`.

**Bloqueantes.** Nenhum.

**Recomendações.**
1. `tasks/correcoes/2026-10-19-interface-parte-a.md:27` diz que "o único teste que o lê como entrada, `e2e/tokens.spec.ts:57`". Isso está errado: são cinco leitores (lista acima). A conclusão continua valendo, porque nenhum deles lê seção alterada. Mas o registro vai para os achados e pode ser reaproveitado. A frase deveria listar os cinco e o trecho que cada um lê.
2. `docs/interface.md`, seção 1.3, entre as aspas da fala do Assistente:
   - O documento usa aspas curvas ("…"), e `falaDaEntrega` gera aspas retas.
   - O documento escreve "da turma 7ºA", mas o formato real vem de `daTurma()` em `apps/web/src/areas/professor/entregas.ts:33`, e eu não abri essa função.

   Vale o `frontend-reviewer` confirmar a fala exata, já que o documento se apresenta como descrição do construído.
3. Seção 9.8: o exemplo novo ("Corrigi a atividade do 7ºA. Esperando você aprovar.") não é a fala real de `falaDaEntrega`. Como a 9.8 é guia de tom, aceito. Se a ideia é a Parte A descrever o construído, poderia usar a mesma fala da 1.3.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-19 18:51:37 · `tasks/correcoes/2026-10-19-interface-parte-a.md`

VEREDITO: AJUSTES NECESSÁRIOS
Tela vista: não. A correção só mexe em `docs/interface.md`, nenhum arquivo de `apps/web` mudou e o prompt não traz fotos. Conferi cada frase nova contra o código que ela descreve.
Estados: ok. A seção 1.7 descreve os quatro estados da lista, de Hoje, de Atividades e de Alunos, e batem com `Turmas.tsx`, `TurmaHoje.tsx`, `AtividadesDaTurma.tsx` e `AlunosDaTurma.tsx`. Os estados de carregando e erro estão só no código e no e2e, como esperado.
Acessibilidade: nada a apontar. O texto novo descreve o que o código faz: `aria-live` polite em Hoje, foco devolvido ao fechar painel e diálogo, estado sempre em texto, `h1` visível.
Chromebook fraco: não se aplica ao texto. O que o documento diz bate com o código: abas baixadas só quando abertas, leitura de cem em cem em Alunos, leitura nominal do Tutor só com o painel aberto e depois descartada.
Celular: o texto descreve a folha de baixo a 360 px, as 2 colunas do `Segmentado` e o empilhamento da faixa. Tudo isso está no código.
Ação oficial protegida: sim. O texto descreve confirmar e contestar com o efeito escrito, o envio único, o revogar com a pergunta, e diz que aprovar a correção não é da aba Atividades.

Confirmado contra o código e o RF21:
- O exemplo do sino e o da seção 9.8 saíram sem média. A frase do sino bate com `falaDaEntrega` em `entregas.ts:44` e os quatro itens da fila batem com `fila-do-professor.ts`.
- "O que o Tutor viu" deixou de ser tela: `Tutor.tsx` leva a Hoje ou a Turmas. Os sinais do Tutor não entram no sino hoje.
- A conversa de um aluno não abre por nenhum caminho em `TurmaHoje.tsx` nem em `AlunosDaTurma.tsx`.
- As abas Hoje, Atividades e Alunos, a rolagem do painel a partir de 768 px, os cartões e o selo ("Não lida", "N ou mais") batem com o código.
- O `grep` da correção só devolve a linha 1888, que cita de propósito o que a A3 entregou.

Bloqueantes:
1. `docs/interface.md:361` e `docs/interface.md:1786`: o texto diz que "Convidar alunos" é um diálogo de 560 px. O código é 520 px (`apps/web/src/componentes/Dialogo.tsx:54`, `w-[min(32.5rem,…)]`). O próprio documento diz 520 px em `docs/interface.md:1545` e `:1546` (9.3), que fala em "uma largura só para todo diálogo". A correção existe para a Parte A descrever o construído, e aqui ela contradiz o código e o resto do documento. Troque 560 por 520 nas duas linhas.

Recomendações:
- `docs/interface.md:248` (seção 1.5, modo sala, F10) diz que "abrir a conversa de um aluno é ação explícita e fica em auditoria". Pela seção 1.7 e pelo código, nada na aba Hoje abre essa conversa. Isso pode valer para o F10, que ainda não existe, mas vale uma frase dizendo que essa ação não existe na fatia atual e que o F10 a reabre (regra 70, item 7).
- A seção 1.7 não cita o estado "Lendo o que espera…" do selo em `Turmas.tsx`. É um detalhe, mas é um estado a mais do selo.
- O exemplo do sino usa aspas curvas (“…”) e o código usa aspas retas (`entregas.ts:44`). Não muda o sentido.
- A seção 1.4 (`:235`) ainda cita "média do aluno" como critério de fora da curva. Não fazia parte desta correção e não contradiz o RF21, que trata da turma aberta, mas a parte do documento sobre nota vai precisar de revisão quando a nota oficial entrar.

Arquivo revisado: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/docs/interface.md`.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-19 18:56:19 · `tasks/correcoes/2026-10-19-interface-parte-a.md`

VEREDITO: APROVADO
Tela vista: não. A correção é só de documentação e nenhum arquivo de `apps/web` mudou, então não há fotos novas.
Estados: não se aplica. A correção não toca tela.
Acessibilidade: não se aplica.
Chromebook fraco: não se aplica.
Celular: não se aplica.
Ação oficial protegida: sim. O texto novo mantém "Só chega aos alunos depois que você aprovar", sem mudança de regra.

Conferência da correção exigida:
- O bloqueante está resolvido. `docs/interface.md:362` e `:1788` agora dizem 520 px. Não sobrou "560" no arquivo. Isso bate com `apps/web/src/componentes/Dialogo.tsx:54` (`32.5rem`) e com a 9.3, nos `:1547` e `:1548`.

Frases novas contra o código:
- **Fala do Assistente, na 1.3 e na 9.8.** O texto `Corrigi "Atividade de estequiometria" da turma 7ºA. O diagnóstico só chega aos alunos depois que você revisar os destaques e aprovar.` é igual ao que `falaDaEntrega` e `daTurma` produzem em `apps/web/src/areas/professor/entregas.ts`. A pontuação (aspas retas, o ponto no fim) também confere.
- **Selo da turma, na 1.7.** "Lendo o que espera…", "Não lida", "Em dia" e "N ou mais esperando você" estão em `apps/web/src/areas/professor/Turmas.tsx:26-28`.
- **Abrir a conversa de um aluno, na 1.5.** O texto diz que a ação não existe na fatia atual e que o F10 a reabre. Uma busca por "abrir conversa" em `apps/web/src` não achou componente com essa ação. Isso é coerente com a regra 70, item 7.

Bloqueantes: nenhum.
Recomendações:
- Ainda está aberta a recomendação já registrada na tabela "Recomendações sem aplicar" da correção: a seção 1.4 (`docs/interface.md:235`) cita "média do aluno". Ela não bloqueia, e o destino é o F6, com anotação em `TODO.md`.
- A lista dos testes que leem `docs/interface.md` (`tasks/correcoes/2026-10-19-interface-parte-a.md`) está coerente com o que a correção altera, porque nenhum deles lê a 9.8 nem as seções 1.x.

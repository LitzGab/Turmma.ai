# Validação — telas-do-aluno-e-primeiro-acesso (X4)

## Rodada 5 — 26/10/2026

**Escopo:** funcionalidade completa. É uma revalidação depois de uma correção só, a `2026-10-26-areas-entrar-estoura-o-prazo` (`19d2f306`),
que veio da esteira de `d6b82ea8` (execução 40332902053, `e2e/areas.spec.ts:619` [celular]).
**Commit validado:** `39896f89` (o último que mudou um arquivo fora de `tasks/` é `19d2f306`, e mudou só um teste)
**Veredito: APROVADA**

Desde a rodada 4 (`d6b82ea8`), nada mudou em `apps/`, `packages/`, `infra/`, `tools/` nem `docs/`
(`git diff --stat d6b82ea8 39896f89 -- apps packages infra tools docs` volta vazio). A única mudança fora de `tasks/` está em
`e2e/areas.spec.ts`: o import de `carregarSemRedeLenta` (`:24`) e a primeira carga do caso "troca de escola pelo seletor" (`:625`), que
passou de `page.goto('/entrar')` a `carregarSemRedeLenta(page, () => page.goto('/entrar'))`, com um comentário (`:622-624`) que cita a
execução e a correção de 17/10. A entrada por e-mail, a escolha de escola, a troca pelo seletor e as quatro asserções (`:633-638`)
continuam na rede do perfil e não mudaram. Li `carregarSemRedeLenta` (`e2e/__fixtures__/perfis.ts:93-102`). Ele tira só a rede, a CPU
continua limitada, e a rede do perfil volta num `finally`. Numa página sem perfil, ele falha alto, e `e2e/pecas-galeria.spec.ts:174` e
`:178` provam isso. O espaço que os seis revisores viram faltando em `:627` na 1ª rodada não está no commit: `escolherA = page…` está
igual a antes, e o `revisor-geral` aprovou na 2ª, depois do ajuste. Os 21 RF continuam ATENDIDOS, com a evidência e as onze mutações das
rodadas 1 a 4, porque o código delas não mudou. O `areas.spec.ts` inteiro rodou verde nos dois projetos, e as fotos desta rodada mostram
as telas do aluno como na rodada 4. Não há crítico nem maior.

### 1. RF a RF

Fotos desta rodada, tiradas da vitrine com a web construída a partir de `39896f89` pelo `tools/ci/e2e.ts`. Estão em `.processo/vitrine/`:
`aluno--aluno-{inicio,atividades,eu}--{computador,celular}.png` (escola cheia) e `vazia--aluno--aluno-{inicio,eu}--{computador,celular}.png`.
O comando terminou em "Nenhuma tela rola a 1366 × 768" nas duas escolas. Li como imagem o Início (computador; vazia, celular), Tarefas
(computador) e Eu (computador e celular).

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | sem mudança desde a rodada 1 (`areas/navegacao.ts`) | `e2e/areas.spec.ts:294` ("o aluno vê Início, Tarefas e Eu…"), rodado nesta rodada: verde nos dois projetos (11,4 s e 12,4 s) | Fotos: a lateral (computador) e a barra de baixo (celular) com Início, Tarefas e Eu, sem "Avisar um adulto". Privacidade é uma linha de Eu |
| RF2 | ATENDIDO | sem mudança | `e2e/areas.spec.ts:361` ("os endereços de hoje do aluno abrem as telas de hoje…"), rodado: verde nos dois projetos | — |
| RF3 | ATENDIDO | sem mudança | idem às rodadas 1 a 3. `e2e/areas.spec.ts:619` mantém a asserção do "Sair" (`:638`) | Fotos: "SAIR" à vista na lateral e no topo do celular |
| RF4, RF5 | ATENDIDO | sem mudança | idem | Foto do Início: a onça com "Tutor" e o selo "IA", "Oi, Aluno.", a faixa "Quem dá a aula acompanha como você usa o Tutor." e o vazio de "Para fazer" (escola vazia e cheia sem tarefa aberta) |
| RF6 | ATENDIDO | sem mudança | idem | Foto de Tarefas: Para fazer, Entregues e Corrigidas, com ladrilho da matéria, estado em texto e linha inteira clicável |
| RF7, RF8 | ATENDIDO | sem mudança desde a rodada 3 | idem (rodadas 3 e 4) | — |
| RF9, RF10 | ATENDIDO | sem mudança | idem | Fotos de Eu: a turma, a série e a escola na linha de apoio, "Como estou indo" com "N de 4 certas" e "Para rever", e as quatro linhas. Não aparece colega, média, posição, sequência, pontos nem prêmio |
| RF11 a RF19 | ATENDIDO | sem mudança desde a rodada 4 | idem | — |
| RF20 | ATENDIDO | sem mudança | idem | "Nenhuma tela rola a 1366 × 768", nas duas escolas. `size-limit` desta execução: a entrada tem 92,12 kB de 150 kB |
| RF21 | ATENDIDO | — | Diff dos testes de `d6b82ea8` a `39896f89`: um arquivo, `e2e/areas.spec.ts`, com +5 e −2 linhas. Nenhum `.skip`, `.only` nem `fixme`, nenhuma asserção mudou e nenhum caso foi removido. Nenhum arquivo de `paginas/` mudou | Só a primeira carga do caso saiu da rede do perfil, e o caso não afirmava nada sobre ela. A esteira é conferida no fechamento |

Provas de mutação desta rodada: **nenhuma**. Esta rodada não mudou código de produção, e a mudança de teste só tira uma causa de
ambiente. O documento da correção diz isso (seção "Mutações"), e o `test-engineer` concorda: tirar o `carregarSemRedeLenta` não deixa
nenhum teste vermelho. As onze mutações das rodadas 1 a 4 valem, porque o código delas é o mesmo.

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regras de negócio, os 14 pontos e as cinco "valem ainda" | cumpridas | Rodadas 1 a 4. O código delas não mudou |
| Bordas do PRD §7 | cobertas | Rodadas 1 a 4. O código delas não mudou |
| Pronto: o aluno faz tudo pelos lugares novos, com "Sair" à vista e a faixa presa | cumprido | Rodadas 1 a 4. Nesta rodada, as fotos e o `areas.spec.ts` |
| Pronto: nada de colega, sequência, pontos ou ranking | cumprido | RF10, sem mudança. As fotos desta rodada não mostram nada disso |
| Pronto: introdução uma vez, pulável onde não é aviso, revisível; aviso em linguagem de 11 anos | cumprido | Rodadas 1 e 4 |
| Pronto: e2e do aluno e das páginas públicas nos dois projetos | cumprido no que rodei | `e2e/areas.spec.ts`: 52 casos verdes (26 por projeto, 1,9 min). A suíte inteira roda na esteira |
| Pronto: os 21 RF com evidência | cumprido | Seção 1 |
| Pronto: 150 kB de entrada e 30 kB por tela | cumprido | O `size-limit` passou nesta execução: entrada com 92,12 kB, aluno com 1,87 kB e peças com 30,01 kB de 40 kB |
| Pronto: os seis documentos atualizados e as pendências do aviso fechadas | cumprido | Rodada 4. Nenhum documento mudou depois dela |
| Pronto: esteira verde no último commit que alterou código | esteira: conferida no fechamento | — |
| A correção do `areas.spec.ts:619` | resolvida no que se pode provar | O caso rodou verde nos dois projetos: 10,2 s no `chromebook` e 10,8 s no `celular`, abaixo da metade do prazo de 30 s. Antes, nas execuções verdes da esteira, levava 15,0 s. A trava não se reproduz: a correção rodou o caso 15 vezes sem ela e 40 vezes com ela, sem vermelho. O documento diz o que a correção **não** prova. A causa, a rede emulada na primeira carga, não foi demonstrada, e os outros 104 `page.goto('/entrar')` continuam expostos. Isso tem destino: a retro, com o gatilho "terceira ocorrência, investigar no harness `perfis.ts`" escrito no documento e no `estado.md` |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck`, `npm run lint` | não rodados: o escopo é a funcionalidade completa, e eles rodam na esteira |
| E2E do arquivo que mudou, que também é a evidência do RF1 e do RF2 (`chromebook` e `celular`) | ✅ `node tools/ci/e2e.ts --manter-ambiente e2e/areas.spec.ts`: 52 passaram (1,9 min), com o build da web, o `size-limit` e o compose de `39896f89` |
| Mutações | nenhuma nesta rodada (seção 1) |
| Esteira do GitHub | esteira: conferida no fechamento. Não entra no veredito |
| Revisões com veto registradas e aprovadas | ✅ `2026-10-26-areas-entrar-estoura-o-prazo`: os seis obrigatórios do pedido (`test-engineer`, `revisor-geral`, `infra-guardian`, `tenancy-guardian`, `privacy-guardian` e `conformidade-reviewer`) aprovaram na 1ª. O `revisor-geral` também aprovou na 2ª, depois de o espaço da `:627` voltar. O commit leva `(correção 2026-10-26-areas-entrar-estoura-o-prazo)` e a linha de revisões. O `39896f89` só mexe no `estado.md`. `git log origin/develop..HEAD -i --grep='^Fora do processo:'` não traz nada. A Tech Spec não precisa de registro: a correção não muda desenho |

Dependências: o `node_modules` não era anterior ao `package-lock.json`, então não precisei rodar `npm ci`. Terminei com a árvore limpa:
`git status --short` volta vazio antes desta escrita.

### 4. Achados

**Críticos**

- Nenhum.

**Maiores**

- Nenhum.

**Menores** (não mudam o veredito; o Orquestrador os leva ao `TODO.md`)

- M1 a M12 e MN1 a MN6 das rodadas 1 a 4 seguem como estavam.
- MN7. Na auditoria da correção, o `tenancy-guardian` rodou `npx biome format`. Como o projeto não tem o biome, o `npx` baixou do npm um
  pacote de terceiros sem relação com o projeto (`biome` 0.3.3) e o executou no checkout da linha 1. Quem registra isso é o próprio
  revisor (`tasks/correcoes/achados/2026-10-26-areas-entrar-estoura-o-prazo.md`, fim da seção do `tenancy-guardian`). O pacote não
  formatou nada e a árvore não mudou, mas um revisor rodou código desconhecido baixado da rede na máquina que tem o repositório público
  e as credenciais do GitHub. Não é achado da funcionalidade. É de processo e de segurança do ambiente. **Correção sugerida:** os
  agentes revisores (`.claude/agents/*.md`, que têm `Bash`) só usam `npx` em pacote do `package-lock.json`, e com `--no-install`. Dono:
  Arquiteto, na retro da X4.
- MN8. Três casos de `e2e/areas.spec.ts` passaram de dois terços do prazo de 30 s na máquina, no `celular`: `:699` ("a guarda sem o
  /v1/eu", 23,1 s), `:275` (22,1 s) e `:572` ("segunda pessoa", 21,6 s). Nenhum deles é da X4 nem tem `test.slow()`. O `:396` leva 27,1 s,
  mas tem `test.slow()` e prazo de 90 s. Todos passaram. Registro para o censo do fechamento conferir se já estão entre os 71 acima de
  2/3. Dono: Orquestrador, no `--censo`.
- MN9. O bloco da X4 em `ROADMAP.md:434-437` ainda diz "Congelada em 20/10/2026…" e "Espera a X7". O `estado.md` registra que o
  fechamento já está preparado, com o `[x]`. Só lembro de trocar também essas duas linhas. Dono: Orquestrador, no fechamento.

**Positivos**

- A correção foi ao traço da esteira antes de mudar o teste, e o traço tirou o servidor estático da lista de causas: os 14 pedidos nem
  saíram do navegador. Ela registrou o que não prova e deixou um gatilho para a terceira ocorrência, em vez de espalhar
  `carregarSemRedeLenta` pelos 104 outros casos.

### 5. Conclusão

APROVADA. O código de produção é o mesmo da rodada 4, que aprovou os 21 RF com código, teste efetivo e foto. A única mudança tira a
primeira carga de um caso de e2e da rede emulada e não mexe em nenhuma asserção. Esse arquivo rodou verde inteiro nos dois projetos, e as
fotos desta rodada confirmam as telas do aluno. O processo da correção está em ordem. A esteira é do fechamento. Os menores novos, MN7 a
MN9, vão ao `TODO.md` ou à retro.

### 6. Pendências herdadas

| Pendência | Dono | Arquivo | Destino |
|---|---|---|---|
| M1 a M3, M5 a M12 e MN1 a MN6 das rodadas 1 a 4 | os das rodadas 1 a 4 | os das rodadas 1 a 4 | `TODO.md` ou retro, como na rodada 4 |
| A trava da primeira carga em `/entrar`: os outros 104 `page.goto('/entrar')` continuam expostos | Arquiteto | `e2e/__fixtures__/perfis.ts` | retro da X4 (já no `estado.md` e no documento da correção) |
| MN7: um revisor rodou `npx` de pacote fora do `package-lock.json` | Arquiteto | `.claude/agents/*.md` | retro da X4 |
| MN8: três casos de `areas.spec.ts` acima de 2/3 do prazo | Orquestrador | `e2e/areas.spec.ts:275`, `:572`, `:699` | censo do fechamento, ou `TODO.md` |
| MN9: o texto de "congelada" da X4 no roadmap | Orquestrador | `ROADMAP.md:434-437` | fechamento |
| Commits `Fora do processo:` com código da spec | — | — | nenhum |

## Rodada 4 — 26/10/2026

**Escopo:** funcionalidade completa. É uma revalidação depois de três correções: a do roteiro da demonstração (MA1 da rodada 3), a da
mensagem fixa do Tutor (M4, decisão A do Joaquim) e a dos três casos do censo do e2e.
**Commit validado:** `d6b82ea8` (o último que mudou código é `e2b35eb1`)
**Veredito: APROVADA**

O MA1 da rodada 3 está resolvido. O roteiro passa pelas três introduções, chama o lugar do aluno de **Tarefas** e mostra a
comemoração "Atividade entregue." antes da espera pela correção. Cada frase nova bate com o código e com o
`e2e/roteiro-da-demonstracao.spec.ts`, que rodei: verde nos dois projetos. A mensagem fixa do assunto delicado e o aviso de privacidade
dizem agora a mesma frase, que vem de uma constante só, `FRASE_DO_AVISO_AO_PROFESSOR`. A promessa da frase é verdadeira no código:
nenhuma rota entrega ao professor o texto da conversa. As três mutações que rodei ficaram vermelhas, e a foto mostra a frase nova
no passo 3. Os três casos do censo caíram de 27 a 29 s para 7,7 a 9,5 s. As asserções continuam as mesmas, e o C2 e o W1 continuam
verdes. Os 21 RF estão ATENDIDOS. Não há crítico nem maior. Ficam menores, entre eles o MN1: o roteiro ainda manda a coordenação a
"Estrutura" e a "IA", nomes que não estão na navegação dela desde a X2.

**O que esta rodada conferiu de novo.** Entre `3c60f99a` e `d6b82ea8` o código de produção mudou só em três arquivos:
`packages/shared/src/tutor/sinal.ts` (a constante nova, exportada no `index.ts`), `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`
(as duas mensagens fixas terminam nela) e `apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts` (o aviso usa a mesma constante).
Todos vêm da correção `2026-10-26-mensagem-fixa-avisa-o-professor` (`e2b35eb1`). Os testes mudaram em `turno-do-tutor.test.ts` e
`textos-da-introducao.test.ts`, que são dessa correção, e em `e2e/convite.spec.ts` e `e2e/material.spec.ts`, que são da correção
`2026-10-26-tres-casos-do-e2e-perto-do-prazo` (`5f2feed6`). Os documentos mudaram em `docs/roteiro-da-demonstracao.md` (`8fb31b9b`),
em `docs/aia/tutor.md`, no `TODO.md` e na Tech Spec §7. Li por completo os três arquivos de produção e os dois de teste de unidade.
Li também os dois diffs de e2e, o roteiro inteiro contra o spec dele e as fixtures das introduções (`e2e/__fixtures__/casca.ts`
e `coordenacao.ts`). Para os RF cujo código não mudou, valem a evidência e as oito mutações das rodadas 1 a 3.

### 1. RF a RF

Fotos desta rodada:
- `.processo/vitrine/aluno--aluno-bem-vindo--Continuar-Continuar--{computador,celular}.png`: o passo 3, o aviso de privacidade, tirado
  da vitrine depois de a web ser reconstruída com o código de `d6b82ea8`.
- `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--spectelas-do-aluno-e-primeiro-acesso/c0c87f38-10cc-4616-9a3a-b3fcae1b9b2a/scratchpad/fotos/aviso-frase-nova--1366.png`:
  o mesmo passo com a região do aviso rolada até a frase nova. Ela aparece entre "Quem dá a aula acompanha como você usa o Tutor." e
  "A coordenação vê os números da turma toda.", e a frase antiga não aparece na página (contagem 0).

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 a RF12 | ATENDIDO | sem mudança desde a rodada 3 | idem. Desta rodada: W1 (`e2e/escola-montada.spec.ts:63`) e `e2e/roteiro-da-demonstracao.spec.ts:110`, que passa pelas três introduções e por Tarefas, verdes nos dois projetos | O roteiro corrigido descreve RF2 (o aluno cai na introdução e depois no Início), RF6 (Tarefas, "Para fazer") e RF8 (a comemoração, `FALA_DA_ENTREGA`, `atividade.ts:54`) como o código faz |
| RF13 | ATENDIDO | sem mudança | idem | O roteiro diz "os três primeiros não se pulam", como `textos-da-introducao.ts` (`obrigatorio: true`) |
| RF14 | ATENDIDO | `aviso-de-privacidade.ts:39` (`FRASE_DO_AVISO_DE_ATENCAO = FRASE_DO_AVISO_AO_PROFESSOR`), `packages/shared/src/tutor/sinal.ts:38` | `textos-da-introducao.test.ts`: a frase exata (`:56`), "uma só, a do shared" (`:73`), "sem tempo hipotético" (`:77`) e o teto de 15 palavras, que já existia. A frase tem 15 palavras. Rodados: 535 verdes nos dois arquivos. Mutação 3 | Fotos acima. A frase diz o que o código faz: o professor recebe o sinal `atencao_humana` sem conteúdo (`supervisao.service.ts:10-15`), e `supervisao.repository.ts:83` não lê `mensagem_tutor.texto`. Em `tutor.controller.ts` as rotas `conversa` e `memoria` são `próprio`. Nenhuma rota entrega a conversa de um aluno ao professor, então "não vê o que você escreveu" é verdade hoje. O comentário da constante lista os dois gatilhos que a obrigam a mudar |
| RF15 a RF18 | ATENDIDO | sem mudança | idem | O roteiro diz "quatro passos" e "Pular" para a professora e para a coordenação, como `FALAS_DA_INTRODUCAO_DO_PROFESSOR` e `falasDaIntroducaoDaCoordenacao` (quatro falas cada uma). A coordenação termina no Painel, como `passarPelaIntroducaoDaCoordenacao` (`esperarPainel`) |
| RF19 | ATENDIDO | sem mudança | idem | A mensagem fixa continua dizendo que é uma IA e não se passa por pessoa (`turno-do-tutor.test.ts:340-345`, rodado) |
| RF20 | ATENDIDO | sem mudança desde a rodada 3 | `e2e/aluno-atividade.spec.ts:575` e `:622` (C2), rodados nos dois projetos: verdes | O `vitrine.ts foto` do passo 3 diz "Nenhuma tela rola a 1366 × 768" |
| RF21 | ATENDIDO | — | Diff dos testes de `3c60f99a` a `d6b82ea8`: nenhum `.skip`, `.only` nem `fixme`. O caso das três voltas do convite virou três casos, um por volta, com o corpo e as asserções iguais. O `unroute` do fim saiu, mas cada caso tem a própria página. Os dois casos do material entram pela API com o segundo fator e mantêm as asserções. O precondicional "a linha aparece antes do `goto`" saiu do `:499`, porque o `goto` agora é a primeira carga. O título "o id que a escola não tem" virou "o id que não existe", e com isso o título não promete mais isolamento: quem o prova é o `:527`, que não mudou e rodou verde. A asserção da mensagem fixa trocou "sem o que você escreveu" por "não vê o que você escreveu", com a mesma força, e ganhou dois casos. Nenhum arquivo de `paginas/` mudou | A esteira é conferida no fechamento |

Provas de mutação desta rodada (unidade, sem reconstruir a web; a árvore terminou limpa, com
`git checkout -- <arquivo>`, e os dois arquivos voltaram a 535 verdes depois de restaurar):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF14 e regra 70, 4a (mensagem fixa do assunto delicado) | `FRASE_DO_AVISO_AO_PROFESSOR` trocada pela redação antiga em `MENSAGEM_DE_ASSUNTO_DELICADO` (`turno-do-tutor.ts:87`) | `turno-do-tutor.test.ts`: "as duas mensagens dizem que é uma IA…", "as duas mensagens fixas terminam na frase do aviso ao professor…" e "a última linha das mensagens fixas não é condicional…" (3 vermelhos) |
| RF14 (mensagem fixa de risco à vida) | a linha `FRASE_DO_AVISO_AO_PROFESSOR` tirada de `MENSAGEM_DE_RISCO_A_VIDA` (`turno-do-tutor.ts:94`) | os mesmos 3 casos de `turno-do-tutor.test.ts` |
| RF14 (aviso da introdução) | `FRASE_DO_AVISO_DE_ATENCAO` de volta ao texto literal antigo (`aviso-de-privacidade.ts:39`) | `textos-da-introducao.test.ts`: "diz quem vê: em assunto pessoal difícil…" e "o aviso de atenção é a frase do aviso ao professor do shared…" (2 vermelhos) |

A 2 e a 3 rodaram juntas, porque estão em arquivos e testes diferentes: foram 5 vermelhos no total, 3 do nucleo e 2 da web. As oito
mutações das rodadas 1 a 3 valem, porque o código delas não mudou.

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regras de negócio, os 14 pontos e as cinco "valem ainda" | cumpridas | Rodadas 1 a 3. "Uma formulação só" vale agora também para o aviso ao professor: uma constante, nos dois lugares (mutações desta rodada) |
| Regra: o agente não se passa por pessoa (D58); D36 | cumprida | A mensagem fixa mantém "eu sou uma inteligência artificial", o 188 vem primeiro no risco à vida e não há conselho (`turno-do-tutor.test.ts:337-348`, rodado) |
| Bordas do PRD §7 | cobertas | Rodadas 1 a 3. O código delas não mudou |
| Pronto: o aluno faz tudo pelos lugares novos, com "Sair" à vista e a faixa presa | cumprido | Rodadas 1 a 3. Nesta rodada: o roteiro e o W1, verdes |
| Pronto: nada de colega, sequência, pontos ou ranking | cumprido | RF10, sem mudança |
| Pronto: introdução uma vez, pulável onde não é aviso, revisível; aviso em linguagem de 11 anos | cumprido | Rodada 1. A frase nova tem 15 palavras e nenhum termo jurídico (teste do teto, rodado). Ver MN3 sobre "Em assunto pessoal difícil" para 11 anos |
| Pronto: e2e do aluno e das páginas públicas nos dois projetos | cumprido no que rodei | 84 casos nos dois projetos. A suíte inteira é da esteira |
| Pronto: os 21 RF com evidência | cumprido | Seção 1 |
| Pronto: 150 kB de entrada e 30 kB por tela | cumprido | O `size-limit` passou nas duas execuções do e2e desta rodada |
| Pronto: os seis documentos atualizados e as pendências do aviso fechadas nos três | cumprido | `docs/aia/tutor.md` (pendência 12, com a frase nova e os dois gatilhos) e a Tech Spec §7 foram atualizados. `docs/lgpd.md` e `docs/conformidade-mec.md` não citavam a frase. Fora dos seis: o roteiro, ver MA1 (resolvido) e MN1 |
| Pronto: esteira verde no último commit que alterou código | esteira: conferida no fechamento | — |
| MA1 da rodada 3: o roteiro da demonstração | resolvido | `docs/roteiro-da-demonstracao.md`: 2.2 (`:112-114`), 2.8 (`:137-139`), 2.12 (`:148-150`), 5.2 (`:196-197`), 5.3 (`:200-202`) e 7.2 (`:223`). `grep -c introdu` dá 3. Cada passo bate com o spec: `passarPelaIntroducaoDaCoordenacao` (`:186`) seguido de "IA" (`:187`), `passarPelaIntroducaoDoProfessor` (`:282`) antes de "Confirme suas turmas", `passarPelaIntroducaoDoAluno` (`:336`), a região "Para fazer" (`:447`) e "Atividade enviada" com a espera (`:468-470`). O spec rodou verde nos dois projetos (1,4 min) |
| Os três casos do censo | resolvidos | Rodados nos dois projetos. `convite.spec.ts:416`, as três voltas: 7,7 a 8,3 s no `chromebook` e 8,7 a 9,5 s no `celular` (antes, 27,1 a 28,9 s no `celular`). `material.spec.ts:499` e `:514`: 7,6 a 8,5 s (antes, 27,1 a 27,8 s). Todos abaixo de um terço do prazo de 30 s. No mesmo arquivo, o `:527` (`test.slow()`, isolamento) levou 35,1 s de 90 s |
| C2 (rodadas 2 e 3) e W1 | seguem resolvidos | `aluno-atividade.spec.ts:575` e `:622`: 11,7 a 12,6 s, verdes. W1: 43,5 s e 45,9 s, verde nos dois projetos |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck`, `npm run lint` | não rodados: escopo da funcionalidade completa (esteira) |
| Unidade da mensagem fixa e do aviso | ✅ `npx vitest run --project unidade` em `turno-do-tutor.test.ts` e `textos-da-introducao.test.ts`: 535 passaram (antes e depois das mutações) |
| E2E dos casos do censo, do C2 e do W1 (`chromebook` e `celular`) | ✅ `convite`, `material`, `aluno-atividade` e `escola-montada`: 82 passaram (3,8 min) |
| E2E do roteiro da demonstração (`chromebook` e `celular`) | ✅ 2 passaram (1,4 min) |
| Mutações | ❌ como esperado com a mutação (3 vermelhos, e depois 5). ✅ depois de restaurar |
| Esteira do GitHub | esteira: conferida no fechamento. Não entra no veredito |
| Revisões com veto registradas e aprovadas | ✅ `2026-10-26-roteiro-da-demonstracao-depois-da-x4`: `frontend-reviewer`, `test-engineer` e `revisor-geral` aprovaram na 1ª, com `**Sem mutação:**` e o motivo (só texto de `docs/`). `2026-10-26-mensagem-fixa-avisa-o-professor`: os 8 obrigatórios com duas rodadas. O `pedagogia-reviewer` pediu ajustes na 1ª, e na 2ª os oito aprovaram. `2026-10-26-tres-casos-do-e2e-perto-do-prazo`: os seis aprovaram na 1ª, e o `test-engineer` e o `revisor-geral` também na 2ª. Os três commits de código levam `(correção …)`. Os commits "Registra o estado…" e os merges mexem só em `tasks/` e no `TODO.md`. `git log origin/develop..HEAD --grep='^Fora do processo:'` não traz nada. A Tech Spec §7 registra a mudança da frase, com a correção que a substitui |

Dependências: o `node_modules` não era anterior ao `package-lock.json`, então não precisei rodar `npm ci`. A web do ambiente foi
reconstruída pelo `tools/ci/e2e.ts` com o código de `d6b82ea8`, antes das fotos. As mutações foram feitas depois dos dois e2e
terminarem, para nenhum build pegar o arquivo mutado.

### 4. Achados

**Críticos**

- Nenhum.

**Maiores**

- Nenhum. O MA1 da rodada 3 está resolvido (seção 2).

**Menores** (não mudam o veredito; o Orquestrador os leva ao `TODO.md`)

- M1 a M12 das rodadas 1 a 3 seguem como estavam. A M4 (a mensagem fixa) **fecha nesta rodada**, com a decisão A do Joaquim.
- MN1. `docs/roteiro-da-demonstracao.md:115` (2.3) manda a coordenação a **Estrutura**, mas desde a X2 o lugar se chama **Escola**,
  que abre na aba Turmas (`navegacao.ts`, `Escola.tsx:10`). E o `:113` (2.2) e o `:257` (9.1) dizem "**IA**" como se fosse um lugar,
  quando o lugar é **Registros**, que abre na aba IA (`Registros.tsx:11`). O "IA" do 2.2 e do 9.1 foi escrito por esta correção, porque
  o spec diz `irPelaCoordenacao(…, 'IA')`, que vai a Registros (`e2e/__fixtures__/coordenacao.ts:50`). Quem apresentar pelo texto
  não acha "Estrutura" nem "IA" na lateral, mas acha o caminho em um clique: Escola já abre em "Comece pelo ano letivo", e
  Registros já abre na Governança. Classifiquei como menor por dois motivos. O "Estrutura" é desenho da X2, fora do escopo desta
  funcionalidade. E nos dois casos a pessoa chega à tela pelo lugar seguinte sem errar nada. O `revisor-geral` (correção do roteiro,
  rec. 3) apontou o 2.3, o 2.5 e o 2.7, com destino "correção própria do roteiro, a pedir ao Orquestrador". Esse destino não está no
  `estado.md` nem no `TODO.md`. **Correção sugerida:** uma correção de texto que confira cada passo da coordenação contra o spec. "Escola" (aba
  Turmas) no 2.3 a 2.7, "Registros" (aba IA) no 2.2 e no 9.1, e o "Alocação" do 2.7 trocado por "Acrescentar turma"
  (`spec.ts:254-259`). Dono: Orquestrador, que a abre ou a leva ao `TODO.md`, antes da próxima demonstração.
- MN2. A fixture `MENSAGEM_FIXA` (`e2e/__fixtures__/aluno.ts:250-254`) não termina na frase do aviso ao professor, e nenhum e2e
  confere essa frase no cartão do Tutor. O `TODO.md` já registra isso, na entrada do aviso de privacidade, com "Falta". Só lembro
  que, até lá, a frase que o aluno lê na hora só tem prova na unidade. Dono: quem tocar `e2e/aluno-tutor.spec.ts`.
- MN3. Recomendações da correção da mensagem fixa que foram para a pendência 12 de `docs/aia/tutor.md`. "Em assunto pessoal difícil" é
  abstrato para 11 anos (`pedagogia-reviewer`). "Seu professor" aparece logo abaixo de "Quem dá a aula acompanha…", e a foto
  `aviso-frase-nova--1366.png` mostra as duas lado a lado. E "não vê o que você escreveu" talvez precise ressalvar o acesso auditado
  da coordenação ao atender pedido do titular (`privacy-guardian`). Todas têm destino. Registro que a foto confirma a primeira
  e a segunda. Dono: Joaquim e Gabriel, na revisão de texto.
- MN4. A recomendação do `revisor-geral` (correção da mensagem fixa, 2ª) de gerar de novo o `apps/web/dist` antes de qualquer
  demonstração foi deixada como "aviso ao Orquestrador", e esse aviso não está no `estado.md`. Dono: Orquestrador.
- MN5. `docs/mvp-rapido.md:245-246` ainda diz que a mensagem fixa diz "seu professor" e que "é rascunho da D36, esperando o
  Joaquim". A decisão foi tomada, e a mesma expressão agora também aparece no aviso da introdução. É documento histórico do MVP. Uma
  nota apontando a correção basta. Dono: quem tocar `docs/mvp-rapido.md`.
- MN6. Recomendações das três correções com destino "retro": a do `forEach` por causa da contagem de `tools/ci/duracao-do-e2e.ts`
  (correção do censo, `revisor-geral`) e a do roteiro no critério de pronto das specs de tela (correção do roteiro,
  `frontend-reviewer`). Dono: Arquiteto, na retro da X4.

**Positivos**

- A frase do aviso ao professor vem do `@educa/shared`, o único ponto comum entre a web e a camada de IA. O comentário dela lista os
  dois gatilhos que a obrigam a mudar: uma rota que abra a conversa ao professor, e o F9 com acesso auditado ao conteúdo. A promessa
  ao aluno fica presa ao que o código faz.
- A correção do censo mediu antes de escolher: envolver só o `goto` em `carregarSemRedeLenta` não bastava, e o tempo estava na entrada
  pela tela. O documento registra o passo intermediário que não funcionou.
- O caso do material deixou de prometer, no título, o isolamento que ele não prova, e o documento aponta o caso que prova (`:527`).

### 5. Conclusão

APROVADA. Os 21 RF estão atendidos, com código, teste efetivo (três mutações vermelhas nesta rodada e oito nas anteriores) e foto
lida. O critério de pronto está cumprido, menos a esteira, que é do fechamento. O MA1 da rodada 3 foi resolvido. A mensagem fixa e o
aviso dizem a mesma frase, e ela é verdadeira no código. Os três casos do censo ganharam folga de dois terços do prazo, com a mesma
cobertura. Todos os testes que rodei passaram, e o processo está em ordem. Os menores vão ao `TODO.md`, e o primeiro deles, o MN1, é
o que vale fazer antes da próxima demonstração.

### 6. Pendências herdadas

| Pendência | Dono | Arquivo | Destino |
|---|---|---|---|
| M1 a M3, M5 a M12 das rodadas 1 a 3 | os das rodadas 1 a 3 | os das rodadas 1 a 3 | `TODO.md` (já no `estado.md`) |
| M4 da rodada 1 (a mensagem fixa) | — | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` | fechada nesta rodada |
| MN1: "Estrutura" e "IA" no roteiro da coordenação | Orquestrador | `docs/roteiro-da-demonstracao.md:113`, `:115`, `:257` e o 2.5 a 2.7 | correção de texto ou `TODO.md` |
| MN2: a fixture `MENSAGEM_FIXA` sem a frase | quem tocar o e2e do Tutor | `e2e/__fixtures__/aluno.ts`, `e2e/aluno-tutor.spec.ts`, `e2e/aluno-fluxo.spec.ts` | já no `TODO.md` |
| MN3: a redação da frase para 11 anos, "seu professor" e "quem dá a aula", e a ressalva da coordenação | Joaquim e Gabriel | `packages/shared/src/tutor/sinal.ts` | `docs/aia/tutor.md`, pendência 12 (já registrada) |
| MN4: gerar de novo o `apps/web/dist` antes da demonstração | Orquestrador | — | `TODO.md` ou o roteiro |
| MN5: o item 34 do `docs/mvp-rapido.md` | quem tocar o documento | `docs/mvp-rapido.md:245-246` | `TODO.md` |
| MN6: o `forEach` da duração do e2e e o roteiro no critério de pronto | Arquiteto | `tools/ci/duracao-do-e2e.ts`, template de tarefas | retro da X4 |
| `9_task.md:90` e `validacao.md:452` com a redação antiga da frase | — | — | registro histórico, sem ação (o `estado.md` já anota) |
| Commits `Fora do processo:` com código da spec | — | — | nenhum |

## Rodada 3 — 26/10/2026

**Escopo:** funcionalidade completa (revalidação depois da correção do C2 e da correção do W1)
**Commit validado:** `3c60f99a`
**Veredito: APROVADA COM RESSALVAS**

O C2 da rodada 2 está resolvido. A tarefa aberta "Para fazer" mede 768 px a 1366 × 768, na questão de enunciado mais longo das
sintéticas. "Enviar a atividade", o ponto de parada, "Anterior" e "Próxima" ficam numa linha só, e nada fica por cima de nenhum deles. A
forma corrigida, com quatro questões, também cabe: o resultado vai em duas colunas, e a lista "Questão por questão" rola por dentro, com
foco pelo teclado. No celular a barra continua presa embaixo, como a 6.1 pedia. Os dois casos novos do e2e no `chromebook` são
efetivos: as três mutações que rodei ficaram vermelhas. Com isso os 21 RF estão ATENDIDOS. Fica um achado **maior**, o MA1, que as
rodadas 1 e 2 não viram: `docs/roteiro-da-demonstracao.md` ainda descreve o aluno antes da X4 ("cai em **Atividades**", sem nenhuma
das três introduções), enquanto o `e2e/roteiro-da-demonstracao.spec.ts`, que o documento diz que é "o mesmo roteiro", já passa pelas
introduções e por Tarefas. É texto de documento e não bloqueia a próxima funcionalidade.

**O que esta rodada conferiu de novo.** Entre `fb8f28a2` e `3c60f99a` o código de produção mudou só em `Atividade.tsx`,
`BarraPresa.tsx` e `midia.ts` (correção `2026-10-25-tarefa-aberta-cabe-em-1366`, `f772feee`). Os testes mudaram em
`Atividade.test.tsx` e `e2e/aluno-atividade.spec.ts`, e o `e2e/escola-montada.spec.ts:229` mudou na correção
`2026-10-26-w1-aluna-nao-ve-a-turma` (`dd5462e1`), que só mexeu no e2e. Para os RF cujo código não mudou, valem a evidência e as cinco
mutações das rodadas 1 e 2, abaixo. Li por completo `Atividade.tsx`, `BarraPresa.tsx`, os dois casos novos do e2e e os dois de
componente.

### 1. RF a RF

Fotos desta rodada. As da vitrine estão em `.processo/vitrine/`: `aluno--aluno-{inicio,atividades,eu}--*` e
`aluno--aluno-atividades--Cinemática-lista-sintética--{computador,celular}.png`, a corrigida real da vitrine com 4 questões. As da
tarefa "Para fazer" saíram de um script descartável, porque a vitrine não semeia tarefa "Para fazer" (M5). O script entra como o aluno
da vitrine e simula `minhas-atividades`, a `prova` e o `meu-diagnostico`. Elas ficam em
`/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--spectelas-do-aluno-e-primeiro-acesso/a59399b8-932f-4618-aa7d-6d8076cd48b2/scratchpad/fotos/`:
`fazer-q{1,2}--{1366,1024,800,360}--{janela,inteira}.png`, `corrigida-4--{1366,1024,800,360}--{janela,inteira}.png`,
`fazer-q2--360--fim-janela.png` e `fazer-q2--1366--maior-inteira.png`. O script mede a página e faz o `elementFromPoint` no centro e na
borda de baixo de "Enviar" e do ponto de parada.

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 a RF6 | ATENDIDO | sem mudança desde a rodada 2 | idem | Fotos novas `aluno--aluno-{inicio,atividades,eu}--*`. "Nenhuma tela rola a 1366 × 768" no `vitrine.ts foto` |
| RF7 | ATENDIDO | `apps/web/src/areas/aluno/Atividade.tsx`: a ajuda no cartão da questão (`:206-227`), a linha única (`:239-261`); o fluxo (fila, envio com confirmação, resultado só depois de aprovado) não mudou | `e2e/aluno-atividade.spec.ts`, os 24 casos nos dois projetos (o fluxo de `:149`, `:235`, `:275`, `:366` e os dois novos, `:575` e `:622`): rodados, verdes | `fazer-q2--1366--janela.png`: "Enviar a atividade", o ponto de parada e "Anterior"/"Próxima" numa linha, y 672 a 720, sem nada por cima (`elementFromPoint` nos dois pontos, verdadeiro). "Pedir ajuda ao Tutor nesta questão" fica no pé do cartão. Em avaliação o link continua não existindo (`:219`, `e2e/aluno-fluxo.spec.ts` da rodada 1) |
| RF8 | ATENDIDO | sem mudança | `e2e/aluno-atividade.spec.ts:409-446` (rodados, verdes) | Ainda vista só pelo e2e (M5) |
| RF9 a RF19 | ATENDIDO | sem mudança desde a rodada 2 | idem; W1 (`e2e/escola-montada.spec.ts:63`, que passou a procurar a turma no cabeçalho de Eu): rodado, verde nos dois projetos | Fotos novas de Eu: a turma no cabeçalho |
| RF20 | ATENDIDO | `Atividade.tsx:239` (`md:flex md:flex-wrap`), `:249` (a barra `md:static`), `:246` (o ponto de parada `md:flex-1`), `:308` (duas colunas a partir de 1024 px), `:70` (a lista com altura máxima e `overflow-y-auto`), `:304` (o nome e o `tabIndex` só quando rola); `componentes/ui/BarraPresa.tsx` (prop `className`) | `e2e/aluno-atividade.spec.ts:575` e `:622` [chromebook]: `scrollHeight <= 768`, a barra `static`, "Próxima" na linha de "Enviar", os cinco controles `toBeInViewport({ ratio: 1 })` e sem nada por cima, a lista que rola por dentro com `tabindex="0"`. [celular]: a barra `sticky` abaixo de "Enviar" e do ponto de parada, a lista sem segunda rolagem. `Atividade.test.tsx:376` e `:555`. Mutações 6, 7 e 8 | "Para fazer": 768 px a 1366 × 768, na questão 1 e na 2 (`fazer-q{1,2}--1366--janela.png`). Corrigida simulada: 768 px (`corrigida-4--1366--janela.png`). Corrigida real da vitrine: o `vitrine.ts foto aluno /aluno/atividades --clicar 'text=Cinemática: lista sintética'` diz "Nenhuma tela rola a 1366 × 768" (na rodada 2 tinha 1194 px). A 360 px nada rola de lado (`scrollWidth` 360), e no fim da página a barra presa fica abaixo de "Enviar" e do ponto de parada, sem cobrir nenhum dos dois (`fazer-q2--360--fim-janela.png`). A 1024 e a 800 px a página rola de 36 a 71 px, mas nada fica coberto, porque a barra já está solta (M9) |
| RF21 | ATENDIDO | — | diff dos testes de `fb8f28a2` a `3c60f99a`: nenhum `.skip`, `.only` nem `fixme`, e nenhum caso removido. Os 2 casos de componente e os 2 de e2e são novos. O W1 trocou o `h2` da turma pelo cabeçalho, onde a tela a mostra hoje, e continua exigindo a turma, a escola e a ausência da colega. Nenhum arquivo de `paginas/` mudou | A esteira é conferida no fechamento |

Provas de mutação desta rodada. Para cada uma reconstruí a web com `tools/ci/e2e.ts --manter-ambiente`, e a árvore terminou limpa, com
`git checkout -- apps/web/src/areas/aluno/Atividade.tsx`. A 6 e a 7 rodaram juntas: uma está em `Respondendo` e a outra em
`Diagnostico`, e cada caso só desenha uma das duas fases. Depois de restaurar, reconstruí a web de novo e os quatro casos do RF20
voltaram a verde nos dois projetos, antes das fotos:

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF20 e RF7 ("Para fazer") | `md:static` da barra (`Atividade.tsx:249`) | `e2e/aluno-atividade.spec.ts:575` [chromebook]: "a barra presa cobriria a ação", Expected "static", Received "sticky" |
| RF20 (corrigida) | `lg:max-h-[clamp(…)]` da lista (`Atividade.tsx:70`) | `e2e/aluno-atividade.spec.ts:622` [chromebook]: "a página rola", Expected <= 768, Received 1048 |
| RF20 (linha única) | `md:flex md:flex-wrap` do invólucro (`Atividade.tsx:239`) | `e2e/aluno-atividade.spec.ts:575` [chromebook]: "Próxima na linha de Enviar", Expected < 44, Received 100 |

As três da rodada 1 (RF12/RF18 isolamento, RF12 dois papéis, RF6 regra 70 item 3) e as duas da rodada 2 (Eu e Início, RF20) valem,
porque o código delas não mudou.

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regras de negócio, os 14 pontos e as cinco "valem ainda" | cumpridas | Rodadas 1 e 2. A correção não toca nenhuma delas. A caixa do Tutor e a faixa não estão nesta tela. Em avaliação o caminho ao Tutor continua fora da tarefa aberta (`Atividade.tsx:219`), e o Início segue com o caminho aberto (RF5) |
| Regra: nada induz uso; sair nunca é mais difícil (D59, ponto de parada) | cumprida | A 1366 o ponto de parada fica à vista, ao lado de "Enviar", sem nada por cima (e2e `:575`, mutação 6). A 360 px ele fica no fim da página, logo abaixo de "Enviar", e a barra presa não o cobre (`fazer-q2--360--fim-janela.png`). É a forma da 6.1. O mockup (`mockup.md` 2.3a) nem mostra a frase no celular. A recomendação do `conformidade-reviewer` que a correção deixou "para a validação" fecha aqui sem achado |
| Bordas do PRD §7 | cobertas | Rodadas 1 e 2. O código delas não mudou |
| Letra Maior a 1366 × 768 (recomendação do `test-engineer` deixada para a validação) | justificada | Com `educa.letra=maior`, a página tem 1045 px e rola. A barra está solta, então nada cobre "Enviar" nem o ponto de parada (`fazer-q2--1366--maior-inteira.png`). A Tech Spec §9 diz que o RF20 vale "no tamanho Padrão; com a letra Maior vale o RF11" |
| Foto a 800 px (recomendação do `frontend-reviewer` deixada para a validação) | feita | `fazer-q{1,2}--800--*`: a linha quebra, "Anterior" e "Próxima" vão para a linha de baixo, soltas, e a página rola de 36 a 63 px. Nada fica coberto (M9) |
| Pronto: o aluno faz tudo pelos lugares novos, com "Sair" à vista e a faixa presa | cumprido | Rodadas 1 e 2. Os 24 e2e da tarefa aberta e o W1 rodaram nesta rodada |
| Pronto: nada de colega, sequência, pontos ou ranking | cumprido | RF10. Nada disso nas fotos novas |
| Pronto: introdução uma vez, pulável onde não é aviso, revisível; aviso em linguagem de 11 anos | cumprido | Rodada 1 |
| Pronto: e2e do aluno nos dois projetos | cumprido no que rodei | 26 casos nos dois projetos. A suíte inteira e as páginas públicas são da esteira |
| Pronto: os 21 RF com evidência | cumprido | Seção 1 |
| Pronto: 150 kB de entrada e 30 kB por tela | cumprido | O `size-limit` passou nas quatro execuções do e2e desta rodada (entrada 92,15 kB) |
| Pronto: os seis documentos atualizados | cumprido | Rodada 1. Os seis da lista não descrevem a disposição da tarefa aberta. Fora da lista, ver MA1 |
| Pronto: esteira verde no último commit que alterou código | esteira: conferida no fechamento | — |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck`, `npm run lint` | não rodados: escopo da funcionalidade completa (esteira) |
| Unidade e componente da tela que mudou | ✅ `npx vitest run --project unidade` em `Atividade.test.tsx`, `atividade.test.ts` e `componentes/ui/`: 441 passaram. Uma primeira chamada de dentro de `apps/web`, fora do projeto `unidade`, não resolveu `@educa/shared` em 4 arquivos. Era o lugar errado de rodar e não falha de teste: pela raiz, os mesmos arquivos passaram |
| E2E da tela que mudou e do W1 (`chromebook` e `celular`) | ✅ `aluno-atividade` e `escola-montada`: 26 passaram (1,9 min) |
| E2E das mutações | ❌ como esperado com a mutação (3 vermelhos, acima). ✅ depois de restaurar (4 passaram) |
| Esteira do GitHub | esteira: conferida no fechamento. Não entra no veredito |
| Revisões com veto registradas e aprovadas | ✅ `2026-10-25-tarefa-aberta-cabe-em-1366`: os seis obrigatórios com duas rodadas, e a última de cada um é APROVADO. Ela muda cinco arquivos fora de `tasks/`, no limite do passo 5 de `corrigir`, por isso sem `revisor-geral`. `2026-10-26-w1-aluna-nao-ve-a-turma`: os seis obrigatórios aprovados na 1ª, com `**Sem mutação:**` e o motivo, porque só o e2e mudou. Os dois commits levam `(correção …)`, e `git log origin/develop..HEAD --grep='^Fora do processo:'` não traz nada |

Dependências: o `node_modules` não era anterior ao `package-lock.json`, então não precisei rodar `npm ci`. As sessões da vitrine não
guardavam `educa.letra`, então as fotos estão no tamanho Padrão. A da letra Maior pôs a chave só no contexto dela.

### 4. Achados

**Críticos**

- Nenhum. O C2 da rodada 2 está resolvido, com código, dois casos de e2e efetivos e fotos a 1366, 1024, 800 e 360 px.

**Maiores**

- **MA1. `docs/roteiro-da-demonstracao.md` descreve o aluno, a professora e a coordenação de antes da X4.** `:147`: "Cada aluno
  entra […] e cai em **Atividades**, vazia". Hoje ele cai na introdução de quatro passos e depois no Início (RF2, RF12). `:193`
  e `:219`: "Ana → **Atividades**", mas o item se chama Tarefas desde a 2.0. O roteiro não fala de nenhuma das três introduções
  (`grep -c introdu` dá 0), e a coordenadora, a professora e a aluna passam cada uma pela sua na primeira entrada. `:196-198`: depois de
  enviar, "Aparece: Quem dá a aula ainda vai revisar a correção". Agora aparece antes a comemoração "Atividade entregue." (RF8).
  O documento diz, na `:7`, que "o mesmo roteiro roda sozinho, de ponta a ponta, em `e2e/roteiro-da-demonstracao.spec.ts`". O spec
  foi atualizado nas tarefas 2.0, 4.0, 9.0, 10.0 e 11.0 (`:186`, `:282`, `:336`, `:446`, `:571`), o documento não. Quem apresentar
  pelo texto vai encontrar telas que ele não descreve. Não é um dos seis documentos do critério de pronto, mas é doc em `docs/`
  contradizendo o código, e a regra o classifica como maior.
  **Correção sugerida:** uma correção de texto só no roteiro. O passo 2.x da coordenação e o 4 da professora ganham a linha da
  introdução ("passe pela introdução: Continuar até Começar", ou "Pular"). O 2.12 passa a "cai na introdução e depois no Início". Os
  `:193` e `:219` trocam Atividades por Tarefas, e o 5.3 diz a comemoração antes da espera pela correção. Dono: quem pegar a correção,
  com o `revisor-geral`. Não bloqueia a X8 nem o F2.

**Menores** (não mudam o veredito; o Orquestrador os leva ao `TODO.md`)

- M1 a M8 das rodadas 1 e 2 seguem como estavam. O código delas não mudou. A M5 (a vitrine sem tarefa "Para fazer") obrigou de novo a
  fotografar por script.
- M9. `apps/web/src/areas/aluno/Atividade.tsx:239`: de 768 a 1365 px a linha única quebra. "Anterior" e "Próxima" vão para uma
  segunda linha, e a página rola de 36 a 71 px a 1024 × 768 e a 800 × 768 (`fazer-q2--1024--janela.png`: a navegação fica logo abaixo
  da janela). Nada fica coberto, e o RF20 só pede 1366. Mas o Eu e o Início cabem a 1024 px (rodada 2), e esta tela, não. Se valer,
  pôr "Anterior" e "Próxima" em `compacto` a partir de 1024, ou o ponto de parada numa linha abaixo de "Enviar". Dono: frontend.
- M10. `Atividade.tsx:208-227`, a 360 px: a região de status vazia (`min-h-6`) ocupa uma linha própria acima de "Pedir ajuda ao Tutor
  nesta questão". Isso deixa um vão de ~50 px entre a alternativa D e o link (`fazer-q2--360--fim-janela.png`). É só visual. Dono:
  frontend.
- M11. O documento da correção (`tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md`, "O que o 'cabe' prova") escreve uma
  leitura do RF20: enunciado de uma a duas linhas, quatro questões e duas habilidades, no tamanho Padrão. Ele diz que "a Tech Spec
  §12b não muda". A leitura do Eu ficou na §9, e esta não ficou em lugar nenhum da Tech Spec. Levar as duas à §12b, junto da M7.
  Dono: Arquiteto.
- M12. Recomendações da correção do C2 com destino `TODO.md`: o degradê no pé da lista que rola, a quebra da linha do comentário em
  `Atividade.tsx:303` e o localizador de `e2e/aluno-atividade.spec.ts:656` preso à seção. A do seed "respondeu 0 de 4" com "acertou 1 de
  4" e tudo "em branco" se repete na foto da corrigida real (`aluno--aluno-atividades--Cinemática-lista-sintética--computador.png`), e
  já está no `estado.md` (C2). Dono: Orquestrador, no fechamento.

**Positivos**

- O caso "cabe" da tarefa aberta não mede só a altura. Ele confere a disposição ("Próxima" na linha de "Enviar"), `toBeInViewport({
  ratio: 1 })` e `elementFromPoint` no centro e na borda de baixo de cada controle. Foi essa combinação que fez a mutação 8 ficar
  vermelha mesmo com a página ainda dentro dos 768 px.
- A correção achou e escreveu a armadilha do `sr-only` absoluto, que escapa da rolagem sem um ancestral posicionado. Vale para toda
  lista que rola por dentro.
- O nome e o `tabIndex` da lista só existem quando ela rola. No celular não aparece uma parada de Tab que não faz nada.

### 5. Conclusão

APROVADA COM RESSALVAS. Os 21 RF estão atendidos, com código, teste efetivo (três mutações vermelhas nesta rodada, cinco nas
anteriores) e foto lida. O critério de pronto está cumprido, menos a esteira, que é do fechamento. Todos os testes que rodei passaram, e
o processo está em ordem. A ressalva é o MA1: o roteiro da demonstração descreve o produto de antes da X4. Ela vira uma correção de
texto, que não segura a próxima funcionalidade.

### 6. Pendências herdadas

| Pendência | Dono | Arquivo | Destino |
|---|---|---|---|
| MA1: o roteiro da demonstração de antes da X4 | quem pegar a correção | `docs/roteiro-da-demonstracao.md` | correção de texto (ou `TODO.md`, se o Orquestrador a deixar para depois do pouso) |
| M1 a M8 das rodadas 1 e 2 | os das rodadas 1 e 2 | os das rodadas 1 e 2 | `TODO.md` (já no `estado.md`) |
| M9: a tarefa aberta rola a 1024 e a 800 px | frontend | `apps/web/src/areas/aluno/Atividade.tsx` | `TODO.md` |
| M10: o vão acima de "Pedir ajuda ao Tutor" a 360 px | frontend | `apps/web/src/areas/aluno/Atividade.tsx` | `TODO.md` |
| M11: a leitura do "cabe" da tarefa aberta fora da Tech Spec | Arquiteto | `techspec.md` §12b | `TODO.md`, junto da M7 |
| M12: as recomendações da correção do C2 com destino `TODO.md` | Orquestrador | `tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md` | `TODO.md` |
| As recomendações da correção do C2 com destino "Validação" (foto a 800 px, ponto de parada no celular, letra Maior a 1366, fotos da tarefa aberta e da corrigida) | Validador | idem | fechadas nesta rodada (seção 2) |
| As da correção do W1 | Orquestrador | `tasks/correcoes/2026-10-26-w1-aluna-nao-ve-a-turma.md` | a do `getByRole('heading'` no portão vai à `retro`. A outra foi recusada com motivo |
| Commits `Fora do processo:` com código da spec | — | — | nenhum |


## Rodada 2 — 25/10/2026

**Escopo:** funcionalidade completa (revalidação depois das correções do C1)
**Commit validado:** `fb8f28a2`
**Veredito: REPROVADA**

O C1 da rodada 1 está resolvido. Eu e Início cabem em 1366 × 768, e também a 1024 px. Cada um tem um caso de e2e no projeto
`chromebook` que mede a altura e a disposição, e as duas mutações que rodei ficaram vermelhas. Mas a tarefa aberta
(`/aluno/atividades/<id>`, recomposta na 6.0) **não cabe** em 1366 × 768. Com uma questão de 4 alternativas na tela, a página tem
871 px, e na primeira vista a barra presa "Anterior / Próxima" cobre metade de "Pedir ajuda ao Tutor nesta questão" e de "Enviar a
atividade". O texto do ponto de parada ("Pode parar quando quiser…") fica escondido. A rodada 1 não viu isso porque não
fotografou a tarefa aberta, já que a vitrine não tem tarefa "Para fazer" (M5). Esta rodada fotografou. É um crítico novo, o C2. Deixa
o RF20 e o RF7 PARCIAIS.

**O que esta rodada conferiu de novo.** Entre `77e6a060` e `fb8f28a2` o código mudou só em `Eu.tsx`, `ComoEstouIndo.tsx` e
`Inicio.tsx` (correções `2026-10-25-eu-cabe-em-1366` e `2026-10-25-inicio-cabe-em-1366`), além dos testes dessas três telas. O merge
`98901f6c` é limpo: a árvore dele é igual à do `merge-tree` dos dois pais. Para os RF cujo código não mudou, valem a evidência e as
três mutações da rodada 1, abaixo. Nesta rodada li de novo o código e os testes de RF3, RF4, RF9, RF10 e RF20 e rodei de novo os
testes deles. Fotografei de novo todas as telas do aluno e as três introduções, e fotografei pela primeira vez a tarefa aberta.

### 1. RF a RF

Fotos da vitrine em `.processo/vitrine/` (montada e fotografada nesta rodada, escola cheia e vazia, 1366 e 360 px). As fotos a
1024 px, as do Início com três "Para fazer" e as da tarefa aberta "Para fazer" saíram de dois scripts descartáveis. Os scripts entram
como o aluno da vitrine e simulam `minhas-atividades` e a `prova`, porque a vitrine não as semeia (M5). Elas ficam em
`/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--spectelas-do-aluno-e-primeiro-acesso/620f1959-4df9-46ae-ae2c-4cc45b3d07cc/scratchpad/fotos/`
(`eu--{1366,1024,360}.png`, `inicio-tres--{1366,1024,360}.png`, `tarefa-respondendo--{1366,1024,360}.png`,
`tarefa-respondendo--1366-janela-topo.png` e `tarefa-respondendo--1366-janela-fim.png`).

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | sem mudança desde a rodada 1 | idem | Fotos novas `aluno--aluno-{inicio,atividades,eu}--*`: os três lugares |
| RF2 | ATENDIDO | sem mudança | idem | |
| RF3 | ATENDIDO | `areas/aluno/Eu.tsx:28` (a linha "Sair" na grade da conta), a casca | `e2e/minha-turma.spec.ts:233` e `:261`, `e2e/aluno-inicio.spec.ts:124`, `e2e/aluno-eu.spec.ts:231` (o "Sair" de Eu à vista sem rolar, a 1366 × 768): rodados, verdes | "Sair" à vista em `eu--1366.png`, `eu--1024.png` e na barra do topo a 360 px |
| RF4 | ATENDIDO | `areas/aluno/Inicio.tsx:24-40` (o cartão vira linha a partir de 768 px) | `e2e/aluno-inicio.spec.ts:36`, `:69`, `:100`, `:144`, `:172`: rodados, verdes | `inicio-tres--1366.png`: saudação, a onça com a função e o selo "IA", faixa e três tarefas, cada uma com "Pedir ajuda ao Tutor" |
| RF5 | ATENDIDO | sem mudança | `e2e/aluno-inicio.spec.ts:144` (rodado, verde) | O aviso da avaliação nos cartões 1 e 2 de `inicio-tres--1366.png` |
| RF6 | ATENDIDO | sem mudança | idem (mutação 3 da rodada 1) | Fotos novas `aluno--aluno-atividades--*` |
| RF7 | **PARCIAL** | `areas/aluno/Atividade.tsx:219-249` | os e2e de `aluno-atividade.spec.ts` (rodada 1) | O fluxo está provado, mas a tela tem um defeito que se vê: a 1366 × 768 a barra presa cobre a linha de "Enviar a atividade" (`tarefa-respondendo--1366-janela-topo.png`). Achado C2 |
| RF8 | ATENDIDO | sem mudança | idem | Ainda vista só pelo e2e: a vitrine não tem tarefa a entregar (M5) |
| RF9 | ATENDIDO | `areas/aluno/Eu.tsx:96-123` (a turma na linha de apoio do título; carregando, erro e "sem turma" logo abaixo), `ComoEstouIndo.tsx:32` | `Eu.test.tsx` (com dado, carregando, erro, sem turma), `titulo-das-telas.test.tsx`, `e2e/aluno-eu.spec.ts:39`, `:71`, `:86`, `e2e/minha-turma.spec.ts:52`, `:83`, `:115`: rodados, verdes | `eu--1366.png`: "2ºB … · 2º ano do Ensino Médio · Colégio …" no cabeçalho, as duas tarefas com "N de 4 certas" e "Para rever", as quatro linhas. `vazia--aluno--aluno-eu--computador.png`: "Nada corrigido ainda" |
| RF10 | ATENDIDO | as telas acima | `Eu.test.tsx` (a varredura de texto, rodada) | Nada de colega, média ou sequência nas fotos novas |
| RF11 a RF19 | ATENDIDO | sem mudança desde a rodada 1 | idem (mutações 1 e 2 da rodada 1) | Fotos novas das três `bem-vindo` e dos passos 3 e 4 do aluno: nenhuma rola a 1366 × 768 |
| RF20 | **PARCIAL** | Eu e Início resolvidos (`Eu.tsx:28`, `ComoEstouIndo.tsx:32`, `Inicio.tsx:26`). A tarefa aberta, não: `Atividade.tsx:237` | `e2e/aluno-eu.spec.ts:231` e `e2e/aluno-inicio.spec.ts:69` exigem `scrollHeight <= 768` no `chromebook` (mutações 4 e 5, vermelhas). Nenhum caso mede a tarefa aberta a 1366 × 768: o de `aluno-atividade.spec.ts:410` só mede a 360 px | `vitrine.ts foto` desta rodada: "Nenhuma tela rola a 1366 × 768" em Início, Tarefas, Eu, Privacidade e nas três `bem-vindo`, cheia e vazia. Eu e Início cabem também a 1024 px (768 px, `eu--1024.png`, `inicio-tres--1024.png`). **A tarefa aberta rola:** "Para fazer", 871 px (`tarefa-respondendo--1366.png`); corrigida, 1194 px (linha do `vitrine.ts foto aluno /aluno/atividades --clicar 'text=Cinemática: lista sintética'`, foto `aluno--aluno-atividades--Cinemática-lista-sintética--computador.png`). Achado C2 |
| RF21 | ATENDIDO | — | diff dos testes de `77e6a060` a `fb8f28a2`: nenhum `.skip`, `.only` nem `fixme`. Os casos que procuravam a turma pelo `h2` passaram a procurá-la no cabeçalho, e a ordem continua conferida (`Eu.test.tsx`, `aluno-eu.spec.ts:56-57`). Nenhum arquivo de `paginas/` mudou | A esteira é conferida no fechamento |

Provas de mutação desta rodada (a árvore terminou limpa, com `git checkout -- <arquivo>`; a web do ambiente foi reconstruída
depois com o código restaurado, e os dois casos voltaram a verde antes das fotos):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF20 (Eu) | `lg:grid-cols-2` da grade da conta (`apps/web/src/areas/aluno/Eu.tsx:28`) | `e2e/aluno-eu.spec.ts:231` [chromebook]: "Privacidade e Ajustes na mesma linha", Expected < 2, Received 66 |
| RF20 (Início) | `md:flex-row md:items-start md:justify-between` do cartão (`apps/web/src/areas/aluno/Inicio.tsx:26`) | `e2e/aluno-inicio.spec.ts:69` [chromebook]: o link do Tutor abaixo do título, Expected >= 1177, Received 444 |

As três mutações da rodada 1 (RF12/RF18 isolamento, RF12 dois papéis, RF6 regra 70 item 3) valem: o código delas não mudou.

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regras de negócio, os 14 pontos e as cinco "valem ainda" | cumpridas | rodada 1; as correções não tocam nenhuma delas. A caixa do Tutor e a faixa presa continuam (`e2e/aluno-inicio.spec.ts:36` e `:144`, rodados) |
| Borda: aluno sem turma | coberta | `e2e/aluno-eu.spec.ts:86`, `e2e/minha-turma.spec.ts:115` (rodados): o aviso fica abaixo do título, e as linhas continuam |
| Borda: dois alunos no mesmo Chromebook | coberta | `e2e/aluno-eu.spec.ts:100`, `e2e/aluno-inicio.spec.ts:172`, `e2e/minha-turma.spec.ts:131` e `:171` (rodados) |
| Demais bordas | cobertas | rodada 1; código sem mudança |
| Pronto: o aluno faz tudo pelos lugares novos, com "Sair" à vista e a faixa presa | cumprido | e2e rodados nesta rodada e na rodada 1 |
| Pronto: nada de colega, sequência, pontos ou ranking | cumprido | RF10 |
| Pronto: introdução uma vez, pulável onde não é aviso, revisível | cumprido | rodada 1 |
| Pronto: aviso em linguagem de 11 anos | cumprido | rodada 1 |
| Pronto: e2e do aluno nos dois projetos | cumprido no que rodei | os 40 casos desta rodada, nos dois projetos. A suíte inteira e as páginas públicas são da esteira |
| Pronto: os 21 RF com evidência | **faltando** | RF7 e RF20 PARCIAIS (C2) |
| Pronto: 150 kB de entrada e 30 kB por tela | cumprido | o `size-limit` passou nas três execuções do e2e desta rodada (etapa "teto do bundle da web") |
| Pronto: os seis documentos atualizados | cumprido | rodada 1. A Tech Spec §9 foi atualizada com o Eu novo, e `docs/interface.md` não descrevia o cartão da turma |
| Pronto: esteira verde no último commit que alterou código | esteira: conferida no fechamento | — |
| TODO "Foto do Eu a 1024 px" (dono: Validador) | feito | Eu e Início com dado medem 768 px a 1024 × 768 e não rolam (`eu--1024.png`, `inicio-tres--1024.png`). Os cartões de "Como estou indo" ficam com ~345 px, e o título da tarefa do Início, em uma linha. A linha do `TODO.md:200` pode fechar |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck`, `npm run lint` | não rodados: escopo da funcionalidade completa (esteira) |
| Unidade e componente das telas que mudaram | ✅ `Eu.test.tsx`, `areas/aluno/Inicio.test.tsx`, `titulo-das-telas.test.tsx`, `paginas/Inicio.test.tsx`: 79 passaram |
| E2E das telas que mudaram (`chromebook` e `celular`) | ✅ `aluno-eu`, `aluno-inicio`, `minha-turma`: 40 passaram (1,3 min) |
| E2E das mutações | ❌ como esperado com a mutação (2 vermelhos, acima). ✅ depois de restaurar (2 passaram) |
| Esteira do GitHub | esteira: conferida no fechamento. Não entra no veredito |
| Revisões com veto registradas e aprovadas | ✅ `2026-10-25-eu-cabe-em-1366`: os sete obrigatórios com rodada; a última de cada um é APROVADO (`revisor-geral` na 3ª, `test-engineer` na 2ª). `2026-10-25-inicio-cabe-em-1366`: os seis obrigatórios aprovados (`test-engineer` na 2ª). Sem `revisor-geral` porque a correção mudou só dois arquivos fora de `tasks/`, abaixo do limite do passo 5 de `corrigir`. Os dois commits levam `(correção …)`, e não há nenhum `Fora do processo:` |

Dependências: o `node_modules` não era anterior ao `package-lock.json`, então não precisei rodar `npm ci`. Antes das fotos conferi
que `.processo/vitrine/sessao-*.json` não guardava `educa.letra`, a armadilha que a correção do Eu achou: não guardava. Todas as fotos
estão no tamanho Padrão.

### 4. Achados

**Críticos**

- **C2. A tarefa aberta não cabe em 1366 × 768, e a barra presa cobre a ação** (RF20 e RF7 PARCIAIS).
  `apps/web/src/areas/aluno/Atividade.tsx:237`: a `BarraPresa` "Trocar de questão" fica presa (`sticky`) em toda largura. A 6.1
  pedia "a barra presa embaixo no celular" (`6_task.md`), e essa diferença não foi registrada. Some-se a isso a linha de
  "Pedir ajuda ao Tutor nesta questão" e "Enviar a atividade" (`:219`), o ponto de parada (`:234`) e a barra (`:237`), uma abaixo
  da outra. Com uma questão de 4 alternativas, a página tem 871 px a 1366 × 768. Na primeira vista, a barra (y ≈ 695 a 768) cobre
  a metade de baixo dos dois botões (y 665 a 709), e o texto "Pode parar quando quiser…" só aparece depois de rolar
  (`tarefa-respondendo--1366-janela-topo.png` e `-janela-fim.png`). É a tela de trabalho do aluno, e o `docs/interface.md:603` diz
  que ela "cabe na janela e rola por dentro". Pela lista do `frontend-reviewer`, botão sobreposto que esconde a ação é bloqueante.
  O ponto de parada escondido também toca a D59 (regra 70, item 4b: "esconder o ponto de parada"). A forma corrigida também rola
  (1194 px, com 4 questões no "Questão por questão"). Nenhum e2e mede a tarefa aberta no `chromebook`. O de `aluno-atividade.spec.ts:410`
  mede só a 360 px.
  **Correção sugerida:** a partir de 768 px, "Anterior" e "Próxima" vão para a mesma linha de "Pedir ajuda" e "Enviar" (ou a barra
  deixa de ser presa, como a 6.1 pedia). A linha sobe uns 100 px, e o ponto de parada fica à vista. Um caso no projeto `chromebook`
  abre a questão de enunciado mais longo das sintéticas, exige `scrollHeight <= 768` e que "Enviar a atividade" esteja à vista e
  sem nada por cima (`elementFromPoint` no centro e na borda de baixo). A mutação é tirar o ramo `md:`. Para a forma corrigida há
  dois caminhos. (a) O resultado cabe: o "Questão por questão" rola por dentro, ou a lista vai num painel. (b) O Arquiteto registra,
  com a palavra do Joaquim, que o RF20 vale para o resultado com até N questões, e põe isso na Tech Spec §12b. Recomendo (a)
  para a forma "Para fazer", que é a tela de trabalho e não tem conteúdo que cresce. Para a corrigida, o (b) é aceitável. Guardiões
  sugeridos: `frontend-reviewer` e `conformidade-reviewer` (ponto de parada, D59).

**Maiores**

- Nenhum além do C2. A barra presa em toda largura, contra a 6.1, faz parte dele.

**Menores** (não mudam o veredito; o Orquestrador os leva ao `TODO.md`)

- M1 a M5 da rodada 1 seguem como estavam. O código delas não mudou, e o M5 foi de novo o que escondeu um crítico, desta vez o C2.
- M6. `apps/web/src/areas/aluno/Eu.test.tsx:21`, `:317` e `:329`: o comentário e os nomes de dois casos ainda falam do "cartão da
  turma", que saiu na correção do Eu. Trocar por "a turma no cabeçalho". Dono: quem tocar `Eu.test.tsx`.
- M7. A leitura de que o RF20 vale "com duas tarefas corrigidas, no tamanho Padrão" está na Tech Spec §9, mas não na §12b, que é
  a lista do que muda critério do PRD e o Joaquim revê. E `tasks/correcoes/2026-10-25-eu-cabe-em-1366.md:40` cita "o miolo rola,
  `docs/interface.md` 9.3": a 9.3 é "Forma, espaço e elevação", e a frase está na `:603`, que fala da tela de trabalho rolar por
  dentro, não da página. Levar a leitura à §12b, junto com a do C2(b) se ela for o caminho. Dono: Arquiteto.
- M8. O e2e do Eu a 1366 × 768 simula a memória com títulos curtos, e a vitrine tem nomes de turma e de escola longos. A linha de
  apoio coube nas fotos (uma linha a 1366 e a 1024), mas o caso de nome com 60 ou mais caracteres já está no `TODO.md` (correção do
  Eu, `test-engineer` 1ª). Só registro aqui que é ele que falta para a medida valer com dado real. Dono: quem tocar
  `e2e/aluno-eu.spec.ts`.

**Positivos**

- A correção do Eu achou e escreveu as duas armadilhas da medida: medir antes de a turma carregar, e a sessão da vitrine com
  `educa.letra=maior`. Por isso o caso espera a turma e confere a disposição, e não só a altura. Vale como receita para todo caso
  "cabe na janela".
- Os dois casos novos medem no projeto `chromebook` e conferem outra coisa no `celular` (a ordem em coluna, nada rolando de lado),
  sem `.skip`.

### 5. Conclusão

REPROVADA pelo C2. A tarefa aberta, que a rodada 1 não fotografou, não cabe em 1366 × 768, e a barra presa cobre a linha de "Enviar a
atividade" e esconde o ponto de parada na primeira vista. O C1 está resolvido, com código, dois casos de e2e efetivos (mutações
vermelhas) e fotos a 1366, 1024 e 360 px. Os outros 19 RF estão atendidos. Todos os testes que rodei passaram, e o processo está em
ordem. O caminho até APROVADA é a correção C2 em `Atividade.tsx`, com o caso de e2e no `chromebook` para a forma "Para fazer", e a
decisão (a) ou (b) para a forma corrigida. A revalidação confere só o C2: roda de novo `e2e/aluno-atividade.spec.ts` e fotografa a
tarefa aberta, "Para fazer" e corrigida, a 1366 e a 360 px.

### 6. Pendências herdadas

| Pendência | Dono | Arquivo | Destino |
|---|---|---|---|
| M1 a M5 da rodada 1 | os da rodada 1 | os da rodada 1 | `TODO.md` (já no `estado.md`) |
| M6: "cartão da turma" nos testes do Eu | frontend | `apps/web/src/areas/aluno/Eu.test.tsx` | `TODO.md` |
| M7: a leitura do RF20 fora da §12b, e a citação errada da 9.3 | Arquiteto | `techspec.md` §12b, `tasks/correcoes/2026-10-25-eu-cabe-em-1366.md` | `TODO.md`, ou junto da correção C2 se for pelo (b) |
| M8: o caso do nome longo no cabeçalho do Eu | quem tocar o e2e do Eu | `e2e/aluno-eu.spec.ts` | já no `TODO.md` |
| "Foto do Eu a 1024 px" | Orquestrador | `TODO.md:200` | fechar: feito nesta rodada (cabe) |
| As recomendações das duas correções que estão em "Recomendações sem aplicar" com destino `TODO.md` | Orquestrador | `tasks/correcoes/2026-10-25-{eu,inicio}-cabe-em-1366.md` | `TODO.md` (as da correção do Início ainda não foram levadas: `estado.md`, "Devo ainda (C1, linha 2)") |
| Commits `Fora do processo:` com código da spec | — | — | nenhum |

## Rodada 1 — 25/10/2026

**Escopo:** funcionalidade completa
**Commit validado:** `77e6a060`
**Veredito: REPROVADA**

Um crítico, o RF20 PARCIAL. O RF20 diz que "toda tela nova ou recomposta [...] cabe em 1366 × 768". Medido no commit
validado, Eu e Início, com dado comum, rolam a página nessa janela. Os outros 20 RF têm código, teste efetivo e, quando
têm tela, foto lida. Todos os testes que rodei passaram, e as três mutações ficaram vermelhas.

### 1. RF a RF

Fotos em `.processo/vitrine/` (vitrine montada nesta rodada, escola cheia e vazia, 1366 px e 360 px). As do Início com
tarefas e de Tarefas com quatro "Para fazer" vêm de um script descartável. A vitrine cheia não semeia tarefa "Para
fazer", então o script entra como o aluno da vitrine e simula `minhas-atividades`. Ficam no scratchpad desta sessão:
`inicio-com-tarefas--{computador,celular}.png` e `tarefas-com-quatro--{computador,celular}.png`.

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `apps/web/src/areas/navegacao.ts:74-78` (Início, Tarefas, Eu), `:88-90` (`RODAPE_DA_LATERAL.aluno` vazio) | `areas/navegacao.test.ts`, `e2e/areas.spec.ts:294` ("o aluno vê Início, Tarefas e Eu"), `e2e/casca.spec.ts` (W12) | Fotos `aluno--aluno-inicio--{computador,celular}.png`: lateral e barra de baixo com os três lugares. Sem "Avisar um adulto" |
| RF2 | ATENDIDO | `apps/web/src/paginas/Inicio.tsx:20-47`, `areas/aluno/rotas.tsx` (redirect de `minhaTurma`) | `paginas/Inicio.test.tsx`, `e2e/areas.spec.ts:350` e `:361` | |
| RF3 | ATENDIDO | `componentes/introducao/TelaDeFoco.tsx:43`, `areas/aluno/Eu.tsx:64`, casca | `e2e/aluno-inicio.spec.ts:69`, `e2e/introducao-pecas.spec.ts:53`, `e2e/aluno-eu.spec.ts:158` | "Sair" à vista nas fotos do Início, de Eu e da introdução (computador e celular) |
| RF4 | ATENDIDO | `areas/aluno/Inicio.tsx:91-104`, `inicio.ts:21-34`, `FaixaDeSupervisao.tsx` (sticky, sem fechar) | `areas/aluno/Inicio.test.tsx`, `inicio.test.ts`, `e2e/aluno-inicio.spec.ts:36` (faixa à vista depois de rolar, sem botão) | Fotos `aluno--aluno-inicio--*`, `vazia--aluno--aluno-inicio--*`, `inicio-com-tarefas--*`. O Início não lê `tutor/conversa` (`Inicio.test.tsx`) |
| RF5 | ATENDIDO | `areas/aluno/Inicio.tsx:31` (`AVISO_DA_AVALIACAO`, e o link ao Tutor continua) | `e2e/aluno-inicio.spec.ts:89`, `e2e/aluno-fluxo.spec.ts` | Foto `inicio-com-tarefas--computador.png`: a avaliação com o aviso e "Pedir ajuda ao Tutor" |
| RF6 | ATENDIDO | `areas/aluno/atividades.ts:65-71`, `Atividades.tsx`, `materia.ts` | `atividades.test.ts`, `Atividades.test.tsx` ("Corrigida só com a correção aprovada"), `e2e/aluno-atividade.spec.ts:85` e `:482` | Mutação 3. A API só dá `com_diagnostico` com lote aprovado (`apps/api/src/atividade/minha-atividade/minha-atividade.service.ts:24-26`). Fotos `aluno--aluno-atividades--*`, `tarefas-com-quatro--*` |
| RF7 | ATENDIDO | `areas/aluno/Atividade.tsx` (só moldura) | `e2e/aluno-atividade.spec.ts:149`, `:235`, `:275`, `:366` | Os e2e de hoje passaram nesta rodada |
| RF8 | ATENDIDO | `areas/aluno/atividade.ts:67-69` (`comemoracaoNaTela`), `Atividade.tsx:412` (estado de tela), `componentes/ui/Comemoracao.tsx`/`.css` | `atividade.test.ts`, `Comemoracao.test.tsx`, `e2e/aluno-atividade.spec.ts:409-446`, `e2e/introducao-pecas.spec.ts:110-155` | A forma da comemoração vista pelo e2e (a vitrine não tem tarefa a entregar) |
| RF9 | ATENDIDO | `areas/aluno/Eu.tsx`, `ComoEstouIndo.tsx`, `api/memoria-do-tutor.ts:16-20` (só `resultado` não nulo, filtro na `queryFn`) | `Eu.test.tsx:188` ("só a correção aprovada"), `como-estou-indo.test.ts`, `e2e/aluno-eu.spec.ts:38`, `:69`, `:84` | Fotos `aluno--aluno-eu--*`, `vazia--aluno--aluno-eu--*`. O texto do sem-turma é o de hoje (igual ao de `MinhaTurma.tsx` em `5ca8739`) |
| RF10 | ATENDIDO | as telas acima | `Inicio.test.tsx:368`, `Atividades.test.tsx:151`, `Eu.test.tsx:262` (varrem o texto) | Nada de colega, média ou sequência nas fotos |
| RF11 | ATENDIDO | `apps/web/src/letra.ts`, `index.html` (script em linha), `estilos.css`, `componentes/ajustes/TamanhoDaLetra.tsx` | `letra.test.ts`, `TamanhoDaLetra.test.tsx`, `e2e/tamanho-da-letra.spec.ts:67-244` (antes do primeiro quadro, só grava ao escolher, 360 px com Maior, só no aluno) | Foto `aluno--aluno-bem-vindo--Continuar-Continuar-Continuar--celular.png` (passo 4) |
| RF12 | ATENDIDO | `apps/api/src/sessao/eu/eu.service.ts:28-45`, `eu.repository.ts:46-55`, `sessao/tenant/resolucao-de-tenant.repository.ts:183-197`, `paginas/Inicio.tsx:42-44` | `apps/api/test/introducao.int.test.ts` (22 casos: duas escolas, vínculo encerrado, dois papéis, outra conta, eliminação agendada), `e2e/aluno-introducao.spec.ts:81`, `e2e/professor-introducao.spec.ts:146` | Mutação 2 |
| RF13 | ATENDIDO | `areas/aluno/introducao/textos-da-introducao.ts:37-40` (três `obrigatorio: true`), `componentes/introducao/Introducao.tsx:51` | `Introducao.test.tsx`, `BemVindo.test.tsx`, `e2e/introducao-pecas.spec.ts:72`, `e2e/aluno-introducao.spec.ts:81` | Fotos `aluno--aluno-bem-vindo--*` (passos 1, 3 e 4) |
| RF14 | ATENDIDO | `areas/aluno/introducao/aviso-de-privacidade.ts` (prazo lido de `CATEGORIAS_DE_RETENCAO`) | `textos-da-introducao.test.ts` (exige as frases, até 15 palavras, recusa "nota" e termo jurídico) | Foto `aluno--aluno-bem-vindo--Continuar-Continuar--*`. Ver o menor M1 |
| RF15 | ATENDIDO | `areas/professor/introducao/textos-da-introducao.ts:39-42`, `areas/coordenacao/introducao/textos-da-introducao.ts:42-44` | os dois `textos-da-introducao.test.ts`, os dois `BemVindo.test.tsx`, `e2e/professor-introducao.spec.ts:106`, `e2e/coordenacao-introducao.spec.ts:102` (pular) | Fotos `professora--professor-bem-vindo--*`, `coordenacao--coordenacao-bem-vindo--*` |
| RF16 | ATENDIDO | `Introducao.tsx:39,92-97` (a mesma classe nos dois botões) | `Introducao.test.tsx`, `e2e/introducao-pecas.spec.ts:53`, `e2e/aluno-introducao.spec.ts:166` e `:183` (sair e fechar a aba não gravam) | |
| RF17 | ATENDIDO | `areas/aluno/Eu.tsx:52`, `areas/navegacao.ts:97-104` (`MENU_DA_PESSOA`) | `e2e/aluno-introducao.spec.ts:227`, `e2e/professor-introducao.spec.ts:122`, `e2e/coordenacao-introducao.spec.ts:136` | Fotos dos três `bem-vindo`, revendo, com "Fechar" |
| RF18 | ATENDIDO | `apps/api/src/sessao/eu/eu.controller.ts:22-27` (corpo vazio estrito), `packages/shared/src/permissao/matriz.ts` (`eu.concluir_introducao`, rede `nunca`) | `introducao.int.test.ts` (repetida, `Promise.all`, permissão, sem ano), `eu.repository.int.test.ts:25` (isolamento), `matriz.test.ts` | Mutação 1 |
| RF19 | ATENDIDO | `componentes/ui/onca/Onca.tsx`, `componentes/ui/Comemoracao.tsx` | `Onca.test.tsx:47-170` (mesmo rosto, boca trocada fica vermelha), `ui/ia/avatar-so-nas-duas-pecas.test.ts` (quem importa a onça e a `comemorando`), os três `textos-da-introducao.test.ts` | Fotos: acenando e apontando com a função e o selo "IA" |
| RF20 | **PARCIAL** | `areas/aluno/Eu.tsx`, `areas/aluno/Inicio.tsx:24-40` | quatro estados: `Inicio.test.tsx`, `Atividades.test.tsx`, `Eu.test.tsx`, os `BemVindo.test.tsx`. 360 px: e2e nos dois projetos. Pedaços: `apps/web/nome-dos-chunks.test.ts` (build real, verde) | **Não cabe em 1366 × 768.** `/aluno/eu` com duas tarefas corrigidas: página de 954 px (linha "Telas cuja página rola a 1366 × 768" do `vitrine.ts foto`, foto `aluno--aluno-eu--computador.png`). `/aluno/inicio` com três "Para fazer": 866 px (`inicio-com-tarefas--computador.png`). Tarefas com quatro (768 px) e a introdução cabem. Achado C1 |
| RF21 | ATENDIDO | — | diff dos testes de `5ca8739` a `77e6a060`: nenhum `.skip`, `.only` nem `fixme` novo. Cada caso removido voltou reescrito para os lugares novos, e nenhum ficou mais fraco: RF24 da aparência agora com a letra, W2 do aluno, `onca/` com os importadores novos, cenário do k6 com as rotas do Início. O caso do job que "renovava a validade" mudou de propósito na correção `montar-arquivo-renova-validade`. Páginas públicas: nenhum arquivo de `paginas/` mudou além de `Inicio.tsx` | A parte "a esteira" é conferida no fechamento |

Provas de mutação (a árvore terminou limpa, `git status` vazio, com `git checkout -- <arquivo>` depois de cada uma):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF12/RF18 (isolamento) | `eq(usuario.id, usuarioId)` em `EuRepository.marcarIntroducaoVista` (`apps/api/src/sessao/eu/eu.repository.ts:52`) | `apps/api/test/introducao.int.test.ts`: "só a própria linha (aluno)", "só a própria linha (professor)", "escrita do GET, só a própria linha" (3 vermelhos) |
| RF12 (dois papéis) | `eq(usuario.papel, papel)` em `introducaoMaisAntigaDaConta` (`resolucao-de-tenant.repository.ts:194`) | `introducao.int.test.ts`: "dois papéis: professora em A e coordenadora em B não herdam uma da outra" |
| RF6 (regra 70, item 3) | "Corrigidas" aceitando também `enviada` (`apps/web/src/areas/aluno/atividades.ts:69`) | `atividades.test.ts` (2) e `Atividades.test.tsx` ("Corrigida só com a correção aprovada" e "com dado") |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: os 14 pontos do fechamento (d) do mockup | cumprida | A caixa do Tutor fica em todo estado (`e2e/aluno-inicio.spec.ts:89`). A faixa está presa (`:36`). Sem foto, voto, Refazer nem Editar. O e2e prova o "Sair" na casca e em Eu. A onça tem três poses, sem "acolhendo" (`Onca.test.tsx:47`). Carregando e erro têm teste de componente. A tela diz "quem dá a aula" |
| Regra: uma formulação só para a supervisão | cumprida | `aviso-de-privacidade.ts` importa `TEXTO_DA_SUPERVISAO`, e `FaixaDeSupervisao.tsx` usa a mesma constante |
| Regra: resultado só de correção aprovada | cumprida | mutação 3; `memoria-do-tutor.ts:16-20` |
| Regra: nada induz uso; o agente não se passa por pessoa | cumprida | `inicio.ts` (saudação fixa), os testes de texto dos três papéis, `Onca.test.tsx:109` |
| Regra: a introdução é da pessoa e do papel | cumprida | mutação 2; `introducao.int.test.ts` |
| Borda: aluno sem turma | coberta | `e2e/aluno-eu.spec.ts:84`, `Inicio.test.tsx` |
| Borda: transferido no mesmo ano | coberta | `apps/api/src/tutor/tutor.int.test.ts` ("o aluno transferido no mesmo ano segue com a própria tarefa corrigida", rodado: verde) |
| Borda: dois alunos no mesmo Chromebook | coberta | `e2e/tamanho-da-letra.spec.ts:149`, `aluno-introducao.spec.ts:263`, `aluno-eu.spec.ts:98`, `aluno-inicio.spec.ts:117` |
| Borda: professor em duas escolas, virada, vínculo encerrado | coberta | `introducao.int.test.ts` ("vínculo encerrado (RF12)", "virada do ano letivo não a apaga"), `e2e/professor-introducao.spec.ts:146` |
| Borda: aluno em duas escolas | coberta | `eu.service.test.ts:118` (aluno sem conta: vale só a própria linha) |
| Borda: dois cliques ou duas abas | coberta | `introducao.int.test.ts` ("concorrência", "corrida do GET"), `e2e/aluno-introducao.spec.ts:211` |
| Borda: a gravação falha | coberta | `introducao.int.test.ts` (trigger que faz o Postgres recusar, contador sem rótulo), `e2e/aluno-introducao.spec.ts:194` |
| Borda: coordenação com incidente pendente | coberta | `e2e/coordenacao-introducao.spec.ts:161` |
| Pronto: o aluno faz tudo pelos lugares novos, com "Sair" à vista e a faixa presa | cumprido | `e2e/areas.spec.ts`, `aluno-fluxo.spec.ts`, `aluno-atividade.spec.ts` e `aluno-inicio.spec.ts` verdes nesta rodada |
| Pronto: nenhuma tela do aluno mostra colega, sequência, pontos ou ranking | cumprido | RF10 |
| Pronto: a introdução aparece uma vez, pode ser pulada onde não é aviso e pode ser revista | cumprido | RF12, RF13, RF15, RF17 |
| Pronto: aviso em linguagem de 11 anos | cumprido | RF14 |
| Pronto: e2e do aluno e das páginas públicas, nos dois projetos | cumprido no que rodei | os 198 casos que rodei, nos projetos `chromebook` e `celular`. As páginas públicas e a suíte inteira são da esteira, conferida no fechamento |
| Pronto: os 21 RF com evidência | **faltando** | RF20 PARCIAL |
| Pronto: 150 kB de entrada e 30 kB por tela | cumprido | `apps/web/nome-dos-chunks.test.ts` (build real em memória), verde |
| Pronto: seis documentos atualizados e as pendências do aviso fechadas nos três que as listam | cumprido | `docs/lgpd.md` (linha da marca e da letra; seção 9, item 12), `docs/aia/tutor.md` (pendência 12), `docs/conformidade-mec.md` (item 3 e a caixa marcada), `docs/modelo-de-dados.md:59`, `docs/interface.md`, `docs/glossario.md` |
| Pronto: esteira verde no último commit que alterou código | esteira: conferida no fechamento | — |
| Carga (7c) | cumprido | `infra/k6/login-7h30.js`: `/v1/eu` e `minhas-atividades` com p95 na rajada. `infra/test/carga-login.test.ts`: 35 verdes |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck` | não rodado: escopo da funcionalidade completa (esteira) |
| `npm run lint` | não rodado: escopo da funcionalidade completa (esteira) |
| Unidade e componente, os 34 arquivos da funcionalidade | ✅ 592 passaram (inclui `nome-dos-chunks.test.ts` com build real e `matriz.test.ts`) |
| Integração da funcionalidade | ✅ `introducao.int.test.ts`, `eu.repository.int.test.ts` e os casos da introdução e do isolamento de `arquivo-do-titular.int.test.ts`: 26 passaram. `tutor.int.test.ts` (transferido): 4 passaram |
| E2E da funcionalidade (`chromebook` e `celular`) | ✅ 122 passaram (`aluno-introducao`, `aluno-inicio`, `aluno-eu`, `professor-introducao`, `coordenacao-introducao`, `tamanho-da-letra`, `introducao-pecas`) e 76 passaram (`aluno-atividade`, `areas`, `aluno-fluxo`) |
| Infra (`infra/test/carga-login.test.ts`) | ✅ 35 passaram |
| Esteira do GitHub | esteira: conferida no fechamento. Não entra no veredito |
| Revisões com veto registradas e aprovadas | ✅ As 11 tarefas têm rodada de todo revisor obrigatório, e a última de cada um com veto é APROVADO. A spec tem `revisao-spec.md` APROVADA (rodada 4). Desde `5ca8739`, todo commit com código leva `(tarefa N.0)` ou `(correção …)`, e nenhum é `Fora do processo:` |

Dependências: o `node_modules` não era anterior ao `package-lock.json`, então não precisei rodar `npm ci`.

### 4. Achados

**Críticos**

- **C1. RF20 PARCIAL: Eu e Início não cabem em 1366 × 768.** `apps/web/src/areas/aluno/Eu.tsx`: com as duas tarefas
  corrigidas da vitrine cheia, a página tem 954 px. Isso não é um caso extremo: é o primeiro bimestre de qualquer aluno.
  O mockup da spec diz "cabe em 1440 × 780" (`mockup.md` 2.5) e compõe a tela de outro jeito: a turma vai no
  complemento do cabeçalho, as linhas têm 56 px e as quatro linhas da conta ficam numa grade 2 × 2. Na implementação, a
  turma ocupa um cartão de 165 px, e as quatro linhas de 66 px ficam em uma coluna. `apps/web/src/areas/aluno/Inicio.tsx:24-40`: com três tarefas
  "Para fazer", a página tem 866 px, porque cada cartão leva o "Pedir ajuda ao Tutor" numa linha própria (cartão de
  162 a 194 px). O `frontend-reviewer` apontou o Eu na 7.0 ("Tela cheia passa de 768 px a 1366 × 768 (822 px)"). A
  recusa ficou na tabela "Sem aplicar" do `7_task.md:193` com o motivo "o PRD não pede que Eu caiba na janela", e o
  RF20 pede, com essas palavras. A Tech Spec não registra esse desvio. Há dois caminhos, e só um deles vale:
  (a) **compor as duas telas para caber**: o Eu como no mockup (turma no cabeçalho, conta em 2 × 2 a partir de 1024 px)
  e o Início com o "Pedir ajuda ao Tutor" na mesma linha do título a partir de 768 px. Cada uma ganha um caso no projeto
  `chromebook` que, com dado (Eu com duas corrigidas, Início com três "Para fazer"), exige
  `document.documentElement.scrollHeight <= 768`. Num tamanho maior, o miolo rola por dentro, como pede a 9.3 do
  `docs/interface.md`; ou (b) **mudar o critério**: o Arquiteto revê o RF20 com a palavra do Joaquim ("cabe em 1366 ×
  768" só para a tela de foco e a tela de trabalho; Início e Eu rolam a página) e registra isso no PRD e na Tech Spec
  (12b). Recomendo (a). A mesa e o mockup já resolvem o Eu, e o Início cabe com uma linha a menos por cartão.

**Maiores**

- Nenhum além do C1. O desvio do RF20 sem registro faz parte dele.

**Menores** (não mudam o veredito; o Orquestrador os leva ao `TODO.md`)

- M1. `componentes/introducao/RegiaoQueRola.tsx` (passo 3 do aluno). No computador, a região do aviso mostra só três das
  17 frases e deixa uns 110 px vazios antes do "Continuar" (`aluno--aluno-bem-vindo--Continuar-Continuar--computador.png`).
  Deixar a região ocupar a altura livre. Dono: frontend, numa próxima tarefa que mexa na introdução.
- M2. `componentes/ui/Linha.tsx`. A 360 px, o título da tarefa sai cortado com reticências ("Cinemática: lista sínt…",
  `aluno--aluno-atividades--celular.png`), e o aluno não lê o nome inteiro na lista. Usar `tituloEmDuasLinhas` na linha
  da tarefa, como já se faz em "Rever a introdução". Dono: frontend.
- M3. A casca da X1 mostra o papel em minúsculo ("aluno") no rodapé da lateral (todas as fotos do aluno). A 2.0 deixou
  isso para a validação. Dono: frontend, na casca.
- M4. Decisão aberta do Joaquim, registrada em `estado.md` ("Esperando o Joaquim", 25/10 ~17:20): a introdução promete
  "Se você contar algo pessoal difícil, quem dá a aula é avisado.", e a mensagem fixa de
  `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` não diz isso. Enquanto não houver resposta, as duas dizem coisas
  diferentes. Dono: Joaquim, e depois uma correção.
- M5. A vitrine cheia não semeia tarefa "Para fazer" nem tarefa a entregar. Por isso o Início com dado e a comemoração
  não aparecem pelo `vitrine.ts foto`, e o achado C1 do Início só se viu com um script à parte. Já está no `TODO.md`
  (Implementador 3); vale lembrar que foi isso que deixou o C1 passar. Dono: `tools/vitrine/escola.ts`.

**Positivos**

- O teste da falha de gravação usa um trigger que faz o próprio Postgres recusar (`introducao.int.test.ts`,
  `quebrarAEscritaDe`), e não um mock do repository.
- O prazo da conversa no aviso sai do catálogo de retenção (`CATEGORIAS_DE_RETENCAO.conversa_tutor`), e não de um número
  escrito à mão. Se a retenção mudar, o aviso muda junto.
- Cada tela tem caso de "o aluno seguinte no mesmo computador", e esses casos pegam o vazamento de cache entre pessoas
  que o teste de componente não vê.

### 5. Conclusão

REPROVADA por um crítico, o RF20 PARCIAL. Os outros 20 RF estão atendidos, com código, teste efetivo (três mutações
vermelhas) e foto lida. Todos os testes que rodei passaram, e o processo está em ordem. O caminho até APROVADA é a
correção C1 pelo caminho (a), com os dois casos de e2e que medem a altura no projeto `chromebook` e as fotos da vitrine
lidas de novo, ou a revisão do RF20 pelo caminho (b), com a palavra do Joaquim. Depois disso, a revalidação confere
só o C1 e roda de novo os e2e de `aluno-eu` e `aluno-inicio`.

### 6. Pendências herdadas

| Pendência | Dono | Arquivo | Destino |
|---|---|---|---|
| M1: região do aviso de privacidade baixa no computador | frontend | `apps/web/src/componentes/introducao/RegiaoQueRola.tsx` | `TODO.md` |
| M2: título da tarefa cortado a 360 px | frontend | `apps/web/src/componentes/ui/Linha.tsx`, `areas/aluno/Atividades.tsx` | `TODO.md` |
| M3: papel em minúsculo no rodapé da lateral | frontend | `apps/web/src/componentes/CascaDaEscola.tsx` | `TODO.md` |
| M4: a mensagem fixa do Tutor no assunto delicado não diz que o professor é avisado | Joaquim | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` | decisão em `estado.md`, depois uma correção |
| M5: a vitrine sem tarefa "Para fazer" e sem tarefa a entregar | processo | `tools/vitrine/escola.ts` | já no `TODO.md` |
| A revisão do texto do aviso por orientação educacional e por advogado, antes do primeiro aluno real | Joaquim e Gabriel | `docs/lgpd.md` seção 9, item 12 | já registrada nos três documentos |
| O art. 24 do ECA Digital: o aviso também ao responsável? | produto | PRD §10 | F9 |
| Commits `Fora do processo:` com código da spec | — | — | nenhum |

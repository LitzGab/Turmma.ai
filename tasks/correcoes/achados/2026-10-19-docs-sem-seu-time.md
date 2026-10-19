# Achados das revisões — `tasks/correcoes/2026-10-19-docs-sem-seu-time.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-19 19:07:04 · `tasks/correcoes/2026-10-19-docs-sem-seu-time.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (é só documentação. As sete citações de "Seu time" saíram, e o `grep` nos sete documentos não acha nenhuma.)
Portão local: carimbo válido

Bloqueantes:

1. **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/docs/roteiro-da-demonstracao.md:227-228`: o roteiro ainda descreve uma tela que não existe, que é o defeito que esta correção veio tirar.**
   - **"em Ver quem, o nome da Ana e o uso do dia":** o botão "Ver quem" só existe dentro do aviso de atenção humana. Ele só aparece quando `alunosQuePrecisam > 0` (`apps/web/src/areas/professor/TurmaHoje.tsx:110-122`), e o e2e `e2e/professor-tutor.spec.ts:95` só o procura dentro desse aviso. Neste passo a Ana pediu a resposta pronta, que é o sinal `resposta_pronta` e não atenção humana. A professora não vai achar "Ver quem" na tela. O botão que abre o painel com os nomes e as "Trocas hoje" é **"Ver o uso do Tutor por aluno"** (`TurmaHoje.tsx:133-135`).
   - **A frase citada em "Sinais da turma" também não é a da tela.** Ali o grupo aparece somado, pela `falaDoGrupo` (`apps/web/src/areas/professor/sinais.ts:44-49`), e o texto sai `1 aluno pediu a resposta pronta na questão 1 de "Atividade — Reagente limitante".` A frase "Pediu a resposta pronta na questão 1 de …" é a do sinal por aluno, que só aparece dentro do painel (`textoDoSinal`, `sinais.ts:52-55`).
   - **Correção exigida:** reescrever o passo 5. Em "Sinais da turma" fica "1 aluno pediu a resposta pronta na questão 1 de “Atividade — Reagente limitante”", sem nome. Depois vem **Ver o uso do Tutor por aluno**, e o painel "O que o Tutor viu" mostra a Ana com "Pediu a resposta pronta na questão 1 de …" e as trocas de hoje.
   - **Corrigir também o documento da correção:** `tasks/correcoes/2026-10-19-docs-sem-seu-time.md:26` e `:28` dão "Ver quem" como o caminho até o nome e o uso. Precisam dizer o botão certo.

Recomendações:
- `docs/glossario.md:203-204`: "Feed de agentes" descreve as duas telas do pé do sino como "onde cada agente é uma thread". Hoje "O que o Tutor viu" (`/time/tutor`) só redireciona para a aba Hoje, ou para Turmas quando há mais de uma turma (`apps/web/src/areas/professor/Tutor.tsx:32-35`). O verbete fica mais exato se disser que o Tutor fala na aba Hoje da turma, com os sinais somados e o painel "O que o Tutor viu", e não numa tela de thread própria.
- No roteiro, "(abre a aba Hoje da turma)" só vale porque a Helena tem uma turma só. Uma nota de uma linha evitaria surpresa se o roteiro um dia passar a ter duas turmas para ela.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-19 19:07:15 · `tasks/correcoes/2026-10-19-docs-sem-seu-time.md`

VEREDITO: REPROVADO

**Cenários exigidos:** a correção não muda código, então a prova é a busca no texto e a conferência contra a tela que existe.
- **Caminho feliz:** nenhuma das sete páginas cita mais "Seu time", e cada caminho novo existe na tela.
- **Borda 1:** a professora tem uma turma só, e "O que o Tutor viu" abre a aba Hoje dela.
- **Borda 2:** a professora tem mais de uma turma, e o mesmo link leva a Turmas, para ela escolher.
- **Borda 3:** um aluno pediu a resposta pronta e nenhum aluno precisa de um adulto. É exatamente a cena do roteiro.
- **Permissão e isolamento:** o texto das AIAs continua sem nome na aba Hoje e com nome só no painel, que é só do professor da turma (D34, regra 70, item 7).

**Cobertos:**
- **A busca:** `grep -ni "seu time"` nas sete páginas não devolve nenhuma linha. Também não sobra caminho `/time/` como lugar da tela; as citações a `packages/shared/src/time/funcoes.ts` são caminho de código e estão certas.
- **Os nomes conferem com o código:**
  - `SinoDoProfessor.tsx:16-17` tem "O que o Assistente fez" e "O que o Tutor viu".
  - `Tutor.tsx:34` leva a `?aba=hoje` com uma turma e a Turmas nos outros casos.
  - `TurmaHoje.tsx:52` chama o painel com nome de "O que o Tutor viu" (`?ver=tutor`).
  - `TurmaHoje.tsx:130` tem "Sinais da turma", com a soma sem nome.
  - A releitura dos sinais é a cada 15 s, então "consulta de tempos em tempos", na AIA de sinais, está certo.
  - `Time.tsx:343` tem o Aprovar da versão adaptada.
- **Por página:** `docs/agentes.md`, `docs/fluxos.md`, `docs/glossario.md`, `docs/aia/adaptacao.md`, `docs/aia/correcao-de-objetiva.md`, `docs/aia/sinais-e-alertas.md` e o passo 5 da adaptação no roteiro (linha 180) descrevem a tela como ela é, sem mudar o que dizem sobre a regra.
- **Nenhuma cláusula nova:** não haver seção "Mutações" está correto.

**Bloqueantes:**

1. **`docs/roteiro-da-demonstracao.md:228`: o roteiro manda clicar num botão que não aparece nesta cena.**
   - O texto diz que o nome da Ana e o uso do dia saem de "Ver quem". Mas "Ver quem" só aparece dentro do aviso de atenção humana: `TurmaHoje.tsx:110-123`, só com `alunosQuePrecisam > 0`.
   - Na cena (passo 3, a aluna pediu a resposta pronta) não há atenção humana. O botão que abre o painel é **"Ver o uso do Tutor por aluno"** (`TurmaHoje.tsx:133-135`), e é o mesmo que o e2e usa (`e2e/__fixtures__/professor/tutor.ts:21-23`).
   - É o mesmo defeito que a correção veio fechar: um caminho que não existe, no roteiro que o Joaquim lê ao vivo.
   - **Correção exigida:** trocar "em **Ver quem**" por "em **Ver o uso do Tutor por aluno**". O mesmo erro está na descrição da correção, em `tasks/correcoes/2026-10-19-docs-sem-seu-time.md:28` ("saem de 'Ver quem'"), que também precisa mudar.

2. **`docs/roteiro-da-demonstracao.md:227-228`: a frase citada não é a que a tela mostra em "Sinais da turma".**
   - O roteiro diz que aparece "Pediu a resposta pronta na questão 1 de “Atividade — Reagente limitante”", sem nome.
   - A tela mostra a soma, que vem de `falaDoGrupo` (`apps/web/src/areas/professor/sinais.ts:44-48`): "1 aluno pediu a resposta pronta na questão 1 de “Atividade — Reagente limitante”."
   - "Pediu a resposta pronta…" é o texto do sinal de um aluno (`textoDoSinal`, mesmo arquivo, linha 52), e só aparece no painel, ao lado do nome.
   - **Correção exigida:** escrever a frase da soma em "Sinais da turma" e dizer que "Pediu a resposta pronta…", com o nome da Ana e as trocas de hoje, aparece no painel aberto por "Ver o uso do Tutor por aluno".

**Recomendações (não bloqueiam):**
- **Glossário, "Feed de agentes":** o texto diz que nas duas telas "cada agente é uma thread", mas "O que o Tutor viu" não é tela própria, só leva à aba Hoje ou a Turmas. Vale dizer isso, como o roteiro já faz.
- **Roteiro, passo do Tutor:** registrar que "abre a aba Hoje" vale porque a professora da demonstração tem uma turma só; com mais de uma, o link cai em Turmas.
- **`docs/agentes.md`, `docs/fluxos.md` e `docs/aia/sinais-e-alertas.md`:** "O que o Tutor viu" e "a aba Hoje" aparecem como dois lugares, quando o primeiro é um painel dentro do segundo. Escrever "o painel 'O que o Tutor viu', dentro da aba Hoje" evita a leitura de duas telas.

## conformidade-reviewer · 1ª rodada · REPROVADO · 2026-10-19 19:07:20 · `tasks/correcoes/2026-10-19-docs-sem-seu-time.md`

**VEREDITO: REPROVADO**

**Caminhos de escrita em Nota:** nenhum. A correção só mexe em documentação, sem código, migration nem job. Sim, todos com autor humano.
**Decisão autônoma sobre aluno:** ausente. O diff não muda nada sobre trajetória, e a AIA de sinais continua dizendo que o sinal não tem consequência automática (N6).
**Aprovação registrada:** ok. O passo 5 do Passo 2 do roteiro, em `docs/roteiro-da-demonstracao.md:180`, bate com o código. O pé do sino tem "O que o Assistente fez" (`apps/web/src/areas/professor/SinoDoProfessor.tsx:14-17`). Essa tela tem **Aprovar**, abre uma confirmação e tem **Rejeitar…**, que pede justificativa (`apps/web/src/areas/professor/Time.tsx:343-410`). A correção de objetiva entra no sino como pendência (`apps/web/src/areas/professor/fila-do-professor.ts:101-104`), como a AIA de correção diz em `docs/aia/correcao-de-objetiva.md:72`.
**Supervisão do tutor:** ok no que o texto afirma sobre a regra. A aba Hoje mostra só a soma, sem nome e sem conversa. O nome só aparece por ação explícita, no painel "O que o Tutor viu" (`apps/web/src/areas/professor/TurmaHoje.tsx:44-62, 289-310`). O link "O que o Tutor viu" do sino leva à aba Hoje quando a professora tem uma turma confirmada, e a Turmas quando tem mais de uma (`apps/web/src/areas/professor/Tutor.tsx:12-35`). O problema está no roteiro, que manda a pessoa a um botão que não aparece no cenário (bloqueante abaixo).
**Autonomia declarada e visível:** sim. Nada mudou aí, e a seção "O que o Tutor faz sozinho" continua na aba Hoje (`apps/web/src/areas/professor/TurmaHoje.tsx:175-223`).

**Bloqueantes:**

1. **`docs/roteiro-da-demonstracao.md:227-228`: o roteiro cita um botão que não aparece na demonstração.** Ele diz "em **Ver quem**, o nome da Ana e o uso do dia". No código, "Ver quem" só existe dentro do aviso de atenção humana: `TurmaHoje.tsx:110-124` só o desenha quando `alunosQuePrecisam > 0`. No Passo 5 a Ana só pede a resposta pronta e pergunta se o Tutor é pessoa, e nada disso gera sinal `atencao_humana`. Então o botão não aparece, e quem apresenta fica procurando um caminho que não existe ao vivo. Era esse o defeito que a correção queria resolver. O botão que abre o painel nesse cenário é **"Ver o uso do Tutor por aluno"** (`TurmaHoje.tsx:133-135`).
   A mesma linha também cita errado o texto da tela. Em "Sinais da turma" aparece a soma, montada por `falaDoGrupo` (`apps/web/src/areas/professor/sinais.ts:44-49`): "1 aluno pediu a resposta pronta na questão 1 de “Atividade — Reagente limitante”.". A frase "Pediu a resposta pronta na questão 1…" é a do painel, por aluno (`sinais.ts:52-55`).
   **Correção exigida:**
   - Em "Sinais da turma", citar "1 aluno pediu a resposta pronta na questão 1 de “Atividade — Reagente limitante”.", sem nome.
   - Trocar "Ver quem" por **Ver o uso do Tutor por aluno**, que abre o painel "O que o Tutor viu". No painel, o nome da Ana aparece em "Sinais por aluno" e as trocas de hoje em "Uso do Tutor pela turma".
   - "Ver quem" só pode aparecer no roteiro num passo que de fato gere atenção humana.

   A frase do "Diga" (supervisão, não vigilância: sem conversa, sem tempo de tela, sem emoção) continua certa e pode ficar.

**Recomendações:**
- `docs/glossario.md:203-204` ("Feed de agentes"): "O que o Tutor viu" não abre uma tela própria. Ele leva à aba Hoje (com uma turma) ou a Turmas (com várias), conforme `Tutor.tsx:12-35`. O glossário poderia dizer isso, e "onde cada agente é uma thread" vale só para "O que o Assistente fez".
- `docs/agentes.md:80` e `docs/fluxos.md:152`: "na thread dele, em 'O que o Tutor viu'" troca as duas coisas. O que fala na voz do Tutor, em balão, é a soma da aba Hoje (`TurmaHoje.tsx:162-171`). O painel "O que o Tutor viu" é uma tabela por aluno. A afirmação da D34 (aluno nomeado só ao professor da turma) continua certa.
- `docs/aia/sinais-e-alertas.md:369`: o mesmo ponto, "na voz do Tutor" deveria ficar junto da aba Hoje. Na `:387`, a aba Hoje relê os sinais a cada 15 s, mas o uso por aluno no painel é lido uma vez, ao abrir (`apps/web/src/api/tutor-da-turma.ts:26-31`). "Consultam o servidor de tempos em tempos" vale só para os sinais.
- A busca do documento da correção confere: nenhum "Seu time" sobra nos sete arquivos.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 19:12:40 · `tasks/correcoes/2026-10-19-docs-sem-seu-time.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum

As duas correções da 1ª rodada foram feitas. Conferi as afirmações novas contra o código em `apps/web/src`.

- **Correção 1, `docs/roteiro-da-demonstracao.md:227-230`.** O passo 5 está como foi pedido, e o código confirma cada parte:
  - **"Sinais da turma" sem nome.** A soma vem de `falaDoGrupo` (`sinais.ts:44-49`) e dá "1 aluno pediu a resposta pronta na questão 1 de "…"."
  - **O botão.** **Ver o uso do Tutor por aluno** existe em `TurmaHoje.tsx:133-135`. "Ver quem" só aparece no aviso de atenção humana (`TurmaHoje.tsx:110-122`).
  - **O painel "O que o Tutor viu".** A Ana aparece em "Sinais por aluno", pelo `textoDoSinal` (`TurmaHoje.tsx:338-339`). As trocas de hoje ficam em "Uso do Tutor pela turma" (`TurmaHoje.tsx:372`).
  - **A nota de uma turma só.** Uma turma confirmada abre a aba Hoje dela. Com mais de uma, ou sem nenhuma, a professora cai em Turmas (`Tutor.tsx:29-34`).
- **Correção 2, documento da correção.** As linhas 26 e 28 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/correcoes/2026-10-19-docs-sem-seu-time.md` agora dão o botão certo e dizem por que "Ver quem" não entra nessa cena.
- **Recomendações aplicadas, todas batem com o código:**
  - **Glossário, "Feed de agentes".** Diz que só "O que o Assistente fez" é thread e que o Tutor fala na aba Hoje.
  - **`agentes.md:56`, `:67` e `:80` e `fluxos.md:152`.** Não falam mais em "thread" do Tutor.
  - **`sinais-e-alertas.md:387`.** Os sinais são relidos a cada 15 s (`TurmaHoje.tsx:39,67`). O uso por aluno não tem `refetchInterval` (`api/tutor-da-turma.ts:26-32`).
- **Busca final.** Não sobra nenhum "Seu time" nos sete documentos.

Recomendações:
- **Aspas no roteiro.** O roteiro cita o título entre aspas curvas (`“Atividade — Reagente limitante”`), mas o código monta o texto com aspas retas (`sinais.ts:27-28`). Quem lê ao vivo vê aspas retas na tela. Vale copiar o texto exato.
- **"Lido uma vez, ao abrir" (`sinais-e-alertas.md:387`).** É uma simplificação. A consulta do uso usa o padrão do TanStack Query e também relê quando a janela volta ao foco. Pode ficar "sem releitura periódica".

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-19 19:12:55 · `tasks/correcoes/2026-10-19-docs-sem-seu-time.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A correção só mexe em `docs/` e não muda código, então nenhum caminho de gravação de nota foi tocado. Todos com autor humano? sim, porque nada aqui altera isso.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. O roteiro, no item 180, mantém "Aprovada por Helena Demo · dd/mm, hhhmm" na versão adaptada. A exceção da D47 continua só no Tutor.
Supervisão do tutor: ok. O que os docs descrevem bate com o código, e nenhum uso fica invisível à professora. O painel diz "Não há uso do Tutor que você não veja." (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.tsx:349`).
Autonomia declarada e visível: sim. Esta rodada não alterou nada nisso.

**A correção exigida na 1ª rodada foi feita** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/docs/roteiro-da-demonstracao.md:227-230`). Conferi contra o código:
- O pé do sino "O que o Tutor viu" aponta para `/time/tutor`. Com uma turma confirmada, ele leva à aba Hoje; com mais de uma, ou nenhuma, leva a Turmas (`apps/web/src/areas/professor/Tutor.tsx:29-34`). Na demonstração, a Helena tem só o 2ºA (`docs/roteiro-da-demonstracao.md:60` e `:132`), então o "tem uma turma só" do roteiro está certo.
- "1 aluno pediu a resposta pronta na questão 1 de …." é exatamente o texto que `falaDoGrupo` monta (`apps/web/src/areas/professor/sinais.ts:44-49`), sem nome, como o roteiro diz.
- "Ver o uso do Tutor por aluno" é o botão certo (`TurmaHoje.tsx:133-135`). O roteiro não cita mais "Ver quem", que só aparece quando algum aluno precisa de atenção humana (`TurmaHoje.tsx:110-121`).
- No painel "O que o Tutor viu", aparecem a frase "Pediu a resposta pronta na questão 1 de …", que vem de `NOME_DO_SINAL` (`packages/shared/src/tutor/sinal.ts:20`) e de `textoDoSinal` (`sinais.ts:52-55`), e a coluna "Trocas hoje" (`TurmaHoje.tsx:372`). Os dois conferem com o roteiro.

**As recomendações da rodada anterior também foram aplicadas**, e conferem com o código:
- `docs/glossario.md`, "Feed de agentes": só o Assistente aparece como thread, e o Tutor fala na aba Hoje e no painel por aluno.
- `docs/agentes.md:56`, `:67`, `:80` e `docs/fluxos.md:152`: a voz do Tutor aparece como soma na aba Hoje, e o painel aparece como "por aluno".
- `docs/aia/sinais-e-alertas.md`: as formas de conferir N1, N5 e N11 apontam para a aba Hoje e o painel. A frase do tempo real separa os sinais, relidos a cada 15 s (`TurmaHoje.tsx:39` e `:67`), do uso por aluno, lido ao abrir o painel (`apps/web/src/api/tutor-da-turma.ts:26-31`).

Nenhuma frase nova enfraquece os itens 4, 7 ou 8 da regra 70. O texto continua dizendo "sem conversa, sem tempo de tela, sem emoção", e o nome do aluno só aparece por ação explícita da professora (D34).

Bloqueantes: nenhum

Recomendações:
- `docs/roteiro-da-demonstracao.md:229`: o roteiro escreve o título entre aspas curvas (“Atividade — Reagente limitante”), mas a tela usa aspas retas (`"${titulo}"`, `sinais.ts:28`). A diferença é pequena, mas o roteiro é lido ao vivo, então vale usar as aspas da tela ou não usar aspas.
- `docs/aia/sinais-e-alertas.md:379`: "lido uma vez, ao abrir" não é exato. O cliente usa o `staleTime` de 30 s e deixa o `refetchOnWindowFocus` padrão (`apps/web/src/api/cliente-de-consultas.ts:22-26`). Assim, o uso também é relido quando a janela volta ao foco depois de 30 s. Basta escrever "lido ao abrir o painel, sem releitura periódica".

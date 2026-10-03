# Tarefa 17.0 — Web: página pública da turma e o e2e do fluxo inteiro (W1)

**Funcionalidade:** apresentacao-escola · **Depende de:** 16.0, 12.0, 6.0 · **Paralelo com:** nenhuma
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O aluno abre `/e/<slug>/turma` pelo link ou digita o código, escolhe o nome, informa a matrícula e cria a senha, num
envio só que sobrevive ao sistema cheio; e o fluxo inteiro, da escola vazia ao aluno aprovado, roda de ponta a ponta.

## Contexto necessário

- `docs/interface.md` 11.1 (casca pública) e a regra 50 inteira; `docs/lgpd.md`, lista de nomes
- `techspec.md` seções 4 (`salas/*`), 5 (passo 3), 9 ("Página pública", "Textos") e 7c (`Retry-After`)
- `cenarios.md`: W1, W8, W9, W11, W4 (linha "Pública"), W12
- Regras 20 (itens 4, 8), 80 (itens 1, 6)
- Código:
  - `apps/web/src/paginas/EntrarNaEscola.tsx` (`/e/:slug`) e `CascaPublica.tsx`
  - `apps/web/src/paginas/Convite.tsx` — o token tirado do fragmento antes da primeira chamada
  - A normalização do código (4.0), `REIVINDICACAO_RECUSADA` (6.0) e `packages/shared/src/erros/mensagens.ts`
  - `.size-limit.json`: a página fica na entrada, abaixo de 150 kB

## Nota da 7.0 (`privacy-guardian`, 1ª rodada)

- O texto de ajuda do `LIMITE_EXCEDIDO` pelo nome diz que o professor pode gerar um código novo, que destrava o nome: quem
  tem o link trava um nome por 10 min com cinco matrículas erradas.

## Nota da 8.0 (`conformidade-reviewer`, 1ª rodada)

- O aluno recusado vê que a decisão foi de uma pessoa (o professor ou a coordenação) e que pode reivindicar o nome de novo,
  para a recusa não parecer automática.

## Subtarefas

- [x] 17.1 — `MENSAGENS_DA_SALA` em `packages/shared`, com os textos exatos do W9; o de `NAO_ENCONTRADO` escolhido
  pelo caminho que a página usou; o N do limite arredondado para cima, mínimo 1, com singular
- [x] 17.2 — Rota `/e/<slug>/turma`: o fragmento sai do endereço antes da primeira requisição; sem token, o campo
  do código (`autocapitalize="characters"`); vencido pelo link, o texto do link e o campo do código com o foco
- [x] 17.3 — Nomes livres, escolha, matrícula (`inputmode="text"`, `autocomplete="off"`) e senha ("mostrar", 12
  caracteres avisados). Nomes e `chaveEnvio` só em memória; um envio no ar; o botão em carregamento também na
  espera de 1 s; o 503 reenvia a mesma chave até 3 vezes, pelo `Retry-After` com variação aleatória, e depois
  "Tentar de novo"; a recusa recarrega os nomes; `role="status"` e `role="alert"` com `aria-describedby`
- [x] 17.4 — Depois do pedido, a tela avisa que "matrícula ou senha incorretas" antes da aprovação é espera
- [x] 17.5 — W1: o fluxo inteiro; a entrada continua abaixo de 150 kB no `.size-limit.json`
- [x] 17.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/sala/mensagens-da-sala.ts` (e teste) | novo |
| `apps/web/src/paginas/TurmaPublica.tsx`, `reenvio-da-sala.ts` (e teste) | novo |
| `apps/web/src/api/salas.ts`, `caminhos.ts`, `rotas.tsx` | novo, alterado |
| `e2e/turma-publica.spec.ts`, `e2e/escola-montada.spec.ts` | novo |
| `.size-limit.json` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W1 | e2e | coordenação, professor e aluno, com nomes gerados, até o aluno ver só a própria turma, nos dois projetos |
| W8 | e2e | sem `#` na primeira requisição; nada em `localStorage`, `sessionStorage`, IndexedDB, Cache Storage nem no endereço; clique duplo; o reenvio pelo relógio falso; os textos pelo caminho; o 429 pelo nome e pelo `rl:ip`; os `role` |
| W9 | unidade | cada texto exato; 60 s dá 1 minuto e 61 s dá 2; nenhum com código de erro nem "computador" |
| W11 | e2e | os atributos de cada campo |
| W4, W12 (pública) | e2e | vazio com "chame o professor"; vencido com o texto do caminho; 360 px sem rolagem; tudo só com teclado |
| recomeço da tela | e2e | segunda pessoa: depois do envio, outro aluno no mesmo computador não vê nome, matrícula nem senha do anterior; mesmo link colado de novo na aba abre a turma sem ficar preso com o token na barra; resposta atrasada: o `salas/abrir` de um código anterior que chega depois não troca a turma; falha: a recusa recarrega os nomes, e o aviso, o foco e a senha da tentativa anterior saem |
| log novo | — | a tarefa não escreve log |
| código fora do formato e em branco (divergência) | e2e | `ABCD 0000` e o campo vazio dizem o texto e não chamam `salas/abrir`; o código vai normalizado (`WXYZ2345`); o clique duplo em "Abrir a turma" manda uma abertura só |
| abertura que cai (divergência) | e2e | pelo código, o 429 diz os minutos e o 503 diz "O sistema está cheio agora.", com o código no campo; pelo link, o 503 tem "Tentar de novo", com o token da memória e a barra limpa |
| nome não escolhido (divergência) | e2e | o envio sem nome diz "Escolha o seu nome na lista.", com o foco no primeiro nome e o texto no `aria-describedby` do grupo, sem chamada |
| chave nova depois de mexer (divergência) | e2e | depois do quarto 503, trocar a senha volta o botão a "Enviar pedido", e o envio leva chave nova |
| acesso que cai entre abrir e enviar (divergência) | e2e | o `NAO_ENCONTRADO` do envio leva ao campo do código, com o texto do caminho e o foco |
| a releitura que cai depois da recusa (divergência) | e2e | a lista, o nome escolhido e a matrícula ficam |
| o envio no ar quando a tela muda (divergência) | e2e | "Usar outro código" e o link colado pela metade com o envio no ar: a resposta que chega depois não põe aviso no campo do código |
| a página que sai nos reenvios (divergência) | e2e | com o relógio falso, sair da página com o reenvio esperando: nenhum envio sai depois |
| link colado pela metade (divergência) | e2e | `#%E0%A4%A` leva ao campo do código, com o foco, sem chamada e com a barra limpa |
| "Mostrar" no aceite do convite (herdado da 14.0) | e2e | `e2e/convite.spec.ts`, W14: o "Mostrar a senha" troca o campo para texto e volta, com `aria-pressed` |

## Critério de conclusão

- [x] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [ ] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral` e os guardiões, com
  rodada que vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Herdado da 14.0

- **A senha nova do aceite do convite sem "mostrar"** (`frontend-reviewer`, 1ª rodada da 14.0): em
  `apps/web/src/paginas/Convite.tsx`, o professor digita 12 caracteres uma vez, às cegas, e o erro de digitação só se
  resolve com outro convite. O campo de senha com "mostrar" que esta tarefa faz para a página pública (W11) fica em
  `componentes/`, e a tela do convite passa a usá-lo.

## Fora do escopo desta tarefa

Contador por navegador (7c); contagem de quem entrou (D59); reset de senha (F2).

## Plano e autoconferência

- **Arquivos**: `packages/shared/src/sala/mensagens-da-sala.ts` (e teste); `apps/web/src/api/salas.ts`;
  `apps/web/src/paginas/TurmaPublica.tsx`, `reenvio-da-sala.ts` (e teste) e `fragmento.ts` (o token do fragmento, que saiu
  de `Convite.tsx` para as duas telas usarem); `apps/web/src/componentes/CampoDeSenha.tsx` (novo) e `Campo.tsx` (o
  `descritoTambemPor` e a `acao`); `caminhos.ts` e `rotas.tsx`; `e2e/turma-publica.spec.ts`, `e2e/escola-montada.spec.ts` e
  as peças novas de `e2e/__fixtures__/sessao.ts` (`gerarAcessoDaSalaNoBanco`, com o hash e o HMAC pelas peças da API,
  `pedidosPendentesDaTurma`, `tomarNomeNoBanco`); `convite.spec.ts` (o "Mostrar"); `.size-limit.json`.
- **O que já existia e foi reaproveitado**: `normalizarCodigoDaTurma` e `codigoDaTurmaValido` (4.0), o `chamarApi` com o
  `esperaSegundos`, o `Campo`, o `MENSAGENS_DE_ERRO.REIVINDICACAO_RECUSADA` (6.0), o `tokenDoFragmento` do convite (movido),
  `sortearTokenDaSala`, `sortearCodigoDaTurma` e `hmacDoCodigoDaTurma` da API na semente do e2e.
- **O segundo dado que torna cada cláusula observável**: duas turmas com acesso na resposta atrasada; um nome tomado no
  banco com a página aberta, para a recusa provar a releitura; dois computadores com sorteios diferentes (0,5 e 0,9) no
  503; uma releitura que cai, para provar que a lista fica; o mesmo `NAO_ENCONTRADO` interceptado nos dois caminhos.
- **Checagem anterior que responderia antes**: o código fora do formato não chega à API (a página segura), e por isso o
  `NAO_ENCONTRADO` do código é provado com um código de formato válido (`wxyz-2345`); a 6ª tentativa no nome usa a matrícula
  certa, para o 429 não ser confundido com a recusa.
- **Carga e infra** (`infra-guardian`): a página não grava nada sozinha; cada envio é um `salas/reivindicar`, e o 503 se
  repete no máximo três vezes, nunca antes do `Retry-After`, com até 1 s de variação por computador, e depois só com o
  clique. O código fora do formato não gasta o `rl:ip` nem a contagem da escola. O K1 e o K2 (9.0) já repetem o 503 como a
  página, sem a variação (o pior caso, todos juntos), e não mudam.
- **Dado pessoal** (`privacy-guardian`): nomes, matrícula, senha, token e `chaveEnvio` só no estado da página, fora do
  TanStack Query e de todo armazenamento, provados no e2e; o cookie de renovação é preso a `/v1/sessao` e não vai às rotas
  da sala; a tela depois do pedido não mostra o nome nem a matrícula; a tarefa não escreve log.

## Divergências resolvidas nesta tarefa

Registradas também na `techspec.md` (seção 9, "Decidido na 17.0") e no `cenarios.md` (W8, W9, W11 e W4 da página pública).

- **A página não usa o TanStack Query** (regra 50, item 3): as duas chamadas são anônimas, o token iria para a chave ou o
  fecho de uma consulta guardada, e não há sessão cuja troca esvazie o cache. O estado é da página, com uma vez por
  abertura que descarta a resposta atrasada, como o aceite do convite (14.0).
- **Regra nova: o código fora do formato não sai da página.** O em branco diz "Digite o código da turma que o professor
  mostrou."; o que não tem 8 caracteres do alfabeto diz o texto do código do W9, igual ao que a API responderia. Quem chama:
  o aluno, no clique; não grava nada e poupa o `rl:ip` e a contagem da escola. Uma abertura por vez pelo código.
- **A abertura que cai** (fora do `NAO_ENCONTRADO`): pelo código, o texto fica no campo do código (o 429 com os minutos do
  `Retry-After`, o 503 com "O sistema está cheio agora."), e o botão "Abrir a turma" é a nova tentativa; pelo link, a tela
  mostra o texto com "Tentar de novo", com o token da memória. A abertura não se repete sozinha: o reenvio do 503 é só do
  pedido do nome (Tech Spec, seção 9).
- **O limite sem `Retry-After`** diz "Muitas tentativas agora. Espere alguns minutos ou chame o professor.": a página não
  inventa número.
- **A recusa**: a matrícula fica (é ela que o texto pede para conferir, e o foco vai para ela), a senha sai, a lista é
  relida, e o nome escolhido continua escolhido se continuar livre. A releitura que cai deixa a lista de antes.
- **A chave de envio** é sorteada a cada envio e reaproveitada só no "Tentar de novo" do mesmo pedido depois do quarto 503;
  mexer num campo volta o botão a "Enviar pedido" e faz o envio seguinte ser um pedido novo.
- **O acesso que cai entre abrir e enviar** (`NAO_ENCONTRADO` no envio) leva ao campo do código, com o texto do caminho.
- **Botões a mais**: "Não é a sua turma? Usar outro código", na turma aberta (o código válido de outra turma, ou o link
  errado); e, depois do pedido, "Ir para a entrada da escola" e "Voltar à lista de nomes" (o aluno seguinte no mesmo
  computador). A tela do pedido não mostra o nome nem a matrícula, e diz quem decide e que a recusa devolve o nome (nota
  da 8.0).
- **O nome não escolhido** diz "Escolha o seu nome na lista.", com o foco no primeiro nome, que o leitor de tela lê com o aviso do grupo (recomendação do `frontend-reviewer`, 1ª rodada); matrícula e senha usam a
  conferência do navegador (`required`, `minLength`).
- **A matrícula vai como foi digitada**: o contrato (`esquemaMatriculaDigitada`) tira o espaço das pontas.
- **A senha nova com `autocomplete="off"`**, como o W11 pede, e não `new-password`: o computador é da escola.
- **O foco**: a página abre sem puxar o foco para o campo do código; ele vai ao campo quando a tela leva o aluno até lá (o
  código que não achou, o link que não vale, "Usar outro código"), ao título da turma quando ela abre, à matrícula na
  recusa e ao título do pedido enviado.
- **A espera do reenvio** sem `Retry-After` (a queda de rede) é de 2 s, como o K1; a variação vai de 0 a 1 s.
- **Peças**: o `CampoDeSenha` (com o "Mostrar", `aria-pressed`) em `componentes/`, que o aceite do convite passou a usar
  (herdado da 14.0); o `Campo` ganhou `descritoTambemPor` (o aviso e o status do envio no `aria-describedby`) e `acao`; o
  token do fragmento saiu de `Convite.tsx` para `paginas/fragmento.ts`.
- **Nota da 7.0**: o texto do limite não promete que um código novo destrava (falso no `rl:ip`, W9); "chame o professor"
  leva a quem gera o código novo.
- **Tamanho**: a página fica na entrada; o primeiro carregamento mede ~133,7 kB de 150.

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `TurmaPublica.tsx:123` (o `apagarFragmentoDaBarra()` antes da primeira abertura) | W8 pelo link (a barra com `#` na primeira chamada) |
| `TurmaPublica.tsx:94` (a vez na resposta que abre) | resposta atrasada (2ª rodada, o código que acha) |
| `TurmaPublica.tsx:97` (a vez na resposta que falha) | resposta atrasada (1ª rodada, o `NAO_ENCONTRADO`) |
| `TurmaPublica.tsx:100` (o texto pelo caminho (`caminho.tipo`)) | pelo código (o texto do link) |
| `TurmaPublica.tsx:102` (a releitura que cai deixa a lista) | a recusa (a releitura com 503) |
| `TurmaPublica.tsx:103` (o `esgotado` da abertura pelo código) | o limite pelo rl:ip (o 503 da abertura pelo código) |
| `TurmaPublica.tsx:104` (a falha do link com "Tentar de novo") | o limite pelo rl:ip (o 503 do link) |
| `TurmaPublica.tsx:114` (a recarga sem trocar a etapa) | a recusa (a matrícula fica) |
| `TurmaPublica.tsx:135` (o código digitado sai com o link colado) | pelo código (o campo limpo) |
| `TurmaPublica.tsx:140` (a vez no link colado pela metade) | o envio no ar (2ª parte) |
| `TurmaPublica.tsx:143` (o ouvinte do `hashchange`) | mesma entrada |
| `TurmaPublica.tsx:154` (uma abertura por vez pelo código) | pelo código (o clique duplo) |
| `TurmaPublica.tsx:156` (o código em branco) | pelo código |
| `TurmaPublica.tsx:160` (o código fora do formato) | pelo código (nenhuma chamada) |
| `TurmaPublica.tsx:155` (a normalização do código) | pelo código (`WXYZ2345`) |
| `TurmaPublica.tsx:172` (a vez no "Usar outro código") | o envio no ar |
| `TurmaPublica.tsx:230` (o foco no título da turma) | W8 pelo link |
| `TurmaPublica.tsx:260` (o foco no campo só quando pedido (`focar > 0`, e trocado por nunca)) | pelo código (o foco ao abrir e depois do aviso) |
| `TurmaPublica.tsx:353` (a trava do envio no ar) | clique duplo em enviar |
| `TurmaPublica.tsx:355` e `:356` (o nome não escolhido; o foco no primeiro nome) | W8 pelo link ("Escolha o seu nome na lista.") |
| `TurmaPublica.tsx:379` (o pedido sem resposta guardado no quarto 503) | o 503 reenvia ("Tentar de novo" com a mesma chave) |
| `TurmaPublica.tsx:391` (o `NAO_ENCONTRADO` do envio leva ao código) | mexer num campo (o acesso que cai) |
| `TurmaPublica.tsx:398` (a senha sai na recusa) | a recusa |
| `TurmaPublica.tsx:399` (a recusa relê os nomes) | a recusa |
| `TurmaPublica.tsx:400` (o foco na matrícula na recusa) | a recusa |
| `TurmaPublica.tsx:348` (mexer num campo tira o "Tentar de novo") | mexer num campo |
| `TurmaPublica.tsx:372` (a vez do envio (`valendo`)) | o envio no ar |
| `TurmaPublica.tsx:371` (o "Tentando de novo…" no 503) | o 503 reenvia |
| `TurmaPublica.tsx:126` (a página que sai descarta o que está no ar) | a página que sai nos reenvios |
| `TurmaPublica.tsx:408` (o `aria-describedby` do grupo dos nomes) | W8 pelo link |
| `TurmaPublica.tsx:475` (o "Tentando de novo…" à vista, e não só `sr-only`) | o 503 reenvia (a altura do status) |
| `TurmaPublica.tsx:478` (o botão desligado no envio) | clique duplo em enviar |
| `TurmaPublica.tsx:479` (o "Tentar de novo" depois do quarto 503) | o 503 reenvia |
| `TurmaPublica.tsx:286` (o botão desligado na abertura) | pelo código ("Abrindo…" desligado) |
| `TurmaPublica.tsx:200` (a recarga sem remontar o formulário (com `key` pelos nomes)) | a recusa |
| `Campo.tsx:35` (o `descritoTambemPor` no `aria-describedby`) | pelo código |
| `TurmaPublica.tsx:361` (o nome igual, apagado do pedido reaproveitado) | mexer num campo (trocar o nome) |
| `TurmaPublica.tsx:361` (a matrícula igual, apagada) | mexer num campo (trocar a matrícula) |
| `TurmaPublica.tsx:361` (a senha igual, apagada) | mexer num campo (trocar a senha) |
| `TurmaPublica.tsx:344` (o nome escolhido que saiu da lista continua escolhido) | a recusa (o nome escolhido tomado no banco) |
| `CampoDeSenha.tsx:19` (o "Mostrar" troca o tipo do campo) | W8 pelo link |
| `CampoDeSenha.tsx:21` (o `aria-pressed`) | W8 pelo link |
| `reenvio-da-sala.ts:66` (`valendo()` depois do envio que deu certo) | unidade: a tela que mudou com o envio no ar |
| `reenvio-da-sala.ts:68` (`valendo()` no erro) | unidade: idem |
| `reenvio-da-sala.ts:69` (só o 503 se repete) | unidade: a recusa e o limite não se repetem |
| `reenvio-da-sala.ts:70` (o teto de 3 reenvios (`>=` por `>`)) | unidade: o quarto 503 para |
| `reenvio-da-sala.ts:71` (o aviso "Tentando de novo") | unidade: três avisos |
| `reenvio-da-sala.ts:73` (`valendo()` depois da espera) | unidade: a tela que mudou durante a espera |
| `reenvio-da-sala.ts:30` (o `esperaSegundos >= 0`) | unidade: sem Retry-After |
| `reenvio-da-sala.ts:31` (a variação sorteada) | unidade: dois computadores |
| `mensagens-da-sala.ts` (o texto pelo caminho; o mínimo de 1 minuto; o `ceil`; o singular; o `isFinite`; o `esgotado`) | unidade W9 (cada um vermelho) |

Rodadas pelo `e2e/turma-publica.spec.ts` no projeto `chromebook` (com a web reconstruída a cada mutação) e pela unidade. Todas
ficaram vermelhas. O que sobreviveu na primeira passada e virou teste ou saiu do código:

- a vez na resposta que abre sobreviveu porque o teste olhava a tela antes de a página tratar a resposta: agora ele espera a
  resposta chegar e dá 1 s para a página antes de afirmar que nada mudou (o mesmo no envio no ar);
- o `isFinite` da espera do reenvio e o `case` da recusa em `mensagemDaSala` eram redundantes (o `>= 0` já recusa o `NaN`;
  o catálogo geral já tem o texto do W9) e saíram; o `definirFaltaONome(false)` na escolha do nome também (o aviso já
  depende de não haver nome escolhido); o `trim` da matrícula também (o contrato já tira o espaço das pontas), e a
  limitação do sorteio a [0, 1) também (o `Math.random` já é assim).

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `frontend-reviewer`, 1ª | "O sistema está cheio agora." sem dizer o que fazer | `/validar`: o texto é o do W9, fixado na spec |
| `frontend-reviewer`, 1ª | o "Mostrar" com texto visível "Esconder" quando a senha está à vista | recusada: o interruptor (`aria-pressed`) pede nome fixo, e o texto visível diferente do nome acessível quebraria o rótulo no nome (WCAG 2.5.3); o estado aparece no próprio campo |
| `frontend-reviewer`, 1ª | a entrada com ~16 kB de folga depois da página pública | `/retro`, antes de a próxima tela pública vir para a entrada |
| `frontend-reviewer`, 1ª; `test-engineer`, 1ª | dois nomes iguais (E24) iguais na tela | `/validar` (já registrada) |
| `infra-guardian`, 1ª | o "Tentar de novo" da abertura pelo link sem variação aleatória | `/validar`, se a abertura um dia se repetir sozinha; hoje é o clique do aluno |
| `revisor-geral`, 1ª | `LoginPorCima.tsx:65` monta `/e/<slug>` à mão, sem `encodeURIComponent`, agora que existe `caminhoDaEscola` | correção própria (`/corrigir`): é código de antes desta tarefa, fora do escopo dela |
| `revisor-geral`, 1ª | `tomarNomeNoBanco` sem a linha em `reivindicacao` | aplicada em parte (pelo id, recomendação do `infra-guardian`); o pedido junto só se outro teste a reaproveitar, para a releitura da lista basta o estado |
| `test-engineer`, 5ª | `idDe` no e2e com `?? ''` | recusada: o valor só entra na comparação com o `listaNomeId` do corpo, que é um UUID; vazio deixa o teste vermelho, e não verde |
| `privacy-guardian`, 1ª | "Voltar à lista de nomes" reabre com o token ou o código da memória | registrado como intencional na `techspec.md` (17.0): o acesso é da turma inteira, e é o caminho do aluno seguinte no mesmo computador |
| spec, rodadas 1 a 5 | Como o aluno escolhe entre dois nomes iguais (E24): a 11.1 não decide, e a página mostra os dois iguais | `/validar` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-02 22:36:28 | 2026-10-02 22:37:54 | `test-engineer` | 1 | REPROVADO | a5b8f2ae9e783978b |
| 2026-10-02 23:33:52 | 2026-10-02 23:34:21 | `test-engineer` | 2 | APROVADO | a63b530f6ec055203 |
| 2026-10-02 23:34:41 | 2026-10-02 23:35:55 | `frontend-reviewer` | 1 | APROVADO | ad53fd225c7b459f5 |
| 2026-10-02 23:36:19 | 2026-10-02 23:36:51 | `infra-guardian` | 1 | APROVADO | a79d651edfecc45b5 |
| 2026-10-02 23:36:15 | 2026-10-02 23:36:52 | `privacy-guardian` | 1 | APROVADO | adb08043af0bbee8e |
| 2026-10-02 23:36:10 | 2026-10-02 23:37:07 | `revisor-geral` | 1 | APROVADO | ad3eeb7aa9678eb65 |
| 2026-10-03 00:28:27 | 2026-10-03 00:28:54 | `test-engineer` | 3 | APROVADO | ab8fdab179a15f5ee |
| 2026-10-03 00:29:30 | 2026-10-03 00:29:45 | `frontend-reviewer` | 2 | APROVADO | a50c0ac6e51d113ee |
| 2026-10-03 01:18:40 | 2026-10-03 01:18:54 | `test-engineer` | 4 | APROVADO | a44fd0afea61505c0 |
| 2026-10-03 01:19:12 | 2026-10-03 01:19:19 | `infra-guardian` | 2 | APROVADO | a97c28b249769b9fc |
| 2026-10-03 01:19:05 | 2026-10-03 01:19:19 | `revisor-geral` | 2 | APROVADO | abac4cbd03a280fdb |
| 2026-10-03 01:19:09 | 2026-10-03 01:19:28 | `privacy-guardian` | 2 | APROVADO | a8387a7ac62190bc3 |
| 2026-10-03 02:08:05 | 2026-10-03 02:08:15 | `test-engineer` | 5 | APROVADO | aea745cf372feb890 |
| 2026-10-03 02:08:32 | 2026-10-03 02:08:39 | `revisor-geral` | 3 | APROVADO | a3d2006c1a1d58ae2 |

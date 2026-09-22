# Achados das revisões — `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-21 16:28:14 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Auditoria concluída. Verifiquei por leitura, por execução dos scripts reais com `docker`/`npm` imitados (fora da árvore, em `/tmp`) e por mutação da função em cópia fora da árvore. Nenhum arquivo do repositório foi tocado.

```
VEREDITO: REPROVADO

Cenários exigidos (caminho de falha da esteira — não é domínio escolar, então a lista de borda
aplicável é a da regra 80/40 sobre esteira e evidência):
  C1 execução verde não despeja log (ruído)
  C2 execução vermelha despeja com carimbo uniforme e alcance suficiente
  C3 o despejo acontece ANTES do `down --volumes --remove-orphans`, senão não sobra evidência
  C4 `--manter-ambiente` com falha: despeja e não derruba
  C5 os dois scripts reais (`ci:e2e` e `ci:infra`/`ci:integracao`) emitem o despejo carimbado
  C6 todo passo de encerramento fala com o projeto compose de teste, nunca com o de desenvolvimento

Cobertos:
  C1 — tools/ci/compose.test.ts:24
  C2 — tools/ci/compose.test.ts:13 (no nível da função; falha de verdade se `--timestamps` sair ou
       o tail cair para 200 — conferido)
  C4 — parcialmente: tools/ci/compose.test.ts:28 (parâmetro) e tools/ci/scripts.test.ts:134 (script
       real, só a ausência do `down`)
  C6 — tools/ci/compose.test.ts:35 e tools/ci/scripts.test.ts:140

Bloqueantes:

1. tools/ci/compose.test.ts:8-11 — a ordem dos passos não é afirmada em lugar nenhum, e ela é a
   regra. `argumentosDe` filtra por nome e descarta a posição, então trocar a ordem em
   tools/ci/compose.ts:47-50 (derrubar antes de despejar) deixa os 4 casos verdes. Conferido por
   mutação em cópia fora da árvore: com `down --volumes --remove-orphans` antes do `logs`, o
   resultado é `4 passed`. Nesse mundo o despejo imprime nada — os contêineres já foram removidos —
   e a correção inteira vira letra morta sem nenhum vermelho. É justamente a hipótese que o
   documento refuta em suas linhas 32-33 ("o `down` roda depois do despejo"): afirmação de
   comportamento sem teste que a sustente.
   Correção exigida: afirmar a sequência, não só a presença. Ex.:
   `expect(etapasDeEncerramento(1).map((e) => e.nome)).toEqual(['logs dos serviços', 'derrubar o ambiente'])`
   e o par com `derrubar = false`.

2. tools/ci/e2e.ts:22 e tools/ci/compose.ts:63 — a linha que esta correção mudou não tem teste
   nenhum. `compose.test.ts` prova a função; nada prova que os scripts a usam. Reverter
   tools/ci/e2e.ts para o array embutido de antes (sem `--timestamps`, `--tail 200`) mantém a suíte
   inteira verde — e é exatamente a duplicação que existia até este diff, ou seja, a regressão é a
   mais provável de todas. O arreio para provar isso já existe e já roda os dois scripts reais com
   `docker` imitado: tools/ci/scripts.test.ts:24-56, cujos casos vermelhos (:85-94, :110-119,
   :134-138) afirmam a ordem de `up`/teste/`down` e nunca olham a chamada `logs` (grep por
   `logs|timestamps|tail` em scripts.test.ts não devolve nada).
   Correção exigida: nos casos vermelhos já existentes de `scripts.test.ts`, afirmar que aparece uma
   chamada `docker compose ... logs` com `--timestamps` e tail ≥ 2000, e que o índice dela é menor
   que o de ` down `. Cobre C3 e C5 nos dois scripts de uma vez. (Conferi na mão que hoje o
   comportamento está certo — `e2e.ts` e `infra.ts` emitem
   `docker compose … logs --no-color --timestamps --tail 2000` e só depois o `down`, inclusive com
   `--manter-ambiente`, que despeja e não derruba. O que falta é o teste que segura isso.)

Recomendações:
- Prova do que o carimbo serve, com a infraestrutura que já existe: um caso em
  tools/ci/compose.int.test.ts (projeto `integracao`, compose já de pé) que roda
  `logs --no-color --timestamps --tail N` em dois serviços e afirma que toda linha começa por
  carimbo RFC3339 e que as linhas dos dois serviços ordenam numa linha do tempo só. Hoje a asserção
  é de forma (a string está no argv); essa seria a do resultado (o despejo é cruzável), e de quebra
  prova que a combinação de flags é aceita pela versão de compose instalada — se não fosse, o passo
  sairia não-zero no pior momento e `executar.ts:36-39` engoliria o código em silêncio numa execução
  já vermelha.
- `--tail 2000` está defensável como direção, não como número: o argumento dos 16 min é raciocínio,
  não medição — a mesma espécie de raciocínio que produziu o 200. Uma linha de evidência no
  documento com linhas/min do serviço mais falante numa execução de infra (a borda não conta: 
  infra/test/borda.int.test.ts:554 prova que ela não loga acesso HTTP) fecharia o ponto. Registrar
  também o teto: 19 serviços × 2000 = até 38 mil linhas no log público do job.
- Mesmo sintoma, fora do escopo desta correção: infra/scripts/carga.ts:304 e
  infra/scripts/carga-login.ts:444 ainda despejam `logs --no-color --tail 100` sem `--timestamps`.
  O padrão certo já existia em tools/testes/compose.ts:78 — vale uma linha no TODO.
- Para o `infra-guardian`, não para mim: subir de 200 para 2000 linhas por contêiner multiplica por
  dez o que vai parar no log público do job. Só é aceitável porque o dado da esteira é sintético
  (regra 20, itens 12 e 17) e o lint guarda o log das APIs; vale dizer isso no documento, que hoje
  só trata da comparação com o artefato.
- O documento diz "como o quarto caso do teste afirma" (linha 86) sobre `--manter-ambiente`; é o
  terceiro caso (compose.test.ts:28), e ele afirma o parâmetro da função, não o script.
```

Sobre os três pontos que você pediu para julgar:

1. **Forma ou resultado?** A asserção sobre o argv é legítima — o argv é o único observável da função, e ela falha de verdade se `--timestamps` sair ou o tail voltar a 200 (o documento registra isso, e confirmei). Não é decoração. Mas ela para onde o risco real começa: as duas mutações que a atravessam verdes são a inversão de ordem e o desvio do call site. As duas têm conserto barato com arreio que já existe (`scripts.test.ts`), sem inventar infraestrutura nenhuma. A versão forte "de verdade" — carimbo RFC3339 em toda linha e duas fontes numa linha do tempo só — cabe em `compose.int.test.ts`, que já roda com o compose de pé.

[… 7 linhas cortadas]

## test-engineer · 2ª rodada · APROVADO · 2026-09-21 17:26:58 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Auditei por leitura e por mutação independente, em cópia em `/tmp` (removida ao fim). Nenhum arquivo da árvore foi tocado — `git status` no fim é idêntico ao do começo.

```
VEREDITO: APROVADO

Cenários exigidos (caminho de falha da esteira; a lista de borda aplicável é a da regra 80/40
sobre esteira e evidência, não a do domínio escolar):
  C1 execução verde não despeja log
  C2 execução vermelha despeja com carimbo uniforme e alcance medido
  C3 o despejo acontece ANTES do `down --volumes --remove-orphans`
  C4 `--manter-ambiente` com falha: despeja e não derruba
  C5 os três scripts reais (`ci:integracao`, `ci:infra`, `ci:e2e`) emitem o despejo carimbado
  C6 todo passo de encerramento fala com o projeto compose de teste

Cobertos:
  C1 — tools/ci/compose.test.ts:26 e tools/ci/scripts.test.ts:115,142
  C2 — tools/ci/compose.test.ts:13 (função) + tools/ci/scripts.test.ts:68-78 (scripts reais)
  C3 — tools/ci/compose.test.ts:30 (ordem do array) + tools/ci/scripts.test.ts:77 (ordem em
       execução real), e a ordem do array vale em runtime: tools/ci/executar.ts:36 roda a
       finalização em sequência — provei mutando ele, não só lendo (3 vermelhos)
  C4 — tools/ci/compose.test.ts:34,42 e tools/ci/scripts.test.ts:158-164
  C5 — tools/ci/scripts.test.ts:112,141,163, nos três scripts
  C6 — tools/ci/compose.test.ts:46 (função)

Bloqueantes: nenhum. Os dois da rodada 1 estão fechados, e fechados de verdade, não na forma:

  B1 (ordem) — tools/ci/compose.test.ts:30-37 afirma a sequência nos quatro mundos. Conferido:
     inverter em tools/ci/compose.ts:50-55 dá 4 vermelhos (não 1 — ver R2). E fui além do que
     você mutou: inverti a finalização em tools/ci/executar.ts:36, que é onde a ordem do array
     vira ordem de execução — 3 vermelhos em scripts.test.ts. A asserção de array não é
     decorativa; tem uma asserção de runtime atrás dela.
  B2 (call site) — `afirmarDespejoCarimbado` prende os scripts à função. Conferido nos dois call
     sites, não só no seu: desviar tools/ci/e2e.ts:22 dá 2 vermelhos, e desviar
     tools/ci/compose.ts:67 (`executarTestesComInfra`, que você não mutou) dá 2. Também mutei o
     default `derrubar = true` → `false` (4 vermelhos) e "some o despejo quando `--manter-ambiente`"
     (2 vermelhos).

Recomendações:
```

**R1 — as três mutações que sobreviveram, e as três morrem com uma mudança só.** Rodei sete mutações além das suas; três passaram com **19 verdes**:

- `ETAPA_DO_LOG_DA_FALHA` com `--tail` duplicado — `['logs','--no-color','--timestamps','--tail','4000','--tail','200']`. O Docker usa o **último**; os dois testes usam `indexOf`, que pega o primeiro. Efeito real: tail 200, suíte verde;
- despejo restrito a serviços — `[...,'--tail','4000','postgres','redis-fila']`. Somem os 12 serviços nossos, que são a justificativa inteira do 4.000, e nenhum teste percebe. É o edit plausível de quem for "otimizar" as 24,5 mil linhas;
- call site desviado **com as flags certas mas sem `--project-name educa-teste`**: o despejo passa a falar com o compose de desenvolvimento. `scripts.test.ts:166` só olha a execução **verde**, e o despejo só existe na vermelha — é a única chamada de compose que o guarda de projeto nunca vê.

Conserto único: afirmar o argv **inteiro**, não a presença. Em `compose.test.ts`, `expect(etapasDeEncerramento(1)[0]?.argumentos).toEqual([...ARGUMENTOS_COMPOSE, ...ETAPA_DO_LOG_DA_FALHA])`; e em `afirmarDespejoCarimbado` exigir que a linha comece por `docker compose --project-name educa-teste ...`. Não bloqueia porque a regra desta correção (carimbo, profundidade, ordem, call site) tem teste que a prova; o que falta é largura de asserção.

**R2 — a tabela não bate, e é achado.** `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md:127` diz que a ordem invertida dá **"❌ 1 caso, `compose.test.ts:31`"**. Medi: dá **4** — `compose.test.ts:30` mais os três casos de `scripts.test.ts` (`integracao.ts`, `infra.ts`, `ci:e2e`), porque `afirmarDespejoCarimbado` também checa o índice do ` down `. Parece medição feita no estado da rodada 1, antes do helper existir, misturada na mesma tabela com as outras. As outras quatro linhas batem exatamente (5, 5, 2, 19 verdes). Corrija o número e a citação (`:31` é `:30`) — a tabela é a evidência do documento, e ela está subestimando a própria proteção.

**R3 — o piso `>= 4_000` envelhece, mas para o lado certo.** Ele nunca fica falso-vermelho: só deixa de significar o que promete se os serviços ficarem mais falantes, e aí segue verde dizendo "alcança a execução inteira" sem alcançar. Não dá para consertar isso sem infraestrutura nova, e não vale inventar. O que dá, e eu faria: tirar o `4_000` duplicado de `compose.test.ts:23` e `scripts.test.ts:75` para um lugar só, com a **data e a fonte da medição na constante** (`// 21/09/2026, test:infra: api-2, 3.899 linhas`). Não importe esse piso de `compose.ts`: se o teste ler o número do código sob teste, baixar a régua passa a deixar tudo verde, e o piso deixa de ser independente.

**R4 — `/ logs /` erra para vermelho em tudo que consegui construir, menos em um caso.** Falta de `--tail` vira `NaN >= 4_000` (vermelho); token no fim da linha não casa e o `toBeGreaterThanOrEqual(0)` reprova; falso positivo numa execução verde derruba o `expect(...some(/ logs /)).toBe(false)`. Conferi o conjunto real de chamadas dos três scripts: hoje nenhuma outra linha contém ` logs `. O buraco é de direção verde e é o mesmo da R1: o docstring em `scripts.test.ts:62-67` promete afirmar "existe chamada `docker compose ... logs`", mas a regex não olha `docker`, nem `compose`, nem o projeto. `/^docker compose .* logs /` fecha.

**R5 — segue aberta da rodada 1, e é a única asserção de *resultado* que falta.** Um caso em `tools/ci/compose.int.test.ts` que rode `logs --no-color --timestamps --tail N` em dois serviços e afirme carimbo RFC3339 em toda linha e as duas fontes numa linha do tempo só. Hoje tudo é asserção sobre argv. A medição manual do documento (linhas 110-111) cobre metade do ponto; a outra metade continua sem rede: se uma versão futura do compose recusar a flag, `tools/ci/executar.ts:36-39` preserva o vermelho original e o despejo falha **em silêncio**, exatamente na execução em que ele é a única evidência.

Sem achados nos demais itens do meu roteiro: nenhum `.skip`, nenhum teste comentado, nenhum `any`, nenhum mock escondendo a regra (o `docker` imitado registra e devolve, não substitui a decisão), nada de provedor pago. O carimbo do portão em `/home/joaquimdp/Documentos/git/Educa.ia/.processo/portao.json` confere com o início declarado e lista `typecheck, lint, test, infra`. A recomendação da rodada 1 sobre `infra/scripts/carga.ts:304` e `carga-login.ts:444` entrou no `TODO.md`, e a correção do "terceiro caso" no texto também.

## test-engineer · 3ª rodada · REPROVADO · 2026-09-21 18:06:38 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Auditei o diff desde a minha rodada 2 por leitura e por mutação independente, em cópia em `/tmp` (já removida). Nenhum arquivo da árvore foi tocado: `git status` no fim é idêntico ao do começo.

```
VEREDITO: REPROVADO

Cenários exigidos (os mesmos C1–C6 da rodada 2, mais o C7 que a R5 pedia):
  C1 execução verde não despeja log
  C2 execução vermelha despeja com carimbo uniforme e alcance medido
  C3 o despejo acontece ANTES do `down --volumes --remove-orphans`
  C4 `--manter-ambiente` com falha: despeja e não derruba
  C5 os três scripts reais emitem o despejo carimbado
  C6 todo passo de encerramento fala com o projeto compose de teste
  C7 asserção de RESULTADO: o despejo sai cruzável (carimbo do Docker em toda linha,
     serviços comparáveis entre si)

Cobertos:
  C1 — tools/ci/compose.test.ts:33 · tools/ci/scripts.test.ts:124,151
  C2 — tools/ci/compose.test.ts:23 (argv inteiro, `toEqual`) + tools/ci/scripts.test.ts:70-87
  C3 — tools/ci/compose.test.ts:40-43 + tools/ci/scripts.test.ts:86
  C4 — tools/ci/compose.test.ts:41,43,49 + tools/ci/scripts.test.ts:167-173
  C5 — tools/ci/scripts.test.ts:121,150,172
  C6 — tools/ci/compose.test.ts:53-58 + tools/ci/scripts.test.ts:68,175-184
  C7 — tools/ci/compose.int.test.ts:132-159, parcialmente (ver bloqueante)

Bloqueantes:
  tools/ci/compose.int.test.ts:158 — `expect(Math.max(...todos) - Math.min(...todos))
  .toBeGreaterThanOrEqual(0)` é asserção que SEMPRE passa, proibida pela regra 40 ("O que é
  proibido: ... asserção que sempre passa"). Não é caso de borda improvável: para qualquer
  array não vazio de números finitos, max >= min por definição, e `todos` só chega aqui não
  vazio (`:142` exige > 1 linha) e só com números finitos (`:150` reprova NaN antes). O único
  mundo em que ela falharia é `todos` vazio, que `:142` e `:148` já tornaram impossível.
  Agrava: é ela que carrega a segunda metade do nome do caso (`:132`, "os serviços numa linha
  do tempo só") e da afirmação do documento (`:124`) — a claim está sem nenhuma asserção que
  possa ficar vermelha.
  Correção exigida, uma das duas:
   (a) apagar `:157-158` e tirar "e os serviços numa linha do tempo só" do nome do caso e do
       documento — o substantivo já está provado por `:148` (RFC3339 do Docker em TODA linha)
       mais `:156` (>= 2 serviços), que é o que "mesma escala" significa; ou
   (b) trocar por asserção que possa falhar, e não-flaky: cada carimbo é instante de parede
       plausível — `expect(Math.max(...todos)).toBeLessThanOrEqual(Date.now())` e um piso
       (`Date.now() - N`), o que reprova carimbo do próprio serviço em outra escala.
   NÃO exija intercalação entre os dois serviços: as últimas 15 linhas de cada um podem
   legitimamente não intercalar, e isso viraria vermelho falso.

Recomendações:
```

**1. Sim, há uma quarta mutação pela mesma fresta — e ela é o mesmo conserto que a sua pergunta 2.** As três da R1 morreram de verdade (medi as oito do documento, uma a uma, restaurando entre elas, com os mesmos 19 casos de base). Mas o `toEqual` só protege *dentro* de `etapasDeEncerramento`; no nível do script `afirmarDespejoCarimbado` continua afirmando **propriedades**, não o comando. Qualquer call-site desviado que satisfaça as quatro propriedades sobrevive com 19 verdes. Medido:

- `tools/ci/e2e.ts:22` trocado por array embutido `['logs','--no-color','--timestamps','--since','1m','--tail','4000']` → **19 verdes**. O `--since 1m` corta o despejo para o último minuto e destrói a evidência da falha que aconteceu aos 15 min — que é exatamente a alternativa que o documento diz ter considerado e descartado (`:104`);
- o mesmo sem `--no-color` → **19 verdes** (dano menor: escapes ANSI no log do job, e o caminho real deixa de ser o que o `compose.int.test.ts` afirma).

Conserto único, e é a resposta direta à sua pergunta 2: em `tools/ci/scripts.test.ts:76-84`, afirmar a **linha inteira**, não os tokens:

```ts
expect(chamadas[indice]).toBe(
  'docker compose --project-name educa-teste --env-file .env.example --env-file infra/teste.env ' +
  '-f infra/compose.yml logs --no-color --timestamps --tail 4000',
)
```

Conferi que é literalmente a linha que os scripts reais produzem hoje. Isso mata de uma vez: `--since`, `--no-color` sumido, `--tail` duplicado, lista de serviços no fim, projeto trocado, arquivo de compose trocado e ordem dos argumentos — e dispensa `DESPEJO`, os dois `indexOf('--tail') + 1` e o piso. Não bloqueio porque foi exatamente o que eu pedi na rodada 2 (R1/R4) e foi feito; a largura que falta é achado novo meu, não correção descumprida.

**2. `partes[partes.length - 1]).toBe(String(Number(...)))` (scripts.test.ts:84) é torta, sim, e frágil para o lado errado.** Ela diz "o último token é o número do tail", não "sem serviços no fim": `--tail 4000 --no-color` (ordem legítima) ficaria vermelho sem nada de errado, e `String(Number(x))` normaliza para *mais* estrito (`04000` reprova). A forma direta é a do item 1. Se preferir manter a checagem por propriedade, o honesto é afirmar o complemento — nenhum token depois do valor do tail — e não uma igualdade que finge ser outra coisa.

**3. O caso novo de `compose.int.test.ts` é teste legítimo aqui, não teste de biblioteca disfarçado.** O que ele prende não é "o Docker funciona": é o **contrato externo em que a nossa única evidência de falha se apoia** — que aquela combinação de flags é aceita e devolve carimbo do lado do Docker em toda linha. `executar.ts:36-39` preserva o código original, então a recusa dessa combinação apareceria como despejo vazio dentro de uma execução já vermelha, em silêncio; é a definição de coisa que precisa de rede. O seu vermelho induzido (`redis-fila-1 | 1:M 21 Sep 2026 20:55:01.773 *`) é a prova de que a asserção de `:148` é efetiva. O valor do caso está em `:148` e `:156` — e é por isso que o bloqueante acima é sobre `:158` apenas, e não sobre o caso.

**4. O caso de integração retipou as flags em vez de usar a fonte (`compose.int.test.ts:140` vs `compose.ts:47`).** Como está, ele garante a combinação **de hoje**; se amanhã o despejo real ganhar uma flag, o guarda continua verde afirmando outra chamada. `composeOuFalha(...ETAPA_DO_LOG_DA_FALHA, 'postgres', 'redis-fila')` (ou com o `4000` substituído por `15` no map) o acopla ao argv que ele promete cobrir. Aqui importar de `compose.ts` é seguro: o que o teste afirma é o carimbo no resultado, não a régua do tail — o argumento da R3 não se aplica.

**5. `composeOuFalha` devolve `stdout + stderr` concatenados (`tools/testes/compose.ts:22`).** Se o compose emitir qualquer WARN em stderr nessa chamada, a linha entra em `linhas` (`compose.int.test.ts:141`) e reprova em `:148` como "linha sem carimbo". Hoje o ambiente é limpo (o próprio `:34` afirma `stderr` vazio), então é risco de flake, não defeito: ou lê só `stdout`, ou o comentário registra a dependência.

**6. R3 (o 4.000 em dois lugares) não é preguiça — mantenha.** Importar de `compose.ts` faria baixar a régua ficar verde, e um terceiro arquivo para uma constante é indireção pior que a duplicação, você está certo. Com o item 1 aplicado, os dois passam a ser literais da mesma forma (um no `toEqual`, um na string), o que é mais fácil de manter sincronizado que literal + piso escrito de outro jeito.

**7. Sobre a tabela (R2): confirmo os oito números, com uma ressalva de rótulo.** Base 19/19. `sem --timestamps` 5 ✓ · `--tail 200` 5 ✓ · **ordem invertida 4 ✓** (a correção da R2 está certa) · call-site `e2e.ts` 2 ✓ · call-site `executarTestesComInfra` 2 ✓ · `--tail` duplicado 5 ✓ · serviços no fim 5 ✓ · "projeto trocado" 2 ✓ **somente na leitura "arquivo de compose trocado, `--project-name` mantido"**; trocando o nome do projeto no despejo dá **6** (os 2 de `compose.test.ts` mais os 4 de `scripts.test.ts`, que é o `DESPEJO` funcionando). Vale desmembrar a linha em duas, porque os dois vermelhos vêm de guardas diferentes. E o texto de `:164-165` promete mais do que existe: `scripts.test.ts` não afirma "o comando completo com o projeto", afirma prefixo mais quatro propriedades — corrija a frase ou aplique o item 1, que a torna verdadeira.

**8. Um crack que eu procurei e NÃO existe, para registro:** trocar `stdio: 'inherit'` por `'ignore'` em `tools/ci/executar.ts:15` — que tornaria o despejo invisível no log do job e a correção inteira letra morta — é pego por `tools/ci/executar.test.ts` (1 vermelho a mais sobre a base do projeto `unidade`). O canal de entrega está protegido; não é achado.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/scripts.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/e2e.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/executar.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`.

## test-engineer · 5ª rodada · REPROVADO · 2026-09-21 19:19:00 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Audited the delta. I confirmed one of your two suspicions empirically, with Docker, and it is a blocker.

## Question 1 — the log ceiling case does not affirm what it promises

Your comment at `tools/ci/compose.int.test.ts:142-143` says "Trocar o driver também apareceria aqui, porque `logging` inteiro tem de estar ausente". **That is false**, and it is the second time this correction carries an affirmation without proof. The assertion is on `logging?.options`, not on `logging`. I ran `config --format json` on a scratch compose file outside the tree:

```
"borda":    { "logging": { "driver": "none" } }      → logging?.options === undefined → PASSA
"postgres": { "logging": { "driver": "local" } }     → logging?.options === undefined → PASSA
"api-2":    { "logging": { "driver": "syslog" } }    → logging?.options === undefined → PASSA
```

`logging` is not required to be absent — only `options` is. And the driver path is **strictly worse than the `max-size` path you closed**. With `logging: {driver: none}` on a service, I measured, with two real containers:

```
docker compose logs --no-color --timestamps --tail 4000
  stdout:  50 linhas de normal-1, ZERO de ruidoso-1
  stderr:  level=warning msg="Can't retrieve logs ...: configured logging driver does not support reading"
  exit=0
```

Zero lines, not fewer lines, and **exit 0** — so `executar.ts` sees nothing wrong and the argv tests stay green. Same for `syslog`, `gelf`, `fluentd`, `awslogs`: all fail the reader-capability check identically.

The companion case at `compose.int.test.ts:168` does not backstop it, because it dumps only `postgres` and `redis-fila`. `driver: none` on `borda` or on `api-2` — the 3.899-line service that is the entire piso justifying the 4.000 — passes all nineteen cases. I grepped: nothing else in the repo looks at `logging`. And the edit is the plausible one: the evidência section itself records that 88% of `borda`'s 38.787 lines are healthcheck noise queued for its own correção. `driver: none` on `borda` is exactly what someone enxugando that noise writes.

## Question 2 — the 30-day floor: the argument half holds, and the comment overclaims

I built wrong timestamps against the window `(agora − 30d, agora + 60s]`:

```
PASSA    2026-09-21T19:17:56Z  hora local do host (UTC-3) rotulada Z  ← "fuso do contêiner"
PASSA    2026-09-01T22:17:56Z  relógio do contêiner 20 dias atrasado
VERMELHO 1970-01-01T00:00:00Z  epoch
VERMELHO 2026-09-22T00:17:56Z  fuso a leste (UTC+2) rotulado Z
```

Host is `GMT-0300`. So your comment at `compose.int.test.ts:186-195` names three failure modes the window supposedly catches, and **"fuso do contêiner" is not one of them** for any western timezone — which is the only timezone that matters here (D28, hospedagem em região Brasil). Detection is asymmetric: the `+60s` ceiling catches skew ahead, the 30-day floor catches only era-level errors. "Erra por horas ou por anos, nunca por dias" is half-true — hours *behind* passes.

But the case is not without power, and the power is not in the floor: it is in the **regex**, which requires a literal `Z` and the `T` separator, and therefore rejects all three real formats (`1:M 21 Sep 2026`, `2026-09-21 20:55:01.773 UTC`, `"ts":1789870704.789`), plus any `-03:00` offset form. Plus the ceiling, the `>= 2` serviços and `linhas > 1`. So widening to 30 days did not leave the claim unasserted — it left the floor nearly decorative while the comment credits it with work the regex does. Recommendation, not blocker.

## Question 3 — nothing already proven was weakened

Items 5 and 6 **strengthened** what round 4 had: `toContain(DESPEJO_DA_FALHA)` on the array is exact-element equality, so "lista de serviços no fim" now dies in `scripts.test.ts` too, not only in `compose.test.ts`; and `toContain('15')` makes a fused `--tail=4000` go red instead of slow. Fraction-optional is a correctness fix (Go trims trailing zeros), not a loosening. Ceiling 5s→60s loses only skew between 5 and 60 seconds.

One piece of recorded evidence went stale, though: doc line 144, "conferi que ela falha, deslocando o `agora` em 48 h", was measured against the old window. With 30d/60s, shifting `agora` **+48h now passes green**; only −48h still goes red. Same class of error as the round-2 lesson this document records about itself.

---

```
VEREDITO: REPROVADO

Cenários exigidos (correção de esteira: não há dado de escola, logo sem caso de
permissão nem de isolamento — os cenários são as frestas que matam a evidência
sem ficar vermelho):
  caminho feliz: despejo carimbado, argv inteiro, antes do down
  verde não despeja · --manter-ambiente ainda despeja
  ordem invertida · call site desviado (os dois) · --tail duplicado · --since ·
  --no-color removido · lista de serviços no fim · projeto/arquivo trocado
  resultado real: carimbo do Docker em toda linha, escala do relógio do host
  fresta de configuração: teto de log no compose (options E driver)

Cobertos: todos, menos a metade do último.

Bloqueantes:
  tools/ci/compose.int.test.ts:144 — `expect(servico.logging?.options).toBeUndefined()`
  não cobre troca de driver, e o comentário de :142-143 afirma que cobre. Provado com
  `config --format json`: `logging: {driver: none}`, `{driver: local}` e `{driver: syslog}`
  saem com `options` ausente e passam. Provado com contêineres reais: `driver: none` faz
  `logs --tail 4000` entregar ZERO linha daquele serviço e sair com exit 0 — o despejo
  falha em silêncio na única execução em que é a única evidência, com os dezenove casos
  verdes. O caso de :168 não segura, porque só olha postgres e redis-fila; nada mais no
  repositório olha `logging`.
  Correção exigida: afirmar `servico.logging` (não `.options`), que é o que o comentário
  já diz ser a regra — uma linha, fecha driver, `none`, `syslog` e `options` de uma vez —
  e medir a mutação `logging: {driver: none}` em `borda` para registrar o vermelho.

Recomendações:
  1. compose.int.test.ts:186-195 — o piso de 30 dias não pega "fuso do contêiner" (UTC-3
     rotulado Z passa; o host é GMT-0300, e D28 põe tudo em região Brasil). Quem pega o
     fuso é a regex, que exige `T` e `Z` literais. Reescrever o comentário para creditar a
[… 16 linhas cortadas]

## test-engineer · 6ª rodada · APROVADO · 2026-09-21 19:53:25 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Audit done. I read the four changed files, the round-5 requirements, the compose file and the Caddyfile, and I ran both suites to confirm the bases you cite.

## Verificações que fiz

- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.test.ts` + `.../tools/ci/scripts.test.ts`: **19/19 verdes** (1,10 s) — a base das onze primeiras mutações confere.
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts`: **9/9 verdes** (1,66 s) — a base das quatro últimas confere, e o `toHaveLength(19)` passa contra o compose real.
- `infra/compose.yml`: contei os serviços à mão — 19 exatos (os três `*-dados` são volumes). Nenhum `logging`, nenhum `include:`, `extends:`, `profiles:` ou `x-`. O número está certo.
- O bloqueante da rodada 5 está fechado: a asserção em `compose.int.test.ts:154` é `expect(servico.logging).toBeUndefined()`, e as duas mensagens de erro que você colou batem exatamente com o template da linha 154 (`{ driver: 'none' }` e `{ driver: 'json-file', …(1) }` — esta última é a normalização que o `config` faz do `max-size`, o que confirma que a medição é real e não redigitada).
- As quatro recomendações: rec 1 em `compose.int.test.ts:196-201` (credita a regex, aceita o fuso a oeste com motivo), rec 2 na tabela do documento linhas 174-178 (com a direção, e o `+48 h` marcado como passa), rec 3 em `:152`, rec 4 na tabela de quinze com a nota das duas bases. Todas aplicadas.
- Sem `.skip`, `.only`, teste comentado ou `any` no delta.
- `tools/ci/compose.int.test.ts` cai no projeto `integracao` (o `exclude` do projeto só tira `infra/**`), então ele roda no `npm run test` do portão da tarefa, não só na esteira. Importante e correto: o guarda de configuração não depende do `--infra`.
- Carimbo em `.processo/portao.json` com `inicio` `2026-09-21T22:21:40.507Z` e as quatro suítes.

## Suas três perguntas

**1. Existe uma terceira porta — e ela não é hipotética, é a próxima correção que você mesmo anunciou.** Não é `daemon.json` nem `x-` anchors (você tem razão nas duas: uma não é versionada, a outra o `config` resolve antes de você ler). É o **serviço decidindo para onde escreve**. `/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile:12-22` já é exatamente esse knob em uso:

```
log default { output stderr ... exclude http.log.access http.log.error http.handlers.reverse_proxy }
log sonda   { output stderr ... include http.handlers.reverse_proxy.health_checker }
```

Trocar `output stderr` por `output file`, ou mexer no `include` do logger `sonda`, entrega **zero linha** daquelas mensagens ao `docker logs`, com argv intacto, exit 0, nenhum `logging:` no compose e os 28 casos verdes. E as linhas do logger `sonda` são precisamente as 484 `host is up` que o seu documento (linha 191) nomeia como o que diagnostica um 503. A correção do ruído de `admin.api` vai mexer nesse mesmo bloco. O mesmo vale para `logging_collector=on` no Postgres.

Não bloqueio por isso: o guarda que esta correção instala é sobre o *despejo*, e a verbosidade de cada serviço é outro defeito — que o documento já separou de propósito. Mas o comentário em `compose.int.test.ts:133` diz "O **último** caminho que mata a evidência da falha sem ficar vermelho", e isso é uma afirmação de exaustividade sem medição atrás, da mesma família da que te reprovou na rodada 5. Troque "o último" por "o caminho de configuração do compose".

**2. `toHaveLength(19)` é a direção certa de falhar, e há uma forma estritamente melhor.** Não vai virar vermelho falso chato, por duas razões: acrescentar serviço é ato deliberado num arquivo versionado, e o mesmo arquivo **já** obriga a tocar o inventário em outros dois lugares (`compose.int.test.ts:50`, a lista `semPorta`, e `:80-91`, a lista dos pools). O 19 entra numa classe de manutenção que já existe, não cria uma nova. A melhora: use o `toEqual` com os nomes, como o teste dos pools ao lado já faz. Dá a mesma não-vacuidade, e ainda pega serviço **removido ou renomeado** (que o `toHaveLength` não pega se alguém tirar um e pôr outro), e o vermelho vem com o diff nomeando qual serviço apareceu, em vez de "esperava 19, recebi 20".

**3. O documento está honesto no que importa, e tem três afirmações sem medição atrás — todas no mesmo ponto, e nenhuma delas no argumento central.** O argumento central eu refiz na mão e ele fecha exatamente: com "outros" somando 192 linhas, `200 → 1.768`, `2.000 → 12.568` e `4.000 → 24.467` reproduzem ao número, e os "13 de 19 / 14 de 19" e "11 de 12 / 12 de 12" saem certos. Essa tabela é sólida. O que não tem medição atrás:

- **"os seis de infraestrutura"** (doc:55 e :101, e o comentário em `tools/ci/compose.ts:42-43`). São **sete** serviços de terceiro (postgres, redis-fila, redis-cache, storage, oidc-falso, borda, observabilidade — conferi por `image:` vs `build:`), e, pior, a sua própria tabela mostra que em `--tail 4000` os truncados são **cinco**, não seis: postgres, borda, redis-fila, redis-cache e storage. `oidc-falso` e `observabilidade` são de infraestrutura e saem **completos**. Em 200 e em 2.000 o sexto truncado é a `api-2`, que é nossa. O comentário em `compose.ts:43` chega a enumerar "(postgres, borda, redis, storage)", que são cinco contêineres, sob o rótulo "os seis".
- **"juntos passam de 150 mil linhas"** (doc:102). A sua tabela soma **149.322** para esses cinco; com os "outros" (≤ 42 cada) ainda não chega a 150.000. É a medição do próprio documento contradizendo a frase duas linhas abaixo dela.
- **"os outros 9"** (doc:88). São **10**: 19 menos os 9 nomeados. Não afeta nenhum total (os 192 continuam valendo), é só o rótulo.

Não é autoelogio de processo. O tom das três lições ("a rodada 1 estava certa nas duas", "a tabela da rodada 2 estava errada, e quem achou foi o revisor") é registro de erro próprio, não elogio, e a linha `+48 h → 0, passa` é a coisa mais honesta do documento: uma mutação que **não** é pega, escrita na tabela de mutações. Mantenha.

```
VEREDITO: APROVADO

Cenários exigidos (correção de esteira: sem dado de escola, logo sem caso de permissão
nem de isolamento — os cenários são as frestas que matam a evidência sem ficar vermelho):
  caminho feliz: despejo carimbado, argv inteiro, antes do down
  verde não despeja · --manter-ambiente ainda despeja
  ordem invertida · call site desviado (os dois) · --tail duplicado · --since ·
  --no-color removido · lista de serviços no fim · projeto/arquivo trocado
  resultado real: carimbo do Docker em toda linha, escala do relógio do host
  fresta de configuração do compose: teto de log (`options`) E troca de driver

Cobertos: todos. O último, que era a metade que faltava na rodada 5, agora em
  tools/ci/compose.int.test.ts:154 — `expect(servico.logging).toBeUndefined()`, sobre
  `logging` inteiro, não `.options`; não-vacuidade real em :152 (19 exatos, não
  `toBeGreaterThan(1)`); mutações medidas nas duas portas, 1 vermelho cada.
  Os demais inalterados desde a rodada 4: compose.test.ts:23 (argv inteiro com toEqual),
  :34, :40, :48, :56; scripts.test.ts:74 e :87 (linha inteira do despejo); 
  compose.int.test.ts:158 (carimbo no resultado real, dois serviços).

Bloqueantes: nenhum.

Recomendações:
  1. tools/ci/compose.int.test.ts:133 — "O **último** caminho que mata a evidência da
     falha sem ficar vermelho" é afirmação de exaustividade sem medição atrás, a mesma
     classe do bloqueante da rodada 5. Existe uma terceira porta: infra/Caddyfile:12-22
     decide o que a borda escreve em stderr (`output stderr`, e o `include` do logger
     `sonda`). Trocar por `output file`, ou tirar o health_checker do `sonda`, apaga as
     484 linhas `host is up` — que o próprio documento (linha 191) nomeia como o que
     diagnostica um 503 — com argv intacto, exit 0 e 28 casos verdes. Escrever "o
     caminho de configuração do compose", e registrar a porta do Caddyfile na correção
     do ruído de `admin.api`, que vai mexer nesse mesmo bloco.
  2. tools/ci/compose.int.test.ts:152 — trocar `toHaveLength(19)` pelo `toEqual` com os
     19 nomes, como o teste dos pools em :80-91 do mesmo arquivo já faz. Mesma
     não-vacuidade, e ainda pega serviço renomeado ou trocado um-por-um, com diff
     nomeando o culpado em vez de "esperava 19, recebi 20".
  3. Documento :55 e :101, e o comentário tools/ci/compose.ts:42-43 — "os seis de
     infraestrutura" não bate com a medição do próprio documento. São sete serviços de
     terceiro, e em `--tail 4000` os truncados são cinco (postgres, borda, redis-fila,
     redis-cache, storage): `oidc-falso` e `observabilidade` saem completos, e em 200 e
     2.000 o sexto truncado é a `api-2`, que é nossa.
  4. Documento :102 — "juntos passam de 150 mil linhas": a tabela de :82-88 soma 149.322
     para esses cinco, e com os "outros" não chega a 150.000.
  5. Documento :88 — "os outros 9" são 10 (19 menos os 9 nomeados). Não muda nenhum
[… 15 linhas cortadas]

## test-engineer · 7ª rodada · APROVADO · 2026-09-21 20:30:01 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Tree untouched, gate stamp matches. Here is the audit.

---

**VEREDITO: APROVADO**

**Cenários exigidos** (correção de esteira: sem dado de escola, logo sem caso de permissão nem de isolamento — os cenários são as frestas que matam a evidência sem ficar vermelho):
caminho feliz (despejo carimbado, argv inteiro, antes do `down`) · verde não despeja · `--manter-ambiente` ainda despeja · ordem invertida · call site desviado (os dois) · `--tail` duplicado · `--since` · `--no-color` removido · lista de serviços no fim · projeto/arquivo trocado · resultado real (carimbo do Docker em toda linha, escala do relógio do host) · fresta de configuração do compose (teto de log **e** troca de driver).

**Cobertos:** todos, os mesmos da rodada 6, nada perdido e um estritamente mais forte. Conferi que cada asserção que aprovei continua no lugar, só deslocada: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.test.ts:23` (argv inteiro com `toEqual`), `:34`, `:40`, `:48`, `:56`; `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/scripts.test.ts:74` e `:87` (linha inteira do despejo); `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts:164` (`logging` inteiro `toBeUndefined`) e `:168` (carimbo no resultado real). Bases medidas por mim: **19 de 19** verdes (1,09 s) e **9 de 9** verdes (1,65 s).

**As oito correções exigidas, conferidas uma a uma:**

- **Recs 3, 4, 5 — refeitas e agora corretas, medidas por mim e não pela sua palavra.** Rodei `config --format json` contra o compose real: 19 serviços, **7** de terceiro (`image:` sem `build:`: borda, observabilidade, oidc-falso, postgres, redis-cache, redis-fila, storage) e **12** nossos (`build:`). Refiz a soma dos cinco truncados: 50.970+38.787+35.886+15.705+7.974 = **149.322** ✓. E "os outros 10" fecha a aritmética inteira: com 192 linhas neles, os totais 1.768 / 12.568 / 24.467 e os "13 de 19 / 14 de 19" e "11 de 12 / 12 de 12" reproduzem ao número. O comentário de `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts:41-46` foi corrigido junto ✓.
- **Rec 2 — aplicada e é a melhora que eu previ.** `compose.int.test.ts:158` é `toEqual` com os 19 nomes, escritos à mão (não derivados do `compose.yml`, o que seria vacuidade). Bate exatamente com os nomes reais.
- **Recs 1, 6, 7, 8 — aplicadas.** A rec 8 eu conferi de verdade: `stdio` aparece uma única vez em `tools/ci/` (`executar.ts:15`), e `scripts.test.ts` lê o arquivo de registro das imitações, não a saída dos processos — então `'pipe'` descartado passaria verde mesmo. A afirmação está certa, e é honesta em se declarar sem teste.

**Bloqueantes: nenhum.** Nenhuma regra ficou sem teste que a prove, nenhum `.skip`, `.only`, teste comentado, `any` ou mock cobrindo a regra no delta. O que achei abaixo é texto que erra sobre o mundo, não asserção que erra sobre o código — a mesma classe das recs 3-5 da rodada 6, que também não bloqueei.

**Suas três perguntas**

**1. A sexta existe, são duas, e uma delas é minha.** Ambas no mesmo par de lugares (documento + comentário do teste), ambas medidas por mim agora:

**(a) A lista de drivers está errada** — `.../2026-09-21-log-da-falha-sem-carimbo-de-hora.md:126` e `compose.int.test.ts:146`: "`driver: none` (ou `local`, `syslog`, `gelf`, `fluentd`, `awslogs`) → entrega **zero** linha, com exit 0 e só um warning". Medi com um compose descartável em `/tmp`, cinco serviços alpine, um por caso, e o comando real `logs --no-color --timestamps --tail 4000`:

```
exit=0
driver-none    → 0 de 3 linhas; stderr: warning "configured logging driver does not support reading"
driver-local   → 3 de 3 linhas, sem warning
driver-syslog  → 3 de 3 linhas, sem warning
teto-100k      → 3 de 3 linhas
sem-logging    → 3 de 3 linhas
```

Só `none` é a porta de zero linha. `local` é driver de leitura (o Docker lista json-file, local e journald), e `syslog` ainda entrega por causa do cache de *dual logging*, ligado por padrão desde o 20.10 — o mesmo mecanismo vale para gelf, fluentd e awslogs. Esses cinco pertencem à **primeira** porta, não à segunda: entregam **menos** linhas (o `local` corta em 20m×5 por padrão, o cache no anel dele), não zero. Não bloqueia porque a asserção é sobre `logging` inteiro e proíbe todos eles; o que está errado é o tamanho do dano, não a cobertura.

**(b) "Tudo verde" na terceira porta é falso, e o erro é meu, copiado da minha rec 1 da rodada 6.** Documento `:139-142` e `compose.int.test.ts:136-138` dizem que trocar `output stderr` por `output file`, ou tirar o `health_checker` do `sonda`, passa "com argv intacto, exit 0, nenhum `logging:` no compose e tudo verde". As duas metades já são pegas hoje:

- **tirar o `health_checker` do `sonda`** → `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/borda.test.ts:88` fica vermelho. Rodei as três regexes daquele caso contra uma cópia mutada em memória: `:86` passa, `:87` passa, `:88` **VERMELHO**. É teste de unidade, ou seja, cai no `npm run test` do **portão da tarefa**.
- **`output stderr` → `output file`** → `borda.test.ts` segue verde, mas `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts:577-588` faz `expect.poll` por uma linha `"logger":"http.handlers.reverse_proxy.health_checker.active"` em `borda.logs()`, que é `docker logs` de um Caddy montado sobre o `infra/Caddyfile` real (`:220-226`). Medi com dois contêineres Caddy sobre cópias em `/tmp`: original **28** linhas `health_checker` em `docker logs`, com `output file` **0**. O poll estoura e o caso fica vermelho no `test:infra` e na esteira.

Ou seja: a terceira porta está guardada nas duas metades, uma no portão e outra na esteira. O registro para a correção do ruído de `admin.api` continua útil — o que ela vai mexer é o `include`/`exclude`, não o `output` —, mas a frase precisa dizer qual teste pega o quê, em vez de anunciar uma fresta aberta que não está aberta. É exatamente o vício que este documento existe para não ter, e eu o introduzi.

**2. A terceira lista se paga, e o custo é o barato.** Adicionar serviço é ato deliberado num arquivo versionado, e a falha é **alta e nominal**: `:158` diz qual nome apareceu ou sumiu, `:53` quebra se o serviço novo não publicar porta, `:80-91` quebra se ele tiver pool. Três vermelhos ao mesmo tempo, todos nomeando o serviço — não é o tipo de manutenção que corrói. Consolidar as três numa constante só **não reduz** o número de edições (`semPorta` e a dos pools são subconjuntos com significado próprio, não o inventário), e derivar a lista do `compose.yml` a tornaria vacuosa. Fica como está.

**3. Nada foi enfraquecido.** O `git diff` de `compose.int.test.ts` é puramente aditivo: dois `it` novos, com `semPorta` (`:50`) e a lista dos pools (`:80-91`) intocadas. `toEqual` com nomes é estritamente mais forte que `toHaveLength(19)`: pega renomeação e troca um-por-um, que a contagem não pegava. E a tabela de quinze mutações continua internamente consistente — conferi dois números pela contagem de casos: "sem `--timestamps` → 5" (1 em `compose.test.ts` + 4 em `scripts.test.ts`) e "nome do projeto trocado → 7" (os 4 de `scripts.test.ts` mais os 3 do `it.each` de `:178`).

**Recomendações:**

1. `.../2026-09-21-log-da-falha-sem-carimbo-de-hora.md:126` e `tools/ci/compose.int.test.ts:146` — separar `none` dos outros cinco drivers: `driver: none` é zero linha com warning; `local`, `syslog`, `gelf`, `fluentd` e `awslogs` ainda entregam, pelo cache de dual logging, com o teto do cache — são a **primeira** porta, não a segunda. Medição acima.
2. `.../2026-09-21-log-da-falha-sem-carimbo-de-hora.md:136-142` e `tools/ci/compose.int.test.ts:133-138` — trocar "tudo verde" pelo que a medição mostra: `tools/ci/borda.test.ts:88` pega tirar o `health_checker` do `sonda` (no portão da tarefa) e `infra/test/borda.int.test.ts:586` pega `output file` (na esteira, 28 linhas → 0). Erro de origem minha na rodada 6; vale a nota no `/retro`, porque foi a segunda vez que uma afirmação de exaustividade minha entrou no documento sem medição.
3. `tools/ci/compose.int.test.ts:158-165` — o `toEqual` do inventário roda **antes** do laço do `logging`. Serviço novo já declarando `logging: {driver: none}` fica vermelho pela lista, com a mensagem menos precisa. Invertendo (laço primeiro, inventário depois) o vermelho nomeia o defeito que importa. Continua vermelho nos dois casos, então é só legibilidade.
4. Para o `/retro`: as quatro afirmações erradas da rodada 6 e as duas desta eram todas em **texto explicativo sobre o mundo fora do repositório** (contagem de serviços, comportamento de driver, o que outro teste pega), nunca nas asserções. O padrão sugere um critério simples para o próximo documento: frase sobre comportamento de ferramenta de terceiro ou sobre "nada mais pega isso" só entra com o comando e a saída colados ao lado.

## test-engineer · 8ª rodada · APROVADO · 2026-09-21 21:05:42 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Estado conferido antes de julgar: `tools/ci/compose.test.ts` + `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/scripts.test.ts` **19/19 verdes** (1,09 s), `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts` **9/9 verdes** (1,66 s). O delta desde a minha rodada 7 (fim 20:30:01) é de fato só dois arquivos: `compose.int.test.ts` (20:32:05) e o documento (20:32:32); nenhum outro arquivo rastreado tem `mtime` posterior a 20:30:01, e `compose.ts`, `e2e.ts`, `compose.test.ts` e `scripts.test.ts` estão intactos desde a rodada 7. O carimbo em `.processo/portao.json` (`23:32:43.403Z`, `typecheck, lint, test, infra`) é posterior à última edição — cobre esta árvore. Nenhum `.skip`, `.only`, `any` ou `@ts-` nos cinco arquivos.

**Pergunta 2 — a reordenação mudou só a mensagem.** As duas asserções continuam incondicionais e com os mesmos argumentos (`compose.int.test.ts:158-160` e `:164-168`); o Vitest aborta na primeira que falha, então a conjunção provada é idêntica. A vacuidade continua fechada: `services` vazio passaria o laço e morreria no inventário por nome. E as contagens de mutação não mudam — `logging: {driver: none}` na `borda` dá 1 vermelho nas duas ordens; serviço renomeado dá 1 nas duas. O ganho é o que o comentário `:156-157` diz ser: para serviço novo que já chegue com `logging`, o vermelho agora nomeia o defeito em vez de dizer que a lista mudou.

**Pergunta 1 — a seção registra os erros, mas a classificação é generosa em dois pontos, os dois na direção que absolve os testes.**

1. `:310` — "**O código foi reprovado duas vezes**, as duas com razão (rodadas 1 e 3)". Foram **três**, pela tabela de Revisões do próprio documento (`:346`, `:348`, `:350`). A rodada 5 reprovou uma **asserção**: `expect(servico.logging?.options).toBeUndefined()` não alcançava troca de driver, e `logging: {driver: none}` — zero linha de evidência, exit 0 — passava com os dezenove casos verdes. A correção exigida foi mudar a asserção para `servico.logging`. Isso é a categoria mais grave do meu roteiro, "regra sem teste que a prove", e é o pior resultado possível desta correção (a evidência sumindo em silêncio na execução em que é a única que existe). A seção a arquiva na linha "comportamento de ferramenta de terceiro".

2. `:314-315` — "Todas as afirmações erradas caíram na mesma categoria: **prosa sobre o mundo fora do repositório**, nunca uma asserção de teste". Três das seis linhas da própria tabela são prosa sobre o **alcance dos próprios testes**, não sobre o mundo externo: rodada 2 ("a ordem invertida dá 1 vermelho" — comportamento das suas suítes), rodada 5 ("trocar o driver também apareceria aqui" — alcance da sua asserção) e uma sétima que **não está na tabela**: `:216-218`, "conferi que ela falha, deslocando o `agora` em 48 h", que afirmava que o caso pegava uma mutação que ele não pega (`:222`, +48 h passa). Essa é a pior da família, porque **superestima a proteção**, e é interna. Some-se a oitava, `:78-79` ("2.000 cobre a execução inteira"), erro seu derrubado por medição sua. Então "as seis afirmações erradas" é uma contagem que não foi contada — o vício 2 da própria seção — e "nunca uma asserção de teste" é falso como escrito.

O resto da seção não é autoabsolvição: manter na tabela de mutações a linha `+48 h → 0, passa` e escrever "a tabela da rodada 2 estava errada, e quem achou foi o revisor" é registro de erro próprio. O conserto é trocar "duas" por "três", tirar a rodada 5 da coluna de prosa, e trocar "prosa sobre o mundo fora do repositório" por "prosa sobre comportamento que eu não medi — de ferramenta de terceiro **ou do meu próprio teste**".

**Pergunta 3 — sobrou uma, e ela entrou junto com a rec 1, que é minha.** A tabela `:125` e o comentário `compose.int.test.ts:143-147` agora dizem que `local`, `syslog`, `gelf`, `fluentd` e `awslogs` "entregam **menos** que as 3.899 linhas do maior serviço nosso, matando o piso que justifica o 4.000". A medição colada (`:131-137`) prova **que entregam** — 3 de 3 linhas —, nunca **quanto**: com três linhas escritas, nenhum teto podia aparecer. A sua medição e a minha foram a mesma medição, e nenhuma das duas testou o teto. Medi agora, Docker 29.7.2, 6.000 linhas escritas, comando real de leitura:

```
--log-driver local                              docker logs → 6000 linhas
--log-driver syslog (udp://127.0.0.1:514)       docker logs → 6000 linhas
```

Nenhum truncamento na ordem de grandeza que importa (3.899). `local` tem `max-size 20m`/`max-file 5` por padrão e o cache de dual logging não cortou nada aqui, então nesses dois casos o despejo é indistinguível do de hoje. O enunciado defensável é: `none` zera; os outros cinco entregam, e o que os faz entregar **menos** é um teto configurado (`max-size`, `cache-max-size`) — que é o caso `options`, já na mesma linha. A asserção não muda nada com isso (ela proíbe `logging` inteiro, e o documento diz isso em `:141-142`), por isso é recomendação e não bloqueante. Mas é exatamente o vício 1 da sua seção nova reincidindo dentro da correção que o declara, e pela porta que a sua própria observação final nomeia: repetir a recomendação do revisor sem medir a parte que o revisor também não mediu. A rec 1 da minha rodada 7 está errada nessa metade, e a responsabilidade da frase "entrega menos" é minha antes de ser sua.

Dois achados menores de contagem, da mesma família: `:306` diz "correção de **três** linhas de comportamento" e `:49` diz "**Duas** linhas de comportamento" — o documento contradiz a si mesmo em 257 linhas de distância. E "Sete rodadas de `test-engineer`" vira oito no instante em que esta rodada é registrada, o que é o vício 2 aplicado à frase que o descreve.

```
VEREDITO: APROVADO

Cenários exigidos (correção de esteira; sem dado de escola, logo sem caso de permissão
nem de isolamento — os cenários são as frestas que matam a evidência sem ficar vermelho):
  caminho feliz: despejo carimbado, argv inteiro, antes do down
  verde não despeja · --manter-ambiente ainda despeja
  ordem invertida · call site desviado (os dois) · --tail duplicado · --since ·
  --no-color removido · lista de serviços no fim · projeto e arquivo de compose trocados
  resultado real: carimbo do Docker em toda linha, duas fontes, escala do relógio do host
  fresta de configuração do compose: `logging` inteiro (options E driver), sem vacuidade

Cobertos: todos, e nada perdido na reordenação. Conferi asserção por asserção:
  compose.test.ts:23 (argv inteiro com toEqual), :34, :40, :48, :56 — intactos desde a
  rodada 4; scripts.test.ts:74 e :87 (linha inteira do despejo no script real) — intactos;
  compose.int.test.ts:159 (`logging` inteiro toBeUndefined, agora no laço que vem antes)
  e :164 (os 19 por nome, que fecha a vacuidade) e :171 (carimbo no resultado real).
  Bases medidas por mim nesta rodada: 19/19 verdes (1,09 s) e 9/9 verdes (1,66 s).

Bloqueantes: nenhum. Nenhuma asserção nova, nenhuma removida, nenhuma enfraquecida; a
  reordenação preserva a conjunção provada e as contagens de mutação. Nenhum .skip,
  .only, teste comentado, `any` ou mock cobrindo a regra. Nada chama provedor pago.

Recomendações:
  1. tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md:310 e :314-324 —
     "o código foi reprovado duas vezes" são três (rodadas 1, 3 e 5, pela tabela :346-350);
     a rodada 5 foi reprovação de asserção (`logging?.options` → `logging`), com `driver:
     none` passando verde, e não prosa sobre ferramenta de terceiro. E "nunca uma asserção
     de teste" é falso para as linhas da rodada 2 e da 5, que são afirmações sobre o alcance
     dos próprios testes. Falta na tabela a sétima, :216-218 ("+48 h falha"), que é a que
     superestimava a proteção; e a oitava, :78-79 ("2.000 cobre a execução inteira").
  2. Documento :125 e tools/ci/compose.int.test.ts:143-147 — "entrega MENOS que as 3.899
     linhas" não é sustentado pela medição de 3 linhas colada em :131-137, e é falso na
     escala que importa: medi 6.000/6.000 com `--log-driver local` e 6.000/6.000 com
     `--log-driver syslog` (Docker 29.7.2). O que a medição prova é "entregam"; o que os
     faz entregar menos é um teto configurado, que é o caso `options` da mesma linha.
     Erro de origem na minha rec 1 da rodada 7 — corrija a frase nos dois lugares, não a
     asserção. Vale nota no /retro: revisor e revisado mediram a mesma metade.
  3. Documento :306 diz "três linhas de comportamento"; :49 diz "duas". E "Sete rodadas"
     vira oito com esta. Números do documento que mudam embaixo da frase — o vício 2 que a
     própria seção fixa como critério.
  4. Mantida da rodada 7: tools/ci/executar.ts com `stdio: 'inherit'` segue sem teste, por
     decisão registrada em :168-171. Continuo de acordo, e o registro de que ali a proteção
     é social, não automática, é o que faz a decisão auditável.
```

## test-engineer · 9ª rodada · APROVADO · 2026-09-21 21:39:34 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

**Estado conferido antes de julgar.** Delta desde minha rodada 8 (fim 21:05:42) é de fato só dois arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts` (21:07:24) e `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md` (21:07:15). `compose.ts`, `e2e.ts`, `compose.test.ts` e `scripts.test.ts` intactos desde a rodada 7. Nenhuma asserção mudou — o diff de `compose.int.test.ts` é só comentário (`:148-150`). Rodei eu mesmo: `compose.test.ts` + `scripts.test.ts` **19/19 verdes** (1,09 s), `compose.int.test.ts` **9/9 verdes** (1,65 s). Carimbo `2026-09-22T00:07:27.213Z` (= 21:07:27 local) é posterior às duas edições. Nenhum `.skip`, `.only`, teste comentado ou mock sobre a regra.

**Pergunta 2 — não, e a resposta é a mais importante desta rodada: você devia ter medido, e o que faltava não era um servidor syslog.** A pergunta que o documento declara não saber distinguir ("0 por truncamento" vs "0 por contêiner morto") se fecha com um `docker inspect`. Medi agora, mesmo Docker 29.7.2, mesma URL sem servidor nenhum:

```
docker run -d --log-driver syslog --log-opt syslog-address=udp://127.0.0.1:514 alpine
  (6000 linhas escritas)
docker inspect → status=exited exit=0 erro=   driver=syslog
docker logs     → 6000 linhas, stderr vazio
```

O contêiner **sobe**, sai 0 e `docker logs` devolve tudo — é o cache de *dual logging*, ligado por padrão desde o 20.10. Ou seja: a hipótese "provavelmente nem subiu" (`:146-147`) está refutada, o seu 0 veio de outra coisa no arranjo descartável, e minha medição da rodada 8 (6.000/6.000) reproduz. A linha "não medido de forma conclusiva" (`:128`) não é registro honesto porque o seu premissa está errada: a medição que faltava custava um comando, não um servidor. Não bloqueia (a asserção proíbe `logging` inteiro de qualquer forma), mas é um **0 registrado como evidência** na seção de evidência, que é pior que uma frase sem medição.

**Pergunta 1 — a seção melhorou muito e ainda sobra generosidade em dois pontos, os dois na mesma direção de antes.** (a) `:337` "o texto errou **oito** vezes" e a tabela que vem embaixo tem **nove** linhas (`:343-351`) — e onze erros, porque a linha da rodada 6 empacota três. É a terceira rodada seguida em que aponto número do documento contradizendo o próprio documento, e agora dentro do parágrafo que nomeia o vício 2. (b) `:334-335` "o argumento central — `--timestamps` como conserto, `--tail 4000` pelo maior log de serviço nosso — sobreviveu a todas as rodadas": a metade do `--tail` **não** sobreviveu. Até a rodada 4 o documento trazia 2.000, que ele mesmo chama de "número chutado e, nos próprios termos em que eu o justifiquei, inútil" (`:99-100`). É a versão final do argumento retroprojetada sobre as rodadas em que ela não existia.

**Pergunta 3 — sim, sobraram três, e duas nasceram do conserto da rec 2.** Além do syslog acima: `:127` e `:150` dizem que o `local` "só truncaria com teto **configurado**" — o driver `local` tem teto **por padrão**, `max-size 20m`/`max-file 5`; eu escrevi isso na rodada 8 (`achados-revisoes.md:1982`) e a reescrita perdeu essa metade, virando afirmação mais forte que a medição (6.000 linhas curtas não chegam perto de 20 MB). E `:121` — "Declarar `logging` num serviço matava a evidência com o argv intacto, exit 0 e toda a suíte de argv verde" — é contradito pela linha da própria tabela seis linhas abaixo: com `driver: local`, declarar `logging` **não** mata a evidência.

O que confirmei que reproduz ao dígito: a tabela do `--tail` (`:92-96`). 1.768 = 6×200 + 568; 12.568 = 6×2.000 + 568; 24.467 = 5×4.000 + 3.899 + 568; e 149.322 é a soma exata dos cinco. Os 19 serviços = 12 nossos + 7 de terceiro fecham com a lista enumerada em `compose.int.test.ts:165-169`. 34.102/38.787 = 87,9%.

```
VEREDITO: APROVADO

Cenários exigidos (correção de esteira; sem dado de escola, logo sem caso de permissão nem
de isolamento — os cenários são as frestas que matam a evidência sem ficar vermelho):
  caminho feliz: despejo carimbado, argv inteiro, antes do down
  verde não despeja · --manter-ambiente ainda despeja
  ordem invertida · call site desviado (os dois) · --tail duplicado · --since ·
  --no-color removido · lista de serviços no fim · projeto e arquivo de compose trocados
  resultado real: carimbo do Docker em toda linha, duas fontes, escala do relógio do host
  fresta de configuração do compose: `logging` inteiro (options E driver), sem vacuidade

Cobertos: todos, inalterados desde a rodada 8. compose.test.ts:23 (argv inteiro com
  toEqual), :34, :40, :48, :56; scripts.test.ts:74 e :87 (linha inteira no script real);
  compose.int.test.ts:160 (`logging` inteiro toBeUndefined, no laço antes do inventário),
  :165 (os 19 por nome, que fecha a vacuidade), :172 (carimbo no resultado real).
  Bases medidas por mim nesta rodada: 19/19 e 9/9 verdes.

Bloqueantes: nenhum. Nenhuma asserção nova, removida ou enfraquecida — o delta em
  tools/ci/compose.int.test.ts é só o comentário :148-150. Nenhum .skip, .only, `any`,
  teste comentado ou mock cobrindo a regra. Nada chama provedor pago.

Recomendações:
  1. .../2026-09-21-log-da-falha-sem-carimbo-de-hora.md:128 e :146-152, e
     tools/ci/compose.int.test.ts:148-150 — a linha "não medido de forma conclusiva" está
     apoiada numa hipótese refutável por um comando, e refutada: `docker inspect` mostra o
     contêiner com syslog subindo (status=exited exit=0, erro vazio) e `docker logs`
     devolvendo 6000/6000 (Docker 29.7.2, udp://127.0.0.1:514 sem servidor). O enunciado
     defensável é o mesmo dos outros quatro: entregam, pelo cache de dual logging; o que
     faz entregar menos é um teto, que é a linha `options`. Se preferir manter "não
     medido", diga o que não foi medido (o teto do cache, `cache-max-size`), não a
     subida do contêiner.
  2. Documento :127 e :150 — "só truncaria com teto configurado": o driver `local` trunca
     por padrão (max-size 20m, max-file 5). Estava na minha rodada 8
     (tasks/correcoes/achados-revisoes.md:1982) e caiu na reescrita. Vício 1 reincidindo
     pela porta que a própria seção nomeia: repetir o revisor sem a metade que ele mediu.
  3. Documento :121 — "Declarar `logging` num serviço matava a evidência ... exit 0 e toda
     a suíte de argv verde" é contradito pela linha `driver: local` da tabela logo abaixo.
     Precisa do qualificador: com teto ou com driver sem leitura. E :118 anuncia "duas
     portas" para uma tabela de quatro linhas numa coluna chamada "Porta", em que uma
     (`local`) está medida como não sendo porta.
  4. Documento :337 — "o texto errou oito vezes" contra nove linhas em :343-351 (onze
     erros, com a linha da rodada 6 empacotando três). E :319 "Oito rodadas" fica velho no
     instante em que esta é registrada. Sugestão de conserto definitivo: parar de contar em
     prosa e remeter à tabela ("as rodadas da tabela de Revisões", "as linhas abaixo").
  5. Documento :334-335 — "o argumento central ... sobreviveu a todas as rodadas" absolve
     o `--tail`: o 4.000 só ganhou critério depois da medição que derrubou o 2.000, e o
     2.000 está na sua própria tabela de erros. Diga que sobreviveu o `--timestamps`.
     Nomeie também qual tabela "reproduz ao dígito": a do --tail reproduz (recomputei as
     três linhas e a soma 149.322); a de mutações é a que foi remedida três vezes.
  6. Documento :78-96 — o piso de 3.899 foi medido numa execução **verde** (35 testes
     verdes, 20,2 min), e o despejo só acontece em execução **vermelha**, em que o serviço
     que falha costuma escrever mais (erro, tentativa, stack). O 4.000 continua
     estritamente melhor que 200, mas o piso vem da classe de execução em que o despejo
     nunca roda. Vale uma frase dizendo isso, ou a contagem de uma execução vermelha.
  7. Mantida das rodadas 7 e 8: tools/ci/executar.ts com `stdio: 'inherit'` segue sem
     teste, por decisão registrada em :181-184. Continuo de acordo; o registro de que ali
     a proteção é social é o que faz a decisão auditável.
```

## test-engineer · 11ª rodada · APROVADO · 2026-09-21 23:25:22 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

## Conferência

Rodei três medições próprias antes de julgar.

**1. Recomendações da rodada 10 — todas verificadas como aplicadas.**
- Rec 1: `tools/ci/compose.int.test.ts:148-151` agora diz "`local` e `syslog` entregam tudo (6.000 de 6.000, medido), o primeiro com teto de 20 MB por padrão, que 3.899 linhas não alcançam. `gelf`, `fluentd` e `awslogs` não foram medidos" — bate com a tabela do documento (linhas 165-167), sem contradição.
- Recs 2, 3, 4: documento linha 169 ("Das quatro declarações medidas, **duas** são porta" — confere: `max-size` e `none` de quatro medidas), linhas 356 e 379 (remetem à tabela em vez de afirmar "todas as rodadas"), linha 165 (a linha do `local` sem inversão de leitura).
- Rec 5: registrada em `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md:218-221`.

**2. Nenhuma asserção mudou.** Conferi o diff inteiro dos quatro arquivos de código e os dois de teste: `ETAPA_DO_LOG_DA_FALHA`, `etapasDeEncerramento`, o `toEqual` do argv em `tools/ci/compose.test.ts:23-30` (com o `4000` à mão), o `DESPEJO_DA_FALHA` de linha inteira em `tools/ci/scripts.test.ts` e o caso de resultado em `tools/ci/compose.int.test.ts:173-227` estão como na rodada 8. Sem `.skip`, sem teste comentado, sem mock escondendo regra.

**3. O defeito do `7.5`: sua leitura está certa, e eu reproduzi deterministicamente.** Forcei o relógio no instante que você viu e rodei o logger real:

```
{"level":"info","time":"2026-09-22T01:45:37.569Z","servico":"teste","aluno":{"id":"a1","nome":"[removido]",...
contem 7.5 ? true    nota redigida ? true    indice 42 → "-09-22T01:45:37.569Z\","
```

A redação está correta (`correcao.nota === '[removido]'`); o único `7.5` da linha está dentro do carimbo. Taxa própria sobre 1.000.000 de instantes sorteados: **1,009%**, e nenhum outro dos cinco valores da lista de `logger.test.ts:48` colide. O locus é único: o `.` só aparece entre segundos e milissegundos, logo a colisão exige segundo terminando em `7` e milissegundo começando por `5` — 1/10 × 1/10. `timestamp: stdTimeFunctions.isoTime` em `packages/nucleo/src/log/logger.ts:170` confirma o formato.

Varri o repositório pela mesma classe (todo `not.toContain`/`not.toMatch` sobre texto que carrega carimbo): `logger.test.ts:49` é o único caso real. `procurados` de `sessao-externa.int.test.ts:381`, `sentinela` de `borda.int.test.ts:518` e `'(8)'` de `estrutura.int.test.ts:152` são longos ou não passam por linha de log.

---

VEREDITO: APROVADO

**Cenários exigidos:** despejo da falha carimbado e completo (argv inteiro, não propriedades) · despejo **antes** do `down --volumes` · os dois call sites (`compose.ts` e `e2e.ts`) presos à mesma função · execução verde não despeja · `--manter-ambiente` preserva o despejo · todo passo fala com o compose de teste, nunca o de desenvolvimento · porta de **configuração** (`logging` com teto ou driver sem leitura) · resultado real: carimbo RFC3339 do Docker em toda linha, de dois serviços, na escala do relógio de parede.

**Cobertos:** todos. `tools/ci/compose.test.ts:13-58` (argv com `toEqual` e `4000` à mão, ordem por `toEqual` de nomes, verde sem despejo, prefixo `ARGUMENTOS_COMPOSE` em todo passo); `tools/ci/scripts.test.ts` (linha inteira no script real, nos três casos, com a ordem contra o `down`); `tools/ci/compose.int.test.ts:132-171` (`logging` inteiro ausente, laço antes do inventário dos 19 nomes) e `:173-227` (carimbo no resultado, com a regex exigindo `T` e `Z` e os limites de época). A tabela de quinze mutações no estado final sustenta que cada uma falha sem a regra.

**Bloqueantes:** nenhum.

**Recomendações:**

1. **Abra a correção do `7.5` antes do próximo commit de tarefa**, não depois. `packages/nucleo/src/log/logger.test.ts:48-50` roda no projeto `unidade`, logo em todo portão e todo push: é 1% de chance de o portão ficar vermelho gritando regra 20 sem motivo. Enquanto ele existe, vermelho na suíte deixou de significar uma coisa só, e é disso que a regra 40 depende.

2. **O conserto que eu exigiria, e o que eu recusaria.** Recusaria a sua opção (a): mover o `not.toContain` para o campo. A asserção sobre a linha crua é mais forte de propósito — ela pega o valor vazando em **qualquer** chave, inclusive uma que o `toMatchObject` de `:42-46` não enumera. Trocada pelo campo, ela vira duplicata do `toMatchObject` e fica cega para "a nota reapareceu em `msg`". Recusaria também a opção (b) como está: "valor que não colida" é frágil e é o vício 1 de novo. Medi — `7.55` cai para 1/1.000 mas não para zero, e `10.5` **continua colidindo** (`...T01:45:10.569Z`); só formas impossíveis como segundo `77` escapam de verdade, e ninguém vai reler esse raciocínio em seis meses. O que eu exigiria é **determinismo, preservando o escopo da linha inteira**: fixar o relógio (`vi.setSystemTime`) exatamente em `2026-09-22T01:45:37.569Z`, o instante que falhou, e/ou normalizar o campo `time` dentro de `loggerCapturado()` (`:26-31`) antes do `join`, para todo teste do arquivo herdar a imunidade. Com o instante colidente fixado, o defeito vira caso de regressão permanente em vez de desaparecer. Se a escolha for normalizar o `time`, ela precisa vir acompanhada de uma asserção de que `registro.time` casa com o ISO — senão o strip passa a esconder o carimbo sumindo do log.

3. **Registrar o vermelho cuja evidência você apagou é honesto, e eu não exigiria reprodução antes de seguir.** Intermitente que não reproduz não reproduz por definição; você rodou de novo em seguida (35/35, 1.192 s), não atribuiu causa e escreveu "não estabelecida". Isso é o que a regra 40 quer. Desculpa seria chamar de "flake do ambiente" e seguir. O que vale extrair não é culpa, é mecanismo: `tools/processo/portao-local.ts:30` roda tudo com `stdio: 'inherit'` e nada mais — a saída do portão existe só no terminal de quem chamou. É **o mesmo furo** que o documento registra em `tools/ci/executar.ts` (linhas 218-221) e declara como "proteção social, não automática" — e a proteção social falhou na mesma noite, contra o autor. Recomendo abrir que o portão local persista a saída completa por execução, ao lado do carimbo. Seria a tese desta correção aplicada ao lado local, que é onde as nove intermitências apareceram.

4. `tools/ci/compose.int.test.ts:185-190`: o `map` supõe `--tail` seguido do valor e o `expect(argumentos).toContain('15')` guarda isso — correto, mas o guarda passa se um dia algum outro argumento for literalmente `15`. Um `expect(argumentos[argumentos.indexOf('--tail') + 1]).toBe('15')` fecha sem custo. Não bloqueia.

5. Para o `/retro`: o padrão dos dois vícios do documento tem agora um terceiro caso, e ele não é seu — o `7.5` é "asserção de negativa sobre texto que carrega dado não determinístico". Vale como item de revisão de teste: toda negativa sobre linha crua de log precisa dizer por que o valor escolhido não pode aparecer no carimbo.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-21 23:32:42 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (esteira e ambiente; `deploy` não é tocado)
Rate limit: ok (não toca limitador)
Fila e prioridade: ok (não toca fila)
Concorrência: protegida
Índice e paginação: ok (nenhuma query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhum alerta novo; o despejo não mede nada em produção)
Bloqueantes: nenhum
Recomendações:
1. Agrupar o despejo em `::group::`/`::endgroup::` (nada no repositório usa isso hoje): com 24,5 mil linhas entre a falha do vitest e a linha `✖ esteira`, o resumo do vermelho fica soterrado no job.
2. `--tail` não alcança a janela da falha nos cinco truncados, e isso limita o objetivo declarado (ver item 2 abaixo).
3. Quando existir compose de staging/produção, `logging` com rotação passa a ser necessidade operacional (json-file sem `max-size` enche disco de host). A mensagem do guarda deveria dizer "neste arquivo, que é local e de esteira", para a próxima pessoa não tratar a proibição como global.
4. `infra/scripts/carga.ts:304` e `infra/scripts/carga-login.ts:444` seguem sem `--timestamps` (registrado em `TODO.md:54-59`) — aceito como registro, não como pendência desta correção.

Respostas ao que você pediu, em ordem:

**1. Log público — o argumento se sustenta, e por mais motivos do que o que está escrito.** O repositório é público, confirmado (`gh repo view LitzGab/Educa.ia` → `"visibility":"PUBLIC"`, nome `Turmma.ai`). Não aceitei o argumento do documento; conferi, e ele está certo mas subespecificado. O que sustenta a publicação das 24,5 mil linhas:
- `.github/workflows/ci.yml:5` declara, e os quatro jobs confirmam, que nenhum passo recebe segredo do repositório. Todo valor de ambiente da esteira vem de `.env.example` e `infra/teste.env`, **os dois versionados** — `POSTGRES_SENHA=educa_local_sintetica`, `IDENTIDADE_CHAVE_ASSINATURA=educa_local_sintetica_assinatura_f0`, `STORAGE_CHAVE_SECRETA=...`. Um serviço que imprima a própria configuração no boot publica o que já está no repositório. O despejo **não pode** vazar segredo que já não seja público.
- O escopo está preso por teste, e isso é o que importa mais que a sinteticidade: `ARGUMENTOS_COMPOSE` fixa `--project-name educa-teste` e os dois `--env-file`, `scripts.test.ts` afirma isso para os três scripts, `compose.test.ts:53-58` afirma para todo passo de encerramento, e `compose.int.test.ts:31` exige que `infra/.env` não exista. Sem isso, "o dado da esteira é sintético" seria promessa; com isso, é invariante.
- Log nosso tem duas camadas: `guardas/log-sem-dado-pessoal` em `**/*.{js,mjs,...,tsx}` com `no-restricted-disable` em cima (não se desliga por comentário, e `tools/guardas/lint.ts` ignora comentário), mais o redact em tempo de execução (`packages/nucleo/src/log/logger.test.ts`). As duas exceções da lista são o teste do redact e `logger-do-nest.ts`, e nesta última a guarda de dado pessoal continua ligada.
- O único log de terceiro com dado de requisição é o do Caddy, e `infra/compose.yml:400` mostra que `admin 127.0.0.1:2019` só é alcançável pelo healthcheck do próprio contêiner: não existe tráfego de aluno naquele logger.

O que a correção acrescenta é volume, não exposição. Aprovado por isso, não por "é sintético".

**2. O piso medido em verde: não bloqueio, mas o 4.000 não fecha o objetivo, e o limite é maior do que está escrito.** Não exijo a contagem num vermelho: 4.000 domina 200 e 2.000 nos mesmos termos da sua tabela e não pode regredir nada. O que o documento registra como "pode estar subdimensionado" é, na verdade, uma consequência estrutural que o `--tail` não conserta: o tail é o **fim** da execução, e a suíte não tem `bail`, então um vermelho aos 5 min é seguido de 15 min de log. Com a sua medição, `borda` escreve ~32 linhas/s (38.787 / 20,2 min) — 4.000 linhas são ~2,1 min de janela; `postgres` ~42 linhas/s, ~95 s; `redis-fila` ~2,3 min. Ou seja, nos cinco truncados o despejo cobre os últimos dois minutos da execução, e não o instante do 503 — que é exatamente o que o documento diz querer cruzar, nos quatro vermelhos da borda. Não é bloqueante (o estado anterior cobria ~6 s), mas "medir num vermelho" não resolve: o que resolve é âncora no instante da falha (o que `achados-revisoes.md:409` pediu para dentro do teste) ou reduzir a taxa de escrita. Registre isso junto do limite atual.

**3. Separar o `admin.api`: concordo, com uma consequência de sequência que muda a ordem.** A mudança é no `infra/Caddyfile`, tem guardião diferente e não compartilha arquivo com esta correção — separar é certo. Mas ela não é "achado colateral": 34.102 das 38.787 linhas da borda são aquele ruído, então tirá-lo leva a borda a ~4.685 linhas, e só então `--tail 4000` passa a cobrer quase a execução inteira do serviço onde caíram quatro dos sete vermelhos. Ou seja, a correção do ruído entrega mais diagnóstico da borda do que o aumento do tail entregou. Faça-a em seguida e **remeça o tail depois dela**, não antes. Anoto também, para o `privacy-guardian` daquela rodada, que o logger `admin.api` só registra o healthcheck de loopback: o furo é do item 9 da regra 20 na forma (URI, `remote_ip`, `headers` no log padrão), sem dado pessoal por trás.

**4. O guarda dos 19 serviços é proporcional.** `infra/compose.yml:1` é "ambiente local completo", usado por desenvolvimento e esteira; não existe compose de staging ou produção ainda. Nesse arquivo, `logging` só tem dois usos plausíveis e os dois matam a evidência com exit 0 — e a sua medição de `driver: none` (zero linha, só warning) é o caso que nenhuma asserção de argv pegaria. O laço antes do inventário está na ordem certa. Duas observações: o guarda roda em `compose.int.test.ts`, projeto `integracao`, isto é, no portão de toda tarefa e não só em `test:infra` — é onde ele serve; e a proibição precisa da ressalva do item 3 das recomendações quando o compose de produção nascer.

**5. Regra 80 no resto: confirmado.** Nada de fila, migration, gateway de IA, prova, sessão ou estado em memória é tocado. `etapasDeEncerramento` preserva o comportamento anterior nos dois sítios, inclusive `--manter-ambiente` (`e2e.ts:22` passa `!manterAmbiente`), e `executar.ts:36-39` roda **todos** os passos de finalização sem parar no primeiro que falha e sem apagar o código original — então um despejo que falhe não deixa contêiner nem volume de pé no runner. O caminho de falha, que não tinha teste nenhum, passa a ter cinco casos em `compose.test.ts` (rodei: 5 verdes) mais a linha inteira do despejo em `scripts.test.ts` e a asserção de resultado em `compose.int.test.ts`; nenhum deles chama provedor pago.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/e2e.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/executar.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/scripts.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/compose.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/index.mjs`.
